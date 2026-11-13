#!/usr/bin/env node
/**
 * r85m10-video-scaler-analyze.mjs — Phase 9 đợt 85, luồng M10: phân tích
 * probe scaler video (r85m10-probe.json) + frame tham chiếu ffmpeg.
 *
 * Tách delta lineart 5,39/4,05 (L5) theo khâu:
 *  A. decode: S0 (video→native 1:1) vs ffmpeg decode cùng frame.
 *  B. scale: Bview (video→viewport trực tiếp) vs kernel trên S0 thật
 *     (tri/BC/Mitchell/Catmull/B-spline/Lanczos/Gauss/box + grid fit
 *     (B,C) kiểu J2 + quét phi) — kernel nào khớp scaler video?
 *  C. A/B hướng sửa: two-step (video→native rồi canvas→viewport, cùng
 *     2 chặng như đường sharp) vs direct, cùng so với mô hình render
 *     Mitchell(ffmpeg) — ở hình học sạch 809x455 và hình học app thật
 *     (rect.scale 1,2638889 + phiX -0,044, L5 §2).
 *  D. thang khác: s=2,0 và s=0,632 (kernel có phụ thuộc thang?).
 *  E. color-convert: xung ĐỎ — fit kernel theo từng kênh R/G/B (scaler
 *     video có tách mặt phẳng Y/UV như libyuv?).
 *  F. sweep xung dọc/ngang: đáp ứng xung trực tiếp của scaler video,
 *     fit 1D trên 1000 frame (kiểu J2 §2.3 nhưng nguồn video).
 *  G. đáp ứng bước (step 64→192): overshoot đo được vs kernel.
 *
 * Kernel/resample: phỏng theo r84l5-video-kernel-fit.mjs (L5) + BC của
 * chrome-resample.mjs; MAD float-model vs uint8 Chrome như L5 để số so
 * được trực tiếp với 5,61/4,25 của L5.
 * Chạy: node apps/web/scripts/r85m10-video-scaler-analyze.mjs
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
const OUT = path.join(M10, "r85m10-analysis.json");
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

// ---------- kernel (như L5 / chrome-resample.mjs) ----------
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
  gauss08: (x) => Math.exp(-(x * x) / (2 * 0.8 * 0.8)) * (Math.abs(x) < 2 ? 1 : 0),
  gauss10: (x) => Math.exp(-(x * x) / 2) * (Math.abs(x) < 2 ? 1 : 0),
  gauss12: (x) => Math.exp(-(x * x) / (2 * 1.2 * 1.2)) * (Math.abs(x) < 2.4 ? 1 : 0),
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
function resample(rgb, srcW, srcH, dstW, dstH, kernel, h = 1, phiX = 0, phiY = 0) {
  const scX = dstW / srcW, scY = dstH / srcH;
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
// Resample 1D một hàng (dùng cho sweep): srcRow Float64Array, dstLen.
function resampleRow1D(srcRow, srcLen, dstLen, kernel, h = 1, phi = 0) {
  const sc = dstLen / srcLen;
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    const ws = weights(i, sc, srcLen, kernel, h, phi);
    let acc = 0;
    for (const [j, w] of ws) acc += w * srcRow[j];
    out[i] = acc;
  }
  return out;
}
// Bảng trọng số 1D tính MỘT lần rồi tái dùng cho mọi frame sweep (trọng số
// chỉ phụ thuộc (srcLen, dstLen, kernel, phi), không phụ thuộc dữ liệu).
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
function madUint8(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}
const r3 = (x) => +x.toFixed(3);

// ---------- ffmpeg ----------
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
      if (buf.length !== W * H * 3) return reject(new Error(`ffmpeg frame ${path.basename(file)}@${t}: ${buf.length} byte, kỳ vọng ${W * H * 3}`));
      resolve(buf);
    });
  });
}
// Stream toàn bộ frame của clip, gọi onFrame(idx, Buffer) cho mỗi frame.
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

function b64buf(s) { return Buffer.from(s, "base64"); }

async function main() {
  const res = { generatedAt: new Date().toISOString(), ua: PROBE.ua, A_decode: {}, B_kernelFit1264: {}, C_abVsRender: {}, D_otherScales: {}, E_redChannel: {}, F_sweep: {}, G_step: {} };
  const statics = PROBE.statics;
  const names = Object.keys(statics);
  const ffFrames = {};

  // ---------- A. decode ----------
  console.log("== A. decode: S0 (video->native 1:1) vs ffmpeg ==");
  for (const name of names) {
    const S0 = b64buf(statics[name].caps.native.rgbB64);
    const ff = await decodeOneFrame(CLIP_FILE[name], CLIP_T[name]);
    ffFrames[name] = ff;
    const a = {
      mad: madUint8(S0, ff),
      madR: madChannel(S0, ff, 0), madG: madChannel(S0, ff, 1), madB: madChannel(S0, ff, 2),
      meanS0: statics[name].caps.native.mean, meanFf: +(Array.from(ff).reduce((s, v) => s + v, 0) / ff.length).toFixed(2),
    };
    res.A_decode[name] = a;
    console.log(`  ${name}: MAD ${a.mad} (R ${a.madR} / G ${a.madG} / B ${a.madB}) mean S0 ${a.meanS0} vs ff ${a.meanFf}`);
  }

  // ---------- B. kernel fit 1264 (sạch) + C. A/B vs render ----------
  console.log("== B+C. kernel fit Bview/C2 vs S0 + A/B vs Mitchell(ffmpeg), s=1,264 ==");
  const APP_SCALE = PROBE.appScale, APP_OFFX = PROBE.appOffX;
  const PHI_X_APP = -APP_OFFX / APP_SCALE; // -0,044 (L5 §2)
  for (const name of names) {
    const S0 = b64buf(statics[name].caps.native.rgbB64);
    const Bview = b64buf(statics[name].caps.direct1264.rgbB64);
    const C2 = b64buf(statics[name].caps.two1264.rgbB64);
    const Bapp = b64buf(statics[name].caps.app1264.rgbB64);
    const C2app = b64buf(statics[name].caps.apptwo1264.rgbB64);
    const ff = ffFrames[name];
    const fitB = {}, fitC = {};
    for (const [kname, kfn] of Object.entries(KERNELS)) {
      const m = resample(S0, W, H, 809, 455, kfn, 1);
      fitB[kname] = madF(Float64Array.from(Bview), m);
      fitC[kname] = madF(Float64Array.from(C2), m);
    }
    // phi sweep trên tri/Mitchell cho Bview (L5: phi=0 là cực tiểu sắc).
    const phiSweep = {};
    for (const phi of [-0.125, -0.0625, 0, 0.0625, 0.125]) {
      phiSweep[`tri_phi${phi}`] = madF(Float64Array.from(Bview), resample(S0, W, H, 809, 455, KERNELS.tri, 1, phi, phi));
      phiSweep[`mitchell_phi${phi}`] = madF(Float64Array.from(Bview), resample(S0, W, H, 809, 455, KERNELS.mitchell, 1, phi, phi));
    }
    res.B_kernelFit1264[name] = { Bview_vs_kernelOnS0: fitB, C2_vs_kernelOnS0: fitC, phiSweep };
    const bestB = Object.entries(fitB).sort((a, b) => a[1] - b[1])[0];
    const bestC = Object.entries(fitC).sort((a, b) => a[1] - b[1])[0];
    console.log(`  ${name}: Bview tốt nhất ${bestB[0]} ${bestB[1]} (Mitchell ${fitB.mitchell}, tri ${fitB.tri}) | C2 tốt nhất ${bestC[0]} ${bestC[1]} (Mitchell ${fitC.mitchell})`);

    // C. A/B vs mô hình render Mitchell(ffmpeg), hình học sạch + app.
    const mitFf = resample(ff, W, H, 809, 455, KERNELS.mitchell, 1);
    const mitFfApp = resample(ff, W, H, 809, 455, KERNELS.mitchell, 1, PHI_X_APP, 0);
    const mitS0 = resample(S0, W, H, 809, 455, KERNELS.mitchell, 1);
    const mitS0App = resample(S0, W, H, 809, 455, KERNELS.mitchell, 1, PHI_X_APP, 0);
    const ab = {
      clean: {
        direct_vs_Mitchell_ff: madF(Float64Array.from(Bview), mitFf),
        twoStep_vs_Mitchell_ff: madF(Float64Array.from(C2), mitFf),
        direct_vs_Mitchell_S0: madF(Float64Array.from(Bview), mitS0),
        twoStep_vs_Mitchell_S0: madF(Float64Array.from(C2), mitS0),
      },
      appGeom: {
        direct_vs_Mitchell_ff: madF(Float64Array.from(Bapp), mitFfApp),
        twoStep_vs_Mitchell_ff: madF(Float64Array.from(C2app), mitFfApp),
        direct_vs_Mitchell_S0: madF(Float64Array.from(Bapp), mitS0App),
        twoStep_vs_Mitchell_S0: madF(Float64Array.from(C2app), mitS0App),
      },
    };
    res.C_abVsRender[name] = ab;
    console.log(`  ${name} A/B sạch: direct ${ab.clean.direct_vs_Mitchell_ff} vs two-step ${ab.clean.twoStep_vs_Mitchell_ff} (vs Mitchell ff) | app-geom: direct ${ab.appGeom.direct_vs_Mitchell_ff} vs two-step ${ab.appGeom.twoStep_vs_Mitchell_ff}`);
  }

  // ---------- D. thang khác ----------
  console.log("== D. thang s=2,0 và s=0,632: fit tri/Mitchell/BC + A/B ==");
  for (const name of names) {
    const S0 = b64buf(statics[name].caps.native.rgbB64);
    const ff = ffFrames[name];
    const d = {};
    for (const [key, dw, dh, capD, capT] of [["s2000", 1280, 720, "direct2000", "two2000"], ["s0632", 405, 228, "direct0632", "two0632"]]) {
      const Bv = b64buf(statics[name].caps[capD].rgbB64);
      const C2v = b64buf(statics[name].caps[capT].rgbB64);
      const fit = {};
      for (const kname of ["tri", "bc0250375", "mitchell"]) {
        const m = resample(S0, W, H, dw, dh, KERNELS[kname], 1);
        fit[`Bview_vs_${kname}`] = madF(Float64Array.from(Bv), m);
        fit[`C2_vs_${kname}`] = madF(Float64Array.from(C2v), m);
      }
      const mitFf = resample(ff, W, H, dw, dh, KERNELS.mitchell, 1);
      fit.direct_vs_Mitchell_ff = madF(Float64Array.from(Bv), mitFf);
      fit.twoStep_vs_Mitchell_ff = madF(Float64Array.from(C2v), mitFf);
      d[key] = fit;
      console.log(`  ${name} ${key}: Bview tri ${fit.Bview_vs_tri} / BC ${fit.Bview_vs_bc0250375} / Mitchell ${fit.Bview_vs_mitchell} | A/B vs Mitchell ff: direct ${fit.direct_vs_Mitchell_ff} vs two-step ${fit.twoStep_vs_Mitchell_ff}`);
    }
    res.D_otherScales[name] = d;
  }

  // ---------- E. xung đỏ theo kênh ----------
  console.log("== E. impulse-red: fit kernel theo từng kênh ==");
  {
    const name = "impulse-red-640";
    const S0 = b64buf(statics[name].caps.native.rgbB64);
    const Bview = b64buf(statics[name].caps.direct1264.rgbB64);
    const C2 = b64buf(statics[name].caps.two1264.rgbB64);
    const e = { Bview: {}, C2: {} };
    for (const [kname, kfn] of Object.entries(KERNELS)) {
      const m = resample(S0, W, H, 809, 455, kfn, 1);
      e.Bview[kname] = [madChannel(Float64Array.from(Bview), m, 0), madChannel(Float64Array.from(Bview), m, 1), madChannel(Float64Array.from(Bview), m, 2)];
      e.C2[kname] = [madChannel(Float64Array.from(C2), m, 0), madChannel(Float64Array.from(C2), m, 1), madChannel(Float64Array.from(C2), m, 2)];
    }
    // Profile hàng y=228 qua cột đỏ (x=400..412) theo kênh, Bview vs tri/Mitchell.
    const prof = { y: 228, x0: 398, cols: [] };
    const tri = resample(S0, W, H, 809, 455, KERNELS.tri, 1);
    const mit = resample(S0, W, H, 809, 455, KERNELS.mitchell, 1);
    for (let dx = -6; dx <= 6; dx++) {
      const x = 405 + dx;
      const at = (buf, ch) => buf[(228 * 809 + x) * 3 + ch];
      prof.cols.push({ dx, BviewR: at(Bview, 0), BviewG: at(Bview, 1), BviewB: at(Bview, 2), triR: r3(tri[(228 * 809 + x) * 3]), triG: r3(tri[(228 * 809 + x) * 3 + 1]), mitR: r3(mit[(228 * 809 + x) * 3]), mitG: r3(mit[(228 * 809 + x) * 3 + 1]) });
    }
    e.profile = prof;
    res.E_redChannel = e;
    console.log(`  Bview vs tri theo kênh R/G/B: ${e.Bview.tri} | vs Mitchell: ${e.Bview.mitchell}`);
    console.log(`  C2 vs Mitchell theo kênh R/G/B: ${e.C2.mitchell}`);
    console.log(`  profile cols: ${JSON.stringify(prof.cols)}`);
  }

  // ---------- F. sweep xung ----------
  console.log("== F. sweep xung dọc/ngang (1D fit trên window) ==");
  for (const dir of ["v", "h"]) {
    const sw = PROBE.sweeps[dir];
    const clip = dir === "v" ? path.join(MEDIA, "impulse-v-640.mp4") : path.join(MEDIA, "impulse-h-640.mp4");
    const nFrames = dir === "v" ? 640 : 360;
    // Decode check: S0 window của probe vs ffmpeg frame cùng f (chỉ MAD
    // window + vị trí đỉnh). Gom frame ffmpeg vào map theo f (chỉ giữ
    // window hàng/cột giữa, không giữ cả frame).
    const ffWin = {};
    await streamFrames(clip, nFrames, (idx, frame) => {
      if (dir === "v") {
        const row = [];
        for (let x = Math.max(0, idx - 12); x <= Math.min(639, idx + 12); x++) { row.push(frame[(180 * 640 + x) * 3]); }
        ffWin[idx] = { x0: Math.max(0, idx - 12), row };
      } else {
        const col = [];
        for (let y = Math.max(0, idx - 12); y <= Math.min(359, idx + 12); y++) { col.push(frame[(y * 640 + 320) * 3]); }
        ffWin[idx] = { y0: Math.max(0, idx - 12), col };
      }
    });
    let decMadSum = 0, decN = 0, peakMiss = 0;
    const fitAgg = {};
    for (const kname of Object.keys(KERNELS)) fitAgg[kname] = { sum: 0, n: 0 };
    const profiles = {};
    let tables = null; // bảng trọng số 1D, tính 1 lần/hướng (xem weightsTable)
    for (const fr of sw.frames) {
      const f = fr.f;
      if (f < 16 || (dir === "v" ? f > 623 : f > 343)) continue; // tránh biên window
      const s0w = fr.s0win, bvw = fr.bvwin;
      const s0vals = new Float64Array(s0w.n);
      for (let i = 0; i < s0w.n; i++) s0vals[i] = s0w.vals[i * 4]; // kênh R (xám: R=G=B)
      // decode check: đỉnh S0 phải ở giữa window (vị trí f).
      const peakOff = (() => { let bi = 0; for (let i = 1; i < s0w.n; i++) if (s0w.vals[i * 4] > s0w.vals[bi * 4]) bi = i; return (s0w.x0 ?? s0w.y0) + bi - f; })();
      if (peakOff !== 0) peakMiss++;
      const fw = ffWin[f];
      const fvals = dir === "v" ? fw.row : fw.col;
      let dm = 0; const dn = Math.min(fvals.length, s0w.n);
      for (let i = 0; i < dn; i++) dm += Math.abs(s0w.vals[i * 4] - fvals[i]);
      decMadSum += dm / dn; decN++;
      // fit 1D: resample hàng S0 (độ dài s0w.n, coi như cửa sổ nguồn) —
      // cần map đúng: window nguồn bắt đầu tại x0s, window đích bắt đầu
      // tại x0d; resample 1D trên toàn bộ hàng nguồn sẽ đúng hơn, nên
      // tái tạo hàng nguồn đầy đủ: ngoài window = 128 (nền đã biết).
      const srcLen = dir === "v" ? 640 : 360;
      const full = new Float64Array(srcLen).fill(128);
      const x0s = s0w.x0 ?? s0w.y0;
      for (let i = 0; i < s0w.n; i++) full[x0s + i] = s0w.vals[i * 4];
      const dstLen = dir === "v" ? 809 : 455; // sweep-h: cửa sổ dọc, 360 -> 455
      // Bảng trọng số tính 1 lần/hướng/kernel (đắt nếu tính lại mỗi frame).
      if (!tables) {
        tables = {};
        for (const [kname, kfn] of Object.entries(KERNELS)) tables[kname] = weightsTable(srcLen, dstLen, kfn, 1, 0);
      }
      for (const [kname] of Object.entries(KERNELS)) {
        const pred = applyRowTable(full, tables[kname], bvw.x0 ?? bvw.y0, bvw.n);
        let s = 0;
        for (let i = 0; i < bvw.n; i++) s += Math.abs(pred[i] - bvw.vals[i * 4]);
        fitAgg[kname].sum += s / bvw.n; fitAgg[kname].n++;
      }
      // Lưu profile đại diện ở vài pha: f=100, 320 (đọc sau).
      if ([100, 320].includes(f) && dir === "v") {
        const cx = Math.round((f + 0.5) * 809 / 640);
        const pred = {};
        for (const kname of ["tri", "mitchell", "bc0250375"]) {
          const p = applyRowTable(full, tables[kname], cx - 6, 13);
          pred[kname] = Array.from(p, (v) => r3(v));
        }
        const meas = Array.from({ length: 13 }, (_, i) => bvw.vals[(cx - 6 - (bvw.x0 ?? 0) + i) * 4]);
        profiles[`f${f}`] = { cx, phase: +(((f + 0.5) * 809 / 640) % 1).toFixed(3), meas, pred };
      }
    }
    // Grid fit (B,C) trên sweep (1D): B x C như J2, bảng trọng số tính 1 lần.
    const grid = [];
    for (const B of [0, 0.125, 0.25, 1 / 3, 0.5]) {
      for (const C of [0, 0.25, 1 / 3, 0.375, 0.5]) {
        const srcLen = dir === "v" ? 640 : 360;
        const dstLen = dir === "v" ? 809 : 455;
        const table = weightsTable(srcLen, dstLen, (x) => bc(x, B, C), 1, 0);
        let sum = 0, n = 0;
        for (const fr of sw.frames) {
          const f = fr.f;
          if (f < 16 || (dir === "v" ? f > 623 : f > 343)) continue;
          const s0w = fr.s0win, bvw = fr.bvwin;
          const full = new Float64Array(srcLen).fill(128);
          const x0s = s0w.x0 ?? s0w.y0;
          for (let i = 0; i < s0w.n; i++) full[x0s + i] = s0w.vals[i * 4];
          const pred = applyRowTable(full, table, bvw.x0 ?? bvw.y0, bvw.n);
          for (let i = 0; i < bvw.n; i++) sum += Math.abs(pred[i] - bvw.vals[i * 4]);
          n += bvw.n;
        }
        grid.push({ B: +B.toFixed(4), C: +C.toFixed(4), mad: +(sum / n).toFixed(3) });
      }
    }
    grid.sort((a, b) => a.mad - b.mad);
    const fitSorted = Object.entries(fitAgg).map(([k, v]) => [k, +(v.sum / v.n).toFixed(3)]).sort((a, b) => a[1] - b[1]);
    res.F_sweep[dir] = {
      decodeWindowMad: +(decMadSum / decN).toFixed(3), peakMissFrames: peakMiss, framesUsed: decN,
      kernelFitMad: Object.fromEntries(fitSorted), bestKernel: fitSorted[0],
      gridTop5: grid.slice(0, 5), profiles,
    };
    console.log(`  sweep-${dir}: decode window MAD ${res.F_sweep[dir].decodeWindowMad}, peak miss ${peakMiss}/${decN} | fit tốt nhất ${fitSorted[0][0]} ${fitSorted[0][1]} (tri ${Object.fromEntries(fitSorted).tri}, Mitchell ${Object.fromEntries(fitSorted).mitchell}) | grid tốt nhất (B=${grid[0].B}, C=${grid[0].C}) ${grid[0].mad}`);
    console.log(`  profiles: ${JSON.stringify(profiles)}`);
  }

  // ---------- G. đáp ứng bước ----------
  console.log("== G. step 64->192: profile qua bước ==");
  {
    const name = "step-640";
    const S0 = b64buf(statics[name].caps.native.rgbB64);
    const Bview = b64buf(statics[name].caps.direct1264.rgbB64);
    const C2 = b64buf(statics[name].caps.two1264.rgbB64);
    const tri = resample(S0, W, H, 809, 455, KERNELS.tri, 1);
    const mit = resample(S0, W, H, 809, 455, KERNELS.mitchell, 1);
    const y = 228, cx = Math.round(320 * 809 / 640); // 404,5 -> 405
    const cols = [];
    for (let dx = -8; dx <= 8; dx++) {
      const x = cx + dx;
      cols.push({ dx, Bview: Bview[(y * 809 + x) * 3], C2: C2[(y * 809 + x) * 3], tri: r3(tri[(y * 809 + x) * 3]), mit: r3(mit[(y * 809 + x) * 3]) });
    }
    // Overshoot: min dưới 64 / max trên 192 trong vùng bước.
    const win = [];
    for (let x = cx - 12; x <= cx + 12; x++) win.push(Bview[(y * 809 + x) * 3]);
    res.G_step = { y, cx, cols, BviewMin: Math.min(...win), BviewMax: Math.max(...win) };
    console.log(`  Bview qua bước: min ${res.G_step.BviewMin} / max ${res.G_step.BviewMax} (bước 64->192); cols: ${JSON.stringify(cols)}`);
  }

  writeFileEpermRetry(OUT, JSON.stringify(res, null, 2));
  console.log(`ghi ${OUT}`);
}
main().catch((e) => { console.error("ANALYZE LỖI:", e); process.exit(2); });
