#!/usr/bin/env node
/**
 * r86n7-verify.mjs — Phase 9 đợt 86, luồng N7 (phần cuối): kiểm chứng tổng hợp
 * danh tính toán tử video.
 *
 * 1. Khoảng φ cho MAD≤0,01 của posq16 (round) / posqf16 (floor) trên: bậc 255
 *    N7, sóng M2, bậc/vạch M2 (dataset độc lập), lineV N7 — giao nhau?
 * 2. CTM: float-tri vs posq16 (explicit lượng tử 1/16, CTM float?).
 * 3. Downscale s=0,6/0,75 (probe mới): tri / posq16 / Mitchell / box / stretch.
 * 4. Composite: mô hình thống nhất floor((128v+127bg+127)/255).
 * 5. Màu: fit ma trận YUV->RGB từ patch (least-squares) vs bt601/bt709;
 *    chroma upsample (nearest vs bilinear vs ffmpeg) trên bậc Cb/Cr;
 *    chroma dưới thang s=1,5: RGB-first (posq16) vs YUV-space scale.
 *
 * Vào: r86n7-video-operator2.json, r86n7-downscale.json, r85m2-video-operator.json,
 *      r85m2-wave.json, *.yuv420 + *.dec.rgb (frame 0).
 * Ra: hidden_files/round86-n7/r86n7-verify.json (+ log console).
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, bcCubicKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const N7 = path.join(GOAL, "round86-n7");
const M2 = path.join(GOAL, "round85-m2");
const MEDIA7 = path.join(N7, "media");
const MEDIA2 = path.join(M2, "media");
const OUT = path.join(N7, "r86n7-verify.json");
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

function weightsFor(spec, i, s, srcLen) {
  const phi = spec.phi || 0;
  let S = (i + 0.5) / s + phi;
  if (spec.kind === "posq") S = Math.round(S * 16) / 16;
  if (spec.kind === "posqf") S = Math.floor(S * 16) / 16;
  if (spec.kind === "mitchell") return chromeWeights1D(i, s, srcLen, (x) => bcCubicKernel(x, 1 / 3, 1 / 3), 1);
  if (spec.kind === "box") {
    const j0 = Math.floor(S - 0.5), f = S - 0.5 - j0;
    return [[j0, 1 - f], [j0 + 1, f]].filter(([j]) => j >= 0 && j < srcLen);
  }
  if (spec.kind === "tristretch") {
    const h = spec.h;
    const j0 = Math.max(0, Math.floor(S - h - 0.5));
    const j1 = Math.min(srcLen - 1, Math.ceil(S + h - 0.5));
    const ws = [];
    let sum = 0;
    for (let j = j0; j <= j1; j++) { const w = tri((j + 0.5 - S) / h); if (w > 0) { ws.push([j, w]); sum += w; } }
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
/** Khoảng φ cho MAD <= thr (quét mịn). */
function phiInterval(meas, srcProf, srcLen, dstLen, sTrue, specBase, lo, hi, thr = 0.01) {
  let best = null, loPhi = null, hiPhi = null;
  for (let phi = -0.08; phi <= 0.02001; phi += 0.001) {
    const m = modelProfile(srcProf, srcLen, dstLen, sTrue, { ...specBase, phi });
    const mad = madWin(meas, m, lo, hi);
    if (!best || mad < best.mad) best = { phi: r4(phi), mad: r3(mad) };
    if (mad <= thr) { if (loPhi === null) loPhi = r4(phi); hiPhi = r4(phi); }
  }
  return { best, interval: loPhi === null ? null : [loPhi, hiPhi] };
}

const probe7 = JSON.parse(fs.readFileSync(path.join(N7, "r86n7-video-operator2.json"), "utf8"));
const down7 = JSON.parse(fs.readFileSync(path.join(N7, "r86n7-downscale.json"), "utf8"));
const probe2 = JSON.parse(fs.readFileSync(path.join(M2, "r85m2-video-operator.json"), "utf8"));
const wave2 = JSON.parse(fs.readFileSync(path.join(M2, "r85m2-wave.json"), "utf8"));
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

