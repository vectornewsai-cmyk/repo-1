#!/usr/bin/env node
/**
 * r75c1-analyze.mjs — Phase 9 đợt 75, luồng C1: đo lại ocean w1440 noise05
 * SAU khi sửa rò plain ở preview (letterbox intermediate dw×dh).
 *
 * Khối helper (rgbToYuv709 … deltaArrays) sao chép VERBATIM từ
 * r74b1-analyze.mjs; corrSlope sao chép verbatim từ r74b1-leak.mjs.
 * Đo trên snapshot headed MỚI (round75-c1, code đã sửa) + frame render Z2
 * (method-T, fullrgb-ocean-plain/noise05.raw) + resample trilinear —
 * đúng giao thức B1 Part C (quét s) + Part D (bin plainAbsDiff) + leak.
 * So sánh trực tiếp với điểm B1 w1440 (s=0,3819): ΔkurtG 1,12,
 * ΔcorrRG 0,239, stdRatioG 1,19, plainAbsMad 3,294 — kỳ vọng ΔkurtG ≤ 0,35.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r75c1-analyze.mjs
 * JSON: hidden_files/round75-c1/r75c1-analysis.json.
 * KHÔNG push/tag/binary.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const B1 = path.join(GOAL, "round74-b1");
const C1 = path.join(GOAL, "round75-c1");
const OUT = path.join(C1, "r75c1-analysis.json");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
const D0_THRESHOLD = 2.5;
const PREVIEW_SEED_LOCALT1 = (0x9e3779b9 ^ 30) >>> 0;

// 0x9e3779b9 ^ Math.floor(1.0 * 30).

// ---------- sao chép verbatim r73a3-d0cond.mjs ----------
function rgbToYuv709_70x6(r, g, b) {
  const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const y = 16 + 219 * yl;
  const cb = 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.0722);
  const cr = 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.2126);
  return [y, cb, cr];
}
function yuv709ToRgb_70x6(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.79274 * (cr - 128), yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128), yy + 2.1122 * (cb - 128)];
}
function estimateNativeChroma_70x6(derived, k) {
  const e = 128 + k * (derived - 128);
  return e < 16 ? 16 : e > 240 ? 240 : e;
}
function estShiftFrame_70x6(rgb, srcW, srcH) {
  const out = Buffer.alloc(srcW * srcH * 3);
  const cw = (srcW + 1) >> 1, ch = (srcH + 1) >> 1;
  const Y = new Float64Array(srcW * srcH), CB = new Float64Array(srcW * srcH), CR = new Float64Array(srcW * srcH);
  for (let i = 0; i < srcW * srcH; i++) {
    const p = i * 3;
    const [yy, cb, cr] = rgbToYuv709_70x6(rgb[p], rgb[p + 1], rgb[p + 2]);
    Y[i] = yy; CB[i] = cb; CR[i] = cr;
  }
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= srcW || y >= srcH) continue;
      const i = y * srcW + x;
      sCb += CB[i]; sCr += CR[i]; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma_70x6(sCb / n, 1.04);
    estCr[i] = estimateNativeChroma_70x6(sCr / n, 1.12);
  }
  const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let y = 0; y < srcH; y++) for (let x = 0; x < srcW; x++) {
    const i = y * srcW + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const [r, g, b] = yuv709ToRgb_70x6(Y[i], estCb[ci], estCr[ci]);
    out[p] = clamp255(r); out[p + 1] = clamp255(g); out[p + 2] = clamp255(b);
  }
  return out;
}
function delta0Viewport_70x6(plainRgb, srcW, srcH, dstW, dstH) {
  const shifted = estShiftFrame_70x6(plainRgb, srcW, srcH);
  const a = resampleRgb24Trilinear(plainRgb, srcW, srcH, dstW, dstH);
  const b = resampleRgb24Trilinear(shifted, srcW, srcH, dstW, dstH);
  const d0 = new Int16Array(dstW * dstH * 3);
  for (let i = 0; i < dstW * dstH * 3; i++) d0[i] = b[i] - a[i];
  return d0;
}
function channelStats(d) {
  const n = d.length / 3;
  const out = { std: [], kurt: [], corr: [] };
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let i = c; i < d.length; i += 3) s += d[i];
    mean[c] = s / n;
  }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) {
      const v = d[i] - mean[c];
      s2 += v * v; s4 += v * v * v * v;
    }
    const std = Math.sqrt(s2 / n);
    out.std.push(+std.toFixed(2));
    out.kurt.push(+(s4 / n / (std ** 4) - 3).toFixed(2));
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(+(s / n / (out.std[a] * out.std[b])).toFixed(3));
  }
  return out;
}
function fullDeltaStats(previewPlain, previewNoise, renderPlain, renderNoise, vw, vh, delta0) {
  const n = vw * vh;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  let sumAbs = 0;
  for (let i = 0; i < n * 3; i++) {
    const dp = previewNoise[i] - previewPlain[i] - (delta0 ? delta0[i] : 0);
    const dr = renderNoise[i] - renderPlain[i];
    dP[i] = dp; dR[i] = dr;
    sumAbs += Math.abs(dp - dr);
  }
  const preview = channelStats(dP), render = channelStats(dR);
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
  const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
  const okStd = ratios.every((r) => r >= VERDICT.stdLo && r <= VERDICT.stdHi);
  const okKurt = dKurt.every((x) => x <= VERDICT.kurt);
  const okCorr = dCorr.every((x) => x <= VERDICT.corr);
  return {
    n, deltaMad: +(sumAbs / (n * 3)).toFixed(3),
    previewStd: preview.std, renderStd: render.std, stdRatio: ratios,
    previewKurt: preview.kurt, renderKurt: render.kurt, kurtDiff: dKurt,
    previewCorr: preview.corr, renderCorr: render.corr, corrDiff: dCorr,
    verdict: okStd && okKurt && okCorr ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ",
    okStd, okKurt, okCorr,
  };
}
function absMad(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0, max = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]);
      sum += d;
      if (d > dmax) dmax = d;
    }
    if (dmax > max) max = dmax;
    if (dmax <= 8) le8++;
  }
  return { n, mad: +(sum / (n * 3)).toFixed(3), max: +max.toFixed(1), le8: +(le8 / n).toFixed(4) };
}
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
function addYuvNoiseRgb24(rgb, w, h, strength, seed) {
  const sigma = strength / Math.sqrt(3);
  const gauss = gaussianGenerator(mulberry32(seed));
  const cw = (w + 1) >> 1, ch = (h + 1) >> 1;
  const Y = new Float64Array(w * h), CB = new Float64Array(w * h), CR = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const p = i * 3;
    const [yy, cb, cr] = rgbToYuv709_70x6(rgb[p], rgb[p + 1], rgb[p + 2]);
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
    estCb[i] = estimateNativeChroma_70x6(sCb / n, 1.04);
    estCr[i] = estimateNativeChroma_70x6(sCr / n, 1.12);
    cbNoise[i] = gauss() * sigma;
    crNoise[i] = gauss() * sigma;
  }
  const out = Buffer.alloc(w * h * 3);
  const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const ny = Math.min(255, Math.max(0, Y[i] + gauss() * sigma));
    const ncb = Math.min(255, Math.max(0, estCb[ci] + cbNoise[ci]));
    const ncr = Math.min(255, Math.max(0, estCr[ci] + crNoise[ci]));
    const [r, g, b] = yuv709ToRgb_70x6(ny, ncb, ncr);
    out[p] = clamp255(r); out[p + 1] = clamp255(g); out[p + 2] = clamp255(b);
  }
  return out;
}
// ---------- helpers mới (B1) ----------
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }

/** Thống kê std/kurt từng kênh của delta (Float64Array n*3) trên mask pixel. */
function maskedChannelStats(d, mask) {
  const n = mask.length;
  let cnt = 0;
  for (let p = 0; p < n; p++) if (mask[p]) cnt++;
  const out = { n: cnt, std: [], kurt: [] };
  if (cnt === 0) return out;
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let p = 0; p < n; p++) if (mask[p]) s += d[p * 3 + c];
    mean[c] = s / cnt;
  }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let p = 0; p < n; p++) {
      if (!mask[p]) continue;
      const v = d[p * 3 + c] - mean[c];
      s2 += v * v; s4 += v * v * v * v;
    }
    const std = Math.sqrt(s2 / cnt);
    out.std.push(+std.toFixed(2));
    out.kurt.push(std > 0 ? +(s4 / cnt / (std ** 4) - 3).toFixed(2) : 0);
  }
  return out;
}

