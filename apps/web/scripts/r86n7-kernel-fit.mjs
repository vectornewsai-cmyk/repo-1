#!/usr/bin/env node
/**
 * r86n7-kernel-fit.mjs — Phase 9 đợt 86, luồng N7 (phần 3): fit kernel TỰ DO
 * của toán tử video bằng least-squares trên các nút.
 *
 * Mô hình: k(x) đối xứng, nội suy tuyến tính từng đoạn trên các nút
 * x = 0, 0,1, ..., 2,0 (21 nút). Với φ cố định, mỗi pixel đầu ra là tổ hợp
 * TUYẾN TÍNH của các nút -> giải least-squares qua phương trình chuẩn.
 * Quét φ để tìm (φ*, k*) tốt nhất. Chạy riêng trên sóng / bậc+vạch / toàn bộ
 * để kiểm tính nhất quán. Kiểm tra phân hoạch đơn vị Σ_j k(j+0,5−S) ≈ 1.
 *
 * Vào: r86n7-video-operator2.json, r85m2-wave.json, media .rgb.
 * Ra: hidden_files/round86-n7/r86n7-kernel-fit.json (+ log console).
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const N7 = path.join(GOAL, "round86-n7");
const M2 = path.join(GOAL, "round85-m2");
const MEDIA7 = path.join(N7, "media");
const MEDIA2 = path.join(M2, "media");
const OUT = path.join(N7, "r86n7-kernel-fit.json");
const r3 = (v) => +v.toFixed(3);
const r4 = (v) => +v.toFixed(4);

function decodeB64(b64, w, h) { return { w, h, data: Buffer.from(b64, "base64") }; }
function profile1D(dump, kind) {
  const { w, h, data } = dump;
  if (kind === "V") {
    const prof = new Float64Array(w);
    for (let x = 0; x < w; x++) { let s = 0; for (let y = 0; y < h; y++) s += data[(y * w + x) * 3]; prof[x] = s / h; }
    return prof;
  }
  const prof = new Float64Array(h);
  for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) s += data[(y * w + x) * 3]; prof[y] = s / w; }
  return prof;
}
const tri = (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; };

// ---------- giải hệ tuyến tính (Gauss, pivot từng phần) ----------
function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) throw new Error("ma trận suy biến tại cột " + c);
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

const KNOTS = [];
for (let k = 0; k <= 20; k++) KNOTS.push(k * 0.1);
const NK = KNOTS.length;

/** Hệ số nội suy tuyến tính của k tại |x| trên các nút. Trả [[m, c], ...]. */
function knotCoeffs(ax) {
  if (ax >= 2.0) return [];
  const pos = ax / 0.1;
  const m0 = Math.floor(pos);
  const f = pos - m0;
  if (f < 1e-12) return [[m0, 1]];
  return [[m0, 1 - f], [m0 + 1, f]];
}

/** Xây hàng thiết kế cho 1 pixel: coef[m] sao cho out = Σ_m coef[m]*k[m]. */
function designRow(src, srcLen, S) {
  const coef = new Float64Array(NK);
  const j0 = Math.max(0, Math.floor(S - 2 - 0.5));
  const j1 = Math.min(srcLen - 1, Math.ceil(S + 2 - 0.5));
  for (let j = j0; j <= j1; j++) {
    const ax = Math.abs(j + 0.5 - S);
    for (const [m, c] of knotCoeffs(ax)) coef[m] += c * src[j];
  }
  return coef;
}

function buildDataset(rows) {
  // rows: [{src, srcLen, dstLen, sTrue, meas, lo, hi}]
  const A = Array.from({ length: NK }, () => new Float64Array(NK));
  const b = new Float64Array(NK);
  let n = 0;
  for (const { src, srcLen, dstLen, sTrue, meas, lo, hi, phi } of rows) {
    for (let i = lo; i < hi; i++) {
      const S = (i + 0.5) / sTrue + phi;
      const coef = designRow(src, srcLen, S);
      const y = meas[i];
      for (let a = 0; a < NK; a++) {
        if (coef[a] === 0) continue;
        b[a] += coef[a] * y;
        for (let c = a; c < NK; c++) A[a][c] += coef[a] * coef[c];
      }
      n++;
    }
  }
  for (let a = 0; a < NK; a++) for (let c = 0; c < a; c++) A[a][c] = A[c][a];
  // ridge nhỏ về phía triangle để ổn định (λ=1e-3 trên thang giá trị ~1e5)
  for (let a = 0; a < NK; a++) {
    A[a][a] += 1e-3;
    b[a] += 1e-3 * tri(KNOTS[a]);
  }
  return { A: A.map((r) => Array.from(r)), b: Array.from(b), n };
}

