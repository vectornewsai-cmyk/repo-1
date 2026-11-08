/**
 * mirrorUnifyRound52I7.test.ts — Đợt 52 luồng I7: thống nhất mirror
 * keyframe/speed + FADE_CURVES (nợ đợt 51 §4.5, xem
 * docs/PHASE9_ROUND51_LIMITS.md §2.5 và §4.5,
 * docs/PHASE9_ROUND51_H5_KEYFRAME_MIRROR_LIMITS.md §2.5/§4.5).
 *
 * Trước luồng này:
 *  - `applyEasing`/`applySpeedEasing` bản TS trả `undefined` với easing lạ
 *    (→ NaN qua nội suy), trong khi hai bản JS (viết tay + render CJS) ném
 *    "easing không hỗ trợ". Lệch giữ nguyên có chủ ý ở F1/H5 vì chưa có
 *    guard ở caller preview.
 *  - `audio.js` viết tay thiếu `FADE_CURVES` (audio.ts đã có).
 *
 * Luồng này khóa (qua code thật, không mock kết quả):
 *  - Cả 4 bản applyEasing/applySpeedEasing (TS, JS viết tay, render CJS —
 *    render khóa ở test render H5) đều ném cùng message
 *    "easing không hỗ trợ: <easing>" với easing lạ.
 *  - `memoInterpolateKeyframes` (previewEngine — choke point của mọi nội
 *    suy animation trong tick preview) KHÔNG ném với easing lạ mà nội suy
 *    lại như linear (khớp sanitize cổng load), giá trị bằng nội suy linear.
 *  - `computeClipGain` (audioEngine — gọi mỗi frame từ preview.tsx) KHÔNG
 *    ném với volumeKeyframes mang easing lạ, gain bằng giá trị linear.
 *  - `FADE_CURVES` của audio.ts và audio.js khớp nhau
 *    ["linear","ease-in","ease-out","sine"] (tầng A/B của checker khóa
 *    lại; test này khóa thêm phía web).
 *  - Hành vi lành không đổi: easing hợp lệ vẫn cho giá trị cũ.
 *
 * Chạy (từ gốc repo): node --experimental-strip-types apps/web/src/lib/mirrorUnifyRound52I7.test.ts
 * Thêm file này vào exclude của apps/web/tsconfig.json theo quy ước test.
 */
import assert from "node:assert/strict";
import {
  applyEasing,
  interpolateKeyframes,
  FADE_CURVES,
} from "@repo-1/video-spec";
import { applySpeedEasing, speedAt } from "@repo-1/video-spec/speedcurve";
import { FADE_CURVES as FADE_CURVES_TS } from "../../../../packages/video-spec/src/audio.ts";
import type { Keyframe, SpeedKeyframe } from "@repo-1/video-spec";
import { memoInterpolateKeyframes } from "./previewEngine.ts";
import { computeClipGain } from "./audioEngine.ts";

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

const KF = (t: number, v: number, easing: Keyframe["easing"] = "linear"): Keyframe => ({
  t,
  v,
  easing,
});
const SKF = (t: number, v: number, easing: SpeedKeyframe["easing"] = "linear"): SpeedKeyframe => ({
  t,
  v,
  easing,
});

// --- 1. TS ném như JS với easing lạ (thống nhất mirror) ---

test("applyEasing TS ném 'easing không hỗ trợ: bounce'", () => {
  assert.throws(() => applyEasing("bounce" as never, 0.5), /easing không hỗ trợ: bounce/);
});

test("applySpeedEasing TS ném 'easing không hỗ trợ: bounce'", () => {
  assert.throws(() => applySpeedEasing("bounce" as never, 0.5), /easing không hỗ trợ: bounce/);
});

test("interpolateKeyframes TS ném với keyframe easing lạ", () => {
  assert.throws(
    () => interpolateKeyframes([KF(0, 0, "bounce" as never), KF(2, 10)], 1),
    /easing không hỗ trợ: bounce/,
  );
});

test("speedAt TS ném với speed keyframe easing lạ", () => {
  assert.throws(
    () => speedAt({ keyframes: [SKF(0, 1, "bounce" as never), SKF(2, 3)] }, 1),
    /easing không hỗ trợ: bounce/,
  );
});

// --- 2. Easing hợp lệ không đổi ---

test("applyEasing hợp lệ giữ nguyên (linear/ease-in/ease-out)", () => {
  assert.equal(applyEasing("linear", 0.5), 0.5);
  assert.equal(applyEasing("ease-in", 0.5), 0.25);
  assert.equal(applyEasing("ease-out", 0.5), 0.75);
});

test("applySpeedEasing bezier giữ nguyên", () => {
  assert.equal(applySpeedEasing("bezier", 0.5, [0.25, 0.1, 0.25, 1]).toFixed(6), "0.802403");
});

test("interpolateKeyframes/speedAt hợp lệ giữ nguyên", () => {
  assert.equal(interpolateKeyframes([KF(0, 0), KF(2, 10)], 1), 5);
  assert.equal(speedAt({ keyframes: [SKF(0, 1), SKF(2, 3)] }, 1), 2);
});

// --- 3. Guard preview: không ném, fallback linear ---

test("memoInterpolateKeyframes: easing lạ → giá trị linear, không ném", () => {
  // linear giữa 0→10 tại t=1 là 5; guard nội suy lại với easing lạ = linear.
  const v = memoInterpolateKeyframes([KF(0, 0, "bounce" as never), KF(2, 10)], 1);
  assert.equal(v, 5);
});

test("memoInterpolateKeyframes: easing hợp lệ vẫn đúng", () => {
  assert.equal(memoInterpolateKeyframes([KF(0, 0), KF(2, 10)], 1), 5);
  assert.equal(memoInterpolateKeyframes([KF(0, 0, "ease-in"), KF(2, 10)], 1), 2.5);
});

test("computeClipGain: volumeKeyframes easing lạ → gain linear, không ném", () => {
  // volumeKeyframes 0→2 trên duration 4; tại elapsed 2 linear cho v=1 → gain 1.
  const clip = {
    duration: 4,
    volume: 0.5,
    volumeKeyframes: {
      keyframes: [KF(0, 0, "bounce" as never), KF(4, 2)],
    },
  } as unknown as Parameters<typeof computeClipGain>[0];
  assert.equal(computeClipGain(clip, 2, false, 1), 1);
});

test("computeClipGain: volumeKeyframes hợp lệ vẫn đúng", () => {
  const clip = {
    duration: 4,
    volume: 0.5,
    volumeKeyframes: { keyframes: [KF(0, 0), KF(4, 2)] },
  } as unknown as Parameters<typeof computeClipGain>[0];
  assert.equal(computeClipGain(clip, 2, false, 1), 1);
});

// --- 4. FADE_CURVES TS ↔ JS khớp ---

test("FADE_CURVES: audio.ts và audio.js khớp nhau", () => {
  assert.deepEqual([...FADE_CURVES], ["linear", "ease-in", "ease-out", "sine"]);
  assert.deepEqual([...FADE_CURVES_TS], [...FADE_CURVES]);
});

console.log(`\nmirrorUnifyRound52I7: ${pass} pass, ${fail} fail.`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join("; ")}`);
  process.exitCode = 1;
}
