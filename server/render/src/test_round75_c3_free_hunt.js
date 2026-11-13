#!/usr/bin/env node
/**
 * test_round75_c3_free_hunt.js — Phase 9 đợt 75, luồng C3.
 *
 * Săn crash SEGFAULT vidstab dưới CẢ 2 preload (free_track + segv handler
 * maps-window) + showinfo, để trả lời câu hỏi cuối: chunk đích td->src
 * có bị FREE giữa stream không, và RDI lúc crash có khớp địa chỉ đã FREE
 * không (kèm backtrace của lần free đó)?
 *
 * Arm duy nhất: clip gốc 1080p + .trf X8, NOCOPY, -threads 1, ×12
 * (env C3_FT_N, mặc định 12). Mỗi lần chạy dùng log FREE_TRACK riêng
 * (free-track-r<i>.log) để đối chiếu RDI. KHÔNG dừng ở crash đầu.
 * Smoke COPY ×1 trước (cả 2 preload, sha ground truth).
 *
 * Cách chạy: node server/render/src/test_round75_c3_free_hunt.js
 * Kết quả: results-free.jsonl + summary-free.json trong WORK
 * (~/workspace/.scratch-r75c3/runs); stderr từng lần lưu riêng.
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
const FREE_SO = path.join(WORK, "free_track_preload.so");
const SEGV_SO = path.join(WORK, "segv_backtrace_preload.so");
const GROUND_TRUTH_SHA_PREFIX = "d960996868d3";
const LOAD_LIMIT = parseFloat(process.env.C3_LOAD_LIMIT || "8");
const N_FT = parseInt(process.env.C3_FT_N || "12", 10);
const LOGF = path.join(WORK, "results-free.jsonl");
const SUMMARYF = path.join(WORK, "summary-free.json");
const BOTH = `${FREE_SO}:${SEGV_SO}`;

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
  } catch { /* chưa có */ }
  return done;
}
function waitForQuiet(tag) {
  const maxWaits = parseInt(process.env.C3_WAIT_MAX || "3", 10);
  for (let w = 0; w < maxWaits; w++) {
    const l = loadAvg1();
    if (Number.isNaN(l) || l <= LOAD_LIMIT) return l;
    log(`   ⏳ ${tag}: load1=${l} > ${LOAD_LIMIT}, chờ 30s… (${w + 1}/${maxWaits})`);
    sleepSync(30000);
  }
  return loadAvg1();
}
function lastMatch(re, s) {
  let m = null, cur;
  re.lastIndex = 0;
  while ((cur = re.exec(s)) !== null) m = cur;
  return m ? parseInt(m[1], 10) : null;
}
function parseFreeLog(text) {
  const events = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\[free_track\] (ALLOC-malloc|ALLOC-memalign|FREE) addr=(0x[0-9a-f]+) size=(\d+) tid=(\d+)/);
    if (!m) continue;
    const bt = [];
    for (let j = i + 1; j < Math.min(i + 17, lines.length); j++) {
      if (lines[j].startsWith("[free_track]")) break;
      if (lines[j].trim()) bt.push(lines[j].trim());
    }
    events.push({ kind: m[1], addr: m[2], size: parseInt(m[3], 10), tid: m[4], bt });
  }
  return events;
}

function runOnce(arm, idx, vf, src, withShowinfo) {
  const outDir = path.join(WORK, arm);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `ft-r${idx}.framemd5`);
  const errFile = path.join(outDir, `ft-r${idx}.stderr`);
  const freeLog = path.join(WORK, `free-track-r${idx}.log`);
  try { fs.unlinkSync(freeLog); } catch { /* chưa có */ }
  const args = ["-threads", "1", "-v", withShowinfo ? "info" : "error",
    "-i", src, "-vf", vf, "-an", "-f", "framemd5", "-y", out];
  const t0 = Date.now();
  const r = spawnSync("ffmpeg", args, {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, LD_PRELOAD: BOTH, FREE_TRACK_LOG: freeLog },
  });
  const secs = (Date.now() - t0) / 1000;
  const stderr = (r.stderr || "").toString();
  writeFileEpermRetry(errFile, stderr);
  const exists = fs.existsSync(out);
  const size = exists ? fs.statSync(out).size : 0;
  const sha = exists && size > 0 ? sha256(out) : null;
  const crashed = r.status !== 0 || r.signal !== null || size === 0;
  const regs = stderr.match(/regs: RIP=0x([0-9a-f]+) RDI=0x([0-9a-f]+) RSI=0x([0-9a-f]+) RDX=0x([0-9a-f]+)/);
  const rdi = regs ? `0x${regs[2]}` : null;
  const ev = parseFreeLog(fs.existsSync(freeLog) ? fs.readFileSync(freeLog, "utf8") : "");
  const vidstabAllocs = ev.filter((e) => e.bt.some((l) => l.includes("vsFrameAllocate")));
  const rdiFreed = rdi ? ev.filter((e) => e.kind === "FREE" && e.addr === rdi) : [];
  const rec = {
    arm, i: idx, status: r.status, signal: r.signal || null,
    size, sha: sha ? sha.slice(0, 12) : null, secs: +secs.toFixed(1),
    loadavg: loadAvgStr(), crash: crashed,
    lastFrame: withShowinfo ? lastMatch(/\[Parsed_showinfo[^\]]*\] n:\s*(\d+)/g, stderr) : null,
    encFrame: withShowinfo ? lastMatch(/frame=\s*(\d+)/g, stderr) : null,
    rdi, rdiFreed: rdiFreed.length,
    rdiFreeBt: rdiFreed.length ? rdiFreed[0].bt.slice(0, 8) : [],
    vidstabAllocs: vidstabAllocs.map((a) => ({
      kind: a.kind, addr: a.addr,
      site: (a.bt.find((l) => l.includes("vsTransformPrepare")) || "").trim(),
    })),
    nFree: ev.filter((e) => e.kind === "FREE").length,
    nAlloc: ev.filter((e) => e.kind.startsWith("ALLOC")).length,
  };
  if (crashed) {
    log(`   💥 ${arm}-r${idx}: CRASH signal=${r.signal} lastFrame=${rec.lastFrame} RDI=${rdi} RDI-freed-trước-crash=${rdiFreed.length}`);
    if (rdiFreed.length) for (const l of rec.rdiFreeBt) log(`        FREE-bt: ${l}`);
  } else {
    log(`   📊 ${arm}-r${idx} (${secs.toFixed(1)}s): ok sha=${sha ? sha.slice(0, 12) : null}… lastFrame=${rec.lastFrame} allocs=${rec.nAlloc} frees=${rec.nFree} vidstabAllocs=${JSON.stringify(rec.vidstabAllocs)}`);
  }
  record(rec);
  return rec;
}

