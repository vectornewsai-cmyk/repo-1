#!/usr/bin/env node
/**
 * test_round61_r2_enhance_cost_supplement.js — Phase 9 đợt 61, luồng R2:
 * bổ sung cho test_round61_r2_enhance_cost.js (lượt 1), sau khi lượt 1 cho
 * thấy 2 điểm cần đo lại bằng phương pháp nhạy/khử nhiễu tải hơn:
 *
 *   (a2) TÁCH CHI PHÍ bằng probe to-null + median 3 lần, xen kẽ round-robin
 *        (lượt 1: phép trừ transform-only − baseline encode ra số ÂM ở cả
 *        2 độ phân giải vì tải VM dao động 0.6–22.7 giữa các lần đo; x264
 *        encode là phần biến thiên mạnh nhất). Probe to-null bỏ encode khỏi
 *        phép trừ: decode-only (chuẩn), transform-to-null (decode +
 *        vidstabtransform), detect-to-null (đúng runStabilizeDetect của VCut).
 *        transform thuần = median(transform) − median(decode);
 *        detect thuần = median(detect) − median(decode). Thêm baseline
 *        encode MP4 (2 lần) + full render balanced (1 lần) trong cùng phiên
 *        để kiểm tổng: detect + transform + encode ≈ full.
 *   (c2) GHOSTING trên vật thể GRADIENT MỀM (lượt 1 (c): cạnh cứng trắng/
 *        đen 0→255 cho trail = 0 ở mọi mức 0.3/0.5/0.7 — hqdn3d temporal chỉ
 *        blend sai khác nhỏ dưới ngưỡng nên cạnh cứng không bao giờ ghost;
 *        ca đó không nhạy). Nguồn mới: khối gradient 80→176 (400×300px)
 *        chạy 24px/frame trên nền xám 128 — sai khác liên-frame ~5.8 mức,
 *        dưới ngưỡng temporal ở mọi mức nên blend xảy ra thật; đo trail /
 *        leading / static như (c).
 *
 * Tái dùng media + .trf của lượt 1 (WORK lượt 1, xem log r61r2-run1.log).
 * Cách chạy: node server/render/src/test_round61_r2_enhance_cost_supplement.js
 * (cần ffmpeg, ffprobe, python3 + PIL/numpy). Scratch mới dưới
 * ~/workspace/.scratch-r61r2s-XXXX. KHÔNG ghi gì vào repo. Thời gian ~12 phút.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const { spawnSync } = require("child_process");

const RUN1 = "/home/hatch/workspace/.scratch-r61r2-PcfTgb";
const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r61r2s-"));
const mediaDir = path.join(RUN1, "media");
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const { runStabilizeDetect } = require("./enhance");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label, cwd) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], cwd });
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
const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r61r2s", width: W, height: H, fps: fps || 30 },
  tracks,
});
function render(spec, name) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  const secs = (Date.now() - t0) / 1000;
  return { status: r.status, stdout: (r.stdout || "").toString(), stderr: (r.stderr || "").toString(), outPath, secs, fps: 150 / secs };
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function probeVideo(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height",
    "-show_entries", "format=duration", "-of", "json", mp4], { encoding: "utf8" });
  const j = JSON.parse(r.stdout || "{}");
  return {
    codec: j.streams && j.streams[0] && j.streams[0].codec_name,
    width: j.streams && j.streams[0] && j.streams[0].width,
    height: j.streams && j.streams[0] && j.streams[0].height,
    duration: Number(j.format && j.format.duration),
  };
}
function probeOk(mp4, W, H) {
  const p = probeVideo(mp4);
  return p.codec === "h264" && p.width === W && p.height === H && Math.abs(p.duration - 5) < 0.15;
}
function extractFrames(mp4, dir, vf) {
  fs.mkdirSync(dir, { recursive: true });
  run("ffmpeg", ["-i", mp4, "-vf", vf, "-vsync", "0", path.join(dir, "f%04d.png")], `tách frame ${path.basename(mp4)}`);
}

console.log(`== Bổ sung R61 R2 (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work} (tái dùng media lượt 1: ${RUN1})`);
ok(fs.existsSync(path.join(mediaDir, "shakynoisy720.mp4")) && fs.existsSync(path.join(mediaDir, "shakynoisy1080.mp4")),
  "media lượt 1 còn nguyên (shakynoisy 720p + 1080p)");
ok(fs.existsSync(path.join(RUN1, "stab-720.trf")) && fs.existsSync(path.join(RUN1, "stab-1080.trf")),
  ".trf lượt 1 còn nguyên (tái dùng cho probe transform)");

// === (a2) Probe to-null, median 3 lần, xen kẽ round-robin ====================
console.log("\n== (a2) Tách chi phí bằng probe to-null (median 3 lần, round-robin) ==");
const BALANCED = { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } };
const summaryA2 = {};
for (const [suffix, W, H] of [["720", 1280, 720], ["1080", 1920, 1080]]) {
  console.log(`-- ${suffix} (${W}x${H}), loadavg ${loadAvg()} --`);
  const src = path.join(mediaDir, `shakynoisy${suffix}.mp4`);
  const trf = path.join(RUN1, `stab-${suffix}.trf`);
  const clip = { in: 0, duration: 5, speed: 1, enhance: { stabilize: { smoothing: 10 } } };
  const probes = { decode: [], transform: [], detect: [] };
  const timedProbe = (label, fn) => {
    const t0 = Date.now();
    fn();
    const secs = (Date.now() - t0) / 1000;
    console.log(`   📊 ${label}: ${secs.toFixed(2)}s wall → ${(150 / secs).toFixed(2)} fps (loadavg ${loadAvg()})`);
    return secs;
  };
  for (let round = 1; round <= 3; round++) {
    probes.decode.push(timedProbe(`decode-only ${suffix} vòng ${round}`, () =>
      run("ffmpeg", ["-i", src, "-vf", "trim=start=0:end=5,setpts=PTS-STARTPTS",
        "-an", "-f", "null", "-"], `decode ${suffix} v${round}`)));
    probes.transform.push(timedProbe(`transform-to-null ${suffix} vòng ${round}`, () =>
      run("ffmpeg", ["-i", src,
        "-vf", `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss`,
        "-an", "-f", "null", "-"], `transform ${suffix} v${round}`)));
    probes.detect.push(timedProbe(`detect-to-null ${suffix} vòng ${round}`, () => {
      const r = runStabilizeDetect("ffmpeg", src, clip, path.join(work, `det-${suffix}-v${round}.trf`));
      if (!r.ok) throw new Error(`vidstabdetect lỗi: ${r.error}`);
    }));
  }
  const mDec = median(probes.decode), mTr = median(probes.transform), mDet = median(probes.detect);
  const trPure = mTr - mDec, detPure = mDet - mDec;
  // Baseline encode MP4 (2 lần) + full render balanced (1 lần) trong phiên.
  const encWalls = [];
  for (let i = 1; i <= 2; i++) {
    const outP = path.join(work, `baseline-enc-${suffix}-r${i}.mp4`);
    const t0 = Date.now();
    run("ffmpeg", ["-i", src, "-vf", "trim=start=0:end=5,setpts=PTS-STARTPTS",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
      "-an", "-y", outP], `baseline encode ${suffix} #${i}`);
    const secs = (Date.now() - t0) / 1000;
    console.log(`   📊 baseline encode ${suffix} #${i}: ${secs.toFixed(2)}s wall → ${(150 / secs).toFixed(2)} fps (loadavg ${loadAvg()})`);
    encWalls.push(secs);
    ok(outOk(outP) && probeOk(outP, W, H), `${suffix} baseline encode #${i}: MP4 h264 đúng res/thời lượng`);
  }
  const mEnc = median(encWalls);
  const encPure = mEnc - mDec;
  const spec = specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", `shakynoisy${suffix}.mp4`, 5, { enhance: BALANCED })] }], W, H);
  const rf = render(spec, `full-balanced-${suffix}`);
  console.log(`   📊 full render (balanced) ${suffix}: ${rf.secs.toFixed(2)}s wall → ${rf.fps.toFixed(2)} fps (loadavg ${loadAvg()})`);
  ok(rf.status === 0 && outOk(rf.outPath) && probeOk(rf.outPath, W, H), `${suffix} full balanced: render thật OK`);
  // Render chính decode LẠI input (ngoài lần decode trong pass detect) nên
  // tổng phải cộng cả decode chính: detect + decode + transform thuần +
  // encode thuần. Phần còn lại = denoise + khởi động node + graph.
  const sumParts = mDet + mDec + trPure + encPure; // detect (gồm decode) + decode chính + transform thuần + encode thuần
  summaryA2[suffix] = {
    decodeMedian: +mDec.toFixed(2), decodeFps: +(150 / mDec).toFixed(2),
    transformMedian: +mTr.toFixed(2), transformFps: +(150 / mTr).toFixed(2),
    transformPureMedian: +trPure.toFixed(2), transformPureFps: +(150 / trPure).toFixed(2),
    detectMedian: +mDet.toFixed(2), detectFps: +(150 / mDet).toFixed(2),
    detectPureMedian: +detPure.toFixed(2), detectPureFps: +(150 / detPure).toFixed(2),
    baselineEncodeMedian: +mEnc.toFixed(2), encodePureMedian: +encPure.toFixed(2),
    fullWall: +rf.secs.toFixed(2), fullFps: +rf.fps.toFixed(2),
    detectShareOfFullPct: +(mDet / rf.secs * 100).toFixed(1),
    transformPureShareOfFullPct: +(trPure / rf.secs * 100).toFixed(1),
    encodePureShareOfFullPct: +(encPure / rf.secs * 100).toFixed(1),
    sumPartsVsFullPct: +(sumParts / rf.secs * 100).toFixed(1),
  };
  console.log(`   📊 ${suffix} TỔNG HỢP (median 3): decode ${mDec.toFixed(2)}s | transform-to-null ${mTr.toFixed(2)}s → transform thuần ${trPure.toFixed(2)}s (${(150 / trPure).toFixed(2)} fps, ${(trPure / rf.secs * 100).toFixed(1)}% full) | ` +
    `detect ${mDet.toFixed(2)}s → detect thuần ${detPure.toFixed(2)}s (${(150 / detPure).toFixed(2)} fps, ${(mDet / rf.secs * 100).toFixed(1)}% full tính cả decode) | ` +
    `encode thuần ${encPure.toFixed(2)}s (${(encPure / rf.secs * 100).toFixed(1)}% full) | full ${rf.secs.toFixed(2)}s | tổng detect+transform thuần+encode thuần = ${(sumParts / rf.secs * 100).toFixed(1)}% full`);
  ok(trPure > 0, `${suffix}: transform thuần > 0 (median trừ median không âm)`);
  ok(detPure > 0, `${suffix}: detect thuần > 0`);
}

// === (c2) Ghosting trên khối gradient mềm ======================================
console.log("\n== (c2) Ghosting denoise trên khối gradient mềm (720p) ==");
const GEN_SOFT_PY = `
import numpy as np
from PIL import Image
import os, sys
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
W, H = 1280, 720
BW, BH, Y0, STEP, SPAN = 400, 300, 210, 24, 880
grad = np.linspace(80, 176, BW, dtype=np.float64)
for t in range(150):
    x = (t * STEP) % SPAN
    img = np.full((H, W), 128, dtype=np.float64)
    img[Y0:Y0 + BH, x:x + BW] = grad[None, :]
    Image.fromarray(np.round(img).astype(np.uint8), mode="L").convert("RGB").save(os.path.join(out, f"f{t:04d}.png"))
print("done 150")
`;
const softDir = path.join(work, "softframes");
run("python3", ["-c", GEN_SOFT_PY, softDir], "gen frame khối gradient mềm");
run("ffmpeg", ["-framerate", "30", "-i", path.join(softDir, "f%04d.png"),
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "softmove720.mp4")], "encode softmove720.mp4");
{
  // Lưu ý: mediaDir là thư mục lượt 1 (chỉ đọc kết quả, file mp4 mới này là
  // vật liệu đo — không đưa vào batch, scratch sẽ xóa sau khi đo xong).
  const p = probeVideo(path.join(mediaDir, "softmove720.mp4"));
  ok(p.codec === "h264" && p.width === 1280 && p.height === 720 && Math.abs(p.duration - 5) < 0.15,
    "softmove720.mp4 tạo xong (khối gradient 80→176, 400×300, 24px/frame, 5s)");
}
const GHOST_SOFT_PY = `
import sys, glob, numpy as np
from PIL import Image
origDir, rendDir = sys.argv[1], sys.argv[2]
BW, BH, Y0, STEP, SPAN = 400, 300, 210, 24, 880
of = sorted(glob.glob(origDir + "/f*.png"))
rf = sorted(glob.glob(rendDir + "/f*.png"))
assert len(of) == len(rf) == 150, f"frame count {len(of)} vs {len(rf)}"
trail, lead, stat = [], [], []
for t in range(1, 150):
    x_prev = ((t - 1) * STEP) % SPAN
    x = (t * STEP) % SPAN
    if x != x_prev + STEP:
        continue  # frame wrap: bỏ qua
    o = np.asarray(Image.open(of[t]).convert("L"), dtype=np.int16)
    r = np.asarray(Image.open(rf[t]).convert("L"), dtype=np.int16)
    d = np.abs(r - o)
    trail.append(float(d[Y0:Y0 + BH, x_prev:x_prev + STEP].mean()))
    lead.append(float(d[Y0:Y0 + BH, x + BW - STEP:x + BW].mean()))
    mask = np.ones(d.shape, dtype=bool)
    mask[Y0:Y0 + BH, x_prev:x + BW] = False  # trừ khối t-1 + khối t
    stat.append(float(d[mask].mean()))
for name, v in [("trail", trail), ("lead", lead), ("static", stat)]:
    a = np.array(v)
    print(f"{name} n={len(a)} mean={a.mean():.4f} median={np.median(a):.4f} p90={np.percentile(a, 90):.4f} max={a.max():.4f}")
`;
const ghostSoftPy = path.join(work, "ghost_soft.py");
writeFileEpermRetry(ghostSoftPy, GHOST_SOFT_PY);
function ghostSoftOf(origDir, rendDir) {
  const r = spawnSync("python3", [ghostSoftPy, origDir, rendDir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ghost_soft.py lỗi: ${r.stdout} ${r.stderr}`);
  const out = {};
  for (const m of (r.stdout || "").matchAll(/(\w+) n=(\d+) mean=([\d.]+) median=([\d.]+) p90=([\d.]+) max=([\d.]+)/g)) {
    out[m[1]] = { n: Number(m[2]), mean: Number(m[3]), median: Number(m[4]), p90: Number(m[5]), max: Number(m[6]) };
  }
  if (!out.trail || !out.lead || !out.static) throw new Error(`không parse được ghost soft: ${r.stdout} ${r.stderr}`);
  return out;
}
const origSoftDir = path.join(work, "frames-soft-orig");
extractFrames(path.join(mediaDir, "softmove720.mp4"), origSoftDir, "format=gray");
const specD = (s) => specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "softmove720.mp4", 5, { enhance: { denoise: { strength: s } } })] }], 1280, 720);
const ghostsSoft = {};
for (const s of [0.3, 0.5, 0.7]) {
  const r = render(specD(s), `denoise-soft-${String(s).replace(".", "_")}`);
  ok(r.status === 0 && outOk(r.outPath) && probeOk(r.outPath, 1280, 720),
    `denoise ${s} trên softmove: render OK (${r.secs.toFixed(1)}s, ${r.fps.toFixed(2)} fps)`);
  const dir = path.join(work, `frames-soft-denoise-${String(s).replace(".", "_")}`);
  extractFrames(r.outPath, dir, "format=gray");
  const g = ghostSoftOf(origSoftDir, dir);
  console.log(`   📊 denoise ${s} (gradient mềm): trail mean=${g.trail.mean} median=${g.trail.median} p90=${g.trail.p90} max=${g.trail.max} | ` +
    `leading mean=${g.lead.mean} | static mean=${g.static.mean} (n=${g.trail.n} frame)`);
  ghostsSoft[String(s)] = g;
}
console.log(`   📊 (c2) trail theo strength: 0.3=${ghostsSoft["0.3"].trail.mean} → 0.5=${ghostsSoft["0.5"].trail.mean} → 0.7=${ghostsSoft["0.7"].trail.mean}`);
ok(ghostsSoft["0.7"].trail.mean > ghostsSoft["0.3"].trail.mean,
  `ghost trail (gradient mềm) tăng theo strength (0.3: ${ghostsSoft["0.3"].trail.mean} → 0.7: ${ghostsSoft["0.7"].trail.mean})`);
ok(ghostsSoft["0.3"].static.mean < 1,
  `vùng tĩnh sau denoise 0.3 gần như không đổi (static mean ${ghostsSoft["0.3"].static.mean} < 1)`);

console.log(`\n== test_round61_r2_supplement: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify({ a2: summaryA2, c2: Object.fromEntries(Object.entries(ghostsSoft).map(([k, g]) => [k, {
  trailMean: g.trail.mean, trailMedian: g.trail.median, trailP90: g.trail.p90, trailMax: g.trail.max,
  leadMean: g.lead.mean, staticMean: g.static.mean,
}])) }, null, 1));
if (fail > 0) process.exit(1);
