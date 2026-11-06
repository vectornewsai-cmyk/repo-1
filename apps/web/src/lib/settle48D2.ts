// settle48D2.ts — Phase 9 đợt 48, luồng D2: instrumentation tầng
// harness tách đuôi feed/flush/drain của prefetch + đo decoded trực
// tiếp của W2 (đường asset:).
//
// Nợ mở từ docs/PHASE9_ROUND47_C2_SETTLE_LIMITS.md §0.4 + §4 + §6.1:
// SUCCESS đường asset: vẫn mở — 0/9 attempt C2 + 0/2 B1 = 11/11
// PARTIAL, gap settle−W2end luôn dương (36–901 ms). Cơ chế trượt suy
// ra từ code (W2 short-circuit khi decoder gặp GOP hỏng, prefetch
// phải feed hết 136 chunk + flush mới resolve) — CHƯA có timestamp
// feed/flush trực tiếp, decoded trực tiếp của W2 vẫn không có.
// Đợt 47 §4.2 CẤM siết aim hay dời mốc W2 nữa — đợt này CHỈ làm
// instrumentation (đọc thêm timestamp, không sửa production).
//
// Cách đo (harness, xem apps/web/scripts/settle-headed-48d2.mjs):
// page bọc window.VideoDecoder bằng subclass ghi lại mọi sự kiện
// trên cùng đồng hồ performance.now() của page — configure, từng
// decode(chunk) (feed), flush() gọi + resolve, từng output callback
// (drain), error callback (short-circuit), close. Module này chỉ làm
// số học thuần trên trace đó (phân loại instance, tách gap thành
// feed/flush/drain, đếm decoded trực tiếp của W2) để harness dùng
// chung một định nghĩa; KHÔNG được import bởi production code.
//
// Quy ước đơn vị: thời gian sự kiện = ms trên đồng hồ
// performance.now() của page (cùng đồng hồ với t0 toggle + mẫu
// settle của harness); timestamp chunk/frame = µs theo WebCodecs
// (VideoFrame.timestamp / EncodedVideoChunk.timestamp). Fixture:
// fps 30, GOP 90, GOP hỏng [900,990); W2 [900,974] → ts
// 30.000.000–32.466.667 µs; prefetch 412 [12150,12285] → ts
// 405.000.000–409.500.000 µs.

/** Một sự kiện VideoDecoder ghi bởi wrapper ở tầng harness. */
export interface VdTraceEvent {
  /** performance.now() (ms) lúc sự kiện xảy ra. */
  t: number;
  kind:
    | "configure"
    | "decode"
    | "decode-throw"
    | "flush-call"
    | "flush-done"
    | "output"
    | "error"
    | "close";
  /** Timestamp chunk/frame (µs) — chỉ cho decode/output. */
  ts?: number;
  /** key/delta — chỉ cho decode. */
  chunkType?: string;
  /** Thông điệp lỗi / ghi chú — chỉ cho error/decode-throw. */
  detail?: string;
}

/** Trace của một VideoDecoder instance (một lần gọi decodeGop). */
export interface VdDecoderInstance {
  id: number;
  /** performance.now() (ms) lúc `new VideoDecoder(...)`. */
  createdAt: number;
  events: VdTraceEvent[];
}

/** Đoạn [start, end] (ms) + số lần gọi — null khi không có sự kiện. */
export interface VdSpan {
  start: number;
  end: number;
  count: number;
}

function spanOf(events: VdTraceEvent[], kinds: VdTraceEvent["kind"][]): VdSpan | null {
  const hits = events.filter((e) => kinds.includes(e.kind));
  if (hits.length === 0) return null;
  return {
    start: hits[0].t,
    end: hits[hits.length - 1].t,
    count: hits.length,
  };
}

/**
 * Pha feed của instance: từ decode() đầu tiên tới decode() cuối
 * cùng (kể cả decode-throw — lần feed đó vẫn được thử). Feed loop
 * của decodeGop await getData từng chunk rồi decode() nên mốc này
 * đo trực tiếp nhịp feed, kể cả thời gian fetch Range từng chunk.
 */
