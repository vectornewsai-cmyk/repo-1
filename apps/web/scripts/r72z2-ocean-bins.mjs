#!/usr/bin/env node
/**
 * r72z2-ocean-bins.mjs — Phase 9 đợt 72, luồng Z2: phân rã đuôi delta
 * theo bin độ sáng cho anomaly ocean w1440 (Y2 §4.3c).
 *
 * Câu hỏi: Δkurt G ~1,11 + Δcorr R-G ~0,24 của ocean w1440 noise05 có
 * tập trung ở bin sáng (kẹp rail sau cộng nhiễu YUV ở vùng sóng/bọt
 * trắng gần rail) hay đều khắp ảnh?
 *
 * Dữ liệu: snapshot headed Y2 (preview plain/noise05) + frame render
 * MỚI (render-1k, plain C2 + noise method T), viewport trilinear,
 * KHÔNG delta0 (điều kiện hoá: plain absMAD 3,31 > 2,5 nên không áp).
 * Bin theo luma bt709 của render plain (8 bin 32 mức). Mỗi bin: n,
 * std/kurt delta G của preview vs render, Δkurt G, tỉ lệ pixel preview
 * noise chạm rail G (0/255), tỉ lệ pixel plain G > 240 (gần rail).
 * Đối chứng: ocean w1440 noise10 + ocean w1920 noise05 (đã KHỚP).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r72z2-ocean-bins.mjs
 * Exit 0 khi xong. KHÔNG push/tag/binary.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const OUT = path.join(Z2, "r72z2-ocean-bins.json");

function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }

function kurt1d(vals) {
  const n = vals.length;
  let m = 0; for (const v of vals) m += v; m /= n;
  let s2 = 0, s4 = 0;
  for (const v of vals) { const d = v - m; s2 += d * d; s4 += d * d * d * d; }
  const std = Math.sqrt(s2 / n);
  return { std: +std.toFixed(2), kurt: +(s4 / n / (std ** 4) - 3).toFixed(2) };
}

function analyzeCell(win, lv) {
  const [vw, vh] = win === "w1440" ? [489, 275] : [809, 455];
  const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, `headed-${win}`, `r71y2-snaps-${win}.json`), "utf8"));
  const variants = snapsDoc.snaps.ocean;
  const plainRgb = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
  const noiseRgb = fs.readFileSync(path.join(RENDER_NEW, `fullrgb-ocean-${lv}.raw`));
  const prevPlain = b64ToRgb(variants.plain.rgbB64);
  const prevNoise = b64ToRgb(variants[lv].rgbB64);
  const renPlain = resampleRgb24Trilinear(plainRgb, 1280, 720, vw, vh);
  const renNoise = resampleRgb24Trilinear(noiseRgb, 1280, 720, vw, vh);
  const n = vw * vh;
  // Delta G preview/render + luma render plain + rail flags.
  const bins = Array.from({ length: 8 }, () => ({ dP: [], dR: [], railG: 0, nearRail: 0, n: 0 }));
  for (let p = 0; p < n; p++) {
    const luma = 0.2126 * renPlain[p * 3] + 0.7152 * renPlain[p * 3 + 1] + 0.0722 * renPlain[p * 3 + 2];
    const b = Math.min(7, Math.floor(luma / 32));
    const bin = bins[b];
    bin.n++;
    bin.dP.push(prevNoise[p * 3 + 1] - prevPlain[p * 3 + 1]);
    bin.dR.push(renNoise[p * 3 + 1] - renPlain[p * 3 + 1]);
    if (prevNoise[p * 3 + 1] === 0 || prevNoise[p * 3 + 1] === 255) bin.railG++;
    if (renPlain[p * 3 + 1] > 240) bin.nearRail++;
  }
  const rows = bins.map((bin, i) => {
    const p = kurt1d(bin.dP), r = kurt1d(bin.dR);
    return {
      bin: `${i * 32}-${i * 32 + 31}`, n: bin.n, frac: +(bin.n / n).toFixed(3),
      previewStdG: p.std, renderStdG: r.std, previewKurtG: p.kurt, renderKurtG: r.kurt,
      dKurtG: +(Math.abs(p.kurt - r.kurt).toFixed(2)),
      railGfrac: +(bin.railG / bin.n).toFixed(4), nearRailFrac: +(bin.nearRail / bin.n).toFixed(4),
    };
  });
  // Tổng toàn ảnh để đối chiếu.
  const allP = [], allR = [];
  for (let p = 0; p < n; p++) { allP.push(prevNoise[p * 3 + 1] - prevPlain[p * 3 + 1]); allR.push(renNoise[p * 3 + 1] - renPlain[p * 3 + 1]); }
  const totP = kurt1d(allP), totR = kurt1d(allR);
  console.log(`\n=== ocean ${win} ${lv} (G, KHÔNG delta0) — tổng: preview kurt ${totP.kurt} vs render ${totR.kurt} (Δ=${Math.abs(totP.kurt - totR.kurt).toFixed(2)}) ===`);
  for (const row of rows) {
    console.log(`  luma ${row.bin}: n=${row.n} (${(row.frac * 100).toFixed(1)}%) std P/R=${row.previewStdG}/${row.renderStdG} kurt P/R=${row.previewKurtG}/${row.renderKurtG} ΔkurtG=${row.dKurtG} railG=${(row.railGfrac * 100).toFixed(1)}% nearRail=${(row.nearRailFrac * 100).toFixed(1)}%`);
  }
  return { window: win, level: lv, total: { previewKurtG: totP.kurt, renderKurtG: totR.kurt }, bins: rows };
}

const report = { cells: [] };
report.cells.push(analyzeCell("w1440", "noise05")); // anomaly
report.cells.push(analyzeCell("w1440", "noise10")); // đối chứng đã KHỚP
report.cells.push(analyzeCell("w1920", "noise05")); // đối chứng đã KHỚP
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nJSON: ${OUT}`);
