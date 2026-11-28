// parityHarness191.test.ts — Test khóa cho helper của harness parity đợt 191 P4.
// Chạy (từ gốc repo): node scripts/parity191-run-test.mjs
// (bundle bằng esbuild rồi chạy node — cùng pattern esbuild+node của repo).
// Chỉ khóa hàm thuần (compare/psnr/tier/alpha); số đo FFmpeg nằm ở harness.
import assert from "node:assert/strict";
import { compareFrames, psnrOf } from "./parityHarness191.ts";
import { denoiseBlendAlpha } from "./enhancePreview.ts";

function patternFrame(w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      buf[i] = (x * 4) % 256;
      buf[i + 1] = (y * 5) % 256;
      buf[i + 2] = (x + y * 3) % 256;
    }
  return buf;
}

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

console.log("== parityHarness191 helpers ==");
ok("compareFrames identity: MAD=0, PSNR=inf, le8=le32=100%", () => {
  const a = patternFrame(16, 16);
  const m = compareFrames(a, Buffer.from(a), 16, 16);
  assert.equal(m.mad, 0);
  assert.equal(m.psnr, Infinity);
  assert.equal(m.le8, 1);
  assert.equal(m.le32, 1);
});
ok("compareFrames lệch 1 mức mọi pixel: MAD=1, le8=100%, le32=100%", () => {
  const a = patternFrame(16, 16);
  const b = Buffer.from(a);
  for (let i = 0; i < b.length; i++) b[i] = Math.min(255, b[i] + 1);
  const m = compareFrames(a, b, 16, 16);
  assert.equal(m.mad, 1);
  assert.equal(m.le8, 1);
});
ok("compareFrames lệch 255 một kênh: MAD=85, le8=0", () => {
  const a = Buffer.alloc(4 * 4 * 3, 0);
  const b = Buffer.alloc(4 * 4 * 3, 0);
  for (let i = 0; i < b.length; i += 3) b[i] = 255;
  const m = compareFrames(a, b, 4, 4);
  assert.equal(m.mad, 85);
  assert.equal(m.le8, 0);
});
ok("psnrOf: MSE=0 → inf; MSE=65025 → 0dB; MSE=650.25 → 20dB", () => {
  assert.equal(psnrOf(0), Infinity);
  assert.ok(Math.abs(psnrOf(65025) - 0) < 1e-9);
  assert.ok(Math.abs(psnrOf(650.25) - 20) < 1e-9);
});
ok("denoiseBlendAlpha khớp 4 mốc đợt 63 R3 (0.3→0.195, 0.5→0.486, 0.8→0.806, 1→0.981)", () => {
  assert.ok(Math.abs(denoiseBlendAlpha(0.3) - 0.195) < 1e-9);
  assert.ok(Math.abs(denoiseBlendAlpha(0.5) - 0.486) < 1e-9);
  assert.ok(Math.abs(denoiseBlendAlpha(0.8) - 0.806) < 1e-9);
  assert.ok(Math.abs(denoiseBlendAlpha(1) - 0.981) < 1e-9);
  assert.equal(denoiseBlendAlpha(0), 0);
});

console.log(`\nPASS ${pass} test`);
