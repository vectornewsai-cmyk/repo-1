#!/usr/bin/env node
/**
 * r80h4-blend-build.mjs — Phase 9 đợt 80, luồng H4: BUILD nội dung tổng
 * hợp blend slovenska × ocean (ứng viên Q4 từ r80h4-q4-screen.mjs) thành
 * video mp4 + frame render plain/noise05/noise10 để capture headed.
 *
 * CHUỖI BUILD (theo đúng method Z2/G6, đã kiểm chứng ở bước 0):
 *  0. KIỂM CHỨNG CHUỖI: decode test-pattern.mp4 frame 30 bằng cùng
 *     lệnh select+scale bt709 → so MAD với R66T3 fullrgb-plain.raw
 *     (phải ~0 — chứng minh chuỗi tái lập frame render chuẩn).
 *     Kiểm chứng nhiễu: build lại noise05 test-pattern bằng cùng chuỗi
 *     noise (alls=28) → so std/kurt với fullrgb-noise05.raw (cùng
 *     strength, realization khác nên chỉ so thống kê, không so byte).
 *  1. Blend RGB: (1-α)·slovenska + α·ocean từ frame render plain 1280x720.
 *  2. Encode video mp4 4 s @30fps (still — mọi frame giống nhau):
 *     libx264 crf 18, yuv420p, bt709. Frame 30 (playhead 1,0 s) là frame
 *     tham chiếu (khớp R79G6_PLAYHEAD=1.0 của capture).
 *  3. Render plain: decode video → select frame 30 → scale 1280:720
 *     bt709 → rgb24 (chuỗi Z2).
 *  4. Render noise05/noise10: yuv420p frame 30 → noise=alls=28/50:allf=t
 *     → rgb24 bt709 (chuỗi Z2: alls=28 cho t=0,5; 50 cho t=1,0).
 *  5. Kiểm chứng encode: decode frame 30 từ mp4 vừa encode → so MAD
 *     với blend RGB gốc (lossy x264 crf 18 phải nhỏ; báo số thật).
 *
 * File ra (KHÔNG stage — binary; script này là cách tái lập):
 *   hidden_files/round80-h4/media/blend-slov-ocean-a0625.mp4 (và a075)
 *   hidden_files/round80-h4/render/blend-slov-ocean-a0625-{plain,noise05,noise10}.raw
 * Chạy (từ gốc repo): node apps/web/scripts/r80h4-blend-build.mjs [a0625] [a075]
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const R65 = path.join(GOAL, "round65-s7");
const H4 = path.join(GOAL, "round80-h4");
const MEDIA = path.join(H4, "media");
const RENDER = path.join(H4, "render");
fs.mkdirSync(MEDIA, { recursive: true });
fs.mkdirSync(RENDER, { recursive: true });

const W = 1280, H = 720;
// argv: [alpha...] [family] — family: "slov-ocean" (mặc định) | "tp-slov".
// alpha dạng a0625/a65 (số sau "a" là phần thập phân, vd a085 → 0,85).
const FAMILY = process.argv.includes("tp-slov") ? "tp-slov" : "slov-ocean";
const ALPHAS = process.argv.slice(2).filter((a) => a.startsWith("a")).map((a) => Number(a.replace(/^a0?/, "0.")));
if (!ALPHAS.length) ALPHAS.push(...(FAMILY === "tp-slov" ? [0.85] : [0.625, 0.75]));

function ff(args, label) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { timeout: 180000 });
}
function madBetween(a, b) {
  let s = 0, max = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); s += d; if (d > max) max = d; }
  return { mad: +(s / a.length).toFixed(3), max };
}
function frameStats(buf) {
  const n = buf.length / 3;
  const out = { std: [], kurt: [] };
  for (let c = 0; c < 3; c++) {
    let mean = 0; for (let i = c; i < buf.length; i += 3) mean += buf[i]; mean /= n;
    let s2 = 0, s4 = 0;
    for (let i = c; i < buf.length; i += 3) { const v = buf[i] - mean; s2 += v * v; s4 += v * v * v * v; }
    const sd = Math.sqrt(s2 / n);
    out.std.push(+sd.toFixed(2));
    out.kurt.push(+(s4 / n / (sd ** 4) - 3).toFixed(2));
  }
  return out;
}

async function main() {
  // ---- 0. Kiểm chứng chuỗi Z2 bằng test-pattern ----
  console.log("== 0. Kiểm chứng chuỗi build bằng test-pattern ==");
  const tpMp4 = path.join(R65, "media", "test-pattern.mp4");
  const tpCheck = path.join(RENDER, "check-tp-plain.raw");
  ff(["-i", tpMp4, "-vf", "select=eq(n\\,30),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", tpCheck], "decode tp frame 30");
  const tpPlain = fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw"));
  const tpDecoded = fs.readFileSync(tpCheck);
  const tpMad = madBetween(tpDecoded, tpPlain);
  console.log(`  decode test-pattern.mp4 frame 30 (chuỗi Z2) vs fullrgb-plain.raw: MAD=${tpMad.mad} max=${tpMad.max} (kỳ vọng ~0)`);
  // Nhiễu: yuv420p frame 30 → noise alls=28 → rgb24 bt709; so thống kê với noise05 gốc.
  const tpYuv = path.join(RENDER, "check-tp-plain.yuv");
  ff(["-i", tpMp4, "-vf", "select=eq(n\\,30),scale=1280:720", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", tpYuv], "tp yuv");
  const tpNoise = path.join(RENDER, "check-tp-noise05.raw");
  ff(["-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "yuv420p", "-i", tpYuv,
    "-vf", "noise=alls=28:allf=t,scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709",
    "-f", "rawvideo", "-pix_fmt", "rgb24", tpNoise], "tp noise05");
  const tpNoise05 = fs.readFileSync(path.join(R66T3, "fullrgb-noise05.raw"));
  const tpNoiseBuilt = fs.readFileSync(tpNoise);
  console.log(`  noise05 gốc: ${JSON.stringify(frameStats(tpNoise05))}`);
  console.log(`  noise05 build lại (alls=28): ${JSON.stringify(frameStats(tpNoiseBuilt))}`);
  const chainOk = tpMad.mad <= 0.05;
  console.log(`  kết luận chuỗi plain: ${chainOk ? "KHỚP (MAD ≤ 0,05) — dùng được cho blend" : "LỆCH — DỪNG, xem lại chuỗi"}`);
  if (!chainOk) { process.exitCode = 2; return; }

  // ---- 1-5. Build từng blend ----
  const FAMILIES = {
    "slov-ocean": { a: "slovenska", b: "ocean", prefix: "blend-slov-ocean" },
    "tp-slov": { a: "test-pattern", b: "slovenska", prefix: "blend-tp-slov" },
  };
  const fam = FAMILIES[FAMILY];
  const frameA = fs.readFileSync(path.join(fam.a === "test-pattern" ? R66T3 : RENDER_NEW,
    fam.a === "test-pattern" ? "fullrgb-plain.raw" : `fullrgb-${fam.a}-plain.raw`));
  const frameB = fs.readFileSync(path.join(RENDER_NEW, `fullrgb-${fam.b}-plain.raw`));
  for (const alpha of ALPHAS) {
    const tag = `a${String(alpha).replace("0.", "")}`;
    const name = `${fam.prefix}-${tag}`;
    console.log(`== blend ${name} (α=${alpha}) ==`);
    const blendRgb = Buffer.alloc(W * H * 3);
    for (let i = 0; i < blendRgb.length; i++) blendRgb[i] = Math.round(frameA[i] * (1 - alpha) + frameB[i] * alpha);
    const rgbPath = path.join(RENDER, `${name}.rgb`);
    writeFileEpermRetry(rgbPath, blendRgb);
    const mp4 = path.join(MEDIA, `${name}.mp4`);
    ff(["-stream_loop", "-1", "-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "rgb24", "-framerate", "30", "-i", rgbPath,
      "-t", "4", "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-crf", "18", "-g", "30", mp4], `encode ${name}.mp4`);
    console.log(`  video: ${mp4} (${fs.statSync(mp4).size} byte)`);
    // Kiểm chứng encode: decode frame 30 → so với blend RGB gốc.
    const decPath = path.join(RENDER, `${name}-decoded30.raw`);
    ff(["-i", mp4, "-vf", "select=eq(n\\,30),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", decPath], "decode blend frame 30");
    const decoded = fs.readFileSync(decPath);
    const encMad = madBetween(decoded, blendRgb);
    console.log(`  encode check (decode frame 30 vs blend RGB gốc): MAD=${encMad.mad} max=${encMad.max}`);
    // Render plain = chính frame decode đó (chuỗi Z2).
    const plainPath = path.join(RENDER, `${name}-plain.raw`);
    fs.copyFileSync(decPath, plainPath);
    // Render noise: yuv420p → noise → rgb24 bt709.
    const yuvPath = path.join(RENDER, `${name}.yuv`);
    ff(["-i", mp4, "-vf", "select=eq(n\\,30),scale=1280:720", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvPath], "blend yuv");
    for (const [lv, alls] of [["noise05", 28], ["noise10", 50]]) {
      const outPath = path.join(RENDER, `${name}-${lv}.raw`);
      ff(["-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "yuv420p", "-i", yuvPath,
        "-vf", `noise=alls=${alls}:allf=t,scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", outPath], `blend ${lv}`);
      const st = frameStats(fs.readFileSync(outPath));
      console.log(`  ${lv} (alls=${alls}): std=${JSON.stringify(st.std)} kurt=${JSON.stringify(st.kurt)}`);
    }
    console.log(`  plain stats: ${JSON.stringify(frameStats(fs.readFileSync(plainPath)))}`);
  }
  console.log("\nDONE — video + frame render đã build (binary, KHÔNG stage; script này tái lập được).");
}
main().catch((e) => { console.error(`H4-BLEND-BUILD LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
