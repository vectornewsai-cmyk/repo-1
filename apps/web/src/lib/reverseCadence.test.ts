// reverseCadence.test.ts — Khóa tracker cadence phát ngược (đợt 191 P3).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/reverseCadence.test.ts
import assert from "node:assert/strict";
import {
  ReverseCadenceTracker,
  summarizeIntervals,
} from "./reverseCadence.ts";

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

ok("summarizeIntervals: rỗng → toàn null", () => {
  assert.deepEqual(summarizeIntervals([]), {
    median: null,
    p90: null,
    max: null,
    mean: null,
  });
});

ok("summarizeIntervals: median/p90/max/mean đúng", () => {
  const s = summarizeIntervals([10, 20, 30, 40, 100]);
  assert.equal(s.median, 30);
  assert.equal(s.p90, 100);
  assert.equal(s.max, 100);
  assert.equal(s.mean, 40);
});

ok("tracker: rỗng → snapshot null", () => {
  assert.equal(new ReverseCadenceTracker().snapshot(), null);
});

ok("tracker: vẽ lại cùng frame không đếm (khử trùng)", () => {
  const tr = new ReverseCadenceTracker();
  assert.equal(tr.recordPresented(100, 0), true);
  assert.equal(tr.recordPresented(100, 16), false);
  assert.equal(tr.recordPresented(100, 33), false);
  assert.equal(tr.recordPresented(99, 50), true);
  assert.equal(tr.eventCount, 2);
});

ok("tracker: frame âm / NaN không ghi", () => {
  const tr = new ReverseCadenceTracker();
  assert.equal(tr.recordPresented(-1, 0), false);
  assert.equal(tr.recordPresented(Number.NaN, 0), false);
  assert.equal(tr.eventCount, 0);
});

ok("tracker: khoảng đều 33ms → median/p90/max ≈ 33, 0 stall", () => {
  const tr = new ReverseCadenceTracker();
  tr.start(1000);
  for (let i = 0; i < 10; i++) tr.recordPresented(300 - i, 1000 + i * 33);
  const s = tr.snapshot();
  assert.ok(s !== null);
  assert.equal(s.presentedFrames, 10);
  assert.equal(s.distinctFrames, 10);
  assert.equal(s.firstFrameLatencyMs, 0);
  assert.equal(s.intervalMedianMs, 33);
  assert.equal(s.intervalP90Ms, 33);
  assert.equal(s.intervalMaxMs, 33);
  assert.equal(s.stallsOver100Ms, 0);
  assert.equal(s.stallsOver250Ms, 0);
  assert.ok(Math.abs(s.presentedFps - 10 / (9 * 0.033)) < 0.5);
});

ok("tracker: 1 khoảng đóng băng 6500ms → max 6500, stall 1/1", () => {
  const tr = new ReverseCadenceTracker();
  tr.start(0);
  tr.recordPresented(290, 0);
  tr.recordPresented(289, 33);
  tr.recordPresented(288, 6533);
  const s = tr.snapshot();
  assert.ok(s !== null);
  assert.equal(s.intervalMaxMs, 6500);
  assert.equal(s.stallsOver100Ms, 1);
  assert.equal(s.stallsOver250Ms, 1);
  assert.equal(s.intervalMedianMs, 6500);
});

ok("tracker: không start() thì firstFrameLatency null", () => {
  const tr = new ReverseCadenceTracker();
  tr.recordPresented(5, 500);
  tr.recordPresented(4, 533);
  const s = tr.snapshot();
  assert.ok(s !== null);
  assert.equal(s.firstFrameLatencyMs, null);
});

ok("tracker: start() reset lượt cũ", () => {
  const tr = new ReverseCadenceTracker();
  tr.recordPresented(10, 0);
  tr.recordPresented(9, 33);
  tr.start(1000);
  assert.equal(tr.eventCount, 0);
  tr.recordPresented(8, 1000);
  const s = tr.snapshot();
  assert.ok(s !== null);
  assert.equal(s.presentedFrames, 1);
  assert.equal(s.wallSec, 0);
});

console.log(`reverseCadence.test.ts: ${pass} test PASS`);
