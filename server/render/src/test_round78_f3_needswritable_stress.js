#!/usr/bin/env node
/**
 * test_round78_f3_needswritable_stress.js — Phase 9 đợt 78, luồng F3.
 *
 * Stress NEEDS_WRITABLE (ffmpeg tự build, đã patch vf_vidstabtransform.c)
 * vs control NOCOPY (ffmpeg stock Ubuntu 8.1.2), ĐÚNG setup F của đợt 77 E3
 * (nơi NOCOPY 1080p crash 7/10 = 70%):
 *   - LD_PRELOAD = free_track_v2d_preload.so : segv_backtrace_preload.so
 *     (binary .so của D3, không biên dịch lại)
 *   - showinfo cuối chuỗi filter, -v info, -threads 1
 *   - 3 hog CPU, không chờ máy yên, xen kẽ nghiêm ngặt giữa các arm
 *     (mỗi vòng chạy 1 lần mỗi arm, chung cửa sổ tải).
 *   - Khớp RDI→FREE theo KHOẢNG (addr <= RDI < addr+size), sửa lỗi
 *     khớp chính xác của script F (E3 §1.3: r2 lệch +0x40).
 *
 * 6 arm, n=15 mỗi arm (env F3_N):
 *   A720NW  patched 720p NOCOPY   | B720NC  stock 720p NOCOPY (control)
 *   C360NW  patched 360p NOCOPY   | D360NC  stock 360p NOCOPY (control)
 *   E1080NW patched 1080p NOCOPY  | F1080NC stock 1080p NOCOPY (control, lặp lại F)
 * 720p/360p là arm bắt buộc theo task; 1080p là arm có power cao nhất
 * (baseline F 44–70%) để phân biệt thật — chạy cùng lượt nếu đủ giờ.
 *
 * Filter chain giống hệt F: trim 0:5 + vidstabtransform (smoothing=10,
 * optalgo=gauss, .trf riêng từng kích thước) + showinfo, output framemd5.
 * Ground truth sha (E3): 1080p d960996868d3…, SPLIT 720p 397ba4e1a870…,
 * SPLIT 360p 414e114fe57c…. NOCOPY 720p/360p ở B7 cho sha khác nhau mỗi
 * lần (10/10) — sha không ổn định tự nó đã là tín hiệu race.
 *
 * Kết quả: results.jsonl + summary.json trong WORK
 * (mặc định ~/workspace/.scratch-r78f3/runs/). Chạy lại khôi phục từ
 * results.jsonl, không chạy lại lần đã có. KHÔNG dừng ở crash đầu.
 *
 * Cách chạy: node server/render/src/test_round78_f3_needswritable_stress.js
 * Env: F3_N=15 F3_HOG=3 F3_WORK=... F3_ARMS=A720NW,B720NC,... (mặc định đủ 6)
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync, spawn } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.F3_WORK || path.join(HOME, "workspace", ".scratch-r78f3", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const SRC720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.mp4";
const TRF720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.trf";
const SRC360 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky360.mp4";
const TRF360 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky360.trf";
const FREE_SO = "/home/hatch/workspace/.scratch-r76d3/runs-v2b/free_track_v2d_preload.so";
const SEGV_SO = "/home/hatch/workspace/.scratch-r76d3/runs-v2b/segv_backtrace_preload.so";
const BOTH = `${FREE_SO}:${SEGV_SO}`;
const FFMPEG_NW = process.env.F3_FFMPEG_NW || path.join(HOME, "workspace", ".scratch-r78f3", "ffmpeg-nw-install", "bin", "ffmpeg");
const FFMPEG_STOCK = process.env.F3_FFMPEG_STOCK || "ffmpeg";
const N = parseInt(process.env.F3_N || "15", 10);
const N_HOG = parseInt(process.env.F3_HOG || "3", 10);
const LOGF = path.join(WORK, "results.jsonl");
const SUMMARYF = path.join(WORK, "summary.json");

const ALL_ARMS = [
  { key: "A720NW", label: "patched 720p NOCOPY", ffmpeg: FFMPEG_NW, src: SRC720, trf: TRF720 },
  { key: "B720NC", label: "stock   720p NOCOPY", ffmpeg: FFMPEG_STOCK, src: SRC720, trf: TRF720 },
  { key: "C360NW", label: "patched 360p NOCOPY", ffmpeg: FFMPEG_NW, src: SRC360, trf: TRF360 },
  { key: "D360NC", label: "stock   360p NOCOPY", ffmpeg: FFMPEG_STOCK, src: SRC360, trf: TRF360 },
  { key: "E1080NW", label: "patched 1080p NOCOPY", ffmpeg: FFMPEG_NW, src: SRC1080, trf: TRF1080 },
  { key: "F1080NC", label: "stock   1080p NOCOPY", ffmpeg: FFMPEG_STOCK, src: SRC1080, trf: TRF1080 },
];
const WANT = (process.env.F3_ARMS || "").split(",").map((s) => s.trim()).filter(Boolean);
const ARMS = WANT.length ? ALL_ARMS.filter((a) => WANT.includes(a.key)) : ALL_ARMS;

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
// Fisher exact (two-sided) cho bảng 2x2 [[a,b],[c,d]] qua log-combination.
function logComb(n, k) {
  if (k < 0 || k > n) return -Infinity;
  k = Math.min(k, n - k);
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}
function fisher2(a, b, c, d) {
  const n = a + b + c + d;
  const logP0 = logComb(a + b, a) + logComb(c + d, c) - logComb(n, a + c);
  let p = 0;
  const lo = Math.max(0, (a + c) - (c + d)), hi = Math.min(a + b, a + c);
  for (let x = lo; x <= hi; x++) {
    const lp = logComb(a + b, x) + logComb(c + d, a + c - x) - logComb(n, a + c);
    if (lp <= logP0 + 1e-12) p += Math.exp(lp);
  }
  return +Math.min(1, p).toFixed(4);
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

function runOnce(arm, idx) {
  const outDir = path.join(WORK, arm.key);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `r${idx}.framemd5`);
  const errFile = path.join(outDir, `r${idx}.stderr`);
  const freeLog = path.join(WORK, `free-track-v2d-${arm.key}-r${idx}.log`);
  try { fs.unlinkSync(freeLog); } catch { /* chưa có */ }
  const vf = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${arm.trf}':smoothing=10:optalgo=gauss,showinfo`;
  const args = ["-threads", "1", "-v", "info", "-i", arm.src, "-vf", vf, "-an", "-f", "framemd5", "-y", out];
  const t0 = Date.now();
  const r = spawnSync(arm.ffmpeg, args, {
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
  // Khớp theo KHOẢNG (sửa lỗi khớp chính xác của script F — E3 §1.3).
  let rdiFreed = 0, rdiFreedDetail = null;
  if (rdi) {
    const v = BigInt(rdi);
    for (const e of ev) {
      if (e.kind !== "FREE") continue;
      const a = BigInt(e.addr);
      if (a <= v && v < a + BigInt(e.size)) {
        rdiFreed++;
        if (!rdiFreedDetail) rdiFreedDetail = { seq: e.seq, addr: e.addr, size: e.size, off: Number(v - a), tid: e.tid };
      }
    }
  }
  const btLines = stderr.split("\n").filter((l) =>
    l.includes("[segv_backtrace]") || /\+0x[0-9a-f]+\)\[/.test(l));
  const rec = {
    arm: arm.key, i: idx, status: r.status, signal: r.signal || null,
    error: r.error ? String(r.error) : null,
    size, sha: sha ? sha.slice(0, 12) : null, secs: +secs.toFixed(1),
    loadavg: loadAvgStr(), crash: crashed,
    lastFrame: lastMatch(/\[Parsed_showinfo[^\]]*\] n:\s*(\d+)/g, stderr),
    rdi, fault, rdiFreed, rdiFreedDetail,
    nFree: ev.filter((e) => e.kind === "FREE").length,
    nAlloc: ev.filter((e) => e.kind.startsWith("ALLOC")).length,
    backtrace: crashed ? btLines : [],
  };
  if (crashed) {
    log(`   💥 ${arm.key}-r${idx}: CRASH signal=${r.signal} lastFrame=${rec.lastFrame} fault=${fault} RDI=${rdi} RDI-freed(range)=${rdiFreed}`);
    for (const l of btLines.slice(0, 24)) log(`        ${l}`);
  } else {
    log(`   📊 ${arm.key}-r${idx} (${secs.toFixed(1)}s): ok sha=${sha ? sha.slice(0, 12) : null}… lastFrame=${rec.lastFrame} load=${loadAvgStr()}`);
  }
  record(rec);
  return rec;
}

