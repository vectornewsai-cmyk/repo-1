/**
 * LutPicker — panel chọn bộ lọc màu LUT cho video clip.
 *
 * Self-contained: không phụ thuộc store, nhận value/onChange qua props để
 * agent chính gắn vào Inspector khi tích hợp.
 *
 * Preview là MINH HỌA bằng CSS filter gần đúng (xem lut.css), KHÔNG phải màu
 * LUT thật — màu thật chỉ thấy khi render qua server/render/src/lut.js
 * (filter lut3d của FFmpeg với file .cube).
 */
import "./lut.css";
import type { LutId } from "../../../../../packages/video-spec/src/lut";
import { LUT_META, LUT_IDS } from "../../../../../packages/video-spec/src/lut";

export interface LutPickerProps {
  /** LutId đang chọn, hoặc undefined = không lọc */
  value: LutId | undefined;
  /** (lutId | undefined) => void */
  onChange: (lut: LutId | undefined) => void;
}

/**
 * CSS filter gần đúng cho từng LUT — CHỈ ĐỂ MINH HỌA trong picker.
 * Màu chính xác của file .cube chỉ FFmpeg mới render được.
 */
const CSS_APPROX: Record<LutId, string> = {
  "cartcut-blockbuster": "contrast(1.25) saturate(1.3)",
  "cartcut-teal-orange": "sepia(0.35) hue-rotate(-15deg) saturate(1.4) contrast(1.1)",
  "cartcut-nordic-noir": "saturate(0.55) contrast(1.15) brightness(0.92)",
  "cartcut-honey": "sepia(0.45) saturate(1.5) brightness(1.05)",
  "cartcut-golden-hour": "sepia(0.6) saturate(1.6) contrast(1.05) brightness(1.08)",
  "cartcut-winter-blue": "hue-rotate(15deg) saturate(0.85) brightness(1.05)",
  "cartcut-ocean": "hue-rotate(-10deg) saturate(1.35) brightness(1.02)",
  "cartcut-mono-neutral": "grayscale(1) contrast(1.05)",
  "cartcut-faded-seventies": "sepia(0.5) contrast(0.9) brightness(1.08) saturate(0.8)",
  "cartcut-super-eight": "sepia(0.65) contrast(1.1) saturate(1.2)",
  // vcut-*: xấp xỉ cảm giác màu của file .cube tự tạo
  "vcut-cinematic": "contrast(1.2) saturate(1.15) sepia(0.25)",
  "vcut-vintage-fade": "sepia(0.4) contrast(0.85) brightness(1.1) saturate(0.85)",
  "vcut-noir-contrast": "grayscale(1) contrast(1.5)",
  "vcut-cyberpunk": "saturate(1.5) contrast(1.15) hue-rotate(-20deg)",
  "vcut-pastel-dream": "saturate(0.7) brightness(1.1) contrast(0.9)",
  "vcut-sunset-glow": "sepia(0.5) saturate(1.4) brightness(1.05)",
  "vcut-arctic": "saturate(0.9) brightness(1.05) hue-rotate(15deg)",
  "vcut-faded-film": "sepia(0.3) contrast(0.8) brightness(1.05) saturate(0.8)",
  "vcut-moody-forest": "saturate(0.95) contrast(1.15) brightness(0.9) hue-rotate(-10deg)",
  "vcut-warm-bloom": "sepia(0.3) saturate(1.15) brightness(1.08)",
};

function Swatch({ lutId }: { lutId: LutId }) {
  // Ô preview: gradient cầu vồng áp CSS filter gần đúng để gợi ý tông màu.
  return (
    <div
      className="lut-swatch"
      aria-hidden
      style={{
        filter: CSS_APPROX[lutId],
        background:
          "linear-gradient(135deg,#ff5a5a 0%,#ffb84d 25%,#f7ff5a 50%,#5aff8a 75%,#5ab8ff 100%)",
      }}
    />
  );
}

export function LutPicker({ value, onChange }: LutPickerProps) {
  return (
    <div className="lut-picker">
      <div className="lut-grid">
        <button
          type="button"
          className={`lut-card${value === undefined ? " selected" : ""}`}
          onClick={() => onChange(undefined)}
          title="Không áp bộ lọc màu"
        >
          <div className="lut-swatch lut-none" aria-hidden />
          <div className="lut-name">Không lọc</div>
          <div className="lut-desc">Giữ nguyên màu gốc</div>
        </button>
        {LUT_IDS.map((id) => {
          const meta = LUT_META[id];
          return (
            <button
              key={id}
              type="button"
              className={`lut-card${value === id ? " selected" : ""}`}
              onClick={() => onChange(value === id ? undefined : id)}
              title={meta.description}
            >
              <Swatch lutId={id} />
              <div className="lut-name">{meta.label}</div>
              <div className="lut-desc">{meta.description}</div>
            </button>
          );
        })}
      </div>
      <p className="lut-note">
        ⚠️ Màu preview chỉ là minh họa gần đúng. Màu chính xác của LUT chỉ hiện
        khi render video.
      </p>
    </div>
  );
}
