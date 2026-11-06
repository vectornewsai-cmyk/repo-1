// settle45A1.ts — Phase 9 đợt 45, luồng A1: settle-drop sâu.
//
// Nợ mở từ docs/PHASE9_ROUND44_Z1_SETTLE_LIMITS.md §6.1 (đợt 44 Z1):
// nhánh thử lại trên đường asset: vẫn chưa bắt được SUCCESS. Z1 vào
// được nhánh hoãn (deferredHere=true, 2/2 attempt ultra-tight) nhưng
// W2 trả ok=true rồi tự evict trước khi lần thử lại chạy, counter
// cuối giữ 0 → INVALID-final-mismatch. Giả thuyết mạnh nhất của Z1
// (CHƯA KIỂM CHỨNG) là cửa sổ present của W2 không nằm trọn trong
// GOP hỏng mà vắt qua GOP lành trước đó, nên decode được một phần
// rồi trả true theo luật "decode một phần thì giữ" của production
// (reverseWebcodecs.ts: decoded > 0 → đi tiếp tới evict + return
// true; decoded <= 0 mới return false).
//
// Module này KHÔNG sửa production code, KHÔNG nối vào settle hiện
// tại, KHÔNG đổi luật dọn. Nó chỉ là MIRROR thuần để lần đo headed
// tiếp theo phân biệt được 3 thứ mà trace Z1 không phân biệt nổi
// (trace Z1 chỉ có ok/failed, không có decodeFrom/decodeTo/key/
// decoded của W2):
//   (a) fast-path: W2 trả true mà KHÔNG decode (cùng window key với
//       cửa sổ trước + cache còn frame — reverseWebcodecs.ts: key
//       === lastWindowKey && cache.size > 0 → return true ngay);
//   (b) partial-GOP: W2 decode thật, 0 < decoded < window, và cửa sổ
//       decode vắt qua biên GOP hỏng sang GOP lành (decodeFrom <
//       corruptStart <= decodeTo) — đây mới là giả thuyết Z1;
//   (c) fail: decoded <= 0 → ok=false (đường suy biến ok=false của
//       Y1/Z1-hidden).
// Ngoài ra còn 2 chẩn đoán phụ mà mirror bắt buộc phải tách ra, nếu
// không sẽ đọc nhầm thành (b): partial-inside-corrupt (cửa sổ nằm
// trọn trong GOP hỏng mà decoded vẫn > 0 — decoder vẫn nhả frame
// dù IDR hỏng, tức giả thuyết tràn GOP lành là SAI) và full
// (decoded == window, không liên quan GOP hỏng).
//
// Quy ước không gian: mọi frame đều là VỊ TRÍ THEO THỨ TỰ PRESENT
// (present-order position), không phải decode-index thô. Production
// tính presentFrom theo vị trí present rồi mới GOP-align đầu decode
// về keyframe; với file GOP-align (mỗi GOP chiếm một đoạn present
// liên tục — đúng với fixture GOP 90 của Y1/Z1) thì keyframe của
// GOP trong không gian present chính là đầu GOP đó, nên mirror
// dùng keyframes = đầu các GOP hoặc gopFrames đều cho cùng đáp án.
// Với file có B-frame reorder xuyên GOP (open-GOP), mirror này chỉ
// là xấp xỉ và harness headed phải đọc decodeFrom/decodeTo thật từ
// controller (lastDecodeRange) thay vì tin mirror — ghi rõ để không
// ai dùng mirror thay số đo thật.

/** Một GOP hỏng, theo vị trí present (end exclusive). */
export interface CorruptGopRange {
  /** Vị trí present đầu GOP hỏng (frame keyframe đầu GOP). */
  startFrame: number;
  /** Vị trí present sau frame cuối GOP hỏng (exclusive). */
  endFrameExclusive: number;
}

/** Cửa sổ decode của W2, mirror theo đúng công thức production. */
export interface W2DecodeWindow {
  /** Vị trí present của mốc thời gian W2 hỏi. */
  targetPos: number;
  /** Đầu cửa sổ present (targetPos − effectiveWindow + 1, chặn 0). */
  presentFrom: number;
  /** Cuối cửa sổ present (= targetPos). */
  presentTo: number;
  /** Đầu decode sau GOP-align (keyframe <= presentFrom). */
  decodeFrom: number;
  /** Cuối decode (= targetPos). */
  decodeTo: number;
  /** Khóa cửa sổ production dùng cho fast-path: "from-to". */
  key: string;
  /** Số frame cửa sổ decode (decodeTo − decodeFrom + 1). */
  windowFrames: number;
  /** Số frame cửa sổ present (presentTo − presentFrom + 1). */
  presentFrames: number;
  /** Có thông tin GOP-align không (false khi không có keyframes). */
  gopAligned: boolean;
}