export function feedSpan(inst: VdDecoderInstance): VdSpan | null {
  return spanOf(inst.events, ["decode", "decode-throw"]);
}

/** Pha flush: từ lúc flush() được gọi tới lúc promise flush resolve. */
export function flushSpan(inst: VdDecoderInstance): {
  call: number;
  done: number | null;
} | null {
  const call = inst.events.find((e) => e.kind === "flush-call");
  if (!call) return null;
  const done = inst.events.find((e) => e.kind === "flush-done");
  return { call: call.t, done: done ? done.t : null };
}

/** Số output callback tới (bao gồm) mốc tMs. */
export function outputsBefore(inst: VdDecoderInstance, tMs: number): number {
  return inst.events.filter((e) => e.kind === "output" && e.t <= tMs).length;
}

/** Tổng số output callback của instance. */
export function outputsTotal(inst: VdDecoderInstance): number {
  return inst.events.filter((e) => e.kind === "output").length;
}

/** Sự kiện error đầu tiên (short-circuit) — null khi decoder khỏe. */
export function errorEvent(inst: VdDecoderInstance): VdTraceEvent | null {
  return inst.events.find((e) => e.kind === "error") ?? null;
}

/** Mốc output cuối cùng — null khi decoder không output frame nào. */
export function lastOutputAt(inst: VdDecoderInstance): number | null {
  const outs = inst.events.filter((e) => e.kind === "output");
  return outs.length ? outs[outs.length - 1].t : null;
}

export type DecoderRole = "w2" | "prefetch" | "other";

export interface DecoderClassification {
  role: DecoderRole;
  reason: string;
}

/**
 * Phân loại một decoder instance trong attempt race:
 * - "w2": được tạo SAU lúc toggle (t0) và feed chunk có timestamp
 *   trong khoảng W2 [900,974] (30–32,47 s). Chỉ W2 mới thỏa cả hai.
 * - "prefetch": được tạo TRƯỚC lúc toggle, còn sống lúc toggle
 *   (feed chưa xong hoặc flush chưa resolve lúc t0) và feed chunk
 *   có timestamp trong khoảng prefetch 412 [12150,12285] (405–409,5 s)
 *   — tức đúng prefetch đang bay mà cổng C2 đã khóa (khóa inFlight
 *   "12150:12285"). Điều kiện tạo-trước-toggle là cần thiết: sau
 *   toggle wanted đã tắt nên không còn prefetch mới nào khởi động.
 * - "other": mọi decoder còn lại (setup window, prefetch setup,
 *   decode cửa sổ 412, gate thử lại...).
 * Dung sai tạo sau t0 là 1 ms (cùng 1 eval toggleAndW2 tạo decoder
 * W2 ngay sau t0, không thể tạo trước).
 */
