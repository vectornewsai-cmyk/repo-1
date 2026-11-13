#!/usr/bin/env node
/**
 * test_round81_i1_vidstab_stronger_stress.js — Phase 9 đợt 81, luồng I1.
 *
 * Setup MẠNH HƠN để tái hiện crash vidstab (nợ đợt 80 H1 §6 / LIMITS
 * gộp §4.1): taskset đã thử xong ở H1 và KHÔNG khôi phục được crash
 * (0/60 — lần thứ 3 liên tiếp thiếu power cho endpoint crash: F3 0/90,
 * G3 0/60, H1 0/60; control 1080p gộp 0/40 vs E3-F 7/10). I1 đổi
 * ENDPOINT thay vì tăng tải/n (H1 §3.3 đã chứng minh tăng n không cứu
 * được: muốn 95% thấy ≥1 crash ở tỉ lệ thật 5% cần n≈59/arm, phân biệt
 * arm cần hàng trăm lần/arm — vượt cửa sổ cron 3 giờ):
 *
 *   1. ENDPOINT PER-FRAME (mới): thay vì sha cả file (1 bit/run), đếm
 *      số frame LỆCH khỏi GT từng frame (framemd5 per-frame md5 vs GT
 *      — xem test_round81_i1_analyze_h1_perframe.js). Hồi cứu H1: 720p
 *      NC lệch 815/1500 frame (54,3%, mỗi run trung vị 86, min 46)
 *      vs SP/CP 0/1500 — permutation per-run p=1,08×10⁻⁵ (đã ở sàn với
 *      n=10/arm). 1080p NC chỉ lệch 1/1500 frame — endpoint này KHÔNG
 *      có power ở 1080p (ghi nhận trung thực, không cố đo).
 *   2. INSTRUMENTATION POISON-QUARANTINE v2e (mới, H1 §6 bước 3):
 *      LD_PRELOAD = free_track_v2e_preload.so : segv_backtrace_preload.so.
 *      v2e poison 0xA5 + quarantine mọi chunk đã track khi free — nếu
 *      transform đọc lại buffer đã free, poison lan vào frame output
 *      và đo được qua (a) Y plane_checksum == checksum mặt phẳng toàn
 *      0xA5 (720p E7D0D7F0 / 1080p E609E5EB), (b) mean Y kéo về 165 +
 *      stdev Y sụp (showinfo). Phân biệt use-after-free (CÓ poison)
 *      với buffer-reuse khi còn live (KHÔNG poison — hồi cứu H1 cho
 *      ΔmeanY trung vị 0, tức frame lệch là frame hợp lệ khác).
 *      Smoke I1: CP 720p dưới v2e vẫn == GT (poison không làm hỏng run
 *      sạch); NC 720p lệch 91/150 frame, 0 chữ ký poison.
 *
 * Setup F giữ nguyên (E3/F3/G3/H1) + taskset pin ffmpeg+hog cores 0-1:
 *   - showinfo cuối chuỗi filter, -v info, -threads 1
 *   - hog CPU PIN CÙNG 2 core với ffmpeg (env I1_HOG, mặc định 2)
 *   - ffmpeg chạy qua `taskset -c <I1_CORES> ffmpeg ...`
 *   - không chờ máy yên, xen kẽ nghiêm ngặt giữa các arm (mỗi vòng chạy
 *     1 lần mỗi arm, chung cửa sổ tải).
 *   - Khớp RDI→FREE theo KHOẢNG (addr <= RDI < addr+size).
 *   - CHỈ dùng ffmpeg stock Ubuntu 8.1.2.
 *
 * Chuỗi filter (trim 0:5 + setpts + ... + showinfo ở mọi arm):
 *   NOCOPY (control, giống hệt F3/G3/H1):
 *     trim,setpts,vidstabtransform=input='<trf>':smoothing=10:optalgo=gauss,showinfo
 *   SPLIT (ứng viên, từ E3 §3.1 + showinfo trên nhánh [a]):
 *     trim,setpts,split[a][b];[a]vidstabtransform=...:...,showinfo;[b]nullsink
 *   COPY (đường production hiện tại, enhance.js:188 — `copy` ngay trước
 *     vidstabtransform, đợt 70 X8):
 *     trim,setpts,copy,vidstabtransform=...:...,showinfo
 *
 * 6 arm, n=10 mỗi arm (env I1_N):
 *   A1080NC stock 1080p NOCOPY (control — crash watch + whole-sha)
 *   B1080SP stock 1080p SPLIT  (ứng viên)
 *   C1080CP stock 1080p COPY   (production)
 *   D720NC  stock 720p  NOCOPY (control — endpoint per-frame + poison)
 *   E720SP  stock 720p  SPLIT  (ứng viên)
 *   F720CP  stock 720p  COPY   (production)
 * 360p bỏ (endpoint sha đã bão hòa ở G3, tiết kiệm cửa sổ cron).
 *
 * Ground truth sha (E3/F3/G3/H1): 1080p d960996868d3…, 720p 397ba4e1a870….
 * GT per-frame md5 lấy từ C1080CP/r1 + F720CP/r1 của H1 (đã verify mọi
 * lần CP/SP đều cho cùng md5 từng frame).
 *
 * GATE (giữ như H1): chạy trước 5× NOCOPY 1080p dưới taskset+v2e
 * (I1_ARMS=A1080NC I1_N=5). Nếu control ≥1 crash → cửa sổ CÓ power,
 * chạy stress đầy đủ. Nếu 0/5 → vẫn chạy stress để đo per-frame +
 * poison + xác nhận 0 crash. Các lần gate nằm trong cùng WORK nên được
 * tính vào stress (cùng setup — hợp lệ, như H1 đã làm).
 *
 * Đo thêm:
 *   - snapshot %CPU + core (ps) của từng hog sau gate và cuối stress,
 *     ghi vào WORK/hog-cpu-snapshots.txt;
 *   - thời gian chạy trung vị từng arm;
 *   - nFreeLarge: số FREE size ≥ 1.000.000 trong free-track log mỗi lần
 *     (mô tả, KHÔNG claim là near-miss);
 *   - quarantine stats v2e mỗi lần: quarantined / evicted /
 *     peakQuarantineBytes (dòng stats cuối log).
 * Phân tích per-frame + poison chạy SAU stress bằng
 * test_round81_i1_analyze_h1_perframe.js với I1_H1WORK=<WORK này>.
 *
 * Kết quả: results.jsonl + summary.json trong WORK
 * (mặc định ~/workspace/.scratch-r81i1/runs/). Chạy lại khôi phục từ
 * results.jsonl, không chạy lại lần đã có. KHÔNG dừng ở crash đầu.
 *
 * Cách chạy: node server/render/src/test_round81_i1_vidstab_stronger_stress.js
 * Env: I1_N=10 I1_HOG=2 I1_CORES=0-1 I1_WORK=... I1_ARMS=A1080NC,B1080SP,...
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync, spawn, execSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.I1_WORK || path.join(HOME, "workspace", ".scratch-r81i1", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const SRC720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.mp4";
const TRF720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.trf";
const FREE_SO = "/home/hatch/workspace/.scratch-r81i1/free_track_v2e_preload.so";
const SEGV_SO = "/home/hatch/workspace/.scratch-r76d3/runs-v2b/segv_backtrace_preload.so";
const BOTH = `${FREE_SO}:${SEGV_SO}`;
const FFMPEG_STOCK = process.env.I1_FFMPEG_STOCK || "ffmpeg";
const CORES = process.env.I1_CORES || "0-1";
const N = parseInt(process.env.I1_N || "10", 10);
const N_HOG = parseInt(process.env.I1_HOG || "2", 10);
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
const WANT = (process.env.I1_ARMS || "").split(",").map((s) => s.trim()).filter(Boolean);
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
    const m = line.match(/\[free_track_v2[de]\] seq=(\d+) (ALLOC-malloc|ALLOC-memalign|FREE) addr=(0x[0-9a-f]+) size=(\d+) tid=(\d+)/);
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
  const freeLog = path.join(WORK, `free-track-v2e-${arm.key}-r${idx}.log`);
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
  // I1: stats quarantine v2e (dòng cuối log) + số lần EVICT.
  const freeLogText = fs.existsSync(freeLog) ? fs.readFileSync(freeLog, "utf8") : "";
  const statsM = freeLogText.match(/\[free_track_v2e\] === stats quarantined=(\d+) evicted=(\d+) peakQuarantineBytes=(\d+) ===/);
  const nEvict = (freeLogText.match(/\[free_track_v2e\] EVICT/g) || []).length;
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
    // I1 (v2e): quarantine stats — null nếu log không có dòng stats
    // (preload không chạy / crash trước destructor).
    quarantined: statsM ? parseInt(statsM[1], 10) : null,
    evicted: statsM ? parseInt(statsM[2], 10) : null,
    peakQuarantineBytes: statsM ? parseInt(statsM[3], 10) : null,
    nEvict,
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
      // I1 (v2e): trung vị quarantine stats — null = log thiếu dòng stats.
      medianQuarantined: median(rs.map((r) => r.quarantined).filter((v) => v !== null)),
      medianEvicted: median(rs.map((r) => r.evicted).filter((v) => v !== null)),
      medianPeakQuarantineBytes: median(rs.map((r) => r.peakQuarantineBytes).filter((v) => v !== null)),
      runsMissingStats: rs.filter((r) => r.quarantined === null).length,
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
    method: "setup F (E3 §1.3 / F3 §3 / G3 §3) + taskset pin ffmpeg+hog tren cores I1_CORES (mac dinh 0-1): LD_PRELOAD free_track_v2e (poison-quarantine) + segv_backtrace, showinfo + -v info, -threads 1, hog CPU pin cung core, xen ke tung vong giua cac arm, khong dung o crash dau; khop RDI->FREE theo khoang; chi dung ffmpeg stock 8.1.2",
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
    note: "Baseline lich su cung setup F: NOCOPY 1080p D3 v2d-load 7/16 = 43.8%, E3-F 7/10 = 70%. F3 0/15, G3 0/15, H1 0/15 (taskset) — control 1080p gop 0/40. H1 hoi cuu per-frame: 720p NC lech 815/1500 frame vs SP/CP 0/1500; 1080p NC 1/1500. I1 hoi: poison co xuat hien trong frame lech khong.",
  };
}

function main() {
  log(`== Đợt 81 I1 — stress vidstab dưới taskset+v2e (cores=${CORES}), NOCOPY vs SPLIT vs COPY ==`);
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
  log(`\n== I1 KẾT LUẬN ==`);
  for (const a of ARMS) {
    const b = summary.byArm[a.key];
    log(`   ${a.key} (${a.label}): ${b.crashes}/${b.n} crash Wilson95=${JSON.stringify(b.wilson95)} sha-khac-nhau=${b.shaDistinct} sha==GT ${b.gtSplitSha} median=${b.medianSecs}s quarantine-trung-vi=${b.medianQuarantined} evicted=${b.medianEvicted} peakBytes=${b.medianPeakQuarantineBytes} (thieu-stats ${b.runsMissingStats}/${b.n})`);
  }
  for (const c of summary.comparisons) {
    log(`   ${c.pair}: crash ${c.crash} — Fisher p=${c.fisherCrashTwoSided} | sha-lech ${c.shaDivergent} — Fisher p=${c.fisherShaDivergentTwoSided}`);
  }
  log(`== xong (WORK=${WORK}) ==`);
}

if (require.main === module) main();
module.exports = { };
