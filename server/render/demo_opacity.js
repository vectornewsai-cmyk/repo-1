#!/usr/bin/env node
/**
 * demo_opacity.js — Kiểm chứng opacity render THẬT (R1-011).
 *
 * Kịch bản: 2 video track chồng nhau.
 *   track v1 (dưới): clip XANH DƯƠNG (0,0,255), opacity mặc định (=1)
 *   track v2 (trên): clip ĐỎ (255,0,0), opacity = OP
 * Frame giữa → pixel giữa phải = blend(đỏ, xanh, OP):
 *   OP=0.5 → (128,0,128) | OP=1 → (255,0,0) | OP=0 → (0,0,255)
 *
 * Cách dùng: node demo_opacity.js [--out-dir /tmp/opacity-demo]
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const DIR = path.dirname(__filename);
const outDir = (() => {
  const i = process.argv.indexOf("--out-dir");
  return i >= 0 ? process.argv[i + 1] : path.join(os.tmpdir(), "opacity-demo");
})();
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(outDir, "media"), { recursive: true });
fs.mkdirSync(path.join(outDir, "frames"), { recursive: true });

const RENDER = path.join(DIR, "src", "render.js");
const W = 320, H = 180, FPS = 30, D = 2;

function sh(bin, args) {
  const r = spawnSync(bin, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${bin} ${args.join(" ")} → exit ${r.status}\n${r.stderr}`);
  return r.stdout;
}

function ffprobe(file) {
  const raw = sh("ffprobe", ["-v", "error", "-show_entries",
    "stream=codec_name,width,height,avg_frame_rate", "-show_entries", "format=duration",
    "-of", "json", file]);
  return JSON.parse(raw);
}

/** Đọc pixel giữa frame PNG bằng Python PIL (có sẵn). */
function centerPixel(pngPath) {
  const out = sh("python3", ["-c", `
from PIL import Image
img = Image.open(${JSON.stringify(pngPath)}).convert("RGB")
w, h = img.size
print(",".join(map(str, img.getpixel((w//2, h//2)))))
`]);
  return out.trim().split(",").map(Number);
}

function near(actual, expected, tol, label) {
  const ok = actual.every((v, i) => Math.abs(v - expected[i]) <= tol);
  console.log(`   ${ok ? "✅" : "❌"} ${label}: pixel=(${actual.join(",")}) kỳ vọng≈(${expected.join(",")}) ±${tol}`);
  return ok;
}

// ---- 1. Tạo 2 file media màu đặc ----
console.log("== [1] Tạo media ==");
const redMp4 = path.join(outDir, "media", "red.mp4");
const blueMp4 = path.join(outDir, "media", "blue.mp4");
sh("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `color=c=red:s=${W}x${H}:d=${D}:r=${FPS}`,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", redMp4]);
sh("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `color=c=blue:s=${W}x${H}:d=${D}:r=${FPS}`,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", blueMp4]);
console.log("   ✅ red.mp4, blue.mp4");

function makeSpec(opacityTop) {
  const topClip = {
    kind: "video", id: "c-top", src: "red.mp4",
    start: 0, duration: D, in: 0, out: D,
    sourceAudioMode: "mute", // media test không có audio stream (tránh R1-015)
  };
  if (opacityTop !== undefined) topClip.opacity = opacityTop;
  return {
    version: "0.1.0",
    meta: { name: `opacity-${opacityTop}`, width: W, height: H, fps: FPS },
    tracks: [
      {
        kind: "video", id: "v1", name: "Nền",
        clips: [{ kind: "video", id: "c-bg", src: "blue.mp4", start: 0, duration: D, in: 0, out: D,
          sourceAudioMode: "mute" }],
      },
      { kind: "video", id: "v2", name: "Trên", clips: [topClip] },
    ],
  };
}

let allOk = true;

