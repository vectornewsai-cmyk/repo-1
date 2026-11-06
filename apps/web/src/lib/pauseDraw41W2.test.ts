// pauseDraw41W2.test.ts — Khóa cap cho vòng lặp vẽ lại pause của đợt 40
// V3 (xem pauseDraw41W2.ts + docs/PHASE9_ROUND41_W2_PAUSE_T0_LIMITS.md).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/pauseDraw41W2.test.ts
// (chạy từ gốc repo). Mô phỏng vòng lặp ở dưới là MÔ HÌNH của công thức
// nhánh pause + scheduleNext trong preview.tsx (không phải bản thân
// vòng lặp thật) — nó khóa logic quyết định (đếm skip, cạn cap, ngủ,
// reset), không mạo nhận là bằng chứng browser.
import assert from "node:assert/strict";
import {
  PAUSE_RETRY_TICK_CAP,
  pauseRetryAdvance,
  pauseRetryMaySleep,
} from "./pauseDraw41W2.ts";
import { pauseTickNeedsRetry } from "./pauseDraw40V3.ts";

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

console.log("== pauseRetryAdvance ==");
ok("vẽ được → đếm về 0, hết cạn", () => {
  assert.deepEqual(pauseRetryAdvance(false, 599), { consecutiveSkipped: 0, exhausted: false });
  assert.deepEqual(pauseRetryAdvance(false, 0), { consecutiveSkipped: 0, exhausted: false });
});
ok("skip tăng đếm, chưa cạn dưới cap", () => {
  assert.deepEqual(pauseRetryAdvance(true, 0), { consecutiveSkipped: 1, exhausted: false });
  assert.deepEqual(pauseRetryAdvance(true, 598), { consecutiveSkipped: 599, exhausted: false });
});
ok("skip chạm đúng cap → cạn", () => {
  assert.deepEqual(pauseRetryAdvance(true, 599), { consecutiveSkipped: 600, exhausted: true });
  assert.equal(PAUSE_RETRY_TICK_CAP, 600);
});
ok("vượt cap vẫn giữ cạn (không tràn ngữ nghĩa)", () => {
  assert.deepEqual(pauseRetryAdvance(true, 600), { consecutiveSkipped: 601, exhausted: true });
});

console.log("== pauseRetryMaySleep ==");
ok("cạn + không seek bay + đúng t → được ngủ", () => {
  assert.equal(pauseRetryMaySleep(true, false, 0, 0), true);
});
ok("chưa cạn → không ngủ kiểu bỏ cuộc", () => {
  assert.equal(pauseRetryMaySleep(false, false, 0, 0), false);
});
ok("seek đang bay → không ngủ", () => {
  assert.equal(pauseRetryMaySleep(true, true, 0, 0), false);
});
ok("đã scrub sang t khác → không ngủ kiểu bỏ cuộc", () => {
  assert.equal(pauseRetryMaySleep(true, false, 2, 0), false);
  assert.equal(pauseRetryMaySleep(true, false, null, 0), false);
});

// --- Mô phỏng vòng lặp nhánh pause + scheduleNext (công thức thật):
// ngủ thường khi playhead === lastDrawn && lastRequested === playhead;
// ngủ-bỏ-cuộc khi pauseRetryMaySleep(...) đúng; request seek mới khi
// t !== lastDrawn && t !== lastRequested (và reset cap ở đó).
console.log("== mô phỏng vòng lặp nhánh pause có cap ==");
interface LoopState {
  lastDrawn: number | null;
  lastRequested: number | null;
  pendingSeek: boolean;
  playhead: number;
  playing: boolean;
  redrawFlag: boolean;
  consecutiveSkipped: number;
  exhausted: boolean;
}
function canSleep(s: LoopState): boolean {
  if (s.playing || s.pendingSeek || s.redrawFlag) return false;
  if (s.playhead === s.lastDrawn && s.lastRequested === s.playhead) return true;
  return pauseRetryMaySleep(s.exhausted, s.pendingSeek, s.lastRequested, s.playhead);
}
function renderPause(s: LoopState, skipped: boolean): void {
  // renderPause mô phỏng cả lần render trong .then lẫn tick vẽ lại:
  // cả hai đều qua cùng một bộ đếm (xem pauseDraw41W2.ts).
  const adv = pauseRetryAdvance(skipped, s.consecutiveSkipped);
  s.consecutiveSkipped = adv.consecutiveSkipped;
  s.exhausted = adv.exhausted;
  if (!skipped) s.lastDrawn = s.playhead;
}
function tickRetry(s: LoopState, skipped: boolean): void {
  // Tick vẽ lại chỉ chạy khi pauseTickNeedsRetry đúng và chưa cạn cap;
  // khi đã cạn, tick không render gì nữa (vòng lặp đi tới scheduleNext).
  if (!pauseTickNeedsRetry(s.playhead, s.lastDrawn, s.lastRequested, s.pendingSeek)) return;
  if (s.exhausted) return;
  renderPause(s, skipped);
}

