/**
 * ttsEstimate48D1.test.ts — Test cho đợt 48 luồng D1 (ROUND48-D1).
 *
 * Khóa:
 * 1. ĐỎ-TRƯỚC (ĐỢT 51 H1 — đã chuyển): nối UI — TtsButton phải import
 *    + gọi helper H1 (ttsDoneSuffixRange51H1) với voice đang chọn,
 *    không còn dùng helper F3 cho hậu tố toast. Test này ĐỎ khi
 *    TtsButton còn nối F3 (trạng thái trước luồng H1), XANH sau khi
 *    chuyển (xem ttsEstimate51H1.test.ts §1).
 * 2. Bằng chứng toast cũ sai: với text số-dày M3 (178 ký tự, thực
 *    tế 19,99 s), helper B3 cho "(≈9.2–10.7s)" — khoảng B3 KHÔNG
 *    chứa số thật (19,99 s); helper C4 (sau sửa D1) cho
 *    "(≈15.4–21.9s)" — chứa số thật. (Lưu ý đính chính task giao:
 *    "(≈9.6–11.0s)" là hậu tố B3 cho text 184 ký tự trong test B3 §3,
 *    không phải cho M3 178 ký tự — giá trị đúng cho M3 là
 *    "(≈9.2–10.7s)", tính lại từ hằng B3 medium 18,2624
 *    [0,9483×, 1,0958×]. Hậu tố C4 cho M3 từng là "(≈19.4–21.9s)"
 *    theo bảng C4 gốc, nay là "(≈15.4–21.9s)" sau khi D1 gộp mẫu X1
 *    vào hệ số số-dày — khoảng nới rộng để chứa cả Hải Đăng.)
 * 3. Mẫu đo mới D1: thăm dò ngưỡng (~2/4/5/8/13% chữ số) + giọng mới
 *    — tỉ lệ chữ số tính lại từ text, tốc độ đo thật, phân loại chế
 *    độ đúng với ngưỡng 13% mới; giọng mới nằm trong khoảng medium
 *    mới; phản ví dụ X2 (Minh Đức đọc text 12,43% ở 8,82 ký tự/giây)
 *    được khóa là NGOÀI khoảng medium — bằng chứng mô hình nhị phân
 *    theo tỉ lệ chữ số không đủ, cần hiệu chuẩn theo giọng (nợ mở).
 * 4. Hồi quy: bảng C4 sau sửa D1 (ngưỡng 13%, medium 16,0714, số-dày
 *    9,5388) được khóa lại từ pool gộp C4 + D1; các tầng veryShort/
 *    short/long giữ nguyên số C4.
 *
 * Chạy bằng esbuild bundle (quy ước đợt 45/46/47):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/ttsEstimate48D1.test.ts \
 *     --bundle --format=esm --platform=node --outfile=/tmp/tts48d1.test.mjs
 *   REPO_ROOT=$PWD node /tmp/tts48d1.test.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import {
  TTS_NUMBER_DENSE_47C4,
  TTS_NUMBER_DENSE_DIGIT_RATIO_47C4,
  TTS_SAMPLES_NEW_47C4,
  estimateTtsDurationRange47C4,
  isNumberDenseText47C4,
  ttsDoneSuffixRange47C4,
  ttsEstimateRangeSuffix47C4,
} from "./ttsEstimate47C4";
import {
  ttsDoneSuffixRange46B3,
  ttsEstimateRangeSuffix46B3,
} from "./ttsEstimate46B3";
import {
  TTS_DENSE_CROSS_HAIDANG_48D1,
  TTS_SAMPLES_NEW_48D1,
  TTS_THRESHOLD_PROBES_48D1,
  TTS_NEW_VOICES_48D1,
  TTS_VARIANCE_48D1,
  TTS_VOICE_DEPENDENCE_COUNTEREXAMPLE_48D1,
} from "./ttsEstimate48D1";
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

function inRange(v: number, lo: number, hi: number, msg: string): void {
  if (!(v >= lo && v <= hi)) throw new Error(`${msg} — ${v} không nằm trong [${lo}, ${hi}]`);
}

/** Đọc source TtsButton.tsx từ repo root (như test B3 §4). */
function readTtsButtonSource(): string {
  const candidates = [
    process.env.REPO_ROOT,
    process.cwd(),
  ].filter((c): c is string => !!c);
  const tried: string[] = [];
  for (const root of candidates) {
    for (const rel of [
      "apps/web/src/components/TtsButton.tsx",
      "src/components/TtsButton.tsx",
    ]) {
      const p = `${root}/${rel}`;
      tried.push(p);
      if (existsSync(p)) return readFileSync(p, "utf-8");
    }
  }
  throw new Error(`không tìm được TtsButton.tsx (đã thử: ${tried.join(", ")}) — chạy test từ repo root hoặc đặt REPO_ROOT`);
}

