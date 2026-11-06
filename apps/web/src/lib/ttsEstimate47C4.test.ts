/**
 * ttsEstimate47C4.test.ts — Test cho đợt 47 luồng C4 (ROUND47-C4).
 *
 * Khóa:
 * 1. Hiệu chuẩn: n mỗi tầng (tổng + mới C4 + tách chế độ), hệ số gộp
 *    tính lại từ TTS_SAMPLES_47C4, khoảng = biên quan sát làm tròn ra
 *    ngoài và chứa mọi mẫu của chế độ đó. SỬA Ở ĐỢT 48 D1: tầng
 *    medium normal gộp thêm 12 mẫu D1 (n = 17, hệ số 16,0714) và
 *    chế độ số-dày gộp thêm mẫu X1 (n = 4, hệ số 9,5388) — test tính
 *    lại từ cả hai nguồn (TTS_SAMPLES_47C4 + TTS_SAMPLES_NEW_48D1);
 *    các tầng veryShort/short/long giữ nguyên số C4.
 * 2. Phát hiện chế độ: text nhiều số (M3/L3/S4) đọc chậm gấp đôi
 *    (~9 ký tự/giây so với ~17–19); tên riêng/dấu câu dày đọc bình
 *    thường; bộ phát hiện tỉ lệ chữ số phân biệt đúng mọi mẫu đã đo.
 *    SỬA Ở ĐỢT 48 D1: ngưỡng 5% → 13% (mẫu D1-T5 5,08% đọc bình
 *    thường; xem LIMITS D1 §4).
 * 3. Phương sai: câu ngắn 6 lần đo chỉ 2 giá trị 0,56/0,64 s
 *    (lệch cực đại +9,1%/−4,6%); câu dài 3 lần chạy chụm trong
 *    16,52–16,79 s (spread 1,6%) — phù hợp giả thuyết lượng tử hóa
 *    0,08 s.
 * 4. Phương sai: câu ngắn 6 lần đo chỉ 2 giá trị 0,56/0,64 s;
 *    câu dài 3 lần chạy chụm 16,52–16,79 s.
 * 5. Hậu tố toast qua helper C4 (header thật / khoảng / rỗng).
 *    SỬA Ở ĐỢT 48 D1: hậu tố medium 184 ký tự "(≈9.6–14.7s)" và
 *    M3 "(≈15.4–21.9s)" theo bảng mới (khoảng nới rộng).
 * 6. Ranh giới tầng giữ nguyên A3.
 *
 * Chạy bằng esbuild bundle (quy ước đợt 45/46/47):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/ttsEstimate47C4.test.ts \
 *     --bundle --format=esm --platform=node --outfile=/tmp/tts47c4.test.mjs
 *   REPO_ROOT=$PWD node /tmp/tts47c4.test.mjs
 */
import {
  TTS_NUMBER_DENSE_47C4,
  TTS_SAMPLES_47C4,
  TTS_SAMPLES_NEW_47C4,
  TTS_TIERS_47C4,
  TTS_VARIANCE_LONG_47C4,
  TTS_VARIANCE_SHORT_47C4,
  estimateTtsDurationRange47C4,
  estimateTtsDurationSec47C4,
  isNumberDenseText47C4,
  ttsDoneSuffixRange47C4,
  ttsEstimateRangeSuffix47C4,
  ttsTierForLength47C4,
} from "./ttsEstimate47C4";
import { TTS_SAMPLES_46B3 } from "./ttsEstimate46B3";
import { TTS_SAMPLES_NEW_48D1 } from "./ttsEstimate48D1";
import { ttsTextLength } from "./ttsDuration44Z3";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: {
  exitCode: number | undefined;
  env: Record<string, string | undefined>;
  cwd: () => string;
};

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq<T>(a: T, b: T, msg: string): void {
  if (a !== b) throw new Error(`${msg} — nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`);
}

function approx(a: number, b: number, tol: number, msg: string): void {
  if (Math.abs(a - b) > tol) throw new Error(`${msg} — nhận ${a}, muốn ${b} ± ${tol}`);
}

function inRange(v: number, lo: number, hi: number, msg: string): void {
  if (!(v >= lo && v <= hi)) throw new Error(`${msg} — ${v} không nằm trong [${lo}, ${hi}]`);
}

type Tier = "veryShort" | "short" | "medium" | "long";
const TIERS: Tier[] = ["veryShort", "short", "medium", "long"];