export interface MirrorDecodeWindowInput {
  targetTimeSec: number;
  /** Frame/giây của track (fixture Y1/Z1: 30). */
  fps: number;
  /** Cửa sổ hiệu dụng (min(windowFrames, budget) của production). */
  effectiveWindow: number;
  /** Tổng số frame track (để chặn targetPos; không có thì không chặn). */
  totalFrames?: number;
  /** Vị trí present của các keyframe, đã sort tăng dần. */
  keyframes?: number[];
  /** Số frame/GOP khi không có danh sách keyframe (GOP đều). */
  gopFrames?: number;
}

/** Vị trí present của mốc thời gian (floor, chặn >= 0, chặn cuối). */
export function frameForTime(
  timeSec: number,
  fps: number,
  totalFrames?: number,
): number {
  if (!(fps > 0)) return 0;
  let pos = Math.floor(timeSec * fps);
  if (pos < 0) pos = 0;
  if (totalFrames !== undefined && pos > totalFrames - 1) {
    pos = Math.max(0, totalFrames - 1);
  }
  return pos;
}

/**
 * Mirror cửa sổ decode của W2 cho một mốc thời gian.
 * Công thức production (đường full-file, reverseWebcodecs.ts):
 * presentFrom = max(0, targetPos − effectiveWindow + 1);
 * windowDecodeIdx = order[presentFrom..targetPos] sort theo decode;
 * decodeFrom = keyframe <= min(windowDecodeIdx) (GOP-align);
 * decodeTo = targetPos; key = "decodeFrom-decodeTo".
 * Mirror xấp xỉ min(windowDecodeIdx) bằng presentFrom (đúng khi GOP
 * chiếm đoạn present liên tục — xem ghi chú đầu file).
 */
export function mirrorDecodeWindow(
  input: MirrorDecodeWindowInput,
): W2DecodeWindow {
  const eff = Math.max(1, Math.floor(input.effectiveWindow));
  const targetPos = frameForTime(
    input.targetTimeSec,
    input.fps,
    input.totalFrames,
  );
  const presentFrom = Math.max(0, targetPos - eff + 1);
  let decodeFrom = presentFrom;
  let gopAligned = false;
  if (input.keyframes && input.keyframes.length > 0) {
    let best = 0;
    for (const k of input.keyframes) {
      if (k <= presentFrom && k >= best) best = k;
      if (k > presentFrom) break;
    }
    decodeFrom = best;
    gopAligned = true;
  } else if (input.gopFrames !== undefined && input.gopFrames > 0) {
    decodeFrom = Math.floor(presentFrom / input.gopFrames) * input.gopFrames;
    gopAligned = true;
  }
  const decodeTo = targetPos;
  return {
    targetPos,
    presentFrom,
    presentTo: targetPos,
    decodeFrom,
    decodeTo,
    key: `${decodeFrom}-${decodeTo}`,
    windowFrames: decodeTo - decodeFrom + 1,
    presentFrames: targetPos - presentFrom + 1,
    gopAligned,
  };
}

/** Quan hệ giữa một cửa sổ decode và một GOP hỏng. */
export interface WindowVsCorrupt {
  /** Cửa sổ nằm trọn trong GOP hỏng. */
  insideCorrupt: boolean;
  /** Cửa sổ bắt đầu trước GOP hỏng và kéo qua đầu GOP hỏng. */
  straddlesCorruptStart: boolean;
  /** Cửa sổ chạm đúng đầu GOP hỏng (decodeFrom == start). */
  touchesCorruptStart: boolean;
  /** Cửa sổ chạm đúng cuối GOP hỏng (decodeTo == end − 1). */
  touchesCorruptEnd: boolean;
  /** Số frame decode nằm trước GOP hỏng (GOP lành). */
  healthyPrefixFrames: number;
  /** Số frame decode nằm trong GOP hỏng. */
  corruptFrames: number;
  /** Số frame decode nằm sau GOP hỏng (GOP lành sau). */
  healthySuffixFrames: number;
}

