/**
 * StickerPanel — Thư viện sticker + chỉnh sticker đang chọn.
 *
 * Self-contained: tự đọc selection từ store. Tích hợp 1 dòng trong Inspector:
 *   <StickerPanel />
 *
 * Hành vi:
 * - Chưa chọn gì (hoặc chọn clip không phải sticker): hiện thư viện 6 sticker
 *   mẫu + nút tải PNG riêng. Bấm vào sticker → thêm vào timeline tại playhead
 *   (tự tạo track "sticker" nếu chưa có).
 * - Đang chọn sticker clip: hiện slider vị trí (x/y), kích thước, độ mờ, xoay.
 *
 * LƯU Ý TÍCH HỢP (cho agent chính): TrackKind trong index.ts/store.ts chưa có
 * "sticker" nên file này dùng cast có chủ đích (đánh dấu [STICKER-CAST]).
 * Khi index.ts thêm "sticker" vào union thì bỏ cast.
 */
import { useRef, useState } from "react";
import { useStore } from "../../store";
import { uid } from "../../lib";
import "./sticker.css";
import {
  STICKER_CATEGORIES,
  STICKER_LIBRARY,
  isStickerClip,
  normalizeStickerClip,
  stickerUrl,
  validateStickerClip,
  type StickerCategory,
  type StickerClip,
} from "../../../../../packages/video-spec/src/sticker";
// TODO(parent): đổi thành `from "@repo-1/video-spec"` sau khi index.ts re-export ./sticker

function NumRow({
  label, value, min, max, step, format, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}: <b>{format(value)}</b></span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/** Thêm sticker clip vào timeline tại playhead (dùng setState trực tiếp vì store chưa có action). */
function addStickerToTimeline(src: string) {
  const st = useStore.getState();
  // [STICKER-CAST] kind "sticker" chưa có trong union TrackKind
  type AnyTrack = { id: string; kind: string; label?: string; clips: unknown[] };
  const tracks = st.spec.tracks as unknown as AnyTrack[];
  let track = tracks.find((t) => t.kind === "sticker");
  let trackId = track?.id;
  if (!trackId) {
    trackId = st.addTrack("sticker" as never);
  }
  const clip: StickerClip = {
    kind: "sticker",
    id: uid("c"),
    src,
    start: Math.max(0, st.playhead),
    duration: 3,
    x: 0.5, y: 0.5, scale: 0.25, opacity: 1, rotation: 0,
  };
  const errs = validateStickerClip(clip);
  if (errs.length > 0) return errs.join("; ");
  useStore.setState((s) => {
    const ts = (s.spec.tracks as unknown as AnyTrack[]).map((t) =>
      t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t,
    );
    return {
      // [STICKER-CAST] trả về Track[] sau khi index.ts có union "sticker"
      spec: { ...s.spec, tracks: ts as unknown as typeof s.spec.tracks },
      selection: [{ trackId: trackId as string, clipId: clip.id }],
    };
  });
  return null;
}

function StickerEditor({ clip, trackId }: { clip: StickerClip; trackId: string }) {
  const st = useStore.getState();
  const n = normalizeStickerClip(clip);
  const patch = (p: Partial<StickerClip>) =>
    // [STICKER-CAST] Partial<StickerClip> chưa thuộc union Partial<Clip>
    st.patchClip(trackId, clip.id, p as unknown as Parameters<typeof st.patchClip>[2]);

  return (
    <div className="sticker-editor">
      <div className="sticker-preview-row">
        <img src={stickerPreviewSrc(clip.src)} alt="" className="sticker-thumb" />
        <div>
          <b>{clip.src.split("/").pop()}</b>
          <div className="muted">Sticker đang chọn</div>
        </div>
      </div>
      <NumRow label="Vị trí ngang" value={n.x} min={0} max={1} step={0.01}
        format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => patch({ x: v })} />
      <NumRow label="Vị trí dọc" value={n.y} min={0} max={1} step={0.01}
        format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => patch({ y: v })} />
      <NumRow label="Kích thước" value={n.scale} min={0.05} max={1} step={0.01}
        format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => patch({ scale: v })} />
      <NumRow label="Độ mờ" value={n.opacity} min={0} max={1} step={0.01}
        format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => patch({ opacity: v })} />
      <NumRow label="Xoay" value={n.rotation} min={-180} max={180} step={1}
        format={(v) => `${Math.round(v)}°`} onChange={(v) => patch({ rotation: v })} />
      <p className="tips">💡 Sticker hiện khi render video. Preview trực tiếp trên canvas sẽ có sau khi agent chính tích hợp.</p>
    </div>
  );
}

/** src có thể là tên file thư viện ("star.png") hoặc blob URL / đường dẫn upload. */
function stickerPreviewSrc(src: string): string {
  if (/^(blob:|https?:|data:)/.test(src) || src.startsWith("/")) return src;
  return stickerUrl(src);
}

export function StickerPanel() {
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | StickerCategory>("all");
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const primary = selection[0] ?? null;
  const track = primary
    ? spec.tracks.find((t) => t.id === primary.trackId)
    : undefined;
  const rawClip = track?.clips.find((c) => c.id === primary?.clipId);
  const stickerClip = rawClip && isStickerClip(rawClip) ? rawClip : null;

  const pick = (file: string) => {
    setErr(null);
    const e = addStickerToTimeline(file);
    if (e) setErr(e);
  };

  const onUpload = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setErr("Chỉ nhận file ảnh (PNG trong suốt đẹp nhất)."); return; }
    const url = URL.createObjectURL(f);
    setErr(null);
    const e = addStickerToTimeline(url);
    if (e) { setErr(e); URL.revokeObjectURL(url); }
  };

  const q = query.trim().toLowerCase();
  const visible = STICKER_LIBRARY.filter(
    (s) =>
      (tab === "all" || s.category === tab) &&
      (q === "" || s.label.toLowerCase().includes(q)),
  );

  return (
    <div className="sticker-panel">
      <div className="panel-head" style={{ marginTop: 12 }}>🌟 Sticker</div>

      {stickerClip && track ? (
        <StickerEditor clip={stickerClip} trackId={track.id} />
      ) : (
        <>
          <p className="tips">Bấm vào sticker để dán lên video tại vị trí playhead (3 giây).</p>
          <input
            className="sticker-search"
            type="search"
            placeholder="🔍 Tìm sticker…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="sticker-tabs">
            <button
              className={tab === "all" ? "active" : ""}
              onClick={() => setTab("all")}
            >
              Tất cả ({STICKER_LIBRARY.length})
            </button>
            {STICKER_CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={tab === c.id ? "active" : ""}
                onClick={() => setTab(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="sticker-grid">
            {visible.map((s) => (
              <button
                key={s.file}
                className="sticker-cell"
                title={s.label}
                onClick={() => pick(s.file)}
              >
                <img src={stickerUrl(s.file)} alt={s.label} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          {visible.length === 0 && (
            <p className="muted">Không tìm thấy sticker nào cho "{query}".</p>
          )}
          <button className="toggle" onClick={() => fileRef.current?.click()}>
            ⬆ Tải PNG của bạn…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value = ""; }}
          />
        </>
      )}
      {err && <p className="warn">{err}</p>}
    </div>
  );
}
