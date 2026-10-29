/**
 * previewEngine.ts — Logic thuần (không DOM) tính visual transform tại thời điểm t
 * cho preview canvas, mirror render engine `server/render/src/render.js`.
 *
 * THỨ TỰ TRANSFORM (khóa cứng, phải giống render.js — video):
 *   trim → setpts=PTS-STARTPTS → SPEED → CHROMA → scale/pad → COLOR → LUT → EFFECTS
 *   → (xfade merge) → OPACITY → KEYFRAMES (scale/rotation qua scale eval=frame +
 *   rotate, x/y qua overlay)
 * Composite: video → image → sticker → text.
 * Text: keyframes (animations) > textfx animation > fadeUp > none; typewriter
 * và parity ASS (tiltIn/skewIn/slideReveal/curtainIn) riêng, thắng keyframes.
 *
 * Xem PREVIEW_LIMITS.md để biết những gì chỉ là xấp xỉ.
 */
import {
  CHROMA_DEFAULTS,
  EFFECT_TYPES,
  LUT_IDS,
  STICKER_DEFAULTS,
  interpolateKeyframes,
  sourceTimeAt,
  speedAt,
  type ChromaKey,
  type ClipMask,
  type ClipMotion,
  type ColorAdjust,
  type ImageClip,
  type LutId,
  type SpeedableClip,
  type SpeedCurve,
  type StickerClip,
  type TextClip,
  type VideoClip,
  type VideoEffect,
  type VideoEffectType,
} from "@repo-1/video-spec";
/** Thứ tự áp dụng transform — PHẢI khớp render.js (xem test thứ tự). */
export const PREVIEW_TRANSFORM_ORDER = [
  "speed",
  "chroma",
  "color",
  "lut",
  "effects",
  "opacity",
  "keyframes",
] as const;

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

// ---------------------------------------------------------------------------
// Q8: memo nội suy keyframe cho preview (KHÔNG dùng cho render).
// Vấn đề: 1 clip có SR bị nội suy lặp — videoClipVisual nội suy
// scale/rotation/x/y/opacity, rồi videoElementPlacement nội suy lại cùng
// các keyframes đó ở cùng localT. Khi scrub/pause vẽ lại cùng frame,
// mọi nội suy lặp lại dù kết quả không đổi.
// Cách làm: cache theo identity mảng keyframes (WeakMap → clip bị xoá
// thì cache tự giải phóng) + frame index lượng tử ở 120Hz (sai số tối
// đa ~4ms, dưới ngưỡng nhận biết của preview; frame 60fps vẫn phân
// biệt được). Clip bị sửa → store tạo mảng keyframes mới → cache cũ
// hết hiệu lực, không có giá trị stale. Giới hạn 256 entry/mảng (FIFO).
// Render worker KHÔNG dùng hàm này nên không ảnh hưởng độ chính xác
// của bản export.
// ---------------------------------------------------------------------------
const KEYFRAME_MEMO_MAX = 256;
const keyframeMemo = new WeakMap<object, Map<number, number>>();
let keyframeMemoHits = 0;
let keyframeMemoMisses = 0;
export function memoInterpolateKeyframes(
  kfs: Parameters<typeof interpolateKeyframes>[0],
  t: number,
): number {
  const frame = Math.round(t * 120);
  let per = keyframeMemo.get(kfs as object);
  if (!per) {
    per = new Map<number, number>();
    keyframeMemo.set(kfs as object, per);
  }
  const hit = per.get(frame);
  if (hit !== undefined) {
    keyframeMemoHits++;
    return hit;
  }
  keyframeMemoMisses++;
  const v = interpolateKeyframes(kfs, t);
  per.set(frame, v);
  if (per.size > KEYFRAME_MEMO_MAX) {
    const oldest = per.keys().next().value;
    if (oldest !== undefined) per.delete(oldest);
  }
  return v;
}
/** Thống kê cache (phục vụ bench, không ảnh hưởng logic). */
export function keyframeMemoStats(): { hits: number; misses: number } {
  return { hits: keyframeMemoHits, misses: keyframeMemoMisses };
}
export function resetKeyframeMemoStats(): void {
  keyframeMemoHits = 0;
  keyframeMemoMisses = 0;
}

/** Letterbox-fit: giữ tỉ lệ, vừa khít khung hình (mirror render scale=decrease + pad). */
export function letterboxFit(
  mw: number,
  mh: number,
  W: number,
  H: number,
): { dw: number; dh: number; dx: number; dy: number } {
  const s = Math.min(W / mw, H / mh);
  const dw = mw * s;
  const dh = mh * s;
  return { dw, dh, dx: (W - dw) / 2, dy: (H - dh) / 2 };
}

/** Cover-fit: lấp đầy khung hình, crop giữa (dùng cho image fit="cover"). */
export function coverFit(
  mw: number,
  mh: number,
  W: number,
  H: number,
): { dw: number; dh: number; dx: number; dy: number } {
  const s = Math.max(W / mw, H / mh);
  const dw = mw * s;
  const dh = mh * s;
  return { dw, dh, dx: (W - dw) / 2, dy: (H - dh) / 2 };
}

// ---------------------------------------------------------------------------
// LUT → CSS filter (XẤP XỈ — xem PREVIEW_LIMITS.md)
// ---------------------------------------------------------------------------

/**
 * Ánh xạ LUT sang CSS filter gần đúng về "cảm giác màu".
 * KHÔNG pixel-perfect so với file .cube — muốn chính xác phải xem bản render.
 * (Q1 Phase 8: 110/174 mục đã được fit lại từ dữ liệu .cube thật bằng
 * least squares trên lưới màu + 500 màu held-out — script
 * apps/web/scripts/fit-lut-css.py, báo cáo fit-lut-css-report.json.
 * RMSE held-out trung bình: 24.73 → 15.98 (thang 0-255/kênh); 64 mục
 * không đạt ngưỡng cải thiện 30% nên giữ nguyên xấp xỉ viết tay, gồm
 * các LUT phi tuyến mạnh như vcut-solarized (100.35) và LUT phim đen
 * trắng (~40-54). Chi tiết xem Q1_LIMITS.md §3.)
 */
