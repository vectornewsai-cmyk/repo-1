#!/usr/bin/env node
/**
 * r85m10-edge-map.mjs — Phase 9 đợt 85, luồng M10 (bổ sung 2): bản đồ lỗi
 * của C2 (two-step canvas) vs Mitchell(S0) và Bview (video trực tiếp) vs
 * tri(S0) trên lineart/sqw4 — lỗi nằm ở biên khung, đường lưới, đường
 * màu, hay khắp nơi? Kèm đối chứng: model resample của M10 so với
 * bilinearPlane2D production (chrome-resample.mjs) trên cùng input.
 *
 * Chạy: node apps/web/scripts/r85m10-edge-map.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { bcCubicKernel, chromeWeights1D } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M10 = path.join(GOAL, "round85-m10");
const PROBE = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-probe.json"), "utf8"));
const OUT = path.join(M10, "r85m10-edge-map.json");
const W = 640, H = 360;
const b64buf = (s) => Buffer.from(s, "base64");

// Model M10 (như analyze): clamp + renormalize.
function weightsRenorm(i, sc, srcLen, kernel, h = 1, phi = 0) {
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
// Quy tắc biên thay thế: replicate — tap ngoài biên dồn về pixel biên
// (trọng số giữ nguyên tổng 1, không renormalize).
function weightsReplicate(i, sc, srcLen, kernel, h = 1, phi = 0) {
  const S = (i + 0.5) / sc + phi;
  const j0 = Math.floor(S - h - 0.5);
  const j1 = Math.ceil(S + h - 0.5);
  const map = new Map();
  for (let j = j0; j <= j1; j++) {
    const w = kernel((j + 0.5 - S) / h);
    if (w === 0) continue;
    const jc = Math.min(srcLen - 1, Math.max(0, j));
    map.set(jc, (map.get(jc) || 0) + w);
  }
  return [...map.entries()];
}
// Quy tắc biên thay thế: drop — tap ngoài biên bỏ, KHÔNG renormalize.
function weightsDrop(i, sc, srcLen, kernel, h = 1, phi = 0) {
  const S = (i + 0.5) / sc + phi;
  const j0 = Math.max(0, Math.floor(S - h - 0.5));
  const j1 = Math.min(srcLen - 1, Math.ceil(S + h - 0.5));
  const ws = [];
  for (let j = j0; j <= j1; j++) {
    const w = kernel((j + 0.5 - S) / h);
    if (w === 0) continue;
    ws.push([j, w]);
  }
  if (ws.length === 0) return [[Math.min(srcLen - 1, Math.max(0, Math.round(S))), 1]];
  return ws;
}
function resampleWith(rgb, srcW, srcH, dstW, dstH, kernel, wfn) {
  const scX = dstW / srcW, scY = dstH / srcH;
  const out = new Float64Array(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const tmp = new Float64Array(dstW * srcH);
    for (let y = 0; y < srcH; y++) {
      const sRow = y * srcW, tRow = y * dstW;
      for (let i = 0; i < dstW; i++) {
        let acc = 0;
        for (const [j, w] of wfn(i, scX, srcW, kernel)) acc += w * pl[sRow + j];
        tmp[tRow + i] = acc;
      }
    }
    for (let x = 0; x < dstW; x++) {
      for (let i = 0; i < dstH; i++) {
        let acc = 0;
        for (const [j, w] of wfn(i, scY, srcH, kernel)) acc += w * tmp[j * dstW + x];
        out[(i * dstW + x) * 3 + c] = acc;
      }
    }
  }
  return out;
}
// Model production: bilinearPlane2D logic với chromeWeights1D + Mitchell.
function resampleProd(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = new Float64Array(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const sx = dstW / srcW, sy = dstH / srcH;
    const tmp = new Float64Array(dstW * srcH);
    for (let y = 0; y < srcH; y++) {
      for (let i = 0; i < dstW; i++) {
        let acc = 0;
        for (const [j, w] of chromeWeights1D(i, sx, srcW, kernel, 1)) acc += w * pl[y * srcW + j];
        tmp[y * dstW + i] = acc;
      }
    }
    for (let x = 0; x < dstW; x++) {
      for (let i = 0; i < dstH; i++) {
        let acc = 0;
        for (const [j, w] of chromeWeights1D(i, sy, srcH, kernel, 1)) acc += w * tmp[j * dstW + x];
        out[(i * dstW + x) * 3 + c] = acc;
      }
    }
  }
  return out;
}
const mitchell = (x) => bcCubicKernel(x, 1 / 3, 1 / 3);
const tri = (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; };
function madF(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

function main() {
  const res = { generatedAt: new Date().toISOString(), maps: {}, edgeRules: {}, prodCrossCheck: {} };
  for (const name of ["lineart640", "lineart2px-640", "sqw4-640", "step-640"]) {
    const S0 = b64buf(PROBE.statics[name].caps.native.rgbB64);
    const C2 = b64buf(PROBE.statics[name].caps.two1264.rgbB64);
    const Bview = b64buf(PROBE.statics[name].caps.direct1264.rgbB64);
    const mitM10 = resampleWith(S0, W, H, 809, 455, mitchell, weightsRenorm);
    const mitProd = resampleProd(S0, W, H, 809, 455, mitchell);
    const triM10 = resampleWith(S0, W, H, 809, 455, tri, weightsRenorm);
    // Đối chứng model M10 vs production.
    res.prodCrossCheck[name] = {
      mitchell_M10_vs_prod_MAD: +madF(mitM10, mitProd).toFixed(4),
      C2_vs_Mitchell_M10: +madF(Float64Array.from(C2), mitM10).toFixed(3),
      C2_vs_Mitchell_prod: +madF(Float64Array.from(C2), mitProd).toFixed(3),
      Bview_vs_tri_M10: +madF(Float64Array.from(Bview), triM10).toFixed(3),
    };
    // Bản đồ lỗi C2-vs-Mitchell: phân vùng theo vị trí + nội dung S0.
    // (Lấy mẫu S0 tại vị trí nguồn tương ứng (x/1,264, y/1,264) để phân loại.)
    const zones = {
      all: { s: 0, n: 0 },
      interior6: { s: 0, n: 0 }, edgeBand6: { s: 0, n: 0 },
      interior20: { s: 0, n: 0 }, edgeBand20: { s: 0, n: 0 },
      darkLine: { s: 0, n: 0 }, flatWhite: { s: 0, n: 0 }, colorPx: { s: 0, n: 0 }, grayPx: { s: 0, n: 0 },
    };
    const zonesB = JSON.parse(JSON.stringify(zones));
    const worst = [];
    for (let y = 0; y < 455; y++) {
      for (let x = 0; x < 809; x++) {
        const o = (y * 809 + x) * 3;
        const sx = Math.min(639, Math.floor(x / (809 / 640)));
        const sy = Math.min(359, Math.floor(y / (455 / 360)));
        const so = (sy * 640 + sx) * 3;
        const sR = S0[so], sG = S0[so + 1], sB = S0[so + 2];
        const dC = (Math.abs(C2[o] - mitM10[o]) + Math.abs(C2[o + 1] - mitM10[o + 1]) + Math.abs(C2[o + 2] - mitM10[o + 2])) / 3;
        const dB = (Math.abs(Bview[o] - triM10[o]) + Math.abs(Bview[o + 1] - triM10[o + 1]) + Math.abs(Bview[o + 2] - triM10[o + 2])) / 3;
        const edge6 = x < 6 || x >= 803 || y < 6 || y >= 449;
        const edge20 = x < 20 || x >= 789 || y < 20 || y >= 435;
        const acc = (z, key, d) => { z[key].s += d; z[key].n++; };
        for (const [z, d] of [[zones, dC], [zonesB, dB]]) {
          acc(z, "all", d);
          acc(z, edge6 ? "edgeBand6" : "interior6", d);
          acc(z, edge20 ? "edgeBand20" : "interior20", d);
          acc(z, sR < 100 ? "darkLine" : "flatWhite", d);
          acc(z, (Math.abs(sR - sG) > 20 || Math.abs(sR - sB) > 20) ? "colorPx" : "grayPx", d);
        }
        if (dC > 40) worst.push({ x, y, dC: +dC.toFixed(1), s0: [sR, sG, sB], c2: [C2[o], C2[o + 1], C2[o + 2]], mit: [+mitM10[o].toFixed(1), +mitM10[o + 1].toFixed(1), +mitM10[o + 2].toFixed(1)] });
      }
    }
    const summarize = (z) => Object.fromEntries(Object.entries(z).map(([k, v]) => [k, { mad: +(v.s / Math.max(1, v.n)).toFixed(3), share: +(v.n / z.all.n).toFixed(3) }]));
    res.maps[name] = { C2_vs_Mitchell: summarize(zones), Bview_vs_tri: summarize(zonesB), worstC2: worst.slice(0, 10), nWorstC2gt40: worst.length };
    // Quy tắc biên thay thế cho C2-vs-Mitchell.
    const mitRep = resampleWith(S0, W, H, 809, 455, mitchell, weightsReplicate);
    const mitDrop = resampleWith(S0, W, H, 809, 455, mitchell, weightsDrop);
    res.edgeRules[name] = {
      C2_vs_Mitchell_renorm: +madF(Float64Array.from(C2), mitM10).toFixed(3),
      C2_vs_Mitchell_replicate: +madF(Float64Array.from(C2), mitRep).toFixed(3),
      C2_vs_Mitchell_drop: +madF(Float64Array.from(C2), mitDrop).toFixed(3),
    };
    console.log(`${name}: model M10 vs prod Mitchell MAD ${res.prodCrossCheck[name].mitchell_M10_vs_prod_MAD} | C2 vs Mitchell M10 ${res.prodCrossCheck[name].C2_vs_Mitchell_M10} / prod ${res.prodCrossCheck[name].C2_vs_Mitchell_prod}`);
    console.log(`  C2-vs-Mitchell theo vùng: interior6 ${res.maps[name].C2_vs_Mitchell.interior6.mad} / edgeBand6 ${res.maps[name].C2_vs_Mitchell.edgeBand6.mad} / darkLine ${res.maps[name].C2_vs_Mitchell.darkLine.mad} / flatWhite ${res.maps[name].C2_vs_Mitchell.flatWhite.mad} / colorPx ${res.maps[name].C2_vs_Mitchell.colorPx.mad} (share ${res.maps[name].C2_vs_Mitchell.colorPx.share}) / grayPx ${res.maps[name].C2_vs_Mitchell.grayPx.mad}`);
    console.log(`  Bview-vs-tri theo vùng: interior6 ${res.maps[name].Bview_vs_tri.interior6.mad} / edgeBand6 ${res.maps[name].Bview_vs_tri.edgeBand6.mad} / darkLine ${res.maps[name].Bview_vs_tri.darkLine.mad} / flatWhite ${res.maps[name].Bview_vs_tri.flatWhite.mad}`);
    console.log(`  edge rules C2-vs-Mitchell: renorm ${res.edgeRules[name].C2_vs_Mitchell_renorm} / replicate ${res.edgeRules[name].C2_vs_Mitchell_replicate} / drop ${res.edgeRules[name].C2_vs_Mitchell_drop} | worst>40: ${worst.length}`);
    if (worst.length) console.log(`  worst mẫu: ${JSON.stringify(worst.slice(0, 3))}`);
  }
  writeFileEpermRetry(OUT, JSON.stringify(res, null, 2));
  console.log(`ghi ${OUT}`);
}
main();
