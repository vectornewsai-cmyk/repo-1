#!/usr/bin/env node
/**
 * deint-fps-verdict.mjs — Đợt 98 Z8.
 * Quy tắc verdict G5/E1 (Y9 §3 — khuyến nghị nay cài vào code):
 *   mean 5 tỉ lệ drift-corrected ≥ 0,9 → PASS chắc (cách ngưỡng 0,75 ≥ 0,15)
 *   mean ≤ 0,6                          → FAIL chắc
 *   mean trong vùng (0,6 – 0,9)         → KHÔNG QUYẾT ĐƯỢC, phải đo thêm lần 2
 * Lần 2: chạy lại 11 slot, gộp 10 tỉ lệ (5 + 5), verdict trên mean gộp
 * với ngưỡng 0,75 (cùng ngưỡng G5 gốc — không nới).
 * Hàm thuần túy (không I/O) để unit test được bằng dữ liệu giả lập.
 * E1 (clicktest-77e1-deint-fps.mjs) import module này; chạy trực tiếp
 * file này (`node deint-fps-verdict.mjs`) sẽ chạy self-test và exit 0/1.
 * KHÔNG push/tag/binary.
 */
export const G5_THRESHOLD = 0.75;
export const G5_PASS_CERTAIN_MIN = 0.9;
export const G5_FAIL_CERTAIN_MAX = 0.6;

// Đợt 100 B7 — quy tắc phân loại slot-tải-đầu trong lần yên (nợ LIMITS
// gộp đợt 99 §4 mục 11; ca gốc: A7 run7 E1 — baseline mean 14,83 fps
// (≥10 → yên theo luật từ X6) nhưng slot 0 chỉ 5,52 fps, load 12–18
// trong các slot đầu; tiền lệ Z9 run4: baseline 13,13 fps, slot thấp
// nhất 6,47 fps, vẫn tính yên không caveat).
//   - IDLE_MEAN_FPS = 10: baseline mean ≥ 10 → lần yên (luật cũ, giữ nguyên).
//   - LOAD_SLOT_FPS = 6: một slot baseline < 6 fps là "slot tải" (tải sâu).
//     Ngưỡng 6 chọn từ dữ liệu thật: run7 slot 0 = 5,52 và slot 4 = 5,93
//     (< 6); Z9 run4 slot thấp nhất 6,47 (≥ 6, không gắn cờ); các lần yên
//     sạch khác có slot thấp nhất ≥ 9,72 (Z9 run1) — 6 nằm giữa hai nhóm,
//     không có lần lịch sử nào rơi vào vùng mơ hồ 6,0–6,47.
//   - Chỉ slot 0 (slot ĐẦU của lần đo) mới gắn cờ: slot giữa/cuối sụt
//     (vd A7 N10 run3 slot 2 = 5,01; run5 slot 8 = 2,74) là nhiễu trong
//     lần, KHÔNG phải "tải đầu" — chỉ liệt kê trong loadSlots để minh bạch.
//   - Lần bị gắn cờ VẪN TÍNH vào chân yên cho verdict chính (như A7 đã
//     tính run7), nhưng phân tích độ nhạy phải tính lại pool KHÔNG có các
//     lần bị gắn cờ; nếu loại hết lần gắn cờ mà mốc không còn đủ thì kết
//     luận "đủ mốc" phải ghi rõ là phụ thuộc vào các lần đó.
// Hàm thuần túy (không I/O) để unit test offline.
export const IDLE_MEAN_FPS = 10;
export const LOAD_SLOT_FPS = 6;

/**
 * Phân loại MỘT vòng G5 (11 slot, 6 slot baseline ở vị trí chẵn 0,2,4,6,8,10).
 * @param {number[]} baselineSlots — drawFps của 6 slot baseline, đúng thứ tự slot.
 * @returns {{ baselineMean:number, mode:"tải"|"yên"|"yên-slot-tải-đầu",
 *   leadingLoadSlot:boolean, loadSlots:number[], slot0Fps:number }}
 *   loadSlots = chỉ số (0..5 trong mảng baselineSlots) của các slot < 6 fps.
 */
