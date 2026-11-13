#!/usr/bin/env node
/**
 * r72z7-noise-nat.mjs — Phase 9 đợt 72, luồng Z7 (nợ đợt 71 §5 mục 8):
 * kiểm mô hình nhiễu preview của Y8 (forward simulation: addYuvNoise
 * verbatim + resample trilinear production) trên NỘI DUNG TỰ NHIÊN
 * (ocean/basgo/slovenska) + test-pattern làm đối chứng.
 *
 * Bối cảnh: Y8 xây mô hình trên testsrc2 và dự đoán verdict KHỚP 5/5
 * sau delta0 ở full-pixel; Y2 đo thật trên tự nhiên: basgo/slovenska
 * KHỚP 4/4 mỗi nguồn, ocean w1440 LỆCH cả 2 mức (noise05 Δkurt G 1,12).
 * Câu hỏi: mô hình Y8 có dự đoán đúng verdict trên nội dung tự nhiên
 * không, hay nó chỉ đúng trên testsrc2 (nơi nó được fit)?
 *
 * Phương pháp: với mỗi nguồn, chạy lại mô phỏng A của Y8 (3 seed × 2 mức
 * noise 28/50) trên frame plain render của chính nguồn đó, resample
 * trilinear về viewport w1440 (489×275), trừ delta0 của nguồn đó
 * (buildShifted verbatim X6), tính verdict sim-vs-render full-pixel,
 * đối chiếu verdict + Δkurt/Δcorr với số ĐO của Y2
 * (r71y2-analysis.json, w1440, trilinear, corrected).
 * KHÔNG sửa code production. KHÔNG push/tag/binary.
 * Chạy: node apps/web/scripts/r72z7-noise-nat.mjs (~2-4 phút).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resampleRgb24Trilinear } from "/home/hatch/workspace/repo-1/apps/web/scripts/chrome-resample.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const HF = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files";
const W = 1280, H = 720, VW = 489, VH = 275;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussianGenerator(rnd) {
  let spare = null;
  return () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0; while (u === 0) u = rnd();
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
function estimateNativeChroma(derived, k) {
  const e = 128 + k * (derived - 128);
  return e < 16 ? 16 : e > 240 ? 240 : e;
}
const K_CB = 1.04, K_CR = 1.12;
function clamp255(v) { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; }
function addYuvNoiseSim(rgb, strength, seed) { // verbatim Y8 (port effectCanvas.ts)
  const w = W, h = H, sigma = strength / Math.sqrt(3);
  const gauss = gaussianGenerator(mulberry32(seed));
  const cw = (w + 1) >> 1, ch = (h + 1) >> 1;
  const Y = new Float64Array(w * h), CB = new Float64Array(w * h), CR = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const [yy, cb, cr] = rgbToYuv709(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
    Y[i] = yy; CB[i] = cb; CR[i] = cr;
  }
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  const cbNoise = new Float64Array(cw * ch), crNoise = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= w || y >= h) continue;
      const i = y * w + x; sCb += CB[i]; sCr += CR[i]; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma(sCb / n, K_CB);
    estCr[i] = estimateNativeChroma(sCr / n, K_CR);
    cbNoise[i] = gauss() * sigma; crNoise[i] = gauss() * sigma;
  }
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (y * w + x) * 3, i = y * w + x, ci = (y >> 1) * cw + (x >> 1);
    const ny = Math.min(255, Math.max(0, Y[i] + gauss() * sigma));
    const ncb = Math.min(255, Math.max(0, estCb[ci] + cbNoise[ci]));
    const ncr = Math.min(255, Math.max(0, estCr[ci] + crNoise[ci]));
    const [r, g, b] = yuv709ToRgb(ny, ncb, ncr);
    out[p] = clamp255(r); out[p + 1] = clamp255(g); out[p + 2] = clamp255(b);
  }
  return out;
}
function buildShifted(plain) { // verbatim X6
  const shifted = Buffer.alloc(W * H * 3);
  const cw = (W + 1) >> 1, ch = (H + 1) >> 1;
  const Y = new Float64Array(W * H), CB = new Float64Array(W * H), CR = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const p = i * 3;
    const [yy, cb, cr] = rgbToYuv709(plain[p], plain[p + 1], plain[p + 2]);
    Y[i] = yy; CB[i] = cb; CR[i] = cr;
  }
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= W || y >= H) continue;
      const i = y * W + x; sCb += CB[i]; sCr += CR[i]; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma(sCb / n, K_CB);
    estCr[i] = estimateNativeChroma(sCr / n, K_CR);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const [r, g, b] = yuv709ToRgb(Y[i], estCb[ci], estCr[ci]);
    shifted[p] = clamp255(r); shifted[p + 1] = clamp255(g); shifted[p + 2] = clamp255(b);
  }
  return shifted;
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
function verdict(preview, render) {
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => Math.abs(k - render.kurt[i]));
  const dCorr = preview.corr.map((c, i) => Math.abs(c - render.corr[i]));
  const ok = ratios.every((r) => r >= 0.85 && r <= 1.18) && dKurt.every((x) => x <= 0.35) && dCorr.every((x) => x <= 0.12);
  return { stdRatio: ratios, kurtDiff: dKurt.map((x) => +x.toFixed(3)), corrDiff: dCorr.map((x) => +x.toFixed(3)), verdict: ok ? "KHỚP" : "LỆCH" };
}
function loadRaw(p) {
  const buf = fs.readFileSync(p);
  if (buf.length !== W * H * 3) throw new Error(`${p} sai kích thước ${buf.length}`);
  return buf;
}
const SOURCES = [
  { name: "test-pattern", renderDir: path.join(HF, "round66-t3", "render"), plain: "fullrgb-plain.raw", noise: (lv) => (lv === "noise05" ? "fullrgb-noise05.raw" : "fullrgb-noise10.raw") },
  { name: "ocean", renderDir: path.join(HF, "round71-y2", "render-nat"), plain: "fullrgb-ocean-plain.raw", noise: (lv) => `fullrgb-ocean-${lv}.raw` },
  { name: "basgo", renderDir: path.join(HF, "round71-y2", "render-nat"), plain: "fullrgb-basgo-plain.raw", noise: (lv) => `fullrgb-basgo-${lv}.raw` },
  { name: "slovenska", renderDir: path.join(HF, "round71-y2", "render-nat"), plain: "fullrgb-slovenska-plain.raw", noise: (lv) => `fullrgb-slovenska-${lv}.raw` },
];
const SEEDS = [1, 2, 3];

function main() {
  const t0 = Date.now();
  const y2 = JSON.parse(fs.readFileSync(path.join(HF, "round71-y2", "r71y2-analysis.json"), "utf8"));
  const report = { window: "w1440", viewport: `${VW}x${VH}`, seeds: SEEDS, sources: {} };
  let correct = 0, total = 0;
  for (const src of SOURCES) {
    const plainFull = loadRaw(path.join(src.renderDir, src.plain));
    const plainV = resampleRgb24Trilinear(plainFull, W, H, VW, VH);
    const shiftedV = resampleRgb24Trilinear(buildShifted(plainFull), W, H, VW, VH);
    const d0 = new Int16Array(VW * VH * 3);
    for (let i = 0; i < d0.length; i++) d0[i] = shiftedV[i] - plainV[i];
    let m0 = 0; for (let i = 0; i < d0.length; i++) m0 += Math.abs(d0[i]);
    const srcRep = { meanAbsDelta0: +(m0 / d0.length).toFixed(3), levels: {} };
    console.log(`\n== ${src.name}: mean|delta0|=${srcRep.meanAbsDelta0} ==`);
    for (const [lv, strength] of [["noise05", 28], ["noise10", 50]]) {
      const rendV = resampleRgb24Trilinear(loadRaw(path.join(src.renderDir, src.noise(lv))), W, H, VW, VH);
      const rendDelta = [];
      for (let i = 0; i < plainV.length; i++) rendDelta.push(rendV[i] - plainV[i]);
      const rendStats = channelStats(rendDelta);
      const y2t = y2.windows.w1440.sources[src.name].levels[lv].trilinear.corrected;
      const y2verdict = y2t.kurtDiff.every((x) => x <= 0.35) && y2t.corrDiff.every((x) => x <= 0.12) && y2t.stdRatio.every((r) => r >= 0.85 && r <= 1.18) ? "KHỚP" : "LỆCH";
      const lvRep = { renderKurt: rendStats.kurt, y2Measured: { kurtDiff: y2t.kurtDiff, corrDiff: y2t.corrDiff, stdRatio: y2t.stdRatio, verdict: y2verdict }, seeds: [] };
      for (const seed of SEEDS) {
        const simV = resampleRgb24Trilinear(addYuvNoiseSim(plainFull, strength, seed), W, H, VW, VH);
        const dCorr = [], dRaw = [];
        for (let i = 0; i < plainV.length; i++) {
          dRaw.push(simV[i] - plainV[i]);
          dCorr.push(simV[i] - plainV[i] - d0[i]);
        }
        const vdCorr = verdict(channelStats(dCorr), rendStats);
        const vdRaw = verdict(channelStats(dRaw), rendStats);
        lvRep.seeds.push({ seed, corrected: vdCorr, uncorrected: vdRaw });
        const predOk = vdCorr.verdict === y2verdict;
        total++; if (predOk) correct++;
        console.log(`  ${lv} seed=${seed}: sim+delta0corr Δkurt=${vdCorr.kurtDiff} Δcorr=${vdCorr.corrDiff} stdRatio=${vdCorr.stdRatio} -> ${vdCorr.verdict} | ĐO Y2: Δkurt=${y2t.kurtDiff} Δcorr=${y2t.corrDiff} -> ${y2verdict} | dự đoán verdict ${predOk ? "ĐÚNG" : "SAI"} | không corr: ${vdRaw.verdict} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
      }
      srcRep.levels[lv] = lvRep;
    }
    report.sources[src.name] = srcRep;
  }
  report.verdictPrediction = { correct, total, note: "mỗi seed tính 1 lần dự đoán (verdict sim vs verdict đo Y2)" };
  console.log(`\nMÔ HÌNH DỰ ĐOÁN VERDICT: ${correct}/${total} đúng (mỗi seed 1 lần)`);
  writeFileEpermRetry(path.join(HF, "round72-z7", "r72z7-noise-nat.json"), JSON.stringify(report, null, 2));
  console.log(`JSON: ${path.join(HF, "round72-z7", "r72z7-noise-nat.json")} | ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
main();
