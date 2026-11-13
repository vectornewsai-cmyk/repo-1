#!/usr/bin/env node
/**
 * r81i3-base-amp-test.mjs — Phase 9 đợt 81, luồng I3: kiểm tra giả thuyết
 * "base-mismatch khuếch đại qua sharpen".
 *
 * Cơ chế ứng viên: base Chrome khác base render một lượng b (plain MAD
 * ~1, tập trung ở cạnh). Khi sharpen, b bị khuếch đại ~amount× qua
 * (Y − blur(Y)) rồi upscale → delta lệch MAD ~4. BC bù được một phần
 * vì đáp ứng HF của nó cao hơn tri (xem fit C).
 *
 * Test: khôi phục base của Chrome bằng cách downscale snapshot plain về
 * project size (tri), rồi chạy applySharpen TRÊN BASE ĐÓ (như trình
 * duyệt làm) thay vì trên base render. Nếu tri(d_browser_est) khớp
 * dp_prev tốt hơn hẳn tri(d_render) thì giả thuyết được ủng hộ; nếu
 * không đổi thì lệch nằm ở toán tử upscale của Chrome, không phải ở base.
 *
 * Dữ liệu: run D w1920-p640, sqw4-640 + sqw32-640 (H3 sẵn có).
 * Chạy: node apps/web/scripts/r81i3-base-amp-test.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const require = createRequire(import.meta.url);
const { applySharpen } = require("/tmp/r81i3-effectCanvas.cjs");

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H3 = path.join(GOAL, "round80-h3");
const OUT = path.join(GOAL, "round81-i3", "r81i3-base-amp-test2.json");

function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const BC = (x) => bcCubic(x, 0.25, 0.375);
function resamplePlaneK(src, srcW, srcH, dstW, dstH, kernel) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) {
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, sx, srcW, kernel)) acc += w * src[y * srcW + j];
      tmp[y * dstW + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, sy, srcH, kernel)) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
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
function resamplePlaneShift(src, srcW, srcH, dstW, dstH, kernel, delta) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) {
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of weightsShift(i, sx, srcW, kernel, 1, delta)) acc += w * src[y * srcW + j];
      tmp[y * dstW + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of weightsShift(i, sy, srcH, kernel, 1, delta)) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleRgbU8Shift(rgb, srcW, srcH, dstW, dstH, kernel, delta) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const rs = resamplePlaneShift(pl, srcW, srcH, dstW, dstH, kernel, delta);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
function resampleRgbU8(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const rs = resamplePlaneK(pl, srcW, srcH, dstW, dstH, kernel);
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
function madU8(a, b) {
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
  for (let i = 0; i < w * h; i++) { out[i * 3] = rgba[i * 4]; out[i * 3 + 1] = rgba[i * 4 + 1]; out[i * 4 + 2] = rgba[i * 4 + 2]; }
  return out;
}

const doc = JSON.parse(fs.readFileSync(path.join(H3, "headed-w1920x1080-p640x360-ph1", "r80h3-snaps-w1920x1080-p640x360.json"), "utf8"));
const projW = doc.projW, projH = doc.projH;
const result = { generated: new Date().toISOString(), contents: {} };

for (const content of ["sqw32-640"]) {
  const snaps = doc.snaps[content];
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const rdir = path.join(H3, "render", content);
  const fullRgb = {};
  for (const v of ["plain", "sharp05", "sharp10"]) fullRgb[v] = fs.readFileSync(path.join(rdir, `fullrgb-${v}.raw`));
  const prev = {};
  for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
  console.log(`\n=== ${content} ===`);
  const crep = {};

  // 1. Khôi phục base Chrome: downscale snap_plain về project size.
  // v2: downscale với δ=-0,5px viewport (nghịch đảo đúng của upscale
  // S=(i+0,5)/s — bản v1 không shift nên round-trip lệch ~0,4px nguồn).
  const chromeBase = resampleRgbU8Shift(prev.plain, vw, vh, projW, projH, triangleKernel, -0.5);
  const baseMad = madU8(chromeBase, fullRgb.plain);
  crep.chromeBase_vs_renderPlain_MAD = baseMad;
  console.log(`  [1] MAD(chromeBase_est, R_plain) = ${baseMad} (kỳ vọng ~1 nếu downscale giữ được b)`);

  // 2. Delta của trình duyệt (ước lượng): applySharpen trên chromeBase.
  const dpPrev = { sharp05: deltaOf(prev.sharp05, prev.plain), sharp10: deltaOf(prev.sharp10, prev.plain) };
  for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
    const img = { width: projW, height: projH, data: rgb24ToRgba(chromeBase, projW, projH) };
    applySharpen(img, intensity);
    const modelSharpBrowser = rgbaToRgb24(img.data, projW, projH);
    const dBrowser = deltaOf(modelSharpBrowser, chromeBase);
    const dRender = deltaOf(fullRgb[v], fullRgb.plain);
    // project-size: d_browser vs d_render (đo b khuếch đại ở project size)
    const projMad = madFloat(dBrowser, dRender);
    // viewport: tri/BC của 2 delta so với dp_prev thật
    const row = {};
    for (const [kname, kern] of [["tri", triangleKernel], ["bc", BC]]) {
      for (const [dname, d] of [["d_browser", dBrowser], ["d_render", dRender]]) {
        const up = new Float64Array(vw * vh * 3);
        for (let c = 0; c < 3; c++) {
          const pl = new Float64Array(projW * projH);
          for (let i = 0; i < projW * projH; i++) pl[i] = d[i * 3 + c];
          const rs = resamplePlaneK(pl, projW, projH, vw, vh, kern);
          for (let i = 0; i < vw * vh; i++) up[i * 3 + c] = rs[i];
        }
        row[`${kname}(${dname})`] = madFloat(dpPrev[v], up);
      }
    }
    crep[v] = { projectSize_MAD_dBrowser_vs_dRender: projMad, viewport: row };
    console.log(`  [2 ${v}] project-size MAD(d_browser, d_render)=${projMad}`);
    console.log(`      viewport MAD vs dp_prev: ` + Object.entries(row).map(([k, x]) => `${k}=${x}`).join(" | "));
  }
  result.contents[content] = crep;
}
writeFileEpermRetry(OUT, JSON.stringify(result, null, 2));
console.log(`\nJSON: ${OUT}`);
