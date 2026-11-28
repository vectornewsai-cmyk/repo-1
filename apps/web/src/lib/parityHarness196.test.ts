// parityHarness196.test.ts — Test khóa cho helper của harness parity đợt 196 P4.
// Chạy (từ gốc repo): node scripts/parity196-run-test.mjs
// (bundle bằng esbuild rồi chạy node — cùng pattern esbuild+node của repo).
// Chỉ khóa hàm thuần (compare/psnr/tier/alpha/pitch-sim/deint); số đo FFmpeg nằm ở harness.
import assert from "node:assert/strict";
import { bobFirstPreview, bobFirstPreview196, combingRLuma, compareFrames, deintBobFieldSim, deintBobSim, deintHalfResSim, isStalePeak, linearFit, pitchShifterSim, psolaShiftSim, psnrOf, tapShiftVerticalSim, wrapDrift } from "./parityHarness196.ts";
import { denoiseBlendAlpha, deintVerticalBlendWeight } from "./enhancePreview.ts";

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

console.log("== parityHarness196 helpers ==");
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

ok("bobFirstPreview196 (N5b/N10 mới 196): w=0 → bob thuần; w=1 → tap-P4; w=0,75 → 0,25·bob+0,75·blurV (alpha=0 để denoise identity)", () => {
  const src = Buffer.alloc(8 * 8 * 3, 0);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) for (let c = 0; c < 3; c++)
    src[(y * 8 + x) * 3 + c] = Math.floor(y / 2) % 2 === 0 ? 200 : 50;
  const bob = deintBobSim(src, 8, 8, 2);
  const shifted = tapShiftVerticalSim(bob, 8, 8, 0.5);
  assert.deepEqual(bobFirstPreview196(src, 8, 8, 2, 0, 0), bob);
  assert.deepEqual(bobFirstPreview196(src, 8, 8, 2, 0, 1), shifted);
  const mid = bobFirstPreview196(src, 8, 8, 2, 0, 0.75);
  for (let i = 0; i < mid.length; i++)
    assert.equal(mid[i], Math.round(bob[i] * 0.25 + shifted[i] * 0.75), `mid[${i}]=${mid[i]}`);
});
ok("deintVerticalBlendWeight (N5d mới 196, ngưỡng P2 hiệu chuẩn lại 2,7; đợt 197 P2 w 0,75 → 0,8): σ̂≥2,7 → 0,8; dưới 2,7 / null / undefined → 0", () => {
  assert.equal(deintVerticalBlendWeight(8.14), 0.8);
  assert.equal(deintVerticalBlendWeight(7.99), 0.8);
  assert.equal(deintVerticalBlendWeight(2.7), 0.8);
  assert.equal(deintVerticalBlendWeight(2.69), 0);
  assert.equal(deintVerticalBlendWeight(2.0), 0);
  assert.equal(deintVerticalBlendWeight(null), 0);
  assert.equal(deintVerticalBlendWeight(undefined), 0);
});
ok("deintBobFieldSim field=1 (đợt 194 P2 mode 1): hàng chẵn 200/lẻ 50 → mọi hàng 50; field=0 → mọi hàng 200", () => {
  const src = Buffer.alloc(8 * 4 * 3, 0);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) for (let c = 0; c < 3; c++) src[(y * 8 + x) * 3 + c] = y % 2 === 0 ? 200 : 50;
  const top = deintBobFieldSim(src, 8, 4, 2, 0);
  const bot = deintBobFieldSim(src, 8, 4, 2, 1);
  for (let i = 0; i < top.length; i++) assert.equal(top[i], 200, `top[${i}]=${top[i]}`);
  for (let i = 0; i < bot.length; i++) assert.equal(bot[i], 50, `bot[${i}]=${bot[i]}`);
});

