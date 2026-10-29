#!/usr/bin/env node
/**
 * harnessShared.js — Phase 9 đợt 16, luồng H6: logic raster transition
 * dùng chung cho 3 harness parity V11/V12/V14.
 *
 * Bối cảnh: đợt 15 kết luận 3 harness chứa 3 bản copy của cùng logic
 * radial/dissolve — sửa mô hình sau này phải sửa cả 3 nơi. Module này
 * là bản copy DUY NHẤT của phần logic đó, trích nguyên văn từ V11 (đã
 * đối chiếu từng dòng với V12/V14: chỉ khác nhau ở định dạng trình bày
 * và thứ tự case trong switch, ngữ nghĩa tính toán giống hệt nhau —
 * xem kiểm chứng trong docs/PHASE9_ROUND16_H6_SHARED_FOOTAGE_LIMITS.md).
 *
 * Phạm vi module này (chỉ phần ĐÃ trùng nhau ở cả 3 harness):
 * - radialWeight: trọng số smoothstep vùng radial-gradient, ưu tiên hàm
 *   THẬT radialGradientWeight từ module transitionPreview (đợt 14 R4);
 *   fallback là đúng công thức nhiệm vụ giao:
 *   w = 1 − S(clamp(rho−mid+0.5, 0, 1)), S(t)=3t²−2t³.
 * - regionCovers: test vùng, gồm kind dissolve-noise dùng mask frand
 *   float32 từ dissolveFrand.ts (đợt 14 R2, đúng vf_xfade.c: đánh giá
 *   tại CHỈ SỐ pixel nguyên floor(x), floor(y), KHÔNG phải tâm pixel).
 *   Chưa load được hàm frand thì dissolve-noise phủ sai có chủ đích
 *   (false) để case dissolve LỆCH rõ ràng, không cho số của fallback.
 * - layerPixelAlpha: alpha từng pixel của 1 lớp; vùng radial-gradient
 *   đánh giá bán kính tại CHỈ SỐ nguyên (x, y) so với tâm CẮT NGUYÊN
 *   và rMax của chính region (r.cx/r.cy/r.rMax do describeTransition
 *   cung cấp), KHÔNG dùng (W/2, H/2) (khác nhau khi W hoặc H lẻ).
 * - layerCovers, pointInPolygon: giữ nguyên như bản gốc.
 *
 * Đợt 17 N1: rasterizeTransitionPreview cũng đã dời về đây (đợt 16 H1
 * đã xong, nhánh bars-fade đã ổn định giống hệt ở cả 3 harness — đối
 * chiếu từng dòng trước khi dời: chỉ khác format/comment, ngữ nghĩa
 * tính toán giống hệt nhau). 3 harness nay chỉ require hàm này, không
 * còn bản sao riêng. Kèm theo là barsFadeIsBar (đợt 16 H1) cũng dời
 * về đây với cùng quy ước set* như 2 hàm thật kia.
 *
 * Đợt 18, luồng harness-YUV: thêm công cụ đo trong miền YUV (KHÔNG
 * sửa code sản phẩm, KHÔNG sửa logic raster/preview ở trên):
 * - rgbToYuv420: RGB24 -> yuv420p raw (layout Y, U, V nối tiếp, đúng
 *   layout rawvideo yuv420p của FFmpeg), ma trận BT.601 limited-range
 *   (studio swing), chroma = trung bình hộp 2x2. Đối chứng với chính
 *   FFmpeg (swscale rgb24 -> yuv420p) trên frame clip1@1.5s: MAD tổng
 *   0,0597 (Y 0,0005 / U 0,2759 / V 0,0805) — phần dư là do swscale
 *   lọc chroma khác trung bình hộp, không phải sai ma trận (BT.709
 *   limited cho MAD tổng 10,91; BT.601 full-range cho 38,73 trên cùng
 *   frame — xem docs/PHASE9_ROUND18_HARNESS_YUV_LIMITS.md §2).
 *   Chỉ dùng cho khung chẵn (W, H đều chẵn); khung lẻ sẽ throw.
 * - yuv420Mad: MAD trên toàn bộ mẫu Y+U+V (mẫu số 1,5*W*H) kèm
 *   MAD từng plane và tỉ lệ mẫu lệch <= 8. Thang V6 (MAD <= 2 và
 *   >= 99% <= 8 = KHỚP) được định nghĩa cho MAD RGB; khi áp cho số
 *   YUV trong script đo thì chỉ mang tính tham chiếu, phải ghi rõ
 *   như vậy trong output/docs — không tự nâng thang đo thành chuẩn
 *   badge mới.
 *
 * Cách dùng trong harness: require module này rồi gán hàm thật bằng
 * setRadialWeight/setDissolveFrand/setBarsFadeIsBar sau khi transpile
 * module TS (giống hệt cách 3 harness vẫn làm với biến cục bộ trước đây).
 *
 * Đợt 19 G6: thêm mode đo miền YUV qua FFmpeg (KHÔNG qua hàm JS
 * rgbToYuv420) + hợp nhất raster text (xem cuối file):
 * - yuv420PaddedDims / ffmpegRgbToYuv420 / ffmpegYuvToRgb420 /
 *   ffmpegYuvCompare / classifyYuvRef / formatYuvMad: chuyển đổi RGB
 *   <-> yuv420p bằng ĐÚNG bộ chuyển swscale của FFmpeg (lệnh
 *   rawvideo), để V11/V12/V14 chạy cùng một mode đo YUV và cho cùng
 *   kết luận. Khung lẻ (vd 72x45 của V11/V12/V14) được pad đen về
 *   chẵn ở mép phải/dưới TRƯỚC khi chuyển — cả 2 phía pad giống
 *   nhau nên so sánh vẫn apples-to-apples, chỉ loãng MAD một chút
 *   (72x45 -> 72x46: thêm 108/4968 = 2,2% mẫu giống hệt nhau).
 *   Thang V6 gốc định nghĩa cho MAD RGB; classifyYuvRef chỉ mang
 *   tính tham chiếu, phải ghi rõ như vậy trong output/docs.
 * - sampleBilinear / rasterizeTextPreview: dời nguyên văn từ V11/V12
 *   (đã đối chiếu: 2 bản giống hệt nhau từng ký tự trong thân hàm,
 *   xem docs/PHASE9_ROUND19_G6_HARNESS_YUV_LIMITS.md §5). V11/V12 nay
 *   chỉ require, không còn bản sao riêng.
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

let dissolveFrandFn = null;
let radialWeightFn = null;
let barsFadeIsBarFn = null;

/** Gán hàm frand thật (ffmpegDissolveFrand từ dissolveFrand.ts). */
function setDissolveFrand(fn) {
  dissolveFrandFn = typeof fn === "function" ? fn : null;
}

