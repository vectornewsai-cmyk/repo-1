/**
 * ttsEstimate51H2.test.ts — Test cho đợt 51 luồng H2 (ROUND51-H2),
 * HOÀN TẤT ở đợt 52 luồng I1 (ROUND52-I1).
 *
 * Đóng nợ F3 §8.2 (ĐÃ ĐÓNG — xem LIMITS H2 §6 + LIMITS đợt 52 I1):
 * đo lặp hệ số TTS cho các giọng n = 1. Kế hoạch đủ là 83 mẫu để mọi
 * giọng về n ≥ 3; đợt 51 đo được 37 mẫu, đợt 52 đo tiếp 46 mẫu còn lại
 * bằng driver resume — NAY ĐỦ 83/83, 25/25 giọng n ≥ 3 cả hai chế độ
 * (Kim Thanh dense n = 5 nhờ neo). Không còn giọng nào nợ n < 3.
 *
 * Khóa:
 * 1. Text chuẩn M3/M4 H2 trùng F3; đủ 83 mẫu (2 neo + 42 M3 + 39 M4);
 *    id duy nhất; digitRatio khớp text.
 * 2. Neo kiểm chứng driver: A1 Kim Thanh M3 lệch ≤ 3,5% so với mọi lần
 *    đo E1/F3; A2 Hải Đăng M4 nằm trong spread M4 đã biết.
 * 3. Bảng hệ số H2: tính lại từ pool mẫu gộp (C4/D1/E1/F3 + H2) —
 *    normal f = tốc độ gộp trên text medium / 16,0714; dense g = tốc độ
 *    gộp trên M3 / 9,5388. 25/25 giọng đạt normalN ≥ 3 và denseN ≥ 3.
 * 4. Nhất quán: mọi mẫu M3/M4 đã đo (mọi pool) đều nằm trong khoảng
 *    theo giọng h = 0,17 của tâm gộp MỚI; độ lệch lớn nhất của một mẫu
 *    so với tâm gộp là 11,3% (Hải Đăng normal); giọng nào ngoài khoảng
 *    mà không có ghi chú thì test ĐỎ.
 * 5. Dense chênh normal: tốc độ dense luôn chậm hơn normal ở mọi giọng;
 *    tỉ lệ dense/normal theo giọng nằm trong dải đã khóa 0,6199–0,6829
 *    (min Xuân Vĩnh, max Phạm Tuyên); hệ số dense riêng vẫn bắt buộc
 *    (không suy từ normal).
 * 6. Lặp ưu tiên: Trúc Ly, Quốc Tuấn, Đức Trí, Kim Thanh — mỗi giọng
 *    n ≥ 3 cả hai chế độ; các lần lặp cùng giọng+text lệch nhau ≤ 5%.
 * 7. Tốc độ tổng hợp: mọi lần đo H2 đều < 1× realtime (0,02–0,51×,
 *    median 0,12×, tổng synth 11427,5 s).
 * 8. calibrated (quy tắc C4: n ≥ 3): đúng 25 dòng trong bảng H2 đủ
 *    điều kiện calibrated ở cả hai chế độ — nợ F3 §8.2 đã đóng.
 * 9. Transfer M5 (đợt 53 J7): text medium thứ hai M5 (190 ký tự, 0 chữ
 *    số) đọc nhanh bằng hoặc hơn M4 — transfer M4-only/M5 chỉ
 *    0,90–1,01, KHÔNG phải 1,172 của F3 trên text có chữ số; transfer
 *    phụ thuộc text, không phải hằng số giọng; 8 mẫu M5 KHÔNG gộp vào
 *    pool H2 (normalN giữ nguyên). Tốc độ tổng hợp J7: 12 lần đo,
 *    0,33–0,60×, median 0,51×, tổng synth 312,3 s — đều < 1×.
 * 10. Transfer M6 (đợt 54 K6): text medium thứ ba M6 (183 ký tự, 23 chữ
 *    số = 12,57%) cho transfer M4-only/M6 1,42–1,58 — transfer tăng
 *    theo tỉ lệ chữ số của text (0% → ~0,95; ít số → 1,17; ~13% →
 *    ~1,47); M6 hành xử như text dense (chỉ nhanh hơn dense H2
 *    1,6–8,0%, trong h = 0,17 — KHÔNG nới h); 8 mẫu M6 KHÔNG gộp vào
 *    pool H2 (normalN giữ nguyên). Tốc độ tổng hợp K6: 14 lần đo,
 *    0,08–0,59×, median 0,19×, tổng synth 1400,4 s — đều < 1×.
 * 11. Transfer M6 lặp (đợt 55 L9): đo lặp đúng protocol K6, n = 2 cho
 *    4 giọng K6 + n = 2 MỚI cho Trúc Ly (giọng thứ 5) — cả 5 transfer
 *    đều trong dải K6 1,42–1,58 (mean 1,4982; gộp K6+L9 n = 4 mean
 *    1,4944); Trúc Ly MỚI 1,5102; 10 mẫu M6 L9 KHÔNG gộp vào pool H2.
 *    Tốc độ tổng hợp L9: 16 lần đo, 0,03–0,54×, median 0,16×, tổng
 *    synth 2064,2 s — đều < 1×.
 *
 * Chạy bằng esbuild bundle (quy ước đợt 45/46/47/48/49/50):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/ttsEstimate51H2.test.ts \
 *     --bundle --format=esm --platform=node --outfile=/tmp/tts51h2.test.mjs
 *   REPO_ROOT=$PWD node /tmp/tts51h2.test.mjs
 */
import { TTS_SAMPLES_NEW_47C4 } from "./ttsEstimate47C4";
import {
  TTS_DENSE_CROSS_HAIDANG_48D1,
  TTS_NEW_VOICES_48D1,
  TTS_THRESHOLD_PROBES_48D1,
  TTS_VARIANCE_48D1,
} from "./ttsEstimate48D1";
import {
  TTS_SAMPLES_RUN1_49E1,
  TTS_SAMPLES_RUN2_49E1,
  TTS_SAMPLES_CLI_49E1,
  TTS_STANDARD_TEXT_M3_49E1,
  TTS_STANDARD_TEXT_M4_49E1,
} from "./ttsEstimate49E1";
import {
  TTS_STANDARD_TEXT_M3_50F3,
  TTS_STANDARD_TEXT_M4_50F3,
  TTS_SAMPLES_50F3,
  TTS_SYNTH_SPEED_50F3,
  TTS_VOICE_COEFFICIENTS_50F3,
} from "./ttsEstimate50F3";
import {
  TTS_PER_VOICE_MAX_FACTOR_51H2,
  TTS_PER_VOICE_MIN_FACTOR_51H2,
  TTS_SAMPLES_51H2,
  TTS_SAMPLES_M5_53J7,
  TTS_SAMPLES_M6_54K6,
  TTS_SAMPLES_M6_55L9,
  TTS_STANDARD_TEXT_M3_51H2,
  TTS_STANDARD_TEXT_M4_51H2,
  TTS_STANDARD_TEXT_M5_53J7,
  TTS_STANDARD_TEXT_M6_54K6,
  TTS_SYNTH_META_51H2,
  TTS_SYNTH_SPEED_51H2,
  TTS_SYNTH_SPEED_53J7,
  TTS_SYNTH_SPEED_54K6,
  TTS_SYNTH_SPEED_55L9,
  TTS_VOICE_COEFFICIENTS_51H2,
} from "./ttsEstimate51H2";
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

/**
 * Pool mẫu gộp theo giọng — Y HỆT test F3 §3 + mẫu H2 (xem
 * compute51h2.ts). Trả về { normal: {voice: durations[]}, dense: {...} }
 * cùng số ký tự từng lần đo (medium: M4 169, C4-M5 190, probe T2/T4/T5
 * theo text thật; M3: 178).
 */
