// jobNote64R8.test.ts — Phase 9 đợt 64, luồng R8: hiển thị job.note trong
// UI (đóng nợ đợt 63 §2/§6.7 — key jobNote.recoveredRestart đã có trong
// fragment round63-r5 nhưng web chưa tiêu thụ job.note ở đâu).
//
// Khóa 3 chiều: mã noteCode bridge gửi (jobQueue.js: RECOVER_NOTE +
// 4 nhánh recover, noteCode JOB_RECOVERED_RESTART) == tập JOB_NOTE_CODES
// == key `jobNote.<code>` trong fragment round64-r8 (vi + en, chuỗi không
// rỗng, vi KHỚP TỪNG BYTE chuỗi RECOVER_NOTE của bridge để hiển thị vi
// không đổi so với trước). Fallback: mã lạ / thiếu key → chuỗi note thô
// bridge gửi kèm → ""; không bao giờ trả key/mã thô ra UI.
// Khóa nối UI (tĩnh, mẫu modalSheet63R1): ExportPanel import
// resolveJobNote, gọi với data.noteCode/data.note trong pollStatus, render
// dòng `.render-note` (role="note") trong khối .render-progress, chỉ khi
// renderNote khác rỗng; styles.css định nghĩa .render-note.
//
// Cách chạy (từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/jobNote64R8.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round64-r8/r8.test.cjs \
//     && node /tmp/round64-r8/r8.test.cjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  JOB_NOTE_CODES,
  NOTE_CODE_TO_FRAGMENT_KEY,
  jobNoteLabel,
  jobNoteTable,
  resolveJobNote,
  type JobNoteTable,
} from "./jobNote64R8";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5) — thêm cwd() vì
 *  test tĩnh resolve đường dẫn từ process.cwd() (mẫu modalSheet63R1). */
declare const process: { cwd: () => string; exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`R8 job note UI round 64: ${pass}/${queue.length} pass`);
}

/** Tìm file từ cwd (gốc repo hoặc apps/web), mẫu modalSheet63R1. */
function resolveFromCwd(...parts: string[]): string {
  const candidates = [
    resolve(process.cwd(), ...parts),
    resolve(process.cwd(), ...parts.slice(2)),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return candidates[0];
}

const FRAG_PATH = resolveFromCwd(
  "apps", "web", "src", "i18n", "fragments", "round64-r8.json",
);
const frag = JSON.parse(readFileSync(FRAG_PATH, "utf8")) as {
  vi: { jobNote: Record<string, string> };
  en: { jobNote: Record<string, string> };
};

const JOBQUEUE_PATH = resolveFromCwd(
  "server", "bridge", "src", "jobQueue.js",
);
const jobQueueSrc = readFileSync(JOBQUEUE_PATH, "utf8");
const recoverMatch = jobQueueSrc.match(/const RECOVER_NOTE = "([^"]+)";/);
assert.ok(recoverMatch, "jobQueue.js phải khai hằng RECOVER_NOTE");
/** Chuỗi note gốc bridge gắn khi phục hồi job sau restart. */
const BRIDGE_RECOVER_NOTE = recoverMatch[1];

const EXPORT_PANEL_PATH = resolveFromCwd(
  "apps", "web", "src", "ExportPanel.tsx",
);
const exportPanelSrc = readFileSync(EXPORT_PANEL_PATH, "utf8");

const STYLES_PATH = resolveFromCwd("apps", "web", "src", "styles.css");
const stylesSrc = readFileSync(STYLES_PATH, "utf8");

// --- 1. Fragment: key đầy đủ 2 locale, vi khớp chuỗi bridge từng byte ---
ok("fragment có jobNote.recoveredRestart vi+en, không rỗng", () => {
  assert.equal(typeof frag.vi.jobNote.recoveredRestart, "string");
  assert.equal(typeof frag.en.jobNote.recoveredRestart, "string");
  assert.ok(frag.vi.jobNote.recoveredRestart.length > 0);
  assert.ok(frag.en.jobNote.recoveredRestart.length > 0);
});

