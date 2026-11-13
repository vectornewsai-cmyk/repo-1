// enhancePreview62R3.test.ts — Phase 9 đợt 62, luồng R3: BLEND thay blur
// thuần cho denoise preview + chặn stabilize ở preview khi clip có
// speedKeyframes + (phần headed) motion blur không blend lúc pause.
//
// (a) BLEND — đóng nợ đợt 61 R3 §2.5/§6.2 (thang blur thuần vẫn overstate
// đầu thấp, làm mềm cạnh, vùng chết s<~0.27):
//   Cơ chế mới: composite = (1-a)·gốc + a·blur(3.0px), a = strength.
//   Đợt 63 R3 đổi a sang piecewise-linear qua 4 knot khớp hqdn3d
//   (0.3→0.195, 0.5→0.486, 0.8→0.806, 1→0.981 — xem
//   enhancePreview63R3.test.ts + LIMITS đợt 63 §2); các kỳ vọng dưới
//   đây đã cập nhật theo ánh xạ mới, bán kính vẫn cố định 3.0px.
//   Bằng chứng đợt 62 (probe-blend-r62, flat15 1280×720, B=3.0px,
//   alpha = strength lúc đó):
//     s=0.3 → giảm std -28.9% (hqdn3d -19%, sai +9.9 — vẫn overstate
//       nhưng tốt hơn +41 của blur thuần đợt 61)
//     s=0.5 → -48.4% (hqdn3d -47%, sai +1.4)
//     s=0.8 → -73.6% (hqdn3d -74%, sai -0.4)
//     s=1.0 → -83.7% (hqdn3d -83%, sai +0.7)
//   Step-edge 25–75%: 0px ở a≤0.5 (blur thuần đã 2px ở s=0.3), 2px ở
//   a=0.6–0.7, 4px ở a≥0.8. Không còn vùng chết (a>0 luôn đổi pixel).
//   Downscale-upscale đã thử và LOẠI (probe-downscale-r62: f=0.95 đã
//   -37%, đường cong dẹt rồi nhảy bậc ở f=0.25 — xem LIMITS §2).
//   Test này khóa ÁNH XẠ (piecewise đợt 63, bán kính cố định 3.0px);
//   số giảm std nằm ở probe + LIMITS, không đo lại bằng pixel ở đây.
//
// (c) CHẶN STABILIZE KHI CÓ SPEED RAMP — đóng nợ đợt 61 R3 §6.5:
//   Render chặn hẳn (validate.js + render.js, exit 1) vì vidstabdetect
//   chạy theo trim gốc, không khớp các đoạn ramp; panel đã chặn preset
//   ở UI (đợt 61 R2, hướng (i)); preview vẫn vẽ gợi ý zoom cho trạng
//   thái lỗi cũ (tạo trước khi chặn / qua MCP/CLI/file project) —
//   mâu thuẫn cuối cùng này được đóng ở preview: plan chặn stabilize
//   (zoom 1, vào notApproximated, cờ stabilizeBlockedBySpeedRamp),
//   denoise vẫn áp bình thường. Mở ở render (vidstabdetect từng đoạn
//   ramp) là việc riêng, chưa làm — xem LIMITS §4.
//
// (b) MOTION BLUR LÚC PAUSE — gate drawTransport.playing ở preview.tsx,
//   không unit-test được ở đây (cần DOM/vòng lặp): kiểm chứng bằng
//   headed combo (clicktest-61r3-combo.mjs, C3 mới) — xem LIMITS §3.
//
// Chạy bằng esbuild bundle (mẫu R3 đợt 61, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview62R3.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round62-r3/enhancePreview62R3.test.cjs \
//     && node /tmp/round62-r3/enhancePreview62R3.test.cjs
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
  console.log(`R3 blend + speed-block đợt 62: ${pass}/${queue.length} pass`);
}

/** So sánh số thực với sai số làm tròn. */
function approx(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `kỳ vọng ${expected}, thực tế ${actual}`,
  );
}

// --- (a) Blend: alpha piecewise đợt 63, bán kính cố định --------------------
ok("blend: alpha piecewise ở 4 knot (0.195/0.486/0.806/0.981), bán kính 3.0px", () => {
  for (const [s, a] of [[0, 0], [0.2, 0.13], [0.3, 0.195], [0.5, 0.486], [0.8, 0.806], [1, 0.981]] as const) {
    approx(denoiseBlendAlpha(s), a);
    approx(denoiseBlurPx(s), s > 0 ? 3.0 : 0);
  }
  assert.equal(ENHANCE_PREVIEW_BLUR_RADIUS_PX, 3.0);
});

ok("blend: alpha liên tục, không plateau — mọi mức strength đều khác nhau", () => {
  // Thang blur thuần đợt 61 chỉ có 5 mức hiệu quả rời rạc (plateau
  // 0.8–1.3 / 1.4–1.8 / ...); blend cho giá trị khác nhau ở mọi alpha
  // kể cả các mức kề nhau (0.31 vs 0.32) — không còn bậc lượng tử.
  const seen = new Set<number>();
  for (let i = 0; i <= 20; i++) {
    const a = denoiseBlendAlpha(i / 20);
    assert.ok(!seen.has(a), `alpha ${a} trùng nhau ở 2 mức strength (plateau)`);
    seen.add(a);
  }
  assert.equal(seen.size, 21);
});

