#!/usr/bin/env node
/**
 * delta0-harness.mjs — Phase 9, đợt 77 luồng E6: TIỆN ÍCH ĐO DELTA0 DÙNG
 * CHUNG (canonical). Nối luật G12 (đợt 76 D2) vào harness đo để mọi lần
 * đo sau dùng chung MỘT luật, thay vì mỗi script tự sao chép luật cũ R0.
 *
 * BỐI CẢNH (đọc docs/PHASE9_ROUND76_D2_DELTA0_LIMITS.md trước khi sửa):
 *  - Luật delta0 KHÔNG nằm trong production: `delta0` chỉ xuất hiện trong
 *    các script phân tích (r72z9/r73a3/r74b1/r75c1/r76d2), không có trong
 *    apps/web/src/, packages/, server/. d0 là HIỆU CHỈNH ĐO LƯỜNG trong
 *    harness (trừ đi mô hình chroma-shift khỏi delta preview trước khi so
 *    thống kê với render), không phải hành vi sản phẩm. Vì vậy module này
 *    CHỈ sửa harness đo — không đụng render.js, preview.tsx hay bất kỳ
 *    file production nào.
 *  - Luật cũ R0 (Z2): áp d0 khi plainMad <= 2,5. Sau khi C1 (đợt 75) sửa
 *    rò plain, plainMad ocean post-fix rơi xuống ~1,1-1,4 nhưng d0std_R
 *    ~3,9 vẫn lớn hơn phần dư plain thực (~0,9-1,8) -> R0 áp d0 sai,
 *    Δkurt R vọt 0,45 (w1440) / 0,36 (w1920). R0 đúng 18/20 case D2.
 *  - Luật mới G12 (D2, đúng 20/20): áp d0 khi và chỉ khi cả ba cùng đúng:
 *      1. plainMad <= 2,5        (giữ ngưỡng Z2)
 *      2. d0std_R <= 2,0          (thành phần R của mô hình đủ nhỏ)
 *      3. ratio_R = d0std_R / residStd_R <= 1,0
 *    (residStd_R = độ lệch chuẩn phần dư plain thực kênh R, tức
 *    previewPlain - renderPlainTri.) G1 (chỉ cổng 2) và G2 (chỉ cổng 3)
 *    đồng ý nhau trên cả 24 case D2 nên chưa phân biệt được — G12 là hội
 *    bảo thủ của hai cổng, xem D2 §6 nợ 1.
 *  - Ngưỡng verdict như Z2/A3/B1/C1/D2: std ratio [0,85, 1,18],
 *    |Δkurt| <= 0,35, |Δcorr| <= 0,12. Resample: chrome-resample.mjs
 *    (C2 M4 LOD trung bình nhân, từ 15:32 09/11 — mọi so sánh plainMad
 *    xuyên đợt phải ghi rõ phiên bản này).
 *
 * Helpers delta0/thống kê sao chép VERBATIM từ r76d2-analyze.mjs
 * (nguồn r75c1-analyze.mjs / r73a3-d0cond.mjs). Các script lịch sử
 * (r74b1/r75c1/r76d2) KHÔNG sửa lại — chúng giữ nguyên hiện trạng đợt đó;
 * script đo mới từ đợt 77 trở đi import module này và dùng
 * `evalDelta0Case` + `applyDelta0G12`, không tự định nghĩa lại luật.
 *
 * Dùng: import { evalDelta0Case, applyDelta0G12, scoreRule } from "./delta0-harness.mjs";
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

export const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
/** Ngưỡng luật cũ R0 (Z2) — giữ để đối chứng, KHÔNG dùng làm luật chính. */
export const D0_PLAIN_MAD_MAX = 2.5;
/** Luật G12 (D2): ngưỡng cổng 2 — d0std kênh R tối đa. */
export const G12_D0STD_R_MAX = 2.0;
/** Luật G12 (D2): ngưỡng cổng 3 — ratio d0std_R / residStd_R tối đa. */
export const G12_RATIO_R_MAX = 1.0;

