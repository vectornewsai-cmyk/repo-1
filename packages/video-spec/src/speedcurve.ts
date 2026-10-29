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
 * P0=(0,0), P3=(1,1)); x1, x2 phải nằm trong [0, 1], còn y1, y2 TỰ DO theo
 * chuẩn CSS (y ngoài [0, 1] tạo overshoot — đường cong vọt quá rồi quay lại).
 * Giải x→t bằng Newton + bisection fallback, rồi lấy y(t).
 * (Phase 9 đợt 13 C5: trước đây comment này ghi "tất cả trong [0, 1]" và
 * validator render cũng chặn y ngoài [0, 1]; cả hai đã sửa cho khớp chuẩn CSS.
 * Công thức cubicBezierY vốn đã xử lý đúng y ngoài [0, 1], không đổi.)
 */

/** Easing cho speed keyframe. "bezier" cần kèm `bezier`. */
export type SpeedEasing = "linear" | "ease-in" | "ease-out" | "bezier";

export const SPEED_EASINGS: readonly SpeedEasing[] = [
  "linear",
  "ease-in",
  "ease-out",
  "bezier",
] as const;

/** Bezier mặc định khi easing = "bezier" mà keyframe không kèm mảng bezier
 * (trùng CSS `ease`: cubic-bezier(0.25, 0.1, 0.25, 1)). UI và engine dùng
 * chung hằng này để số hiển thị và số đánh giá không lệch nhau. */
export const DEFAULT_SPEED_BEZIER: [number, number, number, number] = [
  0.25, 0.1, 0.25, 1,
];

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
      const b = bezier ?? DEFAULT_SPEED_BEZIER;
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

export interface TrimmedSpeedKeyframes {
  /** Keyframes sau trim (đã normalize); rỗng = curve không còn điểm nào. */
  keyframes: SpeedKeyframe[];
  /** Số keyframe biến mất (bị cắt ngoài vùng hoặc bị gộp do trùng t sau kẹp biên). */
  dropped: number;
  /** true nếu keyframes thay đổi (bị cắt, bị gộp, hoặc bị dịch t). */
  changed: boolean;
}

/**
 * Cắt/dịch speed keyframes theo trim (Phase 9 đợt 13 C5).
 *
 * Ngữ nghĩa — KHỚP trimLeftTo/trimRightTo trong speed.ts: keyframe t là
 * thời gian OUTPUT tính từ đầu clip, nên trim chỉ dịch gốc output:
 * - Trim mép TRÁI: gốc output dịch đi `shift` = newStart - oldStart
 *   (dương = cắt đầu clip, âm = kéo dài sang trái) → mọi keyframe dịch
 *   t' = t - shift. Điểm nào rơi trước 0 thì bị cắt (giống karaoke bị
 *   shiftKaraoke bỏ từ rớt khỏi đầu).
 * - Trim mép PHẢI: gốc không đổi (shift = 0), chỉ thu duration →
 *   điểm nào có t' > newDuration thì bị cắt (giống clampKaraoke).
 * Điểm nằm trong sai số EPS quanh biên thì được kẹp về biên thay vì cắt
 * (tránh cắt oan do float), và nếu kẹp làm 2 điểm trùng t thì điểm sau
 * thắng theo normalizeSpeedKeyframes (đếm vào `dropped`).
 *
 * KHÔNG tự thêm điểm biên mới: sau trim phải, tốc độ ngoài điểm cuối
 * được speedAt clamp về giá trị biên nên curve vẫn đúng; sau trim trái
 * kéo dài, đoạn đầu mới cũng clamp về điểm đầu. Việc này giữ số điểm
 * không tăng lặng lẽ sau mỗi lần trim.
 *
 * @param kfs keyframes hiện tại (chưa normalize cũng được).
 * @param shift độ dịch gốc output (xem trên); trim phải truyền 0.
 * @param newDuration duration output mới sau trim.
 */