export function analyzeWindowVsCorrupt(
  w: W2DecodeWindow,
  corrupt: CorruptGopRange,
): WindowVsCorrupt {
  const overlapStart = Math.max(w.decodeFrom, corrupt.startFrame);
  const overlapEnd = Math.min(w.decodeTo, corrupt.endFrameExclusive - 1);
  const corruptFrames =
    overlapEnd >= overlapStart ? overlapEnd - overlapStart + 1 : 0;
  const healthyPrefixFrames =
    w.decodeFrom < corrupt.startFrame
      ? Math.min(w.decodeTo, corrupt.startFrame - 1) - w.decodeFrom + 1
      : 0;
  const healthySuffixFrames =
    w.decodeTo >= corrupt.endFrameExclusive
      ? w.decodeTo - Math.max(w.decodeFrom, corrupt.endFrameExclusive) + 1
      : 0;
  return {
    insideCorrupt:
      w.decodeFrom >= corrupt.startFrame &&
      w.decodeTo <= corrupt.endFrameExclusive - 1,
    straddlesCorruptStart:
      w.decodeFrom < corrupt.startFrame &&
      w.decodeTo >= corrupt.startFrame,
    touchesCorruptStart: w.decodeFrom === corrupt.startFrame,
    touchesCorruptEnd: w.decodeTo === corrupt.endFrameExclusive - 1,
    healthyPrefixFrames: Math.max(0, healthyPrefixFrames),
    corruptFrames,
    healthySuffixFrames: Math.max(0, healthySuffixFrames),
  };
}

export type W2Diagnostic =
  | "fast-path"
  | "partial-gop"
  | "partial-inside-corrupt"
  | "partial-other"
  | "fail"
  | "full"
  | "unknown";

export interface W2Observation {
  /** Cửa sổ decode mirror (hoặc lastDecodeRange thật từ controller). */
  window: W2DecodeWindow;
  /**
   * Số frame decodeGop trả về. null = harness chưa mirror trường này
   * (đúng trạng thái trace Z1: chỉ có ok/failed, không có decoded).
   */
  decoded: number | null;
  /** Kết quả ok quan sát được của W2 (null = chưa quan sát). */
  ok: boolean | null;
  /** Số frame cache TRƯỚC khi W2 chạy (cho fast-path). */
  cacheSizeBefore: number;
  /** Khóa cửa sổ decode trước W2 (cho fast-path). */
  lastWindowKey: string | null;
  /** GOP hỏng cần đối chiếu (không có thì partial không gắn GOP). */
  corrupt?: CorruptGopRange;
}

/**
 * Phân loại diagnostic của W2 theo luật production:
 * fast-path (không decode) > fail (decoded <= 0) > full
 * (decoded == window) > partial (0 < decoded < window, gắn GOP theo
 * vị trí cửa sổ). expectedOk là ok mà luật production DỰ ĐOÁN
 * (true cho mọi nhánh trừ fail); observedOk khác expectedOk thì
 * consistent=false — đó là tín hiệu harness đọc sai trường, không
 * phải production đổi luật.
 */
