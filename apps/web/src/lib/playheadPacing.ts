// playheadPacing.ts — Pacing phát XUÔI cho vòng lặp preview
// (Phase 9 đợt 29, luồng L2).
//
// BUG GỐC (phát hiện đợt 28 L2, xem
// docs/PHASE9_ROUND28_L2_REVERSE_LIMITS.md §2.3): vòng lặp phát xuôi
// cũ gọi `setPlayhead(playhead + dt)` mỗi tick rAF, mà setPlayhead
// snap bằng Math.round về frame gần nhất (timebase.ts). Ở 30 fps,
// 1 tick rAF ~16.7 ms = ĐÚNG nửa frame, nên tick nào dt >= nửa frame
// cũng bước NGUYÊN 1 frame (33.3 ms), tick nào dt nhỏ hơn thì bước 0.
// Đo được trên Chromium thật: playhead +7.167 s / 6.189 s wall =
// 1.158× wall, trong khi Σdt của vòng lặp ≈ wall (1.012×) — tức dt
// không sai, chỉ snap làm tròn gây bước thừa tích lũy. Độ lệch
// (playhead − currentTime element, element chạy đúng 1.00×) tích lũy
// ~0.25 s mỗi giây wall → chạm ngưỡng drift-seek 0.35 s của syncMedia
// sau mỗi ~1.2–1.4 s → drift-seek chu kỳ → trên GOP thưa mỗi seek làm
// decoder giải mã lại từ keyframe → cụm hold 3–29 tick → ~40–54 hold
// mỗi pass. Sửa đúng là ở vòng lặp phát xuôi, không phải ở decoder.
//
// SỬA (chỉ vòng lặp phát xuôi trong preview.tsx dùng 2 hàm này):
// tích lũy dt rồi chỉ bước NGUYÊN frame khi đủ — đúng nguyên tắc
// reverseStep đã dùng cho chiều ngược từ đợt 27 K4, chỉ đổi chiều.
// Hệ quả:
// - Tốc độ playhead trung bình = wall-clock đúng tới < 1 frame sai số
//   (sai số tích lũy bị chặn bởi 1 frame, không tăng theo thời gian),
//   thay vì thiên vị lên ở biên nửa frame như Math.round.
// - Tick chưa đủ 1 frame thì KHÔNG gọi setPlayhead: playhead đứng yên
//   trên lưới frame thay vì bị snap nhảy sớm 1 frame.
// - setPlayhead vẫn snap kết quả về lưới frame như cũ (scrub/trim vẫn
//   cần snap gần nhất — KHÔNG đổi ngữ nghĩa setPlayhead toàn cục).
//   Playhead khi bắt đầu phát thường đã nằm trên lưới (mọi setPlayhead
//   đều snap), nên bước nguyên frame giữ đúng lưới, snap là đồng nhất.
//   Trường hợp hiếm playhead lệch lưới lúc bắt đầu phát (vd duration
//   không chia hết cho frame): bước đầu có thể bị snap dịch tối đa
//   nửa frame MỘT LẦN, không tích lũy — sau đó khóa lưới như thường.
//
// KHÔNG đổi: setPlayhead trong store.ts, snapToFrame trong timebase.ts,
// vòng lặp phát ngược (reverseStep/reversePlayhead giữ nguyên).

/** Kết quả một bước tích lũy thời gian cho phát xuôi. */
export interface ForwardStepResult {
  /** Số frame nguyên đã đủ để bước tới (0 = chưa đủ một frame). */
  steps: number;
  /** Phần dư (< 1 frame) giữ lại cho tick sau. */
  accumulated: number;
}

/**
 * Tích lũy dt (giây, đã clamp như vòng lặp preview) vào bộ đếm và trả về
 * số frame nguyên cần bước tới. Dùng floor nên KHÔNG BAO GIỜ bước thừa
 * vì làm tròn ở biên nửa frame: mỗi frame của timeline được hiện đúng
 * 1 lần theo nhịp wall-clock (trừ khi tab lag — khi đó bước bù nhiều
 * frame để bắt kịp wall, giống hành vi cũ nhưng có chặn trên bởi dt).
 * accumulated âm hoặc dt <= 0 → 0 bước, giữ nguyên accumulated (đã clamp).
 */
export function forwardStep(
  accumulated: number,
  dt: number,
  frameDur: number,
): ForwardStepResult {
  if (!(frameDur > 0) || !(dt > 0)) return { steps: 0, accumulated };
  const total = accumulated + dt;
  const steps = Math.floor(total / frameDur);
  return { steps, accumulated: total - steps * frameDur };
}

/** Kết quả bước tới playhead. */
export interface ForwardPlayheadResult {
  /** Playhead mới (<= duration khi chạm cuối). */
  t: number;
  /** true khi đã chạm cuối timeline (vòng lặp phải dừng phát). */
  reachedEnd: boolean;
}

/**
 * Tiến playhead đúng `steps` frame. Truyền đúng bội số frameDur nên khi
 * playhead đang trên lưới frame thì kết quả vẫn trên lưới và setPlayhead
 * snap thành đồng nhất (không lệch tích lũy). Chạm duration thì dừng
 * (không quấn về đầu — nhánh phát lại từ đầu thuộc về togglePlay).
 */
export function forwardPlayhead(
  playhead: number,
  steps: number,
  frameDur: number,
  duration: number,
): ForwardPlayheadResult {
  if (steps <= 0 || !(frameDur > 0)) return { t: playhead, reachedEnd: false };
  const t = playhead + steps * frameDur;
  if (Number.isFinite(duration) && t >= duration) {
    return { t: duration, reachedEnd: true };
  }
  return { t, reachedEnd: false };
}