// ---------------------------------------------------------------------------
// 1. Số mẫu: 24 độc lập (16 cũ + 8 mới C4), tách chế độ rõ ràng
// ---------------------------------------------------------------------------

test("số mẫu: 24 độc lập C4 (16 B3 + 8 C4 mới); medium normal n = 17 và số-dày n = 4 sau khi gộp D1", () => {
  eq(TTS_SAMPLES_46B3.length, 16, "bảng B3 giữ nguyên 16 mẫu");
  eq(TTS_SAMPLES_47C4.length, 24, "tổng 24 mẫu độc lập C4 (không tính D1)");
  eq(TTS_SAMPLES_NEW_47C4.length, 8, "8 mẫu mới C4");
  eq(TTS_SAMPLES_NEW_48D1.length, 13, "13 mẫu mới D1 trong pool (5 thăm dò + 7 giọng + X1)");
  // n theo tầng: medium normal = 5 C4 + 12 D1; medium số-dày = 1 C4 + 1 D1 (X1).
  const wantNormal: Record<Tier, number> = { veryShort: 6, short: 5, medium: 17, long: 5 };
  const wantDense: Record<Tier, number> = { veryShort: 0, short: 1, medium: 2, long: 1 };
  const wantNew: Record<Tier, number> = { veryShort: 1, short: 1, medium: 3, long: 3 };
  for (const tier of TIERS) {
    const spec = TTS_TIERS_47C4.find((t) => t.tier === tier)!;
    eq(spec.calibrated, true, `tầng ${tier} phải calibrated (đủ ≥3 mẫu normal)`);
    const normalC4 = TTS_SAMPLES_47C4.filter((s) => s.tier === tier && s.regime === "normal");
    const denseC4 = TTS_SAMPLES_47C4.filter((s) => s.tier === tier && s.regime === "numberDense");
    const normalD1 = TTS_SAMPLES_NEW_48D1.filter((s) => s.tier === tier && s.regime === "normal");
    const denseD1 = TTS_SAMPLES_NEW_48D1.filter((s) => s.tier === tier && s.regime === "numberDense");
    eq(normalC4.length + normalD1.length, wantNormal[tier], `mẫu normal tầng ${tier} (C4 + D1)`);
    eq(denseC4.length + denseD1.length, wantDense[tier], `mẫu số-dày tầng ${tier} (C4 + D1)`);
    eq(TTS_SAMPLES_NEW_47C4.filter((s) => s.tier === tier).length, wantNew[tier], `mẫu mới C4 tầng ${tier}`);
    assert(spec.note.includes(`n = ${wantNormal[tier]}`), `note tầng ${tier} phải ghi rõ n normal`);
  }
});

// ---------------------------------------------------------------------------
// 2. Hệ số gộp tính lại từ bảng mẫu (normal theo tầng + số-dày chung)
// ---------------------------------------------------------------------------

test("hệ số gộp normal = tổng ký tự / tổng giây của mẫu normal trong tầng (medium gộp thêm D1)", () => {
  for (const tier of TIERS) {
    const spec = TTS_TIERS_47C4.find((t) => t.tier === tier)!;
    // Medium: mẫu normal C4 (5) + mẫu normal D1 (12: thăm dò T2/T4/T5/
    // T8/T13 + 7 giọng mới). Các tầng khác chỉ mẫu C4 (không có mẫu D1).
    const samples = tier === "medium"
      ? [
          ...TTS_SAMPLES_47C4.filter((s) => s.tier === tier && s.regime === "normal"),
          ...TTS_SAMPLES_NEW_48D1.filter((s) => s.tier === tier && s.regime === "normal"),
        ]
      : TTS_SAMPLES_47C4.filter((s) => s.tier === tier && s.regime === "normal");
    let chars = 0;
    let secs = 0;
    for (const s of samples) {
      const n = ttsTextLength(s.text);
      assert(n > 0, `mẫu ${s.id} phải có text đo được`);
      chars += n;
      secs += s.durationSec;
    }
    approx(spec.charsPerSec, chars / secs, 0.001, `hệ số gộp normal tầng ${tier} (${chars}/${secs})`);
  }
});

