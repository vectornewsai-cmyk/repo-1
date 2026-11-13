/**
 * r72z9-noise-model-w2560.mjs — Phase 9 đợt 72, luồng Z9.
 * Mô phỏng thuận pipeline preview (addYuvNoise verbatim + trilinear
 * production) tại viewport w2560 (1733x975, UPSCALE 1,354x) để kiểm tra
 * xem mô hình Y8 có tái tạo được verdict full-pixel ĐO ĐƯỢC ở w2560
 * (LỆCH do Δkurt R 0,38/0,43 sau delta0 — xem r72z9-analysis-w2560.json)
 * hay không. Khác Y8 (w1440 downscale 0,382): ở upscale λ*=0, resample
 * là triangle thuần, không còn trung bình hoá nhiễu — nếu sim tái tạo
 * đúng Δkurt R thì phần dư là hiệu ứng kẹp/clamp của đường nhiễu
 * (cơ chế Y8 §3.3), KHÔNG phải lỗi bộ lọc resample.
 *
 * So sánh: sim delta full-pixel (có trừ delta0 như analyze) vs render
 * delta full-pixel; verdict theo ngưỡng T3/X6 (Δkurt ≤ 0,35).
 * Chạy: node r72z9-noise-model-w2560.mjs (nặng: 10 sim + resample 1733x975).
 * KHÔNG push/tag/binary. Chỉ đọc dữ liệu có sẵn, không chạy browser.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resampleRgb24Trilinear } from "/home/hatch/workspace/repo-1/apps/web/scripts/chrome-resample.mjs";

const DIR = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round72-z9";
const HF = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files";
const RENDER = path.join(HF, "round66-t3", "render");
const W = 1280, H = 720, VW = 1733, VH = 975;

// ---------- port verbatim addYuvNoise (effectCanvas.ts) ----------
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

// rgb: Buffer RGB24 W*H*3 (đọc từ fullrgb-*.raw). Trả Buffer RGB24 mới.
// opts: { estChroma: true/false, clipYuv: true/false }
function addYuvNoiseSim(rgb, strength, seed, opts = {}) {
  const { estChroma = true, clipYuv = true } = opts;
  const w = W, h = H;
  const sigma = strength / Math.sqrt(3);
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
    estCb[i] = estChroma ? estimateNativeChroma(sCb / n, K_CB) : sCb / n;
    estCr[i] = estChroma ? estimateNativeChroma(sCr / n, K_CR) : sCr / n;
    cbNoise[i] = gauss() * sigma; crNoise[i] = gauss() * sigma;
  }
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (y * w + x) * 3, i = y * w + x, ci = (y >> 1) * cw + (x >> 1);
    let ny = Y[i] + gauss() * sigma;
    let ncb = estCb[ci] + cbNoise[ci];
    let ncr = estCr[ci] + crNoise[ci];
    if (clipYuv) { ny = Math.min(255, Math.max(0, ny)); ncb = Math.min(255, Math.max(0, ncb)); ncr = Math.min(255, Math.max(0, ncr)); }
    const [r, g, b] = yuv709ToRgb(ny, ncb, ncr);
    out[p] = clamp255(r); out[p + 1] = clamp255(g); out[p + 2] = clamp255(b);
  }
  return out;
}

// ---------- thống kê ----------
function channelStats(d) { // d: mảng xen kẽ R,G,B (delta, có dấu); kurt EXCESS
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
// ---------- delta0 (verbatim từ r71y2-analyze.mjs, X6) ----------
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
function delta0Viewport(rgb, srcW, srcH, dstW, dstH) {
  const shifted = estShiftFrame_70x6(rgb, srcW, srcH);
  const a = resampleRgb24Trilinear(rgb, srcW, srcH, dstW, dstH);
  const b = resampleRgb24Trilinear(shifted, srcW, srcH, dstW, dstH);
  const d0 = new Int16Array(dstW * dstH * 3);
  for (let i = 0; i < dstW * dstH * 3; i++) d0[i] = b[i] - a[i];
  return d0;
}
// delta step-4 đúng pha canvas w1440: rx≡1 mod 4, ry≡0 mod 4 (vx0=191, vy0=0)
function sampleDeltaStep4(frameA, frameB, vw, vh, rx0, ry0) {
  const d = [];
  for (let ry = ry0; ry < vh; ry += 4) for (let rx = rx0; rx < vw; rx += 4) {
    const i = (ry * vw + rx) * 3;
    d.push(frameB[i] - frameA[i], frameB[i + 1] - frameA[i + 1], frameB[i + 2] - frameA[i + 2]);
  }
  return d;
}
function sampleDeltaFull(frameA, frameB) {
  const d = new Array(frameA.length);
  for (let i = 0; i < frameA.length; i++) d[i] = frameB[i] - frameA[i];
  return d;
}

function loadRaw(name) {
  const buf = fs.readFileSync(path.join(RENDER, name));
  if (buf.length !== W * H * 3) throw new Error(`${name} sai kích thước ${buf.length}`);
  return buf;
}
function gridPoints(snap) {
  const cols = Math.ceil(snap.w / snap.step), pts = [];
  for (let i = 0; i < snap.n; i++) pts.push({ i, x: (i % cols) * snap.step, y: Math.floor(i / cols) * snap.step });
  return pts;
}
const b64ToRgb = (b64) => Buffer.from(b64, "base64");
// delta preview ĐO ĐƯỢC từ snapshot full-pixel w2560 (b64 RGB24 toàn rect)
function measuredPreviewDeltaFull(snaps, variant) {
  const a = b64ToRgb(snaps.plain.rgbB64), b = b64ToRgb(snaps[variant].rgbB64);
  const d = new Array(a.length);
  for (let i = 0; i < a.length; i++) d[i] = b[i] - a[i];
  return d;
}

async function main() {
  const t0 = Date.now();
  const snapsDoc = JSON.parse(fs.readFileSync(path.join(DIR, "headed-w2560", "r71y2-snaps-w2560.json"), "utf8"));
  const snaps = snapsDoc.snaps["test-pattern"];
  const rect = snaps.plain.rect;
  const plainFull = loadRaw("fullrgb-plain.raw");
  console.log("== Resample render (production trilinear) 1280x720 -> 1733x975 (upscale 1,354x) ==");
  const plainV = resampleRgb24Trilinear(plainFull, W, H, VW, VH);
  const rendV = {};
  for (const v of ["noise05", "noise10"]) {
    rendV[v] = resampleRgb24Trilinear(loadRaw(`fullrgb-${v}.raw`), W, H, VW, VH);
    console.log(`  render ${v} xong (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  // render delta stats: full-pixel (upscale — không còn ý nghĩa step-4 pha canvas)
  const rendStats = {};
  for (const v of ["noise05", "noise10"]) {
    rendStats[v] = { full: channelStats(sampleDeltaFull(plainV, rendV[v])) };
    console.log(`render ${v} full: std=${rendStats[v].full.std} kurt=${rendStats[v].full.kurt} corr=${rendStats[v].full.corr}`);
  }
  // measured preview delta stats (full-pixel, TRƯỚC delta0; sau delta0 xem analyze JSON)
  const measStats = {};
  for (const v of ["noise05", "noise05b", "noise10"]) {
    measStats[v] = channelStats(measuredPreviewDeltaFull(snaps, v));
    console.log(`preview ĐO ${v} (full-pixel, trước delta0): std=${measStats[v].std} kurt=${measStats[v].kurt} corr=${measStats[v].corr}`);
  }

  // delta0 viewport (verbatim từ r71y2-analyze.mjs / X6): trừ khỏi delta preview
  const d0 = delta0Viewport(plainFull, W, H, VW, VH);
  const applyDelta0 = (d) => { const o = new Array(d.length); for (let i = 0; i < d.length; i++) o[i] = d[i] - d0[i]; return o; };
  // Mô phỏng A (full pipeline) — 5 seed x 2 mức, full-pixel, có/không delta0
  const simA = {};
  for (const [v, strength] of [["noise05", 28], ["noise10", 50]]) {
    simA[v] = [];
    for (const seed of [1, 2, 3, 4, 5]) {
      const simFull = addYuvNoiseSim(plainFull, strength, seed, {});
      const simV = resampleRgb24Trilinear(simFull, W, H, VW, VH);
      const fullRaw = sampleDeltaFull(plainV, simV);
      const full = channelStats(applyDelta0(fullRaw));
      const fullNoD0 = channelStats(fullRaw);
      simA[v].push({ seed, full, fullNoD0 });
      console.log(`simA ${v} seed=${seed}: full+delta0 kurt=${full.kurt} corr=${full.corr} | full-trước-delta0 kurt=${fullNoD0.kurt} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }
  // Ablation B (base derived, không giãn est) + C (không kẹp YUV) — noise05, 3 seed, full+delta0
  const abl = {};
  for (const [tag, opts] of [["B_noEst", { estChroma: false }], ["C_noClipYuv", { clipYuv: false }]]) {
    abl[tag] = [];
    for (const seed of [1, 2, 3]) {
      const simFull = addYuvNoiseSim(plainFull, 28, seed, opts);
      const simV = resampleRgb24Trilinear(simFull, W, H, VW, VH);
      const full = channelStats(applyDelta0(sampleDeltaFull(plainV, simV)));
      abl[tag].push({ seed, full });
      console.log(`abl ${tag} noise05 seed=${seed}: full+delta0 kurt=${full.kurt} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }

  // Tổng hợp so sánh (full-pixel + delta0, như analyze w2560)
  const analysis = JSON.parse(fs.readFileSync(path.join(DIR, "r72z9-analysis-w2560.json"), "utf8"));
  const measAfterD0 = {};
  for (const v of ["noise05", "noise10"]) {
    const lv = analysis.windows.w2560.sources["test-pattern"].levels[v].trilinear.corrected;
    measAfterD0[v] = { previewKurt: lv.previewKurt, renderKurt: lv.renderKurt, kurtDiff: lv.kurtDiff, corrDiff: lv.corrDiff, stdRatio: lv.stdRatio, verdict: lv.verdict };
  }
  const report = { window: "w2560", viewport: `${VW}x${VH}`, render: rendStats, measuredPreviewBeforeDelta0: measStats, measuredAfterDelta0: measAfterD0, simA, abl };
  for (const v of ["noise05", "noise10"]) {
    console.log(`\n== ${v}: ĐO (full-pixel + delta0) vs MÔ PHỎNG (full-pixel + delta0) ==`);
    console.log(`  ĐO: verdict=${measAfterD0[v].verdict} Δkurt=${JSON.stringify(measAfterD0[v].kurtDiff)} Δcorr=${JSON.stringify(measAfterD0[v].corrDiff)} stdRatio=${JSON.stringify(measAfterD0[v].stdRatio)}`);
    for (const s of simA[v]) {
      const vd = verdict(s.full, rendStats[v].full);
      console.log(`  SIM seed=${s.seed}: ${JSON.stringify(vd)} | ΔkurtR sim=${(s.full.kurt[0] - rendStats[v].full.kurt[0]).toFixed(2)} (đo: ${(measAfterD0[v].previewKurt[0] - measAfterD0[v].renderKurt[0]).toFixed(2)})`);
    }
  }
  console.log("\n== Ablation noise05 (full-pixel + delta0, kurt R, trung bình 3 seed) ==");
  const meanK = (arr) => (arr.reduce((a, s) => a + s.full.kurt[0], 0) / arr.length).toFixed(2);
  console.log(`  A full pipeline: ${meanK(simA.noise05.slice(0, 3))} | B noEst: ${meanK(abl.B_noEst)} | C noClipYuv: ${meanK(abl.C_noClipYuv)} | render: ${rendStats.noise05.full.kurt[0]} | đo preview: ${measAfterD0.noise05.previewKurt[0]}`);
  writeFileEpermRetry(path.join(DIR, "r72z9-noise-model-w2560.json"), JSON.stringify(report, null, 2));
  console.log(`\nJSON: ${path.join(DIR, "r72z9-noise-model-w2560.json")} | tổng thời gian ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
main();
