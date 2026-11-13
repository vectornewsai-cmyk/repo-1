/**
 * structuredNotes32.test.ts — Test khóa đợt 32 luồng O4: StructuredNote
 * nốt cho archive + nested blob + errorDetail (phần errorDetail bridge
 * vẫn tiếng Việt, xem LIMITS đợt 32 — ngoài phạm vi đợt này).
 *
 * Chỉ test các hàm thuần (Node type-stripping, từ gốc repo):
 *   node apps/web/src/lib/structuredNotes32.test.ts
 *
 * Phạm vi test:
 * - archiveMissingNote: export/import, fallback byte-identical với chuỗi
 *   thiếu media cũ của archive.ts (kể cả cắt 5 tên + "… (+k)"); dịch
 *   vi khớp fallback từng chữ, en dịch đầy đủ không rò tiếng Việt.
 *   (archive.ts nối note này vào Export/ImportArchiveResult — wiring đó
 *   không import được bằng Node type-stripping do archive.ts import
 *   "./projectRepo" không đuôi, nên khóa bằng tsc + vite build +
 *   click-test O4 trên browser thật, xem LIMITS đợt 32.)
 * - findBlobWarningItems đệ quy: blob trong nested 1 cấp + 2 cấp được
 *   quét (đảo ngược khóa giới hạn đợt 31 — test đó đã cập nhật theo);
 *   subSpec dùng chung ở hai clip anh em quét đủ cả hai; subSpec tự
 *   trỏ lại (vòng lặp) không treo; clip cấp cao giữ nguyên params.
 * - motionMigrated có cases: 4 trường hợp migrate (rỗng, lệch frames,
 *   weights <= 0, cả hai) đều dịch en đầy đủ, không rò tiếng Việt
 *   (dấu), vi khớp fallback từng chữ; note cũ không có cases vẫn giữ
 *   hành vi đợt 31 (khung dịch, notes thô).
 * - i18n parity: dict vi/en flatten KHỚP TOÀN BỘ key (2283 key mỗi bên sau parent gộp đợt 64 (2275 sau đợt 63, +7 key fragment R2 6 + R8 1 + 1 key parent projectHistory); (2146 sau đợt 62, +131 key fragment − 1 key chết speed.warnTooShort − 1 key jobNote chưa có UI; 2044 sau đợt 61, +72 key; 1972 sau parent gộp đợt 60; 1969 sau đợt 60 Q4; 1957 sau gộp đợt 59,
 *   — 1011 đợt 55 L1 + 711 key đợt 56 (683 fragment + 28 đề xuất M6))
 *   — +215 key đợt 57 (11 N4 + 180 label N5 + 1 N7 + 23 N8; 5 key EN N5 ghi đè)
 *   tăng 13 so với 918 đợt 32 — 13 key errorDetail.summary đợt 34 Q4),
 *   0 key mồ côi cả hai chiều.
 *
 * Không test render React (ProjectMenu/App/panel — như mọi đợt trước):
 * wiring khóa bằng tsc 0 lỗi + vite build pass + click-test O4.
 */
import { readFileSync } from "node:fs";
import {
  archiveMissingNote,
  findBlobWarningItems,
  parseProjectText,
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

// ---- spec tối thiểu (theo mẫu saveToast31.test.ts) ----

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
    savedAt: "2026-11-01T00:00:00.000Z",
    name: "Test",
    spec,
  });
}

// ---- i18n: đọc dict thật (theo mẫu saveToast31.test.ts) ----

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

// ---- archiveMissingNote ----

test("archive: export note fallback byte-identical với chuỗi cũ, params đủ", () => {
  const note = archiveMissingNote("export", ["a.mp4", "b.mp4"]);
  eq(note.code, "archiveMissingExport", "code sai");
  eq(note.params, { count: "2", shown: "a.mp4, b.mp4", extra: "" }, "params sai");
  eq(
    note.fallback,
    "Thiếu file gốc của 2 media (sẽ cần relink khi import): a.mp4, b.mp4",
    "fallback export phải byte-identical với chuỗi archive.ts cũ",
  );
  eq(formatStructuredNote(note, tVi), note.fallback, "vi export phải khớp fallback");
  const en = formatStructuredNote(note, tEn);
  assert(en.includes("Missing source files for 2 media"), `en export sai: ${en}`);
  assert(!VI_DIACRITICS.test(en), `en export rò tiếng Việt: ${en}`);
});

