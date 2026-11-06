// playheadPacingRound29L2.test.ts — Test pacing phát xuôi sau sửa bug
// snap nửa frame (đợt 29, luồng L2; nợ đợt 28 L2 §2.3).
//
// BUG: vòng lặp phát xuôi cũ gọi setPlayhead(playhead + dt) mỗi tick,
// mà setPlayhead snap Math.round về frame gần nhất. Ở 30 fps, tick rAF
// ~16.7 ms = đúng nửa frame nên mỗi tick hoặc bước nguyên 1 frame
// (33.3 ms) hoặc bước 0 — tốc độ playhead trung bình thành
// (tỷ lệ tick bước) × 1 frame / dt trung bình, KHÔNG bằng 1.00× wall
// trừ khi phân bố dt trùng khớp đúng. Đo trên Chromium thật (đợt 28):
// playhead 1.158× wall, độ lệch vs element tích lũy → drift-seek chu
// kỳ (ngưỡng 0.35 s) → cụm hold trên GOP thưa.
//
// SỬA: tích lũy dt, chỉ bước nguyên frame khi đủ (forwardStep /
// forwardPlayhead trong playheadPacing.ts, nối vào preview.tsx).
// Test này là MÔ PHỎNG vòng lặp (model, không phải số đo phần cứng):
// mô phỏng cũ dùng đúng snapToFrame thật của timebase.ts; mô phỏng
// mới dùng đúng forwardStep/forwardPlayhead thật. Số đo phần cứng duy
// nhất được viện dẫn là 1.158× của đợt 28 (xem LIMITS của đợt này).
// Chạy bằng Node type-stripping (không cần browser, không bundler):
//   node --experimental-strip-types apps/web/src/lib/playheadPacingRound29L2.test.ts
// (chạy từ gốc repo). Phần nối vào preview.tsx chỉ kiểm chứng bằng
// tsc + vite build (vòng lặp nằm trong component React, không unit-test
// bằng Node được) — ghi rõ trong LIMITS, không mạo nhận đã test loop thật.
import assert from "node:assert/strict";
import { forwardPlayhead, forwardStep } from "./playheadPacing.ts";
import { snapToFrame } from "../../../../packages/video-spec/src/timebase.ts";

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
function approx(a: number, b: number, eps: number, msg: string): void {
  assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} !== ${b} (±${eps})`);
}

const FPS = 30;
const FRAME = 1 / FPS;

/** Mô phỏng vòng lặp CŨ: setPlayhead(playhead + dt) mỗi tick. */
function simulateOld(dts: number[]): number[] {
  const trace: number[] = [];
  let p = 0;
  for (const dt of dts) {
    p = snapToFrame(p + dt, FPS);
    trace.push(p);
  }
  return trace;
}

/** Mô phỏng vòng lặp MỚI: forwardStep + forwardPlayhead, đúng preview.tsx. */
function simulateNew(dts: number[], duration = 3600): number[] {
  const trace: number[] = [];
  let p = 0;
  let acc = 0;
  for (const dt of dts) {
    const step = forwardStep(acc, dt, FRAME);
    acc = step.accumulated;
    if (step.steps > 0) p = forwardPlayhead(p, step.steps, FRAME, duration).t;
    trace.push(p);
  }
  return trace;
}

function wallOf(dts: number[]): number {
  return dts.reduce((a, b) => a + b, 0);
}

/** Đếm lần drift |playhead − element| vượt ngưỡng drift-seek 0.35 s. */
function driftSeekCrossings(trace: number[], dts: number[], eps = 0.35): number {
  let wall = 0;
  let crossings = 0;
  let above = false;
  for (let i = 0; i < dts.length; i++) {
    wall += dts[i];
    const over = Math.abs(trace[i] - wall) > eps;
    if (over && !above) crossings++;
    above = over;
  }
  return crossings;
}

function maxDrift(trace: number[], dts: number[]): number {
  let wall = 0;
  let max = 0;
  for (let i = 0; i < dts.length; i++) {
    wall += dts[i];
    max = Math.max(max, Math.abs(trace[i] - wall));
  }
  return max;
}

/** Chuỗi dt jitter có hạt giống cố định (rAF thật dao động quanh 16–20 ms). */
function jitterDts(n: number): number[] {
  let seed = 12345;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  return Array.from({ length: n }, () => 0.014 + rnd() * 0.006);
}

console.log("== forwardStep / forwardPlayhead: unit ==");
ok("dt = nửa frame: tick 1 chưa bước, tick 2 bước đúng 1 frame, dư ~0", () => {
  const s1 = forwardStep(0, FRAME / 2, FRAME);
  assert.equal(s1.steps, 0);
  approx(s1.accumulated, FRAME / 2, 1e-12, "dư sau tick 1");
  const s2 = forwardStep(s1.accumulated, FRAME / 2, FRAME);
  assert.equal(s2.steps, 1);
  approx(s2.accumulated, 0, 1e-9, "dư sau tick 2");
});
ok("dt = 0 / âm / frameDur không hợp lệ → 0 bước, giữ dư", () => {
  assert.deepEqual(forwardStep(0.01, 0, FRAME), { steps: 0, accumulated: 0.01 });
  assert.deepEqual(forwardStep(0.01, -0.005, FRAME), { steps: 0, accumulated: 0.01 });
  assert.deepEqual(forwardStep(0.01, 0.02, 0), { steps: 0, accumulated: 0.01 });
});
ok("dt lớn (tab lag, đã clamp 0.1 ở loop) bước bù nhiều frame", () => {
  const s = forwardStep(0, 0.1, FRAME);
  assert.equal(s.steps, 3); // 0.1 s = 3 frame 30 fps
  approx(s.accumulated, 0.1 - 3 * FRAME, 1e-12, "dư sau bước bù");
});
ok("forwardPlayhead: tiến đúng bội frame, chạm cuối thì kẹp + reachedEnd", () => {
  const r = forwardPlayhead(1.0, 2, FRAME, 3600);
  approx(r.t, 1.0 + 2 * FRAME, 1e-12, "tiến 2 frame");
  assert.equal(r.reachedEnd, false);
  const end = forwardPlayhead(9.95, 3, FRAME, 10);
  assert.equal(end.t, 10);
  assert.equal(end.reachedEnd, true);
  assert.deepEqual(forwardPlayhead(1.0, 0, FRAME, 10), { t: 1.0, reachedEnd: false });
});
ok("playhead mới luôn nằm trên lưới frame (sai số float < 1e-9)", () => {
  const trace = simulateNew(jitterDts(1200));
  for (const p of trace) {
    assert.ok(Math.abs(p * FPS - Math.round(p * FPS)) < 1e-6, `lệch lưới: ${p}`);
  }
});

console.log("== pacing xuôi: cũ (snap Math.round) vs mới (tích lũy) ==");
ok("jitter rAF thật: cũ chạy nhanh 1.09×, mới ~1.00×", () => {
  const dts = jitterDts(1200);
  const wall = wallOf(dts);
  const oldRatio = simulateOld(dts).at(-1)! / wall;
  const newRatio = simulateNew(dts).at(-1)! / wall;
  console.log(`    cũ ${oldRatio.toFixed(4)}×, mới ${newRatio.toFixed(4)}× (wall ${wall.toFixed(2)} s)`);
  assert.ok(oldRatio > 1.05, `cũ phải thiên vị lên, được ${oldRatio}`);
  approx(newRatio, 1, 0.01, "mới bám wall-clock");
});
ok("jitter rAF thật: cũ gây drift-seek lặp, mới không vượt ngưỡng 0.35 s", () => {
  const dts = jitterDts(1200);
  const oldTrace = simulateOld(dts);
  const newTrace = simulateNew(dts);
  const oldCross = driftSeekCrossings(oldTrace, dts);
  const newCross = driftSeekCrossings(newTrace, dts);
  const newMax = maxDrift(newTrace, dts);
  console.log(`    cũ: ${oldCross} lần vượt 0.35 s; mới: ${newCross} lần, lệch max ${newMax.toFixed(4)} s`);
  assert.ok(oldCross >= 1, "cũ phải gây ít nhất 1 chu kỳ drift-seek");
  assert.equal(newCross, 0);
  assert.ok(newMax <= FRAME + 1e-9, `lệch mới bị chặn bởi 1 frame, được ${newMax}`);
});
ok("tie nửa frame đúng 60 Hz: snap-round sụp (0.13× do làm tròn float), mới 1.00×", () => {
  // Trường hợp biên chứng minh snap-round KHÔNG ổn định theo phân bố dt:
  // cùng 1 cơ chế, dt khác nhau cho 0.13×, 0.68× hay 1.09× — không có
  // tốc độ nào đáng tin. Chỉ assert cũ lệch xa 1.00 và mới bám 1.00.
  const dts = Array(600).fill(1 / 60);
  const wall = wallOf(dts);
  const oldRatio = simulateOld(dts).at(-1)! / wall;
  const newRatio = simulateNew(dts).at(-1)! / wall;
  console.log(`    cũ ${oldRatio.toFixed(4)}×, mới ${newRatio.toFixed(4)}×`);
  assert.ok(Math.abs(oldRatio - 1) > 0.5, `cũ phải lệch xa 1.00×, được ${oldRatio}`);
  approx(newRatio, 1, 0.01, "mới bám wall-clock ở tie");
});
ok("mẫu 17/16/16 ms: cũ 0.68× (chậm), mới 1.00× — cùng cơ chế, hướng lệch đổi dấu", () => {
  const dts = Array.from({ length: 600 }, (_, i) => (i % 3 === 0 ? 0.017 : 0.016));
  const wall = wallOf(dts);
  const oldRatio = simulateOld(dts).at(-1)! / wall;
  const newRatio = simulateNew(dts).at(-1)! / wall;
  console.log(`    cũ ${oldRatio.toFixed(4)}×, mới ${newRatio.toFixed(4)}×`);
  assert.ok(oldRatio < 0.9, `cũ phải chậm hẳn, được ${oldRatio}`);
  approx(newRatio, 1, 0.01, "mới bám wall-clock");
});
ok("tick chưa đủ frame không đổi playhead (loop mới không gọi setPlayhead vô ích)", () => {
  // Mô phỏng đúng nhánh loop: chỉ setPlayhead khi steps > 0.
  const dts = jitterDts(300);
  let acc = 0;
  let p = 0;
  let setCalls = 0;
  for (const dt of dts) {
    const step = forwardStep(acc, dt, FRAME);
    acc = step.accumulated;
    if (step.steps > 0) {
      p = forwardPlayhead(p, step.steps, FRAME, 3600).t;
      setCalls++;
    }
  }
  assert.ok(setCalls > 0 && setCalls < dts.length, `setPlayhead ${setCalls}/${dts.length} tick`);
  approx(p / wallOf(dts), 1, 0.02, "tốc độ cuối vẫn ~1.00×");
});

console.log(`\nplayheadPacingRound29L2: ${pass} test pass`);