export function trimSpeedKeyframes(
  kfs: SpeedKeyframe[],
  shift: number,
  newDuration: number,
): TrimmedSpeedKeyframes {
  const EPS = 1e-9;
  if (!kfs || kfs.length === 0) {
    return { keyframes: [], dropped: 0, changed: false };
  }
  let dropped = 0;
  let changed = false;
  const kept: SpeedKeyframe[] = [];
  for (const k of kfs) {
    let t = k.t - shift;
    if (t < -EPS || t > newDuration + EPS) {
      dropped++;
      changed = true;
      continue;
    }
    if (t < 0) t = 0;
    if (t > newDuration) t = newDuration;
    if (Math.abs(t - k.t) > EPS) changed = true;
    kept.push(t === k.t ? k : { ...k, t });
  }
  const norm = normalizeSpeedKeyframes(kept);
  if (norm.length !== kept.length) {
    dropped += kept.length - norm.length;
    changed = true;
  }
  return { keyframes: norm, dropped, changed };
}

export interface SlicedSpeedKeyframes {
  /** Keyframes của đoạn cắt, đã rebase về 0 (mọi t đều trong [0, visibleDuration]). */
  keyframes: SpeedKeyframe[];
  /** Số keyframe gốc không còn đại diện trong kết quả (ngoài cửa sổ hoặc bị gộp). */
  dropped: number;
  /** true nếu biểu diễn thay đổi (dịch, chèn điểm biên, cắt, gộp). */
  changed: boolean;
  /** Độ dài đoạn cắt (to − from, sau khi kẹp from về >= 0). */
  visibleDuration: number;
}

/**
 * Easing của đoạn chứa thời điểm x: easing của keyframe cuối cùng có
 * t <= x; nếu x nằm trước keyframe đầu tiên thì "linear" (tốc độ ở đó
 * hằng bằng giá trị keyframe đầu nên easing nào cũng cho cùng kết quả).
 */
function segmentEasingAt(ks: SpeedKeyframe[], x: number): SpeedEasing {
  let easing: SpeedEasing = "linear";
  for (const k of ks) {
    if (k.t <= x + 1e-9) easing = k.easing;
    else break;
  }
  return easing;
}

type CubicPt = [number, number];

function lerpPt(a: CubicPt, b: CubicPt, s: number): CubicPt {
  return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
}

/** Chia một cubic-bezier tại tham số s → [nửa trái, nửa phải] (de Casteljau). */
function splitCubicAt(pts: [CubicPt, CubicPt, CubicPt, CubicPt], s: number): [[CubicPt, CubicPt, CubicPt, CubicPt], [CubicPt, CubicPt, CubicPt, CubicPt]] {
  const [p0, p1, p2, p3] = pts;
  const a = lerpPt(p0, p1, s);
  const b = lerpPt(p1, p2, s);
  const c = lerpPt(p2, p3, s);
  const d = lerpPt(a, b, s);
  const e = lerpPt(b, c, s);
  const f = lerpPt(d, e, s);
  return [[p0, a, d, f], [f, e, c, p3]];
}

/**
 * Giải x(s) = target cho cubic-bezier (x1, x2) — cùng thuật toán
 * Newton + bisection fallback như cubicBezierY, nhưng trả về tham số s.
 */
function solveBezierX(x1: number, x2: number, target: number): number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleDX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
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

/**
 * Chia nhỏ một easing cubic-bezier thành đoạn con [pLo, pHi] (theo tỉ lệ
 * thời gian trong đoạn gốc) và chuẩn hoá đoạn con về [0, 1] × [0, 1]
 * (Phase 9 đợt 14 R5 — làm slice của bezier đúng hệt, không gần đúng).
 *
 * Cách làm: giải sLo/sHi sao cho x(s) = pLo/pHi, chia de Casteljau hai
 * lần (lấy nửa phải tại sLo rồi nửa trái của nó tại tỉ lệ tương ứng),
 * rồi chia x và y cho bề rộng/cao của đoạn con. x sau chuẩn hoá vẫn
 * nằm trong [0, 1] (x(s) đơn điệu vì x1, x2 ∈ [0, 1]); y tự do theo
 * chuẩn CSS. Trả null khi đoạn con suy biến (bề rộng x hoặc cao y ≈ 0)
 * — caller giữ bezier gốc làm gần đúng thay vì để trống mảng bezier.
 */