ok("blend: plan denoise 0.3 → alpha 0.195 + blur 3.0 (hết vùng chết s<0.27)", () => {
  // Thang cũ: s=0.3 → blur 0.9px vẫn là plateau -60% (overstate so với
  // hqdn3d -19%); thang đợt 62: alpha 0.3 → đo thật -28.9% ở 720p (sai
  // +9.9); thang đợt 63: alpha 0.195 → -18.5% (sai -0.5) và khác 0 —
  // không còn no-op ở đầu thấp.
  const p = enhancePreviewPlan({ denoise: { strength: 0.3 } }, true);
  approx(p.denoiseBlendAlpha, 0.195);
  approx(p.denoiseBlurPx, 3.0);
  assert.equal(p.needsOffscreen, true);
  assert.deepEqual(p.applied, ["denoise"]);
});

ok("blend: hook debug mang đủ field mới (alpha + cờ speed-block + tap deinterlace đợt 75 C8)", () => {
  const p = enhancePreviewPlan({ denoise: true }, true);
  const d = enhancePreviewDebug("c1", p, true);
  approx(d.denoiseBlurPx, 3.0);
  approx(d.denoiseBlendAlpha, 0.486);
  assert.equal(d.stabilizeBlockedBySpeedRamp, false);
  assert.equal(d.deinterlaceTap, false);
  assert.equal(d.offscreenApplied, true);
  assert.deepEqual(Object.keys(d).sort(), [
    "applied",
    "clipId",
    "deinterlaceTap",
    "denoiseBlendAlpha",
    "denoiseBlurPx",
    "enabled",
    "hasEnhance",
    "notApproximated",
    "offscreenApplied",
    "stabilizeBlockedBySpeedRamp",
    "stabilizeZoom",
  ].sort());
});

// --- (c) Chặn stabilize ở preview khi clip có speedKeyframes ----------------
ok("speed-block: stabilize + ramp → zoom 1, stabilize vào notApproximated", () => {
  const p = enhancePreviewPlan(
    { deinterlace: true, stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } },
    true,
    true,
  );
  approx(p.stabilizeZoom, 1);
  assert.equal(p.stabilizeBlockedBySpeedRamp, true);
  assert.deepEqual(p.applied, ["denoise"]);
  assert.deepEqual(p.notApproximated, ["deinterlace", "stabilize"]);
  // Denoise vẫn áp bình thường (chỉ stabilize bị chặn).
  approx(p.denoiseBlendAlpha, 0.486);
  approx(p.denoiseBlurPx, 3.0);
  assert.equal(p.needsOffscreen, true);
});

ok("speed-block: không ramp → stabilize vẽ gợi ý như cũ (zoom 1.023)", () => {
  const p = enhancePreviewPlan(
    { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } },
    true,
    false,
  );
  approx(p.stabilizeZoom, 1.023);
  assert.equal(p.stabilizeBlockedBySpeedRamp, false);
  assert.deepEqual(p.applied, ["stabilize", "denoise"]);
  assert.deepEqual(p.notApproximated, []);
});

ok("speed-block: ramp nhưng không stabilize → cờ false, không đổi gì", () => {
  const p = enhancePreviewPlan({ denoise: { strength: 0.5 } }, true, true);
  assert.equal(p.stabilizeBlockedBySpeedRamp, false);
  approx(p.stabilizeZoom, 1);
  assert.deepEqual(p.applied, ["denoise"]);
  assert.equal(p.needsOffscreen, true);
});

ok("speed-block: stabilize + ramp + denoise strength 0 → không offscreen", () => {
  const p = enhancePreviewPlan(
    { stabilize: { smoothing: 10 }, denoise: { strength: 0 } },
    true,
    true,
  );
  assert.equal(p.stabilizeBlockedBySpeedRamp, true);
  approx(p.stabilizeZoom, 1);
  approx(p.denoiseBlendAlpha, 0);
  assert.equal(p.needsOffscreen, false);
  assert.deepEqual(p.applied, ["denoise"]);
  assert.deepEqual(p.notApproximated, ["stabilize"]);
});

ok("speed-block: toggle tắt + ramp → cờ false (toggle mới là thứ chặn)", () => {
  const p = enhancePreviewPlan(
    { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } },
    false,
    true,
  );
  assert.equal(p.stabilizeBlockedBySpeedRamp, false);
  assert.deepEqual(p.applied, []);
  assert.deepEqual(p.notApproximated, ["stabilize", "denoise"]);
});

ok("speed-block: hook debug phản ánh đúng cờ chặn", () => {
  const p = enhancePreviewPlan({ stabilize: { smoothing: 10 } }, true, true);
  const d = enhancePreviewDebug("c2", p, false);
  assert.equal(d.stabilizeBlockedBySpeedRamp, true);
  approx(d.stabilizeZoom, 1);
  assert.equal(d.offscreenApplied, false);
});

runAll();
