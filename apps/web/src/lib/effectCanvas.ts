// effectCanvas.ts — Vẽ thật 8 video effect lên ImageData bằng pixel shader
// thuần (không DOM, không canvas API) để preview canvas dùng được.
// V2 (Phase 9 đợt 10): trước đây previewEngine.effectsVisual() bỏ qua 8 type
// này vì không có CSS filter tương đương; nay chúng được vẽ thật ở bước
// effects của preview.tsx (sau chroma/LUT, trước mask/SR/opacity).
//
// Mirror công thức intensity trong server/render/src/effects.js:
//   sharpen: unsharp amount 0.2 + t*1.8, luma-only (chroma amount = 0),
//     kernel 5×5. Ở đây: độ sáng Y bt709 qua Gaussian tách được
//     [1,4,6,4,1]/16, delta Y cộng vào plane Y (không cộng thẳng vào
//     R,G,B — đợt 65 S7: render unsharp chạy trên plane Y yuv420p nên áp
//     delta trong không gian YUV mới đúng kẹp gamut; áp RGB cũ lệch ở
//     biên màu bão hoà, delta std B 5.07 so với render 4.34 ở full-res).
//     Luma tính bằng bt709 (0.2126/0.7152/0.0722), KHÔNG phải bt601
//     (đợt 65 S7: step-edge profile của render khớp delta tính từ Y
//     bt709; bản bt601 cũ cho MAD 0.29/0.50, bản bt709 cho 0.19/0.26 ở
//     full-res pre-encode). Delta tính từ Y native ƯỚC LƯỢNG (Y_est,
//     xem estimateNativeY) thay vì Y derived — Y native lệch Y derived
//     tới ~+10-17 ở vùng bão hoà. Kernel nhị thức đã xác nhận bằng
//     step-edge profile trực tiếp (render [-8,-38,37,7] vs nhị thức
//     [-7.6,-37.8,37.8,7.6]; Gaussian σ=1.0 lệch rõ [-6.6,-36.1,36.1,
//     6.6]). Đợt 66 T4 (HYB4): hybrid theo kênh — kênh kẹp (base ước
//     lượng vượt gamut > 4) convert trực tiếp từ (Y_est + ΔY, est
//     chroma k sharpen riêng 1.04/1.09), kênh trong gamut cộng delta
//     vào plain RGB như S7 — lần đầu KHỚP render full-res pre-encode
//     testsrc2 cả 2 mức (le8 99,8–99,9%) và KHỚP cả 3 cảnh tự nhiên
//     (le8 100%; xem LIMITS đợt 66 T4).
//     Đợt 14 R6: KHỚP render, MAD 0.40–0.61, ≤8 = 99.5–100%
//     trên pattern + tự nhiên (bản box-blur 3×3 RGB cũ lệch tới MAD
//     4.96). Vẫn XẤP XỈ ở viewport testsrc2 bản S7 cũ (le8 98.1–
//     98.3% ở full-res pre-encode, 98.6% tốt nhất ở viewport CRF 0 —
//     xem LIMITS đợt 65 S7); bản S8r mới chưa đo headed (xem LIMITS
//     đợt 66 T4).
//   noise: strength 5 + t*45 — nhiễu Gauss TRONG KHÔNG GIAN YUV
//     (đợt 63 R8): render áp `noise=alls:allf=t` lên từng plane yuv420p
//     (Y đủ phân giải, U/V nửa phân giải, nearest 2×2 khi lên RGB — đo
//     thật bằng xung chroma, xem LIMITS đợt 63 R8), nên preview cũ cộng
//     nhiễu độc lập từng kênh RGB cho sai tỉ lệ std kênh ([1,1,1] thay vì
//     [2.14,1.30,2.41]×σ) và corr ≈ 0 thay vì [0.15,0.26,0.30].
//     Đợt 65 S7 — mô phỏng chiếu gamut của YUV native: base YUV native
//     của nguồn bão hoà nằm NGOÀI khối RGB (31% mẫu U/V chạm rails
//     16/240, base qua RGB-roundtrip có 0% — đo đợt 64 R9), nên nhiễu
//     cộng vào base native bị phép convert YUV→RGB chiếu bỏ phần hướng
//     ra ngoài gamut; cộng nhiễu vào base derived (đã bị kéo vào trong
//     gamut) thì nhiễu "còn chỗ" để hiện ra → std R/B thừa 34%/17%.
//     Vì vậy addYuvNoise cộng nhiễu vào base chroma NATIVE ƯỚC LƯỢNG
//     (estimateNativeChroma: giãn tuyến tính khỏi 128, kCb=1.04,
//     kCr=1.12 — hiệu chuẩn trên frame 30 testsrc2, band KHỚP kV
//     1.11–1.14, kiểm chứng trên desat/smptebars) rồi mới convert về
//     RGB (kẹp Uint8ClampedArray thực hiện chiếu gamut). Y giữ base
//     derived (Y native ≈ Y derived, 0% chạm rail; dùng Y_est cho noise
//     làm kurt R tệ đi 1.06–1.25 — đo đợt 65 S7, đã loại). Kết quả
//     pre-encode full-res: noise05+noise10 KHỚP-THỐNG-KÊ (tỉ lệ std
//     1.01–1.05, Δkurt ≤0.34, Δcorr ≤0.06, 4 seed; delta mean lệch
//     ≤1.1 mức so với render).
//   rgb-shift: rh = +(2 + t*14)px, bh = -(2 + t*14)px, CẮT phần thập phân
//     (trunc, không làm tròn) và điền vùng trống bằng NHÂN BIÊN
//     (edge replication) — đo trực tiếp đợt 16 H5: render(8.5) == render(8),
//     và vùng trống của render đúng bằng nhân biên (0 byte lệch), trong
//     khi điền 0 cũ lệch 810 byte trên tự nhiên 72×45, s=9.
//   glitch: render = rgb-shift (s = 6 + t*10) + noise thời gian
//     (alls = round(10 + t*20)); ở đây làm đúng 2 phần đó với seed xác
//     định (đợt 14 R6 thay mô hình slice ngang cũ — slice không có trong
//     render, MAD 30.11/37.08 → 18.58/22.26 trên pattern/tự nhiên; đợt 16
//     H5 sửa thêm trunc + nhân biên + nhiễu Gauss cho phần noise).
//   shake: render crop x = 12+12*sin(2πt*9), y = 12+12*cos(2πt*7) rồi pad
//     → KHÔNG phải dịch tịnh tiến cả khung: chỉ cửa sổ crop (w-24)×(h-24)
//     được giữ lại, đặt tại (12,12), viền đen 12px bốn phía (xem applyShake).
//   pixelate: k = 2 + round(t*14) (2..16), lấy mẫu tại TÂM khối
//     (bx + floor(k/2), by + floor(k/2)) — điểm lấy mẫu thật của scale
//     flags=neighbor của render, đo bằng frame mã hoá toạ độ (đợt 11 P2:
//     k=2→1, k=6→3, k=9→4, k=16→8). Trước đây lấy góc trái-trên nên lệch
//     MAD 26.75 trên nguồn pattern; nay MAD 0.67 (xem LIMITS đợt 11 P2).
//   mirror: hflip nhị phân, không phụ thuộc intensity
//   edgedetect: ngưỡng low = 0.1 + t*0.2, high = 0.3 + t*0.3 (tỉ lệ /255);
//     ở đây dùng Gaussian σ=1.4 (bán kính 2) → Sobel → NMS NGHIÊM 2 phía
//     → hysteresis, ngưỡng áp trên độ lớn Sobel THÔ và giữ lại độ lớn
//     thô (kẹp 255) cho pixel qua hysteresis. Gray đầu vào là gray
//     nguyên của swscale (hệ số BT.601 nguyên 19595/38470/7471, làm
//     tròn +32768 >> 16 — đúng chuyển đổi rgb24→gray mà FFmpeg tự chèn
//     trước edgedetect, đo bằng log -v verbose), ảnh blur và độ lớn
//     làm tròn về nguyên sau mỗi pass (mô phỏng pipeline uint8 của
//     render). Đợt 17 N4 thay kernel nhị thức [1,4,6,4,1]/16 của đợt 16
//     H5 bằng Gaussian σ=1.4 thật: tổng MAD trên 6 ô chuẩn (step/tự
//     nhiên/pattern × 72×45/144×90, t=0.5) 10.11 → 8.48, và trên 24 ô
//     kiểm chứng độc lập (nguồn tự nhiên mới + pattern + step,
//     t=0/0.25/0.5/1) 97.95 → 47.99; pattern 72×45 nay MAD 0.985 (đạt vế
//     MAD của ngưỡng KHỚP nhưng ≤8 chỉ 98.9% < 99% nên vẫn chưa KHỚP
//     — xem LIMITS đợt 17 N4). Vẫn XẤP XỈ:
//     tự nhiên gốc 72×45 tệ đi 2.13 → 3.81 (magnitudes trên biên mỏng
//     bị blur rộng làm loãng, không phải lỗi kept-set: missed/false
//     gần như không đổi) và pattern 144×90 vẫn 2.12/98.4% — badge giữ
//     approx, KHÔNG nâng.
//
// Mọi hàm đều thuần: nhận ImageDataLike, sửa tại chỗ (in-place) và trả về
// chính object đó; caller muốn giữ gốc thì tự sao chép trước. Alpha không
// bị động vào bởi bất kỳ effect nào (trừ shake/pixelate không động alpha).
// Vùng ngoài biên: sharpen/edgedetect dùng clamp-to-edge; rgb-shift/
// glitch NHÂN BIÊN (đo thật đợt 16 H5, không phải điền 0); shake điền 0
// (đen, đúng pad color=black của render).

