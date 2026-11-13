/**
 * exportDest68V8.ts — Đích export .mp4 bền qua reopen + kiểm tra download
 * được trước khi hiện nút tải (Phase 9 đợt 68, luồng V8 — đóng 2 nợ mở
 * của đợt 67 U7 / ROUND67_LIMITS §5 mục 1–2):
 *
 * 1. ĐÍCH EXPORT BỀN QUA REOPEN (nợ U7 §5.1): trước đây `exportDest` chỉ
 *    là state của ExportPanel — đóng panel/app là mất; mở lại job done từ
 *    lịch sử trong Electron thì "Tải MP4" rớt về anchor download thay vì
 *    ghi thẳng ra đích đã chọn. Nay đích được ghi theo jobId vào chính kho
 *    lịch sử job đã có (`vcut.jobHistory.v1`, field `exportDest` trên
 *    JobHistoryEntry — xem jobHistory67U7.ts): startRender ghi lúc POST
 *    xong, upsert GIỮ đích cũ khi mục mới từ bridge không mang đích, mở
 *    lại từ lịch sử / resume lúc mount thì khôi phục vào state exportDest.
 *    Không phát minh store mới: dùng đúng cơ chế persist đã có (cùng
 *    localStorage đó — trong Electron, localStorage của origin app://vcut
 *    đã bền qua restart app, như `vcut-lang` của G5). Web thường không
 *    có đích (null) nên hành vi tải qua anchor không đổi.
 *
 * 2. KIỂM TRA DOWNLOAD TRƯỚC KHI HIỆN NÚT (nợ U7 §5.2): trước đây job
 *    done mà file output đã mất (bridge đã dọn thư mục job) thì nút tải
 *    vẫn mở anchor `GET /api/render/:id/download` và trình duyệt nhận
 *    JSON lỗi 409 JOB_NOT_DONE. Nay panel HEAD endpoint mới của bridge
 *    (`HEAD /api/render/:id/download`, xem server/bridge/src/index.js)
 *    khi job về done: 200 = còn tải được → hiện nút; 404/409 = output đã
 *    mất → KHÔNG hiện nút, báo rõ + cho xoá khỏi lịch sử; lỗi mạng khác
 *    (bridge chưa lên / fetch throw) → "unknown", UI giữ hành vi cũ
 *    (hiện nút) để lỗi thoáng qua không khoá hẳn nút tải — ghi rõ trong
 *    LIMITS.
 *
 * Cách đọc chuỗi (đúng mẫu lib/jobHistory67U7.ts đợt 67 U7):
 * fragment round68-v8 được import trực tiếp lúc chạy nên chuỗi en hiện
 * ngay, không chờ parent gộp dict vào vi.json/en.json. Key đầy đủ
 * `exportDest.<leaf>` xuất hiện nguyên văn trong EXPORT_DEST_KEYS nên
 * scan tĩnh thấy là đã tiêu thụ; parent gộp fragment vào dict thì
 * không collision (namespace `exportDest.*` mới hoàn toàn). Không bao
 * giờ trả key thô ra UI: thiếu key → rớt về vi → rớt về "" (component
 * ẩn khối khi không có chuỗi).
 */
import fragment from "../i18n/fragments/round68-v8.json";
import type { Lang } from "../i18n";
import type { JobHistoryEntry } from "./jobHistory67U7";

/**
 * Toàn bộ key của cụm này — KHỚP 1:1 với fragment round68-v8
 * (vi + en, chuỗi không rỗng, vi khác en).
 * Khai đầy đủ dạng literal để scan tĩnh thấy key đã tiêu thụ.
 */
export const EXPORT_DEST_KEYS: readonly string[] = [
  "exportDest.checking",
  "exportDest.missing",
  "exportDest.deleteFromHistory",
  "exportDest.savedTo",
];

/** Key lá (không tiền tố) trong bảng fragment `exportDest.*`. */
export const EXPORT_DEST_LEAF_KEYS: readonly string[] = [
  "checking",
  "missing",
  "deleteFromHistory",
  "savedTo",
];

