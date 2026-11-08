/**
 * playheadPacing54K9.test.ts — Test thật cho shouldIssueForwardReseek
 * (đợt 54 K9: chặn nhịp + deadband nhánh forward của syncMedia).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node --experimental-strip-types apps/web/src/lib/playheadPacing54K9.test.ts
 * (chạy từ gốc repo). Hàm thuần, không cần trình duyệt.
 *
 * Bối cảnh: nhánh forward cũ phát seek lại ngay khi |currentTime −
 * target| > 0,35 s mà không kiểm tra el.seeking — dưới tải CPU, seek
 * audio mất nhiều tick mới xong; trong lúc seek còn bay, currentTime
 * đóng băng ở target cũ trong khi playhead vẫn tiến → drift lại vượt
 * ngưỡng → seek mới chồng lên seek cũ → decoder restart liên tục.
 * Đo headed trước sửa: audio re-seek 11–12/lượt (8 s), AUDIO seeking
 * 30–40% số mẫu (xem docs/PHASE9_ROUND54_K9_AUDIO_RESEEK_LIMITS.md §2).
 * Luật mới mirror nhánh reverse (L2/T6): không seek khi đang seeking,
 * không seek ở tick vừa hoàn tất seek, drift phải vượt ngưỡng 2 tick
 * liên tiếp mới seek.
 */
import assert from "node:assert/strict";
import {
  FORWARD_RESEEK_CONFIRM_TICKS,
  FORWARD_RESEEK_THRESHOLD_S,
  shouldIssueForwardReseek,
} from "./playheadPacing.ts";

declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

console.log("playheadPacing54K9 — shouldIssueForwardReseek");

ok("hằng số giữ đúng ngưỡng cũ 0,35 s + xác nhận 2 tick", () => {
  assert.equal(FORWARD_RESEEK_THRESHOLD_S, 0.35);
  assert.equal(FORWARD_RESEEK_CONFIRM_TICKS, 2);
});

ok("drift dưới ngưỡng → không seek, đếm về 0", () => {
  assert.deepEqual(shouldIssueForwardReseek(false, false, 0.2, 1), {
    seek: false,
    overCount: 0,
  });
  assert.deepEqual(shouldIssueForwardReseek(false, false, 0.35, 1), {
    seek: false,
    overCount: 0,
  });
});

ok("drift vượt ngưỡng tick đầu → chưa seek, đếm = 1", () => {
  assert.deepEqual(shouldIssueForwardReseek(false, false, 0.36, 0), {
    seek: false,
    overCount: 1,
  });
});

ok("drift vượt ngưỡng tick thứ 2 liên tiếp → seek, đếm reset 0", () => {
  assert.deepEqual(shouldIssueForwardReseek(false, false, 0.4, 1), {
    seek: true,
    overCount: 0,
  });
});

ok("chuỗi vượt ngưỡng đứt đoạn thì đếm lại từ đầu (lọc jitter)", () => {
  // Tick 1 vượt (đếm 1), tick 2 về dưới ngưỡng (reset 0), tick 3 vượt
  // lại chỉ là tick đầu của chuỗi mới → chưa seek.
  let d = shouldIssueForwardReseek(false, false, 0.5, 0);
  assert.equal(d.seek, false);
  assert.equal(d.overCount, 1);
  d = shouldIssueForwardReseek(false, false, 0.1, d.overCount);
  assert.equal(d.seek, false);
  assert.equal(d.overCount, 0);
  d = shouldIssueForwardReseek(false, false, 0.5, d.overCount);
  assert.equal(d.seek, false);
  assert.equal(d.overCount, 1);
});

ok("đang seeking → không seek kể cả drift lớn, đếm về 0 (chặn seek chồng)", () => {
  assert.deepEqual(shouldIssueForwardReseek(true, false, 1.5, 1), {
    seek: false,
    overCount: 0,
  });
});

ok("tick vừa hoàn tất seek → không seek tiếp, đếm về 0 (cửa sổ ổn định)", () => {
  assert.deepEqual(shouldIssueForwardReseek(false, true, 0.5, 1), {
    seek: false,
    overCount: 0,
  });
});

ok("seeking + vừa hoàn tất cùng lúc → không seek (phòng thủ)", () => {
  assert.deepEqual(shouldIssueForwardReseek(true, true, 2, 1), {
    seek: false,
    overCount: 0,
  });
});

ok("drift âm (element chạy trước playhead) vẫn tính theo |drift|", () => {
  // Helper nhận driftAbs đã lấy trị tuyệt đối ở caller; kiểm tra
  // ngưỡng vẫn đúng với giá trị lớn.
  assert.deepEqual(shouldIssueForwardReseek(false, false, 0.9, 1), {
    seek: true,
    overCount: 0,
  });
});

ok("overCount lạ (NaN/âm) được coi như 0, không ném", () => {
  assert.deepEqual(shouldIssueForwardReseek(false, false, 0.5, NaN), {
    seek: false,
    overCount: 1,
  });
  assert.deepEqual(shouldIssueForwardReseek(false, false, 0.5, -3), {
    seek: false,
    overCount: 1,
  });
});

ok("ngưỡng + số tick tùy chọn vẫn tôn trọng (caller truyền khác mặc định)", () => {
  assert.deepEqual(
    shouldIssueForwardReseek(false, false, 0.2, 0, 0.1, 1),
    { seek: true, overCount: 0 },
  );
});

console.log(`\nplayheadPacing54K9: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join("; ")}`);
  process.exitCode = 1;
}
