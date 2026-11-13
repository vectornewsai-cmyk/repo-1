#!/usr/bin/env node
// r86n7-video-operator.test.mjs — Phase 9 đợt 86, luồng N7: test toán tử
// drawImage(VIDEO) của Chrome (tam giác + vị trí 1/16 + trunc) — KHÁC đường
// canvas/image (trilinear/Mitchell) trong cùng module này.
// Chạy: node --test apps/web/scripts/r86n7-video-operator.test.mjs
// Mọi giá trị dưới đây tính tay từ công thức V1, đối chiếu số đo headed
// (verify3: 86/87 case MAD đúng 0; xem
// docs/PHASE9_ROUND86_N7_VIDEO_OPERATOR_LIMITS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { videoOperatorWeights1D, videoOperatorSample1D } from "./chrome-resample.mjs";

// Bậc 0→255 tại x=320 (clip stepV255): src[j] = j < 320 ? 0 : 255.
function stepSrc(len = 640, edge = 320) {
  const src = new Float64Array(len);
  for (let j = edge; j < len; j++) src[j] = 255;
  return src;
}

// Sóng vuông sqw4-mid (B-1to1 đã đo): chu kỳ 8, vạch 4px,
// src[j] = floor(j/4) lẻ ? 192 : 64 (đã kiểm src[28..38] = 192,192,192,192,
// 64,64,64,64, 192,192,192).
function sqw4Src(len = 360) {
  const src = new Float64Array(len);
  for (let j = 0; j < len; j++) src[j] = Math.floor(j / 4) % 2 === 1 ? 192 : 64;
  return src;
}

test("video operator weights: s=1.5 i=479 (tính tay)", () => {
  // S = 479,5/1,5 = 319,6667; S_q = floor(5114,6667)/16 = 319,625;
  // tap 319: tri(-0,125) = 0,875; tap 320: tri(0,875) = 0,125.
  assert.deepEqual(videoOperatorWeights1D(479, 1.5, 640), [[319, 0.875], [320, 0.125]]);
});

test("video operator weights: tie s=809/640 i=404 (fround làm tròn LÊN)", () => {
  // S = 404,5/fround(809/640) = 319,99999396 (dưới 320 đúng);
  // S_q = 319,9375; tap 319: 0,5625; tap 320: 0,4375.
  // Mô hình thang float64 cho 0,5/0,5 — SAI (đo Chrome: 111, không phải 127).
  assert.deepEqual(videoOperatorWeights1D(404, 809 / 640, 640), [[319, 0.5625], [320, 0.4375]]);
});

test("video operator weights: tie s=1449/640 i=724 (fround làm tròn XUỐNG)", () => {
  // S = 724,5/fround(1449/640) = 320,00001348 (trên 320 đúng);
  // S_q = 320,0; tap 319: 0,5; tap 320: 0,5 — ngược với tie s=809/640.
  assert.deepEqual(videoOperatorWeights1D(724, 1449 / 640, 640), [[319, 0.5], [320, 0.5]]);
});

test("video operator weights: identity s=1", () => {
  assert.deepEqual(videoOperatorWeights1D(100, 1, 640), [[100, 1]]);
});

test("video operator sample: trunc, không round (step s=1.5 i=479)", () => {
  // acc = 0,125*255 = 31,875 → trunc 31 (Chrome đo 31; round cho 32 — SAI).
  assert.equal(videoOperatorSample1D(stepSrc(), 479, 1.5), 31);
});

test("video operator sample: tie s=809/640 i=404", () => {
  // acc = 0,4375*255 = 111,5625 → trunc 111 (Chrome đo 111).
  assert.equal(videoOperatorSample1D(stepSrc(), 404, 809 / 640), 111);
});

test("video operator sample: tie s=1449/640 i=724", () => {
  // acc = 0,5*255 = 127,5 → trunc 127 (Chrome đo 127).
  assert.equal(videoOperatorSample1D(stepSrc(), 724, 1449 / 640), 127);
});

test("video operator sample: CTM offDst=0.5 (stepV255 s=815/360 i=723)", () => {
  // S = (723,5−0,5)/fround(815/360) = 319,3522; S_q = 319,3125;
  // cả 2 tap đều ở vùng 0 → 0 (Chrome đo 0).
  assert.equal(videoOperatorSample1D(stepSrc(), 723, 815 / 360, 0.5), 0);
});

test("video operator weights: downscale tie s=0.6 i=19 (mô hình)", () => {
  // S = 19,5/fround(0,6) = 32,49999871; S_q = 32,4375;
  // tap 31: 0,0625; tap 32: 0,9375.
  assert.deepEqual(videoOperatorWeights1D(19, 0.6, 360), [[31, 0.0625], [32, 0.9375]]);
});

test("video operator sample: PHẦN DƯ ĐÃ BIẾT sqw4-mid s=0.6 i=19 (model 72, Chrome 64)", () => {
  // acc = 0,0625*192 + 0,9375*64 = 72 — mô hình V1 cho 72 nhưng Chrome đo
  // 64 (S đúng 32,5 như thang float64). Đây là phần dư DUY NHẤT của V1
  // trong 87 case (MAD 0,65 trên case đó); xem LIMITS N7 §5. Test này pin
  // hành vi MÔ HÌNH, không phải hành vi Chrome — đừng "sửa" số 72 khi
  // chưa có mô hình mới đạt 87/87 (15 biến thể đã thử đều không đạt).
  assert.equal(videoOperatorSample1D(sqw4Src(), 19, 0.6), 72);
});
