// previewClipKey62R6.ts — Phase 9 đợt 62, luồng R6: khóa instance cho clip
// preview (đóng nợ đợt 61 §5.8 = LIMITS R8 §5.5, xem
// docs/PHASE9_ROUND62_R6_PAUSE_STALL_LIMITS.md).
//
// Vấn đề: attribution `skippedReasonsByClip` (R8) + tập
// `tickSkippedClipIds` (Q6) đều key theo `clip.id` — id của clip LÁ.
// Khi cùng một nested project được dùng 2 lần (2 nested clip khác id
// ngoài nhưng cùng leaf id trong), spec phẳng có 2 clip cùng `id`:
// 1 instance stall → cả 2 instance cùng bị ẩn lý do (hoặc cùng bị hiện
// lý do sai). Cần key theo INSTANCE, không theo leaf id.
//
// Định danh instance = `nestedPath` của lá (chuỗi id nested bao ngoài,
// từ ngoài vào trong) + leaf id:
//   - clip tầng ngoài: nestedPath [] → key = đúng clip.id (không đổi).
//   - lá trong nested "nA": key = "nA/leaf-1".
//   - lá lồng 2 cấp "nA" > "nB": key = "nA/nB/leaf-1".
// `nestedPath` đã có sẵn trong `FlatClip` + `ClipScope` nên không cần
// thêm dữ liệu nào ở tầng flatten; chỉ cần nối chuỗi đúng chỗ.
//
// Để phía vẽ (preview.tsx) đọc được cùng key đó, `buildPreviewSpecDetailed`
// / failsoft đóng dấu key lên từng đoạn lá nested trong spec phẳng bằng
// field `__vcutInstanceKey` (xem `stampPreviewInstanceKey`). Field này
// CHỈ sống trên bản sao spec phẳng của preview (clip lá đã copy khi
// flatten/split), không chạm spec gốc trong store, không đi vào render
// hay file lưu — render có đường flatten riêng. Clip không có dấu thì
// `previewClipInstanceKey` trả về đúng `clip.id` (tương thích ngược:
// mọi spec cũ / spec phẳng / test cũ không đổi hành vi).
//
// File thuần TS, không import gì — cả nestedPreview.ts,
// previewEngine.ts và preview.tsx đều import được mà không tạo cycle.
export const PREVIEW_INSTANCE_KEY = "__vcutInstanceKey";

/**
 * Key instance của một clip lá: namespace theo chuỗi nested bao ngoài.
 * nestedPath rỗng/undefined → đúng clipId (clip tầng ngoài không đổi).
 */
export function scopedClipId(
  nestedPath: readonly string[] | undefined,
  clipId: string,
): string {
  if (!nestedPath || nestedPath.length === 0) return clipId;
  return `${nestedPath.join("/")}/${clipId}`;
}

/** Mặt tối thiểu của clip mà helper đọc key cần (id + dấu instance nếu có). */
export interface PreviewClipKeyLike {
  readonly id: string;
  readonly [PREVIEW_INSTANCE_KEY]?: unknown;
}

/**
 * Key instance của clip trong spec phẳng: dấu `__vcutInstanceKey` nếu
 * có (lá nested đã đóng dấu khi flatten), ngược lại đúng `clip.id`.
 * Không bao giờ throw; dấu rỗng/không phải chuỗi thì fallback về id.
 */
export function previewClipInstanceKey(clip: PreviewClipKeyLike): string {
  const v = clip[PREVIEW_INSTANCE_KEY];
  return typeof v === "string" && v.length > 0 ? v : clip.id;
}

/**
 * Đóng dấu key instance lên một bản sao clip lá (không sửa object gốc):
 * nestedPath rỗng → trả đúng object cũ (không copy, không dấu);
 * ngược lại → bản copy `{...clip, [PREVIEW_INSTANCE_KEY]: scopedKey}`.
 * Dùng ở buildPreviewSpecDetailed / failsoft khi đẩy đoạn lá nested
 * vào spec phẳng.
 */
export function stampPreviewInstanceKey<T extends { readonly id: string }>(
  clip: T,
  nestedPath: readonly string[],
): T {
  const key = scopedClipId(nestedPath, clip.id);
  if (key === clip.id) return clip;
  return { ...clip, [PREVIEW_INSTANCE_KEY]: key };
}