ok("chuỗi vi fragment KHỚP TỪNG BYTE RECOVER_NOTE của bridge", () => {
  assert.equal(frag.vi.jobNote.recoveredRestart, BRIDGE_RECOVER_NOTE);
});

ok("chuỗi en khác vi (đã dịch thật, không copy vi)", () => {
  assert.notEqual(frag.en.jobNote.recoveredRestart, frag.vi.jobNote.recoveredRestart);
});

// --- 2. Mã code ↔ key fragment: map 1:1 cả 2 chiều ---
ok("map noteCode→fragment key khớp 1:1 (mã bridge == key map, key fragment == giá trị map)", () => {
  assert.deepEqual([...JOB_NOTE_CODES].sort(), Object.keys(NOTE_CODE_TO_FRAGMENT_KEY).sort());
  assert.deepEqual(
    Object.values(NOTE_CODE_TO_FRAGMENT_KEY).sort(),
    Object.keys(frag.vi.jobNote).sort(),
  );
  assert.deepEqual(
    Object.values(NOTE_CODE_TO_FRAGMENT_KEY).sort(),
    Object.keys(frag.en.jobNote).sort(),
  );
});

ok("bridge chỉ dùng mã đã khai (không mã noteCode lạ trong jobQueue.js)", () => {
  // Quét theo dòng chứa noteCode: mọi literal "MÃ" trên dòng đó phải nằm
  // trong JOB_NOTE_CODES (bắt cả dạng trực tiếp lẫn `... ? "MÃ" : null`).
  const codes = new Set<string>();
  for (const line of jobQueueSrc.split("\n")) {
    if (!line.includes("noteCode")) continue;
    for (const m of line.matchAll(/"([A-Z_]+)"/g)) codes.add(m[1]);
  }
  assert.ok(codes.size > 0, "jobQueue.js phải có noteCode literal");
  for (const c of codes) assert.ok(JOB_NOTE_CODES.includes(c), `mã bridge ${c} chưa có trong JOB_NOTE_CODES`);
});

// --- 3. jobNoteLabel: localize theo mã + locale, fallback vi ---
ok("jobNoteLabel: mã quen → đúng chuỗi vi/en", () => {
  assert.equal(jobNoteLabel("JOB_RECOVERED_RESTART", "vi"), frag.vi.jobNote.recoveredRestart);
  assert.equal(jobNoteLabel("JOB_RECOVERED_RESTART", "en"), frag.en.jobNote.recoveredRestart);
});

ok("jobNoteLabel: mã lạ / rỗng / null → undefined (không trả key thô)", () => {
  assert.equal(jobNoteLabel("JOB_SOMETHING_ELSE", "vi"), undefined);
  assert.equal(jobNoteLabel("", "vi"), undefined);
  assert.equal(jobNoteLabel(null, "vi"), undefined);
  assert.equal(jobNoteLabel(undefined, "en"), undefined);
});

ok("jobNoteLabel: thiếu key en → fallback vi (quy ước i18n/index.ts)", () => {
  const table: JobNoteTable = { vi: { recoveredRestart: "VI" }, en: {} };
  assert.equal(jobNoteLabel("JOB_RECOVERED_RESTART", "en", table), "VI");
});

// --- 4. resolveJobNote: thứ tự code → note thô → "" ---
ok("resolveJobNote: mã quen thắng chuỗi note thô (locale en vẫn ra en)", () => {
  assert.equal(
    resolveJobNote("JOB_RECOVERED_RESTART", BRIDGE_RECOVER_NOTE, "en"),
    frag.en.jobNote.recoveredRestart,
  );
  assert.equal(
    resolveJobNote("JOB_RECOVERED_RESTART", "chuỗi lạ nào đó", "vi"),
    frag.vi.jobNote.recoveredRestart,
  );
});

