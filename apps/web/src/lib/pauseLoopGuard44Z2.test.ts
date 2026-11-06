// pauseLoopGuard44Z2.test.ts — Đợt 44 luồng Z2: bẫy ngủ/branch guard khi
// scrub về đúng t đã vẽ sau khi cạn cap (nợ đợt 43 Y2 §5.2, xem
// docs/PHASE9_ROUND44_Z2_PAUSE_LIMITS.md).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/pauseLoopGuard44Z2.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
// Mô hình vòng lặp cũ ở dưới là BẢN SAO TRUNG THỰC các điều kiện trong
// preview.tsx (nhánh request-seek, pauseTickNeedsRetry, scheduleNext) —
// nó tái hiện bug, không phải bản thân vòng lặp thật. Bằng chứng browser
// cho trạng thái kẹt đã có ở Y2 §3.4 (ticks leo 502 → 1699 trong 60 s,
// không vẽ, không ngủ).
import assert from "node:assert/strict";
import { planDrawnPlayheadRecovery } from "./pauseLoopGuard44Z2.ts";
import { pauseTickNeedsRetry } from "./pauseDraw40V3.ts";
import { pauseRetryMaySleep } from "./pauseDraw41W2.ts";
import { seekFailureMaySleep } from "./pauseSeekCap42X2.ts";

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

// --- Mô hình vòng lặp CŨ (điều kiện y hệt preview.tsx trước sửa) ---------
interface OldLoopState {
  lastDrawn: number | null;
  lastRequested: number | null;
  pendingSeek: boolean;
  pauseRetryExhausted: boolean;
  seekFailureExhausted: boolean;
  seekFailureTarget: number | null;
}
function oldRequestsSeek(t: number, s: OldLoopState): boolean {
  return t !== s.lastDrawn && t !== s.lastRequested;
}
function oldNeedsRetry(t: number, s: OldLoopState): boolean {
  return pauseTickNeedsRetry(t, s.lastDrawn, s.lastRequested, s.pendingSeek);
}
function oldCanSleep(playhead: number, s: OldLoopState): boolean {
  return (
    !s.pendingSeek &&
    ((playhead === s.lastDrawn && s.lastRequested === playhead) ||
      pauseRetryMaySleep(
        s.pauseRetryExhausted,
        s.pendingSeek,
        s.lastRequested,
        playhead,
      ) ||
      seekFailureMaySleep(
        s.seekFailureExhausted,
        s.pendingSeek,
        s.lastRequested,
        playhead,
      ))
  );
}
function oldTick(playhead: number, s: OldLoopState): {
  requestsSeek: boolean;
  needsRetry: boolean;
  canSleep: boolean;
} {
  return {
    requestsSeek: oldRequestsSeek(playhead, s),
    needsRetry: oldNeedsRetry(playhead, s),
    canSleep: oldCanSleep(playhead, s),
  };
}

// Trạng thái sau cạn cap seek ở 1,5 (lastDrawn giữ 0,1 — frame cũ đã vẽ),
// user scrub về đúng 0,1 (= lastDrawn).
const SEEK_EXHAUSTED_AT_15: OldLoopState = {
  lastDrawn: 0.1,
  lastRequested: 1.5,
  pendingSeek: false,
  pauseRetryExhausted: false,
  seekFailureExhausted: true,
  seekFailureTarget: 1.5,
};
// Trạng thái sau cạn cap W2 ở 1,5 (seek đã xong cho 1,5 nhưng render skip
// mãi; lastDrawn vẫn 0,1), user scrub về đúng 0,1.
const W2_EXHAUSTED_AT_15: OldLoopState = {
  lastDrawn: 0.1,
  lastRequested: 1.5,
  pendingSeek: false,
  pauseRetryExhausted: true,
  seekFailureExhausted: false,
  seekFailureTarget: null,
};

ok("TÁI HIỆN (a) seek-cap: scrub về t đã vẽ → không seek, không vẽ, không ngủ", () => {
  const tick = oldTick(0.1, SEEK_EXHAUSTED_AT_15);
  assert.equal(tick.requestsSeek, false);
  assert.equal(tick.needsRetry, false);
  assert.equal(tick.canSleep, false);
  // Cả 3 đường đều đóng = vòng lặp tick mãi không làm việc gì (bug).
});

ok("TÁI HIỆN (a) W2-cap: scrub về t đã vẽ → không seek, không vẽ, không ngủ", () => {
  const tick = oldTick(0.1, W2_EXHAUSTED_AT_15);
  assert.equal(tick.requestsSeek, false);
  assert.equal(tick.needsRetry, false);
  assert.equal(tick.canSleep, false);
});

