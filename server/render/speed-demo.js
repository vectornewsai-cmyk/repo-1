#!/usr/bin/env node
/**
 * speed-demo.js — Chứng minh SPEED CONTROL + REVERSE bằng video THẬT.
 *
 * KHÔNG sửa render.js: script độc lập, dùng module speed.js để dựng
 * filter chain rồi chạy ffmpeg trực tiếp (mô phỏng đúng vị trí chèn filter
 * trong render.js: ngay sau trim/setpts=PTS-STARTPTS).
 *
 * Cách dùng:
 *   node speed-demo.js [--out-dir /tmp/speed-demo]
 *
 * Mỗi case: cắt đoạn [in, out) từ media mẫu → áp speed/reverse → render MP4
 * → đo duration bằng ffprobe → so với kỳ vọng (out-in)/speed → in PASS/FAIL.
 * Cuối cùng trích frame PNG để kiểm chứng bằng mắt (timecode của testsrc2).
 *
 * Media mẫu (có sẵn, tự tạo bằng ffmpeg, không tải ngoài):
 *   examples/media/clip2.mp4  — testsrc2 8s, CÓ timecode hiện trên hình
 *                                → nhìn timecode là biết reverse đúng/sai
 *   examples/media/music.m4a  — sine 660Hz 12s (audio để test atempo)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");
const { buildSpeedFilter, effectiveDuration } = require("./src/speed");

const ROOT = __dirname;
const MEDIA = path.join(ROOT, "examples", "media");
const SRC_VIDEO = path.join(MEDIA, "clip2.mp4"); // testsrc2 + timecode
const SRC_AUDIO = path.join(MEDIA, "music.m4a"); // sine 660Hz

const args = process.argv.slice(2);
const outDir = path.resolve(
  args[args.indexOf("--out-dir") + 1] || "/tmp/speed-demo"
);
fs.mkdirSync(outDir, { recursive: true });

const W = 1280, H = 720, FPS = 30;

// Đoạn nguồn dùng cho mọi case: [2, 6) = 4 giây
const SEG_IN = 2, SEG_OUT = 6;

const CASES = [
  { name: "slow-0.5x",   speed: 0.5,  reverse: false, note: "slow motion: 4s → 8s" },
  { name: "fast-2x",     speed: 2,    reverse: false, note: "tua nhanh: 4s → 2s" },
  { name: "fast-4x",     speed: 4,    reverse: false, note: "tua nhanh 4x (atempo chain 2,2): 4s → 1s" },
  { name: "slow-0.25x",  speed: 0.25, reverse: false, note: "chậm 4x (atempo chain 0.5,0.5): 4s → 16s" },
  { name: "fast-1.5x",   speed: 1.5,  reverse: false, note: "tốc độ lẻ: 4s → 2.667s" },
  { name: "reverse",      speed: 1,    reverse: true,  note: "đảo ngược: 4s → 4s, timecode phải đếm NGƯỢC" },
  { name: "reverse-2x",   speed: 2,    reverse: true,  note: "đảo ngược + nhanh 2x: 4s → 2s" },
];

/** ffprobe lấy duration của video stream và audio stream. */
function probeDurations(file) {
  const raw = execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=codec_type,duration",
    "-of", "json", file,
  ], { encoding: "utf8" });
  const j = JSON.parse(raw);
  const out = {};
  for (const s of j.streams || []) {
    if (s.codec_type === "video" || s.codec_type === "audio") out[s.codec_type] = parseFloat(s.duration);
  }
  return out;
}

function runFfmpeg(ffArgs) {
  const r = spawnSync("ffmpeg", ffArgs, { stdio: ["ignore", "ignore", "pipe"] });
  if (r.status !== 0) {
    throw new Error(`ffmpeg thất bại (mã ${r.status}): ${r.stderr.toString().slice(-2000)}`);
  }
}

let failures = 0;
const results = [];

