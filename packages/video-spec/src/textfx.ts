/**
 * textfx.ts — Định nghĩa text animation types cho video-spec (Phase TextFX).
 *
 * Mở rộng `TextStyle.animation` trong index.ts (hiện tại: "none" | "fadeUp" | "typewriter").
 * Mỗi animation ở đây tương ứng 1 entry trong `server/render/src/textfx.js`
 * (drawtext) hoặc `server/render/src/textAnimParity.js` (ASS, đợt 10 V4)
 * và đã được kiểm chứng bằng MP4 thật (xem TEXTFX_LIMITS.md và
 * TEXT_ANIM_PARITY_LIMITS.md).
 *
 * NGUYÊN TẮC: chỉ đưa vào spec những gì render được THẬT bằng drawtext
 * hoặc ASS. drawtext hỗ trợ biểu thức theo `t` cho x, y, alpha — nhưng
 * KHÔNG cho fontsize, xoay, nghiêng hay clip (xem TEXTFX_LIMITS.md);
 * nhóm rotate/skew/clip đi đường ASS (textAnimParity.js).
 *
 * ⚠️ MIRROR: validate.js của render worker có bản mirror bằng JS thuần —
 * thêm animation mới ở đây thì PHẢI cập nhật cả validate.js, textfx.js
 * (nếu đi drawtext) hoặc textAnimParity.js (nếu đi ASS).
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
  // Batch G (R1-070): entrance thêm
  "slideInDown",
  "popIn",
  // Batch G (R1-070): exit animations (cần clipEnd khi render)
  "fadeOut",
  "fadeOutUp",
  "slideOutRight",
  "slideOutDown",
  // Batch G (R1-070): loop / emphasis / combo
  "wave",
  "blink",
  "shake",
  "fadeInOut",
  // Phase 9 đợt 10 V4: rotate/skew/clip qua ASS (textAnimParity.js) —
  // KHÔNG thêm vào DRAWTEXT_ANIMATIONS bên dưới.
  "tiltIn",
  "skewIn",
  "slideReveal",
  "curtainIn",
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
  // Batch G (R1-070)
  slideInDown: { label: "Trượt từ trên xuống", description: "Chữ trượt từ trên màn hình xuống" },
  popIn: { label: "Bật vào", description: "Hiện nhanh + nảy nhẹ (giả lập pop, không scale thật)" },
  fadeOut: { label: "Mờ dần ra", description: "Mờ dần trong 0.8s cuối clip" },
  fadeOutUp: { label: "Mờ + bay lên", description: "Bay lên 30px + mờ dần trong 0.8s cuối" },
  slideOutRight: { label: "Trượt ra phải", description: "Trượt ra ngoài mép phải + mờ dần cuối clip" },
  slideOutDown: { label: "Trượt xuống dưới", description: "Trượt xuống dưới màn hình + mờ dần cuối clip" },
  wave: { label: "Sóng", description: "Chữ dập dềnh lên xuống liên tục (cả dòng, không từng ký tự)" },
  blink: { label: "Nhấp nháy", description: "Chữ nhấp nháy hiện/ẩn liên tục" },
  shake: { label: "Rung", description: "Chữ rung ngang trong 0.5s đầu (nhấn mạnh)" },
  fadeInOut: { label: "Mờ vào + mờ ra", description: "Mờ dần vào 0.5s đầu, mờ dần ra 0.5s cuối" },
  // Phase 9 đợt 10 V4 (ASS — xem TEXT_ANIM_PARITY_LIMITS.md)
  tiltIn: { label: "Nghiêng vào", description: "Xoay -12° + trồi lên + mờ vào trong 0.7s (ASS)" },
  skewIn: { label: "Nghiêng xiên vào", description: "SkewX -25° → +8° → 0° + trượt từ trái trong 0.6s (ASS)" },
  slideReveal: { label: "Lộ dần từ trái", description: "Mặt nạ cắt quét theo hộp chữ từ trái sang phải trong 1.0s (ASS)" },
  curtainIn: { label: "Màn kéo mở", description: "Mặt nạ cắt mở từ tâm hộp chữ ra hai bên + mờ vào trong 0.8s (ASS)" },
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
  "slideInDown",
  "popIn",
  "fadeOut",
  "fadeOutUp",
  "slideOutRight",
  "slideOutDown",
  "wave",
  "blink",
  "shake",
  "fadeInOut",
];

/** Animation này có được render bằng drawtext không? */
export function isDrawtextAnimation(v: unknown): v is TextAnimation {
  return (
    typeof v === "string" &&
    (DRAWTEXT_ANIMATIONS as readonly string[]).includes(v)
  );
}
