/**
 * ttsEstimate49E1.test.ts — Test cho đợt 49 luồng E1 (ROUND49-E1).
 *
 * Khóa:
 * 1. ĐỎ-TRƯỚC (ĐỢT 51 H1 — đã chuyển): nối UI — TtsButton phải import
 *    + gọi helper H1 (ttsDoneSuffixRange51H1) với voice đang chọn,
 *    không còn dùng helper F3 cho hậu tố toast. Test này ĐỎ khi
 *    TtsButton còn nối F3 (trạng thái trước luồng H1), XANH sau khi
 *    chuyển (xem ttsEstimate51H1.test.ts §1).
 * 2. Bảng hệ số theo giọng: mỗi hệ số tính lại từ pool mẫu (lần 1 +
 *    lần 2 + CLI + C4/D1) — normal f = tốc độ gộp của giọng trên text
 *    medium / 16,0714; dense g = tốc độ gộp trên M3 / 9,5388. Hải
 *    Đăng là NGOẠI LỆ có cơ sở: f của Hải Đăng tính từ tốc độ gộp
 *    MỌI text medium normal của anh (M4 ×3 + T2/T4/T5/M5), không
 *    phải chỉ M4 — vì M4 của Hải Đăng đọc nhanh bất thường so với
 *    chính các text medium khác của anh (18,81 vs 16,30).
 * 3. Hai lần chạy độc lập (lần 1: header WAV, WAV mất do VM restart;
 *    lần 2: header + ffprobe khớp từng mili-giây) lệch nhau tối đa
 *    7,1% — khóa tính nhất quán giữa các lần đo.
 * 4. Mỹ Duyên n = 8 trên M4: spread 11,5% (12,00–13,44 s) — phương
 *    sai lớn là đặc tính giọng, không phải nhiễu n = 2 (D1 chỉ có 2
 *    lần đo); khoảng theo giọng phải chứa cả 8 lần đo.
 * 5. Mô hình theo giọng tốt hơn hệ số gộp: khoảng dense gộp KHÔNG
 *    chứa cả 3 lần đo M3 của Kim Thanh (22,92–23,03 s > max gộp
 *    21,94 s), trong khi khoảng theo giọng chứa; mọi mẫu M4/M3 đã đo
 *    đều nằm trong khoảng theo giọng của giọng đó.
 * 6. Ngưỡng numberDense 13% GIỮ NGUYÊN (fallback) — helper E1 tái
 *    dùng bộ phát hiện C4, không khóa ngưỡng mới.
 * 7. Tốc độ tổng hợp: mọi tỉ lệ audio/synth đều < 1× realtime
 *    (median 0,32×) — chậm hơn nhiều con số "~1,5–2,5×" trong memory;
 *    khóa số thật, không sửa memory.
 *
 * Chạy bằng esbuild bundle (quy ước đợt 45/46/47/48):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/ttsEstimate49E1.test.ts \
 *     --bundle --format=esm --platform=node --outfile=/tmp/tts49e1.test.mjs
 *   REPO_ROOT=$PWD node /tmp/tts49e1.test.mjs
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
} from "./ttsEstimate48D1";
import { TTS_SAMPLES_46B3 } from "./ttsEstimate46B3";
import {
  TTS_SAMPLES_CLI_49E1,
  TTS_SAMPLES_RUN1_49E1,
  TTS_SAMPLES_RUN2_49E1,
  TTS_STANDARD_TEXT_M3_49E1,
  TTS_STANDARD_TEXT_M4_49E1,
  TTS_SYNTH_META_49E1,
  TTS_SYNTH_SPEED_49E1,
  TTS_VOICE_COEFFICIENTS_49E1,
  estimateTtsDurationRange49E1,
  ttsDoneSuffixRange49E1,
  ttsEstimateRangeSuffix49E1,
  ttsVoiceCoefficient49E1,
} from "./ttsEstimate49E1";
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

/** Đọc source TtsButton.tsx từ repo root (như test B3 §4 / D1 §1). */
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

// ---------------------------------------------------------------------------
// 1. ĐỎ-TRƯỚC: nối UI — TtsButton phải dùng helper E1 + truyền voice
// ---------------------------------------------------------------------------

