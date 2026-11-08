/**
 * loadReport.ts — "Báo cáo tải project" (Phase 9 đợt 27, luồng K5).
 *
 * Bối cảnh (nợ #5 của đợt 26): đợt 26 J5 thêm checkSpeedKeyframes +
 * validateSpecDeep, thu warnings speedKeyframes có cấu trúc (tối đa 100,
 * không chặn load) — nhưng warnings đó chỉ tới UI qua toast 4.5s lúc mở
 * file (ProjectMenu.warnList) và lúc khôi phục autosave (App.tsx). Sau
 * khi toast đóng, user không còn chỗ xem lại. Module này giữ lại báo
 * cáo của lần load gần nhất để panel hiển thị bền vững sau khi toast
 * đóng, cho cả hai cổng file và autosave (cộng thêm archive).
 *
 * Thiết kế (theo mẫu lib/toast.ts — module thuần, không phụ thuộc
 * React, dễ test bằng Node type-stripping):
 * - State lần load gần nhất nằm ở module; App subscribe để render
 *   strip/badge + panel. ProjectMenu/App chỉ gọi setLastLoadReport
 *   ngay sau khi load thành công — không đụng luồng load.
 * - Báo cáo KHÔNG tự sửa hay clamp gì (xem LIMITS K5): chỉ xem lại +
 *   định vị clip vi phạm. Hook sửa thuộc luồng K2: panel nhận prop
 *   onFixWarning tùy chọn (kiểu LoadReportFixHandler); khi K2 nối
 *   action sửa vào, panel tự hiện nút "Sửa" mỗi dòng mà không cần
 *   sửa module này.
 * - Báo cáo chỉ sống trong phiên làm việc (không ghi localStorage):
 *   reload trang mà không có autosave → mất báo cáo; reload có
 *   autosave → App khôi phục lại báo cáo từ cổng autosave. Xem LIMITS.
 * - Phase 9 đợt 28 L4: (a) nút "Sửa" đã nối thật ở App (handler sửa
 *   toàn spec qua store K2 + làm mới báo cáo bằng
 *   refreshLoadReportAfterFix); (b) khôi phục từ Lịch sử phiên bản
 *   đồng bộ báo cáo bằng buildHistoryLoadReport (khôi phục bypass
 *   parseProjectText nên J5 không chạy ở đó — HistoryPanel quét lại
 *   spec đã khôi phục); (c) message J5 hiển thị theo locale hiện tại
 *   qua resolveWarningMessage (dịch từ messageKey lúc hiển thị, không
 *   dùng chuỗi tiếng Việt đóng băng lúc load).
 */

import type { SpeedCurveWarning } from "./projectRepo";

/**
 * Đợt 60 Q4 — helper trKey cục bộ (mẫu projectRepo.ts đợt 56 M5):
 * lookup vắng hoặc key thiếu → fallback VI cũ. Module này không import
 * `../i18n` trực tiếp (quy ước Node type-stripping, xem ghi chú
 * formatStructured ở dưới).
 */
type I18nLookup = (key: string, vars?: Record<string, string>) => string;
function trKey(
  lookup: I18nLookup | undefined,
  key: string,
  vars: Record<string, string>,
  fallback: string,
): string {
  if (!lookup) return fallback;
  const out = lookup(key, vars);
  return out === key ? fallback : out;
}

/**
 * Chuỗi hiển thị của một warning cấu trúc — PHẢI khớp formatSpeedCurveWarning
 * trong projectRepo.ts (J5). Cố tình không import hàm đó: import runtime
 * từ projectRepo sẽ kéo @repo-1/video-spec vào, và loadReport.ts dùng
 * import không đuôi (quy ước code thật, tránh TS5097) nên Node
 * type-stripping không resolve được — module này phải chạy độc lập
 * bằng Node để test được. Test loadReport.test.ts khóa sự khớp nhau
 * này với formatSpeedCurveWarning thật trên nhiều mẫu.
 */
