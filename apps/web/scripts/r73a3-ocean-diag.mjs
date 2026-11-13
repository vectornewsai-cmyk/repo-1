#!/usr/bin/env node
/**
 * r73a3-ocean-diag.mjs — Phase 9 đợt 73, luồng A3: chẩn đoán PHỤ (dùng dữ
 * liệu đã có, không phải hướng phụ thứ 2): đuôi nặng của preview delta G
 * ở ocean w1440 noise05 có tập trung theo độ bão hoà / kênh R / |d0|
 * không? Z2 đã giết giả thuyết kẹp rail theo ĐỘ SÁNG (bin luma đều
 * 0,71–1,19). Cắt khác: bão hoà max-min, giá trị R, |d0| — kẹp gamut
 * theo kênh (R gần 255 trong khi G giữa chừng) không hiện trong bin luma.
 *
 * Chạy: node apps/web/scripts/r73a3-ocean-diag.mjs (từ gốc repo).
 * JSON: hidden_files/round73-a3/r73a3-ocean-diag.json. KHÔNG push/tag.
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
const A3 = path.join(GOAL, "round73-a3");
const OUT = process.env.R73A3_DIAG_OUT || path.join(A3, "r73a3-ocean-diag.json");
const b64ToRgb = (b64) => Buffer.from(b64, "base64");

function kurtStd(vals) {
  const n = vals.length;
  let m = 0; for (const v of vals) m += v;
  m /= n;
  let s2 = 0, s4 = 0;
  for (const v of vals) { const d = v - m; s2 += d * d; s4 += d * d * d * d; }
  const std = Math.sqrt(s2 / n);
  return { n, std: +std.toFixed(2), kurt: +(s4 / n / (std ** 4) - 3).toFixed(2) };
}

async function main() {
  const [vw, vh] = [489, 275];
  const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, "headed-w1440", "r71y2-snaps-w1440.json"), "utf8"));
  const v = snapsDoc.snaps.ocean;
  const prevPlain = b64ToRgb(v.plain.rgbB64);
  const prevNoise = b64ToRgb(v.noise05.rgbB64);
  const plainRgb = fs.readFileSync(path.join(Z2, "render-1k", "fullrgb-ocean-plain.raw"));
  const noiseRgb = fs.readFileSync(path.join(Z2, "render-1k", "fullrgb-ocean-noise05.raw"));
  const rp = resampleRgb24Trilinear(plainRgb, 1280, 720, vw, vh);
  const rn = resampleRgb24Trilinear(noiseRgb, 1280, 720, vw, vh);
  const n = vw * vh;
  // d0 magnitude per pixel (mean |d0| over channels) — reuse delta0 via
  // est-shift is expensive; approximate with plain diff |prev-rp| instead
  // (d0 correlates with plain mismatch). We use plainAbs per pixel.
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  const sat = new Float64Array(n), rVal = new Float64Array(n), plainAbs = new Float64Array(n);
  for (let p = 0; p < n; p++) {
    const R = prevPlain[p * 3], G = prevPlain[p * 3 + 1], B = prevPlain[p * 3 + 2];
    sat[p] = Math.max(R, G, B) - Math.min(R, G, B);
    rVal[p] = R;
    let s = 0;
    for (let c = 0; c < 3; c++) {
      dP[p * 3 + c] = prevNoise[p * 3 + c] - prevPlain[p * 3 + c];
      dR[p * 3 + c] = rn[p * 3 + c] - rp[p * 3 + c];
      s += Math.abs(prevPlain[p * 3 + c] - rp[p * 3 + c]);
    }
    plainAbs[p] = s / 3;
  }
  const report = {};
  for (const [key, arr, edges] of [
    ["saturation", sat, [0, 30, 60, 90, 130, 256]],
    ["R_value", rVal, [0, 64, 128, 192, 224, 256]],
    ["plainAbsDiff", plainAbs, [0, 1, 2, 4, 8, 256]],
  ]) {
    report[key] = [];
    for (let b = 0; b < edges.length - 1; b++) {
      const gP = [], gR = [];
      for (let p = 0; p < n; p++) {
        if (arr[p] >= edges[b] && arr[p] < edges[b + 1]) { gP.push(dP[p * 3 + 1]); gR.push(dR[p * 3 + 1]); }
      }
      const a = kurtStd(gP), c = kurtStd(gR);
      report[key].push({ bin: `[${edges[b]},${edges[b + 1]})`, previewG: a, renderG: c, frac: +(gP.length / n).toFixed(3) });
      console.log(`${key} [${edges[b]},${edges[b + 1]}) frac=${(gP.length / n).toFixed(3)} previewG kurt=${a.kurt} std=${a.std} | renderG kurt=${c.kurt} std=${c.std}`);
    }
  }
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`JSON: ${OUT}`);
}
main().catch((e) => { console.error(`DIAG LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