function buildPools(): {
  normal: Record<string, Array<{ chars: number; secs: number }>>;
  dense: Record<string, Array<{ chars: number; secs: number }>>;
} {
  const normal: Record<string, Array<{ chars: number; secs: number }>> = {};
  const dense: Record<string, Array<{ chars: number; secs: number }>> = {};
  const addN = (voice: string, chars: number, secs: number) => {
    (normal[voice] ??= []).push({ chars, secs });
  };
  const addD = (voice: string, chars: number, secs: number) => {
    (dense[voice] ??= []).push({ chars, secs });
  };
  for (const s of TTS_NEW_VOICES_48D1) addN(s.voice, 169, s.durationSec);
  addN("Thùy Dung", 169, TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M4")!.durationSec);
  addN("Thiền Tâm Đức", 169, TTS_VARIANCE_48D1.find((r) => r.id === "D1-X3")!.durationSec);
  addN("Mỹ Duyên", 169, TTS_VARIANCE_48D1.find((r) => r.id === "D1-X4")!.durationSec);
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.textId === "M4") addN(s.voice, 169, s.durationSec);
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.textId === "M4") addN(s.voice, 169, s.durationSec);
  }
  for (const s of TTS_SAMPLES_50F3) {
    if (s.textId === "M4") addN(s.voice, 169, s.durationSec);
  }
  for (const s of TTS_SAMPLES_51H2) {
    if (s.textId === "M4") addN(s.voice, 169, s.durationSec);
  }
  for (const s of TTS_THRESHOLD_PROBES_48D1.filter((p) => p.digitRatio <= 0.051)) {
    addN("Hải Đăng", ttsTextLength(s.text), s.durationSec);
  }
  {
    const m5 = TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M5")!;
    addN("Thái Sơn", 190, m5.durationSec);
  }
  addD("Minh Đức", 178, TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M3")!.durationSec);
  addD("Hải Đăng", 178, TTS_DENSE_CROSS_HAIDANG_48D1.durationSec);
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.textId === "M3") addD(s.voice, 178, s.durationSec);
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.textId === "M3") addD(s.voice, 178, s.durationSec);
  }
  for (const s of TTS_SAMPLES_50F3) {
    if (s.textId === "M3") addD(s.voice, 178, s.durationSec);
  }
  for (const s of TTS_SAMPLES_51H2) {
    if (s.textId === "M3") addD(s.voice, 178, s.durationSec);
  }
  return { normal, dense };
}

/** Tốc độ gộp của một pool {chars, secs}[]. */
function poolRate(pool: Array<{ chars: number; secs: number }>): number {
  const c = pool.reduce((a, x) => a + x.chars, 0);
  const s = pool.reduce((a, x) => a + x.secs, 0);
  return c / s;
}

// ---------------------------------------------------------------------------
// 1. Text chuẩn + đủ 83 mẫu
// ---------------------------------------------------------------------------

test("text chuẩn H2 trùng F3: M3 178 ký tự / 24 chữ số, M4 169 ký tự / 0 chữ số; đủ 83 mẫu", () => {
  eq(TTS_STANDARD_TEXT_M3_51H2, TTS_STANDARD_TEXT_M3_50F3, "M3 H2 phải trùng text M3 F3");
  eq(TTS_STANDARD_TEXT_M4_51H2, TTS_STANDARD_TEXT_M4_50F3, "M4 H2 phải trùng text M4 F3");
  eq(TTS_STANDARD_TEXT_M3_51H2, TTS_STANDARD_TEXT_M3_49E1, "M3 H2 phải trùng text M3 E1");
  eq(TTS_STANDARD_TEXT_M4_51H2, TTS_STANDARD_TEXT_M4_49E1, "M4 H2 phải trùng text M4 E1");
  eq(ttsTextLength(TTS_STANDARD_TEXT_M3_51H2), 178, "M3 đúng 178 ký tự");
  eq(ttsTextLength(TTS_STANDARD_TEXT_M4_51H2), 169, "M4 đúng 169 ký tự");
  eq((TTS_STANDARD_TEXT_M3_51H2.match(/[0-9]/g) ?? []).length, 24, "M3 có 24 chữ số (13,48%)");
  eq((TTS_STANDARD_TEXT_M4_51H2.match(/[0-9]/g) ?? []).length, 0, "M4 có 0 chữ số");
  eq(TTS_SAMPLES_51H2.length, 83, "đủ 83 mẫu H2 (2 neo + 42 M3 + 39 M4 — kế hoạch đủ, nợ F3 §8.2 đã đóng ở đợt 52 I1)");
  eq(TTS_SAMPLES_51H2.filter((s) => s.textId === "M3").length, 43, "43 mẫu M3 (gồm neo A1)");
  eq(TTS_SAMPLES_51H2.filter((s) => s.textId === "M4").length, 40, "40 mẫu M4 (gồm neo A2)");
  const ids = new Set(TTS_SAMPLES_51H2.map((s) => s.id));
  eq(ids.size, 83, "id mẫu H2 phải duy nhất");
  for (const s of TTS_SAMPLES_51H2) {
    const digits = (s.text.match(/[0-9]/g) ?? []).length;
    approx(digits / ttsTextLength(s.text), s.digitRatio, 0.001, `digitRatio mẫu ${s.id} phải khớp text`);
    eq(s.source, "H2", `mẫu ${s.id} phải ghi source H2`);
    assert(s.durationSec > 0, `mẫu ${s.id} phải có độ dài > 0`);
  }
});

// ---------------------------------------------------------------------------
// 2. Neo kiểm chứng driver
// ---------------------------------------------------------------------------

test("neo A1/A2: driver H2 đúng đường đo — lệch nhỏ so với E1/F3", () => {
  const a1 = TTS_SAMPLES_51H2.find((s) => s.id === "H2-A1")!;
  eq(a1.voice, "Kim Thanh", "neo A1 là Kim Thanh M3");
  approx(a1.durationSec, 22.28, 0.01, "neo A1 Kim Thanh M3 phải là 22,28 s (đo thật H2)");
  // Neo A1 lệch tối đa 3,3% so với các lần đo E1 (22,92/23,03/23,00) —
  // lớn hơn mức ≤ 2,2% của neo F3 nhưng vẫn nhỏ, trong khoảng theo giọng.
  for (const d of [22.92, 23.03, 23.0, 22.53]) {
    const dev = Math.abs(a1.durationSec - d) / d;
    assert(dev <= 0.035, `neo A1 lệch so với lần đo trước ${d}s phải ≤ 3,5%, nhận ${(dev * 100).toFixed(1)}%`);
  }
  const a2 = TTS_SAMPLES_51H2.find((s) => s.id === "H2-A2")!;
  eq(a2.voice, "Hải Đăng", "neo A2 là Hải Đăng M4");
  approx(a2.durationSec, 9.04, 0.01, "neo A2 Hải Đăng M4 phải là 9,04 s (đo thật H2)");
  inRange(a2.durationSec, 8.4, 9.28, "neo A2 phải nằm trong spread M4 đã biết của Hải Đăng (8,40–9,28 s)");
});

// ---------------------------------------------------------------------------
// 3. Bảng hệ số H2: tính lại từ pool + mọi giọng n ≥ 3 (đóng nợ F3 §8.2)
// ---------------------------------------------------------------------------

