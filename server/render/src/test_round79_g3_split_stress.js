#!/usr/bin/env node
/**
 * test_round79_g3_split_stress.js — Phase 9 đợt 79, luồng G3.
 *
 * Thử đường SPLIT (rẻ hơn NEEDS_WRITABLE: chỉ đổi chuỗi filter, không cần
 * build ffmpeg riêng) ĐÚNG setup F của đợt 77 E3 (nơi NOCOPY 1080p crash
 * 7/10 = 70%), so crash rate SPLIT vs NOCOPY control + so sha output.
 * Đóng nợ đợt 78 F3 §5: "thử SPLIT trước khi chọn NEEDS_WRITABLE".
 *
 * Setup F (giữ nguyên từ F3):
 *   - LD_PRELOAD = free_track_v2d_preload.so : segv_backtrace_preload.so
 *     (binary .so của D3, không biên dịch lại)
 *   - showinfo cuối chuỗi filter, -v info, -threads 1
 *   - 3 hog CPU (env G3_HOG), không chờ máy yên, xen kẽ nghiêm ngặt giữa
 *     các arm (mỗi vòng chạy 1 lần mỗi arm, chung cửa sổ tải).
 *   - Khớp RDI→FREE theo KHOẢNG (addr <= RDI < addr+size).
 *   - CHỈ dùng ffmpeg stock Ubuntu 8.1.2 — không dùng binary đã patch
 *     của F3 (luồng này KHÔNG build/không triển khai ffmpeg tự build).
 *
 * Chuỗi filter:
 *   NOCOPY (control, giống hệt F3): trim 0:5 + vidstabtransform
 *     (smoothing=10, optalgo=gauss) + showinfo.
 *   SPLIT (ứng viên, từ E3 §3.1 + showinfo trên nhánh [a] để giữ
 *     lastFrame đo được như control):
 *     trim,setpts,split[a][b];[a]vidstabtransform=...:...,showinfo;[b]nullsink
 *     (split clone frame cho từng output; output 0 chạy đồng bộ TRƯỚC
 *     khi nhả frame gốc → transform không bao giờ thấy buffer đã free).
 *
 * 6 arm, n=15 mỗi arm (env G3_N):
 *   A1080NC stock 1080p NOCOPY (control, lặp lại F)
 *   B1080SP stock 1080p SPLIT  (ứng viên)
 *   C720NC  stock 720p  NOCOPY (control)
 *   D720SP  stock 720p  SPLIT  (ứng viên)
 *   E360NC  stock 360p  NOCOPY (control)
 *   F360SP  stock 360p  SPLIT  (ứng viên)
 *
 * Ground truth sha (E3/F3): SPLIT 1080p d960996868d3…, SPLIT 720p
 * 397ba4e1a870…, SPLIT 360p 414e114fe57c…. NOCOPY 720p/360p cho sha khác
 * nhau mỗi lần (B7: 10/10; F3: 15/15) — sha không ổn định tự nó đã là
 * tín hiệu race, đo được ngay cả trong cửa sổ không có crash.
 *
 * GATE (bài học F3 §4): chạy trước 5× NOCOPY 1080p (G3_ARMS=A1080NC
 * G3_N=5). Nếu control 0/5 thì cửa sổ thiếu power cho endpoint crash —
 * đừng đốt 90 lần chạy: thử tăng hog (G3_HOG=8) rồi gate lại; nếu vẫn
 * 0/5 thì chạy stress rút gọn để đo sha + xác nhận 0 crash, và ghi rõ
 * thiếu power trong LIMITS.
 *
 * Kết quả: results.jsonl + summary.json trong WORK
 * (mặc định ~/workspace/.scratch-r79g3/runs/). Chạy lại khôi phục từ
 * results.jsonl, không chạy lại lần đã có. KHÔNG dừng ở crash đầu.
 *
 * Cách chạy: node server/render/src/test_round79_g3_split_stress.js
 * Env: G3_N=15 G3_HOG=3 G3_WORK=... G3_ARMS=A1080NC,B1080SP,... G3_GATE=1
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync, spawn } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.G3_WORK || path.join(HOME, "workspace", ".scratch-r79g3", "runs");
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
const FFMPEG_STOCK = process.env.G3_FFMPEG_STOCK || "ffmpeg";
const N = parseInt(process.env.G3_N || "15", 10);
const N_HOG = parseInt(process.env.G3_HOG || "3", 10);
const LOGF = path.join(WORK, "results.jsonl");
const SUMMARYF = path.join(WORK, "summary.json");

// Ground truth sha (12 ký tự đầu) cho SPLIT từng kích thước — E3/F3.
const GT_SPLIT = { "1080": "d960996868d3", "720": "397ba4e1a870", "360": "414e114fe57c" };

function vfNocopy(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}
function vfSplit(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,split[a][b];[a]vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo;[b]nullsink`;
}

const ALL_ARMS = [
  { key: "A1080NC", label: "stock 1080p NOCOPY", ffmpeg: FFMPEG_STOCK, src: SRC1080, trf: TRF1080, vf: vfNocopy(TRF1080), size: "1080" },
  { key: "B1080SP", label: "stock 1080p SPLIT ", ffmpeg: FFMPEG_STOCK, src: SRC1080, trf: TRF1080, vf: vfSplit(TRF1080), size: "1080" },
  { key: "C720NC", label: "stock 720p  NOCOPY", ffmpeg: FFMPEG_STOCK, src: SRC720, trf: TRF720, vf: vfNocopy(TRF720), size: "720" },
  { key: "D720SP", label: "stock 720p  SPLIT ", ffmpeg: FFMPEG_STOCK, src: SRC720, trf: TRF720, vf: vfSplit(TRF720), size: "720" },
  { key: "E360NC", label: "stock 360p  NOCOPY", ffmpeg: FFMPEG_STOCK, src: SRC360, trf: TRF360, vf: vfNocopy(TRF360), size: "360" },
  { key: "F360SP", label: "stock 360p  SPLIT ", ffmpeg: FFMPEG_STOCK, src: SRC360, trf: TRF360, vf: vfSplit(TRF360), size: "360" },
];
const WANT = (process.env.G3_ARMS || "").split(",").map((s) => s.trim()).filter(Boolean);
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
  const args = ["-threads", "1", "-v", "info", "-i", arm.src, "-vf", arm.vf, "-an", "-f", "framemd5", "-y", out];
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
  // Khớp theo KHOẢNG (F3 §3).
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

function summarize(all) {
  const byArm = {};
  for (const a of ARMS) {
    const rs = all.filter((r) => r.arm === a.key);
    const crashes = rs.filter((r) => r.crash);
    const shas = rs.filter((r) => !r.crash).reduce((m, r) => { m[r.sha] = (m[r.sha] || 0) + 1; return m; }, {});
    const gtCount = rs.filter((r) => !r.crash && r.sha === GT_SPLIT[a.size]).length;
    byArm[a.key] = {
      label: a.label, n: rs.length, crashes: crashes.length,
      wilson95: wilson(crashes.length, rs.length),
      shaDistinct: Object.keys(shas).length, shas,
      gtSplitSha: `${gtCount}/${rs.filter((r) => !r.crash).length}`,
      crashLastFrames: crashes.map((r) => r.lastFrame),
      crashRdiFreed: crashes.map((r) => r.rdiFreed),
    };
  }
  const cmp = (sp, nc) => {
    const a = byArm[sp], b = byArm[nc];
    if (!a || !b) return null;
    const aDiv = a.n - a.crashes - (a.shas[GT_SPLIT[ARMS.find((x) => x.key === sp).size]] || 0);
    const bDiv = b.n - b.crashes - (b.shas[GT_SPLIT[ARMS.find((x) => x.key === nc).size]] || 0);
    return {
      pair: `${sp}-vs-${nc}`,
      crash: `SP ${a.crashes}/${a.n} vs NC ${b.crashes}/${b.n}`,
      fisherCrashTwoSided: fisher2(a.crashes, a.n - a.crashes, b.crashes, b.n - b.crashes),
      shaDivergent: `SP ${aDiv}/${a.n - a.crashes} vs NC ${bDiv}/${b.n - b.crashes}`,
      fisherShaDivergentTwoSided: fisher2(aDiv, (a.n - a.crashes) - aDiv, bDiv, (b.n - b.crashes) - bDiv),
    };
  };
  return {
    done: true,
    method: "setup F (E3 §1.3 / F3 §3): LD_PRELOAD free_track_v2d + segv_backtrace, showinfo + -v info, -threads 1, hog CPU, xen ke tung vong giua cac arm, khong dung o crash dau; khop RDI->FREE theo khoang; chi dung ffmpeg stock 8.1.2",
    stockFfmpeg: FFMPEG_STOCK,
    nPerArm: N, hogs: N_HOG, byArm,
    comparisons: [cmp("B1080SP", "A1080NC"), cmp("D720SP", "C720NC"), cmp("F360SP", "E360NC")].filter(Boolean),
    crashes: all.filter((r) => r.crash).map((r) => ({
      arm: r.arm, i: r.i, lastFrame: r.lastFrame, rdi: r.rdi, fault: r.fault,
      rdiFreed: r.rdiFreed, rdiFreedDetail: r.rdiFreedDetail, backtrace: r.backtrace,
    })),
    note: "Baseline lich su cung setup F: NOCOPY 1080p D3 v2d-load 7/16 = 43.8%, F3-E3 7/10 = 70%. SPLIT 1080p (E3, setup segv-only, thieu power) 0/15. F3 (cung setup F, cua so 06:35 10/11): NOCOPY 1080p 0/15 — cua so thieu power.",
  };
}

function main() {
  log(`== Đợt 79 G3 — stress SPLIT vs NOCOPY, đúng setup F (stock only) ==`);
  log(`   WORK=${WORK} (n=${N}/arm, hog=${N_HOG}, arms=${ARMS.map((a) => a.key).join(",")})`);
  log(`   stock ffmpeg  : ${FFMPEG_STOCK}`);
  for (const p of [SRC1080, TRF1080, SRC720, TRF720, SRC360, TRF360, FREE_SO, SEGV_SO]) {
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
  const summary = summarize(all);
  writeFileEpermRetry(SUMMARYF, JSON.stringify(summary, null, 1));
  log(`\n== G3 KẾT LUẬN ==`);
  for (const a of ARMS) {
    const b = summary.byArm[a.key];
    log(`   ${a.key} (${a.label}): ${b.crashes}/${b.n} crash Wilson95=${JSON.stringify(b.wilson95)} sha-khac-nhau=${b.shaDistinct} sha==GT-SPLIT ${b.gtSplitSha}`);
  }
  for (const c of summary.comparisons) {
    log(`   ${c.pair}: crash ${c.crash} — Fisher p=${c.fisherCrashTwoSided} | sha-lech ${c.shaDivergent} — Fisher p=${c.fisherShaDivergentTwoSided}`);
  }
  log(`== xong (WORK=${WORK}) ==`);
}

if (require.main === module) main();
module.exports = { };