/** Dữ liệu pixel tối thiểu — ImageData thật thỏa mãn structurally. */
export interface ImageDataLike {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export type CanvasEffectType =
  | "sharpen"
  | "noise"
  | "glitch"
  | "rgb-shift"
  | "shake"
  | "pixelate"
  | "mirror"
  | "edgedetect";

export const CANVAS_EFFECT_TYPES: readonly CanvasEffectType[] = [
  "sharpen",
  "noise",
  "glitch",
  "rgb-shift",
  "shake",
  "pixelate",
  "mirror",
  "edgedetect",
];

export function isCanvasEffectType(t: string): t is CanvasEffectType {
  return (CANVAS_EFFECT_TYPES as readonly string[]).includes(t);
}

/**
 * Một thao tác effect đã giải quyết xong tham số thời gian/seed.
 * intensity: 0..1 (clamp). seed: chỉ dùng cho noise/glitch. dx/dy: chỉ
 * dùng cho shake (pixel nguyên, đã làm tròn bởi canvasEffectOps).
 */
export interface CanvasEffectOp {
  type: CanvasEffectType;
  intensity: number;
  seed?: number;
  dx?: number;
  dy?: number;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** PRNG xác định, nhanh, đủ tốt cho nhiễu/glitch (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Từng effect (hàm thuần, in-place)
// ---------------------------------------------------------------------------

/** Lật ngang toàn khung hình (hflip). */
export function applyMirror(img: ImageDataLike): ImageDataLike {
  const { width: w, height: h, data: d } = img;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < (w >> 1); x++) {
      const a = (y * w + x) * 4;
      const b = (y * w + (w - 1 - x)) * 4;
      for (let c = 0; c < 4; c++) {
        const tmp = d[a + c];
        d[a + c] = d[b + c];
        d[b + c] = tmp;
      }
    }
  }
  return img;
}

/**
 * Pixelate: mỗi khối k×k lấy màu pixel TÂM khối rồi tô đầy khối.
 * Tâm khối = (bx + floor(k/2), by + floor(k/2)) — đây là điểm lấy mẫu
 * thật của FFmpeg scale flags=neighbor khi thu nhỏ (đo bằng frame mã
 * hoá toạ độ R=x, G=y: downscale cho đúng offset này với mọi k đã thử
 * 2/6/9/16; góc trái-trên cũ lệch MAD 26.75 trên nguồn pattern).
 * Khối ở rìa phải/dưới có thể nhỏ hơn k: điểm lấy mẫu clamp vào trong
 * khối (xấp xỉ — render thật CO khung khi kích thước không chia hết
 * cho k, vd 64×48, k=9 → 63×45, còn preview giữ nguyên kích thước).
 */
export function applyPixelate(img: ImageDataLike, intensity: number): ImageDataLike {
  const t = clamp01(intensity);
  const k = 2 + Math.round(t * 14);
  const { width: w, height: h, data: d } = img;
  if (k <= 1) return img;
  const ox = Math.floor(k / 2);
  const oy = Math.floor(k / 2);
  for (let by = 0; by < h; by += k) {
    for (let bx = 0; bx < w; bx += k) {
      const bw = Math.min(k, w - bx);
      const bh = Math.min(k, h - by);
      const s = ((by + Math.min(oy, bh - 1)) * w + (bx + Math.min(ox, bw - 1))) * 4;
      const r = d[s];
      const g = d[s + 1];
      const b = d[s + 2];
      const a = d[s + 3];
      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          const p = (y * w + x) * 4;
          d[p] = r;
          d[p + 1] = g;
          d[p + 2] = b;
          d[p + 3] = a;
        }
      }
    }
  }
  return img;
}

