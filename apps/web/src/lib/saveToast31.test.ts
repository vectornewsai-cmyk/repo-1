/**
 * saveToast31.test.ts — Test khóa đợt 31 luồng N4: toast đường Lưu
 * file + chuỗi blob/migration sang dạng có cấu trúc (code + tham số)
 * để dịch qua i18n vi/en.
 *
 * Chỉ test các hàm thuần (Node type-stripping, từ gốc repo):
 *   node apps/web/src/lib/saveToast31.test.ts
 *
 * Phạm vi test:
 * - findBlobWarningItems / findBlobWarnings: item có code + params +
 *   fallback byte-identical với chuỗi cũ; clip không blob bị bỏ qua;
 *   clip blob trong nested ĐƯỢC quét từ đợt 32 O4 (khóa giới hạn đợt
 *   31 đã đảo ngược có chủ đích — xem structuredNotes32.test.ts).
 * - serializeProject: structuredNotes khớp 1-1 với warnings chuỗi.
 * - migrateProjectMotion: structuredNotes motionMigrated khớp chuỗi.
 * - parseProjectText: đủ 7 code (blobUrl, motionMigrated,
 *   motionMigratedHint, legacyEnvelope, formatVersionMismatch,
 *   schemaMigrated, textStyleFixed); mỗi fallback đều có mặt trong
 *   warnings chuỗi (tương thích ngược).
 * - buildLoadReport: otherWarnings trừ đúng các fallback của note
 *   (không parse chuỗi tiếng Việt); report giữ đủ structuredNotes.
 * - formatStructuredNote / formatNoteLines: vi khớp từng chữ fallback;
 *   en không rò key thô, không rò tiếng Việt (trừ notes thô bên trong
 *   motionMigrated — xem LIMITS đợt 31); formatNoteLines không hiện
 *   trùng một cảnh báo hai lần.
 * - i18n parity: dict vi/en flatten KHỚP TOÀN BỘ key (2283 key mỗi bên sau parent gộp đợt 64 (2275 sau đợt 63, +7 key fragment R2 6 + R8 1 + 1 key parent projectHistory); (2146 sau đợt 62, +131 key fragment − 1 key chết speed.warnTooShort − 1 key jobNote chưa có UI; 2044 sau đợt 61, +72 key; 1972 sau parent gộp đợt 60; 1969 sau đợt 60 Q4; 1957 sau gộp đợt 59
 *   — 1011 đợt 55 L1 + 711 key đợt 56 (683 fragment + 28 đề xuất M6))
 *   — +215 key đợt 57 (11 N4 + 180 label N5 + 1 N7 + 23 N8; 5 key EN N5 ghi đè)
 *   từ đợt 34 Q4 — 918 đợt 32 + 13 key errorDetail.summary mới,
 *   0 key mồ côi cả hai chiều),
 *   14 key mới đợt 31 có mặt cả hai bên.
 *
 * Không test render React (ProjectMenu/App/panel — không chạy được
 * bằng Node, như mọi đợt trước): wiring khóa bằng tsc 0 lỗi + vite
 * build pass + click-test (xem LIMITS đợt 31 — click-test Lưu file
 * ghi rõ khả thi hay nợ). Không test saveProject trực tiếp (cần DOM:
 * document/Blob/URL) — đường đó chỉ gọi serializeProject đã test +
 * formatNoteLines đã test.
 */
import { readFileSync } from "node:fs";
import {
  findBlobWarningItems,
  findBlobWarnings,
  migrateProjectMotion,
  parseProjectText,
  serializeProject,
} from "./projectRepo.ts";
import {
  buildLoadReport,
  formatNoteLines,
  formatStructuredNote,
} from "./loadReport.ts";

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

// ---- spec tối thiểu (theo mẫu projectRepo.test.ts / textStyle27K1.test.ts) ----

function videoClip(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "video", id, src: `${id}.mp4`, start: 0, duration: 10, in: 0, out: 10, ...extra };
}

function specOf(tracks: Record<string, unknown>[], version = "0.2.0"): Record<string, unknown> {
  return {
    version,
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks,
  };
}

function track(id: string, clips: Record<string, unknown>[]): Record<string, unknown> {
  return { id, kind: "video", clips };
}