// ---------- sao chép verbatim r76d2-analyze.mjs ----------
export function rgbToYuv709_70x6(r, g, b) {
  const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const y = 16 + 219 * yl;
  const cb = 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.0722);
  const cr = 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.2126);
  return [y, cb, cr];
}
export function yuv709ToRgb_70x6(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.79274 * (cr - 128), yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128), yy + 2.1122 * (cb - 128)];
}
export function estimateNativeChroma_70x6(derived, k) {
  const e = 128 + k * (derived - 128);
  return e < 16 ? 16 : e > 240 ? 240 : e;
}
export function estShiftFrame_70x6(rgb, srcW, srcH) {
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
export function delta0Viewport_70x6(plainRgb, srcW, srcH, dstW, dstH) {
  const shifted = estShiftFrame_70x6(plainRgb, srcW, srcH);
  const a = resampleRgb24Trilinear(plainRgb, srcW, srcH, dstW, dstH);
  const b = resampleRgb24Trilinear(shifted, srcW, srcH, dstW, dstH);
  const d0 = new Int16Array(dstW * dstH * 3);
  for (let i = 0; i < dstW * dstH * 3; i++) d0[i] = b[i] - a[i];
  return d0;
}
export function channelStats(d) {
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
export function fullDeltaStats(previewPlain, previewNoise, renderPlain, renderNoise, vw, vh, delta0) {
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
export function absMad(a, b) {
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
export function absMadPerChannel(a, b) {
  const n = a.length / 3, out = [];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let p = 0; p < n; p++) s += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
    out.push(+(s / n).toFixed(3));
  }
  return out;
}
/** Pearson corr từng kênh giữa hai mảng dài n*3 (d0 vs phần dư plain). */
export function corrPerChannel(a, b) {
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
export const b64ToRgb = (b64) => Buffer.from(b64, "base64");
const r2 = (v) => +v.toFixed(2);

// ---------- số học KHÔNG làm tròn (đợt 81 I4, SONG SONG với bản làm tròn) ----------
// BỐI CẢNH (H4 §5/§7): channelStats làm tròn kurt về 2 chữ số rồi mới
// tính kurtDiff → sai số lượng tử hoá tới ±0,01, đúng bằng bước ngưỡng
// đang xét (0,35). Case F7-sweep-w2240-testpattern-n10 [fullD0] có
// maxKurt chưa làm tròn 0,3508 > 0,35 (LỆCH) trong khi bản làm tròn báo
// KHỚP — harness làm tròn không thấy được case phân biệt G1/G2 này.
// Các hàm *Raw dưới đây là ĐƯỜNG ĐO SONG SONG: tính cùng thống kê
// nhưng KHÔNG làm tròn số trung gian, để chấm verdict từ số chưa làm
// tròn. KHÔNG sửa bất kỳ hàm làm tròn nào ở trên (điểm lịch sử giữ
// nguyên); script đo mới dùng evalDelta0CaseRaw bên cạnh
// evalDelta0Case và đối chiếu cả hai.
/** channelStats nhưng KHÔNG làm tròn std/kurt/corr (giữ full precision). */
export function channelStatsRaw(d) {
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
    out.std.push(std);
    out.kurt.push(std > 0 ? s4 / n / (std ** 4) - 3 : 0);
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(out.std[a] > 0 && out.std[b] > 0 ? s / n / (out.std[a] * out.std[b]) : 0);
  }
  return out;
}
/** Pearson corr từng kênh giữa hai mảng dài n*3 (d0 vs phần dư plain) — KHÔNG làm tròn. */
export function corrPerChannelRaw(a, b) {
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
    out.push(sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0);
  }
  return out;
}
/**
 * fullDeltaStats nhưng KHÔNG làm tròn (std ratio, kurtDiff, corrDiff,
 * deltaMad giữ full precision). kurtThreshold mặc định = VERDICT.kurt
 * (0,35); truyền 0,34/0,36 để khảo sát độ nhạy ngưỡng như H4.
 */
export function fullDeltaStatsRaw(previewPlain, previewNoise, renderPlain, renderNoise, vw, vh, delta0, kurtThreshold = VERDICT.kurt) {
  const n = vw * vh;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  let sumAbs = 0;
  for (let i = 0; i < n * 3; i++) {
    const dp = previewNoise[i] - previewPlain[i] - (delta0 ? delta0[i] : 0);
    const dr = renderNoise[i] - renderPlain[i];
    dP[i] = dp; dR[i] = dr;
    sumAbs += Math.abs(dp - dr);
  }
  const preview = channelStatsRaw(dP), render = channelStatsRaw(dR);
  const ratios = render.std.map((s, i) => preview.std[i] / s);
  const dKurt = preview.kurt.map((k, i) => Math.abs(k - render.kurt[i]));
  const dCorr = preview.corr.map((c, i) => Math.abs(c - render.corr[i]));
  const okStd = ratios.every((r) => r >= VERDICT.stdLo && r <= VERDICT.stdHi);
  const okKurt = dKurt.every((x) => x <= kurtThreshold);
  const okCorr = dCorr.every((x) => x <= VERDICT.corr);
  return {
    n, deltaMad: sumAbs / (n * 3),
    previewStd: preview.std, renderStd: render.std, stdRatio: ratios,
    previewKurt: preview.kurt, renderKurt: render.kurt, kurtDiff: dKurt,
    previewCorr: preview.corr, renderCorr: render.corr, corrDiff: dCorr,
    verdict: okStd && okKurt && okCorr ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ",
    okStd, okKurt, okCorr,
  };
}
/** MAD tuyệt đối KHÔNG làm tròn (dùng cho cổng plainMad của luật raw). */
export function absMadRaw(a, b) {
  const n = a.length / 3;
  let sum = 0;
  for (let p = 0; p < n; p++) for (let c = 0; c < 3; c++) sum += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
  return sum / (n * 3);
}
// ---------- luật delta0, bản KHÔNG làm tròn (đợt 81 I4) ----------
// Cùng ngưỡng với bản làm tròn (2,5 / 2,0 / 1,0) nhưng tính từ đặc trưng
// chưa làm tròn: d0std_R, residStd_R, ratio_R = d0std_R / residStd_R.
/** Luật G12 raw: áp d0 ⟺ plainMad ≤ 2,5 ∧ d0std_R ≤ 2,0 ∧ ratio_R ≤ 1,0 (số chưa làm tròn). */
export function applyDelta0G12Raw(f) {
  const ratioR = f.residStd[0] > 0 ? f.d0std[0] / f.residStd[0] : 0;
  const plainMadOk = f.plainMad <= D0_PLAIN_MAD_MAX;
  const d0stdROk = f.d0std[0] <= G12_D0STD_R_MAX;
  const ratioROk = ratioR <= G12_RATIO_R_MAX;
  return { plainMadOk, d0stdROk, ratioROk, ratioR, apply: plainMadOk && d0stdROk && ratioROk };
}
/** Cổng G1 raw: R0 && d0std_R ≤ 2,0 (số chưa làm tròn). */
export function applyDelta0G1Raw(f) {
  const g = applyDelta0G12Raw(f);
  return { ...g, apply: g.plainMadOk && g.d0stdROk };
}
/** Cổng G2 raw: R0 && ratio_R ≤ 1,0 (số chưa làm tròn). */
export function applyDelta0G2Raw(f) {
  const g = applyDelta0G12Raw(f);
  return { ...g, apply: g.plainMadOk && g.ratioROk };
}
/** Luật cũ R0 raw: áp d0 khi plainMad ≤ 2,5 (số chưa làm tròn). */
export function applyDelta0R0Raw(f) {
  return { plainMadOk: f.plainMad <= D0_PLAIN_MAD_MAX, apply: f.plainMad <= D0_PLAIN_MAD_MAX };
}

/**
 * Đánh giá một case bằng số học KHÔNG làm tròn — song song với
 * evalDelta0Case (cùng shape trả về để scoreRule dùng chung được, chỉ
 * khác: mọi số đều chưa làm tròn, gates/verdict tính từ số chưa làm
 * tròn). kurtThreshold truyền vào fullDeltaStatsRaw (mặc định 0,35).
 */
export function evalDelta0CaseRaw(c, kurtThreshold = VERDICT.kurt) {
  const { name, regime = "", prevPlain, prevNoise, plain1280, noise1280, vw, vh } = c;
  const renderPlainTri = resampleRgb24Trilinear(plain1280, 1280, 720, vw, vh);
  const renderNoiseTri = resampleRgb24Trilinear(noise1280, 1280, 720, vw, vh);
  const plainMad = absMadRaw(prevPlain, renderPlainTri);
  const d0 = delta0Viewport_70x6(plain1280, 1280, 720, vw, vh);
  const d0std = channelStatsRaw(Float64Array.from(d0)).std;
  const n = vw * vh;
  const resid = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) resid[i] = prevPlain[i] - renderPlainTri[i];
  const residStd = channelStatsRaw(resid).std;
  const ratio = d0std.map((s, i) => (residStd[i] > 0 ? s / residStd[i] : 0));
  const maxRatio = Math.max(...ratio);
  const meanRatio = ratio.reduce((a, b) => a + b, 0) / 3;
  const corr = corrPerChannelRaw(d0, resid);
  const maxCorr = Math.max(...corr);
  const stNo = fullDeltaStatsRaw(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, null, kurtThreshold);
  const stFull = fullDeltaStatsRaw(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0, kurtThreshold);
  const feats = { plainMad, d0std, residStd };
  const g12 = applyDelta0G12Raw(feats);
  const g1 = applyDelta0G1Raw(feats);
  const g2 = applyDelta0G2Raw(feats);
  const r0 = applyDelta0R0Raw(feats);
  const gates = {
    R0_cu: r0.apply,
    G1_d0stdR_le_2: g1.apply,
    G2_ratioR_le_1: g2.apply,
    G12_ca_hai: g12.apply,
  };
  const verdictUnder = {
    R0_cu: r0.apply ? stFull.verdict : stNo.verdict,
    G1_d0stdR_le_2: g1.apply ? stFull.verdict : stNo.verdict,
    G2_ratioR_le_1: g2.apply ? stFull.verdict : stNo.verdict,
    G12_ca_hai: g12.apply ? stFull.verdict : stNo.verdict,
  };
  const correct = correctVerdict(stNo, stFull);
  return {
    name, regime, rect: `${vw}x${vh}`, arithmetic: "unrounded", kurtThreshold,
    plainMad, d0std, residStd, ratio, maxRatio, meanRatio, corr, maxCorr,
    d0stdR: d0std[0], ratioR: ratio[0],
    verdictNoD0: stNo.verdict, kurtDiffNoD0: stNo.kurtDiff, corrDiffNoD0: stNo.corrDiff, deltaMadNoD0: stNo.deltaMad,
    stdRatioNoD0: stNo.stdRatio, stdRatioFullD0: stFull.stdRatio,
    verdictFullD0: stFull.verdict, kurtDiffFullD0: stFull.kurtDiff, corrDiffFullD0: stFull.corrDiff, deltaMadFullD0: stFull.deltaMad,
    gates, verdictUnder, correct,
  };
}

