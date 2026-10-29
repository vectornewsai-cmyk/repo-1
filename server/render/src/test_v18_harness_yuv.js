#!/usr/bin/env node
/**
 * test_v18_harness_yuv.js — Phase 9 đợt 18, luồng harness-YUV: sửa
 * PHƯƠNG PHÁP ĐO của harness cho nguồn mp4 yuv, KHÔNG sửa code sản
 * phẩm render/preview, KHÔNG đổi ngưỡng, KHÔNG đổi logic sản phẩm
 * để vừa số đo.
 *
 * Bối cảnh (đợt 17 N5 + N6):
 * - N5 chứng minh clip1/clip2 XẤP XỈ (dissolve 1,2424 / circleopen
 *   1,5943) là do miền màu đo: xfade chạy trong YUV gốc của mp4,
 *   preview blend RGB. Ép rgb24 TRƯỚC xfade thì về KHỚP
 *   (0,0057 / 0,3820). Không sửa code sản phẩm.
 * - N6 đo ô yuv420p end-to-end trên nguồn X tĩnh vẫn LỆCH
 *   (dissolve 18,58 / 43,95% <= 8) và giữ badge ở mức mô hình xfade
 *   rgb24. Nợ mở đợt 17: sửa phương pháp đo cho nguồn mp4 yuv rồi
 *   đo lại clip1/clip2 + yuv420p e2e.
 *
 * Script này làm đúng việc đó, trên đúng cặp file repo
 * server/render/examples/media/clip1.mp4 / clip2.mp4 (test pattern
 * tổng hợp — smptebars/testsrc2 + drawtext — KHÔNG phải footage máy
 * quay thật), khung 1280x720, xfade duration=1 offset=1, frame giữa
 * n=45 @30fps, p=0,5, cho cả dissolve và circleopen:
 *
 * - Chế độ đo (a) RGB24-ÉP-TRƯỚC: ép format=rgb24 cho cả 2 đầu vào
 *   TRƯỚC xfade, rồi so với preview RGB như cũ (S1). Đây là chế độ
 *   N5 đã chứng minh.
 * - Chế độ đo (b) MIỀN-YUV: chuyển CẢ 2 phía về yuv420p rồi tính
 *   MAD trên mẫu Y+U+V (S5 dùng harnessShared.rgbToYuv420 cho
 *   preview; S5b dùng FFmpeg chuyển pipe-render sang yuv420p làm
 *   đối chứng chéo, để tách dư chuyển đổi JS-vs-FFmpeg khỏi tổn
 *   thất encode).
 *
 * Thang đối chứng tách từng bước (cùng 1 case, cùng preview):
 *   S0  cũ H6: xfade YUV gốc (không ép), pipe rgb24, so RGB.
 *   S1  (a): rgb24 ép trước, pipe rgb24, so RGB.
 *   S2  subsample-only: S1 -> format yuv420p -> rgb24 (KHÔNG encode),
 *       so RGB. Tách riêng tổn thất subsample 4:2:0.
 *   S3  crf0: S1 -> encode libx264 crf0 yuv420p -> decode rgb24, so RGB.
 *       Tách riêng lượng tử hoá (crf0 ~ không lượng tử).
 *   S4  crf18 e2e: S1 -> encode libx264 crf18 yuv420p -> decode rgb24,
 *       so RGB. Đây là ô "LỆCH ~50" của các đợt trước.
 *   S5  (b): decode mp4 crf18 ra yuv420p raw, so với preview qua
 *       harnessShared.rgbToYuv420, MAD miền YUV.
 *   S5b đối chứng: decode mp4 crf18 ra yuv420p raw, so với pipe
 *       render chuyển sang yuv420p bằng FFmpeg (không qua hàm JS).
 *   S6  quét lân cận: frame e2e crf18 n=43,44,46,47 so RGB với
 *       preview — kiểm tra n=45 có phải cực tiểu không (loại trừ
 *       lệch frame trong ô e2e).
 *   C0  không-transition: frame clip1@1.5 qua encode crf18 yuv420p
 *       rồi decode rgb + yuv, so với frame gốc — đo tổn thất
 *       encode/subsample trên nội dung THƯỜNG (không frand-switch).
 *   V0  kiểm chứng hàm JS: harnessShared.rgbToYuv420(frame clip1)
 *       so với FFmpeg chuyển cùng frame sang yuv420p.
 *
 * Thang V6 (KHỚP = MAD <= 2 và >= 99% <= 8; XẤP XỈ = MAD <= 20 và
 * >= 90% <= 8; còn lại LỆCH) được định nghĩa cho MAD RGB. Số MAD
 * miền YUV (S5/S5b/V0/C0-yuv) in kèm phân loại V6 CHỈ để tham
 * chiếu — không phải chuẩn badge mới, không dùng để tự nâng badge.
 *
 * Cách chạy (từ server/render/): node src/test_v18_harness_yuv.js
 * Exit 0 khi đo xong (kể cả LỆCH — đó là kết quả đo, không phải lỗi).
 * KHÔNG sửa code sản phẩm, KHÔNG ghi binary vào repo. Thư mục /tmp
 * của script được xoá khi chạy xong thành công (bài học H6/N5:
 * /tmp VM chỉ 512MB); file raw/mp4 tạm được xoá ngay sau khi đọc.
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v18-yuv-"));
const W = 1280;
const H = 720;
const FPS = 30;

const shared = require("./harnessShared");

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

// ---- Preview tổng quát từ visual + frame A/B thật (đúng H6/N6) ----
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
function fmtRGB(m) { return `MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`; }
function fmtYUV(m) {
  const cls = m.mad <= 2 && m.le8 >= 0.99 ? "KHỚP" : m.mad <= 20 && m.le8 >= 0.90 ? "XẤP XỈ" : "LỆCH";
  return `MAD-YUV=${m.mad.toFixed(4)} (Y=${m.madY.toFixed(4)} U=${m.madU.toFixed(4)} V=${m.madV.toFixed(4)}) <=8: ${(m.le8 * 100).toFixed(2)}% | V6-tham-chiếu=${cls}`;
}

// ---- Helpers FFmpeg: đọc xong xoá ngay file tạm ----
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
function xfadePipe(type, fileA, fileB, preRgb, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  const pre = preRgb ? "[0:v]format=rgb24[a];[1:v]format=rgb24[b];" : "";
  const a = preRgb ? "[a]" : "[0:v]";
  const b = preRgb ? "[b]" : "[1:v]";
  ffmpeg(["-i", fileA, "-i", fileB,
    "-filter_complex", `${pre}${a}${b}xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,45)'[v]`,
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
function yuvToRgbFfmpeg(yuv, tag) {
  const yuvIn = path.join(TMP, `${tag}-in.yuv`);
  const out = path.join(TMP, `${tag}.raw`);
  fs.writeFileSync(yuvIn, yuv);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${W}x${H}`, "-i", yuvIn, "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  fs.unlinkSync(yuvIn);
  return readAndUnlink(out);
}
function encodeMp4(type, fileA, fileB, crf, tag) {
  const mp4 = path.join(TMP, `${tag}.mp4`);
  ffmpeg(["-i", fileA, "-i", fileB,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=yuv420p[v]`,
    "-map", "[v]", "-r", String(FPS), "-t", "2", "-c:v", "libx264", "-crf", String(crf), "-pix_fmt", "yuv420p", "-y", mp4]);
  return mp4;
}
function decodeMp4(mp4, n, pixFmt, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-i", mp4, "-vf", `select='eq(n\\,${n})'`, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", pixFmt, "-y", out]);
  return readAndUnlink(out);
}
function rawToPng(rgb, tag) {
  const rawIn = path.join(TMP, `${tag}-in.raw`);
  const png = path.join(TMP, `${tag}.png`);
  fs.writeFileSync(rawIn, rgb);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", rawIn, "-frames:v", "1", "-y", png]);
  fs.unlinkSync(rawIn);
  return png;
}

function main() {
  console.log(`== V18 harness-YUV (clip1/clip2 mp4, 1280x720, frame 45 @30fps, p=0.5) ==`);
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

  // V0: hàm JS so với FFmpeg trên cùng 1 frame.
  {
    const jsYuv = shared.rgbToYuv420(frameA, W, H);
    const ffYuv = rgbToYuvFfmpeg(frameA, "v0");
    const m = shared.yuv420Mad(jsYuv, ffYuv, W, H);
    console.log(`V0 JS-vs-FFmpeg rgb->yuv420p (frame clip1@1.5) | ${fmtYUV(m)}`);
  }

  for (const type of ["dissolve", "circleopen"]) {
    const visual = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(visual, frameA, frameB);
    const previewYuvJs = shared.rgbToYuv420(preview, W, H);

    const s0 = xfadePipe(type, fileA, fileB, false, `s0-${type}`);
    console.log(`clip1/clip2 | ${type} | S0 cũ-H6 (xfade YUV gốc, so RGB) | ${fmtRGB(compareRGB(s0, preview))}`);
    const s1 = xfadePipe(type, fileA, fileB, true, `s1-${type}`);
    console.log(`clip1/clip2 | ${type} | S1 (a) rgb24-ép-trước, pipe, so RGB | ${fmtRGB(compareRGB(s1, preview))}`);
    const pipeYuvFf = rgbToYuvFfmpeg(s1, `s1yuv-${type}`);
    const s2 = yuvToRgbFfmpeg(pipeYuvFf, `s2-${type}`);
    console.log(`clip1/clip2 | ${type} | S2 subsample-only (S1->yuv420p->rgb, KHÔNG encode) | ${fmtRGB(compareRGB(s2, preview))}`);
    // S5b cần pipeYuvFf; giữ lại tới sau S5 rồi mới hết tham chiếu (buffer
    // trong RAM, không phải file tạm — không tốn /tmp).

    const mp4c0 = encodeMp4(type, fileA, fileB, 0, `s3-${type}`);
    const s3 = decodeMp4(mp4c0, 45, "rgb24", `s3-${type}`);
    console.log(`clip1/clip2 | ${type} | S3 crf0 (lượng tử ~0), decode RGB | ${fmtRGB(compareRGB(s3, preview))}`);
    fs.unlinkSync(mp4c0);

    const mp4 = encodeMp4(type, fileA, fileB, 18, `s4-${type}`);
    const s4 = decodeMp4(mp4, 45, "rgb24", `s4-${type}`);
    console.log(`clip1/clip2 | ${type} | S4 crf18 e2e, decode RGB | ${fmtRGB(compareRGB(s4, preview))}`);
    const s5buf = decodeMp4(mp4, 45, "yuv420p", `s5-${type}`);
    console.log(`clip1/clip2 | ${type} | S5 (b) crf18 e2e, so MIỀN YUV (preview qua JS) | ${fmtYUV(shared.yuv420Mad(s5buf, previewYuvJs, W, H))}`);
    console.log(`clip1/clip2 | ${type} | S5b crf18 e2e, so MIỀN YUV (render qua FFmpeg) | ${fmtYUV(shared.yuv420Mad(s5buf, pipeYuvFf, W, H))}`);
    for (const n of [43, 44, 46, 47]) {
      const fn = decodeMp4(mp4, n, "rgb24", `s6-${type}-${n}`);
      console.log(`clip1/clip2 | ${type} | S6 e2e crf18 frame n=${n} vs preview RGB | ${fmtRGB(compareRGB(fn, preview))}`);
    }
    fs.unlinkSync(mp4);
  }

  // C0: không transition — frame clip1@1.5 qua encode crf18.
  {
    const png = rawToPng(frameA, "c0");
    const mp4 = path.join(TMP, "c0.mp4");
    ffmpeg(["-loop", "1", "-t", "1", "-i", png, "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS), "-y", mp4]);
    fs.unlinkSync(png);
    const decRgb = decodeMp4(mp4, 15, "rgb24", "c0-rgb");
    const decYuv = decodeMp4(mp4, 15, "yuv420p", "c0-yuv");
    const rtRgb = yuvToRgbFfmpeg(rgbToYuvFfmpeg(frameA, "c0-rt"), "c0-rt2");
    console.log(`C0 không-transition (clip1@1.5) | format-only yuv420p->rgb vs gốc | ${fmtRGB(compareRGB(rtRgb, frameA))}`);
    console.log(`C0 không-transition (clip1@1.5) | crf18 e2e decode RGB vs gốc | ${fmtRGB(compareRGB(decRgb, frameA))}`);
    console.log(`C0 không-transition (clip1@1.5) | crf18 e2e decode YUV vs gốc qua JS | ${fmtYUV(shared.yuv420Mad(decYuv, shared.rgbToYuv420(frameA, W, H), W, H))}`);
    fs.unlinkSync(mp4);
  }

  console.log(`tmp: ${TMP} (sẽ xoá sau khi in xong)`);
  console.log(`DONE v18-harness-yuv`);
  fs.rmSync(TMP, { recursive: true, force: true });
}

main();
