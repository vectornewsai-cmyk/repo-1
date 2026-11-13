/**
 * jobHistory67U7.ts — Lịch sử job xuất + resume upload khi đóng panel
 * (Phase 9 đợt 67, luồng U7 — đóng nợ đợt 66 T8 / ROUND66_LIMITS §8.7:
 * "Job `done` mở lại vẫn idle (cần UI lịch sử job); panel đang mở mà
 * bridge restart thì poll chưa có nhánh `interrupted`; upload đang bay
 * thì đóng panel không resume được").
 *
 * Ba việc, một lib thuần (+ localStorage, inject được cho test):
 *
 * 1. LỊCH SỬ JOB (key `vcut.jobHistory.v1`, tối đa 20 mục, mới nhất
 *    trước): mọi chuyển trạng thái terminal của job (done / error /
 *    interrupted / cancelled trong pollStatus, POST xong, huỷ) đều ghi
 *    vào lịch sử; lúc mount, danh sách `GET /api/render` hợp nhất vào
 *    (trạng thái mới nhất thắng) nên job `done` từ phiên trước vẫn mở
 *    lại được kết quả — không còn về idle mù như T8 §5.1. Mục lịch sử
 *    chỉ giữ metadata (id, trạng thái, tên file output, dung lượng,
 *    lỗi/note thô) — MP4 vẫn tải từ bridge qua
 *    `GET /api/render/:id/download`, không copy binary vào localStorage.
 *
 * 2. PHIÊN UPLOAD (key `vcut.uploadSession.v1`): startRender ghi
 *    session TRƯỚC khi POST /api/render; POST xong (kể cả khi panel đã
 *    đóng giữa lúc upload — fetch không bị huỷ khi unmount) thì xoá
 *    session + ghi lịch sử; POST lỗi thì xoá session + ghi mục lỗi
 *    kind="upload" (không jobId) để lần mở sau thấy rõ. Mở lại panel
 *    mà còn session chưa stale (>10 phút) thì panel hiện trạng thái
 *    "uploading" + chờ job xuất hiện trên bridge (poll list 2s, tối đa
 *    120s, khớp job có createdAt >= startedAt - 5s) rồi nối tiếp —
 *    không POST lại nên không nhân đôi upload; nút Xuất bị disable
 *    trong lúc chờ (renderStatus "uploading"). Hết 120s không thấy job
 *    (tab đã đóng giữa lúc upload / bridge mất job) → xoá session, về
 *    idle. Session stale lúc mount (>10 phút) → xoá ngay, về idle.
 *
 * 3. NHÁNH `interrupted` nằm ở ExportPanel.pollStatus (không ở lib
 *    này — poll là closure của component): job chuyển `interrupted`
 *    (bridge recover sau restart, kèm errorCode
 *    JOB_INTERRUPTED_BY_RESTART + noteCode JOB_RECOVERED_RESTART) thì
 *    dừng poll, hiện lỗi + note phục hồi + nút "Render lại" như job lỗi
 *    khi mở lại (T8), đồng thời ghi lịch sử.
 *
 * Cách đọc chuỗi (đúng mẫu lib/resumeRenderJob66T8.ts đợt 66 T8):
 * fragment round67-u7 được import trực tiếp lúc chạy nên chuỗi en hiện
 * ngay, không chờ parent gộp dict vào vi.json/en.json. Key đầy đủ
 * `jobHistory.<leaf>` xuất hiện nguyên văn trong JOB_HISTORY_KEYS nên
 * scan tĩnh thấy là đã tiêu thụ; parent gộp fragment vào dict thì
 * không collision (namespace `jobHistory.*` mới hoàn toàn). Không bao
 * giờ trả key thô ra UI: thiếu key → rớt về vi → rớt về "" (component
 * ẩn khối khi không có chuỗi) / trạng thái thô (không phải key).
 */
import fragment from "../i18n/fragments/round67-u7.json";
import type { Lang } from "../i18n";

/**
 * Toàn bộ key của cụm này — KHỚP 1:1 với fragment round67-u7
 * (vi + en, chuỗi không rỗng, vi khác en).
 * Khai đầy đủ dạng literal để scan tĩnh thấy key đã tiêu thụ.
 */
export const JOB_HISTORY_KEYS: readonly string[] = [
  "jobHistory.title",
  "jobHistory.empty",
  "jobHistory.openResult",
  "jobHistory.resume",
  "jobHistory.delete",
  "jobHistory.statusDone",
  "jobHistory.statusRunning",
  "jobHistory.statusQueued",
  "jobHistory.statusError",
  "jobHistory.statusCancelled",
  "jobHistory.statusInterrupted",
  "jobHistory.statusUploading",
  "jobHistory.uploadWaiting",
  "jobHistory.uploadFailed",
  "jobHistory.gone",
];

