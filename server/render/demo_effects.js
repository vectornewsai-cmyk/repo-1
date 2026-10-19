#!/usr/bin/env node
/**
 * demo_effects.js — Render MP4 THẬT cho từng video effect, tự verify bằng ffprobe
 * + trích frame để xem bằng mắt.
 *
 * Cách dùng: node demo_effects.js [--out-dir /tmp/effects-demo]
 *
 * Mỗi effect: 1 video 3s từ testsrc2 (nhiều màu sắc để thấy rõ hiệu ứng),
 * áp effect qua CHÍNH buildEffectsChain() từ src/effects.js.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildEffectsChain, EFFECT_TYPES } = require("./src/effects");

const args = process.argv.slice(2);
const outDir = path.resolve(
  args[args.indexOf("--out-dir") + 1] || "/tmp/effects-demo"
);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(outDir, "frames"), { recursive: true });

const W = 640, H = 360, FPS = 30, DUR = 3;

function run(cmd, argv) {
  const r = spawnSync(cmd, argv, { stdio: "pipe", encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`❌ Lỗi chạy ${cmd}:`, (r.stderr || "").slice(-500));
    process.exit(1);
  }
  return r.stdout;
}

function ffprobeDur(file) {
  const out = run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]).trim();
  return parseFloat(out);
}

let allOk = true;
for (const type of EFFECT_TYPES) {
  const intensity = type === "brightness" ? 0.8 : 0.8;
  const fx = buildEffectsChain([{ type, intensity }]);
  const outFile = path.join(outDir, `effect-${type}.mp4`);
  // testsrc2: pattern nhiều màu + timestamp — thấy rõ mọi hiệu ứng
  run("ffmpeg", [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", `testsrc2=s=${W}x${H}:r=${FPS}:d=${DUR}`,
    "-vf", fx,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-pix_fmt", "yuv420p", "-r", String(FPS),
    outFile,
  ]);
  const dur = ffprobeDur(outFile);
  const okDur = Math.abs(dur - DUR) < 0.15;
  // Trích 1 frame giữa để xem bằng mắt
  const frameFile = path.join(outDir, "frames", `${type}.png`);
  run("ffmpeg", ["-y", "-v", "error", "-ss", "1.5", "-i", outFile, "-frames:v", "1", frameFile]);

  const stat = fs.statSync(outFile);
  const ok = okDur && stat.size > 5000;
  if (!ok) allOk = false;
  console.log(`${ok ? "✅" : "❌"} PASS ${type}: filter="${fx.slice(0, 60)}${fx.length > 60 ? "…" : ""}", ` +
    `${dur.toFixed(2)}s, ${(stat.size / 1024).toFixed(0)}KB → ${path.basename(outFile)}`);
  console.log(`   🖼️  frame: frames/${type}.png (t=1.5s)`);
}

console.log(allOk ? `\n🎉 TẤT CẢ PASS — output: ${outDir}` : "\n❌ CÓ EFFECT FAIL");
process.exit(allOk ? 0 : 1);