/**
 * Sharpen (unsharp, luma-only như render `unsharp=5:5:amount:5:5:0`):
 * delta tính từ luma bt709 (Y của render là plane Y bt709, không phải
 * luma bt601 — xem step-edge profile đợt 65 S7) qua Gaussian tách được
 * [1,4,6,4,1]/16, rồi áp theo HYBRID từng kênh (đợt 66 T4): kênh nào
 * base ước lượng R0_est vượt gamut > 4 mức thì convert trực tiếp từ
 * (Y_est + ΔY, est chroma) — vì render cộng delta vào base native chưa
 * kẹp, còn cộng vào plain RGB đã kẹp lệch đúng bằng độ vượt gamut;
 * kênh trong gamut thì cộng delta vào plain RGB như S7 (base plain
 * chính xác, direct mang sai số chroma-est). Delta tính từ Y native
 * ước lượng (estimateNativeY) thay vì Y derived: Y native lệch Y
 * derived tới ~+10-17 ở vùng bão hoà (đo frame 30 testsrc2). Chroma
 * est dùng hằng số sharpen riêng (kCb = 1.04, kCr = 1.09 — hồi quy
 * native-vs-derived, khác hằng số noise 1.04/1.12). Đo full-res
 * pre-encode (probe2b/2c đợt 66 T4): testsrc2 KHỚP cả 2 mức
 * (sharp05 MAD 0,074/le8 99,9%; sharp10 MAD 0,103/le8 99,8%), 3 cảnh
 * tự nhiên KHỚP hết (le8 100%) — lần đầu sharpen KHỚP render trên mọi
 * cảnh đo. Biên clamp-to-edge. Alpha giữ nguyên.
 */
export function applySharpen(img: ImageDataLike, intensity: number): ImageDataLike {
  const amount = 0.2 + clamp01(intensity) * 1.8;
  const { width: w, height: h, data: d } = img;
  const lum = new Float64Array(w * h); // luma bt709 0..255 (derived)
  const lumY = new Float64Array(w * h); // Y limited-range 16..235
  const CB = new Float64Array(w * h);
  const CR = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = d[i * 4];
    const g = d[i * 4 + 1];
    const b = d[i * 4 + 2];
    lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lumY[i] = 16 + (219 * lum[i]) / 255;
    const [, cb, cr] = rgbToYuv709(r, g, b);
    CB[i] = cb;
    CR[i] = cr;
  }
  const cw = (w + 1) >> 1;
  const ch = (h + 1) >> 1;
  const estCb = new Float64Array(cw * ch);
  const estCr = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      let sCb = 0;
      let sCr = 0;
      let n = 0;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const x = cx * 2 + dx;
          const y = cy * 2 + dy;
          if (x >= w || y >= h) continue;
          const i = y * w + x;
          sCb += CB[i];
          sCr += CR[i];
          n++;
        }
      }
      const i = cy * cw + cx;
      estCb[i] = estimateNativeChroma(sCb / n, SHARPEN_CHROMA_K_CB);
      estCr[i] = estimateNativeChroma(sCr / n, SHARPEN_CHROMA_K_CR);
    }
  }
  // Y native ước lượng từng pixel (để tính delta như render trên Y
  // native), dùng est chroma của khối chứa pixel đó.
  const lumEst = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const ci = (y >> 1) * cw + (x >> 1);
      lumEst[i] = estimateNativeY(lumY[i], estCb[ci], estCr[ci]);
    }
  }
  const K = [1, 4, 6, 4, 1];
  const at = (x: number, y: number, arr: Float64Array): number => {
    const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
    const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
    return arr[cy * w + cx];
  };
  const tmp = new Float64Array(w * h);
  const blur = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let dx = -2; dx <= 2; dx++) s += K[dx + 2] * at(x + dx, y, lumEst);
      tmp[y * w + x] = s / 16;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let dy = -2; dy <= 2; dy++) s += K[dy + 2] * at(x, y + dy, tmp);
      blur[y * w + x] = s / 16;
    }
  }
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    const ci = (((i / w) | 0) >> 1) * cw + ((i % w) >> 1);
    const deltaY = amount * (lumEst[i] - blur[i]);
    // Đợt 66 T4 (HYB4): hybrid theo từng kênh. Base tốt nhất của render
    // là R0 (YUV native chưa kẹp); ta có 2 ước lượng của nó: plain
    // (chính xác tuyệt đối khi trong gamut, sai khi kẹp) và R0_est =
    // YUV2RGB(Y_est, estCb, estCr) (sai ~±5 do sai số chroma-est, nhưng
    // không kẹp). Với mỗi kênh:
    //   - excess_est = |R0_est − biên| > 4 → kênh kẹp: dùng direct
    //     out = clip(R0_est + ΔY_direct); delta-add ở đây lệch đúng
    //     bằng độ vượt gamut (tới ~20 mức).
    //   - ngược lại → dùng delta-add out = clip(plain + ΔY_add) như
    //     S7: base plain chính xác, direct mang sai số chroma-est.
    // Ngưỡng 4 ≈ sai số base của direct (probe2c: HYB4 tốt hơn HYB0
    // cả testsrc2 lẫn ocean; ocean HYB0 le8 99,4% → HYB4 100%).
    // Đo full-res pre-encode (probe2b/2c): testsrc2 sharp05 MAD 0,074/
    // le8 99,9%, sharp10 0,103/99,8% (S7: 0,182/98,3% và 0,235/97,4%;
    // S8r: 0,355/99,4% và 0,366/99,3%); 3 cảnh tự nhiên KHỚP hết
    // (le8 100%, MAD 0,56–0,87 — bằng hoặc tốt hơn S7). Lần đầu
    // sharpen KHỚP render trên mọi cảnh đo, cả 2 mức.
    const deltaAdd = 1.164383 * (clamp255Byte(lumY[i] + deltaY) - lumY[i]);
    const [r0, g0, b0] = yuv709ToRgb(lumEst[i], estCb[ci], estCr[ci]);
    const deltaDirect = 1.164383 * (clamp255Byte(lumEst[i] + deltaY) - lumEst[i]);
    const r0c = [r0, g0, b0];
    const plainC = [d[p], d[p + 1], d[p + 2]];
    for (let c = 0; c < 3; c++) {
      const excess = r0c[c] > 255 ? r0c[c] - 255 : r0c[c] < 0 ? -r0c[c] : 0;
      d[p + c] = clamp255Byte(excess > 4 ? r0c[c] + deltaDirect : plainC[c] + deltaAdd);
    }
  }
  return img;
}

