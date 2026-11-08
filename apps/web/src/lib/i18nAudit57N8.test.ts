// i18nAudit57N8.test.ts — Phase 9 đợt 57, luồng N8: quét vét (sweep)
// literal tiếng Việt cứng còn sót trong apps/web/src sau đợt 56.
//
// Chạy bằng esbuild bundle (mẫu M6/L2, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì react-dom/server
// dùng require động (mẫu L2; test này không render React nhưng giữ cùng
// lệnh cho đồng nhất):
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit57N8.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round57-n8/n8.test.cjs \
//     && node /tmp/round57-n8/n8.test.cjs
//
// Test này khóa:
//  1. Fragment round57-n8.json: đủ 23 key, vi/en parity, nội dung đúng
//     từng chữ, vi khác en, placeholder khớp.
//  2. Hành vi thật với lookup dựng từ fragment: parseCube (userLut),
//     parseSubtitleFile/parseSrt/parseVtt (subtitles) và
//     HistoryStore.validateImport/importHistory + IndexedDBBackend.openDb
//     (projectHistory) trả chuỗi EN khi có lookup, fallback VI từng chữ
//     khi không có lookup.
//  3. Source: 3 file đã sửa dùng trKey() đúng key, không import ../i18n
//     trực tiếp (giữ tương thích Node type-stripping như M5/M6).
//  4. Phân loại toàn bộ 1650 literal quét được: đọc verdicts.json
//     (trạng thái làm việc của đợt, ../goals/... — KHÔNG nằm trong repo,
//     không stage) và khóa tổng + bảng theo file cho 1285 literal MỚI.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import fragment from "../i18n/fragments/round57-n8.json";
import { parseCube } from "./userLut";
import { parseSubtitleFile, parseSrt, parseVtt } from "./subtitles";
import {
  HistoryStore,
  IndexedDBBackend,
  MemoryBackend,
  getHistoryStore,
} from "./projectHistory";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7). */
declare const process: { exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`N8 i18n sweep round 57: ${pass}/${queue.length} pass`);
}

