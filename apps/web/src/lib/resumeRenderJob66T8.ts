/**
 * resumeRenderJob66T8.ts — Resume job render khi mở lại ExportPanel
 * (Phase 9 đợt 66, luồng T8 — đóng nợ đợt 65 S10 / ROUND65_LIMITS §8.7:
 * "Mở lại ExportPanel không resume job đang chạy — thiếu tính năng resume").
 *
 * Vấn đề cũ (R8 §3, S10 H7): `jobId` chỉ là state của component nên
 * đóng modal là mất — mở lại panel về idle dù bridge vẫn đang render.
 * Nay panel mount → `GET /api/render` (mới nhất trước) → nối lại job:
 *   - job `running`/`queued` mới nhất → theo dõi tiếp (progress/ETA/
 *     queue/note qua poll 1s như job vừa bấm Xuất);
 *   - không có job active thì job `error`/`interrupted` mới nhất →
 *     hiện trạng thái lỗi + note phục hồi + nút "Render lại"
 *     (POST /api/render/:id/retry, endpoint bridge đã có từ trước);
 *   - còn lại (done/cancelled/không có job) → panel mở idle như cũ
 *     (job done không resume — đúng thiết kế R8 §5.2: lịch sử job là
 *     việc riêng; job đã huỷ thì không có gì để nối).
 *
 * Cách đọc chuỗi (đúng mẫu lib/gpuProbe65S4.ts đợt 65 S4): fragment
 * round66-t8 được import trực tiếp lúc chạy nên chuỗi en hiện ngay,
 * không chờ parent gộp dict vào vi.json/en.json. Key đầy đủ
 * `exportPanel.resumedJob` / `exportPanel.retryRender` xuất hiện
 * nguyên văn trong RESUME_JOB_KEYS dưới đây nên scan tĩnh thấy là đã
 * tiêu thụ; parent gộp fragment vào dict thì không collision (key mới
 * hoàn toàn). Không bao giờ trả key thô ra UI: thiếu key → rớt về vi
 * → rớt về "" (component ẩn khối khi không có chuỗi).
 */
import fragment from "../i18n/fragments/round66-t8.json";
import type { Lang } from "../i18n";

/**
 * Toàn bộ key của cụm này — KHỚP 1:1 với fragment round66-t8
 * (vi + en, chuỗi không rỗng, vi khác en).
 * Khai đầy đủ dạng literal để scan tĩnh thấy key đã tiêu thụ.
 */
export const RESUME_JOB_KEYS: readonly string[] = [
  "exportPanel.resumedJob",
  "exportPanel.retryRender",
];

/** Key lá (không tiền tố) trong bảng fragment `exportPanel.*`. */
export const RESUME_JOB_LEAF_KEYS: readonly string[] = [
  "resumedJob",
  "retryRender",
];

/** Trạng thái job bridge (jobQueue.js KNOWN_STATUSES). */
export type RenderJobStatus =
  | "queued"
  | "running"
  | "done"
  | "error"
  | "cancelled"
  | "interrupted";

/**
 * Dạng tối thiểu của publicJob mà panel cần để quyết định resume
 * (mọi field đều có trong `GET /api/render` — xem publicJob.js).
 * Index signature cho phép field phụ (attempts, outputName, ...) đi
 * kèm mà không cần khai lại.
 */
export interface ResumableRenderJob {
  id: string;
  status: string;
  progress?: number;
  etaSeconds?: number | null;
  queuePosition?: number | null;
  note?: string | null;
  noteCode?: string | null;
  error?: string | null;
  errorCode?: string | null;
  createdAt?: number;
  [k: string]: unknown;
}

/** Job đang chạy/xếp hàng → nối lại theo dõi tiếp. */
export function isActiveRenderStatus(
  status: string | null | undefined,
): boolean {
  return status === "running" || status === "queued";
}

/**
 * Job lỗi/gián đoạn — trạng thái cuối nhưng retry được qua
 * `POST /api/render/:id/retry` (jobQueue.retry chỉ nhận error /
 * interrupted; xem server/bridge/src/index.js).
 */
