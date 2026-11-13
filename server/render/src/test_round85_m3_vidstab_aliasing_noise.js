#!/usr/bin/env node
/**
 * test_round85_m3_vidstab_aliasing_noise.js — Phase 9 đợt 85, luồng M3.
 *
 * Probe aliasing offset (L4 §5.5): clip nhiễu seed-riêng (mỗi frame một
 * pattern giả-ngẫu nhiên khác nhau) + trf rung thật shaky720.trf.
 * Frame output lệch sẽ tương quan mạnh nhất với một source frame m nào
 * đó → offset m−n. Phân biệt 3 trường hợp: offset thuần (đọc nhầm frame
 * m), blend (pha trộn n/n+1 như artifact bilinear L4 §5.4), hay không
 * khớp frame nào (hỏng một phần).
 *
 * Kế thừa setup K10 (đợt 83): taskset pin ffmpeg+hog cores 0-1,
 * LD_PRELOAD free_track_v2e + segv_backtrace, -threads 1, showinfo,
 * -v info, xen kẽ từng vòng, resume từ results.jsonl, writeRetry
 * chống sóng EPERM, ffmpeg retry I/O 3 lần.
 *
 * KHÁC K10 ở đầu ra: mỗi run ghi CẢ framemd5 (endpoint chính, so NC
 * vs CP) VÀ rawvideo (pixel thật để phân tích offset) từ CÙNG MỘT
 * filter graph qua split=2 — hai đầu ra chia sẻ đúng một instance
 * transform, nên offset đo trên đúng run đã tính endpoint.
 *
 * 2 arm × n=10 (chỉ 720p — 1080p không có power, K10 §3.1):
 *   N720NC  noise720.mp4 NOCOPY  (đo — race có tái hiện trên nhiễu?)
 *   C720CP  noise720.mp4 COPY    (GT family 720noise)
 *
 * Env: M3_WORK (mặc định ~/workspace/.scratch-r85m3/runs),
 *      M3_N=10 M3_CORES=0-1 M3_HOG=2 M3_ARMS=<danh sách>
 * Cách chạy: node server/render/src/test_round85_m3_vidstab_aliasing_noise.js [run|analyze|both]
 *   - `run`: chỉ chạy (không phân tích).
 *   - `analyze`: chỉ phân tích WORK hiện có (endpoint framemd5 + GT ổn định).
 *   - Phân tích offset pixel (MAD chéo) chạy bằng analyze_noise.py riêng
 *     trên rawvideo — không gộp vào đây để harness chạy nhẹ.
 *
 * KHÔNG push, KHÔNG sửa production, KHÔNG đụng TTS/Gradio, KHÔNG đụng
 * .github/workflows/*. Chỉ dùng ffmpeg stock Ubuntu 8.1.2.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync, spawn, execSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.M3_WORK || path.join(HOME, "workspace", ".scratch-r85m3", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC = "/home/hatch/workspace/.scratch-r85m3/noise720.mp4";
const TRF = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.trf";
const FREE_SO = "/home/hatch/workspace/.scratch-r81i1/free_track_v2e_preload.so";
const SEGV_SO = "/home/hatch/workspace/.scratch-r76d3/runs-v2b/segv_backtrace_preload.so";
const BOTH = `${FREE_SO}:${SEGV_SO}`;
const FFMPEG_STOCK = process.env.M3_FFMPEG_STOCK || "ffmpeg";
const CORES = process.env.M3_CORES || "0-1";
const N = parseInt(process.env.M3_N || "10", 10);
const N_HOG = parseInt(process.env.M3_HOG || "2", 10);
const LOGF = path.join(WORK, "results.jsonl");
const SUMMARYF = path.join(WORK, "summary.json");
const ANALYSISF = path.join(WORK, "analysis-perframe.json");
const HOGSNAPF = path.join(WORK, "hog-cpu-snapshots.txt");
const ZONE = (n) => (n < 140 ? "mid" : n < 150 ? "drain" : "pad");

function vfNocopy(trf) {
  return `[0:v]trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo,split=2[md5][raw]`;
}
function vfCopy(trf) {
  return `[0:v]trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo,split=2[md5][raw]`;
}

const ALL_ARMS = [
  { key: "N720NC", label: "noise 720p NOCOPY", src: SRC, trf: TRF, fc: vfNocopy(TRF), size: "720", family: "720noise", gtArm: "C720CP", realFrames: 150 },
  { key: "C720CP", label: "noise 720p COPY", src: SRC, trf: TRF, fc: vfCopy(TRF), size: "720", family: "720noise", gtArm: "C720CP", realFrames: 150 },
];
const WANT = (process.env.M3_ARMS || "").split(",").map((s) => s.trim()).filter(Boolean);
const ARMS = WANT.length ? ALL_ARMS.filter((a) => WANT.includes(a.key)) : ALL_ARMS;

// ---------------- tiện ích chung (kế thừa K10) ----------------
function writeRetry(fn, what, maxAttempts) {
  maxAttempts = maxAttempts || 30;
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { fn(); return; }
    catch (e) {
      lastErr = e;
      if (attempt < maxAttempts) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
    }
  }
  throw new Error(`ghi ${what} thất bại sau ${maxAttempts} lần retry: ${lastErr && lastErr.message}`);
}
function appendFileRetry(p, data, maxAttempts) { writeRetry(() => fs.appendFileSync(p, data), p, maxAttempts); }
function writeFileRetry(p, data, maxAttempts) { writeRetry(() => writeFileEpermRetry(p, data), p, maxAttempts); }
function log(...a) { console.log(...a); }
function loadAvgStr() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function sha256(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }
function record(rec) { appendFileRetry(LOGF, JSON.stringify(rec) + "\n", 150); }
function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : +((s[m - 1] + s[m]) / 2).toFixed(2);
}
function wilson(k, n) {
  if (n === 0) return [0, 0];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [+Math.max(0, (c - m) / d).toFixed(4), +Math.min(1, (c + m) / d).toFixed(4)];
}
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
  return Math.min(1, p);
}
// Permutation test chính xác (2 phía) trên hiệu trung bình 2 mẫu (kế thừa J1/K10).
function permTestExact(a, b) {
  const n1 = a.length, n2 = b.length, n = n1 + n2;
  const all = [...a, ...b];
  const obs = Math.abs(a.reduce((s, v) => s + v, 0) / n1 - b.reduce((s, v) => s + v, 0) / n2);
  let combos = 0, ge = 0;
  const idx = Array.from({ length: n1 }, (_, i) => i);
  function nextComb() {
    let i = n1 - 1;
    while (i >= 0 && idx[i] === n - n1 + i) i--;
    if (i < 0) return false;
    idx[i]++;
    for (let j = i + 1; j < n1; j++) idx[j] = idx[j - 1] + 1;
    return true;
  }
  do {
    combos++;
    const inA = new Set(idx);
    let sA = 0, sB = 0;
    for (let i = 0; i < n; i++) { if (inA.has(i)) sA += all[i]; else sB += all[i]; }
    if (Math.abs(sA / n1 - sB / n2) >= obs - 1e-12) ge++;
  } while (nextComb());
  return { p: ge / combos, combos };
}

function parseFramemd5(p) {
  const md5s = [];
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\d+,\s*\d+,\s*\d+,\s*\d+,\s*\d+,\s*([0-9a-f]{32})\s*$/);
    if (m) md5s.push(m[1]);
  }
  return md5s;
}
// Parser showinfo ĐÃ backport L4 §2.3 (đợt 85 M3): tước status-line
// trước khi parse + \s+ trong regex — xem J1/K10.
const RE_SHOWINFO = /n:\s*(\d+) pts:\s*\d+ pts_time:[0-9.]+\s+duration:\s*\d+ duration_time:[0-9.]+\s+fmt:\S+\s+cl:\S+\s+sar:\S+\s+s:\S+\s+i:\S+\s+iskey:\d+\s+type:\S+[\s\S]{0,600}?checksum:([0-9A-F]+)\s+plane_checksum:\[\s*([0-9A-F]+)\s+([0-9A-F]+)\s+([0-9A-F]+)\s*\]\s+mean:\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]\s+stdev:\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]/g;
function parseShowinfo(p) {
  const frames = new Map();
  const text = fs.readFileSync(p, "utf8")
    .replace(/frame= *\d+ fps=[^\r\n]*\r\[Parsed_showinfo_[^\]]*\]/g, "")
    .replace(/frame= *\d+ fps=[^\r\n]*/g, "")
    .replace(/\r/g, "");
  let m;
  RE_SHOWINFO.lastIndex = 0;
  while ((m = RE_SHOWINFO.exec(text)) !== null) {
    const n = parseInt(m[1], 10);
    frames.set(n, {
      checksum: m[2],
      plane: [m[3], m[4], m[5]],
      mean: [+m[6], +m[7], +m[8]],
      stdev: [+m[9], +m[10], +m[11]],
    });
  }
  return frames;
}

