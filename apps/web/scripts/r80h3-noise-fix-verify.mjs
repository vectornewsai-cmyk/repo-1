#!/usr/bin/env node
/**
 * r80h3-noise-fix-verify.mjs — Phase 9 đợt 80, luồng H3 (probe b, verify):
 * đo lại noise 640 bằng preview ĐÃ SỬA (addYuvNoise dùng bt601 cho nguồn
 * SD) và so với số G5 TRƯỚC sửa, trên CÙNG 5 nội dung 640 + cùng thang
 * 2,264 (w2560-p640).
 *
 * Đọc: snaps G5 gốc (round79-g5/headed-w2560x1440-p640x360/) + snaps fix
 * (round80-h3/headed-w2560x1440-p640x360-fix/, chạy bằng script headed
 * G5 với R79G5_SCRATCH trỏ sang đây) + frame render G5 (bt601, không đổi).
 * So std ratio [R,G,B] + verdict noise (không-d0 — cổng G12 KHÔNG áp d0
 * ở 640 vì d0std_R > 2,0; xem LIMITS G5 §6) trước/sau cho cả 2 kernel.
 * Ghi: hidden_files/round80-h3/r80h3-noise-fix-verify.json.
 * KHÔNG push/tag/binary. Chạy: node apps/web/scripts/r80h3-noise-fix-verify.mjs
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear, chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G5 = path.join(GOAL, "round79-g5");
const H3 = path.join(GOAL, "round80-h3");
const OUT = path.join(H3, "r80h3-noise-fix-verify.json");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };

function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
function resamplePlaneKernel(src, srcW, srcH, dstW, dstH, scaleX, scaleY, kernel) {
  const tmp = new Float64Array(dstW * srcH);
  const wCacheX = new Array(dstW);
  for (let i = 0; i < dstW; i++) wCacheX[i] = chromeWeights1D(i, scaleX, srcW, kernel);
  for (let y = 0; y < srcH; y++) {
    const sRow = y * srcW, tRow = y * dstW;
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of wCacheX[i]) acc += w * src[sRow + j];
      tmp[tRow + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  const wCacheY = new Array(dstH);
  for (let i = 0; i < dstH; i++) wCacheY[i] = chromeWeights1D(i, scaleY, srcH, kernel);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of wCacheY[i]) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  const sx = dstW / srcW, sy = dstH / srcH;
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const r = resamplePlaneKernel(pl, srcW, srcH, dstW, dstH, sx, sy, kernel);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(r[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
const TRI = (rgb, sw, sh, dw, dh) => resampleRgbKernel(rgb, sw, sh, dw, dh, triangleKernel);
const BC = (rgb, sw, sh, dw, dh) => resampleRgb24Trilinear(rgb, sw, sh, dw, dh);

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
function deltaStats(previewPlain, previewNoise, renderPlain, renderNoise) {
  const n = previewPlain.length / 3;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) { dP[i] = previewNoise[i] - previewPlain[i]; dR[i] = renderNoise[i] - renderPlain[i]; }
  const preview = channelStats(dP), render = channelStats(dR);
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
  const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
  const ok = ratios.every((r) => r >= VERDICT.stdLo && r <= VERDICT.stdHi) && dKurt.every((x) => x <= VERDICT.kurt) && dCorr.every((x) => x <= VERDICT.corr);
  return { previewStd: preview.std, renderStd: render.std, stdRatio: ratios, kurtDiff: dKurt, corrDiff: dCorr, verdict: ok ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ" };
}
const b64 = (b) => Buffer.from(b, "base64");

function main() {
  const before = JSON.parse(fs.readFileSync(path.join(G5, "headed-w2560x1440-p640x360", "r79g5-snaps-w2560x1440-p640x360.json"), "utf8"));
  const after = JSON.parse(fs.readFileSync(path.join(H3, "headed-w2560x1440-p640x360-fix", "r79g5-snaps-w2560x1440-p640x360.json"), "utf8"));
  const contents = ["gradient640", "photo640", "noise640", "textsmall640", "lineart640"];
  const report = { generated: new Date().toISOString(), window: "w2560x1440-p640x360 (scale 2,264)", contents: {} };
  console.log("######## VERIFY FIX NOISE bt601 — w2560-p640 (scale 2,264) ########");
  for (const content of contents) {
    const sb = before.snaps[content], sa = after.snaps[content];
    if (!sb || !sa) { console.log(`  ${content}: thiếu snaps trước/sau — bỏ qua`); continue; }
    const vw = sb.plain.w, vh = sb.plain.h;
    if (sa.plain.w !== vw || sa.plain.h !== vh) throw new Error(`${content}: rect trước/sau khác nhau (${vw}x${vh} vs ${sa.plain.w}x${sa.plain.h})`);
    const rend = {};
    for (const v of ["plain", "noise05", "noise10"]) rend[v] = fs.readFileSync(path.join(G5, "render", content, `fullrgb-${v}.raw`));
    const crep = { rect: { w: vw, h: vh }, methods: {} };
    console.log(`\n== ${content} (rect ${vw}x${vh}) ==`);
    for (const [mName, mFn] of [["trilinear(BC-prod)", BC], ["triangle-old", TRI]]) {
      const rPlain = mFn(rend.plain, 640, 360, vw, vh);
      const ment = {};
      for (const lv of ["noise05", "noise10"]) {
        const rN = mFn(rend[lv], 640, 360, vw, vh);
        const stBefore = deltaStats(b64(sb.plain.rgbB64), b64(sb[lv].rgbB64), rPlain, rN);
        const stAfter = deltaStats(b64(sa.plain.rgbB64), b64(sa[lv].rgbB64), rPlain, rN);
        ment[lv] = { before: stBefore, after: stAfter };
        console.log(`  [${mName}] ${lv}: G ratio ${stBefore.stdRatio[1]} → ${stAfter.stdRatio[1]} | stdRatio ${JSON.stringify(stBefore.stdRatio)} → ${JSON.stringify(stAfter.stdRatio)} | ${stBefore.verdict} → ${stAfter.verdict}`);
      }
      crep.methods[mName] = ment;
    }
    report.contents[content] = crep;
  }
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON verify: ${OUT}`);
}
main();
