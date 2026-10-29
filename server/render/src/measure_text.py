#!/usr/bin/env python3
"""measure_text.py — Đo hộp chữ thật của 1 text clip bằng PIL (Phase 9 đợt 11 P4).

Dùng để \\\\clip theo HỘP CHỮ thay vì quét khung hình trong ASS parity
(server/render/src/textAnimParity.js): trước đợt 11, buildParityAss chỉ biết
W/H khung nên slideReveal/curtainIn quét mép từ 0 tới W — chữ ở giữa khung
chỉ bắt đầu lộ khi mép quét tới nó, và lộ xong sớm hơn thời lượng hiệu ứng.

Đo đúng cùng metrics với render_text_png.py (cùng font file đã resolve qua
fontconfig, cùng size làm tròn, cùng getbbox từng dòng + getmetrics):
  width  = bề rộng dòng dài nhất (px, số nguyên),
  height = (ascent + descent) * số dòng.
Text rỗng / chỉ khoảng trắng -> width 0 (caller fallback về quét khung).

Cách dùng:
  python3 measure_text.py --font /path/font.ttf --size 64 --text "Xin chào"
  -> {"width": 208, "height": 75} trên stdout, exit 0.
Lỗi load font / thiếu PIL -> stderr + exit != 0 (caller fallback, không fail render).
"""
import argparse
import json
import sys

from PIL import ImageFont


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--font", required=True)
    ap.add_argument("--size", type=float, required=True)
    ap.add_argument("--text", required=True)
    a = ap.parse_args()

    try:
        font = ImageFont.truetype(a.font, int(round(a.size)))
    except Exception as e:
        print(f"measure_text: không load được font {a.font}: {e}", file=sys.stderr)
        return 2

    lines = a.text.split("\n")
    ascent, descent = font.getmetrics()
    line_h = ascent + descent
    widths = []
    for ln in lines:
        bb = font.getbbox(ln)
        widths.append(bb[2] - bb[0])
    w = max(widths) if widths else 0
    h = line_h * len(lines)
    print(json.dumps({"width": int(w), "height": int(h)}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
