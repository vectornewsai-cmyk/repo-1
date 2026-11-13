#!/usr/bin/env node
/**
 * r85m2-noise-scale-analyze.mjs — Phase 9 đợt 85, luồng M2: phân tích
 * dump nhiễu qua 4 đường (explicit/ctm × canvas/video) ở 5 thang.
 *
 * So mỗi đường với mô hình Mitchell trên CÙNG B (canvas: B raw;
 * video: Bv decode 1:1), trên crop giữa 320×180: thống kê delta kiểu
 * F6 (std ratio [0,85, 1,18], |Δkurt| ≤ 0,35, |Δcorr| ≤ 0,12) +
 * MAD tuyệt đối. Trả lời: (a) CTM-canvas có lệch Mitchell theo thang
 * không (nợ L2 §5.2); (b) đường video (triangle+φ) tạo bao nhiêu Δcorr
 * so với Mitchell trên cùng trường nhiễu.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r85m2-noise-scale-analyze.mjs
 * Chỉ đo offline. KHÔNG push/tag/binary/workflow. KHÔNG sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, bcCubicKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M2 = path.join(GOAL, "round85-m2");
const MEDIA = path.join(M2, "media");
const PROBE = path.join(M2, "r85m2-noise-scale.json");
const OUT = path.join(M2, "r85m2-noise-scale-analysis.json");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
const r3 = (v) => +v.toFixed(3);
const mitchell = (x) => bcCubicKernel(x, 1 / 3, 1 / 3);

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
function cropBuf(rgb, w, h, x0, y0, cw, ch) {
  const out = Buffer.alloc(cw * ch * 3);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const si = ((y0 + y) * w + x0 + x) * 3, di = (y * cw + x) * 3;
    out[di] = rgb[si]; out[di + 1] = rgb[si + 1]; out[di + 2] = rgb[si + 2];
  }
  return out;
}
function fieldStats(d, w, h) {
  const n = d.length / 3;
  const out = { std: [], kurt: [], corr: [], lagX: [] };
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) { let s = 0; for (let i = c; i < d.length; i += 3) s += d[i]; mean[c] = s / n; }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) { const v = d[i] - mean[c]; s2 += v * v; s4 += v * v * v * v; }
    const std = Math.sqrt(s2 / n);
    out.std.push(+std.toFixed(2));
    out.kurt.push(std > 0 ? +(s4 / n / (std ** 4) - 3).toFixed(2) : 0);
    let sx = 0, nx = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w - 1; x++) {
      const i0 = (y * w + x) * 3 + c, i1 = i0 + 3;
      sx += (d[i0] - mean[c]) * (d[i1] - mean[c]); nx++;
    }
    out.lagX.push(std > 0 ? +(sx / nx / (std * std)).toFixed(3) : 0);
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(out.std[a] > 0 && out.std[b] > 0 ? +(s / n / (out.std[a] * out.std[b])).toFixed(3) : 0);
  }
  return out;
}
function deltaStats(pathPlain, pathNoise, modPlain, modNoise, w, h) {
  const n = w * h;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  let sumAbs = 0;
  for (let i = 0; i < n * 3; i++) {
    dP[i] = pathNoise[i] - pathPlain[i];
    dR[i] = modNoise[i] - modPlain[i];
    sumAbs += Math.abs(dP[i] - dR[i]);
  }
  const preview = fieldStats(dP, w, h), render = fieldStats(dR, w, h);
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
  const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
  const okStd = ratios.every((r) => r >= VERDICT.stdLo && r <= VERDICT.stdHi);
  const okKurt = dKurt.every((x) => x <= VERDICT.kurt);
  const okCorr = dCorr.every((x) => x <= VERDICT.corr);
  return {
    deltaMad: r3(sumAbs / (n * 3)),
    stdRatio: ratios, kurtDiff: dKurt, corrDiff: dCorr,
    previewCorr: preview.corr, modelCorr: render.corr,
    previewStd: preview.std, modelStd: render.std,
    previewLagX: preview.lagX, modelLagX: render.lagX,
    verdict: okStd && okKurt && okCorr ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ",
    okStd, okKurt, okCorr,
  };
}
function mad3(a, b) {
  const n = a.length / 3;
  let sum = 0;
  for (let p = 0; p < n; p++) for (let c = 0; c < 3; c++) sum += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
  return r3(sum / (n * 3));
}

const probe = JSON.parse(fs.readFileSync(PROBE, "utf8"));
const CW = 320, CH = 180;
const rawB = {};
for (const v of ["plain", "noise05", "noise10"]) rawB[v] = fs.readFileSync(path.join(MEDIA, `fullrgb-${v}.raw`));
const dec = (b64) => Buffer.from(b64, "base64");
const report = { generated: new Date().toISOString(), verdict: VERDICT, bvCheck: {}, paths: {} };

// Bv (decode 1:1) vs raw — sai số vòng yuv420p.
console.log("== Bv (video 1:1) vs raw ==");
for (const v of ["plain", "noise05", "noise10"]) {
  const bv = dec(probe.base[`Bv-${v}`].rgbB64);
  const m = mad3(bv, rawB[v]);
  report.bvCheck[v] = { mad: m, currentTime: probe.base[`Bv-${v}`].currentTime };
  console.log(`  Bv-${v}: MAD vs raw = ${m} (ct=${probe.base[`Bv-${v}`].currentTime})`);
}

const PATHS = ["exp-canvas", "ctm-canvas", "exp-video", "ctm-video"];
const SCALE_KEYS_ALL = [...probe.scales.map(String)];
for (const pathName of PATHS) {
  const isVideo = pathName.includes("video");
  const isCtm = pathName.includes("ctm");
  const SCALE_KEYS = isCtm ? [...SCALE_KEYS_ALL, "2.2639"] : SCALE_KEYS_ALL;
  const entry = {};
  for (const sKey of SCALE_KEYS) {
    const s = sKey === "2.2639" ? 815 / 360 : Number(sKey);
    const dw = sKey === "2.2639" ? 1449 : Math.round(640 * s);
    const dh = sKey === "2.2639" ? 815 : Math.round(360 * s);
    const x0 = Math.floor((dw - CW) / 2), y0 = Math.floor((dh - CH) / 2);
    // Model Mitchell trên cùng B, crop giống hệt.
    const modCrop = {};
    for (const v of ["plain", "noise05", "noise10"]) {
      const base = isVideo ? dec(probe.base[`Bv-${v}`].rgbB64) : rawB[v];
      const full = resampleRgbKernel(base, 640, 360, dw, dh, mitchell);
      modCrop[v] = cropBuf(full, dw, dh, x0, y0, CW, CH);
    }
    const sentry = {};
    for (const v of ["noise05", "noise10"]) {
      const pPlain = dec(probe.dumps[`${pathName}-s${sKey}-plain`].rgbB64);
      const pNoise = dec(probe.dumps[`${pathName}-s${sKey}-${v}`].rgbB64);
      const st = deltaStats(pPlain, pNoise, modCrop.plain, modCrop[v], CW, CH);
      const plainMad = mad3(pPlain, modCrop.plain);
      sentry[v] = { ...st, plainMadVsMitchell: plainMad };
      console.log(`  ${pathName} s=${sKey} ${v}: ${st.verdict} stdRatio=${st.stdRatio} Δkurt=${st.kurtDiff} Δcorr=${st.corrDiff} deltaMad=${st.deltaMad} plainMad=${plainMad}`);
    }
    entry[`s${sKey}`] = sentry;
  }
  report.paths[pathName] = entry;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
