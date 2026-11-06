// pause45A2.ts — Đợt 45 luồng A2: phân loại quirk đáp sai của seek,
// mở rộng quirk seek-landing-0 của đợt 44 Z2 sang frame khác 0
// (nợ đợt 44 §4.3: "quirk đáp sai ở frame khác 0 chưa xử lý").
//
// Bối cảnh Z2: seek tới 2,5 trên fixture broken-gap thì `seeked` bắn ở
// currentTime 0 lặp lại; seek.ts đã sửa bằng cách đếm đáp 0 LIÊN TIẾP
// và fail ở lần thứ 3 (SEEK_ZERO_LANDING_MAX_RETRIES = 2). Nhưng nếu
// Chrome đáp sai ở một frame KHÁC 0 (vd seek 2,5 đáp mãi 1,0) thì
// nhánh Z2 không kích — seekElement vẫn lặp gán vô hạn như cũ. Lib
// này là bước phân loại thuần cho trường hợp tổng quát đó, để một
// luồng sau nối vào seek.ts mà không phải đoán ngưỡng ngay trong
// listener `seeked` (nối vào seek.ts là việc ngoài phạm vi A2 — A2
// KHÔNG sửa seek.ts/preview.tsx để tránh xung đột luồng A6).
//
// Ngữ nghĩa (giữ đúng Z2, chỉ mở rộng miền đáp sai):
//  - correct: đáp đúng frame target → reset đếm.
//  - zero-landing: đáp 0 trong khi target > 0 (quirk Z2 đã biết).
//  - wrong-landing: đáp frame khác 0 nhưng khác target (trường hợp
//    mới của đợt 45 — vd seek 2,5 đáp 1,0 mãi).
//  - intentional-zero: target frame = 0 → KHÔNG BAO GIỜ tính là quirk,
//    không đếm, không fail. Đây là lớp phân biệt seek về 0 có chủ ý
//    của Z2 (targetFrame > 0 mới tính), giữ nguyên ở đây: một seek
//    tới 0 mà đáp 0 là thành công, không phải đáp sai.
//  - Đếm LIÊN TIẾP: đáp đúng (hoặc seek về 0 có chủ ý) reset đếm về
//    0; đổi target cũng reset streak cũ (streak thuộc về một target).
//    Đáp sai đổi frame mỗi lần (30, 45, 30, ...) vẫn cộng dồn — vì
//    tiêu chí fail là "seek không tới được target", không phải "đáp
//    đúng một frame sai cố định".
//  - Ngưỡng fail: mirror Z2 — maxRetries = 2, tức lần đáp sai liên
//    tiếp thứ 3 thì shouldFail = true. 1–2 lần sai thoáng qua vẫn
//    được thử lại (đúng lý do Z2 chọn 2: không fail vội vì thoáng qua).
//
// CHƯA NỐI: lib này hiện chỉ được test Node + harness headed chạy
// phân loại trên landings quan sát được; seek.ts vẫn chỉ fail nhanh
// cho đáp 0 (Z2), chưa fail nhanh cho đáp sai frame khác 0. Luồng
// nối sau cần: thay zeroLandingCount trong seek.ts bằng tracker này
// (giữ ngưỡng 2), rồi đo lại seek thường không bị fail oan + đo
// headed trên fixture đáp sai khác 0 (hiện chưa có fixture nào tái
// hiện đáp sai khác 0 ổn định — xem LIMITS đợt 45 A2 §3).
// Giới hạn: tracker không xử lý seek target frame 0 đáp lệch sang
// frame khác (trường hợp này Z2 cũng không xử lý; attempt() của
// seek.ts kết thúc sớm khi đã ở đúng frame 0 nên đường này hiếm).

/** Ngưỡng mirror Z2: số lần thử lại tối đa sau đáp sai liên tiếp. */
export const SEEK_WRONG_LANDING_MAX_RETRIES = 2;

/** Loại đáp của một lần `seeked` so với target. */
export type SeekLandingKind =
  | "correct"
  | "zero-landing"
  | "wrong-landing"
  | "intentional-zero";

/** Trạng thái đếm đáp sai liên tiếp (thuần, serializable). */
export interface WrongLandingState {
  /** Số lần đáp sai LIÊN TIẾP cho target hiện tại (0 = chưa sai / vừa reset). */
  consecutiveWrong: number;
  /** Frame đáp sai gần nhất (null khi chưa có). */
  lastWrongFrame: number | null;
  /** Frame target của streak hiện tại (null khi chưa có quan sát). */
  lastTargetFrame: number | null;
}

