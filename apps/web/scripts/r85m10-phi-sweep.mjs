#!/usr/bin/env node
/**
 * r85m10-phi-sweep.mjs — Phase 9 đợt 85, luồng M10 (bổ sung 3): quét phi cho
 * C2/C2app vs Mitchell và Bview/Bapp vs tri — bản đồ lỗi (edge-map) cho
 * thấy lỗi C2-vs-Mitchell lan đều, nhỏ ở tâm đường, lớn ở sườn dốc:
 * đúng dấu hiệu lệch pha nhỏ của model, không phải sai kernel hay biên.
 * Nếu có phi cho MAD ~0,1 thì canvas path LÀ Mitchell (chỉ lệch pha);
 * nếu không phi nào cứu được thì không phải pha.
 * Chạy: node apps/web/scripts/r85m10-phi-sweep.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M10 = path.join(GOAL, "round85-m10");
const PROBE = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-probe.json"), "utf8"));
const OUT = path.join(M10, "r85m10-phi-sweep.json");
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
function madF(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return +(s / a.length).toFixed(3);
}
const PHIS = [-0.25, -0.1875, -0.125, -0.09375, -0.0625, -0.044, -0.03125, -0.015625, 0, 0.015625, 0.03125, 0.044, 0.0625, 0.09375, 0.125, 0.1875, 0.25];
const APP_SCALE = PROBE.appScale, APP_OFFX = PROBE.appOffX;
const PHI_X_APP = -APP_OFFX / APP_SCALE;

function main() {
  const res = { generatedAt: new Date().toISOString(), phiSweep: {} };
  for (const name of ["lineart640", "lineart2px-640", "sqw4-640", "step-640"]) {
    const S0 = b64buf(PROBE.statics[name].caps.native.rgbB64);
    const C2 = b64buf(PROBE.statics[name].caps.two1264.rgbB64);
    const C2app = b64buf(PROBE.statics[name].caps.apptwo1264.rgbB64);
    const Bview = b64buf(PROBE.statics[name].caps.direct1264.rgbB64);
    const Bapp = b64buf(PROBE.statics[name].caps.app1264.rgbB64);
    const r = { C2_vs_Mitchell_phi: {}, C2app_vs_Mitchell_phiApp: {}, Bview_vs_tri_phi: {}, Bapp_vs_tri_phiApp: {} };
    for (const phi of PHIS) {
      r.C2_vs_Mitchell_phi[phi] = madF(Float64Array.from(C2), resampleEx(S0, W, H, 809, 455, mitchell, 1, phi, phi));
      r.Bview_vs_tri_phi[phi] = madF(Float64Array.from(Bview), resampleEx(S0, W, H, 809, 455, tri, 1, phi, phi));
    }
    for (const phi of PHIS) {
      // app-geom: thang đều APP_SCALE, phiX quét quanh PHI_X_APP, phiY=0.
      r.C2app_vs_Mitchell_phiApp[phi] = madF(Float64Array.from(C2app), resampleEx(S0, W, H, 809, 455, mitchell, 1, PHI_X_APP + phi, 0, APP_SCALE, APP_SCALE));
      r.Bapp_vs_tri_phiApp[phi] = madF(Float64Array.from(Bapp), resampleEx(S0, W, H, 809, 455, tri, 1, PHI_X_APP + phi, 0, APP_SCALE, APP_SCALE));
    }
    const best = (o) => Object.entries(o).sort((a, b) => a[1] - b[1])[0];
    res.phiSweep[name] = r;
    console.log(`${name}: C2-vs-Mitchell tốt nhất phi=${best(r.C2_vs_Mitchell_phi)[0]} MAD ${best(r.C2_vs_Mitchell_phi)[1]} (phi0: ${r.C2_vs_Mitchell_phi["0"]}) | C2app tốt nhất dPhi=${best(r.C2app_vs_Mitchell_phiApp)[0]} MAD ${best(r.C2app_vs_Mitchell_phiApp)[1]} (dPhi0: ${r.C2app_vs_Mitchell_phiApp["0"]})`);
    console.log(`  Bview-vs-tri tốt nhất phi=${best(r.Bview_vs_tri_phi)[0]} MAD ${best(r.Bview_vs_tri_phi)[1]} (phi0: ${r.Bview_vs_tri_phi["0"]}) | Bapp-vs-tri tốt nhất dPhi=${best(r.Bapp_vs_tri_phiApp)[0]} MAD ${best(r.Bapp_vs_tri_phiApp)[1]} (dPhi0: ${r.Bapp_vs_tri_phiApp["0"]})`);
  }
  writeFileEpermRetry(OUT, JSON.stringify(res, null, 2));
  console.log(`ghi ${OUT}`);
}
main();
