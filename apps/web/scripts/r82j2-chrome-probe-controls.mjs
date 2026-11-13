#!/usr/bin/env node
/**
 * r82j2-chrome-probe-controls.mjs — Phase 9 đợt 82, luồng J2: đối chứng bổ sung
 * cho probe headed (r82j2-chrome-probe-analyze.mjs), chỉ dùng dữ liệu hàng
 * (chạy nhanh, không resample 2D):
 *   1. imageSmoothingQuality "medium" (sqw4@s1132) so với từng kernel —
 *      kiểm giả thuyết medium == tam giác (MAD high-vs-medium 1,721 đúng
 *      bằng MAD high-vs-tri trong phân tích chính).
 *   2. gpu0 (--disable-gpu) vs gpu1 (đường SwiftShader) trên mọi mẫu/thang
 *      + sweep — đường raster có đổi kernel không?
 * Ghi kết quả vào r82j2-analysis.json (sections.controls) để giữ một
 * artifact phân tích duy nhất.
 * Chạy (từ gốc repo): node apps/web/scripts/r82j2-chrome-probe-controls.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { bcCubic, KERNELS, resampleRow1D, madRows } from "./r82j2-chrome-probe-analyze.mjs";
import { triangleKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const J2 = path.join(GOAL, "round82-j2");
const PROBE0 = path.join(J2, "r82j2-probe-gpu0.json");
const PROBE1 = path.join(J2, "r82j2-probe-gpu1.json");
const ANALYSIS = path.join(J2, "r82j2-analysis.json");

const roundU8 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
function sqwRow(period, lo, hi, w = 512) {
  const row = new Float64Array(w);
  for (let x = 0; x < w; x++) row[x] = (Math.floor(x / (period / 2)) % 2 === 0) ? lo : hi;
  return row;
}

const probe0 = JSON.parse(fs.readFileSync(PROBE0, "utf8"));
const probe1 = JSON.parse(fs.readFileSync(PROBE1, "utf8"));
const analysis = JSON.parse(fs.readFileSync(ANALYSIS, "utf8"));
const controls = analysis.sections.controls || {};
const SCALES = [
  { key: "s1132", dw: 580, dh: 580 },
  { key: "s1264", dw: 647, dh: 647 },
  { key: "s2000", dw: 1024, dh: 1024 },
];
const ROW_PATTERNS = ["sqw4", "sqw8", "sqw4-hi", "sqw4-lo", "step", "impulse", "linA", "linB", "linAB"];

// 1. medium vs kernel (sqw4@s1132, 4 hàng).
const med = probe0.quality["sqw4@s1132-medium"];
const medVsKernel = {};
for (const [name, kern] of Object.entries(KERNELS)) {
  const pred = Array.from(resampleRow1D(sqwRow(8, 64, 192), 580, kern), roundU8);
  medVsKernel[name] = madRows(med.rows, [0, 1, 2, 3].map(() => pred));
}
const medBest = Object.entries(medVsKernel).sort((a, b) => a[1] - b[1])[0];
console.log(`[medium] sqw4@s1132 vs kernel: ` + Object.entries(medVsKernel).map(([n, v]) => `${n}=${v}`).join(" | ") + ` => tốt nhất: ${medBest[0]} (${medBest[1]})`);
controls.mediumVsKernel = medVsKernel;

// 2. gpu0 vs gpu1.
const gg = {};
for (const k of ROW_PATTERNS) for (const sc of SCALES) {
  gg[`${k}@${sc.key}`] = madRows(probe0.captures[`${k}@${sc.key}`].rows, probe1.captures[`${k}@${sc.key}`].rows);
}
// checker full-frame.
for (const sc of SCALES) {
  const a = Buffer.from(probe0.captures[`checker8@${sc.key}`].rgbB64, "base64");
  const b = Buffer.from(probe1.captures[`checker8@${sc.key}`].rgbB64, "base64");
  let sum = 0, maxD = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); sum += d; if (d > maxD) maxD = d; }
  gg[`checker8@${sc.key}`] = { mad: +(sum / a.length).toFixed(3), maxAbs: maxD };
}
// sweep rows.
for (const sc of ["s1132", "s2000"]) {
  const a = Buffer.from(probe0.sweep[sc].rowsB64, "base64");
  const b = Buffer.from(probe1.sweep[sc].rowsB64, "base64");
  let sum = 0, maxD = 0, nDiff = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); sum += d; if (d > maxD) maxD = d; if (d > 0) nDiff++; }
  gg[`sweep@${sc}`] = { mad: +(sum / a.length).toFixed(4), maxAbs: maxD, fracDiff: +(nDiff / a.length).toFixed(4) };
}
const ggRows = Object.entries(gg).filter(([, v]) => typeof v === "number");
const ggMax = Math.max(...ggRows.map(([, v]) => v));
console.log(`[gpu0-vs-gpu1] MAD hàng lớn nhất: ${ggMax} (trong ${ggRows.length} capture hàng)`);
console.log(`  checker: ` + SCALES.map((sc) => `${sc.key} MAD=${gg[`checker8@${sc.key}`].mad} maxAbs=${gg[`checker8@${sc.key}`].maxAbs}`).join(" | "));
console.log(`  sweep: ` + ["s1132", "s2000"].map((k) => `${k} MAD=${gg[`sweep@${k}`].mad} fracDiff=${gg[`sweep@${k}`].fracDiff}`).join(" | "));
controls.gpu0vsGpu1 = gg;
controls.mediumVsKernelBest = medBest[0];

analysis.sections.controls = controls;
writeFileEpermRetry(ANALYSIS, JSON.stringify(analysis, null, 2));
console.log(`đã cập nhật ${ANALYSIS}`);
