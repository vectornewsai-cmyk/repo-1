/**
 * ttsDuration44Z3.test.ts — Test cho đợt 44 luồng Z3 (ROUND44-Z3).
 *
 * 1. Hậu tố toast TTS (nợ đợt 43 Y3 §6): header thật → "(…s)" không "≈";
 *    header thiếu → "(≈…s)" ước lượng từ text; text rỗng → bỏ hậu tố.
 * 2. Hằng tốc độ hiệu chuẩn 18,4 ký tự/giây (đo thật 3 mẫu bridge, xem
 *    ttsDuration44Z3.ts + LIMITS §4.3): ước lượng lại đúng 3 mẫu trong
 *    sai số đã ghi (mẫu ngắn −24%, hai mẫu dài ≤ +5%).
 * 3. Đường relink dùng chung min-display (nợ đợt 44 Z3 §3):
 *    ingestImportedItemWithProgress phải chuyển tiếp onProgress tới
 *    store.ingestWithProgress (đường duy nhất RelinkPanel dùng khi có
 *    callback) — kết hợp với test đợt 43 Y3 (ingestWithProgress pad
 *    500 ms) thì RelinkPanel cũng hưởng min-display 500 ms mà không cần
 *    sửa riêng từng panel.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/ttsDuration44Z3.test.ts
 */
import {
  TTS_VI_CHARS_PER_SEC,
  estimateTtsDurationSec,
  parseTtsDurationHeader,
  ttsDoneSuffix,
  ttsTextLength,
} from "./ttsDuration44Z3.ts";
import { ingestImportedItemWithProgress } from "./importAsset37T3.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
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

// ---------------------------------------------------------------------------
// 1. Header / ước lượng / hậu tố
// ---------------------------------------------------------------------------

await test("parse header: số > 0 nhận, còn lại null", () => {
  eq(parseTtsDurationHeader("12.34"), 12.34, "12.34");
  eq(parseTtsDurationHeader(" 2.08 "), 2.08, "khoảng trắng quanh");
  eq(parseTtsDurationHeader(null), null, "null (header bị CORS lọc)");
  eq(parseTtsDurationHeader(""), null, "chuỗi rỗng");
  eq(parseTtsDurationHeader("0"), null, "0 (bridge gửi khi durationSec falsy)");
  eq(parseTtsDurationHeader("-1"), null, "âm");
  eq(parseTtsDurationHeader("abc"), null, "không phải số");
});

await test("đếm ký tự theo code point (tiếng Việt có dấu)", () => {
  eq(ttsTextLength("Xin chào"), 8, "Xin chào = 8 ký tự");
  eq(ttsTextLength(""), 0, "rỗng");
});

await test("ước lượng: tốc độ truyền vào được tôn trọng, rỗng/không hợp lệ → null", () => {
  approx(estimateTtsDurationSec("x".repeat(100), 10)!, 10, 1e-9, "100 ký tự @10");
  eq(estimateTtsDurationSec("", 10), null, "text rỗng");
  eq(estimateTtsDurationSec("abc", 0), null, "tốc độ 0");
  eq(estimateTtsDurationSec("abc", Number.NaN), null, "tốc độ NaN");
});

await test("hằng hiệu chuẩn = 18,4 và ước lượng lại đúng 3 mẫu đo thật", () => {
  eq(TTS_VI_CHARS_PER_SEC, 18.4, "TTS_VI_CHARS_PER_SEC");
  // 3 mẫu hiệu chuẩn đợt 44 Z3 (header khớp ffprobe): 29 ký tự → 2,08 s;
  // 114 ký tự → 5,92 s; 227 ký tự → 12,08 s.
  const cases: Array<[number, number, number]> = [
    [29, 2.08, 0.55], // mẫu ngắn: sai số cho phép lớn (−24% ≈ 0,51 s)
    [114, 5.92, 0.35], // +4,5% ≈ 0,27 s
    [227, 12.08, 0.35], // +2,0% ≈ 0,24 s
  ];
  for (const [chars, real, tol] of cases) {
    const est = estimateTtsDurationSec("x".repeat(chars))!;
    approx(est, real, tol, `${chars} ký tự`);
  }
});

await test("hậu tố: header thật → '(…s)' không '≈'", () => {
  eq(ttsDoneSuffix({ headerValue: "12.34", text: "Xin chào" }), " (12.3s)", "header 12.34");
  eq(ttsDoneSuffix({ headerValue: "2.08", text: "Xin chào, đây là VCut Studio." }), " (2.1s)", "header 2.08");
});

await test("hậu tố: header thiếu → '(≈…s)' ước lượng, không mạo nhận số thật", () => {
  const s = ttsDoneSuffix({ headerValue: null, text: "x".repeat(184) });
  eq(s, " (≈10.0s)", "184 ký tự @18,4 = 10,0 s ước lượng");
  const s2 = ttsDoneSuffix({ headerValue: "0", text: "x".repeat(184) });
  eq(s2, " (≈10.0s)", "header '0' cũng fallback ước lượng");
  const s3 = ttsDoneSuffix({ headerValue: "", text: "x".repeat(184) });
  eq(s3, " (≈10.0s)", "header rỗng cũng fallback ước lượng");
});

await test("hậu tố: text rỗng + header thiếu → bỏ hậu tố, không bịa số", () => {
  // TtsButton đã trim text và chặn text rỗng trước khi gọi nên trường
  // hợp này chỉ là lưới an toàn cuối cùng của helper.
  eq(ttsDoneSuffix({ headerValue: null, text: "" }), "", "rỗng");
});

// ---------------------------------------------------------------------------
// 2. Relink chuyển tiếp onProgress → min-display dùng chung
// ---------------------------------------------------------------------------

await test("relink: ingestImportedItemWithProgress chuyển tiếp onProgress tới store", async () => {
  const seen: Array<{ phase: string }> = [];
  const stubStore = {
    ingestWithProgress: async (
      _blob: unknown,
      meta: { name?: string },
      onProgress?: (ev: { phase: string }) => void,
    ) => {
      // Giả lập đúng thứ tự pha của AssetStore thật (hashing → storing → done).
      onProgress?.({ phase: "hashing" });
      onProgress?.({ phase: "storing" });
      onProgress?.({ phase: "done" });
      return { assetId: "a_test", originalName: meta.name ?? "f.mp4", size: 3 } as never;
    },
  };
  const file = new File(["abc"], "f.mp4", { type: "video/mp4" });
  const res = await ingestImportedItemWithProgress(
    stubStore as never,
    { file, name: "f.mp4" },
    (ev) => seen.push({ phase: (ev as { phase: string }).phase }),
  );
  eq(res.progressUsed, true, "progressUsed phải true khi store có ingestWithProgress");
  eq(
    seen.map((s) => s.phase).join(","),
    "hashing,storing,done",
    "callback relink phải nhận đủ 3 pha theo thứ tự",
  );
});

await test("relink: không có onProgress → fallback ingest thường, progressUsed=false", async () => {
  const stubStore = {
    ingest: async () => ({ assetId: "a_test", originalName: "f.mp4", size: 3 }) as never,
  };
  const file = new File(["abc"], "f.mp4", { type: "video/mp4" });
  const res = await ingestImportedItemWithProgress(stubStore as never, { file, name: "f.mp4" });
  eq(res.progressUsed, false, "không callback thì không dùng đường tiến trình");
  eq(res.manifest !== null, true, "vẫn trả manifest qua đường fallback");
});

console.log(`\nttsDuration44Z3: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
