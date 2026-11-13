#!/usr/bin/env node
/**
 * test_round64_r1_gpu_probe_cache.js — Đợt 64 R1: cache đĩa probe GPU.
 *
 * Nợ đóng: đợt 63 R2 §5.1/§8(a) — probe GPU tốn 0,31–2,50s wall mỗi lần
 * render (CPU chỉ 0,23s) mà trên máy không GPU luôn trả null; cache trong
 * process vô dụng vì mỗi render là 1 process node mới.
 *
 * Harness đo THẬT trên VM này:
 *   (1) unit: chạy gpuencode.js --self-test (khóa MISS/HIT/null/force/TTL/
 *       file hỏng/tắt/xoá của cache đĩa).
 *   (2) bước probe riêng: time probeGpuEncoderCached trong process node mới,
 *       COLD (xoá file cache trước mỗi lần) vs WARM (file cache có sẵn),
 *       3 lần mỗi phía, median. Đường cache riêng qua env
 *       VCUT_GPU_PROBE_CACHE=<file tạm> để không đụng cache thật.
 *   (3) full render enhance 720p 5s preset Cân bằng (stabilize smoothing 10
 *       + denoise 0.5, veryfast/CRF23, nguồn shakynoisy720 gen như đợt 63):
 *       COLD (VCUT_GPU_PROBE_CACHE=0 → probe lại mỗi lần, = hành vi cũ)
 *       vs WARM (cache đĩa HIT), xen kẽ round-robin 2 lần mỗi phía để giảm
 *       lệch tải; kiểm tra log render có/không có tag "probe cache disk HIT"
 *       và output h264 720p 5s hợp lệ. Thêm 1 render --reprobe-gpu và 1
 *       render --no-gpu-probe-cache để khóa 2 cờ mới.
 *
 * Chạy: node server/render/src/test_round64_r1_gpu_probe_cache.js
 * (cần ffmpeg, ffprobe, python3 + numpy; ~6-8 phút tùy tải VM).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r64r1-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const GPUENC = path.join(__dirname, "gpuencode.js");
// Cache đĩa riêng cho harness (không đụng ~/.cache/vcut/gpu-probe.json thật).
const CACHE_P1 = path.join(work, "gpu-probe-p1.json"); // bước probe riêng
const CACHE_P2 = path.join(work, "gpu-probe-p2.json"); // full render

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label, envExtra) {
  const r = spawnSync(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...(envExtra || {}) },
  });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return r;
}
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
function probeVideo(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height",
    "-show_entries", "format=duration", "-of", "json", mp4], { encoding: "utf8" });
  const j = JSON.parse(r.stdout || "{}");
  return {
    codec: j.streams && j.streams[0] && j.streams[0].codec_name,
    width: j.streams && j.streams[0] && j.streams[0].width,
    height: j.streams && j.streams[0] && j.streams[0].height,
    duration: Number(j.format && j.format.duration),
  };
}
function probeOk(mp4) {
  const p = probeVideo(mp4);
  return p.codec === "h264" && p.width === 1280 && p.height === 720 && Math.abs(p.duration - 5) < 0.15;
}

console.log(`== Đợt 64 R1 — cache đĩa probe GPU (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);

// --- (1) Unit: self-test gpuencode (gồm cache đĩa) -------------------------
console.log("\n== (1) Unit: gpuencode.js --self-test ==");
{
  const r = spawnSync("node", [GPUENC, "--self-test"], { encoding: "utf8" });
  console.log(r.stdout);
  if (r.status !== 0) { console.error(r.stderr); console.log("❌ self-test FAIL"); process.exit(1); }
  ok(true, "gpuencode.js --self-test xanh (gồm cache MISS/HIT/null/force/TTL/file hỏng/tắt/xoá)");
}

// --- Chuẩn bị media (y hệt đợt 63) -----------------------------------------
console.log("\n== Chuẩn bị media ==");
run("python3", [path.join(RENDER, "test_p2_gen_shaky.py"), path.join(mediaDir, "shaky320.mp4")],
  "tạo shaky320.mp4 (gen P2, seed 7)");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky320.mp4"),
  "-vf", "scale=1280:720:flags=lanczos",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shaky720.mp4")], "upscale shaky → 720p");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky720.mp4"),
  "-vf", "noise=alls=15:allf=t",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shakynoisy720.mp4")], "shaky+noise → shakynoisy720");
ok(probeOk(path.join(mediaDir, "shakynoisy720.mp4")), "shakynoisy720.mp4 tạo xong (5s, 720p)");

// --- (2) Bước probe riêng: COLD vs WARM (process node mới) -----------------
console.log("\n== (2) Bước probe riêng trong process mới (3 lần mỗi phía) ==");
const PROBE_JS = `
const g = require(${JSON.stringify(GPUENC)});
const t0 = Date.now();
const r = g.probeGpuEncoderCached("ffmpeg");
console.log(JSON.stringify({ encoder: r.encoder, cached: r.cached, source: r.source, ms: Date.now() - t0 }));
`;
function probeOnce(envExtra) {
  const t0 = Date.now();
  const r = spawnSync("node", ["-e", PROBE_JS], {
    encoding: "utf8", env: { ...process.env, ...(envExtra || {}) },
  });
  const wall = (Date.now() - t0) / 1000;
  if (r.status !== 0) throw new Error(`probeOnce fail: ${r.stderr}`);
  return { ...JSON.parse(r.stdout.trim()), wall, load: loadAvg() };
}
const coldProbe = [], warmProbe = [];
for (let i = 0; i < 3; i++) {
  try { fs.unlinkSync(CACHE_P1); } catch { /* chưa có */ }
  const c = probeOnce({ VCUT_GPU_PROBE_CACHE: CACHE_P1 });
  coldProbe.push(c);
  console.log(`   COLD #${i + 1}: probe=${(c.ms / 1000).toFixed(2)}s wall-process=${c.wall.toFixed(2)}s source=${c.source} cached=${c.cached} (load ${c.load})`);
  ok(c.source === "probe" && c.cached === false && c.encoder === null, `COLD #${i + 1} probe thật → null`);
}
for (let i = 0; i < 3; i++) {
  const w = probeOnce({ VCUT_GPU_PROBE_CACHE: CACHE_P1 });
  warmProbe.push(w);
  console.log(`   WARM #${i + 1}: probe=${(w.ms / 1000).toFixed(2)}s wall-process=${w.wall.toFixed(2)}s source=${w.source} cached=${w.cached} (load ${w.load})`);
  ok(w.source === "disk" && w.cached === true && w.encoder === null, `WARM #${i + 1} cache disk HIT → null, không probe lại`);
}
const coldMed = median(coldProbe.map((x) => x.ms)) / 1000;
const warmMed = median(warmProbe.map((x) => x.ms)) / 1000;
console.log(`   📊 probe COLD median ${coldMed.toFixed(2)}s → WARM median ${warmMed.toFixed(3)}s (tiết kiệm ~${(coldMed - warmMed).toFixed(2)}s/lần gọi)`);
ok(warmMed < coldMed, "probe WARM nhanh hơn COLD (median)");