// ---------------------------------------------------------------------------
// 1. ĐỎ-TRƯỚC (ĐỢT 50 F3 — đã chuyển): nối UI — TtsButton phải dùng helper F3 + truyền voice
// ---------------------------------------------------------------------------

test("nối UI (đợt 51 H1): TtsButton import + gọi helper H1 với voice, không dùng helper F3/E1/C4/B3, không hardcode 18,4", () => {
  const code = readTtsButtonSource();
  assert(
    code.includes('from "../lib/ttsEstimate51H1"'),
    "TtsButton phải import từ ../lib/ttsEstimate51H1",
  );
  assert(
    code.includes("ttsDoneSuffixRange51H1({"),
    "TtsButton phải gọi ttsDoneSuffixRange51H1({...})",
  );
  assert(
    code.includes("voice: cloneMode ? undefined : voice"),
    "TtsButton phải truyền voice đang chọn (clone mode → undefined để fallback hệ số chung)",
  );
  assert(
    !code.includes('from "../lib/ttsEstimate50F3"'),
    "TtsButton không được còn import helper F3 (đã chuyển sang H1 ở đợt 51 H1)",
  );
  assert(
    !code.includes("ttsDoneSuffixRange50F3({"),
    "TtsButton không được còn gọi ttsDoneSuffixRange50F3({...})",
  );
  assert(
    !code.includes('from "../lib/ttsEstimate49E1"'),
    "TtsButton không được còn import helper E1 (đã chuyển sang F3 ở đợt 50 F3)",
  );
  assert(
    !code.includes("ttsDoneSuffixRange49E1({"),
    "TtsButton không được còn gọi ttsDoneSuffixRange49E1({...})",
  );
  assert(
    !code.includes('from "../lib/ttsEstimate47C4"'),
    "TtsButton không được còn import helper C4 (đã chuyển sang E1 ở đợt 49 E1)",
  );
  assert(
    !code.includes("ttsDoneSuffixRange47C4({"),
    "TtsButton không được còn gọi ttsDoneSuffixRange47C4({...})",
  );
  assert(
    !code.includes('from "../lib/ttsEstimate46B3"'),
    "TtsButton không được còn import helper B3",
  );
  assert(
    !code.includes("ttsDoneSuffixRange46B3({"),
    "TtsButton không được còn gọi ttsDoneSuffixRange46B3({...})",
  );
  assert(
    !code.includes('from "../lib/ttsDuration44Z3"'),
    "TtsButton không được còn import helper Z3 cũ",
  );
  assert(
    !code.includes("ttsDoneSuffix({"),
    "TtsButton không được còn gọi ttsDoneSuffix cũ (dạng không Range)",
  );
  assert(!code.includes("18.4"), "TtsButton không được hardcode hệ số 18,4");
});

// ---------------------------------------------------------------------------
// 2. Bằng chứng toast cũ sai (M3) và toast mới đúng
// ---------------------------------------------------------------------------

test("toast cũ sai: B3 cho M3 '(≈9.2–10.7s)' — khoảng không chứa 19,99 s thật", () => {
  const m3 = TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M3")!;
  eq(ttsTextLength(m3.text), 178, "M3 đúng 178 ký tự");
  eq(m3.durationSec, 19.99, "M3 thực tế 19,99 s");
  // B3 medium: 178/18,2624 = 9,747 s; ×[0,9483, 1,0958] → [9,2, 10,7].
  eq(ttsEstimateRangeSuffix46B3(m3.text), " (≈9.2–10.7s)", "hậu tố B3 cho M3");
  eq(ttsDoneSuffixRange46B3({ headerValue: null, text: m3.text }), " (≈9.2–10.7s)", "toast B3 (header thiếu) cho M3");
  const b3 = { min: 9.2, max: 10.7 };
  assert(
    !(m3.durationSec >= b3.min && m3.durationSec <= b3.max),
    `khoảng B3 [${b3.min}, ${b3.max}] phải KHÔNG chứa 19,99 s thật — nếu chứa thì bằng chứng sai`,
  );
});