ok("pitchShifterSim 330Hz +12/-12 (N9a 195, hồi quy 196): err trong ±1 st, AM < 0,9", () => {
  const a = pitchShifterSim(330, 12);
  const b = pitchShifterSim(330, -12);
  assert.ok(Math.abs(a.errSt) < 1.0, `330+12 errSt=${a.errSt}`);
  assert.ok(Math.abs(b.errSt) < 1.0, `330-12 errSt=${b.errSt}`);
  assert.ok(a.amDepth < 0.9 && b.amDepth < 0.9, `AM ${a.amDepth}/${b.amDepth}`);
});
ok("pitchShifterSim 550/660Hz +12 (N9a 195, hồi quy 196): err trong ±1 st", () => {
  for (const f0 of [550, 660]) {
    const r = pitchShifterSim(f0, 12);
    assert.ok(Math.abs(r.errSt) < 1.0, `${f0}+12 errSt=${r.errSt}`);
  }
});
ok("psolaShiftSim (N12a mới 196, SỬA 198 — F-197-T10-6): 440Hz -7 dịch đúng (pitchShifted, errHarm < 0,5 st); 440Hz -12 NAY DỊCH bằng twostage (P1-197, (a2)-196): domFreq≈220, errHarm < 0,5 st — khóa cũ F-196-P4-3 (không dịch ở r=0,5) ĐÃ ĐƯỢC SỬA; pitchShifted vẫn false vì magTarget/magOrig ~2,6 < 10 (tàn dư gốc không ổn định tần số — xem LIMITS P4-197 §2.2), KHÔNG phải vì không dịch", () => {
  const a = psolaShiftSim(440, -7);
  assert.ok(Math.abs(a.domFreq - 293.7) < 5, `440-7 domFreq=${a.domFreq}`);
  assert.ok(a.pitchShifted, `440-7 pitchShifted=false (magTarget=${a.magTarget}, magOrig=${a.magOrig})`);
  assert.ok(Math.abs(a.errStHarm) < 0.5, `440-7 errStHarm=${a.errStHarm}`);
  const b = psolaShiftSim(440, -12);
  assert.ok(Math.abs(b.domFreq - 220) < 5, `440-12 domFreq=${b.domFreq} (twostage phải dịch về 220)`);
  assert.ok(Math.abs(b.errStHarm) < 0.5, `440-12 errStHarm=${b.errStHarm}`);
  assert.ok(!b.pitchShifted, `440-12 pitchShifted=true là SAI theo thước harness (magTarget=${b.magTarget}, magOrig=${b.magOrig} — tỉ số < 10 do tàn dư)`);
});
ok("wrapDrift (N11 195, hồi quy 196): 9,3→−0,7; −0,685 giữ; 5,5→−4,5; 0,4 giữ", () => {
  assert.ok(Math.abs(wrapDrift(9.3, 10) - -0.7) < 1e-9, `9,3→${wrapDrift(9.3, 10)}`);
  assert.ok(Math.abs(wrapDrift(-0.685, 10) - -0.685) < 1e-9);
  assert.ok(Math.abs(wrapDrift(5.5, 10) - -4.5) < 1e-9, `5,5→${wrapDrift(5.5, 10)}`);
  assert.ok(Math.abs(wrapDrift(0.4, 10) - 0.4) < 1e-9);
});
ok("linearFit (N11 195, hồi quy 196): y=300+270x → a≈300 b≈270 R²≈1; y=302,5+38,26x → b≈38,26", () => {
  const xs = [0, 1, 2, 3, 4];
  const f1 = linearFit(xs, xs.map((x) => 300 + 270 * x));
  assert.ok(Math.abs(f1.a - 300) < 1e-9 && Math.abs(f1.b - 270) < 1e-9 && Math.abs(f1.r2 - 1) < 1e-9, `f1=${JSON.stringify(f1)}`);
  const f2 = linearFit(xs, xs.map((x) => 302.5 + 38.26 * x));
  assert.ok(Math.abs(f2.a - 302.5) < 1e-9 && Math.abs(f2.b - 38.26) < 1e-9, `f2=${JSON.stringify(f2)}`);
  // Răng cưa tuần hoàn (peakHz theo playhead thô) phải có R² thấp hơn hẳn
  // so với hồi quy theo (playhead mod 10) — khóa hướng phân biệt mô hình.
  const saw = linearFit([0, 5, 9, 11, 15, 19], [300, 1650, 2730, 570, 1920, 3000]);
  const per = linearFit([0, 5, 9, 1, 5, 9], [300, 1650, 2730, 570, 1920, 3000]);
  assert.ok(per.r2 > saw.r2, `R² tuần hoàn ${per.r2} phải > tuyến tính ${saw.r2}`);
});
ok("isStalePeak (N11 mới 195, quy tắc P3 §1.4): peak đóng băng + playhead chạy ≥0,2 s → stale", () => {
  assert.equal(isStalePeak(2864, 2864, 279.4, 279.1), true); // mẫu 93 pass B longB
  assert.equal(isStalePeak(2864, 2864, 279.4, 279.3), false); // chỉ chạy 0,1 s
  assert.equal(isStalePeak(2864, 2885, 279.4, 279.1), false); // peak đổi
  assert.equal(isStalePeak(861, 861, 282.3, 282.1), true); // chạy đúng 0,2 s
});
console.log(`\nPASS ${pass} test`);
