#!/usr/bin/env node
/**
 * r83k5-chromatic-stripes.mjs — Phase 9 đợt 83, luồng K5: SỌC MÀU MỊN cho Q4.
 *
 * BỐI CẢNH (đọc docs/PHASE9_ROUND82_J5_Q4_RESID_MECHANISM_LIMITS.md §6 trước):
 *  - Q4 = G1 từ chối ∧ G2 áp: plainMad ≤ 2,5 ∧ d0std_R > 2,0 ∧
 *    ratio_R = d0std_R / residStd_R ≤ 1,0 (tức residStd_R ≥ d0std_R > 2).
 *  - J5 đã dừng săn hướng cũ: resid khớp-frame thật của slovenska chỉ
 *    ~0,5–0,7 (không phải 2,95 — đó là lệch 1 frame); tp có resid lớn
 *    (4,46 @311) nhưng d0std_R chỉ ~0,9–1,7 (chroma đã bão hòa rail,
 *    mô hình chroma-shift kẹp [16,240] nên không scale được).
 *  - Hai điều kiện kéo ngược nhau trên mọi họ đã đo. Hướng duy nhất chưa
 *    thử: SỌC MÀU MỊN — cùng một cấu trúc vừa tạo d0std_R lớn (mô hình
 *    chroma-shift khuếch đại cạnh chroma ở thang 2×2) vừa tạo resid lớn
 *    (kernel lệch trên sọc sắc).
 *
 * THÍ NGHIỆM (node-only, không cần browser — xem LIMITS để biết vì sao
 * proxy này đủ để kết luận; chuỗi encode-aware ở §C kiểm chứng lại bằng
 * ffmpeg cho ứng viên tốt nhất):
 *  A. Neo sanity: tái lập J5 D2 (kernel-diff trilinear-vs-1-kernel) trên
 *     frame thật slovenska + test-pattern ở 809×455 và 311×175, bằng đúng
 *     hàm delta0Viewport_70x6 của harness.
 *  B. Screen sọc (2 pha):
 *     B1: mọi họ × 4 rect, d0std CHÍNH XÁC (estShiftFrame tính 1 lần/họ,
 *     rồi trilinear(shifted)−trilinear(gốc) từng rect — cùng số học với
 *     delta0Viewport_70x6, đã kiểm chứng bằng nhau ở test) + residStd /
 *     plainMad proxy 1-kernel (resampleRgb24).
 *     B2: xác nhận bằng 2 kernel proxy nữa (Mitchell 1/3,1/3 — kernel thật
 *     của Chrome ở upscale, J2 — và BC(0,25, 0,375)) cho mọi họ có
 *     d0std_R > 2 ở bất kỳ rect nào, mọi họ có ratio 1-kernel < 2, và
 *     toàn bộ đối chứng. (Kernel Mitchell/BC dùng trọng số cache — nhanh
 *     hơn resamplePlaneKernel gốc, cùng số học.)
 *     Ứng viên Q4 ⟺ plainMad ≤ 2,5 ∧ d0std_R > 2,0 ∧ ratio_R ≤ 1,0
 *     (với BẤT KỲ kernel proxy nào — báo cáo cả 3, không cherry-pick).
 *  C. Encode-aware (chỉ ứng viên tốt nhất từ B, tối đa 3): encode x264
 *     crf 18 still 1 s, decode, downscale 1-kernel, resid/plainMad so
 *     với trilinear(frame GỐC) — chuỗi kiểu F7 (render tham chiếu là
 *     frame gốc). Kèm sai số encode ở 1280 (decode − gốc).
 *
 * File ra (KHÔNG stage — JSON thô; script này tái lập được):
 *   hidden_files/round83-k5/r83k5-chromatic-stripes.json
 *   hidden_files/round83-k5/r83k5-chromatic-stripes.log
 *   hidden_files/round83-k5/media/ (mp4 encode-aware, binary, không stage)
 * Chạy (từ gốc repo): node apps/web/scripts/r83k5-chromatic-stripes.mjs
 * Env: R83K5_ONLY=A|B|C để chạy riêng một thí nghiệm; R83K5_OUT để đổi
 *   đường ra JSON. KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  channelStatsRaw, absMadRaw, delta0Viewport_70x6, estShiftFrame_70x6,
} from "./delta0-harness.mjs";
import {
  resampleRgb24Trilinear, resampleRgb24, chromeWeights1D,
} from "./chrome-resample.mjs";
import { KERNELS } from "./r82j2-chrome-probe-analyze.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const I4 = path.join(GOAL, "round81-i4");
const K5 = path.join(GOAL, "round83-k5");
const MEDIA = path.join(K5, "media");
fs.mkdirSync(K5, { recursive: true });
fs.mkdirSync(MEDIA, { recursive: true });
const OUT = process.env.R83K5_OUT || path.join(K5, "r83k5-chromatic-stripes.json");
const ONLY = process.env.R83K5_ONLY || "";
const r4 = (x) => +x.toFixed(4);
const report = { generated: new Date().toISOString(), A: {}, B: {}, B2: {}, C: {} };
const W = 1280, H = 720;
const RECTS = [[311, 175], [489, 275], [809, 455], [1129, 635]];

// ---------- tiện ích thống kê ----------
function stdPerChannel(diff) {
  return channelStatsRaw(Float64Array.from(diff)).std;
}
function diffStd(a, b) {
  const d = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) d[i] = a[i] - b[i];
  return channelStatsRaw(d).std;
}
/** Resample 1 plane bằng kernel cho trước, trọng số cache theo dst index. */
export function resamplePlaneKernelCached(src, srcW, srcH, dstW, dstH, kernel) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const wX = new Array(dstW), wY = new Array(dstH);
  for (let i = 0; i < dstW; i++) wX[i] = chromeWeights1D(i, sx, srcW, kernel);
  for (let i = 0; i < dstH; i++) wY[i] = chromeWeights1D(i, sy, srcH, kernel);
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) {
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of wX[i]) acc += w * src[y * srcW + j];
      tmp[y * dstW + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of wY[i]) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleWithKernel(rgb, srcW, srcH, dstW, dstH, kernelName) {
  if (kernelName === "tri") return resampleRgb24Trilinear(rgb, srcW, srcH, dstW, dstH);
  if (kernelName === "1kernel") return resampleRgb24(rgb, srcW, srcH, dstW, dstH);
  const kernel = kernelName === "mitchell" ? KERNELS.mitchell : KERNELS["bc025-0375"];
  const n = srcW * srcH, out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const plane = new Float64Array(n);
    for (let i = 0; i < n; i++) plane[i] = rgb[i * 3 + c];
    const rs = resamplePlaneKernelCached(plane, srcW, srcH, dstW, dstH, kernel);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
/** Đánh giá 1 frame ở 1 rect bằng đúng hàm harness (dùng cho neo A). */
function evalFrameHarness(frame, vw, vh) {
  const d0 = delta0Viewport_70x6(frame, W, H, vw, vh);
  const d0std = stdPerChannel(d0);
  const tri = resampleRgb24Trilinear(frame, W, H, vw, vh);
  const out = { d0std: d0std.map(r4), kernels: {} };
  for (const k of ["1kernel", "mitchell", "bc025"]) {
    const px = resampleWithKernel(frame, W, H, vw, vh, k);
    const residStd = diffStd(px, tri);
    const plainMad = absMadRaw(px, tri);
    const ratio = residStd[0] > 0 ? d0std[0] / residStd[0] : null; // null = ∞ (resid = 0)
    out.kernels[k] = {
      residStd: residStd.map(r4), residStdR: r4(residStd[0]),
      plainMad: r4(plainMad), ratioR: ratio === null ? null : r4(ratio),
      q4: plainMad <= 2.5 && d0std[0] > 2.0 && (residStd[0] > 0 && ratio !== null && ratio <= 1.0),
    };
  }
  return out;
}
/** Đánh giá nhanh: shifted tính 1 lần/họ; kernelList chọn proxy cần tính. */
function evalFrameFast(frame, shifted, vw, vh, kernelList = ["1kernel"]) {
  const triOrig = resampleRgb24Trilinear(frame, W, H, vw, vh);
  const triShift = resampleRgb24Trilinear(shifted, W, H, vw, vh);
  const d0 = new Float64Array(triOrig.length);
  for (let i = 0; i < d0.length; i++) d0[i] = triShift[i] - triOrig[i];
  const d0std = stdPerChannel(d0);
  const out = { d0std: d0std.map(r4), kernels: {} };
  for (const k of kernelList) {
    const px = resampleWithKernel(frame, W, H, vw, vh, k);
    const residStd = diffStd(px, triOrig);
    const plainMad = absMadRaw(px, triOrig);
    const ratio = residStd[0] > 0 ? d0std[0] / residStd[0] : null; // null = ∞ (resid = 0)
    out.kernels[k] = {
      residStd: residStd.map(r4), residStdR: r4(residStd[0]),
      plainMad: r4(plainMad), ratioR: ratio === null ? null : r4(ratio),
      q4: plainMad <= 2.5 && d0std[0] > 2.0 && (residStd[0] > 0 && ratio !== null && ratio <= 1.0),
    };
  }
  return out;
}

// ---------- gen frame ----------
function yuv709ToRgb(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [
    yy + 1.79274 * (cr - 128),
    yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128),
    yy + 2.1122 * (cb - 128),
  ];
}
const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
function genStripes({ pair, period, phase = 0, orient = "V", wave = "square" }) {
  const buf = Buffer.alloc(W * H * 3);
  const [cA, cB] = pair;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let f;
    if (orient === "checker") {
      f = (Math.floor((x + phase) / period) + Math.floor((y + phase) / period)) % 2 === 0 ? 0 : 1;
    } else {
      const t = orient === "V" ? x + phase : orient === "H" ? y + phase : x + y + phase;
      f = wave === "sine"
        ? 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / (2 * period))
        : Math.floor(t / period) % 2 === 0 ? 0 : 1;
    }
    const i = (y * W + x) * 3;
    for (let c = 0; c < 3; c++) buf[i + c] = clamp255(cA[c] + f * (cB[c] - cA[c]));
  }
  return buf;
}
function genFlat(color) {
  const buf = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) { buf[i * 3] = color[0]; buf[i * 3 + 1] = color[1]; buf[i * 3 + 2] = color[2]; }
  return buf;
}
function isoPair(amp) {
  const a = yuv709ToRgb(128, 128 + amp, 128 - amp);
  const b = yuv709ToRgb(128, 128 - amp, 128 + amp);
  return [a.map(clamp255), b.map(clamp255)];
}

