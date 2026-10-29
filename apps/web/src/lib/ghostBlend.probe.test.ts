// ghostBlend.probe.test.ts — Probe pixel cho ngữ nghĩa ghost đợt 12 (T1).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/ghostBlend.probe.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules,
// giống previewEngine.test.ts).
//
// Vì sao probe này đo được bằng Node mà không cần canvas thật:
// preview.tsx cần DOM nên không chạy trong Node; nhưng phép composite
// mà preview.tsx dùng là Canvas 2D source-over thuần — hàm sourceOver
// dưới đây cài đúng công thức đó (out = a·src + (1−a)·dst cho frame đục,
// dst bắt đầu trong suốt, frame đầu alpha 1). Probe đo 2 chuỗi vẽ trên
// CÙNG phép source-over đó, chỉ khác thứ tự/alpha:
//   CŨ (đợt 8–9): ghost vẽ dưới frame hiện tại đục (alpha 1) → ghost = 0.
//   MỚI (đợt 12): mọi frame composite vào lớp theo motionBlurBlendPlan
//     (hàm THẬT trong previewEngine.ts, cũng là hàm preview.tsx gọi)
//     → lớp phải bằng trung bình có trọng số Σ wᵢ·Fᵢ của tmix.
// Vì vậy probe chứng minh được (a) bug cũ: pixel vùng ghost trước sửa
// bằng đúng frame không ghost (khác biệt = 0); (b) sau sửa: pixel khác
// frame không ghost (> 0) và bằng đúng giá trị tmix theo weights;
// (c) frame không ghost không đổi (plan 1 frame, alpha 1).
// Giới hạn trung thực: probe KHÔNG chạy canvas thật của trình duyệt —
// pixel canvas thật vẫn cần click-test trên browser (xem
// GHOSTBLEND_T1_LIMITS.md §6). Những gì probe đo là toán composite và
// kế hoạch blend thật, không phải ảnh chụp màn hình.
import assert from "node:assert/strict";
import {
  motionBlurBlendPlan,
  resolveMotionBlurGhost,
} from "./previewEngine.ts";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
function close(actual: number, expected: number, eps = 1e-9): void {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `kỳ vọng ${expected}, nhận ${actual} (sai số ${Math.abs(actual - expected)})`,
  );
}

/** Source-over 1 kênh cho frame đục: out = a·src + (1−a)·dst. */
function sourceOver(dst: number, src: number, a: number): number {
  return a * src + (1 - a) * dst;
}

/** Chuỗi vẽ CŨ: ghost (alpha trail cũ) rồi frame hiện tại đục (alpha 1). */
function oldTrail(framesOldToNew: number[], ghostAlphas: number[]): number {
  let dst = 0; // nền trong suốt/đen — không quan trọng: frame cuối đục át hết.
  const ghosts = framesOldToNew.slice(0, -1);
  for (let i = 0; i < ghosts.length; i++) dst = sourceOver(dst, ghosts[i], ghostAlphas[i]);
  return sourceOver(dst, framesOldToNew[framesOldToNew.length - 1], 1);
}

/** Chuỗi vẽ MỚI: composite vào lớp theo plan thật, rồi lớp lên nền. */
function newBlend(framesOldToNew: number[], weights: number[], ghostCount: number): number {
  const plan = motionBlurBlendPlan(weights, ghostCount);
  const frames = framesOldToNew.slice(framesOldToNew.length - plan.length);
  let layer = 0;
  let started = false;
  for (let i = 0; i < plan.length; i++) {
    layer = started ? sourceOver(layer, frames[i], plan[i].blendAlpha) : frames[i];
    started = true;
  }
  return layer;
}

/** Trung bình có trọng số trực tiếp (định nghĩa tmix, không qua source-over). */
function tmix(frames: number[], weights: number[]): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  return frames.reduce((acc, f, i) => acc + (weights[i] / sum) * f, 0);
}

console.log("== ghostBlend probe: pixel vùng ghost, cũ vs mới (đợt 12 T1) ==");

// --- Bug cũ: pixel vùng ghost trước sửa = đúng frame không ghost ---
ok("BUG CŨ: ghost dưới frame đục → pixel = frame hiện tại, khác biệt vs không-ghost = 0", () => {
  // Vật chuyển động: pixel này ở frame cũ = 0 (nền), frame giữa = 120,
  // frame hiện tại = 240 (vật đã tới). weights [0.5, 0.25, 0.25].
  const frames = [0, 120, 240];
  const spec = resolveMotionBlurGhost({ frames: 3, weights: [2, 1, 1] })!;
  assert.deepEqual(spec.weights, [0.5, 0.25, 0.25]);
  const oldOut = oldTrail(frames, spec.ghostAlphas);
  const noGhost = frames[2];
  console.log(`    cũ: pixel=${oldOut}, không-ghost=${noGhost}, khác biệt=${Math.abs(oldOut - noGhost)}`);
  assert.equal(oldOut, 240);
  assert.equal(Math.abs(oldOut - noGhost), 0);
});

// --- Sau sửa: pixel lộ ghost và bằng đúng tmix theo weights ---
ok("MỚI: pixel = tmix ΣwF = 90, khác frame không-ghost 150 (> 0)", () => {
  const frames = [0, 120, 240];
  const weights = [0.5, 0.25, 0.25];
  const out = newBlend(frames, weights, 2);
  const expected = tmix(frames, weights); // 0.5·0 + 0.25·120 + 0.25·240 = 90
  console.log(`    mới: pixel=${out}, tmix=${expected}, không-ghost=240, khác biệt=${Math.abs(out - 240)}`);
  close(out, 90);
  close(out, expected);
  assert.ok(Math.abs(out - 240) > 0, "ghost phải lộ ra, khác frame không ghost");
});

