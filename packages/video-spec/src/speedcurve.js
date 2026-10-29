/**
 * speedcurve.js — ESM mirror của speedcurve.ts (Phase 7 P3).
 * Mirror CHÍNH XÁC logic: nếu đổi công thức ở đây, PHẢI đổi cả bên .ts
 * và server/render/src/speedramp.js. Test parity nằm ở server/render/test_p3.js.
 */

export const SPEED_EASINGS = ["linear", "ease-in", "ease-out", "bezier"];

/** Bezier mặc định khi easing = "bezier" mà keyframe không kèm mảng bezier
 * (trùng CSS `ease`). Mirror của DEFAULT_SPEED_BEZIER trong speedcurve.ts. */
export const DEFAULT_SPEED_BEZIER = [0.25, 0.1, 0.25, 1];

export function normalizeSpeedKeyframes(kfs) {
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const out = [];
  for (const k of sorted) {
    const last = out[out.length - 1];
    if (last && last.t === k.t) out[out.length - 1] = k;
    else out.push(k);
  }
  return out;
}

export function cubicBezierY(x1, y1, x2, y2, x) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t) => (3 * ax * t + 2 * bx) * t + cx;
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

export function applySpeedEasing(easing, p, bezier) {
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
    default:
      throw new Error(`easing không hỗ trợ: ${easing}`);
  }
}

