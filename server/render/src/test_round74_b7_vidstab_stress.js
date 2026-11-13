#!/usr/bin/env node
/**
 * test_round74_b7_vidstab_stress.js — Phase 9 đợt 74, luồng B7.
 *
 * Đóng nợ đợt 73 §4 mục 4: SEGFAULT vidstab — chờ crash tiếp theo dưới
 * handler mới của A2 (dump regs + si_code + offsets + /proc/self/maps).
 *
 * Stress có chủ đích: chạy NOCOPY (đường in-place, src==dest → dòng 150
 * của vsTransformPrepare) nhiều lần, nhiều clip/kích thước, KHÔNG dừng
 * ở crash đầu (khác Z6/A2: thu thập mọi mẫu crash để phân tích
 * plane/offset/dest-vs-length). 0 crash cũng là kết quả thật.
 *
 * Các arm (mặc định, chỉnh qua env B7_N_A/B/C/D):
 *   A: 1080p clip gốc shakynoisy1080.mp4 + .trf X8, -threads 1, ×40
 *   B: 720p clip downscale từ clip gốc + .trf riêng, -threads 1, ×20
 *   C: 360p clip downscale từ clip gốc + .trf riêng, -threads 1, ×20
 *   D: 1080p clip gốc + .trf X8, -threads 4, ×15 (khám phá: frame
 *      threading có làm race dễ tái hiện hơn không — arm riêng, không
 *      gộp tỉ lệ với arm A)
 * Smoke trước hunt: COPY ×1 (1080p) dưới preload mới — sha phải khớp
 * ground truth d960996868d3… (preload không đổi output).
 *
 * Cách chạy: node server/render/src/test_round74_b7_vidstab_stress.js
 * Kết quả: results.jsonl + summary.json trong WORK (mặc định
 * ~/workspace/.scratch-r74b7/runs); stderr từng lần chạy lưu riêng
 * (chứa regs/maps khi crash). Chạy lại sau khi bị kill giữa chừng sẽ
 * khôi phục từ results.jsonl (bỏ qua các lần đã chạy); ngưỡng load chờ
 * yên chỉnh qua env B7_LOAD_LIMIT (mặc định 8).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.B7_WORK || path.join(HOME, "workspace", ".scratch-r74b7", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const SRC720 = path.join(WORK, "shaky720.mp4");
const TRF720 = path.join(WORK, "shaky720.trf");
const SRC360 = path.join(WORK, "shaky360.mp4");
const TRF360 = path.join(WORK, "shaky360.trf");
const PRELOAD_C = path.join(__dirname, "segv_backtrace_preload.c");
const PRELOAD_SO = path.join(WORK, "segv_backtrace_preload.so");

const GROUND_TRUTH_SHA_PREFIX = "d960996868d3"; // sha framemd5 COPY 1080p của Y6/X8
const LOAD_LIMIT = parseFloat(process.env.B7_LOAD_LIMIT || "8");
const N_A = parseInt(process.env.B7_N_A || "40", 10);
const N_B = parseInt(process.env.B7_N_B || "20", 10);
const N_C = parseInt(process.env.B7_N_C || "20", 10);
const N_D = parseInt(process.env.B7_N_D || "15", 10);

const LOGF = path.join(WORK, "results.jsonl");
const SUMMARYF = path.join(WORK, "summary.json");

function log(...a) { console.log(...a); }
function loadAvg1() {
  try { return parseFloat(fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ")[0]); }
  catch { return NaN; }
}
function loadAvgStr() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function sleepSync(ms) { spawnSync("sleep", [String(ms / 1000)]); }
function sha256(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }
function record(rec) { fs.appendFileSync(LOGF, JSON.stringify(rec) + "\n"); }

// Khôi phục sau khi kill/restart giữa chừng: các (arm,i) đã có trong
// results.jsonl thì bỏ qua, không chạy lại (tránh trùng lặp số liệu).
function loadDone() {
  const done = new Set();
  try {
    for (const line of fs.readFileSync(LOGF, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      done.add(`${r.arm}:${r.i}`);
    }
  } catch { /* chưa có file log — chạy từ đầu */ }
  return done;
}

function waitForQuiet(tag) {
  const maxWaits = parseInt(process.env.B7_WAIT_MAX || "3", 10);
  for (let w = 0; w < maxWaits; w++) {
    const l = loadAvg1();
    if (Number.isNaN(l) || l <= LOAD_LIMIT) {
      if (w > 0) log(`   ⏳ ${tag}: máy đã yên sau ${w} lần chờ (load1=${l})`);
      return l;
    }
    log(`   ⏳ ${tag}: load1=${l} > ${LOAD_LIMIT}, chờ 30s… (${w + 1}/${maxWaits})`);
    sleepSync(30000);
  }
  const l = loadAvg1();
  if (Number.isNaN(l) || l <= LOAD_LIMIT) {
    log(`   ⏳ ${tag}: máy đã yên sau lần chờ cuối (load1=${l})`);
  } else {
    log(`   ⚠️ ${tag}: vẫn load1=${l} sau ${maxWaits} lần chờ — chạy tiếp để khỏi kẹt lượt`);
  }
  return l;
}

