#!/usr/bin/env node
/**
 * r86n7-weights-analyze.mjs — Phase 9 đợt 86, luồng N7: trích trọng số rời
 * rạc trực tiếp của toán tử video từ bậc 0->255 + fit mô hình ứng viên.
 *
 * Câu hỏi: phần dư sóng dày của M2 (§1.4: sau φ* còn ≤1,2 MAD sqw2 /
 * ≤0,5 MAD sqw4, có hệ thống, dạng sóng) do đâu? Ứng viên:
 *  (a) triangle float + φ≈−0,03 (baseline M2),
 *  (b) lượng tử hoá PHÂN SỐ (trọng số) q64/q128/q256,
 *  (c) lượng tử hoá VỊ TRÍ lấy mẫu q64/q256/q65536 (round/floor),
 *  (d) vị trí điểm cố định 16.16 kiểu libyuv (dx cắt ngọn + trọng số 8-bit),
 *  (e) triangle chập box nhỏ (tri⊛box w=0,2/0,4),
 *  (f) Mitchell / box (đối chứng + downscale s=0,5).
 * Thêm: trích trực tiếp S_meas từ bậc 255 (độ phân giải 1/255), kiểm trôi
 * pha theo x (φ* theo cửa sổ trên sóng), kiểm CTM offX=0,5, composite
 * globalAlpha=0,5, đối chứng canvas-high ≡ Mitchell, B-1to1 vs nguồn.
 *
 * Vào: hidden_files/round86-n7/r86n7-video-operator2.json (+ media .rgb),
 *      hidden_files/round85-m2/r85m2-video-operator.json + r85m2-wave.json.
 * Ra: hidden_files/round86-n7/r86n7-weights-analysis.json (+ log console).
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
const OUT = path.join(N7, "r86n7-weights-analysis.json");
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
function madWin(a, b, lo, hi) {
  let s = 0, n = 0;
  for (let i = lo; i < hi; i++) { s += Math.abs(a[i] - b[i]); n++; }
  return n ? s / n : NaN;
}
function madAll(a, b) { return madWin(a, b, 0, a.length); }
const tri = (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; };
const clampU8 = (v) => Math.max(0, Math.min(255, Math.round(v)));

/** Trọng số 1D cho 1 pixel đích theo spec mô hình. Trả [[j, w], ...]. */
function weightsFor(spec, i, s, srcLen, dstLen) {
  const phi = spec.phi || 0;
  let S = (i + 0.5) / s + phi;
  if (spec.kind === "posq") S = Math.round(S * spec.q) / spec.q;
  if (spec.kind === "posqf") S = Math.floor(S * spec.q) / spec.q;
  if (spec.kind === "fp16") {
    const dx = Math.floor((srcLen / dstLen) * 65536) / 65536;
    S = (i + 0.5) * dx + phi;
  }
  if (spec.kind === "fp16w8") {
    const dx = Math.floor((srcLen / dstLen) * 65536) / 65536;
    S = (i + 0.5) * dx + phi;
    const u = S - 0.5, j0 = Math.floor(u);
    let f = u - j0;
    f = Math.floor(f * 256) / 256;
    return [[j0, 1 - f], [j0 + 1, f]].filter(([j]) => j >= 0 && j < srcLen);
  }
  if (spec.kind === "fp8") {
    const dx = Math.floor((srcLen / dstLen) * 256) / 256;
    S = (i + 0.5) * dx + phi;
  }
  if (spec.kind === "fracq") {
    const u = S - 0.5, j0 = Math.floor(u);
    let f = u - j0;
    f = Math.round(f * spec.q) / spec.q;
    return [[j0, 1 - f], [j0 + 1, f]].filter(([j]) => j >= 0 && j < srcLen);
  }
  if (spec.kind === "tribox") {
    // tri chập box w: lấy mẫu số 41 điểm.
    const w = spec.w, N = 41;
    const j0 = Math.max(0, Math.floor(S - 1 - w / 2 - 0.5));
    const j1 = Math.min(srcLen - 1, Math.ceil(S + 1 + w / 2 - 0.5));
    const ws = [];
    let sum = 0;
    for (let j = j0; j <= j1; j++) {
      let acc = 0;
      for (let k = 0; k < N; k++) {
        const u = -w / 2 + (w * (k + 0.5)) / N;
        acc += tri(j + 0.5 - (S + u));
      }
      const ww = acc / N;
      if (ww > 1e-9) { ws.push([j, ww]); sum += ww; }
    }
    return ws.map(([j, ww]) => [j, ww / sum]);
  }
  if (spec.kind === "mitchell") {
    return chromeWeights1D(i, s, srcLen, (x) => bcCubicKernel(x, 1 / 3, 1 / 3), 1)
      .map(([j, w]) => [j, w]);
  }
  if (spec.kind === "box") {
    const j0 = Math.floor(S - 0.5), j1 = j0 + 1;
    const f = S - 0.5 - j0;
    return [[j0, 1 - f], [j1, f]].filter(([j]) => j >= 0 && j < srcLen);
  }
  // float triangle (baseline)
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
    for (const [j, w] of weightsFor(spec, i, sTrue, srcLen, dstLen)) acc += w * srcProf[j];
    out[i] = clampU8(acc);
  }
  return out;
}

