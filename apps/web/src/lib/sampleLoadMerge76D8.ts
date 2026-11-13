/**
 * sampleLoadMerge76D8.ts — Phase 9 đợt 76, luồng D8 (đóng nợ race đợt 75
 * C6 §4 mục 7: project mẫu load muộn xóa file vừa import).
 *
 * Vấn đề: `loadSample` (store.ts) là async — `buildSampleProject()` ghi
 * 2 clip mẫu bằng MediaRecorder nên bay ~8 s. User import file trong
 * lúc đó thì `importFiles` đã `set()` media mới vào bin, nhưng khi lượt
 * mẫu resolve, `set({ spec, media: sampleMedia })` ghi đè TOÀN BỘ mảng
 * media → file vừa import biến mất khỏi bin (đã đo ở lần headed đầu
 * của C6: chỉ còn mau-1/mau-2); nếu user kịp kéo file lên timeline
 * trong lúc đó thì spec mẫu cũng ghi đè luôn clip vừa thêm. Guard thế
 * hệ (đợt 47 C1) không cứu được vì import không đổi project nên không
 * tăng `projectGeneration`.
 *
 * Sửa: merge thay vì ghi đè — hàm thuần này quyết định spec/media cuối
 * từ trạng thái lúc lượt mẫu bắt đầu và lúc nó resolve:
 * - media: luôn giữ media mẫu + mọi item đang có trong bin mà tên
 *   không trùng tên mẫu (item import trong lúc bay được giữ nguyên;
 *   trùng tên mẫu thì lấy bản mẫu → không nhân đôi mau-1/mau-2 khi
 *   bấm "Dự án mẫu" lần 2).
 * - spec: chỉ thay bằng spec mẫu khi user KHÔNG sửa timeline trong lúc
 *   bay (`curSpec === specAtStart`, so sánh tham chiếu — zustand set
 *   luôn tạo spec mới khi sửa nên tham chiếu đổi là dấu hiệu đủ).
 *   User đã sửa (vd kéo clip vừa import lên timeline) thì giữ nguyên
 *   spec của họ — caller chỉ gộp media mẫu vào bin, không đụng
 *   spec/projectId/playhead/history (xem store.ts `loadSample`).
 *
 * Module thuần (không import runtime, chỉ type) để test được bằng Node
 * qua `node scripts/run-node-test.mjs` — xem
 * apps/web/src/lib/codecProbeDebts76D8.test.ts.
 */
import type { VideoSpec } from "@repo-1/video-spec";
import type { MediaItem } from "../media";

export interface SampleLoadMergeInput {
  /** Spec + media mẫu vừa build xong. */
  sampleSpec: VideoSpec;
  sampleMedia: MediaItem[];
  /** Spec lúc lượt mẫu bắt đầu bay (chụp trước await). */
  specAtStart: VideoSpec;
  /** Spec + media hiện tại lúc lượt mẫu resolve. */
  curSpec: VideoSpec;
  curMedia: MediaItem[];
}

export interface SampleLoadMergeResult {
  /** Spec cuối: spec mẫu, hoặc spec hiện tại nếu user đã sửa lúc bay. */
  spec: VideoSpec;
  /** Media cuối: media mẫu + item user thêm lúc bay (không trùng tên). */
  media: MediaItem[];
  /** true = user đã sửa timeline lúc bay → caller giữ nguyên project. */
  specPreserved: boolean;
}

export function mergeSampleLoad(input: SampleLoadMergeInput): SampleLoadMergeResult {
  const specPreserved = input.curSpec !== input.specAtStart;
  const sampleNames = new Set(input.sampleMedia.map((m) => m.name));
  const kept = input.curMedia.filter((m) => !sampleNames.has(m.name));
  return {
    spec: specPreserved ? input.curSpec : input.sampleSpec,
    media: [...input.sampleMedia, ...kept],
    specPreserved,
  };
}
