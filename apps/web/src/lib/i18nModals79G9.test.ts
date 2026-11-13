// i18nModals79G9.test.ts — Phase 9 đợt 79, luồng G9: Onboarding modals —
// Escape + i18n còn thiếu (nợ gap analysis §0 / §2.7).
//
// PHẠM VI FILE NÀY — chỉ khóa phần MỚI của G9 (i18n wiring). Hai hạng mục
// (a)/(b) của nhiệm vụ đã đóng từ trước và được kiểm chứng lại ở đợt này
// bằng suite sẵn có (không assert lại ở đây để tránh trùng khóa):
//   (a) Escape 3/3 modal — escapeModals59P2.test.ts 26/26,
//       escapeForms60Q10.test.ts 15/15, welcomeEscape58O1.test.ts 9/9
//       (code: TourCard/TemplatePackModal/TemplatePicker, đợt 59 P2 + 60 Q10;
//       headed 9/9 gần nhất đợt 75 C9).
//   (b) Class modal — modalClasses59P4.test.ts 33/33 (P4 chọn ĐỔI sang class
//       đã có thay vì định nghĩa class mới: caption-modal → modal,
//       modal-x/label/hint/err → icon-btn/field/muted/error),
//       cssClasses60Q2.test.ts 59/59, cssClasses61R4.test.ts 60/60.
// Phần (c) còn lại THẬT sau khi quét AST toàn src (xem LIMITS G9 §2):
//   - openProjectFlow.archiveHistorySkippedMessage: 3 câu VI dựng tay,
//     hiện trong note load-report (code archiveHistorySkipped) — nay qua
//     key openProject.archiveHistory*.
//   - archive.ts historyError: 2 câu VI (history.json hỏng/không object),
//     hiện trong cùng note — nay kèm historyErrorCode để caller dịch qua
//     key openProject.archiveHistory*; historyError giữ nguyên để test
//     A4/A5 (khóa nhắc "history.json") không vỡ.
//   - store.ts addCaptionTrack: label track phụ đề thường hardcode
//     "Phụ đề N" mọi locale — nay qua key captions.trackLabel.
//     Hằng CAPTION_TRACK_LABEL giữ nguyên (label legacy + khóa test M4);
//     nhận diện track vẫn khớp cả hai tiền tố (subtitles.ts).
//
// Chạy bằng esbuild bundle (mẫu U6 — archive.ts import projectRepo không
// đuôi nên Node type-stripping không resolve được; dùng --format=esm):
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nModals79G9.test.ts \
//     --bundle --platform=node --format=esm --outfile=/tmp/g9/i18n79g9.mjs \
//     && node /tmp/g9/i18n79g9.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { setLang, t } from "../i18n";
import { archiveHistorySkippedMessage } from "./openProjectFlow";
import {
  ARCHIVE_HISTORY_FILE,
  exportArchive,
  importArchive,
} from "./archive";
import { ARCHIVE_HISTORY_MAX_VERSIONS } from "./projectHistory";
import { useStore } from "../store";
import type { VideoSpec } from "@repo-1/video-spec";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
const failures: string[] = [];
function check(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
async function runAll(): Promise<void> {
  for (const q of queue) {
    try {
      await q.fn();
      pass++;
      console.log(`  ✓ ${q.name}`);
    } catch (e) {
      failures.push(q.name);
      console.error(`  ✗ ${q.name}: ${(e as Error).message}`);
    }
  }
  console.log(`G9 i18n modals (đợt 79): ${pass}/${queue.length} pass`);
  if (failures.length > 0) {
    console.error(`FAIL: ${failures.join("; ")}`);
    process.exitCode = 1;
  }
}

// --- Dict thật (đọc trực tiếp file JSON, như các test i18n khác) ---
function flatten(o: unknown, prefix: string, out: Map<string, string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.set(q, rec[k] as string);
  }
}
function dict(lang: "vi" | "en"): Map<string, string> {
  const out = new Map<string, string>();
  flatten(
    JSON.parse(readFileSync(`apps/web/src/i18n/${lang}.json`, "utf8")),
    "",
    out,
  );
  return out;
}
const VI = dict("vi");
const EN = dict("en");
const NEW_KEYS = [
  "openProject.archiveHistoryProjectMismatch",
  "openProject.archiveHistoryTooMany",
  "openProject.archiveHistoryVersionMismatch",
  "openProject.archiveHistoryNotObject",
  "openProject.archiveHistoryBadJson",
  "captions.trackLabel",
];

