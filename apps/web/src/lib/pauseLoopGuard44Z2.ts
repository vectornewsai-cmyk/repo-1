// pauseLoopGuard44Z2.ts — Đợt 44 luồng Z2: sửa bẫy ngủ/branch guard khi
// scrub về đúng t đã vẽ sau khi cạn cap (nợ đợt 43 Y2 §5.2).
//
// Trạng thái kẹt (tái hiện bằng mô hình vòng lặp cũ trong
// pauseLoopGuard44Z2.test.ts + script /tmp, dùng đúng helper thật):
// sau khi cạn cap seek ở t_bad (vd 1,5), vòng lặp giữ lastDrawn = t_old
// (frame cũ đã vẽ, vd 0,1) và lastRequested = t_bad (giữ để chặn request
// mới, theo X2). User scrub playhead về đúng t_old:
//  - Nhánh request-seek: t_old === lastDrawn → không vào, không reset cap.
//  - Nhánh vẽ lại: pauseTickNeedsRetry đòi t === lastRequested
//    (t_old !== t_bad) → không vào.
//  - scheduleNext: đường ngủ thường đòi lastRequested === playhead
//    (t_bad !== t_old) → sai; 2 đường ngủ kiểu bỏ cuộc cũng đòi
//    lastRequested === playhead → sai.
// Kết quả: cả 3 đường đều đóng, vòng lặp tick mãi không làm việc gì
// (Y2 đo ticks 502 → 1699 trong 60 s). Cùng bẫy xảy ra với cap W2
// (pauseRetryExhausted, lastRequested ngầm là t đã cạn).
//
// Sửa (nhỏ nhất, chỉ ở trạng thái đã vẽ đúng): khi playhead hiện tại
// đúng bằng lastDrawn (canvas đã hiện đúng frame tại t này) mà cap nào
// đó vẫn cạn ở một t khác, thì cap đó hết hiệu lực — reset nó và căn
// lastRequested về playhead để đường ngủ thường xét đúng. Điều này
// không đụng trạng thái "đang ở t đã cạn" (playhead === target cạn thì
// guard trả null, giữ nguyên hành vi bỏ cuộc của X2/W2), không đụng
// seek đang bay (pendingSeek → null, để .then của seek đó tự xử lý),
// và không đụng trạng thái chưa từng vẽ (lastDrawn null → null).
// Hệ quả phụ có lợi, không phải mục tiêu riêng: sau khi ngủ yên ở
// t_old, scrub tiếp về t_bad sẽ đi nhánh request-seek mới (vì
// lastRequested đã về t_old) trên element mới mà Y2 đã drop/tạo lại —
// tức t_bad được thử lại một cách có kiểm soát thay vì kẹt vĩnh viễn
// ở đẳng thức lastRequested === t_bad cũ.

/** Mặt tối thiểu của trạng thái vòng lặp pause mà guard cần. */
export interface PauseLoopGuardState {
  lastDrawn: number | null;
  lastRequested: number | null;
  pendingSeek: boolean;
  pauseRetryExhausted: boolean;
  seekFailureExhausted: boolean;
  seekFailureTarget: number | null;
}

/** Kế hoạch khôi phục: cap nào reset + lastRequested mới. */
export interface DrawnPlayheadRecovery {
  resetPauseRetry: boolean;
  resetSeekFailure: boolean;
  lastRequested: number;
}

/**
 * Lập kế hoạch khôi phục khi playhead đang ở đúng t đã vẽ nhưng còn cap
 * cạn ở t khác. Trả null = giữ nguyên mọi trạng thái (không phải trường
 * hợp bẫy). Hàm thuần để test khóa được mà không cần vòng lặp thật.
 */
export function planDrawnPlayheadRecovery(
  s: PauseLoopGuardState,
  playhead: number,
): DrawnPlayheadRecovery | null {
  if (s.lastDrawn === null || s.lastDrawn !== playhead) return null;
  if (s.pendingSeek) return null;
  const resetSeekFailure =
    s.seekFailureExhausted &&
    s.seekFailureTarget !== null &&
    s.seekFailureTarget !== playhead;
  const resetPauseRetry =
    s.pauseRetryExhausted &&
    s.lastRequested !== null &&
    s.lastRequested !== playhead;
  if (!resetSeekFailure && !resetPauseRetry) return null;
  return { resetPauseRetry, resetSeekFailure, lastRequested: playhead };
}