function evalKernel(knots, x) {
  const ax = Math.abs(x);
  if (ax >= 2.0) return 0;
  const pos = ax / 0.1;
  const m0 = Math.floor(pos);
  const f = pos - m0;
  if (f < 1e-12) return knots[m0];
  return knots[m0] * (1 - f) + knots[m0 + 1] * f;
}

function modelWithKernel(knots, src, srcLen, dstLen, sTrue, phi) {
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    const S = (i + 0.5) / sTrue + phi;
    let acc = 0, wsum = 0;
    const j0 = Math.max(0, Math.floor(S - 2 - 0.5));
    const j1 = Math.min(srcLen - 1, Math.ceil(S + 2 - 0.5));
    for (let j = j0; j <= j1; j++) {
      const w = evalKernel(knots, j + 0.5 - S);
      acc += w * src[j]; wsum += w;
    }
    out[i] = wsum > 0 ? acc / wsum : acc;
  }
  return out;
}
function madWin(a, b, lo, hi) { let s = 0, n = 0; for (let i = lo; i < hi; i++) { s += Math.abs(a[i] - b[i]); n++; } return n ? s / n : NaN; }

const probe7 = JSON.parse(fs.readFileSync(path.join(N7, "r86n7-video-operator2.json"), "utf8"));
const wave2 = JSON.parse(fs.readFileSync(path.join(M2, "r85m2-wave.json"), "utf8"));

const srcProfFromRgb = (rgbPath, kind) => {
  const raw = fs.readFileSync(rgbPath);
  if (kind === "V") {
    const prof = new Float64Array(640);
    for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; prof[x] = s / 8; }
    return prof;
  }
  const prof = new Float64Array(360);
  for (let y = 0; y < 360; y++) { let s = 0; for (let x = 310; x < 318; x++) s += raw[(y * 640 + x) * 3]; prof[y] = s / 8; }
  return prof;
};

// ---------- thu thập dataset ----------
function collectWaves() {
  const rows = [];
  for (const [name, kind] of [["sqw2-mid", "H"], ["sqw4-mid", "H"], ["sqw8-mid", "H"], ["sqw4x-mid", "V"], ["sqw4-640", "H"]]) {
    const bDump = decodeB64(wave2[name].dumps["B-1to1"].rgbB64, wave2[name].dumps["B-1to1"].w, wave2[name].dumps["B-1to1"].h);
    const src = profile1D(bDump, kind);
    for (const sNom of wave2.scales) {
      const dump = wave2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      let lo = 10, hi = dstLen - 10;
      if (name === "sqw4-640") { lo = Math.floor(200 * sTrue); hi = Math.floor(350 * sTrue); }
      rows.push({ src, srcLen: src.length, dstLen, sTrue, meas, lo, hi, tag: `${name} s${sNom}` });
    }
  }
  return rows;
}
function collectSteps() {
  const rows = [];
  for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160], ["stepH255b", "H", 90]]) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    for (const sNom of probe7.scales) {
      const dump = probe7[name].dumps[`exp-high-video-s${sNom}`];
      if (!dump) continue;
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      const c = Math.round(E * sTrue);
      rows.push({ src, srcLen: src.length, dstLen, sTrue, meas, lo: Math.max(0, c - 60), hi: Math.min(dstLen, c + 60), tag: `${name} s${sNom}` });
    }
  }
  // lineV-gray (M2 media)
  {
    const raw = fs.readFileSync(path.join(MEDIA2, "lineV-gray.rgb"));
    const src = new Float64Array(640);
    for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; src[x] = s / 8; }
    for (const sNom of probe7.scales) {
      const dump = probe7["lineV-gray"].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "V");
      const dstLen = meas.length, sTrue = dstLen / 640;
      const c = Math.round(320 * sTrue);
      rows.push({ src, srcLen: 640, dstLen, sTrue, meas, lo: Math.max(0, c - 60), hi: Math.min(dstLen, c + 60), tag: `lineV-gray s${sNom}` });
    }
  }
  return rows;
}

