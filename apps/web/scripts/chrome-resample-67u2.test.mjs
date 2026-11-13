#!/usr/bin/env node
// chrome-resample-67u2.test.mjs — Phase 9 đợt 67, luồng U2: test mô hình
// 2 chặng (halve triangle h=1 rồi scale triangle h=1) cho bộ lọc Chrome ở
// s<0.5 + bộ chọn mô hình theo thang.
// CẬP NHẬT Phase 9 đợt 75, luồng C2: quy tắc LOD giờ là trung bình nhân
// s = √(sx·sy) (docs/PHASE9_ROUND75_C2_RESAMPLE_ANISO_MODEL_LIMITS.md).
// Hệ quả: mặt phẳng 512×1 (sy=1) KHÔNG còn là mô hình đúng cho fixture
// sweep vạch dọc — fixture đo trên canvas VUÔNG 512×512 (vạch dọc, scale
// đều 2 trục), nên các test dưới đây dùng đúng hình học đó (vạch dọc trên
// canvas 512×512, đích vuông). Mọi giá trị đo đã pin giữ nguyên; hành vi
// đẳng hướng của production không đổi (s_geo = s khi sx = sy).
// Chạy: node --test apps/web/scripts/chrome-resample-67u2.test.mjs
// Fixture: hàng sweep xung vuông 512×512 đo thật trên Chromium 1254 headed
// (probe 2, r67u2-filter2-A.json; s thực = 196/512 = 0.3828125, n=3 identical).
// Dạng sparse: {chỉ số đích: giá trị đo}, còn lại 0.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resamplePlane,
  resampleRgb24,
  resamplePlaneTwoStage,
  resampleRgb24TwoStage,
  resamplePlaneTrilinear,
  resampleRgb24Trilinear,
  chromeResampleRgb24,
} from "./chrome-resample.mjs";

const DW = 196; // 512 * 196/512
const MEAS_P256 = { 98: 101 };
const MEAS_P272 = { 104: 127 };

// Vạch dọc trắng tại x=p trên canvas vuông 512×512 (đúng hình học fixture
// probe 2: vạch dọc, scale đều 2 trục). Mọi hàng giống hệt nhau nên hàng
// y=floor(DW/2) của đích chính là profile 1D đã đo.
function vlinePlane(p) {
  const img = new Float64Array(512 * 512);
  for (let y = 0; y < 512; y++) img[y * 512 + p] = 255;
  return img;
}
function rowOf(out, dw, y) {
  return Array.from(out.slice(y * dw, (y + 1) * dw), Math.round);
}
const YMID = Math.floor(DW / 2); // 98
function sparseToRow(sparse, len = DW) {
  const row = new Array(len).fill(0);
  for (const [i, v] of Object.entries(sparse)) row[+i] = v;
  return row;
}
function mad(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}
function maxAbsDiff(a, b) {
  let m = 0;
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]));
  return m;
}

test("trilinear: xung p=272 khớp đúng từng số với Chrome headed (mad 0.000)", () => {
  const out = rowOf(resamplePlaneTrilinear(vlinePlane(272), 512, 512, DW, DW), DW, YMID);
  const meas = sparseToRow(MEAS_P272);
  assert.equal(mad(out, meas), 0);
});

test("trilinear: xung p=256 khớp đúng từng số (peak 101, 2-stage cũ dự 108)", () => {
  const out = rowOf(resamplePlaneTrilinear(vlinePlane(256), 512, 512, DW, DW), DW, YMID);
  const meas = sparseToRow(MEAS_P256);
  assert.equal(mad(out, meas), 0);
  assert.equal(maxAbsDiff(out, meas), 0);
  assert.equal(Math.max(...out), 101); // đo 101; 2-stage dự 108 (dư +7)
});

test("trilinear tốt hơn hẳn 1-kernel và 2-stage ở s=0.3828 (mad 0 vs 0.036/0.138 tại p=256)", () => {
  const src = vlinePlane(256);
  const outT = rowOf(resamplePlaneTrilinear(src, 512, 512, DW, DW), DW, YMID);
  const out2 = rowOf(resamplePlaneTwoStage(src, 512, 512, DW, DW), DW, YMID);
  const out1 = rowOf(resamplePlane(src, 512, 512, DW, DW, DW / 512, DW / 512), DW, YMID);
  const meas = sparseToRow(MEAS_P256);
  assert.equal(mad(outT, meas), 0);
  assert.ok(mad(out2, meas) > 0.03, `2st=${mad(out2, meas)}`);
  assert.ok(mad(out1, meas) > 0.1, `1k=${mad(out1, meas)}`);
});

