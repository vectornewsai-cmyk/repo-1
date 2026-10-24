/**
 * speedcurve.ts — Speed ramp (Phase 7 P3): tốc độ phát biến thiên theo thời gian.
 *
 * NGỮ NGHĨA (quan trọng, mirror chính xác trong server/render/src/speedramp.js):
 *   - Keyframe t = thời gian OUTPUT tính từ đầu clip (giây), v = hệ số tốc độ tại đó.
 *   - Easing của keyframe BẮT ĐẦU đoạn được áp cho toàn đoạn [t_i, t_{i+1}]
 *     (cùng quy ước với keyframes.ts).
 *   - Ngoài khoảng [t_đầu, t_cuối]: clamp về giá trị keyframe biên.
 *   - duration của clip = thời lượng OUTPUT. Nguồn tiêu thụ = ∫ speed(t) dt
 *     trên [0, duration] (tính bằng sourcePosAt). Khi có speedKeyframes,
 *     `speed` hằng số (nếu có) bị bỏ qua và `out` không còn là biên nguồn
 *     (render dùng in + ∫speed; validator cảnh báo nếu out lệch).
 *   - Tốc độ cho phép: 0.25–4 (giống speed hằng số). Reverse + speedKeyframes
 *     KHÔNG hỗ trợ (validator báo lỗi).
 *
 * Bezier: easing "bezier" cần `bezier: [x1, y1, x2, y2]` (cubic-bezier kiểu CSS,
 * P0=(0,0), P3=(1,1)); tất cả phải nằm trong [0, 1]. Giải x→t bằng Newton +
 * bisection fallback, rồi lấy y(t).
 */

/** Easing cho speed keyframe. "bezier" cần kèm `bezier`. */
export type SpeedEasing = "linear" | "ease-in" | "ease-out" | "bezier";

export const SPEED_EASINGS: readonly SpeedEasing[] = [
  "linear",
  "ease-in",
  "ease-out",
  "bezier",
] as const;

export interface SpeedKeyframe {
  /** Thời gian OUTPUT tính từ đầu clip (giây). */
  t: number;
  /** Hệ số tốc độ tại thời điểm t (0.25–4). */
  v: number;
  /** Easing áp cho đoạn [t, t_của_keyframe_kế_tiếp]. */
  easing: SpeedEasing;
  /** Chỉ dùng khi easing = "bezier": [x1, y1, x2, y2], mỗi số trong [0, 1]. */
  bezier?: [number, number, number, number];
}

export interface SpeedCurve {
  keyframes: SpeedKeyframe[];
}

/** Sắp xếp theo t tăng dần; trùng t thì keyframe đứng sau thắng. */
export function normalizeSpeedKeyframes(kfs: SpeedKeyframe[]): SpeedKeyframe[] {
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const out: SpeedKeyframe[] = [];
  for (const k of sorted) {
    const last = out[out.length - 1];
    if (last && last.t === k.t) out[out.length - 1] = k;
    else out.push(k);
  }
  return out;
}

/** Cubic-bezier: y tại x (P0=(0,0), P3=(1,1)). Newton + bisection fallback. */
export function cubicBezierY(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
): number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const c = Math.min(1, Math.max(0, x));
  if (c === 0) return 0;
  if (c === 1) return 1;
  let t = c;
  for (let i = 0; i < 8; i++) {
    const err = sampleX(t) - c;
    if (Math.abs(err) < 1e-6) return sampleY(t);
    const d = sampleDX(t);
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  let lo = 0;
  let hi = 1;
  t = c;
  while (hi - lo > 1e-6) {
    if (sampleX(t) < c) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return sampleY(t);
}

/** Áp easing cho tiến trình p (đã clamp về [0, 1] bên trong). */
export function applySpeedEasing(
  easing: SpeedEasing,
  p: number,
  bezier?: [number, number, number, number],
): number {
  const c = Math.min(1, Math.max(0, p));
  switch (easing) {
    case "linear":
      return c;
    case "ease-in":
      return c * c;
    case "ease-out":
      return 1 - (1 - c) * (1 - c);
    case "bezier": {
      const b = bezier ?? [0.25, 0.1, 0.25, 1];
      return cubicBezierY(b[0], b[1], b[2], b[3], c);
    }
  }
}

/**
 * Tốc độ tại thời điểm output t (giây từ đầu clip).
 * @throws nếu mảng keyframes rỗng.
 */
export function speedAt(curve: SpeedCurve, t: number): number {
  const ks = normalizeSpeedKeyframes(curve.keyframes);
  if (ks.length === 0) throw new Error("speedAt: mảng keyframes rỗng");
  if (ks.length === 1) return ks[0].v;
  if (t <= ks[0].t) return ks[0].v;
  const last = ks[ks.length - 1];
  if (t >= last.t) return last.v;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const p = span <= 0 ? 0 : (t - a.t) / span;
      return a.v + (b.v - a.v) * applySpeedEasing(a.easing, p, a.bezier);
    }
  }
  return last.v;
}

/**
 * Tích phân tốc độ trên đoạn output [a, b] (a <= b), tức độ dài nguồn tiêu thụ.
 * Tích phân chính xác cho linear/ease-in/ease-out (đa thức bậc ≤ 2);
 * bezier dùng Simpson 64 khoảng (sai số < 1e-4 cho span vài giây).
 */