ok("MỚI: alpha chạy đúng công thức (frame đầu 1, sau đó wᵢ/tổng tiền tố)", () => {
  const plan = motionBlurBlendPlan([0.5, 0.25, 0.25], 2);
  assert.deepEqual(plan.map((p) => p.weight), [0.5, 0.25, 0.25]);
  close(plan[0].blendAlpha, 1);
  close(plan[1].blendAlpha, 0.25 / 0.75);
  close(plan[2].blendAlpha, 0.25 / 1);
  console.log(`    plan alphas=[${plan.map((p) => p.blendAlpha.toFixed(6)).join(", ")}]`);
});

ok("MỚI: thứ tự weights đúng — đảo weights thì pixel đổi đúng hướng", () => {
  // Cùng 3 frame, weights đảo: [0.1, 0.2, 0.7] → 160; [0.7, 0.2, 0.1] → 40.
  const frames = [0, 100, 200];
  const a = newBlend(frames, [0.1, 0.2, 0.7], 2);
  const b = newBlend(frames, [0.7, 0.2, 0.1], 2);
  console.log(`    weights [0.1,0.2,0.7] → ${a}; [0.7,0.2,0.1] → ${b}`);
  close(a, 160);
  close(b, 40);
  close(a, tmix(frames, [0.1, 0.2, 0.7]));
  close(b, tmix(frames, [0.7, 0.2, 0.1]));
});

ok("MỚI: RGB từng kênh đều bằng tmix (không lệch kênh)", () => {
  // Pixel RGB: cũ (255,0,0), giữa (0,255,0), hiện tại (0,0,255).
  const weights = [0.5, 0.25, 0.25];
  const r = newBlend([255, 0, 0], weights, 2);
  const g = newBlend([0, 255, 0], weights, 2);
  const b = newBlend([0, 0, 255], weights, 2);
  console.log(`    RGB mới=(${r}, ${g}, ${b}), kỳ vọng (127.5, 63.75, 63.75)`);
  close(r, 127.5);
  close(g, 63.75);
  close(b, 63.75);
});

ok("MỚI: weights đều frames=4 → trung bình 4 frame = 120", () => {
  const frames = [0, 80, 160, 240];
  const out = newBlend(frames, [0.25, 0.25, 0.25, 0.25], 3);
  console.log(`    đều 4 frame: pixel=${out}, kỳ vọng 120`);
  close(out, 120);
});

ok("MỚI: shape tạm cũ (boolean true) → frames=2, blend = trung bình 2 frame", () => {
  const spec = resolveMotionBlurGhost(true)!;
  assert.deepEqual(spec.weights, [0.5, 0.5]);
  const out = newBlend([0, 200], spec.weights, 1);
  console.log(`    boolean true: pixel=${out}, kỳ vọng 100`);
  close(out, 100);
});

ok("MỚI: cửa sổ thiếu bóng (mới 1 bóng của frames=4) → chuẩn hoá lại, vẫn sáng", () => {
  // frames=4 đều, ring mới có 1 bóng (bóng mới nhất = frame index 2 = 160),
  // hiện tại = 240 → cửa sổ [160, 240] chuẩn hoá [0.5, 0.5] → 200.
  const plan = motionBlurBlendPlan([0.25, 0.25, 0.25, 0.25], 1);
  assert.deepEqual(plan.map((p) => p.weight), [0.5, 0.5]);
  const out = newBlend([0, 80, 160, 240], [0.25, 0.25, 0.25, 0.25], 1);
  console.log(`    thiếu bóng: plan weights=[0.5, 0.5], pixel=${out}, kỳ vọng 200`);
  close(out, 200);
});

ok("MỚI: kẹp ghostCount vượt frames-1 và ghostCount 0 → không vỡ", () => {
  const plan = motionBlurBlendPlan([0.5, 0.25, 0.25], 99);
  assert.equal(plan.length, 3);
  const single = motionBlurBlendPlan([0.5, 0.25, 0.25], 0);
  assert.deepEqual(single, [{ weight: 1, blendAlpha: 1 }]);
});

ok("KHÔNG GHOST: frame không blur vẽ trực tiếp, pixel = frame hiện tại đúng 100%", () => {
  // preview.tsx: ring rỗng / không blur → drawMotionBlurBlended trả false
  // → đường vẽ trực tiếp frame hiện tại, không qua lớp blend. Ở tầng plan,
  // điều này tương ứng plan 1 frame alpha 1 — đo tại đây, đường vẽ trực
  // tiếp là code-path đã giữ nguyên trong preview.tsx (không sửa).
  const plan = motionBlurBlendPlan([0.5, 0.25, 0.25], 0);
  const out = newBlend([0, 120, 240], [0.5, 0.25, 0.25], 0);
  console.log(`    không-ghost: plan=${JSON.stringify(plan)}, pixel=${out}, kỳ vọng 240`);
  assert.equal(out, 240);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].blendAlpha, 1);
});

console.log(`\n== ghostBlend probe: ${pass} kiểm chứng xanh ==`);
