#!/usr/bin/env node
/**
 * r83k5-q4-verdict.mjs — Phase 9 đợt 83, luồng K5, thí nghiệm D:
 * KIỂM CHỨNG ĐẦY ĐỦ (full verdict) cho ứng viên Q4 từ screen B.
 *
 * Một ứng viên screen (plainMad ≤ 2,5 ∧ d0std_R > 2 ∧ ratio_R ≤ 1) mới chỉ
 * thỏa ĐIỀU KIỆN CỔNG. Để phân biệt thật G1 vs G2, cần verdict thống kê:
 * chạy evalDelta0CaseRaw (số học không làm tròn, như I4) với
 *   prevPlain = proxy-browser downscale(frame 1280),
 *   prevNoise = proxy-browser downscale(frame + nhiễu ffmpeg),
 *   plain1280/noise1280 = frame / frame + nhiễu,
 * với nhiễu noise05 (alls=28) và noise10 (alls=50) như các đợt trước,
 * và với cả 3 kernel proxy làm "browser" (1-kernel, Mitchell, BC).
 * Case phân biệt thật ⟺ verdict KHÔNG-d0 ≠ verdict CÓ-d0 VÀ correct ∈
 * {KHÔNG-d0, CÓ-d0} (không phải "cả-hai-LỆCH"). Hướng phân biệt:
 *   correct = CÓ-d0 → G2 đúng, G1 sai (mẫu Q4 kinh điển);
 *   correct = KHÔNG-d0 → G1 đúng, G2 sai (cũng phân biệt, chiều ngược).
 *
 * Chạy SAU khi screen B xong (đọc r83k5-chromatic-stripes.json).
 * Env: R83K5_D_IN (mặc định hidden_files/round83-k5/r83k5-chromatic-stripes.json),
 *   R83K5_D_OUT (mặc định .../r83k5-q4-verdict.json).
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { evalDelta0CaseRaw } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear, resampleRgb24, chromeWeights1D } from "./chrome-resample.mjs";
import { KERNELS } from "./r82j2-chrome-probe-analyze.mjs";
/** Resample 1 plane bằng kernel cho trước, trọng số cache (sao từ r83k5-chromatic-stripes.mjs — không import module đó vì nó chạy screen khi nạp). */
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

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const K5 = path.join(GOAL, "round83-k5");
const MEDIA = path.join(K5, "media");
fs.mkdirSync(MEDIA, { recursive: true });
const IN = process.env.R83K5_D_IN || path.join(K5, "r83k5-chromatic-stripes.json");
const OUT = process.env.R83K5_D_OUT || path.join(K5, "r83k5-q4-verdict.json");
const W = 1280, H = 720;
const r4 = (x) => +x.toFixed(4);

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
function yuv709ToRgb(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.79274 * (cr - 128), yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128), yy + 2.1122 * (cb - 128)];
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

function buildFrame(name) {
  // Tái tạo frame từ tên họ (cùng quy ước đặt tên với screen B).
  if (name === "FLAT-redmid") return genFlat([128, 64, 64]);
  if (name === "FLAT-gray128") return genFlat([128, 128, 128]);
  if (name.startsWith("GRAYlow")) return genStripes({ pair: GRAY_LOW, period: 2, orient: "V" });
  if (name.startsWith("GRAY")) {
    const p = parseInt(name.match(/p(\d+)/)[1], 10);
    return genStripes({ pair: GRAY_PAIR, period: p, orient: "V" });
  }
  const m = name.match(/^(.+)-(V|chk|D)-p(\d+)(-ph1|-sine)?$/);
  if (!m) throw new Error("không parse được tên họ: " + name);
  const [, pname, orientCode, pStr, suffix] = m;
  const period = parseInt(pStr, 10);
  const orient = orientCode === "V" ? "V" : orientCode === "D" ? "D" : "checker";
  const phase = suffix === "-ph1" ? 1 : 0;
  const wave = suffix === "-sine" ? "sine" : "square";
  return genStripes({ pair: PAIRS[pname], period, phase, orient, wave });
}