function envelopeJson(spec: Record<string, unknown>, formatVersion = 1): string {
  return JSON.stringify({
    format: "vcut-project",
    formatVersion,
    appVersion: "0.1.0",
    specVersion: "0.2.0",
    savedAt: "2026-10-31T00:00:00.000Z",
    name: "Test",
    // Đợt 63 R7 — envelope thật do serializeProject ghi luôn mang
    // projectId ổn định; fixture không có id sẽ kích hoạt migration
    // (thêm note projectIdMigrated) và làm lệch các assert khóa đúng
    // danh sách note/warning của test này — migration đã có test riêng
    // ở projectId63R7.test.ts (B2/B3).
    projectId: "123e4567-e89b-42d3-a456-426614174000",
    spec,
  });
}

// ---- i18n: đọc dict thật (theo mẫu curveFixKeyframe30.test.ts) ----

function flatten(obj: unknown, prefix: string, out: Map<string, string>): void {
  if (typeof obj !== "object" || obj === null) return;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(key, v);
    else flatten(v, key, out);
  }
}

const viDict = new Map<string, string>();
const enDict = new Map<string, string>();
flatten(JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as unknown, "", viDict);
flatten(JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as unknown, "", enDict);

function makeLookup(dict: Map<string, string>, fallback: Map<string, string>) {
  return (key: string, vars?: Record<string, string>): string => {
    const raw = dict.get(key) ?? fallback.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
const tVi = makeLookup(viDict, viDict);
const tEn = makeLookup(enDict, viDict);

/** Dấu tiếng Việt — dùng để khẳng định bản en không rò tiếng Việt. */
const VI_DIACRITICS = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;

// ---- blob items ----

test("blob: item có code + params + fallback đúng mẫu chuỗi cũ", () => {
  const spec = specOf([
    track("v0", [videoClip("a", { src: "blob:xxx" }), videoClip("b")]),
    track("v1", [videoClip("c", { src: "blob:yyy" })]),
  ]) as never;
  const items = findBlobWarningItems(spec);
  eq(items.length, 2, "phải có đúng 2 item blob");
  eq(items[0].code, "blobUrl", "code sai");
  eq(items[0].params, { clipId: "a", trackId: "v0" }, "params sai");
  eq(
    items[0].fallback,
    'Clip "a" trên track "v0" đang trỏ tới blob: URL — media này sẽ mất khi tải lại trang (xem P2.2 asset store).',
    "fallback phải byte-identical với chuỗi cũ",
  );
  eq(items[1].params, { clipId: "c", trackId: "v1" }, "params item thứ hai sai");
  eq(findBlobWarnings(spec), items.map((n) => n.fallback), "findBlobWarnings phải suy ra từ items");
});

test("blob: clip trong nested ĐƯỢC quét từ đợt 32 O4 (đảo ngược khóa đợt 31)", () => {
  const nested = {
    kind: "nested", id: "n0", start: 0, duration: 10,
    subSpec: specOf([track("v0", [videoClip("inner", { src: "blob:zzz" })])]),
  };
  const spec = specOf([track("v0", [nested])]) as never;
  const items = findBlobWarningItems(spec);
  eq(items.length, 1, "nested blob phải được quét từ đợt 32");
  eq(items[0].params.clipId, "inner", "clipId nested sai");
  eq(items[0].params.trackId, "v0", "trackId nested phải là track trực tiếp");
  eq(items[0].params.path, "tracks[0].clips[0].subSpec.tracks[0].clips[0]", "path nested sai");
});

// ---- serializeProject ----

test("serialize: structuredNotes khớp 1-1 với warnings chuỗi", () => {
  const spec = specOf([track("v0", [videoClip("a", { src: "blob:xxx" })])]) as never;
  const res = serializeProject(spec, "Test");
  eq(res.warnings.length, 1, "warnings chuỗi sai");
  eq(res.structuredNotes.length, 1, "structuredNotes sai");
  eq(res.warnings[0], res.structuredNotes[0].fallback, "chuỗi và fallback lệch nhau");
  eq(res.structuredNotes[0].code, "blobUrl", "code serialize sai");
});

// ---- migrateProjectMotion ----

test("migrate motion: structuredNotes khớp chuỗi, spec mới rỗng", () => {
  const legacy = specOf([
    track("v0", [{
      kind: "video", id: "c0", src: "a.mp4", start: 0, duration: 2, in: 0, out: 2,
      motion: { motionBlur: { frames: 3, weights: [0, 0, 0] } },
    }]),
  ]) as never;
  const r = migrateProjectMotion(legacy);
  eq(r.warnings.length, 1, "phải có 1 warning chuỗi");
  eq(r.structuredNotes.length, 1, "phải có 1 structuredNote");
  eq(r.structuredNotes[0].code, "motionMigrated", "code sai");
  eq(r.structuredNotes[0].params.path, "tracks[0].clips[0]", "path sai");
  eq(r.structuredNotes[0].params.clipId, "c0", "clipId sai");
  eq(r.structuredNotes[0].fallback, r.warnings[0], "fallback phải bằng chuỗi");
  const fresh = specOf([
    track("v0", [{
      kind: "video", id: "c0", src: "a.mp4", start: 0, duration: 2, in: 0, out: 2,
      motion: { motionBlur: { frames: 3, weights: [1, 2, 1] } },
    }]),
  ]) as never;
  const rf = migrateProjectMotion(fresh);
  eq(rf.warnings.length, 0, "spec mới không có warning");
  eq(rf.structuredNotes.length, 0, "spec mới không có structuredNote");
});

// ---- parseProjectText: từng code ----

test("parse: formatVersion khác 1 → note formatVersionMismatch", () => {
  const res = parseProjectText(envelopeJson(specOf([track("v0", [videoClip("a")])]), 2));
  assert(res.ok, `load phải ok: ${res.errors.join("; ")}`);
  const note = res.structuredNotes.find((n) => n.code === "formatVersionMismatch");
  assert(note, `thiếu note formatVersionMismatch: ${JSON.stringify(res.structuredNotes)}`);
  eq(note.params, { version: "2" }, "params version sai");
  assert(res.warnings.includes(note.fallback), "fallback phải có trong warnings chuỗi");
});

test("parse: không envelope → note legacyEnvelope", () => {
  const res = parseProjectText(JSON.stringify(specOf([track("v0", [videoClip("a")])])));
  assert(res.ok, `load phải ok: ${res.errors.join("; ")}`);
  const note = res.structuredNotes.find((n) => n.code === "legacyEnvelope");
  assert(note, "thiếu note legacyEnvelope");
  assert(res.warnings.includes(note.fallback), "fallback phải có trong warnings chuỗi");
});

test("parse: schema 0.1.0 → note schemaMigrated, spec đã nâng cấp", () => {
  const res = parseProjectText(envelopeJson(specOf([track("v0", [videoClip("a")])], "0.1.0")));
  assert(res.ok, `load phải ok: ${res.errors.join("; ")}`);
  const note = res.structuredNotes.find((n) => n.code === "schemaMigrated");
  assert(note, `thiếu note schemaMigrated: ${JSON.stringify(res.structuredNotes)}`);
  eq(note.params, { from: "0.1.0", to: "0.2.0" }, "params schema sai");
  assert(res.warnings.includes(note.fallback), "fallback phải có trong warnings chuỗi");
  eq((res.spec as unknown as Record<string, unknown>)["version"], "0.2.0", "spec phải nâng cấp lên 0.2.0");
});

test("parse: text clip thiếu style → note textStyleFixed", () => {
  const spec = specOf([
    track("v0", [{ kind: "text", id: "t1", text: "Hi", start: 0, duration: 3 }]),
  ]);
  const res = parseProjectText(envelopeJson(spec));
  assert(res.ok, `load phải ok: ${res.errors.join("; ")}`);
  const note = res.structuredNotes.find((n) => n.code === "textStyleFixed");
  assert(note, `thiếu note textStyleFixed: ${JSON.stringify(res.structuredNotes)}`);
  eq(note.params.count, "1", "count sai");
  assert(note.params.shown.includes("t1"), `shown phải nhắc clip t1: ${note.params.shown}`);
  assert(res.warnings.includes(note.fallback), "fallback phải có trong warnings chuỗi");
});

test("parse: blob + motion cùng lúc → đủ note, đúng thứ tự, kèm hint", () => {
  const spec = specOf([
    track("v0", [
      videoClip("a", { src: "blob:xxx" }),
      {
        kind: "video", id: "c0", src: "a.mp4", start: 0, duration: 2, in: 0, out: 2,
        motion: { motionBlur: { frames: 3, weights: [0, 0, 0] } },
      },
    ]),
  ]);
  const res = parseProjectText(envelopeJson(spec));
  assert(res.ok, `load phải ok: ${res.errors.join("; ")}`);
  const codes = res.structuredNotes.map((n) => n.code);
  eq(codes, ["motionMigrated", "motionMigratedHint", "blobUrl"], `thứ tự/code sai: ${JSON.stringify(codes)}`);
  for (const n of res.structuredNotes) {
    assert(res.warnings.includes(n.fallback), `fallback ${n.code} vắng trong warnings chuỗi`);
  }
});

// ---- buildLoadReport ----

test("buildLoadReport: trừ fallback khỏi otherWarnings, giữ đủ note", () => {
  const spec = specOf([track("v0", [videoClip("a", { src: "blob:xxx" })])]);
  const res = parseProjectText(envelopeJson(spec));
  assert(res.ok, "load phải ok");
  const rep = buildLoadReport(res, "file", "Test");
  eq(rep.structuredNotes.length, res.structuredNotes.length, "report mất note");
  eq(rep.otherWarnings, [], `otherWarnings phải rỗng khi mọi chuỗi đều có dạng cấu trúc: ${JSON.stringify(rep.otherWarnings)}`);
  // Chuỗi lẻ không phải fallback vẫn giữ (mẫu test cũ của loadReport).
  const rep2 = buildLoadReport(
    { warnings: ["lưu ý lẻ", res.structuredNotes[0].fallback], structuredNotes: res.structuredNotes },
    "file", "Test",
  );
  eq(rep2.otherWarnings, ["lưu ý lẻ"], "chuỗi lẻ phải giữ, fallback phải trừ");
});

// ---- formatStructuredNote / formatNoteLines ----

test("formatStructuredNote: vi khớp từng chữ fallback cho cả 7 code", () => {
  const cases: { code: string; params: Record<string, string>; fallback: string }[] = [
    { code: "blobUrl", params: { clipId: "a", trackId: "v0" }, fallback: 'Clip "a" trên track "v0" đang trỏ tới blob: URL — media này sẽ mất khi tải lại trang (xem P2.2 asset store).' },
    { code: "motionMigrated", params: { path: "tracks[0].clips[0]", clipId: "c0", notes: "weights đã chuẩn hoá" }, fallback: 'tracks[0].clips[0] (clip "c0"): motion cũ đã chuẩn hoá — weights đã chuẩn hoá' },
    { code: "motionMigratedHint", params: {}, fallback: "Motion cũ đã được chuẩn hoá khi mở — lưu lại file để hoàn tất nâng cấp." },
    { code: "legacyEnvelope", params: {}, fallback: "File không có envelope .vcut (định dạng cũ) — vẫn thử đọc như video-spec trần." },
    { code: "formatVersionMismatch", params: { version: "2" }, fallback: "formatVersion=2 khác 1 — có thể bỏ sót field mới." },
    { code: "schemaMigrated", params: { from: "0.1.0", to: "0.2.0" }, fallback: "File dùng schema version 0.1.0 — đã tự động nâng cấp lên 0.2.0 (không mất dữ liệu). Lưu lại file để hoàn tất nâng cấp." },
    { code: "textStyleFixed", params: { count: "2", shown: "tracks[0].clips[0] (clip \"t1\")", extra: "" }, fallback: 'Đã điền style mặc định cho 2 text clip thiếu style (tracks[0].clips[0] (clip "t1")) — lưu lại file để hoàn tất.' },
  ];
  for (const c of cases) {
    eq(formatStructuredNote(c, tVi), c.fallback, `vi code ${c.code} phải khớp fallback`);
  }
});

test("formatStructuredNote: en không rò key thô, không rò tiếng Việt (trừ notes thô của motion)", () => {
  const blob = { code: "blobUrl", params: { clipId: "a", trackId: "v0" }, fallback: "x" };
  const enBlob = formatStructuredNote(blob, tEn);
  assert(!enBlob.includes("structuredNotes."), `en rò key: ${enBlob}`);
  assert(!VI_DIACRITICS.test(enBlob), `en blob rò tiếng Việt: ${enBlob}`);
  assert(enBlob.includes('Clip "a" on track "v0"'), `en blob sai: ${enBlob}`);
  // motionMigrated: khung câu dịch, notes thô giữ nguyên (ghi rõ trong LIMITS).
  const mig = { code: "motionMigrated", params: { path: "tracks[0].clips[0]", clipId: "c0", notes: "weights normalized" }, fallback: "x" };
  const enMig = formatStructuredNote(mig, tEn);
  assert(enMig.includes("legacy motion normalized"), `en motion sai khung: ${enMig}`);
  assert(enMig.includes("weights normalized"), `en motion phải giữ nguyên notes: ${enMig}`);
  // Key lạ → fallback, không hiện key thô.
  const unknown = { code: "noSuchCode", params: {}, fallback: "chuỗi gốc" };
  eq(formatStructuredNote(unknown, tEn), "chuỗi gốc", "key lạ phải fallback, không hiện key");
});

test("formatNoteLines: dịch note + giữ chuỗi lẻ, không trùng lặp", () => {
  const notes = [{ code: "blobUrl", params: { clipId: "a", trackId: "v0" }, fallback: 'Clip "a" trên track "v0" đang trỏ tới blob: URL — media này sẽ mất khi tải lại trang (xem P2.2 asset store).' }];
  const raw = [notes[0].fallback, "thiếu file gốc của 1 media"];
  const lines = formatNoteLines(notes, raw, tEn);
  eq(lines.length, 2, `phải có đúng 2 dòng (1 dịch + 1 lẻ): ${JSON.stringify(lines)}`);
  assert(lines[0].includes('Clip "a" on track "v0"'), `dòng đầu phải là bản en: ${lines[0]}`);
  eq(lines[1], "thiếu file gốc của 1 media", "dòng lẻ phải giữ nguyên");
  eq(formatNoteLines([], ["chuỗi cũ"], tEn), ["chuỗi cũ"], "không có note thì giữ nguyên chuỗi");
});

// ---- i18n parity ----

test("i18n: vi == en toàn bộ dict (0 key mồ côi cả hai chiều)", () => {
  eq(viDict.size, 2326, `vi phải có 2326 key, nhận ${viDict.size}`);
  eq(enDict.size, 2326, `en phải có 2326 key, nhận ${enDict.size}`);
  const onlyVi = [...viDict.keys()].filter((k) => !enDict.has(k));
  const onlyEn = [...enDict.keys()].filter((k) => !viDict.has(k));
  eq(onlyVi, [], `key chỉ có ở vi: ${JSON.stringify(onlyVi)}`);
  eq(onlyEn, [], `key chỉ có ở en: ${JSON.stringify(onlyEn)}`);
});

test("i18n: 14 key mới đợt 31 có mặt cả hai bên, en không rò key/vi", () => {
  const keys = [
    "structuredNotes.blobUrl", "structuredNotes.motionMigrated", "structuredNotes.motionMigratedHint",
    "structuredNotes.legacyEnvelope", "structuredNotes.formatVersionMismatch",
    "structuredNotes.schemaMigrated", "structuredNotes.textStyleFixed",
    "projectMenu.openFileError", "projectMenu.importArchiveError", "projectMenu.exportArchiveError",
    "projectMenu.exportArchiveDone", "projectMenu.exportArchiveNotes",
    "projectMenu.saveNotes", "projectMenu.saveDone",
  ];
  for (const k of keys) {
    assert(viDict.has(k), `vi thiếu key ${k}`);
    assert(enDict.has(k), `en thiếu key ${k}`);
    assert(!enDict.get(k)!.includes(k), `en key ${k} rò chính nó`);
  }
});

// ---- tổng kết ----

console.log(`\nsaveToast31: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