test("toast mới đúng: C4 cho M3 '(≈15.4–21.9s)' — khoảng chứa 19,99 s thật", () => {
  const m3 = TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M3")!;
  eq(ttsEstimateRangeSuffix47C4(m3.text), " (≈15.4–21.9s)", "hậu tố C4 cho M3 (sau sửa D1: hệ số số-dày 9,5388)");
  eq(ttsDoneSuffixRange47C4({ headerValue: null, text: m3.text }), " (≈15.4–21.9s)", "toast C4 (header thiếu) cho M3");
  const r = estimateTtsDurationRange47C4(m3.text)!;
  eq(r.regime, "numberDense", "M3 phải là chế độ numberDense ở C4");
  inRange(m3.durationSec, r.minSec, r.maxSec, "khoảng C4 số-dày phải chứa 19,99 s thật");
  // Header thật vẫn thắng ước lượng ở cả hai helper (không đổi semantics).
  eq(ttsDoneSuffixRange47C4({ headerValue: "19.99", text: m3.text }), " (20.0s)", "header thật → số thật");
  eq(ttsDoneSuffixRange47C4({ headerValue: null, text: "" }), "", "text rỗng → ''");
});

// ---------------------------------------------------------------------------
// 3. Mẫu đo mới D1: thăm dò ngưỡng + giọng mới + 2x2 + phương sai
// ---------------------------------------------------------------------------

test("mẫu D1: tỉ lệ chữ số tính lại từ text khớp mẫu thăm dò đã đo", () => {
  for (const s of TTS_SAMPLES_NEW_48D1) {
    const chars = ttsTextLength(s.text);
    assert(chars > 0, `mẫu ${s.id} phải có text đo được`);
    const digits = (s.text.match(/[0-9]/g) ?? []).length;
    const ratio = digits / chars;
    // Tỉ lệ ghi trong lib phải khớp phép đếm lại (sai số làm tròn 0,001).
    assert(
      Math.abs(ratio - s.digitRatio) < 0.001,
      `tỉ lệ chữ số mẫu ${s.id}: tính lại ${ratio.toFixed(4)}, lib ghi ${s.digitRatio}`,
    );
  }
});

test("mẫu D1: bộ phát hiện C4 phân loại đúng mọi mẫu thăm dò + giọng mới", () => {
  for (const s of TTS_SAMPLES_NEW_48D1) {
    eq(
      isNumberDenseText47C4(s.text),
      s.regime === "numberDense",
      `phát hiện chế độ của mẫu ${s.id} (tỉ lệ ${s.digitRatio})`,
    );
  }
});

test("mẫu D1: tốc độ đo thật — thăm dò giảm dần theo tỉ lệ chữ số, không có bước nhảy ở 5%", () => {
  // Hải Đăng, tỉ lệ tăng 2,05% → 12,43%: tốc độ 16,14 / 16,52 / 16,27
  // / 14,68 / 12,49 — giảm DẦN, không bước nhảy. Ngưỡng 5% cũ sai:
  // T5 (5,08%) vẫn đọc bình thường 16,27.
  const rates = TTS_THRESHOLD_PROBES_48D1.map((s) => ({
    id: s.id,
    ratio: s.digitRatio,
    rate: ttsTextLength(s.text) / s.durationSec,
  }));
  for (const { id, rate } of rates) {
    assert(rate >= 12.4, `mẫu thăm dò ${id} phải đọc ≥12,4 ký tự/giây (chưa chạm chế độ chậm ~9), nhận ${rate.toFixed(2)}`);
  }
  // T5 (5,08%) đọc bình thường — bằng chứng trực tiếp ngưỡng 5% sai.
  const t5 = rates.find((r) => r.id === "D1-T5")!;
  assert(t5.rate >= 16.0, `T5 (5,08%) phải đọc bình thường ~16, nhận ${t5.rate.toFixed(2)}`);
  // Tốc độ giảm đơn điệu (gần như) khi tỉ lệ chữ số tăng từ 5% lên.
  const tail = rates.filter((r) => r.ratio >= 0.05).map((r) => r.rate);
  for (let i = 1; i < tail.length; i++) {
    assert(tail[i] <= tail[i - 1] + 0.5, `tốc độ phải giảm dần từ 5% lên (nhận ${tail.join(", ")})`);
  }
});

