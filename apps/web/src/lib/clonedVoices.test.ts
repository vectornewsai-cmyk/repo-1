/**
 * clonedVoices.test.ts — Test cho đợt 84 luồng L8 (giọng đã clone LƯU LẠI ĐƯỢC).
 *
 * Khóa:
 * 1. Helper thuần: mã hóa/giải mã giá trị select preset/clone, format
 *    thời lượng mẫu, nhóm option cho <select> (preset trước, clone sau).
 * 2. i18n: 18 key tts.* mới + 6 key bridgeErrors.TTS_CLONED_VOICE_* có
 *    trong cả vi.json lẫn en.json, vi≠en, placeholder khớp, giá trị khớp
 *    fragment round84-l8.json đúng từng chữ.
 * 3. Nối UI thật: TtsButton.tsx import + gọi đúng helper/API của lib
 *    (fetchClonedVoices / createClonedVoice / deleteClonedVoice), select
 *    giọng dùng optgroup, có panel tạo giọng + nút hủy + <audio> preview.
 * 4. Tập mã web BRIDGE_ERROR_CODES chứa đủ 6 mã mới.
 *
 * Đợt 85 M7 (export/backup + import giọng clone):
 * 5. Helper thuần: tên file backup (slug bỏ dấu, khớp server), URL export,
 *    parse summary import (validate shape, lỗi rõ khi thiếu trường).
 * 6. i18n: 11 key tts.* mới có đủ vi/en, vi≠en, placeholder khớp, giá trị
 *    khớp fragment round85-m7.json đúng từng chữ. KHÔNG thêm mã lỗi mới
 *    (tái dùng mã L8) nên BRIDGE_ERROR_CODES không đổi.
 * 7. Nối UI thật: TtsButton.tsx import + gọi fetchClonedVoiceBackup /
 *    fetchAllClonedVoicesBackup / importClonedVoices, có nút Xuất từng
 *    giọng + Xuất tất cả + Nhập giọng (input .json ẩn), tải file qua
 *    blob + thẻ <a>.
 *
 * Chạy bằng esbuild bundle (quy ước đợt 45/46), từ gốc repo:
 *   ./node_modules/.bin/esbuild apps/web/src/lib/clonedVoices.test.ts \
 *     --bundle --format=esm --platform=node --outfile=<scratch>/l8.test.mjs
 *   REPO_ROOT=$PWD node <scratch>/l8.test.mjs
 * (không dùng /tmp: tmpfs 512MB của VM đã đầy trong đợt 84.)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildVoiceBackupFilename,
  buildVoiceSelectGroups,
  clonedSelectValue,
  clonedVoiceById,
  exportAllClonedVoicesUrl,
  exportClonedVoiceUrl,
  formatClonedVoiceOption,
  formatSampleDuration,
  parseImportSummary,
  parseVoiceSelectValue,
  presetSelectValue,
  type ClonedVoice,
  type PresetVoice,
} from "./clonedVoices";
import { BRIDGE_ERROR_CODES } from "./bridgeErrors";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5). */
declare const process: { exitCode: number | undefined };

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

const PRESETS: PresetVoice[] = [
  { name: "Hải Đăng", gender: "nam", desc: "Nam · Bắc · Phong cách tự nhiên" },
  { name: "Trúc Ly", gender: "nữ", desc: "Nữ · Bắc · Phong cách tự nhiên" },
];
const CLONED: ClonedVoice[] = [
  { id: "0123456789abcdef", name: "Giọng Tôi", refExt: ".wav", refDurationSec: 12.5, createdAt: "2026-11-11T00:00:00.000Z" },
  { id: "fedcba9876543210", name: "Giọng Bà", refExt: ".mp3", refDurationSec: null, createdAt: "2026-11-11T01:00:00.000Z" },
];

console.log("== [1] mã hóa/giải mã giá trị select ==");
ok("preset/clone encode đúng tiền tố", () => {
  assert.equal(presetSelectValue("Hải Đăng"), "preset:Hải Đăng");
  assert.equal(clonedSelectValue("0123456789abcdef"), "clone:0123456789abcdef");
});
ok("parse clone id hợp lệ (16 hex)", () => {
  assert.deepEqual(parseVoiceSelectValue("clone:0123456789abcdef", "Hải Đăng"),
    { kind: "cloned", id: "0123456789abcdef" });
});
ok("parse preset", () => {
  assert.deepEqual(parseVoiceSelectValue("preset:Trúc Ly", "Hải Đăng"),
    { kind: "preset", name: "Trúc Ly" });
});
ok("giá trị lạ → preset mặc định, không crash", () => {
  assert.deepEqual(parseVoiceSelectValue("clone:abc", "Hải Đăng"),
    { kind: "preset", name: "Hải Đăng" });
  assert.deepEqual(parseVoiceSelectValue("clone:../etc", "Hải Đăng"),
    { kind: "preset", name: "Hải Đăng" });
  assert.deepEqual(parseVoiceSelectValue("", "Hải Đăng"),
    { kind: "preset", name: "Hải Đăng" });
  // Tương thích ngược: tên preset trần (UI cũ).
  assert.deepEqual(parseVoiceSelectValue("Trúc Ly", "Hải Đăng"),
    { kind: "preset", name: "Trúc Ly" });
});

