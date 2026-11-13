#!/usr/bin/env node
/**
 * r81i3-sharp-mechanism.mjs — Phase 9 đợt 81, luồng I3: vì sao kernel BC
 * vẫn bù lệch đường sharp dù Chrome không dùng BC ở xung vuông (nợ H3 §5)?
 *
 * Dùng lại dữ liệu H3 (snaps headed + frame render fullrgb), KHÔNG chạy
 * headed mới. Câu hỏi cốt lõi: delta preview (P_sharp − P_plain) vs delta
 * render sau resample kernel K — BC thắng tam giác ~1,9× ở delta trong khi
 * plain thì tam giác thắng ~2,5×. Cơ chế nào?
 *
 * Thí nghiệm (mỗi nội dung sqw và lineart2px, 2 run D w1920-p640 + A2 w2560-p1280):
 *   V0  tái lập số H3 (plain MAD + delta MAD tri/BC) — neo probe vào H3.
 *   E1  delta ở PROJECT SIZE, không resample: d_render = R_sharp−R_plain
 *       vs d_model = applySharpen(R_plain)−R_plain. Nếu 2 delta này khác
 *       nhau thì lệch nằm ở đường effect; nếu giống nhau thì lệch nằm ở
 *       khâu resample/tương tác sau đó.
 *   E2  delta ở VIEWPORT: tri/BC/Mitchell/Catmull(d_render) và
 *       tri/BC(d_model) so với dp_prev thật. Tách: bao nhiêu phần BC-thắng
 *       là do delta gốc khác nhau, bao nhiêu do kernel.
 *   E3  fit hệ số khuếch đại g: tri(g·d_render) ≈ dp_prev ? Nếu g≠1 và
 *       phần dư ≈ phần dư BC thì cơ chế là BIÊN ĐỘ (preview sharpen mạnh
 *       hơn render unsharp); BC bù bằng cách khuếch đại HF qua thùy âm.
 *   E4  profile 1D qua cạnh (trung bình hàng nửa trên = sọc dọc): in
 *       dp_prev, tri(d_render), BC(d_render), tri(d_model) — xem BC bù ở
 *       chỗ nào của profile (đỉnh? thùy overshoot? độ rộng?).
 *   E5  kiểm kê clip ở project size: R_sharp vs applySharpen chạm 0/255
 *       bao nhiêu pixel — clip khác nhau làm delta khác nhau.
 *   E6  giả thuyết "sharpen sau upscale": delta_post =
 *       applySharpen(tri(R_plain)) − tri(R_plain) so với dp_prev.
 *   E7  kernel blur của ffmpeg unsharp: profile delta trên bước gần-cô-lập
 *       (sqw32) của d_render vs mô hình nhị thức [1,4,6,4,1]/16 tính từ
 *       R_plain — blur render có đúng nhị thức không?
 *   E8  phân rã base-mismatch: b = snap − tri(R_frame) cho plain/sharp;
 *       delta MAD tri = MAD(b_sharp − b_plain) theo định nghĩa — đo xem
 *       b đổi bao nhiêu khi sharpen, và b_plain có cấu trúc theo cạnh không.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r81i3-sharp-mechanism.mjs
 * Env: R81I3_OUT (mặc định hidden_files/round81-i3/r81i3-mechanism.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const require = createRequire(import.meta.url);
const { applySharpen } = require("/tmp/r81i3-effectCanvas.cjs");

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H3 = path.join(GOAL, "round80-h3");
const OUT = process.env.R81I3_OUT || path.join(GOAL, "round81-i3", "r81i3-mechanism.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// ---------- kernel ----------
function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const KERNELS = {
  tri: triangleKernel,
  bc025_0375: (x) => bcCubic(x, 0.25, 0.375),
  mitchell: (x) => bcCubic(x, 1 / 3, 1 / 3),
  catmull: (x) => bcCubic(x, 0, 0.5),
};

// ---------- resample (sao từ analyzer H3) ----------
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
// Resample 1 plane float -> float (không làm tròn/kẹp) — dùng cho delta.
function resamplePlaneFloat(src, srcW, srcH, dstW, dstH, kernel) {
  return resamplePlaneKernel(src, srcW, srcH, dstW, dstH, dstW / srcW, dstH / srcH, kernel);
}
// Resample RGB24 -> RGB24 uint8 (đúng analyzer H3).
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const r = resamplePlaneFloat(pl, srcW, srcH, dstW, dstH, kernel);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(r[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}

// ---------- helpers ----------
function mad3(a, b) { // a,b: Buffer/Uint8Array RGB24 cùng kích thước, trả MAD + le8
  const n = a.length / 3;
  let sum = 0, le8 = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]); sum += d; if (d > dmax) dmax = d; }
    if (dmax <= 8) le8++;
  }
  return { mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4) };
}
function deltaMadFloat(dp, dr) { // dp, dr: Float64Array delta (n*3), trả MAD
  let sum = 0;
  for (let i = 0; i < dp.length; i++) sum += Math.abs(dp[i] - dr[i]);
  return +(sum / dp.length).toFixed(3);
}
function deltaOf(a, b) { // a-b theo từng byte -> Float64Array (có dấu)
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
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
function channelPlane(rgb, w, h, c) {
  const pl = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) pl[i] = rgb[i * 3 + c];
  return pl;
}
// Profile X trung bình theo dải hàng [y0,y1) trên kênh R (float delta hoặc uint8).
function xProfile(arr, w, h, y0, y1, x0, x1, isDelta) {
  const prof = [];
  for (let x = x0; x < x1; x++) {
    let s = 0, n = 0;
    for (let y = y0; y < y1; y++) { s += arr[(y * w + x) * 3]; n++; }
    prof.push(+(s / n).toFixed(1));
  }
  return prof;
}
// Mô hình delta nhị thức từ frame plain (kênh R): amount*(Y - blur(Y)), blur [1,4,6,4,1]/16 tách được, clamp-to-edge.
function binomialDeltaModel(plainRgb, w, h, amount) {
  const Y = channelPlane(plainRgb, w, h, 0);
  const K = [1, 4, 6, 4, 1];
  const at = (x, y) => Y[(y < 0 ? 0 : y >= h ? h - 1 : y) * w + (x < 0 ? 0 : x >= w ? w - 1 : x)];
  const tmp = new Float64Array(w * h), blur = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0; for (let dx = -2; dx <= 2; dx++) s += K[dx + 2] * at(x + dx, y);
    tmp[y * w + x] = s / 16;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0; for (let dy = -2; dy <= 2; dy++) s += K[dy + 2] * tmp[(y + dy < 0 ? 0 : y + dy >= h ? h - 1 : y + dy) * w + x];
    blur[y * w + x] = s / 16;
  }
  const out = new Float64Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const d = amount * (Y[i] - blur[i]);
    out[i * 3] = d; out[i * 3 + 1] = d; out[i * 3 + 2] = d;
  }
  return out;
}

const RUNS = [
  { snapFile: "headed-w1920x1080-p640x360-ph1/r80h3-snaps-w1920x1080-p640x360.json", contents: ["sqw4-640", "sqw8-640", "sqw16-640", "sqw32-640", "lineart2px-640"] },
  { snapFile: "headed-w2560x1440-p1280x720-ph1/r80h3-snaps-w2560x1440-p1280x720.json", contents: ["sqw4", "sqw8", "sqw16", "sqw32"] },
];

const report = { generated: new Date().toISOString(), runs: {} };

for (const run of RUNS) {
  const doc = JSON.parse(fs.readFileSync(path.join(H3, run.snapFile), "utf8"));
  const projW = doc.projW, projH = doc.projH;
  const runKey = `${doc.window}-p${projW}x${projH}`;
  console.log(`\n######## RUN ${runKey} ########`);
  report.runs[runKey] = { snapFile: run.snapFile, projW, projH, contents: {} };
  for (const content of run.contents) {
    const snaps = doc.snaps[content];
    const rect = snaps.plain.rect;
    const vw = snaps.plain.w, vh = snaps.plain.h;
    const scale = rect.scale;
    const rdir = path.join(H3, "render", content);
    const t0 = Date.now();
    console.log(`\n=== ${content}: rect ${vw}x${vh} scale=${scale.toFixed(4)} (proj ${projW}x${projH}) ===`);
    const fullRgb = {};
    for (const v of ["plain", "sharp05", "sharp10"]) {
      const p = path.join(rdir, `fullrgb-${v}.raw`);
      const buf = fs.readFileSync(p);
      if (buf.length !== projW * projH * 3) throw new Error(`${p} sai kích thước`);
      fullRgb[v] = buf;
    }
    const prev = {};
    for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
    const crep = { rect: { x: rect.x, y: rect.y, w: vw, h: vh, scale } };

    // ---- V0: tái lập H3 ----
    const rend = {};
    for (const k of Object.keys(KERNELS)) {
      rend[k] = {};
      for (const v of ["plain", "sharp05", "sharp10"]) rend[k][v] = resampleRgbKernel(fullRgb[v], projW, projH, vw, vh, KERNELS[k]);
    }
    const v0 = {};
    for (const k of ["tri", "bc025_0375", "mitchell", "catmull"]) {
      const plainMad = mad3(prev.plain, rend[k].plain);
      const d05 = deltaMadFloat(deltaOf(prev.sharp05, prev.plain), deltaOf(rend[k].sharp05, rend[k].plain));
      const d10 = deltaMadFloat(deltaOf(prev.sharp10, prev.plain), deltaOf(rend[k].sharp10, rend[k].plain));
      const a05 = mad3(prev.sharp05, rend[k].sharp05), a10 = mad3(prev.sharp10, rend[k].sharp10);
      v0[k] = { plainMad: plainMad.mad, plainLe8: plainMad.le8, abs05: a05.mad, abs10: a10.mad, delta05: d05, delta10: d10 };
      console.log(`  [V0 ${k}] plain MAD=${plainMad.mad} le8=${plainMad.le8} | abs sharp05/10=${a05.mad}/${a10.mad} | DELTA 05/10=${d05}/${d10}`);
    }
    crep.V0_reproduce_H3 = v0;

    // ---- E1: delta ở project size ----
    const e1 = {};
    for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
      const img = { width: projW, height: projH, data: rgb24ToRgba(fullRgb.plain, projW, projH) };
      applySharpen(img, intensity);
      const modelSharp = rgbaToRgb24(img.data, projW, projH);
      const dRender = deltaOf(fullRgb[v], fullRgb.plain);
      const dModel = deltaOf(modelSharp, fullRgb.plain);
      const m = deltaMadFloat(dModel, dRender);
      // kiểm kê clip: số pixel chạm 0/255 ở kênh R
      let clipR = 0, clipM = 0, both = 0;
      for (let i = 0; i < projW * projH; i++) {
        const r = fullRgb[v][i * 3] === 0 || fullRgb[v][i * 3] === 255;
        const mm = modelSharp[i * 3] === 0 || modelSharp[i * 3] === 255;
        if (r) clipR++; if (mm) clipM++; if (r && mm) both++;
      }
      const n = projW * projH;
      e1[v] = { mad_dModel_vs_dRender: m, clipRender: +(clipR / n).toFixed(4), clipModel: +(clipM / n).toFixed(4), clipBoth: +(both / n).toFixed(4) };
      console.log(`  [E1 ${v}] project-size MAD(d_model, d_render)=${m} | clip R render=${(clipR / n * 100).toFixed(1)}% model=${(clipM / n * 100).toFixed(1)}% chung=${(both / n * 100).toFixed(1)}%`);
      // giữ dModel/dRender cho E2/E3 (chỉ kênh R đủ vì grayscale; nhưng giữ full 3 kênh)
      if (!crep._d) crep._d = {};
      crep._d[v] = { dRender, dModel };
    }
    crep.E1_projectSizeDelta = e1;

    // ---- E2: delta ở viewport, tách kernel khỏi delta gốc ----
    const dpPrev = { sharp05: deltaOf(prev.sharp05, prev.plain), sharp10: deltaOf(prev.sharp10, prev.plain) };
    const e2 = {};
    for (const v of ["sharp05", "sharp10"]) {
      const row = {};
      // kernel K áp lên d_render (float, không qua frame uint8 trung gian)
      for (const k of Object.keys(KERNELS)) {
        const up = new Float64Array(vw * vh * 3);
        for (let c = 0; c < 3; c++) {
          const pl = new Float64Array(projW * projH);
          for (let i = 0; i < projW * projH; i++) pl[i] = crep._d[v].dRender[i * 3 + c];
          const rs = resamplePlaneFloat(pl, projW, projH, vw, vh, KERNELS[k]);
          for (let i = 0; i < vw * vh; i++) up[i * 3 + c] = rs[i];
        }
        row[`${k}(d_render)`] = deltaMadFloat(dpPrev[v], up);
      }
      // tri/BC áp lên d_model
      for (const k of ["tri", "bc025_0375"]) {
        const up = new Float64Array(vw * vh * 3);
        for (let c = 0; c < 3; c++) {
          const pl = new Float64Array(projW * projH);
          for (let i = 0; i < projW * projH; i++) pl[i] = crep._d[v].dModel[i * 3 + c];
          const rs = resamplePlaneFloat(pl, projW, projH, vw, vh, KERNELS[k]);
          for (let i = 0; i < vw * vh; i++) up[i * 3 + c] = rs[i];
        }
        row[`${k}(d_model)`] = deltaMadFloat(dpPrev[v], up);
      }
      e2[v] = row;
      console.log(`  [E2 ${v}] MAD vs dp_prev: ` + Object.entries(row).map(([k, x]) => `${k}=${x}`).join(" | "));
    }
    crep.E2_viewportDelta = e2;

    // ---- E3: fit gain g trên tri(d_render) ----
    const e3 = {};
    for (const v of ["sharp05", "sharp10"]) {
      // tri float của d_render (tính 1 lần)
      const triD = new Float64Array(vw * vh * 3);
      for (let c = 0; c < 3; c++) {
        const pl = new Float64Array(projW * projH);
        for (let i = 0; i < projW * projH; i++) pl[i] = crep._d[v].dRender[i * 3 + c];
        const rs = resamplePlaneFloat(pl, projW, projH, vw, vh, KERNELS.tri);
        for (let i = 0; i < vw * vh; i++) triD[i * 3 + c] = rs[i];
      }
      let best = null;
      for (let g = 0.5; g <= 2.001; g += 0.05) {
        const pred = new Float64Array(triD.length);
        for (let i = 0; i < triD.length; i++) { const x = g * triD[i]; pred[i] = x < -255 ? -255 : x > 255 ? 255 : x; }
        const m = deltaMadFloat(dpPrev[v], pred);
        if (!best || m < best.mad) best = { g: +g.toFixed(2), mad: m };
      }
      const bcMad = e2[v]["bc025_0375(d_render)"];
      e3[v] = { bestGain: best.g, bestMad: best.mad, madAtG1: deltaMadFloat(dpPrev[v], triD), bcMad };
      console.log(`  [E3 ${v}] gain tốt nhất g=${best.g} MAD=${best.mad} (g=1: ${e3[v].madAtG1}; BC(d_render): ${bcMad})`);
    }
    crep.E3_gainFit = e3;

    // ---- E4: profile 1D (chỉ sqw: nửa trên sọc dọc) ----
    const e4 = {};
    if (content.startsWith("sqw")) {
      const y0 = Math.floor(vh * 0.1), y1 = Math.floor(vh * 0.45);
      const x0 = 100, x1 = 140;
      const prof = {};
      prof.dp_prev_sharp10 = xProfile(dpPrev.sharp10, vw, vh, y0, y1, x0, x1);
      // tri/BC(d_render) và tri(d_model) sharp10 — tính lại dạng float rồi profile
      for (const [label, d, k] of [
        ["tri(d_render)", crep._d.sharp10.dRender, KERNELS.tri],
        ["bc(d_render)", crep._d.sharp10.dRender, KERNELS.bc025_0375],
        ["tri(d_model)", crep._d.sharp10.dModel, KERNELS.tri],
      ]) {
        const up = new Float64Array(vw * vh * 3);
        const plane = new Float64Array(projW * projH);
        for (let i = 0; i < projW * projH; i++) plane[i] = d[i * 3];
        const rs = resamplePlaneFloat(plane, projW, projH, vw, vh, k);
        const upR = new Float64Array(vw * vh * 3);
        for (let i = 0; i < vw * vh; i++) upR[i * 3] = rs[i];
        prof[label] = xProfile(upR, vw, vh, y0, y1, x0, x1);
      }
      // profile project-size (kênh R) quanh 1 cạnh: x 20..44 nguồn
      const ps = {};
      for (const [label, d] of [["d_render", crep._d.sharp10.dRender], ["d_model", crep._d.sharp10.dModel]]) {
        const arr = new Float64Array(projW * projH * 3);
        for (let i = 0; i < projW * projH; i++) arr[i * 3] = d[i * 3];
        ps[label] = xProfile(arr, projW, projH, Math.floor(projH * 0.1), Math.floor(projH * 0.45), 20, 44);
      }
      e4.viewport_x100_140_sharp10 = prof;
      e4.project_x20_44_sharp10 = ps;
      console.log(`  [E4] viewport profile sharp10 x=100..139 (R, nửa trên):`);
      console.log(`    dp_prev      = [${prof.dp_prev_sharp10.join(", ")}]`);
      console.log(`    tri(d_render)= [${prof["tri(d_render)"].join(", ")}]`);
      console.log(`    bc(d_render) = [${prof["bc(d_render)"].join(", ")}]`);
      console.log(`    tri(d_model) = [${prof["tri(d_model)"].join(", ")}]`);
      console.log(`  [E4] project-size profile sharp10 x=20..43 (R):`);
      console.log(`    d_render = [${ps.d_render.join(", ")}]`);
      console.log(`    d_model  = [${ps.d_model.join(", ")}]`);
    }
    crep.E4_profiles = e4;

    // ---- E5: clip đã có trong E1 (ghi lại gọn) ----
    crep.E5_clipping = { note: "xem E1 clipRender/clipModel/clipBoth" };

    // ---- E6: sharpen sau upscale ----
    const e6 = {};
    for (const v of ["sharp05", "sharp10"]) {
      const intensity = v === "sharp05" ? 0.5 : 1.0;
      const upPlain = rend.tri.plain; // tri(R_plain) viewport uint8
      const img = { width: vw, height: vh, data: rgb24ToRgba(upPlain, vw, vh) };
      applySharpen(img, intensity);
      const postSharp = rgbaToRgb24(img.data, vw, vh);
      const dPost = deltaOf(postSharp, upPlain);
      const m = deltaMadFloat(dpPrev[v], dPost);
      e6[v] = { mad_deltaPost_vs_dpPrev: m, mad_tri_dRender: e2[v]["tri(d_render)"] };
      console.log(`  [E6 ${v}] MAD(delta_post-upscale, dp_prev)=${m} (so tri(d_render)=${e6[v].mad_tri_dRender})`);
    }
    crep.E6_postUpscaleSharpen = e6;

    // ---- E7: blur ffmpeg vs nhị thức (sqw32: bước gần-cô-lập) ----
    const e7 = {};
    if (content.startsWith("sqw32")) {
      for (const [v, amount] of [["sharp05", 1.1], ["sharp10", 2.0]]) {
        const binModel = binomialDeltaModel(fullRgb.plain, projW, projH, amount);
        const m = deltaMadFloat(deltaOf(fullRgb[v], fullRgb.plain), binModel);
        // profile qua 1 cạnh cô lập: nguồn x=28..44 (cạnh tại 32), nửa trên
        const y0 = Math.floor(projH * 0.1), y1 = Math.floor(projH * 0.45);
        const pRender = xProfile(deltaOf(fullRgb[v], fullRgb.plain), projW, projH, y0, y1, 28, 44);
        const pBin = xProfile(binModel, projW, projH, y0, y1, 28, 44);
        e7[v] = { mad_dRender_vs_binomial: m, profile_render_x28_43: pRender, profile_binomial_x28_43: pBin };
        console.log(`  [E7 ${v}] MAD(d_render, binomial-model)=${m}`);
        console.log(`    render   = [${pRender.join(", ")}]`);
        console.log(`    binomial = [${pBin.join(", ")}]`);
      }
    }
    crep.E7_ffmpegBlurVsBinomial = e7;

    // ---- E8: phân rã base-mismatch ----
    const e8 = {};
    for (const v of ["sharp05", "sharp10"]) {
      const bPlain = deltaOf(prev.plain, rend.tri.plain); // snap_plain - tri(R_plain)
      const bSharp = deltaOf(prev[v], rend.tri[v]);
      const bDiff = new Float64Array(bPlain.length);
      for (let i = 0; i < bPlain.length; i++) bDiff[i] = bSharp[i] - bPlain[i];
      const madB = (arr) => { let s = 0; for (let i = 0; i < arr.length; i++) s += Math.abs(arr[i]); return +(s / arr.length).toFixed(3); };
      e8[v] = { mad_bPlain: madB(bPlain), mad_bSharp: madB(bSharp), mad_bSharp_minus_bPlain: madB(bDiff), deltaMadTri_check: v0.tri[v === "sharp05" ? "delta05" : "delta10"] };
      console.log(`  [E8 ${v}] MAD b_plain=${e8[v].mad_bPlain} b_sharp=${e8[v].mad_bSharp} |b_sharp-b_plain|=${e8[v].mad_bSharp_minus_bPlain} (delta MAD tri=${e8[v].deltaMadTri_check})`);
    }
    // cấu trúc b_plain theo cạnh: profile X của b_plain (kênh R)
    if (content.startsWith("sqw")) {
      const bPlain = deltaOf(prev.plain, rend.tri.plain);
      const y0 = Math.floor(vh * 0.1), y1 = Math.floor(vh * 0.45);
      e8.profile_bPlain_x100_139 = xProfile(bPlain, vw, vh, y0, y1, 100, 140);
      console.log(`  [E8] profile b_plain x=100..139 = [${e8.profile_bPlain_x100_139.join(", ")}]`);
    }
    crep.E8_baseMismatch = e8;

    delete crep._d; // không lưu delta float vào JSON (nặng)
    report.runs[runKey].contents[content] = crep;
    console.log(`  (xong ${content} trong ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nJSON: ${OUT}`);
