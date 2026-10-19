/**
 * speed.js — Filter FFmpeg cho SPEED CONTROL + REVERSE.
 *
 * Module độc lập (zero dependency), dùng kèm render.js:
 * sau khi render.js trim clip về [in, out) + setpts=PTS-STARTPTS,
 * chèn chuỗi filter do buildSpeedFilter() trả về vào chain.
 *
 * Ví dụ tích hợp (video):
 *   [0:v]trim=start=2:end=6,setpts=PTS-STARTPTS,reverse,setpts=PTS/0.5,scale=...,fps=30[v]
 * Ví dụ tích hợp (audio):
 *   [1:a]atrim=start=2:end=6,asetpts=PTS-STARTPTS,areverse,atempo=0.5,atempo=0.5,aresample=48000[a]
 *
 * ĐÃ KIỂM CHỨNG bằng video thật: chạy `node ../speed-demo.js`
 * (5 case: 0.5x, 2x, 4x, 0.25x, reverse — duration đo bằng ffprobe khớp kỳ vọng).
 */
"use strict";

const SPEED_MIN = 0.25;
const SPEED_MAX = 4;

/** Format số cho filter FFmpeg (giống num() trong render.js). */
function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

/**
 * Tách speed thành các factor, mỗi factor trong [0.5, 2.0]
 * (giới hạn của MỘT lần gọi atempo). Ví dụ: 4 → [2, 2]; 0.25 → [0.5, 0.5].
 */
function atempoFactors(speed) {
  if (speed === 1) return [];
  const factors = [];
  let rest = speed;
  while (rest > 2) {
    factors.push(2);
    rest /= 2;
  }
  while (rest < 0.5) {
    factors.push(0.5);
    rest /= 0.5;
  }
  factors.push(Math.round(rest * 1e6) / 1e6);
  return factors;
}

/**
 * Dựng filter chain cho speed + reverse.
 *
 * @param {number} [speed=1]  tốc độ phát, 0.25–4
 * @param {boolean} [reverse=false]  phát ngược đoạn nguồn
 * @returns {{ video: string|null, audio: string|null }}
 *   Chuỗi filter (chưa có label) để chèn vào chain, hoặc null nếu không cần.
 *
 * @throws khi speed ngoài [0.25, 4] hoặc reverse không phải boolean.
 */
function buildSpeedFilter(speed = 1, reverse = false) {
  if (typeof speed !== "number" || !Number.isFinite(speed)) {
    throw new Error(`speed phải là số, nhận được: ${speed}`);
  }
  if (speed < SPEED_MIN || speed > SPEED_MAX) {
    throw new Error(`speed phải trong khoảng ${SPEED_MIN}–${SPEED_MAX}, nhận được: ${speed}`);
  }
  if (typeof reverse !== "boolean") {
    throw new Error(`reverse phải là boolean, nhận được: ${reverse}`);
  }

  // VIDEO: reverse trước (đảo frame gốc), rồi setpts đổi tốc độ.
  // setpts=PTS/s: s=2 → PTS/2 (nhanh gấp đôi, duration còn nửa);
  //               s=0.5 → PTS/0.5 (chậm gấp đôi, duration gấp đôi).
  const vParts = [];
  if (reverse) vParts.push("reverse");
  if (speed !== 1) vParts.push(`setpts=PTS/${num(speed)}`);

  // AUDIO: areverse trước, rồi chain atempo (giữ nguyên cao độ — phase vocoder).
  const aParts = [];
  if (reverse) aParts.push("areverse");
  for (const f of atempoFactors(speed)) aParts.push(`atempo=${num(f)}`);

  return {
    video: vParts.length > 0 ? vParts.join(",") : null,
    audio: aParts.length > 0 ? aParts.join(",") : null,
  };
}

/**
 * Thời lượng hiệu dụng sau khi áp speed: (out - in) / speed.
 * Dùng để đối chiếu với ffprobe khi kiểm chứng.
 */
function effectiveDuration(srcIn, srcOut, speed = 1) {
  if (!(srcOut > srcIn)) throw new Error(`cần out > in, nhận được in=${srcIn}, out=${srcOut}`);
  return (srcOut - srcIn) / speed;
}

// ---------------------------------------------------------------------------
// R1-013: Unified time mapping — mirror của speed.ts (TypeScript).
// Dùng chung logic sourceTimeAt cho render worker.
// ---------------------------------------------------------------------------

