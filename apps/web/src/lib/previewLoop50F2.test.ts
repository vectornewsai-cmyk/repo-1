// previewLoop50F2.test.ts — Đợt 50 luồng F2: khóa quyết định ngủ/tick
// của vòng lặp preview (§7.6) + trần tường 10 s cho chuỗi skip (§7.7).
//
// Chạy bằng node strip-types (từ gốc repo) — đợt 91 S2 đã thêm đuôi .ts
// cho 2 import trong previewLoop50F2.ts (pauseDraw41W2.ts,
// pauseSeekCap42X2.ts) nên strip-types phân giải được; trước đó lỗi
// ERR_MODULE_NOT_FOUND vì import extensionless. Cách cũ bằng esbuild
// bundle vẫn chạy được:
//   node --experimental-strip-types apps/web/src/lib/previewLoop50F2.test.ts
//   ../../node_modules/.bin/esbuild apps/web/src/lib/previewLoop50F2.test.ts \
//     --bundle --platform=node --format=esm --outfile=/tmp/f2-previewLoop50F2.test.mjs \
//     && node /tmp/f2-previewLoop50F2.test.mjs
// (chạy từ gốc repo). Hàm thuần được test ở đây là code THẬT mà
// scheduleNext trong preview.tsx gọi — không phải mô hình; phần nối
// dây (finally → scheduleNext, cờ ctxMissing, mốc streak) được khóa
// bằng harness headed pause50F2-preview-loop.mjs (phase B/A/C/E).
//
// Đỏ-trước: cả hai module mới (previewLoop50F2.ts,
// pauseRetryWallExhausted trong pauseDraw41W2.ts) đều chưa tồn tại ở
// đầu đợt (git HEAD không có) nên test này import lỗi trước khi sửa;
// xanh-sau khi viết lib + nối scheduleNext.

import assert from "node:assert/strict";
import {
  PAUSE_RETRY_WALL_CAP_MS,
  PAUSE_RETRY_WALL_MIN_SKIPS,
  pauseRetryWallExhausted,
} from "./pauseDraw41W2.ts";
import {
  previewLoopShouldSleep,
  type PreviewLoopSleepState,
} from "./previewLoop50F2.ts";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log("ok " + name);
  } catch (e) {
    console.error("FAIL " + name + ": " + String((e as Error)?.message ?? e));
    process.exitCode = 1;
  }
}

// Trạng thái ngủ thường: pause, không seek bay, không cờ vẽ lại,
// playhead đã vẽ đúng, không cạn cap nào.
function sleepingState(over: Partial<PreviewLoopSleepState> = {}): PreviewLoopSleepState {
  return {
    playing: false,
    pendingSeek: false,
    redrawFlag: false,
    playhead: 2.5,
    lastDrawn: 2.5,
    lastRequested: 2.5,
    pauseRetryExhausted: false,
    seekFailureExhausted: false,
    surfaceMissing: false,
    ...over,
  };
}

// ---- §7.6: previewLoopShouldSleep ----

ok("F2-S1 ngu khi pause + da ve dung playhead", () => {
  assert.equal(previewLoopShouldSleep(sleepingState()), true);
});

ok("F2-S2 surfaceMissing thi KHONG ngu (chua co canvas/wrap)", () => {
  assert.equal(previewLoopShouldSleep(sleepingState({ surfaceMissing: true })), false);
});

ok("F2-S3 surfaceMissing thi KHONG ngu ngay ca khi dang phat", () => {
  // Thứ tự kiểm tra: surfaceMissing được xét trước mọi điều kiện khác
  // (không ngủ trong cả hai trường hợp, nhưng lý do khác nhau).
  assert.equal(previewLoopShouldSleep(sleepingState({ surfaceMissing: true, playing: true })), false);
});

ok("F2-S4 ctx null cung la surfaceMissing (khong ngu, tick tiep)", () => {
  // Cùng một cờ surfaceMissing mà preview.tsx set từ ctxMissing — ctx
  // null hay canvas mất đều đi chung một quyết định: không ngủ.
  assert.equal(previewLoopShouldSleep(sleepingState({ surfaceMissing: true, lastDrawn: null, lastRequested: null })), false);
});

