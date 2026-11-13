#!/usr/bin/env node
/**
 * r85m2-noise-decompose.mjs — Phase 9 đợt 85, luồng M2: phân rã offline
 * noise Δcorr ở thang ~2 (nợ L2 §5.2) bằng dữ liệu đã có.
 *
 * Câu hỏi: Δcorr R +0,13 / B +0,15 ở s=2,2639 (clean-scale2, cả ba kernel)
 * đến từ đâu — (a) đường plain video (E_plain = prevPlain − Mit(R_plain)
 * rò vào delta dP = prevNoise − prevPlain), hay (b) đường noise canvas/CTM
 * (E_noise = prevNoise − Mit(R_noise)), hay (c) cả hai?
 *
 * Phương pháp: thay từng vế của dP bằng model Mitchell rồi tính lại
 * fullDeltaStats kiểu F6 (std ratio, Δkurt, Δcorr, ngưỡng E9).
 *   dP1 = prevNoise − Mit(R_plain)   (loại nhiễm plain)
 *   dP2 = Mit(R_noise) − prevPlain   (loại nhiễm noise-path)
 * Nếu dP1 về KHỚP mà dP2 không → plain là thủ phạm; ngược lại → noise-path.
 * Kèm: thống kê kênh + tương quan chéo + tự tương quan lag-1 không gian
 * của E_plain / E_noise, và đối chứng cùng phép phân rã ở s=1,132 (F6).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r85m2-noise-decompose.mjs
 * Chỉ đo offline. KHÔNG push/tag/binary/workflow. KHÔNG sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, bcCubicKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const L2 = path.join(GOAL, "round84-l2");
const F6 = path.join(GOAL, "round78-f6");
const M2 = path.join(GOAL, "round85-m2");
const OUT = path.join(M2, "r85m2-noise-decompose.json");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
const r3 = (v) => +v.toFixed(3);
const mitchell = (x) => bcCubicKernel(x, 1 / 3, 1 / 3);

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
function mad3(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]); sum += d; if (d > dmax) dmax = d; }
    if (dmax <= 8) le8++;
  }
  return { mad: r3(sum / (n * 3)), le8: +(le8 / n).toFixed(4) };
}
// Thống kê kênh + tương quan chéo + tự tương quan lag-1 theo x và y.
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
    // lag-1 theo x: cặp (x, x+1) cùng hàng; theo y: cặp (y, y+1) cùng cột.
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
function fullDeltaStats(previewPlain, previewNoise, renderPlain, renderNoise, vw, vh) {
  const n = vw * vh;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  let sumAbs = 0;
  for (let i = 0; i < n * 3; i++) {
    dP[i] = previewNoise[i] - previewPlain[i];
    dR[i] = renderNoise[i] - renderPlain[i];
    sumAbs += Math.abs(dP[i] - dR[i]);
  }
  const preview = fieldStats(dP, vw, vh), render = fieldStats(dR, vw, vh);
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
  const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
  const okStd = ratios.every((r) => r >= VERDICT.stdLo && r <= VERDICT.stdHi);
  const okKurt = dKurt.every((x) => x <= VERDICT.kurt);
  const okCorr = dCorr.every((x) => x <= VERDICT.corr);
  return {
    deltaMad: r3(sumAbs / (n * 3)),
    previewStd: preview.std, renderStd: render.std, stdRatio: ratios,
    previewKurt: preview.kurt, renderKurt: render.kurt, kurtDiff: dKurt,
    previewCorr: preview.corr, renderCorr: render.corr, corrDiff: dCorr,
    previewLagX: preview.lagX, renderLagX: render.lagX,
    previewLagY: preview.lagY, renderLagY: render.lagY,
    verdict: okStd && okKurt && okCorr ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ",
    okStd, okKurt, okCorr,
  };
}
function diffField(a, b) { const o = new Float64Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] - b[i]; return o; }

function analyzeSet(label, snapPath, renderDir, content = "ocean640", prefix = "fullrgb-") {
  console.log(`\n===== ${label}: ${snapPath}`);
  const doc = JSON.parse(fs.readFileSync(snapPath, "utf8"));
  const projW = doc.projW, projH = doc.projH;
  const snaps = doc.snaps[content];
  const rect = snaps.plain.rect;
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const scale = rect.scale;
  console.log(`rect ${vw}x${vh} scale=${scale.toFixed(4)} (proj ${projW}x${projH})`);
  const fullRgb = {};
  for (const v of ["plain", "noise05", "noise10"]) fullRgb[v] = fs.readFileSync(path.join(renderDir, `${prefix}${v}.raw`));
  const prev = {};
  for (const v of ["plain", "noise05", "noise10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
  const rend = {};
  for (const v of ["plain", "noise05", "noise10"]) rend[v] = resampleRgbKernel(fullRgb[v], projW, projH, vw, vh, mitchell);

  const out = { label, scale, vw, vh, snapPath, renderDir, variants: {} };
  // Nhiễm từng đường.
  const ePlain = diffField(prev.plain, rend.plain);
  const ePlainStats = fieldStats(ePlain, vw, vh);
  console.log(`E_plain (prevPlain−Mit(R_plain)): MAD=${mad3(prev.plain, rend.plain).mad} std=${ePlainStats.std} corr=${ePlainStats.corr} lagX=${ePlainStats.lagX} lagY=${ePlainStats.lagY}`);
  out.ePlain = { mad: mad3(prev.plain, rend.plain).mad, stats: ePlainStats };
  for (const v of ["noise05", "noise10"]) {
    const eNoise = diffField(prev[v], rend[v]);
    const eStats = fieldStats(eNoise, vw, vh);
    console.log(`E_${v} (prev−Mit(R)): MAD=${mad3(prev[v], rend[v]).mad} std=${eStats.std} corr=${eStats.corr} lagX=${eStats.lagX} lagY=${eStats.lagY}`);
    const base = fullDeltaStats(prev.plain, prev[v], rend.plain, rend[v], vw, vh);
    const dP1 = fullDeltaStats(rend.plain, prev[v], rend.plain, rend[v], vw, vh); // loại nhiễm plain
    const dP2 = fullDeltaStats(prev.plain, rend[v], rend.plain, rend[v], vw, vh); // loại nhiễm noise-path
    const dP12 = fullDeltaStats(rend.plain, rend[v], rend.plain, rend[v], vw, vh); // cả hai = 0 theo cấu tạo
    console.log(`  [${v}] GỐC dP=prevNoise−prevPlain: ${base.verdict} stdRatio=${base.stdRatio} Δkurt=${base.kurtDiff} Δcorr=${base.corrDiff} deltaMad=${base.deltaMad}`);
    console.log(`  [${v}] dP1 (plain→model):        ${dP1.verdict} stdRatio=${dP1.stdRatio} Δkurt=${dP1.kurtDiff} Δcorr=${dP1.corrDiff} deltaMad=${dP1.deltaMad}`);
    console.log(`  [${v}] dP2 (noise→model):        ${dP2.verdict} stdRatio=${dP2.stdRatio} Δkurt=${dP2.kurtDiff} Δcorr=${dP2.corrDiff} deltaMad=${dP2.deltaMad}`);
    console.log(`  [${v}] dP12 (cả hai→model):      deltaMad=${dP12.deltaMad} (kiểm tra sanity, phải ≈0)`);
    console.log(`  [${v}] lagX prev=${base.previewLagX} rend=${base.renderLagX} | lagY prev=${base.previewLagY} rend=${base.renderLagY}`);
    out.variants[v] = { eNoise: { mad: mad3(prev[v], rend[v]).mad, stats: eStats }, base, dP1, dP2, dP12 };
  }
  return out;
}

fs.mkdirSync(M2, { recursive: true });
const report = {
  generated: new Date().toISOString(),
  verdict: VERDICT,
  sets: [
    analyzeSet("s=2,2639 (clean-scale2, đợt 84 L2) vs render F6 bt709", path.join(L2, "headed-w2560x1440-p640x360", "r84l2-snaps-w2560x1440-p640x360.json"), path.join(F6, "render", "ocean640")),
    analyzeSet("s=2,2639 (clean-scale2, đợt 84 L2) vs render bt601 từ đúng clip ocean640-crf10.mp4", path.join(L2, "headed-w2560x1440-p640x360", "r84l2-snaps-w2560x1440-p640x360.json"), path.join(M2, "media"), "ocean640", "fullrgb-bt601-"),
    analyzeSet("s=1,132 (F6 w2560-p1280, đối chứng, trước H3)", path.join(F6, "headed-w2560x1440-p1280x720", "r78f6-snaps-w2560x1440-p1280x720.json"), path.join(F6, "render", "ocean"), "ocean"),
  ],
};
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
