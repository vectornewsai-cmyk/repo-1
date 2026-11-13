#!/usr/bin/env node
/**
 * r82j7-base-est-test.mjs — Phase 9 đợt 82, luồng J7: test E9 (base-mismatch
 * khuếch đại qua sharpen — giả thuyết cuối cùng kiểm được offline).
 *
 * Bối cảnh: delta project-size ≈ 0 (E1/E5), sharpen-sau-upscale bị loại
 * (E7a: overshoot 2,5–3,9×), decode-mềm bị loại (E8: blur làm tệ hơn).
 * Còn lại: base của browser (frame video decode + draw lên effect canvas)
 * khác base ffmpeg (R_plain) ở chi tiết tần số cao (plain MAD 2,5–4,3
 * trên lineart, tập trung ở cạnh), và sharpen KHUẾCH ĐẠI chênh lệch đó
 * thành delta preview — trong khi mô hình trên R_plain thấy delta ≈ 0.
 * I3 perturb test đã loại cơ chế này cho sqw (dịch base ±0,03px chỉ đổi
 * delta ±0,24), nhưng trên lineart delta gốc ≈ 0 nên mọi chênh lệch base
 * đều nổi bật tương đối — cần kiểm riêng.
 *
 * Test: khôi phục base browser bằng cách DOWNSCALE P_plain về project size
 * bằng kernel Mitchell (J2 đợt 82: kernel drawImage thật của Chrome là
 * Mitchell B=C=1/3), rồi sharpen trên base ước lượng đó:
 *   dp_model = mitchell_upscale(sharpen(B_est) − B_est), so với dp_prev.
 * So sánh với baseline mitchell_upscale(d_render) (cùng kernel, đúng
 * kernel Chrome — công bằng hơn tri). Lưu ý: round-trip upscale→downscale
 * làm cùn cạnh (I3 §5.3) nên B_est là cận DƯỚI của hiệu ứng — nếu test này
 * cải thiện rõ thì cơ chế được ủng hộ; nếu không cải thiện thì cơ chế nằm
 * ở bước nội bộ Chrome không tách được offline (xem LIMITS §7).
 *
 * Chạy: node apps/web/scripts/r82j7-base-est-test.mjs
 * Env: R82J7_OUT (mặc định hidden_files/round82-j7/r82j7-base-est.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { chromeWeights1D } from "./chrome-resample.mjs";

const require = createRequire(import.meta.url);
const { applySharpen } = require("/tmp/r82j7-effectCanvas.cjs");

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G5 = path.join(GOAL, "round79-g5");
const H3 = path.join(GOAL, "round80-h3");
const J7 = path.join(GOAL, "round82-j7");
const OUT = process.env.R82J7_OUT || path.join(J7, "r82j7-base-est.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const mitchell = (x) => bcCubic(x, 1 / 3, 1 / 3);
function resamplePlane(src, srcW, srcH, dstW, dstH, kernel) {
  const tmp = new Float64Array(dstW * srcH);
  const wCacheX = new Array(dstW);
  for (let i = 0; i < dstW; i++) wCacheX[i] = chromeWeights1D(i, dstW / srcW, srcW, kernel);
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
  for (let i = 0; i < dstH; i++) wCacheY[i] = chromeWeights1D(i, dstH / srcH, srcH, kernel);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of wCacheY[i]) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleRgb(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const rs = resamplePlane(pl, srcW, srcH, dstW, dstH, kernel);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
function deltaOf(a, b) {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}
function deltaMadFloat(dp, dr) {
  let sum = 0;
  for (let i = 0; i < dp.length; i++) sum += Math.abs(dp[i] - dr[i]);
  return +(sum / dp.length).toFixed(3);
}
function mad3(a, b) {
  const n = a.length / 3;
  let sum = 0;
  for (let p = 0; p < n; p++) for (let c = 0; c < 3; c++) sum += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
  return +(sum / (n * 3)).toFixed(3);
}
function rgb24ToRgba(rgb, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = rgb[i * 3]; out[i * 4 + 1] = rgb[i * 3 + 1]; out[i * 4 + 2] = rgb[i * 3 + 2]; out[i * 4 + 3] = 255;
  }
  return out;
}
function rgbaToRgb24(rgba, w, h) {
  const out = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { out[i * 3] = rgba[i * 4]; out[i * 3 + 1] = rgba[i * 4 + 1]; out[i * 3 + 2] = rgba[i * 4 + 2]; }
  return out;
}

const DATASETS = [
  { key: "L1px-1280@1.132", snaps: path.join(G5, "headed-w2560x1440-p1280x720", "r79g5-snaps-w2560x1440-p1280x720.json"), content: "lineart", render: path.join(G5, "render", "lineart"), projW: 1280, projH: 720 },
  { key: "L2px-640@1.264", snaps: path.join(H3, "headed-w1920x1080-p640x360-ph1", "r80h3-snaps-w1920x1080-p640x360.json"), content: "lineart2px-640", render: path.join(H3, "render", "lineart2px-640"), projW: 640, projH: 360 },
  { key: "L3px-640@1.264", snaps: path.join(J7, "headed-w1920x1080-p640x360-ph1", "r82j7-snaps-w1920x1080-p640x360.json"), content: "lineart3px-640", render: path.join(J7, "render", "lineart3px-640"), projW: 640, projH: 360 },
  { key: "L4px-640@1.264", snaps: path.join(J7, "headed-w1920x1080-p640x360-ph1", "r82j7-snaps-w1920x1080-p640x360.json"), content: "lineart4px-640", render: path.join(J7, "render", "lineart4px-640"), projW: 640, projH: 360 },
];

const report = { generated: new Date().toISOString(), datasets: {} };
for (const ds of DATASETS) {
  const doc = JSON.parse(fs.readFileSync(ds.snaps, "utf8"));
  const snaps = doc.snaps[ds.content];
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const projW = ds.projW, projH = ds.projH;
  console.log(`\n######## ${ds.key}: ${vw}x${vh} ########`);
  const fullRgb = {};
  for (const v of ["plain", "sharp05", "sharp10"]) fullRgb[v] = fs.readFileSync(path.join(ds.render, `fullrgb-${v}.raw`));
  const prev = {};
  for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
  // B_est: downscale P_plain về project size bằng Mitchell
  const best = resampleRgb(prev.plain, vw, vh, projW, projH, mitchell);
  const baseMad = mad3(best, fullRgb.plain);
  console.log(`  [E9] MAD(B_est, R_plain)=${baseMad} (chênh lệch base ước lượng, gồm cả cùn round-trip)`);
  const rep = { mad_Best_vs_Rplain: baseMad };
  // baseline công bằng: mitchell_upscale(d_render) vs dp_prev
  for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
    const dpPrev = deltaOf(prev[v], prev.plain);
    // baseline: Mitchell(d_render)
    const dRender = deltaOf(fullRgb[v], fullRgb.plain);
    const upBase = new Float64Array(vw * vh * 3);
    for (let c = 0; c < 3; c++) {
      const pl = new Float64Array(projW * projH);
      for (let i = 0; i < projW * projH; i++) pl[i] = dRender[i * 3 + c];
      const rs = resamplePlane(pl, projW, projH, vw, vh, mitchell);
      for (let i = 0; i < vw * vh; i++) upBase[i * 3 + c] = rs[i];
    }
    const madBase = deltaMadFloat(dpPrev, upBase);
    // test: sharpen trên B_est
    const img = { width: projW, height: projH, data: rgb24ToRgba(best, projW, projH) };
    applySharpen(img, intensity);
    const sharpEst = rgbaToRgb24(img.data, projW, projH);
    const dEst = deltaOf(sharpEst, best);
    const upEst = new Float64Array(vw * vh * 3);
    for (let c = 0; c < 3; c++) {
      const pl = new Float64Array(projW * projH);
      for (let i = 0; i < projW * projH; i++) pl[i] = dEst[i * 3 + c];
      const rs = resamplePlane(pl, projW, projH, vw, vh, mitchell);
      for (let i = 0; i < vw * vh; i++) upEst[i * 3 + c] = rs[i];
    }
    const madEst = deltaMadFloat(dpPrev, upEst);
    rep[v] = { mad_baseline_mitchell_dRender: madBase, mad_sharpen_on_Best: madEst };
    console.log(`  [E9 ${v}] baseline Mitchell(d_render) MAD=${madBase} | sharpen(B_est) MAD=${madEst}`);
  }
  report.datasets[ds.key] = rep;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nJSON: ${OUT}`);
