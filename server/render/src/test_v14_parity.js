#!/usr/bin/env node
/**
 * test_v14_parity.js — Phase 9 đợt 14, luồng R6: harness tổng hợp vòng 5.
 *
 * Mục đích: sau khi các luồng khác của đợt 14 sửa xong, chạy MỘT lệnh để
 * có bảng KHỚP / XẤP XỈ / LỆCH / PENDING cho bộ case transition + effect.
 * Harness này KHÔNG phụ thuộc vào code chưa chắc đã có của luồng khác:
 * mọi phần đều thử load module thật trên đĩa, load không được (hoặc hình
 * học chưa có) thì case đó là PENDING với lý do rõ ràng — PENDING không
 * phải PASS, không phải FAIL, và không làm exit != 0.
 *
 * Phần E (effect canvas) là phần chính của R6, đo trực tiếp:
 *   - pixelate / mirror / rgb-shift / shake / sharpen: phân loại V6.
 *   - edgedetect: phân loại V6 (kỳ vọng XẤP XỈ sau R6, xem LIMITS R6).
 *   - noise: thống kê (std preview / std render), KHÔNG phân loại
 *     từng frame — nhiễu thời gian của render không khớp từng frame
 *     được với seed xác định của preview theo thiết kế.
 *   - glitch: (a) MAD từng frame vs render (thông tin, kỳ vọng XẤP XỈ
 *     hoặc LỆCH vì 2 nhiễu độc lập), (b) kiểm tra cấu trúc (đợt 16 H5):
 *     preview glitch phải bằng rgb-shift nguồn (nhân biên) cộng nhiễu
 *     Gauss: trung bình |lệch| 7–13 và std 9–14 với ns=20 (tiêu chí cũ
 *     max ≤ ns chỉ đúng với nhiễu đều, đã bỏ).
 *   - badge: ĐỌC từ previewStatus.ts lúc chạy (không hardcode); nếu
 *     badge khác tier đo được thì chỉ ghi chú, không tự sửa badge
 *     (việc của luồng badge / R6 khi đủ số đo).
 * Phần T (transition composite) tái dùng đúng quy ước V11/V12:
 *   - khung 72×45, A đỏ thuần / B xanh dương thuần, xfade duration 1,
 *     offset 1, frame giữa transition = index 45 (p = 0.5).
 *   - raster composite từ describeTransition (hình học, không claim
 *     preview canvas vẽ đúng frame này — xem header V11).
 *   - type có describeTransition geometric=false mà không phải họ fade
 *     → PENDING (fallback, hình học chưa có). Đợt 15 T1: rasterizer
 *     V14 đã hỗ trợ kind radial-gradient (circle, smoothstep đợt 14
 *     R4) và region dissolve-noise (mask frand float32 đợt 14 R2,
 *     mirror V11/V12) nên 3 PENDING cũ (circleopen/circleclose/
 *     dissolve) nay được đo thật — không còn nhánh PENDING đặc biệt
 *     cho dissolve.
 *
 * Phân loại V6 (giữ đúng thang V6/V11/V12 để so sánh được):
 *   KHỚP  = MAD <= 2 và >= 99% pixel lệch <= 8 (lệch max theo kênh).
 *   XẤP XỈ = MAD <= 20 và >= 90% pixel lệch <= 32.
 *   LỆCH  = ngoài 2 mức trên. LỆCH là kết quả đo, không phải lỗi harness.
 *   PENDING = module/hình học chưa có — không tính PASS/FAIL.
 *   STAT-APPROX / STRUCT-OK = phân loại riêng cho noise/glitch (xem trên).
 *
 * Cách chạy (từ server/render/):
 *   node src/test_v14_parity.js [--only effect|transition] [--list]
 *   --list: chỉ in danh sách case, không render.
 * Exit: 0 khi mọi case render xong (kể cả LỆCH/PENDING); 1 khi có case
 * render lỗi; 2 khi harness lỗi (thiếu ffmpeg, module bắt buộc load lỗi
 * ở bước không thể PENDING được — riêng phần T thì PENDING được).
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Đợt 16 H6: logic raster transition dùng chung (radial smoothstep +
// tâm cắt nguyên, dissolve frand float32) đã tách sang harnessShared.js.
// pointInPolygon/regionCovers/radialWeight/layerPixelAlpha/layerCovers/
// barsFadeIsBar/rasterizeTransitionPreview nay import từ đó (đợt 17
// N1 dời nốt 2 bản sao cuối về module chung, ngữ nghĩa không đổi).
const { regionCovers, layerPixelAlpha, layerCovers, setRadialWeight, setDissolveFrand, setBarsFadeIsBar, rasterizeTransitionPreview, ffmpegYuvCompare, formatYuvMad } = require("./harnessShared");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v14-parity-"));

const W = 72;
const H = 45;
const FPS = 30;

const argv = process.argv.slice(2);
const ONLY = (() => {
  const i = argv.indexOf("--only");
  return i >= 0 && argv[i + 1] ? argv[i + 1] : "all";
})();
const LIST_ONLY = argv.includes("--list");

// Đợt 19 G6: cờ đo miền YUV qua FFmpeg (mặc định TẮT — chạy mặc định
// cho log giống hệt baseline). Bật bằng `node src/test_v14_parity.js
// --yuv`: mỗi case transition (phần T) in thêm 1 dòng [YUV-FFmpeg]
// (cả 2 phía qua cùng bộ chuyển FFmpeg, xem harnessShared
// .ffmpegYuvCompare; khung 72x45 được pad về 72x46). Dòng YUV không
// tính vào counts/KẾT, chỉ để đối chiếu kết luận RGB vs YUV trên
// cùng case. Đợt 20 R6 nối thêm phần E (effect, trừ 2 case thống kê
// noise/glitch — 2 phía nhiễu độc lập nên số YUV vô nghĩa).
const YUV_MODE = argv.includes("--yuv");

function runFfmpeg(args, label) {
  const t0 = Date.now();
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg ${label} exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
  return Date.now() - t0;
}
function checkFfmpeg() {
  const r = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("không có ffmpeg trong PATH");
  return r.stdout.split("\n")[0];
}

// ---------------------------------------------------------------------------
// Load module TS của web qua tsc → TMP (kỹ thuật V6/V11/V12, rút gọn)
// ---------------------------------------------------------------------------
function findTsc() {
  const candidates = [
    path.join(ROOT, "apps", "web", "node_modules", ".bin", "tsc"),
    path.join(ROOT, "node_modules", ".bin", "tsc"),
    "tsc",
  ];
  for (const c of candidates) {
    const r = spawnSync(c, ["--version"], { encoding: "utf8" });
    if (r.status === 0) return c;
  }
  return null;
}
function transpileTs(srcRel, outName) {
  const tsc = findTsc();
  if (!tsc) return { ok: false, reason: "không tìm thấy tsc" };
  const src = path.join(ROOT, srcRel);
  if (!fs.existsSync(src)) return { ok: false, reason: `thiếu file ${srcRel}` };
  const outDir = path.join(TMP, outName);
  fs.mkdirSync(outDir, { recursive: true });
  const r = spawnSync(tsc, [src, "--outDir", outDir, "--module", "commonjs",
    "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck",
    "--esModuleInterop"], { encoding: "utf8" });
  const jsFile = path.join(outDir, path.basename(srcRel).replace(/\.ts$/, ".js"));
  if (!fs.existsSync(jsFile)) {
    return { ok: false, reason: `tsc không sinh ra JS: ${(r.stderr || "").slice(0, 300)}` };
  }
  try {
    return { ok: true, mod: require(jsFile) };
  } catch (e) {
    return { ok: false, reason: `require module đã transpile lỗi: ${e.message}` };
  }
}

// ---------------------------------------------------------------------------
// Nguồn tổng hợp + đo
// ---------------------------------------------------------------------------
function patternFrame(w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3; buf[i] = (x * 4) % 256; buf[i + 1] = (y * 5) % 256; buf[i + 2] = (x + y * 3) % 256;
  }
  return buf;
}
function stepFrame(w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3; const v = x < Math.floor(w / 2) ? 0 : 255; buf[i] = v; buf[i + 1] = v; buf[i + 2] = v;
  }
  return buf;
}
function naturalFrame(w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    let r = 60 + x * 2, g = 40 + y * 3, bl = 120 + Math.round(40 * Math.sin(x / 9));
    if (x > 15 && x < 45 && y > 10 && y < 30) { r = 220; g = 60; bl = 60; }
    const dx = x - 55, dy = y - 30;
    if (dx * dx + dy * dy < 100) { r = 40; g = 200; bl = 90; }
    if (x - y > 20 && x - y < 23) { r = 255; g = 255; bl = 255; }
    buf[i] = Math.max(0, Math.min(255, r)); buf[i + 1] = Math.max(0, Math.min(255, g)); buf[i + 2] = Math.max(0, Math.min(255, bl));
  }
  return buf;
}
function solidFrame(r, g, b, w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { buf[i * 3] = r; buf[i * 3 + 1] = g; buf[i * 3 + 2] = b; }
  return buf;
}
function toImg(src, w, h) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { data[i * 4] = src[i * 3]; data[i * 4 + 1] = src[i * 3 + 1]; data[i * 4 + 2] = src[i * 3 + 2]; data[i * 4 + 3] = 255; }
  return { width: w, height: h, data };
}
function fromImg(im, w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { buf[i * 3] = im.data[i * 4]; buf[i * 3 + 1] = im.data[i * 4 + 1]; buf[i * 3 + 2] = im.data[i * 4 + 2]; }
  return buf;
}
/** So sánh theo thang V6: MAD theo giá trị, le8/le32 theo pixel (max kênh). */
function compareFrames(a, b, w, h) {
  if (a.length !== b.length) return { mismatch: true, mad: NaN, le8: 0, le32: 0 };
  let sum = 0, le8 = 0, le32 = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  for (let p = 0; p < w * h; p++) {
    const d = Math.max(Math.abs(a[p * 3] - b[p * 3]), Math.abs(a[p * 3 + 1] - b[p * 3 + 1]), Math.abs(a[p * 3 + 2] - b[p * 3 + 2]));
    if (d <= 8) le8++;
    if (d <= 32) le32++;
  }
  return { mad: sum / a.length, le8: le8 / (w * h), le32: le32 / (w * h) };
}
function classify(m) {
  if (m.mismatch) return "LỆCH (kích thước frame khác nhau)";
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le32 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}
function fmtM(m) {
  return `MAD=${m.mad.toFixed(3)} ≤8=${(m.le8 * 100).toFixed(1)}% ≤32=${(m.le32 * 100).toFixed(1)}%`;
}
function renderEffectFrame(filter, src, w, h, frames, frameIndex, tag) {
  const inp = path.join(TMP, `eff-in-${tag}.raw`);
  const out = path.join(TMP, `eff-out-${tag}.raw`);
  const chunks = [];
  for (let i = 0; i < frames; i++) chunks.push(src);
  fs.writeFileSync(inp, Buffer.concat(chunks));
  runFfmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", String(FPS), "-i", inp,
    "-vf", `${filter},format=rgb24`, "-f", "rawvideo", "-pix_fmt", "rgb24", out], `effect ${tag}`);
  const all = fs.readFileSync(out);
  const sz = w * h * 3;
  return Buffer.from(all.subarray(frameIndex * sz, (frameIndex + 1) * sz));
}
function channelStd(buf, w, h, base) {
  const out = [];
  for (let c = 0; c < 3; c++) {
    let mean = 0, m2 = 0;
    const n = w * h;
    for (let p = 0; p < n; p++) { const d = buf[p * 3 + c] - base; mean += d; m2 += d * d; }
    mean /= n;
    out.push(Math.sqrt(Math.max(0, m2 / n - mean * mean)));
  }
  return out;
}

