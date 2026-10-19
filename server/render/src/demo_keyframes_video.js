#!/usr/bin/env node
/**
 * demo_keyframes_video.js — DEMO 2: keyframe cho VIDEO clip (chạy thật bằng FFmpeg).
 *
 * Kịch bản: một video test 640x360 "trôi" từ mép trái sang mép phải của khung
 * hình đen 1280x720 trong 6 giây (x: 0 -> 1, linear), y giữ giữa.
 * Dùng filter overlay với biểu thức x/y theo thời gian, sinh từ
 * server/render/src/keyframes.js (buildOverlayExprs).
 *
 * Cách chạy: node src/demo_keyframes_video.js [--ffmpeg <path>]
 * Output: demos/keyframe-video.mp4 (+ file nguồn tạm trong demos/)
 *
 * Không sửa render.js — demo tự dựng câu lệnh ffmpeg.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildOverlayExprs, validateAnimations } = require("./keyframes");

const W = 1280, H = 720, FPS = 30, DUR = 6;
const FG_W = 640, FG_H = 360;

function run(ffmpeg, args, label) {
  console.log(`   $ ${label}`);
  const r = spawnSync(ffmpeg, args, { stdio: "inherit" });
  if (r.error || r.status !== 0) {
    console.error(`❌ ffmpeg thất bại ở bước "${label}" (mã ${r.status})`);
    process.exit(2);
  }
}

function main() {
  const ffmpeg = process.argv.includes("--ffmpeg")
    ? process.argv[process.argv.indexOf("--ffmpeg") + 1] : "ffmpeg";

  const outDir = path.join(__dirname, "..", "demos");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "keyframe-video.mp4");

  // 1. Keyframes cho video clip (đúng shape ClipAnimations của spec)
  const animations = {
    x: { keyframes: [{ t: 0, v: 0, easing: "linear" }, { t: DUR, v: 1, easing: "linear" }] },
  };
  const errs = validateAnimations(animations, DUR);
  if (errs.length > 0) {
    console.error("❌ animations không hợp lệ:");
    errs.forEach((e) => console.error("  - " + e));
    process.exit(1);
  }

  // 2. Biểu thức overlay x/y theo thời gian
  const expr = buildOverlayExprs(animations, 0);
  console.log(`   overlay x = ${expr.x.slice(0, 130)}...`);
  console.log(`   overlay y = ${expr.y}`);

  // 3. Tạo video nguồn 640x360 (testsrc2 — nội dung có lưới + chữ để thấy chuyển động rõ)
  const src = path.join(os.tmpdir(), `kf-demo-src-${process.pid}.mp4`);
  run(ffmpeg, [
    "-f", "lavfi", "-i", `testsrc2=s=${FG_W}x${FG_H}:r=${FPS}:d=${DUR}`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
    "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-an", "-y", src,
  ], "tạo video nguồn testsrc2");

  // 4. Composite: nền đen + overlay video trôi ngang
  const fc =
    `[1:v]scale=${FG_W}:${FG_H},setsar=1,fps=${FPS},format=yuv420p[fg];` +
    `[0:v][fg]overlay=x='${expr.x}':y='${expr.y}':eof_action=pass`;
  console.log(`🎬 Render demo video keyframes → ${out}`);
  run(ffmpeg, [
    "-f", "lavfi", "-i", `color=c=black:s=${W}x${H}:r=${FPS}:d=${DUR}`,
    "-i", src,
    "-filter_complex", fc,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-an",
    "-t", String(DUR),
    "-y", out,
  ], "render composite");

  try { fs.unlinkSync(src); } catch { /* bỏ qua */ }
  const size = fs.statSync(out).size;
  console.log(`✅ Xong → ${out} (${(size / 1024).toFixed(0)} KB)`);
}

main();
