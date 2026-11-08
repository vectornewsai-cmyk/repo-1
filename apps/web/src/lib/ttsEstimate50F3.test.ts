/**
 * ttsEstimate50F3.test.ts — Test cho đợt 50 luồng F3 (ROUND50-F3).
 *
 * Khóa:
 * 1. ĐỎ-TRƯỚC: nối UI — TtsButton phải import + gọi helper H1
 *    (ttsDoneSuffixRange51H1, đợt 51 H1 chuyển từ F3 sang H1) và
 *    TRUYỀN voice đang chọn (clone mode → voice undefined, fallback
 *    F3). Test này ĐỎ khi TtsButton còn nối F3, XANH sau khi chuyển.
 *    Đồng thời khóa "Adam" ≠ "Adam bựa" (nay cả hai đều có hệ số
 *    riêng, khác nhau). Helper F3 vẫn tồn tại làm fallback + bản ghi
 *    lịch sử (xem ttsEstimate51H1.test.ts §1).
 * 2. Bảng hệ số: mỗi hệ số tính lại từ pool mẫu (E1/D1/C4 + F3) —
 *    normal f = tốc độ gộp trên text medium / 16,0714; dense g =
 *    tốc độ gộp trên M3 / 9,5388. PHỦ ĐỦ 25/25 preset ở cả hai chế
 *    độ (không còn null). ĐÍNH CHÍNH E1: pool Hải Đăng của E1 gộp
 *    nhầm C4-M5 của Thái Sơn — F3 loại M5 khỏi pool Hải Đăng (f
 *    1,0716 → 1,1031) và đưa M5 vào pool Thái Sơn (n = 2).
 * 3. Neo + lặp: neo A1 lệch ≤ 2,5% so với các lần đo M3 của Kim
 *    Thanh ở E1; neo A2 làm spread M4 của Hải Đăng thành 10,0%
 *    (8,40–9,28 s) nhưng mọi lần đo vẫn trong khoảng theo giọng;
 *    lặp M3 3 giọng chậm lệch ≤ 2,5% (khác hẳn spread M4 11,5%
 *    của Mỹ Duyên ở E1).
 * 4. Transfer Hải Đăng (đã đính chính): M4 gộp / medium-khác gộp =
 *    1,172 — vượt NHẸ biên 1,17 của khoảng theo giọng; B3-L1 vẫn
 *    nằm trong khoảng với f mới; f M4-only sẽ dự báo sai > 10%.
 * 5. Mọi mẫu M3/M4 đã đo đều nằm trong khoảng theo giọng của giọng
 *    đó (E1 + F3 + C4/D1 cũ).
 * 6. Ngưỡng 13% KHÔNG khóa được ngưỡng mới: đường cong tốc độ theo
 *    tỉ lệ chữ số đơn điệu giảm, trơn, phụ thuộc giọng — ở 10,22%
 *    cả 3 giọng đã chậm 84–88% quãng đường xuống dense; ở 15,96%
 *    cả 3 đọc CHẬM HƠN cả M3; bộ phân loại nhị phân 13% dự báo sai
 *    P10/P13 (khoảng normal không chứa số thật). Ngưỡng 13% giữ
 *    nguyên làm fallback; phản ví dụ X2 vẫn đứng.
 * 7. Fallback: giọng lạ / không truyền voice → số y hệt C4; mọi
 *    preset đều có hệ số riêng nên không còn fallback cho preset.
 * 8. Tốc độ tổng hợp: mọi lần đo đều < 1× realtime (median 0,44×).
 *
 * Chạy bằng esbuild bundle (quy ước đợt 45/46/47/48/49):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/ttsEstimate50F3.test.ts \
 *     --bundle --format=esm --platform=node --outfile=/tmp/tts50f3.test.mjs
 *   REPO_ROOT=$PWD node /tmp/tts50f3.test.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import {
  TTS_NUMBER_DENSE_DIGIT_RATIO_47C4,
  TTS_SAMPLES_NEW_47C4,
  estimateTtsDurationRange47C4,
  isNumberDenseText47C4,
  ttsEstimateRangeSuffix47C4,
} from "./ttsEstimate47C4";
import {
  TTS_DENSE_CROSS_HAIDANG_48D1,
  TTS_NEW_VOICES_48D1,
  TTS_STANDARD_TEXT_48D1,
  TTS_THRESHOLD_PROBES_48D1,
  TTS_VARIANCE_48D1,
  TTS_VOICE_DEPENDENCE_COUNTEREXAMPLE_48D1,
} from "./ttsEstimate48D1";
import { TTS_SAMPLES_46B3 } from "./ttsEstimate46B3";
import {
  TTS_SAMPLES_RUN1_49E1,
  TTS_SAMPLES_RUN2_49E1,
  TTS_SAMPLES_CLI_49E1,
  TTS_STANDARD_TEXT_M3_49E1,
  TTS_STANDARD_TEXT_M4_49E1,
  TTS_VOICE_COEFFICIENTS_49E1,
} from "./ttsEstimate49E1";
import {
  TTS_PROBE_TEXT_P10_50F3,
  TTS_PROBE_TEXT_P13_50F3,
  TTS_PROBE_TEXT_P16_50F3,
  TTS_SAMPLES_50F3,
  TTS_STANDARD_TEXT_M3_50F3,
  TTS_STANDARD_TEXT_M4_50F3,
  TTS_SYNTH_META_50F3,
  TTS_SYNTH_SPEED_50F3,
  TTS_VOICE_COEFFICIENTS_50F3,
  estimateTtsDurationRange50F3,
  ttsDoneSuffixRange50F3,
  ttsEstimateRangeSuffix50F3,
  ttsVoiceCoefficient50F3,
} from "./ttsEstimate50F3";
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

/** Đọc source TtsButton.tsx từ repo root (như test B3 §4 / D1 §1 / E1 §1). */
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