test("archive: import note + cắt 5 tên + extra (+k), en dịch đủ", () => {
  const missing = ["m1.mp4", "m2.mp4", "m3.mp4", "m4.mp4", "m5.mp4", "m6.mp4", "m7.mp4"];
  const note = archiveMissingNote("import", missing);
  eq(note.code, "archiveMissingImport", "code sai");
  eq(note.params.count, "7", "count sai");
  eq(note.params.shown, "m1.mp4, m2.mp4, m3.mp4, m4.mp4, m5.mp4", "shown phải cắt 5 tên đầu");
  eq(note.params.extra, "… (+2)", "extra sai");
  eq(
    note.fallback,
    "Archive thiếu 7 media có trong project (cần relink thủ công): m1.mp4, m2.mp4, m3.mp4, m4.mp4, m5.mp4… (+2)",
    "fallback import phải byte-identical với chuỗi archive.ts cũ",
  );
  eq(formatStructuredNote(note, tVi), note.fallback, "vi import phải khớp fallback");
  const en = formatStructuredNote(note, tEn);
  assert(en.includes("Archive is missing 7 media"), `en import sai: ${en}`);
  assert(en.includes("… (+2)"), `en import mất extra: ${en}`);
  assert(!VI_DIACRITICS.test(en), `en import rò tiếng Việt: ${en}`);
});

test("archive: formatNoteLines trừ fallback archive, không trùng lặp", () => {
  const note = archiveMissingNote("export", ["a.mp4"]);
  const lines = formatNoteLines([note], [note.fallback, "chuỗi lẻ"], tEn);
  eq(lines.length, 2, `phải có đúng 2 dòng: ${JSON.stringify(lines)}`);
  assert(lines[0].includes("Missing source files for 1 media"), `dòng đầu phải là bản en: ${lines[0]}`);
  eq(lines[1], "chuỗi lẻ", "dòng lẻ phải giữ");
  // buildLoadReport cũng trừ fallback archive khỏi otherWarnings.
  const rep = buildLoadReport({ warnings: [note.fallback], structuredNotes: [note] }, "archive", "Test");
  eq(rep.otherWarnings, [], "otherWarnings phải trừ fallback archive");
  eq(rep.structuredNotes.length, 1, "report phải giữ note archive");
});

// ---- nested blob ----

test("blob đệ quy: nested 1 cấp + 2 cấp đều quét, trackId là track trực tiếp", () => {
  const inner2 = specOf([track("deep", [videoClip("deepBlob", { src: "blob:deep" })])]);
  const nested2 = {
    kind: "nested", id: "n1", start: 0, duration: 10,
    subSpec: specOf([track("mid", [{
      kind: "nested", id: "n2", start: 0, duration: 10, subSpec: inner2,
    }])]),
  };
  const spec = specOf([
    track("v0", [
      videoClip("top", { src: "blob:top" }),
      nested2,
    ]),
    track("v1", [videoClip("plain")]),
  ]) as never;
  const items = findBlobWarningItems(spec);
  eq(items.length, 2, `phải có đúng 2 item (top + deep): ${JSON.stringify(items.map((i) => i.params))}`);
  eq(items[0].params, { clipId: "top", trackId: "v0" }, "item cấp cao phải giữ nguyên params đợt 31");
  eq(items[1].params.clipId, "deepBlob", "clipId nested sai");
  eq(items[1].params.trackId, "deep", "trackId nested phải là track trực tiếp chứa clip");
  assert(typeof items[1].params.path === "string" && items[1].params.path.includes(".subSpec."), `item nested phải mang path qua subSpec: ${JSON.stringify(items[1].params)}`);
  eq(items[1].params.path, "tracks[0].clips[1].subSpec.tracks[0].clips[0].subSpec.tracks[0].clips[0]", "path nested sai");
});

