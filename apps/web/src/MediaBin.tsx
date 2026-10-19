/** Thư viện media: nhập file từ máy, xem trước, thêm vào timeline (bấm hoặc kéo-thả). */
import { useRef } from "react";
import { useStore } from "./store";
import type { MediaItem } from "./media";
import { fmtTime } from "./lib";

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
      title={`${item.name} — kéo thả vào track timeline`}
    >
      <div className="media-thumb">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.name} draggable={false} />
        ) : (
          <span className="media-icon">{KIND_ICON[item.kind]}</span>
        )}
        {item.kind !== "image" && item.duration > 0 && (
          <span className="media-dur">{fmtTime(item.duration)}</span>
        )}
      </div>
      <div className="media-name">{item.name}</div>
      <button
        className="media-add"
        title="Thêm vào timeline tại playhead"
        onClick={() => st.addMediaAtPlayhead(item.id)}
      >
        ＋ Thêm
      </button>
    </div>
  );
}

export function MediaBin() {
  const media = useStore((s) => s.media);
  const fileRef = useRef<HTMLInputElement>(null);
  const st = useStore.getState();

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    void st.importFiles([...files]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <aside className="mediabin">
      <div className="panel-head">
        <span>📁 Thư viện</span>
        <button className="mini-btn" onClick={() => fileRef.current?.click()} title="Nhập video / audio / ảnh từ máy">
          ＋ Nhập
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="video/*,audio/*,image/*"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
      <div className="media-grid">
        {media.map((m) => (
          <MediaCard key={m.id} item={m} />
        ))}
        {media.length === 0 && (
          <div className="media-empty">
            Chưa có media nào.
            <br />
            Bấm <b>＋ Nhập</b> để thêm video, nhạc, ảnh từ máy của bạn.
          </div>
        )}
      </div>
      <button className="ghost-btn" onClick={() => void st.loadSample()} title="Tải lại dự án mẫu">
        ↺ Dự án mẫu
      </button>
    </aside>
  );
}
