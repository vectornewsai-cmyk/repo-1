#!/usr/bin/env node
/**
 * demo_transitions.js — Render 3 video MP4 THẬT, mỗi video demo 2-5 transitions
 * khác nhau, dùng CHÍNH buildXfadeFilter() từ transitions.js để dựng filter.
 *
 * Cách dùng:
 *   node demo_transitions.js [--out-dir ./demo_out]
 *
 * Mỗi video: các đoạn màu đặc 2s nối bằng xfade 1s. Sau khi render, script tự:
 *   1. ffprobe kiểm tra codec/resolution/duration
 *   2. trích 1 frame giữa mỗi transition vào <out-dir>/frames/ để xem bằng mắt
 *
 * Mã thoát: 0 = tất cả pass, 1 = có lỗi.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildXfadeFilter, getTransition } = require("./src/transitions");

const SEG = 2;      // mỗi đoạn màu dài 2s
const T = 1;        // mỗi transition dài 1s
const W = 640, H = 360, FPS = 30;

const VIDEOS = [
  {
    name: "demo-wipes",
    segments: ["red", "lime", "blue", "yellow"],
    transitions: ["wipeleft", "wiperight", "wipedown"],
  },
  {
    name: "demo-slides",
    segments: ["magenta", "cyan", "orange", "purple"],
    transitions: ["slideleft", "slideright", "wipeup"],
  },
  {
    name: "demo-fx",
    segments: ["red", "blue", "lime", "yellow", "magenta", "cyan"],
    transitions: ["dissolve", "circleopen", "fadeblack", "fadewhite", "radial"],
  },
];

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (r.status !== 0) {
    console.error(`❌ LỆNH THẤT BẠI: ${cmd} ${args.join(" ")}`);
    console.error((r.stderr || "").split("\n").slice(-15).join("\n"));
    process.exit(1);
  }
  return r;
}

function main() {
  const outDir = path.resolve(process.argv[2] === "--out-dir" ? process.argv[3] : "./demo_out");
  const framesDir = path.join(outDir, "frames");
  fs.mkdirSync(framesDir, { recursive: true });

  let failures = 0;

  for (const v of VIDEOS) {
    console.log(`\n===== ${v.name} =====`);
    const n = v.segments.length;

    // 1. Dựng filter_complex bằng CHÍNH buildXfadeFilter của transitions.js
    const fc = [];
    let cur = "[0:v]";
    let outDur = SEG; // độ dài output tích lũy
    const midTimes = [];
    for (let i = 0; i < v.transitions.length; i++) {
      const type = v.transitions[i];
      const meta = getTransition(type);
      if (!meta) { console.error(`❌ transition không tồn tại: ${type}`); process.exit(1); }
      const offset = outDur - T;
      const filter = buildXfadeFilter(type, T, offset);
      const x = `x${i}`;
      fc.push(`${cur}[${i + 1}:v]${filter}[${x}]`);
      cur = `[${x}]`;
      midTimes.push({ type, t: offset + T / 2, label: meta.label });
      outDur = outDur + SEG - T;
    }
    const filterComplex = fc.join(";");

    // 2. Render
    const outFile = path.join(outDir, `${v.name}.mp4`);
    const args = [];
    for (const c of v.segments) {
      args.push("-f", "lavfi", "-i", `color=c=${c}:s=${W}x${H}:r=${FPS}:d=${SEG}`);
    }
    args.push(
      "-filter_complex", filterComplex,
      "-map", cur,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
      "-pix_fmt", "yuv420p", "-r", String(FPS),
      "-t", String(outDur),
      "-y", outFile
    );
    console.log(`🎬 render ${n} đoạn, ${v.transitions.length} transitions → ${outFile}`);
    run("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args]);

    // 3. ffprobe kiểm tra
    const probe = JSON.parse(run("ffprobe", [
      "-v", "error", "-show_entries", "stream=codec_name,width,height,avg_frame_rate",
      "-show_entries", "format=duration", "-of", "json", outFile,
    ]).stdout);
    const vs = probe.streams.find((s) => s.width);
    const dur = parseFloat(probe.format.duration);
    const checks = [
      ["codec h264", vs.codec_name === "h264"],
      [`resolution ${W}x${H}`, vs.width === W && vs.height === H],
      [`duration ≈ ${outDur}s`, Math.abs(dur - outDur) < 0.2],
    ];
    for (const [label, ok] of checks) {
      console.log(`   ${ok ? "✅" : "❌"} ${label}`);
      if (!ok) failures++;
    }

    // 4. Trích frame giữa mỗi transition
    for (const m of midTimes) {
      const frameFile = path.join(framesDir, `${v.name}-${m.type}-mid.png`);
      run("ffmpeg", ["-hide_banner", "-loglevel", "error",
        "-ss", String(m.t), "-i", outFile, "-frames:v", "1", "-y", frameFile]);
      console.log(`   🖼️  frame giữa "${m.label}" (t=${m.t}s) → ${path.basename(frameFile)}`);
    }
  }

  console.log(failures === 0
    ? `\n✅ TẤT CẢ PASS — xem frames trong ${framesDir} để kiểm chứng bằng mắt`
    : `\n❌ CÓ ${failures} LỖI`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
