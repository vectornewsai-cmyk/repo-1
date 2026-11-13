#!/usr/bin/env node
/**
 * r82j7-blur-test.mjs — Phase 9 đợt 82, luồng J7: test E8 (blur-sensitivity).
 *
 * Giả thuyết còn lại sau khi loại sharpen-sau-upscale (E7a): frame mà
 * browser decode + draw lên effect canvas MỀM HƠN frame ffmpeg decode
 * (R_plain) — vd do drawImage video→canvas, deblocking khác, hoặc
 * getImageData/putImageData — nên sharpen trong browser thấy được delta
 * ở đường mảnh trong khi mô hình trên R_plain (sắc, bilevel 0/255) thấy
 * delta ≈ 0 (kẹp ở hai đầu). Test: làm mờ R_plain bằng blur nhị thức
 * nhỏ (σ≈0,7 / σ≈1,0), sharpen trên frame đã mờ, rồi so delta với dp_prev.
 * Mô hình: dp_model = tri(sharpen(blur(R_plain)) − blur(R_plain)).
 * Kiểm chứng phụ: tri(blur(R_plain)) so với P_plain — nếu blur làm plain
 * tệ đi nhiều thì giả thuyết "decode mềm" mâu thuẫn với plain MAD đã đo
 * (plain khớp khá tốt), và kết quả phải đọc theo hướng đó.
 *
 * Chạy: node apps/web/scripts/r82j7-blur-test.mjs
 * Env: R82J7_OUT (mặc định hidden_files/round82-j7/r82j7-blur.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const require = createRequire(import.meta.url);
const { applySharpen } = require("/tmp/r82j7-effectCanvas.cjs");

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G5 = path.join(GOAL, "round79-g5");
const H3 = path.join(GOAL, "round80-h3");
const J7 = path.join(GOAL, "round82-j7");
const OUT = process.env.R82J7_OUT || path.join(J7, "r82j7-blur.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

function resamplePlaneFloat(src, srcW, srcH, dstW, dstH, kernel) {
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
function mad3(a, b) {
  const n = a.length / 3;
  let sum = 0;
  for (let p = 0; p < n; p++) for (let c = 0; c < 3; c++) sum += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
  return +(sum / (n * 3)).toFixed(3);
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
// Blur nhị thức tách được, clamp-to-edge, trên RGB24 (float, không làm tròn).
function binomialBlur(rgb, w, h, K) {
  const r = (K.length - 1) / 2;
  const sumK = K.reduce((a, b) => a + b, 0);
  const at = (x, y, c) => rgb[(y < 0 ? 0 : y >= h ? h - 1 : y) * w * 3 + (x < 0 ? 0 : x >= w ? w - 1 : x) * 3 + c];
  const tmp = new Float64Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let dx = -r; dx <= r; dx++) s += K[dx + r] * at(x + dx, y, c);
    tmp[(y * w + x) * 3 + c] = s / sumK;
  }
  const out = new Float64Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let dy = -r; dy <= r; dy++) {
      const yy = y + dy < 0 ? 0 : y + dy >= h ? h - 1 : y + dy;
      s += K[dy + r] * tmp[(yy * w + x) * 3 + c];
    }
    out[(y * w + x) * 3 + c] = s / sumK;
  }
  return out;
}
function floatToRgb24(f, w, h) {
  const out = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h * 3; i++) {
    const v = Math.round(f[i]);
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return out;
}
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const rs = resamplePlaneFloat(pl, srcW, srcH, dstW, dstH, kernel);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}

const BLURS = {
  none: null,
  tap121: [1, 2, 1],
  binom5: [1, 4, 6, 4, 1],
};
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
  const rep = {};
  for (const [bName, K] of Object.entries(BLURS)) {
    const base = K ? floatToRgb24(binomialBlur(fullRgb.plain, projW, projH, K), projW, projH) : fullRgb.plain;
    // kiểm chứng phụ: plain của frame đã mờ upscale lên so với P_plain
    const plainUp = resampleRgbKernel(base, projW, projH, vw, vh, triangleKernel);
    const plainMad = mad3(prev.plain, plainUp);
    const row = { plainMad_vs_Pplain: plainMad };
    for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
      const img = { width: projW, height: projH, data: rgb24ToRgba(base, projW, projH) };
      applySharpen(img, intensity);
      const sharpBlur = rgbaToRgb24(img.data, projW, projH);
      const dBlur = deltaOf(sharpBlur, base);
      // tri-resample delta lên viewport (float)
      const up = new Float64Array(vw * vh * 3);
      for (let c = 0; c < 3; c++) {
        const pl = new Float64Array(projW * projH);
        for (let i = 0; i < projW * projH; i++) pl[i] = dBlur[i * 3 + c];
        const rs = resamplePlaneFloat(pl, projW, projH, vw, vh, triangleKernel);
        for (let i = 0; i < vw * vh; i++) up[i * 3 + c] = rs[i];
      }
      const dpPrev = deltaOf(prev[v], prev.plain);
      row[v] = { mad_vs_dpPrev: deltaMadFloat(dpPrev, up) };
      console.log(`  [E8 ${bName} ${v}] MAD(tri(sharpen(blur)-blur), dp_prev)=${row[v].mad_vs_dpPrev} | plain MAD mờ=${plainMad}`);
    }
    rep[bName] = row;
  }
  report.datasets[ds.key] = rep;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nJSON: ${OUT}`);