/** Tốc độ gộp (tổng ký tự / tổng giây) của một giọng trên 1 text chuẩn. */
function pooledRate(durations: number[], chars: number): number {
  return (chars * durations.length) / durations.reduce((a, b) => a + b, 0);
}

/** Tốc độ (ký tự/giây) của một mẫu thăm dò F3. */
function probeRate(id: string): number {
  const s = TTS_SAMPLES_50F3.find((x) => x.id === id)!;
  return ttsTextLength(s.text) / s.durationSec;
}

// ---------------------------------------------------------------------------
// 1. ĐỎ-TRƯỚC: nối UI — TtsButton phải dùng helper F3 + truyền voice
// ---------------------------------------------------------------------------

test("nối UI (đỏ-trước): TtsButton import + gọi helper H1 với voice đang chọn, không dùng F3/E1/C4/B3", () => {
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
    code.includes("ROUND51-H1"),
    "TtsButton phải đánh dấu comment ROUND51-H1 ở chỗ nối helper H1",
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
  assert(!code.includes("18.4"), "TtsButton không được hardcode hệ số 18,4");
});

// ---------------------------------------------------------------------------
// 2. Text chuẩn M3/M4 + thăm dò P10/P13/P16
// ---------------------------------------------------------------------------

test("text chuẩn: M3 178 ký tự / 24 chữ số, M4 169 ký tự / 0 chữ số; P10/P13/P16 đúng tỉ lệ", () => {
  eq(ttsTextLength(TTS_STANDARD_TEXT_M3_50F3), 178, "M3 đúng 178 ký tự");
  eq(ttsTextLength(TTS_STANDARD_TEXT_M4_50F3), 169, "M4 đúng 169 ký tự");
  eq((TTS_STANDARD_TEXT_M3_50F3.match(/[0-9]/g) ?? []).length, 24, "M3 có 24 chữ số (13,48%)");
  eq((TTS_STANDARD_TEXT_M4_50F3.match(/[0-9]/g) ?? []).length, 0, "M4 có 0 chữ số");
  eq(TTS_STANDARD_TEXT_M3_50F3, TTS_STANDARD_TEXT_M3_49E1, "M3 F3 phải trùng text M3 E1");
  eq(TTS_STANDARD_TEXT_M4_50F3, TTS_STANDARD_TEXT_M4_49E1, "M4 F3 phải trùng text M4 E1");
  eq(TTS_STANDARD_TEXT_M4_50F3, TTS_STANDARD_TEXT_48D1, "M4 F3 phải trùng text chuẩn D1");
  // Thăm dò ngưỡng.
  eq(ttsTextLength(TTS_PROBE_TEXT_P10_50F3), 186, "P10 đúng 186 ký tự");
  eq((TTS_PROBE_TEXT_P10_50F3.match(/[0-9]/g) ?? []).length, 19, "P10 có 19 chữ số (10,22%)");
  eq(ttsTextLength(TTS_PROBE_TEXT_P13_50F3), 169, "P13 đúng 169 ký tự");
  eq((TTS_PROBE_TEXT_P13_50F3.match(/[0-9]/g) ?? []).length, 21, "P13 có 21 chữ số (12,43%)");
  eq(ttsTextLength(TTS_PROBE_TEXT_P16_50F3), 188, "P16 đúng 188 ký tự");
  eq((TTS_PROBE_TEXT_P16_50F3.match(/[0-9]/g) ?? []).length, 30, "P16 có 30 chữ số (15,96%)");
  // P13 tái dùng đúng text D1-T13 (để so chéo giọng với Hải Đăng/Minh Đức đã đo).
  const t13 = TTS_THRESHOLD_PROBES_48D1.find((p) => p.id === "D1-T13")!;
  eq(TTS_PROBE_TEXT_P13_50F3, t13.text, "P13 F3 phải trùng text D1-T13");
  // digitRatio ghi trong mẫu phải khớp tỉ lệ tính lại từ text.
  for (const s of TTS_SAMPLES_50F3) {
    const digits = (s.text.match(/[0-9]/g) ?? []).length;
    approx(digits / ttsTextLength(s.text), s.digitRatio, 0.001, `digitRatio mẫu ${s.id} phải khớp text`);
  }
  eq(TTS_SAMPLES_50F3.length, 44, "đủ 44 mẫu F3 (2 neo + 22 M3 + 11 M4 + 9 thăm dò)");
});

// ---------------------------------------------------------------------------
// 3. Bảng hệ số: tính lại từ pool mẫu (25/25 cả hai chế độ + đính chính E1)
// ---------------------------------------------------------------------------

