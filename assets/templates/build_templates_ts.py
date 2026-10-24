#!/usr/bin/env python3
"""
build_templates_ts.py — Sinh apps/web/src/lib/templates.ts từ assets/templates/*.json.

Pattern giống FontHarvest (catalog.json -> fonts.ts): JSON là source of truth,
TS module là bản nhúng để web app dùng trực tiếp (Vite không import được file
ngoài root một cách ổn định).
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "apps", "web", "src", "lib", "templates.ts")

templates = []
for fname in sorted(os.listdir(HERE)):
    if not fname.endswith(".json"):
        continue
    with open(os.path.join(HERE, fname), encoding="utf-8") as f:
        templates.append(json.load(f))

lines = []
lines.append("/**")
lines.append(" * templates.ts — catalog 30 template mẫu của VCut Studio.")
lines.append(" *")
lines.append(" * TỰ ĐỘNG SINH — đừng sửa tay. Chạy:")
lines.append(" *   python3 assets/templates/build_templates_ts.py")
lines.append(" * sau khi sửa assets/templates/*.json.")
lines.append(" */")
lines.append('import type { TemplateDef } from "./templateEngine";')
lines.append("")
lines.append("export const TEMPLATES: TemplateDef[] = [")
for t in templates:
    tpl = t["template"]
    lines.append("  {")
    lines.append("    template: " + json.dumps(tpl, ensure_ascii=False) + ",")
    lines.append("    spec: " + json.dumps(t["spec"], ensure_ascii=False) + ",")
    lines.append("  },")
lines.append("];")
lines.append("")
lines.append("export const TEMPLATE_CATEGORIES: { id: string; label: string }[] = [")
for cid, label in [
    ("intro", "Mở đầu"),
    ("outro", "Kết thúc"),
    ("social", "Mạng xã hội"),
    ("slideshow", "Slideshow"),
    ("music", "Âm nhạc"),
    ("broadcast", "Truyền hình"),
    ("cinematic", "Điện ảnh"),
    ("ads", "Quảng cáo"),
    ("podcast", "Podcast"),
]:
    lines.append(f'  {{ id: "{cid}", label: "{label}" }},')
lines.append("];")
lines.append("")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print(f"wrote {OUT} ({len(templates)} templates)")