/** Gán hàm trọng số thật (radialGradientWeight từ transitionPreview.ts). */
function setRadialWeight(fn) {
  radialWeightFn = typeof fn === "function" ? fn : null;
}

/** Gán hàm bars-fade thật (barsFadePixelIsBar từ transitionPreview.ts). */
function setBarsFadeIsBar(fn) {
  barsFadeIsBarFn = typeof fn === "function" ? fn : null;
}

/**
 * Đợt 16 H1: dải bars-fade có chứa pixel X không — mod(X, bandW) <
 * p*bandW tại CHỈ SỐ nguyên X, đúng expr render. Fallback nội bộ là
 * cùng công thức, chỉ dùng khi module cũ chưa có hàm thật.
 */
function barsFadeIsBar(x, bandW, p) {
  if (barsFadeIsBarFn) return barsFadeIsBarFn(x, bandW, p);
  if (!(bandW > 0) || !(p > 0)) return false;
  const m = ((x % bandW) + bandW) % bandW;
  return m < p * bandW;
}

/**
 * Trọng số smoothstep của vùng radial-gradient.
 * Ưu tiên hàm THẬT từ module transitionPreview; fallback là công thức
 * smoothstep (đợt 13 dùng cosin — sai có hệ thống ~0,01 trọng số, đã bỏ).
 */
