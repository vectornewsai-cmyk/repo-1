"use strict";
/**
 * Test apps/web/src/lib/scene.ts — chạy sau khi test-scene.sh biên dịch.
 * Không cần DOM/browser.
 */
const assert = require("node:assert/strict");
const {
  sourceCutToTimeline,
  cutsToTimelineTimes,
  formatCutTime,
} = require("./out/apps/web/src/lib/scene.js");

let pass = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  PASS ${name}`);
  } catch (e) {
    console.log(`  FAIL ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

const base = {
  kind: "video", id: "c1", src: "v.mp4",
  start: 10, duration: 8, in: 100, out: 108,
};

console.log("== [1] sourceCutToTimeline ==");
check("speed=1: cut giữa -> timeline giữa", () => {
  assert.equal(sourceCutToTimeline(base, 104), 14);
});
check("speed=2: cut 104 -> 12", () => {
  assert.equal(sourceCutToTimeline({ ...base, speed: 2, duration: 4 }, 104), 12);
});
check("reverse: cut 104 -> 14 (đảo)", () => {
  // reverse: tại start=10 thì source hiện out=108; cut=104 cách out 4s -> t=14
  assert.equal(sourceCutToTimeline({ ...base, reverse: true }, 104), 14);
});
check("reverse + speed=2: cut 106 -> 11", () => {
  assert.equal(sourceCutToTimeline({ ...base, reverse: true, speed: 2, duration: 4 }, 106), 11);
});
check("cut ngoài [in,out] -> null", () => {
  assert.equal(sourceCutToTimeline(base, 99), null);
  assert.equal(sourceCutToTimeline(base, 109), null);
});
check("cut đúng biên in/out -> map được", () => {
  assert.equal(sourceCutToTimeline(base, 100), 10);
  assert.equal(sourceCutToTimeline(base, 108), 18);
});

console.log("== [2] cutsToTimelineTimes ==");
check("lọc cut sát mép", () => {
  // cut=100.02 -> t=10.02, cách mép start 0.02 < 0.05 -> bỏ
  assert.deepEqual(cutsToTimelineTimes(base, [100.02, 104, 107.99]), [14]);
});
check("sắp xếp + gộp điểm gần nhau", () => {
  // 104->14, 104.2->14.2 (cách 0.2 < 0.3 -> bỏ), 106->16
  assert.deepEqual(cutsToTimelineTimes(base, [106, 104, 104.2]), [14, 16]);
});
check("không có cut hợp lệ -> []", () => {
  assert.deepEqual(cutsToTimelineTimes(base, [50, 200]), []);
});
check("làm tròn 3 chữ số", () => {
  const r = cutsToTimelineTimes(base, [104.12345]);
  assert.deepEqual(r, [14.123]);
});

console.log("== [3] formatCutTime ==");
check("61.5 -> 00:01:01.500", () => {
  assert.equal(formatCutTime(61.5), "00:01:01.500");
});
check("0 -> 00:00:00.000", () => {
  assert.equal(formatCutTime(0), "00:00:00.000");
});

console.log(`\n==========================================\nSCENE UI PASS: ${pass} assertions\n==========================================`);
