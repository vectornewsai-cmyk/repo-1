/**
 * TransitionPanel — panel chọn transition giữa 2 clip.
 *
 * Self-contained: không phụ thuộc store, nhận value/onChange qua props để
 * agent chính gắn vào Inspector/Timeline khi tích hợp.
 * Preview là MINH HỌA bằng CSS animation (xem transitions.css), không phải
 * render thật — render thật do server/render/src/transitions.js đảm nhiệm
 * qua filter xfade của FFmpeg.
 */
import "./transitions.css";

export interface TransitionOption {
  type: string;
  label: string;
  description: string;
}

/** Mirror của TRANSITION_META trong packages/video-spec/src/transitions.ts */
export const TRANSITION_OPTIONS: TransitionOption[] = [
  { type: "none", label: "Không", description: "Cắt cứng, không hiệu ứng" },
  { type: "fade", label: "Mờ dần", description: "Hai cảnh hòa vào nhau" },
  { type: "fadeblack", label: "Mờ qua đen", description: "Mờ qua màn đen rồi hiện cảnh mới" },
  { type: "fadewhite", label: "Mờ qua trắng", description: "Mờ qua màn trắng rồi hiện cảnh mới" },
  { type: "wipeleft", label: "Quét sang trái", description: "Cảnh mới quét từ phải sang" },
  { type: "wiperight", label: "Quét sang phải", description: "Cảnh mới quét từ trái sang" },
  { type: "wipeup", label: "Quét lên trên", description: "Cảnh mới quét từ dưới lên" },
  { type: "wipedown", label: "Quét xuống dưới", description: "Cảnh mới quét từ trên xuống" },
  { type: "slideleft", label: "Trượt sang trái", description: "Hai cảnh trượt ngang sang trái" },
  { type: "slideright", label: "Trượt sang phải", description: "Hai cảnh trượt ngang sang phải" },
  { type: "dissolve", label: "Hòa tan", description: "Cảnh cũ tan dần, cảnh mới hiện dần" },
  { type: "circleopen", label: "Vòng tròn mở", description: "Cảnh mới nở ra từ vòng tròn giữa" },
  { type: "radial", label: "Xoay tỏa tròn", description: "Cảnh mới xoay tỏa như cánh quạt" },
];

export interface TransitionPanelProps {
  /** transition type đang chọn */
  value: string;
  /** độ dài transition (giây) */
  duration: number;
  /** (type, duration) => void */
  onChange: (type: string, duration: number) => void;
}

function Preview({ type }: { type: string }) {
  const isSlide = type === "slideleft" || type === "slideright";
  return (
    <div className="tr-preview" aria-hidden>
      {isSlide ? (
        <div className="tr-strip">
          <div className="tr-layer tr-old" />
          <div className="tr-layer tr-new" />
        </div>
      ) : (
        <>
          <div className="tr-layer tr-old" />
          <div className="tr-layer tr-new" />
        </>
      )}
    </div>
  );
}

export function TransitionPanel({ value, duration, onChange }: TransitionPanelProps) {
  const dur = Math.min(2, Math.max(0.2, duration || 0.5));
  return (
    <div className="tr-panel">
      <div className="tr-panel-head">
        <span className="tr-panel-title">✨ Chuyển cảnh</span>
        <span className="tr-panel-note">xem trước minh họa</span>
      </div>
      <div className="tr-grid" role="listbox" aria-label="Chọn hiệu ứng chuyển cảnh">
        {TRANSITION_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            role="option"
            aria-selected={value === opt.type}
            className={`tr-card${value === opt.type ? " selected" : ""}`}
            data-type={opt.type}
            title={opt.description}
            onClick={() => onChange(opt.type, dur)}
          >
            <Preview type={opt.type} />
            <span className="tr-name">{opt.label}</span>
            <span className="tr-desc">{opt.description}</span>
          </button>
        ))}
      </div>
      <label className="tr-duration">
        <span>Thời gian</span>
        <input
          type="range"
          min={0.2}
          max={2}
          step={0.1}
          value={dur}
          disabled={value === "none"}
          onChange={(e) => onChange(value, Number(e.target.value))}
        />
        <b>{dur.toFixed(1)}s</b>
      </label>
    </div>
  );
}
