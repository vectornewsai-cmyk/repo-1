/**
 * transitions.ts — Định nghĩa transition types cho video-spec.
 *
 * NGUYÊN TẮC (giống index.ts): chỉ đưa vào spec những gì render được THẬT.
 * Mỗi type trong union này tương ứng 1 entry trong
 * `server/render/src/transitions.js` và đã được kiểm chứng bằng MP4 thật.
 *
 * ⚠️ MIRROR: validate.js của render worker có bản mirror bằng JS thuần —
 * thêm type mới ở đây thì PHẢI cập nhật cả validate.js và transitions.js.
 */

/** Tất cả transition types hợp lệ (bao gồm "none" = không hiệu ứng). */
export const TRANSITION_TYPES = [
  "none",
  "fade",
  "fadeblack",
  "fadewhite",
  "wipeleft",
  "wiperight",
  "wipeup",
  "wipedown",
  "slideleft",
  "slideright",
  "dissolve",
  "circleopen",
  "radial",
] as const;

export type TransitionType = (typeof TRANSITION_TYPES)[number];

/** Metadata hiển thị cho UI (tiếng Việt). */
export const TRANSITION_META: Record<
  TransitionType,
  { label: string; description: string; category: string }
> = {
  none: { label: "Không", description: "Cắt cứng, không hiệu ứng chuyển cảnh", category: "none" },
  fade: { label: "Mờ dần", description: "Hai cảnh hòa vào nhau (crossfade cổ điển)", category: "fade" },
  fadeblack: { label: "Mờ qua đen", description: "Mờ dần qua màn hình đen rồi hiện cảnh mới", category: "fade" },
  fadewhite: { label: "Mờ qua trắng", description: "Mờ dần qua màn hình trắng rồi hiện cảnh mới", category: "fade" },
  wipeleft: { label: "Quét sang trái", description: "Cảnh mới quét từ phải sang, đẩy cảnh cũ sang trái", category: "wipe" },
  wiperight: { label: "Quét sang phải", description: "Cảnh mới quét từ trái sang, đẩy cảnh cũ sang phải", category: "wipe" },
  wipeup: { label: "Quét lên trên", description: "Cảnh mới quét từ dưới lên, đẩy cảnh cũ lên trên", category: "wipe" },
  wipedown: { label: "Quét xuống dưới", description: "Cảnh mới quét từ trên xuống, đẩy cảnh cũ xuống dưới", category: "wipe" },
  slideleft: { label: "Trượt sang trái", description: "Hai cảnh trượt ngang cùng nhau sang trái", category: "slide" },
  slideright: { label: "Trượt sang phải", description: "Hai cảnh trượt ngang cùng nhau sang phải", category: "slide" },
  dissolve: { label: "Hòa tan", description: "Cảnh cũ tan thành hạt li ti, cảnh mới hiện dần", category: "fx" },
  circleopen: { label: "Vòng tròn mở", description: "Cảnh mới hiện ra từ một vòng tròn nở dần ở giữa", category: "fx" },
  radial: { label: "Xoay tỏa tròn", description: "Cảnh mới xoay tỏa ra như cánh quạt", category: "fx" },
};

/** Kiểm tra một giá trị có phải TransitionType hợp lệ không. */
export function isTransitionType(v: unknown): v is TransitionType {
  return (
    typeof v === "string" &&
    (TRANSITION_TYPES as readonly string[]).includes(v)
  );
}

/**
 * Transition — mở rộng từ `Transition` trong index.ts.
 * Giữ nguyên shape `{ type, duration }` để tương thích ngược.
 */
export interface Transition {
  type: TransitionType;
  /** Độ dài transition (giây), >= 0 */
  duration: number;
}
