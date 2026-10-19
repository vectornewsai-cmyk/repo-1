/**
 * timebase.test.ts — Test cho frame-accurate timebase (R1-055).
 *
 * Chạy bằng:
 *   npx tsc src/timebase.ts src/timebase.test.ts --outDir /tmp/tb-test \
 *     --module nodenext --target es2022 --moduleResolution nodenext --skipLibCheck
 *   node --test /tmp/tb-test/timebase.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FPS,
  formatTimecode,
  frameDuration,
  isFrameAligned,
  normalizeFps,
  snapToFrame,
  snapToFrameCeil,
  snapToFrameFloor,
  toFrames,
  toSeconds,
} from "./timebase.js";

// ---- toFrames ----
test("toFrames: 0 → 0", () => assert.equal(toFrames(0, 30), 0));
test("toFrames: 1/30s @30fps → 1", () => assert.equal(toFrames(1 / 30, 30), 1));
test("toFrames: 0.0333s @30fps → 1 (case R1-055)", () => assert.equal(toFrames(0.0333, 30), 1));
test("toFrames: 0.05s @30fps → 2 (1.5 làm tròn lên)", () => assert.equal(toFrames(0.05, 30), 2));
test("toFrames: 1s @30fps → 30", () => assert.equal(toFrames(1, 30), 30));
test("toFrames: 0.5s @60fps → 30", () => assert.equal(toFrames(0.5, 60), 30));
test("toFrames: số âm → 0", () => assert.equal(toFrames(-5, 30), 0));
test("toFrames: fps sai → dùng default 30", () => assert.equal(toFrames(10, 0), 300));

// ---- toSeconds ----
test("toSeconds: 1 frame @30fps = 1/30", () => assert.equal(toSeconds(1, 30), 1 / 30));
test("toSeconds: 30 frames @30fps = 1", () => assert.equal(toSeconds(30, 30), 1));
test("toSeconds: 0 → 0", () => assert.equal(toSeconds(0, 30), 0));

// ---- snapToFrame ----
test("snapToFrame: 0.0333s @30fps → 1/30 (trim về frame 1)", () =>
  assert.equal(snapToFrame(0.0333, 30), 1 / 30));
test("snapToFrame: 0.05s @30fps → 2/30", () => assert.equal(snapToFrame(0.05, 30), 2 / 30));
test("snapToFrame: đã thẳng frame thì giữ nguyên", () => assert.equal(snapToFrame(1, 30), 1));
test("snapToFrameFloor: 0.05s @30fps → 1/30 (không vượt)", () =>
  assert.equal(snapToFrameFloor(0.05, 30), 1 / 30));
test("snapToFrameCeil: 0.05s @30fps → 2/30", () =>
  assert.equal(snapToFrameCeil(0.05, 30), 2 / 30));

// ---- formatTimecode ----
test("formatTimecode: 0 → 00:00:00:00", () =>
  assert.equal(formatTimecode(0, 30), "00:00:00:00"));
test("formatTimecode: 1.5s @30fps → 00:00:01:15", () =>
  assert.equal(formatTimecode(1.5, 30), "00:00:01:15"));
test("formatTimecode: 61s @30fps → 00:01:01:00", () =>
  assert.equal(formatTimecode(61, 30), "00:01:01:00"));
test("formatTimecode: 0.5s @60fps → 00:00:00:30", () =>
  assert.equal(formatTimecode(0.5, 60), "00:00:00:30"));

// ---- helpers ----
test("normalizeFps: fps xấu → 30", () => {
  assert.equal(normalizeFps(0), DEFAULT_FPS);
  assert.equal(normalizeFps(NaN), DEFAULT_FPS);
  assert.equal(normalizeFps(-24), DEFAULT_FPS);
  assert.equal(normalizeFps(undefined), DEFAULT_FPS);
  assert.equal(normalizeFps(60), 60);
});
test("frameDuration: 30fps → 1/30", () => assert.equal(frameDuration(30), 1 / 30));
test("isFrameAligned: phát hiện lệch frame", () => {
  assert.equal(isFrameAligned(1 / 30, 30), true);
  assert.equal(isFrameAligned(0.0333, 30), false);
});
test("round-trip: toSeconds(toFrames(t)) = snapToFrame(t)", () => {
  for (const t of [0, 0.0333, 0.1, 1.234, 61.75]) {
    assert.equal(toSeconds(toFrames(t, 30), 30), snapToFrame(t, 30));
  }
});
