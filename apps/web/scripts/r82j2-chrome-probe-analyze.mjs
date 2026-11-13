#!/usr/bin/env node
/**
 * r82j2-chrome-probe-analyze.mjs — Phase 9 đợt 82, luồng J2: phân tích probe
 * headed trực tiếp toán tử drawImage upscale của Chrome (r82j2-chrome-probe-headed.mjs).
 *
 * Câu hỏi: trên mẫu bipolar đặc đã biết (không qua sharpen), kernel hiệu
 * dụng của Chrome là gì — tam giác (như probe xung vuông H3) hay
 * BC(0,25, 0,375) (như production đang dùng) hay (B,C) khác?
 *
 * Phân tích:
 *   A. MAD hàng (4 hàng/capture) của Chrome vs 6 kernel ứng viên trên
 *      sqw4/sqw8/sqw4-hi/sqw4-lo/step/impulse, 3 thang.
 *   B. Grid fit (B,C) trên sqw4+sqw8 ở s=1,1328 + s=1,2637.
 *   C. Sweep impulse p=0..511: so trọng số đo được vs trọng số mô hình
 *      từng kernel; profile xung tại p=256.
 *   D. Tuyến tính: linAB vs linA+linB. Phụ thuộc giá trị: sqw4 vs
 *      sqw4-hi vs sqw4-lo sau chuẩn hoá biên độ.
 *   E. Step 64→192: overshoot (BC dự báo +6/−6, tri 0).
 *   F. Checker8 2D: MAD full-frame vs mô hình tách được 2D.
 *   G. high vs medium; lặp lại sqw4; gpu0 vs gpu1.
 *   H. Đối chiếu chéo I3 (E2-style): kernel(d_render) vs dp_prev thật
 *      trên dữ liệu H3 (run D sqw4-640 + run A2 sqw4) cho tri / BC /
 *      (B,C) tốt nhất từ B — chỉ đề xuất đổi production nếu thắng
 *      NHẤT QUÁN cả ở probe trực tiếp lẫn delta I3.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r82j2-chrome-probe-analyze.mjs
 * Env: R82J2_PROBE0/R82J2_PROBE1 (mặc định hidden_files/round82-j2/r82j2-probe-gpu{0,1}.json),
 *   R82J2_OUT (mặc định hidden_files/round82-j2/r82j2-analysis.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const J2 = path.join(GOAL, "round82-j2");
const H3 = path.join(GOAL, "round80-h3");
const PROBE0 = process.env.R82J2_PROBE0 || path.join(J2, "r82j2-probe-gpu0.json");
const PROBE1 = process.env.R82J2_PROBE1 || path.join(J2, "r82j2-probe-gpu1.json");
const OUT = process.env.R82J2_OUT || path.join(J2, "r82j2-analysis.json");

export function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
function sinc(x) { return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); }
function lanczos2(x) { const a = Math.abs(x); return a < 2 ? sinc(x) * sinc(x / 2) : 0; }
export const KERNELS = {
  tri: triangleKernel,
  "bc025-0375": (x) => bcCubic(x, 0.25, 0.375),
  mitchell: (x) => bcCubic(x, 1 / 3, 1 / 3),
  catmull: (x) => bcCubic(x, 0, 0.5),
  bspline: (x) => bcCubic(x, 1, 0),
  lanczos2,
};

/** Resample 1 hàng 1D bằng chromeWeights1D (S=(i+0.5)/s, h=chromeStretch). */
export function resampleRow1D(row, dstLen, kernel) {
  const srcLen = row.length;
  const s = dstLen / srcLen;
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, s, srcLen, kernel)) acc += w * row[j];
    out[i] = acc;
  }
  return out;
}

