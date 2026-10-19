/**
 * KeyframePanel — panel chỉnh keyframe animation cho clip đang chọn.
 *
 * KHÔNG sửa file nào có sẵn: component độc lập, parent (hoặc agent khác) chỉ cần
 * render <KeyframePanel /> ở vị trí mong muốn trong Inspector (xem README.md).
 *
 * Import từ "../../../../packages/video-spec/src/keyframes" (đường dẫn tương đối
 * nội bộ monorepo) vì package.json của @repo-1/video-spec chỉ export "." —
 * khi index.ts chính thức export keyframes thì đổi sang "@repo-1/video-spec".
 * Import này cũng kích hoạt module augmentation gắn `clip.animations`.
 */
import { useEffect, useRef, useState } from "react";
import { useStore } from "../../store";
import { clamp } from "../../lib";
import {
  ANIMATABLE_PROPS,
  EASING_LABEL,
  EASINGS,
  PROP_META,
  formatPropValue,
  interpolateKeyframes,
  normalizeKeyframes,
  validateAnimations,
  type AnimatableProp,
  type ClipAnimations,
  type Easing,
  type Keyframe,
} from "@repo-1/video-spec";
import "./keyframes.css";

function NumField({
  label,
  value,
  step = 0.05,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field kf-num">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={Number(value.toFixed(3))}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </label>
  );
}

