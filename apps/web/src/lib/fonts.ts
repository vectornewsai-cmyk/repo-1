/**
 * Danh sách font hỗ trợ tiếng Việt (OFL-1.1, Google Fonts).
 * Sinh tự động từ assets/fonts/catalog.json — KHÔNG sửa tay.
 * Tải font: bash assets/fonts/fetch_fonts.sh
 */

export interface VCutFont {
  family: string;
  category: "Sans Serif" | "Serif" | "Display" | "Handwriting" | "Monospace";
  variable: boolean;
}

export const VCUT_FONTS: VCutFont[] = [
  { family: "Be Vietnam Pro", category: "Sans Serif", variable: false },
  { family: "Inter", category: "Sans Serif", variable: true },
  { family: "Roboto", category: "Sans Serif", variable: true },
  { family: "Open Sans", category: "Sans Serif", variable: true },
  { family: "Montserrat", category: "Sans Serif", variable: true },
  { family: "Nunito", category: "Sans Serif", variable: true },
  { family: "Quicksand", category: "Sans Serif", variable: true },
  { family: "Manrope", category: "Sans Serif", variable: true },
  { family: "Plus Jakarta Sans", category: "Sans Serif", variable: true },
  { family: "Lexend", category: "Sans Serif", variable: true },
  { family: "Space Grotesk", category: "Sans Serif", variable: true },
  { family: "Kanit", category: "Sans Serif", variable: false },
  { family: "Prompt", category: "Sans Serif", variable: false },
  { family: "Barlow Condensed", category: "Sans Serif", variable: false },
  { family: "Playfair Display", category: "Serif", variable: true },
  { family: "Merriweather", category: "Serif", variable: true },
  { family: "Lora", category: "Serif", variable: true },
  { family: "Noto Serif", category: "Serif", variable: true },
  { family: "EB Garamond", category: "Serif", variable: true },
  { family: "Crimson Pro", category: "Serif", variable: true },
  { family: "Fraunces", category: "Serif", variable: true },
  { family: "Vollkorn", category: "Serif", variable: true },
  { family: "Anton", category: "Display", variable: false },
  { family: "Oswald", category: "Display", variable: true },
  { family: "Lobster", category: "Display", variable: false },
  { family: "Alfa Slab One", category: "Display", variable: false },
  { family: "Bungee", category: "Display", variable: false },
  { family: "Chakra Petch", category: "Display", variable: false },
  { family: "Baloo 2", category: "Display", variable: true },
  { family: "Black Ops One", category: "Display", variable: false },
  { family: "Bungee Shade", category: "Display", variable: false },
  { family: "Big Shoulders", category: "Display", variable: true },
  { family: "Dancing Script", category: "Handwriting", variable: true },
  { family: "Pacifico", category: "Handwriting", variable: false },
  { family: "Patrick Hand", category: "Handwriting", variable: false },
  { family: "Great Vibes", category: "Handwriting", variable: false },
  { family: "Amatic SC", category: "Handwriting", variable: false },
  { family: "Itim", category: "Handwriting", variable: false },
  { family: "Roboto Mono", category: "Monospace", variable: true },
  { family: "JetBrains Mono", category: "Monospace", variable: true },
  { family: "Space Mono", category: "Monospace", variable: false },
  { family: "IBM Plex Mono", category: "Monospace", variable: false },
  { family: "Victor Mono", category: "Monospace", variable: true },
  { family: "Work Sans", category: "Sans Serif", variable: true },
  { family: "Archivo", category: "Sans Serif", variable: true },
  { family: "Public Sans", category: "Sans Serif", variable: true },
  { family: "Fira Sans", category: "Sans Serif", variable: false },
  { family: "Lato", category: "Sans Serif", variable: false },
  { family: "Raleway", category: "Sans Serif", variable: true },
  { family: "Cabin", category: "Sans Serif", variable: true },
  { family: "Mulish", category: "Sans Serif", variable: true },
  { family: "Source Sans 3", category: "Sans Serif", variable: true },
  { family: "IBM Plex Sans", category: "Sans Serif", variable: true },
  { family: "Cormorant Garamond", category: "Serif", variable: true },
  { family: "Bitter", category: "Serif", variable: true },
  { family: "Indie Flower", category: "Handwriting", variable: false },
  { family: "Inconsolata", category: "Monospace", variable: true },
  { family: "Source Code Pro", category: "Monospace", variable: true },
  { family: "Comfortaa", category: "Display", variable: true },
];

export const FONT_CATEGORIES = [
  "Sans Serif",
  "Serif",
  "Display",
  "Handwriting",
  "Monospace",
] as const;

export type FontCategory = (typeof FONT_CATEGORIES)[number];

/** Nhóm font theo category, giữ đúng thứ tự FONT_CATEGORIES. */
export function fontsByCategory(): Record<FontCategory, VCutFont[]> {
  const out = {
    "Sans Serif": [] as VCutFont[],
    Serif: [] as VCutFont[],
    Display: [] as VCutFont[],
    Handwriting: [] as VCutFont[],
    Monospace: [] as VCutFont[],
  };
  for (const f of VCUT_FONTS) out[f.category].push(f);
  return out;
}

/** CSS font-family cho 1 font: "Family", system-ui, sans-serif. */
export function fontStack(family: string): string {
  return `"${family}", system-ui, sans-serif`;
}
