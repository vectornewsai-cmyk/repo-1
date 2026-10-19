/**
 * trackflags.test.mjs — Unit test cho trackFlags.ts (R1-054).
 * Chạy: bash test-trackflags.sh
 */
import assert from "node:assert";
import { test } from "node:test";

// trackFlags.ts chỉ dùng `import type` (bị xóa khi compile) nên bản JS
// compile ra không có dependency — import trực tiếp được.
import {
  toggleTrackFlag,
  getTrackFlag,
  isTrackLocked,
  isTrackEditable,
  visibleFlagsFor,
} from "/tmp/vcut-test-trackflags/trackFlags.js";

const mkTrack = (kind, flags = {}) => ({ id: "t1", kind, clips: [], ...flags });

test("toggleTrackFlag bật/tắt và immutable", () => {
  const t = mkTrack("video");
  const t1 = toggleTrackFlag(t, "muted");
  assert.strictEqual(t1.muted, true);
  assert.strictEqual(t.muted, undefined, "không mutate input");
  const t2 = toggleTrackFlag(t1, "muted");
  assert.strictEqual(t2.muted, false);
});

test("toggleTrackFlag giữ nguyên các field khác", () => {
  const t = mkTrack("audio", { label: "Nhạc", locked: true });
  const t1 = toggleTrackFlag(t, "muted");
  assert.strictEqual(t1.label, "Nhạc");
  assert.strictEqual(t1.locked, true);
  assert.strictEqual(t1.muted, true);
});

test("getTrackFlag: undefined → false", () => {
  const t = mkTrack("video");
  assert.strictEqual(getTrackFlag(t, "muted"), false);
  assert.strictEqual(getTrackFlag(t, "locked"), false);
  assert.strictEqual(getTrackFlag(t, "hidden"), false);
  assert.strictEqual(getTrackFlag(undefined, "locked"), false);
  assert.strictEqual(getTrackFlag(null, "locked"), false);
});

test("isTrackLocked / isTrackEditable", () => {
  assert.strictEqual(isTrackLocked(mkTrack("video", { locked: true })), true);
  assert.strictEqual(isTrackLocked(mkTrack("video")), false);
  assert.strictEqual(isTrackEditable(mkTrack("video", { locked: true })), false);
  assert.strictEqual(isTrackEditable(mkTrack("video")), true);
});

test("visibleFlagsFor theo kind", () => {
  assert.deepStrictEqual(visibleFlagsFor("audio"), ["muted", "locked"]);
  assert.deepStrictEqual(visibleFlagsFor("video"), ["muted", "locked", "hidden"]);
  assert.deepStrictEqual(visibleFlagsFor("text"), ["locked", "hidden"]);
  assert.deepStrictEqual(visibleFlagsFor("sticker"), ["locked", "hidden"]);
  assert.deepStrictEqual(visibleFlagsFor("image"), ["locked", "hidden"]);
});