/** Index của keyframe gần thời điểm t nhất. */
function nearestIdx(kfs: Keyframe[], t: number): number {
  let best = 0;
  let bestD = Infinity;
  kfs.forEach((k, i) => {
    const d = Math.abs(k.t - t);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

export function KeyframePanel() {
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const playhead = useStore((s) => s.playhead);
  const st = useStore.getState();

  const [activeProp, setActiveProp] = useState<AnimatableProp>("x");
  const [selIdx, setSelIdx] = useState(-1);
  const laneRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(-1);

  useEffect(() => {
    setSelIdx(-1);
    dragRef.current = -1;
  }, [selection?.clipId, activeProp]);

  if (!selection) {
    return (
      <div className="kf-panel">
        <div className="panel-head">🔑 Keyframe</div>
        <p className="tips">Chọn một clip <b>video</b> hoặc <b>chữ</b> trên timeline để chỉnh keyframe animation.</p>
      </div>
    );
  }
  const track = spec.tracks.find((t) => t.id === selection.trackId);
  const clip = track?.clips.find((c) => c.id === selection.clipId);
  if (!track || !clip) {
    return (
      <div className="kf-panel">
        <div className="panel-head">🔑 Keyframe</div>
        <p className="tips">Clip không còn tồn tại.</p>
      </div>
    );
  }
  if (clip.kind === "audio" || clip.kind === "sticker") {
    return (
      <div className="kf-panel">
        <div className="panel-head">🔑 Keyframe</div>
        <p className="tips">Keyframe chưa hỗ trợ cho {clip.kind === "audio" ? "clip âm thanh" : "sticker"} (chỉ video và chữ).</p>
      </div>
    );
  }

  // Từ đây clip là VideoClip | TextClip — `animations` có nhờ module augmentation.
  const anims: ClipAnimations = clip.animations ?? {};
  const kfs = normalizeKeyframes(anims[activeProp]?.keyframes ?? []);
  const meta = PROP_META[activeProp];
  const localT = clamp(playhead - clip.start, 0, clip.duration);
  const selKf = selIdx >= 0 && selIdx < kfs.length ? kfs[selIdx] : null;
  const issues = validateAnimations(anims, clip.duration);

  const writeProp = (prop: AnimatableProp, nextKfs: Keyframe[] | undefined) => {
    const next: ClipAnimations = { ...(clip.animations ?? {}) };
    if (!nextKfs || nextKfs.length === 0) delete next[prop];
    else next[prop] = { keyframes: nextKfs };
    st.patchClip(track.id, clip.id, { animations: next });
  };

  const reselect = (arr: Keyframe[], updated: Keyframe) => {
    const idx = arr.indexOf(updated);
    setSelIdx(idx >= 0 ? idx : nearestIdx(arr, updated.t));
  };

  const addKeyframeAt = (t: number) => {
    const tc = clamp(t, 0, clip.duration);
    const v = kfs.length > 0 ? interpolateKeyframes(kfs, tc) : meta.def;
    const nk: Keyframe = { t: tc, v: clamp(v, meta.min, meta.max), easing: "linear" };
    const arr = normalizeKeyframes([...kfs, nk]);
    writeProp(activeProp, arr);
    reselect(arr, nk);
  };

  const updateSelected = (patch: Partial<Keyframe>) => {
    if (!selKf) return;
    const updated: Keyframe = {
      ...selKf,
      ...patch,
      t: clamp(patch.t ?? selKf.t, 0, clip.duration),
      v: clamp(patch.v ?? selKf.v, meta.min, meta.max),
    };
    const arr = normalizeKeyframes(kfs.map((k) => (k === selKf ? updated : k)));
    writeProp(activeProp, arr);
    reselect(arr, updated);
  };

  const deleteSelected = () => {
    if (!selKf) return;
    const arr = kfs.filter((k) => k !== selKf);
    writeProp(activeProp, arr.length > 0 ? arr : undefined);
    setSelIdx(-1);
  };

  const laneTime = (clientX: number): number => {
    const el = laneRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return clamp((clientX - r.left) / r.width, 0, 1) * clip.duration;
  };

  const onMarkerDown = (e: React.PointerEvent, i: number) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSelIdx(i);
    dragRef.current = i;
  };
  const onMarkerMove = (e: React.PointerEvent, i: number) => {
    if (dragRef.current !== i) return;
    const updated: Keyframe = { ...kfs[i], t: laneTime(e.clientX) };
    const arr = normalizeKeyframes(kfs.map((k, j) => (j === i ? updated : k)));
    writeProp(activeProp, arr);
    const idx = arr.indexOf(updated);
    setSelIdx(idx >= 0 ? idx : nearestIdx(arr, updated.t));
  };
  const onMarkerUp = () => {
    dragRef.current = -1;
  };

  let liveValue: string | null = null;
  if (kfs.length > 0) {
    try {
      liveValue = formatPropValue(activeProp, interpolateKeyframes(kfs, localT));
    } catch {
      liveValue = null;
    }
  }

  return (
    <div className="kf-panel">
      <div className="panel-head">
        <span>🔑 Keyframe</span>
        <span className="kf-count">{kfs.length} điểm</span>
      </div>

      <div className="kf-tabs">
        {ANIMATABLE_PROPS.map((p) => {
          const n = anims[p]?.keyframes.length ?? 0;
          return (
            <button
              key={p}
              className={"kf-tab" + (p === activeProp ? " active" : "") + (n > 0 ? " has" : "")}
              onClick={() => setActiveProp(p)}
              title={PROP_META[p].hint}
            >
              {PROP_META[p].label.split(" ")[0]}
              {n > 0 && <i>{n}</i>}
            </button>
          );
        })}
      </div>
      <p className="kf-hint">{meta.hint}</p>

      <div
        ref={laneRef}
        className="kf-lane"
        title="Nhấp đúp để thêm keyframe tại vị trí này"
        onDoubleClick={(e) => addKeyframeAt(laneTime(e.clientX))}
      >
        <div className="kf-lane-playhead" style={{ left: `${(localT / clip.duration) * 100}%` }} />
        {kfs.map((k, i) => (
          <div
            key={`${k.t}-${i}`}
            className={"kf-diamond" + (i === selIdx ? " sel" : "")}
            style={{ left: `${(k.t / clip.duration) * 100}%` }}
            title={`t=${k.t.toFixed(2)}s, v=${formatPropValue(activeProp, k.v)}`}
            onPointerDown={(e) => onMarkerDown(e, i)}
            onPointerMove={(e) => onMarkerMove(e, i)}
            onPointerUp={onMarkerUp}
            onPointerCancel={onMarkerUp}
          />
        ))}
        {kfs.length === 0 && (
          <div className="kf-lane-empty">Nhấp đúp (hoặc nút +) để thêm keyframe</div>
        )}
      </div>

      <div className="btn-row kf-actions">
        <button className="primary" onClick={() => addKeyframeAt(localT)} title="Thêm keyframe tại vị trí playhead">
          ➕ Thêm tại playhead
        </button>
        <button onClick={deleteSelected} disabled={!selKf} title="Xoá keyframe đang chọn">
          🗑 Xoá
        </button>
      </div>

      {selKf && (
        <div className="kf-editor">
          <div className="field-row">
            <NumField label="Thời điểm (s)" value={selKf.t} min={0} max={clip.duration} onChange={(v) => updateSelected({ t: v })} />
            <NumField label={`Giá trị${meta.unit ? ` (${meta.unit})` : ""}`} value={selKf.v} step={meta.step} min={meta.min} max={meta.max} onChange={(v) => updateSelected({ v })} />
          </div>
          <label className="field">
            <span>Easing (áp dụng cho đoạn từ keyframe này tới keyframe kế tiếp)</span>
            <select value={selKf.easing} onChange={(e) => updateSelected({ easing: e.target.value as Easing })}>
              {EASINGS.map((ez) => (
                <option key={ez} value={ez}>{EASING_LABEL[ez]}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Kéo thanh để đổi giá trị</span>
            <input
              type="range" min={meta.min} max={meta.max} step={meta.step}
              value={clamp(selKf.v, meta.min, meta.max)}
              onChange={(e) => updateSelected({ v: Number(e.target.value) })}
            />
          </label>
        </div>
      )}

      <div className="kf-live">
        <div className="kf-live-row">
          <span>Giá trị {meta.label.toLowerCase()} tại playhead ({localT.toFixed(2)}s)</span>
          <b>{liveValue ?? "—"}</b>
        </div>
        {ANIMATABLE_PROPS.filter((p) => p !== activeProp && (anims[p]?.keyframes.length ?? 0) > 0).map((p) => {
          let v: string | null = null;
          try {
            v = formatPropValue(p, interpolateKeyframes(anims[p]!.keyframes, localT));
          } catch {
            v = null;
          }
          return (
            <div className="kf-live-row dim" key={p}>
              <span>{PROP_META[p].label}</span>
              <b>{v ?? "—"}</b>
            </div>
          );
        })}
      </div>

      {issues.length > 0 && (
        <ul className="issues kf-issues">
          {issues.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}

      <p className="tips">
        💡 Render FFmpeg hiện hỗ trợ keyframe <b>X, Y, Độ mờ</b> cho chữ và <b>X, Y</b> cho video.
        Tỉ lệ / Xoay được lưu trong spec nhưng chưa render — xem <code>server/render/src/KEYFRAMES_LIMITS.md</code>.
      </p>
    </div>
  );
}