function deltaArrays(previewPlain, previewNoise, renderPlain, renderNoise, vw, vh, delta0) {
  const n = vw * vh;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) {
    dP[i] = previewNoise[i] - previewPlain[i] - (delta0 ? delta0[i] : 0);
    dR[i] = renderNoise[i] - renderPlain[i];
  }
  return { dP, dR };
}
function corrSlope(X, Y, vw, vh, y0, y1, ch) {
  let n = 0, mX = 0, mY = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < vw; x++) { const p = y * vw + x; mX += X[p * 3 + ch]; mY += Y[p * 3 + ch]; n++; }
  mX /= n; mY /= n;
  let sXX = 0, sYY = 0, sXY = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < vw; x++) {
    const p = y * vw + x;
    const a = X[p * 3 + ch] - mX, b = Y[p * 3 + ch] - mY;
    sXX += a * a; sYY += b * b; sXY += a * b;
  }
  const corr = sXX > 0 && sYY > 0 ? sXY / Math.sqrt(sXX * sYY) : 0;
  const slope = sYY > 0 ? sXY / sYY : 0; // X ~ slope * Y
  return { n, corr: +corr.toFixed(3), slope: +slope.toFixed(2), stdX: +Math.sqrt(sXX / n).toFixed(2), stdY: +Math.sqrt(sYY / n).toFixed(2) };
}

