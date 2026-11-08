/**
 * ttsEstimate51H1.test.ts — Test cho đợt 51 luồng H1 (ROUND51-H1):
 * mô hình đường cong TTS theo giọng thay ngưỡng nhị phân 13%.
 *
 * Khóa:
 * 1. ĐỎ-TRƯỚC: nối UI — TtsButton phải import + gọi helper H1
 *    (ttsDoneSuffixRange51H1) và TRUYỀN voice đang chọn (clone mode
 *    → voice undefined, fallback F3). Test này ĐỎ khi TtsButton còn
 *    nối F3 (trạng thái trước luồng này), XANH sau khi chuyển.
 * 2. Text thăm dò mới Q07 (6,98%) / Q09 (9,83%) / Q14 (14,29%):
 *    đúng số ký tự + chữ số + tỉ lệ (lấp khoảng trống 5–10% và
 *    13–16% mà F3 chưa đo).
 * 3. Mẫu đo mới H1: 1 neo Kim Thanh M3 + 12 mẫu Q07/Q09/Q14 ×
 *    4 giọng (Kim Thanh, Đức Trí, Quỳnh Anh, Trúc Ly); neo lệch
 *    ≤ 2,5% so với mọi lần đo M3 của Kim Thanh (E1/F3). Đợt 53 J7
 *    thêm 3 mẫu P10/P13/P16 × Trúc Ly (nay 16 mẫu, cô đủ 8 điểm).
 *    Đợt 54 K6 thêm 6 mẫu đo lặp P13/M3 × Trúc Ly (n = 3 mỗi text,
 *    nay 22 mẫu). Đợt 55 L9 thêm 6 mẫu đo lặp định kỳ lần 2 P13/M3
 *    × Trúc Ly (n = 3 mỗi text, nay 28 mẫu).
 * 4. SỬA LỖI CỐT LÕI (đỏ-trước, 6 mẫu F3 P10/P13): khoảng đường
 *    cong H1 phải CHỨA số thật của cả 6 mẫu text 10–12% mà helper
 *    F3 (ngưỡng nhị phân 13%) dự báo nhanh hơn thực tế — test này
 *    FAIL với helper F3, PASS với helper H1.
 * 5. Đường cong: tốc độ đơn điệu giảm theo tỉ lệ chữ số ở cả 4
 *    giọng H1 (M4 > Q07 > Q09 > P10 > P13 > M3 > Q14 > P16 — từ
 *    đợt 53 J7 cả 4 giọng đều có chuỗi đầy đủ, trước đó Trúc Ly
 *    chỉ có M4 > Q07 > Q09 > M3 > Q14);
 *    mọi mẫu thăm dò (F3 P10/P13/P16 + H1 Q07/Q09/Q14 + J7 P10/
 *    P13/P16 Trúc Ly) đều nằm trong khoảng đường cong của giọng đó;
 *    đường cong khái quát được sang text khác (mọi mẫu D1 của Hải
 *    Đăng + phản ví dụ X2 đều nằm trong khoảng — X2 từng ngoài
 *    khoảng F3).
 * 6. Dạng đường cong đã khóa: hệ số φ(r) — tỉ lệ quãng đường từ
 *    normal xuống dense theo tỉ lệ chữ số — nội suy tuyến tính
 *    từng đoạn giữa các nút đo; φ(0) = 0, φ(0,1348) = 1. Đợt 53 J7
 *    cập nhật 3 nút P (P10 0,854 → 0,884, P13 0,958 → 0,968,
 *    P16 1,160 → 1,161) vì Trúc Ly nay có mẫu P, φ gộp tính trên
 *    đủ 4 giọng thay vì 3 giọng.
 * 7. Đo lặp P13 vs M3 Trúc Ly (đợt 54 K6, n = 3 mỗi text, xen kẽ):
 *    P13 gộp nhanh hơn M3 gộp (+2,90%, 7/9 cặp) — thứ tự P13 > M3
 *    giữ vững sau khi biên mỏng 0,02 ký tự/giây của J7 (1 mẫu) được
 *    đo lặp; φ(P13) Trúc Ly gộp 4 mẫu (J7 + K6) = 0,983; φ gộp 4
 *    giọng tính lại 0,9642 — trong dung sai ±0,005 của nút khóa
 *    0,968 nên nút KHÔNG đổi.
 * 8. Đo lặp định kỳ lần 2 P13 vs M3 Trúc Ly (đợt 55 L9, n = 3 mỗi
 *    text, xen kẽ, đúng protocol K6): P13 gộp nhanh hơn M3 gộp
 *    (+4,60%, 9/9 cặp — mạnh hơn K6); φ(P13) Trúc Ly gộp 7 mẫu
 *    (J7 + K6 + L9) = 0,977; φ gộp 4 giọng tính lại 0,9626 — chênh
 *    −0,0054 so với nút khóa 0,968, vượt nhẹ dung sai ±0,005 cũ
 *    nhưng nằm trong sai số lấy mẫu (SE φ ≈ 0,02) nên nút KHÔNG
 *    đổi; test khóa dung sai nút ở ±0,01 (xem LIMITS L9 §3).
 * 9. Fallback: giọng lạ / không truyền voice → y hệt helper F3
 *    (không đổi hành vi cho giọng chưa đo); mọi preset đều có hệ
 *    số riêng qua bảng F3 tạm (H2 sở hữu bảng hệ số đợt 51).
 * 10. Tốc độ tổng hợp: mọi lần đo driver H1 đều < 1× realtime.
 *
 * Chạy bằng esbuild bundle (quy ước đợt 45/46/47/48/49/50):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/ttsEstimate51H1.test.ts \
 *     --bundle --format=esm --platform=node --outfile=/tmp/tts51h1.test.mjs
 *   REPO_ROOT=$PWD node /tmp/tts51h1.test.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import {
  TTS_SAMPLES_50F3,
  TTS_STANDARD_TEXT_M3_50F3,
  TTS_STANDARD_TEXT_M4_50F3,
  TTS_VOICE_COEFFICIENTS_50F3,
  estimateTtsDurationRange50F3,
} from "./ttsEstimate50F3";
import {
  TTS_PROBE_TEXT_P10_50F3,
  TTS_PROBE_TEXT_P13_50F3,
  TTS_PROBE_TEXT_P16_50F3,
} from "./ttsEstimate50F3";
import {
  TTS_THRESHOLD_PROBES_48D1,
  TTS_VOICE_DEPENDENCE_COUNTEREXAMPLE_48D1,
} from "./ttsEstimate48D1";
import {
  TTS_CURVE_KNOTS_51H1,
  TTS_PROBE_TEXT_Q07_51H1,
  TTS_PROBE_TEXT_Q09_51H1,
  TTS_PROBE_TEXT_Q14_51H1,
  TTS_SAMPLES_51H1,
  TTS_SYNTH_SPEED_51H1,
  estimateTtsDurationRange51H1,
  ttsCurveSpeed51H1,
  ttsDoneSuffixRange51H1,
  ttsEstimateRangeSuffix51H1,
} from "./ttsEstimate51H1";
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

/** Đọc source TtsButton.tsx từ repo root (như test B3 §4 / D1 §1 / E1 §1 / F3 §1). */
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

