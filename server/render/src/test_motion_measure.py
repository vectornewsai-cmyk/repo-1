#!/usr/bin/env python3
"""Đo cho test_motion_render.js.
Usage: test_motion_measure.py <png> [mode]
- Mặc định: in mean gradient magnitude (độ sắc nét) của ảnh xám.
- mode: in mode kênh của ảnh (vd RGBA) để kiểm tra alpha.
"""
import sys

from PIL import Image
import numpy as np

png = sys.argv[1]
mode = sys.argv[2] if len(sys.argv) > 2 else "grad"

im = Image.open(png)
if mode == "mode":
    print(im.mode)
    sys.exit(0)

g = np.asarray(im.convert("L"), dtype=np.float64)
gx = np.abs(np.diff(g, axis=1)).mean()
gy = np.abs(np.diff(g, axis=0)).mean()
print(f"{gx + gy:.6f}")