// ---------- 1. Khoảng φ posq16 / posqf16 ----------
{
  const cases = [];
  // N7 bậc 255
  for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160], ["stepH255b", "H", 90]]) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    for (const sNom of probe7.scales) {
      if (sNom === 0.5 || sNom === 1) continue;
      const dump = probe7[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      const c = Math.round(E * sTrue);
      cases.push({ tag: `${name} s${sNom}`, meas, src, srcLen: src.length, dstLen, sTrue, lo: Math.max(0, c - 60), hi: Math.min(dstLen, c + 60) });
    }
  }
  // M2 sóng
  for (const [name, kind] of [["sqw2-mid", "H"], ["sqw4-mid", "H"], ["sqw8-mid", "H"], ["sqw4x-mid", "V"], ["sqw4-640", "H"]]) {
    const bDump = decodeB64(wave2[name].dumps["B-1to1"].rgbB64, wave2[name].dumps["B-1to1"].w, wave2[name].dumps["B-1to1"].h);
    const src = profile1D(bDump, kind);
    for (const sNom of wave2.scales) {
      const dump = wave2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      let lo = 10, hi = dstLen - 10;
      if (name === "sqw4-640") { lo = Math.floor(200 * sTrue); hi = Math.floor(350 * sTrue); }
      cases.push({ tag: `${name} s${sNom}`, meas, src, srcLen: src.length, dstLen, sTrue, lo, hi });
    }
  }
  // M2 bậc/vạch 64->192 (dataset độc lập)
  for (const [name, kind, E] of [["stepV-gray", "V", 320], ["stepH-gray", "H", 180], ["lineV-gray", "V", 320], ["lineH-gray", "H", 180]]) {
    const src = srcProfFromRgb(path.join(MEDIA2, name + ".rgb"), kind);
    for (const sNom of [1.125, 1.5, 2.25, 3.0]) {
      const dump = probe2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      const c = Math.round(E * sTrue);
      cases.push({ tag: `M2:${name} s${sNom}`, meas, src, srcLen: src.length, dstLen, sTrue, lo: Math.max(0, c - 60), hi: Math.min(dstLen, c + 60) });
    }
  }
  // lineV N7
  {
    const raw = fs.readFileSync(path.join(MEDIA2, "lineV-gray.rgb"));
    const src = new Float64Array(640);
    for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; src[x] = s / 8; }
    for (const sNom of probe7.scales) {
      if (sNom === 0.5 || sNom === 1) continue;
      const dump = probe7["lineV-gray"].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "V");
      const dstLen = meas.length, sTrue = dstLen / 640;
      const c = Math.round(320 * sTrue);
      cases.push({ tag: `lineV s${sNom}`, meas, src, srcLen: 640, dstLen, sTrue, lo: Math.max(0, c - 60), hi: Math.min(dstLen, c + 60) });
    }
  }
  const res = { nCases: cases.length, perCase: [] };
  let interRound = [-0.08, 0.02], interFloor = [-0.08, 0.02];
  let worstRound = 0, worstFloor = 0, nZeroRound = 0, nZeroFloor = 0;
  for (const c of cases) {
    const pr = phiInterval(c.meas, c.src, c.srcLen, c.dstLen, c.sTrue, { kind: "posq" }, c.lo, c.hi);
    const pf = phiInterval(c.meas, c.src, c.srcLen, c.dstLen, c.sTrue, { kind: "posqf" }, c.lo, c.hi);
    if (pr.interval) { interRound = [Math.max(interRound[0], pr.interval[0]), Math.min(interRound[1], pr.interval[1])]; }
    if (pf.interval) { interFloor = [Math.max(interFloor[0], pf.interval[0]), Math.min(interFloor[1], pf.interval[1])]; }
    worstRound = Math.max(worstRound, pr.best.mad);
    worstFloor = Math.max(worstFloor, pf.best.mad);
    if (pr.best.mad === 0) nZeroRound++;
    if (pf.best.mad === 0) nZeroFloor++;
    res.perCase.push({ tag: c.tag, round: pr, floor: pf });
  }
  res.intersectionRound = interRound;
  res.intersectionFloor = interFloor;
  res.worstMadRound = worstRound;
  res.worstMadFloor = worstFloor;
  res.nZeroRound = nZeroRound;
  res.nZeroFloor = nZeroFloor;
  report.sections.phiIntervals = res;
  console.log(`1. φ-intervals (MAD≤0,01): n=${cases.length} | round giao nhau ${JSON.stringify(interRound)} worstMAD=${worstRound} nZero=${nZeroRound} | floor giao nhau ${JSON.stringify(interFloor)} worstMAD=${worstFloor} nZero=${nZeroFloor}`);
}