/**
 * Edge detect (Canny của FFmpeg, xấp xỉ có cấu trúc): Gaussian 5×5 →
 * Sobel → triệt tiêu phi cực đại (NMS) theo hướng gradient → ngưỡng kép
 * + hysteresis. Ngưỡng low/high mirror render (tỉ lệ /255) áp TRỰC TIẾP
 * trên độ lớn Sobel thô: low = (0.1 + t*0.2)*255, high = (0.3 + t*0.3)*255.
 * Pixel qua hysteresis giữ lại độ lớn thô (kẹp 255) — render cũng KHÔNG
 * nhị phân (trên nguồn tự nhiên render có 31 giá trị khác nhau) và giá
 * trị của nó khớp độ lớn thô: trên dốc tuyến tính, render cho ~174 ≈
 * độ lớn Sobel thô (~170), không phải magnitude/4 (~42). Ra ảnh xám
 * (R=G=B), alpha giữ nguyên.
 * Đợt 16 H5 (thay mô hình đợt 14 R6: bỏ thang magnitude/4, thêm blur
 * Gaussian 5×5 trước Sobel, NMS nghiêm cả 2 phía): step MAD 3.86 → 0.31,
 * tự nhiên MAD 8.53 → 2.13 (72×45, t=0.5), vẫn XẤP XỈ vì chưa đạt ngưỡng
 * KHỚP trên tự nhiên/pattern (xem LIMITS đợt 16 H5). NMS nghiêm
 * (m > m1 && m > m2) là điểm quyết định trên step: dải plateau Sobel
 * (2 cột bằng nhau) bị triệt tiêu cả 2 phía — đúng hành vi render (chỉ
 * 4 pixel ở cột 36, hàng 1,2,42,43); tie-break cũ (m >= m1 && m > m2)
 * giữ 1 cột và lệch đúng phần đó. Blur là điểm quyết định trên tự
 * nhiên: quét kernel cho thấy Gaussian 5×5 [1,4,6,4,1]/16 + clamp tốt
 * nhất tổng 6 ô đo (MAD tổng 10.11, so với 11.49 của blur 3×3 và 25.25
 * của mô hình R6); blur zero-pad tệ hơn hẳn (tự nhiên 11.79) nên dùng
 * clamp-to-edge.
 * Đợt 17 N4 (mô hình hiện tại): truy nguyên nợ pattern của H5 cho thấy
 * lệch pattern KHÔNG phải lỗi độ lớn (độ lớn tại biên wrap: render
 * 184, mô hình 182) mà là lỗi kept-set: render chỉ giữ 22 pixel thưa,
 * xen kẽ cột 63/64 trên biên wrap R (x=64) của pattern, còn mô hình
 * giữ 39 pixel dày — dấu vết của lượng tử hoá điểm cố định trong
 * pipeline render (gray nguyên + blur nguyên) tương tác với NMS
 * nghiêm trên biên wrap đơn kênh, một artefact của nguồn tổng hợp
 * (footage tự nhiên không có wrap đơn kênh hoàn hảo). Quét lại kernel
 * với gray nguyên swscale + làm tròn: Gaussian σ=1.4 bán kính 2 tái
 * tạo kept-set wrap gần đúng nhất (45/46 pixel trên 2 probe wrap) và
 * thắng trên 2 nguồn tự nhiên độc lập tạo sau (tổng MAD 24 ô:
 * 97.95 → 47.99), trong khi kernel nhị thức thắng duy nhất trên nguồn
 * tự nhiên gốc (magnitudes biên mỏng). Vì vậy mô hình hiện tại dùng
 * Gaussian σ=1.4 + gray nguyên + làm tròn sau mỗi pass blur và trên
 * độ lớn. Giới hạn còn lại (xem LIMITS đợt 17 N4): tự nhiên gốc 72×45
 * tệ đi 2.13 → 3.81 (magnitudes biên mỏng bị loãng, kept-set gần như
 * không đổi), pattern 144×90 vẫn 2.12, và đáp ứng biên chéo không bão
 * hoà của render (208/196) vẫn cao hơn mọi kernel đã thử (K3 gần nhất:
 * 197/203) — tức pipeline render còn khác biệt cấu trúc ngoài kernel,
 * không nên overfit thêm. Badge giữ approx.
 */
export function applyEdgeDetect(img: ImageDataLike, intensity: number): ImageDataLike {
  const t = clamp01(intensity);
  const low = (0.1 + t * 0.2) * 255;
  const high = (0.3 + t * 0.3) * 255;
  const { width: w, height: h, data: d } = img;
  // Gray nguyên kiểu swscale (đợt 17 N4): FFmpeg tự chèn chuyển đổi
  // rgb24 → gray trước edgedetect (log -v verbose), với hệ số nguyên
  // BT.601 19595/38470/7471, làm tròn +32768 >> 16. Khác float BT.601
  // tối đa 1 mức xám nhưng đủ làm đổi tie-break NMS trên biên wrap.
  const lum0 = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    lum0[i] =
      (19595 * d[i * 4] + 38470 * d[i * 4 + 1] + 7471 * d[i * 4 + 2] + 32768) >> 16;
  }
  // Gaussian σ=1.4, bán kính 2, tách được, biên clamp-to-edge (đợt 17
  // N4, thay [1,4,6,4,1]/16 của đợt 16 H5). Ảnh blur và độ lớn làm tròn
  // về nguyên sau mỗi pass — mô phỏng pipeline uint8 của render; chính
  // lượng tử hoá này (cùng gray nguyên) tạo ra kept-set thưa xen kẽ
  // cột trên biên wrap mà mô hình float không tái tạo được.
  const sigma = 1.4;
  const rawGK: number[] = [];
  let gsum = 0;
  for (let i = -2; i <= 2; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    rawGK.push(v);
    gsum += v;
  }
  const GK = rawGK.map((v) => v / gsum);
  const gat = (x: number, y: number, arr: Float64Array): number => {
    const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
    const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
    return arr[cy * w + cx];
  };
  const gtmp = new Float64Array(w * h);
  const lum = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let dx = -2; dx <= 2; dx++) s += GK[dx + 2] * gat(x + dx, y, lum0);
      gtmp[y * w + x] = Math.round(s);
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let dy = -2; dy <= 2; dy++) s += GK[dy + 2] * gat(x, y + dy, gtmp);
      lum[y * w + x] = Math.round(s);
    }
  }
  const at = (x: number, y: number): number => {
    const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
    const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
    return lum[cy * w + cx];
  };
  const gx = new Float64Array(w * h);
  const gy = new Float64Array(w * h);
  const mag = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gxx =
        -at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1) +
        at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1);
      const gyy =
        -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) +
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
      gx[y * w + x] = gxx;
      gy[y * w + x] = gyy;
      mag[y * w + x] = Math.round(Math.hypot(gxx, gyy));
    }
  }
  // NMS NGHIÊM cả 2 phía (đợt 16 H5): giữ pixel chỉ khi nó > cả 2 phía
  // dọc hướng gradient. Plateau Sobel (2 cột bằng nhau của step hoàn
  // hảo) bị triệt tiêu cả 2 phía — đúng hành vi render; tie-break cũ
  // (>= một phía) giữ 1 cột và lệch đúng phần đó. Ngoài khung → 0.
  const thin = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const m = mag[y * w + x];
      if (m === 0) continue;
      const ang = (Math.atan2(gy[y * w + x], gx[y * w + x]) * 180) / Math.PI;
      const a = ((ang % 180) + 180) % 180;
      let d1x = 0;
      let d1y = 0;
      let d2x = 0;
      let d2y = 0;
      if (a < 22.5 || a >= 157.5) {
        d1x = 1;
        d2x = -1;
      } else if (a < 67.5) {
        d1x = 1;
        d1y = 1;
        d2x = -1;
        d2y = -1;
      } else if (a < 112.5) {
        d1y = 1;
        d2y = -1;
      } else {
        d1x = 1;
        d1y = -1;
        d2x = -1;
        d2y = 1;
      }
      const m1 =
        x + d1x < 0 || x + d1x >= w || y + d1y < 0 || y + d1y >= h
          ? 0
          : mag[(y + d1y) * w + (x + d1x)];
      const m2 =
        x + d2x < 0 || x + d2x >= w || y + d2y < 0 || y + d2y >= h
          ? 0
          : mag[(y + d2y) * w + (x + d2x)];
      if (m > m1 && m > m2) thin[y * w + x] = m;
    }
  }
  // Hysteresis trên độ lớn Sobel thô: strong >= high làm hạt giống,
  // weak >= low chỉ giữ khi nối 8-hướng với hạt giống.
  const strong = new Uint8Array(w * h);
  const weak = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const v = thin[p];
    if (v >= high) strong[p] = 1;
    else if (v >= low) weak[p] = 1;
  }
  const kept = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let p = 0; p < w * h; p++) {
    if (strong[p]) {
      kept[p] = 1;
      stack.push(p);
    }
  }
  while (stack.length) {
    const p = stack.pop()!;
    const px = p % w;
    const py = Math.floor(p / w);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const q = ny * w + nx;
        if (weak[q] && !kept[q]) {
          kept[q] = 1;
          stack.push(q);
        }
      }
    }
  }
  for (let i = 0; i < w * h; i++) {
    const v = kept[i] ? Math.min(255, thin[i]) : 0;
    d[i * 4] = v;
    d[i * 4 + 1] = v;
    d[i * 4 + 2] = v;
  }
  return img;
}

