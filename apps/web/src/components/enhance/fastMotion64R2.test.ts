// fastMotion64R2.test.ts — Phase 9 đợt 64, luồng R2: detector chuyển động
// nhanh + cảnh báo denoise ≥0,7 (đóng nợ đợt 63 R2 §8 mục 2).
//
// Khóa logic THUẦN (không cần DOM/trình duyệt):
//  - framePairDiff/boxBlur3/grayFromImageData: cùng toán với server
//    (server/render/src/fastMotion.js) — đổi 1 bên là lệch số.
//  - classifyMotion: ngưỡng hiệu chuẩn trên clip 720p 5s thật (xem
//    LIMITS đợt 64 R2 §2): static-clean 0,00; static-noisy 0,43;
//    pan chậm 6px/frame 2,83; pan nhanh 24px/frame 9,19; pan rất nhanh
//    48px/frame 13,75; shaky ±7px 9,86. FAST=6,0 / MEDIUM=4,0.
//  - shouldWarnDenoiseGhosting: cảnh báo ở ≥0,7 với MỌI mức đo được
//    (slow/medium/fast) — đổi ở đợt 65 S2 theo số đo footage thật R4+S2
//    (cổng cũ chỉ-fast bỏ sót 4/6 clip thật ghost-positive).
//  - fastMotionStrings/formatFastMotionWarning: chuỗi fragment round64-r2
//    + round65-s2 (vi+en) + fallback cứng — không bao giờ trả key thô ra UI.
//  - fastMotionCacheKey: đổi clip/trim/src → key khác.
//
// Sampler trình duyệt (measureClipMotion) KHÔNG unit-test được ở đây —
// đo headed bằng Playwright (xem hidden_files/round64-r2/
// headed-fast-motion.mjs): pan nhanh → cảnh báo hiện, clip tĩnh → không.
//
// Chạy bằng esbuild bundle (mẫu R3 đợt 61/62/63, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/components/enhance/fastMotion64R2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round64-r2/fastMotion64R2.test.cjs \
//     && node /tmp/round64-r2/fastMotion64R2.test.cjs
import assert from "node:assert/strict";
import {
  boxBlur3,
  classifyMotion,
  DENOISE_WARN_STRENGTH,
  FAST_MOTION_FAST_THRESHOLD,
  FAST_MOTION_MEDIUM_THRESHOLD,
  fastMotionCacheKey,
  fastMotionStrings,
  formatFastMotionWarning,
  framePairDiff,
  grayFromImageData,
  shouldWarnDenoiseGhosting,
} from "./fastMotion";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7/O5). */
declare const process: {
  cwd: () => string;
  exitCode: number | undefined;
  env: Record<string, string | undefined>;
};

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
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
  console.log(`R2 fast-motion đợt 64: ${pass}/${queue.length} pass`);
}

// --- framePairDiff -----------------------------------------------------------
ok("framePairDiff: 2 frame giống hệt → 0, small=0", () => {
  const a = new Uint8Array([10, 20, 30, 40]);
  const d = framePairDiff(a, new Uint8Array([10, 20, 30, 40]));
  assert.equal(d.meanAbsDiff, 0);
  assert.equal(d.smallBandShare, 0);
});

ok("framePairDiff: lệch đều 10 → mean 10, ngoài dải small", () => {
  const a = new Uint8Array([10, 20, 30, 40]);
  const d = framePairDiff(a, new Uint8Array([20, 30, 40, 50]));
  assert.equal(d.meanAbsDiff, 10);
  assert.equal(d.smallBandShare, 0);
});

ok("framePairDiff: lệch 5 → mean 5, toàn dải small", () => {
  const a = new Uint8Array([10, 20, 30, 40]);
  const d = framePairDiff(a, new Uint8Array([15, 25, 35, 45]));
  assert.equal(d.meanAbsDiff, 5);
  assert.equal(d.smallBandShare, 1);
});

ok("framePairDiff: khác kích thước → throw", () => {
  assert.throws(() => framePairDiff(new Uint8Array([1]), new Uint8Array([1, 2])));
});

