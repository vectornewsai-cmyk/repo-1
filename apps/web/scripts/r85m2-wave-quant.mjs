#!/usr/bin/env node
/**
 * r85m2-wave-quant.mjs — Phase 9 đợt 85, luồng M2: kiểm tra giả thuyết
 * trọng số điểm cố định (kiểu libyuv) cho toán tử video.
 *
 * Sau (h≈0,98, φ≈−0,03) phần dư trên sóng dày vẫn có dạng sóng tuần
 * hoàn (tự tương quan ±1 ở lag = chu kỳ sóng) — tức kernel thật lệch
 * triangle một cách có hệ thống, không phải nhiễu làm tròn uint8.
 * Ứng viên: trọng số bilinear lượng tử hoá N bit (libyuv dùng hệ số
 * nguyên) — sai số trọng số ~1/2^N tạo sai số đầu ra ~amp/2^N ở mọi
 * điểm chuyển tiếp (sóng dày) nhưng gần như không thấy trên vạch rời
 * rạc. Thử N = 8 (và 16 làm đối chứng ≈ float), có/không chuẩn hoá
 * lại, quét φ.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r85m2-wave-quant.mjs
 * Chỉ đo offline. KHÔNG push/tag/binary/workflow. KHÔNG sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M2 = path.join(GOAL, "round85-m2");
const PROBE = path.join(M2, "r85m2-wave.json");
const OUT = path.join(M2, "r85m2-wave-quant.json");
const r3 = (v) => +v.toFixed(3);

function decodeB64(b64, w, h) { return { w, h, data: Buffer.from(b64, "base64") }; }
function profile1D(dump, kind) {
  const { w, h, data } = dump;
  if (kind === "V") {
    const prof = new Float64Array(w);
    for (let x = 0; x < w; x++) { let s = 0; for (let y = 0; y < h; y++) s += data[(y * w + x) * 3]; prof[x] = s / h; }
    return prof;
  }
  const prof = new Float64Array(h);
  for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) s += data[(y * w + x) * 3]; prof[y] = s / w; }
  return prof;
}
const tri = (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; };
// Trọng số triangle, lượng tử hoá Q bit, có/không chuẩn hoá lại về tổng 1.
function weightsQ(i, s, srcLen, phi, bits, renorm) {
  const S = (i + 0.5) / s + phi;
  const j0 = Math.max(0, Math.floor(S - 1 - 0.5));
  const j1 = Math.min(srcLen - 1, Math.ceil(S + 1 - 0.5));
  const ws = [];
  let wsum = 0;
  const Q = 1 << bits;
  for (let j = j0; j <= j1; j++) {
    let w = tri(j + 0.5 - S);
    if (w === 0) continue;
    w = Math.round(w * Q) / Q;
    if (w === 0) continue;
    ws.push([j, w]);
    wsum += w;
  }
  if (wsum === 0) return [[Math.min(srcLen - 1, Math.max(0, Math.round(S))), 1]];
  if (renorm) return ws.map(([j, w]) => [j, w / wsum]);
  return ws;
}
function modelQ(srcProf, srcLen, dstLen, s, phi, bits, renorm) {
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of weightsQ(i, s, srcLen, phi, bits, renorm)) acc += w * srcProf[j];
    out[i] = acc;
  }
  return out;
}
function madWin(a, b, lo, hi) {
  let s = 0, n = 0;
  for (let i = lo; i < hi; i++) { s += Math.abs(a[i] - b[i]); n++; }
  return r3(s / n);
}

const probe = JSON.parse(fs.readFileSync(PROBE, "utf8"));
const KINDS = { "sqw4-640": "H", "sqw2-mid": "H", "sqw4-mid": "H", "sqw8-mid": "H", "sqw4x-mid": "V" };
const SCALES = probe.scales;
const report = { generated: new Date().toISOString(), quant: {} };

for (const [name, kind] of Object.entries(KINDS)) {
  const bDump = decodeB64(probe[name].dumps["B-1to1"].rgbB64, probe[name].dumps["B-1to1"].w, probe[name].dumps["B-1to1"].h);
  const srcProf = profile1D(bDump, kind);
  const srcLen = srcProf.length;
  const entry = {};
  for (const sNom of SCALES) {
    const dstLen = kind === "V" ? Math.round(640 * sNom) : Math.round(360 * sNom);
    const sTrue = dstLen / srcLen;
    const dump = decodeB64(probe[name].dumps[`exp-high-video-s${sNom}`].rgbB64, probe[name].dumps[`exp-high-video-s${sNom}`].w, probe[name].dumps[`exp-high-video-s${sNom}`].h);
    const meas = profile1D(dump, kind);
    let lo = 0, hi = dstLen;
    if (name === "sqw4-640") { lo = Math.floor(200 * sTrue); hi = Math.floor(350 * sTrue); }
    const res = {};
    for (const [label, bits, renorm] of [["float", 24, true], ["q16-renorm", 16, true], ["q8-renorm", 8, true], ["q8-norenorm", 8, false], ["q7-renorm", 7, true], ["q6-renorm", 6, true]]) {
      let best = null;
      for (let phi = -0.06; phi <= 0.0601; phi += 0.005) {
        const m = madWin(meas, modelQ(srcProf, srcLen, dstLen, sTrue, phi, bits, renorm), lo, hi);
        if (!best || m < best.mad) best = { phi: r3(phi), mad: m };
      }
      res[label] = best;
    }
    entry[`s${sNom}`] = res;
    console.log(`${name} s=${sNom}: ` + Object.entries(res).map(([k, v]) => `${k} φ=${v.phi} MAD=${v.mad}`).join(" | "));
  }
  report.quant[name] = entry;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
