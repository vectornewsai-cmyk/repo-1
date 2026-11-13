#!/usr/bin/env node
/**
 * r71y2-analyze.mjs — Phase 9 đợt 71, luồng Y2: phân tích kết quả đo.
 *
 * Phần B (video probe): so MAD video-vs-canvas từng mẫu/thang + fit 3 mô
 * hình (trilinear LOD-bias −0,5 production, 1-kernel, 2-stage) lên profile
 * luma đo được, từ mẫu nguồn chính xác (xung/step 1280).
 *
 * Phần A+C (snapshot headed full-pixel): verdict Δkurt/Δcorr sau hiệu
 * chỉnh delta0 của X6 (sao chép verbatim estShift/delta0 từ
 * parity-66t3-compare.mjs), trên TOÀN BỘ pixel rect video (không step-4),
 * cho 2 cửa sổ × 2 mức × 4 nguồn (testsrc2 + ocean/basgo/slovenska).
 * Thêm kiểm tra nhạy pha: tính lại Δkurt R trên mẫu step-4 ở 4 pha từ
 * chính dữ liệu full-pixel, để thấy verdict cũ mong manh cỡ nào.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r71y2-analyze.mjs
 * Env: R71Y2_WINDOWS (mặc định "w1440,w1920"), R71Y2_OUT (mặc định
 * hidden_files/round71-y2/r71y2-analysis.json).
 * Exit 0 khi phân tích xong. KHÔNG push/tag/binary.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromeWeights1D, triangleKernel, trilinearRow1D,
  resampleRgb24, resampleRgb24Trilinear,
} from "./chrome-resample.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const RENDER_NAT = path.join(Y2, "render-nat");
const WINDOWS = (process.env.R71Y2_WINDOWS || "w1440,w1920").split(",").map((s) => s.trim()).filter(Boolean);
const OUT = process.env.R71Y2_OUT || path.join(Y2, "r71y2-analysis.json");

const SOURCES = {
  "test-pattern": { frame: 30, renderDir: R66T3, prefix: "" },
  ocean: { frame: 25, renderDir: RENDER_NAT, prefix: "ocean-" },
  basgo: { frame: 30, renderDir: RENDER_NAT, prefix: "basgo-" },
  slovenska: { frame: 25, renderDir: RENDER_NAT, prefix: "slovenska-" },
};
const LEVELS = ["noise05", "noise10"];
// Ngưỡng verdict như T3/X6: std ratio [0.85,1.18], |Δkurt|<=0.35, |Δcorr|<=0.12.
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };

function mad(a, b) {
  let s = 0, m = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); s += d; if (d > m) m = d; }
  return { mad: +(s / a.length).toFixed(4), max: +m.toFixed(2) };
}
function peak(a) {
  let p = -Infinity, pi = -1;
  for (let i = 0; i < a.length; i++) if (a[i] > p) { p = a[i]; pi = i; }
  return { peak: +p.toFixed(1), at: pi };
}

// ---------- 1D model predictors (từ chromeWeights1D/trilinearRow1D) ----------
function resample1DWeights(src, dstLen, s, hOverride) {
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    const ws = chromeWeights1D(i, s, src.length, triangleKernel, hOverride);
    let acc = 0;
    for (const [j, w] of ws) acc += w * src[j];
    out[i] = acc;
  }
  return out;
}
function predict1Kernel(src, dstLen) { return resample1DWeights(src, dstLen, dstLen / src.length, undefined); }
function predictTwoStage(src, dstLen) {
  const midLen = Math.max(1, src.length >> 1);
  const mid = resample1DWeights(src, midLen, midLen / src.length, 1);
  for (let i = 0; i < mid.length; i++) mid[i] = Math.round(mid[i]);
  return resample1DWeights(mid, dstLen, dstLen / midLen, 1);
}
function predictTrilinear(src, dstLen) { return Float64Array.from(trilinearRow1D(Array.from(src), dstLen)); }

// ---------- delta0 (verbatim từ parity-66t3-compare.mjs, đợt 70 X6) ----------
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

// ---------- thống kê kênh (như parity-66t3-compare.mjs channelStats) ----------
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
  let sumAbs = 0, le8 = 0, le32 = 0;
  for (let i = 0; i < n * 3; i++) {
    const dp = previewNoise[i] - previewPlain[i] - (delta0 ? delta0[i] : 0);
    const dr = renderNoise[i] - renderPlain[i];
    dP[i] = dp; dR[i] = dr;
    const d = Math.abs(dp - dr);
    sumAbs += d;
    if (i % 3 === 2) { /* dmax theo pixel: tính sau */ }
  }
  // le8/le32 theo pixel (dmax 3 kênh).
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
    _dP: dP, _dR: dR,
  };
}

