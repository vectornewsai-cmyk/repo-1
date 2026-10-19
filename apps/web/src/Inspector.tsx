/**
 * Panel thuộc tính bên phải:
 * - chọn clip chữ -> sửa nội dung, cỡ, màu, vị trí, hiệu ứng
 * - chọn clip video/audio -> opacity/volume/fade/transition, thời gian
 * - không chọn gì -> thông tin dự án + phím tắt
 */
import { useStore } from "./store";
import { fmtTime } from "./lib";
import { TransitionPanel } from "./components/transitions";
import { SpeedPanel } from "./components/speed";
import { KeyframePanel } from "./components/keyframes";
import { ChromaPanel } from "./components/chroma";
import { TextAnimPicker } from "./components/textfx";
import { LutPicker } from "./components/lut";
import { EffectPanel } from "./components/effects";

function NumField({
  label,
  value,
  step = 0.1,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        value={Number(value.toFixed(2))}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </label>
  );
}

function ProjectInfo() {
  const spec = useStore((s) => s.spec);
  const st = useStore.getState();
  const clips = spec.tracks.reduce((n, t) => n + t.clips.length, 0);
  return (
    <div className="inspector">
      <div className="panel-head">ℹ️ Dự án</div>
      <div className="info-rows">
        <div><span>Kích thước</span><b>{spec.meta.width} × {spec.meta.height}</b></div>
        <div><span>FPS</span><b>{spec.meta.fps}</b></div>
        <div><span>Thời lượng</span><b>{fmtTime(st.duration())}</b></div>
        <div><span>Track</span><b>{spec.tracks.length}</b></div>
        <div><span>Clip</span><b>{clips}</b></div>
      </div>
      <div className="panel-head" style={{ marginTop: 16 }}>⌨️ Phím tắt</div>
      <ul className="shortcuts">
        <li><kbd>Space</kbd> phát / tạm dừng</li>
        <li><kbd>S</kbd> tách clip tại playhead</li>
        <li><kbd>Delete</kbd> xoá clip đang chọn</li>
        <li>Kéo mép clip để trim in/out</li>
        <li>Kéo chữ ngay trên preview để di chuyển</li>
      </ul>
      <p className="tips">
        Bấm vào một clip trên timeline để chỉnh thuộc tính của nó ở đây.
      </p>
    </div>
  );
}

