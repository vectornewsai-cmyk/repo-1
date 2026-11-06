// pauseDraw40V3.test.ts — Khóa sửa lỗi vòng lặp preview "frame pause
// tại t=0 không vẽ" của đợt 40 V3 (xem pauseDraw40V3.ts +
// docs/PHASE9_ROUND40_V3_PAUSE_T0_LIMITS.md).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/pauseDraw40V3.test.ts
// (chạy từ gốc repo). Phần nối vào preview.tsx (gán lastDrawn có điều
// kiện + tick vẽ lại) chỉ kiểm chứng bằng tsc + build + harness trình
// duyệt như mọi đợt trước; mô phỏng vòng lặp ở dưới là MÔ HÌNH của
// công thức nhánh pause + scheduleNext trong preview.tsx (không phải
// bản thân vòng lặp thật) — nó khóa logic quyết định, không mạo nhận
// là bằng chứng browser.
import assert from "node:assert/strict";
import {
  pauseDrawComplete,
  pauseTickNeedsRetry,
} from "./pauseDraw40V3.ts";

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

console.log("== pauseDrawComplete (delta skip) ==");
ok("không skip thêm → vẽ được", () => {
  assert.equal(pauseDrawComplete(0, 0), true);
  assert.equal(pauseDrawComplete(3, 3), true);
});
ok("skip tăng → chưa vẽ được", () => {
  assert.equal(pauseDrawComplete(0, 1), false);
  assert.equal(pauseDrawComplete(5, 7), false);
});

console.log("== pauseTickNeedsRetry ==");
ok("seek xong cho t, chưa vẽ, không seek bay → vẽ lại", () => {
  assert.equal(pauseTickNeedsRetry(0, null, 0, false), true);
  // Scrub từ frame đã vẽ sang t mới, seek cho t mới đã xong.
  assert.equal(pauseTickNeedsRetry(0, 5, 0, false), true);
});
ok("đã vẽ rồi → không vẽ lại", () => {
  assert.equal(pauseTickNeedsRetry(0, 0, 0, false), false);
});
ok("seek đang bay → chờ .then, không vẽ lại", () => {
  assert.equal(pauseTickNeedsRetry(0, null, 0, true), false);
});
ok("chưa request seek cho t → đường request, không phải vẽ lại", () => {
  assert.equal(pauseTickNeedsRetry(0, null, null, false), false);
  assert.equal(pauseTickNeedsRetry(2, null, 0, false), false);
});

// --- Mô phỏng vòng lặp nhánh pause (công thức thật trong preview.tsx):
// request khi t !== lastDrawn && t !== lastRequested; ngủ khi !playing
// && !pendingSeek && playhead === lastDrawn && lastRequested === playhead
// && !redrawFlag. renderAttempt(skipDelta) trả về pauseDrawComplete.
console.log("== mô phỏng vòng lặp nhánh pause ==");
interface LoopState {
  lastDrawn: number | null;
  lastRequested: number | null;
  pendingSeek: boolean;
  playhead: number;
  playing: boolean;
  redrawFlag: boolean;
}
function canSleep(s: LoopState): boolean {
  return (
    !s.playing &&
    !s.pendingSeek &&
    s.playhead === s.lastDrawn &&
    s.lastRequested === s.playhead &&
    !s.redrawFlag
  );
}
function needsRequest(s: LoopState): boolean {
  return s.playhead !== s.lastDrawn && s.playhead !== s.lastRequested;
}
function renderAttempt(s: LoopState, skipDelta: number, markOldWay: boolean): void {
  // markOldWay = true mô phỏng code cũ (gán lastDrawn vô điều kiện).
  if (markOldWay) {
    s.lastDrawn = s.playhead;
  } else if (pauseDrawComplete(0, skipDelta)) {
    s.lastDrawn = s.playhead;
  }
}

