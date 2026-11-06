// reversePlayback.test.ts — Khóa logic thuần phát ngược của đợt 27 K4.
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/reversePlayback.test.ts
// (chạy từ gốc repo). Phần nối vào vòng lặp preview/syncMedia/drawVideoClip
// chỉ kiểm chứng bằng tsc + build + harness trình duyệt (xem
// PHASE9_ROUND27_K4_REVERSE_HOLD_LIMITS.md).
import assert from "node:assert/strict";
import {
  MAX_HOLD_AGE_SEC,
  holdStale,
  reversePlayhead,
  reverseStep,
  seekOnTarget,
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

const FRAME = 1 / 30;

ok("reverseStep: chưa đủ 1 frame thì 0 bước, dư giữ lại", () => {
  const r = reverseStep(0, 0.016, FRAME);
  assert.equal(r.steps, 0);
  assert.ok(Math.abs(r.accumulated - 0.016) < 1e-9);
});
ok("reverseStep: đủ 2 frame thì đúng 2 bước, không làm tròn lên", () => {
  const r = reverseStep(0.01, 0.06, FRAME);
  assert.equal(r.steps, 2);
  assert.ok(r.accumulated >= 0 && r.accumulated < FRAME);
});
ok("reverseStep: chuỗi tick 16ms không skip/lặp frame (tổng bước = floor(tổng thời gian / frame))", () => {
  let acc = 0;
  let steps = 0;
  for (let i = 0; i < 60; i++) {
    const r = reverseStep(acc, 0.016, FRAME);
    acc = r.accumulated;
    steps += r.steps;
  }
  // 60 tick × 16ms = 0.96s ≈ 28.8 frame → 28 bước, dư < 1 frame.
  assert.equal(steps, 28);
  assert.ok(acc >= 0 && acc < FRAME);
});
ok("reverseStep: dt <= 0 hoặc frameDur <= 0 thì không bước", () => {
  assert.equal(reverseStep(0.02, 0, FRAME).steps, 0);
  assert.equal(reverseStep(0.02, -0.01, FRAME).steps, 0);
  assert.equal(reverseStep(0.02, 0.05, 0).steps, 0);
});
ok("reversePlayhead: lùi đúng bội số frame, chưa chạm đầu", () => {
  const r = reversePlayhead(10, 3, FRAME);
  assert.ok(Math.abs(r.t - (10 - 3 * FRAME)) < 1e-9);
  assert.equal(r.reachedStart, false);
});
ok("reversePlayhead: chạm/vượt 0 thì kẹp về 0 + reachedStart (không quấn cuối)", () => {
  const r = reversePlayhead(0.05, 3, FRAME);
  assert.equal(r.t, 0);
  assert.equal(r.reachedStart, true);
});
ok("reversePlayhead: 0 bước thì đứng yên, không reachedStart giả", () => {
  const r = reversePlayhead(5, 0, FRAME);
  assert.equal(r.t, 5);
  assert.equal(r.reachedStart, false);
});
ok("holdStale: chưa giữ (null) thì không stale; trong ngưỡng thì không; vượt ngưỡng thì stale", () => {
  assert.equal(holdStale(null, 10), false);
  assert.equal(holdStale(5, 5 + MAX_HOLD_AGE_SEC), false);
  assert.equal(holdStale(5, 5 + MAX_HOLD_AGE_SEC + 0.001), true);
});
ok("holdStale: phát ngược (t giảm khỏi điểm giữ) cũng tính tuổi theo khoảng cách", () => {
  assert.equal(holdStale(20, 20 - MAX_HOLD_AGE_SEC), false);
  assert.equal(holdStale(20, 20 - MAX_HOLD_AGE_SEC - 0.001), true);
});
ok("seekOnTarget: lệch dưới nửa frame là đúng vị trí; lệch 1 frame là stale", () => {
  assert.equal(seekOnTarget(10, 10, 30), true);
  // Tránh biên float đúng 0.5 frame (10 + 0.5/30 làm tròn có thể vượt
  // ngưỡng 1 ulp): dùng 0.4 frame (trong) và 0.6 frame (ngoài) thay thế.
  assert.equal(seekOnTarget(10, 10 + 0.4 / 30, 30), true);
  assert.equal(seekOnTarget(10, 10 + 0.6 / 30, 30), false);
  assert.equal(seekOnTarget(10, 10 + 1 / 30, 30), false);
  assert.equal(seekOnTarget(10, 10 - 1 / 30, 30), false);
});

console.log(`reversePlayback: ${pass}/10 test pass`);
if (process.exitCode) console.log("reversePlayback: CÓ TEST FAIL");
