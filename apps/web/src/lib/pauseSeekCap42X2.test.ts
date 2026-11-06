// pauseSeekCap42X2.test.ts — Khóa cap cho đường seek-timeout /
// seek-error của vòng lặp pause (nợ đợt 41 §5.3, xem
// pauseSeekCap42X2.ts + docs/PHASE9_ROUND42_X2_PAUSE_SEEK_CAP_LIMITS.md).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/pauseSeekCap42X2.test.ts
// (chạy từ gốc repo). Mô phỏng vòng lặp ở dưới là MÔ HÌNH của công thức
// nhánh pause + scheduleNext trong preview.tsx (không phải bản thân
// vòng lặp thật) — nó khóa logic quyết định (phân loại, đếm, cạn cap,
// ngủ, reset), không mạo nhận là bằng chứng browser.
import assert from "node:assert/strict";
import {
  PAUSE_SEEK_FAILURE_CAP,
  classifySeekOutcome,
  seekFailureAdvance,
  seekFailureMaySleep,
  seekFailureReset,
  type SeekOutcomeLike,
} from "./pauseSeekCap42X2.ts";

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

const success: SeekOutcomeLike = { ok: true, cancelled: false, timedOut: 0, failed: 0, done: 1 };
const timeoutOutcome: SeekOutcomeLike = { ok: true, cancelled: false, timedOut: 1, failed: 0, done: 0 };
const partialTimeout: SeekOutcomeLike = { ok: true, cancelled: false, timedOut: 1, failed: 0, done: 1 };
const errorOutcome: SeekOutcomeLike = { ok: false, cancelled: false, timedOut: 0, failed: 0, done: 0 };
const cancelledOutcome: SeekOutcomeLike = { ok: false, cancelled: true, timedOut: 0, failed: 0, done: 0 };
// failed-only nhưng ok && timedOut === 0 → đi nhánh VẼ trong preview.tsx,
// skip của nó thuộc cap W2, không thuộc cap này.
const failedOnly: SeekOutcomeLike = { ok: true, cancelled: false, timedOut: 0, failed: 1, done: 0 };

console.log("== classifySeekOutcome ==");
ok("timeout (kể cả một phần xong) → 'timeout'", () => {
  assert.equal(classifySeekOutcome(timeoutOutcome), "timeout");
  assert.equal(classifySeekOutcome(partialTimeout), "timeout");
});
ok("ok=false không-cancelled → 'error'", () => {
  assert.equal(classifySeekOutcome(errorOutcome), "error");
});
ok("cancelled → null (không phải lỗi, không đếm)", () => {
  assert.equal(classifySeekOutcome(cancelledOutcome), null);
});
ok("thành công → null", () => {
  assert.equal(classifySeekOutcome(success), null);
});
ok("failed-only (nhánh vẽ, cap W2) → null, không đếm trùng", () => {
  assert.equal(classifySeekOutcome(failedOnly), null);
});

console.log("== seekFailureAdvance / seekFailureReset ==");
ok("cap đúng 10", () => {
  assert.equal(PAUSE_SEEK_FAILURE_CAP, 10);
});
ok("thất bại tăng đếm, chưa cạn dưới cap", () => {
  assert.deepEqual(seekFailureAdvance("timeout", 0), { consecutiveFailures: 1, exhausted: false, kind: "timeout" });
  assert.deepEqual(seekFailureAdvance("timeout", 8), { consecutiveFailures: 9, exhausted: false, kind: "timeout" });
});
ok("thất bại chạm đúng cap → cạn", () => {
  assert.deepEqual(seekFailureAdvance("timeout", 9), { consecutiveFailures: 10, exhausted: true, kind: "timeout" });
});
ok("kind mới nhất thắng nhưng đếm vẫn liên tiếp", () => {
  assert.deepEqual(seekFailureAdvance("error", 9), { consecutiveFailures: 10, exhausted: true, kind: "error" });
  assert.deepEqual(seekFailureAdvance("error", 2), { consecutiveFailures: 3, exhausted: false, kind: "error" });
});
ok("reset về trạng thái rỗng", () => {
  assert.deepEqual(seekFailureReset(), { consecutiveFailures: 0, exhausted: false, kind: null });
});

console.log("== seekFailureMaySleep ==");
ok("cạn + không seek bay + đúng t → được ngủ", () => {
  assert.equal(seekFailureMaySleep(true, false, 2, 2), true);
});
ok("chưa cạn → không ngủ kiểu bỏ cuộc", () => {
  assert.equal(seekFailureMaySleep(false, false, 2, 2), false);
});
ok("seek đang bay → không ngủ", () => {
  assert.equal(seekFailureMaySleep(true, true, 2, 2), false);
});
ok("đã scrub sang t khác / lastRequested null → không ngủ kiểu bỏ cuộc", () => {
  assert.equal(seekFailureMaySleep(true, false, 3, 2), false);
  assert.equal(seekFailureMaySleep(true, false, null, 2), false);
});

