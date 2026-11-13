// webkitRestartTrace85M4.ts — Đợt 85 luồng M4: dấu vết mức tick cho đường
// phục hồi element ended trong preview (nợ W7 đợt 84 L10, xem
// docs/PHASE9_ROUND84_L10_WEBKIT_LOOP_W1_LIMITS.md §5).
//
// Bối cảnh: L10 cô lập được đúng +1 lần restart DƯ sau mỗi tương tác test
// (gỡ ghi đè `ended` / reset playhead về 0), cả 2 engine, tác động lành
// (seek về đúng target), nhưng cơ chế ở mức tick CHƯA rõ: tại thời điểm
// +1 bắn thì `currentTime` (2,485 / 8,833) còn xa `duration` (30) nên
// không lý giải được `ended` từ đâu ra bằng dữ liệu hiện có. Đã loại trừ:
// ghi đè còn sót, 2 video element, tự phát trong lúc phát thường.
//
// Module này ghi snapshot mỗi tick nhánh forward của syncMedia (nơi duy
// nhất gọi restartEndedElement) + một sự kiện mỗi lần restart bắn, để
// phân biệt:
//   - restart do `ended` THẬT: ct ≈ duration (element chạm cuối nguồn
//     trong khi playhead còn chạy — cơ chế W2 đã chứng minh ở L10 §4.4);
//   - restart do `ended` THOÁNG QUA giữa clip: ended chỉ true 1 tick,
//     hoặc true ngay sau khi một seek vừa hạ cánh (cờ ended stale sau
//     seek — quirk trình duyệt), hoặc ended lật true mà không có seek
//     nào trước đó.
// Vòng đệm có chặn (600 tick / 100 sự kiện) nên chi phí không tăng theo
// thời gian; chỉ để harness đo qua window.__vcutRestartEndedTrace,
// không đổi hành vi phát. Không gắn listener, không đọc DOM.

/** Snapshot trạng thái element tại một tick nhánh forward. */
export interface RestartTickSnapshot {
  /** Số thứ tự tick của trace (tăng đơn điệu, do recordTick gán). */
  seq: number;
  /** Date.now() lúc ghi (để tương quan với mốc tương tác của harness). */
  wallMs: number;
  /** Định danh element: `${tag}:${clipKey}`. */
  key: string;
  ended: boolean;
  seeking: boolean;
  /** currentTime lúc quyết định restart (giây). */
  ct: number;
  /** duration của element (NaN nếu chưa biết — JSON hóa thành null). */
  dur: number;
  paused: boolean;
  readyState: number;
  /** Vị trí timeline của clip tại tick này (giây). */
  target: number;
  /** Playhead timeline tại tick này (giây). */
  playhead: number;
}

/** Ngữ cảnh tick trả về từ recordTick (để recordRestart dùng lại). */
export interface RestartTickContext {
  /** Snapshot đầy đủ (đã gán seq) của tick vừa ghi. */
  snap: RestartTickSnapshot;
  /** Snapshot tick trước của cùng element (null nếu tick đầu tiên). */
  prev: RestartTickSnapshot | null;
  /** Số tick liên tiếp ended=true tính tới tick này (kể cả tick này). */
  ticksEndedTrue: number;
  /** Số tick kể từ lần seeking true→false gần nhất (null nếu chưa từng). */
  ticksSinceSeekLanded: number | null;
  /** ended lật false→true đúng tick này. */
  endedFlippedThisTick: boolean;
  /** Một seek vừa hạ cánh trong ≤ 2 tick gần nhất. */
  seekJustLanded: boolean;
}

/**
 * Một lần restartEndedElement bắn, kèm ngữ cảnh tick để quy kết cơ chế.
 * causeTag chỉ là nhãn nhanh — phân tích thật phải đọc ct/dur/prev.
 */
export interface RestartTraceEvent extends RestartTickSnapshot {
  prev: RestartTickSnapshot | null;
  ticksEndedTrue: number;
  ticksSinceSeekLanded: number | null;
  endedFlippedThisTick: boolean;
  seekJustLanded: boolean;
  /** "ended-at-duration": ct trong 0,05 s quanh duration (ended thật);
   *  "ended-mid-clip": còn lại (ended thoáng qua / stale — nghi vấn W7). */
  causeTag: "ended-at-duration" | "ended-mid-clip";
}

