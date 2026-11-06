// holdFrame.test.ts — Khóa bảng quyết định draw/hold/skip của J4 (đợt 26).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/holdFrame.test.ts
// (chạy từ gốc repo). Hàm thuần nên test được toàn bộ ma trận; phần nối
// cache canvas trong preview.tsx chỉ kiểm chứng bằng tsc + build +
// harness trình duyệt (xem PHASE9_ROUND26_J4_HOLD_FRAME_LIMITS.md).
import assert from "node:assert/strict";
import { decideVideoFrame, type VideoFrameReadiness } from "./holdFrame.ts";

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
const base: VideoFrameReadiness = { readyState: 4, videoWidth: 1280, paused: false, hasHeldFrame: true };
const at = (p: Partial<VideoFrameReadiness>): VideoFrameReadiness => ({ ...base, ...p });

ok("frame sẵn (RS>=2, width>0) + đang phát -> draw", () => {
  assert.equal(decideVideoFrame(at({ readyState: 4, paused: false })), "draw");
  assert.equal(decideVideoFrame(at({ readyState: 3, paused: false })), "draw");
  assert.equal(decideVideoFrame(at({ readyState: 2, paused: false })), "draw");
});
ok("frame sẵn + paused (seek-draw) -> draw", () => {
  assert.equal(decideVideoFrame(at({ readyState: 4, paused: true })), "draw");
  assert.equal(decideVideoFrame(at({ readyState: 2, paused: true, hasHeldFrame: false })), "draw");
});
ok("I6 §5h: RS=1 + width>0 + đang phát + đã có frame tốt -> hold (không đen)", () => {
  assert.equal(decideVideoFrame(at({ readyState: 1, videoWidth: 1280, paused: false, hasHeldFrame: true })), "hold");
});
ok("RS=0 (decoder đói hoàn toàn) + đang phát + đã có frame tốt -> hold", () => {
  assert.equal(decideVideoFrame(at({ readyState: 0, videoWidth: 0, paused: false, hasHeldFrame: true })), "hold");
});
ok("thiếu frame + đang phát + CHƯA từng có frame tốt -> skip (không có gì để giữ)", () => {
  assert.equal(decideVideoFrame(at({ readyState: 1, paused: false, hasHeldFrame: false })), "skip");
  assert.equal(decideVideoFrame(at({ readyState: 0, paused: false, hasHeldFrame: false })), "skip");
});
ok("thiếu frame + PAUSED + đã có frame tốt -> skip (không vẽ frame cũ sai vị trí sau scrub)", () => {
  assert.equal(decideVideoFrame(at({ readyState: 1, paused: true, hasHeldFrame: true })), "skip");
  assert.equal(decideVideoFrame(at({ readyState: 0, paused: true, hasHeldFrame: true })), "skip");
});
ok("RS>=2 nhưng width=0 + đang phát + đã có frame tốt -> hold (không vẽ element 0px)", () => {
  assert.equal(decideVideoFrame(at({ readyState: 4, videoWidth: 0, paused: false, hasHeldFrame: true })), "hold");
});
ok("RS>=2 nhưng width=0 + paused -> skip", () => {
  assert.equal(decideVideoFrame(at({ readyState: 4, videoWidth: 0, paused: true, hasHeldFrame: true })), "skip");
});
ok("biên: RS=2 là draw, RS=1 là hold/skip — không lệch 1", () => {
  assert.equal(decideVideoFrame(at({ readyState: 2, paused: false, hasHeldFrame: false })), "draw");
  assert.equal(decideVideoFrame(at({ readyState: 1, paused: false, hasHeldFrame: true })), "hold");
});

// --- Đợt 27 K4: stepping (phát ngược) ---
ok("K4: PAUSED + stepping + RS=1 + đã có frame tốt -> hold (phát ngược không skip)", () => {
  assert.equal(decideVideoFrame(at({ readyState: 1, paused: true, stepping: true, hasHeldFrame: true })), "hold");
  assert.equal(decideVideoFrame(at({ readyState: 0, paused: true, stepping: true, hasHeldFrame: true })), "hold");
});
ok("K4: PAUSED + stepping + CHƯA có frame tốt -> skip (không có gì để giữ)", () => {
  assert.equal(decideVideoFrame(at({ readyState: 1, paused: true, stepping: true, hasHeldFrame: false })), "skip");
});
ok("K4: PAUSED + không stepping vẫn skip như cũ (scrub thật không bị đổi hành vi)", () => {
  assert.equal(decideVideoFrame(at({ readyState: 1, paused: true, stepping: false, hasHeldFrame: true })), "skip");
  assert.equal(decideVideoFrame(at({ readyState: 1, paused: true, hasHeldFrame: true })), "skip");
});
ok("K4: stepping không thắng draw — frame sẵn vẫn draw, không hold thừa", () => {
  assert.equal(decideVideoFrame(at({ readyState: 4, paused: true, stepping: true, hasHeldFrame: true })), "draw");
});

console.log(`holdFrame: ${pass}/13 test pass`);
if (process.exitCode) console.log("holdFrame: CÓ TEST FAIL");
