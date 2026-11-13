#!/usr/bin/env node
/**
 * test_round83_k10_vidstab_race_fix.js — Phase 9 đợt 83, luồng K10.
 * (Kế thừa harness J1 đợt 82 + probe NULL/FORMAT/TPAD1/NW + poison 3-plane.)
 *
 * HARNESS HỒI QUY CHÍNH THỨC cho endpoint per-frame vidstab (thay endpoint
 * crash — crash gộp 0/270 qua 4 đợt F3/G3/H1/I1, không có power; per-frame
 * CÓ power ở 720p: I1 D720NC lệch 882/1500 frame, 58,8%, SP/CP 0/1500).
 *
 * Harness này GỘP chạy + phân tích trong một script (kế thừa setup F của
 * E3/F3/G3/H1/I1 + poison-quarantine v2e của I1), để các đợt sau chỉ cần:
 *
 *   node server/render/src/test_round82_j1_vidstab_perframe_harness.js run
 *   node server/render/src/test_round82_j1_vidstab_perframe_harness.js analyze
 *
 * 1. CHẠY (mode `run`, mặc định khi không có mode): 8 arm × n=10, xen kẽ
 *    từng vòng, taskset pin ffmpeg+hog cores 0-1, LD_PRELOAD v2e +
 *    segv_backtrace, -threads 1, showinfo cuối chuỗi filter, -v info.
 *    Khôi phục từ results.jsonl (chạy lại không chạy lại lần đã có).
 *    Mỗi lần chạy ghi: r<i>.framemd5 (md5 từng frame — nguồn chính),
 *    r<i>.stderr (showinfo — nguồn phụ: plane/checksum/mean/stdev),
 *    free-track-v2e-<ARM>-r<i>.log (poison-quarantine stats).
 *
 *    Các arm (SRC/.trf dùng chung với E3/F3/G3/H1/I1):
 *      A1080NC    1080p NOCOPY            (control — power check 1080p)
 *      C1080CP    1080p COPY              (production ref; GT family 1080)
 *      G1080CPPAD 1080p COPY+TPAD         (GT family 1080pad)
 *      P1080PAD   1080p NOCOPY+TPAD       (probe giảm nhẹ drain — J1 §3)
 *      D720NC     720p  NOCOPY            (control — endpoint chính)
 *      F720CP     720p  COPY              (production ref; GT family 720)
 *      G720CPPAD  720p  COPY+TPAD         (GT family 720pad)
 *      P720PAD    720p  NOCOPY+TPAD       (probe giảm nhẹ drain — J1 §3)
 *
 *    Probe TPAD (J1): `tpad=stop_mode=clone:stop_duration=0.2` CHÈN TRƯỚC
 *    vidstabtransform — thêm 6 frame clone sau frame cuối, để lúc decoder
 *    pool bị free ở drain/EOF thì transform vẫn còn frame clone (không
 *    thuộc pool decoder) trong cửa sổ smoothing, thay vì chỉ còn frame
 *    thật 140-149. Đo bằng endpoint per-frame: (a) frame thật 140-149
 *    còn lệch/poison không, (b) poison có dời sang vùng pad (n>=150)
 *    không, (c) tỉ lệ lệch giữa stream (n<140) có đổi không (đối chứng
 *    âm: nếu đổi thì tpad ảnh hưởng cả race giữa stream, không riêng
 *    drain). GT của family *pad lấy từ arm COPY+TPAD cùng family (cùng
 *    cấu trúc graph, chỉ khác copy) — KHÔNG so chéo family.
 *
 * 2. PHÂN TÍCH (mode `analyze`, chạy độc lập trên bất kỳ WORK nào có cùng
 *    bố cục arm/r*.framemd5/r*.stderr): GT md5 từ arm GT r1; GT showinfo
 *    bằng PHIẾU ĐA SỐ trên 10 lần chạy arm GT (I1 dùng 20 lần CP+SP;
 *    10 lần đủ vì GT đã chứng minh ổn định tuyệt đối — mọi lần CP/SP
 *    cho cùng md5 từng frame). Đếm frame lệch theo framemd5 (nguồn
 *    chính — không bị status-line xen như stderr), cross-check showinfo
 *    (plane nào lệch, ΔmeanY), phát hiện poison-like (Y-only + meanY
 *    kéo về 165, >=120 — test đúng cho filter nội suy, I1 §4.2), đếm
 *    frame hệ thống (>=8/10 run cùng Y checksum), thống kê theo vùng:
 *    mid (n<140) / drain (140<=n<150) / pad (n>=150).
 *
 *    Thống kê trung thực: frame trong cùng run KHÔNG độc lập nên Fisher
 *    gộp trên frame chỉ là cận trên; endpoint chính là PHÂN PHỐI SỐ
 *    FRAME LỆCH/RUN, so bằng permutation test chính xác (C(20,10)).
 *
 * 3. TỰ KIỂM TRA: xem test_round82_j1_perframe_harness_selfcheck.js —
 *    fixture tổng hợp (không cần ffmpeg), assert parser + poison test +
 *    permutation/Fisher trên vector đã biết.
 *
 * Env (K10): K10_WORK (mặc định ~/workspace/.scratch-r83k10/runs),
 *      K10_N=10 K10_CORES=0-1 K10_HOG=2 K10_ARMS=<danh sách, mặc định tất cả>
 *      K10_FFMPEG_STOCK=ffmpeg K10_FFMPEG_NW=<binary F3>
 * Cách chạy: node server/render/src/test_round82_j1_vidstab_perframe_harness.js [run|analyze|both]
 *   - `run`: chỉ chạy (không phân tích).
 *   - `analyze`: chỉ phân tích WORK hiện có.
 *   - `both` (mặc định): chạy rồi phân tích.
 *
 * GHI CHÚ VỀ SÓNG EPERM (10/11 ~15:48-16:20 UTC): write file trả EPERM
 * theo đợt vài giây rồi hết (kiểu sóng 09/11: "ghi 0 byte"). Chặng 1 chết
 * sau 53/80 lần vì appendFileSync ném EPERM không được bắt; một lần
 * python open(p,'w') đã truncate file này về 0 byte (write EPERM sau khi
 * open thành công) — file đã viết lại đầy đủ, kèm helper writeRetry dưới
 * đây (retry tối đa 30 lần × 2 s cho mọi điểm ghi của harness). KHÔNG dùng
 * open('w')/ghi trực tiếp không retry khi sóng EPERM đang hoạt động.
 * Cứng hóa thêm sau chặng 3 (chết sau 61 s ở hog snapshot): record/stderr/
 * summary/analysis retry 150 lần (5 phút); hog snapshot best-effort (không
 * giết lượt chạy); runOnce retry tối đa 3 lần khi ffmpeg chết vì lỗi I/O
 * (stderr có "Permission denied"/"I/O error" hoặc framemd5 thiếu/rỗng),
 * chờ 30 s giữa các lần — crash thật (segfault...) KHÔNG retry.
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
const WORK = process.env.K10_WORK || path.join(HOME, "workspace", ".scratch-r83k10", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const SRC720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.mp4";
const TRF720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.trf";
const FREE_SO = "/home/hatch/workspace/.scratch-r81i1/free_track_v2e_preload.so";
const SEGV_SO = "/home/hatch/workspace/.scratch-r76d3/runs-v2b/segv_backtrace_preload.so";
const BOTH = `${FREE_SO}:${SEGV_SO}`;
const FFMPEG_STOCK = process.env.K10_FFMPEG_STOCK || "ffmpeg";
const FFMPEG_NW = process.env.K10_FFMPEG_NW || "/home/hatch/workspace/.scratch-r78f3/ffmpeg-nw-install/bin/ffmpeg";
const CORES = process.env.K10_CORES || "0-1";
const N = parseInt(process.env.K10_N || "10", 10);
const N_HOG = parseInt(process.env.K10_HOG || "2", 10);
const LOGF = path.join(WORK, "results.jsonl");
const SUMMARYF = path.join(WORK, "summary.json");
const ANALYSISF = path.join(WORK, "analysis-perframe.json");
const HOGSNAPF = path.join(WORK, "hog-cpu-snapshots.txt");

// Ground truth sha cả file (E3/F3/G3/H1/I1) — chỉ dùng cho arm không pad.
const GT_SHA = { "1080": "d960996868d3", "720": "397ba4e1a870" };
// Chữ ký poison v2e: Y plane_checksum của mặt phẳng toàn 0xA5 (I1 §3.3).
const POISON_Y = { "1080": "E609E5EB", "720": "E7D0D7F0" };
// Vùng frame: mid <140, drain 140-149, pad >=150 (tpad thêm 6 frame).
const ZONE = (n) => (n < 140 ? "mid" : n < 150 ? "drain" : "pad");

const TPAD = "tpad=stop_mode=clone:stop_duration=0.2";
// TPAD1: đúng 1 frame pad (0.034s × 30fps = 1,02 → 1 frame; 0.033 cho 0
// frame do làm tròn xuống). Dùng để phân biệt "bảo vệ drain" với
// "giữ ref frame cuối": nếu 1 frame pad đã khử hết thì không phải
// cửa sổ drain dài, mà là ref/nhịp.
const TPAD1 = "tpad=stop_mode=clone:stop_duration=0.034";
// Probe K10 (đợt 83, theo J1 §4.3 — phân biệt 2 giả thuyết cơ chế):
//  (a) đổi pha/nhịp pull của graph: BẤT KỲ stage thêm nào cũng khử được
//      → null và format (passthrough thuần, không giữ ref, không copy)
//      cũng phải khử được.
//  (b) giữ ref / đổi quyền sở hữu buffer: chỉ stage giữ ref hoặc copy
//      mới khử được → null/format KHÔNG khử, tpad (giữ cache_stop ref
//      của frame cuối) / copy / NEEDS_WRITABLE khử được.
//  Lưu ý: filter `fifo` (J1 §4.3 đề xuất) KHÔNG còn tồn tại ở ffmpeg
//  8.1.2 (đã bỏ từ ffmpeg 7.0) — thay bằng `format=yuv420p` làm
//  passthrough thứ hai, độc lập với `null`.
function vfNocopy(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}
function vfCopy(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}
function vfPad(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,${TPAD},vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}
function vfCopyPad(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,${TPAD},vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}
function vfNull(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,null,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}
function vfFmt(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,format=yuv420p,vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}
function vfPad1(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,${TPAD1},vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}
function vfCopyPad1(trf) {
  return `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,${TPAD1},vidstabtransform=input='${trf}':smoothing=10:optalgo=gauss,showinfo`;
}

// family: nhóm GT chung (size + có pad hay không). gtArm: arm nguồn GT.
// realFrames: số frame thật để tính endpoint chính (PAD arm: 150).
const ALL_ARMS = [
  { key: "A1080NC", label: "stock 1080p NOCOPY", src: SRC1080, trf: TRF1080, vf: vfNocopy(TRF1080), size: "1080", family: "1080", gtArm: "C1080CP", realFrames: 150 },
  { key: "C1080CP", label: "stock 1080p COPY", src: SRC1080, trf: TRF1080, vf: vfCopy(TRF1080), size: "1080", family: "1080", gtArm: "C1080CP", realFrames: 150 },
  { key: "G1080CPPAD", label: "stock 1080p COPY+TPAD", src: SRC1080, trf: TRF1080, vf: vfCopyPad(TRF1080), size: "1080", family: "1080pad", gtArm: "G1080CPPAD", realFrames: 150 },
  { key: "P1080PAD", label: "stock 1080p NOCOPY+TPAD", src: SRC1080, trf: TRF1080, vf: vfPad(TRF1080), size: "1080", family: "1080pad", gtArm: "G1080CPPAD", realFrames: 150 },
  { key: "D720NC", label: "stock 720p  NOCOPY", src: SRC720, trf: TRF720, vf: vfNocopy(TRF720), size: "720", family: "720", gtArm: "F720CP", realFrames: 150 },
  { key: "F720CP", label: "stock 720p  COPY", src: SRC720, trf: TRF720, vf: vfCopy(TRF720), size: "720", family: "720", gtArm: "F720CP", realFrames: 150 },
  { key: "G720CPPAD", label: "stock 720p  COPY+TPAD", src: SRC720, trf: TRF720, vf: vfCopyPad(TRF720), size: "720", family: "720pad", gtArm: "G720CPPAD", realFrames: 150 },
  { key: "P720PAD", label: "stock 720p  NOCOPY+TPAD", src: SRC720, trf: TRF720, vf: vfPad(TRF720), size: "720", family: "720pad", gtArm: "G720CPPAD", realFrames: 150 },
  { key: "N720NULL", label: "stock 720p  NOCOPY+NULL (probe a)", src: SRC720, trf: TRF720, vf: vfNull(TRF720), size: "720", family: "720", gtArm: "F720CP", realFrames: 150 },
  { key: "M720FMT", label: "stock 720p  NOCOPY+FORMAT (probe a)", src: SRC720, trf: TRF720, vf: vfFmt(TRF720), size: "720", family: "720", gtArm: "F720CP", realFrames: 150 },
  { key: "T720PAD1", label: "stock 720p  NOCOPY+TPAD1 (probe drain/ref)", src: SRC720, trf: TRF720, vf: vfPad1(TRF720), size: "720", family: "720pad1", gtArm: "G720CPPAD1", realFrames: 150 },
  { key: "G720CPPAD1", label: "stock 720p  COPY+TPAD1", src: SRC720, trf: TRF720, vf: vfCopyPad1(TRF720), size: "720", family: "720pad1", gtArm: "G720CPPAD1", realFrames: 150 },
  // W720NW: ffmpeg tự build F3 (NEEDS_WRITABLE, đã chứng minh mức whole-sha
  // 15/15 khớp GT ở F3 §3.2) — đo lại bằng endpoint per-frame có power.
  // So trực tiếp với GT F720CP (F3 đã chứng minh NW-NC == CP output ở
  // mức whole-sha nên không cần arm CP-NW riêng; nếu W720NW lệch có hệ
  // thống thì kiểm tra lại bằng systematicFrames).
  { key: "W720NW", label: "NW-build 720p NOCOPY", src: SRC720, trf: TRF720, vf: vfNocopy(TRF720), size: "720", family: "720", gtArm: "F720CP", realFrames: 150, ffmpeg: FFMPEG_NW },
];
const WANT = (process.env.K10_ARMS || "").split(",").map((s) => s.trim()).filter(Boolean);
const ARMS = WANT.length ? ALL_ARMS.filter((a) => WANT.includes(a.key)) : ALL_ARMS;

// ---------------- tiện ích chung ----------------
// Ghi file bền vững trước sóng EPERM thoáng qua (09/11 + 10/11 ~15:48 UTC:
// write trả EPERM theo đợt vài giây rồi hết — chặng 1 chết sau 53/80 lần
// vì appendFileSync ném EPERM không được bắt). Chỉ retry lỗi ghi; hết
// retry thì ném lại như cũ (không giấu lỗi vĩnh viễn). maxAttempts mặc
// định 30 (60 s); các điểm ghi QUAN TRỌNG (record, stderr từng run,
// summary, analysis) dùng 150 (5 phút) vì sóng ON từng kéo dài ~5 phút;
// snapshot hog là best-effort (không được giết cả lượt chạy).
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
// Permutation test chính xác (2 phía) trên hiệu trung bình 2 mẫu.
function permTestExact(a, b) {
  const all = [...a, ...b];
  const n1 = a.length;
  const total = all.reduce((s, v) => s + v, 0);
  const obs = Math.abs(a.reduce((s, v) => s + v, 0) / n1 - b.reduce((s, v) => s + v, 0) / b.length);
  let extreme = 0, count = 0;
  const idx = Array.from({ length: n1 }, (_, i) => i);
  for (;;) {
    let s = 0;
    for (const i of idx) s += all[i];
    if (Math.abs(s / n1 - (total - s) / (all.length - n1)) >= obs - 1e-12) extreme++;
    count++;
    let i = n1 - 1;
    while (i >= 0 && idx[i] === all.length - n1 + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < n1; j++) idx[j] = idx[j - 1] + 1;
  }
  return { p: extreme / count, combos: count };
}

// ---------------- parser per-frame ----------------
// framemd5: "0,         64,         64,        1,  3110400, <md5>"
function parseFramemd5(p) {
  const md5s = [];
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\d+,\s*\d+,\s*\d+,\s*\d+,\s*\d+,\s*([0-9a-f]{32})\s*$/);
    if (m) md5s.push(m[1]);
  }
  return md5s;
}
// showinfo toàn văn: cho phép status-line (frame= .. fps= .. \r) xen
// giữa `type:P` và `checksum:` (tối đa 600 ký tự rác) — I1 §5.5.
// L4 §2.3 backport (đợt 85 M3): tước status-line TRƯỚC khi parse —
// status-line xen giữa stdev của frame n làm regex gán nhầm mean/
// checksum của frame n+1 cho frame n (gray-smoke2: CP frame 2 mean
// bị đọc thành 3, parse 147/150); sau sửa parse 150/150, endpoint
// md5 không đổi. Regex dùng \s+ và \[\s*...\s*\] để chịu khoảng
// trắng thừa còn lại sau khi tước.
const RE_SHOWINFO = /n:\s*(\d+) pts:\s*\d+ pts_time:[0-9.]+\s+duration:\s*\d+ duration_time:[0-9.]+\s+fmt:\S+\s+cl:\S+\s+sar:\S+\s+s:\S+\s+i:\S+\s+iskey:\d+\s+type:\S+[\s\S]{0,600}?checksum:([0-9A-F]+)\s+plane_checksum:\[\s*([0-9A-F]+)\s+([0-9A-F]+)\s+([0-9A-F]+)\s*\]\s+mean:\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]\s+stdev:\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]/g;
function parseShowinfo(p) {
  const frames = new Map();
  const text = fs.readFileSync(p, "utf8")
    // Tước status-line xen giữa: status (frame= ... fps= ...) + \r +
    // tiền tố log [Parsed_showinfo...] lặp lại — cả cụm phải đi cùng
    // nhau, nếu không tiền tố lặp còn sót lại vẫn làm vỡ trường đang parse.
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
// Test poison-like cho filter NỘI SUY (I1 §4.2): frame ĐÃ lệch theo
// framemd5, chỉ Y lệch (U/V y hệt GT), meanY kéo mạnh về poison 165
// (>=120, tức >=~40% pixel poison nếu trộn tuyến tính). Trả về null
// hoặc { poisonFrac } ước lượng tuyến tính từ meanY.
function poisonLikeTest(f, g) {
  if (!f || !g) return null;
  const yDiv = f.plane[0] !== g.plane[0];
  const uvSame = f.plane[1] === g.plane[1] && f.plane[2] === g.plane[2];
  if (!yDiv || !uvSame) return null;
  if (f.mean[0] < 120) return null;
  const p = (f.mean[0] - g.mean[0]) / (165 - g.mean[0]);
  return { poisonFrac: +p.toFixed(2) };
}
// Test poison 3-PLANE (K10, mới — J1 §5.6: test Y-only THIẾU cho 1080p vì
// U/V 1080p 518.400 byte > TRACK_MIN nên CŨNG bị poison; J1 r8/r10 n=148
// post-hoc). Đăng ký TRƯỚC endpoint: frame n=148 có plane poison.
// Định nghĩa: frame ĐÃ lệch theo framemd5, có ≥1 plane p thỏa cả 4 điều
// kiện: f.mean[p] >= 150, f.stdev[p] < 25, g.mean[p] < 150 (GT không
// phải vùng sáng ~165), và mean đã đi được ít nhất nửa đường tới 165
// ((165-f.mean[p]) <= 0.5*(165-g.mean[p])). Đây là test POISON NẶNG
// (frac ~0,9–1,0 — đúng 2 ca J1 r8/r10 n=148); poison một phần nhẹ
// (mean 120–150, stdev ~30 như J1 r5 720p) do test Y-only poisonLike
// bắt (Y), chroma một phần nhẹ test này có thể bỏ sót — ghi rõ giới hạn.
function poisonAnyTest(f, g) {
  if (!f || !g) return null;
  const planes = [];
  let frac = 0;
  for (let p = 0; p < 3; p++) {
    if (f.mean[p] >= 150 && f.stdev[p] < 25 && g.mean[p] < 150 &&
        (165 - f.mean[p]) <= 0.5 * (165 - g.mean[p])) {
      planes.push(p);
      frac = Math.max(frac, (f.mean[p] - g.mean[p]) / (165 - g.mean[p]));
    }
  }
  if (!planes.length) return null;
  return { planes, poisonFrac: +frac.toFixed(2) };
}
// Test poison strict (chỉ để tham chiếu — I1 chứng minh nó cho 0 vì
// transform nội suy, không copy verbatim): Y == solid-poison.
function poisonStrictTest(f, size) {
  if (!f) return false;
  return f.plane[0] === POISON_Y[size] && Math.abs(f.mean[0] - 165) < 3 && f.stdev[0] < 2;
}

// ---------------- chạy ----------------
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
function hogCpuSnapshot(tag) {
  const pids = hogs.map((h) => h.pid).join(",");
  let out = "(không đọc được ps)";
  try {
    out = execSync(`ps -o pid=,pcpu=,psr=,comm= -p ${pids}`, { encoding: "utf8", timeout: 10000 }).trim();
  } catch (e) { out = `(ps lỗi: ${e.message})`; }
  const line = `[${new Date().toISOString()}] ${tag} loadavg=${loadAvgStr()}\n${out}\n`;
  // Best-effort: snapshot không ghi được (sóng EPERM) thì bỏ qua, không
  // được giết cả lượt chạy — chặng 3 chết đúng ở đây (60 s retry rồi ném).
  try { fs.appendFileSync(HOGSNAPF, line); }
  catch (e) { log(`   ⚠️  hog snapshot (${tag}) không ghi được (${e.code || e.message}) — bỏ qua`); }
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
function lastMatch(re, s) {
  let m = null, cur;
  re.lastIndex = 0;
  while ((cur = re.exec(s)) !== null) m = cur;
  return m ? parseInt(m[1], 10) : null;
}
function runOnce(arm, idx) {
  const outDir = path.join(WORK, arm.key);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `r${idx}.framemd5`);
  const errFile = path.join(outDir, `r${idx}.stderr`);
  const freeLog = path.join(WORK, `free-track-v2e-${arm.key}-r${idx}.log`);
  try { fs.unlinkSync(freeLog); } catch { /* chưa có */ }
  const args = ["-threads", "1", "-v", "info", "-i", arm.src, "-vf", arm.vf, "-an", "-f", "framemd5", "-y", out];
  // Retry khi ffmpeg chết vì lỗi I/O (sóng EPERM): ffmpeg ghi framemd5
  // dần trong lúc chạy — sóng ON giữa run sẽ giết run đó. Nhận diện bằng
  // stderr chứa "Permission denied"/"I/O error" hoặc framemd5 thiếu/rỗng
  // trong khi ffmpeg thoát lỗi. Tối đa 3 lần, chờ 30 s giữa các lần (đợi
  // sóng tắt). Crash thật (segfault...) KHÔNG retry — ghi nhận như cũ.
  let r, stderr, secs, attempts = 0;
  const ffbin = arm.ffmpeg || FFMPEG_STOCK;
  for (;;) {
    attempts++;
    const t0 = Date.now();
    r = spawnSync("taskset", ["-c", CORES, ffbin, ...args], {
      stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
      env: { ...process.env, LD_PRELOAD: BOTH, FREE_TRACK_LOG: freeLog },
    });
    secs = (Date.now() - t0) / 1000;
    stderr = (r.stderr || "").toString();
    const outExists = fs.existsSync(out);
    const outSize = outExists ? fs.statSync(out).size : 0;
    const ioFail = (r.status !== 0 || r.signal !== null || outSize === 0) &&
      (/Permission denied/i.test(stderr) || /I\/O error/i.test(stderr) || outSize === 0);
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
  const sha = exists && size > 0 ? sha256(out) : null;
  const crashed = r.status !== 0 || r.signal !== null || size === 0;
  const regs = stderr.match(/regs: RIP=0x([0-9a-f]+) RDI=0x([0-9a-f]+) RSI=0x([0-9a-f]+) RDX=0x([0-9a-f]+)/);
  const faultM = stderr.match(/fault addr=0x([0-9a-f]+)/);
  const rdi = regs ? `0x${regs[2]}` : null;
  const fault = faultM ? `0x${faultM[1]}` : null;
  const freeLogText = fs.existsSync(freeLog) ? fs.readFileSync(freeLog, "utf8") : "";
  const ev = parseFreeLog(freeLogText);
  const statsM = freeLogText.match(/\[free_track_v2e\] === stats quarantined=(\d+) evicted=(\d+) peakQuarantineBytes=(\d+) ===/);
  const nEvict = (freeLogText.match(/\[free_track_v2e\] EVICT/g) || []).length;
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
    arm: arm.key, i: idx, ffmpeg: ffbin, status: r.status, signal: r.signal || null,
    error: r.error ? String(r.error) : null,
    size, sha: sha ? sha.slice(0, 12) : null, secs: +secs.toFixed(1),
    loadavg: loadAvgStr(), cores: CORES, crash: crashed,
    lastFrame: lastMatch(/\[Parsed_showinfo[^\]]*\] n:\s*(\d+)/g, stderr),
    rdi, fault, rdiFreed, rdiFreedDetail,
    nFree: ev.filter((e) => e.kind === "FREE").length,
    nAlloc: ev.filter((e) => e.kind.startsWith("ALLOC")).length,
    nFreeLarge: ev.filter((e) => e.kind === "FREE" && e.size >= 1000000).length,
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
function summarizeRuns(all) {
  const byArm = {};
  for (const a of ARMS) {
    const rs = all.filter((r) => r.arm === a.key);
    const crashes = rs.filter((r) => r.crash);
    const shas = rs.filter((r) => !r.crash).reduce((m, r) => { m[r.sha] = (m[r.sha] || 0) + 1; return m; }, {});
    const gt = GT_SHA[a.size];
    const gtCount = rs.filter((r) => !r.crash && r.sha === gt).length;
    byArm[a.key] = {
      label: a.label, n: rs.length, crashes: crashes.length,
      wilson95: wilson(crashes.length, rs.length),
      shaDistinct: Object.keys(shas).length, shas,
      gtWholeSha: a.family.endsWith("pad") ? "(không áp dụng — arm có pad)" : `${gtCount}/${rs.filter((r) => !r.crash).length}`,
      medianSecs: median(rs.map((r) => r.secs)),
      medianNFreeLarge: median(rs.map((r) => r.nFreeLarge)),
      medianQuarantined: median(rs.map((r) => r.quarantined).filter((v) => v !== null)),
      medianEvicted: median(rs.map((r) => r.evicted).filter((v) => v !== null)),
      medianPeakQuarantineBytes: median(rs.map((r) => r.peakQuarantineBytes).filter((v) => v !== null)),
      runsMissingStats: rs.filter((r) => r.quarantined === null).length,
      crashLastFrames: crashes.map((r) => r.lastFrame),
      crashRdiFreed: crashes.map((r) => r.rdiFreed),
    };
  }
  return byArm;
}
function runAll() {
  log(`== Đợt 83 K10 — harness per-frame vidstab + probe giảm race (cores=${CORES}), ${ARMS.length} arm × n=${N} ==`);
  log(`   WORK=${WORK} (arms=${ARMS.map((a) => a.key).join(",")})`);
  log(`   stock ffmpeg  : ${FFMPEG_STOCK}`);
  for (const p of [SRC1080, TRF1080, SRC720, TRF720, FREE_SO, SEGV_SO]) {
    if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
  if (ARMS.some((a) => a.ffmpeg) && !fs.existsSync(FFMPEG_NW)) { log(`   ❌ thiếu binary NW: ${FFMPEG_NW}`); process.exit(2); }
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
  const byArm = summarizeRuns(all);
  writeFileRetry(SUMMARYF, JSON.stringify({
    done: true,
    method: "setup F + taskset pin ffmpeg+hog cores K10_CORES + LD_PRELOAD free_track_v2e (poison-quarantine) + segv_backtrace, showinfo + -v info, -threads 1, xen ke tung vong, khong dung o crash dau; ffmpeg stock 8.1.2 + ffmpeg NW-build F3 cho arm W720NW; probe K10: NULL/FORMAT/TPAD1/NW",
    stockFfmpeg: FFMPEG_STOCK, cores: CORES, nPerArm: N, hogs: N_HOG, byArm,
  }, null, 1), 150);
  log(`== K10 CHẠY XONG (tóm tắt sha/crash) ==`);
  for (const a of ARMS) {
    const b = byArm[a.key];
    log(`   ${a.key} (${a.label}): ${b.crashes}/${b.n} crash Wilson95=${JSON.stringify(b.wilson95)} sha-khac-nhau=${b.shaDistinct} sha==GT ${b.gtWholeSha} median=${b.medianSecs}s quarantine-trung-vi=${b.medianQuarantined} evicted=${b.medianEvicted} peakBytes=${b.medianPeakQuarantineBytes} (thieu-stats ${b.runsMissingStats}/${b.n})`);
  }
  log(`== xong (WORK=${WORK}) ==`);
  return byArm;
}

// ---------------- phân tích ----------------
function buildGt(workDir, gtArmKey, size, nRuns) {
  const gtMd5 = parseFramemd5(path.join(workDir, gtArmKey, "r1.framemd5"));
  const vote = new Map();
  for (let i = 1; i <= nRuns; i++) {
    const p = path.join(workDir, gtArmKey, `r${i}.stderr`);
    if (!fs.existsSync(p)) continue;
    const show = parseShowinfo(p);
    for (const [n, f] of show) {
      if (!vote.has(n)) vote.set(n, new Map());
      const m = vote.get(n);
      const key = JSON.stringify(f);
      if (!m.has(key)) m.set(key, { count: 0, sample: f });
      m.get(key).count++;
    }
  }
  const gtShow = new Map();
  for (const [n, m] of vote) {
    let best = null;
    for (const v of m.values()) if (!best || v.count > best.count) best = v;
    gtShow.set(n, best.sample);
  }
  return { gtMd5, gtShow };
}
function analyzeArm(workDir, arm, gt) {
  const size = arm.size;
  const runs = [];
  let gtStable = true;
  for (let i = 1; i <= N; i++) {
    const md5Path = path.join(workDir, arm.key, `r${i}.framemd5`);
    const errPath = path.join(workDir, arm.key, `r${i}.stderr`);
    if (!fs.existsSync(md5Path)) { runs.push({ i, missing: true }); continue; }
    const md5s = parseFramemd5(md5Path);
    const show = fs.existsSync(errPath) ? parseShowinfo(errPath) : new Map();
    const div = [];
    const divReal = [];
    const divPad = [];
    const divPlane = { Y: 0, U: 0, V: 0 };
    const divMeanYDelta = [];
    const divYck = {};
    const poisonLike = [];
    const poisonLikePad = [];
    const poisonStrict = [];
    const poisonAny = [];
    const poisonAnyPad = [];
    const yOnly = [];
    const zoneDiv = { mid: 0, drain: 0, pad: 0 };
    for (let n = 0; n < md5s.length; n++) {
      if (md5s[n] !== gt.gtMd5[n]) {
        div.push(n);
        zoneDiv[ZONE(n)]++;
        if (n < arm.realFrames) divReal.push(n); else divPad.push(n);
      }
    }
    let divShow = 0, showMissing = 0;
    for (let n = 0; n < md5s.length; n++) {
      const f = show.get(n), g = gt.gtShow.get(n);
      if (!f || !g) { showMissing++; continue; }
      if (md5s[n] !== gt.gtMd5[n]) divYck[n] = f.plane[0];
      if (f.checksum !== g.checksum) {
        divShow++;
        if (f.plane[0] !== g.plane[0]) divPlane.Y++;
        if (f.plane[1] !== g.plane[1]) divPlane.U++;
        if (f.plane[2] !== g.plane[2]) divPlane.V++;
        divMeanYDelta.push(+(f.mean[0] - g.mean[0]).toFixed(1));
        if (md5s[n] !== gt.gtMd5[n]) {
          if (poisonStrictTest(f, size)) poisonStrict.push(n);
          const pa = poisonAnyTest(f, g);
          if (pa) {
            const rec = { n, planes: pa.planes, mean: f.mean, stdev: f.stdev, gtMean: g.mean, poisonFrac: pa.poisonFrac };
            if (n < arm.realFrames) poisonAny.push(rec); else poisonAnyPad.push(rec);
          }
          const yDiv = f.plane[0] !== g.plane[0];
          const uvSame = f.plane[1] === g.plane[1] && f.plane[2] === g.plane[2];
          if (yDiv && uvSame) {
            yOnly.push(n);
            const pl = poisonLikeTest(f, g);
            if (pl) {
              const rec = { n, meanY: f.mean[0], stdevY: f.stdev[0], gtStdevY: g.stdev[0], poisonFrac: pl.poisonFrac };
              if (n < arm.realFrames) poisonLike.push(rec); else poisonLikePad.push(rec);
            }
          }
        }
      }
    }
    if (arm.key === arm.gtArm && div.length > 0) {
      gtStable = false;
      log(`   ⚠️  GT KHÔNG ỔN ĐỊNH: ${arm.key}/r${i} lệch ${div.length} frame md5: [${div.join(",")}]`);
    }
    runs.push({
      i, nFrames: md5s.length, nDiv: div.length, div,
      nDivReal: divReal.length, divReal, nDivPad: divPad.length, divPad,
      divShow, showMissing, divPlane, divMeanYDelta, divYck,
      poisonLike, poisonLikePad, poisonStrict, poisonAny, poisonAnyPad, yOnly, zoneDiv,
    });
  }
  const okRuns = runs.filter((r) => !r.missing);
  const counts = okRuns.map((r) => r.nDiv);
  const countsReal = okRuns.map((r) => r.nDivReal);
  const countsPad = okRuns.map((r) => r.nDivPad);
  const totalDiv = counts.reduce((a, b) => a + b, 0);
  const totalDivReal = countsReal.reduce((a, b) => a + b, 0);
  const totalDivPad = countsPad.reduce((a, b) => a + b, 0);
  const totalFrames = okRuns.reduce((a, r) => a + r.nFrames, 0);
  const totalRealFrames = okRuns.reduce((a, r) => a + Math.min(r.nFrames, arm.realFrames), 0);
  const totalPadFrames = okRuns.reduce((a, r) => a + Math.max(0, r.nFrames - arm.realFrames), 0);
  const zoneTotal = okRuns.reduce((o, r) => ({ mid: o.mid + r.zoneDiv.mid, drain: o.drain + r.zoneDiv.drain, pad: o.pad + r.zoneDiv.pad }), { mid: 0, drain: 0, pad: 0 });
  const allMeanYDelta = okRuns.flatMap((r) => r.divMeanYDelta);
  const planeTotal = okRuns.reduce((o, r) => ({ Y: o.Y + r.divPlane.Y, U: o.U + r.divPlane.U, V: o.V + r.divPlane.V }), { Y: 0, U: 0, V: 0 });
  const poisonLikeTotal = okRuns.reduce((a, r) => a + r.poisonLike.length, 0);
  const poisonLikePadTotal = okRuns.reduce((a, r) => a + r.poisonLikePad.length, 0);
  const poisonAnyTotal = okRuns.reduce((a, r) => a + r.poisonAny.length, 0);
  const poisonAnyPadTotal = okRuns.reduce((a, r) => a + r.poisonAnyPad.length, 0);
  const poisonAnyFrames = okRuns.flatMap((r) => r.poisonAny.map((p) => `r${r.i}:n${p.n} planes=${JSON.stringify(p.planes)} mean=${JSON.stringify(p.mean)} stdev=${JSON.stringify(p.stdev)} (GT mean=${JSON.stringify(p.gtMean)}) poisonFrac~${p.poisonFrac}`));
  const poisonAnyPadFrames = okRuns.flatMap((r) => r.poisonAnyPad.map((p) => `r${r.i}:n${p.n} planes=${JSON.stringify(p.planes)} mean=${JSON.stringify(p.mean)} stdev=${JSON.stringify(p.stdev)} (GT mean=${JSON.stringify(p.gtMean)}) poisonFrac~${p.poisonFrac}`));
  // Endpoint đăng ký TRƯỚC (K10): frame n=148 có plane poison (chế độ b).
  const poisonAnyN148Runs = okRuns.filter((r) => r.poisonAny.some((p) => p.n === 148)).map((r) => r.i);
  const poisonAnyN148Frames = okRuns.flatMap((r) => r.poisonAny.filter((p) => p.n === 148).map((p) => `r${r.i}:n148 planes=${JSON.stringify(p.planes)} mean=${JSON.stringify(p.mean)} stdev=${JSON.stringify(p.stdev)} poisonFrac~${p.poisonFrac}`));
  const poisonLikeFrames = okRuns.flatMap((r) => r.poisonLike.map((p) => `r${r.i}:n${p.n} meanY=${p.meanY} stdevY=${p.stdevY} (GT ${p.gtStdevY}) poisonFrac~${p.poisonFrac}`));
  const poisonLikePadFrames = okRuns.flatMap((r) => r.poisonLikePad.map((p) => `r${r.i}:n${p.n} meanY=${p.meanY} stdevY=${p.stdevY} (GT ${p.gtStdevY}) poisonFrac~${p.poisonFrac}`));
  const poisonStrictTotal = okRuns.reduce((a, r) => a + r.poisonStrict.length, 0);
  const yOnlyTotal = okRuns.reduce((a, r) => a + r.yOnly.length, 0);
  const sysByN = {};
  for (const r of okRuns) {
    for (const n of Object.keys(r.divYck).map(Number)) {
      if (!sysByN[n]) sysByN[n] = {};
      const ck = r.divYck[n];
      sysByN[n][ck] = (sysByN[n][ck] || 0) + 1;
    }
  }
  const systematicFrames = Object.entries(sysByN)
    .map(([n, m]) => {
      const [ck, cnt] = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
      return { n: +n, modalYck: ck, runs: cnt };
    })
    .filter((s) => s.runs >= 8);
  return {
    arm: arm.key, size, family: arm.family, gtArm: arm.gtArm, gtStable,
    nRuns: okRuns.length, missingRuns: runs.filter((r) => r.missing).length,
    totalDiv, totalFrames, rate: totalFrames ? +(totalDiv / totalFrames).toFixed(4) : null,
    totalDivReal, totalRealFrames,
    rateReal: totalRealFrames ? +(totalDivReal / totalRealFrames).toFixed(4) : null,
    totalDivPad, totalPadFrames,
    ratePad: totalPadFrames ? +(totalDivPad / totalPadFrames).toFixed(4) : null,
    medianDivPerRun: median(counts), meanDivPerRun: okRuns.length ? +(totalDiv / okRuns.length).toFixed(2) : null,
    minDivPerRun: counts.length ? Math.min(...counts) : null, maxDivPerRun: counts.length ? Math.max(...counts) : null,
    divPerRun: counts,
    medianDivRealPerRun: median(countsReal), meanDivRealPerRun: okRuns.length ? +(totalDivReal / okRuns.length).toFixed(2) : null,
    minDivRealPerRun: countsReal.length ? Math.min(...countsReal) : null, maxDivRealPerRun: countsReal.length ? Math.max(...countsReal) : null,
    divRealPerRun: countsReal, divPadPerRun: countsPad,
    zoneTotal, planeTotal,
    poisonLikeTotal, poisonLikeFrames, poisonLikePadTotal, poisonLikePadFrames,
    poisonStrictTotal, yOnlyTotal, systematicFrames,
    poisonAnyTotal, poisonAnyFrames, poisonAnyPadTotal, poisonAnyPadFrames,
    poisonAnyN148Runs, poisonAnyN148Frames,
    divMeanYDelta: { n: allMeanYDelta.length, median: median(allMeanYDelta), min: allMeanYDelta.length ? Math.min(...allMeanYDelta) : null, max: allMeanYDelta.length ? Math.max(...allMeanYDelta) : null },
    showinfoCrossCheck: okRuns.map((r) => ({ i: r.i, md5Div: r.nDiv, showDiv: r.divShow, showMissing: r.showMissing })),
    runs: okRuns,
  };
}
function analyzeWork(workDir) {
  workDir = workDir || WORK;
  log(`== K10 phân tích per-frame (WORK=${workDir}) ==`);
  const families = {};
  for (const arm of ARMS) {
    if (!families[arm.family]) {
      const gt = buildGt(workDir, arm.gtArm, arm.size, N);
      families[arm.family] = { gt, gtArmKey: arm.gtArm, size: arm.size };
      log(`   GT family ${arm.family}: ${gt.gtMd5.length} frame md5 (từ ${arm.gtArm}/r1) + ${gt.gtShow.size} frame showinfo (đa số ${N} lần ${arm.gtArm})`);
    }
  }
  const perArm = {};
  for (const arm of ARMS) {
    const fam = families[arm.family];
    perArm[arm.key] = analyzeArm(workDir, arm, fam.gt);
    const p = perArm[arm.key];
    log(`   ${arm.key}: lệch ${p.totalDiv}/${p.totalFrames} frame (tỉ lệ ${p.rate}) | ` +
      `frame thật ${p.totalDivReal}/${p.totalRealFrames} (tỉ lệ ${p.rateReal}), mỗi run trung vị ${p.medianDivRealPerRun} (min-max ${p.minDivRealPerRun}-${p.maxDivRealPerRun}) | ` +
      `vùng pad ${p.totalDivPad}/${p.totalPadFrames} | vùng mid/drain/pad: ${p.zoneTotal.mid}/${p.zoneTotal.drain}/${p.zoneTotal.pad} | ` +
      `plane lệch Y/U/V: ${p.planeTotal.Y}/${p.planeTotal.U}/${p.planeTotal.V} | ΔmeanY trung vị ${p.divMeanYDelta.median} (min ${p.divMeanYDelta.min}, max ${p.divMeanYDelta.max}) | ` +
      `POISON-LIKE thật: ${p.poisonLikeTotal} ${JSON.stringify(p.poisonLikeFrames)} | POISON-LIKE pad: ${p.poisonLikePadTotal} ${JSON.stringify(p.poisonLikePadFrames)} | POISON-ANY(3-plane) thật: ${p.poisonAnyTotal} ${JSON.stringify(p.poisonAnyFrames)} | POISON-ANY pad: ${p.poisonAnyPadTotal} ${JSON.stringify(p.poisonAnyPadFrames)} | POISON-ANY n148 (endpoint đăng ký trước): ${p.poisonAnyN148Runs.length} run ${JSON.stringify(p.poisonAnyN148Runs)} ${JSON.stringify(p.poisonAnyN148Frames)} | POISON strict: ${p.poisonStrictTotal} | Y-only: ${p.yOnlyTotal} | frame hệ thống (>=8/10): ${p.systematicFrames.length} | GT ổn định: ${p.gtStable}`);
  }
  // So sánh: endpoint chính = số frame lệch THẬT / run (PAD arm chỉ tính 150 frame thật).
  const pairs = [
    ["C1080CP", "A1080NC", "1080p CP-vs-NC (power check 1080p)"],
    ["F720CP", "D720NC", "720p CP-vs-NC (endpoint chính)"],
    ["P1080PAD", "A1080NC", "1080p PAD-vs-NC (probe drain, frame thật)"],
    ["P720PAD", "D720NC", "720p PAD-vs-NC (probe drain, frame thật)"],
    ["P1080PAD", "C1080CP", "1080p PAD-vs-CP (probe drain, frame thật)"],
    ["P720PAD", "F720CP", "720p PAD-vs-CP (probe drain, frame thật)"],
    // Cặp K10 (đợt 83) — A/B biện pháp giảm race, endpoint chính như J1.
    ["N720NULL", "D720NC", "720p NULL-vs-NC (probe a: passthrough thuần)"],
    ["M720FMT", "D720NC", "720p FORMAT-vs-NC (probe a: passthrough thứ hai)"],
    ["T720PAD1", "D720NC", "720p TPAD1-vs-NC (probe drain/ref: 1 frame pad)"],
    ["W720NW", "D720NC", "720p NW-vs-NC (NEEDS_WRITABLE, per-frame)"],
    ["N720NULL", "F720CP", "720p NULL-vs-CP"],
    ["M720FMT", "F720CP", "720p FORMAT-vs-CP"],
    ["T720PAD1", "G720CPPAD1", "720p TPAD1-vs-CPPAD1"],
    ["W720NW", "F720CP", "720p NW-vs-CP"],
  ];
  const comparisons = [];
  for (const [x, y, note] of pairs) {
    const a = perArm[x], b = perArm[y];
    if (!a || !b) continue;
    const fisherReal = fisher2(a.totalDivReal, a.totalRealFrames - a.totalDivReal, b.totalDivReal, b.totalRealFrames - b.totalDivReal);
    const perm = permTestExact(a.divRealPerRun, b.divRealPerRun);
    comparisons.push({
      pair: `${x}-vs-${y}`, note,
      frameDivergentReal: `${x} ${a.totalDivReal}/${a.totalRealFrames} vs ${y} ${b.totalDivReal}/${b.totalRealFrames}`,
      fisherRealPooledTwoSided: +fisherReal.toExponential(3),
      permTestPerRunRealTwoSided: { p: +perm.p.toExponential(3), combos: perm.combos },
      noteStats: "Fisher gộp: cận trên (frame trong run tương quan). Permutation trên số frame lệch THẬT/run là endpoint chính.",
    });
    log(`   ${x}-vs-${y} (${note}): frame thật Fisher p=${fisherReal.toExponential(3)} | permutation per-run p=${perm.p.toExponential(3)} (${perm.combos} hoán vị)`);
  }
  const out = {
    source: "J1 harness per-frame: framemd5 chính + showinfo phụ, GT = arm COPY cùng family (md5 r1 + showinfo đa số N lần)",
    workDir, nPerArm: N,
    perArm, comparisons,
  };
  writeFileRetry(ANALYSISF, JSON.stringify(out, null, 1), 150);
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
module.exports = {
  parseFramemd5, parseShowinfo, poisonLikeTest, poisonAnyTest, poisonStrictTest,
  permTestExact, fisher2, wilson, median, logComb, ZONE, POISON_Y,
  buildGt, analyzeArm, analyzeWork, ALL_ARMS,
};
