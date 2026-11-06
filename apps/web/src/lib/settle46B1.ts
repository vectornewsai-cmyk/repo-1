// settle46B1.ts — Phase 9 đợt 46, luồng B1: công cụ đo cho lần headed
// mốc 32,4667 s (nợ mở đợt 45 A1).
//
// Vấn đề: controller production KHÔNG phơi trường decoded của W2
// (decodeGop trả số frame nhưng ensureWindowForTime chỉ giữ lại
// lastWindowKey + lastDecodeRange + cache; decoded không có getter).
// Harness headed 46B1 vì vậy suy decoded từ các trường phơi được,
// theo đúng luật production — module thuần này khóa quy tắc suy đó
// để lần đo sau dùng chung một định nghĩa, không mỗi harness một
// cách suy khác nhau. Module KHÔNG được import bởi production code
// nào, không đổi hành vi app.
//
// Quy tắc suy decoded (decideW2DecodedProxy), với pre = snapshot
// TRƯỚC W2, post = snapshot SAU W2 (lastWindowKey + lastDecodeRange
// + cacheSize thật từ controller):
//  - ok=true + range ĐỔI (post khác pre): decodedProxy = cacheSize
//    sau W2. Lý do: trên đường thành công, production chạy
//    evictExcept(keep = đúng chỉ số cửa sổ decode) nên cache sau W2
//    chỉ còn frame trong cửa sổ decode đó; prefetch/setup ở ~412-417 s
//    không giao cửa sổ 32 s nên không còn frame lạ nào sót lại.
//    Cross-check bắt buộc: drawn (presentCachedReverse) phải ==
//    cacheSize và mọi drawn idx phải nằm trong [from,to]; cross-check
//    trượt thì proxy vẫn ghi nhưng phải ghi rõ là KHÔNG ĐẠT cross-check.
//  - ok=true + range KHÔNG đổi + key trùng lastWindowKey trước W2 +
//    cache trước > 0: fast-path — production return true mà không
//    decode, decoded = null (không được lấy cacheSize làm decoded).
//  - ok=true + range KHÔNG đổi + key khác: dị thường — W2 trả true
//    mà không ghi range mới; decoded = null, cấm suy.
//  - ok=false: decoded suy ra 0 theo luật production (đường full-file
//    và đường GOP đều return false khi decoded <= 0 hoặc khi
//    pre-resolve/load hỏng trước khi decode; range không đổi là nhất
//    quán với cả hai). Ghi rõ kind = inferred-from-fail-law, không
//    phải đo trực tiếp — nếu một ngày controller phơi decoded thật
//    thì số trực tiếp đó thắng suy này.
//  - ok=null (không có timing W2): unknown, decoded = null.
//
// effectiveWindow: công thức production (đường full-file):
// min(windowFrames, floor((totalBudget - retainedFileBytes) /
// bytesPerFrame)), chặn dưới 1. Với fixture Y1/Z1/B1 (640x360, file
// 69.861.131 byte, ngân sách tổng 320 MiB, bytesPerFrame 629.145):
// floor((335.544.320 - 69.861.131) / 629.145) = 422 → min(75, 422) = 75.
// Hàm nhận sẵn các hằng số làm tham số (không hardcode số production)
// để test khóa công thức, không khóa số đo.
//
// classifyWithRealRange: bọc classifyW2 của A1 nhưng dùng cửa sổ
// decode THẬT từ controller (from/to) thay vì cửa sổ mirror — vì
// mirror A1 giả định keyframe đầu GOP hỏng còn nguyên (stss), trong
// khi ffprobe-flags cho thấy IDR zero mất cờ keyframe (xem LIMITS
// B1 §1): nếu headed đo decodeFrom = 810 thì cửa sổ thật vắt qua GOP
// lành (partial-gop), nếu = 900 thì nằm trọn GOP hỏng
// (partial-inside-corrupt). Hai dự đoán này khác nhau nên bắt buộc
// phải phân loại bằng range thật, không dùng mirror thay thế.

