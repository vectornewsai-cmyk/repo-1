/**
 * MaskPanel — panel mask cho clip video/image (Phase 7 P4).
 *
 * Mask che phần clip nằm NGOÀI hình (rect/ellipse + feather làm mờ viền).
 * Tọa độ tương đối theo KHUNG HÌNH OUTPUT (x/y = tâm, w/h = kích thước,
 * 0..1 → hiển thị 0..100%), giống ngữ nghĩa trong mask.ts.
 *
 * Lưu ý trung thực: preview canvas CHƯA hiển thị mask (xem MASK_LIMITS.md).
 * Ô minh hoạ bên dưới chỉ là sơ đồ vị trí/hình dạng, không phải preview
 * thật — mask chỉ có tác dụng khi render FFmpeg.
 */
import { useStore } from "../../store";
import { clamp } from "../../lib";
import {
  MASK_DEFAULTS,
  type ClipMask,
  type MaskShape,
} from "@repo-1/video-spec";
import "./mask.css";

function PctField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}: {Math.round(value * 100)}%
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
    </label>
  );
}

export function MaskPanel() {
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const st = useStore.getState();

  const primary = selection[0] ?? null;
  if (!primary) {
    return (
      <div className="mask-panel">
        <p className="tips">Chọn một clip <b>video</b> hoặc <b>ảnh</b> trên timeline để thêm mask.</p>
      </div>
    );
  }
  const track = spec.tracks.find((t) => t.id === primary.trackId);
  const clip = track?.clips.find((c) => c.id === primary.clipId);
  if (!track || !clip) {
    return (
      <div className="mask-panel">
        <p className="tips">Clip không còn tồn tại.</p>
      </div>
    );
  }
  if (clip.kind !== "video" && clip.kind !== "image") {
    return (
      <div className="mask-panel">
        <p className="tips">
          Mask chưa hỗ trợ cho {clip.kind === "text" ? "clip chữ" : clip.kind === "audio" ? "clip âm thanh" : "sticker"}
          {" "}(chỉ video và ảnh) — xem <code>server/render/src/MASK_LIMITS.md</code>.
        </p>
      </div>
    );
  }

  const mask = (clip as { mask?: ClipMask }).mask;
  const patchMask = (next: ClipMask | undefined) => {
    st.patchClip(track.id, clip.id, { mask: next } as Partial<typeof clip>);
  };
  const update = (patch: Partial<ClipMask>) => {
    if (!mask) return;
    patchMask({ ...mask, ...patch });
  };

  if (!mask) {
    return (
      <div className="mask-panel">
        <p className="tips">
          Mask giữ lại phần clip trong hình chữ nhật / ellipse, che phần ngoài
          thành trong suốt (lộ nội dung bên dưới trên timeline).
        </p>
        <div className="btn-row">
          <button
            className="primary"
            onClick={() =>
              patchMask({
                shape: MASK_DEFAULTS.shape as MaskShape,
                x: MASK_DEFAULTS.x,
                y: MASK_DEFAULTS.y,
                w: MASK_DEFAULTS.w,
                h: MASK_DEFAULTS.h,
                feather: MASK_DEFAULTS.feather,
              })
            }
          >
            🎭 Bật mask
          </button>
        </div>
      </div>
    );
  }

  // Minh hoạ sơ đồ: khung 16:9, hình mask đặt theo x/y/w/h (tâm → góc).
  const left = (mask.x - mask.w / 2) * 100;
  const top = (mask.y - mask.h / 2) * 100;
  const blur = mask.feather * 8;

  return (
    <div className="mask-panel">
      <label className="field">
        <span>Hình dạng</span>
        <select
          value={mask.shape}
          onChange={(e) => update({ shape: e.target.value as MaskShape })}
        >
          <option value="rect">▭ Chữ nhật</option>
          <option value="ellipse">⬭ Ellipse</option>
        </select>
      </label>
      <div className="field-row">
        <PctField label="Tâm ngang (x)" value={mask.x} onChange={(v) => update({ x: clamp(v, -0.5, 1.5) })} />
        <PctField label="Tâm dọc (y)" value={mask.y} onChange={(v) => update({ y: clamp(v, -0.5, 1.5) })} />
      </div>
      <div className="field-row">
        <PctField label="Rộng (w)" value={mask.w} onChange={(v) => update({ w: clamp(v, 0.05, 2) })} />
        <PctField label="Cao (h)" value={mask.h} onChange={(v) => update({ h: clamp(v, 0.05, 2) })} />
      </div>
      <PctField label="Mờ viền (feather)" value={mask.feather} onChange={(v) => update({ feather: clamp(v, 0, 1) })} />
      <label className="field mask-check">
        <input
          type="checkbox"
          checked={!!mask.invert}
          onChange={(e) => update({ invert: e.target.checked })}
        />
        <span>Đảo mask (giữ ngoài, che trong)</span>
      </label>

      <div className="mask-preview" title="Minh hoạ vị trí mask — không phải preview render thật">
        <div
          className="mask-preview-shape"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${mask.w * 100}%`,
            height: `${mask.h * 100}%`,
            borderRadius: mask.shape === "ellipse" ? "50%" : "0",
            filter: blur > 0 ? `blur(${blur.toFixed(1)}px)` : undefined,
            opacity: mask.invert ? 0.25 : 1,
          }}
        />
        <span className="mask-preview-note">Minh hoạ (mask chỉ có tác dụng khi render)</span>
      </div>

      <div className="btn-row">
        <button onClick={() => patchMask(undefined)}>Tắt mask</button>
      </div>
    </div>
  );
}
