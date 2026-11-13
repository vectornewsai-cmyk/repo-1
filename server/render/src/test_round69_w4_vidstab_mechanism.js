#!/usr/bin/env node
/**
 * test_round69_w4_vidstab_mechanism.js — Phase 9 đợt 69, luồng W4:
 * điều tra CƠ CHẾ vidstabtransform không xác định (nợ đợt 67 §9 mục 3).
 *
 * Bối cảnh đã biết (đọc trước khi chạy):
 * - T1 (đợt 66): chỉ `-threads 1` (decode đơn luồng) khử spread ở 720p
 *   (0/150 frame khác ×3); `-filter_threads 1` (E5) KHÔNG sửa được;
 *   fit toàn cục (global_motions.trf) xác định ×3; decode-only C0 xác định.
 * - U1 (đợt 67): `-threads 1` ở 1080p h264 60s chỉ cải thiện (98% → 8–17%
 *   frame khác, lệch từ ~frame 1499); trên footage thật VP9 (slovenska 10s)
 *   KHÔNG cải thiện (93–96% frame khác, lệch từ frame 2). Detect .trf khác
 *   byte giữa các lần chạy nhưng nội dung LM giống hệt (0/1800 frame khác
 *   tập LM). Mọi phép đo transform của U1 dùng CÙNG 1 file .trf cố định
 *   (detect60-default-r1.trf / detect-slov-default-r1.trf) — nên lệch nằm
 *   ở bước transform + tương tác decoder, không phải detect.
 *
 * Phân tích mã nguồn (libvidstab 1.1.0 + ffmpeg 8.1 vf_vidstabtransform.c,
 * đã đọc trước khi đo — xem LIMITS):
 * - vsDoTransform warp vào td->destbuf (buffer nội bộ), dùng destbuf của
 *   frame trước làm nền khi crop=keep; vsTransformPrepare copy src khi
 *   src==dest (in-place) nên direct/non-direct đều cho cùng pixel TRONG
 *   1 lần gọi filter_frame đơn luồng.
 * - transform là hàm xác định của (src pixels, transform đã fit, destbuf
 *   frame trước). Fit đã chứng minh xác định (E13). Vậy lệch chỉ có thể
 *   đến từ: (a) src pixels khác nhau giữa các lần chạy (decode), (b) thứ
 *   tự frame đưa vào filter khác nhau (vsGetNextTransform đếm tuần tự),
 *   (c) 2 lần gọi filter_frame đồng thời trên cùng 1 instance (race trên
 *   td->src / td->destbuf / trans->current).
 * - NGHI VẤN LỚN về E5: harness T1 đặt `-filter_threads 1` TRƯỚC `-i`
 *   (globalArgs đi đầu), trong khi `-filter_threads` là option OUTPUT
 *   ("number of non-complex filter threads" — ffmpeg -h full). Có thể E5
 *   chưa bao giờ thực sự ép filter graph đơn luồng. X2/X2b kiểm chứng
 *   trực tiếp điều này.
 *
 * Thí nghiệm (mỗi cấu hình ×2–3, cùng input + cùng .trf trừ khi ghi khác;
 * đo bằng framemd5 từng frame: số frame khác + frame khác đầu tiên + danh
 * sách frame khác):
 *   X2   coded 720p transform, -filter_threads 1 SAU -i (vị trí đúng) ×3
 *   X2b  coded 720p transform, -filter_threads 1 TRƯỚC -i (tái lập E5) ×3
 *   X1   rawvideo 720p transform (không decoder, frame mới cấp phát) ×3
 *   X15  coded 720p transform, -threads 1 SAU -i (vị trí sai) ×2
 *   X5a/b decode-only 1080p 60s framemd5, mặc định ×2 / -threads 1 ×2
 *   X6a/b decode-only slovenska VP9 10s framemd5, mặc định ×3 / t1 ×3
 *   X7   rawvideo 1080p 5s transform ×3 (detect mới 1 lần, dùng chung)
 *   X8   rawvideo slovenska 10s transform ×3 (trf slov cố định)
 *   X9a/b detect trên rawvideo (720p / slovenska 10s) ×2 — so .trf byte+LM
 *   X10  slovenska→h264 10s transform mặc định ×3 / t1 ×3 (cần transcode)
 *   X11  shaky1080→VP9 5s transform mặc định ×3 / t1 ×3 (cần transcode)
 *   X12  slovenska→VP9 720p 10s transform mặc định ×3 / t1 ×3 (cần transcode)
 *   X13  60s transform -threads 1 ×3 (trf60 cố định) + danh sách frame khác
 *   X14  trim 10s đầu của clip 60s, transform -threads 1 ×3 (detect riêng)
 *   X16  coded 720p transform, -thread_queue_size 8 (trước -i) ×2
 *   X17  slovenska transform, -filter_threads 1 SAU -i ×3
 *   X4   coded 720p transform ép non-direct qua split→nullsink ×3 (phụ)
 *   X18  coded 720p transform, -threads 1 + -filter_threads 1 ×2 (sanity)
 *
 * Cách chạy: node server/render/src/test_round69_w4_vidstab_mechanism.js [TAG...]
 * (không đối số = chạy tất cả; liệt kê tag để chạy 1 pha). KHÔNG sửa code
 * sản phẩm. Kết quả: results.jsonl + summary.json trong WORK.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.W4_WORK || path.join(HOME, "workspace", ".scratch-r69w4", "runs");
fs.mkdirSync(WORK, { recursive: true });
const WANT = new Set(process.argv.slice(2));

const SRC720 = "/home/hatch/workspace/.scratch-r65s1-0e63Ph/media/shakynoisy720.mp4";
const TRF720 = "/home/hatch/workspace/.scratch-r65s1-0e63Ph/detect-a.trf";
const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/shakynoisy-control-1080-r1.mp4";
const SRC60 = "/home/hatch/workspace/.scratch-r67u1-measure/media/shakynoisy1080_60s.mp4";
const TRF60 = "/home/hatch/workspace/.scratch-r67u1-measure/detect60-default-r1.trf";
const SLOV = "/home/hatch/workspace/.scratch-r64r4/slovenska.webm";
const TRFSLOV = "/home/hatch/workspace/.scratch-r67u1-measure/detect-slov-default-r1.trf";
const TRF_CMP = "/home/hatch/workspace/.scratch-r67u1-measure/trf_compare.py";
const RAW = path.join(WORK, "raw");
fs.mkdirSync(RAW, { recursive: true });

const LOGF = path.join(WORK, "results.jsonl");
const SUMMARY = {};
let pass = 0, fail = 0;
function log(...a) { console.log(...a); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
function record(rec) { fs.appendFileSync(LOGF, JSON.stringify(rec) + "\n"); }
function run(cmd, args, label, opts) {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], timeout: 1200000, ...(opts || {}) });
  const secs = (Date.now() - t0) / 1000;
  return { status: r.status, error: r.error ? String(r.error) : null,
           stderr: (r.stderr || "").toString().slice(-600), secs };
}
function want(tag) { return WANT.size === 0 || WANT.has(tag); }

// --- framemd5: parse từng dòng, lấy token MD5 (32 hex) + toàn dòng để so pts ---
function parseFramemd5(p) {
  const lines = fs.readFileSync(p, "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
  const md5s = [];
  for (const l of lines) {
    const m = l.match(/([0-9a-f]{32})/);
    if (m) md5s.push(m[1]);
  }
  return { n: md5s.length, md5s, lines };
}
function compareMd5(a, b) {
  const A = parseFramemd5(a), B = parseFramemd5(b);
  if (A.n !== B.n) return { nA: A.n, nB: B.n, differing: -1, error: `số frame khác nhau ${A.n} vs ${B.n}` };
  const diffIdx = [];
  for (let i = 0; i < A.n; i++) if (A.md5s[i] !== B.md5s[i]) diffIdx.push(i);
  // pts có khác nhau không? so toàn dòng (trừ md5) — chẩn đoán timing/pts.
  let ptsDiff = 0;
  for (let i = 0; i < A.n; i++) {
    const la = A.lines[i].replace(/[0-9a-f]{32}/, ""), lb = B.lines[i].replace(/[0-9a-f]{32}/, "");
    if (la !== lb) ptsDiff++;
  }
  return { n: A.n, differing: diffIdx.length,
           firstDiffFrame: diffIdx.length ? diffIdx[0] : -1,
           diffFrames: diffIdx.slice(0, 40), diffFramesTotal: diffIdx.length,
           ptsDifferingLines: ptsDiff };
}
function compareTrf(a, b) {
  const r = run("python3", [TRF_CMP, a, b], "trf_compare");
  return { status: r.status, out: ((r.stderr || "") + "").trim(), raw: r };
}

// --- 1 lần chạy ffmpeg transform → framemd5 ---
// preArgs: đứng trước "-i src" (vd ["-threads","1"]); postArgs: đứng sau
// "-i src", trước "-vf" (vd ["-filter_threads","1"]). Vị trí cờ là 1 phần
// của thí nghiệm (X2 vs X2b, X15) nên phải tách rõ 2 nhóm này.
function xform2(tag, runIdx, preArgs, src, vf, postArgs) {
  const out = path.join(WORK, tag, `r${runIdx}.framemd5`);
  fs.mkdirSync(path.join(WORK, tag), { recursive: true });
  const args = [...(preArgs || []), "-v", "error", "-i", src,
    ...(postArgs || []), "-vf", vf, "-an", "-f", "framemd5", "-y", out];
  const r = run("ffmpeg", args, `xform ${tag} r${runIdx}`);
  if (r.status !== 0) throw new Error(`xform ${tag} r${runIdx} thất bại (mã ${r.status}): ${r.stderr}`);
  if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error(`xform ${tag} r${runIdx}: framemd5 rỗng`);
  return { out, sha: sha256(out), secs: r.secs };
}
function decodeOnly(tag, runIdx, preArgs, src, postArgs) {
  const out = path.join(WORK, tag, `r${runIdx}.framemd5`);
  fs.mkdirSync(path.join(WORK, tag), { recursive: true });
  const args = [...(preArgs || []), "-v", "error", "-i", src,
    ...(postArgs || []), "-an", "-f", "framemd5", "-y", out];
  const r = run("ffmpeg", args, `decode ${tag} r${runIdx}`);
  if (r.status !== 0) throw new Error(`decode ${tag} r${runIdx} thất bại (mã ${r.status}): ${r.stderr}`);
  if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error(`decode ${tag} r${runIdx}: framemd5 rỗng`);
  return { out, sha: sha256(out), secs: r.secs };
}
function detectOnce(tag, src, trfPath, extraPre, vfExtra) {
  const vf = `${vfExtra || "trim=start=0:end=5,setpts=PTS-STARTPTS,"}vidstabdetect=result=${trfPath}:shakiness=5:accuracy=15:stepsize=6:mincontrast=0.3`;
  const args = [...(extraPre || []), "-v", "error", "-i", src, "-vf", vf, "-an", "-f", "null", "-"];
  const r = run("ffmpeg", args, `detect ${tag}`);
  if (r.status !== 0) throw new Error(`detect ${tag} thất bại (mã ${r.status}): ${r.stderr}`);
  return { trf: trfPath, sha: sha256(trfPath), secs: r.secs };
}
function toRaw(tag, src, yuvPath, w, h, fps, dur) {
  if (fs.existsSync(yuvPath) && fs.statSync(yuvPath).size > 0) return { yuv: yuvPath, cached: true };
  const args = ["-v", "error", "-i", src, "-t", String(dur), "-pix_fmt", "yuv420p", "-f", "rawvideo", "-y", yuvPath];
  const r = run("ffmpeg", args, `toRaw ${tag}`);
  if (r.status !== 0) throw new Error(`toRaw ${tag} thất bại (mã ${r.status}): ${r.stderr}`);
  return { yuv: yuvPath, cached: false, secs: r.secs };
}

// --- Chạy 1 thí nghiệm: n lần, so framemd5 với lần 1 ---
function experiment(tag, desc, nRuns, runFn) {
  if (!want(tag)) return null;
  log(`\n== ${tag}. ${desc} (loadavg: ${loadAvg()}) ==`);
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
      log(`   📊 ${tag} r1↔r${i}: khác ${c.differing}/${c.n} frame, frame khác đầu tiên=${c.firstDiffFrame}, ` +
          `dòng pts khác=${c.ptsDifferingLines}` +
          (c.diffFramesTotal > 0 && c.diffFramesTotal <= 40 ? `, frames=[${c.diffFrames.join(",")}]` : ""));
    }
    const det = rec.comparisons.every((c) => c.differing === 0);
    rec.deterministic = det;
    log(`   📊 ${tag} KẾT LUẬN: ${det ? "XÁC ĐỊNH (0 frame khác)" : "KHÔNG XÁC ĐỊNH"}`);
  } catch (e) {
    rec.error = String(e.message || e);
    log(`   ❌ ${tag} LỖI: ${rec.error}`);
    fail++;
  }
  record(rec);
  SUMMARY[tag] = rec;
  return rec;
}

// --- Kiểm chứng đầu vào ---
log(`== Đợt 69 W4 — điều tra cơ chế vidstabtransform (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
log(`   WORK=${WORK}`);
for (const [p, want12] of [[SRC720, "af87a113db26"], [TRF720, "4b35c5fd86c2"], [SRC60, null], [TRF60, null], [SLOV, null], [TRFSLOV, null]]) {
  if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  if (want12) log(`   📊 ${path.basename(p)} sha=${sha256(p).slice(0, 12)}… (kỳ vọng ${want12}…)`);
}

const VF720 = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF720}':smoothing=10:optalgo=gauss`;
const VF60 = `trim=start=0:end=60,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF60}':smoothing=10:optalgo=gauss`;
const VFSLOV = `trim=start=0:end=10,setpts=PTS-STARTPTS,vidstabtransform=input='${TRFSLOV}':smoothing=10:optalgo=gauss`;

// --- Pha 1: vị trí cờ + rawvideo (quyết định) ---
experiment("X2", "coded 720p transform, -filter_threads 1 SAU -i (vị trí đúng) ×3", 3,
  (i) => xform2("X2", i, [], SRC720, VF720, ["-filter_threads", "1"]));
experiment("X2b", "coded 720p transform, -filter_threads 1 TRƯỚC -i (tái lập E5) ×3", 3,
  (i) => xform2("X2b", i, ["-filter_threads", "1"], SRC720, VF720, []));
experiment("X1", "rawvideo 720p transform (không decoder) ×3", 3, (i) => {
  const yuv = toRaw("X1", SRC720, path.join(RAW, "shaky720.yuv"), 1280, 720, 30, 5).yuv;
  return xform2("X1", i, ["-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", "1280x720", "-r", "30"], yuv, `vidstabtransform=input='${TRF720}':smoothing=10:optalgo=gauss`, []);
});
experiment("X15", "coded 720p transform, -threads 1 SAU -i (vị trí sai) ×2", 2,
  (i) => xform2("X15", i, [], SRC720, VF720, ["-threads", "1"]));

// --- Pha 2: decode-only 1080p / VP9 ---
experiment("X5a", "decode-only 1080p 60s h264, mặc định ×2", 2,
  (i) => decodeOnly("X5a", i, [], SRC60, []));
experiment("X5b", "decode-only 1080p 60s h264, -threads 1 ×2", 2,
  (i) => decodeOnly("X5b", i, ["-threads", "1"], SRC60, []));
experiment("X6a", "decode-only slovenska VP9 10s, mặc định ×3", 3,
  (i) => decodeOnly("X6a", i, [], SLOV, ["-t", "10"]));
experiment("X6b", "decode-only slovenska VP9 10s, -threads 1 ×3", 3,
  (i) => decodeOnly("X6b", i, ["-threads", "1"], SLOV, ["-t", "10"]));

// --- Pha 3: rawvideo 1080p/VP9 + detect trên rawvideo ---
const TRF1080 = path.join(WORK, "detect-1080-5s.trf");
if (want("X7") && !fs.existsSync(TRF1080)) {
  log(`\n== setup X7: detect 1 lần trên ${SRC1080} ==`);
  const d = detectOnce("X7-setup", SRC1080, TRF1080, [], null);
  log(`   📊 detect 1080p 5s (${d.secs.toFixed(1)}s): trf sha=${d.sha.slice(0, 12)}…`);
}
const VF1080b = `vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
experiment("X7", "rawvideo 1080p 5s transform ×3", 3, (i) => {
  const yuv = toRaw("X7", SRC1080, path.join(RAW, "shaky1080.yuv"), 1920, 1080, 30, 5).yuv;
  return xform2("X7", i, ["-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", "1920x1080", "-r", "30"], yuv, VF1080b, []);
});
experiment("X8", "rawvideo slovenska VP9 10s transform ×3", 3, (i) => {
  const yuv = toRaw("X8", SLOV, path.join(RAW, "slovenska10.yuv"), 1920, 1080, 25, 10).yuv;
  return xform2("X8", i, ["-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", "1920x1080", "-r", "25"], yuv, `vidstabtransform=input='${TRFSLOV}':smoothing=10:optalgo=gauss`, []);
});
// X9: detect trên rawvideo — so .trf byte + LM (không dùng framemd5).
for (const [tag, desc, yuvSrc, w, h, fps, dur, trimVf] of [
  ["X9a", "detect trên rawvideo 720p ×2", SRC720, 1280, 720, 30, 5, ""],
  ["X9b", "detect trên rawvideo slovenska 10s ×2", SLOV, 1920, 1080, 25, 10, ""],
]) {
  if (!want(tag)) continue;
  log(`\n== ${tag}. ${desc} (loadavg: ${loadAvg()}) ==`);
  const rec = { tag, desc, runs: [], comparisons: [] };
  try {
    const yuv = toRaw(tag, yuvSrc, path.join(RAW, `${tag}.yuv`), w, h, fps, dur).yuv;
    for (let i = 1; i <= 2; i++) {
      const trf = path.join(WORK, tag, `r${i}.trf`);
      fs.mkdirSync(path.join(WORK, tag), { recursive: true });
      const args = ["-v", "error", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", String(fps),
        "-i", yuv, "-vf", `vidstabdetect=result=${trf}:shakiness=5:accuracy=15:stepsize=6:mincontrast=0.3`,
        "-an", "-f", "null", "-"];
      const r = run("ffmpeg", args, `detect-raw ${tag} r${i}`);
      if (r.status !== 0) throw new Error(`detect-raw ${tag} r${i} thất bại: ${r.stderr}`);
      rec.runs.push({ trf, sha: sha256(trf), secs: r.secs });
      log(`   📊 ${tag}-r${i} (${r.secs.toFixed(1)}s): trf sha=${sha256(trf).slice(0, 12)}…`);
    }
    const c = compareTrf(rec.runs[0].trf, rec.runs[1].trf);
    rec.comparisons.push(c);
    log(`   📊 ${tag} so .trf r1↔r2: exit=${c.status}\n${c.out}`);
    rec.deterministic = rec.runs[0].sha === rec.runs[1].sha;
    log(`   📊 ${tag} KẾT LUẬN: .trf ${rec.deterministic ? "BYTE-IDENTICAL" : "KHÁC BYTE (xem so LM ở trên)"}`);
  } catch (e) { rec.error = String(e.message || e); log(`   ❌ ${tag} LỖI: ${rec.error}`); fail++; }
  record(rec); SUMMARY[tag] = rec;
}

// --- Pha 4: ma trận codec × nội dung × độ phân giải (cần transcode trước) ---
const SLOV_H264 = path.join(WORK, "slovenska-h264-10s.mp4");
const SLOV_H264_TRF = path.join(WORK, "detect-slov-h264-10s.trf");
const SHAKY_VP9 = path.join(WORK, "shaky1080-vp9-5s.webm");
const SHAKY_VP9_TRF = path.join(WORK, "detect-shaky-vp9-5s.trf");
const SLOV_VP9_720 = path.join(WORK, "slovenska-vp9-720p-10s.webm");
const SLOV_VP9_720_TRF = path.join(WORK, "detect-slov-vp9-720p-10s.trf");
function matrixSetup(tag, src, trf, vfTrim) {
  if (!fs.existsSync(trf)) {
    log(`\n== setup ${tag}: detect 1 lần trên ${path.basename(src)} ==`);
    const d = detectOnce(`${tag}-setup`, src, trf, [], vfTrim);
    log(`   📊 detect (${d.secs.toFixed(1)}s): trf sha=${d.sha.slice(0, 12)}…`);
  }
}
if (want("X10") && fs.existsSync(SLOV_H264)) {
  matrixSetup("X10", SLOV_H264, SLOV_H264_TRF, "trim=start=0:end=10,setpts=PTS-STARTPTS,");
  const VF = `trim=start=0:end=10,setpts=PTS-STARTPTS,vidstabtransform=input='${SLOV_H264_TRF}':smoothing=10:optalgo=gauss`;
  experiment("X10a", "slovenska→h264 10s transform, mặc định ×3", 3, (i) => xform2("X10a", i, [], SLOV_H264, VF, []));
  experiment("X10b", "slovenska→h264 10s transform, -threads 1 ×3", 3, (i) => xform2("X10b", i, ["-threads", "1"], SLOV_H264, VF, []));
} else if (want("X10")) log("\n== X10 BỎ QUA: chưa có transcode slovenska-h264-10s.mp4 ==");
if (want("X11") && fs.existsSync(SHAKY_VP9)) {
  matrixSetup("X11", SHAKY_VP9, SHAKY_VP9_TRF, "trim=start=0:end=5,setpts=PTS-STARTPTS,");
  const VF = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${SHAKY_VP9_TRF}':smoothing=10:optalgo=gauss`;
  experiment("X11a", "shaky1080→VP9 5s transform, mặc định ×3", 3, (i) => xform2("X11a", i, [], SHAKY_VP9, VF, []));
  experiment("X11b", "shaky1080→VP9 5s transform, -threads 1 ×3", 3, (i) => xform2("X11b", i, ["-threads", "1"], SHAKY_VP9, VF, []));
} else if (want("X11")) log("\n== X11 BỎ QUA: chưa có transcode shaky1080-vp9-5s.webm ==");
if (want("X12") && fs.existsSync(SLOV_VP9_720)) {
  matrixSetup("X12", SLOV_VP9_720, SLOV_VP9_720_TRF, "trim=start=0:end=10,setpts=PTS-STARTPTS,");
  const VF = `trim=start=0:end=10,setpts=PTS-STARTPTS,vidstabtransform=input='${SLOV_VP9_720_TRF}':smoothing=10:optalgo=gauss`;
  experiment("X12a", "slovenska→VP9 720p 10s transform, mặc định ×3", 3, (i) => xform2("X12a", i, [], SLOV_VP9_720, VF, []));
  experiment("X12b", "slovenska→VP9 720p 10s transform, -threads 1 ×3", 3, (i) => xform2("X12b", i, ["-threads", "1"], SLOV_VP9_720, VF, []));
} else if (want("X12")) log("\n== X12 BỎ QUA: chưa có transcode slovenska-vp9-720p-10s.webm ==");

// --- Pha 5: 60s tái hiện + trim 10s (nối loop) ---
experiment("X13", "60s h264 transform, -threads 1 ×3 (trf60 cố định)", 3,
  (i) => xform2("X13", i, ["-threads", "1"], SRC60, VF60, []));
const TRF60T10 = path.join(WORK, "detect-60s-trim10.trf");
if (want("X14") && !fs.existsSync(TRF60T10)) {
  log(`\n== setup X14: detect 1 lần trên trim 10s đầu của clip 60s ==`);
  const d = detectOnce("X14-setup", SRC60, TRF60T10, [], "trim=start=0:end=10,setpts=PTS-STARTPTS,");
  log(`   📊 detect trim10 (${d.secs.toFixed(1)}s): trf sha=${d.sha.slice(0, 12)}…`);
}
experiment("X14", "trim 10s đầu clip 60s (2 nối loop), transform -threads 1 ×3", 3,
  (i) => xform2("X14", i, ["-threads", "1"], SRC60, `trim=start=0:end=10,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF60T10}':smoothing=10:optalgo=gauss`, []));

// --- Pha 6: cờ còn lại + split ép non-direct + sanity ---
experiment("X16", "coded 720p transform, -thread_queue_size 8 (trước -i) ×2", 2,
  (i) => xform2("X16", i, ["-thread_queue_size", "8"], SRC720, VF720, []));
experiment("X17", "slovenska VP9 transform, -filter_threads 1 SAU -i ×3", 3,
  (i) => xform2("X17", i, [], SLOV, VFSLOV, ["-filter_threads", "1"]));
experiment("X4", "coded 720p transform ép non-direct qua split→nullsink ×3 (phụ)", 3, (i) => {
  const out = path.join(WORK, "X4", `r${i}.framemd5`);
  fs.mkdirSync(path.join(WORK, "X4"), { recursive: true });
  const fc = `[0:v]split=2[main][discard];[main]trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF720}':smoothing=10:optalgo=gauss[out];[discard]nullsink`;
  const r = run("ffmpeg", ["-v", "error", "-i", SRC720, "-filter_complex", fc, "-map", "[out]", "-an", "-f", "framemd5", "-y", out], `xform X4 r${i}`);
  if (r.status !== 0) throw new Error(`xform X4 r${i} thất bại (mã ${r.status}): ${r.stderr}`);
  return { out, sha: sha256(out), secs: r.secs };
});
experiment("X18", "coded 720p transform, -threads 1 + -filter_threads 1 ×2 (sanity)", 2,
  (i) => xform2("X18", i, ["-threads", "1"], SRC720, VF720, ["-filter_threads", "1"]));

log(`\n== test_round69_w4_vidstab_mechanism: ${pass} pass, ${fail} fail (WORK=${WORK}, loadavg cuối: ${loadAvg()}) ==`);
log("== SUMMARY (JSON) ==");
log(JSON.stringify(SUMMARY, null, 1));
writeFileEpermRetry(path.join(WORK, "summary.json"), JSON.stringify(SUMMARY, null, 1));
if (fail > 0) process.exit(1);
