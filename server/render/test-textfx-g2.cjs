#!/usr/bin/env node
/**
 * test-textfx-g2.cjs — Render MP4 thật cho từng animation mới (Batch G, R1-070).
 *
 * Mỗi animation: 1 spec với 1 text clip 3s → render → ffprobe kiểm tra
 * MP4 hợp lệ (video stream, duration ≈ 3s). Không crash = pass.
 * Thêm kiểm tra frame: trích 1 frame giữa clip, đảm bảo không rỗng.
 */
"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const RENDER = path.join(__dirname, "src", "render.js");
const ANIMS = [
  "slideInDown", "popIn",
  "fadeOut", "fadeOutUp", "slideOutRight", "slideOutDown",
  "wave", "blink", "shake", "fadeInOut",
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "textfx-g2-"));
let pass = 0, fail = 0;

for (const anim of ANIMS) {
  const spec = {
    version: "0.2.0",
    meta: { width: 640, height: 360, fps: 30, name: `textfx-g2-${anim}` },
    tracks: [
      {
        id: "t1", kind: "text", name: "Text",
        clips: [
          {
            id: "c1", kind: "text", trackId: "t1",
            start: 0, duration: 3,
            text: "Kiem tra " + anim,
            style: {
              x: 0.5, y: 0.5, fontFamily: "DejaVu Sans", fontSize: 42, color: "#ffffff",
              animation: anim,
            },
          },
        ],
      },
    ],
  };
  const specPath = path.join(tmp, `${anim}.json`);
  const outPath = path.join(tmp, `${anim}.mp4`);
  fs.writeFileSync(specPath, JSON.stringify(spec));

  try {
    execFileSync("node", [RENDER, "--spec", specPath, "--out", outPath, "-y", "-q"],
      { stdio: "pipe", timeout: 120000 });
    // ffprobe: kiểm tra video stream + duration
    const probe = execFileSync("ffprobe",
      ["-v", "error", "-show_entries", "stream=codec_type,width,height",
       "-show_entries", "format=duration", "-of", "csv=p=0", outPath],
      { encoding: "utf8" });
    const dur = parseFloat(probe.trim().split("\n").pop());
    const okDur = Math.abs(dur - 3.0) < 0.5;
    const okStream = probe.includes("video");
    // Trích 1 frame giữa clip (t=1.5s) → đảm bảo decode được
    const framePath = path.join(tmp, `${anim}-frame.png`);
    execFileSync("ffmpeg",
      ["-y", "-v", "error", "-ss", "1.5", "-i", outPath, "-frames:v", "1", framePath],
      { stdio: "pipe", timeout: 30000 });
    const frameSize = fs.statSync(framePath).size;
    if (okDur && okStream && frameSize > 1000) {
      console.log(`  ✅ ${anim}: MP4 hợp lệ (${dur.toFixed(2)}s, frame ${frameSize} bytes)`);
      pass++;
    } else {
      console.log(`  ❌ ${anim}: duration=${dur}, stream video=${okStream}, frame=${frameSize}`);
      fail++;
    }
  } catch (err) {
    const msg = (err.stderr || err.message || "").toString().slice(0, 300);
    console.log(`  ❌ ${anim}: CRASH — ${msg}`);
    fail++;
  }
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail > 0 ? 1 : 0);
