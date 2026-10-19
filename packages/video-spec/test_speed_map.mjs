/**
 * test_speed_map.mjs — Unit test cho R1-013/R1-014 (unified speed/time mapping).
 *
 * Chạy: node packages/video-spec/test_speed_map.mjs
 * Yêu cầu: packages/video-spec/src/speed.ts được biên dịch sang JS,
 * hoặc chạy bằng tsx/ts-node. Script này dùng bản JS mirror từ
 * server/render/src/speed.js (cùng logic, đã kiểm chứng parity).
 */
import { strict as assert } from "node:assert";
import {
  sourceTimeAt,
  sourceDurationOf,
  timelineDurationOf,
  splitSourceAt,
  trimLeftTo,
  trimRightTo,
  maxTrimLeft,
  maxTrimRightDuration,
} from "../../server/render/src/speed.js";

// Helper: tạo clip giả
function makeClip(over = {}) {
  return {
    kind: "video",
    id: "c1",
    src: "x.mp4",
    start: 10, // timeline start
    duration: 4, // timeline duration
    in: 20, // source in
    out: 28, // source out (8s nguồn)
    speed: 2, // 8s nguồn / 2 = 4s timeline ✓
    reverse: false,
    ...over,
  };
}

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    console.error(`  ❌ ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

console.log("R1-013: sourceTimeAt");

check("xuôi 2x: giữa timeline → giữa nguồn", () => {
  const c = makeClip(); // start=10, in=20, out=28, speed=2
  // t=12 (giữa timeline 10..14) → localT=2 → offset=4 → 20+4=24
  assert.equal(sourceTimeAt(c, 12), 24);
});

check("xuôi 2x: đầu timeline → in", () => {
  const c = makeClip();
  assert.equal(sourceTimeAt(c, 10), 20);
});

check("xuôi 2x: cuối timeline → out", () => {
  const c = makeClip();
  assert.equal(sourceTimeAt(c, 14), 28);
});

check("ngược 2x: đầu timeline → out", () => {
  const c = makeClip({ reverse: true });
  // t=10 → localT=0 → offset=0 → out-0=28
  assert.equal(sourceTimeAt(c, 10), 28);
});

check("ngược 2x: giữa timeline", () => {
  const c = makeClip({ reverse: true });
  // t=12 → localT=2 → offset=4 → 28-4=24
  assert.equal(sourceTimeAt(c, 12), 24);
});

check("ngược 2x: cuối timeline → in", () => {
  const c = makeClip({ reverse: true });
  assert.equal(sourceTimeAt(c, 14), 20);
});

check("0.5x: 1s timeline = 0.5s nguồn", () => {
  const c = makeClip({ in: 0, out: 4, speed: 0.5, duration: 8, start: 0 });
  // t=2 → offset=1 → 0+1=1
  assert.equal(sourceTimeAt(c, 2), 1);
});

check("4x: 1s timeline = 4s nguồn", () => {
  const c = makeClip({ in: 0, out: 16, speed: 4, duration: 4, start: 0 });
  assert.equal(sourceTimeAt(c, 1), 4);
});

console.log("R1-013: duration helpers");

check("sourceDurationOf = out - in", () => {
  assert.equal(sourceDurationOf(makeClip()), 8);
});

check("timelineDurationOf = (out-in)/speed", () => {
  assert.equal(timelineDurationOf(makeClip()), 4);
});

console.log("R1-014: splitSourceAt");

check("split xuôi 2x tại giữa", () => {
  const c = makeClip();
  const cut = splitSourceAt(c, 12); // t=12 → source 24
  assert.equal(cut.leftIn, 20);
  assert.equal(cut.leftOut, 24);
  assert.equal(cut.rightIn, 24);
  assert.equal(cut.rightOut, 28);
  // duration mỗi phần = 4/2 = 2s timeline
  assert.equal((cut.leftOut - cut.leftIn) / 2, 2);
  assert.equal((cut.rightOut - cut.rightIn) / 2, 2);
});

check("split ngược 2x tại giữa", () => {
  const c = makeClip({ reverse: true });
  const cut = splitSourceAt(c, 12); // t=12 → source 24 (đảo)
  assert.equal(cut.leftOut, 24);
  assert.equal(cut.rightIn, 24);
  // tổng vẫn đủ 8s nguồn
  assert.equal(cut.rightOut - cut.leftIn, 8);
});

check("split 0.5x + reverse", () => {
  const c = makeClip({ in: 0, out: 4, speed: 0.5, duration: 8, start: 0, reverse: true });
  const cut = splitSourceAt(c, 4); // giữa timeline
  // sourceTimeAt = 4 - 4*0.5 = 2
  assert.equal(cut.leftOut, 2);
  assert.equal(cut.rightIn, 2);
});

console.log("R1-014: trimLeftTo / trimRightTo");

check("trim trái xuôi 2x: kéo dài 1s timeline → in giảm 2s nguồn", () => {
  const c = makeClip(); // start=10, in=20
  const r = trimLeftTo(c, 9); // newStart=9, shift=-1
  assert.equal(r.start, 9);
  assert.equal(r.duration, 5); // 4+1
  assert.equal(r.in, 18); // 20 + (-1)*2
  assert.equal(r.out, 28); // giữ nguyên
  // invariant: (28-18)/2 = 5 ✓
  assert.equal((r.out - r.in) / 2, r.duration);
});

check("trim trái ngược 2x: dịch out thay vì in", () => {
  const c = makeClip({ reverse: true }); // start=10, out=28
  const r = trimLeftTo(c, 9); // shift=-1
  assert.equal(r.in, 20); // giữ nguyên
  assert.equal(r.out, 30); // 28 - (-1)*2
  assert.equal(r.duration, 5);
});

check("trim phải xuôi 2x: tăng 1s timeline → out tăng 2s nguồn", () => {
  const c = makeClip();
  const r = trimRightTo(c, 5); // newDuration=5
  assert.equal(r.duration, 5);
  assert.equal(r.in, 20); // giữ nguyên
  assert.equal(r.out, 30); // 20 + 5*2
});

check("trim phải ngược 2x: dịch in thay vì out", () => {
  const c = makeClip({ reverse: true });
  const r = trimRightTo(c, 5);
  // newEnd = 15 → sourceTimeAt = 28 - 5*2 = 18
  assert.equal(r.in, 18);
  assert.equal(r.out, 28); // giữ nguyên
  assert.equal((r.out - r.in) / 2, r.duration);
});

console.log("R1-014: giới hạn trim");

check("maxTrimLeft xuôi 2x: in/speed", () => {
  const c = makeClip(); // in=20, speed=2
  assert.equal(maxTrimLeft(c), 10); // 20/2
});

check("maxTrimRightDuration xuôi 2x", () => {
  const c = makeClip(); // in=20, speed=2, media 40s
  assert.equal(maxTrimRightDuration(c, 40), 10); // (40-20)/2
});

console.log(`\n🎉 ${passed} test pass`);
