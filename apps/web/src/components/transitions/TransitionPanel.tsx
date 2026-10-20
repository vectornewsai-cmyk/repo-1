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
  // R1-073 (Batch G): 15 transition mới
  { type: "smoothleft", label: "Trượt mượt ←", description: "Trượt mượt từ phải sang, mờ biên" },
  { type: "smoothright", label: "Trượt mượt →", description: "Trượt mượt từ trái sang, mờ biên" },
  { type: "smoothup", label: "Trượt mượt ↑", description: "Trượt mượt từ dưới lên, mờ biên" },
  { type: "smoothdown", label: "Trượt mượt ↓", description: "Trượt mượt từ trên xuống, mờ biên" },
  { type: "slideup", label: "Trượt lên", description: "Hai cảnh trượt dọc lên trên" },
  { type: "slidedown", label: "Trượt xuống", description: "Hai cảnh trượt dọc xuống dưới" },
  { type: "circleclose", label: "Vòng tròn khép", description: "Vòng tròn khép từ ngoài vào" },
  { type: "circlecrop", label: "Cắt vòng tròn", description: "Cảnh cũ co thành vòng tròn" },
  { type: "rectcrop", label: "Cắt chữ nhật", description: "Cảnh cũ co thành chữ nhật" },
  { type: "pixelize", label: "Điểm ảnh hóa", description: "Vỡ thành ô pixel rồi chuyển" },
  { type: "hblur", label: "Mờ ngang", description: "Mờ nhòe ngang rồi chuyển cảnh" },
  { type: "distance", label: "Khoảng cách", description: "Cảnh mới zoom tiến lại gần" },
  { type: "vertopen", label: "Mở dọc", description: "Mở ra từ giữa theo chiều dọc" },
  { type: "horzopen", label: "Mở ngang", description: "Mở ra từ giữa theo chiều ngang" },
  { type: "diagtl", label: "Chéo ↖", description: "Quét chéo từ góc trái-trên" },
  // TransitionHarvest: 30 transition xfade còn thiếu (đã render thật)
  { type: "vertclose", label: "Khép dọc", description: "Hai nửa khép vào giữa theo chiều dọc" },
  { type: "horzclose", label: "Khép ngang", description: "Hai nửa khép vào giữa theo chiều ngang" },
  { type: "diagtr", label: "Chéo ↗", description: "Quét chéo từ góc phải-trên" },
  { type: "diagbl", label: "Chéo ↙", description: "Quét chéo từ góc trái-dưới" },
  { type: "diagbr", label: "Chéo ↘", description: "Quét chéo từ góc phải-dưới" },
  { type: "hlslice", label: "Lát ngang ←", description: "Lát cắt ngang hiện từ trái" },
  { type: "hrslice", label: "Lát ngang →", description: "Lát cắt ngang hiện từ phải" },
  { type: "vuslice", label: "Lát dọc ↑", description: "Lát cắt dọc hiện từ dưới lên" },
  { type: "vdslice", label: "Lát dọc ↓", description: "Lát cắt dọc hiện từ trên xuống" },
  { type: "fadegrays", label: "Mờ xám", description: "Mờ qua tông xám" },
  { type: "wipetl", label: "Quét ↖", description: "Quét chéo từ góc trái-trên" },
  { type: "wipetr", label: "Quét ↗", description: "Quét chéo từ góc phải-trên" },
  { type: "wipebl", label: "Quét ↙", description: "Quét chéo từ góc trái-dưới" },
  { type: "wipebr", label: "Quét ↘", description: "Quét chéo từ góc phải-dưới" },
  { type: "squeezeh", label: "Ép ngang", description: "Ép dẹt ngang rồi giãn ra" },
  { type: "squeezev", label: "Ép dọc", description: "Ép dẹt dọc rồi giãn ra" },
  { type: "zoomin", label: "Zoom vào", description: "Phóng to dần từ giữa" },
  { type: "fadefast", label: "Mờ nhanh", description: "Hòa nhanh ở đầu" },
  { type: "fadeslow", label: "Mờ chậm", description: "Hòa chậm rãi" },
  { type: "hlwind", label: "Gió ←", description: "Thổi vào từ trái" },
  { type: "hrwind", label: "Gió →", description: "Thổi vào từ phải" },
  { type: "vuwind", label: "Gió ↑", description: "Thổi vào từ dưới lên" },
  { type: "vdwind", label: "Gió ↓", description: "Thổi vào từ trên xuống" },
  { type: "coverleft", label: "Phủ ←", description: "Phủ che sang trái" },
  { type: "coverright", label: "Phủ →", description: "Phủ che sang phải" },
  { type: "coverup", label: "Phủ ↑", description: "Phủ che lên trên" },
  { type: "coverdown", label: "Phủ ↓", description: "Phủ che xuống dưới" },
  { type: "revealleft", label: "Hé lộ ←", description: "Trượt hé lộ cảnh mới bên trái" },
  { type: "revealright", label: "Hé lộ →", description: "Trượt hé lộ cảnh mới bên phải" },
  { type: "revealup", label: "Hé lộ ↑", description: "Trượt hé lộ cảnh mới bên trên" },
  { type: "revealdown", label: "Hé lộ ↓", description: "Trượt hé lộ cảnh mới bên dưới" },
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
  const isSlide =
    type === "slideleft" ||
    type === "slideright" ||
    type === "slideup" ||
    type === "slidedown";
  const isVerticalSlide = type === "slideup" || type === "slidedown";
  return (
    <div className="tr-preview" aria-hidden>
      {isSlide ? (
        <div className={isVerticalSlide ? "tr-strip-vertical" : "tr-strip"}>
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
  const dur = Math.min(2, Math.max(0.1, duration || 0.5));
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
          min={0.1}
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