/** Key lá (không tiền tố) trong bảng fragment `jobHistory.*`. */
export const JOB_HISTORY_LEAF_KEYS: readonly string[] = [
  "title",
  "empty",
  "openResult",
  "resume",
  "delete",
  "statusDone",
  "statusRunning",
  "statusQueued",
  "statusError",
  "statusCancelled",
  "statusInterrupted",
  "statusUploading",
  "uploadWaiting",
  "uploadFailed",
  "gone",
];

/** Kho lịch sử job trong localStorage (chỉ metadata, không binary). */
export const JOB_HISTORY_KEY = "vcut.jobHistory.v1";
/** Giữ tối đa 20 mục — đủ xem lại các lần xuất gần đây, không phình kho. */
export const JOB_HISTORY_MAX_ENTRIES = 20;

/** Kho phiên upload đang bay trong localStorage. */
export const UPLOAD_SESSION_KEY = "vcut.uploadSession.v1";
/** Phiên upload quá 10 phút mà chưa có job → coi như chết (tab đã đóng
 *  giữa lúc upload / bridge mất job), lần mở sau xoá ngay, về idle. */
export const UPLOAD_SESSION_MAX_AGE_MS = 10 * 60 * 1000;
/** Chờ job xuất hiện trên bridge sau khi mở lại panel, tối đa 120s
 *  (upload local thường chỉ vài giây–vài chục giây; quá hạn thì về idle). */
export const UPLOAD_WAIT_TIMEOUT_MS = 120_000;
/** Dung sai khi khớp job với phiên upload: createdAt của bridge và
 *  startedAt của trình duyệt cùng máy, cùng đồng hồ — 5s là dư dả. */
export const UPLOAD_JOB_MATCH_TOLERANCE_MS = 5_000;

/** Trạng thái job bridge (jobQueue.js KNOWN_STATUSES) + "uploading"
 *  (trạng thái UI lúc POST chưa xong, chưa có job trên bridge). */
export const JOB_HISTORY_STATUSES: readonly string[] = [
  "queued",
  "running",
  "done",
  "error",
  "cancelled",
  "interrupted",
  "uploading",
];

/** Trạng thái cuối — ghi lịch sử + dừng poll (pollStatus xử lý). */
export const JOB_HISTORY_TERMINAL_STATUSES: readonly string[] = [
  "done",
  "error",
  "cancelled",
  "interrupted",
];

/** Một mục lịch sử job (chỉ metadata — MP4 vẫn ở bridge). */
export interface JobHistoryEntry {
  /** Id duy nhất của mục: id job bridge, hoặc `upload-<startedAt>`
   *  cho mục lỗi upload (chưa có job nên không có jobId). */
  id: string;
  /** Id job trên bridge; null = mục lỗi upload (không tải/xem được). */
  jobId: string | null;
  /** "render" = job bridge thật; "upload" = POST upload thất bại. */
  kind: "render" | "upload";
  status: string;
  progress: number;
  createdAt: number;
  updatedAt: number;
  projectName: string | null;
  presetLabel: string | null;
  outputName: string | null;
  outputSize: number | null;
  error: string | null;
  note: string | null;
  /** Đợt 68 V8 — đích .mp4 user đã chọn trong Electron (đường dẫn tuyệt
   *  đối, do pickExportDestinationNative trả về lúc bắt đầu render).
   *  null = web thường (tải qua anchor) hoặc job tạo trước đợt 68.
   *  Chỉ metadata text nên vừa trần localStorage; upsert GIỮ lại khi
   *  mục mới từ bridge không mang đích (hợp nhất lúc mount không được
   *  xoá đích đã lưu — xem upsertHistoryEntry). */
  exportDest?: string | null;
}

/**
 * Dạng tối thiểu của publicJob mà lịch sử cần (mọi field đều có trong
 * `GET /api/render` / `GET /api/render/:id` — xem publicJob.js).
 */
export interface BridgeJobLike {
  id?: string;
  status?: string;
  progress?: number;
  createdAt?: number;
  finishedAt?: number;
  outputName?: string | null;
  outputSize?: number | null;
  error?: string | null;
  note?: string | null;
  [k: string]: unknown;
}

/** Kho lưu trữ tối thiểu (localStorage thật khớp interface này). */
export interface HistoryStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Test inject kho "giả" (Node không có localStorage); null = dùng lại
 *  localStorage thật. Mẫu legacyAdopt66T7 (localStorage trong try/catch
 *  nên vẫn chạy được dưới node khi react import lib này). */
