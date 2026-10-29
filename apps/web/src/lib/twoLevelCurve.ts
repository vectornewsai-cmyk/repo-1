// twoLevelCurve.ts — Hợp curve hai tầng phía WEB (Phase 9 đợt 20 R1).
// Module thuần MỚI, KHÔNG sửa nestedPreview.ts (parent sẽ nối sau).
//
// Ngữ nghĩa MIRROR CHÍNH XÁC render worker (server/render/src/nested.js,
// khối đợt 20 R1 + docs/PHASE9_ROUND20_R1_TWO_LEVEL_LIMITS.md), không tự
// định nghĩa lại: lá video/audio mang speedKeyframes riêng s_i(x) nằm
// dưới nested có curve s_o(T) thì thời gian nguồn tại thời gian output
// ngoài t' là HỢP của hai ánh xạ:
//   x(t') = leftCut + ∫_{T_start}^{T_start+t'} s_o
//   src(t') = lá.in + ∫₀^{x(t')} s_i
//   c(t') = s_o(T_start+t') · s_i(x(t'))  (quy tắc dây chuyền)
// Mọi tích phân/đánh giá đều dùng đúng engine @repo-1/video-spec
// (integrateSpeed/speedAt/sliceSpeedKeyframes — cùng engine render dùng
// ở speedramp.js, không viết lại công thức tích phân).
//
// Mã hoá c(t') thành speedKeyframes cho clip phẳng: c nói chung KHÔNG
// thuộc họ speedKeyframes nên mã hoá là XẤP XỈ Hermite-bezier có kiểm
// soát (x1=1/3, x2=2/3 → X(t)=t, Y(t) là đa thức Hermite bậc 3 khớp giá
// trị + đạo hàm hai đầu); linear×linear tái tạo ĐÚNG HỆT, easing khác
// sai số O(h⁴) với h ≤ 0.25s. Hai trường hợp hằng thì ĐÚNG HỆT bằng
// slice (không qua Hermite): trong hằng → slice ngoài × v_i; ngoài hằng
// → slice trong rồi chia thời gian cho v_o, nhân v với v_o.
// Phạm vi như render: chỉ lá video/audio, không reverse, không attachment
// thời gian khác — module này không tự fail cho attachment (caller kiểm
// tra trước khi gọi, như render fail ở mapClip); reverse cũng do caller
// chặn. Hàm này chỉ tính toán hợp, không quyết định chính sách fail.

import {
  integrateSpeed,
  normalizeSpeedKeyframes,
  sliceSpeedKeyframes,
  speedAt,
  type SpeedCurve,
  type SpeedKeyframe,
} from "@repo-1/video-spec";

export const TWO_LEVEL_SPEED_MIN = 0.25;
export const TWO_LEVEL_SPEED_MAX = 4;

export interface TwoLevelInput {
  /** Curve của nested ngoài (thời gian output tính từ đầu nested). */
  outerCurve: SpeedCurve;
  /** Duration của nested ngoài = thời gian OUTPUT. */
  outerDuration: number;
  /** Điểm bắt đầu cửa sổ trong timeline con (trim.in, mặc định 0). */
  outerIn: number;
  /** Curve riêng của lá (thời gian tính từ đầu lá). */
  innerCurve: SpeedCurve;
  /** Vị trí lá trong timeline con. */
  leafStart: number;
  /** Duration của lá trong timeline con (= thời gian output của lá). */
  leafDuration: number;
  /** Điểm nguồn bắt đầu của lá. */
  leafIn: number;
  /** Điểm nguồn kết thúc của lá (nếu có, dùng để cap out'). */
  leafOut?: number;
}

