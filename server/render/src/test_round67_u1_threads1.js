#!/usr/bin/env node
/**
 * test_round67_u1_threads1.js — Phase 9 đợt 67, luồng U1: ép `ffmpeg
 * -threads 1` vào đường render stabilize để khử spread vidstabtransform
 * (nợ đợt 66 §8 mục 1; T1 chứng minh E4 là cách khử duy nhất: 0/150 frame
 * khác, byte-identical ×3, MAD 2,3867).
 *
 * Kiểm chứng (xem docs/PHASE9_ROUND67_U1_THREADS1_LIMITS.md):
 *  A. Unit — buildStabilizeDetectArgs: argv detect có/không "-threads 1"
 *     đúng vị trí (trước "-i"); STAB_DETECT_SINGLE_THREAD mặc định false.
 *  B. Dry-run render.js — spec stabilize: "-threads 1" đứng ngay trước "-i"
 *     của đúng input clip stabilize; spec 2 clip (1 stabilize + 1 thường):
 *     chỉ input stabilize nhận "-threads 1"; --no-stab-single-thread và
 *     env VCUT_STAB_SINGLE_THREAD=0 đều tắt; spec không stabilize: không có.
 *  C. Render thật 1080p 5s stabilize ×3 (mặc định cờ BẬT, cache .trf riêng):
 *     cả 3 ra MP4 hợp lệ + HIT cache .trf; sha256 CHỈ GHI NHẬN, KHÔNG assert
 *     giống hệt — đã chứng minh ở 1080p threads1 CHỈ cải thiện (framemd5
 *     8–17% frame khác vs mặc định 98%) chứ không khử hết spread; assert
 *     giống hệt ở 1080p là SAI (xem LIMITS §5.1).
 *  C2. Render thật 720p 5s stabilize ×3 (cờ BẬT, cache .trf riêng): sha256
 *     GIỐNG HỆT nhau (assert) — T1 E4 holds ở 720p: 0/150 frame khác,
 *     byte-identical ×3. Đây là regression test xác định của code đã ship.
 *  D. Render thật ×1 với --no-stab-single-thread: vẫn chạy OK (chỉ ghi sha,
 *     không assert giống/khác — đường đa luồng vốn không xác định).
 *  E. Render thật ×1 với --no-trf-cache (detect tươi mỗi lần): chạy OK, ghi
 *     sha để đối chiếu (không assert — .trf detect mới có thể khác byte
 *     giữa các lần chạy, xem S1; transform chỉ cam kết xác định khi cùng .trf).
 *
 * Cách chạy: node server/render/src/test_round67_u1_threads1.js
 * (cần ffmpeg/ffprobe; ~7 phút: 8 lần render 5s — 3×1080p + 3×720p + off + fresh).
 * Scratch mới dưới ~/workspace/.scratch-r67u1-*. KHÔNG ghi gì vào repo
 * ngoài file harness này.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..", "..");
const RENDER = path.join(ROOT, "server", "render");
const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const SRC720 = "/home/hatch/workspace/.scratch-r65s1-0e63Ph/media/shakynoisy720.mp4";
const { buildStabilizeDetectArgs, STAB_DETECT_SINGLE_THREAD } = require("./enhance");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r67u1-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const cacheDir = path.join(work, "trf-cache");
fs.mkdirSync(cacheDir, { recursive: true });

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`  ✅ ${msg}`); }
  else { fail++; console.log(`  ❌ FAIL: ${msg}`); }
}
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r67u1", width: W, height: H, fps: fps || 30 },
  tracks,
});
function runRender(spec, name, extraArgs, extraEnv) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "-y", "--encoder", "libx264",
    "--x264-preset", "veryfast", "--crf", "23", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, VCUT_TRF_CACHE_DIR: cacheDir, ...(extraEnv || {}) } });
  const secs = (Date.now() - t0) / 1000;
  // Lưu full log từng render để đối chiếu khi cần (vd r1 khác r2/r3 thì xem
  // lại dòng "stabilize ... HIT/MISS" + dòng "🧵 stabilize single-thread decode").
  writeFileEpermRetry(path.join(work, `${name}.stdout.log`), (r.stdout || "").toString());
  writeFileEpermRetry(path.join(work, `${name}.stderr.log`), (r.stderr || "").toString());
  return { status: r.status, stdout: (r.stdout || "").toString(),
    stderr: (r.stderr || "").toString(), outPath, secs };
}
function probeVideo(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height,r_frame_rate",
    "-show_entries", "format=duration", "-of", "json", mp4], { encoding: "utf8" });
  const j = JSON.parse(r.stdout || "{}");
  const fr = j.streams && j.streams[0] && j.streams[0].r_frame_rate;
  const fps = fr ? (Number(fr.split("/")[0]) / Number(fr.split("/")[1] || 1)) : NaN;
  return { codec: j.streams && j.streams[0] && j.streams[0].codec_name,
    width: j.streams && j.streams[0] && j.streams[0].width,
    height: j.streams && j.streams[0] && j.streams[0].height, fps,
    duration: Number(j.format && j.format.duration) };
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function probeOk(mp4, W, H, fps, dur) {
  const p = probeVideo(mp4);
  return p.codec === "h264" && p.width === W && p.height === H &&
    Math.abs(p.duration - dur) < 0.15 && Math.abs(p.fps - fps) < 0.5;
}
// Dry-run: chỉ in câu lệnh ffmpeg, không render. Trả stdout (dòng lệnh).
function dryRun(spec, name, extraArgs, extraEnv) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", path.join(work, `${name}.mp4`), "--media-dir", mediaDir,
    "--encoder", "libx264", "--dry-run", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, VCUT_TRF_CACHE_DIR: cacheDir, ...(extraEnv || {}) } });
  return { status: r.status, stdout: (r.stdout || "").toString(),
    stderr: (r.stderr || "").toString() };
}
// Đếm "-threads 1" đứng ngay trước "-i <file>" trong dòng lệnh dry-run.
function threadsBeforeInputs(cmdLine) {
  const toks = cmdLine.trim().split(/\s+/);
  const hits = [];
  for (let i = 0; i + 3 < toks.length; i++) {
    if (toks[i] === "-threads" && toks[i + 1] === "1" && toks[i + 2] === "-i")
      hits.push(toks[i + 3]);
  }
  return hits;
}

console.log(`== test_round67_u1_threads1 (WORK=${work}, loadavg: ${loadAvg()}) ==`);
ok(fs.existsSync(SRC1080), `input 1080p 5s có sẵn (${SRC1080})`);
ok(fs.existsSync(SRC720), `input 720p 5s có sẵn (${SRC720})`);
fs.copyFileSync(SRC1080, path.join(mediaDir, "shaky1080.mp4"));
fs.copyFileSync(SRC720, path.join(mediaDir, "shaky720.mp4"));
const ABS_MEDIA = path.resolve(mediaDir, "shaky1080.mp4");

// --- A. Unit: argv detect ----------------------------------------------------
console.log("\n== A. Unit buildStabilizeDetectArgs ==");
const detClip = { in: 0, duration: 5, speed: 1, enhance: { stabilize: { smoothing: 10 } } };
const detArgs = buildStabilizeDetectArgs("/tmp/in.mp4", detClip, "/tmp/x.trf");
ok(detArgs[0] === "-i" && !detArgs.includes("-threads"),
  "detect mặc định: không có -threads, bắt đầu bằng -i (giữ hành vi cũ)");
const detArgsT1 = buildStabilizeDetectArgs("/tmp/in.mp4", detClip, "/tmp/x.trf", { singleThread: true });
ok(detArgsT1[0] === "-threads" && detArgsT1[1] === "1" && detArgsT1[2] === "-i",
  "detect singleThread: '-threads 1' đứng TRƯỚC '-i'");
ok(STAB_DETECT_SINGLE_THREAD === false,
  "STAB_DETECT_SINGLE_THREAD mặc định false (detect không ép đơn luồng — xem LIMITS §2)");

// --- B. Dry-run: vị trí -threads 1 -------------------------------------------
console.log("\n== B. Dry-run vị trí -threads 1 ==");
const STAB = { stabilize: { smoothing: 10 } };
const specStab = specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shaky1080.mp4", 5, { enhance: STAB })] }], 1920, 1080);
const d1 = dryRun(specStab, "dry-stab");
ok(d1.status === 0, `dry-run spec stabilize chạy được (status ${d1.status})`);
const cmdStab = (d1.stdout.split("\n").find((l) => l.includes("ffmpeg")) || "");
const hitsStab = threadsBeforeInputs(cmdStab);
ok(hitsStab.length === 1 && hitsStab[0] === ABS_MEDIA,
  `spec stabilize: đúng 1 "-threads 1" ngay trước "-i" của input stabilize (${hitsStab.join(",") || "không có"})`);
ok(cmdStab.includes("vidstabtransform=input="), "dry-run có vidstabtransform trong graph");

const d2 = dryRun(specStab, "dry-stab-off", ["--no-stab-single-thread"]);
const cmdOff = (d2.stdout.split("\n").find((l) => l.includes("ffmpeg")) || "");
ok(d2.status === 0 && threadsBeforeInputs(cmdOff).length === 0 && !cmdOff.includes("-threads"),
  "--no-stab-single-thread: dry-run không còn -threads nào");

const d3 = dryRun(specStab, "dry-stab-env0", [], { VCUT_STAB_SINGLE_THREAD: "0" });
const cmdEnv0 = (d3.stdout.split("\n").find((l) => l.includes("ffmpeg")) || "");
ok(d3.status === 0 && threadsBeforeInputs(cmdEnv0).length === 0,
  "env VCUT_STAB_SINGLE_THREAD=0: dry-run không còn -threads nào");

const specPlain = specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shaky1080.mp4", 5)] }], 1920, 1080);
const d4 = dryRun(specPlain, "dry-plain");
const cmdPlain = (d4.stdout.split("\n").find((l) => l.includes("ffmpeg")) || "");
ok(d4.status === 0 && threadsBeforeInputs(cmdPlain).length === 0,
  "spec không stabilize: dry-run không có -threads 1 (không đụng clip thường)");

// 2 clip: 1 stabilize + 1 thường (cùng file nguồn) — chỉ 1 input, vẫn -threads 1
// (đăng ký -i 1 lần; file dùng chung thì input đó decode đơn luồng — vô hại).
// LƯU Ý: 2 clip trên cùng track phải NỐI TIẾP (start 0 rồi start 5), không
// được overlap start=0 (spec overlap bị validate từ chối → dry-run lỗi,
// đó là lỗi spec của harness cũ, không phải lỗi render).
const specMixed = specWith([{ id: "v0", kind: "video",
  clips: [{ ...vclip("c0", "shaky1080.mp4", 5, { enhance: STAB }), start: 0 },
    { ...vclip("c1", "shaky1080.mp4", 5), start: 5 }] }], 1920, 1080);
const d5 = dryRun(specMixed, "dry-mixed");
const cmdMixed = (d5.stdout.split("\n").find((l) => l.includes("ffmpeg")) || "");
ok(d5.status === 0 && threadsBeforeInputs(cmdMixed).length === 1,
  "spec 2 clip (1 stabilize + 1 thường, chung file): đúng 1 '-threads 1' trước input dùng chung");

// --- C. Render thật ×3: xác định end-to-end ----------------------------------
console.log("\n== C. Render thật stabilize 1080p 5s ×3 (cờ BẬT) ==");
const hashes = [];
for (let i = 1; i <= 3; i++) {
  const rr = runRender(specStab, `stab-r${i}`);
  ok(rr.status === 0 && outOk(rr.outPath) && probeOk(rr.outPath, 1920, 1080, 30, 5),
    `stabilize render #${i}: OK (${rr.secs.toFixed(1)}s, ${fs.statSync(rr.outPath).size} byte)`);
  // Dòng 🧵 chứng minh -threads 1 CÓ trong ffArgs của render này (không chỉ dry-run).
  ok(rr.stdout.includes("stabilize single-thread decode: -threads 1"),
    `render #${i}: log có dòng single-thread decode (ffArgs thật có -threads 1)`);
  if (i >= 2) ok((rr.stdout + rr.stderr).includes("cache .trf HIT"),
    `render #${i}: HIT cache .trf (cùng .trf byte cho transform; log() ghi ra stdout, không phải stderr)`);
  hashes.push(sha256(rr.outPath));
  console.log(`   📊 stab-r${i}: sha256 ${hashes[i - 1].slice(0, 16)}… (${rr.secs.toFixed(1)}s)`);
}
console.log(`   📊 1080p ×3 (GHI NHẬN, không assert): sha ${hashes.map((h) => h.slice(0, 8)).join(" / ")} — ở 1080p threads1 chỉ cải thiện, không khử hết (xem LIMITS §5.1)`);

// --- C2. Render thật ×3 ở 720p: xác định end-to-end (T1 E4 holds) ----------
console.log("\n== C2. Render thật stabilize 720p 5s ×3 (cờ BẬT) ==");
const specStab720 = specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shaky720.mp4", 5, { enhance: STAB })] }], 1280, 720);
const hashes720 = [];
for (let i = 1; i <= 3; i++) {
  const rr = runRender(specStab720, `stab720-r${i}`);
  ok(rr.status === 0 && outOk(rr.outPath) && probeOk(rr.outPath, 1280, 720, 30, 5),
    `stabilize 720p render #${i}: OK (${rr.secs.toFixed(1)}s, ${fs.statSync(rr.outPath).size} byte)`);
  ok(rr.stdout.includes("stabilize single-thread decode: -threads 1"),
    `720p render #${i}: log có dòng single-thread decode`);
  hashes720.push(sha256(rr.outPath));
  console.log(`   📊 stab720-r${i}: sha256 ${hashes720[i - 1].slice(0, 16)}… (${rr.secs.toFixed(1)}s)`);
}
ok(hashes720[0] === hashes720[1] && hashes720[1] === hashes720[2],
  `xác định end-to-end 720p: sha256 MP4 ×3 GIỐNG HỆT (${hashes720[0].slice(0, 16)}…) — T1 E4 holds`);

// --- D. Render thật ×1 với cờ TẮT ---------------------------------------------
console.log("\n== D. Render thật ×1 --no-stab-single-thread ==");
const roff = runRender(specStab, "stab-off", ["--no-stab-single-thread"]);
ok(roff.status === 0 && outOk(roff.outPath) && probeOk(roff.outPath, 1920, 1080, 30, 5),
  `render cờ TẮT vẫn OK (${roff.secs.toFixed(1)}s)`);
const hashOff = sha256(roff.outPath);
console.log(`   📊 stab-off: sha256 ${hashOff.slice(0, 16)}… (đường đa luồng vốn không xác định — chỉ ghi nhận, không assert)`);

// --- E. Render thật ×1 detect tươi (--no-trf-cache) ----------------------------
console.log("\n== E. Render thật ×1 --no-trf-cache (detect tươi) ==");
const rfresh = runRender(specStab, "stab-fresh", ["--no-trf-cache"]);
ok(rfresh.status === 0 && outOk(rfresh.outPath) && probeOk(rfresh.outPath, 1920, 1080, 30, 5),
  `render detect tươi vẫn OK (${rfresh.secs.toFixed(1)}s)`);
const hashFresh = sha256(rfresh.outPath);
console.log(`   📊 stab-fresh: sha256 ${hashFresh.slice(0, 16)}… — ${hashFresh === hashes[0] ? "KHỚP bản cache (detect tươi cho cùng .trf nội dung)" : "KHÁC bản cache (detect tươi cho .trf khác byte — xem LIMITS §2, không assert)"}`);

console.log(`\n== test_round67_u1_threads1: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify({ pass, fail, work,
  stabHashes: hashes.map((h) => h.slice(0, 16)),
  deterministic1080X3: hashes[0] === hashes[1] && hashes[1] === hashes[2],
  stab720Hashes: hashes720.map((h) => h.slice(0, 16)),
  deterministic720X3: hashes720[0] === hashes720[1] && hashes720[1] === hashes720[2],
  hashOff: hashOff.slice(0, 16), hashFresh: hashFresh.slice(0, 16),
  freshMatchesCached: hashFresh === hashes[0] }, null, 1));
if (fail > 0) process.exit(1);
