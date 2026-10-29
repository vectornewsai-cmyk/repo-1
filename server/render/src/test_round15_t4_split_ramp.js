#!/usr/bin/env node
/**
 * test_round15_t4_split_ramp.js — Kiểm chứng render MP4 THẬT cho nửa clip
 * SAU split theo ramp (Phase 9 đợt 15, luồng T4; đóng nợ đợt 14 R5/§3:
 * "chưa có test render MP4 thật cho nửa clip sau split theo ramp").
 *
 * Chạy: node server/render/src/test_round15_t4_split_ramp.js
 * Media test nhỏ (64×64, vài giây) trong thư mục tạm /tmp.
 *
 * TÍNH ĐỘC LẬP CỦA TEST (tránh kiểm chứng vòng tròn): các con số của nửa
 * sau split KHÔNG lấy từ code split (store/speedcurve) mà tự suy bằng tay
 * từ curve gốc rồi ghi cứng ở đây:
 *   - Curve gốc: linear 1→2 trên output [0, 4]; v(t) = 1 + t/4.
 *   - Điểm cắt output 2s: v(2) = 1.5; nguồn tiêu thụ tới đó
 *     ∫[0,2] v dt = 2 + 2²/8 = 2.5s.
 *   - Nửa phải (2s output): in = 2.5, curve rebase v(u) = v(2+u) = 1.5 + 0.25u
 *     → keyframes [{t:0, v:1.5}, {t:2, v:2}]; nguồn nó tiêu thụ
 *     ∫[0,2] (1.5 + 0.25u) du = 3.5s (2.5 → 6.0).
 *   - Nguồn màu: đỏ 0–4s, xanh lá 4–8s. Vậy nửa phải phải: đầu đỏ, cuối xanh.
 * Nếu code split tính sai in/curve thì frame render sẽ lệch màu và test rớt
 * — test không "tự chấm mình" bằng chính hàm split.
 *
 * CASE:
 *  V1. validateSpec(spec tách làm đôi) → ok (không vỡ validator).
 *  V2. Render RIÊNG nửa phải (standalone, start 0): duration ≈ 2s;
 *      frame u=0.2 đỏ (src ≈ 2.81), frame u=1.8 xanh lá (src ≈ 5.61).
 *  V3. Render spec GỐC (1 clip 4s) và spec TÁCH (2 clip 2s + 2s, không
 *      transition): cả hai duration ≈ 4s.
 *  V4. Tương đương phẳng: frame tại các thời điểm toàn cục 0.5 / 1.5 / 2.5 /
 *      3.5 của 2 bản render phải cùng màu chủ đạo (đỏ/đỏ/đỏ/xanh lá) và
 *      mean RGB lệch nhau ≤ 40/kênh — tức tách clip không làm đổi nội dung
 *      khung hình, chỉ chia lại đoạn.
 */

"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-t4split-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });

let pass = 0, fail = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function approx(a, b, tol) { return Math.abs(a - b) <= tol; }
function ff(args) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args]);
}
function ffProbe(file) {
  const out = execFileSync("ffprobe", ["-v", "quiet", "-print_format", "json",
    "-show_streams", "-show_format", file], { encoding: "utf8" });
  return JSON.parse(out);
}

