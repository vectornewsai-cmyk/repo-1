#!/usr/bin/env node
/**
 * test_round75_c3_vidstab_hunt.js — Phase 9 đợt 75, luồng C3.
 *
 * Đóng nợ đợt 74 §4.3: săn crash SEGFAULT vidstab dưới handler mới (C3:
 * maps-window cho fault/RDI/RSI) + ghi lại SỐ FRAME cuối cùng hoàn thành
 * transform trước khi crash (showinfo sau vidstabtransform), để trả lời:
 *   - frame thứ mấy của clip thì crash (thời điểm trong pipeline);
 *   - dest bị munmap TOÀN BỘ (lỗ >= 2.076.672) hay chỉ mất trang cuối
 *     (lỗ 4.096) — bộ phân biệt đã kiểm chứng 31/31 ở
 *     test_round75_c3_vidstab_regs_maps.js;
 *   - nguồn RSI còn mapped không.
 *
 * Thiết kế (kế thừa B7, thu hẹp còn arm A 1080p để dồn số lần chạy):
 *   Arm A: clip gốc shakynoisy1080.mp4 5s 1920×1080 + .trf X8, NOCOPY,
 *   -threads 1, ×45 (env C3_N_A). KHÔNG dừng ở crash đầu.
 *   Smoke trước hunt: COPY ×1 dưới preload mới — sha phải khớp ground
 *   truth d960996868d3… (preload không đổi output).
 *   vf thêm `,showinfo` sau vidstabtransform + `-v info` (thay vì
 *   `-v error` của B7) để ghi số frame; showinfo là passthrough, không
 *   đổi pixel output. Chạy lại sau khi bị kill sẽ khôi phục từ
 *   results.jsonl (bỏ qua các lần đã chạy).
 *
 * Cách chạy: node server/render/src/test_round75_c3_vidstab_hunt.js
 * Kết quả: results.jsonl + summary.json trong WORK (mặc định
 * ~/workspace/.scratch-r75c3/runs); stderr từng lần chạy lưu riêng
 * (chứa regs + maps-window khi crash).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.C3_WORK || path.join(HOME, "workspace", ".scratch-r75c3", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const PRELOAD_C = path.join(__dirname, "segv_backtrace_preload.c");
const PRELOAD_SO = path.join(WORK, "segv_backtrace_preload.so");

const GROUND_TRUTH_SHA_PREFIX = "d960996868d3";
const LOAD_LIMIT = parseFloat(process.env.C3_LOAD_LIMIT || "8");
const N_A = parseInt(process.env.C3_N_A || "45", 10);

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
  const maxWaits = parseInt(process.env.C3_WAIT_MAX || "3", 10);
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
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}
function vfCopy(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss`;
}

function lastMatch(re, s) {
  let m = null, cur;
  re.lastIndex = 0;
  while ((cur = re.exec(s)) !== null) m = cur;
  return m ? parseInt(m[1], 10) : null;
}

function parseWindows(stderr) {
  const win = {};
  for (const mm of stderr.matchAll(/maps-window: (fault|RDI|RSI)=0x([0-9a-f]+) (IN 0x([0-9a-f]+)-0x([0-9a-f]+) (\S+)|HOLE prev_end=0x([0-9a-f]+) next_start=0x([0-9a-f]+) hole=(\d+))/g)) {
    win[mm[1]] = mm[4]
      ? { kind: "IN", start: parseInt(mm[4], 16), end: parseInt(mm[5], 16), perms: mm[6] }
      : { kind: "HOLE", prevEnd: parseInt(mm[7], 16), nextStart: parseInt(mm[8], 16), hole: parseInt(mm[9], 10) };
  }
  return win;
}

function runOnce(arm, idx, vf, src, threads, withShowinfo) {
  const outDir = path.join(WORK, arm);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `r${idx}.framemd5`);
  const errFile = path.join(outDir, `r${idx}.stderr`);
  const args = ["-threads", String(threads), "-v", withShowinfo ? "info" : "error",
    "-i", src, "-vf", vf, "-an", "-f", "framemd5", "-y", out];
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
  const btLines = stderr.split("\n").filter((l) =>
    l.includes("[segv_backtrace]") || /\+0x[0-9a-f]+\)\[/.test(l));
  const rec = {
    arm, i: idx, threads, status: r.status, signal: r.signal || null,
    error: r.error ? String(r.error) : null,
    size, sha: sha ? sha.slice(0, 12) : null, secs: +secs.toFixed(1),
    loadavg: loadAvgStr(), crash: crashed,
    // Số frame cuối cùng HOÀN THÀNH transform (showinfo sau vidstabtransform,
    // đếm từ 0; clip 5s 30fps = 150 frame, n=0..149). Crash frame = lastFrame+1
    // (decode threads=1 nên frame vào filter theo thứ tự).
    lastFrame: withShowinfo ? lastMatch(/\[Parsed_showinfo[^\]]*\] n:\s*(\d+)/g, stderr) : null,
    encFrame: withShowinfo ? lastMatch(/frame=\s*(\d+)/g, stderr) : null,
    windows: crashed ? parseWindows(stderr) : null,
    backtrace: crashed ? btLines : [],
    stderrTail: stderr.slice(-500),
  };
  if (crashed) {
    log(`   💥 ${arm}-r${idx}: CRASH signal=${r.signal} status=${r.status} size=${size} lastFrame=${rec.lastFrame} encFrame=${rec.encFrame}`);
    for (const l of btLines.slice(0, 24)) log(`        ${l}`);
  } else {
    log(`   📊 ${arm}-r${idx} (${secs.toFixed(1)}s): ok sha=${sha.slice(0, 12)}… lastFrame=${rec.lastFrame} load=${loadAvgStr()}`);
  }
  record(rec);
  return rec;
}

function main() {
  log(`== Đợt 75 C3 — săn crash vidstab dưới handler maps-window (A×${N_A}, showinfo) ==`);
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

  const done = loadDone();
  if (done.size > 0) log(`   📊 khôi phục: ${done.size} lần chạy đã có trong results.jsonl — bỏ qua, không chạy lại`);
  let smoke = null;
  if (done.has("COPY:0")) {
    log(`   📊 SMOKE đã có từ lần chạy trước — bỏ qua (xem results.jsonl)`);
    smoke = { sha: GROUND_TRUTH_SHA_PREFIX };
  } else {
    waitForQuiet("smoke-COPY");
    smoke = runOnce("COPY", 0, vfCopy(TRF1080), SRC1080, 1, false);
    done.add("COPY:0");
  }
  if (smoke.crash || !smoke.sha || !smoke.sha.startsWith(GROUND_TRUTH_SHA_PREFIX)) {
    log(`   ❌ SMOKE FAIL: COPY dưới preload cho sha=${smoke.sha} (kỳ vọng ${GROUND_TRUTH_SHA_PREFIX}…) hoặc crash — preload đổi hành vi, DỪNG hunt`);
    writeFileEpermRetry(SUMMARYF, JSON.stringify({ done: false, reason: "smoke-fail", smoke }, null, 1));
    process.exit(2);
  }
  log(`   ✅ SMOKE OK: COPY dưới preload sha=${smoke.sha}… khớp ground truth — preload không đổi output`);

  const all = [];
  try {
    for (const line of fs.readFileSync(LOGF, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      if (r.arm !== "COPY") all.push(r);
    }
  } catch { /* không có log cũ */ }
  log(`\n-- Arm A1080t1: NOCOPY ×${N_A} (threads=1, showinfo) --`);
  for (let i = 1; i <= N_A; i++) {
    if (done.has(`A1080t1:${i}`)) { log(`   ⏭️  A1080t1-r${i}: đã chạy từ lần trước — bỏ qua`); continue; }
    waitForQuiet(`A1080t1-r${i}`);
    all.push(runOnce("A1080t1", i, vfNocopy(TRF1080), SRC1080, 1, true));
    done.add(`A1080t1:${i}`);
  }

  const crashes = all.filter((r) => r.crash);
  const byArm = {
    A1080t1: {
      runs: all.length,
      crashes: crashes.length,
      crashIdx: crashes.map((r) => r.i),
      crashFrames: crashes.map((r) => ({ i: r.i, lastFrame: r.lastFrame, encFrame: r.encFrame })),
      shas: all.filter((r) => !r.crash).reduce((m, r) => { m[r.sha] = (m[r.sha] || 0) + 1; return m; }, {}),
    },
  };
  const summary = {
    done: true,
    method: "LD_PRELOAD segv_backtrace (handler C3: regs+si_code+offsets+maps-window) + showinfo frame capture, khong dung o crash dau",
    preloadSo: PRELOAD_SO, smokeCopy: { sha: smoke.sha, ok: true },
    totalRuns: all.length, totalCrashes: crashes.length,
    byArm,
    crashes: crashes.map((r) => ({
      arm: r.arm, i: r.i, signal: r.signal, lastFrame: r.lastFrame,
      encFrame: r.encFrame, windows: r.windows, backtrace: r.backtrace,
    })),
    note: "So duoi preload la arm rieng — KHONG gop voi ti le native 3/30 cua Y6 hay 3/45 cua B7 khi khac dieu kien (them showinfo).",
  };
  writeFileEpermRetry(SUMMARYF, JSON.stringify(summary, null, 1));
  log(`\n== HUNT XONG: ${crashes.length}/${all.length} crash ==`);
  for (const c of crashes) {
    log(`   💥 ${c.arm}-r${c.i}: lastFrame=${c.lastFrame} encFrame=${c.encFrame} windows=${JSON.stringify(c.windows)}`);
  }
}

main();
