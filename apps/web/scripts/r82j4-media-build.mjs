#!/usr/bin/env node
/**
 * r82j4-media-build.mjs — Phase 9 đợt 82, luồng J4: BUILD nội dung MOTION
 * (video chuyển động thật, không still-loop) để săn Q4 / phân biệt G2 vs G12.
 *
 * BỐI CẢNH (I4 §4.4/§6.1): mọi nội dung tổng hợp đợt 81 đều là still-loop
 * nên resid của slovenska-like content bị x264 crf 18 làm mượt giết từ
 * 2,95 (video thật) xuống 0,74 — blend a88 chỉ đạt resid 1,22, ratio 1,70,
 * trượt Q4. Nội dung MOTION giữ được resid như video thật: mô hình trung
 * bình-không-tương-quan (I4 §4.3, khớp 2% trên still) dự đoán blend-motion
 * tp×slov a88 có resid ≈ √((0,12×4,46)² + (0,88×2,8)²) ≈ 2,52, ratio
 * ≈ 2,08/2,52 ≈ 0,83 ≤ 1 → Q4 (d0std_R 2,08 > 2, plainMad ~1,1).
 *
 * MEDIA (4 s @30fps, 1280×720, x264 crf 18, bt709 — cùng chuỗi I4):
 *   M1 blend-motion-tp-slov-a88 : blend ffmpeg tp×slov α=0,88 (ứng viên Q4 #1)
 *   M4 blend-motion-tp-slov-a85 : blend ffmpeg tp×slov α=0,85 (d0 2,45, ratio
 *      dự đoán ~0,97 — Q4 sát biên, ứng viên #2)
 *   M2 slov-chroma-motion-s16   : chroma ×16 từng frame slovenska (geq) —
 *      d0 screen ~2,54, resid ~2,95 → ratio ~0,86 → Q4 (ứng viên #3)
 *   M3 slov-chroma-motion-s12   : chroma ×12 (d0 ~1,9 < 2 → KHÔNG Q4 —
 *      đối chứng âm: G1 và G2 cùng áp, không phân biệt)
 * Nguồn: round67-u3/media/{test-pattern,slovenska-720p}.mp4 (đều 1280×720
 * 30fps h264) + round65-s7/media/test-pattern.mp4 (chuỗi kiểm chứng).
 *
 * CHUỖI BUILD (theo đúng method Z2/G6/H4/I4):
 *  0. KIỂM CHỨNG CHUỖI: decode test-pattern.mp4 frame 30 → MAD vs
 *     R66T3 fullrgb-plain.raw (phải ~0); noise05 build lại alls=28 → so
 *     std/kurt với fullrgb-noise05.raw.
 *  0b. KIỂM CHỨNG BLEND FFMPEG: build frame 30 kỳ vọng bằng node
 *     (blendRgb của tp-plain + frame 30 slovenska decode độc lập) → so MAD
 *     với frame 30 decode từ mp4 blend vừa build (phải nhỏ — xác nhận
 *     thứ tự A/B + trọng số của filter blend; blend YUV tuyến tính ≈
 *     blend RGB, sai khác chỉ do làm tròn/clip).
 *  0c. KIỂM CHỨNG CHROMA GEQ: decode frame 30 media chroma → đo stdCb/Cr
 *     (YUV709 node) so với kỳ vọng ×s trên frame slovenska gốc.
 *  1. Encode video mp4 4 s @30fps: libx264 crf 18, yuv420p, bt709.
 *  2. Render plain: decode video → select frame 30 → scale 1280:720
 *     bt709 → rgb24 (chuỗi Z2).
 *  3. Render noise05/noise10: yuv420p frame 30 → noise=alls=28/50:allf=t
 *     → rgb24 bt709.
 *  4. KIỂM CHỨNG MOTION: decode frame 30 vs frame 45 từ mp4 vừa build →
 *     MAD phải >> 0 (chuyển động thật, không still-loop); frame 30 vs
 *     frame 30 của nguồn slovenska (đối chứng chuyển động cùng nhịp).
 *
 * Spec qua argv (mỗi spec một tên): blend-motion:tp-slov:a088 |
 * blend-motion:tp-slov:a085 | chroma-motion:slov:s16 | chroma-motion:slov:s12
 * Mặc định (không argv): cả 4 media.
 *
 * File ra (KHÔNG stage — binary; script này là cách tái lập):
 *   hidden_files/round82-j4/media/{name}.mp4
 *   hidden_files/round82-j4/render/{name}-{plain,noise05,noise10}.raw
 * Chạy (từ gốc repo): node apps/web/scripts/r82j4-media-build.mjs [spec...]
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runSyncEpermRetry } from "./eperm-retry.mjs";
import { rgbToYuv709_70x6 } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const U3 = path.join(GOAL, "round67-u3");
const R65 = path.join(GOAL, "round65-s7");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const RENDER_NEW = path.join(GOAL, "round72-z2", "render-1k");
const J4 = path.join(GOAL, "round82-j4");
const MEDIA = path.join(J4, "media");
const RENDER = path.join(J4, "render");
fs.mkdirSync(MEDIA, { recursive: true });
fs.mkdirSync(RENDER, { recursive: true });

const W = 1280, H = 720;
const SPECS = process.argv.slice(2).length ? process.argv.slice(2) : [
  "blend-motion:tp-slov:a088", "blend-motion:tp-slov:a085",
  "chroma-motion:slov:s16", "chroma-motion:slov:s12",
];
const SLOV_MP4 = path.join(U3, "media", "slovenska-720p.mp4");
const TP_MP4 = path.join(R65, "media", "test-pattern.mp4");

function ff(args, timeoutMs = 300000) {
  // Đợt 83 K8: ffmpeg retry khi fail vì sóng EPERM (J4: 13 lần fail liên
  // tiếp tối 10/11). Lỗi khác ném ngay sau lần đầu.
  runSyncEpermRetry("ffmpeg", ["-v", "error", "-y", ...args], { timeout: timeoutMs, label: "ffmpeg media-build" });
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
/** std Cb/Cr (YUV709 node) của một frame RGB — đo biên độ chroma. */
function chromaStd(buf) {
  const n = buf.length / 3;
  let mCb = 0, mCr = 0;
  const cb = new Float64Array(n), cr = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [, c1, c2] = rgbToYuv709_70x6(buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]);
    cb[i] = c1; cr[i] = c2; mCb += c1; mCr += c2;
  }
  mCb /= n; mCr /= n;
  let sCb = 0, sCr = 0;
  for (let i = 0; i < n; i++) { sCb += (cb[i] - mCb) ** 2; sCr += (cr[i] - mCr) ** 2; }
  return { stdCb: +Math.sqrt(sCb / n).toFixed(2), stdCr: +Math.sqrt(sCr / n).toFixed(2) };
}
function blendRgb(a, b, alpha) {
  const out = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) out[i] = Math.round(a[i] * (1 - alpha) + b[i] * alpha);
  return out;
}
function decodeFrame(mp4, n, outPath) {
  ff(["-i", mp4, "-vf", `select=eq(n\\,${n}),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", outPath]);
  return fs.readFileSync(outPath);
}

function parseSpec(spec) {
  const [kind, fam, param] = spec.split(":");
  if (kind === "blend-motion") {
    const [a, b] = fam.split("-");
    const alpha = Number(param.replace(/^a0?/, "0."));
    const name = `blend-motion-${a === "tp" ? "tp" : a}-${b}-a${String(alpha).replace("0.", "")}`;
    return { kind, name, alpha, detail: `${fam} α=${alpha} (motion)` };
  }
  if (kind === "chroma-motion") {
    const sv = Number(param.replace(/^s/, ""));
    const name = `${fam}-chroma-motion-s${param.replace(/^s/, "")}`;
    return { kind, name, s: sv, detail: `${fam} chroma-motion ×${sv}` };
  }
  throw new Error(`spec không hiểu: ${spec}`);
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
    "-f", "rawvideo", "-pix_fmt", "rgb24", tpNoise]);
  const tpNoise05 = fs.readFileSync(path.join(R66T3, "fullrgb-noise05.raw"));
  const tpNoiseBuilt = fs.readFileSync(tpNoise);
  console.log(`  noise05 gốc: ${JSON.stringify(frameStats(tpNoise05))}`);
  console.log(`  noise05 build lại (alls=28): ${JSON.stringify(frameStats(tpNoiseBuilt))}`);
  const chainOk = tpMad.mad <= 0.05;
  console.log(`  kết luận chuỗi plain: ${chainOk ? "KHỚP (MAD ≤ 0,05) — dùng được" : "LỆCH — DỪNG, xem lại chuỗi"}`);
  if (!chainOk) { process.exitCode = 2; return; }

  // Frame 30 slovenska gốc (decode độc lập) — dùng cho kiểm chứng blend +
  // chroma + đối chứng motion.
  const slovF30 = decodeFrame(SLOV_MP4, 30, path.join(RENDER, "check-slov-f30.raw"));
  const slovF45 = decodeFrame(SLOV_MP4, 45, path.join(RENDER, "check-slov-f45.raw"));
  const slovMotionMad = madBetween(slovF30, slovF45);
  console.log(`  slovenska gốc: frame30 vs frame45 MAD=${slovMotionMad.mad} (chuyển động nguồn, kỳ vọng >> 0)`);
  console.log(`  slovenska f30 chroma: ${JSON.stringify(chromaStd(slovF30))}`);

  for (const spec of SPECS) {
    const p = parseSpec(spec);
    console.log(`== build ${p.name} (${p.detail}) ==`);
    const mp4 = path.join(MEDIA, `${p.name}.mp4`);
    if (p.kind === "blend-motion") {
      // Blend trong YUV (filter blend): tuyến tính nên ≈ blend RGB (sai
      // khác chỉ do làm tròn/clip) — kiểm chứng ở bước 0b dưới.
      ff(["-i", TP_MP4, "-i", SLOV_MP4,
        "-filter_complex", `[0:v][1:v]blend=all_expr='A*${(1 - p.alpha).toFixed(3)}+B*${p.alpha.toFixed(3)}',format=yuv420p[out]`,
        "-map", "[out]", "-t", "4", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        "-crf", "18", "-g", "30", mp4]);
    } else {
      // Chroma-scale từng frame: geq trên mặt phẳng Cb/Cr (limited-range,
      // tâm 128) — cùng phép toán với screen2 node (sai khác do range).
      ff(["-i", SLOV_MP4,
        "-vf", `geq=lum='lum(X,Y)':cb='128+(cb(X,Y)-128)*${p.s}':cr='128+(cr(X,Y)-128)*${p.s}',format=yuv420p`,
        "-t", "4", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        "-crf", "18", "-g", "30", mp4]);
    }
    console.log(`  video: ${mp4} (${fs.statSync(mp4).size} byte)`);
    const dec30 = decodeFrame(mp4, 30, path.join(RENDER, `${p.name}-decoded30.raw`));
    const dec45 = decodeFrame(mp4, 45, path.join(RENDER, `${p.name}-decoded45.raw`));
    const motionMad = madBetween(dec30, dec45);
    console.log(`  MOTION check (decode f30 vs f45 của media vừa build): MAD=${motionMad.mad} max=${motionMad.max} (kỳ vọng >> 0, gần ${slovMotionMad.mad} của nguồn)`);
    if (p.kind === "blend-motion") {
      const expect30 = blendRgb(tpPlain, slovF30, p.alpha);
      const blendMad = madBetween(dec30, expect30);
      console.log(`  BLEND check (decode f30 vs node-blend tp-plain+slov-f30): MAD=${blendMad.mad} max=${blendMad.max} (kỳ vọng nhỏ — xác nhận A/B + trọng số)`);
    } else {
      const cs = chromaStd(dec30);
      const csSrc = chromaStd(slovF30);
      console.log(`  CHROMA check (decode f30): stdCb/Cr=${JSON.stringify(cs)} vs nguồn ${JSON.stringify(csSrc)} → hệ số ≈ ${(cs.stdCb / csSrc.stdCb).toFixed(2)}/${(cs.stdCr / csSrc.stdCr).toFixed(2)} (kỳ vọng ≈ ${p.s})`);
    }
    const plainPath = path.join(RENDER, `${p.name}-plain.raw`);
    fs.copyFileSync(path.join(RENDER, `${p.name}-decoded30.raw`), plainPath);
    const yuvPath = path.join(RENDER, `${p.name}.yuv`);
    ff(["-i", mp4, "-vf", "select=eq(n\\,30),scale=1280:720", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvPath]);
    for (const [lv, alls] of [["noise05", 28], ["noise10", 50]]) {
      const outPath = path.join(RENDER, `${p.name}-${lv}.raw`);
      ff(["-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "yuv420p", "-i", yuvPath,
        "-vf", `noise=alls=${alls}:allf=t,scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", outPath]);
      const st = frameStats(fs.readFileSync(outPath));
      console.log(`  ${lv} (alls=${alls}): std=${JSON.stringify(st.std)} kurt=${JSON.stringify(st.kurt)}`);
    }
    console.log(`  plain stats: ${JSON.stringify(frameStats(fs.readFileSync(plainPath)))}`);
  }
  console.log("\nDONE — video motion + frame render đã build (binary, KHÔNG stage; script này tái lập được).");
}
main().catch((e) => { console.error(`J4-MEDIA-BUILD LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
