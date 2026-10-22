#!/usr/bin/env python3
"""render_text_png.py — Vẽ 1 text clip thành PNG trong suốt, crop sát nội dung.

Dùng cho text clip có keyframes scale/rotation (K1, Phase 6): drawtext của
FFmpeg không scale/rotate chữ theo thời gian được, nên render chữ ra PNG rồi
đưa qua pipeline overlay giống video clip có SR (scale eval=frame + rotate +
overlay expressions).

Giữ giống drawtext nhất có thể:
- Cùng font file đã resolve (kể cả bản bold/italic do fontconfig chọn),
  cùng fontsize (px), cùng màu, cùng box (nền + padding boxborderw).
- Multi-line: tách theo \\n, bước dòng = ascent + descent của font.
- Không có box: crop sát pixel có alpha > 0 (getbbox).

Giới hạn trung thực (ghi trong KEYFRAMES_LIMITS.md):
- Emoji màu (CBDT) PIL vẽ có thể khác drawtext (FreeType monochrome).
- Khoảng cách dòng đa dòng xấp xỉ drawtext (font metrics, không phải libass).
- Text rỗng / chỉ khoảng trắng -> PNG 1x1 trong suốt.

Cách dùng:
  python3 render_text_png.py --font /path/font.ttf --size 64 --color "#ffffff"
      --text "Xin chào" --out /tmp/text.png [--bg "#000000" --pad 16]
"""
import argparse
import sys

from PIL import Image, ImageDraw, ImageFont


def hex_to_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--font", required=True)
    ap.add_argument("--size", type=float, required=True)
    ap.add_argument("--color", required=True)
    ap.add_argument("--text", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--bg", default=None, help="màu nền box (#rrggbb), không có = trong suốt")
    ap.add_argument("--pad", type=int, default=0, help="padding box (px)")
    a = ap.parse_args()

    try:
        font = ImageFont.truetype(a.font, int(round(a.size)))
    except Exception as e:
        print(f"render_text_png: không load được font {a.font}: {e}", file=sys.stderr)
        return 2

    lines = a.text.split("\n")
    ascent, descent = font.getmetrics()
    line_h = ascent + descent
    widths = []
    for ln in lines:
        bb = font.getbbox(ln)
        widths.append(bb[2] - bb[0])
    w = max(widths) if widths else 1
    h = line_h * len(lines)
    pad = a.pad
    img = Image.new("RGBA", (max(w + 2 * pad, 1), max(h + 2 * pad, 1)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if a.bg:
        d.rectangle([0, 0, img.width - 1, img.height - 1],
                    fill=hex_to_rgb(a.bg) + (255,))
    y = pad
    for ln in lines:
        d.text((pad, y), ln, font=font, fill=hex_to_rgb(a.color) + (255,))
        y += line_h
    if not a.bg:
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        else:
            img = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    img.save(a.out)
    print(f"{img.width}x{img.height}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
