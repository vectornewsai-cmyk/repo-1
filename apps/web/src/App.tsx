import { useEffect, useState } from "react";
import { useStore } from "./store";
import { TopBar } from "./TopBar";
import { MediaBin } from "./MediaBin";
import { Inspector } from "./Inspector";
import { Timeline } from "./Timeline";
import { ExportPanel } from "./ExportPanel";
import { PreviewCanvas } from "./preview";
import { RelinkPanel } from "./components/RelinkPanel";
import { CaptionModal } from "./components/CaptionModal";
import { autosave, loadAutosave, markSaved } from "./lib/projectRepo";
import { saveCurrentProject } from "./components/project/ProjectMenu";

export default function App() {
  const ready = useStore((s) => s.ready);
  const missingAssets = useStore((s) => s.missingAssets);
  const [exportOpen, setExportOpen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);

  // Khởi tạo: ưu tiên khôi phục autosave; chỉ tải project mẫu khi chưa có autosave.
  // (Không tự ghi đè project đang làm bằng sample khi reload.)
  useEffect(() => {
    const st = useStore.getState();
    const auto = loadAutosave();
    if (auto) {
      st.replaceProject(auto.spec);
      st.setProjectName(auto.name);
      markSaved(auto.spec);
      st.checkMissingMedia(); // R1-033: hiện panel relink nếu media thiếu
    } else {
      void st.loadSample();
    }
  }, []);

  // Autosave (debounce 5s) mỗi khi spec thay đổi.
  useEffect(() => {
    const unsub = useStore.subscribe((s, prev) => {
      if (s.spec !== prev.spec) autosave(s.spec, s.spec.meta.name);
    });
    return unsub;
  }, []);

  // phím tắt toàn cục
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      ) {
        return;
      }
      // Ctrl/Cmd+S: lưu project (chặn hành vi lưu trang của trình duyệt)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        const warnings = saveCurrentProject();
        if (warnings.length > 0) {
          window.alert("Đã lưu, nhưng có lưu ý:\n- " + warnings.join("\n- "));
        }
        return;
      }
      const st = useStore.getState();
      // R1-051: Ctrl/Cmd+Z hoàn tác, Ctrl/Cmd+Shift+Z hoặc Ctrl/Cmd+Y làm lại
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        st.redo();
        return;
      }
      // Ctrl/Cmd+A: chọn tất cả clip (R1-052)
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        const sels: { trackId: string; clipId: string }[] = [];
        for (const t of st.spec.tracks)
          for (const c of t.clips) sels.push({ trackId: t.id, clipId: c.id });
        st.selectMany(sels);
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        st.togglePlay();
      } else if (e.key === "s" || e.key === "S") {
        st.splitAtPlayhead();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        st.deleteSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <TopBar onExport={() => setExportOpen(true)} onCaption={() => setCaptionOpen(true)} />
      <div className="editor-main">
        <MediaBin />
        <div className="preview-col">
          <PreviewCanvas />
        </div>
        <Inspector />
      </div>
      <Timeline />
      {exportOpen && <ExportPanel onClose={() => setExportOpen(false)} />}
      {captionOpen && <CaptionModal onClose={() => setCaptionOpen(false)} />}
      {missingAssets && missingAssets.length > 0 && (
        <RelinkPanel
          missing={missingAssets}
          onPick={(pick) => useStore.getState().relinkMedia(pick.oldSrc, pick.file)}
          onClose={() => useStore.getState().dismissRelink()}
        />
      )}
      {!ready && (
        <div className="splash">
          <div className="splash-card">
            <div className="splash-logo">◧</div>
            <div className="splash-title">VCut Studio</div>
            <div className="splash-sub">Đang mở dự án…</div>
          </div>
        </div>
      )}
    </div>
  );
}
