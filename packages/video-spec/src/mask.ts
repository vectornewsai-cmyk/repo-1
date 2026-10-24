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
 * Preview canvas CHƯA hiển thị mask (xem MASK_LIMITS.md) — mask chỉ có
 * tác dụng khi render.
 */

/** Hình dạng mask. */
export type MaskShape = "rect" | "ellipse";

export const MASK_SHAPES: readonly MaskShape[] = ["rect", "ellipse"] as const;

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

/** Chuẩn hoá mask thiếu field về default (không mutate input). */
export function normalizeMask(m: ClipMask): ClipMask {
  return {
    shape: m.shape,
    x: m.x ?? MASK_DEFAULTS.x,
    y: m.y ?? MASK_DEFAULTS.y,
    w: m.w ?? MASK_DEFAULTS.w,
    h: m.h ?? MASK_DEFAULTS.h,
    feather: m.feather ?? MASK_DEFAULTS.feather,
    invert: m.invert ?? false,
  };
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
  return errors;
}