/** Fit φ tốt nhất (sweep) cho 1 spec trên 1 cặp (meas, srcProf). */
function fitPhi(meas, srcProf, srcLen, dstLen, sTrue, specBase, lo, hi, phiLo = -0.08, phiHi = 0.08, step = 0.005) {
  let best = null;
  for (let phi = phiLo; phi <= phiHi + 1e-9; phi += step) {
    const spec = { ...specBase, phi };
    const m = modelProfile(srcProf, srcLen, dstLen, sTrue, spec);
    const mad = madWin(meas, m, lo, hi);
    if (!best || mad < best.mad) best = { phi: r3(phi), mad: r3(mad) };
  }
  return best;
}

const probe7 = JSON.parse(fs.readFileSync(path.join(N7, "r86n7-video-operator2.json"), "utf8"));
const probe2 = JSON.parse(fs.readFileSync(path.join(M2, "r85m2-video-operator.json"), "utf8"));
const wave2 = JSON.parse(fs.readFileSync(path.join(M2, "r85m2-wave.json"), "utf8"));
const report = { generated: new Date().toISOString(), sections: {} };

// ---------- 1. B-1to1 vs nguồn (.rgb) ----------
{
  const res = {};
  const srcProfFromRgb = (rgbPath, kind) => {
    const raw = fs.readFileSync(rgbPath);
    const W = 640, H = 360;
    if (kind === "V") {
      const prof = new Float64Array(W);
      for (let x = 0; x < W; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * W + x) * 3]; prof[x] = s / 8; }
      return prof;
    }
    const prof = new Float64Array(H);
    for (let y = 0; y < H; y++) { let s = 0; for (let x = 310; x < 318; x++) s += raw[(y * W + x) * 3]; prof[y] = s / 8; }
    return prof;
  };
  for (const [name, kind] of [["stepV255", "V"], ["stepH255", "H"], ["stepV255b", "V"], ["stepH255b", "H"]]) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    const b = decodeB64(probe7[name].dumps["B-1to1"].rgbB64, probe7[name].dumps["B-1to1"].w, probe7[name].dumps["B-1to1"].h);
    const meas = profile1D(b, kind);
    res[name] = { mad: r4(madAll(meas, src)), maxDiff: Math.max(...Array.from(meas).map((v, i) => Math.abs(v - src[i]))) };
  }
  // lineV-gray: nguồn từ M2 media
  {
    const raw = fs.readFileSync(path.join(MEDIA2, "lineV-gray.rgb"));
    const src = new Float64Array(640);
    for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; src[x] = s / 8; }
    const b = decodeB64(probe7["lineV-gray"].dumps["B-1to1"].rgbB64, probe7["lineV-gray"].dumps["B-1to1"].w, probe7["lineV-gray"].dumps["B-1to1"].h);
    const meas = profile1D(b, "V");
    res["lineV-gray"] = { mad: r4(madAll(meas, src)), maxDiff: Math.max(...Array.from(meas).map((v, i) => Math.abs(v - src[i]))) };
  }
  report.sections.bVsSource = res;
  console.log("1. B-1to1 vs nguồn:", JSON.stringify(res));
}