export function classifyDecoderInstance(
  inst: VdDecoderInstance,
  opts: {
    t0Perf: number;
    w2TsMinUs: number;
    w2TsMaxUs: number;
    prefetchTsMinUs: number;
    prefetchTsMaxUs: number;
  },
): DecoderClassification {
  const decodes = inst.events.filter((e) => e.kind === "decode" || e.kind === "decode-throw");
  const hasW2Chunk = decodes.some(
    (e) => e.ts !== undefined && e.ts >= opts.w2TsMinUs && e.ts <= opts.w2TsMaxUs,
  );
  const hasPrefetchChunk = decodes.some(
    (e) => e.ts !== undefined && e.ts >= opts.prefetchTsMinUs && e.ts <= opts.prefetchTsMaxUs,
  );
  const feed = feedSpan(inst);
  const flush = flushSpan(inst);
  const lastActivity =
    feed || flush
      ? Math.max(feed?.end ?? -Infinity, flush?.done ?? flush?.call ?? -Infinity)
      : inst.createdAt;
  const aliveAtToggle = lastActivity >= opts.t0Perf;
  if (inst.createdAt >= opts.t0Perf - 1 && hasW2Chunk) {
    return {
      role: "w2",
      reason:
        `tạo sau toggle (createdAt=${inst.createdAt.toFixed(1)} >= t0=${opts.t0Perf.toFixed(1)}) ` +
        `và feed chunk trong khoảng W2 (${decodes.filter((e) => e.ts !== undefined && e.ts >= opts.w2TsMinUs && e.ts <= opts.w2TsMaxUs).length} chunk)`,
    };
  }
  if (aliveAtToggle && hasPrefetchChunk && inst.createdAt < opts.t0Perf) {
    return {
      role: "prefetch",
      reason:
        `tạo trước toggle (createdAt=${inst.createdAt.toFixed(1)} < t0=${opts.t0Perf.toFixed(1)}), ` +
        `còn sống lúc toggle (hoạt động cuối ${lastActivity.toFixed(1)} >= t0) ` +
        `và feed chunk trong khoảng prefetch 412 (${decodes.filter((e) => e.ts !== undefined && e.ts >= opts.prefetchTsMinUs && e.ts <= opts.prefetchTsMaxUs).length} chunk)`,
    };
  }
  return {
    role: "other",
    reason:
      `không phải W2 (tạo ${inst.createdAt < opts.t0Perf - 1 ? "trước" : "sau"} toggle, có chunk W2: ${hasW2Chunk}) ` +
      `và không phải prefetch đang bay (sống lúc toggle: ${aliveAtToggle}, có chunk prefetch: ${hasPrefetchChunk})`,
  };
}

export interface SettleGapSplit {
  /** Gap gốc settle − W2end (ms, phải >= 0 trong race hợp lệ). */
  gapMs: number;
  /** Phần gap mà feed prefetch vẫn đang chạy (feedEnd sau W2end). */
  feedTailMs: number;
  /** Phần gap nằm trong [flush() gọi, flush() resolve]. */
  flushTailMs: number;
  /** Phần gap sau khi flush resolve (resolve promise + poll harness). */
  drainTailMs: number;
  /** Pha chiếm đa số gap: "feed" | "flush" | "drain" | "none" (gap 0). */
  dominant: "feed" | "flush" | "drain" | "none";
  /** Tỉ lệ từng pha trên gap (0–1, tổng = 1 khi gap > 0). */
  shares: { feed: number; flush: number; drain: number };
  /** Cảnh báo khi thứ tự pha bất thường (flush chưa resolve, feed sau flush...). */
  anomaly: string | null;
  detail: string;
}

/**
 * Tách gap settle−W2end thành 3 pha nối tiếp của prefetch, theo
 * đúng thứ tự code decodeGop: feed (vòng decode từng chunk) →
 * flush (await decoder.flush()) → drain/resolve (promise `done`
 * resolve → prefetchWindow .finally xóa khóa inFlight → harness
 * poll thấy inFlight 1→0).
 *
 * Ba pha phân hoạch đúng đoạn [w2end, settle] khi feedEnd <=
 * flushCall <= flushDone <= settle (thứ tự bình thường của prefetch
 * khỏe mạnh): feedTail = phần [w2end, settle] còn trong feed,
 * flushTail = phần còn trong flush, drainTail = phần sau flushDone.
 * Tổng 3 pha = gap (sai số làm tròn 0,1 ms). Khi flush chưa resolve
 * (flushDone null) thì drainTail không xác định — trả anomaly và
 * drainTail = phần còn lại sau flushCall (giới hạn trên, không phải
 * đo trực tiếp).
 */
