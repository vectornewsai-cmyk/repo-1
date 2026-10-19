#!/usr/bin/env node
/**
 * demo_chroma.js — Chứng minh chroma key CHẠY THẬT bằng video MP4.
 *
 * Kịch bản:
 *   1. Tạo foreground 5s: nền xanh lá #00FF00 + hộp đỏ 120x120 đứng yên.
 *   2. Tạo background 5s: nền xanh dương đặc.
 *   3. Áp buildChromaFilter() từ src/chroma.js lên foreground, overlay lên background.
 *   4. Render MP4 thật, tự kiểm chứng:
 *      - ffprobe: codec/resolution/duration đúng.
 *      - Pixel check: điểm (20,20) vốn là nền xanh → phải thành XANH DƯƠNG (background).
 *      - Pixel check: tâm hộp đỏ (320,180) → phải VẪN ĐỎ (foreground nguyên vẹn).
 *      - Trích frame để xem bằng mắt.
 *
 * Cách dùng: node demo_chroma.js [--out-dir /tmp/chroma-demo]
 * Mã thoát: 0 = tất cả pass, 1 = có lỗi.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildChromaFilter } = require("./src/chroma");

const W = 640, H = 360, FPS = 30, DUR = 5;

const args = process.argv.slice(2);
const outDir = path.resolve(
  args[args.indexOf("--out-dir") + 1] || "/tmp/chroma-demo"
);
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "chroma-demo.mp4");

function run(cmd, argv) {
  const r = spawnSync(cmd, argv, { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`❌ Lệnh thất bại: ${cmd} ${argv.join(" ")}`);
    console.error((r.stderr || "").split("\n").slice(-8).join("\n"));
    process.exit(1);
  }
  return r;
}

console.log("🎬 Demo chroma key — render video thật\n");

// Foreground: nền xanh lá + hộp đỏ. Background: xanh dương đặc.
run("ffmpeg", ["-y", "-v", "error",
  "-f", "lavfi", "-i",
  `color=c=0x00FF00:s=${W}x${H}:r=${FPS}:d=${DUR},format=yuv420p,` +
  `drawbox=x=260:y=120:w=120:h=120:c=red:t=fill`,
  "-f", "lavfi", "-i",
  `color=c=blue:s=${W}x${H}:r=${FPS}:d=${DUR},format=yuv420p`,
  "-filter_complex",
  // DÙNG CHÍNH buildChromaFilter() — không hardcode filter.
  `[0:v]${buildChromaFilter({ color: "#00FF00", similarity: 0.2, blend: 0.05 })}[fg];` +
  `[1:v][fg]overlay=0:0,format=yuv420p[out]`,
  "-map", "[out]",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
  "-pix_fmt", "yuv420p", "-r", String(FPS),
  outFile,
]);
console.log(`   ✅ Render xong: ${outFile}`);

// ---- Kiểm chứng 1: ffprobe ----
const probe = JSON.parse(run("ffprobe", ["-v", "error",
  "-show_entries", "stream=codec_name,width,height",
  "-show_entries", "format=duration",
  "-of", "json", outFile]).stdout);
const vs = probe.streams[0];
const dur = parseFloat(probe.format.duration);
let pass = true;
const check = (name, ok, detail = "") => {
  console.log(`   ${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) pass = false;
};
check("video codec h264", vs.codec_name === "h264", vs.codec_name);
check("độ phân giải 640x360", vs.width === 640 && vs.height === 360);
check("thời lượng ≈ 5s", Math.abs(dur - 5) < 0.2, dur.toFixed(2) + "s");

// ---- Kiểm chứng 2: pixel-level ----
function samplePixel(t, x, y) {
  const png = path.join(outDir, `px_${t}_${x}_${y}.png`);
  run("ffmpeg", ["-y", "-v", "error",
    "-ss", String(t), "-i", outFile,
    "-frames:v", "1", png]);
  // Đọc pixel bằng ffmpeg crop 1x1 → raw.
  const raw = path.join(outDir, `px_${t}_${x}_${y}.raw`);
  run("ffmpeg", ["-y", "-v", "error", "-i", png,
    "-vf", `crop=1:1:${x}:${y},format=rgb24`,
    "-f", "rawvideo", raw]);
  const buf = fs.readFileSync(raw);
  return [buf[0], buf[1], buf[2]];
}

// (20,20) vốn là nền xanh lá → giờ phải là xanh dương của background.
const bgPx = samplePixel(2.5, 20, 20);
const isBlue = bgPx[2] > 150 && bgPx[0] < 100 && bgPx[1] < 100;
check(
  "nền xanh lá đã bị xoá (pixel góc giờ là xanh dương của background)",
  isBlue,
  `RGB(${bgPx.join(",")})`
);

// Tâm hộp đỏ (320,180) → phải vẫn đỏ.
const fgPx = samplePixel(2.5, 320, 180);
const isRed = fgPx[0] > 150 && fgPx[1] < 100 && fgPx[2] < 100;
check(
  "vật thể foreground còn nguyên (tâm hộp vẫn đỏ)",
  isRed,
  `RGB(${fgPx.join(",")})`
);

// ---- Kiểm chứng 3: trích frame để xem bằng mắt ----
const framePng = path.join(outDir, "chroma_frame.png");
run("ffmpeg", ["-y", "-v", "error", "-ss", "2.5", "-i", outFile,
  "-frames:v", "1", framePng]);
console.log(`   🖼️  Frame kiểm chứng: ${framePng}`);

if (!pass) {
  console.error("\n❌ DEMO FAIL — có kiểm chứng không pass");
  process.exit(1);
}
console.log("\n🎉 TẤT CẢ PASS — chroma key render THẬT thành công");
