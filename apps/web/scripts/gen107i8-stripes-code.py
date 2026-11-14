#!/usr/bin/env python3
"""gen107i8-stripes-code.py — Phase 9 đợt 107, luồng I8 (Blur cụm A stripes).

Sinh stimulus MỚI `stripes-code.mp4`: giữ nguyên pixel stripes của
stripes-scroll.mp4 (frame đã giải mã) + overlay code band + số frame theo
ĐÚNG hình học G7 (gen105g7-frames-noise.py) để strip nhận diện được content
từng frame — điều strip trên stripes thuần KHÔNG làm được (frame lặp sau 24,
hàng giữa lặp sau 5; second-nearest MAD med 0,00 — xem prereg-i8.md §0.1).

Mỗi frame f (0..89):
  1. frame stripes đã giải mã từ stripes-scroll.mp4 (giữ nguyên chuyển động);
  2. code band y in [320,400], khối 4 px rộng, xám ngẫu nhiên U(0,255),
     seed 30000+f — nơi strip hàng giữa đọc (x video ~256-375);
  3. số frame 2 chữ số, DejaVuSans-Bold ~140 px, trắng viền đen, (48,24).
Xám thuần (R=G=B) để kênh G strip = đúng giá trị xám.
Encode libx264 crf 16 (giống G7).

Chạy:  python3 apps/web/scripts/gen107i8-stripes-code.py [--ref-dir DIR]
Mặc định lấy frame tham chiếu từ hidden_files/round107-i8/ref-stripes
(đã trích bằng ffmpeg từ stripes-scroll.mp4); nếu thiếu thì tự trích.
Mặc định ghi apps/web/public/stripes-code.mp4 (binary, KHÔNG stage).
"""
import argparse
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS, N = 1280, 720, 30, 90
BAND_Y0, BAND_Y1 = 320, 400   # code band quanh hàng giữa y=360 (như G7)
BAND_W = 4                    # khối code band rộng 4 px (như G7)
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def make_frame(base_arr: np.ndarray, f: int) -> Image.Image:
    arr = base_arr.copy()
    # code band: khối 4 px rộng, cao toàn dải (seed G7: 30000+f)
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
    ap.add_argument("--ref-dir", default=None,
                    help="thư mục frame stripes đã giải mã (mặc định hidden_files/round107-i8/ref-stripes)")
    ap.add_argument("--out", default=None,
                    help="thư mục đích (mặc định apps/web/public)")
    ap.add_argument("--keep-frames", default=None,
                    help="giữ PNG frame vào thư mục này (mặc định không giữ)")
    args = ap.parse_args()
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.abspath(os.path.join(here, "..", "..", ".."))
    home = os.path.expanduser("~")
    refdir = args.ref_dir or os.path.join(
        home, "workspace", "goals", "capcut-clone-video-editor",
        "hidden_files", "round107-i8", "ref-stripes")
    outdir = args.out or os.path.join(root, "apps", "web", "public")
    os.makedirs(outdir, exist_ok=True)
    tmp = os.path.join(outdir, ".stripes-code-tmp")
    os.makedirs(tmp, exist_ok=True)
    if not os.path.isfile(os.path.join(refdir, "f001.png")):
        # tự trích từ stripes-scroll.mp4
        src = os.path.join(outdir, "stripes-scroll.mp4")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src,
                        os.path.join(tmp, "src%03d.png")], check=True)
        for f in range(N):
            os.rename(os.path.join(tmp, f"src{f+1:03d}.png"),
                      os.path.join(tmp, f"f{f+1:03d}.png"))
        refdir = tmp
    for f in range(N):
        base = np.asarray(Image.open(
            os.path.join(refdir, f"f{f+1:03d}.png")).convert("L"))
        make_frame(base, f).save(os.path.join(tmp, f"f{f:03d}.png"))
    mp4 = os.path.join(outdir, "stripes-code.mp4")
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
