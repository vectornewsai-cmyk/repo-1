#!/usr/bin/env node
/**
 * r84l2-mitchell-residual.mjs — Phase 9 đợt 84, luồng L2: đóng nợ K2 §7 mục 1.
 *
 * Phần dư delta sqw4 (~2,5–2,8 MAD) dưới Mitchell: điều tra base-mismatch
 * (I3 E8) và/hoặc khâu khác trong pipeline preview, đo tách từng khâu.
 *
 * Bối cảnh: K2 Arm A chứng minh toán tử upscale trực tiếp của Chrome là
 * Mitchell (MAD 0,003 trên mẫu sqw4), nhưng delta preview-vs-render trên
 * sqw4 vẫn lệch ~2,76 MAD dưới Mitchell. I3 đã loại: đường effect (E1/E7),
 * gain (E3), sharpen-sau-upscale (E6), lệch pha (fit A/D), blur hậu-kỳ
 * (fit B); perturb test (dịch base ±0,03px theo không gian) loại
 * base-mismatch-khuếch-đại QUA DỊCH KHÔNG GIAN — nhưng CHƯA thử
 * base-mismatch khuếch đại qua GIÁ TRỊ (nhiễu giá trị tần số cao của
 * base đi qua sharpen). Luồng này thử đúng giả thuyết đó.
 *
 * Giả thuyết H_b (cơ chế): với U = Mitchell tuyến tính (bỏ qua kẹp/làm
 * tròn), snap_plain = U(B), snap_sharp = U(S(B)), R = frame render,
 * b = B − R (base-mismatch ở project size), S = sharpen tuyến tính:
 *   r := dp_prev − Mit(d_render) = Mit(S(b) − b)
 *     = Mit(amount·(b − blur_ps(b)))  (bỏ qua clip; sharp05 clip ~0,07%).
 * Mit(b) = p_Mit đã biết (plain residual dưới Mitchell, ở viewport).
 * Mit(blur_ps(b)) ≈ blur_vp(p_Mit) với blur viewport σ ≈ s·1px.
 * → Dự đoán r̂ = amount·(p_Mit − blur_vp(p_Mit)); kiểm bằng hồi quy
 *    (hệ số tương quan, gain khớp tối ưu, phương sai giải thích được).
 *
 * Các phép đo khác, cùng dữ liệu H3 (không capture mới):
 *   R1 — thống kê phần dư r (MAD/RMS/bias/max/le8, theo kênh R/G/B).
 *   R2 — phân tách theo vùng: pixel "delta-active" (|Mit(d_render)|>8)
 *         vs "phẳng"; và trong/ngoài mask clip project-size (R_sharp ở
 *         rail 0/255 — E1: sharp10 clip 49,4%, sharp05 clip 0,07%).
 *   R3 — profile r qua cạnh (như I3 E4, x=100..139, nửa trên, kênh R).
 *   R4 — hồi quy r theo: Mit(d_render) (lỗi gain), p_Mit (base thô),
 *         h1/h2 = high-pass viewport của p_Mit (H_b, σ≈1 / ≈1,41),
 *         và fit 2 biến r ~ a·h2 + b·Mit(d_render).
 *   R5 — tái lập số K2 Arm B (plain/delta Mitchell) làm neo.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r84l2-mitchell-residual.mjs
 * Env: R84L2_OUT (mặc định hidden_files/round84-l2/r84l2-mitchell-residual.json).
 * Chỉ đo offline trên dữ liệu H3 sẵn có. KHÔNG push/tag/binary/workflow.
 * KHÔNG sửa production (script đo).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, bcCubicKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H3 = path.join(GOAL, "round80-h3");
const OUT = process.env.R84L2_OUT || path.join(GOAL, "round84-l2", "r84l2-mitchell-residual.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const MIT = (x) => bcCubicKernel(x, 1 / 3, 1 / 3);
const r3 = (v) => +v.toFixed(3);

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
function resamplePlaneFloat(src, srcW, srcH, dstW, dstH, kernel) {
  return resamplePlaneKernel(src, srcW, srcH, dstW, dstH, kernel);
}
function deltaOf(a, b) { const o = new Float64Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] - b[i]; return o; }
function madFloat(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; }
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
// Blur nhị thức [1,4,6,4,1]/16 tách được, clamp-to-edge, trên 1 plane float.
function binomialBlur(plane, w, h, passes = 1) {
  const K = [1, 4, 6, 4, 1];
  let cur = plane;
  for (let p = 0; p < passes; p++) {
    const tmp = new Float64Array(w * h), out = new Float64Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0;
      for (let dx = -2; dx <= 2; dx++) { const xx = x + dx < 0 ? 0 : x + dx >= w ? w - 1 : x + dx; s += K[dx + 2] * cur[y * w + xx]; }
      tmp[y * w + x] = s / 16;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0;
      for (let dy = -2; dy <= 2; dy++) { const yy = y + dy < 0 ? 0 : y + dy >= h ? h - 1 : y + dy; s += K[dy + 2] * tmp[yy * w + x]; }
      out[y * w + x] = s / 16;
    }
    cur = out;
  }
  return cur;
}
function channelOf(rgb, n, c) { const pl = new Float64Array(n); for (let i = 0; i < n; i++) pl[i] = rgb[i * 3 + c]; return pl; }
function statsFloat(a) {
  let s = 0, s2 = 0, mx = 0, le8 = 0;
  for (let i = 0; i < a.length; i++) { const v = a[i], av = Math.abs(v); s += v; s2 += v * v; if (av > mx) mx = av; if (av <= 8) le8++; }
  const mean = s / a.length;
  return { mad: r3(s2 === 0 ? 0 : a.reduce((t, v) => t + Math.abs(v), 0) / a.length), mean: r3(mean), rms: r3(Math.sqrt(s2 / a.length)), max: r3(mx), le8: +(le8 / a.length).toFixed(4) };
}
// Hồi quy 1 biến y ~ g*x (qua gốc): gain, corr, MAD dư sau fit, var giải thích.
function regress1(y, x) {
  let sxx = 0, sxy = 0, syy = 0, my = 0;
  const n = y.length;
  for (let i = 0; i < n; i++) { my += y[i]; sxx += x[i] * x[i]; sxy += x[i] * y[i]; syy += y[i] * y[i]; }
  my /= n;
  const g = sxx > 0 ? sxy / sxx : 0;
  let sse = 0, sst = 0;
  for (let i = 0; i < n; i++) { const r = y[i] - g * x[i]; sse += r * r; sst += (y[i] - my) * (y[i] - my); }
  const corr = sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
  let madRes = 0;
  for (let i = 0; i < n; i++) madRes += Math.abs(y[i] - g * x[i]);
  return { gain: r3(g), corr: r3(corr), residMad: r3(madRes / n), varExplained: sst > 0 ? r3(1 - sse / sst) : 0 };
}
// Hồi quy 2 biến y ~ a*x1 + b*x2 (qua gốc): giải hệ 2x2.
function regress2(y, x1, x2) {
  let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0, syy = 0, my = 0;
  const n = y.length;
  for (let i = 0; i < n; i++) {
    my += y[i]; a11 += x1[i] * x1[i]; a12 += x1[i] * x2[i]; a22 += x2[i] * x2[i];
    b1 += x1[i] * y[i]; b2 += x2[i] * y[i]; syy += y[i] * y[i];
  }
  my /= n;
  const det = a11 * a22 - a12 * a12;
  const a = det !== 0 ? (b1 * a22 - b2 * a12) / det : 0;
  const b = det !== 0 ? (a11 * b2 - a12 * b1) / det : 0;
  let sse = 0, sst = 0, madRes = 0;
  for (let i = 0; i < n; i++) { const r = y[i] - a * x1[i] - b * x2[i]; sse += r * r; sst += (y[i] - my) * (y[i] - my); madRes += Math.abs(r); }
  return { a: r3(a), b: r3(b), residMad: r3(madRes / n), varExplained: sst > 0 ? r3(1 - sse / sst) : 0 };
}
function xProfileDelta(arr, w, h, y0, y1, x0, x1) {
  const prof = [];
  for (let x = x0; x < x1; x++) {
    let s = 0, n = 0;
    for (let y = y0; y < y1; y++) { s += arr[(y * w + x) * 3]; n++; }
    prof.push(+((s / n).toFixed(1)));
  }
  return prof;
}

const RUNS = [
  { snapFile: "headed-w1920x1080-p640x360-ph1/r80h3-snaps-w1920x1080-p640x360.json", contents: ["sqw4-640", "sqw8-640"] },
  { snapFile: "headed-w2560x1440-p1280x720-ph1/r80h3-snaps-w2560x1440-p1280x720.json", contents: ["sqw4", "sqw8"] },
];
const report = { generated: new Date().toISOString(), method: "Mitchell (1/3,1/3), delta float không làm tròn, model uint8 như K2", runs: {} };

for (const run of RUNS) {
  const doc = JSON.parse(fs.readFileSync(path.join(H3, run.snapFile), "utf8"));
  const projW = doc.projW, projH = doc.projH;
  const runKey = `${doc.window}-p${projW}x${projH}`;
  console.log(`\n######## RUN ${runKey} ########`);
  report.runs[runKey] = { snapFile: run.snapFile, projW, projH, contents: {} };
  for (const content of run.contents) {
    const snaps = doc.snaps[content];
    const rect = snaps.plain.rect;
    const vw = snaps.plain.w, vh = snaps.plain.h;
    const s = rect.scale;
    const rdir = path.join(H3, "render", content);
    const fullRgb = {};
    for (const v of ["plain", "sharp05", "sharp10"]) fullRgb[v] = fs.readFileSync(path.join(rdir, `fullrgb-${v}.raw`));
    const prev = {};
    for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
    const n = vw * vh;
    // Model uint8 (như K2) + plain residual p_Mit (float).
    const rend = {};
    for (const v of ["plain", "sharp05", "sharp10"]) rend[v] = resampleRgbKernel(fullRgb[v], projW, projH, vw, vh, MIT);
    const plainMit = mad3(prev.plain, rend.plain);
    const d05k2 = (() => { const dp = deltaOf(prev.sharp05, prev.plain), dr = deltaOf(rend.sharp05, rend.plain); let t = 0; for (let i = 0; i < dp.length; i++) t += Math.abs(dp[i] - dr[i]); return r3(t / dp.length); })();
    const d10k2 = (() => { const dp = deltaOf(prev.sharp10, prev.plain), dr = deltaOf(rend.sharp10, rend.plain); let t = 0; for (let i = 0; i < dp.length; i++) t += Math.abs(dp[i] - dr[i]); return r3(t / dp.length); })();
    console.log(`  ${content} (s=${s.toFixed(4)}): NEO K2 plain=${plainMit.mad} d05=${d05k2} d10=${d10k2}`);
    const ent = { scale: s, neoK2: { plainMad: plainMit.mad, plainLe8: plainMit.le8, delta05: d05k2, delta10: d10k2 }, variants: {} };
    // p_Mit float (kênh R): snap_plain - Mit(R_plain) float (không làm tròn).
    const pMitR = new Float64Array(n);
    {
      const pl = channelOf(fullRgb.plain, projW * projH, 0);
      const mit = resamplePlaneFloat(pl, projW, projH, vw, vh, MIT);
      for (let i = 0; i < n; i++) pMitR[i] = prev.plain[i * 3] - mit[i];
    }
    const pMitStats = statsFloat(pMitR);
    // High-pass viewport của p_Mit: h1 (σ≈1), h2 (σ≈1,41 ≈ s·1).
    const h1 = new Float64Array(n), h2 = new Float64Array(n);
    {
      const b1 = binomialBlur(pMitR, vw, vh, 1);
      const b2 = binomialBlur(pMitR, vw, vh, 2);
      for (let i = 0; i < n; i++) { h1[i] = pMitR[i] - b1[i]; h2[i] = pMitR[i] - b2[i]; }
    }
    for (const [vLabel, v, amount] of [["sharp05", "sharp05", 0.5], ["sharp10", "sharp10", 1.0]]) {
      const dp = deltaOf(prev[v], prev.plain); // float, uint8 diff
      const dr = deltaOf(rend[v], rend.plain);
      const r = new Float64Array(dp.length);
      for (let i = 0; i < dp.length; i++) r[i] = dp[i] - dr[i];
      const rR = new Float64Array(n);
      for (let i = 0; i < n; i++) rR[i] = r[i * 3];
      const st = statsFloat(rR);
      // Per-channel MAD của r.
      const chMad = [0, 1, 2].map((c) => {
        let t = 0; for (let i = 0; i < n; i++) t += Math.abs(r[i * 3 + c]); return r3(t / n);
      });
      // Phân tách theo |dr| (delta-active >8 vs phẳng) + theo mask clip.
      const drR = new Float64Array(n);
      for (let i = 0; i < n; i++) drR[i] = dr[i * 3];
      let actSum = 0, actN = 0, flatSum = 0, flatN = 0;
      for (let i = 0; i < n; i++) {
        if (Math.abs(drR[i]) > 8) { actSum += Math.abs(rR[i]); actN++; }
        else { flatSum += Math.abs(rR[i]); flatN++; }
      }
      // Mask clip project-size: R_sharp ở rail 0/255 (kênh R) → upscale nearest theo lưới.
      const clipPs = new Uint8Array(projW * projH);
      let clipFracPs = 0;
      for (let i = 0; i < projW * projH; i++) {
        const v0 = fullRgb[v][i * 3];
        if (v0 === 0 || v0 === 255) { clipPs[i] = 1; clipFracPs++; }
      }
      clipFracPs /= projW * projH;
      let clipSum = 0, clipN = 0, noclipSum = 0, noclipN = 0;
      for (let y = 0; y < vh; y++) {
        const sy = Math.min(projH - 1, Math.floor((y + 0.5) / s));
        for (let x = 0; x < vw; x++) {
          const sx = Math.min(projW - 1, Math.floor((x + 0.5) / s));
          const i = y * vw + x;
          if (clipPs[sy * projW + sx]) { clipSum += Math.abs(rR[i]); clipN++; }
          else { noclipSum += Math.abs(rR[i]); noclipN++; }
        }
      }
      // Hồi quy (kênh R).
      const regDr = regress1(rR, drR);
      const regP = regress1(rR, pMitR);
      const regH1 = regress1(rR, h1);
      const regH2 = regress1(rR, h2);
      const reg2 = regress2(rR, h2, drR);
      // Dự đoán H_b với gain = amount (không fit): r̂ = amount·h2.
      let madPred = 0;
      for (let i = 0; i < n; i++) madPred += Math.abs(rR[i] - amount * h2[i]);
      madPred /= n;
      const profR = xProfileDelta(r, vw, vh, 0, Math.floor(vh / 2), 100, 140);
      const profDp = xProfileDelta(dp, vw, vh, 0, Math.floor(vh / 2), 100, 140);
      const profDr = xProfileDelta(dr, vw, vh, 0, Math.floor(vh / 2), 100, 140);
      ent.variants[vLabel] = {
        amount,
        resid: { madR: st.mad, meanR: st.mean, rmsR: st.rms, maxR: st.max, le8R: st.le8, chMad },
        splitByDeltaActive: { activeFrac: r3(actN / n), activeMad: r3(actN ? actSum / actN : 0), flatMad: r3(flatN ? flatSum / flatN : 0) },
        splitByClip: { clipFracPs: r3(clipFracPs), clipFracVp: r3(clipN / n), clipMad: r3(clipN ? clipSum / clipN : 0), noclipMad: r3(noclipN ? noclipSum / noclipN : 0) },
        plainBaseMismatch: { pMitMadR: pMitStats.mad, pMitRmsR: pMitStats.rms, pMitMeanR: pMitStats.mean },
        regress: {
          vsModelDelta: regDr,
          vsBasePlain: regP,
          vsHighpass1: regH1,
          vsHighpass2: regH2,
          vsHighpass2PlusDelta: reg2,
          predHbGainEqAmount: { madAfterPred: r3(madPred), amount },
        },
        profileR_x100_139: profR,
        profileDp_x100_139: profDp,
        profileDr_x100_139: profDr,
      };
      console.log(`    ${vLabel}: r MAD_R=${st.mad} RMS=${st.rms} mean=${st.mean} chMad=[${chMad.join(", ")}]`);
      console.log(`      active(|dr|>8, frac=${r3(actN / n)}): MAD=${r3(actN ? actSum / actN : 0)} | phẳng: MAD=${r3(flatN ? flatSum / flatN : 0)}`);
      console.log(`      clip: fracPs=${r3(clipFracPs)} clipMad=${r3(clipN ? clipSum / clipN : 0)} noclipMad=${r3(noclipN ? noclipSum / noclipN : 0)}`);
      console.log(`      reg vsModelDelta g=${regDr.gain} corr=${regDr.corr} residMad=${regDr.residMad} varExp=${regDr.varExplained}`);
      console.log(`      reg vsBasePlain g=${regP.gain} corr=${regP.corr} residMad=${regP.residMad} varExp=${regP.varExplained}`);
      console.log(`      reg vsHighpass1 g=${regH1.gain} corr=${regH1.corr} residMad=${regH1.residMad} varExp=${regH1.varExplained}`);
      console.log(`      reg vsHighpass2 g=${regH2.gain} corr=${regH2.corr} residMad=${regH2.residMad} varExp=${regH2.varExplained}`);
      console.log(`      reg2 h2+delta: a=${reg2.a} b=${reg2.b} residMad=${reg2.residMad} varExp=${reg2.varExplained}`);
      console.log(`      H_b gain=amount(${amount}): MAD sau trừ dự đoán=${r3(madPred)} (gốc ${st.mad})`);
    }
    report.runs[runKey].contents[content] = ent;
  }
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
