// webkitRestartTrace85M4.test.ts — Đợt 85 luồng M4: khóa hành vi dấu vết
// mức tick cho đường phục hồi ended (W7).
//
// Chạy: node scripts/run-node-test.mjs apps/web/src/lib/webkitRestartTrace85M4.test.ts
// (chạy từ gốc repo). Test logic THUẦN của RestartTrace (không cần trình
// duyệt); hành vi trình duyệt nền được khóa bằng probe headed
// apps/web/scripts/clicktest-85m4-webkit-w7.mjs (xem
// docs/PHASE9_ROUND85_M4_WEBKIT_W7_W6_LIMITS.md).
import assert from "node:assert/strict";
import {
  RESTART_TRACE_EVENT_CAP,
  RESTART_TRACE_RING_CAP,
  RestartTrace,
  type RestartTickSnapshot,
} from "./webkitRestartTrace85M4.ts";

function snap(over: Partial<RestartTickSnapshot> = {}): Omit<RestartTickSnapshot, "seq"> {
  return {
    wallMs: 1000,
    key: "VIDEO:c1",
    ended: false,
    seeking: false,
    ct: 1.5,
    dur: 30,
    paused: false,
    readyState: 4,
    target: 1.5,
    playhead: 1.5,
    ...over,
  };
}

let pass = 0;
function check(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`ok - ${name}`);
}

// --- recordTick: seq tăng đơn điệu, prev đúng ---
check("seq tăng đơn điệu, prev là tick trước của cùng key", () => {
  const t = new RestartTrace();
  const c1 = t.recordTick(snap({ ct: 1.0 }));
  const c2 = t.recordTick(snap({ ct: 1.1 }));
  assert.equal(c1.snap.seq + 1, c2.snap.seq);
  assert.equal(c2.prev?.seq, c1.snap.seq);
  assert.equal(c2.prev?.ct, 1.0);
  const c3 = t.recordTick(snap({ key: "VIDEO:c2", ct: 5.0 }));
  assert.equal(c3.prev, null); // key khác: tick đầu tiên
});

// --- ticksEndedTrue: đếm chuỗi liên tiếp, reset khi ended=false ---
check("ticksEndedTrue đếm chuỗi ended liên tiếp, reset khi hết ended", () => {
  const t = new RestartTrace();
  assert.equal(t.recordTick(snap({ ended: false })).ticksEndedTrue, 0);
  assert.equal(t.recordTick(snap({ ended: true })).ticksEndedTrue, 1);
  assert.equal(t.recordTick(snap({ ended: true })).ticksEndedTrue, 2);
  assert.equal(t.recordTick(snap({ ended: true })).ticksEndedTrue, 3);
  assert.equal(t.recordTick(snap({ ended: false })).ticksEndedTrue, 0);
  assert.equal(t.recordTick(snap({ ended: true })).ticksEndedTrue, 1);
});

// --- endedFlippedThisTick ---
check("endedFlippedThisTick chỉ true đúng tick lật false→true", () => {
  const t = new RestartTrace();
  assert.equal(t.recordTick(snap({ ended: false })).endedFlippedThisTick, false);
  assert.equal(t.recordTick(snap({ ended: true })).endedFlippedThisTick, true);
  assert.equal(t.recordTick(snap({ ended: true })).endedFlippedThisTick, false);
});

