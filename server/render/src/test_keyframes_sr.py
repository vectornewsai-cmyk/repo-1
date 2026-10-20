#!/usr/bin/env python3
"""
test_keyframes_sr.py — phân tích pixel cho test_keyframes_sr.js.

Dùng: python3 test_keyframes_sr.py <frame.png> <mode>
  mode = white | black | red | blue
In ra JSON: {"count": N, "bbox": [x0, y0, x1, y1] | null, "centroid": [cx, cy] | null}
"""
import json
import sys

from PIL import Image


def matches(mode, r, g, b):
    if mode == "white":
        return r > 200 and g > 200 and b > 200
    if mode == "black":
        return r < 60 and g < 60 and b < 60
    if mode == "red":
        return r > 150 and g < 100 and b < 100
    if mode == "blue":
        return b > 150 and r < 100 and g < 100
    raise ValueError(f"mode không hỗ trợ: {mode}")


def main():
    path, mode = sys.argv[1], sys.argv[2]
    img = Image.open(path).convert("RGB")
    w, h = img.size
    px = img.load()
    count = 0
    sx = sy = 0
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if matches(mode, r, g, b):
                count += 1
                sx += x
                sy += y
                if x < x0:
                    x0 = x
                if x > x1:
                    x1 = x
                if y < y0:
                    y0 = y
                if y > y1:
                    y1 = y
    out = {"count": count, "bbox": None, "centroid": None}
    if count:
        out["bbox"] = [x0, y0, x1, y1]
        out["centroid"] = [round(sx / count, 1), round(sy / count, 1)]
    print(json.dumps(out))


if __name__ == "__main__":
    main()