export function classifyIdleRound(baselineSlots) {
  if (!Array.isArray(baselineSlots) || baselineSlots.length === 0) {
    throw new Error("classifyIdleRound: baselineSlots rỗng hoặc không phải mảng");
  }
  for (const v of baselineSlots) {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
      throw new Error(`classifyIdleRound: slot fps không hợp lệ (${v})`);
    }
  }
  const m = mean(baselineSlots);
  const loadSlots = baselineSlots.map((v, i) => (v < LOAD_SLOT_FPS ? i : -1)).filter((i) => i >= 0);
  if (m < IDLE_MEAN_FPS) {
    return { baselineMean: +m.toFixed(2), mode: "tải", leadingLoadSlot: false, loadSlots, slot0Fps: baselineSlots[0] };
  }
  const leading = baselineSlots[0] < LOAD_SLOT_FPS;
  return {
    baselineMean: +m.toFixed(2),
    mode: leading ? "yên-slot-tải-đầu" : "yên",
    leadingLoadSlot: leading, loadSlots, slot0Fps: baselineSlots[0],
  };
}

/**
 * Phân loại MỘT lần đo (1–2 vòng G5).
 * @param {number[][]} roundsBaselineSlots — mỗi phần tử là mảng 6 slot
 *   baseline của một vòng, đúng thứ tự vòng.
 * @returns {{ mode:"tải"|"yên"|"yên-slot-tải-đầu"|"hỗn hợp", rounds:object[],
 *   flaggedRounds:number[] }}
 *   "hỗn hợp" = có vòng tải + vòng yên (luật Z9 §3.3, giữ nguyên);
 *   "yên-slot-tải-đầu" = mọi vòng đều yên nhưng ≥1 vòng bị gắn cờ.
 */
export function classifyIdleRun(roundsBaselineSlots) {
  if (!Array.isArray(roundsBaselineSlots) || roundsBaselineSlots.length === 0) {
    throw new Error("classifyIdleRun: rounds rỗng hoặc không phải mảng");
  }
  const rounds = roundsBaselineSlots.map((slots, i) => ({ round: i + 1, ...classifyIdleRound(slots) }));
  const modes = new Set(rounds.map((r) => r.mode));
  const hasLoad = modes.has("tải");
  const hasIdle = modes.has("yên") || modes.has("yên-slot-tải-đầu");
  let mode;
  if (hasLoad && hasIdle) mode = "hỗn hợp";
  else if (hasLoad) mode = "tải";
  else if (rounds.some((r) => r.leadingLoadSlot)) mode = "yên-slot-tải-đầu";
  else mode = "yên";
  return { mode, rounds, flaggedRounds: rounds.filter((r) => r.leadingLoadSlot).map((r) => r.round) };
}

