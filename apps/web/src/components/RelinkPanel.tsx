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

export interface RelinkPick {
  oldSrc: string;
  file: File;
}

interface Props {
  /** Danh sách asset thiếu (cập nhật dần khi relink xong từng cái). */
  missing: MissingAsset[];
  /** User chọn file cho 1 asset → parent xử lý import + cập nhật spec. */
  onPick: (pick: RelinkPick) => Promise<{ ok: boolean; message: string }>;
  /** Đóng panel (bỏ qua các asset còn thiếu). */
  onClose: () => void;
}

const KIND_ORDER: RelinkableKind[] = ["video", "audio", "image", "sticker"];

export function RelinkPanel({ missing, onPick, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const res = await onPick({ oldSrc: activeSrc, file: f });
      if (!res.ok) setError(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định khi relink.");
    } finally {
      setBusy(false);
      setActiveSrc(null);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-label="Media thiếu">
        <div className="modal-head">
          <span>🔗 Media thiếu ({missing.length})</span>
          <button className="icon-btn" onClick={onClose} title="Đóng (bỏ qua)">
            ✕
          </button>
        </div>
        <div style={{ padding: "12px 18px", fontSize: 13, color: "var(--muted)" }}>
          Project này dùng {missing.length} file media chưa có trong phiên làm việc. Chọn lại từng
          file để tiếp tục dựng — clip thiếu sẽ hiện placeholder cho tới khi được relink.
        </div>
        {error && (
          <div className="valid-banner" style={{ color: "var(--danger)" }}>
            ⚠️ {error}
          </div>
        )}
        <div style={{ overflowY: "auto", padding: "4px 18px 12px" }}>
          {sorted.map((m) => {
            const meta = RELINK_KIND_META[m.kind];
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
                    {meta.label} · dùng trong {m.clipCount} clip
                    {m.trackLabels.length > 0 && ` (${m.trackLabels.join(", ")})`}
                  </div>
                </div>
                <button
                  disabled={busy}
                  onClick={() => startPick(m.src)}
                  title={`Chọn file thay thế cho ${m.src}`}
                >
                  {busy && activeSrc === m.src ? "⏳ Đang đọc…" : "🔗 Chọn lại"}
                </button>
              </div>
            );
          })}
        </div>
        <div className="modal-actions" style={{ padding: "12px 18px" }}>
          <button onClick={onClose}>Bỏ qua — dựng tiếp với placeholder</button>
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
