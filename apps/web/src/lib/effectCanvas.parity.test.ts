// effectCanvas.parity.test.ts — Đối chiếu frame preview canvas với frame
// render FFmpeg thật (đợt 11 P2). Chạy từ gốc repo:
//   node --experimental-strip-types apps/web/src/lib/effectCanvas.parity.test.ts
// Cần ffmpeg trong PATH; nếu không có ffmpeg thì in SKIP (không tính PASS).
//
// Tiêu chí phân loại theo harness V6 đợt 10 (test_v10_parity.js):
//   KHỚP  = MAD <= 2 và >= 99% pixel lệch <= 8 (mỗi kênh)
//   XẤP XỈ = MAD <= 20 và >= 90% pixel lệch <= 32
// Nguồn tổng hợp giống harness V6: patternFrame (mỗi pixel khác nhau)
// cho pixelate/sharpen, gradient kênh cho rgb-shift, asym cho mirror,
// step cho edgedetect, pattern cho shake (crop+pad là hình học thuần nên
// không phụ thuộc nguồn). Số đo chỉ đúng máy đo (ffmpeg 8.1.2, VM này).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  applyEdgeDetect,
  applyGlitch,
  applyMirror,
  applyNoise,
  applyPixelate,
  applyRgbShift,
  applyShake,
  applySharpen,
  shakeOffsetAt,
  type ImageDataLike,
} from "./effectCanvas.ts";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "effectCanvas-parity-"));

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

function patternFrame(w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      buf[i] = (x * 4) % 256;
      buf[i + 1] = (y * 5) % 256;
      buf[i + 2] = (x + y * 3) % 256;
    }
  }
  return buf;
}
function asymFrame(w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      if (x < w / 2) buf[i] = 255;
      else buf[i + 2] = 255;
    }
  }
  return buf;
}
function rgbGradFrame(w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      buf[i] = (x * 3) % 256;
      buf[i + 1] = 128;
      buf[i + 2] = ((w - 1 - x) * 3) % 256;
    }
  }
  return buf;
}
function stepFrame(w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const v = x < Math.floor(w / 2) ? 0 : 255;
      buf[i] = v;
      buf[i + 1] = v;
      buf[i + 2] = v;
    }
  }
  return buf;
}
function naturalFrame(w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      let r = 60 + x * 2;
      let g = 40 + y * 3;
      let bl = 120 + Math.round(40 * Math.sin(x / 9));
      if (x > 15 && x < 45 && y > 10 && y < 30) { r = 220; g = 60; bl = 60; }
      const dx = x - 55;
      const dy = y - 30;
      if (dx * dx + dy * dy < 100) { r = 40; g = 200; bl = 90; }
      if (x - y > 20 && x - y < 23) { r = 255; g = 255; bl = 255; }
      buf[i] = Math.max(0, Math.min(255, r));
      buf[i + 1] = Math.max(0, Math.min(255, g));
      buf[i + 2] = Math.max(0, Math.min(255, bl));
    }
  }
  return buf;
}
function toImg(src: Buffer, w: number, h: number): ImageDataLike {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = src[i * 3];
    data[i * 4 + 1] = src[i * 3 + 1];
    data[i * 4 + 2] = src[i * 3 + 2];
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}
function fromImg(im: ImageDataLike, w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    buf[i * 3] = im.data[i * 4];
    buf[i * 3 + 1] = im.data[i * 4 + 1];
    buf[i * 3 + 2] = im.data[i * 4 + 2];
  }
  return buf;
}
/** Render FFmpeg 1 frame (frames=1) hoặc nhiều frame rồi lấy frameIndex. */
function renderEffect(
  filter: string,
  src: Buffer,
  w: number,
  h: number,
  frames: number,
  frameIndex: number,
): Buffer {
  const inp = path.join(TMP, "in.raw");
  const out = path.join(TMP, "out.raw");
  const chunks: Buffer[] = [];
  for (let i = 0; i < frames; i++) chunks.push(src);
  fs.writeFileSync(inp, Buffer.concat(chunks));
  const args = [
    "-v", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30", "-i", inp,
    "-vf", `${filter},format=rgb24`,
    "-f", "rawvideo", "-pix_fmt", "rgb24", out,
  ];
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
  const all = fs.readFileSync(out);
  const sz = w * h * 3;
  return Buffer.from(all.subarray(frameIndex * sz, (frameIndex + 1) * sz));
}
function compare(a: Buffer, b: Buffer, w: number, h: number): { mad: number; le8: number; le32: number } {
  let sum = 0;
  let le8 = 0;
  let le32 = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  for (let p = 0; p < w * h; p++) {
    const d = Math.max(
      Math.abs(a[p * 3] - b[p * 3]),
      Math.abs(a[p * 3 + 1] - b[p * 3 + 1]),
      Math.abs(a[p * 3 + 2] - b[p * 3 + 2]),
    );
    if (d <= 8) le8++;
    if (d <= 32) le32++;
  }
  return { mad: sum / a.length, le8: le8 / (w * h), le32: le32 / (w * h) };
}
function isFfmpegAvailable(): boolean {
  try {
    const r = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
    return r.status === 0;
  } catch {
    return false;
  }
}

