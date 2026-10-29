#!/usr/bin/env node
/**
 * test_v13_hd_parity.js — Phase 9 đợt 13, luồng C6: đo 14 type V3 ở HD +
 * nhiều p, tái dùng logic harness V12 (test_v12_parity.js) nhưng thay 2
 * điểm bắt buộc ở khung lớn:
 *
 * 1. RENDER QUA PIPE, KHÔNG QUA FILE RAW: V12 ghi raw 72x45 ra /tmp
 *    (vài trăm KB). Ở 1920x1080, 1 frame = 6.2MB, 46 frame = 285MB —
 *    /tmp trên VM này chỉ là tmpfs 512MB nên ghi file sẽ chết "No space
 *    left" (đã gặp thật khi benchmark). Harness này cho ffmpeg ghi
 *    rawvideo ra stdout, chỉ giữ đúng frame đích trong bộ nhớ.
 *
 * 2. P CHÍNH XÁC VỚI ÍT FRAME EXPR — VÀ HƯỚNG P SAU SỬA ĐỢT 14 R1:
 *    V12 dùng duration=1, fps=30 nên p chỉ có bước 1/30 — p=0.25/0.75
 *    không rơi đúng frame nguyên. V13 dùng duration=0.4, offset=1,
 *    fps=30: transition có 12 bước P, frame đích index = 30 + round(p*12)
 *    cho MỌI type (p=0.25/0.5/0.75 → 33/36/39).
 *    LỊCH SỬ: đợt 13 C6 phát hiện FFmpeg 8.1.2 đánh giá expr custom với
 *    P GIẢM 1→0 (wipeleft built-in B% tăng 0→100%, custom B% giảm
 *    100→0% qua frame 30..42), nên V13 bản đầu ghép custom theo
 *    30 + round((1-p)*12). Đợt 14 R1 đã SỬA ở tầng render
 *    (buildXfadeFilter dịch P→(1-P) cho custom + đổi hệ số A/B của
 *    circle-soft, xem docs/PHASE9_ROUND14_R1_PDIRECTION_LIMITS.md),
 *    nên từ đây custom chạy cùng chiều built-in/preview và ghép frame
 *    thống nhất 30 + round(p*12). p=0.5 rơi vào frame 36 ở cả 2 chiều
 *    nên V12 (chỉ đo p=0.5) không phát hiện được đảo chiều cũ.
 *
 * 3. RASTERIZE PREVIEW BẰNG SCANLINE, KHÔNG PER-PIXEL: V12 kiểm tra
 *    từng pixel qua pointInPolygon / rects.some — ở 1080p với rowScan
 *    1080 dải (sau fix) thì 2M pixel × ~15k rect là không chạy được.
 *    V13 rasterize theo hàng: rect/rects/circle điền khoảng, polygon
 *    quét (sweep) đúng luật toggle của V12 (pixel được phủ khi số giao
 *    điểm > tâm pixel là lẻ). Chế độ --check đối chiếu 2 rasterizer
 *    ở 72x45 để chứng minh chúng tương đương trước khi tin số HD.
 *
 * Cách chạy (từ server/render/):
 *   node src/test_v13_hd_parity.js [--size 1920x1080] [--ps 0.25,0.5,0.75]
 *     [--only diamondclose,rings] [--extra] [--check]
 *   --extra: thêm wipeleft + diamond (nợ cũ đợt 12) cùng size/p.
 *   --only: từ đợt 14 R1, nhận đúng danh sách type yêu cầu (kể cả type
 *     ngoài V3/EXTRA, vd 9 type P5) thay vì chỉ lọc trong V3/EXTRA.
 *   --check: chỉ đối chiếu rasterizer ở 72x45, p=0.5 (không render).
 * Nguồn: A đỏ thuần / B xanh dương thuần qua lavfi color (không file
 * input). Phân loại KHỚP/XẤP XỈ/LỆCH giữ đúng thang V6/V11/V12.
 * Exit: 0 khi mọi case render xong (kể cả LỆCH); 1 khi có lỗi render;
 * 2 khi harness lỗi.
 * 4. ĐỢT 17 N2: thêm radial-soft (circle-soft) + dissolve-noise (dissolve)
 *    vào V13 — 2 kind mà đợt 16 H1 ghi nợ (frame đen → LỆCH giả).
 *    radial-soft: trọng số TUYẾN TÍNH radialSoftWeight(center, width, rho)
 *    từ module thật (fallback cùng công thức clamp), KHÔNG phải smoothstep
 *    (smoothstep là của radial-gradient/circleopen — xem ghi chú trong
 *    LIMITS đợt này); tâm/rMax lấy từ chính region (cx = W/2+0.5,
 *    cy = H/2+0.5, rMax = hypot(W/2, H/2) theo case circle-soft), đánh
 *    giá tại TÂM pixel (x+0.5, y+0.5) — khoảng cách này bằng đúng
 *    khoảng cách FFmpeg tính tại chỉ số nguyên (|x-W/2|), đúng mô hình
 *    soft-aware đợt 14 R1 §3.4 / đợt 15 T6. dissolve-noise: mask frand
 *    float32 từ dissolveFrand.ts (đợt 14 R2, đúng vf_xfade.c), đánh giá
 *    tại chỉ số nguyên floor(x), floor(y); chưa load được hàm thì phủ
 *    sai có chủ đích (false) — KHÔNG dùng fallback double (đã chứng
 *    minh chỉ khớp ~mức ngẫu nhiên). Cả 2 kind đều đi đường per-pixel
 *    (không biểu diễn được bằng mask nhị phân scanline), như
 *    radial-gradient/bars-fade trước đó.
 */