test("bảng hệ số normal: f mỗi giọng = tốc độ gộp trên text medium / 16,0714 (phủ đủ 25/25)", () => {
  // Gộp mọi lần đo medium normal của từng giọng: D1 (7 giọng M4 + lặp
  // X3/X4) + C4 (Thùy Dung M4, Thái Sơn M5) + E1 lần 1 + lần 2 + CLI
  // (M4) + F3 (neo A2 + W01–W11 M4). Hải Đăng: gộp thêm T2/T4/T5
  // (thăm dò ít số ≤ 5,08%) — NHƯNG KHÔNG gộp C4-M5 (đính chính E1).
  const m4Runs: Record<string, number[]> = {};
  const add = (voice: string, dur: number) => {
    (m4Runs[voice] ??= []).push(dur);
  };
  for (const s of TTS_NEW_VOICES_48D1) add(s.voice, s.durationSec);
  add("Thùy Dung", TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M4")!.durationSec);
  add("Thiền Tâm Đức", TTS_VARIANCE_48D1.find((r) => r.id === "D1-X3")!.durationSec);
  add("Mỹ Duyên", TTS_VARIANCE_48D1.find((r) => r.id === "D1-X4")!.durationSec);
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.textId === "M4") add(s.voice, s.durationSec);
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.textId === "M4") add(s.voice, s.durationSec);
  }
  for (const s of TTS_SAMPLES_50F3) {
    if (s.textId === "M4") add(s.voice, s.durationSec);
  }
  eq(Object.keys(m4Runs).length, 25, "25 giọng có số M4 (Thái Sơn: W01 M4 + C4-M5 gộp riêng — xem test riêng dưới)");
  for (const row of TTS_VOICE_COEFFICIENTS_50F3) {
    if (row.voice === "Hải Đăng" || row.voice === "Thái Sơn") continue; // ngoại lệ — test riêng dưới
    const runs = m4Runs[row.voice];
    assert(runs && runs.length === row.normalN, `giọng ${row.voice} phải có n = ${row.normalN} lần đo M4, nhận ${runs?.length}`);
    const recomputed = pooledRate(runs, 169) / 16.0714;
    approx(recomputed, row.normalCoefficient, 0.001, `hệ số normal của ${row.voice} tính lại từ pool M4`);
  }
  // Thái Sơn: pool = C4-M5 (190 ký tự, 11,68 s) + F3-W01 M4 (169 ký tự, 10,72 s).
  const ts = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === "Thái Sơn")!;
  eq(ts.normalN, 2, "Thái Sơn có n = 2 mẫu medium normal (C4-M5 + F3-W01)");
  const m5 = TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M5")!;
  eq(m5.voice, "Thái Sơn", "C4-M5 là mẫu của Thái Sơn (không phải Hải Đăng) — cơ sở đính chính E1");
  approx((190 + 169) / (m5.durationSec + 10.72) / 16.0714, ts.normalCoefficient, 0.001, "hệ số normal của Thái Sơn tính lại từ pool M5 + W01");
  approx((190 + 169) / (m5.durationSec + 10.72), 16.0268, 0.001, "tốc độ gộp medium của Thái Sơn phải là 16,0268");
  // M5-only (16,27) vs M4-only (15,77) lệch 3,1% — gộp hai text medium là hợp lý.
  approx(190 / m5.durationSec, 16.266, 0.01, "tốc độ M5-only của Thái Sơn phải là ~16,27");
  approx(169 / 10.72, 15.765, 0.01, "tốc độ M4-only của Thái Sơn phải là ~15,77");
});

test("đính chính E1: pool Hải Đăng LOẠI C4-M5 — f mới 1,1031 (E1: 1,0716 do gộp nhầm)", () => {
  // Pool nhiễm của E1 tính lại: M4 ×3 + T2/T4/T5 + C4-M5 = 1262 ký tự /
  // 73,28 s = 17,2221 ≈ 17,2216 trong sai số ±0,001 — xác nhận chẩn đoán.
  const m5 = TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M5")!;
  let charsBad = 0;
  let secsBad = 0;
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") { charsBad += 169; secsBad += s.durationSec; }
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") { charsBad += 169; secsBad += s.durationSec; }
  }
  for (const s of TTS_THRESHOLD_PROBES_48D1.filter((p) => p.digitRatio <= 0.051)) { charsBad += ttsTextLength(s.text); secsBad += s.durationSec; }
  charsBad += ttsTextLength(m5.text);
  secsBad += m5.durationSec;
  approx(charsBad / secsBad, 17.2216, 0.001, "pool nhiễm E1 (gồm C4-M5) tính lại phải là 17,2216");
  // Pool đúng (không M5, thêm neo A2): 1241 ký tự / 70,00 s = 17,7286.
  const hd = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === "Hải Đăng")!;
  eq(hd.normalN, 7, "Hải Đăng có n = 7 mẫu medium normal (3 M4 E1 + 1 CLI + 1 neo A2 + T2/T4/T5)");
  let chars = 0;
  let secs = 0;
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") { chars += 169; secs += s.durationSec; }
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") { chars += 169; secs += s.durationSec; }
  }
  for (const s of TTS_SAMPLES_50F3) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") { chars += 169; secs += s.durationSec; }
  }
  for (const s of TTS_THRESHOLD_PROBES_48D1.filter((p) => p.digitRatio <= 0.051)) { chars += ttsTextLength(s.text); secs += s.durationSec; }
  eq(chars, 1241, "pool Hải Đăng đúng có 1241 ký tự");
  approx(secs, 70.0, 0.01, "pool Hải Đăng đúng có 70,00 giây");
  approx(chars / secs / 16.0714, hd.normalCoefficient, 0.001, "hệ số normal của Hải Đăng tính lại từ pool đã đính chính");
  approx(chars / secs, 17.7286, 0.001, "tốc độ gộp medium của Hải Đăng (đã đính chính) phải là 17,7286");
  // Hệ số E1 cũ khác hẳn hệ số F3 mới (không phải sai số làm tròn).
  const e1hd = TTS_VOICE_COEFFICIENTS_49E1.find((r) => r.voice === "Hải Đăng")!;
  approx(e1hd.normalCoefficient, 1.0716, 0.001, "hệ số E1 cũ của Hải Đăng là 1,0716");
  assert(Math.abs(hd.normalCoefficient - e1hd.normalCoefficient) > 0.01, "hệ số F3 của Hải Đăng phải khác rõ hệ số E1 (đính chính, không phải làm tròn)");
});

