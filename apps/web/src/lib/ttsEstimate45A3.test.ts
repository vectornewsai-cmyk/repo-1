/**
 * ttsEstimate45A3.test.ts — Test cho đợt 45 luồng A3 (ROUND45-A3).
 *
 * Khóa:
 * 1. Tương thích Z3: điểm trung tâm dùng đúng hằng 18,4 và ước lượng lại
 *    đúng 3 mẫu đo thật (29 → 2,08 s; 114 → 5,92 s; 227 → 12,08 s) — nhưng
 *    nay khoảng [min, max] của từng tầng phải CHỨA được giá trị thật đó
 *    (điểm duy nhất của Z3 thì không chứa được mẫu ngắn: lệch −24%).
 * 2. Phân tầng: ranh giới 20/80/200; mọi tầng hiện dùng chung hệ số 18,4
 *    và cờ calibrated đều false (cấm bịa hệ số riêng theo tầng khi chưa
 *    có mẫu đo riêng — xem ttsEstimate45A3.ts).
 * 3. Trường hợp biên: chuỗi rỗng → null; 1 ký tự → veryShort; rất dài
 *    (5000 ký tự = trần text TTS của bridge) → long, hữu hạn; đếm theo
 *    code point (emoji không bị đếm đôi như UTF-16 unit).
 *
 * Chạy bằng esbuild bundle (quy ước đợt 45):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/ttsEstimate45A3.test.ts \
 *     --bundle --format=esm --platform=node --outfile=/tmp/tts45a3.test.mjs
 *   node /tmp/tts45a3.test.mjs
 */
import {
  TTS_TIERS_45A3,
  estimateTtsDurationRange45A3,
  estimateTtsDurationSec45A3,
  ttsEstimateRangeSuffix45A3,
  ttsTierForLength45A3,
} from "./ttsEstimate45A3";
import { TTS_VI_CHARS_PER_SEC } from "./ttsDuration44Z3";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

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

// ---------------------------------------------------------------------------
// 1. Tương thích Z3: điểm trung tâm + khoảng chứa giá trị thật
// ---------------------------------------------------------------------------

test("Z3: hằng trung tâm mọi tầng = 18,4, không tầng nào có hệ số riêng bịa", () => {
  eq(TTS_VI_CHARS_PER_SEC, 18.4, "hằng Z3");
  eq(TTS_TIERS_45A3.length, 4, "đủ 4 tầng");
  for (const t of TTS_TIERS_45A3) {
    eq(t.charsPerSec, 18.4, `tầng ${t.tier} phải dùng hệ số chuẩn 18,4`);
    eq(t.calibrated, false, `tầng ${t.tier} chưa hiệu chuẩn riêng (không bịa)`);
  }
});

test("Z3: khoảng của từng tầng chứa được giá trị thật của mẫu Z3 rơi vào nó", () => {
  // 29 ký tự → short, thật 2,08 s (điểm Z3 chỉ 1,58 s, lệch −24%);
  // 114 ký tự → medium, thật 5,92 s; 227 ký tự → long, thật 12,08 s.
  const cases: Array<[number, number, string]> = [
    [29, 2.08, "short"],
    [114, 5.92, "medium"],
    [227, 12.08, "long"],
  ];
  for (const [chars, real, tier] of cases) {
    const r = estimateTtsDurationRange45A3("x".repeat(chars))!;
    eq(r.tier, tier as typeof r.tier, `tầng của ${chars} ký tự`);
    approx(r.seconds, chars / 18.4, 1e-9, `điểm trung tâm ${chars} ký tự`);
    inRange(real, r.minSec, r.maxSec, `khoảng tầng ${tier} phải chứa ${real}s thật`);
    assert(r.minSec < r.seconds && r.seconds < r.maxSec, `khoảng phải bao quanh điểm trung tâm (${tier})`);
  }
});

test("mẫu mới 45A3: câu rất ngắn + giọng khác đều nằm trong khoảng của tầng mình", () => {
  // Đo thật 05/11/2026 bằng tts.py trực tiếp (bridge không chạy sẵn):
  // "Xin chào!" 9 ký tự, Hải Đăng → 0,720 s (ffprobe khớp WAV header);
  // câu 71 ký tự, Trúc Ly → 3,920 s. Cả hai đều được khóa là "nằm trong
  // khoảng", KHÔNG dùng để đổi hệ số (n = 1 mỗi trường hợp).
  const veryShort = estimateTtsDurationRange45A3("Xin chào!")!;
  eq(veryShort.tier, "veryShort", "9 ký tự");
  eq(veryShort.chars, 9, "9 ký tự");
  inRange(0.72, veryShort.minSec, veryShort.maxSec, "khoảng veryShort phải chứa 0,720 s thật");
  approx(0.72 / (9 / 18.4), 1.47, 0.01, "tỉ lệ thật/ước lượng câu rất ngắn ≈ 1,47 (lệch lên, đúng hướng cảnh báo)");
  const otherVoice = estimateTtsDurationRange45A3(
    "VCut Studio chạy hoàn toàn trên máy của bạn, không cần máy chủ đám mây.",
  )!;
  eq(otherVoice.tier, "short", "71 ký tự → short");
  eq(otherVoice.chars, 71, "71 ký tự");
  inRange(3.92, otherVoice.minSec, otherVoice.maxSec, "khoảng short phải chứa 3,920 s thật (giọng Trúc Ly)");
  approx(3.92 / (71 / 18.4), 1.02, 0.01, "tỉ lệ thật/ước lượng giọng Trúc Ly ≈ 1,02");
});