// --- Lookup dựng từ fragment thật (cùng ngữ nghĩa t(): {var} + key thiếu → key) ---
type Dict = Record<string, unknown>;
function flatten(o: unknown, prefix: string, out: Set<string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.add(q);
  }
}
function lookupAt(raw: Dict, key: string): string {
  let cur: unknown = raw;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown>)[part];
  return cur as string;
}
function lookupFor(lang: "vi" | "en"): (key: string, vars?: Record<string, string>) => string {
  const dict = (fragment as unknown as Record<string, Dict>)[lang];
  return (key: string, vars?: Record<string, string>) => {
    const raw = lookupAt(dict, key);
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
/** Lookup cố tình thiếu key (trả về chính key) — trKey phải fallback VI. */
const missingLookup = (key: string): string => key;

const N8_KEYS = [
  "userLut.cubeTooLarge",
  "userLut.cubeEmpty",
  "userLut.cubeTripleExpected",
  "userLut.cubeTripleInvalid",
  "userLut.cubeSizeInvalid",
  "userLut.cubeSizeDuplicate",
  "userLut.cubeOnly3d",
  "userLut.cubeRowInvalid",
  "userLut.cubeValueRange",
  "userLut.cubeMissingSize",
  "userLut.cubeRowCount",
  "projectHistory.noIndexedDb",
  "projectHistory.indexedDbOpenFailed",
  "projectHistory.historyNotJsonObject",
  "projectHistory.historyBadFormat",
  "projectHistory.historyMissingFields",
  "projectHistory.historyBadVersion",
  "projectHistory.historyBadHash",
  "subtitles.errMissingWebvtt",
  "subtitles.errMissingTimestamp",
  "subtitles.errBadTimestamp",
  "subtitles.errEndNotAfterStart",
  "subtitles.errEmptyCue",
] as const;

const EXPECTED: Record<string, [string, string]> = {
  "userLut.cubeTooLarge": [
    "File .cube quá lớn ({size}MB, tối đa 10MB).",
    "Cube file too large ({size}MB, max 10MB).",
  ],
  "userLut.cubeEmpty": ["File .cube rỗng.", "Cube file is empty."],
  "userLut.cubeTripleExpected": [
    "{what} phải có đúng 3 số (nhận được: {got})",
    "{what} must have exactly 3 numbers (got: {got})",
  ],
  "userLut.cubeTripleInvalid": [
    "{what} chứa số không hợp lệ: {got}",
    "{what} contains an invalid number: {got}",
  ],
  "userLut.cubeSizeInvalid": [
    "LUT_3D_SIZE không hợp lệ: {value} (cần số nguyên {min}..{max}).",
    "Invalid LUT_3D_SIZE: {value} (needs an integer {min}..{max}).",
  ],
  "userLut.cubeSizeDuplicate": [
    "File có 2 dòng LUT_3D_SIZE.",
    "File has two LUT_3D_SIZE lines.",
  ],
  "userLut.cubeOnly3d": [
    "Chỉ hỗ trợ LUT 3D (LUT_3D_SIZE). File LUT 1D chưa được hỗ trợ.",
    "Only 3D LUTs are supported (LUT_3D_SIZE). 1D LUT files are not supported yet.",
  ],
  "userLut.cubeRowInvalid": [
    'Dòng dữ liệu sai định dạng (cần đúng 3 số): "{line}"',
    'Malformed data line (needs exactly 3 numbers): "{line}"',
  ],
  "userLut.cubeValueRange": [
    'Giá trị màu ngoài khoảng cho phép (-1..2): "{line}"',
    'Color value out of allowed range (-1..2): "{line}"',
  ],
  "userLut.cubeMissingSize": [
    "Thiếu dòng LUT_3D_SIZE trong file .cube.",
    "Missing LUT_3D_SIZE line in the .cube file.",
  ],
  "userLut.cubeRowCount": [
    "Số dòng dữ liệu không khớp LUT_3D_SIZE {size}: có {rows} dòng, cần {expected} dòng.",
    "Data row count does not match LUT_3D_SIZE {size}: got {rows} rows, need {expected}.",
  ],
  "projectHistory.noIndexedDb": [
    "Trình duyệt không có IndexedDB.",
    "This browser has no IndexedDB.",
  ],
  "projectHistory.indexedDbOpenFailed": [
    "Không mở được IndexedDB.",
    "Could not open IndexedDB.",
  ],
  "projectHistory.historyNotJsonObject": [
    "File lịch sử không phải JSON object.",
    "History file is not a JSON object.",
  ],
  "projectHistory.historyBadFormat": [
    "File không phải định dạng lịch sử VCut (vcut-history v1).",
    "File is not a VCut history file (vcut-history v1).",
  ],
  "projectHistory.historyMissingFields": [
    "File lịch sử thiếu projectId hoặc danh sách version.",
    "History file is missing projectId or the version list.",
  ],
  "projectHistory.historyBadVersion": [
    "File lịch sử có version hỏng (thiếu id/projectId/spec).",
    "History file has a broken version (missing id/projectId/spec).",
  ],
  "projectHistory.historyBadHash": [
    "Version {id} sai hash spec — file có thể đã bị sửa.",
    "Version {id} has a wrong spec hash — the file may have been modified.",
  ],
  "subtitles.errMissingWebvtt": ["Thiếu dòng đầu WEBVTT.", "Missing WEBVTT header line."],
  "subtitles.errMissingTimestamp": [
    "Thiếu dòng timestamp (-->).",
    "Missing timestamp line (-->).",
  ],
  "subtitles.errBadTimestamp": [
    'Timestamp sai định dạng: "{line}".',
    'Malformed timestamp: "{line}".',
  ],
  "subtitles.errEndNotAfterStart": [
    "Thời gian kết thúc ({end}s) không sau bắt đầu ({start}s).",
    "End time ({end}s) is not after start time ({start}s).",
  ],
  "subtitles.errEmptyCue": ["Cue không có text.", "Cue has no text."],
};

function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

// --- 1. Fragment: parity + nội dung 23 key -------------------------------
ok("fragment round57-n8: vi/en parity, đủ 23 key, nội dung đúng từng chữ", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten((fragment as unknown as Record<string, Dict>).vi, "", viKeys);
  flatten((fragment as unknown as Record<string, Dict>).en, "", enKeys);
  assert.equal(viKeys.size, 23);
  assert.equal(enKeys.size, 23);
  for (const k of N8_KEYS) {
    assert.ok(viKeys.has(k), `vi thiếu key ${k}`);
    assert.ok(enKeys.has(k), `en thiếu key ${k}`);
    const [v, e] = EXPECTED[k];
    assert.equal(lookupAt((fragment as unknown as Record<string, Dict>).vi, k), v, `${k} vi`);
    assert.equal(lookupAt((fragment as unknown as Record<string, Dict>).en, k), e, `${k} en`);
    assert.notEqual(v, e, `${k}: vi phải khác en`);
    assert.deepEqual(placeholders(v), placeholders(e), `${k}: placeholder vi/en phải khớp`);
  }
});

// --- 2a. parseCube: EN vs fallback VI ------------------------------------
function cubeErr(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error("đáng lẽ phải throw");
}
const CUBE_2 = "LUT_3D_SIZE 2\n" + "0 0 0\n".repeat(8);
ok("parseCube: lookup EN dịch đủ 11 lỗi, không lookup fallback VI từng chữ", () => {
  const en = lookupFor("en");
  assert.equal(cubeErr(() => parseCube("x", 11 * 1024 * 1024, en)), "Cube file too large (11.0MB, max 10MB).");
  assert.equal(cubeErr(() => parseCube("x", 11 * 1024 * 1024)), "File .cube quá lớn (11.0MB, tối đa 10MB).");
  assert.equal(cubeErr(() => parseCube("", 0, en)), "Cube file is empty.");
  assert.equal(cubeErr(() => parseCube("", 0)), "File .cube rỗng.");
  assert.equal(
    cubeErr(() => parseCube("DOMAIN_MIN 0 0\nLUT_3D_SIZE 2\n", 100, en)),
    "DOMAIN_MIN must have exactly 3 numbers (got: 0 0)",
  );
  assert.equal(
    cubeErr(() => parseCube("DOMAIN_MIN 0 0\nLUT_3D_SIZE 2\n", 100)),
    "DOMAIN_MIN phải có đúng 3 số (nhận được: 0 0)",
  );
  assert.equal(
    cubeErr(() => parseCube("DOMAIN_MIN 0 0 x\nLUT_3D_SIZE 2\n", 100, en)),
    "DOMAIN_MIN contains an invalid number: 0 0 x",
  );
  assert.equal(
    cubeErr(() => parseCube("LUT_3D_SIZE 1\n", 100, en)),
    "Invalid LUT_3D_SIZE: 1 (needs an integer 2..256).",
  );
  assert.equal(
    cubeErr(() => parseCube("LUT_3D_SIZE 1\n", 100)),
    "LUT_3D_SIZE không hợp lệ: 1 (cần số nguyên 2..256).",
  );
  assert.equal(
    cubeErr(() => parseCube("LUT_3D_SIZE 2\nLUT_3D_SIZE 2\n", 100, en)),
    "File has two LUT_3D_SIZE lines.",
  );
  assert.equal(cubeErr(() => parseCube("LUT_1D_SIZE 2\n", 100, en)), "Only 3D LUTs are supported (LUT_3D_SIZE). 1D LUT files are not supported yet.");
  assert.equal(
    cubeErr(() => parseCube("LUT_3D_SIZE 2\n0 0\n", 100, en)),
    'Malformed data line (needs exactly 3 numbers): "0 0"',
  );
  assert.equal(
    cubeErr(() => parseCube("LUT_3D_SIZE 2\n0 0\n", 100)),
    'Dòng dữ liệu sai định dạng (cần đúng 3 số): "0 0"',
  );
  assert.equal(
    cubeErr(() => parseCube("LUT_3D_SIZE 2\n0 0 5\n", 100, en)),
    'Color value out of allowed range (-1..2): "0 0 5"',
  );
  assert.equal(
    cubeErr(() => parseCube("0 0 0\n", 100, en)),
    "Missing LUT_3D_SIZE line in the .cube file.",
  );
  assert.equal(
    cubeErr(() => parseCube("LUT_3D_SIZE 2\n" + "0 0 0\n".repeat(7), 100, en)),
    "Data row count does not match LUT_3D_SIZE 2: got 7 rows, need 8.",
  );
  assert.equal(
    cubeErr(() => parseCube("LUT_3D_SIZE 2\n" + "0 0 0\n".repeat(7), 100)),
    "Số dòng dữ liệu không khớp LUT_3D_SIZE 2: có 7 dòng, cần 8 dòng.",
  );
  // File hợp lệ vẫn parse được (có/không lookup).
  assert.equal(parseCube(CUBE_2, 100, en).size, 2);
  assert.equal(parseCube(CUBE_2, 100).size, 2);
  // Lookup thiếu key → fallback VI (đúng ngữ nghĩa trKey).
  assert.equal(
    cubeErr(() => parseCube("", 0, missingLookup)),
    "File .cube rỗng.",
  );
});

// --- 2b. parseSubtitleFile: EN vs fallback VI ----------------------------
ok("parseSubtitleFile: lookup EN dịch đủ 5 lý do lỗi, không lookup fallback VI", () => {
  const en = lookupFor("en");
  // Thiếu header WEBVTT (parseVtt).
  assert.equal(parseVtt("không phải vtt\n", en).errors[0].reason, "Missing WEBVTT header line.");
  assert.equal(parseVtt("không phải vtt\n").errors[0].reason, "Thiếu dòng đầu WEBVTT.");
  // Thiếu dòng timestamp.
  assert.equal(parseSrt("hello\n", en).errors[0].reason, "Missing timestamp line (-->).");
  assert.equal(parseSrt("hello\n").errors[0].reason, "Thiếu dòng timestamp (-->).");
  // Timestamp sai định dạng.
  assert.equal(
    parseSrt("00:00:01,000 --> xx\nHi\n", en).errors[0].reason,
    'Malformed timestamp: "00:00:01,000 --> xx".',
  );
  assert.equal(
    parseSrt("00:00:01,000 --> xx\nHi\n").errors[0].reason,
    'Timestamp sai định dạng: "00:00:01,000 --> xx".',
  );
  // Kết thúc không sau bắt đầu.
  assert.equal(
    parseSrt("00:00:02,000 --> 00:00:01,000\nHi\n", en).errors[0].reason,
    "End time (1s) is not after start time (2s).",
  );
  assert.equal(
    parseSrt("00:00:02,000 --> 00:00:01,000\nHi\n").errors[0].reason,
    "Thời gian kết thúc (1s) không sau bắt đầu (2s).",
  );
  // Cue không có text.
  assert.equal(parseSrt("00:00:01,000 --> 00:00:02,000\n\n", en).errors[0].reason, "Cue has no text.");
  assert.equal(parseSrt("00:00:01,000 --> 00:00:02,000\n\n").errors[0].reason, "Cue không có text.");
  // File hợp lệ qua parseSubtitleFile (cả 2 đường VTT/SRT), không lỗi.
  const vtt = parseSubtitleFile("WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nV\n", en);
  assert.equal(vtt.errors.length, 0);
  assert.equal(vtt.cues.length, 1);
  const srt = parseSubtitleFile("1\n00:00:01,000 --> 00:00:02,000\nS\n", en);
  assert.equal(srt.errors.length, 0);
  assert.equal(srt.cues.length, 1);
  // Lookup thiếu key → fallback VI.
  assert.equal(parseSrt("hello\n", missingLookup).errors[0].reason, "Thiếu dòng timestamp (-->).");
});

// --- 2c. HistoryStore.validateImport/importHistory + IndexedDBBackend -----
function importErr(store: HistoryStore, data: unknown, lookup?: (key: string, vars?: Record<string, string>) => string): string {
  try {
    store.validateImport(data, lookup);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error("đáng lẽ phải throw");
}
ok("validateImport/importHistory: lookup EN dịch đủ 5 lỗi, không lookup fallback VI", async () => {
  const en = lookupFor("en");
  const store = new HistoryStore(new MemoryBackend());
  assert.equal(importErr(store, null, en), "History file is not a JSON object.");
  assert.equal(importErr(store, null), "File lịch sử không phải JSON object.");
  assert.equal(
    importErr(store, { format: "khác", formatVersion: 1, projectId: "p", versions: [] }, en),
    "File is not a VCut history file (vcut-history v1).",
  );
  assert.equal(
    importErr(store, { format: "vcut-history", formatVersion: 1, projectId: "p" }, en),
    "History file is missing projectId or the version list.",
  );
  assert.equal(
    importErr(
      store,
      { format: "vcut-history", formatVersion: 1, projectId: "p", versions: [{ id: "x" }] },
      en,
    ),
    "History file has a broken version (missing id/projectId/spec).",
  );
  const badHash = {
    format: "vcut-history",
    formatVersion: 1,
    projectId: "p",
    exportedAt: "",
    versions: [
      {
        id: "v9",
        projectId: "p",
        createdAt: 0,
        createdAtIso: "",
        label: "",
        hash: "00000000",
        parentId: "",
        summary: [],
        spec: { version: "0.2.0", meta: { name: "P", width: 1, height: 1, fps: 30 }, tracks: [] },
      },
    ],
  };
  assert.equal(
    importErr(store, badHash, en),
    "Version v9 has a wrong spec hash — the file may have been modified.",
  );
  assert.equal(importErr(store, badHash), "Version v9 sai hash spec — file có thể đã bị sửa.");
  // importHistory truyền lookup xuyên qua validateImport.
  let threwEn = "";
  try {
    await store.importHistory({ format: "khác" }, en);
  } catch (e) {
    threwEn = (e as Error).message;
  }
  assert.equal(threwEn, "File is not a VCut history file (vcut-history v1).");
  // Lookup thiếu key → fallback VI.
  assert.equal(importErr(store, null, missingLookup), "File lịch sử không phải JSON object.");
  // File hợp lệ vẫn import được (không lookup).
  const good = {
    format: "vcut-history",
    formatVersion: 1,
    projectId: "p",
    exportedAt: "",
    versions: [],
  };
  assert.equal(await store.importHistory(good), 0);
});

ok("IndexedDBBackend: lookup EN dịch lỗi mở DB, không lookup fallback VI", async () => {
  const en = lookupFor("en");
  // Node không có indexedDB → openDb reject ngay (không chạm DB thật).
  const beEn = new IndexedDBBackend(en);
  await assert.rejects(beEn.list("p"), /This browser has no IndexedDB\./);
  const beVi = new IndexedDBBackend();
  await assert.rejects(beVi.list("p"), /Trình duyệt không có IndexedDB\./);
  const beMiss = new IndexedDBBackend(missingLookup);
  await assert.rejects(beMiss.list("p"), /Trình duyệt không có IndexedDB\./);
});

ok("getHistoryStore: nhận lookup tùy chọn, singleton vẫn hoạt động", async () => {
  const en = lookupFor("en");
  const s = getHistoryStore(en);
  assert.ok(s);
  assert.deepEqual(await s.listVersions("khong-co-project"), []);
  // Gọi lại không lookup → vẫn cùng singleton, không throw.
  assert.equal(getHistoryStore(), s);
});

// --- 3. Source: trKey đúng key, không import ../i18n trực tiếp -----------
function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}
ok("source: 3 file dùng trKey đúng 23 key, không import ../i18n", () => {
  const userLut = readSrc("lib/userLut.ts");
  for (const k of N8_KEYS.filter((x) => x.startsWith("userLut."))) {
    assert.ok(userLut.includes(`"${k}"`), `userLut.ts thiếu trKey ${k}`);
  }
  const ph = readSrc("lib/projectHistory.ts");
  for (const k of N8_KEYS.filter((x) => x.startsWith("projectHistory."))) {
    assert.ok(ph.includes(`"${k}"`), `projectHistory.ts thiếu trKey ${k}`);
  }
  const sub = readSrc("lib/subtitles.ts");
  for (const k of N8_KEYS.filter((x) => x.startsWith("subtitles."))) {
    assert.ok(sub.includes(`"${k}"`), `subtitles.ts thiếu trKey ${k}`);
  }
  // Không file nào import ../i18n trực tiếp (giữ tương thích Node
  // type-stripping như M5/M6): lookup chỉ đi qua tham số.
  for (const rel of ["lib/userLut.ts", "lib/projectHistory.ts", "lib/subtitles.ts"]) {
    const src = readSrc(rel);
    assert.ok(!src.includes('from "../i18n"') && !src.includes("from './i18n'"), `${rel} không được import ../i18n trực tiếp`);
  }
  // Không còn literal VI hardcode ngoài fallback của trKey ở 3 hàm đã nối:
  // mỗi chuỗi VI trong parseCube/validateImport/parseBlocks phải nằm trong
  // cùng một trKey(...) — kiểm tra bằng đếm: số lần xuất hiện của từng
  // chuỗi VI trong file bằng đúng số lần nó làm fallback (1 lần/key).
  for (const [file, needles] of [
    ["lib/userLut.ts", ["File .cube quá lớn", "File .cube rỗng.", "phải có đúng 3 số", "chứa số không hợp lệ", "LUT_3D_SIZE không hợp lệ", "File có 2 dòng LUT_3D_SIZE", "Chỉ hỗ trợ LUT 3D", "Dòng dữ liệu sai định dạng", "Giá trị màu ngoài khoảng", "Thiếu dòng LUT_3D_SIZE", "Số dòng dữ liệu không khớp"]] as const,
    ["lib/projectHistory.ts", ["Trình duyệt không có IndexedDB", "Không mở được IndexedDB", "File lịch sử không phải JSON object", "File không phải định dạng lịch sử VCut", "File lịch sử thiếu projectId", "File lịch sử có version hỏng", "sai hash spec"]] as const,
    ["lib/subtitles.ts", ["Thiếu dòng đầu WEBVTT", "Thiếu dòng timestamp", "Timestamp sai định dạng", "Thời gian kết thúc", "Cue không có text"]] as const,
  ]) {
    const src = readSrc(file);
    for (const n of needles) {
      const count = src.split(n).length - 1;
      assert.equal(count, 1, `${file}: chuỗi "${n}" xuất hiện ${count} lần, kỳ vọng đúng 1 (fallback trKey)`);
    }
  }
});

// --- 4. Phân loại 1650 literal: khóa tổng + bảng file (chỉ literal MỚI) ---
ok("classification: verdicts.json tổng 1650, bảng literal MỚI theo file", () => {
  const v = JSON.parse(
    readFileSync(
      "../goals/capcut-clone-video-editor/hidden_files/round57-n8/verdicts.json",
      "utf8",
    ),
  ) as {
    meta: { total: number; classes: Record<string, number> };
    verdicts: Array<{ file: string; class: string; note: string }>;
  };
  assert.equal(v.meta.total, 1650);
  assert.equal(v.verdicts.length, 1650);
  const total = Object.values(v.meta.classes).reduce((a, b) => a + b, 0);
  assert.equal(total, 1650);
  assert.equal(v.meta.classes["DATA-CONTENT"], 636);
  assert.equal(v.meta.classes["DATA-MEASURE"], 346);
  assert.equal(v.meta.classes["M6-PRIOR"], 288);
  assert.equal(v.meta.classes["NON-UI"], 278);
  assert.equal(v.meta.classes["WIRED-FALLBACK"], 56);
  assert.equal(v.meta.classes["UI-DIRECT"], 23);
  assert.equal(v.meta.classes["WIRED-OWNER"], 15);
  assert.equal(v.meta.classes["ALREADY-PROPOSED"], 4);
  assert.equal(v.meta.classes["PROPER-NOUN"], 3);
  assert.equal(v.meta.classes["COVERED-N7"], 1);
  // Bảng literal MỚI (note 'mới ở đợt 57 N8') theo file — tổng 1285.
  const fresh = v.verdicts.filter((x) => x.note === "mới ở đợt 57 N8");
  assert.equal(fresh.length, 1285);
  const byFile: Record<string, Record<string, number>> = {};
  for (const x of fresh) {
    const f = x.file.replace("apps/web/src/", "");
    byFile[f] ??= {};
    byFile[f][x.class] = (byFile[f][x.class] ?? 0) + 1;
  }
  const expected: Record<string, Record<string, number>> = {
    "components/TtsButton.tsx": { "PROPER-NOUN": 2 },
    "components/nested/nestUtils.ts": { "NON-UI": 118 },
    "components/onboarding/TemplatePackModal.tsx": { "PROPER-NOUN": 1 },
    "desktop.ts": { "NON-UI": 1 },
    "lib/assetStore.ts": { "NON-UI": 7 },
    "lib/curveFix.ts": { "WIRED-OWNER": 4 },
    "lib/discardRestore35R6.ts": { "NON-UI": 6 },
    "lib/gopCache40V2.ts": { "NON-UI": 8 },
    "lib/gopSizeProbe41W4.ts": { "NON-UI": 3 },
    "lib/previewEngine.ts": { "NON-UI": 1 },
    "lib/projectHistory.ts": { "UI-DIRECT": 7 },
    "lib/projectRepo.ts": { "WIRED-OWNER": 3 },
    "lib/rehydrate36S5.ts": { "NON-UI": 5 },
    "lib/reverseRangeGate38U2.ts": { "NON-UI": 5 },
    "lib/reverseWebcodecs.ts": { "NON-UI": 6 },
    "lib/sampleMedia.ts": { "DATA-CONTENT": 1 },
    "lib/settle45A1.ts": { "NON-UI": 3 },
    "lib/settle47C2.ts": { "NON-UI": 2 },
    "lib/settle48D2.ts": { "NON-UI": 5 },
    "lib/settleAsset44Z1.ts": { "NON-UI": 5 },
    "lib/subtitles.ts": { "UI-DIRECT": 5 },
    "lib/syncProtocol.ts": { "NON-UI": 2 },
    "lib/templates.ts": { "DATA-CONTENT": 622 },
    "lib/thumbnails.ts": { "NON-UI": 1 },
    "lib/transitionPreview.ts": { "NON-UI": 73 },
    "lib/ttsEstimate45A3.ts": { "DATA-MEASURE": 4 },
    "lib/ttsEstimate46B3.ts": { "DATA-MEASURE": 32 },
    "lib/ttsEstimate47C4.ts": { "DATA-MEASURE": 38 },
    "lib/ttsEstimate48D1.ts": { "DATA-MEASURE": 24 },
    "lib/ttsEstimate49E1.ts": { "DATA-MEASURE": 38 },
    "lib/ttsEstimate50F3.ts": { "DATA-MEASURE": 63 },
    "lib/ttsEstimate51H1.ts": { "DATA-MEASURE": 28 },
    "lib/ttsEstimate51H2.ts": { "DATA-MEASURE": 119 },
    "lib/userLut.ts": { "UI-DIRECT": 11 },
    "lib/waveform.ts": { "NON-UI": 6 },
    "lib/webglLut.ts": { "NON-UI": 12 },
    "preview.tsx": { "NON-UI": 2 },
    "sample-nested.ts": { "NON-UI": 6 },
    "sample.ts": { "DATA-CONTENT": 6 },
  };
  assert.deepEqual(Object.keys(byFile).sort(), Object.keys(expected).sort(), "danh sách file có literal MỚI");
  for (const [f, counts] of Object.entries(expected)) {
    assert.deepEqual(byFile[f], counts, `bảng phân loại sai ở ${f}`);
  }
  // Không còn literal nào chưa phân loại.
  assert.ok(!v.verdicts.some((x) => x.class === "UNCLASSIFIED"));
});

void runAll();