function resampleProxy(rgb, vw, vh, kernelName) {
  if (kernelName === "1kernel") return resampleRgb24(rgb, W, H, vw, vh);
  if (kernelName === "tri") return resampleRgb24Trilinear(rgb, W, H, vw, vh);
  const kernel = kernelName === "mitchell" ? KERNELS.mitchell : KERNELS["bc025-0375"];
  const n = W * H, out = Buffer.alloc(vw * vh * 3);
  for (let c = 0; c < 3; c++) {
    const plane = new Float64Array(n);
    for (let i = 0; i < n; i++) plane[i] = rgb[i * 3 + c];
    const rs = resamplePlaneKernelCached(plane, W, H, vw, vh, kernel);
    for (let i = 0; i < vw * vh; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
function ff(args, timeoutMs = 300000) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { timeout: timeoutMs });
}
function noiseFrame(frame, alls, tag) {
  const rawPath = path.join(MEDIA, `d-${tag}.rgb`);
  const outPath = path.join(MEDIA, `d-${tag}-noise${alls}.rgb`);
  if (!fs.existsSync(outPath)) {
    writeFileEpermRetry(rawPath, frame);
    ff(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", "30", "-i", rawPath,
      "-frames:v", "1", "-vf", `noise=alls=${alls}:allf=t`,
      "-f", "rawvideo", "-pix_fmt", "rgb24", outPath]);
  }
  return fs.readFileSync(outPath);
}

function main() {
  const screen = JSON.parse(fs.readFileSync(IN, "utf8"));
  const cands = screen.B_candidates || screen.candidates || [];
  console.log(`Ứng viên screen Q4: ${cands.length}`);
  for (const c of cands) console.log(`  ${JSON.stringify(c)}`);
  const results = [];
  const seen = new Set();
  for (const cand of cands) {
    const key = `${cand.family}@${cand.rect}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const [vw, vh] = cand.rect.split("x").map(Number);
    const frame = buildFrame(cand.family);
    const tag = cand.family.replace(/[^A-Za-z0-9]+/g, "-") + "-" + cand.rect;
    for (const lv of ["noise05", "noise10"]) {
      const alls = lv === "noise05" ? 28 : 50;
      const noise1280 = noiseFrame(frame, alls, tag);
      for (const kernel of ["1kernel", "mitchell", "bc025"]) {
        const prevPlain = resampleProxy(frame, vw, vh, kernel);
        const prevNoise = resampleProxy(noise1280, vw, vh, kernel);
        const ev = evalDelta0CaseRaw({
          name: `${cand.family}@${cand.rect}/${lv}/${kernel}`,
          prevPlain, prevNoise, plain1280: frame, noise1280, vw, vh,
        });
        const distinguishes =
          ev.verdictNoD0 !== ev.verdictFullD0 && ev.correct !== "cả-hai-LỆCH";
        const rec = {
          family: cand.family, rect: cand.rect, noise: lv, kernel,
          screenD0stdR: cand.d0stdR, screenResidR: cand.residStdR, screenRatioR: cand.ratioR,
          plainMad: r4(ev.plainMad), d0stdR: r4(ev.d0stdR), residStdR: r4(ev.residStd[0]),
          ratioR: r4(ev.ratioR),
          gates: ev.gates,
          verdictNoD0: ev.verdictNoD0, verdictFullD0: ev.verdictFullD0,
          kurtDiffNoD0: ev.kurtDiffNoD0.map(r4), kurtDiffFullD0: ev.kurtDiffFullD0.map(r4),
          deltaMadNoD0: r4(ev.deltaMadNoD0), deltaMadFullD0: r4(ev.deltaMadFullD0),
          correct: ev.correct, distinguishes,
          verdictG1: ev.verdictUnder.G1_d0stdR_le_2, verdictG2: ev.verdictUnder.G2_ratioR_le_1,
        };
        console.log(`  ${rec.name || key}/${lv}/${kernel}: mad=${rec.plainMad} d0R=${rec.d0stdR} resR=${rec.residStdR} ratio=${rec.ratioR} noD0=${rec.verdictNoD0} fullD0=${rec.verdictFullD0} correct=${rec.correct} DISTINGUISHES=${distinguishes} (G1→${rec.verdictG1}, G2→${rec.verdictG2})`);
        results.push(rec);
      }
    }
  }
  const dist = results.filter((r) => r.distinguishes);
  console.log(`Case phân biệt thật G1-vs-G2: ${dist.length}/${results.length}`);
  for (const r of dist) console.log(`  DISTINGUISH: ${r.family}@${r.rect} ${r.noise} ${r.kernel} correct=${r.correct}`);
  writeFileEpermRetry(OUT, JSON.stringify({ generated: new Date().toISOString(), candidates: cands, results, distinguishes: dist.length }, null, 1));
  console.log(`Ghi ${OUT}`);
}
main();
