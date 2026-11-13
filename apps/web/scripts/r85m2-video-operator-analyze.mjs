#!/usr/bin/env node
/**
 * r85m2-video-operator-analyze.mjs — Phase 9 đợt 85, luồng M2: phân tích
 * probe đáp ứng xung/bậc của scaler video (nhiệm vụ 1).
 *
 * Phương pháp: vạch 1px (lineV/lineH) cho đáp ứng xung TRỰC TIẾP —
 * output_i − bg = amp · K_eff(S_i − x0), K_eff = kernel ⊛ box 1px.
 * Gộp mọi thang (s = 1,125/1,5/2,25/3,0 + CTM 2,2639) để lấy mẫu K_eff
 * dày theo pha, rồi so với các kernel ứng viên (tri/Mitchell/BC/CR/
 * B-spline/Lanczos2-3/box/Gauss + bilinear điểm cố định kiểu libyuv +
 * triangle lệch pha δ) và fit tự do (bin pha 0,05). Bậc thang (step)
 * đối chứng qua ESF→LSF. Đường canvas (exp-high-canvas) là đối chứng
 * phương pháp — phải ra triangle (đã biết). Chroma step (Cb/Cr ở Y hằng)
 * tách kernel luma vs chroma (chroma nửa phân giải?).
 *
 * Quy ước hình học Chrome (chrome-resample.mjs): S_i = (i+0,5)/s + φ,
 * trọng số chuẩn hoá theo từng pixel đích. Nguồn model = dải B đo được
 * (frame decode 1:1), không phải .rgb gốc — để loại sai số encode.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r85m2-video-operator-analyze.mjs
 * Chỉ đo offline. KHÔNG push/tag/binary/workflow. KHÔNG sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M2 = path.join(GOAL, "round85-m2");
const MEDIA = path.join(M2, "media");
const PROBE = path.join(M2, "r85m2-video-operator.json");
const OUT = path.join(M2, "r85m2-video-operator-analysis.json");
const r3 = (v) => +v.toFixed(3);
const r4 = (v) => +v.toFixed(4);

function decodeB64(b64, w, h) {
  const buf = Buffer.from(b64, "base64");
  return { w, h, data: buf };
}
// Profile 1D: trung bình theo chiều vuông góc với đặc trưng (V: theo y,
// H: theo x; impulse: hàng/cột giữa của patch). Trả về Float64Array.
function profile1D(dump, kind) {
  const { w, h, data } = dump;
  if (kind === "V") {
    const prof = new Float64Array(w);
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = 0; y < h; y++) s += data[(y * w + x) * 3];
      prof[x] = s / h;
    }
    return prof;
  }
  if (kind === "H") {
    const prof = new Float64Array(h);
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let x = 0; x < w; x++) s += data[(y * w + x) * 3];
      prof[y] = s / w;
    }
    return prof;
  }
  // impulse: hàng giữa + cột giữa (patch 80x80, tâm ở giữa patch).
  const cy = Math.floor(h / 2), cx = Math.floor(w / 2);
  const row = new Float64Array(w), col = new Float64Array(h);
  for (let x = 0; x < w; x++) row[x] = data[(cy * w + x) * 3];
  for (let y = 0; y < h; y++) col[y] = data[(y * w + cx) * 3];
  return { row, col, cx, cy };
}
function profileChannel(dump, kind, c) {
  const { w, h, data } = dump;
  if (kind === "V") {
    const prof = new Float64Array(w);
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = 0; y < h; y++) s += data[(y * w + x) * 3 + c];
      prof[x] = s / h;
    }
    return prof;
  }
  const prof = new Float64Array(h);
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let x = 0; x < w; x++) s += data[(y * w + x) * 3 + c];
    prof[y] = s / w;
  }
  return prof;
}

// ---------- kernels ----------
function sinc(x) { return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); }
function bc(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const KERNELS = {
  tri: (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; },
  mitchell: (x) => bc(x, 1 / 3, 1 / 3),
  bc025_0375: (x) => bc(x, 0.25, 0.375),
  catmullRom: (x) => bc(x, 0, 0.5),
  bspline: (x) => bc(x, 1, 0),
  lanczos2: (x) => (Math.abs(x) < 2 ? sinc(x) * sinc(x / 2) : 0),
  lanczos3: (x) => (Math.abs(x) < 3 ? sinc(x) * sinc(x / 3) : 0),
  box: (x) => (Math.abs(x) < 0.5 ? 1 : 0),
  gauss10: (x) => Math.exp(-(x * x) / 2) * (Math.abs(x) < 2 ? 1 : 0),
};
// Bilinear điểm cố định kiểu libyuv (ScalePlaneBilinear): hệ số nguyên
// 16 bit, pha lấy theo tâm pixel — 2 biến thể căn pha (a: S=(i+0,5)/s−0,5
// chuẩn libyuv-ish; b: S=(i+0,5)/s như Chrome canvas). Vì là bilinear
// nên hình dạng = triangle, chỉ khác pha/làm tròn — kiểm tra qua δ.
function weights1D(i, s, srcLen, kernel, h = 1, phi = 0) {
  const S = (i + 0.5) / s + phi;
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
function modelProfile(srcProf, srcLen, dstLen, s, kernel, h = 1, phi = 0) {
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of weights1D(i, s, srcLen, kernel, h, phi)) acc += w * srcProf[j];
    out[i] = acc;
  }
  return out;
}
function madProf(a, b, lo = 0, hi = null) {
  hi = hi === null ? a.length : hi;
  let s = 0, n = 0, mx = 0;
  for (let i = lo; i < hi; i++) {
    const d = Math.abs(a[i] - b[i]);
    s += d; n++;
    if (d > mx) mx = d;
  }
  return { mad: r3(s / n), max: r3(mx), n };
}
// (K_eff liên tục kernel⊛box đã bỏ — so sánh dùng trọng số rời rạc, mục 3.)

const probe = JSON.parse(fs.readFileSync(PROBE, "utf8"));
const KINDS = { "stepV-gray": "V", "stepH-gray": "H", "lineV-gray": "V", "lineH-gray": "H", "impulse-gray": "impulse", "stepV-colorCb": "V", "stepV-colorCr": "V" };
const SCALES = probe.scales;
const report = { generated: new Date().toISOString(), bCheck: {}, kernelFit: {}, keff: {}, chroma: {}, ctm: {} };

// ---------- 1. Kiểm tra B (1:1) vs nguồn .rgb ----------
console.log("== 1. B (drawImage 1:1) vs nguồn .rgb ==");
for (const [name, kind] of Object.entries(KINDS)) {
  const srcRgb = fs.readFileSync(path.join(MEDIA, name + ".rgb"));
  const srcW = 640, srcH = 360;
  const b = decodeB64(probe[name].dumps["B-1to1"].rgbB64, probe[name].dumps["B-1to1"].w, probe[name].dumps["B-1to1"].h);
  // Dải B: V -> x 0..639, y 170..189; H -> x 310..329, y 0..359; impulse -> patch.
  let mad = 0, n = 0, mx = 0;
  const perCh = [0, 0, 0];
  if (kind === "V") {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 640; x++) {
      const si = ((170 + y) * srcW + x) * 3;
      const bi = (y * 640 + x) * 3;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(srcRgb[si + c] - b.data[bi + c]);
        perCh[c] += d; mad += d; if (d > mx) mx = d; n++;
      }
    }
  } else if (kind === "H") {
    for (let y = 0; y < 360; y++) for (let x = 0; x < 20; x++) {
      const si = (y * srcW + 310 + x) * 3;
      const bi = (y * 20 + x) * 3;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(srcRgb[si + c] - b.data[bi + c]);
        perCh[c] += d; mad += d; if (d > mx) mx = d; n++;
      }
    }
  } else {
    for (let y = 0; y < 80; y++) for (let x = 0; x < 80; x++) {
      const si = ((140 + y) * srcW + 280 + x) * 3;
      const bi = (y * 80 + x) * 3;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(srcRgb[si + c] - b.data[bi + c]);
        perCh[c] += d; mad += d; if (d > mx) mx = d; n++;
      }
    }
  }
  const m = { mad: r3(mad / n), max: mx, perChannelMad: perCh.map((v) => r3(v / (n / 3))) };
  report.bCheck[name] = m;
  console.log(`  ${name}: B-vs-nguồn MAD=${m.mad} max=${m.max} kênh=${m.perChannelMad}`);
}

// ---------- 2. Fit kernel trên line/step (profile 1D, nguồn = B) ----------
console.log("\n== 2. Fit kernel (nguồn = dải B, kênh R) ==");
for (const name of ["lineV-gray", "lineH-gray", "stepV-gray", "stepH-gray"]) {
  const kind = KINDS[name];
  const bDump = decodeB64(probe[name].dumps["B-1to1"].rgbB64, probe[name].dumps["B-1to1"].w, probe[name].dumps["B-1to1"].h);
  const srcProf = profile1D(bDump, kind);
  const srcLen = srcProf.length;
  const entry = { srcLen, scales: {} };
  for (const s of SCALES) {
    const dw = Math.round(640 * s);
    const dh = Math.round(360 * s);
    const dstLen = kind === "V" ? dw : dh;
    const res = {};
    for (const [dk, dumpKey] of [["video-high", `exp-high-video-s${s}`], ["video-low", `exp-low-video-s${s}`], ["canvas-high", `exp-high-canvas-s${s}`]]) {
      const dump = decodeB64(probe[name].dumps[dumpKey].rgbB64, probe[name].dumps[dumpKey].w, probe[name].dumps[dumpKey].h);
      const meas = profile1D(dump, kind);
      const fits = {};
      for (const [kname, k] of Object.entries(KERNELS)) {
        const mod = modelProfile(srcProf, srcLen, dstLen, s, k, 1, 0);
        fits[kname] = madProf(meas, mod);
      }
      // Quét pha cho triangle (φ −0,10..+0,10 bước 0,01).
      let bestPhi = null;
      for (let phi = -0.1; phi <= 0.1001; phi += 0.01) {
        const mod = modelProfile(srcProf, srcLen, dstLen, s, KERNELS.tri, 1, phi);
        const m = madProf(meas, mod);
        if (!bestPhi || m.mad < bestPhi.mad) bestPhi = { phi: r3(phi), ...m };
      }
      fits.triPhiBest = bestPhi;
      // Đối chứng: model = chính B upscale bằng triangle (canvas) phải khớp canvas-high.
      res[dk] = fits;
      const best = Object.entries(fits).filter(([k]) => k !== "triPhiBest").sort((a, b) => a[1].mad - b[1].mad)[0];
      console.log(`  ${name} s=${s} ${dk}: tốt nhất ${best[0]} MAD=${best[1].mad} | tri=${fits.tri.mad} mit=${fits.mitchell.mad} | tri@φ*=${bestPhi.phi} MAD=${bestPhi.mad}`);
    }
    entry.scales[s] = res;
  }
  // CTM 2,2639 (video + canvas).
  {
    const s = 815 / 360, dstLen = KINDS[name] === "V" ? 1449 : 815;
    for (const [dk, dumpKey] of [["video-high", "ctm-high-video-s2.2639"], ["canvas-high", "ctm-high-canvas-s2.2639"]]) {
      const dump = decodeB64(probe[name].dumps[dumpKey].rgbB64, probe[name].dumps[dumpKey].w, probe[name].dumps[dumpKey].h);
      const meas = profile1D(dump, kind);
      const fits = {};
      for (const [kname, k] of Object.entries(KERNELS)) {
        const mod = modelProfile(srcProf, srcLen, dstLen, s, k, 1, 0);
        fits[kname] = madProf(meas, mod);
      }
      let bestPhi = null;
      for (let phi = -0.1; phi <= 0.1001; phi += 0.01) {
        const mod = modelProfile(srcProf, srcLen, dstLen, s, KERNELS.tri, 1, phi);
        const m = madProf(meas, mod);
        if (!bestPhi || m.mad < bestPhi.mad) bestPhi = { phi: r3(phi), ...m };
      }
      fits.triPhiBest = bestPhi;
      entry.scales["2.2639-ctm"] = entry.scales["2.2639-ctm"] || {};
      entry.scales["2.2639-ctm"][dk] = fits;
      const best = Object.entries(fits).filter(([k]) => k !== "triPhiBest").sort((a, b) => a[1].mad - b[1].mad)[0];
      console.log(`  ${name} s=2.2639-CTM ${dk}: tốt nhất ${best[0]} MAD=${best[1].mad} | tri=${fits.tri.mad} mit=${fits.mitchell.mad} | tri@φ*=${bestPhi.phi} MAD=${bestPhi.mad}`);
    }
  }
  report.kernelFit[name] = entry;
}

// ---------- 3. K_eff tự do từ lineV (gộp mọi thang, video-high) ----------
// K_eff ở đây = trọng số RỜI RẠC đã chuẩn hoá w(i,320) của pixel vạch:
// output_i = bg + amp·w(i,320). Pha t = S_i − 320,5 (tâm vạch theo quy
// ước S=(i+0,5)/s: pixel nguồn 320 có tâm tại 320,5). So sánh với cùng
// đại lượng của kernel ứng viên (modelProfile trên nguồn vạch tổng hợp).
console.log("\n== 3. K_eff tự do (lineV-gray, exp-high-video, gộp thang) ==");
{
  const name = "lineV-gray";
  const bDump = decodeB64(probe[name].dumps["B-1to1"].rgbB64, probe[name].dumps["B-1to1"].w, probe[name].dumps["B-1to1"].h);
  const srcProf = profile1D(bDump, "V");
  // Nền + biên độ từ B: line ở x=320 giá trị 200, nền 128.
  const bg = 128, amp = srcProf[320] - bg;
  console.log(`  B: nền=${bg} line[320]=${srcProf[320]} amp=${amp}`);
  const samples = []; // {phase, value}
  for (const s of [...SCALES, 815 / 360]) {
    const key = s === 815 / 360 ? "ctm-high-video-s2.2639" : `exp-high-video-s${s}`;
    const dump = decodeB64(probe[name].dumps[key].rgbB64, probe[name].dumps[key].w, probe[name].dumps[key].h);
    const meas = profile1D(dump, "V");
    const dw = meas.length;
    for (let i = 0; i < dw; i++) {
      const S = (i + 0.5) / s;
      const t = S - 320.5;
      if (Math.abs(t) <= 2.5) samples.push({ t: r4(t), v: r3((meas[i] - bg) / amp) });
    }
  }
  // Bin pha 0,05.
  const bins = {};
  for (const { t, v } of samples) {
    const b = Math.round(t / 0.05) * 0.05;
    (bins[b.toFixed(2)] = bins[b.toFixed(2)] || []).push(v);
  }
  const curve = Object.keys(bins).sort((a, b) => +a - +b).map((k) => {
    const vs = bins[k];
    const mean = vs.reduce((a, b) => a + b, 0) / vs.length;
    return { t: +k, kEff: r4(mean), n: vs.length };
  });
  // Nguồn vạch tổng hợp (bilevel đúng B) để tính w rời rạc của ứng viên.
  const synthSrc = new Float64Array(640).fill(128);
  synthSrc[320] = 200;
  const cmp = {};
  for (const [kname, k] of Object.entries(KERNELS)) {
    // w ứng viên tại cùng các pha: model từng thang, trích (out-128)/72.
    const candSamples = [];
    for (const s of [...SCALES, 815 / 360]) {
      const dw = s === 815 / 360 ? 1449 : Math.round(640 * s);
      const mod = modelProfile(synthSrc, 640, dw, s, k, 1, 0);
      for (let i = 0; i < dw; i++) {
        const t = (i + 0.5) / s - 320.5;
        if (Math.abs(t) <= 2.5) candSamples.push({ t: r4(t), v: (mod[i] - 128) / 72 });
      }
    }
    const cBins = {};
    for (const { t, v } of candSamples) {
      const b = Math.round(t / 0.05) * 0.05;
      (cBins[b.toFixed(2)] = cBins[b.toFixed(2)] || []).push(v);
    }
    let se = 0, n = 0, mx = 0;
    for (const { t, kEff } of curve) {
      const vs = cBins[t.toFixed(2)];
      if (!vs) continue;
      const cv = vs.reduce((a, b) => a + b, 0) / vs.length;
      const d = Math.abs(kEff - cv);
      se += d; n++;
      if (d > mx) mx = d;
    }
    cmp[kname] = { mad: r3(se / n), max: r3(mx) };
  }
  console.log(`  mẫu: ${samples.length} điểm pha, ${curve.length} bin`);
  console.log(`  K_eff đo (t: giá trị): ${curve.map((c) => `${c.t}:${c.kEff}`).join(" ")}`);
  console.log(`  So K_eff ứng viên rời rạc (MAD trên curve): ${Object.entries(cmp).map(([k, v]) => `${k}=${v.mad}`).join(" ")}`);
  // Đỉnh + độ bất đối xứng: tổng K_eff trái/phải.
  const left = curve.filter((c) => c.t < -0.025).reduce((a, c) => a + c.kEff, 0);
  const right = curve.filter((c) => c.t > 0.025).reduce((a, c) => a + c.kEff, 0);
  const peak = curve.reduce((a, c) => (c.kEff > a.kEff ? c : a), curve[0]);
  console.log(`  đỉnh K_eff=${peak.kEff} tại t=${peak.t}; tổng trái=${r3(left)} phải=${r3(right)} (chênh ${r3(Math.abs(left - right))})`);
  report.keff = { amp, nSamples: samples.length, curve, candidateMad: cmp, peak, sumLeft: r3(left), sumRight: r3(right) };
}

// ---------- 4. Impulse: đẳng hướng? ----------
console.log("\n== 4. Impulse (đẳng hướng x/y?) ==");
{
  const name = "impulse-gray";
  const bDump = decodeB64(probe[name].dumps["B-1to1"].rgbB64, probe[name].dumps["B-1to1"].w, probe[name].dumps["B-1to1"].h);
  const bProf = profile1D(bDump, "impulse");
  console.log(`  B: hàng giữa max=${r3(Math.max(...bProf.row))} tại x=${bProf.row.indexOf(Math.max(...bProf.row))} (patch x0=280); cột giữa max=${r3(Math.max(...bProf.col))} tại y=${bProf.col.indexOf(Math.max(...bProf.col))} (patch y0=140)`);
  const entry = {};
  for (const s of SCALES) {
    const dump = decodeB64(probe[name].dumps[`exp-high-video-s${s}`].rgbB64, probe[name].dumps[`exp-high-video-s${s}`].w, probe[name].dumps[`exp-high-video-s${s}`].h);
    const p = profile1D(dump, "impulse");
    const rowPeak = Math.max(...p.row), colPeak = Math.max(...p.col);
    const rowBase = p.row.reduce((a, b) => a + b, 0) / p.row.length;
    entry[s] = { rowPeak: r3(rowPeak), colPeak: r3(colPeak), rowMean: r3(rowBase) };
    console.log(`  s=${s}: đỉnh hàng=${r3(rowPeak)} đỉnh cột=${r3(colPeak)} (nền ~128; chênh đỉnh ${r3(Math.abs(rowPeak - colPeak))})`);
  }
  report.impulse = entry;
}

// ---------- 5. Chroma step: kernel luma vs chroma ----------
console.log("\n== 5. Chroma step (Cb/Cr ở Y hằng) ==");
function rgbToYcbcr601(r, g, b) {
  const yl = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return [16 + 219 * yl, 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.114), 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.299)];
}
for (const name of ["stepV-colorCb", "stepV-colorCr"]) {
  const entry = {};
  // B: Y/Cb/Cr theo x (trung bình 20 hàng).
  const bDump = decodeB64(probe[name].dumps["B-1to1"].rgbB64, probe[name].dumps["B-1to1"].w, probe[name].dumps["B-1to1"].h);
  const yB = [], cbB = [], crB = [];
  for (let x = 0; x < 640; x++) {
    let sy = 0, scb = 0, scr = 0;
    for (let y = 0; y < 20; y++) {
      const i = (y * 640 + x) * 3;
      const [yy, cb, cr] = rgbToYcbcr601(bDump.data[i], bDump.data[i + 1], bDump.data[i + 2]);
      sy += yy; scb += cb; scr += cr;
    }
    yB.push(sy / 20); cbB.push(scb / 20); crB.push(scr / 20);
  }
  const chan = name.endsWith("Cb") ? "Cb" : "Cr";
  const srcProf = chan === "Cb" ? cbB : crB;
  console.log(`  ${name} B: Y trái/phải=${r3(yB[100])}/${r3(yB[500])} (phải hằng?); ${chan} trái/phải=${r3(srcProf[100])}/${r3(srcProf[500])}; kênh kia trái/phải=${r3((chan === "Cb" ? crB : cbB)[100])}/${r3((chan === "Cb" ? crB : cbB)[500])}`);
  entry.b = { yLeft: r3(yB[100]), yRight: r3(yB[500]), chLeft: r3(srcProf[100]), chRight: r3(srcProf[500]) };
  for (const s of SCALES) {
    const dump = decodeB64(probe[name].dumps[`exp-high-video-s${s}`].rgbB64, probe[name].dumps[`exp-high-video-s${s}`].w, probe[name].dumps[`exp-high-video-s${s}`].h);
    const dw = dump.w;
    const yP = [], chP = [];
    for (let x = 0; x < dw; x++) {
      let sy = 0, sc = 0;
      for (let y = 0; y < 20; y++) {
        const i = (y * dw + x) * 3;
        const [yy, cb, cr] = rgbToYcbcr601(dump.data[i], dump.data[i + 1], dump.data[i + 2]);
        sy += yy; sc += chan === "Cb" ? cb : cr;
      }
      yP.push(sy / 20); chP.push(sc / 20);
    }
    // Độ rộng chuyển tiếp của bậc chroma: số pixel đích từ 10%->90%.
    const lo = srcProf[100], hi = srcProf[500];
    const t10 = lo + 0.1 * (hi - lo), t90 = lo + 0.9 * (hi - lo);
    let x10 = -1, x90 = -1;
    for (let x = 0; x < dw; x++) { if (x10 < 0 && chP[x] >= t10) x10 = x; if (x90 < 0 && chP[x] >= t90) x90 = x; }
    // Y có phẳng không (max-min trên dải giữa)?
    let yMin = 1e9, yMax = -1e9;
    for (let x = Math.floor(dw * 0.2); x < Math.floor(dw * 0.8); x++) { if (yP[x] < yMin) yMin = yP[x]; if (yP[x] > yMax) yMax = yP[x]; }
    // Fit kernel cho bậc chroma (nguồn = B chroma profile).
    const fits = {};
    for (const [kname, k] of Object.entries(KERNELS)) {
      const mod = modelProfile(srcProf, 640, dw, s, k, 1, 0);
      fits[kname] = madProf(chP, mod);
    }
    const best = Object.entries(fits).sort((a, b) => a[1].mad - b[1].mad)[0];
    entry[s] = { transWidth1030: x90 - x10, yFlatRange: r3(yMax - yMin), bestKernel: best[0], bestMad: best[1].mad, triMad: fits.tri.mad, mitMad: fits.mitchell.mad };
    console.log(`  s=${s}: bậc ${chan} rộng 10-90% = ${x90 - x10} px đích (${r3((x90 - x10) / s)} px nguồn); Y phẳng ±${r3(yMax - yMin)}; fit tốt nhất ${best[0]} MAD=${best[1].mad} (tri=${fits.tri.mad}, mit=${fits.mitchell.mad})`);
  }
  // So độ rộng chuyển tiếp bậc luma (stepV-gray) cùng thang — đối chứng.
  const lg = report.kernelFit["stepV-gray"];
  report.chroma[name] = entry;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