function subdivideBezier(
  bezier: [number, number, number, number],
  pLo: number,
  pHi: number,
): [number, number, number, number] | null {
  if (!(pLo >= 0 && pHi <= 1 && pHi > pLo)) return null;
  const [x1, y1, x2, y2] = bezier;
  let controls: [CubicPt, CubicPt, CubicPt, CubicPt] = [[0, 0], [x1, y1], [x2, y2], [1, 1]];
  const sLo = pLo <= 0 ? 0 : solveBezierX(x1, x2, pLo);
  const sHi = pHi >= 1 ? 1 : solveBezierX(x1, x2, pHi);
  if (!(sHi > sLo)) return null;
  if (sLo > 0) controls = splitCubicAt(controls, sLo)[1];
  if (sHi < 1) {
    const u = (sHi - sLo) / (1 - sLo);
    controls = splitCubicAt(controls, u)[0];
  }
  const [l0, l1, l2, l3] = controls;
  const dx = l3[0] - l0[0];
  const dy = l3[1] - l0[1];
  if (Math.abs(dx) < 1e-12 || Math.abs(dy) < 1e-12) return null;
  return [
    (l1[0] - l0[0]) / dx,
    (l1[1] - l0[1]) / dy,
    (l2[0] - l0[0]) / dx,
    (l2[1] - l0[1]) / dy,
  ];
}

/**
 * Bezier bậc 3 nâng bậc từ bậc 2 cho một đoạn con [pA, pB] (theo tỉ lệ
 * thời gian trong đoạn gốc) của easing ease-in (p²) hoặc ease-out
 * (2p − p²) — Phase 9 đợt 16 H3. Đoạn bậc 2 bị cắt không còn là p² /
 * (2p − p²) nguyên dạng sau khi dời đoạn (đó là nguồn gốc chặn gần đúng
 * 0.125 × |Δv| cũ), nhưng nó vẫn là đa thức bậc 2 theo biến mới u, nên
 * nâng bậc lên bezier bậc 3 cho ra đúng hệt: với P0 = (0, 0), P2 = (1, 1)
 * thì x1 = 1/3, x2 = 2/3 cho x(s) = s đúng hệt (kiểm chứng: x(s) =
 * (1−s)²s + 2(1−s)s² + s³ = s), còn y1, y2 suy từ hệ số bậc 2 đã chuẩn
 * hoá w(u) = a·u + b·u² (a + b = 1) qua P1y = a/2 rồi nâng bậc
 * Q1y = 2P1y/3, Q2y = (2P1y + 1)/3. Trả null khi đoạn con suy biến
 * (pA ≥ pB, ngoài [0, 1], hoặc mẫu số ≈ 0 — chỉ xảy ra với đoạn phẳng
 * hoặc đoạn rỗng, caller giữ easing cũ).
 */
function quadraticPortionBezier(
  easing: "ease-in" | "ease-out",
  pA: number,
  pB: number,
): [number, number, number, number] | null {
  if (!(pB > pA && pA >= 0 && pB <= 1)) return null;
  if (easing === "ease-in") {
    // w(u) = (p² − pA²)/(pB² − pA²), p = pA + (pB−pA)u
    //      = [2pA·u + (pB−pA)u²] / (pA + pB).
    const s = pA + pB;
    if (s <= 0) return null;
    return [1 / 3, (2 * pA) / (3 * s), 2 / 3, (3 * pA + pB) / (3 * s)];
  }
  // w(u) = [(2p − p²) − (2pA − pA²)] / [(2pB − pB²) − (2pA − pA²)]
  //      = [2(1−pA)u − (pB−pA)u²] / (2 − pA − pB).
  const d = 2 - pA - pB;
  if (d <= 0) return null;
  return [1 / 3, (2 * (1 - pA)) / (3 * d), 2 / 3, (4 - 3 * pA - pB) / (3 * d)];
}

