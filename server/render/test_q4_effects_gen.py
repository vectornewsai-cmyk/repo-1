#!/usr/bin/env python3
"""Tạo PNG nguồn bất đối xứng cho test_q4_effects.js (chạy 1 lần, cache trong /tmp)."""
import sys

from PIL import Image, ImageDraw

out = sys.argv[1]
im = Image.new("RGB", (320, 180))
d = ImageDraw.Draw(im)
d.rectangle([0, 0, 159, 179], fill=(255, 0, 0))
d.rectangle([160, 0, 319, 179], fill=(0, 0, 255))
for x in range(320):
    g = int(255 * x / 319)
    d.line([(x, 130), (x, 179)], fill=(g, g, g))
d.ellipse([120, 20, 200, 100], fill=(255, 255, 255), outline=(0, 0, 0))
d.rectangle([40, 40, 90, 90], fill=(0, 255, 0))
im.save(out)
print("wrote", out)