test("bảng hệ số dense: g mỗi giọng = tốc độ gộp trên M3 / 9,5388; phủ đủ 25/25, không còn null", () => {
  const m3Runs: Record<string, number[]> = {};
  const add = (voice: string, dur: number) => {
    (m3Runs[voice] ??= []).push(dur);
  };
  add("Minh Đức", TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M3")!.durationSec);
  add("Hải Đăng", TTS_DENSE_CROSS_HAIDANG_48D1.durationSec);
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.textId === "M3") add(s.voice, s.durationSec);
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.textId === "M3") add(s.voice, s.durationSec);
  }
  for (const s of TTS_SAMPLES_50F3) {
    if (s.textId === "M3") add(s.voice, s.durationSec);
  }
  eq(Object.keys(m3Runs).length, 25, "đúng 25 giọng có số M3 (E1 chỉ có 6)");
  eq(TTS_VOICE_COEFFICIENTS_50F3.length, 25, "bảng F3 có đúng 25 dòng");
  for (const row of TTS_VOICE_COEFFICIENTS_50F3) {
    const runs = m3Runs[row.voice];
    assert(runs && runs.length === row.denseN, `giọng ${row.voice} phải có n = ${row.denseN} lần đo M3, nhận ${runs?.length}`);
    const recomputed = pooledRate(runs, 178) / 9.5388;
    approx(recomputed, row.denseCoefficient, 0.001, `hệ số dense của ${row.voice} tính lại từ pool M3`);
    assert(row.normalCoefficient > 0 && row.denseCoefficient > 0, `giọng ${row.voice} phải có cả hai hệ số (không null)`);
  }
  // Tỉ lệ dense/normal dao động 0,619–0,686 — không phải hằng số, nên
  // KHÔNG được suy dense từ hệ số normal (quy tắc giữ từ E1).
  let minRatio = Infinity;
  let maxRatio = -Infinity;
  for (const row of TTS_VOICE_COEFFICIENTS_50F3) {
    const ratio = (row.denseCoefficient * 9.5388) / (row.normalCoefficient * 16.0714);
    if (ratio < minRatio) minRatio = ratio;
    if (ratio > maxRatio) maxRatio = ratio;
  }
  approx(minRatio, 0.598, 0.002, "tỉ lệ dense/normal nhỏ nhất phải ~0,598 (Ngọc Trân)");
  approx(maxRatio, 0.686, 0.002, "tỉ lệ dense/normal lớn nhất phải ~0,686 (Đức Trí)");
  assert(maxRatio - minRatio > 0.05, "tỉ lệ dense/normal phải dao động rõ (không phải hằng số)");
  // Tốc độ dense chênh nhau 7,78 → 13,09 (68%) — hệ số dense riêng là bắt buộc.
  const denseRates = TTS_VOICE_COEFFICIENTS_50F3.map((r) => r.denseCoefficient * 9.5388);
  approx(Math.min(...denseRates), 7.7831, 0.001, "dense chậm nhất (Kim Thanh) phải là 7,7831");
  approx(Math.max(...denseRates), 13.0882, 0.001, "dense nhanh nhất (Trúc Ly) phải là 13,0882");
});

// ---------------------------------------------------------------------------
// 4. Neo kiểm chứng driver + lặp giọng chậm
// ---------------------------------------------------------------------------

test("neo A1: Kim Thanh M3 22,53 s lệch ≤ 2,5% so với mọi lần đo E1 (22,92/23,03/23,00)", () => {
  const a1 = TTS_SAMPLES_50F3.find((s) => s.id === "F3-A1")!;
  eq(a1.voice, "Kim Thanh", "neo A1 là Kim Thanh M3");
  for (const d of [22.92, 23.03, 23.0]) {
    const dev = Math.abs(a1.durationSec - d) / d;
    assert(dev <= 0.025, `neo A1 lệch so với lần đo E1 ${d}s phải ≤ 2,5%, nhận ${(dev * 100).toFixed(1)}%`);
  }
  // Neo A1 gộp vào pool dense Kim Thanh: n = 4, tốc độ 7,7831.
  const kt = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === "Kim Thanh")!;
  eq(kt.denseN, 4, "Kim Thanh có n = 4 lần đo M3 (E1 ×3 + neo A1)");
  approx(pooledRate([23.0, 22.92, 23.03, 22.53], 178) / 9.5388, kt.denseCoefficient, 0.001, "hệ số dense Kim Thanh tính lại với neo A1");
});

