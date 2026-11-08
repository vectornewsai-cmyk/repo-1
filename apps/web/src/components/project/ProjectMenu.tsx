/**
 * ProjectMenu — Mới / Mở / Lưu / Lưu thành + chỉ báo autosave.
 *
 * Đặt trong TopBar. Mọi thao tác hỏi xác nhận trước khi bỏ thay đổi chưa lưu.
 */
import { useEffect, useReducer, useRef, useState } from "react";
import { useStore } from "../../store";
import {
  clearAutosave,
  getLastAutosaveAt,
  isDirty,
  markSaved,
  saveProject,
} from "../../lib/projectRepo";
import {
  ARCHIVE_EXT,
  downloadArchive,
  exportArchive,
} from "../../lib/archive";
import { pushToast } from "../../lib/toast";
import { AssetStore } from "../../lib/assetStore";
import { recordCurrentProjectRefs } from "../../lib/idbCleanup61R9";
import { notifyProjectRefsChanged } from "../../lib/projectAssetRefs62R7";
// Đợt 63 R7 — khóa sổ tham chiếu theo projectId ổn định thay cho tên.
import { projectKeyForId } from "../../lib/projectId63R7";
import { getLang, t, useLang } from "../../i18n";
import { formatImportProgressText } from "../../lib/importProgressText41W3";
import type { ImportFileProgressEvent } from "../../lib/ingestProgress39T5";
// Đợt 27 K5 (load report): chỉ 3 dòng ghi/xoá báo cáo lần load gần
// nhất — không đổi luồng mở/lưu, không reformat file.
import {
  clearLastLoadReport,
  formatNoteLines,
} from "../../lib/loadReport";
// Phase 10 G4 — đường mở file/bản nén dùng chung với adapter native
// (lib/openProjectFlow.ts); đường lưu native (lib/nativeFiles.ts).
import {
  confirmDiscardProject,
  openArchiveFileFlow,
  openProjectFileFlow,
  snapshotHistoryAfterSave,
} from "../../lib/openProjectFlow";
// Phase 10 G5 — cầu nối menu/desktop: mở/lưu native đi qua desktop.ts
// (không qua adapter G4 — tránh hai đường lưu song song).
import { openProjectFromPath, saveProjectDesktop } from "../../desktop";
import { isNativeDesktop } from "../../lib/nativeFiles";
import { HistoryPanel } from "./HistoryPanel";

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
  // Đợt 63 R7 — lưu file mang theo projectId ổn định (persist id vào
  // envelope; lần mở sau giữ nguyên id này thay vì migration sinh mới).
  const result = saveProject(st.spec, st.spec.meta.name, st.projectId);
  // Đợt 62 R7 — sau khi lưu file, ghi tập asset project này dùng vào
  // sổ tham chiếu liên project (để UI dọn kho ở project KHÁC chặn xóa
  // bytes project này còn dùng). Fire-and-forget, best-effort: lỗi kho
  // không ảnh hưởng kết quả lưu file (App effect debounce cũng sẽ ghi
  // lại khi spec/media đổi). Chỉ broadcast cho tab khác khi tập đổi.
  // Đợt 63 R7 — khóa sổ theo projectId (`id:<uuid>`), ghi kèm id để
  // bản ghi persist được id của project.
  try {
    void recordCurrentProjectRefs(
      new AssetStore(),
      st.spec,
      st.media,
      projectKeyForId(st.projectId),
      st.spec.meta.name,
      st.projectId,
    )
      .then((rep) => {
        if (rep.recorded && rep.changed) notifyProjectRefsChanged();
      })
      .catch(() => {
        // bỏ qua lặng lẽ — chỉ mất cập nhật sổ lần này
      });
  } catch {
    // IndexedDB không khả dụng — bỏ qua lặng lẽ như trên
  }
  return result;
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

