#!/usr/bin/env node
/**
 * test_round77_e3_vidstab_aifree.js — Phase 9 đợt 77, luồng E3.
 *
 * Đóng nợ đợt 76 §4.3 ("ai free" vidstab SEGFAULT — nợ lớn nhất): thử sửa
 * bằng CLI mà KHÔNG cần build ffmpeg riêng, rồi đo tỉ lệ crash so với
 * baseline 4/105 (B7 gộp) bằng stress xen kẽ (interleaved) dưới tải nhân
 * tạo — bài học D3 §7: so sánh tuần tự qua các cửa sổ tải khác nhau sẽ
 * nhầm hiệu ứng cửa sổ thành hiệu ứng config.
 *
 * Hướng sửa đã định (từ D3): giữ decoder context sống tới khi filter
 * graph xử lý xong frame cuối. Từ CLI KHÔNG can thiệp được vòng đời
 * decoder (xem docs/PHASE9_ROUND77_E3_VIDSTAB_AIFREE_FIX_LIMITS.md §2:
 * avcodec_free_context nằm ở cuối decoder_thread của ffmpeg CLI,
 * không có option nào hoãn nó tới sau khi filter drain). Vì vậy luồng
 * này thử ứng viên CLI duy nhất còn lại, nhắm đúng cơ chế D3:
 *
 *   SPLIT: `split[a][b];[a]vidstabtransform=...;[b]nullsink`
 *   split clone frame cho từng output và đẩy output 0 (transform) chạy
 *   đồng bộ TRƯỚC khi nhả frame gốc (split.c activate: av_frame_clone
 *   rồi ff_filter_frame từng output theo thứ tự, av_frame_free(&in) chỉ
 *   sau vòng lặp) — nên trong lúc transform xử lý, buffer còn ≥2 ref
 *   → av_frame_is_writable(in) == false → transform LUÔN đi nhánh
 *   non-direct (td->src = *src, output sang destbuf riêng), KHÔNG BAO
 *   GIỜ đi nhánh in-place copy vào td->src (dòng 150 transform.c) —
 *   chính nhánh đã ghi vào buffer decoder frame 147 đã bị free lúc
 *   drain (D3 §6). Nếu đúng, crash dạng (a)/(b) của D3 phải biến mất
 *   mà không cần filter `copy`.
 *
 * Các arm (1080p clip gốc + .trf X8; 720p/360p clip + .trf riêng — cùng
 * protocol B7; -threads 1; dưới 3 hog CPU để tạo cửa sổ crash-prone
 * như D3 v2d-load 7/16):
 *   A NOCOPY 1080p t1 ×15 — baseline (kỳ vọng crash > 0 dưới tải)
 *   B SPLIT  1080p t1 ×15 — ứng viên (kỳ vọng 0 crash nếu cơ chế đúng)
 *   C COPY   1080p t1 ×6  — control production (kỳ vọng 0 crash, sha
 *     khớp ground truth d960996868d3…)
 *   D SPLIT  720p t1 ×6 — kiểm tra SPLIT ở kích thước nhỏ
 *   E SPLIT  360p t1 ×6 — kiểm tra SPLIT ở kích thước nhỏ
 * A/B chạy XEN KẼ nghiêm ngặt (A1,B1,A2,B2,…) để chung cửa sổ tải;
 * C/D/E chạy xen kẽ nhau sau đó. KHÔNG chờ máy yên (tải là chủ đích).
 * Tổng 48 lần chạy. 0 crash cũng là kết quả thật.
 *
 * Cách chạy: node server/render/src/test_round77_e3_vidstab_aifree.js
 * Kết quả: results.jsonl + summary.json trong WORK (mặc định
 * ~/workspace/.scratch-r77e3/runs); stderr từng lần chạy lưu riêng
 * (chứa regs/maps khi crash, handler A2). Chạy lại sau khi bị kill
 * giữa chừng sẽ khôi phục từ results.jsonl. Hog CPU tự kill khi hết.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync, spawn } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.E3_WORK || path.join(HOME, "workspace", ".scratch-r77e3", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const SRC720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.mp4";
const TRF720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.trf";
const SRC360 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky360.mp4";
const TRF360 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky360.trf";
const PRELOAD_C = path.join(__dirname, "segv_backtrace_preload.c");
const PRELOAD_SO = path.join(WORK, "segv_backtrace_preload.so");

const GROUND_TRUTH_SHA_PREFIX = "d960996868d3"; // sha framemd5 COPY 1080p của Y6/X8
const N_A = parseInt(process.env.E3_N_A || "15", 10);
const N_B = parseInt(process.env.E3_N_B || "15", 10);
const N_C = parseInt(process.env.E3_N_C || "6", 10);
const N_D = parseInt(process.env.E3_N_D || "6", 10);
const N_E = parseInt(process.env.E3_N_E || "6", 10);
const N_HOG = parseInt(process.env.E3_HOG || "3", 10);

const LOGF = path.join(WORK, "results.jsonl");
const SUMMARYF = path.join(WORK, "summary.json");

function log(...a) { console.log(...a); }
function loadAvgStr() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
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

// 3 hog CPU (như D3 v2d-load): tạo cửa sổ crash-prone có kiểm soát.
// D3 §7: cửa sổ yên cho 0/52 crash, cửa sổ có tải cho 7/16 — không có
// tải thì hunt này gần như chắc chắn đo được 0/30 ở cả hai arm (vô ích).
let hogs = [];
function startHogs() {
  for (let i = 0; i < N_HOG; i++) {
    const h = spawn("yes", [], { stdio: "ignore", detached: true });
    h.unref();
    hogs.push(h);
  }
  log(`   🔥 ${N_HOG} hog CPU đã chạy (pid ${hogs.map((h) => h.pid).join(",")}) — tải chủ đích, xem D3 §7`);
}
function stopHogs() {
  for (const h of hogs) { try { process.kill(-h.pid, "SIGKILL"); } catch { try { h.kill("SIGKILL"); } catch { /* đã chết */ } } }
  hogs = [];
}
process.on("exit", stopHogs);
process.on("SIGINT", () => { stopHogs(); process.exit(130); });
process.on("SIGTERM", () => { stopHogs(); process.exit(143); });

