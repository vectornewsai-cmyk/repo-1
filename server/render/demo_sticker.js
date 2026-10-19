#!/usr/bin/env node
/**
 * demo_sticker.js — Render MP4 THẬT chứng minh sticker overlay hoạt động.
 *
 * Dựng: nền video testsrc2 5s + 3 sticker (ngôi sao góc trái, trái tim xoay
 * mờ ở giữa-phải, tia sét nhỏ dưới) bằng CHÍNH buildStickerOverlay().
 * Sau render: ffprobe kiểm tra + trích frame xem bằng mắt.
 *
 * Cách dùng: node demo_sticker.js [--out-dir /tmp/sticker-demo]
 * Mã thoát: 0 = tất cả pass, 1 = có lỗi.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildStickerOverlay, validateSticker } = require("./src/sticker");

const args = process.argv.slice(2);
const outDir = path.resolve(
  args[args.indexOf("--out-dir") + 1] || "/tmp/sticker-demo"
);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(outDir, "frames"), { recursive: true });

const W = 640, H = 360, FPS = 30, D = 5;
const STICKER_DIR = path.resolve(__dirname, "../../assets/stickers");

const STICKERS = [
  // ngôi sao to ở góc trái trên, hiện suốt video
  { kind: "sticker", id: "st1", src: "star.png", start: 0, duration: 5,
    x: 0.15, y: 0.2, scale: 0.25 },
  // trái tim xoay 30°, mờ 70%, ở giữa-phải, hiện từ giây 1
  { kind: "sticker", id: "st2", src: "heart.png", start: 1, duration: 4,
    x: 0.75, y: 0.5, scale: 0.3, opacity: 0.7, rotation: 30 },
  // tia sét nhỏ ở dưới, hiện 2 giây cuối
  { kind: "sticker", id: "st3", src: "lightning.png", start: 3, duration: 2,
    x: 0.5, y: 0.85, scale: 0.15 },
];

function num(x) {
  return String(Math.round(x * 1e6) / 1e6);
}

function sh(cmd, argv) {
  const r = spawnSync(cmd, argv, { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`❌ lệnh thất bại: ${cmd} ${argv.join(" ")}`);
    console.error((r.stderr || "").split("\n").slice(-5).join("\n"));
    process.exit(1);
  }
  return r.stdout;
}

function main() {
  // 1. Validate tất cả sticker
  for (const st of STICKERS) {
    const errs = validateSticker(st);
    if (errs.length > 0) { console.error("❌", errs.join("; ")); process.exit(1); }
    if (!fs.existsSync(path.join(STICKER_DIR, st.src))) {
      console.error(`❌ thiếu file sticker: ${st.src}`); process.exit(1);
    }
  }
  console.log(`✅ validate ${STICKERS.length} sticker OK`);

  // 2. Dựng filter graph (mirror pattern render.js: base + setpts shift + overlay eof_action=pass)
  const fc = [];
  fc.push(`testsrc2=s=${W}x${H}:r=${FPS}:d=${num(D)},format=yuv420p[base0]`);
  let base = "[base0]";
  const inputs = [];
  STICKERS.forEach((st, i) => {
    inputs.push("-i", path.join(STICKER_DIR, st.src));
    const { filter, x, y } = buildStickerOverlay(st, W, H);
    const sk = `stk${i}`, sp = `stkp${i}`, nb = `nb${i}`;
    fc.push(`[${i + 1}:v]${filter}[${sk}]`);
    fc.push(`[${sk}]setpts=PTS+${num(st.start)}/TB[${sp}]`);
    fc.push(`${base}[${sp}]overlay=${x}:${y}:eof_action=pass[${nb}]`);
    base = `[${nb}]`;
  });

  const outFile = path.join(outDir, "sticker-demo.mp4");
  const ffArgs = [
    "-f", "lavfi", "-i", `testsrc2=s=${W}x${H}:r=${FPS}:d=${num(D)}`,
    ...inputs,
    "-filter_complex", fc.join(";"),
    "-map", base,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-t", num(D), "-y", outFile,
  ];
  console.log("🎬 render...");
  sh("ffmpeg", ["-v", "error", ...ffArgs]);

  // 3. ffprobe kiểm tra
  const probe = JSON.parse(sh("ffprobe", [
    "-v", "error", "-show_entries", "stream=codec_name,width,height",
    "-show_entries", "format=duration", "-of", "json", outFile,
  ]));
  const vs = probe.streams[0];
  const dur = parseFloat(probe.format.duration);
  const checks = [
    ["video codec h264", vs.codec_name === "h264"],
    [`độ phân giải ${W}x${H}`, vs.width === W && vs.height === H],
    [`thời lượng ≈ ${D}s`, Math.abs(dur - D) < 0.2],
  ];
  let ok = true;
  for (const [name, pass] of checks) {
    console.log(`${pass ? "✅" : "❌"} ${name}`);
    if (!pass) ok = false;
  }

  // 4. Trích frame để xem bằng mắt:
  //    t=0.5 → chỉ có ngôi sao (trái tim chưa hiện, tia sét chưa hiện)
  //    t=2.0 → ngôi sao + trái tim xoay mờ
  //    t=4.0 → cả 3 sticker
  const shots = [
    ["t0_5.png", 0.5, "chỉ ngôi sao góc trái trên"],
    ["t2_0.png", 2.0, "ngôi sao + trái tim xoay mờ giữa-phải"],
    ["t4_0.png", 4.0, "cả 3 sticker (thêm tia sét dưới)"],
  ];
  for (const [name, t, desc] of shots) {
    const p = path.join(outDir, "frames", name);
    sh("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", outFile,
      "-frames:v", "1", p]);
    console.log(`🖼️  ${name}: frame tại t=${t}s → kỳ vọng: ${desc}`);
  }

  console.log(ok ? `\n🎉 TẤT CẢ PASS — output: ${outFile}` : "\n❌ CÓ LỖI");
  process.exit(ok ? 0 : 1);
}

main();
