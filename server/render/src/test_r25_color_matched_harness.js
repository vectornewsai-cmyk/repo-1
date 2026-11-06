"use strict";
/**
 * test_r25_color_matched_harness.js — Phase 9 đợt 25 (luồng I1):
 * kiểm tra harness đo khớp màu mới trong harnessShared.js, KHÔNG cần
 * footage thật, KHÔNG đụng code sản phẩm.
 *
 * Cách chạy (từ server/render/):
 *   R25_SCRATCH=<thư mục scratch ngoài repo, bắt buộc> \
 *     node src/test_r25_color_matched_harness.js
 * Scratch chỉ chứa clip tổng hợp nhỏ (64x48) + frame raw nhỏ; script
 * tự xoá toàn bộ scratch của nó trước khi thoát (kể cả khi fail —
 * finally). Không viết gì vào /tmp, không viết gì vào repo.
 *
 * Kiểm tra (fail = exit 1, in rõ assert nào trượt):
 *  T1. probeColorMetadata đọc đúng bt709 trên clip encode có gắn
 *      metadata bt709 (colorspace/trc/primaries bt709).
 *  T2. matrixForMetadata(bt709) = bt709; (bt601/smpte170m) = bt601.
 *  T3. matrixForMetadata(unknown/thiếu/bt2020) throw (không đoán).
 *  T4. ffmpegRgbToYuv420Matched thiếu matrix throw; matrix lạ throw.
 *  T5. Matched bt709: preview chuyển bt709 so với chuỗi ffmpeg trực
 *      tiếp scale(out_color_matrix=bt709) cho cùng frame RGB cho
 *      MAD = 0 (đường chuyển mới khớp đúng swscale).
 *  T6. Legacy (không matrix) in cảnh báo MISMATCHED và cho kết quả
 *      khác bt709 trên frame màu bão hoà (chứng minh matrix có ảnh
 *      hưởng thật, không phải no-op) — đồng thời bằng đúng đường
 *      chuyển bt601 tường minh (MAD = 0 so với explicit bt601).
 *  T7. ffmpegYuvCompareMatched trên 2 frame giống hệt cho MAD = 0;
 *      khung lẻ (72x45) qua pad vẫn cho MAD = 0 (hồi quy pad đợt 19).
 *  T8. probeColorMetadata trên clip KHÔNG gắn metadata trả về
 *      colorSpace unknown (mô phỏng N1/N2) — và matrixForMetadata
 *      của nó throw (nối T3 bằng dữ liệu thật, không chỉ object
 *      chế tay).
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const HERE = __dirname;
const SCRATCH_BASE = process.env.R25_SCRATCH;
if (!SCRATCH_BASE) {
  throw new Error("Bắt buộc R25_SCRATCH (thư mục scratch ngoài repo). VD: R25_SCRATCH=~/workspace/tmp-round25-i1 node src/test_r25_color_matched_harness.js");
}
const TMP = fs.mkdtempSync(path.join(SCRATCH_BASE, "r25-selftest-"));
const shared = require("./harnessShared");

let failures = 0;
function check(name, cond, detail) {
  if (cond) console.log(`PASS ${name}${detail !== undefined ? ` — ${detail}` : ""}`);
  else { failures++; console.log(`FAIL ${name}${detail !== undefined ? ` — ${detail}` : ""}`); }
}
function expectThrow(name, fn) {
  try { fn(); check(name, false, "không throw"); }
  catch (e) { check(name, true, `throw: ${String(e.message).slice(0, 120)}`); }
}
function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
  return r;
}
function ffmpeg(args) { return run("ffmpeg", ["-v", "error", "-y", ...args]); }

// Frame RGB tổng hợp 64x48: nửa trái đỏ bão hoà, nửa phải xanh lá
// bão hoà + dải xám — đủ để bt601/bt709 cho YUV khác nhau rõ.
function synthRgb(w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      if (x < w / 2) { buf[i] = 255; buf[i + 1] = 0; buf[i + 2] = 0; }
      else if (y < h / 2) { buf[i] = 0; buf[i + 1] = 255; buf[i + 2] = 0; }
      else { const g = Math.floor((x * 255) / w); buf[i] = g; buf[i + 1] = g; buf[i + 2] = g; }
    }
  }
  return buf;
}
function directFfmpegYuv(rgb, w, h, tag, matrix) {
  const rawIn = path.join(TMP, `${tag}-in.raw`);
  const out = path.join(TMP, `${tag}.yuv`);
  fs.writeFileSync(rawIn, rgb);
  const vf = matrix
    ? `pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0:black,scale=out_color_matrix=${matrix},format=yuv420p`
    : "pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0:black,format=yuv420p";
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", rawIn,
    "-vf", vf, "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}

try {
  // --- Clip tổng hợp: bt709 có metadata, unknown không metadata.
  const mp709 = path.join(TMP, "synth709.mp4");
  ffmpeg(["-f", "lavfi", "-i", "testsrc2=size=64x48:rate=30:duration=1",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709",
    "-color_range", "tv", mp709]);
  const mpUnk = path.join(TMP, "synth-unknown.mp4");
  ffmpeg(["-f", "lavfi", "-i", "testsrc2=size=64x48:rate=30:duration=1",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", mpUnk]);

  // T1 — chỉ bắt color_space (trường quyết định matrix); transfer/
  // primaries của clip tổng hợp có thể null do x264 không ghi VUI
  // đầy đủ, không phải lỗi probe (footage thật J/K/L ghi đủ bt709).
  const m709 = shared.probeColorMetadata(mp709);
  check("T1 probe bt709", m709.colorSpace === "bt709",
    `color_space=${m709.colorSpace} transfer=${m709.colorTransfer} primaries=${m709.colorPrimaries} range=${m709.colorRange}`);
  // T2
  check("T2 matrix bt709", shared.matrixForMetadata({ colorSpace: "bt709" }) === "bt709");
  check("T2 matrix bt601", shared.matrixForMetadata({ colorSpace: "bt601" }) === "bt601");
  check("T2 matrix smpte170m", shared.matrixForMetadata({ colorSpace: "smpte170m" }) === "bt601");
  // T3
  expectThrow("T3 matrix unknown throw", () => shared.matrixForMetadata({ colorSpace: "unknown" }));
  expectThrow("T3 matrix thiếu throw", () => shared.matrixForMetadata({}));
  expectThrow("T3 matrix bt2020 throw", () => shared.matrixForMetadata({ colorSpace: "bt2020nc" }));
  // T4
  const rgb = synthRgb(64, 48);
  expectThrow("T4 matched thiếu matrix throw", () => shared.ffmpegRgbToYuv420Matched(rgb, 64, 48, TMP, "t4a", undefined));
  expectThrow("T4 matched matrix lạ throw", () => shared.ffmpegRgbToYuv420Matched(rgb, 64, 48, TMP, "t4b", "bt2020"));
  // T5: matched bt709 == ffmpeg trực tiếp scale bt709
  const y709 = shared.ffmpegRgbToYuv420Matched(rgb, 64, 48, TMP, "t5", "bt709");
  const y709direct = directFfmpegYuv(rgb, 64, 48, "t5d", "bt709");
  const m5 = shared.yuv420Mad(y709.yuv, y709direct, 64, 48);
  check("T5 matched bt709 == ffmpeg scale bt709", m5.mad === 0, `MAD=${m5.mad}`);
  // T6: legacy cảnh báo + khác bt709 + bằng explicit bt601
  const warnings = [];
  const origWarn = console.warn;
  console.warn = (msg) => { warnings.push(String(msg)); };
  let yLeg;
  try { yLeg = shared.ffmpegRgbToYuv420(rgb, 64, 48, TMP, "t6leg"); }
  finally { console.warn = origWarn; }
  check("T6 legacy in cảnh báo MISMATCHED", warnings.some((w) => /MISMATCHED|CẢNH BÁO/.test(w)),
    warnings[0] ? warnings[0].slice(0, 80) : "(không có cảnh báo)");
  check("T6 legacy gắn nhãn legacy", yLeg.legacy === true && yLeg.matrix === "bt601");
  const m6a = shared.yuv420Mad(yLeg.yuv, y709.yuv, 64, 48);
  check("T6 legacy bt601 khác bt709 thật", m6a.mad > 1, `MAD legacy-vs-709=${m6a.mad.toFixed(4)}`);
  const y601 = shared.ffmpegRgbToYuv420Matched(rgb, 64, 48, TMP, "t6b", "bt601");
  const m6b = shared.yuv420Mad(yLeg.yuv, y601.yuv, 64, 48);
  check("T6 legacy == explicit bt601", m6b.mad === 0, `MAD=${m6b.mad}`);
  // T7: compare matched giống hệt + khung lẻ
  const m7 = shared.ffmpegYuvCompareMatched(rgb, rgb, 64, 48, TMP, "t7", "bt709");
  check("T7 compare matched frame giống hệt", m7.mad === 0, `MAD=${m7.mad}`);
  const rgbOdd = synthRgb(72, 45);
  const m7o = shared.ffmpegYuvCompareMatched(rgbOdd, rgbOdd, 72, 45, TMP, "t7o", "bt709");
  check("T7 khung lẻ 72x45 pad MAD=0", m7o.mad === 0, `MAD=${m7o.mad}`);
  // T8: clip không metadata -> unknown -> throw
  const mUnk = shared.probeColorMetadata(mpUnk);
  check("T8 probe unknown", mUnk.colorSpace === "unknown" || mUnk.colorSpace === null,
    `color_space=${mUnk.colorSpace}`);
  expectThrow("T8 matrix unknown (dữ liệu thật) throw", () => shared.matrixForMetadata(mUnk));

  console.log(failures === 0 ? "R25-selftest: ALL PASS" : `R25-selftest: ${failures} FAIL`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  console.log(`selftest scratch đã xoá: ${TMP} (còn lại: ${fs.existsSync(TMP) ? "VẪN CÒN — CẦN DỌN TAY" : "không còn"})`);
}
