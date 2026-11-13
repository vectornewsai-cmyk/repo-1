#!/usr/bin/env node
/**
 * r74b1-analyze.mjs — Phase 9 đợt 74, luồng B1: phân tích 3 thí nghiệm
 * nợ ocean w1440 (A3 §6):
 *  (A) probe tổng hợp: gradient dốc + noise05 ở w1440 (+w1920 đối chứng) —
 *      đo std delta theo dải gradient / bin gradient / bin pha downscale,
 *      so preview với render-P (addYuvNoise verbatim, cùng seed preview);
 *  (B) giao thức cùng-khung: tổng hợp raw hash + trạng thái element
 *      ở mọi snapshot B1;
 *  (C) quét thang s liên tục trên ocean noise05 — Δkurt/Δcorr/stdRatio
 *      theo s (dùng snapshot B1 + Y2 w1440/w1920 làm điểm phụ).
 *
 * Hàm delta0/channelStats/fullDeltaStats/absMad + RNG + addYuvNoise sao
 * chép VERBATIM từ r73a3-d0cond.mjs; resample từ chrome-resample.mjs.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r74b1-analyze.mjs
 * Env: R74B1_OUT (mặc định hidden_files/round74-b1/r74b1-analysis.json).
 * Exit 0 khi xong. KHÔNG push/tag/binary/workflow.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const B1 = path.join(GOAL, "round74-b1");
const OUT = process.env.R74B1_OUT || path.join(B1, "r74b1-analysis.json");

const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
const D0_THRESHOLD = 2.5;
// Seed noise preview tại localT = 1.0 (effectCanvas.ts canvasEffectOps):
// 0x9e3779b9 ^ Math.floor(1.0 * 30).
const PREVIEW_SEED_LOCALT1 = (0x9e3779b9 ^ 30) >>> 0;

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

function loadSnaps(dir, stem) {
  const doc = JSON.parse(fs.readFileSync(path.join(dir, stem), "utf8"));
  return doc;
}

async function main() {
  const report = {
    previewSeedLocalT1: PREVIEW_SEED_LOCALT1,
    verdictThresholds: VERDICT, d0Threshold: D0_THRESHOLD,
    partA: {}, partB: {}, partC: {},
  };

  // ================= PART B: giao thức cùng-khung (tổng hợp mọi snapshot B1) =================
  const headedDirs = fs.readdirSync(B1).filter((d) => d.startsWith("headed-w") && fs.statSync(path.join(B1, d)).isDirectory());
  const partB = { windows: {}, sameFrame: 0, total: 0, degraded: [] };
  for (const dir of headedDirs.sort()) {
    const files = fs.readdirSync(path.join(B1, dir)).filter((f) => f.startsWith("r74b1-snaps-"));
    for (const f of files) {
      const doc = JSON.parse(fs.readFileSync(path.join(B1, dir, f), "utf8"));
      const win = doc.window;
      partB.windows[win] = partB.windows[win] || {};
      for (const [src, variants] of Object.entries(doc.snaps)) {
        const raw = doc.rawFrames?.[src] || {};
        const entry = { rect: variants.plain?.rect || null, variants: {} };
        for (const [v, snap] of Object.entries(variants)) {
          entry.variants[v] = { mean: snap.mean, rawHash: raw[v]?.hash || null, rawOk: !!raw[v]?.ok, ct: raw[v]?.currentTime ?? null, paused: raw[v]?.paused ?? null, seeking: raw[v]?.seeking ?? null, readyState: raw[v]?.readyState ?? null };
        }
        const rp = raw.plain, rn = raw.noise05;
        if (rp?.ok && rn?.ok) {
          partB.total++;
          const same = rp.hash === rn.hash && rp.currentTime === rn.currentTime;
          if (same) partB.sameFrame++;
          entry.sameFrame = { same, plainHash: rp.hash, noiseHash: rn.hash, plainCt: rp.currentTime, noiseCt: rn.currentTime };
        } else {
          entry.sameFrame = { same: null, reason: `raw plain ok=${!!rp?.ok} / raw noise05 ok=${!!rn?.ok}` };
          partB.degraded.push(`${win}/${src}`);
        }
        partB.windows[win][src] = entry;
      }
    }
  }
  report.partB = partB;
  console.log(`\n== PART B cùng-khung: ${partB.sameFrame}/${partB.total} cặp plain/noise05 cùng hash+currentTime; hạ cấp: ${partB.degraded.length ? partB.degraded.join(", ") : "không có"} ==`);

  // ================= PART A: probe tổng hợp gradient =================
  const gradFrame = fs.readFileSync(path.join(B1, "media", "gradient-f30.rgb"));
  const BANDS = [
    { name: "A_flat", y0: 0, y1: 144, grad: "~0" },
    { name: "B_ramp", y0: 144, y1: 288, grad: "~0.20/px" },
    { name: "C_sawtooth", y0: 288, y1: 432, grad: "~3.75/px" },
    { name: "D_checker", y0: 432, y1: 576, grad: "~127/px" },
    { name: "E_sine", y0: 576, y1: 720, grad: "~54/px dọc" },
  ];
  const GRAD_WINDOWS = ["1440x900", "1920x1080"];
  // Tìm snapshot gradient theo doc.window (thư mục có thể mang hậu tố
  // -grad/-ocean do 2 nguồn chung 1 cỡ cửa sổ — xem LIMITS §2).
  function findGradientDoc(wh) {
    for (const dir of fs.readdirSync(B1).filter((d) => d.startsWith("headed-w") && fs.statSync(path.join(B1, d)).isDirectory()).sort()) {
      for (const f of fs.readdirSync(path.join(B1, dir)).filter((x) => x.startsWith("r74b1-snaps-"))) {
        const doc = JSON.parse(fs.readFileSync(path.join(B1, dir, f), "utf8"));
        if (doc.window === `w${wh}` && doc.snaps?.gradient) return doc;
      }
    }
    return null;
  }
  for (const wh of GRAD_WINDOWS) {
    const doc = findGradientDoc(wh);
    if (!doc) { console.log(`PART A: thiếu snapshot gradient ở w${wh} — bỏ qua`); continue; }
    const variants = doc.snaps.gradient;
    if (!variants?.plain || !variants?.noise05) { console.log(`PART A: thiếu snapshot gradient ở ${wh} — bỏ qua`); continue; }
    const vw = variants.plain.w, vh = variants.plain.h;
    const s = variants.plain.rect.scale;
    const prevPlain = b64ToRgb(variants.plain.rgbB64);
    const prevNoise = b64ToRgb(variants.noise05.rgbB64);
    const renderPlainTri = resampleRgb24Trilinear(gradFrame, 1280, 720, vw, vh);
    const plainMad = absMad(prevPlain, renderPlainTri);
    // render-P: cùng seed preview (cùng realization) + seed 12345 (đối chứng thống kê).
    const noiseP_same = addYuvNoiseRgb24(gradFrame, 1280, 720, 28, PREVIEW_SEED_LOCALT1);
    const noiseP_12345 = addYuvNoiseRgb24(gradFrame, 1280, 720, 28, 12345);
    const renderNoiseSame = resampleRgb24Trilinear(noiseP_same, 1280, 720, vw, vh);
    const renderNoise12345 = resampleRgb24Trilinear(noiseP_12345, 1280, 720, vw, vh);
    const { dP, dR } = deltaArrays(prevPlain, prevNoise, renderPlainTri, renderNoiseSame, vw, vh, null);
    const { dR: dR12345 } = deltaArrays(prevPlain, prevNoise, renderPlainTri, renderNoise12345, vw, vh, null);
    const n = vw * vh;
    // Mask theo dải (viewport y = full-res y * vh/720).
    const bandOut = {};
    for (const band of BANDS) {
      const y0 = Math.floor(band.y0 * vh / 720), y1 = Math.min(vh, Math.ceil(band.y1 * vh / 720));
      const mask = new Uint8Array(n);
      for (let y = y0; y < y1; y++) for (let x = 0; x < vw; x++) mask[y * vw + x] = 1;
      const p = maskedChannelStats(dP, mask);
      const r = maskedChannelStats(dR, mask);
      const r2 = maskedChannelStats(dR12345, mask);
      bandOut[band.name] = {
        grad: band.grad, yViewport: [y0, y1], n: p.n,
        previewStd: p.std, previewKurt: p.kurt,
        renderPSameSeedStd: r.std, renderPSameSeedKurt: r.kurt,
        renderP12345Std: r2.std, renderP12345Kurt: r2.kurt,
        varRatioG_sameSeed: +(p.std[1] ** 2 / r.std[1] ** 2).toFixed(2),
        varRatioG_12345: +(p.std[1] ** 2 / r2.std[1] ** 2).toFixed(2),
      };
      console.log(`  A ${wh} s=${s.toFixed(3)} ${band.name} (${band.grad}): prevStdG=${p.std[1]} renderP-stdG=${r.std[1]} (seed12345 ${r2.std[1]}) varRatioG=${bandOut[band.name].varRatioG_sameSeed} prevKurtG=${p.kurt[1]} renderKurtG=${r.kurt[1]}`);
    }
    // Bin theo |gradient| của preview plain (kênh G, viewport) + bin theo pha downscale.
    const gradBins = [[0, 0.5], [0.5, 2], [2, 8], [8, 32], [32, 256]];
    const gradBinOut = [];
    for (const [lo, hi] of gradBins) {
      const mask = new Uint8Array(n);
      for (let y = 1; y < vh - 1; y++) for (let x = 1; x < vw - 1; x++) {
        const p = (y * vw + x) * 3 + 1;
        const gx = Math.abs(prevPlain[p + 3] - prevPlain[p - 3]) / 2;
        if (gx >= lo && gx < hi) mask[y * vw + x] = 1;
      }
      const p = maskedChannelStats(dP, mask);
      const r = maskedChannelStats(dR, mask);
      gradBinOut.push({ gradRange: [lo, hi], n: p.n, previewStdG: p.std[1], renderPStdG: r.std[1], varRatioG: p.n ? +(p.std[1] ** 2 / r.std[1] ** 2).toFixed(2) : null, previewKurtG: p.kurt[1] });
      console.log(`  A ${wh} gradBin [${lo},${hi}): n=${p.n} prevStdG=${p.std[1]} renderPStdG=${r.std[1]} varRatioG=${gradBinOut.at(-1).varRatioG} prevKurtG=${p.kurt[1]}`);
    }
    // Bin theo pha downscale: phase = frac((x+0.5)/s) — 8 bin; chỉ xét dải
    // phẳng A (gradient 0) để tách pha khỏi gradient, + dải B (ramp đều).
    const phaseOut = {};
    for (const bandName of ["A_flat", "B_ramp"]) {
      const band = BANDS.find((b) => b.name === bandName);
      const y0 = Math.floor(band.y0 * vh / 720), y1 = Math.min(vh, Math.ceil(band.y1 * vh / 720));
      const rows = [];
      for (let k = 0; k < 8; k++) {
        const mask = new Uint8Array(n);
        for (let y = y0; y < y1; y++) for (let x = 0; x < vw; x++) {
          const ph = (((x + 0.5) / s) % 1 + 1) % 1;
          if (Math.floor(ph * 8) === k) mask[y * vw + x] = 1;
        }
        const p = maskedChannelStats(dP, mask);
        const r = maskedChannelStats(dR, mask);
        rows.push({ phaseBin: k, n: p.n, previewStdG: p.std[1], renderPStdG: r.std[1], varRatioG: +(p.std[1] ** 2 / r.std[1] ** 2).toFixed(2) });
      }
      phaseOut[bandName] = rows;
      console.log(`  A ${wh} phase ${bandName}: prevStdG=[${rows.map((r) => r.previewStdG).join(", ")}] renderPStdG=[${rows.map((r) => r.renderPStdG).join(", ")}]`);
    }
    const full = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseSame, vw, vh, null);
    report.partA[wh] = {
      vw, vh, s: +s.toFixed(4), plainAbsMad: plainMad.mad,
      verdictVsRenderP: full.verdict, kurtDiff: full.kurtDiff, corrDiff: full.corrDiff, stdRatio: full.stdRatio,
      bands: bandOut, gradBins: gradBinOut, phase: phaseOut,
    };
    console.log(`  A ${wh}: plainAbsMad=${plainMad.mad} verdict-vs-renderP=${full.verdict} Δkurt=${JSON.stringify(full.kurtDiff)} Δcorr=${JSON.stringify(full.corrDiff)} stdRatio=${JSON.stringify(full.stdRatio)}`);
  }

  // ================= PART C: quét thang s trên ocean noise05 =================
  const oceanPlain = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
  const oceanNoise05 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw"));
  const sweepPoints = [];
  // Điểm B1 (mọi cửa sổ đã capture) + điểm Y2 (w1440 489x275, w1920 809x455).
  const collect = [];
  for (const dir of headedDirs.sort()) {
    const files = fs.readdirSync(path.join(B1, dir)).filter((f) => f.startsWith("r74b1-snaps-"));
    for (const f of files) {
      const doc = JSON.parse(fs.readFileSync(path.join(B1, dir, f), "utf8"));
      if (doc.snaps?.ocean?.plain && doc.snaps?.ocean?.noise05) collect.push({ source: "B1", window: doc.window, doc });
    }
  }
  for (const w of ["w1440", "w1920"]) {
    const doc = JSON.parse(fs.readFileSync(path.join(Y2, `headed-${w}`, `r71y2-snaps-${w}.json`), "utf8"));
    collect.push({ source: "Y2", window: doc.window, doc });
  }
  for (const { source, window, doc } of collect) {
    const variants = doc.snaps.ocean;
    const vw = variants.plain.w, vh = variants.plain.h;
    const s = variants.plain.rect.scale;
    const prevPlain = b64ToRgb(variants.plain.rgbB64);
    const prevNoise = b64ToRgb(variants.noise05.rgbB64);
    const renderPlainTri = resampleRgb24Trilinear(oceanPlain, 1280, 720, vw, vh);
    const renderNoiseTri = resampleRgb24Trilinear(oceanNoise05, 1280, 720, vw, vh);
    const plainMad = absMad(prevPlain, renderPlainTri).mad;
    const d0 = delta0Viewport_70x6(oceanPlain, 1280, 720, vw, vh);
    const applyD0 = plainMad <= D0_THRESHOLD;
    const st = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, applyD0 ? d0 : null);
    // Chẩn đoán pha: std delta G của preview theo bin pha (8 bin) + render method-T.
    const { dP, dR } = deltaArrays(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, applyD0 ? d0 : null);
    const n = vw * vh;
    const phaseStdP = [], phaseStdR = [];
    for (let k = 0; k < 8; k++) {
      const mask = new Uint8Array(n);
      for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
        const ph = (((x + 0.5) / s) % 1 + 1) % 1;
        if (Math.floor(ph * 8) === k) mask[y * vw + x] = 1;
      }
      phaseStdP.push(maskedChannelStats(dP, mask).std[1]);
      phaseStdR.push(maskedChannelStats(dR, mask).std[1]);
    }
    sweepPoints.push({
      source, window, vw, vh, s: +s.toFixed(4), plainAbsMad: plainMad, d0Applied: applyD0,
      verdict: st.verdict, kurtDiff: st.kurtDiff, corrDiff: st.corrDiff, stdRatio: st.stdRatio,
      previewKurt: st.previewKurt, renderKurt: st.renderKurt, deltaMad: st.deltaMad,
      phaseStdG_preview: phaseStdP, phaseStdG_render: phaseStdR,
    });
    console.log(`  C ${source} ${window}: s=${s.toFixed(4)} rect=${vw}x${vh} plainMad=${plainMad} d0=${applyD0} ${st.verdict} ΔkurtG=${st.kurtDiff[1]} ΔcorrRG=${st.corrDiff[0]} stdRatioG=${st.stdRatio[1]} phaseStdG_P=[${phaseStdP.join(",")}] phaseStdG_R=[${phaseStdR.join(",")}]`);
  }
  sweepPoints.sort((a, b) => a.s - b.s);
  report.partC = { points: sweepPoints };
  // Tóm tắt xu hướng: Δkurt G theo s (hồi quy tuyến tính thô).
  const xs = sweepPoints.map((p) => p.s), ys = sweepPoints.map((p) => p.kurtDiff[1]);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const slope = den ? num / den : 0;
  report.partC.trend = { n: xs.length, slopeKurtGPerS: +slope.toFixed(3), kurtGAtMinS: ys[0], kurtGAtMaxS: ys[ys.length - 1] };
  console.log(`  C trend: n=${xs.length} slope ΔkurtG/s = ${slope.toFixed(3)}; ΔkurtG s_min=${ys[0]} -> s_max=${ys[ys.length - 1]}`);

  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON phân tích: ${OUT}`);
}

main().catch((e) => { console.error(`B1 LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
