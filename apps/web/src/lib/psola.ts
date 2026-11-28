/**
 * psola.ts — TD-PSOLA (Time-Domain Pitch-Synchronous Overlap-Add) pitch-shift,
 * Đợt 196 P1 (Phase 9 VCut, Editing Core — preview/render parity).
 *
 * Thay thế pitch-shifter 2 đường delay (previewVoiceFx.ts, W = 0,08 s) vốn có
 * artifact AM dạng răng lược: AM vượt bar 0,35 ở 440 Hz (tệ nhất 0,72) và
 * 660 Hz (0,58) — đo đợt 195 P1 — vì frac(f0·W) đổi theo f0, không có W nào
 * sửa mọi f0. PSOLA đặt cửa sổ đồng bộ theo chu kỳ thật nên triệt được gốc.
 *
 * Thuật toán (Moulines & Charpentier 1990, TD-PSOLA, giữ nguyên thời lượng):
 *  1. Pitch track: decimate x6 (48k -> 8k, trung bình trượt 12 mẫu chống
 *     alias) rồi tự tương quan chuẩn hoá từng khung 512 mẫu @8k (64 ms),
 *     hop 128 mẫu @8k, nội suy parabol → chu kỳ T(t) (mẫu, số thực) +
 *     độ tin cậy. Đủ nhẹ cho AudioWorklet real-time.
 *  2. Pitch mark: bước theo T(t), hiệu chỉnh bằng đỉnh |x| cục bộ trong
 *     ±T/4 (neo vào xung glottal / đỉnh sóng).
 *  3. Tổng hợp: mark tổng hợp cách nhau T(t)/r (r = 2^(n/12)); mỗi mark lấy
 *     hạt (grain) quanh mark phân tích gần nhất — cửa sổ Hann dài T0+T_s
 *     (T0 = chu kỳ phân tích tại mark, T_s = chu kỳ tổng hợp) — rồi
 *     overlap-add + chuẩn hoá theo tổng cửa sổ. Độ dài T0+T_s là điểm mấu
 *     chốt: khi hạ cao độ (r < 1), hạt dài hơn 2·T0 cố định nên chồng
 *     lấn luôn ≥ T0 → tổng Hann không chạm 0 → envelope phẳng.
 *     CHÚ Ý (đợt 197 P1 — đính chính giả thuyết đợt 196): cửa sổ T0+T_s
 *     KHÔNG sửa được lock tỉ lệ nguyên — ở r = 0,5 (n = −12), lưới mark
 *     tổng hợp (cách 2T0) commensurate với lưới phân tích (cách T0) nên
 *     OLA cộng các hạt giống hệt nhau cho ra ĐÚNG tín hiệu gốc với MỌI
 *     cửa sổ cố định (chứng minh: y(t) = x(t)·Σw / Σw = x(t); đo 196 xác
 *     nhận output = input). Dither pha mark xen kẽ ±T0/4 cũng FAIL (đỉnh
 *     trội dời sang 0,75f0/1,25f0 — xem exp-m12-197.json). Cách sửa:
 *     TWO-STAGE (mặc định integerRatioMode "twostage"): dịch 2 lần
 *     r1 = √r ≈ 0,7071 (−6 st/lần, không nguyên) — không bước nào lock.
 *
 * Module thuần TS, KHÔNG import gì — dùng được ở Node (sim + render offline),
 * bundle trình duyệt (preview), và làm tham chiếu cho AudioWorklet
 * (psolaWorkletSource.ts — cùng công thức, cùng hằng số; headed là kiểm
 * chéo hai bản triển khai khớp nhau). Preview nối 2 node worklet cho
 * two-stage (xem previewVoiceFx.ts buildPsolaChain).
 *
 * Giới hạn trung thực:
 *  - Chỉ tốt trên đoạn có chu kỳ rõ (voiced / sine). Đoạn unvoiced vẫn đặt
 *    mark theo chu kỳ nội suy/mặc định 10 ms (hạt nhiễu chồng lấn, chuẩn hoá
 *    giữ mức) — hơi nhoè nhưng không vỡ.
 *  - Cần ≥ ~2 chu kỳ tín hiệu để ước lượng T; đoạn đầu/cuối < 1 chu kỳ sẽ
 *    mờ dần (fade tự nhiên do tổng cửa sổ).
 *  - Không tách được formant (giọng có thể hơi "chipmunk" ở |n| lớn) — như
 *    mọi TD-PSOLA; ngoài phạm vi bar đợt này (bar chỉ đo cao độ + AM).
 */

