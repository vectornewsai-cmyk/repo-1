// webkitLoopRestart80H5.ts — Đợt 80 luồng H5: phục hồi element media đã
// chạm `ended` trong lúc preview đang phát (nợ W3 đợt 79, xem
// docs/PHASE9_ROUND80_H5_WEBKIT_LOOP_LIMITS.md).
//
// Bối cảnh đo được (probe benchmarks/render/webkit_loop_probe_80h5.mjs,
// WebKitGTK 27.2 headed + headless, đối chứng Chromium 158):
// - Thuộc tính `loop` kẹt trên WebKitGTK (W3): clip H.264 2 s / 3 s và
//   VP9 2 s đều không loop nổi vòng 2 (kẹt ở currentTime 0 với
//   paused=false, hoặc đóng băng ở cuối clip không bắn sự kiện `ended`);
//   clip 720p 4 s thì không ổn định (lúc loop được chậm, lúc kẹt sau
//   đúng 1 vòng). Chromium loop bình thường ở mọi clip.
// - Workaround `ended → seek(0) + play()` SỬA được loop trên WebKitGTK:
//   cả 3 clip A/B/C loop 2–3 vòng sạch, endedCount khớp số vòng.
// - `play()` đơn thuần sau `ended` cũng khởi động lại được trên
//   WebKitGTK (A/B/C loop lại được) — nhưng phát lại TỪ 0, rồi mới
//   re-seek theo drift: mất 2+ tick và nhảy về frame đầu.
//
// Áp vào preview: app KHÔNG dùng thuộc tính `loop` (preview chạy bằng
// seek theo playhead — xem syncMedia trong preview.tsx), nên W3 không
// đánh thẳng vào đường phát chính; element chỉ có thể chạm `ended`
// trong lúc clip còn active ở tick biên (làm tròn tốc độ / speed ramp),
// và hai cơ chế sẵn có đã tự cứu: drift re-seek (currentTime kẹt thì
// lệch khỏi target → seek lại) + `play()` mỗi tick khi paused. Hàm ở
// đây chỉ làm phục hồi đó NGAY LẬP TỨC và ĐÚNG VỊ TRÍ: khi element đã
// ended thì seek thẳng tới target của timeline (không phải 0 — 0 chỉ
// đúng với video loop thô, còn preview cần đúng vị trí timeline) rồi
// để `play()` sẵn có bên dưới resume trong cùng tick.
//
// Phạm vi: chỉ kích hoạt khi element thật sự ended (hiếm), không chạm
// đường phát thường; engine-agnostic (seek tới target + play là đúng
// trên mọi engine, Chromium cũng hưởng lợi thay vì play-từ-0 rồi
// re-seek). Không gắn listener `ended` — syncMedia gọi mỗi tick nên
// kiểm tra cờ là đủ, tránh rò rỉ listener / phát lại element đã hết
// active (nguy cơ audio rò nếu handler tự restart ngoài vòng lặp).

/**
 * Mặt tối thiểu của element mà phục hồi cần — HTMLMediaElement thật
 * thỏa interface này, test dùng fake object.
 */
export interface EndedRestartElement {
  readonly ended: boolean;
  readonly seeking: boolean;
  currentTime: number;
}

/** Ngưỡng "đã ở đúng vị trí": không seek vô ích khi đã ở target. */
export const ENDED_RESTART_EPS_S = 0.001;

/**
 * Element có cần phục hồi ended không? Chỉ khi đã ended và không có
 * seek nào đang bay (seek chồng làm decoder khởi động lại — xem chặn
 * nhịp K9/L2 trong syncMedia).
 */
export function shouldRestartEndedElement(el: EndedRestartElement): boolean {
  return el.ended && !el.seeking;
}

/**
 * Phục hồi element đã ended: seek tới `target` (vị trí timeline hiện
 * tại của clip, giây). Trả true khi đã phát seek, false khi không cần
 * (chưa ended / đang seeking / target không hữu hạn / đã ở target) hay
 * seek ném lỗi. KHÔNG gọi play() — caller (syncMedia) đã có lệnh
 * `if (paused) play()` ngay sau, giữ một điểm resume duy nhất.
 */
export function restartEndedElement(
  el: EndedRestartElement,
  target: number,
): boolean {
  if (!shouldRestartEndedElement(el)) return false;
  if (!Number.isFinite(target)) return false;
  if (Math.abs(el.currentTime - target) <= ENDED_RESTART_EPS_S) return false;
  try {
    el.currentTime = target;
    return true;
  } catch {
    return false;
  }
}
