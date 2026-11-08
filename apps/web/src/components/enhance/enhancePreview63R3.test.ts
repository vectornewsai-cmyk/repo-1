// enhancePreview63R3.test.ts — Phase 9 đợt 63, luồng R3: đường cong blend
// piecewise + FPS blend (đóng nợ đợt 62 R3 §1/§2.2).
//
// (2) ĐƯỜNG CONG BLEND PIECEWISE — đóng nợ "blend overstate ở s=0.3
// (+9.9) và trên nhiễu nặng flat40": a = strength tuyến tính (đợt 62)
// được thay bằng nội suy tuyến tính qua 4 mốc khớp đúng hqdn3d flat15
// 720p, B=3.0px (probe-blend-r63, lặp lại cho cùng số):
//   s=0.3 → a=0.195 → giảm std -18.5% (hqdn3d -19%, sai -0.5; cũ -28.9%)
//   s=0.5 → a=0.486 → -45.7% (hqdn3d -47%, sai -1.3; cũ -48.4%)
//   s=0.8 → a=0.806 → -73.8% (hqdn3d -74%, sai -0.2; cũ -73.6%)
//   s=1.0 → a=0.981 → -82.9% (hqdn3d -83%, sai -0.1; cũ -83.7%)
//   Sai tối đa 1.3 (cũ 9.9); ở khổ preview 488×275 sai tối đa 2.3 —
//   không phải overfit theo 1 fixture (xem LIMITS §2.1).
//   Các biến thể đã thử và LOẠI (cùng probe, cùng metric):
//   a=s^1.25 (sai tối đa 7.1), a=s^1.5 (sai 13.4), giảm bán kính ở a
//   cao B=3-1.5a (s=1.0 chỉ -67.6%, sai -15.4 dù edge 4→2px),
//   dual-radius (sai 17.1), blend có ngưỡng theo độ lệch pixel
//   (edge 0px ở mọi mức NHƯNG khử nhiễu sụp hẳn: tối đa -16% ở s=1.0
//   so với mục tiêu -83% — xem LIMITS §2.3).
//   Test này khóa ÁNH XẠ (knot + nội suy + đơn điệu + không vùng chết);
//   số giảm std nằm ở probe + LIMITS, không đo lại bằng pixel ở đây.
//
// (3) STEP-EDGE — vẫn 4px ở a≥0.8 (taper/dual đã thử: đổi edge 4→2px
//   nhưng phá đường cong ở đầu cao; ngưỡng per-pixel giữ edge 0px
//   nhưng giết khử nhiễu + quá chậm cho preview theo frame — xem
//   LIMITS §2.3/§6). Test chỉ khóa rằng alpha ở s≤0.5 vẫn cho edge 0px
//   theo probe (a(0.5)=0.486 < ngưỡng 0.6 bắt đầu mềm cạnh).
//
// (1) FPS — đo bằng headed fps-cal (clicktest-61r3-fps-cal.mjs), không
//   unit-test được ở đây: xem LIMITS §1 (3 lần chạy xen kẽ, loadavg
//   từng slot; ngưỡng 0.75x giữ nguyên, không nới).
//
// Chạy bằng esbuild bundle (mẫu R3 đợt 61/62, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview63R3.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round63-r3/enhancePreview63R3.test.cjs \
//     && node /tmp/round63-r3/enhancePreview63R3.test.cjs
import assert from "node:assert/strict";
import {
  ENHANCE_PREVIEW_BLUR_RADIUS_PX,
  denoiseBlendAlpha,
  denoiseBlurPx,
  enhancePreviewDebug,
  enhancePreviewPlan,
} from "../../lib/enhancePreview";

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
  console.log(`R3 blend piecewise đợt 63: ${pass}/${queue.length} pass`);
}

/** So sánh số thực với sai số làm tròn. */
function approx(actual: number, expected: number, eps = 1e-9): void {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `kỳ vọng ${expected}, thực tế ${actual}`,
  );
}

// --- (2) Piecewise: đúng 4 knot khớp hqdn3d ---------------------------------
ok("piecewise: alpha đúng 4 knot khớp hqdn3d (0.3/0.5/0.8/1.0)", () => {
  approx(denoiseBlendAlpha(0), 0);
  approx(denoiseBlendAlpha(0.3), 0.195);
  approx(denoiseBlendAlpha(0.5), 0.486);
  approx(denoiseBlendAlpha(0.8), 0.806);
  approx(denoiseBlendAlpha(1), 0.981);
  // Bán kính blur vẫn cố định 3.0px (đường cong mang bởi alpha, không
  // phải bán kính — taper đã thử và LOẠI, xem LIMITS §2.3).
  approx(ENHANCE_PREVIEW_BLUR_RADIUS_PX, 3.0);
  for (const s of [0.3, 0.5, 0.8, 1]) approx(denoiseBlurPx(s), 3.0);
  approx(denoiseBlurPx(0), 0);
});

