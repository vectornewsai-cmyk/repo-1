/**
 * enhancePreview.ts — enhance vào preview ở mức XẤP XỈ (Phase 9 đợt 60 Q1,
 * đóng nợ đợt 59 §6.9 + gap E3 phần còn lại).
 *
 * Bối cảnh: EnhancePanel (R2) + render enhance (hqdn3d/yadif/vidstab 2-pass,
 * xem docs/PHASE9_ROUND59_P9_ENHANCE_RENDER_LIMITS.md) đã có, nhưng preview
 * canvas chưa áp enhance — panel ghi "chỉ có tác dụng khi render". Module
 * này là logic THUẦN (không React/store/DOM) để preview.tsx dùng khi vẽ
 * frame, và test khóa được bằng esbuild+node.
 *
 * XẤP XỈ (ghi rõ, không mạo nhận là filter render thật):
 * - denoise (hqdn3d không gian + thời gian) → BLEND với bản mờ: composite
 *   = (1-a)·gốc + a·blur(3.0px), với a = denoiseBlendAlpha(strength)
 *   (HIỆU CHUẨN đợt 63 R3 — xem docs/PHASE9_ROUND63_R3_BLEND_FPS_LIMITS.md
 *   §2: đợt 62 dùng a = strength tuyến tính, vẫn overstate ở đầu thấp
 *   (s=0.3: -28.9% so với hqdn3d -19%, sai +9.9) vì không có mức alpha
 *   nào dưới -10% mà vẫn khác 0 trừ a<0.1. Đợt 63 đổi sang piecewise-
 *   linear qua 4 mốc khớp đúng hqdn3d flat15 720p: s=0.3 → -18.5%
 *   (sai -0.5), s=0.5 → -45.7% (-1.3), s=0.8 → -73.8% (-0.2),
 *   s=1.0 → -82.9% (-0.1); ở khổ preview 488×275 sai tối đa 2.3.
 *   Các biến thể đã thử và LOẠI (probe-blend-r63, cùng metric):
 *   a=s^p (p=1.25: sai tối đa 7.1; p=1.5: sai 13.4 — đầu giữa tụt),
 *   giảm bán kính blur ở a cao (B=3-1.5a: s=1.0 chỉ -67.6%, sai -15.4
 *   dù edge 4→2px), dual-radius (sai 17.1), blend có ngưỡng theo độ
 *   lệch pixel (edge 0px ở mọi mức nhưng khử nhiễu sụp hẳn: tối đa
 *   -16% ở s=1.0 so với mục tiêu -83% — xem LIMITS §2.3).
 *   Step-edge vẫn 4px ở a≥0.8 (bằng blur thuần ở s=1.0) — preview ở
 *   strength cao vẫn mềm hơn render thật (nợ mở, xem LIMITS §6).
 *   Trên footage nhiễu nặng (flat40) vẫn overstate như mọi xấp xỉ
 *   không gian (hqdn3d s=1.0 chỉ -26.7% trên flat40, blend cho -84.4%
 *   — hqdn3d có thành phần thời gian + thích nghi theo mức nhiễu mà
 *   không xấp xỉ không gian nào tái tạo được; xem LIMITS §2.4).
 * - stabilize (vidstab 2-pass: detect chuyển động rồi transform) → zoom
 *   crop gợi ý, smoothing 1..100 → zoom 1.0203..1.05 (mặc định smoothing
 *   10 → 1.023). Zoom chỉ gợi ý "khung hình đang được crop lại", KHÔNG
 *   làm mượt chuyển động thật (không có vector chuyển động, không có pass
 *   detect), KHÔNG giảm jitter đo được như render (redx std 3.507 → 1.55
 *   ở 320x180 — xem LIMITS đợt 59 P9 §4.2).
 *   ĐỢT 62 R3: clip có speedKeyframes thì stabilize bị CHẶN ở preview
 *   (zoom = 1, stabilize vào notApproximated, cờ
 *   stabilizeBlockedBySpeedRamp) — đồng bộ với render (validator + 
 *   render.js chặn hẳn, exit 1) và với panel (đợt 61 R2 chặn preset ở UI):
 *   trạng thái lỗi cũ (tạo trước khi chặn, qua MCP/CLI/file project)
 *   không còn hiện gợi ý zoom mà render từ chối.
 * - deinterlace (yadif) → KHÔNG có xấp xỉ trực quan: không đóng góp gì
 *   vào blur/zoom/offscreen. Preview hiện frame như trình duyệt giải mã
 *   (khung progressive đã giải mã), răng cưa của nguồn interlaced có thể
 *   vẫn thấy hoặc không tùy decoder — yadif CHỈ chạy ở render.
 *
 * QUY TẮC SHAPE (cứng): CHỈ đọc field đã tồn tại trong `ClipEnhance`
 * (packages/video-spec/src/enhance.ts) — deinterlace / stabilize /
 * denoise. KHÔNG thêm field mới vào spec. Toggle "xem trước enhance" là
 * cờ UI trong store (mặc định bật), KHÔNG nằm trong spec nên không ảnh
 * hưởng render/export.
 */