export interface PsolaOptions {
  /** Tần số nền thấp nhất tìm (Hz). Mặc định 50 (đợt 201 P1: mở từ 80 để
   * đo được f0 đích −12 của giọng nam trầm; xem LIMITS 201 P1 §4). */
  fMin?: number;
  /** Tần số nền cao nhất tìm (Hz). Mặc định 800. */
  fMax?: number;
  /** Ngưỡng tự tương quan chuẩn hoá để coi là voiced. Mặc định 0,5. */
  voicedThreshold?: number;
  /** Chu kỳ mặc định cho đoạn unvoiced (ms). Mặc định 10. */
  defaultPeriodMs?: number;
  /** Cửa sổ hạt tổng hợp: "hann" (mặc định) hoặc "blackman" (đợt 201 P1:
   * thí nghiệm triệt H3 — sidelobe −58 dB vs Hann −31 dB). */
  grainWindow?: "hann" | "blackman";
  /** Tỉ lệ tầng 1 của two-stage (mặc định √r — hai tầng bằng nhau).
   * Đợt 201 P1: thí nghiệm tách tầng (vd 0,65 → tầng 2 = r/0,65);
   * tầng 2 luôn = ratio/tầng 1 nên tích đúng ratio. */
  twoStageSplit?: number;
  /**
   * Cách xử lý tỉ lệ nguyên r = 0,5 (n = −12) — TD-PSOLA với cửa sổ đối
   * xứng và lưới mark commensurate sẽ tái tạo đúng tín hiệu gốc (lock,
   * xem §4 LIMITS 196). Chỉ áp dụng khi |ratio − 0,5| < 0,01.
   * - "none": hành vi cũ (lock — output = input).
   * - "dither": dịch mark phân tích xen kẽ ±T0/4 theo từng hạt.
   * - "twostage": dịch 2 lần r1 = √r (mỗi lần −6 st, không nguyên) — phá
   *   lock vì không có bước nào ở tỉ lệ nguyên.
   * - "detune": dùng r' = r·2^(δ/12) (δ = integerRatioDetuneSt) — lệch pha
   *   lưới tổng hợp/phân tích trôi chậm, phá khoá pha tuyệt đối.
   * Mặc định "none" — P1-197 đo chọn chế độ rồi mới đổi mặc định.
   */
  integerRatioMode?: "none" | "dither" | "twostage" | "detune";
  /** Độ lệch cao độ (st) cho mode "detune". Mặc định 0,05 st (≪ bar 0,40). */
  integerRatioDetuneSt?: number;
  /**
   * Triệt hài 3 ở đường two-stage −12 (đợt 202 P1 — mặc định true):
   * post-filter notch thích ứng theo f0 tại 3×f0_out, độ sâu = phần
   * H3−H1 ra VƯỢT so với đầu vào (đích H3−H1 ra ≈ H3−H1 vào, cắt tối đa
   * 15 dB), Q=4, bù gain theo RMS từng khối. Chỉ áp dụng ở đường twostage
   * −12 (nơi two-stage áp đặt chữ ký H3−H1 ≈ −2 dB); các tỉ lệ khác và
   * các mode integerRatio khác không đổi gì. Đặt false để tắt (đo đối chứng).
   */
  h3Notch?: boolean;
}

/** Ngưỡng "gần tỉ lệ nguyên 0,5" để kích hoạt các chế độ integerRatio. */
export const INTEGER_RATIO_EPS = 0.01;
/** Kiểm tra tỉ lệ có gần 0,5 (n ≈ −12) không. */
export function isIntegerRatioHalf(ratio: number): boolean {
  return Math.abs(ratio - 0.5) < INTEGER_RATIO_EPS;
}

export interface PitchTrack {
  /** Tâm khung (mẫu, số thực). */
  times: Float64Array;
  /** Chu kỳ tại tâm khung (mẫu, số thực). */
  periods: Float64Array;
  /** 1 = voiced (độ tin cậy ≥ ngưỡng), 0 = unvoiced. */
  voiced: Uint8Array;
  /** Giá trị tự tương quan chuẩn hoá cao nhất tại tâm khung. */
  confidence: Float64Array;
}

const DEFAULTS: Required<PsolaOptions> = {
  fMin: 50,
  fMax: 800,
  voicedThreshold: 0.5,
  defaultPeriodMs: 10,
  integerRatioMode: "twostage",
  integerRatioDetuneSt: 0.05,
  grainWindow: "hann",
  twoStageSplit: 0,
  h3Notch: true,
};
// Mặc định "twostage" từ đợt 197 P1: dịch 2 lần √r ở n = −12 (xem
// exp-m12-197.json: dither FAIL — đỉnh trội 0,75f0/1,25f0, errStWide +7,04;
// detune FAIL — đỉnh trội vẫn f0 gốc; twostage PASS 10/10 cả hai thước).