function radialWeight(mid, rho) {
  if (radialWeightFn) return radialWeightFn(mid, rho);
  const g = Math.min(1, Math.max(0, rho - mid + 0.5));
  return 1 - (3 * g * g - 2 * g * g * g);
}

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function regionCovers(region, x, y) {
  if (region === null || region === undefined) return true;
  switch (region.kind) {
    case "rect":
      return x >= region.x && x < region.x + region.w && y >= region.y && y < region.y + region.h;
    case "rects":
      return region.rects.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    case "circle": {
      const dx = x - region.cx;
      const dy = y - region.cy;
      return dx * dx + dy * dy <= region.r * region.r;
    }
    case "circle-inverted": {
      const dx = x - region.cx;
      const dy = y - region.cy;
      return dx * dx + dy * dy > region.r * region.r;
    }
    case "polygon":
      return pointInPolygon(x, y, region.points);
    case "polygon-inverted":
      return !pointInPolygon(x, y, region.points);
    case "radial-gradient":
      // Phủ khắp khung; alpha biến thiên theo bán kính (xem layerPixelAlpha).
      return true;
    case "dissolve-noise": {
      // Đợt 15 T1: mask frand float32 (đợt 14 R2), giống V11/V12/V14.
      // Raster truyền tọa độ tâm pixel (x+0.5) nên floor về chỉ số
      // nguyên: vf_xfade.c đánh giá frand tại x, y nguyên, KHÔNG phải
      // tâm pixel. Chưa load được hàm thì phủ sai có chủ đích (false).
      if (typeof dissolveFrandFn !== "function") return false;
      const fr = dissolveFrandFn(Math.floor(x), Math.floor(y));
      return region.invert ? fr >= region.p : fr < region.p;
    }
    default:
      return false;
  }
}

/**
 * Alpha từng pixel của 1 lớp (đợt 13, cho vùng radial-gradient).
 * Quy ước bán kính (đợt 14 R4): FFmpeg đánh giá expr tại CHỈ SỐ pixel
 * nguyên (x, y) so với tâm CẮT NGUYÊN và rMax của chính region
 * (r.cx/r.cy/r.rMax do describeTransition cung cấp). Vùng thường:
 * alpha đều khi region phủ + nguồn trong khung (giống layerCovers).
 */
function layerPixelAlpha(layer, x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const sx = layer.scaleX === 0 ? NaN : cx + (x + 0.5 - cx - layer.dx) / layer.scaleX;
  const sy = layer.scaleY === 0 ? NaN : cy + (y + 0.5 - cy - layer.dy) / layer.scaleY;
  if (!(sx >= 0 && sx < w && sy >= 0 && sy < h)) return 0;
  const r = layer.region;
  if (r && r.kind === "radial-gradient") {
    const rho = Math.hypot(x - r.cx, y - r.cy) / r.rMax;
    const wgt = radialWeight(r.mid, rho);
    return (r.inverted ? 1 - wgt : wgt) * layer.alpha;
  }
  return regionCovers(r, x + 0.5, y + 0.5) ? layer.alpha : 0;
}

/** Lớp có phủ pixel (tâm px,py) không: region (output) + nguồn trong khung. */
function layerCovers(layer, px, py, w, h) {
  if (!regionCovers(layer.region, px, py)) return false;
  const cx = w / 2;
  const cy = h / 2;
  const sx = layer.scaleX === 0 ? NaN : cx + (px - cx - layer.dx) / layer.scaleX;
  const sy = layer.scaleY === 0 ? NaN : cy + (py - cy - layer.dy) / layer.scaleY;
  return sx >= 0 && sx < w && sy >= 0 && sy < h;
}