export function splitSettleGap(input: {
  w2endMs: number;
  settleAtMs: number;
  feedEndMs: number | null;
  flushCallMs: number | null;
  flushDoneMs: number | null;
}): SettleGapSplit {
  const gapMs = Math.max(0, input.settleAtMs - input.w2endMs);
  const w2end = input.w2endMs;
  const settle = input.settleAtMs;
  let anomaly: string | null = null;
  const feedEnd = input.feedEndMs ?? -Infinity;
  const flushCall = input.flushCallMs ?? Infinity;
  const flushDone = input.flushDoneMs;
  if (flushDone === null && input.flushCallMs !== null) {
    anomaly = "flush đã gọi nhưng chưa resolve lúc settle — drainTail chỉ là giới hạn trên, không phải đo trực tiếp";
  }
  if (input.flushCallMs !== null && input.feedEndMs !== null && flushCall < feedEnd - 0.5) {
    anomaly = (anomaly ? anomaly + "; " : "") + "flush gọi TRƯỚC khi feed xong — sai thứ tự decodeGop, kiểm tra lại trace";
  }
  if (flushDone !== null && input.flushCallMs !== null && flushDone < flushCall) {
    anomaly = (anomaly ? anomaly + "; " : "") + "flush resolve TRƯỚC khi flush gọi — trace sai đồng hồ, không dùng được";
  }
  // Phân hoạch [w2end, settle]: feed → flush → drain.
  const feedTailMs = Math.max(0, Math.min(feedEnd, settle) - w2end);
  const flushStart = Math.max(flushCall, w2end);
  const flushEnd = flushDone !== null ? Math.min(flushDone, settle) : settle;
  const flushTailMs = Math.max(0, flushEnd - flushStart);
  const drainFrom = flushDone !== null ? Math.max(flushDone, w2end) : flushStart;
  const drainTailMs = Math.max(0, settle - drainFrom);
  // Chuẩn hóa: do làm tròn, nếu tổng lệch gap > 0,2 ms thì ghi anomaly.
  const sum = feedTailMs + flushTailMs + drainTailMs;
  if (gapMs > 0 && Math.abs(sum - gapMs) > 0.2) {
    anomaly = (anomaly ? anomaly + "; " : "") + `tổng 3 pha (${sum.toFixed(1)} ms) lệch gap (${gapMs.toFixed(1)} ms) — thứ tự pha bất thường`;
  }
  const shares = gapMs > 0
    ? { feed: feedTailMs / gapMs, flush: flushTailMs / gapMs, drain: drainTailMs / gapMs }
    : { feed: 0, flush: 0, drain: 0 };
  const dominant =
    gapMs <= 0
      ? "none"
      : feedTailMs >= flushTailMs && feedTailMs >= drainTailMs
        ? "feed"
        : flushTailMs >= drainTailMs
          ? "flush"
          : "drain";
  return {
    gapMs,
    feedTailMs,
    flushTailMs,
    drainTailMs,
    dominant,
    shares,
    anomaly,
    detail:
      `gap ${gapMs.toFixed(1)} ms = feed ${feedTailMs.toFixed(1)} ms ` +
      `(${(shares.feed * 100).toFixed(0)}%) + flush ${flushTailMs.toFixed(1)} ms ` +
      `(${(shares.flush * 100).toFixed(0)}%) + drain/resolve ${drainTailMs.toFixed(1)} ms ` +
      `(${(shares.drain * 100).toFixed(0)}%) — pha chiếm đa số: ${dominant}` +
      (anomaly ? ` — CẢNH BÁO: ${anomaly}` : ""),
  };
}

