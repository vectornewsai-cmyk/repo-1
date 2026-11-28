// psolaWorklet198.test.ts — Đợt 198 P1: hồi quy F-197-P1-3 (worklet two-stage hài 3 trội ở −12).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/psolaWorklet198.test.ts
// (chạy từ gốc repo). Chạy đúng processor worklet (PSOLA_WORKLET_SOURCE) trong Node
// với stub AudioWorklet globals — số headed (worklet thật trên Chrome) là verdict
// cuối, xem docs/PHASE9_ROUND198_P1_VOICEFX_NAN_LIMITS.md.
// Lưu ý: output block của process() chứa vị trí [b−2048, b−1920) (LAG) nhưng test
// lưu ở chỉ số b — lệch +2048 mẫu hằng số, không ảnh hưởng phổ của tín hiệu dừng.
import assert from "node:assert/strict";
import { PSOLA_WORKLET_SOURCE } from "./psolaWorkletSource.ts";

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

// Stub AudioWorklet globals rồi eval source để lấy lớp processor.
const G = globalThis as unknown as Record<string, unknown>;
G.sampleRate = SR;
let ProcClass: any = null;
G.registerProcessor = (_name: string, cls: unknown) => {
  ProcClass = cls;
};
G.AudioWorkletProcessor = class {
  port: { onmessage: ((ev: { data: { ratio?: number } }) => void) | null; postMessage: (msg: unknown) => void };
  constructor() {
    this.port = { onmessage: null, postMessage: () => {} };
  }
};
eval(PSOLA_WORKLET_SOURCE);

function sine(f0: number, durSec = 4, amp = 0.5): Float32Array {
  const n = Math.ceil(durSec * SR);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = amp * Math.sin((2 * Math.PI * f0 * i) / SR);
  return x;
}
function harmonic(f0: number, durSec = 4, amp = 0.3): Float32Array {
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
function runProc(x: Float32Array, ratio: number, proc: any): Float32Array {
  proc.port.onmessage({ data: { ratio } });
  const out = new Float32Array(x.length);
  for (let b = 0; b + 128 <= x.length; b += 128) {
    const o = [[new Float32Array(128)]];
    proc.process([[x.subarray(b, b + 128)]], o);
    out.set(o[0][0], b);
  }
  return out;
}
function runSingle(x: Float32Array, ratio: number): Float32Array {
  return runProc(x, ratio, new ProcClass());
}
function runCascade(x: Float32Array, r1: number): Float32Array {
  // Hai node nối tiếp theo từng block 128 (đúng graph AudioWorklet):
  // đưa block output tầng 1 sang tầng 2 ngay trong cùng vòng.
  const out = new Float32Array(x.length);
  const q1 = new ProcClass();
  const q2 = new ProcClass();
  q1.port.onmessage({ data: { ratio: r1 } });
  q2.port.onmessage({ data: { ratio: r1 } });
  for (let b = 0; b + 128 <= x.length; b += 128) {
    const m = [[new Float32Array(128)]];
    q1.process([[x.subarray(b, b + 128)]], m);
    const o = [[new Float32Array(128)]];
    q2.process(m, o);
    out.set(o[0][0], b);
  }
  return out;
}

// FFT radix-2 lặp (chỉ lấy |X| — dấu của exponent không ảnh hưởng phổ).
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1;
      let cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k];
        const ui = im[i + k];
        const vr = re[i + k + len / 2] * cwr - im[i + k + len / 2] * cwi;
        const vi = re[i + k + len / 2] * cwi + im[i + k + len / 2] * cwr;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr;
        im[i + k + len / 2] = ui - vi;
        const nwr = cwr * wr - cwi * wi;
        cwi = cwr * wi + cwi * wr;
        cwr = nwr;
      }
    }
  }
}
// Đỉnh trội toàn phổ [fLo, fHi] trên đoạn [t0, t1) (Hann + zero-pad 2^18 + nội suy parabol log-mag).
function spectralPeak(y: Float32Array, t0: number, t1: number, fLo: number, fHi: number): number {
  const N = 1 << 18;
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  const start = Math.floor(t0 * SR);
  const end = Math.min(Math.floor(t1 * SR), y.length);
  const winLen = end - start;
  for (let i = 0; i < winLen; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (winLen - 1)));
    re[i] = y[start + i] * w;
  }
  fft(re, im);
  const binHz = SR / N;
  const kLo = Math.max(1, Math.floor(fLo / binHz));
  const kHi = Math.min(N / 2 - 2, Math.ceil(fHi / binHz));
  let kMax = kLo;
  let mMax = -Infinity;
  for (let k = kLo; k <= kHi; k++) {
    const m = re[k] * re[k] + im[k] * im[k];
    if (m > mMax) {
      mMax = m;
      kMax = k;
    }
  }
  const l = (k: number): number => Math.log(re[k] * re[k] + im[k] * im[k] + 1e-30);
  const a = l(kMax - 1);
  const b = l(kMax);
  const c = l(kMax + 1);
  const d = (0.5 * (a - c)) / (a - 2 * b + c || 1e-30);
  return (kMax + d) * binHz;
}

