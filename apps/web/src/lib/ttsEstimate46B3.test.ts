/**
 * ttsEstimate46B3.test.ts — Test cho đợt 46 luồng B3 (ROUND46-B3).
 *
 * Khóa:
 * 1. Hiệu chuẩn thật: hệ số gộp mỗi tầng tính lại từ TTS_SAMPLES_46B3
 *    (tổng ký tự / tổng giây) phải khớp hằng trong lib; khoảng phải là
 *    biên quan sát (min làm tròn xuống, max làm tròn lên tới 4 chữ số)
 *    và chứa được mọi mẫu của tầng; mọi tầng đều calibrated: true với
 *    n = 5/5/3/3 (medium/long chỉ vừa đủ nhờ 1 mẫu Z3 cũ — test khóa
 *    cả số mẫu MỚI: 4/3/2/2 để không ai đọc nhầm thành "đo nhiều").
 * 2. Phát hiện: mẫu B3-S2 (49 ký tự, Trúc Ly, 2,32 s) RƠI NGOÀI khoảng
 *    phòng thủ A3 của tầng short ([0,9×, 1,4×] quanh 18,4) — tỉ lệ
 *    0,871 < 0,9; 10 mẫu B3 còn lại đều nằm trong khoảng A3 cũ.
 * 3. Hậu tố toast: header thật → "(…s)"; header thiếu → khoảng B3
 *    "(≈…–…s)"; rỗng → "".
 * 4. Nối UI thật (ĐỢT 49 E1 — đã chuyển): đọc source TtsButton.tsx và
 *    khẳng định component import + gọi đúng helper E1 với voice đang
 *    chọn, không còn nối helper C4/B3 cho hậu tố toast, không hardcode
 *    hệ số. Helper B3 vẫn được test đầy đủ ở §1–§3 (hiệu chuẩn +
 *    phát hiện + hậu tố B3); chỉ điểm nối UI đã chuyển sang E1 vì C4
 *    cho giọng chậm/nhanh lệch có hệ thống (xem
 *    ttsEstimate49E1.test.ts §6: Đức Trí M4 thực 14,0 s nhưng khoảng
 *    gộp chỉ tới 13,5 s).
 *
 * Chạy bằng esbuild bundle (quy ước đợt 45/46):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/ttsEstimate46B3.test.ts \
 *     --bundle --format=esm --platform=node --outfile=/tmp/tts46b3.test.mjs
 *   REPO_ROOT=$PWD node /tmp/tts46b3.test.mjs
 * (REPO_ROOT để test tìm được TtsButton.tsx; nếu chạy từ repo root mà
 * không đặt biến thì test tự dùng cwd — vẫn tìm được.)
 */
import { existsSync, readFileSync } from "node:fs";
import {
  TTS_SAMPLES_46B3,
  TTS_TIERS_46B3,
  estimateTtsDurationRange46B3,
  estimateTtsDurationSec46B3,
  ttsDoneSuffixRange46B3,
  ttsEstimateRangeSuffix46B3,
  ttsTierForLength46B3,
} from "./ttsEstimate46B3";
import { TTS_TIERS_45A3 } from "./ttsEstimate45A3";
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
// 1. Hiệu chuẩn: hệ số gộp + biên quan sát tính lại từ bảng mẫu
// ---------------------------------------------------------------------------

test("hiệu chuẩn: mọi tầng calibrated true, n = 5/5/3/3, mẫu mới 4/3/2/2", () => {
  const wantN: Record<Tier, number> = { veryShort: 5, short: 5, medium: 3, long: 3 };
  const wantNew: Record<Tier, number> = { veryShort: 4, short: 3, medium: 2, long: 2 };
  eq(TTS_TIERS_46B3.length, 4, "đủ 4 tầng");
  for (const tier of TIERS) {
    const spec = TTS_TIERS_46B3.find((t) => t.tier === tier)!;
    eq(spec.calibrated, true, `tầng ${tier} phải calibrated (đủ ≥3 mẫu)`);
    const samples = TTS_SAMPLES_46B3.filter((s) => s.tier === tier);
    eq(samples.length, wantN[tier], `tổng mẫu tầng ${tier}`);
    eq(samples.filter((s) => s.source === "B3").length, wantNew[tier], `mẫu mới B3 tầng ${tier}`);
    assert(spec.note.includes(`n = ${wantN[tier]}`), `note tầng ${tier} phải ghi rõ n`);
  }
  eq(TTS_SAMPLES_46B3.length, 16, "tổng 16 mẫu (3 Z3 + 2 A3 + 11 B3)");
});