export interface TwoLevelResult {
  /** Offset output (tương đối so với start của nested) của đầu lá. */
  startOffset: number;
  /** Duration của lá sau hợp, trên timeline ngoài. */
  duration: number;
  /** Điểm nguồn bắt đầu sau hợp. */
  in: number;
  /** Điểm nguồn kết thúc sau hợp (đã cap ở leafOut nếu có). */
  out: number;
  /** Curve hợp đã mã hoá cho clip phẳng (Hermite, hoặc slice đúng hệt
   * khi một tầng hằng). */
  speedKeyframes: SpeedCurve;
  /** Tốc độ hợp ĐÚNG (tích phân) tại t' ∈ [0, duration]. */
  speedAt: (tPrime: number) => number;
  /** Thời gian nguồn ĐÚNG (tích phân) tại t' ∈ [0, duration]. */
  sourceAt: (tPrime: number) => number;
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function validateCurve(
  curve: SpeedCurve,
  duration: number,
  label: string,
): SpeedCurve {
  if (typeof curve !== "object" || curve === null || !Array.isArray(curve.keyframes)) {
    throw new Error(`${label}: speedKeyframes phải là object { keyframes: [...] }`);
  }
  const arr = curve.keyframes;
  if (arr.length === 0) {
    throw new Error(`${label}: speedKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe`);
  }
  if (arr.length > 128) {
    throw new Error(`${label}: speedKeyframes.keyframes: quá 128 keyframe`);
  }
  arr.forEach((kf, i) => {
    const w = `${label}.keyframes[${i}]`;
    if (typeof kf !== "object" || kf === null) {
      throw new Error(`${w} phải là object { t, v, easing }`);
    }
    if (!isFiniteNumber(kf.t) || kf.t < 0 || kf.t > duration + 1e-6) {
      throw new Error(`${w}.t phải trong [0, ${duration}] (nhận được: ${kf.t})`);
    }
    if (!isFiniteNumber(kf.v) || kf.v < TWO_LEVEL_SPEED_MIN || kf.v > TWO_LEVEL_SPEED_MAX) {
      throw new Error(
        `${w}.v phải trong ${TWO_LEVEL_SPEED_MIN}..${TWO_LEVEL_SPEED_MAX} (nhận được: ${kf.v})`,
      );
    }
    if (!["linear", "ease-in", "ease-out", "bezier"].includes(kf.easing)) {
      throw new Error(
        `${w}.easing phải là linear | ease-in | ease-out | bezier (nhận được: ${JSON.stringify(kf.easing)})`,
      );
    }
    if (kf.easing === "bezier") {
      const b = kf.bezier;
      if (!Array.isArray(b) || b.length !== 4 || !b.every((x) => isFiniteNumber(x)) ||
          b[0] < 0 || b[0] > 1 || b[2] < 0 || b[2] > 1) {
        throw new Error(
          `${w}.bezier phải là [x1, y1, x2, y2]: x1, x2 trong [0, 1], y1, y2 tự do ` +
          `(nhận được: ${JSON.stringify(b)})`,
        );
      }
    }
  });
  return { keyframes: normalizeSpeedKeyframes(arr) };
}

/** Curve hằng không (mọi keyframe cùng v, sai số 1e-12)? */
export function isConstantSpeedCurve(curve: SpeedCurve): boolean {
  const ks = normalizeSpeedKeyframes(curve.keyframes);
  if (ks.length === 0) return false;
  return ks.every((k) => Math.abs(k.v - ks[0].v) <= 1e-12);
}

/**
 * τ(w): thời gian output (tương đối so với đầu nested) ứng với vị trí
 * con cách đầu cửa sổ w giây. Ngoài [0, ∫curve] thì ngoại suy tuyến
 * tính theo tốc độ biên — chỉ dùng cho phát hiện cắt, không dùng cho
 * đoạn khả kiến (đoạn đó đã giao cửa sổ nên w luôn trong khoảng).
 * Mirror _mapChildOffset của render worker.
 */
export function twoLevelTauOffset(
  outerCurve: SpeedCurve,
  outerDuration: number,
  childOffset: number,
): number {
  const total = integrateSpeed(outerCurve, 0, outerDuration);
  if (childOffset <= 0) return childOffset / speedAt(outerCurve, 0);
  if (childOffset >= total) {
    return outerDuration + (childOffset - total) / speedAt(outerCurve, outerDuration);
  }
  let lo = 0;
  let hi = outerDuration;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (integrateSpeed(outerCurve, 0, mid) < childOffset) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Giải X(s) = p cho cubic-bezier (x1, x2) — port solveBezierXNested. */
function solveBezierX(x1: number, x2: number, target: number): number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const sampleX = (s: number): number => ((ax * s + bx) * s + cx) * s;
  const sampleDX = (s: number): number => (3 * ax * s + 2 * bx) * s + cx;
  const c = Math.min(1, Math.max(0, target));
  if (c === 0) return 0;
  if (c === 1) return 1;
  let s = c;
  for (let i = 0; i < 8; i++) {
    const err = sampleX(s) - c;
    if (Math.abs(err) < 1e-9) return s;
    const d = sampleDX(s);
    if (Math.abs(d) < 1e-9) break;
    s -= err / d;
  }
  let lo = 0;
  let hi = 1;
  s = c;
  while (hi - lo > 1e-9) {
    if (sampleX(s) < c) lo = s;
    else hi = s;
    s = (lo + hi) / 2;
  }
  return s;
}

function easingDerivative(
  easing: SpeedKeyframe["easing"],
  p: number,
  bezier: SpeedKeyframe["bezier"],
): number {
  if (easing === "linear") return 1;
  if (easing === "ease-in") return 2 * p;
  if (easing === "ease-out") return 2 * (1 - p);
  if (easing === "bezier") {
    const b = bezier ?? [0.25, 0.1, 0.25, 1];
    const s = solveBezierX(b[0], b[2], p);
    const dx =
      3 * (1 - s) * (1 - s) * b[0] + 6 * (1 - s) * s * (b[2] - b[0]) + 3 * s * s * (1 - b[2]);
    const dy =
      3 * (1 - s) * (1 - s) * b[1] + 6 * (1 - s) * s * (b[3] - b[1]) + 3 * s * s * (1 - b[3]);
    if (Math.abs(dx) < 1e-12) return 0;
    return dy / dx;
  }
  return 1;
}

/** Đạo hàm của speedAt; tại điểm gãy, `side` chọn phía trái/phải. */
function speedDerivative(curve: SpeedCurve, t: number, side: "left" | "right"): number {
  const ks = normalizeSpeedKeyframes(curve.keyframes);
  if (ks.length <= 1) return 0;
  const first = ks[0];
  const last = ks[ks.length - 1];
  if (t < first.t) return 0;
  if (t > last.t) return 0;
  if (t === first.t && side === "left") return 0;
  if (t === last.t && side === "right") return 0;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (t < a.t || t > b.t) continue;
    if (t === b.t && i < ks.length - 2 && side === "right") continue;
    const span = b.t - a.t;
    if (span <= 0) return 0;
    const p = (t - a.t) / span;
    return ((b.v - a.v) / span) * easingDerivative(a.easing, p, a.bezier);
  }
  return 0;
}

