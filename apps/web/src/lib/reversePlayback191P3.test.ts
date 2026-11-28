// reversePlayback191P3.test.ts — Khóa luật giữ playhead ngược (đợt 191 P3).
// Chạy bằng Node type-stripping:
//   node --experimental-strip-types apps/web/src/lib/reversePlayback191P3.test.ts
import assert from "node:assert/strict";
import { shouldHoldReversePlayhead } from "./reversePlayback.ts";

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

const base = {
  globalReverse: true,
  engine: "element" as const,
  steppingSeekingPrevTick: true,
  drewFramePrevTick: false,
  hasSteppingVideo: true,
};

ok("element: seek còn bay → giữ", () => {
  assert.equal(shouldHoldReversePlayhead(base), true);
});

ok("element: seek xong → nhả (playhead bước 1 frame)", () => {
  assert.equal(
    shouldHoldReversePlayhead({ ...base, steppingSeekingPrevTick: false }),
    false,
  );
});

ok("webcodecs: tick trước không vẽ frame nào → giữ (decode đang chạy)", () => {
  assert.equal(
    shouldHoldReversePlayhead({
      ...base,
      engine: "webcodecs",
      steppingSeekingPrevTick: false,
      drewFramePrevTick: false,
    }),
    true,
  );
});

ok("webcodecs: tick trước vẽ frame (kể cả vẽ lại frame cũ khi playhead giữ) → nhả", () => {
  assert.equal(
    shouldHoldReversePlayhead({
      ...base,
      engine: "webcodecs",
      steppingSeekingPrevTick: true,
      drewFramePrevTick: true,
    }),
    false,
  );
});

ok("webcodecs: KHÔNG giữ theo seeking của element (seek nền không lái hình)", () => {
  // Element vẫn seek nền trên đường webcodecs nhưng hình lấy từ cache:
  // seeking=true + drew=true → nhả.
  assert.equal(
    shouldHoldReversePlayhead({
      ...base,
      engine: "webcodecs",
      steppingSeekingPrevTick: true,
      drewFramePrevTick: true,
    }),
    false,
  );
});

ok("không phải ngược toàn cục → không giữ (clip reverse lẻ)", () => {
  assert.equal(
    shouldHoldReversePlayhead({ ...base, globalReverse: false }),
    false,
  );
});

ok("không có clip video stepping → không giữ (khoảng trống timeline)", () => {
  assert.equal(
    shouldHoldReversePlayhead({ ...base, hasSteppingVideo: false }),
    false,
  );
  assert.equal(
    shouldHoldReversePlayhead({
      ...base,
      engine: "webcodecs",
      hasSteppingVideo: false,
      drewFramePrevTick: false,
    }),
    false,
  );
});

console.log(`reversePlayback191P3.test.ts: ${pass} test PASS`);