function formatStructured(w: SpeedCurveWarning): string {
  return `${w.path} (clip "${w.clipId}"): ${w.message}`;
}

/** Cổng nào đã tạo ra báo cáo (để panel ghi rõ nguồn). */
export type LoadReportSource = "file" | "autosave" | "archive" | "history";

/**
 * Đợt 31 N4 — dạng tối thiểu của StructuredNote (projectRepo) mà module
 * này dùng được mà KHÔNG import runtime projectRepo (xem ghi chú ở
 * formatStructured: import đó kéo @repo-1/video-spec, Node
 * type-stripping không resolve được). Kiểu cấu trúc nên StructuredNote
 * thật gán được trực tiếp, không cần import kiểu.
 */
export interface StructuredNoteShape {
  code: string;
  params: Record<string, string>;
  /** Chuỗi tiếng Việt cũ, byte-identical với chuỗi trong warnings. */
  fallback: string;
}

/**
 * Báo cáo của lần load gần nhất. `warnings` là warnings cấu trúc của
 * J5 (đã bị cổng load cắt ở 100 mục); `otherWarnings` là các cảnh
 * báo chuỗi còn lại của lần load đó — đã trừ các chuỗi speedCurve đã
 * có dạng cấu trúc, câu tràn 100, VÀ các chuỗi đã có dạng cấu trúc
 * trong `structuredNotes` (blob/migration/format/style, đợt 31 N4);
 * `structuredNotes` giữ lại các cảnh báo đó ở dạng code + tham số để
 * UI dịch qua i18n (nhóm key `structuredNotes.*`).
 */
export interface LoadReport {
  source: LoadReportSource;
  projectName: string;
  /** Thời điểm ghi báo cáo (ISO) — tức thời điểm load, không phải savedAt của file. */
  loadedAt: string;
  warnings: SpeedCurveWarning[];
  otherWarnings: string[];
  structuredNotes: StructuredNoteShape[];
  /** true khi cổng load đã cắt ở 100 mục (warnings.length === 100 hoặc có câu tràn). */
  atCap: boolean;
  /**
   * Đợt 57 N7 — số cảnh báo tràn đọc được từ câu tràn của cổng load
   * (parseOverflowCount), hoặc null khi không có câu tràn. Optional để
   * literal LoadReport cũ (loadReportFix28.test.ts) vẫn biên dịch;
   * buildLoadReport / buildHistoryLoadReport luôn gán giá trị. Panel
   * (luồng sau) dùng số này + formatOverflowLine để hiện câu tràn đã
   * dịch thay cho chuỗi `loadReport.atCap` chung chung.
   */
  overflowCount?: number | null;
}

/** Đầu vào tối thiểu để dựng báo cáo — khớp LoadResult và ImportArchiveResult. */
export interface LoadReportInput {
  warnings: string[];
  speedCurveWarnings?: SpeedCurveWarning[];
  structuredNotes?: StructuredNoteShape[];
}

/**
 * Câu tràn 100 mục mà parseProjectText (J5) thêm vào warnings chuỗi.
 *
 * Đợt 57 N7 — đóng nợ M5 (LIMITS đợt 56 §5.3): regex cũ chỉ khớp chuỗi
 * tiếng Việt đóng băng `Còn N cảnh báo speedKeyframes khác…` mà
 * projectRepo.ts:1112 đẩy ra. Key `projectRepo.moreWarnings` (fragment
 * round57-n7.json) dịch câu đó sang EN — khi một luồng khác nối
 * projectRepo.ts:1112 bằng trKey, câu tràn tới đây sẽ là bản EN; regex
 * phải nhận ra cả hai dạng, nếu không câu EN sẽ lọt vào otherWarnings
 * và atCap về false (panel hiện chuỗi EN thô thay cho câu atCap đã
 * dịch). Hai nhánh ghim đúng từng chữ template vi/en trong fragment;
 * nhánh EN giữ nguyên hậu tố "(limited to showing 100)" để không khớp
 * nhầm câu khác có chứa "more … warnings". Đổi wording fragment thì
 * phải đổi regex này cùng lúc — test loadReport57N7.test.ts khóa bằng
 * cách dựng câu EN trực tiếp từ fragment.
 */
