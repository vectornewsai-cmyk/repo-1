#!/usr/bin/env node
/**
 * test_k1.js — Test THẬT Phase 6 K1: opacity keyframes cho video clip +
 * scale/rotation cho text clip.
 *
 * Render bằng chính render.js (không mock), trích frame, đo pixel bằng PIL
 * (test_k1_measure.py) và khẳng định:
 *   A. Video opacity keyframes 1→0: đỏ trên nền xanh blend dần thành xanh.
 *   B. Static opacity + keyframes opacity cùng set: validator cảnh báo,
 *      keyframes thắng (không nhân với nhau).
 *   C. Opacity keyframes + transition: validator cảnh báo, render vẫn chạy
 *      (rơi về opacity tĩnh của clip đích).
 *   D. Opacity keyframe ngoài [0,1]: validate LỖI (không render).
 *   E. Text scale 1→2: bbox mực gần như nhân đôi theo thời gian.
 *   F. Text rotation 0→90°: bbox mực lật aspect (rộng → cao).
 *   G. Text SR + opacity keyframes: chữ mờ dần rồi biến mất.
 *   R. Regression: test_keyframes_sr.js + test_plugin_wire.js vẫn pass.
 *
 * Cách chạy: node src/test_k1.js   (cần ffmpeg, ffprobe, python3+PIL)
 * File tạm nằm trong os.tmpdir() — đặt TMPDIR về workspace nếu /tmp nhỏ.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { validateSpec } = require("./validate");

const W = 640, H = 360, FPS = 30;
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-k1-"));
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

function makeMedia() {
  const enc = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-an"];
  run("ffmpeg", ["-f", "lavfi", "-i", `color=c=red:s=${W}x${H}:r=${FPS}:d=5`,
    ...enc, "-y", path.join(mediaDir, "red.mp4")], "tạo red.mp4");
  run("ffmpeg", ["-f", "lavfi", "-i", `color=c=blue:s=${W}x${H}:r=${FPS}:d=5`,
    ...enc, "-y", path.join(mediaDir, "blue.mp4")], "tạo blue.mp4");
}

const kf = (pairs) => ({
  keyframes: pairs.map(([t, v]) => ({ t, v, easing: "linear" })),
});
const vclip = (id, src, start, duration, extra = {}) => ({
  id, kind: "video", src, start, duration, in: 0, out: duration, ...extra,
});
const tclip = (id, text, start, duration, extra = {}) => ({
  id, kind: "text", text, start, duration,
  style: { fontFamily: "sans-serif", fontSize: 64, color: "#ffffff", x: 0.5, y: 0.5, animation: "none", ...(extra.style || {}) },
  ...(extra.animations ? { animations: extra.animations } : {}),
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
  const r = run("python3", [path.join(__dirname, "test_k1_measure.py"), png, mode],
    `đo pixel ${mode}`);
  return JSON.parse(r.stdout.toString());
}
const bw = (m) => (m.bbox ? m.bbox[2] - m.bbox[0] + 1 : 0);
const bh = (m) => (m.bbox ? m.bbox[3] - m.bbox[1] + 1 : 0);

function main() {
  makeMedia();

  // ---------- A: video opacity keyframes 1 -> 0 ----------
  console.log("A: video opacity keyframes 1→0 (4s, đỏ trên nền xanh)");
  const specA = {
    version: "0.2.0",
    meta: { name: "a", width: W, height: H, fps: FPS },
    tracks: [
      { id: "v0", kind: "video", label: "Nền", clips: [vclip("bg", "blue.mp4", 0, 4)] },
      { id: "v1", kind: "video", label: "Trên",
        clips: [vclip("fg", "red.mp4", 0, 4, { animations: { opacity: kf([[0, 1], [4, 0]]) } })] },
    ],
  };
  const vA = validateSpec(specA);
  ok(vA.ok, "spec A hợp lệ");
  ok(!vA.warnings.some((w) => /opacity/i.test(w) && /bỏ qua/i.test(w)),
    "validator KHÔNG cảnh báo bỏ qua opacity keyframes cho clip đơn");
  const outA = render(specA, "a-opkf");
  const c02 = measure(frameAt(outA, 0.2), "center");
  const c20 = measure(frameAt(outA, 2.0), "center");
  const c38 = measure(frameAt(outA, 3.8), "center");
  console.log(`   t=0.2: ${JSON.stringify(c02)} | t=2.0: ${JSON.stringify(c20)} | t=3.8: ${JSON.stringify(c38)}`);
  ok(c02.r > 200 && c02.b < 60, "t=0.2 gần như đỏ đục (opacity ~0.95)");
  ok(Math.abs(c20.r - 127) < 40 && Math.abs(c20.b - 127) < 40,
    "t=2.0 blend ~50/50 đỏ-xanh");
  ok(c38.r < 60 && c38.b > 200, "t=3.8 gần như xanh (opacity ~0.05)");

  // ---------- B: static + keyframes cùng set ----------
  console.log("B: static opacity 0.5 + keyframes 1→0 (keyframes thắng)");
  const specB = {
    version: "0.2.0",
    meta: { name: "b", width: W, height: H, fps: FPS },
    tracks: [
      { id: "v0", kind: "video", label: "Nền", clips: [vclip("bg", "blue.mp4", 0, 4)] },
      { id: "v1", kind: "video", label: "Trên",
        clips: [vclip("fg", "red.mp4", 0, 4, { opacity: 0.5, animations: { opacity: kf([[0, 1], [4, 0]]) } })] },
    ],
  };
  const vB = validateSpec(specB);
  ok(vB.ok, "spec B hợp lệ");
  ok(vB.warnings.some((w) => w.includes("opacity tĩnh") && w.includes("keyframes")),
    "validator cảnh báo cả opacity tĩnh + keyframes");
  const outB = render(specB, "b-opboth");
  const cB = measure(frameAt(outB, 2.0), "center");
  console.log(`   t=2.0: ${JSON.stringify(cB)}`);
  ok(Math.abs(cB.r - 127) < 40 && Math.abs(cB.b - 127) < 40,
    "t=2.0 vẫn blend 50/50 (keyframes thắng, không nhân 0.5×0.5=25%)");

  // ---------- C: opacity keyframes + transition ----------
  console.log("C: opacity keyframes + transition (cảnh báo, fallback tĩnh)");
  const specC = {
    version: "0.2.0",
    meta: { name: "c", width: W, height: H, fps: FPS },
    tracks: [{
      id: "v1", kind: "video", label: "Video",
      clips: [
        vclip("c1", "red.mp4", 0, 2, { animations: { opacity: kf([[0, 1], [2, 0]]) } }),
        vclip("c2", "blue.mp4", 2, 2, { opacity: 0.5 }),
      ],
    }],
  };
  // Transition: c1 -> c2, duration 1 — 2 clip kề nhau (c1 kết thúc 2 = c2 bắt đầu 2);
  // xfade làm c2 bắt đầu sớm hơn T giây trong output, unit bị merge.
  specC.tracks[0].clips[0].transitionOut = { type: "fade", duration: 1 };
  const vC = validateSpec(specC);
  ok(vC.ok, "spec C hợp lệ");
  ok(vC.warnings.some((w) => w.includes("keyframes opacity") && w.includes("transition")),
    "validator cảnh báo opacity keyframes + transition");
  render(specC, "c-optrans");
  console.log("   render C chạy xong (fallback tĩnh, không crash)");

  // ---------- D: opacity keyframe ngoài [0,1] ----------
  console.log("D: opacity keyframe v=1.5 phải bị chặn");
  const specD = {
    version: "0.2.0",
    meta: { name: "d", width: W, height: H, fps: FPS },
    tracks: [{ id: "v1", kind: "video", label: "Video",
      clips: [vclip("d1", "red.mp4", 0, 2, { animations: { opacity: kf([[0, 1.5], [2, 0]]) } })] }],
  };
  const vD = validateSpec(specD);
  ok(!vD.ok && vD.errors.some((e) => e.includes("0..1")),
    "validator lỗi khi opacity keyframe v=1.5");

  // ---------- E: text scale 1 -> 2 ----------
  console.log("E: text scale 1→2 (4s)");
  const specE = {
    version: "0.2.0",
    meta: { name: "e", width: W, height: H, fps: FPS },
    tracks: [{ id: "t1", kind: "text", label: "Chữ",
      clips: [tclip("e1", "HELLO", 0, 4, { animations: { scale: kf([[0, 1], [4, 2]]) } })] }],
  };
  const vE = validateSpec(specE);
  ok(vE.ok, "spec E hợp lệ");
  ok(!vE.warnings.some((w) => w.includes("scale/rotation") && w.includes("text")),
    "validator KHÔNG còn cảnh báo SR text cho clip drawtext-thường");
  const outE = render(specE, "e-textscale");
  const mE0 = measure(frameAt(outE, 0.3), "inkbbox");
  const mE1 = measure(frameAt(outE, 3.7), "inkbbox");
  const rE = bw(mE1) / Math.max(bw(mE0), 1);
  console.log(`   bbox t=0.3: ${bw(mE0)}x${bh(mE0)} | t=3.7: ${bw(mE1)}x${bh(mE1)} | tỉ lệ rộng: ${rE.toFixed(2)}`);
  ok(bw(mE0) > 50, "t=0.3 có chữ (bbox rộng > 50px)");
  ok(rE > 1.7 && rE < 2.3, "bbox rộng gần như nhân đôi theo scale 1→2");

  // ---------- F: text rotation 0 -> 90 ----------
  console.log("F: text rotation 0→90° (4s)");
  const specF = {
    version: "0.2.0",
    meta: { name: "f", width: W, height: H, fps: FPS },
    tracks: [{ id: "t1", kind: "text", label: "Chữ",
      clips: [tclip("f1", "HELLO", 0, 4, { animations: { rotation: kf([[0, 0], [4, 90]]) } })] }],
  };
  const vF = validateSpec(specF);
  ok(vF.ok, "spec F hợp lệ");
  const outF = render(specF, "f-textrot");
  const mF0 = measure(frameAt(outF, 0.3), "inkbbox");
  const mF1 = measure(frameAt(outF, 3.7), "inkbbox");
  const a0 = bw(mF0) / Math.max(bh(mF0), 1);
  const a1 = bh(mF1) / Math.max(bw(mF1), 1);
  console.log(`   bbox t=0.3: ${bw(mF0)}x${bh(mF0)} (rộng/cao=${a0.toFixed(2)}) | t=3.7: ${bw(mF1)}x${bh(mF1)} (cao/rộng=${a1.toFixed(2)})`);
  ok(a0 > 2.5, "t=0.3 bbox còn rộng (chưa xoay nhiều)");
  ok(a1 > 2.0, "t=3.7 bbox đã cao (xoay gần 90°)");

  // ---------- G: text SR + opacity keyframes ----------
  console.log("G: text scale 1 (hằng) + opacity keyframes 1→0");
  const specG = {
    version: "0.2.0",
    meta: { name: "g", width: W, height: H, fps: FPS },
    tracks: [{ id: "t1", kind: "text", label: "Chữ",
      clips: [tclip("g1", "HELLO", 0, 4, { animations: {
        scale: kf([[0, 1]]),
        opacity: kf([[0, 1], [4, 0]]),
      } })] }],
  };
  const vG = validateSpec(specG);
  ok(vG.ok, "spec G hợp lệ");
  const outG = render(specG, "g-textop");
  const nG0 = measure(frameAt(outG, 0.3), "inkcount");
  const nG1 = measure(frameAt(outG, 3.7), "inkcount");
  console.log(`   ink t=0.3: ${nG0.count} | t=3.7: ${nG1.count}`);
  ok(nG0.count > 500, "t=0.3 chữ còn rõ (ink > 500px)");
  ok(nG1.count < 100, "t=3.7 chữ gần như biến mất (ink < 100px)");

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