test("blob đệ quy: subSpec dùng chung ở 2 clip anh em quét đủ cả hai, vòng lặp không treo", () => {
  const shared = specOf([track("in", [videoClip("s", { src: "blob:shared" })])]);
  const spec = specOf([
    track("v0", [
      { kind: "nested", id: "nA", start: 0, duration: 10, subSpec: shared },
      { kind: "nested", id: "nB", start: 0, duration: 10, subSpec: shared },
    ]),
  ]) as never;
  const items = findBlobWarningItems(spec);
  eq(items.length, 2, `subSpec chung phải quét đủ 2 lần (mỗi clip ngoài một lần): ${items.length}`);
  // Vòng lặp: subSpec tự trỏ lại chính nó (object cycle) — walk phải dừng nhờ seen theo nhánh.
  const cyclic = specOf([track("v0", [])]) as Record<string, unknown>;
  const loopClip: Record<string, unknown> = { kind: "nested", id: "loop", start: 0, duration: 10, subSpec: cyclic };
  (cyclic["tracks"] as Record<string, unknown>[])[0]["clips"] = [loopClip];
  const cycItems = findBlobWarningItems(cyclic as never);
  eq(cycItems, [], "spec vòng lặp không có blob phải trả rỗng, không treo");
});

// ---- motion cases ----

function motionSpec(motion: Record<string, unknown>): Record<string, unknown> {
  return specOf([
    track("v0", [{
      kind: "video", id: "c0", src: "a.mp4", start: 0, duration: 2, in: 0, out: 2, motion,
    }]),
  ]);
}

function motionNoteFor(motion: Record<string, unknown>) {
  const res = parseProjectText(envelopeJson(motionSpec(motion)));
  assert(res.ok, `load phải ok: ${res.errors.join("; ")}`);
  const note = res.structuredNotes.find((n) => n.code === "motionMigrated");
  assert(note, `thiếu note motionMigrated: ${JSON.stringify(res.structuredNotes)}`);
  return { res, note };
}

test("motion cases: blur rỗng → en dịch đủ, vi khớp fallback", () => {
  const { res, note } = motionNoteFor({ motionBlur: {} });
  const cases = JSON.parse(note.params.cases as string) as { code: string }[];
  eq(cases.map((c) => c.code), ["motionNoteEmpty"], "blur rỗng phải suy đúng 1 case empty");
  eq(formatStructuredNote(note, tVi), note.fallback, "vi phải khớp fallback");
  const en = formatStructuredNote(note, tEn);
  assert(en.includes("legacy motion normalized"), `en mất khung: ${en}`);
  assert(en.includes("motion.motionBlur is empty"), `en mất case empty: ${en}`);
  assert(!VI_DIACRITICS.test(en), `en rò tiếng Việt: ${en}`);
  assert(res.warnings.includes(note.fallback), "fallback phải có trong warnings chuỗi");
});

test("motion cases: lệch frames → case frames, weights giữ nguyên", () => {
  const { note } = motionNoteFor({ motionBlur: { weights: [1, 2, 3, 4] } });
  const cases = JSON.parse(note.params.cases as string) as { code: string; vars: Record<string, string> }[];
  eq(cases.map((c) => c.code), ["motionNoteFrames"], "thiếu frames phải suy đúng case frames");
  eq(cases[0].vars, { frames: "undefined", weightsLength: "4", newFrames: "4" }, "vars frames sai");
  const en = formatStructuredNote(note, tEn);
  assert(en.includes("mismatches/misses weights.length (4)"), `en frames sai: ${en}`);
  assert(en.includes("frames = 4 (weights kept)"), `en frames thiếu newFrames: ${en}`);
  assert(!VI_DIACRITICS.test(en), `en rò tiếng Việt: ${en}`);
  eq(formatStructuredNote(note, tVi), note.fallback, "vi phải khớp fallback");
});