/** Ngưỡng "ct coi như đã ở cuối nguồn" (1,5 frame ở 30 fps). */
export const RESTART_AT_END_EPS_S = 0.05;
/** Số tick giữ lại trong vòng đệm (đủ ~10 s ở 60 fps / 1 element). */
export const RESTART_TRACE_RING_CAP = 600;
/** Số sự kiện restart giữ lại. */
export const RESTART_TRACE_EVENT_CAP = 100;

export class RestartTrace {
  private seq = 0;
  private ring: RestartTickSnapshot[] = [];
  private events: RestartTraceEvent[] = [];
  private prevByKey = new Map<string, RestartTickSnapshot>();
  private endedStreakByKey = new Map<string, number>();
  private ticksSinceSeekLandedByKey = new Map<string, number | null>();

  /**
   * Ghi một tick. Trả ngữ cảnh để caller (syncMedia) quyết restart rồi
   * gọi recordRestart với cùng snapshot khi restart bắn.
   */
  recordTick(input: Omit<RestartTickSnapshot, "seq">): RestartTickContext {
    const snap: RestartTickSnapshot = { ...input, seq: this.seq++ };
    const prev = this.prevByKey.get(snap.key) ?? null;
    const ticksEndedTrue = snap.ended
      ? (this.endedStreakByKey.get(snap.key) ?? 0) + 1
      : 0;
    this.endedStreakByKey.set(snap.key, ticksEndedTrue);
    let ticksSinceSeekLanded = this.ticksSinceSeekLandedByKey.get(snap.key) ?? null;
    if (prev && prev.seeking && !snap.seeking) {
      ticksSinceSeekLanded = 0;
    } else if (ticksSinceSeekLanded !== null) {
      ticksSinceSeekLanded += 1;
    }
    this.ticksSinceSeekLandedByKey.set(snap.key, ticksSinceSeekLanded);
    this.ring.push(snap);
    if (this.ring.length > RESTART_TRACE_RING_CAP) this.ring.shift();
    this.prevByKey.set(snap.key, snap);
    return {
      snap,
      prev,
      ticksEndedTrue,
      ticksSinceSeekLanded,
      endedFlippedThisTick: prev !== null && !prev.ended && snap.ended,
      seekJustLanded:
        ticksSinceSeekLanded !== null && ticksSinceSeekLanded <= 2,
    };
  }

  /**
   * Ghi một lần restart bắn. `snap`/`ctx` phải là kết quả recordTick
   * của cùng tick (caller giữ lại, không ghi tick mới).
   */
  recordRestart(snap: RestartTickSnapshot, ctx: RestartTickContext): RestartTraceEvent {
    const ev: RestartTraceEvent = {
      ...snap,
      prev: ctx.prev,
      ticksEndedTrue: ctx.ticksEndedTrue,
      ticksSinceSeekLanded: ctx.ticksSinceSeekLanded,
      endedFlippedThisTick: ctx.endedFlippedThisTick,
      seekJustLanded: ctx.seekJustLanded,
      causeTag:
        Number.isFinite(snap.dur) && snap.ct >= snap.dur - RESTART_AT_END_EPS_S
          ? "ended-at-duration"
          : "ended-mid-clip",
    };
    this.events.push(ev);
    if (this.events.length > RESTART_TRACE_EVENT_CAP) this.events.shift();
    return ev;
  }

  /** Bản sao JSON-an-toàn để phơi qua window hook cho harness đọc. */
  snapshotForHook(): { events: RestartTraceEvent[]; ring: RestartTickSnapshot[] } {
    return { events: [...this.events], ring: [...this.ring] };
  }

  /** Số sự kiện đã ghi (để test). */
  get eventCount(): number {
    return this.events.length;
  }

  /** Số tick trong vòng đệm (để test). */
  get ringCount(): number {
    return this.ring.length;
  }
}
