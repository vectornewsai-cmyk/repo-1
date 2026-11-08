/**
 * jobNote64R8.ts — Hiển thị job.note trong UI (Phase 9 đợt 64, luồng R8,
 * đóng nợ đợt 63 §2/§6.7: key `jobNote.recoveredRestart` đã có trong
 * fragment round63-r5 nhưng parent gộp đợt 63 KHÔNG đưa vào dict vì "web
 * hiện không hiển thị job.note ở đâu").
 *
 * Đường đi của note (đã verify trên code, xem LIMITS đợt 64 R8 §1):
 *   bridge `jobQueue` recover sau restart → job.note = RECOVER_NOTE,
 *   job.noteCode = "JOB_RECOVERED_RESTART" (4 nhánh recover, đợt 63 R5)
 *   → `publicJob` lộ `note` + `noteCode` ra API
 *   (`GET /api/render/:id`, kèm cả khi poll `?detail=1`)
 *   → `ExportPanel.pollStatus` đọc `data.noteCode` / `data.note` mỗi giây
 *   → `resolveJobNote` dưới đây → dòng `.render-note` trong khối
 *   `.render-progress` (dưới thanh tiến trình, chỉ khi đang render).
 *
 * Điểm tiêu thụ duy nhất của publicJob trong web là ExportPanel (grep
 * `api/render` trên apps/web/src: chỉ ExportPanel poll job; không có
 * job panel / job list / status bar nào khác — xem LIMITS §1).
 *
 * Cách đọc chuỗi (đúng mẫu lib/scenePhase63R5.ts đợt 63 R5): fragment
 * round64-r8 được import trực tiếp lúc chạy nên chuỗi en hiện ngay,
 * không chờ parent gộp dict vào vi.json/en.json. Fragment này khai lại
 * đúng 1 key `jobNote.recoveredRestart` với giá trị Y HỆT fragment
 * round63-r5 (không collision khi gộp; parent gộp xong thì key vào dict
 * và test validationErrors63R5 lật phần "chưa gộp" — xem LIMITS §6).
 *
 * Thứ tự fallback: mã noteCode đã biết → chuỗi localize theo locale
 * → chuỗi note thô bridge gửi kèm (payload bridge cũ / mã lạ — giữ
 * nguyên hiển thị như trước) → "" (không note thì không hiện gì).
 * Không bao giờ trả key thô (`jobNote.recoveredRestart` /
 * `JOB_RECOVERED_RESTART`) ra UI.
 */
import fragment from "../i18n/fragments/round64-r8.json";
import type { Lang } from "../i18n";

/**
 * Các mã note bridge gửi qua `publicJob.noteCode` — KHỚP 1:1 với
 * `jobQueue.js` (hằng RECOVER_NOTE + 4 nhánh recover, đợt 63 R5).
 * Mã mới ở bridge phải thêm vào đây + fragment thì UI mới dịch được;
 * mã lạ vẫn hiện chuỗi note thô (fallback), không mất thông tin.
 */
export const JOB_NOTE_CODES: readonly string[] = ["JOB_RECOVERED_RESTART"];

/**
 * Ánh xạ mã noteCode (SCREAMING_SNAKE, bridge) → key fragment
 * (camelCase, i18n: `jobNote.<key>` — key `recoveredRestart` đã có từ
 * fragment round63-r5, giữ nguyên tên để parent gộp không collision).
 * Map này là cầu nối DUY NHẤT giữa 2 quy ước đặt tên; test khóa map
 * 1:1 cả 2 chiều (mã bridge == key map, key fragment == giá trị map).
 */
export const NOTE_CODE_TO_FRAGMENT_KEY: Readonly<Record<string, string>> = {
  JOB_RECOVERED_RESTART: "recoveredRestart",
};

/** Bảng song ngữ note: `jobNote.<key>` trong fragment round64-r8
 *  (key camelCase, qua map NOTE_CODE_TO_FRAGMENT_KEY). */
export interface JobNoteTable {
  vi: Record<string, string>;
  en: Record<string, string>;
}

/** Đọc bảng note từ fragment (test có thể truyền bảng riêng). */
export function jobNoteTable(): JobNoteTable {
  const f = fragment as unknown as {
    vi?: { jobNote?: Record<string, string> };
    en?: { jobNote?: Record<string, string> };
  };
  return {
    vi: (f.vi && f.vi.jobNote) || {},
    en: (f.en && f.en.jobNote) || {},
  };
}

/**
 * Chuỗi note đã localize theo mã noteCode + locale; fallback vi khi
 * thiếu key en (đúng quy ước i18n/index.ts). Trả undefined khi mã lạ /
 * mã rỗng / không có trong bảng — caller rớt xuống chuỗi note thô.
 */
export function jobNoteLabel(
  noteCode: string | null | undefined,
  lang: Lang,
  table: JobNoteTable = jobNoteTable(),
): string | undefined {
  if (!noteCode || typeof noteCode !== "string") return undefined;
  const key = NOTE_CODE_TO_FRAGMENT_KEY[noteCode];
  if (!key) return undefined;
  const hit = table[lang] && table[lang][key];
  if (typeof hit === "string" && hit.length > 0) return hit;
  const vi = table.vi[key];
  if (typeof vi === "string" && vi.length > 0) return vi;
  return undefined;
}

/**
 * Chuỗi note hiển thị trong UI cho một job.
 * Thứ tự: chuỗi localize theo noteCode → chuỗi note thô của bridge
 * (chuỗi rỗng / toàn khoảng trắng coi như không có) → "".
 * Không bao giờ trả về mã code hay key i18n thô.
 */
export function resolveJobNote(
  noteCode: string | null | undefined,
  note: string | null | undefined,
  lang: Lang,
  table?: JobNoteTable,
): string {
  const localized =
    jobNoteLabel(noteCode, lang, table) ?? jobNoteLabel(noteCode, "vi", table);
  if (localized) return localized;
  if (typeof note === "string" && note.trim().length > 0) return note.trim();
  return "";
}