export function Inspector() {
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const st = useStore.getState();

  if (!selection) return <ProjectInfo />;
  const track = spec.tracks.find((t) => t.id === selection.trackId);
  const clip = track?.clips.find((c) => c.id === selection.clipId);
  if (!track || !clip) return <ProjectInfo />;

  const patch = (p: Parameters<typeof st.patchClip>[2]) =>
    st.patchClip(track.id, clip.id, p);

  return (
    <div className="inspector">
      <div className="panel-head">
        {clip.kind === "text" ? "🔤 Chữ" : clip.kind === "video" ? "🎬 Video" : "🎵 Âm thanh"}
      </div>

      {clip.kind === "text" && (
        <>
          <label className="field">
            <span>Nội dung</span>
            <textarea
              rows={2}
              value={clip.text}
              onChange={(e) => patch({ text: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Cỡ chữ: {clip.style.fontSize}px</span>
            <input
              type="range" min={16} max={160}
              value={clip.style.fontSize}
              onChange={(e) => st.patchTextStyle(track.id, clip.id, { fontSize: Number(e.target.value) })}
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Màu chữ</span>
              <input
                type="color"
                value={clip.style.color}
                onChange={(e) => st.patchTextStyle(track.id, clip.id, { color: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Màu nền</span>
              <input
                type="color"
                value={clip.style.backgroundColor ?? "#000000"}
                onChange={(e) => st.patchTextStyle(track.id, clip.id, { backgroundColor: e.target.value })}
              />
            </label>
          </div>
          <div className="btn-row">
            <button
              className={clip.style.bold ? "toggle on" : "toggle"}
              onClick={() => st.patchTextStyle(track.id, clip.id, { bold: !clip.style.bold })}
              title="In đậm"
            ><b>B</b></button>
            <button
              className={clip.style.italic ? "toggle on" : "toggle"}
              onClick={() => st.patchTextStyle(track.id, clip.id, { italic: !clip.style.italic })}
              title="In nghiêng"
            ><i>I</i></button>
            <button
              className="toggle"
              title={clip.style.backgroundColor ? "Tắt nền chữ" : "Bật nền chữ"}
              onClick={() =>
                st.patchTextStyle(track.id, clip.id, {
                  backgroundColor: clip.style.backgroundColor ? undefined : "#000000aa",
                })
              }
            >
              {clip.style.backgroundColor ? "⊠ Nền" : "☐ Nền"}
            </button>
          </div>
          <label className="field">
            <span>Hiệu ứng xuất hiện</span>
            <TextAnimPicker
              value={clip.style.animation ?? "none"}
              onChange={(anim) => st.patchTextStyle(track.id, clip.id, { animation: anim as never })}
            />
          </label>
          <label className="field">
            <span>Vị trí ngang: {Math.round((clip.style.x ?? 0.5) * 100)}%</span>
            <input
              type="range" min={0} max={100}
              value={Math.round((clip.style.x ?? 0.5) * 100)}
              onChange={(e) => st.patchTextStyle(track.id, clip.id, { x: Number(e.target.value) / 100 })}
            />
          </label>
          <label className="field">
            <span>Vị trí dọc: {Math.round((clip.style.y ?? 0.5) * 100)}%</span>
            <input
              type="range" min={0} max={100}
              value={Math.round((clip.style.y ?? 0.5) * 100)}
              onChange={(e) => st.patchTextStyle(track.id, clip.id, { y: Number(e.target.value) / 100 })}
            />
          </label>
          <p className="tips">💡 Mẹo: kéo chữ trực tiếp trên preview cũng được.</p>
          <div className="panel-head" style={{ marginTop: 12 }}>🎞️ Keyframe animation</div>
          <KeyframePanel />
        </>
      )}

      {clip.kind === "video" && (
        <>
          <label className="field">
            <span>Độ mờ: {Math.round((clip.opacity ?? 1) * 100)}%</span>
            <input
              type="range" min={5} max={100}
              value={Math.round((clip.opacity ?? 1) * 100)}
              onChange={(e) => patch({ opacity: Number(e.target.value) / 100 })}
            />
          </label>
          <div className="panel-head" style={{ marginTop: 12 }}>🔀 Chuyển cảnh</div>
          <TransitionPanel
            value={clip.transitionOut?.type ?? "none"}
            duration={clip.transitionOut?.duration ?? 0.5}
            onChange={(type, duration) =>
              patch({ transitionOut: { type: type as never, duration } })
            }
          />
          <div className="panel-head" style={{ marginTop: 12 }}>⏩ Tốc độ</div>
          <SpeedPanel />
          <div className="panel-head" style={{ marginTop: 12 }}>🎭 Xoá phông</div>
          <ChromaPanel />
          <div className="panel-head" style={{ marginTop: 12 }}>🎨 Bộ lọc màu</div>
          <LutPicker
            value={clip.filter?.lut}
            onChange={(lut) => patch({ filter: lut ? { lut } : undefined })}
          />
          <div className="panel-head" style={{ marginTop: 12 }}>✨ Hiệu ứng</div>
          <EffectPanel />
          <div className="panel-head" style={{ marginTop: 12 }}>🎞️ Keyframe animation</div>
          <KeyframePanel />
        </>
      )}

      {clip.kind === "audio" && (
        <>
          <label className="field">
            <span>Âm lượng: {Math.round((clip.volume ?? 1) * 100)}%</span>
            <input
              type="range" min={0} max={100}
              value={Math.round((clip.volume ?? 1) * 100)}
              onChange={(e) => patch({ volume: Number(e.target.value) / 100 })}
            />
          </label>
          <div className="field-row">
            <NumField label="Mờ vào (s)" value={clip.fadeIn ?? 0} onChange={(v) => patch({ fadeIn: Math.max(0, v) })} />
            <NumField label="Mờ ra (s)" value={clip.fadeOut ?? 0} onChange={(v) => patch({ fadeOut: Math.max(0, v) })} />
          </div>
          <div className="panel-head" style={{ marginTop: 12 }}>⏩ Tốc độ</div>
          <SpeedPanel />
        </>
      )}

      <div className="panel-head" style={{ marginTop: 12 }}>⏱️ Thời gian</div>
      <div className="field-row">
        <NumField label="Bắt đầu (s)" value={clip.start} onChange={(v) => patch({ start: Math.max(0, v) })} />
        <NumField label="Độ dài (s)" value={clip.duration} onChange={(v) => patch({ duration: Math.max(0.2, v) })} />
      </div>
      {clip.kind !== "text" && clip.kind !== "sticker" && (
        <div className="field-row">
          <NumField label="In (s)" value={(clip as { in: number }).in} onChange={(v) => patch({ in: Math.max(0, v), out: Math.max(0, v) + clip.duration } as Partial<typeof clip>)} />
          <NumField label="Out (s)" value={(clip as { out: number }).out} onChange={(v) => { const cin = (clip as { in: number }).in; patch({ out: Math.max(cin + 0.2, v), duration: Math.max(0.2, v - cin) } as Partial<typeof clip>); }} />
        </div>
      )}
      <button className="danger-btn" onClick={() => st.deleteSelection()}>
        🗑 Xoá clip này
      </button>
    </div>
  );
}
