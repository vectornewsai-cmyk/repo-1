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

// ---- Đợt 95 W5 — ân hạn 1 tick sau re-arm (graceTick) ----
//
// BỐI CẢNH ĐO (docs/PHASE9_ROUND94_V2_STALL_CEILING_LIMITS.md §1.3 +
// truy vết lại JSON thô đợt 95 W5): GOP 250 r5 stall 3 (323 ms) — re-arm
// arm ở đúng tick mà drift đã đủ 2 tick xác nhận nên drift re-seek vẫn
// bắn cùng tick với lúc giữ kịp vào. Ân hạn 1 tick cho element đã giữ
// kịp đuổi theo: nếu element resume trong tick ân hạn và drift về dưới
// ngưỡng thì không seek nữa; nếu không thì seek ngay tick sau (trễ
// đúng 1 tick, không hơn — playhead đang giữ nên drift không tăng
// trong tick ân hạn).
ok("W5-R1: graceTick hoãn seek đúng 1 tick khi drift đã đủ 2 tick xác nhận", () => {
  // Tick 1 vượt ngưỡng (đếm 1), tick 2 vượt + grace → chưa seek, đếm giữ 1.
  let d = shouldIssueForwardReseek(false, false, 0.4, 0);
  assert.deepEqual(d, { seek: false, overCount: 1 });
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount, 0.35, 2, true);
  assert.deepEqual(d, { seek: false, overCount: 1 });
  // Tick 3 không còn grace, drift vẫn vượt → seek ngay.
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount);
  assert.deepEqual(d, { seek: true, overCount: 0 });
});

ok("W5-R2: element resume trong tick ân hạn thì hủy seek (drift về dưới ngưỡng)", () => {
  let d = shouldIssueForwardReseek(false, false, 0.4, 0);
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount, 0.35, 2, true);
  assert.deepEqual(d, { seek: false, overCount: 1 });
  // Element đuổi kịp playhead đã giữ trong tick ân hạn → drift 0,1.
  d = shouldIssueForwardReseek(false, false, 0.1, d.overCount);
  assert.deepEqual(d, { seek: false, overCount: 0 });
});

ok("W5-R3: không grace thì hành vi cũ giữ nguyên (seek ở tick thứ 2)", () => {
  let d = shouldIssueForwardReseek(false, false, 0.4, 0);
  assert.deepEqual(d, { seek: false, overCount: 1 });
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount);
  assert.deepEqual(d, { seek: true, overCount: 0 });
});

ok("W5-R4: graceTick không có tác dụng khi drift dưới ngưỡng / đang seeking", () => {
  // Dưới ngưỡng: không seek, đếm về 0 — grace không giữ đếm lại.
  assert.deepEqual(shouldIssueForwardReseek(false, false, 0.2, 1, 0.35, 2, true), {
    seek: false,
    overCount: 0,
  });
  // Đang seeking: đường chặn seek chồng vẫn ưu tiên, grace không đổi.
  assert.deepEqual(shouldIssueForwardReseek(true, false, 1.5, 1, 0.35, 2, true), {
    seek: false,
    overCount: 0,
  });
});

ok("W5-R5: graceTick ở tick vượt đầu tiên không seek (chưa đủ xác nhận) và không giữ đếm thừa", () => {
  // Tick vượt đầu + grace → chưa seek, đếm 1 (như không grace).
  assert.deepEqual(shouldIssueForwardReseek(false, false, 0.4, 0, 0.35, 2, true), {
    seek: false,
    overCount: 1,
  });
});

ok("W5-R6: graceTick với confirmTicks=3 chỉ hoãn đúng tick đạt ngưỡng", () => {
  let d = shouldIssueForwardReseek(false, false, 0.4, 0, 0.35, 3);
  assert.deepEqual(d, { seek: false, overCount: 1 });
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount, 0.35, 3);
  assert.deepEqual(d, { seek: false, overCount: 2 });
  // Tick thứ 3 + grace → chưa seek, đếm giữ ở confirmTicks − 1 = 2.
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount, 0.35, 3, true);
  assert.deepEqual(d, { seek: false, overCount: 2 });
  // Tick sau không grace → seek ngay.
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount, 0.35, 3);
  assert.deepEqual(d, { seek: true, overCount: 0 });
});

// ---- Đợt 96 X4 — ân hạn drift re-seek SUỐT thời gian watch còn sống ----
//
// BỐI CẢNH ĐO (docs/PHASE9_ROUND96_X4_REARM_CEILING_LIMITS.md §2): ân hạn
// 1 tick của W5 chưa hủy được re-seek nào ngoài đời — 3/3 lần grace kích
// hoạt có drift đủ xác nhận (p3b đợt 95, b1/b2 đợt 96) đều DELAYED: seek
// bắn ngay tick sau arm vì element chưa resume kịp trong đúng 1 tick đó,
// trong khi watch S2 vẫn còn sống và playhead vẫn đang giữ. Sửa X4: giữ
// graceTick=true mọi tick mà element còn watch sống (preview.tsx truyền
// tập liveResumeWatchElements) — helper không đổi, chỉ caller giữ grace
// lâu hơn. 2 pin dưới đây khóa đúng ngữ nghĩa đó ở tầng helper: grace
// kéo dài vẫn chỉ hoãn (không hủy đếm), hết grace thì seek ngay; resume
// trong lúc grace kéo dài thì hủy seek.
ok("X4-R1: grace kéo dài 3 tick vẫn chỉ hoãn (đếm giữ 1), hết grace thì seek ngay", () => {
  // Tick 1 vượt ngưỡng (đếm 1), tick 2–4 vượt + grace (watch còn sống)
  // → chưa seek, đếm giữ 1.
  let d = shouldIssueForwardReseek(false, false, 0.4, 0);
  assert.deepEqual(d, { seek: false, overCount: 1 });
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount, 0.35, 2, true);
  assert.deepEqual(d, { seek: false, overCount: 1 });
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount, 0.35, 2, true);
  assert.deepEqual(d, { seek: false, overCount: 1 });
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount, 0.35, 2, true);
  assert.deepEqual(d, { seek: false, overCount: 1 });
  // Watch hết hạn (trần 5000 ms, hết grace), drift vẫn vượt → seek ngay
  // tick sau — đường phục hồi cũ được giữ nguyên, chỉ trễ thêm.
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount);
  assert.deepEqual(d, { seek: true, overCount: 0 });
});

ok("X4-R2: element resume trong lúc grace kéo dài thì hủy seek (drift về dưới ngưỡng)", () => {
  let d = shouldIssueForwardReseek(false, false, 0.4, 0);
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount, 0.35, 2, true);
  d = shouldIssueForwardReseek(false, false, 0.4, d.overCount, 0.35, 2, true);
  assert.deepEqual(d, { seek: false, overCount: 1 });
  // Element đuổi kịp playhead đã giữ trong lúc watch còn sống → drift 0,1.
  d = shouldIssueForwardReseek(false, false, 0.1, d.overCount);
  assert.deepEqual(d, { seek: false, overCount: 0 });
});

console.log(`\nplayheadPacing54K9: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join("; ")}`);
  process.exitCode = 1;
}
