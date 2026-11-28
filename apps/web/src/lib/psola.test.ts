// psola.test.ts — Đợt 196 P1: TD-PSOLA pitch-shift (offline core).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/psola.test.ts
// (chạy từ gốc repo). Đo bằng FFT/Goertzel thuần Node trên fixture tổng hợp;
// số headed (worklet thật trên Chrome) là verdict cuối — xem LIMITS đợt 196 P1.
import assert from "node:assert/strict";
import {
  psolaPitchShift,
  applyH3Notch,
  estimatePitchTrack,
  estimatePeriodFrame,
  semitoneRatio,
  isIntegerRatioHalf,
} from "./psola.ts";

const SR = 48000;
let pass = 0;
let fail = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${name}: ${(e as Error).message}`);
  }
}
function near(a: number, b: number, tol: number, what: string): void {
  assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} khác ${b} quá ${tol}`);
}

// Fixture harmonic: 8 hài 1/k + tremolo 5 Hz 8% (giọng-like, f0 hằng).
function harmonic(f0: number, durSec = 2, amp = 0.3): Float32Array {
  const n = Math.ceil(durSec * SR);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const ph = 2 * Math.PI * f0 * t;
    let s = 0;
    for (let k = 1; k <= 8; k++) s += Math.sin(k * ph) / k;
    const env = Math.min(1, t / 0.05, (durSec - t) / 0.05);
    x[i] = amp * s * env * (1 + 0.08 * Math.sin(2 * Math.PI * 5 * t));
  }
  return x;
}

// Goertzel 1 tần số (đủ cho kiểm đỉnh trội trên fixture sạch).
function goertzelMag(x: Float32Array, freq: number): number {
  const n = x.length;
  const k = Math.round((freq * n) / SR);
  const w = (2 * Math.PI * k) / n;
  const coeff = 2 * Math.cos(w);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    const s0 = x[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - coeff * s1 * s2)) / (n / 2);
}
function dominantFreq(x: Float32Array, fLo: number, fHi: number, step = 1): number {
  let best = fLo;
  let bestM = -1;
  for (let f = fLo; f <= fHi; f += step) {
    const m = goertzelMag(x, f);
    if (m > bestM) {
      bestM = m;
      best = f;
    }
  }
  return best;
}
function am5ms(x: Float32Array): number {
  const block = Math.floor(0.005 * SR);
  let mn = Infinity;
  let mx = 0;
  for (let s0 = SR; s0 + block <= x.length - SR / 2; s0 += block) {
    let ss = 0;
    for (let i = s0; i < s0 + block; i++) ss += x[i] * x[i];
    const rms = Math.sqrt(ss / block);
    if (rms < 0.01) continue;
    mn = Math.min(mn, rms);
    mx = Math.max(mx, rms);
  }
  return (mx - mn) / (mx + mn);
}

ok("estimatePeriodFrame: sine 440 Hz → T ≈ 109,1 mẫu", () => {
  const x = new Float32Array(SR);
  for (let i = 0; i < SR; i++) x[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / SR);
  const { period, confidence } = estimatePeriodFrame(x, 0, 2048, SR);
  near(period, SR / 440, 1.5, "chu kỳ 440 Hz");
  assert.ok(confidence > 0.9, `confidence ${confidence} phải > 0,9`);
});

ok("estimatePeriodFrame: chống nhảy quãng 8 — harmonic 550 Hz → T ≈ 87,3 (không phải 174)", () => {
  const x = harmonic(550, 2);
  const tr = estimatePitchTrack(x, SR);
  const med = [...tr.periods].sort((a, b) => a - b)[Math.floor(tr.periods.length / 2)];
  near(med, SR / 550, 3, "chu kỳ trung vị 550 Hz");
});

ok("estimatePitchTrack: theo được f0 quét 180→260 Hz", () => {
  const n = 2 * SR;
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const ph = 2 * Math.PI * (180 * t + 20 * t * t);
    x[i] = 0.3 * Math.sin(ph);
  }
  const tr = estimatePitchTrack(x, SR);
  const f0First = SR / tr.periods[2];
  const f0Last = SR / tr.periods[tr.periods.length - 3];
  near(f0First, 185, 12, "f0 đầu quét");
  near(f0Last, 255, 12, "f0 cuối quét");
});

ok("psolaPitchShift: ratio 1 = passthrough y hệt", () => {
  const x = harmonic(330, 1);
  const y = psolaPitchShift(x, SR, 1);
  let maxDiff = 0;
  for (let i = 0; i < x.length; i++) maxDiff = Math.max(maxDiff, Math.abs(x[i] - y[i]));
  assert.ok(maxDiff === 0, `passthrough lệch ${maxDiff}`);
});

