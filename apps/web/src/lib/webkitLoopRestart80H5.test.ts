// webkitLoopRestart80H5.test.ts — Đợt 80 luồng H5: khóa quyết định +
// hành vi phục hồi element ended trong preview (nợ W3 đợt 79).
//
// Chạy: node scripts/run-node-test.mjs apps/web/src/lib/webkitLoopRestart80H5.test.ts
// (chạy từ gốc repo). Hàm được test ở đây là code THẬT mà syncMedia
// trong preview.tsx gọi — không phải mô hình; hành vi trình duyệt nền
// (seek/play sau ended trên WebKitGTK) được khóa bằng probe headed
// benchmarks/render/webkit_loop_probe_80h5.mjs (xem
// docs/PHASE9_ROUND80_H5_WEBKIT_LOOP_LIMITS.md).
import assert from "node:assert/strict";
import {
  ENDED_RESTART_EPS_S,
  restartEndedElement,
  shouldRestartEndedElement,
  type EndedRestartElement,
} from "./webkitLoopRestart80H5.ts";

/** Fake element tối thiểu thỏa EndedRestartElement. */
function fakeEl(init: Partial<EndedRestartElement> & { throwOnSeek?: boolean }): EndedRestartElement & { seeks: number[] } {
  let ct = init.currentTime ?? 0;
  const el = {
    ended: init.ended ?? false,
    seeking: init.seeking ?? false,
    seeks: [] as number[],
    get currentTime() { return ct; },
    set currentTime(v: number) {
      if (init.throwOnSeek) throw new Error("seek failed");
      (el as { seeks: number[] }).seeks.push(v);
      ct = v;
    },
  };
  return el;
}

let pass = 0;
function check(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`ok - ${name}`);
}

// --- shouldRestartEndedElement ---
check("ended + không seeking → restart", () => {
  assert.equal(shouldRestartEndedElement(fakeEl({ ended: true })), true);
});
check("ended + đang seeking → KHÔNG restart (tránh seek chồng)", () => {
  assert.equal(shouldRestartEndedElement(fakeEl({ ended: true, seeking: true })), false);
});
check("chưa ended → KHÔNG restart", () => {
  assert.equal(shouldRestartEndedElement(fakeEl({ ended: false })), false);
});
check("chưa ended + đang seeking → KHÔNG restart", () => {
  assert.equal(shouldRestartEndedElement(fakeEl({ ended: false, seeking: true })), false);
});

// --- restartEndedElement ---
check("ended → seek tới target, trả true", () => {
  const el = fakeEl({ ended: true, currentTime: 2 });
  assert.equal(restartEndedElement(el, 1.5), true);
  assert.equal(el.currentTime, 1.5);
  assert.deepEqual(el.seeks, [1.5]);
});
check("ended nhưng đang seeking → không seek, trả false", () => {
  const el = fakeEl({ ended: true, seeking: true, currentTime: 2 });
  assert.equal(restartEndedElement(el, 1.5), false);
  assert.deepEqual(el.seeks, []);
});
check("chưa ended → không seek, trả false", () => {
  const el = fakeEl({ ended: false, currentTime: 1.5 });
  assert.equal(restartEndedElement(el, 1.5), false);
  assert.deepEqual(el.seeks, []);
});
check("target không hữu hạn (NaN) → không seek, trả false", () => {
  const el = fakeEl({ ended: true, currentTime: 2 });
  assert.equal(restartEndedElement(el, Number.NaN), false);
  assert.deepEqual(el.seeks, []);
});
check("đã ở đúng target (trong eps) → không seek vô ích", () => {
  const el = fakeEl({ ended: true, currentTime: 2 });
  assert.equal(restartEndedElement(el, 2 + ENDED_RESTART_EPS_S / 2), false);
  assert.deepEqual(el.seeks, []);
});
check("seek ném lỗi → trả false, không throw ra ngoài", () => {
  const el = fakeEl({ ended: true, currentTime: 2, throwOnSeek: true });
  assert.equal(restartEndedElement(el, 1.5), false);
});
check("seek tới 0 khi target là 0 (đầu clip) vẫn chạy", () => {
  const el = fakeEl({ ended: true, currentTime: 2 });
  assert.equal(restartEndedElement(el, 0), true);
  assert.equal(el.currentTime, 0);
});

console.log(`\nPASS webkitLoopRestart80H5: ${pass} check xanh`);