let hogs = [];
function startHogs() {
  for (let i = 0; i < N_HOG; i++) {
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

function runOnce(arm, idx) {
  const outDir = path.join(WORK, arm.key);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `r${idx}.framemd5`);
  const raw = path.join(outDir, `r${idx}.raw`);
  const errFile = path.join(outDir, `r${idx}.stderr`);
  const freeLog = path.join(WORK, `free-track-v2e-${arm.key}-r${idx}.log`);
  try { fs.unlinkSync(freeLog); } catch { /* chưa có */ }
  const args = ["-threads", "1", "-v", "info", "-i", arm.src,
    "-filter_complex", arm.fc,
    "-map", "[md5]", "-an", "-f", "framemd5", "-y", out,
    "-map", "[raw]", "-an", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", raw];
  let r, stderr, secs, attempts = 0;
  for (;;) {
    attempts++;
    const t0 = Date.now();
    r = spawnSync("taskset", ["-c", CORES, FFMPEG_STOCK, ...args], {
      stdio: ["ignore", "pipe", "pipe"], timeout: 900000,
      env: { ...process.env, LD_PRELOAD: BOTH, FREE_TRACK_LOG: freeLog },
    });
    secs = (Date.now() - t0) / 1000;
    stderr = (r.stderr || "").toString();
    const outExists = fs.existsSync(out);
    const outSize = outExists ? fs.statSync(out).size : 0;
    const rawSize = fs.existsSync(raw) ? fs.statSync(raw).size : 0;
    const ioFail = (r.status !== 0 || r.signal !== null || outSize === 0 || rawSize === 0) &&
      (/Permission denied/i.test(stderr) || /I\/O error/i.test(stderr) || outSize === 0 || rawSize === 0);
    if (!ioFail || attempts >= 3) {
      if (ioFail) log(`   ⚠️  ${arm.key}-r${idx}: lỗi I/O sau ${attempts} lần thử — ghi nhận kết quả cuối (không retry nữa)`);
      break;
    }
    log(`   ⚠️  ${arm.key}-r${idx}: ffmpeg chết vì lỗi I/O (lần ${attempts}, ${secs.toFixed(1)}s) — chờ 30 s rồi chạy lại`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30000);
  }
  writeFileRetry(errFile, stderr, 150);
  const exists = fs.existsSync(out);
  const size = exists ? fs.statSync(out).size : 0;
  const rawSize = fs.existsSync(raw) ? fs.statSync(raw).size : 0;
  const sha = exists && size > 0 ? sha256(out) : null;
  const crashed = r.status !== 0 || r.signal !== null || size === 0 || rawSize === 0;
  const freeLogText = fs.existsSync(freeLog) ? fs.readFileSync(freeLog, "utf8") : "";
  const statsM = freeLogText.match(/\[free_track_v2e\] === stats quarantined=(\d+) evicted=(\d+) peakQuarantineBytes=(\d+) ===/);
  const rec = {
    arm: arm.key, i: idx, ffmpeg: FFMPEG_STOCK, status: r.status, signal: r.signal || null,
    error: r.error ? String(r.error) : null,
    size, rawSize, sha: sha ? sha.slice(0, 12) : null, secs: +secs.toFixed(1),
    loadavg: loadAvgStr(), cores: CORES, crash: crashed,
    lastFrame: (stderr.match(/\[Parsed_showinfo[^\]]*\] n:\s*(\d+)/g) || []).length
      ? parseInt(stderr.match(/\[Parsed_showinfo[^\]]*\] n:\s*(\d+)/g).pop().match(/n:\s*(\d+)/)[1], 10) : null,
    quarantined: statsM ? parseInt(statsM[1], 10) : null,
    evicted: statsM ? parseInt(statsM[2], 10) : null,
    peakQuarantineBytes: statsM ? parseInt(statsM[3], 10) : null,
  };
  if (crashed) {
    log(`   💥 ${arm.key}-r${idx}: CRASH signal=${r.signal} status=${r.status} size=${size} rawSize=${rawSize}`);
  } else {
    log(`   📊 ${arm.key}-r${idx} (${secs.toFixed(1)}s): ok sha=${sha ? sha.slice(0, 12) : null}… raw=${(rawSize / 1048576).toFixed(1)}MB lastFrame=${rec.lastFrame} load=${loadAvgStr()}`);
  }
  record(rec);
  return rec;
}

