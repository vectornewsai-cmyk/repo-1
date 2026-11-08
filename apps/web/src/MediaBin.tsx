/** Thư viện media: nhập file từ máy, xem trước, thêm vào timeline (bấm hoặc kéo-thả). */
import { useRef, useState } from "react";
import { useStore } from "./store";
import type { MediaItem } from "./media";
import { fmtTime } from "./lib";
import { t, useLang } from "./i18n";
import { resolveBridgeApiError } from "./lib/bridgeErrors"; // Đợt 62 R5: dịch mã lỗi bridge→web
import { pushToast } from "./lib/toast";
import { shouldAutoProxy } from "./lib/proxy";
// Phase 10 G4 — nút Thêm media dùng dialog hệ thống trong Electron.
import { importMediaNative, isNativeDesktop } from "./lib/nativeFiles";
import type { ImportFileProgressEvent } from "./lib/ingestProgress39T5";
import { formatBytes, ingestPercent } from "./lib/ingestProgress39T5";
import { BRIDGE_URL } from "./lib/bridgeUrl";
// Đợt 61 R9 — UI dọn kho lưu trữ (đóng nợ 60 Q7 §5.9: bytes mồ côi từ
// trước đợt 60 vẫn ở lại kho, chưa có UI dọn).
import { StorageCleanupPanel } from "./components/StorageCleanupPanel";

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


const KIND_ICON: Record<MediaItem["kind"], string> = {
  video: "🎬",
  audio: "🎵",
  image: "🖼️",
};

