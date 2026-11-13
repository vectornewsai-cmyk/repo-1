#!/usr/bin/env node
/**
 * r84l5-video-narrow-fit.mjs — Phase 9 đợt 84, luồng L5: thử kernel HẸP
 * (h<1) cho video scaler — profile gợi ý kernel hẹp hơn tri + lệch phải
 * nhỏ. Thử tri/Mitchell với h ∈ {0.7,0.8,0.9} trên Bview lineart.
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const L5 = path.join(GOAL, "round84-l5");

function bc(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const K = {
  tri: (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; },
  mitchell: (x) => bc(x, 1 / 3, 1 / 3),
};
function weights(i, sc, srcLen, kernel, h) {
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
function resample(rgb, srcW, srcH, dstW, dstH, kernel, h) {
  const scX = dstW / srcW, scY = dstH / srcH;
  const out = new Float64Array(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const tmp = new Float64Array(dstW * srcH);
    const wx = new Array(dstW);
    for (let i = 0; i < dstW; i++) wx[i] = weights(i, scX, srcW, kernel, h);
    for (let y = 0; y < srcH; y++) {
      const sRow = y * srcW, tRow = y * dstW;
      for (let i = 0; i < dstW; i++) {
        let acc = 0;
        for (const [j, w] of wx[i]) acc += w * pl[sRow + j];
        tmp[tRow + i] = acc;
      }
    }
    const wy = new Array(dstH);
    for (let i = 0; i < dstH; i++) wy[i] = weights(i, scY, srcH, kernel, h);
    for (let x = 0; x < dstW; x++) {
      for (let i = 0; i < dstH; i++) {
        let acc = 0;
        for (const [j, w] of wy[i]) acc += w * tmp[j * dstW + x];
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
function loadDocs() {
  const docs = [];
  for (const dir of fs.readdirSync(L5).filter((d) => d.startsWith("headed-"))) {
    const f = path.join(L5, dir, "r84l5-snaps-w1920x1080-p640x360.json");
    if (fs.existsSync(f)) docs.push(JSON.parse(fs.readFileSync(f, "utf8")));
  }
  return docs;
}
function main() {
  const docs = loadDocs();
  const byContent = {};
  for (const doc of docs) for (const src of doc.sources) byContent[src.name] = doc;
  const res = {};
  for (const content of ["lineart640", "lineart2px-640", "textsmall640"]) {
    const doc = byContent[content];
    const snaps = doc.snaps[content];
    const vw = snaps.plain.w, vh = snaps.plain.h;
    const S0 = Buffer.from(doc.directDraws[content].plain.native.rgbB64, "base64");
    const Bview = Buffer.from(doc.directDraws[content].plain.viewport.rgbB64, "base64");
    const r = {};
    for (const [kname, kfn] of Object.entries(K)) {
      for (const h of [0.7, 0.8, 0.9, 1.0]) {
        r[`Bview_vs_${kname}_h${h}`] = madF(Float64Array.from(Bview), resample(S0, 640, 360, vw, vh, kfn, h));
      }
    }
    res[content] = r;
    console.log(`--- ${content} ---`, JSON.stringify(r));
  }
  writeFileEpermRetry(path.join(L5, "r84l5-video-narrow-fit.json"), JSON.stringify(res, null, 2));
}
main();