/**
 * Bộ sinh Gauss chuẩn (Box–Muller) trên PRNG cho trước. Mỗi lần gọi
 * applyNoise/applyGlitch tạo một generator mới (spare reset) nên cùng
 * seed cho cùng một ảnh ra. Đợt 16 H5: nhiễu render của FFmpeg có dạng
 * Gauss (kurtosis ≈ 0, vượt ±strength, std = strength/√3), không phải
 * đều (kurtosis −1.2, kẹp đúng ±strength) và không phải nhiễu mặt
 * phẳng YUV (std 24–36 và tương quan kênh 0.19–0.30, đều lệch render).
 * Vì vậy sigma = strength/√3 để giữ đúng std của mô hình đều cũ trong
 * khi khớp dạng phân phối của render.
 */
export function gaussianGenerator(rnd: () => number): () => number {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    let u = 0;
    while (u === 0) u = rnd();
    const v = rnd();
    const m = Math.sqrt(-2 * Math.log(u));
    spare = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  };
}

/**
 * Noise trong không gian YUV (đợt 63 R8) — mirror filter `noise` của
 * FFmpeg trong pipeline render yuv420p thật.
 *
 * Đo thật bằng FFmpeg 8.1.2 (probe /tmp/r63-noise-probe.mjs, phẳng 128,
 * bt709, alls=28/50): nhiễu render là Gauss từng plane, σ_plane ≈
 * 0.97–0.98 × alls/√3 (kurtosis ≈ 0, tương quan giữa các plane ≈ 0),
 * U/V ở nửa phân giải, và khi convert yuv420p→rgb24 swscale lấy mẫu
 * chroma NEAREST theo khối 2×2 (xung U đơn lẻ cho footprint đúng 2×2,
 * biên độ đầy đủ — không phải bilinear). Vì vậy σ = strength/√3 ở đây
 * dùng đúng lý thuyết (lệch std ~2–3% so với render, trong ngưỡng).
 *
 * Hệ quả trong RGB (đo được): std từng kênh ≈ [2.14, 1.30, 2.41]×σ
 * (R = 1.164·Y + 1.793·V, G = 1.164·Y − 0.213·U − 0.534·V,
 * B = 1.164·Y + 2.115·U — hệ số khuếch đại của nhiễu plane), tương
 * quan chéo kênh RG/RB/GB ≈ [0.15, 0.26, 0.30] (nhiễu Y chung cho cả
 * 3 kênh). Mô hình RGB cũ (3 kênh độc lập, std bằng nhau, corr ≈ 0)
 * sai cả 2 dấu hiệu này — đó chính là LỆCH-THỐNG-KÊ đợt 62 R8 đo được.
 *
 * Ma trận BT.709 limited-range (studio swing), khớp swscale của render
 * cho nguồn HD: Y = 16 + 219·Y′, Cb = 128 + 224·Cb, Cr = 128 + 224·Cr
 * với Y′ = 0.2126R + 0.7152G + 0.0722B (0..1). Chuyển đổi float cả 2
 * chiều; roundtrip không nhiễu có MAD < 1 (test). Plane được kẹp
 * 0..255 sau khi cộng nhiễu (av_clip_uint8 của filter) — chính kẹp này
 * làm kurtosis phình ở vùng bão hòa (đợt 62 R8 §3.2), không phải lỗi
 * mô hình; RGB cuối kẹp bởi Uint8ClampedArray.
 *
 * Thứ tự rút RNG xác định (cùng seed → cùng ảnh): nhiễu Cb rồi Cr theo
 * từng mẫu chroma (row-major), rồi nhiễu Y từng pixel (row-major).
 * Chroma: 1 mẫu cho khối 2×2 (cx = x>>1, cy = y>>1); khung lẻ dùng
 * ceil(w/2)×ceil(h/2) mẫu.
 */
function rgbToYuv709(r: number, g: number, b: number): [number, number, number] {
  const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const y = 16 + 219 * yl;
  const cb = 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.0722);
  const cr = 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.2126);
  return [y, cb, cr];
}

function yuv709ToRgb(y: number, cb: number, cr: number): [number, number, number] {
  const yy = 1.164383 * (y - 16);
  const r = yy + 1.79274 * (cr - 128);
  const g = yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128);
  const b = yy + 2.1122 * (cb - 128);
  return [r, g, b];
}