check("dict: vi==en==2767 key lá (2425 + 10 key H7 + 9 key đợt 80 H10 (social presets) + 17 key aiJob.* + 2 key đợt 81 I6 (aiJob.etaEstimating + aiJob.etaHours) + 2 key đợt 84 L9 (mediabin.proxyHeightLabel + mediabin.proxyNoOriginalFile) + 24 key đợt 84 L8 (18 tts.* + 6 bridgeErrors.*) + 11 key đợt 85 M7 (tts.* export/import giọng) + 7 key đợt 85 M8 (mediabin.proxy* progress/retry) + 8 key đợt 87 O5/closing (7 mask/motionTrack + 1 motionTrack.maskStillFollows) + 1 key đợt 88 P6 (validation.TRACK_IMAGE_MASK) + 1 key đợt 91 S5 (motionTrack.title) + 1 key đợt 92 T5 (sticker.title) +249 key đợt 93 U5 (5 sticker.cat.* + 244 sticker.item.*)), 6 key mới đủ cả hai bên, vi khác en", () => {
  assert.equal(VI.size, 2767, `vi.json phải có 2767 key lá, nhận ${VI.size}`);
  assert.equal(EN.size, 2767, `en.json phải có 2767 key lá, nhận ${EN.size}`);
  for (const k of NEW_KEYS) {
    assert.ok(VI.has(k), `vi thiếu key mới ${k}`);
    assert.ok(EN.has(k), `en thiếu key mới ${k}`);
    assert.notEqual(VI.get(k), EN.get(k), `key ${k} vi phải khác en`);
    assert.ok((VI.get(k) as string).length > 0, `key ${k} vi rỗng`);
    assert.ok((EN.get(k) as string).length > 0, `key ${k} en rỗng`);
  }
});

check("dict: placeholder của 6 key mới khớp vi/en", () => {
  const ph = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const k of NEW_KEYS) {
    assert.deepEqual(ph(VI.get(k) as string), ph(EN.get(k) as string), `placeholder key ${k} lệch vi/en`);
  }
  assert.deepEqual(ph(VI.get("openProject.archiveHistoryProjectMismatch") as string), ["detail"]);
  assert.deepEqual(ph(VI.get("openProject.archiveHistoryTooMany") as string), ["detail", "max"]);
  assert.deepEqual(ph(VI.get("openProject.archiveHistoryVersionMismatch") as string), ["detail"]);
  assert.deepEqual(ph(VI.get("captions.trackLabel") as string), ["n"]);
});

check("archiveHistorySkippedMessage: vi đúng từng chữ cả 3 lý do", () => {
  setLang("vi");
  assert.equal(
    archiveHistorySkippedMessage("project-mismatch", "proj-abc"),
    "Lịch sử trong bản nén thuộc project khác (proj-abc) — không nhập.",
  );
  assert.equal(
    archiveHistorySkippedMessage("too-many", "600"),
    `Lịch sử trong bản nén có 600 phiên bản (tối đa ${ARCHIVE_HISTORY_MAX_VERSIONS}) — không nhập.`,
  );
  assert.equal(
    archiveHistorySkippedMessage("version-project-mismatch", "proj-xyz"),
    "Một phiên bản lịch sử trong bản nén thuộc project khác (proj-xyz) — không nhập.",
  );
});

check("archiveHistorySkippedMessage: en đúng từng chữ cả 3 lý do (không còn tiếng Việt)", () => {
  setLang("en");
  assert.equal(
    archiveHistorySkippedMessage("project-mismatch", "proj-abc"),
    "History in the archive belongs to a different project (proj-abc) — skipped.",
  );
  assert.equal(
    archiveHistorySkippedMessage("too-many", "600"),
    `History in the archive has 600 versions (max ${ARCHIVE_HISTORY_MAX_VERSIONS}) — skipped.`,
  );
  assert.equal(
    archiveHistorySkippedMessage("version-project-mismatch", "proj-xyz"),
    "One history version in the archive belongs to a different project (proj-xyz) — skipped.",
  );
  // Không còn dấu tiếng Việt trong câu en (detail là dữ liệu, không tính).
  for (const reason of ["project-mismatch", "too-many", "version-project-mismatch"] as const) {
    const msg = archiveHistorySkippedMessage(reason, "proj-abc");
    assert.ok(!/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/.test(msg), `câu en còn dấu VI: ${msg}`);
  }
  setLang("vi");
});

const UUID_Q = "99999999-8888-7777-6666-555555555555";
function spec(name: string, nClips: number): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name, width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: Array.from({ length: nClips }, (_, i) => ({
        id: `c${i + 1}`, kind: "video", src: "a.mp4", start: i * 2, duration: 2, in: 0, out: 2,
      })),
    }],
  } as unknown as VideoSpec;
}