const LUT_CSS: Record<LutId, string> = {
  "cartcut-mono-neutral": "grayscale(1)",
  "cartcut-blockbuster": "contrast(1.95) saturate(1.11)",
  "cartcut-teal-orange": "sepia(0.01) saturate(1.25) hue-rotate(-1.1deg)",
  "cartcut-nordic-noir": "saturate(0.62) contrast(0.98) brightness(1.05)",
  "cartcut-honey": "sepia(0.2) saturate(1.37) brightness(1)",
  "cartcut-golden-hour": "sepia(0.12) saturate(1.25) brightness(1.08)",
  "cartcut-winter-blue": "saturate(0.82) brightness(1.02) hue-rotate(-0.5deg)",
  "cartcut-ocean": "saturate(1.17) hue-rotate(-0.1deg)",
  "cartcut-faded-seventies": "sepia(0.23) contrast(0.88) brightness(1)",
  "cartcut-super-eight": "sepia(0.17) contrast(0.88) saturate(1.01)",
  // vcut-*: xấp xỉ cảm giác màu của file .cube tự tạo
  "vcut-cinematic": "contrast(1.33) saturate(1.12) sepia(0.1)",
  "vcut-vintage-fade": "sepia(0.31) contrast(0.71) brightness(1.05) saturate(1.2)",
  "vcut-noir-contrast": "grayscale(1) contrast(1.5)",
  "vcut-cyberpunk": "saturate(1.38) contrast(1.15) hue-rotate(0.8deg)",
  "vcut-pastel-dream": "saturate(0.7) brightness(1.34) contrast(0.56)",
  "vcut-sunset-glow": "sepia(0.41) saturate(2.11) brightness(1.02)",
  "vcut-arctic": "saturate(0.86) brightness(1.04) hue-rotate(-0.1deg)",
  "vcut-faded-film": "sepia(0.29) contrast(0.63) brightness(1.05) saturate(1.11)",
  "vcut-moody-forest": "saturate(0.94) contrast(1.18) brightness(0.85) hue-rotate(0deg)",
  "vcut-warm-bloom": "sepia(0.29) saturate(1.47) brightness(1.06)",
  "slay-amber": "sepia(0.24) saturate(1.48)",
  "slay-fade": "sepia(0.15) contrast(0.81) brightness(1.01)",
  "slay-neon": "saturate(1.18) contrast(1.25)",
  "slay-film": "sepia(0.07) contrast(1.1) saturate(1.09)",
  "slay-portrait": "sepia(0.19) saturate(1.2) brightness(0.96)",
  "derby-acid": "saturate(0.72) hue-rotate(-1.8deg) contrast(0.91)",
  "derby-after": "saturate(0.8) brightness(1.05) hue-rotate(10deg)",
  "derby-club": "saturate(0.81) contrast(0.81) brightness(1.09)",
  "derby-fever": "sepia(0.5) saturate(1.4) contrast(1.15)",
  "derby-flash": "contrast(1.02) brightness(0.99)",
  "derby-hush": "saturate(0.91) contrast(0.69) brightness(1.16)",
  "derby-rush": "sepia(0.3) saturate(1.3) contrast(1.1)",
  "glassmeter-cinestill-400d": "sepia(0.2) saturate(1.2) contrast(1.1)",
  "glassmeter-cinestill-50d": "saturate(1.14) contrast(1.25) brightness(1.02)",
  "glassmeter-cinestill-800t": "sepia(0.15) saturate(1.25) hue-rotate(-10deg)",
  "glassmeter-fuji-acros-100-ii": "grayscale(1) contrast(1.1)",
  "glassmeter-fuji-industrial-100": "saturate(1.0) contrast(1.05)",
  "glassmeter-fuji-pro-400h": "sepia(0.13) saturate(0.81) brightness(1.05)",
  "glassmeter-fuji-provia-100f": "saturate(1.08) contrast(1.46)",
  "glassmeter-fuji-superia-xtra-400": "saturate(1.2) hue-rotate(-8deg)",
  "glassmeter-fuji-velvia-100": "saturate(1.23) contrast(1.78)",
  "glassmeter-fuji-velvia-50": "saturate(1.22) contrast(2.07)",
  "glassmeter-ilford-delta-100-v2": "grayscale(1) contrast(1.08)",
  "glassmeter-ilford-delta-3200-v2": "grayscale(0.8) contrast(0.59) brightness(1.19)",
  "glassmeter-ilford-delta-400": "grayscale(1) contrast(1.12)",
  "glassmeter-ilford-fp4-125-v2": "grayscale(1) contrast(1.05)",
  "glassmeter-ilford-hp5-400-v2": "grayscale(1) contrast(1.15)",
  "glassmeter-ilford-panf-50": "grayscale(1) contrast(1.03) brightness(1.02)",
  "glassmeter-ilford-xp2-super-400": "grayscale(1) contrast(1.1) sepia(0.05)",
  "glassmeter-kodak-colorplus-200": "sepia(0.15) saturate(1.38)",
  "glassmeter-kodak-double-x-v2": "grayscale(1) contrast(1.18)",
  "glassmeter-kodak-ektachrome-e100": "saturate(1.08) hue-rotate(-0.4deg) contrast(1.48)",
  "glassmeter-kodak-ektar-100": "saturate(1.4) contrast(1.12)",
  "glassmeter-kodak-gold-200": "sepia(0.17) saturate(1.35)",
  "glassmeter-kodak-portra-160": "sepia(0.12) saturate(0.83) brightness(1.02)",
  "glassmeter-kodak-portra-400": "sepia(0.15) saturate(1.05)",
  "glassmeter-kodak-portra-800": "sepia(0.18) saturate(1.08) brightness(1.01)",
  "glassmeter-kodak-tmax-100-v2": "grayscale(1) contrast(1.12)",
  "glassmeter-kodak-tmax-400-v2": "grayscale(1) contrast(1.1)",
  "glassmeter-kodak-tmax-p3200": "grayscale(0.82) contrast(0.69) brightness(1.23)",
  "glassmeter-kodak-trix-400-v2": "grayscale(1) contrast(1.2)",
  "glassmeter-kodak-ultramax-400": "saturate(1.45) contrast(1.1)",
  "vcut-desert-heat": "sepia(0.48) saturate(2.12) contrast(1.3)",
  "vcut-emerald-city": "saturate(1.2) hue-rotate(-12deg) contrast(1.1)",
  "vcut-crimson-dusk": "sepia(0.11) saturate(1.26) hue-rotate(-1.5deg) contrast(1.29)",
  "vcut-steel-blue": "saturate(0.85) hue-rotate(10deg) contrast(1.15)",
  "vcut-amber-noir": "sepia(0.17) contrast(1.33) brightness(0.86)",
  "vcut-violet-haze": "saturate(0.85) hue-rotate(0.2deg) brightness(1.1)",
  "vcut-copper-tone": "sepia(0.21) saturate(1.46) contrast(1.16)",
  "vcut-midnight-teal": "saturate(1.15) hue-rotate(-2.1deg) contrast(1.12) brightness(0.86)",
  "vcut-sepia-classic": "sepia(0.8) contrast(1.05)",
  "vcut-kodachrome-pop": "saturate(1.4) contrast(1.2)",
  "vcut-polaroid-fade": "sepia(0.26) contrast(0.61) brightness(1.12) saturate(0.99)",
  "vcut-lomography": "saturate(1.5) contrast(1.25)",
  "vcut-cross-process": "saturate(1.17) hue-rotate(0.7deg) contrast(1.15)",
  "vcut-bleach-warm": "sepia(0.3) contrast(1.15) saturate(0.9)",
  "vcut-retro-neon": "saturate(1.54) hue-rotate(-1.2deg) contrast(1.14)",
  "vcut-vhs-tracking": "sepia(0.15) saturate(1.1) contrast(0.9)",
  "vcut-bw-high-contrast": "grayscale(1) contrast(1.6)",
  "vcut-bw-soft": "grayscale(1) contrast(0.84) brightness(1)",
  "vcut-bw-selenium": "grayscale(1) sepia(0.3) contrast(1.15)",
  "vcut-bw-warm": "grayscale(1) sepia(0.25) contrast(1.1)",
  "vcut-bw-cold": "grayscale(1) hue-rotate(15deg) contrast(1.1)",
  "vcut-bw-infrared": "grayscale(0.92) contrast(1.01) brightness(1.11)",
  "vcut-forest-mist": "saturate(0.85) hue-rotate(-8deg) brightness(1.05)",
  "vcut-ocean-deep": "saturate(1.18) hue-rotate(-0.8deg) contrast(1.18)",
  "vcut-desert-dusk": "sepia(0.51) saturate(2.27) hue-rotate(0.8deg)",
  "vcut-autumn-glow": "sepia(0.22) saturate(1.56) contrast(1.15)",
  "vcut-spring-fresh": "saturate(1.2) hue-rotate(-5deg) brightness(1.03)",
  "vcut-winter-frost": "saturate(0.74) hue-rotate(0deg) brightness(1.07)",
  "vcut-neon-nights": "saturate(1.61) contrast(1.05) hue-rotate(-0.9deg)",
  "vcut-tokyo-drift": "saturate(1.35) hue-rotate(-10deg) contrast(1.2)",
  "vcut-urban-decay": "sepia(0.23) saturate(0.89) contrast(0.7)",
  "vcut-rooftop-dawn": "sepia(0.11) saturate(1.16) brightness(1.04)",
  "vcut-subway-green": "saturate(0.95) hue-rotate(0.1deg) contrast(1.12) brightness(0.87)",
  "vcut-street-sodium": "sepia(0.6) saturate(2.51) contrast(1.18)",
  "vcut-skin-glow": "sepia(0.15) saturate(1.18) brightness(1.02)",
  "vcut-soft-beauty": "sepia(0.13) saturate(1.03) brightness(1.1) contrast(0.77)",
  "vcut-golden-skin": "sepia(0.13) saturate(1.31)",
  "vcut-porcelain": "saturate(0.74) brightness(1.27) contrast(0.63)",
  "vcut-duotone-magenta": "grayscale(0.92) sepia(0) hue-rotate(180deg) saturate(0.08)",
  "vcut-duotone-cyan-orange": "grayscale(0.6) sepia(0.7) saturate(1.8) contrast(1.1)",
  "vcut-infrared-false": "hue-rotate(110.2deg) saturate(1.07)",
  "vcut-solarized": "invert(0.15) saturate(1.2) contrast(1.1)",
  // vcut-*: batch K6 Phase 6 (gen_vcut_luts3.py)
  "vcut-lagoon": "saturate(1.35) hue-rotate(8deg)",
  "vcut-deep-sea": "saturate(1.1) brightness(0.92) hue-rotate(12deg)",
  "vcut-coral-reef": "sepia(0.33) saturate(2.16)",
  "vcut-santorini": "saturate(1.21) brightness(1.08) hue-rotate(0.1deg)",
  "vcut-bali-sunset": "sepia(0.51) saturate(2.7)",
  "vcut-coffee-roast": "sepia(0.38) contrast(1.16) saturate(1.73)",
  "vcut-matcha": "saturate(1.28) hue-rotate(0deg)",
  "vcut-candy-pop": "saturate(1.7) contrast(1.2)",
  "vcut-champagne": "sepia(0.34) brightness(1.03) saturate(1.19)",
  "vcut-blood-moon": "sepia(0.41) saturate(1.81) brightness(0.96)",
  "vcut-graveyard-fog": "grayscale(0.55) brightness(1.1)",
  "vcut-toxic-green": "saturate(1.44) hue-rotate(-0.1deg)",
  "vcut-midnight-purple": "saturate(0.95) brightness(0.96) hue-rotate(0deg)",
  "vcut-crt-green": "grayscale(1) sepia(0.58) saturate(2.18) hue-rotate(77.2deg)",
  "vcut-terminal-amber": "grayscale(1) sepia(0.56) saturate(2.15)",
  "vcut-floppy-purple": "saturate(1.25) hue-rotate(15deg)",
  "vcut-vaporwave-sunset": "sepia(0.3) saturate(1.5) hue-rotate(15deg)",
  "vcut-blush-pink": "sepia(0.2) saturate(1) brightness(1.08)",
  "vcut-ivory": "sepia(0.15) brightness(1.1) saturate(0.85)",
  "vcut-silk-white": "saturate(0.7) brightness(1.06)",
  "vcut-stadium-night": "saturate(1.3) contrast(1.25)",
  "vcut-concert-laser": "saturate(1.58) hue-rotate(0deg) contrast(1.15)",
  "vcut-vinyl-warm": "sepia(0.43) saturate(1.65)",
  "vcut-bw-blueprint": "grayscale(1) sepia(0.5) hue-rotate(160deg) saturate(2)",
  "vcut-bw-sepia-deep": "grayscale(0.98) sepia(0.4)",
  "vcut-bw-night-green": "grayscale(1) sepia(0.35) hue-rotate(79deg) saturate(3)",
  "vcut-solar-flare": "sepia(0.49) saturate(2.59) brightness(1.11)",
  "vcut-prism": "saturate(1.4) hue-rotate(-10deg)",
  "vcut-acid-rain": "saturate(1.57) hue-rotate(1.1deg)",
  "vcut-synthwave-grid": "sepia(0.25) saturate(1.45) hue-rotate(18deg)",
  "vcut-monsoon-rain": "saturate(0.99) hue-rotate(0.3deg) brightness(0.97)",
  "vcut-saigon-night": "saturate(1.45) hue-rotate(10deg) contrast(1.1)",
  "vcut-hanoi-autumn": "sepia(0.44) saturate(1.97)",
  "vcut-lantern-fest": "sepia(0.44) saturate(2.24) brightness(1.07)",
  "vcut-rice-terrace": "saturate(1.35) hue-rotate(-10deg)",
  "vcut-midnight-market": "saturate(1.4) contrast(1.05)",
  "vcut-cherry-festival": "sepia(0.2) saturate(1.25) brightness(1.05)",
  "vcut-glacier-blue": "saturate(1.11) hue-rotate(0.2deg) brightness(1.05)",
  "vcut-meadow-light": "saturate(1.3) brightness(1.06)",
  "vcut-bamboo-green": "saturate(1.32) hue-rotate(-0.1deg)",
  "vcut-lotus-pink": "sepia(0.16) saturate(1.12) brightness(1.2)",
  "vcut-bubble-tea": "sepia(0.35) saturate(1.53) brightness(1.11)",
  "vcut-honey-glow": "sepia(0.4) saturate(1.91) brightness(1.07)",
  "vcut-chili-ember": "saturate(1.45) hue-rotate(-10deg) contrast(1.1)",
  "vcut-typhoon-grey": "saturate(0.52) hue-rotate(-0.2deg) brightness(1.12)",
  "vcut-ember-night": "sepia(0.35) saturate(1.54) brightness(0.93)",
  "vcut-noir-smoke": "saturate(0.3) contrast(1.15)",
  "vcut-silk-road": "sepia(0.39) saturate(1.66)",
  "vcut-opal-dream": "saturate(0.95) hue-rotate(0deg) brightness(1.3)",
  "vcut-coral-dawn": "sepia(0.37) saturate(2.05)",
  "vcut-da-lat-mist": "saturate(0.81) hue-rotate(0deg) brightness(1.17)",
  "vcut-pho-hanoi": "sepia(0.39) saturate(1.81) brightness(1.05)",
  "vcut-sea-breeze": "saturate(1.19) hue-rotate(0.4deg) brightness(1.14)",
  "vcut-sunset-beach": "sepia(0.43) saturate(2.32) hue-rotate(0.3deg)",
  "vcut-forest-deep": "saturate(1.21) hue-rotate(0.1deg) brightness(0.95)",
  "vcut-desert-sand": "sepia(0.48) saturate(1.76) brightness(1.14)",
  "vcut-winter-snow": "saturate(0.73) hue-rotate(-0.4deg) brightness(1.29)",
  "vcut-neon-city": "saturate(1.55) hue-rotate(10deg) contrast(1.1)",
  "vcut-coffee-brown": "sepia(0.41) saturate(1.57) contrast(1.04)",
  "vcut-lavender-field": "saturate(1.07) hue-rotate(0.5deg) brightness(1.18)",
  "vcut-golden-harvest": "sepia(0.54) saturate(2.5) brightness(1.02)",
  "vcut-midnight-blue": "saturate(1.11) hue-rotate(0.2deg) brightness(0.97)",
  "vcut-rose-dusk": "sepia(0.2) saturate(1.3) hue-rotate(-5deg)",
  "vcut-mint-fresh": "saturate(1.09) hue-rotate(0.6deg) brightness(1.22)",
  "vcut-amber-glow": "sepia(0.45) saturate(2.26) brightness(1.08)",
  "vcut-slate-grey": "saturate(0.6) contrast(1.08)",
  "vcut-peach-blush": "sepia(0.35) saturate(1.59) brightness(1.16)",
  "vcut-aurora": "saturate(1.32) hue-rotate(0.1deg)",
  "vcut-iced-matcha": "saturate(1.06) hue-rotate(0.3deg) brightness(1.17)",
  "vcut-reef-glow": "saturate(1.5) hue-rotate(5deg) brightness(1.03)",
};


