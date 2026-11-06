// settle47C2.ts — Phase 9 đợt 47, luồng C2: bắt SUCCESS đường asset:
// (settle-drop dọn đúng entry đang thử lại).
//
// Nợ mở từ docs/PHASE9_ROUND46_B1_SETTLE_LIMITS.md §6.1 + §3.3:
// SUCCESS đường asset: vẫn mở, 0/4 attempt (2 không tới W2, 2 PARTIAL
// trượt sau W2 chỉ ~36–43 ms). B1 đã bác giả thuyết "tràn GOP lành"
// của Z1 và khóa được 2 cái bẫy harness (coalescing, range cũ), nhưng
// aim siêu chặt của B1 còn 2 chỗ sai số học mà C2 chứng minh bằng sổ
// tay từ chính log rerun của B1 (b1-result.json, attempt 2/4):
//   (a) Baseline cũ: aim B1 dùng setup.cacheSize = 91 (cửa sổ setup
//       [12420,12510]) làm gốc, nhưng cửa sổ setup đã bị evict khi
//       decode cửa sổ 412 xong — gốc sống lúc aim là cửa sổ 412
//       [12240,12360] = 121 frame. Lệch gốc = 30 frame.
//   (b) prefetchFrames cũ: aim B1 dùng prefetchFrames ở lần poll đầu
//       (107 = prefetch của cửa sổ SETUP, range [12330,12435]), trong
//       khi prefetch đang chạy lúc aim là của cửa sổ 412
//       (range [12150,12285] = 136 frame, chồng cửa sổ 412 đúng 46
//       frame nên chỉ thêm 90 frame MỚI). Lệch khung = 29 frame.
//   (c) Hai prefetch có thể cùng bay: prefetch setup chưa chắc đã
//       settle khi prefetch 412 khởi động; frame của nó (đoạn
//       [12361,12435] decode sau lần evict của cửa sổ 412) đội cache
//       lên và làm "còn lại" tính từ cache bị đánh giá thấp.
// Hệ quả đo được: B1 tắt ở cache 201–203 trong khi mốc đúng cho
// slack 3 là 121 + 90 − 3 = 208 — tức còn ~5–8 frame mới (chưa tính
// nhiễm (c)), và settle tới ở +203–214 ms, trượt sau W2
// (~160–180 ms) ~36–43 ms. C2 sửa đúng 2 chỗ này ở tầng harness
// (KHÔNG sửa production): gốc = kích thước cửa sổ hiện tại
// (lastDecodeRange), khung = prefetch ĐANG CHẠY (aheadRange hiện
// tại), và chờ tới khi chỉ còn đúng prefetch đó bay mới aim.
// Module này khóa số học đó (thuần, test được không cần browser) để
// harness headed dùng chung một định nghĩa, không mỗi lần một cách
// tính còn lại khác nhau. KHÔNG được import bởi production code.
//
// Quy ước: mọi range đều là [from, to] BAO CẢ hai đầu, theo
// decode-index (đúng thứ tự decodeGop dùng). Số frame MỚI của một
// prefetch = độ dài aheadRange trừ phần chồng với cửa sổ hiện tại
// (phần chồng đã nằm trong cache từ lần decode cửa sổ, decodeGop
// của prefetch không đếm lại chúng — output callback chỉ tăng
// `decoded` khi frame chưa có trong cache).

import {
  analyzeWindowVsCorrupt,
  mirrorDecodeWindow,
  type CorruptGopRange,
  type W2DecodeWindow,
} from "./settle45A1";

/** Một đoạn decode [from, to] bao cả hai đầu (null = không có đoạn). */
export interface DecodeRange {
  from: number;
  to: number;
}

/** Độ dài một đoạn (0 khi null hoặc to < from). */
export function rangeLength(r: DecodeRange | null): number {
  if (!r) return 0;
  return Math.max(0, r.to - r.from + 1);
}