ok("F2-S5 dang phat thi khong ngu", () => {
  assert.equal(previewLoopShouldSleep(sleepingState({ playing: true })), false);
});

ok("F2-S6 seek dang bay thi khong ngu", () => {
  assert.equal(previewLoopShouldSleep(sleepingState({ pendingSeek: true })), false);
});

ok("F2-S7 redrawFlag thi khong ngu", () => {
  assert.equal(previewLoopShouldSleep(sleepingState({ redrawFlag: true })), false);
});

ok("F2-S8 chua ve xong (lastDrawn khac playhead) thi khong ngu", () => {
  assert.equal(previewLoopShouldSleep(sleepingState({ lastDrawn: null })), false);
  assert.equal(previewLoopShouldSleep(sleepingState({ lastDrawn: 1.5 })), false);
});

ok("F2-S9 can cap ve lai o dung playhead thi ngu kieu bo cuoc", () => {
  assert.equal(
    previewLoopShouldSleep(sleepingState({ lastDrawn: null, pauseRetryExhausted: true })),
    true,
  );
});

ok("F2-S10 can cap ve lai nhung lastRequested khac playhead thi khong ngu", () => {
  assert.equal(
    previewLoopShouldSleep(sleepingState({ lastDrawn: null, lastRequested: 1.5, pauseRetryExhausted: true })),
    false,
  );
});

ok("F2-S11 can cap seek o dung playhead thi ngu kieu seek-bo-cuoc", () => {
  assert.equal(
    previewLoopShouldSleep(sleepingState({ lastDrawn: null, seekFailureExhausted: true })),
    true,
  );
});

ok("F2-S12 can cap seek nhung seek dang bay thi khong ngu", () => {
  assert.equal(
    previewLoopShouldSleep(sleepingState({ lastDrawn: null, seekFailureExhausted: true, pendingSeek: true })),
    false,
  );
});

ok("F2-S13 duong ngu thuong doi lastRequested === playhead", () => {
  assert.equal(previewLoopShouldSleep(sleepingState({ lastRequested: 1.5 })), false);
});

// ---- §7.7: pauseRetryWallExhausted ----

ok("F2-W1 chua co skip nao (streak null) thi khong can tran tuong", () => {
  assert.equal(pauseRetryWallExhausted(0, null, 60_000), false);
});

ok("F2-W2 du thoi gian nhung chua du so skip thi khong can", () => {
  assert.equal(pauseRetryWallExhausted(PAUSE_RETRY_WALL_MIN_SKIPS - 1, 0, 60_000), false);
});

ok("F2-W3 du so skip nhung chua du thoi gian thi khong can", () => {
  assert.equal(
    pauseRetryWallExhausted(PAUSE_RETRY_WALL_MIN_SKIPS, 0, PAUSE_RETRY_WALL_CAP_MS - 1),
    false,
  );
});

ok("F2-W4 du ca so skip va thoi gian thi can tran tuong", () => {
  assert.equal(
    pauseRetryWallExhausted(PAUSE_RETRY_WALL_MIN_SKIPS, 0, PAUSE_RETRY_WALL_CAP_MS),
    true,
  );
});

ok("F2-W5 vuot ca hai nguong thi can (truong hop baseline: 600 skip, 103 s)", () => {
  assert.equal(pauseRetryWallExhausted(600, 0, 103_600), true);
});

ok("F2-W6 hang so tran tuong dung nhu thiet ke (10 s, toi thieu 30 skip)", () => {
  assert.equal(PAUSE_RETRY_WALL_CAP_MS, 10_000);
  assert.equal(PAUSE_RETRY_WALL_MIN_SKIPS, 30);
});

ok("F2-W7 chuoi moi sau khoang trong rAF dai khong ngu ngay (it skip)", () => {
  // Tab ẩn 60 s rồi hiện: streakSince cũ, tick đầu có now - since lớn
  // nhưng chuỗi mới chỉ có 1 skip → trần tường chưa chạm; vòng lặp
  // vẫn thử vẽ lại như thường thay vì ngủ ngay với nền đen.
  assert.equal(pauseRetryWallExhausted(1, 0, 61_000), false);
});

console.log(`previewLoop50F2: ${pass} passed`);