// ---------- luật delta0 (D2) ----------
/**
 * Luật G12 — LUẬT CHÍNH từ đợt 77 trở đi. Áp d0 khi và chỉ khi cả ba
 * cùng đúng: plainMad <= 2,5 VÀ d0std_R <= 2,0 VÀ ratio_R <= 1,0.
 * @param {{plainMad:number, d0std:number[], residStd:number[]}} f đặc trưng case (d0std/residStd theo kênh [R,G,B], đã làm tròn như channelStats)
 * @returns {{plainMadOk:boolean, d0stdROk:boolean, ratioROk:boolean, ratioR:number, apply:boolean}}
 */
export function applyDelta0G12(f) {
  const ratioR = f.residStd[0] > 0 ? r2(f.d0std[0] / f.residStd[0]) : 0;
  const plainMadOk = f.plainMad <= D0_PLAIN_MAD_MAX;
  const d0stdROk = f.d0std[0] <= G12_D0STD_R_MAX;
  const ratioROk = ratioR <= G12_RATIO_R_MAX;
  return { plainMadOk, d0stdROk, ratioROk, ratioR, apply: plainMadOk && d0stdROk && ratioROk };
}
/** Cổng G1 (D2): R0 && d0std_R <= 2,0 — chỉ để đối chứng, chưa phân biệt được với G2. */
export function applyDelta0G1(f) {
  const g = applyDelta0G12(f);
  return { ...g, apply: g.plainMadOk && g.d0stdROk };
}
/** Cổng G2 (D2): R0 && ratio_R <= 1,0 — chỉ để đối chứng, chưa phân biệt được với G1. */
export function applyDelta0G2(f) {
  const g = applyDelta0G12(f);
  return { ...g, apply: g.plainMadOk && g.ratioROk };
}
/**
 * Luật cũ R0 (Z2): áp d0 khi plainMad <= 2,5. GIỮ LẠI CHỈ ĐỂ ĐỐI CHỨNG
 * trong các script đo (cho thấy G12 sửa được gì so với R0). KHÔNG dùng
 * R0 làm luật áp d0 trong đo mới — R0 sai 2/20 case D2 (ocean w1440/w1920
 * post-fix, Δkurt R 0,45/0,36).
 */