/** Số frame chung của hai đoạn (0 khi rời nhau hoặc có đoạn null). */
export function overlapFrames(
  a: DecodeRange | null,
  b: DecodeRange | null,
): number {
  if (!a || !b) return 0;
  const from = Math.max(a.from, b.from);
  const to = Math.min(a.to, b.to);
  return Math.max(0, to - from + 1);
}

/**
 * Số frame MỚI mà prefetch aheadRange sẽ thêm vào cache (chưa tính
 * frame đã decode dở): độ dài aheadRange trừ phần chồng với cửa sổ
 * hiện tại. Ví dụ fixture B1: cửa sổ 412 [12240,12360] + ahead
 * [12150,12285] (136 frame, chồng 46) → 90 frame mới; cửa sổ setup
 * [12420,12510] + ahead [12330,12435] (106 frame, chồng 16) → 90.
 */
export function prefetchNewFrames(
  windowRange: DecodeRange | null,
  aheadRange: DecodeRange | null,
): number {
  if (!aheadRange) return 0;
  return Math.max(0, rangeLength(aheadRange) - overlapFrames(windowRange, aheadRange));
}

/**
 * Mốc cache để tắt (aim): kích thước cửa sổ hiện tại + frame mới của
 * prefetch − slack. Slack = số frame mới tối đa còn lại lúc tắt
 * (B1 dùng 3; C2 giữ 3 ở sóng 1, chỉ sửa gốc + khung). Kết quả chặn
 * dưới ở windowSize: slack lớn hơn số frame mới thì mốc không thấp
 * hơn cửa sổ hiện tại (đã qua mốc thì aim bắn ngay, không âm).
 */
export function aimTargetCache(
  windowSize: number,
  newFrames: number,
  slack: number,
): number {
  const w = Math.max(0, Math.floor(windowSize));
  const n = Math.max(0, Math.floor(newFrames));
  const s = Math.max(0, Math.floor(slack));
  return Math.max(w, w + n - s);
}

/**
 * Số frame mới còn lại lúc này: (cửa sổ hiện tại + frame mới) −
 * cache đang giữ, chặn dưới 0. Cache đội lên do prefetch khác
 * (nhiễm 2 prefetch, xem đầu file) làm số này đánh giá THẤP hơn
 * thực tế — nên harness phải chờ chỉ còn prefetch đang chạy rồi mới
 * dùng số này làm mốc tắt.
 */
export function remainingNewFrames(
  windowSize: number,
  newFrames: number,
  cacheNow: number,
): number {
  const total = Math.max(0, Math.floor(windowSize)) + Math.max(0, Math.floor(newFrames));
  return Math.max(0, total - Math.max(0, Math.floor(cacheNow)));
}

/** Khóa prefetch mà production dùng trong Set inFlight: "from:to". */
export function operativePrefetchKey(
  aheadRange: DecodeRange | null,
): string | null {
  if (!aheadRange) return null;
  return `${aheadRange.from}:${aheadRange.to}`;
}

export type SettleGapKind = "during-w2" | "after-w2" | "before-w2";

export interface SettleGap {
  kind: SettleGapKind;
  /**
   * Độ lệch (ms): sau W2 thì settle − cuối W2 (> 0, số ms trượt);
   * trong W2 thì settle − cuối W2 (<= 0, còn |delta| ms trước khi
   * W2 kết thúc); trước W2 thì settle − đầu W2 (< 0).
   */
  deltaMs: number;
  detail: string;
}

/**
 * Phân loại thời điểm prefetch settle so với cửa sổ W2 đang bay.
 * SUCCESS của Y1 cần kind = during-w2 (settle rơi vào trong lúc W2
 * bay thì nhánh hoãn-dọn mới chạy: dropSettledPrefetchIfOff thấy
 * decodePromise != null nên hoãn tới khi W2 xong). B1: settle +214 ms,
 * W2 [0, 178,3] ms → after-w2, delta +35,7 ms.
 */
