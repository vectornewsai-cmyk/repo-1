/**
 * textfx.ts — Định nghĩa text animation types cho video-spec (Phase TextFX).
 *
 * Mở rộng `TextStyle.animation` trong index.ts (hiện tại: "none" | "fadeUp" | "typewriter").
 * Mỗi animation ở đây tương ứng 1 entry trong `server/render/src/textfx.js`
 * và đã được kiểm chứng bằng MP4 thật (xem TEXTFX_LIMITS.md).
 *
 * NGUYÊN TẮC: chỉ đưa vào spec những gì render được THẬT bằng drawtext.
 * drawtext hỗ trợ biểu thức theo `t` cho x, y, alpha — nhưng KHÔNG cho fontsize
 * (xem TEXTFX_LIMITS.md về giới hạn này).
 *
 * ⚠️ MIRROR: validate.js của render worker có bản mirror bằng JS thuần —
 * thêm animation mới ở đây thì PHẢI cập nhật cả validate.js và textfx.js.
 */

/** Tất cả text animations hợp lệ. */
export const TEXT_ANIMATIONS = [
  "none",
  "fadeUp",
  "fadeIn",
  "slideInLeft",
  "slideInRight",
  "slideUp",
  "bounce",
  "typewriter",
] as const;

export type TextAnimation = (typeof TEXT_ANIMATIONS)[number];

/** Metadata hiển thị cho UI (tiếng Việt). */
export const TEXT_ANIMATION_META: Record<
  TextAnimation,
  { label: string; description: string }
> = {
  none: { label: "Không", description: "Hiện ngay, không hiệu ứng" },
  fadeUp: { label: "Mờ + trồi lên", description: "Hiện dần, trồi lên 30px" },
  fadeIn: { label: "Mờ dần vào", description: "Độ trong suốt 0 → 100% trong 0.8s" },
  slideInLeft: { label: "Trượt từ trái", description: "Chữ trượt từ ngoài mép trái vào" },
  slideInRight: { label: "Trượt từ phải", description: "Chữ trượt từ ngoài mép phải vào" },
  slideUp: { label: "Trượt từ dưới lên", description: "Chữ trượt từ dưới màn hình lên" },
  bounce: { label: "Nảy", description: "Chữ rơi từ trên xuống, nảy nhẹ rồi đứng yên" },
  typewriter: { label: "Gõ từng chữ", description: "Hiện từng ký tự như đang gõ máy" },
};

/** Kiểm tra một giá trị có phải TextAnimation hợp lệ không. */
export function isTextAnimation(v: unknown): v is TextAnimation {
  return (
    typeof v === "string" &&
    (TEXT_ANIMATIONS as readonly string[]).includes(v)
  );
}

/** Các animation do textfx.js render (drawtext). Không bao gồm "typewriter" (dùng ASS). */
export const DRAWTEXT_ANIMATIONS: readonly TextAnimation[] = [
  "none",
  "fadeUp",
  "fadeIn",
  "slideInLeft",
  "slideInRight",
  "slideUp",
  "bounce",
];

/** Animation này có được render bằng drawtext không? */
export function isDrawtextAnimation(v: unknown): v is TextAnimation {
  return (
    typeof v === "string" &&
    (DRAWTEXT_ANIMATIONS as readonly string[]).includes(v)
  );
}
