/**
 * ChromaPanel — Panel XOÁ PHÔNG XANH (chroma key) cho clip video đang chọn.
 *
 * Tự đọc selection từ store nên tích hợp chỉ cần 1 dòng, ví dụ trong Inspector:
 *   {clip.kind === "video" && <ChromaPanel />}
 *
 * Hành vi (khớp ngữ nghĩa trong packages/video-spec/src/chroma.ts):
 * - Toggle bật/tắt: bật thì gán chromaKey với giá trị mặc định
 *   { color: "#00FF00", similarity: 0.3, blend: 0.1 }.
 * - Color picker + 2 preset (xanh lá / xanh dương).
 * - Slider similarity (0..1) và blend (0..1).
 * - Hiệu lực ở RENDER (FFmpeg filter chromakey) — preview trên web chưa
 *   hiển thị hiệu ứng xoá phông (xem CHROMA_LIMITS.md).
 */
import { useState } from "react";
import { useStore } from "../../store";
import "./chroma.css";
import { t as i18nT, useLang } from "../../i18n";
import {
  CHROMA_DEFAULTS,
  CHROMA_PRESETS,
  validateChromaKey,
  type ChromaKey,
} from "../../../../../packages/video-spec/src/chroma";

export function ChromaPanel() {
  useLang();
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const [warn, setWarn] = useState<string | null>(null);

  const primary = selection[0] ?? null;
  if (!primary) return null;
  const track = spec.tracks.find((t) => t.id === primary.trackId);
  const clip = track?.clips.find((c) => c.id === primary.clipId);
  if (!track || !clip || clip.kind !== "video") return null;

  const st = useStore.getState();
  // chromaKey có thể chưa có trong type của store (do module augmentation) —
  // đọc qua unknown để type-check an toàn.
  const chroma = (clip as unknown as { chromaKey?: ChromaKey }).chromaKey ?? null;

  const applyPatch = (c: ChromaKey | undefined) => {
    if (c) {
      const errs = validateChromaKey(c);
      if (errs.length > 0) {
        setWarn(errs[0]);
        return;
      }
    }
    setWarn(null);
    st.patchClip(track.id, clip.id, { chromaKey: c } as Partial<typeof clip>);
  };

  const toggle = () => {
    if (chroma) applyPatch(undefined);
    else applyPatch({ ...CHROMA_DEFAULTS });
  };

  const setColor = (color: string) => {
    applyPatch({ ...(chroma ?? CHROMA_DEFAULTS), color });
  };

  const setSimilarity = (similarity: number) => {
    applyPatch({ ...(chroma ?? CHROMA_DEFAULTS), similarity });
  };

  const setBlend = (blend: number) => {
    applyPatch({ ...(chroma ?? CHROMA_DEFAULTS), blend });
  };

  return (
    <div className="chroma-panel">
      <div className="panel-head" style={{ marginTop: 12 }}>{i18nT("chroma.head")}</div>

      <div className="btn-row">
        <button
          className={chroma ? "toggle on" : "toggle"}
          onClick={toggle}
          title={i18nT("chroma.toggleTitle")}
        >
          {chroma ? i18nT("chroma.on") : i18nT("chroma.off")}
        </button>
      </div>

      {chroma && (
        <>
          <label className="field">
            <span>{i18nT("chroma.colorLabel")}</span>
            <div className="chroma-color-row">
              <input
                type="color"
                value={chroma.color}
                onChange={(e) => setColor(e.target.value)}
                title={i18nT("chroma.colorTitle")}
              />
              <span className="chroma-hex">{chroma.color.toUpperCase()}</span>
            </div>
          </label>

          <div className="btn-row chroma-presets">
            {CHROMA_PRESETS.map((p) => (
              <button
                key={p.color}
                className={chroma.color.toUpperCase() === p.color ? "toggle on" : "toggle"}
                onClick={() => setColor(p.color)}
                title={p.label}
              >
                <span
                  className="chroma-swatch"
                  style={{ backgroundColor: p.color }}
                />
                {p.label}
              </button>
            ))}
          </div>

          <label className="field">
            <span>
              {i18nT("chroma.sensLabel")}: <b>{Math.round((chroma.similarity ?? 0.3) * 100)}%</b>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((chroma.similarity ?? 0.3) * 100)}
              onChange={(e) => setSimilarity(Number(e.target.value) / 100)}
              title={i18nT("chroma.sensTitle")}
            />
          </label>

          <label className="field">
            <span>
              {i18nT("chroma.blendLabel")}: <b>{Math.round((chroma.blend ?? 0.1) * 100)}%</b>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((chroma.blend ?? 0.1) * 100)}
              onChange={(e) => setBlend(Number(e.target.value) / 100)}
              title={i18nT("chroma.blendTitle")}
            />
          </label>
        </>
      )}

      {warn && <p className="warn">{warn}</p>}
      {!warn && (
        <p className="tips">
          {i18nT("chroma.tip")}
        </p>
      )}
    </div>
  );
}
