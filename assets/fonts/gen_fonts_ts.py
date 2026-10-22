#!/usr/bin/env python3
"""gen_fonts_ts.py — Sinh apps/web/src/lib/fonts.ts từ assets/fonts/catalog.json.
Chạy: python3 assets/fonts/gen_fonts_ts.py (ghi đè fonts.ts — KHÔNG sửa tay file đó).
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
CAT = os.path.join(HERE, "catalog.json")
OUT = os.path.join(HERE, "..", "..", "apps", "web", "src", "lib", "fonts.ts")
cat = json.load(open(CAT))
lines = ["""/**
 * Danh sách font hỗ trợ tiếng Việt (OFL-1.1, Google Fonts).
 * Sinh tự động từ assets/fonts/catalog.json — KHÔNG sửa tay.
 * Tải font: bash assets/fonts/fetch_fonts.sh
 */

export interface VCutFont {
  family: string;
  category: "Sans Serif" | "Serif" | "Display" | "Handwriting" | "Monospace";
  variable: boolean;
}

export const VCUT_FONTS: VCutFont[] = ["""]
for f in cat["fonts"]:
    var = "true" if f["variable"] else "false"
    lines.append(f'  {{ family: "{f["family"]}", category: "{f["category"]}", variable: {var} }},')
lines.append("];")
lines.append("")
lines.append('export const FONT_CATEGORIES = [')
lines.append('  "Sans Serif",')
lines.append('  "Serif",')
lines.append('  "Display",')
lines.append('  "Handwriting",')
lines.append('  "Monospace",')
lines.append("] as const;")
lines.append("")
lines.append("export type FontCategory = (typeof FONT_CATEGORIES)[number];")
lines.append("")
lines.append("/** Nhóm font theo category, giữ đúng thứ tự FONT_CATEGORIES. */")
lines.append("export function fontsByCategory(): Record<FontCategory, VCutFont[]> {")
lines.append("  const out = {")
lines.append('    "Sans Serif": [] as VCutFont[],')
lines.append('    Serif: [] as VCutFont[],')
lines.append('    Display: [] as VCutFont[],')
lines.append('    Handwriting: [] as VCutFont[],')
lines.append('    Monospace: [] as VCutFont[],')
lines.append("  };")
lines.append("  for (const f of VCUT_FONTS) out[f.category].push(f);")
lines.append("  return out;")
lines.append("}")
lines.append("")
lines.append("/** CSS font-family cho 1 font: \"Family\", system-ui, sans-serif. */")
lines.append("export function fontStack(family: string): string {")
lines.append('  return `"${family}", system-ui, sans-serif`;')
lines.append("}")
open(OUT, "w").write("\n".join(lines) + "\n")
print(f"wrote {OUT} ({len(cat['fonts'])} fonts)")
