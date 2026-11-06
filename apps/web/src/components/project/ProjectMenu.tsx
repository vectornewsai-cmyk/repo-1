/**
 * ProjectMenu — Mới / Mở / Lưu / Lưu thành + chỉ báo autosave.
 *
 * Đặt trong TopBar. Mọi thao tác hỏi xác nhận trước khi bỏ thay đổi chưa lưu.
 */
import { useEffect, useReducer, useRef, useState } from "react";
import { useStore } from "../../store";
import {
  autosave,
  clearAutosave,
  getLastAutosaveAt,
  isDirty,
  loadProject,
  markSaved,
  saveProject,
} from "../../lib/projectRepo";
import {
  ARCHIVE_EXT,
  downloadArchive,
  exportArchive,
  importArchive,
} from "../../lib/archive";
import { pushToast } from "../../lib/toast";
// Đợt 37 T3: rehydrate cho đường mở file .vcut.json (cùng cơ chế với
// đường khôi phục autosave ở App.tsx, đợt 36 S5).
import { AssetStore } from "../../lib/assetStore";
import { rehydrateMediaItems } from "../../lib/rehydrate36S5";
import { t } from "../../i18n";
import { formatImportProgressText } from "../../lib/importProgressText41W3";
import type { ImportFileProgressEvent } from "../../lib/ingestProgress39T5";
// Đợt 27 K5 (load report): chỉ 3 dòng ghi/xoá báo cáo lần load gần
// nhất — không đổi luồng mở/lưu, không reformat file.
import {
  buildLoadReport,
  clearLastLoadReport,
  formatNoteLines,
  formatStructuredNote,
  formatWarningTranslated,
  setLastLoadReport,
  type LoadReport,
} from "../../lib/loadReport";
import { HistoryPanel } from "./HistoryPanel";
import {
  getCurrentProjectId,
  getHistoryStore,
  rotateProjectId,
  setProjectIdForFile,
} from "../../lib/projectHistory";

/**
 * Đợt 31 N4 — lưu project hiện tại thành file. Trả về kết quả có cấu
 * trúc của saveProject (structuredNotes: code + tham số) kèm warnings
 * chuỗi cũ để tương thích. Caller dịch qua formatNoteLines (App dùng
 * chung cho Ctrl+S).
 */
export function saveCurrentProject(): {
  warnings: string[];
  structuredNotes: { code: string; params: Record<string, string>; fallback: string }[];
} {
  const st = useStore.getState();
  return saveProject(st.spec, st.spec.meta.name);
}

/**
 * Đợt 31 N4 — các dòng lưu ý sau khi LƯU FILE, đã dịch theo locale
 * hiện tại (structuredNotes qua key `structuredNotes.*`, chuỗi lẻ còn
 * lại giữ nguyên, không trùng lặp nhờ formatNoteLines). App dùng chung
 * cho Ctrl+S; nút Lưu trong menu tự push toast bằng key loadNotes.
 */
export function saveNotesLines(
  result: { warnings: string[]; structuredNotes: { code: string; params: Record<string, string>; fallback: string }[] },
): string[] {
  return formatNoteLines(result.structuredNotes, result.warnings, (k, vars) => t(k, vars));
}

/**
 * Đợt 30 M4 — toast lưu ý sau khi MỞ FILE / NHẬP BẢN NÉN, dịch theo
 * locale hiện tại. Đợt 31 N4: các lưu ý blob/migration/format/style
 * nay cũng dịch được qua structuredNotes (formatStructuredNote, nhóm
 * key `structuredNotes.*`); đợt 32 O4 thiếu media của archive cũng đã
 * có dạng cấu trúc nên otherWarnings chỉ còn chuỗi lẻ thật sự. Câu tràn
 * 100 dùng key loadReport.atCap. Caller nên tái dùng chính report này
 * cho setLastLoadReport để toast và panel khớp nhau.
 */
function warnListReport(report: LoadReport): void {
  const lines = [
    ...report.warnings.map((w) => formatWarningTranslated(w, (k, vars) => t(k, vars))),
    ...report.structuredNotes.map((n) => formatStructuredNote(n, (k, vars) => t(k, vars))),
    ...report.otherWarnings,
  ];
  if (report.atCap) lines.push(t("loadReport.atCap"));
  if (lines.length > 0) {
    pushToast(t("projectMenu.loadNotes", { notes: lines.join("; ") }), "info");
  }
}

