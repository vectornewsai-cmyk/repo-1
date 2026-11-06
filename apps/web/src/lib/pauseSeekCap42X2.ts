// pauseSeekCap42X2.ts — Đợt 42 luồng X2: đặt cap cho đường seek-timeout /
// seek-error của vòng lặp pause (nợ đợt 41 §5.3, xem
// docs/PHASE9_ROUND42_X2_PAUSE_SEEK_CAP_LIMITS.md).
//
// Vấn đề: cap đợt 41 W2 chỉ chặn đường render-retry (seek đã xong nhưng
// không có frame — decideVideoFrame skip mãi). Đường seek thì chưa có
// cap: trong preview.tsx, khi một lần seek pause kết thúc bằng timeout
// (> 1200 ms chờ `seeked`, xem seek.ts) hoặc bằng lỗi thật (Seeker
// resolve ok: false, không phải cancelled), nhánh `.then` reset
// lastRequested về null → tick sau request seek mới → lại timeout/lỗi
// → lặp VÔ HẠN, mỗi vòng ~1,28 s (debounce 80 ms + timeout 1200 ms).
// Media hỏng theo kiểu này không bao giờ tới được đường render-retry
// nên cap W2 không chặn được nó.
//
// Phân loại đúng (đọc code, không đoán) — kết quả seek trong
// preview.tsx đi đúng 3 nhánh:
//  - Nhánh vẽ (draw): ok && timedOut === 0. Kể cả khi seekAll báo
//    failed > 0 (vd gán currentTime ném lỗi vì metadata lỗi) mà không
//    timeout thì vẫn vào nhánh này: renderFrame skip clip → lần skip
//    đó đã được cap W2 đếm. Tức "seek-error dạng failed-only" KHÔNG
//    thuộc cap này; đừng đếm trùng.
//  - Nhánh else (không vẽ): cancelled, timedOut > 0, hoặc ok === false.
//    Trong đó cancelled KHÔNG phải lỗi (request bị thay thế / cancel
//    khi bấm phát) nên không đếm; chỉ timedOut > 0 ("timeout") và
//    ok === false không-cancelled ("error") mới là thất bại seek.
//  - Vì vậy classifySeekOutcome trả null cho cả cancelled, thành công,
//    và failed-only — 3 trường hợp đó giữ hành vi cũ nguyên vẹn.
//
// Cap ở đây: đếm số lần seek pause THẤT BẠI LIÊN TIẾP cho cùng một
// playhead t (timeout hoặc error, kind mới nhất thắng). Đạt cap thì
// vòng lặp KHÔNG reset lastRequested nữa (guard t !== lastRequested
// chặn request mới) và được phép NGỦ ở trạng thái "seek đã bỏ cuộc",
// phơi rõ qua PreviewIdleDebug (seekFailureCount /
// seekFailureExhausted / seekFailureKind) để UI/harness đọc được "vì
// sao ngủ" thay vì đoán từ ticks — cùng mẫu với cap W2.
//
// Vì sao cap = 10 lần (không phải 600 như W2): một lần seek thất bại
// tốn ~1,28 s tường, nên 10 lần ≈ 12,8 s — cùng bậc thời gian với
// cap W2 (~10 s ở 60 Hz). Một seek chậm thật (giải mã kéo dài) vẫn
// hội tụ trong vài lần timeout: mỗi lần retry khi element đang
// seeking thì chỉ chờ `seeked` chứ không gán lại (seek.ts, đợt 31
// N1), nên seek hoàn tất sau ~5 s chỉ đốt ~4 lần timeout; cap 10
// gấp hơn 2 lần con số đó. Nếu tương lai có trường hợp cần > 10 lần
// thì đó là tín hiệu để tăng cap kèm bằng chứng, không phải bỏ cap.
//
// Đánh đổi (ghi rõ, không giấu) — cùng họ với đánh đổi W2:
//  - Media chỉ CHẬM hơn cap (seek xong sau khi vòng lặp đã ngủ vì
//    cạn cap) không tự hiện frame cho tới khi user tác động (scrub
//    sang t khác, phát/tạm dừng, đổi nội dung) — vì element sẵn sàng
//    không chạm store nên không có gì đánh thức vòng lặp đang ngủ.
//  - Scrub về ĐÚNG t đã bỏ cuộc mà không đổi playhead (store không
//    đổi giá trị nên không đánh thức vòng lặp) vẫn giữ trạng thái lỗi
//    cho tới lần tác động khác; scrub sang t khác thì seek mới reset
//    cap.
//  - Cap chỉ sống trong effect vòng lặp; reset ở nhánh request-seek
//    mới, justPaused, redrawFlag (cùng chỗ reset lastDrawn /
//    lastRequested của W2), và ngay khi một lần seek thành công vào
//    nhánh vẽ (seek thành công thì chuỗi thất bại đã đứt, dù lần vẽ
//    đó có bị skip thì skip đã thuộc cap W2).

