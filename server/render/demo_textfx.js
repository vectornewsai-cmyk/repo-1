#!/usr/bin/env node
/**
 * demo_textfx.js — Render MP4 THẬT cho từng text animation mới, dùng CHÍNH
 * buildTextAnimExpr() từ textfx.js để dựng biểu thức drawtext (không fake).
 *
 * Cách dùng:
 *   node demo_textfx.js [--out-dir /tmp/textfx-demo]
 *
 * Mỗi animation: 1 video 2.5s (640x360@30), nền đen, chữ trắng "Hiệu ứng: <tên>".
 * Sau khi render, script tự:
 *   1. ffprobe kiểm tra codec/resolution/duration
 *   2. trích 2 frame mỗi video: giữa intro (t=0.25s) và sau intro (t=1.5s)
 *      để xem bằng mắt trong <out-dir>/frames/
 *
 * Mã thoát: 0 = tất cả pass, 1 = có lỗi.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");
const { buildTextAnimExpr, TEXTFX_ANIMATIONS } = require("./src/textfx");

// Chỉ demo 5 animation MỚI (none/fadeUp đã có từ trước, typewriter dùng ASS riêng).
const DEMO_ANIMS = ["fadeIn", "slideInLeft", "slideInRight", "slideUp", "bounce"];

const W = 640, H = 360, FPS = 30, DUR = 2.5;

/** Escape text cho drawtext (mirror escapeDrawtext trong render.js). */
function escapeDrawtext(s) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%\{/g, "\\%{")
    .replace(/\n/g, "\\n");
}

function escapeFilterPath(p) {
  return p.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
}

/** Resolve font qua fontconfig (mirror resolveFontFile trong validate.js). */
function resolveFont() {
  for (const c of ["DejaVu Sans", "sans-serif"]) {
    try {
      const out = execFileSync("fc-match", ["-f", "%{file}\n", c], {
        encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
      }).trim().split("\n")[0];
      if (out && fs.existsSync(out)) return out;
    } catch { /* thử tiếp */ }
  }
  throw new Error("không tìm được font qua fc-match");
}

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { stdio: "pipe", encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`❌ ${label} thất bại:\n${(r.stderr || "").slice(-1500)}`);
    process.exit(1);
  }
}

function ffprobe(file) {
  const raw = execFileSync("ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_name,width,height",
     "-show_entries", "format=duration", "-of", "json", file],
    { encoding: "utf8" });
  return JSON.parse(raw);
}

function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(
    args[args.indexOf("--out-dir") + 1] || "/tmp/textfx-demo");
  const framesDir = path.join(outDir, "frames");
  fs.mkdirSync(framesDir, { recursive: true });

  const fontFile = resolveFont();
  console.log(`font: ${fontFile}`);

  let failed = 0;
  for (const anim of DEMO_ANIMS) {
    const label = `Hiệu ứng: ${anim}`;
    const te = buildTextAnimExpr(anim, { x: 0.5, y: 0.5 }, 0);
    const outFile = path.join(outDir, `textfx-${anim}.mp4`);

    const vf =
      `drawtext=fontfile='${escapeFilterPath(fontFile)}':` +
      `text='${escapeDrawtext(label)}':` +
      `fontsize=42:fontcolor=white:` +
      `x='${te.x}':y='${te.y}':` +
      `alpha='${te.alpha}'`;

    run("ffmpeg", ["-y", "-v", "error",
      "-f", "lavfi", `-i`, `color=c=black:s=${W}x${H}:r=${FPS}:d=${DUR}`,
      "-vf", vf,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
      "-pix_fmt", "yuv420p", "-r", String(FPS),
      outFile], `render ${anim}`);

    // Verify bằng ffprobe
    const p = ffprobe(outFile);
    const vs = p.streams.find((s) => s.codec_name === "h264");
    const dur = parseFloat(p.format.duration);
    const ok = vs && vs.width === W && vs.height === H && Math.abs(dur - DUR) < 0.2;
    console.log(`${ok ? "✅" : "❌"} PASS ${anim}: h264 ${vs.width}x${vs.height}, ${dur.toFixed(2)}s → ${outFile}`);
    if (!ok) { failed++; continue; }

    // Trích frame: giữa intro và sau intro
    for (const [tag, t] of [["intro", 0.25], ["settled", 1.5]]) {
      const fp = path.join(framesDir, `${anim}_${tag}.png`);
      run("ffmpeg", ["-y", "-v", "error", "-ss", String(t),
        "-i", outFile, "-frames:v", "1", fp], `trích frame ${anim}/${tag}`);
    }
    console.log(`   🖼️  frames: ${anim}_intro.png (t=0.25s), ${anim}_settled.png (t=1.5s)`);
  }

  console.log(`\n${failed === 0 ? "🎉 TẤT CẢ PASS" : `❌ ${failed} LỖI`} — output: ${outDir}`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
