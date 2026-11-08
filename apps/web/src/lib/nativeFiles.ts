/**
 * nativeFiles.ts — phần file native còn thiếu của web app khi chạy trong
 * Electron (Phase 10, G4).
 *
 * PHẠM VI (sau khi đối chiếu với desktop.ts của G5, 06/11): G5 đã làm
 * cầu nối menu ↔ renderer (open/save project, mở file từ hệ thống,
 * menu-action, đồng bộ ngôn ngữ) ở apps/web/src/desktop.ts — G4 KHÔNG
 * làm lại những thứ đó. File này chỉ giữ phần G5 chưa có:
 *   1. importMediaNative — nút Thêm media dùng dialog hệ thống chọn
 *      nhiều file (desktop.ts chỉ có openMediaFromPath cho 1 đường dẫn
 *      từ menu);
 *   2. pickExportDestinationNative + saveExportNative — chọn đích .mp4
 *      TRƯỚC khi render rồi lưu MP4 đã render xong (desktop.ts chỉ mở
 *      panel Xuất, không lưu ra đường dẫn hệ thống);
 *   3. initNativeDrop — kéo-thả file từ file manager vào cửa sổ
 *      (desktop.ts không có).
 *
 * Renderer KHÔNG bao giờ thấy fs: mọi đường dẫn/bytes đi qua
 * `window.vcutDesktop` (preload). Khi chạy ngoài Electron (trình duyệt
 * thường), mọi hàm native trả false/no-op và UI dùng flow web cũ.
 */
import { useStore } from "../store";
import { pushToast } from "./toast";
import { t } from "../i18n";
import {
  confirmDiscardProject,
  openArchiveFileFlow,
  openProjectFileFlow,
} from "./openProjectFlow";

/** Giới hạn tổng khi import nhiều media qua IPC (mỗi file đã bị chặn 2 GiB ở main). */
export const MAX_MEDIA_TOTAL_BYTES = 4 * 1024 * 1024 * 1024;

export function isNativeDesktop(): boolean {
  const api = (window as unknown as { vcutDesktop?: unknown }).vcutDesktop;
  return (
    typeof api === "object" &&
    api !== null &&
    typeof (api as { readProjectFile?: unknown }).readProjectFile === "function"
  );
}

function desktopApi(): NonNullable<Window["vcutDesktop"]> | null {
  return isNativeDesktop() ? (window.vcutDesktop as NonNullable<Window["vcutDesktop"]>) : null;
}

function isProjectPath(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return lower.endsWith(".vcut") || lower.endsWith(".vcut.json") || lower.endsWith(".json");
}

function isArchivePath(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return lower.endsWith(".vcut.zip") || lower.endsWith(".zip");
}

function isMediaPath(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return (
    ["mp4", "mov", "webm", "mkv", "avi", "mp3", "wav", "ogg", "flac", "png", "jpg", "jpeg", "webp", "gif"].includes(
      ext,
    )
  );
}

function baseName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath;
}

function safeExportFileName(projectName: string): string {
  // Bỏ dấu tiếng Việt (đ → d) thay vì xoá ký tự có dấu — khớp
  // toSafeFileBase bên apps/desktop/src/native-files.ts.
  const ascii = (projectName || "project")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
  const safe = ascii.replace(/[^\w\- ]+/g, "").trim();
  return `${safe || "project"}.mp4`;
}

/** Import media: dialog chọn nhiều file → đọc bytes ở main → importFiles hiện có. */
export async function importMediaNative(): Promise<boolean> {
  const api = desktopApi();
  if (!api) return false;
  const paths = await api.openMediaDialog();
  if (!paths || paths.length === 0) return false; // User bấm Huỷ.
  const files: File[] = [];
  let totalBytes = 0;
  const errors: string[] = [];
  for (const p of paths) {
    const res = await api.readMediaFile(p);
    if (!res.ok) {
      errors.push(`${baseName(p)}: ${res.error}`);
      continue;
    }
    totalBytes += res.size;
    if (totalBytes > MAX_MEDIA_TOTAL_BYTES) {
      errors.push(t("nativeFiles.importTooBig"));
      break;
    }
    files.push(new File([res.data], res.name, { type: res.mime }));
  }
  if (errors.length > 0) {
    pushToast(t("nativeFiles.importError", { errors: errors.join("; ") }), "error");
  }
  if (files.length === 0) return false;
  await useStore.getState().importFiles(files);
  pushToast(t("nativeFiles.importDone", { count: String(files.length) }), "success");
  return true;
}

/**
 * Xuất video (native): dialog chọn đích .mp4 TRƯỚC khi render — huỷ thì
 * không bắt đầu render (caller kiểm tra null). Sau khi render xong,
 * gọi saveExportNative(jobId, destPath) để main stream MP4 về đích.
 */
export async function pickExportDestinationNative(): Promise<string | null> {
  const api = desktopApi();
  if (!api) return null;
  const st = useStore.getState();
  const dest = await api.saveVideoDialog(safeExportFileName(st.spec.meta.name));
  return dest ?? null;
}

/** Lưu MP4 đã render xong (jobId) ra đường dẫn đích đã chọn trước đó. */
export async function saveExportNative(jobId: string, destPath: string): Promise<boolean> {
  const api = desktopApi();
  if (!api) return false;
  const res = await api.saveExportFile(jobId, destPath);
  if (!res.ok) {
    pushToast(t("nativeFiles.exportError", { error: res.error }), "error");
    return false;
  }
  pushToast(t("nativeFiles.exportDone", { path: destPath }), "success");
  return true;
}

/**
 * Kéo-thả file từ file manager vào cửa sổ (desktop.ts của G5 không có).
 *
 * Chỉ chặn khi dataTransfer có File (kéo từ file manager); kéo nội bộ
 * Timeline/MediaBin dùng data `text/media-id`, không có File nên đi qua
 * như cũ, không bị chặn. File thả vào được nạp/import ngay bằng flow
 * hiện có (File đã mang bytes, không cần IPC).
 */
export function initNativeDrop(): () => void {
  const api = desktopApi();
  if (!api) return () => undefined;

  const onDragOver = (e: DragEvent) => {
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };
  const onDrop = (e: DragEvent) => {
    if (!e.dataTransfer || e.dataTransfer.files.length === 0) return;
    e.preventDefault();
    const files = [...e.dataTransfer.files];
    void (async () => {
      const projectFile = files.find((f) => isProjectPath(f.name) || isArchivePath(f.name));
      if (projectFile) {
        if (!confirmDiscardProject()) return;
        const ok = isArchivePath(projectFile.name)
          ? await openArchiveFileFlow(projectFile)
          : await openProjectFileFlow(projectFile);
        if (ok) {
          // File thả từ file manager có `.path` trong Electron.
          const droppedPath = (projectFile as File & { path?: string }).path;
          if (droppedPath) {
            void api.noteProjectOpened(droppedPath).catch(() => undefined);
          }
        }
        return;
      }
      const mediaFiles = files.filter((f) => isMediaPath(f.name));
      if (mediaFiles.length > 0) {
        await useStore.getState().importFiles(mediaFiles);
        pushToast(t("nativeFiles.importDone", { count: String(mediaFiles.length) }), "success");
      }
    })();
  };
  window.addEventListener("dragover", onDragOver);
  window.addEventListener("drop", onDrop);
  return () => {
    window.removeEventListener("dragover", onDragOver);
    window.removeEventListener("drop", onDrop);
  };
}