test("nối UI (đợt 51 H1): TtsButton import + gọi helper H1 với voice, không dùng helper F3/E1/C4/B3", () => {
  const code = readTtsButtonSource();
  assert(
    code.includes('from "../lib/ttsEstimate51H1"'),
    "TtsButton phải import từ ../lib/ttsEstimate51H1 (đợt 51 H1 chuyển từ F3 sang H1)",
  );
  assert(
    code.includes("ttsDoneSuffixRange51H1({"),
    "TtsButton phải gọi ttsDoneSuffixRange51H1({...})",
  );
  assert(
    code.includes("voice: cloneMode ? undefined : voice"),
    "TtsButton phải truyền voice đang chọn vào helper H1 (clone mode → undefined để fallback)",
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
// 2. Text chuẩn M3/M4 (khóa lại từ lib C4/D1, không tin mù số ký tự)
// ---------------------------------------------------------------------------

test("text chuẩn: M3 đúng 178 ký tự / 24 chữ số, M4 đúng 169 ký tự / 0 chữ số", () => {
  eq(ttsTextLength(TTS_STANDARD_TEXT_M3_49E1), 178, "M3 đúng 178 ký tự");
  eq(ttsTextLength(TTS_STANDARD_TEXT_M4_49E1), 169, "M4 đúng 169 ký tự");
  eq((TTS_STANDARD_TEXT_M3_49E1.match(/[0-9]/g) ?? []).length, 24, "M3 có 24 chữ số (13,48%)");
  eq((TTS_STANDARD_TEXT_M4_49E1.match(/[0-9]/g) ?? []).length, 0, "M4 có 0 chữ số");
  // Text chuẩn E1 phải trùng text C4-M3 / D1-M4 (cùng text mới so được).
  const c4m3 = TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M3")!;
  eq(TTS_STANDARD_TEXT_M3_49E1, c4m3.text, "M3 E1 phải trùng text C4-M3");
  eq(TTS_STANDARD_TEXT_M4_49E1, TTS_STANDARD_TEXT_48D1, "M4 E1 phải trùng text chuẩn D1");
});

// ---------------------------------------------------------------------------
// 3. Bảng hệ số: tính lại từ pool mẫu
// ---------------------------------------------------------------------------

test("bảng hệ số normal: f mỗi giọng = tốc độ gộp trên M4 / 16,0714 (Hải Đăng: gộp mọi medium)", () => {
  // Gộp mọi lần đo M4 của từng giọng: D1 (7 giọng) + C4 (Thùy Dung) +
  // E1 lần 1 + lần 2 (+ CLI cho Hải Đăng). Hải Đăng: gộp thêm T2/T4/T5/M5.
  const m4Runs: Record<string, number[]> = {};
  const add = (voice: string, dur: number) => {
    (m4Runs[voice] ??= []).push(dur);
  };
  for (const s of TTS_NEW_VOICES_48D1) add(s.voice, s.durationSec);
  add("Thùy Dung", TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M4")!.durationSec);
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.textId === "M4") add(s.voice, s.durationSec);
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.textId === "M4") add(s.voice, s.durationSec);
  }
  // Mỹ Duyên: thêm lần lặp D1-X4 (13,44 s) — V7 gốc (12,00 s) đã có
  // trong vòng lặp TTS_NEW_VOICES_48D1 ở trên; E1 đã có 6 lần (R1–R3 × 2 lần chạy).
  add("Mỹ Duyên", TTS_VARIANCE_48D1.find((r) => r.id === "D1-X4")!.durationSec);
  // Thiền Tâm Đức: thêm lần lặp D1-X3 (13,52 s) — V1 gốc đã có trong TTS_NEW_VOICES_48D1.
  add("Thiền Tâm Đức", TTS_VARIANCE_48D1.find((r) => r.id === "D1-X3")!.durationSec);
  eq(Object.keys(m4Runs).length, 14, "đúng 14 giọng có số M4 (25 preset: 14 đã đo M4, 11 còn lại fallback)");
  for (const row of TTS_VOICE_COEFFICIENTS_49E1) {
    if (row.voice === "Hải Đăng") continue; // ngoại lệ — test riêng dưới
    const runs = m4Runs[row.voice];
    assert(runs && runs.length === row.normalN, `giọng ${row.voice} phải có n = ${row.normalN} lần đo M4, nhận ${runs?.length}`);
    const recomputed = pooledRate(runs, 169) / 16.0714;
    approx(recomputed, row.normalCoefficient, 0.001, `hệ số normal của ${row.voice} tính lại từ pool M4`);
  }
  // Hải Đăng: f từ tốc độ gộp MỌI text medium normal (M4 ×3 + T2/T4/T5/M5).
  const hd = TTS_VOICE_COEFFICIENTS_49E1.find((r) => r.voice === "Hải Đăng")!;
  eq(hd.normalN, 7, "Hải Đăng có n = 7 mẫu medium normal (3 M4 + T2/T4/T5/M5)");
  let chars = 0;
  let secs = 0;
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") { chars += 169; secs += s.durationSec; }
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") { chars += 169; secs += s.durationSec; }
  }
  for (const s of TTS_THRESHOLD_PROBES_48D1.filter((p) => p.digitRatio <= 0.051)) { chars += ttsTextLength(s.text); secs += s.durationSec; }
  const m5 = TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M5")!;
  chars += ttsTextLength(m5.text);
  secs += m5.durationSec;
  approx(chars / secs / 16.0714, hd.normalCoefficient, 0.001, "hệ số normal của Hải Đăng tính lại từ pool mọi medium");
  approx(chars / secs, 17.2216, 0.001, "tốc độ gộp medium của Hải Đăng phải là 17,2216");
});