const OVERFLOW_RE =
  /^(?:Còn (\d+) cảnh báo speedKeyframes khác|Still (\d+) more speedKeyframes warnings)/;

/** Key i18n của câu tràn (fragment round57-n7.json, parent gộp vào dict). */
export const OVERFLOW_KEY = "projectRepo.moreWarnings";

/**
 * Đợt 57 N7 — trích số cảnh báo tràn từ một dòng warnings chuỗi, ở cả
 * hai locale (VI literal cũ của projectRepo.ts:1112 hoặc bản EN đã dịch
 * qua `projectRepo.moreWarnings`). Trả null khi dòng không phải câu
 * tràn. Không parse gì khác ngoài số đếm ở đầu câu.
 */
export function parseOverflowCount(line: string): number | null {
  const m = OVERFLOW_RE.exec(line);
  if (!m) return null;
  const n = Number(m[1] ?? m[2]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Đợt 57 N7 — đường dịch của câu tràn: dựng câu tràn theo locale HIỆN
 * TẠI qua key `projectRepo.moreWarnings` + vars `{n}` (cùng mẫu
 * resolveWarningMessage: module này KHÔNG import i18n để test Node
 * type-stripping vẫn chạy; panel truyền `(k, v) => t(k, v)`). Không có
 * lookup, hoặc lookup trả về đúng key (key chưa gộp vào dict) → fallback
 * về chuỗi tiếng Việt cũ đúng từng byte với projectRepo.ts:1112, không
 * hiện key thô. `count` phải là số nguyên ≥ 0; giá trị khác → fallback
 * VI với `String(count)` để không bịa số.
 */
export function formatOverflowLine(
  count: number,
  lookup?: (key: string, vars?: Record<string, string>) => string,
): string {
  const n = Number.isInteger(count) && count >= 0 ? String(count) : String(count);
  const fallback = `Còn ${n} cảnh báo speedKeyframes khác (đã giới hạn hiển thị 100).`;
  if (!lookup) return fallback;
  const translated = lookup(OVERFLOW_KEY, { n });
  return translated === OVERFLOW_KEY ? fallback : translated;
}

/**
 * Dựng LoadReport từ kết quả một lần load thành công. Không mutate
 * input; warnings cấu trúc được giữ nguyên tham chiếu từng mục.
 */
export function buildLoadReport(
  input: LoadReportInput,
  source: LoadReportSource,
  projectName: string,
): LoadReport {
  const structured = input.speedCurveWarnings ?? [];
  const formatted = new Set(structured.map((w) => formatStructured(w)));
  const structuredNotes = input.structuredNotes ?? [];
  // Đợt 31 N4: trừ cả chuỗi fallback của structuredNotes — KHÔNG parse
  // chuỗi tiếng Việt: fallback do chính projectRepo sinh ra nên khớp
  // byte-identical với chuỗi trong warnings (khóa bằng test đợt 31).
  // Lưu ý: nếu hai note trùng fallback (không xảy ra với template hiện
  // tại — mỗi note mang clipId/path riêng, trừ hint chỉ xuất hiện 1
  // lần) thì cả hai chuỗi trùng đều bị trừ, nhưng note vẫn còn đủ
  // trong structuredNotes nên UI không mất thông tin.
  const noteFallbacks = new Set(structuredNotes.map((n) => n.fallback));
  // Đợt 57 N7: câu tràn khớp ở cả hai locale (VI literal cũ hoặc bản EN
  // đã dịch qua projectRepo.moreWarnings); giữ lại số đếm để panel hiện
  // câu tràn đã dịch bằng formatOverflowLine thay cho atCap chung chung.
  const overflowLine = input.warnings.find((s) => OVERFLOW_RE.test(s));
  const overflow = overflowLine !== undefined;
  const overflowCount = overflowLine === undefined ? null : parseOverflowCount(overflowLine);
  const otherWarnings = input.warnings.filter(
    (s) => !formatted.has(s) && !noteFallbacks.has(s) && !OVERFLOW_RE.test(s),
  );
  return {
    source,
    projectName,
    loadedAt: new Date().toISOString(),
    warnings: structured,
    otherWarnings,
    structuredNotes,
    atCap: structured.length >= 100 || overflow,
    overflowCount,
  };
}

/**
 * Phase 9 đợt 28 L4 — dựng báo cáo cho một lần KHÔI PHỤC từ Lịch sử
 * phiên bản. Khác buildLoadReport: khôi phục bypass parseProjectText
 * nên không có warnings chuỗi (blob/migration) và không có cờ tràn —
 * warnings ở đây là kết quả quét LẠI TOÀN BỘ spec đã khôi phục bằng
 * collectSpeedCurveWarnings (không cắt 100 như cổng load), nên atCap
 * luôn false dù danh sách dài hơn 100. otherWarnings rỗng là đúng
 * (không phải thiếu dữ liệu) — xem LIMITS L4.
 */
export function buildHistoryLoadReport(
  warnings: SpeedCurveWarning[],
  projectName: string,
): LoadReport {
  return {
    source: "history",
    projectName,
    loadedAt: new Date().toISOString(),
    warnings,
    otherWarnings: [],
    structuredNotes: [],
    atCap: false,
    overflowCount: null,
  };
}

/**
 * Phase 9 đợt 28 L4 — làm mới báo cáo sau khi user bấm "Sửa" (App quét
 * lại spec hiện tại bằng collectSpeedCurveWarnings rồi gọi hàm này).
 * Giữ nguyên nguồn / tên project / thời điểm load gốc / lưu ý khác;
 * chỉ thay warnings bằng danh sách còn lại — warning đã sửa biến mất,
 * warning chưa sửa được (không cứu được / track khóa) ở lại. atCap về
 * false vì danh sách mới là quét toàn bộ không cắt 100 (khác báo cáo
 * gốc từ cổng load vốn cắt ở 100).
 */
export function refreshLoadReportAfterFix(
  report: LoadReport,
  remaining: SpeedCurveWarning[],
): LoadReport {
  // Đợt 57 N7: overflowCount về null cùng atCap — danh sách mới là quét
  // toàn bộ không cắt 100 nên không còn câu tràn nào để đếm.
  return { ...report, warnings: remaining, atCap: false, overflowCount: null };
}

/**
 * Phase 9 đợt 28 L4 — message J5 hiển thị theo locale HIỆN TẠI.
 * `lookup` là hàm dịch của UI (panel truyền `(k, v) => t(k, v)`); module
 * này cố tình KHÔNG import i18n để test Node type-stripping vẫn chạy
 * được (i18n import JSON, Node không resolve như vite/tsc). Quy tắc:
 * warning có messageKey (J5 từ đợt 28) → dịch qua key + vars; key thiếu
 * (lookup trả về đúng key) → fallback về message gốc; warning cũ không
 * có messageKey → message như trước. Không parse message tiếng Việt.
 */
export function resolveWarningMessage(
  w: SpeedCurveWarning,
  lookup: (key: string, vars?: Record<string, string>) => string,
): string {
  if (!w.messageKey) return w.message;
  const translated = lookup(w.messageKey, w.messageVars);
  return translated === w.messageKey ? w.message : translated;
}

/**
 * Phase 9 đợt 29 L4 — chuỗi đầy đủ của một warning theo locale hiện
 * tại, cùng format với formatStructured của J5 (`path (clip "id"):
 * message`) nhưng message đã dịch qua messageKey. App dùng cho toast
 * khôi phục autosave (thay cho chuỗi tiếng Việt đóng băng lúc load);
 * panel vẫn dùng resolveWarningMessage vì panel hiện path riêng.
 * Lưu ý vi: message dịch là dạng ngắn của dict speedCurve (không còn
 * tiền tố `.speedKeyframes.keyframes[i]` như message J5 gốc) — cùng
 * dạng panel đã hiện từ đợt 28, xem LIMITS đợt 29.
 */
export function formatWarningTranslated(
  w: SpeedCurveWarning,
  lookup: (key: string, vars?: Record<string, string>) => string,
): string {
  return `${w.path} (clip "${w.clipId}"): ${resolveWarningMessage(w, lookup)}`;
}

/**
 * Đợt 31 N4 — một structuredNote theo locale HIỆN TẠI: key
 * `structuredNotes.<code>` + params; key thiếu (lookup trả về đúng
 * key) → fallback về chuỗi tiếng Việt gốc, không hiện key thô (cùng
 * mẫu resolveWarningMessage). Đợt 32 O4: code "motionMigrated" có
 * `params.cases` thì dịch từng case (xem nhánh trong hàm); note cũ
 * không có `cases` vẫn giữ hành vi đợt 31 (khung dịch, notes thô).
 */
export function formatStructuredNote(
  note: StructuredNoteShape,
  lookup: (key: string, vars?: Record<string, string>) => string,
): string {
  const key = `structuredNotes.${note.code}`;
  // Đợt 32 O4 — motionMigrated có `params.cases` (JSON các case suy từ
  // dữ liệu gốc ở projectRepo.motionNoteCases): dịch TỪNG case qua key
  // `structuredNotes.motionNote*` rồi ghép bằng "; " vào vị trí {notes}
  // của template motionMigrated. Dùng sentinel thay cho {notes} khi gọi
  // lookup template (lookup chỉ thay {name} nên sentinel không bị đụng)
  // rồi thay sentinel bằng chuỗi case đã dịch — tránh parse chuỗi notes
  // tiếng Việt và tránh để {notes} thô lọt vào bản dịch. Bất kỳ key
  // nào thiếu, cases parse lỗi, hoặc cases rỗng → rơi về đường chung
  // dưới (template với notes thô / fallback), không hiện key thô, không
  // bịa nửa câu dịch nửa câu gốc.
  if (note.code === "motionMigrated" && typeof note.params.cases === "string" && note.params.cases.length > 0) {
    try {
      const cases = JSON.parse(note.params.cases) as { code: string; vars: Record<string, string> }[];
      if (Array.isArray(cases) && cases.length > 0) {
        const parts: string[] = [];
        for (const c of cases) {
          // Đợt 60 Q4 — key loadReport.badCase: "case xấu" là sentinel
          // điều khiển nội bộ (throw → catch ngay dưới, message không
          // bao giờ thoát ra ngoài); nối qua trKey chỉ để literal biến
          // mất khỏi source + tiêu thụ đúng key fragment P7, không đổi
          // hành vi: đường chung dưới vẫn là nơi trả chuỗi hiển thị.
          if (!c || typeof c.code !== "string") throw new Error(trKey(lookup, "loadReport.badCase", {}, "case xấu"));
          const caseKey = `structuredNotes.${c.code}`;
          const tr = lookup(caseKey, c.vars ?? {});
          if (tr === caseKey) return note.fallback;
          parts.push(tr);
        }
        const SENTINEL = "NOTES";
        const tpl = lookup(key, { ...note.params, notes: SENTINEL });
        if (tpl === key) return note.fallback;
        return tpl.replace(SENTINEL, parts.join("; "));
      }
    } catch {
      // rơi về đường chung dưới (notes thô / fallback)
    }
  }
  const translated = lookup(key, note.params);
  return translated === key ? note.fallback : translated;
}

/**
 * Đợt 31 N4 — danh sách dòng lưu ý cho toast: structuredNotes đã dịch
 * trước, rồi các chuỗi thô còn lại TRỪ chuỗi fallback của note (tránh
 * hiện trùng một cảnh báo hai lần — đường lưu/export vẫn giữ warnings
 * chuỗi song song với structuredNotes). Dùng chung cho toast Lưu file
 * (ProjectMenu + Ctrl+S ở App) và toast Xuất bản nén.
 */
export function formatNoteLines(
  notes: StructuredNoteShape[],
  rawWarnings: string[],
  lookup: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const fallbacks = new Set(notes.map((n) => n.fallback));
  return [
    ...notes.map((n) => formatStructuredNote(n, lookup)),
    ...rawWarnings.filter((w) => !fallbacks.has(w)),
  ];
}

/** Entry sửa của curveFix ở dạng cấu trúc tối thiểu (không import curveFix). */
export interface FixEntryShape {
  changes: string[];
  changeItems?: { key: string; vars?: Record<string, string> }[];
}

/**
 * Phase 9 đợt 29 L4 — từng dòng thay đổi trong confirm sửa theo locale
 * hiện tại. Dùng changeItems khi độ dài khớp changes (luôn đúng với
 * sanitize đợt 29); key thiếu → fallback về chuỗi tiếng Việt gốc từng
 * dòng, không hiện key thô. Không parse chuỗi tiếng Việt.
 */
export function formatFixEntryChanges(
  entry: FixEntryShape,
  lookup: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const items = entry.changeItems;
  if (!items || items.length !== entry.changes.length) return [...entry.changes];
  return entry.changes.map((raw, i) => {
    const translated = lookup(items[i].key, items[i].vars);
    return translated === items[i].key ? raw : translated;
  });
}

/** Entry không cứu được ở dạng tối thiểu (không import curveFix). */
export interface UnsalvageableEntryShape {
  reason: string;
  reasonKey?: string;
}

/**
 * Phase 9 đợt 29 L4 — lý do không cứu được theo locale hiện tại
 * (key `curveFix.reason*`); thiếu key → chuỗi tiếng Việt gốc.
 */
export function resolveUnsalvageableReason(
  entry: UnsalvageableEntryShape,
  lookup: (key: string, vars?: Record<string, string>) => string,
): string {
  if (!entry.reasonKey) return entry.reason;
  const translated = lookup(entry.reasonKey);
  return translated === entry.reasonKey ? entry.reason : translated;
}

// ---------------------------------------------------------------------------
// Store module-level (mẫu toast.ts): giữ báo cáo + thông báo subscriber.
// ---------------------------------------------------------------------------

let current: LoadReport | null = null;
type Listener = (report: LoadReport | null) => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const fn of listeners) fn(current);
}