test("neo A2: Hải Đăng M4 8,40 s — spread M4 thành 10,0% nhưng mọi lần đo vẫn trong khoảng theo giọng", () => {
  const a2 = TTS_SAMPLES_50F3.find((s) => s.id === "F3-A2")!;
  eq(a2.voice, "Hải Đăng", "neo A2 là Hải Đăng M4");
  const m4Runs = [8.64, 9.28, 9.04, a2.durationSec];
  const mean = m4Runs.reduce((a, b) => a + b, 0) / m4Runs.length;
  approx(mean, 8.84, 0.01, "trung bình 4 lần đo M4 của Hải Đăng phải là 8,84 s");
  const spread = (Math.max(...m4Runs) - Math.min(...m4Runs)) / mean;
  approx(spread, 0.1, 0.002, "spread M4 Hải Đăng nay là 10,0% (lớn hơn mức tối đa 7,1% của E1)");
  const r = estimateTtsDurationRange50F3(TTS_STANDARD_TEXT_M4_50F3, "Hải Đăng")!;
  for (const d of m4Runs) inRange(d, r.minSec, r.maxSec, `khoảng theo giọng Hải Đăng phải chứa lần đo M4 ${d}s`);
});

test("lặp M3 giọng chậm: 3 cặp lệch ≤ 2,5% — phương sai nhỏ, khác spread M4 11,5% của Mỹ Duyên", () => {
  const pairs: Array<[string, string]> = [
    ["F3-V01", "F3-V01b"],
    ["F3-V02", "F3-V02b"],
    ["F3-V03", "F3-V03b"],
  ];
  for (const [aId, bId] of pairs) {
    const a = TTS_SAMPLES_50F3.find((s) => s.id === aId)!;
    const b = TTS_SAMPLES_50F3.find((s) => s.id === bId)!;
    eq(a.voice, b.voice, `cặp ${aId}/${bId} phải cùng giọng`);
    const dev = Math.abs(a.durationSec - b.durationSec) / ((a.durationSec + b.durationSec) / 2);
    assert(dev <= 0.025, `cặp lặp ${aId}/${bId} lệch phải ≤ 2,5%, nhận ${(dev * 100).toFixed(1)}%`);
  }
  approx(Math.abs(20.07 - 20.53) / 20.3, 0.0227, 0.001, "Mỹ Duyên M3 lặp lệch ~2,3%");
  approx(Math.abs(21.61 - 21.1) / 21.355, 0.0239, 0.001, "Thiền Tâm Đức M3 lặp lệch ~2,4%");
  approx(Math.abs(17.48 - 17.71) / 17.595, 0.0131, 0.001, "Thục Đoan M3 lặp lệch ~1,3%");
});

// ---------------------------------------------------------------------------
// 5. Hải Đăng: transfer đã đính chính 1,172 + kiểm chứng tầng long
// ---------------------------------------------------------------------------

test("Hải Đăng: transfer M4/medium-khác = 1,172 (vượt nhẹ biên 1,17) nhưng B3-L1 vẫn trong khoảng", () => {
  const m4Runs: number[] = [];
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") m4Runs.push(s.durationSec);
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") m4Runs.push(s.durationSec);
  }
  for (const s of TTS_SAMPLES_50F3) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") m4Runs.push(s.durationSec);
  }
  eq(m4Runs.length, 4, "Hải Đăng có 4 lần đo M4 (E1 ×2 + CLI ×1 + neo A2)");
  approx(pooledRate(m4Runs, 169), 19.1174, 0.001, "tốc độ gộp M4 của Hải Đăng phải là 19,1174");
  let chars = 0;
  let secs = 0;
  for (const s of TTS_THRESHOLD_PROBES_48D1.filter((p) => p.digitRatio <= 0.051)) { chars += ttsTextLength(s.text); secs += s.durationSec; }
  approx(chars / secs, 16.311, 0.001, "tốc độ gộp medium-khác của Hải Đăng phải là 16,3110");
  approx(19.1174 / 16.311, 1.1721, 0.001, "tỉ lệ transfer M4/medium-khác phải là 1,1721");
  assert(19.1174 / 16.311 > 1.17, "transfer 1,172 VƯỢT NHẸ biên 1,17 — biên dư cho transfer đã hết (ghi rõ, không giấu)");
  // f M4-only (19,1174/16,0714 = 1,1895) sẽ DỰ BÁO SAI text long B3-L1.
  const b3l1 = TTS_SAMPLES_46B3.find((s) => s.id === "B3-L1")!;
  eq(b3l1.voice, "Hải Đăng", "B3-L1 là text long của Hải Đăng");
  const centerM4only = ttsTextLength(b3l1.text) / (18.6116 * (19.1174 / 16.0714));
  const devM4only = Math.abs(centerM4only - b3l1.durationSec) / b3l1.durationSec;
  assert(devM4only > 0.1, `f M4-only phải dự báo B3-L1 lệch > 10% (nhận ${(devM4only * 100).toFixed(1)}%)`);
  // Với f gộp mọi medium đã đính chính (1,1031), khoảng theo giọng CHỨA 17,04 s.
  const r = estimateTtsDurationRange50F3(b3l1.text, "Hải Đăng")!;
  eq(r.perVoice, true, "B3-L1 với Hải Đăng phải dùng hệ số theo giọng");
  inRange(b3l1.durationSec, r.minSec, r.maxSec, "khoảng theo giọng (f gộp mọi medium, đã đính chính) phải chứa B3-L1 17,04 s");
});

// ---------------------------------------------------------------------------
// 6. Mọi mẫu M3/M4 trong khoảng theo giọng + ngưỡng 13% phân loại sai P10/P13
// ---------------------------------------------------------------------------