test("bảng hệ số dense: g mỗi giọng = tốc độ gộp trên M3 / 9,5388; giọng chưa đo M3 thì g = null", () => {
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
  eq(Object.keys(m3Runs).length, 6, "đúng 6 giọng có số M3");
  for (const row of TTS_VOICE_COEFFICIENTS_49E1) {
    const runs = m3Runs[row.voice];
    if (row.denseCoefficient === null) {
      assert(!runs, `giọng ${row.voice} có denseCoefficient null thì không được có mẫu M3`);
      eq(row.denseN, 0, `giọng ${row.voice} chưa đo M3 thì denseN = 0`);
    } else {
      assert(runs && runs.length === row.denseN, `giọng ${row.voice} phải có n = ${row.denseN} lần đo M3, nhận ${runs?.length}`);
      const recomputed = pooledRate(runs, 178) / 9.5388;
      approx(recomputed, row.denseCoefficient, 0.001, `hệ số dense của ${row.voice} tính lại từ pool M3`);
    }
  }
});

// ---------------------------------------------------------------------------
// 4. Nhất quán giữa hai lần chạy độc lập + phương sai Mỹ Duyên
// ---------------------------------------------------------------------------

test("hai lần chạy độc lập: mỗi mẫu E1 lần 1 vs lần 2 lệch ≤ 7,5% (lớn nhất quan sát 7,1%)", () => {
  eq(TTS_SAMPLES_RUN1_49E1.length, 13, "lần 1 đủ 13 mẫu");
  eq(TTS_SAMPLES_RUN2_49E1.length, 13, "lần 2 đủ 13 mẫu");
  let maxDev = 0;
  let maxId = "";
  for (const a of TTS_SAMPLES_RUN1_49E1) {
    const b = TTS_SAMPLES_RUN2_49E1.find((s) => s.id === a.id)!;
    eq(b.voice, a.voice, `mẫu ${a.id} lần 2 phải cùng giọng lần 1`);
    eq(b.textId, a.textId, `mẫu ${a.id} lần 2 phải cùng text lần 1`);
    const dev = Math.abs(b.durationSec - a.durationSec) / ((a.durationSec + b.durationSec) / 2);
    if (dev > maxDev) { maxDev = dev; maxId = a.id; }
    assert(dev <= 0.075, `mẫu ${a.id} lệch lần 1–lần 2 phải ≤ 7,5%, nhận ${(dev * 100).toFixed(1)}%`);
  }
  approx(maxDev, 0.071, 0.002, "lệch lớn nhất lần 1–lần 2 phải ~7,1%");
  eq(maxId, "E1-V12", "lệch lớn nhất là Kim Thanh M4 (12,96 → 13,92 s)");
});

