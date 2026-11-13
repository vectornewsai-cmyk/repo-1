#!/usr/bin/env node
/**
 * test_round72_z6_trace_hunt.js — Phase 9 đợt 72, luồng Z6:
 * săn stack trace SEGFAULT vidstab bằng LD_PRELOAD (không dùng gdb/core).
 *
 * Bối cảnh: core dump bị chặn (RLIMIT_CORE hard=0, đợt 71 Y6 §3) và gdb
 * hunt 30 lần không bắt được crash nào (Y6 pha G, 0/30). Đường mới:
 * preload 1 thư viện nhỏ (segv_backtrace_preload.c, cùng thư mục) cài
 * handler SIGSEGV in backtrace ra stderr rồi re-raise — process vẫn
 * chết bởi SIGSEGV (status=null, signal=SIGSEGV). Handler chỉ cài lúc
 * load, không ptrace nên gần như không đổi thời gian tương đối của race
 * decode→transform (khác gdb, vốn serialize thread và có thể ức chế
 * race — Y6 §3.3).
 *
 * Thí nghiệm: đúng cấu hình pha E của X8 / nhánh NOCOPY của Y6 (cùng
 * clip shakynoisy1080.mp4 5s + cùng .trf của X8, -threads 1, output
 * framemd5), NOCOPY ×30, dừng ngay khi bắt được 1 crash kèm backtrace.
 * P(bắt được ≥1 crash | tỉ lệ thật 10%) ≈ 96%; nếu 0/30 thì KHÔNG
 * claim gì về tỉ lệ (số dưới preload là arm riêng, không gộp với số
 * native 3/30 của Y6 — P(0/30 | p=10%) = 4,2%, vẫn có thể là may mắn,
 * hoặc tỉ lệ thật thấp hơn 10%).
 *
 * Cách chạy: node server/render/src/test_round72_z6_trace_hunt.js
 * Kết quả: results.jsonl + summary.json trong WORK (mặc định
 * ~/workspace/.scratch-r72z6/runs). Thư viện .so biên dịch vào WORK.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.Z6_WORK || path.join(HOME, "workspace", ".scratch-r72z6", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const PRELOAD_C = path.join(__dirname, "segv_backtrace_preload.c");
const PRELOAD_SO = path.join(WORK, "segv_backtrace_preload.so");

const VF_NOCOPY = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
const VF_COPY = `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
const GROUND_TRUTH_SHA_PREFIX = "d960996868d3"; // sha framemd5 COPY của Y6/X8

const N_HUNT = 30;
const LOAD_LIMIT = 5.0;

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
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
function record(rec) { fs.appendFileSync(LOGF, JSON.stringify(rec) + "\n"); }

function waitForQuiet(tag) {
  for (let w = 0; w < 10; w++) {
    const l = loadAvg1();
    if (Number.isNaN(l) || l <= LOAD_LIMIT) {
      if (w > 0) log(`   ⏳ ${tag}: máy đã yên sau ${w} lần chờ (load1=${l})`);
      return l;
    }
    log(`   ⏳ ${tag}: load1=${l} > ${LOAD_LIMIT}, chờ 30s… (${w + 1}/10)`);
    sleepSync(30000);
  }
  const l = loadAvg1();
  log(`   ⚠️ ${tag}: vẫn load1=${l} sau 10 lần chờ — chạy tiếp để khỏi kẹt lượt`);
  return l;
}

// Chạy 1 lần ffmpeg với LD_PRELOAD, trả về record đầy đủ (kèm backtrace nếu crash).
function runOnce(arm, idx, vf) {
  const tag = arm === "COPY" ? "C" : "N";
  const outDir = path.join(WORK, arm);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `r${idx}.framemd5`);
  const errFile = path.join(outDir, `r${idx}.stderr`);
  const args = ["-threads", "1", "-v", "error", "-i", SRC1080, "-vf", vf, "-an", "-f", "framemd5", "-y", out];
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
  // Đợt 72 Z6 (sửa sau lần chạy đầu): backtrace_symbols_fd in dạng
  // "path(func+0xOFF)[0xADDR]" hoặc "path(+0xOFF)[0xADDR]" — regex cũ
  // tìm "(0x" nên bỏ sót hết các frame (chỉ còn dòng header); regex đúng
  // phải khớp "+0x…)[ ". File stderr đầy đủ vẫn lưu riêng nên không mất dữ liệu.
  const btLines = stderr.split("\n").filter((l) =>
    l.includes("[segv_backtrace]") || /\+0x[0-9a-f]+\)\[/.test(l));
  const rec = {
    arm, i: idx, status: r.status, signal: r.signal || null,
    error: r.error ? String(r.error) : null,
    size, sha: sha ? sha.slice(0, 12) : null, secs: +secs.toFixed(1),
    loadavg: loadAvgStr(), crash: crashed,
    backtrace: crashed ? btLines : [],
    stderrTail: stderr.slice(-500),
  };
  if (crashed) {
    log(`   💥 ${arm}-r${idx}: CRASH signal=${r.signal} status=${r.status} size=${size}`);
    for (const l of btLines.slice(0, 20)) log(`        ${l}`);
  } else {
    log(`   📊 ${arm}-r${idx} (${secs.toFixed(1)}s): ok sha=${sha.slice(0, 12)}… load=${loadAvgStr()}`);
  }
  record(rec);
  return rec;
}

function main() {
  log(`== Đợt 72 Z6 — săn stack trace vidstab bằng LD_PRELOAD (NOCOPY ×${N_HUNT}) ==`);
  log(`   WORK=${WORK}`);
  for (const p of [SRC1080, TRF1080, PRELOAD_C]) {
    if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
  log(`   📊 SRC1080 sha=${sha256(SRC1080).slice(0, 12)}… (kỳ vọng 5cf533f5bcd9…)`);
  log(`   📊 TRF1080 (X8) sha=${sha256(TRF1080).slice(0, 12)}…`);

  // Biên dịch thư viện preload (ghi rõ nếu gcc không có — không bịa).
  const cc = spawnSync("gcc", ["-shared", "-fPIC", "-O2", "-o", PRELOAD_SO, PRELOAD_C, "-rdynamic"],
    { stdio: ["ignore", "pipe", "pipe"] });
  if (cc.status !== 0) {
    log(`   ❌ không biên dịch được preload lib (gcc lỗi):\n${(cc.stderr || "").toString()}`);
    process.exit(2);
  }
  log(`   📊 preload lib đã biên dịch: ${PRELOAD_SO} (${fs.statSync(PRELOAD_SO).size} byte)`);

  // Smoke: COPY ×1 dưới preload — sha phải khớp ground truth, nếu không
  // thì preload đã đổi hành vi → dừng hunt, ghi rõ.
  waitForQuiet("smoke-COPY");
  const smoke = runOnce("COPY", 0, VF_COPY);
  if (smoke.crash || !smoke.sha || !smoke.sha.startsWith(GROUND_TRUTH_SHA_PREFIX)) {
    log(`   ❌ SMOKE FAIL: COPY dưới preload cho sha=${smoke.sha} (kỳ vọng ${GROUND_TRUTH_SHA_PREFIX}…) ` +
      `hoặc crash — preload đổi hành vi, DỪNG hunt (không chạy NOCOPY)`);
    writeFileEpermRetry(SUMMARYF, JSON.stringify({ done: false, reason: "smoke-fail", smoke }, null, 1));
    process.exit(2);
  }
  log(`   ✅ SMOKE OK: COPY dưới preload sha=${smoke.sha}… khớp ground truth — preload không đổi output`);

  // Hunt: NOCOPY ×30, dừng ngay khi bắt được 1 crash kèm backtrace.
  const recs = [];
  let caught = null;
  for (let i = 1; i <= N_HUNT; i++) {
    waitForQuiet(`N-r${i}`);
    const r = runOnce("NOCOPY", i, VF_NOCOPY);
    recs.push(r);
    if (r.crash) {
      caught = r;
      log(`   🎯 BẮT ĐƯỢC CRASH ở N-r${i} — dừng hunt (đủ 1 backtrace)`);
      break;
    }
  }
  const crashes = recs.filter((r) => r.crash).length;
  const summary = {
    done: true, method: "LD_PRELOAD segv_backtrace (không gdb, không core dump)",
    preloadSo: PRELOAD_SO, smokeCopy: { sha: smoke.sha, ok: true },
    runs: recs.length, crashes,
    caught: caught ? { i: caught.i, signal: caught.signal, backtrace: caught.backtrace } : null,
    note: "Số dưới preload là arm riêng — KHÔNG gộp với tỉ lệ native 3/30 của Y6.",
    shas: recs.filter((r) => !r.crash).reduce((m, r) => { m[r.sha] = (m[r.sha] || 0) + 1; return m; }, {}),
  };
  writeFileEpermRetry(SUMMARYF, JSON.stringify(summary, null, 1));
  log(`\n== Z6 HUNT KẾT LUẬN ==`);
  log(`   NOCOPY dưới preload: ${crashes}/${recs.length} crash; bắt được backtrace: ${caught ? `CÓ (N-r${caught.i})` : "KHÔNG"}`);
  log(`   sha các lần không crash: ${JSON.stringify(summary.shas)}`);
  log(`== xong (WORK=${WORK}) ==`);
}

main();