/**
 * Ước lượng base YUV native từ base RGB-derived (đợt 65 S7, mô phỏng
 * chiếu gamut). Base YUV native của nguồn bão hoà nằm ngoài khối RGB:
 * khi decode về RGB, các giá trị ngoài gamut bị kẹp vào mặt khối, rồi
 * convert ngược lại YUV cho ra base "derived" bị kéo vào trong rails
 * (đo frame 30 testsrc2: native có ~31% mẫu U/V chạm rails 16/240,
 * derived có 0%). Hồi quy tuyến tính native ≈ 128 + k·(derived − 128)
 * với kCb ≈ 1.04, kCr ≈ 1.09 (đo trực tiếp); kCr hiệu chuẩn thực nghiệm
 * lên 1.12 vì nó cho KHỚP-THỐNG-KÊ ở cả noise05 lẫn noise10 (band KHỚP
 * kV 1.11–1.14; kV=1.10 lệch kurt R 0.36, kV=1.15 lệch 0.53 — đo
 * probe5). Hệ số này là xấp xỉ theo nội dung (đã kiểm chứng khái quát
 * trên desat 0.3 và smptebars — đều KHỚP), không phải hằng số vật lý.
 * Với màu trong gamut (derived xa rails), giãn chỉ đổi base vài mức và
 * không ảnh hưởng thống kê (kẹp [0,255] hiếm khi chạm).
 */
export const NATIVE_CHROMA_K_CB = 1.04;
export const NATIVE_CHROMA_K_CR = 1.12;

/**
 * Hằng số giãn chroma RIÊNG cho sharpen (đợt 66 T4, S8r): kCb = 1.04,
 * kCr = 1.09 — hồi quy tuyến tính native-vs-derived theo khối 2×2 trên
 * frame 30 testsrc2 (U: a = 1,042/b = −5,86; V: a = 1,092/b = −12,43,
 * probe1). KHÁC hằng số noise (1.04/1.12): noise cần kCr = 1.12 để khớp
 * thống kê chiếu gamut (band KHỚP 1.11–1.14, S7); sharpen convert TRỰC
 * TIẾP từ (Y_est, est chroma) nên cần base chính xác nhất theo hồi quy
 * — kCr = 1.12 làm delta MAD tăng 0,355 → 0,523 trên testsrc2 (probe2).
 * Trên nội dung tự nhiên, hồi quy cho k ≈ 1,00–1,03 và thống kê noise
 * không nhạy với k trong [1,00, 1,15] (probe3, mọi k đều KHỚP y hệt),
 * nên k sharpen 1,09 không gây hại ở đó; sharpen trên 3 cảnh tự nhiên
 * vẫn KHỚP (le8 99,9–100%, probe2/3).
 */
export const SHARPEN_CHROMA_K_CB = 1.04;
export const SHARPEN_CHROMA_K_CR = 1.09;

function estimateNativeChroma(derived: number, k: number): number {
  const e = 128 + k * (derived - 128);
  return e < 16 ? 16 : e > 240 ? 240 : e;
}

function clamp255Byte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * Offset Y (thang 16..235) giữa Y native và Y derived, ước lượng từ
 * độ vượt gamut của RGB tính từ (Y derived, chroma native ước lượng):
 * Y_native − Y_derived ≈ Σ w_c·(RGB_est − clip(RGB_est)) với w là hệ
 * số luma bt709 (0.2126/0.7152/0.0722), đổi thang ×219/255. Dấu đúng cả
 * 2 chiều (R vượt 255 → offset dương; G âm → offset âm). Độ chính xác
 * trên frame 30 testsrc2: mean|Y_est − Y_native| = 1.12 (Y derived
 * chưa sửa: 2.67), signed mean −1.00. Chỉ dùng cho sharpen (tính delta);
 * dùng cho noise làm kurt R tệ đi (đo đợt 65 S7, đã loại).
 */
function nativeLumaOffset(yDerived: number, cbEst: number, crEst: number): number {
  const [r, g, b] = yuv709ToRgb(yDerived, cbEst, crEst);
  let off = 0;
  if (r > 255) off += 0.2126 * (r - 255);
  else if (r < 0) off += 0.2126 * r;
  if (g > 255) off += 0.7152 * (g - 255);
  else if (g < 0) off += 0.7152 * g;
  if (b > 255) off += 0.0722 * (b - 255);
  else if (b < 0) off += 0.0722 * b;
  return off * (219 / 255);
}

function estimateNativeY(yDerived: number, cbEst: number, crEst: number): number {
  const o1 = nativeLumaOffset(yDerived, cbEst, crEst);
  const o2 = nativeLumaOffset(yDerived + o1, cbEst, crEst);
  return yDerived + (o1 + o2) / 2;
}

/** Cộng nhiễu Gauss không gian YUV vào ảnh (in-place). strength = alls. */
export function addYuvNoise(img: ImageDataLike, strength: number, seed: number): ImageDataLike {
  const { width: w, height: h, data: d } = img;
  const sigma = strength / Math.sqrt(3);
  const gauss = gaussianGenerator(mulberry32(seed));
  const cw = (w + 1) >> 1;
  const ch = (h + 1) >> 1;
  // Base YUV từng pixel (derived từ RGB đã decode).
  const Y = new Float64Array(w * h);
  const CB = new Float64Array(w * h);
  const CR = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const [yy, cb, cr] = rgbToYuv709(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
    Y[i] = yy;
    CB[i] = cb;
    CR[i] = cr;
  }
  // Base chroma native ước lượng theo khối 2×2 (mean derived của khối),
  // rồi cộng nhiễu vào base ĐÓ (đợt 65 S7 — mô phỏng chiếu gamut, xem
  // estimateNativeChroma). Y giữ base derived (Y native ≈ Y derived,
  // 0% chạm rail; dùng Y_est cho noise làm kurt R tệ đi).
  const estCb = new Float64Array(cw * ch);
  const estCr = new Float64Array(cw * ch);
  const cbNoise = new Float64Array(cw * ch);
  const crNoise = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      let sCb = 0;
      let sCr = 0;
      let n = 0;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const x = cx * 2 + dx;
          const y = cy * 2 + dy;
          if (x >= w || y >= h) continue;
          const i = y * w + x;
          sCb += CB[i];
          sCr += CR[i];
          n++;
        }
      }
      const i = cy * cw + cx;
      estCb[i] = estimateNativeChroma(sCb / n, NATIVE_CHROMA_K_CB);
      estCr[i] = estimateNativeChroma(sCr / n, NATIVE_CHROMA_K_CR);
      cbNoise[i] = gauss() * sigma;
      crNoise[i] = gauss() * sigma;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const i = y * w + x;
      const ci = (y >> 1) * cw + (x >> 1);
      const ny = Math.min(255, Math.max(0, Y[i] + gauss() * sigma));
      const ncb = Math.min(255, Math.max(0, estCb[ci] + cbNoise[ci]));
      const ncr = Math.min(255, Math.max(0, estCr[ci] + crNoise[ci]));
      const [r, g, b] = yuv709ToRgb(ny, ncb, ncr);
      d[p] = r;
      d[p + 1] = g;
      d[p + 2] = b;
    }
  }
  return img;
}
/**
 * Cộng nhiễu Gauss từng kênh RGB độc lập (in-place). strength = alls,
 * sigma = strength/√3.
 *
 * Dùng cho glitch (đợt 65 S7 — đính chính giả định R63 R8): chuỗi render
 * của glitch là `format=yuv420p,rgbashift=...,noise=...`; FFmpeg tự chèn
 * scale yuv420p→gbrp cho rgbashift (log verbose probe9) và noise chạy
 * tiếp trên các plane RGB đó — KHÔNG quay về yuv420p. Đo thật (probe9,
 * fixture 64×8, ns=20): delta render vs shift-only có std [11.13,
 * 10.85, 11.07] ≈ σ = 20/√3 = 11.55 và corr chéo kênh [0.038, -0.003,
 * 0.008] ≈ 0 — đúng dấu hiệu nhiễu RGB độc lập, sai dấu hiệu YUV
 * (std [24.7, 15.0, 27.9], corr [0.15, 0.26, 0.30]). Vì vậy glitch
 * KHÔNG dùng addYuvNoise nữa. Thứ tự rút RNG: R,G,B từng pixel
 * (row-major), cùng seed → cùng ảnh.
 */
