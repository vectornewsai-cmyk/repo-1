#!/usr/bin/env node
/**
 * test_round62_r2_trf_cache.js — Phase 9 đợt 62, luồng R2: đóng 3 nợ đợt 61 §5.2.
 *
 * (a) CACHE .trf vidstabdetect theo (src, trim, tham số stabilize):
 *     - key đổi khi: trim (in/duration/speed), shakiness/accuracy/stepsize/
 *       mincontrast, ffmpeg version, nguồn ghi đè (mtime) — kiểm bằng
 *       self-test của trfCache.js (chạy lại ở đây) + resolve thật.
 *     - key KHÔNG đổi khi chỉ đổi smoothing (tham số transform) → HIT.
 *     - Đo tiết kiệm thật: resolveStabilizeTrf COLD (detect mới) vs WARM
 *       (copy từ cache), median 3 lần mỗi bên; + render.js end-to-end
 *       COLD vs WARM (log phải ghi "cache .trf HIT", MP4 hợp lệ).
 *     - Prune: giới hạn entry/bytes + grace 60s (self-test).
 * (b) TÁCH CHI PHÍ DENOISE 0.5 trong phần còn lại 24,1% của full render
 *     720p đợt 61 (7,10s = denoise + khởi động node + graph): probe
 *     to-null decode-only vs decode+hqdn3d(0.5) — đúng chuỗi post-chain
 *     của buildEnhancePostChain — median 3 lần, xen kẽ round-robin
 *     (quy tắc mới của R2 đợt 61); + full render Cân bằng trong cùng
 *     phiên để tính lại phần còn lại.
 * (c) Không đo ở harness này (UI — xem speedCurveBlock62R2.test.ts +
 *     clicktest-62r2-speed-curve-stabblock.mjs).
 *
 * Cách chạy: node server/render/src/test_round62_r2_trf_cache.js
 * (cần ffmpeg, ffprobe, python3 test_p2_gen_shaky.py). Scratch mới dưới
 * ~/workspace/.scratch-r62r2-XXXX. KHÔNG ghi gì vào repo; cache test dùng
 * thư mục riêng (env VCUT_TRF_CACHE_DIR trỏ vào scratch) nên không đụng
 * cache thật ~/.cache/vcut/vidstab-cache. Thời gian ~8-12 phút tùy tải
 * (các luồng đợt 62 chạy song song làm tải VM dao động — chỉ median
 * trong cùng phiên mới có ý nghĩa, xem LIMITS đợt 62).
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r62r2-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const cacheDir = path.join(work, "trfcache");
fs.mkdirSync(cacheDir, { recursive: true });
process.env.VCUT_TRF_CACHE_DIR = cacheDir; // render.js con kế thừa env này
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const { buildEnhancePostChain } = require("./enhance");
const { computeTrfCacheKey, lookupTrfCache, resolveStabilizeTrf, ffmpegVersionLine, trfCacheDir } = require("./trfCache");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label, cwd, envExtra) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], cwd, env: envExtra ? { ...process.env, ...envExtra } : process.env });
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
const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r62r2", width: W, height: H, fps: fps || 30 },
  tracks,
});
function render(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  const secs = (Date.now() - t0) / 1000;
  return { status: r.status, stdout: (r.stdout || "").toString(), stderr: (r.stderr || "").toString(), outPath, secs, fps: 150 / secs };
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
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
function probeOk(mp4, W, H) {
  const p = probeVideo(mp4);
  return p.codec === "h264" && p.width === W && p.height === H && Math.abs(p.duration - 5) < 0.15;
}
function cacheEntries() {
  try { return fs.readdirSync(cacheDir).filter((f) => f.endsWith(".trf")); }
  catch { return []; }
}

console.log(`== Đợt 62 R2: cache .trf + tách denoise 0.5 (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work} (cache test: ${cacheDir})`);

// --- 0. Self-test các module đã sửa -----------------------------------------
console.log("\n== (0) Self-test trfCache.js + enhance.js ==");
{
  const r1 = spawnSync("node", [path.join(__dirname, "trfCache.js"), "--self-test"], { encoding: "utf8" });
  ok(r1.status === 0, `trfCache.js --self-test exit 0 (${(r1.stdout || "").trim()})`);
  if (r1.status !== 0) console.error((r1.stdout || "") + (r1.stderr || ""));
  const r2 = spawnSync("node", [path.join(__dirname, "enhance.js"), "--self-test"], { encoding: "utf8" });
  ok(r2.status === 0, `enhance.js --self-test exit 0 (${(r2.stdout || "").trim()})`);
  ok(trfCacheDir() === cacheDir, `trfCacheDir() tôn trọng env VCUT_TRF_CACHE_DIR (${cacheDir})`);
}

// --- Chuẩn bị media (tái tạo y hệt đợt 61: shaky320 → upscale 720p → noise) --
console.log("\n== Chuẩn bị media shakynoisy720 (tái tạo y hệt đợt 61) ==");
run("python3", [path.join(RENDER, "test_p2_gen_shaky.py"), path.join(mediaDir, "shaky320.mp4")],
  "tạo shaky320.mp4 (gen P2)");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky320.mp4"),
  "-vf", "scale=1280:720:flags=lanczos",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shaky720.mp4")], "upscale shaky → 720p");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky720.mp4"),
  "-vf", "noise=alls=15:allf=t",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shakynoisy720.mp4")], "shaky+noise → 720p");
{
  const p = probeVideo(path.join(mediaDir, "shakynoisy720.mp4"));
  ok(p.codec === "h264" && p.width === 1280 && p.height === 720 && Math.abs(p.duration - 5) < 0.15,
    "shakynoisy720.mp4 tạo xong (nguồn rung P2 320x180 tremor ±7px + noise alls=15, upscale 720p, 5s)");
}
const src720 = path.join(mediaDir, "shakynoisy720.mp4");
const BALANCED = { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } };
const clipBal = { id: "c0", in: 0, duration: 5, speed: 1, enhance: BALANCED };
const ffVer = ffmpegVersionLine("ffmpeg");
console.log(`   ffmpeg: ${ffVer}`);
ok(/^ffmpeg version /.test(ffVer), "ffmpegVersionLine() trả dòng version thật");

// === (a) Cache .trf: resolve COLD vs WARM ===================================
console.log("\n== (a) Cache .trf: resolve COLD vs WARM (median 3 lần mỗi bên) ==");
const summaryA = {};
{
  // Invalidation bằng resolve thật: đổi smoothing → HIT; đổi shakiness/trim → MISS.
  // Mỗi resolve dùng runTmpPath riêng (không chia sẻ file tạm giữa các lần).
  const tmpTrf = (n) => path.join(work, `resolve-${n}.trf`);
  ok(cacheEntries().length === 0, "cache test bắt đầu trống (0 entry)");
  const rCold1 = resolveStabilizeTrf("ffmpeg", src720, clipBal, { cacheDir, ffmpegVersion: ffVer, runTmpPath: tmpTrf("cold1") });
  ok(rCold1.ok && rCold1.cached === false, `resolve lần 1: MISS + detect mới OK (trf ${fs.statSync(rCold1.trfPath).size} byte)`);
  ok(cacheEntries().length === 1, "sau MISS đầu: cache có đúng 1 entry");
  const cachedPath = cacheEntries()[0];
  const cachedSize = fs.statSync(path.join(cacheDir, cachedPath)).size;
  console.log(`   📊 file .trf trong cache: ${cachedSize} byte (clip 5s 720p)`);
  const rWarm1 = resolveStabilizeTrf("ffmpeg", src720, clipBal, { cacheDir, ffmpegVersion: ffVer, runTmpPath: tmpTrf("warm1") });
  ok(rWarm1.ok && rWarm1.cached === true, "resolve lần 2 cùng clip: HIT (không detect lại)");
  ok(rWarm1.cacheKey === rCold1.cacheKey, "HIT dùng đúng key của lần MISS");
  // Đổi smoothing (tham số transform) → vẫn HIT.
  const clipSmooth20 = { ...clipBal, enhance: { stabilize: { smoothing: 20 }, denoise: { strength: 0.5 } } };
  const rSmooth = resolveStabilizeTrf("ffmpeg", src720, clipSmooth20, { cacheDir, ffmpegVersion: ffVer, runTmpPath: tmpTrf("smooth20") });
  ok(rSmooth.ok && rSmooth.cached === true, "đổi smoothing 10→20: vẫn HIT (smoothing không ảnh hưởng .trf)");
  // Đổi shakiness → MISS (key khác, detect lại, cache thêm 1 entry).
  const clipShaky8 = { ...clipBal, enhance: { stabilize: { smoothing: 10, shakiness: 8 }, denoise: { strength: 0.5 } } };
  const rShaky = resolveStabilizeTrf("ffmpeg", src720, clipShaky8, { cacheDir, ffmpegVersion: ffVer, runTmpPath: tmpTrf("shaky8") });
  ok(rShaky.ok && rShaky.cached === false, "đổi shakiness 5→8: MISS (detect lại)");
  ok(cacheEntries().length === 2, "sau MISS shakiness: cache có 2 entry");
  // Đổi trim → MISS.
  const clipTrim = { ...clipBal, in: 1, out: 6, duration: 5 };
  const rTrim = resolveStabilizeTrf("ffmpeg", src720, clipTrim, { cacheDir, ffmpegVersion: ffVer, runTmpPath: tmpTrf("trim1") });
  ok(rTrim.ok && rTrim.cached === false, "đổi trim in 0→1: MISS (detect lại)");
  ok(cacheEntries().length === 3, "sau MISS trim: cache có 3 entry");
  // Key đổi nhưng nội dung .trf resolve phải khác nhau giữa 2 tham số detect
  // (detect không xác định nên không so byte-identical — chỉ kiểm file hợp lệ).
  for (const r of [rCold1, rWarm1, rSmooth, rShaky, rTrim]) {
    ok(outOk(r.trfPath) && fs.statSync(r.trfPath).size > 100, `file .trf resolve hợp lệ (>100 byte): ${fs.statSync(r.trfPath).size} byte`);
    try { fs.unlinkSync(r.trfPath); } catch { /* dọn file tạm riêng của resolve */ }
  }
  // Timing COLD vs WARM, median 3 lần, xen kẽ (xoá entry trước mỗi lần COLD).
  const keyBal = computeTrfCacheKey(src720, clipBal, ffVer);
  const timedResolve = (label, fn) => {
    const t0 = Date.now();
    const out = fn();
    const secs = (Date.now() - t0) / 1000;
    console.log(`   📊 ${label}: ${secs.toFixed(2)}s wall (loadavg ${loadAvg()})`);
    return { secs, out };
  };
  const coldWalls = [], warmWalls = [];
  for (let round = 1; round <= 3; round++) {
    try { fs.unlinkSync(path.join(cacheDir, `${keyBal}.trf`)); } catch { /* đã mất */ }
    const c = timedResolve(`resolve COLD vòng ${round} (xoá entry trước)`, () =>
      resolveStabilizeTrf("ffmpeg", src720, clipBal, { cacheDir, ffmpegVersion: ffVer }));
    if (!c.out.ok || c.out.cached !== false) throw new Error(`vòng COLD ${round} phải MISS + detect OK`);
    coldWalls.push(c.secs);
    try { fs.unlinkSync(c.out.trfPath); } catch {}
    const w = timedResolve(`resolve WARM vòng ${round}`, () =>
      resolveStabilizeTrf("ffmpeg", src720, clipBal, { cacheDir, ffmpegVersion: ffVer }));
    if (!w.out.ok || w.out.cached !== true) throw new Error(`vòng WARM ${round} phải HIT`);
    warmWalls.push(w.secs);
    try { fs.unlinkSync(w.out.trfPath); } catch {}
  }
  const mCold = median(coldWalls), mWarm = median(warmWalls);
  const saved = mCold - mWarm;
  console.log(`   📊 COLD median ${mCold.toFixed(2)}s (các lần: ${coldWalls.map((x) => x.toFixed(2)).join(", ")}) | ` +
    `WARM median ${mWarm.toFixed(2)}s (các lần: ${warmWalls.map((x) => x.toFixed(2)).join(", ")}) | ` +
    `tiết kiệm ${saved.toFixed(2)}s/lần render lại (${(saved / mCold * 100).toFixed(1)}% pass detect)`);
  ok(mCold > 1, `COLD median > 1s (detect thật chạy: ${mCold.toFixed(2)}s)`);
  ok(mWarm < mCold / 10, `WARM nhanh hơn COLD ít nhất 10× (WARM ${mWarm.toFixed(2)}s vs COLD ${mCold.toFixed(2)}s)`);
  ok(saved > 0, `tiết kiệm dương: ${saved.toFixed(2)}s mỗi lần render lại`);
  summaryA.resolveColdMedian = +mCold.toFixed(2);
  summaryA.resolveWarmMedian = +mWarm.toFixed(2);
  summaryA.resolveSavedPerRerender = +saved.toFixed(2);
  summaryA.trfBytes = cachedSize;

  // --no-trf-cache: render vẫn OK, không ghi thêm entry vào cache.
  const beforeNoCache = cacheEntries().length;
  const specNoCache = specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "shakynoisy720.mp4", 5, { enhance: BALANCED })] }], 1280, 720);
  const rNoCache = render(specNoCache, "full-nocache", ["--no-trf-cache"]);
  ok(rNoCache.status === 0 && outOk(rNoCache.outPath) && probeOk(rNoCache.outPath, 1280, 720),
    `--no-trf-cache: render thật OK (${rNoCache.secs.toFixed(1)}s, ${rNoCache.fps.toFixed(2)} fps)`);
  ok(!/cache \.trf HIT/.test(rNoCache.stdout), "--no-trf-cache: log không có dòng HIT");
  ok(cacheEntries().length === beforeNoCache, `--no-trf-cache: không ghi thêm entry (${beforeNoCache} entry trước/sau)`);
}