/**
 * Tự tương quan chuẩn hoá trên 1 khung, tìm chu kỳ bằng đỉnh lớn nhất trong
 * [sr/fMax, sr/fMin], nội suy parabol → chu kỳ số thực (mẫu).
 * Trả { period, confidence }; period = NaN khi khung lặng (RMS ~ 0).
 */
export function estimatePeriodFrame(
  samples: Float32Array | Float64Array,
  start: number,
  len: number,
  sr: number,
  fMin = 50,
  fMax = 800,
): { period: number; confidence: number } {
  const end = Math.min(start + len, samples.length);
  const n = end - start;
  if (n < 64) return { period: NaN, confidence: 0 };
  let mean = 0;
  for (let i = start; i < end; i++) mean += samples[i];
  mean /= n;
  let e0 = 0;
  for (let i = start; i < end; i++) {
    const d = samples[i] - mean;
    e0 += d * d;
  }
  if (e0 < 1e-12) return { period: NaN, confidence: 0 };
  const tauMin = Math.max(2, Math.floor(sr / fMax));
  const tauMax = Math.min(Math.floor(sr / fMin), n - 2);
  if (tauMax <= tauMin) return { period: NaN, confidence: 0 };
  // R(τ) cho mọi lag (lưu lại để chọn đỉnh + nội suy parabol sau).
  const nTau = tauMax - tauMin + 1;
  const rVals = new Float64Array(nTau);
  let bestR = -Infinity;
  for (let t = 0; t < nTau; t++) {
    const tau = tauMin + t;
    let r = 0;
    for (let i = start; i + tau < end; i++) {
      r += (samples[i] - mean) * (samples[i + tau] - mean);
    }
    r /= e0;
    rVals[t] = r;
    if (r > bestR) bestR = r;
  }
  // Chống nhảy quãng 8 (đo thật đợt 196: harmonic 550 Hz cho R(2T)=0,9416 >
  // R(T)=0,9292 — đỉnh tuyệt đối là bội của chu kỳ thật): lấy lag NHỎ NHẤT
  // mà R ≥ 0,9 × max (chu kỳ cơ bản), không lấy max tuyệt đối. Chuẩn trong
  // các bộ ước lượng f0 (YIN dùng quy tắc tương tự trên CMNDF).
  const thresh = 0.9 * bestR;
  let pick = 0;
  while (pick < nTau - 1 && rVals[pick] < thresh) pick++;
  // Leo lên đỉnh cục bộ gần điểm vượt ngưỡng (điểm vượt ngưỡng có thể sớm
  // hơn đỉnh thật vài lag khi R dốc — nội suy parabol quanh điểm chưa phải
  // đỉnh sẽ cho chu kỳ sai tới 6%: sine 440 Hz đọc thành 102 thay vì 109).
  while (pick + 1 < nTau && rVals[pick + 1] > rVals[pick]) pick++;
  const bestTau = tauMin + pick;
  const peakR = rVals[pick];
  // Nội suy parabol quanh đỉnh đã chọn (trên R chuẩn hoá).
  let delta = 0;
  if (pick > 0 && pick < nTau - 1) {
    const rm = rVals[pick - 1];
    const r0 = peakR;
    const rp = rVals[pick + 1];
    const den = rm - 2 * r0 + rp;
    if (Math.abs(den) > 1e-12) delta = 0.5 * (rm - rp) / den;
    if (!Number.isFinite(delta) || Math.abs(delta) > 1) delta = 0;
  }
  return { period: bestTau + delta, confidence: peakR };
}

/** Decimate x6 (48k -> 8k) với trung bình trượt 12 mẫu chống alias.
 * Chỉ dùng cho ƯỚC LƯỢNG chu kỳ (không chạm tín hiệu tổng hợp): hài > 4kHz
 * bị nén, hài cơ bản 50-800 Hz qua gần như nguyên vẹn (suy hao < 5%). */