"use strict";

const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v13-parity-"));

const { buildXfadeFilter, getTransition } = require("./transitions");

const FPS = 30;
const DUR = 0.4;
const OFFSET = 1.0;
const OFFSET_FRAMES = Math.round(OFFSET * FPS); // 30

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
function opt(name, def) {
  const eq = argv.find((a) => a.startsWith(name + "="));
  if (eq) return eq.slice(name.length + 1);
  const i = argv.indexOf(name);
  if (i >= 0 && i + 1 < argv.length && !argv[i + 1].startsWith("--")) return argv[i + 1];
  return def;
}
const sizeArg = opt("--size", "1920x1080");
const [W, H] = sizeArg.split("x").map((v) => parseInt(v, 10));
const psArg = opt("--ps", "0.25,0.5,0.75").split(",").map(Number);
const onlyArg = opt("--only", "");
const ONLY = onlyArg ? new Set(onlyArg.split(",")) : null;
const EXTRA = argv.includes("--extra");
const CHECK = argv.includes("--check");

const V3 = [
  "diamondclose", "squareopen", "squareclose", "checker-alt", "blinds-diag",
  "split-h", "split-v", "barn-h", "barn-v", "rings", "corners", "star",
  "clock-ccw", "spiral",
];
const EXTRA_TYPES = ["wipeleft", "diamond"];

function classify(m) {
  if (m.mismatch) return "LỆCH (FAIL — kích thước frame khác nhau)";
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP (PASS)";
  if (m.mad <= 20 && m.le32 >= 0.9) return "XẤP XỈ (PARTIAL)";
  return "LỆCH (FAIL)";
}
function compareFrames(a, b, w, h) {
  if (a.length !== b.length) return { mad: NaN, le8: 0, le32: 0, mismatch: true };
  let sum = 0, le8 = 0, le32 = 0;
  const n = w * h;
  for (let i = 0; i < n * 3; i++) sum += Math.abs(a[i] - b[i]);
  for (let p = 0; p < n; p++) {
    const d = Math.max(Math.abs(a[p * 3] - b[p * 3]), Math.abs(a[p * 3 + 1] - b[p * 3 + 1]), Math.abs(a[p * 3 + 2] - b[p * 3 + 2]));
    if (d <= 8) le8++;
    if (d <= 32) le32++;
  }
  return { mad: sum / (n * 3), le8: le8 / n, le32: le32 / n };
}
function fracNear(buf, w, h, target, tol) {
  let hit = 0;
  for (let i = 0; i < w * h; i++) {
    if (Math.abs(buf[i * 3] - target[0]) <= tol && Math.abs(buf[i * 3 + 1] - target[1]) <= tol && Math.abs(buf[i * 3 + 2] - target[2]) <= tol) hit++;
  }
  return hit / (w * h);
}