interface ExactTwoLevel {
  tStart: number;
  tEnd: number;
  duration: number;
  leftCut: number;
  in: number;
  consumed: number;
  breakpoints: number[];
  speedAt: (tPrime: number) => number;
  sourceAt: (tPrime: number) => number;
  derivativeAt: (tPrime: number, side: "left" | "right") => number;
}

function buildExact(
  outer: SpeedCurve,
  outerDuration: number,
  outerIn: number,
  inner: SpeedCurve,
  leaf: { start: number; in: number },
  vs: number,
  ve: number,
): ExactTwoLevel {
  const tStart = twoLevelTauOffset(outer, outerDuration, vs - outerIn);
  const tEnd = twoLevelTauOffset(outer, outerDuration, ve - outerIn);
  const duration = tEnd - tStart;
  const leftCut = vs - leaf.start;
  const visibleChild = ve - vs;
  const inPrime = leaf.in + integrateSpeed(inner, 0, leftCut);
  const consumed = integrateSpeed(inner, leftCut, leftCut + visibleChild);
  const childElapsed = (tp: number): number => {
    if (tp <= 0) return 0;
    return integrateSpeed(outer, tStart, tStart + tp);
  };
  const innerArg = (tp: number): number => leftCut + childElapsed(tp);
  const speedAtFn = (tp: number): number => {
    const T = tStart + tp;
    return speedAt(outer, T) * speedAt(inner, innerArg(tp));
  };
  const sourceAtFn = (tp: number): number =>
    leaf.in + integrateSpeed(inner, 0, innerArg(tp));
  const derivativeAtFn = (tp: number, side: "left" | "right"): number => {
    const T = tStart + tp;
    const x = innerArg(tp);
    const so = speedAt(outer, T);
    const si = speedAt(inner, x);
    return speedDerivative(outer, T, side) * si + so * so * speedDerivative(inner, x, side);
  };
  const pts = [0, duration];
  for (const k of normalizeSpeedKeyframes(outer.keyframes)) {
    if (k.t > tStart && k.t < tEnd) pts.push(k.t - tStart);
  }
  for (const k of normalizeSpeedKeyframes(inner.keyframes)) {
    if (k.t > leftCut && k.t < leftCut + visibleChild) {
      const target = (vs - outerIn) + (k.t - leftCut);
      const T = twoLevelTauOffset(outer, outerDuration, target);
      if (T > tStart && T < tEnd) pts.push(T - tStart);
    }
  }
  pts.sort((a, b) => a - b);
  const breakpoints: number[] = [];
  for (const p of pts) {
    if (breakpoints.length === 0 || Math.abs(p - breakpoints[breakpoints.length - 1]) > 1e-9) {
      breakpoints.push(p);
    }
  }
  return {
    tStart, tEnd, duration, leftCut, in: inPrime, consumed, breakpoints,
    speedAt: speedAtFn, sourceAt: sourceAtFn, derivativeAt: derivativeAtFn,
  };
}

