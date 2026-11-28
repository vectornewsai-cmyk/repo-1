// parityHarness203-psola.ts — Harness parity đợt 203 P4: mảng PSOLA + R_rel σ.
// (Tách từ parityHarness203.ts đợt 203 để mỗi file dưới trần push 37.768 B;
// cùng code, chỉ chia file — coverage/số đo không đổi.)
// Chứa: psolaShiftSim, psolaAutocorrPitch, n12aGate203, sectionPsolaSim203,
// sectionPsola203, sectionRrelSigma203.
import * as fs from "node:fs";
import * as path from "node:path";
import {
  ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR,
  deintVerticalBlendWeight,
  denoiseAdaptiveK,
  denoiseBlendAlpha,
  denoiseMotionMultiplier,
  denoiseWarmupFactor,
  estimateNoiseSigmaFromRgba,
  motionBandLumaFromRgba,
  motionEstimateFromBandLuma,
} from "./enhancePreview";
import { psolaPitchShift, semitoneRatio } from "./psola";
import {
  bobFirstPreview196,
  combingRLuma,
  deintBobSim,
  tapShiftVerticalSim,
} from "./parityHarness203-deint";
import {
  HIDDEN195,
  REPO,
  TMP,
  VOICE_MTIME_195,
  compareFrames,
  denoisePreviewComposite,
  ff,
  gauss,
  goertzelMag,
  mulberry32,
  nodeRequireJs,
  record,
  spectralPeak,
  type HeadedVoiceJson,
} from "./parityHarness203-core";

