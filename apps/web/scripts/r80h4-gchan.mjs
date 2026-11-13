#!/usr/bin/env node
/**
 * r80h4-gchan.mjs — Phase 9 đợt 80, luồng H4: ĐIỀU TRA kênh G của
 * test-pattern (nợ F7 §5.4, G6 §6.4): vì sao d0std_G ~4,4 ở mọi cửa sổ
 * trong khi d0std_R ~1,1–1,2, d0std_B ~0,6–0,7 — và liệu cổng chỉ dùng
 * kênh R có mù tín hiệu thật ở kênh G không.
 *
 * PHƯƠNG PHÁP (tính toán thuần túy từ frame render plain 1280x720, không
 * capture): d0 = resample(shifted) − resample(plain); shifted chỉ khác
 * plain ở chroma (Y giữ nguyên, Cb/Cr thay bằng trung bình khối 2×2
 * scale kCb=1,04 / kCr=1,12). Vì Y không đổi:
 *   d0_R ≈ 1,79274·ΔCr,  d0_G ≈ −0,21325·ΔCb − 0,53282·ΔCr,
 *   d0_B ≈ 2,1122·ΔCb   (trước resample; resample trộn thêm).
 * Script đo:
 *  1. ΔCb, ΔCr (est − derived) theo từng pixel: std, phân vị, histogram.
 *  2. d0 với chỉ-Cb-shift (kCr=1,0) và chỉ-Cr-shift (kCb=1,0): d0std
 *     từng kênh → tách đóng góp Cb vs Cr vào d0std_G.
 *  3. Đóng góp theo vùng: chia frame thành lưới 8×4, std ΔCb/ΔCr và
 *     mean |d0_G| từng ô → vùng nào (sọc màu? nền?) tạo ra G lớn.
 *  4. Đối chứng ocean/basgo/slovenska: cùng phép đo để xem G bất thường
 *     có phải riêng test-pattern không.
 *
 * JSON: hidden_files/round80-h4/r80h4-gchan.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import helpers).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { channelStats, rgbToYuv709_70x6, yuv709ToRgb_70x6, estimateNativeChroma_70x6 } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const H4 = path.join(GOAL, "round80-h4");
fs.mkdirSync(H4, { recursive: true });
const OUT = path.join(H4, "r80h4-gchan.json");
const W = 1280, H = 720;

function estShiftFrameVariant(rgb, srcW, srcH, kCb, kCr) {
  const out = Buffer.alloc(srcW * srcH * 3);
  const cw = (srcW + 1) >> 1, ch = (srcH + 1) >> 1;
  const Y = new Float64Array(srcW * srcH), CB = new Float64Array(srcW * srcH), CR = new Float64Array(srcW * srcH);
  for (let i = 0; i < srcW * srcH; i++) {
    const p = i * 3;
    const [yy, cb, cr] = rgbToYuv709_70x6(rgb[p], rgb[p + 1], rgb[p + 2]);
    Y[i] = yy; CB[i] = cb; CR[i] = cr;
  }
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= srcW || y >= srcH) continue;
      const i = y * srcW + x;
      sCb += CB[i]; sCr += CR[i]; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma_70x6(sCb / n, kCb);
    estCr[i] = estimateNativeChroma_70x6(sCr / n, kCr);
  }
  const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let y = 0; y < srcH; y++) for (let x = 0; x < srcW; x++) {
    const i = y * srcW + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const [r, g, b] = yuv709ToRgb_70x6(Y[i], estCb[ci], estCr[ci]);
    out[p] = clamp255(r); out[p + 1] = clamp255(g); out[p + 2] = clamp255(b);
  }
  return out;
}

function delta0For(rgb, vw, vh, kCb, kCr) {
  const shifted = estShiftFrameVariant(rgb, W, H, kCb, kCr);
  const a = resampleRgb24Trilinear(rgb, W, H, vw, vh);
  const b = resampleRgb24Trilinear(shifted, W, H, vw, vh);
  const d0 = new Int16Array(vw * vh * 3);
  for (let i = 0; i < vw * vh * 3; i++) d0[i] = b[i] - a[i];
  return channelStats(Float64Array.from(d0)).std;
}

function chromaDeltaStats(rgb) {
  // ΔCb, ΔCr từng pixel (est − derived, k đầy đủ 1,04/1,12).
  const cw = (W + 1) >> 1, ch = (H + 1) >> 1;
  const dCb = new Float64Array(W * H), dCr = new Float64Array(W * H);
  const Cb = new Float64Array(W * H), Cr = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const p = i * 3;
    const [, cb, cr] = rgbToYuv709_70x6(rgb[p], rgb[p + 1], rgb[p + 2]);
    Cb[i] = cb; Cr[i] = cr;
  }
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= W || y >= H) continue;
      const i = y * W + x;
      sCb += Cb[i]; sCr += Cr[i]; n++;
    }
    const eCb = estimateNativeChroma_70x6(sCb / n, 1.04);
    const eCr = estimateNativeChroma_70x6(sCr / n, 1.12);
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= W || y >= H) continue;
      const i = y * W + x;
      dCb[i] = eCb - Cb[i]; dCr[i] = eCr - Cr[i];
    }
  }
  const stats = (arr) => {
    const n = arr.length;
    let mean = 0; for (const v of arr) mean += v; mean /= n;
    let s2 = 0, s4 = 0, maxAbs = 0;
    for (const v of arr) { const d = v - mean; s2 += d * d; s4 += d * d * d * d; if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v); }
    const std = Math.sqrt(s2 / n);
    return { mean: +mean.toFixed(3), std: +std.toFixed(3), kurt: +(s4 / n / (std ** 4) - 3).toFixed(2), maxAbs: +maxAbs.toFixed(2) };
  };
  return { dCb: stats(dCb), dCr: stats(dCr), Cb: stats(Cb), Cr: stats(Cr), _dCb: dCb, _dCr: dCr };
}

function regionMap(dCb, dCr, cols = 8, rows = 4) {
  // mean |ΔCb|, mean |ΔCr| từng ô lưới → vùng nào tạo ra d0_G lớn.
  const out = [];
  const cw = Math.floor(W / cols), ch = Math.floor(H / rows);
  for (let ry = 0; ry < rows; ry++) {
    const row = [];
    for (let rx = 0; rx < cols; rx++) {
      let sCb = 0, sCr = 0, n = 0;
      for (let y = ry * ch; y < (ry + 1) * ch; y++) for (let x = rx * cw; x < (rx + 1) * cw; x++) {
        const i = y * W + x;
        sCb += Math.abs(dCb[i]); sCr += Math.abs(dCr[i]); n++;
      }
      row.push({ x: rx, y: ry, meanAbsDCb: +(sCb / n).toFixed(2), meanAbsDCr: +(sCr / n).toFixed(2) });
    }
    out.push(row);
  }
  return out;
}

async function main() {
  const frames = {
    "test-pattern": fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw")),
    ocean: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw")),
    basgo: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-basgo-plain.raw")),
    slovenska: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw")),
  };
  const out = { generated: new Date().toISOString(), frames: {} };
  for (const [label, rgb] of Object.entries(frames)) {
    console.log(`== ${label} ==`);
    const cs = chromaDeltaStats(rgb);
    console.log(`  ΔCb: ${JSON.stringify(cs.dCb)} | ΔCr: ${JSON.stringify(cs.dCr)}`);
    console.log(`  Cb gốc: std=${cs.Cb.std} mean=${cs.Cb.mean} | Cr gốc: std=${cs.Cr.std} mean=${cs.Cr.mean}`);
    // d0std ở rect 1129x635 (w2240) với 3 biến thể k.
    const d0full = delta0For(rgb, 1129, 635, 1.04, 1.12);
    const d0cbOnly = delta0For(rgb, 1129, 635, 1.04, 1.0);
    const d0crOnly = delta0For(rgb, 1129, 635, 1.0, 1.12);
    console.log(`  d0std 1129x635 đầy đủ (kCb=1,04,kCr=1,12): ${JSON.stringify(d0full)}`);
    console.log(`  d0std chỉ-Cb-shift (kCr=1,0): ${JSON.stringify(d0cbOnly)}`);
    console.log(`  d0std chỉ-Cr-shift (kCb=1,0): ${JSON.stringify(d0crOnly)}`);
    // Dự đoán tuyến tính từ hệ số YUV→RGB (chưa resample): d0_R≈1,793·ΔCr,
    // d0_G≈−0,213·ΔCb−0,533·ΔCr, d0_B≈2,112·ΔCb.
    const pred = {
      R: +(1.79274 * cs.dCr.std).toFixed(2),
      G: +Math.sqrt((0.21325 * cs.dCb.std) ** 2 + (0.53282 * cs.dCr.std) ** 2).toFixed(2),
      B: +(2.1122 * cs.dCb.std).toFixed(2),
    };
    console.log(`  dự đoán tuyến tính (từ std ΔCb/ΔCr, chưa resample): ${JSON.stringify(pred)}`);
    const regions = regionMap(cs._dCb, cs._dCr);
    console.log(`  vùng mean|ΔCb| lớn nhất: ${JSON.stringify([...regions.flat()].sort((a, b) => b.meanAbsDCb - a.meanAbsDCb).slice(0, 4))}`);
    out.frames[label] = {
      dCb: cs.dCb, dCr: cs.dCr, Cb: cs.Cb, Cr: cs.Cr,
      d0std1129x635: { full: d0full, cbOnly: d0cbOnly, crOnly: d0crOnly },
      linearPrediction: pred, regions,
    };
  }
  writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
  console.log(`\nJSON kênh G: ${OUT}`);
}
main().catch((e) => { console.error(`H4-GCHAN LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
