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
  // TransitionHarvest: 30 transition xfade còn thiếu — đã kiểm chứng bằng MP4 thật
  "vertclose",
  "horzclose",
  "diagtr",
  "diagbl",
  "diagbr",
  "hlslice",
  "hrslice",
  "vuslice",
  "vdslice",
  "fadegrays",
  "wipetl",
  "wipetr",
  "wipebl",
  "wipebr",
  "squeezeh",
  "squeezev",
  "zoomin",
  "fadefast",
  "fadeslow",
  "hlwind",
  "hrwind",
  "vuwind",
  "vdwind",
  "coverleft",
  "coverright",
  "coverup",
  "coverdown",
  "revealleft",
  "revealright",
  "revealup",
  "revealdown",
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
  // TransitionHarvest
  vertclose: { label: "Khép dọc", description: "Hai nửa trên-dưới khép lại vào giữa, lộ cảnh mới", category: "wipe" },
  horzclose: { label: "Khép ngang", description: "Hai nửa trái-phải khép lại vào giữa, lộ cảnh mới", category: "wipe" },
  diagtr: { label: "Chéo góc phải-trên", description: "Cảnh mới quét chéo từ góc phải-trên", category: "wipe" },
  diagbl: { label: "Chéo góc trái-dưới", description: "Cảnh mới quét chéo từ góc trái-dưới", category: "wipe" },
  diagbr: { label: "Chéo góc phải-dưới", description: "Cảnh mới quét chéo từ góc phải-dưới", category: "wipe" },
  hlslice: { label: "Cắt lát ngang trái", description: "Cảnh mới hiện qua các lát cắt ngang từ trái", category: "fx" },
  hrslice: { label: "Cắt lát ngang phải", description: "Cảnh mới hiện qua các lát cắt ngang từ phải", category: "fx" },
  vuslice: { label: "Cắt lát dọc lên", description: "Cảnh mới hiện qua các lát cắt dọc từ dưới lên", category: "fx" },
  vdslice: { label: "Cắt lát dọc xuống", description: "Cảnh mới hiện qua các lát cắt dọc từ trên xuống", category: "fx" },
  fadegrays: { label: "Mờ qua xám", description: "Mờ dần qua tông xám rồi hiện cảnh mới", category: "fade" },
  wipetl: { label: "Quét góc trái-trên", description: "Cảnh mới quét từ góc trái-trên theo đường chéo", category: "wipe" },
  wipetr: { label: "Quét góc phải-trên", description: "Cảnh mới quét từ góc phải-trên theo đường chéo", category: "wipe" },
  wipebl: { label: "Quét góc trái-dưới", description: "Cảnh mới quét từ góc trái-dưới theo đường chéo", category: "wipe" },
  wipebr: { label: "Quét góc phải-dưới", description: "Cảnh mới quét từ góc phải-dưới theo đường chéo", category: "wipe" },
  squeezeh: { label: "Ép ngang", description: "Cảnh cũ bị ép dẹt theo chiều ngang, cảnh mới giãn ra", category: "fx" },
  squeezev: { label: "Ép dọc", description: "Cảnh cũ bị ép dẹt theo chiều dọc, cảnh mới giãn ra", category: "fx" },
  zoomin: { label: "Zoom vào", description: "Cảnh mới zoom phóng to dần từ giữa", category: "fx" },
  fadefast: { label: "Mờ nhanh", description: "Hòa vào nhau với tốc độ nhanh ở đầu", category: "fade" },
  fadeslow: { label: "Mờ chậm", description: "Hòa vào nhau với tốc độ chậm rãi", category: "fade" },
  hlwind: { label: "Gió ngang trái", description: "Cảnh mới thổi vào từ trái như cơn gió ngang", category: "slide" },
  hrwind: { label: "Gió ngang phải", description: "Cảnh mới thổi vào từ phải như cơn gió ngang", category: "slide" },
  vuwind: { label: "Gió dọc lên", description: "Cảnh mới thổi vào từ dưới lên như cơn gió", category: "slide" },
  vdwind: { label: "Gió dọc xuống", description: "Cảnh mới thổi vào từ trên xuống như cơn gió", category: "slide" },
  coverleft: { label: "Phủ sang trái", description: "Cảnh mới phủ lên từ phải, che dần cảnh cũ sang trái", category: "slide" },
  coverright: { label: "Phủ sang phải", description: "Cảnh mới phủ lên từ trái, che dần cảnh cũ sang phải", category: "slide" },
  coverup: { label: "Phủ lên trên", description: "Cảnh mới phủ lên từ dưới, che dần cảnh cũ lên trên", category: "slide" },
  coverdown: { label: "Phủ xuống dưới", description: "Cảnh mới phủ lên từ trên, che dần cảnh cũ xuống dưới", category: "slide" },
  revealleft: { label: "Hé lộ sang trái", description: "Cảnh cũ trượt sang phải, hé lộ cảnh mới bên trái", category: "slide" },
  revealright: { label: "Hé lộ sang phải", description: "Cảnh cũ trượt sang trái, hé lộ cảnh mới bên phải", category: "slide" },
  revealup: { label: "Hé lộ lên trên", description: "Cảnh cũ trượt xuống, hé lộ cảnh mới bên trên", category: "slide" },
  revealdown: { label: "Hé lộ xuống dưới", description: "Cảnh cũ trượt lên, hé lộ cảnh mới bên dưới", category: "slide" },
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
