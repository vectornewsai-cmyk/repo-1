#!/usr/bin/env node
/**
 * r73a3-drift.mjs — Phase 9 đợt 73, luồng A3: kiểm tra giả thuyết TRÔI KHUNG
 * (frame drift) cho ocean w1440 noise05.
 *
 * Phát hiện từ r73a3-ocean-diag: đuôi nặng của preview delta G KHÔNG nằm
 * trong từng bin (kurt/bin ≈ 0,2–0,3, khớp render) mà là HỆ QUẢ TRỘN:
 * pixel có plainAbsDiff ≥ 8 (11% pixel) có preview std G 18,64 vs render
 * 8,61; trộn 3 thành phần std 9,0/10,5/18,6 cho kurt toàn cục ≈ 1,5 (đo
 * 1,35). Câu hỏi: phương sai thừa đó có phải là trôi khung — snapshot
 * noise05 chụp ở khung khác snapshot plain (video seek ±1 frame)?
 *
 * Kiểm tra (dùng khung gốc 1920 đã có sẵn ở round72-z2/native/):
 *  1. plain preview khớp khung gốc nào nhất (f23..f27)? Kỳ vọng f25.
 *  2. e = dP − dR có tương quan với trường trôi D = f(k+1) − f(k) không?
 *     Kỳ vọng: corr cao + std(e) ≈ std(D) theo bin plainAbsDiff nếu
 *     noise05 ở khung k+1 trong khi plain ở khung k.
 * D1/D2 của Y2 chỉ chứng minh lặp lại trong-cùng-variant (plain==plain2,
 * noise05==noise05b pixel-identical) — KHÔNG chứng minh plain và noise05
 * cùng khung.
 *
 * Chạy: node apps/web/scripts/r73a3-drift.mjs (từ gốc repo).
 * JSON: hidden_files/round73-a3/r73a3-drift.json. KHÔNG push/tag.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const Z2 = path.join(GOAL, "round72-z2");
const A3 = path.join(GOAL, "round73-a3");
const OUT = process.env.R73A3_DRIFT_OUT || path.join(A3, "r73a3-drift.json");
const b64ToRgb = (b64) => Buffer.from(b64, "base64");

function corrStd(a, b) {
  const n = a.length;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let va = 0, vb = 0, cov = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma, db = b[i] - mb;
    va += da * da; vb += db * db; cov += da * db;
  }
  const sa = Math.sqrt(va / n), sb = Math.sqrt(vb / n);
  return { corr: sa > 0 && sb > 0 ? +(cov / n / (sa * sb)).toFixed(3) : 0, stdA: +sa.toFixed(2), stdB: +sb.toFixed(2) };
}
function mad(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}

async function main() {
  const [vw, vh] = [489, 275];
  const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, "headed-w1440", "r71y2-snaps-w1440.json"), "utf8"));
  const v = snapsDoc.snaps.ocean;
  const prevPlain = b64ToRgb(v.plain.rgbB64);
  const prevNoise = b64ToRgb(v.noise05.rgbB64);
  const plainRgb = fs.readFileSync(path.join(Z2, "render-1k", "fullrgb-ocean-plain.raw"));
  const noiseRgb = fs.readFileSync(path.join(Z2, "render-1k", "fullrgb-ocean-noise05.raw"));
  const rp = resampleRgb24Trilinear(plainRgb, 1280, 720, vw, vh);
  const rn = resampleRgb24Trilinear(noiseRgb, 1280, 720, vw, vh);
  const n = vw * vh;

  // Khung gốc 1920 -> viewport trực tiếp (xấp xỉ 1 bước; đủ cho tương quan).
  const frames = {};
  for (const k of [23, 24, 25, 26, 27]) {
    const raw = fs.readFileSync(path.join(Z2, "native", `ocean-f${k}-1920.rgb`));
    frames[k] = resampleRgb24Trilinear(raw, 1920, 1080, vw, vh);
  }
  const report = { plainFrameMatch: {}, driftCorr: {}, driftBins: {} };
  console.log("== plain preview khớp khung gốc nào? (MAD viewport, trilinear 1 bước) ==");
  for (const k of [23, 24, 25, 26, 27]) {
    const m = mad(prevPlain, frames[k]);
    report.plainFrameMatch[`f${k}`] = m;
    console.log(`  f${k}: MAD=${m}`);
  }

  // e = dP - dR theo kênh; drift D(k,k+1) = f(k+1) - f(k).
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  const plainAbs = new Float64Array(n);
  for (let p = 0; p < n; p++) {
    let s = 0;
    for (let c = 0; c < 3; c++) {
      dP[p * 3 + c] = prevNoise[p * 3 + c] - prevPlain[p * 3 + c];
      dR[p * 3 + c] = rn[p * 3 + c] - rp[p * 3 + c];
      s += Math.abs(prevPlain[p * 3 + c] - rp[p * 3 + c]);
    }
    plainAbs[p] = s / 3;
  }
  const e = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) e[i] = dP[i] - dR[i];

  console.log("\n== corr(e, drift) toàn cục theo kênh ==");
  for (const [a, b] of [[24, 25], [25, 26], [23, 24], [26, 27]]) {
    const D = new Float64Array(n * 3);
    for (let i = 0; i < n * 3; i++) D[i] = frames[b][i] - frames[a][i];
    const per = [];
    for (let c = 0; c < 3; c++) {
      const ea = new Float64Array(n), db = new Float64Array(n);
      for (let p = 0; p < n; p++) { ea[p] = e[p * 3 + c]; db[p] = D[p * 3 + c]; }
      per.push(corrStd(ea, db));
    }
    report.driftCorr[`f${a}->f${b}`] = per;
    console.log(`  f${a}->f${b}: R corr=${per[0].corr} (std e=${per[0].stdA} drift=${per[0].stdB}) | G corr=${per[1].corr} (std e=${per[1].stdA} drift=${per[1].stdB}) | B corr=${per[2].corr} (std e=${per[2].stdA} drift=${per[2].stdB})`);
  }

  // Theo bin plainAbsDiff, kênh G, với ứng viên trôi mạnh nhất.
  console.log("\n== theo bin plainAbsDiff, kênh G: std(e) vs std(drift f25->f26) + corr ==");
  const D26 = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) D26[i] = frames[26][i] - frames[25][i];
  const D25 = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) D25[i] = frames[25][i] - frames[24][i];
  const edges = [0, 1, 2, 4, 8, 256];
  for (let b = 0; b < edges.length - 1; b++) {
    const idx = [];
    for (let p = 0; p < n; p++) if (plainAbs[p] >= edges[b] && plainAbs[p] < edges[b + 1]) idx.push(p);
    const eg = new Float64Array(idx.length), d26 = new Float64Array(idx.length), d25 = new Float64Array(idx.length);
    idx.forEach((p, j) => { eg[j] = e[p * 3 + 1]; d26[j] = D26[p * 3 + 1]; d25[j] = D25[p * 3 + 1]; });
    const r26 = corrStd(eg, d26), r25 = corrStd(eg, d25);
    report.driftBins[`[${edges[b]},${edges[b + 1]})`] = { frac: +(idx.length / n).toFixed(3), f25_26: r26, f24_25: r25 };
    console.log(`  [${edges[b]},${edges[b + 1]}) frac=${(idx.length / n).toFixed(3)} std(e_G)=${r26.stdA} std(D25-26_G)=${r26.stdB} corr=${r26.corr} | std(D24-25_G)=${r25.stdB} corr=${r25.corr}`);
  }
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON: ${OUT}`);
}
main().catch((e) => { console.error(`DRIFT LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
