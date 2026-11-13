#!/usr/bin/env node
/**
 * r82j4-media-build1920.mjs — Phase 9 đợt 82, luồng J4: BUILD blend-motion
 * ở 1920×1080 (native) để săn Q4 — HƯỚNG SỬA SAU PHÁT HIỆN QUYẾT ĐỊNH.
 *
 * BỐI CẢNH (xem round82-j4.md): blend-motion 1280 a88 cho residStd_R chỉ
 * 0,65 (dự đoán 2,61) — vì resid là tính chất của ĐƯỜNG MEDIA, không phải
 * của chuyển động: media 1920-native có preview 1-bước (1920→viewport)
 * vs render 2-bước (1920→1280 + trilinear) → resid 2,95 (F7 slovenska
 * webm); media 1280-native có cả hai 1-bước → resid 0,65–0,75 (đo trực
 * tiếp: slovenska-720p.mp4 @809 resid 0,7493 vs webm 2,947, cùng nội
 * dung/khung/rect). Blend 1280 dùng resid cha 1920 là sai mô hình.
 *
 * MEDIA (4 s @30fps, 1920×1080, x264 crf 18, bt709):
 *   blend-1920-tp-slov-a88 : tp (upscale 1280→1920) × slovenska webm
 *   (1920 native, 25fps → fps=30) α=0,88 slov. Dự đoán resid
 *   ≥ 0,88·2,95 ≈ 2,60 → ratio ≤ 2,33/2,60 ≈ 0,90 → Q4 (d0std_R kỳ
 *   vọng ~2,3 như blend 1280, đo lại bằng screen trên frame decode).
 *
 * RENDER THAM CHIẾU (theo đúng method Z2 cho nguồn 1920):
 *   plain 1280 = C3 (resampleRgb24Trilinear — ứng viên thắng cho
 *   slovenska ở Z2 §3.1, cũng là downscale F7 dùng cho render-1k)
 *   trên frame 30 decode từ mp4 1920 (t=1,0 s @30fps).
 *   noise05/10 = noise ffmpeg (alls=28/50) cộng SAU downscale (method F
 *   của Z2 — realization mới cùng phân phối, verdict là thống kê).
 * Kiểm chứng: chuỗi Z2 (tp MAD=0); MOTION (f30 vs f45 MAD >> 0);
 * BLEND (decode f30 vs node-blend tp-upscale-1920 + webm-f25-1920 —
 * MAD nhỏ, xác nhận A/B + trọng số; chênh do blend YUV420 + encode).
 *
 * File ra (KHÔNG stage — binary; script này là cách tái lập):
 *   hidden_files/round82-j4/media/blend-1920-tp-slov-a88.mp4
 *   hidden_files/round82-j4/render/blend-1920-tp-slov-a88-{plain,noise05,noise10}.raw
 * Chạy (từ gốc repo): node apps/web/scripts/r82j4-media-build1920.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runSyncEpermRetry, writeFileEpermRetry } from "./eperm-retry.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const U3 = path.join(GOAL, "round67-u3");
const R65 = path.join(GOAL, "round65-s7");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const J4 = path.join(GOAL, "round82-j4");
const MEDIA = path.join(J4, "media");
const RENDER = path.join(J4, "render");
fs.mkdirSync(MEDIA, { recursive: true });
fs.mkdirSync(RENDER, { recursive: true });

const NAME = "blend-1920-tp-slov-a88";
const ALPHA = 0.88;
const TP_MP4 = path.join(R65, "media", "test-pattern.mp4");
const SLOV_WEBM = path.join(U3, "media", "slovenska.webm");

function ff(args, timeoutMs = 300000) {
  // Đợt 83 K8: ffmpeg retry khi fail vì sóng EPERM (J4: 13 lần fail liên
  // tiếp tối 10/11). Lỗi khác ném ngay sau lần đầu.
  runSyncEpermRetry("ffmpeg", ["-v", "error", "-y", ...args], { timeout: timeoutMs, label: "ffmpeg media-build1920" });
}
function madBetween(a, b) {
  let s = 0, max = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); s += d; if (d > max) max = d; }
  return { mad: +(s / a.length).toFixed(3), max };
}
function frameStats(buf) {
  const n = buf.length / 3;
  const out = { std: [], kurt: [], mean: [] };
  for (let c = 0; c < 3; c++) {
    let mean = 0; for (let i = c; i < buf.length; i += 3) mean += buf[i]; mean /= n;
    let s2 = 0, s4 = 0;
    for (let i = c; i < buf.length; i += 3) { const v = buf[i] - mean; s2 += v * v; s4 += v * v * v * v; }
    const sd = Math.sqrt(s2 / n);
    out.std.push(+sd.toFixed(2));
    out.kurt.push(+(s4 / n / (sd ** 4) - 3).toFixed(2));
    out.mean.push(+mean.toFixed(2));
  }
  return out;
}
function blendRgb(a, b, alpha) {
  const out = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) out[i] = Math.round(a[i] * (1 - alpha) + b[i] * alpha);
  return out;
}
function decodeFrame1920(mp4, n, outPath) {
  ff(["-i", mp4, "-vf", `select=eq(n\\,${n}),scale=1920:1080:in_color_matrix=bt709:out_color_matrix=bt709`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", outPath]);
  return fs.readFileSync(outPath);
}

async function main() {
  // ---- 0. Kiểm chứng chuỗi Z2 bằng test-pattern (như media-build 1280) ----
  console.log("== 0. Kiểm chứng chuỗi build bằng test-pattern ==");
  const tpMp4 = path.join(R65, "media", "test-pattern.mp4");
  const tpCheck = path.join(RENDER, "check-tp-plain-1920.raw");
  ff(["-i", tpMp4, "-vf", "select=eq(n\\,30),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", tpCheck]);
  const tpPlain = fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw"));
  const tpMad = madBetween(fs.readFileSync(tpCheck), tpPlain);
  console.log(`  decode test-pattern.mp4 frame 30 vs fullrgb-plain.raw: MAD=${tpMad.mad} max=${tpMad.max} (kỳ vọng ~0)`);
  if (tpMad.mad > 0.05) { console.log("DỪNG: chuỗi plain không khớp"); process.exitCode = 2; return; }

  // ---- 1. Build blend 1920 ----
  console.log(`== build ${NAME} (tp upscale 1920 × slov webm 1920, α=${ALPHA}) ==`);
  const mp4 = path.join(MEDIA, `${NAME}.mp4`);
  ff(["-i", TP_MP4, "-i", SLOV_WEBM,
    "-filter_complex",
    `[0:v]fps=30,scale=1920:1080:flags=bicubic[tp];[1:v]fps=30,scale=1920:1080:flags=bicubic[sl];[tp][sl]blend=all_expr='A*${(1 - ALPHA).toFixed(3)}+B*${ALPHA.toFixed(3)}',format=yuv420p[out]`,
    "-map", "[out]", "-t", "4", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-crf", "18", "-g", "30", mp4]);
  console.log(`  video: ${mp4} (${fs.statSync(mp4).size} byte)`);
  const f30 = decodeFrame1920(mp4, 30, path.join(RENDER, `${NAME}-decoded30-1920.raw`));
  const f45 = decodeFrame1920(mp4, 45, path.join(RENDER, `${NAME}-decoded45-1920.raw`));
  console.log(`  MOTION check (decode f30 vs f45 @1920): MAD=${madBetween(f30, f45).mad} (kỳ vọng >> 0)`);
  // BLEND check: node-blend tp-upscale-1920 + webm-f25-1920.
  const tp1920 = path.join(RENDER, "check-tp-f30-1920.raw");
  ff(["-i", TP_MP4, "-vf", "select=eq(n\\,30),scale=1920:1080:in_color_matrix=bt709:out_color_matrix=bt709",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", tp1920]);
  const webmF25 = path.join(RENDER, "check-webm-f25-1920.raw");
  ff(["-i", SLOV_WEBM, "-vf", "select=eq(n\\,25),scale=1920:1080",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", webmF25]);
  const expect30 = blendRgb(fs.readFileSync(tp1920), fs.readFileSync(webmF25), ALPHA);
  const blendMad = madBetween(f30, expect30);
  console.log(`  BLEND check (decode f30 vs node-blend tp-1920+webm-f25): MAD=${blendMad.mad} max=${blendMad.max} (kỳ vọng nhỏ — xác nhận A/B + trọng số; chênh do blend YUV420 + encode + fps 25→30)`);

  // ---- 2. Render tham chiếu 1280: C3 trilinear RGB (Z2 slovenska winner) ----
  const plain1280 = resampleRgb24Trilinear(f30, 1920, 1080, 1280, 720);
  const plainPath = path.join(RENDER, `${NAME}-plain.raw`);
  writeFileEpermRetry(plainPath, plain1280);
  console.log(`  plain 1280 (C3): ${JSON.stringify(frameStats(plain1280))}`);
  // Noise: plain 1280 RGB -> yuv420p -> noise filter -> rgb24 (method F).
  const yuvPath = path.join(RENDER, `${NAME}.yuv`);
  ff(["-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "rgb24", "-i", plainPath,
    "-vf", "scale=1280:720", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvPath]);
  for (const [lv, alls] of [["noise05", 28], ["noise10", 50]]) {
    const outPath = path.join(RENDER, `${NAME}-${lv}.raw`);
    ff(["-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "yuv420p", "-i", yuvPath,
      "-vf", `noise=alls=${alls}:allf=t,scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709`,
      "-f", "rawvideo", "-pix_fmt", "rgb24", outPath]);
    console.log(`  ${lv} (alls=${alls}): ${JSON.stringify(frameStats(fs.readFileSync(outPath)))}`);
  }
  console.log("\nDONE — blend 1920 + frame render (C3) đã build (binary, KHÔNG stage; script này tái lập được).");
}
main().catch((e) => { console.error(`J4-MEDIA-BUILD1920 LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
