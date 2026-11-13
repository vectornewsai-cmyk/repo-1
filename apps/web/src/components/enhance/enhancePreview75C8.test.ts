// enhancePreview75C8.test.ts — Phase 9 đợt 75, luồng C8: deinterlace vào
// preview bằng tap dọc +0.5px (gap E3 — tính năng enhance cuối cùng chưa có
// xấp xỉ preview nào; đóng nợ D3 full-res đợt 61 §6.4 / đợt 63 §6.7).
//
// Cơ chế (probe-75c8-deint, đo thật trên interlaced720 1280×720, 3 mốc):
// vẽ khung lệch dọc +0.5px output → bilinear trung bình 2 dòng kề (hạt
// nhân [1,1]/2), R combing 1.12 → 0.67 (progressive đối chứng 0.69,
// yadif render thật 0.57), giữ 73% độ sắc nét dọc trên footage
// progressive; KHÔNG thêm lần vẽ nào (cùng 1 drawImage, chỉ đổi offset).
// Tap CHỈ áp khi drawScaleY ≥ 0.9, với drawScaleY = (dh/mh) × S (dh =
// chiều cao vẽ theo tọa độ project, S = tỉ lệ viewport của canvas thật
// — preview.tsx tính từ canvas thật, KHÔNG phải dh/mh thuần).
// Sweep probe (chênh R inter−clean): 0.38→0.06, 0.50→0.12, 0.68→0.08,
// 0.75→0.12, 0.80→0.11, 0.85→0.15, 0.90→0.17, 0.95→0.18, 1.00→0.43 —
// gap ≤0.18 tới 0.95 rồi nhảy lên 0.43 ở 1.0 nên tap chỉ bật ở ≥0.9.
// Dưới ngưỡng, downscale đã giấu răng cưa — và hành vi letterbox cũ giữ
// nguyên (Q1 B5 + 61R3 C6 vẫn xanh: clip 360p ở letterbox 871×275 có tỉ
// lệ thật (720/360)×0.38 = 0.76 < 0.9).
//
// Chạy bằng esbuild bundle (mẫu Q1/R3, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview75C8.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round75-c8/enhancePreview75C8.test.cjs \
//     && node /tmp/round75-c8/enhancePreview75C8.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round75-c8/enhancePreview75C8.test.cjs
//
// Test này khóa (logic THUẦN trong apps/web/src/lib/enhancePreview.ts):
//  1. deinterlaceOf: true/object → bật, thiếu → tắt.
//  2. Hằng cổng ENHANCE_PREVIEW_DEINT_MIN_SCALE_Y = 0.9,
//     ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX = 0.5.
//  3. enhancePreviewPlan(enh, enabled, hasSpeedKeyframes, drawScaleY):
//     deint đơn lẻ → tap false + notApproximated + KHÔNG offscreen khi
//     scaleY < 0.9 (kể cả không truyền tỉ lệ — mặc định 0, giữ hành vi
//     cũ; kể cả clip 360p ở letterbox: tỉ lệ thật 0.76); tap true +
//     applied [deinterlace] + KHÔNG offscreen khi scaleY ≥ 0.9 (đợt 76
//     D4: tap đơn lẻ nội tuyến ở lần vẽ cuối, không qua enhanceCanvas
//     nữa — xem docs/PHASE9_ROUND76_D4_DEINT_FPS_LIMITS.md); tap đi
//     kèm denoise/stabilize vẫn offscreen; toggle tắt → tap false dù
//     scaleY = 1; cả ba ở scaleY = 1 → applied
//     [deinterlace, stabilize, denoise].
//  4. Hook debug mang field deinterlaceTap theo đúng plan.
//  5. Ngưỡng biên: 0.749 → không tap, 0.75 → tap; NaN/âm → không tap.
import assert from "node:assert/strict";
import {
  ENHANCE_PREVIEW_DEINT_MIN_SCALE_Y,
  ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX,
  deinterlaceOf,
  enhancePreviewDebug,
  enhancePreviewPlan,
} from "../../lib/enhancePreview";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7/O5). */
declare const process: {
  cwd: () => string;
  exitCode: number | undefined;
  env: Record<string, string | undefined>;
};

