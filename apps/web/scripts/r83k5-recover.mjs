#!/usr/bin/env node
/**
 * r83k5-recover.mjs — Phase 9 đợt 83, luồng K5: KHÔI PHỤC sau khi tiến trình
 * screen B chết giữa B2 (mất JSON trong bộ nhớ; log vẫn còn đủ d0/res/ratio).
 *
 * B1 đã xong hoàn toàn (log: 54 họ, 216 hàng; ứng viên Q4 1-kernel: 1 —
 * RC-low-V-p6 @311×175, plainMad 2,09 — khớp probe độc lập). B2 đã xong
 * 48/54 họ; 6 họ cuối chưa chạy (GRAY-V-p8, GRAYlow-V-p2, sine ×2,
 * FLAT ×2) — trong đó chỉ 2 họ sine có thể là ứng viên (gray/flat có
 * d0std_R = 0 nên không thể Q4 với bất kỳ kernel nào).
 *
 * Script này tính ĐẦY ĐỦ (d0std, residStd, plainMad, ratio, q4 × 3 kernel:
 * 1-kernel, Mitchell, BC) cho 56 cặp (họ, rect) còn bỏ ngỏ: mọi hàng có
 * d0std_R > 2 ∧ ratio_R < 1 ở bất kỳ kernel nào trong log B1/B2, cộng toàn
 * bộ 2 họ sine × 4 rect. Ghi checkpoint JSON sau mỗi cặp (không mất dữ
 * liệu nếu tiến trình chết lần nữa).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r83k5-recover.mjs
 * Ra: hidden_files/round83-k5/r83k5-recovered-candidates.json
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { channelStatsRaw, absMadRaw, estShiftFrame_70x6 } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear, resampleRgb24, chromeWeights1D } from "./chrome-resample.mjs";
import { KERNELS } from "./r82j2-chrome-probe-analyze.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const K5 = path.join(GOAL, "round83-k5");
const OUT = path.join(K5, "r83k5-recovered-candidates.json");
const W = 1280, H = 720;
const r4 = (x) => +x.toFixed(4);

// 56 cặp (họ, rect) còn bỏ ngỏ — trích từ log screen B (xem LIMITS §2.3).
const PAIRS = [
  ["BY-mid-V-p3", "809x455"], ["GM-mid-V-p2", "311x175"], ["GM-mid-V-p2", "489x275"],
  ["GM-mid-V-p3", "311x175"], ["GM-mid-V-p3", "489x275"], ["GM-mid-V-p6", "311x175"],
  ["ISO-100-V-p3", "489x275"], ["ISO-60-V-p2", "311x175"], ["ISO-60-V-p2", "489x275"],
  ["ISO-60-V-p2", "809x455"], ["ISO-60-V-p3", "311x175"], ["ISO-60-V-p3", "489x275"],
  ["ISO-60-V-p4", "311x175"], ["ISO-60-V-p4-ph1", "311x175"], ["ISO-60-V-p4-ph1", "489x275"],
  ["ISO-60-V-p6", "311x175"], ["ISO-60-chk-p2", "1129x635"], ["ISO-60-chk-p2", "311x175"],
  ["ISO-60-chk-p2", "489x275"], ["ISO-60-chk-p2", "809x455"], ["ISO-60-chk-p3", "311x175"],
  ["ISO-60-chk-p3", "489x275"], ["ISO-60-chk-p4", "311x175"], ["ISO-60-chk-p4", "489x275"],
  ["OT-mid-V-p2", "489x275"], ["OT-mid-V-p2", "809x455"], ["OT-mid-V-p3", "311x175"],
  ["OT-mid-V-p3", "489x275"], ["OT-mid-V-p4", "311x175"], ["OT-mid-V-p6", "311x175"],
  ["RC-full-V-p3", "489x275"], ["RC-low-V-p6", "311x175"], ["RC-mid-D-p3", "311x175"],
  ["RC-mid-D-p3", "489x275"], ["RC-mid-D-p4", "311x175"], ["RC-mid-D-p4", "489x275"],
  ["RC-mid-V-p2", "311x175"], ["RC-mid-V-p2", "489x275"], ["RC-mid-V-p3", "311x175"],
  ["RC-mid-V-p3", "489x275"], ["RC-mid-V-p4-ph1", "311x175"], ["RC-mid-V-p4-ph1", "489x275"],
  ["RC-mid-V-p4-sine", "1129x635"], ["RC-mid-V-p4-sine", "311x175"], ["RC-mid-V-p4-sine", "489x275"],
  ["RC-mid-V-p4-sine", "809x455"], ["RC-mid-V-p6", "311x175"],
  ["RC-mid-V-p6-sine", "1129x635"], ["RC-mid-V-p6-sine", "311x175"], ["RC-mid-V-p6-sine", "489x275"],
  ["RC-mid-V-p6-sine", "809x455"], ["RC-mid-chk-p2", "489x275"], ["RC-mid-chk-p2", "809x455"],
  ["RC-mid-chk-p3", "489x275"], ["RC-mid-chk-p4", "311x175"], ["RC-mid-chk-p4", "489x275"],
];

const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
function genStripes({ pair, period, phase = 0, orient = "V", wave = "square" }) {
  const buf = Buffer.alloc(W * H * 3);
  const [cA, cB] = pair;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let f;
    if (orient === "checker") {
      f = (Math.floor((x + phase) / period) + Math.floor((y + phase) / period)) % 2 === 0 ? 0 : 1;
    } else {
      const t = orient === "V" ? x + phase : orient === "H" ? y + phase : x + y + phase;
      f = wave === "sine"
        ? 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / (2 * period))
        : Math.floor(t / period) % 2 === 0 ? 0 : 1;
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
function isoPair(amp) {
  const a = yuv709ToRgb(128, 128 + amp, 128 - amp);
  const b = yuv709ToRgb(128, 128 - amp, 128 + amp);
  return [a.map(clamp255), b.map(clamp255)];
}
const PAIRS_MAP = {
  "RC-full": [[255, 0, 0], [0, 255, 255]],
  "RC-mid": [[192, 64, 64], [64, 192, 192]],
  "RC-low": [[144, 112, 112], [112, 144, 144]],
  "GM-mid": [[64, 192, 64], [192, 64, 192]],
  "BY-mid": [[64, 64, 192], [192, 192, 64]],
  "OT-mid": [[192, 128, 64], [64, 128, 192]],
  "ISO-60": isoPair(60),
  "ISO-100": isoPair(100),
};
function buildFrame(name) {
  const m = name.match(/^(.+)-(V|chk|D)-p(\d+)(-ph1|-sine)?$/);
  if (!m) throw new Error("không parse được tên họ: " + name);
  const [, pname, orientCode, pStr, suffix] = m;
  const period = parseInt(pStr, 10);
  const orient = orientCode === "V" ? "V" : orientCode === "D" ? "D" : "checker";
  const phase = suffix === "-ph1" ? 1 : 0;
  const wave = suffix === "-sine" ? "sine" : "square";
  return genStripes({ pair: PAIRS_MAP[pname], period, phase, orient, wave });
}
function resamplePlaneKernelCached(src, srcW, srcH, dstW, dstH, kernel) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const wX = new Array(dstW), wY = new Array(dstH);
  for (let i = 0; i < dstW; i++) wX[i] = chromeWeights1D(i, sx, srcW, kernel);
  for (let i = 0; i < dstH; i++) wY[i] = chromeWeights1D(i, sy, srcH, kernel);
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) {
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of wX[i]) acc += w * src[y * srcW + j];
      tmp[y * dstW + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of wY[i]) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
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
function diffStd(a, b) {
  const d = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) d[i] = a[i] - b[i];
  return channelStatsRaw(d).std;
}

const report = { generated: new Date().toISOString(), pairs: {}, candidates: [] };
const t0 = Date.now();
for (const [fam, rect] of PAIRS) {
  const [vw, vh] = rect.split("x").map(Number);
  const frame = buildFrame(fam);
  const shifted = estShiftFrame_70x6(frame, W, H);
  const triOrig = resampleRgb24Trilinear(frame, W, H, vw, vh);
  const triShift = resampleRgb24Trilinear(shifted, W, H, vw, vh);
  const d0 = new Float64Array(triOrig.length);
  for (let i = 0; i < d0.length; i++) d0[i] = triShift[i] - triOrig[i];
  const d0std = channelStatsRaw(d0).std;
  const row = { family: fam, rect, d0std: d0std.map(r4), kernels: {} };
  for (const k of ["1kernel", "mitchell", "bc025"]) {
    const px = resampleProxy(frame, vw, vh, k);
    const residStd = diffStd(px, triOrig);
    const plainMad = absMadRaw(px, triOrig);
    const ratio = residStd[0] > 0 ? d0std[0] / residStd[0] : null; // null = ∞ (resid = 0)
    row.kernels[k] = {
      residStd: residStd.map(r4), residStdR: r4(residStd[0]),
      plainMad: r4(plainMad), ratioR: ratio === null ? null : r4(ratio),
      q4: plainMad <= 2.5 && d0std[0] > 2.0 && residStd[0] > 0 && ratio !== null && ratio <= 1.0,
    };
    if (row.kernels[k].q4) {
      report.candidates.push({ family: fam, rect, kernel: k, d0stdR: r4(d0std[0]), residStdR: r4(residStd[0]), ratioR: r4(ratio), plainMad: r4(plainMad) });
    }
  }
  report.pairs[`${fam}@${rect}`] = row;
  console.log(`  ${fam} ${rect}: d0=${row.d0std[0]} | 1k:res=${row.kernels["1kernel"].residStdR},mad=${row.kernels["1kernel"].plainMad},ratio=${row.kernels["1kernel"].ratioR},q4=${row.kernels["1kernel"].q4} | mit:res=${row.kernels.mitchell.residStdR},mad=${row.kernels.mitchell.plainMad},ratio=${row.kernels.mitchell.ratioR},q4=${row.kernels.mitchell.q4} | bc:res=${row.kernels.bc025.residStdR},mad=${row.kernels.bc025.plainMad},ratio=${row.kernels.bc025.ratioR},q4=${row.kernels.bc025.q4}`);
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 1)); // checkpoint sau mỗi cặp
}
console.log(`Xong sau ${((Date.now() - t0) / 1000).toFixed(0)} s. Ứng viên Q4 (cả 3 kernel): ${report.candidates.length}`);
for (const c of report.candidates) console.log(`  Q4-CANDIDATE: ${JSON.stringify(c)}`);
console.log(`Ghi ${OUT}`);
