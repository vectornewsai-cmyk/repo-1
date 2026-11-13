#!/usr/bin/env node
/**
 * test_round64_r2_fast_motion.js — Phase 9 đợt 64, luồng R2: detector
 * chuyển động nhanh + cảnh báo denoise ≥0,7 (đóng nợ đợt 63 R2 §8 mục 2).
 *
 * Đo THẬT bằng server/render/src/fastMotion.js (ffmpeg decode rawvideo
 * gray 160×90 ở 30fps + diff JS) trên 7 clip 720p 5s tự gen (texture
 * tổng hợp seed cố định + shaky P2 seed 7):
 *   static-clean / static-noisy (alls=15) / pan 6px/frame (chậm) /
 *   pan 24px/frame (nhanh — cùng tốc độ ghost đợt 61/63) /
 *   pan 48px/frame (rất nhanh) / shaky ±7px / shaky+noise.
 * Assert: phân loại đúng kỳ vọng (tĩnh/chậm → slow; nhanh/rung → fast),
 * ngưỡng FAST=6,0/MEDIUM=4,0 nằm giữa pan chậm (2,83) và pan nhanh
 * (9,19), score lặp lại xác định, chi phí đo có trần, và ngưỡng web
 * (fastMotion.ts) đồng bộ với server.
 * (ĐỢT 65 S2: quy tắc cảnh báo trong harness này đã đổi theo số đo footage
 * thật — cảnh báo ở ≥0,7 với mọi mức đo được, xem mục "Logic cảnh báo".
 * Ngưỡng phân loại FAST/MEDIUM giữ nguyên.)
 *
 * Đồng thời TÁI HIỆN bác bỏ chuẩn hoá tuyến tính theo gap frame: lấy
 * mẫu 5fps rồi chia 6 cho score SAI LỆCH LỚN so với 30fps (pan-fast24:
 * 3,80 so với 9,19; shaky: 1,31 so với 9,86) — vì |Δ| bão hoà, không
 * tăng tuyến tính theo gap. Do đó score chỉ có nghĩa ở 30fps cố định.
 *
 * Cách chạy: node server/render/src/test_round64_r2_fast_motion.js
 * (cần ffmpeg/ffprobe, python3 + PIL/numpy). Scratch mới dưới
 * ~/workspace/.scratch-r64r2m-XXXX. KHÔNG ghi gì vào repo.
 * Thời gian ~5–10 phút tùy tải VM.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  measureMotion,
  framePairDiff,
  classifyMotion,
  shouldWarnDenoiseGhosting,
  FAST_THRESHOLD,
  MEDIUM_THRESHOLD,
  DENOISE_WARN_STRENGTH,
  MEASURE_WIDTH,
  MEASURE_HEIGHT,
} = require("./fastMotion");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r64r2m-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..", ".."); // server/render/src → repo root
const RENDER = path.join(__dirname, "..");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return r;
}
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function probeOk(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height",
    "-show_entries", "format=duration", "-of", "json", mp4], { encoding: "utf8" });
  try {
    const j = JSON.parse(r.stdout || "{}");
    const s = (j.streams || [])[0] || {};
    return s.codec_name === "h264" && s.width === 1280 && s.height === 720
      && Math.abs(Number(j.format && j.format.duration) - 5) < 0.15;
  } catch { return false; }
}

console.log(`== Đợt 64 R2 — detector chuyển động nhanh + cảnh báo denoise (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);

// --- Chuẩn bị media ----------------------------------------------------------
console.log("\n== Chuẩn bị media (texture seed 64 + shaky P2 seed 7) ==");
const GEN_PY = `
import numpy as np
from PIL import Image
rng = np.random.default_rng(64)
W, H = 2200, 720
x = np.linspace(0, 1, W)[None, :]
y = np.linspace(0, 1, H)[:, None]
base = (90 + 90 * x + 40 * y)[:, :, None] * np.ones((1, 1, 3))
img = base.copy()
for _ in range(260):
    cx, cy = int(rng.integers(0, W)), int(rng.integers(0, H))
    r = int(rng.integers(6, 70))
    val = rng.uniform(-70, 70, size=3)
    yy, xx = np.ogrid[:H, :W]
    m = (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r
    img[m] += val
for _ in range(40):
    cx = int(rng.integers(0, W))
    wdt = int(rng.integers(2, 9))
    img[:, max(0, cx - wdt):cx + wdt, :] += rng.uniform(-45, 45)
img = np.clip(img, 0, 255).astype(np.uint8)
Image.fromarray(img).save("${path.join(work, "texture-wide.png")}")
print("texture ok")
`;
const genPy = path.join(work, "gen_texture.py");
writeFileEpermRetry(genPy, GEN_PY);
run("python3", [genPy], "tạo ảnh texture 2200x720 (seed 64)");
const tex = path.join(work, "texture-wide.png");
const enc = (vf, out) => run("ffmpeg", ["-v", "error", "-y", "-loop", "1", "-i", tex,
  "-vf", vf, "-t", "5", "-r", "30", "-c:v", "libx264", "-preset", "veryfast",
  "-crf", "18", "-an", out], `encode ${path.basename(out)}`);
enc("crop=1280:720:0:0,format=yuv420p", path.join(mediaDir, "static-clean.mp4"));
enc("crop=1280:720:0:0,noise=alls=15:allf=t,format=yuv420p", path.join(mediaDir, "static-noisy.mp4"));
enc("crop=1280:720:x='mod(6*n,920)':y=0,format=yuv420p", path.join(mediaDir, "pan-slow6.mp4"));
enc("crop=1280:720:x='mod(24*n,920)':y=0,format=yuv420p", path.join(mediaDir, "pan-fast24.mp4"));
enc("crop=1280:720:x='mod(48*n,920)':y=0,format=yuv420p", path.join(mediaDir, "pan-vfast48.mp4"));
run("python3", [path.join(RENDER, "test_p2_gen_shaky.py"), path.join(mediaDir, "shaky320.mp4")],
  "tạo shaky320.mp4 (gen P2, seed 7)");
run("ffmpeg", ["-v", "error", "-y", "-i", path.join(mediaDir, "shaky320.mp4"),
  "-vf", "scale=1280:720:flags=lanczos,format=yuv420p",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-an",
  path.join(mediaDir, "shaky720.mp4")], "upscale shaky → 720p");
run("ffmpeg", ["-v", "error", "-y", "-i", path.join(mediaDir, "shaky720.mp4"),
  "-vf", "noise=alls=15:allf=t,format=yuv420p",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-an",
  path.join(mediaDir, "shakynoisy720.mp4")], "shaky+noise → shakynoisy720");
for (const f of ["static-clean", "static-noisy", "pan-slow6", "pan-fast24", "pan-vfast48", "shaky720", "shakynoisy720"]) {
  ok(probeOk(path.join(mediaDir, `${f}.mp4`)), `${f}.mp4 tạo xong (h264, 1280x720, 5s)`);
}

// --- Đo + phân loại -----------------------------------------------------------
console.log("\n== Đo chuyển động (30fps cố định) ==");
const results = {};
function measure(label) {
  const r = measureMotion(path.join(mediaDir, `${label}.mp4`));
  results[label] = r;
  console.log(`   📊 ${label}: score=${r.score} level=${r.level} mean=${r.meanAbsDiff} ` +
    `median=${r.medianAbsDiff} p90=${r.p90AbsDiff} smallBand=${r.smallBandShare} ` +
    `nPairs=${r.nPairs} cost=${r.costMs}ms (${r.msPerClipSec}ms/giây clip)`);
  return r;
}
const sc = measure("static-clean");
const sn = measure("static-noisy");
const ps = measure("pan-slow6");
const pf = measure("pan-fast24");
const pv = measure("pan-vfast48");
const sh = measure("shaky720");
const shn = measure("shakynoisy720");

console.log("\n== Assert phân loại ==");
ok(sc.level === "slow" && sc.score < 0.1, `static-clean → slow (score ${sc.score} < 0,1)`);
ok(sn.level === "slow" && sn.score < 1.0,
  `static-noisy → slow (score ${sn.score} < 1,0 — mờ nhẹ triệt nhiễu hạt, không báo oan clip tĩnh nhiễu)`);
ok(ps.level === "slow" && ps.score > sn.score,
  `pan chậm 6px/frame → slow (score ${ps.score}, cao hơn tĩnh-nhiễu ${sn.score})`);
ok(pf.level === "fast" && pf.score > 6.0, `pan nhanh 24px/frame → fast (score ${pf.score} > 6,0)`);
ok(pv.level === "fast" && pv.score > pf.score,
  `pan rất nhanh 48px/frame → fast và cao hơn pan nhanh (${pv.score} > ${pf.score})`);
ok(sh.level === "fast", `shaky tremor ±7px → fast (score ${sh.score})`);
ok(shn.level === "fast", `shaky+noise → fast (score ${shn.score})`);
ok(ps.score < MEDIUM_THRESHOLD && pf.score > FAST_THRESHOLD,
  `ngưỡng nằm giữa pan chậm và pan nhanh (${ps.score} < ${MEDIUM_THRESHOLD}/${FAST_THRESHOLD} < ${pf.score})`);
ok(sc.smallBandShare < 0.01 && sn.smallBandShare < 0.01,
  `clip tĩnh: dải small ~0 (${sc.smallBandShare}/${sn.smallBandShare}) — không có gì để ghost`);
ok(ps.smallBandShare > 0.2,
  `pan chậm: dải small cao (${ps.smallBandShare}) — đúng vùng nhạy ghost của đợt 63 R2 §3.2`);

// --- Tính lặp lại (xác định) --------------------------------------------------
console.log("\n== Tính lặp lại ==");
const pf2 = measureMotion(path.join(mediaDir, "pan-fast24.mp4"));
ok(Math.abs(pf2.score - pf.score) < 0.001,
  `đo lại pan-fast24 cho score giống hệt (${pf.score} → ${pf2.score}, pipeline xác định)`);

// --- Chi phí: wall median 3 lần + phân rã CPU (bash time) ------------------
// Wall dưới tải VM dao động mạnh (bài học đợt 61/63) nên chỉ assert trần
// rộng; số CPU mới là chi phí thật (decode clip nhiễu nặng đắt hơn clip
// sạch ~25× CPU vì entropy cao — file 36,7MB/5s so với 0,1MB).
console.log("\n== Chi phí đo (wall median 3 lần, kèm loadavg) ==");
function costMedian(label) {
  const xs = [];
  for (let i = 0; i < 3; i++) {
    const r = measureMotion(path.join(mediaDir, `${label}.mp4`));
    xs.push(r.msPerClipSec);
  }
  const m = median(xs);
  console.log(`   📊 ${label}: ms/giây clip 3 lần: ${xs.join(" / ")} → median ${m} (loadavg ${loadAvg()})`);
  return m;
}
const costClean = costMedian("pan-fast24");
const costNoisy = costMedian("shakynoisy720");
ok(costClean < 15000,
  `chi phí wall clip sạch < 15s/giây clip (median ${costClean}ms — trần rộng vì wall nhiễm tải, xem LIMITS §2.5)`);
ok(costNoisy < 60000,
  `chi phí wall clip nhiễu nặng < 60s/giây clip (median ${costNoisy}ms — file 42,9MB/5s, xem LIMITS §2.5)`);

console.log("\n== Phân rã CPU (bash time -p, decode-only 5s) ==");
function decodeCpuSec(label) {
  const r = spawnSync("bash", ["-c",
    `time -p ffmpeg -v error -i ${path.join(mediaDir, `${label}.mp4`)} -f null -`],
    { encoding: "utf8" });
  const out = (r.stderr || "") + (r.stdout || "");
  const user = /user ([0-9.]+)/.exec(out);
  const sys = /sys ([0-9.]+)/.exec(out);
  const real = /real ([0-9.]+)/.exec(out);
  if (!user || !sys) throw new Error(`không parse được time -p cho ${label}: ${out.slice(-300)}`);
  const cpu = Number(user[1]) + Number(sys[1]);
  console.log(`   📊 ${label}: decode-only real=${real ? real[1] : "?"}s CPU=${cpu.toFixed(2)}s (loadavg ${loadAvg()})`);
  return cpu;
}
const cpuClean = decodeCpuSec("pan-fast24");
const cpuNoisy = decodeCpuSec("static-noisy");
ok(cpuClean < 1.0, `decode CPU clip sạch < 1s/5s clip (${cpuClean.toFixed(2)}s — filter+diff không đáng kể)`);
ok(cpuNoisy < 10.0, `decode CPU clip nhiễu nặng < 10s/5s clip (${cpuNoisy.toFixed(2)}s)`);
ok(cpuNoisy > cpuClean * 5,
  `decode clip nhiễu đắt CPU hơn clip sạch >5× (${cpuNoisy.toFixed(2)}s vs ${cpuClean.toFixed(2)}s — entropy cao, không phải lỗi đo)`);

// --- Bác bỏ chuẩn hoá tuyến tính theo gap ------------------------------------
console.log("\n== Bác bỏ chuẩn hoá tuyến tính (lấy mẫu 5fps rồi chia 6) ==");
function measureAtFps(label, fps) {
  const vf = `fps=${fps},scale=${MEASURE_WIDTH}:${MEASURE_HEIGHT},format=gray,gblur=sigma=1`;
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", path.join(mediaDir, `${label}.mp4`),
    "-vf", vf, "-f", "rawvideo", "-pix_fmt", "gray", "-"], { maxBuffer: 512 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg fps=${fps} lỗi cho ${label}`);
  const fb = MEASURE_WIDTH * MEASURE_HEIGHT;
  const buf = r.stdout;
  const n = Math.floor(buf.length / fb);
  const diffs = [];
  let prev = null;
  for (let i = 0; i < n; i++) {
    const fr = buf.subarray(i * fb, (i + 1) * fb);
    if (prev) diffs.push(framePairDiff(prev, fr).meanAbsDiff);
    prev = fr;
  }
  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}
for (const [label, ref] of [["pan-fast24", pf], ["shaky720", sh]]) {
  const raw5 = measureAtFps(label, 5);
  const norm5 = raw5 / (30 / 5);
  const dev = Math.abs(norm5 - ref.score) / ref.score * 100;
  console.log(`   📊 ${label}: 30fps score=${ref.score} | 5fps raw=${raw5.toFixed(3)} → chuẩn hoá /6 = ${norm5.toFixed(3)} (lệch ${dev.toFixed(1)}%)`);
  ok(dev > 40, `${label}: chuẩn hoá tuyến tính SAI LỆCH ${dev.toFixed(1)}% > 40% — bác bỏ (score chỉ có nghĩa ở 30fps)`);
}

// --- Đồng bộ ngưỡng web ↔ server ----------------------------------------------
console.log("\n== Đồng bộ ngưỡng web (fastMotion.ts) ↔ server ==");
const webPath = path.join(ROOT, "apps", "web", "src", "components", "enhance", "fastMotion.ts");
const webSrc = fs.readFileSync(webPath, "utf8");
function webConst(name) {
  const m = new RegExp(`${name}\\s*=\\s*([\\d.]+)`).exec(webSrc);
  if (!m) throw new Error(`không tìm thấy ${name} trong fastMotion.ts`);
  return Number(m[1]);
}
const wFast = webConst("FAST_MOTION_FAST_THRESHOLD");
const wMed = webConst("FAST_MOTION_MEDIUM_THRESHOLD");
const wWarn = webConst("DENOISE_WARN_STRENGTH");
const wW = Number(/FAST_MOTION_WIDTH\s*=\s*(\d+)/.exec(webSrc)[1]);
const wH = Number(/FAST_MOTION_HEIGHT\s*=\s*(\d+)/.exec(webSrc)[1]);
console.log(`   📊 web: FAST=${wFast} MEDIUM=${wMed} WARN=${wWarn} khổ=${wW}x${wH} | server: FAST=${FAST_THRESHOLD} MEDIUM=${MEDIUM_THRESHOLD} WARN=${DENOISE_WARN_STRENGTH} khổ=${MEASURE_WIDTH}x${MEASURE_HEIGHT}`);
ok(wFast === FAST_THRESHOLD, `ngưỡng FAST đồng bộ web↔server (${wFast})`);
ok(wMed === MEDIUM_THRESHOLD, `ngưỡng MEDIUM đồng bộ web↔server (${wMed})`);
ok(wWarn === DENOISE_WARN_STRENGTH, `ngưỡng cảnh báo denoise đồng bộ (${wWarn})`);
ok(wW === MEASURE_WIDTH && wH === MEASURE_HEIGHT, `khổ đo đồng bộ (${wW}x${wH})`);

// --- Logic cảnh báo trên số đo thật -------------------------------------------
// QUY TẮC ĐỔI Ở ĐỢT 65 S2 (xem docs/PHASE9_ROUND65_S2_LIMITS.md): cảnh báo ở
// ≥0,7 với MỌI mức đo được — R4 + S2 chứng minh clip chậm/vừa vẫn ghost như
// clip nhanh trên footage thật (nhảy b_small 0,5→0,7 +0,057–0,083 ở
// 0,6–13,6 px/f). Cổng cũ (chỉ fast) bỏ sót 4/6 clip thật ghost-positive.
// Hành vi cũ còn giữ trong harness đợt 65 S2 (shouldWarnDenoiseGhostingOld)
// để tính bảng FP/FN đối chứng — không dùng trong production nữa.
console.log("\n== Logic cảnh báo trên số đo thật ==");
ok(shouldWarnDenoiseGhosting(0.8, pf.level) === true, "denoise 0,8 + pan nhanh → cảnh báo");
ok(shouldWarnDenoiseGhosting(0.8, ps.level) === true, "denoise 0,8 + pan chậm → CẢNH BÁO (MỚI đợt 65 S2: clip chậm vẫn ghost trên footage thật)");
ok(shouldWarnDenoiseGhosting(0.8, sc.level) === true, "denoise 0,8 + clip tĩnh tổng hợp → cảnh báo (MỚI; xem LIMITS đợt 65 S2 §5 về false positive trên nội dung tĩnh tuyệt đối)");
ok(shouldWarnDenoiseGhosting(0.5, pf.level) === false, "denoise 0,5 + pan nhanh → không cảnh báo (dưới ngưỡng 0,7)");
ok(shouldWarnDenoiseGhosting(0.8, "unknown") === false, "denoise 0,8 + unknown → KHÔNG cảnh báo cụ thể (caller hiện cảnh báo chung riêng)");
ok(classifyMotion(pf.score) === "fast" && classifyMotion(ps.score) === "slow",
  "classifyMotion server khớp kết quả đo");

// --- Lỗi đầu vào ----------------------------------------------------------------
console.log("\n== Lỗi đầu vào ==");
let threw = false;
try { measureMotion(path.join(mediaDir, "khong-co.mp4")); } catch { threw = true; }
ok(threw, "file không tồn tại → throw (không trả score giả)");

const summary = {
  work,
  thresholds: { MEDIUM_THRESHOLD, FAST_THRESHOLD, DENOISE_WARN_STRENGTH },
  scores: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { score: v.score, level: v.level, smallBandShare: v.smallBandShare }])),
  costMsPerClipSecMedian: { panFast24: costClean, shakyNoisy: costNoisy },
  decodeCpuSecPer5sClip: { panFast24: +cpuClean.toFixed(2), staticNoisy: +cpuNoisy.toFixed(2) },
  loadAvgEnd: loadAvg(),
};
console.log(`\n== test_round64_r2_fast_motion: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify(summary, null, 1));
if (fail > 0) process.exit(1);
