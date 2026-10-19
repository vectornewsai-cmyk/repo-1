/**
 * EffectPanel — Panel VIDEO EFFECTS cho clip video đang chọn.
 *
 * Tự đọc selection từ store nên tích hợp chỉ cần 1 dòng, ví dụ trong Inspector:
 *   {clip.kind === "video" && <EffectPanel />}
 *
 * Hành vi (khớp ngữ nghĩa trong packages/video-spec/src/effects.ts):
 * - Danh sách 7 hiệu ứng, mỗi cái có toggle bật/tắt + slider cường độ 0..1.
 * - Bật: thêm { type, intensity } vào clip.effects (mỗi loại 1 lần).
 * - Tắt: xóa khỏi mảng; mảng rỗng → effects = undefined (sạch spec).
 * - Slider: cập nhật intensity của effect đã bật.
 * - Hiệu lực ở RENDER (FFmpeg filter native) — preview trên web chưa
 *   hiển thị hiệu ứng (xem EFFECTS_LIMITS.md).
 */
import { useState } from "react";
import { useStore } from "../../store";
import "./effects.css";
import {
  EFFECT_META,
  EFFECT_TYPES,
  validateVideoEffects,
  type VideoEffect,
  type VideoEffectType,
} from "../../../../../packages/video-spec/src/effects";

type ClipWithEffects = { effects?: VideoEffect[] };

export function EffectPanel() {
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const [warn, setWarn] = useState<string | null>(null);

  if (!selection) return null;
  const track = spec.tracks.find((t) => t.id === selection.trackId);
  const clip = track?.clips.find((c) => c.id === selection.clipId);
  if (!track || !clip || clip.kind !== "video") return null;

  const st = useStore.getState();
  const effects = (clip as unknown as ClipWithEffects).effects ?? [];
  const byType = new Map(effects.map((e) => [e.type, e]));

  const applyPatch = (next: VideoEffect[] | undefined) => {
    const errs = validateVideoEffects(next);
    if (errs.length > 0) {
      setWarn(errs[0]);
      return;
    }
    setWarn(null);
    st.patchClip(track.id, clip.id, { effects: next } as Partial<typeof clip>);
  };

  const toggle = (type: VideoEffectType) => {
    if (byType.has(type)) {
      const next = effects.filter((e) => e.type !== type);
      applyPatch(next.length > 0 ? next : undefined);
    } else {
      applyPatch([...effects, { type, intensity: 0.5 }]);
    }
  };

  const setIntensity = (type: VideoEffectType, intensity: number) => {
    const v = Math.min(1, Math.max(0, Math.round(intensity * 100) / 100));
    applyPatch(effects.map((e) => (e.type === type ? { ...e, intensity: v } : e)));
  };

  return (
    <div className="effects-panel">
      {warn && <p className="warn">{warn}</p>}
      <div className="fx-list">
        {EFFECT_TYPES.map((type) => {
          const meta = EFFECT_META[type];
          const active = byType.get(type);
          return (
            <div key={type} className={`fx-item${active ? " on" : ""}`}>
              <button
                className={`fx-toggle${active ? " on" : ""}`}
                onClick={() => toggle(type)}
                title={meta.description}
              >
                <span className="fx-check">{active ? "☑" : "☐"}</span>
                <span className="fx-name">{meta.label}</span>
              </button>
              {active && (
                <label className="fx-slider">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((active.intensity ?? 0.5) * 100)}
                    onChange={(e) => setIntensity(type, Number(e.target.value) / 100)}
                  />
                  <span className="fx-val">
                    {type === "brightness"
                      ? (active.intensity ?? 0.5) < 0.5
                        ? `tối ${Math.round((0.5 - (active.intensity ?? 0.5)) * 200)}%`
                        : (active.intensity ?? 0.5) > 0.5
                          ? `sáng ${Math.round(((active.intensity ?? 0.5) - 0.5) * 200)}%`
                          : "gốc"
                      : `${Math.round((active.intensity ?? 0.5) * 100)}%`}
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>
      {effects.length > 0 && (
        <p className="tips">💡 Hiệu ứng áp theo thứ tự từ trên xuống. Xem kết quả sau khi render.</p>
      )}
    </div>
  );
}
