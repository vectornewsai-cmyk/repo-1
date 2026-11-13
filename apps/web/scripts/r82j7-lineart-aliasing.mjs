#!/usr/bin/env node
/**
 * r82j7-lineart-aliasing.mjs — Phase 9 đợt 82, luồng J7: lineart2px aliasing
 * — delta MAD ~4,1 không phụ thuộc kernel (nợ I3 §4.4 / §7.3).
 *
 * Dùng lại dữ liệu H3 (đợt 80) + G5 (đợt 79), KHÔNG chạy headed mới ở
 * script này. Câu hỏi: lệch delta trên đường mảnh 1–2px là do (a) lấy mẫu/
 * pha subpixel, (b) độ dày dưới ngưỡng Nyquist ở thang upscale, hay (c)
 * đường effect khác — và nó có ảnh hưởng nội dung tự nhiên không?
 *
 * Datasets (snaps headed + frame render fullrgb):
 *   L1px  G5 lineart 1px: 1280 @0,632 / @1,132; 640 @1,264 / @2,264
 *   L2px  H3 lineart 2px: 1280 @1,132; 640 @1,264 / @2,264
 *   NAT   G5 textsmall/photo/videoframe @1,132 (+ textsmall640 @1,264)
 *
 * Thí nghiệm:
 *   V0  tái lập delta MAD tri/BC (+Mitchell/Catmull cho 2 dataset 640@1,264)
 *   E1  profile qua 1 đường lưới dọc: project size (d_render vs d_model)
 *       + viewport (dp_prev vs tri/BC(d_render)) — đỉnh, FWHM, năng lượng,
 *       và độ rộng biểu kiến của đường ở plain.
 *   E2  fit pha: shift δ tối ưu cho tri(d_render) khớp dp_prev (profile +
 *       toàn khung), riêng trục X (đường dọc) và trục Y (đường ngang).
 *   E3  ngân sách năng lượng: sum|dp_prev| vs sum|tri(d_render)| toàn khung
 *       và trong vùng lân cận đường.
 *   E4  độ rộng đường plain: prev.plain vs tri(R_plain) — đường Chrome có
 *       mỏng/dày hơn mô hình không (aliasing thừa kế từ plain)?
 *   E5  luật độ dày trong miền mô hình: lưới tổng hợp 1/2/3/4px, applySharpen
 *       thật + resample tri — delta mô hình đổi thế nào theo độ dày?
 *   E6  nội dung tự nhiên: delta MAD + MAD riêng trên pixel "cạnh mảnh"
 *       (|d_render| project > 8) vs pixel phẳng — bound ảnh hưởng thật.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r82j7-lineart-aliasing.mjs
 * Env: R82J7_OUT (mặc định hidden_files/round82-j7/r82j7-aliasing.json).
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
const OUT = process.env.R82J7_OUT || path.join(GOAL, "round82-j7", "r82j7-aliasing.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// ---------- kernel ----------
function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const KERNELS = {
  tri: triangleKernel,
  bc025_0375: (x) => bcCubic(x, 0.25, 0.375),
  mitchell: (x) => bcCubic(x, 1 / 3, 1 / 3),
  catmull: (x) => bcCubic(x, 0, 0.5),
};

// ---------- resample (sao từ I3) ----------
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
function resamplePlaneFloat(src, srcW, srcH, dstW, dstH, kernel) {
  return resamplePlaneKernel(src, srcW, srcH, dstW, dstH, dstW / srcW, dstH / srcH, kernel);
}
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const r = resamplePlaneFloat(pl, srcW, srcH, dstW, dstH, kernel);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(r[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}

// ---------- helpers ----------
function mad3(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]); sum += d; if (d > dmax) dmax = d; }
    if (dmax <= 8) le8++;
  }
  return { mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4) };
}
function deltaMadFloat(dp, dr) {
  let sum = 0;
  for (let i = 0; i < dp.length; i++) sum += Math.abs(dp[i] - dr[i]);
  return +(sum / dp.length).toFixed(3);
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
  for (let i = 0; i < w * h; i++) { out[i * 3] = rgba[i * 4]; out[i * 3 + 1] = rgba[i * 4 + 1]; out[i * 3 + 2] = rgba[i * 4 + 2]; }
  return out;
}
// Profile X trung bình theo toàn bộ hàng, kênh R (arr: Float64Array n*3 hoặc Buffer RGB24).
function xProfile(arr, w, h, x0, x1) {
  const prof = [];
  for (let x = x0; x < x1; x++) {
    let s = 0;
    for (let y = 0; y < h; y++) s += arr[(y * w + x) * 3];
    prof.push(+(s / h).toFixed(1));
  }
  return prof;
}
// Profile Y trung bình theo toàn bộ cột, kênh R.
function yProfile(arr, w, h, y0, y1) {
  const prof = [];
  for (let y = y0; y < y1; y++) {
    let s = 0;
    for (let x = 0; x < w; x++) s += arr[(y * w + x) * 3];
    prof.push(+(s / w).toFixed(1));
  }
  return prof;
}
// Đặc trưng profile đường: dip (min), lobe (max ngoài vùng dip ±2), FWHM của dip, năng lượng.
function profileFeatures(prof, centerIdx) {
  const dip = Math.min(...prof);
  const dipIdx = prof.indexOf(dip);
  let lobe = -Infinity;
  for (let i = 0; i < prof.length; i++) if (Math.abs(i - dipIdx) > 2 && prof[i] > lobe) lobe = prof[i];
  // FWHM: số điểm liên tục quanh dip có giá trị < dip/2 (dip âm)
  const half = dip / 2;
  let lo = dipIdx, hi = dipIdx;
  while (lo - 1 >= 0 && prof[lo - 1] < half) lo--;
  while (hi + 1 < prof.length && prof[hi + 1] < half) hi++;
  const fwhm = hi - lo + 1;
  let energy = 0, signed = 0;
  for (const v of prof) { energy += Math.abs(v); signed += v; }
  return { dip: +dip.toFixed(1), dipIdx, lobe: +lobe.toFixed(1), fwhm, energy: +energy.toFixed(1), signed: +signed.toFixed(1) };
}
// Nội suy tuyến tính profile tại vị trí thực x (chỉ số thực).
function interpProf(prof, x) {
  const i = Math.floor(x);
  if (i < 0) return prof[0];
  if (i >= prof.length - 1) return prof[prof.length - 1];
  const f = x - i;
  return prof[i] * (1 - f) + prof[i + 1] * f;
}
// Fit shift δ: dịch profile model đi δ (theo chỉ số) để khớp profile đích, MAD nhỏ nhất.
function fitShift(target, model, dMin, dMax, step) {
  let best = null;
  for (let d = dMin; d <= dMax + 1e-9; d += step) {
    let sum = 0;
    for (let i = 0; i < target.length; i++) sum += Math.abs(target[i] - interpProf(model, i - d));
    const mad = sum / target.length;
    if (!best || mad < best.mad) best = { delta: +d.toFixed(2), mad: +mad.toFixed(3) };
  }
  const mad0 = (() => { let s = 0; for (let i = 0; i < target.length; i++) s += Math.abs(target[i] - model[i]); return +(s / target.length).toFixed(3); })();
  return { ...best, madAt0: mad0 };
}
// Độ rộng biểu kiến của đường tối trên profile plain: số px liên tục < 127,5 quanh tâm.
function apparentWidth(prof, centerIdx, thresh = 127.5) {
  let lo = centerIdx, hi = centerIdx;
  if (prof[centerIdx] >= thresh) return 0;
  while (lo - 1 >= 0 && prof[lo - 1] < thresh) lo--;
  while (hi + 1 < prof.length && prof[hi + 1] < thresh) hi++;
  return hi - lo + 1;
}

const DATASETS = [
  { key: "L1px-1280@0.632", kind: "lineart", thick: 1, snaps: path.join(G5, "headed-w1920x1080-p1280x720", "r79g5-snaps-w1920x1080-p1280x720.json"), content: "lineart", render: path.join(G5, "render", "lineart"), projW: 1280, projH: 720, kernels4: false },
  { key: "L1px-1280@1.132", kind: "lineart", thick: 1, snaps: path.join(G5, "headed-w2560x1440-p1280x720", "r79g5-snaps-w2560x1440-p1280x720.json"), content: "lineart", render: path.join(G5, "render", "lineart"), projW: 1280, projH: 720, kernels4: false },
  { key: "L1px-640@1.264", kind: "lineart", thick: 1, snaps: path.join(G5, "headed-w1920x1080-p640x360", "r79g5-snaps-w1920x1080-p640x360.json"), content: "lineart640", render: path.join(G5, "render", "lineart640"), projW: 640, projH: 360, kernels4: true },
  { key: "L1px-640@2.264", kind: "lineart", thick: 1, snaps: path.join(G5, "headed-w2560x1440-p640x360", "r79g5-snaps-w2560x1440-p640x360.json"), content: "lineart640", render: path.join(G5, "render", "lineart640"), projW: 640, projH: 360, kernels4: false },
  { key: "L2px-1280@1.132", kind: "lineart", thick: 2, snaps: path.join(H3, "headed-w2560x1440-p1280x720-ph1", "r80h3-snaps-w2560x1440-p1280x720.json"), content: "lineart2px", render: path.join(H3, "render", "lineart2px"), projW: 1280, projH: 720, kernels4: false },
  { key: "L2px-640@1.264", kind: "lineart", thick: 2, snaps: path.join(H3, "headed-w1920x1080-p640x360-ph1", "r80h3-snaps-w1920x1080-p640x360.json"), content: "lineart2px-640", render: path.join(H3, "render", "lineart2px-640"), projW: 640, projH: 360, kernels4: true },
  { key: "L2px-640@2.264", kind: "lineart", thick: 2, snaps: path.join(H3, "headed-w2560x1440-p640x360-ph1", "r80h3-snaps-w2560x1440-p640x360.json"), content: "lineart2px-640", render: path.join(H3, "render", "lineart2px-640"), projW: 640, projH: 360, kernels4: false },
  { key: "textsmall-1280@1.132", kind: "natural", snaps: path.join(G5, "headed-w2560x1440-p1280x720", "r79g5-snaps-w2560x1440-p1280x720.json"), content: "textsmall", render: path.join(G5, "render", "textsmall"), projW: 1280, projH: 720, kernels4: false },
  { key: "textsmall640@1.264", kind: "natural", snaps: path.join(G5, "headed-w1920x1080-p640x360", "r79g5-snaps-w1920x1080-p640x360.json"), content: "textsmall640", render: path.join(G5, "render", "textsmall640"), projW: 640, projH: 360, kernels4: false },
  { key: "photo-1280@1.132", kind: "natural", snaps: path.join(G5, "headed-w2560x1440-p1280x720", "r79g5-snaps-w2560x1440-p1280x720.json"), content: "photo", render: path.join(G5, "render", "photo"), projW: 1280, projH: 720, kernels4: false },
  { key: "videoframe-1280@1.132", kind: "natural", snaps: path.join(G5, "headed-w2560x1440-p1280x720", "r79g5-snaps-w2560x1440-p1280x720.json"), content: "videoframe", render: path.join(G5, "render", "videoframe"), projW: 1280, projH: 720, kernels4: false },
];

const report = { generated: new Date().toISOString(), datasets: {} };

for (const ds of DATASETS) {
  const t0 = Date.now();
  const doc = JSON.parse(fs.readFileSync(ds.snaps, "utf8"));
  const projW = ds.projW, projH = ds.projH;
  const snaps = doc.snaps[ds.content];
  const rect = snaps.plain.rect;
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const scale = rect.scale;
  console.log(`\n######## ${ds.key}: rect ${vw}x${vh} scale=${scale.toFixed(4)} (proj ${projW}x${projH}) ########`);
  const rep = { scale: +scale.toFixed(4), vw, vh, projW, projH };
  const fullRgb = {};
  for (const v of ["plain", "sharp05", "sharp10"]) {
    const p = path.join(ds.render, `fullrgb-${v}.raw`);
    const buf = fs.readFileSync(p);
    if (buf.length !== projW * projH * 3) throw new Error(`${p} sai kích thước (${buf.length})`);
    fullRgb[v] = buf;
  }
  const prev = {};
  for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
  if (prev.plain.length !== vw * vh * 3) throw new Error(`${ds.key} snap plain sai kích thước`);

  // ---- V0: delta MAD tri/BC (+Mitchell/Catmull khi kernels4) ----
  const kList = ds.kernels4 ? ["tri", "bc025_0375", "mitchell", "catmull"] : ["tri", "bc025_0375"];
  const rend = {};
  const v0 = {};
  for (const k of kList) {
    rend[k] = {};
    for (const v of ["plain", "sharp05", "sharp10"]) rend[k][v] = resampleRgbKernel(fullRgb[v], projW, projH, vw, vh, KERNELS[k]);
    const plainMad = mad3(prev.plain, rend[k].plain);
    const d05 = deltaMadFloat(deltaOf(prev.sharp05, prev.plain), deltaOf(rend[k].sharp05, rend[k].plain));
    const d10 = deltaMadFloat(deltaOf(prev.sharp10, prev.plain), deltaOf(rend[k].sharp10, rend[k].plain));
    v0[k] = { plainMad: plainMad.mad, plainLe8: plainMad.le8, delta05: d05, delta10: d10 };
    console.log(`  [V0 ${k}] plain MAD=${plainMad.mad} le8=${plainMad.le8} | DELTA 05/10=${d05}/${d10}`);
  }
  rep.V0 = v0;

  // ---- E1 project-size: d_model vs d_render (đường effect có khớp không) ----
  const e1 = {};
  const dRender = {}, dModel = {};
  for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
    const img = { width: projW, height: projH, data: rgb24ToRgba(fullRgb.plain, projW, projH) };
    applySharpen(img, intensity);
    const modelSharp = rgbaToRgb24(img.data, projW, projH);
    dRender[v] = deltaOf(fullRgb[v], fullRgb.plain);
    dModel[v] = deltaOf(modelSharp, fullRgb.plain);
    e1[v] = { mad_dModel_vs_dRender: deltaMadFloat(dModel[v], dRender[v]) };
    console.log(`  [E1 ${v}] project-size MAD(d_model, d_render)=${e1[v].mad_dModel_vs_dRender}`);
  }
  rep.E1_projectSizeDelta = e1;

  // ---- E2/E3: delta viewport float tri/BC + năng lượng ----
  const dpPrev = { sharp05: deltaOf(prev.sharp05, prev.plain), sharp10: deltaOf(prev.sharp10, prev.plain) };
  const upDelta = {}; // upDelta[k][v] = Float64Array viewport
  for (const k of ["tri", "bc025_0375"]) {
    upDelta[k] = {};
    for (const v of ["sharp05", "sharp10"]) {
      const up = new Float64Array(vw * vh * 3);
      for (let c = 0; c < 3; c++) {
        const pl = new Float64Array(projW * projH);
        for (let i = 0; i < projW * projH; i++) pl[i] = dRender[v][i * 3 + c];
        const rs = resamplePlaneFloat(pl, projW, projH, vw, vh, KERNELS[k]);
        for (let i = 0; i < vw * vh; i++) up[i * 3 + c] = rs[i];
      }
      upDelta[k][v] = up;
    }
  }
  const e3 = {};
  for (const v of ["sharp05", "sharp10"]) {
    const sumAbs = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i]); return s; };
    const row = {
      sumAbs_dpPrev: Math.round(sumAbs(dpPrev[v])),
      sumAbs_tri_dRender: Math.round(sumAbs(upDelta.tri[v])),
      sumAbs_bc_dRender: Math.round(sumAbs(upDelta.bc025_0375[v])),
      mad_tri: deltaMadFloat(dpPrev[v], upDelta.tri[v]),
      mad_bc: deltaMadFloat(dpPrev[v], upDelta.bc025_0375[v]),
    };
    row.ratio_sumAbs_dpPrev_over_tri = +(row.sumAbs_dpPrev / row.sumAbs_tri_dRender).toFixed(3);
    e3[v] = row;
    console.log(`  [E3 ${v}] sum|dp|=${row.sumAbs_dpPrev} sum|tri(d)|=${row.sumAbs_tri_dRender} tỉ lệ=${row.ratio_sumAbs_dpPrev_over_tri} | MAD tri/BC=${row.mad_tri}/${row.mad_bc}`);
  }
  rep.E3_energy = e3;

  // ---- E6 (natural): MAD riêng pixel cạnh mảnh vs pixel phẳng ----
  if (ds.kind === "natural") {
    const e6 = {};
    for (const v of ["sharp05", "sharp10"]) {
      // mask project-size: pixel có |d_render| > 8 ở bất kỳ kênh nào
      const maskP = new Uint8Array(projW * projH);
      let nEdge = 0;
      for (let i = 0; i < projW * projH; i++) {
        let m = 0;
        for (let c = 0; c < 3; c++) if (Math.abs(dRender[v][i * 3 + c]) > 8) { m = 1; break; }
        maskP[i] = m; nEdge += m;
      }
      // mask viewport: nearest (pixel viewport lấy mask của pixel nguồn gần nhất)
      let sumE = 0, nE = 0, sumF = 0, nF = 0;
      for (let y = 0; y < vh; y++) {
        const sy = Math.min(projH - 1, Math.floor((y + 0.5) / scale));
        for (let x = 0; x < vw; x++) {
          const sx = Math.min(projW - 1, Math.floor((x + 0.5) / scale));
          const isEdge = maskP[sy * projW + sx] === 1;
          let d = 0;
          for (let c = 0; c < 3; c++) d += Math.abs(dpPrev[v][(y * vw + x) * 3 + c] - upDelta.tri[v][(y * vw + x) * 3 + c]);
          if (isEdge) { sumE += d; nE++; } else { sumF += d; nF++; }
        }
      }
      e6[v] = {
        edgeFrac_project: +(nEdge / (projW * projH)).toFixed(4),
        mad_edgePixels: nE ? +(sumE / (nE * 3)).toFixed(3) : null,
        mad_flatPixels: nF ? +(sumF / (nF * 3)).toFixed(3) : null,
        mad_global: e3[v].mad_tri,
      };
      console.log(`  [E6 ${v}] pixel cạnh: ${(e6[v].edgeFrac_project * 100).toFixed(2)}% khung | MAD cạnh=${e6[v].mad_edgePixels} phẳng=${e6[v].mad_flatPixels} toàn cục=${e6[v].mad_global}`);
    }
    rep.E6_naturalEdgeBreakdown = e6;
  }

  // ---- E1/E2/E4: profile đường (chỉ lineart) ----
  if (ds.kind === "lineart") {
    const step = projW >= 1280 ? 16 : 8;
    const lineX = projW >= 1280 ? 64 : 32; // đường lưới dọc thứ 4 (tránh rect/diagonal xanh)
    const lineY = projW >= 1280 ? 64 : 32; // đường lưới ngang thứ 4
    const prof = {};
    // Project-size profile qua đường dọc (d_render/d_model sharp10, R)
    const psX0 = lineX - 8, psX1 = lineX + 8;
    const psProfRender = xProfile(dRender.sharp10, projW, projH, psX0, psX1);
    const psProfModel = xProfile(dModel.sharp10, projW, projH, psX0, psX1);
    prof.project_x = { range: [psX0, psX1 - 1], d_render: psProfRender, d_model: psProfModel,
      feat_render: profileFeatures(psProfRender, 8), feat_model: profileFeatures(psProfModel, 8) };
    console.log(`  [E1-prof project] d_render = [${psProfRender.join(", ")}]`);
    console.log(`  [E1-prof project] d_model  = [${psProfModel.join(", ")}]`);
    // Viewport profile qua đường dọc
    const vcX = lineX * scale;
    const vpX0 = Math.max(0, Math.round(vcX) - 12), vpX1 = Math.min(vw, Math.round(vcX) + 13);
    const vpProfPrev = xProfile(dpPrev.sharp10, vw, vh, vpX0, vpX1);
    const vpProfTri = xProfile(upDelta.tri.sharp10, vw, vh, vpX0, vpX1);
    const vpProfBc = xProfile(upDelta.bc025_0375.sharp10, vw, vh, vpX0, vpX1);
    const cIdx = Math.round(vcX) - vpX0;
    prof.viewport_x = { range: [vpX0, vpX1 - 1], centerIdx: cIdx, dp_prev: vpProfPrev, tri_dRender: vpProfTri, bc_dRender: vpProfBc,
      feat_dpPrev: profileFeatures(vpProfPrev, cIdx), feat_tri: profileFeatures(vpProfTri, cIdx), feat_bc: profileFeatures(vpProfBc, cIdx),
      fitShift_tri: fitShift(vpProfPrev, vpProfTri, -2, 2, 0.05), fitShift_bc: fitShift(vpProfPrev, vpProfBc, -2, 2, 0.05) };
    console.log(`  [E1-prof viewport] dp_prev      = [${vpProfPrev.join(", ")}]`);
    console.log(`  [E1-prof viewport] tri(d_render)= [${vpProfTri.join(", ")}]`);
    console.log(`  [E1-prof viewport] bc(d_render) = [${vpProfBc.join(", ")}]`);
    console.log(`  [E1-feat] dp dip=${prof.viewport_x.feat_dpPrev.dip} FWHM=${prof.viewport_x.feat_dpPrev.fwhm} E=${prof.viewport_x.feat_dpPrev.energy} | tri dip=${prof.viewport_x.feat_tri.dip} FWHM=${prof.viewport_x.feat_tri.fwhm} E=${prof.viewport_x.feat_tri.energy} | fitShift tri: δ=${prof.viewport_x.fitShift_tri.delta} MAD ${prof.viewport_x.fitShift_tri.madAt0}→${prof.viewport_x.fitShift_tri.mad}`);
    // Viewport profile qua đường NGANG (trục Y) — kiểm tra pha theo Y
    const vcY = lineY * scale;
    const vpY0 = Math.max(0, Math.round(vcY) - 12), vpY1 = Math.min(vh, Math.round(vcY) + 13);
    const vpProfPrevY = yProfile(dpPrev.sharp10, vw, vh, vpY0, vpY1);
    const vpProfTriY = yProfile(upDelta.tri.sharp10, vw, vh, vpY0, vpY1);
    const cIdxY = Math.round(vcY) - vpY0;
    prof.viewport_y = { range: [vpY0, vpY1 - 1], centerIdx: cIdxY, dp_prev: vpProfPrevY, tri_dRender: vpProfTriY,
      feat_dpPrev: profileFeatures(vpProfPrevY, cIdxY), feat_tri: profileFeatures(vpProfTriY, cIdxY),
      fitShift_tri: fitShift(vpProfPrevY, vpProfTriY, -2, 2, 0.05) };
    console.log(`  [E1-prof viewport Y] dp_prev=[${vpProfPrevY.join(", ")}] tri=[${vpProfTriY.join(", ")}] fitShift δ=${prof.viewport_y.fitShift_tri.delta} MAD ${prof.viewport_y.fitShift_tri.madAt0}→${prof.viewport_y.fitShift_tri.mad}`);
    // E4: độ rộng biểu kiến đường plain
    const plainProfProj = xProfile(fullRgb.plain, projW, projH, psX0, psX1);
    const plainProfPrev = xProfile(prev.plain, vw, vh, vpX0, vpX1);
    const plainProfTri = xProfile(rend.tri.plain, vw, vh, vpX0, vpX1);
    const plainProfBc = xProfile(rend.bc025_0375.plain, vw, vh, vpX0, vpX1);
    const e4 = {
      width_project_px: apparentWidth(plainProfProj, 8),
      width_prev_viewport_px: apparentWidth(plainProfPrev, cIdx),
      width_tri_viewport_px: apparentWidth(plainProfTri, cIdx),
      width_bc_viewport_px: apparentWidth(plainProfBc, cIdx),
      plainProf_project: plainProfProj, plainProf_prev: plainProfPrev, plainProf_tri: plainProfTri,
      mad_bPlain_lineWindow: (() => { let s = 0; for (let i = 0; i < plainProfPrev.length; i++) s += Math.abs(plainProfPrev[i] - plainProfTri[i]); return +(s / plainProfPrev.length).toFixed(2); })(),
    };
    console.log(`  [E4] rộng đường plain: project=${e4.width_project_px}px | prev=${e4.width_prev_viewport_px}px viewport | tri=${e4.width_tri_viewport_px}px | BC=${e4.width_bc_viewport_px}px | MAD b_plain trong cửa sổ=${e4.mad_bPlain_lineWindow}`);
    console.log(`  [E4] plain project profile = [${plainProfProj.join(", ")}]`);
    console.log(`  [E4] plain prev profile     = [${plainProfPrev.join(", ")}]`);
    console.log(`  [E4] plain tri profile      = [${plainProfTri.join(", ")}]`);
    rep.E1_profiles = prof;
    rep.E4_plainLineWidth = e4;
    // E3b: năng lượng chỉ trong vùng lân cận đường (mask project: trong 3px của đường lưới)
    const maskP = new Uint8Array(projW * projH);
    for (let y = 0; y < projH; y++) for (let x = 0; x < projW; x++) {
      const nearV = (x % step) <= 3 || (x % step) >= step - 3;
      const nearH = (y % step) <= 3 || (y % step) >= step - 3;
      if (nearV || nearH) maskP[y * projW + x] = 1;
    }
    const e3b = {};
    for (const v of ["sharp05", "sharp10"]) {
      let sPrev = 0, sTri = 0, n = 0;
      for (let y = 0; y < vh; y++) {
        const sy = Math.min(projH - 1, Math.floor((y + 0.5) / scale));
        for (let x = 0; x < vw; x++) {
          const sx = Math.min(projW - 1, Math.floor((x + 0.5) / scale));
          if (!maskP[sy * projW + sx]) continue;
          n++;
          for (let c = 0; c < 3; c++) { sPrev += Math.abs(dpPrev[v][(y * vw + x) * 3 + c]); sTri += Math.abs(upDelta.tri[v][(y * vw + x) * 3 + c]); }
        }
      }
      e3b[v] = { pixels: n, meanAbs_dpPrev: +(sPrev / (n * 3)).toFixed(3), meanAbs_tri: +(sTri / (n * 3)).toFixed(3), ratio: +(sPrev / sTri).toFixed(3) };
      console.log(`  [E3b ${v}] vùng lân cận đường: mean|dp|=${e3b[v].meanAbs_dpPrev} mean|tri|=${e3b[v].meanAbs_tri} tỉ lệ=${e3b[v].ratio}`);
    }
    rep.E3b_lineNeighborhood = e3b;
  }

  report.datasets[ds.key] = rep;
  console.log(`  (xong ${ds.key} trong ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

// ---------- E5: luật độ dày trong miền mô hình (lưới tổng hợp thuần) ----------
console.log("\n######## E5: luật độ dày — lưới tổng hợp 1/2/3/4px (miền mô hình) ########");
const e5 = {};
function synthGrid(w, h, step, thick) {
  const rgb = Buffer.alloc(w * h * 3, 255);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const onV = (x % step) < thick, onH = (y % step) < thick;
    if (onV || onH) { const i = (y * w + x) * 3; rgb[i] = 0; rgb[i + 1] = 0; rgb[i + 2] = 0; }
  }
  return rgb;
}
for (const [w, h, step, vw2, vh2] of [[640, 360, 8, 809, 455], [1280, 720, 16, 1449, 815]]) {
  const scale = vw2 / w;
  for (const thick of [1, 2, 3, 4]) {
    const plain = synthGrid(w, h, step, thick);
    const row = { scale: +scale.toFixed(4) };
    for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
      const img = { width: w, height: h, data: rgb24ToRgba(plain, w, h) };
      applySharpen(img, intensity);
      const modelSharp = rgbaToRgb24(img.data, w, h);
      const dModel = deltaOf(modelSharp, plain);
      // resample tri delta lên viewport
      const up = new Float64Array(vw2 * vh2 * 3);
      for (let c = 0; c < 3; c++) {
        const pl = new Float64Array(w * h);
        for (let i = 0; i < w * h; i++) pl[i] = dModel[i * 3 + c];
        const rs = resamplePlaneFloat(pl, w, h, vw2, vh2, KERNELS.tri);
        for (let i = 0; i < vw2 * vh2; i++) up[i * 3 + c] = rs[i];
      }
      // MAD toàn cục của model delta ở viewport (so với 0 — delta Chrome không có ở đây)
      let sum = 0;
      for (let i = 0; i < up.length; i++) sum += Math.abs(up[i]);
      const madViewport = +(sum / up.length).toFixed(3);
      // profile qua đường dọc x=32/64 (project) và viewport
      const lineX = w >= 1280 ? 64 : 32;
      const psProf = xProfile(dModel, w, h, lineX - 8, lineX + 8);
      const vcX = lineX * scale;
      const vpX0 = Math.max(0, Math.round(vcX) - 12), vpX1 = Math.min(vw2, Math.round(vcX) + 13);
      const vpProf = xProfile(up, vw2, vh2, vpX0, vpX1);
      const featPs = profileFeatures(psProf, 8);
      const featVp = profileFeatures(vpProf, Math.round(vcX) - vpX0);
      row[v] = { madViewport, projectDip: featPs.dip, projectEnergy: featPs.energy, viewportDip: featVp.dip, viewportFwhm: featVp.fwhm, viewportEnergy: featVp.energy, viewportSigned: featVp.signed };
      console.log(`  [E5 ${w}x${h} thick=${thick}px ${v}] model delta MAD viewport=${madViewport} | project dip=${featPs.dip} E=${featPs.energy} | viewport dip=${featVp.dip} FWHM=${featVp.fwhm} E=${featVp.energy} signed=${featVp.signed}`);
    }
    e5[`${w}x${h}-t${thick}`] = row;
  }
}
report.E5_syntheticThicknessLaw = e5;

writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nJSON: ${OUT}`);
