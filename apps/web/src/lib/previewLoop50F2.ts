// previewLoop50F2.ts — Đợt 50 luồng F2: tách quyết định "ngủ hay tick
// tiếp" của scheduleNext trong preview.tsx thành hàm thuần, để test
// khóa được ngữ nghĩa ngủ/đánh thức mà không cần vòng lặp thật.
//
// Bối cảnh (§7.6, nối E4 §7.6): early-return `if (!ctx) return;`
// trong tick trả về mà không đặt lịch rAF — lỗ tiền sẵn. Sửa bằng cách
// chuyển quyền đặt lịch về wrapper `loop` (finally → scheduleNext),
// nhưng đổi đường này chạm ngữ nghĩa ngủ khi chưa có canvas: T5 quy
// định "chưa có canvas/wrap thì KHÔNG được ngủ (tick tiếp chờ mount)".
// scheduleNext mới giữ đúng quy tắc đó qua cờ surfaceMissing — hàm này
// là nơi duy nhất diễn đạt công thức ngủ, preview.tsx chỉ truyền
// trạng thái thật vào.
//
// Công thức ngủ = công thức cũ trong scheduleNext (preview.tsx, giữ
// nguyên từng điều kiện) + thêm một điều kiện đầu: surfaceMissing →
// KHÔNG ngủ. Các đường ngủ kiểu bỏ cuộc dùng lại helper W2/X2 để
// không lệch với định nghĩa gốc của chúng.

// Đợt 91 S2: import kèm đuôi .ts theo quy ước strip-types của repo
// (file test import "./previewLoop50F2.ts"); tsc với moduleResolution
// bundler mà không bật allowImportingTsExtensions sẽ báo TS5097 cho
// đường dẫn đuôi .ts nên 2 dòng import này mang @ts-ignore có chủ đích
// — vite và node strip-types đều resolve được đuôi .ts, chỉ tsc là cần
// bỏ qua (đã kiểm chứng: tsc 0 với @ts-ignore này).
// @ts-ignore: xem ghi chú trên (TS5097, đuôi .ts cho strip-types)
import { pauseRetryMaySleep } from "./pauseDraw41W2.ts";
// @ts-ignore: xem ghi chú trên (TS5097, đuôi .ts cho strip-types)
import { seekFailureMaySleep } from "./pauseSeekCap42X2.ts";

/** Mặt tối thiểu của trạng thái vòng lặp mà quyết định ngủ cần. */
export interface PreviewLoopSleepState {
  playing: boolean;
  pendingSeek: boolean;
  redrawFlag: boolean;
  playhead: number;
  lastDrawn: number | null;
  lastRequested: number | null;
  pauseRetryExhausted: boolean;
  seekFailureExhausted: boolean;
  /**
   * F2 (§7.6): true khi tick gần nhất không có surface để vẽ — chưa có
   * canvas/wrap, hoặc canvas.getContext("2d") trả null. Khi đó vòng lặp
   * KHÔNG được ngủ: ngủ mà không có surface thì không có gì đánh thức
   * lại đúng lúc (canvas mount không chạm store), còn tick tiếp thì
   * lần tick sau có surface sẽ vẽ bình thường. Đây chính là ngữ nghĩa
   * T5 cũ ở nhánh early-return chưa có canvas/wrap trong tickInner,
   * nay được giữ ở điểm đặt lịch duy nhất thay vì rải ở từng nhánh.
   */
  surfaceMissing: boolean;
}

/**
 * Vòng lặp có được phép ngủ ở tick này không?
 * - surfaceMissing → false (không bao giờ ngủ khi thiếu surface).
 * - Còn lại đúng công thức cũ của scheduleNext: không phát + không
 *   seek bay + không cờ vẽ lại + (đã vẽ đúng playhead | đã cạn cap
 *   vẽ lại ở đúng playhead | đã cạn cap seek ở đúng playhead).
 * Điều kiện playing/redrawFlag do hàm này giữ (không nằm trong helper
 * W2/X2), như scheduleNext cũ.
 */
export function previewLoopShouldSleep(s: PreviewLoopSleepState): boolean {
  if (s.surfaceMissing) return false;
  return (
    !s.playing &&
    !s.pendingSeek &&
    !s.redrawFlag &&
    ((s.playhead === s.lastDrawn && s.lastRequested === s.playhead) ||
      pauseRetryMaySleep(
        s.pauseRetryExhausted,
        s.pendingSeek,
        s.lastRequested,
        s.playhead,
      ) ||
      seekFailureMaySleep(
        s.seekFailureExhausted,
        s.pendingSeek,
        s.lastRequested,
        s.playhead,
      ))
  );
}