export function addRgbNoise(img: ImageDataLike, strength: number, seed: number): ImageDataLike {
  const { data: d } = img;
  const sigma = strength / Math.sqrt(3);
  const gauss = gaussianGenerator(mulberry32(seed));
  for (let p = 0; p < d.length; p += 4) {
    d[p] = d[p] + gauss() * sigma;
    d[p + 1] = d[p + 1] + gauss() * sigma;
    d[p + 2] = d[p + 2] + gauss() * sigma;
  }
  return img;
}

/**
 * RGB shift: kênh đỏ dịch phải s pixel, kênh xanh dương dịch trái s
 * pixel (s = 2 + t*14, mirror render rgbashift rh=+s, bh=-s). Kênh lục
 * và alpha giữ nguyên. Vùng trống NHÂN BIÊN (đợt 16 H5: render đúng
 * bằng nhân biên, 0 byte lệch; điền 0 cũ lệch 810 byte trên tự nhiên
 * 72×45, s=9). Dịch phân đoạn bị CẮT (trunc): render(8.5) == render(8)
 * đúng từng byte, nên Math.round cũ (8.5→9) là sai.
 * Chiều dịch (đỏ phải / xanh trái) đã đối chiếu pixel-đối-pixel với
 * FFmpeg rgbashift (đợt 11 P2: MAD 0.000, <=8 = 100% trên nguồn gradient
 * kênh, s=9) — KHỚP, không còn là "chưa đối chiếu".
 */
export function applyRgbShift(img: ImageDataLike, intensity: number): ImageDataLike {
  const s = Math.trunc(2 + clamp01(intensity) * 14);
  const { width: w, height: h, data: d } = img;
  const src = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const rs = x - s < 0 ? 0 : x - s;
      const bs = x + s >= w ? w - 1 : x + s;
      d[p] = src[(y * w + rs) * 4];
      d[p + 2] = src[(y * w + bs) * 4 + 2];
    }
  }
  return img;
}

/**
 * Shake: mô phỏng đúng crop+pad của render, KHÔNG phải dịch tịnh tiến
 * cả khung (bản cũ dịch cả khung nên lệch MAD 44.58 ở t=0).
 * Render: crop cửa sổ (w-24)×(h-24) tại (cropX, cropY) rồi pad về đúng
 * kích thước gốc tại (12,12) → viền đen 12px bốn phía, chỉ nội dung
 * trong cửa sổ [12, w-12) × [12, h-12) được giữ lại.
 * (dx, dy) do canvasEffectOps tính từ thời gian (xem shakeOffsetAt)
 * chính là độ dịch của nội dung trong cửa sổ: cropX = 12 - dx,
 * cropY = 12 - dy, nên chỉ cần dịch rồi ép đen viền 12px là đủ — nguồn
 * dịch luôn nằm trong khung vì cropX/cropY ∈ [0, 24].
 * Vùng viền điền 0 (đen) ở RGB; alpha giữ nguyên như trước (preview vẽ
 * lên nền đã có). Khung nhỏ hơn 25px theo một chiều: cửa sổ rỗng →
 * toàn khung đen (render thật còn lỗi luôn vì crop ≤ 0, đây là trường
 * hợp suy biến, không phải hành vi xem trước bình thường).
 */
export function applyShake(img: ImageDataLike, dx: number, dy: number): ImageDataLike {
  const { width: w, height: h, data: d } = img;
  const src = new Uint8ClampedArray(d);
  const ix = Math.round(dx);
  const iy = Math.round(dy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const inWindow = x >= 12 && x < w - 12 && y >= 12 && y < h - 12;
      if (inWindow) {
        const q = ((y - iy) * w + (x - ix)) * 4;
        d[p] = src[q];
        d[p + 1] = src[q + 1];
        d[p + 2] = src[q + 2];
      } else {
        d[p] = 0;
        d[p + 1] = 0;
        d[p + 2] = 0;
      }
    }
  }
  return img;
}

/**
 * Độ dịch shake tại thời gian localT (giây), mirror render:
 * crop x = 12 + 12*sin(2πt*9), y = 12 + 12*cos(2πt*7), pad x = y = 12
 * → nội dung trong cửa sổ crop dịch (-12*sin, -12*cos); applyShake
 * dùng (dx, dy) này cộng với viền đen 12px để tái tạo đúng crop+pad.
 * Trả về pixel nguyên.
 */
export function shakeOffsetAt(localT: number): { dx: number; dy: number } {
  // +0 để chuẩn hoá -0 thành 0 (deepEqual phân biệt -0/0).
  return {
    dx: Math.round(-12 * Math.sin(2 * Math.PI * localT * 9)) + 0,
    dy: Math.round(-12 * Math.cos(2 * Math.PI * localT * 7)) + 0,
  };
}