// ---------- 2. CTM: float vs posq16 ----------
{
  const res = {};
  for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160]]) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    res[name] = {};
    for (const key of ["ctm-off0-video-s2.2639", "ctm-off0.5-video-s2.2639"]) {
      const dump = probe7[name].dumps[key];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      const c = Math.round(E * sTrue);
      const lo = Math.max(0, c - 60), hi = Math.min(dstLen, c + 60);
      const row = {};
      for (const m of [{ label: "tri-float", kind: "float" }, { label: "posq16", kind: "posq" }, { label: "posqf16", kind: "posqf" }]) {
        row[m.label] = phiInterval(meas, src, src.length, dstLen, sTrue, m, lo, hi);
      }
      res[name][key] = row;
    }
  }
  report.sections.ctmModel = res;
  console.log("2. CTM model:", JSON.stringify(res));
}

// ---------- 3. Downscale ----------
{
  const res = {};
  const MODELS = [
    { label: "tri-float", kind: "float" },
    { label: "posq16", kind: "posq" },
    { label: "mitchell", kind: "mitchell" },
    { label: "box", kind: "box" },
  ];
  for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180]]) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    res[name] = {};
    for (const sNom of [0.6, 0.75]) {
      const dump = down7[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      const c = Math.round(E * sTrue);
      const row = {};
      for (const m of MODELS) row[m.label] = phiInterval(meas, src, src.length, dstLen, sTrue, m, Math.max(0, c - 40), Math.min(dstLen, c + 40));
      // tri-stretch h=1/(2s)
      row["tri-stretch"] = phiInterval(meas, src, src.length, dstLen, sTrue, { kind: "tristretch", h: 1 / (2 * sTrue) }, Math.max(0, c - 40), Math.min(dstLen, c + 40));
      res[name][`s${sNom}`] = row;
    }
  }
  // lineV + sqw4-mid downscale
  {
    const raw = fs.readFileSync(path.join(MEDIA2, "lineV-gray.rgb"));
    const src = new Float64Array(640);
    for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; src[x] = s / 8; }
    res["lineV-gray"] = {};
    for (const sNom of [0.6, 0.75]) {
      const dump = down7["lineV-gray"].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "V");
      const dstLen = meas.length, sTrue = dstLen / 640;
      const c = Math.round(320 * sTrue);
      const row = {};
      for (const m of MODELS) row[m.label] = phiInterval(meas, src, 640, dstLen, sTrue, m, Math.max(0, c - 40), Math.min(dstLen, c + 40));
      row["tri-stretch"] = phiInterval(meas, src, 640, dstLen, sTrue, { kind: "tristretch", h: 1 / (2 * sTrue) }, Math.max(0, c - 40), Math.min(dstLen, c + 40));
      res["lineV-gray"][`s${sNom}`] = row;
    }
  }
  {
    const bDump = decodeB64(wave2["sqw4-mid"].dumps["B-1to1"].rgbB64, wave2["sqw4-mid"].dumps["B-1to1"].w, wave2["sqw4-mid"].dumps["B-1to1"].h);
    const src = profile1D(bDump, "H");
    res["sqw4-mid"] = {};
    for (const sNom of [0.6, 0.75]) {
      const dump = down7["sqw4-mid"].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "H");
      const dstLen = meas.length, sTrue = dstLen / src.length;
      const row = {};
      for (const m of MODELS) row[m.label] = phiInterval(meas, src, src.length, dstLen, sTrue, m, 10, dstLen - 10);
      row["tri-stretch"] = phiInterval(meas, src, src.length, dstLen, sTrue, { kind: "tristretch", h: 1 / (2 * sTrue) }, 10, dstLen - 10);
      res["sqw4-mid"][`s${sNom}`] = row;
    }
  }
  report.sections.downscale = res;
  console.log("3. Downscale:", JSON.stringify(res));
}

