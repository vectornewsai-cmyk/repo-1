#!/usr/bin/env node
/**
 * r85m10-e3-analyze.mjs — Phase 9 đợt 85, luồng M10 (phân tích E3): pattern
 * tổng hợp (V1/H1/G1/C1/S4hi/V2/V4) upscale canvas có phải Mitchell? Tách:
 * 1D (V1/H1) vs 2D (G1/C1), duty 1px vs 2px vs 4px, thang 1,264 vs 2,0.
 * Chạy: node apps/web/scripts/r85m10-e3-analyze.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M10 = path.join(GOAL, "round85-m10");
const E3 = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-e3-probe.json"), "utf8"));
const OUT = path.join(M10, "r85m10-e3-analysis.json");
const b64buf = (s) => Buffer.from(s, "base64");
function bc(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const mitchell = (x) => bc(x, 1 / 3, 1 / 3);
const tri = (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; };
function weights(i, sc, srcLen, kernel, h = 1, phi = 0) {
  const S = (i + 0.5) / sc + phi;
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
function resample(rgb, srcW, srcH, dstW, dstH, kernel) {
  const scX = dstW / srcW, scY = dstH / srcH;
  const out = new Float64Array(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const tmp = new Float64Array(dstW * srcH);
    for (let y = 0; y < srcH; y++) {
      for (let i = 0; i < dstW; i++) {
        let acc = 0;
        for (const [j, w] of weights(i, scX, srcW, kernel)) acc += w * pl[y * srcW + j];
        tmp[y * dstW + i] = acc;
      }
    }
    for (let x = 0; x < dstW; x++) {
      for (let i = 0; i < dstH; i++) {
        let acc = 0;
        for (const [j, w] of weights(i, scY, srcH, kernel)) acc += w * tmp[j * dstW + x];
        out[(i * dstW + x) * 3 + c] = acc;
      }
    }
  }
  return out;
}
function madF(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}

function main() {
  const res = { generatedAt: new Date().toISOString(), patterns: {} };
  for (const [key, cap] of Object.entries(E3.caps)) {
    const s0 = b64buf(cap.s0.rgbB64);
    const up = b64buf(cap.up.rgbB64);
    const mit = resample(s0, 640, 360, cap.dw, cap.dh, mitchell);
    const tr = resample(s0, 640, 360, cap.dw, cap.dh, tri);
    const bc025 = resample(s0, 640, 360, cap.dw, cap.dh, (x) => bc(x, 0.25, 0.375));
    res.patterns[key] = { vsMitchell: madF(Float64Array.from(up), mit), vsTri: madF(Float64Array.from(up), tr), vsBC0250375: madF(Float64Array.from(up), bc025) };
    console.log(`${key}: vs Mitchell ${res.patterns[key].vsMitchell} | vs tri ${res.patterns[key].vsTri} | vs BC(0,25,0,375) ${res.patterns[key].vsBC0250375}`);
  }
  writeFileEpermRetry(OUT, JSON.stringify(res, null, 2));
  console.log(`ghi ${OUT}`);
}
main();
