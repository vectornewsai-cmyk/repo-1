// reversePlayback192P3.test.ts — Khóa S6b đợt 192 P3: target seek ngược
// lùi 1 ms khỏi biên lưới frame (F-191-P4-1).
//
//   node --experimental-strip-types apps/web/src/lib/reversePlayback192P3.test.ts
import assert from "node:assert";
import {
  REVERSE_SEEK_BACKOFF_SEC,
  reverseSeekTarget,
} from "./reversePlayback.ts";

let pass = 0;
function check(name: string, fn: () => void): void {
  fn();
  pass++;
  console.log(`ok ${pass} - ${name}`);
}

const FD = 1 / 30; // frameDur @30fps

check("backoff là 1 ms", () => {
  assert.equal(REVERSE_SEEK_BACKOFF_SEC, 0.001);
});

// Đúng biên lưới (t = k/30): lùi 1 ms -> nằm trong khoảng frame N-1-k.
check("biên k=1: (N-1)/30 - 1ms", () => {
  const t = 59 / 30;
  const s = reverseSeekTarget(t);
  assert.ok(s < t && s > t - 0.002, `s=${s}`);
  assert.equal(Math.floor(s * 30), 58);
});
check("biên k=15: 45/30 - 1ms -> frame 44", () => {
  const s = reverseSeekTarget(45 / 30);
  assert.equal(Math.floor(s * 30), 44);
});
check("biên k=30: 30/30 - 1ms -> frame 29", () => {
  const s = reverseSeekTarget(30 / 30);
  assert.equal(Math.floor(s * 30), 29);
});
check("biên k=45: 15/30 - 1ms -> frame 14", () => {
  const s = reverseSeekTarget(15 / 30);
  assert.equal(Math.floor(s * 30), 14);
});

// Lệch lưới nửa đầu khoảng frame: lùi 1 ms vẫn đúng frame (nửa frame thì sai -1).
check("lệch lưới nửa đầu: 1.475 - 1ms -> frame 44", () => {
  const s = reverseSeekTarget(1.475);
  assert.equal(Math.floor(s * 30), 44);
});
check("lệch lưới nửa sau: 1.49 - 1ms -> frame 44", () => {
  const s = reverseSeekTarget(1.49);
  assert.equal(Math.floor(s * 30), 44);
});

// Biên: target - 1ms vẫn cách biên cũ đủ xa để guard nửa frame không
// hiểu nhầm là seek chưa xong (|currentTime - target| = 1ms << 0.5/fps).
check("sau seek, lệch khỏi target thô chỉ 1ms < nửa frame", () => {
  for (const t of [1 / 30, 15 / 30, 30 / 30, 45 / 30]) {
    const s = reverseSeekTarget(t);
    assert.ok(Math.abs(s - t) < 0.5 / 30, `t=${t} s=${s}`);
    assert.ok(Math.abs(s - t) > 0, "phải lùi thật, không giữ nguyên");
  }
});

// Clamp: target 0 / âm / NaN -> 0 (frame đầu, không lùi vào âm).
check("target 0 -> 0", () => assert.equal(reverseSeekTarget(0), 0));
check("target âm -> 0", () => assert.equal(reverseSeekTarget(-0.5), 0));
check("target NaN -> 0", () => assert.equal(reverseSeekTarget(NaN), 0));
check("target nhỏ hơn 1ms -> 0", () => assert.equal(reverseSeekTarget(0.0005), 0));

// Không phụ thuộc frameDur: cùng 1ms ở mọi fps.
check("1ms không đổi theo fps (dùng đúng 1 hằng số)", () => {
  assert.equal(reverseSeekTarget(2) , 2 - 0.001);
  void FD;
});

console.log(`reversePlayback192P3.test.ts: ${pass} test PASS`);
