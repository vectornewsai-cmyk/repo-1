/**
 * audiomix.js — Audio mixer cho render worker (Phase 7 P3).
 *
 * 1. Gain expression: khi clip có volumeKeyframes hoặc fade cong (non-linear),
 *    render dùng MỘT filter `volume='EXPR':eval=frame` thay cho volume + afade
 *    tĩnh, với EXPR = trackVol × vol × fadeIn(t) × fadeOut(t) × vkf(t).
 *    - t = thời gian cục bộ từ đầu clip (sau asetpts=PTS-STARTPTS, t bắt đầu 0).
 *    - volumeKeyframes GHI ĐÈ volume tĩnh (cùng ngữ nghĩa preview).
 *    - Khi không có keyframes và fade linear/mặc định: trả về null để caller
 *      giữ nguyên đường volume + afade cũ (không regression).
 * 2. Track volume: hệ số nhân 0..2 cho cả track (caller tự nhân vào).
 * 3. Normalize export: filter loudnorm 1-pass hoặc dynaudnorm áp sau amix.
 */
"use strict";

const FADE_CURVES = ["linear", "ease-in", "ease-out", "sine"];

function ffNum(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

/** Hệ số fade tại tiến trình p theo đường cong (p đã clamp [0,1]). */
function fadeCurveFactor(curve, p) {
  const c = Math.min(1, Math.max(0, p));
  if (curve === "ease-in") return c * c;
  if (curve === "ease-out") return 1 - (1 - c) * (1 - c);
  if (curve === "sine") return Math.sin((c * Math.PI) / 2);
  return c; // linear (mặc định)
}

/** Biểu thức FFmpeg cho hệ số fade tại tiến trình pExpr (chuỗi). */
function fadeCurveExpr(curve, pExpr) {
  const p = `(${pExpr})`;
  if (curve === "ease-in") return `${p}*${p}`;
  if (curve === "ease-out") return `(1-(1-${p})*(1-${p}))`;
  if (curve === "sine") return `sin(${p}*PI/2)`;
  return p; // linear
}

/** Biểu thức nội suy keyframes volume (mirror buildInterpExpr, chỉ dùng cho volume). */
function buildVolumeInterpExpr(kv) {
  const ks = [...kv.keyframes].sort((a, b) => a.t - b.t);
  const dedup = [];
  for (const k of ks) {
    const last = dedup[dedup.length - 1];
    if (last && last.t === k.t) dedup[dedup.length - 1] = k;
    else dedup.push(k);
  }
  if (dedup.length === 0) throw new Error("buildVolumeInterpExpr: keyframes rỗng");
  if (dedup.length === 1) return ffNum(dedup[0].v);
  const T = (x) => ffNum(x);
  const seg = (a, b) => {
    const span = b.t - a.t;
    const p = span <= 0 ? "0" : `(t-${T(a.t)})/${T(span)}`;
    let e;
    if (a.easing === "ease-in") e = `(${p})*(${p})`;
    else if (a.easing === "ease-out") e = `(1-(1-(${p}))*(1-(${p})))`;
    else if (a.easing === "linear") e = `(${p})`;
    else throw new Error(`easing không hỗ trợ: ${a.easing}`);
    return `(${T(a.v)}+(${(T(b.v - a.v))})*(${e}))`;
  };
  let expr = T(dedup[dedup.length - 1].v);
  for (let i = dedup.length - 2; i >= 0; i--) {
    expr = `if(lt(t,${T(dedup[i + 1].t)}),${seg(dedup[i], dedup[i + 1])},${expr})`;
  }
  expr =
    `if(lt(t,${T(dedup[0].t)}),${T(dedup[0].v)},` +
    `if(gt(t,${T(dedup[dedup.length - 1].t)}),${T(dedup[dedup.length - 1].v)},${expr}))`;
  return expr;
}

/**
 * Có cần đường expression không? Có khi: volumeKeyframes present, hoặc
 * fadeInCurve/fadeOutCurve khác linear.
 */
function needsGainExpr(clip) {
  if (clip.volumeKeyframes && clip.volumeKeyframes.keyframes && clip.volumeKeyframes.keyframes.length > 0) return true;
  if (clip.fadeInCurve && clip.fadeInCurve !== "linear") return true;
  if (clip.fadeOutCurve && clip.fadeOutCurve !== "linear") return true;
  return false;
}

/**
 * Dựng filter `volume='EXPR':eval=frame` cho 1 clip.
 * @param {object} clip AudioClip (volume, fadeIn/Out, fadeInCurve/OutCurve, volumeKeyframes, duration)
 * @param {number} trackVolume hệ số track (mặc định 1)
 * @returns {string|null} chuỗi filter (chưa có dấu phẩy đầu) hoặc null nếu dùng đường cũ.
 */
function buildGainFilter(clip, trackVolume = 1) {
  if (!needsGainExpr(clip)) return null;
  const EPS = 1e-9;
  const dur = clip.duration;
  let base;
  if (clip.volumeKeyframes && clip.volumeKeyframes.keyframes && clip.volumeKeyframes.keyframes.length > 0) {
    base = buildVolumeInterpExpr(clip.volumeKeyframes);
  } else {
    base = ffNum(clip.volume ?? 1);
  }
  let expr = `(${base})`;
  const fi = clip.fadeIn ?? 0;
  if (fi > EPS) {
    const p = `(t/${ffNum(fi)})`;
    expr += `*if(lt(t,${ffNum(fi)}),${fadeCurveExpr(clip.fadeInCurve ?? "linear", p)},1)`;
  }
  const fo = clip.fadeOut ?? 0;
  if (fo > EPS) {
    const q = `((${ffNum(dur)}-t)/${ffNum(fo)})`;
    expr += `*if(gt(t,${ffNum(dur - fo)}),${fadeCurveExpr(clip.fadeOutCurve ?? "linear", q)},1)`;
  }
  if (Math.abs(trackVolume - 1) > EPS) expr += `*${ffNum(trackVolume)}`;
  return `volume='max(0,${expr})':eval=frame`;
}

/**
 * Filter normalize áp sau amix (trên stream đã mix).
 * @param {object} opts { mode: "loudnorm"|"dynaudnorm", target?: number, tp?: number, lra?: number }
 * @returns {string|null} chuỗi filter (không có dấu phẩy đầu) hoặc null nếu off.
 */
function buildNormalizeFilter(opts) {
  if (!opts || opts.mode === "off" || !opts.mode) return null;
  if (opts.mode === "loudnorm") {
    const I = opts.target ?? -14;
    const TP = opts.tp ?? -1.5;
    const LRA = opts.lra ?? 11;
    return `loudnorm=I=${ffNum(I)}:TP=${ffNum(TP)}:LRA=${ffNum(LRA)}`;
  }
  if (opts.mode === "dynaudnorm") {
    return "dynaudnorm=f=150:g=15";
  }
  throw new Error(`normalize mode không hỗ trợ: ${opts.mode}`);
}

module.exports = {
  FADE_CURVES,
  fadeCurveFactor,
  fadeCurveExpr,
  buildVolumeInterpExpr,
  needsGainExpr,
  buildGainFilter,
  buildNormalizeFilter,
};

// Tự test nhanh: node src/audiomix.js
if (require.main === module) {
  const clip = {
    duration: 4, volume: 1, fadeIn: 2, fadeOut: 2,
    fadeInCurve: "sine", fadeOutCurve: "ease-in",
    volumeKeyframes: { keyframes: [
      { t: 0, v: 1, easing: "linear" },
      { t: 4, v: 0.5, easing: "linear" },
    ] },
  };
  console.log(buildGainFilter(clip, 0.5));
  console.log(buildGainFilter({ duration: 4, volume: 0.8 }));
  console.log(buildNormalizeFilter({ mode: "loudnorm" }));
  console.log(buildNormalizeFilter({ mode: "dynaudnorm" }));
}