for (const c of CASES) {
  const { video, audio } = buildSpeedFilter(c.speed, c.reverse);
  const outFile = path.join(outDir, `${c.name}.mp4`);

  // Chain mô phỏng đúng render.js: trim → PTS-STARTPTS → [speed filter] → chuẩn hoá
  const vChain = [`[0:v]trim=start=${SEG_IN}:end=${SEG_OUT}`, `setpts=PTS-STARTPTS`];
  if (video) vChain.push(video);
  vChain.push(`scale=${W}:${H}`, `fps=${FPS}`, `format=yuv420p`);
  const aChain = [`[1:a]atrim=start=${SEG_IN}:end=${SEG_OUT}`, `asetpts=PTS-STARTPTS`];
  if (audio) aChain.push(audio);
  aChain.push(`aresample=48000`, `aformat=sample_fmts=fltp:channel_layouts=stereo`);

  const fc = `${vChain.join(",")}[v];${aChain.join(",")}[a]`;
  // KHÔNG dùng -t: để filter tự quyết duration → ffprobe sẽ chứng minh
  runFfmpeg([
    "-y", "-v", "error",
    "-i", SRC_VIDEO, "-i", SRC_AUDIO,
    "-filter_complex", fc,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
    "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
    outFile,
  ]);

  const expected = effectiveDuration(SEG_IN, SEG_OUT, c.speed);
  const got = probeDurations(outFile);
  const okV = Math.abs((got.video ?? -1) - expected) <= 0.15;
  const okA = Math.abs((got.audio ?? -1) - expected) <= 0.15;
  const ok = okV && okA;
  if (!ok) failures++;
  results.push({ ...c, outFile, expected, got, ok });
  const mark = ok ? "✅ PASS" : "❌ FAIL";
  console.log(
    `${mark} ${c.name} (${c.note})\n` +
    `     kỳ vọng: ${expected.toFixed(3)}s | video: ${(got.video ?? NaN).toFixed(3)}s | audio: ${(got.audio ?? NaN).toFixed(3)}s`
  );
}

// ---- Trích frame để kiểm chứng bằng mắt (timecode của testsrc2) ----
const framesDir = path.join(outDir, "frames");
fs.mkdirSync(framesDir, { recursive: true });
/** [file, time, outName, kỳ vọng timecode nguồn] */
const FRAME_CHECKS = [
  // slow 0.5x: output t=1.0 → nguồn t = 2 + 1.0*0.5 = 2.5
  ["slow-0.5x.mp4", 1.0, "slow_t1.png", "≈ 00:00:02:15"],
  // fast 2x: output t=1.0 → nguồn t = 2 + 2.0 = 4.0
  ["fast-2x.mp4", 1.0, "fast_t1.png", "≈ 00:00:04:00"],
  // reverse: output t=0.3 → nguồn t ≈ 6 - 0.3 = 5.7 (đầu output = cuối đoạn nguồn)
  ["reverse.mp4", 0.3, "reverse_t0.png", "≈ 00:00:05:21 (GẦN CUỐI đoạn nguồn)"],
  // reverse: output t=3.5 → nguồn t ≈ 6 - 3.5 = 2.5 (cuối output = đầu đoạn nguồn)
  ["reverse.mp4", 3.5, "reverse_t3.png", "≈ 00:00:02:15 (GẦN ĐẦU đoạn nguồn)"],
];
console.log("\n🖼️  Trích frame kiểm chứng:");
for (const [file, t, outName, expectTc] of FRAME_CHECKS) {
  const out = path.join(framesDir, outName);
  runFfmpeg(["-y", "-v", "error", "-ss", String(t), "-i", path.join(outDir, file),
    "-frames:v", "1", out]);
  console.log(`   ${outName}: frame tại t=${t}s của ${file} → timecode kỳ vọng ${expectTc}`);
}

console.log(`\n${failures === 0 ? "🎉 TẤT CẢ PASS" : `⚠️  ${failures} case FAIL`} — output: ${outDir}`);
process.exit(failures === 0 ? 0 : 1);