/** Mọi LUT id trong catalog đều phải có ánh xạ CSS (test sẽ kiểm tra). */
export function lutCssFilter(lut: LutId | string): string | null {
  if ((LUT_IDS as readonly string[]).includes(lut)) {
    return LUT_CSS[lut as LutId];
  }
  return null;
}

/**
 * Chỉnh màu thủ công → CSS filter XẤP XỈ (mirror buildColorAdjustFilter).
 * Thứ tự render: color adjust TRƯỚC LUT → CSS này đứng trước lutCss.
 * temperature/tint/highlights/shadows không có CSS tương đương chính xác —
 * xấp xỉ bằng sepia/hue-rotate/brightness.
 */
export function colorAdjustCssFilter(c: ColorAdjust | undefined | null): string {
  if (!c || typeof c !== "object") return "";
  const parts: string[] = [];
  const v = (k: keyof ColorAdjust): number => c[k] ?? 0;
  const b = v("brightness");
  if (b !== 0) parts.push(`brightness(${(1 + b / 100).toFixed(3)})`);
  const ct = v("contrast");
  if (ct !== 0) parts.push(`contrast(${(1 + ct / 100).toFixed(3)})`);
  const s = v("saturation");
  if (s !== 0) parts.push(`saturate(${(1 + s / 100).toFixed(3)})`);
  const t = v("temperature");
  if (t !== 0) parts.push(`sepia(${(Math.abs(t) / 100 * 0.5).toFixed(3)})`);
  const tint = v("tint");
  if (tint !== 0) parts.push(`hue-rotate(${(-tint * 0.3).toFixed(1)}deg)`);
  const hi = v("highlights");
  if (hi !== 0) parts.push(`brightness(${(1 + hi / 100 * 0.3).toFixed(3)})`);
  const sh = v("shadows");
  if (sh !== 0) parts.push(`brightness(${(1 + sh / 100 * 0.2).toFixed(3)})`);
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Effects → CSS filter / canvas
// ---------------------------------------------------------------------------

export interface EffectsVisual {
  /** Chuỗi CSS filter (dùng cho ctx.filter), "" nếu không có. */
  css: string;
  /** intensity 0..1 của vignette (vẽ riêng bằng radial gradient), null nếu không có. */
  vignette: number | null;
  /** Effect không thể hiện được trong preview (ghi rõ cho user).
   * Từ V2 (Phase 9 đợt 10): 8 type canvas (sharpen/noise/glitch/rgb-shift/
   * shake/pixelate/mirror/edgedetect) không còn vào đây — chúng được vẽ
   * thật bằng effectCanvas, chỉ type lạ chưa biết mới bị báo. */
  skipped: VideoEffectType[];
}

/**
 * Mirror công thức intensity trong server/render/src/effects.js:
 * blur: sigma 0.5→8 | grayscale: hue s=1→0 | sepia: ma trận nội suy
 * vignette: angle π(0.1+0.3t) | noise: strength 5→50 | brightness: ±0.35
 */
export function effectsVisual(effects?: VideoEffect[]): EffectsVisual {
  const parts: string[] = [];
  let vignette: number | null = null;
  const skipped: VideoEffectType[] = [];
  for (const e of effects ?? []) {
    const t = clamp01(e.intensity ?? 0.5);
    switch (e.type) {
      case "blur":
        parts.push(`blur(${(0.5 + t * 7.5).toFixed(2)}px)`);
        break;
      case "grayscale":
        // render: hue=s=(1-t) → t=1 là đen trắng hoàn toàn = CSS grayscale(1)
        parts.push(`grayscale(${t.toFixed(3)})`);
        break;
      case "sepia":
        // render nội suy ma trận sepia; CSS sepia() dùng ma trận chuẩn khác → xấp xỉ
        parts.push(`sepia(${t.toFixed(3)})`);
        break;
      case "brightness":
        // render: eq=brightness=(t-0.5)*0.7, cộng offset -1..1 → xấp xỉ brightness(1+b)
        parts.push(`brightness(${(1 + (t - 0.5) * 0.7).toFixed(3)})`);
        break;
      case "vignette":
        vignette = t;
        break;
      case "sharpen":
      case "noise":
      case "glitch":
      case "rgb-shift":
      case "shake":
      case "pixelate":
      case "mirror":
      case "edgedetect":
        // V2 (Phase 9 đợt 10): 8 type này KHÔNG còn vào `skipped` — chúng
        // không có CSS filter tương đương nhưng được vẽ thật bằng pixel
        // shader ở bước effects của preview.tsx qua lib/effectCanvas.ts
        // (canvasEffectOps + ImageData). Không đóng góp gì vào chuỗi CSS.
        break;
      case "invert":
        // render: lutrgb nội suy val → 255-val; CSS invert() cùng ngữ nghĩa
        parts.push(`invert(${t.toFixed(3)})`);
        break;
      case "hue-rotate":
        // render: hue=h=(t-0.5)*180; CSS hue-rotate cùng đơn vị độ
        parts.push(`hue-rotate(${((t - 0.5) * 180).toFixed(1)}deg)`);
        break;
      case "old-film":
        // render: noise + nhạt màu + tối góc; CSS chỉ xấp xỉ phần màu
        parts.push(`sepia(0.3) saturate(0.8)`);
        break;
      default: {
        // type lạ: bỏ qua lặng lẽ nhưng báo để test bắt được nếu EFFECT_TYPES đổi
        const known = (EFFECT_TYPES as readonly string[]).includes(
          (e as { type: string }).type,
        );
        if (!known) skipped.push((e as { type: string }).type as VideoEffectType);
        break;
      }
    }
  }
  return { css: parts.join(" "), vignette, skipped };
}

// ---------------------------------------------------------------------------
// Motion: slow-mo nội suy frame / motion blur — S4 (Phase 9 đợt 8, gap E8).
// Shape CHÍNH THỨC của S1 (packages/video-spec/src/motion.ts, KHÔNG dùng
// shape tạm nào khác — xem MOTION_PREVIEW_LIMITS.md §0):
//   VideoClip.motion?: ClipMotion = {
//     interpolation?: "none" | "minterpolate";  // vắng = "none"
//     targetFps?: number;                       // 1..120, bắt buộc khi minterpolate
//     miMode?: "mci" | "blend";                // vắng = "mci"
//     motionBlur?: MotionBlurParams;            // { frames?: 2..8, weights?: number[] }
//   }
// Preview KHÔNG chạy minterpolate thật trên canvas: nội suy chỉ hiện badge,
// blur chỉ là ghosting xấp xỉ (không phải tmix của render). Đọc bằng
// duck-typing + khoan dung có giới hạn (xem normalizeMotion) nên clip
// chưa có motion, motion rỗng, hoặc shape tạm cũ (motionBlur boolean)
// vẫn chạy bình thường, không crash — nhưng preview KHÔNG tự "sửa" spec
// sai thành đúng (validate là việc của tầng spec/render).
// ---------------------------------------------------------------------------

/** Motion đã chuẩn hoá cho preview (mọi field lạ/rác đều về mặc định an toàn). */
export interface MotionVisual {
  /** "minterpolate" khi render sẽ nội suy, null = không nội suy. */
  interpolation: string | null;
  /** Fps đích render (nếu hợp lệ), null = không đặt. */
  targetFps: number | null;
  /** miMode render ("mci"/"blend"), null = mặc định/không đặt. */
  miMode: string | null;
  /** true = bật ghosting xấp xỉ ở preview (đường vẽ thường, xem LIMITS). */
  motionBlur: boolean;
  /** true khi có nội suy hoặc motion blur. */
  hasMotion: boolean;
  /**
   * M2 (Phase 9 đợt 9): đặc tả ghost suy ra từ motionBlur.frames/weights
   * thật (xem resolveMotionBlurGhost). null = không bật blur. Field
   * optional để code cũ dựng MotionVisual literal (vd test badge) không
   * vỡ type; normalizeMotion luôn đặt field này (null hoặc spec đầy đủ).
   */
  blurGhost?: MotionBlurGhostSpec | null;
}

/**
 * Alpha tối đa của 1 bóng ghost (bóng có trọng số lớn nhất). 0.35: đủ
 * thấy vệt mờ khi vật chuyển động nhanh, không át frame hiện tại khi vật
 * đứng yên (frame trước ≈ frame hiện tại). Các bóng khác tỉ lệ theo
 * weights (xem resolveMotionBlurGhost) — đây là "trail" xấp xỉ, KHÔNG
 * phải trung bình có trọng số của tmix (frame hiện tại vẫn vẽ đủ alpha,
 * không nhân với weights của nó).
 *
 * ĐỢT 12 (Phase 9 đợt 12, luồng T1): hằng số này và field ghostAlphas
 * bên dưới chỉ còn là MÔ TẢ trail cũ, KHÔNG dùng để composite nữa —
 * preview từ đợt 12 vẽ blend theo weights qua motionBlurBlendPlan
 * (xem GHOSTBLEND_T1_LIMITS.md). Giữ nguyên giá trị để test mô tả cũ
 * và code đọc spec cũ không vỡ.
 */
export const MOTION_BLUR_GHOST_ALPHA = 0.35;

/**
 * Công tắc tắt ghosting motion blur ở preview nếu gây giật (đặt false
 * thì preview bỏ qua blur hoàn toàn, badge vẫn hiện để báo render khác).
 */
export const MOTION_BLUR_PREVIEW_ENABLED = true;

/**
 * Đặc tả ghost cho 1 clip có motionBlur — suy ra từ frames/weights thật
 * của spec (mirror resolve mặc định của S1 trong motion.ts, nhưng khoan
 * dung: rác → fallback, không throw — validate là việc của tầng spec/render).
 *
 * Thứ tự weights theo tmix: weights[0] = frame CŨ NHẤT trong cửa sổ,
 * weights[frames-1] = frame HIỆN TẠI. Ghost chỉ gồm các frame TRƯỚC
 * (frame hiện tại vẽ riêng, đủ alpha) nên ghostAlphas dài frames-1,
 * xếp từ bóng cũ nhất → mới nhất, tương ứng weights[0..frames-2].
 */
export interface MotionBlurGhostSpec {
  /** Số frame trong cửa sổ tmix (2..8 sau resolve). */
  frames: number;
  /** Trọng số đã chuẩn hoá (tổng = 1), dài frames. */
  weights: number[];
  /**
   * Alpha vẽ mỗi bóng, xếp cũ nhất → mới nhất, dài frames-1.
   * alpha[i] = MOTION_BLUR_GHOST_ALPHA * weights[i] / max(weights[0..frames-2])
   * nên tỉ lệ giữa các bóng đúng bằng tỉ lệ weights, và bóng mạnh nhất
   * luôn = 0.35 (không phụ thuộc frames). Tổng alpha các bóng KHÔNG
   * chuẩn hoá về 1 — trail này cố ý sáng hơn tmix để nhìn thấy vệt.
   *
   * ĐỢT 12: field này chỉ còn mô tả trail cũ (xem MOTION_BLUR_GHOST_ALPHA).
   * Đường vẽ preview từ đợt 12 KHÔNG đọc field này mà composite theo
   * weights qua motionBlurBlendPlan — vì vẽ trail dưới frame hiện tại
   * đục thì ghost bị che kín hoàn toàn (xem GHOSTBLEND_T1_LIMITS.md §1).
   */
  ghostAlphas: number[];
}

/**
 * Một frame trong phép blend tmix của preview (đợt 12, luồng T1).
 * weight: trọng số đã chuẩn hoá của frame đó TRÊN CÁC FRAME CÓ MẶT
 * (tổng = 1); blendAlpha: alpha source-over khi vẽ frame đó lên lớp
 * blend (xem motionBlurBlendPlan để biết vì sao alpha này cho đúng tmix).
 */
export interface MotionBlurBlendFrame {
  /** Trọng số đã chuẩn hoá (tổng = 1 trên các frame có mặt). */
  weight: number;
  /** Alpha source-over khi vẽ frame này lên lớp blend (frame đầu = 1). */
  blendAlpha: number;
}

/**
 * Kế hoạch blend tmix cho preview từ weights thật + số bóng có snapshot.
 * Không throw, không cần DOM — test/probe được bằng Node thuần.
 *
 * Ngữ nghĩa ĐÚNG (quyết định đợt 12): render tmix cho ra trung bình có
 * trọng số Σ wᵢ·Fᵢ (w đã chuẩn hoá, tổng = 1, w[0] = frame cũ nhất,
 * w cuối = frame hiện tại). Preview muốn khớp nguyên lý đó thì KHÔNG
 * được vẽ ghost dưới frame đục (hệ số ghost = 0), mà phải composite
 * TẤT CẢ frame (ghost + hiện tại) vào 1 lớp rồi vẽ lớp đó 1 lần.
 *
 * Cách composite bằng source-over duy nhất (không cần filter lạ):
 * vẽ các frame theo thứ tự cũ nhất → hiện tại lên lớp trong suốt, với
 * alpha chạy (running average):
 *   blendAlpha[0] = 1,
 *   blendAlpha[i] = wᵢ / (w₀ + … + wᵢ)   (i ≥ 1).
 * Chứng minh bằng quy nạp: sau bước i, lớp = Σ_{j≤i} wⱼ·Fⱼ / Σ_{j≤i} wⱼ
 * (bước i: a·Fᵢ + (1−a)·lớp cũ với a = wᵢ/Σ_{j≤i} wⱼ cho đúng tử số đó).
 * Bước cuối Σ = 1 nên lớp = Σ wᵢ·Fᵢ đúng bằng tmix — với frame đục
 * (video đã letterbox/pad). Với frame có vùng trong suốt (unit đã mask),
 * công thức đúng chính xác tại vùng frame đầu đục; vùng frame đầu
 * trong suốt thì kết quả là trung bình trên các frame phủ pixel đó
 * (vẫn lộ ghost, vẫn đúng tỉ lệ weights giữa các frame phủ) — xem
 * GHOSTBLEND_T1_LIMITS.md §4.
 *
 * Cửa sổ thiếu bóng (vài frame đầu, ring chưa đầy): chỉ lấy các bóng
 * MỚI NHẤT có snapshot + frame hiện tại, rồi CHUẨN HOÁ LẠI weights của
 * cửa sổ đó về tổng 1. Tỉ lệ giữa các frame có mặt giữ nguyên, độ sáng
 * không tối đi vì thiếu bóng; frame hiện tại luôn có mặt với đúng tỉ lệ
 * tương đối của nó trong cửa sổ rút gọn.
 *
 * - weights rỗng/dài < 2 → chỉ frame hiện tại [{ weight: 1, blendAlpha: 1 }]
 *   (caller vẽ trực tiếp, không qua lớp blend — frame không ghost không đổi).
 * - ghostCount ≤ 0 → chỉ frame hiện tại (như trên).
 * - ghostCount > weights.length − 1 → kẹp về weights.length − 1.
 * Thứ tự trả về: bóng cũ nhất → mới nhất → frame hiện tại (độ dài
 * ghostCount + 1 sau kẹp).
 */
export function motionBlurBlendPlan(
  weights: readonly number[],
  ghostCount: number,
): MotionBlurBlendFrame[] {
  const currentOnly: MotionBlurBlendFrame[] = [{ weight: 1, blendAlpha: 1 }];
  if (weights.length < 2 || ghostCount <= 0) return currentOnly;
  const ghosts = Math.min(Math.floor(ghostCount), weights.length - 1);
  const window = weights.slice(weights.length - 1 - ghosts);
  const sum = window.reduce((a, b) => a + b, 0);
  if (!(sum > 0) || !Number.isFinite(sum)) return currentOnly;
  const normalized = window.map((w) => w / sum);
  let prefix = 0;
  return normalized.map((w, i) => {
    prefix += w;
    return { weight: w, blendAlpha: i === 0 ? 1 : w / prefix };
  });
}

/**
 * Resolve motionBlur (thô, duck-typed) thành đặc tả ghost. Không throw.
 * - null/undefined/false/0/chuỗi/số không hợp lệ → null (không blur).
 * - boolean true hoặc số hữu hạn > 0 (shape tạm cũ): 1 bóng alpha 0.35
 *   (tương đương frames=2 weights đều) — giữ đúng hành vi ghost cũ cho
 *   project lưu bằng shape tạm, không suy diễn frames/weights từ số đó.
 * - object { frames?, weights? }:
 *   - frames: nguyên 2..8 thì dùng; không hợp lệ → weights.length nếu
 *     weights dùng được, còn lại mặc định 3 (đúng resolve của S1).
 *   - weights: chỉ dùng khi là mảng dài 2..8, mọi phần tử hữu hạn > 0
 *     (đúng điều kiện validate S1); nếu dài khác frames thì BỎ weights,
 *     chia đều (preview không tự cắt/đệm weights cho khớp frames).
 *   - weights không dùng được (rác, tổng <= 0, có phần tử <= 0/không
 *     hữu hạn) → chia đều theo frames.
 */
export function resolveMotionBlurGhost(raw: unknown): MotionBlurGhostSpec | null {
  if (raw === null || raw === undefined || raw === false) return null;
  if (raw === true) return { frames: 2, weights: [0.5, 0.5], ghostAlphas: [MOTION_BLUR_GHOST_ALPHA] };
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    return { frames: 2, weights: [0.5, 0.5], ghostAlphas: [MOTION_BLUR_GHOST_ALPHA] };
  }
  if (typeof raw !== "object") return null;
  const rec = raw as { frames?: unknown; weights?: unknown };
  const rawFrames = rec.frames;
  const validFrames =
    typeof rawFrames === "number" && Number.isInteger(rawFrames) && rawFrames >= 2 && rawFrames <= 8
      ? rawFrames
      : null;
  const rawWeights = rec.weights;
  const usableWeights =
    Array.isArray(rawWeights) &&
    rawWeights.length >= 2 &&
    rawWeights.length <= 8 &&
    rawWeights.every((w) => typeof w === "number" && Number.isFinite(w) && w > 0)
      ? (rawWeights as number[])
      : null;
  const frames = validFrames ?? usableWeights?.length ?? 3;
  let weights: number[];
  if (usableWeights && usableWeights.length === frames) {
    const sum = usableWeights.reduce((a, b) => a + b, 0);
    weights = sum > 0 ? usableWeights.map((w) => w / sum) : usableWeights.map(() => 1 / frames);
  } else {
    weights = Array.from({ length: frames }, () => 1 / frames);
  }
  const ghostWeights = weights.slice(0, frames - 1);
  const maxW = Math.max(...ghostWeights);
  const ghostAlphas = ghostWeights.map((w) => MOTION_BLUR_GHOST_ALPHA * (maxW > 0 ? w / maxW : 0));
  return { frames, weights, ghostAlphas };
}

