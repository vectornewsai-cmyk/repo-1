#!/usr/bin/env node
/**
 * r81i3-phase-blur-fit.mjs — Phase 9 đợt 81, luồng I3 (follow-up sau
 * r81i3-sharp-mechanism.mjs): phân biệt 2 cơ chế ứng viên cho "BC bù lệch
 * đường sharp":
 *   (A) LỆCH PHA: cạnh của Chrome lệch subpixel δ so với mô hình tam giác
 *       (dấu hiệu: b_plain có spike đơn đổi dấu ở mỗi cạnh — E8).
 *       Fit δ cho resample tam giác (S=(i+0.5)/s+δ) trên cả plain và delta:
 *       nếu cùng một δ làm plain MAD và delta MAD cùng giảm về mức BC thì
 *       cơ chế là pha, BC chỉ bù pha một cách tình cờ.
 *   (B) LÀM MỜ THÊM: đáp ứng thực của Chrome ở tần số của delta đặc hơn
 *       tam giác mô hình (dp_prev "phẳng" hơn tri(d_render): đỉnh thấp,
 *       vai cao). Test blur hậu-kỳ lên tri(d_render): nếu blur nhỏ đạt
 *       MAD ≈ BC thì cơ chế là làm mờ; BC bắt chước được độ phẳng đó trên
 *       mẫu đặc này.
 *   (C) ĐÁP ỨNG TẦN SỐ: đo gain/pha của tri vs BC trên sóng sin thuần tại
 *       các hài của mẫu delta (f = k/8 chu kỳ/px nguồn, k=1..3) ở đúng
 *       thang s=1,2639 — xem BC có dập hài nào mạnh hơn tri không (giải
 *       nghịch lý "kernel sharpen lại cho delta phẳng hơn").
 *   (D) ĐO δ TRỰC TIẾP: tương quan chéo subpixel giữa profile cạnh của
 *       snap_plain và tri(R_plain) trên sqw4-640.
 *
 * Chỉ dùng dữ liệu H3 sẵn có (run D w1920-p640, sqw4-640 + sqw32-640).
 * Chạy: node apps/web/scripts/r81i3-phase-blur-fit.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H3 = path.join(GOAL, "round80-h3");
const OUT = path.join(GOAL, "round81-i3", "r81i3-phase-blur-fit.json");

function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const BC = (x) => bcCubic(x, 0.25, 0.375);

// weights 1D với shift δ (đơn vị px nguồn): S = (i+0.5)/s + δ
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
function madFloat(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}
function deltaOf(a, b) {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}
// blur 1D tách được lên plane float (kênh R đã tách sẵn thành plane đơn)
function blurPlane(plane, w, h, k) {
  const r = (k.length - 1) / 2;
  const tmp = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0;
    for (let d = -r; d <= r; d++) { const xx = x + d < 0 ? 0 : x + d >= w ? w - 1 : x + d; s += k[d + r] * plane[y * w + xx]; }
    tmp[y * w + x] = s;
  }
  const out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0;
    for (let d = -r; d <= r; d++) { const yy = y + d < 0 ? 0 : y + d >= h ? h - 1 : y + d; s += k[d + r] * tmp[yy * w + x]; }
    out[y * w + x] = s;
  }
  return out;
}

const doc = JSON.parse(fs.readFileSync(path.join(H3, "headed-w1920x1080-p640x360-ph1", "r80h3-snaps-w1920x1080-p640x360.json"), "utf8"));
const projW = doc.projW, projH = doc.projH;
const result = { generated: new Date().toISOString(), contents: {} };

for (const content of ["sqw4-640", "sqw32-640"]) {
  const snaps = doc.snaps[content];
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const rdir = path.join(H3, "render", content);
  const fullRgb = {};
  for (const v of ["plain", "sharp05", "sharp10"]) fullRgb[v] = fs.readFileSync(path.join(rdir, `fullrgb-${v}.raw`));
  const prev = {};
  for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
  const crep = { rect: snaps.plain.rect };
  console.log(`\n=== ${content} (${vw}x${vh}) ===`);

  // delta thật ở viewport + d_render project-size (kênh R)
  const dpPrev = { sharp05: deltaOf(prev.sharp05, prev.plain), sharp10: deltaOf(prev.sharp10, prev.plain) };
  const dRender = {};
  for (const v of ["sharp05", "sharp10"]) {
    const pl = new Float64Array(projW * projH);
    for (let i = 0; i < projW * projH; i++) pl[i] = fullRgb[v][i * 3] - fullRgb.plain[i * 3];
    dRender[v] = pl;
  }
  const plainR = new Float64Array(projW * projH);
  for (let i = 0; i < projW * projH; i++) plainR[i] = fullRgb.plain[i * 3];
  const snapPlainR = new Float64Array(vw * vh);
  for (let i = 0; i < vw * vh; i++) snapPlainR[i] = prev.plain[i * 3];

  // ---- (A) fit shift δ ----
  const deltas = [-0.3, -0.25, -0.2, -0.15, -0.1, -0.07, -0.05, -0.03, -0.02, 0, 0.02, 0.03, 0.05, 0.07, 0.1, 0.15, 0.2, 0.25, 0.3];
  const fitA = { plain: [], delta05: [], delta10: [] };
  for (const d of deltas) {
    const upPlain = resamplePlaneShift(plainR, projW, projH, vw, vh, triangleKernel, d);
    const mPlain = madFloat(snapPlainR, upPlain);
    const row = { delta: d, plainMad: mPlain };
    for (const v of ["sharp05", "sharp10"]) {
      const up = resamplePlaneShift(dRender[v], projW, projH, vw, vh, triangleKernel, d);
      // dp_prev kênh R: lấy mỗi 3 phần tử
      const dpR = new Float64Array(vw * vh);
      for (let i = 0; i < vw * vh; i++) dpR[i] = dpPrev[v][i * 3];
      row[v === "sharp05" ? "delta05Mad" : "delta10Mad"] = madFloat(dpR, up);
    }
    fitA.plain.push({ d, mad: mPlain });
    fitA.delta05.push({ d, mad: row.delta05Mad });
    fitA.delta10.push({ d, mad: row.delta10Mad });
    console.log(`  [A] δ=${d.toFixed(2)} (px nguồn): plain MAD=${mPlain} | delta05=${row.delta05Mad} | delta10=${row.delta10Mad}`);
  }
  const best = (arr) => arr.reduce((a, b) => (b.mad < a.mad ? b : a));
  crep.A_phaseShiftFit = {
    bestPlain: best(fitA.plain), bestDelta05: best(fitA.delta05), bestDelta10: best(fitA.delta10),
    grid: deltas,
  };
  console.log(`  [A] tốt nhất: plain δ=${best(fitA.plain).d} MAD=${best(fitA.plain).mad}; delta05 δ=${best(fitA.delta05).d} MAD=${best(fitA.delta05).mad}; delta10 δ=${best(fitA.delta10).d} MAD=${best(fitA.delta10).mad}`);

  // ---- (B) blur hậu-kỳ lên tri(d_render) ----
  const blurs = { none: null, tap121: [0.25, 0.5, 0.25], binom5: [1 / 16, 4 / 16, 6 / 16, 4 / 16, 1 / 16], avg2: [0.5, 0.5] };
  const fitB = {};
  for (const v of ["sharp05", "sharp10"]) {
    const triD = resamplePlaneK(dRender[v], projW, projH, vw, vh, triangleKernel);
    const dpR = new Float64Array(vw * vh);
    for (let i = 0; i < vw * vh; i++) dpR[i] = dpPrev[v][i * 3];
    const row = {};
    for (const [name, k] of Object.entries(blurs)) {
      if (!k) { row[name] = madFloat(dpR, triD); continue; }
      // avg2: trung bình x và x+1 (dịch nửa px) — blur 2-tap
      let b;
      if (name === "avg2") {
        b = new Float64Array(vw * vh);
        for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
          const x1 = x + 1 >= vw ? vw - 1 : x + 1;
          b[y * vw + x] = 0.5 * (triD[y * vw + x] + triD[y * vw + x1]);
        }
      } else b = blurPlane(triD, vw, vh, k);
      row[name] = madFloat(dpR, b);
    }
    // BC để đối chiếu (float, kênh R)
    const bcD = resamplePlaneK(dRender[v], projW, projH, vw, vh, BC);
    row.bc025_0375 = madFloat(dpR, bcD);
    fitB[v] = row;
    console.log(`  [B ${v}] MAD vs dp_prev: ` + Object.entries(row).map(([k, x]) => `${k}=${x}`).join(" | "));
  }
  crep.B_postBlur = fitB;
  // blur lên plain: Chrome có "rộng hơn tam giác" ở plain không?
  const triPlain = resamplePlaneK(plainR, projW, projH, vw, vh, triangleKernel);
  const plainBlur = { none: madFloat(snapPlainR, triPlain) };
  for (const [name, k] of Object.entries(blurs)) {
    if (!k) continue;
    plainBlur[name] = madFloat(snapPlainR, blurPlane(triPlain, vw, vh, k));
  }
  plainBlur.bc025_0375 = madFloat(snapPlainR, resamplePlaneK(plainR, projW, projH, vw, vh, BC));
  crep.B_plainBlur = plainBlur;
  console.log(`  [B plain] MAD vs snap_plain: ` + Object.entries(plainBlur).map(([k, x]) => `${k}=${x}`).join(" | "));

  // ---- (C) đáp ứng tần số tri vs BC tại hài của mẫu delta ----
  const fitC = {};
  const s = vw / projW;
  for (const k of [1, 2, 3]) {
    const f = k / 8; // chu kỳ / px nguồn
    const H = 16, W = projW;
    const sig = new Float64Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sig[y * W + x] = Math.sin(2 * Math.PI * f * x);
    const row = {};
    for (const [name, kern] of [["tri", triangleKernel], ["bc", BC]]) {
      const up = resamplePlaneK(sig, W, H, vw, H, kern);
      // fit A*sin(2π f' x + φ) trên hàng giữa (f' = f/s); bỏ 20px biên
      const fp = f / s;
      let sc = 0, ss = 0;
      const ymid = Math.floor(H / 2);
      for (let x = 20; x < vw - 20; x++) {
        const v = up[ymid * vw + x];
        sc += v * Math.cos(2 * Math.PI * fp * x);
        ss += v * Math.sin(2 * Math.PI * fp * x);
      }
      const n = vw - 40;
      const a = (2 * sc) / n, b = (2 * ss) / n;
      const gain = Math.hypot(a, b);
      const phase = Math.atan2(a, b); // v ≈ gain*sin(2πf'x + φ): hệ số cos là gain*sinφ, hệ số sin là gain*cosφ
      row[name] = { gain: +gain.toFixed(3), phaseRad: +phase.toFixed(3) };
    }
    fitC[`f=${f}`] = row;
    console.log(`  [C] f=${f} cycles/px nguồn: tri gain=${row.tri.gain} φ=${row.tri.phaseRad} | BC gain=${row.bc.gain} φ=${row.bc.phaseRad}`);
  }
  crep.C_freqResponse = fitC;

  // ---- (D) đo δ trực tiếp bằng tương quan chéo profile cạnh ----
  // Lấy 1 cạnh cô lập của sqw32 (nguồn x=32), profile X trung bình nửa trên.
  if (content === "sqw32-640") {
    const y0 = Math.floor(vh * 0.1), y1 = Math.floor(vh * 0.45);
    const profSnap = [], profTri = [];
    const triPlainFull = resamplePlaneK(plainR, projW, projH, vw, vh, triangleKernel);
    for (let x = 0; x < vw; x++) {
      let s1 = 0, s2 = 0;
      for (let y = y0; y < y1; y++) { s1 += prev.plain[(y * vw + x) * 3]; s2 += triPlainFull[y * vw + x]; }
      profSnap.push(s1 / (y1 - y0));
      profTri.push(s2 / (y1 - y0));
    }
    // cạnh nguồn x=32 -> viewport x ≈ (32+0.5)*s-0.5 ≈ 40.6; cửa sổ 30..52
    // tương quan chéo với nội suy tuyến tính, δ trong [-1,1] px viewport, bước 0.05
    const interp = (arr, x) => {
      const x0 = Math.floor(x), t = x - x0;
      const a = arr[Math.max(0, Math.min(arr.length - 1, x0))], b = arr[Math.max(0, Math.min(arr.length - 1, x0 + 1))];
      return a + (b - a) * t;
    };
    let bestD = null;
    for (let d = -1; d <= 1.001; d += 0.05) {
      let se = 0, n = 0;
      for (let x = 30; x <= 52; x++) {
        const e = profSnap[x] - interp(profTri, x + d);
        se += e * e; n++;
      }
      const rmse = Math.sqrt(se / n);
      if (!bestD || rmse < bestD.rmse) bestD = { deltaViewportPx: +d.toFixed(2), rmse: +rmse.toFixed(3) };
    }
    crep.D_edgeShift = bestD;
    console.log(`  [D] shift cạnh tốt nhất (viewport px): δ=${bestD.deltaViewportPx} RMSE=${bestD.rmse} (δ>0 nghĩa snap trễ hơn model)`);
    console.log(`      profile snap  x=30..52: [${profSnap.slice(30, 53).map((v) => v.toFixed(1)).join(", ")}]`);
    console.log(`      profile tri   x=30..52: [${profTri.slice(30, 53).map((v) => v.toFixed(1)).join(", ")}]`);
  }
  result.contents[content] = crep;
}
writeFileEpermRetry(OUT, JSON.stringify(result, null, 2));
console.log(`\nJSON: ${OUT}`);
