// driftConfirmSkip103E4.test.ts — Phase 9 đợt 103, luồng E4: vị ngữ bỏ qua
// lần vẽ ở tick xác nhận drift đầu tiên (overCount 0→1, seek chưa phát).
// Đợt 110 L1: thêm test combineSkipRender — tách tín hiệu giữ R2 khỏi
// tín hiệu bỏ vẽ (cơ chế CAP K1: E4 gộp vào boolean skip làm giữ R2 oan).
// Chạy:
//   node --experimental-strip-types apps/web/src/lib/driftConfirmSkip103E4.test.ts
import assert from "node:assert/strict";
import {
  combineSkipRender,
  shouldSkipRenderWhileDriftConfirmPending,
} from "./driftConfirmSkip103E4.ts";

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

console.log("== combineSkipRender (đợt 110 L1): tách tín hiệu giữ R2 khỏi tín hiệu bỏ vẽ ==");
let pass2 = 0;
function ok2(name: string, fn: () => void): void {
  try {
    fn();
    pass2++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

ok2("không gate nào -> không bỏ vẽ, không giữ", () =>
  assert.deepEqual(combineSkipRender(false, false), { skipRender: false, skipRenderSeeking: false }));
ok2("chỉ N3 (seeking) -> bỏ vẽ + giữ R2", () =>
  assert.deepEqual(combineSkipRender(true, false), { skipRender: true, skipRenderSeeking: true }));
ok2("chỉ E4 (drift-confirm, KHÔNG seeking) -> bỏ vẽ nhưng KHÔNG giữ R2 (pin hồi quy CAP K1)", () =>
  assert.deepEqual(combineSkipRender(false, true), { skipRender: true, skipRenderSeeking: false }));
ok2("cả N3 + E4 -> bỏ vẽ + giữ R2 (N3 quyết định cờ giữ)", () =>
  assert.deepEqual(combineSkipRender(true, true), { skipRender: true, skipRenderSeeking: true }));
ok2("E4 không bao giờ bật cờ giữ, dù kết hợp mọi đầu vào", () => {
  for (const n3 of [false, true]) {
    assert.equal(combineSkipRender(n3, true).skipRenderSeeking, n3);
    assert.equal(combineSkipRender(n3, true).skipRender, true);
  }
});

console.log(`\n${pass2}/5 PASS`);
