#!/usr/bin/env node
/**
 * test_keyframes_sr.js — Test THẬT keyframes scale/rotation cho video clip.
 *
 * Render bằng chính render.js (không mock), trích frame, đo pixel bằng PIL
 * (test_keyframes_sr.py) và khẳng định:
 *   A1. scale 1→2: hình chữ nhật trắng phình ra đúng theo thời gian.
 *   A2. scale 0.5 + x 0→1: element nhỏ hơn khung → keyframes x CÓ tác dụng
 *       (trước đây x/y vô hình vì unit luôn full khung — xem KEYFRAMES_LIMITS).
 *   B.  rotation 0→90°: ô đỏ ở đỉnh di chuyển theo chiều kim đồng hồ về phía phải.
 *   C.  scale/rotation + transition: validator CẢNH BÁO và render bỏ qua SR
 *       cho unit đã merge (hình giữ nguyên kích thước).
 *   R1. Regression: clip không animations render như cũ.
 *   R2. Regression: keyframes x/y thuần (không SR) giữ nguyên quirk cũ
 *       (không di chuyển nhìn thấy).
 *
 * Cách chạy: node src/test_keyframes_sr.js   (cần ffmpeg, ffprobe, python3+PIL)
 * File tạm nằm trong os.tmpdir() — đặt TMPDIR về workspace nếu /tmp nhỏ.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { validateSpec } = require("./validate");

const W = 640, H = 360, FPS = 30;
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-kfsr-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function approx(got, want, tol, msg) {
  ok(typeof got === "number" && Math.abs(got - want) <= tol,
    `${msg} (nhận ${got}, muốn ~${want} ±${tol})`);
}
function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return r;
}

// --- Tạo media tổng hợp: rect.mp4 (nền đen + chữ nhật trắng 320x180 ở giữa),
//     sq.mp4 (nền trắng + ô đỏ 60x60 đỉnh-giữa), blue.mp4 (xanh đặc) ---
function makeMedia() {
  const enc = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-an"];
  run("ffmpeg", ["-f", "lavfi", "-i", `color=c=black:s=${W}x${H}:r=${FPS}:d=5`,
    "-vf", "drawbox=x=160:y=90:w=320:h=180:color=white:t=fill",
    ...enc, "-y", path.join(mediaDir, "rect.mp4")], "tạo rect.mp4");
  run("ffmpeg", ["-f", "lavfi", "-i", `color=c=white:s=${W}x${H}:r=${FPS}:d=5`,
    "-vf", "drawbox=x=290:y=0:w=60:h=60:color=red:t=fill",
    ...enc, "-y", path.join(mediaDir, "sq.mp4")], "tạo sq.mp4");
  run("ffmpeg", ["-f", "lavfi", "-i", `color=c=blue:s=${W}x${H}:r=${FPS}:d=4`,
    ...enc, "-y", path.join(mediaDir, "blue.mp4")], "tạo blue.mp4");
}

function spec(clips, name) {
  return {
    version: "0.2.0",
    meta: { name, width: W, height: H, fps: FPS },
    tracks: [{ id: "v1", kind: "video", label: "Video", clips }],
  };
}
const vclip = (id, src, start, duration, extra = {}) => ({
  id, kind: "video", src, start, duration, in: 0, out: duration, ...extra,
});
const kf = (pairs) => ({
  keyframes: pairs.map(([t, v]) => ({ t, v, easing: "linear" })),
});

function render(specObj, name) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(specObj, null, 2));
  const out = path.join(work, `${name}.mp4`);
  const r = spawnSync("node", [
    path.join(__dirname, "render.js"),
    "--spec", specPath, "--out", out, "--media-dir", mediaDir,
    "--x264-preset", "veryfast", "--crf", "23", "-y", "-q",
  ], { stdio: ["ignore", "pipe", "pipe"] });
  if (r.status !== 0) {
    console.error(`❌ render "${name}" thất bại:\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return out;
}

function frameAt(mp4, t) {
  const png = path.join(work, `f-${path.basename(mp4, ".mp4")}-${t}.png`);
  run("ffmpeg", ["-v", "error", "-ss", String(t), "-i", mp4,
    "-vframes", "1", "-y", png], `trích frame t=${t}`);
  return png;
}
function measure(png, mode) {
  const r = run("python3", [path.join(__dirname, "test_keyframes_sr.py"), png, mode],
    `đo pixel ${mode}`);
  return JSON.parse(r.stdout.toString());
}
const bboxW = (m) => (m.bbox ? m.bbox[2] - m.bbox[0] + 1 : 0);
const bboxH = (m) => (m.bbox ? m.bbox[3] - m.bbox[1] + 1 : 0);

function main() {
  makeMedia();

  // ---------- A1: scale 1 → 2 ----------
  console.log("A1: scale keyframes 1→2 (4s)");
  const specA1 = spec([vclip("a1", "rect.mp4", 0, 4, {
    animations: { scale: kf([[0, 1], [4, 2]]) },
  })], "a1-scale");
  const vA1 = validateSpec(specA1);
  ok(vA1.ok, "spec A1 hợp lệ");
  ok(!vA1.warnings.some((w) => w.includes("chưa áp dụng")),
    "validator KHÔNG còn cảnh báo 'chưa áp dụng' cho video scale");
  const outA1 = render(specA1, "a1");
  // t=0.2: s=1.05 → rect 336x189; t=3.8: s=1.95 → rect 624x351
  const a1Early = measure(frameAt(outA1, 0.2), "white");
  const a1Late = measure(frameAt(outA1, 3.8), "white");
  approx(bboxW(a1Early), 336, 16, "A1 t=0.2: bề ngang rect ~336 (scale 1.05)");
  approx(bboxH(a1Early), 189, 12, "A1 t=0.2: bề cao rect ~189");
  approx(bboxW(a1Late), 624, 16, "A1 t=3.8: bề ngang rect ~624 (scale 1.95)");
  approx(bboxH(a1Late), 351, 12, "A1 t=3.8: bề cao rect ~351");
  approx(a1Late.centroid[0], 320, 10, "A1: rect vẫn căn giữa khung khi scale");

  // ---------- A2: scale 0.5 hằng số + x 0→1 (x bắt đầu có tác dụng) ----------
  console.log("A2: scale 0.5 + x keyframes 0→1");
  const specA2 = spec([vclip("a2", "rect.mp4", 0, 4, {
    animations: { scale: kf([[0, 0.5]]), x: kf([[0, 0], [4, 1]]) },
  })], "a2-scale-x");
  const outA2 = render(specA2, "a2");
  // element 320x180; rect trong element 160x90 ở tâm element.
  // t=0.2: x frac=0.05 → mép trái element = 0.05*(640-320)=16 → tâm rect x = 16+160=176
  // t=3.8: x frac=0.95 → mép trái = 304 → tâm rect x = 464
  const a2Early = measure(frameAt(outA2, 0.2), "white");
  const a2Late = measure(frameAt(outA2, 3.8), "white");
  approx(bboxW(a2Early), 160, 12, "A2: rect thu còn ~160 ngang (scale 0.5)");
  approx(bboxH(a2Early), 90, 10, "A2: rect thu còn ~90 cao");
  approx(a2Early.centroid[0], 176, 18, "A2 t=0.2: rect ở phía trái theo x≈0.05");
  approx(a2Late.centroid[0], 464, 18, "A2 t=3.8: rect trôi sang phải theo x≈0.95");
  approx(a2Late.centroid[1], 180, 12, "A2: rect vẫn giữa theo chiều dọc");

  // ---------- A3: SR trên track trên → vùng ngoài element phải TRONG SUỐT ----------
  console.log("A3: scale 0.75 + rotation 45° trên track trên, track dưới là nền xanh");
  const specA3 = {
    version: "0.2.0",
    meta: { name: "a3-alpha", width: W, height: H, fps: FPS },
    tracks: [
      { id: "v1", kind: "video", label: "Dưới", clips: [vclip("bg", "blue.mp4", 0, 4)] },
      {
        id: "v2", kind: "video", label: "Trên",
        clips: [vclip("a3", "rect.mp4", 0, 4, {
          animations: { scale: kf([[0, 0.75]]), rotation: kf([[0, 45]]) },
        })],
      },
    ],
  };
  const outA3 = render(specA3, "a3");
  const a3png = frameAt(outA3, 1.0);
  const a3Blue = measure(a3png, "blue");
  const a3White = measure(a3png, "white");
  // Góc khung (0..40, 0..40) nằm ngoài hình bao đã xoay → phải là xanh của track dưới.
  const rCorner = run("python3", [path.join(__dirname, "test_keyframes_sr.py"),
    a3png, "blue"], "đo góc xanh");
  ok(a3Blue.count > 20000,
    `A3: phần lớn khung là xanh track dưới lộ qua vùng trong suốt (blue=${a3Blue.count}px)`);
  ok(a3White.count > 8000,
    `A3: rect trắng của element vẫn thấy rõ sau scale+rotate (white=${a3White.count}px)`);
  approx(a3White.centroid[0], 320, 15, "A3: element vẫn tâm giữa khung");
  approx(a3White.centroid[1], 180, 15, "A3: element vẫn tâm giữa khung (dọc)");
  void rCorner;

  // ---------- B: rotation 0 → 90° ----------
  console.log("B: rotation keyframes 0→90° (4s)");
  const specB = spec([vclip("b1", "sq.mp4", 0, 4, {
    animations: { rotation: kf([[0, 0], [4, 90]]) },
  })], "b-rotation");
  const outB = render(specB, "b");
  // Ô đỏ 60x60 tâm ở (320, 30) trong element, tâm element (320, 180) → lệch (0,-150).
  // Xoay kim đồng hồ θ: lệch → (150·sinθ, -150·cosθ).
  const bEarly = measure(frameAt(outB, 0.2), "red");   // θ=4.5°
  const bMid = measure(frameAt(outB, 2.0), "red");     // θ=45° → tâm ≈ (426, 74)
  const bLate = measure(frameAt(outB, 3.8), "red");    // θ=85.5° → tâm ≈ (470, 168)
  ok(bEarly.count > 500, "B t=0.2: thấy ô đỏ");
  approx(bEarly.centroid[0], 320, 45, "B t=0.2: ô đỏ còn ở đỉnh-giữa (x)");
  ok(bEarly.centroid[1] < 85, `B t=0.2: ô đỏ ở phía trên (y=${bEarly.centroid[1]} < 85)`);
  ok(bMid.centroid[0] > 375, `B t=2.0 (45°): ô đỏ đã sang phải-trên (x=${bMid.centroid[0]} > 375)`);
  ok(bMid.centroid[1] < 120, `B t=2.0 (45°): ô đỏ còn ở phía trên (y=${bMid.centroid[1]} < 120)`);
  ok(bLate.centroid[0] > 415, `B t=3.8 (85.5°): ô đỏ ở mép phải (x=${bLate.centroid[0]} > 415)`);
  approx(bLate.centroid[1], 180, 50, "B t=3.8: ô đỏ về giữa theo chiều dọc (xoay ~90°)");

  // ---------- C: SR + transition → cảnh báo + bỏ qua SR ----------
  console.log("C: scale keyframes + transition");
  const specC = spec([
    vclip("c1", "rect.mp4", 0, 3, {
      animations: { scale: kf([[0, 1], [3, 2]]) },
      transitionOut: { type: "fade", duration: 1 },
    }),
    vclip("c2", "blue.mp4", 3, 3),
  ], "c-transition");
  const vC = validateSpec(specC);
  ok(vC.ok, "spec C hợp lệ");
  ok(vC.warnings.some((w) => w.includes("scale/rotation") && w.includes("transition")),
    `validator cảnh báo SR+transition (warnings: ${JSON.stringify(vC.warnings)})`);
  const outC = render(specC, "c");
  const cMid = measure(frameAt(outC, 1.0), "white");
  approx(bboxW(cMid), 320, 14, "C t=1.0: rect GIỮ NGUYÊN 320 (SR bị bỏ qua cho unit merge)");
  approx(bboxH(cMid), 180, 12, "C t=1.0: rect giữ nguyên 180 cao");

  // ---------- R1: regression — không animations ----------
  console.log("R1: regression clip thường");
  const outR1 = render(spec([vclip("r1", "rect.mp4", 0, 4)], "r1-plain"), "r1");
  const r1 = measure(frameAt(outR1, 1.0), "white");
  approx(bboxW(r1), 320, 10, "R1: rect 320 ngang như trước");
  approx(bboxH(r1), 180, 10, "R1: rect 180 cao như trước");
  approx(r1.centroid[0], 320, 8, "R1: rect căn giữa như trước");

  // ---------- R2: regression — x/y thuần giữ quirk cũ ----------
  console.log("R2: regression keyframes x/y thuần (không SR)");
  const specR2 = spec([vclip("r2", "rect.mp4", 0, 4, {
    animations: { x: kf([[0, 0], [4, 1]]) },
  })], "r2-xy");
  const outR2 = render(specR2, "r2");
  const r2 = measure(frameAt(outR2, 3.8), "white");
  approx(r2.centroid[0], 320, 10,
    "R2: x keyframes vẫn vô hình khi unit full khung (quirk giữ nguyên, đã ghi LIMITS)");

  console.log(`\n${fail === 0 ? "✅" : "❌"} test_keyframes_sr: ${pass} pass, ${fail} fail`);
  console.log(`   (file tạm: ${work})`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
