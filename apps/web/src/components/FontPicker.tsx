/**
 * FontPicker — chọn font chữ hỗ trợ tiếng Việt cho text overlay.
 * 59 fonts OFL từ Google Fonts (assets/fonts/catalog.json).
 */
import { fontsByCategory, FONT_CATEGORIES } from "../lib/fonts";

const CAT_LABEL: Record<string, string> = {
  "Sans Serif": "Sans Serif — hiện đại",
  Serif: "Serif — cổ điển",
  Display: "Display — tiêu đề",
  Handwriting: "Handwriting — viết tay",
  Monospace: "Monospace — đẳng chiều",
};

export function FontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (family: string) => void;
}) {
  const grouped = fontsByCategory();
  return (
    <label className="field">
      <span>Font chữ (59 font Việt)</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: `"${value}", system-ui, sans-serif` }}
        title="Font hỗ trợ đầy đủ dấu tiếng Việt (OFL)"
      >
        {FONT_CATEGORIES.map((cat) => (
          <optgroup key={cat} label={CAT_LABEL[cat] ?? cat}>
            {grouped[cat].map((f) => (
              <option key={f.family} value={f.family}>
                {f.family}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
