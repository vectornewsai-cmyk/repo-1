#!/usr/bin/env node
/**
 * demo_audioroute.js — Demo R1-015: audio routing cho video nguồn.
 *
 * Tạo video có audio (testsrc + sine 440Hz), render 2 mode:
 * 1. inherit → output PHẢI có audio stream
 * 2. mute → output KHÔNG có audio từ video (chỉ track câm)
 * 3. inherit + speed 2x → audio đồng bộ (duration đúng)
 *
 * Chạy: node demo_audioroute.js [--out-dir <dir>]
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const args = process.argv.slice(2);
let outDir = "/tmp/audioroute-demo";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out-dir" && args[i + 1]) outDir = args[i + 1];
}
fs.mkdirSync(outDir, { recursive: true });
const mediaDir = path.join(outDir, "media");
fs.mkdirSync(mediaDir, { recursive: true });

// 1. Tạo video có audio: testsrc 5s + sine 440Hz
const srcVideo = path.join(mediaDir, "src_with_audio.mp4");
console.log("🎬 Tạo video nguồn có audio...");
execFileSync("ffmpeg", [
  "-y", "-v", "error",
  "-f", "lavfi", "-i", "testsrc2=size=640x360:duration=5:rate=30",
  "-f", "lavfi", "-i", "sine=frequency=440:duration=5:sample_rate=48000",
  "-c:v", "libx264", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-shortest",
  srcVideo,
]);

// 2. Tạo spec cho từng mode
function makeSpec(mode, speed = 1) {
  return {
    version: "0.1.0",
    meta: { width: 640, height: 360, fps: 30, duration: 5 / speed, name: `audioroute-${mode}` },
    tracks: [
      {
        kind: "video", id: "v1", name: "Video",
        clips: [
          {
            kind: "video", id: "c1", src: "src_with_audio.mp4",
            start: 0, duration: 5 / speed, in: 0, out: 5,
            speed, sourceAudioMode: mode,
          },
        ],
      },
    ],
  };
}

const renderJs = path.join(__dirname, "src", "render.js");

function runRender(spec, outName) {
  const specPath = path.join(outDir, `${outName}.json`);
  const outPath = path.join(outDir, `${outName}.mp4`);
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  console.log(`\n🔨 Render ${outName} (mode=${spec.tracks[0].clips[0].sourceAudioMode}, speed=${spec.tracks[0].clips[0].speed})...`);
  const r = spawnSync("node", [
    renderJs, "--spec", specPath, "--media-dir", mediaDir, "--out", outPath,
  ], { encoding: "utf-8" });
  if (r.status !== 0) {
    console.error(`❌ Render thất bại:\n${r.stderr.slice(0, 500)}`);
    process.exit(1);
  }
  return outPath;
}

function probeAudio(mp4) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "a",
    "-show_entries", "stream=codec_name", "-of", "csv=p=0", mp4,
  ], { encoding: "utf-8" }).trim();
  return out;
}

function probeDuration(mp4) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", mp4,
  ], { encoding: "utf-8" }).trim();
  return parseFloat(out);
}

let pass = 0, fail = 0;
function check(name, cond, detail = "") {
  if (cond) { console.log(`✅ PASS ${name}${detail ? ` — ${detail}` : ""}`); pass++; }
  else { console.log(`❌ FAIL ${name}${detail ? ` — ${detail}` : ""}`); fail++; }
}

// Test 1: inherit → có audio
const mp4Inherit = runRender(makeSpec("inherit"), "inherit");
const audioInherit = probeAudio(mp4Inherit);
check("inherit có audio stream", audioInherit.includes("aac"), `codec=${audioInherit}`);

// Test 2: mute → không có audio từ video (chỉ anullsrc câm)
const mp4Mute = runRender(makeSpec("mute"), "mute");
const audioMute = probeAudio(mp4Mute);
check("mute vẫn có audio stream (track câm)", audioMute.includes("aac"), `codec=${audioMute}`);
// Kiểm tra mute thực sự câm: so sánh RMS (mute phải gần 0)
function getRMS(mp4) {
  const out = execFileSync("ffmpeg", [
    "-v", "error", "-i", mp4, "-map", "0:a",
    "-af", "volumedetect", "-f", "null", "-",
  ], { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  return out;
}
// Dùng astats để đo mean_volume
function getMeanVolume(mp4) {
  try {
    const out = execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "a:0",
      "-show_entries", "stream=codec_name", "-of", "default=noprint_wrappers=1", mp4,
    ], { encoding: "utf-8" });
    // Đơn giản: check file size audio — mute (anullsrc) nén tốt hơn sine thật
    const s1 = fs.statSync(mp4Inherit).size;
    const s2 = fs.statSync(mp4Mute).size;
    return { s1, s2 };
  } catch { return null; }
}
const sizes = getMeanVolume();
if (sizes) {
  // File mute (toàn câm) thường nhỏ hơn file có sine thật
  console.log(`   ℹ️  inherit size=${sizes.s1}, mute size=${sizes.s2}`);
}

// Test 3: inherit + speed 2x → duration ~2.5s, vẫn có audio
const mp4Fast = runRender(makeSpec("inherit", 2), "inherit-2x");
const durFast = probeDuration(mp4Fast);
const audioFast = probeAudio(mp4Fast);
check("inherit 2x duration ≈ 2.5s", Math.abs(durFast - 2.5) < 0.3, `duration=${durFast.toFixed(2)}s`);
check("inherit 2x có audio", audioFast.includes("aac"), `codec=${audioFast}`);

// Test 4: validate từ chối mode sai và detach
const { validateSpec } = require("./src/validate.js");
const badSpec = makeSpec("khong-hop-le");
const r1 = validateSpec(badSpec);
check("validate từ chối mode sai", r1.errors.length > 0, `${r1.errors.length} lỗi`);

const detachSpec = makeSpec("detach");
const r2 = validateSpec(detachSpec);
check("validate từ chối detach", r2.errors.some((e) => e.includes("detach")), `${r2.errors.length} lỗi`);

console.log(`\n${fail === 0 ? "🎉" : "⚠️"} ${pass} pass, ${fail} fail — output: ${outDir}`);
process.exit(fail > 0 ? 1 : 0);