// ---------------------------------------------------------------------------
// N12a — PSOLA sim ĐỘC LẬP: gọi đúng lõi psolaPitchShift thật (psola.ts,
// thuần TS — cùng hàm worklet mirror) trên sine tổng hợp, đo bằng đúng
// thước đo của harness (spectralPeak + AM khối RMS 5 ms, như
// pitchShifterSim). Không dùng số sim của P1 — chỉ đối chiếu sau ở LIMITS.
// Sine 0,7 s (T0=−0,1, T1=0,6), phân tích đoạn [0,1, 0,6) như N2a.
// ---------------------------------------------------------------------------
export function psolaShiftSim(f0: number, nSemi: number): { domFreq: number; errSt: number; errStHarm: number; pitchShifted: boolean; amDepth: number; magTarget: number; magOrig: number; nanSamples: number } {
  const sr = 48000;
  const T0 = -0.1;
  const T1 = 0.6;
  const N = Math.floor((T1 - T0) * sr);
  const x = new Float32Array(N);
  for (let i = 0; i < N; i++) { const t = T0 + i / sr; x[i] = Math.sin(2 * Math.PI * f0 * t); }
  const y = psolaPitchShift(x, sr, semitoneRatio(nSemi));
  const y64 = new Float64Array(y.length);
  let nanSamples = 0;
  for (let i = 0; i < y.length; i++) {
    const v = y[i];
    if (!Number.isFinite(v)) { nanSamples++; y64[i] = 0; }
    else y64[i] = v;
  }
  const a = Math.floor((0.1 - T0) * sr);
  const seg = y64.subarray(a, N);
  const target = f0 * semitoneRatio(nSemi);
  // Đỉnh TOÀN CỤC (phổ rộng 50–2000 Hz, thô bước 2 Hz rồi mịn ±2 Hz bước
  // 0,25 Hz) — KHÔNG tìm hẹp quanh mục tiêu: tìm hẹp sẽ báo sideband yếu
  // ở đúng mục tiêu là "đỉnh" trong khi sóng mang gốc vẫn trội (F-196-P4-3:
  // 440/−12: Goertzel 440 Hz = 11115 vs 30 ở 220 Hz — lõi PSOLA không
  // dịch sine thuần ở r=0,5; đo hẹp [0,8×,1,25×] của P1 báo 110,2 Hz là
  // sideband yếu, không phải đỉnh trội).
  const coarse = spectralPeak(seg, sr, 50, 2000, 2);
  const peak = spectralPeak(seg, sr, Math.max(50, coarse.freq - 2), coarse.freq + 2, 0.25);
  const errSt = 12 * Math.log2(peak.freq / target);
  const magTarget = goertzelMag(seg, sr, target);
  const magOrig = goertzelMag(seg, sr, f0);
  // Dịch thật = nền tảng mục tiêu có mặt + sóng mang gốc biến mất. Đỉnh
  // toàn cục có thể rơi vào hài 2 của mục tiêu (nền yếu — PSOLA down-shift
  // 220/550/660 ở −7) nên errSt thô báo +12 st là SAI: đo lại theo hài
  // k×target gần đỉnh nhất (k∈{1,2}). pitchShifted là thước phân biệt:
  // −12: magTarget≈0,003 vs magOrig≈0,93 (không dịch); −7: magTarget
  // 0,34–0,52 vs magOrig 0,003–0,008 (đã dịch, chỉ nền yếu).
  const pitchShifted = magTarget >= 10 * magOrig;
  const kHarm = Math.abs(peak.freq - 2 * target) < Math.abs(peak.freq - target) ? 2 : 1;
  const errStHarm = 12 * Math.log2(peak.freq / (kHarm * target));
  const win = Math.floor(0.005 * sr);
  let mn = Infinity;
  let mx = -Infinity;
  for (let s0 = a; s0 + win <= N; s0 += win) {
    let ss = 0;
    for (let i = s0; i < s0 + win; i++) ss += y64[i] * y64[i];
    const rms = Math.sqrt(ss / win);
    mn = Math.min(mn, rms);
    mx = Math.max(mx, rms);
  }
  const amDepth = (mx - mn) / (mx + mn);
  return { domFreq: peak.freq, errSt, errStHarm, pitchShifted, amDepth, magTarget, magOrig, nanSamples };
}
// ---------------------------------------------------------------------------
// Gate N12a MỚI THEO QUYẾT (a4)-199 (parent, aggregate 199 §14.2 — bản đã
// KHÔI PHỤC 86.880 B; tiền đề (a4)-198 SAI nên thước domFreq/errHarm ở −12
// ĐÃ BỎ — F-199-P4-1: domFreq 330/550 ở −12 = 495/825 Hz, hài 3 của đích,
// errHarm 7,02 st; thước đó không đứng). Ở −12: gate = CAO ĐỘ AUTOCORR
// (|errSt| ≤ 0,1 st — bộ ước cao độ theo chu kỳ đọc đúng đích dù hài 3
// trội hơn nền: P4-199 đo autocorr đúng đích cả 5 f0, errSt ≤ 0,054 st,
// r ≈ 0,99) + cao độ wide 10/10 (phần wide kiểm bằng tái tính độc lập từ
// JSON headed thô của P1-200 — round200-p4/scratch/wide-rederive-200.mjs,
// LIMITS P4-200 §2 — không nằm trong sim lõi này). Ở −7/+7/+12 thước mag
// cũ vẫn đứng (pitchShifted = magTarget ≥ 10×magOrig). Tỉ số mag ở −12 và
// domFreq/errHarm chỉ còn là thông tin, KHÔNG chặn verdict.
// psolaAutocorrPitch: sine 2 s qua đúng lõi psolaPitchShift, đo tự tương
// quan chuẩn hoá trên đoạn [0,5, 1,5), lag ứng với 80–700 Hz, báo đỉnh
// cục bộ cao nhất (top-1) + r + errSt so với đích. Đúng phương pháp probe
// acorr-verify-199.mjs của P4-199 (đã kiểm chứng: errSt ≤ 0,054 st).
// ---------------------------------------------------------------------------
export function psolaAutocorrPitch(f0: number, nSemi: number): { f0est: number; r: number; errSt: number; top3: Array<{ f: number; r: number }> } {
  const sr = 48000;
  const N = 2 * sr;
  const x = new Float32Array(N);
  for (let i = 0; i < N; i++) x[i] = Math.sin((2 * Math.PI * f0 * i) / sr);
  const y = psolaPitchShift(x, sr, semitoneRatio(nSemi));
  const seg = y.slice(Math.floor(0.5 * sr), Math.floor(1.5 * sr));
  const n = seg.length;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += seg[i];
  mean /= n;
  const xc = new Float64Array(n);
  for (let i = 0; i < n; i++) xc[i] = seg[i] - mean;
  let e0 = 0;
  for (let i = 0; i < n; i++) e0 += xc[i] * xc[i];
  const lagMin = Math.floor(sr / 700);
  const lagMax = Math.ceil(sr / 80);
  const vals: Array<{ lag: number; f: number; r: number }> = [];
  for (let lag = lagMin; lag <= lagMax; lag++) {
    let sv = 0;
    for (let i = 0; i + lag < n; i++) sv += xc[i] * xc[i + lag];
    vals.push({ lag, f: sr / lag, r: e0 === 0 ? 0 : sv / e0 });
  }
  const peaks: Array<{ lag: number; f: number; r: number }> = [];
  for (let i = 1; i < vals.length - 1; i++)
    if (vals[i].r > vals[i - 1].r && vals[i].r >= vals[i + 1].r) peaks.push(vals[i]);
  peaks.sort((a, b) => b.r - a.r);
  const top = peaks.slice(0, 3);
  const target = f0 * semitoneRatio(nSemi);
  const f0est = top.length > 0 ? top[0].f : NaN;
  return { f0est, r: top.length > 0 ? top[0].r : 0, errSt: top.length > 0 ? 12 * Math.log2(top[0].f / target) : NaN, top3: top.map((t) => ({ f: t.f, r: t.r })) };
}
export function n12aGate203(r: { n: number; errStAcorr: number; pitchShifted: boolean }): { gateShifted: boolean; gate: string } {
  if (r.n === -12) return { gateShifted: Math.abs(r.errStAcorr) <= 0.1, gate: "minus12-autocorr" };
  return { gateShifted: r.pitchShifted, gate: "mag-ratio-10x" };
}
export function sectionPsolaSim203(): void {
  console.log("== N12a PSOLA sim độc lập (P1-200) — lõi psolaPitchShift thật trên sine, gate mới (a4)-199 ==");
  const grid: Array<{ f0: number; n: number }> = [];
  for (const f0 of [220, 330, 440, 550, 660])
    for (const n of [12, -12, 7, -7]) grid.push({ f0, n });
  const rows = grid.map((c) => {
    const s = psolaShiftSim(c.f0, c.n);
    // Thước (a4)-199 ở −12: cao độ autocorr (errSt ≤ 0,1 st). Chỉ đo
    // autocorr ở −12 (đắt: sine 2 s + quét lag) — các n khác giữ mag.
    const ac = c.n === -12 ? psolaAutocorrPitch(c.f0, c.n) : null;
    const g = n12aGate203({ n: c.n, errStAcorr: ac ? ac.errSt : 0, pitchShifted: s.pitchShifted });
    return { ...c, ...s, acorrF0est: ac ? ac.f0est : -1, acorrR: ac ? ac.r : -1, errStAcorr: ac ? ac.errSt : NaN, gateShifted: g.gateShifted, gate: g.gate };
  });
  const worstErr = Math.max(...rows.map((r) => Math.abs(r.errSt)));
  // worstErrHarm nay CHỈ LÀ THÔNG TIN (thước domFreq/errHarm ở −12 đã bỏ
  // theo (a4)-199) — giữ worstErrHarmMag để đối chiếu với hồ sơ 198/199.
  const worstErrHarm = Math.max(...rows.map((r) => Math.abs(r.errStHarm)));
  const worstErrHarmMag = Math.max(...rows.filter((r) => r.pitchShifted).map((r) => Math.abs(r.errStHarm)));
  const worstErrAcorrM12 = Math.max(...rows.filter((r) => r.n === -12).map((r) => Math.abs(r.errStAcorr)));
  const worstAm = Math.max(...rows.map((r) => r.amDepth));
  // Điểm KHÔNG dịch theo thước mag cũ (chỉ còn là thông tin ở −12).
  const notShifted = rows.filter((r) => !r.pitchShifted).map((r) => `${r.f0}/${r.n > 0 ? "+" : ""}${r.n}`);
  // Điểm RỚT gate mới (a4)-199: −12 rớt khi |errSt autocorr| > 0,1 st;
  // các n khác rớt khi không qua thước mag.
  const gateFail = rows.filter((r) => !r.gateShifted).map((r) => `${r.f0}/${r.n > 0 ? "+" : ""}${r.n}`);
  const weakFund = rows.filter((r) => r.pitchShifted && Math.abs(r.errSt) > 0.5).map((r) => `${r.f0}/${r.n > 0 ? "+" : ""}${r.n}`);
  const nums: Record<string, number | string> = { worst_err_st: worstErr, worst_err_harm_st: worstErrHarm, worst_err_harm_mag_st: worstErrHarmMag, worst_err_acorr_m12_st: worstErrAcorrM12, worst_AM_depth: worstAm, not_shifted_count: notShifted.length, pitch_shifted_count: rows.filter((r) => r.pitchShifted).length, gate_fail_count: gateFail.length, gate_fail_points: gateFail.join(", ") || "không có", weak_fundamental_count: weakFund.length, nan_samples_max: Math.max(...rows.map((r) => r.nanSamples)) };
  for (const f0 of [220, 330, 440, 550, 660]) {
    const sub = rows.filter((r) => r.f0 === f0);
    nums[`worst_err_${f0}_st`] = Math.max(...sub.map((r) => Math.abs(r.errSt)));
    nums[`worst_AM_${f0}`] = Math.max(...sub.map((r) => r.amDepth));
    for (const r of sub) {
      const sgn = r.n > 0 ? `p${r.n}` : `m${-r.n}`;
      nums[`err_${f0}_${sgn}_st`] = r.errSt;
      nums[`errHarm_${f0}_${sgn}_st`] = r.errStHarm;
      nums[`shifted_${f0}_${sgn}`] = r.pitchShifted ? 1 : 0;
      nums[`gate_shifted_${f0}_${sgn}`] = r.gateShifted ? 1 : 0;
      nums[`mag_ratio_${f0}_${sgn}`] = r.magOrig === 0 ? -1 : r.magTarget / r.magOrig;
      nums[`AM_${f0}_${sgn}`] = r.amDepth;
      nums[`domFreq_${f0}_${sgn}_Hz`] = r.domFreq;
      nums[`magTarget_${f0}_${sgn}`] = r.magTarget;
      nums[`magOrig_${f0}_${sgn}`] = r.magOrig;
      if (r.n === -12) {
        nums[`errStAcorr_${f0}_m12_st`] = r.errStAcorr;
        nums[`acorr_f0est_${f0}_m12_Hz`] = r.acorrF0est;
        nums[`acorr_r_${f0}_m12`] = r.acorrR;
      }
    }
  }
  record({
    id: "N12a-psola-sim",
    name: "PSOLA pitch sim độc lập — lõi psolaPitchShift thật trên sine, f0 220/330/440/550/660 × n ±12/±7, 20 điểm (gate mới (a4)-199)",
    verdict: gateFail.length === 0 && worstAm <= 0.35 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: nums,
    notes: `Sim độc lập: gọi đúng psolaPitchShift (psola.ts — lõi thuần TS mà AudioWorklet mirror) trên sine 0,7 s, đo bằng thước đo của harness (đỉnh TOÀN CỤC 50–2000 Hz + AM khối RMS 5 ms); riêng −12 đo thêm cao độ autocorr trên sine 2 s (đoạn [0,5, 1,5), lag 80–700 Hz). GATE MỚI theo quyết (a4)-199: ở −12 chỉ xét cao độ autocorr (|errSt| ≤ 0,1 st) — thước domFreq/errHarm ĐÃ BỎ (tiền đề (a4)-198 SAI, F-199-P4-1) và tỉ số mag KHÔNG còn là điều kiện flip ở −12 (cấu trúc, F-198-P1-1); ở −7/+7/+12 thước mag ≥ 10× vẫn đứng. Bar PSOLA theo quyết (a2)-195: AM ≤ 0,35 ở MỌI f0. Điểm KHÔNG dịch theo thước mag cũ: ${notShifted.join(", ") || "không có"} (ở −12 chỉ là thông tin, không chặn verdict); điểm RỚT gate mới: ${gateFail.join(", ") || "không có"}; điểm nền yếu (hài 2 trội): ${weakFund.join(", ") || "không có"}. Phần "cao độ wide 10/10" của gate kiểm riêng bằng tái tính độc lập từ JSON headed thô của P1 (LIMITS P4-200 §2). Đối chiếu số sim P1-196 (round196-p1/sim-psola-196.json + sim-psola2-196.json) ở LIMITS P4-196 §2.2 — số P1 KHÔNG dùng làm số của P4.`,
  });
}

