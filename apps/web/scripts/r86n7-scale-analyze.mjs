#!/usr/bin/env node
/**
 * r86n7-scale-analyze.mjs — Phase 9 đợt 86, luồng N7 (phần 4):
 *  (a) lượng tử hoá vị trí/phân số 1/16 + 1/32 (chưa thử ở các script trước),
 *  (b) fit kernel tự do RIÊNG TỪNG THANG trên sóng (hình kernel có đổi theo
 *      thang không?), (c) MAD theo clip/thang của kernel tự do toàn cục.
 *
 * Vào: r86n7-video-operator2.json, r85m2-wave.json, r86n7-kernel-fit.json.
 * Ra: hidden_files/round86-n7/r86n7-scale-analysis.json (+ log console).
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
const OUT = path.join(N7, "r86n7-scale-analysis.json");
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
const clampU8 = (v) => Math.max(0, Math.min(255, Math.round(v)));
function madWin(a, b, lo, hi) { let s = 0, n = 0; for (let i = lo; i < hi; i++) { s += Math.abs(a[i] - b[i]); n++; } return n ? s / n : NaN; }

function weightsFor(spec, i, s, srcLen) {
  const phi = spec.phi || 0;
  let S = (i + 0.5) / s + phi;
  if (spec.kind === "posq") S = Math.round(S * spec.q) / spec.q;
  if (spec.kind === "posqf") S = Math.floor(S * spec.q) / spec.q;
  if (spec.kind === "fracq") {
    const u = S - 0.5, j0 = Math.floor(u);
    let f = u - j0;
    f = Math.round(f * spec.q) / spec.q;
    return [[j0, 1 - f], [j0 + 1, f]].filter(([j]) => j >= 0 && j < srcLen);
  }
  if (spec.kind === "fracqfloor") {
    const u = S - 0.5, j0 = Math.floor(u);
    let f = u - j0;
    f = Math.floor(f * spec.q) / spec.q;
    return [[j0, 1 - f], [j0 + 1, f]].filter(([j]) => j >= 0 && j < srcLen);
  }
  const u = S - 0.5, j0 = Math.floor(u), j1 = j0 + 1;
  const ws = [];
  for (const j of [j0, j1]) {
    if (j < 0 || j >= srcLen) continue;
    const w = tri(j + 0.5 - S);
    if (w > 0) ws.push([j, w]);
  }
  return ws;
}
function modelProfile(srcProf, srcLen, dstLen, sTrue, spec) {
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of weightsFor(spec, i, sTrue, srcLen)) acc += w * srcProf[j];
    out[i] = clampU8(acc);
  }
  return out;
}
function fitPhi(meas, srcProf, srcLen, dstLen, sTrue, specBase, lo, hi, phiLo = -0.08, phiHi = 0.08, step = 0.001) {
  let best = null;
  for (let phi = phiLo; phi <= phiHi + 1e-9; phi += step) {
    const m = modelProfile(srcProf, srcLen, dstLen, sTrue, { ...specBase, phi });
    const mad = madWin(meas, m, lo, hi);
    if (!best || mad < best.mad) best = { phi: r3(phi), mad: r3(mad) };
  }
  return best;
}

const probe7 = JSON.parse(fs.readFileSync(path.join(N7, "r86n7-video-operator2.json"), "utf8"));
const wave2 = JSON.parse(fs.readFileSync(path.join(M2, "r85m2-wave.json"), "utf8"));
const kernFit = JSON.parse(fs.readFileSync(path.join(N7, "r86n7-kernel-fit.json"), "utf8"));
const report = { generated: new Date().toISOString(), sections: {} };

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

// ---------- (a) posq/fracq 1/16 + 1/32 ----------
{
  const MODELS = [
    { label: "tri-float", kind: "float" },
    { label: "posq16", kind: "posq", q: 16 },
    { label: "posq32", kind: "posq", q: 32 },
    { label: "posqf16", kind: "posqf", q: 16 },
    { label: "posqf32", kind: "posqf", q: 32 },
    { label: "fracq16", kind: "fracq", q: 16 },
    { label: "fracq32", kind: "fracq", q: 32 },
    { label: "fracqfloor16", kind: "fracqfloor", q: 16 },
    { label: "fracqfloor32", kind: "fracqfloor", q: 32 },
  ];
  const fit = {};
  const stepClips = [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160], ["stepH255b", "H", 90]];
  for (const [name, kind, E] of stepClips) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    fit[name] = {};
    for (const sNom of probe7.scales) {
      const dump = probe7[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      const c = Math.round(E * sTrue);
      const row = {};
      for (const m of MODELS) row[m.label] = fitPhi(meas, src, src.length, dstLen, sTrue, m, Math.max(0, c - 60), Math.min(dstLen, c + 60));
      fit[name][`s${sNom}`] = row;
    }
  }
  fit.waves = {};
  for (const [name, kind] of [["sqw2-mid", "H"], ["sqw4-mid", "H"], ["sqw8-mid", "H"], ["sqw4x-mid", "V"], ["sqw4-640", "H"]]) {
    const bDump = decodeB64(wave2[name].dumps["B-1to1"].rgbB64, wave2[name].dumps["B-1to1"].w, wave2[name].dumps["B-1to1"].h);
    const src = profile1D(bDump, kind);
    fit.waves[name] = {};
    for (const sNom of wave2.scales) {
      const dump = wave2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      let lo = 10, hi = dstLen - 10;
      if (name === "sqw4-640") { lo = Math.floor(200 * sTrue); hi = Math.floor(350 * sTrue); }
      const row = {};
      for (const m of MODELS) row[m.label] = fitPhi(meas, src, src.length, dstLen, sTrue, m, lo, hi);
      fit.waves[name][`s${sNom}`] = row;
    }
  }
  const summarize = (group) => {
    const out = {};
    for (const m of MODELS) {
      let s = 0, n = 0, worst = 0;
      for (const clip of Object.values(group)) for (const row of Object.values(clip)) { const v = row[m.label].mad; s += v; n++; worst = Math.max(worst, v); }
      out[m.label] = { mean: r3(s / n), worst: r3(worst), n };
    }
    return out;
  };
  const stepGroup = Object.fromEntries(stepClips.map(([n]) => [n, fit[n]]));
  report.sections.quant16 = { detail: fit, summaryStep: summarize(stepGroup), summaryWave: summarize(fit.waves) };
  console.log("(a) posq/fracq 1/16+1/32 — bậc 255:", JSON.stringify(report.sections.quant16.summaryStep));
  console.log("    sóng dày:", JSON.stringify(report.sections.quant16.summaryWave));
  for (const [name, scales] of Object.entries(fit.waves)) {
    for (const [s, row] of Object.entries(scales)) {
      console.log(`    ${name} ${s}: ` + MODELS.map((m) => `${m.label}=${row[m.label].mad}@${row[m.label].phi}`).join(" "));
    }
  }
}

// ---------- (b) fit kernel tự do riêng từng thang (sóng) ----------
function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) throw new Error("suy biến " + c);
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}
{
  const KNOTS = [];
  for (let k = 0; k <= 20; k++) KNOTS.push(k * 0.1);
  const NK = KNOTS.length;
  const knotCoeffs = (ax) => {
    if (ax >= 2.0) return [];
    const pos = ax / 0.1, m0 = Math.floor(pos), f = pos - m0;
    if (f < 1e-12) return [[m0, 1]];
    return [[m0, 1 - f], [m0 + 1, f]];
  };
  const designRow = (src, srcLen, S) => {
    const coef = new Float64Array(NK);
    const j0 = Math.max(0, Math.floor(S - 2 - 0.5));
    const j1 = Math.min(srcLen - 1, Math.ceil(S + 2 - 0.5));
    for (let j = j0; j <= j1; j++) {
      const ax = Math.abs(j + 0.5 - S);
      for (const [m, c] of knotCoeffs(ax)) coef[m] += c * src[j];
    }
    return coef;
  };
  const evalKernel = (knots, x) => {
    const ax = Math.abs(x);
    if (ax >= 2.0) return 0;
    const pos = ax / 0.1, m0 = Math.floor(pos), f = pos - m0;
    if (f < 1e-12) return knots[m0];
    return knots[m0] * (1 - f) + knots[m0 + 1] * f;
  };
  const modelWithKernel = (knots, src, srcLen, dstLen, sTrue, phi) => {
    const out = new Float64Array(dstLen);
    for (let i = 0; i < dstLen; i++) {
      const S = (i + 0.5) / sTrue + phi;
      let acc = 0, wsum = 0;
      const j0 = Math.max(0, Math.floor(S - 2 - 0.5));
      const j1 = Math.min(srcLen - 1, Math.ceil(S + 2 - 0.5));
      for (let j = j0; j <= j1; j++) { const w = evalKernel(knots, j + 0.5 - S); acc += w * src[j]; wsum += w; }
      out[i] = wsum > 0 ? acc / wsum : acc;
    }
    return out;
  };
  const perScale = {};
  for (const sNom of wave2.scales) {
    const rows = [];
    for (const [name, kind] of [["sqw2-mid", "H"], ["sqw4-mid", "H"], ["sqw8-mid", "H"], ["sqw4x-mid", "V"], ["sqw4-640", "H"]]) {
      const bDump = decodeB64(wave2[name].dumps["B-1to1"].rgbB64, wave2[name].dumps["B-1to1"].w, wave2[name].dumps["B-1to1"].h);
      const src = profile1D(bDump, kind);
      const dump = wave2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      let lo = 10, hi = dstLen - 10;
      if (name === "sqw4-640") { lo = Math.floor(200 * sTrue); hi = Math.floor(350 * sTrue); }
      rows.push({ src, srcLen: src.length, dstLen, sTrue, meas, lo, hi });
    }
    let best = null;
    for (let phi = -0.06; phi <= 0.0201; phi += 0.005) {
      const A = Array.from({ length: NK }, () => new Float64Array(NK));
      const b = new Float64Array(NK);
      let n = 0;
      for (const r of rows) {
        for (let i = r.lo; i < r.hi; i++) {
          const S = (i + 0.5) / r.sTrue + phi;
          const coef = designRow(r.src, r.srcLen, S);
          for (let a = 0; a < NK; a++) {
            if (coef[a] === 0) continue;
            b[a] += coef[a] * r.meas[i];
            for (let c = a; c < NK; c++) A[a][c] += coef[a] * coef[c];
          }
          n++;
        }
      }
      for (let a = 0; a < NK; a++) for (let c = 0; c < a; c++) A[a][c] = A[c][a];
      for (let a = 0; a < NK; a++) { A[a][a] += 1e-3; b[a] += 1e-3 * tri(KNOTS[a]); }
      let knots;
      try { knots = solveLinear(A.map((row) => Array.from(row)), Array.from(b)); } catch { continue; }
      let sse = 0, cnt = 0;
      for (const r of rows) {
        const m = modelWithKernel(knots, r.src, r.srcLen, r.dstLen, r.sTrue, phi);
        for (let i = r.lo; i < r.hi; i++) { const d = m[i] - r.meas[i]; sse += d * d; cnt++; }
      }
      const rmse = Math.sqrt(sse / cnt);
      if (!best || rmse < best.rmse) best = { phi: r3(phi), rmse: r4(rmse), knots: knots.map((v) => r4(v)), n: cnt };
    }
    perScale[`s${sNom}`] = best;
    console.log(`(b) sóng thang s=${sNom}: phi*=${best.phi} RMSE=${best.rmse} k=[${best.knots.map((v) => v.toFixed(2)).join(" ")}]`);
  }
  report.sections.kernelPerScale = perScale;
}

// ---------- (c) MAD theo clip/thang của kernel tự do toàn cục ----------
{
  const knots = kernFit.sections.all.knots;
  const phi = kernFit.sections.all.phi;
  const evalKernel = (x) => {
    const ax = Math.abs(x);
    if (ax >= 2.0) return 0;
    const pos = ax / 0.1, m0 = Math.floor(pos), f = pos - m0;
    if (f < 1e-12) return knots[m0];
    return knots[m0] * (1 - f) + knots[m0 + 1] * f;
  };
  const modelWithKernel = (src, srcLen, dstLen, sTrue) => {
    const out = new Float64Array(dstLen);
    for (let i = 0; i < dstLen; i++) {
      const S = (i + 0.5) / sTrue + phi;
      let acc = 0, wsum = 0;
      const j0 = Math.max(0, Math.floor(S - 2 - 0.5));
      const j1 = Math.min(srcLen - 1, Math.ceil(S + 2 - 0.5));
      for (let j = j0; j <= j1; j++) { const w = evalKernel(j + 0.5 - S); acc += w * src[j]; wsum += w; }
      out[i] = wsum > 0 ? Math.max(0, Math.min(255, Math.round(acc / wsum))) : 0;
    }
    return out;
  };
  const res = {};
  for (const [name, kind] of [["sqw2-mid", "H"], ["sqw4-mid", "H"], ["sqw8-mid", "H"], ["sqw4x-mid", "V"], ["sqw4-640", "H"]]) {
    const bDump = decodeB64(wave2[name].dumps["B-1to1"].rgbB64, wave2[name].dumps["B-1to1"].w, wave2[name].dumps["B-1to1"].h);
    const src = profile1D(bDump, kind);
    res[name] = {};
    for (const sNom of wave2.scales) {
      const dump = wave2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      let lo = 10, hi = dstLen - 10;
      if (name === "sqw4-640") { lo = Math.floor(200 * sTrue); hi = Math.floor(350 * sTrue); }
      const m = modelWithKernel(src, src.length, dstLen, sTrue);
      res[name][`s${sNom}`] = r3(madWin(m, meas, lo, hi));
    }
  }
  report.sections.freeKernelMadByClip = res;
  console.log("(c) MAD kernel tự do toàn cục theo clip/thang:", JSON.stringify(res));
}

writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
