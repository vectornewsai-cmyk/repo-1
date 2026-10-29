#!/usr/bin/env node
/**
 * test_v19_pixelate_probe.js — Phase 9 đợt 19, luồng G6: khóa lại cơ
 * chế của dư pixelate 0,1293 (v17) và 0,6667 (V12/V14), đã truy nguyên
 * tới cùng (xem docs/PHASE9_ROUND19_G6_HARNESS_YUV_LIMITS.md §6).
 *
 * Kết luận đã chứng minh (FFmpeg 8.1.2, filter render đúng effects.js:
 * scale=iw/K:ih/K:flags=neighbor,scale=iw*K:ih*K:flags=neighbor):
 * 1. Vị trí lấy mẫu của FFmpeg KHỚP canvas (offset floor(K/2)): xung
 *    đơn điểm và ramp tuyến tính cho MAD = 0 (mục A).
 * 2. Toàn bộ dư nằm ở khâu DOWNSCALE (downscale-only MAD = full-chain
 *    MAD); khâu upscale là chính xác (mục D).
 * 3. Dư là do bộ lọc của swscale trộn chroma từ vùng lân cận trong
 *    khi giữ luma: trên ramp mịn cho ±1 hệ thống (MAD 0,6667, mục B);
 *    trên nội dung nhiễu + cạnh sắc chỉ 4,4% khối lệch, đuôi tới 119
 *    đúng tại khối mà mẫu nằm sát cạnh sắc (mục D), nhưng |dY| vẫn
 *    nhỏ (luma giữ) — tức vị trí mẫu đúng, chỉ chroma bị trộn.
 * 4. KHÔNG PHẢI lỗi mô hình canvas và KHÔNG sửa được bằng cách chỉnh
 *    mô hình: muốn khớp bit-exact phải tái tạo đúng bộ lọc nội bộ
 *    của swscale (phụ thuộc phiên bản, không có giá trị sản phẩm —
 *    pipeline render thật chạy trên frame yuv420p, không phải raw
 *    RGB tổng hợp như harness). Badge KHỚP vẫn đứng (MAD <= 2).
 *
 * Script này KHÓA các dấu hiệu trên thành assert (không khóa số đo
 * tuyệt đối theo phiên bản FFmpeg): vi phạm assert -> exit 1 (báo
 * hiệu hành vi swscale đã đổi, cần điều tra lại, không phải tự nâng
 * ngưỡng). Mục C (footprint pixel kề) chỉ IN để đối chiếu, không
 * assert — footprint có thể đổi theo phiên bản swscale mà tier vẫn
 * đứng.
 *
 * Canvas dùng module THẬT effectCanvas.ts (transpile qua tsc như
 * V12/V14), không copy code mô hình. Khung nhiễu + cạnh sắc ở mục D
 * tự sinh xác định (mulberry + đường chéo cứng + checker), không
 * dùng file v17 (tmp của v17 không bền).
 *
 * Cách chạy (từ server/render/): node src/test_v19_pixelate_probe.js
 * Exit 0 khi mọi assert khóa đều đạt. Thư mục /tmp của script tự xoá
 * khi xong.
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v19-pix-probe-"));

let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "KHÓA-ĐẠT" : "KHÓA-RỚT"} ${name} | ${detail}`);
  if (!ok) failures++;
}

function runFfmpeg(args, label) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${label}: ffmpeg exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
}
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
function toImg(src, w, h) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = src[i * 3]; data[i * 4 + 1] = src[i * 3 + 1]; data[i * 4 + 2] = src[i * 3 + 2]; data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}
function fromImg(im, w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    buf[i * 3] = im.data[i * 4]; buf[i * 3 + 1] = im.data[i * 4 + 1]; buf[i * 3 + 2] = im.data[i * 4 + 2];
  }
  return buf;
}
/** Render pixelate FFmpeg thật (đúng filter effects.js), lấy 1 frame. */
function ffPixelate(src, w, h, k, tag) {
  const inp = path.join(TMP, `${tag}-in.raw`);
  const out = path.join(TMP, `${tag}-out.raw`);
  fs.writeFileSync(inp, src);
  runFfmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30", "-i", inp,
    "-vf", `scale=iw/${k}:ih/${k}:flags=neighbor,scale=iw*${k}:ih*${k}:flags=neighbor,format=rgb24`,
    "-f", "rawvideo", "-pix_fmt", "rgb24", out], tag);
  const b = fs.readFileSync(out);
  fs.unlinkSync(inp); fs.unlinkSync(out);
  return b;
}
/** Downscale-only (không upscale) — tách dư thuộc khâu nào. */
function ffDownscale(src, w, h, k, tag) {
  const inp = path.join(TMP, `${tag}-in.raw`);
  const out = path.join(TMP, `${tag}-out.raw`);
  fs.writeFileSync(inp, src);
  runFfmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30", "-i", inp,
    "-vf", `scale=iw/${k}:ih/${k}:flags=neighbor,format=rgb24`,
    "-f", "rawvideo", "-pix_fmt", "rgb24", out], tag);
  const b = fs.readFileSync(out);
  fs.unlinkSync(inp); fs.unlinkSync(out);
  return b;
}
function diffStats(a, b, w, h) {
  let sum = 0, maxd = 0, diffPix = 0, diffSamples = 0;
  const perCh = [0, 0, 0];
  for (let p = 0; p < w * h; p++) {
    let pd = false;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]);
      sum += d; perCh[c] += d; maxd = Math.max(maxd, d);
      if (d > 0) { pd = true; diffSamples++; }
    }
    if (pd) diffPix++;
  }
  return {
    mad: sum / (w * h * 3), maxd,
    diffPixFrac: diffPix / (w * h), diffSamplesFrac: diffSamples / (w * h * 3),
    perChMad: perCh.map((v) => v / (w * h)),
  };
}
function patternFrame(w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    buf[i] = (x * 4) % 256; buf[i + 1] = (y * 5) % 256; buf[i + 2] = (x + y * 3) % 256;
  }
  return buf;
}
function posFrame(w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    buf[i] = x % 256; buf[i + 1] = y % 256; buf[i + 2] = 128;
  }
  return buf;
}
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Khung nhiễu + cạnh sắc tự sinh (gradient + hạt ±25 + checker + đường chéo cứng). */
function noisyEdgeFrame(w, h) {
  const buf = Buffer.alloc(w * h * 3);
  const rnd = mulberry(12345);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = y / (h - 1);
      let r = 60 + 180 * t, g = 100 + 90 * t, b = 200 - 120 * t;
      const gr = (rnd() - 0.5) * 50;
      r += gr; g += gr; b += gr;
      if (x >= w * 0.55 && x < w * 0.85 && y >= h * 0.45 && y < h * 0.85 && ((Math.floor(x / 40) + Math.floor(y / 40)) % 2 === 0)) { r += 70; g += 70; b -= 40; }
      if (Math.abs((y - 0.25 * h) - (x - 0.1 * w) * 0.35) < 2) { r = 255; g = 220; b = 0; }
      const i = (y * w + x) * 3;
      buf[i] = Math.max(0, Math.min(255, Math.round(r)));
      buf[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      buf[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }
  }
  return buf;
}

