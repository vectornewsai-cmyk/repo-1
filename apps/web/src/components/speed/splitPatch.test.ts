/**
 * splitPatch.test.ts — Test thuần Phase 9 đợt 15 (luồng T4):
 * split curve + transition (mức helper) và ngữ nghĩa cắt curve của patchClip.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, từ gốc repo):
 *   node apps/web/src/components/speed/splitPatch.test.ts
 *
 * PHẠM VI TRUNG THỰC — đọc kỹ trước khi trích số:
 * - File này test 2 thứ chạy được dưới Node trần: (1) helper thuần
 *   `clampSplitOuterTransitions` mà store.ts dùng thật cho cả splitAtPlayhead
 *   và splitClipAtTimes (không bản mirror — cùng một hàm); (2) hàm
 *   `sliceSpeedKeyframes` với đúng ngữ nghĩa patchClip dùng khi thu ngắn
 *   duration (cắt về [0, newDur), chèn điểm biên).
 * - Hành vi END-TO-END qua store thật (splitAtPlayhead đặt transition nào ở
 *   đâu, patchClip cắt curve ra sao, validator có pass không) nằm ở file
 *   `splitPatch.store.test.ts` (chạy qua esbuild bundle vì store.ts không
 *   import được dưới Node trần — xem header file đó). Đừng trích số từ file
 *   này như bằng chứng cho hành vi của store.
 *
 * BỐI CẢNH: đợt 14 R5 đã tách curve theo ramp nhưng chưa có test riêng cho
 * tổ hợp curve + transition, và patchClip đổi duration trực tiếp thì giữ
 * nguyên curve gây lệch (nợ đợt 13 C5). Đợt này đóng cả hai ở mức helper +
 * store (xem docs/PHASE9_ROUND15_T4_SPLIT_PATCH_LIMITS.md).
 */

import {
  sliceSpeedKeyframes,
  speedAt,
  type SpeedKeyframe,
} from "@repo-1/video-spec";
import {
  sliceSpeedKeyframes as sliceSpeedKeyframesJs,
} from "../../../../../packages/video-spec/src/speedcurve.js";
import {
  clampSplitOuterTransitions,
  type SplitClipLike,
} from "../../lib/splitTransitions.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}

function approx(a: number, b: number, tol: number, what = ""): void {
  if (!(Math.abs(a - b) <= tol))
    throw new Error(`${what} nhận ${a}, muốn ${b} (±${tol})`);
}

function clip(
  over: Partial<SplitClipLike> & { id: string; start: number; duration: number },
): SplitClipLike {
  return { ...over };
}

const fade = (d: number) => ({ type: "fade", duration: d });

// ===========================================================================
// (1) clampSplitOuterTransitions — helper store dùng thật
// ===========================================================================
console.log("== (1) clampSplitOuterTransitions ==");

test("nửa đủ dài: không đổi gì (transition giữ nguyên duration + type)", () => {
  const clips = [
    clip({ id: "prev", start: 0, duration: 4, transitionOut: fade(0.5) }),
    clip({ id: "left", start: 4, duration: 2, transitionIn: fade(0.5) }),
    clip({ id: "right", start: 6, duration: 2, transitionOut: fade(0.5) }),
    clip({ id: "next", start: 8, duration: 4, transitionIn: fade(0.5) }),
  ];
  const out = clampSplitOuterTransitions(clips, "left", "right");
  eq(out[1].transitionIn, fade(0.5), "left.transitionIn");
  eq(out[2].transitionOut, fade(0.5), "right.transitionOut");
  eq(out[0].transitionOut, fade(0.5), "prev.transitionOut");
  eq(out[3].transitionIn, fade(0.5), "next.transitionIn");
});

test("nửa trái ngắn hơn transitionIn: kẹp CẢ HAI đầu cặp về leftDur", () => {
  const clips = [
    clip({ id: "prev", start: 0, duration: 4, transitionOut: fade(0.5) }),
    clip({ id: "left", start: 4, duration: 0.3, transitionIn: fade(0.5) }),
    clip({ id: "right", start: 4.3, duration: 3.7 }),
  ];
  const out = clampSplitOuterTransitions(clips, "left", "right");
  approx(out[1].transitionIn!.duration, 0.3, 1e-9, "left.transitionIn");
  approx(out[0].transitionOut!.duration, 0.3, 1e-9, "prev.transitionOut");
  eq(out[1].transitionIn!.type, "fade", "giữ type");
});

