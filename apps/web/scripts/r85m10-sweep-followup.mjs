#!/usr/bin/env node
/**
 * r85m10-sweep-followup.mjs — Phase 9 đợt 85, luồng M10 (bổ sung sau phân
 * tích lần 1): 3 kiểm tra quyết định mà phân tích lần 1 để lại:
 *
 *  F2a. Sweep CHỈ trên frame sạch: phân tích lần 1 thấy 24% frame sweep
 *      có đỉnh S0 lệch -1px (seek chạm biên frame: currentTime = f/30
 *      đúng biên; đỉnh không bao giờ lệch +1). Loại các frame đó (đỉnh
 *      S0 != f, hoặc window MAD vs ffmpeg >= 0,5) rồi fit lại kernel 1D
 *      + grid (B,C) — scaler video 1D có phải tam giác?
 *  F2b. Lệch theo pha: với frame sạch, đo vị trí hiệu dụng của xung qua
 *      centroid profile Bview so với dự báo tri, binned theo pha
 *      (16 bin) — pha có bị lượng tử hoá (bậc thang) hay chỉ lệch toàn
 *      cục? Đây là ứng viên giải thích vì sao nội dung tuần hoàn
 *      (sqw4/lineart) lệch mà xung/step cô lập lại khớp tri.
 *  F2c. A/B hình học app ĐÚNG: phân tích lần 1 tính sai thang X của
 *      model app-geom (dùng 809/640 thay vì rect.scale 1,2638889 đều
 *      2 trục — đúng lỗi hình học L5 §2). Tính lại: Bapp vs tri_app /
 *      Mitchell_app (quét phi), C2app vs Mitchell_app — đây mới là số
 *      quyết định hướng sửa two-step cho đường plain thật của app.
 *
 * Dùng lại r85m10-probe.json (không cần chạy headed mới).
 * Chạy: node apps/web/scripts/r85m10-sweep-followup.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M10 = path.join(GOAL, "round85-m10");
const PROBE = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-probe.json"), "utf8"));
const OUT = path.join(M10, "r85m10-followup.json");
const MEDIA = path.join(M10, "media");
const G5MEDIA = path.join(GOAL, "round79-g5", "media");
const H3MEDIA = path.join(GOAL, "round80-h3", "media");
const W = 640, H = 360;
const CLIP_FILE = {
  "step-640": path.join(MEDIA, "step-640.mp4"),
  "impulse-red-640": path.join(MEDIA, "impulse-red-640.mp4"),
  "impulse-v-640-f320": path.join(MEDIA, "impulse-v-640.mp4"),
  "impulse-h-640-f180": path.join(MEDIA, "impulse-h-640.mp4"),
  "lineart640": path.join(G5MEDIA, "lineart-640.mp4"),
  "lineart2px-640": path.join(H3MEDIA, "lineart2px-640.mp4"),
  "sqw4-640": path.join(H3MEDIA, "sqw4-640.mp4"),
};
const CLIP_T = { "step-640": 0, "impulse-red-640": 0, "impulse-v-640-f320": 320 / 30, "impulse-h-640-f180": 180 / 30, "lineart640": 1.0, "lineart2px-640": 1.0, "sqw4-640": 1.0 };

function sinc(x) { return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); }
function bc(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const KERNELS = {
  tri: (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; },
  bc0250375: (x) => bc(x, 0.25, 0.375),
  mitchell: (x) => bc(x, 1 / 3, 1 / 3),
  catmull: (x) => bc(x, 0, 0.5),
  bspline: (x) => bc(x, 1, 0),
  lanczos2: (x) => (Math.abs(x) < 2 ? sinc(x) * sinc(x / 2) : 0),
  lanczos3: (x) => (Math.abs(x) < 3 ? sinc(x) * sinc(x / 3) : 0),
  box: (x) => (Math.abs(x) < 0.5 ? 1 : 0),
};
function weights(i, sc, srcLen, kernel, h = 1, phi = 0) {
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
// Resample 2D với thang EXPLICIT (scX/scY) — model app-geom cần thang đều
// 1,2638889 cho cả 2 trục dù đích là 809x455 (rect.scale của app, L5 §2).
function resampleEx(rgb, srcW, srcH, dstW, dstH, kernel, h = 1, phiX = 0, phiY = 0, scX = null, scY = null) {
  scX = scX ?? dstW / srcW; scY = scY ?? dstH / srcH;
  const out = new Float64Array(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const tmp = new Float64Array(dstW * srcH);
    const wx = new Array(dstW);
    for (let i = 0; i < dstW; i++) wx[i] = weights(i, scX, srcW, kernel, h, phiX);
    for (let y = 0; y < srcH; y++) {
      const sRow = y * srcW, tRow = y * dstW;
      for (let i = 0; i < dstW; i++) {
        let acc = 0;
        for (const [j, w] of wx[i]) acc += w * pl[sRow + j];
        tmp[tRow + i] = acc;
      }
    }
    const wy = new Array(dstH);
    for (let i = 0; i < dstH; i++) wy[i] = weights(i, scY, srcH, kernel, h, phiY);
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
function weightsTable(srcLen, dstLen, kernel, h = 1, phi = 0) {
  const sc = dstLen / srcLen;
  const table = new Array(dstLen);
  for (let i = 0; i < dstLen; i++) table[i] = weights(i, sc, srcLen, kernel, h, phi);
  return table;
}
function applyRowTable(srcRow, table, x0, n) {
  const out = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    const ws = table[x0 + k];
    let acc = 0;
    for (let t = 0; t < ws.length; t++) acc += ws[t][1] * srcRow[ws[t][0]];
    out[k] = acc;
  }
  return out;
}
function madF(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}
function madChannel(a, b, ch) {
  let s = 0, n = 0;
  for (let i = ch; i < a.length; i += 3) { s += Math.abs(a[i] - b[i]); n++; }
  return +(s / n).toFixed(3);
}
const r3 = (x) => +x.toFixed(3);
function streamFrames(file, nFrames, onFrame) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-v", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
    const frameSize = W * H * 3;
    let buf = Buffer.alloc(0);
    let idx = 0;
    let err = "";
    ff.stdout.on("data", (d) => {
      buf = Buffer.concat([buf, d]);
      while (buf.length >= frameSize && idx < nFrames) {
        onFrame(idx, buf.subarray(0, frameSize));
        buf = buf.subarray(frameSize);
        idx++;
      }
    });
    ff.stderr.on("data", (d) => { err += d; });
    ff.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg stream ${path.basename(file)} exit ${code}: ${err.slice(-300)}`));
      if (idx !== nFrames) return reject(new Error(`ffmpeg stream ${path.basename(file)}: chỉ được ${idx}/${nFrames} frame`));
      resolve(idx);
    });
  });
}
function decodeOneFrame(file, t) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-v", "error", "-ss", String(t), "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
    const chunks = [];
    let err = "";
    ff.stdout.on("data", (d) => chunks.push(d));
    ff.stderr.on("data", (d) => { err += d; });
    ff.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg decode ${path.basename(file)}@${t} exit ${code}: ${err.slice(-300)}`));
      const buf = Buffer.concat(chunks);
      if (buf.length !== W * H * 3) return reject(new Error(`ffmpeg frame ngắn: ${buf.length}`));
      resolve(buf);
    });
  });
}
const b64buf = (s) => Buffer.from(s, "base64");

async function main() {
  const res = { generatedAt: new Date().toISOString(), F2a_sweepClean: {}, F2b_phase: {}, F2c_appGeomAB: {} };
  // ---------- F2a + F2b: sweep trên frame sạch ----------
  for (const dir of ["v", "h"]) {
    const sw = PROBE.sweeps[dir];
    const clip = dir === "v" ? path.join(MEDIA, "impulse-v-640.mp4") : path.join(MEDIA, "impulse-h-640.mp4");
    const nFrames = dir === "v" ? 640 : 360;
    const srcLen = dir === "v" ? 640 : 360;
    const dstLen = dir === "v" ? 809 : 455;
    const ffWin = {};
    await streamFrames(clip, nFrames, (idx, frame) => {
      if (dir === "v") {
        const row = [];
        for (let x = Math.max(0, idx - 12); x <= Math.min(639, idx + 12); x++) row.push(frame[(180 * 640 + x) * 3]);
        ffWin[idx] = { x0: Math.max(0, idx - 12), row };
      } else {
        const col = [];
        for (let y = Math.max(0, idx - 12); y <= Math.min(359, idx + 12); y++) col.push(frame[(y * 640 + 320) * 3]);
        ffWin[idx] = { y0: Math.max(0, idx - 12), col };
      }
    });
    const tables = {};
    for (const [kname, kfn] of Object.entries(KERNELS)) tables[kname] = weightsTable(srcLen, dstLen, kfn, 1, 0);
    const tablesPhi = {};
    for (const phi of [-0.0625, -0.044, -0.03, 0]) tablesPhi[phi] = weightsTable(srcLen, dstLen, KERNELS.tri, 1, phi);
    const fitAgg = {};
    for (const kname of Object.keys(KERNELS)) fitAgg[kname] = { sum: 0, n: 0 };
    const fitPhi = {};
    for (const phi of Object.keys(tablesPhi)) fitPhi[phi] = { sum: 0, n: 0 };
    const gridTables = [];
    for (const B of [0, 0.125, 0.25, 1 / 3, 0.5]) for (const C of [0, 0.25, 1 / 3, 0.375, 0.5]) {
      gridTables.push({ B, C, table: weightsTable(srcLen, dstLen, (x) => bc(x, B, C), 1, 0), sum: 0, n: 0 });
    }
    // F2b: centroid lệch theo pha (16 bin).
    const phaseBins = Array.from({ length: 16 }, () => ({ sum: 0, n: 0, sumAbs: 0 }));
    let nClean = 0, nBadPeak = 0, nBadDec = 0, nEdge = 0;
    const offHist = {};
    for (const fr of sw.frames) {
      const f = fr.f;
      if (f < 16 || (dir === "v" ? f > 623 : f > 343)) { nEdge++; continue; }
      const s0w = fr.s0win, bvw = fr.bvwin;
      let bi = 0;
      for (let i = 1; i < s0w.n; i++) if (s0w.vals[i * 4] > s0w.vals[bi * 4]) bi = i;
      const peakOff = (s0w.x0 ?? s0w.y0) + bi - f;
      offHist[peakOff] = (offHist[peakOff] || 0) + 1;
      if (peakOff !== 0) { nBadPeak++; continue; }
      const fw = ffWin[f];
      const fvals = dir === "v" ? fw.row : fw.col;
      let dm = 0; const dn = Math.min(fvals.length, s0w.n);
      for (let i = 0; i < dn; i++) dm += Math.abs(s0w.vals[i * 4] - fvals[i]);
      if (dm / dn >= 0.5) { nBadDec++; continue; }
      nClean++;
      const full = new Float64Array(srcLen).fill(128);
      const x0s = s0w.x0 ?? s0w.y0;
      for (let i = 0; i < s0w.n; i++) full[x0s + i] = s0w.vals[i * 4];
      const x0d = bvw.x0 ?? bvw.y0;
      for (const [kname] of Object.entries(KERNELS)) {
        const pred = applyRowTable(full, tables[kname], x0d, bvw.n);
        let s = 0;
        for (let i = 0; i < bvw.n; i++) s += Math.abs(pred[i] - bvw.vals[i * 4]);
        fitAgg[kname].sum += s / bvw.n; fitAgg[kname].n++;
      }
      for (const [phi, tab] of Object.entries(tablesPhi)) {
        const pred = applyRowTable(full, tab, x0d, bvw.n);
        let s = 0;
        for (let i = 0; i < bvw.n; i++) s += Math.abs(pred[i] - bvw.vals[i * 4]);
        fitPhi[phi].sum += s / bvw.n; fitPhi[phi].n++;
      }
      for (const g of gridTables) {
        const pred = applyRowTable(full, g.table, x0d, bvw.n);
        for (let i = 0; i < bvw.n; i++) g.sum += Math.abs(pred[i] - bvw.vals[i * 4]);
        g.n += bvw.n;
      }
      // F2b: centroid của profile Bview (trừ nền 128) so với centroid tri.
      const meas = new Float64Array(bvw.n);
      for (let i = 0; i < bvw.n; i++) meas[i] = bvw.vals[i * 4] - 128;
      const triPred = applyRowTable(full, tables.tri, x0d, bvw.n);
      const centroid = (arr) => {
        let ws = 0, ms = 0;
        for (let i = 0; i < arr.length; i++) { const v = arr[i] - 128; if (v > 0) { ws += v * (x0d + i); ms += v; } }
        return ms > 0 ? ws / ms : NaN;
      };
      const measRow = Float64Array.from({ length: bvw.n }, (_, i) => bvw.vals[i * 4]);
      const cMeas = centroid(measRow);
      const cTri = centroid(triPred);
      if (Number.isFinite(cMeas) && Number.isFinite(cTri)) {
        const phase = (((f + 0.5) * dstLen / srcLen) % 1);
        const bin = Math.min(15, Math.floor(phase * 16));
        phaseBins[bin].sum += (cMeas - cTri);
        phaseBins[bin].sumAbs += Math.abs(cMeas - cTri);
        phaseBins[bin].n++;
      }
    }
    const fitSorted = Object.entries(fitAgg).map(([k, v]) => [k, +(v.sum / v.n).toFixed(3)]).sort((a, b) => a[1] - b[1]);
    const gridSorted = gridTables.map((g) => ({ B: +g.B.toFixed(4), C: +g.C.toFixed(4), mad: +(g.sum / g.n).toFixed(3) })).sort((a, b) => a.mad - b.mad);
    res.F2a_sweepClean[dir] = {
      framesTotal: sw.frames.length, framesUsed: nClean, badPeakOffByOne: nBadPeak, badDecode: nBadDec, edgeSkipped: nEdge, peakOffHist: offHist,
      kernelFitMad: Object.fromEntries(fitSorted), bestKernel: fitSorted[0],
      triPhiFit: Object.fromEntries(Object.entries(fitPhi).map(([p, v]) => [p, +(v.sum / v.n).toFixed(3)])),
      gridTop5: gridSorted.slice(0, 5),
    };
    res.F2b_phase[dir] = phaseBins.map((b, i) => ({ bin: i, phaseLo: +(i / 16).toFixed(3), n: b.n, meanCentroidShift: b.n ? +((b.sum / b.n).toFixed(3)) : null, meanAbsShift: b.n ? +((b.sumAbs / b.n).toFixed(3)) : null }));
    console.log(`sweep-${dir} SẠCH: dùng ${nClean}/${sw.frames.length} frame (lệch đỉnh ${nBadPeak}, decode xấu ${nBadDec}, biên ${nEdge}); fit tốt nhất ${fitSorted[0][0]} ${fitSorted[0][1]} (tri ${Object.fromEntries(fitSorted).tri}, Mitchell ${Object.fromEntries(fitSorted).mitchell}); tri-phi ${JSON.stringify(res.F2a_sweepClean[dir].triPhiFit)}; grid tốt nhất (B=${gridSorted[0].B}, C=${gridSorted[0].C}) ${gridSorted[0].mad}`);
    console.log(`  phase bins (mean centroid shift): ${JSON.stringify(res.F2b_phase[dir].map((b) => b.meanCentroidShift))}`);
  }

  // ---------- F2c: A/B hình học app ĐÚNG ----------
  console.log("== F2c. app-geom đúng (thang đều 1,2638889, phiX -0,044) ==");
  const APP_SCALE = PROBE.appScale, APP_OFFX = PROBE.appOffX;
  const PHI_X_APP = -APP_OFFX / APP_SCALE;
  const statics = PROBE.statics;
  for (const name of Object.keys(statics)) {
    const S0 = b64buf(statics[name].caps.native.rgbB64);
    const Bapp = b64buf(statics[name].caps.app1264.rgbB64);
    const C2app = b64buf(statics[name].caps.apptwo1264.rgbB64);
    const ff = await decodeOneFrame(CLIP_FILE[name], CLIP_T[name]);
    const r = { Bapp_vs: {}, C2app_vs: {} };
    for (const phi of [-0.0625, PHI_X_APP, -0.03, 0]) {
      r.Bapp_vs[`tri_phi${+phi.toFixed(4)}`] = madF(Float64Array.from(Bapp), resampleEx(S0, W, H, 809, 455, KERNELS.tri, 1, phi, 0, APP_SCALE, APP_SCALE));
    }
    r.Bapp_vs.mitchell_phiApp = madF(Float64Array.from(Bapp), resampleEx(S0, W, H, 809, 455, KERNELS.mitchell, 1, PHI_X_APP, 0, APP_SCALE, APP_SCALE));
    r.Bapp_vs.bc_phiApp = madF(Float64Array.from(Bapp), resampleEx(S0, W, H, 809, 455, KERNELS.bc0250375, 1, PHI_X_APP, 0, APP_SCALE, APP_SCALE));
    r.C2app_vs.mitchell_phiApp = madF(Float64Array.from(C2app), resampleEx(S0, W, H, 809, 455, KERNELS.mitchell, 1, PHI_X_APP, 0, APP_SCALE, APP_SCALE));
    r.C2app_vs.tri_phiApp = madF(Float64Array.from(C2app), resampleEx(S0, W, H, 809, 455, KERNELS.tri, 1, PHI_X_APP, 0, APP_SCALE, APP_SCALE));
    // A/B vs render Mitchell(ffmpeg) đúng hình học app.
    const mitFfApp = resampleEx(ff, W, H, 809, 455, KERNELS.mitchell, 1, PHI_X_APP, 0, APP_SCALE, APP_SCALE);
    r.AB_vs_Mitchell_ff_appGeom = {
      direct_Bapp: madF(Float64Array.from(Bapp), mitFfApp),
      twoStep_C2app: madF(Float64Array.from(C2app), mitFfApp),
    };
    // Đối chứng: Bapp/C2app vs model dùng thang cũ sai (809/640) để thấy
    // mức sai nếu dùng thang cũ (L5: hình học cũ gây ~1,2 MAD ở sharp).
    r.C2app_vs_mitchell_wrongScale = madF(Float64Array.from(C2app), resampleEx(S0, W, H, 809, 455, KERNELS.mitchell, 1, 0, 0));
    res.F2c_appGeomAB[name] = r;
    console.log(`  ${name}: Bapp vs tri phi -0,0625 ${r.Bapp_vs["tri_phi-0.0625"]} / phiApp ${r.Bapp_vs[`tri_phi${+PHI_X_APP.toFixed(4)}`]} / phi0 ${r.Bapp_vs.tri_phi0} | Bapp vs Mitchell ${r.Bapp_vs.mitchell_phiApp} | C2app vs Mitchell ${r.C2app_vs.mitchell_phiApp} (thang cũ sai: ${r.C2app_vs_mitchell_wrongScale}) | A/B vs Mitchell ff: direct ${r.AB_vs_Mitchell_ff_appGeom.direct_Bapp} vs two-step ${r.AB_vs_Mitchell_ff_appGeom.twoStep_C2app}`);
  }
  writeFileEpermRetry(OUT, JSON.stringify(res, null, 2));
  console.log(`ghi ${OUT}`);
}
main().catch((e) => { console.error("FOLLOWUP LỖI:", e); process.exit(2); });