export function ProjectMenu() {
  // Đợt 55 L1 (đóng bug M19 đợt 54 K3): subscribe ngôn ngữ để mọi
  // label/toast của menu đổi theo khi setLang() — trước đây component
  // không gọi useLang() nên literal VI kẹt lại ở chế độ EN.
  useLang();
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

  const confirmDiscard = (): boolean => confirmDiscardProject();

  const doNew = () => {
    if (!confirmDiscard()) return;
    const st = useStore.getState();
    st.newProject();
    // Đợt 64 R6 — không còn rotateProjectId(): project mới đã xoay
    // projectId envelope trong store.newProject (đợt 63 R7) và lịch sử
    // nay khóa theo id envelope đó — không cần chuỗi lịch sử riêng nữa.
    clearAutosave();
    clearLastLoadReport(); // Đợt 27 K5: project mới không còn "lần load gần nhất".
    // Phase 10 G4: project mới chưa có đường dẫn — xoá current path ở
    // main để lần Lưu tới hỏi đường dẫn thay vì ghi đè file cũ.
    if (isNativeDesktop()) {
      void window.vcutDesktop?.setCurrentProjectPath(null).catch(() => undefined);
    }
    markSaved(useStore.getState().spec);
    force();
  };

  // Phase 10 G4 — trong Electron, nút Mở dùng dialog hệ thống + cầu
  // nối desktop.ts của G5 (đọc file ở main); ngoài Electron giữ input
  // file ẩn như cũ.
  const doOpen = () => {
    if (isNativeDesktop()) {
      void (async () => {
        const filePath = await window.vcutDesktop?.openProjectDialog();
        if (!filePath) return; // User bấm Huỷ.
        const ok = await openProjectFromPath(filePath);
        if (ok) force();
      })();
      return;
    }
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng file
    if (!f) return;
    if (!confirmDiscard()) return;
    const ok = await openProjectFileFlow(f);
    if (ok) {
      // Trong Electron, File từ input ẩn mang `.path` — báo main cập
      // nhật Recent + current path để Ctrl+S lưu thẳng (best-effort).
      const webPath = (f as File & { path?: string }).path;
      if (webPath && isNativeDesktop()) {
        void window.vcutDesktop
          ?.noteProjectOpened(webPath)
          .catch(() => undefined);
      }
    }
    force();
  };

  const doSave = () => {
    // Phase 10 G4 — trong Electron, Lưu đi qua cầu nối desktop.ts của
    // G5 (ghi thẳng ra đường dẫn project hiện tại ở main, không tải
    // xuống); ngoài Electron giữ hành vi cũ.
    if (isNativeDesktop()) {
      void saveProjectDesktop(false).then(() => force());
      return;
    }
    // Đợt 31 N4: toast lưu ý đã dịch qua structuredNotes (thay warnList
    // chuỗi thô của đợt 30 M4); không có lưu ý thì không hiện toast,
    // giữ hành vi cũ của nút Lưu trong menu.
    const lines = saveNotesLines(saveCurrentProject());
    if (lines.length > 0) {
      // K5: toast thay window.alert (không chặn luồng làm việc).
      pushToast(t("projectMenu.loadNotes", { notes: lines.join("; ") }), "info");
    }
    // Q7: lưu file cũng snapshot lịch sử (best-effort, trùng hash thì tự bỏ qua).
    snapshotHistoryAfterSave();
    force();
  };

  const doSaveAs = () => {
    // Phase 10 G4 — trong Electron, Lưu thành đi qua cầu nối desktop.ts
    // của G5 (hỏi tên qua prompt như flow web, rồi dialog chọn đường
    // dẫn); ngoài Electron giữ hành vi cũ.
    if (isNativeDesktop()) {
      void saveProjectDesktop(true).then(() => force());
      return;
    }
    const st = useStore.getState();
    const name = window.prompt(t("projectMenu.saveAsPrompt"), st.spec.meta.name);
    if (name === null) return; // bấm Cancel
    st.setProjectName(name.trim().length > 0 ? name.trim() : t("projectMenu.untitledProject"));
    doSave();
  };

  /** Xuất project + media thành file .vcut.zip (archive portable). */
  const doExportArchive = async () => {
    const st = useStore.getState();
    // Gom file gốc từ media pool: tên khớp `src` trong spec.
    const mediaSources = st.media
      .filter((m) => m.file)
      .map((m) => ({ name: m.name, data: m.file as File }));
    const res = await exportArchive(st.spec, st.spec.meta.name, mediaSources, st.projectId);
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
    await openArchiveFileFlow(f, (ev) => setImportProgress(ev));
    setImportProgress(null);
    force();
  };

  return (
    <div className="project-menu">
      <button title={t("projectMenu.newHint")} onClick={doNew}>
        {t("projectMenu.new")}
      </button>
      <button title={t("projectMenu.openHint")} onClick={doOpen}>
        {t("projectMenu.open")}
      </button>
      <button title={t("projectMenu.saveHint")} onClick={doSave}>
        {t("projectMenu.save")}
      </button>
      <button title={t("projectMenu.saveAsHint")} onClick={doSaveAs}>
        {t("projectMenu.saveAs")}
      </button>
      <button
        title={t("projectMenu.exportArchiveHint")}
        onClick={() => void doExportArchive()}
      >
        {t("projectMenu.exportArchive")}
      </button>
      <button
        title={t("projectMenu.importArchiveHint")}
        onClick={doImportArchive}
      >
        {t("projectMenu.importArchive")}
      </button>
      <button
        title={t("projectMenu.historyHint")}
        onClick={() => setShowHistory((v) => !v)}
      >
        {t("projectMenu.history")}
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
            ? t("projectMenu.unsavedChangesHint")
            : t("projectMenu.allSavedHint")
        }
      >
        {dirty
          ? t("projectMenu.unsaved")
          : lastAuto
            ? t("projectMenu.autosaveAt", {
                time: new Date(lastAuto).toLocaleTimeString(
                  getLang() === "vi" ? "vi-VN" : "en-US",
                ),
              })
            : t("projectMenu.saved")}
      </span>
    </div>
  );
}
