#!/usr/bin/env node
/**
 * r73a3-d0cond.mjs — Phase 9 đợt 73, luồng A3: ocean w1440 noise05 LỆCH
 * thật — cứu bằng điều kiện hoá delta0 theo absMAD plain?
 *
 * Nợ: đợt 72 §4 mục 6 / Z2 §6.2+§8.1 (ocean w1440 noise05: Δkurt G 1,11,
 * Δcorr R-G 0,242, stdRatio G 1,20 dưới viewport trilinear; d0 nhị phân
 * có/không đều 1,11). Z2 đề xuất điều kiện hoá delta0 theo plain absMAD
 * (ngưỡng 2,5) — đã áp nhị phân, KHÔNG cứu được ô này. Luồng này thử
 * các dạng điều kiện hoá TINH HƠN trong cùng họ:
 *  (1) graded toàn cục: nhân d0 với w ∈ {0,25; 0,5; 0,75} (nội suy
 *      giữa không-d0 và luôn-d0);
 *  (2) theo kênh: chỉ áp d0 ở kênh c khi plain absMAD_c ≤ T
 *      (T ∈ {1,5; 2,5; 3,5});
 *  (3) theo vùng (local): chỉ áp d0 ở pixel có plain absMAD cục bộ
 *      (box 9×9) ≤ T (T ∈ {1,5; 2,5; 4,0}) + graded local.
 * Đối chứng trên các ô đã KHỚP để chắc không phá verdict khác.
 *
 * Hướng phụ (tối đa 1, theo đề xuất Z2 §6.2): render-P — build frame
 * noise render bằng ĐÚNG công thức preview addYuvNoise (est-chroma
 * kCb 1,04/kCr 1,12, nhiễu Y theo pixel + chroma theo khối 2×2,
 * mulberry32/Box-Muller verbatim từ effectCanvas.ts) rồi đo lại verdict.
 * Nếu Δkurt G rơi ≤ 0,35 thì cơ chế là công thức cộng nhiễu, không phải
 * delta0. Seed mới (thống kê, không cần cùng realization với preview).
 *
 * Đầu vào (tái dùng, KHÔNG capture lại): snapshot headed Y2
 * (hidden_files/round71-y2/headed-w1440 + headed-w1920), frame render
 * Z2 (hidden_files/round72-z2/render-1k/, plain thắng theo nguồn:
 * ocean C2, basgo C1, slovenska C3), testsrc2 từ round66-t3/render.
 * Hàm delta0/channelStats/fullDeltaStats/absMad sao chép VERBATIM từ
 * r72z2-analyze.mjs. RNG + addYuvNoise sao chép VERBATIM công thức từ
 * apps/web/src/lib/effectCanvas.ts (mulberry32, gaussianGenerator,
 * rgbToYuv709/yuv709ToRgb, estimateNativeChroma, thứ tự rút RNG).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r73a3-d0cond.mjs
 * Env: R73A3_OUT (mặc định hidden_files/round73-a3/r73a3-analysis.json).
 * Exit 0 khi xong. KHÔNG push/tag/binary/workflow.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resampleRgb24, resampleRgb24Trilinear,
} from "./chrome-resample.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const Z2 = path.join(GOAL, "round72-z2");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const RENDER_NEW = path.join(Z2, "render-1k");
const A3 = path.join(GOAL, "round73-a3");
const OUT = process.env.R73A3_OUT || path.join(A3, "r73a3-analysis.json");
fs.mkdirSync(path.join(A3, "render-p"), { recursive: true });

const SOURCES = {
  "test-pattern": { renderDir: R66T3, prefix: "" },
  ocean: { renderDir: RENDER_NEW, prefix: "ocean-" },
  basgo: { renderDir: RENDER_NEW, prefix: "basgo-" },
  slovenska: { renderDir: RENDER_NEW, prefix: "slovenska-" },
};
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
const D0_THRESHOLD = 2.5;

// ---------- delta0 + thống kê (verbatim r72z2-analyze.mjs) ----------
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
function absMadPerChannel(a, b) {
  const n = a.length / 3;
  const out = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let p = 0; p < n; p++) s += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
    out[c] = +(s / n).toFixed(3);
  }
  return out;
}
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }

// ---------- RNG + addYuvNoise replica (verbatim effectCanvas.ts) ----------
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
/** addYuvNoise trên RGB24 Buffer (w×h), strength = alls. */
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

