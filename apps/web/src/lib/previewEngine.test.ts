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
  maskAlphaArray,
  maskAlphaAt,
  maskAlphaCacheKey,
  applyMask,
  motionBadgeText,
  motionBlurBlendPlan,
  motionBlurPadGhostCount,
  normalizeMotion,
  resolveMotionBlurGhost,
  rvfcFrameDecision,
  rvfcSupported,
  videoClipVisual,
  videoFrameIndex,
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

// Phase 9 đợt 92 T2: maskAlphaArray / maskAlphaCacheKey — cache canvas
// alpha mask (tránh vòng lặp pixel mỗi tick). Khóa đúng: mảng alpha phải
// khớp maskAlphaAt từng pixel, và khớp đúng alpha mà applyMask ghi.
console.log("== previewEngine: maskAlphaArray / maskAlphaCacheKey (T2 đợt 92) ==");
ok("maskAlphaArray khớp maskAlphaAt từng pixel (ellipse/rect, feather, invert)", () => {
  const masks = [
    { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0 },
    { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0.2 },
    { shape: "rect", x: 0.3, y: 0.6, w: 0.5, h: 0.4, feather: 0.1 },
    { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0.2, invert: true },
    { shape: "rect", x: 0.5, y: 0.5, w: 1, h: 1, feather: 0 },
  ] as never[];
  for (const mask of masks) {
    const W = 16;
    const H = 12;
    const arr = maskAlphaArray(mask as never, W, H);
    assert.equal(arr.length, W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const expected = Math.round(maskAlphaAt(mask as never, W, H, x, y) * 255);
        assert.equal(arr[y * W + x], expected, `mask ${JSON.stringify(mask)} tại (${x},${y})`);
      }
    }
  }
});
ok("maskAlphaArray khớp alpha mà applyMask ghi (alpha nguồn 255)", () => {
  const mask = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0.2 } as never;
  const W = 16;
  const H = 12;
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    data[i * 4] = 200;
    data[i * 4 + 1] = 100;
    data[i * 4 + 2] = 50;
    data[i * 4 + 3] = 255;
  }
  applyMask({ width: W, height: H, data } as never, mask);
  const arr = maskAlphaArray(mask, W, H);
  for (let i = 0; i < W * H; i++) {
    assert.equal(data[i * 4 + 3], arr[i], `alpha pixel ${i}`);
    assert.equal(data[i * 4], 200, "RGB không đổi");
  }
});
ok("maskAlphaArray: ellipse viền cứng — trong 255, ngoài 0", () => {
  const mask = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0 } as never;
  const arr = maskAlphaArray(mask, 16, 12);
  assert.equal(arr[6 * 16 + 8], 255); // tâm
  assert.equal(arr[0], 0); // góc
  assert.equal(arr[11 * 16 + 15], 0);
});
ok("maskAlphaCacheKey: cùng hình học → cùng khoá; khác x/feather/invert/kích thước → khác khoá", () => {
  const base = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0 } as never;
  const k = maskAlphaCacheKey(base, 640, 360);
  assert.equal(maskAlphaCacheKey({ ...base, x: 0.5 } as never, 640, 360), k);
  assert.notEqual(maskAlphaCacheKey({ ...base, x: 0.51 } as never, 640, 360), k);
  assert.notEqual(maskAlphaCacheKey({ ...base, feather: 0.2 } as never, 640, 360), k);
  assert.notEqual(maskAlphaCacheKey({ ...base, invert: true } as never, 640, 360), k);
  assert.notEqual(maskAlphaCacheKey({ ...base, shape: "rect" } as never, 640, 360), k);
  assert.notEqual(maskAlphaCacheKey(base, 320, 180), k);
  // Keyframes KHÔNG nằm trong khoá (caller đã resolve thành x/y/w/h tĩnh).
  assert.equal(maskAlphaCacheKey({ ...base, keyframes: [{ t: 0, x: 0.1, y: 0.1, w: 0.2, h: 0.2 }] } as never, 640, 360), k);
});

console.log(`\n${pass} test passed`);

