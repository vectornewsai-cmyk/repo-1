#!/usr/bin/env node
/**
 * test_round71_y6_vidstab_segfault.js — Phase 9 đợt 71, luồng Y6:
 * đóng nợ đợt 70 §4 mục 9 — SEGFAULT vidstab cần ~60 lần chạy + stack trace.
 *
 * Bối cảnh: X8 (đợt 70) chèn `copy` trước vidstabtransform (production).
 * Crash không copy: pha E 1/20 (5%, -threads 1, 1080p 5s) + 2 lần ở C0/C0retry
 * (threads mặc định) → 3/29 trong đợt 70. Có copy: 0/18 (n quá nhỏ để claim).
 * X8 tính: nếu tỉ lệ thật là 5% thì P(0/18) ≈ 40% — hoàn toàn có thể là may mắn.
 *
 * Thí nghiệm này (đúng cấu hình pha E của X8, cùng clip + cùng .trf):
 *   - Nhánh COPY   (production: -threads 1 + `copy` trước vidstabtransform): ×60
 *   - Nhánh NOCOPY (đối chứng: -threads 1, không copy — đúng pha E):          ×30
 *   - Xen kẽ theo batch 10 COPY + 5 NOCOPY (6 batch) để triệt tiêu trôi tải nền.
 *   - Mỗi lần chạy: transform→framemd5, ghi status/signal/size/sha/secs/loadavg.
 *   - Crash: core dump BỊ CHẶN ở tầng container (RLIMIT_CORE hard = 0, root
 *     cũng không nâng được — "Operation not permitted"; libSegFault và
 *     systemd-coredump đều không có) nên KHÔNG lấy core được. Thay vào đó,
 *     pha G chạy riêng nhánh NOCOPY dưới gdb (gdb 15.1 đã cài qua apt) cho
 *     tới khi bắt được 1 crash kèm backtrace (tối đa 30 lần) — gdb làm chậm
 *     tiến trình nên pha G tách riêng, không trộn vào tỉ lệ của 90 lần chính.
 *
 * Cách chạy: node server/render/src/test_round71_y6_vidstab_segfault.js
 * Kết quả: results.jsonl + summary.json trong WORK (ghi append từng lần chạy).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.Y6_WORK || path.join(HOME, "workspace", ".scratch-r71y6", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
// DÙNG LẠI đúng .trf của X8 (pha C/E) để so sánh được với 1/20 của pha E.
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";

const VF_BASE = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
const VF_COPY = `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;

const N_COPY = 60, N_NOCOPY = 30, BATCH_COPY = 10, BATCH_NOCOPY = 5;
const LOAD_LIMIT = 5.0; // 1-min loadavg: trên ngưỡng này thì chờ máy yên trước batch

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
function freeMem() {
  try {
    const m = fs.readFileSync("/proc/meminfo", "utf8").match(/MemAvailable:\s+(\d+)/);
    return m ? `${Math.round(+m[1] / 1024)} MB avail` : "?";
  } catch { return "?"; }
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

// Chạy 1 lần ffmpeg (native, không gdb — so được với pha E của X8).
// Core dump bị chặn ở tầng container nên hasCore luôn false; stack trace
// lấy riêng ở pha G (chạy dưới gdb).
function runOnce(arm, idx) {
  const tag = arm === "COPY" ? "C" : "N";
  const runDir = path.join(WORK, "cores", `${tag}${idx}`);
  fs.mkdirSync(runDir, { recursive: true });
  const outDir = path.join(WORK, arm);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `r${idx}.framemd5`);
  const errFile = path.join(outDir, `r${idx}.stderr`);
  const vf = arm === "COPY" ? VF_COPY : VF_BASE;
  const args = ["-threads", "1", "-v", "error", "-i", SRC1080, "-vf", vf, "-an", "-f", "framemd5", "-y", out];
  const t0 = Date.now();
  const r = spawnSync("ffmpeg", args, {
    cwd: runDir, stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
  });
  const secs = (Date.now() - t0) / 1000;
  const stderr = (r.stderr || "").toString();
  writeFileEpermRetry(errFile, stderr);
  const exists = fs.existsSync(out);
  const size = exists ? fs.statSync(out).size : 0;
  const sha = exists && size > 0 ? sha256(out) : null;
  const crashed = r.status !== 0 || r.signal !== null || size === 0;
  const rec = {
    arm, i: idx, status: r.status, signal: r.signal || null,
    error: r.error ? String(r.error) : null,
    size, sha: sha ? sha.slice(0, 12) : null, secs: +secs.toFixed(1),
    loadavg: loadAvgStr(), hasCore: false, corePath: null,
    stderrTail: stderr.slice(-300),
  };
  if (crashed) {
    rec.crash = true;
    // Core dump bị chặn (RLIMIT_CORE hard=0, không nâng được) → không có core.
    log(`   💥 ${arm}-r${idx}: CRASH signal=${r.signal} status=${r.status} — KHÔNG CÓ CORE (container chặn RLIMIT_CORE=0; stack trace lấy riêng ở pha G)`);
    // Thử đọc dmesg (thường VM cấm — ghi rõ lấy được hay không).
    try {
      const d = spawnSync("dmesg", ["--time-format=iso", "-T"], { stdio: ["ignore", "pipe", "pipe"], timeout: 15000 });
      const tail = (d.stdout || "").toString().split("\n").filter((l) => /ffmpeg|segfault/i.test(l)).slice(-5);
      rec.dmesgTail = tail;
      if (tail.length) for (const l of tail) log(`        dmesg: ${l}`);
    } catch { rec.dmesgTail = []; }
  } else {
    log(`   📊 ${arm}-r${idx} (${secs.toFixed(1)}s): ok sha=${sha.slice(0, 12)}… load=${loadAvgStr()}`);
  }
  record(rec);
  return rec;
}

// Pha G: săn stack trace — chạy NOCOPY dưới gdb tới khi bắt được 1 crash
// kèm backtrace (tối đa 30 lần). gdb làm chậm tiến trình nên tách riêng,
// không trộn vào tỉ lệ của 90 lần chính.
function gdbHunt(maxRuns = 30) {
  log(`\n== G. săn stack trace: NOCOPY dưới gdb, tối đa ${maxRuns} lần (dừng khi bắt được 1 crash có bt) ==`);
  const recs = [];
  for (let i = 1; i <= maxRuns; i++) {
    waitForQuiet(`G-r${i}`);
    const runDir = path.join(WORK, "gdb-hunt", `r${i}`);
    fs.mkdirSync(runDir, { recursive: true });
    const out = path.join(runDir, `r${i}.framemd5`);
    const t0 = Date.now();
    const g = spawnSync("gdb", ["-batch",
      "-ex", "set pagination off",
      "-ex", "set debuginfod enabled on",
      "-ex", "run",
      "-ex", "bt",
      "-ex", "info registers rip rsp",
      "-ex", "thread apply all bt",
      "-ex", "kill",
      "--args", "ffmpeg", "-threads", "1", "-v", "error", "-i", SRC1080,
      "-vf", VF_BASE, "-an", "-f", "framemd5", "-y", out],
      { cwd: runDir, stdio: ["ignore", "pipe", "pipe"], timeout: 900000 });
    const secs = (Date.now() - t0) / 1000;
    const outText = (g.stdout || "").toString() + (g.stderr || "").toString();
    writeFileEpermRetry(path.join(runDir, "gdb.log"), outText);
    const size = fs.existsSync(out) ? fs.statSync(out).size : 0;
    const crashed = /SIGSEGV|Segmentation fault/.test(outText) || size === 0;
    const frames = outText.split("\n").filter((l) => /^#\d+\s/.test(l));
    const rec = { arm: "GDB-HUNT", i, secs: +secs.toFixed(1), size,
      crashed, gdbStatus: g.status, btFrames: frames.slice(0, 12) };
    record(rec);
    recs.push(rec);
    if (crashed) {
      log(`   💥 G-r${i} (${secs.toFixed(1)}s): CRASH DƯỚI GDB — backtrace:`);
      for (const l of frames.slice(0, 12)) log(`        ${l}`);
      return { runs: recs, caught: rec };
    }
    log(`   📊 G-r${i} (${secs.toFixed(1)}s): ok (không crash), size=${size}`);
  }
  log(`   📊 G: hết ${maxRuns} lần, KHÔNG bắt được crash nào dưới gdb`);
  return { runs: recs, caught: null };
}

// Wilson 95% CI cho tỉ lệ p = k/n.
function wilson(k, n, z = 1.96) {
  if (n === 0) return [0, 1];
  const p = k / n, d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}

function main() {
  log(`== Đợt 71 Y6 — SEGFAULT vidstab: COPY ×${N_COPY} vs NOCOPY ×${N_NOCOPY} (loadavg: ${loadAvgStr()}, ${freeMem()}) ==`);
  log(`   WORK=${WORK}`);
  for (const p of [SRC1080, TRF1080]) {
    if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
  log(`   📊 SRC1080 sha=${sha256(SRC1080).slice(0, 12)}… (kỳ vọng 5cf533f5bcd9…)`);
  log(`   📊 TRF1080 (X8) sha=${sha256(TRF1080).slice(0, 12)}…`);
  const g = spawnSync("gdb", ["--version"], { stdio: ["ignore", "pipe", "pipe"] });
  log(`   📊 gdb: ${g.status === 0 ? (g.stdout || "").toString().split("\n")[0] : "KHÔNG CÓ — không lấy được stack trace từ core"}`);
  log(`   📊 core dump: BỊ CHẶN (RLIMIT_CORE hard=0, root không nâng được; core_pattern=${fs.readFileSync("/proc/sys/kernel/core_pattern", "utf8").trim()}) — stack trace lấy riêng ở pha G`);

  const stats = {
    COPY: { runs: [], crashes: 0, ok: 0, shas: {} },
    NOCOPY: { runs: [], crashes: 0, ok: 0, shas: {} },
  };
  let ci = 0, ni = 0, batch = 0;
  while (ci < N_COPY || ni < N_NOCOPY) {
    batch++;
    waitForQuiet(`batch ${batch}`);
    const bc = Math.min(BATCH_COPY, N_COPY - ci);
    const bn = Math.min(BATCH_NOCOPY, N_NOCOPY - ni);
    log(`\n== batch ${batch}: COPY ×${bc} + NOCOPY ×${bn} (loadavg: ${loadAvgStr()}, ${freeMem()}) ==`);
    for (let j = 0; j < bc; j++) {
      ci++;
      const r = runOnce("COPY", ci);
      stats.COPY.runs.push(r);
      if (r.crash) stats.COPY.crashes++; else { stats.COPY.ok++; stats.COPY.shas[r.sha] = (stats.COPY.shas[r.sha] || 0) + 1; }
    }
    for (let j = 0; j < bn; j++) {
      ni++;
      const r = runOnce("NOCOPY", ni);
      stats.NOCOPY.runs.push(r);
      if (r.crash) stats.NOCOPY.crashes++; else { stats.NOCOPY.ok++; stats.NOCOPY.shas[r.sha] = (stats.NOCOPY.shas[r.sha] || 0) + 1; }
    }
    log(`   📊 sau batch ${batch}: COPY ${stats.COPY.crashes}/${ci} crash | NOCOPY ${stats.NOCOPY.crashes}/${ni} crash`);
    writeFileEpermRetry(SUMMARYF, JSON.stringify({ partial: true, batch, stats }, null, 1));
  }

  const kc = stats.COPY.crashes, nc = N_COPY, kn = stats.NOCOPY.crashes, nn = N_NOCOPY;
  const wC = wilson(kc, nc), wN = wilson(kn, nn);
  // P(0 crash / 60 lần | tỉ lệ thật = p): p=5% (pha E), p=12.5% (gộp đợt 70), p=2.5% (nửa pha E).
  const p0 = (p, n) => Math.pow(1 - p, n);
  // Pha G: săn stack trace dưới gdb (tách riêng, không trộn vào tỉ lệ chính).
  const hunt = gdbHunt(30);
  const summary = {
    done: true, loadavgEnd: loadAvgStr(), freeMemEnd: freeMem(),
    COPY: { crashes: kc, n: nc, rate: kc / nc, wilson95: wC.map((x) => +x.toFixed(4)), ok: stats.COPY.ok, shas: stats.COPY.shas },
    NOCOPY: { crashes: kn, n: nn, rate: kn / nn, wilson95: wN.map((x) => +x.toFixed(4)), ok: stats.NOCOPY.ok, shas: stats.NOCOPY.shas },
    pZeroIfTrueRate: {
      "p=0.05 (pha E)": +p0(0.05, nc).toFixed(4),
      "p=0.125 (gop dot 70: 4/32)": +p0(0.125, nc).toFixed(4),
      "p=0.025": +p0(0.025, nc).toFixed(4),
    },
    gdbHunt: { runs: hunt.runs.length, caught: hunt.caught ? { i: hunt.caught.i, btFrames: hunt.caught.btFrames } : null },
    stackTraces: [...stats.COPY.runs, ...stats.NOCOPY.runs]
      .filter((r) => r.crash).map((r) => ({ arm: r.arm, i: r.i, signal: r.signal, hasCore: false, note: "core dump bi chan (RLIMIT_CORE hard=0); xem pha G" })),
  };
  writeFileEpermRetry(SUMMARYF, JSON.stringify(summary, null, 1));
  log(`\n== Y6 KẾT LUẬN ==`);
  log(`   COPY   : ${kc}/${nc} crash (${(kc / nc * 100).toFixed(1)}%), Wilson 95% [${(wC[0] * 100).toFixed(1)}%, ${(wC[1] * 100).toFixed(1)}%], sha: ${JSON.stringify(stats.COPY.shas)}`);
  log(`   NOCOPY : ${kn}/${nn} crash (${(kn / nn * 100).toFixed(1)}%), Wilson 95% [${(wN[0] * 100).toFixed(1)}%, ${(wN[1] * 100).toFixed(1)}%], sha: ${JSON.stringify(stats.NOCOPY.shas)}`);
  log(`   P(0/${nc} | p thật 5%) = ${summary.pZeroIfTrueRate["p=0.05 (pha E)"]}; P(0/${nc} | p thật 12,5%) = ${summary.pZeroIfTrueRate["p=0.125 (gop dot 70: 4/32)"]}`);
  log(`   Pha G (gdb hunt): ${hunt.runs.length} lần, bắt được crash: ${hunt.caught ? `CÓ (G-r${hunt.caught.i})` : "KHÔNG"}`);
  log(`== xong (WORK=${WORK}) ==`);
}

main();
