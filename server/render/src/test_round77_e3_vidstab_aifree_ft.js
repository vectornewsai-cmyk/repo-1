#!/usr/bin/env node
/**
 * test_round77_e3_vidstab_aifree_ft.js — Phase 9 đợt 77, luồng E3.
 *
 * Thí nghiệm phụ F (chạy SAU hunt chính, cùng cửa sổ tải càng nhiều
 * càng tốt): tái hiện ĐÚNG setup săn crash của D3 v2d-load (7/16 crash)
 * để kiểm tra vì sao arm A của hunt chính (segv-only, không showinfo)
 * tới giờ vẫn 0 crash dù tải cao:
 *   - NOCOPY 1080p t1, `-v info`, `showinfo` cuối chuỗi filter
 *   - LD_PRELOAD = free_track_v2d_preload.so : segv_backtrace_preload.so
 *     (dùng đúng 2 binary .so D3 đã biên dịch tại
 *     ~/workspace/.scratch-r76d3/runs-v2b/ — không biên dịch lại)
 *   - 3 hog CPU riêng, không chờ máy yên.
 *
 * Nếu F crash nhiều trong khi A ≈ 0 → tỉ lệ crash nhạy với setup
 * (tracker malloc-hook + showinfo + -v info), không chỉ với tải — bài
 * học phương pháp cho các hunt sau, và SPLIT phải được thử lại đúng
 * setup D3 mới kết luận được. Nếu F cũng ≈ 0 → cửa sổ lần này yên
 * thật, không phân biệt được gì thêm.
 * N=10 (env E3_FT_N). Kết quả: results-ft.jsonl + summary-ft.json
 * trong WORK (mặc định ~/workspace/.scratch-r77e3/runs-ft/).
 * KHÔNG dừng ở crash đầu. Chạy lại sẽ khôi phục từ results-ft.jsonl.
 *
 * Cách chạy: node server/render/src/test_round77_e3_vidstab_aifree_ft.js
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync, spawn } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.E3_FT_WORK || path.join(HOME, "workspace", ".scratch-r77e3", "runs-ft");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const FREE_SO = "/home/hatch/workspace/.scratch-r76d3/runs-v2b/free_track_v2d_preload.so";
const SEGV_SO = "/home/hatch/workspace/.scratch-r76d3/runs-v2b/segv_backtrace_preload.so";
const BOTH = `${FREE_SO}:${SEGV_SO}`;
const GROUND_TRUTH_SHA_PREFIX = "d960996868d3";
const N_FT = parseInt(process.env.E3_FT_N || "10", 10);
const N_HOG = parseInt(process.env.E3_HOG || "3", 10);
const LOGF = path.join(WORK, "results-ft.jsonl");
const SUMMARYF = path.join(WORK, "summary-ft.json");

function log(...a) { console.log(...a); }
function loadAvgStr() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function sha256(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }
function record(rec) { fs.appendFileSync(LOGF, JSON.stringify(rec) + "\n"); }
function lastMatch(re, s) {
  let m = null, cur;
  re.lastIndex = 0;
  while ((cur = re.exec(s)) !== null) m = cur;
  return m ? parseInt(m[1], 10) : null;
}
function wilson(k, n) {
  if (n === 0) return [0, 0];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [+Math.max(0, (c - m) / d).toFixed(4), +Math.min(1, (c + m) / d).toFixed(4)];
}

let hogs = [];
function startHogs() {
  for (let i = 0; i < N_HOG; i++) {
    const h = spawn("yes", [], { stdio: "ignore", detached: true });
    h.unref();
    hogs.push(h);
  }
  log(`   🔥 ${N_HOG} hog CPU đã chạy (pid ${hogs.map((h) => h.pid).join(",")})`);
}
function stopHogs() {
  for (const h of hogs) { try { process.kill(-h.pid, "SIGKILL"); } catch { try { h.kill("SIGKILL"); } catch { /* đã chết */ } } }
  hogs = [];
}
process.on("exit", stopHogs);
process.on("SIGINT", () => { stopHogs(); process.exit(130); });
process.on("SIGTERM", () => { stopHogs(); process.exit(143); });

function parseFreeLog(text) {
  const events = [];
  for (const line of text.split("\n")) {
    const m = line.match(/\[free_track_v2d\] seq=(\d+) (ALLOC-malloc|ALLOC-memalign|FREE) addr=(0x[0-9a-f]+) size=(\d+) tid=(\d+)/);
    if (!m) continue;
    events.push({ seq: parseInt(m[1], 10), kind: m[2], addr: m[3], size: parseInt(m[4], 10), tid: m[5] });
  }
  return events;
}