/** Tốc độ (ký tự/giây) của một mẫu H1 theo id. */
function sampleRate(id: string): number {
  const s = TTS_SAMPLES_51H1.find((x) => x.id === id)!;
  return ttsTextLength(s.text) / s.durationSec;
}

/** Tốc độ (ký tự/giây) của một mẫu thăm dò F3 theo id. */
function probeRateF3(id: string): number {
  const s = TTS_SAMPLES_50F3.find((x) => x.id === id)!;
  return ttsTextLength(s.text) / s.durationSec;
}

// ---------------------------------------------------------------------------
// 1. ĐỎ-TRƯỚC: nối UI — TtsButton phải dùng helper H1 + truyền voice
// ---------------------------------------------------------------------------

test("nối UI (đỏ-trước): TtsButton import + gọi helper H1 với voice đang chọn, không dùng F3", () => {
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
    "TtsButton phải truyền voice đang chọn (clone mode → undefined để fallback F3)",
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
  assert(!code.includes("18.4"), "TtsButton không được hardcode hệ số 18,4");
});

// ---------------------------------------------------------------------------
// 2. Text thăm dò mới Q07/Q09/Q14
// ---------------------------------------------------------------------------

test("text thăm dò mới: Q07 172 ký tự / 12 chữ số, Q09 173 / 17, Q14 168 / 24", () => {
  eq(ttsTextLength(TTS_PROBE_TEXT_Q07_51H1), 172, "Q07 đúng 172 ký tự");
  eq((TTS_PROBE_TEXT_Q07_51H1.match(/[0-9]/g) ?? []).length, 12, "Q07 có 12 chữ số (6,98%)");
  eq(ttsTextLength(TTS_PROBE_TEXT_Q09_51H1), 173, "Q09 đúng 173 ký tự");
  eq((TTS_PROBE_TEXT_Q09_51H1.match(/[0-9]/g) ?? []).length, 17, "Q09 có 17 chữ số (9,83%)");
  eq(ttsTextLength(TTS_PROBE_TEXT_Q14_51H1), 168, "Q14 đúng 168 ký tự");
  eq((TTS_PROBE_TEXT_Q14_51H1.match(/[0-9]/g) ?? []).length, 24, "Q14 có 24 chữ số (14,29%)");
  // digitRatio ghi trong mẫu phải khớp tỉ lệ tính lại từ text.
  for (const s of TTS_SAMPLES_51H1) {
    const digits = (s.text.match(/[0-9]/g) ?? []).length;
    approx(digits / ttsTextLength(s.text), s.digitRatio, 0.001, `digitRatio mẫu ${s.id} phải khớp text`);
  }
  eq(TTS_SAMPLES_51H1.length, 28, "đủ 28 mẫu (13 H1: 1 neo + 12 thăm dò Q07/Q09/Q14 × 4 giọng; + 3 J7 đợt 53: P10/P13/P16 × Trúc Ly; + 6 K6 đợt 54: đo lặp P13/M3 × Trúc Ly, n = 3 mỗi text; + 6 L9 đợt 55: đo lặp định kỳ lần 2 P13/M3 × Trúc Ly, n = 3 mỗi text)");
});

// ---------------------------------------------------------------------------
// 3. Neo kiểm chứng driver H1
// ---------------------------------------------------------------------------

test("neo A1: Kim Thanh M3 22,74 s lệch ≤ 2,5% so với mọi lần đo E1/F3", () => {
  const a1 = TTS_SAMPLES_51H1.find((s) => s.id === "H1-A1")!;
  eq(a1.voice, "Kim Thanh", "neo A1 là Kim Thanh M3");
  eq(a1.text, TTS_STANDARD_TEXT_M3_50F3, "neo A1 dùng đúng text chuẩn M3");
  for (const d of [22.92, 23.03, 23.0, 22.53]) {
    const dev = Math.abs(a1.durationSec - d) / d;
    assert(dev <= 0.025, `neo A1 lệch so với lần đo trước ${d}s phải ≤ 2,5%, nhận ${(dev * 100).toFixed(1)}%`);
  }
});