// ---------------------------------------------------------------------------
// Load transitionPreview.ts qua tsc → /tmp (y hệt V12)
// ---------------------------------------------------------------------------
function findTsc() {
  const candidates = [path.join(ROOT, "apps", "web", "node_modules", ".bin", "tsc"), path.join(ROOT, "node_modules", ".bin", "tsc"), "tsc"];
  for (const c of candidates) {
    const r = spawnSync(c, ["--version"], { encoding: "utf8" });
    if (r.status === 0) return c;
  }
  return null;
}
function loadTransitionPreview() {
  const src = path.join(ROOT, "apps", "web", "src", "lib", "transitionPreview.ts");
  const tsc = findTsc();
  if (!tsc) return { ok: false, reason: "không tìm thấy tsc" };
  const outDir = path.join(TMP, "tp-js");
  fs.mkdirSync(outDir, { recursive: true });
  const r = spawnSync(tsc, [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, "transitionPreview.js");
  if (!fs.existsSync(jsFile)) return { ok: false, reason: `tsc không sinh ra js: ${(r.stderr || "").slice(0, 300)}` };
  try { return { ok: true, mod: require(jsFile) }; }
  catch (e) { return { ok: false, reason: `require lỗi: ${e.message}` }; }
}
function cleanup() { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {} }

// Đợt 17 N2: transpile dissolveFrand.ts (không import gì) qua tsc → /tmp,
// mirror cách V11/V12 load module này. Trả về { ok, mod?, reason? }.
function loadDissolveFrand() {
  const src = path.join(ROOT, "apps", "web", "src", "lib", "dissolveFrand.ts");
  const tsc = findTsc();
  if (!tsc) return { ok: false, reason: "không tìm thấy tsc" };
  const outDir = path.join(TMP, "df-js");
  fs.mkdirSync(outDir, { recursive: true });
  const r = spawnSync(tsc, [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, "dissolveFrand.js");
  if (!fs.existsSync(jsFile)) return { ok: false, reason: `tsc không sinh ra js: ${(r.stderr || "").slice(0, 300)}` };
  try { return { ok: true, mod: require(jsFile) }; }
  catch (e) { return { ok: false, reason: `require lỗi: ${e.message}` }; }
}

// ---------------------------------------------------------------------------
// Rasterizer per-pixel của V12 (chỉ dùng cho --check ở khung nhỏ)
// ---------------------------------------------------------------------------
function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// ---------------------------------------------------------------------------
// Đợt 16 H1: nhánh radial-gradient + bars-fade cho V13 (mirror V11/V12/V14).
// V13 trước đây KHÔNG có nhánh radial-gradient: circleopen/circleclose
// rơi vào default → mask rỗng → frame đen → MAD ~84 FAIL giả (đo
// baseline 320x180: circleopen 83,819, bars-fade 84,833, B% preview 0).
// V13 cũng không dùng cosin cũ — nó thiếu hẳn nhánh, còn tệ hơn
// cosin. Nhánh mới: smoothstep thật từ module radialGradientWeight,
// tâm/rMax lấy từ chính region (describeTransition đã đặt theo
// floor(W/2), floor(H/2), hypot(cx,cy) — hiệu chuẩn đợt 14 R4),
// đánh giá tại CHỈ SỐ pixel nguyên (x, y), KHÔNG tự tính lại tâm
// (W/2, H/2). Nhánh "circle" biên cứng cũ giữ nguyên cho circlecrop
// (vùng circle thật, không phải gradient).
// ---------------------------------------------------------------------------
let radialWeightFnV13 = null;
function radialWeightV13(mid, rho) {
  if (radialWeightFnV13) return radialWeightFnV13(mid, rho);
  const g = Math.min(1, Math.max(0, rho - mid + 0.5));
  return 1 - (3 * g * g - 2 * g * g * g);
}
// Đợt 17 N2: trọng số tuyến tính của radial-soft (circle-soft), ưu tiên
// hàm thật radialSoftWeight từ module; fallback là đúng công thức của
// module: clamp((center+width-rho)/width, 0, 1), width<=0 → bậc thang.
let radialSoftWeightFnV13 = null;
function radialSoftWeightV13(center, width, rho) {
  if (radialSoftWeightFnV13) return radialSoftWeightFnV13(center, width, rho);
  if (!(width > 0)) return rho <= center ? 1 : 0;
  const w = (center + width - rho) / width;
  return w < 0 ? 0 : w > 1 ? 1 : w;
}
// Đợt 17 N2: hàm frand thật từ dissolveFrand.ts (đợt 14 R2). Chưa load
// được → dissolve-noise phủ sai có chủ đích (false), xem regionCoversV12.
let dissolveFrandFnV13 = null;
let barsFadeIsBarFnV13 = null;
function barsFadeIsBarV13(x, bandW, p) {
  if (barsFadeIsBarFnV13) return barsFadeIsBarFnV13(x, bandW, p);
  if (!(bandW > 0) || !(p > 0)) return false;
  const m = ((x % bandW) + bandW) % bandW;
  return m < p * bandW;
}
function layerPixelAlphaV13(layer, x, y, w, h) {
  const cx = w / 2, cy = h / 2;
  const sx = layer.scaleX === 0 ? NaN : cx + (x + 0.5 - cx - layer.dx) / layer.scaleX;
  const sy = layer.scaleY === 0 ? NaN : cy + (y + 0.5 - cy - layer.dy) / layer.scaleY;
  if (!(sx >= 0 && sx < w && sy >= 0 && sy < h)) return 0;
  const r = layer.region;
  if (r && r.kind === "radial-gradient") {
    const rho = Math.hypot(x - r.cx, y - r.cy) / r.rMax;
    const wgt = radialWeightV13(r.mid, rho);
    return (r.inverted ? 1 - wgt : wgt) * layer.alpha;
  }
  // Đợt 17 N2: radial-soft — trọng số tuyến tính, đánh giá tại TÂM
  // pixel so với tâm region đã dịch +0.5 (cx = W/2+0.5): khoảng cách
  // |(x+0.5)-(W/2+0.5)| = |x-W/2| bằng đúng FFmpeg tại chỉ số nguyên.
  // Ở khung chẵn (1920x1080) quy ước này trùng với tâm cắt nguyên
  // floor(W/2); ở khung lẻ nó mới khác — và bản dịch +0.5 là bản
  // đúng theo đợt 15 T6 (chưa dịch: MAD ~0,9 ở 192x108; đã dịch: 0,18).
  if (r && r.kind === "radial-soft") {
    const rho = Math.hypot(x + 0.5 - r.cx, y + 0.5 - r.cy) / r.rMax;
    const wgt = radialSoftWeightV13(r.center, r.width, rho);
    return (r.inverted ? 1 - wgt : wgt) * layer.alpha;
  }
  return regionCoversV12(r, x + 0.5, y + 0.5) ? layer.alpha : 0;
}
function regionCoversV12(region, x, y) {
  if (region === null || region === undefined) return true;
  switch (region.kind) {
    case "rect": return x >= region.x && x < region.x + region.w && y >= region.y && y < region.y + region.h;
    case "rects": return region.rects.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    case "circle": { const dx = x - region.cx, dy = y - region.cy; return dx * dx + dy * dy <= region.r * region.r; }
    case "circle-inverted": { const dx = x - region.cx, dy = y - region.cy; return dx * dx + dy * dy > region.r * region.r; }
    case "polygon": return pointInPolygon(x, y, region.points);
    case "polygon-inverted": return !pointInPolygon(x, y, region.points);
    case "radial-gradient": return true; // phủ khắp khung, alpha theo bán kính (xem layerPixelAlphaV13)
    case "radial-soft": return true; // Đợt 17 N2: như radial-gradient — phủ khắp khung, alpha theo bán kính mềm (xem layerPixelAlphaV13); rasterizer phải đi đường per-pixel, không dùng nhánh mask nhị phân.
    case "dissolve-noise": {
      // Đợt 17 N2: mask frand float32 (đợt 14 R2, đúng vf_xfade.c).
      // Raster truyền tọa độ tâm pixel (x+0.5) nên floor về chỉ số
      // nguyên: vf_xfade.c đánh giá frand tại x, y nguyên, KHÔNG phải
      // tâm pixel. Chưa load được hàm thì phủ sai có chủ đích (false).
      if (typeof dissolveFrandFnV13 !== "function") return false;
      const fr = dissolveFrandFnV13(Math.floor(x), Math.floor(y));
      return region.invert ? fr >= region.p : fr < region.p;
    }
    default: return false;
  }
}
function layerCoversV12(layer, px, py, w, h) {
  if (!regionCoversV12(layer.region, px, py)) return false;
  const cx = w / 2, cy = h / 2;
  const sx = layer.scaleX === 0 ? NaN : cx + (px - cx - layer.dx) / layer.scaleX;
  const sy = layer.scaleY === 0 ? NaN : cy + (py - cy - layer.dy) / layer.scaleY;
  return sx >= 0 && sx < w && sy >= 0 && sy < h;
}
function rasterizeV12(visual, w, h) {
  const A = [255, 0, 0], B = [0, 0, 255];
  const buf = Buffer.alloc(w * h * 3);
  // Đợt 16 H1: nhánh radial-gradient + bars-fade (mirror V11/V12).
  // Đợt 17 N2: thêm radial-soft + dissolve-noise — cả 2 đều đi đường
  // per-pixel qua layerPixelAlphaV13 (gradient mềm / mask frand từng
  // pixel, không biểu diễn được bằng mask nhị phân hay nhánh geometric
  // sequential-over; dissolve qua geometric cũng đúng vì 2 tập rời
  // nhau, nhưng đường per-pixel giữ 1 quy ước duy nhất với rasterizeV13).
  const hasRadial =
    (visual.a.region && visual.a.region.kind === "radial-gradient") ||
    (visual.b.region && visual.b.region.kind === "radial-gradient");
  const hasRadialSoft =
    (visual.a.region && visual.a.region.kind === "radial-soft") ||
    (visual.b.region && visual.b.region.kind === "radial-soft");
  const hasDissolve =
    (visual.a.region && visual.a.region.kind === "dissolve-noise") ||
    (visual.b.region && visual.b.region.kind === "dissolve-noise");
  const hasBarsFade =
    (visual.a.region && visual.a.region.kind === "bars-fade") ||
    (visual.b.region && visual.b.region.kind === "bars-fade");
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = x + 0.5, py = y + 0.5, i = (y * w + x) * 3;
    let r = 0, g = 0, b = 0;
    if (hasRadial || hasRadialSoft || hasDissolve) {
      const ca = layerPixelAlphaV13(visual.a, x, y, w, h);
      const cb = layerPixelAlphaV13(visual.b, x, y, w, h);
      r = A[0] * ca + B[0] * cb; g = A[1] * ca + B[1] * cb; b = A[2] * ca + B[2] * cb;
    } else if (hasBarsFade) {
      const reg = visual.a.region && visual.a.region.kind === "bars-fade"
        ? visual.a.region : visual.b.region;
      if (barsFadeIsBarV13(x, reg.bandW, reg.p)) {
        r = B[0]; g = B[1]; b = B[2];
      } else {
        r = A[0] * (1 - reg.p) + B[0] * reg.p;
        g = A[1] * (1 - reg.p) + B[1] * reg.p;
        b = A[2] * (1 - reg.p) + B[2] * reg.p;
      }
    } else if (!visual.geometric) {
      const ca = layerCoversV12(visual.a, px, py, w, h) ? visual.a.alpha : 0;
      const cb = layerCoversV12(visual.b, px, py, w, h) ? visual.b.alpha : 0;
      r = A[0] * ca + B[0] * cb; g = A[1] * ca + B[1] * cb; b = A[2] * ca + B[2] * cb;
    } else {
      if (layerCoversV12(visual.a, px, py, w, h)) { r = A[0] * visual.a.alpha + r * (1 - visual.a.alpha); g = A[1] * visual.a.alpha + g * (1 - visual.a.alpha); b = A[2] * visual.a.alpha + b * (1 - visual.a.alpha); }
      if (layerCoversV12(visual.b, px, py, w, h)) { r = B[0] * visual.b.alpha + r * (1 - visual.b.alpha); g = B[1] * visual.b.alpha + g * (1 - visual.b.alpha); b = B[2] * visual.b.alpha + b * (1 - visual.b.alpha); }
    }
    buf[i] = Math.round(r); buf[i + 1] = Math.round(g); buf[i + 2] = Math.round(b);
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Rasterizer scanline V13 (nhanh ở HD, đúng luật toggle của V12)
// ---------------------------------------------------------------------------
function fillRow(mask, w, y, x0, x1excl) {
  const a = Math.max(0, x0), b = Math.min(w, x1excl);
  for (let x = a; x < b; x++) mask[y * w + x] = 1;
}
function rectRows(r) {
  // hàng y có tâm y+0.5 trong [r.y, r.y+r.h)
  const y0 = Math.max(0, Math.ceil(r.y - 0.5));
  const y1 = Math.min(1e9, Math.ceil(r.y + r.h - 0.5)); // exclusive
  const x0 = Math.ceil(r.x - 0.5);
  const x1 = Math.ceil(r.x + r.w - 0.5); // exclusive
  return { y0, y1, x0, x1 };
}
function layerMask(layer, w, h) {
  const mask = new Uint8Array(w * h);
  const hasTransform = layer.dx !== 0 || layer.dy !== 0 || layer.scaleX !== 1 || layer.scaleY !== 1;
  if (hasTransform) {
    // Fallback per-pixel (hiếm; các case V3/wipeleft/diamond đều identity).
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (layerCoversV12(layer, x + 0.5, y + 0.5, w, h)) mask[y * w + x] = 1;
    }
    return mask;
  }
  const region = layer.region;
  if (region === null || region === undefined) { mask.fill(1); return mask; }
  switch (region.kind) {
    case "rect": {
      const { y0, y1, x0, x1 } = rectRows(region);
      for (let y = y0; y < y1 && y < h; y++) fillRow(mask, w, y, x0, x1);
      return mask;
    }
    case "rects": {
      for (const r of region.rects) {
        const { y0, y1, x0, x1 } = rectRows(r);
        for (let y = y0; y < y1 && y < h; y++) fillRow(mask, w, y, x0, x1);
      }
      return mask;
    }
    case "circle":
    case "circle-inverted": {
      const inv = region.kind === "circle-inverted";
      if (inv) mask.fill(1);
      for (let y = 0; y < h; y++) {
        const dy = y + 0.5 - region.cy;
        if (Math.abs(dy) > region.r) continue;
        const dx = Math.sqrt(region.r * region.r - dy * dy);
        const x0 = Math.ceil(region.cx - dx - 0.5);
        const x1 = Math.floor(region.cx + dx - 0.5) + 1;
        if (inv) { for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) mask[y * w + x] = 0; }
        else fillRow(mask, w, y, x0, x1);
      }
      return mask;
    }
    case "polygon":
    case "polygon-inverted": {
      const inv = region.kind === "polygon-inverted";
      const pts = region.points;
      for (let y = 0; y < h; y++) {
        const py = y + 0.5;
        const ints = [];
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py)) ints.push(((xj - xi) * (py - yi)) / (yj - yi) + xi);
        }
        ints.sort((a, b) => a - b);
        // Sweep: pixel phủ khi số giao điểm > tâm pixel là lẻ (đúng V12).
        let ptr = 0;
        for (let x = 0; x < w; x++) {
          const px = x + 0.5;
          while (ptr < ints.length && ints[ptr] <= px) ptr++;
          const inside = ((ints.length - ptr) % 2) === 1;
          if (inside !== inv) mask[y * w + x] = 1;
        }
      }
      return mask;
    }
    default: return mask;
  }
}
function rasterizeV13(visual, w, h) {
  const A = [255, 0, 0], B = [0, 0, 255];
  const buf = Buffer.alloc(w * h * 3);
  // Đợt 16 H1: radial-gradient/bars-fade không biểu diễn được bằng
  // mask nhị phân (gradient/blend từng pixel) nên đi đường per-pixel
  // (như rasterizeV12) thay vì layerMask; các kind mask khác vẫn đi
  // đường scanline nhanh bên dưới. Ở HD, đường per-pixel này chạy
  // ~2M pixel/case — chấp nhận được cho case circle/bars-fade.
  const hasRadial13 =
    (visual.a.region && visual.a.region.kind === "radial-gradient") ||
    (visual.b.region && visual.b.region.kind === "radial-gradient");
  const hasRadialSoft13 =
    (visual.a.region && visual.a.region.kind === "radial-soft") ||
    (visual.b.region && visual.b.region.kind === "radial-soft");
  const hasDissolve13 =
    (visual.a.region && visual.a.region.kind === "dissolve-noise") ||
    (visual.b.region && visual.b.region.kind === "dissolve-noise");
  const hasBarsFade13 =
    (visual.a.region && visual.a.region.kind === "bars-fade") ||
    (visual.b.region && visual.b.region.kind === "bars-fade");
  if (hasRadial13 || hasRadialSoft13 || hasDissolve13 || hasBarsFade13) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      let r = 0, g = 0, b = 0;
      if (hasRadial13 || hasRadialSoft13 || hasDissolve13) {
        const ca = layerPixelAlphaV13(visual.a, x, y, w, h);
        const cb = layerPixelAlphaV13(visual.b, x, y, w, h);
        r = A[0] * ca + B[0] * cb; g = A[1] * ca + B[1] * cb; b = A[2] * ca + B[2] * cb;
      } else {
        const reg = visual.a.region && visual.a.region.kind === "bars-fade"
          ? visual.a.region : visual.b.region;
        if (barsFadeIsBarV13(x, reg.bandW, reg.p)) {
          r = B[0]; g = B[1]; b = B[2];
        } else {
          r = A[0] * (1 - reg.p) + B[0] * reg.p;
          g = A[1] * (1 - reg.p) + B[1] * reg.p;
          b = A[2] * (1 - reg.p) + B[2] * reg.p;
        }
      }
      buf[i] = Math.round(r); buf[i + 1] = Math.round(g); buf[i + 2] = Math.round(b);
    }
    return buf;
  }
  const ma = layerMask(visual.a, w, h);
  const mb = layerMask(visual.b, w, h);
  for (let p = 0; p < w * h; p++) {
    const i = p * 3;
    let r = 0, g = 0, b = 0;
    if (!visual.geometric) {
      const ca = ma[p] ? visual.a.alpha : 0;
      const cb = mb[p] ? visual.b.alpha : 0;
      r = A[0] * ca + B[0] * cb; g = A[1] * ca + B[1] * cb; b = A[2] * ca + B[2] * cb;
    } else {
      if (ma[p]) { r = A[0] * visual.a.alpha + r * (1 - visual.a.alpha); g = A[1] * visual.a.alpha + g * (1 - visual.a.alpha); b = A[2] * visual.a.alpha + b * (1 - visual.a.alpha); }
      if (mb[p]) { r = B[0] * visual.b.alpha + r * (1 - visual.b.alpha); g = B[1] * visual.b.alpha + g * (1 - visual.b.alpha); b = B[2] * visual.b.alpha + b * (1 - visual.b.alpha); }
    }
    buf[i] = Math.round(r); buf[i + 1] = Math.round(g); buf[i + 2] = Math.round(b);
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Render xfade qua pipe: chỉ giữ frame đích
// ---------------------------------------------------------------------------
function renderTransitionFrame(type, p) {
  return new Promise((resolve, reject) => {
    // ROUND14 R1: sau khi buildXfadeFilter dịch P→(1-P) cho custom expr
    // (và sửa hệ số A/B của circle-soft), custom chạy cùng chiều với
    // built-in và preview: frame đích = 30 + round(p*12) cho MỌI type.
    // Ghép frame cũ (custom: 30 + round((1-p)*12)) chỉ đúng trước khi sửa;
    // giữ lại nó sẽ đo ngược và cho MAD ~85–124 giả như lần đo HD đầu
    // của đợt 13 C6. p=0.25/0.5/0.75 → frame 33/36/39 cho mọi type.
    const targetIndex = OFFSET_FRAMES + Math.round(p * DUR * FPS);
    const frameSize = W * H * 3;
    const need = (targetIndex + 1) * frameSize;
    const filter = buildXfadeFilter(type, DUR, OFFSET);
    const t0 = Date.now();
    const ff = spawn("ffmpeg", ["-v", "error", "-y",
      "-f", "lavfi", "-i", `color=c=red:s=${W}x${H}:r=${FPS}:d=2`,
      "-f", "lavfi", "-i", `color=c=blue:s=${W}x${H}:r=${FPS}:d=2`,
      "-filter_complex", `[0:v][1:v]${filter},format=rgb24[v]`,
      "-map", "[v]", "-frames:v", String(targetIndex + 1),
      "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], {});
    // Chỉ giữ phần stream thuộc frame đích (bắt đầu ở targetIndex*frameSize):
    // ở HD, tích lũy toàn bộ stream = 39 frame × 6.2MB ≈ 242MB/case.
    const keep = [];
    let total = 0, done = false;
    const startByte = targetIndex * frameSize;
    ff.stdout.on("data", (c) => {
      if (done) return;
      const cStart = total, cEnd = total + c.length;
      total = cEnd;
      if (cEnd <= startByte) return; // frame trước đích: bỏ
      const lo = Math.max(0, startByte - cStart);
      const hi = Math.min(c.length, need - cStart);
      if (hi > lo) keep.push(c.subarray(lo, hi));
      if (total >= need) { done = true; try { ff.kill("SIGKILL"); } catch (_) {} }
    });
    let stderr = "";
    ff.stderr.on("data", (c) => { stderr += c.toString(); });
    ff.on("error", (e) => reject(new Error(`spawn ffmpeg lỗi: ${e.message}`)));
    ff.on("close", () => {
      const buf = Buffer.concat(keep);
      if (buf.length < frameSize) { reject(new Error(`ffmpeg thiếu frame đích: nhận ${buf.length} byte, cần ${frameSize} (stderr: ${stderr.slice(0, 300)})`)); return; }
      resolve({ frame: Buffer.from(buf.subarray(0, frameSize)), ms: Date.now() - t0, targetIndex });
    });
  });
}

// Phân tích lệch riêng cho wipeleft/diamond: chỉ đếm pixel lệch > 8
// (ngưỡng của thang KHỚP). Đếm bằng nhau tuyệt đối sẽ đếm cả sàn
// làm tròn yuv→rgb của lavfi (đỏ render 254 vs preview 255, diff = 1)
// thành "lệch" — sai số này chiếm tới ~75% pixel nhưng không phải
// lỗi hình học, nên phải loại bằng ngưỡng.
function mismatchAnalysis(renderBuf, previewBuf, w, h) {
  const cols = new Map();
  let total = 0, floor1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    const d = Math.max(Math.abs(renderBuf[i] - previewBuf[i]), Math.abs(renderBuf[i + 1] - previewBuf[i + 1]), Math.abs(renderBuf[i + 2] - previewBuf[i + 2]));
    if (d === 1) floor1++;
    if (d > 8) { total++; cols.set(x, (cols.get(x) || 0) + 1); }
  }
  const colList = [...cols.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return { total, floor1, nCols: cols.size, topCols: colList.map(([x, n]) => `${x}:${n}`).join(",") };
}

async function main() {
  console.log("== V13 HD parity harness (đợt 13 C6) ==");
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  console.log(`size: ${W}x${H} @${FPS}fps, duration=${DUR} offset=${OFFSET}, A đỏ / B xanh (lavfi, pipe, không file raw)`);
  console.log(`máy đo: ${os.hostname()} ${os.platform()}/${os.arch()} ${os.cpus().length} CPU (số chỉ đúng máy này)`);
  const tp = loadTransitionPreview();
  if (!tp.ok) { console.log(`transitionPreview: PENDING — ${tp.reason}`); cleanup(); process.exit(2); }
  console.log("transitionPreview: OK (transpile từ apps/web/src/lib/transitionPreview.ts)");
  // Đợt 16 H1: nối hàm thật cho nhánh radial-gradient + bars-fade
  // (đặt trước cả nhánh --check lẫn đo chính, vì cả 2 đều dùng
  // rasterizeV12/rasterizeV13 mới).
  if (typeof tp.mod.radialGradientWeight === "function") {
    radialWeightFnV13 = tp.mod.radialGradientWeight;
    console.log(`radialGradientWeight: dùng hàm thật từ module (đợt 16 H1, smoothstep + tâm cắt nguyên)`);
  } else {
    console.log(`radialGradientWeight: dùng fallback smoothstep nội bộ (module chưa có hàm thật)`);
  }
  if (typeof tp.mod.barsFadePixelIsBar === "function") {
    barsFadeIsBarFnV13 = tp.mod.barsFadePixelIsBar;
    console.log(`barsFadePixelIsBar: dùng hàm thật từ module (đợt 16 H1)`);
  } else {
    console.log(`barsFadePixelIsBar: dùng fallback nội bộ (module chưa có hàm thật)`);
  }
  // Đợt 17 N2: nối hàm thật cho radial-soft + dissolve-noise (đặt trước
  // cả nhánh --check lẫn đo chính, vì cả 2 đều dùng rasterizer mới).
  if (typeof tp.mod.radialSoftWeight === "function") {
    radialSoftWeightFnV13 = tp.mod.radialSoftWeight;
    console.log(`radialSoftWeight: dùng hàm thật từ module (đợt 17 N2, tuyến tính — KHÔNG phải smoothstep của radial-gradient)`);
  } else {
    console.log(`radialSoftWeight: dùng fallback tuyến tính nội bộ (module chưa có hàm thật)`);
  }
  const df = loadDissolveFrand();
  if (df.ok && typeof df.mod.ffmpegDissolveFrand === "function") {
    dissolveFrandFnV13 = df.mod.ffmpegDissolveFrand;
    console.log(`dissolveFrand: OK (transpile từ apps/web/src/lib/dissolveFrand.ts, đợt 17 N2)`);
  } else {
    console.log(`dissolveFrand: KHÔNG LOAD ĐƯỢC — ${df.ok ? "thiếu ffmpegDissolveFrand" : df.reason} (case dissolve sẽ LỆCH do region không raster được, không dùng fallback double)`);
  }

  if (CHECK) {
    // Đối chiếu rasterizer ở 72x45, p=0.5 — không render.
    const cw = 72, ch = 45;
    let maxDiff = 0, worst = "";
    // Đợt 16 H1: --check mở rộng thêm circleopen/circleclose/bars-fade
    // để đối chiếu 2 rasterizer trên chính các kind mới nối.
    // Đợt 17 N2: thêm circle-soft/dissolve vào đối chiếu tương tự.
    for (const t of [...V3, ...EXTRA_TYPES, "circleopen", "circleclose", "bars-fade", "circle-soft", "dissolve"]) {
      const visual = tp.mod.describeTransition(t, 0.5, cw, ch);
      const a = rasterizeV12(visual, cw, ch);
      const b = rasterizeV13(visual, cw, ch);
      let diff = 0;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
      const pix = diff / 3;
      console.log(`${t} | pixel kênh lệch V12-vs-V13: ${pix} / ${cw * ch} pixel`);
      if (pix > maxDiff) { maxDiff = pix; worst = t; }
    }
    console.log(`CHECK KẾT: lệch lớn nhất ${maxDiff} pixel (${worst})`);
    cleanup();
    return;
  }

  // ROUND14 R1: --only giờ nhận đúng danh sách type yêu cầu (kể cả type
  // ngoài V3/EXTRA, vd 9 type P5) thay vì chỉ lọc trong V3/EXTRA — để đo
  // được toàn bộ 23 type custom sau khi sửa hướng P. Không có --only thì
  // giữ hành vi cũ (V3 + EXTRA nếu có --extra).
  const types = ONLY ? [...ONLY] : [...V3, ...(EXTRA ? EXTRA_TYPES : [])];
  const fails = [];
  let renderErrors = 0;
  for (const p of psArg) {
    for (const type of types) {
      try {
        const t0 = Date.now();
        const visual = tp.mod.describeTransition(type, p, W, H);
        const previewBuf = rasterizeV13(visual, W, H);
        const prevMs = Date.now() - t0;
        const { frame, ms, targetIndex } = await renderTransitionFrame(type, p);
        const m = compareFrames(frame, previewBuf, W, H);
        const tier = classify(m);
        if (tier.startsWith("LỆCH")) fails.push(`${type}@p=${p}`);
        const bRender = fracNear(frame, W, H, [0, 0, 255], 16);
        const bPreview = fracNear(previewBuf, W, H, [0, 0, 255], 16);
        let extra = "";
        if (EXTRA_TYPES.includes(type)) {
          const an = mismatchAnalysis(frame, previewBuf, W, H);
          extra = ` | lệch>8: ${an.total} pixel (${(an.total / (W * H) * 100).toFixed(3)}%) trên ${an.nCols} cột, top: ${an.topCols || "-"} | pixel diff=1 (sàn yuv): ${an.floor1}`;
        }
        console.log(`${type} | p=${p} (frame ${targetIndex}) | geometric=${visual.geometric} | MAD=${m.mad.toFixed(3)} <=8: ${(m.le8 * 100).toFixed(3)}% <=32: ${(m.le32 * 100).toFixed(3)}% | ${tier} | B%: render ${(bRender * 100).toFixed(2)} vs preview ${(bPreview * 100).toFixed(2)} | render ${ms}ms preview ${prevMs}ms${extra}`);
      } catch (e) {
        renderErrors++;
        console.log(`${type} | p=${p} | RENDER LỖI: ${e.message}`);
      }
    }
  }
  console.log(`== KẾT V13: ${types.length * psArg.length} case, FAIL: ${fails.length ? fails.join(", ") : "không có"}; lỗi render: ${renderErrors} ==`);
  cleanup();
  if (renderErrors > 0) process.exit(1);
}

main().catch((e) => { console.error("HARNESS LỖI:", e.message); cleanup(); process.exit(2); });
