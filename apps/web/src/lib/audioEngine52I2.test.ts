/**
 * audioEngine52I2.test.ts — Đợt 52 luồng I2: `[null]` trong audio +
 * badge KeyframePanel (nợ đợt 51 §4.6, xem
 * docs/PHASE9_ROUND51_LIMITS.md §2.6/§4.6 và
 * docs/PHASE9_ROUND51_H6_KEYFRAME_CLICKTEST_LIMITS.md §6.1).
 *
 * Bug 1 (đỏ-trước, chứng minh ở đây): `computeClipGain` trong
 * audioEngine.ts:71-73 guard `kfs.length > 0` rồi gọi thẳng
 * `interpolateKeyframes(kfs, el)`. Một audio clip có
 * `volumeKeyframes: [null]` in-memory (qua patchClip, né cổng load
 * mà E4 đã sanitize) có length 1 → normalize lọc thành [] →
 * interpolateKeyframes ném "mảng keyframes rỗng" ngay đầu tick
 * preview, y hệt bug H6 đã sửa ở previewEngine.ts. Fix: helper
 * `hasUsableVolumeKeyframes` (normalize rồi kiểm tra còn entry) ở
 * call site, contract interpolateKeyframes KHÔNG đổi.
 *
 * Bug 2 (chỉ hiển thị): tab badge KeyframePanel đếm
 * `anims[p]?.keyframes.length` thô → `[null]` hiện 1 trong khi panel
 * count (đã normalize) hiện 0. Fix: badge đếm
 * `normalizeKeyframes(...).length` (khớp panel count); cùng mẫu sửa
 * luôn filter hàng live của prop khác (cũng đếm thô, hiện hàng "—").
 * Badge là logic JSX trong KeyframePanel.tsx (không chạy được dưới
 * node strip-types) nên test ở đây khóa ĐÚNG QUY TẮC ĐẾM mà badge
 * dùng — `normalizeKeyframes(...).length` trên cùng input — cộng
 * click-test headed (xem LIMITS I2 §4) chứng minh trên UI thật.
 *
 * Chạy bằng Node type-stripping (mẫu audioEngine44Z2 / previewEngine51H6):
 *   node --experimental-strip-types apps/web/src/lib/audioEngine52I2.test.ts
 * (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
 */
import assert from "node:assert/strict";
import { computeClipGain, hasUsableVolumeKeyframes } from "./audioEngine.ts";
import { normalizeKeyframes } from "@repo-1/video-spec";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

/** Quy tắc đếm badge KeyframePanel: số keyframe usable sau lọc. */
function badgeCount(keyframes: unknown): number {
  return normalizeKeyframes((keyframes ?? []) as never).length;
}

const base = { duration: 4 };

// --- hasUsableVolumeKeyframes ---
ok("hasUsableVolumeKeyframes([null]) → false", () => {
  assert.equal(
    hasUsableVolumeKeyframes({ keyframes: [null] } as never),
    false,
  );
});
ok("hasUsableVolumeKeyframes([]) → false", () => {
  assert.equal(hasUsableVolumeKeyframes({ keyframes: [] }), false);
});
ok("hasUsableVolumeKeyframes(undefined) → false", () => {
  assert.equal(hasUsableVolumeKeyframes(undefined), false);
});
ok("hasUsableVolumeKeyframes([null, valid]) → true", () => {
  assert.equal(
    hasUsableVolumeKeyframes({
      keyframes: [null, { t: 0, v: 0.5, easing: "linear" }],
    } as never),
    true,
  );
});
ok("hasUsableVolumeKeyframes([valid]) → true", () => {
  assert.equal(
    hasUsableVolumeKeyframes({
      keyframes: [{ t: 0, v: 0.5, easing: "linear" }],
    }),
    true,
  );
});

// --- computeClipGain với volumeKeyframes lỗi ---
ok("TÁI HIỆN + SỬA: volumeKeyframes [null] → không ném, rơi về volume tĩnh", () => {
  const clip = {
    ...base,
    volume: 0.5,
    volumeKeyframes: { keyframes: [null] },
  } as unknown as Parameters<typeof computeClipGain>[0];
  assert.equal(computeClipGain(clip, 2, false, 1), 0.5);
});
ok("volumeKeyframes [null, valid] → nội suy trên entry hợp lệ", () => {
  const clip = {
    ...base,
    volume: 0.9,
    volumeKeyframes: {
      keyframes: [
        null,
        { t: 0, v: 0.2, easing: "linear" },
        { t: 4, v: 0.8, easing: "linear" },
      ],
    },
  } as unknown as Parameters<typeof computeClipGain>[0];
  // t=2 giữa 0.2 và 0.8 → 0.5 (ghi đè volume tĩnh 0.9).
  assert.equal(computeClipGain(clip, 2, false, 1), 0.5);
});
ok("volumeKeyframes [] → volume tĩnh", () => {
  const clip = {
    ...base,
    volume: 0.7,
    volumeKeyframes: { keyframes: [] },
  } as unknown as Parameters<typeof computeClipGain>[0];
  assert.equal(computeClipGain(clip, 1, false, 1), 0.7);
});
ok("không có volumeKeyframes → volume tĩnh (hồi quy)", () => {
  assert.equal(computeClipGain({ ...base, volume: 0.6 }, 1, false, 1), 0.6);
  assert.equal(computeClipGain({ ...base }, 1, false, 1), 1);
});
ok("volumeKeyframes [null] + fadeIn vẫn áp fade lên volume tĩnh", () => {
  const clip = {
    ...base,
    volume: 0.8,
    fadeIn: 2,
    volumeKeyframes: { keyframes: [null] },
  } as unknown as Parameters<typeof computeClipGain>[0];
  // elapsed=1, fadeIn=2 linear → 0.5 × 0.8 = 0.4.
  assert.equal(computeClipGain(clip, 1, false, 1), 0.4);
});
ok("volumeKeyframes [null] + trackMuted → 0 (không ném trước mute)", () => {
  const clip = {
    ...base,
    volume: 0.8,
    volumeKeyframes: { keyframes: [null] },
  } as unknown as Parameters<typeof computeClipGain>[0];
  assert.equal(computeClipGain(clip, 1, true, 1), 0);
});

// --- Quy tắc đếm badge KeyframePanel ---
ok("badge count với [null] → 0 (khớp panel count, không phải 1 thô)", () => {
  assert.equal(badgeCount([null]), 0);
});
ok("badge count với [null, valid] → 1", () => {
  assert.equal(badgeCount([null, { t: 0, v: 0.5, easing: "linear" }]), 1);
});
ok("badge count với [] → 0; với [valid, valid] → 2", () => {
  assert.equal(badgeCount([]), 0);
  assert.equal(
    badgeCount([
      { t: 0, v: 0.5, easing: "linear" },
      { t: 2, v: 0.8, easing: "linear" },
    ]),
    2,
  );
});
ok("badge count với entry t/v không hữu hạn → lọc (NaN/Infinity không đếm)", () => {
  assert.equal(
    badgeCount([
      { t: NaN, v: 0.5, easing: "linear" },
      { t: 1, v: Infinity, easing: "linear" },
      { t: 2, v: 0.8, easing: "linear" },
    ]),
    1,
  );
});

console.log(`\naudioEngine52I2: ${pass} passed`);
