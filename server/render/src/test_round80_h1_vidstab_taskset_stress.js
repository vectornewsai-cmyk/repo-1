#!/usr/bin/env node
/**
 * test_round80_h1_vidstab_taskset_stress.js — Phase 9 đợt 80, luồng H1.
 *
 * Tái hiện crash vidstab MẠNH HƠN (nợ đợt 79 G3 §6 bước 1): pin ffmpeg +
 * hog lên đúng 2 core bằng `taskset -c 0-1` để mô phỏng lại VM 2 vCPU thời
 * D3/E3 (nơi NOCOPY 1080p crash 7/10 = 70% với setup F). G3/F3 trên VM
 * 4 vCPU EPYC 9D25 đều 0 crash trên control (F3 0/15, G3 0/15 gộp;
 * P(0/30 | p=0,70) ≈ 2×10⁻¹⁶) — giả thuyết mạnh nhất là timing
 * decode-vs-filter khác khi decoder và filter chạy trên core riêng.
 *
 * Setup F (giữ nguyên từ E3/F3/G3), CHỈ THÊM taskset:
 *   - LD_PRELOAD = free_track_v2d_preload.so : segv_backtrace_preload.so
 *     (binary .so của D3, không biên dịch lại)
 *   - showinfo cuối chuỗi filter, -v info, -threads 1
 *   - hog CPU PIN CÙNG 2 core với ffmpeg (env H1_HOG, mặc định 2 — 1/core)
 *   - ffmpeg chạy qua `taskset -c <H1_CORES> ffmpeg ...`
 *   - không chờ máy yên, xen kẽ nghiêm ngặt giữa các arm (mỗi vòng chạy
 *     1 lần mỗi arm, chung cửa sổ tải).
 *   - Khớp RDI→FREE theo KHOẢNG (addr <= RDI < addr+size).
 *   - CHỈ dùng ffmpeg stock Ubuntu 8.1.2.
 *
 * Chuỗi filter (trim 0:5 + setpts + ... + showinfo ở mọi arm):
 *   NOCOPY (control, giống hệt F3/G3):
 *     trim,setpts,vidstabtransform=input='<trf>':smoothing=10:optalgo=gauss,showinfo
 *   SPLIT (ứng viên, từ E3 §3.1 + showinfo trên nhánh [a]):
 *     trim,setpts,split[a][b];[a]vidstabtransform=...:...,showinfo;[b]nullsink
 *   COPY (đường production hiện tại, enhance.js:188 — `copy` ngay trước
 *     vidstabtransform, đợt 70 X8):
 *     trim,setpts,copy,vidstabtransform=...:...,showinfo
 *
 * 6 arm, n=10 mỗi arm (env H1_N):
 *   A1080NC stock 1080p NOCOPY (control, lặp lại F)
 *   B1080SP stock 1080p SPLIT  (ứng viên)
 *   C1080CP stock 1080p COPY   (production)
 *   D720NC  stock 720p  NOCOPY (control — endpoint sha có power)
 *   E720SP  stock 720p  SPLIT  (ứng viên)
 *   F720CP  stock 720p  COPY   (production)
 * 360p bỏ (endpoint sha đã bão hòa ở G3, tiết kiệm cửa sổ cron).
 *
 * Ground truth sha (E3/F3/G3): 1080p d960996868d3…, 720p 397ba4e1a870….
 * NOCOPY 720p cho sha khác nhau mỗi lần (B7: 10/10; F3: 15/15; G3: 10/10)
 * — sha không ổn định tự nó đã là tín hiệu race, đo được ngay cả trong
 * cửa sổ không có crash.
 *
 * GATE (bài học F3 §4, giữ như G3): chạy trước 5× NOCOPY 1080p dưới
 * taskset (H1_ARMS=A1080NC H1_N=5). Nếu control ≥1 crash → cửa sổ CÓ
 * power, chạy stress đầy đủ. Nếu 0/5 → vẫn chạy stress để đo sha +
 * xác nhận 0 crash, và ghi rõ thiếu power trong LIMITS (lần 3).
 * Các lần gate + smoke (SP/CP r1) nằm trong cùng WORK nên được tính vào
 * stress (cùng setup — hợp lệ, như G3 đã làm).
 *
 * Đo thêm (để biết taskset có tạo contention thật không — bài học G3 §2:
 * loadavg KHÔNG phải chỉ số power của hunt):
 *   - snapshot %CPU + core (ps) của từng hog sau gate và cuối stress,
 *     ghi vào WORK/hog-cpu-snapshots.txt;
 *   - thời gian chạy trung vị từng arm (so với G3: 1080p ~75–79 s,
 *     720p ~21 s — taskset + hog cùng core phải làm ffmpeg chậm lại
 *     nếu contention là thật);
 *   - nFreeLarge: số FREE size ≥ 1.000.000 trong free-track log mỗi lần
 *     (mô tả, KHÔNG claim là near-miss — xem LIMITS).
 *
 * Kết quả: results.jsonl + summary.json trong WORK
 * (mặc định ~/workspace/.scratch-r80h1/runs/). Chạy lại khôi phục từ
 * results.jsonl, không chạy lại lần đã có. KHÔNG dừng ở crash đầu.
 *
 * Cách chạy: node server/render/src/test_round80_h1_vidstab_taskset_stress.js
 * Env: H1_N=10 H1_HOG=2 H1_CORES=0-1 H1_WORK=... H1_ARMS=A1080NC,B1080SP,...
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync, spawn, execSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.H1_WORK || path.join(HOME, "workspace", ".scratch-r80h1", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const SRC720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.mp4";
const TRF720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.trf";
const FREE_SO = "/home/hatch/workspace/.scratch-r76d3/runs-v2b/free_track_v2d_preload.so";
const SEGV_SO = "/home/hatch/workspace/.scratch-r76d3/runs-v2b/segv_backtrace_preload.so";
const BOTH = `${FREE_SO}:${SEGV_SO}`;
const FFMPEG_STOCK = process.env.H1_FFMPEG_STOCK || "ffmpeg";
const CORES = process.env.H1_CORES || "0-1";
const N = parseInt(process.env.H1_N || "10", 10);
const N_HOG = parseInt(process.env.H1_HOG || "2", 10);
const LOGF = path.join(WORK, "results.jsonl");
const SUMMARYF = path.join(WORK, "summary.json");
const HOGSNAPF = path.join(WORK, "hog-cpu-snapshots.txt");

// Ground truth sha (12 ký tự đầu) — E3/F3/G3.
const GT_SPLIT = { "1080": "d960996868d3", "720": "397ba4e1a870" };

function vfNocopy(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}
function vfSplit(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,split[a][b];[a]vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo;[b]nullsink`;
}
function vfCopy(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}

const ALL_ARMS = [
  { key: "A1080NC", label: "stock 1080p NOCOPY", ffmpeg: FFMPEG_STOCK, src: SRC1080, trf: TRF1080, vf: vfNocopy(TRF1080), size: "1080" },
  { key: "B1080SP", label: "stock 1080p SPLIT ", ffmpeg: FFMPEG_STOCK, src: SRC1080, trf: TRF1080, vf: vfSplit(TRF1080), size: "1080" },
  { key: "C1080CP", label: "stock 1080p COPY  ", ffmpeg: FFMPEG_STOCK, src: SRC1080, trf: TRF1080, vf: vfCopy(TRF1080), size: "1080" },
  { key: "D720NC", label: "stock 720p  NOCOPY", ffmpeg: FFMPEG_STOCK, src: SRC720, trf: TRF720, vf: vfNocopy(TRF720), size: "720" },
  { key: "E720SP", label: "stock 720p  SPLIT ", ffmpeg: FFMPEG_STOCK, src: SRC720, trf: TRF720, vf: vfSplit(TRF720), size: "720" },
  { key: "F720CP", label: "stock 720p  COPY  ", ffmpeg: FFMPEG_STOCK, src: SRC720, trf: TRF720, vf: vfCopy(TRF720), size: "720" },
];
const WANT = (process.env.H1_ARMS || "").split(",").map((s) => s.trim()).filter(Boolean);
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
function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : +((s[m - 1] + s[m]) / 2).toFixed(1);
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
    // Hog PIN CÙNG core với ffmpeg — đây là điểm khác duy nhất của H1
    // so với G3 (hogs không pin, chỉ chạy ~6% CPU mỗi tiến trình).
    const h = spawn("taskset", ["-c", CORES, "yes"], { stdio: "ignore", detached: true });
    h.unref();
    hogs.push(h);
  }
  log(`   🔥 ${N_HOG} hog CPU đã chạy, pin cores=${CORES} (pid ${hogs.map((h) => h.pid).join(",")})`);
}
function stopHogs() {
  for (const h of hogs) { try { process.kill(-h.pid, "SIGKILL"); } catch { try { h.kill("SIGKILL"); } catch { /* đã chết */ } } }
  hogs = [];
}
process.on("exit", stopHogs);
process.on("SIGINT", () => { stopHogs(); process.exit(130); });
process.on("SIGTERM", () => { stopHogs(); process.exit(143); });