const PAIRS = {
  "RC-full": [[255, 0, 0], [0, 255, 255]],
  "RC-mid": [[192, 64, 64], [64, 192, 192]],
  "RC-low": [[144, 112, 112], [112, 144, 144]],
  "GM-mid": [[64, 192, 64], [192, 64, 192]],
  "BY-mid": [[64, 64, 192], [192, 192, 64]],
  "OT-mid": [[192, 128, 64], [64, 128, 192]],
  "ISO-60": isoPair(60),
  "ISO-100": isoPair(100),
};
const GRAY_PAIR = [[192, 192, 192], [64, 64, 64]];
const GRAY_LOW = [[144, 144, 144], [112, 112, 112]];

// ---------- A. Neo sanity (J5 D2) ----------
function runA() {
  console.log("== A. Neo sanity J5 D2 (kernel-diff trilinear-vs-1-kernel) ==");
  const anchors = [
    ["slov", path.join(I4, "render", "plain-slovenska-plain.raw")],
    ["tp", path.join(I4, "render", "check-tp-plain.raw")],
  ];
  for (const [nm, fp] of anchors) {
    const frame = fs.readFileSync(fp);
    if (frame.length !== W * H * 3) { console.log(`  ${nm}: SKIP (size ${frame.length})`); continue; }
    for (const [vw, vh] of [[809, 455], [311, 175]]) {
      const e = evalFrameHarness(frame, vw, vh);
      console.log(`  ${nm} ${vw}x${vh}: d0stdR=${e.d0std[0]} 1k-residStdR=${e.kernels["1kernel"].residStdR} 1k-plainMad=${e.kernels["1kernel"].plainMad}`);
      report.A[`${nm}-${vw}x${vh}`] = e;
    }
  }
}

