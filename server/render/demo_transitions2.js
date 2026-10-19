#!/usr/bin/env node
/**
 * demo_transitions2.js — R1-073 (Batch G): Render MP4 THẬT cho 15 transition mới,
 * dùng CHÍNH buildXfadeFilter() từ transitions.js.
 *
 * Cách dùng:
 *   node demo_transitions2.js [--out-dir ./demo_out]
 *
 * 3 video, mỗi video là các đoạn màu đặc 2s nối bằng xfade 1s. Sau render:
 *   1. ffprobe kiểm tra codec/resolution/duration
 *   2. trích 1 frame giữa mỗi transition
 *   3. kiểm tra frame không phải toàn đen (sanity — transition đã "làm gì đó")
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
    name: "demo-smooth",
    segments: ["red", "lime", "blue", "yellow", "magenta"],
    transitions: ["smoothleft", "smoothright", "smoothup", "smoothdown"],
  },
  {
    name: "demo-slides2",
    segments: ["cyan", "orange", "purple", "red", "lime", "blue"],
    transitions: ["slideup", "slidedown", "vertopen", "horzopen", "diagtl"],
  },
  {
    name: "demo-fx2",
    segments: ["yellow", "magenta", "cyan", "red", "blue", "lime", "orange"],
    transitions: ["circleclose", "circlecrop", "rectcrop", "pixelize", "hblur", "distance"],
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

  let totalTransitions = 0;
  let failures = 0;

  for (const v of VIDEOS) {
    console.log(`\n===== ${v.name} =====`);
    const n = v.segments.length;

    // 1. Dựng filter_complex bằng CHÍNH buildXfadeFilter của transitions.js
    const fc = [];
    let cur = "[0:v]";
    let outDur = SEG;
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
      totalTransitions++;
    }

    // 2. Tạo input: n đoạn màu đặc
    const inputs = [];
    for (let i = 0; i < n; i++) {
      inputs.push("-f", "lavfi", "-i", `color=c=${v.segments[i]}:s=${W}x${H}:r=${FPS}:d=${SEG}`);
    }
    const outFile = path.join(outDir, `${v.name}.mp4`);
    const args = [
      ...inputs,
      "-filter_complex", fc.join(";"),
      "-map", cur,
      "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-t", String(outDur),
      "-y", outFile,
    ];
    console.log(`render ${n} đoạn, ${v.transitions.length} transitions...`);
    const rr = spawnSync("ffmpeg", args, { encoding: "utf8" });
    if (rr.status !== 0) {
      console.error(`❌ render thất bại: ${v.name}`);
      console.error((rr.stderr || "").split("\n").slice(-10).join("\n"));
      failures++;
      continue;
    }

    // 3. ffprobe kiểm tra
    const probe = run("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=codec_name,width,height",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1", outFile,
    ]).stdout;
    const dur = parseFloat((probe.match(/duration=([\d.]+)/) || [])[1] || "0");
    if (!/codec_name=h264/.test(probe) || Math.abs(dur - outDur) > 0.5) {
      console.error(`❌ ffprobe không đạt: ${v.name}\n${probe}`);
      failures++;
      continue;
    }
    console.log(`✅ ${v.name}: h264 ${W}x${H}, ${dur.toFixed(2)}s`);

    // 4. Trích frame tại 3 điểm trong mỗi transition + kiểm tra hiệu ứng thật.
    //    Lưu ý trung thực: circlecrop/rectcrop của FFmpeg ĐI QUA FRAME ĐEN ở
    //    chính giữa (clip cũ co về 0 rồi clip mới nở ra) — nên lấy mẫu ở
    //    25%/50%/75%, chỉ cần ≥1 mẫu có nội dung (mean > 5) là transition
    //    đã render thật, không crash, không đen toàn bộ.
    for (const m of midTimes) {
      const samples = [0.25, 0.5, 0.75].map((f) => m.t - T / 2 + T * f);
      let bestMean = 0;
      let bestFile = "";
      for (const st of samples) {
        const frameFile = path.join(framesDir, `${v.name}-${m.type}.png`);
        run("ffmpeg", ["-y", "-v", "error", "-ss", st.toFixed(3), "-i", outFile, "-frames:v", "1", frameFile]);
        const raw = spawnSync("ffmpeg", [
          "-v", "error", "-i", frameFile, "-f", "rawvideo", "-pix_fmt", "gray", "-",
        ], { encoding: "buffer" });
        if (raw.status !== 0 || !raw.stdout || raw.stdout.length === 0) {
          console.error(`❌ không đọc được frame: ${m.type}`);
          failures++;
          continue;
        }
        const buf = raw.stdout;
        let sum = 0;
        const step = Math.max(1, Math.floor(buf.length / 10000));
        let cnt = 0;
        for (let i = 0; i < buf.length; i += step) { sum += buf[i]; cnt++; }
        const mean = sum / cnt;
        if (mean > bestMean) { bestMean = mean; bestFile = frameFile; }
      }
      if (bestMean < 5) {
        console.error(`❌ transition đen toàn bộ ở cả 3 mẫu (best mean=${bestMean.toFixed(1)}): ${m.type}`);
        failures++;
      } else {
        console.log(`  ✅ ${m.type} (${m.label}): mẫu tốt nhất mean=${bestMean.toFixed(0)}`);
      }
    }
  }

  console.log(`\n==========================================`);
  console.log(`Tổng transitions mới đã test: ${totalTransitions}`);
  if (failures > 0) {
    console.error(`❌ THẤT BẠI: ${failures} lỗi`);
    process.exit(1);
  }
  console.log(`🎉 TRANSITIONS2 PASS: ${totalTransitions}/15 render thật thành công, không crash`);
}

main();