const LANG = (process.env.VCUT_TEST_LANG === "en" ? "en" : "vi") as "vi" | "en";

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
  console.log(`C8 deinterlace preview tap round 75 [lang=${LANG}]: ${pass}/${queue.length} pass`);
}

/** So sánh số thực với sai số làm tròn (tránh 0.1 + 0.2 != 0.3). */
function approx(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `kỳ vọng ${expected}, thực tế ${actual}`,
  );
}

// --- deinterlaceOf + hằng ----------------------------------------------------
ok("deinterlaceOf: true/object → bật, thiếu → tắt", () => {
  assert.equal(deinterlaceOf(undefined), false);
  assert.equal(deinterlaceOf({}), false);
  assert.equal(deinterlaceOf({ deinterlace: true }), true);
  assert.equal(deinterlaceOf({ deinterlace: { mode: 1 } }), true);
  assert.equal(deinterlaceOf({ deinterlace: { mode: 0 } }), true);
  assert.equal(deinterlaceOf({ denoise: true }), false);
});

ok("hằng cổng tap: scaleY tối thiểu 0.9, offset dọc 0.5px", () => {
  approx(ENHANCE_PREVIEW_DEINT_MIN_SCALE_Y, 0.9);
  approx(ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX, 0.5);
});

// --- Plan: cổng theo tỉ lệ vẽ ------------------------------------------------
ok("plan: deint đơn lẻ, KHÔNG truyền tỉ lệ vẽ (mặc định 0) → tap false, KHÔNG offscreen (giữ hành vi cũ)", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, true);
  assert.equal(p.deinterlaceTap, false);
  assert.deepEqual(p.applied, []);
  assert.deepEqual(p.notApproximated, ["deinterlace"]);
  assert.equal(p.needsOffscreen, false);
});

ok("plan: deint đơn lẻ ở letterbox (scaleY 0.38) → tap false, KHÔNG offscreen", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, true, false, 0.38);
  assert.equal(p.deinterlaceTap, false);
  assert.deepEqual(p.applied, []);
  assert.deepEqual(p.notApproximated, ["deinterlace"]);
  assert.equal(p.needsOffscreen, false);
});

ok("plan: deint đơn lẻ ở scaleY 0.5, 0.68, 0.75, 0.76 và 0.85 → tap false (dưới ngưỡng 0.9)", () => {
  for (const s of [0.5, 0.68, 0.75, 0.76, 0.85]) {
    const p = enhancePreviewPlan({ deinterlace: true }, true, false, s);
    assert.equal(p.deinterlaceTap, false, `scaleY ${s} phải không tap`);
    assert.equal(p.needsOffscreen, false);
  }
});

ok("plan: deint đơn lẻ, clip 360p ở letterbox (tỉ lệ thật 0.76) → tap false — giữ hành vi Q1 B5 / 61R3 C6", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, true, false, (720 / 360) * 0.38);
  assert.equal(p.deinterlaceTap, false);
  assert.deepEqual(p.applied, []);
  assert.deepEqual(p.notApproximated, ["deinterlace"]);
  assert.equal(p.needsOffscreen, false);
});

ok("plan: deint đơn lẻ ở scaleY 0.9 → tap true, applied [deinterlace], KHÔNG offscreen (đợt 76 D4: nội tuyến ở lần vẽ cuối)", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, true, false, 0.9);
  assert.equal(p.deinterlaceTap, true);
  assert.deepEqual(p.applied, ["deinterlace"]);
  assert.deepEqual(p.notApproximated, []);
  assert.equal(p.needsOffscreen, false);
  approx(p.denoiseBlurPx, 0);
  approx(p.stabilizeZoom, 1);
});