export interface W2DecodedDirect {
  /** Số frame decoder W2 output TRƯỚC khi error callback bắn. */
  outputsBeforeError: number;
  /** Tổng số frame decoder W2 output (sau error không còn output mới). */
  outputsTotal: number;
  /** Số chunk đã feed TRƯỚC khi error bắn (= số decode() trước error). */
  decodeCallsBeforeError: number;
  /** Tổng số decode() đã gọi (feed dừng sau error do decode() throw). */
  decodeCallsTotal: number;
  /** Mốc error callback (ms, performance.now) — null khi không lỗi. */
  errorAtMs: number | null;
  errorDetail: string | null;
  /** flush() có được gọi không (W2 short-circuit thì thường KHÔNG). */
  flushCalled: boolean;
  flushDoneAtMs: number | null;
  closedAtMs: number | null;
  /** Số output sau error (bình thường = 0; > 0 là bất thường). */
  outputsAfterError: number;
  detail: string;
}
/**
 * Đo decoded TRỰC TIẾP của W2: đếm output callback của chính decoder
 * W2 trước khi error callback bắn. Khác với `decoded` suy ra 0 của
 * B1/C2 (luật production classifyFailedW2 khi ok=false): đây là số
 * frame decoder thật sự đã nhả ra trước khi chạm GOP hỏng.
 *
 * Giới hạn đo (ghi rõ, không giấu): output callback đếm frame decoder
 * nhả ra; production chỉ tăng `decoded` khi frame CHƯA có trong cache
 * và timestamp map được sang sample index. Với cửa sổ W2 [900,974]
 * không chồng cache lúc đó (cache giữ cửa sổ 412 + prefetch) và
 * timestamp sample là duy nhất (30 fps, không trùng presentation
 * timestamp) nên outputsBeforeError == decoded thật của decodeGop
 * trong fixture này — nếu 2 điều kiện đó vỡ thì số này là giới hạn
 * trên của decoded, không phải decoded chính xác.
 */
export function w2DecodedDirect(inst: VdDecoderInstance): W2DecodedDirect {
  const err = errorEvent(inst);
  // Mốc cắt "trước khi short-circuit" tính theo THỨ TỰ GHI trong
  // mảng events (không so timestamp: hai sự kiện cùng mili-giây
  // không xếp được bằng t — lượt 1 attempt 2/3: decode và
  // decode-throw cùng @803.8 ms, so bằng t đếm nhầm 0 chunk thành
  // công trong khi decode() đầu đã thành công). Mốc cắt là error
  // callback nếu có; nếu KHÔNG có error (trường hợp W2 đo được:
  // feed dừng do decode() ném "key frame required") thì mốc cắt là
  // lần decode-throw đầu tiên; không có cả hai thì đếm toàn bộ.
  const errIdx = inst.events.findIndex((e) => e.kind === "error");
  const throwIdx = inst.events.findIndex((e) => e.kind === "decode-throw");
  const cutIdx = errIdx >= 0 ? errIdx : throwIdx >= 0 ? throwIdx : Number.POSITIVE_INFINITY;
  const firstThrow = throwIdx >= 0 ? inst.events[throwIdx] : null;
  let outputsBeforeError = 0;
  let outputsAfterError = 0;
  let decodeCallsBeforeError = 0;
  let outputsTotal = 0;
  let decodeCallsTotal = 0;
  inst.events.forEach((e, i) => {
    if (e.kind === "output") {
      outputsTotal++;
      if (i < cutIdx) outputsBeforeError++;
      if (err && i >= errIdx) outputsAfterError++;
    }
    if (e.kind === "decode" || e.kind === "decode-throw") {
      decodeCallsTotal++;
      if (i < cutIdx) decodeCallsBeforeError++;
    }
  });
  const flush = flushSpan(inst);
  const close = inst.events.find((e) => e.kind === "close");
  return {
    outputsBeforeError,
    outputsTotal,
    decodeCallsBeforeError,
    decodeCallsTotal,
    errorAtMs: err ? err.t : null,
    errorDetail: err?.detail ?? null,
    flushCalled: flush !== null,
    flushDoneAtMs: flush?.done ?? null,
    closedAtMs: close ? close.t : null,
    outputsAfterError,
    detail:
      err
        ? `W2 short-circuit: error lúc ${err.t.toFixed(1)} ms sau ${decodeCallsBeforeError} chunk đã feed, ` +
          `decoder đã output ${outputsBeforeError} frame trước lỗi` +
          ` (tổng output ${outputsTotal}, output sau lỗi ${outputsAfterError}, ` +
          `flush ${flush ? (flush.done !== null ? "đã gọi + resolve" : "đã gọi, chưa resolve") : "KHÔNG gọi"})` +
          (err.detail ? ` — lỗi: ${err.detail}` : "")
        : firstThrow
          ? `W2 KHÔNG lỗi (không có error callback): feed dừng do decode() ném lúc ${firstThrow.t.toFixed(1)} ms ` +
            `sau ${decodeCallsBeforeError} chunk feed thành công, decoder output ${outputsBeforeError} frame` +
            ` (tổng ${decodeCallsTotal} lần decode, flush ${flush ? "đã gọi" : "KHÔNG gọi"})` +
            (firstThrow.detail ? ` — ném: ${firstThrow.detail}` : "")
          : `W2 KHÔNG lỗi: decoder output ${outputsTotal} frame sau ${decodeCallsTotal} chunk đã feed` +
            ` (flush ${flush ? "đã gọi" : "KHÔNG gọi"})`,
  };
}