// Phase 9 đợt 90 R1: videoFrameIndex — gate snapshot motion blur theo
// frame video (hướng (iii) Q2 §7.1).
console.log("== previewEngine: videoFrameIndex (R1 đợt 90) ==");
ok("videoFrameIndex: floor(t·fps), 2 tick trong cùng frame cho cùng chỉ số", () => {
  assert.equal(videoFrameIndex(0.5, 30), 15);
  assert.equal(videoFrameIndex(0.5, 60), 30);
  // 60fps tick: t=0.5167 và t=0.5333 đều nằm trong frame 15 (30fps) —
  // cùng chỉ số → snapshot thứ 2 bị gate chặn (không trùng).
  assert.equal(videoFrameIndex(0.5167, 30), 15);
  assert.equal(videoFrameIndex(0.5333, 30), 15);
  assert.equal(videoFrameIndex(0.5334, 30), 16);
  assert.equal(videoFrameIndex(0, 30), 0);
  assert.equal(videoFrameIndex(2.999, 30), 89);
});
ok("videoFrameIndex: fps 24/25/60 + biên frame (epsilon chống sai số float)", () => {
  assert.equal(videoFrameIndex(1.0, 24), 24);
  assert.equal(videoFrameIndex(1.0, 25), 25);
  // Đợt 93 U1: epsilon nay là 1µs THỜI GIAN (cộng trước khi nhân fps)
  // để hấp thụ lượng tử hoá µs của mediaTime/currentTime Chromium —
  // thời điểm cách biên < 1µs tròn lên frame sau (0.9999999 → 30, đổi
  // từ 29 của R1: giá trị này nhỏ hơn 1 bước lượng tử nên không phân
  // biệt được với đúng biên 1.0s); cách biên 10µs vẫn ở frame trước.
  assert.equal(videoFrameIndex(0.9999999, 30), 30);
  assert.equal(videoFrameIndex(0.99999, 30), 29);
  assert.equal(videoFrameIndex(0.4999, 30), 14);
  // Epsilon 1µs (đơn vị thời gian): thời điểm cách biên < 1µs vẫn tính
  // vào frame sau — chống lượng tử hoá µs của đầu vào, không ảnh hưởng
  // thời gian thật (1µs/33ms ≈ 0,003% khung hình ở 30fps).
  assert.equal(videoFrameIndex(0.5 - 1e-9, 30), 15);
});
ok("videoFrameIndex: mediaTime lượng tử hoá µs của Chromium (đợt 93 U1)", () => {
  // PTS k/30s tròn về µs gần nhất: k≡1 mod 3 tròn XUỐNG 0,33µs
  // (0.033333, 0.133333, 0.233333, 0.333333, …) — epsilon cũ 1e-6
  // đơn vị frame không đủ nên các frame này floor về k−1 và pump bỏ
  // qua ("duplicate" giả, ~33% callback). Với epsilon 1µs thời gian,
  // mọi giá trị lượng tử hoá đều về đúng frame của nó.
  assert.equal(videoFrameIndex(0.033333, 30), 1);
  assert.equal(videoFrameIndex(0.066667, 30), 2);
  assert.equal(videoFrameIndex(0.1, 30), 3);
  assert.equal(videoFrameIndex(0.133333, 30), 4);
  assert.equal(videoFrameIndex(0.166667, 30), 5);
  assert.equal(videoFrameIndex(0.2, 30), 6);
  assert.equal(videoFrameIndex(0.233333, 30), 7);
  assert.equal(videoFrameIndex(0.266667, 30), 8);
  assert.equal(videoFrameIndex(0.3, 30), 9);
  assert.equal(videoFrameIndex(0.333333, 30), 10);
  assert.equal(videoFrameIndex(0.966667, 30), 29);
  assert.equal(videoFrameIndex(1.033333, 30), 31);
  assert.equal(videoFrameIndex(2.966667, 30), 89);
  // 60fps: bước lượng tử 1µs = 6e-5 frame — cùng quy tắc.
  assert.equal(videoFrameIndex(0.016667, 60), 1);
  assert.equal(videoFrameIndex(0.033333, 60), 2);
  assert.equal(videoFrameIndex(0.05, 60), 3);
});
ok("videoFrameIndex: đầu vào không hợp lệ → -1 (không gate, giữ hành vi cũ)", () => {
  assert.equal(videoFrameIndex(NaN, 30), -1);
  assert.equal(videoFrameIndex(1.0, 0), -1);
  assert.equal(videoFrameIndex(1.0, -30), -1);
  assert.equal(videoFrameIndex(1.0, NaN), -1);
  assert.equal(videoFrameIndex(-0.5, 30), -1);
});

