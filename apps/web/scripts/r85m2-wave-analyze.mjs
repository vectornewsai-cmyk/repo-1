#!/usr/bin/env node
/**
 * r85m2-wave-analyze.mjs — Phase 9 đợt 85, luồng M2: phân tích probe sóng
 * vuông dày (sqw4-640 gốc + sqw2/4/8-mid + sqw4x-mid).
 *
 * Câu hỏi: tại sao probe xung/bậc rời rạc cho video = triangle
 * (MAD <= 0,015) trong khi L2 đo triangle lệch 0,96 trên sqw4?
 * Các ứng viên phân biệt: (a) mật độ/chu kỳ sóng (2/4/8 px),
 * (b) thang "xấu" 1,2639 (pha điểm cố định), (c) hướng sóng (dọc X
 * vs dọc Y), (d) clip sqw4 gốc có gì khác clip tự sinh.
 *
 * Phương pháp: như r85m2-video-operator-analyze §2 — model = kernel
 * áp lên profile B đo được, MAD theo thang × đường (video-high/low,
 * canvas-high, CTM 2,2639). Nguồn model = dải B (không phải .rgb).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r85m2-wave-analyze.mjs
 * Chỉ đo offline. KHÔNG push/tag/binary/workflow. KHÔNG sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M2 = path.join(GOAL, "round85-m2");
const MEDIA = path.join(M2, "media");
const PROBE = path.join(M2, "r85m2-wave.json");
const OUT = path.join(M2, "r85m2-wave-analysis.json");
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
function modelProfile(srcProf, srcLen, dstLen, s, kernel, h = 1, phi = 0) {
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of weights1D(i, s, srcLen, kernel, h, phi)) acc += w * srcProf[j];
    out[i] = acc;
  }
  return out;
}
function madProf(a, b) {
  let s = 0, mx = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); s += d; if (d > mx) mx = d; }
  return { mad: r3(s / a.length), max: r3(mx) };
}

const probe = JSON.parse(fs.readFileSync(PROBE, "utf8"));
const KINDS = { "sqw4-640": "H", "sqw2-mid": "H", "sqw4-mid": "H", "sqw8-mid": "H", "sqw4x-mid": "V" };
const SCALES = probe.scales;
const report = { generated: new Date().toISOString(), scales: SCALES, waves: {} };

// B check vs .rgb (sqw4-640: so với frame ffmpeg decode /tmp — không có .rgb gốc).
console.log("== B check ==");
for (const [name, kind] of Object.entries(KINDS)) {
  const rgbPath = path.join(MEDIA, name + ".rgb");
  if (!fs.existsSync(rgbPath)) { console.log(`  ${name}: không có .rgb (clip gốc L2) — bỏ qua B-vs-nguồn, chỉ fit trên B`); continue; }
  const srcRgb = fs.readFileSync(rgbPath);
  const b = decodeB64(probe[name].dumps["B-1to1"].rgbB64, probe[name].dumps["B-1to1"].w, probe[name].dumps["B-1to1"].h);
  let mad = 0, n = 0, mx = 0;
  if (kind === "V") {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 640; x++) {
      const d = Math.abs(srcRgb[((170 + y) * 640 + x) * 3] - b.data[(y * 640 + x) * 3]);
      mad += d; if (d > mx) mx = d; n++;
    }
  } else {
    for (let y = 0; y < 360; y++) for (let x = 0; x < 20; x++) {
      const d = Math.abs(srcRgb[(y * 640 + 310 + x) * 3] - b.data[(y * 20 + x) * 3]);
      mad += d; if (d > mx) mx = d; n++;
    }
  }
  console.log(`  ${name}: B-vs-nguồn MAD=${r3(mad / n)} max=${mx}`);
}

console.log("\n== Fit kernel trên sóng (nguồn = profile B) ==");
for (const [name, kind] of Object.entries(KINDS)) {
  const bDump = decodeB64(probe[name].dumps["B-1to1"].rgbB64, probe[name].dumps["B-1to1"].w, probe[name].dumps["B-1to1"].h);
  const srcProf = profile1D(bDump, kind);
  const srcLen = srcProf.length;
  const entry = {};
  const runScale = (s, label, dumpKeys) => {
    const dstLen = kind === "V" ? Math.round(640 * s) : Math.round(360 * s);
    const res = {};
    for (const [dk, dumpKey] of Object.entries(dumpKeys)) {
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
      res[dk] = fits;
      const best = Object.entries(fits).filter(([k]) => k !== "triPhiBest").sort((a, b) => a[1].mad - b[1].mad)[0];
      console.log(`  ${name} s=${label} ${dk}: tốt nhất ${best[0]} MAD=${best[1].mad} | tri=${fits.tri.mad} mit=${fits.mitchell.mad} | tri@φ*=${bestPhi.phi} MAD=${bestPhi.mad}`);
    }
    return res;
  };
  for (const s of SCALES) {
    entry[`s${s}`] = runScale(s, s, {
      "video-high": `exp-high-video-s${s}`,
      "video-low": `exp-low-video-s${s}`,
      "canvas-high": `exp-high-canvas-s${s}`,
    });
  }
  entry["s2.2639-ctm"] = runScale(815 / 360, "2.2639-CTM", {
    "video-high": "ctm-high-video-s2.2639",
    "canvas-high": "ctm-high-canvas-s2.2639",
  });
  report.waves[name] = entry;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