ok("psolaPitchShift: giữ nguyên độ dài", () => {
  const x = harmonic(440, 1);
  const y = psolaPitchShift(x, SR, semitoneRatio(7));
  assert.strictEqual(y.length, x.length);
});

for (const [f0, nSemi] of [
  [220, 7],
  [330, -7],
  [440, 7],
  [550, -7],
  [660, 12],
] as const) {
  ok(`psolaPitchShift: harmonic ${f0} Hz n=${nSemi} → đỉnh trội ≈ mục tiêu`, () => {
    const x = harmonic(f0, 4);
    const y = psolaPitchShift(x, SR, semitoneRatio(nSemi));
    const target = f0 * Math.pow(2, nSemi / 12);
    const seg = y.subarray(SR, Math.floor(3.5 * SR));
    const peak = dominantFreq(seg, target * 0.8, target * 1.25, 2);
    const errSt = 12 * Math.log2(peak / target);
    assert.ok(Math.abs(errSt) <= 0.4, `errSt ${errSt.toFixed(2)} st vượt 0,40 (peak ${peak}, target ${target.toFixed(1)})`);
  });
}

ok("psolaPitchShift: AM harmonic 440 Hz n=+7 ≤ 0,35 (bar)", () => {
  const x = harmonic(440, 4);
  const y = psolaPitchShift(x, SR, semitoneRatio(7));
  const am = am5ms(y);
  assert.ok(am <= 0.35, `AM ${am.toFixed(3)} vượt 0,35`);
});

ok("psolaPitchShift: sine −12 DỊCH ĐƯỢC với two-stage (mặc định đợt 197 — sửa lock)", () => {
  const n = 2 * SR;
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / SR);
  const y = psolaPitchShift(x, SR, semitoneRatio(-12));
  const seg = y.subarray(Math.floor(0.5 * SR), Math.floor(1.5 * SR));
  // Two-stage (√0,5 × 2): thành phần 220 Hz (mục tiêu) nay trội hơn 440 Hz (gốc).
  const m440 = goertzelMag(seg, 440);
  const m220 = goertzelMag(seg, 220);
  assert.ok(m220 > 3 * m440, `sine -12 twostage: mag 220 Hz (${m220.toFixed(3)}) phải > 3× mag 440 Hz (${m440.toFixed(3)})`);
});

ok("psolaPitchShift: mode 'none' VẪN lock ở −12 (ghi nhận — output = input)", () => {
  const n = 2 * SR;
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / SR);
  const y = psolaPitchShift(x, SR, semitoneRatio(-12), { integerRatioMode: "none" });
  const seg = y.subarray(Math.floor(0.5 * SR), Math.floor(1.5 * SR));
  const m440 = goertzelMag(seg, 440);
  const m220 = goertzelMag(seg, 220);
  assert.ok(m440 > 3 * m220, `sine -12 mode none: mag 440 Hz (${m440.toFixed(3)}) phải > 3× mag 220 Hz (${m220.toFixed(3)}) — lock`);
});

ok("psolaPitchShift: harmonic −12 dịch đúng cả 5 f0 với two-stage (errSt ≤ 0,40)", () => {
  for (const f0 of [220, 330, 440, 550, 660]) {
    const x = harmonic(f0, 4);
    const y = psolaPitchShift(x, SR, semitoneRatio(-12));
    const target = f0 / 2;
    const seg = y.subarray(SR, Math.floor(3.5 * SR));
    const peak = dominantFreq(seg, target * 0.8, target * 1.25, 2);
    const errSt = 12 * Math.log2(peak / target);
    assert.ok(Math.abs(errSt) <= 0.4, `harmonic ${f0}/-12: errSt ${errSt.toFixed(2)} st vượt 0,40 (peak ${peak}, target ${target})`);
  }
});

ok("psolaPitchShift: two-stage KHÔNG đổi các tỉ lệ khác (bit-identical với mode none ở n=−7)", () => {
  const x = harmonic(440, 4);
  const a = psolaPitchShift(x, SR, semitoneRatio(-7));
  const b = psolaPitchShift(x, SR, semitoneRatio(-7), { integerRatioMode: "none" });
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) assert.equal(a[i], b[i]);
});

ok("isIntegerRatioHalf: chỉ true gần 0,5", () => {
  assert.equal(isIntegerRatioHalf(0.5), true);
  assert.equal(isIntegerRatioHalf(0.505), true);
  assert.equal(isIntegerRatioHalf(0.49), false);
  assert.equal(isIntegerRatioHalf(0.667), false);
  assert.equal(isIntegerRatioHalf(1), false);
  assert.equal(isIntegerRatioHalf(2), false);
});

