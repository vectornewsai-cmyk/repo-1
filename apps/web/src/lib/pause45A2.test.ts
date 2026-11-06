// pause45A2.test.ts — Đợt 45 luồng A2: phân loại quirk đáp sai của seek
// (mở rộng quirk seek-landing-0 của đợt 44 Z2 sang frame khác 0).
// Chạy bằng esbuild bundle --format=esm (theo task đợt 45, KHÔNG dùng
// node --experimental-strip-types vì file này chỉ import lib thuần mới):
//   ~/workspace/repo-1/node_modules/.bin/esbuild apps/web/src/lib/pause45A2.test.ts \
//     --bundle --platform=node --format=esm --outfile=/tmp/pause45A2.test.mjs
//   node /tmp/pause45A2.test.mjs
// Lib thuần không import @repo-1/video-spec nên bundle không cần alias.
// Pha đỏ: chạy trước khi pause45A2.ts tồn tại → lỗi resolve import.
import assert from "node:assert/strict";
import {
  SEEK_WRONG_LANDING_MAX_RETRIES,
  WrongLandingTracker,
  classifySeekLanding,
  frameIndex45A2,
  initialWrongLandingState,
  nextWrongLandingState,
} from "./pause45A2.ts";

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

// frameIndex45A2 phải khớp quy ước của seek.ts frameIndexOf
// (Math.round(t * fps), t <= 0 → 0).
ok("frame index: 2,5@30 = 75, 1,0@30 = 30, 0 → 0", () => {
  assert.equal(frameIndex45A2(2.5, 30), 75);
  assert.equal(frameIndex45A2(1.0, 30), 30);
  assert.equal(frameIndex45A2(0, 30), 0);
  assert.equal(frameIndex45A2(-1, 30), 0);
});

ok("ngưỡng mirror Z2: SEEK_WRONG_LANDING_MAX_RETRIES = 2 (fail ở lần đáp sai thứ 3)", () => {
  assert.equal(SEEK_WRONG_LANDING_MAX_RETRIES, 2);
});

ok("phân loại: đúng frame → correct; đáp 0 cho target > 0 → zero-landing", () => {
  assert.equal(classifySeekLanding(75, 75), "correct");
  assert.equal(classifySeekLanding(0, 75), "zero-landing");
});

ok("phân loại: đáp sai frame khác 0 → wrong-landing", () => {
  assert.equal(classifySeekLanding(30, 75), "wrong-landing");
  assert.equal(classifySeekLanding(45, 75), "wrong-landing");
});

ok("phân loại: seek về 0 có chủ ý → intentional-zero, không tính là quirk", () => {
  assert.equal(classifySeekLanding(0, 0), "intentional-zero");
});

ok("zero-landing liên tiếp: lần 1, 2 chưa fail; lần 3 fail", () => {
  let s = initialWrongLandingState();
  let r = nextWrongLandingState(s, 0, 75);
  assert.equal(r.kind, "zero-landing");
  assert.equal(r.consecutiveWrong, 1);
  assert.equal(r.shouldFail, false);
  s = r.state;
  r = nextWrongLandingState(s, 0, 75);
  assert.equal(r.consecutiveWrong, 2);
  assert.equal(r.shouldFail, false);
  s = r.state;
  r = nextWrongLandingState(s, 0, 75);
  assert.equal(r.consecutiveWrong, 3);
  assert.equal(r.shouldFail, true);
});

ok("wrong-landing frame khác 0 liên tiếp: lần 3 fail (mở rộng Z2)", () => {
  let s = initialWrongLandingState();
  for (let i = 1; i <= 2; i++) {
    const r = nextWrongLandingState(s, 30, 75);
    assert.equal(r.kind, "wrong-landing");
    assert.equal(r.consecutiveWrong, i);
    assert.equal(r.shouldFail, false);
    s = r.state;
  }
  const r = nextWrongLandingState(s, 30, 75);
  assert.equal(r.consecutiveWrong, 3);
  assert.equal(r.shouldFail, true);
});

ok("đáp sai đổi frame mỗi lần (30, 45, 30) vẫn đếm liên tiếp → lần 3 fail", () => {
  let s = initialWrongLandingState();
  const landings = [30, 45, 30];
  for (let i = 0; i < landings.length; i++) {
    const r = nextWrongLandingState(s, landings[i], 75);
    assert.equal(r.kind, "wrong-landing");
    assert.equal(r.consecutiveWrong, i + 1);
    assert.equal(r.shouldFail, i === 2);
    s = r.state;
  }
});

ok("thoáng qua: sai 2 lần rồi đáp đúng → đếm reset, lần sai sau đếm lại từ 1", () => {
  let s = initialWrongLandingState();
  s = nextWrongLandingState(s, 30, 75).state;
  s = nextWrongLandingState(s, 30, 75).state;
  const okR = nextWrongLandingState(s, 75, 75);
  assert.equal(okR.kind, "correct");
  assert.equal(okR.consecutiveWrong, 0);
  assert.equal(okR.shouldFail, false);
  const again = nextWrongLandingState(okR.state, 30, 75);
  assert.equal(again.consecutiveWrong, 1);
  assert.equal(again.shouldFail, false);
});

ok("seek về 0 có chủ ý lặp lại: không đếm, không fail", () => {
  let s = initialWrongLandingState();
  for (let i = 0; i < 5; i++) {
    const r = nextWrongLandingState(s, 0, 0);
    assert.equal(r.kind, "intentional-zero");
    assert.equal(r.consecutiveWrong, 0);
    assert.equal(r.shouldFail, false);
    s = r.state;
  }
});

ok("đổi target thì streak cũ reset (sai cho target cũ không cộng dồn sang target mới)", () => {
  let s = initialWrongLandingState();
  s = nextWrongLandingState(s, 30, 75).state;
  s = nextWrongLandingState(s, 30, 75).state;
  const r = nextWrongLandingState(s, 30, 60);
  assert.equal(r.consecutiveWrong, 1);
  assert.equal(r.shouldFail, false);
});

ok("ngưỡng tùy chỉnh: maxRetries = 1 → fail ở lần sai thứ 2; = 0 → fail ngay lần 1", () => {
  let s = initialWrongLandingState();
  s = nextWrongLandingState(s, 30, 75, 1).state;
  const r = nextWrongLandingState(s, 30, 75, 1);
  assert.equal(r.shouldFail, true);
  const r0 = nextWrongLandingState(initialWrongLandingState(), 30, 75, 0);
  assert.equal(r0.shouldFail, true);
});

ok("tracker class: chuỗi sai → fail, reset() xóa streak", () => {
  const t = new WrongLandingTracker();
  assert.equal(t.observe(30, 75).shouldFail, false);
  assert.equal(t.observe(30, 75).shouldFail, false);
  assert.equal(t.observe(45, 75).shouldFail, true);
  assert.equal(t.consecutiveWrong, 3);
  t.reset();
  assert.equal(t.consecutiveWrong, 0);
  assert.equal(t.observe(30, 75).shouldFail, false);
});

ok("tracker class: seek về 0 có chủ ý không làm bẩn streak sai trước đó? (reset theo đáp đúng)", () => {
  const t = new WrongLandingTracker();
  t.observe(30, 75);
  const r = t.observe(0, 0);
  assert.equal(r.kind, "intentional-zero");
  assert.equal(r.shouldFail, false);
  assert.equal(t.consecutiveWrong, 0);
});

console.log(`pause45A2: ${pass}/14 PASS`);
if (process.exitCode) console.error("pause45A2: CÓ TEST FAIL");