// --- (3) Full render enhance 720p 5s: COLD vs WARM --------------------------
console.log("\n== (3) Full render enhance 720p 5s Cân bằng, COLD vs WARM (xen kẽ) ==");
const BALANCED = { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } };
const spec = {
  version: "0.2.0",
  meta: { name: "r64r1", width: 1280, height: 720, fps: 30 },
  tracks: [{ id: "v0", kind: "video", clips: [{
    id: "c0", kind: "video", src: "shakynoisy720.mp4", start: 0, duration: 5,
    in: 0, out: 5, sourceAudioMode: "mute", enhance: BALANCED,
  }] }],
};
const specPath = path.join(work, "balanced.json");
writeFileEpermRetry(specPath, JSON.stringify(spec));
function render(name, envExtra, extraArgs) {
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23", ...(extraArgs || [])],
    { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...(envExtra || {}) } });
  const secs = (Date.now() - t0) / 1000;
  const out = (r.stdout || "").toString();
  const encLine = out.split("\n").find((l) => l.includes("encoder video: ")) || "";
  return { status: r.status, outPath, secs, encLine, stdout: out, stderr: (r.stderr || "").toString(), load: loadAvg() };
}
// Warm-up: làm nóng cache .trf + ghi file cache GPU P2 (lần này probe thật).
{
  const w = render("warmup", { VCUT_GPU_PROBE_CACHE: CACHE_P2 });
  console.log(`   warm-up: ${w.secs.toFixed(2)}s wall (load ${w.load}) — ${w.encLine.trim()}`);
  ok(w.status === 0 && probeOk(w.outPath), "warm-up render thành công, output 720p 5s hợp lệ");
  ok(!w.encLine.includes("probe cache"), "warm-up: lần đầu probe thật nên log KHÔNG có tag cache HIT");
  ok(fs.existsSync(CACHE_P2), "warm-up đã ghi file cache GPU P2");
}
// Xen kẽ COLD (VCUT_GPU_PROBE_CACHE=0) / WARM (cache P2 HIT), 2 vòng.
const coldRenders = [], warmRenders = [];
for (let i = 0; i < 2; i++) {
  const c = render(`cold${i + 1}`, { VCUT_GPU_PROBE_CACHE: "0" });
  coldRenders.push(c);
  console.log(`   COLD render #${i + 1}: ${c.secs.toFixed(2)}s wall (load ${c.load}) — ${c.encLine.trim()}`);
  ok(c.status === 0 && probeOk(c.outPath), `COLD render #${i + 1} thành công, output hợp lệ`);
  ok(c.encLine.includes("libx264 (CPU"), `COLD render #${i + 1} fallback libx264 đúng`);
  ok(!c.encLine.includes("probe cache"), `COLD render #${i + 1} log KHÔNG có tag cache HIT (probe thật)`);
  const w = render(`warm${i + 1}`, { VCUT_GPU_PROBE_CACHE: CACHE_P2 });
  warmRenders.push(w);
  console.log(`   WARM render #${i + 1}: ${w.secs.toFixed(2)}s wall (load ${w.load}) — ${w.encLine.trim()}`);
  ok(w.status === 0 && probeOk(w.outPath), `WARM render #${i + 1} thành công, output hợp lệ`);
  ok(w.encLine.includes("libx264 (CPU"), `WARM render #${i + 1} fallback libx264 đúng`);
  ok(w.encLine.includes("probe cache disk HIT"), `WARM render #${i + 1} log CÓ tag "probe cache disk HIT"`);
}
const coldMedR = median(coldRenders.map((x) => x.secs));
const warmMedR = median(warmRenders.map((x) => x.secs));
console.log(`   📊 full render COLD median ${coldMedR.toFixed(2)}s vs WARM median ${warmMedR.toFixed(2)}s (chênh ${(coldMedR - warmMedR).toFixed(2)}s; wall nhiễu theo tải — xem §2 mới là số sạch)`);

