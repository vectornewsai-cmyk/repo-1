// enhancePreview76D4.test.ts — Phase 9 đợt 76, luồng D4: tap khử răng cưa qua half-res
// intermediate khi chỉ có deint (đóng nợ G5 đợt 75 C8 — FPS deint-only
// 0.65–0.71× FAIL ngưỡng 0.75× vì tap đi qua enhanceCanvas = 2 lần vẽ
// full-res thay vì 1).
//
// Cơ chế mới (lib/enhancePreview.ts + preview.tsx, deintHalfResSource):
// khi plan có deinterlaceTap mà KHÔNG cần offscreen (không denoise alpha,
// không stabilize zoom) thì preview.tsx đưa drawSrc qua canvas trung gian
// dw×(dh/2) (downscale dọc 2× — mỗi hàng đích đã là trung bình ~2 hàng
// nguồn, hạt nhân [1,1]/2 như tap) rồi các nhánh vẽ sau vẽ canvas đó lên
// khổ đích dw×dh như thường. Vẫn 2 lần vẽ nhưng lần 1 chỉ 1/4 pixel và
// lần 2 lấy mẫu từ canvas rẻ hơn video (probe-c s=1.13: R 0.85 → 0.66,
// thông lượng 0.49× vẽ thường). Bản inline-shift (cộng +0.5px vào lần
// vẽ cuối) đã thử và BỎ: FPS 0.99× nhưng R không giảm ở upscale (headed
// lần 1: R 0.74 → 0.74; probe-b: shift chỉ có tác dụng ở s≈1.0).
// Tap đi kèm denoise/stabilize vẫn qua offscreen enhanceCanvas như cũ.
//
// Test này khóa (logic THUẦN trong apps/web/src/lib/enhancePreview.ts):
// tín hiệu half-res là needsOffscreen=false + deinterlaceTap=true.
// Việc cộng offset đúng nhánh vẽ được khóa bằng headed
// clicktest-76d4-deint-fps.mjs (G2 R + MAD, G5 FPS, G7 combo).
//
// Chạy bằng esbuild bundle (mẫu C8, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview76D4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round76-d4/enhancePreview76D4.test.cjs \
//     && node /tmp/round76-d4/enhancePreview76D4.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round76-d4/enhancePreview76D4.test.cjs
import assert from "node:assert/strict";
import {
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
  console.log(`D4 deint half-res round 76 [lang=${LANG}]: ${pass}/${queue.length} pass`);
}

/** So sánh số thực với sai số làm tròn (tránh 0.1 + 0.2 != 0.3). */
function approx(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `kỳ vọng ${expected}, thực tế ${actual}`,
  );
}

// --- Tín hiệu half-res: tap true + needsOffscreen false --------------------
ok("half-res: deint đơn lẻ ở scaleY 1 → tap true, applied [deinterlace], KHÔNG offscreen", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, true, false, 1);
  assert.equal(p.deinterlaceTap, true);
  assert.deepEqual(p.applied, ["deinterlace"]);
  assert.deepEqual(p.notApproximated, []);
  assert.equal(p.needsOffscreen, false);
  approx(p.denoiseBlendAlpha, 0);
  approx(p.stabilizeZoom, 1);
});

ok("half-res: deint đơn lẻ ở scaleY 0.9 (biên) → tap true, KHÔNG offscreen", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, true, false, 0.9);
  assert.equal(p.deinterlaceTap, true);
  assert.equal(p.needsOffscreen, false);
});

ok("half-res: deint + denoise strength 0 → alpha 0 nên vẫn qua half-res (KHÔNG offscreen enhanceCanvas)", () => {
  const p = enhancePreviewPlan({ deinterlace: true, denoise: { strength: 0 } }, true, false, 1);
  assert.equal(p.deinterlaceTap, true);
  assert.deepEqual(p.applied, ["deinterlace", "denoise"]);
  assert.equal(p.needsOffscreen, false);
});

ok("half-res: deint + stabilize bị chặn bởi speed ramp → zoom 1 nên vẫn qua half-res", () => {
  const p = enhancePreviewPlan(
    { deinterlace: true, stabilize: { smoothing: 10 } },
    true,
    true,
    1,
  );
  assert.equal(p.deinterlaceTap, true);
  assert.equal(p.stabilizeBlockedBySpeedRamp, true);
  approx(p.stabilizeZoom, 1);
  assert.equal(p.needsOffscreen, false);
});

// --- Tap đi kèm denoise/stabilize vẫn qua offscreen -------------------------
ok("offscreen: deint + denoise 0.5 → tap true, offscreen true (tap nằm trong lần vẽ gốc enhanceCanvas)", () => {
  const p = enhancePreviewPlan(
    { deinterlace: true, denoise: { strength: 0.5 } },
    true,
    false,
    1,
  );
  assert.equal(p.deinterlaceTap, true);
  assert.deepEqual(p.applied, ["deinterlace", "denoise"]);
  assert.equal(p.needsOffscreen, true);
  approx(p.denoiseBlendAlpha, 0.486);
});

ok("offscreen: deint + stabilize smoothing 20 → tap true, zoom 1.026, offscreen true", () => {
  const p = enhancePreviewPlan(
    { deinterlace: true, stabilize: { smoothing: 20 } },
    true,
    false,
    1,
  );
  assert.equal(p.deinterlaceTap, true);
  assert.deepEqual(p.applied, ["deinterlace", "stabilize"]);
  assert.equal(p.needsOffscreen, true);
  approx(p.stabilizeZoom, 1.026);
});

ok("offscreen: cả ba ở scaleY 1 → tap true, applied đủ 3, offscreen true", () => {
  const p = enhancePreviewPlan(
    { deinterlace: true, stabilize: { smoothing: 20 }, denoise: { strength: 0.8 } },
    true,
    false,
    1,
  );
  assert.equal(p.deinterlaceTap, true);
  assert.deepEqual(p.applied, ["deinterlace", "stabilize", "denoise"]);
  assert.equal(p.needsOffscreen, true);
});

// --- Dưới ngưỡng / toggle tắt: không tap, không offscreen --------------------
ok("không tap: deint đơn lẻ ở scaleY 0.75 → tap false, KHÔNG offscreen", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, true, false, 0.75);
  assert.equal(p.deinterlaceTap, false);
  assert.deepEqual(p.applied, []);
  assert.deepEqual(p.notApproximated, ["deinterlace"]);
  assert.equal(p.needsOffscreen, false);
});

ok("không tap: toggle tắt ở scaleY 1 → tap false, KHÔNG offscreen", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, false, false, 1);
  assert.equal(p.deinterlaceTap, false);
  assert.equal(p.needsOffscreen, false);
});

// --- Hook debug phân biệt half-res / offscreen enhanceCanvas -------------------
ok("hook debug: deint đơn lẻ → offscreenApplied false + tap true (half-res); deint+denoise → offscreenApplied true", () => {
  const pInline = enhancePreviewPlan({ deinterlace: true }, true, false, 1);
  const dInline = enhancePreviewDebug("c1", pInline, pInline.needsOffscreen);
  assert.equal(dInline.deinterlaceTap, true);
  assert.equal(dInline.offscreenApplied, false);
  const pOff = enhancePreviewPlan(
    { deinterlace: true, denoise: { strength: 0.5 } },
    true,
    false,
    1,
  );
  const dOff = enhancePreviewDebug("c1", pOff, pOff.needsOffscreen);
  assert.equal(dOff.deinterlaceTap, true);
  assert.equal(dOff.offscreenApplied, true);
});

runAll();
