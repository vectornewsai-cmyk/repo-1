/**
 * previewEngine.ts — Logic thuần (không DOM) tính visual transform tại thời điểm t
 * cho preview canvas, mirror render engine `server/render/src/render.js`.
 *
 * THỨ TỰ TRANSFORM (khóa cứng, phải giống render.js — video):
 *   trim → setpts=PTS-STARTPTS → SPEED → CHROMA → scale/pad → COLOR → LUT → EFFECTS
 *   → (xfade merge) → OPACITY → KEYFRAMES (x/y qua overlay)
 * Composite: video → image → sticker → text.
 * Text: keyframes (animations) > textfx animation > fadeUp > none; typewriter riêng.
 *
 * Xem PREVIEW_LIMITS.md để biết những gì chỉ là xấp xỉ.
 */
import {
  CHROMA_DEFAULTS,
  EFFECT_TYPES,
  LUT_IDS,
  STICKER_DEFAULTS,
  interpolateKeyframes,
  type ChromaKey,
  type ColorAdjust,
  type ImageClip,
  type LutId,
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
 * Ánh xạ 10 LUT sang CSS filter gần đúng về "cảm giác màu".
 * KHÔNG pixel-perfect so với file .cube — muốn chính xác phải xem bản render.
 */
const LUT_CSS: Record<LutId, string> = {
  "cartcut-mono-neutral": "grayscale(1)",
  "cartcut-blockbuster": "contrast(1.25) saturate(1.35)",
  "cartcut-teal-orange": "sepia(0.35) saturate(1.5) hue-rotate(-12deg)",
  "cartcut-nordic-noir": "saturate(0.55) contrast(1.12) brightness(0.92)",
  "cartcut-honey": "sepia(0.4) saturate(1.35) brightness(1.06)",
  "cartcut-golden-hour": "sepia(0.55) saturate(1.6) brightness(1.05)",
  "cartcut-winter-blue": "saturate(0.85) brightness(1.04) hue-rotate(8deg)",
  "cartcut-ocean": "saturate(1.35) hue-rotate(12deg)",
  "cartcut-faded-seventies": "sepia(0.45) contrast(0.85) brightness(1.08)",
  "cartcut-super-eight": "sepia(0.55) contrast(1.12) saturate(0.9)",
  // vcut-*: xấp xỉ cảm giác màu của file .cube tự tạo
  "vcut-cinematic": "contrast(1.2) saturate(1.15) sepia(0.25)",
  "vcut-vintage-fade": "sepia(0.4) contrast(0.85) brightness(1.1) saturate(0.85)",
  "vcut-noir-contrast": "grayscale(1) contrast(1.5)",
  "vcut-cyberpunk": "saturate(1.5) contrast(1.15) hue-rotate(-20deg)",
  "vcut-pastel-dream": "saturate(0.7) brightness(1.1) contrast(0.9)",
  "vcut-sunset-glow": "sepia(0.5) saturate(1.4) brightness(1.05)",
  "vcut-arctic": "saturate(0.9) brightness(1.05) hue-rotate(15deg)",
  "vcut-faded-film": "sepia(0.3) contrast(0.8) brightness(1.05) saturate(0.8)",
  "vcut-moody-forest": "saturate(0.95) contrast(1.15) brightness(0.9) hue-rotate(-10deg)",
  "vcut-warm-bloom": "sepia(0.3) saturate(1.15) brightness(1.08)",
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
  /** Effect không thể hiện được trong preview (ghi rõ cho user). */
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
        // sharpen: không có CSS tương đương; noise: nhiễu thời gian, vẽ từng frame sẽ sai
        if (!skipped.includes(e.type)) skipped.push(e.type);
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
  /** opacity tĩnh của clip (video keyframe opacity: render bỏ qua → preview bỏ qua). */
  opacity: number;
  /** Offset px từ keyframes x/y — mirror buildOverlayExprs: v*(frame-unit). */
  offsetX: number;
  offsetY: number;
  /** CSS filter đã gộp LUT + effects theo đúng thứ tự render (lut trước, effects sau). */
  cssFilter: string;
  chroma: ChromaParams | null;
  vignette: number | null;
  skippedEffects: VideoEffectType[];
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
    ? interpolateKeyframes(a.x.keyframes, localT) * (frameW - unitW)
    : 0;
  const offsetY = a?.y
    ? interpolateKeyframes(a.y.keyframes, localT) * (frameH - unitH)
    : 0;
  const colorCss = colorAdjustCssFilter(clip.filter?.color);
  const lutCss = clip.filter?.lut ? (lutCssFilter(clip.filter.lut) ?? "") : "";
  const fx = effectsVisual(clip.effects);
  const cssFilter = [colorCss, lutCss, fx.css].filter(Boolean).join(" ");
  return {
    opacity: clip.opacity ?? 1,
    offsetX,
    offsetY,
    cssFilter,
    chroma: clip.chromaKey ? normalizeChroma(clip.chromaKey) : null,
    vignette: fx.vignette,
    skippedEffects: fx.skipped,
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
// Text clip — mirror render.js: keyframes > textfx > fadeUp > none; typewriter riêng
// ---------------------------------------------------------------------------

export interface TextMeasure {
  textW: number;
  textH: number;
}

export interface TextClipVisual {
  /** Tâm chữ, px trong tọa độ project. */
  cx: number;
  cy: number;
  alpha: number;
  /** typewriter: số ký tự hiện ra; null = hiện toàn bộ text. */
  revealChars: number | null;
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

  // 1. Keyframes ưu tiên hơn mọi animation (giống render.js).
  //    drawtext: x = (w-text_w)*interp — đây là MÉP TRÁI; đổi sang tâm để vẽ canvas.
  const a = clip.animations;
  if (a && (a.x || a.y || a.opacity)) {
    const xr = a.x ? interpolateKeyframes(a.x.keyframes, localT) : (st.x ?? 0.5);
    const yr = a.y ? interpolateKeyframes(a.y.keyframes, localT) : (st.y ?? 0.5);
    const alpha = a.opacity ? interpolateKeyframes(a.opacity.keyframes, localT) : 1;
    return {
      cx: (frameW - m.textW) * xr + m.textW / 2,
      cy: (frameH - m.textH) * yr + m.textH / 2,
      alpha: clamp01(alpha),
      revealChars: null,
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
      return { cx: cx0, cy: cy0 - 30 * (1 - k), alpha: k, revealChars: null };
    }
    case "fadeIn":
      return { cx: cx0, cy: cy0, alpha: p(0.8), revealChars: null };
    case "slideInLeft": {
      const q = p(0.7);
      const left = xt - (1 - q) * (xt + m.textW);
      return { cx: left + m.textW / 2, cy: cy0, alpha: q, revealChars: null };
    }
    case "slideInRight": {
      const q = p(0.7);
      const left = xt + (1 - q) * (frameW - xt);
      return { cx: left + m.textW / 2, cy: cy0, alpha: q, revealChars: null };
    }
    case "slideUp": {
      const q = p(0.7);
      const top = yt + (1 - q) * (frameH - yt);
      return { cx: cx0, cy: top + m.textH / 2, alpha: q, revealChars: null };
    }
    case "bounce": {
      const q = p(1.0);
      const decay = (1 - q) * (1 - q);
      return {
        cx: cx0,
        cy: cy0 - 140 * decay + 40 * decay * Math.abs(Math.sin(q * 2 * Math.PI)),
        alpha: p(0.3),
        revealChars: null,
      };
    }
    // ---- Batch G (R1-070): 10 animation mới — mirror textfx.js ----
    case "slideInDown": {
      const k = p(0.7);
      const top = yt - (1 - k) * (yt + m.textH);
      return { cx: cx0, cy: top + m.textH / 2, alpha: k, revealChars: null };
    }
    case "popIn": {
      // Giả lập pop (không scale thật — xem TEXTFX_LIMITS.md §1).
      const k = p(0.5);
      const decay = (1 - k) * (1 - k);
      return { cx: cx0, cy: cy0 - 24 * decay, alpha: Math.min(1, localT / 0.25), revealChars: null };
    }
    case "fadeOut": {
      const k = exitP(0.8);
      return { cx: cx0, cy: cy0, alpha: 1 - k, revealChars: null };
    }
    case "fadeOutUp": {
      const k = exitP(0.8);
      return { cx: cx0, cy: cy0 - 30 * k, alpha: 1 - k, revealChars: null };
    }
    case "slideOutRight": {
      const k = exitP(0.7);
      const left = xt + k * (frameW - xt);
      return { cx: left + m.textW / 2, cy: cy0, alpha: 1 - k, revealChars: null };
    }
    case "slideOutDown": {
      const k = exitP(0.7);
      const top = yt + k * (frameH - yt);
      return { cx: cx0, cy: top + m.textH / 2, alpha: 1 - k, revealChars: null };
    }
    case "wave":
      // Wave cả dòng chữ (không từng ký tự — xem TEXTFX_LIMITS.md §3).
      return { cx: cx0, cy: cy0 + 12 * Math.sin((localT * 2 * Math.PI) / 1.2), alpha: 1, revealChars: null };
    case "blink":
      return { cx: cx0, cy: cy0, alpha: localT % 1 < 0.5 ? 1 : 0.15, revealChars: null };
    case "shake": {
      const decay = Math.max(0, 1 - localT / 0.5);
      return { cx: cx0 + 10 * Math.sin(localT * 40) * decay, cy: cy0, alpha: 1, revealChars: null };
    }
    case "fadeInOut": {
      const pin = p(0.5);
      const pout = exitP(0.5);
      return { cx: cx0, cy: cy0, alpha: Math.min(pin, 1 - pout), revealChars: null };
    }
    default:
      return { cx: cx0, cy: cy0, alpha: 1, revealChars: null };
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
): StickerVisual {
  return {
    cx: (clip.x ?? STICKER_DEFAULTS.x) * frameW,
    cy: (clip.y ?? STICKER_DEFAULTS.y) * frameH,
    wPx: (clip.scale ?? STICKER_DEFAULTS.scale) * frameW,
    opacity: clip.opacity ?? STICKER_DEFAULTS.opacity,
    rotation: clip.rotation ?? STICKER_DEFAULTS.rotation,
  };
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
