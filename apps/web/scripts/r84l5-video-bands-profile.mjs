#!/usr/bin/env node
/**
 * r84l5-video-bands-profile.mjs — Phase 9 đợt 84, luồng L5: kiểm tra 2 giả
 * thuyết còn lại cho video scaler — (1) lệch pha tuyến tính theo vị trí
 * (align-corners vs align-centers: sai số tăng dần về biên khung) qua MAD
 * theo dải không gian; (2) hình dạng cạnh 1D qua profile đường dọc.
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const L5 = path.join(GOAL, "round84-l5");

function resamplePlaneFloat(src, srcW, srcH, dstW, dstH, kernel = triangleKernel) {
  const scaleX = dstW / srcW, scaleY = dstH / srcH;
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
function resampleRgbFloat(rgb, srcW, srcH, dstW, dstH) {
  const out = new Float64Array(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const rs = resamplePlaneFloat(pl, srcW, srcH, dstW, dstH);
    for (let i = 0; i < dstW * dstH; i++) out[i * 3 + c] = rs[i];
  }
  return out;
}
function madBand(a, b, w, h, x0, x1, y0, y1) {
  let s = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    for (let c = 0; c < 3; c++) s += Math.abs(a[(y * w + x) * 3 + c] - b[(y * w + x) * 3 + c]);
    n++;
  }
  return +(s / (n * 3)).toFixed(3);
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
  const out = {};
  for (const content of ["lineart640", "lineart2px-640"]) {
    const doc = byContent[content];
    const snaps = doc.snaps[content];
    const vw = snaps.plain.w, vh = snaps.plain.h;
    const S0 = Buffer.from(doc.directDraws[content].plain.native.rgbB64, "base64");
    const Bview = Buffer.from(doc.directDraws[content].plain.viewport.rgbB64, "base64");
    const tri = resampleRgbFloat(S0, 640, 360, vw, vh);
    const r = { viewport: `${vw}x${vh}` };
    // MAD theo dải cột (5 dải) + dải hàng (3 dải): align-corners => sai
    // số tăng về biên; lỗi đều => kernel sai hình dạng, không phải pha.
    r.colBands = [];
    for (let b = 0; b < 5; b++) {
      const x0 = Math.round((b * vw) / 5), x1 = Math.round(((b + 1) * vw) / 5);
      r.colBands.push(madBand(Float64Array.from(Bview), tri, vw, vh, x0, x1, 0, vh));
    }
    r.rowBands = [];
    for (let b = 0; b < 3; b++) {
      const y0 = Math.round((b * vh) / 3), y1 = Math.round(((b + 1) * vh) / 3);
      r.rowBands.push(madBand(Float64Array.from(Bview), tri, vw, vh, 0, vw, y0, y1));
    }
    // Profile qua đường dọc: hàng y=203 (giữa 2 đường ngang, 203%8=3).
    const y0 = 203, yv = Math.round(y0 * vh / 360);
    let x0 = -1;
    for (let x = 1; x < 639; x++) {
      if (S0[(y0 * 640 + x) * 3] < 30 && S0[(y0 * 640 + x - 1) * 3] > 200) { x0 = x; break; }
    }
    r.profileY0 = y0; r.profileX0 = x0;
    if (x0 > 0) {
      const cx = Math.round((x0 + 0.5) * (vw / 640));
      r.profile = [];
      for (let dx = -6; dx <= 6; dx++) {
        const x = cx + dx;
        r.profile.push({ dx, Bview: Bview[(yv * vw + x) * 3], tri: +tri[(yv * vw + x) * 3].toFixed(1) });
      }
    }
    // Profile qua đường NGANG (cột x=203): kiểm tra dị hướng X/Y.
    const x1 = 203, xv = Math.round(x1 * vw / 640);
    let yEdge = -1;
    for (let y = 1; y < 359; y++) {
      if (S0[(y * 640 + x1) * 3] < 30 && S0[((y - 1) * 640 + x1) * 3] > 200) { yEdge = y; break; }
    }
    r.profileYEdge = yEdge;
    if (yEdge > 0) {
      const cy = Math.round((yEdge + 0.5) * (vh / 360));
      r.profileV = [];
      for (let dy = -6; dy <= 6; dy++) {
        const y = cy + dy;
        r.profileV.push({ dy, Bview: Bview[(y * vw + xv) * 3], tri: +tri[(y * vw + xv) * 3].toFixed(1) });
      }
    }
    out[content] = r;
    console.log(`--- ${content} ---`);
    console.log(JSON.stringify(r, null, 1));
  }
  writeFileEpermRetry(path.join(L5, "r84l5-video-bands-profile.json"), JSON.stringify(out, null, 2));
}
main();