/**
 * Composite preview từ TransitionVisual tại p (A đỏ, B xanh) — bản
 * DUY NHẤT sau đợt 17 N1, trích nguyên văn ngữ nghĩa từ V11 (đã đối
 * chiếu từng dòng với V12/V14). Thứ tự nhánh quyết định ngữ nghĩa:
 * 1. radial-gradient: 2 lớp phủ khắp khung, alpha bù nhau (a+b=1) →
 *    crossfade từng pixel, KHÔNG sequential-over.
 * 2. bars-fade: dải → B thuần, nền → A*(1-p)+B*p, đánh giá tại chỉ
 *    số nguyên X; cả 2 lớp full-frame, alpha=1 nên không nhân thêm
 *    alpha từng lớp.
 * 3. Họ fade (không geometric): crossfade (alpha cộng = 1).
 * 4. Geometric: sequential-over A rồi B.
 * Vùng radial đánh giá tại chỉ số nguyên (x, y) qua layerPixelAlpha;
 * vùng thường đánh giá tại tâm pixel (x+0.5, y+0.5) qua layerCovers.
 */
function rasterizeTransitionPreview(visual, w, h) {
  const A = [255, 0, 0];
  const B = [0, 0, 255];
  const buf = Buffer.alloc(w * h * 3);
  const hasRadial =
    (visual.a.region && visual.a.region.kind === "radial-gradient") ||
    (visual.b.region && visual.b.region.kind === "radial-gradient");
  const hasBarsFade =
    (visual.a.region && visual.a.region.kind === "bars-fade") ||
    (visual.b.region && visual.b.region.kind === "bars-fade");
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const i = (y * w + x) * 3;
      let r = 0;
      let g = 0;
      let b = 0;
      if (hasRadial) {
        const ca = layerPixelAlpha(visual.a, x, y, w, h);
        const cb = layerPixelAlpha(visual.b, x, y, w, h);
        r = A[0] * ca + B[0] * cb;
        g = A[1] * ca + B[1] * cb;
        b = A[2] * ca + B[2] * cb;
      } else if (hasBarsFade) {
        const reg = visual.a.region && visual.a.region.kind === "bars-fade"
          ? visual.a.region : visual.b.region;
        if (barsFadeIsBar(x, reg.bandW, reg.p)) {
          r = B[0]; g = B[1]; b = B[2];
        } else {
          r = A[0] * (1 - reg.p) + B[0] * reg.p;
          g = A[1] * (1 - reg.p) + B[1] * reg.p;
          b = A[2] * (1 - reg.p) + B[2] * reg.p;
        }
      } else if (!visual.geometric) {
        // Họ fade: crossfade (alpha cộng = 1).
        const ca = layerCovers(visual.a, px, py, w, h) ? visual.a.alpha : 0;
        const cb = layerCovers(visual.b, px, py, w, h) ? visual.b.alpha : 0;
        r = A[0] * ca + B[0] * cb;
        g = A[1] * ca + B[1] * cb;
        b = A[2] * ca + B[2] * cb;
      } else {
        if (layerCovers(visual.a, px, py, w, h)) {
          r = A[0] * visual.a.alpha + r * (1 - visual.a.alpha);
          g = A[1] * visual.a.alpha + g * (1 - visual.a.alpha);
          b = A[2] * visual.a.alpha + b * (1 - visual.a.alpha);
        }
        if (layerCovers(visual.b, px, py, w, h)) {
          r = B[0] * visual.b.alpha + r * (1 - visual.b.alpha);
          g = B[1] * visual.b.alpha + g * (1 - visual.b.alpha);
          b = B[2] * visual.b.alpha + b * (1 - visual.b.alpha);
        }
      }
      buf[i] = Math.round(r);
      buf[i + 1] = Math.round(g);
      buf[i + 2] = Math.round(b);
    }
  }
  return buf;
}

/**
 * Đợt 18: RGB24 -> yuv420p raw (Buffer nối tiếp Y, U, V).
 * Ma trận BT.601 limited-range:
 *   Y = 16 + (0.299R + 0.587G + 0.114B) * 219/255
 *   U = 128 + ((B - Ylin) / (2 * (1 - 0.114))) * 224/255
 *   V = 128 + ((R - Ylin) / (2 * (1 - 0.299))) * 224/255
 * với Ylin là độ sáng tuyến tính chưa scale. Chroma subsample 4:2:0
 * bằng trung bình hộp 2x2 (chroma_location left của nguồn đo không
 * làm đổi trung bình hộp; swscale lọc khác nên còn dư nhỏ, xem
 * header). Mọi giá trị làm tròn tới nguyên gần nhất rồi kẹp 0..255.
 */