test("bảng hệ số H2: f/g mỗi giọng tính lại từ pool gộp (C4/D1/E1/F3 + H2)", () => {
  const { normal, dense } = buildPools();
  eq(Object.keys(normal).length, 25, "25 giọng có số medium normal");
  eq(Object.keys(dense).length, 25, "25 giọng có số M3 dense");
  eq(TTS_VOICE_COEFFICIENTS_51H2.length, 25, "bảng H2 có đúng 25 dòng");
  for (const row of TTS_VOICE_COEFFICIENTS_51H2) {
    const nPool = normal[row.voice];
    const dPool = dense[row.voice];
    assert(nPool && nPool.length === row.normalN, `giọng ${row.voice} phải có normalN = ${row.normalN} lần đo medium, nhận ${nPool?.length}`);
    assert(dPool && dPool.length === row.denseN, `giọng ${row.voice} phải có denseN = ${row.denseN} lần đo M3, nhận ${dPool?.length}`);
    approx(poolRate(nPool) / 16.0714, row.normalCoefficient, 0.001, `hệ số normal của ${row.voice} tính lại từ pool`);
    approx(poolRate(dPool) / 9.5388, row.denseCoefficient, 0.001, `hệ số dense của ${row.voice} tính lại từ pool`);
    // Spread ghi trong bảng phải khớp độ lệch lớn nhất thật của pool.
    const nRate = poolRate(nPool);
    const dRate = poolRate(dPool);
    let nSpread = 0;
    for (const x of nPool) nSpread = Math.max(nSpread, Math.abs(x.secs - x.chars / nRate) / (x.chars / nRate));
    let dSpread = 0;
    for (const x of dPool) dSpread = Math.max(dSpread, Math.abs(x.secs - x.chars / dRate) / (x.chars / dRate));
    approx(nSpread * 100, row.normalSpreadPct, 0.2, `spread normal của ${row.voice} phải khớp pool`);
    approx(dSpread * 100, row.denseSpreadPct, 0.2, `spread dense của ${row.voice} phải khớp pool`);
    // Tỉ lệ dense/normal ghi trong bảng phải khớp tốc độ gộp.
    approx(dRate / nRate, row.denseNormalRatio, 0.001, `tỉ lệ dense/normal của ${row.voice} phải khớp pool`);
  }
});

test("nợ F3 §8.2 ĐÃ ĐÓNG (đợt 52 I1): 25/25 giọng đã normalN ≥ 3 và denseN ≥ 3; không còn giọng nợ", () => {
  // Đối chiếu F3: trước H2 có 16 giọng normal n = 1 và 18 giọng dense n = 1.
  const f3n1 = TTS_VOICE_COEFFICIENTS_50F3.filter((r) => r.normalN === 1).length;
  const f3d1 = TTS_VOICE_COEFFICIENTS_50F3.filter((r) => r.denseN === 1).length;
  eq(f3n1, 16, "bảng F3 có 16 giọng normal n = 1 (điểm xuất phát của nợ)");
  eq(f3d1, 18, "bảng F3 có 18 giọng dense n = 1 (điểm xuất phát của nợ)");
  // Đợt 51 đo 37 mẫu → 10 giọng đủ; đợt 52 I1 đo tiếp 46 mẫu còn lại
  // bằng driver resume → nay 25/25 giọng đủ n ≥ 3 cả hai chế độ.
  for (const row of TTS_VOICE_COEFFICIENTS_51H2) {
    assert(row.normalN >= 3, `giọng ${row.voice} phải có normalN ≥ 3, nhận ${row.normalN}`);
    assert(row.denseN >= 3, `giọng ${row.voice} phải có denseN ≥ 3, nhận ${row.denseN}`);
  }
  // 15 giọng từng nợ ở đợt 51 nay đều đã đủ — khóa rõ để không ai
  // tưởng chúng vẫn thiếu (danh sách cũ ở LIMITS H2 §6, nay đã đóng).
  const formerlyRemaining: string[] = ["Thiền Tâm Đức", "Minh Đức",
    "Mỹ Duyên", "Thục Đoan", "Adam bựa", "Thái Sơn", "Quỳnh Anh",
    "Hải Đăng", "Ngọc Huyền", "Thiện Minh", "Adam", "Thùy Dung",
    "Xuân Vĩnh", "Minh Triết", "Thanh Bình"];
  eq(formerlyRemaining.length, 15, "đúng 15 giọng từng nợ ở đợt 51");
  for (const voice of formerlyRemaining) {
    const row = TTS_VOICE_COEFFICIENTS_51H2.find((r) => r.voice === voice)!;
    // normalN = 3 cho mọi giọng, trừ Mỹ Duyên và Hải Đăng vốn đã có
    // n = 8 từ các đợt trước (pool medium cũ lớn, không đo thêm M4).
    const wantN = voice === "Mỹ Duyên" || voice === "Hải Đăng" ? 8 : 3;
    eq(row.normalN, wantN, `giọng từng nợ ${voice} nay phải có normalN = ${wantN}`);
    eq(row.denseN, 3, `giọng từng nợ ${voice} nay phải có denseN = 3`);
  }
  // Kim Thanh dense đã n = 4 ở F3, nay n = 5 nhờ neo A1 (không đo thêm
  // M3 cho cô ngoài neo — xem LIMITS H2).
  const kt = TTS_VOICE_COEFFICIENTS_51H2.find((r) => r.voice === "Kim Thanh")!;
  eq(kt.denseN, 5, "Kim Thanh dense n = 5 (F3 ×4 + neo H2-A1)");
});

// ---------------------------------------------------------------------------
// 4. Nhất quán: mọi mẫu trong khoảng theo giọng h = 0,17 của tâm gộp mới
// ---------------------------------------------------------------------------

test("mọi mẫu M3/M4 đã đo đều nằm trong khoảng theo giọng H2 (h = 0,17) của giọng đó", () => {
  const { normal, dense } = buildPools();
  let maxDev = 0;
  let maxDevId = "";
  const check = (pool: Array<{ chars: number; secs: number }>, rate: number, voice: string, textId: string) => {
    for (const x of pool) {
      const center = x.chars / rate;
      const dev = Math.abs(x.secs - center) / center;
      if (dev > maxDev) { maxDev = dev; maxDevId = `${voice} ${textId} ${x.secs}s`; }
      assert(dev <= 0.17, `mẫu ${voice} ${textId} ${x.secs}s lệch ${(dev * 100).toFixed(1)}% so với tâm gộp — ngoài khoảng h = 0,17, cần ghi chú (không được giấu)`);
    }
  };
  for (const row of TTS_VOICE_COEFFICIENTS_51H2) {
    check(normal[row.voice], row.normalCoefficient * 16.0714, row.voice, "medium");
    check(dense[row.voice], row.denseCoefficient * 9.5388, row.voice, "M3");
  }
  console.log(`    (độ lệch lớn nhất so với tâm gộp mới: ${(maxDev * 100).toFixed(1)}% — ${maxDevId})`);
  // Độ lệch lớn nhất thật sau khi đo xong: 11,3% (Hải Đăng normal —
  // neo F3-A2 8,40 s so với tâm gộp mới; giữ từ F3).
  approx(maxDev, 0.113, 0.002, "độ lệch lớn nhất so với tâm gộp mới phải là 11,3%");
  assert(maxDev <= 0.17, "độ lệch lớn nhất phải ≤ 17% (khoảng h = 0,17 chứa mọi mẫu)");
});