test("mọi mẫu M3/M4 đã đo đều nằm trong khoảng theo giọng F3 của giọng đó", () => {
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1, ...TTS_SAMPLES_CLI_49E1]) {
    const text = s.textId === "M3" ? TTS_STANDARD_TEXT_M3_50F3 : TTS_STANDARD_TEXT_M4_50F3;
    const r = estimateTtsDurationRange50F3(text, s.voice)!;
    assert(r.perVoice, `mẫu E1 ${s.id} (${s.voice}, ${s.textId}) phải dùng hệ số theo giọng F3`);
    inRange(s.durationSec, r.minSec, r.maxSec, `khoảng F3 phải chứa mẫu E1 ${s.id} (${s.durationSec}s)`);
  }
  for (const s of TTS_SAMPLES_50F3.filter((x) => x.textId === "M3" || x.textId === "M4")) {
    const text = s.textId === "M3" ? TTS_STANDARD_TEXT_M3_50F3 : TTS_STANDARD_TEXT_M4_50F3;
    const r = estimateTtsDurationRange50F3(text, s.voice)!;
    assert(r.perVoice, `mẫu F3 ${s.id} (${s.voice}, ${s.textId}) phải dùng hệ số theo giọng`);
    inRange(s.durationSec, r.minSec, r.maxSec, `khoảng F3 phải chứa mẫu ${s.id} (${s.durationSec}s)`);
  }
  // Cả mẫu C4/D1 cũ (Minh Đức M3, Hải Đăng X1, 7 giọng D1, Thùy Dung M4).
  const legacy: Array<{ text: string; voice: string; dur: number; id: string }> = [
    { text: TTS_STANDARD_TEXT_M3_50F3, voice: "Minh Đức", dur: 19.99, id: "C4-M3" },
    { text: TTS_STANDARD_TEXT_M3_50F3, voice: "Hải Đăng", dur: 15.41, id: "D1-X1" },
    { text: TTS_STANDARD_TEXT_M4_50F3, voice: "Thùy Dung", dur: 9.36, id: "C4-M4" },
    ...TTS_NEW_VOICES_48D1.map((s) => ({ text: TTS_STANDARD_TEXT_M4_50F3, voice: s.voice, dur: s.durationSec, id: s.id })),
  ];
  for (const s of legacy) {
    const r = estimateTtsDurationRange50F3(s.text, s.voice)!;
    inRange(s.dur, r.minSec, r.maxSec, `khoảng F3 phải chứa mẫu cũ ${s.id} (${s.dur}s)`);
  }
});

test("đường cong ngưỡng: tốc độ đơn điệu giảm theo tỉ lệ chữ số, không có bước nhảy ở 13%", () => {
  // Với mỗi giọng thăm dò: normal > P10 > P13 > M3 > P16 (tốc độ giảm dần, nghiêm ngặt).
  for (const voice of ["Kim Thanh", "Đức Trí", "Quỳnh Anh"]) {
    const row = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === voice)!;
    const normalRate = row.normalCoefficient * 16.0714;
    const denseRate = row.denseCoefficient * 9.5388;
    const p10 = probeRate(`F3-P10-${voice === "Kim Thanh" ? "KT" : voice === "Đức Trí" ? "DT" : "QA"}`);
    const p13 = probeRate(`F3-P13-${voice === "Kim Thanh" ? "KT" : voice === "Đức Trí" ? "DT" : "QA"}`);
    const p16 = probeRate(`F3-P16-${voice === "Kim Thanh" ? "KT" : voice === "Đức Trí" ? "DT" : "QA"}`);
    assert(normalRate > p10, `${voice}: tốc độ normal (${normalRate.toFixed(2)}) phải > P10 (${p10.toFixed(2)})`);
    assert(p10 > p13, `${voice}: tốc độ P10 (${p10.toFixed(2)}) phải > P13 (${p13.toFixed(2)})`);
    assert(p13 > denseRate, `${voice}: tốc độ P13 (${p13.toFixed(2)}) phải > M3 gộp (${denseRate.toFixed(2)})`);
    assert(denseRate > p16, `${voice}: tốc độ M3 gộp (${denseRate.toFixed(2)}) phải > P16 (${p16.toFixed(2)}) — P16 đọc CHẬM HƠN cả M3`);
    // Ở 10,22%, giọng đã chậm 84–88% quãng đường từ normal xuống dense.
    const frac = (normalRate - p10) / (normalRate - denseRate);
    inRange(frac, 0.8, 0.92, `${voice}: ở P10 (10,22%) phải chậm 80–92% quãng đường xuống dense, nhận ${(frac * 100).toFixed(0)}%`);
  }
  // Số tuyệt đối khóa lại (tránh tính nhầm tỉ lệ trong test trên).
  approx(probeRate("F3-P10-KT"), 8.54, 0.01, "Kim Thanh P10 phải là 8,54 ký tự/giây");
  approx(probeRate("F3-P13-KT"), 8.13, 0.01, "Kim Thanh P13 phải là 8,13 ký tự/giây");
  approx(probeRate("F3-P16-KT"), 7.09, 0.01, "Kim Thanh P16 phải là 7,09 ký tự/giây");
  approx(probeRate("F3-P10-DT"), 8.82, 0.01, "Đức Trí P10 phải là 8,82 ký tự/giây");
  approx(probeRate("F3-P16-DT"), 7.5, 0.01, "Đức Trí P16 phải là 7,50 ký tự/giây");
  approx(probeRate("F3-P10-QA"), 11.06, 0.01, "Quỳnh Anh P10 phải là 11,06 ký tự/giây");
  approx(probeRate("F3-P16-QA"), 9.46, 0.01, "Quỳnh Anh P16 phải là 9,46 ký tự/giây");
});