// ---- 2. Ba case opacity ----
console.log("== [2] Render 3 case ==");
const cases = [
  { op: 0.5, expect: [128, 0, 128], label: "opacity=0.5 → tím (blend đỏ/xanh)" },
  { op: 1, expect: [255, 0, 0], label: "opacity=1 → đỏ đặc (không đổi pipeline)" },
  { op: 0, expect: [0, 0, 255], label: "opacity=0 → trong suốt (thấy nền xanh)" },
];
for (const c of cases) {
  const specPath = path.join(outDir, `spec-${c.op}.json`);
  const mp4Path = path.join(outDir, `opacity-${c.op}.mp4`);
  const framePath = path.join(outDir, "frames", `opacity-${c.op}.png`);
  fs.writeFileSync(specPath, JSON.stringify(makeSpec(c.op), null, 2));
  sh("node", [RENDER, "--spec", specPath, "--out", mp4Path,
    "--media-dir", path.join(outDir, "media"), "-y", "-q"]);
  const p = ffprobe(mp4Path);
  const dur = parseFloat(p.format.duration);
  const okDur = Math.abs(dur - D) < 0.2;
  console.log(`   ${okDur ? "✅" : "❌"} opacity-${c.op}.mp4: ${dur.toFixed(2)}s (kỳ vọng ${D}s)`);
  if (!okDur) allOk = false;
  sh("ffmpeg", ["-y", "-v", "error", "-ss", "1", "-i", mp4Path, "-frames:v", "1", framePath]);
  const px = centerPixel(framePath);
  // yuv420p + H.264 làm lệch màu chút → dung sai ±8
  if (!near(px, c.expect, 8, c.label)) allOk = false;
}

// ---- 3. Validator: từ chối opacity sai ----
console.log("== [3] Validator ==");
const { validateSpec } = require("./src/validate.js");
const badCases = [
  [{ opacity: 1.5 }, "opacity > 1"],
  [{ opacity: -0.1 }, "opacity < 0"],
  [{ opacity: "0.5" }, "opacity là chuỗi"],
  [{ opacity: NaN }, "opacity NaN"],
];
for (const [patch, label] of badCases) {
  const spec = makeSpec(undefined);
  Object.assign(spec.tracks[1].clips[0], patch);
  const v = validateSpec(spec);
  const caught = v.errors.some((e) => e.includes("opacity"));
  console.log(`   ${caught ? "✅" : "❌"} từ chối ${label}`);
  if (!caught) allOk = false;
}
// opacity hợp lệ → không lỗi opacity
{
  const spec = makeSpec(0.37);
  const v = validateSpec(spec);
  const opacityErr = v.errors.filter((e) => e.includes("opacity"));
  console.log(`   ${opacityErr.length === 0 ? "✅" : "❌"} chấp nhận opacity=0.37`);
  if (opacityErr.length > 0) allOk = false;
}

// ---- 4. Kết hợp opacity + effects (không vỡ filter graph) ----
console.log("== [4] Kết hợp opacity + effects ==");
{
  const spec = makeSpec(0.6);
  spec.tracks[1].clips[0].effects = [{ type: "grayscale", intensity: 1 }];
  const specPath = path.join(outDir, "spec-combo.json");
  const mp4Path = path.join(outDir, "opacity-combo.mp4");
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  sh("node", [RENDER, "--spec", specPath, "--out", mp4Path,
    "--media-dir", path.join(outDir, "media"), "-y", "-q"]);
  const p = ffprobe(mp4Path);
  const okDur = Math.abs(parseFloat(p.format.duration) - D) < 0.2;
  console.log(`   ${okDur ? "✅" : "❌"} opacity 0.6 + grayscale render OK (${parseFloat(p.format.duration).toFixed(2)}s)`);
  if (!okDur) allOk = false;
}

console.log(allOk ? "\n🎉 TẤT CẢ PASS — output: " + outDir : "\n💥 CÓ CASE FAIL");
process.exit(allOk ? 0 : 1);