test("phương sai Mỹ Duyên n = 8 trên M4: spread 11,5% — đặc tính giọng, không phải nhiễu n = 2", () => {
  const runs: number[] = [];
  runs.push(TTS_NEW_VOICES_48D1.find((s) => s.id === "D1-V7")!.durationSec);
  runs.push(TTS_VARIANCE_48D1.find((r) => r.id === "D1-X4")!.durationSec);
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.voice === "Mỹ Duyên") runs.push(s.durationSec);
  }
  eq(runs.length, 8, "Mỹ Duyên có n = 8 lần đo M4 (D1 2 + E1 6)");
  const mean = runs.reduce((a, b) => a + b, 0) / runs.length;
  approx(mean, 12.51, 0.01, "trung bình 8 lần đo Mỹ Duyên phải là 12,51 s");
  const spread = (Math.max(...runs) - Math.min(...runs)) / mean;
  approx(spread, 0.115, 0.002, "spread Mỹ Duyên phải ~11,5%");
  approx(pooledRate(runs, 169), 13.5092, 0.001, "tốc độ gộp Mỹ Duyên phải là 13,5092");
  // Khoảng theo giọng phải chứa cả 8 lần đo.
  const r = estimateTtsDurationRange49E1(TTS_STANDARD_TEXT_M4_49E1, "Mỹ Duyên")!;
  for (const d of runs) inRange(d, r.minSec, r.maxSec, `khoảng theo giọng Mỹ Duyên phải chứa lần đo ${d}s`);
});

// ---------------------------------------------------------------------------
// 5. Hải Đăng: M4 nhanh bất thường + kiểm chứng tầng long
// ---------------------------------------------------------------------------

test("Hải Đăng: M4 gộp 18,81 vs medium khác gộp 16,30 (tỉ lệ 1,154) — f dùng tốc độ gộp mọi medium", () => {
  const m4Runs: number[] = [];
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") m4Runs.push(s.durationSec);
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.voice === "Hải Đăng" && s.textId === "M4") m4Runs.push(s.durationSec);
  }
  eq(m4Runs.length, 3, "Hải Đăng có 3 lần đo M4 (driver ×2 + CLI ×1)");
  approx(pooledRate(m4Runs, 169), 18.8056, 0.001, "tốc độ gộp M4 của Hải Đăng phải là 18,8056");
  // Chỉ dùng mẫu thăm dò ÍT SỐ (T2/T4/T5, tỉ lệ chữ số ≤ 5,08%) + M5
  // làm "medium khác" — T8/T13 (8,2%/12,43%) đã chậm dần theo tỉ lệ
  // chữ số nên không phải text medium thường để đối chiếu.
  let chars = 0;
  let secs = 0;
  for (const s of TTS_THRESHOLD_PROBES_48D1.filter((p) => p.digitRatio <= 0.051)) { chars += ttsTextLength(s.text); secs += s.durationSec; }
  const m5 = TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M5")!;
  chars += ttsTextLength(m5.text);
  secs += m5.durationSec;
  approx(chars / secs, 16.2997, 0.001, "tốc độ gộp medium khác của Hải Đăng phải là 16,2997");
  approx(18.8056 / 16.2997, 1.1537, 0.001, "tỉ lệ M4/medium-khác của Hải Đăng phải là 1,1537");
  // f M4-only (18,8056/16,0714 = 1,1702) sẽ DỰ BÁO SAI text long B3-L1:
  // tâm dự báo 14,56 s lệch khỏi thực tế 17,04 s tới 14,6% — bằng chứng
  // phải dùng f gộp mọi medium (không chỉ so biên khoảng vì biên sát
  // nhau trong bước lượng tử hóa 0,08 s).
  const b3l1 = TTS_SAMPLES_46B3.find((s) => s.id === "B3-L1")!;
  eq(b3l1.voice, "Hải Đăng", "B3-L1 là text long của Hải Đăng");
  const centerM4only = ttsTextLength(b3l1.text) / (18.6116 * (18.8056 / 16.0714));
  const devM4only = Math.abs(centerM4only - b3l1.durationSec) / b3l1.durationSec;
  approx(centerM4only, 14.56, 0.02, "tâm dự báo B3-L1 với f M4-only phải là 14,56 s");
  assert(devM4only > 0.1, `f M4-only phải dự báo B3-L1 lệch > 10% (nhận ${(devM4only * 100).toFixed(1)}%)`);
  // Với f gộp mọi medium (1,0716), khoảng theo giọng CHỨA 17,04 s.
  const r = estimateTtsDurationRange49E1(b3l1.text, "Hải Đăng")!;
  eq(r.perVoice, true, "B3-L1 với Hải Đăng phải dùng hệ số theo giọng");
  inRange(b3l1.durationSec, r.minSec, r.maxSec, "khoảng theo giọng (f gộp mọi medium) phải chứa B3-L1 17,04 s");
});