function encodeHermite(exact: ExactTwoLevel, where: string): SpeedCurve {
  const duration = exact.duration;
  if (!(duration > 0)) {
    throw new Error(`${where}: hợp curve hai tầng: duration của lá sau ánh xạ phải > 0`);
  }
  if (exact.breakpoints.length > 128) {
    throw new Error(
      `${where}: hợp curve hai tầng cần ${exact.breakpoints.length} điểm gãy, ` +
      "vượt giới hạn 128 keyframe của clip ramp — giảm số keyframe của curve ngoài/trong",
    );
  }
  let step = 0.25;
  let points: number[] = [];
  for (let iter = 0; iter < 6; iter++) {
    const pts: number[] = [];
    const bp = exact.breakpoints;
    for (let i = 0; i < bp.length - 1; i++) {
      const a = bp[i];
      const b = bp[i + 1];
      const n = Math.max(1, Math.ceil((b - a) / step - 1e-12));
      for (let j = 0; j < n; j++) pts.push(a + (j * (b - a)) / n);
    }
    pts.push(duration);
    const dedup: number[] = [];
    for (const p of pts) {
      if (dedup.length === 0 || Math.abs(p - dedup[dedup.length - 1]) > 1e-9) dedup.push(p);
    }
    points = dedup;
    if (points.length <= 128) break;
    step *= 1.5;
  }
  if (points.length > 128) {
    // Giữ điểm gãy + lấy mẫu đều phần còn lại cho vừa 128.
    const bpSet = new Set(exact.breakpoints.map((p) => Math.round(p * 1e9)));
    const extra = points.filter((p) => !bpSet.has(Math.round(p * 1e9)));
    const chosen = new Set<number>(exact.breakpoints);
    const keep = Math.max(0, 128 - exact.breakpoints.length);
    const stride = keep > 0 ? extra.length / keep : Infinity;
    for (let i = 0; i < extra.length && chosen.size < 128; i++) {
      if (i === 0 || Math.floor(i / stride) !== Math.floor((i - 1) / stride)) {
        chosen.add(extra[i]);
      }
    }
    points = [...chosen].sort((a, b) => a - b);
  }
  interface SamplePoint { t: number; v: number; dLeft: number; dRight: number }
  const mkPoint = (t: number): SamplePoint => ({
    t,
    v: exact.speedAt(t),
    dLeft: exact.derivativeAt(t, "left"),
    dRight: exact.derivativeAt(t, "right"),
  });
  const sample: SamplePoint[] = points.map(mkPoint);
  for (let iter = 0; iter < 200; iter++) {
    let splitAt = -1;
    for (let i = 0; i < sample.length - 1; i++) {
      const a = sample[i];
      const b = sample[i + 1];
      if (Math.abs(b.v - a.v) <= 1e-12 &&
          (Math.abs(a.dRight) > 1e-9 || Math.abs(b.dLeft) > 1e-9) &&
          b.t - a.t > 1e-6) {
        splitAt = i;
        break;
      }
    }
    if (splitAt < 0 || sample.length >= 128) break;
    const a = sample[splitAt];
    const b = sample[splitAt + 1];
    sample.splice(splitAt + 1, 0, mkPoint((a.t + b.t) / 2));
  }
  for (const p of sample) {
    if (!isFiniteNumber(p.v) || p.v < TWO_LEVEL_SPEED_MIN - 1e-9 || p.v > TWO_LEVEL_SPEED_MAX + 1e-9) {
      throw new Error(
        `${where}: tốc độ hợp hai tầng = ${p.v} vượt khoảng ` +
        `${TWO_LEVEL_SPEED_MIN}..${TWO_LEVEL_SPEED_MAX} tại t'=${p.t} — tích tốc độ ngoài × ` +
        "tốc độ trong vượt khoảng dù mỗi tầng đều hợp lệ; giảm biên độ một trong hai curve",
      );
    }
    if (p.v < TWO_LEVEL_SPEED_MIN) p.v = TWO_LEVEL_SPEED_MIN;
    if (p.v > TWO_LEVEL_SPEED_MAX) p.v = TWO_LEVEL_SPEED_MAX;
  }
  const keyframes: SpeedKeyframe[] = sample.map((p, i) => {
    const kf: SpeedKeyframe = { t: p.t, v: p.v, easing: "linear" };
    if (i < sample.length - 1) {
      const q = sample[i + 1];
      const span = q.t - p.t;
      const dv = q.v - p.v;
      if (Math.abs(dv) > 1e-12) {
        const y1 = (span * p.dRight) / (3 * dv);
        const y2 = 1 - (span * q.dLeft) / (3 * dv);
        kf.easing = "bezier";
        kf.bezier = [1 / 3, y1, 2 / 3, y2];
      }
    }
    return kf;
  });
  keyframes[0].t = 0;
  keyframes[keyframes.length - 1].t = duration;
  return { keyframes: normalizeSpeedKeyframes(keyframes) };
}