/**
 * Cắt đoạn [from, to) của đường cong và rebase về 0 (Phase 9 đợt 14 R5).
 *
 * Dùng cho split clip (nửa trái = slice [0, splitT), nửa phải =
 * slice [splitT, duration)) và cho nested: phần khả kiến của clip lá
 * dưới cửa sổ trim ngoài là slice theo khoảng output tương ứng.
 *
 * Tính đúng đắn (quan trọng — validator render bắt mọi keyframe t phải
 * nằm trong [0, duration] nên KHÔNG được giữ keyframe âm hay vượt
 * duration để "giữ nguyên tham số đoạn" như một cách làm khác):
 * - Mọi keyframe trong cửa sổ được giữ nguyên v/easing/bezier, chỉ dịch t.
 * - Hai đầu cửa sổ luôn có điểm: nếu không có keyframe đúng tại biên
 *   thì chèn điểm biên với v = speedAt tại biên đó (đầu trái mang easing
 *   của đoạn chứa biên; đầu phải là điểm cuối nên easing không còn tác dụng).
 * - Linear: slice đánh giá ĐÚNG HỆT đường cong gốc trên đoạn cắt, cả hai phía.
 * - Ease-in / ease-out: ĐÚNG HỆT cả hai phía từ đợt 16 H3 (trước đó phía
 *   phải của ease-in / phía trái của ease-out chỉ gần đúng, chặn
 *   0.125 × |Δv| vì p² / (2p−p²) không đóng dưới phép dời đoạn). Cách sửa:
 *   đoạn bậc 2 bị cắt được nâng bậc lên bezier bậc 3 (x1 = 1/3, x2 = 2/3
 *   cho x(s) = s đúng hệt, xem quadraticPortionBezier) nên engine đánh
 *   giá ra đúng giá trị gốc; đoạn phẳng (|Δv| ≈ 0) giữ easing cũ vì mọi
 *   easing cho cùng kết quả; đoạn ease-out kéo dài tới cuối đoạn gốc
 *   vốn đã đúng hệt nên cũng giữ easing cũ, tránh đổi nhãn thừa.
 * - Bezier: ĐÚNG HỆT cả hai phía nhờ chia nhỏ cubic-bezier bằng
 *   thuật toán de Casteljau (subdivideBezier): đoạn con được chuẩn hoá
 *   lại về [0, 1] × [0, 1] nên engine đánh giá ra đúng giá trị gốc.
 *   Trường hợp suy biến (đoạn con có bề rộng x hoặc cao y ≈ 0, ví dụ
 *   bezier phẳng tại điểm cắt) thì subdivide trả null và slice giữ
 *   bezier gốc làm gần đúng — vẫn tốt hơn để trống mảng bezier (khi đó
 *   engine sẽ rơi về CSS ease mặc định, sai hẳn).
 * - Điểm biên chèn thêm làm `changed = true` ngay cả khi đánh giá không
 *   đổi (ví dụ slice toàn bộ clip nhưng duration vượt keyframe cuối):
 *   `changed` nói về biểu diễn, không phải về giá trị đánh giá.
 *
 * @param from đầu đoạn (thời gian output, < 0 được kẹp về 0).
 * @param to cuối đoạn (thời gian output, phải > from, nếu không trả rỗng).
 */