// ---------------------------------------------------------------------------
// 6. Mô hình theo giọng tốt hơn hệ số gộp (chứa mọi mẫu đã đo)
// ---------------------------------------------------------------------------

test("mọi mẫu M4/M3 đã đo đều nằm trong khoảng theo giọng của giọng đó", () => {
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1, ...TTS_SAMPLES_CLI_49E1]) {
    const text = s.textId === "M3" ? TTS_STANDARD_TEXT_M3_49E1 : TTS_STANDARD_TEXT_M4_49E1;
    const r = estimateTtsDurationRange49E1(text, s.voice)!;
    assert(r.perVoice, `mẫu ${s.id} (${s.voice}, ${s.textId}) phải dùng hệ số theo giọng`);
    inRange(s.durationSec, r.minSec, r.maxSec, `khoảng theo giọng phải chứa mẫu ${s.id} (${s.durationSec}s)`);
  }
  // Cả mẫu C4/D1 cũ (Minh Đức M3, Hải Đăng X1, 7 giọng D1, Thùy Dung M4).
  const legacy: Array<{ text: string; voice: string; dur: number; id: string }> = [
    { text: TTS_STANDARD_TEXT_M3_49E1, voice: "Minh Đức", dur: 19.99, id: "C4-M3" },
    { text: TTS_STANDARD_TEXT_M3_49E1, voice: "Hải Đăng", dur: 15.41, id: "D1-X1" },
    { text: TTS_STANDARD_TEXT_M4_49E1, voice: "Thùy Dung", dur: 9.36, id: "C4-M4" },
    ...TTS_NEW_VOICES_48D1.map((s) => ({ text: TTS_STANDARD_TEXT_M4_49E1, voice: s.voice, dur: s.durationSec, id: s.id })),
  ];
  for (const s of legacy) {
    const r = estimateTtsDurationRange49E1(s.text, s.voice)!;
    inRange(s.dur, r.minSec, r.maxSec, `khoảng theo giọng phải chứa mẫu cũ ${s.id} (${s.dur}s)`);
  }
});

test("hệ số gộp THUA mô hình theo giọng: khoảng dense gộp không chứa Kim Thanh M3, khoảng theo giọng chứa", () => {
  const pooled = estimateTtsDurationRange47C4(TTS_STANDARD_TEXT_M3_49E1)!;
  eq(pooled.regime, "numberDense", "M3 là chế độ numberDense");
  approx(pooled.maxSec, 21.94, 0.01, "max khoảng dense gộp cho M3 phải là 21,94 s");
  for (const d of [23.0, 22.92, 23.03]) {
    assert(
      !(d >= pooled.minSec && d <= pooled.maxSec),
      `khoảng dense gộp [${pooled.minSec.toFixed(2)}, ${pooled.maxSec.toFixed(2)}] phải KHÔNG chứa ${d} s của Kim Thanh`,
    );
  }
  const perVoice = estimateTtsDurationRange49E1(TTS_STANDARD_TEXT_M3_49E1, "Kim Thanh")!;
  eq(perVoice.perVoice, true, "Kim Thanh M3 phải dùng hệ số dense riêng");
  approx(perVoice.coefficient ?? 0, 0.8119, 0.001, "hệ số dense Kim Thanh phải là 0,8119");
  for (const d of [23.0, 22.92, 23.03]) {
    inRange(d, perVoice.minSec, perVoice.maxSec, `khoảng theo giọng Kim Thanh phải chứa ${d} s`);
  }
  // Đức Trí M3 21,76 s chỉ vừa trong khoảng gộp (sát biên 21,94) nhưng
  // thoải mái trong khoảng theo giọng — bằng chứng khoảng gộp quá chật.
  const dt = estimateTtsDurationRange49E1(TTS_STANDARD_TEXT_M3_49E1, "Đức Trí")!;
  inRange(21.76, dt.minSec, dt.maxSec, "khoảng theo giọng Đức Trí phải chứa 21,76 s");
  assert(dt.minSec > pooled.minSec + 1, "khoảng theo giọng Đức Trí phải dịch hẳn lên so với khoảng gộp");
});