if (!isFfmpegAvailable()) {
  console.log("SKIP: không có ffmpeg trong PATH — không đo parity được, không tính PASS.");
  process.exit(0);
}
const ffVersion = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0];
console.log(`== effectCanvas parity vs FFmpeg (${ffVersion}) ==`);

console.log("== pixelate: tâm khối (đợt 11 P2) ==");
for (const [w, h, intensity, k] of [
  [72, 46, 0, 2],
  [72, 45, 0.5, 9],
  [144, 96, 1, 16],
] as const) {
  ok(`pixelate intensity ${intensity} (k=${k}) KHỚP render (MAD<=2, <=8>=99%)`, () => {
    const src = patternFrame(w, h);
    const ff = renderEffect(
      `scale=iw/${k}:ih/${k}:flags=neighbor,scale=iw*${k}:ih*${k}:flags=neighbor`,
      src, w, h, 1, 0,
    );
    const prev = fromImg(applyPixelate(toImg(src, w, h), intensity), w, h);
    const m = compare(ff, prev, w, h);
    console.log(`    k=${k}: MAD=${m.mad.toFixed(3)} <=8=${(m.le8 * 100).toFixed(1)}% <=32=${(m.le32 * 100).toFixed(1)}% (trước đợt 11: k=9 MAD=26.75 với mẫu góc trái-trên)`);
    assert.ok(m.mad <= 2, `MAD ${m.mad} vượt 2`);
    assert.ok(m.le8 >= 0.99, `<=8 ${(m.le8 * 100).toFixed(1)}% dưới 99%`);
  });
}