/** Ghi báo cáo lần load gần nhất (gọi ngay sau load thành công). */
export function setLastLoadReport(report: LoadReport): void {
  current = report;
  emit();
}

/** Xoá báo cáo (vd: tạo project mới, user bấm "Bỏ qua" trên strip). */
export function clearLastLoadReport(): void {
  if (current === null) return;
  current = null;
  emit();
}

export function getLastLoadReport(): LoadReport | null {
  return current;
}

/**
 * Đăng ký nhận báo cáo hiện tại + mọi thay đổi sau đó. Trả về hàm huỷ
 * đăng ký. Callback được gọi ngay với snapshot hiện tại.
 */
export function subscribeLoadReport(fn: Listener): () => void {
  listeners.add(fn);
  fn(current);
  return () => {
    listeners.delete(fn);
  };
}

// ---------------------------------------------------------------------------
// Định vị clip vi phạm trên timeline (panel dùng để chọn clip).
// ---------------------------------------------------------------------------

/** Spec tối thiểu mà resolver cần — khớp VideoSpec về mặt cấu trúc. */
export interface LoadReportSpecShape {
  tracks: readonly {
    id: string;
    clips: readonly { id: string; start: number }[];
  }[];
}

export interface TopLevelClipTarget {
  trackId: string;
  clipId: string;
  /** Thời điểm bắt đầu clip ngoài cùng (để nhảy playhead tới). */
  start: number;
  /** Số đoạn `.subSpec` trong path: 0 = clip cấp cao, >0 = nằm trong nested. */
  nestedDepth: number;
}