function MediaCard({ item, autoStatus }: { item: MediaItem; autoStatus?: AutoStatus }) {
  const st = useStore.getState();
  const [proxyBusy, setProxyBusy] = useState(false);
  // Đợt 59 P1 — xóa media khỏi bin (chỉ khi user bấm ✕ + xác nhận):
  // xóa hết clip khỏi timeline KHÔNG xóa media khỏi bin nữa, nên bin
  // cần đường xóa chủ đích riêng. Store chặn khi còn clip dùng media
  // này (trả message) — khi đó chỉ toast lỗi, không xóa.
  const removeFromBin = () => {
    if (!window.confirm(t("mediabin.removeConfirm", { name: item.name }))) return;
    const r = st.removeMediaFromBin(item.id);
    if (r.ok) pushToast(t("mediabin.removed", { name: item.name }), "success");
    else if (r.message) pushToast(r.message, "error");
  };
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
      if (!res.ok) throw new Error(resolveBridgeApiError(data, t, t("mediabin.bridgeStatus", { status: String(res.status) })));
      if (data.skipped) {
        pushToast(t("mediabin.smallEnough", { name: item.name }), "info");
        return;
      }
      if (typeof data.proxyUrl !== "string") throw new Error(t("mediabin.noProxyUrl"));
      // Đợt 38 U2: truyền proxySizeBytes khi bridge trả (kích thước
      // của chính file proxy) để preview đưa qua cổng S4; bridge cũ
      // không trả thì undefined và cổng HEAD/GET của R3 vẫn làm việc.
      st.setMediaProxy(
        item.id,
        `${BRIDGE_URL}${data.proxyUrl}`,
        Number(data.proxyHeight) || 720,
        typeof data.proxySizeBytes === "number" ? data.proxySizeBytes : undefined,
      );
      pushToast(t("mediabin.proxyAttached", { height: String(data.proxyHeight ?? 720), name: item.name }), "success");
    } catch (e) {
      pushToast(t("mediabin.proxyFailed", { error: e instanceof Error ? e.message : t("mediabin.unknownError"), url: BRIDGE_URL }), "error");
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
        className="media-remove"
        title={t("mediabin.removeTitle", { name: item.name })}
        aria-label={t("mediabin.removeTitle", { name: item.name })}
        onClick={removeFromBin}
      >
        ✕
      </button>
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
          title={
            item.proxyStale
              ? t("mediabin.proxyStaleTitle")
              : item.proxyUrl
                ? t("mediabin.proxyOnTitle", { height: String(item.proxyHeight ?? 720) })
                : t("mediabin.proxyCreateTitle")
          }
          aria-label={item.proxyStale ? t("mediabin.recreateProxyFor", { name: item.name }) : t("mediabin.createProxyFor", { name: item.name })}
          onClick={() => void makeProxy()}
          disabled={proxyBusy || autoStatus === "creating"}
        >
          {proxyBusy
            ? "…"
            : item.proxyStale
              ? t("mediabin.proxyStaleBtn")
              : item.proxyUrl
                ? `✓ PROXY ${item.proxyHeight ?? 720}p`
                : autoStatus === "creating"
                  ? t("mediabin.proxyCreating")
                  : autoStatus === "failed"
                    ? t("mediabin.proxyFailedBtn")
                    : autoStatus === "skipped"
                      ? t("mediabin.proxyNotNeeded")
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
  // Đợt 40 V5 — tiến trình ingest của importFiles thường (theo từng
  // file, % thật chỉ ở pha hashing; pha storing chỉ báo "đang ghi").
  // Chỉ hiện trong lúc importFiles chạy; xong thì xoá để khỏi lẫn với
  // vòng proxy tự động chạy sau đó.
  const [importProgress, setImportProgress] = useState<ImportFileProgressEvent | null>(null);
  // Đợt 61 R9 — mở panel dọn kho lưu trữ (IndexedDB).
  const [cleanupOpen, setCleanupOpen] = useState(false);

  /** Proxy tự động cho item vừa import (dùng chung đường web + native). */
  const autoProxyFresh = async (before: Set<string>) => {
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
        if (!res.ok) throw new Error(resolveBridgeApiError(data, t, t("mediabin.bridgeStatus", { status: String(res.status) })));
        if (data.skipped) {
          setAutoStatus((s) => ({ ...s, [item.id]: "skipped" }));
          continue;
        }
        if (typeof data.proxyUrl !== "string") throw new Error(t("mediabin.noProxyUrl"));
        // Đợt 38 U2: như đường bấm tay ở trên — truyền proxySizeBytes
        // khi bridge trả, để cổng S4 áp dụng được cho nguồn proxy.
        useStore.getState().setMediaProxy(
          item.id,
          `${BRIDGE_URL}${data.proxyUrl}`,
          Number(data.proxyHeight) || 720,
          typeof data.proxySizeBytes === "number" ? data.proxySizeBytes : undefined,
        );
        setAutoStatus((s) => ({ ...s, [item.id]: "done" }));
      } catch {
        setAutoStatus((s) => ({ ...s, [item.id]: "failed" }));
        if (!bridgeDownToasted) {
          bridgeDownToasted = true;
          pushToast(t("mediabin.bridgeDown", { url: BRIDGE_URL }), "error");
        }
      }
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const before = new Set(useStore.getState().media.map((m) => m.id));
    try {
      await st.importFiles([...files], (ev) => setImportProgress(ev));
    } finally {
      setImportProgress(null);
    }
    if (fileRef.current) fileRef.current.value = "";
    await autoProxyFresh(before);
  };

  // Phase 10 G4 — trong Electron, nút Thêm media dùng dialog hệ thống
  // chọn nhiều file (đọc bytes ở main); ngoài Electron giữ input ẩn.
  const doImport = async () => {
    if (!isNativeDesktop()) {
      fileRef.current?.click();
      return;
    }
    const before = new Set(useStore.getState().media.map((m) => m.id));
    const ok = await importMediaNative();
    if (ok) await autoProxyFresh(before);
  };

  return (
    <aside className="mediabin" aria-label={t("mediabin.title")} data-tour="media">
      <div className="panel-head">
        <span>📁 {t("mediabin.title")}</span>
        <span style={{ display: "flex", gap: 6 }}>
          <button
            className="mini-btn"
            onClick={() => setCleanupOpen(true)}
            title={t("storageCleanup.openTitle")}
            data-testid="storage-cleanup-open"
          >
            {t("storageCleanup.openBtn")}
          </button>
          <button className="mini-btn" onClick={() => void doImport()} title={t("mediabin.import")}>
            {t("mediabin.import")}
          </button>
        </span>
      </div>
      {importProgress && (
        <div
          className="valid-banner"
          role="status"
          aria-live="polite"
          data-import-progress={importProgress.phase}
          style={{ fontSize: 13, margin: "6px 8px" }}
        >
          ⏳{" "}
          {importProgress.phase === "hashing"
            ? t("importProgress.hashing", {
                index: String(importProgress.fileIndex + 1),
                count: String(importProgress.fileCount),
                name: importProgress.fileName,
                done: formatBytes(importProgress.bytesDone),
                total: formatBytes(importProgress.totalBytes),
                percent: String(ingestPercent(importProgress)),
              })
            : importProgress.phase === "storing"
              ? t("importProgress.storing", {
                  index: String(importProgress.fileIndex + 1),
                  count: String(importProgress.fileCount),
                  name: importProgress.fileName,
                  total: formatBytes(importProgress.totalBytes),
                })
              : t("importProgress.done", {
                  index: String(importProgress.fileIndex + 1),
                  count: String(importProgress.fileCount),
                  name: importProgress.fileName,
                  total: formatBytes(importProgress.totalBytes),
                })}
          {importProgress.phase === "hashing" && importProgress.totalBytes > 0 && (
            <div
              style={{
                height: 8,
                marginTop: 6,
                borderRadius: 4,
                background: "var(--border-soft)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${ingestPercent(importProgress)}%`,
                  background: "var(--accent, #4da3ff)",
                }}
              />
            </div>
          )}
        </div>
      )}
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
        {t("mediabin.autoProxyHint")}
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
              <li>{t("mediabin.emptyStep1")}</li>
              <li>{t("mediabin.emptyStep2")}</li>
              <li>{t("mediabin.emptyStep3")}</li>
            </ol>
            <button className="mini-btn" onClick={() => void doImport()}>
              {t("mediabin.import")}
            </button>
          </div>
        )}
      </div>
      <button className="ghost-btn" onClick={() => void st.loadSample()} title={t("mediabin.reloadSample")}>
        {t("mediabin.sampleProject")}
      </button>
      {cleanupOpen && <StorageCleanupPanel onClose={() => setCleanupOpen(false)} />}
    </aside>
  );
}