console.log("== mirror / rgb-shift: KHỚP ==");
ok("mirror KHỚP hflip (MAD<=1)", () => {
  const w = 72, h = 45;
  const src = asymFrame(w, h);
  const ff = renderEffect("hflip", src, w, h, 1, 0);
  const prev = fromImg(applyMirror(toImg(src, w, h)), w, h);
  const m = compare(ff, prev, w, h);
  console.log(`    MAD=${m.mad.toFixed(3)} <=8=${(m.le8 * 100).toFixed(1)}%`);
  assert.ok(m.mad <= 1, `MAD ${m.mad} vượt 1`);
});
ok("rgb-shift KHỚP rgbashift (MAD<=1, chiều đỏ phải/xanh trái)", () => {
  const w = 72, h = 45;
  const src = rgbGradFrame(w, h);
  const ff = renderEffect("rgbashift=rh=9:bh=-9", src, w, h, 1, 0);
  const prev = fromImg(applyRgbShift(toImg(src, w, h), 0.5), w, h);
  const m = compare(ff, prev, w, h);
  console.log(`    s=9: MAD=${m.mad.toFixed(3)} <=8=${(m.le8 * 100).toFixed(1)}%`);
  assert.ok(m.mad <= 1, `MAD ${m.mad} vượt 1`);
});
ok("rgb-shift KHỚP rgbashift trên nguồn tự nhiên (nhân biên, đợt 16 H5)", () => {
  // Nguồn rgbGrad che giấu lỗi điền vùng trống (biên của nó bằng 0),
  // còn nguồn tự nhiên phơi bày: điền 0 cũ lệch MAD 9.167 trên 72×45,
  // s=9; nhân biên nay phải cho MAD ≈ 0.
  const w = 72, h = 45;
  const src = naturalFrame(w, h);
  const ff = renderEffect("rgbashift=rh=9:bh=-9", src, w, h, 1, 0);
  const prev = fromImg(applyRgbShift(toImg(src, w, h), 0.5), w, h);
  const m = compare(ff, prev, w, h);
  console.log(`    tự nhiên s=9: MAD=${m.mad.toFixed(3)} <=8=${(m.le8 * 100).toFixed(1)}% (điền 0 cũ: MAD 9.167)`);
  assert.ok(m.mad <= 1, `MAD ${m.mad} vượt 1`);
});

console.log("== shake: crop+pad (đợt 11 P2) ==");
const SHAKE_FILTER =
  "crop=w=iw-24:h=ih-24:x='12+12*sin(2*PI*t*9)':y='12+12*cos(2*PI*t*7)',pad=iw+24:ih+24:x=12:y=12:color=black";
for (const [localT, frameIndex] of [[0, 0], [0.5, 15]] as const) {
  ok(`shake t=${localT} KHỚP crop+pad (MAD<=1)`, () => {
    const w = 72, h = 45;
    const src = patternFrame(w, h);
    const frames = localT === 0 ? 1 : 30;
    const ff = renderEffect(SHAKE_FILTER, src, w, h, frames, frameIndex);
    const { dx, dy } = shakeOffsetAt(localT);
    const prev = fromImg(applyShake(toImg(src, w, h), dx, dy), w, h);
    const m = compare(ff, prev, w, h);
    console.log(`    t=${localT} dx=${dx} dy=${dy}: MAD=${m.mad.toFixed(3)} <=8=${(m.le8 * 100).toFixed(1)}% (bản dịch tịnh tiến cũ: t=0 MAD=44.58)`);
    assert.ok(m.mad <= 1, `MAD ${m.mad} vượt 1`);
  });
}