export function integrateSpeed(curve: SpeedCurve, a: number, b: number): number {
  if (b <= a) return 0;
  const ks = normalizeSpeedKeyframes(curve.keyframes);
  if (ks.length === 0) throw new Error("integrateSpeed: mảng keyframes rỗng");
  if (ks.length === 1) return ks[0].v * (b - a);
  // Các điểm gãy trong [a, b]: biên keyframe + a + b.
  const cuts = [a];
  for (const k of ks) if (k.t > a && k.t < b) cuts.push(k.t);
  cuts.push(b);
  let total = 0;
  for (let i = 0; i < cuts.length - 1; i++) {
    const x0 = cuts[i];
    const x1 = cuts[i + 1];
    const span = x1 - x0;
    // Tìm đoạn keyframe chứa [x0, x1] (sau khi cắt, mỗi khoảng nằm gọn trong
    // 1 đoạn keyframe hoặc ngoài khoảng keyframe → tốc độ hằng).
    let seg: { v0: number; v1: number; easing: SpeedEasing; bezier?: [number, number, number, number]; t0: number; segSpan: number } | null = null;
    for (let j = 0; j < ks.length - 1; j++) {
      if (x0 >= ks[j].t - 1e-12 && x1 <= ks[j + 1].t + 1e-12) {
        seg = { v0: ks[j].v, v1: ks[j + 1].v, easing: ks[j].easing, bezier: ks[j].bezier, t0: ks[j].t, segSpan: ks[j + 1].t - ks[j].t };
        break;
      }
    }
    if (!seg) {
      // Ngoài khoảng keyframe: tốc độ hằng = giá trị biên gần nhất.
      total += speedAt(curve, (x0 + x1) / 2) * span;
      continue;
    }
    if (seg.easing === "linear" || seg.easing === "ease-in" || seg.easing === "ease-out") {
      // SỬA Phase 8 Q3 (bug P3/P1 đã ghi nhận): bản cũ dùng trung bình 2 đầu
      // mút segment cho MỌI đoạn con (integrateSpeed(0,2) trên segment
      // linear 1→2 [0,4] trả 3 thay vì 2.5). Tích phân ĐÚNG trên đoạn con
      // [x0,x1] ⊂ segment bằng nguyên hàm theo easing:
      //   linear: p²/2; ease-in: p³/3; ease-out: p + (1-p)³/3.
      // Đoạn đầy đủ cho kết quả Y HỆT bản cũ (1/2, 1/3, 2/3) nên các
      // consumer cũ (sourceConsumed cả clip, validate) không đổi.
      const { v0, v1, easing } = seg;
      const S = seg.segSpan;
      const p0 = S <= 0 ? 0 : (x0 - seg.t0) / S;
      const p1 = S <= 0 ? 0 : (x1 - seg.t0) / S;
      const anti = (p: number) =>
        easing === "linear" ? (p * p) / 2
        : easing === "ease-in" ? (p * p * p) / 3
        : p + Math.pow(1 - p, 3) / 3;
      total += v0 * span + (v1 - v0) * S * (anti(p1) - anti(p0));
    } else {
      // Simpson 64 khoảng cho bezier.
      const n = 64;
      const h = span / n;
      let s = speedAt(curve, x0) + speedAt(curve, x1);
      for (let k = 1; k < n; k++) {
        s += (k % 2 === 0 ? 2 : 4) * speedAt(curve, x0 + k * h);
      }
      total += (s * h) / 3;
    }
  }
  return total;
}

/** Vị trí nguồn (tính từ clip.in) ứng với thời điểm output t. */
export function sourcePosAt(curve: SpeedCurve, t: number): number {
  if (t <= 0) return 0;
  return integrateSpeed(curve, 0, t);
}

/** Tổng độ dài nguồn tiêu thụ cho clip có thời lượng output = duration. */
export function sourceConsumed(curve: SpeedCurve, duration: number): number {
  return sourcePosAt(curve, duration);
}

/** Tốc độ trung bình trên toàn clip (= nguồn tiêu thụ / duration). */
export function averageSpeed(curve: SpeedCurve, duration: number): number {
  if (duration <= 0) return 1;
  return sourceConsumed(curve, duration) / duration;
}

export interface SpeedSegment {
  /** Bắt đầu đoạn trên timeline output (giây từ đầu clip). */
  outStart: number;
  /** Thời lượng output của đoạn (giây). Tổng = duration. */
  outDur: number;
  /** Tốc độ hằng dùng cho đoạn (= speedAt tại giữa đoạn). */
  speed: number;
  /** Bắt đầu đoạn trên timeline nguồn (giây tính từ clip.in). */
  srcStart: number;
  /** Thời lượng nguồn của đoạn = outDur * speed. */
  srcDur: number;
}

/**
 * Chia clip thành các đoạn output để render bằng speed hằng từng đoạn
 * (trim + setpts/atempo + concat). Đoạn dài ~0.2s, tối thiểu 0.05s,
 * tối đa 240 đoạn (clip dài tự giãn đoạn ra).
 */
export function planSpeedSegments(
  curve: SpeedCurve,
  duration: number,
): SpeedSegment[] {
  if (duration <= 0) throw new Error("planSpeedSegments: duration phải > 0");
  const MAX_SEGMENTS = 240;
  let segOut = 0.2;
  if (duration / segOut > MAX_SEGMENTS) segOut = duration / MAX_SEGMENTS;
  if (segOut < 0.05) segOut = 0.05;
  const segs: SpeedSegment[] = [];
  let out = 0;
  let src = 0;
  while (out < duration - 1e-9) {
    const d = Math.min(segOut, duration - out);
    const speed = speedAt(curve, out + d / 2);
    const srcDur = d * speed;
    segs.push({ outStart: out, outDur: d, speed, srcStart: src, srcDur });
    out += d;
    src += srcDur;
  }
  return segs;
}