// Snapshot %CPU + core đang chạy của từng hog (ps) — bằng chứng taskset
// có tạo contention thật không. Ghi append vào hog-cpu-snapshots.txt.
function hogCpuSnapshot(tag) {
  const pids = hogs.map((h) => h.pid).join(",");
  let out = "(không đọc được ps)";
  try {
    out = execSync(`ps -o pid=,pcpu=,psr=,comm= -p ${pids}`, { encoding: "utf8", timeout: 10000 }).trim();
  } catch (e) { out = `(ps lỗi: ${e.message})`; }
  const line = `[${new Date().toISOString()}] ${tag} loadavg=${loadAvgStr()}\n${out}\n`;
  fs.appendFileSync(HOGSNAPF, line);
  log(`   📈 hog snapshot (${tag}):\n${out.split("\n").map((l) => "        " + l).join("\n")}`);
}

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
  // ffmpeg PIN cores=${CORES} qua taskset — điểm khác duy nhất của H1.
  const r = spawnSync("taskset", ["-c", CORES, arm.ffmpeg, ...args], {
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
    loadavg: loadAvgStr(), cores: CORES, crash: crashed,
    lastFrame: lastMatch(/\[Parsed_showinfo[^\]]*\] n:\s*(\d+)/g, stderr),
    rdi, fault, rdiFreed, rdiFreedDetail,
    nFree: ev.filter((e) => e.kind === "FREE").length,
    nAlloc: ev.filter((e) => e.kind.startsWith("ALLOC")).length,
    // Mô tả, KHÔNG claim là near-miss: số FREE buffer cỡ frame (≥1 MB).
    nFreeLarge: ev.filter((e) => e.kind === "FREE" && e.size >= 1000000).length,
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
      medianSecs: median(rs.map((r) => r.secs)),
      medianNFreeLarge: median(rs.map((r) => r.nFreeLarge)),
      crashLastFrames: crashes.map((r) => r.lastFrame),
      crashRdiFreed: crashes.map((r) => r.rdiFreed),
    };
  }
  const cmp = (x, y) => {
    const a = byArm[x], b = byArm[y];
    if (!a || !b) return null;
    const size = ARMS.find((v) => v.key === x).size;
    const aDiv = a.n - a.crashes - (a.shas[GT_SPLIT[size]] || 0);
    const bDiv = b.n - b.crashes - (b.shas[GT_SPLIT[size]] || 0);
    return {
      pair: `${x}-vs-${y}`,
      crash: `${x} ${a.crashes}/${a.n} vs ${y} ${b.crashes}/${b.n}`,
      fisherCrashTwoSided: fisher2(a.crashes, a.n - a.crashes, b.crashes, b.n - b.crashes),
      shaDivergent: `${x} ${aDiv}/${a.n - a.crashes} vs ${y} ${bDiv}/${b.n - b.crashes}`,
      fisherShaDivergentTwoSided: fisher2(aDiv, (a.n - a.crashes) - aDiv, bDiv, (b.n - b.crashes) - bDiv),
    };
  };
  return {
    done: true,
    method: "setup F (E3 §1.3 / F3 §3 / G3 §3) + taskset pin ffmpeg+hog tren cores H1_CORES (mac dinh 0-1): LD_PRELOAD free_track_v2d + segv_backtrace, showinfo + -v info, -threads 1, hog CPU pin cung core, xen ke tung vong giua cac arm, khong dung o crash dau; khop RDI->FREE theo khoang; chi dung ffmpeg stock 8.1.2",
    stockFfmpeg: FFMPEG_STOCK,
    cores: CORES,
    nPerArm: N, hogs: N_HOG, byArm,
    comparisons: [
      cmp("B1080SP", "A1080NC"), cmp("C1080CP", "A1080NC"), cmp("B1080SP", "C1080CP"),
      cmp("E720SP", "D720NC"), cmp("F720CP", "D720NC"), cmp("E720SP", "F720CP"),
    ].filter(Boolean),
    crashes: all.filter((r) => r.crash).map((r) => ({
      arm: r.arm, i: r.i, lastFrame: r.lastFrame, rdi: r.rdi, fault: r.fault,
      rdiFreed: r.rdiFreed, rdiFreedDetail: r.rdiFreedDetail, backtrace: r.backtrace,
    })),
    note: "Baseline lich su cung setup F (khong taskset): NOCOPY 1080p D3 v2d-load 7/16 = 43.8%, F3-E3 7/10 = 70%. F3 (cua so 06:35 10/11): NOCOPY 1080p 0/15. G3 (cua so 09:35 10/11): NOCOPY 1080p 0/15 gop, SP 0/30 NC 0/30. H1 hoi: taskset 2 core co khoi phuc duoc crash khong.",
  };
}

