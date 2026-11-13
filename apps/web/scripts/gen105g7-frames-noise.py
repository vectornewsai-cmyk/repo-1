#!/usr/bin/env python3
"""gen105g7-frames-noise.py — Phase 9 đợt 105, luồng G7 (Blur r7).

Sinh stimulus KHÔNG TUẦN HOÀN cho r7: video 1280x720, 30 fps, 90 frame
(3 s), mỗi frame nhận diện được duy nhất bằng pixel (xem
docs/PHASE9_ROUND105_G7_BLUR_LIMITS.md §1 + hidden_files/round105-g7.md §1).

Mỗi frame f (0..89):
  1. mosaic thô 16x16 px (80x45 ô), xám ngẫu nhiên U(0,255), seed 20000+f;
  2. code band y in [320,400], khối 4 px rộng, xám ngẫu nhiên U(0,255),
     seed 30000+f — nơi strip hàng giữa đọc (x video ~256-375);
  3. số frame 2 chữ số, DejaVuSans-Bold ~140 px, trắng viền đen, (48,24).
Xám thuần (R=G=B) để kênh G strip = đúng giá trị xám.
Seed cố định theo f -> tái sinh chính xác. Encode libx264 crf 16.

Chạy:  python3 apps/web/scripts/gen105g7-frames-noise.py [--out DIR]
Mặc định ghi apps/web/public/frames-noise.mp4 (binary, KHÔNG stage) +
khung hình tham chiếu sẽ trích riêng bằng ffmpeg khi phân tích.
"""
import argparse
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS, N = 1280, 720, 30, 90
CELL = 16          # mosaic thô: ô 16x16 px
BAND_Y0, BAND_Y1 = 320, 400   # code band quanh hàng giữa y=360
BAND_W = 4         # khối code band rộng 4 px
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def make_frame(f: int) -> Image.Image:
    rng_m = np.random.RandomState(20000 + f)
    grid = rng_m.randint(0, 256, size=(H // CELL, W // CELL), dtype=np.uint8)
    arr = np.repeat(np.repeat(grid, CELL, axis=0), CELL, axis=1)
    # code band: khối 4 px rộng, cao toàn dải
    rng_b = np.random.RandomState(30000 + f)
    band = rng_b.randint(0, 256, size=(W // BAND_W,), dtype=np.uint8)
    band_cols = np.repeat(band, BAND_W)
    arr[BAND_Y0:BAND_Y1, :] = np.tile(band_cols, (BAND_Y1 - BAND_Y0, 1))
    img = Image.fromarray(np.stack([arr, arr, arr], axis=2), mode="RGB")
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(FONT_PATH, 140)
    except OSError:
        font = ImageFont.load_default()
    d.text((48, 24), f"{f:02d}", font=font, fill=(255, 255, 255),
           stroke_width=6, stroke_fill=(0, 0, 0))
    return img


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None,
                    help="thư mục đích (mặc định apps/web/public)")
    ap.add_argument("--keep-frames", default=None,
                    help="giữ PNG frame vào thư mục này (mặc định không giữ)")
    args = ap.parse_args()
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.abspath(os.path.join(here, "..", "..", ".."))
    outdir = args.out or os.path.join(root, "apps", "web", "public")
    os.makedirs(outdir, exist_ok=True)
    tmp = os.path.join(outdir, ".frames-noise-tmp")
    os.makedirs(tmp, exist_ok=True)
    for f in range(N):
        make_frame(f).save(os.path.join(tmp, f"f{f:03d}.png"))
    mp4 = os.path.join(outdir, "frames-noise.mp4")
    cmd = ["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS),
           "-i", os.path.join(tmp, "f%03d.png"),
           "-c:v", "libx264", "-crf", "16", "-preset", "medium",
           "-pix_fmt", "yuv420p", "-r", str(FPS), mp4]
    subprocess.run(cmd, check=True)
    if not args.keep_frames:
        for f in range(N):
            os.remove(os.path.join(tmp, f"f{f:03d}.png"))
        os.rmdir(tmp)
    else:
        os.makedirs(args.keep_frames, exist_ok=True)
        for f in range(N):
            os.rename(os.path.join(tmp, f"f{f:03d}.png"),
                      os.path.join(args.keep_frames, f"f{f:03d}.png"))
        os.rmdir(tmp)
    st = os.stat(mp4)
    print(f"wrote {mp4} ({st.st_size} bytes, {N} frames {W}x{H}@{FPS}fps)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