export function applyDelta0R0(f) {
  return { plainMadOk: f.plainMad <= D0_PLAIN_MAD_MAX, apply: f.plainMad <= D0_PLAIN_MAD_MAX };
}

/**
 * Verdict "đúng" của một case (quy ước D2): KHÔNG-d0 nếu không-d0 đã KHỚP
 * (đơn giản hơn thắng khi cả hai KHỚP); CÓ-d0 nếu chỉ có-d0 KHỚP;
 * "cả-hai-LỆCH" nếu cả hai đều LỆCH (không chấm được luật nào).
 */
export function correctVerdict(stNo, stFull) {
  return stNo.verdict.startsWith("KHỚP") ? "KHÔNG-d0"
    : (stFull.verdict.startsWith("KHỚP") ? "CÓ-d0" : "cả-hai-LỆCH");
}

/**
 * Đánh giá một case: snapshot preview (plain/noise) + frame render 1280x720.
 * Trả về đặc trưng + verdict dưới luật cũ R0 và các cổng G1/G2/G12.
 * @param {{name:string, regime?:string, prevPlain:Buffer, prevNoise:Buffer, plain1280:Buffer, noise1280:Buffer, vw:number, vh:number}} c
 */
export function evalDelta0Case(c) {
  const { name, regime = "", prevPlain, prevNoise, plain1280, noise1280, vw, vh } = c;
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
  const ratio = d0std.map((s, i) => (residStd[i] > 0 ? r2(s / residStd[i]) : 0));
  const maxRatio = Math.max(...ratio);
  const meanRatio = r2(ratio.reduce((a, b) => a + b, 0) / 3);
  const corr = corrPerChannel(d0, resid);
  const maxCorr = Math.max(...corr);
  const stNo = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, null);
  const stFull = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0);
  const feats = { plainMad, d0std, residStd };
  const g12 = applyDelta0G12(feats);
  const g1 = applyDelta0G1(feats);
  const g2 = applyDelta0G2(feats);
  const r0 = applyDelta0R0(feats);
  const gates = {
    R0_cu: r0.apply,
    G1_d0stdR_le_2: g1.apply,
    G2_ratioR_le_1: g2.apply,
    G12_ca_hai: g12.apply,
  };
  const verdictUnder = {
    R0_cu: r0.apply ? stFull.verdict : stNo.verdict,
    G1_d0stdR_le_2: g1.apply ? stFull.verdict : stNo.verdict,
    G2_ratioR_le_1: g2.apply ? stFull.verdict : stNo.verdict,
    G12_ca_hai: g12.apply ? stFull.verdict : stNo.verdict,
  };
  const correct = correctVerdict(stNo, stFull);
  return {
    name, regime, rect: `${vw}x${vh}`,
    plainMad, perChanMad, d0std, residStd, ratio, maxRatio, meanRatio, corr, maxCorr,
    d0stdR: d0std[0], ratioR: ratio[0],
    verdictNoD0: stNo.verdict, kurtDiffNoD0: stNo.kurtDiff, corrDiffNoD0: stNo.corrDiff, deltaMadNoD0: stNo.deltaMad,
    verdictFullD0: stFull.verdict, kurtDiffFullD0: stFull.kurtDiff, corrDiffFullD0: stFull.corrDiff, deltaMadFullD0: stFull.deltaMad,
    gates, verdictUnder, correct,
  };
}

/**
 * Chấm một luật trên danh sách case đã eval: đúng = verdict dưới luật
 * bằng verdict "đúng" (KHỚP khi có thể KHỚP). Case cả-hai-LỆCH không chấm.
 * @param {Array} cases kết quả evalDelta0Case
 * @param {string} ruleName một trong các key của verdictUnder
 */
export function scoreRule(cases, ruleName) {
  let ok = 0, bad = 0, na = 0;
  const badList = [];
  for (const c of cases) {
    const want = c.correct === "KHÔNG-d0" ? c.verdictNoD0
      : (c.correct === "CÓ-d0" ? c.verdictFullD0 : null);
    if (want === null) { na++; continue; }
    const got = c.verdictUnder[ruleName];
    if (got === want) ok++;
    else { bad++; badList.push(`${c.name} (muốn ${want}, được ${got})`); }
  }
  return { rule: ruleName, ok, bad, total: ok + bad, unscored: na, badList };
}