test("hệ số H2 không trôi xa F3: mọi giọng lệch ≤ 5% so với bảng F3 (trừ ghi chú Thùy Dung)", () => {
  for (const row of TTS_VOICE_COEFFICIENTS_51H2) {
    const f3 = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === row.voice)!;
    const dN = Math.abs(row.normalCoefficient - f3.normalCoefficient) / f3.normalCoefficient;
    const dD = Math.abs(row.denseCoefficient - f3.denseCoefficient) / f3.denseCoefficient;
    // Ngoại lệ DUY NHẤT có ghi chú: Thùy Dung normal trôi +7,01% —
    // F3 chỉ có n = 1 mẫu C4-M4 chậm 9,36 s; nay n = 3 với 2 mẫu H2 mới
    // 8,56/8,32 s nên tâm gộp dịch lên. Đúng điều nợ n = 1 cảnh báo
    // (hệ số n = 1 không đáng tin), không phải lỗi đo — xem LIMITS đợt
    // 52 I1 §3.3. Mọi giọng/chế độ khác vẫn ≤ 5%.
    if (row.voice === "Thùy Dung") {
      approx(dN, 0.0701, 0.002, "Thùy Dung normal phải trôi đúng +7,01% so với F3 (ghi chú)");
      assert(dD <= 0.05, `hệ số dense Thùy Dung trôi ${(dD * 100).toFixed(1)}% so với F3 — vượt 5%, cần ghi chú`);
      continue;
    }
    assert(dN <= 0.05, `hệ số normal ${row.voice} trôi ${(dN * 100).toFixed(1)}% so với F3 — vượt 5%, cần ghi chú`);
    assert(dD <= 0.05, `hệ số dense ${row.voice} trôi ${(dD * 100).toFixed(1)}% so với F3 — vượt 5%, cần ghi chú`);
  }
});

// ---------------------------------------------------------------------------
// 5. Dense chênh normal bao nhiêu % — dải đã khóa
// ---------------------------------------------------------------------------

test("dense luôn chậm hơn normal ở mọi giọng; tỉ lệ dense/normal trong dải đã khóa", () => {
  let minRatio = Infinity;
  let maxRatio = -Infinity;
  let minVoice = "";
  let maxVoice = "";
  for (const row of TTS_VOICE_COEFFICIENTS_51H2) {
    const nRate = row.normalCoefficient * 16.0714;
    const dRate = row.denseCoefficient * 9.5388;
    assert(dRate < nRate, `giọng ${row.voice}: tốc độ dense (${dRate.toFixed(2)}) phải chậm hơn normal (${nRate.toFixed(2)})`);
    const ratio = dRate / nRate;
    approx(ratio, row.denseNormalRatio, 0.001, `tỉ lệ dense/normal của ${row.voice} phải khớp bảng`);
    if (ratio < minRatio) { minRatio = ratio; minVoice = row.voice; }
    if (ratio > maxRatio) { maxRatio = ratio; maxVoice = row.voice; }
  }
  console.log(`    (tỉ lệ dense/normal: min ${minRatio.toFixed(3)} (${minVoice}) — max ${maxRatio.toFixed(3)} (${maxVoice}))`);
  // Tỉ lệ dense/normal thật sau khi đo đủ 83 mẫu: min 0,6199 (Xuân Vĩnh),
  // max 0,6829 (Phạm Tuyên) — đợt 51 (37 mẫu) là 0,6007 (Xuân Vĩnh) –
  // 0,6854 (Adam bựa); F3: 0,598 (Ngọc Trân) – 0,686 (Đức Trí).
  approx(minRatio, 0.6199, 0.002, "tỉ lệ dense/normal nhỏ nhất phải ~0,6199 (Xuân Vĩnh)");
  approx(maxRatio, 0.6829, 0.002, "tỉ lệ dense/normal lớn nhất phải ~0,6829 (Phạm Tuyên)");
  eq(minVoice, "Xuân Vĩnh", "giọng có tỉ lệ dense/normal nhỏ nhất phải là Xuân Vĩnh");
  eq(maxVoice, "Phạm Tuyên", "giọng có tỉ lệ dense/normal lớn nhất phải là Phạm Tuyên");
  assert(maxRatio - minRatio > 0.05, "tỉ lệ dense/normal phải dao động rõ (không phải hằng số — hệ số dense riêng vẫn bắt buộc)");
});

// ---------------------------------------------------------------------------
// 6. Lặp ưu tiên: Trúc Ly / Quốc Tuấn / Đức Trí / Kim Thanh
// ---------------------------------------------------------------------------

test("lặp ưu tiên: các lần lặp cùng giọng+text lệch nhau ≤ 5%", () => {
  const groups: Array<[string, string]> = [];
  for (const voice of ["Trúc Ly", "Quốc Tuấn", "Đức Trí", "Kim Thanh"]) {
    for (const textId of ["M3", "M4"] as const) {
      const durs = TTS_SAMPLES_51H2.filter((s) => s.voice === voice && s.textId === textId).map((s) => s.durationSec);
      if (durs.length >= 2) groups.push([`${voice} ${textId}`, durs.join(",")]);
      for (const d of durs) {
        const row = TTS_VOICE_COEFFICIENTS_51H2.find((r) => r.voice === voice)!;
        const rate = textId === "M3" ? row.denseCoefficient * 9.5388 : row.normalCoefficient * 16.0714;
        const chars = textId === "M3" ? 178 : 169;
        const center = chars / rate;
        inRange(d, center * TTS_PER_VOICE_MIN_FACTOR_51H2, center * TTS_PER_VOICE_MAX_FACTOR_51H2,
          `lần lặp H2 ${voice} ${textId} ${d}s phải nằm trong khoảng theo giọng H2`);
      }
    }
  }
  // Spread trong từng nhóm lặp H2 (chỉ tính mẫu H2, không gộp pool cũ).
  for (const voice of ["Trúc Ly", "Quốc Tuấn", "Đức Trí", "Kim Thanh"]) {
    for (const textId of ["M3", "M4"] as const) {
      const durs = TTS_SAMPLES_51H2.filter((s) => s.voice === voice && s.textId === textId).map((s) => s.durationSec);
      if (durs.length < 2) continue;
      const mean = durs.reduce((a, b) => a + b, 0) / durs.length;
      const spread = (Math.max(...durs) - Math.min(...durs)) / mean;
      assert(spread <= 0.05, `nhóm lặp H2 ${voice} ${textId} spread phải ≤ 5%, nhận ${(spread * 100).toFixed(1)}% (${durs.join(", ")})`);
    }
  }
  assert(groups.length > 0, "phải có ít nhất một nhóm lặp ưu tiên để kiểm tra");
});

// ---------------------------------------------------------------------------
// 7. Tốc độ tổng hợp H2
// ---------------------------------------------------------------------------

