// previewEngine.test.ts — Test motion preview parity (S4, Phase 9 đợt 8, gap E8;
// M2 đợt 9: ghost theo frames/weights thật + mask/SR).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
// Phạm vi: motion đi qua videoClipVisual + buildPreviewSpec/flatten có giữ
// field motion không (flatten giữ qua spread — xem MOTION_PREVIEW_LIMITS.md).
// KHÔNG test vẽ canvas thật (ghosting cần DOM — đường vẽ mask/SR trong
// preview.tsx chỉ kiểm chứng bằng đọc code + tsc, xem LIMITS §7); ở đây
// test hàm thuần resolveMotionBlurGhost/normalizeMotion quyết định số
// bóng và alpha của mọi đường vẽ.
import assert from "node:assert/strict";
import {
  MOTION_BLUR_GHOST_ALPHA,
  MOTION_BLUR_PREVIEW_ENABLED,
  motionBadgeText,
  normalizeMotion,
  resolveMotionBlurGhost,
  videoClipVisual,
  type MotionVisual,
} from "./previewEngine.ts";
import { buildPreviewSpec } from "./nestedPreview.ts";

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

/** So sánh số thực với sai số (weights chuẩn hoá gây sai số float). */
function close(actual: number, expected: number, eps = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= eps, `kỳ vọng ${expected}, nhận ${actual}`);
}
function closeAll(actual: readonly number[], expected: readonly number[]): void {
  assert.equal(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) close(actual[i], expected[i]);
}

function videoClip(extra: Record<string, unknown> = {}): never {
  return {
    kind: "video", id: "v1", src: "a.mp4",
    start: 0, duration: 10, in: 0, out: 10,
    ...extra,
  } as never;
}

// Motion chuẩn hoá của clip đã phẳng (clip phẳng mang motion THÔ theo
// shape S1 — phải qua normalizeMotion mới thành MotionVisual).
function motionOf(clip: unknown): MotionVisual {
  return normalizeMotion(clip as { motion?: unknown });
}

console.log("== previewEngine: motion (S4) ==");

ok("motion qua videoClipVisual: giữ đủ interpolation/targetFps/miMode/motionBlur (shape S1)", () => {
  const vis = videoClipVisual(videoClip({
    motion: { interpolation: "minterpolate", targetFps: 60, miMode: "mci", motionBlur: { frames: 3 } },
  }), 1, 1920, 1080, 1920, 1080);
  assert.equal(vis.motion.interpolation, "minterpolate");
  assert.equal(vis.motion.targetFps, 60);
  assert.equal(vis.motion.miMode, "mci");
  assert.equal(vis.motion.motionBlur, true);
  assert.equal(vis.motion.hasMotion, true);
});

ok("clip không motion: mặc định an toàn, hành vi cũ không đổi", () => {
  const vis = videoClipVisual(videoClip({ opacity: 0.5 }), 1, 1920, 1080, 1920, 1080);
  assert.deepEqual(vis.motion, {
    interpolation: null, targetFps: null, miMode: null, motionBlur: false, hasMotion: false,
    blurGhost: null,
  });
  assert.equal(vis.opacity, 0.5);
  assert.equal(vis.scale, 1);
  assert.equal(vis.rotation, 0);
});

ok("motion rác: không throw, về mặc định (none/dup/NaN/kiểu sai)", () => {
  const vis = videoClipVisual(videoClip({
    motion: { interpolation: "none", targetFps: Number.NaN, motionBlur: "yes" },
  }), 1, 1920, 1080, 1920, 1080);
  assert.equal(vis.motion.interpolation, null);
  assert.equal(vis.motion.targetFps, null);
  assert.equal(vis.motion.motionBlur, false);
  assert.equal(vis.motion.hasMotion, false);
  // "dup" đã bị S1 loại khỏi spec (không nội suy frame nào) → preview không claim nội suy.
  const visDup = videoClipVisual(videoClip({
    motion: { interpolation: "dup", targetFps: 60 },
  }), 1, 1920, 1080, 1920, 1080);
  assert.equal(visDup.motion.interpolation, null);
  const vis2 = videoClipVisual(videoClip({ motion: "minterpolate" }), 1, 1920, 1080, 1920, 1080);
  assert.equal(vis2.motion.hasMotion, false);
  const vis3 = videoClipVisual(videoClip({ motion: { targetFps: -5 } }), 1, 1920, 1080, 1920, 1080);
  assert.equal(vis3.motion.targetFps, null);
});