// --- ticksSinceSeekLanded / seekJustLanded ---
check("ticksSinceSeekLanded đếm từ lúc seeking true→false", () => {
  const t = new RestartTrace();
  let c = t.recordTick(snap({ seeking: false }));
  assert.equal(c.ticksSinceSeekLanded, null);
  assert.equal(c.seekJustLanded, false);
  t.recordTick(snap({ seeking: true }));
  c = t.recordTick(snap({ seeking: true }));
  assert.equal(c.ticksSinceSeekLanded, null);
  c = t.recordTick(snap({ seeking: false })); // seek vừa hạ cánh
  assert.equal(c.ticksSinceSeekLanded, 0);
  assert.equal(c.seekJustLanded, true);
  c = t.recordTick(snap({ seeking: false }));
  assert.equal(c.ticksSinceSeekLanded, 1);
  assert.equal(c.seekJustLanded, true);
  c = t.recordTick(snap({ seeking: false }));
  assert.equal(c.ticksSinceSeekLanded, 2);
  assert.equal(c.seekJustLanded, true);
  c = t.recordTick(snap({ seeking: false }));
  assert.equal(c.ticksSinceSeekLanded, 3);
  assert.equal(c.seekJustLanded, false);
});

// --- recordRestart: causeTag ---
check("restart ở ct ≈ duration → ended-at-duration", () => {
  const t = new RestartTrace();
  const ctx = t.recordTick(snap({ ended: true, ct: 30 }));
  const ev = t.recordRestart(ctx.snap, ctx);
  assert.equal(ev.causeTag, "ended-at-duration");
  assert.equal(ev.prev, null);
  assert.equal(ev.ticksEndedTrue, 1);
});
check("restart ở ct giữa clip → ended-mid-clip (nghi vấn W7)", () => {
  const t = new RestartTrace();
  const ctx = t.recordTick(snap({ ended: true, ct: 2.485 }));
  const ev = t.recordRestart(ctx.snap, ctx);
  assert.equal(ev.causeTag, "ended-mid-clip");
  assert.equal(ev.ct, 2.485);
});
check("dur NaN → ended-mid-clip (không đoán khi chưa biết duration)", () => {
  const t = new RestartTrace();
  const ctx = t.recordTick(snap({ ended: true, ct: 2, dur: Number.NaN }));
  assert.equal(t.recordRestart(ctx.snap, ctx).causeTag, "ended-mid-clip");
});
check("restart kèm prev tick + streak + seek-landed (bối cảnh W7 đầy đủ)", () => {
  const t = new RestartTrace();
  t.recordTick(snap({ ended: false, seeking: true, ct: 23.733 }));
  t.recordTick(snap({ ended: false, seeking: false, ct: 8.833 })); // seek hạ cánh
  const ctx = t.recordTick(snap({ ended: true, seeking: false, ct: 8.833 }));
  const ev = t.recordRestart(ctx.snap, ctx);
  assert.equal(ev.prev?.ct, 8.833);
  assert.equal(ev.prev?.seeking, false);
  assert.equal(ev.ticksEndedTrue, 1);
  assert.equal(ev.endedFlippedThisTick, true);
  assert.equal(ev.ticksSinceSeekLanded, 1);
  assert.equal(ev.seekJustLanded, true);
});

// --- chặn vòng đệm ---
check("ring giữ tối đa RESTART_TRACE_RING_CAP tick", () => {
  const t = new RestartTrace();
  for (let i = 0; i < RESTART_TRACE_RING_CAP + 50; i++) t.recordTick(snap({ wallMs: i }));
  assert.equal(t.ringCount, RESTART_TRACE_RING_CAP);
  const hook = t.snapshotForHook();
  assert.equal(hook.ring.length, RESTART_TRACE_RING_CAP);
  assert.equal(hook.ring[0].wallMs, 50); // tick cũ nhất đã rơi ra
});
check("events giữ tối đa RESTART_TRACE_EVENT_CAP sự kiện", () => {
  const t = new RestartTrace();
  for (let i = 0; i < RESTART_TRACE_EVENT_CAP + 5; i++) {
    const ctx = t.recordTick(snap({ ended: true, wallMs: i }));
    t.recordRestart(ctx.snap, ctx);
  }
  assert.equal(t.eventCount, RESTART_TRACE_EVENT_CAP);
  assert.equal(t.snapshotForHook().events[0].wallMs, 5);
});

console.log(`\nPASS webkitRestartTrace85M4: ${pass} check xanh`);
