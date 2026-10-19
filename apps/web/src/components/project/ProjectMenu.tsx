/**
 * ProjectMenu — Mới / Mở / Lưu / Lưu thành + chỉ báo autosave.
 *
 * Đặt trong TopBar. Mọi thao tác hỏi xác nhận trước khi bỏ thay đổi chưa lưu.
 */
import { useEffect, useReducer, useRef } from "react";
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

/** Lưu project hiện tại thành file. Trả về warnings để caller hiển thị. */
export function saveCurrentProject(): string[] {
  const st = useStore.getState();
  const { warnings } = saveProject(st.spec, st.spec.meta.name);
  return warnings;
}

function warnList(warnings: string[]): void {
  if (warnings.length > 0) {
    window.alert("Đã xong, nhưng có lưu ý:\n- " + warnings.join("\n- "));
  }
}

export function ProjectMenu() {
  const spec = useStore((s) => s.spec);
  const fileRef = useRef<HTMLInputElement>(null);
  // làm mới indicator định kỳ (autosave/dirty thay đổi ngoài React render cycle)
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const id = setInterval(force, 2000);
    return () => clearInterval(id);
  }, []);

  const dirty = isDirty(spec);
  const lastAuto = getLastAutosaveAt();

  const confirmDiscard = (): boolean => {
    const st = useStore.getState();
    if (!isDirty(st.spec)) return true;
    return window.confirm("Có thay đổi chưa lưu thành file. Bỏ thay đổi và tiếp tục?");
  };

  const doNew = () => {
    if (!confirmDiscard()) return;
    const st = useStore.getState();
    st.newProject();
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
      window.alert("Không mở được file:\n- " + res.errors.join("\n- "));
      return;
    }
    const st = useStore.getState();
    st.replaceProject(res.spec);
    st.setProjectName(res.name);
    markSaved(res.spec);
    clearAutosave();
    autosave(res.spec, res.name); // ghi ngay để reload khôi phục đúng project vừa mở
    warnList(res.warnings);
    force();
  };

  const doSave = () => {
    warnList(saveCurrentProject());
    force();
  };

  const doSaveAs = () => {
    const st = useStore.getState();
    const name = window.prompt("Tên dự án", st.spec.meta.name);
    if (name === null) return; // bấm Cancel
    st.setProjectName(name.trim().length > 0 ? name.trim() : "Dự án không tên");
    doSave();
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
      <input
        ref={fileRef}
        type="file"
        accept=".vcut.json,.json,application/json"
        style={{ display: "none" }}
        onChange={(e) => void onFile(e)}
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
