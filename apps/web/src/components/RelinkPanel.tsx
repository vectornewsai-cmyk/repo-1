/**
 * RelinkPanel — Panel "Media thiếu" (R1-033, Batch C).
 *
 * Hiện sau khi mở project nếu có clip trỏ tới src không resolve được.
 * Mỗi asset thiếu: hiển thị loại, tên file, số clip dùng → nút "Chọn lại"
 * mở file picker; sau khi user chọn file, verify đọc được rồi cập nhật clip.
 */
import { useRef, useState } from "react";
import {
  RELINK_ACCEPT,
  RELINK_KIND_META,
  type MissingAsset,
  type RelinkableKind,
} from "../lib/relink";
import type { IngestProgressEvent } from "../lib/ingestProgress39T5";
import { formatBytes, ingestPercent } from "../lib/ingestProgress39T5";
import { t as i18nT, useLang } from "../i18n";
import type { StaleAliasReport } from "../lib/assetStore";

export interface RelinkPick {
  oldSrc: string;
  file: File;
}

/** Callback tiến trình ingest mà RelinkPanel truyền xuống store (đợt 39 T5). */
export type RelinkProgressCallback = (ev: IngestProgressEvent) => void;

interface Props {
  /** Danh sách asset thiếu (cập nhật dần khi relink xong từng cái). */
  missing: MissingAsset[];
  /**
   * User chọn file cho 1 asset → parent xử lý import + cập nhật spec.
   * Tham số thứ hai là callback tiến trình: parent (store.relinkMedia)
   * gọi nó trong lúc ingest để panel hiện %/byte thật thay vì spinner mù.
   */
  onPick: (pick: RelinkPick, onProgress?: RelinkProgressCallback) => Promise<{ ok: boolean; message: string }>;
  /** Dọn alias thừa (đợt 39 T5) — tuỳ chọn, App nối tới store.cleanupStaleAliases. */
  onCleanupAliases?: () => Promise<StaleAliasReport>;
  /** Đóng panel (bỏ qua các asset còn thiếu). */
  onClose: () => void;
}

const KIND_ORDER: RelinkableKind[] = ["video", "audio", "image", "sticker"];