export function sliceSpeedKeyframes(
  kfs: SpeedKeyframe[],
  from: number,
  to: number,
): SlicedSpeedKeyframes {
  const EPS = 1e-9;
  if (!kfs || kfs.length === 0) {
    return { keyframes: [], dropped: 0, changed: false, visibleDuration: 0 };
  }
  const lo = Math.max(0, from);
  if (!(to > lo)) {
    return { keyframes: [], dropped: kfs.length, changed: true, visibleDuration: 0 };
  }
  const norm = normalizeSpeedKeyframes(kfs);
  const inside = norm.filter((k) => k.t >= lo - EPS && k.t <= to + EPS);
  const dropped = kfs.length - inside.length;
  const atStart = norm.find((k) => Math.abs(k.t - lo) <= EPS);
  const atEnd = norm.find((k) => Math.abs(k.t - to) <= EPS);
  const out: SpeedKeyframe[] = [];
  if (atStart) out.push({ ...atStart, t: 0 });
  else {
    out.push({
      t: 0,
      v: speedAt({ keyframes: norm }, lo),
      easing: segmentEasingAt(norm, lo),
    });
  }
  for (const k of norm) {
    if (k.t > lo + EPS && k.t < to - EPS) out.push({ ...k, t: k.t - lo });
  }
  if (atEnd) out.push({ ...atEnd, t: to - lo });
  else {
    out.push({ t: to - lo, v: speedAt({ keyframes: norm }, to), easing: "linear" });
  }
  // Bezier: đoạn bị cắt giữa chừng phải chia nhỏ cubic thì mới đúng hệt
  // (xem subdivideBezier). Tìm đoạn chứa lo / to (keyframe bắt đầu đoạn
  // là keyframe cuối cùng có t < biên, đoạn kế tiếp phải vượt qua biên).
  const segContaining = (x: number): { seg: SpeedKeyframe; next: SpeedKeyframe } | null => {
    for (let i = norm.length - 2; i >= 0; i--) {
      if (norm[i].t < x - EPS && norm[i + 1].t > x + EPS) {
        return { seg: norm[i], next: norm[i + 1] };
      }
    }
    return null;
  };
  const segLo = atStart ? null : segContaining(lo);
  const segTo = atEnd ? null : segContaining(to);
  if (segLo && segLo.seg.easing === "bezier" && segLo.seg.bezier) {
    const spanLo = segLo.next.t - segLo.seg.t;
    const pLo = (lo - segLo.seg.t) / spanLo;
    const sameSeg = segTo !== null && segTo.seg === segLo.seg;
    const sub = sameSeg
      ? subdivideBezier(segLo.seg.bezier, pLo, (to - segLo.seg.t) / spanLo)
      : subdivideBezier(segLo.seg.bezier, pLo, 1);
    out[0].easing = "bezier";
    out[0].bezier = sub ?? segLo.seg.bezier;
  }
  if (segTo && segTo.seg.easing === "bezier" && segTo.seg.bezier) {
    const sameSeg = segLo !== null && segTo.seg === segLo.seg;
    if (!sameSeg) {
      // Điểm bắt đầu đoạn chứa `to` trong kết quả (t = segTo.seg.t − lo).
      const pt = out.find((p) => Math.abs(p.t - (segTo.seg.t - lo)) <= 1e-9);
      if (pt) {
        const spanTo = segTo.next.t - segTo.seg.t;
        const sub = subdivideBezier(segTo.seg.bezier, 0, (to - segTo.seg.t) / spanTo);
        pt.easing = "bezier";
        pt.bezier = sub ?? segTo.seg.bezier;
      }
    }
    // sameSeg: điểm đầu đã mang bezier của đoạn giữa (middle) ở trên.
  }
  // Phase 9 đợt 16 H3: ease-in phía phải / ease-out phía trái trước đây
  // chỉ gần đúng (chặn 0.125 × |Δv|) vì đa thức bậc 2 không đóng dưới
  // phép dời đoạn. Nay đổi các đoạn đó sang bezier nâng bậc từ bậc 2
  // (xem quadraticPortionBezier) nên slice đánh giá đúng hệt. Chỉ đổi
  // khi đoạn thực sự gần đúng: ease-in ở đầu slice (mọi trường hợp lo
  // nằm trong đoạn), ease-out ở đầu slice chỉ khi slice kết thúc trong
  // cùng đoạn (kéo dài tới cuối đoạn thì ease-out vốn đã đúng hệt nên
  // giữ easing cũ, tránh đổi nhãn thừa); ease-out ở cuối slice khi to
  // nằm trong đoạn (không cùng đoạn với lo). Đoạn phẳng (|Δv| ≈ 0) giữ
  // easing cũ vì mọi easing cho cùng kết quả.
  if (segLo && (segLo.seg.easing === "ease-in" || segLo.seg.easing === "ease-out")) {
    const spanQ = segLo.next.t - segLo.seg.t;
    const dvQ = segLo.next.v - segLo.seg.v;
    const sameQ = segTo !== null && segTo.seg === segLo.seg;
    if (
      spanQ > 0 &&
      Math.abs(dvQ) > 1e-12 &&
      (segLo.seg.easing === "ease-in" || sameQ)
    ) {
      const pLoQ = (lo - segLo.seg.t) / spanQ;
      const pHiQ = sameQ ? (to - segLo.seg.t) / spanQ : 1;
      const qb = quadraticPortionBezier(segLo.seg.easing, pLoQ, pHiQ);
      if (qb) {
        out[0].easing = "bezier";
        out[0].bezier = qb;
      }
    }
  }
  if (segTo && segTo.seg.easing === "ease-out") {
    const sameQ = segLo !== null && segTo.seg === segLo.seg;
    if (!sameQ) {
      const spanQ = segTo.next.t - segTo.seg.t;
      const dvQ = segTo.next.v - segTo.seg.v;
      if (spanQ > 0 && Math.abs(dvQ) > 1e-12) {
        const pt = out.find((p) => Math.abs(p.t - (segTo.seg.t - lo)) <= 1e-9);
        if (pt) {
          const qb = quadraticPortionBezier("ease-out", 0, (to - segTo.seg.t) / spanQ);
          if (qb) {
            pt.easing = "bezier";
            pt.bezier = qb;
          }
        }
      }
    }
  }
  const changed =
    lo > EPS || dropped > 0 || !atStart || !atEnd;
  return {
    keyframes: normalizeSpeedKeyframes(out),
    dropped,
    changed,
    visibleDuration: to - lo,
  };
}