function rgbToYuv420(rgb, w, h) {
  if (w % 2 !== 0 || h % 2 !== 0) {
    throw new Error(`rgbToYuv420 cần khung chẵn, nhận ${w}x${h}`);
  }
  if (!Buffer.isBuffer(rgb) || rgb.length !== w * h * 3) {
    throw new Error(`rgbToYuv420 cần Buffer rgb24 dài ${w * h * 3}, nhận ${rgb ? rgb.length : rgb}`);
  }
  const yPlane = Buffer.alloc(w * h);
  const uvW = w / 2;
  const uvH = h / 2;
  const uSum = new Float32Array(uvW * uvH);
  const vSum = new Float32Array(uvW * uvH);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const r = rgb[i];
      const g = rgb[i + 1];
      const b = rgb[i + 2];
      const yLin = 0.299 * r + 0.587 * g + 0.114 * b;
      yPlane[y * w + x] = Math.max(0, Math.min(255, Math.round(16 + (yLin * 219) / 255)));
      const u = ((b - yLin) / (2 * (1 - 0.114))) * 224 / 255;
      const v = ((r - yLin) / (2 * (1 - 0.299))) * 224 / 255;
      const k = (y >> 1) * uvW + (x >> 1);
      uSum[k] += u;
      vSum[k] += v;
    }
  }
  const uPlane = Buffer.alloc(uvW * uvH);
  const vPlane = Buffer.alloc(uvW * uvH);
  for (let k = 0; k < uvW * uvH; k++) {
    uPlane[k] = Math.max(0, Math.min(255, Math.round(128 + uSum[k] / 4)));
    vPlane[k] = Math.max(0, Math.min(255, Math.round(128 + vSum[k] / 4)));
  }
  return Buffer.concat([yPlane, uPlane, vPlane]);
}

/**
 * Đợt 18: MAD trong miền yuv420p giữa 2 Buffer layout Y, U, V nối
 * tiếp (đúng layout rawvideo yuv420p). Trả về MAD tổng trên toàn bộ
 * mẫu (mẫu số 1,5*W*H), MAD từng plane, và tỉ lệ mẫu lệch <= 8.
 */
function yuv420Mad(a, b, w, h) {
  const yN = w * h;
  const uvN = (w / 2) * (h / 2);
  const total = yN + 2 * uvN;
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b) || a.length !== total || b.length !== total) {
    throw new Error(`yuv420Mad cần 2 Buffer yuv420p dài ${total} cho ${w}x${h}`);
  }
  let sumY = 0;
  let sumU = 0;
  let sumV = 0;
  let le8 = 0;
  for (let k = 0; k < yN; k++) {
    const d = Math.abs(a[k] - b[k]);
    sumY += d;
    if (d <= 8) le8++;
  }
  for (let k = 0; k < uvN; k++) {
    const du = Math.abs(a[yN + k] - b[yN + k]);
    const dv = Math.abs(a[yN + uvN + k] - b[yN + uvN + k]);
    sumU += du;
    sumV += dv;
    if (du <= 8) le8++;
    if (dv <= 8) le8++;
  }
  const mad = (sumY + sumU + sumV) / total;
  return { mad, madY: sumY / yN, madU: sumU / uvN, madV: sumV / uvN, le8: le8 / total, samples: total };
}

/**
 * Đợt 19 G6: raster preview text từ textClipVisual — bản DUY NHẤT sau
 * khi dời từ V11/V12 (2 bản cũ giống hệt nhau, xem header). Đúng thứ
 * tự preview.tsx: clipRect → translate(cx,cy) → rotate → shear; đảo
 * ngược: trừ tâm → xoay -θ → bỏ shear → cộng tâm nền. Phụ thuộc
 * sampleBilinear dưới đây (cũng dời nguyên văn từ V11/V12).
 */