// === (a2) Render.js end-to-end COLD vs WARM =================================
console.log("\n== (a2) Render.js end-to-end: COLD vs WARM (log HIT + MP4 hợp lệ) ==");
{
  const spec = specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "shakynoisy720.mp4", 5, { enhance: BALANCED })] }], 1280, 720);
  // Xoá entry balanced để lần 1 là COLD thật (các entry khác giữ nguyên).
  const keyBal = computeTrfCacheKey(src720, clipBal, ffVer);
  try { fs.unlinkSync(path.join(cacheDir, `${keyBal}.trf`)); } catch {}
  const rCold = render(spec, "full-cold");
  console.log(`   📊 render COLD: ${rCold.secs.toFixed(2)}s wall → ${rCold.fps.toFixed(2)} fps (loadavg ${loadAvg()})`);
  ok(rCold.status === 0 && outOk(rCold.outPath) && probeOk(rCold.outPath, 1280, 720),
    `render COLD: MP4 h264 720p 5s hợp lệ (${rCold.secs.toFixed(1)}s)`);
  ok(/cache \.trf MISS/.test(rCold.stdout), "render COLD: log ghi MISS (detect mới)");
  const rWarm = render(spec, "full-warm");
  console.log(`   📊 render WARM: ${rWarm.secs.toFixed(2)}s wall → ${rWarm.fps.toFixed(2)} fps (loadavg ${loadAvg()})`);
  ok(rWarm.status === 0 && outOk(rWarm.outPath) && probeOk(rWarm.outPath, 1280, 720),
    `render WARM: MP4 h264 720p 5s hợp lệ (${rWarm.secs.toFixed(1)}s)`);
  ok(/cache \.trf HIT/.test(rWarm.stdout), "render WARM: log ghi HIT (không detect lại)");
  // WARM phải nhanh hơn COLD (ít nhất 3s — detect 720p đợt 61 là 9,56s wall;
  // ngưỡng thấp để chịu được tải VM dao động).
  const savedRender = rCold.secs - rWarm.secs;
  console.log(`   📊 render COLD ${rCold.secs.toFixed(2)}s vs WARM ${rWarm.secs.toFixed(2)}s → tiết kiệm ${savedRender.toFixed(2)}s ` +
    `(${(savedRender / rCold.secs * 100).toFixed(1)}% wall render)`);
  ok(savedRender > 3, `render WARM nhanh hơn COLD > 3s (tiết kiệm ${savedRender.toFixed(2)}s)`);
  // MP4 WARM phải xem được: probe duration/res đã kiểm ở trên; so kích thước
  // (transform từ cùng .trf → nội dung gần như giống hệt, chỉ khác metadata).
  const sizeCold = fs.statSync(rCold.outPath).size, sizeWarm = fs.statSync(rWarm.outPath).size;
  console.log(`   📊 MP4 COLD ${sizeCold} byte vs WARM ${sizeWarm} byte (chênh ${Math.abs(sizeCold - sizeWarm)} byte = ${(Math.abs(sizeCold - sizeWarm) / sizeCold * 100).toFixed(2)}%)`);
  ok(Math.abs(sizeCold - sizeWarm) / sizeCold < 0.05, "MP4 COLD vs WARM: kích thước chênh < 5% (cùng .trf → cùng nội dung)");
  summaryA.renderColdWall = +rCold.secs.toFixed(2);
  summaryA.renderWarmWall = +rWarm.secs.toFixed(2);
  summaryA.renderSaved = +savedRender.toFixed(2);
  summaryA.mp4ColdBytes = sizeCold;
  summaryA.mp4WarmBytes = sizeWarm;
}