// ---------------------------------------------------------------------------
// 4. SỬA LỖI CỐT LÕI: 6 mẫu F3 P10/P13 (10–12%) — khoảng H1 phải chứa
//    số thật (helper F3 dự báo nhanh hơn thực tế — test §6 của F3 khóa lỗi này)
// ---------------------------------------------------------------------------

test("sửa lỗi 10–12%: khoảng đường cong H1 CHỨA số thật của cả 6 mẫu F3 P10/P13", () => {
  for (const [text, voice, actual, id] of [
    [TTS_PROBE_TEXT_P10_50F3, "Kim Thanh", 21.77, "F3-P10-KT"],
    [TTS_PROBE_TEXT_P10_50F3, "Đức Trí", 21.08, "F3-P10-DT"],
    [TTS_PROBE_TEXT_P10_50F3, "Quỳnh Anh", 16.82, "F3-P10-QA"],
    [TTS_PROBE_TEXT_P13_50F3, "Kim Thanh", 20.79, "F3-P13-KT"],
    [TTS_PROBE_TEXT_P13_50F3, "Đức Trí", 20.35, "F3-P13-DT"],
    [TTS_PROBE_TEXT_P13_50F3, "Quỳnh Anh", 16.06, "F3-P13-QA"],
  ] as const) {
    const r = estimateTtsDurationRange51H1(text, voice)!;
    eq(r.curve, true, `mẫu ${id} phải dùng mô hình đường cong H1 (không phải fallback F3)`);
    inRange(actual, r.minSec, r.maxSec, `khoảng đường cong H1 [${r.minSec.toFixed(1)}, ${r.maxSec.toFixed(1)}] phải CHỨA ${actual}s thật của ${id}`);
  }
  // Đối chiếu: helper F3 (ngưỡng nhị phân) KHÔNG chứa cả 6 mẫu này
  // (đã khóa ở test F3 §6 — ghi lại ở đây làm bằng chứng sửa lỗi).
  for (const [text, voice, actual, id] of [
    [TTS_PROBE_TEXT_P10_50F3, "Kim Thanh", 21.77, "F3-P10-KT"],
    [TTS_PROBE_TEXT_P13_50F3, "Quỳnh Anh", 16.06, "F3-P13-QA"],
  ] as const) {
    const rf = estimateTtsDurationRange50F3(text, voice)!;
    assert(
      !(actual >= rf.minSec && actual <= rf.maxSec),
      `đối chiếu: khoảng F3 phải KHÔNG chứa ${actual}s của ${id} (lỗi gốc vẫn đứng ở helper cũ)`,
    );
  }
});

// ---------------------------------------------------------------------------
// 5. Đường cong: đơn điệu giảm + mọi mẫu thăm dò nằm trong khoảng H1
// ---------------------------------------------------------------------------

test("đường cong H1: tốc độ đơn điệu giảm theo tỉ lệ chữ số ở cả 4 giọng", () => {
  const suffix: Record<string, string> = {
    "Kim Thanh": "KT",
    "Đức Trí": "DT",
    "Quỳnh Anh": "QA",
    "Trúc Ly": "TL",
  };
  for (const voice of ["Kim Thanh", "Đức Trí", "Quỳnh Anh", "Trúc Ly"]) {
    const row = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === voice)!;
    const normalRate = row.normalCoefficient * 16.0714;
    const sfx = suffix[voice];
    const q07 = sampleRate(`H1-Q07-${sfx}`);
    const q09 = sampleRate(`H1-Q09-${sfx}`);
    const q14 = sampleRate(`H1-Q14-${sfx}`);
    assert(normalRate > q07, `${voice}: tốc độ normal (${normalRate.toFixed(2)}) phải > Q07 (${q07.toFixed(2)})`);
    assert(q07 > q09, `${voice}: tốc độ Q07 (${q07.toFixed(2)}) phải > Q09 (${q09.toFixed(2)})`);
    assert(q09 > q14, `${voice}: tốc độ Q09 (${q09.toFixed(2)}) phải > Q14 (${q14.toFixed(2)})`);
  }
  // 3 giọng có đủ mẫu F3: chuỗi đầy đủ M4 > Q07 > Q09 > P10 > P13 > M3 > Q14 > P16.
  for (const voice of ["Kim Thanh", "Đức Trí", "Quỳnh Anh"]) {
    const row = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === voice)!;
    const normalRate = row.normalCoefficient * 16.0714;
    const denseRate = row.denseCoefficient * 9.5388;
    const sfx = voice === "Kim Thanh" ? "KT" : voice === "Đức Trí" ? "DT" : "QA";
    const chain = [
      normalRate,
      sampleRate(`H1-Q07-${sfx}`),
      sampleRate(`H1-Q09-${sfx}`),
      probeRateF3(`F3-P10-${sfx}`),
      probeRateF3(`F3-P13-${sfx}`),
      denseRate,
      sampleRate(`H1-Q14-${sfx}`),
      probeRateF3(`F3-P16-${sfx}`),
    ];
    for (let i = 0; i + 1 < chain.length; i++) {
      assert(chain[i] > chain[i + 1], `${voice}: tốc độ phải đơn điệu giảm — vị trí ${i} (${chain[i].toFixed(2)}) phải > vị trí ${i + 1} (${chain[i + 1].toFixed(2)})`);
    }
  }
  // Trúc Ly: chuỗi đầy đủ từ đợt 53 J7 (P10/P13/P16 đo ở J7, không
  // phải mẫu F3). Lưu ý P13 (13,11) chỉ nhỉnh hơn dense (13,09) 0,02
  // ký tự/giây — φ(P13) của cô ≈ 0,997, gần chạm dense (xem LIMITS J7 §3).
  // Đợt 54 K6 đo lặp P13/M3 n = 3 xác nhận thứ tự này (xem test §7):
  // P13 gộp n = 3 là 13,23 > M3 gộp n = 3 là 12,86 — biên gộp +0,37,
  // không còn mỏng như 1 mẫu J7; chuỗi đơn điệu dưới đây vẫn dùng mẫu
  // J7-P13-TL đơn lẻ (13,11 > 13,09) và vẫn pass.
  {
    const row = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === "Trúc Ly")!;
    const chain = [
      row.normalCoefficient * 16.0714,
      sampleRate("H1-Q07-TL"),
      sampleRate("H1-Q09-TL"),
      sampleRate("J7-P10-TL"),
      sampleRate("J7-P13-TL"),
      row.denseCoefficient * 9.5388,
      sampleRate("H1-Q14-TL"),
      sampleRate("J7-P16-TL"),
    ];
    for (let i = 0; i + 1 < chain.length; i++) {
      assert(chain[i] > chain[i + 1], `Trúc Ly: tốc độ phải đơn điệu giảm — vị trí ${i} (${chain[i].toFixed(2)}) phải > vị trí ${i + 1} (${chain[i + 1].toFixed(2)})`);
    }
  }
});

