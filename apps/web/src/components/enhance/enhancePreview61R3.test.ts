// enhancePreview61R3.test.ts — Phase 9 đợt 61, luồng R3: HIỆU CHUẨN thang
// blur denoise của preview (đóng nợ đợt 60 §5.3, mục b).
//
// LỊCH SỬ ĐỢT 61 (giữ nguyên làm bằng chứng — xem
// docs/PHASE9_ROUND61_R3_PREVIEW_ENHANCE_CAL_LIMITS.md): thang cũ strength
// 0..1 → blur 0..1.2px là SAI (blur < 0.8px no-op, plateau); thang mới
// đợt 61 (strength × 3.0px) khớp đầu cao nhưng VẪN overstate đầu thấp
// (mức hiệu quả nhỏ nhất -60%, s=0.3 cần -19%) và làm mềm cạnh.
//
// ĐỢT 62 R3 THAY CƠ CHẾ (xem docs/PHASE9_ROUND62_R3_BLUR_REWORK_LIMITS.md
// §2 + enhancePreview62R3.test.ts): denoise preview nay là BLEND
// (1-a)·gốc + a·blur(3.0px), a = strength — đường cong liên tục, đo ở
// đúng 4 mức strength (flat15 1280×720): s=0.3 → -28.9% (hqdn3d -19%,
// sai +9.9 — vẫn overstate nhưng tốt hơn +41 của blur thuần), s=0.5 →
// -48.4% (-47%), s=0.8 → -73.6% (-74%), s=1.0 → -83.7% (-83%);
// step-edge 0px ở a≤0.5. Test này khóa cơ chế MỚI (bán kính cố định
// 3.0px + alpha = strength); bằng chứng đo nằm ở probe-blend-r62.
//
// Chạy bằng esbuild bundle (mẫu Q1 đợt 60, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview61R3.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round61-r3/enhancePreview61R3.test.cjs \
//     && node /tmp/round61-r3/enhancePreview61R3.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round61-r3/enhancePreview61R3.test.cjs
import assert from "node:assert/strict";
import {
  ENHANCE_PREVIEW_BLUR_RADIUS_PX,
  denoiseBlendAlpha,
  denoiseBlurPx,
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
  console.log(`R3 hiệu chuẩn blur đợt 61: ${pass}/${queue.length} pass`);
}

/** So sánh số thực với sai số làm tròn. */
function approx(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `kỳ vọng ${expected}, thực tế ${actual}`,
  );
}

// --- Thang hiệu chuẩn MỚI (đợt 63 R3): blend piecewise, bán kính cố định 3.0px ---
ok("cal: strength 0..1 → alpha piecewise (0.195/0.486/0.806/0.981), bán kính blur cố định 3.0px", () => {
  approx(denoiseBlendAlpha(0), 0);
  approx(denoiseBlendAlpha(0.3), 0.195);
  approx(denoiseBlendAlpha(0.5), 0.486);
  approx(denoiseBlendAlpha(0.8), 0.806);
  approx(denoiseBlendAlpha(1), 0.981);
  assert.equal(ENHANCE_PREVIEW_BLUR_RADIUS_PX, 3.0);
  approx(denoiseBlurPx(0), 0);
  approx(denoiseBlurPx(0.3), 3.0);
  approx(denoiseBlurPx(0.5), 3.0);
  approx(denoiseBlurPx(1), 3.0);
});

ok("cal: alpha ngoài [0,1] bị clamp, không âm/không vượt 0.981", () => {
  approx(denoiseBlendAlpha(-0.2), 0);
  approx(denoiseBlendAlpha(1.5), 0.981);
  approx(denoiseBlendAlpha(NaN), 0);
});

