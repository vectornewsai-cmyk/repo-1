/**
 * previewStatus.ts — V5 (đợt "preview khớp render"): nhãn trạng thái preview
 * cho từng item trong TransitionPanel và EffectPanel.
 *
 * Đây chỉ là LỚP NHÃN DỮ LIỆU, không phải logic preview/render. Trạng thái
 * được suy ra từ trạng thái THẬT đã biết trong code (không claim khớp cho
 * cái chưa khớp):
 *
 * TRANSITION:
 * - "fade" → matched: preview timeline mô phỏng đúng fade qua alpha.
 * - "none" → matched: cắt cứng — preview không có gì để lệch (không hiệu ứng).
 * - mọi type còn lại → approx (trừ circleopen/circleclose đã lên
 *   "matched" từ đợt 13 C1, dissolve từ đợt 14 R2, circle-soft
 *   từ đợt 15 T6, và blinds-h/plus/checker/grid/bars-fade từ
 *   đợt 16 H1, xem cuối phần chú thích này): từ đợt 10,
 *   luồng V1 (transitionPreview.ts)
 *   đã mô phỏng hình học xfade cho 68 type catalog cũ (wipe/slide/circle…),
 *   nhưng preview vẽ từng clip riêng lẻ nên không phải crossfade thật và
 *   một số loại chỉ xấp xỉ (diag/pixelize…); 14 type mới của V3
 *   fallback về fade trong module V1 nên cũng chỉ "approx". Vì vậy nhãn
 *   "approx" vẫn đúng sau đợt 10, không nâng lên "matched".
 *
 * EFFECT (căn cứ apps/web/src/lib/previewEngine.ts effectsVisual()):
 * - matched: type có CSS tương đương cùng ngữ nghĩa theo comment trong code
 *   (grayscale, invert, hue-rotate).
 * - approx: type được vẽ nhưng công thức CSS chỉ xấp xỉ render (blur: CSS
 *   blur ≠ boxblur FFmpeg; sepia: ma trận chuẩn khác ma trận nội suy;
 *   brightness: thiếu offset; vignette: radial gradient thay cho filter;
 *   old-film: chỉ xấp xỉ phần màu) — và 4 type canvas còn xấp xỉ của
 *   luồng V2 (đợt 10, effectCanvas.ts): sharpen, edgedetect, noise, glitch
 *   (xem dưới).
 * - matched (canvas, đợt 12 T3 — nâng theo số đo đợt 11 P2, xem
 *   docs/PHASE9_ROUND11_P2_PIXELATE_LIMITS.md): 4 type canvas đã KHỚP
 *   theo ngưỡng V6/V11 "KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8" trên
 *   nguồn tổng hợp video-like (FFmpeg 8.1.2, harness V6):
 *   pixelate MAD 0.667 (≤8 = 100%, k=2/6/9/16), shake MAD 0.000
 *   (t=0 và t=0.5, frame 15/30), rgb-shift MAD 0.000 (≤8 = 100%, s=9),
 *   mirror MAD 0.000. Chỉ nâng đúng 4 type có số đo này — không nâng
 *   theo cảm tính.
 * - matched (canvas, đợt 14 R6 — nâng theo số đo mới, xem
 *   docs/PHASE9_ROUND14_R6_EFFECT_PARITY_LIMITS.md): sharpen nay KHỚP
 *   cùng ngưỡng V6/V11 sau khi đổi mô hình preview sang luma + Gaussian
 *   5×5 (thay box-blur 3×3 RGB cũ): MAD 0.40–0.61, ≤8 = 99.5–100% trên
 *   16 điểm đo (pattern + tự nhiên, t = 0/0.25/0.5/1, 72×45 và 144×90,
 *   FFmpeg 8.1.2, harness parity effectCanvas). Phạm vi số đo vẫn là
 *   nguồn tổng hợp, chưa phải footage thật/HD/clip dài.
 * - approx (canvas, sau đợt 14 R6, cập nhật đợt 17 N4): edgedetect với
 *   mô hình NMS + hysteresis giữ magnitude — đợt 16 H5: step 0.31 /
 *   tự nhiên 2.13 / pattern 2.52 (72×45, t=0.5); đợt 17 N4 đổi sang
 *   Gaussian σ=1.4 + gray nguyên swscale + làm tròn: step 0.315 /
 *   tự nhiên 3.815 / pattern 0.985 (72×45), step 0.079 / tự nhiên 1.172
 *   / pattern 2.118 (144×90) — tổng 6 ô 10.11 → 8.48, và thắng lớn trên
 *   2 nguồn độc lập (24 ô: 97.95 → 47.99), nhưng vẫn KHÔNG đạt ngưỡng
 *   KHỚP (tự nhiên 72×45 ≤8 chỉ 94.5%, pattern 144×90 2.12/98.4%) nên
 *   badge giữ approx; khác cấu trúc render trên step hoàn hảo (Canny
 *   render chỉ cho 4 pixel); noise/glitch không đo được từng frame
 *   (render dùng nhiễu thời gian, canvas dùng seed xác định để tua
 *   lại — chỉ xấp xỉ về cấu trúc/thống kê; glitch từ R6 làm đúng cấu
 *   trúc render rgb-shift + noise, không còn slice, nhưng nhiễu
 *   preview độc lập với nhiễu render nên MAD từng frame vẫn ~12–13
 *   (sàn nhiễu độc lập), giữ ở "approx"; cách đo glitch ổn định được
 *   khóa ở parity test đợt 17 N4: lặp byte-identical + cấu trúc
 *   TB/std trong ngưỡng, không dùng MAD vs render làm tier).
 * - none: type lạ chưa biết (effectsVisual đẩy type lạ vào skipped). Trước
 *   đợt 10, 8 type canvas nằm trong `skipped` nên từng là "none" — parent
 *   đợt 10 đã chuyển chúng sang "approx" khi V2 nối canvas thật (xem
 *   docs/PHASE9_ROUND10_PREVIEW_PARITY_LIMITS.md).
 *
 * TRANSITION — circleopen/circleclose: nâng lên "matched" ở đợt 13 C1
 * (đúng điều kiện ghi ở đây từ đợt 12 T3: đổi mô hình preview sang
 * gradient + đo lại đạt ngưỡng KHỚP), hiệu chuẩn lại ở đợt 14 R4:
 * gradient là smoothstep (không phải cosin như đợt 13 tưởng) và
 * tâm/rMax lấy theo phép cắt nguyên của FFmpeg. Số đo mới: harness
 * V11 mở rộng (composite describeTransition vs render xfade FFmpeg
 * 8.1.2, nguồn đỏ/xanh phẳng) — circleopen/circleclose MAD 0.33
 * (cosin cũ 1.56) tại p=0.5, 72×45, ≤8 = 100%; đo mở rộng nhiều
 * p + nhiều kích thước: cả 2 type KHỚP ở p = 0.25/0.4/0.5/0.6/0.75
 * và 72×45, 320×180, 1280×720, 1920×1080 (MAD 0.038–0.333,
 * ≤8 = 100% mọi điểm). Preview canvas vẽ cùng đường smoothstep qua mask alpha
 * radial-gradient (preview.tsx, dùng chung hàm radialGradientWeight)
 * nên nhãn matched áp cho cả timeline preview.
 * Giới hạn còn lại: preview thật vẫn vẽ từng clip riêng lẻ trên nền
 * đen, khác crossfade 2 clip của render (giới hạn chung mọi
 * transition, xem TRANSITION_PREVIEW_LIMITS.md).
 * Phạm vi nhãn (đợt 15 T5): matched ở 4K rgb và e2e nguồn phẳng;
 * e2e yuv420p trên nội dung chi tiết cực đoan tụt le8 về 94–96% do
 * giới hạn chung của yuv420p, không phải lỗi mô hình (xem
 * docs/PHASE9_ROUND15_T5_HD_MEASURE_LIMITS.md).
 *
 * TRANSITION — dissolve: nâng lên "matched" ở đợt 14 R2 (đúng ngưỡng
 * V6/V11 "KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8"). Số đo: composite
 * describeTransition (vùng dissolve-noise từng pixel qua
 * ffmpegDissolveFrand, tái tạo vf_xfade.c bằng float32 từng bước) vs
 * render xfade FFmpeg 8.1.2, nguồn đỏ/xanh phẳng — MAD 0.0000 tại
 * 72×45 và 144×90 ở 5 frame-p (0.033/0.233/0.5/0.733/0.967, 0 pixel
 * lệch), MAD ≤ 0.0089 tại 320×180 (≤ 3 pixel lệch / 57600, do sinf
 * glibc lệch JS ở vài tọa độ lớn — xem
 * docs/PHASE9_ROUND14_R2_DISSOLVE_LIMITS.md). Preview canvas vẽ cùng
 * hàm frand qua mask ImageData (preview.tsx
 * drawVideoClipWithDissolveMask) nên nhãn matched áp cho cả timeline
 * preview. Giới hạn còn lại: mask tính ở độ phân giải khung đầy đủ
 * (~158ms tại 1920×1080 đo bằng Node — chỉ trong frame dissolve);
 * preview thật vẫn vẽ từng clip riêng lẻ trên nền đen, khác crossfade
 * 2 clip của render (giới hạn chung mọi transition).
 * Phạm vi nhãn (đợt 15 T5): matched ở mức mô hình xfade rgb24;
 * đầu ra yuv420p ép sau xfade không giữ được pattern nhiễu từng
 * pixel (e2e MAD 47–71) — giới hạn của định dạng đầu ra, không phải
 * lỗi preview (xem docs/PHASE9_ROUND15_T5_HD_MEASURE_LIMITS.md).
 *
 * TRANSITION — circle-soft: nâng lên "matched" ở đợt 15 T6 (cùng
 * ngưỡng KHỚP). Số đo: composite describeTransition (vùng
 * radial-soft, B weight tuyến tính từ p tới p+0,15, tâm dịch +0,5
 * sang không gian tâm điểm) vs render xfade FFmpeg 8.1.2, nguồn
 * đỏ/xanh phẳng — 192x108: MAD 0,181/0,212/0,178, le8 100% ở
 * p=0,25/0,5/0,75; 1280x720: MAD 0,184/0,213/0,177, le8 100%
 * (xem docs/PHASE9_ROUND15_T6_UI_CIRCLESOFT_LIMITS.md §2). Preview
 * canvas vẽ cùng hàm radialSoftWeight qua mask alpha (preview.tsx
 * drawVideoClipWithRadialMask) nên nhãn matched áp cho cả timeline
 * preview. Giới hạn còn lại như dissolve (clip riêng lẻ trên nền
 * đen, chưa footage thật/1080p cho circle-soft).
 *
 * TRANSITION — blinds-h/plus/checker/grid/bars-fade: nâng lên
 * "matched" ở đợt 16 H1 (cùng ngưỡng KHỚP), sau khi harness đã
 * raster được cả 5 kind này — trước đó badge giữ "approx" vì số
 * đo đợt 15 chỉ qua script /tmp, chưa qua harness (xem
 * docs/PHASE9_ROUND15_T6_UI_CIRCLESOFT_LIMITS.md §5 và
 * docs/PHASE9_ROUND15_T2_GRID_BARS_LIMITS.md §4). Số đo đợt 16 H1
 * (FFmpeg 8.1.2, nguồn đỏ/xanh phẳng, composite describeTransition
 * vs render xfade): harness V11/V12/V14 ở 72×45, p=0,5 — blinds-h,
 * plus, checker, grid MAD 0,000, bars-fade MAD 0,30/0,30/0,296,
 * ≤8 = 100% mọi case; harness V13 ở 1920×1080, p=0,25/0,5/0,75 —
 * blinds-h 0,249/0,165/0,081, plus 0,214/0,119/0,048, checker
 * 0,250/0,167/0,083, grid 0,311/0,247/0,142, bars-fade
 * 0,750/0,333/0,167, ≤8 = 100% mọi case (phần dư là sàn yuv
 * 254-vs-255 + làm tròn blend, không phải sai hình học).
 * Phạm vi nhãn: matched ở mức mô hình composite vs render xfade
 * trên nguồn phẳng (72×45 và 1920×1080, p đã đo); chưa footage
 * thật, chưa yuv420p e2e, chưa clip dài. Riêng bars-fade: canvas
 * đơn clip (preview.tsx) vẫn chỉ vẽ dải cho clip vào / nền cho
 * clip ra bằng rects, không vẽ được crossfade thật vì chỉ có 1
 * clip tại 1 thời điểm — composite đúng chỉ tồn tại ở tầng mô
 * hình + harness hiểu kind (giới hạn kiến trúc đã ghi trong
 * comment kind bars-fade của transitionPreview.ts). Giới hạn
 * chung như dissolve/circle: preview thật vẽ từng clip riêng lẻ
 * trên nền đen, khác crossfade 2 clip của render.
 *
 * KHÔNG sửa previewEngine.ts / preview.tsx / transitions.js / effects.js /
 * render.js ở đây — file này là mirror chỉ-đọc của chúng. Khi luồng preview
 * (V1/V2) nối thêm type vào preview thật, cập nhật các tập dưới đây kèm
 * test, đừng đổi nhãn trước khi code preview thật tồn tại.
 */