ok("normalizeMotion: chỉ motionBlur object cũng tính là có motion; boolean tạm vẫn nhận", () => {
  const m = normalizeMotion({ motion: { motionBlur: { frames: 3 } } });
  assert.equal(m.hasMotion, true);
  assert.equal(m.interpolation, null);
  assert.equal(normalizeMotion({ motion: { motionBlur: true } }).motionBlur, true);
  assert.equal(normalizeMotion({ motion: {} }).hasMotion, false);
});

ok("motionBadgeText: NỘI SUY / BLUR≈ / rỗng đúng từng trường hợp", () => {
  assert.equal(motionBadgeText({ interpolation: "minterpolate", targetFps: 60, miMode: "mci", motionBlur: false, hasMotion: true }), "NỘI SUY");
  assert.equal(motionBadgeText({ interpolation: null, targetFps: null, miMode: null, motionBlur: true, hasMotion: true }), "BLUR≈");
  assert.equal(motionBadgeText({ interpolation: "minterpolate", targetFps: null, miMode: null, motionBlur: true, hasMotion: true }), "NỘI SUY • BLUR≈");
  assert.equal(motionBadgeText({ interpolation: null, targetFps: null, miMode: null, motionBlur: false, hasMotion: false }), "");
});

ok("hằng số ghost: alpha 0.35, công tắc preview bật", () => {
  assert.equal(MOTION_BLUR_GHOST_ALPHA, 0.35);
  assert.equal(MOTION_BLUR_PREVIEW_ENABLED, true);
});

console.log("== previewEngine: ghost theo frames/weights thật (M2) ==");

ok("resolveMotionBlurGhost: frames+weights → số bóng frames-1, alpha tỉ lệ weights", () => {
  // Cửa sổ tmix 4 frame, weights [4,2,1,1]: frame hiện tại (weights cuối)
  // không phải bóng; 3 bóng cũ→mới ứng weights [4,2,1], tỉ lệ với max 4.
  const g = resolveMotionBlurGhost({ frames: 4, weights: [4, 2, 1, 1] })!;
  assert.equal(g.frames, 4);
  closeAll(g.weights, [0.5, 0.25, 0.125, 0.125]);
  closeAll(g.ghostAlphas, [0.35, 0.175, 0.0875]);
  // Trọng số không đều phía cuối: bóng mới nhất yếu hơn bóng cũ nhất.
  const g2 = resolveMotionBlurGhost({ frames: 3, weights: [1, 1, 4] })!;
  closeAll(g2.ghostAlphas, [0.35, 0.35]); // 2 bóng đầu weights bằng nhau
  // Thứ tự: weights[0] (cũ nhất) → ghostAlphas[0]; đảo weights thì đảo alpha.
  const g3 = resolveMotionBlurGhost({ frames: 3, weights: [1, 4, 1] })!;
  closeAll(g3.ghostAlphas, [0.0875, 0.35]);
});

ok("resolveMotionBlurGhost: weights đều → mọi bóng đều 0.35; frames chỉ → chia đều", () => {
  const g = resolveMotionBlurGhost({ frames: 3 })!;
  assert.equal(g.frames, 3);
  closeAll(g.weights, [1 / 3, 1 / 3, 1 / 3]);
  closeAll(g.ghostAlphas, [0.35, 0.35]);
  const g5 = resolveMotionBlurGhost({ frames: 5 })!;
  assert.equal(g5.ghostAlphas.length, 4);
  closeAll(g5.ghostAlphas, [0.35, 0.35, 0.35, 0.35]);
  // Chỉ weights → frames = weights.length (đúng resolve S1).
  const gw = resolveMotionBlurGhost({ weights: [1, 3] })!;
  assert.equal(gw.frames, 2);
  closeAll(gw.weights, [0.25, 0.75]);
  closeAll(gw.ghostAlphas, [0.35]);
});

ok("resolveMotionBlurGhost: object rỗng → mặc định 3 frame đều; shape tạm cũ → 1 bóng", () => {
  const g = resolveMotionBlurGhost({})!;
  assert.equal(g.frames, 3);
  closeAll(g.ghostAlphas, [0.35, 0.35]);
  for (const legacy of [true, 3]) {
    const gl = resolveMotionBlurGhost(legacy)!;
    assert.equal(gl.frames, 2);
    closeAll(gl.ghostAlphas, [0.35]); // giữ đúng hành vi ghost cũ, không bịa frames
  }
});

ok("resolveMotionBlurGhost: không blur / rác → null, không throw", () => {
  for (const raw of [null, undefined, false, 0, -2, Number.NaN, "yes"]) {
    assert.equal(resolveMotionBlurGhost(raw), null);
  }
});

