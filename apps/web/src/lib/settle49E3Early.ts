// settle49E3Early.ts — Phase 9 đợt 49, luồng E3: phân tích settle-sớm
// của hướng (b) (resolve sớm khi đủ frame mới) từ trace VideoDecoder.
//
// Bối cảnh đo (lượt headed run3, code đã sửa (b)): prefetch resolve
// sớm ở output thứ 90 nên khóa inFlight bị xóa TRƯỚC khi harness kịp
// lấy mẫu đầu tiên sau toggle — vòng trace của D2 chỉ thấy inFlight=0
// từ mẫu đầu nên báo INVALID-no-settle (mù), dù settle đã xảy ra.
// Module này đo settle bằng đồng hồ TRONG page (trace), không qua
// vòng CDP: mốc resolve = lúc output thứ 90 của frame MỚI (decoded
// chạm expectedNew → `done` resolve đồng bộ trong output callback),
// so với cuối W2 trên cùng đồng hồ t0.
//
// Hai điểm khác D2 (ghi rõ, không sửa module D2):
// - Tìm prefetch KHÔNG dùng điều kiện "sống lúc toggle" của
//   classifyDecoderInstance (settle48D2.ts): điều kiện đó lấy
//   lastActivity = max(feed.end, flush.done ?? flush.call) mà BỎ QUA
//   output — khi trace snapshot sớm (flush chưa resolve) thì
//   lastActivity chỉ tới flush-call (trước t0) dù decoder vẫn đang
//   output sau t0, nên prefetch bị nhận nhầm thành "other" (run3:
//   prefetch=0 trong khi instance prefetch rõ ràng còn sống).
//   E3 tìm bằng: tạo trước t0 + feed chunk có ts dưới cửa sổ 412.
// - Mốc resolve tính bằng DISTINCT frame-ts mới (không đếm trùng
//   timestamp): decoded của decodeGop chỉ tăng khi 1 index MỚI được
//   set — output trùng ts bị close, không tăng decoded.
//
// Fixture: 360p GOP 90; cửa sổ 412 [12240,12360] → chunk ts
// 408.066.667–412.033.333 µs; prefetch 412 [12150,12285] → chunk ts
// 405.066.667–409.533.333 µs; frame mới [12150,12239] = 90 sample đầu
// của prefetch (chunk ts lấy từ decode events, không tính tay —
// presentation timestamp có offset edit-list +66.667 µs so với
// index×33.333).
import type { VdDecoderInstance } from "./settle48D2";

/**
 * Tìm instance prefetch 412 trong trace: được tạo TRƯỚC lúc toggle
 * và feed ít nhất 1 chunk có timestamp dưới cửa sổ 412
 * (windowTsMinUs = ts chunk đầu của cửa sổ hiện tại, 408.066.667 µs
 * trong fixture này). Cửa sổ 412 tự nó cũng feed chunk trong khoảng
 * prefetch ([408, 409,5] s chồng nhau) nhưng KHÔNG có chunk nào dưới
 * 408.066.667 µs nên không bị nhận nhầm. Trả null khi không thấy.
 */
export function findPrefetchInstance(
  instances: VdDecoderInstance[],
  t0Perf: number,
  windowTsMinUs: number,
): VdDecoderInstance | null {
  for (const ins of instances) {
    if (!(ins.createdAt < t0Perf)) continue;
    const decodes = ins.events.filter(
      (e) => e.kind === "decode" || e.kind === "decode-throw",
    );
    if (
      decodes.some((e) => e.ts !== undefined && e.ts < windowTsMinUs)
    ) {
      return ins;
    }
  }
  return null;
}

/**
 * Mốc resolve sớm của prefetch (ms, tương đối t0): lúc output thứ N
 * của frame MỚI — N = newTimestamps.length (90 trong fixture này).
 * newTimestamps = chunk timestamp của N sample mới đầu range (lấy từ
 * decode events của chính instance, theo thứ tự feed). Đếm DISTINCT
 * ts (output trùng ts không tăng decoded của decodeGop). Trả null
 * khi chưa đủ N output mới (prefetch chưa đủ frame — không resolve
 * sớm được, rơi về flush như cũ).
 */
export function earlyResolveTimeMs(
  inst: VdDecoderInstance,
  t0Perf: number,
  newTimestamps: number[],
): { tRelMs: number; newOutputs: number } | null {
  const n = newTimestamps.length;
  if (n === 0) return null;
  const wanted = new Set(newTimestamps);
  const seen = new Set<number>();
  for (const e of inst.events) {
    if (e.kind !== "output" || e.ts === undefined) continue;
    if (!wanted.has(e.ts)) continue;
    if (seen.has(e.ts)) continue;
    seen.add(e.ts);
    if (seen.size >= n) {
      return { tRelMs: e.t - t0Perf, newOutputs: seen.size };
    }
  }
  return null;
}

