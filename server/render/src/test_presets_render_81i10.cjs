#!/usr/bin/env node
/**
 * test_presets_render_81i10.cjs — Kiểm chứng render THẬT theo preset mạng xã hội (đợt 81 I10).
 *
 * Nợ sau đợt 80 H10: preset S4 (tiktok/reels/shorts/youtube/ig-square/ig-portrait)
 * mới chỉ kiểm chứng rời rạc (testsrc2 dễ nén → bitrate dưới mọi trần nên trần
 * không kẹp; trần kẹp chỉ chứng minh trên 1 clip nhiễu với trần 8 Mbps).
 * Script này render THẬT từng preset bằng chính render.js với clip nhiễu khó nén
 * (nullsrc + noise, có audio pink-noise để đo audio) rồi đo bằng ffprobe:
 * resolution, fps, codec, video bitrate trung bình + đỉnh (cửa sổ 1s từ packet),
 * audio codec/sample-rate/kênh/bitrate — đối chiếu với spec của từng preset.
 *
 * Đối chứng:
 *  - uncapped: cùng khổ/CRF/preset với tiktok nhưng KHÔNG --maxrate → chứng
 *    minh trần kẹp thật (capped phải nhỏ hơn nhiều lần).
 *  - CRF: cùng clip dễ nén (testsrc2) ở CRF 20 vs 30 → bitrate phải giảm rõ
 *    (chứng minh --crf đi xuyên tới encoder, không chỉ có trong dry-run).
 *  - dry-run từng preset: câu lệnh ffmpeg phải chứa -crf <n> -maxrate <n>k
 *    -bufsize <2n>k -b:a <ak>k và scale đúng khổ.
 *
 * Ngưỡng verdict (ghi rõ, không giấu):
 *  - video avg <= cap * 1.30 (dung sai VBV của H10: bufsize 2x cho phép "vay
 *    trước" ở clip ngắn 3s — H10 đo 10,04 vs trần 8 = +25%).
 *  - video peak (cửa sổ trượt 1s) <= cap * 2.0 (giới hạn lý thuyết VBV với
 *    bufsize = 2x maxrate: trong 1s encoder tối đa xả được ~bufsize).
 *  - audio bitrate trong [0.5x, 1.25x] target (AAC không ép CBR tuyệt đối;
 *    audio pink-noise khó nén nên phải gần target; dưới 0.5x là dấu hiệu
 *    audio bị rớt bitrate hoặc mất kênh).
 *  - duration 3.0s ± 0.3s; fps đúng 30/1; codec h264 + aac; 48 kHz stereo.
 *
 * Cách chạy: node src/test_presets_render_81i10.cjs (cần ffmpeg/ffprobe).
 * File tạm trong os.tmpdir(), kết quả JSON ghi ra <work>/results.json và in
 * bảng markdown ra stdout. Thời gian ~20 phút (noise 1080x1920 medium chậm).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..", "..");
const RENDER_JS = path.join(__dirname, "render.js");
const PRESETS_TS = path.join(ROOT, "apps", "web", "src", "lib", "exportPresets.ts");

const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-i10-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
console.log(`workdir: ${work}`);

let pass = 0, fail = 0;
const results = [];
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
  return cond;
}
function run(cmd, args, label, timeoutMs) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], timeout: timeoutMs || 1800000 });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-2000)}`);
    process.exit(2);
  }
  return r;
}

// --- 1. Parse preset từ exportPresets.ts (không hardcode spec, chỉ kỳ vọng) ---
const ts = fs.readFileSync(PRESETS_TS, "utf8");
const blocks = ts.split(/(?=^    id: ")/m).filter((b) => /^    id: "/m.test(b));
function field(block, name) {
  const m = new RegExp(`^\\s+${name}: (\\d+),`, "m").exec(block);
  return m ? Number(m[1]) : undefined;
}
function strField(block, name) {
  const m = new RegExp(`^\\s+${name}: "(\\w+)",`, "m").exec(block);
  return m ? m[1] : undefined;
}
const presets = {};
for (const b of blocks) {
  const id = /id: "([\w-]+)"/.exec(b)[1];
  presets[id] = {
    id,
    width: field(b, "width"),
    height: field(b, "height"),
    fps: field(b, "fps"),
    crf: field(b, "crf"),
    x264Preset: strField(b, "x264Preset"),
    audioBitrateKbps: field(b, "audioBitrateKbps"),
    videoBitrateKbps: field(b, "videoBitrateKbps"),
  };
}
console.log(`== Preset parse được từ exportPresets.ts: ${Object.keys(presets).join(", ")}`);
ok(Object.keys(presets).length === 10, `đúng 10 preset (nhận ${Object.keys(presets).length})`);

// Kỳ vọng theo docs/PHASE9_ROUND80_H10_SOCIAL_PRESETS_LIMITS.md §1.1
const EXPECTED = {
  tiktok:      { width: 1080, height: 1920, fps: 30, crf: 20, x264Preset: "medium", audioBitrateKbps: 160, videoBitrateKbps: 10000 },
  reels:       { width: 1080, height: 1920, fps: 30, crf: 20, x264Preset: "medium", audioBitrateKbps: 128, videoBitrateKbps: 8000 },
  shorts:      { width: 1080, height: 1920, fps: 30, crf: 20, x264Preset: "medium", audioBitrateKbps: 384, videoBitrateKbps: 8000 },
  youtube:     { width: 1920, height: 1080, fps: 30, crf: 18, x264Preset: "medium", audioBitrateKbps: 192, videoBitrateKbps: 8000 },
  "ig-square": { width: 1080, height: 1080, fps: 30, crf: 21, x264Preset: "medium", audioBitrateKbps: 128, videoBitrateKbps: 6000 },
  "ig-portrait": { width: 1080, height: 1350, fps: 30, crf: 21, x264Preset: "medium", audioBitrateKbps: 128, videoBitrateKbps: 6000 },
};
for (const [id, exp] of Object.entries(EXPECTED)) {
  const got = presets[id];
  const same = got && Object.keys(exp).every((k) => got[k] === exp[k]);
  ok(same, `preset ${id} trong code khớp spec H10 (${JSON.stringify(got)})`);
  if (!same) { console.error(`   kỳ vọng: ${JSON.stringify(exp)}`); }
}

// --- 2. Media thật ---
console.log("== Chuẩn bị media ==");
const DUR = 3;
run("ffmpeg", ["-y", "-v", "error",
  "-f", "lavfi", "-i", `nullsrc=s=1080x1920:r=30:d=${DUR}`,
  "-f", "lavfi", "-i", `anoisesrc=color=pink:d=${DUR}`,
  "-filter_complex", "[0:v]noise=alls=40:allf=t[v]",
  "-map", "[v]", "-map", "1:a",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-shortest",
  path.join(mediaDir, "noise.mp4")], "tạo noise.mp4 (1080x1920 nhiễu + pink noise)");
run("ffmpeg", ["-y", "-v", "error",
  "-f", "lavfi", "-i", `testsrc2=size=1280x720:rate=30:duration=${DUR}`,
  "-f", "lavfi", "-i", `sine=frequency=440:duration=${DUR}`,
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "160k", "-shortest",
  path.join(mediaDir, "easy.mp4")], "tạo easy.mp4 (testsrc2 + sine 440Hz)");
console.log(`   noise.mp4: ${fs.statSync(path.join(mediaDir, "noise.mp4")).size} B`);

// --- 3. Helper render + probe ---
function specFor(W, H, fps, src) {
  return {
    version: "0.2.0",
    meta: { name: "i10", width: W, height: H, fps },
    tracks: [{ id: "v0", kind: "video", clips: [{ id: "c0", kind: "video", src, start: 0, duration: DUR, in: 0, out: DUR }] }],
  };
}
function render(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [RENDER_JS, "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "--encoder", "libx264", "-y", ...(extraArgs || [])],
    { cwd: path.join(ROOT, "server", "render"), stdio: ["ignore", "pipe", "pipe"], timeout: 1800000 });
  const secs = (Date.now() - t0) / 1000;
  if (r.status !== 0) {
    console.error(`❌ render ${name} thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-2000)}`);
    process.exit(2);
  }
  return { outPath, secs };
}
function dryRun(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const r = spawnSync("node", [RENDER_JS, "--spec", specPath, "--out", path.join(work, `${name}.mp4`),
    "--media-dir", mediaDir, "--encoder", "libx264", "--dry-run", ...(extraArgs || [])],
    { cwd: path.join(ROOT, "server", "render"), stdio: ["ignore", "pipe", "pipe"] });
  return (r.stdout || "").toString() + (r.stderr || "").toString();
}
function probe(file) {
  const r = run("ffprobe", ["-v", "error", "-show_entries",
    "stream=codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,bit_rate,sample_rate,channels",
    "-show_entries", "format=duration,size,bit_rate",
    "-of", "json", file], `ffprobe ${path.basename(file)}`);
  const j = JSON.parse(r.stdout.toString());
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.find((s) => s.codec_type === "audio");
  return {
    vCodec: v?.codec_name, width: v?.width, height: v?.height,
    fps: v?.r_frame_rate, avgFps: v?.avg_frame_rate,
    vBitrate: v?.bit_rate ? Number(v.bit_rate) : null,
    aCodec: a?.codec_name, sampleRate: a?.sample_rate ? Number(a.sample_rate) : null,
    channels: a?.channels, aBitrate: a?.bit_rate ? Number(a.bit_rate) : null,
    duration: Number(j.format.duration), size: Number(j.format.size),
    formatBitrate: Number(j.format.bit_rate),
  };
}
function peak1s(file) {
  const r = run("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "packet=size,pts_time", "-of", "json", file], `ffprobe packets ${path.basename(file)}`);
  const packets = (JSON.parse(r.stdout.toString()).packets || [])
    .map((p) => ({ t: Number(p.pts_time), size: Number(p.size) }))
    .filter((p) => Number.isFinite(p.t) && p.size > 0)
    .sort((a, b) => a.t - b.t);
  let max = 0, j = 0, sum = 0;
  for (let i = 0; i < packets.length; i++) {
    while (j < packets.length && packets[j].t < packets[i].t + 1.0) { sum += packets[j].size; j++; }
    max = Math.max(max, sum);
    sum -= packets[i].size;
  }
  return { peakBps: max * 8, packets: packets.length };
}

// --- 4. Render thật từng preset xã hội ---
console.log("== Render thật 6 preset xã hội (clip nhiễu 3s) ==");
for (const id of Object.keys(EXPECTED)) {
  const p = presets[id];
  const args = ["--crf", String(p.crf), "--x264-preset", p.x264Preset,
    "--maxrate", String(p.videoBitrateKbps), "--audio-bitrate", `${p.audioBitrateKbps}k`];
  // 4a. dry-run: câu lệnh ffmpeg phải chứa đúng cờ preset
  const cmd = dryRun(specFor(p.width, p.height, p.fps, "noise.mp4"), `dry-${id}`, args);
  ok(cmd.includes(`-crf ${p.crf}`), `${id}: dry-run chứa -crf ${p.crf}`);
  ok(cmd.includes(`-maxrate ${p.videoBitrateKbps}k`), `${id}: dry-run chứa -maxrate ${p.videoBitrateKbps}k`);
  ok(cmd.includes(`-bufsize ${p.videoBitrateKbps * 2}k`), `${id}: dry-run chứa -bufsize ${p.videoBitrateKbps * 2}k`);
  ok(cmd.includes(`-b:a ${p.audioBitrateKbps}k`), `${id}: dry-run chứa -b:a ${p.audioBitrateKbps}k`);
  ok(cmd.includes(`scale=${p.width}:${p.height}`), `${id}: dry-run scale ${p.width}x${p.height}`);
  // 4b. render thật
  const { outPath, secs } = render(specFor(p.width, p.height, p.fps, "noise.mp4"), id, args);
  const m = probe(outPath);
  const pk = peak1s(outPath);
  const cap = p.videoBitrateKbps * 1000;
  const row = {
    preset: id, width: m.width, height: m.height, fps: m.fps, vCodec: m.vCodec,
    vBitrateBps: m.vBitrate, vBitrateMbps: m.vBitrate / 1e6,
    capKbps: p.videoBitrateKbps, avgOverCapPct: ((m.vBitrate / cap - 1) * 100),
    peak1sBps: pk.peakBps, peak1sMbps: pk.peakBps / 1e6, peakOverCapPct: ((pk.peakBps / cap - 1) * 100),
    aCodec: m.aCodec, sampleRate: m.sampleRate, channels: m.channels,
    aBitrateBps: m.aBitrate, aBitrateKbps: m.aBitrate / 1000,
    aTargetKbps: p.audioBitrateKbps, aRatioPct: (m.aBitrate / 1000 / p.audioBitrateKbps * 100),
    duration: m.duration, size: m.size, renderSecs: secs,
  };
  results.push(row);
  console.log(`   [${id}] ${m.width}x${m.height} ${m.fps} ${m.vCodec} v=${(m.vBitrate / 1e6).toFixed(2)} Mbps (trần ${p.videoBitrateKbps / 1000} Mbps, ${row.avgOverCapPct >= 0 ? "+" : ""}${row.avgOverCapPct.toFixed(1)}%) peak1s=${(pk.peakBps / 1e6).toFixed(2)} Mbps (${row.peakOverCapPct >= 0 ? "+" : ""}${row.peakOverCapPct.toFixed(1)}%) a=${m.aCodec} ${m.sampleRate}Hz ${m.channels}ch ${(m.aBitrate / 1000).toFixed(0)}k (target ${p.audioBitrateKbps}k) dur=${m.duration}s ${secs.toFixed(1)}s render`);
  ok(m.width === p.width && m.height === p.height, `${id}: đúng khổ ${p.width}x${p.height}`);
  ok(m.fps === "30/1", `${id}: fps 30/1 (nhận ${m.fps})`);
  ok(m.vCodec === "h264", `${id}: codec h264`);
  ok(m.vBitrate <= cap * 1.30, `${id}: video avg ${(m.vBitrate / 1e6).toFixed(2)} Mbps <= trần x1.30 (${(cap * 1.3 / 1e6).toFixed(2)} Mbps)`);
  ok(pk.peakBps <= cap * 2.0, `${id}: peak 1s ${(pk.peakBps / 1e6).toFixed(2)} Mbps <= trần x2.0 (${(cap * 2 / 1e6).toFixed(2)} Mbps)`);
  ok(m.aCodec === "aac" && m.sampleRate === 48000 && m.channels === 2, `${id}: audio aac 48kHz stereo`);
  ok(m.aBitrate >= p.audioBitrateKbps * 1000 * 0.5 && m.aBitrate <= p.audioBitrateKbps * 1000 * 1.25,
    `${id}: audio bitrate ${(m.aBitrate / 1000).toFixed(0)}k trong [0.5x, 1.25x] target ${p.audioBitrateKbps}k`);
  ok(Math.abs(m.duration - DUR) <= 0.3, `${id}: duration ${m.duration}s ≈ ${DUR}s`);
}

// --- 5. Đối chứng uncapped (cùng khổ/CRF với tiktok, không --maxrate) ---
console.log("== Đối chứng uncapped (1080x1920 CRF 20, không trần) ==");
{
  const t = presets.tiktok;
  const { outPath, secs } = render(specFor(t.width, t.height, t.fps, "noise.mp4"), "uncapped",
    ["--crf", String(t.crf), "--x264-preset", t.x264Preset, "--audio-bitrate", `${t.audioBitrateKbps}k`]);
  const m = probe(outPath);
  const pk = peak1s(outPath);
  const capped = results.find((r) => r.preset === "tiktok");
  console.log(`   [uncapped] ${m.width}x${m.height} v=${(m.vBitrate / 1e6).toFixed(2)} Mbps peak1s=${(pk.peakBps / 1e6).toFixed(2)} Mbps size=${m.size} B ${secs.toFixed(1)}s render`);
  results.push({ preset: "uncapped-control", width: m.width, height: m.height, fps: m.fps, vCodec: m.vCodec, vBitrateBps: m.vBitrate, vBitrateMbps: m.vBitrate / 1e6, peak1sBps: pk.peakBps, peak1sMbps: pk.peakBps / 1e6, duration: m.duration, size: m.size, renderSecs: secs });
  ok(m.vBitrate > capped.vBitrateBps * 3, `uncapped ${(m.vBitrate / 1e6).toFixed(1)} Mbps > 3x tiktok capped ${(capped.vBitrateBps / 1e6).toFixed(2)} Mbps → trần kẹp thật`);
}

// --- 6. Đối chứng CRF (clip dễ nén, CRF 20 vs 30, uncapped) ---
console.log("== Đối chứng CRF (testsrc2 720p, CRF 20 vs 30) ==");
{
  const outs = {};
  for (const crf of [20, 30]) {
    const { outPath } = render(specFor(1280, 720, 30, "easy.mp4"), `crf${crf}`,
      ["--crf", String(crf), "--x264-preset", "medium", "--audio-bitrate", "160k"]);
    const m = probe(outPath);
    outs[crf] = m.vBitrate;
    console.log(`   [CRF ${crf}] v=${(m.vBitrate / 1e6).toFixed(3)} Mbps size=${m.size} B`);
  }
  results.push({ preset: "crf20-control", vBitrateBps: outs[20], vBitrateMbps: outs[20] / 1e6 });
  results.push({ preset: "crf30-control", vBitrateBps: outs[30], vBitrateMbps: outs[30] / 1e6 });
  ok(outs[30] < outs[20] * 0.7, `CRF 30 (${(outs[30] / 1e6).toFixed(3)} Mbps) < 0.7x CRF 20 (${(outs[20] / 1e6).toFixed(3)} Mbps) → --crf đi xuyên tới encoder`);
}

writeFileEpermRetry(path.join(work, "results.json"), JSON.stringify({ work, presets, results, pass, fail }, null, 2));
console.log("\n== Bảng tổng kết (video avg / peak 1s / audio) ==");
console.log("| preset | khổ | fps | codec | v-avg Mbps | trần | vượt avg | peak1s Mbps | vượt peak | audio |");
console.log("|---|---|---|---|---|---|---|---|---|---|");
for (const r of results.filter((x) => EXPECTED[x.preset])) {
  console.log(`| ${r.preset} | ${r.width}x${r.height} | ${r.fps} | ${r.vCodec} | ${r.vBitrateMbps.toFixed(2)} | ${r.capKbps / 1000} | ${r.avgOverCapPct >= 0 ? "+" : ""}${r.avgOverCapPct.toFixed(1)}% | ${r.peak1sMbps.toFixed(2)} | ${r.peakOverCapPct >= 0 ? "+" : ""}${r.peakOverCapPct.toFixed(1)}% | ${r.aCodec} ${r.aBitrateKbps.toFixed(0)}k/${r.aTargetKbps}k |`);
}
console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail — results.json: ${path.join(work, "results.json")}`);
process.exit(fail ? 1 : 0);