// ---------- 4. Composite: mô hình thống nhất ----------
{
  const res = {};
  const dump = probe7["stepV255"].dumps["exp-high-video-s1.5"];
  const ref = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "V");
  for (const [key, bg] of [["comp-black-a05-s1.5", 0], ["comp-white-a05-s1.5", 255]]) {
    const d = probe7["stepV255"].dumps[key];
    const meas = profile1D(decodeB64(d.rgbB64, d.w, d.h), "V");
    const model = ref.map((v) => Math.floor((128 * v + 127 * bg + 127) / 255));
    let maxD = 0;
    for (let i = 0; i < meas.length; i++) maxD = Math.max(maxD, Math.abs(meas[i] - model[i]));
    res[key] = { mad: r3(madWin(meas, model, 0, meas.length)), maxDiff: maxD };
  }
  report.sections.compositeUnified = res;
  console.log("4. Composite thống nhất floor((128v+127bg+127)/255):", JSON.stringify(res));
}

// ---------- 5. Màu ----------
{
  // 5a. Fit ma trận YUV->RGB từ patch
  const yuv = fs.readFileSync(path.join(N7, "patches.yuv420"));
  const Y = yuv.subarray(0, 640 * 360);
  const U = yuv.subarray(640 * 360, 640 * 360 + 320 * 180);
  const V = yuv.subarray(640 * 360 + 320 * 180, 640 * 360 + 320 * 180 + 320 * 180);
  const chrome = {};
  for (const key of ["B-1to1-top", "B-1to1-bot"]) {
    const d = probe7["patches"].dumps[key];
    chrome[key] = decodeB64(d.rgbB64, d.w, d.h);
  }
  const patchRGB = [];
  const patchYUV = [];
  for (let k = 0; k < 8; k++) {
    const cx = (k % 4) * 160 + 80, cy = (Math.floor(k / 4)) * 180 + 90;
    // Chrome RGB: strip top (y 80..99) hoặc bot (y 260..279)
    const strip = k < 4 ? chrome["B-1to1-top"] : chrome["B-1to1-bot"];
    const y0 = k < 4 ? 80 : 260;
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = cy - 10; y < cy + 10; y++) for (let x = cx - 10; x < cx + 10; x++) {
      const idx = ((y - y0) * strip.w + x) * 3;
      r += strip.data[idx]; g += strip.data[idx + 1]; b += strip.data[idx + 2]; n++;
    }
    patchRGB.push([r / n, g / n, b / n]);
    // YUV planes frame 0
    let yy = 0, uu = 0, vv = 0, n2 = 0;
    for (let y = cy - 10; y < cy + 10; y++) for (let x = cx - 10; x < cx + 10; x++) { yy += Y[y * 640 + x]; n2++; }
    for (let y = cy / 2 - 5; y < cy / 2 + 5; y++) for (let x = cx / 2 - 5; x < cx / 2 + 5; x++) { uu += U[y * 320 + x]; vv += V[y * 320 + x]; }
    patchYUV.push([yy / n2, uu / 100, vv / 100]);
  }
  // least squares: RGB_c = a*Y + b*Cb + c*Cr + d (mỗi kênh riêng)
  const fitChannel = (ch) => {
    const A = Array.from({ length: 4 }, () => new Float64Array(4));
    const bb = new Float64Array(4);
    for (let k = 0; k < 8; k++) {
      const row = [patchYUV[k][0], patchYUV[k][1], patchYUV[k][2], 1];
      for (let a = 0; a < 4; a++) { bb[a] += row[a] * patchRGB[k][ch]; for (let c = 0; c < 4; c++) A[a][c] += row[a] * row[c]; }
    }
    return solveLinear(A.map((r) => Array.from(r)), Array.from(bb));
  };
  const M = [fitChannel(0), fitChannel(1), fitChannel(2)];
  // residual của fit
  let maxRes = 0;
  for (let k = 0; k < 8; k++) {
    for (let ch = 0; ch < 3; ch++) {
      const pred = M[ch][0] * patchYUV[k][0] + M[ch][1] * patchYUV[k][1] + M[ch][2] * patchYUV[k][2] + M[ch][3];
      maxRes = Math.max(maxRes, Math.abs(pred - patchRGB[k][ch]));
    }
  }
  // so với bt601 / bt709 (limited): R=1.164(Y-16)+kr(Cr-128) ...
  const bt601 = [[1.164, 0, 1.596, -1.164 * 16 - 1.596 * 128], [1.164, -0.392, -0.813, -1.164 * 16 + 0.392 * 128 + 0.813 * 128], [1.164, 2.017, 0, -1.164 * 16 - 2.017 * 128]];
  const bt709 = [[1.164, 0, 1.793, -1.164 * 16 - 1.793 * 128], [1.164, -0.213, -0.533, -1.164 * 16 + 0.213 * 128 + 0.533 * 128], [1.164, 2.115, 0, -1.164 * 16 - 2.115 * 128]];
  const errVs = (ref) => {
    let e = 0;
    for (let ch = 0; ch < 3; ch++) for (let j = 0; j < 4; j++) e = Math.max(e, Math.abs(M[ch][j] - ref[ch][j]));
    return r4(e);
  };
  // Chrome vs ffmpeg decode tại tâm patch
  const decRgb = fs.readFileSync(path.join(N7, "patches.dec.rgb"));
  let maxChromeVsFfmpeg = 0;
  for (let k = 0; k < 8; k++) {
    const cx = (k % 4) * 160 + 80, cy = (Math.floor(k / 4)) * 180 + 90;
    for (let ch = 0; ch < 3; ch++) {
      let s = 0, n = 0;
      for (let y = cy - 10; y < cy + 10; y++) for (let x = cx - 10; x < cx + 10; x++) { s += decRgb[(y * 640 + x) * 3 + ch]; n++; }
      maxChromeVsFfmpeg = Math.max(maxChromeVsFfmpeg, Math.abs(s / n - patchRGB[k][ch]));
    }
  }
  report.sections.colorMatrix = {
    patchYUV: patchYUV.map((p) => p.map((v) => r3(v))),
    patchRGBchrome: patchRGB.map((p) => p.map((v) => r3(v))),
    fittedM: M.map((row) => row.map((v) => r4(v))),
    maxFitResidual: r4(maxRes),
    maxCoeffErrVsBt601: errVs(bt601),
    maxCoeffErrVsBt709: errVs(bt709),
    maxChromeVsFfmpegPatchCenter: r4(maxChromeVsFfmpeg),
  };
  console.log("5a. Ma trận YUV->RGB fit:", JSON.stringify(report.sections.colorMatrix.fittedM));
  console.log(`    max residual fit=${r4(maxRes)} | sai số hệ số vs bt601=${errVs(bt601)} vs bt709=${errVs(bt709)} | Chrome vs ffmpeg tại tâm patch max=${r4(maxChromeVsFfmpeg)}`);

  // 5b. Chroma upsample: bậc Cb/Cr B-1to1 vs nearest/bilinear/ffmpeg
  const yuv601 = (y, cb, cr) => [
    clampU8(1.164383 * (y - 16) + 1.79274 * (cr - 128)),
    clampU8(1.164383 * (y - 16) - 0.21325 * (cb - 128) - 0.53282 * (cr - 128)),
    clampU8(1.164383 * (y - 16) + 2.1122 * (cb - 128)),
  ];
  const resB = {};
  for (const name of ["stepV-colorCb", "stepV-colorCr"]) {
    const yuvRaw = fs.readFileSync(path.join(N7, `${name}.yuv420`));
    const Yp = yuvRaw.subarray(0, 640 * 360);
    const Up = yuvRaw.subarray(640 * 360, 640 * 360 + 320 * 180);
    const Vp = yuvRaw.subarray(640 * 360 + 320 * 180, 640 * 360 + 320 * 180 + 320 * 180);
    const dec = fs.readFileSync(path.join(N7, `${name}.dec.rgb`));
    const bDump = decodeB64(probe2[name].dumps["B-1to1"].rgbB64, probe2[name].dumps["B-1to1"].w, probe2[name].dumps["B-1to1"].h);
    const chromeProf = profile1D(bDump, "V"); // strip y=170..189, full width
    // profile ffmpeg decode (cùng strip)
    const ffProf = new Float64Array(640);
    for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 190; y++) s += dec[(y * 640 + x) * 3]; ffProf[x] = s / 20; }
    // model nearest / bilinear chroma upsample (bt601, Y từ plane, chroma từ plane)
    const upsample = (plane, w, h, mode) => {
      const out = new Float64Array(w * 2 * (h * 2));
      for (let y = 0; y < h * 2; y++) for (let x = 0; x < w * 2; x++) {
        if (mode === "nearest") out[y * w * 2 + x] = plane[Math.floor(y / 2) * w + Math.floor(x / 2)];
        else {
          // bilinear: mẫu tại (x+0.5)/2 - 0.5 theo tọa độ chroma
          const sx = (x + 0.5) / 2 - 0.5, sy = (y + 0.5) / 2 - 0.5;
          const x0 = Math.max(0, Math.floor(sx)), x1 = Math.min(w - 1, x0 + 1);
          const y0 = Math.max(0, Math.floor(sy)), y1 = Math.min(h - 1, y0 + 1);
          const fx = Math.max(0, Math.min(1, sx - x0)), fy = Math.max(0, Math.min(1, sy - y0));
          out[y * w * 2 + x] = (plane[y0 * w + x0] * (1 - fx) * (1 - fy) + plane[y0 * w + x1] * fx * (1 - fy) + plane[y1 * w + x0] * (1 - fx) * fy + plane[y1 * w + x1] * fx * fy);
        }
      }
      return out;
    };
    const out = {};
    for (const mode of ["nearest", "bilinear"]) {
      const Uc = upsample(Up, 320, 180, mode);
      const Vc = upsample(Vp, 320, 180, mode);
      const prof = new Float64Array(640);
      for (let x = 0; x < 640; x++) {
        let s = 0;
        for (let y = 170; y < 190; y++) {
          const rgb = yuv601(Yp[y * 640 + x], Uc[y * 640 + x], Vc[y * 640 + x]);
          s += rgb[0];
        }
        prof[x] = s / 20;
      }
      out[mode] = r4(madWin(chromeProf, prof, 0, 640));
    }
    out.ffmpeg = r4(madWin(chromeProf, ffProf, 0, 640));
    // max diff chrome vs ffmpeg
    let mx = 0;
    for (let i = 0; i < 640; i++) mx = Math.max(mx, Math.abs(chromeProf[i] - ffProf[i]));
    out.maxChromeVsFfmpeg = r4(mx);
    resB[name] = out;
  }
  report.sections.chromaUpsample = resB;
  console.log("5b. Chroma upsample (MAD vs Chrome B-1to1, kênh R):", JSON.stringify(resB));

  // 5c. Chroma dưới thang s=1,5: RGB-first (posq16) vs YUV-space
  const resC = {};
  for (const name of ["stepV-colorCb", "stepV-colorCr"]) {
    const yuvRaw = fs.readFileSync(path.join(N7, `${name}.yuv420`));
    const Yp = yuvRaw.subarray(0, 640 * 360);
    const Up = yuvRaw.subarray(640 * 360, 640 * 360 + 320 * 180);
    const Vp = yuvRaw.subarray(640 * 360 + 320 * 180, 640 * 360 + 320 * 180 + 320 * 180);
    const dump = probe2[name].dumps["exp-high-video-s1.5"];
    const chromeProf = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "V");
    const dstLen = chromeProf.length, sTrue = dstLen / 640;
    // Model A: RGB-first — B-1to1 RGB profile scale bằng posq16
    const bDump = decodeB64(probe2[name].dumps["B-1to1"].rgbB64, probe2[name].dumps["B-1to1"].w, probe2[name].dumps["B-1to1"].h);
    const srcRgb = profile1D(bDump, "V");
    const modelA = modelProfile(srcRgb, 640, dstLen, sTrue, { kind: "posq", phi: -0.031 });
    // Model B: YUV-space — scale Y (posq16, 640->960), scale U/V (posq16, 320->480), rồi bt601
    const scalePlane = (plane, srcW, srcH, dstW, dstH) => {
      const tmp = new Float64Array(dstW * srcH);
      const sX = dstW / srcW;
      for (let y = 0; y < srcH; y++) for (let i = 0; i < dstW; i++) {
        let S = Math.round(((i + 0.5) / sX - 0.031) * 16) / 16;
        const u = S - 0.5, j0 = Math.floor(u);
        let acc = 0;
        for (const j of [j0, j0 + 1]) {
          if (j < 0 || j >= srcW) continue;
          acc += tri(j + 0.5 - S) * plane[y * srcW + j];
        }
        tmp[y * dstW + i] = acc;
      }
      const out = new Float64Array(dstW * dstH);
      const sY = dstH / srcH;
      for (let x = 0; x < dstW; x++) for (let i = 0; i < dstH; i++) {
        let S = Math.round(((i + 0.5) / sY - 0.031) * 16) / 16;
        const u = S - 0.5, j0 = Math.floor(u);
        let acc = 0;
        for (const j of [j0, j0 + 1]) {
          if (j < 0 || j >= srcH) continue;
          acc += tri(j + 0.5 - S) * tmp[j * dstW + x];
        }
        out[i * dstW + x] = acc;
      }
      return out;
    };
    const Ys = scalePlane(Yp, 640, 360, 960, 540);
    const Us = scalePlane(Up, 320, 180, 480, 270);
    const Vs = scalePlane(Vp, 320, 180, 480, 270);
    // profile R tại strip y=170..189 dst (tương ứng y nguồn 170..189? strip của M2 là y=170..189 trên dst 960x540 — lấy đúng hàng đó)
    const profB = new Float64Array(960);
    for (let x = 0; x < 960; x++) {
      let s = 0;
      for (let y = 170; y < 190; y++) {
        // Us/Vs ở nửa phân giải: tọa độ chroma = (x/2, y/2)
        const cx = Math.min(479, Math.floor(x / 2)), cy = Math.min(269, Math.floor(y / 2));
        const rgb = yuv601(Ys[y * 960 + x], Us[cy * 480 + cx], Vs[cy * 480 + cx]);
        s += rgb[0];
      }
      profB[x] = s / 20;
    }
    // strip của M2 cho V-kind là y=170..189 trên dst — profB dùng đúng hàng đó
    resC[name] = {
      modelA_rgbFirst_posq16: r4(madWin(chromeProf, modelA, 0, dstLen)),
      modelB_yuvSpace_posq16: r4(madWin(chromeProf, profB, 0, dstLen)),
    };
  }
  report.sections.chromaUnderScale = resC;
  console.log("5c. Chroma dưới thang s=1,5 (MAD kênh R):", JSON.stringify(resC));
}

writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