/** Resample 1 plane 2D (sao từ I3/E9, kernel cắm được). */
export function resamplePlaneKernel(src, srcW, srcH, dstW, dstH, kernel) {
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

export function madRows(a, b) {
  // a, b: mảng số cùng độ dài (1 hàng) hoặc mảng các hàng.
  let sum = 0, n = 0;
  const flat = (v) => (Array.isArray(v[0]) ? v.flat() : v);
  const fa = flat(a), fb = flat(b);
  for (let i = 0; i < fa.length; i++) { sum += Math.abs(fa[i] - fb[i]); n++; }
  return +(sum / n).toFixed(3);
}
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
function roundU8(v) { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; }

// Nguồn mẫu — cùng công thức với trang probe (đặt lại ở đây để mô hình độc lập).
function patternRow(kind, w = 512) {
  const row = new Float64Array(w);
  for (let x = 0; x < w; x++) {
    switch (kind) {
      case "sqw4": row[x] = (Math.floor(x / 4) % 2 === 0) ? 64 : 192; break;
      case "sqw8": row[x] = (Math.floor(x / 8) % 2 === 0) ? 64 : 192; break;
      case "sqw4-hi": row[x] = (Math.floor(x / 4) % 2 === 0) ? 0 : 255; break;
      case "sqw4-lo": row[x] = (Math.floor(x / 4) % 2 === 0) ? 112 : 144; break;
      case "step": row[x] = x < 256 ? 64 : 192; break;
      case "impulse": row[x] = x === 256 ? 255 : 128; break;
      case "linA": row[x] = x === 200 ? 128 : 0; break;
      case "linB": row[x] = x === 208 ? 128 : 0; break;
      case "linAB": row[x] = (x === 200 || x === 208) ? 128 : 0; break;
      default: throw new Error("mẫu không biết: " + kind);
    }
  }
  return row;
}
function patternPlane(kind, w = 512, h = 512) {
  const pl = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v;
    if (kind === "checker8") v = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) ? 64 : 192;
    else v = patternRow(kind, w)[x];
    pl[y * w + x] = v;
  }
  return pl;
}

const SCALES = [
  { key: "s1132", dw: 580, dh: 580 },
  { key: "s1264", dw: 647, dh: 647 },
  { key: "s2000", dw: 1024, dh: 1024 },
];
const ROW_PATTERNS = ["sqw4", "sqw8", "sqw4-hi", "sqw4-lo", "step", "impulse", "linA", "linB", "linAB"];

