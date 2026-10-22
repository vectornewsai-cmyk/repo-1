/**
 * Thanh công cụ trên cùng: tên dự án, điều khiển phát, thao tác clip, export.
 *
 * R1-107: dùng i18n (vi/en) cho toàn bộ chuỗi hiển thị + aria-label cho các nút
 * chỉ có icon, aria-live cho thông báo flash.
 */
import { useState } from "react";
import { useStore } from "./store";
import { fmtTime } from "./lib";
import { ProjectMenu } from "./components/project/ProjectMenu";
import { t, useLang, setLang, getLang } from "./i18n";

export function TopBar({ onExport, onCaption, onSilence, onTemplate }: { onExport: () => void; onCaption: () => void; onSilence: () => void; onTemplate: () => void }) {
  useLang(); // re-render khi đổi ngôn ngữ
  const name = useStore((s) => s.spec.meta.name);
  const playing = useStore((s) => s.playing);
  const playhead = useStore((s) => s.playhead);
  const selection = useStore((s) => s.selection);
  const media = useStore((s) => s.media);
  const undoDepth = useStore((s) => s.undoDepth);
  const redoDepth = useStore((s) => s.redoDepth);
  const undoLabel = useStore((s) => s.undoLabel);
  const redoLabel = useStore((s) => s.redoLabel);
  const clipboardSize = useStore((s) => s.clipboardSize); // K2: bật/tắt nút Dán
  const [flash, setFlash] = useState<string | null>(null);
  const st = useStore.getState();
  const duration = st.duration();
  // R1-072: chỉ bật nút phụ đề khi có file video/audio gốc để transcribe.
  const canCaption = media.some(
    (m) => (m.kind === "video" || m.kind === "audio") && m.file
  );

  const doSplit = () => {
    const ok = st.splitAtPlayhead();
    if (!ok) {
      setFlash(t("topbar.noClipAtPlayhead"));
      setTimeout(() => setFlash(null), 1800);
    }
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-logo" aria-hidden="true">◧</div>
        <div className="brand-name">{t("app.name")}</div>
      </div>

      <input
        className="project-name"
        value={name}
        onChange={(e) => st.setProjectName(e.target.value)}
        title={t("topbar.projectName")}
        aria-label={t("topbar.projectName")}
        maxLength={60}
      />

      <div className="transport" role="group" aria-label="transport">
        <button
          className="tbtn"
          title={t("topbar.toStart")}
          aria-label={t("topbar.toStart")}
          onClick={() => st.stopPlayback()}
        >
          <span aria-hidden="true">⏮</span>
        </button>
        <button
          className="tbtn play"
          title={playing ? t("topbar.pause") : t("topbar.play")}
          aria-label={playing ? t("topbar.pause") : t("topbar.play")}
          aria-pressed={playing}
          onClick={() => st.togglePlay()}
        >
          <span aria-hidden="true">{playing ? "⏸" : "▶"}</span>
        </button>
        <div className="time-display" aria-live="off">
          {fmtTime(playhead)} <span>/</span> {fmtTime(duration)}
        </div>
      </div>

      <div className="topbar-actions">
        <button
          title={undoLabel ? t("topbar.undoWith", { label: undoLabel }) : t("topbar.undo")}
          aria-label={undoLabel ? t("topbar.undoWith", { label: undoLabel }) : t("topbar.undo")}
          onClick={() => st.undo()}
          disabled={undoDepth === 0}
        >
          <span aria-hidden="true">↩</span>
        </button>
        <button
          title={redoLabel ? t("topbar.redoWith", { label: redoLabel }) : t("topbar.redo")}
          aria-label={redoLabel ? t("topbar.redoWith", { label: redoLabel }) : t("topbar.redo")}
          onClick={() => st.redo()}
          disabled={redoDepth === 0}
        >
          <span aria-hidden="true">↪</span>
        </button>
        <ProjectMenu />
        <button title={t("topbar.addText")} onClick={() => st.addTextClip()}>
          {t("topbar.addTextShort")}
        </button>
        <button title={t("topbar.split")} onClick={doSplit}>
          {t("topbar.splitShort")}
        </button>
        {/* K2 (Phase 6): copy/paste/duplicate clip */}
        <button
          title={t("topbar.copy")}
          onClick={() => st.copySelection()}
          disabled={selection.length === 0}
        >
          {t("topbar.copyShort")}
        </button>
        <button
          title={t("topbar.paste")}
          onClick={() => st.pasteClipboard()}
          disabled={clipboardSize === 0}
        >
          {t("topbar.pasteShort")}
        </button>
        <button
          title={t("topbar.duplicate")}
          onClick={() => st.duplicateSelection()}
          disabled={selection.length === 0}
        >
          {t("topbar.duplicateShort")}
        </button>
        <button
          title={t("topbar.caption")}
          onClick={onCaption}
          disabled={!canCaption}
        >
          {t("topbar.captionShort")}
        </button>
        <button
          title={t("topbar.cutSilence")}
          onClick={onSilence}
          disabled={!canCaption}
        >
          {t("topbar.cutSilenceShort")}
        </button>
        <button
          title={t("topbar.template")}
          onClick={onTemplate}
        >
          {t("topbar.templateShort")}
        </button>
        <button
          title={t("topbar.delete")}
          onClick={() => st.deleteSelection()}
          disabled={selection.length === 0}
        >
          {t("topbar.deleteShort")}
        </button>
        <button className="primary" onClick={onExport} title={t("topbar.publish")}>
          {t("topbar.publishShort")}
        </button>
        <button
          className="tbtn"
          title={t("common.language")}
          aria-label={t("common.language")}
          onClick={() => setLang(getLang() === "vi" ? "en" : "vi")}
        >
          <span aria-hidden="true">{getLang() === "vi" ? "🇻🇳" : "🇺🇸"}</span>
        </button>
      </div>

      {flash && (
        <div className="flash-msg" role="status" aria-live="polite">
          {flash}
        </div>
      )}
    </header>
  );
}