export function RelinkPanel({ missing, onPick, onCleanupAliases, onClose }: Props) {
  useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Đợt 39 T5 — tiến trình ingest thật (không spinner mù): sự kiện mới
  // nhất từ store + tên file đang relink. Khi chưa có sự kiện ingest
  // (đang probe file), panel vẫn hiện tên file + dung lượng — cụ thể,
  // không phải spinner trơ.
  const [progress, setProgress] = useState<IngestProgressEvent | null>(null);
  const [progressFile, setProgressFile] = useState<string | null>(null);
  const [progressSize, setProgressSize] = useState<number>(0);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupMsg, setCleanupMsg] = useState<string | null>(null);

  const active = missing.find((m) => m.src === activeSrc) ?? null;
  const sorted = [...missing].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.src.localeCompare(b.src),
  );

  const startPick = (src: string) => {
    setActiveSrc(src);
    setError(null);
    // mở picker ở tick sau để ref input đã set accept đúng loại
    setTimeout(() => fileRef.current?.click(), 0);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !activeSrc) return;
    setBusy(true);
    setError(null);
    setProgressFile(f.name);
    setProgressSize(f.size);
    setProgress(null);
    try {
      const res = await onPick({ oldSrc: activeSrc, file: f }, (ev) => setProgress(ev));
      if (!res.ok) setError(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18nT("relink.unknownError"));
    } finally {
      setBusy(false);
      setActiveSrc(null);
      setProgress(null);
      setProgressFile(null);
      setProgressSize(0);
    }
  };

  const onCleanup = async () => {
    if (!onCleanupAliases || cleaning || busy) return;
    setCleaning(true);
    setCleanupMsg(null);
    setError(null);
    try {
      const report = await onCleanupAliases();
      setCleanupMsg(
        report.removed.length > 0
          ? i18nT("relink.cleanupDone", {
              removed: String(report.removed.length),
              cleaned: String(report.cleaned),
              scanned: String(report.scanned),
            })
          : i18nT("relink.cleanupNone", { scanned: String(report.scanned) }),
      );
    } catch (err) {
      setError(
        i18nT("relink.cleanupError", {
          detail: err instanceof Error ? err.message : i18nT("relink.unknownErrorShort"),
        }),
      );
    } finally {
      setCleaning(false);
    }
  };

  // Nhãn tiến trình: luôn nêu rõ pha + số liệu cụ thể. Pha "storing"
  // không có % theo byte (IDB put nguyên tử) nên chỉ nêu "đang ghi",
  // KHÔNG bịa thanh % cho pha này.
  const progressText = (() => {
    if (!busy || !progressFile) return null;
    if (!progress) {
      return i18nT("relink.reading", { name: progressFile, size: formatBytes(progressSize) });
    }
    if (progress.phase === "hashing") {
      return i18nT("relink.hashing", {
        done: formatBytes(progress.bytesDone),
        total: formatBytes(progress.totalBytes),
        percent: String(ingestPercent(progress)),
      });
    }
    if (progress.phase === "storing") {
      return i18nT("relink.storing", { name: progressFile, total: formatBytes(progress.totalBytes) });
    }
    return i18nT("relink.done", { name: progressFile, total: formatBytes(progress.totalBytes) });
  })();

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-label={i18nT("relink.title")}>
        <div className="modal-head">
          <span>{i18nT("relink.titleCount", { n: String(missing.length) })}</span>
          <button className="icon-btn" onClick={onClose} title={i18nT("relink.closeSkip")}>
            ✕
          </button>
        </div>
        <div style={{ padding: "12px 18px", fontSize: 13, color: "var(--muted)" }}>
          {i18nT("relink.intro", { n: String(missing.length) })}
        </div>
        {error && (
          <div className="valid-banner" style={{ color: "var(--danger)" }}>
            ⚠️ {error}
          </div>
        )}
        {progressText && (
          <div
            className="valid-banner"
            role="status"
            aria-live="polite"
            style={{ fontSize: 13 }}
          >
            ⏳ {progressText}
            {progress && progress.phase === "hashing" && progress.totalBytes > 0 && (
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
                    width: `${ingestPercent(progress)}%`,
                    background: "var(--accent, #4da3ff)",
                  }}
                />
              </div>
            )}
          </div>
        )}
        {cleanupMsg && (
          <div className="valid-banner" style={{ fontSize: 13 }}>
            🧹 {cleanupMsg}
          </div>
        )}
        <div style={{ overflowY: "auto", padding: "4px 18px 12px" }}>
          {sorted.map((m) => {
            const meta = RELINK_KIND_META[m.kind];
            // Đợt 26 J2: phân biệt lá thiếu trong nested với clip cấp cao.
            const nestedChains = m.nestedChains ?? [];
            const topN = m.topLevelClipCount ?? m.clipCount;
            const nestedN = m.nestedClipCount ?? 0;
            return (
              <div
                key={m.src}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border-soft)",
                }}
              >
                <span style={{ fontSize: 20 }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={m.src}
                  >
                    {m.src}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {i18nT("relink.usedIn", { label: meta.label, n: String(m.clipCount) })}
                    {nestedN > 0 && topN > 0 && i18nT("relink.usedTopAndNested", { top: String(topN), nested: String(nestedN) })}
                    {nestedN > 0 && topN === 0 && i18nT("relink.usedNestedOnly")}
                    {m.trackLabels.length > 0 && ` (${m.trackLabels.join(", ")})`}
                  </div>
                  {nestedChains.length > 0 && (
                    <div
                      style={{ fontSize: 12, color: "var(--muted)" }}
                      title={nestedChains.join("; ")}
                    >
                      📦 Trong nested: {nestedChains.join("; ")}
                    </div>
                  )}
                </div>
                <button
                  disabled={busy}
                  onClick={() => startPick(m.src)}
                  title={i18nT("relink.pickFile", { src: m.src })}
                >
                  {busy && activeSrc === m.src ? i18nT("relink.readingBtn") : i18nT("relink.repick")}
                </button>
              </div>
            );
          })}
        </div>
        <div className="modal-actions" style={{ padding: "12px 18px", gap: 8 }}>
          {onCleanupAliases && (
            <button disabled={busy || cleaning} onClick={() => void onCleanup()} title={i18nT("relink.cleanupAlias")}>
              {cleaning ? i18nT("relink.cleaning") : `🧹 ${i18nT("relink.cleanup")}`}
            </button>
          )}
          <button onClick={onClose}>{i18nT("relink.skipPlaceholder")}</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          style={{ display: "none" }}
          accept={active ? RELINK_ACCEPT[active.kind] : "*/*"}
          onChange={(e) => void onFile(e)}
        />
      </div>
    </div>
  );
}