ok("resolveMotionBlurGhost: fallback khoan dung, không throw (frames/weights lệch)", () => {
  // frames ngoài 2..8 → lấy weights.length nếu weights dùng được.
  assert.equal(resolveMotionBlurGhost({ frames: 9, weights: [1, 1, 1] })!.frames, 3);
  assert.equal(resolveMotionBlurGhost({ frames: 1.5 })!.frames, 3);
  // weights dài khác frames → bỏ weights, chia đều theo frames.
  const m = resolveMotionBlurGhost({ frames: 3, weights: [1, 1] })!;
  closeAll(m.weights, [1 / 3, 1 / 3, 1 / 3]);
  closeAll(m.ghostAlphas, [0.35, 0.35]);
  // weights chứa 0/âm/không hữu hạn → không dùng được → chia đều.
  closeAll(resolveMotionBlurGhost({ frames: 2, weights: [1, 0] })!.weights, [0.5, 0.5]);
  closeAll(resolveMotionBlurGhost({ frames: 2, weights: [1, -1] })!.weights, [0.5, 0.5]);
  closeAll(resolveMotionBlurGhost({ frames: 2, weights: [1, Number.NaN] })!.weights, [0.5, 0.5]);
});

ok("normalizeMotion mang blurGhost: videoClipVisual thấy đủ frames/weights", () => {
  const vis = videoClipVisual(videoClip({
    motion: { motionBlur: { frames: 4, weights: [4, 2, 1, 1] } },
  }), 1, 1920, 1080, 1920, 1080);
  assert.equal(vis.motion.motionBlur, true);
  assert.equal(vis.motion.blurGhost!.frames, 4);
  closeAll(vis.motion.blurGhost!.ghostAlphas, [0.35, 0.175, 0.0875]);
  // motionBlur object rỗng → vẫn bật, về mặc định 3 frame đều.
  const vis2 = videoClipVisual(videoClip({ motion: { motionBlur: {} } }), 1, 1920, 1080, 1920, 1080);
  assert.equal(vis2.motion.motionBlur, true);
  assert.equal(vis2.motion.blurGhost!.frames, 3);
  // motionBlur rác (chuỗi) → không blur, blurGhost null (không throw).
  const vis3 = videoClipVisual(videoClip({ motion: { motionBlur: "yes" } }), 1, 1920, 1080, 1920, 1080);
  assert.equal(vis3.motion.motionBlur, false);
  assert.equal(vis3.motion.blurGhost, null);
});

console.log("== previewEngine: motion qua buildPreviewSpec/flatten ==");

ok("buildPreviewSpec giữ motion khi cắt clip theo adjustment (spread copy)", () => {
  const spec = {
    version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 },
    tracks: [
      { id: "v", kind: "video", clips: [{
        kind: "video", id: "a", src: "a.mp4", start: 0, duration: 10, in: 0, out: 10,
        motion: { interpolation: "minterpolate", targetFps: 60, motionBlur: { frames: 3 } },
      }] },
      { id: "adj", kind: "adjustment", clips: [{
        kind: "adjustment", id: "adj", start: 3, duration: 2, filter: { lut: "vcut-cinematic" },
      }] },
    ],
  } as never;
  const out = buildPreviewSpec(spec);
  const track = out.tracks.find((t) => t.id === "v")!;
  assert.equal(track.clips.length, 3);
  for (const seg of track.clips) {
    const m = motionOf(seg);
    assert.equal(m.interpolation, "minterpolate");
    assert.equal(m.targetFps, 60);
    assert.equal(m.motionBlur, true);
  }
  // Spec gốc không bị sửa (clip gốc vẫn 1 đoạn, motion nguyên).
  const orig = (spec as unknown as { tracks: Array<{ clips: Array<{ start: number }> }> }).tracks[0].clips;
  assert.equal(orig.length, 1);
});

ok("buildPreviewSpec giữ motion của clip lá trong nested đã phẳng", () => {
  const spec = {
    version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 },
    tracks: [
      { id: "n", kind: "video", clips: [{
        kind: "nested", id: "n1", start: 0, duration: 10, in: 0,
        tracks: [{ kind: "video", clips: [{
          kind: "video", id: "leaf", src: "a.mp4", start: 0, duration: 10, in: 0, out: 10,
          motion: { interpolation: "minterpolate", targetFps: 30, motionBlur: { frames: 2 } },
        }] }],
      }] },
    ],
  } as never;
  const out = buildPreviewSpec(spec);
  const nestedTrack = out.tracks.find((t) => t.id === "__nested-video")!;
  assert.equal(nestedTrack.clips.length, 1);
  const m = motionOf(nestedTrack.clips[0]);
  assert.equal(m.interpolation, "minterpolate");
  assert.equal(m.motionBlur, true);
});

console.log(`\n${pass} test passed`);
