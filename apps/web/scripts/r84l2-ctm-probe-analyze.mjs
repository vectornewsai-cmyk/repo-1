#!/usr/bin/env node
/**
 * r84l2-ctm-probe-analyze.mjs — Phase 9 đợt 84, luồng L2: phân tích CTM probe
 * (đóng nợ K2 §7 mục 1 — phần dư delta sqw4).
 *
 * Đọc r84l2-ctm-probe.json (12 dump: nguồn {video, canvas} × quality
 * {high, medium, low} × cách vẽ {CTM, explicit}, sqw4-640 và sqw4-1280)
 * và so với:
 *   (a) snap_plain H3 (ground truth đường plain của preview thật),
 *   (b) mô hình Mitchell trực tiếp trên R (fullrgb-plain.raw),
 *   (c) mô hình Mitchell trực tiếp trên B (native dump của probe).
 * Câu hỏi quyết định: dump nào khớp snap_plain (~0,5 MAD)? Nếu
 * CTM-high-video khớp mà explicit-high-video/Mitchell không khớp →
 * toán tử upscale thật của preview là "drawImage(video) dưới CTM,
 * quality high", khác với kernel trực tiếp — và phần dư plain 2,44
 * chính là khoảng cách giữa toán tử đó với Mitchell.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r84l2-ctm-probe-analyze.mjs
 * Ra: hidden_files/round84-l2/r84l2-ctm-probe-analysis.json (+ bảng console).
 * Chỉ đọc; không sửa production, không push.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, bcCubicKernel } from "/home/hatch/workspace/repo-1/apps/web/scripts/chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H3 = path.join(GOAL, "round80-h3");
const L2 = path.join(GOAL, "round84-l2");
const OUT = path.join(L2, "r84l2-ctm-probe-analysis.json");
const MIT = (x) => bcCubicKernel(x, 1 / 3, 1 / 3);

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
    for (let i = 0; i < dstW * dstH; i++) { const v = Math.round(r[i]); out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v; }
  }
  return out;
}
function stats(a, b) {
  let s = 0, le8 = 0, mx = 0, n = a.length;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(a[i] - b[i]);
    s += d; if (d <= 8) le8++; if (d > mx) mx = d;
  }
  return { mad: +(s / n).toFixed(3), le8: +(le8 / n).toFixed(4), max: mx };
}
function dec(b64) { return Buffer.from(b64, "base64"); }

const probe = JSON.parse(fs.readFileSync(path.join(L2, "r84l2-ctm-probe.json"), "utf8"));
const results = {};
for (const [key, content, snapFile, projW, projH] of [
  ["sqw640", "sqw4-640", "headed-w1920x1080-p640x360-ph1/r80h3-snaps-w1920x1080-p640x360.json", 640, 360],
  ["sqw1280", "sqw4", "headed-w2560x1440-p1280x720-ph1/r80h3-snaps-w2560x1440-p1280x720.json", 1280, 720],
]) {
  const doc = JSON.parse(fs.readFileSync(path.join(H3, snapFile), "utf8"));
  const snap = dec(doc.snaps[content].plain.rgbB64);
  const vw = doc.snaps[content].plain.w, vh = doc.snaps[content].plain.h;
  const R = fs.readFileSync(path.join(H3, "render", content, "fullrgb-plain.raw"));
  const mitR = resampleRgbKernel(R, projW, projH, vw, vh, MIT);
  const B = dec(probe[key].native.rgbB64);
  const mitB = resampleRgbKernel(B, projW, projH, vw, vh, MIT);
  const entry = {
    rect: doc.snaps[content].plain.rect,
    probeScale: probe[key].scale,
    editorScale: doc.snaps[content].plain.rect.scale,
    currentTime: probe[key].currentTime,
    bVsR: stats(B, R),
    mitRvsSnap: stats(mitR, snap),
    mitBvsSnap: stats(mitB, snap),
    dumps: {},
  };
  const groups = { ctm: probe[key].ctm, explicit: probe[key].explicit };
  for (const [gname, group] of Object.entries(groups)) {
    for (const [dname, dump] of Object.entries(group)) {
      const rgb = dec(dump.rgbB64);
      entry.dumps[`${gname}-${dname}`] = {
        vsSnapPlain: stats(rgb, snap),
        vsMitR: stats(rgb, mitR),
        vsMitB: stats(rgb, mitB),
      };
    }
  }
  // CTM với offX phân số (đúng hình học editor, không làm tròn offX).
  if (probe[key].ctmFx) {
    entry.ctmFx = {};
    for (const [dname, dump] of Object.entries(probe[key].ctmFx)) {
      const rgb = dec(dump.rgbB64);
      entry.ctmFx[dname] = { vsSnapPlain: stats(rgb, snap), vsMitR: stats(rgb, mitR) };
    }
    for (const [name, d] of Object.entries(entry.ctmFx)) {
      console.log(`  ctmFx-${name.padEnd(18)} vsSnap MAD=${d.vsSnapPlain.mad} le8=${d.vsSnapPlain.le8} max=${d.vsSnapPlain.max} | vsMitR MAD=${d.vsMitR.mad}`);
    }
  }
  // Hiệu ứng nguồn: CTM-high-video vs CTM-high-canvas (cùng hình học).
  const hv = dec(probe[key].ctm["high-video"].rgbB64);
  const hc = dec(probe[key].ctm["high-canvas"].rgbB64);
  entry.sourceEffectCtmHigh = { videoVsCanvas: stats(hv, hc) };
  const ev = dec(probe[key].explicit["high-video"].rgbB64);
  const ec = dec(probe[key].explicit["high-canvas"].rgbB64);
  entry.sourceEffectExplicitHigh = { videoVsCanvas: stats(ev, ec) };
  results[key] = entry;
  console.log(`--- ${key} (rect ${vw}x${vh}, probe scale ${probe[key].scale} vs editor ${doc.snaps[content].plain.rect.scale}, ct=${probe[key].currentTime})`);
  console.log(`  B vs R (native): MAD=${entry.bVsR.mad} le8=${entry.bVsR.le8} max=${entry.bVsR.max}`);
  console.log(`  Mitchell(R) vs snap_plain: MAD=${entry.mitRvsSnap.mad} | Mitchell(B) vs snap: MAD=${entry.mitBvsSnap.mad}`);
  for (const [name, d] of Object.entries(entry.dumps)) {
    console.log(`  ${name.padEnd(22)} vsSnap MAD=${d.vsSnapPlain.mad} le8=${d.vsSnapPlain.le8} max=${d.vsSnapPlain.max} | vsMitR MAD=${d.vsMitR.mad} | vsMitB MAD=${d.vsMitB.mad}`);
  }
  console.log(`  source effect CTM-high video-vs-canvas MAD=${entry.sourceEffectCtmHigh.videoVsCanvas.mad}; explicit-high MAD=${entry.sourceEffectExplicitHigh.videoVsCanvas.mad}`);
}
writeFileEpermRetry(OUT, JSON.stringify({ generated: new Date().toISOString(), results }, null, 2));
console.log("Đã ghi " + OUT);