import { t as i18nT } from "../../i18n";

export type PreviewStatus = "matched" | "approx" | "none";

/**
 * Transition preview timeline mô phỏng đúng ("none" = cắt cứng).
 * circleopen/circleclose vào đây từ đợt 13 C1 theo số đo harness V11 +
 * đo mở rộng (xem chú thích đầu file); dissolve vào đây từ đợt 14 R2
 * (xem chú thích đầu file); circle-soft vào đây từ đợt 15 T6 (xem
 * chú thích đầu file); blinds-h/plus/checker/grid/bars-fade vào đây
 * từ đợt 16 H1 theo số đo harness V11/V12/V14 + V13 HD (xem chú
 * thích đầu file); các type khác vẫn "approx".
 */
const TRANSITION_MATCHED = new Set(["fade", "none", "circleopen", "circleclose", "dissolve", "circle-soft",
  // Đợt 16 H1: 5 kind đợt 15 nay đã đo qua harness (V11/V12/V14 ở
  // 72×45 p=0,5 + V13 ở 1920×1080 p=0,25/0,5/0,75, MAD ≤ 0,75,
  // ≤8 = 100% — xem chú thích đầu file; bars-fade vẫn giữ giới
  // hạn canvas đơn clip ghi ở đó).
  "blinds-h", "plus", "checker", "grid", "bars-fade"]);