// Δkurt R trên mẫu step-4 ở 1 pha (rx ≡ phase mod 4, ry ≡ 0 mod 4 như
// lưới W6: điểm (x,y) với x=phase+4k trong rect, y=4k).
function phaseKurtR(dP, dR, vw, vh, phase) {
  const subP = [], subR = [];
  for (let y = 0; y < vh; y += 4) {
    for (let x = phase; x < vw; x += 4) {
      const i = (y * vw + x) * 3;
      subP.push(dP[i], dP[i + 1], dP[i + 2]);
      subR.push(dR[i], dR[i + 1], dR[i + 2]);
    }
  }
  const sP = channelStats(subP), sR = channelStats(subR);
  return { n: subP.length / 3, kurtDiffR: +(Math.abs(sP.kurt[0] - sR.kurt[0]).toFixed(3)), previewKurtR: sP.kurt[0], renderKurtR: sR.kurt[0] };
}

function absMad(preview, render) {
  const n = preview.length / 3;
  let sum = 0, le8 = 0, le32 = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(preview[p * 3 + c] - render[p * 3 + c]); sum += d; if (d > dmax) dmax = d; }
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  return { n, mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4) };
}

function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }

async function main() {
  const report = { verdictThresholds: VERDICT, probeB: {}, windows: {} };

  // ================= Phần B: video-path filter probe =================
  const probePath = path.join(Y2, "probe", "r71y2-video-probe.json");
  if (fs.existsSync(probePath)) {
    const d = JSON.parse(fs.readFileSync(probePath, "utf8"));
    report.probeB.determinism = d.determinism;
    report.probeB.meta = d.meta;
    const models = { trilinear: predictTrilinear, "1-kernel": predict1Kernel, "2-stage": predictTwoStage };
    for (const pat of Object.keys(d.patterns)) {
      report.probeB[pat] = {};
      // Mẫu nguồn chính xác 1280 (xung tại 640) / 720 (xung tại 360) / step.
      const srcX = new Float64Array(1280);
      const srcY = new Float64Array(720);
      if (pat === "vline" || pat === "dot") srcX[640] = 255;
      if (pat === "hline" || pat === "dot") srcY[360] = 255;
      if (pat === "step") for (let x = 640; x < 1280; x++) srcX[x] = 255;
      for (const size of Object.keys(d.patterns[pat])) {
        const [dw, dh] = size.split("x").map(Number);
        const e = d.patterns[pat][size];
        const cell = { videoVsImg: {}, models: {} };
        for (const prof of ["row", "col"]) {
          if (!e.video[prof]) continue;
          cell.videoVsImg[prof] = mad(e.video[prof], e.img[prof]);
          cell.videoVsImg[prof].videoPeak = peak(e.video[prof]);
          cell.videoVsImg[prof].imgPeak = peak(e.img[prof]);
        }
        // Fit mô hình lên profile đo được (đường img; video ≡ img).
        for (const [mName, fn] of Object.entries(models)) {
          cell.models[mName] = {};
          if (e.img.row) {
            let pred;
            if (pat === "dot") {
              const px = fn(srcX, dw);
              const py = fn(srcY, dh);
              const yRow = e.img.rowY;
              pred = Float64Array.from(px, (v) => (v * py[yRow]) / 255);
            } else if (pat === "step" || pat === "vline") {
              pred = fn(srcX, dw);
            } else pred = null;
            if (pred) cell.models[mName].row = mad(Array.from(pred, (v) => +v.toFixed(2)), e.img.row);
          }
          if (e.img.col) {
            let pred;
            if (pat === "dot") {
              const px = fn(srcX, dw);
              const py = fn(srcY, dh);
              const xCol = e.img.colX;
              pred = Float64Array.from(py, (v) => (v * px[xCol]) / 255);
            } else if (pat === "hline") {
              pred = fn(srcY, dh);
            } else pred = null;
            if (pred) cell.models[mName].col = mad(Array.from(pred, (v) => +v.toFixed(2)), e.img.col);
          }
        }
        report.probeB[pat][size] = cell;
        const r = cell.videoVsImg.row || cell.videoVsImg.col;
        console.log(`[B] ${pat} ${size}: video-vs-img MAD=${r.mad} max=${r.max} | trilinear MAD row=${cell.models.trilinear.row?.mad ?? cell.models.trilinear.col?.mad} | 1-kernel=${cell.models["1-kernel"].row?.mad ?? cell.models["1-kernel"].col?.mad} | 2-stage=${cell.models["2-stage"].row?.mad ?? cell.models["2-stage"].col?.mad}`);
      }
    }
  } else {
    console.log("[B] thiếu probe JSON — bỏ qua phần B");
  }

  // ================= Phần A+C: verdict full-pixel =================
  for (const w of WINDOWS) {
    const snapsPath = path.join(Y2, `headed-w${w.slice(1)}`, `r71y2-snaps-${w}.json`);
    if (!fs.existsSync(snapsPath)) { console.log(`[${w}] thiếu snapshot ${snapsPath} — bỏ qua cửa sổ này`); continue; }
    const snapsDoc = JSON.parse(fs.readFileSync(snapsPath, "utf8"));
    const win = { proxyUsed: snapsDoc.proxyUsed, sources: {} };
    console.log(`\n=== ${w}: snapshot ${Object.keys(snapsDoc.snaps).join(", ")} ===`);
    for (const [srcName, variants] of Object.entries(snapsDoc.snaps)) {
      const cfg = SOURCES[srcName];
      const vw = variants.plain.w, vh = variants.plain.h;
      const rect = variants.plain.rect;
      console.log(`-- ${srcName}: rect ${vw}x${vh} @(${rect.x},${rect.y}) scale=${rect.scale.toFixed(4)}`);
      const plainRgb = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}plain.raw`));
      if (plainRgb.length !== 1280 * 720 * 3) throw new Error(`frame plain ${srcName} sai kích thước`);
      const d0 = delta0Viewport_70x6(plainRgb, 1280, 720, vw, vh);
      // delta0: std ΔY ở viewport (đo nhanh từ d0).
      let d0mean = 0; for (let i = 0; i < d0.length; i++) d0mean += Math.abs(d0[i]);
      const d0std = (() => {
        const m = [0, 0, 0]; for (let i = 0; i < vw * vh; i++) for (let c = 0; c < 3; c++) m[c] += d0[i * 3 + c];
        const n = vw * vh; const s = [0, 0, 0];
        for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) { const v = d0[i * 3 + c] - m[c] / n; s[c] += v * v; }
        return s.map((x) => +Math.sqrt(x / n).toFixed(2));
      })();
      const prevPlain = b64ToRgb(variants.plain.rgbB64);
      const renderPlainTri = resampleRgb24Trilinear(plainRgb, 1280, 720, vw, vh);
      const renderPlain1k = resampleRgb24(plainRgb, 1280, 720, vw, vh);
      const absTri = absMad(prevPlain, renderPlainTri);
      const abs1k = absMad(prevPlain, renderPlain1k);
      console.log(`   delta0 std RGB viewport=${JSON.stringify(d0std)} mean|d0|=${(d0mean / d0.length).toFixed(2)} | plain absMAD trilinear=${absTri.mad} le8=${absTri.le8} | 1-kernel=${abs1k.mad} le8=${abs1k.le8}`);
      const srcEntry = { rect, delta0StdRgb: d0std, plainAbsMad: { trilinear: absTri, "1-kernel": abs1k }, levels: {} };
      for (const lv of LEVELS) {
        const noiseRgb = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}${lv}.raw`));
        const prevNoise = b64ToRgb(variants[lv].rgbB64);
        const renderNoiseTri = resampleRgb24Trilinear(noiseRgb, 1280, 720, vw, vh);
        const renderNoise1k = resampleRgb24(noiseRgb, 1280, 720, vw, vh);
        const lvEntry = {};
        for (const [mName, rp, rn] of [["trilinear", renderPlainTri, renderNoiseTri], ["1-kernel", renderPlain1k, renderNoise1k]]) {
          const withD0 = fullDeltaStats(prevPlain, prevNoise, rp, rn, vw, vh, d0);
          const noD0 = fullDeltaStats(prevPlain, prevNoise, rp, rn, vw, vh, null);
          const phases = [0, 1, 2, 3].map((ph) => ({ phase: ph, ...phaseKurtR(withD0._dP, withD0._dR, vw, vh, ph) }));
          delete withD0._dP; delete withD0._dR; delete noD0._dP; delete noD0._dR;
          lvEntry[mName] = { corrected: withD0, uncorrected: noD0, phaseKurtR: phases };
          console.log(`   ${lv} ${mName}: SAU-delta0 ${withD0.verdict} Δkurt=${JSON.stringify(withD0.kurtDiff)} Δcorr=${JSON.stringify(withD0.corrDiff)} stdRatio=${JSON.stringify(withD0.stdRatio)} | TRƯỚC-delta0 Δkurt=${JSON.stringify(noD0.kurtDiff)} Δcorr=${JSON.stringify(noD0.corrDiff)} | pha ΔkurtR=${phases.map((p) => p.kurtDiffR).join("/")}`);
        }
        srcEntry.levels[lv] = lvEntry;
      }
      win.sources[srcName] = srcEntry;
    }
    report.windows[w] = win;
  }

  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON phân tích: ${OUT}`);
}

main().catch((e) => { console.error(`ANALYZE LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
