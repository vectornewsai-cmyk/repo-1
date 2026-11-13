#!/usr/bin/env node
/**
 * r84l2-base-probe-analyze.mjs — Phase 9 đợt 84, luồng L2: phân tích B-probe
 * (đóng nợ K2 §7 mục 1 — phần dư delta sqw4).
 *
 * Đầu vào: hidden_files/round84-l2/r84l2-base-probe.json (B native +
 * U(B) upscale canvas→canvas của Chrome) + snaps H3 + fullrgb H3.
 *
 * Các phép đo (mỗi nội dung sqw4-640 / sqw4):
 *   B1 — b = B − R ở project size: MAD/le8/RMS/mean theo kênh, profile
 *        qua cạnh, tách vùng cạnh/phẳng. Đối chiếu chéo: ffmpeg decode
 *        frame 30 của mp4 vs R (kỳ vọng ~0) và vs B (kỳ vọng = b).
 *   B2 — khung hash FNV-1a kênh R của B so với rawFrames H3 (cùng khung?).
 *   B3 — U(B) (canvas→canvas của Chrome) vs Mitchell offline trên cùng B:
 *        MAD/le8 — kiểm tra U=Mitchell trên pixel có nguồn video.
 *   B4 — PHÂN RÃ QUYẾT ĐỊNH (cần applySharpen thật từ effectCanvas.ts):
 *        p_pred = Mit(B) − Mit(R) so với p_Mit đo được (khớp tới làm
 *        tròn?); S1(B) = applySharpen(B) rồi Mit(S1(B)) so với snap_sharp
 *        (khớp tới làm tròn thì pipeline preview đã giải thích hết);
 *        r_pred = [Mit(S1(B))−Mit(B)] − [Mit(S2(R))−Mit(R)] so với r đo
 *        được (MAD/corr); tách r_pred thành phần base S1(B)−S1(R) và
 *        phần sharpen S1(R)−S2(R).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r84l2-base-probe-analyze.mjs
 * Cần bundle /tmp/r84l2-effectCanvas.cjs (tạo bằng esbuild từ
 * apps/web/src/lib/effectCanvas.ts nếu chưa có).
 * Env: R84L2_OUT (mặc định hidden_files/round84-l2/r84l2-base-probe-analysis.json).
 * Chỉ đo offline. KHÔNG push/tag/binary/workflow. KHÔNG sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { chromeWeights1D, bcCubicKernel } from "./chrome-resample.mjs";

const require = createRequire(import.meta.url);
const BUNDLE = "/tmp/r84l2-effectCanvas.cjs";
if (!fs.existsSync(BUNDLE)) throw new Error(`thiếu bundle ${BUNDLE} — chạy esbuild trước: node_modules/.bin/esbuild apps/web/src/lib/effectCanvas.ts --bundle --format=cjs --outfile=${BUNDLE}`);
const { applySharpen } = require(BUNDLE);

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H3 = path.join(GOAL, "round80-h3");
const L2 = path.join(GOAL, "round84-l2");
const PROBE = path.join(L2, "r84l2-base-probe.json");
const OUT = process.env.R84L2_OUT || path.join(L2, "r84l2-base-probe-analysis.json");
const r3 = (v) => +v.toFixed(3);
const MIT = (x) => bcCubicKernel(x, 1 / 3, 1 / 3);

function roundU8(v) { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; }
function resamplePlaneKernel(src, srcW, srcH, dstW, dstH, kernel) {
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) for (let i = 0; i < dstW; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, dstW / srcW, srcW, kernel, 1)) acc += w * src[y * srcW + j];
    tmp[y * dstW + i] = acc;
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) for (let i = 0; i < dstH; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, dstH / srcH, srcH, kernel, 1)) acc += w * tmp[j * dstW + x];
    out[i * dstW + x] = acc;
  }
  return out;
}
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const r = resamplePlaneKernel(pl, srcW, srcH, dstW, dstH, kernel);
    for (let i = 0; i < dstW * dstH; i++) out[i * 3 + c] = roundU8(r[i]);
  }
  return out;
}
function resamplePlaneFloat(src, srcW, srcH, dstW, dstH, kernel) {
  return resamplePlaneKernel(src, srcW, srcH, dstW, dstH, kernel);
}
function mad3(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]); sum += d; if (d > dmax) dmax = d; }
    if (dmax <= 8) le8++;
  }
  return { mad: r3(sum / (n * 3)), le8: +(le8 / n).toFixed(4) };
}
function statsOfDiff(a, b) {
  // a,b: Buffer/Uint8Array cùng độ dài; trả MAD/RMS/mean/max/le8 theo kênh gộp + từng kênh.
  const n = a.length / 3;
  let s = 0, s2 = 0, m = 0, mx = 0, le8 = 0;
  const ch = [0, 1, 2].map(() => ({ s: 0, m: 0 }));
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += Math.abs(d); s2 += d * d; m += d;
    if (Math.abs(d) > mx) mx = Math.abs(d);
    if (Math.abs(d) <= 8) le8++;
    ch[i % 3].s += Math.abs(d); ch[i % 3].m += d;
  }
  return {
    mad: r3(s / a.length), rms: r3(Math.sqrt(s2 / a.length)), mean: r3(m / a.length),
    max: mx, le8: +(le8 / a.length).toFixed(4),
    chMad: ch.map((c) => r3(c.s / n)), chMean: ch.map((c) => r3(c.m / n)),
  };
}
function deltaOf(a, b) { const o = new Float64Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] - b[i]; return o; }
function madFloatArr(a) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i]); return s / a.length; }
function corrOf(a, b) {
  let ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { ma += a[i]; mb += b[i]; }
  ma /= a.length; mb /= b.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < a.length; i++) { const da = a[i] - ma, db = b[i] - mb; sxx += da * da; syy += db * db; sxy += da * db; }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
}
function fnv1aR(rgb) {
  let h1 = 2166136261 >>> 0;
  for (let i = 0; i < rgb.length; i += 3) { h1 ^= rgb[i]; h1 = Math.imul(h1, 16777619) >>> 0; }
  return h1.toString(16);
}
function rgb24ToRgba(rgb, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { out[i * 4] = rgb[i * 3]; out[i * 4 + 1] = rgb[i * 3 + 1]; out[i * 4 + 2] = rgb[i * 3 + 2]; out[i * 4 + 3] = 255; }
  return { width: w, height: h, data: out };
}
function rgbaToRgb24(img) {
  const { width: w, height: h, data: d } = img;
  const out = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { out[i * 3] = d[i * 4]; out[i * 3 + 1] = d[i * 4 + 1]; out[i * 4 + 2] = d[i * 4 + 2]; }
  return out;
}
function xProfile(arr, w, h, y0, y1, x0, x1) {
  const prof = [];
  for (let x = x0; x < x1; x++) {
    let s = 0, n = 0;
    for (let y = y0; y < y1; y++) { s += arr[(y * w + x) * 3]; n++; }
    prof.push(+((s / n).toFixed(1)));
  }
  return prof;
}

const probe = JSON.parse(fs.readFileSync(PROBE, "utf8"));
const report = { generated: new Date().toISOString(), contents: {} };

const CASES = [
  { key: "sqw640", content: "sqw4-640", snapFile: "headed-w1920x1080-p640x360-ph1/r80h3-snaps-w1920x1080-p640x360.json", projW: 640, projH: 360 },
  { key: "sqw1280", content: "sqw4", snapFile: "headed-w2560x1440-p1280x720-ph1/r80h3-snaps-w2560x1440-p1280x720.json", projW: 1280, projH: 720 },
];

for (const cs of CASES) {
  console.log(`\n######## ${cs.content} (proj ${cs.projW}x${cs.projH}) ########`);
  const B = Buffer.from(probe[cs.key].native.rgbB64, "base64");
  const UB = Buffer.from(probe[cs.key].upscaled.rgbB64, "base64");
  const upW = probe[cs.key].upscaled.w, upH = probe[cs.key].upscaled.h;
  const rdir = path.join(H3, "render", cs.content);
  const Rplain = fs.readFileSync(path.join(rdir, "fullrgb-plain.raw"));
  const doc = JSON.parse(fs.readFileSync(path.join(H3, cs.snapFile), "utf8"));
  const snaps = doc.snaps[cs.content];
  const vw = snaps.plain.w, vh = snaps.plain.h;
  if (vw !== upW || vh !== upH) console.log(`  CẢNH BÁO: rect snap ${vw}x${vh} ≠ upscaled probe ${upW}x${upH}`);
  const prev = {};
  for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");

  // B1 — b = B − R.
  const bStats = statsOfDiff(B, Rplain);
  const bProf = xProfile(deltaOf(B, Rplain), cs.projW, cs.projH, 0, Math.floor(cs.projH / 2), 20, 44);
  // Tách vùng: pixel cạnh (|R_plain - blur lân cận| lớn) vs phẳng — xấp xỉ bằng |dB/dX| của R.
  let edgeSum = 0, edgeN = 0, flatSum = 0, flatN = 0;
  for (let y = 0; y < cs.projH; y++) for (let x = 0; x < cs.projW; x++) {
    const i = y * cs.projW + x;
    const gx = Math.abs(Rplain[i * 3] - Rplain[(y * cs.projW + Math.min(cs.projW - 1, x + 1)) * 3]);
    const d = Math.abs(B[i * 3] - Rplain[i * 3]);
    if (gx > 0) { edgeSum += d; edgeN++; } else { flatSum += d; flatN++; }
  }
  console.log(`  B1 b=B−R: MAD=${bStats.mad} RMS=${bStats.rms} mean=${bStats.mean} le8=${bStats.le8} max=${bStats.max} chMad=[${bStats.chMad.join(", ")}] chMean=[${bStats.chMean.join(", ")}]`);
  console.log(`     b theo vùng: cạnh (gx>0, frac=${r3(edgeN / (cs.projW * cs.projH))}) MAD=${r3(edgeN ? edgeSum / edgeN : 0)} | phẳng MAD=${r3(flatN ? flatSum / flatN : 0)}`);
  console.log(`     profile b x=20..43 (nửa trên, R): [${bProf.join(", ")}]`);

  // B2 — hash khung.
  const hashB = fnv1aR(B);
  const hashH3 = doc.rawFrames?.[cs.content]?.plain?.hash;
  console.log(`  B2 hash khung FNV-1a R: probe=${hashB} vs H3 rawFrames plain=${hashH3} → ${hashB === hashH3 ? "KHỚP (cùng khung)" : "KHÁC (xem lại)"}`);

  // B3 — U(B) vs Mitchell(B).
  const mitB = resampleRgbKernel(B, cs.projW, cs.projH, upW, upH, MIT);
  const ubStats = mad3(UB, mitB);
  console.log(`  B3 U(B) vs Mitchell(B): MAD=${ubStats.mad} le8=${ubStats.le8} (0,003 kỳ vọng nếu U=Mitchell trên pixel video)`);

  // B4 — phân rã quyết định với applySharpen thật.
  const ent = { b: bStats, bProfile_x20_43: bProf, bSplitEdgeFlat: { edgeFrac: r3(edgeN / (cs.projW * cs.projH)), edgeMad: r3(edgeN ? edgeSum / edgeN : 0), flatMad: r3(flatN ? flatSum / flatN : 0) }, hashProbe: hashB, hashH3, ubVsMitchell: ubStats, variants: {} };
  const mitRplain = resampleRgbKernel(Rplain, cs.projW, cs.projH, vw, vh, MIT);
  const pMeas = mad3(prev.plain, mitRplain);
  const pPred = mad3(mitB, mitRplain);
  console.log(`  B4 p_Mit đo được: MAD=${pMeas.mad} | dự đoán từ B thật Mit(B)−Mit(R): MAD=${pPred.mad}`);
  ent.pMitMeasured = pMeas;
  ent.pMitPredictedFromB = pPred;
  for (const [vLabel, v, intensity] of [["sharp05", "sharp05", 0.5], ["sharp10", "sharp10", 1.0]]) {
    const Rsharp = fs.readFileSync(path.join(rdir, `fullrgb-${v}.raw`));
    // S1(B), S1(R) qua applySharpen thật.
    const S1B = rgbaToRgb24(applySharpen(rgb24ToRgba(B, cs.projW, cs.projH), intensity));
    const S1R = rgbaToRgb24(applySharpen(rgb24ToRgba(Rplain, cs.projW, cs.projH), intensity));
    const e1 = mad3(S1R, Rsharp);
    // Dự đoán viewport: Mit(S1(B)) vs snap_sharp; Mit(S1(R)) vs Mit(S2(R)).
    const mitS1B = resampleRgbKernel(S1B, cs.projW, cs.projH, vw, vh, MIT);
    const mitS1R = resampleRgbKernel(S1R, cs.projW, cs.projH, vw, vh, MIT);
    const mitS2R = resampleRgbKernel(Rsharp, cs.projW, cs.projH, vw, vh, MIT);
    const absPred = mad3(prev[v], mitS1B);
    const absMeas = mad3(prev[v], mitS2R);
    // r đo được và r dự đoán (float, không làm tròn, như K2).
    const dp = deltaOf(prev[v], prev.plain);
    const dr = deltaOf(mitS2R, mitRplain);
    const rMeas = new Float64Array(dp.length);
    for (let i = 0; i < dp.length; i++) rMeas[i] = dp[i] - dr[i];
    const dpPred = deltaOf(mitS1B, mitB);
    const rPred = new Float64Array(dpPred.length);
    for (let i = 0; i < dpPred.length; i++) rPred[i] = dpPred[i] - dr[i];
    const rMeasMad = r3(madFloatArr(rMeas));
    const rPredMad = r3(madFloatArr(rPred));
    // MAD(r_pred vs r_đo) + corr.
    const diffRP = new Float64Array(rMeas.length);
    for (let i = 0; i < rMeas.length; i++) diffRP[i] = rMeas[i] - rPred[i];
    const madRpredVsRmeas = r3(madFloatArr(diffRP));
    const corrRP = r3(corrOf(rMeas, rPred));
    // Tách r_pred: phần base = Mit(S1(B)−S1(R)) − Mit(B−R); phần sharpen = Mit(S1(R)−S2(R)).
    const basePart = new Float64Array(dpPred.length);
    {
      const s1b_s1r = deltaOf(mitS1B, mitS1R);
      const b_r = deltaOf(mitB, mitRplain);
      for (let i = 0; i < basePart.length; i++) basePart[i] = s1b_s1r[i] - b_r[i];
    }
    const sharpPart = deltaOf(mitS1R, mitS2R);
    const basePartMad = r3(madFloatArr(basePart));
    const sharpPartMad = r3(madFloatArr(sharpPart));
    console.log(`  B4 ${vLabel}: E1 S1(R)vsS2(R) MAD=${e1.mad} | Mit(S1(B)) vs snap_sharp: MAD=${absPred.mad} le8=${absPred.le8} (đo bằng S2: ${absMeas.mad})`);
    console.log(`     r đo=${rMeasMad} | r_pred=${rPredMad} | MAD(r_pred vs r_đo)=${madRpredVsRmeas} corr=${corrRP}`);
    console.log(`     tách r_pred: phần base MAD=${basePartMad} | phần sharpen MAD=${sharpPartMad}`);
    ent.variants[vLabel] = {
      e1_S1R_vs_S2R: e1,
      absSharpPredFromB: absPred, absSharpMeasuredK2: absMeas,
      rMeasuredMad: rMeasMad, rPredMad, madRpredVsRmeas, corrRpredVsRmeas: corrRP,
      rPredSplit: { basePartMad, sharpPartMad },
    };
  }
  report.contents[cs.content] = ent;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