function renderSpec(spec, outName) {
  const specPath = path.join(WORK, `spec-${outName}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(WORK, `${outName}.mp4`);
  const r = spawnSync(process.execPath, [
    path.join(HERE, "render.js"),
    "--spec", specPath, "--out", outPath, "--media-dir", MEDIA,
    "--crf", "28", "--x264-preset", "ultrafast", "-y", "-q",
  ], { encoding: "utf8" });
  return { ok: r.status === 0, code: r.status, stderr: (r.stderr || "") + (r.stdout || ""), outPath };
}

function baseSpec(tracks) {
  return {
    version: "0.2.0",
    meta: { name: "T4 split ramp test", width: 64, height: 64, fps: 30 },
    tracks,
  };
}
function videoTrack(clips) {
  return { id: "v1", kind: "video", clips };
}

/** Đọc 1 frame tại t giây, trả về { r, g, b } trung bình (PPM P6, mẫu test_p3). */
function frameMeanRGB(file, t) {
  const buf = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error",
    "-ss", String(t), "-i", file, "-frames:v", "1", "-f", "image2pipe",
    "-vcodec", "ppm", "-"]);
  let i = 0;
  const readToken = () => {
    while (buf[i] === 0x0a || buf[i] === 0x20 || buf[i] === 0x23) {
      if (buf[i] === 0x23) while (buf[i] !== 0x0a) i++;
      else i++;
    }
    let s = "";
    while (buf[i] !== 0x0a && buf[i] !== 0x20) s += String.fromCharCode(buf[i++]);
    return s;
  };
  const magic = readToken();
  const w = parseInt(readToken(), 10);
  const h = parseInt(readToken(), 10);
  readToken(); // maxval
  i++; // 1 byte whitespace sau maxval
  if (magic !== "P6" || !w || !h) throw new Error(`PPM parse lỗi: ${magic} ${w}x${h}`);
  let r = 0, g = 0, b = 0;
  const n = w * h;
  for (let p = 0; p < n; p++) {
    r += buf[i + p * 3]; g += buf[i + p * 3 + 1]; b += buf[i + p * 3 + 2];
  }
  return { r: r / n, g: g / n, b: b / n };
}

const isRed = (f) => f.r > 150 && f.g < 100;
// Lưu ý: màu tên "green" của FFmpeg là (0,128,0), không phải (0,255,0)
// nên ngưỡng xanh lá là G > 100 (lần chạy đầu dùng > 150 nên rớt oan
// dù frame đúng là xanh lá thuần — xem LIMITS).
const isGreen = (f) => f.g > 100 && f.r < 100 && f.g > f.b;
const dominant = (f) => (isRed(f) ? "red" : isGreen(f) ? "green" : "other");

// ===========================================================================
// Chuẩn bị media: đỏ 0–4s + xanh lá 4–8s (64×64, 30fps)
// ===========================================================================
console.log("== Chuẩn bị media ==");
ff(["-f", "lavfi", "-i", "color=c=red:s=64x64:r=30:d=4",
    "-f", "lavfi", "-i", "color=c=green:s=64x64:r=30:d=4",
    "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", path.join(MEDIA, "redgreen.mp4")]);
ok("media đã tạo", fs.existsSync(path.join(MEDIA, "redgreen.mp4")));

// Curve gốc + 2 nửa tách (số suy bằng tay, xem header).
const ORIG_CURVE = { keyframes: [
  { t: 0, v: 1, easing: "linear" },
  { t: 4, v: 2, easing: "linear" },
] };
const LEFT_CURVE = { keyframes: [
  { t: 0, v: 1, easing: "linear" },
  { t: 2, v: 1.5, easing: "linear" },
] };
const RIGHT_CURVE = { keyframes: [
  { t: 0, v: 1.5, easing: "linear" },
  { t: 2, v: 2, easing: "linear" },
] };

const origSpec = baseSpec([videoTrack([{
  id: "c1", kind: "video", src: "redgreen.mp4", start: 0, duration: 4, in: 0, out: 8,
  speedKeyframes: ORIG_CURVE,
}])]);
const splitSpec = baseSpec([videoTrack([
  { id: "c1L", kind: "video", src: "redgreen.mp4", start: 0, duration: 2, in: 0, out: 2.5,
    speedKeyframes: LEFT_CURVE },
  { id: "c1R", kind: "video", src: "redgreen.mp4", start: 2, duration: 2, in: 2.5, out: 8,
    speedKeyframes: RIGHT_CURVE },
])]);
const rightOnlySpec = baseSpec([videoTrack([{
  id: "c1R", kind: "video", src: "redgreen.mp4", start: 0, duration: 2, in: 2.5, out: 8,
  speedKeyframes: RIGHT_CURVE,
}])]);

// ===========================================================================
// V1. Validator cho spec tách
// ===========================================================================
console.log("== V1. Validate spec tách ==");
{
  const { validateSpec } = require("./validate");
  const v = validateSpec(splitSpec);
  ok("V1 spec tách hợp lệ (validator ok)", v.ok, JSON.stringify(v.errors));
}

// ===========================================================================
// V2. Render riêng nửa phải
// ===========================================================================
console.log("== V2. Render riêng nửa phải ==");
{
  const r = renderSpec(rightOnlySpec, "rightonly");
  ok("V2 render nửa phải ok", r.ok, r.stderr.slice(-300));
  if (r.ok) {
    const probe = ffProbe(r.outPath);
    const v = probe.streams.find((s) => s.codec_type === "video");
    ok("V2 duration video ≈ 2s", approx(parseFloat(v.duration), 2, 0.15), `nhận ${v.duration}`);
    const f02 = frameMeanRGB(r.outPath, 0.2);
    const f18 = frameMeanRGB(r.outPath, 1.8);
    ok("V2 frame u=0.2 đỏ (src ≈ 2.81)", isRed(f02), JSON.stringify(f02));
    ok("V2 frame u=1.8 xanh lá (src ≈ 5.61)", isGreen(f18), JSON.stringify(f18));
  }
}

// ===========================================================================
// V3 + V4. Gốc vs tách: duration + màu frame từng thời điểm toàn cục
// ===========================================================================
console.log("== V3/V4. Gốc vs tách ==");
{
  const ro = renderSpec(origSpec, "orig");
  ok("V3 render gốc ok", ro.ok, ro.stderr.slice(-300));
  const rs = renderSpec(splitSpec, "split");
  ok("V3 render tách ok", rs.ok, rs.stderr.slice(-300));
  if (ro.ok && rs.ok) {
    const po = ffProbe(ro.outPath);
    const ps = ffProbe(rs.outPath);
    const vo = po.streams.find((s) => s.codec_type === "video");
    const vs = ps.streams.find((s) => s.codec_type === "video");
    ok("V3 duration gốc ≈ 4s", approx(parseFloat(vo.duration), 4, 0.15), `nhận ${vo.duration}`);
    ok("V3 duration tách ≈ 4s", approx(parseFloat(vs.duration), 4, 0.15), `nhận ${vs.duration}`);
    // src(t) gốc = t + t²/8: 0.5→0.53 đỏ, 1.5→1.78 đỏ, 2.5→3.28 đỏ, 3.5→5.03 xanh.
    const cases = [
      [0.5, "red"], [1.5, "red"], [2.5, "red"], [3.5, "green"],
    ];
    for (const [t, want] of cases) {
      const fo = frameMeanRGB(ro.outPath, t);
      const fs = frameMeanRGB(rs.outPath, t);
      ok(`V4 t=${t}: gốc ${want} (dominant)`, dominant(fo) === want, JSON.stringify(fo));
      ok(`V4 t=${t}: tách ${want} (dominant)`, dominant(fs) === want, JSON.stringify(fs));
      const diff = Math.max(
        Math.abs(fo.r - fs.r), Math.abs(fo.g - fs.g), Math.abs(fo.b - fs.b));
      ok(`V4 t=${t}: mean RGB gốc vs tách lệch ≤ 40/kênh`, diff <= 40, `lệch ${diff.toFixed(1)}`);
    }
  }
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exitCode = 1;