// --- Hàm mới: planDrawnPlayheadRecovery ----------------------------------
ok("guard mới: trạng thái cạn seek ở t khác → kế hoạch reset đúng phần seek", () => {
  const plan = planDrawnPlayheadRecovery(SEEK_EXHAUSTED_AT_15, 0.1);
  assert.ok(plan !== null);
  assert.equal(plan.resetSeekFailure, true);
  assert.equal(plan.resetPauseRetry, false);
  assert.equal(plan.lastRequested, 0.1);
});

ok("guard mới: trạng thái cạn W2 ở t khác → kế hoạch reset đúng phần W2", () => {
  const plan = planDrawnPlayheadRecovery(W2_EXHAUSTED_AT_15, 0.1);
  assert.ok(plan !== null);
  assert.equal(plan.resetPauseRetry, true);
  assert.equal(plan.resetSeekFailure, false);
  assert.equal(plan.lastRequested, 0.1);
});

ok("guard mới: cả 2 cap cùng cạn ở t khác → reset cả 2", () => {
  const plan = planDrawnPlayheadRecovery(
    { ...SEEK_EXHAUSTED_AT_15, pauseRetryExhausted: true },
    0.1,
  );
  assert.ok(plan !== null);
  assert.equal(plan.resetSeekFailure, true);
  assert.equal(plan.resetPauseRetry, true);
});

ok("guard mới: không kích khi playhead vẫn là t đã cạn (giữ trạng thái bỏ cuộc)", () => {
  assert.equal(planDrawnPlayheadRecovery(SEEK_EXHAUSTED_AT_15, 1.5), null);
  assert.equal(planDrawnPlayheadRecovery(W2_EXHAUSTED_AT_15, 1.5), null);
});

ok("guard mới: không kích khi chưa cạn cap nào, hoặc đang có seek bay", () => {
  const normal: OldLoopState = {
    lastDrawn: 0.1,
    lastRequested: 0.1,
    pendingSeek: false,
    pauseRetryExhausted: false,
    seekFailureExhausted: false,
    seekFailureTarget: null,
  };
  assert.equal(planDrawnPlayheadRecovery(normal, 0.1), null);
  assert.equal(
    planDrawnPlayheadRecovery({ ...SEEK_EXHAUSTED_AT_15, pendingSeek: true }, 0.1),
    null,
  );
});

ok("guard mới: không kích khi chưa từng vẽ (lastDrawn null)", () => {
  assert.equal(
    planDrawnPlayheadRecovery({ ...SEEK_EXHAUSTED_AT_15, lastDrawn: null }, 0.1),
    null,
  );
});

ok("guard mới: không kích khi target cạn là null (trạng thái không nhất quán)", () => {
  assert.equal(
    planDrawnPlayheadRecovery({ ...SEEK_EXHAUSTED_AT_15, seekFailureTarget: null }, 0.1),
    null,
  );
});

// --- Mô hình vòng lặp MỚI: áp guard trước rồi xét ngủ --------------------
ok("vòng lặp mới: sau guard, scrub về t đã vẽ → ngủ đường thường", () => {
  const plan = planDrawnPlayheadRecovery(SEEK_EXHAUSTED_AT_15, 0.1);
  assert.ok(plan !== null);
  const after: OldLoopState = {
    ...SEEK_EXHAUSTED_AT_15,
    lastRequested: plan.lastRequested,
    seekFailureExhausted: plan.resetSeekFailure ? false : SEEK_EXHAUSTED_AT_15.seekFailureExhausted,
    seekFailureTarget: plan.resetSeekFailure ? null : SEEK_EXHAUSTED_AT_15.seekFailureTarget,
    pauseRetryExhausted: plan.resetPauseRetry ? false : SEEK_EXHAUSTED_AT_15.pauseRetryExhausted,
  };
  assert.equal(oldCanSleep(0.1, after), true);
});

ok("vòng lặp mới: sau guard, scrub tiếp về t đã cạn cũ → request seek mới (element đã drop)", () => {
  const plan = planDrawnPlayheadRecovery(SEEK_EXHAUSTED_AT_15, 0.1);
  assert.ok(plan !== null);
  const after: OldLoopState = {
    ...SEEK_EXHAUSTED_AT_15,
    lastRequested: plan.lastRequested,
    seekFailureExhausted: false,
    seekFailureTarget: null,
  };
  // lastDrawn vẫn 0,1, lastRequested đã về 0,1 → scrub tới 1,5 đi nhánh seek mới.
  assert.equal(oldRequestsSeek(1.5, after), true);
});

console.log(`\npauseLoopGuard44Z2: ${pass} passed`);