// ---------- B. Screen sọc ----------
function buildFamilies() {
  const fams = [];
  for (const [pname, pair] of Object.entries(PAIRS)) {
    const periods = (pname === "RC-mid" || pname === "ISO-60") ? [2, 3, 4, 6, 8] : [2, 3, 4, 6];
    for (const p of periods) fams.push({ name: `${pname}-V-p${p}`, pair, period: p, orient: "V" });
  }
  for (const pname of ["RC-mid", "ISO-60"]) {
    fams.push({ name: `${pname}-V-p4-ph1`, pair: PAIRS[pname], period: 4, phase: 1, orient: "V" });
  }
  for (const pname of ["RC-mid", "ISO-60"]) {
    for (const p of [2, 3, 4]) fams.push({ name: `${pname}-chk-p${p}`, pair: PAIRS[pname], period: p, orient: "checker" });
  }
  for (const p of [3, 4]) fams.push({ name: `RC-mid-D-p${p}`, pair: PAIRS["RC-mid"], period: p, orient: "D" });
  for (const p of [2, 3, 4, 6, 8]) fams.push({ name: `GRAY-V-p${p}`, pair: GRAY_PAIR, period: p, orient: "V" });
  fams.push({ name: "GRAYlow-V-p2", pair: GRAY_LOW, period: 2, orient: "V" });
  for (const p of [4, 6]) fams.push({ name: `RC-mid-V-p${p}-sine`, pair: PAIRS["RC-mid"], period: p, orient: "V", wave: "sine" });
  fams.push({ name: "FLAT-redmid", flat: [128, 64, 64] });
  fams.push({ name: "FLAT-gray128", flat: [128, 128, 128] });
  return fams;
}
function runB() {
  console.log("== B1. Screen sọc (1-kernel proxy) ==");
  const fams = buildFamilies();
  console.log(`  ${fams.length} họ × ${RECTS.length} rect`);
  const t0 = Date.now();
  const cands = [];
  for (const fam of fams) {
    const frame = fam.flat ? genFlat(fam.flat) : genStripes(fam);
    const shifted = estShiftFrame_70x6(frame, W, H);
    const rows = {};
    for (const [vw, vh] of RECTS) {
      const e = evalFrameFast(frame, shifted, vw, vh, ["1kernel"]);
      rows[`${vw}x${vh}`] = e;
      if (e.kernels["1kernel"].q4) cands.push({ family: fam.name, rect: `${vw}x${vh}`, kernel: "1kernel", d0stdR: e.d0std[0], residStdR: e.kernels["1kernel"].residStdR, ratioR: e.kernels["1kernel"].ratioR, plainMad: e.kernels["1kernel"].plainMad });
    }
    report.B[fam.name] = rows;
    const best = Object.entries(rows).map(([rect, e]) => `${rect}:d0=${e.d0std[0]},res=${e.kernels["1kernel"].residStdR},ratio=${e.kernels["1kernel"].ratioR}`).join(" | ");
    console.log(`  ${fam.name}: ${best}`);
  }
  console.log(`  B1 xong sau ${((Date.now() - t0) / 1000).toFixed(0)} s. Ứng viên Q4 (1-kernel): ${cands.length}`);
  for (const c of cands) console.log(`  Q4-CANDIDATE: ${JSON.stringify(c)}`);
  report.B_candidates = cands;
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 1)); // checkpoint sau B1

  // B2: xác nhận bằng Mitchell + BC cho họ có d0std_R > 2 hoặc ratio < 2 ở bất kỳ rect nào + toàn bộ đối chứng.
  console.log("== B2. Xác nhận Mitchell + BC ==");
  const t1 = Date.now();
  const shortlist = new Set();
  for (const [fam, rows] of Object.entries(report.B)) {
    for (const e of Object.values(rows)) {
      if (e.d0std[0] > 2.0 || (e.kernels["1kernel"].ratioR !== null && e.kernels["1kernel"].ratioR < 2.0)) shortlist.add(fam);
    }
  }
  for (const fam of Object.keys(report.B)) if (fam.startsWith("GRAY") || fam.startsWith("FLAT")) shortlist.add(fam);
  console.log(`  shortlist ${shortlist.size} họ: ${[...shortlist].join(", ")}`);
  for (const famName of shortlist) {
    const fam = fams.find((f) => f.name === famName);
    const frame = fam.flat ? genFlat(fam.flat) : genStripes(fam);
    const shifted = estShiftFrame_70x6(frame, W, H);
    const rows = {};
    for (const [vw, vh] of RECTS) {
      const e = evalFrameFast(frame, shifted, vw, vh, ["mitchell", "bc025"]);
      rows[`${vw}x${vh}`] = e;
      for (const k of ["mitchell", "bc025"]) {
        if (e.kernels[k].q4) cands.push({ family: famName, rect: `${vw}x${vh}`, kernel: k, d0stdR: e.d0std[0], residStdR: e.kernels[k].residStdR, ratioR: e.kernels[k].ratioR, plainMad: e.kernels[k].plainMad });
      }
    }
    report.B2[famName] = rows;
    const best = Object.entries(rows).map(([rect, e]) => `${rect}:mit-res=${e.kernels.mitchell.residStdR},mit-ratio=${e.kernels.mitchell.ratioR},bc-res=${e.kernels.bc025.residStdR},bc-ratio=${e.kernels.bc025.ratioR}`).join(" | ");
    console.log(`  ${famName}: ${best}`);
    writeFileEpermRetry(OUT, JSON.stringify(report, null, 1)); // checkpoint sau mỗi họ B2
  }
  console.log(`  B2 xong sau ${((Date.now() - t1) / 1000).toFixed(0)} s. Tổng ứng viên Q4 (cả 3 kernel): ${cands.length}`);
  for (const c of cands) console.log(`  Q4-CANDIDATE: ${JSON.stringify(c)}`);
  report.B_candidates = cands;
}