export function isRetryableRenderStatus(
  status: string | null | undefined,
): boolean {
  return status === "error" || status === "interrupted";
}

/**
 * Sắp mới nhất trước theo createdAt desc. Thiếu createdAt thì giữ
 * thứ tự list gốc (server `list()` đã sort mới nhất trước, xem
 * jobQueue.js — sort ổn định nên bằng nhau không đảo thứ tự).
 */
function newestFirst(
  jobs: readonly ResumableRenderJob[],
): ResumableRenderJob[] {
  return [...jobs].sort((a, b) => {
    const ca = typeof a.createdAt === "number" ? a.createdAt : -Infinity;
    const cb = typeof b.createdAt === "number" ? b.createdAt : -Infinity;
    if (cb !== ca) return cb - ca;
    return 0;
  });
}

/** Job active (running/queued) mới nhất, null nếu không có. */
export function findResumableJob(
  jobs: readonly ResumableRenderJob[] | null | undefined,
): ResumableRenderJob | null {
  if (!jobs) return null;
  for (const j of newestFirst(jobs)) {
    if (j && typeof j.id === "string" && j.id && isActiveRenderStatus(j.status)) {
      return j;
    }
  }
  return null;
}

/** Job retryable (error/interrupted) mới nhất, null nếu không có. */
export function findRetryableJob(
  jobs: readonly ResumableRenderJob[] | null | undefined,
): ResumableRenderJob | null {
  if (!jobs) return null;
  for (const j of newestFirst(jobs)) {
    if (j && typeof j.id === "string" && j.id && isRetryableRenderStatus(j.status)) {
      return j;
    }
  }
  return null;
}

/**
 * Ứng viên resume khi mở panel: ưu tiên job active mới nhất (dù có
 * job retryable mới hơn — job đang chạy quan trọng hơn job đã lỗi);
 * không có active thì job retryable mới nhất; còn lại null → panel
 * mở idle như cũ.
 */
export function pickResumeCandidate(
  jobs: readonly ResumableRenderJob[] | null | undefined,
): { kind: "active" | "retryable"; job: ResumableRenderJob } | null {
  const active = findResumableJob(jobs);
  if (active) return { kind: "active", job: active };
  const retryable = findRetryableJob(jobs);
  if (retryable) return { kind: "retryable", job: retryable };
  return null;
}

/** Bảng song ngữ cụm resume: `exportPanel.<key>` trong fragment. */
export interface ResumeJobTable {
  vi: Record<string, string>;
  en: Record<string, string>;
}

/** Đọc bảng từ fragment (test có thể truyền bảng riêng). */
export function resumeJobTable(): ResumeJobTable {
  const f = fragment as unknown as {
    vi?: { exportPanel?: Record<string, string> };
    en?: { exportPanel?: Record<string, string> };
  };
  return {
    vi: (f.vi && f.vi.exportPanel) || {},
    en: (f.en && f.en.exportPanel) || {},
  };
}

/**
 * Một chuỗi của cụm theo key lá + locale; fallback vi khi thiếu key en;
 * trả undefined khi cả hai đều thiếu — caller không bao giờ in key thô.
 */
export function resumeJobString(
  leafKey: string,
  lang: Lang,
  table: ResumeJobTable = resumeJobTable(),
): string | undefined {
  const hit = table[lang] && table[lang][leafKey];
  if (typeof hit === "string" && hit.length > 0) return hit;
  const vi = table.vi[leafKey];
  if (typeof vi === "string" && vi.length > 0) return vi;
  return undefined;
}

/** Toàn bộ chuỗi cụm theo locale (thiếu key → "" để component ẩn). */
export function resumeJobStrings(
  lang: Lang,
  table: ResumeJobTable = resumeJobTable(),
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of RESUME_JOB_LEAF_KEYS) {
    out[k] = resumeJobString(k, lang, table) ?? "";
  }
  return out;
}
