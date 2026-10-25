/**
 * mask.ts — Mask cho clip video/image (Phase 7 P4).
 *
 * Một mask che phần clip nằm NGOÀI hình: chỉ vùng trong hình được giữ lại,
 * phần còn lại trở nên trong suốt (composite lên nền/timeline sẽ lộ nội
 * dung bên dưới — giống mask của CapCut về ngữ nghĩa, nhưng thiết kế và
 * tên field là của VCut).
 *
 * TỌA ĐỘ (quan trọng): x/y/w/h là tương đối theo KHUNG HÌNH OUTPUT
 * (unit đã letterbox về đúng WxH), không phải theo file nguồn:
 * - x, y: tâm mask, 0..1 (0.5 = giữa khung). Cho phép ngoài [0,1] để mask
 *   lệch ra ngoài khung.
 * - w, h: kích thước mask, 0..1 theo chiều rộng/cao khung (1 = phủ kín).
 * - feather: 0..1 — dải chuyển tiếp mềm ở viền, bằng feather × cạnh ngắn
 *   hơn của mask (tính theo pixel). 0 = viền cứng.
 * - invert: true = đảo ngược — giữ phần NGOÀI hình, che phần trong.
 *
 * Render worker implement bằng FFmpeg thật (server/render/src/mask.js):
 * tách alpha → geq nhân luma theo biểu thức hình → alphamerge, nên mask
 * GIỮ alpha gốc (chroma key, video nguồn có alpha) thay vì ghi đè.
 * Preview canvas hiển thị mask từ Phase 8 Q1 (apps/web/src/preview.tsx).
 *
 * Phase 9 D4 — mask keyframes theo thời gian: `keyframes` (tùy chọn) cho
 * phép vị trí/kích thước mask (x/y/w/h) thay đổi theo thời gian, nội suy
 * TUYẾN TÍNH giữa các keyframe, giữ nguyên (hold) ngoài đoạn keyframe.
 * feather/invert giữ TĨNH (không keyframe). Thời gian t tính theo giây
 * tương đối từ lúc clip bắt đầu trên timeline (0 = clip.start), KHỚP với
 * thời gian cục bộ của unit trong render (mask áp sau khi unit đã chuẩn
 * hoá về WxH, trước setpts lên timeline) và với localT của preview.
 * Render: video mask animation (mask_anim.py vẽ PNG từng frame → ffv1
 * gray) dùng chung đường movie+blend nhanh của R2, KHÔNG dùng geq chậm.
 */

/** Hình dạng mask. */
export type MaskShape = "rect" | "ellipse";

export const MASK_SHAPES: readonly MaskShape[] = ["rect", "ellipse"] as const;

/**
 * Một keyframe hình học của mask (Phase 9 D4).
 * t: giây tương đối từ lúc clip bắt đầu (0 = clip.start); x/y/w/h: cùng
 * ngữ nghĩa như field tĩnh của ClipMask. feather/invert KHÔNG có keyframe.
 */
export interface MaskKeyframe {
  /** Thời gian keyframe, giây, >= 0, tương đối từ clip.start. */
  t: number;
  /** Tâm ngang tại keyframe, tương đối 0..1. */
  x: number;
  /** Tâm dọc tại keyframe, tương đối 0..1. */
  y: number;
  /** Rộng tại keyframe, tương đối 0..1 theo chiều rộng khung, > 0. */
  w: number;
  /** Cao tại keyframe, tương đối 0..1 theo chiều cao khung, > 0. */
  h: number;
}

export interface ClipMask {
  shape: MaskShape;
  /** Tâm theo chiều ngang, tương đối 0..1 (mặc định 0.5). */
  x: number;
  /** Tâm theo chiều dọc, tương đối 0..1 (mặc định 0.5). */
  y: number;
  /** Rộng, tương đối 0..1 theo chiều rộng khung (mặc định 1). */
  w: number;
  /** Cao, tương đối 0..1 theo chiều cao khung (mặc định 1). */
  h: number;
  /** Độ mềm viền 0..1 (mặc định 0 = viền cứng). */
  feather: number;
  /** Đảo mask: giữ ngoài, che trong (mặc định false). */
  invert?: boolean;
  /**
   * Keyframe hình học (Phase 9 D4, tùy chọn). Khi có ít nhất 1 keyframe,
   * hình học mask tại thời điểm t được nội suy tuyến tính từ keyframes
   * (giữ nguyên ngoài đoạn), field x/y/w/h tĩnh chỉ còn là fallback khi
   * không có keyframe. Mảng không cần sắp sẵn — normalizeMask sắp theo t,
   * trùng t thì keyframe sau thắng.
   */
  keyframes?: MaskKeyframe[];
}

/** Mask mặc định: phủ kín khung, viền cứng (tương đương không mask). */
export const MASK_DEFAULTS = {
  shape: "rect",
  x: 0.5,
  y: 0.5,
  w: 1,
  h: 1,
  feather: 0,
} as const satisfies Omit<ClipMask, "invert">;

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Sắp keyframe theo t, trùng t thì sau thắng (không mutate input). */
export function sortMaskKeyframes(kfs: MaskKeyframe[]): MaskKeyframe[] {
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const out: MaskKeyframe[] = [];
  for (const kf of sorted) {
    const last = out[out.length - 1];
    if (last && last.t === kf.t) out[out.length - 1] = { ...kf };
    else out.push({ ...kf });
  }
  return out;
}

/** Mask có keyframe hình học không (ít nhất 1 keyframe hợp lệ dạng). */
export function hasMaskKeyframes(m: ClipMask): boolean {
  return Array.isArray(m.keyframes) && m.keyframes.length > 0;
}