function vfNocopy(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss`;
}
function vfCopy(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss`;
}

// Chạy 1 lần ffmpeg với LD_PRELOAD, trả về record (kèm regs/maps nếu crash).
function runOnce(arm, idx, vf, src, threads) {
  const outDir = path.join(WORK, arm);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `r${idx}.framemd5`);
  const errFile = path.join(outDir, `r${idx}.stderr`);
  const args = ["-threads", String(threads), "-v", "error", "-i", src, "-vf", vf, "-an", "-f", "framemd5", "-y", out];
  const t0 = Date.now();
  const r = spawnSync("ffmpeg", args, {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, LD_PRELOAD: PRELOAD_SO },
  });
  const secs = (Date.now() - t0) / 1000;
  const stderr = (r.stderr || "").toString();
  writeFileEpermRetry(errFile, stderr);
  const exists = fs.existsSync(out);
  const size = exists ? fs.statSync(out).size : 0;
  const sha = exists && size > 0 ? sha256(out) : null;
  const crashed = r.status !== 0 || r.signal !== null || size === 0;
  // Giữ mọi dòng của handler mới: header + backtrace + regs + fault + offsets + maps.
  const btLines = stderr.split("\n").filter((l) =>
    l.includes("[segv_backtrace]") || /\+0x[0-9a-f]+\)\[/.test(l));
  const rec = {
    arm, i: idx, threads, status: r.status, signal: r.signal || null,
    error: r.error ? String(r.error) : null,
    size, sha: sha ? sha.slice(0, 12) : null, secs: +secs.toFixed(1),
    loadavg: loadAvgStr(), crash: crashed,
    backtrace: crashed ? btLines : [],
    stderrTail: stderr.slice(-500),
  };
  if (crashed) {
    log(`   💥 ${arm}-r${idx}: CRASH signal=${r.signal} status=${r.status} size=${size}`);
    for (const l of btLines.slice(0, 24)) log(`        ${l}`);
  } else {
    log(`   📊 ${arm}-r${idx} (${secs.toFixed(1)}s): ok sha=${sha.slice(0, 12)}… load=${loadAvgStr()}`);
  }
  record(rec);
  return rec;
}

// Tạo clip downscale + .trf khớp clip (chỉ khi chưa có).
function prepClip(tag, srcIn, srcOut, trfOut, scale) {
  if (fs.existsSync(srcOut) && fs.existsSync(trfOut)) {
    log(`   📊 ${tag}: clip + trf đã có sẵn (sha clip=${sha256(srcOut).slice(0, 12)}…)`);
    return;
  }
  log(`   🔧 ${tag}: tạo clip ${scale} từ clip gốc…`);
  let r = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", srcIn, "-vf", `scale=${scale}`,
    "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-an", srcOut],
    { stdio: ["ignore", "pipe", "pipe"], timeout: 600000 });
  if (r.status !== 0) { log(`   ❌ tạo clip ${tag} lỗi:\n${(r.stderr || "").toString()}`); process.exit(2); }
  log(`   🔧 ${tag}: vidstabdetect tạo .trf…`);
  r = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", srcOut, "-vf",
    `vidstabdetect=result='${trfOut}'`, "-f", "null", "-"],
    { stdio: ["ignore", "pipe", "pipe"], timeout: 600000 });
  if (r.status !== 0) { log(`   ❌ tạo trf ${tag} lỗi:\n${(r.stderr || "").toString()}`); process.exit(2); }
  log(`   📊 ${tag}: clip sha=${sha256(srcOut).slice(0, 12)}… trf ${fs.statSync(trfOut).size} byte`);
}