// --- Chạy 1 lần dùng chung cho test 1+2: sine 440 đơn tầng −6, 4 s ---
const R1 = Math.pow(2, -6 / 12);
const X440 = sine(440, 4);
const markLog: Array<[number, number]> = []; // [inPos, mark]
const origPlaceMarks = ProcClass.prototype.placeMarks;
ProcClass.prototype.placeMarks = function (this: any): void {
  const nBefore = this.marks.length;
  origPlaceMarks.call(this);
  for (let i = nBefore; i < this.marks.length; i++) markLog.push([this.inPos, this.marks[i]]);
};
const Y440M6 = runSingle(X440, R1);
ProcClass.prototype.placeMarks = origPlaceMarks;

ok("worklet placeMarks: mark không lật đáy↔đỉnh sau warmup (F-197-P1-3 — trước fix: 22 lần lật/4 s)", () => {
  const T0 = SR / 440;
  const trough0 = (3 * T0) / 4;
  const phase = (m: number): number => {
    let d = (m - trough0) % T0;
    if (d > T0 / 2) d -= T0;
    if (d < -T0 / 2) d += T0;
    return d;
  };
  let prevType: string | null = null;
  let flips = 0;
  for (const [inPos, m] of markLog) {
    if (inPos < 0.5 * SR) continue; // warmup: chu kỳ chưa hội tụ
    const type = Math.abs(phase(m)) < T0 / 4 ? "trough" : "peak";
    if (prevType !== null && type !== prevType) flips++;
    prevType = type;
  }
  assert.equal(flips, 0, `mark lật đáy↔đỉnh ${flips} lần sau warmup (tâm tìm kiếm trôi do nextMark += T)`);
});

ok("worklet đơn tầng sine 440 −6: không burst (đỉnh phổ cục bộ mọi cửa sổ 50 ms [1,0, 3,5) ở trong ±0,40 st của đích)", () => {
  const target = 440 * R1;
  for (let t = 1.0; t < 3.5; t += 0.05) {
    const peak = spectralPeak(Y440M6, t, t + 0.05, 50, 3000);
    const errSt = 12 * Math.log2(peak / target);
    assert.ok(
      Math.abs(errSt) <= 0.4,
      `burst ở t=${t.toFixed(2)}: đỉnh phổ cục bộ ${peak.toFixed(1)} Hz, errSt ${errSt.toFixed(2)} st vượt 0,40 (trước fix: đỉnh nhảy lên ~350/584 Hz trong cửa sổ burst)`,
    );
  }
});

ok("worklet cascade −12: đỉnh toàn phổ ở đích — sine 660 + harmonic 440 (trước fix: wide ở 3×đích, +19 st)", () => {
  for (const [kind, f0] of [["sine", 660], ["harmonic", 440]] as const) {
    const x = kind === "sine" ? sine(f0, 4) : harmonic(f0, 4);
    const y = runCascade(x, Math.sqrt(0.5));
    const target = f0 / 2;
    const wide = spectralPeak(y, 1.0, 3.5, 50, 3000);
    const errW = 12 * Math.log2(wide / target);
    assert.ok(Math.abs(errW) <= 0.4, `${kind} ${f0}/−12: đỉnh toàn phổ ${wide.toFixed(1)} Hz, errStWide ${errW.toFixed(2)} st vượt 0,40 (trước fix: +19,0x)`);
  }
});

// --- Đợt 201 P1: gate confidence + trung vị + mở fMin (mặc định mới) ---
function runCascadeOpts(x: Float32Array, r1: number, opts: Record<string, unknown>): Float32Array {
  const out = new Float32Array(x.length);
  const q1 = new ProcClass({ processorOptions: { ratio: r1, ...opts } });
  const q2 = new ProcClass({ processorOptions: { ratio: r1, ...opts } });
  for (let b = 0; b + 128 <= x.length; b += 128) {
    const m = [[new Float32Array(128)]];
    q1.process([[x.subarray(b, b + 128)]], m);
    const o = [[new Float32Array(128)]];
    q2.process(m, o);
    out.set(o[0][0], b);
  }
  return out;
}

