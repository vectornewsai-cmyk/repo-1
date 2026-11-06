// pauseDraw41W2.ts — Đợt 41 luồng W2: đặt cap cho vòng lặp vẽ lại
// pause của đợt 40 V3 (nợ đợt 40 §5.7, xem
// docs/PHASE9_ROUND41_W2_PAUSE_T0_LIMITS.md).
//
// Vấn đề: V3 sửa "ngủ với nền đen" bằng cách giữ vòng lặp thức và vẽ
// lại mỗi tick khi seek đã xong nhưng frame chưa vẽ (pauseTickNeedsRetry
// trong pauseDraw40V3.ts). Với media hỏng vĩnh viễn — element không bao
// giờ có frame (seek đã xong, readyState mãi < 2 nên decideVideoFrame
// skip mãi) — vòng lặp tick ở tốc độ rAF mãi thay vì ngủ. V3 ghi rõ
// đánh đổi này và chưa đặt giới hạn vì sợ phá hội tụ dưới tải.
//
// Cap ở đây: đếm số lần render pause LIÊN TIẾP bị skip (cả lần render
// trong .then của seek lẫn các tick vẽ lại sau đó, cùng một playhead
// t). Đạt cap thì vòng lặp được phép NGỦ dù lastDrawn !== t, với điều
// kiện không còn seek bay và lastRequested vẫn là t — tức ngủ ở trạng
// thái "đã bỏ cuộc có chủ đích", khác với bug cũ "ngủ vì tưởng đã vẽ".
// Trạng thái bỏ cuộc này chỉ sống tới khi có seek mới / justPaused /
// redrawFlag (preview.tsx reset nó ở cả 3 chỗ đó), nên lần scrub,
// phát-tạm-dừng hay đổi nội dung tiếp theo đều vẽ lại bình thường.
//
// Vì sao cap đếm TICK chứ không đếm GIÂY: dưới tải, tick rAF chậm lại
// nên 600 tick cho element NHIỀU thời gian tường hơn (hội tụ muộn vẫn
// kịp), trong khi ở máy nhanh 600 tick chỉ ~10 s (60 Hz) hoặc ~5 s
// (120 Hz) rồi ngủ — đúng thứ cần chặn là "quay mãi", không phải
// "chờ lâu". Bằng chứng đợt 40: đường retry hội tụ sau 3 skip dưới
// tải nặng — cap 600 gấp 200 lần con số đó, nên không cắt hội tụ thực
// tế nào đã quan sát được; nếu tương lai có trường hợp cần > 600 skip
// thì đó là tín hiệu để tăng cap kèm bằng chứng, không phải để bỏ cap.
//
// Đánh đổi còn lại (ghi rõ, không giấu):
//  - Media chỉ CHẬM hơn cap (sẵn sàng sau khi vòng lặp đã ngủ): frame
//    không tự hiện cho tới khi user tác động (scrub sang t khác, bấm
//    phát/tạm dừng, đổi nội dung) — vì element sẵn sàng không chạm
//    store nên không có gì đánh thức vòng lặp đang ngủ. Đây là giá
//    phải trả để media HỎNG không quay rAF mãi; với cap 600 tick thì
//    trường hợp "chậm hơn cap" thực tế chỉ xảy ra khi máy gần như
//    đứng hình, lúc đó scrub lại cũng là hành vi user tự nhiên.
//  - Cap này CHỈ chặn vòng lặp vẽ lại (render-retry). Media hỏng theo
//    kiểu seek timeout / seek lỗi đi đường khác trong preview.tsx
//    (reset lastRequested → tick sau request seek mới) và KHÔNG bị
//    cap này chặn — xem LIMITS §nợ. Đừng claim cap này sửa mọi dạng
//    media hỏng.
//  - Scrub về ĐÚNG t đã bỏ cuộc mà không đổi playhead (store không
//    đổi giá trị nên không đánh thức vòng lặp) vẫn giữ nền đen cho tới
//    lần tác động khác; scrub sang t khác thì seek mới reset cap.

/**
 * Số lần render pause liên tiếp bị skip tối đa trước khi bỏ cuộc và
 * cho vòng lặp ngủ. 600 tick ≈ 10 s ở 60 Hz, ≈ 5 s ở 120 Hz, lâu hơn
 * dưới tải vì tick rAF giãn ra (xem ghi chú đầu file).
 */
export const PAUSE_RETRY_TICK_CAP = 600;