test("ở s=0.5 trilinear cho tap 127 (halve nửa-xuống, đúng Chrome đo riêng), 2-stage cũ cho 128", () => {
  const src = vlinePlane(100);
  const a = resamplePlaneTrilinear(src, 512, 512, 256, 256);
  const b = resamplePlaneTwoStage(src, 512, 512, 256, 256);
  assert.equal(Math.max(...Array.from(a, Math.round)), 127); // 127,5 -> 127 (W5 §3: tap halve đo được là 127)
  assert.equal(Math.max(...Array.from(b, Math.round)), 128); // 2-stage làm tròn thường -> 128, lệch 1
});

test("DC bảo toàn: phẳng 128 qua trilinear vẫn 128 (mọi mức mip)", () => {
  const src = new Float64Array(512 * 512).fill(128);
  const out = resamplePlaneTrilinear(src, 512, 512, 196, 196);
  for (const v of out) assert.equal(Math.round(v), 128);
});

test("chromeResampleRgb24: mọi thang đều dùng trilinear (không còn chuyển mô hình ở 0.5)", () => {
  const src = Buffer.alloc(512 * 512 * 3);
  for (let i = 0; i < 512 * 512; i++) { src[i * 3] = 255; src[i * 3 + 1] = 128; src[i * 3 + 2] = 0; }
  const small = chromeResampleRgb24(src, 512, 512, 196, 196);
  const smallT = resampleRgb24Trilinear(src, 512, 512, 196, 196);
  assert.deepEqual(small, smallT);
  const big = chromeResampleRgb24(src, 512, 512, 323, 323); // s=0.63, λ*=0.164 -> blend, khác 1-kernel
  const bigT = resampleRgb24Trilinear(src, 512, 512, 323, 323);
  assert.deepEqual(big, bigT);
  // Phẳng không phân biệt được mô hình -> dùng xung điểm 2D để chứng minh
  // trilinear != 1-kernel ở s=0.63 (peak điểm 2D: trilinear 56, 1-kernel 64).
  // ĐỢT 73 A1: 53 cũ là giá trị SAI của bản blend-từng-pass (đợt 70 X1);
  // bản blend-at-end cho 55, khớp peak đo headed 56 ± 1 tại ô này
  // (lưới pha mịn đợt 72 Z7: (256,256) dw=323 đo 56, peakX/Y 161,161).
  // ĐỢT 75 C2: bilinear float (không làm tròn giữa các pass) cho ĐÚNG 56
  // — giá trị đo từng số; 55 là artefact làm tròn roundHalfDown từng pass
  // của bản cũ (xem LIMITS C2 §3).
  const imp = Buffer.alloc(512 * 512 * 3);
  const ci = (256 * 512 + 256) * 3;
  imp[ci] = 255; imp[ci + 1] = 255; imp[ci + 2] = 255;
  const impT = chromeResampleRgb24(imp, 512, 512, 323, 323);
  const imp1 = resampleRgb24(imp, 512, 512, 323, 323);
  assert.notDeepEqual(impT, imp1);
  let peakT = 0, peak1 = 0;
  for (let i = 0; i < impT.length; i++) { peakT = Math.max(peakT, impT[i]); peak1 = Math.max(peak1, imp1[i]); }
  assert.equal(peakT, 56);
  assert.equal(peak1, 64);
});

test("resampleRgb24 (1-kernel) không đổi: phẳng 128 → 128, kích thước đích đúng", () => {
  const src = Buffer.alloc(1280 * 720 * 3).fill(128);
  const out = resampleRgb24(src, 1280, 720, 489, 275);
  assert.equal(out.length, 489 * 275 * 3);
  for (let i = 0; i < out.length; i++) assert.equal(out[i], 128);
});

test("2-stage cũ giữ nguyên hành vi (mốc đối chứng, không xoá)", () => {
  const out = rowOf(resamplePlaneTwoStage(vlinePlane(272), 512, 512, DW, DW), DW, YMID);
  const meas = sparseToRow(MEAS_P272);
  assert.equal(mad(out, meas), 0);
  const out256 = resamplePlaneTwoStage(vlinePlane(256), 512, 512, DW, DW);
  assert.equal(Math.max(...Array.from(out256, Math.round)), 108); // 2-stage dự 108, đo 101 — dư đã biết
});
