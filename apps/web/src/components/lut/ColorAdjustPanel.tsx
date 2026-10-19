/**
 * ColorAdjustPanel — panel chỉnh màu thủ công cho video clip.
 *
 * Self-contained: không phụ thuộc store, nhận value/onChange qua props để
 * agent chính gắn vào Inspector khi tích hợp.
 *
 * 7 slider (-100..100): brightness, contrast, saturation, temperature,
 * tint, highlights, shadows. Preview là XẤP XỈ bằng CSS filter
 * (xem previewEngine.ts colorAdjustCssFilter) — màu chính xác chỉ thấy
 * khi render qua server/render (eq + colorbalance của FFmpeg).
 */
import "./lut.css";
import { COLOR_PARAMS, type ColorAdjust } from "../../../../../packages/video-spec/src/color";

export interface ColorAdjustPanelProps {
  /** Giá trị hiện tại (undefined = chưa chỉnh gì) */
  value: ColorAdjust | undefined;
  /** (color | undefined) => void — undefined = reset về mặc định */
  onChange: (color: ColorAdjust | undefined) => void;
}

function isDefault(value: ColorAdjust | undefined): boolean {
  if (!value) return true;
  return COLOR_PARAMS.every((p) => (value[p.key] ?? 0) === 0);
}

export function ColorAdjustPanel({ value, onChange }: ColorAdjustPanelProps) {
  const setParam = (key: keyof ColorAdjust, v: number) => {
    const next: ColorAdjust = { ...(value ?? {}) };
    if (v === 0) {
      delete next[key];
    } else {
      next[key] = v;
    }
    onChange(Object.keys(next).length > 0 ? next : undefined);
  };

  return (
    <div className="color-adjust">
      {COLOR_PARAMS.map((p) => {
        const v = value?.[p.key] ?? 0;
        return (
          <label key={p.key} className="color-row">
            <span className="color-label">
              {p.label}
              <span className="color-val">{v > 0 ? `+${v}` : `${v}`}</span>
            </span>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={v}
              title={p.hint}
              onChange={(e) => setParam(p.key, Number(e.target.value))}
              onDoubleClick={() => setParam(p.key, 0)}
            />
            <span className="color-hint">{p.hint}</span>
          </label>
        );
      })}
      <div className="color-actions">
        <button
          type="button"
          className="color-reset"
          disabled={isDefault(value)}
          onClick={() => onChange(undefined)}
          title="Đặt lại tất cả về 0 (double-click từng slider cũng reset)"
        >
          ↺ Đặt lại
        </button>
      </div>
      <p className="lut-note">
        ⚠️ Màu preview chỉ là minh họa gần đúng. Màu chính xác chỉ hiện khi
        render video.
      </p>
    </div>
  );
}