async function main() {
  const snapPath = path.join(C1, "headed-w1440x900", "r74b1-snaps-w1440x900.json");
  if (!fs.existsSync(snapPath)) { console.log(`thiếu snapshot mới: ${snapPath}`); process.exitCode = 2; return; }
  const doc = JSON.parse(fs.readFileSync(snapPath, "utf8"));
  const variants = doc.snaps?.ocean;
  if (!variants?.plain || !variants?.noise05) { console.log("snapshot mới thiếu ocean plain/noise05"); process.exitCode = 2; return; }
  const vw = variants.plain.w, vh = variants.plain.h;
  const s = variants.plain.rect.scale;
  const prevPlain = b64ToRgb(variants.plain.rgbB64);
  const prevNoise = b64ToRgb(variants.noise05.rgbB64);
  const oceanPlain = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
  const oceanNoise05 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw"));
  const renderPlainTri = resampleRgb24Trilinear(oceanPlain, 1280, 720, vw, vh);
  const renderNoiseTri = resampleRgb24Trilinear(oceanNoise05, 1280, 720, vw, vh);
  const plainMad = absMad(prevPlain, renderPlainTri).mad;
  const d0 = delta0Viewport_70x6(oceanPlain, 1280, 720, vw, vh);
  const d0stats = channelStats(Float64Array.from(d0));
  // Độ lớn phần dư plain (previewPlain - renderPlainTri) để đối chiếu d0.
  const plainDiff = new Float64Array(vw * vh * 3);
  for (let i = 0; i < vw * vh * 3; i++) plainDiff[i] = prevPlain[i] - renderPlainTri[i];
  const plainDiffStats = channelStats(plainDiff);
  console.log(`  d0 magnitude: std=${JSON.stringify(d0stats.std)} kurt=${JSON.stringify(d0stats.kurt)}; plainDiff residual std=${JSON.stringify(plainDiffStats.std)} (B1: plainDiff lớn, d0 là hiệu chỉnh nhỏ so với rò)`);
  const applyD0 = plainMad <= D0_THRESHOLD;
  const stNoD0 = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, null);
  const stD0 = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0);
  const stPrimary = applyD0 ? stD0 : stNoD0;
  console.log(`C1 ocean w1440 (code đã sửa): s=${s.toFixed(4)} rect=${vw}x${vh} plainAbsMad=${plainMad} (B1: 3,294) d0Applied=${applyD0}`);
  console.log(`  KHÔNG d0: ${stNoD0.verdict} ΔkurtG=${stNoD0.kurtDiff[1]} ΔcorrRG=${stNoD0.corrDiff[0]} stdRatioG=${stNoD0.stdRatio[1]} Δkurt=${JSON.stringify(stNoD0.kurtDiff)} Δcorr=${JSON.stringify(stNoD0.corrDiff)} stdRatio=${JSON.stringify(stNoD0.stdRatio)}`);
  console.log(`  CÓ d0:    ${stD0.verdict} ΔkurtG=${stD0.kurtDiff[1]} ΔcorrRG=${stD0.corrDiff[0]} stdRatioG=${stD0.stdRatio[1]} Δkurt=${JSON.stringify(stD0.kurtDiff)} Δcorr=${JSON.stringify(stD0.corrDiff)} stdRatio=${JSON.stringify(stD0.stdRatio)}`);
  console.log(`  CHÍNH (theo luật B1, d0 iff plainMad<=2,5): ${stPrimary.verdict} ΔkurtG=${stPrimary.kurtDiff[1]} (B1: 1,12) ΔcorrRG=${stPrimary.corrDiff[0]} (B1: 0,239) stdRatioG=${stPrimary.stdRatio[1]} (B1: 1,19)`);

  // Part D: bin plainAbsDiff (biên A3 [0,1,2,4,8,256]) — std G preview/render theo bin.
  const n = vw * vh;
  const { dP, dR } = deltaArrays(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, applyD0 ? d0 : null);
  const edges = [0, 1, 2, 4, 8, 256];
  const bins = [];
  for (let b = 0; b < edges.length - 1; b++) {
    const mask = new Uint8Array(n);
    for (let p = 0; p < n; p++) {
      let dmax = 0;
      for (let c = 0; c < 3; c++) { const d = Math.abs(prevPlain[p * 3 + c] - renderPlainTri[p * 3 + c]); if (d > dmax) dmax = d; }
      if (dmax >= edges[b] && dmax < edges[b + 1]) mask[p] = 1;
    }
    const sp = maskedChannelStats(dP, mask), sr = maskedChannelStats(dR, mask);
    bins.push({ bin: `[${edges[b]},${edges[b + 1]})`, frac: +(sp.n / n).toFixed(3), prevStdG: sp.std[1], renderStdG: sr.std[1] });
    console.log(`  D bin [${edges[b]},${edges[b + 1]}): frac=${(sp.n / n).toFixed(3)} prevStdG=${sp.std[1]} renderStdG=${sr.std[1]} (B1 s=0,382 bin xấu nhất: frac 0,109 prevStdG 18,64 renderStdG 8,61)`);
  }

  // Leak check: X=(dP-dR_sameSeed) vs Y=-plainDiff, kênh G, toàn khung.
  // Replica noise05 cùng seed preview trên frame plain 1280x720 rồi trilinear.
  const noiseP = addYuvNoiseRgb24(oceanPlain, 1280, 720, 28, PREVIEW_SEED_LOCALT1);
  const renderNoiseSame = resampleRgb24Trilinear(noiseP, 1280, 720, vw, vh);
  const X = new Float64Array(n * 3), Y = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) {
    X[i] = (prevNoise[i] - prevPlain[i]) - (renderNoiseSame[i] - renderPlainTri[i]);
    Y[i] = -(prevPlain[i] - renderPlainTri[i]);
  }
  const leak = corrSlope(X, Y, vw, vh, 0, vh, 1);
  console.log(`  LEAK G toàn khung: corr=${leak.corr} slope=${leak.slope} stdX=${leak.stdX} stdY=${leak.stdY} (B1 gradient1920 E-sine: corr 0,993 stdX 14,72 — kỳ vọng sau sửa: corr ~0, stdX nhỏ)`);

  // D1/D2/D3 từ snapshot mới.
  const d1 = variants.plain2 ? variants.plain.rgbB64 === variants.plain2.rgbB64 : null;
  const rPlain = doc.rawFrames?.ocean?.plain, rNoise = doc.rawFrames?.ocean?.noise05;
  const d3 = rPlain?.ok && rNoise?.ok ? (rPlain.hash === rNoise.hash && rPlain.currentTime === rNoise.currentTime) : null;
  console.log(`  D1 plain 2 lần pixel-identical: ${d1}; D3 cùng-khung (raw hash plain==noise05): ${d3} (plain hash=${rPlain?.hash} noise05 hash=${rNoise?.hash} ct=${rPlain?.currentTime}/${rNoise?.currentTime})`);

  // Baseline B1 để so trực tiếp.
  const b1doc = JSON.parse(fs.readFileSync(path.join(B1, "headed-w1440x900", "r74b1-snaps-w1440x900.json"), "utf8"));
  const bv = b1doc.snaps.ocean;
  const bPrevPlain = b64ToRgb(bv.plain.rgbB64), bPrevNoise = b64ToRgb(bv.noise05.rgbB64);
  const bPlainMad = absMad(bPrevPlain, renderPlainTri).mad;
  const bSt = fullDeltaStats(bPrevPlain, bPrevNoise, renderPlainTri, renderNoiseTri, vw, vh, null);
  console.log(`  BASELINE B1 (tính lại từ snapshot cũ, cùng code phân tích): plainAbsMad=${bPlainMad} ΔkurtG=${bSt.kurtDiff[1]} ΔcorrRG=${bSt.corrDiff[0]} stdRatioG=${bSt.stdRatio[1]}`);

  const report = {
    window: doc.window, rect: { w: vw, h: vh }, s: +s.toFixed(4),
    plainAbsMad: plainMad, d0Applied: applyD0,
    noD0: { verdict: stNoD0.verdict, kurtDiff: stNoD0.kurtDiff, corrDiff: stNoD0.corrDiff, stdRatio: stNoD0.stdRatio, deltaMad: stNoD0.deltaMad },
    withD0: { verdict: stD0.verdict, kurtDiff: stD0.kurtDiff, corrDiff: stD0.corrDiff, stdRatio: stD0.stdRatio, deltaMad: stD0.deltaMad },
    primary: { verdict: stPrimary.verdict, kurtDiffG: stPrimary.kurtDiff[1], corrDiffRG: stPrimary.corrDiff[0], stdRatioG: stPrimary.stdRatio[1] },
    bins, leakG: leak, d1, d3,
    baselineB1Recalc: { plainAbsMad: bPlainMad, kurtDiffG: bSt.kurtDiff[1], corrDiffRG: bSt.corrDiff[0], stdRatioG: bSt.stdRatio[1] },
  };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON phân tích: ${OUT}`);
}
main().catch((e) => { console.error(`C1 LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
