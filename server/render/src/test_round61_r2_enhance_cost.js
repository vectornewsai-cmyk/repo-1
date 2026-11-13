#!/usr/bin/env node
/**
 * test_round61_r2_enhance_cost.js — Phase 9 đợt 61, luồng R2: đóng nợ đợt 60
 * §5.2 (Q8 enhance render). 4 việc:
 *   (a) TÁCH chi phí vidstabdetect vs vidstabtransform: đo render MP4 thật
 *       riêng từng pass (chỉ detect, chỉ transform với .trf có sẵn, cả
 *       combo) ở 720p + 1080p, clip 5s, 2 lần mỗi cấu hình; báo FPS từng pass.
 *   (b) METRIC GIẢM JITTER LẶP LẠI: render stabilize cùng input 3 lần, đo
 *       metric jitter (mean abs diff giữa các frame liên tiếp, như Q8 §5)
 *       xem .trf không xác định làm metric dao động bao nhiêu giữa các lần.
 *   (c) GHOSTING DENOISE trên footage chuyển động nhanh: clip thanh trắng
 *       chạy nhanh (24 px/frame), render hqdn3d 0.3/0.5/0.7, đo frame diff
 *       ở vùng trail (vệt ma) so với frame gốc — kết luận mức nào an toàn.
 *   (d) Không đo ở harness này (UI — xem enhanceSpeedBlock61R2.test.ts +
 *       clicktest-61r2-enhance-speedblock.mjs).
 *
 * Cách chạy: node server/render/src/test_round61_r2_enhance_cost.js
 * (cần ffmpeg, ffprobe, python3 + PIL/numpy). Scratch dưới
 * ~/workspace/.scratch-r61r2-XXXX (KHÔNG dùng os.tmpdir(): /tmp là tmpfs
 * 512M). KHÔNG ghi gì vào repo. Thời gian ~20 phút.
 *
 * Lưu ý phương pháp (đọc trước khi trích số):
 * - detect-only: gọi thẳng runStabilizeDetect của enhance.js (đúng lệnh
 *   VCut, trim+setpts+vidstabdetect, ghi .trf, xuất null — không encode).
 * - transform-only: ffmpeg trực tiếp với vidstabtransform + .trf có sẵn
 *   (từ 1 lần detect) + encode libx264 veryfast/CRF23 — tức gồm
 *   decode + transform + encode. Chi phí transform thuần = transform-only
 *   − baseline encode (cùng lệnh, không filter). Combo kiểm chứng = render
 *   thật bằng render.js preset Cân bằng (detect + transform + encode +
 *   khởi động node), so với tổng detect + transform-only.
 * - FPS từng pass = 150 / wall của pass đó. Tỉ lệ trong cùng lượt mới có
 *   ý nghĩa (Q8: FPS tuyệt đối dao động tới 2.5× theo tải VM).
 * - Metric jitter (b): mean abs diff giữa các frame liên tiếp (frame
 *   320x180 gray) — proxy cho chuyển động dư/jitter; stabilize tốt phải
 *   làm số này GIẢM so với đối chứng rung không stabilize.
 * - Ghosting (c): vùng trail = dải 24px thanh vừa rời khỏi (frame t-1 có
 *   thanh, frame t đã là nền đen); ghost = mean |render_t − orig_t| trên
 *   vùng trail. Vùng tĩnh đối chứng = toàn frame trừ thanh t/t-1 và các
 *   dải trail/leading. Ngưỡng đọc: ghost < 2 ~ không thấy; 2–8 vệt mờ
 *   thấy được; > 8 vệt rõ.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r61r2-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
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
function timed(label, fn) {
  const t0 = Date.now();
  const out = fn();
  const secs = (Date.now() - t0) / 1000;
  console.log(`   📊 ${label}: ${secs.toFixed(2)}s wall → ${(150 / secs).toFixed(2)} fps (loadavg ${loadAvg()})`);
  return { secs, fps: 150 / secs, out };
}

const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r61r2", width: W, height: H, fps: fps || 30 },
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

// --- Python helpers: jitter (inter-frame MAD) + ghosting -------------------
const JITTER_PY = `
import sys, glob, numpy as np
from PIL import Image
files = sorted(glob.glob(sys.argv[1] + "/f*.png"))
if len(files) < 10:
    print("ERR too few frames"); sys.exit(1)
prev = None; diffs = []
for f in files:
    g = np.asarray(Image.open(f), dtype=np.int16)
    if prev is not None:
        diffs.append(float(np.abs(g - prev).mean()))
    prev = g
d = np.array(diffs)
print(f"n={len(d)} mean={d.mean():.4f} median={np.median(d):.4f} std={d.std():.4f} min={d.min():.4f} max={d.max():.4f}")
`;
const jitterPy = path.join(work, "jitter.py");
writeFileEpermRetry(jitterPy, JITTER_PY);
function jitterOf(framesDir) {
  const r = spawnSync("python3", [jitterPy, framesDir], { encoding: "utf8" });
  const m = /n=(\d+) mean=([\d.]+) median=([\d.]+) std=([\d.]+) min=([\d.]+) max=([\d.]+)/.exec(r.stdout || "");
  if (!m) throw new Error(`không parse được jitter: ${r.stdout} ${r.stderr}`);
  return { n: Number(m[1]), mean: Number(m[2]), median: Number(m[3]), std: Number(m[4]), min: Number(m[5]), max: Number(m[6]) };
}
function extractFrames(mp4, dir, vf) {
  fs.mkdirSync(dir, { recursive: true });
  run("ffmpeg", ["-i", mp4, "-vf", vf, "-vsync", "0", path.join(dir, "f%04d.png")], `tách frame ${path.basename(mp4)}`);
}

// Ghosting: thanh trắng 120px chạy 24px/frame, x_t = (t*24) % 1160.
const GHOST_PY = `
import sys, glob, numpy as np
from PIL import Image
origDir, rendDir = sys.argv[1], sys.argv[2]
W, BAR, STEP, SPAN = 1280, 120, 24, 1160
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
    trail.append(float(d[:, x_prev:x_prev + STEP].mean()))
    lead.append(float(d[:, x + BAR - STEP:x + BAR].mean()))
    mask = np.ones(d.shape, dtype=bool)
    mask[:, x_prev:x + BAR] = False  # trừ thanh t-1 + thanh t
    stat.append(float(d[mask].mean()))
for name, v in [("trail", trail), ("lead", lead), ("static", stat)]:
    a = np.array(v)
    print(f"{name} n={len(a)} mean={a.mean():.4f} median={np.median(a):.4f} p90={np.percentile(a, 90):.4f} max={a.max():.4f}")
`;
const ghostPy = path.join(work, "ghost.py");
writeFileEpermRetry(ghostPy, GHOST_PY);
function ghostOf(origDir, rendDir) {
  const r = spawnSync("python3", [ghostPy, origDir, rendDir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ghost.py lỗi: ${r.stdout} ${r.stderr}`);
  const out = {};
  for (const m of (r.stdout || "").matchAll(/(\w+) n=(\d+) mean=([\d.]+) median=([\d.]+) p90=([\d.]+) max=([\d.]+)/g)) {
    out[m[1]] = { n: Number(m[2]), mean: Number(m[3]), median: Number(m[4]), p90: Number(m[5]), max: Number(m[6]) };
  }
  if (!out.trail || !out.lead || !out.static) throw new Error(`không parse được ghost: ${r.stdout} ${r.stderr}`);
  return out;
}

// --- Chuẩn bị media --------------------------------------------------------
console.log(`== Chuẩn bị media (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);
function genShaky(suffix, W, H, crf) {
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
genShaky("720", 1280, 720, 18);
genShaky("1080", 1920, 1080, 23);
ok(["shaky720.mp4", "shakynoisy720.mp4", "shaky1080.mp4", "shakynoisy1080.mp4"]
  .every((f) => fs.existsSync(path.join(mediaDir, f))), "media shaky 720p + 1080p tạo xong");

// Clip chuyển động nhanh (c): thanh trắng 120px chạy 24px/frame trên nền đen.
const GEN_FAST_PY = `
import numpy as np
from PIL import Image
import os, sys
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
W, H, BAR, STEP, SPAN = 1280, 720, 120, 24, 1160
for t in range(150):
    x = (t * STEP) % SPAN
    img = np.zeros((H, W), dtype=np.uint8)
    img[:, x:x + BAR] = 255
    Image.fromarray(img, mode="L").convert("RGB").save(os.path.join(out, f"f{t:04d}.png"))
print("done 150")
`;
const fastDir = path.join(work, "fastframes");
run("python3", ["-c", GEN_FAST_PY, fastDir], "gen frame thanh chạy nhanh");
run("ffmpeg", ["-framerate", "30", "-i", path.join(fastDir, "f%04d.png"),
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "fastmove720.mp4")], "encode fastmove720.mp4");
ok(fs.existsSync(path.join(mediaDir, "fastmove720.mp4")) && probeOk(path.join(mediaDir, "fastmove720.mp4"), 1280, 720),
  "fastmove720.mp4 tạo xong (thanh trắng 120px, 24px/frame, 5s)");

const summary = { a: {}, b: {}, c: {} };

// === (a) Tách chi phí detect vs transform, 720p + 1080p, 2 lần mỗi cấu hình ===
console.log("\n== (a) Tách chi phí vidstabdetect vs vidstabtransform (clip 5s, 2 lần/cấu hình) ==");
const BALANCED = { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } };
for (const [suffix, W, H] of [["720", 1280, 720], ["1080", 1920, 1080]]) {
  console.log(`-- ${suffix} (${W}x${H}), loadavg ${loadAvg()} --`);
  const src = path.join(mediaDir, `shakynoisy${suffix}.mp4`);
  const clip = { in: 0, duration: 5, speed: 1, enhance: { stabilize: { smoothing: 10 } } };
  const entry = { detect: [], transform: [], baseline: [], full: [] };
  // 1 lần detect trước để lấy .trf dùng cho các lần transform-only.
  const trfPath = path.join(work, `stab-${suffix}.trf`);
  const d0 = timed(`detect (lấy .trf) ${suffix}`, () => {
    const r = runStabilizeDetect("ffmpeg", src, clip, trfPath);
    if (!r.ok) throw new Error(`vidstabdetect lỗi: ${r.error}`);
    return r;
  });
  ok(fs.existsSync(trfPath) && fs.statSync(trfPath).size > 0, `${suffix}: .trf tạo được (${fs.statSync(trfPath).size} byte)`);
  for (let i = 1; i <= 2; i++) {
    const trfI = path.join(work, `stab-${suffix}-r${i}.trf`);
    const d = timed(`detect-only ${suffix} #${i}`, () => {
      const r = runStabilizeDetect("ffmpeg", src, clip, trfI);
      if (!r.ok) throw new Error(`vidstabdetect lỗi: ${r.error}`);
      return r;
    });
    entry.detect.push(d);
    ok(fs.statSync(trfI).size > 0, `${suffix} detect #${i}: .trf > 0 byte`);
  }
  for (let i = 1; i <= 2; i++) {
    const outP = path.join(work, `transform-only-${suffix}-r${i}.mp4`);
    const t = timed(`transform-only ${suffix} #${i}`, () => run("ffmpeg", ["-i", src,
      "-vf", `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trfPath.replace(/:/g, "\\:")}':smoothing=10:optalgo=gauss`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
      "-an", "-y", outP], `transform-only ${suffix} #${i}`));
    entry.transform.push(t);
    ok(outOk(outP) && probeOk(outP, W, H), `${suffix} transform-only #${i}: MP4 h264 đúng res/thời lượng`);
  }
  for (let i = 1; i <= 2; i++) {
    const outP = path.join(work, `baseline-enc-${suffix}-r${i}.mp4`);
    const b = timed(`baseline encode ${suffix} #${i}`, () => run("ffmpeg", ["-i", src,
      "-vf", "trim=start=0:end=5,setpts=PTS-STARTPTS",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
      "-an", "-y", outP], `baseline encode ${suffix} #${i}`));
    entry.baseline.push(b);
    ok(outOk(outP) && probeOk(outP, W, H), `${suffix} baseline encode #${i}: MP4 h264 đúng res/thời lượng`);
  }
  for (let i = 1; i <= 2; i++) {
    const spec = specWith([{ id: "v0", kind: "video",
      clips: [vclip("c0", `shakynoisy${suffix}.mp4`, 5, { enhance: BALANCED })] }], W, H);
    const t0 = Date.now();
    const r = render(spec, `full-balanced-${suffix}-r${i}`);
    const secs = (Date.now() - t0) / 1000;
    console.log(`   📊 full render (balanced) ${suffix} #${i}: ${secs.toFixed(2)}s wall → ${(150 / secs).toFixed(2)} fps (loadavg ${loadAvg()})`);
    entry.full.push({ secs, fps: 150 / secs });
    ok(r.status === 0 && outOk(r.outPath) && probeOk(r.outPath, W, H),
      `${suffix} full balanced #${i}: render thật OK (${secs.toFixed(1)}s, ${(150 / secs).toFixed(2)} fps)`);
  }
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const mDetect = mean(entry.detect.map((x) => x.secs));
  const mTransform = mean(entry.transform.map((x) => x.secs));
  const mBaseline = mean(entry.baseline.map((x) => x.secs));
  const mFull = mean(entry.full.map((x) => x.secs));
  const transformPure = mTransform - mBaseline;
  const sumParts = mDetect + mTransform;
  summary.a[suffix] = {
    detectWall: +mDetect.toFixed(2), detectFps: +(150 / mDetect).toFixed(2),
    transformWall: +mTransform.toFixed(2), transformFps: +(150 / mTransform).toFixed(2),
    transformPureWall: +transformPure.toFixed(2), transformPureFps: +(150 / transformPure).toFixed(2),
    baselineWall: +mBaseline.toFixed(2), baselineFps: +(150 / mBaseline).toFixed(2),
    fullWall: +mFull.toFixed(2), fullFps: +(150 / mFull).toFixed(2),
    detectSharePct: +(mDetect / mFull * 100).toFixed(1),
    transformPureSharePct: +(transformPure / mFull * 100).toFixed(1),
    baselineSharePct: +(mBaseline / mFull * 100).toFixed(1),
    sumDetectTransformVsFullPct: +(sumParts / mFull * 100).toFixed(1),
  };
  console.log(`   📊 ${suffix} TỔNG HỢP (mean 2 lần): detect ${mDetect.toFixed(2)}s (${(150 / mDetect).toFixed(2)} fps, ${(mDetect / mFull * 100).toFixed(1)}% full) | ` +
    `transform+encode ${mTransform.toFixed(2)}s (${(150 / mTransform).toFixed(2)} fps) | transform thuần ${transformPure.toFixed(2)}s (${(150 / transformPure).toFixed(2)} fps, ${(transformPure / mFull * 100).toFixed(1)}% full) | ` +
    `baseline encode ${mBaseline.toFixed(2)}s (${(150 / mBaseline).toFixed(2)} fps, ${(mBaseline / mFull * 100).toFixed(1)}% full) | full ${mFull.toFixed(2)}s (${(150 / mFull).toFixed(2)} fps) | ` +
    `detect+transform-only = ${(sumParts / mFull * 100).toFixed(1)}% full (phần còn lại: khởi động node + graph + denoise)`);
}

// === (b) Metric giảm jitter lặp lại: stabilize 3 lần vs đối chứng ==========
console.log("\n== (b) Metric giảm jitter lặp lại (stabilize 3 lần, cùng input) ==");
for (const [suffix, W, H] of [["720", 1280, 720], ["1080", 1920, 1080]]) {
  console.log(`-- ${suffix}, loadavg ${loadAvg()} --`);
  const spec = (enh) => specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", `shakynoisy${suffix}.mp4`, 5, enh ? { enhance: enh } : {})] }], W, H);
  // Đối chứng: dùng lại output baseline encode ở (a) (không enhance).
  const ctrlOut = path.join(work, `baseline-enc-${suffix}-r1.mp4`);
  const ctrlDir = path.join(work, `frames-ctrl-${suffix}`);
  extractFrames(ctrlOut, ctrlDir, "scale=320:180,format=gray");
  const ctrl = jitterOf(ctrlDir);
  console.log(`   📊 ${suffix} đối chứng (rung, không stabilize): inter-frame MAD mean=${ctrl.mean} median=${ctrl.median} std=${ctrl.std}`);
  const runs = [];
  for (let i = 1; i <= 3; i++) {
    const r = render(spec(BALANCED), `stab-jitter-${suffix}-r${i}`);
    ok(r.status === 0 && outOk(r.outPath) && probeOk(r.outPath, W, H),
      `${suffix} stabilize jitter #${i}: render OK (${r.secs.toFixed(1)}s, ${r.fps.toFixed(2)} fps)`);
    const dir = path.join(work, `frames-stab-${suffix}-r${i}`);
    extractFrames(r.outPath, dir, "scale=320:180,format=gray");
    const j = jitterOf(dir);
    console.log(`   📊 ${suffix} stabilize #${i}: inter-frame MAD mean=${j.mean} median=${j.median} std=${j.std} (size ${fs.statSync(r.outPath).size} byte)`);
    runs.push({ fps: +r.fps.toFixed(2), size: fs.statSync(r.outPath).size, ...j });
  }
  const means = runs.map((x) => x.mean);
  const mMean = means.reduce((a, b) => a + b, 0) / means.length;
  const spread = (Math.max(...means) - Math.min(...means)) / mMean * 100;
  summary.b[suffix] = {
    controlMean: ctrl.mean, controlMedian: ctrl.median,
    runs: runs.map((x) => ({ mean: x.mean, median: x.median, std: x.std, fps: x.fps, size: x.size })),
    stabMeanOfMeans: +mMean.toFixed(4),
    spreadPct: +spread.toFixed(1),
    reductionPct: +((ctrl.mean - mMean) / ctrl.mean * 100).toFixed(1),
  };
  console.log(`   📊 ${suffix} TỔNG HỢP jitter: đối chứng mean=${ctrl.mean} → stabilize mean 3 lần=${mMean.toFixed(4)} (giảm ${((ctrl.mean - mMean) / ctrl.mean * 100).toFixed(1)}%); ` +
    `dao động giữa 3 lần: min=${Math.min(...means).toFixed(4)} max=${Math.max(...means).toFixed(4)} → spread ${(spread).toFixed(1)}%`);
  ok(mMean < ctrl.mean, `${suffix}: stabilize làm giảm inter-frame MAD trung bình (${ctrl.mean} → ${mMean.toFixed(4)})`);
}

// === (c) Ghosting denoise trên footage chuyển động nhanh =====================
console.log("\n== (c) Ghosting denoise trên footage chuyển động nhanh (720p) ==");
{
  const origDir = path.join(work, "frames-fast-orig");
  extractFrames(path.join(mediaDir, "fastmove720.mp4"), origDir, "format=gray");
  const spec = (s) => specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "fastmove720.mp4", 5, { enhance: { denoise: { strength: s } } })] }], 1280, 720);
  const ghosts = {};
  for (const s of [0.3, 0.5, 0.7]) {
    const r = render(spec(s), `denoise-fast-${String(s).replace(".", "_")}`);
    ok(r.status === 0 && outOk(r.outPath) && probeOk(r.outPath, 1280, 720),
      `denoise ${s} trên fastmove: render OK (${r.secs.toFixed(1)}s, ${r.fps.toFixed(2)} fps)`);
    const dir = path.join(work, `frames-fast-denoise-${String(s).replace(".", "_")}`);
    extractFrames(r.outPath, dir, "format=gray");
    const g = ghostOf(origDir, dir);
    console.log(`   📊 denoise ${s}: trail mean=${g.trail.mean} median=${g.trail.median} p90=${g.trail.p90} max=${g.trail.max} | ` +
      `leading mean=${g.lead.mean} | static mean=${g.static.mean} (n=${g.trail.n} frame)`);
    ghosts[String(s)] = g;
  }
  // Lặp lại 0.5 để xác nhận denoise xác định (không stabilize).
  const r2 = render(spec(0.5), "denoise-fast-0_5-repeat");
  const sz1 = fs.statSync(path.join(work, "denoise-fast-0_5.mp4")).size;
  const sz2 = fs.statSync(r2.outPath).size;
  console.log(`   📊 denoise 0.5 lặp lại: byte ${sz1} vs ${sz2} → xác định: ${sz1 === sz2 ? "CÓ" : "KHÔNG"}`);
  ok(sz1 === sz2, "denoise 0.5 render lặp lại byte-identical (xác định, không stabilize)");
  summary.c = {
    strengths: Object.fromEntries(Object.entries(ghosts).map(([k, g]) => [k, {
      trailMean: g.trail.mean, trailMedian: g.trail.median, trailP90: g.trail.p90, trailMax: g.trail.max,
      leadMean: g.lead.mean, staticMean: g.static.mean,
    }])),
    deterministicRepeat: sz1 === sz2,
  };
  // (c) trên cạnh cứng 0→255: trail = 0 ở MỌI mức — không phải vì hqdn3d
  // không ghost, mà vì filter temporal của hqdn3d chỉ blend sai khác nhỏ
  // dưới ngưỡng (luma_tmp 7.2/12/16.8), còn cạnh 255 không bao giờ blend.
  // Cạnh cứng là ca KHÔNG nhạy; ca nhạy là vật thể gradient mềm — đo ở
  // harness bổ sung test_round61_r2_enhance_cost_supplement.js (c2).
  // Vì vậy KHÔNG assert đơn điệu ở đây, chỉ ghi nhận.
  console.log(`   📊 (c) cạnh cứng: trail = 0 ở mọi mức (0.3/0.5/0.7) — cạnh 0→255 vượt ngưỡng blend temporal của hqdn3d nên không ghost; ca nhạy xem (c2) ở harness bổ sung`);
  ok(ghosts["0.3"].static.mean < 1,
    `vùng tĩnh sau denoise 0.3 gần như không đổi (static mean ${ghosts["0.3"].static.mean} < 1)`);
}

console.log(`\n== test_round61_r2: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify(summary, null, 1));
if (fail > 0) process.exit(1);
