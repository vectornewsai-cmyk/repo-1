#!/usr/bin/env node
/**
 * r85m10-e4-analyze.mjs — Phase 9 đợt 85, luồng M10 (phân tích E4): tái lập
 * J2 có cho Mitchell ~0 không? So hàng capture với 6 kernel (tri, BC,
 * Mitchell, Catmull, B-spline, Lanczos2) theo đúng quy ước J2
 * (S=(i+0,5)/s, h=1) + checker8 full-frame 2D.
 * Chạy: node apps/web/scripts/r85m10-e4-analyze.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M10 = path.join(GOAL, "round85-m10");
const E4 = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-e4-probe.json"), "utf8"));
const OUT = path.join(M10, "r85m10-e4-analysis.json");
const SRC = 512;
function sinc(x) { return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); }
function bc(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const KERNELS = {
  tri: (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; },
  bc0250375: (x) => bc(x, 0.25, 0.375),
  mitchell: (x) => bc(x, 1 / 3, 1 / 3),
  catmull: (x) => bc(x, 0, 0.5),
  bspline: (x) => bc(x, 1, 0),
  lanczos2: (x) => (Math.abs(x) < 2 ? sinc(x) * sinc(x / 2) : 0),
};
function patternValue(kind, x, y) {
  switch (kind) {
    case "sqw4": return (Math.floor(x / 4) % 2 === 0) ? 64 : 192;
    case "sqw8": return (Math.floor(x / 8) % 2 === 0) ? 64 : 192;
    case "sqw4-hi": return (Math.floor(x / 4) % 2 === 0) ? 0 : 255;
    case "sqw4-lo": return (Math.floor(x / 4) % 2 === 0) ? 112 : 144;
    case "step": return x < 256 ? 64 : 192;
    case "impulse": return x === 256 ? 255 : 128;
    case "checker8": return ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) ? 64 : 192;
    default: throw new Error(kind);
  }
}
function weights(i, sc, srcLen, kernel, h = 1) {
  const S = (i + 0.5) / sc;
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
function resampleRow(srcRow, dstLen, kernel) {
  const sc = dstLen / srcRow.length;
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of weights(i, sc, srcRow.length, kernel)) acc += w * srcRow[j];
    out[i] = acc;
  }
  return out;
}
function madRows(measRows, predRow) {
  let s = 0, n = 0;
  for (const row of measRows) for (let i = 0; i < row.length; i++) { s += Math.abs(row[i] - predRow[i]); n++; }
  return +(s / n).toFixed(3);
}

function main() {
  const res = { generatedAt: new Date().toISOString(), rows: {}, checker: {}, medium: {} };
  const scales = { s1132: 580, s1264: 647, s2000: 1024 };
  for (const [key, dw] of Object.entries(scales)) {
    for (const kind of ["sqw4", "sqw8", "sqw4-hi", "sqw4-lo", "step", "impulse"]) {
      const cap = E4.captures[`${kind}@${key}`];
      const srcRow = new Float64Array(SRC);
      for (let x = 0; x < SRC; x++) srcRow[x] = patternValue(kind, x, 0);
      const r = {};
      for (const [kname, kfn] of Object.entries(KERNELS)) r[kname] = madRows(cap.rows, resampleRow(srcRow, dw, kfn));
      res.rows[`${kind}@${key}`] = r;
      const best = Object.entries(r).sort((a, b) => a[1] - b[1])[0];
      console.log(`${kind}@${key}: tốt nhất ${best[0]} ${best[1]} (tri ${r.tri} / BC ${r.bc0250375} / Mitchell ${r.mitchell})`);
    }
  }
  // checker8 full-frame 2D (tách X rồi Y).
  for (const [key, dw] of Object.entries(scales)) {
    const cap = E4.captures[`checker8@${key}`];
    const got = Buffer.from(cap.rgbB64, "base64");
    const src = new Float64Array(SRC * SRC);
    for (let y = 0; y < SRC; y++) for (let x = 0; x < SRC; x++) src[y * SRC + x] = patternValue("checker8", x, y);
    const r = {};
    for (const [kname, kfn] of Object.entries(KERNELS)) {
      // 2D: X-pass rồi Y-pass.
      const tmp = new Float64Array(dw * SRC);
      for (let y = 0; y < SRC; y++) {
        const pr = resampleRow(src.subarray(y * SRC, (y + 1) * SRC), dw, kfn);
        tmp.set(pr, y * dw);
      }
      const out = new Float64Array(dw * dw);
      for (let x = 0; x < dw; x++) {
        const col = new Float64Array(SRC);
        for (let y = 0; y < SRC; y++) col[y] = tmp[y * dw + x];
        const pr = resampleRow(col, dw, kfn);
        for (let i = 0; i < dw; i++) out[i * dw + x] = pr[i];
      }
      let s = 0;
      for (let i = 0; i < dw * dw; i++) s += Math.abs(got[i * 3] - out[i]);
      r[kname] = +(s / (dw * dw)).toFixed(3);
    }
    res.checker[key] = r;
    const best = Object.entries(r).sort((a, b) => a[1] - b[1])[0];
    console.log(`checker8@${key}: tốt nhất ${best[0]} ${best[1]} (tri ${r.tri} / Mitchell ${r.mitchell})`);
  }
  // medium = tri? (J2 §5: sqw4@s1132 medium vs tri MAD 0)
  const med = E4.captures["sqw4@s1132-medium"];
  const srcRow = new Float64Array(SRC);
  for (let x = 0; x < SRC; x++) srcRow[x] = patternValue("sqw4", x, 0);
  res.medium = {
    vsTri: madRows(med.rows, resampleRow(srcRow, 580, KERNELS.tri)),
    vsMitchell: madRows(med.rows, resampleRow(srcRow, 580, KERNELS.mitchell)),
  };
  console.log(`medium sqw4@s1132: vs tri ${res.medium.vsTri} | vs Mitchell ${res.medium.vsMitchell}`);
  writeFileEpermRetry(OUT, JSON.stringify(res, null, 2));
  console.log(`ghi ${OUT}`);
}
main();