test("nửa phải ngắn hơn transitionOut: kẹp CẢ HAI đầu cặp về rightDur", () => {
  const clips = [
    clip({ id: "left", start: 0, duration: 3.6 }),
    clip({ id: "right", start: 3.6, duration: 0.4, transitionOut: fade(0.5) }),
    clip({ id: "next", start: 4, duration: 4, transitionIn: fade(0.5) }),
  ];
  const out = clampSplitOuterTransitions(clips, "left", "right");
  approx(out[1].transitionOut!.duration, 0.4, 1e-9, "right.transitionOut");
  approx(out[2].transitionIn!.duration, 0.4, 1e-9, "next.transitionIn");
});

test("nửa dài đúng bằng transition (T == duration): không kẹp (validator cho phép bằng)", () => {
  const clips = [
    clip({ id: "prev", start: 0, duration: 4, transitionOut: fade(0.5) }),
    clip({ id: "left", start: 4, duration: 0.5, transitionIn: fade(0.5) }),
    clip({ id: "right", start: 4.5, duration: 3.5 }),
  ];
  const out = clampSplitOuterTransitions(clips, "left", "right");
  eq(out[1].transitionIn, fade(0.5), "left.transitionIn giữ nguyên");
  eq(out[0].transitionOut, fade(0.5), "prev.transitionOut giữ nguyên");
});

test("cặp một phía (chỉ nửa trái khai): vẫn kẹp phía đã khai", () => {
  const clips = [
    clip({ id: "prev", start: 0, duration: 4 }),
    clip({ id: "left", start: 4, duration: 0.3, transitionIn: fade(0.5) }),
    clip({ id: "right", start: 4.3, duration: 3.7 }),
  ];
  const out = clampSplitOuterTransitions(clips, "left", "right");
  approx(out[1].transitionIn!.duration, 0.3, 1e-9, "left.transitionIn");
  eq(out[0].transitionOut, undefined, "prev không tự mọc transition");
});

test("clip tách là clip đầu track: vẫn kẹp transitionIn của chính nó", () => {
  const clips = [
    clip({ id: "left", start: 0, duration: 0.3, transitionIn: fade(0.5) }),
    clip({ id: "right", start: 0.3, duration: 3.7 }),
  ];
  const out = clampSplitOuterTransitions(clips, "left", "right");
  approx(out[0].transitionIn!.duration, 0.3, 1e-9, "left.transitionIn");
});

test("biên trong + cặp không kề (gap): không đụng tới", () => {
  const clips = [
    clip({ id: "prev", start: 0, duration: 2, transitionOut: fade(0.5) }),
    // Gap 2 -> 4: prev không kề left nên không phải cặp của lần tách này.
    clip({
      id: "left", start: 4, duration: 2,
      transitionIn: fade(0.5), transitionOut: fade(0.2),
    }),
    clip({ id: "right", start: 6, duration: 2, transitionIn: fade(0.2) }),
  ];
  const out = clampSplitOuterTransitions(clips, "left", "right");
  eq(out[0].transitionOut, fade(0.5), "prev ngoài cặp, giữ nguyên");
  eq(out[1].transitionOut, fade(0.2), "biên trong left, giữ nguyên");
  eq(out[2].transitionIn, fade(0.2), "biên trong right, giữ nguyên");
});

test("không mutate input; clip không đổi giữ nguyên tham chiếu", () => {
  const clips = [
    clip({ id: "prev", start: 0, duration: 4, transitionOut: fade(0.5) }),
    clip({ id: "left", start: 4, duration: 0.3, transitionIn: fade(0.5) }),
    clip({ id: "right", start: 4.3, duration: 3.7 }),
  ];
  const before = JSON.stringify(clips);
  const out = clampSplitOuterTransitions(clips, "left", "right");
  eq(JSON.stringify(clips), before, "input không đổi");
  if (out[2] !== clips[2]) throw new Error("clip không đổi phải giữ tham chiếu");
  if (out[0] === clips[0]) throw new Error("clip bị kẹp phải là bản clone");
});

test("type none không bị kẹp; id lạ trả về mảng mới không đổi giá trị", () => {
  const clips = [
    clip({ id: "left", start: 0, duration: 0.3, transitionIn: { type: "none", duration: 0 } }),
    clip({ id: "right", start: 0.3, duration: 3.7 }),
  ];
  const out = clampSplitOuterTransitions(clips, "left", "right");
  eq(out[0].transitionIn, { type: "none", duration: 0 }, "none giữ nguyên");
  const out2 = clampSplitOuterTransitions(clips, "nope", "right");
  eq(out2, clips, "id lạ: giá trị không đổi");
});