import {
  DENOISE_DEFAULT_STRENGTH,
  STABILIZE_DEFAULTS,
  type ClipEnhance,
} from "@repo-1/video-spec";
import {
  enhanceActiveFeatures,
  type EnhanceFeature,
} from "../components/enhance/presets";

/** Bán kính blur CỐ ĐỊNH (px) của bản mờ dùng trong phép blend denoise
 * (đợt 62 R3 — xem comment đầu file: blur 3.0px cho -84% ở a=1, khớp
 * hqdn3d s=1.0; alpha mới là biến điều khiển, không phải bán kính). */
export const ENHANCE_PREVIEW_BLUR_RADIUS_PX = 3.0;
/** Zoom tối đa (crop gợi ý) ở stabilize smoothing 100. */
export const ENHANCE_PREVIEW_ZOOM_MAX = 1.05;
/** Zoom tối thiểu (crop gợi ý) ở stabilize smoothing 1. */
export const ENHANCE_PREVIEW_ZOOM_MIN = 1.0203;

/** Clamp về [lo, hi]; NaN → lo (giá trị rác không được phá preview). */
function clampNum(v: number, lo: number, hi: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Strength denoise đã chuẩn hóa (true → 0.5 mặc định render); null = không
 * có denoise / giá trị lỗi (false — render coi là lỗi, xem presets.ts).
 */
export function denoiseStrengthOf(enh: ClipEnhance | undefined): number | null {
  const d = enh?.denoise;
  if (d === undefined) return null;
  if (d === true) return DENOISE_DEFAULT_STRENGTH;
  if (typeof d === "object" && d !== null) return d.strength ?? DENOISE_DEFAULT_STRENGTH;
  return null;
}

/** Các mốc nội suy của đường cong blend (đợt 63 R3 — probe-blend-r63):
 * alpha cần để khớp đúng 4 mốc hqdn3d flat15 720p (B=3.0px), đo thật:
 * s=0.3 → a=0.195, s=0.5 → a=0.486, s=0.8 → a=0.806, s=1.0 → a=0.981
 * (nội suy tuyến tính giữa các mốc; ở khổ preview 488×275 cùng đường
 * cong cho sai tối đa 2.3 điểm — không phải overfit theo 1 fixture:
 * xem LIMITS đợt 63 §2.1). Đợt 62 dùng a = s (sai +9.9 ở s=0.3). */
const DENOISE_BLEND_ALPHA_KNOTS: Array<[number, number]> = [
  [0, 0],
  [0.3, 0.195],
  [0.5, 0.486],
  [0.8, 0.806],
  [1, 0.981],
];

/** Alpha blend cho denoise strength 0..1: composite = (1-a)·gốc +
 * a·blur(3.0px) (đợt 63 R3 — piecewise-linear qua 4 mốc khớp hqdn3d,
 * xem comment đầu file + DENOISE_BLEND_ALPHA_KNOTS; đợt 62 R3 dùng
 * a = strength tuyến tính, sai +9.9 ở đầu thấp). a đơn điệu tăng theo
 * strength, a>0 luôn đổi pixel thật (không vùng chết), a(0)=0, a(1)=0.981
 * (không bao giờ 1.0 — hqdn3d s=1.0 cũng chỉ -83%, không phải blur toàn
 * phần). Clamp ngoài [0,1] về biên; NaN → 0. */
export function denoiseBlendAlpha(strength: number): number {
  const s = clampNum(strength, 0, 1);
  if (s <= 0) return 0;
  for (let i = 1; i < DENOISE_BLEND_ALPHA_KNOTS.length; i++) {
    const [x0, y0] = DENOISE_BLEND_ALPHA_KNOTS[i - 1];
    const [x1, y1] = DENOISE_BLEND_ALPHA_KNOTS[i];
    if (s <= x1) return y0 + ((s - x0) / (x1 - x0)) * (y1 - y0);
  }
  return DENOISE_BLEND_ALPHA_KNOTS[DENOISE_BLEND_ALPHA_KNOTS.length - 1][1];
}

/**
 * Bán kính blur (px) của bản mờ trong phép blend: 3.0 khi denoise có
 * strength > 0, 0 khi không denoise (giữ ngữ nghĩa cũ của field
 * denoiseBlurPx trong plan/hook: 0 = không mờ). Đợt 61 R3 dùng hàm này
 * làm thang tuyến tính strength × 3.0px; đợt 62 R3 đổi ngữ nghĩa: bán
 * kính cố định, alpha mới mang strength (xem denoiseBlendAlpha).
 */
export function denoiseBlurPx(strength: number): number {
  return clampNum(strength, 0, 1) > 0 ? ENHANCE_PREVIEW_BLUR_RADIUS_PX : 0;
}

/**
 * Smoothing stabilize đã chuẩn hóa (mặc định 10); null = không stabilize.
 * Chỉ smoothing tham gia zoom gợi ý — shakiness/accuracy/stepsize/
 * mincontrast là option của pass vidstabdetect, preview không có pass đó.
 */
export function stabilizeSmoothingOf(enh: ClipEnhance | undefined): number | null {
  const s = enh?.stabilize;
  if (s === undefined) return null;
  return s.smoothing ?? STABILIZE_DEFAULTS.smoothing;
}

/**
 * Zoom crop gợi ý cho stabilize: 1 khi không stabilize, còn lại
 * 1.02 + smoothing/100 * 0.03 (smoothing 10 → 1.023, 100 → 1.05).
 * Smoothing clamp về [1,100] (khoảng render chấp nhận).
 */
export function stabilizeZoomOf(enh: ClipEnhance | undefined): number {
  const sm = stabilizeSmoothingOf(enh);
  if (sm === null) return 1;
  const clamped = clampNum(sm, 1, 100);
  return 1.02 + (clamped / 100) * 0.03;
}

/** Kế hoạch áp enhance lên 1 frame preview (đã tính xong, preview.tsx chỉ việc vẽ theo). */
export interface EnhancePreviewPlan {
  /** Toggle UI "xem trước enhance" có bật không. */
  enabled: boolean;
  /** Clip có enhance nào đang bật không. */
  hasEnhance: boolean;
  /** Bán kính blur (px) của bản mờ trong phép blend denoise (3.0 khi
   * denoise có strength > 0, 0 = không mờ — đợt 62 R3: bán kính cố định,
   * alpha mới mang strength). */
  denoiseBlurPx: number;
  /** Alpha blend denoise (0..1 = denoiseBlendAlpha(strength), đợt 63 R3
   * piecewise qua 4 mốc khớp hqdn3d — KHÔNG còn bằng strength):
   * composite = (1-a)·gốc + a·blur(3.0px). 0 = không khử nhiễu. */
  denoiseBlendAlpha: number;
  /** Zoom crop gợi ý stabilize (1 = không zoom). */
  stabilizeZoom: number;
  /** true khi stabilize bị chặn vì clip có speedKeyframes (đợt 62 R3 —
   * đồng bộ với render chặn hẳn + panel chặn preset ở UI). */
  stabilizeBlockedBySpeedRamp: boolean;
  /** true khi cần vẽ qua offscreen (blend alpha > 0 hoặc zoom != 1). */
  needsOffscreen: boolean;
  /** Tính năng enhance ĐÃ được xấp xỉ trong preview (chỉ denoise/stabilize). */
  applied: EnhanceFeature[];
  /** Tính năng enhance KHÔNG thể hiện trong preview (deinterlace luôn ở đây; toggle tắt thì tất cả). */
  notApproximated: EnhanceFeature[];
}

/**
 * Tính kế hoạch preview cho 1 clip.enhance + toggle UI.
 * - enabled=false → không áp gì (blur 0, alpha 0, zoom 1), mọi tính năng đang bật
 *   đều vào notApproximated (preview hiện khung gốc).
 * - enabled=true → denoise/stabilize vào applied; deinterlace LUÔN vào
 *   notApproximated (không có CSS tương đương yadif).
 * - hasSpeedKeyframes=true (đợt 62 R3) → stabilize bị chặn: zoom 1,
 *   stabilize vào notApproximated, cờ stabilizeBlockedBySpeedRamp = true
 *   (đồng bộ với render chặn hẳn + panel chặn preset ở UI — clip có cả
 *   hai chỉ còn qua đường tạo cũ/MCP/CLI/file project; denoise vẫn áp
 *   bình thường).
 * Thứ tự applied/notApproximated theo enhanceActiveFeatures
 * (deinterlace → stabilize → denoise).
 */
export function enhancePreviewPlan(
  enh: ClipEnhance | undefined,
  enabled: boolean,
  hasSpeedKeyframes = false,
): EnhancePreviewPlan {
  const active = enhanceActiveFeatures(enh);
  if (!enabled) {
    return {
      enabled: false,
      hasEnhance: active.length > 0,
      denoiseBlurPx: 0,
      denoiseBlendAlpha: 0,
      stabilizeZoom: 1,
      stabilizeBlockedBySpeedRamp: false,
      needsOffscreen: false,
      applied: [],
      notApproximated: active,
    };
  }
  const strength = denoiseStrengthOf(enh) ?? 0;
  const blur = denoiseBlurPx(strength);
  const alpha = denoiseBlendAlpha(strength);
  const stabBlocked = hasSpeedKeyframes && stabilizeSmoothingOf(enh) !== null;
  const zoom = stabBlocked ? 1 : stabilizeZoomOf(enh);
  const applied: EnhanceFeature[] = [];
  const notApproximated: EnhanceFeature[] = [];
  for (const f of active) {
    if (f === "deinterlace") notApproximated.push(f);
    else if (f === "stabilize" && stabBlocked) notApproximated.push(f);
    else applied.push(f);
  }
  return {
    enabled: true,
    hasEnhance: active.length > 0,
    denoiseBlurPx: blur,
    denoiseBlendAlpha: alpha,
    stabilizeZoom: zoom,
    stabilizeBlockedBySpeedRamp: stabBlocked,
    needsOffscreen: alpha > 0 || zoom !== 1,
    applied,
    notApproximated,
  };
}

/**
 * Trạng thái enhance của frame vừa vẽ — preview.tsx ghi lên
 * `window.__vcutPreviewEnhance` (hook đo cho harness/click-test, cùng mẫu
 * `window.__vcutHoldStats`). Chỉ phục vụ đo, không phải state React.
 */
export interface EnhancePreviewDebug {
  clipId: string;
  hasEnhance: boolean;
  enabled: boolean;
  denoiseBlurPx: number;
  /** Alpha blend denoise (0..1) của frame vừa vẽ (đợt 62 R3). */
  denoiseBlendAlpha: number;
  stabilizeZoom: number;
  /** true khi stabilize bị chặn vì clip có speedKeyframes (đợt 62 R3). */
  stabilizeBlockedBySpeedRamp: boolean;
  applied: EnhanceFeature[];
  notApproximated: EnhanceFeature[];
  /** true khi frame vừa vẽ đã qua offscreen enhance (blur/zoom đã áp). */
  offscreenApplied: boolean;
}

/** Dựng object hook đo từ plan + clipId + kết quả vẽ offscreen thật. */
export function enhancePreviewDebug(
  clipId: string,
  plan: EnhancePreviewPlan,
  offscreenApplied: boolean,
): EnhancePreviewDebug {
  return {
    clipId,
    hasEnhance: plan.hasEnhance,
    enabled: plan.enabled,
    denoiseBlurPx: plan.denoiseBlurPx,
    denoiseBlendAlpha: plan.denoiseBlendAlpha,
    stabilizeZoom: plan.stabilizeZoom,
    stabilizeBlockedBySpeedRamp: plan.stabilizeBlockedBySpeedRamp,
    applied: [...plan.applied],
    notApproximated: [...plan.notApproximated],
    offscreenApplied,
  };
}