export function classifyW2(obs: W2Observation): {
  diagnostic: W2Diagnostic;
  /** ok mà luật production dự đoán (null khi decoded chưa biết). */
  expectedOk: boolean | null;
  /** observedOk có khớp luật không (null khi chưa đủ dữ kiện). */
  consistent: boolean | null;
  detail: string;
} {
  const w = obs.window;
  if (
    obs.lastWindowKey !== null &&
    obs.lastWindowKey === w.key &&
    obs.cacheSizeBefore > 0
  ) {
    return {
      diagnostic: "fast-path",
      expectedOk: true,
      consistent: obs.ok === null ? null : obs.ok === true,
      detail:
        `fast-path: key ${w.key} == lastWindowKey, cache trước W2 = ` +
        `${obs.cacheSizeBefore} > 0 nên production return true mà ` +
        `không decode (decoded ${obs.decoded === null ? "không cần" : "bị bỏ qua, phải là null ở lần đo thật"})`,
    };
  }
  if (obs.decoded === null) {
    return {
      diagnostic: "unknown",
      expectedOk: null,
      consistent: null,
      detail:
        `unknown: chưa mirror decoded của W2 (đúng trạng thái trace ` +
        `Z1: chỉ có ok=${obs.ok}, không phân biệt được fast-path / ` +
        `partial-GOP / fail) — không được kết luận từ ok một mình`,
    };
  }
  if (obs.decoded <= 0) {
    return {
      diagnostic: "fail",
      expectedOk: false,
      consistent: obs.ok === null ? null : obs.ok === false,
      detail:
        `fail: decoded=${obs.decoded} <= 0 nên production khóa ` +
        `unsupported + return false (đường suy biến ok=false của Y1)`,
    };
  }
  if (obs.decoded >= w.windowFrames) {
    return {
      diagnostic: "full",
      expectedOk: true,
      consistent: obs.ok === null ? null : obs.ok === true,
      detail:
        `full: decoded=${obs.decoded} >= window=${w.windowFrames}, ` +
        `W2 decode trọn cửa sổ, không liên quan GOP hỏng`,
    };
  }
  // 0 < decoded < window: decode một phần → production return true.
  if (obs.corrupt) {
    const rel = analyzeWindowVsCorrupt(w, obs.corrupt);
    if (rel.straddlesCorruptStart) {
      return {
        diagnostic: "partial-gop",
        expectedOk: true,
        consistent: obs.ok === null ? null : obs.ok === true,
        detail:
          `partial-gop: decoded=${obs.decoded}/${w.windowFrames}, cửa sổ ` +
          `[${w.decodeFrom},${w.decodeTo}] vắt qua đầu GOP hỏng ` +
          `[${obs.corrupt.startFrame},${obs.corrupt.endFrameExclusive}): ` +
          `${rel.healthyPrefixFrames} frame GOP lành + ${rel.corruptFrames} ` +
          `frame hỏng — đúng giả thuyết Z1 (decode một phần qua GOP lành → true)`,
      };
    }
    if (rel.insideCorrupt) {
      return {
        diagnostic: "partial-inside-corrupt",
        expectedOk: true,
        consistent: obs.ok === null ? null : obs.ok === true,
        detail:
          `partial-inside-corrupt: decoded=${obs.decoded}/${w.windowFrames}, ` +
          `cửa sổ [${w.decodeFrom},${w.decodeTo}] nằm TRỌN trong GOP hỏng ` +
          `[${obs.corrupt.startFrame},${obs.corrupt.endFrameExclusive}) mà ` +
          `vẫn decode được — giả thuyết tràn GOP lành là SAI cho lần này, ` +
          `decoder vẫn nhả frame dù IDR hỏng (cần giải thích khác)`,
      };
    }
    return {
      diagnostic: "partial-other",
      expectedOk: true,
      consistent: obs.ok === null ? null : obs.ok === true,
      detail:
        `partial-other: decoded=${obs.decoded}/${w.windowFrames}, cửa sổ ` +
        `[${w.decodeFrom},${w.decodeTo}] không chạm GOP hỏng ` +
        `[${obs.corrupt.startFrame},${obs.corrupt.endFrameExclusive}) — ` +
        `decode một phần do nguyên nhân khác, không phải GOP hỏng này`,
    };
  }
  return {
    diagnostic: "partial-other",
    expectedOk: true,
    consistent: obs.ok === null ? null : obs.ok === true,
    detail:
      `partial-other: decoded=${obs.decoded}/${w.windowFrames} mà không ` +
      `có GOP hỏng đối chiếu nên chưa gắn được partial-GOP`,
  };
}

export interface ChooseCorruptWindowInput {
  /** Danh sách GOP hỏng (thử theo thứ tự; GOP lành xen kẽ bị bỏ qua). */
  corruptGops: CorruptGopRange[];
  /** Cửa sổ hiệu dụng W2 sẽ dùng. */
  effectiveWindow: number;
  fps: number;
  /** Khóa cửa sổ trước W2 (để tránh fast-path: key trùng bị bỏ qua). */
  lastWindowKey?: string | null;
  totalFrames?: number;
}

export interface ChosenCorruptWindow {
  feasible: boolean;
  /** Chỉ số GOP hỏng được chọn (khi feasible). */
  gopIndex: number | null;
  /** Mốc thời gian W2 nên hỏi (giây). */
  targetTimeSec: number | null;
  targetPos: number | null;
  presentFrom: number | null;
  decodeFrom: number | null;
  decodeTo: number | null;
  key: string | null;
  /** Lý do khi không feasible, hoặc mô tả khi feasible. */
  reason: string;
  /**
   * Cửa sổ hiệu dụng lớn nhất mà GOP hỏng dài nhất còn chứa được
   * (độ dài GOP hỏng dài nhất); W2 muốn nằm trọn GOP hỏng thì
   * effectiveWindow phải <= giá trị này.
   */
  requiredMaxWindow: number;
}