console.log("== sharpen: KHỚP (đợt 14 R6: luma + Gaussian 5x5; chuỗi render bt709 đợt 65 S7) ==");
// Đợt 65 S7 — ĐÍNH CHÍNH chuỗi render của 2 case này (cùng họ lỗi R63 R8
// đã sửa cho noise): renderEffect áp `unsharp` trực tiếp lên RGB24,
// FFmpeg tự chèn convert với ma trận MẶC ĐỊNH bt601 — trong khi render
// thật (render.js, nguồn HD) làm việc trên Y bt709. Hai render lệch
// nhau MAD 2.2–4.9 (probe9) nên test cũ đo model bt601 cũ là "KHỚP"
// và model bt709 mới là "XẤP XỈ" — ngược với pipeline thật. Chuỗi mới
// ép bt709 tường minh; dùng yuv444p thay vì yuv420p vì unsharp chỉ
// động vào luma Y (full-res ở cả 420p lẫn 444p) nên delta giống hệt
// render yuv420p thật, trong khi yuv420p đưa subsampling chroma vào
// base (MAD ~2.1–4.8 cho MỌI model — át cả model, probe9) làm test
// mất khả năng phân biệt. Base roundtrip bt709-yuv444p chỉ MAD 0.37–
// 0.40. Đo thật (probe10, pattern/natural 72×45): S7 MAD 0.49–0.71,
// le8 99.2–100% (KHỚP cả 4); S0 cũ tụt XẤP XỈ ở t=1 (le8 92.8–97.2%).
/** Render filter trong pipeline bt709 tường minh, yuv444p (xem trên). */
function renderEffectYuv444(filter: string, src: Buffer, w: number, h: number): Buffer {
  const inp = path.join(TMP, "y444-in.raw");
  const out = path.join(TMP, "y444-out.raw");
  fs.writeFileSync(inp, src);
  const r = spawnSync("ffmpeg", ["-v", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30", "-i", inp,
    "-vf", `scale=out_color_matrix=bt709,format=yuv444p,${filter},scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
  return fs.readFileSync(out);
}
for (const [intensity, amount] of [[0.5, 1.1], [1, 2.0]] as const) {
  ok(`sharpen t=${intensity} KHỚP render (MAD<=2, <=8>=99%; trước R6: box-blur 3x3 RGB, MAD tới 4.96)`, () => {
    const w = 72, h = 45;
    const src = patternFrame(w, h);
    const ff = renderEffectYuv444(`unsharp=5:5:${amount}:5:5:0`, src, w, h);
    const prev = fromImg(applySharpen(toImg(src, w, h), intensity), w, h);
    const m = compare(ff, prev, w, h);
    console.log(`    t=${intensity}: MAD=${m.mad.toFixed(3)} <=8=${(m.le8 * 100).toFixed(1)}% <=32=${(m.le32 * 100).toFixed(1)}%`);
    assert.ok(m.mad <= 2, `MAD ${m.mad} vượt 2`);
    assert.ok(m.le8 >= 0.99, `<=8 ${(m.le8 * 100).toFixed(1)}% dưới 99%`);
  });
}

console.log("== edgedetect: XẤP XỈ (đợt 17 N4: Gaussian σ=1.4 + gray nguyên swscale + làm tròn + NMS nghiêm + độ lớn Sobel thô) ==");
ok("edgedetect step trong band XẤP XỈ (NMS nghiêm triệt tiêu plateau, render chỉ 4px — xem LIMITS, không claim khớp)", () => {
  const w = 72, h = 45;
  const src = stepFrame(w, h);
  const ff = renderEffect("edgedetect=low=0.2:high=0.45", src, w, h, 1, 0);
  const prev = fromImg(applyEdgeDetect(toImg(src, w, h), 0.5), w, h);
  const m = compare(ff, prev, w, h);
  console.log(`    MAD=${m.mad.toFixed(3)} <=8=${(m.le8 * 100).toFixed(1)}% — FFmpeg Canny cho 4px tại cột 36, hàng 1,2,42,43 trên nguồn step này; canvas NMS nghiêm cũng triệt tiêu phần trong của plateau (R6: NMS tie-break >= một phía cho 1 cột đủ chiều cao, MAD 3.856; N4: Gaussian σ=1.4 giữ nguyên số này)`);
  assert.ok(m.mad <= 20, `MAD ${m.mad} vượt 20`);
});
ok("edgedetect tự nhiên trong band XẤP XỈ (MAD<=20)", () => {
  const w = 72, h = 45;
  const src = naturalFrame(w, h);
  const ff = renderEffect("edgedetect=low=0.2:high=0.45", src, w, h, 1, 0);
  const prev = fromImg(applyEdgeDetect(toImg(src, w, h), 0.5), w, h);
  const m = compare(ff, prev, w, h);
  console.log(`    MAD=${m.mad.toFixed(3)} <=8=${(m.le8 * 100).toFixed(1)}% (H5: Gaussian nhị thức + float, MAD 2.130; N4: Gaussian σ=1.4 + gray nguyên, MAD 3.815 — tệ đi trên nguồn này vì magnitudes biên mỏng bị loãng, kept-set gần như không đổi; R6: MAD 8.528; Sobel tuyến tính gốc MAD 13.85)`);
  assert.ok(m.mad <= 20, `MAD ${m.mad} vượt 20`);
});

console.log("== noise: thống kê có ngưỡng rõ ràng (đợt 63 R8: pipeline yuv420p thật, tiêu chí mới) ==");
// Đợt 63 R8 — ĐÍNH CHÍNH tiêu chí đợt 16 H5: test cũ áp filter noise
// trực tiếp lên RGB24 (`noise` trên rgb24) rồi kết luận "KHỚP thống kê"
// — nhưng pipeline render thật áp noise lên từng plane yuv420p (sau
// `format=yuv420p`), rồi mới convert sang RGB. Hai pipeline cho thống kê
// KHÁC HẲN (đo thật FFmpeg 8.1.2, phẳng 128, bt709, alls=28):
//   RGB24:  std [15.8, 15.7, 15.6], corr ≈ 0
//   yuv420p: std [33.6, 20.4, 37.8] (tỉ lệ kênh [2.14, 1.30, 2.41]×σ),
//            corr RG/RB/GB [0.15, 0.26, 0.30]
// nên tiêu chí cũ (|corr| ≤ 0.1, tỉ lệ std so với render RGB24) chỉ đúng
// trong RGB24 và cho kết quả "KHỚP" giả — mô hình RGB cũ cho tỉ lệ std
// [0.47, 0.78, 0.42] so với render yuv420p thật (R/B lệch hơn 2×) và
// corr ≈ 0 (lệch 0.15–0.30 so với render). Tiêu chí mới đo trong pipeline
// yuv420p thật (bt709 — nguồn HD; nguồn SD bt601 sẽ lệch ma trận nhỏ,
// xem LIMITS đợt 63 R8) và SO SÁNH preview với render thay vì áp ngưỡng
// tuyệt đối lên preview:
//   - tỉ lệ std từng kênh (preview/render) ∈ [0.85, 1.18] — CHẶT HƠN
//     [0.8, 1.25] cũ vì mô hình nay khớp cấu trúc pipeline; kì vọng
//     ≈ 1.03 (σ lý thuyết alls/√3 so với σ đo được của filter 0.97–0.98×).
//   - |kurtosis preview − kurtosis render| ≤ 0.35 từng kênh (không áp
//     ngưỡng tuyệt đối ±0.6 như cũ: ở t=1, kẹp 0/255 làm kurt cả 2 bên
//     về ≈ −0.5..−0.7 — cùng hiệu ứng, không phải lệch mô hình).
//   - |corr preview − corr render| ≤ 0.12 từng cặp (corr tuyệt đối của
//     render ≈ [0.15, 0.26, 0.30] là DẤU HIỆU của nhiễu YUV, không phải
//     lỗi — tiêu chí cũ |corr| ≤ 0.1 bắt render phải có corr ≈ 0, tức
//     bắt nhiễu RGB, là sai pipeline).
//   - guard pipeline: render phải tự nó mang dấu hiệu YUV (std_R/std_G
//     ∈ [1.4, 1.9], std_B/std_G ∈ [1.6, 2.1]) — nếu chuỗi đo vô tình rơi
//     về RGB24 thì test fail ồn ào thay vì pass rỗng.
// Ngưỡng mới KHÔNG nới để cho xanh: std chặt hơn cũ, corr/kurt chuyển
// từ tuyệt đối sang so sánh trực tiếp (mô hình RGB cũ rớt cả 3 tiêu chí).
// Nguồn vẫn là ảnh phẳng 128 (mid-tone, không kẹp) để đo lõi phân phối;
// vùng bão hòa (kurt phình do kẹp) đo ở harness headed, xem LIMITS.
/** Render noise trong pipeline yuv420p thật: rgb24 -> yuv420p (bt709) -> noise -> rgb24 (bt709). */
function renderEffectYuv(
  alls: number,
  src: Buffer,
  w: number,
  h: number,
): Buffer {
  const inp = path.join(TMP, "yuv-in.raw");
  const yuv = path.join(TMP, "yuv-mid.raw");
  const yuvN = path.join(TMP, "yuv-noisy.raw");
  const out = path.join(TMP, "yuv-out.raw");
  fs.writeFileSync(inp, src);
  let r = spawnSync("ffmpeg", ["-v", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30", "-i", inp,
    "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuv], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`rgb->yuv exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
  r = spawnSync("ffmpeg", ["-v", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30", "-i", yuv,
    "-vf", `noise=alls=${alls}:allf=t`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvN], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`noise yuv exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
  r = spawnSync("ffmpeg", ["-v", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30", "-i", yuvN,
    "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`yuv->rgb exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
  return fs.readFileSync(out);
}
for (const [intensity, alls] of [[0.5, 28], [1, 50]] as const) {
  ok(`noise t=${intensity} (alls=${alls}) KHỚP thống kê render yuv420p: tỉ lệ std [0.85,1.18], |Δkurt|<=0.35, |Δcorr|<=0.12`, () => {
    const w = 144, h = 90;
    const src = flatFrame(w, h);
    const ff = renderEffectYuv(alls, src, w, h);
    const prev = fromImg(applyNoise(toImg(src, w, h), intensity, 42), w, h);
    const sR = channelStats(ff, 128);
    const sP = channelStats(prev, 128);
    const ratios = sR.std.map((v, i) => sP.std[i] / v);
    console.log(`    std render [${sR.std.map((v) => v.toFixed(2)).join(",")}] std preview [${sP.std.map((v) => v.toFixed(2)).join(",")}] tỉ lệ [${ratios.map((v) => v.toFixed(2)).join(",")}]`);
    console.log(`    kurt render [${sR.kurt.map((v) => v.toFixed(2)).join(",")}] kurt preview [${sP.kurt.map((v) => v.toFixed(2)).join(",")}] corr render RG/RB/GB [${sR.corr[0][1].toFixed(3)},${sR.corr[0][2].toFixed(3)},${sR.corr[1][2].toFixed(3)}] corr preview [${sP.corr[0][1].toFixed(3)},${sP.corr[0][2].toFixed(3)},${sP.corr[1][2].toFixed(3)}]`);
    // Guard pipeline: render phải mang dấu hiệu YUV (std kênh không đều,
    // corr dương) — nếu chuỗi đo rơi về RGB24 thì fail ở đây, không pass rỗng.
    const rRG = sR.std[0] / sR.std[1];
    const rBG = sR.std[2] / sR.std[1];
    assert.ok(rRG >= 1.4 && rRG <= 1.9, `guard pipeline: render std_R/std_G=${rRG.toFixed(2)} ngoài [1.4,1.9] — chuỗi đo không còn là yuv420p?`);
    assert.ok(rBG >= 1.6 && rBG <= 2.1, `guard pipeline: render std_B/std_G=${rBG.toFixed(2)} ngoài [1.6,2.1] — chuỗi đo không còn là yuv420p?`);
    assert.ok(sR.corr[1][2] >= 0.15, `guard pipeline: render corr GB=${sR.corr[1][2].toFixed(3)} dưới 0.15 — chuỗi đo không còn là nhiễu YUV?`);
    for (let c = 0; c < 3; c++) {
      assert.ok(ratios[c] >= 0.85 && ratios[c] <= 1.18, `kênh ${c}: tỉ lệ std ${ratios[c].toFixed(3)} ngoài [0.85,1.18] (mô hình RGB cũ: [0.47,0.78,0.42])`);
      assert.ok(Math.abs(sP.kurt[c] - sR.kurt[c]) <= 0.35, `kênh ${c}: |kurt preview − kurt render| = ${Math.abs(sP.kurt[c] - sR.kurt[c]).toFixed(3)} vượt 0.35`);
      assert.ok(Math.abs(sP.kurt[c]) <= 1.0 && Math.abs(sR.kurt[c]) <= 1.0, `kênh ${c}: kurtosis ngoài ±1.0 (preview ${sP.kurt[c].toFixed(2)}, render ${sR.kurt[c].toFixed(2)})`);
    }
    for (const [a, b] of [[0, 1], [0, 2], [1, 2]] as const) {
      assert.ok(Math.abs(sP.corr[a][b] - sR.corr[a][b]) <= 0.12, `corr ${a}${b}: |preview − render| = ${Math.abs(sP.corr[a][b] - sR.corr[a][b]).toFixed(3)} vượt 0.12 (mô hình RGB cũ cho corr ≈ 0)`);
    }
  });
}
function channelStats(buf: Buffer, base: number): { std: number[]; kurt: number[]; corr: number[][] } {
  const n = buf.length / 3;
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let i = c; i < buf.length; i += 3) s += buf[i] - base;
    mean[c] = s / n;
  }
  const std = [0, 0, 0];
  const kurt = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s2 = 0;
    let s4 = 0;
    for (let i = c; i < buf.length; i += 3) {
      const v = buf[i] - base - mean[c];
      s2 += v * v;
      s4 += v * v * v * v;
    }
    std[c] = Math.sqrt(s2 / n);
    kurt[c] = s4 / n / (std[c] ** 4) - 3;
  }
  const corr = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let a = 0; a < 3; a++) {
    for (let b = 0; b < 3; b++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += (buf[i * 3 + a] - base - mean[a]) * (buf[i * 3 + b] - base - mean[b]);
      corr[a][b] = s / n / (std[a] * std[b]);
    }
  }
  return { std, kurt, corr };
}
function flatFrame(w: number, h: number, v = 128): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  buf.fill(v);
  return buf;
}

