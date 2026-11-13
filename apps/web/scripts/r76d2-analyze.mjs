#!/usr/bin/env node
/**
 * r76d2-analyze.mjs — Phase 9 đợt 76, luồng D2: hiệu chỉnh luật delta0.
 *
 * Nợ: đợt 75 §4 mục 2 / C1 §4+§7.1 — sau khi C1 sửa rò plain, ocean
 * w1440 plainAbsMad 1,149 (≤ 2,5) nên luật cũ áp d0, nhưng d0 std R
 * 3,94 gấp ~4 lần phần dư plain thực (0,94) → Δkurt R vọt 0,45 trong
 * khi không-d0 KHỚP toàn bộ. Luật cũ (Z2, nhị phân theo plainAbsMad)
 * không còn phân biệt được "plain lệch do chroma shift" với "plain đã
 * gần, d0 thành nhiễu chính".
 *
 * Script này ĐO (không sửa production — luật delta0 không nằm trong
 * preview.tsx mà là quyết định áp mô hình d0 trong harness phân tích):
 * với mỗi case (snapshot headed + frame render method-T), tính
 * plainMad, d0std từng kênh, phần dư plain thực (residStd), tỉ lệ
 * d0std/residStd, corr(d0, phần dư) từng kênh, rồi verdict không-d0 /
 * có-d0 / dưới từng ứng viên luật mới.
 *
 * Ứng viên luật (áp d0 khi...):
 *   R0 cũ:        plainMad <= 2,5
 *   R1 magMax1:   R0 && max_c(d0std_c/residStd_c) <= 1,0
 *   R2 magMean1:  R0 && mean_c(d0std_c/residStd_c) <= 1,0
 *   R3 corrMax:   R0 && max_c corr(d0_c, resid_c) >= 0,5
 *   R4 mag+corr:  R0 && maxRatio <= 1,0 && maxCorr >= 0,3
 *   R5 magMax1.5: R0 && maxRatio <= 1,5
 *   R6 perChan:   R0, áp d0 theo từng kênh chỉ khi ratio_c <= 1,0
 *   R7 gradedChan: R0, scale d0 từng kênh theo min(1, residStd_c/d0std_c)
 *
 * Helpers delta0/channelStats/fullDeltaStats/absMad sao chép VERBATIM
 * từ r75c1-analyze.mjs (nguồn r73a3-d0cond.mjs); resample từ
 * chrome-resample.mjs. Ngưỡng verdict như Z2/A3/B1/C1.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r76d2-analyze.mjs
 * Env: R76D2_OUT (mặc định hidden_files/round76-d2/r76d2-diag.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const B1 = path.join(GOAL, "round74-b1");
const C1 = path.join(GOAL, "round75-c1");
const D2 = path.join(GOAL, "round76-d2");
const OUT = process.env.R76D2_OUT || path.join(D2, "r76d2-diag.json");
fs.mkdirSync(D2, { recursive: true });

const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
const D0_THRESHOLD = 2.5;

// ---------- sao chép verbatim r75c1-analyze.mjs ----------
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
    n, deltaMad: +(sumAbs / (n * 3)).toFixed(3),
    previewStd: preview.std, renderStd: render.std, stdRatio: ratios,
    previewKurt: preview.kurt, renderKurt: render.kurt, kurtDiff: dKurt,
    previewCorr: preview.corr, renderCorr: render.corr, corrDiff: dCorr,
    verdict: okStd && okKurt && okCorr ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ",
    okStd, okKurt, okCorr,
  };
}
function absMad(a, b) {
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
// ---------- helpers mới D2 ----------
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }
function absMadPerChannel(a, b) {
  const n = a.length / 3, out = [];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let p = 0; p < n; p++) s += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
    out.push(+(s / n).toFixed(3));
  }
  return out;
}
/** Pearson corr từng kênh giữa hai mảng dài n*3 (d0 vs phần dư plain). */
function corrPerChannel(a, b) {
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
const r3 = (v) => +v.toFixed(3);
const r2 = (v) => +v.toFixed(2);

/**
 * Đánh giá một case: snapshot preview (plain/noise) + frame render 1280x720.
 * Trả về đặc trưng + verdict dưới luật cũ và từng ứng viên luật mới.
 */
function evalCase(name, regime, prevPlain, prevNoise, plain1280, noise1280, vw, vh) {
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
  const ratio = d0std.map((s, c) => (residStd[c] > 0 ? r2(s / residStd[c]) : 0));
  const maxRatio = Math.max(...ratio);
  const meanRatio = r2(ratio.reduce((a, b) => a + b, 0) / 3);
  const corr = corrPerChannel(d0, resid);
  const maxCorr = Math.max(...corr);
  const stNo = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, null);
  const stFull = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0);
  // R6: d0 theo kênh (chỉ kênh ratio<=1). R7: scale d0 theo kênh min(1, residStd/d0std).
  const d0pc = new Float64Array(d0.length);
  const d0g = new Float64Array(d0.length);
  for (let i = 0; i < d0.length; i++) {
    const c = i % 3;
    d0pc[i] = ratio[c] <= 1.0 ? d0[i] : 0;
    d0g[i] = d0[i] * Math.min(1, d0std[c] > 0 ? residStd[c] / d0std[c] : 0);
  }
  const stR6 = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0pc);
  const stR7 = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0g);
  const base = plainMad <= D0_THRESHOLD;
  const rules = {
    R0_cu_plainMad_le_2_5: base,
    R1_magMax_le_1: base && maxRatio <= 1.0,
    R2_magMean_le_1: base && meanRatio <= 1.0,
    R3_corrMax_ge_0_5: base && maxCorr >= 0.5,
    R4_magMax1_corr_ge_0_3: base && maxRatio <= 1.0 && maxCorr >= 0.3,
    R5_magMax_le_1_5: base && maxRatio <= 1.5,
  };
  const verdictUnder = {};
  for (const [k, apply] of Object.entries(rules)) verdictUnder[k] = apply ? stFull.verdict : stNo.verdict;
  verdictUnder.R6_perChan_ratio_le_1 = base ? stR6.verdict : stNo.verdict;
  verdictUnder.R7_gradedChan = base ? stR7.verdict : stNo.verdict;
  // verdict "đúng" = verdict tốt hơn trong hai chế độ (KHỚP thắng LỆCH; nếu cả hai KHỚP thì không-d0 thắng vì đơn giản hơn).
  const correct = stNo.verdict.startsWith("KHỚP") ? "KHÔNG-d0" : (stFull.verdict.startsWith("KHỚP") ? "CÓ-d0" : "cả-hai-LỆCH");
  return {
    name, regime, rect: `${vw}x${vh}`,
    plainMad, perChanMad, d0std, residStd, ratio, maxRatio, meanRatio, corr, maxCorr,
    verdictNoD0: stNo.verdict, kurtDiffNoD0: stNo.kurtDiff, corrDiffNoD0: stNo.corrDiff,
    verdictFullD0: stFull.verdict, kurtDiffFullD0: stFull.kurtDiff, corrDiffFullD0: stFull.corrDiff,
    verdictR6: stR6.verdict, kurtDiffR6: stR6.kurtDiff,
    verdictR7: stR7.verdict, kurtDiffR7: stR7.kurtDiff,
    rules, verdictUnder, correct,
  };
}

