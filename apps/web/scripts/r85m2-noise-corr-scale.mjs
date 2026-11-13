#!/usr/bin/env node
/**
 * r85m2-noise-corr-scale.mjs — Phase 9 đợt 85, luồng M2: quỹ đạo tương
 * quan chéo kênh của trường nhiễu theo thang upscale s.
 *
 * Giả thuyết kiểm tra ("nhiễu tương quan theo thang"): trường nhiễu gồm
 * nhiễu luma TRẮNG (độc lập từng pixel) + nhiễu chroma KHỐI 2×2 (tương
 * quan không gian). Upscale làm suy hao thành phần trắng mạnh hơn thành
 * phần khối, nên tỉ trọng chroma — và do đó corr chéo kênh — TRÔI theo
 * s. Nếu trường render (ffmpeg noise trên yuv420p) và trường editor
 * (addYuvNoise, bt601, chroma native ước lượng k=1.04/1.12) trôi khác
 * nhau theo s thì Δcorr ở s≈2,26 là chênh LỆCH SINH NHIỄU, không phải
 * lỗi resampler; nếu cả hai trôi giống nhau thì Δcorr phải đến từ
 * đường resample (CTM-canvas ≠ Mitchell) — phân biệt bằng probe headed.
 *
 * Tái tạo addYuvNoise CHÍNH XÁC từ apps/web/src/lib/effectCanvas.ts:
 * mulberry32 + Box-Muller, thứ tự rút Cb/Cr từng khối 2×2 rồi Y từng
 * pixel, sigma = strength/√3, strength noise05 = 5+0,5·45 = 27,5,
 * noise10 = 50, seed = 0x9e3779b9 ^ floor(1,0·30) = 0x9e3779b9 ^ 30
 * (localT = 1,0 s như snapshot F6/L2). Base dùng R_plain (render) thay
 * S1 (base decode) — chỉ khác qua kẹp [0,255], hiếm chạm trên ocean.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r85m2-noise-corr-scale.mjs
 * Chỉ đo offline. KHÔNG push/tag/binary/workflow. KHÔNG sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, bcCubicKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const F6 = path.join(GOAL, "round78-f6");
const M2 = path.join(GOAL, "round85-m2");
const OUT = path.join(M2, "r85m2-noise-corr-scale.json");
const r3 = (v) => +v.toFixed(3);
const mitchell = (x) => bcCubicKernel(x, 1 / 3, 1 / 3);
const SEED = (0x9e3779b9 ^ 30) >>> 0;

// ---------- RNG + YUV (sao chép y hệt effectCanvas.ts) ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussianGenerator(rnd) {
  let spare = null;
  return () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0;
    while (u === 0) u = rnd();
    const v = rnd();
    const m = Math.sqrt(-2 * Math.log(u));
    spare = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  };
}
function rgbToYuv709(r, g, b) {
  const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return [16 + 219 * yl, 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.0722), 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.2126)];
}
function yuv709ToRgb(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.79274 * (cr - 128), yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128), yy + 2.1122 * (cb - 128)];
}
function rgbToYuv601(r, g, b) {
  const yl = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return [16 + 219 * yl, 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.114), 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.299)];
}
function yuv601ToRgb(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.59603 * (cr - 128), yy - 0.39176 * (cb - 128) - 0.81297 * (cr - 128), yy + 2.01723 * (cb - 128)];
}
const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
function estimateNativeChroma(derived, k) {
  const e = 128 + k * (derived - 128);
  return e < 16 ? 16 : e > 240 ? 240 : e;
}
// Tái tạo addYuvNoise: trả về Buffer RGB ảnh đã cộng nhiễu (uint8).
function addYuvNoise(rgb, w, h, strength, seed, matrix) {
  const sigma = strength / Math.sqrt(3);
  const gauss = gaussianGenerator(mulberry32(seed));
  const cw = (w + 1) >> 1, ch = (h + 1) >> 1;
  const rgbToYuv = matrix === "bt601" ? rgbToYuv601 : rgbToYuv709;
  const yuvToRgb = matrix === "bt601" ? yuv601ToRgb : yuv709ToRgb;
  const Y = new Float64Array(w * h), CB = new Float64Array(w * h), CR = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const [yy, cb, cr] = rgbToYuv(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
    Y[i] = yy; CB[i] = cb; CR[i] = cr;
  }
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  const cbNoise = new Float64Array(cw * ch), crNoise = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= w || y >= h) continue;
      const i = y * w + x;
      sCb += CB[i]; sCr += CR[i]; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma(sCb / n, 1.04);
    estCr[i] = estimateNativeChroma(sCr / n, 1.12);
    cbNoise[i] = gauss() * sigma;
    crNoise[i] = gauss() * sigma;
  }
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const ny = Math.min(255, Math.max(0, Y[i] + gauss() * sigma));
    const ncb = Math.min(255, Math.max(0, estCb[ci] + cbNoise[ci]));
    const ncr = Math.min(255, Math.max(0, estCr[ci] + crNoise[ci]));
    const [r, g, b] = yuvToRgb(ny, ncb, ncr);
    out[p] = clamp255(r); out[p + 1] = clamp255(g); out[p + 2] = clamp255(b);
  }
  return out;
}

// ---------- resample + stats ----------
function roundU8(v) { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; }
function resamplePlaneKernel(src, srcW, srcH, dstW, dstH, kernel) {
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) for (let i = 0; i < dstW; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, dstW / srcW, srcW, kernel, 1)) acc += w * src[y * srcW + j];
    tmp[y * dstW + i] = acc;
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) for (let i = 0; i < dstH; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, dstH / srcH, srcH, kernel, 1)) acc += w * tmp[j * dstW + x];
    out[i * dstW + x] = acc;
  }
  return out;
}
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const r = resamplePlaneKernel(pl, srcW, srcH, dstW, dstH, kernel);
    for (let i = 0; i < dstW * dstH; i++) out[i * 3 + c] = roundU8(r[i]);
  }
  return out;
}
function fieldStats(d, w, h) {
  const n = d.length / 3;
  const out = { std: [], kurt: [], corr: [], lagX: [], lagY: [] };
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) { let s = 0; for (let i = c; i < d.length; i += 3) s += d[i]; mean[c] = s / n; }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) { const v = d[i] - mean[c]; s2 += v * v; s4 += v * v * v * v; }
    const std = Math.sqrt(s2 / n);
    out.std.push(+std.toFixed(2));
    out.kurt.push(std > 0 ? +(s4 / n / (std ** 4) - 3).toFixed(2) : 0);
    let sx = 0, nx = 0, sy = 0, ny = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w - 1; x++) {
      const i0 = (y * w + x) * 3 + c, i1 = i0 + 3;
      sx += (d[i0] - mean[c]) * (d[i1] - mean[c]); nx++;
    }
    for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {
      const i0 = (y * w + x) * 3 + c, i1 = ((y + 1) * w + x) * 3 + c;
      sy += (d[i0] - mean[c]) * (d[i1] - mean[c]); ny++;
    }
    out.lagX.push(std > 0 ? +(sx / nx / (std * std)).toFixed(3) : 0);
    out.lagY.push(std > 0 ? +(sy / ny / (std * std)).toFixed(3) : 0);
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(out.std[a] > 0 && out.std[b] > 0 ? +(s / n / (out.std[a] * out.std[b])).toFixed(3) : 0);
  }
  return out;
}
function diffField(a, b) { const o = new Float64Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] - b[i]; return o; }

const W = 640, H = 360;
const RDIR = path.join(F6, "render", "ocean640");
const plain = fs.readFileSync(path.join(RDIR, "fullrgb-plain.raw"));
const report = { generated: new Date().toISOString(), seed: SEED, scales: [1.0, 1.132, 1.5, 2.264, 3.0], fields: {} };

// Trường nhiễu ở project-size.
const fields = {};
for (const [v, strength] of [["noise05", 27.5], ["noise10", 50]]) {
  const rend = fs.readFileSync(path.join(RDIR, `fullrgb-${v}.raw`));
  fields[`render-${v}`] = diffField(rend, plain);
  fields[`editor601-${v}`] = diffField(addYuvNoise(plain, W, H, strength, SEED, "bt601"), plain);
  fields[`editor709-${v}`] = diffField(addYuvNoise(plain, W, H, strength, SEED, "bt709"), plain);
}
for (const [name, f] of Object.entries(fields)) {
  const traj = [];
  for (const s of report.scales) {
    const dw = Math.round(W * s), dh = Math.round(H * s);
    let up;
    if (s === 1.0) up = f;
    else {
      // Upscale trường delta trực tiếp bằng Mitchell float (không kẹp uint8,
      // để corr không nhiễm làm tròn) — song song kiểm tra bản uint8 ở s=2,264.
      up = new Float64Array(dw * dh * 3);
      for (let c = 0; c < 3; c++) {
        const pl = new Float64Array(W * H);
        for (let i = 0; i < W * H; i++) pl[i] = f[i * 3 + c];
        const r = resamplePlaneKernel(pl, W, H, dw, dh, mitchell);
        for (let i = 0; i < dw * dh; i++) up[i * 3 + c] = r[i];
      }
    }
    const st = fieldStats(up, dw, dh);
    traj.push({ s, dw, dh, std: st.std, kurt: st.kurt, corr: st.corr, lagX: st.lagX, lagY: st.lagY });
    console.log(`${name} s=${s}: std=${st.std} corr=${st.corr} lagX=${st.lagX}`);
  }
  report.fields[name] = traj;
}
// Δcorr(render, editor601) và (render, editor709) theo s — so với ngưỡng 0,12
// và với Δcorr đo được từ snapshot (s=1,132: ≤0,007; s=2,264: 0,13–0,15).
for (const v of ["noise05", "noise10"]) {
  console.log(`\nΔcorr theo s (${v}):`);
  for (let i = 0; i < report.scales.length; i++) {
    const cr = report.fields[`render-${v}`][i].corr;
    const c601 = report.fields[`editor601-${v}`][i].corr;
    const c709 = report.fields[`editor709-${v}`][i].corr;
    const d601 = cr.map((x, j) => +(Math.abs(x - c601[j]).toFixed(3)));
    const d709 = cr.map((x, j) => +(Math.abs(x - c709[j]).toFixed(3)));
    console.log(`  s=${report.scales[i]}: render corr=${cr} | Δcorr vs editor601=${d601} | vs editor709=${d709}`);
  }
}
fs.mkdirSync(M2, { recursive: true });
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
