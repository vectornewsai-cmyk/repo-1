// holdFrame.ts — Quyết định draw / hold / skip cho 1 video clip ở preview
// (Phase 9 đợt 26, luồng J4; sửa nợ I6 §5h của đợt 25; đợt 27 luồng K4
// bổ sung cờ stepping cho phát ngược).
//
// Bối cảnh: trong lúc PHÁT trên máy yếu, decoder phần mềm không kịp
// realtime → `readyState` của element tụt xuống < 2 → guard cũ
// (`readyState >= 2 && videoWidth > 0`) trong drawVideoClip bỏ qua mọi
// frame, mà renderFrame đã xóa nền đen mỗi tick trước đó, nên canvas đen
// kịt trong lúc phát (dừng lại thì fix §5g vẽ lại đúng). Sửa: khi đang
// PHÁT mà frame chưa sẵn nhưng đã từng có frame tốt, preview VẼ LẠI
// frame tốt cuối cùng (hold) thay vì để nền đen; khi PAUSED thì giữ
// hành vi cũ (skip) vì nhánh pause seek rồi mới vẽ — vẽ frame cũ sau
// scrub sẽ là frame SAI vị trí, tệ hơn đen một tick.
//
// Hàm này thuần (không DOM, không React) để unit-test được; phần cache
// canvas frame tốt nằm trong preview.tsx (cần document/canvas) và chỉ
// gọi hàm này để quyết định. "Đang phát" ở tầng gọi được suy ra từ
// `!videoElement.paused` (xem LIMITS: không luồn trạng thái playing của
// store qua drawVideoClip để khỏi đụng vùng transition/dip của luồng
// khác; hệ quả: phát ngược — syncMedia giữ element ở paused và seek
// từng frame — vẫn rơi vào nhánh skip như cũ, xem LIMITS §4).

/** Quyết định vẽ cho 1 video clip tại 1 tick. */
export type VideoFrameDecision = "draw" | "hold" | "skip";

export interface VideoFrameReadiness {
  /** HTMLMediaElement.readyState (0..4). */
  readyState: number;
  /** HTMLVideoElement.videoWidth (0 khi chưa có metadata). */
  videoWidth: number;
  /** HTMLVideoElement.paused — false ≈ đang phát (xem ghi chú đầu file). */
  paused: boolean;
  /** Đã từng lưu frame tốt cho clip này chưa (cache trong preview.tsx). */
  hasHeldFrame: boolean;
  /**
   * Đợt 27 K4: true khi playhead đang chạy theo từng frame nhưng element
   * vẫn paused vì đang seek-stepping (phát ngược toàn cục, hoặc clip
   * reverse mà syncMedia giữ paused + seek từng frame). Khi stepping,
   * clip được đối xử như đang phát đối với quyết định hold, dù paused.
   * Nhánh pause/scrub thật để false (mặc định) nên vẫn skip như cũ.
   */
  stepping?: boolean;
}

/**
 * - draw: có frame hiện tại dùng được (readyState >= 2 = HAVE_CURRENT_DATA
 *   trở lên, và đã biết kích thước) — vẽ element trực tiếp, đồng thời
 *   tầng gọi lưu frame này vào cache.
 * - hold: KHÔNG có frame hiện tại, nhưng đang phát và đã có frame tốt
 *   cũ — tầng gọi vẽ lại cache (không vẽ nền đen đè lên).
 * - skip: mọi trường hợp còn lại — chưa từng có frame tốt (không có gì
 *   để giữ, đen là không tránh được), hoặc đang PAUSED mà không stepping
 *   (nhánh pause sẽ seek rồi vẽ đúng frame; vẽ frame cũ sau scrub là
 *   sai vị trí). PAUSED + stepping (phát ngược) thì hold, không skip.
 *
 * Lưu ý: `videoWidth > 0` một mình KHÔNG đủ để draw — ở readyState 1
 * (HAVE_METADATA) đã biết kích thước nhưng chưa chắc có frame hiện
 * tại. Harness Chromium (xem PHASE9_ROUND26_J4_HOLD_FRAME_LIMITS.md
 * §2) đo được 2 hành vi khác nhau ở RS=1: trước frame đầu, drawImage
 * là no-op (canvas giữ nguyên → sau khi renderFrame xóa nền vẫn đen);
 * sau khi đã có frame, Chromium vẽ frame cũ cuối (không đen, nhưng là
 * frame do trình duyệt giữ, không kiểm chứng được ở tầng unit và có
 * thể khác nhau giữa các trình duyệt). Vì vậy nới guard thành
 * `videoWidth > 0` KHÔNG được chọn: nó vẫn đen trước frame đầu, và
 * sau đó thì giữ frame theo cách phụ thuộc trình duyệt, không test
 * được. Nhánh hold (vẽ lại frame tốt do chính mình cache) là cách
 * xác định, độc lập trình duyệt, và khóa được bằng unit test.
 */
export function decideVideoFrame(r: VideoFrameReadiness): VideoFrameDecision {
  if (r.readyState >= 2 && r.videoWidth > 0) return "draw";
  // Đợt 27 K4: stepping (phát ngược) cũng tính là "đang phát" — element
  // paused nhưng playhead đang chạy từng frame, nên hold thay vì skip.
  // Tầng gọi vẫn phải chặn frame stale riêng (so currentTime với target
  // seek, xem preview.tsx): decide ở đây chỉ lo draw/hold/skip, không
  // biết target nên không tự kết luận frame có đúng vị trí hay không.
  if ((!r.paused || r.stepping === true) && r.hasHeldFrame) return "hold";
  return "skip";
}