test("ngưỡng 13% phân loại SAI P10/P13 thành 'thường' — khoảng normal không chứa số thật", () => {
  // P10 (10,22%) và P13 (12,43%) đều < ngưỡng 13% → helper phân loại
  // "thường", nhưng giọng đọc gần như chậm hẳn (xem test đường cong trên).
  for (const [text, voice, actual, id] of [
    [TTS_PROBE_TEXT_P10_50F3, "Kim Thanh", 21.77, "F3-P10-KT"],
    [TTS_PROBE_TEXT_P10_50F3, "Đức Trí", 21.08, "F3-P10-DT"],
    [TTS_PROBE_TEXT_P10_50F3, "Quỳnh Anh", 16.82, "F3-P10-QA"],
    [TTS_PROBE_TEXT_P13_50F3, "Kim Thanh", 20.79, "F3-P13-KT"],
    [TTS_PROBE_TEXT_P13_50F3, "Đức Trí", 20.35, "F3-P13-DT"],
    [TTS_PROBE_TEXT_P13_50F3, "Quỳnh Anh", 16.06, "F3-P13-QA"],
  ] as const) {
    const r = estimateTtsDurationRange50F3(text, voice)!;
    eq(r.regime, "normal", `mẫu ${id} (tỉ lệ < 13%) phải bị phân loại 'thường' theo ngưỡng hiện tại`);
    assert(
      !(actual >= r.minSec && actual <= r.maxSec),
      `khoảng normal F3 [${r.minSec.toFixed(1)}, ${r.maxSec.toFixed(1)}] phải KHÔNG chứa ${actual}s thật của ${id} — bằng chứng ngưỡng 13% sai`,
    );
  }
  // Phản ví dụ X2 (D1) vẫn đứng: Minh Đức đọc T13 (12,43%) ở 8,82 ký tự/giây.
  const x2 = TTS_VOICE_DEPENDENCE_COUNTEREXAMPLE_48D1;
  eq(x2.durationSec, 19.17, "X2: Minh Đức đọc T13 trong 19,17 s");
  const rX2 = estimateTtsDurationRange50F3(x2.text, "Minh Đức")!;
  eq(rX2.regime, "normal", "X2 vẫn bị phân loại 'thường' theo ngưỡng 13%");
  assert(
    !(x2.durationSec >= rX2.minSec && x2.durationSec <= rX2.maxSec),
    `khoảng normal F3 phải KHÔNG chứa X2 19,17 s — phản ví dụ vẫn đứng`,
  );
  // Ngưỡng 13% GIỮ NGUYÊN làm fallback (không khóa ngưỡng mới).
  eq(TTS_NUMBER_DENSE_DIGIT_RATIO_47C4, 0.13, "hằng ngưỡng C4 vẫn là 0,13");
  eq(isNumberDenseText47C4(TTS_STANDARD_TEXT_M3_50F3), true, "M3 (13,48%) → số-dày");
  eq(isNumberDenseText47C4(TTS_STANDARD_TEXT_M4_50F3), false, "M4 (0%) → thường");
  eq(isNumberDenseText47C4(TTS_PROBE_TEXT_P10_50F3), false, "P10 (10,22%) → thường theo ngưỡng (dù đọc gần như dense)");
  eq(isNumberDenseText47C4(TTS_PROBE_TEXT_P16_50F3), true, "P16 (15,96%) → số-dày");
});

// ---------------------------------------------------------------------------
// 7. Fallback: không còn preset nào fallback; giọng lạ → y hệt C4
// ---------------------------------------------------------------------------

test("fallback: mọi preset đều có hệ số riêng; giọng lạ / không truyền voice → y hệt C4", () => {
  for (const row of TTS_VOICE_COEFFICIENTS_50F3) {
    assert(ttsVoiceCoefficient50F3(row.voice, "normal") !== null, `giọng ${row.voice} phải có hệ số normal`);
    assert(ttsVoiceCoefficient50F3(row.voice, "numberDense") !== null, `giọng ${row.voice} phải có hệ số dense`);
    const rN = estimateTtsDurationRange50F3(TTS_STANDARD_TEXT_M4_50F3, row.voice)!;
    const rD = estimateTtsDurationRange50F3(TTS_STANDARD_TEXT_M3_50F3, row.voice)!;
    eq(rN.perVoice, true, `M4 với giọng ${row.voice} phải dùng hệ số theo giọng`);
    eq(rD.perVoice, true, `M3 với giọng ${row.voice} phải dùng hệ số theo giọng`);
  }
  const texts = [TTS_STANDARD_TEXT_M4_50F3, TTS_STANDARD_TEXT_M3_50F3, "Xin chào Việt Nam, đây là một câu kiểm tra tốc độ đọc."];
  for (const voice of [undefined, "", "Giọng Không Tồn Tại"]) {
    for (const text of texts) {
      const a = estimateTtsDurationRange50F3(text, voice);
      const b = estimateTtsDurationRange47C4(text);
      eq(JSON.stringify(a === null ? null : { tier: a.tier, regime: a.regime, seconds: a.seconds, minSec: a.minSec, maxSec: a.maxSec }),
        JSON.stringify(b === null ? null : { tier: b.tier, regime: b.regime, seconds: b.seconds, minSec: b.minSec, maxSec: b.maxSec }),
        `fallback cho voice ${JSON.stringify(voice)} phải y hệt C4`);
      if (a !== null) {
        eq(a.perVoice, false, "fallback thì perVoice = false");
        eq(a.coefficient, null, "fallback thì coefficient = null");
      }
    }
  }
  // "Adam" ≠ "Adam bựa" — nay cả hai đều có hệ số riêng, khác nhau rõ.
  approx(ttsVoiceCoefficient50F3("Adam", "normal") ?? 0, 1.1235, 0.001, "'Adam' có hệ số normal 1,1235");
  approx(ttsVoiceCoefficient50F3("Adam", "numberDense") ?? 0, 1.2374, 0.001, "'Adam' có hệ số dense 1,2374");
  approx(ttsVoiceCoefficient50F3("Adam bựa", "normal") ?? 0, 0.9773, 0.001, "'Adam bựa' có hệ số normal 0,9773");
  approx(ttsVoiceCoefficient50F3("Adam bựa", "numberDense") ?? 0, 1.1286, 0.001, "'Adam bựa' có hệ số dense 1,1286");
  assert(ttsVoiceCoefficient50F3("Adam", "normal") !== ttsVoiceCoefficient50F3("Adam bựa", "normal"), "'Adam' và 'Adam bựa' phải khác hệ số normal");
});