function main() {
  log(`== Đợt 75 C3 — săn crash dưới free_track + segv (FT×${N_FT}, showinfo) ==`);
  log(`   WORK=${WORK}`);
  for (const p of [SRC1080, TRF1080, FREE_SO, SEGV_SO]) {
    if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
  const done = loadDone();
  if (done.size > 0) log(`   📊 khôi phục: ${done.size} lần chạy đã có trong results-free.jsonl — bỏ qua`);
  const vfCopy = `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
  const vfNocopy = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss,showinfo`;
  let smoke = null;
  if (done.has("COPY:0")) {
    log(`   📊 SMOKE đã có từ lần chạy trước — bỏ qua`);
    smoke = { sha: GROUND_TRUTH_SHA_PREFIX };
  } else {
    waitForQuiet("smoke-COPY");
    smoke = runOnce("COPY", 0, vfCopy, SRC1080, false);
    done.add("COPY:0");
  }
  if (smoke.crash || !smoke.sha || !smoke.sha.startsWith(GROUND_TRUTH_SHA_PREFIX)) {
    log(`   ❌ SMOKE FAIL: sha=${smoke.sha} hoặc crash — DỪNG hunt`);
    writeFileEpermRetry(SUMMARYF, JSON.stringify({ done: false, reason: "smoke-fail", smoke }, null, 1));
    process.exit(2);
  }
  log(`   ✅ SMOKE OK: COPY dưới 2 preload sha=${smoke.sha}… khớp ground truth`);

  const all = [];
  try {
    for (const line of fs.readFileSync(LOGF, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      if (r.arm !== "COPY") all.push(r);
    }
  } catch { /* không có log cũ */ }
  log(`\n-- Arm FT: NOCOPY ×${N_FT} (2 preload, showinfo) --`);
  for (let i = 1; i <= N_FT; i++) {
    if (done.has(`FT:${i}`)) { log(`   ⏭️  FT-r${i}: đã chạy từ lần trước — bỏ qua`); continue; }
    waitForQuiet(`FT-r${i}`);
    all.push(runOnce("FT", i, vfNocopy, SRC1080, true));
    done.add(`FT:${i}`);
  }
  const crashes = all.filter((r) => r.crash);
  const summary = {
    done: true,
    method: "LD_PRELOAD free_track + segv_backtrace (maps-window) + showinfo",
    smokeCopy: { sha: smoke.sha, ok: true },
    totalRuns: all.length, totalCrashes: crashes.length,
    crashes: crashes.map((r) => ({
      i: r.i, lastFrame: r.lastFrame, rdi: r.rdi, rdiFreed: r.rdiFreed,
      rdiFreeBt: r.rdiFreeBt, vidstabAllocs: r.vidstabAllocs,
    })),
    runs: all.map((r) => ({
      i: r.i, crash: r.crash, lastFrame: r.lastFrame, sha: r.sha,
      nAlloc: r.nAlloc, nFree: r.nFree, vidstabAllocs: r.vidstabAllocs,
      rdi: r.rdi, rdiFreed: r.rdiFreed,
    })),
  };
  writeFileEpermRetry(SUMMARYF, JSON.stringify(summary, null, 1));
  log(`\n== FREE-HUNT XONG: ${crashes.length}/${all.length} crash ==`);
  for (const c of crashes) log(`   💥 FT-r${c.i}: lastFrame=${c.lastFrame} RDI=${c.rdi} freed=${c.rdiFreed}`);
}

main();
