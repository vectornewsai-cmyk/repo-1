#!/usr/bin/env node
/**
 * test_pixelate_render.js — Phase 9 đợt 149 (T0): render-test THẬT cho
 * effect pixelate, khóa lại lỗi đợt 148 (`npm test` FAIL ở demo_effects).
 *
 * Lỗi cũ: pixelate dùng `scale=iw/K:ih/K,scale=iw*K:ih*K` (neighbor) —
 * iw/K bị cắt ngọn rồi nhân ngược nên khung hình ra SAI kích thước:
 * 640x360 @ K=13 → 637x351 (lẻ) → libx264 từ chối; K=6/11/12/14/15 →
 * chẵn nhưng sai (636x...) → vỡ xfade/mask downstream.
 *
 * Bản sửa (effects.js): geq lấy mẫu từng khối KxK, kích thước ra =
 * kích thước vào với MỌI K và MỌI W/H.
 *
 * Test này render thật bằng ffmpeg qua CHÍNH buildEffectFilter() và
 * assert cho từng (size, intensity):
 *   1. ffmpeg exit 0
 *   2. kích thước output == kích thước input (hồi quy chính)
 *   3. duration ≈ 1s, file > 5KB
 *   4. frame thật sự bị pixel hoá (số đoạn màu liên tục trên 1 hàng
 *      nhỏ hơn hẳn ảnh gốc — đo bằng PIL nếu có, bỏ qua nếu thiếu PIL)
 *   5. clip có alpha: alpha KHÔNG bị ép về 0 (geq thiếu alpha_expr sẽ
 *      làm cả clip trong suốt — đã đo thực ở đợt 149)
 *
 * Cách chạy (từ server/render/): node test_pixelate_render.js [--out-dir /tmp/pix-test]
 * Exit 0 khi mọi case pass.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildEffectFilter } = require("./src/effects");

const args = process.argv.slice(2);
const outDir = path.resolve(args[args.indexOf("--out-dir") + 1] || "/tmp/pix-test");
fs.mkdirSync(outDir, { recursive: true });

let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "✅" : "❌"} ${name} | ${detail}`);
  if (!ok) failures++;
}

function run(cmd, argv, label) {
  const r = spawnSync(cmd, argv, { stdio: "pipe", encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`${label}: ${cmd} exit ${r.status}: ${(r.stderr || "").slice(-300)}`);
  }
  return r.stdout;
}

function probe(file) {
  const out = run("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,codec_name",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1", file,
  ], "ffprobe");
  const m = {};
  for (const line of out.split("\n")) {
    const [k, v] = line.split("=");
    if (k && v !== undefined) m[k.trim()] = v.trim();
  }
  return { w: parseInt(m.width, 10), h: parseInt(m.height, 10), codec: m.codec_name, dur: parseFloat(m.duration) };
}

// PIL có sẵn không? (chỉ dùng để đo độ pixel hoá, không bắt buộc)
const pilOk = spawnSync("python3", ["-c", "import PIL"], { stdio: "pipe" }).status === 0;
// Đếm số đoạn màu trên 1 hàng ngang. Dung sai 4 mức/kênh: encode libx264
// (lossy, CRF 20) làm pixel trong cùng 1 khối lệch nhau vài mức — đếm bằng
// nhau tuyệt đối sẽ thổi phồng số runs (đã đo thực ở đợt 149: K=13 cho
// runs=90 thay vì ~49). Dung sai 4 cho runs=43 (≈ số khối).
function countRunsPng(png, y) {
  const r = spawnSync("python3", ["-c",
    "import sys; from PIL import Image\n" +
    "im = Image.open(sys.argv[1]).convert('RGB'); px = im.load(); w = im.width\n" +
    "runs = 1; prev = px[0, int(sys.argv[2])]\n" +
    "for x in range(1, w):\n" +
    "    c = px[x, int(sys.argv[2])]\n" +
    "    if max(abs(c[i]-prev[i]) for i in range(3)) > 4: runs += 1; prev = c\n" +
    "print(runs)\n",
    png, String(y)], { encoding: "utf8" });
  return r.status === 0 ? parseInt(r.stdout.trim(), 10) : null;
}

// 1. Ma trận size x intensity — hồi quy chính: kích thước ra == kích thước vào
const SIZES = ["640x360", "854x480", "1280x720", "360x640", "1920x1080"];
const INTENSITIES = [0, 0.5, 0.8, 1];
for (const size of SIZES) {
  const [W, H] = size.split("x").map(Number);
  for (const it of INTENSITIES) {
    const fx = buildEffectFilter({ type: "pixelate", intensity: it });
    const tag = `pix-${size}-i${it}`;
    const outFile = path.join(outDir, `${tag}.mp4`);
    try {
      run("ffmpeg", [
        "-y", "-v", "error",
        "-f", "lavfi", "-i", `testsrc2=s=${size}:r=30:d=1`,
        "-vf", fx,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", "30",
        outFile,
      ], tag);
      const p = probe(outFile);
      const sz = fs.statSync(outFile).size;
      check(`${tag} exit 0 + ${p.w}x${p.h} == ${W}x${H} + ${p.dur.toFixed(2)}s + ${(sz / 1024).toFixed(0)}KB`,
        p.w === W && p.h === H && p.codec === "h264" &&
        Math.abs(p.dur - 1) < 0.15 && sz > 5000,
        `filter K=${2 + Math.round(it * 14)}`);
      // Đo độ pixel hoá ở K lớn (chỉ khi PIL có sẵn)
      if (pilOk && it >= 0.8) {
        const frame = path.join(outDir, `${tag}.png`);
        run("ffmpeg", ["-y", "-v", "error", "-ss", "0.5", "-i", outFile, "-frames:v", "1", frame], `${tag}-frame`);
        const runs = countRunsPng(frame, Math.floor(H / 2));
        const k = 2 + Math.round(it * 14);
        check(`${tag} frame thật sự pixel hoá (runs=${runs}, kỳ vọng ≲ ${Math.ceil(W / k) + 10})`,
          runs !== null && runs <= Math.ceil(W / k) + 10,
          `hàng giữa y=${Math.floor(H / 2)}`);
      }
    } catch (e) {
      check(`${tag} render`, false, e.message);
    }
  }
}
if (!pilOk) console.log("⚠️  PIL không có sẵn — bỏ qua bước đo độ pixel hoá (không phải fail)");

// 2. Clip có alpha: alpha không bị ép về 0 + vẫn pixel hoá
try {
  const srcPng = path.join(outDir, "alpha-src.png");
  run("python3", ["-c",
    "from PIL import Image, ImageDraw\n" +
    "img = Image.new('RGBA', (640, 360), (0,0,0,0))\n" +
    "d = ImageDraw.Draw(img)\n" +
    "for x in range(0, 640, 20): d.rectangle([x, 0, x+10, 360], fill=(255,0,0,128))\n" +
    "for y in range(0, 360, 20): d.rectangle([0, y, 640, y+10], fill=(0,0,255,200))\n" +
    `img.save('${srcPng}')\n`,
  ], "alpha-src");
  const fx = buildEffectFilter({ type: "pixelate", intensity: 0.8 });
  const outPng = path.join(outDir, "pix-alpha.png");
  run("ffmpeg", [
    "-y", "-v", "error", "-loop", "1", "-t", "1", "-i", srcPng,
    "-vf", `format=yuva420p,${fx}`,
    "-frames:v", "1", outPng,
  ], "pix-alpha");
  const r = spawnSync("python3", ["-c",
    "import sys; from PIL import Image\n" +
    "im = Image.open(sys.argv[1]); a = im.split()[3]\n" +
    "vals = sorted(set(a.getdata())); print(','.join(map(str, vals)))\n",
    outPng], { encoding: "utf8" });
  const alphaVals = r.status === 0 ? r.stdout.trim() : "";
  check("pixelate giữ alpha (không ép về 0)", alphaVals !== "" && alphaVals !== "0",
    `alpha values: ${alphaVals || "(không đọc được)"}`);
} catch (e) {
  check("pixelate giữ alpha", false, e.message);
}

console.log(failures === 0
  ? `\n🎉 test_pixelate_render: TẤT CẢ PASS — output: ${outDir}`
  : `\n❌ test_pixelate_render: ${failures} FAIL`);
process.exit(failures === 0 ? 0 : 1);