function runAll() {
  log(`== Đợt 85 M3 — probe aliasing offset vidstab trên clip nhiễu seed-riêng (cores=${CORES}), ${ARMS.length} arm × n=${N} ==`);
  log(`   WORK=${WORK} (arms=${ARMS.map((a) => a.key).join(",")})`);
  for (const p of [SRC, TRF, FREE_SO, SEGV_SO]) {
    if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
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
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000);
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
    byArm[a.key] = {
      label: a.label, n: rs.length, crashes: rs.filter((r) => r.crash).length,
      wilson95: wilson(rs.filter((r) => r.crash).length, rs.length),
      medianSecs: median(rs.map((r) => r.secs)),
      rawSizeOk: rs.filter((r) => r.rawSize === 150 * 1280 * 720 * 3 / 2).length,
    };
  }
  writeFileRetry(SUMMARYF, JSON.stringify({
    done: true,
    method: "K10 setup + split=2 (framemd5 + rawvideo cung graph) tren clip nhieu seed-rieng noise720.mp4 + trf shaky720.trf",
    stockFfmpeg: FFMPEG_STOCK, cores: CORES, nPerArm: N, hogs: N_HOG, byArm,
  }, null, 1), 150);
  log(`== xong run — ${SUMMARYF} ==`);
  return byArm;
}