/** Badge hiện tại của 1 effect, ĐỌC từ previewStatus.ts (không hardcode). */
function effectBadgeStatus(type) {
  const f = path.join(ROOT, "apps", "web", "src", "components", "transitions", "previewStatus.ts");
  if (!fs.existsSync(f)) return "không đọc được previewStatus.ts";
  const src = fs.readFileSync(f, "utf8");
  const inSet = (setName) => {
    const i = src.indexOf(setName);
    if (i < 0) return false;
    const seg = src.slice(i, src.indexOf("]);", i));
    return seg.includes(`"${type}"`);
  };
  if (inSet("EFFECT_MATCHED")) return "matched";
  if (inSet("EFFECT_CANVAS_MATCHED")) return "matched (canvas)";
  if (inSet("EFFECT_APPROX")) return "approx";
  if (inSet("EFFECT_CANVAS_APPROX")) return "approx (canvas)";
  return "none";
}

// ---------------------------------------------------------------------------
// Phần T: raster composite transition (quy ước V11/V12)
// ---------------------------------------------------------------------------

const SUPPORTED_REGION_KINDS = new Set(["rect", "rects", "circle", "circle-inverted", "polygon", "polygon-inverted",
  // Đợt 15 T1: 2 kind trước đây PENDING nay đã hỗ trợ (xem harnessShared.js).
  "radial-gradient", "dissolve-noise",
  // Đợt 16 H1: bars-fade nay đã hỗ trợ (nhánh composite riêng dưới đây,
  // không qua regionCovers) — không còn PENDING cho kind này.
  "bars-fade"]);