export function mean(xs) {
  if (!xs.length) throw new Error("verdictG5: ratios rỗng");
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs) {
  if (!xs.length) throw new Error("verdictG5: ratios rỗng");
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Verdict 1 lần: { mean, median, verdict: "PASS"|"FAIL"|"INCONCLUSIVE", certain, needsSecondRun } */
export function verdictG5(ratios) {
  const m = mean(ratios);
  const med = median(ratios);
  if (m >= G5_PASS_CERTAIN_MIN) return { mean: +m.toFixed(2), median: +med.toFixed(2), verdict: "PASS", certain: true, needsSecondRun: false };
  if (m <= G5_FAIL_CERTAIN_MAX) return { mean: +m.toFixed(2), median: +med.toFixed(2), verdict: "FAIL", certain: true, needsSecondRun: false };
  return { mean: +m.toFixed(2), median: +med.toFixed(2), verdict: "INCONCLUSIVE", certain: false, needsSecondRun: true };
}

/** Gộp 2 lần (mỗi lần 5 tỉ lệ): verdict trên mean gộp 10 tỉ lệ, ngưỡng 0,75. */
export function combineG5Verdict(run1Ratios, run2Ratios) {
  const combined = [...run1Ratios, ...run2Ratios];
  const m = mean(combined);
  return {
    combined, mean: +m.toFixed(2), median: +median(combined).toFixed(2),
    mean1: +mean(run1Ratios).toFixed(2), median1: +median(run1Ratios).toFixed(2),
    mean2: +mean(run2Ratios).toFixed(2), median2: +median(run2Ratios).toFixed(2),
    verdict: m >= G5_THRESHOLD ? "PASS" : "FAIL",
  };
}

// Self-test (chỉ chạy khi gọi trực tiếp file này).
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const cases = [
    // [ratios, verdict kỳ vọng, certain kỳ vọng]
    [[1.1, 1.2, 0.95, 1.05, 1.0], "PASS", true],          // mean 1,06
    [[0.5, 0.55, 0.6, 0.5, 0.58], "FAIL", true],          // mean 0,546
    [[0.7, 0.75, 0.8, 0.65, 0.72], "INCONCLUSIVE", false], // mean 0,724 — vùng xám
    [[0.9, 0.9, 0.9, 0.9, 0.9], "PASS", true],            // biên 0,9 → PASS chắc
    [[0.6, 0.6, 0.6, 0.6, 0.6], "FAIL", true],            // biên 0,6 → FAIL chắc
    [[0.89, 0.89, 0.89, 0.89, 0.89], "INCONCLUSIVE", false], // 0,89 < 0,9 → xám
    [[0.61, 0.61, 0.61, 0.61, 0.61], "INCONCLUSIVE", false], // 0,61 > 0,6 → xám
    [[0.82, 0.99, 0.87, 1.05, 0.92], "PASS", true],       // Y9 lần 2 thật: mean 0,93
    [[0.89, 1.34, 1.30, 1.16, 0.89], "PASS", true],       // Y9 lần 1 thật: mean 1,12
    [[1.05, 1.19, 1.45, 1.14, 0.95], "PASS", true],       // Y9 lần 3 thật: mean 1,16
  ];
  let bad = 0;
  for (const [ratios, wantV, wantC] of cases) {
    const got = verdictG5(ratios);
    const ok = got.verdict === wantV && got.certain === wantC;
    if (!ok) bad++;
    console.log(`${ok ? "PASS" : "FAIL"} verdictG5([${ratios.join(",")}]) mean=${got.mean} median=${got.median} → ${got.verdict} certain=${got.certain} (kỳ vọng ${wantV}/${wantC})`);
  }
  const combCases = [
    // [run1, run2, mean gộp kỳ vọng, verdict kỳ vọng]
    [[[0.7, 0.75, 0.8, 0.65, 0.72], [0.8, 0.85, 0.78, 0.82, 0.9]], 0.78, "PASS"],
    [[[0.7, 0.75, 0.8, 0.65, 0.72], [0.6, 0.65, 0.7, 0.62, 0.68]], 0.69, "FAIL"],
    [[[0.82, 0.99, 0.87, 1.05, 0.92], [0.89, 1.34, 1.30, 1.16, 0.89]], 1.02, "PASS"],
  ];
  for (const [[r1, r2], wantMean, wantV] of combCases) {
    const got = combineG5Verdict(r1, r2);
    const ok = got.mean === wantMean && got.verdict === wantV && got.combined.length === 10;
    if (!ok) bad++;
    console.log(`${ok ? "PASS" : "FAIL"} combineG5Verdict mean=${got.mean} median=${got.median} → ${got.verdict} (kỳ vọng ${wantMean}/${wantV}, n=${got.combined.length})`);
  }
  // Median lẻ/chẵn + lỗi ratios rỗng.
  const medOdd = median([3, 1, 2]) === 2;
  const medEven = median([4, 1, 2, 3]) === 2.5;
  console.log(`${medOdd && medEven ? "PASS" : "FAIL"} median lẻ/chẵn (2 / 2.5)`);
  if (!medOdd || !medEven) bad++;
  let threw = false;
  try { verdictG5([]); } catch { threw = true; }
  console.log(`${threw ? "PASS" : "FAIL"} verdictG5([]) phải throw`);
  if (!threw) bad++;
  console.log(bad === 0 ? `SELF-TEST: ${cases.length + combCases.length + 3} case PASS hết` : `SELF-TEST: ${bad} case FAIL`);
  process.exit(bad === 0 ? 0 : 1);
}
