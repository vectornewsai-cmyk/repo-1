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

console.log("== sharpen: KHỚP (đợt 14 R6: luma + Gaussian 5x5) ==");
for (const [intensity, amount] of [[0.5, 1.1], [1, 2.0]] as const) {
  ok(`sharpen t=${intensity} KHỚP render (MAD<=2, <=8>=99%; trước R6: box-blur 3x3 RGB, MAD tới 4.96)`, () => {
    const w = 72, h = 45;
    const src = patternFrame(w, h);
    const ff = renderEffect(`unsharp=5:5:${amount}:5:5:0`, src, w, h, 1, 0);
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

console.log("== noise: thống kê có ngưỡng rõ ràng (đợt 16 H5: nhiễu Gauss) ==");
// Thống kê kênh trên ảnh phẳng 128: nhiễu render KHÔNG phải đều
// (kurtosis ≈ 0, vượt ±strength) mà có dạng Gauss; preview Gauss nay
// phải khớp render trên cả 3 chỉ số: tỉ lệ std trong [0.8, 1.25]
// (luật V14), |tương quan kênh| <= 0.1 (nhiễu mặt phẳng YUV cho
// 0.19–0.30 nên rớt), kurtosis trong [-0.6, 0.6] (đều cho −1.2 nên rớt).
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
for (const [intensity, alls] of [[0.5, 28], [1, 50]] as const) {
  ok(`noise t=${intensity} (alls=${alls}) KHỚP thống kê render: tỉ lệ std [0.8,1.25], |corr|<=0.1, kurtosis [-0.6,0.6]`, () => {
    const w = 144, h = 90;
    const src = flatFrame(w, h);
    const ff = renderEffect(`noise=alls=${alls}:allf=t`, src, w, h, 1, 0);
    const prev = fromImg(applyNoise(toImg(src, w, h), intensity, 42), w, h);
    const sR = channelStats(ff, 128);
    const sP = channelStats(prev, 128);
    const ratios = sR.std.map((v, i) => sP.std[i] / v);
    console.log(`    std render [${sR.std.map((v) => v.toFixed(2)).join(",")}] std preview [${sP.std.map((v) => v.toFixed(2)).join(",")}] tỉ lệ [${ratios.map((v) => v.toFixed(2)).join(",")}]`);
    console.log(`    kurt render [${sR.kurt.map((v) => v.toFixed(2)).join(",")}] kurt preview [${sP.kurt.map((v) => v.toFixed(2)).join(",")}] corr preview RG/RB/GB [${sP.corr[0][1].toFixed(3)},${sP.corr[0][2].toFixed(3)},${sP.corr[1][2].toFixed(3)}]`);
    for (let c = 0; c < 3; c++) {
      assert.ok(ratios[c] >= 0.8 && ratios[c] <= 1.25, `kênh ${c}: tỉ lệ std ${ratios[c]} ngoài [0.8,1.25]`);
      assert.ok(sP.kurt[c] >= -0.6 && sP.kurt[c] <= 0.6, `kênh ${c}: kurtosis preview ${sP.kurt[c]} ngoài [-0.6,0.6]`);
      assert.ok(sR.kurt[c] >= -0.6 && sR.kurt[c] <= 0.6, `kênh ${c}: kurtosis render ${sR.kurt[c]} ngoài [-0.6,0.6] (render không còn dạng Gauss?)`);
    }
    for (const [a, b] of [[0, 1], [0, 2], [1, 2]] as const) {
      assert.ok(Math.abs(sP.corr[a][b]) <= 0.1, `corr preview ${a}${b} = ${sP.corr[a][b]} vượt 0.1`);
    }
  });
}

console.log("== glitch: ổn định lặp lại + cấu trúc (đợt 17 N4: khóa cách đo ổn định cho V14) ==");
ok("glitch lặp lại byte-identical 3 lần cùng seed + cấu trúc vs shift-thuần trong ngưỡng V14 (TB 7–13, std 9–14)", () => {
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
  // thiết kế, MAD ~12–13 chỉ là sàn nhiễu độc lập). Đề xuất cho lần
  // sửa harness sau (ngoài phạm vi luồng này): ghim noise all_seed
  // trong filter tham chiếu của V14 để đo render-frame ổn định cả trên
  // bản FFmpeg mà seed -1 mặc định là ngẫu nhiên (bản 8.1.2 ở đây đã
  // xác định, nhưng all_seed mới là khóa di động được).
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
  console.log(`    glitch seed 42 lặp 3 lần identical; cấu trúc vs shift-thuần (s=11, nhân biên): TB=${meanAbs.toFixed(2)} (kỳ vọng 7–13) std=${std.toFixed(2)} (kỳ vọng 9–14)`);
  assert.ok(meanAbs >= 7 && meanAbs <= 13, `TB cấu trúc ${meanAbs} ngoài [7,13]`);
  assert.ok(std >= 9 && std <= 14, `std cấu trúc ${std} ngoài [9,14]`);
});

console.log("== glitch: không đo khớp từng frame (ghi chú, cấu trúc đo ở harness V14) ==");
console.log("  (i) noise render là nhiễu thời gian (allf=t), glitch render = rgb-shift + noise thời gian;");
console.log("  (i) canvas glitch từ đợt 14 R6 làm đúng cấu trúc render (rgb-shift + noise có seed), không còn slice; đợt 16 H5 sửa thêm trunc + nhân biên + nhiễu Gauss;");
console.log("  (i) canvas dùng seed xác định nên không thể khớp từng frame — chỉ xấp xỉ về cấu trúc/thống kê, không assert MAD từng frame.");

console.log(`\nPASS ${pass} test`);
