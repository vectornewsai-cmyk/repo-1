// parityHarness194.test.ts — Test khóa cho helper của harness parity đợt 194 P4.
// Chạy (từ gốc repo): node scripts/parity194-run-test.mjs
// (bundle bằng esbuild rồi chạy node — cùng pattern esbuild+node của repo).
// Chỉ khóa hàm thuần (compare/psnr/tier/alpha/pitch-sim/deint); số đo FFmpeg nằm ở harness.
import assert from "node:assert/strict";
import { bobFirstPreview, combingRLuma, compareFrames, deintBobFieldSim, deintBobSim, deintHalfResSim, pitchShifterSim, psnrOf, tapShiftVerticalSim } from "./parityHarness194.ts";
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

console.log("== parityHarness194 helpers ==");
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
ok("pitchShifterSim +12@440: domFreq ~889Hz (sai +0.18st, khớp Chrome P1-191 890.6Hz)", () => {
  const r = pitchShifterSim(440, 12);
  assert.ok(Math.abs(r.errSt) < 0.5, `errSt=${r.errSt}`);
  assert.ok(r.domFreq > 870 && r.domFreq < 910, `domFreq=${r.domFreq}`);
  // Đợt 193 P1 đổi W 0.04 → 0.08: sim AM +12@440 tăng từ <0,2 (khóa
  // đợt 192) → 0,453 — khóa giá trị mới, KHÔNG phải bar sản phẩm
  // (bar N2-sim vẫn AM ≤ 0,35; xem F-193-P4-1).
  assert.ok(r.amDepth < 0.5, `amDepth=${r.amDepth}`);
});
ok("pitchShifterSim -12@440: domFreq ~215Hz (sai -0.40st, khớp Chrome P1-191 213.9Hz)", () => {
  const r = pitchShifterSim(440, -12);
  assert.ok(Math.abs(r.errSt) < 0.5, `errSt=${r.errSt}`);
  assert.ok(r.domFreq > 200 && r.domFreq < 230, `domFreq=${r.domFreq}`);
});
ok("combingRLuma: frame phẳng R=0; xen kẽ dòng 0/255 R=255", () => {
  const flat = Buffer.alloc(8 * 4 * 3, 128);
  assert.equal(combingRLuma(flat, 8, 4), 0);
  const alt = Buffer.alloc(8 * 4 * 3, 0);
  for (let y = 1; y < 4; y += 2) for (let x = 0; x < 8; x++) for (let c = 0; c < 3; c++) alt[(y * 8 + x) * 3 + c] = 255;
  assert.ok(Math.abs(combingRLuma(alt, 8, 4) - 255) < 1e-9, `R=${combingRLuma(alt, 8, 4)}`);
});
ok("deintHalfResSim divisor=2: frame phẳng không đổi (MAD 0)", () => {
  const flat = Buffer.alloc(8 * 4 * 3, 128);
  const out = deintHalfResSim(flat, 8, 4, 2);
  const m = compareFrames(flat, out, 8, 4);
  assert.equal(m.mad, 0);
});
ok("deintBobSim divisor=2: giữ đúng top field — hàng chẵn 200/lẻ 50 → mọi hàng 200; half-res → 125", () => {
  const src = Buffer.alloc(8 * 4 * 3, 0);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) for (let c = 0; c < 3; c++) src[(y * 8 + x) * 3 + c] = y % 2 === 0 ? 200 : 50;
  const bob = deintBobSim(src, 8, 4, 2);
  for (let i = 0; i < bob.length; i++) assert.equal(bob[i], 200, `bob[${i}]=${bob[i]}`);
  const half = deintHalfResSim(src, 8, 4, 2);
  for (let i = 0; i < half.length; i++) assert.equal(half[i], 125, `half[${i}]=${half[i]}`);
});
ok("deintBobSim divisor=2 NEAREST (đợt 193 P2): cặp hàng 200/50 → line doubling [200,200,50,50,...] không nội suy", () => {
  // Nguồn cặp (hàng 0-1: 200, 2-3: 50, 4-5: 200, 6-7: 50) — top field
  // [200,50,200,50] → nearest upscale phải ra đúng [200,200,50,50,...];
  // bilinear sẽ nội suy ra 163/88 ở các hàng giữa.
  const src = Buffer.alloc(8 * 8 * 3, 0);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) for (let c = 0; c < 3; c++)
    src[(y * 8 + x) * 3 + c] = Math.floor(y / 2) % 2 === 0 ? 200 : 50;
  const bob = deintBobSim(src, 8, 8, 2);
  const want = [200, 200, 50, 50, 200, 200, 50, 50];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) for (let c = 0; c < 3; c++)
    assert.equal(bob[(y * 8 + x) * 3 + c], want[y], `bob hàng ${y}=${bob[(y * 8 + x) * 3 + c]} (muốn ${want[y]})`);
});

ok("tapShiftVerticalSim dy=0: identity; dy=+0,5 trên bậc 0/200 → hàng giữa 100 (nội suy bilinear)", () => {
  const src = Buffer.alloc(8 * 8 * 3, 0);
  for (let y = 4; y < 8; y++) for (let x = 0; x < 8; x++) for (let c = 0; c < 3; c++) src[(y * 8 + x) * 3 + c] = 200;
  const id = tapShiftVerticalSim(src, 8, 8, 0);
  assert.deepEqual(id, src);
  const sh = tapShiftVerticalSim(src, 8, 8, 0.5);
  // Hàng 3 (0 → 200 qua nội suy 0,5): 100; hàng 0-2 vẫn 0; hàng 4-7 vẫn 200.
  for (let x = 0; x < 8; x++) {
    assert.equal(sh[(3 * 8 + x) * 3], 100, `hàng 3=${sh[(3 * 8 + x) * 3]}`);
    assert.equal(sh[(0 * 8 + x) * 3], 0);
    assert.equal(sh[(7 * 8 + x) * 3], 200);
  }
});
ok("bobFirstPreview alpha=0: bằng đúng bob-nearest (không blend); alpha=1: bằng đúng blur σ=1,5 của khung đã bob", () => {
  const src = Buffer.alloc(8 * 8 * 3, 0);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) for (let c = 0; c < 3; c++)
    src[(y * 8 + x) * 3 + c] = Math.floor(y / 2) % 2 === 0 ? 200 : 50;
  const bob = deintBobSim(src, 8, 8, 2);
  const bf0 = bobFirstPreview(src, 8, 8, 2, 0);
  assert.deepEqual(bf0, bob);
  const bf1 = bobFirstPreview(src, 8, 8, 2, 1);
  // alpha=1 → toàn blur: hàng biên của khung đã bob phải khác 200/50 gốc
  // (blur làm mờ bậc) — chỉ khóa "có blend thật", không khóa số blur.
  assert.notDeepEqual(bf1, bob);
});

ok("deintBobFieldSim field=1 (đợt 194 P2 mode 1): hàng chẵn 200/lẻ 50 → mọi hàng 50; field=0 → mọi hàng 200", () => {
  const src = Buffer.alloc(8 * 4 * 3, 0);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) for (let c = 0; c < 3; c++) src[(y * 8 + x) * 3 + c] = y % 2 === 0 ? 200 : 50;
  const top = deintBobFieldSim(src, 8, 4, 2, 0);
  const bot = deintBobFieldSim(src, 8, 4, 2, 1);
  for (let i = 0; i < top.length; i++) assert.equal(top[i], 200, `top[${i}]=${top[i]}`);
  for (let i = 0; i < bot.length; i++) assert.equal(bot[i], 50, `bot[${i}]=${bot[i]}`);
});

console.log(`\nPASS ${pass} test`);