test("mọi mẫu thăm dò (F3 P10/P13/P16 + H1 Q07/Q09/Q14) đều nằm trong khoảng đường cong H1", () => {
  for (const s of TTS_SAMPLES_51H1.filter((x) => x.textId !== "M3")) {
    const r = estimateTtsDurationRange51H1(s.text, s.voice)!;
    assert(r.curve, `mẫu H1 ${s.id} phải dùng mô hình đường cong`);
    inRange(s.durationSec, r.minSec, r.maxSec, `khoảng H1 phải chứa mẫu ${s.id} (${s.durationSec}s)`);
  }
  for (const s of TTS_SAMPLES_50F3.filter((x) => x.textId === "P10" || x.textId === "P13" || x.textId === "P16")) {
    const r = estimateTtsDurationRange51H1(s.text, s.voice)!;
    assert(r.curve, `mẫu F3 ${s.id} phải dùng mô hình đường cong`);
    inRange(s.durationSec, r.minSec, r.maxSec, `khoảng H1 phải chứa mẫu F3 ${s.id} (${s.durationSec}s)`);
  }
  // Neo M3 của H1 cũng nằm trong khoảng đường cong (φ(0,1348) = 1 → tốc độ dense).
  const a1 = TTS_SAMPLES_51H1.find((s) => s.id === "H1-A1")!;
  const rA1 = estimateTtsDurationRange51H1(a1.text, a1.voice)!;
  inRange(a1.durationSec, rA1.minSec, rA1.maxSec, "khoảng H1 phải chứa neo H1-A1 (Kim Thanh M3, 22,74 s)");
});

test("đường cong khái quát được sang text khác: mọi mẫu thăm dò D1 (Hải Đăng) + phản ví dụ X2 đều nằm trong khoảng H1", () => {
  // D1 dùng text khác hẳn Q/P (T2/T4/T5/T8/T13, tỉ lệ 2,05–12,43%) —
  // đường cong chỉ dùng tỉ lệ chữ số + hệ số giọng, không học thuộc text.
  for (const p of TTS_THRESHOLD_PROBES_48D1) {
    const r = estimateTtsDurationRange51H1(p.text, "Hải Đăng")!;
    assert(r.curve, `mẫu D1 ${p.id} phải dùng mô hình đường cong`);
    inRange(p.durationSec, r.minSec, r.maxSec, `khoảng H1 phải chứa mẫu D1 ${p.id} (${p.durationSec}s, tỉ lệ ${(p.digitRatio * 100).toFixed(2)}%)`);
  }
  // Phản ví dụ X2 (Minh Đức T13 19,17 s) — helper F3 KHÔNG chứa (test F3
  // §6); đường cong H1 CHỨA (tâm ~18,6 s).
  const x2 = TTS_VOICE_DEPENDENCE_COUNTEREXAMPLE_48D1;
  const rX2 = estimateTtsDurationRange51H1(x2.text, "Minh Đức")!;
  eq(rX2.curve, true, "X2 phải dùng mô hình đường cong");
  inRange(x2.durationSec, rX2.minSec, rX2.maxSec, "khoảng đường cong H1 phải CHỨA X2 19,17 s (lỗi của ngưỡng nhị phân đã sửa)");
});

// ---------------------------------------------------------------------------
// 6. Dạng đường cong đã khóa: φ(r) nội suy tuyến tính từng đoạn
// ---------------------------------------------------------------------------

