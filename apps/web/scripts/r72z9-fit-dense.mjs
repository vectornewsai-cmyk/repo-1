#!/usr/bin/env node
/**
 * r72z9-fit-dense.mjs — Phase 9 đợt 72, luồng Z9 (đóng nợ đợt 71 §5 mục 10):
 * fit bias LOD theo thang trên lưới thang DÀY, gộp dữ liệu Y7 (15 thang)
 * + Z9 (28 thang mới) = 43 thang vuông 512→dw, Chrome headed.
 *
 * Khác r71y7-fit-threshold.mjs: mô hình bias TỔNG QUÁT — quét trực tiếp
 * bias b (λ* = max(0, λ+b), L = floor(λ*), f = frac(λ*)), blend giữa
 * mip L và mip L+1, vì thang thấp (dw=154, λ=1,733) có L=1 ngay tại
 * bias −0,5 (fit Y7 giả định L=0 mọi thang, chỉ đúng tới dw≥230).
 * Cache theo pha: mip0/mip1/mip2 (halve L lần + triangle h=1, làm tròn
 * nửa-xuống đúng production) — blend(f) tái tạo đúng từng số
 * trilinearRow1D production tại bias −0,5 (kiểm max diff = 0).
 *
 * Đầu ra: bảng MAD 1-kernel / 2-stage / trilinear(bias −0,5) theo thang;
 * bias tối ưu từng thang + khoảng bất định (MAD ≤ best+0,0005); thang
 * nào bias KHÔNG xác định được (mipL ≡ mip(L+1), vd s=0,5) hoặc chỉ có
 * cận trên (s>0,7071: mọi bias ≤ −λ đều cho λ*=0); quét bias pooled
 * (toàn cục + theo vùng thang); hồi quy tuyến tính bias(s) trên các
 * thang xác định được (slope có khác 0 không?); V_1D exact từ sweep;
 * điểm 2D bằng code production. Ghi JSON: r72z9-fit-dense.json.
 * KHÔNG push/tag/binary. KHÔNG sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import {
  chromeWeights1D, triangleKernel, roundHalfDown, trilinearRow1D,
  resampleRgb24Trilinear, resampleRgb24, resampleRgb24TwoStage,
} from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round72-z9");
const Y7 = JSON.parse(fs.readFileSync(path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round71-y7", "r71y7-threshold-A.json"), "utf8"));
const Z9 = JSON.parse(fs.readFileSync(path.join(GOAL, "r72z9-dense-A.json"), "utf8"));
const DATA = { userAgent: Z9.userAgent, scales: { ...Y7.scales, ...Z9.scales } };
const S = 512;
function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }

// ---- mip rows (mirror production trilinearRow1D exactly) ----
function halveRowHD(src) {
  const dw = Math.round(src.length / 2), out = new Array(dw);
  for (let i = 0; i < dw; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, 0.5, src.length, triangleKernel, 1)) acc += w * src[j];
    out[i] = roundHalfDown(acc);
  }
  return out;
}
function bilinearRowHD(src, dstLen) {
  const s = dstLen / src.length, out = new Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, s, src.length, triangleKernel, 1)) acc += w * src[j];
    out[i] = roundHalfDown(acc);
  }
  return out;
}
function mipRow(src, dstLen, L) {
  let row = Array.from(src);
  for (let k = 0; k < L; k++) row = halveRowHD(row);
  return bilinearRowHD(row, dstLen);
}
function oneKernelRow(src, dstLen) {
  const s = dstLen / src.length, out = new Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, s, src.length, triangleKernel)) acc += w * src[j];
    out[i] = Math.round(acc);
  }
  return out;
}
function twoStageRow(src, dstLen) {
  // Khớp production resamplePlaneTwoStage: chặng giữa Math.round (KHÔNG
  // roundHalfDown — khác với halve của trilinear), chặng 2 Math.round.
  const halveRound = (row) => {
    const dw = Math.round(row.length / 2), out = new Array(dw);
    for (let i = 0; i < dw; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, 0.5, row.length, triangleKernel, 1)) acc += w * row[j];
      out[i] = Math.round(acc);
    }
    return out;
  };
  const mid = halveRound(src);
  const s2 = dstLen / mid.length, out = new Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, s2, mid.length, triangleKernel, 1)) acc += w * mid[j];
    out[i] = Math.round(acc);
  }
  return out;
}
// Hàng trilinear với bias b tuỳ ý (tổng quát hoá production, bias −0,5).
function triBiasRow(mips, dw, lam, b) {
  const lamStar = Math.max(0, lam + b);
  const L = Math.floor(lamStar), f = lamStar - L;
  const a = mips[L], c = mips[L + 1];
  if (f === 0) return a;
  return a.map((v, i) => Math.round((1 - f) * v + f * c[i]));
}

// ---- cache theo pha cho 1 thang ----
function phaseCache(entry) {
  const dw = entry.dw, phases = [];
  for (const sweep of [entry.sweepSqX, entry.sweepSqY]) {
    for (const { p, row } of sweep) {
      const src = new Array(S).fill(0); src[p] = 255;
      const mips = [mipRow(src, dw, 0), mipRow(src, dw, 1), mipRow(src, dw, 2)];
      phases.push({ meas: row, mips, oneK: oneKernelRow(src, dw), twoS: twoStageRow(src, dw), tri: trilinearRow1D(src, dw) });
    }
  }
  return phases;
}
function madOfRows(phases, pick) {
  let sum = 0, n = 0, dPeakAbs = 0, dPeakMax = 0;
  for (const ph of phases) {
    const m = pick(ph);
    let mad = 0, pkM = 0, pkD = 0;
    for (let i = 0; i < ph.meas.length; i++) { mad += Math.abs(m[i] - ph.meas[i]); if (m[i] > pkM) pkM = m[i]; if (ph.meas[i] > pkD) pkD = ph.meas[i]; }
    sum += mad / ph.meas.length; dPeakAbs += Math.abs(pkM - pkD); dPeakMax = Math.max(dPeakMax, Math.abs(pkM - pkD)); n++;
  }
  return { mad: sum / n, meanAbsDPeak: dPeakAbs / n, maxAbsDPeak: dPeakMax, n };
}
// V_1D exact từ hàng xung: mean qua pha của Σ(row/255)^2 / s.
function v1dExact(phases, s, pick) {
  let sum = 0;
  for (const ph of phases) {
    const m = pick(ph);
    let q = 0;
    for (let i = 0; i < m.length; i++) q += (m[i] / 255) * (m[i] / 255);
    sum += q;
  }
  return sum / phases.length / s;
}

// ---- main ----
const DWS = Object.keys(DATA.scales).map(Number).sort((a, b) => a - b);
const results = {};
const caches = {};
const BIAS_GRID = [];
for (let b = -0.8; b <= -0.1999; b += 0.002) BIAS_GRID.push(+b.toFixed(3));
for (const dw of DWS) {
  const e = DATA.scales[String(dw)];
  const sAct = dw / S, lam = Math.log2(1 / sAct);
  const phases = phaseCache(e);
  caches[dw] = phases;
  const r1k = madOfRows(phases, (ph) => ph.oneK);
  const r2s = madOfRows(phases, (ph) => ph.twoS);
  const rTri = madOfRows(phases, (ph) => ph.tri);
  // verify blend(bias −0,5) == production trilinearRow1D đúng từng số
  let maxBlendProdDiff = 0;
  for (const ph of phases) {
    const b = triBiasRow(ph.mips, dw, lam, -0.5);
    for (let i = 0; i < b.length; i++) maxBlendProdDiff = Math.max(maxBlendProdDiff, Math.abs(b[i] - ph.tri[i]));
  }
  // quét bias: MAD từng b trên lưới 0,002 + khoảng bất định (MAD ≤ best+0,0005)
  let bestB = null, bestMad = Infinity;
  const madByB = [];
  for (const b of BIAS_GRID) {
    const r = madOfRows(phases, (ph) => triBiasRow(ph.mips, dw, lam, b));
    madByB.push([b, r.mad]);
    if (r.mad < bestMad) { bestMad = r.mad; bestB = b; }
  }
  const bandB = madByB.filter(([, m]) => m <= bestMad + 0.0005).map(([b]) => b);
  const bBand = [Math.min(...bandB), Math.max(...bandB)];
  // L/f tại bias tốt nhất + khả năng phân biệt mip L vs mip L+1
  const lamStarBest = Math.max(0, lam + bestB);
  const Lbest = Math.floor(lamStarBest), fBest = lamStarBest - Lbest;
  let maxMipDiff = 0;
  for (const ph of phases) for (let i = 0; i < ph.mips[Lbest].length; i++) maxMipDiff = Math.max(maxMipDiff, Math.abs(ph.mips[Lbest][i] - ph.mips[Lbest + 1][i]));
  // Bias chỉ có cận trên khi band chứa vùng λ*=0 (mọi bias ≤ −λ đều cho cùng mô hình).
  const flatInBand = bBand[0] <= -lam + 1e-9;
  const identifiable = maxMipDiff > 0 && !flatInBand;
  const vMeas = v1dExact(phases, sAct, (ph) => ph.meas);
  const vTri = v1dExact(phases, sAct, (ph) => ph.tri);
  const vTex = e.texture.reduce((a, t) => a + t.V, 0) / e.texture.length;
  results[dw] = {
    sActual: +sAct.toFixed(4), lambda: +lam.toFixed(4),
    oneKernel: { mad: +r1k.mad.toFixed(4), meanAbsDPeak: +r1k.meanAbsDPeak.toFixed(3), maxAbsDPeak: r1k.maxAbsDPeak },
    twoStage: { mad: +r2s.mad.toFixed(4), meanAbsDPeak: +r2s.meanAbsDPeak.toFixed(3), maxAbsDPeak: r2s.maxAbsDPeak },
    trilinearProd: { mad: +rTri.mad.toFixed(4), meanAbsDPeak: +rTri.meanAbsDPeak.toFixed(3), maxAbsDPeak: rTri.maxAbsDPeak },
    blendVsProdMaxDiff: maxBlendProdDiff,
    bestBias: +bestB.toFixed(3), bestBiasMad: +bestMad.toFixed(4),
    biasBand0005: [+bBand[0].toFixed(3), +bBand[1].toFixed(3)],
    Lbest, fBest: +fBest.toFixed(3), mipDiffAtBest: maxMipDiff,
    biasIdentifiable: identifiable,
    biasUpperOnly: !identifiable && flatInBand ? +bBand[1].toFixed(3) : null,
    v1dMeasuredExact: +vMeas.toFixed(4), v1dTriExact: +vTri.toFixed(4), v1dExactErr: +(vTri - vMeas).toFixed(4),
    v1dMeasuredTexture: +Math.sqrt(vTex).toFixed(4),
    dc: e.dc, point: e.point,
  };
  const win = rTri.mad <= r1k.mad && rTri.mad <= r2s.mad ? "TRI" : (r1k.mad <= r2s.mad ? "1K" : "2ST");
  log(`dw=${dw} s=${sAct.toFixed(4)} lam=${lam.toFixed(3)} | 1K ${r1k.mad.toFixed(4)} | 2ST ${r2s.mad.toFixed(4)} | TRI ${rTri.mad.toFixed(4)} | thắng: ${win} | bias*=${bestB.toFixed(3)} [${bBand[0].toFixed(3)},${bBand[1].toFixed(3)}] L=${Lbest} f=${fBest.toFixed(3)} ident=${identifiable} | blend-prod ${maxBlendProdDiff} | V1D đo ${vMeas.toFixed(4)} TRI ${vTri.toFixed(4)}`);
}

// ---- quét bias pooled (toàn cục + theo vùng thang) ----
function pooledMADForBias(b, dws) {
  let madSum = 0, n = 0;
  for (const dw of dws) {
    const lam = Math.log2(S / dw);
    const r = madOfRows(caches[dw], (ph) => triBiasRow(ph.mips, dw, lam, b));
    madSum += r.mad * r.n; n += r.n;
  }
  return madSum / n;
}
function pooledMAD(pick, dws) {
  let madSum = 0, n = 0;
  for (const dw of dws) { const r = madOfRows(caches[dw], pick); madSum += r.mad * r.n; n += r.n; }
  return +(madSum / n).toFixed(4);
}
const regions = {
  all: DWS,
  s_lt_05: DWS.filter((d) => d / S < 0.5),
  s_05_0707: DWS.filter((d) => d / S >= 0.5 && d / S < 0.7071),
  s_ge_0707: DWS.filter((d) => d / S >= 0.7071),
  s_038_region: DWS.filter((d) => d >= 188 && d <= 210),
  s_063_067_region: DWS.filter((d) => d >= 318 && d <= 346),
};
log("--- quét bias pooled MAD ---");
const biasSweep = {};
for (const [name, dws] of Object.entries(regions)) {
  const row = {};
  for (const b of [-0.25, -0.4, -0.45, -0.48, -0.5, -0.52, -0.55, -0.6, -0.75]) row[b] = +pooledMADForBias(b, dws).toFixed(4);
  biasSweep[name] = row;
  log(`${name} (${dws.length} thang): ${JSON.stringify(row)}`);
}
const pooled = {};
for (const [name, dws] of Object.entries(regions)) {
  pooled[name] = { tri: pooledMAD((ph) => ph.tri, dws), oneK: pooledMAD((ph) => ph.oneK, dws), twoS: pooledMAD((ph) => ph.twoS, dws) };
}
log("pooled MAD TRI/1K/2ST theo vùng: " + JSON.stringify(pooled));

// ---- hồi quy tuyến tính bias(s) trên thang xác định được ----
const ident = DWS.filter((dw) => results[dw].biasIdentifiable);
const xs = ident.map((dw) => results[dw].sActual);
const ys = ident.map((dw) => results[dw].bestBias);
const n = xs.length, mx = xs.reduce((a, v) => a + v, 0) / n, my = ys.reduce((a, v) => a + v, 0) / n;
let sxy = 0, sxx = 0, syy = 0;
for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
const slope = sxy / sxx, intercept = my - slope * mx;
const residStd = Math.sqrt(Math.max(0, (syy - slope * sxy) / Math.max(1, n - 2)));
const slopeSE = residStd / Math.sqrt(sxx);
const regression = { n, slope: +slope.toFixed(4), intercept: +intercept.toFixed(4), slopeSE: +slopeSE.toFixed(4), residStd: +residStd.toFixed(4), meanBias: +my.toFixed(4), biasMin: Math.min(...ys), biasMax: Math.max(...ys) };
log(`hồi quy bias(s): n=${n} slope=${slope.toFixed(4)} ± ${slopeSE.toFixed(4)} (SE) | intercept=${intercept.toFixed(4)} | residStd=${residStd.toFixed(4)} | mean bias=${my.toFixed(4)} | min/max=${Math.min(...ys).toFixed(3)}/${Math.max(...ys).toFixed(3)}`);

// ---- điểm 2D bằng code production ----
log("--- điểm 2D (512×512, xung tại 256,256) ---");
const p2d = [];
for (const dw of DWS) {
  const e = DATA.scales[String(dw)];
  const img = Buffer.alloc(S * S * 3, 0);
  const idx = (256 * S + 256) * 3; img[idx] = img[idx + 1] = img[idx + 2] = 255;
  const check = (fn) => {
    const out = fn(img, S, S, dw, dw);
    let peak = 0, px = -1, py = -1;
    for (let y = 0; y < dw; y++) for (let x = 0; x < dw; x++) { const v = out[(y * dw + x) * 3]; if (v > peak) { peak = v; px = x; py = y; } }
    return { peak, peakX: px, peakY: py, dPeak: peak - e.point.peak };
  };
  const row = { dw, sActual: results[dw].sActual, measured: e.point,
    tri: check(resampleRgb24Trilinear), oneK: check(resampleRgb24), twoS: check(resampleRgb24TwoStage) };
  p2d.push(row);
  log(`dw=${dw} đo peak ${e.point.peak}@(${e.point.peakX},${e.point.peakY}) | TRI ${row.tri.peak}@(${row.tri.peakX},${row.tri.peakY}) d=${row.tri.dPeak} | 1K ${row.oneK.peak} d=${row.oneK.dPeak} | 2ST ${row.twoS.peak} d=${row.twoS.dPeak}`);
}

const out = { userAgent: DATA.userAgent, scales: DWS.length, y7scales: Object.keys(Y7.scales).length, z9scales: Object.keys(Z9.scales).length,
  determinismRepeat195: JSON.stringify(Z9.scales["195"]) === JSON.stringify(Z9.repeat195),
  determinismRepeat282Y7: JSON.stringify(Y7.scales["282"]) === JSON.stringify(Y7.repeat282),
  perScale: results, biasSweepPooledMAD: biasSweep, pooledMAD: pooled, biasRegression: regression, point2d: p2d };
writeFileEpermRetry(path.join(GOAL, "r72z9-fit-dense.json"), JSON.stringify(out, null, 2));
log("ghi xong r72z9-fit-dense.json");