// ---------- local plain absMAD 9x9 (integral image) ----------
function localAbsMad9(prevPlain, renderPlain, vw, vh) {
  const n = vw * vh;
  const a = new Float64Array(n);
  for (let p = 0; p < n; p++) {
    let s = 0;
    for (let c = 0; c < 3; c++) s += Math.abs(prevPlain[p * 3 + c] - renderPlain[p * 3 + c]);
    a[p] = s / 3;
  }
  const W = vw + 1;
  const ii = new Float64Array((vh + 1) * W);
  for (let y = 0; y < vh; y++) {
    let row = 0;
    for (let x = 0; x < vw; x++) {
      row += a[y * vw + x];
      ii[(y + 1) * W + (x + 1)] = ii[y * W + (x + 1)] + row;
    }
  }
  const out = new Float64Array(n);
  const r = 4;
  for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
    const x0 = Math.max(0, x - r), x1 = Math.min(vw - 1, x + r);
    const y0 = Math.max(0, y - r), y1 = Math.min(vh - 1, y + r);
    const sum = ii[(y1 + 1) * W + (x1 + 1)] - ii[y0 * W + (x1 + 1)] - ii[(y1 + 1) * W + x0] + ii[y0 * W + x0];
    out[y * vw + x] = sum / ((x1 - x0 + 1) * (y1 - y0 + 1));
  }
  return out;
}

function scaledD0(d0, weightFn) {
  const out = new Float64Array(d0.length);
  for (let i = 0; i < d0.length; i++) out[i] = d0[i] * weightFn(i);
  return out;
}