/**
 * Chuẩn hoá clip.motion (duck-typed, khoan dung có giới hạn): thiếu/rác →
 * mặc định, không throw. Quy tắc theo đúng shape S1:
 * - interpolation: CHỈ "minterpolate" mới tính là nội suy. "none"/vắng/
 *   giá trị lạ (kể cả "dup" của shape tạm cũ — S1 đã loại "dup" khỏi spec
 *   vì nó không nội suy frame nào) đều → null: preview không claim nội
 *   suy khi render thực ra không nội suy.
 * - targetFps: số hữu hạn > 0 thì giữ (preview chỉ hiển thị, không
 *   validate khoảng 1..120 — việc đó của tầng spec/render).
 * - miMode: "mci"/"blend" thì giữ, còn lại → null.
 * - motionBlur: S1 là OBJECT { frames?, weights? } — có object là bật.
 *   Khoan dung thêm shape tạm cũ: true hoặc số hữu hạn > 0 cũng tính là
 *   bật (để project lưu bằng shape tạm S3 vẫn hiện badge/ghost); từ M2
 *   ghost SUY RA từ frames/weights thật qua resolveMotionBlurGhost (số
 *   bóng = frames-1, alpha mỗi bóng tỉ lệ với weights), còn shape tạm cũ
 *   (không có frames/weights) vẫn về 1 bóng alpha 0.35 như trước — không
 *   bịa frames/weights từ đó.
 * - blurGhost: đặc tả ghost (null khi không blur), để preview.tsx vẽ mà
 *   không cần tự resolve lại từ motion thô.
 */
export function normalizeMotion(clip: { motion?: unknown }): MotionVisual {
  const none: MotionVisual = {
    interpolation: null,
    targetFps: null,
    miMode: null,
    motionBlur: false,
    hasMotion: false,
    blurGhost: null,
  };
  const m = (clip as { motion?: unknown } | null | undefined)?.motion;
  if (!m || typeof m !== "object") return none;
  const rec = m as unknown as Partial<ClipMotion> & Record<string, unknown>;
  const interpolation = rec.interpolation === "minterpolate" ? "minterpolate" : null;
  const rawFps = rec.targetFps;
  const targetFps =
    typeof rawFps === "number" && Number.isFinite(rawFps) && rawFps > 0
      ? rawFps
      : null;
  const miMode = rec.miMode === "mci" || rec.miMode === "blend" ? rec.miMode : null;
  const rawBlur = rec.motionBlur;
  const blurGhost = resolveMotionBlurGhost(rawBlur);
  const motionBlur = blurGhost !== null;
  return {
    interpolation,
    targetFps,
    miMode,
    motionBlur,
    hasMotion: interpolation !== null || motionBlur,
    blurGhost,
  };
}