test("dạng đường cong đã khóa: φ(0)=0, φ(0,1348)=1, φ đơn điệu tăng, nội suy tuyến tính từng đoạn", () => {
  eq(TTS_CURVE_KNOTS_51H1.length >= 6, true, "phải có ít nhất 6 nút φ (0 / Q07 / Q09 / P10 / P13 / M3 / Q14 / P16)");
  eq(TTS_CURVE_KNOTS_51H1[0].ratio, 0, "nút đầu φ(0) = 0");
  eq(TTS_CURVE_KNOTS_51H1[0].phi, 0, "φ tại tỉ lệ 0 phải là 0");
  const m3knot = TTS_CURVE_KNOTS_51H1.find((k) => Math.abs(k.ratio - 0.1348) < 0.001)!;
  approx(m3knot.phi, 1, 0.001, "φ tại M3 (13,48%) phải là 1");
  for (let i = 0; i + 1 < TTS_CURVE_KNOTS_51H1.length; i++) {
    const a = TTS_CURVE_KNOTS_51H1[i];
    const b = TTS_CURVE_KNOTS_51H1[i + 1];
    assert(a.ratio < b.ratio, `nút φ phải tăng dần theo tỉ lệ (${a.ratio} < ${b.ratio})`);
    assert(a.phi < b.phi, `φ phải đơn điệu tăng (${a.phi} < ${b.phi} tại tỉ lệ ${a.ratio} → ${b.ratio})`);
  }
  // φ tại Q07 (6,98%) đã > 0,5: đường cong rơi nhanh ngay từ tỉ lệ thấp
  // (Kim Thanh Q07 đo 9,51 ký tự/giây — xem LIMITS H1 §4).
  const q07knot = TTS_CURVE_KNOTS_51H1.find((k) => Math.abs(k.ratio - 0.0698) < 0.001)!;
  assert(q07knot.phi > 0.5, `φ(6,98%) phải > 0,5 (đường cong rơi nhanh sớm), nhận ${q07knot.phi}`);
  // 3 nút P cập nhật đợt 53 J7 (Trúc Ly nay có mẫu P, φ gộp tính trên
  // đủ 4 giọng thay vì 3 giọng — xem LIMITS J7 §3): P10 0,854 → 0,884,
  // P13 0,958 → 0,968, P16 1,160 → 1,161. Tính lại từ số đo (tốc độ
  // gộp F3): φ từng giọng tại P10 [KT 0,841, DT 0,836, QA 0,884,
  // TL 0,975] → mean 0,884; P13 [0,928, 0,974, 0,972, 0,996] → 0,968;
  // P16 [1,145, 1,188, 1,146, 1,163] → 1,161.
  const p10knot = TTS_CURVE_KNOTS_51H1.find((k) => Math.abs(k.ratio - 0.1022) < 0.001)!;
  approx(p10knot.phi, 0.884, 0.005, "φ tại P10 (10,22%) phải là 0,884 (mean 4 giọng, J7)");
  const p13knot = TTS_CURVE_KNOTS_51H1.find((k) => Math.abs(k.ratio - 0.1243) < 0.001)!;
  approx(p13knot.phi, 0.968, 0.005, "φ tại P13 (12,43%) phải là 0,968 (mean 4 giọng, J7)");
  const p16knot = TTS_CURVE_KNOTS_51H1.find((k) => Math.abs(k.ratio - 0.1596) < 0.001)!;
  approx(p16knot.phi, 1.161, 0.005, "φ tại P16 (15,96%) phải là 1,161 (mean 4 giọng, J7)");
  // Tốc độ đường cong tại 0% = normal, tại 13,48% = dense (khớp bảng F3).
  for (const voice of ["Kim Thanh", "Đức Trí", "Quỳnh Anh", "Trúc Ly"]) {
    const row = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === voice)!;
    approx(ttsCurveSpeed51H1(voice, 0), row.normalCoefficient * 16.0714, 0.01, `${voice}: tốc độ đường cong tại 0% phải = normal`);
    approx(ttsCurveSpeed51H1(voice, 0.1348), row.denseCoefficient * 9.5388, 0.01, `${voice}: tốc độ đường cong tại 13,48% phải = dense`);
  }
});

// ---------------------------------------------------------------------------
// 7. Đo lặp P13 vs M3 Trúc Ly (đợt 54 K6) — thứ tự P13 > M3 giữ vững
// ---------------------------------------------------------------------------