async function main() {
  const report = { verdictThresholds: VERDICT, d0Threshold: D0_THRESHOLD, part1: {}, part2: {} };

  // ================= PART 1: các dạng điều kiện hoá delta0 =================
  const CELLS1 = [
    { src: "ocean", w: "w1440", lv: "noise05", tag: "TARGET" },
    { src: "ocean", w: "w1440", lv: "noise10", tag: "control" },
    { src: "test-pattern", w: "w1440", lv: "noise05", tag: "control" },
    { src: "test-pattern", w: "w1440", lv: "noise10", tag: "control" },
    { src: "basgo", w: "w1440", lv: "noise05", tag: "control" },
    { src: "slovenska", w: "w1440", lv: "noise05", tag: "control" },
    { src: "ocean", w: "w1920", lv: "noise05", tag: "control" },
  ];
  const WINDOWS = { w1440: [489, 275], w1920: [809, 455] };
  for (const cell of CELLS1) {
    const [vw, vh] = WINDOWS[cell.w];
    const cfg = SOURCES[cell.src];
    const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, `headed-${cell.w}`, `r71y2-snaps-${cell.w}.json`), "utf8"));
    const variants = snapsDoc.snaps[cell.src];
    const plainRgb = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}plain.raw`));
    const noiseRgb = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}${cell.lv}.raw`));
    const prevPlain = b64ToRgb(variants.plain.rgbB64);
    const prevNoise = b64ToRgb(variants[cell.lv].rgbB64);
    const renderPlainTri = resampleRgb24Trilinear(plainRgb, 1280, 720, vw, vh);
    const renderNoiseTri = resampleRgb24Trilinear(noiseRgb, 1280, 720, vw, vh);
    const d0 = delta0Viewport_70x6(plainRgb, 1280, 720, vw, vh);
    const plainMad = absMad(prevPlain, renderPlainTri);
    const perChanMad = absMadPerChannel(prevPlain, renderPlainTri);
    const localMad = localAbsMad9(prevPlain, renderPlainTri, vw, vh);

    const variantsOut = {};
    const run = (name, d0arr) => {
      const s = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0arr);
      variantsOut[name] = { verdict: s.verdict, kurtDiff: s.kurtDiff, corrDiff: s.corrDiff, stdRatio: s.stdRatio, previewKurt: s.previewKurt, renderKurt: s.renderKurt, deltaMad: s.deltaMad };
      console.log(`  ${name}: ${s.verdict} Δkurt=${JSON.stringify(s.kurtDiff)} Δcorr=${JSON.stringify(s.corrDiff)} stdRatio=${JSON.stringify(s.stdRatio)}`);
      return s;
    };
    console.log(`\n== P1 ${cell.src} ${cell.w} ${cell.lv} [${cell.tag}] plainMad=${plainMad.mad} perChan=${JSON.stringify(perChanMad)} ==`);
    run("w0_khong-d0", null);
    run("w1_luon-d0", d0);
    for (const w of [0.25, 0.5, 0.75]) run(`graded_w${w}`, scaledD0(d0, () => w));
    for (const T of [1.5, 2.5, 3.5]) {
      run(`perChannel_T${T}`, scaledD0(d0, (i) => (perChanMad[i % 3] <= T ? 1 : 0)));
    }
    for (const T of [1.5, 2.5, 4.0]) {
      run(`local9_T${T}`, scaledD0(d0, (i) => (localMad[(i / 3) | 0] <= T ? 1 : 0)));
    }
    run("local9_graded_1.5-4.0", scaledD0(d0, (i) => {
      const m = localMad[(i / 3) | 0];
      if (m <= 1.5) return 1;
      if (m >= 4.0) return 0;
      return (4.0 - m) / 2.5;
    }));
    // 1-kernel viewport nhạy cho ô TARGET (Z2: 1-kernel cho 1,36).
    if (cell.tag === "TARGET") {
      const rp1k = resampleRgb24(plainRgb, 1280, 720, vw, vh);
      const rn1k = resampleRgb24(noiseRgb, 1280, 720, vw, vh);
      const s0 = fullDeltaStats(prevPlain, prevNoise, rp1k, rn1k, vw, vh, null);
      const s1 = fullDeltaStats(prevPlain, prevNoise, rp1k, rn1k, vw, vh, d0);
      const s05 = fullDeltaStats(prevPlain, prevNoise, rp1k, rn1k, vw, vh, scaledD0(d0, () => 0.5));
      variantsOut["1kernel_w0"] = { verdict: s0.verdict, kurtDiff: s0.kurtDiff, corrDiff: s0.corrDiff, stdRatio: s0.stdRatio };
      variantsOut["1kernel_w1"] = { verdict: s1.verdict, kurtDiff: s1.kurtDiff, corrDiff: s1.corrDiff, stdRatio: s1.stdRatio };
      variantsOut["1kernel_graded_w0.5"] = { verdict: s05.verdict, kurtDiff: s05.kurtDiff, corrDiff: s05.corrDiff, stdRatio: s05.stdRatio };
      console.log(`  1kernel_w0: ${s0.verdict} Δkurt=${JSON.stringify(s0.kurtDiff)}`);
      console.log(`  1kernel_w1: ${s1.verdict} Δkurt=${JSON.stringify(s1.kurtDiff)}`);
      console.log(`  1kernel_graded_w0.5: ${s05.verdict} Δkurt=${JSON.stringify(s05.kurtDiff)}`);
    }
    report.part1[`${cell.src}-${cell.w}-${cell.lv}`] = {
      tag: cell.tag, plainAbsMad: plainMad.mad, perChannelPlainAbsMad: perChanMad,
      variants: variantsOut,
    };
  }

  // ================= PART 2: render-P (noise theo công thức preview) =================
  const STRENGTH = { noise05: 28, noise10: 50 };
  const CELLS2 = [
    { src: "ocean", w: "w1440", lv: "noise05", seed: 12345 },
    { src: "ocean", w: "w1440", lv: "noise05", seed: 777 },
    { src: "ocean", w: "w1440", lv: "noise10", seed: 12345 },
    { src: "ocean", w: "w1920", lv: "noise05", seed: 12345 },
    { src: "test-pattern", w: "w1440", lv: "noise05", seed: 12345 },
    { src: "basgo", w: "w1440", lv: "noise05", seed: 12345 },
  ];
  for (const cell of CELLS2) {
    const [vw, vh] = WINDOWS[cell.w];
    const cfg = SOURCES[cell.src];
    const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, `headed-${cell.w}`, `r71y2-snaps-${cell.w}.json`), "utf8"));
    const variants = snapsDoc.snaps[cell.src];
    const plainRgb = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}plain.raw`));
    const prevPlain = b64ToRgb(variants.plain.rgbB64);
    const prevNoise = b64ToRgb(variants[cell.lv].rgbB64);
    const renderPlainTri = resampleRgb24Trilinear(plainRgb, 1280, 720, vw, vh);
    const d0 = delta0Viewport_70x6(plainRgb, 1280, 720, vw, vh);
    const plainMad = absMad(prevPlain, renderPlainTri).mad;
    const noiseP = addYuvNoiseRgb24(plainRgb, 1280, 720, STRENGTH[cell.lv], cell.seed);
    const framePath = path.join(A3, "render-p", `fullrgb-${cell.src}-${cell.lv}-p-seed${cell.seed}.raw`);
    writeFileEpermRetry(framePath, noiseP);
    const renderNoiseTri = resampleRgb24Trilinear(noiseP, 1280, 720, vw, vh);
    const sNoD0 = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, null);
    const sD0 = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0);
    const applyD0 = plainMad <= D0_THRESHOLD;
    const sCond = applyD0 ? sD0 : sNoD0;
    console.log(`\n== P2 render-P ${cell.src} ${cell.w} ${cell.lv} seed=${cell.seed} plainMad=${plainMad} d0=${applyD0 ? "CÓ" : "KHÔNG"} ==`);
    console.log(`  KHÔNG-d0: ${sNoD0.verdict} Δkurt=${JSON.stringify(sNoD0.kurtDiff)} Δcorr=${JSON.stringify(sNoD0.corrDiff)} stdRatio=${JSON.stringify(sNoD0.stdRatio)} prevKurt=${JSON.stringify(sNoD0.previewKurt)} renderKurt=${JSON.stringify(sNoD0.renderKurt)}`);
    console.log(`  LUÔN-d0:  ${sD0.verdict} Δkurt=${JSON.stringify(sD0.kurtDiff)} Δcorr=${JSON.stringify(sD0.corrDiff)} stdRatio=${JSON.stringify(sD0.stdRatio)}`);
    console.log(`  ĐK(2,5):  ${sCond.verdict} Δkurt=${JSON.stringify(sCond.kurtDiff)} Δcorr=${JSON.stringify(sCond.corrDiff)} stdRatio=${JSON.stringify(sCond.stdRatio)}`);
    report.part2[`${cell.src}-${cell.w}-${cell.lv}-seed${cell.seed}`] = {
      frame: `hidden_files/round73-a3/render-p/fullrgb-${cell.src}-${cell.lv}-p-seed${cell.seed}.raw`,
      plainAbsMad: plainMad, d0Applied: applyD0,
      uncorrected: { verdict: sNoD0.verdict, kurtDiff: sNoD0.kurtDiff, corrDiff: sNoD0.corrDiff, stdRatio: sNoD0.stdRatio, previewKurt: sNoD0.previewKurt, renderKurt: sNoD0.renderKurt },
      corrected: { verdict: sD0.verdict, kurtDiff: sD0.kurtDiff, corrDiff: sD0.corrDiff, stdRatio: sD0.stdRatio },
      conditional: { verdict: sCond.verdict, kurtDiff: sCond.kurtDiff, corrDiff: sCond.corrDiff, stdRatio: sCond.stdRatio },
    };
  }

  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON phân tích: ${OUT}`);
}

main().catch((e) => { console.error(`A3 LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