// --- boxBlur3 ---------------------------------------------------------------
ok("boxBlur3: điểm nóng giữa nền phẳng bị làm mờ (90/9=10, góc 90/4≈23)", () => {
  const hot = new Uint8Array(9).fill(0);
  hot[4] = 90;
  const out = boxBlur3(hot, 3, 3);
  assert.equal(out[4], 10);
  assert.equal(out[0], 23);
});

ok("boxBlur3: nền phẳng không đổi", () => {
  const flat = new Uint8Array([50, 50, 50, 50, 50, 50, 50, 50, 50]);
  const out = boxBlur3(flat, 3, 3);
  for (const v of out) assert.equal(v, 50);
});

// --- grayFromImageData -------------------------------------------------------
ok("grayFromImageData: Rec.601 (trắng → 255, đỏ → ~76)", () => {
  const data = new Uint8ClampedArray([
    255, 255, 255, 255, // trắng
    255, 0, 0, 255, // đỏ
    0, 0, 0, 255, // đen
  ]);
  const g = grayFromImageData(data);
  assert.equal(g.length, 3);
  assert.equal(g[0], 255);
  assert.equal(g[1], 76); // 0.299*255 = 76,2 → 76
  assert.equal(g[2], 0);
});

// --- classifyMotion: ngưỡng hiệu chuẩn (khóa số) -----------------------------
ok("classifyMotion: ngưỡng FAST=6,0 / MEDIUM=4,0 đúng số hiệu chuẩn", () => {
  assert.equal(FAST_MOTION_FAST_THRESHOLD, 6.0);
  assert.equal(FAST_MOTION_MEDIUM_THRESHOLD, 4.0);
  // Clip hiệu chuẩn thật (720p 5s, LIMITS §2):
  assert.equal(classifyMotion(0.001), "slow"); // static-clean
  assert.equal(classifyMotion(0.433), "slow"); // static-noisy
  assert.equal(classifyMotion(2.834), "slow"); // pan chậm 6px/frame
  assert.equal(classifyMotion(4.0), "medium"); // đúng ngưỡng dưới vùng xám
  assert.equal(classifyMotion(5.9), "medium"); // vùng xám — không cảnh báo
  assert.equal(classifyMotion(6.0), "fast"); // đúng ngưỡng fast
  assert.equal(classifyMotion(9.186), "fast"); // pan nhanh 24px/frame
  assert.equal(classifyMotion(13.754), "fast"); // pan rất nhanh 48px/frame
  assert.equal(classifyMotion(9.856), "fast"); // shaky ±7px
});

ok("classifyMotion: score âm/NaN → throw (không phân loại bừa)", () => {
  assert.throws(() => classifyMotion(-1));
  assert.throws(() => classifyMotion(NaN));
  assert.throws(() => classifyMotion(Infinity));
});

// --- shouldWarnDenoiseGhosting: ma trận quyết định ---------------------------
// Quy tắc MỚI đợt 65 S2 (xem docs/PHASE9_ROUND65_S2_LIMITS.md): cảnh báo ở
// ≥0,7 với mọi mức đo được — clip chậm/vừa vẫn ghost như clip nhanh trên
// footage thật (R4 + S2). Unknown vẫn không cảnh báo cụ thể (UI hiện câu chung).
ok("warn: strength ≥0,7 + mọi mức đo được (slow/medium/fast) đều cảnh báo", () => {
  assert.equal(DENOISE_WARN_STRENGTH, 0.7);
  assert.equal(shouldWarnDenoiseGhosting(0.8, "fast"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.7, "fast"), true);
  assert.equal(shouldWarnDenoiseGhosting(1.0, "fast"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.69, "fast"), false);
  assert.equal(shouldWarnDenoiseGhosting(0.5, "fast"), false);
  assert.equal(shouldWarnDenoiseGhosting(0.8, "slow"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.7, "slow"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.8, "medium"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.8, "unknown"), false);
  assert.equal(shouldWarnDenoiseGhosting(NaN, "fast"), false);
});

// --- fastMotionCacheKey -------------------------------------------------------
ok("cacheKey: đổi clip/src/trim → key khác; giống hệt → key giống", () => {
  const a = fastMotionCacheKey("c1", "a.mp4", 0, 5);
  assert.equal(fastMotionCacheKey("c1", "a.mp4", 0, 5), a);
  assert.notEqual(fastMotionCacheKey("c2", "a.mp4", 0, 5), a);
  assert.notEqual(fastMotionCacheKey("c1", "b.mp4", 0, 5), a);
  assert.notEqual(fastMotionCacheKey("c1", "a.mp4", 1, 5), a);
  assert.notEqual(fastMotionCacheKey("c1", "a.mp4", 0, 4), a);
});