import {
  classifyW2,
  type W2DecodeWindow,
  type W2Diagnostic,
} from "./settle45A1";

export interface W2Snapshot {
  lastWindowKey: string | null;
  lastDecodeRange: { from: number; to: number } | null;
  cacheSize: number;
}

export type DecodedProxyKind =
  | "proxy-cache-after-evict"
  | "fast-path-no-decode"
  | "anomaly-no-new-range"
  | "inferred-from-fail-law"
  | "unknown-no-timing";

export interface DecodedProxyResult {
  /** Số frame suy ra (null khi fast-path / dị thường / không timing). */
  decoded: number | null;
  kind: DecodedProxyKind;
  /** drawn.count == cacheSize sau W2 và mọi drawn idx trong [from,to]. */
  drawnCrossCheck: boolean | null;
  detail: string;
}

export function effectiveWindow(
  windowFrames: number,
  bytesPerFrame: number,
  retainedFileBytes: number,
  totalBudgetBytes: number,
): number {
  if (!(bytesPerFrame > 0) || !(totalBudgetBytes > 0)) return 1;
  const budget = Math.max(
    1,
    Math.floor((totalBudgetBytes - Math.max(0, retainedFileBytes)) / bytesPerFrame),
  );
  return Math.min(Math.max(1, Math.floor(windowFrames)), budget);
}

export interface DecideW2DecodedProxyInput {
  pre: W2Snapshot;
  post: W2Snapshot;
  /** ok của W2 (null = không có timing, chưa quan sát). */
  ok: boolean | null;
  /** presentCachedReverse sau W2 (null = harness không đọc). */
  drawn: { count: number; min: number | null; max: number | null } | null;
}

export function decideW2DecodedProxy(
  input: DecideW2DecodedProxyInput,
): DecodedProxyResult {
  const { pre, post, ok, drawn } = input;
  const preRange = pre.lastDecodeRange;
  const postRange = post.lastDecodeRange;
  const rangeChanged =
    !!postRange &&
    (!preRange ||
      postRange.from !== preRange.from ||
      postRange.to !== preRange.to);
  if (ok === null) {
    return {
      decoded: null,
      kind: "unknown-no-timing",
      drawnCrossCheck: null,
      detail:
        "unknown: không có timing W2 nên không suy được decoded — cấm kết luận từ ok một mình",
    };
  }
  if (ok === true && rangeChanged && postRange) {
    const crossCheck =
      drawn === null
        ? null
        : drawn.count === post.cacheSize &&
          (drawn.min === null ||
            (drawn.min >= postRange.from && drawn.max !== null && drawn.max <= postRange.to));
    return {
      decoded: post.cacheSize,
      kind: "proxy-cache-after-evict",
      drawnCrossCheck: crossCheck,
      detail:
        `proxy: ok=true + range mới [${postRange.from},${postRange.to}] nên ` +
        `decoded ≈ cacheSize sau evict = ${post.cacheSize}` +
        (crossCheck === false
          ? " — NHƯNG drawn cross-check TRƯỢT, proxy này không đáng tin"
          : crossCheck === true
            ? " (drawn cross-check đạt)"
            : " (không có drawn để cross-check)"),
    };
  }
  if (ok === true && !rangeChanged) {
    const isFast =
      pre.lastWindowKey !== null &&
      post.lastWindowKey === pre.lastWindowKey &&
      pre.cacheSize > 0;
    if (isFast) {
      return {
        decoded: null,
        kind: "fast-path-no-decode",
        drawnCrossCheck: null,
        detail:
          `fast-path: key ${post.lastWindowKey} == lastWindowKey trước W2 + ` +
          `cache trước = ${pre.cacheSize} > 0 nên production return true mà ` +
          `không decode — cấm lấy cacheSize làm decoded`,
      };
    }
    return {
      decoded: null,
      kind: "anomaly-no-new-range",
      drawnCrossCheck: null,
      detail:
        `dị thường: ok=true nhưng lastDecodeRange không đổi ` +
        `(${JSON.stringify(postRange)}) và key không trùng fast-path — ` +
        `W2 trả true mà không ghi range mới, decoded = null, cấm suy`,
    };
  }
  // ok === false: mọi đường fail của production đều tương ứng
  // decoded <= 0 hoặc hỏng trước khi decode (xem ghi chú đầu file).
  return {
    decoded: 0,
    kind: "inferred-from-fail-law",
    drawnCrossCheck: null,
    detail:
      `suy ra từ luật fail: ok=false + range giữ nguyên ` +
      `(${JSON.stringify(postRange)}) → decoded suy ra 0 (không phải ` +
      `đo trực tiếp; số decoded thật nếu có sẽ thắng suy này)`,
  };
}