/**
 * Glitch: đúng cấu trúc render `rgbashift=rh=s:bh=-s,noise=alls=ns:allf=t`
 * với s = 6 + t*10 px (CẮT phần thập phân, như rgbashift — đợt 16 H5)
 * và ns = round(10 + t*20). Kênh đỏ dịch phải s, kênh xanh dương dịch
 * trái s (kênh lục giữ nguyên), vùng trống NHÂN BIÊN (như applyRgbShift),
 * rồi cộng nhiễu Gauss KHÔNG GIAN YUV (sigma = ns/√3 từng plane,
 * addYuvNoise — đợt 63 R8; seed xác định để tua lại cho cùng hình;
 * render dùng nhiễu thời gian nên không khớp từng frame — chỉ xấp xỉ
 * về cấu trúc/thống kê, xem LIMITS).
 * Đợt 14 R6 thay mô hình lát ngang dịch ngẫu nhiên cũ: render KHÔNG có
 * slice nào, nên slice cũ lệch MAD 30.11 (pattern) / 37.08 (tự nhiên)
 * so với render, trong khi mô hình này cho 18.58 / 22.26. Lưu ý trung
 * thực về MAD: chỉ rgb-shift (không noise) cho MAD thấp hơn nữa
 * (14.93 / 18.94) vì nhiễu preview độc lập với nhiễu render cộng thêm
 * phương sai — nhưng preview không-nhiễu sẽ trình bày sai bản chất
 * hiệu ứng (render luôn có hạt), nên vẫn cộng noise và không claim
 * MAD đó là "tốt hơn". Đợt 16 H5 KHÔNG thử nội suy dịch phân đoạn:
 * nội suy tuyến tính giữa floor/ceil cho MAD tệ hơn cả floor lẫn ceil
 * trên các s phân đoạn đã đo (vd s=8.5: floor 3.20, nội suy 4.66,
 * ceil 6.10) — vì render cắt phần thập phân chứ không nội suy.
 */
export function applyGlitch(
  img: ImageDataLike,
  intensity: number,
  seed: number,
): ImageDataLike {
  const t = clamp01(intensity);
  const s = Math.trunc(6 + t * 10);
  const ns = Math.round(10 + t * 20);
  const { width: w, height: h, data: d } = img;
  const src = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const rs = x - s < 0 ? 0 : x - s;
      const bs = x + s >= w ? w - 1 : x + s;
      d[p] = src[(y * w + rs) * 4];
      d[p + 2] = src[(y * w + bs) * 4 + 2];
    }
  }
  // Đợt 65 S7: nhiễu glitch là nhiễu RGB độc lập (xem addRgbNoise) —
  // chuỗi render `rgbashift,noise` chạy noise trên plane RGB sau khi
  // rgbashift tự convert yuv420p→gbrp; giả định "noise yuv420p" của
  // đợt 63 R8 sai (đo thật: corr ≈ 0, std ≈ σ, không phải corr
  // [0.15,0.26,0.30] của YUV). addYuvNoise chỉ dùng cho effect noise.
  return addRgbNoise(img, ns, seed);
}

/**
 * Noise: cộng nhiễu Gauss không gian YUV (sigma = strength/√3,
 * strength = 5 + t*45, mirror render `noise=alls:allf=t` trong pipeline
 * yuv420p) — xem addYuvNoise. Seed quyết định → cùng seed cho cùng một
 * ảnh ra, khác seed cho ảnh khác.
 * Đợt 65 S7 đổi tiếp sang base chroma native ước lượng (mô phỏng chiếu
 * gamut — xem addYuvNoise): trên nội dung bão hoà, std R/B của preview
 * thừa 34%/17% và kurt R lệch 2.94 so với render pre-encode; nay
 * KHỚP-THỐNG-KÊ ở cả noise05 lẫn noise10 (tỉ lệ std 1.01–1.05,
 * Δkurt ≤ 0.34, 4 seed; đo pre-encode full-res, xem LIMITS đợt 65 S7).
 * XẤP XỈ: render dùng noise thời gian (allf=t) nên mỗi frame nhiễu khác
 * nhau và không khớp từng frame với bản này; preview bù bằng cách đổi
 * seed theo thời gian (canvasEffectOps) để nhiễu vẫn "sống" theo frame.
 * Alpha giữ nguyên.
 */
export function applyNoise(
  img: ImageDataLike,
  intensity: number,
  seed: number,
): ImageDataLike {
  const strength = 5 + clamp01(intensity) * 45;
  return addYuvNoise(img, strength, seed);
}

// ---------------------------------------------------------------------------
// Điều phối
// ---------------------------------------------------------------------------

/** Áp một op lên ảnh (in-place). */
export function applyCanvasEffect(img: ImageDataLike, op: CanvasEffectOp): ImageDataLike {
  switch (op.type) {
    case "mirror":
      return applyMirror(img);
    case "pixelate":
      return applyPixelate(img, op.intensity);
    case "sharpen":
      return applySharpen(img, op.intensity);
    case "edgedetect":
      return applyEdgeDetect(img, op.intensity);
    case "rgb-shift":
      return applyRgbShift(img, op.intensity);
    case "shake":
      return applyShake(img, op.dx ?? 0, op.dy ?? 0);
    case "glitch":
      return applyGlitch(img, op.intensity, op.seed ?? 0);
    case "noise":
      return applyNoise(img, op.intensity, op.seed ?? 0);
  }
}

/** Áp lần lượt các op theo đúng thứ tự mảng (in-place). */
export function applyCanvasEffects(
  img: ImageDataLike,
  ops: readonly CanvasEffectOp[],
): ImageDataLike {
  for (const op of ops) applyCanvasEffect(img, op);
  return img;
}

/**
 * Chuyển clip.effects thô thành ops cho bước canvas của preview.
 * - Chỉ giữ 8 type canvas; type khác (CSS/vignette) bỏ qua ở đây.
 * - shake: dx/dy tính từ localT (giây từ đầu clip).
 * - noise/glitch: seed đổi theo frame (noise 30 khung/giây, glitch 12
 *   lần/giây) để nhiễu/glitch "sống" như render thời gian, nhưng vẫn xác
 *   định theo localT (cùng localT → cùng seed → tua lại cho cùng hình).
 */
export function canvasEffectOps(
  effects: readonly { type: string; intensity?: number }[] | undefined,
  localT: number,
): CanvasEffectOp[] {
  const ops: CanvasEffectOp[] = [];
  for (const e of effects ?? []) {
    if (!isCanvasEffectType(e.type)) continue;
    const intensity = clamp01(e.intensity ?? 0.5);
    if (e.type === "shake") {
      const { dx, dy } = shakeOffsetAt(localT);
      ops.push({ type: "shake", intensity, dx, dy });
    } else if (e.type === "noise") {
      ops.push({
        type: "noise",
        intensity,
        seed: 0x9e3779b9 ^ Math.floor(localT * 30),
      });
    } else if (e.type === "glitch") {
      ops.push({
        type: "glitch",
        intensity,
        seed: 0x85ebca6b ^ Math.floor(localT * 12),
      });
    } else {
      ops.push({ type: e.type, intensity });
    }
  }
  return ops;
}