test("hệ số số-dày = tổng ký tự / tổng giây của 4 mẫu số-dày xuyên tầng (C4 + X1)", () => {
  const samples = [
    ...TTS_SAMPLES_47C4.filter((s) => s.regime === "numberDense"),
    ...TTS_SAMPLES_NEW_48D1.filter((s) => s.regime === "numberDense"),
  ];
  eq(samples.length, 4, "đúng 4 mẫu số-dày (M3/L3/S4 + X1)");
  let chars = 0;
  let secs = 0;
  for (const s of samples) {
    chars += ttsTextLength(s.text);
    secs += s.durationSec;
  }
  eq(chars, 697, "tổng ký tự số-dày");
  approx(secs, 73.07, 0.001, "tổng giây số-dày");
  approx(TTS_NUMBER_DENSE_47C4.charsPerSec, chars / secs, 0.001, "hệ số số-dày 697/73,07");
  approx(TTS_NUMBER_DENSE_47C4.charsPerSec, 9.5388, 0.001, "hệ số số-dày ≈ 9,5388 (D1 sửa từ 9,0010)");
});

test("khoảng = biên quan sát, làm tròn ra ngoài, chứa mọi mẫu của chế độ đó (medium + số-dày gộp D1)", () => {
  for (const tier of TIERS) {
    const spec = TTS_TIERS_47C4.find((t) => t.tier === tier)!;
    // Medium: mẫu normal C4 + D1; các tầng khác chỉ mẫu C4.
    const samples = tier === "medium"
      ? [
          ...TTS_SAMPLES_47C4.filter((s) => s.tier === tier && s.regime === "normal"),
          ...TTS_SAMPLES_NEW_48D1.filter((s) => s.tier === tier && s.regime === "normal"),
        ]
      : TTS_SAMPLES_47C4.filter((s) => s.tier === tier && s.regime === "normal");
    const ratios = samples.map((s) => s.durationSec / (ttsTextLength(s.text) / spec.charsPerSec));
    const minR = Math.min(...ratios);
    const maxR = Math.max(...ratios);
    assert(spec.minFactor <= minR, `minFactor tầng ${tier} phải ≤ tỉ lệ nhỏ nhất (${minR})`);
    assert(minR - spec.minFactor < 0.001, `minFactor tầng ${tier} không được nhỏ hơn biên quá 0,001`);
    assert(spec.maxFactor >= maxR, `maxFactor tầng ${tier} phải ≥ tỉ lệ lớn nhất (${maxR})`);
    assert(spec.maxFactor - maxR < 0.001, `maxFactor tầng ${tier} không được lớn hơn biên quá 0,001`);
    for (const s of samples) {
      const r = estimateTtsDurationRange47C4(s.text)!;
      eq(r.tier, tier, `tầng của mẫu ${s.id}`);
      eq(r.regime, "normal", `chế độ của mẫu ${s.id}`);
      inRange(s.durationSec, r.minSec, r.maxSec, `khoảng C4 normal tầng ${tier} phải chứa mẫu ${s.id} (${s.durationSec}s)`);
    }
  }
  // Chế độ số-dày: khoảng chứa cả 4 mẫu (C4 + X1).
  const dense = [
    ...TTS_SAMPLES_47C4.filter((s) => s.regime === "numberDense"),
    ...TTS_SAMPLES_NEW_48D1.filter((s) => s.regime === "numberDense"),
  ];
  const ratios = dense.map((s) => s.durationSec / (ttsTextLength(s.text) / TTS_NUMBER_DENSE_47C4.charsPerSec));
  const minR = Math.min(...ratios);
  const maxR = Math.max(...ratios);
  assert(TTS_NUMBER_DENSE_47C4.minFactor <= minR, "minFactor số-dày phải ≤ tỉ lệ nhỏ nhất");
  assert(minR - TTS_NUMBER_DENSE_47C4.minFactor < 0.001, "minFactor số-dày không được nhỏ hơn biên quá 0,001");
  assert(TTS_NUMBER_DENSE_47C4.maxFactor >= maxR, "maxFactor số-dày phải ≥ tỉ lệ lớn nhất");
  assert(maxR - TTS_NUMBER_DENSE_47C4.maxFactor < 0.001, "maxFactor số-dày không được lớn hơn biên quá 0,001");
  for (const s of dense) {
    const r = estimateTtsDurationRange47C4(s.text)!;
    eq(r.regime, "numberDense", `chế độ của mẫu ${s.id} phải là numberDense`);
    inRange(s.durationSec, r.minSec, r.maxSec, `khoảng số-dày phải chứa mẫu ${s.id} (${s.durationSec}s)`);
  }
});