function decimate6(samples: Float32Array | Float64Array): { dec: Float64Array; srDec: number } {
  const n = Math.floor(samples.length / 6);
  const dec = new Float64Array(n);
  let acc = 0;
  for (let i = 0; i < 12; i++) acc += samples[i] ?? 0;
  if (n > 0) dec[0] = acc / 12;
  // Cửa sổ trượt 6 mẫu/bước: cửa sổ dec[d] là [6d, 6d+11] — thêm 6 mẫu
  // [6d+6, 6d+11], bớt 6 mẫu [6d-6, 6d-1]. (Bản đầu cộng/trừ 1 mẫu là SAI.)
  for (let d = 1; d < n; d++) {
    const c = d * 6;
    for (let k = 0; k < 6; k++) {
      acc += (samples[c + 6 + k] ?? 0) - (samples[c - 6 + k] ?? 0);
    }
    dec[d] = acc / 12;
  }
  return { dec, srDec: 8000 };
}

/** Pitch track toàn clip: decimate x6 rồi khung 512 mẫu @8k (64 ms), hop 128
 * mẫu @8k (16 ms); trung vị 3 khung chống nhảy quãng 8. Nhanh ~20x so với
 * tự tương quan trực tiếp @48k (đủ nhẹ cho AudioWorklet real-time). */
export function estimatePitchTrack(
  samples: Float32Array | Float64Array,
  sr: number,
  opts: PsolaOptions = {},
): PitchTrack {
  const o = { ...DEFAULTS, ...opts };
  const { dec, srDec } = decimate6(samples);
  const frameLen = 512;
  const hopLen = 128;
  const nFrames = Math.max(1, Math.floor((dec.length - frameLen) / hopLen) + 1);
  const times = new Float64Array(nFrames);
  const periods = new Float64Array(nFrames);
  const voiced = new Uint8Array(nFrames);
  const confidence = new Float64Array(nFrames);
  const defPeriod = (o.defaultPeriodMs / 1000) * sr;
  for (let f = 0; f < nFrames; f++) {
    const start = f * hopLen;
    times[f] = (start + frameLen / 2) * 6;
    const { period, confidence: conf } = estimatePeriodFrame(dec, start, frameLen, srDec, o.fMin, o.fMax);
    confidence[f] = conf;
    periods[f] = Number.isFinite(period) ? period * 6 : defPeriod;
    voiced[f] = conf >= o.voicedThreshold ? 1 : 0;
    if (!voiced[f]) periods[f] = defPeriod;
  }
  // Trung vị 3 khung trên chu kỳ của khung voiced (khử nhảy quãng 8 đơn lẻ).
  const med = new Float64Array(nFrames);
  for (let f = 0; f < nFrames; f++) {
    if (!voiced[f]) {
      med[f] = periods[f];
      continue;
    }
    const a = periods[Math.max(0, f - 1)];
    const b = periods[f];
    const c = periods[Math.min(nFrames - 1, f + 1)];
    const srt = [a, b, c].sort((x, y) => x - y);
    med[f] = srt[1];
  }
  return { times, periods: med, voiced, confidence };
}

/** Trung bình trượt (cửa sổ lẻ W) — làm mịn tín hiệu để neo mark theo hài cơ bản. */
export function movingAverage(
  samples: Float32Array | Float64Array,
  w: number,
): Float64Array {
  const n = samples.length;
  const out = new Float64Array(n);
  const half = Math.floor(w / 2);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += samples[i];
    if (i - w >= 0) acc -= samples[i - w];
    if (i >= half) out[i - half] = acc / Math.min(w, i + 1);
  }
  for (let i = Math.max(0, n - half); i < n; i++) out[i] = out[Math.max(0, n - half - 1)];
  return out;
}

/** Nội suy tuyến tính chu kỳ tại vị trí mẫu (số thực). Ngoài biên → kẹp biên. */
export function periodAt(track: PitchTrack, pos: number): number {
  const { times, periods } = track;
  const n = times.length;
  if (n === 0) return 480;
  if (pos <= times[0]) return periods[0];
  if (pos >= times[n - 1]) return periods[n - 1];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= pos) lo = mid;
    else hi = mid;
  }
  const t = (pos - times[lo]) / (times[hi] - times[lo] || 1);
  return periods[lo] * (1 - t) + periods[hi] * t;
}

/** Đỉnh |x| cục bộ trong [center−half, center+half] trên tín hiệu `search`
 * (mặc định = tín hiệu gốc; truyền bản làm mịn để neo theo hài cơ bản trên
 * tín hiệu đa hài — đỉnh của sóng gốc nhảy lung tung giữa các hài). */
function localPeakPos(
  search: Float32Array | Float64Array,
  center: number,
  half: number,
): number {
  const lo = Math.max(0, Math.floor(center - half));
  const hi = Math.min(search.length - 1, Math.ceil(center + half));
  let best = lo;
  let bestAbs = -1;
  for (let i = lo; i <= hi; i++) {
    const a = Math.abs(search[i]);
    if (a > bestAbs) {
      bestAbs = a;
      best = i;
    }
  }
  return best;
}