function main() {
  const report = { generated: new Date().toISOString(), sections: {} };
  const probe0 = JSON.parse(fs.readFileSync(PROBE0, "utf8"));
  const probe1 = fs.existsSync(PROBE1) ? JSON.parse(fs.readFileSync(PROBE1, "utf8")) : null;
  console.log(`probe gpu0: ${probe0.ua}`);
  if (probe1) console.log(`probe gpu1: ${probe1.ua}`);
  const cap = (probe, key) => probe.captures[key];
  const rowsOf = (c) => c.rows; // 4 hàng đo được

  // ---- 0. Sanity: hàng dọc có hằng không? (mẫu sọc dọc phải hằng theo y) ----
  const yConst = {};
  for (const k of ROW_PATTERNS) for (const sc of SCALES) {
    const c = cap(probe0, `${k}@${sc.key}`);
    let maxD = 0;
    for (let r = 1; r < c.rows.length; r++) for (let i = 0; i < sc.dw; i++) maxD = Math.max(maxD, Math.abs(c.rows[r][i] - c.rows[0][i]));
    yConst[`${k}@${sc.key}`] = maxD;
  }
  const yConstMax = Math.max(...Object.values(yConst));
  console.log(`\n[0] y-constancy (sọc dọc): max |hàng-hàng0| = ${yConstMax} (kỳ vọng 0)`);
  report.sections.yConstancy = { maxAbsDiff: yConstMax, perCapture: yConst };

  // ---- A. MAD hàng Chrome vs kernel ----
  console.log("\n[A] MAD hàng (trung bình 4 hàng) Chrome vs kernel — thấp nhất in đậm (*)");
  const tableA = {};
  for (const k of ROW_PATTERNS) {
    tableA[k] = {};
    for (const sc of SCALES) {
      const c = cap(probe0, `${k}@${sc.key}`);
      const srcRow = patternRow(k);
      const row = {};
      for (const [name, kern] of Object.entries(KERNELS)) {
        const pred = resampleRow1D(srcRow, sc.dw, kern);
        const predRows = [0, 1, 2, 3].map(() => Array.from(pred, roundU8));
        row[name] = madRows(c.rows, predRows);
      }
      tableA[k][sc.key] = row;
      const best = Object.entries(row).sort((a, b) => a[1] - b[1])[0];
      console.log(`  ${k}@${sc.key}: ` + Object.entries(row).map(([n, v]) => `${n}=${v}`).join(" | ") + `   => tốt nhất: ${best[0]} (${best[1]})`);
    }
  }
  report.sections.kernelMadRows = tableA;

  // ---- B. Grid fit (B,C) trên sqw4+sqw8, s1132+s1264 ----
  console.log("\n[B] Grid fit (B,C) — MAD trung bình trên sqw4+sqw8 @ s1132+s1264 (4 hàng mỗi capture)");
  const grid = [];
  const Bvals = [0, 0.125, 0.25, 1 / 3, 0.5];
  const Cvals = [0, 0.25, 1 / 3, 0.375, 0.5];
  for (const B of Bvals) for (const C of Cvals) {
    const kern = (x) => bcCubic(x, B, C);
    let sum = 0, n = 0;
    for (const k of ["sqw4", "sqw8"]) for (const sc of SCALES.slice(0, 2)) {
      const c = cap(probe0, `${k}@${sc.key}`);
      const pred = Array.from(resampleRow1D(patternRow(k), sc.dw, kern), roundU8);
      for (const r of c.rows) { for (let i = 0; i < sc.dw; i++) { sum += Math.abs(r[i] - pred[i]); n++; } }
    }
    grid.push({ B: +B.toFixed(4), C: +C.toFixed(4), mad: +(sum / n).toFixed(3) });
  }
  // Thêm tam giác làm mốc (không nằm trong lưới BC).
  let sumTri = 0, nTri = 0;
  for (const k of ["sqw4", "sqw8"]) for (const sc of SCALES.slice(0, 2)) {
    const c = cap(probe0, `${k}@${sc.key}`);
    const pred = Array.from(resampleRow1D(patternRow(k), sc.dw, triangleKernel), roundU8);
    for (const r of c.rows) { for (let i = 0; i < sc.dw; i++) { sumTri += Math.abs(r[i] - pred[i]); nTri++; } }
  }
  grid.push({ B: "tri", C: "tri", mad: +(sumTri / nTri).toFixed(3) });
  grid.sort((a, b) => a.mad - b.mad);
  for (const g of grid.slice(0, 8)) console.log(`  (B=${g.B}, C=${g.C}): MAD=${g.mad}`);
  console.log(`  ... BC(0,25, 0,375) hạng ${grid.findIndex((g) => g.B === 0.25 && g.C === 0.375) + 1}/${grid.length}, MAD=${grid.find((g) => g.B === 0.25 && g.C === 0.375).mad}`);
  report.sections.gridFit = grid;

  // ---- C. Sweep impulse ----
  console.log("\n[C] Sweep impulse p=0..511 (hàng giữa): trọng số đo vs mô hình");
  const sweepRes = {};
  for (const sc of [SCALES[0], SCALES[2]]) {
    const sw = probe0.sweep[sc.key];
    const rows = Buffer.from(sw.rowsB64, "base64"); // 512 × dw
    const dw = sw.w;
    const res = {};
    for (const [name, kern] of Object.entries(KERNELS)) {
      let sum = 0, n = 0, exact = 0;
      for (let i = 0; i < dw; i++) {
        const ws = chromeWeights1D(i, dw / 512, 512, kern);
        const wmap = new Map(ws);
        for (let p = 0; p < 512; p++) {
          const meas = rows[p * dw + i];
          const w = wmap.get(p) || 0;
          const pred = roundU8(255 * w);
          if (meas > 0 || pred > 0) { sum += Math.abs(meas - pred); n++; if (meas === pred) exact++; }
        }
      }
      res[name] = { madSupport: +(sum / n).toFixed(3), nSupport: n, exactRate: +(exact / n).toFixed(4) };
    }
    sweepRes[sc.key] = res;
    const best = Object.entries(res).sort((a, b) => a[1].madSupport - b[1].madSupport)[0];
    console.log(`  ${sc.key} (dw=${dw}): ` + Object.entries(res).map(([n, v]) => `${n}: MAD=${v.madSupport} exact=${v.exactRate}`).join(" | ") + ` => tốt nhất: ${best[0]}`);
    // Profile xung tại p=256 (hàng giữa): giá trị đo vs tri/BC quanh đỉnh.
    const p = 256;
    const measRow = Array.from(rows.subarray(p * dw, (p + 1) * dw));
    const nz = [];
    for (let i = 0; i < dw; i++) if (measRow[i] > 0) nz.push(i);
    const i0 = nz[0], i1 = nz[nz.length - 1];
    const prof = { measured: measRow.slice(Math.max(0, i0 - 2), i1 + 3), i0, i1 };
    for (const name of ["tri", "bc025-0375", "mitchell"]) {
      const ws = [];
      for (let i = Math.max(0, i0 - 2); i <= i1 + 2; i++) {
        const w = new Map(chromeWeights1D(i, dw / 512, 512, KERNELS[name])).get(p) || 0;
        ws.push(roundU8(255 * w));
      }
      prof[name] = ws;
    }
    console.log(`  profile p=256 @${sc.key}, i=${prof.i0 - 2}..${prof.i1 + 2}: đo=[${prof.measured.join(",")}] tri=[${prof.tri.join(",")}] bc=[${prof["bc025-0375"].join(",")}] mit=[${prof.mitchell.join(",")}]`);
    sweepRes[sc.key].impulseProfile256 = prof;
  }
  report.sections.sweep = sweepRes;

  // ---- D. Tuyến tính + phụ thuộc giá trị ----
  console.log("\n[D] Tuyến tính & phụ thuộc giá trị");
  const lin = {};
  for (const sc of SCALES) {
    const a = cap(probe0, `linA@${sc.key}`).rows[2];
    const b = cap(probe0, `linB@${sc.key}`).rows[2];
    const ab = cap(probe0, `linAB@${sc.key}`).rows[2];
    let sum = 0, maxD = 0;
    for (let i = 0; i < sc.dw; i++) {
      const d = Math.abs(ab[i] - (a[i] + b[i]));
      sum += d; maxD = Math.max(maxD, d);
    }
    lin[sc.key] = { mad: +(sum / sc.dw).toFixed(3), maxAbs: maxD };
    console.log(`  ${sc.key}: MAD(linAB − (linA+linB)) = ${lin[sc.key].mad}, maxAbs=${maxD} (tuyến tính ⟺ ≈0)`);
  }
  // Chuẩn hoá biên độ: sqw4 (64/192) vs sqw4-hi (0/255) vs sqw4-lo (112/144).
  const norm = {};
  for (const sc of SCALES) {
    const r64 = cap(probe0, `sqw4@${sc.key}`).rows[2];
    const rHi = cap(probe0, `sqw4-hi@${sc.key}`).rows[2];
    const rLo = cap(probe0, `sqw4-lo@${sc.key}`).rows[2];
    const n64 = r64.map((v) => (v - 64) / 128);
    const nHi = rHi.map((v) => v / 255);
    const nLo = rLo.map((v) => (v - 112) / 32);
    const mad = (u, v) => { let s = 0; for (let i = 0; i < u.length; i++) s += Math.abs(u[i] - v[i]); return +(s / u.length).toFixed(4); };
    norm[sc.key] = { mad64vsHi: mad(n64, nHi), mad64vsLo: mad(n64, nLo), madHiVsLo: mad(nHi, nLo) };
    console.log(`  ${sc.key}: profile chuẩn hoá MAD 64/192-vs-0/255=${norm[sc.key].mad64vsHi}, 64/192-vs-112/144=${norm[sc.key].mad64vsLo} (≈0 ⟺ kernel không phụ thuộc giá trị)`);
  }
  report.sections.linearity = lin;
  report.sections.valueDependence = norm;

  // ---- E. Step edge overshoot ----
  console.log("\n[E] Step 64→192: overshoot quanh cạnh");
  const stepRes = {};
  for (const sc of SCALES) {
    const row = cap(probe0, `step@${sc.key}`).rows[2];
    // Cạnh nguồn x=256 -> đích i ≈ (256+0.5)*s... tìm vùng chuyển: giá trị rời 64..192.
    let iEdge = 0;
    for (let i = 0; i < sc.dw; i++) { if (row[i] > 64) { iEdge = i; break; } }
    const lo = row.slice(Math.max(0, iEdge - 12), iEdge + 2);
    const hi = row.slice(iEdge + 2, iEdge + 14);
    const under = Math.min(...lo), over = Math.max(...hi);
    const prof = row.slice(Math.max(0, iEdge - 6), iEdge + 8);
    stepRes[sc.key] = { iEdge, minBelow: under, maxAbove: over, underShoot: +(64 - under).toFixed(1), overShoot: +(over - 192).toFixed(1), profile: prof };
    // Mô hình tri/BC tại cùng vị trí.
    const models = {};
    for (const name of ["tri", "bc025-0375"]) {
      const pred = Array.from(resampleRow1D(patternRow("step"), sc.dw, KERNELS[name]), roundU8);
      models[name] = { underShoot: +(64 - Math.min(...pred.slice(Math.max(0, iEdge - 12), iEdge + 2))).toFixed(1), overShoot: +(Math.max(...pred.slice(iEdge + 2, iEdge + 14)) - 192).toFixed(1) };
    }
    stepRes[sc.key].models = models;
    console.log(`  ${sc.key}: đo underShoot=${stepRes[sc.key].underShoot} overShoot=${stepRes[sc.key].overShoot} | tri ${JSON.stringify(models.tri)} | bc ${JSON.stringify(models["bc025-0375"])} | profile=[${prof.join(",")}]`);
  }
  report.sections.stepOvershoot = stepRes;

  // ---- F. Checker 2D ----
  console.log("\n[F] Checker8 2D: MAD full-frame vs mô hình tách được");
  const checkerRes = {};
  for (const sc of SCALES) {
    const c = cap(probe0, `checker8@${sc.key}`);
    const chromeRgb = Buffer.from(c.rgbB64, "base64");
    const srcPl = patternPlane("checker8");
    const res = {};
    for (const [name, kern] of Object.entries(KERNELS)) {
      const out = Buffer.alloc(sc.dw * sc.dh * 3);
      for (let ch = 0; ch < 3; ch++) {
        const pl = new Float64Array(512 * 512);
        for (let i = 0; i < 512 * 512; i++) pl[i] = srcPl[i];
        const rs = resamplePlaneKernel(pl, 512, 512, sc.dw, sc.dh, kern);
        for (let i = 0; i < sc.dw * sc.dh; i++) out[i * 3 + ch] = roundU8(rs[i]);
      }
      res[name] = mad3(chromeRgb, out);
    }
    checkerRes[sc.key] = res;
    const best = Object.entries(res).sort((a, b) => a[1].mad - b[1].mad)[0];
    console.log(`  ${sc.key}: ` + Object.entries(res).map(([n, v]) => `${n}=${v.mad}`).join(" | ") + ` => tốt nhất: ${best[0]} (${best[1].mad})`);
  }
  report.sections.checker2D = checkerRes;

  // ---- G. high vs medium, lặp lại, gpu0 vs gpu1 ----
  console.log("\n[G] Đối chứng: high-vs-medium, lặp lại, gpu0-vs-gpu1");
  const g = {};
  const med = probe0.quality["sqw4@s1132-medium"];
  const hi = cap(probe0, "sqw4@s1132");
  g.highVsMedium = { mad: madRows(hi.rows, med.rows), identical: JSON.stringify(hi.rows) === JSON.stringify(med.rows) };
  console.log(`  high vs medium (sqw4@s1132): MAD=${g.highVsMedium.mad}, identical=${g.highVsMedium.identical}`);
  const rep = cap(probe0, "sqw4@s1132-repeat");
  g.repeat = { mad: madRows(hi.rows, rep.rows), identical: JSON.stringify(hi.rows) === JSON.stringify(rep.rows) };
  console.log(`  lặp lại sqw4@s1132: MAD=${g.repeat.mad}, identical=${g.repeat.identical}`);
  if (probe1) {
    const gg = {};
    for (const k of ["sqw4", "sqw8", "step", "impulse"]) for (const sc of SCALES) {
      gg[`${k}@${sc.key}`] = madRows(cap(probe0, `${k}@${sc.key}`).rows, cap(probe1, `${k}@${sc.key}`).rows);
    }
    g.gpu0vsGpu1 = gg;
    console.log(`  gpu0 vs gpu1 MAD: ` + Object.entries(gg).map(([n, v]) => `${n}=${v}`).join(" | "));
  } else {
    console.log("  gpu1 chưa có — bỏ qua so sánh đường raster");
  }
  report.sections.controls = g;

  // ---- H. Đối chiếu chéo I3 (E2-style) ----
  console.log("\n[H] Đối chiếu chéo I3: kernel(d_render) vs dp_prev thật (H3 run D + A2, sqw4)");
  const hRes = {};
  const runs = [
    { snapFile: "headed-w1920x1080-p640x360-ph1/r80h3-snaps-w1920x1080-p640x360.json", contents: ["sqw4-640"] },
    { snapFile: "headed-w2560x1440-p1280x720-ph1/r80h3-snaps-w2560x1440-p1280x720.json", contents: ["sqw4"] },
  ];
  const gridBest = grid[0];
  const crossKernels = {
    tri: triangleKernel,
    "bc025-0375": KERNELS["bc025-0375"],
    [`gridBest(B=${gridBest.B},C=${gridBest.C})`]: gridBest.B === "tri" ? triangleKernel : ((x) => bcCubic(x, gridBest.B, gridBest.C)),
  };
  const deltaMadFloat = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return +(s / a.length).toFixed(3); };
  const deltaOf = (a, b) => { const o = new Float64Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] - b[i]; return o; };
  for (const run of runs) {
    const doc = JSON.parse(fs.readFileSync(path.join(H3, run.snapFile), "utf8"));
    const projW = doc.projW, projH = doc.projH;
    for (const content of run.contents) {
      const snaps = doc.snaps[content];
      const vw = snaps.plain.w, vh = snaps.plain.h;
      const rdir = path.join(H3, "render", content);
      const fullRgb = {};
      for (const v of ["plain", "sharp05", "sharp10"]) fullRgb[v] = fs.readFileSync(path.join(rdir, `fullrgb-${v}.raw`));
      const prev = {};
      for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
      const dpPrev = { sharp05: deltaOf(prev.sharp05, prev.plain), sharp10: deltaOf(prev.sharp10, prev.plain) };
      const dRender = { sharp05: deltaOf(fullRgb.sharp05, fullRgb.plain), sharp10: deltaOf(fullRgb.sharp10, fullRgb.plain) };
      const row = {};
      for (const [kname, kern] of Object.entries(crossKernels)) {
        for (const v of ["sharp05", "sharp10"]) {
          const up = new Float64Array(vw * vh * 3);
          for (let c = 0; c < 3; c++) {
            const pl = new Float64Array(projW * projH);
            for (let i = 0; i < projW * projH; i++) pl[i] = dRender[v][i * 3 + c];
            const rs = resamplePlaneKernel(pl, projW, projH, vw, vh, kern);
            for (let i = 0; i < vw * vh; i++) up[i * 3 + c] = rs[i];
          }
          row[`${kname} delta ${v}`] = deltaMadFloat(dpPrev[v], up);
        }
      }
      // V0 plain MAD cho gridBest (kiểm không phá plain).
      const plainMad = {};
      for (const [kname, kern] of Object.entries(crossKernels)) {
        const out = Buffer.alloc(vw * vh * 3);
        for (let c = 0; c < 3; c++) {
          const pl = new Float64Array(projW * projH);
          for (let i = 0; i < projW * projH; i++) pl[i] = fullRgb.plain[i * 3 + c];
          const rs = resamplePlaneKernel(pl, projW, projH, vw, vh, kern);
          for (let i = 0; i < vw * vh; i++) out[i * 3 + c] = roundU8(rs[i]);
        }
        plainMad[kname] = mad3(prev.plain, out).mad;
      }
      row.plainMad = plainMad;
      hRes[`${doc.window}-p${projW}x${projH}/${content}`] = row;
      console.log(`  ${content} (rect ${vw}x${vh}, s=${(vw / projW).toFixed(4)}): plain MAD tri=${plainMad.tri} bc=${plainMad["bc025-0375"]} gridBest=${plainMad[`gridBest(B=${gridBest.B},C=${gridBest.C})`]} | delta05 tri=${row["tri delta sharp05"]} bc=${row["bc025-0375 delta sharp05"]} grid=${row[`gridBest(B=${gridBest.B},C=${gridBest.C}) delta sharp05`]} | delta10 tri=${row["tri delta sharp10"]} bc=${row["bc025-0375 delta sharp10"]} grid=${row[`gridBest(B=${gridBest.B},C=${gridBest.C}) delta sharp10`]}`);
    }
  }
  report.sections.crossCheckI3 = hRes;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nđã ghi ${OUT}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
