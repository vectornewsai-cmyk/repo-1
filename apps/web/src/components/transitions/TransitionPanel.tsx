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
import { t as i18nT, useLang } from "../../i18n";

export interface TransitionOption {
  type: string;
}

// R6: nhãn + mô tả chuyển qua i18n (transition.opt.<type>.label/.desc)
// để đổi ngôn ngữ — dữ liệu cũ hardcode tiếng Việt đã dời vào vi/en.json.
export const TRANSITION_OPTIONS: TransitionOption[] = [
  { type: "none" },
  { type: "fade" },
  { type: "fadeblack" },
  { type: "fadewhite" },
  { type: "wipeleft" },
  { type: "wiperight" },
  { type: "wipeup" },
  { type: "wipedown" },
  { type: "slideleft" },
  { type: "slideright" },
  { type: "dissolve" },
  { type: "circleopen" },
  { type: "radial" },
  { type: "smoothleft" },
  { type: "smoothright" },
  { type: "smoothup" },
  { type: "smoothdown" },
  { type: "slideup" },
  { type: "slidedown" },
  { type: "circleclose" },
  { type: "circlecrop" },
  { type: "rectcrop" },
  { type: "pixelize" },
  { type: "hblur" },
  { type: "distance" },
  { type: "vertopen" },
  { type: "horzopen" },
  { type: "diagtl" },
  { type: "vertclose" },
  { type: "horzclose" },
  { type: "diagtr" },
  { type: "diagbl" },
  { type: "diagbr" },
  { type: "hlslice" },
  { type: "hrslice" },
  { type: "vuslice" },
  { type: "vdslice" },
  { type: "fadegrays" },
  { type: "wipetl" },
  { type: "wipetr" },
  { type: "wipebl" },
  { type: "wipebr" },
  { type: "squeezeh" },
  { type: "squeezev" },
  { type: "zoomin" },
  { type: "fadefast" },
  { type: "fadeslow" },
  { type: "hlwind" },
  { type: "hrwind" },
  { type: "vuwind" },
  { type: "vdwind" },
  { type: "coverleft" },
  { type: "coverright" },
  { type: "coverup" },
  { type: "coverdown" },
  { type: "revealleft" },
  { type: "revealright" },
  { type: "revealup" },
  { type: "revealdown" },
  { type: "blinds-h" },
  { type: "bars-v" },
  { type: "checker" },
  { type: "diamond" },
  { type: "plus" },
  { type: "grid" },
  { type: "clock" },
  { type: "circle-soft" },
  { type: "bars-fade" },
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
  useLang();
  const dur = Math.min(2, Math.max(0.1, duration || 0.5));
  return (
    <div className="tr-panel">
      <div className="tr-panel-head">
        <span className="tr-panel-title">{i18nT("transition.title")}</span>
        <span className="tr-panel-note">{i18nT("transition.note")}</span>
      </div>
      <div className="tr-grid" role="listbox" aria-label={i18nT("transition.aria")}>
        {TRANSITION_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            role="option"
            aria-selected={value === opt.type}
            className={`tr-card${value === opt.type ? " selected" : ""}`}
            data-type={opt.type}
            title={i18nT(`transition.opt.${opt.type}.desc`)}
            onClick={() => onChange(opt.type, dur)}
          >
            <Preview type={opt.type} />
            <span className="tr-name">{i18nT(`transition.opt.${opt.type}.label`)}</span>
            <span className="tr-desc">{i18nT(`transition.opt.${opt.type}.desc`)}</span>
          </button>
        ))}
      </div>
      <label className="tr-duration">
        <span>{i18nT("transition.duration")}</span>
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
