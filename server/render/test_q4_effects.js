// test_q4_effects.js — Q4 (Phase 8): render thật 9 effect video mới ra MP4,
// trích frame giữa rồi đo bằng PIL (test_q4_effects_measure.py).
// Chạy: node server/render/test_q4_effects.js
// Kỳ vọng: 9/9 effect render exit 0 + measure script pass hết.
"use strict";

const { execFileSync, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname);
const MEDIA = "/tmp/q4_fx/media";
const OUT = "/tmp/q4_fx/out";
fs.mkdirSync(MEDIA, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts });
}

function sh(s) {
  return execSync(s, { encoding: "utf8", stdio: "pipe" });
}

// 1. Nguồn: PNG bất đối xứng (trái đỏ / phải xanh + dải gradient + hình tròn trắng)
//    + MP4 tĩnh 2s từ PNG đó (đủ để effect nào cũng có frame đo).
const SRC_PNG = path.join(MEDIA, "q4src.png");
const SRC_MP4 = path.join(MEDIA, "q4src.mp4");
if (!fs.existsSync(SRC_PNG)) {
  run("python3", [path.join(ROOT, "test_q4_effects_gen.py"), SRC_PNG]);
}
if (!fs.existsSync(SRC_MP4)) {
  sh(`ffmpeg -y -v error -loop 1 -i ${SRC_PNG} -t 2 -c:v libx264 -pix_fmt yuv420p ${SRC_MP4}`);
}

// 2. Render 9 effect (mỗi effect 1 clip, intensity 0.5; invert thêm bản 1.0 để đo đảo tuyệt đối).
const EFFECTS = [
  "glitch", "rgb-shift", "shake", "pixelate", "mirror",
  "old-film", "invert", "edgedetect", "hue-rotate",
];
const jobs = [];
for (const fx of EFFECTS) {
  jobs.push({ fx, intensity: 0.5 });
}
jobs.push({ fx: "invert", intensity: 1.0, suffix: "full" });

let fail = 0;
for (const j of jobs) {
  const tag = j.suffix ? `${j.fx}-${j.suffix}` : j.fx;
  const spec = {
    version: "0.2.0",
    meta: { name: `q4-${tag}`, width: 320, height: 180, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: [{
        id: "c1", kind: "video", src: "q4src.mp4", start: 0,
        duration: 2, in: 0, out: 2,
        effects: [{ type: j.fx, intensity: j.intensity }],
      }],
    }],
  };
  const specPath = path.join(OUT, `${tag}.json`);
  const outMp4 = path.join(OUT, `${tag}.mp4`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  try {
    run("node", [path.join(ROOT, "src", "render.js"), "--spec", specPath,
      "--out", outMp4, "--media-dir", MEDIA, "-y"]);
    if (!fs.existsSync(outMp4)) throw new Error("không có file output");
    // Trích frame giữa (t=1.0s) ra PNG để đo.
    sh(`ffmpeg -y -v error -ss 1.0 -i ${outMp4} -frames:v 1 ${path.join(OUT, tag + ".png")}`);
    console.log(`  ✅ render ${tag} OK`);
  } catch (e) {
    fail++;
    console.error(`  ❌ render ${tag} FAIL: ${String(e.message || e).slice(0, 300)}`);
  }
}
// Frame gốc để đối chiếu.
sh(`ffmpeg -y -v error -ss 1.0 -i ${SRC_MP4} -frames:v 1 ${path.join(OUT, "src.png")}`);
console.log(`== render: ${jobs.length - fail}/${jobs.length} pass ==`);
if (fail > 0) process.exit(1);

// 3. Đo pixel bằng PIL.
try {
  const out = run("python3", [path.join(ROOT, "test_q4_effects_measure.py"), OUT]);
  console.log(out);
} catch (e) {
  console.error(e.stdout || e.message);
  process.exit(1);
}