export function classifySettleGap(
  settleAtMs: number,
  w2StartMs: number,
  w2EndMs: number,
): SettleGap {
  if (settleAtMs < w2StartMs) {
    return {
      kind: "before-w2",
      deltaMs: settleAtMs - w2StartMs,
      detail:
        `before-w2: settle ở ${settleAtMs} ms, trước khi W2 bắt đầu ` +
        `(${w2StartMs} ms) ${w2StartMs - settleAtMs} ms — prefetch đã ` +
        `dọn xong trước khi W2 bay, không vào được nhánh hoãn`,
    };
  }
  if (settleAtMs <= w2EndMs) {
    return {
      kind: "during-w2",
      deltaMs: settleAtMs - w2EndMs,
      detail:
        `during-w2: settle ở ${settleAtMs} ms, trong lúc W2 bay ` +
        `[${w2StartMs}, ${w2EndMs}] ms, còn ${w2EndMs - settleAtMs} ms ` +
        `trước khi W2 kết thúc — đúng cửa sổ nhánh hoãn-dọn (SUCCESS nếu ` +
        `counter + cache khớp tiêu chí Y1)`,
    };
  }
  return {
    kind: "after-w2",
    deltaMs: settleAtMs - w2EndMs,
    detail:
      `after-w2: settle ở ${settleAtMs} ms, trượt sau khi W2 kết thúc ` +
      `(${w2EndMs} ms) ${settleAtMs - w2EndMs} ms — W2 đã xong nên ` +
      `prefetch dọn ngay (PARTIAL-immediate-drop), không vào nhánh thử lại`,
  };
}

/**
 * Kiểm tra một mốc W2 có giữ cửa sổ decode nằm TRỌN trong GOP hỏng
 * không (dùng mirror A1). Dùng cho probe "W2 chậm hơn": muốn W2 lâu
 * hơn bằng cửa sổ decode lớn hơn mà vẫn fail thì mốc mới phải ở
 * trong GOP hỏng (presentFrom >= corrupt.start và targetPos <=
 * corrupt.end − 1); mốc 32,9667 s (targetPos 989) là mốc muộn nhất
 * còn trong GOP hỏng [900,990) với cửa sổ hiệu dụng 75.
 */
export function w2WindowInsideCorrupt(input: {
  targetTimeSec: number;
  fps: number;
  effectiveWindow: number;
  gopFrames: number;
  corrupt: CorruptGopRange;
}): {
  feasible: boolean;
  window: W2DecodeWindow;
  reason: string;
} {
  const window = mirrorDecodeWindow({
    targetTimeSec: input.targetTimeSec,
    fps: input.fps,
    effectiveWindow: input.effectiveWindow,
    gopFrames: input.gopFrames,
  });
  const rel = analyzeWindowVsCorrupt(window, input.corrupt);
  if (rel.insideCorrupt) {
    return {
      feasible: true,
      window,
      reason:
        `mốc t=${input.targetTimeSec} s (targetPos ${window.targetPos}): ` +
        `cửa sổ decode [${window.decodeFrom},${window.decodeTo}] nằm trọn ` +
        `GOP hỏng [${input.corrupt.startFrame},${input.corrupt.endFrameExclusive})`,
    };
  }
  return {
    feasible: false,
    window,
    reason:
      `mốc t=${input.targetTimeSec} s (targetPos ${window.targetPos}): ` +
      `cửa sổ decode [${window.decodeFrom},${window.decodeTo}] KHÔNG nằm ` +
      `trọn GOP hỏng [${input.corrupt.startFrame},${input.corrupt.endFrameExclusive}) ` +
      `(healthyPrefix=${rel.healthyPrefixFrames}, healthySuffix=${rel.healthySuffixFrames}) — ` +
      `mốc này không dùng được cho probe W2-chậm-hơn`,
  };
}