// --- Mô phỏng vòng lặp nhánh pause + scheduleNext (công thức thật):
// request seek mới khi t !== lastDrawn && t !== lastRequested (và reset
// cap ở đó); .then timeout/error → chưa cạn thì reset lastRequested
// (tick sau retry), đã cạn thì GIỮ lastRequested = t (guard chặn
// request mới) và ngủ kiểu bỏ cuộc; tick vẽ lại không render khi đã
// cạn seek; cancelled không đếm; seek thành công vào nhánh vẽ thì
// reset chuỗi thất bại.
console.log("== mô phỏng vòng lặp nhánh pause có cap seek ==");
interface LoopState {
  lastDrawn: number | null;
  lastRequested: number | null;
  pendingSeek: boolean;
  playhead: number;
  playing: boolean;
  redrawFlag: boolean;
  seekFailures: number;
  seekExhausted: boolean;
  seekKind: "timeout" | "error" | null;
  seekTarget: number | null;
  seekRequests: number;
}
function fresh(t: number): LoopState {
  return { lastDrawn: null, lastRequested: null, pendingSeek: false, playhead: t, playing: false, redrawFlag: false, seekFailures: 0, seekExhausted: false, seekKind: null, seekTarget: null, seekRequests: 0 };
}
function canSleep(s: LoopState): boolean {
  if (s.playing || s.pendingSeek || s.redrawFlag) return false;
  if (s.playhead === s.lastDrawn && s.lastRequested === s.playhead) return true;
  return seekFailureMaySleep(s.seekExhausted, s.pendingSeek, s.lastRequested, s.playhead);
}
function requestSeek(s: LoopState): void {
  // Nhánh request-seek trong preview.tsx: cap W2 reset vô điều kiện,
  // nhưng cap seek CHỈ reset khi t khác target đang đếm — retry cùng
  // t (nhánh else đã mở guard) phải giữ đếm, nếu không cap không bao
  // giờ chạm (lỗi thiết kế đã bắt được ở lượt test đầu của luồng này).
  if (s.playhead === s.lastDrawn || s.playhead === s.lastRequested) return;
  if (s.seekTarget !== null && s.seekTarget !== s.playhead) {
    const r = seekFailureReset();
    s.seekFailures = r.consecutiveFailures;
    s.seekExhausted = r.exhausted;
    s.seekKind = r.kind;
    s.seekTarget = null;
  }
  s.lastRequested = s.playhead;
  s.pendingSeek = true;
  s.seekRequests++;
}
function settleSeek(s: LoopState, outcome: SeekOutcomeLike): void {
  // .then của seek: gen mới nhất, pendingSeek tắt trước khi xét nhánh.
  s.pendingSeek = false;
  if (outcome.ok && outcome.timedOut === 0 && s.lastRequested === s.playhead) {
    // Nhánh vẽ: seek thành công → chuỗi thất bại đứt (dù vẽ có skip
    // thì skip thuộc cap W2, không thuộc cap này).
    const r = seekFailureReset();
    s.seekFailures = r.consecutiveFailures;
    s.seekExhausted = r.exhausted;
    s.seekKind = r.kind;
    s.seekTarget = null;
    return;
  }
  if (s.lastRequested !== s.playhead) return; // request mới hơn đã tới
  const kind = classifySeekOutcome(outcome);
  if (kind === null) {
    // Cancelled hoặc không phân loại được: hành vi cũ — mở guard retry.
    s.lastRequested = null;
    return;
  }
  const adv = seekFailureAdvance(kind, s.seekFailures);
  s.seekFailures = adv.consecutiveFailures;
  s.seekExhausted = adv.exhausted;
  s.seekKind = adv.kind;
  s.seekTarget = s.playhead;
  if (!adv.exhausted) s.lastRequested = null; // tick sau retry như cũ
  // Đã cạn: GIỮ lastRequested = t → guard chặn request mới, ngủ kiểu bỏ cuộc.
}
function resetLikeJustPaused(s: LoopState): void {
  s.lastDrawn = null;
  s.lastRequested = null;
  const r = seekFailureReset();
  s.seekFailures = r.consecutiveFailures;
  s.seekExhausted = r.exhausted;
  s.seekKind = r.kind;
  s.seekTarget = null;
}

