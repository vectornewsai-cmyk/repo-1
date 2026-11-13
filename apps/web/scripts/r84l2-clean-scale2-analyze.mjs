#!/usr/bin/env node
/**
 * r84l2-clean-scale2-analyze.mjs — Phase 9 đợt 84, luồng L2: phân tích probe
 * SẠCH thang ~2 trên nội dung tự nhiên (đóng nợ K2 §7 mục 2).
 *
 * Snaps: hidden_files/round84-l2/headed-w2560x1440-p640x360/
 *   r84l2-snaps-w2560x1440-p640x360.json (ocean640, project 640×360,
 *   cửa sổ 2560×1440, rect 1449×815, s=2,2639 — clip GỐC 640 nên không
 *   còn downscale nội bộ 1280→640 như cửa sổ p640 của F6).
 * Render đối chiếu: F6 render/ocean640/fullrgb-*.raw (5 biến thể).
 *
 * Phương pháp: resample 2-pass độc lập với kernel cắm được (như K2 Arm C),
 * 3 kernel tri / BC(0,25,0,375) / Mitchell(1/3,1/3) — CỐ Ý KHÔNG dùng
 * resampleRgb24Trilinear của production (sau K2 nó đã đọc hằng Mitchell
 * ở nhánh upscale nên không còn là tam giác thuần; dùng nó sẽ làm "tri"
 * thành Mitchell trá hình). Noise: thống kê delta kiểu F6 (std ratio,
 * |Δkurt| ≤ 0,35, |Δcorr| ≤ 0,12) × 2 chế độ d0 (không-d0 / có-d0) +
 * cổng G12 full-pixel chọn d0 (d0 tính bằng đúng phương pháp đang xét).
 * Các hàm channelStats/fullDeltaStats/delta0Viewport sao chép từ
 * r78f6-fullpixel-analyze.mjs.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r84l2-clean-scale2-analyze.mjs
 * Env: R84L2_OUT (mặc định hidden_files/round84-l2/r84l2-clean-scale2-analysis.json).
 * Chỉ đo offline. KHÔNG push/tag/binary/workflow. KHÔNG sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, triangleKernel, bcCubicKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const L2 = path.join(GOAL, "round84-l2");
const F6 = path.join(GOAL, "round78-f6");
const SNAP = path.join(L2, "headed-w2560x1440-p640x360", "r84l2-snaps-w2560x1440-p640x360.json");
const RDIR = path.join(F6, "render", "ocean640");
const OUT = process.env.R84L2_OUT || path.join(L2, "r84l2-clean-scale2-analysis.json");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
const r3 = (v) => +v.toFixed(3);

const KERNELS = {
  tri: triangleKernel,
  bc025_0375: (x) => bcCubicKernel(x, 0.25, 0.375),
  mitchell: (x) => bcCubicKernel(x, 1 / 3, 1 / 3),
};
const KNAMES = ["tri", "bc025_0375", "mitchell"];

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
  let sum = 0, le8 = 0, le32 = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]); sum += d; if (d > dmax) dmax = d; }
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  return { mad: r3(sum / (n * 3)), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4) };
}
function deltaOf(a, b) { const o = new Float64Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] - b[i]; return o; }
function deltaMadFloat(dp, dr) { let s = 0; for (let i = 0; i < dp.length; i++) s += Math.abs(dp[i] - dr[i]); return r3(s / dp.length); }
const verdictAbs = (m) => (m.mad <= 2 && m.le8 >= 0.99 ? "KHỚP" : m.mad <= 20 && m.le32 >= 0.9 ? "XẤP XỈ" : "LỆCH");
const verdictDelta = (d) => (d <= 2 ? "KHỚP" : "LỆCH");

// ---------- noise machinery (sao chép r78f6-fullpixel-analyze.mjs) ----------
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
function delta0Viewport(plainRgb, srcW, srcH, dstW, dstH, resampleFn) {
  const shifted = estShiftFrame_70x6(plainRgb, srcW, srcH);
  const a = resampleFn(plainRgb, srcW, srcH, dstW, dstH);
  const b = resampleFn(shifted, srcW, srcH, dstW, dstH);
  const d0 = new Int16Array(dstW * dstH * 3);
  for (let i = 0; i < dstW * dstH * 3; i++) d0[i] = b[i] - a[i];
  return d0;
}
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
    n, deltaMad: r3(sumAbs / (n * 3)),
    previewStd: preview.std, renderStd: render.std, stdRatio: ratios,
    previewKurt: preview.kurt, renderKurt: render.kurt, kurtDiff: dKurt,
    previewCorr: preview.corr, renderCorr: render.corr, corrDiff: dCorr,
    verdict: okStd && okKurt && okCorr ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ",
    okStd, okKurt, okCorr,
  };
}

const doc = JSON.parse(fs.readFileSync(SNAP, "utf8"));
const projW = doc.projW, projH = doc.projH;
const content = "ocean640";
const snaps = doc.snaps[content];
const rect = snaps.plain.rect;
const vw = snaps.plain.w, vh = snaps.plain.h;
const scale = rect.scale;
console.log(`clean2: ${content} rect ${vw}x${vh} scale=${scale.toFixed(4)} (proj ${projW}x${projH})`);
const fullRgb = {};
for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) fullRgb[v] = fs.readFileSync(path.join(RDIR, `fullrgb-${v}.raw`));
const prev = {};
for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");

const report = {
  generated: new Date().toISOString(), content, scale,
  snapFile: SNAP, renderDir: RDIR, verdict: VERDICT,
  headed: JSON.parse(fs.readFileSync(path.join(L2, "headed-w2560x1440-p640x360", "r84l2-headed-report-w2560x1440-p640x360.json"), "utf8")),
  methods: {},
};
const tally = { delta: {}, plain: {}, noise: {} };
for (const name of KNAMES) {
  const kernel = KERNELS[name];
  const fn = (rgb, sw, sh, dw, dh) => resampleRgbKernel(rgb, sw, sh, dw, dh, kernel);
  const rend = {};
  for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) rend[v] = fn(fullRgb[v], projW, projH, vw, vh);
  const d0 = delta0Viewport(fullRgb.plain, projW, projH, vw, vh, fn);
  const n = vw * vh;
  const plainMadFp = mad3(prev.plain, rend.plain).mad;
  const d0std = channelStats(Float64Array.from(d0)).std;
  const resid = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) resid[i] = prev.plain[i] - rend.plain[i];
  const residStd = channelStats(resid).std;
  const ratioR = residStd[0] > 0 ? +(d0std[0] / residStd[0]).toFixed(2) : 0;
  const gate = { rule: "G12-fullpixel", plainMad: plainMadFp, d0std, residStd, ratioR, apply: plainMadFp <= 2.5 && d0std[0] <= 2.0 && ratioR <= 1.0 };
  console.log(`\n[${name}] cổng G12: plainMad=${plainMadFp} d0std_R=${d0std[0]} residStd_R=${residStd[0]} ratioR=${ratioR} → ${gate.apply ? "ÁP d0" : "KHÔNG áp d0"}`);
  const ment = { gate };
  for (const v of ["plain", "sharp05", "sharp10"]) {
    const abs = mad3(prev[v], rend[v]);
    const vent = { absolute: { ...abs, verdict: verdictAbs(abs) } };
    if (v !== "plain") {
      const d = deltaMadFloat(deltaOf(prev[v], prev.plain), deltaOf(rend[v], rend.plain));
      vent.delta = { mad: d, verdict: verdictDelta(d) };
    }
    ment[v] = vent;
    console.log(`  [${name}] ${v}: abs MAD=${abs.mad} le8=${abs.le8} → ${vent.absolute.verdict}${vent.delta ? `; DELTA MAD=${vent.delta.mad} → ${vent.delta.verdict}` : ""}`);
  }
  for (const v of ["noise05", "noise10"]) {
    const stNo = fullDeltaStats(prev.plain, prev[v], rend.plain, rend[v], vw, vh, null);
    const stD0 = fullDeltaStats(prev.plain, prev[v], rend.plain, rend[v], vw, vh, d0);
    const g12 = gate.apply ? stD0 : stNo;
    ment[v] = { noiseNoD0: stNo, noiseWithD0: stD0, noiseG12: { ...g12, verdictSource: gate.apply ? "có-d0" : "không-d0" } };
    console.log(`  [${name}] ${v}: không-d0 ${stNo.verdict} std[${stNo.stdRatio}] Δkurt[${stNo.kurtDiff}] Δcorr[${stNo.corrDiff}] | có-d0 ${stD0.verdict} std[${stD0.stdRatio}] Δkurt[${stD0.kurtDiff}] Δcorr[${stD0.corrDiff}] | G12=${g12.verdict}`);
  }
  report.methods[name] = ment;
  tally.delta[name] = ment.sharp05.delta.mad + ment.sharp10.delta.mad;
  tally.plain[name] = ment.plain.absolute.mad;
  tally.noise[name] = [ment.noise05.noiseG12, ment.noise10.noiseG12].map((g) => g.verdict).join("/");
}
// Đếm thắng (delta + plain).
const cmp2 = (a, b) => (a < b - 0.001 ? "thắng" : b < a - 0.001 ? "thua" : "hòa");
console.log(`\nTỔNG delta (sharp05+sharp10): tri=${tally.delta.tri} bc=${tally.delta.bc025_0375} mit=${tally.delta.mitchell}`);
console.log(`Mitchell vs BC trên delta: ${cmp2(tally.delta.mitchell, tally.delta.bc025_0375)}; plain: mit=${tally.plain.mitchell} bc=${tally.plain.bc025_0375} tri=${tally.plain.tri}`);
console.log(`Noise G12 verdicts: tri=${tally.noise.tri} bc=${tally.noise.bc025_0375} mit=${tally.noise.mitchell}`);
report.tally = tally;
fs.mkdirSync(L2, { recursive: true });
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
