#!/usr/bin/env node
/**
 * test_v19_pixelate_probe.js — Phase 9 đợt 19, luồng G6: khóa cơ chế
 * pixelate; VIẾT LẠI ở đợt 150 (T0) sang cơ chế geq.
 *
 * LỊCH SỬ — cơ chế scale CŨ (đợt 19–148) ĐÃ NGHỈ HƯU, không còn áp:
 *   filter cũ `scale=iw/K:ih/K:flags=neighbor,scale=iw*K:ih*K:flags=neighbor`
 *   làm 640x360 @ K=13 ra 637x351 (lẻ) → libx264 từ chối, `npm test` FAIL
 *   ở demo_effects (đợt 148 phát hiện, đợt 149 sửa bằng geq — xem
 *   docs/PHASE9_ROUND149_T0_PIXELATE_LIMITS.md §1–§3).
 *   Các khóa cũ đã BỎ: (1) MAD=0 tuyệt đối trên posFrame — chỉ đúng trên
 *   đường rgb24 của scale, không còn ý nghĩa khi pipeline chạy yuv420p;
 *   (2) tách dư downscale/upscale — không còn hai khâu scale để tách;
 *   (3) footprint pixel kề của swscale — đặc thù bộ lọc swscale, geq
 *   không có. Hồ sơ cũ giữ nguyên trong
 *   docs/PHASE9_ROUND19_G6_HARNESS_YUV_LIMITS.md §6 (không sửa).
 *
 * CƠ CHẾ MỚI (đợt 149, effects.js — probe này DÙNG CHUỖI FILTER THẬT từ
 * buildEffectFilter, không hardcode bản sao):
 *   geq=lum='lum(X-mod(X,K)+F,Y-mod(Y,K)+F)'
 *      :cb='cb(trunc(2*X/K)*K/2+F/2,trunc(2*Y/K)*K/2+F/2)'
 *      :cr='cr(trunc(2*X/K)*K/2+F/2,trunc(2*Y/K)*K/2+F/2)'
 *      :a='alpha(X-mod(X,K)+F,Y-mod(Y,K)+F)'   (K = 2+round(t*14), F = floor(K/2))
 *   Biểu thức chroma được viết cho chroma NỬA phân giải (yuv420p — đường
 *   pipeline thật): trên yuv420p, X_chroma = X_luma/2 nên mẫu chroma rơi
 *   đúng (bx*K+F)/2, khớp lưới khối luma. Trên yuv444p (chroma full-res),
 *   cùng biểu thức lấy HAI vị trí/khối → MAD ramp 4,03–7,01 (đo đợt 150,
 *   không phải 0,37–0,43 như LIMITS đợt 149 §5 ghi — số đó là của biến thể
 *   chroma full-res, KHÔNG phải chuỗi filter thật; xem LIMITS đợt 150 §2).
 *   Probe này khóa trên ĐƯỜNG PIPELINE THẬT (yuv420p), yuv444p chỉ dùng
 *   để khóa vị trí lấy mẫu luma (không bị subsample che).
 *
 * KHÓA MỚI (đợt 150) — vi phạm assert -> exit 1:
 *   0. Chuỗi filter thật phải là geq (không còn `scale=iw`), có alpha_expr.
 *   A. Vị trí lấy mẫu đúng floor(K/2): trên posFrame (R=x, G=y), luma
 *      (yMAD) của geq khớp canvas — yuv444p yMAD <= 0,5; yuv420p yMAD
 *      <= 1,6 (sàn roundtrip yuv420p đã ~1,30); trên nội dung nhiễu thật
 *      640x360, geq yMAD − sàn roundtrip <= 0,15.
 *   B. Tier KHỚP theo luma trên ramp mịn: yuv420p yMAD <= 2. RGB MAD trên
 *      ramp đối kháng (3,75–6,13) CHỈ IN, không assert — đó là sàn
 *      subsample chroma + pattern chroma tần số cao, không phải lỗi lấy mẫu.
 *   C. Kích thước ra == kích thước vào với MỌI K (2..16) và MỌI W/H kể cả
 *      lẻ (6 size x 6 K); encode libx264 case 640x360 K=13 (đúng case
 *      demo_effects từng FAIL) phải exit 0, đúng 640x360.
 *   D. Khối hằng: K CHẴN (chroma K/2 nguyên, lưới khớp hoàn toàn) — số đoạn
 *      màu hàng giữa (tol 0) == ceil(W/K), lệch trong khối == 0. K LẺ —
 *      chroma 2x subsample không căn được khối lẻ: pixel lệch > 4 so với
 *      đầu khối CHỈ được phép ở x % K == 0 (mép khối — pixel chia sẻ
 *      chroma với khối kề); runs tol0 <= 2*ceil(W/K). Luma (Y) hằng theo
 *      khối với mọi K (lệch Y trong khối <= 3).
 *   E. Alpha không về 0: yuva444p, tập alpha ra vẫn chứa giá trị khác 0
 *      (đối chứng: cùng filter bỏ alpha_expr -> alpha [0]); alpha hằng
 *      theo từng khối KxK.
 *
 * Canvas dùng module THẬT effectCanvas.ts (transpile qua tsc như V12/V14),
 * không copy code mô hình.
 *
 * Cách chạy (từ server/render/): node src/test_v19_pixelate_probe.js
 * Exit 0 khi mọi assert khóa đều đạt. Thư mục /tmp của script tự xoá
 * khi xong. Hiệu năng geq đo riêng bằng server/render/bench_pixelate_geq.sh
 * (không nằm trong probe này).
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v19-pix-probe-"));
const { buildEffectFilter } = require("./effects.js");

let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "KHÓA-ĐẠT" : "KHÓA-RỚT"} ${name} | ${detail}`);
  if (!ok) failures++;
}

function runFfmpeg(args, label) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${label}: ffmpeg exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
  return r;
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
/** Render pixelate bằng CHUỖI FILTER THẬT từ effects.js, lấy 1 frame. */
function ffPixelateGeq(src, w, h, intensity, pixFmt, tag) {
  const f = buildEffectFilter({ type: "pixelate", intensity });
  const inp = path.join(TMP, `${tag}-in.raw`);
  const out = path.join(TMP, `${tag}-out.raw`);
  fs.writeFileSync(inp, src);
  runFfmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30", "-i", inp,
    "-vf", `format=${pixFmt},${f},format=rgb24`,
    "-f", "rawvideo", "-pix_fmt", "rgb24", out], tag);
  const b = fs.readFileSync(out);
  fs.unlinkSync(inp); fs.unlinkSync(out);
  return b;
}
/** Roundtrip rgb24 -> pixFmt -> rgb24, không geq (sàn đo). */
function ffRoundtrip(src, w, h, pixFmt, tag) {
  const inp = path.join(TMP, `${tag}-in.raw`);
  const out = path.join(TMP, `${tag}-out.raw`);
  fs.writeFileSync(inp, src);
  runFfmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30", "-i", inp,
    "-vf", `format=${pixFmt},format=rgb24`,
    "-f", "rawvideo", "-pix_fmt", "rgb24", out], tag);
  const b = fs.readFileSync(out);
  fs.unlinkSync(inp); fs.unlinkSync(out);
  return b;
}
function diffStats(a, b, w, h) {
  let sum = 0, maxd = 0, diffPix = 0;
  const perCh = [0, 0, 0];
  let ySum = 0;
  for (let p = 0; p < w * h; p++) {
    const yA = 0.299 * a[p * 3] + 0.587 * a[p * 3 + 1] + 0.114 * a[p * 3 + 2];
    const yB = 0.299 * b[p * 3] + 0.587 * b[p * 3 + 1] + 0.114 * b[p * 3 + 2];
    ySum += Math.abs(yA - yB);
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]);
      sum += d; perCh[c] += d; maxd = Math.max(maxd, d);
    }
  }
  diffPix = 0;
  for (let p = 0; p < w * h; p++) {
    if (a[p * 3] !== b[p * 3] || a[p * 3 + 1] !== b[p * 3 + 1] || a[p * 3 + 2] !== b[p * 3 + 2]) diffPix++;
  }
  return {
    mad: sum / (w * h * 3), maxd,
    yMad: ySum / (w * h),
    diffPixFrac: diffPix / (w * h),
    perChMad: perCh.map((v) => v / (w * h)),
  };
}
function countRunsRow(buf, w, h, y, tol) {
  let runs = 1;
  for (let x = 1; x < w; x++) {
    const i0 = (y * w + x - 1) * 3, i1 = (y * w + x) * 3;
    let same = true;
    for (let c = 0; c < 3; c++) if (Math.abs(buf[i1 + c] - buf[i0 + c]) > tol) { same = false; break; }
    if (!same) runs++;
  }
  return runs;
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
  console.log(`== V19 pixelate probe — BẢN GEQ (đợt 150) (FFmpeg ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}) ==`);
  const ec = transpileTs(path.join("apps", "web", "src", "lib", "effectCanvas.ts"), "effectCanvas-js");
  if (typeof ec.applyPixelate !== "function") {
    console.log("effectCanvas: PENDING — thiếu applyPixelate (exit 2)");
    fs.rmSync(TMP, { recursive: true, force: true });
    process.exit(2);
  }
  console.log(`effectCanvas: OK (transpile từ apps/web/src/lib/effectCanvas.ts)`);
  const canvasPix = (src, w, h, intensity) => fromImg(ec.applyPixelate(toImg(src, w, h), intensity), w, h);
  const kOf = (intensity) => 2 + Math.round(intensity * 14);

  // ---- 0. Chuỗi filter thật phải là geq, có alpha_expr, không còn scale ----
  {
    const f0 = buildEffectFilter({ type: "pixelate", intensity: 0 });
    const f1 = buildEffectFilter({ type: "pixelate", intensity: 1 });
    const f08 = buildEffectFilter({ type: "pixelate", intensity: 0.8 });
    check("0 filter pixelate là geq", f0.startsWith("geq="), f0.slice(0, 80));
    check("0 filter có alpha_expr bắt buộc", f0.includes(":a='alpha("), "thiếu alpha_expr -> geq ép alpha về 0");
    check("0 filter KHÔNG còn scale đổi kích thước", !/scale=iw/.test(f0), "scale cũ làm sai kích thước khung hình");
    check("0 K theo intensity (0->2, 0.8->13, 1->16)", f0.includes("mod(X,2)") && f08.includes("mod(X,13)") && f1.includes("mod(X,16)"),
      `K@0=${/mod\(X,(\d+)\)/.exec(f0)?.[1]} K@0.8=${/mod\(X,(\d+)\)/.exec(f08)?.[1]} K@1=${/mod\(X,(\d+)\)/.exec(f1)?.[1]}`);
    check("0 vị trí lấy mẫu floor(K/2) trong lum", f08.includes("lum(X-mod(X,13)+6,Y-mod(Y,13)+6)"),
      "lum phải lấy mẫu đầu khối + 6 (floor(13/2))");
  }

  // ---- A. Vị trí lấy mẫu: posFrame (R=x, G=y) — khóa theo LUMA (yMAD) ----
  for (const [w, h, intensity] of [[72, 48, 0.25], [72, 48, 0.43], [72, 45, 0.5], [78, 39, 0.75]]) {
    const k = kOf(intensity);
    const src = posFrame(w, h);
    const cv = canvasPix(src, w, h, intensity);
    const ff444 = ffPixelateGeq(src, w, h, intensity, "yuv444p", `pos444-${w}x${h}k${k}`);
    const st444 = diffStats(ff444, cv, w, h);
    check(`A vị trí mẫu yuv444p ${w}x${h} k=${k}`, st444.yMad <= 0.5,
      `yMAD=${st444.yMad.toFixed(4)} <= 0,5 (RGB MAD=${st444.mad.toFixed(2)} chỉ in — nhiễu roundtrip YUV, không phải sai vị trí)`);
    const ff420 = ffPixelateGeq(src, w, h, intensity, "yuv420p", `pos420-${w}x${h}k${k}`);
    const st420 = diffStats(ff420, cv, w, h);
    check(`A vị trí mẫu yuv420p ${w}x${h} k=${k}`, st420.yMad <= 1.6,
      `yMAD=${st420.yMad.toFixed(4)} <= 1,6 (sàn roundtrip yuv420p ~1,30)`);
  }
  {
    // Nội dung nhiễu thật: geq không được lệch luma quá sàn roundtrip.
    const W = 640, H = 360, intensity = 0.43;
    const src = noisyEdgeFrame(W, H);
    const cv = canvasPix(src, W, H, intensity);
    const ff = ffPixelateGeq(src, W, H, intensity, "yuv420p", "noisy420");
    const st = diffStats(ff, cv, W, H);
    const rt = ffRoundtrip(src, W, H, "yuv420p", "noisy420-rt");
    const stRt = diffStats(rt, src, W, H);
    console.log(`A nhiễu thật ${W}x${H} k=8 yuv420p: geq yMAD=${st.yMad.toFixed(4)} | sàn roundtrip yMAD=${stRt.yMad.toFixed(4)} (RGB MAD geq=${st.mad.toFixed(2)}, sàn=${stRt.mad.toFixed(2)})`);
    check("A geq không lệch luma quá sàn roundtrip (nhiễu thật)", st.yMad - stRt.yMad <= 0.15,
      `geq yMAD − sàn = ${(st.yMad - stRt.yMad).toFixed(4)} <= 0,15`);
  }

  // ---- B. Ramp mịn: tier KHỚP theo luma (yuv420p) ----
  for (const [w, h, intensity] of [[72, 48, 0.25], [78, 39, 0.75], [72, 45, 0.5]]) {
    const k = kOf(intensity);
    const src = patternFrame(w, h);
    const cv = canvasPix(src, w, h, intensity);
    const ff = ffPixelateGeq(src, w, h, intensity, "yuv420p", `pat-${w}x${h}k${k}`);
    const st = diffStats(ff, cv, w, h);
    console.log(`B ramp ${w}x${h} k=${k} yuv420p: yMAD=${st.yMad.toFixed(4)} RGB MAD=${st.mad.toFixed(4)} maxd=${st.maxd} (RGB MAD chỉ in — sàn subsample + pattern đối kháng)`);
    check(`B tier KHỚP theo luma (ramp ${w}x${h} k=${k})`, st.yMad <= 2,
      `yMAD=${st.yMad.toFixed(4)} <= 2`);
  }

  // ---- C. Kích thước ra == kích thước vào, mọi K, mọi W/H (kể cả lẻ) ----
  {
    let bad = 0;
    for (const [w, h] of [[640, 360], [641, 361], [639, 359], [854, 480], [1920, 1080], [321, 241]]) {
      for (const k of [2, 3, 7, 9, 13, 16]) {
        const intensity = (k - 2) / 14;
        const src = patternFrame(w, h);
        const ff = ffPixelateGeq(src, w, h, intensity, "yuv420p", `size-${w}x${h}k${k}`);
        if (ff.length !== w * h * 3) { bad++; console.log(`  C SAI kích thước: ${w}x${h} k=${k} -> ${ff.length} byte (kỳ vọng ${w * h * 3})`); }
      }
    }
    check("C kích thước ra == vào (6 size x 6 K = 36 case)", bad === 0, `${36 - bad}/36 case đúng kích thước`);
  }
  {
    // Đúng case demo_effects từng FAIL: 640x360 K=13 encode libx264 thật.
    const f = buildEffectFilter({ type: "pixelate", intensity: 0.8 });
    const mp4 = path.join(TMP, "c-640x360k13.mp4");
    runFfmpeg(["-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=1",
      "-vf", `format=yuv420p,${f}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", mp4], "encode-k13");
    const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height,codec_name", "-of", "csv=p=0", mp4], { encoding: "utf8" });
    const dims = (probe.stdout || "").trim();
    const sz = fs.statSync(mp4).size;
    check("C encode libx264 640x360 K=13 (case demo từng FAIL)", probe.status === 0 && dims === "h264,640,360",
      `ffprobe: ${dims} (thứ tự csv: codec,width,height), file ${sz} byte`);
  }

  // ---- D. Khối hằng trên đường yuv420p (posFrame, hàng giữa) ----
  for (const [w, h, k] of [[72, 48, 8], [640, 360, 16], [640, 360, 13], [640, 360, 9]]) {
    const intensity = (k - 2) / 14;
    const src = posFrame(w, h);
    const ff = ffPixelateGeq(src, w, h, intensity, "yuv420p", `blk-${w}x${h}k${k}`);
    const y = Math.floor(h / 2);
    const runs0 = countRunsRow(ff, w, h, y, 0);
    const expect = Math.ceil(w / k);
    // Luma hằng theo khối với MỌI K (Y chỉ phụ thuộc luma full-res).
    const Y = (px) => 0.299 * px[0] + 0.587 * px[1] + 0.114 * px[2];
    let maxYD = 0;
    for (let bx = 0; bx < Math.ceil(w / k); bx++) {
      const x0 = bx * k, x1 = Math.min(w, x0 + k);
      const y0 = Y([ff[(y * w + x0) * 3], ff[(y * w + x0) * 3 + 1], ff[(y * w + x0) * 3 + 2]]);
      for (let x = x0 + 1; x < x1; x++) {
        maxYD = Math.max(maxYD, Math.abs(Y([ff[(y * w + x) * 3], ff[(y * w + x) * 3 + 1], ff[(y * w + x) * 3 + 2]]) - y0));
      }
    }
    if (k % 2 === 0) {
      check(`D khối hằng K chẵn ${w}x${h} k=${k}`, runs0 === expect,
        `runs tol0=${runs0} == ceil(${w}/${k})=${expect}`);
      let maxInBlock = 0;
      for (let bx = 0; bx < Math.ceil(w / k); bx++) {
        const x0 = bx * k, x1 = Math.min(w, x0 + k);
        for (let x = x0 + 1; x < x1; x++) {
          for (let c = 0; c < 3; c++) maxInBlock = Math.max(maxInBlock, Math.abs(ff[(y * w + x) * 3 + c] - ff[(y * w + x0) * 3 + c]));
        }
      }
      check(`D lệch trong khối = 0 (K chẵn ${w}x${h} k=${k})`, maxInBlock === 0, `max lệch=${maxInBlock}`);
    } else {
      // K lẻ: chroma subsample không căn được khối lẻ — pixel lệch chỉ ở mép khối.
      // So mỗi pixel với MẪU của khối nó (pixel tại bx*K+F): pixel đầu khối
      // (x%K==0) có thể mang chroma khối trước (pixel chroma chia sẻ qua
      // biên subsample); pixel giữa khối không được lệch.
      const sampleOf = (bx) => {
        const sx = Math.min(w - 1, bx * k + Math.floor(k / 2));
        return [ff[(y * w + sx) * 3], ff[(y * w + sx) * 3 + 1], ff[(y * w + sx) * 3 + 2]];
      };
      let fringeOk2 = true, fringeCount2 = 0;
      for (let x = 0; x < w; x++) {
        const bx = Math.floor(x / k);
        const s = sampleOf(bx);
        let dev = 0;
        for (let c = 0; c < 3; c++) dev = Math.max(dev, Math.abs(ff[(y * w + x) * 3 + c] - s[c]));
        if (dev > 4) {
          fringeCount2++;
          if (x % k !== 0) fringeOk2 = false;
        }
      }
      console.log(`D K lẻ ${w}x${h} k=${k}: runs tol0=${runs0} (ceil=${expect}, giới hạn ${2 * expect}) | pixel lệch>4 so mẫu khối: ${fringeCount2}, toàn bộ ở x%K==0: ${fringeOk2}`);
      check(`D K lẻ ${w}x${h} k=${k}: runs không vỡ khối`, runs0 <= 2 * expect,
        `runs tol0=${runs0} <= ${2 * expect}`);
      check(`D K lẻ ${w}x${h} k=${k}: pixel lệch chỉ ở mép khối`, fringeOk2,
        `${fringeCount2} pixel lệch>4, toàn bộ tại x%K==0 (chroma chia sẻ qua biên subsample)`);
    }
    check(`D luma hằng theo khối ${w}x${h} k=${k}`, maxYD <= 3,
      `max |dY| trong khối = ${maxYD.toFixed(2)} <= 3`);
  }

  // ---- E. Alpha không về 0 (yuva444p), alpha pixel hoá theo khối ----
  {
    const W = 64, H = 48, K = 9;
    const rgba = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      rgba[i] = (x * 4) % 256; rgba[i + 1] = (y * 5) % 256; rgba[i + 2] = 128;
      rgba[i + 3] = (x < W / 2 ? 0 : (y < H / 2 ? 128 : 200));
    }
    const f = buildEffectFilter({ type: "pixelate", intensity: 0.5 });
    const inp = path.join(TMP, "alpha-in.raw"), out = path.join(TMP, "alpha-out.raw");
    fs.writeFileSync(inp, rgba);
    runFfmpeg(["-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", "30", "-i", inp,
      "-vf", `format=yuva444p,${f},format=rgba`, "-f", "rawvideo", "-pix_fmt", "rgba", out], "alpha");
    const b = fs.readFileSync(out);
    const alphas = new Set();
    for (let p = 0; p < W * H; p++) alphas.add(b[p * 4 + 3]);
    const sorted = [...alphas].sort((a, b2) => a - b2);
    let blockConst = true;
    for (let y = 0; y < H && blockConst; y++) {
      for (let bx = 0; bx < Math.ceil(W / K); bx++) {
        const x0 = bx * K, x1 = Math.min(W, x0 + K);
        const a0 = b[(y * W + x0) * 4 + 3];
        for (let x = x0 + 1; x < x1; x++) if (b[(y * W + x) * 4 + 3] !== a0) { blockConst = false; break; }
        if (!blockConst) break;
      }
    }
    check("E alpha không bị ép về 0", alphas.size > 1 && sorted.some((v) => v > 0),
      `alpha unique ra: [${sorted.join(",")}] (vào: 0,128,200)`);
    check("E alpha hằng theo từng khối KxK", blockConst, `K=${K}, ${W}x${H}`);
    // Đối chứng: cùng filter nhưng BỎ alpha_expr -> alpha về 0 (lý do alpha_expr bắt buộc).
    const fNoA = f.replace(/:a='[^']*'/, "");
    runFfmpeg(["-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", "30", "-i", inp,
      "-vf", `format=yuva444p,${fNoA},format=rgba`, "-f", "rawvideo", "-pix_fmt", "rgba", out], "alpha-noa");
    const b2 = fs.readFileSync(out);
    const alphas2 = new Set();
    for (let p = 0; p < W * H; p++) alphas2.add(b2[p * 4 + 3]);
    console.log(`E đối chứng (bỏ alpha_expr): alpha unique ra: [${[...alphas2].sort((a, b2) => a - b2).join(",")}] — phải là [0] thì mới chứng minh alpha_expr có tác dụng`);
    check("E đối chứng: không alpha_expr thì alpha về 0", alphas2.size === 1 && alphas2.has(0),
      `alpha unique: [${[...alphas2].join(",")}]`);
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