// ---------------------------------------------------------------------------
// 7. Fallback: giọng chưa đo → y hệt C4; "Adam" ≠ "Adam bựa"
// ---------------------------------------------------------------------------

test("fallback: giọng chưa đo / không truyền voice → số y hệt helper C4", () => {
  const texts = [TTS_STANDARD_TEXT_M4_49E1, TTS_STANDARD_TEXT_M3_49E1, "Xin chào Việt Nam, đây là một câu kiểm tra tốc độ đọc."];
  for (const voice of [undefined, "", "Thái Sơn", "Phạm Tuyên", "Ngọc Trân", "Quốc Tuấn", "Adam", "Trúc Ly", "Giọng Không Tồn Tại"]) {
    for (const text of texts) {
      const a = estimateTtsDurationRange49E1(text, voice);
      const b = estimateTtsDurationRange47C4(text);
      eq(JSON.stringify(a === null ? null : { tier: a.tier, regime: a.regime, seconds: a.seconds, minSec: a.minSec, maxSec: a.maxSec }),
        JSON.stringify(b === null ? null : { tier: b.tier, regime: b.regime, seconds: b.seconds, minSec: b.minSec, maxSec: b.maxSec }),
        `fallback cho voice ${JSON.stringify(voice)} trên text ${text.slice(0, 20)}… phải y hệt C4`);
      if (a !== null) {
        eq(a.perVoice, false, "fallback thì perVoice = false");
        eq(a.coefficient, null, "fallback thì coefficient = null");
      }
    }
  }
  // "Adam" (chỉ có mẫu veryShort C4-VS5, không có M4/M3) fallback;
  // "Adam bựa" (đo E1) có hệ số riêng — hai preset khác nhau.
  eq(ttsVoiceCoefficient49E1("Adam", "normal"), null, "'Adam' chưa đo M4 → không có hệ số normal");
  eq(ttsVoiceCoefficient49E1("Adam bựa", "normal"), 0.9773, "'Adam bựa' có hệ số normal 0,9773");
  eq(ttsVoiceCoefficient49E1("Adam bựa", "numberDense"), 1.1286, "'Adam bựa' có hệ số dense 1,1286");
  // Giọng có hệ số normal nhưng chưa đo M3 (Mỹ Duyên, Thùy Dung…)
  // thì text số-dày vẫn fallback hệ số dense gộp (không suy dense từ normal).
  eq(ttsVoiceCoefficient49E1("Mỹ Duyên", "normal"), 0.8406, "Mỹ Duyên có hệ số normal");
  eq(ttsVoiceCoefficient49E1("Mỹ Duyên", "numberDense"), null, "Mỹ Duyên chưa đo M3 → không có hệ số dense");
  const r = estimateTtsDurationRange49E1(TTS_STANDARD_TEXT_M3_49E1, "Mỹ Duyên")!;
  eq(r.perVoice, false, "Mỹ Duyên đọc M3 vẫn dùng hệ số dense gộp (perVoice false)");
  approx(r.seconds, 178 / 9.5388, 0.001, "Mỹ Duyên đọc M3 dùng đúng hệ số dense gộp 9,5388");
});