ok("TARGET: retry cùng t giữ đếm, request t mới mới reset (bẫy reset vô điều kiện)", () => {
  const s = fresh(2);
  requestSeek(s);
  settleSeek(s, timeoutOutcome);
  requestSeek(s); // retry cùng t: guard đã mở, request mới chạy
  assert.equal(s.seekFailures, 1); // KHÔNG reset về 0
  assert.equal(s.seekTarget, 2);
  settleSeek(s, timeoutOutcome);
  assert.equal(s.seekFailures, 2);
  s.playhead = 3; // scrub sang t mới
  requestSeek(s);
  assert.equal(s.seekFailures, 0);
  assert.equal(s.seekTarget, null);
});

ok("MEDIA HỎNG DẠNG TIMEOUT: 10 lần timeout → cạn cap → ngủ, không request thêm", () => {
  const s = fresh(2);
  for (let i = 0; i < 10; i++) {
    requestSeek(s);
    assert.equal(canSleep(s), false); // đang seek bay / chưa cạn
    settleSeek(s, timeoutOutcome);
  }
  assert.equal(s.seekFailures, 10);
  assert.equal(s.seekExhausted, true);
  assert.equal(s.seekKind, "timeout");
  assert.equal(s.lastRequested, 2); // GIỮ — guard chặn request mới
  assert.equal(canSleep(s), true); // NGỦ dù lastDrawn !== playhead
  const reqBefore = s.seekRequests;
  requestSeek(s); // tick sau khi cạn: guard chặn, không request mới
  assert.equal(s.seekRequests, reqBefore);
  assert.equal(canSleep(s), true);
});

ok("MEDIA HỎNG DẠNG ERROR: chuỗi error xen timeout vẫn đếm liên tiếp tới cap", () => {
  const s = fresh(2);
  const seq: SeekOutcomeLike[] = [errorOutcome, timeoutOutcome, errorOutcome, timeoutOutcome, errorOutcome, timeoutOutcome, errorOutcome, timeoutOutcome, errorOutcome, timeoutOutcome];
  for (const o of seq) {
    requestSeek(s);
    settleSeek(s, o);
  }
  assert.equal(s.seekFailures, 10);
  assert.equal(s.seekExhausted, true);
  assert.equal(s.seekKind, "timeout"); // kind mới nhất thắng
  assert.equal(canSleep(s), true);
});

ok("CHƯA CẠN: timeout → mở guard → tick sau request lại (hành vi cũ giữ nguyên)", () => {
  const s = fresh(2);
  requestSeek(s);
  settleSeek(s, timeoutOutcome);
  assert.equal(s.seekFailures, 1);
  assert.equal(s.seekExhausted, false);
  assert.equal(s.lastRequested, null);
  assert.equal(canSleep(s), false);
  requestSeek(s);
  assert.equal(s.seekRequests, 2);
});

ok("CANCELLED không đếm, không cạn, mở guard như cũ", () => {
  const s = fresh(2);
  requestSeek(s);
  settleSeek(s, cancelledOutcome);
  assert.equal(s.seekFailures, 0);
  assert.equal(s.seekExhausted, false);
  assert.equal(s.lastRequested, null);
  assert.equal(canSleep(s), false);
});

ok("SEEK CHẬM RỒI XONG: 4 timeout rồi seek thành công → chuỗi reset, không cạn oan", () => {
  const s = fresh(2);
  for (let i = 0; i < 4; i++) {
    requestSeek(s);
    settleSeek(s, timeoutOutcome);
  }
  assert.equal(s.seekFailures, 4);
  requestSeek(s);
  settleSeek(s, success); // seeked muộn tới trong lần retry
  assert.equal(s.seekFailures, 0);
  assert.equal(s.seekExhausted, false);
  assert.equal(s.seekKind, null);
});

ok("RESET: scrub sang t mới sau khi cạn → seek mới, cap reset", () => {
  const s = fresh(2);
  for (let i = 0; i < 10; i++) {
    requestSeek(s);
    settleSeek(s, timeoutOutcome);
  }
  assert.equal(canSleep(s), true);
  s.playhead = 3; // user scrub
  assert.equal(canSleep(s), false); // t mới ≠ lastRequested → không ngủ kiểu bỏ cuộc
  requestSeek(s);
  assert.equal(s.seekFailures, 0);
  assert.equal(s.seekExhausted, false);
  assert.equal(s.seekKind, null);
  assert.equal(s.lastRequested, 3);
});

ok("RESET: justPaused/redrawFlag reset cap cùng lastDrawn/lastRequested", () => {
  const s = fresh(2);
  for (let i = 0; i < 10; i++) {
    requestSeek(s);
    settleSeek(s, timeoutOutcome);
  }
  assert.equal(s.seekExhausted, true);
  resetLikeJustPaused(s);
  assert.equal(s.seekFailures, 0);
  assert.equal(s.seekExhausted, false);
  assert.equal(canSleep(s), false);
});

console.log(`pauseSeekCap42X2: ${pass} passed`);
