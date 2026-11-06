// timelineRulerSeek40V4.test.ts — Đợt 40 luồng V4: khóa phép ánh xạ
// click ruler → thời gian + neo lại luật settle-drop / giữ luật T2
// (predicate đã có ở test T4, ở đây khẳng định lại để hồi quy của
// luồng này tự chứa đủ, không phụ thuộc test khác).
//
// Chạy bằng esbuild bundle (cùng lý do test T4: reverseDecodeAheadToggle
// import "./mp4Demux" không đuôi nên Node strip-types không resolve):
//   ./node_modules/.bin/esbuild apps/web/src/lib/timelineRulerSeek40V4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/v4.test.cjs \
//     && node <scratch>/v4.test.cjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra dist.)
//
// Số đo browser đối chứng nằm ở script click-test đợt này
// (clicktest-round40-v4-settle-ruler-pipe.mjs) và LIMITS V4 — test
// thuần này chỉ khóa công thức, không mạo nhận bằng chứng browser.
import assert from "node:assert/strict";
import { rulerTimeFromClientX } from "./timelineRulerSeek40V4.ts";
import {
  shouldAutoApplyDecodeAhead,
  shouldDropSettledPrefetch,
} from "./reverseDecodeAheadToggle.ts";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}

ok("ruler: đúng số đo probe browser (left 152, 60 px/s)", () => {
  assert.equal(rulerTimeFromClientX(512, 152, 60), 6);
  assert.equal(rulerTimeFromClientX(572, 152, 60), 7);
  assert.equal(rulerTimeFromClientX(362, 152, 60), 3.5);
});

ok("ruler: frac chiều rộng ruler KHÔNG bằng frac thời gian (đệm 240 px)", () => {
  // Timeline 10 s, pxPerSec 60 → ruler rộng 10*60+240 = 840 px.
  // Click ở giữa chiều rộng (frac 0,5 → x = 152+420 = 572) cho 7,0 s,
  // KHÔNG phải 5,0 s — harness nào ép frac = time đều sai (bài học T4).
  const rulerWidth = 10 * 60 + 240;
  const midX = 152 + 0.5 * rulerWidth;
  assert.equal(rulerWidth, 840);
  assert.equal(rulerTimeFromClientX(midX, 152, 60), 7);
  assert.notEqual(rulerTimeFromClientX(midX, 152, 60), 5);
});

ok("ruler: ngoài biên trả về giá trị thô, clamp là việc của setPlayhead", () => {
  assert.ok(rulerTimeFromClientX(100, 152, 60) < 0);
  assert.ok(rulerTimeFromClientX(2000, 152, 60) > 10);
});

ok("ruler: đổi zoom đổi đúng tỉ lệ (cùng click, pxPerSec gấp đôi → thời gian một nửa)", () => {
  assert.equal(rulerTimeFromClientX(512, 152, 120), 3);
});

ok("settle-drop predicate: chỉ dọn khi đang tắt + không dispose + không decode bay", () => {
  assert.equal(shouldDropSettledPrefetch(false, false, false), true);
  assert.equal(shouldDropSettledPrefetch(true, false, false), false);
  assert.equal(shouldDropSettledPrefetch(false, true, false), false);
  assert.equal(shouldDropSettledPrefetch(false, false, true), false);
});

ok("giữ luật T2: cổng S3 chỉ xét lúc BẬT, không re-gate khi đang chạy", () => {
  assert.equal(shouldAutoApplyDecodeAhead(true, false), true);
  assert.equal(shouldAutoApplyDecodeAhead(true, true), false);
  assert.equal(shouldAutoApplyDecodeAhead(false, false), false);
  assert.equal(shouldAutoApplyDecodeAhead(false, true), false);
});

for (const t of queue) {
  try {
    t.fn();
    pass++;
    console.log(`  ✓ ${t.name}`);
  } catch (e) {
    console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
console.log(`timelineRulerSeek40V4: ${pass}/${queue.length} test pass`);
