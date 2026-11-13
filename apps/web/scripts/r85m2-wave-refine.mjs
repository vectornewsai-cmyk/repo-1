#!/usr/bin/env node
/**
 * r85m2-wave-refine.mjs — Phase 9 đợt 85, luồng M2: fit tinh sóng dày —
 * tách pha hằng (φ) khỏi sai thang (ε) cho toán tử video.
 *
 * Phát hiện từ wave-analyze: video = triangle nhưng MAD 0,3–2,7 trên
 * sóng dày (trong khi vạch rời rạc cho 0,005–0,015), φ* ≈ −0,03 cải
 * thiện nhưng không đóng. Hai ứng viên: (a) pha hằng φ ≈ −0,03 px;
 * (b) sai thang ε (sai số pha tăng tuyến tính theo vị trí). Vạch rời
 * rạc (1 vị trí) không phân biệt được; sóng dài (360–1080 px) phân
 * biệt được: φ → dịch đều, ε → trôi dần theo vị trí.
 *
 * Sửa 2 lỗi phương pháp của wave-analyze: (1) thang model phải là
 * s_thật = dstLen/srcLen (với s=1,2638889 thì s_x = 809/640 ≠ s danh
 * nghĩa); (2) sqw4-640 chỉ fit nửa dưới (y_nguồn ∈ [200,350], sóng
 * ngang hằng theo x) — nửa trên là sọc dọc, profile 1D trung bình
 * theo x không giao hoán với model.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r85m2-wave-refine.mjs
 * Chỉ đo offline. KHÔNG push/tag/binary/workflow. KHÔNG sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M2 = path.join(GOAL, "round85-m2");
const PROBE = path.join(M2, "r85m2-wave.json");
const OUT = path.join(M2, "r85m2-wave-refine.json");
const r3 = (v) => +v.toFixed(3);
const r5 = (v) => +v.toFixed(5);

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
function bc(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const KERNELS = {
  tri: (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; },
  mitchell: (x) => bc(x, 1 / 3, 1 / 3),
};
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
function modelProfile(srcProf, srcLen, dstLen, s, kernel, phi = 0) {
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of weights1D(i, s, srcLen, kernel, 1, phi)) acc += w * srcProf[j];
    out[i] = acc;
  }
  return out;
}
function madWin(a, b, lo, hi) {
  let s = 0, n = 0, mx = 0;
  for (let i = lo; i < hi; i++) { const d = Math.abs(a[i] - b[i]); s += d; n++; if (d > mx) mx = d; }
  return { mad: r3(s / n), max: r3(mx), n };
}

const probe = JSON.parse(fs.readFileSync(PROBE, "utf8"));
const KINDS = { "sqw4-640": "H", "sqw2-mid": "H", "sqw4-mid": "H", "sqw8-mid": "H", "sqw4x-mid": "V" };
const SCALES = probe.scales;
const report = { generated: new Date().toISOString(), refine: {} };

for (const [name, kind] of Object.entries(KINDS)) {
  const bDump = decodeB64(probe[name].dumps["B-1to1"].rgbB64, probe[name].dumps["B-1to1"].w, probe[name].dumps["B-1to1"].h);
  const srcProf = profile1D(bDump, kind);
  const srcLen = srcProf.length;
  const entry = {};
  for (const sNom of SCALES) {
    // Thang thật theo trục đo (V: 640->dw; H: 360->dh).
    const dstLen = kind === "V" ? Math.round(640 * sNom) : Math.round(360 * sNom);
    const sTrue = dstLen / srcLen;
    const dumpKey = `exp-high-video-s${sNom}`;
    const dump = decodeB64(probe[name].dumps[dumpKey].rgbB64, probe[name].dumps[dumpKey].w, probe[name].dumps[dumpKey].h);
    const meas = profile1D(dump, kind);
    // Cửa sổ fit: sqw4-640 chỉ nửa dưới (nguồn y 200..350); còn lại toàn bộ.
    let lo = 0, hi = dstLen;
    if (name === "sqw4-640") { lo = Math.floor(200 * sTrue); hi = Math.floor(350 * sTrue); }
    const base = madWin(meas, modelProfile(srcProf, srcLen, dstLen, sTrue, KERNELS.tri, 0), lo, hi);
    // Quét φ (thang đúng) và ε (thang sai) riêng + chung.
    let bestPhi = null;
    for (let phi = -0.1; phi <= 0.1001; phi += 0.005) {
      const m = madWin(meas, modelProfile(srcProf, srcLen, dstLen, sTrue, KERNELS.tri, phi), lo, hi);
      if (!bestPhi || m.mad < bestPhi.mad) bestPhi = { phi: r3(phi), ...m };
    }
    let bestEps = null;
    for (let eps = -0.002; eps <= 0.00201; eps += 0.0001) {
      const m = madWin(meas, modelProfile(srcProf, srcLen, dstLen, sTrue * (1 + eps), KERNELS.tri, 0), lo, hi);
      if (!bestEps || m.mad < bestEps.mad) bestEps = { eps: r5(eps), ...m };
    }
    let bestBoth = null;
    for (let eps = -0.001; eps <= 0.00101; eps += 0.0002) {
      for (let phi = -0.06; phi <= 0.0601; phi += 0.01) {
        const m = madWin(meas, modelProfile(srcProf, srcLen, dstLen, sTrue * (1 + eps), KERNELS.tri, phi), lo, hi);
        if (!bestBoth || m.mad < bestBoth.mad) bestBoth = { eps: r5(eps), phi: r3(phi), ...m };
      }
    }
    // Đối chứng canvas (Mitchell, φ=0, thang đúng) trên cùng cửa sổ.
    const cDump = decodeB64(probe[name].dumps[`exp-high-canvas-s${sNom}`].rgbB64, probe[name].dumps[`exp-high-canvas-s${sNom}`].w, probe[name].dumps[`exp-high-canvas-s${sNom}`].h);
    const cMeas = profile1D(cDump, kind);
    const cBase = madWin(cMeas, modelProfile(srcProf, srcLen, dstLen, sTrue, KERNELS.mitchell, 0), lo, hi);
    let cBestPhi = null;
    for (let phi = -0.06; phi <= 0.0601; phi += 0.01) {
      const m = madWin(cMeas, modelProfile(srcProf, srcLen, dstLen, sTrue, KERNELS.mitchell, phi), lo, hi);
      if (!cBestPhi || m.mad < cBestPhi.mad) cBestPhi = { phi: r3(phi), ...m };
    }
    entry[`s${sNom}`] = { sTrue: r5(sTrue), window: [lo, hi], videoTri0: base, videoTriPhi: bestPhi, videoTriEps: bestEps, videoTriBoth: bestBoth, canvasMit0: cBase, canvasMitPhi: cBestPhi };
    console.log(`${name} s=${sNom} (s_thật=${r5(sTrue)}): video-tri φ=0 MAD=${base.mad} | φ*=${bestPhi.phi} MAD=${bestPhi.mad} | ε*=${bestEps.eps} MAD=${bestEps.mad} | cả hai ε=${bestBoth.eps} φ=${bestBoth.phi} MAD=${bestBoth.mad} | canvas-Mit φ=0 MAD=${cBase.mad} φ*=${cBestPhi.phi} MAD=${cBestPhi.mad}`);
  }
  report.refine[name] = entry;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
