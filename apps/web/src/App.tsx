import { useEffect, useState } from "react";
import { useStore } from "./store";
import { TopBar } from "./TopBar";
import { MediaBin } from "./MediaBin";
import { Inspector } from "./Inspector";
import { Timeline } from "./Timeline";
import { ExportPanel } from "./ExportPanel";
import { PreviewCanvas } from "./preview";

export default function App() {
  const ready = useStore((s) => s.ready);
  const [exportOpen, setExportOpen] = useState(false);

  // tải dự án mẫu khi mở app
  useEffect(() => {
    void useStore.getState().loadSample();
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
      const st = useStore.getState();
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
      <TopBar onExport={() => setExportOpen(true)} />
      <div className="editor-main">
        <MediaBin />
        <div className="preview-col">
          <PreviewCanvas />
        </div>
        <Inspector />
      </div>
      <Timeline />
      {exportOpen && <ExportPanel onClose={() => setExportOpen(false)} />}
      {!ready && (
        <div className="splash">
          <div className="splash-card">
            <div className="splash-logo">◧</div>
            <div className="splash-title">VCut Studio</div>
            <div className="splash-sub">Đang chuẩn bị dự án mẫu…</div>
          </div>
        </div>
      )}
    </div>
  );
}
