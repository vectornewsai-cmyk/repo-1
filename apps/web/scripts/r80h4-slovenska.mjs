#!/usr/bin/env node
/**
 * r80h4-slovenska.mjs — Phase 9 đợt 80, luồng H4: ĐIỀU TRA phần dư
 * slovenska post-fix (nợ F7 §5.5, G6 §6.5): plainMad gần như không cải
 * thiện sau sửa C1 (1,766 → 1,649 w1440; 1,883 → 1,819 w1920),
 * residStd_R vẫn lớn 2,58–2,95, ratio_R 0,06–0,07. Sửa C1 hầu như
 * không chạm tới phần dư này — dư do nguyên nhân khác, chưa xác định.
 *
 * PHƯƠNG PHÁP (tính toán từ snapshot headed F7 đã có + frame render,
 * không capture mới):
 *  1. resid = previewPlain − renderPlainTri ở rect snapshot; MAD/std
 *     từng kênh; so sánh w1440 (489x275) vs w1920 (809x455).
 *  2. Phân |resid_R| theo decile luma Y của render plain — dư có tập
 *     trung ở vùng tối không (nội dung tối?).
 *  3. Tương quan |resid| với độ lớn gradient cục bộ |∇Y| — dư có phải
 *     ở biên/cạnh không (resample/khử răng cưa?).
 *  4. Bản đồ không gian: mean |resid_R| theo lưới 16×9 — dư có cấu
 *     trúc vùng hay đều khắp.
 *  5. Dấu vết block 8×8: mean |resid| trên biên khối 8×8 vs trong khối
 *     (dấu hiệu decode VP9 / subsample chroma).
 *  6. Đối chứng nguồn decode: giải mã slovenska.webm (VP9, file preview
 *     dùng) và slovenska-720p.mp4 (H.264) frame 25 → rgb24 1280x720
 *     bằng chuỗi Z2 (select + scale bt709), so MAD với frame render
 *     fullrgb-slovenska-plain.raw — nếu một trong hai khớp ~0 thì
 *     render frame = decode của file đó, và phần dư thuộc về đường
 *     preview (canvas), không phải chênh decode.
 *
 * JSON: hidden_files/round80-h4/r80h4-slovenska.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { b64ToRgb, rgbToYuv709_70x6 } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const U3 = path.join(GOAL, "round67-u3");
const F7 = path.join(GOAL, "round78-f7");
const H4 = path.join(GOAL, "round80-h4");
fs.mkdirSync(H4, { recursive: true });
const OUT = path.join(H4, "r80h4-slovenska.json");

function residAnalysis(label, prevPlain, renderPlainTri, vw, vh) {
  const n = vw * vh;
  const resid = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) resid[i] = prevPlain[i] - renderPlainTri[i];
  // 1) MAD/std từng kênh.
  const perChan = [];
  for (let c = 0; c < 3; c++) {
    let sAbs = 0, s = 0, s2 = 0;
    for (let p = 0; p < n; p++) { const v = resid[p * 3 + c]; sAbs += Math.abs(v); s += v; s2 += v * v; }
    const mean = s / n;
    perChan.push({ mad: +(sAbs / n).toFixed(3), mean: +mean.toFixed(3), std: +Math.sqrt(Math.max(0, s2 / n - mean * mean)).toFixed(3) });
  }
  // 2) |resid_R| theo decile luma Y của render plain.
  const Y = new Float64Array(n);
  for (let p = 0; p < n; p++) Y[p] = rgbToYuv709_70x6(renderPlainTri[p * 3], renderPlainTri[p * 3 + 1], renderPlainTri[p * 3 + 2])[0];
  const order = [...Array(n).keys()].sort((a, b) => Y[a] - Y[b]);
  const deciles = [];
  for (let d = 0; d < 10; d++) {
    const slice = order.slice(Math.floor((d * n) / 10), Math.floor(((d + 1) * n) / 10));
    let sR = 0, sY = 0;
    for (const p of slice) { sR += Math.abs(resid[p * 3]); sY += Y[p]; }
    deciles.push({ decile: d, yMean: +(sY / slice.length).toFixed(1), meanAbsResidR: +(sR / slice.length).toFixed(3) });
  }
  // 3) tương quan |resid_R| với |∇Y| (gradient Sobel đơn giản: |dx|+|dy|).
  let sXY = 0, sX = 0, sY2 = 0, mX = 0, mY = 0;
  const grad = new Float64Array(n);
  for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
    const p = y * vw + x;
    const dx = x + 1 < vw ? Math.abs(Y[p + 1] - Y[p]) : 0;
    const dy = y + 1 < vh ? Math.abs(Y[p + vw] - Y[p]) : 0;
    grad[p] = dx + dy;
  }
  const absR = new Float64Array(n);
  for (let p = 0; p < n; p++) absR[p] = Math.abs(resid[p * 3]);
  for (let p = 0; p < n; p++) { mX += grad[p]; mY += absR[p]; }
  mX /= n; mY /= n;
  for (let p = 0; p < n; p++) { const dx = grad[p] - mX, dy = absR[p] - mY; sXY += dx * dy; sX += dx * dx; sY2 += dy * dy; }
  const corrGrad = +(sXY / Math.sqrt(sX * sY2)).toFixed(3);
  // 4) bản đồ lưới 16×9 mean |resid_R|.
  const grid = [];
  const gw = Math.floor(vw / 16), gh = Math.floor(vh / 9);
  for (let gy = 0; gy < 9; gy++) {
    const row = [];
    for (let gx = 0; gx < 16; gx++) {
      let s = 0, cnt = 0;
      for (let y = gy * gh; y < (gy + 1) * gh; y++) for (let x = gx * gw; x < (gx + 1) * gw; x++) { s += Math.abs(resid[(y * vw + x) * 3]); cnt++; }
      row.push(+(s / cnt).toFixed(2));
    }
    grid.push(row);
  }
  // 5) biên khối 8×8 vs trong khối (kênh R).
  let sEdge = 0, nEdge = 0, sIn = 0, nIn = 0;
  for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
    const onEdge = (x % 8 === 0) || (y % 8 === 0);
    const v = Math.abs(resid[(y * vw + x) * 3]);
    if (onEdge) { sEdge += v; nEdge++; } else { sIn += v; nIn++; }
  }
  const blockiness = { edge8x8: +(sEdge / nEdge).toFixed(3), interior: +(sIn / nIn).toFixed(3), ratio: +((sEdge / nEdge) / (sIn / nIn)).toFixed(3) };
  return { label, rect: `${vw}x${vh}`, perChan, deciles, corrAbsResidRvsGradY: corrGrad, grid, blockiness };
}

function decodeFrame(file, frameNo, outPath) {
  // Chuỗi Z2: decode → select frame → scale 1280:720 bt709 → rgb24.
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-vf",
    `select=eq(n\\,${frameNo}),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", outPath], { timeout: 120000 });
  const b = fs.readFileSync(outPath);
  if (b.length !== 1280 * 720 * 3) throw new Error(`decode ${file}: frame sai kích thước ${b.length}`);
  return b;
}

function madBetween(a, b) {
  const n = a.length / 3;
  let s = 0, max = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); s += d; if (d > max) max = d; }
  return { mad: +(s / a.length).toFixed(3), max };
}

async function main() {
  const renderPlain = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw"));
  const out = { generated: new Date().toISOString(), cases: {}, decodeCheck: {} };
  for (const [label, dir, file] of [
    ["w1440", "headed-w1440x900-slovenska-r2", "r78f7-snaps-w1440x900.json"],
    ["w1920", "headed-w1920x1080-slovenska-r2", "r78f7-snaps-w1920x1080.json"],
  ]) {
    const doc = JSON.parse(fs.readFileSync(path.join(F7, dir, file), "utf8"));
    const v = doc.snaps?.slovenska;
    if (!v?.plain) { console.log(`  bỏ ${label}: thiếu snapshot slovenska plain`); continue; }
    const vw = v.plain.w, vh = v.plain.h;
    const renderTri = resampleRgb24Trilinear(renderPlain, 1280, 720, vw, vh);
    const a = residAnalysis(label, b64ToRgb(v.plain.rgbB64), renderTri, vw, vh);
    out.cases[label] = a;
    console.log(`== slovenska ${label} rect=${vw}x${vh} ==`);
    console.log(`  perChan (MAD/mean/std): ${JSON.stringify(a.perChan)}`);
    console.log(`  |resid_R| theo decile luma: ${JSON.stringify(a.deciles.map((d) => [d.yMean, d.meanAbsResidR]))}`);
    console.log(`  corr(|resid_R|, |∇Y|): ${a.corrAbsResidRvsGradY}`);
    console.log(`  block 8x8: biên=${a.blockiness.edge8x8} trong=${a.blockiness.interior} ratio=${a.blockiness.ratio}`);
    console.log(`  lưới 16×9 mean|resid_R| (min/max): ${Math.min(...a.grid.flat())} / ${Math.max(...a.grid.flat())}`);
  }
  // 6) đối chứng nguồn decode.
  console.log("== đối chứng nguồn decode (frame 25 → 1280x720 rgb24, chuỗi Z2) ==");
  const webm = decodeFrame(path.join(U3, "media", "slovenska.webm"), 25, path.join(H4, "slovenska-webm-f25.rgb"));
  const mp4 = decodeFrame(path.join(U3, "media", "slovenska-720p.mp4"), 25, path.join(H4, "slovenska-mp4-f25.rgb"));
  out.decodeCheck.webmVsRender = madBetween(webm, renderPlain);
  out.decodeCheck.mp4VsRender = madBetween(mp4, renderPlain);
  out.decodeCheck.webmVsMp4 = madBetween(webm, mp4);
  console.log(`  webm(VP9) vs render-1k: ${JSON.stringify(out.decodeCheck.webmVsRender)}`);
  console.log(`  mp4(H.264) vs render-1k: ${JSON.stringify(out.decodeCheck.mp4VsRender)}`);
  console.log(`  webm vs mp4: ${JSON.stringify(out.decodeCheck.webmVsMp4)}`);
  writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
  console.log(`\nJSON slovenska: ${OUT}`);
}
main().catch((e) => { console.error(`H4-SLOVENSKA LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
