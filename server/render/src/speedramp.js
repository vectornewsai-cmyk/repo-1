/**
 * speedramp.js — Speed ramp cho render worker (Phase 7 P3).
 *
 * Toán đường cong MIRROR CHÍNH XÁC packages/video-spec/src/speedcurve.ts:
 * nếu đổi công thức ở đây, PHẢI đổi cả bên kia (test parity: test_p3.js).
 *
 * CÁCH RENDER (segment-based, đã kiểm chứng):
 *   Clip được chia thành các đoạn output ~0.2s. Mỗi đoạn dùng tốc độ hằng
 *   = speedAt tại giữa đoạn, rồi:
 *     video: trim nguồn [in+srcStart, in+srcStart+srcDur) → setpts=PTS/speed
 *     audio: atrim tương tự → atempo (tách factor [0.5, 2.0] như speed.js)
 *   rồi concat các đoạn lại. Tổng thời lượng output = clip.duration đúng
 *   theo thiết kế (tổng outDur), nên A/V đồng bộ theo từng đoạn (sai số
 *   tích lũy ≤ 1 frame video / 1 frame audio mỗi đoạn, không lệch dần).
 *
 * GIỚI HẠN (ghi trong P3_LIMITS.md):
 *   - reverse + speedKeyframes: không hỗ trợ (validator báo lỗi).
 *   - Tốc độ từng đoạn bị kẹp về [0.25, 4] — keyframe ngoài khoảng bị
 *     validator chặn từ đầu nên thực tế không xảy ra.
 *   - Clip ramp trong transition unit: chain ramp cho ra 1 stream chuẩn
 *     WxH/fps nên xfade vẫn làm việc (đã test ở test_p3.js).
 */
"use strict";

const { atempoFactors } = require("./speed");

const SPEED_MIN = 0.25;
const SPEED_MAX = 4;