// ---------- 2. Trích trực tiếp S_meas từ bậc 255 ----------
{
  const edges = { stepV255: ["V", 320], stepH255: ["H", 180], stepV255b: ["V", 160], stepH255b: ["H", 90] };
  const samples = [];
  const perScale = {};
  for (const [name, [kind, E]] of Object.entries(edges)) {
    for (const sNom of probe7.scales) {
      const key = `exp-high-video-s${sNom}`;
      const dump = probe7[name].dumps[key];
      if (!dump) continue;
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const srcLen = kind === "V" ? 640 : 360;
      const dstLen = meas.length;
      const sTrue = dstLen / srcLen;
      let n = 0, eSum = 0;
      for (let i = 0; i < dstLen; i++) {
        const v = meas[i];
        if (v <= 0 || v >= 255) continue;
        const S0 = (i + 0.5) / sTrue;
        // chỉ lấy pixel mà 2 tap kẹp biên (S trong (E-1.5, E+0.5) quanh biên)
        if (S0 < E - 1.5 || S0 > E + 0.5) continue;
        const f = v / 255;
        const Smeas = (E - 0.5) + f;
        const e = Smeas - S0;
        samples.push({ clip: name, s: sNom, i, S0: r4(S0), f: r4(f), e: r4(e) });
        n++; eSum += e;
      }
      perScale[`${name} s${sNom}`] = { n, meanE: n ? r4(eSum / n) : null };
    }
  }
  const es = samples.map((s) => s.e);
  es.sort((a, b) => a - b);
  const mean = es.reduce((a, b) => a + b, 0) / es.length;
  const std = Math.sqrt(es.reduce((a, b) => a + (b - mean) ** 2, 0) / es.length);
  // kiểm lưới lượng tử: khoảng cách tới bội gần nhất của 1/64 và 1/256
  const gridDist = (q) => {
    let within = 0;
    for (const e of es) {
      const d = Math.abs(e - Math.round(e * q) / q);
      if (d <= 0.002) within++;
    }
    return { q, within, total: es.length, frac: r3(within / es.length) };
  };
  // hồi quy e theo i (trôi tuyến tính?) trên toàn bộ mẫu, chuẩn hoá i theo s
  let slopeInfo = null;
  {
    // e = a + b*(i/s) ~ a + b*x_src; fit OLS
    let n = es.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const s of samples) { const x = s.S0; sx += x; sy += s.e; sxx += x * x; sxy += x * s.e; }
    const b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    const a = (sy - b * sx) / n;
    slopeInfo = { intercept: r4(a), slopePerSrcPx: r4(b), n };
  }
  report.sections.directWeights = { n: samples.length, meanE: r4(mean), stdE: r4(std), minE: es[0], maxE: es[es.length - 1], grid64: gridDist(64), grid256: gridDist(256), grid128: gridDist(128), slope: slopeInfo, perScale };
  console.log(`2. Trích S_meas: n=${samples.length} meanE=${r4(mean)} stdE=${r4(std)} min=${es[0]} max=${es[es.length - 1]}`);
  console.log(`   lưới 1/64: ${JSON.stringify(gridDist(64))} | 1/128: ${JSON.stringify(gridDist(128))} | 1/256: ${JSON.stringify(gridDist(256))}`);
  console.log(`   hồi quy e~x_src: ${JSON.stringify(slopeInfo)}`);
}

