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
  "slay-amber": "sepia(0.4) saturate(1.3)",
  "slay-fade": "sepia(0.3) contrast(0.85) brightness(1.05)",
  "slay-neon": "saturate(1.6) contrast(1.2)",
  "slay-film": "sepia(0.25) contrast(1.1) saturate(1.1)",
  "slay-portrait": "sepia(0.15) saturate(1.05) brightness(1.03)",
  "derby-acid": "saturate(1.6) hue-rotate(-30deg) contrast(1.2)",
  "derby-after": "saturate(0.8) brightness(1.05) hue-rotate(10deg)",
  "derby-club": "saturate(1.4) contrast(1.25) brightness(0.95)",
  "derby-fever": "sepia(0.5) saturate(1.4) contrast(1.15)",
  "derby-flash": "contrast(1.3) brightness(1.05)",
  "derby-hush": "saturate(0.7) contrast(0.9) brightness(0.95)",
  "derby-rush": "sepia(0.3) saturate(1.3) contrast(1.1)",
  "glassmeter-cinestill-400d": "sepia(0.2) saturate(1.2) contrast(1.1)",
  "glassmeter-cinestill-50d": "saturate(1.1) contrast(1.05) brightness(1.02)",
  "glassmeter-cinestill-800t": "sepia(0.15) saturate(1.25) hue-rotate(-10deg)",
  "glassmeter-fuji-acros-100-ii": "grayscale(1) contrast(1.1)",
  "glassmeter-fuji-industrial-100": "saturate(1.0) contrast(1.05)",
  "glassmeter-fuji-pro-400h": "sepia(0.1) saturate(1.05) brightness(1.02)",
  "glassmeter-fuji-provia-100f": "saturate(1.15) contrast(1.1)",
  "glassmeter-fuji-superia-xtra-400": "saturate(1.2) hue-rotate(-8deg)",
  "glassmeter-fuji-velvia-100": "saturate(1.5) contrast(1.15)",
  "glassmeter-fuji-velvia-50": "saturate(1.55) contrast(1.2)",
  "glassmeter-ilford-delta-100-v2": "grayscale(1) contrast(1.08)",
  "glassmeter-ilford-delta-3200-v2": "grayscale(1) contrast(1.2) brightness(0.95)",
  "glassmeter-ilford-delta-400": "grayscale(1) contrast(1.12)",
  "glassmeter-ilford-fp4-125-v2": "grayscale(1) contrast(1.05)",
  "glassmeter-ilford-hp5-400-v2": "grayscale(1) contrast(1.15)",
  "glassmeter-ilford-panf-50": "grayscale(1) contrast(1.03) brightness(1.02)",
  "glassmeter-ilford-xp2-super-400": "grayscale(1) contrast(1.1) sepia(0.05)",
  "glassmeter-kodak-colorplus-200": "sepia(0.25) saturate(1.15)",
  "glassmeter-kodak-double-x-v2": "grayscale(1) contrast(1.18)",
  "glassmeter-kodak-ektachrome-e100": "saturate(1.1) hue-rotate(8deg) contrast(1.08)",
  "glassmeter-kodak-ektar-100": "saturate(1.4) contrast(1.12)",
  "glassmeter-kodak-gold-200": "sepia(0.3) saturate(1.2)",
  "glassmeter-kodak-portra-160": "sepia(0.12) saturate(1.0) brightness(1.02)",
  "glassmeter-kodak-portra-400": "sepia(0.15) saturate(1.05)",
  "glassmeter-kodak-portra-800": "sepia(0.18) saturate(1.08) brightness(1.01)",
  "glassmeter-kodak-tmax-100-v2": "grayscale(1) contrast(1.12)",
  "glassmeter-kodak-tmax-400-v2": "grayscale(1) contrast(1.1)",
  "glassmeter-kodak-tmax-p3200": "grayscale(1) contrast(1.25) brightness(0.97)",
  "glassmeter-kodak-trix-400-v2": "grayscale(1) contrast(1.2)",
  "glassmeter-kodak-ultramax-400": "saturate(1.45) contrast(1.1)",
  "vcut-desert-heat": "sepia(0.45) saturate(1.3) contrast(1.15)",
  "vcut-emerald-city": "saturate(1.2) hue-rotate(-12deg) contrast(1.1)",
  "vcut-crimson-dusk": "sepia(0.3) saturate(1.3) hue-rotate(-15deg) contrast(1.2)",
  "vcut-steel-blue": "saturate(0.85) hue-rotate(10deg) contrast(1.15)",
  "vcut-amber-noir": "sepia(0.35) contrast(1.35) brightness(0.92)",
  "vcut-violet-haze": "saturate(1.05) hue-rotate(25deg) brightness(1.05)",
  "vcut-copper-tone": "sepia(0.4) saturate(1.2) contrast(1.1)",
  "vcut-midnight-teal": "saturate(1.15) hue-rotate(-18deg) contrast(1.25) brightness(0.9)",
  "vcut-sepia-classic": "sepia(0.8) contrast(1.05)",
  "vcut-kodachrome-pop": "saturate(1.4) contrast(1.2)",
  "vcut-polaroid-fade": "sepia(0.25) contrast(0.8) brightness(1.08) saturate(0.75)",
  "vcut-lomography": "saturate(1.5) contrast(1.25)",
  "vcut-cross-process": "saturate(1.2) hue-rotate(-10deg) contrast(1.1)",
  "vcut-bleach-warm": "sepia(0.3) contrast(1.15) saturate(0.9)",
  "vcut-retro-neon": "saturate(1.5) hue-rotate(-20deg) contrast(1.2)",
  "vcut-vhs-tracking": "sepia(0.15) saturate(1.1) contrast(0.9)",
  "vcut-bw-high-contrast": "grayscale(1) contrast(1.6)",
  "vcut-bw-soft": "grayscale(1) contrast(0.9) brightness(1.05)",
  "vcut-bw-selenium": "grayscale(1) sepia(0.3) contrast(1.15)",
  "vcut-bw-warm": "grayscale(1) sepia(0.25) contrast(1.1)",
  "vcut-bw-cold": "grayscale(1) hue-rotate(15deg) contrast(1.1)",
  "vcut-bw-infrared": "grayscale(1) contrast(1.3) brightness(1.05)",
  "vcut-forest-mist": "saturate(0.85) hue-rotate(-8deg) brightness(1.05)",
  "vcut-ocean-deep": "saturate(1.25) hue-rotate(-12deg) contrast(1.15)",
  "vcut-desert-dusk": "sepia(0.35) saturate(1.2) hue-rotate(-8deg)",
  "vcut-autumn-glow": "sepia(0.35) saturate(1.35) contrast(1.1)",
  "vcut-spring-fresh": "saturate(1.2) hue-rotate(-5deg) brightness(1.03)",
  "vcut-winter-frost": "saturate(0.8) hue-rotate(12deg) brightness(1.04)",
  "vcut-neon-nights": "saturate(1.6) contrast(1.25) hue-rotate(-15deg)",
  "vcut-tokyo-drift": "saturate(1.35) hue-rotate(-10deg) contrast(1.2)",
  "vcut-urban-decay": "sepia(0.2) saturate(0.7) contrast(0.85)",
  "vcut-rooftop-dawn": "sepia(0.3) saturate(1.15) brightness(1.03)",
  "vcut-subway-green": "saturate(0.95) hue-rotate(-15deg) contrast(1.2) brightness(0.92)",
  "vcut-street-sodium": "sepia(0.55) saturate(1.15) contrast(1.1)",
  "vcut-skin-glow": "sepia(0.12) saturate(1.05) brightness(1.03)",
  "vcut-soft-beauty": "sepia(0.1) saturate(0.9) brightness(1.05) contrast(0.92)",
  "vcut-golden-skin": "sepia(0.3) saturate(1.15)",
  "vcut-porcelain": "saturate(0.75) brightness(1.06) contrast(0.92)",
  "vcut-duotone-magenta": "grayscale(0.7) sepia(0.6) hue-rotate(140deg) saturate(1.8)",
  "vcut-duotone-cyan-orange": "grayscale(0.6) sepia(0.7) saturate(1.8) contrast(1.1)",
  "vcut-infrared-false": "hue-rotate(180deg) saturate(1.3)",
  "vcut-solarized": "invert(0.15) saturate(1.2) contrast(1.1)",
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