function ffNum(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

function normalizeSpeedKeyframes(kfs) {
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const out = [];
  for (const k of sorted) {
    const last = out[out.length - 1];
    if (last && last.t === k.t) out[out.length - 1] = k;
    else out.push(k);
  }
  return out;
}

function cubicBezierY(x1, y1, x2, y2, x) {
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

function applySpeedEasing(easing, p, bezier) {
  const c = Math.min(1, Math.max(0, p));
  if (easing === "linear") return c;
  if (easing === "ease-in") return c * c;
  if (easing === "ease-out") return 1 - (1 - c) * (1 - c);
  if (easing === "bezier") {
    const b = bezier ?? [0.25, 0.1, 0.25, 1];
    return cubicBezierY(b[0], b[1], b[2], b[3], c);
  }
  throw new Error(`easing không hỗ trợ: ${easing}`);
}

function speedAt(curve, t) {
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

function integrateSpeed(curve, a, b) {
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

function sourcePosAt(curve, t) {
  if (t <= 0) return 0;
  return integrateSpeed(curve, 0, t);
}

function sourceConsumed(curve, duration) {
  return sourcePosAt(curve, duration);
}

function planSpeedSegments(curve, duration) {
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
 * Dựng chain video ramp: mỗi đoạn trim+setpts+chuẩn hoá WxH/fps/format,
 * rồi concat thành 1 stream. `postChain` là chuỗi filter áp sau concat
 * (chroma/color/LUT/effects/plugin — KHÔNG gồm format, vì format đã nằm
 * trong từng đoạn). Trả về { lines: string[], label } để caller push vào fc
 * và dùng label như stream clip bình thường.
 *
 * @param {string} streamRef ví dụ "[0:v]"
 * @param {object} clip clip có { in, duration, speedKeyframes }
 * @param {object} opts { W, H, fps, outFormat, padColor, enhPreChain, preScaleChain, postChain, lbl }
 *   enhPreChain: chuỗi bắt đầu bằng "," áp sau setpts=PTS-STARTPTS, TRƯỚC
 *     setpts=PTS/speed (giữ đúng thứ tự gốc: enhance → speed).
 *   preScaleChain: chuỗi bắt đầu bằng "," áp sau setpts/speed, trước scale (chroma key).
 *   postChain: chuỗi bắt đầu bằng "," áp sau concat (color/LUT/effects/plugin).
 */
function buildSpeedRampVideo(streamRef, clip, opts) {
  const segs = planSpeedSegments(clip.speedKeyframes, clip.duration);
  const enh = opts.enhPreChain || "";
  const pre = opts.preScaleChain || "";
  const lines = [];
  const labels = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const lab = opts.lbl("sr");
    const sStart = clip.in + s.srcStart;
    const sEnd = sStart + s.srcDur;
    lines.push(
      `${streamRef}trim=start=${ffNum(sStart)}:end=${ffNum(sEnd)},` +
        `setpts=PTS-STARTPTS${enh},setpts=PTS/${ffNum(s.speed)}${pre},` +
        `scale=${opts.W}:${opts.H}:force_original_aspect_ratio=decrease,` +
        `pad=${opts.W}:${opts.H}:(ow-iw)/2:(oh-ih)/2:color=${opts.padColor},` +
        `setsar=1,fps=${opts.fps},format=${opts.outFormat}[${lab}]`
    );
    labels.push(`[${lab}]`);
  }
  // postChain: chuỗi filter bắt đầu bằng "," (vd ",chromakey=...") — áp sau concat.
  const post = opts.postChain ? opts.postChain.replace(/^,/, "") : "";
  if (segs.length === 1) {
    // Chỉ 1 đoạn: không cần concat, label đoạn chính là output.
    const segLabel = labels[0];
    if (post) {
      const postLab = opts.lbl("srpost");
      lines.push(`${segLabel}${post}[${postLab}]`);
      return { lines, label: `[${postLab}]` };
    }
    return { lines, label: segLabel };
  }
  const out = opts.lbl("srout");
  lines.push(`${labels.join("")}concat=n=${segs.length}:v=1:a=0[${out}]`);
  // concat làm mất timebase 1/fps của các đoạn (về 1/1000000) → xfade từ chối
  // vì 2 đầu vào lệch timebase. fps sau concat khôi phục CFR 1/fps.
  const cfr = opts.lbl("srcfr");
  lines.push(`[${out}]fps=${opts.fps}[${cfr}]`);
  if (post) {
    const postLab = opts.lbl("srpost");
    lines.push(`[${cfr}]${post}[${postLab}]`);
    return { lines, label: `[${postLab}]` };
  }
  return { lines, label: `[${cfr}]` };
}

/**
 * Dựng chain audio ramp: mỗi đoạn atrim+atempo rồi concat thành 1 stream.
 * Trả về { lines, label } (label là stream sau concat, CHƯA qua
 * resample/aformat/effects/volume — caller nối tiếp như chain thường).
 */
function buildSpeedRampAudio(streamRef, clip, opts) {
  const segs = planSpeedSegments(clip.speedKeyframes, clip.duration);
  const lines = [];
  const labels = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const lab = opts.lbl("sa");
    const sStart = clip.in + s.srcStart;
    const sEnd = sStart + s.srcDur;
    const tempo = atempoFactors(s.speed).map((f) => `atempo=${ffNum(f)}`).join(",");
    lines.push(
      `${streamRef}atrim=start=${ffNum(sStart)}:end=${ffNum(sEnd)},` +
        `asetpts=PTS-STARTPTS${tempo ? `,${tempo}` : ""}[${lab}]`
    );
    labels.push(`[${lab}]`);
  }
  if (segs.length === 1) {
    // Chỉ 1 đoạn: không cần concat, label đoạn chính là output.
    return { lines, label: labels[0] };
  }
  const out = opts.lbl("saout");
  lines.push(`${labels.join("")}concat=n=${segs.length}:v=0:a=1[${out}]`);
  return { lines, label: `[${out}]` };
}

module.exports = {
  SPEED_MIN,
  SPEED_MAX,
  normalizeSpeedKeyframes,
  cubicBezierY,
  applySpeedEasing,
  speedAt,
  integrateSpeed,
  sourcePosAt,
  sourceConsumed,
  planSpeedSegments,
  buildSpeedRampVideo,
  buildSpeedRampAudio,
};

// Tự test nhanh khi chạy trực tiếp: node src/speedramp.js
if (require.main === module) {
  const curve = { keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ] };
  console.log("speedAt(2) =", speedAt(curve, 2), "(muốn 1.5)");
  console.log("consumed(4) =", sourceConsumed(curve, 4), "(muốn 6)");
  const segs = planSpeedSegments(curve, 4);
  console.log(`segments: ${segs.length}, sum outDur = ${segs.reduce((a, s) => a + s.outDur, 0)}`);
  console.log("sum srcDur =", segs.reduce((a, s) => a + s.srcDur, 0), "(≈ 6, sai số do tốc độ giữa đoạn)");
}
