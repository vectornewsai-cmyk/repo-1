/**
 * keyframeNormalizeRound50F1.test.ts — Đợt 50 luồng F1: render mirror hở với
 * keyframe null + guard panel (nợ đợt 49 E4 §7.4 + §7.5).
 *
 * Nợ E4 §7.5: KeyframePanel/KeyframeGraph gọi `interpolateKeyframes` trực
 * tiếp ở vài chỗ không guard độ dài. Kiểm chứng trên đĩa (06/11/2026):
 * 2 chỗ E4 nêu ĐÃ có guard — panel dòng ~213-220 (`if (kfs.length > 0)` +
 * try/catch quanh liveValue, gọi ở dòng 216) và dòng ~324-335 (map kf-live
 * bọc try/catch từng prop); KeyframeGraph dòng ~76-97 (`kfs.length > 0` +
 * try/catch từng điểm mẫu). Lỗ THẬT còn lại nằm ở dữ liệu `kfs` mà panel
 * dùng khắp nơi: `normalizeKeyframes` giữ nguyên `[null]` (sort không lọc)
 * nên `kfs.length` = 1 (guard length không cứu), live value được try/catch
 * cứu thành null, NHƯNG marker trên lane (`k.t`/`k.v` ở map ~dòng 260) và
 * `selKf.t`/`selKf.v` ném TypeError NGAY KHI RENDER — panel crash qua
 * đường sửa tay in-memory (devtools/store trực tiếp — MCP load/save đều
 * validate nên không đưa null vào được, xem LIMITS).
 * Luồng này vá ở tầng chung: `normalizeKeyframes` (cả bản TS này lẫn
 * mirror `server/render/src/keyframes.js`) lọc entry lỗi TRƯỚC khi sort —
 * sau đó `kfs` của panel không còn null nên cả marker map (`k.t`/`k.v`)
 * lẫn live value đều an toàn.
 *
 * Test này khóa (qua code thật, không mock kết quả):
 *  - normalizeKeyframes([null]) → [] (không ném) thay vì giữ [null];
 *  - entry lỗi (null / không phải object / t hoặc v không hữu hạn) bị
 *    loại, entry hợp lệ giữ nguyên thứ tự/ngữ nghĩa (trùng t thì sau thắng);
 *  - interpolateKeyframes([null]) ném lỗi rõ "mảng keyframes rỗng" thay
 *    vì TypeError đọc thuộc tính của null;
 *  - mô phỏng đúng đường derive của panel (normalize → guard length →
 *    interpolate trong try/catch): [null] → live null, không ném;
 *    [null, hợp lệ] → live = giá trị nội suy trên entry hợp lệ;
 *  - contract cũ giữ nguyên: easing lạ vẫn ném (applyEasing), mảng rỗng
 *    vẫn ném, project lành không đổi.
 *
 * Chạy (từ gốc repo): node --experimental-strip-types apps/web/src/lib/keyframeNormalizeRound50F1.test.ts
 * Thêm file này vào exclude của apps/web/tsconfig.json theo quy ước test.
 */
import assert from "node:assert/strict";
import { interpolateKeyframes, normalizeKeyframes } from "@repo-1/video-spec";
import type { Keyframe } from "@repo-1/video-spec";

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

/**
 * Mô phỏng đúng đường derive giá trị live của KeyframePanel.tsx:
 *   const kfs = normalizeKeyframes(anims[activeProp]?.keyframes ?? []);
 *   let liveValue = null;
 *   if (kfs.length > 0) { try { liveValue = interpolateKeyframes(kfs, t); } catch { liveValue = null; } }
 */
function panelLiveValue(rawKfs: unknown, t: number): number | null {
  const kfs = normalizeKeyframes((rawKfs ?? []) as Keyframe[]);
  if (kfs.length === 0) return null;
  try {
    return interpolateKeyframes(kfs, t);
  } catch {
    return null;
  }
}

test("normalizeKeyframes([null]) → [] (không ném)", () => {
  assert.deepEqual(normalizeKeyframes([null as unknown as Keyframe]), []);
});