export function transitionPreviewStatus(type: string): PreviewStatus {
  return TRANSITION_MATCHED.has(type) ? "matched" : "approx";
}

/** Effect có CSS tương đương cùng ngữ nghĩa với filter render. */
const EFFECT_MATCHED = new Set(["grayscale", "invert", "hue-rotate"]);

/** Effect preview có vẽ nhưng công thức CSS chỉ xấp xỉ render. */
const EFFECT_APPROX = new Set([
  "blur",
  "sepia",
  "vignette",
  "brightness",
  "old-film",
]);

/**
 * Effect vẽ thật bằng canvas (luồng V2, đợt 10) đã KHỚP render theo số đo
 * đợt 11 P2 (ngưỡng V6/V11: MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8):
 * pixelate MAD 0.667, shake MAD 0.000, rgb-shift MAD 0.000, mirror MAD 0.000.
 * Phạm vi số đo: nguồn tổng hợp video-like, chưa phải footage thật/HD/
 * clip dài; pixelate trên nguồn nhiễu rgb24 và shake lệch pha khi clip
 * không bắt đầu ở 0 vẫn là giới hạn đã ghi trong LIMITS đợt 11 P2.
 */
const EFFECT_CANVAS_MATCHED = new Set([
  "pixelate",
  "shake",
  "rgb-shift",
  "mirror",
  // Đợt 14 R6: sharpen KHỚP sau đổi mô hình luma + Gaussian 5×5
  // (MAD 0.40–0.61, ≤8 = 99.5–100%, 16 điểm đo — xem chú thích đầu file).
  "sharpen",
]);

/** Effect vẽ thật bằng canvas (luồng V2, đợt 10) — vẫn chỉ xấp xỉ render. */
const EFFECT_CANVAS_APPROX = new Set([
  "noise",
  "glitch",
  "edgedetect",
]);

export function effectPreviewStatus(type: string): PreviewStatus {
  if (EFFECT_MATCHED.has(type)) return "matched";
  if (EFFECT_CANVAS_MATCHED.has(type)) return "matched";
  if (EFFECT_APPROX.has(type)) return "approx";
  if (EFFECT_CANVAS_APPROX.has(type)) return "approx";
  return "none";
}

/**
 * Nhãn badge trạng thái preview. Key viết literal để script r6-i18n-check
 * quét được (key động sẽ lọt qua bước kiểm tra key dùng trong code).
 */
export function previewBadgeLabel(status: PreviewStatus): string {
  if (status === "matched") return i18nT("previewBadge.matched");
  if (status === "approx") return i18nT("previewBadge.approx");
  return i18nT("previewBadge.none");
}
