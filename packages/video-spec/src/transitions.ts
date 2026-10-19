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
  // R1-073 (Batch G): 15 transition mới — đã kiểm chứng bằng MP4 thật
  "smoothleft",
  "smoothright",
  "smoothup",
  "smoothdown",
  "slideup",
  "slidedown",
  "circleclose",
  "circlecrop",
  "rectcrop",
  "pixelize",
  "hblur",
  "distance",
  "vertopen",
  "horzopen",
  "diagtl",
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
  // R1-073 (Batch G)
  smoothleft: { label: "Trượt mượt sang trái", description: "Cảnh mới trượt mượt từ phải sang, có làm mờ biên", category: "slide" },
  smoothright: { label: "Trượt mượt sang phải", description: "Cảnh mới trượt mượt từ trái sang, có làm mờ biên", category: "slide" },
  smoothup: { label: "Trượt mượt lên trên", description: "Cảnh mới trượt mượt từ dưới lên, có làm mờ biên", category: "slide" },
  smoothdown: { label: "Trượt mượt xuống dưới", description: "Cảnh mới trượt mượt từ trên xuống, có làm mờ biên", category: "slide" },
  slideup: { label: "Trượt lên trên", description: "Hai cảnh trượt dọc cùng nhau lên trên", category: "slide" },
  slidedown: { label: "Trượt xuống dưới", description: "Hai cảnh trượt dọc cùng nhau xuống dưới", category: "slide" },
  circleclose: { label: "Vòng tròn khép", description: "Vòng tròn khép dần từ ngoài vào, lộ cảnh mới", category: "fx" },
  circlecrop: { label: "Cắt vòng tròn", description: "Cảnh cũ co dần thành vòng tròn rồi biến mất", category: "fx" },
  rectcrop: { label: "Cắt chữ nhật", description: "Cảnh cũ co dần thành hình chữ nhật rồi biến mất", category: "fx" },
  pixelize: { label: "Điểm ảnh hóa", description: "Cảnh cũ vỡ thành ô vuông pixel rồi chuyển sang cảnh mới", category: "fx" },
  hblur: { label: "Mờ ngang", description: "Cảnh cũ mờ nhòe theo chiều ngang rồi chuyển cảnh", category: "fx" },
  distance: { label: "Khoảng cách", description: "Cảnh mới tiến lại gần từ xa như hiệu ứng zoom", category: "fx" },
  vertopen: { label: "Mở dọc", description: "Cảnh mới mở ra từ giữa theo chiều dọc", category: "wipe" },
  horzopen: { label: "Mở ngang", description: "Cảnh mới mở ra từ giữa theo chiều ngang", category: "wipe" },
  diagtl: { label: "Chéo góc trái-trên", description: "Cảnh mới quét chéo từ góc trái-trên", category: "wipe" },
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