// ---------------------------------------------------------------------------
// 3. Phát hiện chế độ: số-dày chậm gấp đôi; tên riêng/dấu câu bình thường
// ---------------------------------------------------------------------------

test("phát hiện: mẫu số-dày ~9 ký tự/giây, mẫu thường ~16–20 — tách biệt rõ", () => {
  for (const s of TTS_SAMPLES_NEW_47C4) {
    const rate = ttsTextLength(s.text) / s.durationSec;
    if (s.regime === "numberDense") {
      inRange(rate, 8.0, 9.3, `mẫu số-dày ${s.id} phải đọc ~9 ký tự/giây`);
    } else {
      assert(rate >= 13.0, `mẫu thường ${s.id} phải đọc ≥13 ký tự/giây, nhận ${rate}`);
    }
  }
  const denseRates = TTS_SAMPLES_NEW_47C4.filter((s) => s.regime === "numberDense")
    .map((s) => ttsTextLength(s.text) / s.durationSec);
  const normalRates = TTS_SAMPLES_NEW_47C4.filter((s) => s.regime === "normal")
    .map((s) => ttsTextLength(s.text) / s.durationSec);
  assert(Math.max(...denseRates) < Math.min(...normalRates) * 0.7,
    "tốc độ số-dày phải chậm hơn hẳn tốc độ thường (dưới 70% của mẫu thường chậm nhất)");
});

test("phát hiện: bộ phát hiện tỉ lệ chữ số phân biệt đúng mọi mẫu đã đo + ngưỡng", () => {
  for (const s of TTS_SAMPLES_47C4) {
    eq(isNumberDenseText47C4(s.text), s.regime === "numberDense", `phát hiện chế độ của mẫu ${s.id}`);
  }
  // Ngưỡng 13% (D1 sửa từ 5%): 13 chữ số / 100 ký tự → số-dày;
  // 12 / 100 ký tự → thường. Ngưỡng cũ 5% sai: mẫu D1-T5 (5,08%)
  // đọc bình thường (xem LIMITS D1 §4).
  eq(isNumberDenseText47C4("a".repeat(87) + "1".repeat(13)), true, "13 chữ số/100 ký tự (13%) → số-dày");
  eq(isNumberDenseText47C4("a".repeat(88) + "1".repeat(12)), false, "12 chữ số/100 ký tự (12%) → thường");
  eq(isNumberDenseText47C4(""), false, "rỗng → không số-dày");
  eq(isNumberDenseText47C4("Bản 2.4.1 sửa 128 lỗi, nhanh hơn 45%!"), true, "text S4 → số-dày");
});

// ---------------------------------------------------------------------------
// 4. Phương sai câu ngắn: 6 lần đo chỉ 2 giá trị 0,56/0,64 s
// ---------------------------------------------------------------------------

test("phương sai ngắn: 6 lần đo 'Chào bạn!' chỉ ra 0,56 s ×4 và 0,64 s ×2", () => {
  eq(TTS_VARIANCE_SHORT_47C4.length, 6, "6 lần đo câu ngắn (3 C4 + 2 B3 + 1 browser)");
  const vals = TTS_VARIANCE_SHORT_47C4.map((r) => r.durationSec);
  eq(vals.filter((v) => v === 0.56).length, 4, "0,56 s xuất hiện 4 lần");
  eq(vals.filter((v) => v === 0.64).length, 2, "0,64 s xuất hiện 2 lần");
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  approx(mean, 0.5867, 0.001, "trung bình 6 lần đo");
  approx((Math.max(...vals) - mean) / mean, 0.091, 0.001, "lệch trên so với trung bình +9,1%");
  approx((mean - Math.min(...vals)) / mean, 0.046, 0.001, "lệch dưới so với trung bình −4,6%");
  approx((Math.max(...vals) - Math.min(...vals)) / mean, 0.136, 0.001, "(max−min)/mean = 13,6%");
  for (const r of TTS_VARIANCE_SHORT_47C4) {
    eq(r.text, "Chào bạn!", `lần đo ${r.id} phải cùng text`);
    eq(r.voice, "Trúc Ly", `lần đo ${r.id} phải cùng giọng`);
  }
});