// ---------------------------------------------------------------------------
// N12 — PSOLA pitch (P1-200, quyết (a2)-197 + gate −12 mới (a4)-199):
// AM ≤ 0,35 ở MỌI f0 + |err| ≤ 0,5 st, trên dữ liệu headed P1-200 (mọi n
// có trong JSON, không chỉ ±12/±7). WSOLA cũ: AM@440 tệ nhất 0,72,
// AM@660 tệ nhất 0,58 (đợt 195).
// Tới khi P1-203 publish headed-voice203.json thì N12 = GHI NHẬN.
// N12a: sim PSOLA độc lập — P1-200 công bố tham số
// PSOLA (pitch-mark, cửa sổ grain); pitchShifterSim hiện tại mô hình
// WSOLA 2-delay cũ, không dùng làm sim PSOLA.
// ---------------------------------------------------------------------------
export function sectionPsola203(outDir: string): void {
  console.log("== N12 PSOLA pitch (P1-199) — AM ≤ 0,35 mọi f0 trên headed ==");
  const file203 = path.join(outDir, "headed-voice203.json");
  const file195 = path.join(HIDDEN195, "headed-voice195.json");
  let j: HeadedVoiceJson | null = null;
  let prov = "";
  const load = (f: string): HeadedVoiceJson | null => {
    try {
      const v = JSON.parse(fs.readFileSync(f, "utf8")) as HeadedVoiceJson;
      return v && !v.error && v.pitch && v.pitch.length > 0 ? v : null;
    } catch { return null; }
  };
  j = load(file203);
  if (j) prov = "201";
  if (!j) {
    let vfUnchanged = false;
    try { vfUnchanged = fs.statSync(path.join(REPO, "apps/web/src/lib/previewVoiceFx.ts")).mtimeMs <= VOICE_MTIME_195 + 1000; } catch { vfUnchanged = false; }
    if (vfUnchanged) { j = load(file195); if (j) prov = "195-regression"; }
  }
  if (!j) {
    record({
      id: "N12-psola-pitch-curve",
      name: "PSOLA pitch: AM ≤ 0,35 ở MỌI f0 (220–660 Hz) + |errSt| ≤ 0,5 st (headed)",
      verdict: "GHI NHẬN", numbers: {},
      notes: `Chưa có headed-voice203.json và code voice ĐÃ ĐỔI so với mốc P4-195 — PSOLA mới của P1-196/197 chưa đo được. Chạy lại harness sau khi P1-203 publish probe. KHÔNG verdict từ số WSOLA cũ.`,
    });
    return;
  }
  const pts = j.pitch!.filter((p) => [220, 330, 440, 550, 660].includes(p.f0));
  const nums: Record<string, number | string> = { headed_points: pts.length, headed_source: prov };
  let worstAm = 0;
  let worstErr = 0;
  for (const f0 of [220, 330, 440, 550, 660]) {
    const sub = pts.filter((p) => p.f0 === f0);
    if (sub.length === 0) { nums[`worst_AM_${f0}`] = -1; continue; }
    const wAm = Math.max(...sub.map((p) => p.amDepth));
    const wErr = Math.max(...sub.map((p) => Math.abs(p.errSt)));
    nums[`worst_AM_${f0}`] = wAm;
    nums[`worst_err_${f0}_st`] = wErr;
    nums[`n_${f0}`] = sub.length;
    worstAm = Math.max(worstAm, wAm);
    worstErr = Math.max(worstErr, wErr);
  }
  nums.worst_AM_depth = worstAm;
  nums.worst_err_st = worstErr;
  const psolaNote = prov === "200"
    ? "Dữ liệu headed PSOLA mới của P1-200."
    : "Dữ liệu headed 195 — HỒI QUY WSOLA cũ (code voice chưa đổi, chờ probe P1-200); AM@440 0,72 / AM@660 0,58 đợt 195 là baseline trước PSOLA, KHÔNG phải verdict PSOLA.";
  record({
    id: "N12-psola-pitch-curve",
    name: "PSOLA pitch: AM ≤ 0,35 ở MỌI f0 (220–660 Hz) + |errSt| ≤ 0,5 st (headed)",
    verdict: worstAm <= 0.35 && worstErr <= 0.5 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: nums,
    notes: `Bar PSOLA theo quyết (a2)-195: AM ≤ 0,35 ở mọi f0 (mọi n có trong JSON: ${pts.length} điểm), |errSt| ≤ 0,5 st. ${psolaNote}`,
  });

}