// ---------------- phân tích endpoint framemd5 ----------------
function buildGt(armKey) {
  // GT = phieu da so tren 10 run arm GT (moi frame lay md5 xuat hien nhieu nhat).
  const perFrame = Array.from({ length: 150 }, () => ({}));
  let nRuns = 0;
  for (let i = 1; i <= N; i++) {
    const p = path.join(WORK, armKey, `r${i}.framemd5`);
    if (!fs.existsSync(p)) continue;
    const md5s = parseFramemd5(p);
    nRuns++;
    md5s.slice(0, 150).forEach((m, n) => { perFrame[n][m] = (perFrame[n][m] || 0) + 1; });
  }
  const gt = perFrame.map((cnt) => {
    let best = null, bestN = -1;
    for (const [m, c] of Object.entries(cnt)) if (c > bestN) { best = m; bestN = c; }
    return { md5: best, votes: bestN, runs: nRuns };
  });
  const stable = gt.every((g) => g.votes === g.runs);
  return { gt, stable, nRuns };
}
function analyzeArm(arm, gtInfo) {
  const divPerRun = [], zoneTotal = { mid: 0, drain: 0, pad: 0 };
  let totalDiv = 0;
  for (let i = 1; i <= N; i++) {
    const p = path.join(WORK, arm.key, `r${i}.framemd5`);
    if (!fs.existsSync(p)) { divPerRun.push(null); continue; }
    const md5s = parseFramemd5(p).slice(0, 150);
    let d = 0;
    md5s.forEach((m, n) => {
      if (m !== gtInfo.gt[n].md5) { d++; zoneTotal[ZONE(n)]++; }
    });
    divPerRun.push(d);
    totalDiv += d;
  }
  return { arm: arm.key, totalDiv, totalFrames: N * 150, divPerRun, zoneTotal, gtStable: gtInfo.stable };
}
function analyzeWork() {
  log(`== phân tích ${WORK} (framemd5 endpoint) ==`);
  const gtArm = ALL_ARMS.find((a) => a.key === "C720CP");
  const gtInfo = buildGt(gtArm.key);
  log(`   GT ${gtArm.key}: ${gtInfo.nRuns} run, ổn định tuyệt đối: ${gtInfo.stable}`);
  const perArm = {};
  for (const a of ARMS) perArm[a.key] = analyzeArm(a, gtInfo);
  const nc = perArm.N720NC, cp = perArm.C720CP;
  const fisher = fisher2(cp.totalDiv, cp.totalFrames - cp.totalDiv, nc.totalDiv, nc.totalFrames - nc.totalDiv);
  const perm = permTestExact(nc.divPerRun.filter((v) => v !== null), cp.divPerRun.filter((v) => v !== null));
  const out = {
    source: "test_round85_m3_vidstab_aliasing_noise.js analyze",
    workDir: WORK, nPerArm: N, perArm,
    comparisons: [{ pair: "N720NC-vs-C720CP", fisher, perm }],
  };
  writeFileRetry(ANALYSISF, JSON.stringify(out, null, 1), 150);
  log(`   N720NC: ${nc.totalDiv}/${nc.totalFrames} frame lệch (${(100 * nc.totalDiv / nc.totalFrames).toFixed(1)}%), per-run ${JSON.stringify(nc.divPerRun)}, vùng ${JSON.stringify(nc.zoneTotal)}`);
  log(`   C720CP: ${cp.totalDiv}/${cp.totalFrames} frame lệch, GT ổn định: ${gtInfo.stable}`);
  log(`   Fisher p=${fisher.toExponential(3)} | permutation per-run p=${perm.p.toExponential(3)} (${perm.combos} hoán vị)`);
  log(`== xong — ${ANALYSISF} ==`);
  return out;
}

function main() {
  const mode = (process.argv[2] || "both").toLowerCase();
  if (mode === "run") runAll();
  else if (mode === "analyze") analyzeWork();
  else if (mode === "both") { runAll(); analyzeWork(); }
  else { console.error(`mode không rõ: ${mode} (run|analyze|both)`); process.exit(2); }
}
if (require.main === module) main();
module.exports = { parseFramemd5, parseShowinfo, permTestExact, fisher2, wilson, median, buildGt, analyzeArm, analyzeWork, ALL_ARMS };
