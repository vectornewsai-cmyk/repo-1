// reversePlaybackRound39T6.test.ts — Khóa bypass "vẽ ở tick vừa hoàn tất
// seek" của đợt 39 luồng T6 (xem stepDrawAllowedWithCompletion trong
// reversePlayback.ts + PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md §2).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/reversePlaybackRound39T6.test.ts
// (chạy từ gốc repo). Phần nối vào preview.tsx (syncMedia ghi cờ,
// drawVideoClip đọc cờ) chỉ kiểm chứng bằng tsc + build + harness
// trình duyệt như mọi đợt trước.
import assert from "node:assert/strict";
import {
  MAX_STEP_DRAW_LAG_SEC,
  stepDrawAllowed,
  stepDrawAllowedWithCompletion,
} from "./reversePlayback.ts";

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

const FPS = 30;
// Baseline đợt 39: seek bay 1,2–6,8 s, lag lúc xong 2,2–4,9 s.
const LAGS_BLOCKED_BASELINE = [4.9, 2.7, 3.6, 2.2];

console.log("== bypass tick vừa hoàn tất seek (đợt 39 T6) ==");
for (const lag of LAGS_BLOCKED_BASELINE) {
  ok(`justCompleted=true, lag ${lag}s (> guard ${MAX_STEP_DRAW_LAG_SEC}s) → vẽ`, () => {
    // currentTime = target + lag (playhead đã lùi trong lúc seek bay).
    assert.equal(stepDrawAllowedWithCompletion(false, 10 + lag, 10, FPS, true), true);
    // Guard cũ chặn đúng các trường hợp này (khóa hành vi trước sửa).
    assert.equal(stepDrawAllowed(false, 10 + lag, 10, FPS), false);
  });
}
ok("justCompleted=true nhưng vẫn seeking (trạng thái không thể) → rơi về guard cũ, không vẽ khi lệch", () => {
  assert.equal(stepDrawAllowedWithCompletion(true, 10 + 4.9, 10, FPS, true), false);
});
ok("justCompleted=true, khớp target → vẽ (cả guard cũ lẫn bypass đều cho)", () => {
  assert.equal(stepDrawAllowedWithCompletion(false, 10, 10, FPS, true), true);
});

console.log("== guard cũ giữ nguyên khi không phải tick hoàn tất ==");
ok("justCompleted=false, lag 1,5s (≤ guard) → vẽ", () => {
  assert.equal(stepDrawAllowedWithCompletion(false, 10 + 1.5, 10, FPS, false), true);
});
ok("justCompleted=false, lag 2,2s (> guard) → không vẽ", () => {
  assert.equal(stepDrawAllowedWithCompletion(false, 10 + 2.2, 10, FPS, false), false);
});
ok("justCompleted=false, đang seeking mà lệch → không vẽ", () => {
  assert.equal(stepDrawAllowedWithCompletion(true, 10 + 0.5, 10, FPS, false), false);
});
ok("justCompleted=false, khớp nửa frame → vẽ", () => {
  assert.equal(stepDrawAllowedWithCompletion(false, 10 + 0.4 / FPS, 10, FPS, false), true);
});

console.log(`\nreversePlaybackRound39T6: ${pass} test passed`);
