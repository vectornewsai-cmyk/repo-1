/**
 * playheadPacing53J5.test.ts — Test thật cho clampPreviewDt (đợt 53 J5).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node --experimental-strip-types apps/web/src/lib/playheadPacing53J5.test.ts
 * (chạy từ gốc repo). Hàm thuần, không cần trình duyệt.
 *
 * Bối cảnh: vòng lặp preview cũ clamp dt ở 0,1 s (`Math.min(0.1, ...)`),
 * khiến playhead chỉ tiến ~0,15× wall-clock khi FPS thấp (~1,5 fps) trong
 * khi element media phát đúng tốc độ thật → syncMedia seek ngược liên
 * tục. clampPreviewDt nới trần lên PREVIEW_DT_CAP_S (2 s) để playhead
 * bám wall-clock qua mọi gap scheduling quan sát được, vẫn chặn gap phi
 * lý (ngủ máy / tab ẩn lâu — trường hợp tab ẩn được đóng riêng bằng
 * reset `last` trong onVisible của preview.tsx).
 */
import assert from "node:assert/strict";
import { clampPreviewDt, PREVIEW_DT_CAP_S } from "./playheadPacing.ts";

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

console.log("== clampPreviewDt (đợt 53 J5) ==");
ok("trần là 2 s (bao gap scheduling dài nhất I9 đo được: 1096 ms)", () => {
  assert.equal(PREVIEW_DT_CAP_S, 2);
});
ok("dt trong khoảng -> giữ nguyên", () => {
  assert.equal(clampPreviewDt(0.0167), 0.0167);
  assert.equal(clampPreviewDt(0.1), 0.1);
  assert.equal(clampPreviewDt(0.67), 0.67);
  assert.equal(clampPreviewDt(1.096), 1.096);
});
ok("dt vượt trần -> kẹp về trần", () => {
  assert.equal(clampPreviewDt(2.5), 2);
  assert.equal(clampPreviewDt(3600), 2);
});
ok("dt <= 0 / NaN -> 0 (không bước, không âm)", () => {
  assert.equal(clampPreviewDt(0), 0);
  assert.equal(clampPreviewDt(-0.5), 0);
  assert.equal(clampPreviewDt(Number.NaN), 0);
});
ok("gap FPS thấp 0,67 s không còn bị cắt về 0,1 s (bug cũ)", () => {
  // Bug cũ: Math.min(0.1, 0.67) = 0.1 → playhead 0,15× wall-clock.
  const dt = clampPreviewDt(0.67);
  assert.ok(dt > 0.6, `dt phải ~0,67, nhận ${dt}`);
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (fail > 0) {
  console.error("Failed:", failedNames.join(", "));
  process.exitCode = 1;
}