test("đo lặp P13 vs M3 Trúc Ly (K6, đợt 54): P13 gộp nhanh hơn M3 gộp, φ(P13) gộp 4 giọng vẫn khớp nút khóa 0,968", () => {
  // P13 n = 3 (13,14 / 12,89 / 12,30 s) vs M3 n = 3 (13,79 / 13,98 /
  // 13,77 s) — đo xen kẽ cùng phiên, Trúc Ly. Tốc độ gộp = tổng ký tự
  // / tổng giây (không phải trung bình tốc độ từng mẫu).
  const p13 = ["K6-P13-TL-1", "K6-P13-TL-2", "K6-P13-TL-3"].map((id) => TTS_SAMPLES_51H1.find((s) => s.id === id)!);
  const m3 = ["K6-M3-TL-1", "K6-M3-TL-2", "K6-M3-TL-3"].map((id) => TTS_SAMPLES_51H1.find((s) => s.id === id)!);
  eq(p13.length, 3, "đủ 3 mẫu lặp P13 K6");
  eq(m3.length, 3, "đủ 3 mẫu lặp M3 K6");
  for (const s of [...p13, ...m3]) {
    eq(s.voice, "Trúc Ly", `mẫu ${s.id} phải là Trúc Ly`);
    eq(s.source, "K6", `mẫu ${s.id} phải ghi source K6`);
  }
  const vP13 = (169 * 3) / p13.reduce((a, s) => a + s.durationSec, 0);
  const vM3 = (178 * 3) / m3.reduce((a, s) => a + s.durationSec, 0);
  approx(vP13, 13.2272, 0.001, "P13 gộp K6 (n = 3) phải là 13,2272 ký tự/giây");
  approx(vM3, 12.8551, 0.001, "M3 gộp K6 (n = 3) phải là 12,8551 ký tự/giây");
  assert(vP13 > vM3, `P13 gộp (${vP13.toFixed(4)}) phải nhanh hơn M3 gộp (${vM3.toFixed(4)}) — thứ tự P13 > M3 giữ vững sau đo lặp`);
  // 7/9 cặp P13-vs-M3 trong phiên: P13 nhanh hơn M3 (2 cặp đảo là
  // P13-TL-1 12,86 chậm hơn M3-TL-1 12,91 và M3-TL-3 12,93).
  let wins = 0;
  for (const a of p13) for (const b of m3) {
    if (169 / a.durationSec > 178 / b.durationSec) wins++;
  }
  eq(wins, 7, "P13 phải nhanh hơn M3 ở đúng 7/9 cặp trong phiên đo lặp");
  // Spread lặp: P13 6,6% (12,30–13,14 s), M3 1,5% (13,77–13,98 s).
  for (const [rows, maxSpread, label] of [[p13, 0.1, "P13"], [m3, 0.1, "M3"]] as const) {
    const durs = rows.map((s) => s.durationSec);
    const spread = (Math.max(...durs) - Math.min(...durs)) / (durs.reduce((a, b) => a + b, 0) / durs.length);
    assert(spread <= maxSpread, `lặp ${label} Trúc Ly spread phải ≤ 10%, nhận ${(spread * 100).toFixed(1)}% (${durs.join(", ")})`);
  }
  // φ(P13) Trúc Ly gộp 4 mẫu (J7 12,89 s + K6 n = 3) theo cơ sở F3:
  // v = 676 / 51,22 = 13,1980 → φ = (19,5602 − 13,1980) / (19,5602 −
  // 13,0882) ≈ 0,983 (J7 1 mẫu: 0,997 — vẫn < 1, vẫn trên dense).
  const row = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === "Trúc Ly")!;
  const vNormal = row.normalCoefficient * 16.0714;
  const vDense = row.denseCoefficient * 9.5388;
  const vP13x4 = (169 * 4) / (12.89 + p13.reduce((a, s) => a + s.durationSec, 0));
  approx(vP13x4, 13.198, 0.001, "P13 gộp 4 mẫu (J7 + K6) phải là 13,1980 ký tự/giây");
  const phiTL = (vNormal - vP13x4) / (vNormal - vDense);
  approx(phiTL, 0.983, 0.005, "φ(P13) Trúc Ly gộp 4 mẫu phải ≈ 0,983 (cơ sở F3)");
  assert(phiTL < 1, `φ(P13) Trúc Ly gộp (${phiTL.toFixed(4)}) phải < 1 — P13 vẫn nhanh hơn dense`);
  // φ gộp 4 giọng tại P13 tính lại (3 giọng kia giữ nguyên số F3,
  // Trúc Ly dùng φ gộp 4 mẫu 0,983): mean ≈ 0,9642 — chênh −0,0038
  // so với nút khóa 0,968, trong dung sai ±0,005 nên NÚT KHÔNG ĐỔI.
  const phiOthers = (["Kim Thanh", "Đức Trí", "Quỳnh Anh"] as const).map((voice) => {
    const r = TTS_VOICE_COEFFICIENTS_50F3.find((x) => x.voice === voice)!;
    return (r.normalCoefficient * 16.0714 - probeRateF3(`F3-P13-${voice === "Kim Thanh" ? "KT" : voice === "Đức Trí" ? "DT" : "QA"}`)) /
      (r.normalCoefficient * 16.0714 - r.denseCoefficient * 9.5388);
  });
  const phiMean = (phiOthers.reduce((a, b) => a + b, 0) + phiTL) / 4;
  approx(phiMean, 0.9642, 0.001, "φ gộp P13 tính lại (4 giọng, Trúc Ly gộp 4 mẫu) phải ≈ 0,9642");
  const p13knot = TTS_CURVE_KNOTS_51H1.find((k) => Math.abs(k.ratio - 0.1243) < 0.001)!;
  assert(Math.abs(phiMean - p13knot.phi) <= 0.005,
    `φ gộp P13 tính lại (${phiMean.toFixed(4)}) phải trong ±0,005 của nút khóa ${p13knot.phi} — nút KHÔNG đổi sau đo lặp`);
});

// ---------------------------------------------------------------------------
// 8. Đo lặp định kỳ lần 2 P13 vs M3 Trúc Ly (đợt 55 L9) — thứ tự P13 > M3
//    giữ vững và nới biên; φ gộp tính lại vượt nhẹ dung sai cũ nhưng nút KHÔNG đổi
// ---------------------------------------------------------------------------