// ===========================================================================
// (2) sliceSpeedKeyframes với ngữ nghĩa patchClip dùng khi thu ngắn duration
// ===========================================================================
console.log("== (2) slice = ngữ nghĩa patchClip thu ngắn duration ==");

const lin: SpeedKeyframe[] = [
  { t: 0, v: 1, easing: "linear" },
  { t: 4, v: 2, easing: "linear" },
];

test("thu ngắn linear 4s -> 2.5s: điểm biên v = speedAt gốc, đánh giá khớp", () => {
  const s = sliceSpeedKeyframes(lin, 0, 2.5);
  eq(s.keyframes.length, 2, "số điểm");
  approx(s.keyframes[1].t, 2.5, 1e-9, "điểm biên t");
  approx(s.keyframes[1].v, 1.625, 1e-9, "điểm biên v = 1 + 2.5/4");
  for (const t of [0, 0.5, 1, 2, 2.5]) {
    approx(
      speedAt({ keyframes: s.keyframes }, t),
      speedAt({ keyframes: lin }, t),
      1e-9,
      `speedAt(${t})`,
    );
  }
  approx(s.visibleDuration, 2.5, 1e-9, "visibleDuration");
});

test("thu ngắn làm rớt điểm vượt biên, điểm trong giữ nguyên", () => {
  const multi: SpeedKeyframe[] = [
    { t: 0, v: 1, easing: "linear" },
    { t: 1, v: 1.5, easing: "linear" },
    { t: 2, v: 2, easing: "linear" },
    { t: 4, v: 3, easing: "linear" },
  ];
  const s = sliceSpeedKeyframes(multi, 0, 2.5);
  eq(
    s.keyframes.map((k) => k.t),
    [0, 1, 2, 2.5],
    "các t còn lại",
  );
  approx(s.keyframes[3].v, 2.25, 1e-9, "điểm biên nội suy 2 -> 3");
  if (s.keyframes.some((k) => k.t > 2.5 + 1e-9))
    throw new Error("còn keyframe vượt duration mới (validator sẽ chặn)");
});

test("thu ngắn bezier: đánh giá khớp trong ngưỡng engine 1e-4 (de Casteljau)", () => {
  const bz: SpeedKeyframe[] = [
    { t: 0, v: 1, easing: "bezier", bezier: [0.25, 2, 0.75, -1] },
    { t: 4, v: 2, easing: "linear" },
  ];
  const s = sliceSpeedKeyframes(bz, 0, 2);
  for (const t of [0, 0.5, 1, 1.5, 2]) {
    approx(
      speedAt({ keyframes: s.keyframes }, t),
      speedAt({ keyframes: bz }, t),
      1e-4,
      `bezier speedAt(${t})`,
    );
  }
});

test("tính chất patchClip dựa vào khi kéo dài: ngoài keyframe cuối tốc độ clamp", () => {
  // patchClip kéo dài thì GIỮ NGUYÊN curve; tính chất này làm việc đó đúng:
  // đánh giá curve cũ trên duration mới vẫn bằng giá trị biên, không cần
  // thêm điểm (và mọi keyframe cũ đều nằm trong [0, newDur]).
  for (const t of [4, 5, 6]) {
    approx(speedAt({ keyframes: lin }, t), 2, 1e-12, `clamp tại ${t}`);
  }
});

test("parity TS (.ts qua @repo-1/video-spec) vs mirror .js cho slice", () => {
  for (const [kfs, to] of [
    [lin, 2.5],
    [
      [
        { t: 0, v: 1, easing: "bezier", bezier: [0.25, 2, 0.75, -1] },
        { t: 4, v: 2, easing: "linear" },
      ] as SpeedKeyframe[],
      2,
    ],
  ] as Array<[SpeedKeyframe[], number]>) {
    const a = sliceSpeedKeyframes(kfs, 0, to);
    const b = sliceSpeedKeyframesJs(kfs, 0, to);
    eq(a.keyframes.length, b.keyframes.length, "số điểm parity");
    for (let i = 0; i < a.keyframes.length; i++) {
      approx(a.keyframes[i].t, b.keyframes[i].t, 1e-9, "t parity");
      approx(a.keyframes[i].v, b.keyframes[i].v, 1e-9, "v parity");
    }
  }
});

console.log(`\n${pass} pass, ${fail} fail${fail ? ` (${failedNames.join(", ")})` : ""}`);
if (fail > 0) process.exitCode = 1;