/**
 * Chọn cửa sổ W2 nằm TRỌN trong một GOP hỏng.
 *
 * Điều kiện đủ (chứng minh từ công thức mirror): cửa sổ present nằm
 * trọn trong GOP hỏng thì decodeFrom sau GOP-align rơi đúng đầu GOP
 * hỏng (keyframe đầu GOP), nên cả cửa sổ decode cũng nằm trọn trong
 * GOP hỏng. Với cửa sổ hiệu dụng W và GOP [S,E):
 *   presentFrom = targetPos − W + 1 >= S  và  targetPos <= E − 1
 *   ⇔ targetPos ∈ [S + W − 1, E − 1], khả thi ⇔ W <= E − S.
 * Hàm chọn targetPos nhỏ nhất khả thi (presentFrom == S, chạm đầu
 * GOP), rồi dịch +1 nếu key trùng lastWindowKey (tránh fast-path)
 * miễn còn trong GOP. Khi W > mọi GOP hỏng: không feasible, và
 * requiredMaxWindow cho biết phải thu cửa sổ xuống bao nhiêu.
 */
export function chooseCorruptWindow(
  input: ChooseCorruptWindowInput,
): ChosenCorruptWindow {
  const eff = Math.floor(input.effectiveWindow);
  let requiredMaxWindow = 0;
  for (const g of input.corruptGops) {
    const len = g.endFrameExclusive - g.startFrame;
    if (len > requiredMaxWindow) requiredMaxWindow = len;
  }
  if (!(eff > 0)) {
    return {
      feasible: false,
      gopIndex: null,
      targetTimeSec: null,
      targetPos: null,
      presentFrom: null,
      decodeFrom: null,
      decodeTo: null,
      key: null,
      reason: `invalid-window: effectiveWindow=${input.effectiveWindow} <= 0`,
      requiredMaxWindow,
    };
  }
  if (input.corruptGops.length === 0) {
    return {
      feasible: false,
      gopIndex: null,
      targetTimeSec: null,
      targetPos: null,
      presentFrom: null,
      decodeFrom: null,
      decodeTo: null,
      key: null,
      reason: "no-corrupt-gop: không có GOP hỏng nào để chọn",
      requiredMaxWindow,
    };
  }
  const lastKey = input.lastWindowKey ?? null;
  for (let gi = 0; gi < input.corruptGops.length; gi++) {
    const g = input.corruptGops[gi];
    const len = g.endFrameExclusive - g.startFrame;
    if (eff > len) continue;
    let targetPos = g.startFrame + eff - 1;
    const lastPos = g.endFrameExclusive - 1;
    while (targetPos <= lastPos) {
      if (input.totalFrames !== undefined && targetPos > input.totalFrames - 1) {
        break;
      }
      const presentFrom = targetPos - eff + 1;
      const key = `${g.startFrame}-${targetPos}`;
      if (key !== lastKey) {
        return {
          feasible: true,
          gopIndex: gi,
          targetTimeSec: targetPos / input.fps,
          targetPos,
          presentFrom,
          decodeFrom: g.startFrame,
          decodeTo: targetPos,
          key,
          reason:
            `GOP hỏng #${gi} [${g.startFrame},${g.endFrameExclusive}): ` +
            `targetPos=${targetPos} (t=${(targetPos / input.fps).toFixed(4)} s), ` +
            `present [${presentFrom},${targetPos}], decode [${g.startFrame},${targetPos}] nằm trọn GOP hỏng`,
          requiredMaxWindow,
        };
      }
      targetPos++;
    }
  }
  return {
    feasible: false,
    gopIndex: null,
    targetTimeSec: null,
    targetPos: null,
    presentFrom: null,
    decodeFrom: null,
    decodeTo: null,
    key: null,
    reason:
      `no-feasible-window: effectiveWindow=${eff} lớn hơn mọi GOP hỏng ` +
      `(dài nhất ${requiredMaxWindow} frame) hoặc mọi key khả thi đều ` +
      `trùng lastWindowKey — muốn nằm trọn GOP hỏng thì thu cửa sổ ` +
      `xuống <= ${requiredMaxWindow} frame`,
    requiredMaxWindow,
  };
}
