#!/usr/bin/env node
/**
 * r83k2-verify-production.mjs — Phase 9 đợt 83, luồng K2: kiểm chứng
 * việc đổi CHROME_UPSCALE_BC sang Mitchell (1/3, 1/3) trong
 * chrome-resample.mjs đã ăn vào production đúng như quyết định.
 *
 * Kiểm (trên frame tổng hợp nhỏ 64×64, LCG xác định — không cần snaps):
 *   1. resampleRgb24Trilinear upscale (64→96, s=1,5) byte-identical với
 *      resample kernel Mitchell độc lập (bcCubic 1/3, 1/3).
 *   2. Cùng case upscale KHÁC với resample kernel BC(0,25, 0,375) (MAD > 0).
 *   3. resampleRgb24Trilinear downscale (64→32) KHÔNG phụ thuộc hằng
 *      upscale: đổi tạm CHROME_UPSCALE_BC về giá trị cũ rồi chạy lại,
 *      kết quả phải byte-identical (chứng minh runtime rằng nhánh
 *      downscale không đọc hằng này); khôi phục lại sau đó.
 *   4. CHROME_UPSCALE_BC = { B: 1/3, C: 1/3 }.
 * Chạy: node apps/web/scripts/r83k2-verify-production.mjs (exit 0 = pass).
 */
import assert from "node:assert";
import { resampleRgb24Trilinear, CHROME_UPSCALE_BC, bcCubicKernel, chromeWeights1D } from "./chrome-resample.mjs";

function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  const roundU8 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const sx = dstW / srcW, sy = dstH / srcH;
    const tmp = new Float64Array(dstW * srcH);
    for (let y = 0; y < srcH; y++) for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, sx, srcW, kernel, 1)) acc += w * pl[y * srcW + j];
      tmp[y * dstW + i] = acc;
    }
    const res = new Float64Array(dstW * dstH);
    for (let x = 0; x < dstW; x++) for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, sy, srcH, kernel, 1)) acc += w * tmp[j * dstW + x];
      res[i * dstW + x] = acc;
    }
    for (let i = 0; i < dstW * dstH; i++) out[i * 3 + c] = roundU8(res[i]);
  }
  return out;
}
function mad3(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}

// Frame tổng hợp 64×64: sọc + gradient + nhiễu LCG (đủ HF để phân biệt kernel).
const W = 64, H = 64;
const frame = Buffer.alloc(W * H * 3);
let seed = 123456789;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const v = Math.round(128 + 64 * Math.sin(x / 4) + 32 * Math.sin(y / 3) + (rnd() - 0.5) * 40);
  const i = (y * W + x) * 3;
  frame[i] = frame[i + 1] = frame[i + 2] = Math.max(0, Math.min(255, v));
}

const mitchell = (x) => bcCubicKernel(x, 1 / 3, 1 / 3);
const bcOld = (x) => bcCubicKernel(x, 0.25, 0.375);

// 4. Hằng số production.
assert.strictEqual(CHROME_UPSCALE_BC.B, 1 / 3, "B phải là 1/3");
assert.strictEqual(CHROME_UPSCALE_BC.C, 1 / 3, "C phải là 1/3");
console.log(`[4] CHROME_UPSCALE_BC = { B: ${CHROME_UPSCALE_BC.B}, C: ${CHROME_UPSCALE_BC.C} } ✓`);

// 1. Upscale production == Mitchell độc lập.
const prodUp = resampleRgb24Trilinear(frame, W, H, 96, 96);
const mitUp = resampleRgbKernel(frame, W, H, 96, 96, mitchell);
assert.ok(prodUp.equals(mitUp), "upscale production phải byte-identical với Mitchell");
console.log("[1] upscale 64→96: production == Mitchell (byte-identical) ✓");

// 2. Upscale production != BC cũ.
const bcUp = resampleRgbKernel(frame, W, H, 96, 96, bcOld);
const dBc = mad3(prodUp, bcUp);
assert.ok(dBc > 0.1, `upscale production phải khác BC cũ (MAD=${dBc})`);
console.log(`[2] upscale 64→96: production vs BC(0,25, 0,375) MAD=${dBc} (khác thật) ✓`);

// 3. Downscale không phụ thuộc hằng upscale: đổi tạm về giá trị cũ,
// chạy lại downscale, phải byte-identical; rồi khôi phục.
const prodDown = resampleRgb24Trilinear(frame, W, H, 32, 32);
CHROME_UPSCALE_BC.B = 0.25; CHROME_UPSCALE_BC.C = 0.375;
const prodDownOld = resampleRgb24Trilinear(frame, W, H, 32, 32);
CHROME_UPSCALE_BC.B = 1 / 3; CHROME_UPSCALE_BC.C = 1 / 3;
assert.ok(prodDown.equals(prodDownOld), "downscale phải byte-identical dù đổi hằng upscale");
assert.strictEqual(CHROME_UPSCALE_BC.B, 1 / 3, "phải khôi phục B=1/3");
console.log("[3] downscale 64→32: byte-identical khi hằng upscale đổi về cũ (không chạm downscale) ✓");

console.log("r83k2-verify-production: 4/4 PASS");