function main() {
  console.log(`== V19 pixelate probe (FFmpeg ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}) ==`);
  const ec = transpileTs(path.join("apps", "web", "src", "lib", "effectCanvas.ts"), "effectCanvas-js");
  if (typeof ec.applyPixelate !== "function") {
    console.log("effectCanvas: PENDING — thiếu applyPixelate (exit 2)");
    fs.rmSync(TMP, { recursive: true, force: true });
    process.exit(2);
  }
  console.log(`effectCanvas: OK (transpile từ apps/web/src/lib/effectCanvas.ts)`);
  const canvasPix = (src, w, h, intensity) => fromImg(ec.applyPixelate(toImg(src, w, h), intensity), w, h);
  const kOf = (intensity) => 2 + Math.round(intensity * 14);

  // ---- A. Vị trí lấy mẫu: pattern vị trí (R=x, G=y) phải khớp tuyệt đối ----
  for (const [w, h, intensity] of [[72, 48, 0.25], [72, 48, 0.43], [72, 45, 0.5], [78, 39, 0.75]]) {
    const k = kOf(intensity);
    const src = posFrame(w, h);
    const ff = ffPixelate(src, w, h, k, `pos-${w}x${h}k${k}`);
    const cv = canvasPix(src, w, h, intensity);
    const st = diffStats(ff, cv, w, h);
    check(`A offset mẫu ${w}x${h} k=${k}`, st.mad === 0 && st.maxd === 0,
      `MAD=${st.mad.toFixed(4)} maxdiff=${st.maxd} (kỳ vọng 0 — FFmpeg lấy đúng offset floor(k/2) của canvas)`);
  }

  // ---- B. Ramp mịn: dư ±1 hệ thống, vẫn KHỚP tier ----
  for (const [w, h, intensity] of [[72, 48, 0.25], [78, 39, 0.75], [72, 45, 0.5]]) {
    const k = kOf(intensity);
    const src = patternFrame(w, h);
    const ff = ffPixelate(src, w, h, k, `pat-${w}x${h}k${k}`);
    const cv = canvasPix(src, w, h, intensity);
    const st = diffStats(ff, cv, w, h);
    check(`B ramp mịn ${w}x${h} k=${k}`, st.maxd <= 1 && st.mad <= 2,
      `MAD=${st.mad.toFixed(4)} maxdiff=${st.maxd} perCh=${st.perChMad.map((v) => v.toFixed(3)).join("/")} diffPix=${(st.diffPixFrac * 100).toFixed(1)}% (dư ±1, tier KHỚP)`);
  }

  // ---- C. Footprint pixel kề (CHỈ IN, không assert): nền solid + 1 pixel trắng ----
  {
    const W = 72, H = 48, K = 6;
    const solid = Buffer.alloc(W * H * 3);
    for (let p = 0; p < W * H; p++) { solid[p * 3] = 12; solid[p * 3 + 1] = 15; solid[p * 3 + 2] = 12; }
    const base = ffDownscale(solid, W, H, K, "fp-base");
    const at00 = [base[0], base[1], base[2]];
    console.log(`C footprint (downscale, nền solid (12,15,12), dst(0,0) gốc = [${at00}]) — chỉ in đối chiếu:`);
    for (const [x, y] of [[2, 3], [4, 3], [3, 2], [3, 4], [2, 2], [4, 4]]) {
      const s = Buffer.from(solid);
      const i = (y * W + x) * 3;
      s[i] = 255; s[i + 1] = 255; s[i + 2] = 255;
      const o = ffDownscale(s, W, H, K, `fp-${x}_${y}`);
      console.log(`  trắng tại (${x},${y}) -> dst(0,0) = [${o[0]},${o[1]},${o[2]}]${o[0] === at00[0] && o[1] === at00[1] && o[2] === at00[2] ? " (không đổi)" : " (ĐỔI)"}`);
    }
  }

  // ---- D. Nội dung nhiễu + cạnh sắc: dư thưa, tập trung ở khối cạnh, luma giữ ----
  {
    const W = 640, H = 360, K = 8, intensity = 0.43;
    const src = noisyEdgeFrame(W, H);
    const ff = ffPixelate(src, W, H, K, "noisy");
    const cv = canvasPix(src, W, H, intensity);
    const st = diffStats(ff, cv, W, H);
    // Downscale-only so với mẫu canvas, từng khối — tách khâu + đo luma.
    const down = ffDownscale(src, W, H, K, "noisy-down");
    const DW = W / K, DH = H / K;
    const Y = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
    let dsum = 0, dmax = 0, diffBlocks = 0, maxYd = 0, sumYd = 0, meanDownErrSum = 0;
    for (let by = 0; by < DH; by++) for (let bx = 0; bx < DW; bx++) {
      const si = ((by * K + 4) * W + (bx * K + 4)) * 3;
      const di = (by * DW + bx) * 3;
      let err = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(down[di + c] - src[si + c]);
        err = Math.max(err, d);
        meanDownErrSum += d;
      }
      dsum += err; dmax = Math.max(dmax, err);
      if (err > 0) {
        diffBlocks++;
        const ys = Y(src[si], src[si + 1], src[si + 2]);
        const yf = Y(down[di], down[di + 1], down[di + 2]);
        const yd = Math.abs(yf - ys);
        sumYd += yd; maxYd = Math.max(maxYd, yd);
      }
    }
    // Full-chain: mỗi khối ra là bản nhân bản của đúng 1 mẫu downscale,
    // nên MAD full-chain PHẢI bằng đúng trung bình lỗi mẫu downscale
    // (meanDownErr) — bằng nhau tới epsilon thì upscale là chính xác
    // tuyệt đối, toàn bộ dư thuộc khâu downscale.
    const meanDownErr = meanDownErrSum / (DW * DH * 3);
    console.log(`D nhiễu+cạnh ${W}x${H} k=${K} | full-chain MAD=${st.mad.toFixed(4)} maxdiff=${st.maxd} diffPix=${(st.diffPixFrac * 100).toFixed(2)}% | downscale-only maxErr-khối=${dmax} khối-lệch=${diffBlocks}/${DW * DH} (${(diffBlocks / (DW * DH) * 100).toFixed(1)}%) meanDownErr=${meanDownErr.toFixed(4)} | luma: mean|dY|=${diffBlocks ? (sumYd / diffBlocks).toFixed(3) : "0"} max|dY|=${maxYd.toFixed(3)}`);
    check(`D tier KHỚP trên nội dung nhiễu+cạnh`, st.mad <= 2,
      `MAD=${st.mad.toFixed(4)} <= 2`);
    check(`D upscale chính xác tuyệt đối (MAD full-chain = meanDownErr)`, Math.abs(meanDownErr - st.mad) < 1e-9,
      `meanDownErr=${meanDownErr.toFixed(6)} vs full-chain MAD=${st.mad.toFixed(6)} (chênh ${(Math.abs(meanDownErr - st.mad)).toExponential(1)} — dư 100% thuộc khâu downscale)`);
    check(`D luma giữ (vị trí mẫu đúng, chỉ chroma trộn)`, maxYd <= 8,
      `max|dY|=${maxYd.toFixed(3)} <= 8 trong khi maxdiff RGB=${st.maxd} (lệch vị trí mẫu sẽ kéo luma theo cạnh sắc, không giữ được)`);
  }

  console.log(`tmp: ${TMP} (sẽ xoá sau khi in xong)`);
  fs.rmSync(TMP, { recursive: true, force: true });
  if (failures > 0) {
    console.log(`KẾT: ${failures} assert KHÓA-RỚT (exit 1)`);
    process.exit(1);
  }
  console.log(`KẾT: mọi assert khóa đều đạt (exit 0)`);
}

main();
