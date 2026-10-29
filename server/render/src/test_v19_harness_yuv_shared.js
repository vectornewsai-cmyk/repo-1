#!/usr/bin/env node
/**
 * test_v19_harness_yuv_shared.js — Phase 9 đợt 19, luồng G6: mode đo
 * miền YUV qua FFmpeg nay nằm ở module DÙNG CHUNG (harnessShared.js),
 * không còn là helper cục bộ của v18.
 *
 * Việc script này chứng minh (trên đúng cặp file repo
 * server/render/examples/media/clip1.mp4 / clip2.mp4, khung 1280x720,
 * xfade duration=1 offset=1, frame giữa n=45 @30fps, p=0,5):
 * - V0: helper dùng chung xác định (cùng input 2 lần -> byte giống
 *   hệt), khớp hàm JS trên nội dung mịn ở mức v18 V0 (~0,06), và xử
 *   lý được khung lẻ 72x45 (pad về 72x46, tự so MAD = 0).
 * - S5b-shared: tái tạo đúng số S5b của v18 (e2e crf18 decode yuv vs
 *   pipe-render chuyển sang yuv) NHƯNG pipe-render nay chuyển bằng
 *   harnessShared.ffmpegRgbToYuv420, không còn helper cục bộ nào.
 *   Kỳ vọng v18: dissolve XẤP XỈ 2,8985 / circleopen KHỚP 0,4291.
 * - P5b-shared (MỚI, v18 chưa có): preview JS -> yuv bằng helper
 *   dùng chung, so với e2e decode yuv — tức "preview vs e2e trong
 *   miền YUV, phía preview qua FFmpeg" thay vì qua hàm JS như S5
 *   của v18 (S5 dissolve đọc LỆCH 4,3437 do bộ lọc chroma khác
 *   swscale). Kỳ vọng: cùng tier với S5b (dissolve XẤP XỈ,
 *   circleopen KHỚP), vì preview và pipe-render chỉ lệch nhau ở mức
 *   S1 (0,0057 / 0,3820 RGB).
 * - S2-shared: subsample-only qua CẶP helper dùng chung
 *   (ffmpegRgbToYuv420 rồi ffmpegYuvToRgb420), so RGB với preview.
 *   Kỳ vọng v18 S2: dissolve LỆCH 57,7793 / circleopen KHỚP 1,4866.
 *
 * Thang V6 gốc định nghĩa cho MAD RGB; số MAD miền YUV in kèm phân
 * loại V6 CHỈ để tham chiếu (xem harnessShared.classifyYuvRef) —
 * không phải chuẩn badge mới, không dùng để tự nâng badge.
 *
 * Cách chạy (từ server/render/): node src/test_v19_harness_yuv_shared.js
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
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v19-yuv-shared-"));
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

// ---- Preview tổng quát từ visual + frame A/B thật (đúng H6/N6/v18) ----
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
function classifyRGB(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le8 >= 0.90) return "XẤP XỈ";
  return "LỆCH";
}
function fmtRGB(m) { return `MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classifyRGB(m)}`; }

// ---- Helpers FFmpeg cục bộ của script (CHỈ phần decode/encode mp4 và
// pipe xfade — phần CHUYỂN ĐỔI rgb<->yuv đã dời hết về harnessShared,
// script này không còn hàm chuyển đổi cục bộ nào, đúng mục đích đợt 19) ----
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
function xfadePipeRgb24(type, fileA, fileB, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-i", fileA, "-i", fileB,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
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

function main() {
  console.log(`== V19 harness-YUV dùng chung (clip1/clip2 mp4, 1280x720, frame 45 @30fps, p=0.5) ==`);
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

  // V0a: helper xác định — cùng input 2 lần phải cho byte giống hệt.
  // V0b: helper vs hàm JS trên nội dung mịn (kỳ vọng ~v18 V0 0,0597).
  // V0c: khung lẻ 72x45 qua helper (pad về 72x46, tự so MAD = 0).
  {
    const synth = Buffer.alloc(72 * 45 * 3);
    for (let i = 0; i < synth.length; i++) synth[i] = (i * 7) % 256;
    const h1 = shared.ffmpegRgbToYuv420(synth, 72, 45, TMP, "v0a-1");
    const h2 = shared.ffmpegRgbToYuv420(synth, 72, 45, TMP, "v0a-2");
    console.log(`V0a helper xác định (72x45, 2 lần) | giống hệt: ${h1.yuv.equals(h2.yuv)} | dims pad: ${h1.w}x${h1.h} | len: ${h1.yuv.length} (kỳ vọng ${72 * 46 * 1.5})`);
    const self = shared.yuv420Mad(h1.yuv, h2.yuv, h1.w, h1.h);
    console.log(`V0a tự so | ${shared.formatYuvMad(self)}`);
    const jsYuv = shared.rgbToYuv420(frameA, W, H);
    const ffYuv = shared.ffmpegRgbToYuv420(frameA, W, H, TMP, "v0b");
    console.log(`V0b helper-vs-JS rgb->yuv420p (frame clip1@1.5) | ${shared.formatYuvMad(shared.yuv420Mad(jsYuv, ffYuv.yuv, W, H))} (v18 V0: 0,0597)`);
    const oddSelf = shared.ffmpegYuvCompare(synth, synth, 72, 45, TMP, "v0c");
    console.log(`V0c khung lẻ tự so qua ffmpegYuvCompare | ${shared.formatYuvMad(oddSelf)}`);
  }

  const v18 = {
    dissolve: { s1: 0.0057, s5b: 2.8985, s2: 57.7793 },
    circleopen: { s1: 0.3820, s5b: 0.4291, s2: 1.4866 },
  };
  for (const type of ["dissolve", "circleopen"]) {
    const visual = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(visual, frameA, frameB);
    const s1 = xfadePipeRgb24(type, fileA, fileB, `s1-${type}`);
    console.log(`clip1/clip2 | ${type} | S1 (a) rgb24-ép-trước, pipe, so RGB | ${fmtRGB(compareRGB(s1, preview))} (v18: ${v18[type].s1})`);

    // S5b-shared: pipe-render -> yuv BẰNG HELPER DÙNG CHUNG (v18 dùng
    // helper cục bộ rgbToYuvFfmpeg — nay đã xoá khỏi script, chỉ còn
    // bản dùng chung này).
    const pipeYuv = shared.ffmpegRgbToYuv420(s1, W, H, TMP, `s5b-${type}`);
    const mp4 = encodeMp4(type, fileA, fileB, 18, `s4-${type}`);
    const e2eYuv = decodeMp4(mp4, 45, "yuv420p", `s5-${type}`);
    const mS5b = shared.yuv420Mad(e2eYuv, pipeYuv.yuv, W, H);
    console.log(`clip1/clip2 | ${type} | S5b-shared crf18 e2e, so MIỀN YUV (pipe qua helper chung) | ${shared.formatYuvMad(mS5b)} (v18 S5b: ${v18[type].s5b})`);

    // P5b-shared (MỚI): preview -> yuv bằng helper dùng chung, so với
    // e2e decode yuv — đóng lại khoảng trống S5-vs-S5b của v18.
    const previewYuv = shared.ffmpegRgbToYuv420(preview, W, H, TMP, `p5b-${type}`);
    const mP5b = shared.yuv420Mad(e2eYuv, previewYuv.yuv, W, H);
    console.log(`clip1/clip2 | ${type} | P5b-shared crf18 e2e, so MIỀN YUV (preview qua helper chung) | ${shared.formatYuvMad(mP5b)} (MỚI — kỳ vọng cùng tier với S5b)`);

    // S2-shared: subsample-only qua CẶP helper dùng chung.
    const rtRgb = shared.ffmpegYuvToRgb420(pipeYuv.yuv, W, H, TMP, `s2-${type}`);
    console.log(`clip1/clip2 | ${type} | S2-shared subsample-only (pipe->yuv->rgb, KHÔNG encode) | ${fmtRGB(compareRGB(rtRgb, preview))} (v18 S2: ${v18[type].s2})`);
    fs.unlinkSync(mp4);
  }

  console.log(`tmp: ${TMP} (sẽ xoá sau khi in xong)`);
  console.log(`DONE v19-harness-yuv-shared`);
  fs.rmSync(TMP, { recursive: true, force: true });
}

main();
