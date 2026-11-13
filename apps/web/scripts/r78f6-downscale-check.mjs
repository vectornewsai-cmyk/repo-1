#!/usr/bin/env node
/**
 * r78f6-downscale-check.mjs — Phase 9 đợt 78, luồng F6: kiểm tra giả
 * thuyết nhiễm ở run project 640×360 (plain MAD ~2,7 cả 2 kernel):
 * khung project 640 của preview = video 1280×720 downscale bằng
 * drawImage Chrome (trilinear), còn render preencode ocean640 dùng
 * ffmpeg scale mặc định (bicubic). So sánh:
 *   (a) preview plain (w1920-p640, rect 809×455) vs render ffmpeg-640
 *       resample trilinear lên 809×455 (số hiện tại: MAD ~2,75);
 *   (b) preview plain vs render trilinear-640 (fullrgb-1280 plain
 *       resample trilinear 1280→640) resample trilinear lên 809×455;
 *   (c) như (b) nhưng upscale bằng BC(0,25, 0,375).
 * Nếu (b)/(c) cho MAD ~1,0 thì nhiễm nằm ở bước downscale và cách sửa
 * là sinh lại frame ocean640 bằng downscale trilinear; nếu vẫn ~2,7 thì
 * nhiễm nằm ở chỗ khác (đường nội bộ preview).
 * Chạy (từ gốc repo): node apps/web/scripts/r78f6-downscale-check.mjs
 * KHÔNG push/tag/binary.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear, chromeWeights1D } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const F6 = path.join(GOAL, "round78-f6");

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
    for (let i = 0; i < dstW; i++) { let acc = 0; for (const [j, w] of wCacheX[i]) acc += w * src[sRow + j]; tmp[tRow + i] = acc; }
  }
  const out = new Float64Array(dstW * dstH);
  const wCacheY = new Array(dstH);
  for (let i = 0; i < dstH; i++) wCacheY[i] = chromeWeights1D(i, scaleY, srcH, kernel);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) { let acc = 0; for (const [j, w] of wCacheY[i]) acc += w * tmp[j * dstW + x]; out[i * dstW + x] = acc; }
  }
  return out;
}
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const r = resamplePlaneKernel(pl, srcW, srcH, dstW, dstH, dstW / srcW, dstH / srcH, kernel);
    for (let i = 0; i < dstW * dstH; i++) { const v = Math.round(r[i]); out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v; }
  }
  return out;
}
function absMad(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]); sum += d; if (d > dmax) dmax = d; }
    if (dmax <= 8) le8++;
  }
  return { mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4) };
}
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }

function main() {
  const doc = JSON.parse(fs.readFileSync(path.join(F6, "headed-w1920x1080-p640x360", "r78f6-snaps-w1920x1080-p640x360.json"), "utf8"));
  const snaps = doc.snaps.ocean;
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const prev = b64ToRgb(snaps.plain.rgbB64);
  const plain1280 = fs.readFileSync(path.join(F6, "render", "ocean", "fullrgb-plain.raw"));
  const plain640ff = fs.readFileSync(path.join(F6, "render", "ocean640", "fullrgb-plain.raw"));
  console.log(`ocean w1920-p640: rect ${vw}x${vh}, preview plain mean=${snaps.plain.mean}`);
  // (0) Bản thân 2 khung 640 khác nhau bao nhiêu? (downscale ffmpeg vs trilinear)
  const plain640tri = resampleRgb24Trilinear(plain1280, 1280, 720, 640, 360);
  const d640 = absMad(plain640ff, plain640tri);
  console.log(`  downscale 1280→640: ffmpeg-bicubic vs chrome-trilinear MAD=${d640.mad} le8=${(d640.le8 * 100).toFixed(1)}%`);
  // (a) render ffmpeg-640 → trilinear lên viewport (số hiện tại).
  const a = resampleRgb24Trilinear(plain640ff, 640, 360, vw, vh);
  console.log(`  (a) ffmpeg-640 + trilinear-up: plain MAD=${absMad(prev, a).mad} le8=${(absMad(prev, a).le8 * 100).toFixed(1)}%`);
  // (b) render trilinear-640 → trilinear lên viewport.
  const b = resampleRgb24Trilinear(plain640tri, 640, 360, vw, vh);
  console.log(`  (b) trilinear-640 + trilinear-up: plain MAD=${absMad(prev, b).mad} le8=${(absMad(prev, b).le8 * 100).toFixed(1)}%`);
  // (c) render trilinear-640 → BC lên viewport.
  const c = resampleRgbKernel(plain640tri, 640, 360, vw, vh, (x) => bcCubic(x, 0.25, 0.375));
  console.log(`  (c) trilinear-640 + BC-up: plain MAD=${absMad(prev, c).mad} le8=${(absMad(prev, c).le8 * 100).toFixed(1)}%`);
  // (d) đối chứng: 1280 thẳng lên viewport (bỏ qua project 640) — xem preview
  // có thật sự đi qua project 640 không: nếu (d) khớp hơn (b) thì preview
  // không downscale nội bộ như giả thuyết.
  const d = resampleRgb24Trilinear(plain1280, 1280, 720, vw, vh);
  console.log(`  (d) 1280 thẳng + trilinear-up (không qua 640): plain MAD=${absMad(prev, d).mad} le8=${(absMad(prev, d).le8 * 100).toFixed(1)}%`);
}
main();
