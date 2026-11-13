#!/usr/bin/env node
/**
 * test_round87_o3_mask_track_geq.js — Test THẬT Phase 9 đợt 87 O3:
 * geq động bám motion track (đường thay thế) vs mask tĩnh PNG / geq tĩnh.
 *
 * Render bằng chính render.js (không mock), clip 720p 4s, chạy TUẦN TỰ
 * (RAM VM ~0.5GB khả dụng). Đo bằng numpy trên frame PNG trích ra:
 *  A. Độ chính xác vị trí: centroid vùng sáng (nguồn đỏ phẳng) tại
 *     t=0.5/2.0/3.5 so với kỳ vọng track (0.275/0.5/0.725, y=0.5).
 *  B. Tốc độ: fps = frames / wall time từng render.
 *  C. Chất lượng biên: độ rộng chuyển tiếp 10%→90% trên profile ngang qua
 *     tâm mask (feather band kỳ vọng 43.2px → 10-90% ≈ 34.6px).
 *  D. Phân biệt ngữ nghĩa trackgeq vs D3+mask tĩnh: nguồn gradient ngang —
 *     trackgeq cho thấy vùng nguồn QUANH điểm track (mean luma đổi theo t),
 *     còn D3+mask tĩnh luôn cho thấy vùng GIỮA nguồn (mean luma hằng).
 *  E. Khả thi biểu thức dài: track 20 điểm, 360p 2s, render thật OK.
 *
 * Cách chạy: node src/test_round87_o3_mask_track_geq.js [a|ac|d|e|de|all]
 *   (mặc định all). Đợt 89 Q3 thêm selector theo mẫu harness P4: sóng EPERM
 *   của VM (~17 phút/sóng, khoảng lặng ~9 phút) ngắn hơn một lần chạy full
 *   (~16 phút) nên một process duy nhất khó qua được cả 5 render geq;
 *   chia section KHÔNG bỏ section nào — mọi section đều phải xanh.
 * File tạm trong os.tmpdir(). Thời gian chạy ~10 phút (geq 720p ~1fps).
 *
 * Đợt 89 Q3 tái tạo file này từ bản gốc đợt 87 (file bị python ghi đè
 * thành 0 byte khi sóng EPERM giết lệnh write — bài học: không dùng
 * open(f,"w") từ exec khi đang có sóng, dùng muse.edit/muse.write).
 * Nội dung đo (assert, kỳ vọng, ngưỡng) giữ nguyên bản gốc đợt 87; chỉ
 * thêm: retry EPERM cho run()/render(), selector section, và ghi chú này.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs"); // Đợt 87 closing: nối nốt 2 dòng O10 để lại

const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r87o3-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..");
// Đợt 89 Q3: selector section (mẫu harness P4) — xem header.
const SECTION = process.argv[2] || "all";
const SECTIONS = new Set(SECTION === "all" ? ["a", "c", "d", "e"]
  : SECTION === "ac" ? ["a", "c"]
  : SECTION === "de" ? ["d", "e"]
  : [SECTION]);
for (const s of SECTIONS) {
  if (!["a", "c", "d", "e"].includes(s)) {
    console.error(`section không hợp lệ: ${SECTION} (dùng a|ac|d|e|de|all)`);
    process.exit(2);
  }
}

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
// Đợt 89 Q3: sóng EPERM của VM (ghi file fail "Operation not permitted"
// từng cơn, xem probe EPERM v2 của P8 đợt 88) có thể giết một bước ffmpeg
// bất kỳ — retry CHỈ khi stderr chứa đúng chữ ký EPERM, tối đa 12 lần,
// cách nhau 30s (~6 phút/bước). Lỗi thật (không phải EPERM) vẫn fail ngay
// lần đầu. Cùng triết lý với writeFileEpermRetry đã dùng cho ghi spec.
function isEperm(text) { return (text || "").includes("Operation not permitted"); }
function sleepSync(ms) {
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch { /* ignore */ }
}
function run(cmd, args, label, cwd) {
  for (let attempt = 1; attempt <= 12; attempt++) {
    const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], cwd });
    if (!r.error && r.status === 0) return r;
    const errText = (r.stderr || "").toString();
    if (isEperm(errText) && attempt < 12) {
      console.log(`   ⚠️  bước "${label}" dính sóng EPERM (lần ${attempt}/12) — thử lại sau 30s`);
      sleepSync(30000);
      continue;
    }
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${errText.slice(-1500)}`);
    process.exit(2);
  }
}
function render(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  // Đợt 89 Q3: budget retry như bước ffmpeg (xem measure.py).
  writeFileEpermRetry(specPath, JSON.stringify(spec), { label: "test-r87-o3-spec", tries: 12, delayMs: 30000 });
  const outPath = path.join(work, `${name}.mp4`);
  // Đợt 89 Q3: retry EPERM như run() — render dài 100-230s, sóng EPERM
  // giữa chừng sẽ giết cả render (ghi mp4 fail); render lại từ đầu là
  // idempotent (-y ghi đè). Chỉ retry đúng chữ ký EPERM.
  for (let attempt = 1; attempt <= 12; attempt++) {
    const t0 = Date.now();
    const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", outPath,
      "--media-dir", mediaDir, "-y", ...(extraArgs || [])],
      { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], timeout: 900000 });
    const secs = (Date.now() - t0) / 1000;
    if (!r.error && r.status === 0) return { status: r.status, outPath, secs };
    const errText = (r.stderr || "").toString();
    if (isEperm(errText) && attempt < 12) {
      console.log(`   ⚠️  render "${name}" dính sóng EPERM (lần ${attempt}/12, sau ${secs.toFixed(1)}s) — render lại sau 30s`);
      sleepSync(30000);
      continue;
    }
    console.error(`❌ render "${name}" thất bại (mã ${r.status}):\n${errText.slice(-2000)}`);
    process.exit(2);
  }
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function frameAt(mp4, t, out) {
  run("ffmpeg", ["-ss", String(t), "-i", mp4, "-frames:v", "1", "-y", out], `lấy frame ${mp4}@${t}`);
}

// Đo centroid vùng đỏ + profile feather + mean luma bằng numpy.
const MEASURE_PY = `
import sys, numpy as np
from PIL import Image
p = sys.argv[1]
img = np.asarray(Image.open(p).convert("RGB")).astype(np.float64)
r = img[:, :, 0]
# centroid vùng sáng (R > 128): mask giữ nguồn đỏ, ngoài mask = đen
ys, xs = np.where(r > 128)
cx = float(xs.mean()) if len(xs) else -1
cy = float(ys.mean()) if len(ys) else -1
n = int(len(xs))
# profile ngang qua hàng cy (làm tròn): tìm biên trái, độ rộng 10%->90%
row = r[int(round(cy)), :]
peak = row.max()
x10 = x90 = -1
# biên trái: quét từ trái vào tới khi vượt 10% rồi 90% peak
above10 = np.where(row > 0.10 * peak)[0]
above90 = np.where(row > 0.90 * peak)[0]
if len(above10) and len(above90):
    x10 = int(above10[0]); x90 = int(above90[0])