export type EarlySettleClass =
  | "SUCCESS-early-settle"
  | "SUCCESS-early-settle-unverified-drop"
  | "PARTIAL-early-settle-no-drop"
  | "PARTIAL-early-settle-late"
  | "INVALID-no-early-resolve-time";

/**
 * Phân loại attempt settle-sớm (hướng (b)) từ mốc resolve trong page
 * + mẫu cuối sau khi chờ drop hoãn:
 * - settle trước cuối W2 (tResolve < w2end) + cache đã về đúng cửa sổ
 *   hiện tại + settled counter đủ frame mới → SUCCESS-early-settle.
 * - settle trước cuối W2 nhưng không đọc được cache/settled cuối
 *   (null) → SUCCESS-early-settle-unverified-drop (settle thắng,
 *   drop chưa kiểm chứng — không claim drop).
 * - settle trước cuối W2 nhưng cache cuối vẫn thừa frame (drop bị
 *   bỏ qua — nợ drop của (b) khi chưa có fix disableDecodeAhead) →
 *   PARTIAL-early-settle-no-drop.
 * - settle sau cuối W2 → PARTIAL-early-settle-late ((b) không thắng
 *   attempt này).
 * - không tính được mốc resolve hoặc cuối W2 → INVALID.
 */
export function classifyEarlySettle(input: {
  tResolveRelMs: number | null;
  w2endRelMs: number | null;
  cacheAfterWait: number | null;
  settledAfterWait: number | null;
  windowFrames: number;
  newFrames: number;
}): { cls: EarlySettleClass; detail: string } {
  const { tResolveRelMs, w2endRelMs } = input;
  if (tResolveRelMs === null || w2endRelMs === null) {
    return {
      cls: "INVALID-no-early-resolve-time",
      detail:
        `không tính được mốc resolve sớm (tResolve=${tResolveRelMs} ms, w2end=${w2endRelMs} ms) — ` +
        `prefetch chưa đủ frame mới hoặc thiếu timing W2`,
    };
  }
  const margin = w2endRelMs - tResolveRelMs;
  if (margin <= 0) {
    return {
      cls: "PARTIAL-early-settle-late",
      detail:
        `settle-sớm ở +${tResolveRelMs.toFixed(1)} ms, SAU cuối W2 (+${w2endRelMs.toFixed(1)} ms) ` +
        `chênh ${(-margin).toFixed(1)} ms — hướng (b) không thắng attempt này`,
    };
  }
  if (input.cacheAfterWait === null || input.settledAfterWait === null) {
    return {
      cls: "SUCCESS-early-settle-unverified-drop",
      detail:
        `settle-sớm ở ${tResolveRelMs >= 0 ? "+" : ""}${tResolveRelMs.toFixed(1)} ms, TRƯỚC cuối W2 ` +
        `(+${w2endRelMs.toFixed(1)} ms) ${margin.toFixed(1)} ms — nhưng không đọc được cache/settled cuối nên chưa kiểm chứng drop`,
    };
  }
  if (
    input.cacheAfterWait === input.windowFrames &&
    input.settledAfterWait >= input.newFrames
  ) {
    return {
      cls: "SUCCESS-early-settle",
      detail:
        `settle-sớm ở ${tResolveRelMs >= 0 ? "+" : ""}${tResolveRelMs.toFixed(1)} ms, TRƯỚC cuối W2 ` +
        `(+${w2endRelMs.toFixed(1)} ms) ${margin.toFixed(1)} ms; drop đã xong (cache ${input.cacheAfterWait} = cửa sổ, ` +
        `settled ${input.settledAfterWait} >= ${input.newFrames} frame mới)`,
    };
  }
  return {
    cls: "PARTIAL-early-settle-no-drop",
    detail:
      `settle-sớm ở ${tResolveRelMs >= 0 ? "+" : ""}${tResolveRelMs.toFixed(1)} ms, TRƯỚC cuối W2 ` +
      `(+${w2endRelMs.toFixed(1)} ms) ${margin.toFixed(1)} ms, NHƯNG drop chưa xong sau khi chờ ` +
      `(cache cuối ${input.cacheAfterWait} != cửa sổ ${input.windowFrames} hoặc settled cuối ${input.settledAfterWait} < ${input.newFrames}) — ` +
      `frame prefetch còn nằm lại (nợ drop của (b))`,
  };
}