test("helper F3: text rỗng → null/''; header thật thắng ước lượng; hậu tố khoảng đúng dạng", () => {
  eq(estimateTtsDurationRange50F3("", "Hải Đăng"), null, "text rỗng → null");
  eq(ttsEstimateRangeSuffix50F3("", "Hải Đăng"), "", "text rỗng → hậu tố ''");
  eq(ttsDoneSuffixRange50F3({ headerValue: "12.34", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Đức Trí" }), " (12.3s)", "header thật thắng ước lượng theo giọng");
  eq(ttsDoneSuffixRange50F3({ headerValue: null, text: "", voice: "Hải Đăng" }), "", "text rỗng + header thiếu → ''");
  // Hậu tố theo giọng cho Trúc Ly M4: tâm 169/19,5602 = 8,64 s;
  // ×[0,83, 1,17] → [7,2, 10,1] — chứa lần đo thật 8,64 s.
  eq(ttsEstimateRangeSuffix50F3(TTS_STANDARD_TEXT_M4_50F3, "Trúc Ly"), " (≈7.2–10.1s)", "hậu tố theo giọng Trúc Ly M4");
  // Hậu tố theo giọng cho Kim Thanh M3 (hệ số dense mới 0,8159):
  // tâm 178/7,7831 = 22,87 s; ×[0,83, 1,17] → [19,0, 26,8].
  eq(ttsEstimateRangeSuffix50F3(TTS_STANDARD_TEXT_M3_50F3, "Kim Thanh"), " (≈19.0–26.8s)", "hậu tố theo giọng Kim Thanh M3");
  // Hậu tố cho Quốc Tuấn M4 (giọng mới): tâm 169/18,8616 = 8,96 s → [7,4, 10,5].
  eq(ttsEstimateRangeSuffix50F3(TTS_STANDARD_TEXT_M4_50F3, "Quốc Tuấn"), " (≈7.4–10.5s)", "hậu tố theo giọng Quốc Tuấn M4");
  // Hậu tố gộp C4 (đối chiếu) — Đức Trí M4 thực 14,00 s vẫn ngoài khoảng gộp.
  eq(ttsEstimateRangeSuffix47C4(TTS_STANDARD_TEXT_M4_50F3), " (≈8.8–13.5s)", "hậu tố gộp C4 cho M4 (đối chiếu — KHÔNG chứa 14,00 s)");
  eq(ttsEstimateRangeSuffix50F3(TTS_STANDARD_TEXT_M4_50F3, "Đức Trí"), " (≈11.7–16.5s)", "hậu tố theo giọng Đức Trí M4 (giữ từ E1)");
});

// ---------------------------------------------------------------------------
// 8. Tốc độ tổng hợp
// ---------------------------------------------------------------------------

test("tốc độ tổng hợp: 44 lần đo đều < 1× realtime (median 0,44×)", () => {
  eq(TTS_SYNTH_SPEED_50F3.length, 44, "44 lần đo tốc độ tổng hợp (driver F3)");
  const ratios = TTS_SYNTH_SPEED_50F3.map((s) => s.audioSec / s.synthSec);
  for (const r of ratios) {
    assert(r > 0 && r < 1.0, `mọi tỉ lệ audio/synth phải < 1× realtime, nhận ${r.toFixed(2)}`);
  }
  const sorted = [...ratios].sort((a, b) => a - b);
  approx(sorted[0], 0.17, 0.01, "tỉ lệ chậm nhất phải ~0,17× (Đức Trí P10, máy đang tải)");
  approx(sorted[sorted.length - 1], 0.75, 0.01, "tỉ lệ nhanh nhất phải ~0,75× (Mỹ Duyên M3)");
  const median = (sorted[21] + sorted[22]) / 2;
  approx(median, 0.44, 0.02, "median tốc độ tổng hợp phải ~0,44×");
  const totalSynth = TTS_SYNTH_SPEED_50F3.reduce((a, s) => a + s.synthSec, 0);
  approx(totalSynth, 1886.1, 0.5, "tổng thời gian synth 44 mẫu phải là 1886,1 s");
  approx(TTS_SYNTH_META_50F3.loadSecRun1, 12.5, 0.5, "nạp model ~12,5 s");
  approx(TTS_SYNTH_META_50F3.warmupSecRun1, 7.8, 0.5, "warmup infer ~7,8 s (chậm hơn E1 do máy tải)");
});

console.log(`\nttsEstimate50F3: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