const waves = collectWaves();
const steps = collectSteps();
const all = [...waves, ...steps];

function fitFor(rows, phiList) {
  let best = null;
  for (const phi of phiList) {
    const withPhi = rows.map((r) => ({ ...r, phi }));
    const { A, b, n } = buildDataset(withPhi);
    let knots;
    try { knots = solveLinear(A, b); } catch (e) { console.log(`  phi=${phi}: solve lỗi ${e.message}`); continue; }
    // SSE trên toàn bộ (dùng model đã chuẩn hoá wsum)
    let sse = 0, cnt = 0;
    for (const r of withPhi) {
      const m = modelWithKernel(knots, r.src, r.srcLen, r.dstLen, r.sTrue, phi);
      for (let i = r.lo; i < r.hi; i++) { const d = m[i] - r.meas[i]; sse += d * d; cnt++; }
    }
    const rmse = Math.sqrt(sse / cnt);
    if (!best || rmse < best.rmse) best = { phi, rmse: r4(rmse), knots: knots.map((v) => r4(v)), n: cnt };
    console.log(`  phi=${phi.toFixed(3)} RMSE=${rmse.toFixed(4)} (n=${cnt})`);
  }
  return best;
}

const report = { generated: new Date().toISOString(), knots: KNOTS, sections: {} };
const phis = [];
for (let p = -0.06; p <= 0.0201; p += 0.01) phis.push(+p.toFixed(3));

console.log("A. Fit kernel tự do — CHỈ SÓNG:");
report.sections.wavesOnly = fitFor(waves, phis);
console.log("B. Fit kernel tự do — CHỈ BẬC+VẠCH:");
report.sections.stepsOnly = fitFor(steps, phis);
console.log("C. Fit kernel tự do — TOÀN BỘ:");
report.sections.all = fitFor(all, phis);

// ---------- kiểm chứng kernel tốt nhất trên từng nhóm ----------
{
  const best = report.sections.all;
  const knots = best.knots;
  console.log("\nKernel tốt nhất (toàn bộ, phi*=" + best.phi + "):");
  console.log("  x:    " + KNOTS.map((x) => x.toFixed(1)).join("  "));
  console.log("  k:    " + knots.map((v) => v.toFixed(3)).join(" "));
  console.log("  tri:  " + KNOTS.map((x) => tri(x).toFixed(3)).join(" "));
  console.log("  k-tri:" + knots.map((v, i) => (v - tri(KNOTS[i])).toFixed(3)).join(" "));
  // phân hoạch đơn vị
  const pou = [];
  for (let ph = 0; ph < 1; ph += 0.05) {
    let s = 0;
    for (let j = -3; j <= 3; j++) s += evalKernel(knots, j + 0.5 - (ph + 0.5));
    pou.push(r3(s));
  }
  console.log("  Σk theo pha (ph=0..0.95): " + pou.join(" "));
  // MAD với kernel này trên từng nhóm (so với triangle φ*)
  const madOf = (rows, knots, phi) => {
    let s = 0, n = 0;
    for (const r of rows) {
      const m = modelWithKernel(knots, r.src, r.srcLen, r.dstLen, r.sTrue, phi);
      s += madWin(m, r.meas, r.lo, r.hi) * (r.hi - r.lo); n += r.hi - r.lo;
    }
    return r3(s / n);
  };
  const triKnots = KNOTS.map((x) => tri(x));
  report.sections.check = {
    madFreeKernel: { waves: madOf(waves, knots, best.phi), steps: madOf(steps, knots, best.phi) },
    madTrianglePhiStar: { waves: madOf(waves, triKnots, -0.03), steps: madOf(steps, triKnots, -0.03) },
    partitionOfUnity: pou,
  };
  console.log("  MAD kernel tự do: sóng=" + report.sections.check.madFreeKernel.waves + " bậc/vạch=" + report.sections.check.madFreeKernel.steps);
  console.log("  MAD triangle φ=-0,03: sóng=" + report.sections.check.madTrianglePhiStar.waves + " bậc/vạch=" + report.sections.check.madTrianglePhiStar.steps);
}

writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