/**
 * BẪY RANGE CŨ (bài học headed B1, xem LIMITS §3): khi W2 fail,
 * production KHÔNG gán lastDecodeRange mới nên snapshot sau W2 vẫn
 * mang range của cửa sổ TRƯỚC (vd cửa sổ prefetch 412 s). Dùng range
 * đó làm cửa sổ W2 sẽ chẩn đoán nhầm fast-path (key trùng + cache>0)
 * dù W2 trả false — fast-path luôn trả true nên không thể là chẩn
 * đoán cho W2 fail. Vì vậy: W2 fail thì KHÔNG BAO GIỜ phân loại bằng
 * range sau W2; dùng classifyFailedW2 dưới đây (fail theo luật
 * production, cửa sổ mirror chỉ để tham chiếu, ghi rõ không phải
 * range quan sát). classifyWithRealRange chỉ được gọi khi ok=true +
 * range ĐỔI (range mới thật sự là của W2).
 */

/**
 * Phân loại W2 fail: decoded suy ra 0 theo luật production, KHÔNG
 * dùng range sau W2 (range cũ). Trả kèm cửa sổ mirror để tham chiếu
 * (ghi rõ mirror, không phải quan sát).
 */
export function classifyFailedW2(): {
  diagnostic: W2Diagnostic;
  expectedOk: boolean;
  consistent: boolean;
  detail: string;
} {
  return {
    diagnostic: "fail",
    expectedOk: false,
    consistent: true,
    detail:
      "fail: ok=false nên production đã khóa unsupported (decoded <= 0 " +
      "hoặc pre-resolve/load hỏng trước khi decode); lastDecodeRange " +
      "sau W2 là range CŨ của cửa sổ trước, cấm dùng làm cửa sổ W2 " +
      "(bẫy range cũ của B1: range cũ trùng key trước W2 sẽ chẩn " +
      "đoán nhầm fast-path dù fast-path luôn trả true)",
  };
}

/**
 * Phân loại W2 bằng cửa sổ decode THẬT (from/to từ controller) thay
 * vì cửa sổ mirror. presentFrom/presentTo lấy từ mirror A1 cho mốc
 * 32,4667 s (900/974); targetPos = 974. decoded null → unknown (trừ
 * fast-path, được phát hiện qua lastWindowKey + cache trước).
 * CHỈ gọi khi ok=true + range đổi; W2 fail dùng classifyFailedW2.
 */
export function classifyWithRealRange(
  from: number,
  to: number,
  decoded: number | null,
  ok: boolean | null,
  cacheSizeBefore: number,
  lastWindowKeyBefore: string | null,
): {
  diagnostic: W2Diagnostic;
  expectedOk: boolean | null;
  consistent: boolean | null;
  detail: string;
  window: W2DecodeWindow;
} {
  const window: W2DecodeWindow = {
    targetPos: 974,
    presentFrom: 900,
    presentTo: 974,
    decodeFrom: from,
    decodeTo: to,
    key: `${from}-${to}`,
    windowFrames: to - from + 1,
    presentFrames: 75,
    gopAligned: true,
  };
  const r = classifyW2({
    window,
    decoded,
    ok,
    cacheSizeBefore,
    lastWindowKey: lastWindowKeyBefore,
    corrupt: { startFrame: 900, endFrameExclusive: 990 },
  });
  return { ...r, window };
}
