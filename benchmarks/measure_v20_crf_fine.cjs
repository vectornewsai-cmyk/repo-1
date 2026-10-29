#!/usr/bin/env node
/**
 * measure_v20_crf_fine.js — Phase 9 đợt 20, luồng R6: quét mịn crf cho
 * dissolve e2e + preset ở crf12 + YUV-domain ở crf0.
 *
 * Đóng nợ đợt 19:
 * - G4 §6: ngưỡng KHỚP miền YUV của dissolve nằm trong khoảng (12, 18)
 *   — chưa đo crf13–17. Script này quét 13,14,15,16,17.
 * - G4 §6: chưa đo preset khác ở crf12 (chỉ quét preset ở crf18).
 *   Script này quét ultrafast/veryfast/slow ở crf12 (medium lấy từ
 *   quét crf, không encode lại).
 * - G6 §7: số YUV-domain ở crf0 (nợ từ đợt 18) — G4 đã đo crf0 YUV
 *   0,0000 trong quét thô; script này đo lại crf0 như một ô của
 *   quét mịn để khóa số bằng phép đo độc lập cùng phương pháp.
 *
 * Phương pháp GIỮ NGUYÊN đợt 19 (không đổi ngưỡng, không đổi logic
 * sản phẩm để vừa số): cặp file repo server/render/examples/media/
 * clip1.mp4 / clip2.mp4 (test pattern tổng hợp, KHÔNG phải footage
 * thật), khung 1280x720, xfade duration=1 offset=1, frame giữa n=45
 * @30fps, p=0,5, dissolve (+ circleopen chỉ ở ô tái tạo, không quét
 * mịn — ngoài phạm vi nợ). Preview RGB tính bằng module thật của app
 * (transitionPreview + dissolveFrand, transpile qua tsc) như v19.
 * Encode e2e: [0:v]format=rgb24[a];[1:v]format=rgb24[b];
 * [a][b]xfade:duration=1:offset=1,format=yuv420p, libx264,
 * preset ghi rõ từng ô, pix_fmt yuv420p, 2 giây @30fps. Mỗi ô đo 2
 * miền: (i) decode frame 45 ra rgb24, so MAD RGB với preview;
 * (ii) decode frame 45 ra yuv420p raw, so MAD miền YUV với pipe
 * render S1 chuyển sang yuv420p bằng FFmpeg (kiểu S5b đợt 18 —
 * KHÔNG dùng hàm JS rgbToYuv420 cho dissolve).
 * Thang V6 (KHỚP = MAD <= 2 và >= 99% <= 8; XẤP XỈ = MAD <= 20 và
 * >= 90% <= 8; còn lại LỆCH) định nghĩa cho MAD RGB; số miền YUV
 * in kèm phân loại V6 CHỈ để tham chiếu, không phải chuẩn badge mới.
 *
 * Tái tạo kiểm chứng: các ô crf0/crf12/crf18 ở preset medium phải
 * khớp số đợt 19 (dissolve: crf0 RGB 57,7793 / YUV 0,0000; crf12 RGB
 * 57,8721 / YUV 1,4079; crf18 RGB 58,2054 / YUV 2,8985) trong sai số
 * làm tròn 0,01; nếu lệch thì in cảnh báo, không lặng lẽ nhận số mới.
 * Ô circleopen crf18/medium tái tạo số đợt 19 (RGB 1,6648 /
 * YUV 0,4291) như v19.
 *
 * Cách chạy (từ gốc repo): node benchmarks/measure_v20_crf_fine.js
 * Exit 0 khi đo xong (kể cả LỆCH — đó là kết quả đo, không phải lỗi).
 * KHÔNG sửa code sản phẩm, KHÔNG ghi binary vào repo. Thư mục /tmp
 * của script được xoá khi chạy xong thành công.
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v20-crf-fine-"));
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
  console.log(`== V20 R6 crf fine sweep (clip1/clip2 mp4, 1280x720, frame 45 @30fps, p=0.5, libx264) ==`);
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
    // Dissolve: quét mịn 13–17 + các ô tái tạo 0/12/18. Circleopen:
    // chỉ ô tái tạo 18 (đối chứng, không quét mịn — ngoài phạm vi nợ).
    const crfList = type === "dissolve" ? [0, 12, 13, 14, 15, 16, 17, 18] : [18];
    for (const crf of crfList) {
      const tag = `${type}-crf${crf}-medium`;
      const mp4 = encodeMp4(type, fileA, fileB, crf, "medium", tag);
      const cell = measureCell(type, mp4, preview, pipeYuvFf, `crf${crf}/preset=medium`, tag);
      results[type][`crf${crf}`] = cell;
      fs.unlinkSync(mp4);
    }
    // Kiểm chứng tái tạo số đợt 19 ở các ô medium đã đo trước.
    const checkRepro = (crf, expRgb, expYuv) => {
      const r = results[type][`crf${crf}`];
      const dRgb = Math.abs(r.rgb.mad - expRgb);
      const dYuv = Math.abs(r.yuv.mad - expYuv);
      console.log(`${type} | TÁI-TẠO đợt 19 (crf${crf}/medium): RGB lệch ${dRgb.toFixed(4)}, YUV lệch ${dYuv.toFixed(4)} ${dRgb < 0.01 && dYuv < 0.01 ? "OK" : "CẢNH-BÁO: lệch khỏi số đợt 19"}`);
    };
    if (type === "dissolve") {
      checkRepro(0, 57.7793, 0.0000);
      checkRepro(12, 57.8721, 1.4079);
      checkRepro(18, 58.2054, 2.8985);
    } else {
      checkRepro(18, 1.6648, 0.4291);
    }

    // Quét preset ở crf12 cho dissolve (nợ G4 §6; medium lấy từ quét
    // crf, không encode lại).
    if (type === "dissolve") {
      for (const preset of ["ultrafast", "veryfast", "slow"]) {
        const tag = `${type}-crf12-${preset}`;
        const mp4 = encodeMp4(type, fileA, fileB, 12, preset, tag);
        const cell = measureCell(type, mp4, preview, pipeYuvFf, `crf12/preset=${preset}`, tag);
        results[type][`preset12-${preset}`] = cell;
        fs.unlinkSync(mp4);
      }
    }
  }

  console.log(`tmp: ${TMP} (sẽ xoá sau khi in xong)`);
  console.log(`DONE v20-crf-fine`);
  fs.rmSync(TMP, { recursive: true, force: true });
}

main();
