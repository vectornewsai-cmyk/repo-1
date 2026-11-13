#!/usr/bin/env node
/**
 * r85m2-wave-hphi.mjs — Phase 9 đợt 85, luồng M2: quét (h, φ) cho kernel
 * video trên sóng dày + kiểm tra tính tuần hoàn của phần dư.
 *
 * Ứng viên còn lại sau wave-refine: (h) kernel tam giác kéo giãn nhẹ
 * (h ≠ 1), (i) pha răng cưa theo vị trí (lượng tử hoá điểm cố định —
 * phần dư có chu kỳ theo chỉ số pixel đích), (j) làm tròn uint8 trung
 * gian (sàn ~0,25 MAD trên sóng dày — đối chứng bằng canvas-Mit).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r85m2-wave-hphi.mjs
 * Chỉ đo offline. KHÔNG push/tag/binary/workflow. KHÔNG sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M2 = path.join(GOAL, "round85-m2");
const PROBE = path.join(M2, "r85m2-wave.json");
const OUT = path.join(M2, "r85m2-wave-hphi.json");
const r3 = (v) => +v.toFixed(3);

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
function weights1D(i, s, srcLen, h = 1, phi = 0) {
  const S = (i + 0.5) / s + phi;
  const j0 = Math.max(0, Math.floor(S - h - 0.5));
  const j1 = Math.min(srcLen - 1, Math.ceil(S + h - 0.5));
  const ws = [];
  let wsum = 0;
  for (let j = j0; j <= j1; j++) {
    const w = tri((j + 0.5 - S) / h);
    if (w === 0) continue;
    ws.push([j, w]);
    wsum += w;
  }
  if (wsum === 0) return [[Math.min(srcLen - 1, Math.max(0, Math.round(S))), 1]];
  return ws.map(([j, w]) => [j, w / wsum]);
}
function modelProfile(srcProf, srcLen, dstLen, s, h = 1, phi = 0) {
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of weights1D(i, s, srcLen, h, phi)) acc += w * srcProf[j];
    out[i] = acc;
  }
  return out;
}
function madWin(a, b, lo, hi) {
  let s = 0, n = 0;
  for (let i = lo; i < hi; i++) { s += Math.abs(a[i] - b[i]); n++; }
  return r3(s / n);
}
// Tự tương quan của phần dư theo lag (tìm chu kỳ răng cưa).
function residAutocorr(resid, lo, hi, maxLag = 16) {
  const n = hi - lo;
  const mean = resid.slice(lo, hi).reduce((a, b) => a + b, 0) / n;
  const v = resid.slice(lo, hi).map((x) => x - mean);
  const var0 = v.reduce((a, b) => a + b * b, 0) / n;
  const out = [];
  for (let lag = 1; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = 0; i < n - lag; i++) s += v[i] * v[i + lag];
    out.push(r3(s / (n - lag) / var0));
  }
  return out;
}

const probe = JSON.parse(fs.readFileSync(PROBE, "utf8"));
const KINDS = { "sqw4-640": "H", "sqw2-mid": "H", "sqw4-mid": "H", "sqw8-mid": "H", "sqw4x-mid": "V" };
const SCALES = probe.scales;
const report = { generated: new Date().toISOString(), hphi: {}, residPeriod: {} };

for (const [name, kind] of Object.entries(KINDS)) {
  const bDump = decodeB64(probe[name].dumps["B-1to1"].rgbB64, probe[name].dumps["B-1to1"].w, probe[name].dumps["B-1to1"].h);
  const srcProf = profile1D(bDump, kind);
  const srcLen = srcProf.length;
  const entry = {};
  for (const sNom of SCALES) {
    const dstLen = kind === "V" ? Math.round(640 * sNom) : Math.round(360 * sNom);
    const sTrue = dstLen / srcLen;
    const dump = decodeB64(probe[name].dumps[`exp-high-video-s${sNom}`].rgbB64, probe[name].dumps[`exp-high-video-s${sNom}`].w, probe[name].dumps[`exp-high-video-s${sNom}`].h);
    const meas = profile1D(dump, kind);
    let lo = 0, hi = dstLen;
    if (name === "sqw4-640") { lo = Math.floor(200 * sTrue); hi = Math.floor(350 * sTrue); }
    // Quét (h, φ).
    let best = null;
    for (let h = 0.9; h <= 1.1001; h += 0.01) {
      for (let phi = -0.06; phi <= 0.0601; phi += 0.01) {
        const m = madWin(meas, modelProfile(srcProf, srcLen, dstLen, sTrue, h, phi), lo, hi);
        if (!best || m < best.mad) best = { h: r3(h), phi: r3(phi), mad: m };
      }
    }
    // Phần dư với (h=1, φ*) — tự tương quan theo lag.
    let bestPhi = null;
    for (let phi = -0.06; phi <= 0.0601; phi += 0.005) {
      const m = madWin(meas, modelProfile(srcProf, srcLen, dstLen, sTrue, 1, phi), lo, hi);
      if (!bestPhi || m < bestPhi.mad) bestPhi = { phi: r3(phi), mad: m };
    }
    const mod = modelProfile(srcProf, srcLen, dstLen, sTrue, 1, bestPhi.phi);
    const resid = new Float64Array(dstLen);
    for (let i = 0; i < dstLen; i++) resid[i] = meas[i] - mod[i];
    const ac = residAutocorr(resid, lo, hi, 12);
    entry[`s${sNom}`] = { bestHPhi: best, phiOnly: bestPhi, residAutocorrLag1_12: ac };
    console.log(`${name} s=${sNom}: (h,φ)* = (${best.h}, ${best.phi}) MAD=${best.mad} | φ-only ${bestPhi.phi} MAD=${bestPhi.mad} | dư autocorr lag1..12: ${ac.join(",")}`);
  }
  report.hphi[name] = entry;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