ok("cal: 4 điểm hiệu chuẩn của blend khớp hqdn3d (đo bằng probe-blend-r63)", () => {
  // Số đo thật (flat15 1280×720, B=3.0px, lặp lại cho cùng số): s=0.3 →
  // -18.5%, s=0.5 → -45.7%, s=0.8 → -73.8%, s=1.0 → -82.9%; hqdn3d:
  // -19% / -47% / -74% / -83% (sai -0.5 / -1.3 / -0.2 / -0.1 — đợt 62
  // dùng alpha = strength: sai +9.9 / +1.4 / -0.4 / +0.7). Unit test
  // khóa ÁNH XẠ (piecewise qua 4 knot) cho ra đúng 4 điểm đó; số giảm std
  // nằm ở probe + LIMITS, không đo lại bằng pixel ở đây (không có DOM
  // trong test node).
  // Ánh xạ phải đơn điệu tăng thật và phân biệt được 4 mức strength
  // (thang blur thuần đợt 61: 0.9 vs 1.5px khác plateau nhưng vẫn nhảy
  // bậc; blend cho giá trị khác nhau ở MỌI mức alpha, không chỉ 4 mốc).
  const a02 = denoiseBlendAlpha(0.2);
  const a05 = denoiseBlendAlpha(0.5);
  const a08 = denoiseBlendAlpha(0.8);
  const a10 = denoiseBlendAlpha(1);
  assert.ok(a02 < a05 && a05 < a08 && a08 < a10, "alpha phải đơn điệu tăng");
  assert.notEqual(a02, a05, "a=0.2 và a=0.5 phải khác nhau (không plateau)");
  assert.notEqual(a05, a08, "a=0.5 và a=0.8 phải khác nhau (không plateau)");
  // Mọi strength > 0 đều dùng bán kính 3.0px (nằm trên plateau hiệu quả
  // của blur, không còn vùng chết dưới đầu gối 0.8px).
  for (const s of [0.05, 0.2, 0.5, 0.8, 1]) {
    assert.equal(denoiseBlurPx(s), 3.0, `strength ${s} > 0 phải dùng blur 3.0px`);
  }
});

ok("cal: các mức strength của preset P8 phân biệt được (0.3/0.5/0.8)", () => {
  const light = denoiseBlendAlpha(0.3);
  const balanced = denoiseBlendAlpha(0.5);
  const strong = denoiseBlendAlpha(0.8);
  assert.notEqual(light, balanced, "Nhẹ (0.3) và Cân bằng (0.5) phải khác alpha");
  assert.notEqual(balanced, strong, "Cân bằng (0.5) và Mạnh (0.8) phải khác alpha");
  // Không còn vùng chết: strength nhỏ nhất của preset (0.3) vẫn cho
  // alpha 0.3 > 0 (thang cũ: blur 0.36px < đầu gối 0.8px → no-op).
  assert.ok(light > 0 && balanced > 0 && strong > 0, "mọi preset phải có alpha > 0");
});

// --- Plan dùng thang mới ------------------------------------------------------
ok("cal: plan denoise true (strength mặc định 0.5) → blur 3.0px + alpha 0.486", () => {
  const p = enhancePreviewPlan({ denoise: true }, true);
  approx(p.denoiseBlurPx, 3.0);
  approx(p.denoiseBlendAlpha, 0.486);
  assert.equal(p.needsOffscreen, true);
});

ok("cal: plan combo (denoise 0.8) → blur 3.0px + alpha 0.806, zoom 1.026", () => {
  const p = enhancePreviewPlan(
    { deinterlace: true, stabilize: { smoothing: 20 }, denoise: { strength: 0.8 } },
    true,
  );
  approx(p.denoiseBlurPx, 3.0);
  approx(p.denoiseBlendAlpha, 0.806);
  approx(p.stabilizeZoom, 1.026);
  assert.deepEqual(p.applied, ["stabilize", "denoise"]);
  assert.deepEqual(p.notApproximated, ["deinterlace"]);
});

ok("cal: strength 0 vẫn blur 0 + alpha 0 (không offscreen) — giữ hành vi cũ", () => {
  const p = enhancePreviewPlan({ denoise: { strength: 0 } }, true);
  approx(p.denoiseBlurPx, 0);
  approx(p.denoiseBlendAlpha, 0);
  assert.equal(p.needsOffscreen, false);
});

runAll();