/** Chuẩn hoá mask thiếu field về default (không mutate input). */
export function normalizeMask(m: ClipMask): ClipMask {
  const out: ClipMask = {
    shape: m.shape,
    x: m.x ?? MASK_DEFAULTS.x,
    y: m.y ?? MASK_DEFAULTS.y,
    w: m.w ?? MASK_DEFAULTS.w,
    h: m.h ?? MASK_DEFAULTS.h,
    feather: m.feather ?? MASK_DEFAULTS.feather,
    invert: m.invert ?? false,
  };
  if (hasMaskKeyframes(m)) out.keyframes = sortMaskKeyframes(m.keyframes!);
  return out;
}

/**
 * Nội suy tuyến tính hình học mask tại thời gian cục bộ t (giây, tương đối
 * từ clip.start). Không keyframe → giá trị tĩnh; trước keyframe đầu / sau
 * keyframe cuối → giữ nguyên (hold). Mirror chính xác ở mask.js (render)
 * và mask_anim.py (vẽ frame) — cùng công thức, cùng hold.
 */
export function interpolateMaskAt(
  m: ClipMask,
  t: number,
): { x: number; y: number; w: number; h: number } {
  const base = { x: m.x, y: m.y, w: m.w, h: m.h };
  if (!hasMaskKeyframes(m)) return base;
  const kfs = sortMaskKeyframes(m.keyframes!);
  if (t <= kfs[0].t) return { x: kfs[0].x, y: kfs[0].y, w: kfs[0].w, h: kfs[0].h };
  const last = kfs[kfs.length - 1];
  if (t >= last.t) return { x: last.x, y: last.y, w: last.w, h: last.h };
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
      return {
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
        w: a.w + (b.w - a.w) * f,
        h: a.h + (b.h - a.h) * f,
      };
    }
  }
  return base; // không tới được (đã chặn hold 2 đầu), giữ để typecheck yên tâm
}

/** Mask đầy đủ tại thời gian t: shape/feather/invert giữ nguyên, x/y/w/h nội suy. */
export function maskGeometryAt(m: ClipMask, t: number): ClipMask {
  const g = interpolateMaskAt(m, t);
  return { ...m, x: g.x, y: g.y, w: g.w, h: g.h, keyframes: undefined };
}

/**
 * Validate một mask. Trả về mảng lỗi (rỗng = hợp lệ).
 * Mask rỗng (w<=0 hoặc h<=0) bị coi là lỗi — mask phải nhìn thấy được.
 */
export function validateMask(m: unknown): string[] {
  const errors: string[] = [];
  if (typeof m !== "object" || m === null || Array.isArray(m)) {
    return ["mask phải là một object { shape, x, y, w, h, feather }"];
  }
  const s = m as Record<string, unknown>;
  if (!(MASK_SHAPES as readonly string[]).includes(s["shape"] as string)) {
    errors.push(`mask.shape phải là "rect" | "ellipse", nhận được: ${JSON.stringify(s["shape"])}`);
  }
  for (const key of ["x", "y"] as const) {
    if (!isFiniteNumber(s[key])) {
      errors.push(`mask.${key} phải là số hữu hạn, nhận được: ${JSON.stringify(s[key])}`);
    }
  }
  for (const key of ["w", "h"] as const) {
    if (!isFiniteNumber(s[key]) || (s[key] as number) <= 0) {
      errors.push(`mask.${key} phải là số > 0, nhận được: ${JSON.stringify(s[key])}`);
    }
  }
  if (!isFiniteNumber(s["feather"]) || (s["feather"] as number) < 0 || (s["feather"] as number) > 1) {
    errors.push(`mask.feather phải là số trong 0..1, nhận được: ${JSON.stringify(s["feather"])}`);
  }
  if (s["invert"] !== undefined && typeof s["invert"] !== "boolean") {
    errors.push(`mask.invert phải là boolean, nhận được: ${JSON.stringify(s["invert"])}`);
  }
  // Phase 9 D4: keyframes (tùy chọn) — mảng, mỗi entry đủ t/x/y/w/h hợp lệ.
  // t không bị chặn trên theo duration: keyframe vượt duration chỉ hold,
  // render/preview tự giữ giá trị cuối, không lỗi.
  if (s["keyframes"] !== undefined) {
    if (!Array.isArray(s["keyframes"])) {
      errors.push(`mask.keyframes phải là mảng, nhận được: ${JSON.stringify(s["keyframes"])}`);
    } else {
      s["keyframes"].forEach((kf: unknown, i: number) => {
        const k = kf as Record<string, unknown>;
        if (typeof kf !== "object" || kf === null || Array.isArray(kf)) {
          errors.push(`mask.keyframes[${i}] phải là object { t, x, y, w, h }`);
          return;
        }
        if (!isFiniteNumber(k["t"]) || (k["t"] as number) < 0) {
          errors.push(`mask.keyframes[${i}].t phải là số >= 0, nhận được: ${JSON.stringify(k["t"])}`);
        }
        for (const key of ["x", "y"] as const) {
          if (!isFiniteNumber(k[key])) {
            errors.push(`mask.keyframes[${i}].${key} phải là số hữu hạn, nhận được: ${JSON.stringify(k[key])}`);
          }
        }
        for (const key of ["w", "h"] as const) {
          if (!isFiniteNumber(k[key]) || (k[key] as number) <= 0) {
            errors.push(`mask.keyframes[${i}].${key} phải là số > 0, nhận được: ${JSON.stringify(k[key])}`);
          }
        }
      });
    }
  }
  return errors;
}
