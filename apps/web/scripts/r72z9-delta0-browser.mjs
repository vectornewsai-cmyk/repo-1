#!/usr/bin/env node
/**
 * r72z9-delta0-browser.mjs — Phase 9 đợt 72, luồng Z9.
 * Chẩn đoán phần dư Δkurt R ở w2560: mô hình Y8 (dùng frame plain do
 * ffmpeg decode + delta0 tính từ frame đó) dự đoán KHỚP (Δkurt R
 * 0,08–0,31) nhưng đo headed full-pixel cho LỆCH (0,38/0,43).
 * Giả thuyết: delta0 "đúng" của frame do BROWSER decode khác delta0
 * tính từ frame ffmpeg (decode khác nhau ~1 mức, absMAD plain 1,029)
 * nên trừ delta0-ffmpeg không triệt được thành phần est-shift trong
 * delta preview thật.
 *
 * Kiểm chứng (chỉ dùng dữ liệu đã có, không chạy browser):
 *  1. Tính d0_browser: est-shift trực tiếp trên snapshot plain của
 *     browser ở 1733x975; d0_ffmpeg: est-shift trên frame ffmpeg
 *     resample lên 1733x975. So MAD + kurtosis + tỉ lệ |d0|>5.
 *  2. Trừ từng d0 khỏi delta preview đo được (noise05/noise10) rồi tính
 *     lại Δkurt R vs render: nếu d0_browser đưa Δkurt R về gần miền sim
 *     (0,1–0,2) trong khi d0_ffmpeg để lại 0,38/0,43 thì giả thuyết ĐÚNG.
 * Ghi JSON: r72z9-delta0-browser.json. KHÔNG push/tag/binary.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import path from "node:path";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const DIR = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round72-z9";
const RENDER = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round66-t3/render";
const VW = 1733, VH = 975;
function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }

// ---- est-shift verbatim (r71y2-analyze.mjs / X6) ----
function rgbToYuv709(r, g, b) {
  const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return [16 + 219 * yl, 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.0722), 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.2126)];
}
function yuv709ToRgb(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.79274 * (cr - 128), yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128), yy + 2.1122 * (cb - 128)];
}
function estimateNativeChroma(derived, k) {
  const e = 128 + k * (derived - 128);
  return e < 16 ? 16 : e > 240 ? 240 : e;
}
function estShiftFrame(rgb, srcW, srcH) {
  const out = Buffer.alloc(srcW * srcH * 3);
  const cw = (srcW + 1) >> 1, ch = (srcH + 1) >> 1;
  const Y = new Float64Array(srcW * srcH), CB = new Float64Array(srcW * srcH), CR = new Float64Array(srcW * srcH);
  for (let i = 0; i < srcW * srcH; i++) {
    const p = i * 3;
    const [yy, cb, cr] = rgbToYuv709(rgb[p], rgb[p + 1], rgb[p + 2]);
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
    estCb[i] = estimateNativeChroma(sCb / n, 1.04);
    estCr[i] = estimateNativeChroma(sCr / n, 1.12);
  }
  const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let y = 0; y < srcH; y++) for (let x = 0; x < srcW; x++) {
    const i = y * srcW + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const [r, g, b] = yuv709ToRgb(Y[i], estCb[ci], estCr[ci]);
    out[p] = clamp255(r); out[p + 1] = clamp255(g); out[p + 2] = clamp255(b);
  }
  return out;
}
function delta0FromFrame(frame, w, h) {
  const shifted = estShiftFrame(frame, w, h);
  const d0 = new Int16Array(w * h * 3);
  for (let i = 0; i < w * h * 3; i++) d0[i] = shifted[i] - frame[i];
  return d0;
}
function channelStats(d) {
  const n = d.length / 3, out = { std: [], kurt: [], corr: [] };
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) { let s = 0; for (let i = c; i < d.length; i += 3) s += d[i]; mean[c] = s / n; }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) { const v = d[i] - mean[c]; s2 += v * v; s4 += v * v * v * v; }
    const std = Math.sqrt(s2 / n);
    out.std.push(+std.toFixed(2)); out.kurt.push(+(s4 / n / std ** 4 - 3).toFixed(2));
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(+(s / n / (out.std[a] * out.std[b])).toFixed(3));
  }
  return out;
}
function fieldStats(d0, label) {
  const n = d0.length / 3;
  const per = { std: [], fracGt5: [], fracGt10: [], maxAbs: [] };
  for (let c = 0; c < 3; c++) {
    let s = 0, s2 = 0, gt5 = 0, gt10 = 0, mx = 0;
    for (let i = c; i < d0.length; i += 3) { const v = d0[i]; s += v; s2 += v * v; if (Math.abs(v) > 5) gt5++; if (Math.abs(v) > 10) gt10++; if (Math.abs(v) > mx) mx = Math.abs(v); }
    const m = s / n;
    per.std.push(+Math.sqrt(s2 / n - m * m).toFixed(2));
    per.fracGt5.push(+(gt5 / n).toFixed(4));
    per.fracGt10.push(+(gt10 / n).toFixed(4));
    per.maxAbs.push(mx);
  }
  log(`${label}: std=${JSON.stringify(per.std)} frac|d0|>5=${JSON.stringify(per.fracGt5)} frac>10=${JSON.stringify(per.fracGt10)} maxAbs=${JSON.stringify(per.maxAbs)}`);
  return per;
}

const snapsDoc = JSON.parse(fs.readFileSync(path.join(DIR, "headed-w2560", "r71y2-snaps-w2560.json"), "utf8"));
const snaps = snapsDoc.snaps["test-pattern"];
const b64 = (s) => Buffer.from(s, "base64");
const plainBrowser = b64(snaps.plain.rgbB64);
const plainFfmpeg = fs.readFileSync(path.join(RENDER, "fullrgb-plain.raw"));
const plainFfmpegV = resampleRgb24Trilinear(plainFfmpeg, 1280, 720, VW, VH);

const d0Browser = delta0FromFrame(plainBrowser, VW, VH);
const d0Ffmpeg = delta0FromFrame(plainFfmpegV, VW, VH);
// d0_ffmpeg như analyze (từ frame full-res rồi resample delta): đối chứng
const shiftedFull = estShiftFrame(plainFfmpeg, 1280, 720);
const d0FfmpegFull = (() => {
  const a = resampleRgb24Trilinear(plainFfmpeg, 1280, 720, VW, VH);
  const b = resampleRgb24Trilinear(shiftedFull, 1280, 720, VW, VH);
  const d0 = new Int16Array(VW * VH * 3);
  for (let i = 0; i < VW * VH * 3; i++) d0[i] = b[i] - a[i];
  return d0;
})();

let madSum = 0, mx = 0, n = 0;
for (let i = 0; i < d0Browser.length; i++) { const d = Math.abs(d0Browser[i] - d0Ffmpeg[i]); madSum += d; if (d > mx) mx = d; n++; }
log(`d0_browser vs d0_ffmpeg(viewport): MAD=${(madSum / n).toFixed(3)} maxAbs=${mx}`);
madSum = 0; mx = 0;
for (let i = 0; i < d0Browser.length; i++) { const d = Math.abs(d0Browser[i] - d0FfmpegFull[i]); madSum += d; if (d > mx) mx = d; }
log(`d0_browser vs d0_ffmpeg-full (cách analyze): MAD=${(madSum / n).toFixed(3)} maxAbs=${mx}`);
fieldStats(d0Browser, "d0_browser");
fieldStats(d0Ffmpeg, "d0_ffmpeg(viewport)");
fieldStats(d0FfmpegFull, "d0_ffmpeg-full(analyze)");

// Verdict lại delta preview đo được với từng d0
const renderPlainV = plainFfmpegV;
const out = { d0Compare: {}, verdicts: {} };
for (const v of ["noise05", "noise10"]) {
  const prevNoise = b64(snaps[v].rgbB64);
  const renderNoiseV = resampleRgb24Trilinear(fs.readFileSync(path.join(RENDER, `fullrgb-${v}.raw`)), 1280, 720, VW, VH);
  const dR = new Array(VW * VH * 3);
  for (let i = 0; i < dR.length; i++) dR[i] = renderNoiseV[i] - renderPlainV[i];
  const renderStats = channelStats(dR);
  const row = {};
  for (const [tag, d0] of [["d0_ffmpeg-full(analyze)", d0FfmpegFull], ["d0_ffmpeg(viewport)", d0Ffmpeg], ["d0_browser", d0Browser], ["khong-tru", null]]) {
    const dP = new Array(VW * VH * 3);
    for (let i = 0; i < dP.length; i++) dP[i] = prevNoise[i] - plainBrowser[i] - (d0 ? d0[i] : 0);
    const ps = channelStats(dP);
    const dKurt = ps.kurt.map((k, i) => +(Math.abs(k - renderStats.kurt[i]).toFixed(3)));
    const dCorr = ps.corr.map((c, i) => +(Math.abs(c - renderStats.corr[i]).toFixed(3)));
    const ratios = renderStats.std.map((s, i) => +(ps.std[i] / s).toFixed(2));
    const ok = ratios.every((r) => r >= 0.85 && r <= 1.18) && dKurt.every((x) => x <= 0.35) && dCorr.every((x) => x <= 0.12);
    row[tag] = { previewKurt: ps.kurt, renderKurt: renderStats.kurt, kurtDiff: dKurt, corrDiff: dCorr, stdRatio: ratios, verdict: ok ? "KHỚP" : "LỆCH" };
    log(`${v} [${tag}]: Δkurt=${JSON.stringify(dKurt)} Δcorr=${JSON.stringify(dCorr)} stdRatio=${JSON.stringify(ratios)} → ${row[tag].verdict} (previewKurtR=${ps.kurt[0]}, renderKurtR=${renderStats.kurt[0]})`);
  }
  out.verdicts[v] = row;
}
writeFileEpermRetry(path.join(DIR, "r72z9-delta0-browser.json"), JSON.stringify(out, null, 2));
log("ghi xong r72z9-delta0-browser.json");