const TOP_CLIP_RE = /^tracks\[(\d+)\]\.clips\[(\d+)\]/;

/**
 * Từ path J5 (vd `tracks[0].clips[0].subSpec.tracks[0].clips[0]`) tìm
 * clip CẤP CAO chứa vi phạm — vì selection của store chỉ chọn được
 * clip cấp cao, clip trong nested được định vị qua clip ngoài cùng
 * của nó (nestedDepth > 0). Trả null khi path không parse được hoặc
 * chỉ số track/clip không còn khớp spec hiện tại (project đã đổi sau
 * khi load) — khi đó panel hiện ghi chú thay vì nút định vị.
 */
export function resolveTopLevelClip(
  path: string,
  spec: LoadReportSpecShape,
): TopLevelClipTarget | null {
  const m = TOP_CLIP_RE.exec(path);
  if (!m) return null;
  const ti = Number(m[1]);
  const ci = Number(m[2]);
  const track = spec.tracks[ti];
  if (!track) return null;
  const clip = track.clips[ci];
  if (!clip) return null;
  return {
    trackId: track.id,
    clipId: clip.id,
    start: Number.isFinite(clip.start) ? clip.start : 0,
    nestedDepth: (path.match(/\.subSpec/g) ?? []).length,
  };
}

// ---------------------------------------------------------------------------
// Gợi ý sửa (chỉ là gợi ý hiển thị — panel KHÔNG tự áp dụng).
// ---------------------------------------------------------------------------