ok("worklet cascade sine 110 −12: đỉnh ≈ 55 Hz với gate+median+fMin50 mặc định (đợt 201 P1 — trước fix fMin 80: errSt +0,488, wide 4/5)", () => {
  const y = runCascade(sine(110, 4), Math.sqrt(0.5));
  const peak = spectralPeak(y, 1.0, 3.5, 44, 68.75);
  const errSt = 12 * Math.log2(peak / 55);
  assert.ok(Math.abs(errSt) <= 0.4, `sine 110/−12: đỉnh ${peak.toFixed(1)} Hz, errSt ${errSt.toFixed(2)} st vượt 0,40 (đích 55 Hz)`);
});

ok("worklet confGate khoá cập nhật chu kỳ khi confidence không đạt (đợt 201 P1 — chứng minh gate có tác dụng: confGate=1,0 → period đóng băng ở 220 Hz mặc định → đỉnh lệch khỏi đích)", () => {
  const y = runCascadeOpts(sine(110, 4), Math.sqrt(0.5), { confGate: 1.0 });
  const peak = spectralPeak(y, 1.0, 3.5, 44, 68.75);
  const errSt = 12 * Math.log2(peak / 55);
  assert.ok(Math.abs(errSt) > 0.4, `confGate=1,0 phải làm lệch đỉnh (đo được errSt ${errSt.toFixed(2)} st, peak ${peak.toFixed(1)} Hz) — nếu ≈0 thì gate không có tác dụng`);
});

ok("worklet grainWindow blackman: cascade sine 110 −12 đỉnh ≈ 55 Hz (đợt 201 P1 — thí nghiệm triệt H3)", () => {
  const y = runCascadeOpts(sine(110, 4), Math.sqrt(0.5), { grainWindow: "blackman" });
  const peak = spectralPeak(y, 1.0, 3.5, 44, 68.75);
  const errSt = 12 * Math.log2(peak / 55);
  assert.ok(Math.abs(errSt) <= 0.4, `sine 110/−12 blackman: đỉnh ${peak.toFixed(1)} Hz, errSt ${errSt.toFixed(2)} st vượt 0,40 (đích 55 Hz)`);
});

// --- Đợt 202 P1: notch H3 trong worklet (cả 2 node, node 2 deboost) ---
function runCascadeOpts2(x: Float32Array, r1: number, o1: Record<string, unknown>, o2: Record<string, unknown>): Float32Array {
  const out = new Float32Array(x.length);
  const q1 = new ProcClass({ processorOptions: { ratio: r1, ...o1 } });
  const q2 = new ProcClass({ processorOptions: { ratio: r1, ...o2 } });
  for (let b = 0; b + 128 <= x.length; b += 128) {
    const m = [[new Float32Array(128)]];
    q1.process([[x.subarray(b, b + 128)]], m);
    const o = [[new Float32Array(128)]];
    q2.process(m, o);
    out.set(o[0][0], b);
  }
  return out;
}
// Goertzel tần số liên tục trên cửa sổ 100 ms (như thước khung giọng thật).
function goertzelWin(x: Float32Array, start: number, f: number): number {
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
}
function h3mH1Med(x: Float32Array, f0out: number): number {
  const vals: number[] = [];
  for (let t = 1.0; t <= 3.0; t += 0.25) {
    const s = Math.floor(t * SR);
    vals.push(20 * Math.log10((goertzelWin(x, s, 3 * f0out) + 1e-9) / (goertzelWin(x, s, f0out) + 1e-9)));
  }
  const srt = [...vals].sort((a, b) => a - b);
  return srt.length % 2 ? srt[(srt.length - 1) / 2] : (srt[srt.length / 2 - 1] + srt[srt.length / 2]) / 2;
}

ok("worklet cascade −12 với notch ship: H3−H1 giảm mạnh, cao độ không đổi (đợt 202 P1 — harmonic 330: không notch −0,8 dB → notch ship −13,1 dB)", () => {
  const x = harmonic(330, 4);
  const target = 165;
  const yOff = runCascadeOpts2(x, Math.sqrt(0.5), {}, {});
  const yFin = runCascadeOpts2(x, Math.sqrt(0.5), { notchH3: true }, { notchH3: true, notchDeboost: true });
  const dOff = h3mH1Med(yOff, target);
  const dFin = h3mH1Med(yFin, target);
  assert.ok(dFin < dOff - 5, `notch ship không triệt H3 trên harmonic 330 (off ${dOff.toFixed(1)} → final ${dFin.toFixed(1)} dB, cần giảm > 5 dB)`);
  assert.ok(dFin <= -8, `H3−H1 sau notch ${dFin.toFixed(1)} dB chưa ≤ −8 (bar test)`);
  const wide = spectralPeak(yFin, 1.0, 3.5, 50, 3000);
  const errW = 12 * Math.log2(wide / target);
  assert.ok(Math.abs(errW) <= 0.4, `harmonic 330/−12 notch: đỉnh toàn phổ ${wide.toFixed(1)} Hz, errStWide ${errW.toFixed(2)} st vượt 0,40 (đích ${target} Hz)`);
});

