#!/usr/bin/env node
/**
 * r80h3-kernel-grid-edge.mjs — Phase 9 đợt 80, luồng H3 (probe a, bổ sung):
 * lưới kernel trên profile cạnh xung vuông: tam giác vs BC(0,25,0,375)
 * (production) vs Mitchell (1/3,1/3) vs Catmull-Rom (0,0,5) — xem kernel
 * thật của Chrome có phải cubic nhẹ (thùy âm nhỏ, overshoot <1 mức)
 * hay tam giác thuần. Chỉ X-profile (trục quyết định; Y cho cùng số).
 *
 * Đọc: hidden_files/round80-h3/headed-dirs/r80h3-snaps-*.json + render/
 * (frame theo playhead). Ghi: r80h3-kernel-grid-edge.json.
 * KHÔNG push/tag/binary.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H3 = path.join(GOAL, "round80-h3");
const OUT = path.join(H3, "r80h3-kernel-grid-edge.json");
const LO = 64, HI = 192;

function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
function triangleKernel(x) { const a = Math.abs(x); return a < 1 ? 1 - a : 0; }
function resamplePlaneKernel(src, srcW, srcH, dstW, dstH, kernel) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) {
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, sx, srcW, kernel)) acc += w * src[y * srcW + j];
      tmp[y * dstW + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of chromeWeights1D(i, sy, srcH, kernel)) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const r = resamplePlaneKernel(pl, srcW, srcH, dstW, dstH, kernel);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(r[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
const KERNELS = {
  triangle: triangleKernel,
  "bc025-0375": (x) => bcCubic(x, 0.25, 0.375),
  "mitchell": (x) => bcCubic(x, 1 / 3, 1 / 3),
  "catmull-rom": (x) => bcCubic(x, 0, 0.5),
  "bc025-0333": (x) => bcCubic(x, 0.25, 1 / 3),
};
const b64 = (b) => Buffer.from(b, "base64");

function profileX(img, vw, vh, y0, y1) {
  const p = new Float64Array(vw);
  for (let x = 0; x < vw; x++) {
    let s = 0;
    for (let y = y0; y < y1; y++) s += img[(y * vw + x) * 3];
    p[x] = s / (y1 - y0);
  }
  return p;
}

function main() {
  const dirs = fs.readdirSync(H3, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("headed-") && !d.name.includes("-fix"))
    .map((d) => path.join(H3, d.name)).sort();
  const report = { generated: new Date().toISOString(), runs: {} };
  for (const dir of dirs) {
    for (const f of fs.readdirSync(dir)) {
      if (!f.startsWith("r80h3-snaps-") || !f.endsWith(".json")) continue;
      const doc = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      const frame = Math.round((doc.playhead ?? 1.0) * 30);
      const suffix = frame === 30 ? "" : `-f${frame}`;
      const runKey = `${doc.window}-p${doc.projW}x${doc.projH}-ph${doc.playhead ?? 1.0}`;
      console.log(`\n######## ${runKey} ########`);
      const runRep = {};
      for (const content of Object.keys(doc.snaps)) {
        if (!/^sqw\d/.test(content)) continue;
        const snaps = doc.snaps[content];
        const vw = snaps.plain.w, vh = snaps.plain.h;
        const renderPlain = fs.readFileSync(path.join(H3, "render", content, `fullrgb-plain${suffix}.raw`));
        const prevPlain = b64(snaps.plain.rgbB64);
        const y0 = Math.floor(vh * 0.1), y1 = Math.floor(vh * 0.4);
        const pPrev = profileX(prevPlain, vw, vh, y0, y1);
        let mx = -Infinity, mn = Infinity;
        for (const v of pPrev) { if (v > mx) mx = v; if (v < mn) mn = v; }
        const crep = { previewOver: [+(mx - HI).toFixed(2), +(LO - mn).toFixed(2)], kernels: {} };
        const line = [`${content}: preview over +${crep.previewOver[0]}/-${crep.previewOver[1]}`];
        for (const [kName, kFn] of Object.entries(KERNELS)) {
          const rM = resampleRgbKernel(renderPlain, doc.projW, doc.projH, vw, vh, kFn);
          const pM = profileX(rM, vw, vh, y0, y1);
          let mad = 0, mmx = -Infinity, mmn = Infinity;
          for (let i = 0; i < vw; i++) { mad += Math.abs(pPrev[i] - pM[i]); if (pM[i] > mmx) mmx = pM[i]; if (pM[i] < mmn) mmn = pM[i]; }
          crep.kernels[kName] = { mad: +(mad / vw).toFixed(3), overHigh: +(mmx - HI).toFixed(2), underLow: +(LO - mmn).toFixed(2) };
          line.push(`${kName} MAD ${crep.kernels[kName].mad} over +${crep.kernels[kName].overHigh}/-${crep.kernels[kName].underLow}`);
        }
        console.log("  " + line.join(" | "));
        runRep[content] = crep;
      }
      report.runs[runKey] = runRep;
    }
  }
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON kernel-grid-edge: ${OUT}`);
}
main();
