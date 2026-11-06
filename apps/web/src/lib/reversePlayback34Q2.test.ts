// reversePlayback34Q2.test.ts — Khóa cờ opt-in WebCodecs của đợt 34 Q2.
// Chạy bằng Node type-stripping:
//   node --experimental-strip-types apps/web/src/lib/reversePlayback34Q2.test.ts
// (chạy từ gốc repo). Chỉ test logic thuần; VideoDecoder/VideoFrame thật
// thuộc về probe browser, không mock ở đây.
// LƯU Ý: ngân sách cửa sổ (windowFramesForMeasuredBudget, hằng 75
// frame chốt từ số đo thật đợt này) KHÔNG test ở file này vì reverseWebcodecs.ts import
// "./mp4Demux" không đuôi theo chuẩn bundler của repo nên Node
// strip-types không resolve được — phần đó kiểm chứng bằng probe
// browser (assert trong trang probe) + build CJS scratch, xem LIMITS Q2.
import assert from "node:assert/strict";
import {
  resolveReverseEngine,
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

ok("mặc định: cờ tắt -> element dù browser có VideoDecoder", () => {
  assert.equal(resolveReverseEngine(false, true), "element");
});

ok("cờ tắt + không có VideoDecoder -> element", () => {
  assert.equal(resolveReverseEngine(false, false), "element");
});

ok("cờ bật + có VideoDecoder -> webcodecs", () => {
  assert.equal(resolveReverseEngine(true, true), "webcodecs");
});

ok("cờ bật nhưng không có VideoDecoder -> rơi về element, không crash", () => {
  assert.equal(resolveReverseEngine(true, false), "element");
});

console.log(`reversePlayback34Q2: ${pass} test pass`);