/**
 * Hợp curve hai tầng cho một lá video/audio dưới nested có curve.
 * Trả về mapping trên timeline ngoài (startOffset tương đối so với
 * start của nested) + curve hợp đã mã hoá + hàm hợp ĐÚNG (tích phân).
 * Cửa sổ con = [outerIn, outerIn + ∫outer); đoạn khả kiến của lá là
 * giao của [leafStart, leafStart + leafDuration) với cửa sổ đó; lá nằm
 * ngoài cửa sổ hoàn toàn thì throw (caller nên bỏ lá trước khi gọi,
 * như mapClip trả null — hàm này không lặng lẽ trả duration 0).
 */
export function composeTwoLevelCurve(input: TwoLevelInput): TwoLevelResult {
  const where = "twoLevelCurve";
  if (!isFiniteNumber(input.outerDuration) || input.outerDuration <= 0) {
    throw new Error(`${where}: outerDuration phải > 0 (nhận được: ${input.outerDuration})`);
  }
  if (!isFiniteNumber(input.leafDuration) || input.leafDuration <= 0) {
    throw new Error(`${where}: leafDuration phải > 0 (nhận được: ${input.leafDuration})`);
  }
  const outer = validateCurve(input.outerCurve, input.outerDuration, "outerCurve");
  const inner = validateCurve(input.innerCurve, input.leafDuration, "innerCurve");
  const totalOuter = integrateSpeed(outer, 0, input.outerDuration);
  const winStart = input.outerIn;
  const winEnd = input.outerIn + totalOuter;
  const s = input.leafStart;
  const e = s + input.leafDuration;
  const vs = Math.max(s, winStart);
  const ve = Math.min(e, winEnd);
  if (ve - vs <= 1e-6) {
    throw new Error(`${where}: lá nằm ngoài cửa sổ clip lồng nhau hoàn toàn — không có đoạn khả kiến để hợp`);
  }
  const exact = buildExact(outer, input.outerDuration, input.outerIn, inner,
    { start: input.leafStart, in: input.leafIn }, vs, ve);
  let speedKeyframes: SpeedCurve;
  if (isConstantSpeedCurve(inner)) {
    // Trong hằng v_i: slice ngoài × v_i (đúng hệt, mirror render).
    const vInner = inner.keyframes[0].v;
    const sliced = sliceSpeedKeyframes(outer.keyframes, exact.tStart, exact.tEnd);
    if (sliced.keyframes.length === 0) {
      throw new Error(`${where}: không slice được curve ngoài cho đoạn output của lá — đoạn suy biến`);
    }
    const scaled = sliced.keyframes.map((k) => ({ ...k, v: k.v * vInner }));
    for (const k of scaled) {
      if (!isFiniteNumber(k.v) || k.v < TWO_LEVEL_SPEED_MIN || k.v > TWO_LEVEL_SPEED_MAX) {
        throw new Error(
          `${where}: tốc độ hợp hai tầng = ${k.v} vượt khoảng ` +
          `${TWO_LEVEL_SPEED_MIN}..${TWO_LEVEL_SPEED_MAX} (tốc độ trong hằng ${vInner} × tốc độ ngoài)`,
        );
      }
    }
    speedKeyframes = { keyframes: normalizeSpeedKeyframes(scaled) };
  } else if (isConstantSpeedCurve(outer)) {
    // Ngoài hằng v_o: slice trong rồi đổi biến tuyến tính (đúng hệt).
    const vo = outer.keyframes[0].v;
    const leftCut = exact.leftCut;
    const sliced = sliceSpeedKeyframes(inner.keyframes, leftCut, leftCut + (ve - vs));
    if (sliced.keyframes.length === 0) {
      throw new Error(`${where}: không slice được curve trong cho đoạn khả kiến — đoạn suy biến`);
    }
    const scaled = sliced.keyframes.map((k) => ({ ...k, t: k.t / vo, v: k.v * vo }));
    for (const k of scaled) {
      if (!isFiniteNumber(k.v) || k.v < TWO_LEVEL_SPEED_MIN || k.v > TWO_LEVEL_SPEED_MAX) {
        throw new Error(
          `${where}: tốc độ hợp hai tầng = ${k.v} vượt khoảng ` +
          `${TWO_LEVEL_SPEED_MIN}..${TWO_LEVEL_SPEED_MAX} (tốc độ ngoài hằng ${vo} × tốc độ trong)`,
        );
      }
    }
    scaled[scaled.length - 1].t = exact.duration;
    speedKeyframes = { keyframes: normalizeSpeedKeyframes(scaled) };
  } else {
    speedKeyframes = encodeHermite(exact, where);
  }
  let out = exact.in + exact.consumed;
  if (input.leafOut !== undefined && out > input.leafOut + 1e-6) out = input.leafOut;
  return {
    startOffset: exact.tStart,
    duration: exact.duration,
    in: exact.in,
    out,
    speedKeyframes,
    speedAt: exact.speedAt,
    sourceAt: exact.sourceAt,
  };
}
