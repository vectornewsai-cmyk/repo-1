#!/usr/bin/env node
/**
 * r85m10-e2-analyze.mjs — Phase 9 đợt 85, luồng M10 (phân tích E2): cùng
 * pixel lineart S0, canvas→canvas upscale có phải Mitchell? So 4 biến thể
 * putImageData (src/dst willReadFrequently 2x2) + sharpened + video-drawn
 * với model Mitchell(S0)/Mitchell(S2m) — và kiểm video control có tái lập
 * đúng C2 của probe chính (pixel-identical?).
 * Chạy: node apps/web/scripts/r85m10-e2-analyze.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M10 = path.join(GOAL, "round85-m10");
const E2 = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-e2-probe.json"), "utf8"));
const PROBE = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-probe.json"), "utf8"));
const OUT = path.join(M10, "r85m10-e2-analysis.json");
const W = 640, H = 360;
const b64buf = (s) => Buffer.from(s, "base64");
function bc(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const mitchell = (x) => bc(x, 1 / 3, 1 / 3);
const tri = (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; };
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
function resample(rgb, srcW, srcH, dstW, dstH, kernel) {
  const scX = dstW / srcW, scY = dstH / srcH;
  const out = new Float64Array(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const tmp = new Float64Array(dstW * srcH);
    for (let y = 0; y < srcH; y++) {
      for (let i = 0; i < dstW; i++) {
        let acc = 0;
        for (const [j, w] of weights(i, scX, srcW, kernel)) acc += w * pl[y * srcW + j];
        tmp[y * dstW + i] = acc;
      }
    }
    for (let x = 0; x < dstW; x++) {
      for (let i = 0; i < dstH; i++) {
        let acc = 0;
        for (const [j, w] of weights(i, scY, srcH, kernel)) acc += w * tmp[j * dstW + x];
        out[(i * dstW + x) * 3 + c] = acc;
      }
    }
  }
  return out;
}
function madF(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}
function madU8(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}

function main() {
  const res = { generatedAt: new Date().toISOString(), putVsMitchell: {}, videoControl: {}, putVsPut: {} };
  const s0Of = (name) => b64buf(PROBE.statics[name].caps.native.rgbB64);
  // 1. putImageData vs Mitchell(S0) — từng biến thể cờ.
  for (const [key, cap] of Object.entries(E2.caps)) {
    if (cap.kind !== "put") continue;
    const srcName = cap.src === "lineart640-sharp10" ? "lineart640" : cap.src;
    const S0 = srcName === "lineart640" && cap.src === "lineart640-sharp10"
      ? fs.readFileSync(path.join(M10, "raw-s0", "lineart640-sharp10.rgb"))
      : s0Of(srcName);
    const got = b64buf(cap.rgbB64);
    const mit = resample(S0, W, H, 809, 455, mitchell);
    const tr = resample(S0, W, H, 809, 455, tri);
    res.putVsMitchell[key] = { vsMitchell: madF(Float64Array.from(got), mit), vsTri: madF(Float64Array.from(got), tr) };
    console.log(`${key}: put vs Mitchell(S0) ${res.putVsMitchell[key].vsMitchell} | vs tri ${res.putVsMitchell[key].vsTri}`);
  }
  // 2. Các biến thể put có giống nhau không (cờ willReadFrequently có đổi gì?).
  const la = Object.entries(E2.caps).filter(([k, c]) => c.kind === "put" && c.src === "lineart640");
  for (let i = 0; i < la.length; i++) for (let j = i + 1; j < la.length; j++) {
    const [ka, ca] = la[i], [kb, cb] = la[j];
    const m = madU8(b64buf(ca.rgbB64), b64buf(cb.rgbB64));
    res.putVsPut[`${ka} VS ${kb}`] = m;
    console.log(`put-vs-put ${ka} vs ${kb}: MAD ${m}`);
  }
  // 3. Video control: native có bằng S0 probe chính? two có bằng C2?
  const vc = E2.caps["lineart640|video|two1264"];
  const s0main = s0Of("lineart640");
  const c2main = b64buf(PROBE.statics["lineart640"].caps.two1264.rgbB64);
  const vcNative = b64buf(vc.native.rgbB64);
  const vcTwo = b64buf(vc.two.rgbB64);
  res.videoControl = {
    native_vs_S0main_MAD: madU8(vcNative, s0main),
    native_identical: vc.native.rgbB64 === PROBE.statics["lineart640"].caps.native.rgbB64,
    two_vs_C2main_MAD: madU8(vcTwo, c2main),
    two_identical: vc.two.rgbB64 === PROBE.statics["lineart640"].caps.two1264.rgbB64,
  };
  console.log(`video control: native vs S0 chính MAD ${res.videoControl.native_vs_S0main_MAD} identical=${res.videoControl.native_identical}; two vs C2 chính MAD ${res.videoControl.two_vs_C2main_MAD} identical=${res.videoControl.two_identical}`);
  writeFileEpermRetry(OUT, JSON.stringify(res, null, 2));
  console.log(`ghi ${OUT}`);
}
main();
