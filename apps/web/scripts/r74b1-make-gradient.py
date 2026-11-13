#!/usr/bin/env python3
"""r74b1-make-gradient.py — Phase 9 đợt 74, luồng B1: tạo ảnh/video tổng hợp
để probe cơ chế phương sai thừa ở pixel gradient cao (nợ A3 §6a).

Ảnh 1280x720, 5 dải ngang (mỗi dải 144px), RGB xám (R=G=B):
  A y[0,144)    : phẳng 128 (gradient 0)
  B y[144,288)  : ramp ngang 0->255 trên toàn chiều rộng (slope ~0.20/px)
  C y[288,432)  : răng cưa ngang 0->255 chu kỳ 128px (slope ~2.0/px)
  D y[432,576)  : checkerboard khối 2x2 0/255 (gradient cực đại, Nyquist)
  E y[576,720)  : sine dọc chu kỳ 8px, 0..255 (gradient dọc tới ~100/px)
Video: tĩnh (mọi frame giống nhau), h264 yuv420p 30fps 4s, CRF 10.
Gradient thật đo trên frame đã decode (không giả định sau encode lossy).
"""
import os
import math
import subprocess
import sys

from PIL import Image

W, H = 1280, 720
OUT = os.path.expanduser(
    "~/workspace/goals/capcut-clone-video-editor/hidden_files/round74-b1"
)
MEDIA = os.path.join(OUT, "media")
os.makedirs(MEDIA, exist_ok=True)

img = Image.new("RGB", (W, H))
px = img.load()
for y in range(H):
    for x in range(W):
        if y < 144:
            v = 128
        elif y < 288:
            v = round(x * 255 / (W - 1))
        elif y < 432:
            v = round((x % 128) * 255 / 127)
        elif y < 576:
            v = 255 if ((x // 2) + (y // 2)) % 2 == 0 else 0
        else:
            v = round(127.5 + 127.5 * math.sin(2 * math.pi * y / 8))
        px[x, y] = (v, v, v)

png = os.path.join(MEDIA, "gradient.png")
img.save(png)
mp4 = os.path.join(MEDIA, "gradient.mp4")
subprocess.run([
    "ffmpeg", "-y", "-v", "error",
    "-loop", "1", "-framerate", "30", "-i", png,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
    "-t", "4", "-crf", "10", "-preset", "slow", mp4,
], check=True)

# Decode frame 30 (playhead 1.0s @30fps) và frame 0 để kiểm tra tĩnh.
for n in (0, 30):
    raw = os.path.join(MEDIA, f"gradient-f{n}.rgb")
    subprocess.run([
        "ffmpeg", "-y", "-v", "error", "-i", mp4,
        "-vf", f"select=eq(n\\,{n})", "-vframes", "1",
        "-f", "rawvideo", "-pix_fmt", "rgb24", raw,
    ], check=True)

a = open(os.path.join(MEDIA, "gradient-f0.rgb"), "rb").read()
b = open(os.path.join(MEDIA, "gradient-f30.rgb"), "rb").read()
n = len(a) // 3
mad = sum(abs(a[i] - b[i]) for i in range(len(a))) / len(a)
print(f"png={png} mp4={mp4} bytes={os.path.getsize(mp4)}")
print(f"frame0 vs frame30: MAD={mad:.4f} (0 = tĩnh hoàn toàn)")
# Gradient đo trên frame đã decode (kênh G, |dx| trung bình theo dải).
import statistics
for name, (y0, y1) in {"A_flat": (0, 144), "B_ramp": (144, 288),
                       "C_sawtooth": (288, 432), "D_checker": (432, 576),
                       "E_sine": (576, 720)}.items():
    gx, gy = [], []
    for y in range(y0 + 1, y1 - 1):
        for x in range(1, W - 1):
            i = (y * W + x) * 3 + 1
            gx.append(abs(b[i + 3] - b[i - 3]) / 2)
            gy.append(abs(b[i + W * 3] - b[i - W * 3]) / 2)
    print(f"band {name}: mean|gx|={statistics.mean(gx):.2f} "
          f"mean|gy|={statistics.mean(gy):.2f} "
          f"p95|gx|={sorted(gx)[int(len(gx)*0.95)]:.1f}")