ok("plan: deint đơn lẻ ở scaleY 1.125 (fullscreen 720p) → tap true, KHÔNG offscreen (nội tuyến)", () => {
  const p = enhancePreviewPlan({ deinterlace: { mode: 0 } }, true, false, 1.125);
  assert.equal(p.deinterlaceTap, true);
  assert.deepEqual(p.applied, ["deinterlace"]);
  assert.equal(p.needsOffscreen, false);
});

ok("plan: toggle tắt → tap false dù scaleY = 1 (preview hiện khung gốc)", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, false, false, 1);
  assert.equal(p.deinterlaceTap, false);
  assert.deepEqual(p.applied, []);
  assert.deepEqual(p.notApproximated, ["deinterlace"]);
  assert.equal(p.needsOffscreen, false);
});

ok("plan: cả ba ở scaleY 1 → applied [deinterlace, stabilize, denoise], tap true", () => {
  const p = enhancePreviewPlan(
    { deinterlace: true, stabilize: { smoothing: 20 }, denoise: { strength: 0.8 } },
    true,
    false,
    1,
  );
  assert.equal(p.deinterlaceTap, true);
  assert.deepEqual(p.applied, ["deinterlace", "stabilize", "denoise"]);
  assert.deepEqual(p.notApproximated, []);
  assert.equal(p.needsOffscreen, true);
});

ok("plan: deint + speedKeyframes ở scaleY 1 → tap vẫn áp, stabilize vẫn bị chặn, KHÔNG offscreen (zoom 1 + alpha 0 → nội tuyến)", () => {
  const p = enhancePreviewPlan(
    { deinterlace: true, stabilize: { smoothing: 10 } },
    true,
    true,
    1,
  );
  assert.equal(p.deinterlaceTap, true);
  assert.equal(p.stabilizeBlockedBySpeedRamp, true);
  approx(p.stabilizeZoom, 1);
  assert.deepEqual(p.applied, ["deinterlace"]);
  assert.deepEqual(p.notApproximated, ["stabilize"]);
  assert.equal(p.needsOffscreen, false);
});

ok("plan: ngưỡng biên — 0.899 không tap, 0.9 tap; NaN/âm → không tap", () => {
  assert.equal(enhancePreviewPlan({ deinterlace: true }, true, false, 0.899).deinterlaceTap, false);
  assert.equal(enhancePreviewPlan({ deinterlace: true }, true, false, 0.9).deinterlaceTap, true);
  assert.equal(enhancePreviewPlan({ deinterlace: true }, true, false, NaN).deinterlaceTap, false);
  assert.equal(enhancePreviewPlan({ deinterlace: true }, true, false, -1).deinterlaceTap, false);
});

ok("plan: không deinterlace ở scaleY 1 → tap false, không đổi gì khác", () => {
  const p = enhancePreviewPlan({ denoise: true }, true, false, 1);
  assert.equal(p.deinterlaceTap, false);
  assert.deepEqual(p.applied, ["denoise"]);
  assert.deepEqual(p.notApproximated, []);
});

// --- Hook debug ---------------------------------------------------------------
ok("hook debug: deinterlaceTap theo đúng plan (true ở scaleY 1, false ở letterbox); deint đơn lẻ → offscreenApplied false (nội tuyến, đợt 76 D4)", () => {
  const pBig = enhancePreviewPlan({ deinterlace: true }, true, false, 1);
  const dBig = enhancePreviewDebug("c1", pBig, pBig.needsOffscreen);
  assert.equal(dBig.deinterlaceTap, true);
  assert.deepEqual(dBig.applied, ["deinterlace"]);
  assert.equal(dBig.offscreenApplied, false);
  const pSmall = enhancePreviewPlan({ deinterlace: true }, true, false, 0.38);
  const dSmall = enhancePreviewDebug("c1", pSmall, false);
  assert.equal(dSmall.deinterlaceTap, false);
  assert.deepEqual(dSmall.notApproximated, ["deinterlace"]);
  assert.equal(dSmall.offscreenApplied, false);
});

runAll();