/**
 * Số lần seek pause thất bại liên tiếp tối đa cho cùng một playhead
 * trước khi bỏ cuộc và cho vòng lặp ngủ. 10 lần ≈ 12,8 s tường
 * (debounce 80 ms + timeout 1200 ms mỗi lần, xem ghi chú đầu file).
 */
export const PAUSE_SEEK_FAILURE_CAP = 10;

/** Loại thất bại seek được cap này đếm. */
export type SeekFailureKind = "timeout" | "error";

/** Mặt tối thiểu của SeekOutcome (xem seek.ts) mà cap này cần. */
export interface SeekOutcomeLike {
  ok: boolean;
  cancelled: boolean;
  timedOut: number;
  failed: number;
  done: number;
}

/**
 * Phân loại một kết quả seek thành thất bại cần đếm, hay null (= giữ
 * hành vi cũ: vẽ, retry không đếm, hoặc bỏ qua vì đã bị hủy).
 * - cancelled → null (bị thay thế / cancel khi phát, không phải lỗi).
 * - timedOut > 0 → "timeout" (kể cả khi một phần element đã xong).
 * - ok === false, không cancelled → "error" (executor seek ném lỗi).
 * - Còn lại (thành công, hoặc failed-only nhưng ok && timedOut === 0)
 *   → null: failed-only đi nhánh vẽ và đã được cap W2 đếm.
 */
export function classifySeekOutcome(
  outcome: SeekOutcomeLike,
): SeekFailureKind | null {
  if (outcome.cancelled) return null;
  if (outcome.timedOut > 0) return "timeout";
  if (!outcome.ok) return "error";
  return null;
}

/** Kết quả sau một lần seek thất bại: số lần liên tiếp + đã cạn cap chưa. */
export interface SeekFailureAdvance {
  consecutiveFailures: number;
  exhausted: boolean;
  kind: SeekFailureKind;
}

/**
 * Cập nhật bộ đếm sau một lần seek thất bại (kind khác null — xem
 * classifySeekOutcome). Kind mới nhất thắng; đếm không reset khi kind
 * đổi vì đó vẫn là chuỗi thất bại liên tiếp cho cùng playhead.
 * Cạn cap khi đếm >= cap. Hàm thuần để test khóa được mà không cần
 * vòng lặp thật.
 */
export function seekFailureAdvance(
  kind: SeekFailureKind,
  previousConsecutiveFailures: number,
): SeekFailureAdvance {
  const consecutiveFailures = previousConsecutiveFailures + 1;
  return {
    consecutiveFailures,
    exhausted: consecutiveFailures >= PAUSE_SEEK_FAILURE_CAP,
    kind,
  };
}

/** Trạng thái cap rỗng (dùng khi reset: seek mới / justPaused / vẽ được). */
export function seekFailureReset(): {
  consecutiveFailures: number;
  exhausted: boolean;
  kind: SeekFailureKind | null;
} {
  return { consecutiveFailures: 0, exhausted: false, kind: null };
}

/**
 * Vòng lặp có được phép ngủ ở trạng thái "seek đã bỏ cuộc" không?
 * Chỉ đúng khi: đã cạn cap, không còn seek bay, và playhead hiện tại
 * vẫn là t đã cạn (lastRequested === t — nếu user đã scrub đi thì
 * nhánh request-seek mới phải reset cap, không được ngủ kiểu này).
 * Điều kiện playing/redrawFlag do scheduleNext trong preview.tsx giữ
 * như cũ, không nằm trong hàm này. Cùng công thức với
 * pauseRetryMaySleep của W2, chỉ khác nguồn cạn cap.
 */
export function seekFailureMaySleep(
  exhausted: boolean,
  pendingSeek: boolean,
  lastRequested: number | null,
  playhead: number,
): boolean {
  return exhausted && !pendingSeek && lastRequested === playhead;
}