export function speedAt(curve, t) {
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

export function integrateSpeed(curve, a, b) {
  if (b <= a) return 0;
  const ks = normalizeSpeedKeyframes(curve.keyframes);
  if (ks.length === 0) throw new Error("integrateSpeed: mảng keyframes rỗng");
  if (ks.length === 1) return ks[0].v * (b - a);
  const cuts = [a];
  for (const k of ks) if (k.t > a && k.t < b) cuts.push(k.t);
  cuts.push(b);
  let total = 0;
  for (let i = 0; i < cuts.length - 1; i++) {
    const x0 = cuts[i];
    const x1 = cuts[i + 1];
    const span = x1 - x0;
    let seg = null;
    for (let j = 0; j < ks.length - 1; j++) {
      if (x0 >= ks[j].t - 1e-12 && x1 <= ks[j + 1].t + 1e-12) {
        seg = { v0: ks[j].v, v1: ks[j + 1].v, easing: ks[j].easing, bezier: ks[j].bezier, t0: ks[j].t, segSpan: ks[j + 1].t - ks[j].t };
        break;
      }
    }
    if (!seg) {
      total += speedAt(curve, (x0 + x1) / 2) * span;
      continue;
    }
    if (seg.easing === "linear" || seg.easing === "ease-in" || seg.easing === "ease-out") {
      // SỬA Phase 8 Q3 (mirror speedcurve.ts): tích phân ĐÚNG trên đoạn con
      // bằng nguyên hàm theo easing; đoạn đầy đủ cho kết quả y hệt bản cũ.
      const { v0, v1, easing } = seg;
      const S = seg.segSpan;
      const p0 = S <= 0 ? 0 : (x0 - seg.t0) / S;
      const p1 = S <= 0 ? 0 : (x1 - seg.t0) / S;
      const anti = (p) =>
        easing === "linear" ? (p * p) / 2
        : easing === "ease-in" ? (p * p * p) / 3
        : p + Math.pow(1 - p, 3) / 3;
      total += v0 * span + (v1 - v0) * S * (anti(p1) - anti(p0));
    } else {
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

export function sourcePosAt(curve, t) {
  if (t <= 0) return 0;
  return integrateSpeed(curve, 0, t);
}

export function sourceConsumed(curve, duration) {
  return sourcePosAt(curve, duration);
}

export function averageSpeed(curve, duration) {
  if (duration <= 0) return 1;
  return sourceConsumed(curve, duration) / duration;
}

export function planSpeedSegments(curve, duration) {
  if (duration <= 0) throw new Error("planSpeedSegments: duration phải > 0");
  const MAX_SEGMENTS = 240;
  let segOut = 0.2;
  if (duration / segOut > MAX_SEGMENTS) segOut = duration / MAX_SEGMENTS;
  if (segOut < 0.05) segOut = 0.05;
  const segs = [];
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

/**
 * Cắt/dịch speed keyframes theo trim (Phase 9 đợt 13 C5).
 * Mirror của trimSpeedKeyframes trong speedcurve.ts: keyframe t là thời
 * gian OUTPUT tính từ đầu clip → trim trái dịch t' = t - shift
 * (shift = newStart - oldStart), trim phải truyền shift = 0; điểm rơi
 * ngoài [0, newDuration] thì bị cắt, điểm sát biên (EPS) thì kẹp về biên.
 */
export function trimSpeedKeyframes(kfs, shift, newDuration) {
  const EPS = 1e-9;
  if (!kfs || kfs.length === 0) {
    return { keyframes: [], dropped: 0, changed: false };
  }
  let dropped = 0;
  let changed = false;
  const kept = [];
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

/**
 * Mirror của segmentEasingAt trong speedcurve.ts (Phase 9 đợt 14 R5).
 */
function segmentEasingAt(ks, x) {
  let easing = "linear";
  for (const k of ks) {
    if (k.t <= x + 1e-9) easing = k.easing;
    else break;
  }
  return easing;
}

/**
 * Mirror của lerpPt/splitCubicAt/solveBezierX/subdivideBezier trong
 * speedcurve.ts (Phase 9 đợt 14 R5): chia nhỏ cubic-bezier bằng
 * de Casteljau để slice của bezier đúng hệt, không gần đúng.
 */
function lerpPt(a, b, s) {
  return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
}

function splitCubicAt(pts, s) {
  const [p0, p1, p2, p3] = pts;
  const a = lerpPt(p0, p1, s);
  const b = lerpPt(p1, p2, s);
  const c = lerpPt(p2, p3, s);
  const d = lerpPt(a, b, s);
  const e = lerpPt(b, c, s);
  const f = lerpPt(d, e, s);
  return [[p0, a, d, f], [f, e, c, p3]];
}

function solveBezierX(x1, x2, target) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const sampleX = (s) => ((ax * s + bx) * s + cx) * s;
  const sampleDX = (s) => (3 * ax * s + 2 * bx) * s + cx;
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

function subdivideBezier(bezier, pLo, pHi) {
  if (!(pLo >= 0 && pHi <= 1 && pHi > pLo)) return null;
  const [x1, y1, x2, y2] = bezier;
  let controls = [[0, 0], [x1, y1], [x2, y2], [1, 1]];
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
 * Bezier bậc 3 nâng bậc từ bậc 2 cho một đoạn con [pA, pB] của easing
 * ease-in (p²) hoặc ease-out (2p − p²) — mirror của
 * quadraticPortionBezier bên speedcurve.ts (Phase 9 đợt 16 H3).
 * x1 = 1/3, x2 = 2/3 cho x(s) = s đúng hệt; y1, y2 suy từ hệ số bậc 2
 * đã chuẩn hoá w(u) = a·u + b·u² qua P1y = a/2 rồi nâng bậc.
 */
function quadraticPortionBezier(easing, pA, pB) {
  if (!(pB > pA && pA >= 0 && pB <= 1)) return null;
  if (easing === "ease-in") {
    const s = pA + pB;
    if (s <= 0) return null;
    return [1 / 3, (2 * pA) / (3 * s), 2 / 3, (3 * pA + pB) / (3 * s)];
  }
  const d = 2 - pA - pB;
  if (d <= 0) return null;
  return [1 / 3, (2 * (1 - pA)) / (3 * d), 2 / 3, (4 - 3 * pA - pB) / (3 * d)];
}

/**
 * Mirror của sliceSpeedKeyframes trong speedcurve.ts (Phase 9 đợt 14 R5,
 * cập nhật đợt 16 H3):
 * cắt đoạn [from, to) và rebase về 0; hai đầu luôn có điểm (chèn điểm
 * biên với v = speedAt nếu không có keyframe đúng tại biên). Đánh giá
 * đúng hệt với linear, bezier (nhờ subdivide), ease-in và ease-out cả
 * hai phía (nhờ bezier nâng bậc từ bậc 2 — xem comment bên .ts).
 * Validator render bắt t trong [0, duration] nên không giữ keyframe âm
 * hay vượt duration.
 */
export function sliceSpeedKeyframes(kfs, from, to) {
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
  const out = [];
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
  const segContaining = (x) => {
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
      const pt = out.find((p) => Math.abs(p.t - (segTo.seg.t - lo)) <= 1e-9);
      if (pt) {
        const spanTo = segTo.next.t - segTo.seg.t;
        const sub = subdivideBezier(segTo.seg.bezier, 0, (to - segTo.seg.t) / spanTo);
        pt.easing = "bezier";
        pt.bezier = sub ?? segTo.seg.bezier;
      }
    }
  }
  // Phase 9 đợt 16 H3 (mirror bên .ts): ease-in phía phải / ease-out
  // phía trái nay dùng bezier nâng bậc từ bậc 2 nên đánh giá đúng hệt.
  // Chỉ đổi khi đoạn thực sự gần đúng: ease-in ở đầu slice, ease-out ở
  // đầu slice chỉ khi kết thúc trong cùng đoạn, ease-out ở cuối slice
  // khi to nằm trong đoạn (không cùng đoạn với lo); đoạn phẳng giữ
  // easing cũ.
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
  const changed = lo > EPS || dropped > 0 || !atStart || !atEnd;
  return {
    keyframes: normalizeSpeedKeyframes(out),
    dropped,
    changed,
    visibleDuration: to - lo,
  };
}

/**
 * Mirror của splitSpeedKeyframes trong speedcurve.ts (Phase 9 đợt 14 R5).
 */
export function splitSpeedKeyframes(kfs, splitT, totalDuration) {
  if (!kfs || kfs.length === 0) return { left: [], right: [] };
  const norm = normalizeSpeedKeyframes(kfs);
  if (splitT <= 0) return { left: [], right: norm };
  if (splitT >= totalDuration) return { left: norm, right: [] };
  return {
    left: sliceSpeedKeyframes(norm, 0, splitT).keyframes,
    right: sliceSpeedKeyframes(norm, splitT, totalDuration).keyframes,
  };
}

/**
 * Mirror của visibleSpeedKeyframes trong speedcurve.ts (Phase 9 đợt 14 R5):
 * curve khả kiến của clip lá dưới cửa sổ trim ngoài; lá bị cắt hết
 * hoặc không có curve → null.
 */
export function visibleSpeedKeyframes(kfs, leafStart, leafDuration, winIn, winOut) {
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
 * Mirror của rampTrimLeftIn trong speedcurve.ts (Phase 9 đợt 14 R5):
 * newIn = in + ∫speed trên [0, shift) khi trim trái; mở rộng sang trái
 * (shift < 0) thì tốc độ clamp về keyframe đầu.
 */
export function rampTrimLeftIn(in0, curve, shift) {
  if (shift >= 0) return in0 + sourcePosAt(curve, shift);
  return in0 + speedAt(curve, 0) * shift;
}

/**
 * Mirror của rampTrimRightOut trong speedcurve.ts (Phase 9 đợt 14 R5):
 * newOut = in + ∫speed trên [0, newDuration).
 */
export function rampTrimRightOut(in0, curve, newDuration) {
  return in0 + sourcePosAt(curve, newDuration);
}

/**
 * Mirror của outputDurationForSource trong speedcurve.ts (Phase 9 đợt 14 R5):
 * thời lượng output dài nhất mà nguồn tiêu thụ không vượt srcLen
 * (chia đôi, vì sourcePosAt đơn điệu tăng khi tốc độ >= 0).
 */
export function outputDurationForSource(curve, srcLen) {
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