/**
 * Mốc đuôi của prefetch đổi sang đồng hồ t0-tương đối (ms kể từ lúc
 * toggle, cùng đồng hồ với mẫu settle của harness và w2endRel).
 *
 * BẮT BUỘC trước khi gọi splitSettleGap: mọi mốc sự kiện trong
 * trace đều là performance.now() TUYỆT ĐỐI (tính từ lúc page load,
 * ~19000 ms trong attempt 1), trong khi settleAtMs/w2endMs là
 * TƯƠNG ĐỐI t0 (~2000 ms). Đưa mốc tuyệt đối thẳng vào split sẽ
 * làm feedTail nuốt trọn gap (feedEnd tuyệt đối luôn > settle
 * tương đối) — đúng bug D2 gặp ở lượt headed đầu (6/6 attempt báo
 * feed 100% sai; xem LIMITS D2 §5). Hàm này là chốt chặn duy nhất
 * cho việc đổi đồng hồ, khóa bằng test với số thật attempt 1.
 */
export interface PrefetchTailSpans {
  /** feedEnd − t0 (ms, âm khi feed xong trước toggle). */
  feedEndRelMs: number | null;
  /** flushCall − t0 (ms). */
  flushCallRelMs: number | null;
  /** flushDone − t0 (ms, null khi flush chưa resolve). */
  flushDoneRelMs: number | null;
}

export function prefetchTailSpans(
  inst: VdDecoderInstance,
  t0Perf: number,
): PrefetchTailSpans {
  const feed = feedSpan(inst);
  const flush = flushSpan(inst);
  return {
    feedEndRelMs: feed ? feed.end - t0Perf : null,
    flushCallRelMs: flush ? flush.call - t0Perf : null,
    flushDoneRelMs: flush && flush.done !== null ? flush.done - t0Perf : null,
  };
}

/** Tóm tắt một decoder instance trong attempt (để log + JSON). */
export interface VdInstanceSummary {
  id: number;
  createdAt: number;
  role: DecoderRole;
  reason: string;
  feed: VdSpan | null;
  flush: { call: number; done: number | null } | null;
  outputs: number;
}

/** Kết quả phân tích trace VideoDecoder của một attempt race. */
export interface VdAttemptAnalysis {
  t0Perf: number;
  w2endRelMs: number | null;
  settleAtMs: number | null;
  instanceCount: number;
  w2Candidates: number;
  prefetchCandidates: number;
  instances: VdInstanceSummary[];
  /** decoded trực tiếp của W2 (null khi không tìm thấy decoder W2). */
  w2decoded: W2DecodedDirect | null;
  /** Gap tách pha (null khi thiếu settle hoặc thiếu prefetch). */
  split: SettleGapSplit | null;
  /** Số output của prefetch tới cuối W2 (trên đồng hồ tuyệt đối). */
  prefetchOutputsBeforeW2end: number | null;
  prefetchOutputsTotal: number | null;
}

