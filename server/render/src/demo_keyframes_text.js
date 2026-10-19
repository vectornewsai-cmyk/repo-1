#!/usr/bin/env node
/**
 * demo_keyframes_text.js — DEMO 1: keyframe cho TEXT clip (chạy thật bằng FFmpeg).
 *
 * Kịch bản: chữ "Keyframe đang bay!" bay từ NGOÀI mép trái sang NGOÀI mép phải
 * trong 5 giây (x: -0.35 -> 1.35, linear), đồng thời mờ dần vào trong 1 giây đầu
 * (opacity: 0 -> 1, ease-out).
 *
 * Cách chạy: node src/demo_keyframes_text.js [--ffmpeg <path>]
 * Output: demos/keyframe-text.mp4
 *
 * Không sửa render.js — demo tự dựng câu lệnh ffmpeg từ
 * server/render/src/keyframes.js (buildTextExprs).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildTextExprs, validateAnimations, ffNum } = require("./keyframes");
const { resolveFontFile } = require("./validate");

const W = 1280, H = 720, FPS = 30, DUR = 5;
const TEXT = "Keyframe đang bay!";
const CLIP_START = 0;

function escapeDrawtext(s) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:").replace(/%\{/g, "\\%{");
}
function escapeFilterPath(p) {
  return p.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
}

function main() {
  const ffmpeg = process.argv.includes("--ffmpeg")
    ? process.argv[process.argv.indexOf("--ffmpeg") + 1] : "ffmpeg";

  // 1. Định nghĩa keyframes (đúng shape ClipAnimations của spec)
  const animations = {
    x: { keyframes: [{ t: 0, v: -0.35, easing: "linear" }, { t: DUR, v: 1.35, easing: "linear" }] },
    opacity: { keyframes: [{ t: 0, v: 0, easing: "ease-out" }, { t: 1, v: 1, easing: "ease-out" }] },
  };
  const style = { x: 0.5, y: 0.5 };

  // 2. Validate trước (fail fast, trung thực)
  const errs = validateAnimations(animations, DUR);
  if (errs.length > 0) {
    console.error("❌ animations không hợp lệ:");
    errs.forEach((e) => console.error("  - " + e));
    process.exit(1);
  }

  // 3. Font thật (DejaVu Sans có đủ glyph tiếng Việt)
  const font = resolveFontFile("DejaVu Sans");
  if (!font) {
    console.error("❌ Không tìm được font DejaVu Sans qua fontconfig");
    process.exit(1);
  }
  console.log(`   font: ${font}`);

  // 4. Sinh biểu thức FFmpeg từ keyframes
  const expr = buildTextExprs(animations, style, CLIP_START);
  console.log(`   drawtext x = ${expr.x.slice(0, 120)}...`);
  console.log(`   drawtext alpha = ${expr.alpha.slice(0, 120)}...`);

  const vf =
    `drawtext=fontfile='${escapeFilterPath(font)}':` +
    `text='${escapeDrawtext(TEXT)}':fontsize=72:fontcolor=white:` +
    `x='${expr.x}':y='${expr.y}':alpha='${expr.alpha}':` +
    `enable='between(t,${ffNum(CLIP_START)},${ffNum(CLIP_START + DUR)})'`;

  const outDir = path.join(__dirname, "..", "demos");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "keyframe-text.mp4");

  const args = [
    "-f", "lavfi", "-i", `color=c=black:s=${W}x${H}:r=${FPS}:d=${DUR}`,
    "-vf", vf,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-an",
    "-t", String(DUR),
    "-y", out,
  ];
  console.log(`🎬 Render demo text keyframes → ${out}`);
  const r = spawnSync(ffmpeg, args, { stdio: "inherit" });
  if (r.error || r.status !== 0) {
    console.error(`❌ ffmpeg thất bại (mã ${r.status})`);
    process.exit(2);
  }
  const size = fs.statSync(out).size;
  console.log(`✅ Xong → ${out} (${(size / 1024).toFixed(0)} KB)`);
}

main();
