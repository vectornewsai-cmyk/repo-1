/**
 * playheadPacing55L6.test.ts — Test thật cho forwardCatchUpRate
 * (đợt 55 L6: catch-up bằng playbackRate cho AUDIO nhánh forward).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node --experimental-strip-types apps/web/src/lib/playheadPacing55L6.test.ts
 * (chạy từ gốc repo). Hàm thuần, không cần trình duyệt.
 *
 * Bối cảnh: đo headed 50 ms (xem
 * docs/PHASE9_ROUND55_L6_AUDIO_DRIFT_ROOT_LIMITS.md §2) cho thấy đồng
 * hồ audio Chromium chạy chậm ĐỀU ~0,47–0,57× wall-clock dưới tải CPU
 * trên VM (AudioContext thăm dò độc lập cũng 0,47–0,53× — cùng đồng hồ
 * audio bị đói CPU), playhead ~1× wall nên lag tăng đều ~0,44–0,47 s/s
 * → chạm ngưỡng seek 0,35 s mỗi ~0,6–0,9 s → audio re-seek 7–8/lượt.
 * Đây là lỗi tốc độ nên bù bằng tốc độ: media time tiến = tốc độ
 * render audio × playbackRate, đặt rate 1,15–1,5× theo drift thì lag
 * tăng chậm lại, seek thưa ra — thay vì seek nhảy cóc vị trí.
 */
import assert from "node:assert/strict";
import {
  FORWARD_CATCH_UP_MAX_EXTRA,
  FORWARD_CATCH_UP_MAX_SLOW,
  FORWARD_CATCH_UP_START_S,
  FORWARD_RESEEK_THRESHOLD_S,
  forwardCatchUpRate,
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

console.log("playheadPacing55L6 — forwardCatchUpRate");

ok("hằng số: bắt đầu bù 0,08 s, bù tối đa +50%, chậm tối đa −15%", () => {
  assert.equal(FORWARD_CATCH_UP_START_S, 0.08);
  assert.equal(FORWARD_CATCH_UP_MAX_EXTRA, 0.5);
  assert.equal(FORWARD_CATCH_UP_MAX_SLOW, 0.15);
});

ok("drift ≤ 0,08 s → giữ nguyên speed (không đáng bù)", () => {
  assert.equal(forwardCatchUpRate(1, 0, false, false), 1);
  assert.equal(forwardCatchUpRate(1, 0.08, false, false), 1);
  assert.equal(forwardCatchUpRate(1, -0.08, false, false), 1);
  assert.equal(forwardCatchUpRate(1, 0.05, false, false), 1);
});

ok("drift dương trong (0,08, 0,35] → bù tỉ lệ gain 1,5/s", () => {
  // drift 0,1 → 1 + 0,15 = 1,15×; drift 0,2 → 1,3×.
  assert.equal(forwardCatchUpRate(1, 0.1, false, false), 1.15);
  assert.equal(forwardCatchUpRate(1, 0.2, false, false), 1.3);
});

ok("drift lớn chạm trần +50% (drift ≥ 0,34)", () => {
  // 0,34 × 1,5 = 0,51 → chạm trần 0,5 → 1,5×.
  assert.equal(forwardCatchUpRate(1, 0.34, false, false), 1.5);
  assert.equal(forwardCatchUpRate(1, 0.35, false, false), 1.5);
});

ok("drift vượt ngưỡng seek 0,35 s → giữ speed, để seek xử lý", () => {
  assert.equal(forwardCatchUpRate(1, 0.351, false, false), 1);
  assert.equal(forwardCatchUpRate(1, 0.9, false, false), 1);
});

ok("drift âm (audio chạy trước) → chậm lại tối đa −15%", () => {
  // drift −0,1 → 0,9×; drift −0,2 → chạm sàn 0,85×.
  assert.equal(forwardCatchUpRate(1, -0.1, false, false), 0.9);
  assert.equal(forwardCatchUpRate(1, -0.2, false, false), 0.85);
  assert.equal(forwardCatchUpRate(1, -0.35, false, false), 0.85);
});

ok("drift âm vượt ngưỡng seek → giữ speed", () => {
  assert.equal(forwardCatchUpRate(1, -0.4, false, false), 1);
  assert.equal(forwardCatchUpRate(1, -1.5, false, false), 1);
});

ok("đang seeking → giữ speed (không đấu với seek đang bay)", () => {
  assert.equal(forwardCatchUpRate(1, 0.3, true, false), 1);
  assert.equal(forwardCatchUpRate(1, -0.2, true, false), 1);
});

ok("tick vừa hoàn tất seek → giữ speed (để currentTime ổn định)", () => {
  assert.equal(forwardCatchUpRate(1, 0.3, false, true), 1);
});

ok("speed hiệu ứng clip được giữ (rate = speed × hệ số bù)", () => {
  // Clip speed 2× + drift 0,2 → 2 × 1,3 = 2,6×.
  assert.equal(forwardCatchUpRate(2, 0.2, false, false), 2.6);
  // Clip speed 0,5× + drift 0,1 → 0,5 × 1,15 = 0,575×.
  assert.equal(forwardCatchUpRate(0.5, 0.1, false, false), 0.575);
});

ok("maxExtra tùy chọn vẫn tôn trọng (trần thấp hơn)", () => {
  // maxExtra 0,15: drift 0,3 → min(0,15, 0,45) = 0,15 → 1,15×.
  assert.equal(forwardCatchUpRate(1, 0.3, false, false, 0.15), 1.15);
  // maxExtra 0: không bù gì.
  assert.equal(forwardCatchUpRate(1, 0.3, false, false, 0), 1);
});

ok("đầu vào lạ (NaN/vô cực/speed ≤ 0) không ném, trả về an toàn", () => {
  assert.equal(forwardCatchUpRate(1, NaN, false, false), 1);
  assert.equal(forwardCatchUpRate(1, Infinity, false, false), 1);
  assert.equal(forwardCatchUpRate(NaN, 0.2, false, false), 1);
  assert.equal(forwardCatchUpRate(0, 0.2, false, false), 1);
  assert.equal(forwardCatchUpRate(-1, 0.2, false, false), 1);
});

console.log(`\nplayheadPacing55L6: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join("; ")}`);
  process.exitCode = 1;
}