// === (b) Tách chi phí denoise 0.5 ============================================
console.log("\n== (b) Tách denoise 0.5 bằng probe to-null (median 3 lần, round-robin) ==");
const summaryB = {};
{
  const postChain = buildEnhancePostChain({ denoise: { strength: 0.5 } });
  console.log(`   post-chain denoise 0.5 (đúng buildEnhancePostChain): ${postChain}`);
  ok(postChain === ",hqdn3d=12:9:12:9", `post-chain 0.5 đúng thang Q8 (hqdn3d=12:9:12:9), nhận: ${postChain}`);
  const probes = { decode: [], denoise: [] };
  const timedProbe = (label, fn) => {
    const t0 = Date.now();
    fn();
    const secs = (Date.now() - t0) / 1000;
    console.log(`   📊 ${label}: ${secs.toFixed(2)}s wall → ${(150 / secs).toFixed(2)} fps (loadavg ${loadAvg()})`);
    return secs;
  };
  for (let round = 1; round <= 3; round++) {
    probes.decode.push(timedProbe(`decode-only vòng ${round}`, () =>
      run("ffmpeg", ["-i", src720, "-vf", "trim=start=0:end=5,setpts=PTS-STARTPTS",
        "-an", "-f", "null", "-"], `decode v${round}`)));
    probes.denoise.push(timedProbe(`decode+hqdn3d(0.5) vòng ${round}`, () =>
      run("ffmpeg", ["-i", src720, "-vf", `trim=start=0:end=5,setpts=PTS-STARTPTS${postChain}`,
        "-an", "-f", "null", "-"], `denoise v${round}`)));
  }
  const mDec = median(probes.decode), mDen = median(probes.denoise);
  const denPure = mDen - mDec;
  console.log(`   📊 decode median ${mDec.toFixed(2)}s (${probes.decode.map((x) => x.toFixed(2)).join(", ")}) | ` +
    `decode+hqdn3d(0.5) median ${mDen.toFixed(2)}s (${probes.denoise.map((x) => x.toFixed(2)).join(", ")}) | ` +
    `denoise 0.5 thuần ${denPure.toFixed(2)}s (${(150 / denPure).toFixed(2)} fps riêng)`);
  ok(denPure > 0, `denoise 0.5 thuần > 0 (median trừ median không âm: ${denPure.toFixed(2)}s)`);
  summaryB.decodeMedian = +mDec.toFixed(2);
  summaryB.denoiseProbeMedian = +mDen.toFixed(2);
  summaryB.denoisePureMedian = +denPure.toFixed(2);
  // Full render Cân bằng trong cùng phiên (cache WARM — đã có entry) để tính
  // lại phần còn lại: full − (detect wall + decode + transform thuần +
  // encode thuần + denoise thuần). Dùng số đợt 61 (a2) cho transform/encode
  // thuần vì không đo lại ở đây (ghi rõ trong LIMITS).
  const spec = specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "shakynoisy720.mp4", 5, { enhance: BALANCED })] }], 1280, 720);
  const rf = render(spec, "full-balanced-b");
  console.log(`   📊 full render Cân bằng (WARM cache): ${rf.secs.toFixed(2)}s wall → ${rf.fps.toFixed(2)} fps (loadavg ${loadAvg()})`);
  ok(rf.status === 0 && outOk(rf.outPath) && probeOk(rf.outPath, 1280, 720), "full Cân bằng: render thật OK");
  summaryB.fullWallWarm = +rf.secs.toFixed(2);
  // Phần còn lại sau khi trừ denoise thuần khỏi 7,10s của đợt 61 (chỉ đối
  // chiếu, không trừ chéo phiên khác tải — ghi rõ trong LIMITS).
  console.log(`   📊 đối chiếu đợt 61: phần còn lại 7,10s (24,1% full 29,44s) − denoise thuần ${denPure.toFixed(2)}s = ${(7.10 - denPure).toFixed(2)}s còn lại cho khởi động node + graph (chỉ mang tính đối chiếu vì khác phiên đo)`);
  summaryB.remainderAfterDenoiseVsR61 = +(7.10 - denPure).toFixed(2);
}

console.log(`\n== test_round62_r2_trf_cache: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify({ a: summaryA, b: summaryB }, null, 1));
if (fail > 0) process.exit(1);