ok("psolaPitchShift: 0 NaN — F-197-P4-1 (sine 440, n ∈ {−12,−7,+7,+12}; trước fix: 2 NaN ở 440/−12 idx 33590–33591, 1 mỗi n còn lại)", () => {
  const n = Math.floor(0.7 * SR);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = Math.sin((2 * Math.PI * 440 * (i / SR - 0.1)));
  for (const nSemi of [-12, -7, 7, 12]) {
    const y = psolaPitchShift(x, SR, semitoneRatio(nSemi));
    let bad = 0;
    for (let i = 0; i < y.length; i++) if (!Number.isFinite(y[i])) bad++;
    assert.equal(bad, 0, `sine 440 n=${nSemi}: ${bad} mẫu không hữu hạn (trước fix sampleAt đọc samples[length])`);
  }
});

ok("psolaPitchShift: 0 NaN/Inf toàn lưới (sine + harmonic × 5 f0 × 4 n)", () => {
  for (const kind of ["sine", "harmonic"] as const) {
    for (const f0 of [220, 330, 440, 550, 660]) {
      const n = Math.floor(0.7 * SR);
      const x = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = i / SR - 0.1;
        x[i] = kind === "sine"
          ? Math.sin(2 * Math.PI * f0 * t)
          : Math.sin(2 * Math.PI * f0 * t) + Math.sin(2 * Math.PI * f0 * 2 * t) / 2 + Math.sin(2 * Math.PI * f0 * 3 * t) / 3;
      }
      for (const nSemi of [-12, -7, 7, 12]) {
        const y = psolaPitchShift(x, SR, semitoneRatio(nSemi));
        let bad = 0;
        for (let i = 0; i < y.length; i++) if (!Number.isFinite(y[i])) bad++;
        assert.equal(bad, 0, `${kind} ${f0} n=${nSemi}: ${bad} mẫu không hữu hạn`);
      }
    }
  }
});

ok("psolaPitchShift: fMin 50 — harmonic 110/165 Hz ở −12 dịch đúng (đích 55/82,5 Hz; đợt 201 P1 — trước fix fMin 80: core 110 Hz lệch −0,98 st, xem LIMITS 201 P1 §4)", () => {
  for (const f0 of [110, 165]) {
    const x = harmonic(f0, 4);
    const y = psolaPitchShift(x, SR, semitoneRatio(-12));
    const target = f0 / 2;
    const seg = y.subarray(SR, Math.floor(3.5 * SR));
    const peak = dominantFreq(seg, target * 0.8, target * 1.25, 2);
    const errSt = 12 * Math.log2(peak / target);
    assert.ok(Math.abs(errSt) <= 0.4, `harmonic ${f0}/-12 fMin50: errSt ${errSt.toFixed(2)} st vượt 0,40 (peak ${peak}, target ${target})`);
  }
});

ok("psolaPitchShift: grainWindow blackman không phá cao độ (harmonic 110/165 −12, errSt ≤ 0,40; đợt 201 P1 — thí nghiệm triệt H3)", () => {
  for (const f0 of [110, 165]) {
    const x = harmonic(f0, 4);
    const y = psolaPitchShift(x, SR, semitoneRatio(-12), { grainWindow: "blackman" });
    const target = f0 / 2;
    const seg = y.subarray(SR, Math.floor(3.5 * SR));
    const peak = dominantFreq(seg, target * 0.8, target * 1.25, 2);
    const errSt = 12 * Math.log2(peak / target);
    assert.ok(Math.abs(errSt) <= 0.4, `harmonic ${f0}/-12 blackman: errSt ${errSt.toFixed(2)} st vượt 0,40 (peak ${peak}, target ${target})`);
  }
});

ok("psolaPitchShift: twoStageSplit 0,65 không phá cao độ trên harmonic ổn định (110/165/220/440 −12, errSt ≤ 0,40; đợt 201 P1 — CAVEAT: split vẫn FAIL trên nguyên âm /a/ 220 Hz, errSt +4,53 st, xem LIMITS 201 P1 §5)", () => {
  for (const f0 of [110, 165, 220, 440]) {
    const x = harmonic(f0, 4);
    const y = psolaPitchShift(x, SR, semitoneRatio(-12), { twoStageSplit: 0.65 });
    const target = f0 / 2;
    const seg = y.subarray(SR, Math.floor(3.5 * SR));
    const peak = dominantFreq(seg, target * 0.8, target * 1.25, 2);
    const errSt = 12 * Math.log2(peak / target);
    assert.ok(Math.abs(errSt) <= 0.4, `harmonic ${f0}/-12 split0,65: errSt ${errSt.toFixed(2)} st vượt 0,40 (peak ${peak}, target ${target})`);
  }
});