// --- 1. Kiểm tra download được (HEAD /api/render/:id/download) -------------

/** Kết quả kiểm tra download: còn tải được / output đã mất / không rõ
 *  (lỗi mạng, bridge chưa lên — UI giữ hành vi cũ, hiện nút). */
export type DownloadAvailability = "available" | "missing" | "unknown";

/** Kiểu fetch tối thiểu mà hàm kiểm tra cần (test inject stub). */
export interface DownloadCheckFetch {
  (url: string, init?: { method?: string }): Promise<{ status: number; ok: boolean }>;
}

/**
 * HEAD `${bridgeUrl}/api/render/${jobId}/download` để xác nhận file output
 * còn tồn tại TRƯỚC khi hiện nút tải. 200 → available; 404 (job đã bị
 * dọn) / 409 (job chưa xong hoặc output đã mất) → missing; mọi trạng thái
 * khác hoặc fetch throw (bridge chưa lên / mất mạng) → unknown.
 * Không bao giờ throw — caller luôn nhận được 1 trong 3 trạng thái.
 */
export async function checkDownloadAvailable(
  bridgeUrl: string,
  jobId: string,
  fetchImpl: DownloadCheckFetch = fetch,
): Promise<DownloadAvailability> {
  if (!bridgeUrl || !jobId) return "unknown";
  const url = `${bridgeUrl.replace(/\/+$/, "")}/api/render/${encodeURIComponent(jobId)}/download`;
  try {
    const res = await fetchImpl(url, { method: "HEAD" });
    if (res.status === 200) return "available";
    if (res.status === 404 || res.status === 409) return "missing";
    return "unknown";
  } catch {
    return "unknown";
  }
}

// --- 2. Tìm đích đã lưu của một job trong lịch sử ----------------------------

/**
 * Đích .mp4 đã lưu cho jobId (đường dẫn tuyệt đối, Electron) hoặc null
 * (web thường / job chưa từng chọn đích / mục không có trong lịch sử).
 * Đọc từ danh sách lịch sử đã load — không chạm storage trực tiếp.
 */
export function findHistoryExportDest(
  entries: readonly JobHistoryEntry[] | null | undefined,
  jobId: string | null | undefined,
): string | null {
  if (!entries || !jobId) return null;
  const found = entries.find((e) => e.jobId === jobId || e.id === jobId);
  if (!found || typeof found.exportDest !== "string" || !found.exportDest) return null;
  return found.exportDest;
}

// --- Chuỗi fragment --------------------------------------------------------

/** Bảng song ngữ cụm đích export: `exportDest.<key>` trong fragment. */
export interface ExportDestTable {
  vi: Record<string, string>;
  en: Record<string, string>;
}

/** Đọc bảng từ fragment (test có thể truyền bảng riêng). */
export function exportDestTable(): ExportDestTable {
  const f = fragment as unknown as {
    vi?: { exportDest?: Record<string, string> };
    en?: { exportDest?: Record<string, string> };
  };
  return {
    vi: (f.vi && f.vi.exportDest) || {},
    en: (f.en && f.en.exportDest) || {},
  };
}

/**
 * Một chuỗi của cụm theo key lá + locale; fallback vi khi thiếu key en;
 * trả undefined khi cả hai đều thiếu — caller không bao giờ in key thô.
 */
export function exportDestString(
  leafKey: string,
  lang: Lang,
  table: ExportDestTable = exportDestTable(),
): string | undefined {
  const hit = table[lang] && table[lang][leafKey];
  if (typeof hit === "string" && hit.length > 0) return hit;
  const vi = table.vi[leafKey];
  if (typeof vi === "string" && vi.length > 0) return vi;
  return undefined;
}

/** Toàn bộ chuỗi cụm theo locale (thiếu key → "" để component ẩn). */
export function exportDestStrings(
  lang: Lang,
  table: ExportDestTable = exportDestTable(),
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of EXPORT_DEST_LEAF_KEYS) {
    out[k] = exportDestString(k, lang, table) ?? "";
  }
  return out;
}