// Đợt 16 H6: hàm frand + trọng số smoothstep nay ở harnessShared.js
// (vẫn gán từ 2 module transpile dưới đây, như trước).

// Đợt 17 N1: barsFadeIsBar + rasterizeTransitionPreview nay ở harnessShared.js (bản duy nhất).
function regionKinds(region, acc) {
  if (region === null || region === undefined) return;
  acc.add(region.kind);
  if (region.kind === "rects") return;
}

// Đợt 17 N1: barsFadeIsBar + rasterizeTransitionPreview nay ở harnessShared.js (bản duy nhất).
function renderTransitionFrame(type) {
  const { buildXfadeFilter } = require("./transitions");
  const writeRaw = (name, frame, count) => {
    const p = path.join(TMP, name);
    const chunks = [];
    for (let i = 0; i < count; i++) chunks.push(frame);
    fs.writeFileSync(p, Buffer.concat(chunks));
    return p;
  };
  const a = writeRaw("trA.raw", solidFrame(255, 0, 0, W, H), 60);
  const b = writeRaw("trB.raw", solidFrame(0, 0, 255, W, H), 60);
  const out = path.join(TMP, `tr-${type}.raw`);
  const filter = buildXfadeFilter(type, 1, 1);
  runFfmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(FPS), "-i", a,
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(FPS), "-i", b,
    "-filter_complex", `[0:v][1:v]${filter},format=rgb24[v]`, "-map", "[v]",
    "-f", "rawvideo", "-pix_fmt", "rgb24", out], `transition ${type}`);
  const buf = fs.readFileSync(out);
  const sz = W * H * 3;
  if (buf.length < 46 * sz) throw new Error(`render ${type} chỉ có ${Math.floor(buf.length / sz)} frame, cần >= 46`);
  return Buffer.from(buf.subarray(45 * sz, 46 * sz));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function cleanupTmp() {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* bỏ qua */ }
}