ok("psolaPitchShift: notch H3 ở −12 — dH3 về ≈ 0, cao độ không đổi (đợt 202 P1 — đo trung vị cửa sổ 100 ms như thước khung giọng thật)", () => {
  // Goertzel tần số liên tục trên cửa sổ 100 ms (như frames202.mjs).
  const goertzelWin = (x: Float32Array, start: number, f: number): number => {
    const n = Math.floor(0.1 * SR);
    const w = (2 * Math.PI * f) / SR;
    const cw = Math.cos(w);
    const coeff = 2 * cw;
    let s1 = 0;
    let s2 = 0;
    for (let i = start; i < start + n; i++) {
      const s = x[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s;
    }
    const re = s1 - s2 * cw;
    const im = s2 * Math.sin(w);
    return (2 * Math.sqrt(re * re + im * im)) / n;
  };
  const med = (a: number[]): number => {
    const s = [...a].sort((x, y) => x - y);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const h3mH1Med = (x: Float32Array, f0out: number): number => {
    const vals: number[] = [];
    for (let t = 1.0; t <= 3.0; t += 0.25) {
      const s = Math.floor(t * SR);
      vals.push(20 * Math.log10((goertzelWin(x, s, 3 * f0out) + 1e-9) / (goertzelWin(x, s, f0out) + 1e-9)));
    }
    return med(vals);
  };
  for (const f0 of [220, 330, 440]) {
    const x = harmonic(f0, 4);
    const target = f0 / 2;
    const dIn = h3mH1Med(x, f0);
    const yOff = psolaPitchShift(x, SR, semitoneRatio(-12), { h3Notch: false });
    const yOn = psolaPitchShift(x, SR, semitoneRatio(-12));
    const dOff = h3mH1Med(yOff, target);
    const dOn = h3mH1Med(yOn, target);
    assert.ok(dOff - dIn >= 5, `harmonic ${f0}/-12: chữ ký H3 không hiện khi tắt notch (dH3 off ${(dOff - dIn).toFixed(1)} < 5 — fixture đổi?)`);
    assert.ok(Math.abs(dOn - dIn) <= 2, `harmonic ${f0}/-12: notch không đưa H3−H1 về mức vào (dH3 on ${(dOn - dIn).toFixed(1)}, bar ±2 — vào ${dIn.toFixed(1)}, ra ${dOn.toFixed(1)})`);
    const seg = yOn.subarray(SR, Math.floor(3.5 * SR));
    const peak = dominantFreq(seg, target * 0.8, target * 1.25, 2);
    const errSt = 12 * Math.log2(peak / target);
    assert.ok(Math.abs(errSt) <= 0.4, `harmonic ${f0}/-12 notch: cao độ lệch errSt ${errSt.toFixed(2)} st (peak ${peak}, target ${target})`);
  }
});

ok("psolaPitchShift: notch không đổi tỉ lệ khác (n=−7 bit-identical với h3Notch:false; đợt 202 P1 — notch chỉ ở đường twostage −12)", () => {
  const x = harmonic(440, 4);
  const a = psolaPitchShift(x, SR, semitoneRatio(-7));
  const b = psolaPitchShift(x, SR, semitoneRatio(-7), { h3Notch: false });
  let maxDiff = 0;
  for (let i = 0; i < a.length; i++) maxDiff = Math.max(maxDiff, Math.abs(a[i] - b[i]));
  assert.equal(maxDiff, 0, `n=−7: notch làm lệch output ${maxDiff} (phải = 0 — notch chỉ áp ở twostage −12)`);
});

ok("applyH3Notch: stats hợp lý — depth/makeup/peak guard (đợt 202 P1)", () => {
  const x = harmonic(330, 4);
  const y = psolaPitchShift(x, SR, semitoneRatio(-12), { h3Notch: false });
  const { stats } = applyH3Notch(y, x, SR, 0.5);
  assert.ok(stats.depthDbMedian >= 5 && stats.depthDbMedian <= 15, `depth trung vị ${stats.depthDbMedian.toFixed(1)} dB ngoài [5, 15]`);
  assert.ok(stats.makeupGainMedian >= 1.0, `makeup gain ${stats.makeupGainMedian.toFixed(2)} < 1,0 (phải bù, không cắt mức)`);
  assert.ok(stats.peakAfter <= 0.98, `peak sau notch ${stats.peakAfter.toFixed(3)} > 0,98 (peak guard hỏng)`);
  assert.ok(stats.voicedBlocks > 0, "không có khối voiced nào được notch");
});

console.log(`\npsola.test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
