/**
 * speedKeyframesRound51H5.test.ts — Đợt 51 luồng H5:
 * normalizeSpeedKeyframes null ở tầng TS + trim (nợ F1 §7.2).
 *
 * Trước luồng này cả 3 mirror `normalizeSpeedKeyframes` (speedcurve.ts,
 * speedcurve.js viết tay, server/render/src/speedramp.js) đều sort trực
 * tiếp: `[null]` giữ nguyên, `[null, hợp lệ]` ném TypeError ở comparator,
 * `speedAt`/`integrateSpeed` ném TypeError đọc `v` của null. Luồng này
 * lọc entry lỗi (null / không phải object / t hoặc v không hữu hạn)
 * TRƯỚC khi sort ở cả 3 mirror; hết entry hợp lệ thì `speedAt` /
 * `integrateSpeed` ném lỗi rõ "mảng keyframes rỗng" như contract cũ.
 * `trimSpeedKeyframes` cũng bỏ entry lỗi thay vì ném ở `k.t`.
 *
 * Test này khóa tầng TS (import "@repo-1/video-spec/speedcurve" → .ts qua
 * exports map); tầng render khóa ở server/render/test_round51_h5_speed_keyframe_null.js;
 * cặp mirror TS↔.js↔render khóa bằng
 * packages/video-spec/scripts/check-video-spec-mirror.mjs.
 *
 * Chạy (từ gốc repo): node --experimental-strip-types apps/web/src/lib/speedKeyframesRound51H5.test.ts
 * Thêm file này vào exclude của apps/web/tsconfig.json theo quy ước test.
 */
import assert from "node:assert/strict";
import {
  integrateSpeed,
  normalizeSpeedKeyframes,
  sliceSpeedKeyframes,
  speedAt,
  splitSpeedKeyframes,
  trimSpeedKeyframes,
} from "@repo-1/video-spec/speedcurve";
import type { SpeedKeyframe } from "@repo-1/video-spec/speedcurve";

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

const KF = (t: number, v: number, easing: SpeedKeyframe["easing"] = "linear"): SpeedKeyframe => ({
  t,
  v,
  easing,
});

function assertThrowsClear(fn: () => unknown, re: RegExp, msg: string): void {
  try {
    fn();
  } catch (e) {
    assert.match((e as Error).message, re, msg);
    return;
  }
  assert.fail(`${msg} — không ném như kỳ vọng`);
}

test("normalizeSpeedKeyframes([null]) → [] (không ném)", () => {
  assert.deepEqual(normalizeSpeedKeyframes([null as unknown as SpeedKeyframe]), []);
});

test("[null, hợp lệ] → chỉ entry hợp lệ, đã sort", () => {
  assert.deepEqual(
    normalizeSpeedKeyframes([null as unknown as SpeedKeyframe, KF(2, 2), KF(0, 1)]),
    [KF(0, 1), KF(2, 2)],
  );
});

test("entry lỗi đủ loại (undefined/string/number/v=NaN/t=Infinity) đều bị loại", () => {
  const dirty = [
    undefined,
    "x",
    42,
    { t: 1, v: NaN },
    { t: Infinity, v: 1 },
    KF(0, 1),
  ] as unknown as SpeedKeyframe[];
  assert.deepEqual(normalizeSpeedKeyframes(dirty), [KF(0, 1)]);
});

test("input không phải mảng (null) → []", () => {
  assert.deepEqual(normalizeSpeedKeyframes(null as unknown as SpeedKeyframe[]), []);
});

test("trùng t → keyframe đứng sau thắng (ngữ nghĩa cũ giữ nguyên)", () => {
  assert.deepEqual(normalizeSpeedKeyframes([KF(0, 1), KF(0, 2)]), [KF(0, 2)]);
});

test("không mutate mảng gốc", () => {
  const orig = [KF(2, 2), KF(0, 1)];
  const out = normalizeSpeedKeyframes(orig);
  assert.deepEqual(orig, [KF(2, 2), KF(0, 1)]);
  assert.notEqual(out, orig);
});

test("speedAt [null, hợp lệ] → nội suy trên entry hợp lệ", () => {
  assert.equal(
    speedAt({ keyframes: [null as unknown as SpeedKeyframe, KF(0, 1), KF(2, 3)] }, 1),
    2,
  );
});

test("speedAt [null] → ném lỗi rõ 'mảng keyframes rỗng'", () => {
  assertThrowsClear(
    () => speedAt({ keyframes: [null as unknown as SpeedKeyframe] }, 1),
    /mảng keyframes rỗng/,
    "speedAt [null]",
  );
});

test("integrateSpeed [null, hợp lệ] → tích phân trên entry hợp lệ", () => {
  assert.equal(
    integrateSpeed({ keyframes: [null as unknown as SpeedKeyframe, KF(0, 1), KF(2, 3)] }, 0, 2),
    4,
  );
});

test("integrateSpeed [null] → ném lỗi rõ 'mảng keyframes rỗng'", () => {
  assertThrowsClear(
    () => integrateSpeed({ keyframes: [null as unknown as SpeedKeyframe] }, 0, 1),
    /mảng keyframes rỗng/,
    "integrateSpeed [null]",
  );
});

test("trimSpeedKeyframes [null] → dropped 1, keyframes còn lại nguyên", () => {
  const r = trimSpeedKeyframes(
    [null as unknown as SpeedKeyframe, KF(0, 1), KF(2, 2)],
    0,
    2,
  );
  assert.deepEqual(r.keyframes, [KF(0, 1), KF(2, 2)]);
  assert.equal(r.dropped, 1);
  assert.equal(r.changed, true);
});

test("slice/split với [null] → không ném, dùng entry hợp lệ", () => {
  const dirty = [null as unknown as SpeedKeyframe, KF(0, 1), KF(2, 3)];
  const sliced = sliceSpeedKeyframes(dirty, 0, 2);
  assert.deepEqual(sliced.keyframes, [KF(0, 1), KF(2, 3)]);
  const split = splitSpeedKeyframes(dirty, 1, 2);
  assert.equal(split.left.length, 2);
  assert.equal(split.right.length, 2);
});

test("đợt 52 I7: easing lạ ở tầng TS NÉM như bản JS/render (thống nhất mirror)", () => {
  // Trước đây applySpeedEasing bản TS không có default nên easing lạ trả
  // undefined → NaN; bản JS ném. Giữ nguyên có chủ ý ở LIMITS đợt 51 H5
  // §4. Đợt 52 I7 đổi TS sang ném cùng message với hai bản JS, kèm guard
  // ở mọi caller preview (rampSpeedAt/rampSourceTimeAt đã có sẵn từ trước,
  // memoInterpolateKeyframes + computeClipGain mới thêm) nên tick preview
  // vẫn sống nhờ fallback.
  assert.throws(
    () =>
      speedAt(
        { keyframes: [KF(0, 1, "bounce" as SpeedKeyframe["easing"]), KF(2, 3)] },
        1,
      ),
    /easing không hỗ trợ: bounce/,
  );
});

console.log(`\nspeedKeyframesRound51H5: ${pass} pass, ${fail} fail.`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join("; ")}`);
  process.exitCode = 1;
}
