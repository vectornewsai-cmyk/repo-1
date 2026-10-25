#!/usr/bin/env node
/**
 * test_r2.js — Test THẬT Phase 9 R2: enhance ra UI (render) + mask PNG nhanh.
 *
 * Render bằng chính render.js (không mock):
 *  A. Mask PNG vs geq: cùng spec, --mask-mode png và geq → frame giữa phải
 *     gần như giống nhau (chỉ khác lượng tử hoá 8-bit của PNG).
 *  B. Dry-run: mode png chứa movie=/blend, mode geq chứa geq=lum=.
 *  C. Mask ellipse + invert và mask cho ảnh (đường PNG) → render OK.
 *  D. Denoise: clip nền phẳng + nhiễu → std sau denoise phải giảm rõ.
 *  E. Deinterlace: dry-run chứa yadif + render thật OK.
 *  F. Stabilize: vidstabdetect + transform → render OK, frame khác bản không
 *     stabilize (transform đã áp), thời lượng đúng.
 *  G. Benchmark: clip 720p 5s có mask, đo wall time geq vs png → fps + speedup
 *     (số in ra, không assert ngưỡng cứng vì VM dao động — ngưỡng cảnh báo
 *     trong R2_LIMITS.md lấy từ số đo này).
 *
 * Cách chạy: node src/test_r2.js (cần ffmpeg, ffprobe, python3 + PIL/numpy)
 * File tạm nằm trong os.tmpdir(). Thời gian chạy vài phút (geq 720p chậm —
 * chính là điều benchmark đo).
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r2-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..");

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
function render(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "-y", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  const secs = (Date.now() - t0) / 1000;
  return { status: r.status, stderr: (r.stderr || "").toString(), outPath, secs };
}
function dryRun(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", path.join(work, `${name}.mp4`),
    "--media-dir", mediaDir, "--dry-run", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  return (r.stdout || "").toString() + (r.stderr || "").toString();
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function frameAt(mp4, t, out) {
  run("ffmpeg", ["-ss", String(t), "-i", mp4, "-frames:v", "1", "-y", out], `lấy frame ${mp4}@${t}`);
}
function probeDuration(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", mp4], { encoding: "utf8" });
  return Number((r.stdout || "").trim());
}

const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration, ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r2", width: W, height: H, fps: fps || 30 },
  tracks,
});

// So sánh 2 frame PNG bằng numpy: mean abs diff, max diff, % pixel lệch > 8.
const COMPARE_PY = `
import sys, numpy as np
from PIL import Image
a = np.asarray(Image.open(sys.argv[1]).convert("RGB"), dtype=np.int16)
b = np.asarray(Image.open(sys.argv[2]).convert("RGB"), dtype=np.int16)
d = np.abs(a - b)
print(f"mean={d.mean():.3f} max={d.max()} pctGt8={(d > 8).mean() * 100:.3f}")
`;
const comparePy = path.join(work, "compare.py");
fs.writeFileSync(comparePy, COMPARE_PY);
function compareFrames(pa, pb) {
  const r = spawnSync("python3", [comparePy, pa, pb], { encoding: "utf8" });
  const m = /mean=([\d.]+) max=(\d+) pctGt8=([\d.]+)/.exec(r.stdout || "");
  if (!m) throw new Error(`không parse được kết quả so frame: ${r.stdout} ${r.stderr}`);
  return { mean: Number(m[1]), max: Number(m[2]), pctGt8: Number(m[3]) };
}
// Đo std của frame xám (độ nhiễu) bằng numpy.
const STD_PY = `
import sys, numpy as np
from PIL import Image
g = np.asarray(Image.open(sys.argv[1]).convert("L"), dtype=np.float64)
print(f"std={g.std():.3f}")
`;
const stdPy = path.join(work, "std.py");
fs.writeFileSync(stdPy, STD_PY);
function frameStd(p) {
  const r = spawnSync("python3", [stdPy, p], { encoding: "utf8" });
  const m = /std=([\d.]+)/.exec(r.stdout || "");
  if (!m) throw new Error(`không parse được std: ${r.stdout} ${r.stderr}`);
  return Number(m[1]);
}

// --- Media thật ---
console.log("== Chuẩn bị media ==");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=5",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "clip720.mp4")], "tạo clip720.mp4");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=2",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "clip360.mp4")], "tạo clip360.mp4");
run("ffmpeg", ["-f", "lavfi", "-i", "color=c=0x808080:s=640x360:r=30:d=5",
  "-vf", "noise=alls=25:allf=t",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "noisy.mp4")], "tạo noisy.mp4");
run("ffmpeg", ["-f", "lavfi", "-i", "color=c=red:s=640x360:r=30:d=2",
  "-frames:v", "1", "-y", path.join(mediaDir, "red.png")], "tạo red.png");

const MASK_RECT = { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.2 };
const MASK_ELL_INV = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.6, h: 0.6, feather: 0.3, invert: true };

// --- B: dry-run trước (nhanh) ---
console.log("B: dry-run chứa đúng filter theo mode");
{
  const spec = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clip360.mp4", 2, { mask: MASK_RECT })] }], 640, 360);
  const png = dryRun(spec, "dry-png", ["--mask-mode", "png"]);
  ok(png.includes("movie=") && png.includes("blend=all_mode=multiply"), "mode png: dry-run chứa movie + blend multiply");
  const geq = dryRun(spec, "dry-geq", ["--mask-mode", "geq"]);
  ok(geq.includes("geq=lum="), "mode geq: dry-run chứa geq=lum=");
}

// --- A+G: tương đương + benchmark 720p 5s, mask rect feather ---
console.log("A+G: mask PNG vs geq (720p 5s) — tương đương frame + benchmark fps");
const spec720 = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clip720.mp4", 5, { mask: MASK_RECT })] }], 1280, 720);
const rGeq = render(spec720, "mask-geq", ["--mask-mode", "geq"]);
ok(rGeq.status === 0 && outOk(rGeq.outPath), `render geq OK (${rGeq.secs.toFixed(1)}s)`);
const rPng = render(spec720, "mask-png", ["--mask-mode", "png"]);
ok(rPng.status === 0 && outOk(rPng.outPath), `render png OK (${rPng.secs.toFixed(1)}s)`);
{
  const fGeq = path.join(work, "f-geq.png"), fPng = path.join(work, "f-png.png");
  frameAt(rGeq.outPath, 2.5, fGeq);
  frameAt(rPng.outPath, 2.5, fPng);
  const c = compareFrames(fGeq, fPng);
  console.log(`   📊 frame diff png-vs-geq: mean=${c.mean} max=${c.max} pctGt8=${c.pctGt8}%`);
  ok(c.mean <= 3 && c.pctGt8 <= 1, "frame png ≈ geq (mean ≤ 3, pctGt8 ≤ 1%)");
  const fpsGeq = 150 / rGeq.secs, fpsPng = 150 / rPng.secs;
  console.log(`   📊 benchmark mask 720p: geq ${fpsGeq.toFixed(2)} fps, png ${fpsPng.toFixed(2)} fps, speedup ${(fpsPng / fpsGeq).toFixed(1)}x`);
  ok(fpsPng > fpsGeq, "đường PNG nhanh hơn geq");
}

// --- C: ellipse invert + mask ảnh (đường PNG) ---
console.log("C: ellipse invert + mask ảnh (PNG)");
{
  const spec = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clip360.mp4", 2, { mask: MASK_ELL_INV })] }], 640, 360);
  const r = render(spec, "mask-ell", ["--mask-mode", "png"]);
  ok(r.status === 0 && outOk(r.outPath), "render ellipse invert (PNG) OK");
  const specImg = specWith([
    { id: "v0", kind: "video", clips: [vclip("c0", "clip360.mp4", 2)] },
    { id: "i0", kind: "image", clips: [{ id: "ic0", kind: "image", src: "red.png", start: 0, duration: 2, mask: MASK_RECT }] },
  ], 640, 360);
  const r2 = render(specImg, "mask-img", ["--mask-mode", "png"]);
  ok(r2.status === 0 && outOk(r2.outPath), "render mask cho ảnh (PNG) OK");
}

// --- D: denoise ---
console.log("D: denoise giảm std nhiễu");
{
  const base = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "noisy.mp4", 3)] }], 640, 360);
  const r0 = render(base, "noisy-plain");
  const r1 = render(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "noisy.mp4", 3, { enhance: { denoise: { strength: 1 } } })] }], 640, 360), "noisy-denoise");
  ok(r0.status === 0 && r1.status === 0 && outOk(r1.outPath), "render denoise OK");
  const f0 = path.join(work, "f-n0.png"), f1 = path.join(work, "f-n1.png");
  frameAt(r0.outPath, 1.5, f0);
  frameAt(r1.outPath, 1.5, f1);
  const s0 = frameStd(f0), s1 = frameStd(f1);
  console.log(`   📊 noise std: trước=${s0}, sau denoise=${s1}`);
  ok(s1 < s0 * 0.8, "denoise giảm std xuống dưới 80% bản gốc");
}

// --- E: deinterlace ---
console.log("E: deinterlace");
{
  const spec = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clip360.mp4", 2, { enhance: { deinterlace: true } })] }], 640, 360);
  const dr = dryRun(spec, "dry-deint");
  ok(dr.includes("yadif=mode=0"), "dry-run chứa yadif");
  const r = render(spec, "deint");
  ok(r.status === 0 && outOk(r.outPath), "render deinterlace OK");
}

// --- F: stabilize ---
console.log("F: stabilize 2-pass");
{
  const spec = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clip360.mp4", 2, { enhance: { stabilize: { smoothing: 10 } } })] }], 640, 360);
  const r = render(spec, "stab");
  ok(r.status === 0 && outOk(r.outPath), "render stabilize OK");
  ok(Math.abs(probeDuration(r.outPath) - 2) < 0.3, `thời lượng stabilize đúng (~2s, đo ${probeDuration(r.outPath)})`);
  const plain = render(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clip360.mp4", 2)] }], 640, 360), "stab-plain");
  const fs1 = path.join(work, "f-s1.png"), fs0 = path.join(work, "f-s0.png");
  frameAt(r.outPath, 1.0, fs1);
  frameAt(plain.outPath, 1.0, fs0);
  const c = compareFrames(fs0, fs1);
  console.log(`   📊 frame diff stabilize-vs-plain: mean=${c.mean}`);
  ok(c.mean > 0, "stabilize làm thay đổi frame (transform đã áp)");
}

// --- G (tiếp): mask + denoise cùng lúc (số cho cảnh báo UI) ---
console.log("G: mask + denoise cùng lúc (số cho cảnh báo UI)");
{
  const spec = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clip720.mp4", 5, { mask: MASK_RECT, enhance: { denoise: { strength: 0.5 } } })] }], 1280, 720);
  const r = render(spec, "mask-denoise", ["--mask-mode", "png"]);
  ok(r.status === 0 && outOk(r.outPath), `render mask+denoise OK (${r.secs.toFixed(1)}s)`);
  console.log(`   📊 mask+denoise 720p: ${(150 / r.secs).toFixed(2)} fps`);
}

console.log(`\n== test_r2: ${pass} pass, ${fail} fail (WORK=${work}) ==`);
if (fail > 0) process.exit(1);
