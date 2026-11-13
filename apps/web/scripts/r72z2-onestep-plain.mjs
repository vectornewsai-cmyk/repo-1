#!/usr/bin/env node
/**
 * r72z2-onestep-plain.mjs — Phase 9 đợt 72, luồng Z2: kiểm tra quyết định
 * cho anomaly ocean w1440 noise05.
 *
 * Giả thuyết: preview delta = N2 − P1 (noise 2 bước, plain 1 bước
 * 1920→viewport), render delta Y2 = n2 − p2 (cả hai 2 bước). Số hạng
 * (P1 − p2) — sai khác plain do khác cấu trúc — nhiễm vào verdict delta
 * (đuôi nặng, G-kurt preview 1,35 vs render 0,24). Phân rã bin (§r72z2-
 * ocean-bins) đã loại kẹp rail (railG 0,0% ở mọi bin mid-tone).
 *
 * Thí nghiệm: verdict với render plain 1 BƯỚC (trilinear native 1920 →
 * viewport, cùng cấu trúc với preview plain), render noise giữ 2 bước
 * (frame render-1k mới). KHÔNG delta0 (plain absMAD 1-bước vẫn > 2,5;
 * delta0 định nghĩa trên miền 1280, không áp cho plain 1-bước).
 * Đối chứng: ocean w1440 noise10 + w1920 cả 2 mức + basgo/slovenska
 * w1440 noise05 (đã KHỚP dưới plain 2 bước — phải giữ KHỚP).
 * Nếu ocean w1440 noise05 KHỚP dưới plain 1-bước → anomaly là artifact
 * cấu trúc plain, không phải khác biệt nhiễu thật. Nếu vẫn LỆCH →
 * nhiễu preview khác nhiễu render thật trên nội dung này.
 *
 * Hàm thống kê sao chép từ r72z2-analyze.mjs (gốc r71y2-analyze.mjs).
 * Chạy: node apps/web/scripts/r72z2-onestep-plain.mjs
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
const NATIVE = path.join(Z2, "native");
const RENDER_NEW = path.join(Z2, "render-1k");
const OUT = path.join(Z2, "r72z2-onestep-plain.json");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };

const CELLS = [
  { src: "ocean", win: "w1440", lv: "noise05", rgb: "ocean-f25-1920.rgb" },
  { src: "ocean", win: "w1440", lv: "noise10", rgb: "ocean-f25-1920.rgb" },
  { src: "ocean", win: "w1920", lv: "noise05", rgb: "ocean-f25-1920.rgb" },
  { src: "ocean", win: "w1920", lv: "noise10", rgb: "ocean-f25-1920.rgb" },
  { src: "basgo", win: "w1440", lv: "noise05", rgb: "basgo-f30-1920.rgb" },
  { src: "slovenska", win: "w1440", lv: "noise05", rgb: "slovenska-f25-1920.rgb" },
];

function channelStats(d) {
  const n = d.length / 3;
  const out = { std: [], kurt: [], corr: [] };
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let i = c; i < d.length; i += 3) s += d[i];
    mean[c] = s / n;
  }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) {
      const v = d[i] - mean[c];
      s2 += v * v; s4 += v * v * v * v;
    }
    const std = Math.sqrt(s2 / n);
    out.std.push(+std.toFixed(2));
    out.kurt.push(+(s4 / n / (std ** 4) - 3).toFixed(2));
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(+(s / n / (out.std[a] * out.std[b])).toFixed(3));
  }
  return out;
}
function verdictOf(prevPlain, prevNoise, renPlain, renNoise, vw, vh) {
  const n = vw * vh;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) { dP[i] = prevNoise[i] - prevPlain[i]; dR[i] = renNoise[i] - renPlain[i]; }
  const preview = channelStats(dP), render = channelStats(dR);
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
  const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
  const ok = ratios.every((r) => r >= VERDICT.stdLo && r <= VERDICT.stdHi) && dKurt.every((x) => x <= VERDICT.kurt) && dCorr.every((x) => x <= VERDICT.corr);
  return { verdict: ok ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ", stdRatio: ratios, kurtDiff: dKurt, corrDiff: dCorr, previewKurt: preview.kurt, renderKurt: render.kurt, previewStd: preview.std, renderStd: render.std };
}
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }
function absMad(a, b) {
  const n = a.length / 3;
  let sum = 0;
  for (let p = 0; p < n; p++) for (let c = 0; c < 3; c++) sum += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
  return +(sum / (n * 3)).toFixed(3);
}

const report = { cells: [] };
for (const cell of CELLS) {
  const [vw, vh] = cell.win === "w1440" ? [489, 275] : [809, 455];
  const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, `headed-${cell.win}`, `r71y2-snaps-${cell.win}.json`), "utf8"));
  const variants = snapsDoc.snaps[cell.src];
  const prevPlain = b64ToRgb(variants.plain.rgbB64);
  const prevNoise = b64ToRgb(variants[cell.lv].rgbB64);
  const nativeRgb = fs.readFileSync(path.join(NATIVE, cell.rgb));
  const noiseRgb = fs.readFileSync(path.join(RENDER_NEW, `fullrgb-${cell.src}-${cell.lv}.raw`));
  // Render plain 1 bước + render noise 2 bước (frame mới, trilinear viewport).
  const renPlain1 = resampleRgb24Trilinear(nativeRgb, 1920, 1080, vw, vh);
  const renNoise2 = resampleRgb24Trilinear(noiseRgb, 1280, 720, vw, vh);
  const v = verdictOf(prevPlain, prevNoise, renPlain1, renNoise2, vw, vh);
  const entry = { ...cell, plainAbsMad1step: absMad(prevPlain, renPlain1), ...v };
  report.cells.push(entry);
  console.log(`${cell.src} ${cell.win} ${cell.lv} [plain 1-bước, KHÔNG d0]: ${v.verdict} plainAbsMAD=${entry.plainAbsMad1step} Δkurt=${JSON.stringify(v.kurtDiff)} Δcorr=${JSON.stringify(v.corrDiff)} stdRatio=${JSON.stringify(v.stdRatio)} (previewKurtG=${v.previewKurt[1]} renderKurtG=${v.renderKurt[1]})`);
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nJSON: ${OUT}`);
