// holdCacheKey63R6.ts — Phase 9 đợt 63, luồng R6: key hold cache theo
// INSTANCE + ánh xạ nguồn (đóng nợ đợt 62 §4 mục 6 = LIMITS R6 §5.3).
//
// Vấn đề: hold cache trong preview.tsx key theo `heldFrameKey(clip.id,
// clip.src)` — leaf id + src. Hai case sai thật:
//   (a) 2 instance nested cùng leaf id + cùng src nhưng khác `in` (vd
//       nA/leaf-1 in=0 và nB/leaf-1 in=5, cùng valid.mp4): cùng key nên
//       dùng CHUNG 1 slot — instance B stall thì hold frame của A (sai
//       vị trí nguồn), dù A và B là 2 clip khác nhau trên timeline.
//       Attribution (đợt 62 R6 (c)) đã tách theo instance, nhưng hold
//       cache thì chưa — cùng một lỗi "trùng leaf id" ở tầng khác.
//   (b) cùng instance đổi `in` (trim điểm vào) hoặc đổi `speed`/
//       `reverse`: key cũ không đổi nên slot cũ (frame của ánh xạ cũ)
//       có thể được hold trước khi draw mới kịp ghi đè.
// Sửa: key = key instance (`previewClipInstanceKey` — dấu
// `__vcutInstanceKey` trên spec phẳng, fallback đúng clip.id như R6)
// + src + `in` + `speed` + `reverse`. `speedKeyframes` (ramp) KHÔNG
// đưa vào key — ánh xạ lúc đó phụ thuộc cả đường cong, serialize nó
// vào key là quá tay cho 1 cache tối đa 16 slot; trim/speed đổi vẫn
// đi qua seek + draw mới ghi đè slot ngay (xem LIMITS §4.3).
//
// File thuần TS, chỉ import previewClipInstanceKey (thuần, 0 import)
// nên không tạo cycle; test được bằng Node với mock clip.
import { previewClipInstanceKey } from "./previewClipKey62R6";

/** Mặt tối thiểu của clip mà key hold cache cần. */
export interface HoldCacheClipLike {
  readonly id: string;
  readonly src: string;
  /** Điểm cắt vào trong file nguồn (giây). */
  readonly in?: number;
  /** Tốc độ phát, mặc định 1. */
  readonly speed?: number;
  /** Phát ngược đoạn nguồn. */
  readonly reverse?: boolean;
  /** Dấu key instance của đợt 62 R6 (xem previewClipKey62R6.ts). */
  readonly __vcutInstanceKey?: unknown;
}

/**
 * Key slot hold cache cho 1 clip: instance + src + ánh xạ nguồn
 * (`in`/`speed`/`reverse`). Hai clip khác instance, khác src, hoặc
 * khác ánh xạ nguồn thì key khác nhau — không dùng chung frame giữ.
 * Cùng clip, cùng ánh xạ thì key như nhau (slot được ghi đè mỗi lần
 * draw như cũ). Định dạng khóa bằng test.
 */
export function heldFrameCacheKey63R6(clip: HoldCacheClipLike): string {
  const instanceKey = previewClipInstanceKey(clip);
  const srcIn = typeof clip.in === "number" ? clip.in : 0;
  const speed = typeof clip.speed === "number" ? clip.speed : 1;
  const reverse = clip.reverse === true ? 1 : 0;
  return `${instanceKey}::${clip.src}::in=${srcIn}::sp=${speed}::rv=${reverse}`;
}
