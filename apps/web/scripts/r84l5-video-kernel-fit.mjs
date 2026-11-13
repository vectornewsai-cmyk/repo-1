#!/usr/bin/env node
/**
 * r84l5-video-kernel-fit.mjs — Phase 9 đợt 84, luồng L5 (bổ sung sau phân tích
 * lần 1): khâu upscale video→canvas KHÔNG khớp kernel nào trong 5 kernel đã
 * thử (tri tốt nhất 3,95 trên lineart 1px, vẫn LỆCH) — thử thêm Lanczos,
 * Gauss, box, và kernel kéo giãn (h>1) trên Bview/S3plain đã capture.
 * Chạy: node apps/web/scripts/r84l5-video-kernel-fit.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const L5 = path.join(GOAL, "round84-l5");
const OUT = path.join(L5, "r84l5-video-kernel-fit.json");

function sinc(x) { return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); }
const KERNELS = {
  lanczos2: (x) => (Math.abs(x) < 2 ? sinc(x) * sinc(x / 2) : 0),
  lanczos3: (x) => (Math.abs(x) < 3 ? sinc(x) * sinc(x / 3) : 0),
  gauss08: (x) => Math.exp(-(x * x) / (2 * 0.8 * 0.8)) * (Math.abs(x) < 2 ? 1 : 0),
  gauss10: (x) => Math.exp(-(x * x) / 2) * (Math.abs(x) < 2 ? 1 : 0),
  gauss12: (x) => Math.exp(-(x * x) / (2 * 1.2 * 1.2)) * (Math.abs(x) < 2.4 ? 1 : 0),
  box: (x) => (Math.abs(x) < 0.5 ? 1 : 0),
  tri: (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; },
};
function bc(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
KERNELS.mitchell = (x) => bc(x, 1 / 3, 1 / 3);

function weights(i, sc, srcLen, kernel, h, phi = 0) {
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
function resample(rgb, srcW, srcH, dstW, dstH, kernel, h = 1) {
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
  for (const content of ["lineart640", "lineart2px-640", "textsmall640", "sqw4-640"]) {
    const doc = byContent[content];
    if (!doc) { res[content] = { missing: true }; continue; }
    const snaps = doc.snaps[content];
    const vw = snaps.plain.w, vh = snaps.plain.h;
    const S0 = Buffer.from(doc.directDraws[content].plain.native.rgbB64, "base64");
    const Bview = Buffer.from(doc.directDraws[content].plain.viewport.rgbB64, "base64");
    const S3plain = Buffer.from(snaps.plain.rgbB64, "base64");
    const r = {};
    for (const [kname, kfn] of Object.entries(KERNELS)) {
      r[`Bview_vs_${kname}_h1`] = madF(Float64Array.from(Bview), resample(S0, 640, 360, vw, vh, kfn, 1));
      r[`S3plain_vs_${kname}_h1`] = madF(Float64Array.from(S3plain), resample(S0, 640, 360, vw, vh, kfn, 1));
    }
    // Kéo giãn kernel (h>1): mô hình "video scaler dùng support rộng hơn".
    for (const h of [1.25, 1.5, 2.0]) {
      r[`Bview_vs_tri_h${h}`] = madF(Float64Array.from(Bview), resample(S0, 640, 360, vw, vh, KERNELS.tri, h));
      r[`Bview_vs_mitchell_h${h}`] = madF(Float64Array.from(Bview), resample(S0, 640, 360, vw, vh, KERNELS.mitchell, h));
      r[`S3plain_vs_tri_h${h}`] = madF(Float64Array.from(S3plain), resample(S0, 640, 360, vw, vh, KERNELS.tri, h));
    }
    res[content] = r;
    console.log(`--- ${content} ---`);
    console.log(JSON.stringify(r, null, 1));
  }
  // Profile 1D qua 1 đường dọc của lineart640: hàng y=100 (nền trắng +
  // đường đen), so Bview vs tri/mitchell — xem hình dạng cạnh.
  const doc = byContent["lineart640"];
  if (doc) {
    const snaps = doc.snaps["lineart640"];
    const vw = snaps.plain.w;
    const S0 = Buffer.from(doc.directDraws["lineart640"].plain.native.rgbB64, "base64");
    const Bview = Buffer.from(doc.directDraws["lineart640"].plain.viewport.rgbB64, "base64");
    const tri = resample(S0, 640, 360, vw, 455, KERNELS.tri, 1);
    const mit = resample(S0, 640, 360, vw, 455, KERNELS.mitchell, 1);
    // Tìm cột có đường dọc: quét hàng y=200 của S0 tìm pixel đen (0) giữa trắng.
    const y0 = 200;
    let x0 = -1;
    for (let x = 1; x < 639; x++) {
      if (S0[(y0 * 640 + x) * 3] < 30 && S0[(y0 * 640 + x - 1) * 3] > 200) { x0 = x; break; }
    }
    console.log("line profile: S0 black edge at x0 =", x0);
    const prof = { x0 };
    if (x0 > 0) {
      const cx = Math.round((x0 + 0.5) * (vw / 640));
      const yv = Math.round(y0 * 455 / 360);
      const cols = [];
      for (let dx = -6; dx <= 6; dx++) {
        const x = cx + dx;
        cols.push({ dx, Bview: Bview[(yv * vw + x) * 3], tri: +tri[(yv * vw + x) * 3].toFixed(1), mit: +mit[(yv * vw + x) * 3].toFixed(1) });
      }
      prof.cols = cols;
      console.log(JSON.stringify(cols));
    }
    res.lineProfile = prof;
  }
  writeFileEpermRetry(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), results: res }, null, 2));
  console.log(`ghi ${OUT}`);
}
main();