ok("worklet notch gate: confGate=1,0 → notch không engage, output y hệt không notch (đợt 202 P1 — chứng minh gate có tác dụng)", () => {
  const x = harmonic(330, 4);
  const yNotch = runCascadeOpts2(x, Math.sqrt(0.5), { notchH3: true, confGate: 1.0 }, { notchH3: true, notchDeboost: true, confGate: 1.0 });
  const yPlain = runCascadeOpts2(x, Math.sqrt(0.5), { confGate: 1.0 }, { confGate: 1.0 });
  let maxDiff = 0;
  for (let i = 0; i < x.length; i++) maxDiff = Math.max(maxDiff, Math.abs(yNotch[i] - yPlain[i]));
  assert.equal(maxDiff, 0, `gate=1,0 mà notch vẫn đổi output ${maxDiff} (phải = 0 — gate phải bypass hoàn toàn)`);
});

// --- Đợt 203 P1: two-stage 1 node 2 lane (lane 2 kế thừa chu kỳ từ lane 1) ---
function runTwoStage(x: Float32Array, opts: Record<string, unknown> = {}): Float32Array {
  const out = new Float32Array(x.length);
  const q = new ProcClass({ processorOptions: { ratio: 0.5, twoStage: true, ...opts } });
  for (let b = 0; b + 128 <= x.length; b += 128) {
    const o = [[new Float32Array(128)]];
    q.process([[x.subarray(b, b + 128)]], o);
    out.set(o[0][0], b);
  }
  return out;
}

ok("worklet two-stage 1 node sine 110 −12: đỉnh ≈ 55 Hz (đợt 203 P1 — 1 node 2 lane thay 2 node rời)", () => {
  const y = runTwoStage(sine(110, 4));
  const peak = spectralPeak(y, 1.0, 3.5, 44, 68.75);
  const errSt = 12 * Math.log2(peak / 55);
  assert.ok(Math.abs(errSt) <= 0.4, `sine 110/−12 1 node: đỉnh ${peak.toFixed(1)} Hz, errSt ${errSt.toFixed(2)} st vượt 0,40 (đích 55 Hz)`);
});

ok("worklet two-stage 1 node với notch ship: H3−H1 giảm mạnh, cao độ không đổi (đợt 203 P1 — harmonic 330, như test 2 node 202 nhưng qua 1 node)", () => {
  const x = harmonic(330, 4);
  const target = 165;
  const yOff = runTwoStage(x);
  const yFin = runTwoStage(x, { notchH3: true, notchDeboost: true });
  const dOff = h3mH1Med(yOff, target);
  const dFin = h3mH1Med(yFin, target);
  assert.ok(dFin < dOff - 5, `notch ship 1 node không triệt H3 trên harmonic 330 (off ${dOff.toFixed(1)} → final ${dFin.toFixed(1)} dB, cần giảm > 5 dB)`);
  assert.ok(dFin <= -8, `H3−H1 sau notch 1 node ${dFin.toFixed(1)} dB chưa ≤ −8 (bar test)`);
  const wide = spectralPeak(yFin, 1.0, 3.5, 50, 3000);
  const errW = 12 * Math.log2(wide / target);
  assert.ok(Math.abs(errW) <= 0.4, `harmonic 330/−12 1 node notch: đỉnh toàn phổ ${wide.toFixed(1)} Hz, errStWide ${errW.toFixed(2)} st vượt 0,40 (đích ${target} Hz)`);
});

ok("worklet two-stage 1 node đổi tỉ lệ qua port: post {ratio:0,5} tách đúng 2 tầng (đợt 203 P1 — port nhận TỈ LỆ TỔNG)", () => {
  const x = sine(110, 4);
  const out = new Float32Array(x.length);
  const q = new ProcClass({ processorOptions: { ratio: 1, twoStage: true } });
  q.port.onmessage({ data: { ratio: 0.5 } });
  for (let b = 0; b + 128 <= x.length; b += 128) {
    const o = [[new Float32Array(128)]];
    q.process([[x.subarray(b, b + 128)]], o);
    out.set(o[0][0], b);
  }
  const peak = spectralPeak(out, 1.0, 3.5, 44, 68.75);
  const errSt = 12 * Math.log2(peak / 55);
  assert.ok(Math.abs(errSt) <= 0.4, `sine 110/−12 port {ratio:0,5}: đỉnh ${peak.toFixed(1)} Hz, errSt ${errSt.toFixed(2)} st vượt 0,40 (đích 55 Hz)`);
});

console.log(`\npsolaWorklet198.test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
