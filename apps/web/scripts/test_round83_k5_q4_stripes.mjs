#!/usr/bin/env node
/**
 * test_round83_k5_q4_stripes.mjs — Phase 9 đợt 83, luồng K5: kiểm chứng số
 * headline của thí nghiệm sọc màu mịn cho Q4.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/test_round83_k5_q4_stripes.mjs
 * Thoát 0 khi mọi kiểm chứng pass, 1 khi có fail. KHÔNG push/tag/binary.
 * Không sửa production. Tự chứa (không import script thí nghiệm vì các
 * script đó chạy ngay khi nạp — chỉ import delta0-harness + chrome-resample).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {
  channelStatsRaw, absMadRaw, delta0Viewport_70x6, estShiftFrame_70x6,
} from "./delta0-harness.mjs";
import {
  resampleRgb24Trilinear, resampleRgb24, chromeWeights1D,
} from "./chrome-resample.mjs";
import { KERNELS } from "./r82j2-chrome-probe-analyze.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const I4 = path.join(GOAL, "round81-i4");
const K5 = path.join(GOAL, "round83-k5");
const W = 1280, H = 720;
const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };

let pass = 0, fail = 0;
function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  PASS ${name}${detail ? " — " + detail : ""}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? " — " + detail : ""}`); }
}
function approx(x, lo, hi) { return x >= lo && x <= hi; }
function diffStd(a, b) {
  const d = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) d[i] = a[i] - b[i];
  return channelStatsRaw(d).std;
}
function resamplePlaneKernelCached(src, srcW, srcH, dstW, dstH, kernel) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const wX = new Array(dstW), wY = new Array(dstH);
  for (let i = 0; i < dstW; i++) wX[i] = chromeWeights1D(i, sx, srcW, kernel);
  for (let i = 0; i < dstH; i++) wY[i] = chromeWeights1D(i, sy, srcH, kernel);
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) for (let i = 0; i < dstW; i++) {
    let acc = 0;
    for (const [j, w] of wX[i]) acc += w * src[y * srcW + j];
    tmp[y * dstW + i] = acc;
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) for (let i = 0; i < dstH; i++) {
    let acc = 0;
    for (const [j, w] of wY[i]) acc += w * tmp[j * dstW + x];
    out[i * dstW + x] = acc;
  }
  return out;
}
function resampleProxy(rgb, vw, vh, kernelName) {
  if (kernelName === "1kernel") return resampleRgb24(rgb, W, H, vw, vh);
  const kernel = kernelName === "mitchell" ? KERNELS.mitchell : KERNELS["bc025-0375"];
  const n = W * H, out = Buffer.alloc(vw * vh * 3);
  for (let c = 0; c < 3; c++) {
    const plane = new Float64Array(n);
    for (let i = 0; i < n; i++) plane[i] = rgb[i * 3 + c];
    const rs = resamplePlaneKernelCached(plane, W, H, vw, vh, kernel);
    for (let i = 0; i < vw * vh; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
function genStripes(pair, period, orient = "V", wave = "square") {
  const buf = Buffer.alloc(W * H * 3);
  const [cA, cB] = pair;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let f;
    if (orient === "checker") {
      f = (Math.floor(x / period) + Math.floor(y / period)) % 2 === 0 ? 0 : 1;
    } else {
      const t = x;
      f = wave === "sine" ? 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / (2 * period)) : Math.floor(t / period) % 2 === 0 ? 0 : 1;
    }
    const i = (y * W + x) * 3;
    for (let c = 0; c < 3; c++) buf[i + c] = clamp255(cA[c] + f * (cB[c] - cA[c]));
  }
  return buf;
}
function yuv709ToRgb(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.79274 * (cr - 128), yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128), yy + 2.1122 * (cb - 128)];
}
function evalRow(frame, vw, vh, kernelName = "1kernel") {
  const d0 = delta0Viewport_70x6(frame, W, H, vw, vh);
  const d0std = channelStatsRaw(Float64Array.from(d0)).std;
  const tri = resampleRgb24Trilinear(frame, W, H, vw, vh);
  const px = resampleProxy(frame, vw, vh, kernelName);
  const residStd = diffStd(px, tri);
  const plainMad = absMadRaw(px, tri);
  return { d0stdR: d0std[0], residStdR: residStd[0], plainMad, ratioR: residStd[0] > 0 ? d0std[0] / residStd[0] : null };
}
function evalRowFast(frame, shifted, vw, vh, kernelName = "1kernel") {
  const triOrig = resampleRgb24Trilinear(frame, W, H, vw, vh);
  const triShift = resampleRgb24Trilinear(shifted, W, H, vw, vh);
  const d0 = new Float64Array(triOrig.length);
  for (let i = 0; i < d0.length; i++) d0[i] = triShift[i] - triOrig[i];
  return channelStatsRaw(d0).std[0];
}

const RC_LOW = [[144, 112, 112], [112, 144, 144]];
const RC_MID = [[192, 64, 64], [64, 192, 192]];
const RC_FULL = [[255, 0, 0], [0, 255, 255]];
const GRAY = [[192, 192, 192], [64, 64, 64]];
const ISO60 = [yuv709ToRgb(128, 188, 68).map(clamp255), yuv709ToRgb(128, 68, 188).map(clamp255)];

console.log("== K5 test: sọc màu mịn Q4 ==");
// 1. Neo sanity J5 D2 (frame thật, hàm harness trực tiếp).
{
  const tp = fs.readFileSync(path.join(I4, "render", "check-tp-plain.raw"));
  const slov = fs.readFileSync(path.join(I4, "render", "plain-slovenska-plain.raw"));
  const tp311 = evalRow(tp, 311, 175);
  check("neo tp @311 1k-residStdR ≈ 3,86", approx(tp311.residStdR, 3.85, 3.87), `đo ${tp311.residStdR.toFixed(4)}`);
  const tp809 = evalRow(tp, 809, 455);
  check("neo tp @809 1k-residStdR ≈ 0,74", approx(tp809.residStdR, 0.73, 0.75), `đo ${tp809.residStdR.toFixed(4)}`);
  const slov809 = evalRow(slov, 809, 455);
  check("neo slov @809 1k-residStdR ≈ 0,35", approx(slov809.residStdR, 0.34, 0.36), `đo ${slov809.residStdR.toFixed(4)}`);
  const slov311 = evalRow(slov, 311, 175);
  check("neo slov @311 1k-residStdR ≈ 1,51", approx(slov311.residStdR, 1.50, 1.52), `đo ${slov311.residStdR.toFixed(4)}`);
}
// 2. Đối chứng xám: d0 = 0 (mô hình chroma-shift không chạm luma thuần).
{
  const gray = genStripes(GRAY, 6);
  const e = evalRow(gray, 311, 175);
  check("đối chứng xám p6 @311 d0std_R = 0", e.d0stdR === 0, `đo ${e.d0stdR}`);
  check("đối chứng xám p6 @311 residStd_R > 0 (kernel lệch trên sọc luma)", e.residStdR > 5, `đo ${e.residStdR.toFixed(2)}`);
}
// 3. Rail clamp: sọc bão hòa toàn phần p4 căn lưới cho d0 = 0.
{
  const full = genStripes(RC_FULL, 4);
  const e = evalRow(full, 809, 455);
  check("RC-full p4 @809 d0std_R = 0 (kẹp rail)", e.d0stdR === 0, `đo ${e.d0stdR}`);
}
// 4. Ứng viên 1: RC-low-V-p6 @311 (cả 3 kernel).
{
  const f = genStripes(RC_LOW, 6);
  for (const k of ["1kernel", "mitchell", "bc025"]) {
    const e = evalRow(f, 311, 175, k);
    const q4 = e.plainMad <= 2.5 && e.d0stdR > 2.0 && e.ratioR !== null && e.ratioR <= 1.0;
    check(`RC-low-V-p6 @311 ${k}: d0≈2,14`, approx(e.d0stdR, 2.13, 2.16), `đo ${e.d0stdR.toFixed(4)}`);
    check(`RC-low-V-p6 @311 ${k}: Q4 (mad≤2,5 ∧ d0>2 ∧ ratio≤1)`, q4,
      `res=${e.residStdR.toFixed(4)} mad=${e.plainMad.toFixed(4)} ratio=${e.ratioR === null ? "null" : e.ratioR.toFixed(4)}`);
  }
}
// 5. Ứng viên 2: ISO-60-chk-p2 @311 (Mitchell + BC; 1-kernel trượt R0).
{
  const f = genStripes(ISO60, 2, "checker");
  const mit = evalRow(f, 311, 175, "mitchell");
  check("ISO-60-chk-p2 @311 mitchell Q4", mit.plainMad <= 2.5 && mit.d0stdR > 2.0 && mit.ratioR <= 1.0,
    `d0=${mit.d0stdR.toFixed(4)} res=${mit.residStdR.toFixed(4)} mad=${mit.plainMad.toFixed(4)} ratio=${mit.ratioR.toFixed(4)}`);
  const k1 = evalRow(f, 311, 175, "1kernel");
  check("ISO-60-chk-p2 @311 1-kernel KHÔNG Q4 (plainMad>2,5)", k1.plainMad > 2.5 && !(k1.plainMad <= 2.5 && k1.d0stdR > 2.0 && k1.ratioR <= 1.0),
    `mad=${k1.plainMad.toFixed(4)}`);
}
// 6. Ví dụ R0-trượt: RC-mid-V-p2 @311 (ratio<1 nhưng plainMad>2,5).
{
  const f = genStripes(RC_MID, 2);
  const e = evalRow(f, 311, 175);
  check("RC-mid-V-p2 @311 ratio<1 nhưng plainMad>2,5 → không Q4",
    e.ratioR < 1.0 && e.plainMad > 2.5, `ratio=${e.ratioR.toFixed(4)} mad=${e.plainMad.toFixed(4)}`);
}
// 7. Đường nhanh (estShiftFrame 1 lần/họ) = đường harness (delta0Viewport).
{
  const f = genStripes(RC_LOW, 6);
  const shifted = estShiftFrame_70x6(f, W, H);
  const fast = evalRowFast(f, shifted, 311, 175);
  const slow = evalRow(f, 311, 175);
  check("fast-path d0 = harness d0 (±0,001)", Math.abs(fast - slow.d0stdR) < 0.001, `fast=${fast.toFixed(4)} harness=${slow.d0stdR.toFixed(4)}`);
}
// 8. Hồ sơ JSON: đúng 2 case Q4 phân biệt (5 entry kernel), D 0/12, C 0/3.
{
  const rec = JSON.parse(fs.readFileSync(path.join(K5, "r83k5-recovered-candidates.json"), "utf8"));
  check("recovery: đúng 5 entry ứng viên", rec.candidates.length === 5, `đếm ${rec.candidates.length}`);
  const pairs = new Set(rec.candidates.map((c) => `${c.family}@${c.rect}`));
  check("recovery: đúng 2 cặp (họ, rect) Q4", pairs.size === 2, [...pairs].join(", "));
  const d = JSON.parse(fs.readFileSync(path.join(K5, "r83k5-q4-verdict.json"), "utf8"));
  check("verdict D: 0/12 phân biệt G1-vs-G2", d.distinguishes === 0 && d.results.length === 12,
    `${d.distinguishes}/${d.results.length}`);
  check("verdict D: mọi case đều cả-hai-LỆCH", d.results.every((r) => r.correct === "cả-hai-LỆCH"));
  const c = JSON.parse(fs.readFileSync(path.join(K5, "r83k5-chromatic-stripes-c.json"), "utf8"));
  const cvals = Object.values(c.C);
  check("encode C: 3/3 q4=false (chuỗi F7)", cvals.length === 3 && cvals.every((x) => x.q4 === false),
    cvals.map((x) => `${x.family}@${x.rect}:mad=${x.plainMad}`).join("; "));
  check("encode C: RC-low-V-p6 plainMad 2,64 (vượt R0 sít sao)", approx(c.C["RC-low-V-p6@311x175"].plainMad, 2.6, 2.7),
    `đo ${c.C["RC-low-V-p6@311x175"].plainMad}`);
}

console.log(`\nK5 test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
