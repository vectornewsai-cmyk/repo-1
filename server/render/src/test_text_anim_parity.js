#!/usr/bin/env node
/**
 * test_text_anim_parity.js — Test THẬT text animation parity rotate/skew/clip
 * (Phase 9 đợt 10, luồng V4, gap C5).
 *
 * Render bằng chính render.js (không mock) 1 spec có 4 text clip parity
 * trên 4 text track (cùng nền video đen), trích frame, đo pixel bằng PIL
 * (test_text_anim_parity_measure.py) và khẳng định:
 *   T1. tiltIn: chữ xoay thật — hiệu (tâm-top − tâm-bottom) lúc 0.15s
 *       âm mạnh hơn hẳn lúc đã đứng yên (1.5s).
 *   T2. skewIn: chữ nghiêng thật — hiệu top−bottom lúc 0.15s (fax ≈ -0.21)
 *       lớn hơn hẳn lúc đã thẳng (0.7s, fax = 0).
 *   T3. slideReveal: lúc 0.3s mép cắt HỘP CHỮ đã tới x≈278 (hộp đo PIL
 *       249px × LIBASS_SCALE 0.84 ≈ 209px, hộp [215,425]) nên đã lộ
 *       một phần chữ — đây chính là điểm phân biệt với quét khung hình
 *       cũ (mép khung 0.3s mới tới x=192, chưa chạm chữ nên count=0);
 *       lúc 0.45s mép tới x≈310; lúc 1.5s chữ hiện đủ (max-x > 400).
 *   T4. curtainIn: lúc 0.4s (mở 50%) pixel chữ chỉ trong khe HỘP CHỮ
 *       [262, 378] (hộp CURTAIN đo PIL 276px × 0.84 ≈ 232px, [204,436]);
 *       lúc 1.5s chữ hiện đủ hai phía (min-x < 210, max-x > 420).
 *   R1. Regression: clip fadeUp (drawtext) vẫn render như cũ.
 *   V1. Validator: spec parity hợp lệ; parity + SR keyframes và parity +
 *       track đều sinh cảnh báo (ASS thắng, SR/track bị bỏ qua).
 *
 * Bố cục đo (fontSize 64, W=640, H=360; dải đo ±32px quanh tâm chữ):
 *   tilt    y=0.20 (tâm 72)  — dải [40, 104]
 *   skew    y=0.42 (tâm 151) — dải [119, 183]
 *   reveal  y=0.64 (tâm 230) — dải [198, 262]
 *   curtain y=0.86 (tâm 310) — dải [278, 342]
 * (xem test_text_anim_parity_measure.py — dải đo phải khớp bố cục này).
 *
 * Cách chạy: node src/test_text_anim_parity.js (cần ffmpeg, python3+PIL)
 * File tạm nằm trong os.tmpdir().
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { validateSpec } = require("./validate");

const W = 640, H = 360, FPS = 30;
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-parity-"));
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
  run("ffmpeg", ["-v", "error", "-i", mp4, "-ss", String(t),
    "-vframes", "1", "-y", png], `trích frame t=${t}`);
  return png;
}
function measure(png) {
  const r = run("python3", [path.join(__dirname, "test_text_anim_parity_measure.py"), png],
    `đo pixel ${png}`);
  return JSON.parse(r.stdout.toString());
}

const tclip = (id, text, anim, y) => ({
  kind: "text", id, text, start: 0, duration: 4,
  style: {
    fontFamily: "DejaVu Sans", fontSize: 64, color: "#ffffff",
    x: 0.5, y, animation: anim,
  },
});
function paritySpec() {
  return {
    version: "0.2.0",
    meta: { name: "parity", width: W, height: H, fps: FPS, duration: 4 },
    tracks: [
      { id: "v0", kind: "video", label: "Nền",
        clips: [{ kind: "video", id: "bg", src: "bg.mp4", start: 0, duration: 4, in: 0, out: 4 }] },
      { id: "t1", kind: "text", label: "Tilt", clips: [tclip("tilt", "TILTED", "tiltIn", 0.20)] },
      { id: "t2", kind: "text", label: "Skew", clips: [tclip("skew", "SKEWED", "skewIn", 0.42)] },
      { id: "t3", kind: "text", label: "Reveal", clips: [tclip("rev", "REVEAL", "slideReveal", 0.64)] },
      { id: "t4", kind: "text", label: "Curtain", clips: [tclip("cur", "CURTAIN", "curtainIn", 0.86)] },
    ],
  };
}

function main() {
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `color=c=0x000000:s=${W}x${H}:d=4:r=${FPS}`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    path.join(mediaDir, "bg.mp4")], "tạo bg.mp4");

  // ---------- V1: validator ----------
  console.log("V1: validator cho spec parity");
  const spec = paritySpec();
  const v = validateSpec(spec);
  ok(v.ok, `spec parity hợp lệ (errors: ${JSON.stringify(v.errors)})`);
  const specSr = JSON.parse(JSON.stringify(spec));
  specSr.tracks[1].clips[0].animations = {
    scale: { keyframes: [{ t: 0, v: 1, easing: "linear" }] },
  };
  const vSr = validateSpec(specSr);
  ok(vSr.warnings.some((w) => w.includes("scale/rotation") && w.includes("tiltIn")),
    `parity + SR sinh cảnh báo (warnings: ${JSON.stringify(vSr.warnings)})`);
  const specTr = JSON.parse(JSON.stringify(spec));
  specTr.tracks[1].clips[0].track = { points: [{ t: 0, x: 0.5, y: 0.5 }] };
  const vTr = validateSpec(specTr);
  ok(vTr.warnings.some((w) => w.includes("ASS") && w.includes("track")),
    `parity + track sinh cảnh báo ASS (warnings: ${JSON.stringify(vTr.warnings)})`);
  const specBad = JSON.parse(JSON.stringify(spec));
  specBad.tracks[1].clips[0].style.animation = "rotateIn";
  ok(!validateSpec(specBad).ok, "animation không thuộc parity/drawtext/typewriter vẫn bị từ chối");

  // ---------- Render chính ----------
  console.log("Render parity (4 clip ASS trên 1 MP4)");
  const out = render(spec, "parity");
  ok(fs.existsSync(out) && fs.statSync(out).size > 0, "render parity ra MP4");

  // ---------- T1: tiltIn xoay thật ----------
  console.log("T1: tiltIn xoay -12° → 0°");
  const mTiltEarly = measure(frameAt(out, 0.15)).tilt;
  const mTiltLate = measure(frameAt(out, 1.5)).tilt;
  ok(mTiltEarly.count > 100, `T1 t=0.15: thấy chữ tilt (count=${mTiltEarly.count})`);
  ok(mTiltEarly.diff < mTiltLate.diff - 15,
    `T1: top-bot lúc xoay (${mTiltEarly.diff}) âm mạnh hơn lúc đứng yên (${mTiltLate.diff}) ít nhất 15px`);

  // ---------- T2: skewIn nghiêng thật ----------
  console.log("T2: skewIn skewX -25° → +8° → 0°");
  const mSkewEarly = measure(frameAt(out, 0.15)).skew;
  const mSkewLate = measure(frameAt(out, 0.7)).skew;
  ok(mSkewEarly.count > 100, `T2 t=0.15: thấy chữ skew (count=${mSkewEarly.count})`);
  ok(mSkewEarly.diff > mSkewLate.diff + 2,
    `T2: top-bot lúc nghiêng (${mSkewEarly.diff}) lớn hơn lúc thẳng (${mSkewLate.diff}) ít nhất 2px`);

  // ---------- T3: slideReveal quét HỘP CHỮ trái → phải (đợt 11 P4) ----------
  // Hộp REVEAL đo PIL 249px × 0.84 ≈ 209px → [215, 425], tâm 320.
  // Điểm phân biệt với quét khung hình cũ: lúc 0.3s mép hộp đã tới 278
  // (đã chạm chữ, lộ một phần), trong khi mép khung cũ mới tới 192
  // (chưa chạm chữ, count=0). Mép hộp lúc 0.45s ≈ 310.
  console.log("T3: slideReveal lộ dần từ trái (quét hộp chữ)");
  const mRevEarly = measure(frameAt(out, 0.3)).reveal;
  ok(mRevEarly.count > 0,
    `T3 t=0.3: mép hộp 278 đã chạm chữ nên lộ một phần (count=${mRevEarly.count})`);
  ok(mRevEarly.minX >= 215 && mRevEarly.minX <= 221 && mRevEarly.maxX >= 270 && mRevEarly.maxX <= 290,
    `T3 t=0.3: chữ lộ từ mép trái hộp tới gần mép cắt 278 (nhận [${mRevEarly.minX},${mRevEarly.maxX}])`);
  const mRevMid = measure(frameAt(out, 0.45)).reveal;
  ok(mRevMid.count > 0, `T3 t=0.45: đã lộ một phần chữ (count=${mRevMid.count})`);
  ok(mRevMid.minX >= 215 && mRevMid.minX <= 221 && mRevMid.maxX >= 300 && mRevMid.maxX <= 320,
    `T3 t=0.45: chữ lộ từ mép trái 218 tới gần mép cắt 310 (nhận [${mRevMid.minX},${mRevMid.maxX}])`);
  const mRevLate = measure(frameAt(out, 1.5)).reveal;
  ok(mRevLate.maxX > 400,
    `T3 t=1.5: chữ hiện đủ sang phải (maxX=${mRevLate.maxX} > 400)`);

  // ---------- T4: curtainIn mở từ tâm HỘP CHỮ (đợt 11 P4) ----------
  // Hộp CURTAIN đo PIL 276px × 0.84 ≈ 232px → [204, 436]; lúc 0.4s mở
  // 50% → khe [262, 378] (khác khe khung cũ [160, 480]).
  console.log("T4: curtainIn mở từ tâm hộp chữ ra hai bên");
  const mCurMid = measure(frameAt(out, 0.4)).curtain;
  const mCurLate = measure(frameAt(out, 1.5)).curtain;
  ok(mCurMid.count > 200, `T4 t=0.4: thấy chữ trong khe giữa hộp (count=${mCurMid.count})`);
  ok(mCurMid.minX >= 255 && mCurMid.maxX <= 385,
    `T4 t=0.4: pixel chữ chỉ trong khe hộp [262,378] (±7), nhận [${mCurMid.minX},${mCurMid.maxX}]`);
  ok(mCurLate.minX < 210 && mCurLate.maxX > 420,
    `T4 t=1.5: chữ hiện đủ hai phía (chữ đầy đủ [200,437], nhận [${mCurLate.minX},${mCurLate.maxX}])`);

  // ---------- R1: regression fadeUp (drawtext) ----------
  console.log("R1: regression fadeUp drawtext");
  const fadeSpec = {
    version: "0.2.0",
    meta: { name: "fadeup", width: W, height: H, fps: FPS, duration: 2 },
    tracks: [
      { id: "v0", kind: "video", label: "Nền",
        clips: [{ kind: "video", id: "bg", src: "bg.mp4", start: 0, duration: 2, in: 0, out: 2 }] },
      { id: "t1", kind: "text", label: "FadeUp",
        clips: [tclip("fu", "FADEUP", "fadeUp", 0.5)] },
    ],
  };
  const outR1 = render(fadeSpec, "fadeup");
  const mR1 = measure(frameAt(outR1, 1.0));
  // fadeUp nằm ở dải skew (tâm 0.5*360=180 ≈ dải skew [119,183]) — đo qua dải skew.
  ok(mR1.skew.count > 100, `R1: clip fadeUp vẫn render chữ (count dải giữa=${mR1.skew.count})`);

  console.log(`\n${fail === 0 ? "✅" : "❌"} test_text_anim_parity: ${pass} pass, ${fail} fail`);
  console.log(`   (file tạm: ${work})`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