// --- Chuỗi i18n fragment -----------------------------------------------------
ok("strings vi: cảnh báo cụ thể có đủ {score}/{pct}/{level}", () => {
  const s = fastMotionStrings("vi");
  assert.ok(s.warning.includes("{score}"), "warning thiếu {score}");
  assert.ok(s.warning.includes("{pct}"), "warning thiếu {pct}");
  assert.ok(s.warning.includes("ghosting"), "warning thiếu từ ghosting");
  assert.ok(s.warning.includes("70%"), "warning phải nhắc ngưỡng 70%");
  assert.ok(s.unknown.includes("{pct}"), "unknown thiếu {pct}");
  assert.ok(s.measuring.length > 0, "measuring rỗng");
  assert.equal(s.levelFast, "nhanh");
  assert.equal(s.levelSlow, "chậm");
  // Câu slow/medium (đợt 65 S2, fragment round65-s2): đủ placeholder,
  // nhắc ngưỡng 70%, KHÔNG gọi clip là "chuyển động nhanh".
  assert.ok(s.warningSlow.includes("{score}"), "warningSlow thiếu {score}");
  assert.ok(s.warningSlow.includes("{pct}"), "warningSlow thiếu {pct}");
  assert.ok(s.warningSlow.includes("{level}"), "warningSlow thiếu {level}");
  assert.ok(s.warningSlow.includes("70%"), "warningSlow phải nhắc ngưỡng 70%");
  assert.ok(!s.warningSlow.includes("chuyển động nhanh"), "warningSlow không được gọi clip chậm/vừa là chuyển động nhanh");
});

ok("strings en: có đủ key, không trả key thô", () => {
  const s = fastMotionStrings("en");
  assert.ok(!s.warning.includes("fastMotionWarning"), "trả key thô");
  assert.ok(s.warning.includes("{score}"));
  assert.ok(s.warning.includes("{pct}"));
  assert.ok(s.unknown.includes("{pct}"));
  assert.equal(s.levelFast, "fast");
  assert.equal(s.levelSlow, "slow");
  assert.ok(!s.warningSlow.includes("fastMotionWarningSlow"), "warningSlow trả key thô");
  assert.ok(s.warningSlow.includes("{score}"));
  assert.ok(s.warningSlow.includes("{pct}"));
  assert.ok(s.warningSlow.includes("{level}"));
});

ok("formatFastMotionWarning: điền đúng số (score 1 chữ số thập phân)", () => {
  const s = fastMotionStrings("vi");
  const out = formatFastMotionWarning(s.warning, { score: 9.186, pct: 80, level: "nhanh" });
  assert.ok(out.includes("9.2"), `score phải làm tròn 9.2, được: ${out}`);
  assert.ok(out.includes("80%"), `pct phải là 80%, được: ${out}`);
  assert.ok(out.includes("nhanh"), `level phải là "nhanh", được: ${out}`);
  assert.ok(!out.includes("{score}") && !out.includes("{pct}") && !out.includes("{level}"), "còn placeholder chưa điền");
  const unk = formatFastMotionWarning(s.unknown, { score: 0, pct: 70 });
  assert.ok(unk.includes("70%"));
  assert.ok(!unk.includes("{pct}"));
  // Câu slow (đợt 65 S2): điền đủ score/pct/level, không còn placeholder.
  const slow = formatFastMotionWarning(s.warningSlow, { score: 2.909, pct: 80, level: "chậm" });
  assert.ok(slow.includes("2.9"), `score phải làm tròn 2.9, được: ${slow}`);
  assert.ok(slow.includes("80%"), `pct phải là 80%, được: ${slow}`);
  assert.ok(slow.includes("chậm"), `level phải là "chậm", được: ${slow}`);
  assert.ok(!slow.includes("{score}") && !slow.includes("{pct}") && !slow.includes("{level}"), "còn placeholder chưa điền");
});

runAll();
