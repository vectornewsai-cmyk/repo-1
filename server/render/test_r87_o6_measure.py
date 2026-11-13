#!/usr/bin/env python3
"""Đo pixel/frame cho test_r87_o6_mask_track_verify.js (đợt 87 O6).

Dùng: python3 test_r87_o6_measure.py <mode> ...
  frame <video> <t> <out.png>        — trích 1 frame tại thời gian t (giây).
  px <video> <t> <x,y> [<x,y> ...]   — in px_<x>_<y>=R,G,B tại thời gian t.
  scan <video> <t> <y> <vis|red>     — quét hàng y (0..1), tìm vệt dài nhất
                                       thỏa điều kiện; in run_x0/run_x1/center/width.
                                       vis = pixel không đen (max>40);
                                       red = đỏ trội (R>120, R>G+40, R>B+40).
  mad <pngA> <pngB>                  — mean/max/pctGt8 giữa 2 frame PNG.
"""
import subprocess
import sys
import tempfile
import os

from PIL import Image


def extract(video, t):
    td = tempfile.mkdtemp(prefix="r87o6-frame-")
    frame = os.path.join(td, "f.png")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", video,
         "-frames:v", "1", frame], check=True)
    return Image.open(frame).convert("RGB")


def cmd_frame(video, t, out):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", video,
         "-frames:v", "1", out], check=True)
    print(f"frame {out} t={t}")


def cmd_px(video, t, points):
    img = extract(video, t)
    w, h = img.size
    for x, y in points:
        px = max(0, min(w - 1, int(x * w)))
        py = max(0, min(h - 1, int(y * h)))
        r, g, b = img.getpixel((px, py))
        print(f"px_{x}_{y}={r},{g},{b}")


def cmd_scan(video, t, y, mode):
    img = extract(video, t)
    w, h = img.size
    py = max(0, min(h - 1, int(y * h)))
    step = 0.002
    n = int(1 / step) + 1
    flags = []
    for i in range(n):
        x = i * step
        px = max(0, min(w - 1, int(x * w)))
        r, g, b = img.getpixel((px, py))
        if mode == "red":
            flags.append(r > 120 and r > g + 40 and r > b + 40)
        else:  # vis
            flags.append(max(r, g, b) > 40)
    best = (0, -1)  # (start_idx, end_idx) inclusive
    cur = None
    for i, f in enumerate(flags):
        if f and cur is None:
            cur = i
        elif not f and cur is not None:
            if i - 1 - cur > best[1] - best[0]:
                best = (cur, i - 1)
            cur = None
    if cur is not None and len(flags) - 1 - cur > best[1] - best[0]:
        best = (cur, len(flags) - 1)
    if best[1] < best[0]:
        print("run_x0=none\nrun_x1=none\ncenter=none\nwidth=0")
        return
    x0, x1 = best[0] * step, best[1] * step
    print(f"run_x0={x0:.3f}\nrun_x1={x1:.3f}\ncenter={(x0 + x1) / 2:.3f}\n"
          f"width={x1 - x0:.3f}\nn={best[1] - best[0] + 1}")


def cmd_mad(pa, pb):
    import numpy as np
    a = np.asarray(Image.open(pa).convert("RGB"), dtype=np.int16)
    b = np.asarray(Image.open(pb).convert("RGB"), dtype=np.int16)
    d = np.abs(a - b)
    print(f"mean={d.mean():.3f}\nmax={int(d.max())}\npctGt8={(d > 8).mean() * 100:.3f}")


def main() -> int:
    mode = sys.argv[1]
    if mode == "frame":
        cmd_frame(sys.argv[2], sys.argv[3], sys.argv[4])
    elif mode == "px":
        video, t = sys.argv[2], sys.argv[3]
        points = [tuple(map(float, a.split(","))) for a in sys.argv[4:]]
        cmd_px(video, t, points)
    elif mode == "scan":
        cmd_scan(sys.argv[2], sys.argv[3], float(sys.argv[4]), sys.argv[5])
    elif mode == "mad":
        cmd_mad(sys.argv[2], sys.argv[3])
    else:
        print(f"mode không rõ: {mode}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