function defaultStore(): HistoryStore | null {
  try {
    const g = globalThis as unknown as { localStorage?: HistoryStore };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Trạng thái cuối (done/error/cancelled/interrupted) hay chưa. */
export function isTerminalHistoryStatus(status: string | null | undefined): boolean {
  return typeof status === "string" && JOB_HISTORY_TERMINAL_STATUSES.includes(status);
}

/**
 * Chuyển một job bridge thành mục lịch sử; null khi job không có id
 * (không ghi mục mồ côi). projectName/presetLabel chỉ là metadata hiển
 * thị — thiếu thì null, không chặn ghi.
 */
export function historyEntryFromJob(
  job: BridgeJobLike | null | undefined,
  projectName?: string | null,
  presetLabel?: string | null,
  // Đợt 68 V8 — đích .mp4 đã chọn (Electron): chỉ có lúc bắt đầu render
  // mới (startRender truyền vào); hợp nhất từ bridge lúc mount thì
  // không truyền → null, upsert giữ đích cũ (không xoá).
  exportDest?: string | null,
): JobHistoryEntry | null {
  if (!job || typeof job.id !== "string" || !job.id) return null;
  const now = Date.now();
  return {
    id: job.id,
    jobId: job.id,
    kind: "render",
    status: typeof job.status === "string" && job.status ? job.status : "error",
    progress: typeof job.progress === "number" && isFinite(job.progress) ? job.progress : 0,
    createdAt: typeof job.createdAt === "number" ? job.createdAt : now,
    updatedAt: now,
    projectName: typeof projectName === "string" && projectName ? projectName : null,
    presetLabel: typeof presetLabel === "string" && presetLabel ? presetLabel : null,
    outputName: typeof job.outputName === "string" ? job.outputName : null,
    outputSize: typeof job.outputSize === "number" ? job.outputSize : null,
    error: typeof job.error === "string" && job.error ? job.error : null,
    note: typeof job.note === "string" && job.note ? job.note : null,
    exportDest: typeof exportDest === "string" && exportDest ? exportDest : null,
  };
}

/**
 * Chèn/cập nhật một mục vào danh sách (thuần, không chạm storage):
 * trùng id thì thay bằng mục mới nhưng GIỮ createdAt gốc (lần xuất
 * không bị đẩy lên đầu chỉ vì poll cập nhật trạng thái); sắp mới nhất
 * trước theo createdAt desc; cắt ở JOB_HISTORY_MAX_ENTRIES.
 * Đợt 68 V8: cũng GIỮ exportDest cũ khi mục mới không mang đích (mục
 * từ bridge lúc mount/poll không biết đích đã chọn — chỉ lần ghi lúc
 * startRender mới có; hợp nhất không được xoá đích đã lưu).
 */
export function upsertHistoryEntry(
  entries: readonly JobHistoryEntry[],
  entry: JobHistoryEntry,
): JobHistoryEntry[] {
  const now = Date.now();
  const prev = entries.find((e) => e.id === entry.id);
  const merged: JobHistoryEntry = prev
    ? {
        ...entry,
        createdAt: prev.createdAt,
        updatedAt: now,
        exportDest: entry.exportDest ?? prev.exportDest ?? null,
      }
    : { ...entry, updatedAt: now, exportDest: entry.exportDest ?? null };
  const next = [merged, ...entries.filter((e) => e.id !== entry.id)];
  next.sort((a, b) => b.createdAt - a.createdAt); // sort ổn định: bằng nhau giữ thứ tự chèn (mục mới trước)
  return next.slice(0, JOB_HISTORY_MAX_ENTRIES);
}

/** Xoá một mục khỏi danh sách (thuần). */
export function removeHistoryEntry(
  entries: readonly JobHistoryEntry[],
  id: string,
): JobHistoryEntry[] {
  return entries.filter((e) => e.id !== id);
}

/** Đọc lịch sử từ kho; JSON hỏng / sai dạng → rỗng (không crash app). */
export function loadJobHistory(store: HistoryStore | null = defaultStore()): JobHistoryEntry[] {
  if (!store) return [];
  try {
    const raw = store.getItem(JOB_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: JobHistoryEntry[] = [];
    for (const e of parsed) {
      if (!e || typeof e !== "object") continue;
      const c = e as Partial<JobHistoryEntry>;
      if (typeof c.id !== "string" || !c.id) continue;
      if (typeof c.status !== "string" || !c.status) continue;
      if (typeof c.createdAt !== "number") continue;
      out.push({
        id: c.id,
        jobId: typeof c.jobId === "string" ? c.jobId : null,
        kind: c.kind === "upload" ? "upload" : "render",
        status: c.status,
        progress: typeof c.progress === "number" ? c.progress : 0,
        createdAt: c.createdAt,
        updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : c.createdAt,
        projectName: typeof c.projectName === "string" ? c.projectName : null,
        presetLabel: typeof c.presetLabel === "string" ? c.presetLabel : null,
        outputName: typeof c.outputName === "string" ? c.outputName : null,
        outputSize: typeof c.outputSize === "number" ? c.outputSize : null,
        error: typeof c.error === "string" ? c.error : null,
        note: typeof c.note === "string" ? c.note : null,
        // Đợt 68 V8 — mục cũ (trước đợt 68) không có field này → null.
        exportDest: typeof c.exportDest === "string" ? c.exportDest : null,
      });
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out.slice(0, JOB_HISTORY_MAX_ENTRIES);
  } catch {
    return [];
  }
}

/** Ghi danh sách lịch sử xuống kho (lỗi kho → bỏ qua, không crash). */
export function persistJobHistory(
  entries: readonly JobHistoryEntry[],
  store: HistoryStore | null = defaultStore(),
): void {
  if (!store) return;
  try {
    store.setItem(JOB_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* localStorage đầy / không dùng được: lịch sử chỉ mất phiên này */
  }
}

/**
 * Ghi một mục vào lịch sử (đọc → upsert → ghi → trả danh sách mới).
 * Đọc lại từ kho mỗi lần nên không kẹt state cũ trong closure poll.
 */
export function recordJobHistory(
  entry: JobHistoryEntry,
  store: HistoryStore | null = defaultStore(),
): JobHistoryEntry[] {
  const next = upsertHistoryEntry(loadJobHistory(store), entry);
  persistJobHistory(next, store);
  return next;
}

/** Xoá một mục khỏi lịch sử đã persist (trả danh sách mới). */
export function removeJobHistory(
  id: string,
  store: HistoryStore | null = defaultStore(),
): JobHistoryEntry[] {
  const next = removeHistoryEntry(loadJobHistory(store), id);
  persistJobHistory(next, store);
  return next;
}

// --- Phiên upload đang bay -------------------------------------------------

/** Phiên upload đang bay (ghi trước POST /api/render, xoá khi có kết quả). */
export interface UploadSession {
  startedAt: number;
  projectName: string | null;
  presetLabel: string | null;
  mediaNames: string[];
}

/**
 * Bắt đầu phiên upload: ghi localStorage NGAY (trước fetch POST) để
 * đóng panel giữa lúc upload thì lần mở sau vẫn thấy session mà chờ.
 * Trả về session đã ghi (startedAt mặc định Date.now()).
 */
export function beginUploadSession(
  meta: {
    startedAt?: number;
    projectName?: string | null;
    presetLabel?: string | null;
    mediaNames?: readonly string[];
  },
  store: HistoryStore | null = defaultStore(),
): UploadSession {
  const session: UploadSession = {
    startedAt: typeof meta.startedAt === "number" ? meta.startedAt : Date.now(),
    projectName: typeof meta.projectName === "string" ? meta.projectName : null,
    presetLabel: typeof meta.presetLabel === "string" ? meta.presetLabel : null,
    mediaNames: [...(meta.mediaNames ?? [])],
  };
  if (store) {
    try {
      store.setItem(UPLOAD_SESSION_KEY, JSON.stringify(session));
    } catch {
      /* kho không ghi được: session mất, lần mở sau về idle như cũ */
    }
  }
  return session;
}

/** Đọc phiên upload đang bay; hỏng / sai dạng → null (về idle). */
export function readUploadSession(
  store: HistoryStore | null = defaultStore(),
): UploadSession | null {
  if (!store) return null;
  try {
    const raw = store.getItem(UPLOAD_SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const c = parsed as Partial<UploadSession>;
    if (typeof c.startedAt !== "number" || c.startedAt <= 0) return null;
    return {
      startedAt: c.startedAt,
      projectName: typeof c.projectName === "string" ? c.projectName : null,
      presetLabel: typeof c.presetLabel === "string" ? c.presetLabel : null,
      mediaNames: Array.isArray(c.mediaNames)
        ? c.mediaNames.filter((m): m is string => typeof m === "string")
        : [],
    };
  } catch {
    return null;
  }
}

/** Xoá phiên upload (POST đã có kết quả / session đã stale / đã nối xong). */
export function clearUploadSession(store: HistoryStore | null = defaultStore()): void {
  if (!store) return;
  try {
    store.removeItem(UPLOAD_SESSION_KEY);
  } catch {
    /* bỏ qua */
  }
}

/**
 * Session stale chưa: quá UPLOAD_SESSION_MAX_AGE_MS từ lúc bắt đầu
 * (tab đã đóng giữa lúc upload / bridge mất job) → lần mở sau xoá
 * ngay, về idle thay vì chờ mù. Session thiếu startedAt → stale.
 */
export function isUploadSessionStale(
  session: UploadSession | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!session || typeof session.startedAt !== "number") return true;
  return now - session.startedAt > UPLOAD_SESSION_MAX_AGE_MS;
}

/**
 * Job bridge mới nhất được tạo từ sau khi upload bắt đầu (mới nhất
 * thắng; createdAt thiếu thì bỏ qua — không đoán). Dung sai
 * UPLOAD_JOB_MATCH_TOLERANCE_MS cho lệch đồng hồ trình duyệt/bridge
 * (cùng máy nên thực tế ~0). null = job của phiên upload chưa xuất
 * hiện (upload vẫn đang bay / đã chết).
 */
export function findJobCreatedAfter(
  jobs: readonly BridgeJobLike[] | null | undefined,
  sinceMs: number,
  toleranceMs: number = UPLOAD_JOB_MATCH_TOLERANCE_MS,
): BridgeJobLike | null {
  if (!jobs) return null;
  let best: BridgeJobLike | null = null;
  for (const j of jobs) {
    if (!j || typeof j.id !== "string" || !j.id) continue;
    if (typeof j.createdAt !== "number") continue;
    if (j.createdAt < sinceMs - toleranceMs) continue;
    if (!best || j.createdAt > (best.createdAt ?? -Infinity)) best = j;
  }
  return best;
}

// --- Chuỗi fragment --------------------------------------------------------

/** Bảng song ngữ cụm lịch sử: `jobHistory.<key>` trong fragment. */
export interface JobHistoryTable {
  vi: Record<string, string>;
  en: Record<string, string>;
}

/** Đọc bảng từ fragment (test có thể truyền bảng riêng). */
export function jobHistoryTable(): JobHistoryTable {
  const f = fragment as unknown as {
    vi?: { jobHistory?: Record<string, string> };
    en?: { jobHistory?: Record<string, string> };
  };
  return {
    vi: (f.vi && f.vi.jobHistory) || {},
    en: (f.en && f.en.jobHistory) || {},
  };
}

/**
 * Một chuỗi của cụm theo key lá + locale; fallback vi khi thiếu key en;
 * trả undefined khi cả hai đều thiếu — caller không bao giờ in key thô.
 */
export function jobHistoryString(
  leafKey: string,
  lang: Lang,
  table: JobHistoryTable = jobHistoryTable(),
): string | undefined {
  const hit = table[lang] && table[lang][leafKey];
  if (typeof hit === "string" && hit.length > 0) return hit;
  const vi = table.vi[leafKey];
  if (typeof vi === "string" && vi.length > 0) return vi;
  return undefined;
}

/** Toàn bộ chuỗi cụm theo locale (thiếu key → "" để component ẩn). */
export function jobHistoryStrings(
  lang: Lang,
  table: JobHistoryTable = jobHistoryTable(),
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of JOB_HISTORY_LEAF_KEYS) {
    out[k] = jobHistoryString(k, lang, table) ?? "";
  }
  return out;
}

/** Ánh xạ trạng thái job → key lá chuỗi trạng thái trong fragment. */
export const HISTORY_STATUS_TO_LEAF_KEY: Readonly<Record<string, string>> = {
  done: "statusDone",
  running: "statusRunning",
  queued: "statusQueued",
  error: "statusError",
  cancelled: "statusCancelled",
  interrupted: "statusInterrupted",
  uploading: "statusUploading",
};

/**
 * Nhãn trạng thái hiển thị cho một mục lịch sử. Mục lỗi upload
 * (kind="upload", chưa từng có job) hiện "Tải lên thất bại" thay vì
 * "Lỗi" chung. Trạng thái lạ → trả chính trạng thái thô (không bao giờ
 * trả key i18n thô ra UI).
 */
export function historyStatusLabel(
  entry: JobHistoryEntry,
  lang: Lang,
  table: JobHistoryTable = jobHistoryTable(),
): string {
  if (entry.kind === "upload" && entry.status === "error") {
    return jobHistoryString("uploadFailed", lang, table) ?? entry.status;
  }
  const leaf = HISTORY_STATUS_TO_LEAF_KEY[entry.status];
  if (leaf) {
    const s = jobHistoryString(leaf, lang, table);
    if (s) return s;
  }
  return entry.status;
}
