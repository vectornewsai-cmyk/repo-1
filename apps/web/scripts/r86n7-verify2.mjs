#!/usr/bin/env node
/**
 * r86n7-verify2.mjs — Phase 9 đợt 86, luồng N7 (đính chính verify 1):
 *  1. MAD tại ĐÚNG φ=−1/32 (posq round) và φ=0 (posqf floor) trên 71 case.
 *  2. CTM với thang ĐÚNG s=815/360 (verify 1 dùng nhầm 1449/640): posq16
 *     vs float trên ctm-off0 / ctm-off0.5; pixel nào lệch ở stepH255-CTM.
 *  3. Chroma upsample: bilinear với siting x/2 (JPEG) vs x/2−0,25 (MPEG2).
 *  4. Downscale lineV s=0,6: pixel nào lệch dưới posq16.
 *
 * Ra: hidden_files/round86-n7/r86n7-verify2.json (+ log console).
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const N7 = path.join(GOAL, "round86-n7");
const M2 = path.join(GOAL, "round85-m2");
const MEDIA7 = path.join(N7, "media");
const MEDIA2 = path.join(M2, "media");
const OUT = path.join(N7, "r86n7-verify2.json");
const r3 = (v) => +v.toFixed(3);
const r4 = (v) => +v.toFixed(4);

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
const clampU8 = (v) => Math.max(0, Math.min(255, Math.round(v)));
function madWin(a, b, lo, hi) { let s = 0, n = 0; for (let i = lo; i < hi; i++) { s += Math.abs(a[i] - b[i]); n++; } return n ? s / n : NaN; }

function weightsFor(spec, i, s, srcLen) {
  const phi = spec.phi || 0;
  let S = (i + 0.5) / s + phi;
  if (spec.kind === "posq") S = Math.round(S * 16) / 16;
  if (spec.kind === "posqf") S = Math.floor(S * 16) / 16;
  const u = S - 0.5, j0 = Math.floor(u), j1 = j0 + 1;
  const ws = [];
  for (const j of [j0, j1]) {
    if (j < 0 || j >= srcLen) continue;
    const w = tri(j + 0.5 - S);
    if (w > 0) ws.push([j, w]);
  }
  return ws;
}
function modelProfile(srcProf, srcLen, dstLen, sTrue, spec) {
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of weightsFor(spec, i, sTrue, srcLen)) acc += w * srcProf[j];
    out[i] = clampU8(acc);
  }
  return out;
}
function fitPhi(meas, srcProf, srcLen, dstLen, sTrue, specBase, lo, hi, phiLo, phiHi, step = 0.001) {
  let best = null;
  for (let phi = phiLo; phi <= phiHi + 1e-9; phi += step) {
    const m = modelProfile(srcProf, srcLen, dstLen, sTrue, { ...specBase, phi });
    const mad = madWin(meas, m, lo, hi);
    if (!best || mad < best.mad) best = { phi: r4(phi), mad: r3(mad) };
  }
  return best;
}

const probe7 = JSON.parse(fs.readFileSync(path.join(N7, "r86n7-video-operator2.json"), "utf8"));
const probe2 = JSON.parse(fs.readFileSync(path.join(M2, "r85m2-video-operator.json"), "utf8"));
const wave2 = JSON.parse(fs.readFileSync(path.join(M2, "r85m2-wave.json"), "utf8"));
const report = { generated: new Date().toISOString(), sections: {} };
const srcProfFromRgb = (rgbPath, kind) => {
  const raw = fs.readFileSync(rgbPath);
  if (kind === "V") {
    const prof = new Float64Array(640);
    for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; prof[x] = s / 8; }
    return prof;
  }
  const prof = new Float64Array(360);
  for (let y = 0; y < 360; y++) { let s = 0; for (let x = 310; x < 318; x++) s += raw[(y * 640 + x) * 3]; prof[y] = s / 8; }
  return prof;
};

// ---------- 1. MAD tại đúng φ=−1/32 / φ=0 ----------
{
  const cases = [];
  for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160], ["stepH255b", "H", 90]]) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    for (const sNom of probe7.scales) {
      if (sNom === 0.5 || sNom === 1) continue;
      const dump = probe7[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      const c = Math.round(E * sTrue);
      cases.push({ tag: `${name} s${sNom}`, meas, src, srcLen: src.length, dstLen, sTrue, lo: Math.max(0, c - 60), hi: Math.min(dstLen, c + 60) });
    }
  }
  for (const [name, kind] of [["sqw2-mid", "H"], ["sqw4-mid", "H"], ["sqw8-mid", "H"], ["sqw4x-mid", "V"], ["sqw4-640", "H"]]) {
    const bDump = decodeB64(wave2[name].dumps["B-1to1"].rgbB64, wave2[name].dumps["B-1to1"].w, wave2[name].dumps["B-1to1"].h);
    const src = profile1D(bDump, kind);
    for (const sNom of wave2.scales) {
      const dump = wave2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      let lo = 10, hi = dstLen - 10;
      if (name === "sqw4-640") { lo = Math.floor(200 * sTrue); hi = Math.floor(350 * sTrue); }
      cases.push({ tag: `${name} s${sNom}`, meas, src, srcLen: src.length, dstLen, sTrue, lo, hi });
    }
  }
  for (const [name, kind, E] of [["stepV-gray", "V", 320], ["stepH-gray", "H", 180], ["lineV-gray", "V", 320], ["lineH-gray", "H", 180]]) {
    const src = srcProfFromRgb(path.join(MEDIA2, name + ".rgb"), kind);
    for (const sNom of [1.125, 1.5, 2.25, 3.0]) {
      const dump = probe2[name].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length, sTrue = dstLen / src.length;
      const c = Math.round(E * sTrue);
      cases.push({ tag: `M2:${name} s${sNom}`, meas, src, srcLen: src.length, dstLen, sTrue, lo: Math.max(0, c - 60), hi: Math.min(dstLen, c + 60) });
    }
  }
  {
    const raw = fs.readFileSync(path.join(MEDIA2, "lineV-gray.rgb"));
    const src = new Float64Array(640);
    for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; src[x] = s / 8; }
    for (const sNom of probe7.scales) {
      if (sNom === 0.5 || sNom === 1) continue;
      const dump = probe7["lineV-gray"].dumps[`exp-high-video-s${sNom}`];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "V");
      const dstLen = meas.length, sTrue = dstLen / 640;
      const c = Math.round(320 * sTrue);
      cases.push({ tag: `lineV s${sNom}`, meas, src, srcLen: 640, dstLen, sTrue, lo: Math.max(0, c - 60), hi: Math.min(dstLen, c + 60) });
    }
  }
  const rows = [];
  let worstRound = 0, worstFloor = 0, worstFloat = 0;
  for (const c of cases) {
    const mR = modelProfile(c.src, c.srcLen, c.dstLen, c.sTrue, { kind: "posq", phi: -1 / 32 });
    const mF = modelProfile(c.src, c.srcLen, c.dstLen, c.sTrue, { kind: "posqf", phi: 0 });
    const mT = modelProfile(c.src, c.srcLen, c.dstLen, c.sTrue, { kind: "float", phi: -0.031 });
    const madR = madWin(mR, c.meas, c.lo, c.hi);
    const madF = madWin(mF, c.meas, c.lo, c.hi);
    const madT = madWin(mT, c.meas, c.lo, c.hi);
    worstRound = Math.max(worstRound, madR);
    worstFloor = Math.max(worstFloor, madF);
    worstFloat = Math.max(worstFloat, madT);
    rows.push({ tag: c.tag, madPosq16phiNeg1over32: r4(madR), madPosqf16phi0: r4(madF), madFloatPhiNeg0031: r4(madT) });
  }
  report.sections.exactPhi = { n: cases.length, worstRound: r4(worstRound), worstFloor: r4(worstFloor), worstFloat: r4(worstFloat), rows };
  console.log(`1. MAD tại đúng φ: n=${cases.length} | posq16 φ=−1/32 worst=${r4(worstRound)} | posqf16 φ=0 worst=${r4(worstFloor)} | float φ=−0,031 worst=${r4(worstFloat)}`);
  const bad = rows.filter((r) => r.madPosq16phiNeg1over32 > 0.01);
  console.log(`   posq16 φ=−1/32 có MAD>0,01: ${bad.length} case: ` + bad.map((b) => `${b.tag}=${b.madPosq16phiNeg1over32}`).join(", "));
}

// ---------- 2. CTM với thang ĐÚNG s=815/360 ----------
{
  const SCTM = 815 / 360;
  const res = {};
  for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160]]) {
    const src = srcProfFromRgb(path.join(MEDIA7, name + ".rgb"), kind);
    res[name] = {};
    for (const [key, phiLo, phiHi] of [["ctm-off0-video-s2.2639", -0.08, 0.02], ["ctm-off0.5-video-s2.2639", -0.32, 0.05]]) {
      const dump = probe7[name].dumps[key];
      const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), kind);
      const dstLen = meas.length;
      // thang CTM theo chiều cao: s = 815/360 (không phải dstLen/srcLen)
      const c = Math.round(E * SCTM);
      const lo = Math.max(0, c - 60), hi = Math.min(dstLen, c + 60);
      const row = {};
      for (const m of [{ label: "tri-float", kind: "float" }, { label: "posq16", kind: "posq" }, { label: "posqf16", kind: "posqf" }]) {
        row[m.label] = fitPhi(meas, src, src.length, dstLen, SCTM, m, lo, hi, phiLo, phiHi);
      }
      // pixel lệch của model tốt nhất (float φ=0 và posq16 φ=−1/32)
      const mFloat0 = modelProfile(src, src.length, dstLen, SCTM, { kind: "float", phi: 0 });
      const mPosq = modelProfile(src, src.length, dstLen, SCTM, { kind: "posq", phi: -1 / 32 });
      const diffFloat = [], diffPosq = [];
      for (let i = lo; i < hi; i++) {
        if (mFloat0[i] !== meas[i]) diffFloat.push({ i, model: mFloat0[i], meas: meas[i], d: meas[i] - mFloat0[i] });
        if (mPosq[i] !== meas[i]) diffPosq.push({ i, model: mPosq[i], meas: meas[i], d: meas[i] - mPosq[i] });
      }
      row.diffPixelsFloatPhi0 = diffFloat;
      row.diffPixelsPosq16 = diffPosq;
      res[name][key] = row;
    }
  }
  report.sections.ctmCorrected = res;
  console.log("2. CTM (thang đúng 815/360):");
  for (const [name, keys] of Object.entries(res)) for (const [key, row] of Object.entries(keys)) {
    console.log(`   ${name} ${key}: float=${JSON.stringify(row["tri-float"])} posq16=${JSON.stringify(row["posq16"])} posqf16=${JSON.stringify(row["posqf16"])}`);
    console.log(`     diff floatφ0: ${JSON.stringify(row.diffPixelsFloatPhi0)} | diff posq16: ${JSON.stringify(row.diffPixelsPosq16)}`);
  }
}

// ---------- 3. Chroma siting ----------
{
  const yuv601 = (y, cb, cr) => [
    clampU8(1.164383 * (y - 16) + 1.79274 * (cr - 128)),
    clampU8(1.164383 * (y - 16) - 0.21325 * (cb - 128) - 0.53282 * (cr - 128)),
    clampU8(1.164383 * (y - 16) + 2.1122 * (cb - 128)),
  ];
  const res = {};
  for (const name of ["stepV-colorCb", "stepV-colorCr"]) {
    const yuvRaw = fs.readFileSync(path.join(N7, `${name}.yuv420`));
    const Yp = yuvRaw.subarray(0, 640 * 360);
    const Up = yuvRaw.subarray(640 * 360, 640 * 360 + 320 * 180);
    const Vp = yuvRaw.subarray(640 * 360 + 320 * 180, 640 * 360 + 320 * 180 + 320 * 180);
    const bDump = decodeB64(probe2[name].dumps["B-1to1"].rgbB64, probe2[name].dumps["B-1to1"].w, probe2[name].dumps["B-1to1"].h);
    const chromeProf = profile1D(bDump, "V");
    const upsample = (plane, w, h, siting) => {
      const out = new Float64Array(w * 2 * (h * 2));
      for (let y = 0; y < h * 2; y++) for (let x = 0; x < w * 2; x++) {
        // siting "mpeg2": sx=(x+0.5)/2-0.5 ; siting "jpeg": sx=x/2
        const sx = siting === "jpeg" ? x / 2 : (x + 0.5) / 2 - 0.5;
        const sy = siting === "jpeg" ? y / 2 : (y + 0.5) / 2 - 0.5;
        const x0 = Math.max(0, Math.floor(sx)), x1 = Math.min(w - 1, x0 + 1);
        const y0 = Math.max(0, Math.floor(sy)), y1 = Math.min(h - 1, y0 + 1);
        const fx = Math.max(0, Math.min(1, sx - x0)), fy = Math.max(0, Math.min(1, sy - y0));
        out[y * w * 2 + x] = (plane[y0 * w + x0] * (1 - fx) * (1 - fy) + plane[y0 * w + x1] * fx * (1 - fy) + plane[y1 * w + x0] * (1 - fx) * fy + plane[y1 * w + x1] * fx * fy);
      }
      return out;
    };
    const row = {};
    for (const siting of ["mpeg2", "jpeg"]) {
      const Uc = upsample(Up, 320, 180, siting);
      const Vc = upsample(Vp, 320, 180, siting);
      const prof = new Float64Array(640);
      for (let x = 0; x < 640; x++) {
        let s = 0;
        for (let y = 170; y < 190; y++) s += yuv601(Yp[y * 640 + x], Uc[y * 640 + x], Vc[y * 640 + x])[0];
        prof[x] = s / 20;
      }
      row[`bilinear-${siting}`] = r4(madWin(chromeProf, prof, 0, 640));
    }
    res[name] = row;
  }
  report.sections.chromaSiting = res;
  console.log("3. Chroma bilinear siting (MAD kênh R vs Chrome):", JSON.stringify(res));
}

// ---------- 4. Downscale lineV s=0,6: pixel lệch dưới posq16 ----------
{
  const down7 = JSON.parse(fs.readFileSync(path.join(N7, "r86n7-downscale.json"), "utf8"));
  const raw = fs.readFileSync(path.join(MEDIA2, "lineV-gray.rgb"));
  const src = new Float64Array(640);
  for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; src[x] = s / 8; }
  const dump = down7["lineV-gray"].dumps["exp-high-video-s0.6"];
  const meas = profile1D(decodeB64(dump.rgbB64, dump.w, dump.h), "V");
  const dstLen = meas.length, sTrue = dstLen / 640;
  const mPosq = modelProfile(src, 640, dstLen, sTrue, { kind: "posq", phi: -1 / 32 });
  const mFloat = modelProfile(src, 640, dstLen, sTrue, { kind: "float", phi: -0.013 });
  const diffs = [];
  for (let i = 0; i < dstLen; i++) if (mPosq[i] !== meas[i]) diffs.push({ i, posq: mPosq[i], float: mFloat[i], meas: meas[i] });
  report.sections.downscaleLineV06 = { sTrue: r4(sTrue), diffPixelsPosq16: diffs, madPosq16: r4(madWin(mPosq, meas, 0, dstLen)), madFloat: r4(madWin(mFloat, meas, 0, dstLen)) };
  console.log("4. lineV s=0,6 diff posq16:", JSON.stringify(diffs), "madPosq16=", r4(madWin(mPosq, meas, 0, dstLen)), "madFloat=", r4(madWin(mFloat, meas, 0, dstLen)));
}

writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
