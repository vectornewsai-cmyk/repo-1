/** Thanh công cụ trên cùng: tên dự án, điều khiển phát, thao tác clip, export. */
import { useState } from "react";
import { useStore } from "./store";
import { fmtTime } from "./lib";
import { ProjectMenu } from "./components/project/ProjectMenu";

export function TopBar({ onExport, onCaption }: { onExport: () => void; onCaption: () => void }) {
  const name = useStore((s) => s.spec.meta.name);
  const playing = useStore((s) => s.playing);
  const playhead = useStore((s) => s.playhead);
  const selection = useStore((s) => s.selection);
  const media = useStore((s) => s.media);
  const undoDepth = useStore((s) => s.undoDepth);
  const redoDepth = useStore((s) => s.redoDepth);
  const undoLabel = useStore((s) => s.undoLabel);
  const redoLabel = useStore((s) => s.redoLabel);
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
      setFlash("Không có clip nào tại vị trí playhead");
      setTimeout(() => setFlash(null), 1800);
    }
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-logo">◧</div>
        <div className="brand-name">VCut Studio</div>
      </div>

      <input
        className="project-name"
        value={name}
        onChange={(e) => st.setProjectName(e.target.value)}
        title="Tên dự án"
        maxLength={60}
      />

      <div className="transport">
        <button className="tbtn" title="Về đầu" onClick={() => st.stopPlayback()}>
          ⏮
        </button>
        <button
          className="tbtn play"
          title={playing ? "Tạm dừng (Space)" : "Phát (Space)"}
          onClick={() => st.togglePlay()}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <div className="time-display">
          {fmtTime(playhead)} <span>/</span> {fmtTime(duration)}
        </div>
      </div>

      <div className="topbar-actions">
        <button
          title={undoLabel ? `Hoàn tác: ${undoLabel} (Ctrl+Z)` : "Hoàn tác (Ctrl+Z)"}
          onClick={() => st.undo()}
          disabled={undoDepth === 0}
        >
          ↩
        </button>
        <button
          title={redoLabel ? `Làm lại: ${redoLabel} (Ctrl+Shift+Z)` : "Làm lại (Ctrl+Shift+Z)"}
          onClick={() => st.redo()}
          disabled={redoDepth === 0}
        >
          ↪
        </button>
        <ProjectMenu />
        <button title="Thêm chữ tại playhead" onClick={() => st.addTextClip()}>
          ＋ Chữ
        </button>
        <button title="Tách clip tại playhead (S)" onClick={doSplit}>
          ✂ Tách
        </button>
        <button
          title="Tạo phụ đề tự động từ video/audio (faster-whisper, chạy trên máy bạn)"
          onClick={onCaption}
          disabled={!canCaption}
        >
          💬 Phụ đề
        </button>
        <button
          title="Xoá clip đang chọn (Delete)"
          onClick={() => st.deleteSelection()}
          disabled={selection.length === 0}
        >
          🗑 Xoá
        </button>
        <button className="primary" onClick={onExport} title="Xuất video-spec JSON">
          ⬇ Xuất bản
        </button>
      </div>

      {flash && <div className="flash-msg">{flash}</div>}
    </header>
  );
}
