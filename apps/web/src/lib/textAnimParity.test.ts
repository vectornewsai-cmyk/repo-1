// textAnimParity.test.ts — Test preview mirror cho text animation parity
// (Phase 9 đợt 10, luồng V4, gap C5; mirror server/render/src/textAnimParity.js).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/textAnimParity.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
// Phạm vi: hàm thuần textClipVisual + isParityTextAnimation — KHÔNG test
// vẽ canvas thật trong preview.tsx (đường vẽ đó chỉ kiểm chứng bằng tsc +
// đọc code, xem TEXT_ANIM_PARITY_LIMITS.md §5).
import assert from "node:assert/strict";
import {
  isParityTextAnimation,
  textClipVisual,
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
  assert.ok(Math.abs(actual - expected) <= eps, `kỳ vọng ${expected}, nhận ${actual}`);
}

function tclip(anim: string, extra: Record<string, unknown> = {}): never {
  return {
    kind: "text", id: "t1", text: "TEST", start: 0, duration: 4,
    style: { fontFamily: "DejaVu Sans", fontSize: 64, color: "#ffffff", x: 0.5, y: 0.5, animation: anim },
    ...extra,
  } as never;
}
const M = { textW: 200, textH: 64 };
const W = 640, H = 360;

console.log("== previewEngine: text parity (V4) ==");

ok("isParityTextAnimation: đúng 4 animation parity, loại drawtext/typewriter", () => {
  for (const a of ["tiltIn", "skewIn", "slideReveal", "curtainIn"]) {
    assert.equal(isParityTextAnimation(a), true, a);
  }
  for (const a of ["fadeUp", "fadeIn", "typewriter", "zoomIn", "rotateIn", undefined, 42]) {
    assert.equal(isParityTextAnimation(a), false, String(a));
  }
});

ok("tiltIn: xoay -12°→0, trồi +20px→0, mờ 0→1 trong 0.7s; vị trí theo TÂM", () => {
  const v0 = textClipVisual(tclip("tiltIn"), 0, W, H, M);
  close(v0.rotationDeg, -12);
  close(v0.cy, H * 0.5 + 20);
  close(v0.alpha, 0);
  close(v0.cx, W * 0.5); // tâm ASS, KHÔNG phải (W-textW)*x của drawtext
  const vMid = textClipVisual(tclip("tiltIn"), 0.35, W, H, M);
  close(vMid.rotationDeg, -6);
  close(vMid.alpha, 0.5);
  const vEnd = textClipVisual(tclip("tiltIn"), 0.7, W, H, M);
  close(vEnd.rotationDeg, 0);
  close(vEnd.alpha, 1);
  close(vEnd.cy, H * 0.5);
});

ok("skewIn: fax nội suy tuyến tính (atan), trượt -30px→0 trong 0.36s, mờ 0.6s", () => {
  const v0 = textClipVisual(tclip("skewIn"), 0, W, H, M);
  close(v0.skewXDeg ?? 0, (Math.atan(-0.466) * 180) / Math.PI, 1e-6);
  close(v0.cx, W * 0.5 - 30);
  close(v0.alpha, 0);
  const vMid = textClipVisual(tclip("skewIn"), 0.36, W, H, M);
  close(vMid.skewXDeg ?? 0, (Math.atan(0.1405) * 180) / Math.PI, 1e-6);
  close(vMid.cx, W * 0.5);
  const vEnd = textClipVisual(tclip("skewIn"), 0.6, W, H, M);
  close(vEnd.skewXDeg ?? 0, 0);
  close(vEnd.alpha, 1);
});

ok("slideReveal: clipRect quét mép trái→phải HỘP CHỮ trong 1.0s, không mờ (đợt 11 P4)", () => {
  const v0 = textClipVisual(tclip("slideReveal"), 0, W, H, M);
  assert.deepEqual(v0.clipRect, { x: 220, y: 148, w: 0, h: 64 });
  assert.equal(v0.alpha, 1);
  const vMid = textClipVisual(tclip("slideReveal"), 0.5, W, H, M);
  assert.deepEqual(vMid.clipRect, { x: 220, y: 148, w: 100, h: 64 });
  const vEnd = textClipVisual(tclip("slideReveal"), 1.0, W, H, M);
  assert.deepEqual(vEnd.clipRect, { x: 220, y: 148, w: 200, h: 64 });
});

ok("curtainIn: clipRect mở từ tâm HỘP CHỮ ra hai mép + mờ vào trong 0.8s (đợt 11 P4)", () => {
  const vMid = textClipVisual(tclip("curtainIn"), 0.4, W, H, M);
  assert.deepEqual(vMid.clipRect, { x: 270, y: 148, w: 100, h: 64 });
  close(vMid.alpha, 0.5);
  const vEnd = textClipVisual(tclip("curtainIn"), 0.8, W, H, M);
  assert.deepEqual(vEnd.clipRect, { x: 220, y: 148, w: 200, h: 64 });
  close(vEnd.alpha, 1);
});

ok("parity + keyframes scale/rotation: KHÔNG vào nhánh SR (render bỏ qua SR cho ASS)", () => {
  const clip = tclip("tiltIn", {
    animations: {
      scale: { keyframes: [{ t: 0, v: 2, easing: "linear" }] },
      rotation: { keyframes: [{ t: 0, v: 45, easing: "linear" }] },
    },
  });
  const v = textClipVisual(clip, 0, W, H, M);
  assert.equal(v.sr, false);
  close(v.rotationDeg, -12); // góc của tiltIn, không phải 45° của keyframes
});

ok("parity thắng keyframes x/y/opacity (mirror render: ASS thắng, như typewriter)", () => {
  const clip = tclip("slideReveal", {
    animations: {
      x: { keyframes: [{ t: 0, v: 0, easing: "linear" }] },
      opacity: { keyframes: [{ t: 0, v: 0.2, easing: "linear" }] },
    },
  });
  const v = textClipVisual(clip, 0.5, W, H, M);
  assert.deepEqual(v.clipRect, { x: 220, y: 148, w: 100, h: 64 });
  assert.equal(v.alpha, 1); // không phải 0.2 của keyframes opacity
});

ok("regression: fadeUp drawtext không đổi (alpha + trồi 30px trong 0.6s)", () => {
  const v = textClipVisual(tclip("fadeUp"), 0.3, W, H, M);
  close(v.alpha, 0.5);
  close(v.cy, (H - M.textH) * 0.5 + M.textH / 2 - 30 * (1 - 0.5));
  assert.equal(v.rotationDeg, 0);
  assert.equal(v.skewXDeg, undefined);
  assert.equal(v.clipRect, undefined);
});

console.log(`\n${pass} test passed`);