/** Nội suy tuyến tính mẫu tại vị trí số thực (0 ngoài biên). */
function sampleAt(samples: Float32Array | Float64Array, pos: number): number {
  // Đợt 198 P1 (F-197-P4-1): bản cũ chỉ return sớm khi frac === 0 ở mẫu
  // cuối; khi i0 = length−1 và frac > 0 vẫn đọc samples[length] = undefined
  // → NaN (440/−12: 2 NaN idx 33590–33591; −7/+7/+12: 1 mỗi cái). Sửa:
  // coi mẫu ngoài biên = 0 (đúng hợp đồng "0 ngoài biên" ở trên) cho cả
  // hai đầu nội suy — không còn đường nào đọc ngoài mảng.
  const i0 = Math.floor(pos);
  const frac = pos - i0;
  const a = i0 >= 0 && i0 < samples.length ? samples[i0] : 0;
  const b = i0 + 1 >= 0 && i0 + 1 < samples.length ? samples[i0 + 1] : 0;
  return a * (1 - frac) + b * frac;
}

/** Thống kê của post-filter triệt H3 (để LIMITS + test kiểm chứng). */
export interface H3NotchStats {
  /** Độ sâu notch đã áp (sau làm mượt) — trung vị / max trên khối voiced (dB). */
  depthDbMedian: number;
  depthDbMax: number;
  /** Gain bù đã áp — trung vị trên khối không lặng. */
  makeupGainMedian: number;
  /** Đỉnh / RMS trước và sau filter + bù gain. */
  peakBefore: number;
  peakAfter: number;
  rmsBefore: number;
  rmsAfter: number;
  /** Số khối voiced đã notch / tổng khối 128 mẫu. */
  voicedBlocks: number;
  totalBlocks: number;
}

/** Goertzel không cửa sổ tại tần số f trên [start, end) — cùng phương pháp
 * đo khung của P1-201 (frames201.mjs) để số depth khớp thước đo. */