function sampleBilinear(buf, w, h, fx, fy) {
  if (fx < 0 || fy < 0 || fx > w - 1 || fy > h - 1) return [0, 0, 0];
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const out = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const v00 = buf[(y0 * w + x0) * 3 + c];
    const v10 = buf[(y0 * w + x1) * 3 + c];
    const v01 = buf[(y1 * w + x0) * 3 + c];
    const v11 = buf[(y1 * w + x1) * 3 + c];
    out[c] = v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty;
  }
  return out;
}

function rasterizeTextPreview(vis, base, baseCx, baseCy, w, h) {
  const theta = ((vis.rotationDeg || 0) * Math.PI) / 180;
  const tanPhi = Math.tan(((vis.skewXDeg || 0) * Math.PI) / 180);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const alpha = vis.alpha ?? 1;
  const clip = vis.clipRect || null;
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      if (clip && !(x + 0.5 >= clip.x && x + 0.5 < clip.x + clip.w && y + 0.5 >= clip.y && y + 0.5 < clip.y + clip.h)) {
        continue; // ngoài clipRect → đen
      }
      // Đảo translate + rotate + shear (forward: shear → rotate → translate).
      let dx = x + 0.5 - vis.cx;
      let dy = y + 0.5 - vis.cy;
      const rx = dx * cos + dy * sin;
      const ry = -dx * sin + dy * cos;
      const sx = rx - tanPhi * ry;
      const sy = ry;
      const [r, g, b] = sampleBilinear(base, w, h, baseCx + sx, baseCy + sy);
      buf[i] = Math.round(r * alpha);
      buf[i + 1] = Math.round(g * alpha);
      buf[i + 2] = Math.round(b * alpha);
    }
  }
  return buf;
}

/**
 * Đợt 19 G6: kích thước chẵn tương ứng của khung (w, h) cho yuv420p.
 * Khung lẻ được pad 1 pixel ở mép phải/dưới (xem ffmpegRgbToYuv420).
 */
function yuv420PaddedDims(w, h) {
  return { w: w + (w % 2), h: h + (h % 2) };
}

/**
 * Đợt 19 G6: chạy 1 lệnh FFmpeg (throw khi exit khác 0, kèm stderr
 * rút gọn). Dùng chung cho các helper chuyển đổi dưới đây; workDir
 * là thư mục tạm do caller sở hữu (harness tự dọn như thường lệ).
 */
