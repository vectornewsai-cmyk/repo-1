#!/usr/bin/env node
/**
 * r76d2-postfix.mjs — Phase 9 đợt 76, luồng D2: đo luật delta0 trên
 * snapshot POST-FIX mới (capture r74b1-headed-capture.mjs, code đã sửa
 * rò plain C1): ocean w1920, ocean w2560, gradient1920 w1440.
 *
 * Render tham chiếu:
 *  - ocean: frame method-T Z2 (render-1k fullrgb-ocean-*.raw) như C1.
 *  - gradient1920: build theo đúng công thức Z2/B1 — native frame 30
 *    1920×1080 (ffmpeg rgb24 + yuv420p) -> resampleYuv420p 1-kernel
 *    1920→1280 (C2, ứng viên thắng của Z2) -> plain1280; noise1280 =
 *    addYuvNoise verbatim trên plain1280 (strength 28, seed preview
 *    localT=1.0) như render-P của B1 Part A.
 *
 * Luật đánh giá (áp d0 khi...):
 *   R0  cũ: plainMad <= 2,5
 *   G1:      R0 && d0std_R <= 2,0
 *   G2:      R0 && ratio_R = d0std_R/residStd_R <= 1,0
 *   G12:     R0 && d0std_R <= 2,0 && ratio_R <= 1,0
 * (G1/G2 là 2 cổng tách được 21 case chẩn đoán; xem r76d2-analyze.mjs.)
 *
 * Helpers delta0/thống kê sao chép VERBATIM từ r76d2-analyze.mjs
 * (nguồn r75c1-analyze.mjs / r73a3-d0cond.mjs); resample từ
 * chrome-resample.mjs. Ngưỡng verdict như Z2/A3/B1/C1.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r76d2-postfix.mjs
 * JSON: hidden_files/round76-d2/r76d2-postfix.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear, resampleYuv420p } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const C1 = path.join(GOAL, "round75-c1");
const D2 = path.join(GOAL, "round76-d2");
const OUT = path.join(D2, "r76d2-postfix.json");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
const D0_THRESHOLD = 2.5;
const PREVIEW_SEED_LOCALT1 = (0x9e3779b9 ^ 30) >>> 0;

// ---------- sao chép verbatim r76d2-analyze.mjs ----------
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
    out.kurt.push(std > 0 ? +(s4 / n / (std ** 4) - 3).toFixed(2) : 0);
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(out.std[a] > 0 && out.std[b] > 0 ? +(s / n / (out.std[a] * out.std[b])).toFixed(3) : 0);
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
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }
function absMadPerChannel(a, b) {
  const n = a.length / 3, out = [];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let p = 0; p < n; p++) s += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
    out.push(+(s / n).toFixed(3));
  }
  return out;
}
function corrPerChannel(a, b) {
  const n = a.length / 3, out = [];
  for (let c = 0; c < 3; c++) {
    let ma = 0, mb = 0;
    for (let p = 0; p < n; p++) { ma += a[p * 3 + c]; mb += b[p * 3 + c]; }
    ma /= n; mb /= n;
    let sxx = 0, syy = 0, sxy = 0;
    for (let p = 0; p < n; p++) {
      const da = a[p * 3 + c] - ma, db = b[p * 3 + c] - mb;
      sxx += da * da; syy += db * db; sxy += da * db;
    }
    out.push(sxx > 0 && syy > 0 ? +(sxy / Math.sqrt(sxx * syy)).toFixed(3) : 0);
  }
  return out;
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
// ---------- đánh giá case (như r76d2-analyze.mjs, thêm cổng G1/G2) ----------
const r2 = (v) => +v.toFixed(2);
function evalCase(name, prevPlain, prevNoise, plain1280, noise1280, vw, vh) {
  const renderPlainTri = resampleRgb24Trilinear(plain1280, 1280, 720, vw, vh);
  const renderNoiseTri = resampleRgb24Trilinear(noise1280, 1280, 720, vw, vh);
  const plainMad = absMad(prevPlain, renderPlainTri).mad;
  const perChanMad = absMadPerChannel(prevPlain, renderPlainTri);
  const d0 = delta0Viewport_70x6(plain1280, 1280, 720, vw, vh);
  const d0std = channelStats(Float64Array.from(d0)).std;
  const n = vw * vh;
  const resid = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) resid[i] = prevPlain[i] - renderPlainTri[i];
  const residStd = channelStats(resid).std;
  const ratio = d0std.map((s, c) => (residStd[c] > 0 ? r2(s / residStd[c]) : 0));
  const corr = corrPerChannel(d0, resid);
  const stNo = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, null);
  const stFull = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0);
  const base = plainMad <= D0_THRESHOLD;
  const gates = {
    R0_cu: base,
    G1_d0stdR_le_2: base && d0std[0] <= 2.0,
    G2_ratioR_le_1: base && ratio[0] <= 1.0,
    G12_ca_hai: base && d0std[0] <= 2.0 && ratio[0] <= 1.0,
  };
  const verdictUnder = {};
  for (const [k, apply] of Object.entries(gates)) verdictUnder[k] = apply ? stFull.verdict : stNo.verdict;
  const correct = stNo.verdict.startsWith("KHỚP") ? "KHÔNG-d0" : (stFull.verdict.startsWith("KHỚP") ? "CÓ-d0" : "cả-hai-LỆCH");
  return {
    name, rect: `${vw}x${vh}`, plainMad, perChanMad, d0std, residStd, ratio, corr,
    d0stdR: d0std[0], ratioR: ratio[0],
    verdictNoD0: stNo.verdict, kurtDiffNoD0: stNo.kurtDiff, corrDiffNoD0: stNo.corrDiff, deltaMadNoD0: stNo.deltaMad,
    verdictFullD0: stFull.verdict, kurtDiffFullD0: stFull.kurtDiff, corrDiffFullD0: stFull.corrDiff, deltaMadFullD0: stFull.deltaMad,
    gates, verdictUnder, correct,
  };
}

async function main() {
  // Build frame render gradient1920 (công thức Z2 C2 + render-P B1).
  const natYuv = fs.readFileSync(path.join(D2, "native-grad1920", "grad1920-f30-1920.yuv"));
  const gPlain = resampleYuv420p(natYuv, 1920, 1080, 1280, 720);
  const gNoise = addYuvNoiseRgb24(gPlain, 1280, 720, 28, PREVIEW_SEED_LOCALT1);
  writeFileEpermRetry(path.join(D2, "fullrgb-gradient1920-plain.raw"), gPlain);
  writeFileEpermRetry(path.join(D2, "fullrgb-gradient1920-noise05.raw"), gNoise);
  console.log(`gradient1920 render frames: plain ${gPlain.length}B noise ${gNoise.length}B (C2 1-kernel YUV + addYuvNoise seed preview)`);

  const oceanPlain = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
  const oceanNoise = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw"));
  const cases = [];
  const addOcean = (name, snapPath) => {
    const doc = JSON.parse(fs.readFileSync(snapPath, "utf8"));
    const v = doc.snaps?.ocean;
    if (!v?.plain || !v?.noise05) { console.log(`  bỏ ${name}: thiếu ocean plain/noise05`); return; }
    const rPlain = doc.rawFrames?.ocean?.plain, rNoise = doc.rawFrames?.ocean?.noise05;
    const d3 = rPlain?.ok && rNoise?.ok ? (rPlain.hash === rNoise.hash && rPlain.currentTime === rNoise.currentTime) : null;
    const d1 = v.plain2 ? v.plain.rgbB64 === v.plain2.rgbB64 : null;
    const c = evalCase(name, b64ToRgb(v.plain.rgbB64), b64ToRgb(v.noise05.rgbB64), oceanPlain, oceanNoise, v.plain.w, v.plain.h);
    c.d1PlainIdentical = d1; c.d3SameFrame = d3; c.rawHash = rPlain?.hash;
    cases.push(c);
  };
  // Đối chứng C1 (tính lại bằng code mới).
  addOcean("C1-post-fix-w1440-ocean-n05", path.join(C1, "headed-w1440x900", "r74b1-snaps-w1440x900.json"));
  // Snapshot mới D2.
  addOcean("D2-post-fix-w1920-ocean-n05", path.join(D2, "headed-w1920x1080-ocean", "r74b1-snaps-w1920x1080.json"));
  addOcean("D2-post-fix-w2560-ocean-n05", path.join(D2, "headed-w2560x1440-ocean", "r74b1-snaps-w2560x1440.json"));
  // gradient1920 mới.
  const gdoc = JSON.parse(fs.readFileSync(path.join(D2, "headed-w1440x900-grad1920", "r74b1-snaps-w1440x900.json"), "utf8"));
  const gv = gdoc.snaps?.gradient1920;
  if (gv?.plain && gv?.noise05) {
    const rPlain = gdoc.rawFrames?.gradient1920?.plain, rNoise = gdoc.rawFrames?.gradient1920?.noise05;
    const d3 = rPlain?.ok && rNoise?.ok ? (rPlain.hash === rNoise.hash && rPlain.currentTime === rNoise.currentTime) : null;
    const d1 = gv.plain2 ? gv.plain.rgbB64 === gv.plain2.rgbB64 : null;
    const c = evalCase("D2-post-fix-w1440-grad1920-n05", b64ToRgb(gv.plain.rgbB64), b64ToRgb(gv.noise05.rgbB64), gPlain, gNoise, gv.plain.w, gv.plain.h);
    c.d1PlainIdentical = d1; c.d3SameFrame = d3; c.rawHash = rPlain?.hash;
    cases.push(c);
  } else console.log("  bỏ gradient1920: thiếu plain/noise05");

  for (const c of cases) {
    console.log(`${c.name} rect=${c.rect} plainMad=${c.plainMad} perChanMad=${JSON.stringify(c.perChanMad)} d0std=${JSON.stringify(c.d0std)} residStd=${JSON.stringify(c.residStd)} ratio=${JSON.stringify(c.ratio)} corr=${JSON.stringify(c.corr)} D1=${c.d1PlainIdentical} D3=${c.d3SameFrame}`);
    console.log(`    noD0: ${c.verdictNoD0} dKurt=${JSON.stringify(c.kurtDiffNoD0)} dCorr=${JSON.stringify(c.corrDiffNoD0)} deltaMad=${c.deltaMadNoD0} | fullD0: ${c.verdictFullD0} dKurt=${JSON.stringify(c.kurtDiffFullD0)} dCorr=${JSON.stringify(c.corrDiffFullD0)} deltaMad=${c.deltaMadFullD0} | đúng=${c.correct}`);
    console.log(`    cổng: R0=${c.gates.R0_cu} G1=${c.gates.G1_d0stdR_le_2} G2=${c.gates.G2_ratioR_le_1} G12=${c.gates.G12_ca_hai} | verdict: R0=${c.verdictUnder.R0_cu} G1=${c.verdictUnder.G1_d0stdR_le_2} G2=${c.verdictUnder.G2_ratioR_le_1} G12=${c.verdictUnder.G12_ca_hai}`);
  }
  const report = { generated: new Date().toISOString(), d0ThresholdOld: D0_THRESHOLD, cases };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON post-fix: ${OUT} (${cases.length} case)`);
}
main().catch((e) => { console.error(`D2-POSTFIX LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
