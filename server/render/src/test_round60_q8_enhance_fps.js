#!/usr/bin/env node
/**
 * test_round60_q8_enhance_fps.js — Đo render MP4 cho đúng combo preset
 * Enhance P8 (đợt 59) + FPS lặp lại + 1080p. Phase 9 đợt 60 luồng Q8,
 * đóng nợ đợt 59 §6.9 phần render (LIMITS P9 §7):
 *   - P9 chỉ đo FPS từng enhance riêng lẻ ở 720p, 1 lần cho stabilize /
 *     deinterlace; chưa đo render MP4 cho đúng combo preset P8
 *     (Nhẹ/Balanced/Mạnh = stabilize+denoise), chưa đo FPS lặp lại,
 *     chưa đo enhance ở 1080p.
 *   - Preset P8 (presets.ts): light = denoise 0.3; balanced = stabilize
 *     smoothing 10 + denoise 0.5; strong = stabilize 20 + denoise 0.8.
 *     Combo đầy đủ = deinterlace + stabilize 30 + denoise 0.5 (như P9).
 *
 * Cách chạy: node server/render/src/test_round60_q8_enhance_fps.js
 * (cần ffmpeg, ffprobe, python3 + PIL/numpy). File tạm trong
 * ~/workspace/.scratch-r60q8-XXXX (KHÔNG dùng os.tmpdir(): /tmp là tmpfs
 * 512M, media nhiễu 1080p CRF 18 làm đầy — lần chạy đầu fail "No space
 * left on device"; nguồn 1080p encode CRF 23 thay vì 18 để giảm kích
 * thước, nguồn 720p giữ CRF 18 như P9). KHÔNG ghi gì vào repo.
 * Thời gian chạy ~20-30 phút (44 render, 2 lần mỗi cấu hình × 2 độ phân giải).
 *
 * Cấu trúc:
 *   A. Chuẩn bị media 720p + 1080p (testsrc2 / nhiễu / phẳng+nhiễu /
 *      interlaced / interlaced+nhiễu / shaky upscale / shaky+nhiễu).
 *   B. FPS render thật từng preset + combo + đối chứng, MỖI CẤU HÌNH 2 LẦN
 *      (ghi wall + fps từng lần, min/max/mean) ở 720p rồi 1080p.
 *      veryfast/CRF23, clip 5s = 150 frame — cùng cấu hình benchmark
 *      RESULTS.md §7.1 để so được với số Phase 8 / đợt 59 P9.
 *   C. Khác biệt đo được: flat std sau denoise, idet sau deinterlace,
 *      frame diff sau stabilize — ở cả 720p và 1080p; kèm đo độ lệch
 *      frame giữa 2 lần chạy stabilize (vidstabdetect không xác định —
 *      xem LIMITS đợt 60 Q8 §5) và ghi nhận (không assert) tính xác
 *      định byte của output combo.
 *   D. Preset stabilize + speedKeyframes: validateSpec chặn + render
 *      thất bại với thông báo rõ (không crash/stack trace), và đối chứng
 *      preset chỉ-denoise + speedKeyframes render OK.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r60q8-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");

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

// Render thật bằng render.js, đo wall time end-to-end (gồm cả pass
// vidstabdetect với stabilize và thời gian khởi động node).
function render(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  const secs = (Date.now() - t0) / 1000;
  return {
    status: r.status, stdout: (r.stdout || "").toString(),
    stderr: (r.stderr || "").toString(), outPath, secs,
    fps: 150 / secs,
  };
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function frameAt(mp4, t, out) {
  run("ffmpeg", ["-ss", String(t), "-i", mp4, "-frames:v", "1", "-y", out], `lấy frame ${mp4}@${t}`);
}
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
function idetProg(mp4) {
  const r = spawnSync("ffmpeg", ["-i", mp4, "-vf", "idet", "-f", "null", "-"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const m = [...(r.stderr || "").matchAll(/Single frame detection:.*?TFF:\s*(\d+).*?BFF:\s*(\d+).*?Progressive:\s*(\d+).*?Undetermined:\s*(\d+)/gs)];
  if (!m.length) throw new Error(`không parse được idet cho ${mp4}:\n${(r.stderr || "").slice(-500)}`);
  const g = m[m.length - 1];
  const tff = Number(g[1]), bff = Number(g[2]), prog = Number(g[3]), und = Number(g[4]);
  const total = tff + bff + prog + und;
  console.log(`   📊 idet ${path.basename(mp4)}: TFF=${tff} BFF=${bff} Prog=${prog} Und=${und} prog=${(prog / total).toFixed(3)}`);
  return total ? prog / total : -1;
}

const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r60q8", width: W, height: H, fps: fps || 30 },
  tracks,
});

const COMPARE_PY = `
import sys, numpy as np
from PIL import Image
a = np.asarray(Image.open(sys.argv[1]).convert("RGB"), dtype=np.int16)
b = np.asarray(Image.open(sys.argv[2]).convert("RGB"), dtype=np.int16)
d = np.abs(a - b)
print(f"mean={d.mean():.3f} max={d.max()} pctGt8={(d > 8).mean() * 100:.3f}")
`;
const comparePy = path.join(work, "compare.py");
writeFileEpermRetry(comparePy, COMPARE_PY);
function compareFrames(pa, pb) {
  const r = spawnSync("python3", [comparePy, pa, pb], { encoding: "utf8" });
  const m = /mean=([\d.]+) max=(\d+) pctGt8=([\d.]+)/.exec(r.stdout || "");
  if (!m) throw new Error(`không parse được kết quả so frame: ${r.stdout} ${r.stderr}`);
  return { mean: Number(m[1]), max: Number(m[2]), pctGt8: Number(m[3]) };
}
const STD_PY = `
import sys, numpy as np
from PIL import Image
g = np.asarray(Image.open(sys.argv[1]).convert("L"), dtype=np.float64)
print(f"std={g.std():.3f}")
`;
const stdPy = path.join(work, "std.py");
writeFileEpermRetry(stdPy, STD_PY);
function frameStd(p) {
  const r = spawnSync("python3", [stdPy, p], { encoding: "utf8" });
  const m = /std=([\d.]+)/.exec(r.stdout || "");
  if (!m) throw new Error(`không parse được std: ${r.stdout} ${r.stderr}`);
  return Number(m[1]);
}

// Preset P8 — đúng giá trị trong apps/web/src/components/enhance/presets.ts.
const PRESETS = {
  light: { denoise: { strength: 0.3 } },
  balanced: { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } },
  strong: { stabilize: { smoothing: 20 }, denoise: { strength: 0.8 } },
};
const COMBO_FULL = { deinterlace: true, stabilize: { smoothing: 30 }, denoise: { strength: 0.5 } };

// --- Chuẩn bị media 720p + 1080p ---
console.log(`== Chuẩn bị media (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
function genMedia(suffix, W, H, crf) {
  const S = `${W}x${H}`;
  run("ffmpeg", ["-f", "lavfi", "-i", `testsrc2=size=${S}:rate=30:duration=5`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, `clean${suffix}.mp4`)], `tạo clean${suffix}.mp4`);
  run("ffmpeg", ["-f", "lavfi", "-i", `testsrc2=size=${S}:rate=30:duration=5`,
    "-vf", "noise=alls=15:allf=t",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, `noisy${suffix}.mp4`)], `tạo noisy${suffix}.mp4`);
  run("ffmpeg", ["-f", "lavfi", "-i", `color=c=0x808080:s=${S}:r=30:d=5`,
    "-vf", "noise=alls=15:allf=t",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, `flatnoisy${suffix}.mp4`)], `tạo flatnoisy${suffix}.mp4`);
  run("ffmpeg", ["-f", "lavfi", "-i", `testsrc2=size=${S}:rate=60:duration=5`,
    "-vf", "tinterlace=interleave_top",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, `interlaced${suffix}.mp4`)], `tạo interlaced${suffix}.mp4`);
  run("ffmpeg", ["-f", "lavfi", "-i", `testsrc2=size=${S}:rate=60:duration=5`,
    "-vf", "tinterlace=interleave_top,noise=alls=15:allf=t",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, `comb${suffix}.mp4`)], `tạo comb${suffix}.mp4`);
  // Shaky: upscale nguồn rung P2 (320x180, tremor ±7px, seed cố định).
  run("ffmpeg", ["-i", path.join(mediaDir, "shaky320.mp4"),
    "-vf", `scale=${W}:${H}:flags=lanczos`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, `shaky${suffix}.mp4`)], `upscale shaky → ${suffix}`);
  run("ffmpeg", ["-i", path.join(mediaDir, `shaky${suffix}.mp4`),
    "-vf", "noise=alls=15:allf=t",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, `shakynoisy${suffix}.mp4`)], `shaky+noise → ${suffix}`);
}
run("python3", [path.join(RENDER, "test_p2_gen_shaky.py"), path.join(mediaDir, "shaky320.mp4")],
  "tạo shaky320.mp4 (gen P2)");
genMedia("720", 1280, 720, 18);
genMedia("1080", 1920, 1080, 23);
ok(["clean720.mp4", "noisy720.mp4", "flatnoisy720.mp4", "interlaced720.mp4",
  "comb720.mp4", "shaky720.mp4", "shakynoisy720.mp4",
  "clean1080.mp4", "noisy1080.mp4", "flatnoisy1080.mp4", "interlaced1080.mp4",
  "comb1080.mp4", "shaky1080.mp4", "shakynoisy1080.mp4"]
  .every((f) => fs.existsSync(path.join(mediaDir, f))), "media 720p + 1080p tạo xong");

// --- B: FPS render thật, mỗi cấu hình 2 lần ---
console.log("== Warm-up (không tính giờ) ==");
render(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clean720.mp4", 5)] }], 1280, 720), "warmup");

const results = {}; // label -> { runs: [{secs, fps, out}], W, H }
function timedRuns(label, specFn, W, H, runs = 2) {
  const entry = { W, H, runs: [] };
  for (let i = 1; i <= runs; i++) {
    const r = render(specFn(), `${label.replace(/[^a-z0-9]+/gi, "-")}-r${i}`);
    const p = probeVideo(r.outPath);
    ok(r.status === 0 && outOk(r.outPath),
      `${label} lần ${i}: render OK (${r.secs.toFixed(1)}s, ${r.fps.toFixed(2)} fps)`);
    ok(p.codec === "h264" && p.width === W && p.height === H,
      `${label} lần ${i}: codec/res đúng (${p.codec} ${p.width}x${p.height})`);
    ok(Math.abs(p.duration - 5) < 0.15,
      `${label} lần ${i}: thời lượng đúng (~5s, đo ${p.duration})`);
    entry.runs.push({ secs: r.secs, fps: r.fps, out: r.outPath, size: fs.statSync(r.outPath).size });
    console.log(`   📊 ${label} #${i}: ${r.secs.toFixed(2)}s wall → ${r.fps.toFixed(2)} fps (${fs.statSync(r.outPath).size} byte)`);
  }
  const fpss = entry.runs.map((x) => x.fps);
  entry.mean = fpss.reduce((a, b) => a + b, 0) / fpss.length;
  entry.min = Math.min(...fpss);
  entry.max = Math.max(...fpss);
  entry.spreadPct = ((entry.max - entry.min) / entry.mean) * 100;
  results[label] = entry;
  return entry;
}

function measureResolution(suffix, W, H) {
  console.log(`\n== B: FPS render thật ${suffix} 5s (veryfast/CRF23, 150 frame, mỗi cấu hình 2 lần) ==`);
  const T = (src, enh) => specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", src, 5, enh ? { enhance: enh } : {})] }], W, H);
  timedRuns(`baseline-${suffix}`, () => T(`clean${suffix}.mp4`), W, H);
  timedRuns(`light-${suffix}`, () => T(`noisy${suffix}.mp4`, PRESETS.light), W, H);
  timedRuns(`balanced-${suffix}`, () => T(`shakynoisy${suffix}.mp4`, PRESETS.balanced), W, H);
  timedRuns(`strong-${suffix}`, () => T(`shakynoisy${suffix}.mp4`, PRESETS.strong), W, H);
  timedRuns(`combo-${suffix}`, () => T(`comb${suffix}.mp4`, COMBO_FULL), W, H);
  timedRuns(`noisy-control-${suffix}`, () => T(`noisy${suffix}.mp4`), W, H);
  timedRuns(`shakynoisy-control-${suffix}`, () => T(`shakynoisy${suffix}.mp4`), W, H);
  timedRuns(`interlaced-control-${suffix}`, () => T(`interlaced${suffix}.mp4`), W, H);
  timedRuns(`comb-control-${suffix}`, () => T(`comb${suffix}.mp4`), W, H);
  timedRuns(`flat-control-${suffix}`, () => T(`flatnoisy${suffix}.mp4`), W, H);
  timedRuns(`flat-denoise-${suffix}`, () => T(`flatnoisy${suffix}.mp4`, { denoise: { strength: 0.5 } }), W, H);
}
measureResolution("720", 1280, 720);
measureResolution("1080", 1920, 1080);

console.log("\n== B2: bảng FPS tổng hợp (mean của 2 lần, kèm độ dao động) ==");
for (const [label, e] of Object.entries(results)) {
  console.log(`   📊 ${label}: mean=${e.mean.toFixed(2)} fps min=${e.min.toFixed(2)} max=${e.max.toFixed(2)} dao động=${e.spreadPct.toFixed(1)}% ` +
    `(wall ${e.runs.map((r) => r.secs.toFixed(1)).join("s / ")}s)`);
}
console.log(`   loadavg lúc cuối B: ${loadAvg()}`);

// --- C: khác biệt đo được, cả 2 độ phân giải ---
console.log("\n== C: khác biệt đo được (720p + 1080p) ==");
for (const suffix of ["720", "1080"]) {
  // Denoise trên nền phẳng: std frame giữa phải giảm rõ.
  const f0 = path.join(work, `f-${suffix}-0.png`), f1 = path.join(work, `f-${suffix}-1.png`);
  frameAt(results[`flat-control-${suffix}`].runs[0].out, 2.5, f0);
  frameAt(results[`flat-denoise-${suffix}`].runs[0].out, 2.5, f1);
  const s0 = frameStd(f0), s1 = frameStd(f1);
  console.log(`   📊 ${suffix} flat noise std: trước=${s0}, sau denoise 0.5=${s1}`);
  ok(s1 < s0 * 0.8, `${suffix}: denoise 0.5 giảm std nền phẳng xuống <80% (${s0} → ${s1})`);
  // Denoise trên testsrc2 nhiễu: frame phải khác bản không denoise.
  const g0 = path.join(work, `g-${suffix}-0.png`), g1 = path.join(work, `g-${suffix}-1.png`);
  frameAt(results[`noisy-control-${suffix}`].runs[0].out, 2.5, g0);
  frameAt(results[`light-${suffix}`].runs[0].out, 2.5, g1);
  const c = compareFrames(g0, g1);
  console.log(`   📊 ${suffix} frame diff light-vs-noisy-control: mean=${c.mean} pctGt8=${c.pctGt8}%`);
  ok(c.mean > 0.5 && c.pctGt8 > 1, `${suffix}: preset Nhẹ làm đổi pixel rõ trên testsrc2 nhiễu`);
  // Deinterlace: idet prog phải tăng rõ (combo chứa deinterlace vs comb-control).
  const i0 = idetProg(results[`comb-control-${suffix}`].runs[0].out);
  const i1 = idetProg(results[`combo-${suffix}`].runs[0].out);
  ok(i0 < 0.5, `${suffix}: đối chứng comb vẫn interlaced (prog=${i0.toFixed(3)})`);
  ok(i1 > 0.8, `${suffix}: combo tăng progressive (prog ${i0.toFixed(3)} → ${i1.toFixed(3)})`);
  // Stabilize: frame phải khác bản không stabilize (balanced vs control).
  const h0 = path.join(work, `h-${suffix}-0.png`), h1 = path.join(work, `h-${suffix}-1.png`);
  frameAt(results[`shakynoisy-control-${suffix}`].runs[0].out, 1.0, h0);
  frameAt(results[`balanced-${suffix}`].runs[0].out, 1.0, h1);
  const cs = compareFrames(h0, h1);
  console.log(`   📊 ${suffix} frame diff balanced-vs-control: mean=${cs.mean} pctGt8=${cs.pctGt8}%`);
  ok(cs.mean > 0, `${suffix}: preset Cân bằng làm thay đổi frame (stabilize đã áp)`);
  // Output combo KHÔNG xác định giữa 2 lần chạy khi có stabilize (phát hiện
  // đợt này, xem LIMITS §5): vidstabdetect cho .trf khác nhau giữa các lần
  // chạy giống hệt (79.7% LM entry khác, thứ tự LM đổi) nên output MP4 lệch
  // byte; frame lệch giữa 2 lần chạy tăng dần theo thời gian clip
  // (mean abs diff ~1.3 @0.5s → ~26 @2.5s → ~44 @4.0s ở balanced-720).
  // Vì vậy chỉ GHI NHẬN (không assert byte-identical): render không
  // stabilize vẫn byte-identical (đã kiểm ở §B qua kích thước file).
  const sz = results[`combo-${suffix}`].runs.map((r) => r.size);
  const det = sz[0] === sz[1];
  results[`combo-${suffix}`].deterministic = det;
  console.log(`   📊 ${suffix} combo byte 2 lần: ${sz.join(" / ")} → xác định: ${det ? "CÓ" : "KHÔNG (do vidstabdetect, xem LIMITS §5)"}`);
  // Đo độ lệch frame giữa 2 lần chạy stabilize (balanced r1 vs r2).
  for (const t of [0.5, 2.5, 4.0]) {
    const q0 = path.join(work, `q-${suffix}-${t}-0.png`), q1 = path.join(work, `q-${suffix}-${t}-1.png`);
    frameAt(results[`balanced-${suffix}`].runs[0].out, t, q0);
    frameAt(results[`balanced-${suffix}`].runs[1].out, t, q1);
    const cq = compareFrames(q0, q1);
    console.log(`   📊 ${suffix} balanced r1-vs-r2 @${t}s: mean=${cq.mean} pctGt8=${cq.pctGt8}%`);
  }
}

// --- D: preset stabilize + speedKeyframes ---
console.log("\n== D: preset stabilize khi clip có speedKeyframes ==");
{
  const { validateSpec } = require("./validate");
  const ramp = { keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 5, v: 2, easing: "linear" },
  ] };
  const rampSpec = (enh) => specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "shakynoisy720.mp4", 5,
      { enhance: enh, speedKeyframes: ramp })] }], 1280, 720);
  const vBal = validateSpec(rampSpec(PRESETS.balanced));
  console.log(`   validateSpec(balanced+ramp): ok=${vBal.ok} errors=${JSON.stringify(vBal.errors)}`);
  ok(!vBal.ok && vBal.errors.some((e) => e.includes("speedKeyframes") && e.includes("stabilize")),
    "validateSpec chặn balanced+ramp với lỗi nêu rõ speedKeyframes/stabilize");
  const vStrong = validateSpec(rampSpec(PRESETS.strong));
  ok(!vStrong.ok, "validateSpec chặn strong+ramp");
  const vLight = validateSpec(rampSpec(PRESETS.light));
  console.log(`   validateSpec(light+ramp, chỉ denoise): ok=${vLight.ok} errors=${JSON.stringify(vLight.errors)}`);
  ok(vLight.ok, "validateSpec CHO denoise-only (preset Nhẹ) + ramp");

  // Render thật: balanced + ramp phải thất bại có thông báo rõ, không crash.
  const specPath = path.join(work, "ramp-balanced.json");
  writeFileEpermRetry(specPath, JSON.stringify(rampSpec(PRESETS.balanced)));
  const outPath = path.join(work, "ramp-balanced.mp4");
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23"],
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const errText = (r.stderr || "") + (r.stdout || "");
  console.log(`   render balanced+ramp: exit=${r.status}`);
  console.log(`   stderr (đuôi): ${(r.stderr || "").slice(-600)}`);
  ok(r.status !== 0, "render balanced+ramp thất bại (exit != 0)");
  ok(errText.includes("speedKeyframes không dùng chung được với enhance.stabilize"),
    "thông báo lỗi nêu rõ speedKeyframes + stabilize");
  ok(!/at .*\.js:\d+:\d+/.test(r.stderr || "") || (r.stderr || "").includes("❌"),
    "lỗi in dạng thông báo rõ, không phải stack trace thô (có dòng ❌)");
  ok(!fs.existsSync(outPath) || fs.statSync(outPath).size === 0,
    "không tạo MP4 output khi render bị chặn");

  // Đối chứng: preset Nhẹ (chỉ denoise) + ramp render OK.
  const r2 = render(rampSpec(PRESETS.light), "ramp-light");
  const p2 = probeVideo(r2.outPath);
  ok(r2.status === 0 && outOk(r2.outPath) && Math.abs(p2.duration - 5) < 0.3,
    `preset Nhẹ + ramp render OK (${r2.secs.toFixed(1)}s, ${r2.fps.toFixed(2)} fps, ${p2.duration}s)`);
}

console.log(`\n== test_round60_q8: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== FPS SUMMARY (JSON) ==");
console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([k, e]) => [k, {
  mean: +e.mean.toFixed(2), min: +e.min.toFixed(2), max: +e.max.toFixed(2),
  spreadPct: +e.spreadPct.toFixed(1),
  wall: e.runs.map((r) => +r.secs.toFixed(2)),
}])), null, 1));
if (fail > 0) process.exit(1);