/**
 * Text badge motion cho clip đang xem: "NỘI SUY" khi render sẽ nội suy
 * frame mới (preview KHÔNG nội suy — giữ fps project), "BLUR≈" khi có
 * motion blur (preview chỉ ghosting xấp xỉ, không phải tmix). "" = không
 * có motion, badge ẩn. Dùng cho badge DOM ở preview.tsx (cùng mẫu PROXY/LUT).
 */
export function motionBadgeText(m: MotionVisual): string {
  const parts: string[] = [];
  if (m.interpolation) parts.push("NỘI SUY");
  if (m.motionBlur) parts.push("BLUR≈");
  return parts.join(" • ");
}

// ---------------------------------------------------------------------------
// Video clip
// ---------------------------------------------------------------------------

export interface ChromaParams {
  color: string;
  similarity: number;
  blend: number;
}

export function normalizeChroma(c: ChromaKey): ChromaParams {
  return {
    color: c.color || CHROMA_DEFAULTS.color,
    similarity: c.similarity ?? CHROMA_DEFAULTS.similarity,
    blend: c.blend ?? CHROMA_DEFAULTS.blend,
  };
}

export interface VideoClipVisual {
  /**
   * Opacity HIỆU DỤNG của clip tại localT. P1 (Phase 7): render K1 đã áp
   * opacity keyframes thật (alphaextract→geq→alphamerge) nên preview cũng áp:
   * có keyframes opacity thì nội suy theo thời gian và THẮNG TUYỆT ĐỐI
   * opacity tĩnh (khớp render.js + validate.js); không có thì dùng tĩnh.
   * Lưu ý: clip đã merge transition thì render fallback về opacity tĩnh
   * (xem PREVIEW_LIMITS.md) — preview không biết trạng thái merge nên vẫn
   * áp keyframes, lệch render ở đoạn chuyển cảnh đó.
   */
  opacity: number;
  /** Offset px từ keyframes x/y — mirror buildOverlayExprs: v*(frame-unit). */
  offsetX: number;
  offsetY: number;
  /**
   * Hệ số scale nội suy từ keyframes tại localT (đã clamp [0.01, 8] như render),
   * 1 nếu không có keyframes scale. Mirror buildKeyframeTransform (render.js).
   */
  scale: number;
  /**
   * Góc xoay nội suy từ keyframes tại localT (độ, dương = chiều kim đồng hồ —
   * khớp rotate filter của FFmpeg và canvas rotate), 0 nếu không có keyframes.
   */
  rotation: number;
  /** CSS filter đã gộp LUT + effects theo đúng thứ tự render (lut trước, effects sau). */
  cssFilter: string;
  /** Id LUT của clip (nếu có) — để preview WebGL biết cần áp LUT thật. */
  lut: string | null;
  /**
   * R4 (Phase 9): chuỗi LUT đầy đủ theo thứ tự áp, do `nestedPreview`
   * đặt lên clip đã phẳng (filter.lutChain, preview-internal, không thuộc
   * spec). null = không có chuỗi (clip thường, hành vi cũ: 1 LUT).
   * Khi có chuỗi, `lut` = phần tử cuối chuỗi; đường vẽ áp lần lượt cả
   * chuỗi (WebGL từng LUT, fallback CSS đã nối trong `cssFilter`).
   */
  lutChain: string[] | null;
  /** CSS filter đã gộp KHÔNG có LUT (color + effects) — dùng khi WebGL đã áp
   * LUT thật, tránh áp LUT 2 lần (R5 Phase 9). */
  cssFilterNoLut: string;
  chroma: ChromaParams | null;
  vignette: number | null;
  skippedEffects: VideoEffectType[];
  /**
   * S4 (Phase 9 đợt 8): motion đã chuẩn hoá của clip — đọc trực tiếp từ
   * clip.motion (shape S1, xem motion.ts). buildPreviewSpec/flatten giữ
   * nguyên field qua spread nên motion không bị rơi khi làm phẳng nested
   * (xem test previewEngine.test.ts); clip không có motion thì
   * motionBlur=false, interpolation=null, hành vi cũ không đổi.
   */
  motion: MotionVisual;
}

/** Clamp scale giống hệt render (keyframes.js SCALE_MIN/SCALE_MAX). */
export const RENDER_SCALE_MIN = 0.01;
export const RENDER_SCALE_MAX = 8;
export function clampRenderScale(s: number): number {
  return Math.min(RENDER_SCALE_MAX, Math.max(RENDER_SCALE_MIN, s));
}

/**
 * Tính visual cho 1 video clip tại localT (giây từ đầu clip).
 * unitW/unitH: kích thước unit sau scale/pad trong render (= W/H khi letterbox).
 */
export function videoClipVisual(
  clip: VideoClip,
  localT: number,
  unitW: number,
  unitH: number,
  frameW: number,
  frameH: number,
): VideoClipVisual {
  const a = clip.animations;
  // Render: buildOverlayExprs → offset = interp * (main - overlay).
  // Unit trong render đã pad đúng WxH nên (frame-unit) = 0 → không di chuyển.
  // Giữ công thức tổng quát để đúng cả khi render đổi pipeline.
  const offsetX = a?.x
    ? memoInterpolateKeyframes(a.x.keyframes, localT) * (frameW - unitW)
    : 0;
  const offsetY = a?.y
    ? memoInterpolateKeyframes(a.y.keyframes, localT) * (frameH - unitH)
    : 0;
  const colorCss = colorAdjustCssFilter(clip.filter?.color);
  // R4: chuỗi LUT preview-internal (filter.lutChain, do nestedPreview đặt).
  // Không có chuỗi → hành vi cũ (1 LUT từ filter.lut). Có chuỗi → CSS nối
  // từng xấp xỉ theo đúng thứ tự áp; id không có xấp xỉ CSS (vd LUT user)
  // cho mắt xích rỗng ở fallback CSS — WebGL mới vẽ đủ chuỗi (xem LIMITS).
  const rawChain = (clip.filter as { lutChain?: unknown } | undefined)?.lutChain;
  const lutChain: string[] = Array.isArray(rawChain)
    ? rawChain.filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
  const lutCss =
    lutChain.length > 0
      ? lutChain.map((id) => lutCssFilter(id) ?? "").filter(Boolean).join(" ")
      : clip.filter?.lut
        ? (lutCssFilter(clip.filter.lut) ?? "")
        : "";
  const fx = effectsVisual(clip.effects);
  const cssFilter = [colorCss, lutCss, fx.css].filter(Boolean).join(" ");
  // R5 (Phase 9): cssFilterNoLut = cùng chuỗi nhưng không có LUT — dùng khi
  // WebGL đã áp LUT thật lên drawSrc, tránh áp LUT lần nữa qua ctx.filter.
  const cssFilterNoLut = [colorCss, fx.css].filter(Boolean).join(" ");
  // P1 (Phase 7): opacity keyframes thắng tuyệt đối opacity tĩnh (khớp
  // render K1); validate chặn giá trị ngoài [0,1] nhưng vẫn clamp phòng thủ
  // (geq của render cũng clamp lặng lẽ).
  const opacity = a?.opacity
    ? clamp01(memoInterpolateKeyframes(a.opacity.keyframes, localT))
    : (clip.opacity ?? 1);
  return {
    opacity,
    offsetX,
    offsetY,
    scale: a?.scale
      ? clampRenderScale(memoInterpolateKeyframes(a.scale.keyframes, localT))
      : 1,
    rotation: a?.rotation
      ? memoInterpolateKeyframes(a.rotation.keyframes, localT)
      : 0,
    cssFilter,
    lut: lutChain.length > 0 ? lutChain[lutChain.length - 1] : (clip.filter?.lut ?? null),
    lutChain: lutChain.length > 0 ? lutChain : null,
    cssFilterNoLut,
    chroma: clip.chromaKey ? normalizeChroma(clip.chromaKey) : null,
    vignette: fx.vignette,
    skippedEffects: fx.skipped,
    motion: normalizeMotion(clip),
  };
}

// ---------------------------------------------------------------------------
// Vị trí element video khi có scale/rotation — mirror render.js:
// unit (unitW×unitH) được scale theo hệ số nội suy rồi xoay quanh tâm;
// overlay đặt HÌNH BAO (bbox) của element đã xoay theo phân số x/y trên
// khoảng trống (frame − bbox), mặc định căn giữa (buildOverlayExprs).
// Đây là lúc keyframes x/y có tác dụng thật: khi element nhỏ hơn khung hình.
// ---------------------------------------------------------------------------

export interface VideoElementPlacement {
  /** Hệ số scale đã nội suy + clamp như render. */
  scale: number;
  /** Góc xoay đã nội suy (độ, dương = kim đồng hồ). */
  rotationDeg: number;
  /** Kích thước hình bao của element sau scale + xoay. */
  bboxW: number;
  bboxH: number;
  /** Góc trên-trái của hình bao trong toạ độ khung hình. */
  topLeftX: number;
  topLeftY: number;
  /** Tâm element (= tâm xoay/scale) trong toạ độ khung hình. */
  centerX: number;
  centerY: number;
}

export function videoElementPlacement(
  clip: VideoClip,
  localT: number,
  unitW: number,
  unitH: number,
  frameW: number,
  frameH: number,
): VideoElementPlacement {
  const a = clip.animations;
  const scale = a?.scale
    ? clampRenderScale(memoInterpolateKeyframes(a.scale.keyframes, localT))
    : 1;
  const rotationDeg = a?.rotation
    ? memoInterpolateKeyframes(a.rotation.keyframes, localT)
    : 0;
  const rad = (rotationDeg * Math.PI) / 180;
  const ew = unitW * scale;
  const eh = unitH * scale;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const bboxW = ew * cos + eh * sin;
  const bboxH = ew * sin + eh * cos;
  // Mirror buildOverlayExprs: có keyframe x/y thì dùng phân số nội suy,
  // không có thì căn giữa (0.5) — áp lên khoảng (frame − bbox) như overlay.
  const xf = a?.x ? memoInterpolateKeyframes(a.x.keyframes, localT) : 0.5;
  const yf = a?.y ? memoInterpolateKeyframes(a.y.keyframes, localT) : 0.5;
  const topLeftX = xf * (frameW - bboxW);
  const topLeftY = yf * (frameH - bboxH);
  return {
    scale,
    rotationDeg,
    bboxW,
    bboxH,
    topLeftX,
    topLeftY,
    centerX: topLeftX + bboxW / 2,
    centerY: topLeftY + bboxH / 2,
  };
}

// ---------------------------------------------------------------------------
// Chroma key — "pixel shader" đơn giản bằng Canvas 2D
// ---------------------------------------------------------------------------

