/** Thư viện media: nhập file từ máy, xem trước, thêm vào timeline (bấm hoặc kéo-thả). */
import { useRef } from "react";
import { useStore } from "./store";
import type { MediaItem } from "./media";
import { fmtTime } from "./lib";
import { t, useLang } from "./i18n";

const KIND_ICON: Record<MediaItem["kind"], string> = {
  video: "🎬",
  audio: "🎵",
  image: "🖼️",
};

function MediaCard({ item }: { item: MediaItem }) {
  const st = useStore.getState();
  return (
    <div
      className="media-card"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/media-id", item.id)}
      title={`${item.name} — ${t("mediabin.dragHint")}`}
    >
      <div className="media-thumb">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.name} draggable={false} />
        ) : (
          <span className="media-icon" aria-hidden="true">{KIND_ICON[item.kind]}</span>
        )}
        {item.kind !== "image" && item.duration > 0 && (
          <span className="media-dur">{fmtTime(item.duration)}</span>
        )}
      </div>
      <div className="media-name">{item.name}</div>
      <button
        className="media-add"
        title={t("mediabin.addAtPlayhead")}
        aria-label={`${t("mediabin.addAtPlayhead")}: ${item.name}`}
        onClick={() => st.addMediaAtPlayhead(item.id)}
      >
        {t("mediabin.addShort")}
      </button>
    </div>
  );
}

export function MediaBin() {
  useLang(); // re-render khi đổi ngôn ngữ
  const media = useStore((s) => s.media);
  const fileRef = useRef<HTMLInputElement>(null);
  const st = useStore.getState();

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    void st.importFiles([...files]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <aside className="mediabin" aria-label={t("mediabin.title")}>
      <div className="panel-head">
        <span>📁 {t("mediabin.title")}</span>
        <button className="mini-btn" onClick={() => fileRef.current?.click()} title={t("mediabin.import")}>
          {t("mediabin.import")}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="video/*,audio/*,image/*"
        multiple
        hidden
        aria-label={t("mediabin.import")}
        onChange={(e) => onFiles(e.target.files)}
      />
      <div className="media-grid">
        {media.map((m) => (
          <MediaCard key={m.id} item={m} />
        ))}
        {media.length === 0 && (
          <div className="media-empty">
            {t("mediabin.empty")}
          </div>
        )}
      </div>
      <button className="ghost-btn" onClick={() => void st.loadSample()} title="Tải lại dự án mẫu">
        ↺ Dự án mẫu
      </button>
    </aside>
  );
}