// ---------- 3. Fit mô hình ứng viên trên bậc 255 + vạch + sóng ----------
const MODELS = [
  { label: "tri-float", kind: "float" },
  { label: "fracq64", kind: "fracq", q: 64 },
  { label: "fracq128", kind: "fracq", q: 128 },
  { label: "fracq256", kind: "fracq", q: 256 },
  { label: "posq64", kind: "posq", q: 64 },
  { label: "posq256", kind: "posq", q: 256 },
  { label: "posq65536", kind: "posq", q: 65536 },
  { label: "posqf256", kind: "posqf", q: 256 },
  { label: "fp16", kind: "fp16" },
  { label: "fp16w8", kind: "fp16w8" },
  { label: "fp8", kind: "fp8" },
  { label: "tribox0.2", kind: "tribox", w: 0.2 },
  { label: "tribox0.4", kind: "tribox", w: 0.4 },
  { label: "mitchell", kind: "mitchell" },
];
{
  const srcProfFromRgb = (rgbPath, kind) => {
    const raw = fs.readFileSync(rgbPath);
    const W = 640, H = 360;
    if (kind === "V") {
      const prof = new Float64Array(W);
      for (let x = 0; x < W; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * W + x) * 3]; prof[x] = s / 8; }
      return prof;
    }
    const prof = new Float64Array(H);
    for (let y = 0; y < H; y++) { let s = 0; for (let x = 310; x < 318; x++) s += raw[(y * W + x) * 3]; prof[y] = s / 8; }
    return prof;
  };
  const stepClips = [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160], ["stepH255b", "H", 90]];
  const fit = {};
  for (const [name, kind, E] of stepClips) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    const srcLen = src.length;
    fit[name] = {};
    for (const sNom of probe7.scales) {
      const key = `exp-high-video-s${sNom}`;
      const dump = probe7[name].dumps[key];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / srcLen;
      const c = kind === "V" ? Math.round(E * sTrue) : Math.round(E * sTrue);
      const lo = Math.max(0, c - 60), hi = Math.min(dstLen, c + 60);
      const row = {};
      for (const m of MODELS) row[m.label] = fitPhi(meas, src, srcLen, dstLen, sTrue, m, lo, hi);
      fit[name][`s${sNom}`] = row;
    }
  }
  // lineV-gray (N7, 8 thang)
  {
    const raw = fs.readFileSync(path.join(MEDIA2, "lineV-gray.rgb"));
    const src = new Float64Array(640);
    for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; src[x] = s / 8; }
    fit["lineV-gray"] = {};
    for (const sNom of probe7.scales) {
      const dump = probe7["lineV-gray"].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "V");
      const dstLen = meas.length, sTrue = dstLen / 640;
      const c = Math.round(320 * sTrue);
      const row = {};
      for (const m of MODELS) row[m.label] = fitPhi(meas, src, 640, dstLen, sTrue, m, Math.max(0, c - 60), Math.min(dstLen, c + 60));
      fit["lineV-gray"][`s${sNom}`] = row;
    }
  }
  // sóng dày (M2 wave JSON): sqw2/4/8-mid (H), sqw4x-mid (V), sqw4-640 (H, nửa dưới)
  const waveKinds = { "sqw4-640": "H", "sqw2-mid": "H", "sqw4-mid": "H", "sqw8-mid": "H", "sqw4x-mid": "V" };
  fit.waves = {};
  for (const [name, kind] of Object.entries(waveKinds)) {
    const bDump = decodeB64(wave2[name].dumps["B-1to1"].rgbB64, wave2[name].dumps["B-1to1"].w, wave2[name].dumps["B-1to1"].h);
    const src = profile1D(bDump, kind);
    const srcLen = src.length;
    fit.waves[name] = {};
    for (const sNom of wave2.scales) {
      const dump = wave2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / srcLen;
      let lo = 10, hi = dstLen - 10;
      if (name === "sqw4-640") { lo = Math.floor(200 * sTrue); hi = Math.floor(350 * sTrue); }
      const row = {};
      for (const m of MODELS) row[m.label] = fitPhi(meas, src, srcLen, dstLen, sTrue, m, lo, hi);
      fit.waves[name][`s${sNom}`] = row;
    }
  }
  // tổng hợp: MAD trung bình theo model trên từng nhóm
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
  report.sections.modelFit = {
    step255: fit, // chi tiết đầy đủ trong JSON
    summaryStep: summarize(stepGroup),
    summaryLine: summarize({ "lineV-gray": fit["lineV-gray"] }),
    summaryWave: summarize(fit.waves),
  };
  console.log("3. Model fit — tóm tắt MAD trung bình (bậc 255):", JSON.stringify(report.sections.modelFit.summaryStep));
  console.log("   vạch lineV:", JSON.stringify(report.sections.modelFit.summaryLine));
  console.log("   sóng dày:", JSON.stringify(report.sections.modelFit.summaryWave));
}

