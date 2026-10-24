import { useEffect, useState } from "react";
import { useStore } from "./store";
import { TopBar } from "./TopBar";
import { t, useLang } from "./i18n";
import { MediaBin } from "./MediaBin";
import { Inspector } from "./Inspector";
import { Timeline } from "./Timeline";
import { ExportPanel } from "./ExportPanel";
import { PreviewCanvas } from "./preview";
import { RelinkPanel } from "./components/RelinkPanel";
import { CaptionModal } from "./components/CaptionModal";
import { SilenceModal } from "./components/SilenceModal";
import { TemplatePicker } from "./components/TemplatePicker";
import { Toasts } from "./components/Toasts";
import { pushToast } from "./lib/toast";
import { useIsMobile } from "./lib/useIsMobile";
import { togglePreviewFullscreen } from "./preview";
import { autosave, loadAutosave, markSaved } from "./lib/projectRepo";
import { saveCurrentProject } from "./components/project/ProjectMenu";

export default function App() {
  useLang(); // re-render khi đổi ngôn ngữ (splash + modal)
  const ready = useStore((s) => s.ready);
  const missingAssets = useStore((s) => s.missingAssets);
  const [exportOpen, setExportOpen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [silenceOpen, setSilenceOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  // Q6 (Phase 8): mobile — MediaBin/Inspector thành bottom sheet, mặc định đóng
  // để preview + timeline chiếm màn hình; desktop giữ layout cũ nguyên vẹn.
  const isMobile = useIsMobile();
  const [mediaOpen, setMediaOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

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
      // R1-107: Esc đóng modal đang mở (setter idempotent — gọi cả 3 an toàn
      // vì hook deps [] giữ closure; chỉ 1 modal mở tại 1 thời điểm)
      if (e.key === "Escape") {
        setExportOpen(false);
        setCaptionOpen(false);
        setSilenceOpen(false);
        return;
      }
      // Ctrl/Cmd+S: lưu project (chặn hành vi lưu trang của trình duyệt)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        const warnings = saveCurrentProject();
        if (warnings.length > 0) {
          // K5: toast thay window.alert (không chặn luồng làm việc).
          pushToast("Đã lưu, nhưng có lưu ý: " + warnings.join("; "), "info");
        } else {
          pushToast("Đã lưu project.", "success");
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
      // K2 (Phase 6): Ctrl/Cmd+C copy, Ctrl/Cmd+V paste, Ctrl/Cmd+D duplicate.
      // (Đã return sớm ở trên khi focus trong input/textarea — copy/paste
      // văn bản gốc của trình duyệt vẫn hoạt động bình thường.)
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        st.copySelection();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        st.pasteClipboard();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        st.duplicateSelection();
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        st.togglePlay();
      } else if (e.key === "s" || e.key === "S") {
        st.splitAtPlayhead();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        st.deleteSelection();
      } else if (e.key === "k" || e.key === "K") {
        // K5: J/K/L kiểu shuttle (J/L tua ±5s, K phát/dừng — không phát ngược
        // vì preview chưa hỗ trợ reverse, xem SEEK_LIMITS).
        st.togglePlay();
      } else if (e.key === "j" || e.key === "J") {
        st.setPlayhead(Math.max(0, st.playhead - 5));
      } else if (e.key === "l" || e.key === "L") {
        st.setPlayhead(Math.min(st.duration(), st.playhead + 5));
      } else if (e.key === "Home") {
        e.preventDefault();
        st.setPlayhead(0);
      } else if (e.key === "End") {
        e.preventDefault();
        st.setPlayhead(st.duration());
      } else if (e.key === "ArrowLeft") {
        // K5: tua từng frame (không có modifier — tránh xung đột với
        // di chuyển caret trong input, đã được guard ở đầu handler).
        e.preventDefault();
        const fps = st.spec.meta.fps || 30;
        st.setPlayhead(Math.max(0, st.playhead - 1 / fps));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const fps = st.spec.meta.fps || 30;
        st.setPlayhead(Math.min(st.duration(), st.playhead + 1 / fps));
      } else if (e.key === "f" || e.key === "F") {
        // K5: fullscreen preview.
        togglePreviewFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <TopBar onExport={() => setExportOpen(true)} onCaption={() => setCaptionOpen(true)} onSilence={() => setSilenceOpen(true)} onTemplate={() => setTemplateOpen(true)} />
      <div className="editor-main">
        {!isMobile && <MediaBin />}
        <div className="preview-col">
          <PreviewCanvas />
        </div>
        {!isMobile && <Inspector />}
      </div>
      <Timeline />
      {isMobile && (
        <div className="m-fabbar" role="group" aria-label="Panel mobile">
          <button
            type="button"
            className={`m-fab${mediaOpen ? " active" : ""}`}
            title="Thư viện media"
            aria-label="Mở thư viện media"
            aria-expanded={mediaOpen}
            onClick={() => {
              setMediaOpen(!mediaOpen);
              setInspectorOpen(false);
            }}
          >
            📁
          </button>
          <button
            type="button"
            className={`m-fab${inspectorOpen ? " active" : ""}`}
            title="Thuộc tính clip"
            aria-label="Mở panel thuộc tính"
            aria-expanded={inspectorOpen}
            onClick={() => {
              setInspectorOpen(!inspectorOpen);
              setMediaOpen(false);
            }}
          >
            ⚙️
          </button>
        </div>
      )}
      {isMobile && mediaOpen && (
        <div className="m-sheet-backdrop" onClick={() => setMediaOpen(false)}>
          <div className="m-sheet" role="dialog" aria-modal="true" aria-label="Thư viện media" onClick={(e) => e.stopPropagation()}>
            <div className="m-sheet-grabber" aria-hidden="true" />
            <div className="m-sheet-head">
              <span className="m-sheet-title">📁 Thư viện</span>
              <button type="button" className="m-sheet-close" aria-label="Đóng thư viện" onClick={() => setMediaOpen(false)}>✕</button>
            </div>
            <MediaBin />
          </div>
        </div>
      )}
      {isMobile && inspectorOpen && (
        <div className="m-sheet-backdrop" onClick={() => setInspectorOpen(false)}>
          <div className="m-sheet" role="dialog" aria-modal="true" aria-label="Thuộc tính clip" onClick={(e) => e.stopPropagation()}>
            <div className="m-sheet-grabber" aria-hidden="true" />
            <div className="m-sheet-head">
              <span className="m-sheet-title">⚙️ Thuộc tính</span>
              <button type="button" className="m-sheet-close" aria-label="Đóng panel thuộc tính" onClick={() => setInspectorOpen(false)}>✕</button>
            </div>
            <Inspector />
          </div>
        </div>
      )}
      {exportOpen && <ExportPanel onClose={() => setExportOpen(false)} />}
      {captionOpen && <CaptionModal onClose={() => setCaptionOpen(false)} />}
      {silenceOpen && <SilenceModal onClose={() => setSilenceOpen(false)} />}
      {templateOpen && <TemplatePicker onClose={() => setTemplateOpen(false)} />}
      {/* K5: chồng toast toàn cục */}
      <Toasts />
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
            <div className="splash-logo" aria-hidden="true">◧</div>
            <div className="splash-title">{t("app.name")}</div>
            <div className="splash-sub">{t("app.loading")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