console.log("== [2] format nhãn + thời lượng ==");
ok("formatSampleDuration: giây / phút:giây / rỗng", () => {
  assert.equal(formatSampleDuration(12.5), "13s");
  assert.equal(formatSampleDuration(65), "1:05");
  assert.equal(formatSampleDuration(0), "");
  assert.equal(formatSampleDuration(null), "");
  assert.equal(formatSampleDuration(undefined), "");
  assert.equal(formatSampleDuration(NaN), "");
});
ok("nhãn option giọng clone có tên + thời lượng", () => {
  assert.equal(formatClonedVoiceOption(CLONED[0], "clone"), "Giọng Tôi (clone · 13s)");
  assert.equal(formatClonedVoiceOption(CLONED[1], "clone"), "Giọng Bà (clone)");
});
ok("clonedVoiceById tìm đúng / trả undefined khi lạ", () => {
  assert.equal(clonedVoiceById(CLONED, "0123456789abcdef")?.name, "Giọng Tôi");
  assert.equal(clonedVoiceById(CLONED, "0000000000000000"), undefined);
});

console.log("== [3] nhóm option cho select ==");
ok("preset trước, clone sau; nhóm rỗng thì không hiện", () => {
  const groups = buildVoiceSelectGroups(PRESETS, CLONED,
    { presetGroup: "Giọng có sẵn", clonedGroup: "Giọng đã clone", cloneWord: "clone" });
  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, "Giọng có sẵn");
  assert.equal(groups[0].options[0].value, "preset:Hải Đăng");
  assert.equal(groups[0].options[0].label, "Hải Đăng (nam) — Nam · Bắc · Phong cách tự nhiên");
  assert.equal(groups[1].label, "Giọng đã clone");
  assert.equal(groups[1].options[0].value, "clone:0123456789abcdef");
  assert.equal(groups[1].options[0].label, "Giọng Tôi (clone · 13s)");
  assert.equal(buildVoiceSelectGroups(PRESETS, [], { presetGroup: "P", clonedGroup: "C", cloneWord: "clone" }).length, 1);
  assert.equal(buildVoiceSelectGroups([], CLONED, { presetGroup: "P", clonedGroup: "C", cloneWord: "clone" }).length, 1);
  assert.equal(buildVoiceSelectGroups([], [], { presetGroup: "P", clonedGroup: "C", cloneWord: "clone" }).length, 0);
});