function main() {
  log(`== Đợt 78 F3 — stress NEEDS_WRITABLE vs NOCOPY, đúng setup F ==`);
  log(`   WORK=${WORK} (n=${N}/arm, hog=${N_HOG}, arms=${ARMS.map((a) => a.key).join(",")})`);
  log(`   patched ffmpeg: ${FFMPEG_NW}`);
  log(`   stock ffmpeg  : ${FFMPEG_STOCK}`);
  for (const p of [SRC1080, TRF1080, SRC720, TRF720, SRC360, TRF360, FREE_SO, SEGV_SO, FFMPEG_NW]) {
    if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
  const done = new Set();
  const all = [];
  try {
    for (const line of fs.readFileSync(LOGF, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const rec = JSON.parse(line);
      done.add(`${rec.arm}:${rec.i}`);
      all.push(rec);
    }
  } catch { /* chưa có log */ }
  if (done.size > 0) log(`   📊 khôi phục: ${done.size} lần chạy đã có — bỏ qua, không chạy lại`);
  startHogs();
  for (let i = 1; i <= N; i++) {
    for (const arm of ARMS) {
      if (done.has(`${arm.key}:${i}`)) { log(`   ⏭️  ${arm.key}-r${i}: đã chạy từ lần trước — bỏ qua`); continue; }
      all.push(runOnce(arm, i));
      done.add(`${arm.key}:${i}`);
    }
  }
  stopHogs();
  const byArm = {};
  for (const a of ARMS) {
    const rs = all.filter((r) => r.arm === a.key);
    const crashes = rs.filter((r) => r.crash);
    const shas = rs.filter((r) => !r.crash).reduce((m, r) => { m[r.sha] = (m[r.sha] || 0) + 1; return m; }, {});
    byArm[a.key] = {
      label: a.label, n: rs.length, crashes: crashes.length,
      wilson95: wilson(crashes.length, rs.length),
      shaDistinct: Object.keys(shas).length, shas,
      crashLastFrames: crashes.map((r) => r.lastFrame),
      crashRdiFreed: crashes.map((r) => r.rdiFreed),
    };
  }
  const cmp = (nw, nc) => {
    const a = byArm[nw], b = byArm[nc];
    if (!a || !b) return null;
    return {
      pair: `${nw}-vs-${nc}`,
      nw: `${a.crashes}/${a.n}`, nc: `${b.crashes}/${b.n}`,
      fisherTwoSided: fisher2(a.crashes, a.n - a.crashes, b.crashes, b.n - b.crashes),
    };
  };
  const summary = {
    done: true,
    method: "setup F (E3 §1.3): LD_PRELOAD free_track_v2d + segv_backtrace, showinfo + -v info, -threads 1, 3 hog CPU, xen ke tung vong giua cac arm, khong dung o crash dau; khop RDI->FREE theo khoang",
    patchedFfmpeg: FFMPEG_NW, stockFfmpeg: FFMPEG_STOCK,
    nPerArm: N, byArm,
    comparisons: [cmp("A720NW", "B720NC"), cmp("C360NW", "D360NC"), cmp("E1080NW", "F1080NC")].filter(Boolean),
    crashes: all.filter((r) => r.crash).map((r) => ({
      arm: r.arm, i: r.i, lastFrame: r.lastFrame, rdi: r.rdi, fault: r.fault,
      rdiFreed: r.rdiFreed, rdiFreedDetail: r.rdiFreedDetail, backtrace: r.backtrace,
    })),
    note: "Baseline lich su cung setup F: NOCOPY 1080p D3 v2d-load 7/16 = 43.8%, F3-E3 7/10 = 70%. SPLIT 1080p (E3, setup segv-only, thieu power) 0/15.",
  };
  writeFileEpermRetry(SUMMARYF, JSON.stringify(summary, null, 1));
  log(`\n== F3 KẾT LUẬN ==`);
  for (const a of ARMS) {
    const b = byArm[a.key];
    log(`   ${a.key} (${a.label}): ${b.crashes}/${b.n} crash Wilson95=${JSON.stringify(b.wilson95)} sha-khac-nhau=${b.shaDistinct}`);
  }
  for (const c of summary.comparisons) log(`   ${c.pair}: NW ${c.nw} vs NC ${c.nc} — Fisher p=${c.fisherTwoSided}`);
  log(`== xong (WORK=${WORK}) ==`);
}

if (require.main === module) main();
module.exports = { };