test("mẫu D1: X1 (M3 × Hải Đăng) đọc số-dày ở 11,55 — nhanh hơn hẳn Minh Đức 8,90", () => {
  const x1 = TTS_DENSE_CROSS_HAIDANG_48D1;
  const rate = ttsTextLength(x1.text) / x1.durationSec;
  inRange(rate, 11.0, 12.0, "X1 phải đọc ~11,55 ký tự/giây");
  const m3 = TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M3")!;
  const m3Rate = ttsTextLength(m3.text) / m3.durationSec;
  assert(rate > m3Rate * 1.2, `Hải Đăng phải đọc text M3 nhanh hơn Minh Đức ≥20% (Hải Đăng ${rate.toFixed(2)} vs Minh Đức ${m3Rate.toFixed(2)})`);
  // X1 nằm trong khoảng số-dày MỚI (đã nới rộng để chứa cả hai giọng).
  const r = estimateTtsDurationRange47C4(x1.text)!;
  eq(r.regime, "numberDense", "X1 phải là chế độ numberDense (13,48% ≥ 13%)");
  inRange(x1.durationSec, r.minSec, r.maxSec, "khoảng số-dày mới phải chứa X1 (15,41 s)");
});

test("mẫu D1: giọng mới nằm trong khoảng medium C4 (sau sửa D1) cho text chuẩn", () => {
  for (const s of TTS_NEW_VOICES_48D1) {
    const r = estimateTtsDurationRange47C4(s.text)!;
    eq(r.regime, "normal", `mẫu giọng mới ${s.id} phải là text thường`);
    inRange(s.durationSec, r.minSec, r.maxSec, `khoảng medium normal mới phải chứa mẫu giọng mới ${s.id} (${s.voice}, ${s.durationSec}s)`);
  }
  // 4/7 giọng mới nằm ngoài khoảng medium CŨ [8,78–10,39] s — bằng
  // chứng khoảng cũ quá hẹp (xem LIMITS D1 §4.2). V4 (Đoan Trang,
  // 10,40 s) chỉ vượt 0,01 s — trong bước lượng tử hóa 0,08 s nên
  // coi như biên; 3 giọng còn lại vượt rõ (V1 +27%, V7 +15%, V5 +4%).
  const oldRange = { min: 8.78, max: 10.39 };
  const outsideOld = TTS_NEW_VOICES_48D1.filter((s) => s.durationSec < oldRange.min || s.durationSec > oldRange.max);
  eq(outsideOld.length, 4, "đúng 4/7 giọng mới nằm ngoài khoảng medium C4 cũ");
  eq(outsideOld.map((s) => s.id).join(","), "D1-V1,D1-V4,D1-V5,D1-V7", "4 giọng ngoài khoảng cũ: Thiền Tâm Đức, Đoan Trang (sát biên), Thục Đoan, Mỹ Duyên");
});

test("mẫu D1: gộp numberDense có thêm X1 = 9,5388 (697/73,07), lệch +6,0% so với hằng C4 cũ 9,0010", () => {
  const dense = TTS_SAMPLES_NEW_48D1.filter((s) => s.regime === "numberDense");
  eq(dense.length, 1, "đúng 1 mẫu số-dày mới của D1 trong pool (X1)");
  eq(dense[0].id, "D1-X1", "mẫu số-dày mới phải là X1");
  let chars = 0;
  let secs = 0;
  for (const s of dense) {
    chars += ttsTextLength(s.text);
    secs += s.durationSec;
  }
  // Gộp C4 (519 ký tự / 57,66 s) + X1.
  const totalChars = 519 + chars;
  const totalSecs = 57.66 + secs;
  eq(totalChars, 697, "tổng ký tự số-dày gộp");
  const pooled = totalChars / totalSecs;
  const c4 = TTS_NUMBER_DENSE_47C4.charsPerSec;
  // Hằng C4 (đã sửa D1) phải khớp hệ số gộp mới trong 0,001.
  if (Math.abs(pooled - c4) > 0.001) throw new Error(`hệ số số-dày gộp có D1 (${pooled.toFixed(4)}) lệch khỏi hằng C4 ${c4} quá 0,001`);
  if (Math.abs(c4 - 9.5388) > 0.001) throw new Error(`hằng số-dày C4 phải là 9,5388 (sau sửa D1), nhận ${c4}`);
  // Ghi rõ mức lệch so với hằng C4 GỐC 9,0010: +6,0% — do Hải Đăng đọc
  // text số-dày nhanh hơn hẳn 3 giọng C4 cũ (xem LIMITS D1 §4.1).
  const old = 9.001;
  const shift = (c4 - old) / old;
  if (!(shift > 0.05 && shift < 0.07)) throw new Error(`mức lệch so với hằng gốc phải ~+6,0%, nhận ${(shift * 100).toFixed(1)}%`);
  // Mọi mẫu số-dày (C4 + X1) phải nằm trong khoảng số-dày mới.
  for (const s of dense) {
    const r = estimateTtsDurationRange47C4(s.text)!;
    inRange(s.durationSec, r.minSec, r.maxSec, `khoảng số-dày mới phải chứa mẫu D1 ${s.id} (${s.durationSec}s)`);
  }
});

