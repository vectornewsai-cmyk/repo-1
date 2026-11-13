#!/usr/bin/env node
/**
 * r74b1-followup.mjs — Phase 9 đợt 74, luồng B1, follow-up sau phân tích chính:
 *  (D) ocean noise05: phân rã delta G theo bin plainAbsDiff (định nghĩa A3:
 *      mean |previewPlain - renderPlain| theo 3 kênh, biên [0,1,2,4,8,256])
 *      ở MỌI điểm quét s — xem excess ở bin xấu nhất biến mất hay chỉ thu
 *      hẹp khi s tăng qua ngưỡng 0,382 -> 0,521;
 *  (A2) probe gradient 1920x1080 ở w1440: cùng 5 dải gradient nhưng video
 *      1920x1080 nên preview phải pre-downscale 1920->1280 TRƯỚC khi cộng
 *      noise — kiểm tra nghi phạm pre-downscale. Plain render-P dùng frame
 *      đã decode + scale bilinear về 1280x720 (gradient1920-f30-1280.rgb).
 *
 * Hàm YUV/addYuvNoise/maskedChannelStats sao chép VERBATIM từ
 * r74b1-analyze.mjs (gốc r73a3-d0cond.mjs / effectCanvas.ts).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r74b1-followup.mjs
 * Env: R74B1_FOLLOWUP_OUT (mặc định hidden_files/round74-b1/r74b1-followup.json).
 * Exit 0 khi xong. KHÔNG push/tag/binary/workflow.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const B1 = path.join(GOAL, "round74-b1");
const Y2 = path.join(GOAL, "round71-y2");
const OUT = process.env.R74B1_FOLLOWUP_OUT || path.join(B1, "r74b1-followup.json");
const PREVIEW_SEED_LOCALT1 = (0x9e3779b9 ^ 30) >>> 0;
const b64ToRgb = (b64) => Buffer.from(b64, "base64");

function rgbToYuv709_70x6(r, g, b) {
  const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const y = 16 + 219 * yl;
  const cb = 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.0722);
  const cr = 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.2126);
  return [y, cb, cr];
}
function yuv709ToRgb_70x6(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.79274 * (cr - 128), yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128), yy + 2.1122 * (cb - 128)];
}
function estimateNativeChroma_70x6(derived, k) {
  const e = 128 + k * (derived - 128);
  return e < 16 ? 16 : e > 240 ? 240 : e;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussianGenerator(rnd) {
  let spare = null;
  return () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0;
    while (u === 0) u = rnd();
    const v = rnd();
    const m = Math.sqrt(-2 * Math.log(u));
    spare = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  };
}
function addYuvNoiseRgb24(rgb, w, h, strength, seed) {
  const sigma = strength / Math.sqrt(3);
  const gauss = gaussianGenerator(mulberry32(seed));
  const cw = (w + 1) >> 1, ch = (h + 1) >> 1;
  const Y = new Float64Array(w * h), CB = new Float64Array(w * h), CR = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const p = i * 3;
    const [yy, cb, cr] = rgbToYuv709_70x6(rgb[p], rgb[p + 1], rgb[p + 2]);
    Y[i] = yy; CB[i] = cb; CR[i] = cr;
  }
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  const cbNoise = new Float64Array(cw * ch), crNoise = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= w || y >= h) continue;
      const i = y * w + x;
      sCb += CB[i]; sCr += CR[i]; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma_70x6(sCb / n, 1.04);
    estCr[i] = estimateNativeChroma_70x6(sCr / n, 1.12);
    cbNoise[i] = gauss() * sigma;
    crNoise[i] = gauss() * sigma;
  }
  const out = Buffer.alloc(w * h * 3);
  const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const ny = Math.min(255, Math.max(0, Y[i] + gauss() * sigma));
    const ncb = Math.min(255, Math.max(0, estCb[ci] + cbNoise[ci]));
    const ncr = Math.min(255, Math.max(0, estCr[ci] + crNoise[ci]));
    const [r, g, b] = yuv709ToRgb_70x6(ny, ncb, ncr);
    out[p] = clamp255(r); out[p + 1] = clamp255(g); out[p + 2] = clamp255(b);
  }
  return out;
}
function maskedChannelStats(d, mask) {
  const n = mask.length;
  let cnt = 0;
  for (let p = 0; p < n; p++) if (mask[p]) cnt++;
  const out = { n: cnt, std: [], kurt: [] };
  if (cnt === 0) return out;
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let p = 0; p < n; p++) if (mask[p]) s += d[p * 3 + c];
    mean[c] = s / cnt;
  }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let p = 0; p < n; p++) {
      if (!mask[p]) continue;
      const v = d[p * 3 + c] - mean[c];
      s2 += v * v; s4 += v * v * v * v;
    }
    const std = Math.sqrt(s2 / cnt);
    out.std.push(+std.toFixed(2));
    out.kurt.push(std > 0 ? +(s4 / cnt / (std ** 4) - 3).toFixed(2) : 0);
  }
  return out;
}
function absMad(a, b) {
  const n = a.length / 3;
  let sum = 0;
  for (let p = 0; p < n; p++) for (let c = 0; c < 3; c++) sum += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
  return +(sum / (n * 3)).toFixed(3);
}

function collectOceanPoints() {
  const pts = [];
  const dirs = fs.readdirSync(B1).filter((d) => d.startsWith("headed-w") && fs.statSync(path.join(B1, d)).isDirectory()).sort();
  for (const dir of dirs) {
    for (const f of fs.readdirSync(path.join(B1, dir)).filter((x) => x.startsWith("r74b1-snaps-"))) {
      const doc = JSON.parse(fs.readFileSync(path.join(B1, dir, f), "utf8"));
      if (doc.snaps?.ocean?.plain && doc.snaps?.ocean?.noise05) pts.push({ source: "B1", window: doc.window, doc });
    }
  }
  for (const w of ["w1440", "w1920"]) {
    const doc = JSON.parse(fs.readFileSync(path.join(Y2, `headed-${w}`, `r71y2-snaps-${w}.json`), "utf8"));
    pts.push({ source: "Y2", window: doc.window, doc });
  }
  // Khử trùng điểm cùng (source, window, rect) — w1600x900 trùng w1440x900.
  const seen = new Set();
  return pts.filter((p) => {
    const k = `${p.source}|${p.window}|${p.doc.snaps.ocean.plain.w}x${p.doc.snaps.ocean.plain.h}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function main() {
  const report = { partD: {}, partA2: {} };
  const oceanPlain = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
  const oceanNoise05 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw"));

  // ================= PART D: bin plainAbsDiff theo s =================
  const EDGES = [0, 1, 2, 4, 8, 256];
  const points = collectOceanPoints().sort((a, b) => a.doc.snaps.ocean.plain.rect.scale - b.doc.snaps.ocean.plain.rect.scale);
  report.partD.points = [];
  for (const { source, window, doc } of points) {
    const v = doc.snaps.ocean;
    const vw = v.plain.w, vh = v.plain.h;
    const s = v.plain.rect.scale;
    const prevPlain = b64ToRgb(v.plain.rgbB64);
    const prevNoise = b64ToRgb(v.noise05.rgbB64);
    const rp = resampleRgb24Trilinear(oceanPlain, 1280, 720, vw, vh);
    const rn = resampleRgb24Trilinear(oceanNoise05, 1280, 720, vw, vh);
    const n = vw * vh;
    const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
    const plainAbs = new Float64Array(n);
    for (let p = 0; p < n; p++) {
      let sum = 0;
      for (let c = 0; c < 3; c++) {
        dP[p * 3 + c] = prevNoise[p * 3 + c] - prevPlain[p * 3 + c];
        dR[p * 3 + c] = rn[p * 3 + c] - rp[p * 3 + c];
        sum += Math.abs(prevPlain[p * 3 + c] - rp[p * 3 + c]);
      }
      plainAbs[p] = sum / 3;
    }
    const bins = [];
    for (let b = 0; b < EDGES.length - 1; b++) {
      const mask = new Uint8Array(n);
      for (let p = 0; p < n; p++) if (plainAbs[p] >= EDGES[b] && plainAbs[p] < EDGES[b + 1]) mask[p] = 1;
      const pS = maskedChannelStats(dP, mask);
      const rS = maskedChannelStats(dR, mask);
      bins.push({
        bin: `[${EDGES[b]},${EDGES[b + 1]})`, frac: +(pS.n / n).toFixed(3),
        previewStdG: pS.std[1], previewKurtG: pS.kurt[1],
        renderStdG: rS.std[1], renderKurtG: rS.kurt[1],
      });
    }
    report.partD.points.push({ source, window, vw, vh, s: +s.toFixed(4), bins });
    const worst = bins[bins.length - 1];
    console.log(`  D ${source} ${window} s=${s.toFixed(4)}: worst-bin frac=${worst.frac} prevStdG=${worst.previewStdG} renderStdG=${worst.renderStdG} prevKurtG=${worst.previewKurtG} | all-prevStdG=[${bins.map((x) => x.previewStdG).join(", ")}] all-renderStdG=[${bins.map((x) => x.renderStdG).join(", ")}]`);
  }

  // ================= PART A2: gradient 1920x1080 @ w1440 =================
  const grad1920Frame = fs.readFileSync(path.join(B1, "media", "gradient1920-f30-1280.rgb"));
  const gradNativeFrame = fs.readFileSync(path.join(B1, "media", "gradient-f30.rgb"));
  let doc1920 = null;
  for (const dir of fs.readdirSync(B1).filter((d) => d.startsWith("headed-w") && fs.statSync(path.join(B1, d)).isDirectory()).sort()) {
    for (const f of fs.readdirSync(path.join(B1, dir)).filter((x) => x.startsWith("r74b1-snaps-"))) {
      const d = JSON.parse(fs.readFileSync(path.join(B1, dir, f), "utf8"));
      if (d.window === "w1440x900" && d.snaps?.gradient1920) doc1920 = d;
    }
  }
  if (!doc1920) { console.log("A2: thiếu snapshot gradient1920 w1440x900 — bỏ qua"); }
  else {
    const variants = doc1920.snaps.gradient1920;
    const vw = variants.plain.w, vh = variants.plain.h;
    const s = variants.plain.rect.scale;
    const prevPlain = b64ToRgb(variants.plain.rgbB64);
    const prevNoise = b64ToRgb(variants.noise05.rgbB64);
    const renderPlainTri = resampleRgb24Trilinear(grad1920Frame, 1280, 720, vw, vh);
    const plainMad = absMad(prevPlain, renderPlainTri);
    const plainMadVsNative = absMad(prevPlain, resampleRgb24Trilinear(gradNativeFrame, 1280, 720, vw, vh));
    const noiseP_same = addYuvNoiseRgb24(grad1920Frame, 1280, 720, 28, PREVIEW_SEED_LOCALT1);
    const noiseP_12345 = addYuvNoiseRgb24(grad1920Frame, 1280, 720, 28, 12345);
    const renderNoiseSame = resampleRgb24Trilinear(noiseP_same, 1280, 720, vw, vh);
    const renderNoise12345 = resampleRgb24Trilinear(noiseP_12345, 1280, 720, vw, vh);
    const n = vw * vh;
    const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3), dR2 = new Float64Array(n * 3);
    for (let i = 0; i < n * 3; i++) {
      dP[i] = prevNoise[i] - prevPlain[i];
      dR[i] = renderNoiseSame[i] - renderPlainTri[i];
      dR2[i] = renderNoise12345[i] - renderPlainTri[i];
    }
    const BANDS = [
      { name: "A_flat", y0: 0, y1: 144, grad: "~0" },
      { name: "B_ramp", y0: 144, y1: 288, grad: "~0.20/px" },
      { name: "C_sawtooth", y0: 288, y1: 432, grad: "~3.7/px" },
      { name: "D_checker", y0: 432, y1: 576, grad: "~50/px (1920-blur)" },
      { name: "E_sine", y0: 576, y1: 720, grad: "~49/px dọc" },
    ];
    const bands = {};
    for (const band of BANDS) {
      const y0 = Math.floor(band.y0 * vh / 720), y1 = Math.min(vh, Math.ceil(band.y1 * vh / 720));
      const mask = new Uint8Array(n);
      for (let y = y0; y < y1; y++) for (let x = 0; x < vw; x++) mask[y * vw + x] = 1;
      const p = maskedChannelStats(dP, mask);
      const r = maskedChannelStats(dR, mask);
      const r2 = maskedChannelStats(dR2, mask);
      bands[band.name] = {
        grad: band.grad, n: p.n,
        previewStd: p.std, previewKurt: p.kurt,
        renderPSameSeedStd: r.std, renderPSameSeedKurt: r.kurt,
        renderP12345Std: r2.std,
        varRatioG_sameSeed: +(p.std[1] ** 2 / r.std[1] ** 2).toFixed(2),
      };
      console.log(`  A2 w1440 s=${s.toFixed(3)} ${band.name} (${band.grad}): prevStdG=${p.std[1]} renderP-stdG=${r.std[1]} (seed12345 ${r2.std[1]}) varRatioG=${bands[band.name].varRatioG_sameSeed} prevKurtG=${p.kurt[1]} renderKurtG=${r.kurt[1]}`);
    }
    // Bin theo |gradient| viewport của preview plain (như Part A).
    const gradBins = [[0, 0.5], [0.5, 2], [2, 8], [8, 32], [32, 256]];
    const gradBinOut = [];
    for (const [lo, hi] of gradBins) {
      const mask = new Uint8Array(n);
      for (let y = 1; y < vh - 1; y++) for (let x = 1; x < vw - 1; x++) {
        const p = (y * vw + x) * 3 + 1;
        const gx = Math.abs(prevPlain[p + 3] - prevPlain[p - 3]) / 2;
        if (gx >= lo && gx < hi) mask[y * vw + x] = 1;
      }
      const p = maskedChannelStats(dP, mask);
      const r = maskedChannelStats(dR, mask);
      gradBinOut.push({ gradRange: [lo, hi], n: p.n, previewStdG: p.std[1], renderPStdG: r.std[1], varRatioG: p.n ? +(p.std[1] ** 2 / r.std[1] ** 2).toFixed(2) : null, previewKurtG: p.kurt[1] });
      console.log(`  A2 gradBin [${lo},${hi}): n=${p.n} prevStdG=${p.std[1]} renderPStdG=${r.std[1]} varRatioG=${gradBinOut.at(-1).varRatioG} prevKurtG=${p.kurt[1]}`);
    }
    report.partA2 = {
      window: "w1440x900", vw, vh, s: +s.toFixed(4),
      plainAbsMadVsDownscaled1920: plainMad, plainAbsMadVsNative1280: plainMadVsNative,
      rawHash: doc1920.rawFrames?.gradient1920?.plain?.hash || null,
      bands, gradBins: gradBinOut,
    };
    console.log(`  A2: plainAbsMad vs 1920-downscaled=${plainMad} vs native-1280=${plainMadVsNative}`);
  }

  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON follow-up: ${OUT}`);
}

main().catch((e) => { console.error(`B1 FOLLOWUP LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