test("helper E1: text rỗng → null/''; header thật thắng ước lượng; hậu tố khoảng đúng dạng", () => {
  eq(estimateTtsDurationRange49E1("", "Hải Đăng"), null, "text rỗng → null");
  eq(ttsEstimateRangeSuffix49E1("", "Hải Đăng"), "", "text rỗng → hậu tố ''");
  eq(ttsDoneSuffixRange49E1({ headerValue: "12.34", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Đức Trí" }), " (12.3s)", "header thật thắng ước lượng theo giọng");
  eq(ttsDoneSuffixRange49E1({ headerValue: null, text: "", voice: "Hải Đăng" }), "", "text rỗng + header thiếu → ''");
  // Hậu tố theo giọng cho Đức Trí M4: tâm 169/11,9688 = 14,12 s;
  // ×[0,83, 1,17] → [11,7, 16,5] — chứa cả hai lần đo (14,00 / 14,24).
  eq(ttsEstimateRangeSuffix49E1(TTS_STANDARD_TEXT_M4_49E1, "Đức Trí"), " (≈11.7–16.5s)", "hậu tố theo giọng Đức Trí M4");
  eq(ttsEstimateRangeSuffix47C4(TTS_STANDARD_TEXT_M4_49E1), " (≈8.8–13.5s)", "hậu tố gộp C4 cho M4 (đối chiếu — KHÔNG chứa 14,00 s)");
  // Hậu tố theo giọng cho Kim Thanh M3: tâm 178/7,7447 = 22,98 s;
  // ×[0,83, 1,17] → [19,1, 26,9].
  eq(ttsEstimateRangeSuffix49E1(TTS_STANDARD_TEXT_M3_49E1, "Kim Thanh"), " (≈19.1–26.9s)", "hậu tố theo giọng Kim Thanh M3");
  eq(ttsEstimateRangeSuffix47C4(TTS_STANDARD_TEXT_M3_49E1), " (≈15.4–21.9s)", "hậu tố gộp C4 cho M3 (đối chiếu)");
});

// ---------------------------------------------------------------------------
// 8. Ngưỡng 13% giữ nguyên (fallback) + tốc độ tổng hợp
// ---------------------------------------------------------------------------

test("ngưỡng numberDense vẫn 13% (fallback, không khóa ngưỡng mới)", () => {
  eq(TTS_NUMBER_DENSE_DIGIT_RATIO_47C4, 0.13, "hằng ngưỡng C4 vẫn là 0,13");
  eq(isNumberDenseText47C4(TTS_STANDARD_TEXT_M3_49E1), true, "M3 (13,48%) → số-dày");
  eq(isNumberDenseText47C4(TTS_STANDARD_TEXT_M4_49E1), false, "M4 (0%) → thường");
  for (const row of TTS_VOICE_COEFFICIENTS_49E1) {
    eq(estimateTtsDurationRange49E1(TTS_STANDARD_TEXT_M3_49E1, row.voice)?.regime, "numberDense", `M3 với giọng ${row.voice} vẫn phân loại số-dày`);
    eq(estimateTtsDurationRange49E1(TTS_STANDARD_TEXT_M4_49E1, row.voice)?.regime, "normal", `M4 với giọng ${row.voice} vẫn phân loại thường`);
  }
});

test("tốc độ tổng hợp: mọi lần đo đều < 1× realtime (median 0,32×) — chậm hơn nhiều '~1,5–2,5×' trong memory", () => {
  eq(TTS_SYNTH_SPEED_49E1.length, 28, "28 lần đo tốc độ tổng hợp (26 driver + 2 CLI)");
  const ratios = TTS_SYNTH_SPEED_49E1.map((s) => s.audioSec / s.synthSec);
  for (const r of ratios) {
    assert(r > 0 && r < 1.0, `mọi tỉ lệ audio/synth phải < 1× realtime, nhận ${r.toFixed(2)}`);
  }
  const sorted = [...ratios].sort((a, b) => a - b);
  approx(sorted[0], 0.12, 0.01, "tỉ lệ chậm nhất phải ~0,12× (Minh Đức M4 lần 1, máy đang tải)");
  approx(sorted[sorted.length - 1], 0.65, 0.01, "tỉ lệ nhanh nhất phải ~0,65× (Kim Thanh M3 CLI)");
  const median = (sorted[13] + sorted[14]) / 2;
  approx(median, 0.32, 0.02, "median tốc độ tổng hợp phải ~0,32×");
  // CLI: wall time (gồm nạp model) chậm hơn infer thuần.
  for (const s of TTS_SYNTH_SPEED_49E1.filter((x) => x.wallSec !== null)) {
    assert(s.wallSec! > s.synthSec, `wall time CLI (${s.wallSec}s) phải lớn hơn synth thuần (${s.synthSec}s)`);
    assert(s.audioSec / s.wallSec! < 1.0, "tỉ lệ wall-clock cũng < 1×");
  }
  approx(TTS_SYNTH_META_49E1.loadSecRun1, 10.0, 0.5, "nạp model lần 1 ~10,0 s");
  approx(TTS_SYNTH_META_49E1.loadSecRun2, 9.4, 0.5, "nạp model lần 2 ~9,4 s");
  approx(TTS_SYNTH_META_49E1.warmupSecRun1, 2.1, 0.5, "warmup infer lần 1 ~2,1 s");
  approx(TTS_SYNTH_META_49E1.warmupSecRun2, 1.5, 0.5, "warmup infer lần 2 ~1,5 s");
});

console.log(`\nttsEstimate49E1: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