print(f"cx={cx:.1f} cy={cy:.1f} n={n} meanLuma={img.mean():.2f} edge10={x10} edge90={x90} trans90_10={x90 - x10 if x10 >= 0 else -1}")
`;
const measurePy = path.join(work, "measure.py");
// Đợt 89 Q3: ghi measure.py cũng cần budget retry như bước ffmpeg
// (mặc định 5×20s của helper chết sau 80s khi sóng dài) — sóng EPERM
// đợt này dài 25+ phút, harness render dài phải chịu được sóng tới ~6 phút.
writeFileEpermRetry(measurePy, MEASURE_PY, { label: "test-r87-o3-measure-py", tries: 12, delayMs: 30000 });
function measure(p) {
  const r = spawnSync("python3", [measurePy, p], { encoding: "utf8" });
  const m = /cx=([-\d.]+) cy=([-\d.]+) n=(\d+) meanLuma=([\d.]+) edge10=(-?\d+) edge90=(-?\d+) trans90_10=(-?\d+)/.exec(r.stdout || "");
  if (!m) throw new Error(`không parse được measure: ${r.stdout} ${r.stderr}`);
  return { cx: Number(m[1]), cy: Number(m[2]), n: Number(m[3]), meanLuma: Number(m[4]), edge10: Number(m[5]), edge90: Number(m[6]), trans: Number(m[7]) };
}

const TRACK3 = { points: [
  { t: 0, x: 0.2, y: 0.5 },
  { t: 2, x: 0.5, y: 0.5 },
  { t: 4, x: 0.8, y: 0.5 },
] };
const MASK_ELL = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.3, feather: 0.2 };
const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration, ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r87o3", width: W, height: H, fps: fps || 30 },
  tracks,
});
const expectX = (t) => 0.2 + 0.15 * t; // track tuyến tính 0.2→0.8 trong 4s
const times = [0.5, 2.0, 3.5];

// --- Media thật ---
function prepareMedia() {
console.log("== Chuẩn bị media ==");
run("ffmpeg", ["-f", "lavfi", "-i", "color=c=red:s=1280x720:r=30:d=4",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "red720.mp4")], "tạo red720.mp4");
// Gradient ngang 0..255 (đen→trắng) để phân biệt vùng nguồn nhìn thấy.
const GRAD_PY = `
import numpy as np
from PIL import Image
W, H = 1280, 720
g = np.tile(np.linspace(0, 255, W, dtype=np.uint8), (H, 1))
Image.fromarray(g, "L").convert("RGB").save("${path.join(mediaDir, "grad720.png")}")
`;
run("python3", ["-c", GRAD_PY], "vẽ grad720.png");
run("ffmpeg", ["-loop", "1", "-i", path.join(mediaDir, "grad720.png"),
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-r", "30", "-t", "4", "-an", "-y", path.join(mediaDir, "grad720.mp4")], "tạo grad720.mp4");
run("ffmpeg", ["-f", "lavfi", "-i", "color=c=red:s=640x360:r=30:d=2",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "red360.mp4")], "tạo red360.mp4");
}

// Section A: renders 1-3 + đo vị trí centroid. Trả về dynMeas cho section C.
function sectionA() {
// --- 1. trackgeq động (nguồn đỏ) ---
console.log("1: trackgeq động, nguồn đỏ 720p 4s");
const specDyn = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "red720.mp4", 4, { mask: MASK_ELL, track: TRACK3 })] }], 1280, 720);
const rDyn = render(specDyn, "dyn-trackgeq", ["--mask-mode", "trackgeq"]);
ok(rDyn.status === 0 && outOk(rDyn.outPath), `render trackgeq OK (${rDyn.secs.toFixed(1)}s)`);
console.log(`   📊 trackgeq 720p 4s: ${(120 / rDyn.secs).toFixed(2)} fps (120 frame / ${rDyn.secs.toFixed(1)}s)`);

// --- 2. PNG tĩnh tại x=0.5 (đối chứng t=2) ---
console.log("2: PNG tĩnh x=0.5, nguồn đỏ");
const specPngMid = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "red720.mp4", 4, { mask: MASK_ELL })] }], 1280, 720);
const rPngMid = render(specPngMid, "png-mid", ["--mask-mode", "png"]);
ok(rPngMid.status === 0 && outOk(rPngMid.outPath), `render png-mid OK (${rPngMid.secs.toFixed(1)}s)`);
console.log(`   📊 png tĩnh 720p 4s: ${(120 / rPngMid.secs).toFixed(2)} fps`);

// --- 3. geq tĩnh x=0.5 + track (D3 shift còn bật) — đối chứng double-shift ---
console.log("3: geq tĩnh x=0.5 + track (D3 shift bật), nguồn đỏ");
const specGeqMid = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "red720.mp4", 4, { mask: MASK_ELL, track: TRACK3 })] }], 1280, 720);
const rGeqMid = render(specGeqMid, "geq-mid-track", ["--mask-mode", "geq"]);
ok(rGeqMid.status === 0 && outOk(rGeqMid.outPath), `render geq-mid-track OK (${rGeqMid.secs.toFixed(1)}s)`);
console.log(`   📊 geq tĩnh 720p 4s: ${(120 / rGeqMid.secs).toFixed(2)} fps`);

// --- A. Vị trí centroid tại 3 thời điểm ---
console.log("A: vị trí centroid (kỳ vọng x=352/640/928, y=360)");
const dynMeas = {}, geqMeas = {};
for (const t of times) {
  const f = path.join(work, `f-dyn-${t}.png`);
  frameAt(rDyn.outPath, t, f);
  const m = measure(f);
  dynMeas[t] = m;
  const ex = expectX(t) * 1280;
  console.log(`   📊 trackgeq t=${t}: cx=${m.cx} (kỳ vọng ${ex.toFixed(0)}, lệch ${(m.cx - ex).toFixed(1)}px) cy=${m.cy}`);
  ok(Math.abs(m.cx - ex) <= 5 && Math.abs(m.cy - 360) <= 5, `trackgeq t=${t} bám đúng vị trí (lệch ≤5px)`);
  const fg = path.join(work, `f-geq-${t}.png`);
  frameAt(rGeqMid.outPath, t, fg);
  const mg = measure(fg);
  geqMeas[t] = mg;
  console.log(`   📊 geq tĩnh+D3 t=${t}: cx=${mg.cx} (kỳ vọng ${ex.toFixed(0)} nếu D3 kéo tâm về track) cy=${mg.cy}`);
  ok(Math.abs(mg.cx - ex) <= 5, `geq tĩnh+D3 t=${t} tâm cũng về track (mask tĩnh tâm 0.5 + shift D3)`);
}
// PNG tĩnh tại t=2 phải trùng tâm 640
{
  const f = path.join(work, "f-pngmid-2.png");
  frameAt(rPngMid.outPath, 2.0, f);
  const m = measure(f);
  console.log(`   📊 png tĩnh t=2.0: cx=${m.cx} cy=${m.cy} (kỳ vọng 640/360)`);
  ok(Math.abs(m.cx - 640) <= 5 && Math.abs(m.cy - 360) <= 5, "png tĩnh t=2 đúng tâm 640");
}
return dynMeas;
}

// Section C: renders 4-5 + đo feather (cần dynMeas của section A).
function sectionC(dynMeas) {
// --- 4+5. PNG tĩnh tại x=0.275 và 0.725 (feather tại đúng vị trí) ---
console.log("4+5: PNG tĩnh x=0.275 / x=0.725 (feather đối chứng)");
const rPngL = render(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "red720.mp4", 4, { mask: { ...MASK_ELL, x: 0.275 } })] }], 1280, 720), "png-left", ["--mask-mode", "png"]);
const rPngR = render(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "red720.mp4", 4, { mask: { ...MASK_ELL, x: 0.725 } })] }], 1280, 720), "png-right", ["--mask-mode", "png"]);
ok(rPngL.status === 0 && outOk(rPngL.outPath) && rPngR.status === 0 && outOk(rPngR.outPath), "render png-left/right OK");

// --- C. Feather: độ rộng chuyển tiếp 10%→90% (kỳ vọng ≈ 0.8*43.2 = 34.6px) ---
console.log("C: feather (độ rộng chuyển tiếp 10%→90%, kỳ vọng ≈34.6px)");
console.log(`   📊 trackgeq t=0.5: trans=${dynMeas[0.5].trans}px | t=2.0: ${dynMeas[2.0].trans}px | t=3.5: ${dynMeas[3.5].trans}px`);
for (const t of times) {
  ok(dynMeas[t].trans >= 25 && dynMeas[t].trans <= 45, `trackgeq feather t=${t} trong khoảng 25..45px (đo ${dynMeas[t].trans})`);
}
{
  const fl = path.join(work, "f-pngleft-05.png"), fr = path.join(work, "f-pngright-35.png");
  frameAt(rPngL.outPath, 0.5, fl);
  frameAt(rPngR.outPath, 3.5, fr);
  const ml = measure(fl), mr = measure(fr);
  console.log(`   📊 png tĩnh t=0.5 (x=0.275): trans=${ml.trans}px, cx=${ml.cx} | t=3.5 (x=0.725): trans=${mr.trans}px, cx=${mr.cx}`);
  ok(Math.abs(dynMeas[0.5].trans - ml.trans) <= 6, `feather trackgeq≈png tại t=0.5 (${dynMeas[0.5].trans} vs ${ml.trans})`);
  ok(Math.abs(dynMeas[3.5].trans - mr.trans) <= 6, `feather trackgeq≈png tại t=3.5 (${dynMeas[3.5].trans} vs ${mr.trans})`);
}
}

// Section D: gradient — vùng nguồn nhìn thấy.
function sectionD() {
// --- D. Gradient: vùng nguồn nhìn thấy ---
console.log("D: gradient — vùng nguồn nhìn thấy (mean luma frame)");
const rGradDyn = render(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "grad720.mp4", 4, { mask: MASK_ELL, track: TRACK3 })] }], 1280, 720), "grad-trackgeq", ["--mask-mode", "trackgeq"]);
const rGradGeq = render(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "grad720.mp4", 4, { mask: MASK_ELL, track: TRACK3 })] }], 1280, 720), "grad-geq-track", ["--mask-mode", "geq"]);
ok(rGradDyn.status === 0 && rGradGeq.status === 0, "render gradient trackgeq + geq-track OK");
const gradDyn = {}, gradGeq = {};
for (const t of times) {
  const f1 = path.join(work, `f-gd-${t}.png`), f2 = path.join(work, `f-gg-${t}.png`);
  frameAt(rGradDyn.outPath, t, f1);
  frameAt(rGradGeq.outPath, t, f2);
  gradDyn[t] = measure(f1).meanLuma;
  gradGeq[t] = measure(f2).meanLuma;
  console.log(`   📊 t=${t}: trackgeq meanLuma=${gradDyn[t]} | geq tĩnh+D3 meanLuma=${gradGeq[t]}`);
}
// Kỳ vọng trackgeq: mean luma tăng theo t (vùng nguồn dịch phải, gradient sáng dần).
// Diện tích mask ≈ π*192*108 px ≈ 7.07% frame; mean ≈ 0.0707 * (cx/1280*255).
// t=0.5: ~4.9, t=2: ~9.0, t=3.5: ~13.1 (sai số encode ±1.5).
ok(gradDyn[0.5] < gradDyn[2.0] - 1 && gradDyn[2.0] < gradDyn[3.5] - 1,
  `trackgeq mean luma tăng theo t (${gradDyn[0.5]} < ${gradDyn[2.0]} < ${gradDyn[3.5]})`);
ok(Math.abs(gradGeq[0.5] - gradGeq[3.5]) < 2,
  `geq tĩnh+D3 mean luma gần như hằng (${gradGeq[0.5]} vs ${gradGeq[3.5]} — luôn thấy giữa nguồn)`);
}

// Section E: track 20 điểm, 360p 2s.
function sectionE() {
// --- E. Track 20 điểm, 360p 2s ---
console.log("E: track 20 điểm, 360p 2s (khả thi biểu thức dài)");
const track20 = { points: Array.from({ length: 20 }, (_, i) => ({ t: (i * 2) / 19, x: 0.2 + (0.6 * i) / 19, y: 0.5 })) };
const r20 = render(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "red360.mp4", 2, { mask: { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.3, feather: 0.2 }, track: track20 })] }], 640, 360), "dyn-20pt", ["--mask-mode", "trackgeq"]);
ok(r20.status === 0 && outOk(r20.outPath), `render track 20 điểm 360p OK (${r20.secs.toFixed(1)}s)`);
console.log(`   📊 track 20 điểm 360p 2s: ${(60 / r20.secs).toFixed(2)} fps`);
{
  const f = path.join(work, "f-20pt-1.png");
  frameAt(r20.outPath, 1.0, f);
  const m = measure(f);
  // t=1: x kỳ vọng = 0.2+0.6*(1/2)=0.5 → 320px trên 640
  console.log(`   📊 track 20 điểm t=1.0: cx=${m.cx} (kỳ vọng 320) cy=${m.cy} (kỳ vọng 180)`);
  ok(Math.abs(m.cx - 320) <= 5 && Math.abs(m.cy - 180) <= 5, "track 20 điểm bám đúng vị trí t=1");
}
}

// --- Dispatch (đợt 89 Q3: selector section, xem header) ---
prepareMedia();
let dynMeas = null;
if (SECTIONS.has("a")) dynMeas = sectionA();
if (SECTIONS.has("c")) {
  if (!dynMeas) dynMeas = sectionA(); // C cần dynMeas của A
  sectionC(dynMeas);
}
if (SECTIONS.has("d")) sectionD();
if (SECTIONS.has("e")) sectionE();

console.log(`\n== test_round87_o3 (${SECTION}): ${pass} pass, ${fail} fail (WORK=${work}) ==`);
if (fail > 0) process.exit(1);