/** Trạng thái rỗng ban đầu. */
export function initialWrongLandingState(): WrongLandingState {
  return { consecutiveWrong: 0, lastWrongFrame: null, lastTargetFrame: null };
}

/**
 * Chỉ số frame của một thời điểm — mirror đúng quy ước của seek.ts
 * `frameIndexOf`: Math.round(t * fps), t <= 0 → 0. Viết lại tại đây
 * (không import seek.ts) để lib này không kéo theo @repo-1/video-spec
 * và bundle được độc lập cho cả test Node lẫn trang headed.
 */
export function frameIndex45A2(t: number, fps = 30): number {
  const f =
    typeof fps === "number" && Number.isFinite(fps) && fps > 0 ? fps : 30;
  if (!Number.isFinite(t) || t <= 0) return 0;
  return Math.round(t * f);
}

/**
 * Phân loại một lần đáp (đã quy về frame) so với target.
 * - target 0 → intentional-zero (không bao giờ là quirk, kể cả khi
 *   đáp đúng 0 — đó là thành công của seek về 0 có chủ ý).
 * - đáp = target → correct.
 * - đáp 0, target > 0 → zero-landing (quirk Z2).
 * - còn lại → wrong-landing (trường hợp mới đợt 45).
 */
export function classifySeekLanding(
  landedFrame: number,
  targetFrame: number,
): SeekLandingKind {
  if (targetFrame === 0) return "intentional-zero";
  if (landedFrame === targetFrame) return "correct";
  if (landedFrame === 0) return "zero-landing";
  return "wrong-landing";
}

/** Kết quả sau một lần quan sát đáp. */
export interface WrongLandingObservation {
  kind: SeekLandingKind;
  state: WrongLandingState;
  /** Số lần đáp sai liên tiếp sau quan sát này. */
  consecutiveWrong: number;
  /** true khi đã vượt ngưỡng thử lại → bên gọi nên fail nhanh như Z2. */
  shouldFail: boolean;
}

/**
 * Cập nhật trạng thái đếm sau một lần đáp. Thuần, không chạm DOM.
 * Đổi target → streak cũ reset trước khi đếm quan sát mới.
 */
export function nextWrongLandingState(
  prev: WrongLandingState,
  landedFrame: number,
  targetFrame: number,
  maxRetries: number = SEEK_WRONG_LANDING_MAX_RETRIES,
): WrongLandingObservation {
  const kind = classifySeekLanding(landedFrame, targetFrame);
  if (kind === "intentional-zero" || kind === "correct") {
    const state: WrongLandingState = {
      consecutiveWrong: 0,
      lastWrongFrame: null,
      lastTargetFrame: targetFrame,
    };
    return { kind, state, consecutiveWrong: 0, shouldFail: false };
  }
  const base =
    prev.lastTargetFrame !== null && prev.lastTargetFrame !== targetFrame
      ? 0
      : prev.consecutiveWrong;
  const consecutiveWrong = base + 1;
  const state: WrongLandingState = {
    consecutiveWrong,
    lastWrongFrame: landedFrame,
    lastTargetFrame: targetFrame,
  };
  return {
    kind,
    state,
    consecutiveWrong,
    shouldFail: consecutiveWrong > maxRetries,
  };
}

/**
 * Tracker có trạng thái (tiện cho bên gọi giữ một instance mỗi lần
 * seek, thay vì tự truyền state). Ngữ nghĩa đúng
 * `nextWrongLandingState`; `reset()` dùng khi bắt đầu một lần seek mới.
 */
export class WrongLandingTracker {
  private state: WrongLandingState = initialWrongLandingState();
  private maxRetries: number;

  constructor(maxRetries: number = SEEK_WRONG_LANDING_MAX_RETRIES) {
    this.maxRetries = maxRetries;
  }

  /** Ghi một lần đáp; trả kind + shouldFail như nextWrongLandingState. */
  observe(
    landedFrame: number,
    targetFrame: number,
  ): Omit<WrongLandingObservation, "state"> & { state: WrongLandingState } {
    const r = nextWrongLandingState(
      this.state,
      landedFrame,
      targetFrame,
      this.maxRetries,
    );
    this.state = r.state;
    return r;
  }

  /** Số lần đáp sai liên tiếp hiện tại. */
  get consecutiveWrong(): number {
    return this.state.consecutiveWrong;
  }

  /** Xóa streak (bắt đầu seek mới / seek đã thành công ở tầng trên). */
  reset(): void {
    this.state = initialWrongLandingState();
  }
}
