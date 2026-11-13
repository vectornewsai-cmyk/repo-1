#!/usr/bin/env node
/**
 * r72z2-twostage-viewport.mjs — Phase 9 đợt 72, luồng Z2: kiểm tra cuối
 * cho anomaly ocean w1440 noise05 — verdict với mô hình viewport 2-STAGE.
 *
 * Bối cảnh: probe Y2 §3 ở thang s=0,382 (489×275, w1440): 2-stage fit
 * tốt hơn trilinear một chút (MAD 0,0253 vs 0,0367). Mọi biến đã loại:
 * kẹp rail (bins), delta0 (như nhau có/không), filter 1920→1280
 * (1,12→1,11), cấu trúc plain (1,11→0,91), realization nhiễu (F: 1,13),
 * viewport 1-kernel (1,36). Nếu 2-stage đóng được ocean w1440 noise05
 * thì anomaly là sai số mô hình viewport ở s=0,382; nếu không, nợ đứng
 * với giả thuyết còn lại là tương tác addYuvNoise/est-chroma trên nội
 * dung bão hoà ở mức nhiễu nhỏ.
 *
 * Đo: verdict w1440 (plain+noise resample 2-stage), frame render MỚI,
 * có/không delta0 (delta0 tính bằng trilinear như Y2 — ghi rõ là trộn
 * mô hình, chỉ để tham khảo). Đối chứng: ocean n10, basgo n05,
 * testsrc2 n05 (phải giữ KHỚP hoặc không tệ đi).
 * Hàm thống kê sao chép từ r72z2-analyze.mjs (gốc r71y2-analyze.mjs).
 * Chạy: node apps/web/scripts/r72z2-twostage-viewport.mjs
 * Exit 0 khi xong. KHÔNG push/tag/binary.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resampleRgb24TwoStage, resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const Z2 = path.join(GOAL, "round72-z2");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const RENDER_NEW = path.join(Z2, "render-1k");
const OUT = path.join(Z2, "r72z2-twostage-viewport.json");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };

const CELLS = [
  { src: "ocean", lv: "noise05", dir: RENDER_NEW, prefix: "ocean-" },
  { src: "ocean", lv: "noise10", dir: RENDER_NEW, prefix: "ocean-" },
  { src: "basgo", lv: "noise05", dir: RENDER_NEW, prefix: "basgo-" },
  { src: "test-pattern", lv: "noise05", dir: R66T3, prefix: "" },
];
const VW = 489, VH = 275;

function channelStats(d) {
  const n = d.length / 3;
  const out = { std: [], kurt: [], corr: [] };
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) { let s = 0; for (let i = c; i < d.length; i += 3) s += d[i]; mean[c] = s / n; }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) { const v = d[i] - mean[c]; s2 += v * v; s4 += v * v * v * v; }
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
function verdictOf(prevPlain, prevNoise, renPlain, renNoise, d0) {
  const n = VW * VH;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) { dP[i] = prevNoise[i] - prevPlain[i] - (d0 ? d0[i] : 0); dR[i] = renNoise[i] - renPlain[i]; }
  const preview = channelStats(dP), render = channelStats(dR);
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
  const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
  const ok = ratios.every((r) => r >= VERDICT.stdLo && r <= VERDICT.stdHi) && dKurt.every((x) => x <= VERDICT.kurt) && dCorr.every((x) => x <= VERDICT.corr);
  return { verdict: ok ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ", stdRatio: ratios, kurtDiff: dKurt, corrDiff: dCorr };
}
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }
function absMad(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0;
  for (let p = 0; p < n; p++) { let dm = 0; for (let c = 0; c < 3; c++) { const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]); sum += d; if (d > dm) dm = d; } if (dm <= 8) le8++; }
  return { mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4) };
}

// delta0 (verbatim thu gọn từ r72z2-analyze.mjs): est-chroma k 1,04/1,12,
// resample viewport bằng TRILINEAR như Y2 (ghi rõ: trộn mô hình).
function rgbToYuv709(r, g, b) {
  const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return [16 + 219 * yl, 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.0722), 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.2126)];
}
function yuv709ToRgb(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.79274 * (cr - 128), yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128), yy + 2.1122 * (cb - 128)];
}
function delta0Viewport(plainRgb) {
  const srcW = 1280, srcH = 720;
  const cw = 640, ch = 360;
  const Y = new Float64Array(srcW * srcH), CB = new Float64Array(srcW * srcH), CR = new Float64Array(srcW * srcH);
  for (let i = 0; i < srcW * srcH; i++) { const p = i * 3; const [yy, cb, cr] = rgbToYuv709(plainRgb[p], plainRgb[p + 1], plainRgb[p + 2]); Y[i] = yy; CB[i] = cb; CR[i] = cr; }
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  const est = (d, k) => { const e = 128 + k * (d - 128); return e < 16 ? 16 : e > 240 ? 240 : e; };
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const x = cx * 2 + dx, y = cy * 2 + dy; if (x >= srcW || y >= srcH) continue; const i = y * srcW + x; sCb += CB[i]; sCr += CR[i]; n++; }
    const i = cy * cw + cx; estCb[i] = est(sCb / n, 1.04); estCr[i] = est(sCr / n, 1.12);
  }
  const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  const shifted = Buffer.alloc(srcW * srcH * 3);
  for (let y = 0; y < srcH; y++) for (let x = 0; x < srcW; x++) {
    const i = y * srcW + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const [r, g, b] = yuv709ToRgb(Y[i], estCb[ci], estCr[ci]);
    shifted[p] = clamp255(r); shifted[p + 1] = clamp255(g); shifted[p + 2] = clamp255(b);
  }
  const a = resampleRgb24Trilinear(plainRgb, srcW, srcH, VW, VH);
  const b = resampleRgb24Trilinear(shifted, srcW, srcH, VW, VH);
  const d0 = new Int16Array(VW * VH * 3);
  for (let i = 0; i < d0.length; i++) d0[i] = b[i] - a[i];
  return d0;
}

const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, "headed-w1440", "r71y2-snaps-w1440.json"), "utf8"));
const report = { cells: [] };
for (const cell of CELLS) {
  const variants = snapsDoc.snaps[cell.src];
  const plainRgb = fs.readFileSync(path.join(cell.dir, `fullrgb-${cell.prefix}plain.raw`));
  const noiseRgb = fs.readFileSync(path.join(cell.dir, `fullrgb-${cell.prefix}${cell.lv}.raw`));
  const prevPlain = b64ToRgb(variants.plain.rgbB64);
  const prevNoise = b64ToRgb(variants[cell.lv].rgbB64);
  const renPlain = resampleRgb24TwoStage(plainRgb, 1280, 720, VW, VH);
  const renNoise = resampleRgb24TwoStage(noiseRgb, 1280, 720, VW, VH);
  const pm = absMad(prevPlain, renPlain);
  const d0 = delta0Viewport(plainRgb);
  const noD0 = verdictOf(prevPlain, prevNoise, renPlain, renNoise, null);
  const withD0 = verdictOf(prevPlain, prevNoise, renPlain, renNoise, d0);
  const entry = { ...cell, plainAbsMad2stage: pm, noD0, withD0 };
  report.cells.push(entry);
  console.log(`${cell.src} w1440 ${cell.lv} [viewport 2-STAGE]: plainAbsMAD=${pm.mad} le8=${pm.le8} | KHÔNG-d0 ${noD0.verdict} Δkurt=${JSON.stringify(noD0.kurtDiff)} Δcorr=${JSON.stringify(noD0.corrDiff)} stdRatio=${JSON.stringify(noD0.stdRatio)} | CÓ-d0(trộn) ${withD0.verdict} Δkurt=${JSON.stringify(withD0.kurtDiff)} Δcorr=${JSON.stringify(withD0.corrDiff)}`);
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nJSON: ${OUT}`);
