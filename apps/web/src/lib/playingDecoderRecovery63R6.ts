// playingDecoderRecovery63R6.ts — Phase 9 đợt 63, luồng R6: phục hồi lỗi
// decoder TRONG LÚC PHÁT (đóng nợ đợt 62 §4 mục 6 = LIMITS R6 §5.1).
//
// Vấn đề: đợt 62 R6 (b) chỉ drop element ĐÃ LỖI ở đường seek pause (nhánh
// `.then` của Seeker). Khi đang PHÁT mà decoder lỗi giữa chừng (vd file
// cắt ngắn, phát tới vùng hết dữ liệu), syncMedia không xử lý riêng:
//   - element lỗi thì `play()` trả rejected promise mỗi tick, `currentTime`
//     kẹt, `readyState` về 0 → drawVideoClip skip (hoặc hold frame cũ mãi);
//   - element KHÔNG BAO GIỜ hồi phục kể cả khi playhead đã qua vùng hỏng
//     (lỗi decoder Chromium là sticky) — user phải pause/scrub mới qua
//     được đường R6, trong khi phát tiếp vẫn kẹt.
// Sửa ở syncMedia (nhánh playing, xem điểm nối trong preview.tsx): mỗi
// tick, active nào có `error !== null` thì:
//   - nếu đang load mới (`networkState === NETWORK_LOADING`, vd fallback
//     proxy vừa đổi src) thì CHƯA kết luận — chờ load xong (xem
//     playingDecoderErrorStatus);
//   - nếu lỗi dính (không load nữa) thì drop element (pool.dropElement +
//     engine.releaseElement, cùng mẫu R6) nhưng CHẶN TỐC ĐỘ: tối đa 1 lần
//     drop / 1,5 s cho mỗi clip (playingDecoderRetryDue) — trong vùng hỏng
//     thì element mới cũng lỗi lại, không chặn sẽ tạo element mới mỗi tick.
//     Không có cap tổng: sau khi playhead qua vùng hỏng, lần drop kế tiếp
//     (≤ 1,5 s sau) tạo element mới seek tới target vùng tốt và vẽ lại;
//     cap tổng sẽ kẹt lại đúng case này (xem LIMITS R6 §1.1).
//   - element đã drop trong tick này bị loại khỏi audioSources đưa vào
//     engine.update() (xem điểm nối) — nếu không, update() sẽ tạo
//     MediaElementSource mới cho element đã chết (rò node, xem
//     audioEngine.releaseElement).
//
// File thuần TS, không import gì — test được bằng Node với mock element
// (chỉ cần field `error` / `networkState`).
/** Trạng thái lỗi decoder của 1 element đang phát. */
export type PlayingDecoderErrorStatus = "healthy" | "fallback-loading" | "stuck";

/** Mặt tối thiểu của element mà quyết định phục hồi cần. */
export interface PlayingDecoderErrorElementLike {
  /** MediaError của HTMLMediaElement (null = chưa lỗi). Mock có thể bỏ qua. */
  readonly error?: { readonly code?: number } | null;
  /** HTMLMediaElement.networkState (0..3). Mock có thể bỏ qua. */
  readonly networkState?: number;
}

/**
 * Chặn tốc độ drop-phục hồi trong lúc phát (ms): 1 lần drop / 1,5 s cho
 * mỗi clip. Lớn hơn timeout seek pause (~1,2 s) một chút để element mới
 * có thời gian load + lỗi lại (nếu vẫn trong vùng hỏng) trước khi drop
 * tiếp; nhỏ đủ để hồi phục sau khi qua vùng hỏng trong ~2 s.
 */
export const PLAYING_DECODER_RECOVERY_THROTTLE_MS = 1500;

/** `networkState` khi element đang tải resource mới (HTML spec). */
export const NETWORK_STATE_LOADING = 2;

/**
 * Phân loại lỗi decoder của element đang phát:
 * - "healthy": chưa lỗi (`error` null/undefined, hoặc đọc `error` ném —
 *   không bao giờ phá vòng lặp).
 * - "fallback-loading": đã lỗi NHƯNG đang tải resource mới (`networkState
 *   === 2`, vd fallback proxy vừa đổi src sang bản gốc) — lỗi cũ chưa
 *   reset xong, chưa được kết luận là dính; syncMedia phải chờ, không
 *   drop oan element đang fallback (nợ đo headed của R6 §5.2 — xem
 *   LIMITS đợt này §3.2 để biết đo được gì).
 * - "stuck": đã lỗi và KHÔNG tải gì nữa — element dính chắc, drop để
 *   element mới thử lại (chặn tốc độ bằng playingDecoderRetryDue).
 */
export function playingDecoderErrorStatus(
  el: PlayingDecoderErrorElementLike,
): PlayingDecoderErrorStatus {
  let err: { readonly code?: number } | null | undefined;
  try {
    err = el.error;
  } catch {
    return "healthy";
  }
  if (err === null || err === undefined) return "healthy";
  let ns: number | undefined;
  try {
    ns = el.networkState;
  } catch {
    ns = undefined;
  }
  if (ns === NETWORK_STATE_LOADING) return "fallback-loading";
  return "stuck";
}

/**
 * Đã tới lượt drop lại chưa: lần đầu (chưa drop lần nào) luôn được;
 * sau đó phải cách lần drop trước ít nhất `throttleMs` (mặc định
 * PLAYING_DECODER_RECOVERY_THROTTLE_MS). `nowMs`/`lastDropMs` là
 * wall-clock ms (Date.now()). Không bao giờ throw.
 */
export function playingDecoderRetryDue(
  nowMs: number,
  lastDropMs: number | undefined,
  throttleMs: number = PLAYING_DECODER_RECOVERY_THROTTLE_MS,
): boolean {
  if (lastDropMs === undefined) return true;
  return nowMs - lastDropMs >= throttleMs;
}

/**
 * Playhead có vừa scrub-back 1 cú lớn trong 1 tick không: target lùi
 * hơn `jumpSec` (mặc định 1 s) so với target ở tick lỗi trước. Phát
 * ngược thì target lùi ~1 frame/tick nên không chạm ngưỡng; phát xuôi
 * thì target tăng — chỉ scrub-back (hoặc seek nhảy lớn) mới lùi 1 cú
 * như vậy. Dùng để bỏ qua throttle khi user vừa nhảy playhead về vùng
 * mới: đó là thông tin mới (có thể là vùng decode được), không phải
 * kẹt cũ — chờ đủ 1,5 s throttle rồi mới drop thì playhead đã chạy
 * khỏi vùng tốt (đo headed P3: cửa sổ tốt sau scrub chỉ ~2 s, trong
 * khi load + seek element mới dưới tải VM mất ~2 s). Không bao giờ
 * throw; prevTarget undefined (chưa từng lỗi) → false.
 */
export function playingDecoderScrubbedBack(
  prevTarget: number | undefined,
  target: number,
  jumpSec: number = 1,
): boolean {
  if (prevTarget === undefined) return false;
  return prevTarget - target > jumpSec;
}