// Phase 9 đợt 91 S1: rvfcFrameDecision / rvfcSupported — pump
// requestVideoFrameCallback snapshot đúng mỗi frame video trình chiếu.
console.log("== previewEngine: rvfcFrameDecision / rvfcSupported (S1 đợt 91) ==");
ok("rvfcFrameDecision: frame mới / trùng / lùi 1 / nhảy lùi > 1 / chưa có frame trước", () => {
  assert.equal(rvfcFrameDecision(-1, 10), "capture"); // chưa có frame trước
  assert.equal(rvfcFrameDecision(10, 11), "capture"); // tiến 1 frame
  assert.equal(rvfcFrameDecision(10, 13), "capture"); // tiến nhảy (speed 2x / tick thưa)
  assert.equal(rvfcFrameDecision(10, 10), "duplicate"); // cùng frame trình chiếu lại
  assert.equal(rvfcFrameDecision(10, 9), "capture"); // lùi đúng 1 (phát ngược từng bước)
  assert.equal(rvfcFrameDecision(10, 8), "reset-capture"); // nhảy lùi > 1 (seek/loop)
  assert.equal(rvfcFrameDecision(10, 0), "reset-capture"); // loop về đầu
  assert.equal(rvfcFrameDecision(0, 0), "duplicate");
});
ok("rvfcFrameDecision: frameIndex không hợp lệ → duplicate (không capture, không đổi ring)", () => {
  assert.equal(rvfcFrameDecision(10, -1), "duplicate");
  assert.equal(rvfcFrameDecision(-1, -1), "duplicate");
});
ok("rvfcSupported: duck-typed, không cần DOM thật", () => {
  assert.equal(rvfcSupported(null), false);
  assert.equal(rvfcSupported(undefined), false);
  assert.equal(rvfcSupported(42), false);
  assert.equal(rvfcSupported("video"), false);
  assert.equal(rvfcSupported({}), false);
  assert.equal(rvfcSupported({ requestVideoFrameCallback: "yes" }), false);
  assert.equal(rvfcSupported({ requestVideoFrameCallback: () => 1 }), true);
  assert.equal(rvfcSupported({ requestVideoFrameCallback: () => 1, cancelVideoFrameCallback: () => {} }), true);
});

ok("motionBlurPadGhostCount (đợt 101 C4): ring đói → pad đủ frames-1 ghost; đủ/rỗng → 0", () => {
  assert.equal(motionBlurPadGhostCount(3, 1), 1); // tmix-3, pool 1 → clone ghost cũ nhất 1 lần
  assert.equal(motionBlurPadGhostCount(3, 2), 0); // đủ ghost, không pad
  assert.equal(motionBlurPadGhostCount(3, 0), 0); // pool rỗng → vẽ trực tiếp, không pad
  assert.equal(motionBlurPadGhostCount(4, 1), 2); // tmix-4, pool 1 → clone 2 lần
  assert.equal(motionBlurPadGhostCount(2, 1), 0); // frames=2 chỉ cần 1 ghost
  assert.equal(motionBlurPadGhostCount(1, 0), 0); // không blur
});
ok("motionBlurBlendPlan (đợt 101 C4): pool 1 đói → pair [0.5,0.5] (dải D); pad lên 2 → triple đều (dải A)", () => {
  const w = [1 / 3, 1 / 3, 1 / 3];
  const pair = motionBlurBlendPlan(w, 1);
  assert.equal(pair.length, 2);
  assert.deepEqual(pair.map((p) => p.weight), [0.5, 0.5]);
  const triple = motionBlurBlendPlan(w, 2);
  assert.equal(triple.length, 3);
  assert.deepEqual(triple.map((p) => p.weight), [1 / 3, 1 / 3, 1 / 3]);
  assert.deepEqual(triple.map((p) => p.blendAlpha), [1, 0.5, 1 / 3]);
  assert.equal(motionBlurBlendPlan(w, 0).length, 1); // không ghost → chỉ frame hiện tại
});

console.log(`\n${pass} test passed`);