function runFfmpegShared(args, label) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`${label}: ffmpeg exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
  }
}

/**
 * Đợt 19 G6: RGB24 -> yuv420p raw BẰNG FFmpeg (swscale), KHÔNG qua
 * hàm JS rgbToYuv420. Đây là mode đo (b) của đợt 18 nhưng nay nằm ở
 * module dùng chung để V11/V12/V14 và script v19 dùng cùng một code:
 * - Khung lẻ được pad đen về chẵn bằng filter pad TRƯỚC format
 *   (pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0:black); khung chẵn thì pad là
 *   no-op. Cả 2 phía so sánh đều qua cùng đường này nên pad không
 *   làm lệch kết luận, chỉ loãng MAD (xem header).
 * - Trả về { yuv, w, h } với w/h là kích thước ĐÃ pad; caller phải
 *   dùng đúng w/h này khi gọi yuv420Mad.
 */
function ffmpegRgbToYuv420(rgb, w, h, workDir, tag) {
  if (!Buffer.isBuffer(rgb) || rgb.length !== w * h * 3) {
    throw new Error(`ffmpegRgbToYuv420 cần Buffer rgb24 dài ${w * h * 3}, nhận ${rgb ? rgb.length : rgb}`);
  }
  const { w: pw, h: ph } = yuv420PaddedDims(w, h);
  const rawIn = path.join(workDir, `${tag}-rgb-in.raw`);
  const out = path.join(workDir, `${tag}.yuv`);
  fs.writeFileSync(rawIn, rgb);
  try {
    runFfmpegShared(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", rawIn,
      "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0:black,format=yuv420p",
      "-f", "rawvideo", "-y", out], `ffmpegRgbToYuv420 ${tag}`);
    const yuv = fs.readFileSync(out);
    return { yuv, w: pw, h: ph };
  } finally {
    try { fs.unlinkSync(rawIn); } catch { /* bỏ qua */ }
    try { fs.unlinkSync(out); } catch { /* bỏ qua */ }
  }
}

/**
 * Đợt 19 G6: yuv420p raw -> RGB24 BẰNG FFmpeg (chiều ngược của hàm
 * trên, phục vụ kiểm tra subsample-only kiểu S2 của đợt 18). w/h
 * phải là kích thước ĐÃ pad (đúng layout của Buffer yuv đầu vào).
 * Trả về Buffer rgb24 dài w*h*3.
 */
function ffmpegYuvToRgb420(yuv, w, h, workDir, tag) {
  const total = Math.floor(w * h * 1.5);
  if (!Buffer.isBuffer(yuv) || yuv.length !== total) {
    throw new Error(`ffmpegYuvToRgb420 cần Buffer yuv420p dài ${total} cho ${w}x${h}, nhận ${yuv ? yuv.length : yuv}`);
  }
  const yuvIn = path.join(workDir, `${tag}-yuv-in.yuv`);
  const out = path.join(workDir, `${tag}-rgb-out.raw`);
  fs.writeFileSync(yuvIn, yuv);
  try {
    runFfmpegShared(["-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-i", yuvIn,
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out], `ffmpegYuvToRgb420 ${tag}`);
    return fs.readFileSync(out);
  } finally {
    try { fs.unlinkSync(yuvIn); } catch { /* bỏ qua */ }
    try { fs.unlinkSync(out); } catch { /* bỏ qua */ }
  }
}

/**
 * Đợt 19 G6: so 2 frame RGB trong miền YUV — cả 2 phía đều qua CÙNG
 * bộ chuyển FFmpeg (kiểu S5b của đợt 18). Trả về đúng object của
 * yuv420Mad ({ mad, madY, madU, madV, le8, samples }); caller phân
 * loại bằng classifyYuvRef và in bằng formatYuvMad.
 */
function ffmpegYuvCompare(previewRgb, renderRgb, w, h, workDir, tag) {
  const a = ffmpegRgbToYuv420(previewRgb, w, h, workDir, `${tag}-prev`);
  const b = ffmpegRgbToYuv420(renderRgb, w, h, workDir, `${tag}-rend`);
  return yuv420Mad(a.yuv, b.yuv, a.w, a.h);
}

/**
 * Đợt 19 G6: phân loại V6 áp cho số MAD miền YUV — CHỈ mang tính
 * tham chiếu (thang V6 gốc định nghĩa cho MAD RGB). Không phải
 * chuẩn badge mới; mọi output dùng nó phải ghi rõ "V6-tham-chiếu".
 */
function classifyYuvRef(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le8 >= 0.90) return "XẤP XỈ";
  return "LỆCH";
}

/** Đợt 19 G6: chuỗi in MAD miền YUV, cùng dạng với fmtYUV của v18. */
function formatYuvMad(m) {
  return `MAD-YUV=${m.mad.toFixed(4)} (Y=${m.madY.toFixed(4)} U=${m.madU.toFixed(4)} V=${m.madV.toFixed(4)}) <=8: ${(m.le8 * 100).toFixed(2)}% | V6-tham-chiếu=${classifyYuvRef(m)}`;
}

module.exports = {
  setDissolveFrand,
  setRadialWeight,
  setBarsFadeIsBar,
  barsFadeIsBar,
  radialWeight,
  pointInPolygon,
  regionCovers,
  layerPixelAlpha,
  layerCovers,
  rasterizeTransitionPreview,
  sampleBilinear,
  rasterizeTextPreview,
  rgbToYuv420,
  yuv420Mad,
  yuv420PaddedDims,
  ffmpegRgbToYuv420,
  ffmpegYuvToRgb420,
  ffmpegYuvCompare,
  classifyYuvRef,
  formatYuvMad,
};
