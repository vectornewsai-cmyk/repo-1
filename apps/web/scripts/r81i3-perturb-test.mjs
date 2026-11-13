#!/usr/bin/env node
/**
 * r81i3-perturb-test.mjs — Phase 9 đợt 81, luồng I3: test khuếch đại qua
 * sharpen bằng nhiễu tổng hợp.
 *
 * Câu hỏi: một lệch base NHỎ ở cạnh (cỡ b_plain đã đo: lệch pha ~0,03px
 * nguồn, spike ±5–11) khi đi qua sharpen + upscale có khuếch đại thành
 * delta MAD ~4 (sharp10, sqw4-640) không? Nếu có thì cơ chế chính là
 * "base-mismatch khuếch đại qua sharpen (+ clip)"; nếu chỉ ra ~1 thì
 * cần thêm cơ chế khác (toán tử upscale của Chrome khác tri).
 *
 * Cách: dịch R_plain đi δ px nguồn (δ = ±0,03 đã đo ở fit A; ±0,10 làm
 * chặn trên) bằng resample tam giác có shift, rồi applySharpen trên bản
 * dịch; đo MAD(d_pert, d_render) ở project size và sau upscale-tri so
 * với dp_prev. So sánh với số quan sát: delta gap tri = 4,04/4,69.
 *
 * Dữ liệu: run D w1920-p640, sqw4-640 + sqw32-640 (H3 sẵn có).
 * Chạy: node apps/web/scripts/r81i3-perturb-test.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { triangleKernel } from "./chrome-resample.mjs";

const require = createRequire(import.meta.url);
const { applySharpen } = require("/tmp/r81i3-effectCanvas.cjs");

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H3 = path.join(GOAL, "round80-h3");
const OUT = path.join(GOAL, "round81-i3", "r81i3-perturb-test.json");

function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const BC = (x) => bcCubic(x, 0.25, 0.375);
function weightsShift(i, s, srcLen, kernel, h, delta) {
  const S = (i + 0.5) / s + delta;
  const j0 = Math.max(0, Math.floor(S - h - 0.5));
  const j1 = Math.min(srcLen - 1, Math.ceil(S + h - 0.5));
  const ws = [];
  let wsum = 0;
  for (let j = j0; j <= j1; j++) {
    const w = kernel((j + 0.5 - S) / h);
    if (w === 0) continue;
    ws.push([j, w]);
    wsum += w;
  }
  if (wsum === 0) return [[Math.min(srcLen - 1, Math.max(0, Math.round(S))), 1]];
  return ws.map(([j, w]) => [j, w / wsum]);
}
function resamplePlaneK(src, srcW, srcH, dstW, dstH, kernel, deltaX = 0, deltaY = 0) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) {
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of weightsShift(i, sx, srcW, kernel, 1, deltaX)) acc += w * src[y * srcW + j];
      tmp[y * dstW + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of weightsShift(i, sy, srcH, kernel, 1, deltaY)) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleRgbU8(rgb, srcW, srcH, dstW, dstH, kernel, dx = 0, dy = 0) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const rs = resamplePlaneK(pl, srcW, srcH, dstW, dstH, kernel, dx, dy);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
function madFloat(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}
function deltaOf(a, b) {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}
function rgb24ToRgba(rgb, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = rgb[i * 3]; out[i * 4 + 1] = rgb[i * 3 + 1]; out[i * 4 + 2] = rgb[i * 3 + 2]; out[i * 4 + 3] = 255;
  }
  return out;
}
function rgbaToRgb24(rgba, w, h) {
  const out = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { out[i * 3] = rgba[i * 4]; out[i * 3 + 1] = rgba[i * 4 + 1]; out[i * 3 + 2] = rgba[i * 4 + 2]; }
  return out;
}

const doc = JSON.parse(fs.readFileSync(path.join(H3, "headed-w1920x1080-p640x360-ph1", "r80h3-snaps-w1920x1080-p640x360.json"), "utf8"));
const projW = doc.projW, projH = doc.projH;
const result = { generated: new Date().toISOString(), contents: {} };

for (const content of ["sqw4-640", "sqw32-640"]) {
  const snaps = doc.snaps[content];
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const rdir = path.join(H3, "render", content);
  const fullRgb = {};
  for (const v of ["plain", "sharp05", "sharp10"]) fullRgb[v] = fs.readFileSync(path.join(rdir, `fullrgb-${v}.raw`));
  const prev = {};
  for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
  console.log(`\n=== ${content} ===`);
  const crep = {};
  const dpPrev = { sharp05: deltaOf(prev.sharp05, prev.plain), sharp10: deltaOf(prev.sharp10, prev.plain) };
  const dRender = { sharp05: deltaOf(fullRgb.sharp05, fullRgb.plain), sharp10: deltaOf(fullRgb.sharp10, fullRgb.plain) };
  // baseline tri(d_render) vs dp_prev (đã có ở mechanism, tính lại để đối chiếu)
  for (const v of ["sharp05", "sharp10"]) {
    const up = new Float64Array(vw * vh * 3);
    for (let c = 0; c < 3; c++) {
      const pl = new Float64Array(projW * projH);
      for (let i = 0; i < projW * projH; i++) pl[i] = dRender[v][i * 3 + c];
      const rs = resamplePlaneK(pl, projW, projH, vw, vh, triangleKernel);
      for (let i = 0; i < vw * vh; i++) up[i * 3 + c] = rs[i];
    }
    crep[`baseline_tri_dRender_${v}`] = madFloat(dpPrev[v], up);
  }
  console.log(`  baseline MAD(tri(d_render), dp_prev): sharp05=${crep.baseline_tri_dRender_sharp05} sharp10=${crep.baseline_tri_dRender_sharp10}`);
  for (const delta of [0.03, -0.03, 0.1]) {
    // dịch base đi delta px nguồn cả 2 trục (lệch pha đẳng hướng)
    const shifted = resampleRgbU8(fullRgb.plain, projW, projH, projW, projH, triangleKernel, delta, delta);
    const row = {};
    for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
      const img = { width: projW, height: projH, data: rgb24ToRgba(shifted, projW, projH) };
      applySharpen(img, intensity);
      const sharpPert = rgbaToRgb24(img.data, projW, projH);
      const dPert = deltaOf(sharpPert, shifted);
      const projMad = madFloat(dPert, dRender[v]);
      // upscale tri(d_pert) so với dp_prev
      const up = new Float64Array(vw * vh * 3);
      for (let c = 0; c < 3; c++) {
        const pl = new Float64Array(projW * projH);
        for (let i = 0; i < projW * projH; i++) pl[i] = dPert[i * 3 + c];
        const rs = resamplePlaneK(pl, projW, projH, vw, vh, triangleKernel);
        for (let i = 0; i < vw * vh; i++) up[i * 3 + c] = rs[i];
      }
      const vpMad = madFloat(dpPrev[v], up);
      // độ lớn nhiễu base ở project size (để đối chiếu tỉ lệ khuếch đại)
      const baseMad = madFloat(deltaOf(shifted, fullRgb.plain), new Float64Array(projW * projH * 3));
      row[v] = { basePerturbMad: baseMad, projectDeltaChange: projMad, viewportMad_vs_dpPrev: vpMad };
      console.log(`  [δ=${delta}] ${v}: base MAD=${baseMad} | project Δ thay đổi=${projMad} | tri(d_pert) vs dp_prev=${vpMad} (baseline ${crep[`baseline_tri_dRender_${v}`]})`);
    }
    crep[`delta_${delta}`] = row;
  }
  result.contents[content] = crep;
}
writeFileEpermRetry(OUT, JSON.stringify(result, null, 2));
console.log(`\nJSON: ${OUT}`);