ok("BUG CŨ (mô hình): seek xong nhưng skip → ngủ với nền đen", () => {
  const s: LoopState = { lastDrawn: null, lastRequested: null, pendingSeek: false, playhead: 0, playing: false, redrawFlag: false };
  assert.equal(needsRequest(s), true);
  s.lastRequested = 0;
  s.pendingSeek = true;
  // Seek xong, .then vẽ nhưng element chưa có frame → skip 1.
  s.pendingSeek = false;
  renderAttempt(s, 1, true);
  assert.equal(s.lastDrawn, 0);
  assert.equal(canSleep(s), true); // NGỦ dù canvas chỉ có nền đen.
});

ok("SỬA MỚI: seek xong nhưng skip → thức, tick sau vẽ lại → ngủ với frame", () => {
  const s: LoopState = { lastDrawn: null, lastRequested: null, pendingSeek: false, playhead: 0, playing: false, redrawFlag: false };
  assert.equal(needsRequest(s), true);
  s.lastRequested = 0;
  s.pendingSeek = true;
  s.pendingSeek = false; // seek xong
  renderAttempt(s, 1, false); // .then: skip → không gán lastDrawn
  assert.equal(s.lastDrawn, null);
  assert.equal(canSleep(s), false); // KHÔNG ngủ.
  // Tick sau: không request seek mới, chỉ vẽ lại.
  assert.equal(needsRequest(s), false);
  assert.equal(pauseTickNeedsRetry(s.playhead, s.lastDrawn, s.lastRequested, s.pendingSeek), true);
  renderAttempt(s, 0, false); // element đã sẵn sàng → vẽ được
  assert.equal(s.lastDrawn, 0);
  assert.equal(canSleep(s), true); // Ngủ, nhưng lần này canvas có frame.
});

ok("SỬA MỚI: element mãi chưa sẵn → thức, không seek mới", () => {
  const s: LoopState = { lastDrawn: null, lastRequested: null, pendingSeek: false, playhead: 0, playing: false, redrawFlag: false };
  s.lastRequested = 0;
  s.pendingSeek = false;
  renderAttempt(s, 1, false);
  for (let i = 0; i < 5; i++) {
    assert.equal(needsRequest(s), false); // không seek lại
    assert.equal(pauseTickNeedsRetry(s.playhead, s.lastDrawn, s.lastRequested, s.pendingSeek), true);
    renderAttempt(s, 1, false); // vẫn skip
    assert.equal(canSleep(s), false);
  }
  assert.equal(s.lastRequested, 0); // guard R14 giữ nguyên, không seek storm
});

ok("SỬA MỚI: scrub giữa lúc chờ vẽ lại → seek mới, .then cũ không vẽ đè", () => {
  const s: LoopState = { lastDrawn: null, lastRequested: null, pendingSeek: false, playhead: 0, playing: false, redrawFlag: false };
  s.lastRequested = 0;
  s.pendingSeek = false;
  renderAttempt(s, 1, false);
  s.playhead = 2; // user scrub
  assert.equal(pauseTickNeedsRetry(s.playhead, s.lastDrawn, s.lastRequested, s.pendingSeek), false);
  assert.equal(needsRequest(s), true); // seek mới cho t=2
  s.lastRequested = 2;
  s.pendingSeek = true;
  assert.equal(pauseTickNeedsRetry(s.playhead, s.lastDrawn, s.lastRequested, s.pendingSeek), false);
});

ok("Đường thường không đổi: seek xong vẽ được ngay → ngủ ngay", () => {
  const s: LoopState = { lastDrawn: null, lastRequested: null, pendingSeek: false, playhead: 0, playing: false, redrawFlag: false };
  s.lastRequested = 0;
  s.pendingSeek = false;
  renderAttempt(s, 0, false);
  assert.equal(s.lastDrawn, 0);
  assert.equal(canSleep(s), true);
});

console.log(`pauseDraw40V3: ${pass} passed`);
