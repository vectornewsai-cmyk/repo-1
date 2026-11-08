/**
 * loadReport57N7.test.ts — Test khóa đợt 57 luồng N7: đóng nợ M5
 * (LIMITS đợt 56 §5.3) — `loadReport.ts` nhận ra câu tràn 100 mục ở cả
 * hai locale và có đường dịch `projectRepo.moreWarnings`.
 *
 * Bối cảnh: projectRepo.ts:1112 đẩy câu tràn VI đóng băng
 * `Còn N cảnh báo speedKeyframes khác (đã giới hạn hiển thị 100).`;
 * key `projectRepo.moreWarnings` KHÔNG có sẵn trong fragment M5 hay
 * vi/en.json (đã kiểm tra thực tế 2026-11-07) nên đợt này tạo key mới
 * trong fragment round57-n7.json. Khi một luồng khác nối
 * projectRepo.ts:1112 bằng trKey, câu tràn tới buildLoadReport sẽ là
 * bản EN — OVERFLOW_RE mới phải nhận ra cả hai dạng, nếu không câu EN
 * lọt vào otherWarnings và atCap về false.
 *
 * Bao phủ: fragment parity + không trùng key cũ (tương thích cả trước
 * và sau khi parent gộp fragment), formatOverflowLine vi/en/không
 * lookup/key thiếu, parseOverflowCount hai locale + dòng lạ, và
 * buildLoadReport/refresh/buildHistory với overflowCount.
 *
 * Chạy theo mẫu L2 đợt 56 M5 (import extensionless để tsc pass — file
 * này KHÔNG nằm trong exclude của tsconfig; chạy trực tiếp bằng Node
 * type-stripping sẽ không resolve được import extensionless nên phải
 * bundle bằng esbuild rồi chạy node):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/loadReport57N7.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round57-n7/n7.test.cjs
 *   node /tmp/round57-n7/n7.test.cjs
 */
import { readFileSync } from "node:fs";
import {
  buildHistoryLoadReport,
  buildLoadReport,
  formatOverflowLine,
  OVERFLOW_KEY,
  parseOverflowCount,
  refreshLoadReportAfterFix,
  type LoadReport,
} from "./loadReport";
import { formatSpeedCurveWarning, type SpeedCurveWarning } from "./projectRepo";

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