function runOnce(idx) {
  const outDir = path.join(WORK, "FT");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `r${idx}.framemd5`);
  const errFile = path.join(outDir, `r${idx}.stderr`);
  const freeLog = path.join(WORK, `free-track-v2d-r${idx}.log`);
  try { fs.unlinkSync(freeLog); } catch { /* chưa có */ }
  const vf = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss,showinfo`;
  const args = ["-threads", "1", "-v", "info", "-i", SRC1080, "-vf", vf, "-an", "-f", "framemd5", "-y", out];
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
  const faultM = stderr.match(/fault addr=0x([0-9a-f]+)/);
  const rdi = regs ? `0x${regs[2]}` : null;
  const fault = faultM ? `0x${faultM[1]}` : null;
  const ev = parseFreeLog(fs.existsSync(freeLog) ? fs.readFileSync(freeLog, "utf8") : "");
  const rdiFreed = rdi ? ev.filter((e) => e.kind === "FREE" && e.addr === rdi) : [];
  const btLines = stderr.split("\n").filter((l) =>
    l.includes("[segv_backtrace]") || /\+0x[0-9a-f]+\)\[/.test(l));
  const rec = {
    arm: "FT", i: idx, status: r.status, signal: r.signal || null,
    error: r.error ? String(r.error) : null,
    size, sha: sha ? sha.slice(0, 12) : null, secs: +secs.toFixed(1),
    loadavg: loadAvgStr(), crash: crashed,
    lastFrame: lastMatch(/\[Parsed_showinfo[^\]]*\] n:\s*(\d+)/g, stderr),
    rdi, fault, rdiFreed: rdiFreed.length,
    nFree: ev.filter((e) => e.kind === "FREE").length,
    nAlloc: ev.filter((e) => e.kind.startsWith("ALLOC")).length,
    backtrace: crashed ? btLines : [],
  };
  if (crashed) {
    log(`   💥 FT-r${idx}: CRASH signal=${r.signal} lastFrame=${rec.lastFrame} fault=${fault} RDI=${rdi} RDI-freed-truoc-crash=${rdiFreed.length}`);
    for (const l of btLines.slice(0, 24)) log(`        ${l}`);
  } else {
    log(`   📊 FT-r${idx} (${secs.toFixed(1)}s): ok sha=${sha ? sha.slice(0, 12) : null}… lastFrame=${rec.lastFrame} load=${loadAvgStr()}`);
  }
  record(rec);
  return rec;
}

function main() {
  log(`== Đợt 77 E3 — thí nghiệm phụ F: NOCOPY đúng setup D3 v2d-load (tracker + showinfo) ==`);
  log(`   WORK=${WORK} (FT×${N_FT}, hog=${N_HOG})`);
  for (const p of [SRC1080, TRF1080, FREE_SO, SEGV_SO]) {
    if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
  log(`   📊 v2d .so: ${FREE_SO} (${fs.statSync(FREE_SO).size} byte, của D3 — không biên dịch lại)`);
  log(`   📊 segv .so: ${SEGV_SO} (${fs.statSync(SEGV_SO).size} byte, của D3 — không biên dịch lại)`);
  const done = new Set();
  try {
    for (const line of fs.readFileSync(LOGF, "utf8").split("\n")) {
      if (!line.trim()) continue;
      done.add(`FT:${JSON.parse(line).i}`);
    }
  } catch { /* chưa có log */ }
  if (done.size > 0) log(`   📊 khôi phục: ${done.size} lần chạy đã có — bỏ qua, không chạy lại`);
  startHogs();
  const all = [];
  try {
    for (const line of fs.readFileSync(LOGF, "utf8").split("\n")) {
      if (!line.trim()) continue;
      all.push(JSON.parse(line));
    }
  } catch { /* không có log cũ */ }
  for (let i = 1; i <= N_FT; i++) {
    if (done.has(`FT:${i}`)) { log(`   ⏭️  FT-r${i}: đã chạy từ lần trước — bỏ qua`); continue; }
    all.push(runOnce(i));
    done.add(`FT:${i}`);
  }
  const crashes = all.filter((r) => r.crash);
  const summary = {
    done: true,
    method: "LD_PRELOAD free_track_v2d (D3, silent-alloc) + segv_backtrace + showinfo + -v info, 3 hog CPU, khong cho may yen, khong dung o crash dau",
    totalRuns: all.length, totalCrashes: crashes.length,
    wilson95: wilson(crashes.length, all.length),
    shas: all.filter((r) => !r.crash).reduce((m, r) => { m[r.sha] = (m[r.sha] || 0) + 1; return m; }, {}),
    crashes: crashes.map((r) => ({ i: r.i, lastFrame: r.lastFrame, rdi: r.rdi, fault: r.fault, rdiFreed: r.rdiFreed, backtrace: r.backtrace })),
    note: "So sanh: hunt chinh arm A (segv-only, khong showinfo, -v error) cung cua so; D3 v2d-load 7/16 = 43.8% [23.1%, 66.8%]; B7 arm A (segv-only) 2/20 = 10%.",
  };
  writeFileEpermRetry(SUMMARYF, JSON.stringify(summary, null, 1));
  stopHogs();
  log(`\n== F KẾT LUẬN: ${crashes.length}/${all.length} crash Wilson95=${JSON.stringify(summary.wilson95)} — sha: ${JSON.stringify(summary.shas)} ==`);
  log(`== xong (WORK=${WORK}) ==`);
}

if (require.main === module) main();
module.exports = { };
