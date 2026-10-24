/**
 * beatSync.test.ts — Test Node cho beatSync.ts (chạy: node beatSync.test.ts).
 * Node 24 strip types nên chạy trực tiếp được như captionFollow.test.ts.
 */
import { strict as assert } from "node:assert";
import { beatsToTimelineTimes, formatBeatTime } from "./beatSync.ts";

const clip = { start: 10, duration: 8, in: 2 };
// Beat media 2.5 -> timeline 10.5; 9.5 -> 17.5; ngoài khoảng thì bỏ.
assert.deepEqual(beatsToTimelineTimes([2.5, 9.5, 1.0, 11.0], clip), [10.5, 17.5]);
// Sát mép (< 0.05s) thì bỏ để không tạo mảnh vụn.
assert.deepEqual(beatsToTimelineTimes([2.02, 9.98], clip), []);
// Không có in -> mặc định 0.
assert.deepEqual(beatsToTimelineTimes([1.0], { start: 0, duration: 4 }), [1]);
// Sắp xếp tăng dần dù đầu vào lộn xộn.
assert.deepEqual(beatsToTimelineTimes([5.0, 3.0], { start: 0, duration: 8 }), [3, 5]);
// Format.
assert.equal(formatBeatTime(65.5), "1:05.50");
assert.equal(formatBeatTime(9.25), "0:09.25");

console.log("beatSync.test: PASS");