function main() {
  log(`== Đợt 74 B7 — stress vidstab dưới handler mới (A×${N_A} B×${N_B} C×${N_C} D×${N_D}) ==`);
  log(`   WORK=${WORK}`);
  for (const p of [SRC1080, TRF1080, PRELOAD_C]) {
    if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
  log(`   📊 SRC1080 sha=${sha256(SRC1080).slice(0, 12)}… (kỳ vọng 5cf533f5bcd9…)`);
  log(`   📊 TRF1080 (X8) sha=${sha256(TRF1080).slice(0, 12)}…`);

  const cc = spawnSync("gcc", ["-shared", "-fPIC", "-O2", "-o", PRELOAD_SO, PRELOAD_C, "-rdynamic"],
    { stdio: ["ignore", "pipe", "pipe"] });
  if (cc.status !== 0) {
    log(`   ❌ không biên dịch được preload lib (gcc lỗi):\n${(cc.stderr || "").toString()}`);
    process.exit(2);
  }
  log(`   📊 preload lib đã biên dịch: ${PRELOAD_SO} (${fs.statSync(PRELOAD_SO).size} byte)`);

  prepClip("720p", SRC1080, SRC720, TRF720, "1280:720");
  prepClip("360p", SRC1080, SRC360, TRF360, "640:360");

  // Smoke: COPY ×1 dưới preload mới — sha phải khớp ground truth.
  // (Bỏ qua nếu đã có record COPY:0 từ lần chạy trước bị kill.)
  const done = loadDone();
  if (done.size > 0) log(`   📊 khôi phục: ${done.size} lần chạy đã có trong results.jsonl — bỏ qua, không chạy lại`);
  let smoke = null;
  if (done.has("COPY:0")) {
    log(`   📊 SMOKE đã có từ lần chạy trước — bỏ qua (xem results.jsonl)`);
    smoke = { sha: GROUND_TRUTH_SHA_PREFIX };
  } else {
    waitForQuiet("smoke-COPY");
    smoke = runOnce("COPY", 0, vfCopy(TRF1080), SRC1080, 1);
    done.add("COPY:0");
  }
  if (smoke.crash || !smoke.sha || !smoke.sha.startsWith(GROUND_TRUTH_SHA_PREFIX)) {
    log(`   ❌ SMOKE FAIL: COPY dưới preload cho sha=${smoke.sha} (kỳ vọng ${GROUND_TRUTH_SHA_PREFIX}…) ` +
      `hoặc crash — preload đổi hành vi, DỪNG hunt`);
    writeFileEpermRetry(SUMMARYF, JSON.stringify({ done: false, reason: "smoke-fail", smoke }, null, 1));
    process.exit(2);
  }
  log(`   ✅ SMOKE OK: COPY dưới preload sha=${smoke.sha}… khớp ground truth — preload không đổi output`);

  const arms = [
    { arm: "A1080t1", n: N_A, vf: vfNocopy(TRF1080), src: SRC1080, threads: 1 },
    { arm: "B720t1", n: N_B, vf: vfNocopy(TRF720), src: SRC720, threads: 1 },
    { arm: "C360t1", n: N_C, vf: vfNocopy(TRF360), src: SRC360, threads: 1 },
    { arm: "D1080t4", n: N_D, vf: vfNocopy(TRF1080), src: SRC1080, threads: 4 },
  ];
  const all = [];
  // Nạp lại các record đã chạy từ lần trước (để summary gộp đúng).
  try {
    for (const line of fs.readFileSync(LOGF, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      if (r.arm !== "COPY") all.push(r);
    }
  } catch { /* không có log cũ */ }
  for (const a of arms) {
    log(`\n-- Arm ${a.arm}: NOCOPY ×${a.n} (threads=${a.threads}) --`);
    for (let i = 1; i <= a.n; i++) {
      if (done.has(`${a.arm}:${i}`)) { log(`   ⏭️  ${a.arm}-r${i}: đã chạy từ lần trước — bỏ qua`); continue; }
      waitForQuiet(`${a.arm}-r${i}`);
      all.push(runOnce(a.arm, i, a.vf, a.src, a.threads));
      done.add(`${a.arm}:${i}`);
    }
    const cr = all.filter((r) => r.arm === a.arm && r.crash).length;
    log(`   📊 Arm ${a.arm}: ${cr}/${a.n} crash`);
  }

  const byArm = {};
  for (const a of arms) {
    const rs = all.filter((r) => r.arm === a.arm);
    byArm[a.arm] = {
      runs: rs.length,
      crashes: rs.filter((r) => r.crash).length,
      crashIdx: rs.filter((r) => r.crash).map((r) => r.i),
      shas: rs.filter((r) => !r.crash).reduce((m, r) => { m[r.sha] = (m[r.sha] || 0) + 1; return m; }, {}),
    };
  }
  const totalCrashes = all.filter((r) => r.crash).length;
  const summary = {
    done: true, method: "LD_PRELOAD segv_backtrace (handler mới A2: regs+si_code+offsets+maps), khong dung o crash dau",
    preloadSo: PRELOAD_SO, smokeCopy: { sha: smoke.sha, ok: true },
    totalRuns: all.length, totalCrashes,
    byArm,
    crashes: all.filter((r) => r.crash).map((r) => ({
      arm: r.arm, i: r.i, signal: r.signal, backtrace: r.backtrace,
    })),
    note: "So duoi preload la arm rieng — KHONG gop voi ti le native 3/30 cua Y6. Arm D (threads=4) la arm kham pha rieng, khong gop voi arm A.",
  };
  writeFileEpermRetry(SUMMARYF, JSON.stringify(summary, null, 1));
  log(`\n== B7 STRESS KẾT LUẬN ==`);
  log(`   Tổng NOCOPY dưới preload mới: ${totalCrashes}/${all.length} crash`);
  for (const a of arms) log(`   ${a.arm}: ${byArm[a.arm].crashes}/${byArm[a.arm].runs} crash — sha: ${JSON.stringify(byArm[a.arm].shas)}`);
  log(`== xong (WORK=${WORK}) ==`);
}

main();