test("hiệu chuẩn: hệ số gộp = tổng ký tự / tổng giây của chính tầng đó", () => {
  for (const tier of TIERS) {
    const spec = TTS_TIERS_46B3.find((t) => t.tier === tier)!;
    const samples = TTS_SAMPLES_46B3.filter((s) => s.tier === tier);
    let chars = 0;
    let secs = 0;
    for (const s of samples) {
      const n = ttsTextLength(s.text);
      assert(n > 0, `mẫu ${s.id} phải có text đo được`);
      chars += n;
      secs += s.durationSec;
    }
    approx(spec.charsPerSec, chars / secs, 0.001, `hệ số gộp tầng ${tier} (${chars}/${secs})`);
  }
});

test("hiệu chuẩn: khoảng = biên quan sát, làm tròn ra ngoài, chứa mọi mẫu", () => {
  for (const tier of TIERS) {
    const spec = TTS_TIERS_46B3.find((t) => t.tier === tier)!;
    const samples = TTS_SAMPLES_46B3.filter((s) => s.tier === tier);
    const ratios = samples.map((s) => s.durationSec / (ttsTextLength(s.text) / spec.charsPerSec));
    const minR = Math.min(...ratios);
    const maxR = Math.max(...ratios);
    // min làm tròn xuống, max làm tròn lên tới 4 chữ số → sai khác < 0,001.
    assert(spec.minFactor <= minR, `minFactor tầng ${tier} phải ≤ tỉ lệ nhỏ nhất quan sát (${minR})`);
    assert(minR - spec.minFactor < 0.001, `minFactor tầng ${tier} không được nhỏ hơn biên quan sát quá 0,001`);
    assert(spec.maxFactor >= maxR, `maxFactor tầng ${tier} phải ≥ tỉ lệ lớn nhất quan sát (${maxR})`);
    assert(spec.maxFactor - maxR < 0.001, `maxFactor tầng ${tier} không được lớn hơn biên quan sát quá 0,001`);
    for (const s of samples) {
      const r = estimateTtsDurationRange46B3(s.text)!;
      eq(r.tier, tier, `tầng của mẫu ${s.id}`);
      inRange(s.durationSec, r.minSec, r.maxSec, `khoảng B3 tầng ${tier} phải chứa mẫu ${s.id} (${s.durationSec}s)`);
    }
  }
});

test("hiệu chuẩn: ranh giới tầng giữ nguyên A3 (19/20, 79/80, 199/200)", () => {
  eq(ttsTierForLength46B3(19)?.tier, "veryShort", "19");
  eq(ttsTierForLength46B3(20)?.tier, "short", "20");
  eq(ttsTierForLength46B3(79)?.tier, "short", "79");
  eq(ttsTierForLength46B3(80)?.tier, "medium", "80");
  eq(ttsTierForLength46B3(199)?.tier, "medium", "199");
  eq(ttsTierForLength46B3(200)?.tier, "long", "200");
  eq(ttsTierForLength46B3(0), null, "0 → null");
  eq(estimateTtsDurationRange46B3(""), null, "rỗng → null");
  eq(estimateTtsDurationSec46B3(""), null, "điểm rỗng → null");
  eq(ttsEstimateRangeSuffix46B3(""), "", "hậu tố rỗng → ''");
});

// ---------------------------------------------------------------------------
// 2. Phát hiện: S2 rơi ngoài khoảng A3, 10 mẫu B3 còn lại nằm trong
// ---------------------------------------------------------------------------