export function parseHexColor(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 255, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Xoá phông ngay trên ImageData (đổi alpha tại chỗ).
 * XẤP XỈ FFmpeg chromakey (vốn tính khoảng cách trong không gian YUV):
 * ở đây dùng khoảng cách Euclid RGB chuẩn hoá.
 *   d <= similarity*0.5      → trong suốt hoàn toàn
 *   d <= + blend*0.5         → alpha nội suy (biên mềm)
 *   còn lại                  → giữ nguyên
 */
export function applyChromaKey(img: ImageData, p: ChromaParams): void {
  const [kr, kg, kb] = parseHexColor(p.color);
  const maxDist = 255 * Math.sqrt(3);
  const inner = clamp01(p.similarity) * 0.5 * maxDist;
  const outer = inner + clamp01(p.blend) * 0.5 * maxDist;
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const dr = d[i] - kr;
    const dg = d[i + 1] - kg;
    const db = d[i + 2] - kb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist <= inner) {
      d[i + 3] = 0;
    } else if (dist < outer && outer > inner) {
      d[i + 3] = Math.round(255 * ((dist - inner) / (outer - inner)));
    }
  }
}

// ---------------------------------------------------------------------------
// Mask — mirror CHÍNH XÁC công thức render (server/render/src/mask.js).
// Tọa độ mask tương đối theo KHUNG OUTPUT (unit đã letterbox về đúng WxH):
// x/y = tâm (0..1), w/h = kích thước (0..1 theo W/H), feather: dải chuyển
// tiếp = feather × cạnh ngắn hơn của mask (px). Render nhân alpha gốc với
// alpha mask (alphamerge) nên preview cũng NHÂN, không ghi đè.
// Lấy mẫu tại tọa độ nguyên (X, Y) như geq của FFmpeg — khác lấy mẫu tại
// tâm pixel nửa px, và khớp đúng trường hợp viền cứng (d = 0 → ngoài).
// Mask không hợp lệ (shape lạ, w/h <= 0, số không hữu hạn) → alpha = 1
// (bỏ qua mask, không làm đen canvas); render validator sẽ báo lỗi riêng.
// ---------------------------------------------------------------------------

/** Alpha mask (0..1) tại 1 pixel của khung W×H — cùng công thức geq render. */
export function maskAlphaAt(
  mask: ClipMask,
  W: number,
  H: number,
  px: number,
  py: number,
): number {
  const shape = mask.shape;
  const x = mask.x ?? 0.5;
  const y = mask.y ?? 0.5;
  const w = mask.w ?? 1;
  const h = mask.h ?? 1;
  const feather = mask.feather ?? 0;
  const invert = mask.invert ?? false;
  if (
    (shape !== "rect" && shape !== "ellipse") ||
    !Number.isFinite(x) || !Number.isFinite(y) ||
    !Number.isFinite(w) || !Number.isFinite(h) ||
    !Number.isFinite(feather) ||
    w <= 0 || h <= 0
  ) {
    return 1;
  }
  const wPx = w * W;
  const hPx = h * H;
  const cx = x * W;
  const cy = y * H;
  const band = Math.min(1, Math.max(0, feather)) * Math.min(wPx, hPx);
  let alpha: number;
  if (shape === "rect") {
    const x0 = (x - w / 2) * W;
    const x1 = (x + w / 2) * W;
    const y0 = (y - h / 2) * H;
    const y1 = (y + h / 2) * H;
    // Khoảng cách Chebyshev có dấu tới biên (âm = trong hình).
    const d = Math.max(Math.max(x0 - px, px - x1), Math.max(y0 - py, py - y1));
    alpha = band <= 1e-6 ? (d < 0 ? 1 : 0) : clamp01(0.5 - d / band);
  } else {
    const rx = wPx / 2;
    const ry = hPx / 2;
    const nx = (px - cx) / rx;
    const ny = (py - cy) / ry;
    const r = Math.sqrt(nx * nx + ny * ny);
    const gx = (px - cx) / (rx * rx);
    const gy = (py - cy) / (ry * ry);
    const grad = Math.sqrt(gx * gx + gy * gy);
    // d = khoảng cách xấp xỉ bậc nhất tới biên ellipse (như render).
    // Tại tâm grad = 0: render chia (-1)/0 = -inf → alpha clamp về 1;
    // giữ -Infinity/+Infinity ở đây để khớp render (không dùng -1: sẽ
    // cho 0.5 + 1/band thay vì 1).
    const d = grad > 0 ? (r - 1) / grad : (r < 1 ? -Infinity : Infinity);
    alpha = band <= 1e-6 ? (r < 1 ? 1 : 0) : clamp01(0.5 - d / band);
  }
  return invert ? 1 - alpha : alpha;
}

/**
 * Nhân alpha của từng pixel trong ImageData với alpha mask.
 * ImageData PHẢI có kích thước đúng bằng khung unit (W×H) mà mask tham
 * chiếu tới — preview.tsx vẽ unit đã letterbox về W×H rồi mới gọi hàm này
 * (khớp render: mask áp lên unit, trước SR/overlay).
 */
export function applyMask(img: ImageData, mask: ClipMask): void {
  const W = img.width;
  const H = img.height;
  const d = img.data;
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      const i = (yy * W + xx) * 4;
      if (d[i + 3] === 0) continue;
      d[i + 3] = Math.round(d[i + 3] * maskAlphaAt(mask, W, H, xx, yy));
    }
  }
}

// ---------------------------------------------------------------------------
// Speed ramp — mirror render Phase 7 P3 (tự tích phân từ speedAt;
// sourcePosAt của video-spec nay cũng đúng sau sửa Phase 8 Q3).
// ---------------------------------------------------------------------------

/**
 * Clip mang được speed ramp: video clip (AudioClip hiện không có field
 * speedKeyframes trong type, nhưng hàm vẫn chạy theo cấu trúc nếu có).
 */
export interface RampableClip {
  start: number;
  in: number;
  speed?: number;
  reverse?: boolean;
  speedKeyframes?: SpeedCurve;
}

/** true khi clip có speedKeyframes dùng được (mảng keyframes không rỗng). */
export function hasSpeedRamp(clip: RampableClip): boolean {
  const k = clip.speedKeyframes?.keyframes;
  return !!k && k.length > 0;
}

/**
 * Tốc độ phát tại localT (giây từ đầu clip, thời gian OUTPUT).
 * Có ramp → speedAt theo đường cong (ghi đè speed hằng như render);
 * không có → speed hằng (mặc định 1).
 */
export function rampSpeedAt(clip: RampableClip, localT: number): number {
  if (hasSpeedRamp(clip)) {
    try {
      return speedAt(clip.speedKeyframes!, localT);
    } catch {
      /* keyframes lỗi → fallback speed hằng */
    }
  }
  return clip.speed ?? 1;
}

/**
 * Tích phân tốc độ trên [a, b] — ĐÚNG cho đoạn con nằm trong 1 segment.
 *
 * LƯU Ý LỊCH SỬ: `integrateSpeed`/`sourcePosAt` từng tính SAI đoạn con
 * (segment linear 1→2 trên [0,4]: integrateSpeed(0,2) trả 3 thay vì 2.5)
 * — Phase 8 Q3 đã sửa ở cả 3 bản mirror (speedcurve.ts, speedcurve.js,
 * speedramp.js) bằng nguyên hàm theo easing trên đoạn con; kết quả đoạn
 * đầy đủ không đổi, và captionFollow nay dùng sourcePosAt trực tiếp.
 * Hàm này vẫn tự tích phân từ speedAt nên không phụ thuộc vào bản sửa.
 * Công thức chính xác từng easing trên đoạn con [x0,x1] ⊂ [t0,t1]:
 * linear: hình thang trên v(x0), v(x1); ease-in: ∫u²; ease-out: ∫(2u-u²);
 * bezier: Simpson 64 (giống bản gốc, vốn đã đúng).
 */
export function integrateRampSpeed(
  curve: SpeedCurve,
  a: number,
  b: number,
): number {
  if (b <= a) return 0;
  const ks = [...curve.keyframes].sort((p, q) => p.t - q.t);
  // Trùng t: keyframe sau thắng (cùng quy ước normalizeSpeedKeyframes).
  const norm: typeof ks = [];
  for (const k of ks) {
    const last = norm[norm.length - 1];
    if (last && last.t === k.t) norm[norm.length - 1] = k;
    else norm.push(k);
  }
  if (norm.length === 0) throw new Error("integrateRampSpeed: mảng keyframes rỗng");
  if (norm.length === 1) return norm[0].v * (b - a);
  const cuts = [a];
  for (const k of norm) if (k.t > a && k.t < b) cuts.push(k.t);
  cuts.push(b);
  let total = 0;
  for (let i = 0; i < cuts.length - 1; i++) {
    const x0 = cuts[i];
    const x1 = cuts[i + 1];
    const span = x1 - x0;
    let seg: { t0: number; t1: number; v0: number; v1: number; easing: string; bezier?: [number, number, number, number] } | null = null;
    for (let j = 0; j < norm.length - 1; j++) {
      if (x0 >= norm[j].t - 1e-12 && x1 <= norm[j + 1].t + 1e-12) {
        seg = { t0: norm[j].t, t1: norm[j + 1].t, v0: norm[j].v, v1: norm[j + 1].v, easing: norm[j].easing, bezier: norm[j].bezier };
        break;
      }
    }
    if (!seg) {
      // Ngoài khoảng keyframe: tốc độ hằng = giá trị biên (speedAt clamp).
      total += speedAt(curve, (x0 + x1) / 2) * span;
      continue;
    }
    const segSpan = seg.t1 - seg.t0;
    if (segSpan <= 0) {
      total += seg.v0 * span;
      continue;
    }
    const u0 = (x0 - seg.t0) / segSpan;
    const u1 = (x1 - seg.t0) / segSpan;
    if (seg.easing === "linear") {
      total += span * ((speedAt(curve, x0) + speedAt(curve, x1)) / 2);
    } else if (seg.easing === "ease-in") {
      // v = v0 + (v1-v0)u² → ∫ = span*v0 + (v1-v0)*segSpan*(u1³-u0³)/3
      total += span * seg.v0 + (seg.v1 - seg.v0) * segSpan * ((u1 ** 3 - u0 ** 3) / 3);
    } else if (seg.easing === "ease-out") {
      // v = v0 + (v1-v0)(2u-u²) → ∫ = span*v0 + (v1-v0)*segSpan*[(u²-u³/3)]
      const f = (u: number) => u * u - (u ** 3) / 3;
      total += span * seg.v0 + (seg.v1 - seg.v0) * segSpan * (f(u1) - f(u0));
    } else {
      // bezier: Simpson 64 trên [x0,x1] (giống bản gốc).
      const n = 64;
      const h = span / n;
      let s = speedAt(curve, x0) + speedAt(curve, x1);
      for (let k = 1; k < n; k++) {
        s += (k % 2 === 0 ? 2 : 4) * speedAt(curve, x0 + k * h);
      }
      total += (s * h) / 3;
    }
  }
  return total;
}

/**
 * Vị trí nguồn (tính từ clip.in) ứng với thời điểm output localT.
 * Có ramp (và không reverse — validator chặn reverse+ramp) → in +
 * ∫speed; không có ramp → sourceTimeAt chuẩn (speed hằng/reverse).
 * Reverse + ramp: render báo lỗi nên preview fallback về mapping hằng.
 */