// ROUND50-F2 (§7.7, nợ C3 §9 mục 4): trần TƯỜNG cho cùng chuỗi skip
// trên — cap 600 tick KHÔNG chặn được thời gian quay dưới tải: tick
// rAF giãn ra thì 600 tick kéo dài theo (đo headed baseline đợt này:
// 6,1 tick/s → 103,6 s mới ngủ, gấp ~10 lần con số 10 s ở 60 Hz;
// C3 đo 19 tick/s → 30–40 s). Trần tường cắt đúng cái cần chặn là
// "quay mãi theo giờ tường", trong khi giữ nguyên hành vi ở máy đủ
// nhanh: ở 60 Hz thì 600 tick cũng ≈ 10 s nên hai trần chạm cùng lúc;
// ở 120 Hz thì trần tick (5 s) vẫn chạm trước; chỉ dưới ~60 Hz trần
// tường mới rút ngắn thời gian quay (máy càng chậm, rút càng nhiều).
// 10 s = đúng ngân sách tường của cap tick ở tần số tham chiếu 60 Hz,
// không phải số bịa: hội tụ thực tế đã quan sát chỉ cần 3 skip.
export const PAUSE_RETRY_WALL_CAP_MS = 10_000;

/**
 * Số skip tối thiểu để trần tường có hiệu lực. Ngăn trần tường nổ do
 * một khoảng trống rAF dài xen giữa hai tick của cùng chuỗi (vd tab ẩn
 * rồi hiện: streakSince cũ, tick đầu sau giấc ngủ có now - since lớn)
 * trong khi chuỗi mới chỉ vừa bắt đầu. 30 = gấp 10 lần số skip hội tụ
 * đã quan sát (3), và ở tốc độ tick ≥ 3/s thì 30 skip xong trong ≤ 10 s
 * nên trần tường vẫn là bên quyết định thời gian ngủ.
 */
export const PAUSE_RETRY_WALL_MIN_SKIPS = 30;

/**
 * Chuỗi skip hiện tại đã cạn trần tường chưa?
 * - streakSinceMs null (chưa có skip nào trong chuỗi) → false.
 * - Cần CẢ hai: đủ số skip tối thiểu VÀ đủ thời gian tường — chỉ một
 *   trong hai thì chưa đủ (skip nhiều nhưng nhanh = máy nhanh, chưa
 *   tới lượt trần tường; lâu nhưng ít skip = chuỗi mới bắt đầu sau
 *   khoảng trống rAF, không phải thất bại dai dẳng).
 * Hàm thuần để test khóa được mà không cần vòng lặp thật.
 */
export function pauseRetryWallExhausted(
  consecutiveSkipped: number,
  streakSinceMs: number | null,
  nowMs: number,
): boolean {
  if (streakSinceMs === null) return false;
  return (
    consecutiveSkipped >= PAUSE_RETRY_WALL_MIN_SKIPS &&
    nowMs - streakSinceMs >= PAUSE_RETRY_WALL_CAP_MS
  );
}

/** Kết quả sau một lần render pause: số skip liên tiếp + đã cạn cap chưa. */
export interface PauseRetryAdvance {
  consecutiveSkipped: number;
  exhausted: boolean;
}

/**
 * Cập nhật bộ đếm sau một lần render pause.
 * - Vẽ được (skipped = false): đếm về 0, hết cạn.
 * - Bị skip (skipped = true): đếm +1; cạn cap khi đếm >= cap.
 * Hàm thuần để test khóa được mà không cần vòng lặp thật.
 */
export function pauseRetryAdvance(
  skipped: boolean,
  previousConsecutiveSkipped: number,
): PauseRetryAdvance {
  if (!skipped) {
    return { consecutiveSkipped: 0, exhausted: false };
  }
  const consecutiveSkipped = previousConsecutiveSkipped + 1;
  return {
    consecutiveSkipped,
    exhausted: consecutiveSkipped >= PAUSE_RETRY_TICK_CAP,
  };
}

/**
 * Vòng lặp có được phép ngủ ở trạng thái "đã bỏ cuộc" không?
 * Chỉ đúng khi: đã cạn cap, không còn seek bay, và playhead hiện tại
 * vẫn là t đã cạn (lastRequested === t — nếu user đã scrub đi thì
 * nhánh request-seek mới phải reset cap, không được ngủ kiểu này).
 * Điều kiện playing/redrawFlag do scheduleNext trong preview.tsx giữ
 * như cũ, không nằm trong hàm này.
 */
export function pauseRetryMaySleep(
  exhausted: boolean,
  pendingSeek: boolean,
  lastRequested: number | null,
  playhead: number,
): boolean {
  return exhausted && !pendingSeek && lastRequested === playhead;
}
