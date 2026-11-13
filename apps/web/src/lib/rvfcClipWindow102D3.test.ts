// rvfcClipWindow102D3.test.ts — Phase 9 đợt 102, luồng D3: vị ngữ cửa sổ
// timeline của pump rVFC (dùng chung cho check A6 trong rvfcCallback và
// kill đồng bộ khi playhead nhảy). Chạy:
//   node --experimental-strip-types apps/web/src/lib/rvfcClipWindow102D3.test.ts
import assert from "node:assert/strict";
import { isPlayheadOutsideClipWindow, shouldDeferRvfcPumpCreation } from "./rvfcClipWindow.ts";

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

console.log("== rvfcClipWindow102D3: isPlayheadOutsideClipWindow ==");
const START = 3;
const DUR = 3; // cửa sổ [3, 6)
ok("giữa cửa sổ -> false", () => assert.equal(isPlayheadOutsideClipWindow(4.5, START, DUR), false));
ok("đúng start -> false (nửa mở, start thuộc cửa sổ)", () => assert.equal(isPlayheadOutsideClipWindow(3, START, DUR), false));
ok("sát trước end (5.999) -> false", () => assert.equal(isPlayheadOutsideClipWindow(5.999, START, DUR), false));
ok("đúng end (6) -> true (clip đã hết active)", () => assert.equal(isPlayheadOutsideClipWindow(6, START, DUR), true));
ok("sau end -> true", () => assert.equal(isPlayheadOutsideClipWindow(6.15, START, DUR), true));
ok("trước start -> true", () => assert.equal(isPlayheadOutsideClipWindow(2.99, START, DUR), true));
ok("playhead 0, cửa sổ clip sau -> true", () => assert.equal(isPlayheadOutsideClipWindow(0, START, DUR), true));
// Chồng lấn/PiP: cùng playhead, cửa sổ A chứa, cửa sổ B không — vị ngữ
// phân biệt đúng từng clip (kill chỉ clip ngoài cửa sổ, không kill oan).
ok("overlap: ph trong A, ngoài B -> A false, B true", () => {
  assert.equal(isPlayheadOutsideClipWindow(4.5, 3, 3), false);
  assert.equal(isPlayheadOutsideClipWindow(4.5, 6, 3), true);
});
// Guard: không cửa sổ ghi nhận / playhead không hữu hạn -> không kill oan.
ok("duration 0 -> false (chưa ghi nhận cửa sổ)", () => assert.equal(isPlayheadOutsideClipWindow(9, START, 0), false));
ok("duration âm -> false", () => assert.equal(isPlayheadOutsideClipWindow(9, START, -3), false));
ok("playhead NaN -> false", () => assert.equal(isPlayheadOutsideClipWindow(NaN, START, DUR), false));
ok("playhead Infinity -> false", () => assert.equal(isPlayheadOutsideClipWindow(Infinity, START, DUR), false));
ok("playhead -Infinity -> false", () => assert.equal(isPlayheadOutsideClipWindow(-Infinity, START, DUR), false));

console.log(`\n${pass} test passed`);

console.log("== rvfcClipWindow102D3: shouldDeferRvfcPumpCreation (ngưỡng 0,35s) ==");
ok("element ở đúng target -> false (tạo pump)", () => assert.equal(shouldDeferRvfcPumpCreation(0.15, 0.15, false, 0.35), false));
ok("lệch 0,1s, không seeking -> false (trong ngưỡng)", () => assert.equal(shouldDeferRvfcPumpCreation(0.25, 0.15, false, 0.35), false));
ok("lệch đúng 0,35s -> false (ngưỡng là >, không phải >=)", () => assert.equal(shouldDeferRvfcPumpCreation(0.5, 0.15, false, 0.35), false));
ok("lệch 2,55s (case d3x2: ct 2,7 vs target 0,15), không seeking -> true (hoãn)", () => assert.equal(shouldDeferRvfcPumpCreation(2.7, 0.15, false, 0.35), true));
ok("lệch lớn nhưng ĐANG seeking -> false (seek đã bay, tạo pump + callback sẽ skip-seeking)", () => assert.equal(shouldDeferRvfcPumpCreation(2.7, 0.15, true, 0.35), false));
ok("lệch âm lớn (seek ngược chưa bay) -> true", () => assert.equal(shouldDeferRvfcPumpCreation(0.1, 2.9, false, 0.35), true));
ok("expected NaN -> false (giữ hành vi cũ)", () => assert.equal(shouldDeferRvfcPumpCreation(2.7, NaN, false, 0.35), false));
ok("currentTime NaN -> false", () => assert.equal(shouldDeferRvfcPumpCreation(NaN, 0.15, false, 0.35), false));

console.log(`\n${pass} test passed`);