export function rampSourceTimeAt(
  clip: RampableClip,
  timelineT: number,
): number {
  const localT = timelineT - clip.start;
  if (hasSpeedRamp(clip) && !clip.reverse) {
    try {
      if (localT <= 0) return clip.in;
      return clip.in + integrateRampSpeed(clip.speedKeyframes!, 0, localT);
    } catch {
      /* keyframes lỗi → fallback mapping hằng */
    }
  }
  return sourceTimeAt(clip as SpeedableClip, timelineT);
}

// ---------------------------------------------------------------------------
// Text clip — mirror render.js: keyframes > textfx > fadeUp > none; typewriter riêng
// ---------------------------------------------------------------------------

export interface TextMeasure {
  textW: number;
  textH: number;
}

/**
 * Phase 9 đợt 10 V4 (gap C5): text animation rotate/skew/clip qua ASS
 * (mirror server/render/src/textAnimParity.js). KHÔNG thuộc nhóm drawtext.
 */
export const PARITY_TEXT_ANIMATIONS = [
  "tiltIn",
  "skewIn",
  "slideReveal",
  "curtainIn",
] as const;

export function isParityTextAnimation(v: unknown): boolean {
  return (
    typeof v === "string" &&
    (PARITY_TEXT_ANIMATIONS as readonly string[]).includes(v)
  );
}

export interface TextClipVisual {
  /** Tâm chữ, px trong tọa độ project. */
  cx: number;
  cy: number;
  alpha: number;
  /** typewriter: số ký tự hiện ra; null = hiện toàn bộ text. */
  revealChars: number | null;
  /**
   * V4: góc nghiêng skewX, độ (chỉ parity skewIn; undefined = không nghiêng).
   * Canvas áp bằng ctx.transform(1, 0, tan(skew), 1, 0, 0) quanh tâm chữ.
   */
  skewXDeg?: number;
  /**
   * V4: hình chữ nhật cắt cho clip-reveal parity (slideReveal/curtainIn);
   * null/undefined = không cắt. Đợt 11 P4: cắt theo HỘP CHỮ (đo bằng
   * canvas của preview), không quét khung hình nữa — mirror hành vi
   * \clip hộp chữ của render (xem LIMITS đợt 11 về lệch đo canvas-vs-libass).
   */
  clipRect?: { x: number; y: number; w: number; h: number } | null;
  /**
   * P1 (Phase 7): true khi clip đi nhánh PNG SR của render (có keyframes
   * scale/rotation, không phải typewriter). Khi đó drawTextClip phải áp
   * transform translate→rotate→scale quanh tâm (xem textSrPlacement).
   */
  sr: boolean;
  /** Hệ số scale đã nội suy + clamp (chỉ có nghĩa khi sr=true). */
  scale: number;
  /** Góc xoay đã nội suy, độ, dương = kim đồng hồ (chỉ khi sr=true). */
  rotationDeg: number;
  /** Kích thước hình bao sau scale + xoay (chỉ khi sr=true; null nếu không). */
  bboxW: number | null;
  bboxH: number | null;
}

// ---------------------------------------------------------------------------
// Vị trí element chữ khi có scale/rotation — mirror nhánh PNG SR của render
// (K1, Phase 6): chữ vẽ trước ra PNG trong suốt (pad = max(4, fontSize/4)
// mỗi phía, khớp boxborderw của drawtext), rồi qua pipeline overlay giống
// video có SR: scale eval=frame + rotate với rotateExpand (mở output ra
// hình vuông đường chéo để không cắt chữ), overlay đặt HÌNH BAO theo phân
// số x/y trên khoảng trống (frame − bbox) — buildOverlayExprs: có keyframes
// x/y thì dùng phân số nội suy, KHÔNG có thì CĂN GIỮA (bỏ qua style.x/y
// tĩnh — đây là hành vi của render, preview mirror theo, xem PREVIEW_LIMITS).
// Canvas không cần làm tròn chẵn như FFmpeg (không có chroma subsampling)
// nên bbox lệch render tối đa ~1px.
// ---------------------------------------------------------------------------

export interface TextSrPlacement {
  scale: number;
  rotationDeg: number;
  bboxW: number;
  bboxH: number;
  topLeftX: number;
  topLeftY: number;
  centerX: number;
  centerY: number;
}

export function textSrPlacement(
  clip: TextClip,
  localT: number,
  frameW: number,
  frameH: number,
  m: TextMeasure,
): TextSrPlacement {
  const a = clip.animations;
  const scale = a?.scale
    ? clampRenderScale(memoInterpolateKeyframes(a.scale.keyframes, localT))
    : 1;
  const rotationDeg = a?.rotation
    ? memoInterpolateKeyframes(a.rotation.keyframes, localT)
    : 0;
  const pad = Math.max(4, Math.round(clip.style.fontSize / 4));
  const pngW = m.textW + 2 * pad;
  const pngH = m.textH + 2 * pad;
  const rad = (rotationDeg * Math.PI) / 180;
  const ew = pngW * scale;
  const eh = pngH * scale;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const bboxW = ew * cos + eh * sin;
  const bboxH = ew * sin + eh * cos;
  const xf = a?.x ? memoInterpolateKeyframes(a.x.keyframes, localT) : 0.5;
  const yf = a?.y ? memoInterpolateKeyframes(a.y.keyframes, localT) : 0.5;
  const topLeftX = xf * (frameW - bboxW);
  const topLeftY = yf * (frameH - bboxH);
  return {
    scale,
    rotationDeg,
    bboxW,
    bboxH,
    topLeftX,
    topLeftY,
    centerX: topLeftX + bboxW / 2,
    centerY: topLeftY + bboxH / 2,
  };
}

/**
 * Mirror chính xác công thức trong server/render/src/textfx.js (buildTextAnimExpr)
 * và render.js (fadeUp inline, typewriter ASS):
 *  - fadeUp:   alpha = p(0.6), y -= 30*(1-p)
 *  - fadeIn:   alpha = p(0.8)
 *  - slideInLeft:  x = xt-(1-q)*(xt+textW), alpha = q(0.7)
 *  - slideInRight: x = xt+(1-q)*(W-xt),     alpha = q(0.7)
 *  - slideUp:      y = yt+(1-q)*(H-yt),     alpha = q(0.7)
 *  - bounce:   y = yt-140*decay+40*decay*|sin(q*2π)|, alpha = p(0.3), q = p(1.0)
 *  - typewriter: ký tự i hiện từ start + i*(duration/n) — hết duration mới đủ chữ
 * Batch G (R1-070):
 *  - slideInDown: y = yt-(1-k)*(yt+textH), alpha = k(0.7)
 *  - popIn:    y = yt-24*decay, alpha = min(1,lt/0.25) (giả lập, không scale thật)
 *  - fadeOut/fadeOutUp: alpha = 1-q(0.8); fadeOutUp thêm y -= 30*q
 *  - slideOutRight: x = xt+q*(W-xt); slideOutDown: y = yt+q*(H-yt); alpha = 1-q(0.7)
 *  - wave:     y = yt+12*sin(2π*lt/1.2) (cả dòng, không từng ký tự)
 *  - blink:    alpha = lt%1<0.5 ? 1 : 0.15
 *  - shake:    x = xt+10*sin(lt*40)*max(0,1-lt/0.5)
 *  - fadeInOut: alpha = min(p(0.5), 1-q(0.5))
 * V4 (parity ASS, mirror textAnimParity.js — vị trí theo TÂM, khác drawtext):
 *  - tiltIn: rotation = -12*(1-p(0.7)), cy += 20*(1-p(0.7)), alpha = p(0.7)
 *  - skewIn: fax nội suy tuyến tính -0.466→0.1405 (0.36s)→0 (0.6s),
 *    skewXDeg = atan(fax), cx -= 30*(1-clamp(t/0.36)), alpha = p(0.6)
 *  - slideReveal: clipRect quét mép trái→phải HỘP CHỮ (đo bằng canvas,
 *    m.textW/textH) trong 1.0s — render quét hộp đo bằng PIL×0.84 nên
 *    tọa độ tuyệt đối lệch nhau, nhưng hành vi (quét trọn hộp, đủ 1.0s)
 *    thì khớp; xem LIMITS đợt 11.
 *  - curtainIn: clipRect mở từ tâm HỘP CHỮ ra hai mép hộp + mờ vào
 *    trong 0.8s (cùng lưu ý đo lường như slideReveal).
 * với p(d) = clamp(localT / d).
 */
