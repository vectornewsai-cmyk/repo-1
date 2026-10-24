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
import { HistoryPanel } from "./HistoryPanel";
import {
  getCurrentProjectId,
  getHistoryStore,
  rotateProjectId,
  setProjectIdForFile,
} from "../../lib/projectHistory";

/** Lưu project hiện tại thành file. Trả về warnings để caller hiển thị. */
export function saveCurrentProject(): string[] {
  const st = useStore.getState();
  const { warnings } = saveProject(st.spec, st.spec.meta.name);
  return warnings;
}

function warnList(warnings: string[]): void {
  if (warnings.length > 0) {
    // K5: toast thay window.alert (không chặn luồng làm việc).
    pushToast("Đã xong, nhưng có lưu ý: " + warnings.join("; "), "info");
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
      pushToast("Không mở được file: " + res.errors.join("; "), "error");
      return;
    }
    const st = useStore.getState();
    st.replaceProject(res.spec);
    st.setProjectName(res.name);
    setProjectIdForFile(f.name, res.spec); // mở lại cùng file → tiếp tục chuỗi lịch sử (Q7)
    markSaved(res.spec);
    clearAutosave();
    autosave(res.spec, res.name); // ghi ngay để reload khôi phục đúng project vừa mở
    st.checkMissingMedia(); // R1-033: hiện panel relink nếu media thiếu
    warnList(res.warnings);
    force();
  };

  const doSave = () => {
    warnList(saveCurrentProject());
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
      pushToast("Không xuất được bản nén: " + res.errors.join("; "), "error");
      return;
    }
    downloadArchive(res.blob, st.spec.meta.name);
    const sizeMB = (res.stats.zipBytes / 1024 / 1024).toFixed(1);
    const msg =
      `Đã xuất bản nén (${res.stats.mediaFiles} media, ${sizeMB} MB).` +
      (res.warnings.length > 0 ? " Lưu ý: " + res.warnings.join("; ") : "");
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
      pushToast("Không nhập được bản nén: " + res.errors.join("; "), "error");
      return;
    }
    const st = useStore.getState();
    st.newProject(); // xoá project cũ (media blob URL cũ không bền vững)
    st.replaceProject(res.spec);
    st.setProjectName(res.name);
    if (res.mediaFiles.length > 0) {
      await st.importFiles(res.mediaFiles);
    }
    markSaved(res.spec);
    clearAutosave();
    autosave(res.spec, res.name);
    warnList(res.warnings);
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
