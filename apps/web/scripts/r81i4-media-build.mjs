#!/usr/bin/env node
/**
 * r81i4-media-build.mjs — Phase 9 đợt 81, luồng I4: BUILD nội dung tổng
 * hợp (blend + chroma-scale) thành video mp4 + frame render plain /
 * noise05 / noise10 để capture headed săn Q4.
 *
 * CHUỖI BUILD (theo đúng method Z2/G6/H4, đã kiểm chứng ở bước 0):
 *  0. KIỂM CHỨNG CHUỖI: decode test-pattern.mp4 frame 30 bằng cùng
 *     lệnh select+scale bt709 → so MAD với R66T3 fullrgb-plain.raw
 *     (phải ~0). Nhiễu: build lại noise05 test-pattern (alls=28) → so
 *     std/kurt với fullrgb-noise05.raw.
 *  1. Tạo frame RGB 1280x720 theo spec: blend RGB (1-α)·A + α·B, hoặc
 *     chroma-scale (giữ Y, scale (Cb-128),(Cr-128) theo s trong YUV709
 *     — cùng công thức r81i4-q4-screen2.mjs).
 *  2. Encode video mp4 4 s @30fps (still — mọi frame giống nhau):
 *     libx264 crf 18, yuv420p, bt709. Frame 30 (playhead 1,0 s) là
 *     frame tham chiếu.
 *  3. Render plain: decode video → select frame 30 → scale 1280:720
 *     bt709 → rgb24 (chuỗi Z2).
 *  4. Render noise05/noise10: yuv420p frame 30 → noise=alls=28/50:allf=t
 *     → rgb24 bt709.
 *  5. Kiểm chứng encode: decode frame 30 từ mp4 vừa encode → so MAD
 *     với frame RGB gốc (lossy x264 crf 18 phải nhỏ; báo số thật).
 *
 * Spec qua argv (mỗi spec một tên):
 *   blend:tp-slov:a0875  | blend:slov-ocean:a065
 *   chroma:slov:s6       | chroma:ocean:s1.2 | chroma:tp:s1.5
 * (α dạng a0875 → 0,875; s dạng s6 → 6, s15 → 1,5.)
 * Mặc định (không argv): blend tp-slov a085 + a0875 (ứng viên Q4 tốt
 * nhất từ screen v2 — rect nhỏ, resid cha cao).
 *
 * File ra (KHÔNG stage — binary; script này là cách tái lập):
 *   hidden_files/round81-i4/media/{name}.mp4
 *   hidden_files/round81-i4/render/{name}-{plain,noise05,noise10}.raw
 * Chạy (từ gốc repo): node apps/web/scripts/r81i4-media-build.mjs [spec...]
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { rgbToYuv709_70x6, yuv709ToRgb_70x6 } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const R65 = path.join(GOAL, "round65-s7");
const I4 = path.join(GOAL, "round81-i4");
const MEDIA = path.join(I4, "media");
const RENDER = path.join(I4, "render");
fs.mkdirSync(MEDIA, { recursive: true });
fs.mkdirSync(RENDER, { recursive: true });

const W = 1280, H = 720;
const SPECS = process.argv.slice(2).length ? process.argv.slice(2) : ["blend:tp-slov:a085", "blend:tp-slov:a0875"];

function ff(args) {
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
function loadPlain(src) {
  const file = src === "test-pattern" || src === "tp" ? "fullrgb-plain.raw"
    : src === "slov" ? "fullrgb-slovenska-plain.raw"
    : `fullrgb-${src}-plain.raw`;
  return fs.readFileSync(path.join(src === "test-pattern" || src === "tp" ? R66T3 : RENDER_NEW, file));
}
function blendRgb(a, b, alpha) {
  const out = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) out[i] = Math.round(a[i] * (1 - alpha) + b[i] * alpha);
  return out;
}
function chromaScale(rgb, s) {
  const out = Buffer.alloc(rgb.length);
  const clamp = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let i = 0; i < rgb.length; i += 3) {
    const [y, cb, cr] = rgbToYuv709_70x6(rgb[i], rgb[i + 1], rgb[i + 2]);
    const [r, g, b] = yuv709ToRgb_70x6(y, 128 + (cb - 128) * s, 128 + (cr - 128) * s);
    out[i] = clamp(r); out[i + 1] = clamp(g); out[i + 2] = clamp(b);
  }
  return out;
}
function parseSpec(spec) {
  const [kind, fam, param] = spec.split(":");
  if (kind === "blend") {
    const [a, b] = fam.split("-");
    const alpha = Number(param.replace(/^a0?/, "0."));
    const name = `blend-${a === "tp" ? "tp" : a}-${b}-a${String(alpha).replace("0.", "")}`;
    return { name, frame: blendRgb(loadPlain(a), loadPlain(b), alpha), detail: `${fam} α=${alpha}` };
  }
  if (kind === "chroma") {
    // Quy ước: s + số nguyên = hệ số nguyên (s6 → 6, s12 → 12);
    // hệ số thập phân viết có dấu chấm, vd s1.5.
    const sv = Number(param.replace(/^s/, ""));
    const name = `${fam}-chroma-s${param.replace(/^s/, "")}`;
    return { name, frame: chromaScale(loadPlain(fam), sv), detail: `${fam} chroma ×${sv}` };
  }
  throw new Error(`spec không hiểu: ${spec} (dạng blend:tp-slov:a0875 | chroma:slov:s6)`);
}

async function main() {
  // ---- 0. Kiểm chứng chuỗi Z2 bằng test-pattern ----
  console.log("== 0. Kiểm chứng chuỗi build bằng test-pattern ==");
  const tpMp4 = path.join(R65, "media", "test-pattern.mp4");
  const tpCheck = path.join(RENDER, "check-tp-plain.raw");
  ff(["-i", tpMp4, "-vf", "select=eq(n\\,30),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", tpCheck]);
  const tpPlain = fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw"));
  const tpDecoded = fs.readFileSync(tpCheck);
  const tpMad = madBetween(tpDecoded, tpPlain);
  console.log(`  decode test-pattern.mp4 frame 30 (chuỗi Z2) vs fullrgb-plain.raw: MAD=${tpMad.mad} max=${tpMad.max} (kỳ vọng ~0)`);
  const tpYuv = path.join(RENDER, "check-tp-plain.yuv");
  ff(["-i", tpMp4, "-vf", "select=eq(n\\,30),scale=1280:720", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", tpYuv]);
  const tpNoise = path.join(RENDER, "check-tp-noise05.raw");
  ff(["-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "yuv420p", "-i", tpYuv,
    "-vf", "noise=alls=28:allf=t,scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709",
    "-f", "rawvideo", "-pix_fmt", "rgb24", tpNoise], "tp noise05");
  const tpNoise05 = fs.readFileSync(path.join(R66T3, "fullrgb-noise05.raw"));
  const tpNoiseBuilt = fs.readFileSync(tpNoise);
  console.log(`  noise05 gốc: ${JSON.stringify(frameStats(tpNoise05))}`);
  console.log(`  noise05 build lại (alls=28): ${JSON.stringify(frameStats(tpNoiseBuilt))}`);
  const chainOk = tpMad.mad <= 0.05;
  console.log(`  kết luận chuỗi plain: ${chainOk ? "KHỚP (MAD ≤ 0,05) — dùng được" : "LỆCH — DỪNG, xem lại chuỗi"}`);
  if (!chainOk) { process.exitCode = 2; return; }

  for (const spec of SPECS) {
    const { name, frame, detail } = parseSpec(spec);
    console.log(`== build ${name} (${detail}) ==`);
    const rgbPath = path.join(RENDER, `${name}.rgb`);
    writeFileEpermRetry(rgbPath, frame);
    const mp4 = path.join(MEDIA, `${name}.mp4`);
    ff(["-stream_loop", "-1", "-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "rgb24", "-framerate", "30", "-i", rgbPath,
      "-t", "4", "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-crf", "18", "-g", "30", mp4]);
    console.log(`  video: ${mp4} (${fs.statSync(mp4).size} byte)`);
    const decPath = path.join(RENDER, `${name}-decoded30.raw`);
    ff(["-i", mp4, "-vf", "select=eq(n\\,30),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", decPath]);
    const decoded = fs.readFileSync(decPath);
    const encMad = madBetween(decoded, frame);
    console.log(`  encode check (decode frame 30 vs frame gốc): MAD=${encMad.mad} max=${encMad.max}`);
    const plainPath = path.join(RENDER, `${name}-plain.raw`);
    fs.copyFileSync(decPath, plainPath);
    const yuvPath = path.join(RENDER, `${name}.yuv`);
    ff(["-i", mp4, "-vf", "select=eq(n\\,30),scale=1280:720", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvPath]);
    for (const [lv, alls] of [["noise05", 28], ["noise10", 50]]) {
      const outPath = path.join(RENDER, `${name}-${lv}.raw`);
      ff(["-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "yuv420p", "-i", yuvPath,
        "-vf", `noise=alls=${alls}:allf=t,scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", outPath]);
      const st = frameStats(fs.readFileSync(outPath));
      console.log(`  ${lv} (alls=${alls}): std=${JSON.stringify(st.std)} kurt=${JSON.stringify(st.kurt)}`);
    }
    console.log(`  plain stats: ${JSON.stringify(frameStats(fs.readFileSync(plainPath)))}`);
  }
  console.log("\nDONE — video + frame render đã build (binary, KHÔNG stage; script này tái lập được).");
}
main().catch((e) => { console.error(`I4-MEDIA-BUILD LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
