#!/usr/bin/env python3
"""test_k1_measure.py — Đo pixel cho test K1 (Phase 6).

Cách dùng: python3 test_k1_measure.py <png> <mode>
  center   -> pixel giữa frame, in JSON {"r":..,"g":..,"b":..}
  inkbbox  -> bbox của pixel khác đen (ngưỡng kênh > 40), in JSON {"bbox":[x0,y0,x1,y1]}
  inkcount -> số pixel khác đen, in JSON {"count":N}
"""
import json
import sys

from PIL import Image


def main():
    png, mode = sys.argv[1], sys.argv[2]
    im = Image.open(png).convert("RGB")
    w, h = im.size
    if mode == "center":
        print(json.dumps(dict(zip("rgb", im.getpixel((w // 2, h // 2))))))
        return
    px = im.load()
    ink = []
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r > 40 or g > 40 or b > 40:
                ink.append((x, y))
    if mode == "inkcount":
        print(json.dumps({"count": len(ink)}))
        return
    if mode == "inkbbox":
        if not ink:
            print(json.dumps({"bbox": None}))
        else:
            xs = [p[0] for p in ink]
            ys = [p[1] for p in ink]
            print(json.dumps({"bbox": [min(xs), min(ys), max(xs), max(ys)]}))
        return
    print(f"mode không rõ: {mode}", file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    main()