// ---------------------------------------------------------------------------
// N13 — fps nguồn media (P2-198 ghi fps:30): P4 kiểm file/code + LIMITS P2,
// không đo lại headed fps (probe fps là của P2, port/CDP riêng).
// Tên LIMITS P2 đổi theo chủ đề từng đợt (F-198-P4-1) — đợt 199 quét glob
// docs/PHASE9_ROUND203_P2_*.md thay vì hard-code tên (không đọc file 198:
// dữ liệu cũ không còn hiệu lực cho đợt mới).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// R_rel theo σ (nợ (a1)-199, parent aggregate 199 §14.2): P2-199 §5 phát hiện
// R_rel phụ thuộc σ — w0s (footage thật, nội dung nhẹ) ở σ=5 cho R_rel
// 0,245/0,216/0,213 CHƯA ĐẠT (cả adapt lẫn fixed; tap cũng 0,246), trong khi
// ở σ=15 bar 0,15 đạt được. Bar KHÔNG đổi đợt này — section này ĐO ĐỘC LẬP
// trên fixture tổng hợp của harness (cùng fixture N5b: testsrc2 + nhiễu
// Gauss seed 19100+f, interlace, truth yadif→hqdn3d, pipeline α thích nghi
// 199) ở σ=5/10/15 để xem phụ thuộc σ có tái hiện không, và cơ chế có đúng
// như P2 mô tả (σ̂ thấp → α cao → làm mờ quá mức → R_out tụt dưới R_truth).
// Verdict: GHI NHẬN (nghiên cứu thước — không phải gate; N10/N5b ở σ=15
// vẫn là verdict chính, giữ nguyên trong sectionDeint).
// ---------------------------------------------------------------------------
export function sectionRrelSigma203(): void {
  console.log("== R_rel theo sigma (nợ (a1)-199) — N5b-style fixture ở sigma=5/10/15 ==");
  const w = 320;
  const h = 180;
  const divisor = ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR;
  const s = 0.5;
  const cleanYuv = path.join(TMP, "rrel-clean.yuv");
  ff(["-v", "error", "-y", "-f", "lavfi", "-i", `testsrc2=size=${w}x${h}:rate=30:duration=1`,
    "-vf", "scale=out_color_matrix=bt709,format=yuv420p", "-f", "rawvideo", "-pix_fmt", "yuv420p", cleanYuv], "testsrc2 clean (rrel)");
  const yadif = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePreChain({deinterlace:true})`).replace(/^,/, "");
  const hq = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePostChain({denoise:{strength:${s}}})`).replace(/^,/, "");
  const frameRgbS = (yuvFile: string, idx: number): Buffer => {
    const FS = (w * h * 3) / 2;
    const buf = fs.readFileSync(yuvFile);
    const one = path.join(TMP, "rrel-one.yuv");
    fs.writeFileSync(one, buf.subarray(idx * FS, (idx + 1) * FS));
    const out = path.join(TMP, "rrel-one.rgb");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`,
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-i", one, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yuv->rgb (rrel)");
    return fs.readFileSync(out);
  };
  const baseClean = (() => {
    const out = path.join(TMP, "rrel-clean.rgb");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", cleanYuv, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24",
      "-f", "rawvideo", "-pix_fmt", "rgb24", out], "clean yuv->rgb (rrel)");
    return fs.readFileSync(out);
  })();
  const cleanAt = (i: number): Buffer => Buffer.from(baseClean.subarray(i * w * h * 3, (i + 1) * w * h * 3));
  for (const sigma of [5, 10, 15]) {
    const noisyFrames: Buffer[] = [];
    for (let f = 0; f < 30; f++) {
      const baseF = cleanAt(f);
      const rngF = mulberry32(19100 + f);
      const nb = Buffer.alloc(w * h * 3);
      for (let i = 0; i < nb.length; i++)
        nb[i] = Math.max(0, Math.min(255, Math.round(baseF[i] + sigma * gauss(rngF))));
      noisyFrames.push(nb);
    }
    const noisyIn = path.join(TMP, `rrel-noisy-${sigma}.rgb`);
    fs.writeFileSync(noisyIn, Buffer.concat(noisyFrames));
    const noisyYuv = path.join(TMP, `rrel-noisy-${sigma}.yuv`);
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyIn, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", noisyYuv], `noisy rgb->yuv sigma=${sigma}`);
    const interNoisyYuv = path.join(TMP, `rrel-interno-${sigma}.yuv`);
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyYuv, "-vf", "interlace=scan=tff:lowpass=0",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", interNoisyYuv], `interlace noisy sigma=${sigma}`);
    const truthAll = (() => {
      const out = path.join(TMP, `rrel-truth-${sigma}.rgb`);
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", interNoisyYuv, "-vf", `${yadif},${hq},scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", out], `yadif+hqdn3d truth sigma=${sigma}`);
      return fs.readFileSync(out);
    })();
    const truthAt = (i: number): Buffer => Buffer.from(truthAll.subarray(i * w * h * 3, (i + 1) * w * h * 3));
    const nums: Record<string, number | string> = { sigma_noise: sigma };
    const rRels: number[] = [];
    const rRelsTap: number[] = [];
    const mads: number[] = [];
    for (const i of [3, 7, 11]) {
      const truthRgb = truthAt(i);
      const srcNoisyRgb = frameRgbS(interNoisyYuv, i);
      const rgba = new Uint8ClampedArray(w * h * 4);
      for (let p = 0; p < w * h; p++) {
        rgba[p * 4] = srcNoisyRgb[p * 3];
        rgba[p * 4 + 1] = srcNoisyRgb[p * 3 + 1];
        rgba[p * 4 + 2] = srcNoisyRgb[p * 3 + 2];
        rgba[p * 4 + 3] = 255;
      }
      const sigmaHat = estimateNoiseSigmaFromRgba(rgba, w, h);
      const k = denoiseAdaptiveK(s, sigmaHat);
      const wf = denoiseWarmupFactor(3, s, sigmaHat);
      const alpha = denoiseBlendAlpha(s) * k * wf;
      const rgbaPrev = new Uint8ClampedArray(w * h * 4);
      {
        const prevRgb = frameRgbS(interNoisyYuv, i - 1);
        for (let p = 0; p < w * h; p++) {
          rgbaPrev[p * 4] = prevRgb[p * 3];
          rgbaPrev[p * 4 + 1] = prevRgb[p * 3 + 1];
          rgbaPrev[p * 4 + 2] = prevRgb[p * 3 + 2];
          rgbaPrev[p * 4 + 3] = 255;
        }
      }
      const motion = motionEstimateFromBandLuma(motionBandLumaFromRgba(rgba, w, h), motionBandLumaFromRgba(rgbaPrev, w, h), w);
      const motionK = motion === null ? 1 : denoiseMotionMultiplier(motion);
      const alpha199 = alpha * motionK;
      const vbW = deintVerticalBlendWeight(sigmaHat);
      const prevBf199 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha199, vbW);
      const bobNoisy = deintBobSim(srcNoisyRgb, w, h, divisor);
      const prevTap = denoisePreviewComposite(tapShiftVerticalSim(bobNoisy, w, h, 0.5), w, h, s, alpha);
      const mBf199 = compareFrames(truthRgb, prevBf199, w, h);
      const mTap = compareFrames(truthRgb, prevTap, w, h);
      const rTruth = combingRLuma(truthRgb, w, h);
      const rBf199 = combingRLuma(prevBf199, w, h);
      const rTap = combingRLuma(prevTap, w, h);
      const rRel = Math.abs(rBf199 - rTruth) / rTruth;
      const rRelTap = Math.abs(rTap - rTruth) / rTruth;
      rRels.push(rRel);
      rRelsTap.push(rRelTap);
      mads.push(mBf199.mad);
      nums[`sigma_hat_f${i}`] = sigmaHat;
      nums[`alpha_f${i}`] = alpha;
      nums[`alpha199_f${i}`] = alpha199;
      nums[`MAD_f${i}`] = mBf199.mad;
      nums[`MAD_tap_f${i}`] = mTap.mad;
      nums[`R_truth_f${i}`] = rTruth;
      nums[`R_out_f${i}`] = rBf199;
      nums[`R_tap_f${i}`] = rTap;
      nums[`R_rel_f${i}`] = rRel;
      nums[`R_rel_tap_f${i}`] = rRelTap;
    }
    const worst = Math.max(...rRels);
    const worstTap = Math.max(...rRelsTap);
    nums.R_rel_worst = worst;
    nums.R_rel_tap_worst = worstTap;
    nums.MAD_avg = mads.reduce((a, b) => a + b, 0) / mads.length;
    const shAvg = ((nums.sigma_hat_f3 as number) + (nums.sigma_hat_f7 as number) + (nums.sigma_hat_f11 as number)) / 3;
    const a19Avg = ((nums.alpha199_f3 as number) + (nums.alpha199_f7 as number) + (nums.alpha199_f11 as number)) / 3;
    nums.sigma_hat_avg = shAvg;
    nums.alpha199_avg = a19Avg;
    record({
      id: `Rrel-sigma-${sigma}`,
      name: `R_rel theo σ — fixture N5b ở σ=${sigma} (pipeline α thích nghi 199, 3 frame idx 3/7/11)`,
      verdict: "GHI NHẬN",
      numbers: nums,
      notes: `Đo độc lập (nợ (a1)-199): cùng fixture + pipeline như N5b, chỉ đổi σ nhiễu ${sigma}. R_rel worst ${worst.toFixed(3)} (tap ${worstTap.toFixed(3)}) vs bar 0,15 — so với P2-199 §5 trên footage thật w0s (σ=5: R_rel 0,245/0,216/0,213, tap 0,246). GHI NHẬN, không verdict: bar 0,15 KHÔNG đổi đợt này (quyết (a1)-199); N10/N5b ở σ=15 vẫn là verdict chính.`,
    });
  }
}

