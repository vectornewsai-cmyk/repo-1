// reversePlayback193P3.test.ts — Đợt 193 P3 khoản 1: scrub ngược tại biên.
// reverseScrubSeekTarget: scrub ngược lùi 1 ms (như stepping S6b đợt
// 192), scrub xuôi giữ nguyên target. Chạy bằng Node type-stripping:
//   node --experimental-strip-types apps/web/src/lib/reversePlayback193P3.test.ts
import assert from "node:assert/strict";
import {
  REVERSE_SEEK_BACKOFF_SEC,
  reverseScrubSeekTarget,
} from "./reversePlayback.ts";

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

ok("backoff = 1 ms (khớp S6b đợt 192)", () => {
  assert.equal(REVERSE_SEEK_BACKOFF_SEC, 0.001);
});

ok("scrub ngược tại biên: lùi đúng 1 ms (k=15/30/45)", () => {
  assert.equal(reverseScrubSeekTarget(15 / 30, true), 15 / 30 - 0.001);
  assert.equal(reverseScrubSeekTarget(30 / 30, true), 30 / 30 - 0.001);
  assert.equal(reverseScrubSeekTarget(45 / 30, true), 45 / 30 - 0.001);
});

ok("scrub ngược ngoài lưới: lùi 1 ms, vẫn trong frame cũ (8,3 ms sau đầu frame)", () => {
  // s = 15/30 + 0,0083 → s − 1 ms vẫn trong frame 15 (probe S6b: đúng).
  const s = 15 / 30 + 0.0083;
  assert.equal(reverseScrubSeekTarget(s, true), s - 0.001);
  assert.ok(Math.floor((s - 0.001) * 30) === 15);
});

ok("scrub ngược tại 0 / âm / NaN → 0 (clamp như reverseSeekTarget)", () => {
  assert.equal(reverseScrubSeekTarget(0, true), 0);
  assert.equal(reverseScrubSeekTarget(-1, true), 0);
  assert.equal(reverseScrubSeekTarget(0.0005, true), 0);
});

ok("scrub xuôi: giữ nguyên target (biên + ngoài lưới + 0)", () => {
  assert.equal(reverseScrubSeekTarget(15 / 30, false), 15 / 30);
  assert.equal(reverseScrubSeekTarget(15 / 30 + 0.0083, false), 15 / 30 + 0.0083);
  assert.equal(reverseScrubSeekTarget(0, false), 0);
});

console.log(`reversePlayback193P3.test: ${pass} passed`);