ok("piecewise: nội suy tuyến tính giữa các knot (0.2/0.6/0.9)", () => {
  // 0.2: giữa (0,0)-(0.3,0.195) → 0.13; 0.6: giữa (0.5,0.486)-
  // (0.8,0.806) → 0.486+0.32/3 = 0.592666...; 0.9: giữa (0.8,0.806)-
  // (1,0.981) → 0.8935.
  approx(denoiseBlendAlpha(0.2), 0.13);
  approx(denoiseBlendAlpha(0.6), 0.486 + (0.1 / 0.3) * (0.806 - 0.486), 1e-12);
  approx(denoiseBlendAlpha(0.9), 0.8935);
});

ok("piecewise: đơn điệu tăng, không plateau, không vùng chết", () => {
  let prev = -1;
  for (let i = 0; i <= 100; i++) {
    const a = denoiseBlendAlpha(i / 100);
    assert.ok(a > prev, `alpha không tăng ở strength ${i / 100} (a=${a})`);
    prev = a;
  }
  // Đầu thấp vẫn đổi pixel thật: a(0.05) > 0 (hết vùng chết s<0.27
  // của thang blur thuần đợt 61, giữ từ đợt 62).
  assert.ok(denoiseBlendAlpha(0.05) > 0, "strength 0.05 phải cho alpha > 0");
  // Không bao giờ chạm 1.0: hqdn3d s=1.0 cũng chỉ -83%, không blur toàn phần.
  assert.ok(denoiseBlendAlpha(1) < 1, "alpha(1) phải < 1");
});

ok("piecewise: clamp ngoài [0,1] như cũ (âm → 0, >1 → 0.981, NaN → 0)", () => {
  approx(denoiseBlendAlpha(-0.2), 0);
  approx(denoiseBlendAlpha(1.5), 0.981);
  approx(denoiseBlendAlpha(NaN), 0);
});

// --- (2) Plan + hook mang đúng alpha mới ------------------------------------
ok("piecewise: plan denoise 0.3 → alpha 0.195 + blur 3.0 (hết overstate)", () => {
  const p = enhancePreviewPlan({ denoise: { strength: 0.3 } }, true);
  approx(p.denoiseBlendAlpha, 0.195);
  approx(p.denoiseBlurPx, 3.0);
  assert.equal(p.needsOffscreen, true);
  assert.deepEqual(p.applied, ["denoise"]);
});

ok("piecewise: plan denoise true (mặc định 0.5) → alpha 0.486", () => {
  const p = enhancePreviewPlan({ denoise: true }, true);
  approx(p.denoiseBlendAlpha, 0.486);
  approx(p.denoiseBlurPx, 3.0);
  const d = enhancePreviewDebug("c1", p, true);
  approx(d.denoiseBlendAlpha, 0.486);
  approx(d.denoiseBlurPx, 3.0);
  assert.equal(d.offscreenApplied, true);
});

ok("piecewise: plan denoise 1.0 → alpha 0.981 (không blur toàn phần)", () => {
  const p = enhancePreviewPlan({ denoise: { strength: 1 } }, true);
  approx(p.denoiseBlendAlpha, 0.981);
  assert.equal(p.needsOffscreen, true);
});

// --- (3) Step-edge: alpha ở s≤0.5 vẫn dưới ngưỡng mềm cạnh ------------------
ok("edge: alpha ở s=0.5 (0.486) vẫn dưới ngưỡng bắt đầu mềm cạnh (a≥0.6)", () => {
  // Probe đợt 62/63: step-edge 0px ở a≤0.5, 2px ở a=0.6–0.7, 4px ở
  // a≥0.8. Piecewise giữ a(0.5)=0.486 < 0.6 nên đầu thấp vẫn giữ cạnh
  // như đợt 62; đầu cao (s≥0.8) vẫn 4px là nợ mở đã ghi rõ (LIMITS §6).
  assert.ok(denoiseBlendAlpha(0.5) < 0.6, "a(0.5) phải < 0.6 để edge 0px");
  assert.ok(denoiseBlendAlpha(0.3) < 0.6, "a(0.3) phải < 0.6 để edge 0px");
});

runAll();