/**
 * Ánh xạ thời điểm timeline → thời điểm nguồn.
 * Mirror của sourceTimeAt() trong packages/video-spec/src/speed.ts.
 * @param {object} clip clip có {start, in, out, speed?, reverse?}
 * @param {number} timelineT thời điểm timeline (giây)
 * @returns {number} thời điểm nguồn trong [in, out]
 */
function sourceTimeAt(clip, timelineT) {
  const speed = clip.speed ?? 1;
  const localT = timelineT - clip.start;
  const offset = localT * speed;
  if (clip.reverse) {
    return clip.out - offset;
  }
  return clip.in + offset;
}

/** Thời lượng nguồn = out - in. Mirror sourceDurationOf(). */
function sourceDurationOf(clip) {
  return clip.out - clip.in;
}

/** Thời lượng timeline = (out - in) / speed. Mirror timelineDurationOf(). */
function timelineDurationOf(clip) {
  return (clip.out - clip.in) / (clip.speed ?? 1);
}

/**
 * Điểm cắt nguồn khi split tại thời điểm timeline t.
 * Mirror splitSourceAt() trong speed.ts.
 */
function splitSourceAt(clip, timelineT) {
  const cut = sourceTimeAt(clip, timelineT);
  const clamped = Math.min(clip.out, Math.max(clip.in, cut));
  return { leftIn: clip.in, leftOut: clamped, rightIn: clamped, rightOut: clip.out };
}

/**
 * Trim mép trái tới newStart. Mirror trimLeftTo() trong speed.ts.
 * reverse=false: dịch in; reverse=true: dịch out.
 */
function trimLeftTo(clip, newStart) {
  const speed = clip.speed ?? 1;
  const shift = newStart - clip.start;
  const newDuration = clip.duration - shift;
  if (clip.reverse) {
    return { start: newStart, duration: newDuration, in: clip.in, out: clip.out - shift * speed };
  }
  return { start: newStart, duration: newDuration, in: sourceTimeAt(clip, newStart), out: clip.out };
}

/**
 * Trim mép phải tới newDuration. Mirror trimRightTo() trong speed.ts.
 * reverse=false: dịch out; reverse=true: dịch in.
 */
function trimRightTo(clip, newDuration) {
  const newEnd = clip.start + newDuration;
  if (clip.reverse) {
    return { duration: newDuration, in: sourceTimeAt(clip, newEnd), out: clip.out };
  }
  return { duration: newDuration, in: clip.in, out: sourceTimeAt(clip, newEnd) };
}

/** Giới hạn kéo trái (giây timeline). Mirror maxTrimLeft(). */
function maxTrimLeft(clip, mediaDuration = Infinity) {
  const speed = clip.speed ?? 1;
  if (clip.reverse) return Math.max(0, (mediaDuration - clip.out) / speed);
  return Math.max(0, clip.in / speed);
}

/** Duration tối đa khi kéo phải. Mirror maxTrimRightDuration(). */
function maxTrimRightDuration(clip, mediaDuration = Infinity) {
  const speed = clip.speed ?? 1;
  if (clip.reverse) return Math.max(0.2, clip.out / speed);
  return Math.max(0.2, (mediaDuration - clip.in) / speed);
}

module.exports = {
  SPEED_MIN,
  SPEED_MAX,
  buildSpeedFilter,
  atempoFactors,
  effectiveDuration,
  sourceTimeAt,
  sourceDurationOf,
  timelineDurationOf,
  splitSourceAt,
  trimLeftTo,
  trimRightTo,
  maxTrimLeft,
  maxTrimRightDuration,
};

// Tự test nhanh khi chạy trực tiếp: node src/speed.js
if (require.main === module) {
  const cases = [
    [1, false], [0.5, false], [2, false], [4, false], [0.25, false],
    [1.5, false], [1, true], [2, true],
  ];
  for (const [s, r] of cases) {
    console.log(`speed=${s} reverse=${r} →`, JSON.stringify(buildSpeedFilter(s, r)));
  }
  for (const bad of [[0.1, false], [8, false], [1, "yes"], [NaN, false]]) {
    try {
      buildSpeedFilter(bad[0], bad[1]);
      console.log(`⚠️  KHÔNG throw cho input sai: ${JSON.stringify(bad)}`);
      process.exitCode = 1;
    } catch (e) {
      console.log(`OK từ chối ${JSON.stringify(bad)}: ${e.message}`);
    }
  }
}