export interface SplitSpeedKeyframes {
  /** Curve nửa trái, trên [0, splitT). */
  left: SpeedKeyframe[];
  /** Curve nửa phải, trên [0, totalDuration − splitT). */
  right: SpeedKeyframe[];
}

/**
 * Chia đường cong tại điểm splitT (thời gian output) — Phase 9 đợt 14 R5.
 * Nửa trái = slice [0, splitT), nửa phải = slice [splitT, totalDuration).
 * Mọi keyframe kết quả đều nằm trong khoảng của nửa mình (không keyframe
 * mồ côi), và mỗi nửa đánh giá đúng hệt như đường cong gốc trên khoảng
 * đó với linear, ease-in, ease-out (nhờ bezier nâng bậc, đợt 16 H3) và
 * bezier (nhờ de Casteljau; trừ đoạn con suy biến thì fallback về
 * bezier gốc — xem sliceSpeedKeyframes). splitT ngoài [0, totalDuration]
 * thì nửa rỗng tương ứng nhận mảng rỗng, nửa còn lại giữ nguyên đường cong.
 */
export function splitSpeedKeyframes(
  kfs: SpeedKeyframe[],
  splitT: number,
  totalDuration: number,
): SplitSpeedKeyframes {
  if (!kfs || kfs.length === 0) return { left: [], right: [] };
  const norm = normalizeSpeedKeyframes(kfs);
  if (splitT <= 0) return { left: [], right: norm };
  if (splitT >= totalDuration) return { left: norm, right: [] };
  return {
    left: sliceSpeedKeyframes(norm, 0, splitT).keyframes,
    right: sliceSpeedKeyframes(norm, splitT, totalDuration).keyframes,
  };
}

export interface VisibleSpeedCurve {
  /** Curve của phần khả kiến, đã rebase về 0. */
  keyframes: SpeedKeyframe[];
  /** Độ dài phần khả kiến (thời gian output của lá). */
  visibleDuration: number;
  /** Điểm bắt đầu phần khả kiến trong thời gian output của lá. */
  visibleStart: number;
  /** Số keyframe gốc ngoài phần khả kiến. */
  dropped: number;
}

