#!/usr/bin/env node
/**
 * demo_image.js — Render MP4 THẬT chứng minh image clip hoạt động end-to-end.
 *
 * Dựng: 3 ảnh bằng PIL (PNG ngang 4:3, JPEG dọc, PNG vuông có alpha) →
 * spec với 3 image clip (contain / cover / contain+alpha) → chạy CHÍNH
 * render.js (kèm validate.js) → ffprobe kiểm tra + trích frame xem bằng mắt.
 *
 * Cách dùng: node demo_image.js [--out-dir /tmp/image-demo]
 * Mã thoát: 0 = tất cả pass, 1 = có lỗi.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
const outDir = path.resolve(args[args.indexOf("--out-dir") + 1] || "/tmp/image-demo");
const mediaDir = path.join(outDir, "media");
fs.mkdirSync(mediaDir, { recursive: true });
fs.mkdirSync(path.join(outDir, "frames"), { recursive: true });

const W = 640, H = 360, FPS = 30;

function sh(cmd, argv, opts = {}) {
  const r = spawnSync(cmd, argv, { encoding: "utf8", ...opts });
  if (r.status !== 0) {
    console.error(`❌ lệnh thất bại: ${cmd} ${argv.slice(0, 6).join(" ")}...`);
    console.error((r.stderr || "").split("\n").slice(-8).join("\n"));
    process.exit(1);
  }
  return r.stdout;
}

function main() {
  // 1. Tạo ảnh test bằng PIL
  console.log("🎨 tạo ảnh test bằng PIL...");
  const py = `
from PIL import Image, ImageDraw

# 1. landscape.png — 4:3 (960x720), gradient + hình + chữ → contain sẽ pillarbox
img = Image.new("RGB", (960, 720))
px = img.load()
for y in range(720):
    for x in range(960):
        px[x, y] = (int(255 * x / 960), int(255 * y / 720), 120)
d = ImageDraw.Draw(img)
d.rectangle([80, 80, 880, 640], outline=(255, 255, 255), width=12)
d.ellipse([380, 260, 580, 460], fill=(255, 80, 80))
d.text((330, 40), "LANDSCAPE 4:3", fill=(255, 255, 255))
img.save(${JSON.stringify(path.join(mediaDir, "landscape.png"))})

# 2. portrait.jpg — dọc 600x900 → cover sẽ crop thành 16:9
img2 = Image.new("RGB", (600, 900), (30, 90, 160))
d2 = ImageDraw.Draw(img2)
d2.rectangle([50, 50, 550, 850], outline=(255, 220, 60), width=10)
for i in range(8):
    d2.ellipse([150, 120 + i * 90, 450, 200 + i * 90], fill=(60 + i * 20, 180, 90))
d2.text((200, 20), "PORTRAIT", fill=(255, 255, 255))
img2.save(${JSON.stringify(path.join(mediaDir, "portrait.jpg"))}, quality=90)

# 3. alpha.png — vuông 500x500, nền trong suốt + vòng tròn đục → alpha flatten về đen
img3 = Image.new("RGBA", (500, 500), (0, 0, 0, 0))
d3 = ImageDraw.Draw(img3)
d3.ellipse([50, 50, 450, 450], fill=(80, 200, 120, 255))
d3.ellipse([175, 175, 325, 325], fill=(200, 80, 80, 255))
d3.text((190, 20), "ALPHA", fill=(255, 255, 255, 255))
img3.save(${JSON.stringify(path.join(mediaDir, "alpha.png"))})
print("OK")
`;
  const out = sh("python3", ["-c", py]).trim();
  console.log(`   PIL: ${out}`);
  for (const f of ["landscape.png", "portrait.jpg", "alpha.png"]) {
    if (!fs.existsSync(path.join(mediaDir, f))) {
      console.error(`❌ thiếu ảnh: ${f}`);
      process.exit(1);
    }
  }

  // 2. Viết spec: 3 image clip nối tiếp, không video track
  const spec = {
    version: "0.1.0",
    meta: { name: "demo-image", width: W, height: H, fps: FPS },
    tracks: [
      {
        kind: "image", id: "timg", label: "Ảnh",
        clips: [
          // 4:3 contain vào 16:9 → pillarbox 2 bên đen
          { kind: "image", id: "c1", src: "landscape.png", start: 0, duration: 3, fit: "contain" },
          // dọc cover vào 16:9 → crop trên/dưới
          { kind: "image", id: "c2", src: "portrait.jpg", start: 3, duration: 3, fit: "cover" },
          // vuông alpha contain → pillarbox, vùng trong suốt thành đen
          { kind: "image", id: "c3", src: "alpha.png", start: 6, duration: 3 },
        ],
      },
    ],
  };
  const specPath = path.join(outDir, "demo-image.json");
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  console.log("✅ spec đã viết (3 image clip, 9s, không video track)");

  // 3. Chạy CHÍNH render.js (kèm validate.js bên trong)
  const outFile = path.join(outDir, "image-demo.mp4");
  console.log("🎬 render bằng render.js...");
  sh("node", [
    path.join(__dirname, "src", "render.js"),
    "--spec", specPath,
    "--out", outFile,
    "--media-dir", mediaDir,
    "-y", "-q",
  ]);

  // 4. ffprobe kiểm tra
  const probe = JSON.parse(sh("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=codec_name,width,height",
    "-show_entries", "format=duration",
    "-of", "json", outFile,
  ]));
  const vs = probe.streams.find((s) => s.codec_name === "h264") || probe.streams[0];
  const dur = parseFloat(probe.format.duration);
  const checks = [
    ["video codec h264", vs.codec_name === "h264"],
    [`độ phân giải ${W}x${H}`, vs.width === W && vs.height === H],
    ["thời lượng ≈ 9s", Math.abs(dur - 9) < 0.3],
  ];
  let ok = true;
  for (const [name, pass] of checks) {
    console.log(`${pass ? "✅" : "❌"} ${name}`);
    if (!pass) ok = false;
  }

  // 5. Trích frame để xem bằng mắt
  const shots = [
    ["t1_5.png", 1.5, "landscape 4:3 contain → pillarbox 2 bên đen, chữ LANDSCAPE"],
    ["t4_5.png", 4.5, "portrait cover → lấp đầy 16:9, crop trên/dưới, không méo"],
    ["t7_5.png", 7.5, "alpha vuông contain → pillarbox, vùng trong suốt thành đen"],
  ];
  for (const [name, t, desc] of shots) {
    const p = path.join(outDir, "frames", name);
    sh("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", outFile, "-frames:v", "1", p]);
    console.log(`🖼️  ${name}: frame tại t=${t}s → kỳ vọng: ${desc}`);
  }

  // 6. Kiểm tra pixel: frame contain phải có viền đen 2 bên
  const pxCheck = sh("python3", ["-c", `
from PIL import Image
img = Image.open(${JSON.stringify(path.join(outDir, "frames", "t1_5.png"))}).convert("RGB")
w, h = img.size
left = img.getpixel((5, h // 2))
center = img.getpixel((w // 2, h // 2))
print(f"LEFT={left} CENTER={center}")
print("PILLARBOX" if left == (0, 0, 0) and center != (0, 0, 0) else "NO_PILLARBOX")
`]).trim().split("\n");
  console.log(`   pixel check: ${pxCheck.join(" | ")}`);
  if (!pxCheck[pxCheck.length - 1].includes("PILLARBOX")) {
    console.error("❌ frame contain không có pillarbox đen 2 bên");
    ok = false;
  } else {
    console.log("✅ pillarbox đen 2 bên đúng cho contain");
  }

  console.log(ok ? `\n🎉 TẤT CẢ PASS — output: ${outFile}` : "\n❌ CÓ LỖI");
  process.exit(ok ? 0 : 1);
}

main();