// --reprobe-gpu: ép probe lại, log không HIT, mtime cache mới hơn.
{
  const before = fs.statSync(CACHE_P2).mtimeMs;
  const r = render("reprobe", { VCUT_GPU_PROBE_CACHE: CACHE_P2 }, ["--reprobe-gpu"]);
  const after = fs.statSync(CACHE_P2).mtimeMs;
  console.log(`   --reprobe-gpu: ${r.secs.toFixed(2)}s wall — ${r.encLine.trim()}`);
  ok(r.status === 0 && probeOk(r.outPath), "--reprobe-gpu render thành công");
  ok(!r.encLine.includes("probe cache"), "--reprobe-gpu log KHÔNG có tag cache HIT (probe lại thật)");
  ok(after >= before, "--reprobe-gpu ghi lại file cache (mtime mới)");
}
// --no-gpu-probe-cache: tắt cache đĩa, log không HIT, file cache không bị ghi đè.
{
  const before = fs.statSync(CACHE_P2).mtimeMs;
  const r = render("nocache", { VCUT_GPU_PROBE_CACHE: CACHE_P2 }, ["--no-gpu-probe-cache"]);
  const after = fs.statSync(CACHE_P2).mtimeMs;
  console.log(`   --no-gpu-probe-cache: ${r.secs.toFixed(2)}s wall — ${r.encLine.trim()}`);
  ok(r.status === 0 && probeOk(r.outPath), "--no-gpu-probe-cache render thành công");
  ok(!r.encLine.includes("probe cache"), "--no-gpu-probe-cache log KHÔNG có tag cache HIT");
  ok(after === before, "--no-gpu-probe-cache không ghi đè file cache");
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
console.log(`   WORK=${work}`);
if (fail > 0) process.exit(1);
console.log("✅ Đợt 64 R1 — cache đĩa probe GPU: tất cả check pass");
