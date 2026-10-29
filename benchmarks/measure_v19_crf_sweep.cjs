#!/usr/bin/env node
/**
 * measure_v19_crf_sweep.js — Phase 9 đợt 19, luồng G4: quét crf cho
 * dissolve e2e + đo miền YUV ở crf0.
 *
 * Bối cảnh (đợt 18, docs/PHASE9_ROUND18_HARNESS_YUV_LIMITS.md):
 * - Dissolve e2e ở crf18 vẫn chỉ XẤP XỈ ngay cả ở miền YUV sạch nhất
 *   (S5b: MAD-YUV 2,8985, cả 2 phía qua FFmpeg); circleopen KHỚP 0,4291.
 * - Số YUV-domain ở crf0 chưa đo (chỉ đo RGB ở S3: = subsample-only).
 * - Câu hỏi mở: muốn dissolve e2e lên KHỚP thì đổi crf, đổi preset,
 *   hay chấp nhận giới hạn cấu trúc? Script này ĐO trước khi kết luận.
 *
 * Phương pháp (giữ nguyên phương pháp đợt 18, không đổi ngưỡng):
 * - Cùng cặp file repo server/render/examples/media/clip1.mp4 /
 *   clip2.mp4 (test pattern tổng hợp, KHÔNG phải footage thật),
 *   khung 1280x720, xfade duration=1 offset=1, frame giữa n=45 @30fps,
 *   p=0,5, cho dissolve + circleopen.
 * - Preview RGB tính bằng module thật của app (transitionPreview +
 *   dissolveFrand, transpile qua tsc) như script v18.
 * - Encode e2e: [0:v]format=rgb24[a];[1:v]format=rgb24[b];
 *   [a][b]xfade:duration=1:offset=1,format=yuv420p, libx264,
 *   preset ghi rõ từng ô, pix_fmt yuv420p, 2 giây @30fps.
 * - Mỗi ô encode đo 2 miền:
 *     (i)  decode frame 45 ra rgb24, so MAD RGB với preview;
 *     (ii) decode frame 45 ra yuv420p raw, so MAD miền YUV với pipe
 *          render S1 chuyển sang yuv420p bằng FFmpeg (kiểu S5b đợt 18
 *          — KHÔNG dùng hàm JS rgbToYuv420 cho dissolve, vì bộ lọc
 *          chroma của nó khác swscale, xem §4 tài liệu đợt 18).
 * - Thang V6 (KHỚP = MAD <= 2 và >= 99% <= 8; XẤP XỈ = MAD <= 20 và
 *   >= 90% <= 8; còn lại LỆCH) định nghĩa cho MAD RGB; số miền YUV
 *   in kèm phân loại V6 CHỈ để tham chiếu, không phải chuẩn badge mới.
 * - Quét crf: 0, 12, 18, 23 ở preset medium (mặc định libx264, ghi
 *   rõ). Quét preset (chỉ dissolve, crf18): ultrafast, veryfast,
 *   slow — medium lấy lại từ quét crf, không encode lại.
 * - Kiểm chứng tái tạo: ô crf18/medium phải khớp số đợt 18
 *   (RGB 58,2054 / YUV 2,8985) trong sai số làm tròn; nếu lệch thì
 *   in cảnh báo, không lặng lẽ nhận số mới.
 *
 * Cách chạy (từ gốc repo): node benchmarks/measure_v19_crf_sweep.js
 * Exit 0 khi đo xong (kể cả LỆCH — đó là kết quả đo, không phải lỗi).
 * KHÔNG sửa code sản phẩm, KHÔNG ghi binary vào repo. Thư mục /tmp
 * của script được xoá khi chạy xong thành công (mp4 tạm cũng xoá
 * ngay sau khi decode xong từng ô).
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v19-crf-"));
const W = 1280;
const H = 720;
const FPS = 30;

const shared = require(path.join(ROOT, "server", "render", "src", "harnessShared"));

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
  return r;
}
function ffmpeg(args) { return run("ffmpeg", ["-v", "error", ...args]); }

function findTsc() {
  for (const c of [path.join(ROOT, "apps", "web", "node_modules", ".bin", "tsc"), path.join(ROOT, "node_modules", ".bin", "tsc"), "tsc"]) {
    if (spawnSync(c, ["--version"], { encoding: "utf8" }).status === 0) return c;
  }
  return null;
}
function transpileTs(srcRel, outName) {
  const src = path.join(ROOT, srcRel);
  const outDir = path.join(TMP, outName);
  fs.mkdirSync(outDir, { recursive: true });
  spawnSync(findTsc(), [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) throw new Error(`tsc không sinh ra ${jsFile}`);
  return require(jsFile);
}

function previewFrame(visual, frameA, frameB) {
  const buf = Buffer.alloc(W * H * 3);
  const hasRadial =
    (visual.a.region && visual.a.region.kind === "radial-gradient") ||
    (visual.b.region && visual.b.region.kind === "radial-gradient");
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5, py = y + 0.5, i = (y * W + x) * 3;
      let r = 0, g = 0, b = 0;
      if (hasRadial) {
        const ca = shared.layerPixelAlpha(visual.a, x, y, W, H);
        const cb = shared.layerPixelAlpha(visual.b, x, y, W, H);
        r = frameA[i] * ca + frameB[i] * cb;
        g = frameA[i + 1] * ca + frameB[i + 1] * cb;
        b = frameA[i + 2] * ca + frameB[i + 2] * cb;
      } else if (!visual.geometric) {
        const ca = shared.layerCovers(visual.a, px, py, W, H) ? visual.a.alpha : 0;
        const cb = shared.layerCovers(visual.b, px, py, W, H) ? visual.b.alpha : 0;
        r = frameA[i] * ca + frameB[i] * cb;
        g = frameA[i + 1] * ca + frameB[i + 1] * cb;
        b = frameA[i + 2] * ca + frameB[i + 2] * cb;
      } else {
        if (shared.layerCovers(visual.a, px, py, W, H)) {
          r = frameA[i] * visual.a.alpha + r * (1 - visual.a.alpha);
          g = frameA[i + 1] * visual.a.alpha + g * (1 - visual.a.alpha);
          b = frameA[i + 2] * visual.a.alpha + b * (1 - visual.a.alpha);
        }
        if (shared.layerCovers(visual.b, px, py, W, H)) {
          r = frameB[i] * visual.b.alpha + r * (1 - visual.b.alpha);
          g = frameB[i + 1] * visual.b.alpha + g * (1 - visual.b.alpha);
          b = frameB[i + 2] * visual.b.alpha + b * (1 - visual.b.alpha);
        }
      }
      buf[i] = Math.round(r); buf[i + 1] = Math.round(g); buf[i + 2] = Math.round(b);
    }
  }
  return buf;
}
function compareRGB(a, b) {
  let sum = 0, le8 = 0;
  const n = W * H * 3;
  for (let k = 0; k < n; k++) {
    const d = Math.abs(a[k] - b[k]);
    sum += d;
    if (d <= 8) le8++;
  }
  return { mad: sum / n, le8: le8 / n };
}
function classify(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le8 >= 0.90) return "XẤP XỈ";
  return "LỆCH";
}
function fmtRGB(m) { return `MAD-RGB=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`; }
function fmtYUV(m) {
  const cls = m.mad <= 2 && m.le8 >= 0.99 ? "KHỚP" : m.mad <= 20 && m.le8 >= 0.90 ? "XẤP XỈ" : "LỆCH";
  return `MAD-YUV=${m.mad.toFixed(4)} (Y=${m.madY.toFixed(4)} U=${m.madU.toFixed(4)} V=${m.madV.toFixed(4)}) <=8: ${(m.le8 * 100).toFixed(2)}% | V6-tham-chiếu=${cls}`;
}

function readAndUnlink(p) {
  const buf = fs.readFileSync(p);
  fs.unlinkSync(p);
  return buf;
}
function fileFrameAt(file, t, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-ss", String(t), "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  return readAndUnlink(out);
}
function xfadePipe(type, fileA, fileB, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-i", fileA, "-i", fileB,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return readAndUnlink(out);
}
function rgbToYuvFfmpeg(rgb, tag) {
  const rawIn = path.join(TMP, `${tag}-in.raw`);
  const out = path.join(TMP, `${tag}.yuv`);
  fs.writeFileSync(rawIn, rgb);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", rawIn, "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", out]);
  fs.unlinkSync(rawIn);
  return readAndUnlink(out);
}
function encodeMp4(type, fileA, fileB, crf, preset, tag) {
  const mp4 = path.join(TMP, `${tag}.mp4`);
  ffmpeg(["-i", fileA, "-i", fileB,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=yuv420p[v]`,
    "-map", "[v]", "-r", String(FPS), "-t", "2", "-c:v", "libx264", "-crf", String(crf), "-preset", preset, "-pix_fmt", "yuv420p", "-y", mp4]);
  return mp4;
}
function decodeMp4(mp4, n, pixFmt, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-i", mp4, "-vf", `select='eq(n\\,${n})'`, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", pixFmt, "-y", out]);
  return readAndUnlink(out);
}

function measureCell(type, mp4, preview, pipeYuvFf, label, tag) {
  const size = fs.statSync(mp4).size;
  const decRgb = decodeMp4(mp4, 45, "rgb24", `dec-rgb-${tag}`);
  const rgb = compareRGB(decRgb, preview);
  const decYuv = decodeMp4(mp4, 45, "yuv420p", `dec-yuv-${tag}`);
  const yuv = shared.yuv420Mad(decYuv, pipeYuvFf, W, H);
  console.log(`${type} | ${label} | size=${size} bytes | ${fmtRGB(rgb)}`);
  console.log(`${type} | ${label} | size=${size} bytes | ${fmtYUV(yuv)}`);
  return { rgb, yuv, size };
}

function main() {
  console.log(`== V19 G4 crf sweep (clip1/clip2 mp4, 1280x720, frame 45 @30fps, p=0.5, libx264) ==`);
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const df = transpileTs(path.join("apps", "web", "src", "lib", "dissolveFrand.ts"), "df-js");
  if (typeof tp.radialGradientWeight === "function") shared.setRadialWeight(tp.radialGradientWeight);
  if (typeof df.ffmpegDissolveFrand === "function") shared.setDissolveFrand(df.ffmpegDissolveFrand);
  console.log(`module thật: radialGradientWeight=${typeof tp.radialGradientWeight}, ffmpegDissolveFrand=${typeof df.ffmpegDissolveFrand}`);

  const fileA = path.join(ROOT, "server", "render", "examples", "media", "clip1.mp4");
  const fileB = path.join(ROOT, "server", "render", "examples", "media", "clip2.mp4");
  const frameA = fileFrameAt(fileA, 1.5, "clipA-1.5");
  const frameB = fileFrameAt(fileB, 0.5, "clipB-0.5");

  const results = {};
  for (const type of ["dissolve", "circleopen"]) {
    const visual = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(visual, frameA, frameB);
    const s1 = xfadePipe(type, fileA, fileB, `s1-${type}`);
    console.log(`${type} | S1 (a) rgb24-ép-trước, pipe, so RGB | ${fmtRGB(compareRGB(s1, preview))}`);
    const pipeYuvFf = rgbToYuvFfmpeg(s1, `s1yuv-${type}`);

    results[type] = {};
    for (const crf of [0, 12, 18, 23]) {
      const tag = `${type}-crf${crf}-medium`;
      const mp4 = encodeMp4(type, fileA, fileB, crf, "medium", tag);
      const cell = measureCell(type, mp4, preview, pipeYuvFf, `crf${crf}/preset=medium`, tag);
      results[type][`crf${crf}`] = cell;
      fs.unlinkSync(mp4);
    }
    // Kiểm chứng tái tạo số đợt 18 ở ô crf18/medium.
    const r18 = results[type].crf18;
    const expRgb = type === "dissolve" ? 58.2054 : 1.6648;
    const expYuv = type === "dissolve" ? 2.8985 : 0.4291;
    const dRgb = Math.abs(r18.rgb.mad - expRgb);
    const dYuv = Math.abs(r18.yuv.mad - expYuv);
    console.log(`${type} | TÁI-TẠO đợt 18 (crf18/medium): RGB lệch ${dRgb.toFixed(4)}, YUV lệch ${dYuv.toFixed(4)} ${dRgb < 0.01 && dYuv < 0.01 ? "OK" : "CẢNH-BÁO: lệch khỏi số đợt 18"}`);

    // Quét preset chỉ cho dissolve ở crf18 (câu hỏi mở đợt 18).
    if (type === "dissolve") {
      for (const preset of ["ultrafast", "veryfast", "slow"]) {
        const tag = `${type}-crf18-${preset}`;
        const mp4 = encodeMp4(type, fileA, fileB, 18, preset, tag);
        const cell = measureCell(type, mp4, preview, pipeYuvFf, `crf18/preset=${preset}`, tag);
        results[type][`preset-${preset}`] = cell;
        fs.unlinkSync(mp4);
      }
    }
  }

  console.log(`tmp: ${TMP} (sẽ xoá sau khi in xong)`);
  console.log(`DONE v19-crf-sweep`);
  fs.rmSync(TMP, { recursive: true, force: true });
}

main();
