/**
 * FontPicker — chọn font chữ hỗ trợ tiếng Việt cho text overlay.
 * 59 fonts OFL từ Google Fonts (assets/fonts/catalog.json).
 */
import { fontsByCategory, FONT_CATEGORIES } from "../lib/fonts";
import { t as i18nT, useLang } from "../i18n";

// R6: nhãn category chuyển qua i18n (font.cat*).
const CAT_LABEL_KEY: Record<string, string> = {
  "Sans Serif": "font.catSans",
  Serif: "font.catSerif",
  Display: "font.catDisplay",
  Handwriting: "font.catHand",
  Monospace: "font.catMono",
};

export function FontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (family: string) => void;
}) {
  useLang();
  const grouped = fontsByCategory();
  return (
    <label className="field">
      <span>{i18nT("font.label")}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: `"${value}", system-ui, sans-serif` }}
        title={i18nT("font.title")}
      >
        {FONT_CATEGORIES.map((cat) => (
          <optgroup key={cat} label={CAT_LABEL_KEY[cat] ? i18nT(CAT_LABEL_KEY[cat]) : cat}>
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
