// enhancePreview77E1.test.ts — Phase 9 đợt 77, luồng E1: deint-only qua
// intermediate thu hẹp dọc (đợt 76 D4: dw×dh/2; E1 đã THỬ dw×dh/4 rồi
// QUAY VỀ 2 — xem dưới).
//
// Bối cảnh: FPS deint-only half-res headed 0.72–0.73×, FAIL ngưỡng 0.75×
// (D4). Probe-77e1 (probe-77e1-deint-fast.mjs) chứng minh đường inline 1
// lần vẽ KHÔNG đạt: shift +0.5px R 0.85 → 0.88 ở s=1.13 (xác nhận D4
// probe-b); tap2 2 lần vẽ từ video R 0.58 ở 1.13 nhưng FAIL tiêu chí 1:1
// (0.67 > 0.55) và thông lượng 1.66–2.4×; blur(1px) R 0.52–0.53 nhưng
// thông lượng 2.3–61× và vgrad chỉ 20–41% — cả ba LOẠI. Ứng viên chốt
// lúc đó: intermediate dw×(dh/4): lần 1 chỉ 1/2 pixel của half-res,
// probe R 0.58 ở s=1.13 / 0.54 ở s=1.0 (≤ 0.55 ✓), hgrad giữ 91% như
// half-res, đổi lại vgrad 38% (half-res 59%). Probe cũng chứng minh
// smoothing "low" / "medium" / "high" cho pixel Y HỆT nhau ở downscale
// đúng 2× (R/vgrad/hgrad/MAD giống tới 3 chữ số thập phân, cả 2 video)
// nên giữ "high".
// KẾT QUẢ HEADED — DIVISOR 4 KHÔNG ĐƯỢC GIỮ (xem LIMITS E1 §3): G5 lần
// 1 0.83× PASS, lần 2 0.64× FAIL (gộp 10 tỉ lệ mean 0.735, không tách
// được khỏi half-res 0.72–0.73 của D4 / 0.78 baseline cùng ngày trong
// nhiễu tải; baseline chỉ 1.5–2.4 fps), và G7b FAIL hệ thống cả 2 lần
// (mask MAD 0.6396 so với 0.0036 của half-res). Vì không có lợi FPS đo
// được mà chất lượng tệ hơn, E1 QUAY VỀ divisor 2 (half-res D4).
//
// Test này khóa trạng thái CUỐI (logic THUẦN trong
// apps/web/src/lib/enhancePreview.ts): hằng divisor = 2 (chẵn — mỗi
// hàng intermediate lấy mẫu đúng giữa 2 hàng nguồn kề, một hàng mỗi
// field, nên triệt tiêu xen kẽ; divisor lẻ như 3 sẽ lấy mẫu đúng trên
// 1 hàng nguồn và combing sống lại) và tín hiệu đường intermediate:
// needsOffscreen=false + deinterlaceTap=true cho deint đơn lẻ (không
// đổi so với D4). Việc vẽ đúng khổ dw×(dh/2) được khóa bằng headed
// clicktest-77e1-deint-fps.mjs (G2 R + MAD, G5 FPS, G7 combo) — chạy
// lại sau khi quay về divisor 2 phải cho G2 R 0.51 + G7b MAD 0.0036
// như D4.
//
// Chạy bằng esbuild bundle (mẫu D4, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview77E1.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round77-e1/enhancePreview77E1.test.cjs \
//     && node /tmp/round77-e1/enhancePreview77E1.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round77-e1/enhancePreview77E1.test.cjs
import assert from "node:assert/strict";
import {
  ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR,
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
  console.log(`E1 deint intermediate round 77 [lang=${LANG}]: ${pass}/${queue.length} pass`);
}

/** So sánh số thực với sai số làm tròn (tránh 0.1 + 0.2 != 0.3). */
function approx(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `kỳ vọng ${expected}, thực tế ${actual}`,
  );
}

// --- Hằng divisor intermediate: 2 (D4 half-res — E1 thử 4 rồi quay về) ---
ok("divisor intermediate deint-only = 2 (half-res D4 — E1 thử 4 rồi quay về vì không chứng minh được nhanh hơn + FAIL G7b mask)", () => {
  assert.equal(ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR, 2);
});

ok("divisor chẵn và ≥ 2: mỗi hàng intermediate trung bình 2 hàng nguồn kề (một hàng mỗi field)", () => {
  const d = ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR;
  assert.ok(d >= 2, `divisor ${d} < 2`);
  assert.equal(d % 2, 0, `divisor ${d} lẻ — lấy mẫu đúng trên 1 hàng nguồn, combing sống lại`);
});

// --- Tín hiệu intermediate: tap true + needsOffscreen false (như D4) -----
ok("intermediate: deint đơn lẻ ở scaleY 1 → tap true, applied [deinterlace], KHÔNG offscreen", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, true, false, 1);
  assert.equal(p.deinterlaceTap, true);
  assert.deepEqual(p.applied, ["deinterlace"]);
  assert.deepEqual(p.notApproximated, []);
  assert.equal(p.needsOffscreen, false);
  approx(p.denoiseBlendAlpha, 0);
  approx(p.stabilizeZoom, 1);
});

ok("intermediate: deint đơn lẻ ở scaleY 0.9 (biên) → tap true, KHÔNG offscreen", () => {
  const p = enhancePreviewPlan({ deinterlace: true }, true, false, 0.9);
  assert.equal(p.deinterlaceTap, true);
  assert.equal(p.needsOffscreen, false);
});

ok("intermediate: deint + denoise strength 0 → alpha 0 nên vẫn qua intermediate (KHÔNG offscreen enhanceCanvas)", () => {
  const p = enhancePreviewPlan({ deinterlace: true, denoise: { strength: 0 } }, true, false, 1);
  assert.equal(p.deinterlaceTap, true);
  assert.deepEqual(p.applied, ["deinterlace", "denoise"]);
  assert.equal(p.needsOffscreen, false);
});

ok("intermediate: deint + stabilize bị chặn bởi speed ramp → zoom 1 nên vẫn qua intermediate", () => {
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

// --- Tap đi kèm denoise/stabilize vẫn qua offscreen (không đổi) ------------
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

// --- Hook debug: offscreenApplied false + tap true = đường intermediate ------
ok("hook debug: deint đơn lẻ → offscreenApplied false + tap true (intermediate); deint+denoise → offscreenApplied true", () => {
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