export interface LoadReportSuggestion {
  /** Key i18n trong nhóm `loadReport.*` (panel dịch qua t()). */
  key: string;
  vars?: Record<string, string>;
}

/**
 * Gợi ý sửa cho một warning J5. Chỉ suy từ field + value, KHÔNG parse
 * message (tránh phụ thuộc chuỗi tiếng Việt của J5): riêng field "t"
 * dùng một gợi ý chung bao cả hai lỗi (thứ tự + vượt duration) vì
 * không phân biệt được hai lỗi này nếu chỉ nhìn value.
 */
export function suggestFix(w: SpeedCurveWarning): LoadReportSuggestion {
  switch (w.field) {
    case "v":
      return { key: "loadReport.fixV", vars: { min: "0.25", max: "4" } };
    case "t":
      return { key: "loadReport.fixT" };
    case "easing":
      return { key: "loadReport.fixEasing" };
    case "bezier":
      return { key: "loadReport.fixBezier" };
    case "keyframes":
      if (Array.isArray(w.value) && w.value.length === 0)
        return { key: "loadReport.fixKeyframesEmpty" };
      if (typeof w.value === "number" && w.value > 128)
        return { key: "loadReport.fixKeyframesTooMany", vars: { max: "128" } };
      return { key: "loadReport.fixKeyframesShape" };
    default:
      return { key: "loadReport.fixGeneric" };
  }
}

/** Hiển thị giá trị vi phạm (cắt ngắn để không vỡ layout panel). */
export function formatWarningValue(v: unknown): string {
  const s = JSON.stringify(v) ?? String(v);
  return s.length > 120 ? s.slice(0, 117) + "…" : s;
}

/**
 * Điểm nối sửa của luồng K2 (lỏng — không phụ thuộc code K2): một
 * handler nhận đúng 1 warning và tự lo việc sửa/clamp + undo. Panel
 * chỉ hiện nút "Sửa" khi App truyền handler này vào; chưa có handler
 * thì panel vẫn đầy đủ chức năng xem lại + định vị.
 */
export type LoadReportFixHandler = (warning: SpeedCurveWarning) => void;