test("ngưỡng mới 13%: 12% chữ số → thường, 13% → số-dày", () => {
  eq(TTS_NUMBER_DENSE_DIGIT_RATIO_47C4, 0.13, "hằng ngưỡng C4 phải là 0,13 (D1 sửa từ 0,05)");
  eq(isNumberDenseText47C4("a".repeat(88) + "1".repeat(12)), false, "12 chữ số/100 ký tự (12%) → thường");
  eq(isNumberDenseText47C4("a".repeat(87) + "1".repeat(13)), true, "13 chữ số/100 ký tự (13%) → số-dày");
});

test("phản ví dụ X2: Minh Đức đọc text 12,43% ở 8,82 — bộ phát hiện cho 'thường' nhưng thực tế chậm, NGOÀI khoảng medium", () => {
  const x2 = TTS_VOICE_DEPENDENCE_COUNTEREXAMPLE_48D1;
  eq(isNumberDenseText47C4(x2.text), false, "bộ phát hiện cho X2 là thường (12,43% < 13%)");
  const rate = ttsTextLength(x2.text) / x2.durationSec;
  inRange(rate, 8.5, 9.2, "X2 phải đọc chậm như số-dày (~8,82 ký tự/giây)");
  const r = estimateTtsDurationRange47C4(x2.text)!;
  eq(r.regime, "normal", "X2 được ước lượng theo chế độ thường (theo bộ phát hiện)");
  assert(
    !(x2.durationSec >= r.minSec && x2.durationSec <= r.maxSec),
    `khoảng medium mới [${r.minSec.toFixed(2)}, ${r.maxSec.toFixed(2)}] phải KHÔNG chứa 19,17 s của X2 — nếu chứa thì phản ví dụ sai`,
  );
  // X2 KHÔNG nằm trong pool hiệu chuẩn (không trong TTS_SAMPLES_NEW_48D1).
  assert(
    !TTS_SAMPLES_NEW_48D1.some((s) => s.id === "D1-X2"),
    "X2 không được đưa vào pool hiệu chuẩn D1",
  );
});

test("phương sai lặp: Thiền Tâm Đức spread 2,4%, Mỹ Duyên spread 11,3%", () => {
  eq(TTS_VARIANCE_48D1.length, 2, "2 lần chạy lặp giọng chậm");
  for (const run of TTS_VARIANCE_48D1) {
    const orig = TTS_NEW_VOICES_48D1.find((s) => s.id === run.repeatOf)!;
    eq(run.text, orig.text, `lần lặp ${run.id} phải cùng text với ${run.repeatOf}`);
    eq(run.voice, orig.voice, `lần lặp ${run.id} phải cùng giọng với ${run.repeatOf}`);
    eq(run.originalDurationSec, orig.durationSec, `lần lặp ${run.id} phải ghi đúng độ dài gốc`);
  }
  const tt = TTS_VARIANCE_48D1.find((r) => r.id === "D1-X3")!;
  const ttSpread = (tt.durationSec - tt.originalDurationSec) / ((tt.durationSec + tt.originalDurationSec) / 2);
  if (Math.abs(ttSpread - 0.024) > 0.002) throw new Error(`spread Thiền Tâm Đức phải ~2,4%, nhận ${(ttSpread * 100).toFixed(1)}%`);
  const md = TTS_VARIANCE_48D1.find((r) => r.id === "D1-X4")!;
  const mdSpread = (md.durationSec - md.originalDurationSec) / ((md.durationSec + md.originalDurationSec) / 2);
  if (Math.abs(mdSpread - 0.113) > 0.002) throw new Error(`spread Mỹ Duyên phải ~11,3%, nhận ${(mdSpread * 100).toFixed(1)}%`);
  assert(mdSpread > ttSpread * 3, "spread Mỹ Duyên phải lớn hơn hẳn Thiền Tâm Đức — phương sai theo giọng");
});

console.log(`\nttsEstimate48D1: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
