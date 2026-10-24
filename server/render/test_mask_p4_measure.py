#!/usr/bin/env python3
"""Đo pixel frame giữa video cho test_mask_p4.js.

Dùng: python3 test_mask_p4_measure.py <video.mp4> <x,y> [<x,y> ...]
  x, y: vị trí tương đối 0..1 trong khung hình.
In: px_<x>_<y>=R,G,B cho mỗi điểm (frame ở giữa video, trừ 0.5s cuối để
tránh rơi vào transition khi test mask + fade).
"""
import subprocess
import sys
import tempfile
import os

from PIL import Image


def main() -> int:
    video = sys.argv[1]
    points = []
    for arg in sys.argv[2:]:
        x, y = arg.split(",")
        points.append((float(x), float(y)))
    # Lấy duration rồi trích frame ở giữa (capped 1.5s cho clip 3s).
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", video], capture_output=True, text=True)
    dur = float(probe.stdout.strip())
    t = min(dur / 2, 1.5)
    with tempfile.TemporaryDirectory() as td:
        frame = os.path.join(td, "f.png")
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", video,
             "-frames:v", "1", frame], check=True)
        img = Image.open(frame).convert("RGB")
        w, h = img.size
        for x, y in points:
            px = max(0, min(w - 1, int(x * w)))
            py = max(0, min(h - 1, int(y * h)))
            r, g, b = img.getpixel((px, py))
            print(f"px_{x}_{y}={r},{g},{b}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
