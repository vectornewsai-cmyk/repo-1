/** Thư viện media: nhập file từ máy, xem trước, thêm vào timeline (bấm hoặc kéo-thả). */
import { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import type { MediaItem } from "./media";
import { fmtTime } from "./lib";
import { t, useLang } from "./i18n";
import { resolveBridgeApiError } from "./lib/bridgeErrors"; // Đợt 62 R5: dịch mã lỗi bridge→web
import { pushToast } from "./lib/toast";
import { shouldAutoProxy, AUTO_PROXY_HEIGHT_KEY, readAutoProxyHeight } from "./lib/proxy";
import {
  PROXY_RETRY_MAX_ATTEMPTS,
  proxyRetryDelayMs,
  proxyRetryExhausted,
  isBridgeDownError,
  clampProxyProgress,
  parseProxyJobStatus,
  proxyJobDoneResult,
} from "./lib/proxy";
import type { ProxyHeight } from "./lib/proxy";
// Phase 10 G4 — nút Thêm media dùng dialog hệ thống trong Electron.
import { importMediaNative, isNativeDesktop } from "./lib/nativeFiles";
import type { ImportFileProgressEvent } from "./lib/ingestProgress39T5";
import { formatBytes, ingestPercent } from "./lib/ingestProgress39T5";
import { BRIDGE_URL } from "./lib/bridgeUrl";
// Đợt 61 R9 — UI dọn kho lưu trữ (đóng nợ 60 Q7 §5.9: bytes mồ côi từ
// trước đợt 60 vẫn ở lại kho, chưa có UI dọn).
import { StorageCleanupPanel } from "./components/StorageCleanupPanel";
// Đợt 75 C6 — modal giải thích codec không hỗ trợ (đóng nợ đợt 74 §4:
// cờ unsupportedCodec trước đây chỉ sống trong toast 4,5 s, không có
// dấu vết bền vững nào trong UI).
import { CodecUnsupportedModal } from "./components/CodecUnsupportedModal";

/** Trạng thái proxy tự động của 1 item (R3 Phase 9) — giữ ở MediaBin, không đụng store.
 * Đợt 85 M8 thêm "retry-queued" (bridge tắt, đang chờ thử lại theo lịch)
 * và "retrying" (đang chạy lần thử lại). */
export type AutoStatus = "creating" | "done" | "failed" | "skipped" | "retry-queued" | "retrying";
/** Một mục trong hàng đợi thử lại proxy (đợt 85 M8): attempts = số lần đã
 * thử (tính cả lần đầu); nextAt = mốc ms epoch chạy lần thử tiếp theo. */
export type ProxyRetryEntry = { attempts: number; nextAt: number; delayMs: number };
/** Kết quả tạo proxy qua bridge (async job hoặc sync fallback). */
type ProxyCreateOutcome =
  | { kind: "done"; proxyUrl: string; proxyHeight: number; proxySizeBytes?: number }
  | { kind: "skipped" };
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

function MediaCard({
  item,
  autoStatus,
  targetHeight,
  autoProgress,
  retryInfo,
  onMakeProxy,
  onRetryNow,
}: {
  item: MediaItem;
  autoStatus?: AutoStatus;
  targetHeight: ProxyHeight;
  /** % tiến trình thật từ bridge (đợt 85 M8); undefined = chưa có % (đang chờ job / bridge cũ). */
  autoProgress?: number;
  /** Mục retry đang chờ cho item này (đợt 85 M8); undefined = không chờ thử lại. */
  retryInfo?: ProxyRetryEntry;
  /** Bấm nút Proxy (tay) — MediaBin chạy job async có % + retry queue. */
  onMakeProxy: (item: MediaItem) => void;
  /** Bấm "Thử lại ngay" — chạy lại job ngay, không chờ tới lịch. */
  onRetryNow: (item: MediaItem) => void;
}) {
  const st = useStore.getState();
  // Đợt 75 C6 — mở modal giải thích khi bấm badge codec không hỗ trợ.
  const [codecDetailOpen, setCodecDetailOpen] = useState(false);
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
  // Đợt 85 M8 — bận = đang tạo proxy (lần đầu hay thử lại đều qua
  // MediaBin.runProxyForItem, có guard chống chạy trùng 1 item).
  const proxyBusy = autoStatus === "creating" || autoStatus === "retrying";
  // Lần thử tiếp theo là lần thứ mấy (attempts = số lần đã thử).
  const nextAttempt = (retryInfo?.attempts ?? 0) + 1;
  return (
    <div
      className="media-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/media-id", item.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      title={
        item.unsupportedCodec
          ? `${item.name} — ${t("mediabin.codecBadgeTitle", { codec: item.unsupportedCodec })}`
          : `${item.name} — ${t("mediabin.dragHint")}`
      }
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
        {/* Đợt 75 C6 — badge cảnh báo bền vững cho codec trình duyệt
            không phát được (đợt 74 B3 chỉ toast 1 lần lúc import rồi
            mất dấu): bấm mở modal giải thích + cách xử lý. Style inline
            để không đụng styles.css (file chung với luồng khác đợt này). */}
        {item.unsupportedCodec && (
          <button
            type="button"
            data-testid="codec-unsupported-badge"
            title={t("mediabin.codecBadgeTitle", { codec: item.unsupportedCodec })}
            aria-label={t("mediabin.codecBadgeTitle", { codec: item.unsupportedCodec })}
            onClick={() => setCodecDetailOpen(true)}
            style={{
              position: "absolute",
              top: 5,
              left: 5,
              zIndex: 2,
              background: "#b3261e",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 6px",
              cursor: "pointer",
            }}
          >
            {t("mediabin.codecBadge")}
          </button>
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
        <>
          <button
            className="media-proxy"
            title={
              item.proxyStale
                ? t("mediabin.proxyStaleTitle", { height: String(targetHeight) })
                : item.proxyUrl
                  ? t("mediabin.proxyOnTitle", { height: String(item.proxyHeight ?? targetHeight) })
                  : t("mediabin.proxyCreateTitle", { height: String(targetHeight) })
            }
            aria-label={item.proxyStale ? t("mediabin.recreateProxyFor", { name: item.name }) : t("mediabin.createProxyFor", { name: item.name })}
            onClick={() => onMakeProxy(item)}
            disabled={proxyBusy}
            // Đợt 85 M8 — % thật để click-test đọc (không parse text):
            // "" khi chưa có % (đang chờ job / bridge cũ không báo %).
            data-proxy-progress={typeof autoProgress === "number" ? String(autoProgress) : ""}
            data-proxy-status={autoStatus ?? ""}
          >
            {proxyBusy
              ? autoStatus === "retrying"
                ? t("mediabin.proxyRetrying", { attempt: String(nextAttempt), max: String(PROXY_RETRY_MAX_ATTEMPTS) })
                : typeof autoProgress === "number"
                  ? t("mediabin.proxyCreatingPercent", { percent: String(autoProgress) })
                  : t("mediabin.proxyCreating")
              : item.proxyStale
                ? t("mediabin.proxyStaleBtn")
                : item.proxyUrl
                  ? `✓ PROXY ${item.proxyHeight ?? targetHeight}p`
                  : autoStatus === "failed"
                    ? t("mediabin.proxyFailedBtn")
                    : autoStatus === "skipped"
                      ? t("mediabin.proxyNotNeeded")
                      : `Proxy ${targetHeight}p`}
          </button>
          {/* Đợt 85 M8 — bridge tắt: ghi rõ đang chờ thử lại lần mấy sau
              bao lâu + nút thử ngay (không bắt user chờ hết backoff). */}
          {autoStatus === "retry-queued" && retryInfo && (
            <div
              data-testid="proxy-retry-note"
              style={{ fontSize: 11, color: "var(--text-dim, #888)", padding: "2px 4px", lineHeight: 1.4 }}
            >
              {t("mediabin.proxyRetryQueued", {
                attempt: String(nextAttempt),
                max: String(PROXY_RETRY_MAX_ATTEMPTS),
                seconds: String(Math.max(1, Math.round(retryInfo.delayMs / 1000))),
              })}{" "}
              <button
                type="button"
                data-testid="proxy-retry-now"
                onClick={() => onRetryNow(item)}
                style={{ fontSize: 11, cursor: "pointer" }}
              >
                {t("mediabin.proxyRetryNow")}
              </button>
            </div>
          )}
        </>
      )}
      {/* Đợt 84 L9 — video mất file gốc: nút Proxy ẩn hẳn trước đây mà
          không giải thích gì (auto cũng bỏ qua lặng). Ghi rõ hành vi:
          không tạo được proxy khi không còn file gốc; preview dùng
          bản đã lưu trong kho, export vẫn cần file gốc — import lại
          file để tạo proxy. Style inline để không đụng styles.css. */}
      {item.kind === "video" && !item.file && (
        <div
          style={{ fontSize: 11, color: "var(--text-dim, #888)", padding: "2px 4px", lineHeight: 1.4 }}
          title={t("mediabin.proxyNoOriginalFile")}
        >
          {t("mediabin.proxyNoOriginalFile")}
        </div>
      )}
      {/* Đợt 75 C6 — modal giải thích codec không hỗ trợ (xem badge trên). */}
      {codecDetailOpen && item.unsupportedCodec && (
        <CodecUnsupportedModal
          name={item.name}
          codecLabel={item.unsupportedCodec}
          onClose={() => setCodecDetailOpen(false)}
        />
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
  // Đợt 84 L9 — chiều cao proxy (480|720, mặc định 720): dùng chung cho
  // cả tạo tay lẫn tự động; lưu localStorage, bridge chỉ nhận 2 giá trị.
  const [autoProxyHeight, setAutoProxyHeight] = useState<ProxyHeight>(readAutoProxyHeight);
  const [autoStatus, setAutoStatus] = useState<Record<string, AutoStatus>>({});
  // Đợt 85 M8 — % tiến trình thật từng proxy đang tạo (bridge báo qua
  // job async; xóa khi job xong/lỗi). Chỉ hiện trong lúc tạo.
  const [autoProgress, setAutoProgress] = useState<Record<string, number>>({});
  // Đợt 85 M8 — hàng đợi thử lại khi bridge tắt: ref là nguồn thật
  // (tránh updater lồng nhau + stale closure trong timer), state chỉ
  // để render lại. Key = item id.
  const retryQueueRef = useRef<Record<string, ProxyRetryEntry>>({});
  const [retryQueue, setRetryQueue] = useState<Record<string, ProxyRetryEntry>>({});
  // Chống 2 lần chạy trùng 1 item (bấm tay + timer retry cùng lúc).
  const proxyInFlightRef = useRef(new Set<string>());
  // Toast bridgeDown tối đa 1 lần mỗi đợt import (tránh spam 5 toast).
  const bridgeDownToastedRef = useRef(false);
  // Chiều cao proxy hiện tại cho timer retry (tránh closure cũ).
  const autoProxyHeightRef = useRef<ProxyHeight>(autoProxyHeight);
  autoProxyHeightRef.current = autoProxyHeight;

  const setRetryEntry = (itemId: string, entry: ProxyRetryEntry | null) => {
    const next = { ...retryQueueRef.current };
    if (entry) next[itemId] = entry;
    else delete next[itemId];
    retryQueueRef.current = next;
    setRetryQueue(next);
  };

  /**
   * Đợt 85 M8 — tạo 1 proxy qua bridge, ưu tiên job async có % thật:
   * POST /api/proxy?async=1 → 202 + jobId → poll GET jobs/:id mỗi 500 ms,
   * gọi onProgress(pct) theo % bridge báo (0..99 lúc chạy, 100 lúc done).
   * - Bridge cũ (không có job async): POST trả 200 sync như trước, có
   *   proxyUrl mà không có jobId → xử lý như kết quả sync, onProgress
   *   không được gọi lần nào (UI hiện "Đang tạo…" không % — KHÔNG bịa
   *   % bằng timer, xem LIMITS đợt 85 M8).
   * - Job 404 khi poll (bridge restart giữa chừng) → ném lỗi có
   *   status=404 để caller đưa vào hàng đợi thử lại như bridge tắt.
   * - Poll tối đa 15 phút (= TTL job bridge); quá thì ném timeout.
   */
  const runProxyJob = async (
    file: File,
    height: ProxyHeight,
    onProgress: (pct: number) => void,
  ): Promise<ProxyCreateOutcome> => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const form = new FormData();
    form.append("file", file);
    form.append("height", String(height));
    const res = await fetch(`${BRIDGE_URL}/api/proxy?async=1`, { method: "POST", body: form });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const job0 = parseProxyJobStatus(data);
    if (res.status === 202 && job0) {
      const deadline = Date.now() + 15 * 60 * 1000;
      let cur = job0;
      let lastData: Record<string, unknown> = data;
      while (cur.status === "processing") {
        onProgress(clampProxyProgress(cur.progress));
        if (Date.now() > deadline) throw new Error(t("mediabin.proxyTimeout"));
        await sleep(500);
        const r = await fetch(`${BRIDGE_URL}/api/proxy/jobs/${encodeURIComponent(job0.jobId)}`);
        const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
        if (!r.ok) {
          const err = new Error(
            r.status === 404 ? t("mediabin.proxyJobLost") : resolveBridgeApiError(d, t, t("mediabin.bridgeStatus", { status: String(r.status) })),
          );
          (err as unknown as { status?: number }).status = r.status;
          throw err;
        }
        const next = parseProxyJobStatus(d);
        if (!next) throw new Error(t("mediabin.noProxyUrl"));
        cur = next;
        lastData = d;
      }
      onProgress(clampProxyProgress(cur.progress));
      if (cur.status === "skipped") return { kind: "skipped" };
      if (cur.status === "failed") {
        const err = new Error(
          typeof lastData.error === "string" && lastData.error
            ? lastData.error
            : resolveBridgeApiError(lastData, t, t("mediabin.proxyFailed", { error: t("mediabin.unknownError"), url: BRIDGE_URL })),
        );
        throw err;
      }
      const done = proxyJobDoneResult(lastData);
      if (!done) throw new Error(t("mediabin.noProxyUrl"));
      return { kind: "done", proxyUrl: done.proxyUrl, proxyHeight: done.proxyHeight, proxySizeBytes: done.proxySizeBytes };
    }
    // Đường sync (bridge cũ hoặc POST async trả thẳng 200): giữ đúng
    // hành vi Q8/R3 — không có % thật nên không gọi onProgress.
    if (!res.ok) throw new Error(resolveBridgeApiError(data, t, t("mediabin.bridgeStatus", { status: String(res.status) })));
    if (data.skipped) return { kind: "skipped" };
    if (typeof data.proxyUrl !== "string") throw new Error(t("mediabin.noProxyUrl"));
    return {
      kind: "done",
      proxyUrl: data.proxyUrl,
      proxyHeight: Number(data.proxyHeight) || height,
      proxySizeBytes: typeof data.proxySizeBytes === "number" ? data.proxySizeBytes : undefined,
    };
  };

  /**
   * Đợt 85 M8 — chạy 1 proxy cho 1 item (dùng chung cho tự động, bấm
   * tay và thử lại): gắn proxy vào store khi xong; bridge tắt (fetch
   * lỗi mạng / 502-504 / job 404) thì vào hàng đợi thử lại với backoff
   * 5s→10s→20s→40s→80s, tối đa 5 lần thử tổng; lỗi xác định (400/500
   * encode) thì fail luôn, không retry. announce=true (bấm tay) mới
   * toast thành công; tự động/thử lại im lặng khi xong để khỏi spam.
   */
  const runProxyForItem = async (item: MediaItem, height: ProxyHeight, opts: { announce?: boolean; isRetry?: boolean } = {}) => {
    if (!item.file || proxyInFlightRef.current.has(item.id)) return;
    proxyInFlightRef.current.add(item.id);
    setAutoStatus((s) => ({ ...s, [item.id]: opts.isRetry ? "retrying" : "creating" }));
    try {
      const outcome = await runProxyJob(item.file, height, (pct) =>
        setAutoProgress((s) => ({ ...s, [item.id]: pct })),
      );
      setRetryEntry(item.id, null);
      if (outcome.kind === "skipped") {
        setAutoStatus((s) => ({ ...s, [item.id]: "skipped" }));
        if (opts.announce) pushToast(t("mediabin.smallEnough", { name: item.name }), "info");
        return;
      }
      // Đợt 38 U2: truyền proxySizeBytes khi bridge trả (kích thước
      // của chính file proxy) để preview đưa qua cổng S4; bridge cũ
      // không trả thì undefined và cổng HEAD/GET của R3 vẫn làm việc.
      useStore.getState().setMediaProxy(
        item.id,
        `${BRIDGE_URL}${outcome.proxyUrl}`,
        outcome.proxyHeight,
        outcome.proxySizeBytes,
      );
      setAutoStatus((s) => ({ ...s, [item.id]: "done" }));
      if (opts.announce) {
        pushToast(t("mediabin.proxyAttached", { height: String(outcome.proxyHeight), name: item.name }), "success");
      }
    } catch (e) {
      const retryable =
        isBridgeDownError(e) || (e as unknown as { status?: unknown } | null)?.status === 404;
      if (retryable) {
        const prev = retryQueueRef.current[item.id];
        const attempts = (prev?.attempts ?? 0) + 1;
        if (proxyRetryExhausted(attempts)) {
          setRetryEntry(item.id, null);
          setAutoStatus((s) => ({ ...s, [item.id]: "failed" }));
          pushToast(
            t("mediabin.proxyRetryFailed", { max: String(PROXY_RETRY_MAX_ATTEMPTS), name: item.name }),
            "error",
          );
        } else {
          const delayMs = proxyRetryDelayMs(attempts);
          setRetryEntry(item.id, { attempts, nextAt: Date.now() + delayMs, delayMs });
          setAutoStatus((s) => ({ ...s, [item.id]: "retry-queued" }));
          if (!bridgeDownToastedRef.current) {
            bridgeDownToastedRef.current = true;
            pushToast(t("mediabin.bridgeDown", { url: BRIDGE_URL }), "error");
          }
        }
      } else {
        setRetryEntry(item.id, null);
        setAutoStatus((s) => ({ ...s, [item.id]: "failed" }));
        pushToast(
          t("mediabin.proxyFailed", { error: e instanceof Error ? e.message : t("mediabin.unknownError"), url: BRIDGE_URL }),
          "error",
        );
      }
    } finally {
      proxyInFlightRef.current.delete(item.id);
      setAutoProgress((s) => {
        if (!(item.id in s)) return s;
        const next = { ...s };
        delete next[item.id];
        return next;
      });
    }
  };

  // Đợt 85 M8 — timer hàng đợi thử lại: hẹn đúng mốc nextAt gần nhất;
  // tới giờ thì chạy lại item đó (isRetry → trạng thái "retrying").
  // Hết item (bị xóa khỏi bin) thì chỉ gỡ khỏi hàng đợi, không crash.
  useEffect(() => {
    const entries = Object.entries(retryQueue);
    if (entries.length === 0) return;
    const [itemId, entry] = entries.reduce((a, b) => (a[1].nextAt <= b[1].nextAt ? a : b));
    const wait = Math.max(0, entry.nextAt - Date.now());
    const timer = setTimeout(() => {
      const item = useStore.getState().media.find((m) => m.id === itemId);
      if (!item || !item.file) {
        setRetryEntry(itemId, null);
        return;
      }
      void runProxyForItem(item, autoProxyHeightRef.current, { isRetry: true });
    }, wait);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryQueue]);

  /** Thử lại ngay (nút trên thẻ media): bỏ lịch chờ, chạy lại luôn. */
  const retryProxyNow = (item: MediaItem) => {
    setRetryEntry(item.id, null);
    bridgeDownToastedRef.current = false;
    void runProxyForItem(item, autoProxyHeightRef.current, { isRetry: true });
  };
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
    bridgeDownToastedRef.current = false;
    // Chỉ tạo cho item vừa import, tuần tự để khỏi đè CPU bridge.
    const fresh = useStore.getState().media.filter((m) => !before.has(m.id));
    for (const item of fresh) {
      if (!shouldAutoProxy(item, true, autoProxyHeight)) continue;
      await runProxyForItem(item, autoProxyHeight);
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
        {t("mediabin.autoProxyHint", { height: String(autoProxyHeight) })}
        <select
          value={String(autoProxyHeight)}
          onChange={(e) => {
            const h = e.target.value === "480" ? 480 : 720;
            setAutoProxyHeight(h);
            try {
              localStorage.setItem(AUTO_PROXY_HEIGHT_KEY, String(h));
            } catch {
              // private mode: giữ trong phiên, không crash
            }
          }}
          aria-label={t("mediabin.proxyHeightLabel")}
          title={t("mediabin.proxyHeightLabel")}
          style={{ fontSize: 13 }}
        >
          <option value="480">480p</option>
          <option value="720">720p</option>
        </select>
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
          <MediaCard
            key={m.id}
            item={m}
            autoStatus={autoStatus[m.id]}
            targetHeight={autoProxyHeight}
            autoProgress={autoProgress[m.id]}
            retryInfo={retryQueue[m.id]}
            // Bấm tay cũng qua job async có % + retry queue (đợt 85 M8),
            // announce=true để toast thành công như hành vi Q8 cũ.
            onMakeProxy={(item) => void runProxyForItem(item, autoProxyHeight, { announce: true })}
            onRetryNow={(item) => retryProxyNow(item)}
          />
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