function goertzelMagLocal(
  x: Float32Array | Float64Array,
  start: number,
  end: number,
  sr: number,
  f: number,
): number {
  const n = end - start;
  if (n < 8) return 0;
  const w = (2 * Math.PI * f) / sr;
  const cw = Math.cos(w);
  const coeff = 2 * cw;
  let s1 = 0;
  let s2 = 0;
  for (let i = start; i < end; i++) {
    const s = x[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s;
  }
  const re = s1 - s2 * cw;
  const im = s2 * Math.sin(w);
  return (2 * Math.sqrt(re * re + im * im)) / n;
}

function medianLocal(a: number[]): number {
  const b = a.filter(Number.isFinite);
  if (!b.length) return NaN;
  const s = [...b].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
}

/**
 * Post-filter triệt hài 3 cho đường two-stage −12 (đợt 202 P1 — đưa thí
 * nghiệm notch của P1-201 từ harness vào code sản phẩm, với 3 sửa theo
 * quyết (a2)-201: (1) độ sâu THÍCH ỨNG theo từng khối — chỉ cắt phần
 * H3−H1 ra VƯỢT so với đầu vào (đo trực tiếp trên cặp vào/ra bằng Goertzel,
 * đích H3−H1 ra ≈ H3−H1 vào, cắt tối đa 15 dB — khắc phục over-correct của
 * độ sâu cố định −12 dB trên nguyên âm có H3 tự nhiên mạnh); (2) Q=4 thay
 * Q=2 (giảm cắn H2 — P1-201: H2−H1 −5,1 → −7,7 dB ở Q=2); (3) bù gain
 * theo RMS từng khối 512 mẫu (khôi phục ~30% RMS notch lấy đi — P1-201:
 * rmsRatio 0,80 → 0,55), gain kẹp [1; 1,8], làm mượt để không pumping.
 * Cap 15 dB + làm mượt k=0,5 (mặc định): cap 12 dB là điểm nghẽn — depth
 * chạm trần 12,00 ở cả 3 clip, dH3 med 3,8 vs bar 3,0; cap 15 + k=0,5 →
 * dH3 med 2,3, H2 và rmsRatio không đổi (xem LIMITS 202 P1 §3).
 *
 * y: output two-stage chưa notch; xIn: tín hiệu gốc (để lấy track f0_in +
 * H3−H1 vào); ratio: tỉ lệ pitch-shift (f0_out = ratio × f0_in).
 * Khối unvoiced → giữ hệ số cũ (không notch). Trả tín hiệu đã lọc + bù gain.
 */
export function applyH3Notch(
  y: Float32Array,
  xIn: Float32Array,
  sr: number,
  ratio: number,
  opts: { maxDepthDb?: number; q?: number; smoothK?: number } = {},
): { out: Float32Array; stats: H3NotchStats } {
  const n = y.length;
  const out = new Float32Array(n);
  const stats: H3NotchStats = {
    depthDbMedian: NaN,
    depthDbMax: 0,
    makeupGainMedian: 1,
    peakBefore: 0,
    peakAfter: 0,
    rmsBefore: 0,
    rmsAfter: 0,
    voicedBlocks: 0,
    totalBlocks: 0,
  };
  if (n === 0 || !Number.isFinite(ratio) || ratio <= 0) {
    out.set(y);
    return { out, stats };
  }
  const maxDepthDb = opts.maxDepthDb ?? 15;
  const Q = opts.q ?? 4;
  const smoothK = opts.smoothK ?? 0.5;
  const track = estimatePitchTrack(xIn, sr, { fMin: 50 });
  // --- Pass 1: peaking cut thích ứng, hệ số làm mượt theo khối 128 mẫu
  // (cùng nhịp với harness P1-201). ---
  const BLK = 128;
  const tmp = new Float32Array(n);
  let b0 = 1;
  let b1 = 0;
  let b2 = 0;
  let a1 = 0;
  let a2 = 0;
  let z1 = 0;
  let z2 = 0;
  let has = false;
  let depth = 0;
  const depths: number[] = [];
  let fIdx = 0;
  const nFrames = track.times.length;
  const db = (a: number, b: number) => 20 * Math.log10((a + 1e-9) / (b + 1e-9));
  for (let blk = 0; blk < n; blk += BLK) {
    stats.totalBlocks++;
    const c = Math.min(blk + BLK / 2, n - 1);
    while (fIdx + 1 < nFrames && Math.abs(track.times[fIdx + 1] - c) < Math.abs(track.times[fIdx] - c)) fIdx++;
    if (track.voiced[fIdx]) {
      const f0in = sr / periodAt(track, c);
      const f0out = ratio * f0in;
      const fc = 3 * f0out;
      if (Number.isFinite(fc) && fc >= 100 && fc <= 3000 && f0in > 0) {
        // Đo H3−H1 vào/ra trên cửa sổ 2048 mẫu quanh khối (đủ ≥2 chu kỳ ở 50 Hz).
        const w0 = Math.max(0, c - 1024);
        const w1 = Math.min(n, c + 1024);
        const h1in = goertzelMagLocal(xIn, w0, w1, sr, f0in);
        const h3in = goertzelMagLocal(xIn, w0, w1, sr, 3 * f0in);
        const h1out = goertzelMagLocal(y, w0, w1, sr, f0out);
        const h3out = goertzelMagLocal(y, w0, w1, sr, 3 * f0out);
        const excess = db(h3out, h1out) - db(h3in, h1in);
        const target = Math.max(0, Math.min(maxDepthDb, excess));
        depth += smoothK * (target - depth);
        const w = (2 * Math.PI * fc) / sr;
        const cw = Math.cos(w);
        const alpha = Math.sin(w) / (2 * Q);
        const A = Math.pow(10, -depth / 40);
        const nb0 = 1 + alpha * A;
        const nb1 = -2 * cw;
        const nb2 = 1 - alpha * A;
        const na0 = 1 + alpha / A;
        const na1 = -2 * cw;
        const na2 = 1 - alpha / A;
        const k = has ? smoothK : 1;
        b0 = b0 * (1 - k) + (nb0 / na0) * k;
        b1 = b1 * (1 - k) + (nb1 / na0) * k;
        b2 = b2 * (1 - k) + (nb2 / na0) * k;
        a1 = a1 * (1 - k) + (na1 / na0) * k;
        a2 = a2 * (1 - k) + (na2 / na0) * k;
        has = true;
        stats.voicedBlocks++;
        depths.push(depth);
        if (depth > stats.depthDbMax) stats.depthDbMax = depth;
      }
    }
    const end = Math.min(blk + BLK, n);
    for (let i = blk; i < end; i++) {
      const x0 = y[i];
      const y0 = b0 * x0 + z1;
      z1 = b1 * x0 - a1 * y0 + z2;
      z2 = b2 * x0 - a2 * y0;
      tmp[i] = y0;
    }
  }
  stats.depthDbMedian = depths.length ? medianLocal(depths) : NaN;
  // --- Pass 2: bù gain theo RMS từng khối 512 mẫu (chỉ bù phần notch lấy
  // đi: gain = rms(y)/rms(tmp), kẹp [1; 1,8], làm mượt 0,5/khối). Khối lặng
  // → gain 1 (không thổi nhiễu/thở). ---
  const BLK2 = 512;
  let g = 1;
  const gains: number[] = [];
  for (let blk = 0; blk < n; blk += BLK2) {
    const end = Math.min(blk + BLK2, n);
    let eIn = 0;
    let eOut = 0;
    for (let i = blk; i < end; i++) {
      eIn += y[i] * y[i];
      eOut += tmp[i] * tmp[i];
    }
    const rmsIn = Math.sqrt(eIn / (end - blk));
    const rmsOut = Math.sqrt(eOut / (end - blk));
    let gTarget = 1;
    if (rmsIn > 0.005 && rmsOut > 1e-9) gTarget = Math.max(1, Math.min(1.8, rmsIn / rmsOut));
    g += 0.5 * (gTarget - g);
    gains.push(g);
    for (let i = blk; i < end; i++) out[i] = tmp[i] * g;
  }
  stats.makeupGainMedian = gains.length ? medianLocal(gains.filter((v) => v > 1.001)) : 1;
  if (!Number.isFinite(stats.makeupGainMedian)) stats.makeupGainMedian = 1;
  // --- Peak guard: không cho vượt 0,98 (tránh clip khi encode 16-bit). ---
  let peak = 0;
  let peakB = 0;
  let eB = 0;
  let eA = 0;
  for (let i = 0; i < n; i++) {
    peak = Math.max(peak, Math.abs(out[i]));
    peakB = Math.max(peakB, Math.abs(y[i]));
    eB += y[i] * y[i];
    eA += out[i] * out[i];
  }
  stats.peakBefore = peakB;
  stats.rmsBefore = Math.sqrt(eB / n);
  stats.rmsAfter = Math.sqrt(eA / n);
  if (peak > 0.98) {
    const s = 0.98 / peak;
    for (let i = 0; i < n; i++) out[i] *= s;
    stats.peakAfter = 0.98;
    stats.rmsAfter *= s;
  } else {
    stats.peakAfter = peak;
  }
  return { out, stats };
}

/**
 * Pitch-shift TD-PSOLA giữ nguyên thời lượng.
 * samples: mono Float32Array; ratio = 2^(n/12) (> 1 = lên cao).
 * Trả Float32Array cùng độ dài (đầu/cuối mờ dần tự nhiên do tổng cửa sổ).
 */
export function psolaPitchShift(
  samples: Float32Array,
  sr: number,
  ratio: number,
  opts: PsolaOptions = {},
): Float32Array {
  const n = samples.length;
  const out = new Float32Array(n);
  if (n === 0 || !Number.isFinite(ratio) || ratio <= 0) return out;
  if (Math.abs(ratio - 1) < 1e-9) {
    out.set(samples);
    return out;
  }
  const o = { ...DEFAULTS, ...opts };
  // Đợt 197 P1 — xử lý tỉ lệ nguyên r = 0,5 (n = −12, lock — xem §4 LIMITS 196).
  if (o.integerRatioMode === "twostage" && isIntegerRatioHalf(ratio)) {
    // Dịch 2 lần (mỗi lần không nguyên) — không bước nào lock. Đệ quy với
    // mode "none" để không kích hoạt lại. Đợt 201 P1: twoStageSplit > 0
    // cho phép tách tầng (r1 ≠ r2, r2 = ratio/r1) — thí nghiệm triệt H3.
    const r1 = o.twoStageSplit > 0 ? o.twoStageSplit : Math.sqrt(ratio);
    const r2 = ratio / r1;
    const y1 = psolaPitchShift(samples, sr, r1, { ...o, integerRatioMode: "none" });
    const y = psolaPitchShift(y1, sr, r2, { ...o, integerRatioMode: "none" });
    // Đợt 202 P1 — notch H3 vào code sản phẩm: triệt chữ ký H3−H1 ≈ −2 dB
    // mà two-stage áp đặt (độ sâu thích ứng + Q=4 + bù gain — xem
    // applyH3Notch). Chỉ ở đường twostage −12 này; đệ quy đã dùng mode
    // "none" nên không notch lặp. h3Notch: false để đo đối chứng.
    if (o.h3Notch) return applyH3Notch(y, samples, sr, ratio).out;
    return y;
  }
  // "detune": lệch nhẹ tỉ lệ để lưới tổng hợp/phân tích trôi pha chậm.
  const rEff =
    o.integerRatioMode === "detune" && isIntegerRatioHalf(ratio)
      ? ratio * Math.pow(2, o.integerRatioDetuneSt / 12)
      : ratio;
  const track = estimatePitchTrack(samples, sr, o);
  // --- Pitch mark phân tích: bước theo T(t), neo đỉnh trong ±T/4 trên bản
  // làm mịn (W = trung vị T/2) để mark bám hài cơ bản, không nhảy theo hài
  // cao trên giọng đa hài; hạt vẫn trích từ tín hiệu gốc. ---
  const sortedPeriods = [...track.periods].sort((a, b) => a - b);
  const medPeriod = sortedPeriods[Math.floor(sortedPeriods.length / 2)] || 240;
  const smoothW = Math.max(15, Math.min(511, Math.round(medPeriod / 2) | 1));
  const smooth = movingAverage(samples, smoothW);
  const marks: number[] = [];
  let m = periodAt(track, 0);
  // Mark đầu: neo vào đỉnh gần đầu (tránh mark ở đúng 0 khi tín hiệu chưa lên).
  marks.push(localPeakPos(smooth, m, Math.max(4, m / 4)));
  let guard = 0;
  while (guard++ < n) {
    const t = periodAt(track, marks[marks.length - 1]);
    const next = marks[marks.length - 1] + t;
    if (next >= n - 1) break;
    marks.push(localPeakPos(smooth, next, Math.max(4, t / 4)));
  }
  if (marks.length < 2) {
    // Không tìm được chu kỳ (lặng / nhiễu): passthrough.
    out.set(samples);
    return out;
  }
  // --- Tổng hợp: mark cách nhau T(t)/r; hạt Hann dài 2·T_s quanh mark gần nhất. ---
  const winSum = new Float64Array(n);
  const synthStep = (pos: number): number => periodAt(track, pos) / rEff;
  // "dither" (đợt 197 P1): dịch tâm trích hạt xen kẽ ±T0/4 theo từng hạt —
  // chỉ ở tỉ lệ nguyên (gated bởi isIntegerRatioHalf), các tỉ lệ khác
  // không đổi gì. Tâm trích a' = a + dither; cửa sổ vẫn đặt tại s.
  const ditherOn = o.integerRatioMode === "dither" && isIntegerRatioHalf(ratio);
  let s = marks[0];
  let mi = 0; // con trỏ mark phân tích gần nhất (marks đã sắp xếp tăng dần)
  let gi = 0; // số thứ tự hạt (cho dither xen kẽ)
  guard = 0;
  while (s < n && guard++ < n * 2) {
    const ts = synthStep(s);
    // Mark phân tích gần s nhất.
    while (mi + 1 < marks.length && Math.abs(marks[mi + 1] - s) < Math.abs(marks[mi] - s)) mi++;
    const a = marks[mi];
    // Nửa độ dài hạt = (T0 + T_s)/2 — xem ghi chú §3 ở đầu file.
    const L = Math.max(8, (periodAt(track, a) + ts) / 2);
    const dither = ditherOn ? (gi % 2 === 0 ? 0.25 : -0.25) * periodAt(track, a) : 0;
    const aEff = a + dither;
    const p0 = Math.ceil(s - L);
    const p1 = Math.floor(s + L);
    for (let p = p0; p <= p1; p++) {
      if (p < 0 || p >= n) continue;
      const u = (p - s) / L; // [-1, 1]
      // Đợt 201 P1 — grainWindow: Hann (mặc định) hoặc Blackman (thí nghiệm
      // triệt H3). Chuẩn hoá theo tổng cửa sổ xử lý phần còn lại.
      let w: number;
      if (o.grainWindow === "blackman") {
        const x = (u + 1) / 2;
        w = 0.42 - 0.5 * Math.cos(2 * Math.PI * x) + 0.08 * Math.cos(4 * Math.PI * x);
      } else {
        w = 0.5 * (1 + Math.cos(Math.PI * u));
      }
      out[p] += w * sampleAt(samples, aEff + (p - s));
      winSum[p] += w;
    }
    s += ts;
    gi++;
  }
  // Chuẩn hoá theo tổng cửa sổ (sàn 0,5 chống thổi ở biên / chỗ thưa hạt).
  for (let i = 0; i < n; i++) {
    const d = winSum[i] < 0.5 ? 0.5 : winSum[i];
    out[i] /= d;
  }
  return out;
}

/** Tiện ích: tỉ lệ cao độ từ số semitone. */
export function semitoneRatio(nSemi: number): number {
  return Math.pow(2, nSemi / 12);
}