export function textClipVisual(
  clip: TextClip,
  localT: number,
  frameW: number,
  frameH: number,
  m: TextMeasure,
): TextClipVisual {
  const st = clip.style;
  const p = (d: number) => clamp01(localT / d);
  // Batch G (R1-070): tiến trình outro trong d giây cuối clip.
  const exitP = (d: number) => clamp01(Math.max(0, (localT - (clip.duration - d)) / d));

  // 0. P1 (Phase 7): scale/rotation keyframes — render đi nhánh PNG SR
  //    (bỏ qua textfx animation, chỉ còn opacity keyframes + x/y overlay).
  //    Typewriter ngoại lệ: render dùng ASS, SR bị bỏ qua (validator cảnh
  //    báo) nên typewriter KHÔNG vào nhánh này. V4: clip parity cũng vẽ
  //    bằng ASS nên cũng KHÔNG vào nhánh SR (đi nhánh parity 0b bên dưới).
  const a = clip.animations;
  if (a && (a.scale || a.rotation) && st.animation !== "typewriter" &&
      !isParityTextAnimation(st.animation)) {
    const pl = textSrPlacement(clip, localT, frameW, frameH, m);
    const srAlpha = a.opacity
      ? memoInterpolateKeyframes(a.opacity.keyframes, localT)
      : 1;
    return {
      cx: pl.centerX,
      cy: pl.centerY,
      alpha: clamp01(srAlpha),
      revealChars: null,
      sr: true,
      scale: pl.scale,
      rotationDeg: pl.rotationDeg,
      bboxW: pl.bboxW,
      bboxH: pl.bboxH,
    };
  }

  // 0b. V4 (Phase 9 đợt 10): parity ASS — mirror textAnimParity.js.
  //     Render bỏ qua clip parity ở nhánh drawtext + PNG SR nên ASS thắng
  //     cả keyframes x/y/opacity (giống typewriter ở render; preview đặt
  //     nhánh này TRƯỚC keyframes để khớp render). Vị trí dùng ngữ nghĩa
  //     TÂM (Alignment 5 của ASS, \pos = tâm) — khác drawtext (mép trái
  //     (W-textW)*x) nhưng khớp typewriter trong cùng file này.
  //     - tiltIn: xoay -12°→0, trồi +20px→0, mờ \fad(700,0) tuyến tính.
  //     - skewIn: fax tan(-25°)=-0.466 → tan(8°)=0.1405 (0.36s) → 0 (0.6s);
  //       trượt -30px→0 trong 0.36s; mờ \fad(600,0) tuyến tính.
  //     - slideReveal: \clip quét mép trái→phải HỘP CHỮ trong 1.0s
  //       (đợt 11 P4; preview dùng hộp đo bằng canvas của chính nó).
  //     - curtainIn: \clip mở từ tâm hộp chữ ra hai mép + mờ vào, 0.8s.
  //     Xấp xỉ còn lại (xem LIMITS đợt 11): \fad tuyến tính thay cho CSS
  //     ease-out; hộp đo của preview (canvas) rộng hơn hộp của render
  //     (PIL×0.84) nên tọa độ clip tuyệt đối lệch nhau, hành vi thì khớp.
  if (isParityTextAnimation(st.animation)) {
    const cx = frameW * (st.x ?? 0.5);
    const cy = frameH * (st.y ?? 0.5);
    const base = {
      revealChars: null, sr: false, scale: 1, bboxW: null, bboxH: null,
    } as const;
    switch (st.animation) {
      case "tiltIn": {
        const k = p(0.7);
        return { ...base, cx, cy: cy + 20 * (1 - k), alpha: k, rotationDeg: -12 * (1 - k) };
      }
      case "skewIn": {
        const t = localT;
        // ASS \t nội suy TUYẾN TÍNH theo \fax (không phải theo góc):
        // đoạn 1: fax -0.466 → 0.1405 trong 0.36s; đoạn 2: 0.1405 → 0
        // trong 0.24s. Đổi fax → độ bằng atan để canvas vẽ đúng.
        const fax = t < 0.36
          ? -0.466 + (0.1405 - -0.466) * (t / 0.36)
          : 0.1405 * (1 - (t - 0.36) / 0.24);
        const skewDeg = (Math.atan(fax) * 180) / Math.PI;
        const xOff = -30 * (1 - clamp01(t / 0.36));
        return { ...base, cx: cx + xOff, cy, alpha: p(0.6), rotationDeg: 0, skewXDeg: skewDeg };
      }
      case "slideReveal": {
        const k = p(1.0);
        // Đợt 11 P4: quét theo HỘP CHỮ của preview (đo bằng canvas
        // measureText, m.textW/textH) thay vì khung hình — cùng hành vi
        // với render (quét trọn hộp trong 1.0s), nhưng hộp tuyệt đối
        // khác render vài chục px vì canvas đo chữ rộng hơn libass
        // (xem LIMITS đợt 11: lệch đo canvas-vs-libass có từ trước).
        const bx0 = Math.max(0, cx - m.textW / 2);
        const bx1 = Math.min(frameW, cx + m.textW / 2);
        const by0 = Math.max(0, cy - m.textH / 2);
        const by1 = Math.min(frameH, cy + m.textH / 2);
        return {
          ...base, cx, cy, alpha: 1, rotationDeg: 0,
          clipRect: { x: bx0, y: by0, w: (bx1 - bx0) * k, h: by1 - by0 },
        };
      }
      case "curtainIn": {
        const k = p(0.8);
        const bx0 = Math.max(0, cx - m.textW / 2);
        const bx1 = Math.min(frameW, cx + m.textW / 2);
        const by0 = Math.max(0, cy - m.textH / 2);
        const by1 = Math.min(frameH, cy + m.textH / 2);
        return {
          ...base, cx, cy, alpha: k, rotationDeg: 0,
          clipRect: { x: (bx0 + bx1) / 2 - (bx1 - bx0) * k / 2, y: by0, w: (bx1 - bx0) * k, h: by1 - by0 },
        };
      }
      default:
        break;
    }
  }

  // 1. Keyframes ưu tiên hơn mọi animation (giống render.js).
  //    drawtext: x = (w-text_w)*interp — đây là MÉP TRÁI; đổi sang tâm để vẽ canvas.
  if (a && (a.x || a.y || a.opacity)) {
    const xr = a.x ? memoInterpolateKeyframes(a.x.keyframes, localT) : (st.x ?? 0.5);
    const yr = a.y ? memoInterpolateKeyframes(a.y.keyframes, localT) : (st.y ?? 0.5);
    const alpha = a.opacity ? memoInterpolateKeyframes(a.opacity.keyframes, localT) : 1;
    return {
      cx: (frameW - m.textW) * xr + m.textW / 2,
      cy: (frameH - m.textH) * yr + m.textH / 2,
      alpha: clamp01(alpha),
      revealChars: null,
      sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null,
    };
  }

  // 2. typewriter — mirror buildTypewriterAss: hiện dần suốt duration.
  if (st.animation === "typewriter") {
    const n = [...clip.text].length;
    const shown =
      n === 0 ? 0 : Math.min(n, Math.floor((localT / clip.duration) * n) + 1);
    return {
      cx: frameW * (st.x ?? 0.5),
      cy: frameH * (st.y ?? 0.5),
      alpha: 1,
      revealChars: Math.max(0, shown),
      sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null,
    };
  }

  // 3. textfx animations — xt/yt là mép trái/trên như drawtext.
  const xt = (frameW - m.textW) * (st.x ?? 0.5);
  const yt = (frameH - m.textH) * (st.y ?? 0.5);
  const cx0 = xt + m.textW / 2;
  const cy0 = yt + m.textH / 2;
  switch (st.animation) {
    case "fadeUp": {
      const k = p(0.6);
      return { cx: cx0, cy: cy0 - 30 * (1 - k), alpha: k, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "fadeIn":
      return { cx: cx0, cy: cy0, alpha: p(0.8), revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    case "slideInLeft": {
      const q = p(0.7);
      const left = xt - (1 - q) * (xt + m.textW);
      return { cx: left + m.textW / 2, cy: cy0, alpha: q, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "slideInRight": {
      const q = p(0.7);
      const left = xt + (1 - q) * (frameW - xt);
      return { cx: left + m.textW / 2, cy: cy0, alpha: q, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "slideUp": {
      const q = p(0.7);
      const top = yt + (1 - q) * (frameH - yt);
      return { cx: cx0, cy: top + m.textH / 2, alpha: q, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "bounce": {
      const q = p(1.0);
      const decay = (1 - q) * (1 - q);
      return {
        cx: cx0,
        cy: cy0 - 140 * decay + 40 * decay * Math.abs(Math.sin(q * 2 * Math.PI)),
        alpha: p(0.3),
        revealChars: null,
        sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null,
      };
    }
    // ---- Batch G (R1-070): 10 animation mới — mirror textfx.js ----
    case "slideInDown": {
      const k = p(0.7);
      const top = yt - (1 - k) * (yt + m.textH);
      return { cx: cx0, cy: top + m.textH / 2, alpha: k, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "popIn": {
      // Giả lập pop (không scale thật — xem TEXTFX_LIMITS.md §1).
      const k = p(0.5);
      const decay = (1 - k) * (1 - k);
      return { cx: cx0, cy: cy0 - 24 * decay, alpha: Math.min(1, localT / 0.25), revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "fadeOut": {
      const k = exitP(0.8);
      return { cx: cx0, cy: cy0, alpha: 1 - k, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "fadeOutUp": {
      const k = exitP(0.8);
      return { cx: cx0, cy: cy0 - 30 * k, alpha: 1 - k, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "slideOutRight": {
      const k = exitP(0.7);
      const left = xt + k * (frameW - xt);
      return { cx: left + m.textW / 2, cy: cy0, alpha: 1 - k, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "slideOutDown": {
      const k = exitP(0.7);
      const top = yt + k * (frameH - yt);
      return { cx: cx0, cy: top + m.textH / 2, alpha: 1 - k, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "wave":
      // Wave cả dòng chữ (không từng ký tự — xem TEXTFX_LIMITS.md §3).
      return { cx: cx0, cy: cy0 + 12 * Math.sin((localT * 2 * Math.PI) / 1.2), alpha: 1, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    case "blink":
      return { cx: cx0, cy: cy0, alpha: localT % 1 < 0.5 ? 1 : 0.15, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    case "shake": {
      const decay = Math.max(0, 1 - localT / 0.5);
      return { cx: cx0 + 10 * Math.sin(localT * 40) * decay, cy: cy0, alpha: 1, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    case "fadeInOut": {
      const pin = p(0.5);
      const pout = exitP(0.5);
      return { cx: cx0, cy: cy0, alpha: Math.min(pin, 1 - pout), revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
    }
    default:
      return { cx: cx0, cy: cy0, alpha: 1, revealChars: null, sr: false, scale: 1, rotationDeg: 0, bboxW: null, bboxH: null };
  }
}

// ---------------------------------------------------------------------------
// Sticker clip — mirror buildStickerOverlay: tâm tại (W*x, H*y),
// rộng = scale*W, xoay quanh tâm, opacity.
// ---------------------------------------------------------------------------

export interface StickerVisual {
  cx: number;
  cy: number;
  wPx: number;
  opacity: number;
  rotation: number;
}

export function stickerVisual(
  clip: StickerClip,
  frameW: number,
  frameH: number,
  /** Thời gian timeline (giây, optional). Có thì sticker bám quỹ đạo track. */
  timelineT?: number,
): StickerVisual {
  // Phase 8 Q5: có track + biết thời gian thì nội suy quỹ đạo theo thời
  // gian cục bộ (t - start), khớp ngữ nghĩa render (tracking.js).
  let cx = (clip.x ?? STICKER_DEFAULTS.x) * frameW;
  let cy = (clip.y ?? STICKER_DEFAULTS.y) * frameH;
  if (clip.track && timelineT !== undefined) {
    const pts = clip.track.points;
    const lt = timelineT - clip.start;
    const pos = interpolateTrackPoints(pts, lt);
    cx = pos.x * frameW;
    cy = pos.y * frameH;
  }
  return {
    cx,
    cy,
    wPx: (clip.scale ?? STICKER_DEFAULTS.scale) * frameW,
    opacity: clip.opacity ?? STICKER_DEFAULTS.opacity,
    rotation: clip.rotation ?? STICKER_DEFAULTS.rotation,
  };
}

/**
 * Nội suy quỹ đạo track (mirror interpolateTrack của video-spec, viết lại
 * ở đây để previewEngine không phụ thuộc thêm module — cùng luật: tuyến
 * tính giữa 2 điểm, kẹp ngoài khoảng).
 */
export function interpolateTrackPoints(
  points: { t: number; x: number; y: number }[],
  t: number,
): { x: number; y: number } {
  const pts = [...points].sort((a, b) => a.t - b.t);
  if (pts.length === 0) return { x: 0.5, y: 0.5 };
  if (t <= pts[0].t) return { x: pts[0].x, y: pts[0].y };
  const last = pts[pts.length - 1];
  if (t >= last.t) return { x: last.x, y: last.y };
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const p = span <= 0 ? 0 : (t - a.t) / span;
      return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
    }
  }
  return { x: last.x, y: last.y };
}

// ---------------------------------------------------------------------------
// Image clip — fit (mirror buildImageChain: contain mặc định, cover nếu đặt)
// ---------------------------------------------------------------------------

export function imageClipFit(
  clip: ImageClip,
  mw: number,
  mh: number,
  W: number,
  H: number,
): { dw: number; dh: number; dx: number; dy: number } {
  return clip.fit === "cover"
    ? coverFit(mw, mh, W, H)
    : letterboxFit(mw, mh, W, H);
}