function loadSnaps(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

async function main() {
  const cases = [];
  const addOcean = (name, regime, snapDoc, vw, vh) => {
    const v = snapDoc.snaps?.ocean;
    if (!v?.plain || !v?.noise05) { console.log(`  bỏ ${name}: thiếu ocean plain/noise05`); return; }
    const plain1280 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
    const noise1280 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw"));
    cases.push(evalCase(name, regime, b64ToRgb(v.plain.rgbB64), b64ToRgb(v.noise05.rgbB64), plain1280, noise1280, v.plain.w, v.plain.h));
  };
  // 1) Y2 w1440 + w1920: 4 nguồn x noise05 (+noise10 ocean/test-pattern).
  //    test-pattern media 1280x720 -> C1 fix KHÔNG đổi -> số pre-fix vẫn đúng sau sửa.
  //    ocean/basgo/slovenska media 1920 -> pre-fix, chỉ tham chiếu.
  const Y2SRC = {
    "test-pattern": { renderDir: R66T3, prefix: "" },
    ocean: { renderDir: RENDER_NEW, prefix: "ocean-" },
    basgo: { renderDir: RENDER_NEW, prefix: "basgo-" },
    slovenska: { renderDir: RENDER_NEW, prefix: "slovenska-" },
  };
  for (const w of ["w1440", "w1920"]) {
    const doc = loadSnaps(path.join(Y2, `headed-${w}`, `r71y2-snaps-${w}.json`));
    for (const [src, cfg] of Object.entries(Y2SRC)) {
      for (const lv of ["noise05", "noise10"]) {
        const v = doc.snaps?.[src];
        if (!v?.plain || !v?.[lv]) continue;
        if (src !== "test-pattern" && src !== "ocean" && lv === "noise10") continue;
        const plain1280 = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}plain.raw`));
        const noise1280 = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}${lv}.raw`));
        const regime = src === "test-pattern" ? "post-fix-valid (media 1280)" : "pre-fix (media 1920)";
        cases.push(evalCase(`Y2-${w}-${src}-${lv}`, regime, b64ToRgb(v.plain.rgbB64), b64ToRgb(v[lv].rgbB64), plain1280, noise1280, v.plain.w, v.plain.h));
      }
    }
  }
  // 2) B1 ocean sweep pre-fix (mọi cửa sổ đã capture).
  const headedDirs = fs.readdirSync(B1).filter((d) => d.startsWith("headed-")).sort();
  for (const dir of headedDirs) {
    const files = fs.readdirSync(path.join(B1, dir)).filter((f) => f.startsWith("r74b1-snaps-"));
    for (const f of files) {
      const doc = loadSnaps(path.join(B1, dir, f));
      addOcean(`B1-${doc.window}-ocean-n05`, "pre-fix (media 1920)", doc);
    }
  }
  // 3) C1 post-fix ocean w1440 (case đích).
  const c1doc = loadSnaps(path.join(C1, "headed-w1440x900", "r74b1-snaps-w1440x900.json"));
  addOcean("C1-post-fix-w1440-ocean-n05", "POST-FIX (C1)", c1doc);

  // In bảng tóm tắt.
  console.log("case | plainMad | d0std[R,G,B] | residStd[R,G,B] | ratio | corr(d0,resid) | noD0 -> fullD0");
  for (const c of cases) {
    console.log(`${c.name} [${c.regime}] rect=${c.rect} plainMad=${c.plainMad} d0std=${JSON.stringify(c.d0std)} residStd=${JSON.stringify(c.residStd)} ratio=${JSON.stringify(c.ratio)} maxR=${c.maxRatio} meanR=${c.meanRatio} corr=${JSON.stringify(c.corr)} maxC=${c.maxCorr}`);
    console.log(`    noD0: ${c.verdictNoD0} dKurt=${JSON.stringify(c.kurtDiffNoD0)} | fullD0: ${c.verdictFullD0} dKurt=${JSON.stringify(c.kurtDiffFullD0)} | đúng=${c.correct} | R0=${c.rules.R0_cu_plainMad_le_2_5} R1=${c.rules.R1_magMax_le_1} R2=${c.rules.R2_magMean_le_1} R3=${c.rules.R3_corrMax_ge_0_5} R4=${c.rules.R4_magMax1_corr_ge_0_3} R5=${c.rules.R5_magMax_le_1_5} | R6=${c.verdictR6} R7=${c.verdictR7}`);
  }
  // Chấm từng luật: đúng = verdict dưới luật == verdict "đúng" (KHỚP khi có thể KHỚP; giữ nguyên LỆCH khi cả hai LỆCH).
  const ruleNames = ["R0_cu_plainMad_le_2_5", "R1_magMax_le_1", "R2_magMean_le_1", "R3_corrMax_ge_0_5", "R4_magMax1_corr_ge_0_3", "R5_magMax_le_1_5", "R6_perChan_ratio_le_1", "R7_gradedChan"];
  console.log("\n--- chấm luật (chỉ tính các case post-fix-valid + POST-FIX + pre-fix ocean KHỚP được) ---");
  for (const rn of ruleNames) {
    let ok = 0, bad = 0, na = 0; const badList = [];
    for (const c of cases) {
      const want = c.correct === "KHÔNG-d0" ? c.verdictNoD0 : (c.correct === "CÓ-d0" ? c.verdictFullD0 : null);
      if (want === null) { na++; continue; }
      const got = c.verdictUnder[rn];
      if (got === want) ok++; else { bad++; badList.push(`${c.name} (muốn ${want}, được ${got})`); }
    }
    console.log(`${rn}: đúng ${ok}/${ok + bad} (không chấm ${na} case cả-hai-LỆCH)${badList.length ? " | SAI: " + badList.join("; ") : ""}`);
  }
  const report = { generated: new Date().toISOString(), d0ThresholdOld: D0_THRESHOLD, verdict: VERDICT, cases, ruleNames };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON chẩn đoán: ${OUT} (${cases.length} case)`);
}
main().catch((e) => { console.error(`D2 LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
