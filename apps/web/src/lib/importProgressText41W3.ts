/**
 * importProgressText41W3.ts — Phase 9 đợt 41, luồng W3.
 *
 * Định dạng văn bản tiến trình cho MỘT sự kiện `importFiles` dùng chung
 * cho mọi panel gọi `importFiles` ngoài MediaBin (ExportPanel reframe,
 * StickerPanel APNG, ProjectMenu nhập bản nén, TtsButton, BgRemovePanel,
 * TemplatePackModal). Dùng đúng key i18n `importProgress.*` mà đợt 40
 * V5 đã thêm cho MediaBin (đủ vi + en, không thêm key mới) nên ngữ
 * nghĩa pha/% giữ nguyên: % chỉ thật ở pha hashing; pha storing chỉ
 * báo "đang ghi — không có %", không nội suy; pha done chỉ báo đã lưu.
 *
 * MediaBin KHÔNG dùng helper này (giữ nguyên code V5 đã click-test) —
 * sự trùng lặp nhỏ này là cố ý để khỏi đụng vào đường đã chứng minh.
 * Hàm thuần, không chạm DOM/store nên test được bằng unit test.
 */
import {
  formatBytes,
  ingestPercent,
  type ImportFileProgressEvent,
} from "./ingestProgress39T5";

/** Kiểu của hàm dịch `t(key, vars)` trong `apps/web/src/i18n`. */
export type ImportProgressTranslator = (
  key: string,
  vars?: Record<string, string>,
) => string;

export function formatImportProgressText(
  ev: ImportFileProgressEvent,
  tr: ImportProgressTranslator,
): string {
  const base = {
    index: String(ev.fileIndex + 1),
    count: String(ev.fileCount),
    name: ev.fileName,
  };
  if (ev.phase === "hashing") {
    return tr("importProgress.hashing", {
      ...base,
      done: formatBytes(ev.bytesDone),
      total: formatBytes(ev.totalBytes),
      percent: String(ingestPercent(ev)),
    });
  }
  if (ev.phase === "storing") {
    return tr("importProgress.storing", {
      ...base,
      total: formatBytes(ev.totalBytes),
    });
  }
  return tr("importProgress.done", {
    ...base,
    total: formatBytes(ev.totalBytes),
  });
}