function vfNocopy(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss`;
}
function vfCopy(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss`;
}
function vfSplit(trf) {
  // split[a][b]: [a] → transform (chạy đồng bộ trước, frame còn ≥2 ref
  // nên non-writable → nhánh non-direct), [b] → nullsink (chỉ giữ ref).
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,split[a][b];[a]vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss;[b]nullsink`;
}

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

// Wilson 95% — khoảng tin cậy cho tỉ lệ crash (n nhỏ, p gần 0).
function wilson(k, n) {
  if (n === 0) return [0, 0];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [+Math.max(0, (c - m) / d).toFixed(4), +Math.min(1, (c + m) / d).toFixed(4)];
}

function main() {
  log(`== Đợt 77 E3 — stress vidstab "ai free": NOCOPY vs SPLIT xen kẽ dưới tải ==`);
  log(`   WORK=${WORK} (A×${N_A} B×${N_B} C×${N_C} D×${N_D} E×${N_E}, hog=${N_HOG})`);
  for (const p of [SRC1080, TRF1080, SRC720, TRF720, SRC360, TRF360, PRELOAD_C]) {
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

  // Smoke: SPLIT ×1 + COPY ×1 dưới preload — cả hai sha phải khớp ground truth.
  let smokeSplit = null, smokeCopy = null;
  if (done.has("SMOKE_SPLIT:0") && done.has("SMOKE_COPY:0")) {
    log(`   📊 SMOKE đã có từ lần chạy trước — bỏ qua (xem results.jsonl)`);
    smokeSplit = { sha: GROUND_TRUTH_SHA_PREFIX };
    smokeCopy = { sha: GROUND_TRUTH_SHA_PREFIX };
  } else {
    startHogs();
    if (!done.has("SMOKE_SPLIT:0")) {
      smokeSplit = runOnce("SMOKE_SPLIT", 0, vfSplit(TRF1080), SRC1080, 1);
      done.add("SMOKE_SPLIT:0");
    } else { smokeSplit = { sha: GROUND_TRUTH_SHA_PREFIX }; }
    if (!done.has("SMOKE_COPY:0")) {
      smokeCopy = runOnce("SMOKE_COPY", 0, vfCopy(TRF1080), SRC1080, 1);
      done.add("SMOKE_COPY:0");
    } else { smokeCopy = { sha: GROUND_TRUTH_SHA_PREFIX }; }
  }
  if (smokeSplit.crash || !smokeSplit.sha || !smokeSplit.sha.startsWith(GROUND_TRUTH_SHA_PREFIX) ||
      smokeCopy.crash || !smokeCopy.sha || !smokeCopy.sha.startsWith(GROUND_TRUTH_SHA_PREFIX)) {
    log(`   ❌ SMOKE FAIL: SPLIT sha=${smokeSplit.sha} COPY sha=${smokeCopy.sha} (kỳ vọng ${GROUND_TRUTH_SHA_PREFIX}…) — DỪNG hunt`);
    writeFileEpermRetry(SUMMARYF, JSON.stringify({ done: false, reason: "smoke-fail", smokeSplit, smokeCopy }, null, 1));
    stopHogs();
    process.exit(2);
  }
  log(`   ✅ SMOKE OK: SPLIT sha=${smokeSplit.sha}… + COPY sha=${smokeCopy.sha}… đều khớp ground truth`);

  const arms = {
    A1080NOCOPY: { n: N_A, vf: vfNocopy(TRF1080), src: SRC1080, threads: 1 },
    B1080SPLIT: { n: N_B, vf: vfSplit(TRF1080), src: SRC1080, threads: 1 },
    C1080COPY: { n: N_C, vf: vfCopy(TRF1080), src: SRC1080, threads: 1 },
    D720SPLIT: { n: N_D, vf: vfSplit(TRF720), src: SRC720, threads: 1 },
    E360SPLIT: { n: N_E, vf: vfSplit(TRF360), src: SRC360, threads: 1 },
  };
  // Hàng đợi xen kẽ: A/B nghiêm ngặt từng cặp; sau đó C/D/E xoay vòng.
  const queue = [];
  for (let i = 1; i <= Math.max(N_A, N_B); i++) {
    if (i <= N_A) queue.push({ arm: "A1080NOCOPY", i });
    if (i <= N_B) queue.push({ arm: "B1080SPLIT", i });
  }
  const tail = [];
  for (let i = 1; i <= Math.max(N_C, N_D, N_E); i++) {
    if (i <= N_C) tail.push({ arm: "C1080COPY", i });
    if (i <= N_D) tail.push({ arm: "D720SPLIT", i });
    if (i <= N_E) tail.push({ arm: "E360SPLIT", i });
  }
  queue.push(...tail);

  const all = [];
  try {
    for (const line of fs.readFileSync(LOGF, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      if (!r.arm.startsWith("SMOKE")) all.push(r);
    }
  } catch { /* không có log cũ */ }
  // Loại record trùng (chạy lại sau kill có thể ghi đè logic done-set).
  const seen = new Set(all.map((r) => `${r.arm}:${r.i}`));

  for (const q of queue) {
    if (done.has(`${q.arm}:${q.i}`)) { log(`   ⏭️  ${q.arm}-r${q.i}: đã chạy từ lần trước — bỏ qua`); continue; }
    const a = arms[q.arm];
    const rec = runOnce(q.arm, q.i, a.vf, a.src, a.threads);
    if (!seen.has(`${q.arm}:${q.i}`)) { all.push(rec); seen.add(`${q.arm}:${q.i}`); }
    done.add(`${q.arm}:${q.i}`);
  }

  const byArm = {};
  for (const [arm, a] of Object.entries(arms)) {
    const rs = all.filter((r) => r.arm === arm);
    const cr = rs.filter((r) => r.crash);
    byArm[arm] = {
      runs: rs.length,
      crashes: cr.length,
      crashIdx: cr.map((r) => r.i),
      wilson95: wilson(cr.length, rs.length),
      shas: rs.filter((r) => !r.crash).reduce((m, r) => { m[r.sha] = (m[r.sha] || 0) + 1; return m; }, {}),
    };
  }
  const totalCrashes = all.filter((r) => r.crash).length;
  const summary = {
    done: true,
    method: "LD_PRELOAD segv_backtrace (handler A2), A/B xen ke nghiem ngat duoi 3 hog CPU (D3 §7), khong dung o crash dau",
    preloadSo: PRELOAD_SO,
    smoke: { splitSha: smokeSplit.sha, copySha: smokeCopy.sha, ok: true },
    totalRuns: all.length, totalCrashes,
    byArm,
    crashes: all.filter((r) => r.crash).map((r) => ({
      arm: r.arm, i: r.i, signal: r.signal, backtrace: r.backtrace,
    })),
    note: "Baseline so sanh: B7 gop 4/105 = 3.8% [1.5%, 9.4%] (khong tai nhan tao, cua so khac). Arm A o day chay DUOI TAI co dinh de co power phan biet SPLIT.",
  };
  writeFileEpermRetry(SUMMARYF, JSON.stringify(summary, null, 1));
  stopHogs();
  log(`\n== E3 STRESS KẾT LUẬN ==`);
  log(`   Tổng: ${totalCrashes}/${all.length} crash`);
  for (const arm of Object.keys(arms)) {
    log(`   ${arm}: ${byArm[arm].crashes}/${byArm[arm].runs} crash Wilson95=${JSON.stringify(byArm[arm].wilson95)} — sha: ${JSON.stringify(byArm[arm].shas)}`);
  }
  log(`== xong (WORK=${WORK}) ==`);
}

if (require.main === module) main();

module.exports = { vfNocopy, vfCopy, vfSplit, wilson, GROUND_TRUTH_SHA_PREFIX };
