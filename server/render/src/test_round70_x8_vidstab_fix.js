#!/usr/bin/env node
/**
 * test_round70_x8_vidstab_fix.js — Phase 9 đợt 70, luồng X8:
 * sửa production vidstab (ép frame non-writable trước vidstabtransform)
 * + đo lại spread 1080p + điều tra SEGFAULT đợt 67 U1.
 *
 * Bối cảnh: W4 đã chứng minh cơ chế M1 (vidstabtransform ghi in-place lên
 * buffer frame của decoder khi writable → bẩn reference frame) và X4 chứng
 * minh ép non-direct qua split→nullsink khử hoàn toàn 720p (0/150 ×3).
 * Luồng này tìm filter copy THẬT dùng được trong filterchain tuyến tính
 * của production (buildEnhancePreChain) rồi đo lại spread ở 1080p.
 *
 * Ứng viên filter copy (chèn ngay trước vidstabtransform) — KẾT QUẢ PHA A+B:
 *   - `copy`       : KHỬ HOÀN TOÀN 720p với threads mặc định (B1: 0/150 ×3,
 *                    sha == X1 rawvideo ground truth 4a42bdd3…). Cơ chế:
 *                    copy clone frame (refcount 2) rồi gọi đồng bộ filter
 *                    sau trong cùng call stack nên khi vidstabtransform
 *                    chạy, frame vẫn còn 1 reference nữa → non-writable →
 *                    transform cấp buffer mới, không ghi lên buffer decoder.
 *   - `crop=iw:ih`: KHÔNG cứu được (B2: 133/150, 135/150) — crop toàn
 *                    khung là passthrough, vẫn chia sẻ buffer decoder.
 *                    B3 (crop + threads1) xác định nhờ threads1 (E4), không
 *                    phải nhờ crop.
 *   => Sửa production = chèn `copy` trước vidstabtransform (xem enhance.js).
 *   Các pha C/D/F dưới đây dùng `copy` (đã sửa từ `crop` sau pha B).
 *
 * Thí nghiệm (framemd5 từng frame; cùng .trf cố định mỗi clip):
 *   A  pixel-identity 720p: decode-only vs `copy` vs `crop=iw:ih` (×1 mỗi
 *      bên, so framemd5 với decode-only — phải 0 frame khác).
 *   B1 720p transform + `copy` pre, threads mặc định ×3
 *   B2 720p transform + `crop=iw:ih` pre, threads mặc định ×3
 *   B3 720p transform + `crop=iw:ih` pre + `-threads 1` ×3 (production)
 *   C0 1080p 5s tổng hợp, baseline threads mặc định ×3
 *   C1 1080p 5s tổng hợp + `copy` pre, threads mặc định ×3
 *   C2 1080p 5s tổng hợp + `copy` pre + `-threads 1` ×3 (production)
 *   D0 slovenska VP9 10s, baseline `-threads 1` ×3 (đo lại U1 93–96%)
 *   D1 slovenska VP9 10s + `copy` pre, threads mặc định ×3
 *   D2 slovenska VP9 10s + `copy` pre + `-threads 1` ×3 (production)
 *   B4 720p transform + `copy` pre + `-threads 1` ×3 (production, đủ bộ)
 *   E  SEGFAULT: 1080p 5s transform→framemd5 `-threads 1` (KHÔNG crop,
 *      đúng cấu hình lúc crash đợt 67) ×20 — đếm crash/signal/file rỗng.
 *   F  60s h264 + `crop` pre + `-threads 1` ×2 (tag riêng, chạy sau).
 *
 * Baseline so sánh: W4 X2/X2b 720p mặc định 134–138/150; W4 R1 1080p 5s
 * control mặc định 102–141/150, threads1 0/150; U1 VP9 threads1 93–96%.
 *
 * Cách chạy: node server/render/src/test_round70_x8_vidstab_fix.js [TAG...]
 * (không đối số = chạy tất cả trừ F; liệt kê tag để chạy 1 pha).
 * Kết quả: results.jsonl + summary.json trong WORK.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.X8_WORK || path.join(HOME, "workspace", ".scratch-r70x8", "runs");
fs.mkdirSync(WORK, { recursive: true });
const WANT = new Set(process.argv.slice(2));

const SRC720 = "/home/hatch/workspace/.scratch-r65s1-0e63Ph/media/shakynoisy720.mp4";
const TRF720 = "/home/hatch/workspace/.scratch-r65s1-0e63Ph/detect-a.trf";
// Clip SEGFAULT đợt 67 U1: shakynoisy1080.mp4 5s (khác file với control-1080-r1).
const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const SRC60 = "/home/hatch/workspace/.scratch-r67u1-measure/media/shakynoisy1080_60s.mp4";
const TRF60 = "/home/hatch/workspace/.scratch-r67u1-measure/detect60-default-r1.trf";
const SLOV = "/home/hatch/workspace/.scratch-r64r4/slovenska.webm";
const TRFSLOV = "/home/hatch/workspace/.scratch-r67u1-measure/detect-slov-default-r1.trf";

const LOGF = path.join(WORK, "results.jsonl");
const SUMMARY = {};
function log(...a) { console.log(...a); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function freeMem() {
  try {
    const m = fs.readFileSync("/proc/meminfo", "utf8").match(/MemAvailable:\s+(\d+)/);
    return m ? `${Math.round(+m[1] / 1024)} MB avail` : "?";
  } catch { return "?"; }
}
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
function record(rec) { fs.appendFileSync(LOGF, JSON.stringify(rec) + "\n"); }
function run(cmd, args, label) {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], timeout: 1800000 });
  const secs = (Date.now() - t0) / 1000;
  return { status: r.status, signal: r.signal || null,
           error: r.error ? String(r.error) : null,
           stderr: (r.stderr || "").toString().slice(-400), secs };
}
function want(tag) { return WANT.size === 0 || WANT.has(tag); }

function parseFramemd5(p) {
  const lines = fs.readFileSync(p, "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
  const md5s = [];
  for (const l of lines) {
    const m = l.match(/([0-9a-f]{32})/);
    if (m) md5s.push(m[1]);
  }
  return { n: md5s.length, md5s };
}
function compareMd5(a, b) {
  const A = parseFramemd5(a), B = parseFramemd5(b);
  if (A.n !== B.n) return { nA: A.n, nB: B.n, differing: -1, error: `số frame khác nhau ${A.n} vs ${B.n}` };
  const diffIdx = [];
  for (let i = 0; i < A.n; i++) if (A.md5s[i] !== B.md5s[i]) diffIdx.push(i);
  return { n: A.n, differing: diffIdx.length,
           firstDiffFrame: diffIdx.length ? diffIdx[0] : -1,
           diffFrames: diffIdx.slice(0, 40), diffFramesTotal: diffIdx.length };
}

// --- 1 lần chạy ffmpeg → framemd5 ---
// preArgs: trước "-i src"; vf: filter graph; postArgs: sau "-i src".
function xform(tag, runIdx, preArgs, src, vf, postArgs) {
  const out = path.join(WORK, tag, `r${runIdx}.framemd5`);
  fs.mkdirSync(path.join(WORK, tag), { recursive: true });
  const args = [...(preArgs || []), "-v", "error", "-i", src,
    ...(postArgs || []), "-vf", vf, "-an", "-f", "framemd5", "-y", out];
  const r = run("ffmpeg", args, `xform ${tag} r${runIdx}`);
  if (r.status !== 0) throw new Error(`xform ${tag} r${runIdx} thất bại (mã ${r.status}, signal ${r.signal}): ${r.stderr}`);
  if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error(`xform ${tag} r${runIdx}: framemd5 rỗng (signal ${r.signal})`);
  return { out, sha: sha256(out), secs: r.secs, loadavg: loadAvg() };
}
function decodeOnly(tag, runIdx, preArgs, src, vf) {
  const out = path.join(WORK, tag, `r${runIdx}.framemd5`);
  fs.mkdirSync(path.join(WORK, tag), { recursive: true });
  const args = [...(preArgs || []), "-v", "error", "-i", src,
    ...(vf ? ["-vf", vf] : []), "-an", "-f", "framemd5", "-y", out];
  const r = run("ffmpeg", args, `decode ${tag} r${runIdx}`);
  if (r.status !== 0) throw new Error(`decode ${tag} r${runIdx} thất bại (mã ${r.status}): ${r.stderr}`);
  if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error(`decode ${tag} r${runIdx}: framemd5 rỗng`);
  return { out, sha: sha256(out), secs: r.secs, loadavg: loadAvg() };
}

function experiment(tag, desc, nRuns, runFn) {
  if (!want(tag)) return null;
  log(`\n== ${tag}. ${desc} (loadavg: ${loadAvg()}, ${freeMem()}) ==`);
  const rec = { tag, desc, runs: [], comparisons: [] };
  try {
    for (let i = 1; i <= nRuns; i++) {
      const res = runFn(i);
      rec.runs.push(res);
      log(`   📊 ${tag}-r${i} (${res.secs.toFixed(1)}s): framemd5 sha=${res.sha.slice(0, 12)}…`);
    }
    for (let i = 2; i <= nRuns; i++) {
      const c = compareMd5(rec.runs[0].out, rec.runs[i - 1].out);
      rec.comparisons.push(c);
      log(`   📊 ${tag} r1↔r${i}: khác ${c.differing}/${c.n} frame, frame khác đầu tiên=${c.firstDiffFrame}` +
          (c.diffFramesTotal > 0 && c.diffFramesTotal <= 40 ? `, frames=[${c.diffFrames.join(",")}]` : ""));
    }
    const det = rec.comparisons.every((c) => c.differing === 0);
    rec.deterministic = det;
    log(`   📊 ${tag} KẾT LUẬN: ${det ? "XÁC ĐỊNH (0 frame khác)" : "KHÔNG XÁC ĐỊNH"}`);
  } catch (e) {
    rec.error = String(e.message || e);
    log(`   ❌ ${tag} LỖI: ${rec.error}`);
  }
  record(rec);
  SUMMARY[tag] = rec;
  return rec;
}

// --- Kiểm chứng đầu vào ---
log(`== Đợt 70 X8 — sửa vidstab + đo lại spread + SEGFAULT (loadavg: ${loadAvg()}, ${freeMem()}) ==`);
log(`   WORK=${WORK}`);
for (const p of [SRC720, TRF720, SRC1080, SRC60, TRF60, SLOV, TRFSLOV]) {
  if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
}
log(`   📊 SRC1080 sha=${sha256(SRC1080).slice(0, 12)}… (kỳ vọng 5cf533f5bcd9…)`);

// .trf cho clip 1080p 5s (U1): detect 1 lần trên đúng clip, dùng chung mọi pha C/E.
const TRF1080 = path.join(WORK, "detect-shaky1080-5s.trf");
if ((want("C0") || want("C1") || want("C2") || want("E") || WANT.size === 0) && !fs.existsSync(TRF1080)) {
  log(`\n== setup: detect 1 lần trên ${SRC1080} (5s) ==`);
  const args = ["-v", "error", "-i", SRC1080, "-vf",
    `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabdetect=result=${TRF1080}:shakiness=5:accuracy=15:stepsize=6:mincontrast=0.3`,
    "-an", "-f", "null", "-"];
  const r = run("ffmpeg", args, "detect 1080p 5s");
  if (r.status !== 0) { log(`   ❌ detect thất bại: ${r.stderr}`); process.exit(2); }
  log(`   📊 detect 1080p 5s (${r.secs.toFixed(1)}s): trf sha=${sha256(TRF1080).slice(0, 12)}…`);
}

const VF720_BASE = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF720}':smoothing=10:optalgo=gauss`;
const VF720_COPY = `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRF720}':smoothing=10:optalgo=gauss`;
const VF720_CROP = `trim=start=0:end=5,setpts=PTS-STARTPTS,crop=iw:ih,vidstabtransform=input='${TRF720}':smoothing=10:optalgo=gauss`;
const VF1080_BASE = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
const VF1080_COPY = `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
const VFSLOV_BASE = `trim=start=0:end=10,setpts=PTS-STARTPTS,vidstabtransform=input='${TRFSLOV}':smoothing=10:optalgo=gauss`;
const VFSLOV_COPY = `trim=start=0:end=10,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRFSLOV}':smoothing=10:optalgo=gauss`;
const VF60_COPY = `trim=start=0:end=60,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRF60}':smoothing=10:optalgo=gauss`;

// --- Pha A: pixel-identity (filter copy có làm đổi pixel không?) ---
if (want("A")) {
  log(`\n== A. pixel-identity 720p: decode-only vs copy vs crop=iw:ih (loadavg: ${loadAvg()}) ==`);
  const rec = { tag: "A", desc: "pixel-identity", runs: [], comparisons: [] };
  try {
    const base = decodeOnly("A", 1, [], SRC720, null);
    rec.runs.push({ label: "decode-only", ...base });
    log(`   📊 A decode-only (${base.secs.toFixed(1)}s): sha=${base.sha.slice(0, 12)}…`);
    const cp = decodeOnly("A", 2, [], SRC720, "copy");
    rec.runs.push({ label: "copy", ...cp });
    const c1 = compareMd5(base.out, cp.out);
    rec.comparisons.push({ label: "decode-only↔copy", ...c1 });
    log(`   📊 A decode-only↔copy: khác ${c1.differing}/${c1.n} frame (${cp.secs.toFixed(1)}s)`);
    const cr = decodeOnly("A", 3, [], SRC720, "crop=iw:ih");
    rec.runs.push({ label: "crop=iw:ih", ...cr });
    const c2 = compareMd5(base.out, cr.out);
    rec.comparisons.push({ label: "decode-only↔crop", ...c2 });
    log(`   📊 A decode-only↔crop=iw:ih: khác ${c2.differing}/${c2.n} frame (${cr.secs.toFixed(1)}s)`);
    rec.deterministic = c1.differing === 0 && c2.differing === 0;
    log(`   📊 A KẾT LUẬN: ${rec.deterministic ? "cả copy và crop đều giữ nguyên pixel" : "CÓ filter làm đổi pixel — xem trên"}`);
  } catch (e) { rec.error = String(e.message || e); log(`   ❌ A LỖI: ${rec.error}`); }
  record(rec); SUMMARY.A = rec;
}

// --- Pha B: spread 720p với filter copy ---
experiment("B1", "720p transform + copy pre, threads mặc định ×3", 3,
  (i) => xform("B1", i, [], SRC720, VF720_COPY, []));
experiment("B2", "720p transform + crop=iw:ih pre, threads mặc định ×3", 3,
  (i) => xform("B2", i, [], SRC720, VF720_CROP, []));
experiment("B3", "720p transform + crop=iw:ih pre + -threads 1 ×3 (production)", 3,
  (i) => xform("B3", i, ["-threads", "1"], SRC720, VF720_CROP, []));

// --- Pha B4: production config 720p (copy + threads1) ---
experiment("B4", "720p transform + copy pre + -threads 1 ×3 (production, đủ bộ)", 3,
  (i) => xform("B4", i, ["-threads", "1"], SRC720, VF720_COPY, []));

// --- Pha C: spread 1080p clip tổng hợp 5s ---
experiment("C0", "1080p 5s tổng hợp, baseline threads mặc định ×3", 3,
  (i) => xform("C0", i, [], SRC1080, VF1080_BASE, []));
experiment("C1", "1080p 5s tổng hợp + copy pre, threads mặc định ×3", 3,
  (i) => xform("C1", i, [], SRC1080, VF1080_COPY, []));
experiment("C2", "1080p 5s tổng hợp + copy pre + -threads 1 ×3 (production)", 3,
  (i) => xform("C2", i, ["-threads", "1"], SRC1080, VF1080_COPY, []));

// --- Pha D: spread 1080p VP9 slovenska 10s ---
experiment("D0", "slovenska VP9 10s, baseline -threads 1 ×3 (đo lại U1)", 3,
  (i) => xform("D0", i, ["-threads", "1"], SLOV, VFSLOV_BASE, []));
experiment("D1", "slovenska VP9 10s + copy pre, threads mặc định ×3", 3,
  (i) => xform("D1", i, [], SLOV, VFSLOV_COPY, []));
experiment("D2", "slovenska VP9 10s + copy pre + -threads 1 ×3 (production)", 3,
  (i) => xform("D2", i, ["-threads", "1"], SLOV, VFSLOV_COPY, []));

// --- Pha E: SEGFAULT tái hiện (đúng cấu hình lúc crash: không crop, -threads 1) ---
if (want("E")) {
  log(`\n== E. SEGFAULT tái hiện: 1080p 5s transform→framemd5 -threads 1, KHÔNG crop ×20 (loadavg: ${loadAvg()}, ${freeMem()}) ==`);
  const rec = { tag: "E", desc: "segfault repro x20", runs: [], crashes: 0, ok: 0, shas: {} };
  try {
    for (let i = 1; i <= 20; i++) {
      const out = path.join(WORK, "E", `r${i}.framemd5`);
      fs.mkdirSync(path.join(WORK, "E"), { recursive: true });
      const args = ["-threads", "1", "-v", "error", "-i", SRC1080, "-vf", VF1080_BASE, "-an", "-f", "framemd5", "-y", out];
      const r = run("ffmpeg", args, `segfault-repro r${i}`);
      const exists = fs.existsSync(out);
      const size = exists ? fs.statSync(out).size : 0;
      const sha = exists && size > 0 ? sha256(out) : null;
      const crashed = r.status !== 0 || r.signal !== null || size === 0;
      if (crashed) rec.crashes++; else { rec.ok++; rec.shas[sha] = (rec.shas[sha] || 0) + 1; }
      rec.runs.push({ i, status: r.status, signal: r.signal, size, sha: sha ? sha.slice(0, 12) : null, secs: +r.secs.toFixed(1), stderr: r.stderr });
      log(`   📊 E-r${i} (${r.secs.toFixed(1)}s): status=${r.status} signal=${r.signal} size=${size} sha=${sha ? sha.slice(0, 12) : "—"}${crashed ? "  💥 CRASH" : ""}`);
    }
    log(`   📊 E KẾT LUẬN: ${rec.crashes}/20 crash, ${rec.ok}/20 ok; sha phân bố: ${JSON.stringify(rec.shas)}`);
  } catch (e) { rec.error = String(e.message || e); log(`   ❌ E LỖI: ${rec.error}`); }
  record(rec); SUMMARY.E = rec;
}

// --- Pha F: 60s h264 + copy (tag riêng) ---
experiment("F", "60s h264 + copy pre + -threads 1 ×2 (production, clip dài)", 2,
  (i) => xform("F", i, ["-threads", "1"], SRC60, VF60_COPY, []));

log(`\n== test_round70_x8_vidstab_fix: xong (WORK=${WORK}, loadavg cuối: ${loadAvg()}, ${freeMem()}) ==`);
log("== SUMMARY (JSON) ==");
log(JSON.stringify(SUMMARY, null, 1));
writeFileEpermRetry(path.join(WORK, "summary.json"), JSON.stringify(SUMMARY, null, 1));
