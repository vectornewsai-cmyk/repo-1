#!/usr/bin/env node
/**
 * r80h3-edge-profile.mjs — Phase 9 đợt 80, luồng H3 (probe a):
 * profile cạnh xung vuông (nợ F6 §7.3 / G5 §9.2) — đo kernel thuần
 * không qua decoder: so profile cạnh của preview (Chrome thật) với 2
 * mô hình (BC production vs tam giác cũ) trên cùng frame render.
 *
 * Nội dung sqwP (P = 4/8/16/32): nửa trên sọc dọc, nửa dưới sọc ngang,
 * mức 64/192. Đo trên biến thể plain:
 *   - X-profile: trung bình kênh R theo dải hàng 10%..40% H (sọc dọc).
 *   - Y-profile: trung bình kênh R theo dải cột 10%..40% W (sọc ngang).
 *   - profile MAD preview-vs-model (BC / tam giác).
 *   - overshoot: max(profile) − 192 (vượt mức cao) và 64 − min(profile)
 *     (vượt mức thấp) — BC có thùy âm nên overshoot, tam giác không.
 *   - edge width: khoảng cách 10%→90% (76,8→179,2) trung bình qua các
 *     cạnh phát hiện được (vượt mức giữa 128).
 *   - plateau MAD: |profile − mức gần nhất (64/192)| ở mẫu cách cạnh
 *     ≥ 2px (viewport) — đo lỗi nền ngoài vùng chuyển tiếp.
 * Lineart2px: grid profile (như probe C C2) preview vs BC vs tam giác.
 *
 * Đọc: hidden_files/round80-h3/headed-.../r80h3-snaps-....json + render/
 * (frame theo playhead của run: 30 → fullrgb-<v>.raw, 60 → -f60).
 * Ghi: hidden_files/round80-h3/r80h3-edge-profile.json.
 * KHÔNG push/tag/binary. Chạy: node apps/web/scripts/r80h3-edge-profile.mjs
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear, chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H3 = path.join(GOAL, "round80-h3");
const OUT = path.join(H3, "r80h3-edge-profile.json");
const LO = 64, HI = 192, MID = 128;

function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
function resamplePlaneKernel(src, srcW, srcH, dstW, dstH, scaleX, scaleY, kernel) {
  const tmp = new Float64Array(dstW * srcH);
  const wCacheX = new Array(dstW);
  for (let i = 0; i < dstW; i++) wCacheX[i] = chromeWeights1D(i, scaleX, srcW, kernel);
  for (let y = 0; y < srcH; y++) {
    const sRow = y * srcW, tRow = y * dstW;
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of wCacheX[i]) acc += w * src[sRow + j];
      tmp[tRow + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  const wCacheY = new Array(dstH);
  for (let i = 0; i < dstH; i++) wCacheY[i] = chromeWeights1D(i, scaleY, srcH, kernel);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of wCacheY[i]) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  const sx = dstW / srcW, sy = dstH / srcH;
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const r = resamplePlaneKernel(pl, srcW, srcH, dstW, dstH, sx, sy, kernel);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(r[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
const TRI = (rgb, sw, sh, dw, dh) => resampleRgbKernel(rgb, sw, sh, dw, dh, triangleKernel);
const BC = (rgb, sw, sh, dw, dh) => resampleRgb24Trilinear(rgb, sw, sh, dw, dh);
const b64 = (b) => Buffer.from(b, "base64");

// Profile 1D: trung bình kênh R trên dải (axis "x": dải hàng y0..y1;
// axis "y": dải cột x0..x1, CHỈ trên dải hàng ry0..ry1 — bắt buộc cho
// sqw vì nửa trên là sọc dọc (trung bình theo x ≈ 128 hằng), nửa dưới
// mới là sọc ngang).
function profileX(img, vw, vh, y0, y1) {
  const p = new Float64Array(vw);
  for (let x = 0; x < vw; x++) {
    let s = 0;
    for (let y = y0; y < y1; y++) s += img[(y * vw + x) * 3];
    p[x] = s / (y1 - y0);
  }
  return p;
}
function profileY(img, vw, vh, x0, x1, ry0, ry1) {
  const p = new Float64Array(ry1 - ry0);
  for (let k = 0; k < ry1 - ry0; k++) {
    const y = ry0 + k;
    let s = 0;
    for (let x = x0; x < x1; x++) s += img[(y * vw + x) * 3];
    p[k] = s / (x1 - x0);
  }
  return p;
}
function profileMetrics(pPrev, pModel, periodOut) {
  const n = pPrev.length;
  let mad = 0, mx = -Infinity, mn = Infinity;
  for (let i = 0; i < n; i++) { mad += Math.abs(pPrev[i] - pModel[i]); if (pPrev[i] > mx) mx = pPrev[i]; if (pPrev[i] < mn) mn = pPrev[i]; }
  mad /= n;
  // Cạnh: vị trí vượt mức giữa 128 trong profile preview.
  const edges = [];
  for (let i = 1; i < n; i++) {
    if ((pPrev[i - 1] - MID) * (pPrev[i] - MID) < 0) edges.push(i);
  }
  // Edge width 10%→90% quanh mỗi cạnh (nội suy tuyến tính). Tìm crossing
  // GẦN cạnh nhất trong cửa sổ ±periodOut/2 (bản cũ tìm crossing ĐẦU TIÊN
  // trong cửa sổ rộng ±periodOut nên bắt nhầm cạnh kề — width phình ~10×).
  const widths = [];
  const lo10 = LO + 0.1 * (HI - LO), hi90 = LO + 0.9 * (HI - LO);
  const crossNear = (t, e) => {
    const W = Math.max(2, Math.ceil(periodOut / 2));
    let best = null, bestD = Infinity;
    for (let i = Math.max(0, e - W); i < Math.min(n - 1, e + W); i++) {
      const a = pPrev[i], b = pPrev[i + 1];
      if ((a - t) * (b - t) <= 0 && b !== a) {
        const x = i + (t - a) / (b - a);
        const d = Math.abs(x - e);
        if (d < bestD) { bestD = d; best = x; }
      }
    }
    return best;
  };
  for (const e of edges) {
    const rising = pPrev[e] > pPrev[e - 1];
    const t1 = rising ? lo10 : hi90, t2 = rising ? hi90 : lo10;
    const x1 = crossNear(t1, e);
    const x2 = crossNear(t2, e);
    if (x1 !== null && x2 !== null && Math.abs(x2 - x1) < periodOut) widths.push(Math.abs(x2 - x1));
  }
  // Plateau MAD: mẫu cách mọi cạnh ≥ 2px.
  let pSum = 0, pN = 0;
  for (let i = 0; i < n; i++) {
    let near = false;
    for (const e of edges) if (Math.abs(i - e) < 2) { near = true; break; }
    if (near) continue;
    const ideal = pPrev[i] > MID ? HI : LO;
    pSum += Math.abs(pPrev[i] - ideal); pN++;
  }
  const widthMean = widths.length ? +(widths.reduce((a, b) => a + b, 0) / widths.length).toFixed(2) : null;
  return {
    mad: +mad.toFixed(3),
    overHigh: +(mx - HI).toFixed(2), underLow: +(LO - mn).toFixed(2),
    edges: edges.length, edgeWidthMean: widthMean, edgeWidthsN: widths.length,
    plateauMad: pN ? +(pSum / pN).toFixed(3) : null, plateauN: pN,
  };
}
function analyzeProfile(pPrev, pBC, pTri, periodOut) {
  const mBC = profileMetrics(pPrev, pBC, periodOut);
  const mTri = profileMetrics(pPrev, pTri, periodOut);
  const overBC = { overHigh: +((() => { let m = -Infinity; for (const v of pBC) if (v > m) m = v; return m; })() - HI).toFixed(2), underLow: +((() => { let m = Infinity; for (const v of pBC) if (v < m) m = v; return m; })() * -1 + LO).toFixed(2) };
  const overTri = { overHigh: +((() => { let m = -Infinity; for (const v of pTri) if (v > m) m = v; return m; })() - HI).toFixed(2), underLow: +((() => { let m = Infinity; for (const v of pTri) if (v < m) m = v; return m; })() * -1 + LO).toFixed(2) };
  return {
    preview: { overHigh: mBC.overHigh, underLow: mBC.underLow, edges: mBC.edges, edgeWidthMean: mBC.edgeWidthMean, plateauMad: mBC.plateauMad },
    bc: { mad: mBC.mad, ...overBC },
    tri: { mad: mTri.mad, ...overTri },
    edgeWidthsN: mBC.edgeWidthsN,
  };
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
      const playhead = doc.playhead ?? 1.0;
      const frame = Math.round(playhead * 30);
      const suffix = frame === 30 ? "" : `-f${frame}`;
      const projW = doc.projW, projH = doc.projH;
      const runKey = `${doc.window}-p${projW}x${projH}-ph${playhead}`;
      console.log(`\n######## RUN ${runKey} (${f}) ########`);
      const runRep = { window: doc.window, projW, projH, playhead, frame, contents: {} };
      for (const content of Object.keys(doc.snaps)) {
        const snaps = doc.snaps[content];
        const vw = snaps.plain.w, vh = snaps.plain.h;
        const scale = snaps.plain.rect.scale;
        const renderPlain = fs.readFileSync(path.join(H3, "render", content, `fullrgb-plain${suffix}.raw`));
        const prevPlain = b64(snaps.plain.rgbB64);
        const rBC = BC(renderPlain, projW, projH, vw, vh);
        const rTri = TRI(renderPlain, projW, projH, vw, vh);
        const crep = { rect: { w: vw, h: vh, scale: +scale.toFixed(6) } };
        const m = content.match(/^sqw(\d+)/);
        if (m) {
          const period = Number(m[1]);
          const periodOut = period * scale;
          // X-profile: sọc dọc, dải hàng 10%..40% H.
          const y0 = Math.floor(vh * 0.1), y1 = Math.floor(vh * 0.4);
          const pxPrev = profileX(prevPlain, vw, vh, y0, y1);
          const pxBC = profileX(rBC, vw, vh, y0, y1);
          const pxTri = profileX(rTri, vw, vh, y0, y1);
          crep.profileX = analyzeProfile(pxPrev, pxBC, pxTri, periodOut);
          // Y-profile: sọc ngang, dải cột 10%..40% W, CHỈ hàng 60%..90% H
          // (nửa dưới — nửa trên là sọc dọc, trung bình theo x ≈ 128).
          const x0 = Math.floor(vw * 0.1), x1 = Math.floor(vw * 0.4);
          const ry0 = Math.floor(vh * 0.6), ry1 = Math.floor(vh * 0.9);
          const pyPrev = profileY(prevPlain, vw, vh, x0, x1, ry0, ry1);
          const pyBC = profileY(rBC, vw, vh, x0, x1, ry0, ry1);
          const pyTri = profileY(rTri, vw, vh, x0, x1, ry0, ry1);
          crep.profileY = analyzeProfile(pyPrev, pyBC, pyTri, periodOut);
          console.log(`  ${content} (chu kỳ ${period}px → ${periodOut.toFixed(1)}px viewport, scale ${scale.toFixed(3)}):`);
          console.log(`    X: preview over +${crep.profileX.preview.overHigh}/−${crep.profileX.preview.underLow}, width ${crep.profileX.preview.edgeWidthMean} (n=${crep.profileX.edgeWidthsN}), plateau ${crep.profileX.preview.plateauMad} | MAD vs BC ${crep.profileX.bc.mad} (over +${crep.profileX.bc.overHigh}/−${crep.profileX.bc.underLow}) vs tri ${crep.profileX.tri.mad} (over +${crep.profileX.tri.overHigh}/−${crep.profileX.tri.underLow})`);
          console.log(`    Y: preview over +${crep.profileY.preview.overHigh}/−${crep.profileY.preview.underLow}, width ${crep.profileY.preview.edgeWidthMean} (n=${crep.profileY.edgeWidthsN}), plateau ${crep.profileY.preview.plateauMad} | MAD vs BC ${crep.profileY.bc.mad} (over +${crep.profileY.bc.overHigh}/−${crep.profileY.bc.underLow}) vs tri ${crep.profileY.tri.mad} (over +${crep.profileY.tri.overHigh}/−${crep.profileY.tri.underLow})`);
        } else {
          // lineart2px: grid profile như probe C C2.
          const y0 = Math.floor(vh * 0.08), y1 = Math.floor(vh * 0.12);
          const prof = (img) => {
            const p = new Float64Array(vw);
            for (let x = 0; x < vw; x++) { let s = 0; for (let y = y0; y < y1; y++) s += img[(y * vw + x) * 3]; p[x] = s / (y1 - y0); }
            return p;
          };
          const pP = prof(prevPlain), pBC = prof(rBC), pTri = prof(rTri);
          let madBC = 0, madTri = 0, minBC = 255, minTri = 255, minP = 255;
          for (let x = 0; x < vw; x++) {
            madBC += Math.abs(pP[x] - pBC[x]); madTri += Math.abs(pP[x] - pTri[x]);
            if (pBC[x] < minBC) minBC = pBC[x];
            if (pTri[x] < minTri) minTri = pTri[x];
            if (pP[x] < minP) minP = pP[x];
          }
          crep.gridProfile = {
            bandY: [y0, y1], madBC: +(madBC / vw).toFixed(3), madTri: +(madTri / vw).toFixed(3),
            minPreview: +minP.toFixed(1), minBC: +minBC.toFixed(1), minTri: +minTri.toFixed(1),
          };
          console.log(`  ${content}: grid profile MAD BC ${crep.gridProfile.madBC} / tri ${crep.gridProfile.madTri}; min preview ${crep.gridProfile.minPreview} vs BC ${crep.gridProfile.minBC} vs tri ${crep.gridProfile.minTri}`);
        }
        runRep.contents[content] = crep;
      }
      report.runs[runKey] = runRep;
    }
  }
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON edge-profile: ${OUT}`);
}
main();
