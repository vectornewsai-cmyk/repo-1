#!/usr/bin/env node
/**
 * r86n7-phase-analyze.mjs — Phase 9 đợt 86, luồng N7 (phần 2): phần dư sóng
 * dày có phải hàm xác định của pha? φ* có trôi theo x? họ kernel Keys-C-nhỏ?
 *
 * 1. e (trích trực tiếp từ bậc 255) theo frac(S0): bin 16 — nếu e là hàm
 *    trơn của pha -> sai hình kernel; nếu ngẫu nhiên theo pixel -> lượng
 *    tử hoá/nhiễu vị trí.
 * 2. φ* theo cửa sổ x trên sóng sqw2/sq w4 (s=1,5 / 2,25): trôi tuyến tính
 *    hay nhảy theo tile?
 * 3. Phần dư sau tri-float(φ*) theo frac(S): bin 16 — chữ ký của kernel.
 * 4. Fit thêm: Keys (B,C) lưới nhỏ, fracq-floor, φ sweep mịn 0,001.
 * 5. CTM-off0 vs explicit: pixel nào lệch, bao nhiêu.
 *
 * Vào: r86n7-video-operator2.json, r85m2-wave.json, r86n7-weights-analysis.json.
 * Ra: hidden_files/round86-n7/r86n7-phase-analysis.json (+ log console).
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { bcCubicKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const N7 = path.join(GOAL, "round86-n7");
const M2 = path.join(GOAL, "round85-m2");
const MEDIA7 = path.join(N7, "media");
const OUT = path.join(N7, "r86n7-phase-analysis.json");
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
  if (spec.kind === "fracqfloor") {
    const u = S - 0.5, j0 = Math.floor(u);
    let f = u - j0;
    f = Math.floor(f * spec.q) / spec.q;
    return [[j0, 1 - f], [j0 + 1, f]].filter(([j]) => j >= 0 && j < srcLen);
  }
  if (spec.kind === "fracq") {
    const u = S - 0.5, j0 = Math.floor(u);
    let f = u - j0;
    f = Math.round(f * spec.q) / spec.q;
    return [[j0, 1 - f], [j0 + 1, f]].filter(([j]) => j >= 0 && j < srcLen);
  }
  if (spec.kind === "keys") {
    const j0 = Math.max(0, Math.floor(S - 2 - 0.5));
    const j1 = Math.min(srcLen - 1, Math.ceil(S + 2 - 0.5));
    const ws = [];
    let sum = 0;
    for (let j = j0; j <= j1; j++) {
      const w = bcCubicKernel(j + 0.5 - S, spec.B, spec.C);
      if (w === 0) continue;
      ws.push([j, w]); sum += w;
    }
    if (sum === 0) return [[Math.min(srcLen - 1, Math.max(0, Math.round(S))), 1]];
    return ws.map(([j, w]) => [j, w / sum]);
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
const report = { generated: new Date().toISOString(), sections: {} };

// ---------- 1. e theo frac(S0) ----------
{
  const edges = { stepV255: ["V", 320], stepH255: ["H", 180], stepV255b: ["V", 160], stepH255b: ["H", 90] };
  const samples = [];
  for (const [name, [kind, E]] of Object.entries(edges)) {
    for (const sNom of probe7.scales) {
      const dump = probe7[name].dumps[`exp-high-video-s${sNom}`];
      if (!dump) continue;
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const srcLen = kind === "V" ? 640 : 360;
      const sTrue = meas.length / srcLen;
      for (let i = 0; i < meas.length; i++) {
        const v = meas[i];
        if (v <= 0 || v >= 255) continue;
        const S0 = (i + 0.5) / sTrue;
        if (S0 < E - 1.5 || S0 > E + 0.5) continue;
        samples.push({ clip: name, s: sNom, i, fracS0: r4(S0 - Math.floor(S0)), e: r4((E - 0.5 + v / 255) - S0) });
      }
    }
  }
  const bins = Array.from({ length: 16 }, () => []);
  for (const s of samples) bins[Math.min(15, Math.floor(s.fracS0 * 16))].push(s.e);
  const binSummary = bins.map((b, k) => ({ bin: `${(k / 16).toFixed(3)}-${((k + 1) / 16).toFixed(3)}`, n: b.length, meanE: b.length ? r4(b.reduce((a, c) => a + c, 0) / b.length) : null, minE: b.length ? Math.min(...b) : null, maxE: b.length ? Math.max(...b) : null }));
  report.sections.eVsPhase = { n: samples.length, bins: binSummary, samples };
  console.log("1. e theo frac(S0) (bin 1/16):");
  for (const b of binSummary) console.log(`   ${b.bin} n=${b.n} meanE=${b.meanE} [${b.minE}, ${b.maxE}]`);
}

// ---------- 2. φ* theo cửa sổ x trên sóng ----------
{
  const res = {};
  for (const [name, kind] of [["sqw2-mid", "H"], ["sqw4-mid", "H"]]) {
    const bDump = decodeB64(wave2[name].dumps["B-1to1"].rgbB64, wave2[name].dumps["B-1to1"].w, wave2[name].dumps["B-1to1"].h);
    const src = profile1D(bDump, kind);
    const srcLen = src.length;
    res[name] = {};
    for (const sNom of [1.5, 2.25]) {
      const dump = wave2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / srcLen;
      const wins = [];
      const W = 4, wlen = Math.floor((dstLen - 20) / W);
      for (let k = 0; k < W; k++) {
        const lo = 10 + k * wlen, hi = 10 + (k + 1) * wlen;
        wins.push({ window: k, xSrcRange: [r3(lo / sTrue), r3(hi / sTrue)], ...fitPhi(meas, src, srcLen, dstLen, sTrue, { kind: "float" }, lo, hi) });
      }
      res[name][`s${sNom}`] = wins;
    }
  }
  report.sections.phiByWindow = res;
  console.log("2. φ* theo cửa sổ x:", JSON.stringify(res));
}

// ---------- 3. Phần dư sau tri-float(φ*) theo frac(S) ----------
{
  const res = {};
  for (const [name, kind] of [["sqw2-mid", "H"], ["sqw4-mid", "H"], ["sqw8-mid", "H"]]) {
    const bDump = decodeB64(wave2[name].dumps["B-1to1"].rgbB64, wave2[name].dumps["B-1to1"].w, wave2[name].dumps["B-1to1"].h);
    const src = profile1D(bDump, kind);
    const srcLen = src.length;
    res[name] = {};
    for (const sNom of [1.5, 2.25, 3]) {
      const dump = wave2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / srcLen;
      const best = fitPhi(meas, src, srcLen, dstLen, sTrue, { kind: "float" }, 10, dstLen - 10);
      const model = modelProfile(src, srcLen, dstLen, sTrue, { kind: "float", phi: best.phi });
      const bins = Array.from({ length: 16 }, () => []);
      for (let i = 10; i < dstLen - 10; i++) {
        const S = (i + 0.5) / sTrue + best.phi;
        bins[Math.min(15, Math.floor((S - Math.floor(S)) * 16))].push(meas[i] - model[i]);
      }
      res[name][`s${sNom}`] = {
        phiStar: best.phi, mad: best.mad,
        residByPhase: bins.map((b, k) => ({ bin: k, n: b.length, mean: b.length ? r3(b.reduce((a, c) => a + c, 0) / b.length) : null, std: b.length ? r3(Math.sqrt(b.reduce((a, c) => a + c * c, 0) / b.length)) : null })),
      };
    }
  }
  report.sections.residVsPhase = res;
  console.log("3. Phần dư theo frac(S) (mean/std theo bin 1/16):");
  for (const [name, scales] of Object.entries(res)) for (const [s, v] of Object.entries(scales)) {
    console.log(`   ${name} ${s} phi*=${v.phiStar} mad=${v.mad}: ` + v.residByPhase.map((b) => `${b.bin}:${b.mean}±${b.std}`).join(" "));
  }
}

// ---------- 4. Fit thêm: Keys-C-nhỏ + fracq-floor, sweep mịn ----------
{
  const MODELS = [
    { label: "tri-float", kind: "float" },
    { label: "fracq64", kind: "fracq", q: 64 },
    { label: "fracqfloor64", kind: "fracqfloor", q: 64 },
    { label: "fracqfloor256", kind: "fracqfloor", q: 256 },
    { label: "keysB0C0.02", kind: "keys", B: 0, C: 0.02 },
    { label: "keysB0C0.05", kind: "keys", B: 0, C: 0.05 },
    { label: "keysB0C0.1", kind: "keys", B: 0, C: 0.1 },
    { label: "keysB0C0.2", kind: "keys", B: 0, C: 0.2 },
    { label: "keysB0.33C0", kind: "keys", B: 1 / 3, C: 0 },
    { label: "keysB0.33C0.05", kind: "keys", B: 1 / 3, C: 0.05 },
  ];
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
  const fit = {};
  const stepClips = [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160], ["stepH255b", "H", 90]];
  for (const [name, kind, E] of stepClips) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    const srcLen = src.length;
    fit[name] = {};
    for (const sNom of probe7.scales) {
      const dump = probe7[name].dumps[`exp-high-video-s${sNom}`];
      if (!dump) continue;
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / srcLen;
      const c = Math.round(E * sTrue);
      const row = {};
      for (const m of MODELS) row[m.label] = fitPhi(meas, src, srcLen, dstLen, sTrue, m, Math.max(0, c - 60), Math.min(dstLen, c + 60));
      fit[name][`s${sNom}`] = row;
    }
  }
  fit.waves = {};
  for (const [name, kind] of [["sqw2-mid", "H"], ["sqw4-mid", "H"], ["sqw8-mid", "H"], ["sqw4x-mid", "V"]]) {
    const bDump = decodeB64(wave2[name].dumps["B-1to1"].rgbB64, wave2[name].dumps["B-1to1"].w, wave2[name].dumps["B-1to1"].h);
    const src = profile1D(bDump, kind);
    const srcLen = src.length;
    fit.waves[name] = {};
    for (const sNom of wave2.scales) {
      const dump = wave2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / srcLen;
      const row = {};
      for (const m of MODELS) row[m.label] = fitPhi(meas, src, srcLen, dstLen, sTrue, m, 10, dstLen - 10);
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
  report.sections.modelFit2 = { detail: fit, summaryStep: summarize(stepGroup), summaryWave: summarize(fit.waves) };
  console.log("4. Fit mở rộng — bậc 255:", JSON.stringify(report.sections.modelFit2.summaryStep));
  console.log("   sóng dày:", JSON.stringify(report.sections.modelFit2.summaryWave));
  for (const [name, scales] of Object.entries(fit.waves)) {
    for (const [s, row] of Object.entries(scales)) {
      console.log(`   ${name} ${s}: ` + MODELS.map((m) => `${m.label}=${row[m.label].mad}@${row[m.label].phi}`).join(" "));
    }
  }
}

// ---------- 5. CTM-off0 vs explicit ----------
{
  const res = {};
  for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160]]) {
    const raw = fs.readFileSync(path.join(MEDIA7, name + ".rgb"));
    const src = kind === "V"
      ? (() => { const p = new Float64Array(640); for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; p[x] = s / 8; } return p; })()
      : (() => { const p = new Float64Array(360); for (let y = 0; y < 360; y++) { let s = 0; for (let x = 310; x < 318; x++) s += raw[(y * 640 + x) * 3]; p[y] = s / 8; } return p; })();
    const srcLen = src.length;
    const dumpC = probe7[name].dumps["ctm-off0-video-s2.2639"];
    const dumpE = probe7[name].dumps["exp-high-video-s2.2639"];
    const c = profile1D(decodeB64(dumpC.rgbB64, dumpC.w, dumpC.h), kind);
    const e = profile1D(decodeB64(dumpE.rgbB64, dumpE.w, dumpE.h), kind);
    const diffs = [];
    for (let i = 0; i < c.length; i++) if (c[i] !== e[i]) diffs.push({ i, ctm: c[i], exp: e[i], d: r3(c[i] - e[i]) });
    const sTrue = c.length / srcLen;
    const ce = Math.round(E * sTrue);
    res[name] = { nDiff: diffs.length, maxAbsDiff: diffs.length ? Math.max(...diffs.map((d) => Math.abs(d.d))) : 0, madAll: r3(madWin(c, e, 0, c.length)), diffsNearEdge: diffs.filter((d) => Math.abs(d.i - ce) < 10), madWindow: r3(madWin(c, e, Math.max(0, ce - 60), Math.min(c.length, ce + 60))) };
  }
  report.sections.ctmVsExplicit = res;
  console.log("5. CTM-off0 vs explicit:", JSON.stringify(res));
}

writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
