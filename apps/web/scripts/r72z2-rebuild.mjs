#!/usr/bin/env node
/**
 * r72z2-rebuild.mjs — Phase 9 đợt 72, luồng Z2: khớp bước 1920→1280 của
 * frame render với BỘ LỌC VIDEO-PATH THẬT của Chrome, rồi đo lại verdict.
 *
 * Bối cảnh (docs/PHASE9_ROUND71_Y2_KURT_R_LIMITS.md §4.3/§5):
 * - Frame render đối chiếu của Y2 build bằng ffmpeg scale 1920→1280
 *   bicubic (đã tái lập đúng từng byte ở đây: lệnh scale bt709 in/out
 *   cho MAD 0.0 vs fullrgb-*-plain.raw cũ, cả 3 nguồn tự nhiên).
 * - Preview plain vẽ <video> 1920×1080 thẳng xuống viewport (1 bước);
 *   preview noise qua effectCanvas 1280×720 (1920→1280 rồi →viewport).
 *   Render Y2 là 2 bước cho cả plain lẫn noise (bicubic 1920→1280 +
 *   trilinear model 1280→viewport). Plain absMAD ocean 4,46 (w1440)
 *   là bằng chứng bước 1920→1280 lệch nhiều trên texture sóng + bão hoà.
 * - Probe video-path của Y2 (§2/§3): ở thang s=0,667 (1920→1280),
 *   1-kernel (triangle h=1) fit tốt nhất (MAD 0,0005), trilinear 0,0135.
 *
 * Script này, cho mỗi nguồn tự nhiên (ocean f25 / basgo f30 /
 * slovenska f25 — khung đã chốt bằng tái lập byte-identical):
 *  1. Build 3 ứng viên plain 1280×720 từ khung gốc 1920×1080:
 *     C1 = 1-kernel RGB  (resampleRgb24 — triangle h=1, s=0,667)
 *     C2 = 1-kernel YUV  (resampleYuv420p — từng plane YUV420p, h=1)
 *     C3 = trilinear RGB (resampleRgb24Trilinear — LOD-bias −0,5)
 *     C0 = baseline cũ: ffmpeg bicubic (file fullrgb-*-plain.raw của Y2).
 *  2. So plain absMAD vs snapshot headed Y2 (2 cửa sổ, bước 2 dùng
 *     trilinear production 1280→viewport như Y2) + chẩn đoán 1-bước
 *     trực tiếp 1920→viewport (trilinear và 1-kernel) để thấy sàn cấu
 *     trúc (2 bước vs 1 bước).
 *  3. Chọn ứng viên thắng theo plain absMAD trung bình 2 cửa sổ; build
 *     frame noise cho ứng viên thắng bằng CHUYỂN DELTA RGB:
 *     noiseMới = plainMới + (noiseCũ − plainCũ). Delta này là trường
 *     nhiễu thuần ở 1280 (nhiễu ffmpeg cộng SAU scale nên không chứa
 *     thành phần scale), chuyển sang plain mới là đúng biến cần cô lập.
 *     Kiểm tra toàn vẹn chuyển: đếm pixel bị kẹp rail + MAD giữa
 *     (noiseMới−noiseCũ) và (plainMới−plainCũ).
 *  4. Ghi frame thắng vào hidden_files/round72-z2/render-1k/
 *     fullrgb-{src}-{plain,noise05,noise10}.raw để r72z2-analyze.mjs
 *     đo lại verdict. Frame ứng viên + frame gốc CHỈ để nội bộ, KHÔNG
 *     stage (chỉ script + LIMITS + JSON tóm tắt được stage).
 *
 * testsrc2 KHÔNG rebuild: test-pattern.mp4 gốc chỉ 1280×720 nên không
 * có bước 1920→1280 (xem LIMITS Z2 §1) — verdict w1920 noise10 của nó
 * được đo lại trong r72z2-analyze.mjs bằng mô hình viewport theo thang.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r72z2-rebuild.mjs
 * Exit 0 khi rebuild xong. KHÔNG push/tag/binary.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resampleRgb24, resampleRgb24Trilinear, resampleYuv420p,
} from "./chrome-resample.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const Z2 = path.join(GOAL, "round72-z2");
const NATIVE = path.join(Z2, "native");
const RENDER_NAT = path.join(Y2, "render-nat");
const OUT_DIR = path.join(Z2, "render-1k");
fs.mkdirSync(OUT_DIR, { recursive: true });

const SOURCES = {
  ocean: { frame: 25, rgb: "ocean-f25-1920.rgb", yuv: "ocean-f25-1920.yuv" },
  basgo: { frame: 30, rgb: "basgo-f30-1920.rgb", yuv: "basgo-f30-1920.yuv" },
  slovenska: { frame: 25, rgb: "slovenska-f25-1920.rgb", yuv: "slovenska-f25-1920.yuv" },
};
const LEVELS = ["noise05", "noise10"];
// Rect viewport Y2: w1440 489×275 (s=0,3819 từ 1280), w1920 809×455 (s=0,6319).
const WINDOWS = { w1440: [489, 275], w1920: [809, 455] };

function absMad(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0, le32 = 0, max = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]);
      sum += d;
      if (d > dmax) dmax = d;
    }
    if (dmax > max) max = dmax;
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  return { n, mad: +(sum / (n * 3)).toFixed(3), max: +max.toFixed(1), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4) };
}
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }

async function main() {
  const report = { candidates: {}, winners: {}, transfer: {}, oneStep: {} };
  for (const [src, cfg] of Object.entries(SOURCES)) {
    console.log(`\n=== ${src} (frame ${cfg.frame}) ===`);
    const nativeRgb = fs.readFileSync(path.join(NATIVE, cfg.rgb));
    const nativeYuv = fs.readFileSync(path.join(NATIVE, cfg.yuv));
    if (nativeRgb.length !== 1920 * 1080 * 3) throw new Error(`${src}: native RGB sai kích thước`);
    if (nativeYuv.length !== 1920 * 1080 * 3 / 2) throw new Error(`${src}: native YUV sai kích thước`);
    const oldPlain = fs.readFileSync(path.join(RENDER_NAT, `fullrgb-${src}-plain.raw`));

    // --- Build 3 ứng viên plain 1280 ---
    const cands = {};
    const t0 = Date.now();
    cands["C1-1k-rgb"] = resampleRgb24(nativeRgb, 1920, 1080, 1280, 720);
    console.log(`  C1 1-kernel RGB: ${(Date.now() - t0) / 1000}s`);
    const t1 = Date.now();
    cands["C2-1k-yuv"] = resampleYuv420p(nativeYuv, 1920, 1080, 1280, 720);
    console.log(`  C2 1-kernel YUV: ${(Date.now() - t1) / 1000}s`);
    const t2 = Date.now();
    cands["C3-tri-rgb"] = resampleRgb24Trilinear(nativeRgb, 1920, 1080, 1280, 720);
    console.log(`  C3 trilinear RGB: ${(Date.now() - t2) / 1000}s`);
    cands["C0-ff-bicubic"] = oldPlain;
    for (const [name, buf] of Object.entries(cands)) {
      writeFileEpermRetry(path.join(OUT_DIR, `fullrgb-${src}-plain-${name}.raw`), buf);
    }
    // Mức chênh giữa ứng viên và baseline (đo trực tiếp ở 1280).
    for (const name of ["C1-1k-rgb", "C2-1k-yuv", "C3-tri-rgb"]) {
      console.log(`  plain1280 ${name} vs C0: MAD=${absMad(cands[name], oldPlain).mad}`);
    }

    // --- Plain absMAD vs snapshot Y2 (bước 2: trilinear 1280→viewport) ---
    const perCand = {};
    for (const [w, [vw, vh]] of Object.entries(WINDOWS)) {
      const snapsDoc = JSON.parse(fs.readFileSync(path.join(Y2, `headed-${w}`, `r71y2-snaps-${w}.json`), "utf8"));
      const prevPlain = b64ToRgb(snapsDoc.snaps[src].plain.rgbB64);
      if (prevPlain.length !== vw * vh * 3) throw new Error(`${src} ${w}: snapshot sai kích thước`);
      perCand[w] = {};
      for (const [name, buf] of Object.entries(cands)) {
        const vp = resampleRgb24Trilinear(buf, 1280, 720, vw, vh);
        const m = absMad(prevPlain, vp);
        perCand[w][name] = m;
        console.log(`  ${w} plain absMAD ${name}: mad=${m.mad} le8=${m.le8} max=${m.max}`);
      }
      // Chẩn đoán 1-bước: native 1920 → viewport trực tiếp.
      const osTri = resampleRgb24Trilinear(nativeRgb, 1920, 1080, vw, vh);
      const os1k = resampleRgb24(nativeRgb, 1920, 1080, vw, vh);
      const mTri = absMad(prevPlain, osTri), m1k = absMad(prevPlain, os1k);
      report.oneStep[`${src}-${w}`] = { trilinear: mTri, "1-kernel": m1k };
      console.log(`  ${w} 1-BƯỚC 1920→viewport: trilinear mad=${mTri.mad} le8=${mTri.le8} | 1-kernel mad=${m1k.mad} le8=${m1k.le8}`);
    }
    // Chọn thắng: trung bình MAD 2 cửa sổ (thấp nhất).
    let best = null, bestMean = Infinity;
    for (const name of Object.keys(cands)) {
      const mean = (perCand.w1440[name].mad + perCand.w1920[name].mad) / 2;
      console.log(`  ${name}: mean plain absMAD 2 cửa sổ = ${mean.toFixed(3)}`);
      if (mean < bestMean) { bestMean = mean; best = name; }
    }
    console.log(`  ==> THẮNG: ${best} (mean ${bestMean.toFixed(3)})`);
    report.candidates[src] = perCand;
    report.winners[src] = { winner: best, meanMad: +bestMean.toFixed(3) };

    // --- Build noise cho ứng viên thắng bằng chuyển delta RGB ---
    const winPlain = cands[best];
    writeFileEpermRetry(path.join(OUT_DIR, `fullrgb-${src}-plain.raw`), winPlain);
    report.transfer[src] = {};
    for (const lv of LEVELS) {
      const oldNoise = fs.readFileSync(path.join(RENDER_NAT, `fullrgb-${src}-${lv}.raw`));
      const out = Buffer.alloc(1280 * 720 * 3);
      let clipped = 0, clipMag = 0;
      let sumDiff = 0, maxDiff = 0; // |noiseMới−noiseCũ| vs |plainMới−plainCũ|
      for (let i = 0; i < out.length; i++) {
        const v = winPlain[i] + (oldNoise[i] - oldPlain[i]);
        const vc = v < 0 ? 0 : v > 255 ? 255 : v;
        if (vc !== v) { clipped++; clipMag += Math.abs(vc - v); }
        out[i] = vc;
        const dTransfer = Math.abs(out[i] - oldNoise[i]);
        const dPlain = Math.abs(winPlain[i] - oldPlain[i]);
        sumDiff += Math.abs(dTransfer - dPlain);
        if (Math.abs(dTransfer - dPlain) > maxDiff) maxDiff = Math.abs(dTransfer - dPlain);
      }
      writeFileEpermRetry(path.join(OUT_DIR, `fullrgb-${src}-${lv}.raw`), out);
      const n = out.length;
      report.transfer[src][lv] = {
        clippedPixels: clipped, clippedFrac: +(clipped / (n / 3)).toFixed(5),
        meanClipMag: clipped ? +(clipMag / clipped).toFixed(2) : 0,
        transferResidueMad: +(sumDiff / n).toFixed(4), transferResidueMax: maxDiff,
      };
      console.log(`  ${lv}: chuyển delta — pixel kẹp=${clipped} (${(clipped / (n / 3) * 100).toFixed(3)}%), dư chuyển MAD=${(sumDiff / n).toFixed(4)} max=${maxDiff}`);
    }
  }
  const outJson = path.join(Z2, "r72z2-rebuild.json");
  writeFileEpermRetry(outJson, JSON.stringify(report, null, 2));
  console.log(`\nJSON rebuild: ${outJson}`);
  console.log(`Frame thắng: ${OUT_DIR}/fullrgb-{ocean,basgo,slovenska}-{plain,noise05,noise10}.raw`);
}

main().catch((e) => { console.error(`REBUILD LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
