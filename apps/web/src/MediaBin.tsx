/** Thư viện media: nhập file từ máy, xem trước, thêm vào timeline (bấm hoặc kéo-thả). */
import { useRef, useState } from "react";
import { useStore } from "./store";
import type { MediaItem } from "./media";
import { fmtTime } from "./lib";
import { t, useLang } from "./i18n";
import { pushToast } from "./lib/toast";
import { shouldAutoProxy } from "./lib/proxy";

/** Trạng thái proxy tự động của 1 item (R3 Phase 9) — giữ ở MediaBin, không đụng store. */
export type AutoStatus = "creating" | "done" | "failed" | "skipped";
const AUTO_PROXY_KEY = "vcut-auto-proxy";
function readAutoProxy(): boolean {
  try {
    const v = localStorage.getItem(AUTO_PROXY_KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

/** Địa chỉ bridge server (cùng mẫu ExportPanel/BgRemovePanel). */
const BRIDGE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

const KIND_ICON: Record<MediaItem["kind"], string> = {
  video: "🎬",
  audio: "🎵",
  image: "🖼️",
};

function MediaCard({ item, autoStatus }: { item: MediaItem; autoStatus?: AutoStatus }) {
  const st = useStore.getState();
  const [proxyBusy, setProxyBusy] = useState(false);
  // Q8: tạo proxy 720p qua bridge rồi gắn vào item — preview dùng proxy,
  // export cuối vẫn dùng file gốc. Chỉ video có File gốc mới tạo được.
  const makeProxy = async () => {
    if (!item.file || proxyBusy) return;
    setProxyBusy(true);
    try {
      const form = new FormData();
      form.append("file", item.file);
      form.append("height", "720");
      const res = await fetch(`${BRIDGE_URL}/api/proxy`, { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : `Bridge trả ${res.status}`);
      if (data.skipped) {
        pushToast(`"${item.name}" đã đủ nhỏ, không cần proxy.`, "info");
        return;
      }
      if (typeof data.proxyUrl !== "string") throw new Error("Bridge không trả proxyUrl.");
      st.setMediaProxy(item.id, `${BRIDGE_URL}${data.proxyUrl}`, Number(data.proxyHeight) || 720);
      pushToast(`Đã gắn proxy ${data.proxyHeight ?? 720}p cho "${item.name}" — preview sẽ mượt hơn.`, "success");
    } catch (e) {
      pushToast(`Không tạo được proxy: ${e instanceof Error ? e.message : "lỗi không rõ"} (bridge: ${BRIDGE_URL})`, "error");
    } finally {
      setProxyBusy(false);
    }
  };
  return (
    <div
      className="media-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/media-id", item.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
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
      {item.kind === "video" && item.file && (
        <button
          className="media-proxy"
          title={item.proxyUrl ? `Đang dùng proxy ${item.proxyHeight ?? 720}p cho preview` : "Tạo bản proxy 720p qua bridge để preview mượt hơn (export vẫn dùng file gốc)"}
          aria-label={`Tạo proxy cho ${item.name}`}
          onClick={() => void makeProxy()}
          disabled={proxyBusy || autoStatus === "creating"}
        >
          {proxyBusy
            ? "…"
            : item.proxyUrl
              ? `✓ PROXY ${item.proxyHeight ?? 720}p`
              : autoStatus === "creating"
                ? "Đang tạo…"
                : autoStatus === "failed"
                  ? "Proxy lỗi, thử lại"
                  : autoStatus === "skipped"
                    ? "Không cần proxy"
                    : "Proxy 720p"}
        </button>
      )}
    </div>
  );
}

export function MediaBin() {
  useLang(); // re-render khi đổi ngôn ngữ
  const media = useStore((s) => s.media);
  const fileRef = useRef<HTMLInputElement>(null);
  const st = useStore.getState();
  // R3 (Phase 9): proxy tự động — mặc định BẬT, tắt được, lưu localStorage.
  const [autoProxy, setAutoProxy] = useState(readAutoProxy);
  const [autoStatus, setAutoStatus] = useState<Record<string, AutoStatus>>({});

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const before = new Set(useStore.getState().media.map((m) => m.id));
    await st.importFiles([...files]);
    if (fileRef.current) fileRef.current.value = "";
    if (!autoProxy) return;
    // Chỉ tạo cho item vừa import, tuần tự để khỏi đè CPU bridge.
    const fresh = useStore.getState().media.filter((m) => !before.has(m.id));
    let bridgeDownToasted = false;
    for (const item of fresh) {
      if (!shouldAutoProxy(item, true)) continue;
      setAutoStatus((s) => ({ ...s, [item.id]: "creating" }));
      try {
        const form = new FormData();
        form.append("file", item.file as File);
        form.append("height", "720");
        const res = await fetch(`${BRIDGE_URL}/api/proxy`, { method: "POST", body: form });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : `Bridge trả ${res.status}`);
        if (data.skipped) {
          setAutoStatus((s) => ({ ...s, [item.id]: "skipped" }));
          continue;
        }
        if (typeof data.proxyUrl !== "string") throw new Error("Bridge không trả proxyUrl.");
        useStore.getState().setMediaProxy(item.id, `${BRIDGE_URL}${data.proxyUrl}`, Number(data.proxyHeight) || 720);
        setAutoStatus((s) => ({ ...s, [item.id]: "done" }));
      } catch {
        setAutoStatus((s) => ({ ...s, [item.id]: "failed" }));
        if (!bridgeDownToasted) {
          bridgeDownToasted = true;
          pushToast(`Bridge không chạy (${BRIDGE_URL}) — proxy tự động thất bại, bấm nút Proxy để thử lại khi bridge đã chạy.`, "error");
        }
      }
    }
  };

  return (
    <aside className="mediabin" aria-label={t("mediabin.title")} data-tour="media">
      <div className="panel-head">
        <span>📁 {t("mediabin.title")}</span>
        <button className="mini-btn" onClick={() => fileRef.current?.click()} title={t("mediabin.import")}>
          {t("mediabin.import")}
        </button>
      </div>
      <label style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "13px", padding: "6px 8px" }}>
        <input
          type="checkbox"
          checked={autoProxy}
          onChange={(e) => {
            const v = e.target.checked;
            setAutoProxy(v);
            try {
              localStorage.setItem(AUTO_PROXY_KEY, v ? "1" : "0");
            } catch {
              // private mode: giữ trong phiên, không crash
            }
          }}
        />
        Tự tạo proxy 720p khi import video (preview mượt hơn, export vẫn dùng gốc)
      </label>
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
          <MediaCard key={m.id} item={m} autoStatus={autoStatus[m.id]} />
        ))}
        {media.length === 0 && (
          <div className="media-empty">
            <p>{t("mediabin.empty")}</p>
            {/* K5: hướng dẫn 3 bước cho người mới — thay cho một dòng trống trơn. */}
            <ol className="media-empty-steps">
              <li>Nhấn “＋ Nhập file” để thêm video, audio hoặc ảnh.</li>
              <li>Kéo thả file vào track timeline (hoặc bấm “＋ Thêm”).</li>
              <li>Bấm “⬇ Xuất bản” để xuất video.</li>
            </ol>
            <button className="mini-btn" onClick={() => fileRef.current?.click()}>
              {t("mediabin.import")}
            </button>
          </div>
        )}
      </div>
      <button className="ghost-btn" onClick={() => void st.loadSample()} title="Tải lại dự án mẫu">
        ↺ Dự án mẫu
      </button>
    </aside>
  );
}