/**
 * Curve khả kiến của một clip lá dưới cửa sổ trim ngoài (Phase 9 đợt 14 R5).
 *
 * Cửa sổ [winIn, winOut) tính theo timeline của project chứa lá (với
 * nested clip: timeline của subSpec). Phần giao với [leafStart,
 * leafStart + leafDuration) được cắt ra bằng sliceSpeedKeyframes và
 * rebase về 0. Tốc độ của nested clip ngoài chỉ co/giãn vị trí đặt lá,
 * không đổi hình dạng đường cong theo thời gian output của lá nên không
 * xuất hiện ở đây. Lá bị cửa sổ cắt hết → trả null (giống flatten bỏ lá
 * có giao rỗng). Lá không có curve → null.
 */
export function visibleSpeedKeyframes(
  kfs: SpeedKeyframe[],
  leafStart: number,
  leafDuration: number,
  winIn: number,
  winOut: number,
): VisibleSpeedCurve | null {
  if (!kfs || kfs.length === 0) return null;
  const a = Math.max(0, winIn - leafStart);
  const b = Math.min(leafDuration, winOut - leafStart);
  if (!(b > a)) return null;
  const sliced = sliceSpeedKeyframes(kfs, a, b);
  return {
    keyframes: sliced.keyframes,
    visibleDuration: sliced.visibleDuration,
    visibleStart: a,
    dropped: sliced.dropped,
  };
}

/**
 * Điểm vào nguồn mới khi trim mép TRÁI một clip có speed curve
 * (Phase 9 đợt 14 R5 — sửa nợ đợt 13 C5: trimLeftTo dùng tốc độ hằng).
 *
 * Ngữ nghĩa ramp: nguồn tiêu thụ tới thời điểm output `shift` là
 * sourcePosAt(curve, shift) = ∫speed trên [0, shift), nên
 * newIn = in + ∫speed. Chỉ đúng khi clip phát xuôi (reverse + curve
 * đã bị validator cấm nên caller phải giữ đường cũ cho reverse).
 * Mở rộng sang trái (shift < 0): đoạn mở thêm nằm ngoài clip nên tốc độ
 * được clamp về keyframe đầu, newIn = in + speedAt(0) × shift.
 *
 * @throws nếu curve rỗng (giống sourcePosAt).
 */
export function rampTrimLeftIn(
  in0: number,
  curve: SpeedCurve,
  shift: number,
): number {
  if (shift >= 0) return in0 + sourcePosAt(curve, shift);
  return in0 + speedAt(curve, 0) * shift;
}

/**
 * Điểm ra nguồn mới khi trim mép PHẢI một clip có speed curve
 * (Phase 9 đợt 14 R5 — sửa nợ đợt 13 C5: trimRightTo dùng tốc độ hằng).
 * newOut = in + ∫speed trên [0, newDuration). Chỉ đúng khi phát xuôi;
 * reverse + curve đã bị validator cấm nên caller giữ đường cũ cho reverse.
 *
 * @throws nếu curve rỗng (giống sourcePosAt).
 */
export function rampTrimRightOut(
  in0: number,
  curve: SpeedCurve,
  newDuration: number,
): number {
  return in0 + sourcePosAt(curve, newDuration);
}

/**
 * Thời lượng output dài nhất mà nguồn tiêu thụ không vượt `srcLen`
 * (Phase 9 đợt 14 R5 — dùng để chặn trim phải của clip có curve khỏi
 * đọc quá cuối file nguồn). sourcePosAt đơn điệu tăng khi mọi tốc độ
 * >= 0 (validator bắt v trong [0.25, 4]) nên tìm bằng chia đôi là đúng;
 * srcLen <= 0 → 0. Sai số < 1e-9 sau 80 vòng lặp.
 *
 * @throws nếu curve rỗng (giống sourcePosAt).
 */
export function outputDurationForSource(
  curve: SpeedCurve,
  srcLen: number,
): number {
  if (srcLen <= 0) return 0;
  let hi = srcLen / 0.25;
  let guard = 0;
  while (sourcePosAt(curve, hi) < srcLen && guard < 64) {
    hi *= 2;
    guard++;
  }
  let lo = 0;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (sourcePosAt(curve, mid) < srcLen) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