function main() {
  const ffLine = checkFfmpeg();
  let renderErrors = 0;
  const rows = [];
  const counts = { KHỚP: 0, "XẤP XỈ": 0, LỆCH: 0, PENDING: 0, "STAT-APPROX": 0, "STRUCT-OK": 0, "STAT-LỆCH": 0 };

  console.log("== V14 parity harness (đợt 14, luồng R6) — transition + effect tổng hợp ==");
  console.log(`ffmpeg: ${ffLine}`);
  console.log(`effect/transition: ${W}x${H} @${FPS}fps, A đỏ / B xanh, transition frame giữa p=0.5 (index 45)`);
  console.log(`máy đo: ${os.hostname()} ${os.platform()}/${os.arch()} ${os.cpus().length} CPU (số chỉ đúng máy này)`);
  console.log(`tmp: ${TMP}`);
  console.log("");

  // ---- E. Effect ----
  if (ONLY === "all" || ONLY === "effect") {
    console.log("--- E. EFFECT CANVAS (preview effectCanvas.ts vs render effects.js) ---");
    if (YUV_MODE) console.log("  [YUV-FFmpeg] mode đo miền YUV BẬT: mỗi case effect xác định in thêm dòng YUV (không tính vào counts/KẾT)");
    const ec = transpileTs(path.join("apps", "web", "src", "lib", "effectCanvas.ts"), "effectCanvas-js");
    const { buildEffectFilter } = require("./effects");
    if (!ec.ok) {
      console.log(`effectCanvas: PENDING toàn phần E — ${ec.reason}`);
      counts.PENDING++;
    } else {
      const mod = ec.mod;
      const need = ["applyPixelate", "applyMirror", "applyRgbShift", "applyShake", "applySharpen", "applyEdgeDetect", "applyNoise", "applyGlitch", "shakeOffsetAt"];
      const missing = need.filter((fn) => typeof mod[fn] !== "function");
      if (missing.length) {
        console.log(`effectCanvas: PENDING toàn phần E — thiếu hàm ${missing.join(", ")}`);
        counts.PENDING++;
      } else {
        const run = (name, fn) => {
          try {
            const r = fn();
            rows.push(r);
            if (counts[r.tier] !== undefined) counts[r.tier]++;
            console.log(r.line);
            // Đợt 20 R6: dòng YUV phụ (chỉ khi --yuv), không tính counts.
            if (r.yuvLine) console.log(r.yuvLine);
          } catch (e) {
            renderErrors++;
            console.log(`${name} | RENDER LỖI: ${e.message}`);
          }
        };
        // Đợt 20 R6: helper YUV cho phần E — trả null khi không --yuv
        // nên log mặc định giống hệt baseline; case noise/glitch không
        // gọi helper này (thống kê, không so pixel).
        const yuvLineFor = (name, prev, ff, tag) => {
          if (!YUV_MODE) return null;
          try {
            const ym = ffmpegYuvCompare(prev, ff, W, H, TMP, tag);
            return `  [YUV-FFmpeg] ${name} | ${formatYuvMad(ym)}`;
          } catch (e) {
            return `  [YUV-FFmpeg] ${name} | LỖI: ${e.message}`;
          }
        };
        const pixCase = (intensity, k) => () => {
          const src = patternFrame(W, H);
          const ff = renderEffectFrame(`scale=iw/${k}:ih/${k}:flags=neighbor,scale=iw*${k}:ih*${k}:flags=neighbor`, src, W, H, 1, 0, `pix${k}`);
          const prev = fromImg(mod.applyPixelate(toImg(src, W, H), intensity), W, H);
          const m = compareFrames(ff, prev, W, H);
          const tier = classify(m);
          return { tier, line: `pixelate k=${k} | ${fmtM(m)} | ${tier} | badge ${effectBadgeStatus("pixelate")}`, yuvLine: yuvLineFor(`pixelate k=${k}`, prev, ff, `yuv-v14-pix${k}`) };
        };
        run("pixelate k=9", pixCase(0.5, 9));
        run("mirror", () => {
          const src = (() => { const b = Buffer.alloc(W * H * 3); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; if (x < W / 2) b[i] = 255; else b[i + 2] = 255; } return b; })();
          const ff = renderEffectFrame("hflip", src, W, H, 1, 0, "mirror");
          const prev = fromImg(mod.applyMirror(toImg(src, W, H)), W, H);
          const m = compareFrames(ff, prev, W, H);
          const tier = classify(m);
          return { tier, line: `mirror | ${fmtM(m)} | ${tier} | badge ${effectBadgeStatus("mirror")}`, yuvLine: yuvLineFor("mirror", prev, ff, "yuv-v14-mirror") };
        });
        run("rgb-shift s=9", () => {
          const src = (() => { const b = Buffer.alloc(W * H * 3); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; b[i] = (x * 3) % 256; b[i + 1] = 128; b[i + 2] = ((W - 1 - x) * 3) % 256; } return b; })();
          const ff = renderEffectFrame("rgbashift=rh=9:bh=-9", src, W, H, 1, 0, "rgbshift");
          const prev = fromImg(mod.applyRgbShift(toImg(src, W, H), 0.5), W, H);
          const m = compareFrames(ff, prev, W, H);
          const tier = classify(m);
          return { tier, line: `rgb-shift s=9 | ${fmtM(m)} | ${tier} | badge ${effectBadgeStatus("rgb-shift")}`, yuvLine: yuvLineFor("rgb-shift s=9", prev, ff, "yuv-v14-rgbshift") };
        });
        for (const [localT, frameIndex] of [[0, 0], [0.5, 15]]) {
          run(`shake t=${localT}`, () => {
            const src = patternFrame(W, H);
            const frames = localT === 0 ? 1 : 30;
            const ff = renderEffectFrame("crop=w=iw-24:h=ih-24:x='12+12*sin(2*PI*t*9)':y='12+12*cos(2*PI*t*7)',pad=iw+24:ih+24:x=12:y=12:color=black", src, W, H, frames, frameIndex, `shake${frameIndex}`);
            const { dx, dy } = mod.shakeOffsetAt(localT);
            const prev = fromImg(mod.applyShake(toImg(src, W, H), dx, dy), W, H);
            const m = compareFrames(ff, prev, W, H);
            const tier = classify(m);
            return { tier, line: `shake t=${localT} (dx=${dx},dy=${dy}) | ${fmtM(m)} | ${tier} | badge ${effectBadgeStatus("shake")}`, yuvLine: yuvLineFor(`shake t=${localT}`, prev, ff, `yuv-v14-shake${frameIndex}`) };
          });
        }
        for (const t of [0.5, 1]) {
          run(`sharpen t=${t}`, () => {
            const src = patternFrame(W, H);
            const filter = buildEffectFilter({ type: "sharpen", intensity: t });
            const ff = renderEffectFrame(filter, src, W, H, 1, 0, `sharp${t}`);
            const prev = fromImg(mod.applySharpen(toImg(src, W, H), t), W, H);
            const m = compareFrames(ff, prev, W, H);
            const tier = classify(m);
            return { tier, line: `sharpen t=${t} (${filter}) | ${fmtM(m)} | ${tier} | badge ${effectBadgeStatus("sharpen")}`, yuvLine: yuvLineFor(`sharpen t=${t}`, prev, ff, `yuv-v14-sharp${t}`) };
          });
        }
        for (const [name, srcFn] of [["step", stepFrame], ["natural", naturalFrame]]) {
          run(`edgedetect ${name}`, () => {
            const src = srcFn(W, H);
            const filter = buildEffectFilter({ type: "edgedetect", intensity: 0.5 });
            const ff = renderEffectFrame(filter, src, W, H, 1, 0, `edge-${name}`);
            const prev = fromImg(mod.applyEdgeDetect(toImg(src, W, H), 0.5), W, H);
            const m = compareFrames(ff, prev, W, H);
            const tier = classify(m);
            return { tier, line: `edgedetect ${name} (${filter}) | ${fmtM(m)} | ${tier} | badge ${effectBadgeStatus("edgedetect")}`, yuvLine: yuvLineFor(`edgedetect ${name}`, prev, ff, `yuv-v14-edge-${name}`) };
          });
        }
        run("noise thống kê", () => {
          const src = solidFrame(128, 128, 128, W, H);
          const filter = buildEffectFilter({ type: "noise", intensity: 0.5 });
          const ff = renderEffectFrame(filter, src, W, H, 1, 0, "noise");
          const prev = fromImg(mod.applyNoise(toImg(src, W, H), 0.5, 42), W, H);
          const sR = channelStd(ff, W, H, 128);
          const sP = channelStd(prev, W, H, 128);
          const ratios = sR.map((v, i) => sP[i] / v);
          const okStat = ratios.every((r) => r >= 0.8 && r <= 1.25);
          const tier = okStat ? "STAT-APPROX" : "STAT-LỆCH";
          const m = compareFrames(ff, prev, W, H);
          return { tier, line: `noise t=0.5 (${filter}) | std render [${sR.map((v) => v.toFixed(2)).join(",")}] std preview [${sP.map((v) => v.toFixed(2)).join(",")}] tỉ lệ [${ratios.map((v) => v.toFixed(2)).join(",")}] | MAD từng frame ${m.mad.toFixed(2)} (chỉ tham khảo, nhiễu độc lập) | ${tier} | badge ${effectBadgeStatus("noise")}` };
        });
        run("glitch cấu trúc", () => {
          const src = patternFrame(W, H);
          const filter = buildEffectFilter({ type: "glitch", intensity: 0.5 });
          const ff = renderEffectFrame(filter, src, W, H, 1, 0, "glitch");
          const prev = fromImg(mod.applyGlitch(toImg(src, W, H), 0.5, 42), W, H);
          const m = compareFrames(ff, prev, W, H);
          // Kiểm tra cấu trúc (đợt 16 H5): preview glitch so với nguồn
          // chỉ rgb-shift (s=11, NHÂN BIÊN như render) phải có trung
          // bình |lệch| ≈ sigma·√(2/π) ≈ 9.2 và std ≈ sigma ≈ 11.55 với
          // ns=20 (nhiễu Gauss, sigma = ns/√3). Tiêu chí cũ (max ≤ 21)
          // chỉ đúng với nhiễu đều; nhiễu Gauss có đuôi vượt ns nên
          // max chỉ còn in tham khảo, không phải tiêu chí đạt/rớt.
          // Cả 2 tiêu chí mới đều đúng cho cả nhiễu đều lẫn Gauss
          // (đều: TB 10, std 11.55) nên vẫn bắt được sai cường độ.
          const shifted = (() => {
            const im = toImg(src, W, H); const d = im.data; const cp = new Uint8ClampedArray(d);
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
              const p = (y * W + x) * 4; const rs = Math.max(0, x - 11), bs = Math.min(W - 1, x + 11);
              d[p] = cp[(y * W + rs) * 4]; d[p + 2] = cp[(y * W + bs) * 4 + 2];
            }
            return fromImg(im, W, H);
          })();
          let maxD = 0, sumD = 0, sumSq = 0;
          const devs = [];
          for (let i = 0; i < prev.length; i++) { const dd = prev[i] - shifted[i]; devs.push(dd); maxD = Math.max(maxD, Math.abs(dd)); sumD += Math.abs(dd); }
          const meanD = sumD / prev.length;
          const muD = devs.reduce((s, v) => s + v, 0) / devs.length;
          const stdD = Math.sqrt(devs.reduce((s, v) => s + (v - muD) ** 2, 0) / devs.length);
          const structOk = meanD >= 7 && meanD <= 13 && stdD >= 9 && stdD <= 14;
          const tier = structOk ? "STRUCT-OK" : "STAT-LỆCH";
          return { tier, line: `glitch t=0.5 (${filter}) | ${fmtM(m)} (MAD từng frame chỉ tham khảo) | cấu trúc: lệch vs shift-thuần (nhân biên) max ${maxD} (tham khảo, Gauss có đuôi) TB ${meanD.toFixed(2)} (kỳ vọng 7–13) std ${stdD.toFixed(2)} (kỳ vọng 9–14) | ${tier} | badge ${effectBadgeStatus("glitch")}` };
        });
      }
    }
  }

  // ---- T. Transition ----
  if (ONLY === "all" || ONLY === "transition") {
    console.log("\n--- T. TRANSITION COMPOSITE (describeTransition vs render xfade, p=0.5) ---");
    if (YUV_MODE) console.log("  [YUV-FFmpeg] mode đo miền YUV BẬT: mỗi case in thêm dòng YUV (không tính vào counts/KẾT)");
    const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "transitionPreview-js");
    if (!tp.ok || typeof tp.mod.describeTransition !== "function") {
      console.log(`transitionPreview: PENDING toàn phần T — ${tp.ok ? "thiếu describeTransition" : tp.reason}`);
      counts.PENDING++;
    } else {
      const cases = [
        { type: "fade", note: "họ fade, crossfade tuyến tính" },
        { type: "wipeleft", note: "B quét từ phải sang" },
        { type: "slideright", note: "cả 2 cùng trượt" },
        { type: "circleopen", note: "B trong vòng tròn mở từ tâm" },
        { type: "circleclose", note: "A trong vòng tròn khép vào tâm" },
        { type: "diamondclose", note: "V3: A co thành hình thoi" },
        { type: "squareopen", note: "V3: B nở từ hình vuông giữa" },
        { type: "dissolve", note: "đợt 15 T1: dissolve-noise từng pixel theo vf_xfade.c (frand float32, đợt 14 R2) nay đo thật ở V14" },
        // Đợt 16 H1: 5 kind đợt 15 (rects đã có sẵn, bars-fade nối
        // nhánh composite mới ở trên) — đo để quyết badge.
        { type: "bars-fade", note: "đợt 16 H1: dải B thuần trên nền crossfade (kind bars-fade)" },
        { type: "blinds-h", note: "đợt 16 H1: 8 dải ngang, lưới dịch +0,5 (đợt 15 T6)" },
        { type: "plus", note: "đợt 16 H1: dấu cộng, biên lte ceil/floor+1 (đợt 15 T6)" },
        { type: "checker", note: "đợt 16 H1: ô bàn cờ, lưới dịch +0,5 (đợt 15 T6)" },
        { type: "grid", note: "đợt 16 H1: mỗi ô vuông B ở góc trên-trái ô (đợt 15 T2)" },
      ];
      if (LIST_ONLY) {
        for (const c of cases) console.log(`case: ${c.type} — ${c.note}`);
      } else {
        // Đợt 15 T1: nối 2 mô hình mới vào V14 trước khi đo — nếu load
        // lỗi thì regionCovers trả false có chủ đích (case LỆCH rõ
        // ràng), không quay lại PENDING giả.
        if (typeof tp.mod.radialGradientWeight === "function") {
          setRadialWeight(tp.mod.radialGradientWeight);
          console.log(`radialGradientWeight: dùng hàm thật từ module (đợt 14 R4, smoothstep + tâm cắt nguyên)`);
        } else {
          console.log(`radialGradientWeight: dùng fallback smoothstep nội bộ (module chưa có hàm thật)`);
        }
        // Đợt 16 H1: nối bars-fade vào V14 (mirror V11/V12).
        if (typeof tp.mod.barsFadePixelIsBar === "function") {
          setBarsFadeIsBar(tp.mod.barsFadePixelIsBar);
          console.log(`barsFadePixelIsBar: dùng hàm thật từ module (đợt 16 H1)`);
        } else {
          console.log(`barsFadePixelIsBar: dùng fallback nội bộ (module chưa có hàm thật)`);
        }
        const df = transpileTs(path.join("apps", "web", "src", "lib", "dissolveFrand.ts"), "dissolveFrand-js");
        if (df.ok && typeof df.mod.ffmpegDissolveFrand === "function") {
          setDissolveFrand(df.mod.ffmpegDissolveFrand);
          console.log(`dissolveFrand: OK (transpile từ apps/web/src/lib/dissolveFrand.ts)`);
        } else {
          console.log(`dissolveFrand: KHÔNG LOAD ĐƯỢC — ${df.reason || "thiếu ffmpegDissolveFrand"} (case dissolve sẽ LỆCH do region không raster được)`);
        }
        for (const c of cases) {
          try {
            const visual = tp.mod.describeTransition(c.type, 0.5, W, H);
            if (!visual.geometric && c.type !== "fade") {
              counts.PENDING++;
              console.log(`${c.type} | PENDING — describeTransition fallback fade (geometric=false), hình học chưa có trên đĩa; note: ${visual.note}`);
              continue;
            }
            const kinds = new Set();
            regionKinds(visual.a.region, kinds);
            regionKinds(visual.b.region, kinds);
            const unsupported = [...kinds].filter((k) => !SUPPORTED_REGION_KINDS.has(k));
            if (unsupported.length) {
              counts.PENDING++;
              console.log(`${c.type} | PENDING — region kind chưa hỗ trợ: ${unsupported.join(", ")}`);
              continue;
            }
            const previewBuf = rasterizeTransitionPreview(visual, W, H);
            const ff = renderTransitionFrame(c.type);
            const m = compareFrames(ff, previewBuf, W, H);
            const tier = classify(m);
            if (counts[tier] !== undefined) counts[tier]++;
            console.log(`${c.type} | geometric=${visual.geometric} | ${fmtM(m)} | ${tier} | note: ${visual.note}`);
            if (YUV_MODE) {
              try {
                const ym = ffmpegYuvCompare(previewBuf, ff, W, H, TMP, `yuv-tr14-${c.type}`);
                console.log(`  [YUV-FFmpeg] ${c.type} | ${formatYuvMad(ym)}`);
              } catch (e) {
                console.log(`  [YUV-FFmpeg] ${c.type} | LỖI: ${e.message}`);
              }
            }
          } catch (e) {
            renderErrors++;
            console.log(`${c.type} | RENDER LỖI: ${e.message}`);
          }
        }
      }
    }
  }

  console.log("");
  console.log(`== KẾT V14: KHỚP ${counts["KHỚP"]}, XẤP XỈ ${counts["XẤP XỈ"]}, LỆCH ${counts["LỆCH"]}, PENDING ${counts["PENDING"]}, STAT-APPROX ${counts["STAT-APPROX"]}, STRUCT-OK ${counts["STRUCT-OK"]}, STAT-LỆCH ${counts["STAT-LỆCH"]}; lỗi render: ${renderErrors} ==`);
  console.log(`tmp làm việc: ${TMP} (đã dọn sau khi chạy xong)`);
  cleanupTmp();
  if (renderErrors > 0) process.exit(1);
}

try {
  main();
} catch (e) {
  console.error("HARNESS LỖI:", e.message);
  cleanupTmp();
  process.exit(2);
}