test("phát hiện: chỉ mẫu B3-S2 rơi ngoài khoảng phòng thủ A3 (tỉ lệ 0,871 < 0,9)", () => {
  const a3Range: Record<Tier, [number, number]> = {
    veryShort: [0.8, 1.8],
    short: [0.9, 1.4],
    medium: [0.9, 1.2],
    long: [0.9, 1.2],
  };
  // Khóa khoảng A3 lấy từ lib A3 (không hardcode lại khoảng ở test).
  for (const tier of TIERS) {
    const spec = TTS_TIERS_45A3.find((t) => t.tier === tier)!;
    eq(spec.minFactor, a3Range[tier][0], `khoảng A3 tầng ${tier} (min)`);
    eq(spec.maxFactor, a3Range[tier][1], `khoảng A3 tầng ${tier} (max)`);
  }
  const outside: string[] = [];
  for (const s of TTS_SAMPLES_46B3.filter((x) => x.source === "B3")) {
    const ratio = s.durationSec / (ttsTextLength(s.text) / 18.4);
    const [lo, hi] = a3Range[s.tier];
    if (!(ratio >= lo && ratio <= hi)) outside.push(s.id);
  }
  eq(outside.length, 1, "chỉ đúng 1 mẫu B3 rơi ngoài khoảng A3");
  eq(outside[0], "B3-S2", "mẫu rơi ngoài phải là B3-S2");
  const s2 = TTS_SAMPLES_46B3.find((s) => s.id === "B3-S2")!;
  approx(s2.durationSec / (ttsTextLength(s2.text) / 18.4), 0.871, 0.001, "tỉ lệ S2 so với 18,4");
});

// ---------------------------------------------------------------------------
// 3. Hậu tố toast qua helper B3 (đúng helper TtsButton dùng)
// ---------------------------------------------------------------------------

test("hậu tố: header thật → số thật; header thiếu → khoảng B3; rỗng → ''", () => {
  eq(ttsDoneSuffixRange46B3({ headerValue: "12.34", text: "Xin chào!" }), " (12.3s)", "header thật");
  eq(ttsDoneSuffixRange46B3({ headerValue: null, text: "Xin chào!" }), " (≈0.5–0.8s)", "header thiếu → khoảng veryShort B3");
  eq(ttsDoneSuffixRange46B3({ headerValue: "0", text: "Xin chào!" }), " (≈0.5–0.8s)", "header 0 = không hợp lệ → khoảng");
  eq(ttsDoneSuffixRange46B3({ headerValue: "", text: "Xin chào!" }), " (≈0.5–0.8s)", "header rỗng → khoảng");
  eq(ttsDoneSuffixRange46B3({ headerValue: null, text: "" }), "", "text rỗng → ''");
  eq(ttsEstimateRangeSuffix46B3("x".repeat(184)), " (≈9.6–11.0s)", "hậu tố medium B3: 184 ký tự");
});

// ---------------------------------------------------------------------------
// 4. Nối UI thật: TtsButton phải dùng lib F3 (đợt 50 F3), không dùng E1/C4/B3 nữa
// ---------------------------------------------------------------------------

test("nối UI: TtsButton import + gọi helper H1 với voice, không dùng helper F3/E1/C4/B3, không hardcode 18,4", () => {
  const candidates = [
    process.env.REPO_ROOT,
    process.cwd(),
  ].filter((c): c is string => !!c);
  let src: string | null = null;
  const tried: string[] = [];
  for (const root of candidates) {
    for (const rel of [
      "apps/web/src/components/TtsButton.tsx",
      "src/components/TtsButton.tsx",
    ]) {
      const p = `${root}/${rel}`;
      tried.push(p);
      if (existsSync(p)) {
        src = readFileSync(p, "utf-8");
        break;
      }
    }
    if (src !== null) break;
  }
  assert(src !== null, `không tìm được TtsButton.tsx (đã thử: ${tried.join(", ")}) — chạy test từ repo root hoặc đặt REPO_ROOT`);
  const code = src as string;
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
    "TtsButton không được còn import helper B3 (đã chuyển sang C4 ở đợt 48 D1)",
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

console.log(`\nttsEstimate46B3: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