function eq(a: unknown, b: unknown, msg: string): void {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${msg} — nhận: ${JSON.stringify(a)}, muốn: ${JSON.stringify(b)}`);
  }
}

function readJson(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(`apps/web/src/${rel}`, "utf8")) as Record<string, unknown>;
}

function readText(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}

/** Lookup giả lập từ một dict `{projectRepo: {moreWarnings: ...}}` (mẫu t()). */
function lookupFrom(dict: Record<string, unknown>) {
  return (key: string, vars?: Record<string, string>): string => {
    let cur: unknown = dict;
    for (const part of key.split(".")) {
      if (typeof cur !== "object" || cur === null) return key;
      cur = (cur as Record<string, unknown>)[part];
    }
    if (typeof cur !== "string") return key;
    if (!vars) return cur;
    return cur.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}

const FRAG = readJson("i18n/fragments/round57-n7.json");
const fragVi = (FRAG["vi"] as Record<string, Record<string, string>>).projectRepo;
const fragEn = (FRAG["en"] as Record<string, Record<string, string>>).projectRepo;
const lookupVi = lookupFrom(FRAG["vi"] as Record<string, unknown>);
const lookupEn = lookupFrom(FRAG["en"] as Record<string, unknown>);

/** Chuỗi VI cũ đúng từng byte với template literal ở projectRepo.ts:1112. */
const VI_7 = "Còn 7 cảnh báo speedKeyframes khác (đã giới hạn hiển thị 100).";
const EN_7 = "Still 7 more speedKeyframes warnings (limited to showing 100).";

function w(path: string, clipId: string, i: number): SpeedCurveWarning {
  return { path, clipId, keyframeIndex: i, field: "v", value: 9, message: `msg v 9` };
}

test("fragment: chỉ có key projectRepo.moreWarnings, vi/en cùng tập key, khác nhau", () => {
  eq(Object.keys(fragVi), ["moreWarnings"], "vi fragment phải chỉ có moreWarnings");
  eq(Object.keys(fragEn), ["moreWarnings"], "en fragment phải chỉ có moreWarnings");
  assert(fragVi["moreWarnings"] !== fragEn["moreWarnings"], "vi/en phải khác nhau");
  assert(fragVi["moreWarnings"].includes("{n}"), "vi phải có placeholder {n}");
  assert(fragEn["moreWarnings"].includes("{n}"), "en phải có placeholder {n}");
});

test("fragment vi: đúng từng byte template literal projectRepo.ts:1112", () => {
  eq(fragVi["moreWarnings"].replace("{n}", "7"), VI_7, "vi fragment lệch literal gốc");
  const src = readText("lib/projectRepo.ts");
  assert(
    src.includes("cảnh báo speedKeyframes khác (đã giới hạn hiển thị 100)."),
    "projectRepo.ts không còn chứa literal tràn VI — fragment đã lệch source",
  );
});

test("fragment en: đúng câu EN đã chốt, không rò tiếng Việt", () => {
  eq(fragEn["moreWarnings"].replace("{n}", "7"), EN_7, "en fragment lệch câu đã chốt");
  assert(!/[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/.test(fragEn["moreWarnings"]),
    "en fragment rò ký tự tiếng Việt");
});

test("fragment: nếu dict vi/en.json đã gộp key thì phải khớp fragment (tương thích pre/post merge)", () => {
  const vi = readJson("i18n/vi.json");
  const en = readJson("i18n/en.json");
  const viRepo = (vi["projectRepo"] as Record<string, string> | undefined) ?? {};
  const enRepo = (en["projectRepo"] as Record<string, string> | undefined) ?? {};
  if (viRepo["moreWarnings"] !== undefined) {
    eq(viRepo["moreWarnings"], fragVi["moreWarnings"], "vi.json đã gộp nhưng lệch fragment");
  }
  if (enRepo["moreWarnings"] !== undefined) {
    eq(enRepo["moreWarnings"], fragEn["moreWarnings"], "en.json đã gộp nhưng lệch fragment");
  }
});

test("formatOverflowLine: không lookup → fallback VI đúng từng byte", () => {
  eq(formatOverflowLine(7), VI_7, "không lookup phải ra VI literal");
  eq(
    formatOverflowLine(0),
    "Còn 0 cảnh báo speedKeyframes khác (đã giới hạn hiển thị 100).",
    "n=0 vẫn đúng format",
  );
});

test("formatOverflowLine: lookup vi → VI, lookup en → EN đã dịch", () => {
  eq(formatOverflowLine(7, lookupVi), VI_7, "lookup vi phải ra VI");
  eq(formatOverflowLine(7, lookupEn), EN_7, "lookup en phải ra EN");
  assert(!formatOverflowLine(7, lookupEn).includes("cảnh báo"), "bản EN không được rò VI");
});

test("formatOverflowLine: lookup trả đúng key (key chưa gộp) → fallback VI, không hiện key thô", () => {
  const missing = (_key: string, _vars?: Record<string, string>): string => _key;
  eq(formatOverflowLine(7, missing), VI_7, "key thiếu phải fallback VI");
  assert(formatOverflowLine(7, missing) !== OVERFLOW_KEY, "không được hiện key thô");
});

test("parseOverflowCount: nhận cả VI lẫn EN, trích đúng số", () => {
  eq(parseOverflowCount(VI_7), 7, "VI phải trích 7");
  eq(parseOverflowCount(EN_7), 7, "EN phải trích 7");
  eq(parseOverflowCount("Còn 1234 cảnh báo speedKeyframes khác (đã giới hạn hiển thị 100)."), 1234, "số lớn");
  eq(parseOverflowCount("Still 1234 more speedKeyframes warnings (limited to showing 100)."), 1234, "số lớn EN");
});

test("parseOverflowCount: dòng lạ → null (không khớp nhầm)", () => {
  eq(parseOverflowCount("Còn 7 cảnh báo khác"), null, "thiếu speedKeyframes");
  eq(parseOverflowCount("Still 7 more warnings"), null, "EN thiếu speedKeyframes");
  eq(parseOverflowCount("lưu ý khác"), null, "dòng thường");
  eq(parseOverflowCount(""), null, "dòng rỗng");
  eq(parseOverflowCount("Còn cảnh báo speedKeyframes khác"), null, "không có số");
  eq(parseOverflowCount("xCòn 7 cảnh báo speedKeyframes khác"), null, "không neo đầu dòng");
});

test("buildLoadReport: câu tràn VI → atCap true, trừ khỏi otherWarnings, overflowCount 7", () => {
  const rep = buildLoadReport({ warnings: [VI_7, "lưu ý khác"] }, "file", "x");
  eq(rep.atCap, true, "atCap phải true");
  eq(rep.otherWarnings, ["lưu ý khác"], "câu tràn VI phải bị trừ");
  eq(rep.overflowCount, 7, "overflowCount phải 7");
});

test("buildLoadReport: câu tràn EN → atCap true, KHÔNG lọt otherWarnings, overflowCount 7", () => {
  const rep = buildLoadReport({ warnings: [EN_7, "lưu ý khác"] }, "file", "x");
  eq(rep.atCap, true, "atCap EN phải true");
  eq(rep.otherWarnings, ["lưu ý khác"], `câu tràn EN lọt otherWarnings: ${JSON.stringify(rep.otherWarnings)}`);
  eq(rep.overflowCount, 7, "overflowCount EN phải 7");
  // Đường dịch khép kín: số đếm trích được dựng lại đúng câu EN đã dịch.
  eq(formatOverflowLine(rep.overflowCount ?? -1, lookupEn), EN_7, "dựng lại câu EN từ count");
});

test("buildLoadReport: không câu tràn → overflowCount null; 100 mục không câu tràn vẫn null", () => {
  const plain = buildLoadReport({ warnings: ["lưu ý A"] }, "file", "x");
  eq(plain.atCap, false, "không tràn thì atCap false");
  eq(plain.overflowCount, null, "không tràn thì overflowCount null");
  const sws: SpeedCurveWarning[] = [];
  const strs: string[] = [];
  for (let i = 0; i < 100; i++) {
    const x = w("tracks[0].clips[0]", "c", i);
    sws.push(x);
    strs.push(formatSpeedCurveWarning(x));
  }
  const full = buildLoadReport({ warnings: strs, speedCurveWarnings: sws }, "file", "big");
  eq(full.atCap, true, "100 mục vẫn atCap true");
  eq(full.overflowCount, null, "100 mục nhưng không có câu tràn thì count null");
  eq(full.otherWarnings, [], "không có lưu ý khác");
});

test("buildLoadReport: 100 mục + câu tràn EN → otherWarnings rỗng, overflowCount 7", () => {
  const sws: SpeedCurveWarning[] = [];
  const strs: string[] = [];
  for (let i = 0; i < 100; i++) {
    const x = w("tracks[0].clips[0]", "c", i);
    sws.push(x);
    strs.push(formatSpeedCurveWarning(x));
  }
  strs.push(EN_7);
  const rep = buildLoadReport({ warnings: strs, speedCurveWarnings: sws }, "file", "big");
  eq(rep.atCap, true, "atCap phải true");
  eq(rep.otherWarnings, [], "câu tràn EN phải bị trừ");
  eq(rep.overflowCount, 7, "overflowCount phải 7");
});

test("buildLoadReport: dòng gần giống câu tràn vẫn ở lại otherWarnings (parse không đổi)", () => {
  const near = "Còn 7 cảnh báo khác (không phải speedKeyframes).";
  const rep = buildLoadReport({ warnings: [near, VI_7] }, "file", "x");
  eq(rep.otherWarnings, [near], "dòng gần giống phải ở lại otherWarnings");
  eq(rep.overflowCount, 7, "count vẫn từ câu tràn thật");
});

test("buildHistoryLoadReport: overflowCount null, atCap false", () => {
  const r = buildHistoryLoadReport([w("tracks[0].clips[0]", "c", 0)], "proj");
  eq(r.atCap, false, "history atCap false");
  eq(r.overflowCount, null, "history overflowCount null");
});

test("refreshLoadReportAfterFix: overflowCount về null cùng atCap", () => {
  const base: LoadReport = {
    source: "file",
    projectName: "proj",
    loadedAt: "2026-11-07T00:00:00.000Z",
    warnings: [],
    otherWarnings: [],
    structuredNotes: [],
    atCap: true,
    overflowCount: 7,
  };
  const refreshed = refreshLoadReportAfterFix(base, []);
  eq(refreshed.atCap, false, "refresh atCap false");
  eq(refreshed.overflowCount, null, "refresh overflowCount phải null (quét lại không cắt)");
  eq(refreshed.source, "file", "refresh giữ nguồn");
});

console.log(`\nloadReport57N7: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
