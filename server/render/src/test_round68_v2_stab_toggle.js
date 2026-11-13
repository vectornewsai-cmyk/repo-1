#!/usr/bin/env node
/**
 * test_round68_v2_stab_toggle.js — Phase 9 đợt 68, luồng V2: UI toggle
 * bật/tắt stabilize single-thread decode (đóng nợ đợt 67 U1 §7 mục 1).
 *
 * U1 đã ép `-threads 1` vào render.js (chỉ bước transform stabilize,
 * mặc định BẬT) + CLI `--no-stab-single-thread` + env
 * `VCUT_STAB_SINGLE_THREAD=0`. V2 nối toggle UI qua bridge preset
 * whitelist (`stabSingleThread`) → spawnJob chỉ push
 * `--no-stab-single-thread` khi preset là false. Harness này kiểm chứng
 * phía render.js (đường mà bridge gọi tới):
 *
 *  B. Dry-run — spec stabilize: mặc định đúng 1 "-threads 1" ngay trước
 *     "-i" của đúng input clip stabilize (hồi quy hành vi U1 mặc định BẬT);
 *     --no-stab-single-thread và env VCUT_STAB_SINGLE_THREAD=0 đều tắt
 *     hẳn (0 lần -threads); spec không stabilize: không có -threads 1.
 *  C. Render thật 720p 5s stabilize ×1 với --no-stab-single-thread:
 *     vẫn chạy OK ra MP4 hợp lệ (chỉ ghi sha, không assert giống/khác —
 *     đường đa luồng vốn không xác định, xem T1/U1); log phải KHÔNG có
 *     dòng "🧵 stabilize single-thread decode" (chứng minh cờ tắt tới
 *     được render thật, không chỉ dry-run).
 *  D. Render thật 720p 5s stabilize ×1 mặc định (cờ BẬT): MP4 hợp lệ +
 *     log CÓ dòng "🧵 stabilize single-thread decode" (đối chứng C).
 *
 * Cách chạy: node server/render/src/test_round68_v2_stab_toggle.js
 * (cần ffmpeg/ffprobe; ~1–2 phút: 2 lần render 720p 5s).
 * Scratch mới dưới ~/workspace/.scratch-r68v2-*. KHÔNG ghi gì vào repo
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
const SRC720 = "/home/hatch/workspace/.scratch-r65s1-0e63Ph/media/shakynoisy720.mp4";

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r68v2-"));
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
  meta: { name: "r68v2", width: W, height: H, fps: fps || 30 },
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

console.log(`== test_round68_v2_stab_toggle (WORK=${work}, loadavg: ${loadAvg()}) ==`);
ok(fs.existsSync(SRC720), `input 720p 5s có sẵn (${SRC720})`);
fs.copyFileSync(SRC720, path.join(mediaDir, "shaky720.mp4"));
const ABS_MEDIA = path.resolve(mediaDir, "shaky720.mp4");

// --- B. Dry-run: vị trí -threads 1 (đường bridge → render.js sẽ gọi) ------
console.log("\n== B. Dry-run vị trí -threads 1 ==");
const STAB = { stabilize: { smoothing: 10 } };
const specStab = specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shaky720.mp4", 5, { enhance: STAB })] }], 1280, 720);
const d1 = dryRun(specStab, "dry-stab");
ok(d1.status === 0, `dry-run spec stabilize chạy được (status ${d1.status})`);
const cmdStab = (d1.stdout.split("\n").find((l) => l.includes("ffmpeg")) || "");
const hitsStab = threadsBeforeInputs(cmdStab);
ok(hitsStab.length === 1 && hitsStab[0] === ABS_MEDIA,
  `mặc định (toggle BẬT): đúng 1 "-threads 1" ngay trước "-i" của input stabilize (${hitsStab.join(",") || "không có"})`);
ok(cmdStab.includes("vidstabtransform=input="), "dry-run có vidstabtransform trong graph");

const d2 = dryRun(specStab, "dry-stab-off", ["--no-stab-single-thread"]);
const cmdOff = (d2.stdout.split("\n").find((l) => l.includes("ffmpeg")) || "");
ok(d2.status === 0 && threadsBeforeInputs(cmdOff).length === 0 && !cmdOff.includes("-threads"),
  "toggle TẮT (--no-stab-single-thread): dry-run không còn -threads nào");

const d3 = dryRun(specStab, "dry-stab-env0", [], { VCUT_STAB_SINGLE_THREAD: "0" });
const cmdEnv0 = (d3.stdout.split("\n").find((l) => l.includes("ffmpeg")) || "");
ok(d3.status === 0 && threadsBeforeInputs(cmdEnv0).length === 0,
  "env VCUT_STAB_SINGLE_THREAD=0: dry-run không còn -threads nào");

const specPlain = specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shaky720.mp4", 5)] }], 1280, 720);
const d4 = dryRun(specPlain, "dry-plain");
const cmdPlain = (d4.stdout.split("\n").find((l) => l.includes("ffmpeg")) || "");
ok(d4.status === 0 && threadsBeforeInputs(cmdPlain).length === 0,
  "spec không stabilize: dry-run không có -threads 1 (không đụng clip thường)");

// --- C. Render thật 720p ×1 với cờ TẮT --------------------------------------
console.log("\n== C. Render thật 720p 5s stabilize ×1 (toggle TẮT) ==");
const rc = runRender(specStab, "stab-off", ["--no-stab-single-thread"]);
ok(rc.status === 0 && outOk(rc.outPath) && probeOk(rc.outPath, 1280, 720, 30, 5),
  `render TẮT: OK (${rc.secs.toFixed(1)}s, ${outOk(rc.outPath) ? fs.statSync(rc.outPath).size : 0} byte, sha ${outOk(rc.outPath) ? sha256(rc.outPath).slice(0, 12) : "?"}…)`);
ok(!rc.stdout.includes("🧵 stabilize single-thread decode") && !rc.stderr.includes("🧵 stabilize single-thread decode"),
  "render TẮT: log KHÔNG có dòng 🧵 stabilize single-thread decode");

// --- D. Render thật 720p ×1 mặc định (cờ BẬT) — đối chứng -------------------
console.log("\n== D. Render thật 720p 5s stabilize ×1 (mặc định BẬT) ==");
const rd = runRender(specStab, "stab-on");
ok(rd.status === 0 && outOk(rd.outPath) && probeOk(rd.outPath, 1280, 720, 30, 5),
  `render BẬT: OK (${rd.secs.toFixed(1)}s, ${outOk(rd.outPath) ? fs.statSync(rd.outPath).size : 0} byte, sha ${outOk(rd.outPath) ? sha256(rd.outPath).slice(0, 12) : "?"}…)`);
ok(rd.stdout.includes("🧵 stabilize single-thread decode") || rd.stderr.includes("🧵 stabilize single-thread decode"),
  "render BẬT: log CÓ dòng 🧵 stabilize single-thread decode");

console.log(`\n== KẾT QUẢ: ${pass} pass / ${fail} fail (loadavg cuối: ${loadAvg()}) ==`);
console.log(`WORK=${work}`);
process.exitCode = fail === 0 ? 0 : 1;
