// driftConfirmSkip103E4.test.ts — Phase 9 đợt 103, luồng E4: vị ngữ bỏ qua
// lần vẽ ở tick xác nhận drift đầu tiên (overCount 0→1, seek chưa phát).
// Chạy:
//   node --experimental-strip-types apps/web/src/lib/driftConfirmSkip103E4.test.ts
import assert from "node:assert/strict";
import { shouldSkipRenderWhileDriftConfirmPending } from "./driftConfirmSkip103E4.ts";

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

console.log("== driftConfirmSkip103E4: shouldSkipRenderWhileDriftConfirmPending ==");
const elV = { id: "video-fwd" };
const elV2 = { id: "video-fwd-2" };
const elA = { id: "audio" };
const elR = { id: "video-rev" };
const fwd = { tag: "VIDEO", reverse: false, el: elV };
const fwd2 = { tag: "VIDEO", reverse: false, el: elV2 };
const aud = { tag: "AUDIO", reverse: false, el: elA };
const rev = { tag: "VIDEO", reverse: true, el: elR };

ok("video xuôi pending -> true (tick đầu sau nhảy)", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [fwd], new Set([elV])), true));
ok("không pending -> false", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [fwd], new Set()), false));
ok("pending element khác -> false", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [fwd], new Set([elV2])), false));
ok("audio pending -> false (audio không vẽ gì)", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [aud], new Set([elA])), false));
ok("video reverse pending -> false (step-seek mỗi frame, drift lớn là bình thường)", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [rev], new Set([elR])), false));
ok("phát ngược toàn cục -> false dù video pending", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(true, [fwd], new Set([elV])), false));
ok("nhiều active, 1 video xuôi pending -> true", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [fwd2, aud, fwd], new Set([elV])), true));
ok("nhiều active, chỉ audio/reverse pending -> false", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [fwd, aud, rev], new Set([elA, elR])), false));
ok("actives rỗng -> false", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [], new Set([elV])), false));
ok("pending set chứa element lạ (không trong actives) -> false", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [fwd], new Set([{ id: "la" }])), false));
ok("video xuôi pending + phát ngược false + audio pending -> true (video quyết định)", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [fwd, aud], new Set([elV, elA])), true));
ok("tag chữ thường 'video' -> false (khớp đúng tagName 'VIDEO' như N3)", () =>
  assert.equal(shouldSkipRenderWhileDriftConfirmPending(false, [{ tag: "video", reverse: false, el: elV }], new Set([elV])), false));

console.log(`\n${pass}/12 PASS`);
