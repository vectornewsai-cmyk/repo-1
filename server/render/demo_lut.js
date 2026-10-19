#!/usr/bin/env node
/**
 * demo_lut.js — Render MP4 THẬT chứng minh LUT hoạt động.
 *
 * Mỗi video: 1 đoạn testsrc2 3s áp 1 LUT khác nhau qua buildLutFilter().
 * Sau render: ffprobe kiểm tra + trích frame để xem bằng mắt.
 *
 * Cách dùng: node demo_lut.js [--out-dir /tmp/lut-demo]
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildLutFilter, LUT_IDS } = require("./src/lut");

const args = process.argv.slice(2);
const outDir = path.resolve(
  args[args.indexOf("--out-dir") + 1] || "/tmp/lut-demo"
);
fs.mkdirSync(outDir, { recursive: true });
const framesDir = path.join(outDir, "frames");
fs.mkdirSync(framesDir, { recursive: true });

const ASSETS_DIR = path.resolve(__dirname, "..", "..", "assets");
// Demo 3 LUT có màu sắc khác biệt rõ: teal-orange (ấm), mono (đen trắng), ocean (xanh)
const DEMOS = [
  { lut: "cartcut-teal-orange", label: "Teal & Cam" },
  { lut: "cartcut-mono-neutral", label: "Don sac" },
  { lut: "cartcut-ocean", label: "Dai duong" },
];
const W = 640, H = 360, FPS = 30, DUR = 3;

let failed = 0;
for (const d of DEMOS) {
  const outFile = path.join(outDir, `lut-${d.lut}.mp4`);
  const lutFilter = buildLutFilter(d.lut, ASSETS_DIR);
  const fc =
    `testsrc2=s=${W}x${H}:r=${FPS}:d=${DUR},format=yuv420p,` +
    `${lutFilter},format=yuv420p[v]`;
  const r = spawnSync("ffmpeg", [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", `testsrc2=s=${W}x${H}:r=${FPS}:d=${DUR}`,
    "-filter_complex", fc,
    "-map", "[v]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-pix_fmt", "yuv420p", "-r", String(FPS),
    outFile,
  ]);
  if (r.status !== 0) {
    console.error(`❌ FAIL ${d.lut}: ffmpeg lỗi`);
    failed++;
    continue;
  }
  // ffprobe verify
  const p = spawnSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-show_entries", "stream=codec_name,width,height",
    "-of", "default=noprint_wrappers=1", outFile,
  ], { encoding: "utf8" });
  const ok =
    p.status === 0 &&
    p.stdout.includes("codec_name=h264") &&
    p.stdout.includes(`width=${W}`) &&
    p.stdout.includes(`duration=${DUR}`);
  // trích frame giữa để xem bằng mắt
  const frameFile = path.join(framesDir, `${d.lut}.png`);
  spawnSync("ffmpeg", [
    "-y", "-v", "error", "-ss", "1.5", "-i", outFile,
    "-frames:v", "1", frameFile,
  ]);
  if (ok) {
    console.log(`✅ PASS ${d.lut} (${d.label}): h264 ${W}x${H}, ${DUR}s → ${outFile}`);
    console.log(`   🖼️  frame: ${d.lut}.png (xem bằng mắt để xác nhận màu đổi)`);
  } else {
    console.error(`❌ FAIL ${d.lut}: ffprobe không khớp`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n❌ ${failed}/${DEMOS.length} demo FAIL`);
  process.exit(1);
}
console.log(`\n🎉 TẤT CẢ PASS — output: ${outDir}`);
console.log(`   So sánh 3 frame trong ${framesDir}/ bằng mắt: màu phải khác nhau rõ rệt.`);