test("normalizeKeyframes lọc null/NaN/Infinity/chuỗi, giữ entry hợp lệ + sort", () => {
  assert.deepEqual(
    normalizeKeyframes([
      null as unknown as Keyframe,
      { t: 2, v: 10, easing: "linear" },
      { t: 0, v: 0, easing: "linear" },
      { t: NaN, v: 1, easing: "linear" },
      { t: 1, v: Infinity, easing: "linear" },
      "không phải object" as unknown as Keyframe,
      { t: 1, v: 5, easing: "linear" },
    ]),
    [
      { t: 0, v: 0, easing: "linear" },
      { t: 1, v: 5, easing: "linear" },
      { t: 2, v: 10, easing: "linear" },
    ],
  );
});

test("normalizeKeyframes giữ ngữ nghĩa cũ: trùng t thì sau thắng", () => {
  assert.deepEqual(
    normalizeKeyframes([
      { t: 0, v: 0, easing: "linear" },
      { t: 0, v: 4, easing: "linear" },
    ]),
    [{ t: 0, v: 4, easing: "linear" }],
  );
});

test("interpolateKeyframes([null]) ném lỗi rõ 'rỗng', không TypeError null", () => {
  assert.throws(
    () => interpolateKeyframes([null as unknown as Keyframe], 0),
    (e: unknown) =>
      e instanceof Error &&
      /mảng keyframes rỗng/.test(e.message) &&
      !/Cannot read properties of null/.test(e.message),
  );
});

test("interpolateKeyframes([null, hợp lệ...]) nội suy trên entry hợp lệ", () => {
  assert.equal(
    interpolateKeyframes(
      [
        null as unknown as Keyframe,
        { t: 0, v: 0, easing: "linear" },
        { t: 2, v: 10, easing: "linear" },
      ],
      1,
    ),
    5,
  );
});

test("panel: animations.x = [null] → live null, không ném khi render", () => {
  assert.equal(panelLiveValue([null], 1), null);
});

test("panel: animations.x = [null, hợp lệ...] → live = giá trị nội suy", () => {
  assert.equal(
    panelLiveValue(
      [
        null,
        { t: 0, v: 0, easing: "linear" },
        { t: 2, v: 10, easing: "linear" },
      ],
      1,
    ),
    5,
  );
});

test("panel: animations.x = [] → live null (guard length > 0)", () => {
  assert.equal(panelLiveValue([], 1), null);
});

test("đợt 52 I7: easing lạ ở tầng TS NÉM như bản JS/render (thống nhất mirror)", () => {
  // Trước đây applyEasing bản TS không có default nên easing lạ trả
  // undefined → NaN (quirk F1 §7.6, giữ nguyên có chủ ý ở H5 §4). Đợt 52
  // I7 đổi TS sang ném cùng message với bản JS/render ("easing không hỗ
  // trợ: bounce"), kèm guard ở mọi caller preview (memoInterpolateKeyframes,
  // computeClipGain, addKeyframeAt) nên NaN lặng không còn, tick preview
  // vẫn sống nhờ fallback linear ở guard.
  assert.throws(
    () =>
      interpolateKeyframes(
        [
          { t: 0, v: 0, easing: "bounce" as unknown as Keyframe["easing"] },
          { t: 2, v: 10, easing: "linear" },
        ],
        1,
      ),
    /easing không hỗ trợ: bounce/,
  );
});

test("contract cũ: mảng rỗng vẫn ném 'rỗng'", () => {
  assert.throws(() => interpolateKeyframes([], 0), /mảng keyframes rỗng/);
});

test("project lành: normalize không đổi gì (deep-equal)", () => {
  const kfs: Keyframe[] = [
    { t: 0, v: 0, easing: "linear" },
    { t: 2, v: 10, easing: "ease-in" },
  ];
  assert.deepEqual(normalizeKeyframes(kfs), kfs);
});

console.log(`\nkeyframeNormalizeRound50F1: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(" | ")}`);
  process.exitCode = 1;
}
