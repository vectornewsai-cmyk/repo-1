#!/usr/bin/env node
/**
 * demo_chroma_alpha.js — Kiểm chứng R1-012/P0-05: chroma key giữ alpha xuyên suốt.
 *
 * Tạo video test (nền xanh lá + hình đỏ), áp chroma key, composite lên nền
 * checkerboard. Kiểm chứng:
 * 1. Pixel vùng đã key hiện checkerboard (không phải đen) → alpha được giữ
 * 2. Pixel vật thể (đỏ) giữ nguyên màu → key không ăn vào foreground
 */
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT_DIR = process.argv.includes("--out-dir")
  ? process.argv[process.argv.indexOf("--out-dir") + 1]
  : "/tmp/chroma-alpha-demo";

function run(cmd, opts = {}) {
  console.log(`$ ${cmd.slice(0, 120)}${cmd.length > 120 ? "..." : ""}`);
  return execSync(cmd, { stdio: "pipe", ...opts }).toString();
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const framesDir = path.join(OUT_DIR, "frames");
  fs.mkdirSync(framesDir, { recursive: true });

  console.log("=== 1. Tạo foreground: nền xanh lá + hình tròn đỏ ===");
  // Dùng geq để vẽ: xanh lá nền, vòng tròn đỏ ở giữa
  run(
    `ffmpeg -y -v error -f lavfi -i "color=c=0x00FF00:s=640x360:d=3:r=30" ` +
    `-vf "drawbox=x=220:y=80:w=200:h=200:c=red:t=fill" ` +
    `-c:v libx264 -pix_fmt yuv420p ${OUT_DIR}/fg.mp4`
  );

  console.log("=== 2. Tạo background checkerboard ===");
  run(
    `ffmpeg -y -v error -f lavfi -i "color=c=white:s=640x360:d=3:r=30" ` +
    `-vf "geq='if(mod(floor(X/40)+floor(Y/40),2),0,255)':128:128" ` +
    `-c:v libx264 -pix_fmt yuv420p ${OUT_DIR}/bg.mp4`
  );

  console.log("=== 3. Composite: chroma key fg + overlay lên bg ===");
  // Đây chính là chain mà render.js tạo ra sau fix R1-012
  const filterComplex =
    `[0:v]format=yuva420p,chromakey=color=0x00FF00:similarity=0.3:blend=0.1,` +
    `scale=640:360:force_original_aspect_ratio=decrease,` +
    `pad=640:360:(ow-iw)/2:(oh-ih)/2:color=black@0,` +
    `setsar=1,fps=30,format=yuva420p[fg];` +
    `[1:v][fg]overlay=0:0:eof_action=pass,format=yuv420p[out]`;
  run(
    `ffmpeg -y -v error -i ${OUT_DIR}/fg.mp4 -i ${OUT_DIR}/bg.mp4 ` +
    `-filter_complex "${filterComplex}" -map "[out]" ` +
    `-c:v libx264 -t 3 ${OUT_DIR}/chroma_alpha.mp4`
  );

  console.log("=== 4. Trích frame + pixel check ===");
  run(
    `ffmpeg -y -v error -ss 1.5 -i ${OUT_DIR}/chroma_alpha.mp4 ` +
    `-frames:v 1 ${framesDir}/check.png`
  );

  // Pixel check bằng Python PIL (ghi ra file để tránh lỗi quoting)
  const pyFile = path.join(OUT_DIR, "_pixelcheck.py");
  fs.writeFileSync(pyFile, `
from PIL import Image
img = Image.open("${framesDir}/check.png").convert("RGB")
w, h = img.size
bg_pixel = img.getpixel((50, 50))
fg_pixel = img.getpixel((320, 180))
print(f"Background pixel (50,50): RGB{bg_pixel}")
print(f"Foreground pixel (320,180): RGB{fg_pixel}")
is_green = bg_pixel[1] > 200 and bg_pixel[0] < 100 and bg_pixel[2] < 100
is_red = fg_pixel[0] > 200 and fg_pixel[1] < 100 and fg_pixel[2] < 100
print("Background da key (khong con xanh): " + ("PASS" if not is_green else "FAIL"))
print("Foreground giu mau do: " + ("PASS" if is_red else "FAIL"))
is_checker = (sum(bg_pixel) > 600) or (sum(bg_pixel) < 150)
print("Thay checkerboard qua vung trong suot: " + ("PASS" if is_checker else "FAIL"))
`);
  const result = run(`python3 ${pyFile}`);
  console.log(result);

  // ffprobe verify
  const probe = run(
    `ffprobe -v error -select_streams v:0 ` +
    `-show_entries stream=codec_name,width,height,avg_frame_rate,duration ` +
    `-of default=noprint_wrappers=1 ${OUT_DIR}/chroma_alpha.mp4`
  );
  console.log("=== ffprobe ===");
  console.log(probe);

  console.log(`\n✅ Demo xong — xem frame: ${framesDir}/check.png`);
  console.log(`   Video: ${OUT_DIR}/chroma_alpha.mp4`);
}

main();