/**
 * Phân tích trace VideoDecoder của một attempt: phân loại instance,
 * đếm decoded trực tiếp của W2, tách gap settle−W2end thành
 * feed/flush/drain. vd = snapshot từ Y.vdTrace()
 * ({ instances: [...] }); t0Perf = mốc toggle tuyệt đối
 * (performance.now trong page); w2endRelMs = cuối W2 trên đồng hồ
 * t0-tương đối (durMs + w2startOffset); settleAtMs = settle trên
 * cùng đồng hồ t0-tương đối (null khi không thấy settle — vẫn trả
 * classification + decoded trực tiếp của W2, chỉ split = null).
 * Trả null khi không lấy được trace/t0 (harness ghi rõ ở log,
 * không bịa số).
 */
export function analyzeVdTrace(
  vd: { instances: VdDecoderInstance[] } | null,
  t0Perf: number | null,
  w2endRelMs: number | null,
  settleAtMs: number | null,
): VdAttemptAnalysis | null {
  if (!vd || !Array.isArray(vd.instances) || vd.instances.length === 0 || t0Perf == null) {
    return null;
  }
  const t0 = t0Perf;
  const opts = {
    t0Perf: t0,
    w2TsMinUs: 30_000_000,
    w2TsMaxUs: 32_466_667,
    prefetchTsMinUs: 405_000_000,
    prefetchTsMaxUs: 409_500_000,
  };
  const instances: VdInstanceSummary[] = vd.instances.map((ins) => {
    const cls = classifyDecoderInstance(ins, opts);
    const feed = feedSpan(ins);
    const flush = flushSpan(ins);
    return {
      id: ins.id,
      createdAt: +ins.createdAt.toFixed(1),
      role: cls.role,
      reason: cls.reason,
      feed: feed
        ? { start: +feed.start.toFixed(1), end: +feed.end.toFixed(1), count: feed.count }
        : null,
      flush: flush
        ? { call: +flush.call.toFixed(1), done: flush.done != null ? +flush.done.toFixed(1) : null }
        : null,
      outputs: outputsTotal(ins),
    };
  });
  const w2c = instances.filter((c) => c.role === "w2");
  const pfc = instances.filter((c) => c.role === "prefetch");
  const w2inst = w2c.length ? vd.instances.find((x) => x.id === w2c[0].id) ?? null : null;
  const pfInst = pfc.length ? vd.instances.find((x) => x.id === pfc[0].id) ?? null : null;
  const w2d = w2inst ? w2DecodedDirect(w2inst) : null;
  // Chốt chặn đồng hồ (xem prefetchTailSpans): split CHỈ nhận mốc
  // t0-tương đối, không bao giờ nhận mốc tuyệt đối.
  const spans = pfInst ? prefetchTailSpans(pfInst, t0) : null;
  const split =
    w2endRelMs != null && settleAtMs != null && pfInst && spans
      ? splitSettleGap({
          w2endMs: w2endRelMs,
          settleAtMs,
          feedEndMs: spans.feedEndRelMs,
          flushCallMs: spans.flushCallRelMs,
          flushDoneMs: spans.flushDoneRelMs,
        })
      : null;
  return {
    t0Perf: +t0.toFixed(1),
    w2endRelMs: w2endRelMs != null ? +w2endRelMs.toFixed(1) : null,
    settleAtMs: settleAtMs != null ? +settleAtMs.toFixed(1) : null,
    instanceCount: vd.instances.length,
    w2Candidates: w2c.length,
    prefetchCandidates: pfc.length,
    instances,
    w2decoded: w2d,
    split,
    prefetchOutputsBeforeW2end:
      pfInst && w2endRelMs != null ? outputsBefore(pfInst, t0 + w2endRelMs) : null,
    prefetchOutputsTotal: pfInst ? outputsTotal(pfInst) : null,
  };
}
