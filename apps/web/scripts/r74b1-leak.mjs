#!/usr/bin/env node
/**
 * r74b1-leak.mjs — Phase 9 đợt 74, luồng B1, kiểm chứng giả thuyết RÒ PLAIN:
 * khi clip KHÔNG có canvas effect, preview vẽ thẳng video element xuống
 * viewport (1 bước: 1920x1080 -> 489x275); khi CÓ effect (noise), video
 * phải qua effect canvas 1920->1280 rồi mới xuống viewport (2 bước).
 * Delta preview do đó chứa số hạng rò plain L = D2(D1(V)) - D_main(V)
 * mà render không có. Xấp xỉ L ≈ -(previewPlain - renderPlainTri) và
 * kiểm tra: (dP - dR_sameSeed) có tương quan mạnh với -plainDiff, slope
 * ≈ 1, ở dải tần cao không? (dP/dR cùng seed preview như r74b1-corr.)
 *
 * Chạy: node apps/web/scripts/r74b1-leak.mjs (từ gốc repo).
 * JSON: hidden_files/round74-b1/r74b1-leak.json. KHÔNG push/tag/binary.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const B1 = path.join(GOAL, "round74-b1");
const OUT = path.join(B1, "r74b1-leak.json");
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

function findDoc(window, source) {
  for (const dir of fs.readdirSync(B1).filter((d) => d.startsWith("headed-w") && fs.statSync(path.join(B1, d)).isDirectory()).sort()) {
    for (const f of fs.readdirSync(path.join(B1, dir)).filter((x) => x.startsWith("r74b1-snaps-"))) {
      const d = JSON.parse(fs.readFileSync(path.join(B1, dir, f), "utf8"));
      if (d.window === window && d.snaps?.[source]) return d;
    }
  }
  return null;
}

/** corr + slope của X=(dP-dR) theo Y=(-plainDiff) trong dải, kênh ch. */
function corrSlope(X, Y, vw, vh, y0, y1, ch) {
  let n = 0, mX = 0, mY = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < vw; x++) { const p = y * vw + x; mX += X[p * 3 + ch]; mY += Y[p * 3 + ch]; n++; }
  mX /= n; mY /= n;
  let sXX = 0, sYY = 0, sXY = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < vw; x++) {
    const p = y * vw + x;
    const a = X[p * 3 + ch] - mX, b = Y[p * 3 + ch] - mY;
    sXX += a * a; sYY += b * b; sXY += a * b;
  }
  const corr = sXX > 0 && sYY > 0 ? sXY / Math.sqrt(sXX * sYY) : 0;
  const slope = sYY > 0 ? sXY / sYY : 0; // X ~ slope * Y
  return { n, corr: +corr.toFixed(3), slope: +slope.toFixed(2), stdX: +Math.sqrt(sXX / n).toFixed(2), stdY: +Math.sqrt(sYY / n).toFixed(2) };
}

async function main() {
  const BANDS = [
    { name: "A_flat", y0: 0, y1: 144 },
    { name: "B_ramp", y0: 144, y1: 288 },
    { name: "C_sawtooth", y0: 288, y1: 432 },
    { name: "D_checker", y0: 432, y1: 576 },
    { name: "E_sine", y0: 576, y1: 720 },
  ];
  const CASES = [
    { label: "gradient-native-1280", source: "gradient", plainFile: "gradient-f30.rgb" },
    { label: "gradient-1920", source: "gradient1920", plainFile: "gradient1920-f30-1280.rgb" },
  ];
  const report = {};
  for (const c of CASES) {
    const doc = findDoc("w1440x900", c.source);
    if (!doc) { console.log(`${c.label}: thiếu snapshot — bỏ qua`); continue; }
    const variants = doc.snaps[c.source];
    const vw = variants.plain.w, vh = variants.plain.h;
    const prevPlain = b64ToRgb(variants.plain.rgbB64);
    const prevNoise = b64ToRgb(variants.noise05.rgbB64);
    const plainFrame = fs.readFileSync(path.join(B1, "media", c.plainFile));
    const renderPlainTri = resampleRgb24Trilinear(plainFrame, 1280, 720, vw, vh);
    const noiseP = addYuvNoiseRgb24(plainFrame, 1280, 720, 28, PREVIEW_SEED_LOCALT1);
    const renderNoiseTri = resampleRgb24Trilinear(noiseP, 1280, 720, vw, vh);
    const n = vw * vh;
    // X = dP - dR (phần dư preview sau khi trừ replica-noise);
    // Y = -(previewPlain - renderPlainTri) = xấp xỉ số hạng rò plain L.
    const X = new Float64Array(n * 3), Y = new Float64Array(n * 3);
    for (let i = 0; i < n * 3; i++) {
      X[i] = (prevNoise[i] - prevPlain[i]) - (renderNoiseTri[i] - renderPlainTri[i]);
      Y[i] = -(prevPlain[i] - renderPlainTri[i]);
    }
    report[c.label] = { vw, vh, bands: {} };
    console.log(`\n== LEAK ${c.label} w1440 s=0.382: X=(dP-dR) vs Y=-(plain-preview - plain-renderTri) ==`);
    for (const band of BANDS) {
      const y0 = Math.floor(band.y0 * vh / 720), y1 = Math.min(vh, Math.ceil(band.y1 * vh / 720));
      const g = corrSlope(X, Y, vw, vh, y0, y1, 1);
      const r = corrSlope(X, Y, vw, vh, y0, y1, 0);
      report[c.label].bands[band.name] = { G: g, R: r };
      console.log(`  ${band.name}: G corr=${g.corr} slope=${g.slope} stdX=${g.stdX} stdY=${g.stdY} | R corr=${r.corr} slope=${r.slope} stdX=${r.stdX} stdY=${r.stdY}`);
    }
    const allG = corrSlope(X, Y, vw, vh, 0, vh, 1);
    report[c.label].allG = allG;
    console.log(`  ALL G: corr=${allG.corr} slope=${allG.slope} stdX=${allG.stdX} stdY=${allG.stdY}`);
  }
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON leak: ${OUT}`);
}

main().catch((e) => { console.error(`B1 LEAK LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