ok("BẰNG CHỨNG ĐỢT 40 VẪN HỘI TỤ: skip 3 rồi vẽ → ngủ với frame, không cạn cap", () => {
  const s: LoopState = { lastDrawn: null, lastRequested: 0, pendingSeek: false, playhead: 0, playing: false, redrawFlag: false, consecutiveSkipped: 0, exhausted: false };
  renderPause(s, true); // .then đầu bị skip
  tickRetry(s, true);
  tickRetry(s, true);
  assert.equal(s.consecutiveSkipped, 3);
  assert.equal(s.exhausted, false);
  tickRetry(s, false); // element sẵn sàng → vẽ được
  assert.equal(s.lastDrawn, 0);
  assert.equal(s.consecutiveSkipped, 0);
  assert.equal(canSleep(s), true);
});

ok("MEDIA HỎNG: skip đủ 600 lần → cạn cap → ngủ, tick sau không render nữa", () => {
  const s: LoopState = { lastDrawn: null, lastRequested: 0, pendingSeek: false, playhead: 0, playing: false, redrawFlag: false, consecutiveSkipped: 0, exhausted: false };
  renderPause(s, true); // .then đầu bị skip (lần 1)
  for (let i = 1; i < 600; i++) {
    assert.equal(canSleep(s), false); // chưa cạn → chưa được ngủ
    tickRetry(s, true);
  }
  assert.equal(s.consecutiveSkipped, 600);
  assert.equal(s.exhausted, true);
  assert.equal(canSleep(s), true); // NGỦ dù lastDrawn !== playhead
  const before = s.consecutiveSkipped;
  tickRetry(s, true); // tick sau khi cạn: không render, đếm đứng yên
  assert.equal(s.consecutiveSkipped, before);
  assert.equal(canSleep(s), true);
});

ok("MEDIA HỎNG: không seek storm trong lúc chờ cạn cap", () => {
  const s: LoopState = { lastDrawn: null, lastRequested: 0, pendingSeek: false, playhead: 0, playing: false, redrawFlag: false, consecutiveSkipped: 0, exhausted: false };
  renderPause(s, true);
  for (let i = 1; i < 600; i++) {
    // lastRequested giữ nguyên t nên nhánh request-seek không chạy lại.
    assert.equal(s.lastRequested, 0);
    tickRetry(s, true);
  }
  assert.equal(s.lastRequested, 0);
});

ok("RESET: scrub sang t mới sau khi cạn → seek mới, cap reset, vẽ lại được", () => {
  const s: LoopState = { lastDrawn: null, lastRequested: 0, pendingSeek: false, playhead: 0, playing: false, redrawFlag: false, consecutiveSkipped: 600, exhausted: true };
  assert.equal(canSleep(s), true);
  s.playhead = 2; // user scrub
  assert.equal(canSleep(s), false); // t mới ≠ lastRequested → không ngủ kiểu bỏ cuộc
  // Nhánh request-seek chạy (t !== lastDrawn && t !== lastRequested):
  // preview.tsx reset cap ở đó.
  s.lastRequested = 2;
  s.pendingSeek = true;
  s.consecutiveSkipped = 0;
  s.exhausted = false;
  s.pendingSeek = false; // seek xong
  renderPause(s, false); // .then vẽ được ngay
  assert.equal(s.lastDrawn, 2);
  assert.equal(canSleep(s), true);
});

ok("RESET: justPaused/redrawFlag reset cap cùng lastDrawn/lastRequested", () => {
  const s: LoopState = { lastDrawn: null, lastRequested: 0, pendingSeek: false, playhead: 0, playing: false, redrawFlag: false, consecutiveSkipped: 600, exhausted: true };
  // Mô phỏng khối justPaused/redrawFlag trong preview.tsx:
  s.lastDrawn = null;
  s.lastRequested = null;
  s.consecutiveSkipped = 0;
  s.exhausted = false;
  assert.equal(canSleep(s), false);
  assert.equal(pauseTickNeedsRetry(s.playhead, s.lastDrawn, s.lastRequested, s.pendingSeek), false);
});

console.log(`pauseDraw41W2: ${pass} passed`);