console.log("== glitch: ổn định lặp lại + cấu trúc (đợt 17 N4: khóa cách đo ổn định cho V14; ngưỡng RGB đợt 65 S7) ==");
ok("glitch lặp lại byte-identical 3 lần cùng seed + cấu trúc vs shift-thuần trong ngưỡng RGB (TB 7–13, std 9–15)", () => {
  // Khóa đo ổn định (đợt 17 N4): case glitch V14 từng lật tier giữa các
  // lượt đợt 16 — truy nguyên cho thấy KHÔNG phải nhiễu render ngẫu
  // nhiên theo thời gian: render glitch (rgbashift + noise alls=20
  // allf=t) trên cùng input cho cùng frame ở 5 process FFmpeg riêng
  // biệt (MAD 0.000, cả khi đổi PTS bằng setpts), và preview glitch
  // seed 42 cho cùng output ở mọi lần chạy. Lần lật tier đó là do
  // giữa đợt 16, preview đổi từ nhiễu đều sang Gauss (max |lệch| vượt
  // ngưỡng cũ max ≤ 21) TRƯỚC khi V14 đổi sang tiêu chí TB/std Gauss —
  // tức code/tiêu chí đổi giữa chừng, không phải tính ngẫu nhiên.
  // Vì vậy cách đo ổn định được khóa ở đây (phía preview, không sửa
  // harness): (a) lặp lại byte-identical, (b) cấu trúc vs shift-thuần
  // nhân biên trong ngưỡng TB/std — KHÔNG dùng MAD từng frame vs
  // render làm tier (nhiễu preview độc lập với nhiễu render theo
  // thiết kế, MAD ~12–13 chỉ là sàn nhiễu độc lập). Đợt 63 R8 đổi
  // ngưỡng TB/std 7–13/9–14 (nhiễu Gauss RGB, σ=11.55 mỗi kênh) sang
  // 14–23/18–29 vì cho rằng nhiễu glitch chạy trên yuv420p. Đợt 65 S7
  // ĐÍNH CHÍNH: giả định đó sai — chuỗi render `rgbashift,noise`
  // chạy noise trên plane RGB sau khi rgbashift tự convert yuv420p→
  // gbrp (log verbose probe9; delta render vs shift-only: corr
  // [0.038,-0.003,0.008] ≈ 0, std [11.13,10.85,11.07] ≈ σ). Ngưỡng
  // quay về 7–13/9–15 (nhiễu Gauss RGB độc lập, σ=11.55): đo thật
  // seed 42 trên pattern: TB 8.84, std 11.23 — khớp render TB
  // [8.04,8.98,8.84]/std [11.13,10.85,11.07] trên fixture 64×8
  // (probe8/9); ngưỡng vẫn phân biệt được nhiễu YUV sai (std ~22).
  // Đề xuất cho lần sửa harness sau (ngoài phạm vi luồng này): ghim
  // noise all_seed trong filter tham chiếu của V14 để đo render-frame
  // ổn định cả trên bản FFmpeg mà seed -1 mặc định là ngẫu nhiên
  // (bản 8.1.2 ở đây đã xác định, nhưng all_seed mới là khóa di động
  // được).
  const w = 72, h = 45;
  const src = patternFrame(w, h);
  const outs: Buffer[] = [];
  for (let k = 0; k < 3; k++) outs.push(fromImg(applyGlitch(toImg(src, w, h), 0.5, 42), w, h));
  assert.ok(outs[1].equals(outs[0]) && outs[2].equals(outs[0]), "glitch cùng seed phải byte-identical qua 3 lần chạy");
  const other = fromImg(applyGlitch(toImg(src, w, h), 0.5, 43), w, h);
  assert.ok(!other.equals(outs[0]), "seed khác phải cho output khác (seed có tác dụng thật)");
  const prev = outs[0];
  const devs: number[] = [];
  let sumAbs = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const rs = Math.max(0, x - 11), bs = Math.min(w - 1, x + 11);
      const si = (y * w + x) * 3;
      const d = [prev[si] - src[(y * w + rs) * 3], prev[si + 1] - src[si + 1], prev[si + 2] - src[(y * w + bs) * 3 + 2]];
      for (const v of d) { devs.push(v); sumAbs += Math.abs(v); }
    }
  }
  const meanAbs = sumAbs / devs.length;
  const mu = devs.reduce((s, v) => s + v, 0) / devs.length;
  const std = Math.sqrt(devs.reduce((s, v) => s + (v - mu) * (v - mu), 0) / devs.length);
  console.log(`    glitch seed 42 lặp 3 lần identical; cấu trúc vs shift-thuần (s=11, nhân biên): TB=${meanAbs.toFixed(2)} (kỳ vọng 7–13) std=${std.toFixed(2)} (kỳ vọng 9–15)`);
  assert.ok(meanAbs >= 7 && meanAbs <= 13, `TB cấu trúc ${meanAbs} ngoài [7,13]`);
  assert.ok(std >= 9 && std <= 15, `std cấu trúc ${std} ngoài [9,15]`);
});

console.log("== glitch: không đo khớp từng frame (ghi chú, cấu trúc đo ở harness V14) ==");
console.log("  (i) noise render là nhiễu thời gian (allf=t), glitch render = rgb-shift + noise thời gian;");
console.log("  (i) canvas glitch từ đợt 14 R6 làm đúng cấu trúc render (rgb-shift + noise có seed), không còn slice; đợt 16 H5 sửa thêm trunc + nhân biên + nhiễu Gauss;");
console.log("  (i) canvas dùng seed xác định nên không thể khớp từng frame — chỉ xấp xỉ về cấu trúc/thống kê, không assert MAD từng frame.");

console.log(`\nPASS ${pass} test`);