console.log("== [4] i18n: key mới có đủ vi/en, khớp fragment ==");
function flatten(d: Record<string, unknown>, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(d)) {
    if (typeof v === "string") out.set(prefix + k, v);
    else if (v && typeof v === "object") {
      for (const [kk, vv] of flatten(v as Record<string, unknown>, prefix + k + ".")) out.set(kk, vv);
    }
  }
  return out;
}
function placeholders(s: string): string[] {
  return [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
}
const TTS_KEYS = [
  "clonedVoicesTitle", "clonedVoicesEmpty", "clonedGroupLabel", "presetGroupLabel",
  "createVoiceTitle", "voiceNameLabel", "voiceNamePlaceholder", "createVoiceBtn",
  "creatingVoiceBtn", "voiceCreated", "voiceCreateFailed", "voiceDeleted",
  "deleteVoice", "deleteVoiceConfirm", "previewLabel", "cloneCreateHint",
  "loadVoicesFailed", "clonedVoiceMissing",
];
const ERR_KEYS = [
  "TTS_CLONED_VOICE_LIMIT", "TTS_CLONED_VOICE_NAME_DUP", "TTS_CLONED_VOICE_NAME_EMPTY",
  "TTS_CLONED_VOICE_NAME_TOO_LONG", "TTS_CLONED_VOICE_NOT_FOUND", "TTS_CLONED_VOICE_REGISTRY",
];
ok("18 key tts.* + 6 key bridgeErrors.* có đủ vi/en, vi≠en, placeholder khớp", () => {
  const vi = flatten(JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as Record<string, unknown>);
  const en = flatten(JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as Record<string, unknown>);
  for (const k of TTS_KEYS) {
    const key = `tts.${k}`;
    assert.ok(vi.has(key), `vi thiếu ${key}`);
    assert.ok(en.has(key), `en thiếu ${key}`);
    assert.notEqual(vi.get(key), en.get(key), `${key}: vi phải khác en`);
    assert.deepEqual(placeholders(vi.get(key)!), placeholders(en.get(key)!), `${key}: placeholder vi/en lệch`);
  }
  for (const k of ERR_KEYS) {
    const key = `bridgeErrors.${k}`;
    assert.ok(vi.has(key), `vi thiếu ${key}`);
    assert.ok(en.has(key), `en thiếu ${key}`);
    assert.notEqual(vi.get(key), en.get(key), `${key}: vi phải khác en`);
    assert.deepEqual(placeholders(vi.get(key)!), placeholders(en.get(key)!), `${key}: placeholder vi/en lệch`);
  }
});
ok("giá trị dict khớp fragment round84-l8.json đúng từng chữ", () => {
  const vi = flatten(JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as Record<string, unknown>);
  const en = flatten(JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as Record<string, unknown>);
  const frag = JSON.parse(readFileSync("apps/web/src/i18n/fragments/round84-l8.json", "utf8")) as {
    vi: Record<string, unknown>; en: Record<string, unknown>;
  };
  for (const [lang, dict] of [["vi", vi], ["en", en]] as const) {
    for (const [k, v] of flatten(frag[lang])) {
      assert.equal(dict.get(k), v, `${lang} ${k}: dict lệch fragment`);
    }
  }
});
ok("tập mã web BRIDGE_ERROR_CODES chứa đủ 6 mã mới", () => {
  for (const code of ERR_KEYS) {
    assert.ok(BRIDGE_ERROR_CODES.has(code), `web thiếu mã ${code}`);
  }
});

console.log("== [5] nối UI thật: TtsButton.tsx ==");
ok("component import + gọi đúng API/lib của luồng L8", () => {
  const src = readFileSync("apps/web/src/components/TtsButton.tsx", "utf8");
  for (const s of [
    'from "../lib/clonedVoices"',
    "fetchClonedVoices",
    "createClonedVoice",
    "deleteClonedVoice",
    "buildVoiceSelectGroups",
    "parseVoiceSelectValue",
    "clonedSelectValue",
    "presetSelectValue",
    "clonedVoiceId",
    "clonedVoiceById",
  ]) {
    assert.ok(src.includes(s), `TtsButton.tsx thiếu: ${s}`);
  }
  assert.ok(src.includes("clonedVoiceId"), "speak() phải có nhánh giọng đã lưu");
  assert.ok(src.includes("/api/tts") && src.includes("clonedVoiceId"),
    "speak() phải POST /api/tts với clonedVoiceId");
});
ok("select dùng optgroup + panel tạo giọng có hủy thật + audio preview", () => {
  const src = readFileSync("apps/web/src/components/TtsButton.tsx", "utf8");
  assert.ok(src.includes("<optgroup"), "select giọng phải dùng <optgroup>");
  assert.ok(src.includes("tts.clonedGroupLabel"), "phải có nhóm giọng đã clone");
  assert.ok(src.includes("tts.presetGroupLabel"), "phải có nhóm giọng preset");
  assert.ok(src.includes("tts.createVoiceTitle"), "phải có panel tạo giọng");
  assert.ok(src.includes("createAbortRef.current?.abort()"), "tạo giọng phải hủy thật qua AbortController");
  assert.ok(src.includes("<audio controls"), "phải có <audio> nghe thử bản đọc mẫu");
  assert.ok(src.includes("URL.createObjectURL"), "preview phải tải blob 1 lần qua object URL");
  assert.ok(src.includes("tts.deleteVoiceConfirm"), "xóa giọng phải xác nhận 2 bước");
  assert.ok(src.includes("TTS_CLONED_VOICE_NOT_FOUND"), "speak() xử lý giọng đã lưu bị mất ở bridge");
});
ok("CSS cho section giọng clone đã định nghĩa", () => {
  const css = readFileSync("apps/web/src/components/TtsButton.css", "utf8");
  for (const cls of [".tts-cloned", ".tts-cloned-list", ".tts-clone-create"]) {
    assert.ok(css.includes(cls), `TtsButton.css thiếu ${cls}`);
  }
});

console.log("== [6] M7: helper thuần export/import ==");
ok("buildVoiceBackupFilename: slug bỏ dấu + id (khớp server)", () => {
  assert.equal(buildVoiceBackupFilename("Giọng Thật 2277", "abcdef0123456789"),
    "vcut-voice-giong-that-2277-abcdef0123456789.json");
  assert.equal(buildVoiceBackupFilename("///", "abcdef0123456789"),
    "vcut-voice-voice-abcdef0123456789.json");
  assert.ok(!buildVoiceBackupFilename("A/B", "abcdef0123456789").includes("/"));
});
ok("URL export 1 giọng / tất cả", () => {
  assert.equal(exportClonedVoiceUrl("http://127.0.0.1:8787", "0123456789abcdef"),
    "http://127.0.0.1:8787/api/tts/cloned-voices/0123456789abcdef/export");
  assert.equal(exportAllClonedVoicesUrl("http://127.0.0.1:8787"),
    "http://127.0.0.1:8787/api/tts/cloned-voices/export");
});
ok("parseImportSummary: summary hợp lệ → đủ 3 nhóm", () => {
  const s = parseImportSummary({
    imported: [{ id: "0123456789abcdef", name: "Giọng M7", refExt: ".wav", refDurationSec: 19.3, createdAt: "2026-11-11T00:00:00.000Z" }],
    skipped: [{ name: "Giọng Cũ", reason: "dup" }],
    failed: [],
  });
  assert.equal(s.imported.length, 1);
  assert.equal(s.imported[0].name, "Giọng M7");
  assert.equal(s.skipped[0].reason, "dup");
  assert.equal(s.failed.length, 0);
});
ok("parseImportSummary: thiếu trường → throw rõ", () => {
  assert.throws(() => parseImportSummary({}), /thiếu imported/);
  assert.throws(() => parseImportSummary({ imported: [{ name: "X" }] }), /id\/tên/);
  assert.throws(() => parseImportSummary({ imported: [], skipped: [{ reason: "dup" }] }), /skipped\/failed/);
  assert.throws(() => parseImportSummary(null), /sai định dạng/);
});

console.log("== [7] M7: i18n 11 key export/import ==");
const M7_KEYS = [
  "exportVoice", "exportAllVoices", "importVoices", "importingVoicesBtn",
  "voiceExported", "voiceExportFailed", "voiceImported", "voiceImportFailed",
  "importSkipped", "importFailedDetail", "allVoicesExported",
];
ok("11 key tts.* mới có đủ vi/en, vi≠en, placeholder khớp", () => {
  const vi = flatten(JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as Record<string, unknown>);
  const en = flatten(JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as Record<string, unknown>);
  for (const k of M7_KEYS) {
    const key = `tts.${k}`;
    assert.ok(vi.has(key), `vi thiếu ${key}`);
    assert.ok(en.has(key), `en thiếu ${key}`);
    assert.notEqual(vi.get(key), en.get(key), `${key}: vi phải khác en`);
    assert.deepEqual(placeholders(vi.get(key)!), placeholders(en.get(key)!), `${key}: placeholder vi/en lệch`);
  }
});
ok("giá trị dict khớp fragment round85-m7.json đúng từng chữ", () => {
  const vi = flatten(JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as Record<string, unknown>);
  const en = flatten(JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as Record<string, unknown>);
  const frag = JSON.parse(readFileSync("apps/web/src/i18n/fragments/round85-m7.json", "utf8")) as {
    vi: Record<string, unknown>; en: Record<string, unknown>;
  };
  for (const [lang, dict] of [["vi", vi], ["en", en]] as const) {
    for (const [k, v] of flatten(frag[lang])) {
      assert.equal(dict.get(k), v, `${lang} ${k}: dict lệch fragment`);
    }
  }
});

console.log("== [8] M7: nối UI thật export/import ==");
ok("component import + gọi đúng API/lib export/import", () => {
  const src = readFileSync("apps/web/src/components/TtsButton.tsx", "utf8");
  for (const s of [
    "fetchClonedVoiceBackup",
    "fetchAllClonedVoicesBackup",
    "importClonedVoices",
    "tts.exportVoice",
    "tts.exportAllVoices",
    "tts.importVoices",
    "tts.voiceExported",
    "tts.voiceImported",
    "tts.importSkipped",
  ]) {
    assert.ok(src.includes(s), `TtsButton.tsx thiếu: ${s}`);
  }
  assert.ok(src.includes("importBackupFile"), "phải có handler nhập file backup");
  assert.ok(src.includes('accept=".json,application/json"'), "input nhập chỉ nhận .json");
  assert.ok(src.includes("URL.createObjectURL"), "export tải file qua blob object URL");
  assert.ok(src.includes("download"), "export gắn thẻ <a download>");
  assert.ok(src.includes("setClonedVoiceId(summary.imported[0].id)"),
    "nhập xong phải chọn ngay giọng vừa nhập");
});

console.log(`\nclonedVoices L8: ${pass} test pass`);