export function ProjectMenu() {
  const spec = useStore((s) => s.spec);
  const fileRef = useRef<HTMLInputElement>(null);
  const archiveRef = useRef<HTMLInputElement>(null);
  // làm mới indicator định kỳ (autosave/dirty thay đổi ngoài React render cycle)
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const id = setInterval(force, 2000);
    return () => clearInterval(id);
  }, []);

  const dirty = isDirty(spec);
  const lastAuto = getLastAutosaveAt();
  const [showHistory, setShowHistory] = useState(false);
  // Đợt 41 W3 — tiến trình importFiles của media trong bản nén (như MediaBin V5).
  const [importProgress, setImportProgress] = useState<ImportFileProgressEvent | null>(null);

  const confirmDiscard = (): boolean => {
    const st = useStore.getState();
    if (!isDirty(st.spec)) return true;
    return window.confirm("Có thay đổi chưa lưu thành file. Bỏ thay đổi và tiếp tục?");
  };

  const doNew = () => {
    if (!confirmDiscard()) return;
    const st = useStore.getState();
    st.newProject();
    rotateProjectId(); // project mới → chuỗi lịch sử mới (Q7)
    clearAutosave();
    clearLastLoadReport(); // Đợt 27 K5: project mới không còn "lần load gần nhất".
    markSaved(useStore.getState().spec);
    force();
  };

  const doOpen = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng file
    if (!f) return;
    if (!confirmDiscard()) return;
    const res = await loadProject(f);
    if (!res.ok || !res.spec) {
      // Đợt 31 N4: tiền tố qua key, chi tiết lỗi giữ nguyên (cùng mẫu
      // errorDetail của bridge — nội dung lỗi là dữ liệu, không dịch).
      pushToast(t("projectMenu.openFileError", { errors: res.errors.join("; ") }), "error");
      return;
    }
    const st = useStore.getState();
    st.replaceProject(res.spec);
    st.setProjectName(res.name);
    setProjectIdForFile(f.name, res.spec); // mở lại cùng file → tiếp tục chuỗi lịch sử (Q7)
    markSaved(res.spec);
    clearAutosave();
    autosave(res.spec, res.name); // ghi ngay để reload khôi phục đúng project vừa mở
    // Đợt 37 T3: nạp lại media bin từ AssetStore TRƯỚC checkMissingMedia
    // (thứ tự y hệt đường khôi phục autosave ở App.tsx, đợt 36 S5):
    // project .vcut.json có src `asset:` hoặc tên thô đã ingest nay mở
    // được ngay, không hiện Relink oan. Fail-soft như đường autosave —
    // IndexedDB bị chặn thì bin rỗng và Relink báo như hành vi cũ.
    // Không phá đường autosave: khối này chỉ chạy ở đường mở file.
    try {
      const assetStore = new AssetStore();
      const rehydrated = await rehydrateMediaItems(
        {
          listManifests: () => assetStore.list(),
          loadBlob: (id) => assetStore.getBlob(id),
          makeObjectURL: (blob) => URL.createObjectURL(blob),
        },
        res.spec,
      );
      if (rehydrated.items.length > 0) st.restoreMediaBin(rehydrated.items);
    } catch {
      // IndexedDB không khả dụng → giữ bin rỗng, Relink báo như cũ.
    }
    st.checkMissingMedia(); // R1-033: hiện panel relink nếu media thiếu
    // Đợt 30 M4: toast dịch từ báo cáo có cấu trúc (thay warnList
    // chuỗi thô) + giữ báo cáo để panel xem lại sau khi toast đóng.
    // Dùng chung một report cho cả hai để toast và panel khớp nhau.
    const fileReport = buildLoadReport(res, "file", res.name);
    warnListReport(fileReport);
    setLastLoadReport(fileReport);
    force();
  };

  const doSave = () => {
    // Đợt 31 N4: toast lưu ý đã dịch qua structuredNotes (thay warnList
    // chuỗi thô của đợt 30 M4); không có lưu ý thì không hiện toast,
    // giữ hành vi cũ của nút Lưu trong menu.
    const lines = saveNotesLines(saveCurrentProject());
    if (lines.length > 0) {
      // K5: toast thay window.alert (không chặn luồng làm việc).
      pushToast(t("projectMenu.loadNotes", { notes: lines.join("; ") }), "info");
    }
    // Q7: lưu file cũng snapshot lịch sử (best-effort, trùng hash thì tự bỏ qua).
    void getHistoryStore()
      .saveVersion(getCurrentProjectId(), useStore.getState().spec, "")
      .catch(() => { /* lịch sử lỗi không được làm hỏng thao tác lưu */ });
    force();
  };

  const doSaveAs = () => {
    const st = useStore.getState();
    const name = window.prompt("Tên dự án", st.spec.meta.name);
    if (name === null) return; // bấm Cancel
    st.setProjectName(name.trim().length > 0 ? name.trim() : "Dự án không tên");
    doSave();
  };

  /** Xuất project + media thành file .vcut.zip (archive portable). */
  const doExportArchive = async () => {
    const st = useStore.getState();
    // Gom file gốc từ media pool: tên khớp `src` trong spec.
    const mediaSources = st.media
      .filter((m) => m.file)
      .map((m) => ({ name: m.name, data: m.file as File }));
    const res = await exportArchive(st.spec, st.spec.meta.name, mediaSources);
    if (!res.ok || !res.blob) {
      // Đợt 31 N4: như toast lỗi mở file — tiền tố qua key, chi tiết giữ nguyên.
      pushToast(t("projectMenu.exportArchiveError", { errors: res.errors.join("; ") }), "error");
      return;
    }
    downloadArchive(res.blob, st.spec.meta.name);
    const sizeMB = (res.stats.zipBytes / 1024 / 1024).toFixed(1);
    // Đợt 31 N4: câu hoàn tất + lưu ý qua key; đợt 32 O4 chuỗi thiếu
    // media cũng đã có dạng cấu trúc (archiveMissingExport) nên dịch
    // qua formatNoteLines, không còn chuỗi thô trong phần lưu ý.
    const noteLines = formatNoteLines(res.structuredNotes ?? [], res.warnings, (k, vars) => t(k, vars));
    const msg =
      t("projectMenu.exportArchiveDone", { media: String(res.stats.mediaFiles), size: sizeMB }) +
      (noteLines.length > 0 ? " " + t("projectMenu.exportArchiveNotes", { notes: noteLines.join("; ") }) : "");
    pushToast(msg, "success");
  };

  /** Nhập file .vcut.zip: giải nén → load project + media vào editor. */
  const doImportArchive = () => archiveRef.current?.click();

  const onArchiveFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng file
    if (!f) return;
    if (!confirmDiscard()) return;
    const res = await importArchive(f);
    if (!res.ok || !res.spec) {
      // Đợt 31 N4: như toast lỗi mở file — tiền tố qua key, chi tiết giữ nguyên.
      pushToast(t("projectMenu.importArchiveError", { errors: res.errors.join("; ") }), "error");
      return;
    }
    const st = useStore.getState();
    st.newProject(); // xoá project cũ (media blob URL cũ không bền vững)
    st.replaceProject(res.spec);
    st.setProjectName(res.name);
    if (res.mediaFiles.length > 0) {
      await st.importFiles(res.mediaFiles, (ev) => setImportProgress(ev));
      setImportProgress(null);
    }
    markSaved(res.spec);
    clearAutosave();
    autosave(res.spec, res.name);
    // Đợt 30 M4: như đường mở file — toast dịch từ báo cáo có cấu
    // trúc, dùng chung report với panel.
    const archiveReport = buildLoadReport(res, "archive", res.name);
    warnListReport(archiveReport);
    setLastLoadReport(archiveReport);
    force();
  };

  return (
    <div className="project-menu">
      <button title="Tạo dự án mới" onClick={doNew}>
        🆕 Mới
      </button>
      <button title="Mở file dự án (.vcut.json)" onClick={doOpen}>
        📂 Mở
      </button>
      <button title="Lưu thành file (Ctrl+S)" onClick={doSave}>
        💾 Lưu
      </button>
      <button title="Lưu thành tên khác" onClick={doSaveAs}>
        💾 Lưu thành…
      </button>
      <button
        title="Xuất project + media thành 1 file nén (.vcut.zip) — mang đi máy khác"
        onClick={() => void doExportArchive()}
      >
        📦 Xuất bản nén
      </button>
      <button
        title="Nhập file bản nén (.vcut.zip) — khôi phục project + media"
        onClick={doImportArchive}
      >
        📥 Nhập bản nén
      </button>
      <button
        title="Lịch sử phiên bản project (lưu local, chưa đồng bộ cloud)"
        onClick={() => setShowHistory((v) => !v)}
      >
        🕘 Lịch sử
      </button>
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      <input
        ref={fileRef}
        type="file"
        accept=".vcut.json,.json,application/json"
        style={{ display: "none" }}
        onChange={(e) => void onFile(e)}
      />
      <input
        ref={archiveRef}
        type="file"
        accept={ARCHIVE_EXT + ",.zip,application/zip"}
        style={{ display: "none" }}
        onChange={(e) => void onArchiveFile(e)}
      />
      {importProgress && (
        <span role="status" data-import-progress={importProgress.phase} style={{ fontSize: 12 }}>
          ⏳ {formatImportProgressText(importProgress, (k, vars) => t(k, vars))}
        </span>
      )}
      <span
        className={`autosave-indicator${dirty ? " dirty" : ""}`}
        title={
          dirty
            ? "Có thay đổi chưa được lưu thành file (.vcut.json)"
            : "Mọi thay đổi đã được lưu"
        }
      >
        {dirty
          ? "● Chưa lưu"
          : lastAuto
            ? `✓ Autosave ${new Date(lastAuto).toLocaleTimeString("vi-VN")}`
            : "✓ Đã lưu"}
      </span>
    </div>
  );
}
