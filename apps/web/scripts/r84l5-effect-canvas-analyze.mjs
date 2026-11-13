#!/usr/bin/env node
/**
 * r84l5-effect-canvas-analyze.mjs — Phase 9 đợt 84, luồng L5: phân tích probe
 * đọc trực tiếp effect canvas (nợ J7 §7.1 / K6 §7 mục 2).
 *
 * Đầu vào: JSON probe headed (snaps + rawFrames + directDraws + hookDumps) +
 * frame render ffmpeg (fullrgb-*.raw) + bundle applySharpen (/tmp).
 *
 * Phân rã delta preview theo khâu (mọi MAD trên RGB, float không làm tròn
 * cho delta; MAD tuyệt đối làm tròn như K6/J7):
 *   A. base decode:  MAD(S0_direct_native, R_ff) — video→canvas 1:1 của
 *      Chrome khác frame ffmpeg bao nhiêu (base-mismatch YUV/chroma)?
 *   B. drawImage 1:1: MAD(S1_effect_in, S0) — frame vào effect canvas có
 *      đúng bằng draw trực tiếp không?
 *   C. sharpen trong trang: MAD(S2_effect_out, applySharpen_model(S1)) —
 *      sharpen thật của Chrome trong effect canvas có bằng model bundle?
 *   D. composite: MAD(S3_sharp, Mitchell(S2)) và MAD(S3_plain,
 *      Mitchell(S0)) — upscale cuối có đúng là Mitchell không? Và
 *      MAD(S3_plain, direct_viewport) — plain có đúng là 1 drawImage
 *      video→viewport không?
 *   E. PHẦN DƯ then chốt: MAD(dp_prev, Mitchell(S2)-Mitchell(S1)) với
 *      dp_prev = S3_sharp - S3_plain — sau khi dùng đúng base thật của
 *      Chrome (S1) thay vì R_ff, phần dư lineart còn bao nhiêu so với
 *      baseline K6 (tri/R_ff: 1px 5,494 / 2px 4,128 @sharp10)?
 *   F. bt709 vs bt601 cho applySharpen (nợ H3 §5.2) trên textsmall640
 *      (nội dung màu): sharpen601 tự cài (đổi luma + ma trận YUV) so với
 *      sharpen709 bundle — trên lineart xám R=G=B hai ma trận cho Y như
 *      nhau nên KHÔNG phân biệt được, chỉ textsmall mới đo được.
 *
 * Chạy: node apps/web/scripts/r84l5-effect-canvas-analyze.mjs
 * Env: R84L5_OUT (mặc định hidden_files/round84-l5/r84l5-analysis.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { chromeWeights1D, chromeUpscaleKernel, bcCubicKernel, triangleKernel } from "./chrome-resample.mjs";

const require = createRequire(import.meta.url);
const { applySharpen } = require("/tmp/r84l5-effectCanvas.cjs");

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G5 = path.join(GOAL, "round79-g5");
const H3 = path.join(GOAL, "round80-h3");
const L5 = path.join(GOAL, "round84-l5");
const OUT = process.env.R84L5_OUT || path.join(L5, "r84l5-analysis.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// ---------- resample Mitchell (sao từ K6, đổi kernel tri -> Mitchell) ----------
function weightsPhiSc(i, sc, srcLen, kernel, phi) {
  const h = 1;
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
function resamplePlaneFloat(src, srcW, srcH, dstW, dstH, kernel = chromeUpscaleKernel, scaleX = null, scaleY = null, phiX = 0, phiY = 0) {
  scaleX = scaleX ?? dstW / srcW; scaleY = scaleY ?? dstH / srcH;
  const tmp = new Float64Array(dstW * srcH);
  const wCacheX = new Array(dstW);
  for (let i = 0; i < dstW; i++) wCacheX[i] = phiX === 0 ? chromeWeights1D(i, scaleX, srcW, kernel) : weightsPhiSc(i, scaleX, srcW, kernel, phiX);
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
  for (let i = 0; i < dstH; i++) wCacheY[i] = phiY === 0 ? chromeWeights1D(i, scaleY, srcH, kernel) : weightsPhiSc(i, scaleY, srcH, kernel, phiY);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of wCacheY[i]) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleRgbFloat(rgb, srcW, srcH, dstW, dstH, scaleX = null, scaleY = null, phiX = 0, phiY = 0) {
  const out = new Float64Array(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const rs = resamplePlaneFloat(pl, srcW, srcH, dstW, dstH, chromeUpscaleKernel, scaleX, scaleY, phiX, phiY);
    for (let i = 0; i < dstW * dstH; i++) out[i * 3 + c] = rs[i];
  }
  return out;
}
function resampleRgbRound(rgb, srcW, srcH, dstW, dstH, scaleX = null, scaleY = null, phiX = 0, phiY = 0) {
  const f = resampleRgbFloat(rgb, srcW, srcH, dstW, dstH, scaleX, scaleY, phiX, phiY);
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let i = 0; i < f.length; i++) {
    const v = Math.round(f[i]);
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return out;
}

// ---------- G. fit kernel + pha cho khâu upscale (video vs canvas) ----------
const KERNELS = {
  tri: triangleKernel,
  mitchell: chromeUpscaleKernel,
  BC025_0375: (x) => bcCubicKernel(x, 0.25, 0.375),
  catmull: (x) => bcCubicKernel(x, 0, 0.5),
  bspline: (x) => bcCubicKernel(x, 1, 0),
};
function weightsPhi(i, sc, srcLen, kernel, phi) {
  const h = 1;
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
function resampleRgbPhi(rgb, srcW, srcH, dstW, dstH, kernel, phiX, phiY) {
  const scaleX = dstW / srcW, scaleY = dstH / srcH;
  const out = new Float64Array(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const tmp = new Float64Array(dstW * srcH);
    const wx = new Array(dstW);
    for (let i = 0; i < dstW; i++) wx[i] = weightsPhi(i, scaleX, srcW, kernel, phiX);
    for (let y = 0; y < srcH; y++) {
      const sRow = y * srcW, tRow = y * dstW;
      for (let i = 0; i < dstW; i++) {
        let acc = 0;
        for (const [j, w] of wx[i]) acc += w * pl[sRow + j];
        tmp[tRow + i] = acc;
      }
    }
    const wy = new Array(dstH);
    for (let i = 0; i < dstH; i++) wy[i] = weightsPhi(i, scaleY, srcH, kernel, phiY);
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
function resampleRgbKernelRound(rgb, srcW, srcH, dstW, dstH, kernel) {
  const f = resampleRgbPhi(rgb, srcW, srcH, dstW, dstH, kernel, 0, 0);
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let i = 0; i < f.length; i++) {
    const v = Math.round(f[i]);
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return out;
}
function madShifted(a, b, w, h, dx, dy) {
  // MAD của a so với b dịch nguyên (dx,dy); chỉ tính vùng giao nhau.
  let sum = 0, n = 0;
  for (let y = 0; y < h; y++) {
    const y2 = y + dy;
    if (y2 < 0 || y2 >= h) continue;
    for (let x = 0; x < w; x++) {
      const x2 = x + dx;
      if (x2 < 0 || x2 >= w) continue;
      for (let c = 0; c < 3; c++) sum += Math.abs(a[(y * w + x) * 3 + c] - b[(y2 * w + x2) * 3 + c]);
      n++;
    }
  }
  return +(sum / (n * 3)).toFixed(3);
}

// ---------- helpers ----------
function mad(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return +(sum / a.length).toFixed(3);
}
function madPerChannel(a, b) {
  const s = [0, 0, 0], n = a.length / 3;
  for (let p = 0; p < n; p++) for (let c = 0; c < 3; c++) s[c] += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
  return s.map((v) => +(v / n).toFixed(3));
}
function deltaMad(dp, dr) {
  let sum = 0;
  for (let i = 0; i < dp.length; i++) sum += Math.abs(dp[i] - dr[i]);
  return +(sum / dp.length).toFixed(3);
}
function deltaOf(a, b) {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}
function sumAbs(a) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i]); return s; }
function meanAbs(a) { return +(sumAbs(a) / a.length).toFixed(3); }
function rgb24ToRgba(rgb, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = rgb[i * 3]; out[i * 4 + 1] = rgb[i * 3 + 1]; out[i * 4 + 2] = rgb[i * 3 + 2]; out[i * 4 + 3] = 255;
  }
  return out;
}
function rgbaToRgb24(rgba) {
  const out = Buffer.alloc((rgba.length / 4) * 3);
  for (let i = 0; i < rgba.length / 4; i++) { out[i * 3] = rgba[i * 4]; out[i * 3 + 1] = rgba[i * 4 + 1]; out[i * 3 + 2] = rgba[i * 4 + 2]; }
  return out;
}
function sharpenRgb(rgb, w, h, intensity) {
  const img = { width: w, height: h, data: rgb24ToRgba(rgb, w, h) };
  applySharpen(img, intensity);
  return rgbaToRgb24(img.data);
}

// ---------- sharpen bt601 (đổi ma trận của applySharpen; sao logic T4/S7) ----------
const K601 = { wr: 0.299, wg: 0.587, wb: 0.114 };
function rgbToYuv601(r, g, b) {
  const yl = (K601.wr * r + K601.wg * g + K601.wb * b) / 255;
  const y = 16 + 219 * yl;
  const cb = 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - K601.wb);
  const cr = 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - K601.wr);
  return [y, cb, cr];
}
function yuv601ToRgb(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.59603 * (cr - 128), yy - 0.39176 * (cb - 128) - 0.81297 * (cr - 128), yy + 2.01723 * (cb - 128)];
}
function clamp255Byte(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
function estimateNativeChroma(derived, k) {
  const e = 128 + k * (derived - 128);
  return e < 16 ? 16 : e > 240 ? 240 : e;
}
function sharpen601Rgb(rgb, w, h, intensity) {
  // Bản sao applySharpen với luma bt601 + ma trận YUV bt601 (giữ nguyên
  // cấu trúc HYB4: estimateNativeY/chroma, kCb=1.04/kCr=1.09, ngưỡng 4).
  const amount = 0.2 + Math.min(1, Math.max(0, intensity)) * 1.8;
  const d = rgb24ToRgba(rgb, w, h);
  const lum = new Float64Array(w * h), lumY = new Float64Array(w * h);
  const CB = new Float64Array(w * h), CR = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    lum[i] = K601.wr * r + K601.wg * g + K601.wb * b;
    lumY[i] = 16 + (219 * lum[i]) / 255;
    const [, cb, cr] = rgbToYuv601(r, g, b);
    CB[i] = cb; CR[i] = cr;
  }
  const cw = (w + 1) >> 1, ch = (h + 1) >> 1;
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= w || y >= h) continue;
      const i = y * w + x; sCb += CB[i]; sCr += CR[i]; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma(sCb / n, 1.04);
    estCr[i] = estimateNativeChroma(sCr / n, 1.09);
  }
  const nativeOff = (yD, cbE, crE) => {
    const [r, g, b] = yuv601ToRgb(yD, cbE, crE);
    let off = 0;
    if (r > 255) off += K601.wr * (r - 255); else if (r < 0) off += K601.wr * r;
    if (g > 255) off += K601.wg * (g - 255); else if (g < 0) off += K601.wg * g;
    if (b > 255) off += K601.wb * (b - 255); else if (b < 0) off += K601.wb * b;
    return off * (219 / 255);
  };
  const lumEst = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, ci = (y >> 1) * cw + (x >> 1);
    const o1 = nativeOff(lumY[i], estCb[ci], estCr[ci]);
    const o2 = nativeOff(lumY[i] + o1, estCb[ci], estCr[ci]);
    lumEst[i] = lumY[i] + (o1 + o2) / 2;
  }
  const K = [1, 4, 6, 4, 1];
  const at = (x, y, arr) => {
    const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
    const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
    return arr[cy * w + cx];
  };
  const tmp = new Float64Array(w * h), blur = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0; for (let dx = -2; dx <= 2; dx++) s += K[dx + 2] * at(x + dx, y, lumEst);
    tmp[y * w + x] = s / 16;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0; for (let dy = -2; dy <= 2; dy++) s += K[dy + 2] * at(x, y + dy, tmp);
    blur[y * w + x] = s / 16;
  }
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    const ci = (((i / w) | 0) >> 1) * cw + ((i % w) >> 1);
    const deltaY = amount * (lumEst[i] - blur[i]);
    const deltaAdd = 1.164383 * (clamp255Byte(lumY[i] + deltaY) - lumY[i]);
    const [r0, g0, b0] = yuv601ToRgb(lumEst[i], estCb[ci], estCr[ci]);
    const deltaDirect = 1.164383 * (clamp255Byte(lumEst[i] + deltaY) - lumEst[i]);
    const r0c = [r0, g0, b0], plainC = [d[p], d[p + 1], d[p + 2]];
    for (let c = 0; c < 3; c++) {
      const excess = r0c[c] > 255 ? r0c[c] - 255 : r0c[c] < 0 ? -r0c[c] : 0;
      d[p + c] = clamp255Byte(excess > 4 ? r0c[c] + deltaDirect : plainC[c] + deltaAdd);
    }
  }
  return rgbaToRgb24(d);
}

// ---------- datasets ----------
const DATASETS = [
  { key: "L1px-640@1.264", content: "lineart640", render: path.join(G5, "render", "lineart640"), projW: 640, projH: 360, baselineTriSharp10: 5.494 },
  { key: "L2px-640@1.264", content: "lineart2px-640", render: path.join(H3, "render", "lineart2px-640"), projW: 640, projH: 360, baselineTriSharp10: 4.128 },
  { key: "textsmall640@1.264", content: "textsmall640", render: path.join(G5, "render", "textsmall640"), projW: 640, projH: 360, baselineTriSharp10: 0.748 },
  { key: "sqw4-640@1.264", content: "sqw4-640", render: null, projW: 640, projH: 360, baselineTriSharp10: null },
];

function loadProbeDocs() {
  const docs = [];
  for (const dir of fs.readdirSync(L5).filter((d) => d.startsWith("headed-"))) {
    const f = path.join(L5, dir, `r84l5-snaps-w1920x1080-p640x360.json`);
    if (fs.existsSync(f)) docs.push(JSON.parse(fs.readFileSync(f, "utf8")));
  }
  return docs;
}

function effectFrames(hookDump, projW, projH) {
  // Tìm canvas effect: w×h project-size, có cả gets+puts ở variant sharp.
  const out = {};
  if (!hookDump?.ok) return out;
  for (const c of hookDump.canvases) {
    if (c.w !== projW || c.h !== projH) continue;
    for (const v of ["sharp05", "sharp10"]) {
      if (c.gets[v] && c.puts[v]) {
        out[v] = {
          in: Buffer.from(c.gets[v].rgbB64, "base64"),
          out: Buffer.from(c.puts[v].rgbB64, "base64"),
          getN: c.gets[v].n, putN: c.puts[v].n,
        };
      }
    }
    if (out.sharp05 && out.sharp10) break;
  }
  return out;
}

function main() {
  const docs = loadProbeDocs();
  console.log(`probe docs: ${docs.length}`);
  const byContent = {};
  for (const doc of docs) {
    for (const src of doc.sources) {
      byContent[src.name] = { doc, src };
    }
  }
  const results = {};
  for (const ds of DATASETS) {
    const hit = byContent[ds.content];
    if (!hit) { console.log(`THIẾU probe cho ${ds.key}`); results[ds.key] = { missing: true }; continue; }
    const { doc } = hit;
    const W = ds.projW, H = ds.projH;
    const snaps = doc.snaps[ds.content];
    const vw = snaps.plain.w, vh = snaps.plain.h;
    const S3 = {};
    for (const v of ["plain", "sharp05", "sharp10"]) S3[v] = Buffer.from(snaps[v].rgbB64, "base64");
    const dd = doc.directDraws[ds.content];
    const S0 = Buffer.from(dd.plain.native.rgbB64, "base64"); // video->canvas native (plain variant)
    const Bview = Buffer.from(dd.plain.viewport.rgbB64, "base64"); // video->viewport trực tiếp
    const Rff = ds.render ? fs.readFileSync(path.join(ds.render, "fullrgb-plain.raw")) : null;
    const eff = {};
    for (const v of ["sharp05", "sharp10"]) {
      const e = effectFrames(doc.hookDumps[ds.content][v], W, H)[v];
      if (e) eff[v] = e;
    }
    const r = { key: ds.key, viewport: `${vw}x${vh}`, scale: snaps.plain.rect.scale };
    // A. base decode
    if (Rff) {
      r.A_baseMad_S0_vs_Rff = mad(S0, Rff);
      r.A_baseMad_perChannel = madPerChannel(S0, Rff);
      r.A_fracPixelsDiffer_S0_Rff = +(Array.from({ length: W * H }, (_, i) => (Math.abs(S0[i * 3] - Rff[i * 3]) > 0 ? 1 : 0)).reduce((a, b) => a + b, 0) / (W * H)).toFixed(3);
    }
    // B. effect-in vs direct native
    for (const v of ["sharp05", "sharp10"]) {
      if (eff[v]) r[`B_S1_vs_S0_${v}`] = mad(eff[v].in, S0);
    }
    // C. sharpen trong trang vs model bundle (trên đúng S1 của Chrome)
    for (const [v, inten] of [["sharp05", 0.5], ["sharp10", 1]]) {
      if (!eff[v]) continue;
      const model = sharpenRgb(eff[v].in, W, H, inten);
      r[`C_S2_vs_modelSharpen_${v}`] = mad(eff[v].out, model);
      const dChrome = deltaOf(Float64Array.from(eff[v].out), Float64Array.from(eff[v].in));
      const dModel = deltaOf(Float64Array.from(model), Float64Array.from(eff[v].in));
      r[`C_deltaEnergy_chrome_${v}`] = Math.round(sumAbs(dChrome));
      r[`C_deltaEnergy_model_${v}`] = Math.round(sumAbs(dModel));
      r[`C_deltaEnergy_ratio_${v}`] = +(sumAbs(dChrome) / Math.max(1, sumAbs(dModel))).toFixed(3);
      r[`C_deltaMad_chrome_vs_model_${v}`] = deltaMad(dChrome, dModel);
    }
    // D. composite / plain chain (Mitchell). QUAN TRỌNG (L5): app vẽ với
    // scale = rect.scale = min(cw/W, ch/H) = 1.2638889 (giới hạn bởi chiều
    // cao), KHÔNG phải vw/W = 809/640 = 1.2640625 — model cũ dùng nhầm
    // thang nên lệch tới ~0,09px ở biên phải (đủ phá lineart 1px).
    // Dùng đúng thang rect.scale cho mọi so sánh với S3; Bview (draw trực
    // tiếp đúng 809×455) vẫn so với thang 809/640.
    const sc = snaps.plain.rect.scale;
    // App căn giữa project trong canvas: nội dung bắt đầu ở
    // xOff=(vw-W*sc)/2 device-px -> phiX=-xOff/sc (nguồn-px). Dọc khớp
    // đúng (vh=H*sc) nên phiY=0.
    const phiX = -((vw - W * sc) / 2) / sc;
    r.D_rectScale = sc;
    r.D_centerPhiX = +phiX.toFixed(4);
    const mitS0 = resampleRgbRound(S0, W, H, vw, vh, sc, sc, phiX, 0);
    r.D_plain_S3_vs_Mitchell_S0_rectScalePhi = mad(S3.plain, mitS0);
    r.D_plain_S3_vs_Mitchell_S0_rectScaleNoPhi = mad(S3.plain, resampleRgbRound(S0, W, H, vw, vh, sc, sc));
    r.D_plain_S3_vs_Mitchell_S0_oldScale = mad(S3.plain, resampleRgbRound(S0, W, H, vw, vh));
    r.D_plain_S3_vs_directViewport = mad(S3.plain, Bview);
    r.D_directViewport_vs_Mitchell_S0 = mad(Bview, resampleRgbRound(S0, W, H, vw, vh));
    for (const v of ["sharp05", "sharp10"]) {
      if (!eff[v]) continue;
      const mitS2 = resampleRgbRound(eff[v].out, W, H, vw, vh, sc, sc, phiX, 0);
      r[`D_sharp_S3_vs_Mitchell_S2_${v}_rectScalePhi`] = mad(S3[v], mitS2);
      r[`D_sharp_S3_vs_Mitchell_S2_${v}_rectScaleNoPhi`] = mad(S3[v], resampleRgbRound(eff[v].out, W, H, vw, vh, sc, sc));
      r[`D_sharp_S3_vs_Mitchell_S2_${v}_oldScale`] = mad(S3[v], resampleRgbRound(eff[v].out, W, H, vw, vh));
    }
    // E. phần dư then chốt: dp_prev vs Mitchell(delta_effect thật)
    for (const v of ["sharp05", "sharp10"]) {
      if (!eff[v]) continue;
      const dpPrev = deltaOf(Float64Array.from(S3[v]), Float64Array.from(S3.plain));
      const sc = snaps.plain.rect.scale;
      const phiX = -((vw - W * sc) / 2) / sc;
      const mitS2f = resampleRgbFloat(eff[v].out, W, H, vw, vh, sc, sc, phiX, 0);
      const mitS1f = resampleRgbFloat(eff[v].in, W, H, vw, vh, sc, sc, phiX, 0);
      const modelDpRealBase = deltaOf(mitS2f, mitS1f);
      r[`E_dpPrev_meanAbs_${v}`] = meanAbs(dpPrev);
      r[`E_modelDpRealBase_meanAbs_${v}`] = meanAbs(modelDpRealBase);
      r[`E_energyRatio_dpPrev_over_modelDp_${v}`] = +(sumAbs(dpPrev) / Math.max(1, sumAbs(modelDpRealBase))).toFixed(3);
      r[`E_residualDeltaMad_${v}`] = deltaMad(dpPrev, modelDpRealBase);
      // Đối chứng: model cũ dùng R_ff làm base (cách J7/K6)
      if (Rff) {
        const inten = v === "sharp05" ? 0.5 : 1;
        const modelSharp = sharpenRgb(Rff, W, H, inten);
        const mitModel = resampleRgbFloat(modelSharp, W, H, vw, vh, sc, sc, phiX, 0);
        const mitBase = resampleRgbFloat(Rff, W, H, vw, vh, sc, sc, phiX, 0);
        r[`E_residualDeltaMad_oldBaseRff_${v}`] = deltaMad(dpPrev, deltaOf(mitModel, mitBase));
      }
    }
    // G. fit kernel + pha cho khâu upscale video (chỉ khi có S0/Bview)
    const gFit = {};
    for (const [kname, kfn] of Object.entries(KERNELS)) {
      gFit[`G_Bview_vs_${kname}_S0`] = mad(Bview, resampleRgbKernelRound(S0, W, H, vw, vh, kfn));
      gFit[`G_S3plain_vs_${kname}_S0`] = mad(S3.plain, resampleRgbKernelRound(S0, W, H, vw, vh, kfn));
    }
    for (const v of ["sharp10"]) {
      if (!eff[v]) continue;
      for (const [kname, kfn] of Object.entries(KERNELS)) {
        gFit[`G_S3sharp_vs_${kname}_S2_${v}`] = mad(S3[v], resampleRgbKernelRound(eff[v].out, W, H, vw, vh, kfn));
      }
    }
    // Pha: quét phi chung 2 trục cho kernel tốt nhất của Bview và S3sharp.
    const bestK = Object.entries(KERNELS).reduce((best, [kname, kfn]) => {
      const m = mad(Bview, resampleRgbKernelRound(S0, W, H, vw, vh, kfn));
      return m < best.m ? { kname, kfn, m } : best;
    }, { kname: "", kfn: null, m: Infinity });
    gFit.G_bestKernel_Bview = bestK.kname;
    for (const phi of [-0.5, -0.375, -0.25, -0.125, 0, 0.125, 0.25, 0.375, 0.5]) {
      const f = resampleRgbPhi(S0, W, H, vw, vh, bestK.kfn, phi, phi);
      gFit[`G_Bview_phi_${phi}_vs_${bestK.kname}`] = deltaMad(Float64Array.from(Bview), f);
      const fM = resampleRgbPhi(S0, W, H, vw, vh, chromeUpscaleKernel, phi, phi);
      gFit[`G_Bview_phi_${phi}_vs_mitchell`] = deltaMad(Float64Array.from(Bview), fM);
      if (eff.sharp10) {
        const fS = resampleRgbPhi(eff.sharp10.out, W, H, vw, vh, chromeUpscaleKernel, phi, phi);
        gFit[`G_S3sharp10_phi_${phi}_vs_mitchell`] = deltaMad(Float64Array.from(S3.sharp10), fS);
      }
    }
    // Lệch nguyên-pixel giữa S3_plain và Bview (kiểm tra rect rounding).
    for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
      gFit[`G_S3plain_vs_Bview_shift_${dx}_${dy}`] = madShifted(S3.plain, Bview, vw, vh, dx, dy);
    }
    Object.assign(r, gFit);
    if (ds.baselineTriSharp10) r.baselineTriSharp10_K6 = ds.baselineTriSharp10;
    // F. bt709 vs bt601 (chỉ nội dung màu — textsmall640)
    if (ds.content === "textsmall640") {
      for (const [v, inten] of [["sharp05", 0.5], ["sharp10", 1]]) {
        if (!eff[v]) continue;
        const m709 = sharpenRgb(eff[v].in, W, H, inten);
        const m601 = sharpen601Rgb(eff[v].in, W, H, inten);
        r[`F_sharpen709_vs_601_deltaMad_${v}`] = deltaMad(
          deltaOf(Float64Array.from(m709), Float64Array.from(eff[v].in)),
          deltaOf(Float64Array.from(m601), Float64Array.from(eff[v].in)));
        const scF = snaps.plain.rect.scale;
        const phiXF = -((vw - W * scF) / 2) / scF;
        const f709 = resampleRgbRound(m709, W, H, vw, vh, scF, scF, phiXF, 0);
        const f601 = resampleRgbRound(m601, W, H, vw, vh, scF, scF, phiXF, 0);
        r[`F_final709_vs_S3_${v}`] = mad(S3[v], f709);
        r[`F_final601_vs_S3_${v}`] = mad(S3[v], f601);
        r[`F_final709_vs_601_${v}`] = mad(f709, f601);
        // dp theo từng ma trận so với dp_prev
        const dpPrev = deltaOf(Float64Array.from(S3[v]), Float64Array.from(S3.plain));
        r[`F_deltaMad_709_${v}`] = deltaMad(dpPrev, deltaOf(resampleRgbFloat(m709, W, H, vw, vh, scF, scF, phiXF, 0), resampleRgbFloat(eff[v].in, W, H, vw, vh, scF, scF, phiXF, 0)));
        r[`F_deltaMad_601_${v}`] = deltaMad(dpPrev, deltaOf(resampleRgbFloat(m601, W, H, vw, vh, scF, scF, phiXF, 0), resampleRgbFloat(eff[v].in, W, H, vw, vh, scF, scF, phiXF, 0)));
      }
    }
    results[ds.key] = r;
    console.log(`--- ${ds.key} ---`);
    console.log(JSON.stringify(r, null, 1));
  }
  writeFileEpermRetry(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  console.log(`ghi ${OUT}`);
}
main();
