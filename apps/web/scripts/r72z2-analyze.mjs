#!/usr/bin/env node
/**
 * r72z2-analyze.mjs — Phase 9 đợt 72, luồng Z2: đo lại verdict sau khi
 * khớp bước 1920→1280 với bộ lọc video-path thật.
 *
 * Đầu vào:
 * - Snapshot headed full-pixel Y2 (tái dùng — đã chứng minh xác định
 *   pixel-identical khi chạy lại; KHÔNG capture lại):
 *   hidden_files/round71-y2/headed-w1440 + headed-w1920.
 * - Frame render MỚI (r72z2-rebuild): hidden_files/round72-z2/render-1k/
 *   fullrgb-{ocean,basgo,slovenska}-{plain,noise05,noise10}.raw — plain
 *   1280 thắng theo plain absMAD (ocean C2 1-kernel YUV, basgo C1
 *   1-kernel RGB, slovenska C3 trilinear RGB), noise bằng chuyển delta
 *   RGB từ frame cũ (method T).
 * - testsrc2 tái dùng fullrgb-*.raw của T3 (round66-t3/render) — nguồn
 *   1280×720 nên KHÔNG có bước 1920→1280; verdict w1920 noise10 của nó
 *   đo lại bằng mô hình viewport theo thang (trilinear vs 1-kernel).
 * - Đối chứng ocean method F: yuv1280/fullrgb-ocean-{noise05,noise10}-f.raw
 *   (nhiễu ffmpeg fresh trên yuv1280 1-kernel) + plain C2b
 *   (yuv1280/fullrgb-ocean-plain-c2b.raw).
 *
 * Đo:
 *  A. Plain absMAD C2b (1-kernel YUV + convert ffmpeg) vs C0/C1/C2/C3 —
 *     tách biến: thắng của C2 đến từ filter scale hay từ convert nearest?
 *  B. Verdict full-pixel mọi nguồn × 2 cửa sổ × 2 mức, viewport
 *     trilinear (production) + 1-kernel (nhạy), delta0: luôn / không /
 *     CÓ ĐIỀU KIỆN theo plain absMAD (ngưỡng chính 2,5 — nằm trong khe
 *     dữ liệu: max phi-ocean 2,08 vs min ocean 2,68; nhạy 2,0/3,0).
 *  C. Chẩn đoán dư plain: mean signed diff theo kênh + tương quan
 *     |diff| với gradient cục bộ (phân biệt lệch matrix màu hệ thống
 *     vs dư resample tập trung ở texture HF).
 *
 * Hàm delta0/channelStats/fullDeltaStats/absMad sao chép VERBATIM từ
 * r71y2-analyze.mjs (đợt 71 Y2, gốc parity-66t3-compare.mjs đợt 70 X6).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r72z2-analyze.mjs
 * Env: R72Z2_OUT (mặc định hidden_files/round72-z2/r72z2-analysis.json).
 * Exit 0 khi xong. KHÔNG push/tag/binary.
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
const YUV1280 = path.join(Z2, "yuv1280");
const OUT = process.env.R72Z2_OUT || path.join(Z2, "r72z2-analysis.json");

const SOURCES = {
  "test-pattern": { frame: 30, renderDir: R66T3, prefix: "", native: false },
  ocean: { frame: 25, renderDir: RENDER_NEW, prefix: "ocean-", native: true },
  basgo: { frame: 30, renderDir: RENDER_NEW, prefix: "basgo-", native: true },
  slovenska: { frame: 25, renderDir: RENDER_NEW, prefix: "slovenska-", native: true },
};
const LEVELS = ["noise05", "noise10"];
const WINDOWS = { w1440: [489, 275], w1920: [809, 455] };
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
const D0_THRESHOLD = 2.5; // ngưỡng chính; nhạy 2.0/3.0 trong JSON.

// ---------- delta0 (verbatim từ r71y2-analyze.mjs / parity-66t3-compare.mjs) ----------
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

// ---------- thống kê kênh (verbatim từ r71y2-analyze.mjs) ----------
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
  let le8 = 0, le32 = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(dP[p * 3 + c] - dR[p * 3 + c]); if (d > dmax) dmax = d; }
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
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
    deltaLe8: +(le8 / n).toFixed(4), deltaLe32: +(le32 / n).toFixed(4),
    previewStd: preview.std, renderStd: render.std, stdRatio: ratios,
    previewKurt: preview.kurt, renderKurt: render.kurt, kurtDiff: dKurt,
    previewCorr: preview.corr, renderCorr: render.corr, corrDiff: dCorr,
    verdict: okStd && okKurt && okCorr ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ",
    okStd, okKurt, okCorr,
  };
}

function absMad(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0, le32 = 0, max = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]);
      sum += d;
      if (d > dmax) dmax = d;
    }
    if (dmax > max) max = dmax;
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  return { n, mad: +(sum / (n * 3)).toFixed(3), max: +max.toFixed(1), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4) };
}
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }

// Chẩn đoán dư plain: mean signed diff theo kênh + tương quan |diff|
// với độ lớn gradient cục bộ của render (Sobel |gx|+|gy| trên luma).
// Lệch matrix màu hệ thống -> mean signed lớn, tương quan thấp.
// Dư resample -> mean signed ~0, tương quan cao (tập trung ở HF).
function plainResidueDiag(prevPlain, renderPlain, vw, vh) {
  const n = vw * vh;
  const meanSigned = [0, 0, 0];
  const absDiff = new Float64Array(n);
  for (let p = 0; p < n; p++) {
    let s = 0;
    for (let c = 0; c < 3; c++) {
      const d = prevPlain[p * 3 + c] - renderPlain[p * 3 + c];
      meanSigned[c] += d;
      s += Math.abs(d);
    }
    absDiff[p] = s / 3;
  }
  for (let c = 0; c < 3; c++) meanSigned[c] = +(meanSigned[c] / n).toFixed(2);
  // Gradient luma của render plain (trừ biên 1px).
  const lum = new Float64Array(n);
  for (let p = 0; p < n; p++) lum[p] = 0.2126 * renderPlain[p * 3] + 0.7152 * renderPlain[p * 3 + 1] + 0.0722 * renderPlain[p * 3 + 2];
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, cnt = 0;
  let sumGrad = 0;
  for (let y = 1; y < vh - 1; y++) for (let x = 1; x < vw - 1; x++) {
    const p = y * vw + x;
    const g = Math.abs(lum[p + 1] - lum[p - 1]) + Math.abs(lum[p + vw] - lum[p - vw]);
    sumGrad += g;
    const a = absDiff[p];
    sx += g; sy += a; sxx += g * g; syy += a * a; sxy += g * a; cnt++;
  }
  const mx = sx / cnt, my = sy / cnt;
  const cov = sxy / cnt - mx * my;
  const vx = sxx / cnt - mx * mx, vy = syy / cnt - my * my;
  const corr = vx > 0 && vy > 0 ? +(cov / Math.sqrt(vx * vy)).toFixed(3) : 0;
  return { meanSignedDiffRgb: meanSigned, meanAbsDiff: +(sy / cnt).toFixed(3), meanGrad: +(sumGrad / cnt).toFixed(2), corrAbsDiffVsGrad: corr };
}

async function main() {
  const report = { verdictThresholds: VERDICT, d0Threshold: D0_THRESHOLD, c2b: {}, windows: {}, oceanMethodF: {}, diag: {} };

  // ================= A. C2b plain absMAD (tách biến) =================
  for (const [src, cfg] of Object.entries(SOURCES)) {
    if (!cfg.native) continue;
    const c2b = fs.readFileSync(path.join(YUV1280, `fullrgb-${src}-plain-c2b.raw`));
    report.c2b[src] = {};
    for (const [w, [vw, vh]] of Object.entries(WINDOWS)) {
      const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, `headed-${w}`, `r71y2-snaps-${w}.json`), "utf8"));
      const prevPlain = b64ToRgb(snapsDoc.snaps[src].plain.rgbB64);
      const vp = resampleRgb24Trilinear(c2b, 1280, 720, vw, vh);
      const m = absMad(prevPlain, vp);
      report.c2b[src][w] = m;
      console.log(`[A] ${src} ${w} C2b plain absMAD: mad=${m.mad} le8=${m.le8} max=${m.max}`);
    }
  }

  // ================= B. Verdict với frame render mới =================
  for (const [w, [vw, vh]] of Object.entries(WINDOWS)) {
    const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, `headed-${w}`, `r71y2-snaps-${w}.json`), "utf8"));
    const win = { proxyUsed: snapsDoc.proxyUsed, sources: {} };
    console.log(`\n=== ${w}: verdict frame render MỚI (method T) ===`);
    for (const [srcName, cfg] of Object.entries(SOURCES)) {
      const variants = snapsDoc.snaps[srcName];
      const plainRgb = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}plain.raw`));
      if (plainRgb.length !== 1280 * 720 * 3) throw new Error(`frame plain ${srcName} sai kích thước`);
      const d0 = delta0Viewport_70x6(plainRgb, 1280, 720, vw, vh);
      let d0mean = 0; for (let i = 0; i < d0.length; i++) d0mean += Math.abs(d0[i]);
      const prevPlain = b64ToRgb(variants.plain.rgbB64);
      const renderPlainTri = resampleRgb24Trilinear(plainRgb, 1280, 720, vw, vh);
      const renderPlain1k = resampleRgb24(plainRgb, 1280, 720, vw, vh);
      const absTri = absMad(prevPlain, renderPlainTri);
      const abs1k = absMad(prevPlain, renderPlain1k);
      console.log(`-- ${srcName}: plain absMAD trilinear=${absTri.mad} le8=${absTri.le8} | 1-kernel=${abs1k.mad} | mean|d0|=${(d0mean / d0.length).toFixed(2)}`);
      const srcEntry = { plainAbsMad: { trilinear: absTri, "1-kernel": abs1k }, meanAbsD0: +(d0mean / d0.length).toFixed(2), levels: {} };
      // Chẩn đoán dư plain (w1920, viewport trilinear).
      if (w === "w1920") {
        const diag = plainResidueDiag(prevPlain, renderPlainTri, vw, vh);
        report.diag[`${srcName}-w1920`] = diag;
        console.log(`   diag dư plain: meanSigned=${JSON.stringify(diag.meanSignedDiffRgb)} meanAbs=${diag.meanAbsDiff} corr(|d|,grad)=${diag.corrAbsDiffVsGrad}`);
      }
      for (const lv of LEVELS) {
        const noiseRgb = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}${lv}.raw`));
        const prevNoise = b64ToRgb(variants[lv].rgbB64);
        const lvEntry = {};
        for (const [mName, rp, rn] of [["trilinear", renderPlainTri, resampleRgb24Trilinear(noiseRgb, 1280, 720, vw, vh)], ["1-kernel", renderPlain1k, resampleRgb24(noiseRgb, 1280, 720, vw, vh)]]) {
          const withD0 = fullDeltaStats(prevPlain, prevNoise, rp, rn, vw, vh, d0);
          const noD0 = fullDeltaStats(prevPlain, prevNoise, rp, rn, vw, vh, null);
          // Điều kiện hoá: áp delta0 chỉ khi plain absMAD (cùng mô hình
          // viewport) <= ngưỡng. Ngưỡng chính 2,5; nhạy 2,0/3,0.
          const applyD0 = absTri.mad <= D0_THRESHOLD;
          const applyD0_20 = absTri.mad <= 2.0;
          const applyD0_30 = absTri.mad <= 3.0;
          const cond = applyD0 ? withD0 : noD0;
          const cond20 = applyD0_20 ? withD0 : noD0;
          const cond30 = applyD0_30 ? withD0 : noD0;
          lvEntry[mName] = {
            corrected: withD0, uncorrected: noD0,
            conditional: { ...cond, d0Applied: applyD0, threshold: D0_THRESHOLD, plainAbsMad: absTri.mad },
            conditional_t20: { verdict: cond20.verdict, d0Applied: applyD0_20, kurtDiff: cond20.kurtDiff, corrDiff: cond20.corrDiff, stdRatio: cond20.stdRatio },
            conditional_t30: { verdict: cond30.verdict, d0Applied: applyD0_30, kurtDiff: cond30.kurtDiff, corrDiff: cond30.corrDiff, stdRatio: cond30.stdRatio },
          };
          console.log(`   ${lv} ${mName}: LUÔN-d0 ${withD0.verdict} Δkurt=${JSON.stringify(withD0.kurtDiff)} Δcorr=${JSON.stringify(withD0.corrDiff)} | KHÔNG-d0 ${noD0.verdict} Δkurt=${JSON.stringify(noD0.kurtDiff)} Δcorr=${JSON.stringify(noD0.corrDiff)} | ĐK(2,5) ${cond.verdict} d0=${applyD0 ? "CÓ" : "KHÔNG"} Δkurt=${JSON.stringify(cond.kurtDiff)} Δcorr=${JSON.stringify(cond.corrDiff)}`);
        }
        srcEntry.levels[lv] = lvEntry;
      }
      win.sources[srcName] = srcEntry;
    }
    report.windows[w] = win;
  }

  // ================= C. Đối chứng ocean method F =================
  console.log(`\n=== Đối chứng ocean method F (plain C2b + noise ffmpeg fresh) ===`);
  for (const [w, [vw, vh]] of Object.entries(WINDOWS)) {
    const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, `headed-${w}`, `r71y2-snaps-${w}.json`), "utf8"));
    const variants = snapsDoc.snaps.ocean;
    const plainRgb = fs.readFileSync(path.join(YUV1280, "fullrgb-ocean-plain-c2b.raw"));
    const d0 = delta0Viewport_70x6(plainRgb, 1280, 720, vw, vh);
    const prevPlain = b64ToRgb(variants.plain.rgbB64);
    const renderPlainTri = resampleRgb24Trilinear(plainRgb, 1280, 720, vw, vh);
    const absTri = absMad(prevPlain, renderPlainTri);
    const cell = { plainAbsMad: absTri, levels: {} };
    console.log(`-- ocean ${w}: plain absMAD C2b=${absTri.mad} le8=${absTri.le8}`);
    for (const lv of LEVELS) {
      const noiseRgb = fs.readFileSync(path.join(YUV1280, `fullrgb-ocean-${lv}-f.raw`));
      const prevNoise = b64ToRgb(variants[lv].rgbB64);
      const renderNoiseTri = resampleRgb24Trilinear(noiseRgb, 1280, 720, vw, vh);
      const withD0 = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0);
      const noD0 = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, null);
      const applyD0 = absTri.mad <= D0_THRESHOLD;
      const cond = applyD0 ? withD0 : noD0;
      cell.levels[lv] = { corrected: withD0, uncorrected: noD0, conditional: { ...cond, d0Applied: applyD0 } };
      console.log(`   ${lv}: LUÔN-d0 ${withD0.verdict} Δkurt=${JSON.stringify(withD0.kurtDiff)} Δcorr=${JSON.stringify(withD0.corrDiff)} | KHÔNG-d0 ${noD0.verdict} Δkurt=${JSON.stringify(noD0.kurtDiff)} Δcorr=${JSON.stringify(noD0.corrDiff)} | ĐK(2,5) ${cond.verdict} d0=${applyD0 ? "CÓ" : "KHÔNG"}`);
    }
    report.oceanMethodF[w] = cell;
  }

  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON phân tích: ${OUT}`);
}

main().catch((e) => { console.error(`ANALYZE LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