check("importArchive: history.json JSON lỗi → historyErrorCode badJson, historyError vẫn nhắc history.json (hồi quy A4)", async () => {
  const base = await exportArchive(spec("Q", 2), "Q", [], UUID_Q);
  assert.ok(base.ok && base.blob, "export gốc phải ok");
  const zip = await JSZip.loadAsync(base.blob);
  zip.file(ARCHIVE_HISTORY_FILE, "{json-hong");
  const blob = await zip.generateAsync({ type: "blob" });
  const back = await importArchive(blob);
  assert.ok(back.ok && back.spec, "history hỏng không được hỏng cả lần nhập archive");
  assert.equal(back.history, null);
  assert.equal(back.historyErrorCode, "badJson");
  assert.ok(typeof back.historyError === "string" && back.historyError.includes("history.json"));
  // Câu dịch qua key phải khớp đúng từng chữ (vi + en).
  setLang("vi");
  assert.equal(t("openProject.archiveHistoryBadJson"), "File history.json trong bản nén không phải JSON hợp lệ — bỏ qua lịch sử.");
  setLang("en");
  assert.equal(t("openProject.archiveHistoryBadJson"), "history.json in the archive is not valid JSON — history skipped.");
  setLang("vi");
});

check("importArchive: history.json không phải object → historyErrorCode notObject, import vẫn ok (hồi quy A5)", async () => {
  const base = await exportArchive(spec("Q", 2), "Q", [], UUID_Q);
  assert.ok(base.ok && base.blob, "export gốc phải ok");
  const zip = await JSZip.loadAsync(base.blob);
  zip.file(ARCHIVE_HISTORY_FILE, "[1, 2, 3]");
  const blob = await zip.generateAsync({ type: "blob" });
  const back = await importArchive(blob);
  assert.ok(back.ok && back.spec, "history sai dạng không được hỏng cả lần nhập archive");
  assert.equal(back.history, null);
  assert.equal(back.historyErrorCode, "notObject");
  assert.ok(typeof back.historyError === "string" && back.historyError.includes("history.json"));
  setLang("vi");
  assert.equal(t("openProject.archiveHistoryNotObject"), "File history.json trong bản nén không phải JSON object — bỏ qua lịch sử.");
  setLang("en");
  assert.equal(t("openProject.archiveHistoryNotObject"), "history.json in the archive is not a JSON object — history skipped.");
  setLang("vi");
});

check("importArchive: archive tốt (không có history.json) → historyErrorCode undefined", async () => {
  const base = await exportArchive(spec("Q", 2), "Q", [], UUID_Q);
  assert.ok(base.ok && base.blob, "export gốc phải ok");
  const back = await importArchive(base.blob);
  assert.ok(back.ok && back.spec);
  assert.equal(back.historyErrorCode, undefined);
  assert.equal(back.historyError, undefined);
});

check("store: addCaptionTrack tạo label theo locale (en → Subtitles N, vi → Phụ đề N)", () => {
  const textCount = () => useStore.getState().spec.tracks.filter((tr) => tr.kind === "text").length;
  const seg = [{ start: 0, end: 1, text: "Hello" }];
  setLang("en");
  const nEn = textCount() + 1;
  const idEn = useStore.getState().addCaptionTrack(seg as never, {});
  const labelEn = useStore.getState().spec.tracks.find((tr) => tr.id === idEn)?.label;
  assert.equal(labelEn, `Subtitles ${nEn}`, `label en phải là Subtitles ${nEn}, nhận ${labelEn}`);
  setLang("vi");
  const nVi = textCount() + 1;
  const idVi = useStore.getState().addCaptionTrack(seg as never, {});
  const labelVi = useStore.getState().spec.tracks.find((tr) => tr.id === idVi)?.label;
  assert.equal(labelVi, `Phụ đề ${nVi}`, `label vi phải là Phụ đề ${nVi}, nhận ${labelVi}`);
});

check("store: source không còn hardcode label caption (hồi quy tĩnh)", () => {
  const src = readFileSync("apps/web/src/store.ts", "utf8");
  assert.ok(
    src.includes('i18nT("captions.trackLabel", { n: String(count) })'),
    "store.ts phải tạo label qua i18nT(captions.trackLabel)",
  );
  assert.ok(
    !src.includes("`${CAPTION_TRACK_LABEL} ${count}`"),
    "store.ts không còn dùng `${CAPTION_TRACK_LABEL} ${count}`",
  );
  const flow = readFileSync("apps/web/src/lib/openProjectFlow.ts", "utf8");
  assert.ok(!flow.includes("Lịch sử trong bản nén thuộc project khác"), "openProjectFlow không còn câu VI project-mismatch");
  assert.ok(!flow.includes("Lịch sử trong bản nén có"), "openProjectFlow không còn câu VI too-many");
  assert.ok(!flow.includes("Một phiên bản lịch sử trong bản nén"), "openProjectFlow không còn câu VI version-mismatch");
});

await runAll();