test("phương sai dài: 3 lần chạy câu B3-L1 chụm trong 16,52–16,79 s (spread 1,6%)", () => {
  eq(TTS_VARIANCE_LONG_47C4.length, 3, "3 lần chạy lặp câu dài");
  const vals = TTS_VARIANCE_LONG_47C4.map((r) => r.durationSec);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  approx(mean, 16.6833, 0.001, "trung bình 3 lần chạy");
  approx((Math.max(...vals) - Math.min(...vals)) / mean, 0.0162, 0.001, "(max−min)/mean = 1,6%");
  // Cộng lần đo gốc B3-L1 (17,04 s): 4 lần đo chụm trong 16,52–17,04 s.
  const all4 = [...vals, 17.04];
  const mean4 = all4.reduce((a, b) => a + b, 0) / all4.length;
  approx(mean4, 16.7725, 0.001, "trung bình 4 lần đo (kể cả B3-L1 gốc)");
  approx((Math.max(...all4) - Math.min(...all4)) / mean4, 0.031, 0.001, "spread 4 lần đo = 3,1%");
  assert((Math.max(...all4) - Math.min(...all4)) / mean4 < 0.05,
    "phương sai câu dài phải nhỏ hơn hẳn câu ngắn (13,6%) — phù hợp giả thuyết lượng tử hóa 0,08 s");
  for (const r of TTS_VARIANCE_LONG_47C4) {
    eq(r.voice, "Hải Đăng", `lần đo ${r.id} phải cùng giọng B3-L1`);
    eq(ttsTextLength(r.text), 317, `lần đo ${r.id} phải đúng text B3-L1 (317 ký tự)`);
    // Khoảng long normal C4 phải chứa cả 3 lần chạy lặp.
    const est = estimateTtsDurationRange47C4(r.text)!;
    inRange(r.durationSec, est.minSec, est.maxSec, `khoảng long normal phải chứa lần chạy ${r.id}`);
  }
});

// ---------------------------------------------------------------------------
// 5. Hậu tố toast qua helper C4
// ---------------------------------------------------------------------------

test("hậu tố: header thật → số thật; header thiếu → khoảng C4; rỗng → ''", () => {
  eq(ttsDoneSuffixRange47C4({ headerValue: "12.34", text: "Xin chào!" }), " (12.3s)", "header thật");
  eq(ttsDoneSuffixRange47C4({ headerValue: null, text: "Xin chào!" }), " (≈0.5–0.8s)", "header thiếu → khoảng veryShort C4");
  eq(ttsDoneSuffixRange47C4({ headerValue: "0", text: "Xin chào!" }), " (≈0.5–0.8s)", "header 0 = không hợp lệ → khoảng");
  eq(ttsDoneSuffixRange47C4({ headerValue: "", text: "Xin chào!" }), " (≈0.5–0.8s)", "header rỗng → khoảng");
  eq(ttsDoneSuffixRange47C4({ headerValue: null, text: "" }), "", "text rỗng → ''");
  eq(ttsEstimateRangeSuffix47C4("x".repeat(184)), " (≈9.6–14.7s)", "hậu tố medium normal C4: 184 ký tự (D1: khoảng nới rộng)");
  const m3 = TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M3")!;
  eq(ttsEstimateRangeSuffix47C4(m3.text), " (≈15.4–21.9s)", "hậu tố medium số-dày C4: text M3 (D1: hệ số 9,5388)");
  eq(estimateTtsDurationSec47C4(""), null, "điểm rỗng → null");
});

test("ranh giới tầng giữ nguyên A3 (19/20, 79/80, 199/200)", () => {
  eq(ttsTierForLength47C4(19)?.tier, "veryShort", "19");
  eq(ttsTierForLength47C4(20)?.tier, "short", "20");
  eq(ttsTierForLength47C4(79)?.tier, "short", "79");
  eq(ttsTierForLength47C4(80)?.tier, "medium", "80");
  eq(ttsTierForLength47C4(199)?.tier, "medium", "199");
  eq(ttsTierForLength47C4(200)?.tier, "long", "200");
  eq(ttsTierForLength47C4(0), null, "0 → null");
  eq(estimateTtsDurationRange47C4(""), null, "rỗng → null");
  eq(ttsEstimateRangeSuffix47C4(""), "", "hậu tố rỗng → ''");
});

console.log(`\nttsEstimate47C4: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