test("tương thích điểm Z3: 184 ký tự → 10,0 s như hậu tố Z3 cũ", () => {
  approx(estimateTtsDurationSec45A3("x".repeat(184))!, 10.0, 1e-9, "184/18,4");
  eq(ttsEstimateRangeSuffix45A3("x".repeat(184)), " (≈9.0–12.0s)", "hậu tố khoảng medium: 10,0×[0,9, 1,2]");
});

// ---------------------------------------------------------------------------
// 2. Phân tầng: ranh giới
// ---------------------------------------------------------------------------

test("ranh giới tầng: 19/20, 79/80, 199/200", () => {
  eq(ttsTierForLength45A3(19)?.tier, "veryShort", "19");
  eq(ttsTierForLength45A3(20)?.tier, "short", "20");
  eq(ttsTierForLength45A3(79)?.tier, "short", "79");
  eq(ttsTierForLength45A3(80)?.tier, "medium", "80");
  eq(ttsTierForLength45A3(199)?.tier, "medium", "199");
  eq(ttsTierForLength45A3(200)?.tier, "long", "200");
  eq(ttsTierForLength45A3(0), null, "0 ký tự → null");
  eq(ttsTierForLength45A3(-5), null, "âm → null");
});

// ---------------------------------------------------------------------------
// 3. Trường hợp biên
// ---------------------------------------------------------------------------

test("biên: rỗng → null, không bịa số; hậu tố rỗng → ''", () => {
  eq(estimateTtsDurationRange45A3(""), null, "text rỗng");
  eq(estimateTtsDurationSec45A3(""), null, "điểm rỗng");
  eq(ttsEstimateRangeSuffix45A3(""), "", "hậu tố rỗng");
});

test("biên: 1 ký tự → veryShort, khoảng hữu hạn bao quanh điểm trung tâm", () => {
  const r = estimateTtsDurationRange45A3("a")!;
  eq(r.tier, "veryShort", "1 ký tự");
  eq(r.chars, 1, "chars");
  approx(r.seconds, 1 / 18.4, 1e-9, "điểm");
  assert(Number.isFinite(r.minSec) && Number.isFinite(r.maxSec), "khoảng hữu hạn");
  assert(r.minSec < r.seconds && r.seconds < r.maxSec, "khoảng bao quanh điểm");
});

test("biên: rất dài 5000 ký tự (trần text bridge) → long, hữu hạn", () => {
  const r = estimateTtsDurationRange45A3("x".repeat(5000))!;
  eq(r.tier, "long", "5000 ký tự");
  approx(r.seconds, 5000 / 18.4, 1e-9, "điểm");
  assert(Number.isFinite(r.minSec) && Number.isFinite(r.maxSec), "khoảng hữu hạn");
  assert(r.minSec < r.seconds && r.seconds < r.maxSec, "khoảng bao quanh điểm");
});

test("biên: đếm code point — emoji không đếm đôi, khoảng trắng 1 ký tự vẫn tính", () => {
  const r = estimateTtsDurationRange45A3("🎬🎬")!;
  eq(r.chars, 2, "2 emoji = 2 ký tự, không phải 4 UTF-16 unit");
  eq(r.tier, "veryShort", "2 ký tự");
  const ws = estimateTtsDurationRange45A3(" ")!;
  eq(ws.chars, 1, "1 khoảng trắng = 1 ký tự (cùng quy ước đếm của Z3)");
});

test("bất biến: mọi độ dài mẫu đều có min < điểm < max và hữu hạn", () => {
  for (const len of [1, 9, 19, 20, 29, 79, 80, 114, 199, 200, 227, 1000, 5000]) {
    const r = estimateTtsDurationRange45A3("x".repeat(len))!;
    assert(Number.isFinite(r.seconds) && Number.isFinite(r.minSec) && Number.isFinite(r.maxSec), `hữu hạn ở ${len}`);
    assert(r.minSec < r.seconds && r.seconds < r.maxSec, `bao quanh điểm ở ${len}`);
  }
});

console.log(`\nttsEstimate45A3: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