test("tốc độ tổng hợp H2: mọi lần đo < 1× realtime; hằng khoảng h = 0,17 giữ nguyên", () => {
  eq(TTS_SYNTH_SPEED_51H2.length, 83, "83 lần đo tốc độ tổng hợp (driver H2 — kế hoạch đủ, nợ F3 §8.2 đã đóng ở đợt 52 I1)");
  const ratios = TTS_SYNTH_SPEED_51H2.map((s) => s.audioSec / s.synthSec);
  for (const r of ratios) {
    assert(r > 0 && r < 1.0, `mọi tỉ lệ audio/synth phải < 1× realtime, nhận ${r.toFixed(2)}`);
  }
  const sorted = [...ratios].sort((a, b) => a - b);
  const median = (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2;
  console.log(`    (tốc độ tổng hợp H2: min ${sorted[0].toFixed(2)}× — median ${median.toFixed(2)}× — max ${sorted[sorted.length - 1].toFixed(2)}×)`);
  // Số thật sau khi đo đủ 83 mẫu: min 0,02× (W38 Thanh Bình M4, đợt 52,
  // máy tải nặng nhất), median 0,12×, max 0,51× (W28 Thiện Minh M4,
  // đợt 52, máy yên) — chậm hơn F3 (median 0,44×) vì H2 đo lúc 8–10
  // luồng đợt 51/52 chạy song song; chỉ khóa "đều < 1×", median chỉ
  // báo rõ không khóa cứng. Đợt 51 riêng: min 0,02×, median 0,10×,
  // max 0,25×, tổng 5978,3 s; đợt 52 riêng: median 0,18×, tổng 5449,2 s.
  approx(sorted[0], 0.02, 0.01, "tỉ lệ chậm nhất phải ~0,02× (W38 Thanh Bình M4)");
  approx(sorted[sorted.length - 1], 0.51, 0.01, "tỉ lệ nhanh nhất phải ~0,51× (W28 Thiện Minh M4)");
  approx(median, 0.12, 0.02, "median tốc độ tổng hợp phải ~0,12×");
  const totalSynth = TTS_SYNTH_SPEED_51H2.reduce((a, s) => a + s.synthSec, 0);
  console.log(`    (tổng thời gian synth H2: ${totalSynth.toFixed(1)}s)`);
  approx(totalSynth, 11427.5, 0.5, "tổng thời gian synth 83 mẫu phải là 11427,5 s");
  // Đối chiếu F3: 44 lần đo, median 0,44× — H2 đo lúc máy tải hơn nên
  // synth chậm hơn là bình thường, chỉ khóa "đều < 1×" (không khóa median).
  const f3ratios = TTS_SYNTH_SPEED_50F3.map((s) => s.audioSec / s.synthSec);
  assert(f3ratios.every((r) => r < 1.0), "mọi tỉ lệ F3 cũng phải < 1× (đối chiếu)");
  eq(TTS_PER_VOICE_MIN_FACTOR_51H2, 0.83, "hệ số biên dưới H2 giữ 0,83 (h = 0,17 như F3)");
  eq(TTS_PER_VOICE_MAX_FACTOR_51H2, 1.17, "hệ số biên trên H2 giữ 1,17 (h = 0,17 như F3)");
  assert(TTS_SYNTH_META_51H2.loadSecRun1 > 0, "phải ghi thời gian nạp model H2");
  assert(TTS_SYNTH_META_51H2.warmupSecRun1 > 0, "phải ghi thời gian warmup H2");
});

// ---------------------------------------------------------------------------
// 8. calibrated (quy tắc C4: n ≥ 3)
// ---------------------------------------------------------------------------

test("calibrated: đúng 25 dòng bảng H2 đủ n ≥ 3 ở cả hai chế độ (quy tắc C4) — nợ F3 §8.2 đã đóng", () => {
  const calibrated: string[] = ["Trúc Ly", "Quốc Tuấn", "Đức Trí", "Kim Thanh",
    "Quang Sơn", "Ngọc Trân", "Mai Anh", "Đoan Trang", "Phạm Tuyên", "Ngọc Linh",
    "Thiền Tâm Đức", "Minh Đức", "Mỹ Duyên", "Thục Đoan", "Adam bựa",
    "Thái Sơn", "Quỳnh Anh", "Hải Đăng", "Ngọc Huyền", "Thiện Minh",
    "Adam", "Thùy Dung", "Xuân Vĩnh", "Minh Triết", "Thanh Bình"];
  eq(calibrated.length, 25, "đủ 25 giọng calibrated (đợt 51: 10; đợt 52 I1 đo tiếp 46 mẫu → +15)");
  for (const voice of calibrated) {
    const row = TTS_VOICE_COEFFICIENTS_51H2.find((r) => r.voice === voice)!;
    assert(row.normalN >= 3 && row.denseN >= 3,
      `giọng ${voice} phải đủ điều kiện calibrated ở cả hai chế độ (normalN=${row.normalN}, denseN=${row.denseN})`);
  }
  const got = TTS_VOICE_COEFFICIENTS_51H2.filter((r) => r.normalN >= 3 && r.denseN >= 3).map((r) => r.voice).sort();
  eq(JSON.stringify(got), JSON.stringify([...calibrated].sort()),
    "đúng 25 giọng đủ calibrated cả hai chế độ — không thêm, không bớt");
  // Bảng H2 phủ đủ 25/25 preset — không còn giọng nào thiếu hệ số.
  const voices = new Set(TTS_VOICE_COEFFICIENTS_51H2.map((r) => r.voice));
  eq(voices.size, 25, "bảng H2 phải có đúng 25 giọng (phủ đủ preset như F3)");
  for (const f3row of TTS_VOICE_COEFFICIENTS_50F3) {
    assert(voices.has(f3row.voice), `bảng H2 phải giữ giọng ${f3row.voice} của F3`);
  }
});

// ---------------------------------------------------------------------------
// 9. Transfer M5 (đợt 53 J7) + tốc độ tổng hợp J7
// ---------------------------------------------------------------------------

/**
 * Pool CHỈ text M4 (169 ký tự) theo giọng — Y HỆT buildPools() nhưng loại
 * text medium khác (T2/T4/T5 của Hải Đăng, C4-M5 của Thái Sơn) để tính
 * transfer sạch v_M4-only / v_M5 (định nghĩa F3 §4.5 dùng M4-only).
 */
function buildM4OnlyPools(): Record<string, Array<{ chars: number; secs: number }>> {
  const m4: Record<string, Array<{ chars: number; secs: number }>> = {};
  const add = (voice: string, chars: number, secs: number) => {
    (m4[voice] ??= []).push({ chars, secs });
  };
  for (const s of TTS_NEW_VOICES_48D1) add(s.voice, 169, s.durationSec);
  add("Thùy Dung", 169, TTS_SAMPLES_NEW_47C4.find((s) => s.id === "C4-M4")!.durationSec);
  add("Thiền Tâm Đức", 169, TTS_VARIANCE_48D1.find((r) => r.id === "D1-X3")!.durationSec);
  add("Mỹ Duyên", 169, TTS_VARIANCE_48D1.find((r) => r.id === "D1-X4")!.durationSec);
  for (const s of [...TTS_SAMPLES_RUN1_49E1, ...TTS_SAMPLES_RUN2_49E1]) {
    if (s.textId === "M4") add(s.voice, 169, s.durationSec);
  }
  for (const s of TTS_SAMPLES_CLI_49E1) {
    if (s.textId === "M4") add(s.voice, 169, s.durationSec);
  }
  for (const s of TTS_SAMPLES_50F3) {
    if (s.textId === "M4") add(s.voice, 169, s.durationSec);
  }
  for (const s of TTS_SAMPLES_51H2) {
    if (s.textId === "M4") add(s.voice, 169, s.durationSec);
  }
  return m4;
}

test("transfer M5 (J7, đợt 53): text medium thứ hai đọc nhanh bằng/hơn M4 — transfer 0,90–1,01, KHÔNG phải 1,172", () => {
  // Text M5: 190 ký tự, 0 chữ số, dấu câu dày (khớp C4-M5).
  eq(ttsTextLength(TTS_STANDARD_TEXT_M5_53J7), 190, "M5 đúng 190 ký tự");
  eq((TTS_STANDARD_TEXT_M5_53J7.match(/[0-9]/g) ?? []).length, 0, "M5 có 0 chữ số");
  eq(TTS_SAMPLES_M5_53J7.length, 8, "đủ 8 mẫu M5 J7 (n = 2 × 4 giọng)");
  for (const s of TTS_SAMPLES_M5_53J7) {
    eq(s.text, TTS_STANDARD_TEXT_M5_53J7, `mẫu ${s.id} phải dùng đúng text M5`);
    eq(s.source, "J7", `mẫu ${s.id} phải ghi source J7`);
    assert(s.durationSec > 0, `mẫu ${s.id} phải có độ dài > 0`);
  }
  // Transfer = v_M4-only gộp / v_M5 gộp (n = 2) — tính lại từ pool + mẫu.
  const m4 = buildM4OnlyPools();
  const locked: Record<string, number> = {
    "Đức Trí": 0.9099,
    "Kim Thanh": 1.0072,
    "Thiền Tâm Đức": 0.9003,
    "Hải Đăng": 0.9736,
  };
  for (const voice of Object.keys(locked)) {
    const vM4 = poolRate(m4[voice]);
    const rows = TTS_SAMPLES_M5_53J7.filter((s) => s.voice === voice);
    eq(rows.length, 2, `${voice} phải có đúng 2 mẫu M5`);
    const vM5 = 380 / rows.reduce((a, s) => a + s.durationSec, 0);
    const transfer = vM4 / vM5;
    approx(transfer, locked[voice], 0.002, `transfer M5 của ${voice} phải là ${locked[voice]} (v_M4-only ${vM4.toFixed(4)} / v_M5 ${vM5.toFixed(4)})`);
    // Lặp M5 cùng giọng lệch nhau ≤ 10% (Hải Đăng 9,1% — trong spread M4
    // 11,3% đã biết của anh; 3 giọng kia chỉ 1,2–3,4%).
    const durs = rows.map((s) => s.durationSec);
    const spread = (Math.max(...durs) - Math.min(...durs)) / (durs.reduce((a, b) => a + b, 0) / 2);
    assert(spread <= 0.1, `lặp M5 ${voice} spread phải ≤ 10%, nhận ${(spread * 100).toFixed(1)}% (${durs.join(", ")})`);
  }
  // Transfer KHÔNG ổn định qua text: Hải Đăng trên M5 (0,9736) khác xa
  // transfer 1,1721 của anh trên text T2/T4/T5 có chữ số (F3 §4.5) —
  // chênh > 0,15. 1,172 là đặc tính của text chứa chữ số, không phải
  // của "text medium" nói chung (phù hợp mô hình đường cong H1).
  const hdTransfer = locked["Hải Đăng"];
  assert(Math.abs(hdTransfer - 1.1721) > 0.15,
    `transfer M5 của Hải Đăng (${hdTransfer}) phải khác rõ transfer T-text 1,1721 (chênh > 0,15) — transfer phụ thuộc text`);
  // 8 mẫu M5 KHÔNG gộp vào pool H2: normalN trong bảng vẫn khớp pool
  // cũ (test §3 đã khóa) — kiểm tra trực tiếp ở đây để không ai tưởng
  // chúng đã vào bảng (gộp vào sẽ dịch normal Đức Trí +4,01% và
  // Thiền Tâm Đức +4,46% — xem ghi chú TRANSFER M5 trong lib).
  const { normal } = buildPools();
  for (const voice of ["Đức Trí", "Kim Thanh", "Thiền Tâm Đức", "Hải Đăng"]) {
    const row = TTS_VOICE_COEFFICIENTS_51H2.find((r) => r.voice === voice)!;
    eq(normal[voice].length, row.normalN, `pool normal ${voice} vẫn n = ${row.normalN} — mẫu M5 J7 KHÔNG được gộp vào bảng H2`);
  }
});

test("tốc độ tổng hợp J7: 12 lần đo đều < 1× realtime, median ~0,51×, tổng synth 312,3 s", () => {
  eq(TTS_SYNTH_SPEED_53J7.length, 12, "12 lần đo tốc độ tổng hợp J7 (1 ép fallback + 8 transfer M5 + 3 đường cong Trúc Ly)");
  const ratios = TTS_SYNTH_SPEED_53J7.map((s) => s.audioSec / s.synthSec);
  for (const r of ratios) {
    assert(r > 0 && r < 1.0, `mọi tỉ lệ audio/synth J7 phải < 1× realtime, nhận ${r.toFixed(2)}`);
  }
  const sorted = [...ratios].sort((a, b) => a - b);
  const median = (sorted[5] + sorted[6]) / 2;
  console.log(`    (tốc độ tổng hợp J7: min ${sorted[0].toFixed(2)}× — median ${median.toFixed(2)}× — max ${sorted[sorted.length - 1].toFixed(2)}×)`);
  approx(sorted[0], 0.33, 0.01, "tỉ lệ chậm nhất J7 phải ~0,33× (J7-FB, text ngắn 1,84 s)");
  approx(sorted[sorted.length - 1], 0.6, 0.01, "tỉ lệ nhanh nhất J7 phải ~0,60× (J7-T03 Kim Thanh M5)");
  approx(median, 0.51, 0.02, "median tốc độ tổng hợp J7 phải ~0,51× (máy yên, nhanh nhất từ trước tới nay)");
  const totalSynth = TTS_SYNTH_SPEED_53J7.reduce((a, s) => a + s.synthSec, 0);
  approx(totalSynth, 312.3, 0.5, "tổng thời gian synth 12 mẫu J7 phải là 312,3 s");
});

// ---------------------------------------------------------------------------
// 10. Transfer M6 (đợt 54 K6) + tốc độ tổng hợp K6
// ---------------------------------------------------------------------------

test("transfer M6 (K6, đợt 54): text số-dày thứ ba cho transfer 1,42–1,58 — transfer tăng theo tỉ lệ chữ số, KHÔNG phải hằng số giọng", () => {
  // Text M6: 183 ký tự, 23 chữ số = 12,57% (cùng dải với P13/M3),
  // nội dung khác hẳn M4 (0 chữ số, nhiều tên riêng) và M5 (0 chữ số).
  eq(ttsTextLength(TTS_STANDARD_TEXT_M6_54K6), 183, "M6 đúng 183 ký tự");
  eq((TTS_STANDARD_TEXT_M6_54K6.match(/[0-9]/g) ?? []).length, 23, "M6 có 23 chữ số (12,57%)");
  eq(TTS_SAMPLES_M6_54K6.length, 8, "đủ 8 mẫu M6 K6 (n = 2 × 4 giọng)");
  for (const s of TTS_SAMPLES_M6_54K6) {
    eq(s.text, TTS_STANDARD_TEXT_M6_54K6, `mẫu ${s.id} phải dùng đúng text M6`);
    eq(s.source, "K6", `mẫu ${s.id} phải ghi source K6`);
    approx(s.digitRatio, 23 / 183, 0.001, `digitRatio mẫu ${s.id} phải khớp text M6`);
    assert(s.durationSec > 0, `mẫu ${s.id} phải có độ dài > 0`);
  }
  // Transfer = v_M4-only gộp / v_M6 gộp (n = 2) — tính lại từ pool + mẫu,
  // định nghĩa Y HỆT M5 ở §9 (dùng buildM4OnlyPools).
  const m4 = buildM4OnlyPools();
  const locked: Record<string, number> = {
    "Đức Trí": 1.4463,
    "Kim Thanh": 1.5759,
    "Thiền Tâm Đức": 1.4171,
    "Hải Đăng": 1.523,
  };
  for (const voice of Object.keys(locked)) {
    const vM4 = poolRate(m4[voice]);
    const rows = TTS_SAMPLES_M6_54K6.filter((s) => s.voice === voice);
    eq(rows.length, 2, `${voice} phải có đúng 2 mẫu M6`);
    const vM6 = 366 / rows.reduce((a, s) => a + s.durationSec, 0);
    const transfer = vM4 / vM6;
    approx(transfer, locked[voice], 0.002, `transfer M6 của ${voice} phải là ${locked[voice]} (v_M4-only ${vM4.toFixed(4)} / v_M6 ${vM6.toFixed(4)})`);
    // Lặp M6 cùng giọng lệch nhau ≤ 10% (Đức Trí 2,7% / Kim Thanh 4,2% /
    // Thiền Tâm Đức 5,3% / Hải Đăng 1,3% — trong spread M4 11,3%).
    const durs = rows.map((s) => s.durationSec);
    const spread = (Math.max(...durs) - Math.min(...durs)) / (durs.reduce((a, b) => a + b, 0) / 2);
    assert(spread <= 0.1, `lặp M6 ${voice} spread phải ≤ 10%, nhận ${(spread * 100).toFixed(1)}% (${durs.join(", ")})`);
    // M6 hành xử như text dense: tốc độ gộp M6 chỉ nhanh hơn dense H2
    // 1,6–8,0% — nằm gọn trong h = 0,17 của hệ số dense (KHÔNG nới h).
    const row = TTS_VOICE_COEFFICIENTS_51H2.find((r) => r.voice === voice)!;
    const vDense = row.denseCoefficient * 9.5388;
    const ratio = vM6 / vDense;
    assert(ratio >= TTS_PER_VOICE_MIN_FACTOR_51H2 && ratio <= TTS_PER_VOICE_MAX_FACTOR_51H2,
      `tốc độ M6 của ${voice} (${vM6.toFixed(4)}) phải trong h = 0,17 của dense (${vDense.toFixed(4)}), nhận tỉ lệ ${ratio.toFixed(4)}`);
  }
  // Transfer phụ thuộc text — thang đo rõ theo tỉ lệ chữ số: cùng giọng
  // Hải Đăng, M5 (0 chữ số) 0,9736 → M6 (12,57% chữ số) 1,5230 (+56%),
  // và M6 khác xa 1,1721 của anh trên text ít số T2/T4/T5 (chênh > 0,15).
  const hdM6 = locked["Hải Đăng"];
  assert(Math.abs(hdM6 - 0.9736) > 0.15,
    `transfer M6 của Hải Đăng (${hdM6}) phải khác rõ transfer M5 0,9736 (chênh > 0,15) — transfer phụ thuộc text`);
  assert(Math.abs(hdM6 - 1.1721) > 0.15,
    `transfer M6 của Hải Đăng (${hdM6}) phải khác rõ transfer T-text 1,1721 (chênh > 0,15) — 1,1721 chỉ là transfer của text ít số`);
  // 8 mẫu M6 KHÔNG gộp vào pool H2: normalN trong bảng vẫn khớp pool
  // cũ (test §3 đã khóa) — kiểm tra trực tiếp ở đây để không ai tưởng
  // chúng đã vào bảng (M6 là text số-dày, thuộc lớp dense — gộp vào
  // normal sẽ dịch hệ số xuống mạnh chỉ vì đổi thành phần blend;
  // xem ghi chú TRANSFER M6 trong lib).
  const { normal } = buildPools();
  for (const voice of ["Đức Trí", "Kim Thanh", "Thiền Tâm Đức", "Hải Đăng"]) {
    const row = TTS_VOICE_COEFFICIENTS_51H2.find((r) => r.voice === voice)!;
    eq(normal[voice].length, row.normalN, `pool normal ${voice} vẫn n = ${row.normalN} — mẫu M6 K6 KHÔNG được gộp vào bảng H2`);
  }
});

test("tốc độ tổng hợp K6: 14 lần đo đều < 1× realtime, median ~0,19×, tổng synth 1400,4 s", () => {
  eq(TTS_SYNTH_SPEED_54K6.length, 14, "14 lần đo tốc độ tổng hợp K6 (6 đo lặp P13/M3 + 8 transfer M6)");
  const ratios = TTS_SYNTH_SPEED_54K6.map((s) => s.audioSec / s.synthSec);
  for (const r of ratios) {
    assert(r > 0 && r < 1.0, `mọi tỉ lệ audio/synth K6 phải < 1× realtime, nhận ${r.toFixed(2)}`);
  }
  const sorted = [...ratios].sort((a, b) => a - b);
  const median = (sorted[6] + sorted[7]) / 2;
  console.log(`    (tốc độ tổng hợp K6: min ${sorted[0].toFixed(2)}× — median ${median.toFixed(2)}× — max ${sorted[sorted.length - 1].toFixed(2)}×)`);
  approx(sorted[0], 0.08, 0.01, "tỉ lệ chậm nhất K6 phải ~0,08× (K6-M3-TL-3, VM quá tải)");
  approx(sorted[sorted.length - 1], 0.59, 0.01, "tỉ lệ nhanh nhất K6 phải ~0,59× (K6-M3-TL-2)");
  approx(median, 0.19, 0.02, "median tốc độ tổng hợp K6 phải ~0,19× (chậm nhất từ trước tới nay vì load 7–11)");
  const totalSynth = TTS_SYNTH_SPEED_54K6.reduce((a, s) => a + s.synthSec, 0);
  approx(totalSynth, 1400.4, 0.5, "tổng thời gian synth 14 mẫu K6 phải là 1400,4 s");
});

test("transfer M6 lặp (L9, đợt 55): 4 giọng K6 đều trong dải 1,42–1,58 + Trúc Ly mới 1,5102 — thang transfer giữ vững qua đo lặp", () => {
  // Text M6: cùng hằng TTS_STANDARD_TEXT_M6_54K6 (183 ký tự, 23 chữ số
  // = 12,57% — đã khóa ở §10). L9 đo lặp đúng protocol K6, n = 2 cho
  // 4 giọng K6 + n = 2 MỚI cho Trúc Ly (giọng thứ 5).
  eq(TTS_SAMPLES_M6_55L9.length, 10, "đủ 10 mẫu M6 L9 (n = 2 × 5 giọng: 4 giọng K6 + Trúc Ly mới)");
  for (const s of TTS_SAMPLES_M6_55L9) {
    eq(s.text, TTS_STANDARD_TEXT_M6_54K6, `mẫu ${s.id} phải dùng đúng text M6`);
    eq(s.source, "L9", `mẫu ${s.id} phải ghi source L9`);
    approx(s.digitRatio, 23 / 183, 0.001, `digitRatio mẫu ${s.id} phải khớp text M6`);
    assert(s.durationSec > 0, `mẫu ${s.id} phải có độ dài > 0`);
  }
  // Transfer = v_M4-only gộp / v_M6 gộp (n = 2) — tính lại từ pool + mẫu,
  // định nghĩa Y HỆT §9/§10 (dùng buildM4OnlyPools). Cả 4 giọng lặp đều
  // phải nằm trong dải K6 1,42–1,58 (không phải chỉ gần đúng).
  const m4 = buildM4OnlyPools();
  const locked: Record<string, number> = {
    "Đức Trí": 1.4363,
    "Kim Thanh": 1.5731,
    "Thiền Tâm Đức": 1.4584,
    "Hải Đăng": 1.5251,
  };
  for (const voice of Object.keys(locked)) {
    const vM4 = poolRate(m4[voice]);
    const rows = TTS_SAMPLES_M6_55L9.filter((s) => s.voice === voice);
    eq(rows.length, 2, `${voice} phải có đúng 2 mẫu M6 L9`);
    const vM6 = 366 / rows.reduce((a, s) => a + s.durationSec, 0);
    const transfer = vM4 / vM6;
    approx(transfer, locked[voice], 0.002, `transfer M6 L9 của ${voice} phải là ${locked[voice]} (v_M4-only ${vM4.toFixed(4)} / v_M6 ${vM6.toFixed(4)})`);
    assert(transfer >= 1.42 && transfer <= 1.58,
      `transfer M6 L9 của ${voice} (${transfer.toFixed(4)}) phải trong dải K6 1,42–1,58 — đo lặp giữ vững`);
    // Lặp M6 cùng giọng lệch nhau ≤ 10% (Đức Trí 6,0% / Kim Thanh 1,2% /
    // Thiền Tâm Đức 0,4% / Hải Đăng 3,2%).
    const durs = rows.map((s) => s.durationSec);
    const spread = (Math.max(...durs) - Math.min(...durs)) / (durs.reduce((a, b) => a + b, 0) / 2);
    assert(spread <= 0.1, `lặp M6 L9 ${voice} spread phải ≤ 10%, nhận ${(spread * 100).toFixed(1)}% (${durs.join(", ")})`);
    // M6 hành xử như text dense: tốc độ gộp M6 chỉ nhanh hơn dense H2
    // 1,0–5,6% — nằm gọn trong h = 0,17 của hệ số dense (KHÔNG nới h).
    const row = TTS_VOICE_COEFFICIENTS_51H2.find((r) => r.voice === voice)!;
    const vDense = row.denseCoefficient * 9.5388;
    const ratio = vM6 / vDense;
    assert(ratio >= TTS_PER_VOICE_MIN_FACTOR_51H2 && ratio <= TTS_PER_VOICE_MAX_FACTOR_51H2,
      `tốc độ M6 L9 của ${voice} (${vM6.toFixed(4)}) phải trong h = 0,17 của dense (${vDense.toFixed(4)}), nhận tỉ lệ ${ratio.toFixed(4)}`);
  }
  // Trúc Ly MỚI (giọng thứ 5, chưa từng đo transfer): v_M4-only của cô
  // là 19,3807 (n = 3, kiểm chứng lại bằng scratch esbuild theo đúng
  // định nghĩa buildM4OnlyPools) — transfer 1,5102, cũng trong dải.
  const vM4TL = poolRate(m4["Trúc Ly"]);
  approx(vM4TL, 19.3807, 0.001, "v_M4-only Trúc Ly phải là 19,3807 (pool M4-only n = 3)");
  const tlRows = TTS_SAMPLES_M6_55L9.filter((s) => s.voice === "Trúc Ly");
  eq(tlRows.length, 2, "Trúc Ly phải có đúng 2 mẫu M6 L9 mới");
  const vM6TL = 366 / tlRows.reduce((a, s) => a + s.durationSec, 0);
  const trTL = vM4TL / vM6TL;
  approx(trTL, 1.5102, 0.002, `transfer M6 MỚI của Trúc Ly phải là 1,5102 (v_M4-only ${vM4TL.toFixed(4)} / v_M6 ${vM6TL.toFixed(4)})`);
  assert(trTL >= 1.42 && trTL <= 1.58,
    `transfer M6 MỚI của Trúc Ly (${trTL.toFixed(4)}) phải trong dải K6 1,42–1,58`);
  const tlDurs = tlRows.map((s) => s.durationSec);
  const tlSpread = (Math.max(...tlDurs) - Math.min(...tlDurs)) / (tlDurs.reduce((a, b) => a + b, 0) / 2);
  assert(tlSpread <= 0.1, `lặp M6 Trúc Ly spread phải ≤ 10%, nhận ${(tlSpread * 100).toFixed(1)}% (${tlDurs.join(", ")})`);
  const tlRow = TTS_VOICE_COEFFICIENTS_51H2.find((r) => r.voice === "Trúc Ly")!;
  const tlRatio = vM6TL / (tlRow.denseCoefficient * 9.5388);
  assert(tlRatio >= TTS_PER_VOICE_MIN_FACTOR_51H2 && tlRatio <= TTS_PER_VOICE_MAX_FACTOR_51H2,
    `tốc độ M6 Trúc Ly (${vM6TL.toFixed(4)}) phải trong h = 0,17 của dense, nhận tỉ lệ ${tlRatio.toFixed(4)}`);
  // Gộp K6+L9 (n = 4 mỗi giọng): transfer vững hơn — khóa cả 4 giá trị.
  const lockedAll: Record<string, number> = {
    "Đức Trí": 1.4413,
    "Kim Thanh": 1.5745,
    "Thiền Tâm Đức": 1.4377,
    "Hải Đăng": 1.5241,
  };
  for (const voice of Object.keys(lockedAll)) {
    const vM4 = poolRate(m4[voice]);
    const rows = [...TTS_SAMPLES_M6_54K6, ...TTS_SAMPLES_M6_55L9].filter((s) => s.voice === voice);
    eq(rows.length, 4, `${voice} phải có đúng 4 mẫu M6 K6+L9`);
    const vM6 = 732 / rows.reduce((a, s) => a + s.durationSec, 0);
    approx(vM4 / vM6, lockedAll[voice], 0.002, `transfer M6 gộp K6+L9 của ${voice} phải là ${lockedAll[voice]}`);
  }
  // Transfer phụ thuộc text — thang đo giữ vững qua đo lặp: cùng giọng
  // Hải Đăng, M5 (0 chữ số) 0,9736 → M6 L9 (12,57% chữ số) 1,5251
  // (+57%), và M6 L9 khác xa 1,1721 của anh trên text ít số (chênh > 0,15).
  const hdM6 = locked["Hải Đăng"];
  assert(Math.abs(hdM6 - 0.9736) > 0.15,
    `transfer M6 L9 của Hải Đăng (${hdM6}) phải khác rõ transfer M5 0,9736 (chênh > 0,15) — transfer phụ thuộc text`);
  assert(Math.abs(hdM6 - 1.1721) > 0.15,
    `transfer M6 L9 của Hải Đăng (${hdM6}) phải khác rõ transfer T-text 1,1721 (chênh > 0,15) — 1,1721 chỉ là transfer của text ít số`);
  // 10 mẫu M6 L9 KHÔNG gộp vào pool H2: normalN trong bảng vẫn khớp pool
  // cũ (test §3 đã khóa) — kiểm tra trực tiếp ở đây để không ai tưởng
  // chúng đã vào bảng (M6 là text số-dày, thuộc lớp dense).
  const { normal } = buildPools();
  for (const voice of ["Đức Trí", "Kim Thanh", "Thiền Tâm Đức", "Hải Đăng", "Trúc Ly"]) {
    const row = TTS_VOICE_COEFFICIENTS_51H2.find((r) => r.voice === voice)!;
    eq(normal[voice].length, row.normalN, `pool normal ${voice} vẫn n = ${row.normalN} — mẫu M6 L9 KHÔNG được gộp vào bảng H2`);
  }
});

test("tốc độ tổng hợp L9: 16 lần đo đều < 1× realtime, median ~0,16×, tổng synth 2064,2 s", () => {
  eq(TTS_SYNTH_SPEED_55L9.length, 16, "16 lần đo tốc độ tổng hợp L9 (6 đo lặp P13/M3 + 8 lặp transfer M6 + 2 MỚI transfer M6 Trúc Ly)");
  const ratios = TTS_SYNTH_SPEED_55L9.map((s) => s.audioSec / s.synthSec);
  for (const r of ratios) {
    assert(r > 0 && r < 1.0, `mọi tỉ lệ audio/synth L9 phải < 1× realtime, nhận ${r.toFixed(2)}`);
  }
  const sorted = [...ratios].sort((a, b) => a - b);
  const median = (sorted[7] + sorted[8]) / 2;
  console.log(`    (tốc độ tổng hợp L9: min ${sorted[0].toFixed(2)}× — median ${median.toFixed(2)}× — max ${sorted[sorted.length - 1].toFixed(2)}×)`);
  approx(sorted[0], 0.03, 0.01, "tỉ lệ chậm nhất L9 phải ~0,03× (L9-M3-TL-2, synth 424,8 s lúc load ~15)");
  approx(sorted[sorted.length - 1], 0.54, 0.01, "tỉ lệ nhanh nhất L9 phải ~0,54× (L9-T08)");
  approx(median, 0.16, 0.02, "median tốc độ tổng hợp L9 phải ~0,16× (chậm vì VM quá tải + driver chết lặng 1 lần, resume)");
  const totalSynth = TTS_SYNTH_SPEED_55L9.reduce((a, s) => a + s.synthSec, 0);
  approx(totalSynth, 2064.2, 0.5, "tổng thời gian synth 16 mẫu L9 phải là 2064,2 s");
});

console.log(`\nttsEstimate51H2: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