function main() {
  log(`== Đợt 80 H1 — stress vidstab dưới taskset (cores=${CORES}), NOCOPY vs SPLIT vs COPY ==`);
  log(`   WORK=${WORK} (n=${N}/arm, hog=${N_HOG} pin cores=${CORES}, arms=${ARMS.map((a) => a.key).join(",")})`);
  log(`   stock ffmpeg  : ${FFMPEG_STOCK}`);
  for (const p of [SRC1080, TRF1080, SRC720, TRF720, FREE_SO, SEGV_SO]) {
    if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
  // taskset phải tồn tại + cores hợp lệ (fail nhanh thay vì chạy 1 giờ mù).
  const chk = spawnSync("taskset", ["-c", CORES, "true"], { stdio: "ignore" });
  if (chk.status !== 0) { log(`   ❌ taskset -c ${CORES} không chạy được (status=${chk.status})`); process.exit(2); }
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
  // Cho hog lên tải ổn định rồi snapshot %CPU — bằng chứng contention thật.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000);
  hogCpuSnapshot("sau-khoi-dong-hog");
  for (let i = 1; i <= N; i++) {
    for (const arm of ARMS) {
      if (done.has(`${arm.key}:${i}`)) { log(`   ⏭️  ${arm.key}-r${i}: đã chạy từ lần trước — bỏ qua`); continue; }
      all.push(runOnce(arm, i));
      done.add(`${arm.key}:${i}`);
    }
  }
  hogCpuSnapshot("cuoi-stress");
  stopHogs();
  const summary = summarize(all);
  writeFileEpermRetry(SUMMARYF, JSON.stringify(summary, null, 1));
  log(`\n== H1 KẾT LUẬN ==`);
  for (const a of ARMS) {
    const b = summary.byArm[a.key];
    log(`   ${a.key} (${a.label}): ${b.crashes}/${b.n} crash Wilson95=${JSON.stringify(b.wilson95)} sha-khac-nhau=${b.shaDistinct} sha==GT ${b.gtSplitSha} median=${b.medianSecs}s`);
  }
  for (const c of summary.comparisons) {
    log(`   ${c.pair}: crash ${c.crash} — Fisher p=${c.fisherCrashTwoSided} | sha-lech ${c.shaDivergent} — Fisher p=${c.fisherShaDivergentTwoSided}`);
  }
  log(`== xong (WORK=${WORK}) ==`);
}

if (require.main === module) main();
module.exports = { };