ok("resolveJobNote: mã lạ + có note thô → giữ nguyên note thô (không mất tin)", () => {
  assert.equal(resolveJobNote("JOB_FUTURE_CODE", "ghi chú mới từ bridge", "vi"), "ghi chú mới từ bridge");
  assert.equal(resolveJobNote(null, "ghi chú cũ không mã", "en"), "ghi chú cũ không mã");
});

ok("resolveJobNote: không note → '' (UI không hiện rác)", () => {
  assert.equal(resolveJobNote(null, null, "vi"), "");
  assert.equal(resolveJobNote(undefined, undefined, "en"), "");
  assert.equal(resolveJobNote("JOB_FUTURE_CODE", "", "vi"), "");
  assert.equal(resolveJobNote("JOB_FUTURE_CODE", "   ", "vi"), "");
  assert.equal(resolveJobNote(null, "   ", "en"), "");
});

ok("resolveJobNote: note thô được trim khoảng trắng thừa", () => {
  assert.equal(resolveJobNote(null, "  có note  ", "vi"), "có note");
});

ok("resolveJobNote: không bao giờ trả mã/key thô ra UI", () => {
  for (const lang of ["vi", "en"] as const) {
    for (const out of [
      resolveJobNote("JOB_RECOVERED_RESTART", BRIDGE_RECOVER_NOTE, lang),
      resolveJobNote("JOB_NOPE", "note", lang),
      resolveJobNote(null, null, lang),
    ]) {
      assert.ok(!out.includes("JOB_RECOVERED_RESTART"), `ra mã thô ở ${lang}: ${out}`);
      assert.ok(!out.includes("jobNote.recoveredRestart"), `ra key thô ở ${lang}: ${out}`);
    }
  }
});

// --- 5. Nối UI (tĩnh): ExportPanel + CSS ---
ok("ExportPanel import resolveJobNote từ lib/jobNote64R8", () => {
  assert.ok(
    exportPanelSrc.includes('from "./lib/jobNote64R8"') &&
      exportPanelSrc.includes("resolveJobNote"),
    "ExportPanel phải import resolveJobNote",
  );
});

ok("ExportPanel poll đọc noteCode + note từ publicJob trong pollStatus", () => {
  assert.ok(
    exportPanelSrc.includes("resolveJobNote(data.noteCode, data.note"),
    "pollStatus phải gọi resolveJobNote(data.noteCode, data.note, ...)",
  );
});

ok("ExportPanel reset note khi bắt đầu render mới + khi huỷ", () => {
  const starts = exportPanelSrc.match(/setRenderNote\(null\)/g) || [];
  assert.ok(starts.length >= 2, `cần ≥2 lần setRenderNote(null) (start + cancel), thấy ${starts.length}`);
});

ok("ExportPanel render .render-note (role=note) trong khối render-progress, có điều kiện", () => {
  assert.ok(exportPanelSrc.includes('className="render-note"'), "thiếu class render-note");
  assert.ok(exportPanelSrc.includes('role="note"'), "thiếu role=note");
  assert.ok(exportPanelSrc.includes("{renderNote && ("), "phải render có điều kiện theo renderNote");
  const progressIdx = exportPanelSrc.indexOf('className="render-progress"');
  const noteIdx = exportPanelSrc.indexOf('className="render-note"');
  assert.ok(progressIdx >= 0 && noteIdx > progressIdx, ".render-note phải nằm trong khối .render-progress");
});

ok("styles.css định nghĩa .render-note (test cssClasses không đỏ)", () => {
  assert.ok(/\.render-note\s*\{/.test(stylesSrc), "styles.css thiếu .render-note");
});

ok("jobNoteTable() đọc đúng bảng từ fragment round64-r8", () => {
  const table = jobNoteTable();
  assert.equal(table.vi.recoveredRestart, frag.vi.jobNote.recoveredRestart);
  assert.equal(table.en.recoveredRestart, frag.en.jobNote.recoveredRestart);
});

runAll();