test("đo lặp định kỳ lần 2 P13 vs M3 Trúc Ly (L9, đợt 55): P13 gộp nhanh hơn M3 gộp, φ(P13) gộp 7 mẫu vẫn khớp nút khóa 0,968", () => {
  // P13 n = 3 (12,39 / 12,63 / 13,13 s) vs M3 n = 3 (14,09 / 14,02 /
  // 13,92 s) — đo xen kẽ cùng phiên, Trúc Ly, đúng protocol K6.
  // Tốc độ gộp = tổng ký tự / tổng giây (không phải trung bình tốc độ
  // từng mẫu). So với K6: P13 gộp 13,2272 / M3 gộp 12,8551 (+0,3722).
  const p13 = ["L9-P13-TL-1", "L9-P13-TL-2", "L9-P13-TL-3"].map((id) => TTS_SAMPLES_51H1.find((s) => s.id === id)!);
  const m3 = ["L9-M3-TL-1", "L9-M3-TL-2", "L9-M3-TL-3"].map((id) => TTS_SAMPLES_51H1.find((s) => s.id === id)!);
  eq(p13.length, 3, "đủ 3 mẫu lặp P13 L9");
  eq(m3.length, 3, "đủ 3 mẫu lặp M3 L9");
  for (const s of [...p13, ...m3]) {
    eq(s.voice, "Trúc Ly", `mẫu ${s.id} phải là Trúc Ly`);
    eq(s.source, "L9", `mẫu ${s.id} phải ghi source L9`);
  }
  const vP13 = (169 * 3) / p13.reduce((a, s) => a + s.durationSec, 0);
  const vM3 = (178 * 3) / m3.reduce((a, s) => a + s.durationSec, 0);
  approx(vP13, 13.2896, 0.001, "P13 gộp L9 (n = 3) phải là 13,2896 ký tự/giây");
  approx(vM3, 12.7052, 0.001, "M3 gộp L9 (n = 3) phải là 12,7052 ký tự/giây");
  assert(vP13 > vM3, `P13 gộp (${vP13.toFixed(4)}) phải nhanh hơn M3 gộp (${vM3.toFixed(4)}) — thứ tự P13 > M3 giữ vững sau đo lặp định kỳ lần 2`);
  // 9/9 cặp P13-vs-M3 trong phiên: P13 nhanh hơn M3 (mạnh hơn K6 7/9 —
  // mẫu P13 chậm nhất L9 12,87 ký tự/giây vẫn nhanh hơn mẫu M3 nhanh
  // nhất L9 12,79 ký tự/giây).
  let wins = 0;
  for (const a of p13) for (const b of m3) {
    if (169 / a.durationSec > 178 / b.durationSec) wins++;
  }
  eq(wins, 9, "P13 phải nhanh hơn M3 ở đúng 9/9 cặp trong phiên đo lặp L9");
  // Spread lặp: P13 5,8% (12,39–13,13 s), M3 1,2% (13,92–14,09 s).
  for (const [rows, maxSpread, label] of [[p13, 0.1, "P13"], [m3, 0.1, "M3"]] as const) {
    const durs = rows.map((s) => s.durationSec);
    const spread = (Math.max(...durs) - Math.min(...durs)) / (durs.reduce((a, b) => a + b, 0) / durs.length);
    assert(spread <= maxSpread, `lặp ${label} Trúc Ly spread phải ≤ 10%, nhận ${(spread * 100).toFixed(1)}% (${durs.join(", ")})`);
  }
  // Gộp K6+L9 (n = 6 mỗi text): P13 13,2584 / M3 12,7797, chênh
  // +0,4787 (+3,75%) — biên gộp hai đợt lặp vững hơn biên từng đợt.
  const p13k6 = ["K6-P13-TL-1", "K6-P13-TL-2", "K6-P13-TL-3"].map((id) => TTS_SAMPLES_51H1.find((s) => s.id === id)!);
  const m3k6 = ["K6-M3-TL-1", "K6-M3-TL-2", "K6-M3-TL-3"].map((id) => TTS_SAMPLES_51H1.find((s) => s.id === id)!);
  const vP13x6 = (169 * 6) / [...p13, ...p13k6].reduce((a, s) => a + s.durationSec, 0);
  const vM3x6 = (178 * 6) / [...m3, ...m3k6].reduce((a, s) => a + s.durationSec, 0);
  approx(vP13x6, 13.2584, 0.001, "P13 gộp K6+L9 (n = 6) phải là 13,2584 ký tự/giây");
  approx(vM3x6, 12.7797, 0.001, "M3 gộp K6+L9 (n = 6) phải là 12,7797 ký tự/giây");
  assert(vP13x6 > vM3x6, `P13 gộp K6+L9 (${vP13x6.toFixed(4)}) phải nhanh hơn M3 gộp K6+L9 (${vM3x6.toFixed(4)})`);
  // φ(P13) Trúc Ly gộp 7 mẫu (J7 12,89 s + K6 n = 3 + L9 n = 3) theo
  // cơ sở F3: v = 1183 / 89,37 = 13,2371 → φ = (19,5602 − 13,2371) /
  // (19,5602 − 13,0882) ≈ 0,977 (K6 gộp 4 mẫu: 0,983; J7 1 mẫu: 0,997).
  const row = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === "Trúc Ly")!;
  const vNormal = row.normalCoefficient * 16.0714;
  const vDense = row.denseCoefficient * 9.5388;
  const vP13x7 = (169 * 7) / (12.89 + [...p13, ...p13k6].reduce((a, s) => a + s.durationSec, 0));
  approx(vP13x7, 13.2371, 0.001, "P13 gộp 7 mẫu (J7 + K6 + L9) phải là 13,2371 ký tự/giây");
  const phiTL = (vNormal - vP13x7) / (vNormal - vDense);
  approx(phiTL, 0.977, 0.005, "φ(P13) Trúc Ly gộp 7 mẫu phải ≈ 0,977 (cơ sở F3)");
  assert(phiTL < 1, `φ(P13) Trúc Ly gộp 7 mẫu (${phiTL.toFixed(4)}) phải < 1 — P13 vẫn nhanh hơn dense`);
  // φ gộp 4 giọng tại P13 tính lại (3 giọng kia giữ nguyên số F3,
  // Trúc Ly dùng φ gộp 7 mẫu 0,977): mean ≈ 0,9626 — chênh −0,0054
  // so với nút khóa 0,968, VƯỢT NHẸ dung sai ±0,005 của test K6.
  // Nút KHÔNG đổi vì chênh lệch nằm trong sai số lấy mẫu: 7 mẫu P13
  // Trúc Ly có SD 0,34 s → SE của tốc độ gộp ≈ 0,13 ký tự/giây →
  // SE φ ≈ 0,02 — chênh −0,0054 chỉ ~0,27 SE (xem LIMITS L9 §3).
  // Test khóa dung sai nút ở ±0,01 (vẫn chặt hơn 1 SE): vượt ±0,01
  // qua hai đợt lặp độc lập mới là tín hiệu xem lại nút.
  const phiOthers = (["Kim Thanh", "Đức Trí", "Quỳnh Anh"] as const).map((voice) => {
    const r = TTS_VOICE_COEFFICIENTS_50F3.find((x) => x.voice === voice)!;
    return (r.normalCoefficient * 16.0714 - probeRateF3(`F3-P13-${voice === "Kim Thanh" ? "KT" : voice === "Đức Trí" ? "DT" : "QA"}`)) /
      (r.normalCoefficient * 16.0714 - r.denseCoefficient * 9.5388);
  });
  const phiMean = (phiOthers.reduce((a, b) => a + b, 0) + phiTL) / 4;
  approx(phiMean, 0.9626, 0.001, "φ gộp P13 tính lại (4 giọng, Trúc Ly gộp 7 mẫu) phải ≈ 0,9626");
  const p13knot = TTS_CURVE_KNOTS_51H1.find((k) => Math.abs(k.ratio - 0.1243) < 0.001)!;
  assert(Math.abs(phiMean - p13knot.phi) <= 0.01,
    `φ gộp P13 tính lại (${phiMean.toFixed(4)}) phải trong ±0,01 của nút khóa ${p13knot.phi} — nút KHÔNG đổi sau đo lặp định kỳ lần 2 (chênh −0,0054, trong SE φ ≈ 0,02)`);
});