test("motion cases: weights <= 0 → case weights, frames khớp sẵn không thêm case", () => {
  const { note } = motionNoteFor({ motionBlur: { frames: 3, weights: [0, 0, 0] } });
  const cases = JSON.parse(note.params.cases as string) as { code: string }[];
  eq(cases.map((c) => c.code), ["motionNoteWeights"], "weights 0 phải suy đúng case weights");
  const en = formatStructuredNote(note, tEn);
  assert(en.includes("contains a number <= 0 ([0,0,0])"), `en weights sai: ${en}`);
  assert(en.includes("uniform weights (3 frames"), `en weights thiếu frames: ${en}`);
  assert(!VI_DIACRITICS.test(en), `en rò tiếng Việt: ${en}`);
});

test("motion cases: lệch frames + weights <= 0 → đúng thứ tự 2 case, nối bằng '; '", () => {
  const { note } = motionNoteFor({ motionBlur: { frames: 4, weights: [1, 0, 1] } });
  const cases = JSON.parse(note.params.cases as string) as { code: string }[];
  eq(cases.map((c) => c.code), ["motionNoteFrames", "motionNoteWeights"], "phải có đúng 2 case theo thứ tự frames rồi weights");
  const en = formatStructuredNote(note, tEn);
  assert(en.includes("mismatches/misses weights.length (3)"), `en thiếu case frames: ${en}`);
  assert(en.includes("; "), "2 case phải nối bằng '; ' như fallback cũ");
  assert(en.includes("contains a number <= 0 ([1,0,1])"), `en thiếu case weights: ${en}`);
  assert(!VI_DIACRITICS.test(en), `en rò tiếng Việt: ${en}`);
  eq(formatStructuredNote(note, tVi), note.fallback, "vi phải khớp fallback (nối '; ')");
});

test("motion cases: note cũ không có cases vẫn giữ hành vi đợt 31", () => {
  const legacy = {
    code: "motionMigrated",
    params: { path: "tracks[0].clips[0]", clipId: "c0", notes: "weights đã chuẩn hoá" },
    fallback: 'tracks[0].clips[0] (clip "c0"): motion cũ đã chuẩn hoá — weights đã chuẩn hoá',
  };
  eq(formatStructuredNote(legacy, tVi), legacy.fallback, "vi legacy phải khớp fallback");
  const en = formatStructuredNote(legacy, tEn);
  assert(en.includes("legacy motion normalized"), `en legacy mất khung: ${en}`);
  assert(en.includes("weights đã chuẩn hoá"), "en legacy phải giữ notes thô (hành vi đợt 31)");
});

// ---- i18n parity ----

test("i18n: vi == en toàn bộ dict (0 key mồ côi cả hai chiều)", () => {
  eq(viDict.size, 2767, `vi phải có 2767 key, nhận ${viDict.size}`);
  eq(enDict.size, 2767, `en phải có 2767 key, nhận ${enDict.size}`);
  const onlyVi = [...viDict.keys()].filter((k) => !enDict.has(k));
  const onlyEn = [...enDict.keys()].filter((k) => !viDict.has(k));
  eq(onlyVi, [], `key chỉ có ở vi: ${JSON.stringify(onlyVi)}`);
  eq(onlyEn, [], `key chỉ có ở en: ${JSON.stringify(onlyEn)}`);
});

test("i18n: 5 key mới đợt 32 có mặt cả hai bên, en không rò key/vi", () => {
  const keys = [
    "structuredNotes.archiveMissingExport", "structuredNotes.archiveMissingImport",
    "structuredNotes.motionNoteEmpty", "structuredNotes.motionNoteFrames",
    "structuredNotes.motionNoteWeights",
  ];
  for (const k of keys) {
    assert(viDict.has(k), `vi thiếu key ${k}`);
    assert(enDict.has(k), `en thiếu key ${k}`);
    assert(!enDict.get(k)!.includes(k), `en key ${k} rò chính nó`);
    assert(!VI_DIACRITICS.test(enDict.get(k)!), `en key ${k} rò tiếng Việt: ${enDict.get(k)}`);
  }
});

// ---- tổng kết ----

console.log(`\nstructuredNotes32: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
