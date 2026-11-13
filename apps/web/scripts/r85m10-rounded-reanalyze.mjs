#!/usr/bin/env node
/**
 * r85m10-rounded-reanalyze.mjs — Phase 9 đợt 85, luồng M10 (SỬA PHƯƠNG PHÁP):
 * phân tích lần 1 so FLOAT-model với uint8 Chrome — sai quy ước J2/L5
 * (cả hai đều làm tròn + kẹp model về uint8 trước khi so: roundU8).
 * Trên nội dung 0/255 (lineart), Mitchell dự báo undershoot/overshoot
 * ngoài [0,255] và giá trị lẻ — float-vs-uint8 phồng MAD thêm ~0,2–1,5.
 * Script này tính LẠI mọi số quyết định với round+clamp:
 *   a. E4 (tái lập J2): hàng/checker vs 6 kernel.
 *   b. Probe chính B: Bview/C2 vs tri/Mitchell/BC @1264 + quét phi.
 *   c. Probe chính C: A/B direct vs two-step so với Mitchell(ffmpeg),
 *      hình học sạch + hình học app đúng (thang đều 1,2638889, phi -0,044).
 *   d. Thang s=2,0 / s=0,632: A/B.
 *   e. E3 pattern tổng hợp vs Mitchell/tri.
 *   f. E2 putImageData vs Mitchell.
 *   g. Sweep frame sạch: fit 1D + tri-phi.
 *   h. Step profile.
 * Chạy: node apps/web/scripts/r85m10-rounded-reanalyze.mjs
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
const E2 = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-e2-probe.json"), "utf8"));
const E3 = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-e3-probe.json"), "utf8"));
const E4 = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-e4-probe.json"), "utf8"));
const OUT = path.join(M10, "r85m10-rounded.json");
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
const b64buf = (s) => Buffer.from(s, "base64");
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
function roundU8(v) { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; }
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
// Resample 2D, trả Uint8Array RGB24 ĐÃ làm tròn + kẹp (quy ước J2/L5).
function resampleU8(rgb, srcW, srcH, dstW, dstH, kernel, h = 1, phiX = 0, phiY = 0, scX = null, scY = null) {
  scX = scX ?? dstW / srcW; scY = scY ?? dstH / srcH;
  const out = Buffer.alloc(dstW * dstH * 3);
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
        out[(i * dstW + x) * 3 + c] = roundU8(acc);
      }
    }
  }
  return out;
}
function resampleRowU8(srcRow, dstLen, kernel, phi = 0) {
  const sc = dstLen / srcRow.length;
  const out = new Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of weights(i, sc, srcRow.length, kernel, 1, phi)) acc += w * srcRow[j];
    out[i] = roundU8(acc);
  }
  return out;
}
function weightsTable(srcLen, dstLen, kernel, h = 1, phi = 0) {
  const sc = dstLen / srcLen;
  const table = new Array(dstLen);
  for (let i = 0; i < dstLen; i++) table[i] = weights(i, sc, srcLen, kernel, h, phi);
  return table;
}
function applyRowTableU8(srcRow, table, x0, n) {
  const out = new Array(n);
  for (let k = 0; k < n; k++) {
    const ws = table[x0 + k];
    let acc = 0;
    for (let t = 0; t < ws.length; t++) acc += ws[t][1] * srcRow[ws[t][0]];
    out[k] = roundU8(acc);
  }
  return out;
}
function madU8(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}
function madRowsU8(measRows, predRow) {
  let s = 0, n = 0;
  for (const row of measRows) for (let i = 0; i < row.length; i++) { s += Math.abs(row[i] - predRow[i]); n++; }
  return +(s / n).toFixed(3);
}
function decodeOneFrame(file, t) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-v", "error", "-ss", String(t), "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
    const chunks = [];
    let err = "";
    ff.stdout.on("data", (d) => chunks.push(d));
    ff.stderr.on("data", (d) => { err += d; });
    ff.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg decode exit ${code}: ${err.slice(-300)}`));
      const buf = Buffer.concat(chunks);
      if (buf.length !== W * H * 3) return reject(new Error(`frame ngắn: ${buf.length}`));
      resolve(buf);
    });
  });
}
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
      if (code !== 0) return reject(new Error(`ffmpeg stream exit ${code}: ${err.slice(-300)}`));
      if (idx !== nFrames) return reject(new Error(`chỉ được ${idx}/${nFrames} frame`));
      resolve(idx);
    });
  });
}
function e4patternValue(kind, x, y) {
  switch (kind) {
    case "sqw4": return (Math.floor(x / 4) % 2 === 0) ? 64 : 192;
    case "sqw8": return (Math.floor(x / 8) % 2 === 0) ? 64 : 192;
    case "sqw4-hi": return (Math.floor(x / 4) % 2 === 0) ? 0 : 255;
    case "sqw4-lo": return (Math.floor(x / 4) % 2 === 0) ? 112 : 144;
    case "step": return x < 256 ? 64 : 192;
    case "impulse": return x === 256 ? 255 : 128;
    case "checker8": return ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) ? 64 : 192;
    default: throw new Error(kind);
  }
}

async function main() {
  const res = { generatedAt: new Date().toISOString(), method: "round+clamp uint8 (quy ước J2/L5)", a_e4: {}, b_main1264: {}, c_ab: {}, d_scales: {}, e_e3: {}, f_e2: {}, g_sweep: {}, h_step: {} };
  // ---------- a. E4 ----------
  console.log("== a. E4 tái lập J2 (round+clamp) ==");
  for (const [key, dw] of Object.entries({ s1132: 580, s1264: 647, s2000: 1024 })) {
    for (const kind of ["sqw4", "sqw8", "sqw4-hi", "sqw4-lo", "step", "impulse"]) {
      const cap = E4.captures[`${kind}@${key}`];
      const srcRow = new Float64Array(512);
      for (let x = 0; x < 512; x++) srcRow[x] = e4patternValue(kind, x, 0);
      const r = {};
      for (const [kname, kfn] of Object.entries(KERNELS)) r[kname] = madRowsU8(cap.rows, resampleRowU8(srcRow, dw, kfn));
      res.a_e4[`${kind}@${key}`] = r;
      const best = Object.entries(r).sort((x, y) => x[1] - y[1])[0];
      console.log(`  ${kind}@${key}: tốt nhất ${best[0]} ${best[1]} (tri ${r.tri} / Mitchell ${r.mitchell})`);
    }
    // checker8 2D.
    const cap = E4.captures[`checker8@${key}`];
    const got = Buffer.from(cap.rgbB64, "base64");
    const src = new Float64Array(512 * 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) src[y * 512 + x] = e4patternValue("checker8", x, y);
    const r = {};
    for (const [kname, kfn] of Object.entries(KERNELS)) {
      const tmp = new Float64Array(dw * 512);
      for (let y = 0; y < 512; y++) {
        const pr = resampleRowU8(src.subarray(y * 512, (y + 1) * 512), dw, kfn);
        for (let i = 0; i < dw; i++) tmp[y * dw + i] = pr[i];
      }
      let s = 0;
      for (let x = 0; x < dw; x++) {
        const col = new Float64Array(512);
        for (let y = 0; y < 512; y++) col[y] = tmp[y * dw + x];
        const pr = resampleRowU8(col, dw, kfn);
        for (let i = 0; i < dw; i++) s += Math.abs(got[(i * dw + x) * 3] - pr[i]);
      }
      r[kname] = +(s / (dw * dw)).toFixed(3);
    }
    res.a_e4[`checker8@${key}`] = r;
    console.log(`  checker8@${key}: tốt nhất ${Object.entries(r).sort((x, y) => x[1] - y[1])[0][0]} ${Object.entries(r).sort((x, y) => x[1] - y[1])[0][1]} (Mitchell ${r.mitchell})`);
  }
  const med = E4.captures["sqw4@s1132-medium"];
  const srcRow = new Float64Array(512);
  for (let x = 0; x < 512; x++) srcRow[x] = e4patternValue("sqw4", x, 0);
  res.a_e4.medium = { vsTri: madRowsU8(med.rows, resampleRowU8(srcRow, 580, KERNELS.tri)), vsMitchell: madRowsU8(med.rows, resampleRowU8(srcRow, 580, KERNELS.mitchell)) };
  console.log(`  medium sqw4@s1132: vs tri ${res.a_e4.medium.vsTri} | vs Mitchell ${res.a_e4.medium.vsMitchell}`);

  // ---------- b+c. probe chính ----------
  console.log("== b+c. probe chính (round+clamp) ==");
  const APP_SCALE = PROBE.appScale, APP_OFFX = PROBE.appOffX;
  const PHI_X_APP = -APP_OFFX / APP_SCALE;
  const PHIS = [-0.125, -0.0625, -0.044, -0.03125, -0.015625, 0, 0.015625, 0.03125, 0.0625, 0.125];
  for (const name of Object.keys(PROBE.statics)) {
    const S0 = b64buf(PROBE.statics[name].caps.native.rgbB64);
    const Bview = b64buf(PROBE.statics[name].caps.direct1264.rgbB64);
    const C2 = b64buf(PROBE.statics[name].caps.two1264.rgbB64);
    const Bapp = b64buf(PROBE.statics[name].caps.app1264.rgbB64);
    const C2app = b64buf(PROBE.statics[name].caps.apptwo1264.rgbB64);
    const ff = await decodeOneFrame(CLIP_FILE[name], CLIP_T[name]);
    const b = { Bview: {}, C2: {}, BviewPhiTri: {}, C2PhiMitchell: {} };
    for (const [kname, kfn] of Object.entries(KERNELS)) {
      b.Bview[kname] = madU8(Bview, resampleU8(S0, W, H, 809, 455, kfn));
      b.C2[kname] = madU8(C2, resampleU8(S0, W, H, 809, 455, kfn));
    }
    for (const phi of PHIS) {
      b.BviewPhiTri[phi] = madU8(Bview, resampleU8(S0, W, H, 809, 455, KERNELS.tri, 1, phi, phi));
      b.C2PhiMitchell[phi] = madU8(C2, resampleU8(S0, W, H, 809, 455, KERNELS.mitchell, 1, phi, phi));
    }
    res.b_main1264[name] = b;
    const bestB = Object.entries(b.Bview).sort((x, y) => x[1] - y[1])[0];
    const bestC = Object.entries(b.C2).sort((x, y) => x[1] - y[1])[0];
    console.log(`  ${name}: Bview tốt nhất ${bestB[0]} ${bestB[1]} (tri ${b.Bview.tri}, Mitchell ${b.Bview.mitchell}; phi tốt nhất ${Object.entries(b.BviewPhiTri).sort((x, y) => x[1] - y[1])[0][0]}=${Object.entries(b.BviewPhiTri).sort((x, y) => x[1] - y[1])[0][1]}) | C2 tốt nhất ${bestC[0]} ${bestC[1]} (Mitchell ${b.C2.mitchell}; phi tốt nhất ${Object.entries(b.C2PhiMitchell).sort((x, y) => x[1] - y[1])[0][0]}=${Object.entries(b.C2PhiMitchell).sort((x, y) => x[1] - y[1])[0][1]})`);
    // c. A/B vs Mitchell(ffmpeg), sạch + app-geom.
    const mitFf = resampleU8(ff, W, H, 809, 455, KERNELS.mitchell);
    const mitFfApp = resampleU8(ff, W, H, 809, 455, KERNELS.mitchell, 1, PHI_X_APP, 0, APP_SCALE, APP_SCALE);
    const c = {
      clean: { direct: madU8(Bview, mitFf), twoStep: madU8(C2, mitFf) },
      appGeom: { direct: madU8(Bapp, mitFfApp), twoStep: madU8(C2app, mitFfApp) },
    };
    res.c_ab[name] = c;
    console.log(`  ${name} A/B vs Mitchell(ff): sạch direct ${c.clean.direct} vs two-step ${c.clean.twoStep} | app-geom direct ${c.appGeom.direct} vs two-step ${c.appGeom.twoStep}`);
    // d. thang khác.
    const d = {};
    for (const [key, dw, dh, capD, capT] of [["s2000", 1280, 720, "direct2000", "two2000"], ["s0632", 405, 228, "direct0632", "two0632"]]) {
      const Bv = b64buf(PROBE.statics[name].caps[capD].rgbB64);
      const C2v = b64buf(PROBE.statics[name].caps[capT].rgbB64);
      const mitFf2 = resampleU8(ff, W, H, dw, dh, KERNELS.mitchell);
      d[key] = {
        Bview_vs_tri: madU8(Bv, resampleU8(S0, W, H, dw, dh, KERNELS.tri)),
        Bview_vs_mitchell: madU8(Bv, resampleU8(S0, W, H, dw, dh, KERNELS.mitchell)),
        C2_vs_mitchell: madU8(C2v, resampleU8(S0, W, H, dw, dh, KERNELS.mitchell)),
        AB_direct_vs_Mitchell_ff: madU8(Bv, mitFf2),
        AB_twoStep_vs_Mitchell_ff: madU8(C2v, mitFf2),
      };
    }
    res.d_scales[name] = d;
    console.log(`  ${name} s2000: Bview tri ${d.s2000.Bview_vs_tri} / Mitchell ${d.s2000.Bview_vs_mitchell} | A/B direct ${d.s2000.AB_direct_vs_Mitchell_ff} vs two-step ${d.s2000.AB_twoStep_vs_Mitchell_ff} || s0632: A/B direct ${d.s0632.AB_direct_vs_Mitchell_ff} vs two-step ${d.s0632.AB_twoStep_vs_Mitchell_ff}`);
  }

  // ---------- e. E3 ----------
  console.log("== e. E3 pattern (round+clamp) ==");
  for (const [key, cap] of Object.entries(E3.caps)) {
    const s0 = b64buf(cap.s0.rgbB64);
    const up = b64buf(cap.up.rgbB64);
    res.e_e3[key] = {
      vsMitchell: madU8(up, resampleU8(s0, 640, 360, cap.dw, cap.dh, KERNELS.mitchell)),
      vsTri: madU8(up, resampleU8(s0, 640, 360, cap.dw, cap.dh, KERNELS.tri)),
      vsBC: madU8(up, resampleU8(s0, 640, 360, cap.dw, cap.dh, KERNELS.bc0250375)),
    };
    console.log(`  ${key}: vs Mitchell ${res.e_e3[key].vsMitchell} | vs tri ${res.e_e3[key].vsTri} | vs BC ${res.e_e3[key].vsBC}`);
  }

  // ---------- f. E2 ----------
  console.log("== f. E2 putImageData (round+clamp) ==");
  const s0Of = (n) => b64buf(PROBE.statics[n].caps.native.rgbB64);
  for (const [key, cap] of Object.entries(E2.caps)) {
    if (cap.kind !== "put") continue;
    const srcName = cap.src === "lineart640-sharp10" ? "lineart640" : cap.src;
    const S0 = cap.src === "lineart640-sharp10"
      ? fs.readFileSync(path.join(M10, "raw-s0", "lineart640-sharp10.rgb"))
      : s0Of(srcName);
    const got = b64buf(cap.rgbB64);
    res.f_e2[key] = {
      vsMitchell: madU8(got, resampleU8(S0, W, H, 809, 455, KERNELS.mitchell)),
      vsTri: madU8(got, resampleU8(S0, W, H, 809, 455, KERNELS.tri)),
    };
    console.log(`  ${key}: vs Mitchell ${res.f_e2[key].vsMitchell} | vs tri ${res.f_e2[key].vsTri}`);
  }

  // ---------- g. sweep frame sạch (round+clamp 1D) ----------
  console.log("== g. sweep frame sạch (round+clamp 1D) ==");
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
    for (const phi of [-0.0625, -0.044, -0.03125, -0.015625, 0]) tablesPhi[phi] = weightsTable(srcLen, dstLen, KERNELS.tri, 1, phi);
    const fitAgg = {};
    for (const kname of Object.keys(KERNELS)) fitAgg[kname] = { sum: 0, n: 0 };
    const fitPhi = {};
    for (const phi of Object.keys(tablesPhi)) fitPhi[phi] = { sum: 0, n: 0 };
    const gridTables = [];
    for (const B of [0, 0.125, 0.25, 1 / 3, 0.5]) for (const C of [0, 0.25, 1 / 3, 0.375, 0.5]) {
      gridTables.push({ B, C, table: weightsTable(srcLen, dstLen, (x) => bc(x, B, C), 1, 0), sum: 0, n: 0 });
    }
    let nClean = 0;
    for (const fr of sw.frames) {
      const f = fr.f;
      if (f < 16 || (dir === "v" ? f > 623 : f > 343)) continue;
      const s0w = fr.s0win, bvw = fr.bvwin;
      let bi = 0;
      for (let i = 1; i < s0w.n; i++) if (s0w.vals[i * 4] > s0w.vals[bi * 4]) bi = i;
      if ((s0w.x0 ?? s0w.y0) + bi - f !== 0) continue;
      const fw = ffWin[f];
      const fvals = dir === "v" ? fw.row : fw.col;
      let dm = 0; const dn = Math.min(fvals.length, s0w.n);
      for (let i = 0; i < dn; i++) dm += Math.abs(s0w.vals[i * 4] - fvals[i]);
      if (dm / dn >= 0.5) continue;
      nClean++;
      const full = new Float64Array(srcLen).fill(128);
      const x0s = s0w.x0 ?? s0w.y0;
      for (let i = 0; i < s0w.n; i++) full[x0s + i] = s0w.vals[i * 4];
      const x0d = bvw.x0 ?? bvw.y0;
      for (const [kname] of Object.entries(KERNELS)) {
        const pred = applyRowTableU8(full, tables[kname], x0d, bvw.n);
        let s = 0;
        for (let i = 0; i < bvw.n; i++) s += Math.abs(pred[i] - bvw.vals[i * 4]);
        fitAgg[kname].sum += s / bvw.n; fitAgg[kname].n++;
      }
      for (const [phi, tab] of Object.entries(tablesPhi)) {
        const pred = applyRowTableU8(full, tab, x0d, bvw.n);
        let s = 0;
        for (let i = 0; i < bvw.n; i++) s += Math.abs(pred[i] - bvw.vals[i * 4]);
        fitPhi[phi].sum += s / bvw.n; fitPhi[phi].n++;
      }
      for (const g of gridTables) {
        const pred = applyRowTableU8(full, g.table, x0d, bvw.n);
        for (let i = 0; i < bvw.n; i++) g.sum += Math.abs(pred[i] - bvw.vals[i * 4]);
        g.n += bvw.n;
      }
    }
    const fitSorted = Object.entries(fitAgg).map(([k, v]) => [k, +(v.sum / v.n).toFixed(3)]).sort((a, b) => a[1] - b[1]);
    const gridSorted = gridTables.map((g) => ({ B: +g.B.toFixed(4), C: +g.C.toFixed(4), mad: +(g.sum / g.n).toFixed(3) })).sort((a, b) => a.mad - b.mad);
    res.g_sweep[dir] = {
      framesUsed: nClean,
      kernelFitMad: Object.fromEntries(fitSorted), bestKernel: fitSorted[0],
      triPhiFit: Object.fromEntries(Object.entries(fitPhi).map(([p, v]) => [p, +(v.sum / v.n).toFixed(3)])),
      gridTop5: gridSorted.slice(0, 5),
    };
    console.log(`  sweep-${dir} SẠCH (${nClean} frame): tốt nhất ${fitSorted[0][0]} ${fitSorted[0][1]} (tri ${Object.fromEntries(fitSorted).tri}, Mitchell ${Object.fromEntries(fitSorted).mitchell}); tri-phi ${JSON.stringify(res.g_sweep[dir].triPhiFit)}; grid tốt nhất (B=${gridSorted[0].B}, C=${gridSorted[0].C}) ${gridSorted[0].mad}`);
  }

  // ---------- h. step profile (round+clamp) ----------
  console.log("== h. step profile (round+clamp) ==");
  {
    const name = "step-640";
    const S0 = b64buf(PROBE.statics[name].caps.native.rgbB64);
    const Bview = b64buf(PROBE.statics[name].caps.direct1264.rgbB64);
    const C2 = b64buf(PROBE.statics[name].caps.two1264.rgbB64);
    const triM = resampleU8(S0, W, H, 809, 455, KERNELS.tri);
    const mitM = resampleU8(S0, W, H, 809, 455, KERNELS.mitchell);
    const y = 228, cx = 405;
    const cols = [];
    for (let dx = -8; dx <= 8; dx++) {
      const x = cx + dx;
      cols.push({ dx, Bview: Bview[(y * 809 + x) * 3], C2: C2[(y * 809 + x) * 3], tri: triM[(y * 809 + x) * 3], mit: mitM[(y * 809 + x) * 3] });
    }
    res.h_step = { y, cx, cols };
    console.log(`  cols: ${JSON.stringify(cols)}`);
  }

  writeFileEpermRetry(OUT, JSON.stringify(res, null, 2));
  console.log(`ghi ${OUT}`);
}
main().catch((e) => { console.error("REANALYZE LỖI:", e); process.exit(2); });
