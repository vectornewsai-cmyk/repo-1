#!/usr/bin/env node
/**
 * test_motion_ramp.js — Test THẬT Phase 9 đợt 8 S3: ramp + motion.
 *
 * Render bằng chính render.js (không mock), nguồn testsrc2 thật.
 * Shape motion là shape thật của S2 (motion.js): interpolation
 * 'none' | 'minterpolate', motionBlur { frames, weights? }.
 *   A. Ramp có đoạn 0.5x + interpolation → MP4 đúng duration, frame count
 *      = duration*fps ± 2 (minterpolate cùng fps KHÔNG tăng số frame),
 *      và frame cuối KHÔNG đen (hồi quy lỗi đen frame cuối của vị trí
 *      minterpolate cuối chain cũ — xem header speedramp.js).
 *   B. Độ mượt: cùng ramp, bản có interpolation có max frame-diff NHỎ HƠN
 *      bản không interpolation, HOẶC độ lệch chuẩn frame-diff nhỏ hơn
 *      (ghi số thật cả hai; nếu cả hai đều không đạt thì test FAIL và ghi
 *      rõ là KHÔNG đạt — không bịa số).
 *   C. motionBlur trên ramp làm giảm độ sắc nét (số thật: mean |Laplacian|).
 *   D. Ramp không motion hồi quy như cũ (duration/frame count đúng).
 *   E. Ramp toàn đoạn speed >= 1 + interpolation vẫn render OK, không
 *      fail-fast vô lý (hiệu quả ~0 vì không có frame lặp — chỉ kiểm tra
 *      render thành công và đúng frame count).
 *   F. Fail-fast đơn vị: targetFps khác fps project → throw; miMode lạ →
 *      throw; reverse + motion trên ramp → throw (buildSpeedRampVideo)
 *      và render E2E fail với thông báo reverse rõ ràng.
 *   G. Dry-run: filtergraph nhánh ramp có minterpolate khi bật motion.
 *
 * Cách chạy: node src/test_motion_ramp.js (cần ffmpeg, ffprobe trên PATH).
 * File tạm nằm trong os.tmpdir(). Minterpolate mci khá chậm nên test dùng
 * khung nhỏ 320x180, fps 20, clip 2s.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const { buildMotionPostChain, buildSpeedRampVideo } = require("./speedramp");

const W = 320, H = 180, FPS = 20, DUR = 2;
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-motionramp-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });

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

// --- Media thật: testsrc2 chuyển động (có đủ chuyển động để đo frame-diff) ---
run("ffmpeg", ["-f", "lavfi", "-i", `testsrc2=s=${W}x${H}:r=30:d=4`,
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "src.mp4")], "tạo src.mp4");

const rampCurve = { keyframes: [
  { t: 0, v: 1, easing: "linear" },
  { t: 1, v: 0.5, easing: "linear" },
  { t: 2, v: 0.5, easing: "linear" },
] };
const fastCurve = { keyframes: [
  { t: 0, v: 1, easing: "linear" },
  { t: 2, v: 2, easing: "linear" },
] };
const specWith = (clip) => ({
  version: "0.2.0",
  meta: { name: "motionramp", width: W, height: H, fps: FPS },
  tracks: [{ id: "v0", kind: "video", clips: [clip] }],
});
const vclip = (extra) => ({
  id: "c0", kind: "video", src: "src.mp4", start: 0, duration: DUR, in: 0, out: DUR,
  speedKeyframes: rampCurve, ...extra,
});
function render(clip, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(specWith(clip)));
  const outPath = path.join(work, `${name}.mp4`);
  const args = ["src/render.js", "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "--x264-preset", "veryfast", "--crf", "28", "-y"];
  if (extraArgs) args.push(...extraArgs);
  const r = spawnSync("node", args, { cwd: path.join(__dirname, ".."), stdio: ["ignore", "pipe", "pipe"] });
  return { status: r.status, stderr: (r.stderr || "").toString(), stdout: (r.stdout || "").toString(), outPath };
}
function probeDuration(outPath) {
  const r = run("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", outPath], "ffprobe duration");
  return parseFloat(r.stdout.toString().trim());
}
// Giải mã thành gray thô rồi tính frame-diff + độ sắc nét trong Node.
function analyze(outPath, name) {
  const grayPath = path.join(work, `${name}.gray`);
  run("ffmpeg", ["-i", outPath, "-vf", "format=gray", "-f", "rawvideo", "-y", grayPath], `giải mã ${name}`);
  const buf = fs.readFileSync(grayPath);
  const frameSize = W * H;
  const nFrames = Math.floor(buf.length / frameSize);
  const diffs = [];
  for (let f = 1; f < nFrames; f++) {
    let s = 0;
    const a = (f - 1) * frameSize, b = f * frameSize;
    for (let i = 0; i < frameSize; i++) s += Math.abs(buf[b + i] - buf[a + i]);
    diffs.push(s / frameSize);
  }
  const mean = diffs.reduce((x, y) => x + y, 0) / Math.max(diffs.length, 1);
  const variance = diffs.reduce((x, y) => x + (y - mean) ** 2, 0) / Math.max(diffs.length, 1);
  const max = diffs.length ? Math.max(...diffs) : 0;
  // Độ sắc nét: mean |Laplacian 3x3| trên tất cả frame.
  let lap = 0, cnt = 0;
  for (let f = 0; f < nFrames; f++) {
    const o = f * frameSize;
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = o + y * W + x;
        lap += Math.abs(4 * buf[i] - buf[i - 1] - buf[i + 1] - buf[i - W] - buf[i + W]);
        cnt++;
      }
    }
  }
  const lastMean = nFrames ? buf.slice((nFrames - 1) * frameSize, nFrames * frameSize)
    .reduce((x, y) => x + y, 0) / frameSize : 0;
  return { nFrames, maxDiff: max, stdDiff: Math.sqrt(variance), meanDiff: mean, sharpness: lap / cnt, lastMean };
}

console.log("F: fail-fast đơn vị (buildMotionPostChain / buildSpeedRampVideo)");
{
  let threw = false;
  try { buildMotionPostChain({ interpolation: "minterpolate", targetFps: 60 }, FPS); }
  catch (e) { threw = /targetFps/.test(e.message); }
  ok(threw, "targetFps khác fps project → throw có nhắc targetFps");
  let threwM = false;
  try { buildMotionPostChain({ interpolation: "minterpolate", miMode: "dup" }, FPS); }
  catch (e) { threwM = /miMode/.test(e.message); }
  ok(threwM, "miMode lạ (dup) → throw có nhắc miMode");
  let threw2 = false;
  try {
    let n = 0; const lbl = (p) => p + (n++);
    buildSpeedRampVideo("[0:v]", { id: "c", in: 0, duration: 2, reverse: true, motion: { interpolation: "minterpolate" }, speedKeyframes: rampCurve },
      { W, H, fps: FPS, outFormat: "yuv420p", padColor: "black", lbl });
  } catch (e) { threw2 = /reverse/.test(e.message); }
  ok(threw2, "reverse + motion trên ramp → throw có nhắc reverse");
  const rF = render(vclip({ reverse: true, motion: { interpolation: "minterpolate" } }), "f-reverse");
  ok(rF.status !== 0 && /reverse/.test(rF.stderr), "render E2E reverse + ramp + motion fail với thông báo reverse");
}

console.log("G: dry-run filtergraph nhánh ramp có minterpolate");
{
  const specPath = path.join(work, "g.json");
  fs.writeFileSync(specPath, JSON.stringify(specWith(vclip({ motion: { interpolation: "minterpolate" } }))));
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", path.join(work, "g.mp4"),
    "--media-dir", mediaDir, "--dry-run"], { cwd: path.join(__dirname, ".."), stdio: ["ignore", "pipe", "pipe"] });
  ok(r.status === 0 && /minterpolate=fps=20/.test((r.stdout || "").toString()),
    "dry-run filtergraph chứa minterpolate=fps=20");
}

console.log("B/D: render ramp không motion (baseline) và ramp + interpolation");
const plain = render(vclip({}), "plain");
ok(plain.status === 0 && fs.existsSync(plain.outPath) && fs.statSync(plain.outPath).size > 0,
  "ramp không motion render OK, output > 0");
const interp = render(vclip({ motion: { interpolation: "minterpolate" } }), "interp");
ok(interp.status === 0 && fs.existsSync(interp.outPath) && fs.statSync(interp.outPath).size > 0,
  "ramp + interpolation render OK, output > 0");

const aPlain = analyze(plain.outPath, "plain");
const aInterp = analyze(interp.outPath, "interp");
console.log(`   số liệu plain: frames=${aPlain.nFrames}, maxDiff=${aPlain.maxDiff.toFixed(3)}, stdDiff=${aPlain.stdDiff.toFixed(3)}, lastMean=${aPlain.lastMean.toFixed(1)}`);
console.log(`   số liệu interp: frames=${aInterp.nFrames}, maxDiff=${aInterp.maxDiff.toFixed(3)}, stdDiff=${aInterp.stdDiff.toFixed(3)}, lastMean=${aInterp.lastMean.toFixed(1)}`);

console.log("A: ramp + interpolation đúng duration / frame count");
{
  const d = probeDuration(interp.outPath);
  ok(Math.abs(d - DUR) < 0.25, `duration interp = ${d.toFixed(3)}s (≈ ${DUR}s)`);
  ok(Math.abs(aInterp.nFrames - DUR * FPS) <= 2,
    `frame count interp = ${aInterp.nFrames} (≈ ${DUR * FPS} ± 2 — minterpolate cùng fps KHÔNG tăng frame)`);
  ok(aInterp.lastMean > 20,
    `frame cuối interp không đen: lastMean = ${aInterp.lastMean.toFixed(1)} (> 20)`);
}

console.log("B: độ mượt (interp so với plain)");
{
  const maxOk = aInterp.maxDiff < aPlain.maxDiff;
  const stdOk = aInterp.stdDiff < aPlain.stdDiff;
  console.log(`   maxDiff: interp ${aInterp.maxDiff.toFixed(3)} vs plain ${aPlain.maxDiff.toFixed(3)} → ${maxOk ? "NHỎ HƠN" : "KHÔNG nhỏ hơn"}`);
  console.log(`   stdDiff: interp ${aInterp.stdDiff.toFixed(3)} vs plain ${aPlain.stdDiff.toFixed(3)} → ${stdOk ? "NHỎ HƠN" : "KHÔNG nhỏ hơn"}`);
  ok(maxOk || stdOk, "interp mượt hơn plain theo maxDiff HOẶC stdDiff (nếu FAIL thì ghi rõ KHÔNG đạt)");
}

console.log("D: ramp không motion hồi quy");
{
  const d = probeDuration(plain.outPath);
  ok(Math.abs(d - DUR) < 0.25, `duration plain = ${d.toFixed(3)}s (≈ ${DUR}s)`);
  ok(Math.abs(aPlain.nFrames - DUR * FPS) <= 2, `frame count plain = ${aPlain.nFrames} (≈ ${DUR * FPS} ± 2)`);
}

console.log("C: motionBlur trên ramp làm giảm độ sắc nét");
const blur = render(vclip({ motion: { motionBlur: { frames: 5 } } }), "blur");
ok(blur.status === 0 && fs.existsSync(blur.outPath) && fs.statSync(blur.outPath).size > 0,
  "ramp + motionBlur render OK, output > 0");
const aBlur = analyze(blur.outPath, "blur");
console.log(`   sharpness: blur ${aBlur.sharpness.toFixed(3)} vs plain ${aPlain.sharpness.toFixed(3)}`);
ok(aBlur.sharpness < aPlain.sharpness, "motionBlur làm giảm độ sắc nét (mean |Laplacian| nhỏ hơn)");

console.log("E: ramp toàn speed >= 1 + interpolation (không fail-fast vô lý)");
const fast = render(vclip({ speedKeyframes: fastCurve, motion: { interpolation: "minterpolate" } }), "fast");
ok(fast.status === 0, "ramp 1x→2x + interpolation render OK");
const aFast = analyze(fast.outPath, "fast");
ok(Math.abs(aFast.nFrames - DUR * FPS) <= 2, `frame count fast+interp = ${aFast.nFrames} (≈ ${DUR * FPS} ± 2)`);

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail (thư mục tạm: ${work})`);
process.exit(fail ? 1 : 0);