// ---------- C. Encode-aware (ứng viên tốt nhất) ----------
function ff(args, timeoutMs = 300000) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { timeout: timeoutMs });
}
function runC() {
  console.log("== C. Encode-aware (x264 crf 18, chuỗi kiểu F7) ==");
  let cands = report.B_candidates || [];
  if (cands.length === 0) {
    // Khôi phục từ file recovery (B chết giữa chừng, JSON chính chưa ghi).
    const recPath = path.join(K5, "r83k5-recovered-candidates.json");
    if (fs.existsSync(recPath)) {
      const rec = JSON.parse(fs.readFileSync(recPath, "utf8"));
      cands = rec.candidates || [];
      report.B_candidates = cands;
      report.B_recovered = rec.pairs || {};
      console.log(`  nạp ứng viên từ recovery: ${cands.length}`);
    }
  }
  let picks = [];
  if (cands.length > 0) {
    // Khử trùng theo (họ, rect) — cùng cặp có thể là ứng viên ở nhiều kernel.
    const seen = new Set();
    picks = [...cands]
      .sort((a, b) => Math.abs(a.ratioR - 1) - Math.abs(b.ratioR - 1))
      .filter((c) => { const k = `${c.family}@${c.rect}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 3);
    // Near-miss: tồn tại kernel k với d0>2 ∧ ratio_k<1 ∧ plainMad_k>2,5
    // (cùng một kernel — không trộn minRatio của kernel này với minMad
    // của kernel khác); xếp theo plainMad_k nhỏ nhất.
    if (picks.length < 3 && report.B_recovered) {
      const near = [];
      for (const [key, row] of Object.entries(report.B_recovered)) {
        const [fam, rect] = key.split("@");
        if (seen.has(key)) continue;
        let best = null;
        for (const [k, x] of Object.entries(row.kernels)) {
          if (row.d0std[0] > 2.0 && x.ratioR !== null && x.ratioR < 1.0 && x.plainMad > 2.5) {
            if (!best || x.plainMad < best.plainMad) best = { family: fam, rect, kernel: k, d0stdR: row.d0std[0], minRatio: x.ratioR, minMad: x.plainMad };
          }
        }
        if (best) near.push(best);
      }
      near.sort((a, b) => a.minMad - b.minMad);
      for (const n of near.slice(0, 3 - picks.length)) { picks.push(n); seen.add(`${n.family}@${n.rect}`); }
    }
  } else {
    const scored = [];
    for (const [fam, rows] of Object.entries(report.B)) {
      for (const [rect, e] of Object.entries(rows)) {
        const k = e.kernels["1kernel"];
        scored.push({ family: fam, rect, d0stdR: e.d0std[0], residStdR: k.residStdR, ratioR: k.ratioR, plainMad: k.plainMad });
      }
    }
    scored.sort((a, b) => (b.d0stdR / Math.max(b.ratioR, 0.01)) - (a.d0stdR / Math.max(a.ratioR, 0.01)));
    picks = scored.filter((s) => s.d0stdR > 2).slice(0, 3);
  }
  console.log(`  picks: ${JSON.stringify(picks)}`);
  const fams = buildFamilies();
  const byName = Object.fromEntries(fams.map((f) => [f.name, f]));
  for (const pick of picks) {
    const fam = byName[pick.family];
    if (!fam) { console.log(`  SKIP ${pick.family} (không tìm thấy họ)`); continue; }
    const frame = fam.flat ? genFlat(fam.flat) : genStripes(fam);
    const [vw, vh] = pick.rect.split("x").map(Number);
    const rawPath = path.join(MEDIA, `${pick.family}-${pick.rect}.rgb`);
    const mp4Path = path.join(MEDIA, `${pick.family}-${pick.rect}.mp4`);
    const decPath = path.join(MEDIA, `${pick.family}-${pick.rect}-dec.rgb`);
    writeFileEpermRetry(rawPath, frame);
    // -stream_loop -1 BẮT BUỘC: input là 1 frame raw duy nhất; không có nó
    // mp4 chỉ có nb_frames=1 và select=eq(n,15) ở bước decode chọn được
    // 0 frame (đã gặp: dec.rgb 0 byte, mọi số sau đó là rác). (-loop chỉ
    // dùng cho image2, không dùng được với rawvideo.)
    ff(["-stream_loop", "-1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", "30", "-i", rawPath,
      "-frames:v", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "veryfast", mp4Path]);
    // -vsync vfr BẮT BUỘC với select: không có nó, ffmpeg (cfr mặc định)
    // có thể xuất 0 frame (đã gặp: dec.rgb 0 byte → mọi số sau đó là rác).
    ff(["-i", mp4Path, "-vf", "select=eq(n\\,15)", "-vsync", "vfr", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", decPath]);
    const decSize = fs.statSync(decPath).size;
    if (decSize !== W * H * 3) throw new Error(`decode rỗng/sai kích thước: ${decPath} (${decSize} byte, cần ${W * H * 3})`);
    const dec = fs.readFileSync(decPath);
    const encStd = diffStd(dec, frame);
    const encMad = absMadRaw(dec, frame);
    const tri = resampleRgb24Trilinear(frame, W, H, vw, vh);
    const px = resampleRgb24(dec, W, H, vw, vh);
    const residStd = diffStd(px, tri);
    const plainMad = absMadRaw(px, tri);
    const d0 = delta0Viewport_70x6(frame, W, H, vw, vh);
    const d0std = stdPerChannel(d0);
    const rec = {
      family: pick.family, rect: pick.rect, codec: "x264-crf18",
      encStd1280: encStd.map(r4), encMad1280: r4(encMad),
      d0stdR: r4(d0std[0]), residStdR: r4(residStd[0]), residStd: residStd.map(r4),
      plainMad: r4(plainMad), ratioR: residStd[0] > 0 ? r4(d0std[0] / residStd[0]) : null,
      q4: plainMad <= 2.5 && d0std[0] > 2.0 && residStd[0] > 0 && d0std[0] / residStd[0] <= 1.0,
    };
    console.log(`  ${pick.family} ${pick.rect}: encStd1280_R=${rec.encStd1280[0]} encMad=${rec.encMad1280} d0stdR=${rec.d0stdR} residStdR=${rec.residStdR} plainMad=${rec.plainMad} ratioR=${rec.ratioR} q4=${rec.q4}`);
    report.C[`${pick.family}@${pick.rect}`] = rec;
  }
}

if (!ONLY || ONLY === "A") runA();
if (!ONLY || ONLY === "B") runB();
if (!ONLY || ONLY === "C") {
  if (ONLY === "C" && Object.keys(report.B).length === 0 && fs.existsSync(OUT)) {
    const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
    report.B = prev.B || {};
    report.B2 = prev.B2 || {};
    report.B_candidates = prev.B_candidates || [];
  }
  runC();
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 1));
console.log(`Ghi ${OUT}`);
