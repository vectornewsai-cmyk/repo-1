#!/usr/bin/env node
/**
 * r77e9-upscale-kernel.mjs — Phase 9 đợt 77, luồng E9: probe kernel
 * upscale của Chrome tại w2560 (scale 1,132 — rect 1449×815).
 *
 * Nợ: phân tích full-pixel E9 cho thấy noise w2560 LỆCH-THỐNG-KÊ cả 2
 * mức dưới trilinear (Δkurt R 0,38/0,43, ngưỡng 0,35) trong khi std ratio
 * (1,03–1,05) và Δcorr (≤0,095) đều đạt — chỉ kurtosis lệch. Tại upscale,
 * trilinear suy biến thành 1-kernel tam giác (λ*=0), nên nghi ngờ kernel
 * upscale thật của Chrome (drawImage smoothing "high") không phải tam
 * giác mà là cubic/Lanczos. Probe này resample frame render bằng 5 kernel
 * ứng viên qua resamplePlane (chrome-resample.mjs, kernel cắm được) rồi
 * so delta stats với snapshot headed mới — kernel nào cho Δkurt ≤ 0,35
 * cả 2 mức mà không phá plain MAD thì thắng.
 *
 * Chỉ đo, KHÔNG sửa chrome-resample.mjs hay code production: nếu có
 * kernel thắng, LIMITS ghi đề xuất cho đợt sau (nối vào harness như
 * phương pháp mới), không tự đổi mô hình chung ở đây (đổi đó ảnh hưởng
 * mọi verdict dùng chrome-resample — cần đợt riêng kiểm chứng lại).
 * Chạy (từ gốc repo): node apps/web/scripts/r77e9-upscale-kernel.mjs
 * KHÔNG push/tag/binary/workflow.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const E9 = path.join(GOAL, "round77-e9");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const VW = 1449, VH = 815, SW = 1280, SH = 720;

// ---------- kernel ứng viên (đối số x tính theo pixel nguồn, h=1) ----------
function triangle(x) { const a = Math.abs(x); return a < 1 ? 1 - a : 0; }
function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
function mitchell(x) { return bcCubic(x, 1 / 3, 1 / 3); }
function catrom(x) { return bcCubic(x, 0, 0.5); }
function bspline(x) { return bcCubic(x, 1, 0); }
function sinc(x) { return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); }
function lanczos2(x) { const a = Math.abs(x); return a < 2 ? sinc(x) * sinc(x / 2) : 0; }
const KERNELS = { triangle, mitchell, catrom, bspline, lanczos2 };

// ---------- helpers thống kê (sao chép từ r77e9-fullpixel-analyze.mjs) ----------
function channelStats(d) {
  const n = d.length / 3;
  const out = { std: [], kurt: [], corr: [] };
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) { let s = 0; for (let i = c; i < d.length; i += 3) s += d[i]; mean[c] = s / n; }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) { const v = d[i] - mean[c]; s2 += v * v; s4 += v * v * v * v; }
    const std = Math.sqrt(s2 / n);
    out.std.push(+std.toFixed(2));
    out.kurt.push(std > 0 ? +(s4 / n / (std ** 4) - 3).toFixed(2) : 0);
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(out.std[a] > 0 && out.std[b] > 0 ? +(s / n / (out.std[a] * out.std[b])).toFixed(3) : 0);
  }
  return out;
}
function deltaStats(pp, pn, rp, rn, d0) {
  const n = pp.length / 3;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) {
    dP[i] = pn[i] - pp[i] - (d0 ? d0[i] : 0);
    dR[i] = rn[i] - rp[i];
  }
  const preview = channelStats(dP), render = channelStats(dR);
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
  const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
  const ok = ratios.every((r) => r >= 0.85 && r <= 1.18) && dKurt.every((x) => x <= 0.35) && dCorr.every((x) => x <= 0.12);
  return { stdRatio: ratios, kurtDiff: dKurt, corrDiff: dCorr, verdict: ok ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ" };
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
// Resample 1 plane với kernel cắm được — mirror resamplePlane
// (chrome-resample.mjs, kernel tam giác hardcode) nhưng truyền kernel
// vào chromeWeights1D; cùng quy ước toạ độ (S=(i+0.5)/s, h=chromeStretch).
function resamplePlaneKernel(src, srcW, srcH, dstW, dstH, scaleX, scaleY, kernel) {
  const tmp = new Float64Array(dstW * srcH);
  const wCacheX = new Array(dstW);
  for (let i = 0; i < dstW; i++) wCacheX[i] = chromeWeights1D(i, scaleX, srcW, kernel);
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
  for (let i = 0; i < dstH; i++) wCacheY[i] = chromeWeights1D(i, scaleY, srcH, kernel);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of wCacheY[i]) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleRgbKernel(rgb, kernel) {
  const planes = [];
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(SW * SH);
    for (let i = 0; i < SW * SH; i++) pl[i] = rgb[i * 3 + c];
    planes.push(pl);
  }
  const out = Buffer.alloc(VW * VH * 3);
  const sx = VW / SW, sy = VH / SH;
  for (let c = 0; c < 3; c++) {
    const r = resamplePlaneKernel(planes[c], SW, SH, VW, VH, sx, sy, kernel);
    for (let i = 0; i < VW * VH; i++) {
      const v = Math.round(r[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }

function main() {
  const doc = JSON.parse(fs.readFileSync(path.join(E9, "headed-w2560x1440", "r77e9-snaps-w2560x1440.json"), "utf8"));
  const snaps = doc.snaps["test-pattern"];
  const prev = {};
  for (const v of ["plain", "noise05", "noise10"]) prev[v] = b64ToRgb(snaps[v].rgbB64);
  const fullRgb = {};
  for (const v of ["plain", "noise05", "noise10"]) fullRgb[v] = fs.readFileSync(path.join(R66T3, `fullrgb-${v}.raw`));
  // d0: chỉ dùng cho chế độ có-d0 đối chiếu — trường trơn nên kernel
  // resample không ảnh hưởng đáng kể; ở đây chỉ đo không-d0 (cổng G12
  // full-pixel w2560 đã quyết KHÔNG áp d0, ratioR 1,23).
  const report = { window: "w2560", rect: `${VW}x${VH}`, scale: VW / SW, kernels: {} };
  console.log(`w2560 upscale ${SW}x${SH} -> ${VW}x${VH} (scale ${(VW / SW).toFixed(4)}), snapshot headed mới`);
  for (const [name, kernel] of Object.entries(KERNELS)) {
    const rend = {};
    for (const v of ["plain", "noise05", "noise10"]) rend[v] = resampleRgbKernel(fullRgb[v], kernel);
    const plain = absMad(prev.plain, rend.plain);
    const n05 = deltaStats(prev.plain, prev.noise05, rend.plain, rend.noise05, null);
    const n10 = deltaStats(prev.plain, prev.noise10, rend.plain, rend.noise10, null);
    report.kernels[name] = { plain, noise05: n05, noise10: n10 };
    console.log(`  ${name}: plain MAD=${plain.mad} le8=${(plain.le8 * 100).toFixed(1)}% | n05 ${n05.verdict} std${JSON.stringify(n05.stdRatio)} Δkurt${JSON.stringify(n05.kurtDiff)} Δcorr${JSON.stringify(n05.corrDiff)} | n10 ${n10.verdict} std${JSON.stringify(n10.stdRatio)} Δkurt${JSON.stringify(n10.kurtDiff)} Δcorr${JSON.stringify(n10.corrDiff)}`);
  }
  writeFileEpermRetry(path.join(E9, "r77e9-upscale-kernel.json"), JSON.stringify(report, null, 2));
  console.log(`JSON probe: ${path.join(E9, "r77e9-upscale-kernel.json")}`);

  // Lưới hẹp quanh Mitchell (B,C) — n05 đã KHỚP dưới Mitchell, n10 còn
  // Δkurt R 0,36 (vượt 0,01). Tìm xem có (B,C) nào cho cả 2 mức KHỚP
  // mà không phá plain MAD không; nếu không, Mitchell giữ là tốt nhất.
  console.log(`\n--- lưới (B,C) quanh Mitchell, không-d0 ---`);
  const grid = [[1 / 3, 1 / 3], [0.25, 0.375], [0.4, 0.3], [1 / 3, 0.4], [0.25, 1 / 3], [0.4, 1 / 3]];
  const gridOut = {};
  for (const [B, C] of grid) {
    const kernel = (x) => bcCubic(x, B, C);
    const rend = {};
    for (const v of ["plain", "noise05", "noise10"]) rend[v] = resampleRgbKernel(fullRgb[v], kernel);
    const plain = absMad(prev.plain, rend.plain);
    const n05 = deltaStats(prev.plain, prev.noise05, rend.plain, rend.noise05, null);
    const n10 = deltaStats(prev.plain, prev.noise10, rend.plain, rend.noise10, null);
    gridOut[`B=${B.toFixed(3)},C=${C.toFixed(3)}`] = { plain, noise05: n05, noise10: n10 };
    console.log(`  B=${B.toFixed(3)} C=${C.toFixed(3)}: plain MAD=${plain.mad} le8=${(plain.le8 * 100).toFixed(1)}% | n05 ${n05.verdict} Δkurt${JSON.stringify(n05.kurtDiff)} | n10 ${n10.verdict} Δkurt${JSON.stringify(n10.kurtDiff)}`);
  }
  writeFileEpermRetry(path.join(E9, "r77e9-upscale-kernel-grid.json"), JSON.stringify(gridOut, null, 2));
  console.log(`JSON lưới: ${path.join(E9, "r77e9-upscale-kernel-grid.json")}`);
}
main();