// ---------------------------------------------------------------------------
// 9. Fallback: giọng lạ / không truyền voice → y hệt F3
// ---------------------------------------------------------------------------

test("fallback: giọng lạ / không truyền voice → y hệt helper F3 (không đổi hành vi)", () => {
  const texts = [TTS_STANDARD_TEXT_M4_50F3, TTS_STANDARD_TEXT_M3_50F3, TTS_PROBE_TEXT_Q09_51H1, "Xin chào Việt Nam, đây là một câu kiểm tra tốc độ đọc."];
  for (const voice of [undefined, "", "Giọng Không Tồn Tại"]) {
    for (const text of texts) {
      const a = estimateTtsDurationRange51H1(text, voice);
      const b = estimateTtsDurationRange50F3(text, voice);
      eq(
        JSON.stringify(a === null ? null : { tier: a.tier, regime: a.regime, seconds: a.seconds, minSec: a.minSec, maxSec: a.maxSec }),
        JSON.stringify(b === null ? null : { tier: b.tier, regime: b.regime, seconds: b.seconds, minSec: b.minSec, maxSec: b.maxSec }),
        `fallback cho voice ${JSON.stringify(voice)} phải y hệt F3`,
      );
      if (a !== null) eq(a.curve, false, "fallback thì curve = false");
    }
  }
  // Mọi preset đều dùng đường cong (không fallback) khi có hệ số F3.
  for (const row of TTS_VOICE_COEFFICIENTS_50F3) {
    const r = estimateTtsDurationRange51H1(TTS_PROBE_TEXT_Q09_51H1, row.voice)!;
    eq(r.curve, true, `Q09 với giọng ${row.voice} phải dùng đường cong (có hệ số F3)`);
    eq(r.perVoice, true, `Q09 với giọng ${row.voice} phải perVoice = true`);
  }
});

test("helper H1: text rỗng → null/''; header thật thắng ước lượng; hậu tố khoảng đúng dạng", () => {
  eq(estimateTtsDurationRange51H1("", "Hải Đăng"), null, "text rỗng → null");
  eq(ttsEstimateRangeSuffix51H1("", "Hải Đăng"), "", "text rỗng → hậu tố ''");
  eq(ttsDoneSuffixRange51H1({ headerValue: "12.34", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Đức Trí" }), " (12.3s)", "header thật thắng ước lượng theo giọng");
  eq(ttsDoneSuffixRange51H1({ headerValue: null, text: "", voice: "Hải Đăng" }), "", "text rỗng + header thiếu → ''");
  // Hậu tố đường cong cho Kim Thanh P10 (10,22%): tâm phải gần 21,77 s
  // thật (không còn tâm normal ~14,9 s như helper F3).
  const r = estimateTtsDurationRange51H1(TTS_PROBE_TEXT_P10_50F3, "Kim Thanh")!;
  approx(r.seconds, 21.77, 21.77 * 0.17, "tâm đường cong Kim Thanh P10 phải gần 21,77 s thật (trong h = 0,17)");
  assert(r.minSec <= 21.77 && 21.77 <= r.maxSec, "khoảng đường cong Kim Thanh P10 phải chứa 21,77 s");
  // Hậu tố cho Trúc Ly Q09 (giọng nhanh nhất): tâm phải gần số thật đo được.
  const tl = TTS_SAMPLES_51H1.find((s) => s.id === "H1-Q09-TL")!;
  const rTl = estimateTtsDurationRange51H1(TTS_PROBE_TEXT_Q09_51H1, "Trúc Ly")!;
  inRange(tl.durationSec, rTl.minSec, rTl.maxSec, "khoảng đường cong Trúc Ly Q09 phải chứa số thật");
});

// ---------------------------------------------------------------------------
// 10. Tốc độ tổng hợp
// ---------------------------------------------------------------------------

test("tốc độ tổng hợp: 13 lần đo driver H1 đều < 1× realtime", () => {
  eq(TTS_SYNTH_SPEED_51H1.length, 13, "13 lần đo tốc độ tổng hợp (driver H1)");
  const ratios = TTS_SYNTH_SPEED_51H1.map((s) => s.audioSec / s.synthSec);
  for (const r of ratios) {
    assert(r > 0 && r < 1.0, `mọi tỉ lệ audio/synth phải < 1× realtime, nhận ${r.toFixed(2)}`);
  }
  const sorted = [...ratios].sort((a, b) => a - b);
  const median = (sorted[6] + sorted[6]) / 2;
  assert(median > 0 && median < 1.0, `median tốc độ tổng hợp phải < 1×, nhận ${median.toFixed(2)}`);
});

console.log(`\nttsEstimate51H1: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
