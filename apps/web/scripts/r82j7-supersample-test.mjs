#!/usr/bin/env node
/**
 * r82j7-supersample-test.mjs — Phase 9 đợt 82, luồng J7: test E10
 * (supersampling đường mảnh trước khi sharpen — hướng sửa ví dụ).
 *
 * Bối cảnh: sharpen-trước-upscale cho delta ≈ 0 (E1/E5), sharpen-sau-
 * upscale overshoot 2,5–3,9× (E7a) — delta thật của Chrome nằm GIỮA hai
 * mô hình. Supersampling là điểm giữa tự nhiên: sharpen ở 2× project-size
 * (đường 1px thành 2px, có giá trị trung gian để sharpen bám vào), rồi
 * downscale về project-size và upscale lên viewport như thường.
 *   dp_model = mitchell_upscale(mitchell_downscale2x(sharpen(mitchell_upscale2x(R_plain)) − mitchell_upscale2x(R_plain))).
 * Dùng kernel Mitchell cho mọi bước resample (J2 đợt 82: kernel drawImage
 * thật của Chrome). So với baseline Mitchell(d_render) (cùng kernel).
 * Nếu MAD giảm rõ (vd < 50% baseline hoặc < 2) thì supersampling là hướng
 * sửa CÓ bằng chứng (cần đợt riêng áp vào production + đo perf: sharpen
 * 2× tốn 4× pixel). Nếu không giảm thì hướng này cũng bị loại — ghi rõ.
 *
 * Chạy: node apps/web/scripts/r82j7-supersample-test.mjs
 * Env: R82J7_OUT (mặc định hidden_files/round82-j7/r82j7-supersample.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { chromeWeights1D } from "./chrome-resample.mjs";

const require = createRequire(import.meta.url);
const { applySharpen } = require("/tmp/r82j7-effectCanvas.cjs");

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G5 = path.join(GOAL, "round79-g5");
const H3 = path.join(GOAL, "round80-h3");
const J7 = path.join(GOAL, "round82-j7");
const OUT = process.env.R82J7_OUT || path.join(J7, "r82j7-supersample.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const mitchell = (x) => bcCubic(x, 1 / 3, 1 / 3);
function resamplePlane(src, srcW, srcH, dstW, dstH, kernel) {
  const tmp = new Float64Array(dstW * srcH);
  const wCacheX = new Array(dstW);
  for (let i = 0; i < dstW; i++) wCacheX[i] = chromeWeights1D(i, dstW / srcW, srcW, kernel);
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
  for (let i = 0; i < dstH; i++) wCacheY[i] = chromeWeights1D(i, dstH / srcH, srcH, kernel);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of wCacheY[i]) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleRgb(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const rs = resamplePlane(pl, srcW, srcH, dstW, dstH, kernel);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
function deltaOf(a, b) {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}
function deltaMadFloat(dp, dr) {
  let sum = 0;
  for (let i = 0; i < dp.length; i++) sum += Math.abs(dp[i] - dr[i]);
  return +(sum / dp.length).toFixed(3);
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

const DATASETS = [
  { key: "L1px-1280@1.132", snaps: path.join(G5, "headed-w2560x1440-p1280x720", "r79g5-snaps-w2560x1440-p1280x720.json"), content: "lineart", render: path.join(G5, "render", "lineart"), projW: 1280, projH: 720 },
  { key: "L2px-640@1.264", snaps: path.join(H3, "headed-w1920x1080-p640x360-ph1", "r80h3-snaps-w1920x1080-p640x360.json"), content: "lineart2px-640", render: path.join(H3, "render", "lineart2px-640"), projW: 640, projH: 360 },
  { key: "L3px-640@1.264", snaps: path.join(J7, "headed-w1920x1080-p640x360-ph1", "r82j7-snaps-w1920x1080-p640x360.json"), content: "lineart3px-640", render: path.join(J7, "render", "lineart3px-640"), projW: 640, projH: 360 },
  { key: "L4px-640@1.264", snaps: path.join(J7, "headed-w1920x1080-p640x360-ph1", "r82j7-snaps-w1920x1080-p640x360.json"), content: "lineart4px-640", render: path.join(J7, "render", "lineart4px-640"), projW: 640, projH: 360 },
];

const report = { generated: new Date().toISOString(), datasets: {} };
for (const ds of DATASETS) {
  const doc = JSON.parse(fs.readFileSync(ds.snaps, "utf8"));
  const snaps = doc.snaps[ds.content];
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const projW = ds.projW, projH = ds.projH;
  console.log(`\n######## ${ds.key}: ${vw}x${vh} ########`);
  const fullRgb = {};
  for (const v of ["plain", "sharp05", "sharp10"]) fullRgb[v] = fs.readFileSync(path.join(ds.render, `fullrgb-${v}.raw`));
  const prev = {};
  for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
  // upscale 2x R_plain (Mitchell) — làm 1 lần, dùng chung 2 intensity
  const up2 = resampleRgb(fullRgb.plain, projW, projH, projW * 2, projH * 2, mitchell);
  const rep = {};
  for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
    const dpPrev = deltaOf(prev[v], prev.plain);
    // baseline: Mitchell(d_render)
    const dRender = deltaOf(fullRgb[v], fullRgb.plain);
    const upBase = new Float64Array(vw * vh * 3);
    for (let c = 0; c < 3; c++) {
      const pl = new Float64Array(projW * projH);
      for (let i = 0; i < projW * projH; i++) pl[i] = dRender[i * 3 + c];
      const rs = resamplePlane(pl, projW, projH, vw, vh, mitchell);
      for (let i = 0; i < vw * vh; i++) upBase[i * 3 + c] = rs[i];
    }
    const madBase = deltaMadFloat(dpPrev, upBase);
    // supersample 2x: sharpen trên up2, delta về project-size, rồi lên viewport
    const img = { width: projW * 2, height: projH * 2, data: rgb24ToRgba(up2, projW * 2, projH * 2) };
    applySharpen(img, intensity);
    const sharp2 = rgbaToRgb24(img.data, projW * 2, projH * 2);
    const d2 = deltaOf(sharp2, up2);
    // downscale delta 2x về project-size (Mitchell, float — giữ dấu)
    const dProj = new Float64Array(projW * projH * 3);
    for (let c = 0; c < 3; c++) {
      const pl = new Float64Array(projW * 2 * projH * 2);
      for (let i = 0; i < projW * 2 * projH * 2; i++) pl[i] = d2[i * 3 + c];
      const rs = resamplePlane(pl, projW * 2, projH * 2, projW, projH, mitchell);
      for (let i = 0; i < projW * projH; i++) dProj[i * 3 + c] = rs[i];
    }
    // upscale lên viewport (Mitchell)
    const upSs = new Float64Array(vw * vh * 3);
    for (let c = 0; c < 3; c++) {
      const pl = new Float64Array(projW * projH);
      for (let i = 0; i < projW * projH; i++) pl[i] = dProj[i * 3 + c];
      const rs = resamplePlane(pl, projW, projH, vw, vh, mitchell);
      for (let i = 0; i < vw * vh; i++) upSs[i * 3 + c] = rs[i];
    }
    const madSs = deltaMadFloat(dpPrev, upSs);
    rep[v] = { mad_baseline_mitchell: madBase, mad_supersample2x: madSs, ratio: +(madSs / madBase).toFixed(3) };
    console.log(`  [E10 ${v}] baseline Mitchell MAD=${madBase} | supersample 2x MAD=${madSs} (tỉ lệ ${rep[v].ratio})`);
  }
  report.datasets[ds.key] = rep;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nJSON: ${OUT}`);