// ---------- 4. Downscale s=0,5: kernel nào? ----------
{
  const res = {};
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
  for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180]]) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    const srcLen = src.length;
    const dump = probe7[name].dumps["exp-high-video-s0.5"];
    const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
    const dstLen = meas.length, sTrue = dstLen / srcLen;
    const c = Math.round(E * sTrue);
    const lo = Math.max(0, c - 40), hi = Math.min(dstLen, c + 40);
    const row = {};
    for (const m of [{ label: "tri-float", kind: "float" }, { label: "mitchell", kind: "mitchell" }, { label: "box", kind: "box" }, { label: "fracq64", kind: "fracq", q: 64 }, { label: "posq256", kind: "posq", q: 256 }]) {
      row[m.label] = fitPhi(meas, src, srcLen, dstLen, sTrue, m, lo, hi, -0.08, 0.08, 0.005);
    }
    res[name] = row;
  }
  report.sections.downscale05 = res;
  console.log("4. Downscale s=0,5:", JSON.stringify(res));
}

// ---------- 5. CTM offX=0,5: hình học có đúng S − 0,5/s? ----------
{
  const res = {};
  for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180]]) {
    const raw = fs.readFileSync(path.join(MEDIA7, name + ".rgb"));
    const src = kind === "V"
      ? (() => { const p = new Float64Array(640); for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; p[x] = s / 8; } return p; })()
      : (() => { const p = new Float64Array(360); for (let y = 0; y < 360; y++) { let s = 0; for (let x = 310; x < 318; x++) s += raw[(y * 640 + x) * 3]; p[y] = s / 8; } return p; })();
    const srcLen = src.length;
    const dump = probe7[name].dumps["ctm-off0.5-video-s2.2639"];
    const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
    const dstLen = meas.length, sTrue = dstLen / srcLen;
    const c = Math.round(E * sTrue);
    const lo = Math.max(0, c - 60), hi = Math.min(dstLen, c + 60);
    // kỳ vọng: φ* ≈ −0,03 − 0,5/sTrue
    const expectPhi = -0.03 - 0.5 / sTrue;
    const best = fitPhi(meas, src, srcLen, dstLen, sTrue, { kind: "float" }, lo, hi, -0.45, 0.05, 0.005);
    const atExpect = (() => {
      const m = modelProfile(src, srcLen, dstLen, sTrue, { kind: "float", phi: expectPhi });
      return r3(madWin(meas, m, lo, hi));
    })();
    res[name] = { bestPhi: best, expectPhi: r3(expectPhi), madAtExpectPhi: atExpect };
    // đối chứng: ctm-off0 (M2 đã thấy ≡ explicit) — fit φ*
    const dump0 = probe7[name].dumps["ctm-off0-video-s2.2639"];
    const meas0 = profile1D(decodeB64(dump0.rgbB64, dump0.w, dump0.h), kind);
    res[name].ctmOff0 = fitPhi(meas0, src, srcLen, dstLen, sTrue, { kind: "float" }, lo, hi);
    // explicit cùng thang để so trực tiếp
    const dumpE = probe7[name].dumps["exp-high-video-s2.2639"];
    const measE = profile1D(decodeB64(dumpE.rgbB64, dumpE.w, dumpE.h), kind);
    res[name].explicitMadVsCtmOff0 = r3(madWin(meas0, measE, lo, hi));
  }
  report.sections.ctmOff05 = res;
  console.log("5. CTM offX=0,5:", JSON.stringify(res));
}

// ---------- 6. Composite globalAlpha=0,5 ----------
{
  const res = {};
  const dump = probe7["stepV255"].dumps["exp-high-video-s1.5"];
  const ref = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "V");
  for (const [key, bg] of [["comp-black-a05-s1.5", 0], ["comp-white-a05-s1.5", 255]]) {
    const d = probe7["stepV255"].dumps[key];
    const meas = profile1D(decodeB64(d.rgbB64, d.w, d.h), "V");
    const modelRound = ref.map((v) => Math.round(0.5 * v + 0.5 * bg));
    const modelFloor = ref.map((v) => Math.floor(0.5 * v + 0.5 * bg));
    let maxR = 0, maxF = 0;
    for (let i = 0; i < meas.length; i++) { maxR = Math.max(maxR, Math.abs(meas[i] - modelRound[i])); maxF = Math.max(maxF, Math.abs(meas[i] - modelFloor[i])); }
    res[key] = { madRound: r3(madAll(meas, modelRound)), maxRound: maxR, madFloor: r3(madAll(meas, modelFloor)), maxFloor: maxF, alpha: d.alpha };
  }
  report.sections.composite = res;
  console.log("6. Composite a=0,5:", JSON.stringify(res));
}

// ---------- 7. Đối chứng canvas-high ≡ Mitchell trên bậc 255 ----------
{
  const res = {};
  const srcProfFromRgb = (rgbPath) => {
    const raw = fs.readFileSync(rgbPath);
    const prof = new Float64Array(640);
    for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; prof[x] = s / 8; }
    return prof;
  };
  const src = srcProfFromRgb(path.join(MEDIA7, "stepV255.rgb"));
  for (const sNom of probe7.scales) {
    const dump = probe7["stepV255"].dumps[`exp-high-canvas-s${sNom}`];
    const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "V");
    const dstLen = meas.length, sTrue = dstLen / 640;
    const c = Math.round(320 * sTrue);
    const lo = Math.max(0, c - 60), hi = Math.min(dstLen, c + 60);
    const mit = fitPhi(meas, src, 640, dstLen, sTrue, { kind: "mitchell" }, lo, hi, -0.02, 0.02, 0.005);
    const triM = fitPhi(meas, src, 640, dstLen, sTrue, { kind: "float" }, lo, hi);
    res[`s${sNom}`] = { mitchell: mit, triangle: triM };
  }
  report.sections.canvasControl = res;
  console.log("7. Canvas-high vs Mitchell (bậc 255):", JSON.stringify(res));
}

// ---------- 8. Alpha toàn bộ dump ----------
{
  let aMin = 255, aMax = 0, n = 0, nonOpaque = 0;
  for (const clip of Object.values(probe7)) {
    if (!clip.dumps) continue;
    for (const d of Object.values(clip.dumps)) {
      n++;
      if (d.alpha.min < 255) nonOpaque++;
      aMin = Math.min(aMin, d.alpha.min); aMax = Math.max(aMax, d.alpha.max);
    }
  }
  report.sections.alpha = { dumps: n, nonOpaque, aMin, aMax };
  console.log(`8. Alpha: ${n} dump, nonOpaque=${nonOpaque}, min=${aMin} max=${aMax}`);
}

writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
