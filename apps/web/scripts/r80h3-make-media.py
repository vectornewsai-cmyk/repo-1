#!/usr/bin/env python3
"""r80h3-make-media.py — Phase 9 đợt 80, luồng H3: sinh nội dung probe
xung vuông (nợ F6 §7.3 / G5 §9.2) + lineart 2px (đối chứng lineart 1px).

Xung vuông (sqwP, P = 4/8/16/32 px): nửa trên sọc DỌC chu kỳ P, nửa dưới
sọc NGANG chu kỳ P, mức xám 64/192 (giữ headroom cho overshoot của kernel
BC — không kẹp 0/255). Grayscale nên yuv420p không làm mờ luma. Tĩnh
theo frame (loop 1 PNG) + faststart như G5 v2 — seek không racy.
Thời lượng khác nhau (4.0/4.1/4.2/4.3/4.4) để khớp video element theo
duration (fix D3 của F6). Bản 640x360 sinh NATIVE (không downscale).

lineart2px: cùng bố cục lineart G5 nhưng nét 2px (lưới 16px/8px, vòng tròn,
đường chéo, hình chữ nhật) — đối chứng: nếu noise KHỚP ở 2px mà LỆCH ở
1px thì nguyên nhân là aliasing nguồn 1px, không phải kernel.

Ra: hidden_files/round80-h3/media/*.mp4 (+ PNG trung gian).
Chỉ chạy PIL/ffmpeg, không sửa code production. KHÔNG push/tag/binary.
"""
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

GOAL = Path.home() / "workspace" / "goals" / "capcut-clone-video-editor" / "hidden_files"
MEDIA = GOAL / "round80-h3" / "media"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

LO, HI = 64, 192


def run(cmd, label):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"{label} thất bại (exit {r.returncode}): {(r.stderr or r.stdout)[-800:]}")
    print(f"  ok {label}")


def make_sqw(w, h, period, out_png):
    arr = np.zeros((h, w), dtype=np.uint8)
    xs = np.arange(w)
    ys = np.arange(h)
    # nửa trên: sọc dọc theo x; nửa dưới: sọc ngang theo y
    top = np.where(((xs // period) % 2) == 0, HI, LO).astype(np.uint8)
    arr[: h // 2, :] = top[None, :]
    side = np.where(((ys // period) % 2) == 0, HI, LO).astype(np.uint8)
    arr[h // 2 :, :] = side[h // 2 :, None]
    Image.fromarray(arr, "L").convert("RGB").save(out_png)
    print(f"  ok PNG {out_png.name} ({w}x{h}, chu kỳ {period}px, mức {LO}/{HI})")


def make_lineart2px(w, h, out_png):
    img = Image.new("RGB", (w, h), (255, 255, 255))
    d = ImageDraw.Draw(img)
    step = 16 if w >= 1280 else 8
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=(0, 0, 0), width=2)
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=(0, 0, 0), width=2)
    d.line([(0, 0), (w, h)], fill=(200, 0, 0), width=2)
    d.line([(w, 0), (0, h)], fill=(0, 0, 200), width=2)
    cx, cy = w // 2, h // 2
    r = 12
    while r < min(w, h) // 2:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(0, 0, 0), width=2)
        r += 14 if w >= 1280 else 7
    d.rectangle([40, 40, 240, 52], outline=(0, 0, 0), width=2)
    d.rectangle([w - 260, h - 90, w - 40, h - 40], outline=(0, 0, 0), width=2)
    d.line([(40, h - 60), (w - 40, 60)], fill=(0, 128, 0), width=2)
    img.save(out_png)
    print(f"  ok PNG {out_png.name} ({w}x{h}, lưới {step}px, nét 2px)")


def png_to_clip(png, dur, out_mp4):
    if out_mp4.exists():
        print(f"  bỏ qua (đã có) {out_mp4.name}")
        return
    run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", "30",
         "-i", str(png), "-t", str(dur), "-r", "30",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
         "-movflags", "+faststart", str(out_mp4)], f"clip {out_mp4.name}")


def main():
    MEDIA.mkdir(parents=True, exist_ok=True)
    # sqw 1280 + 640 native, thời lượng 4.0/4.1/4.2/4.3 theo chu kỳ
    for period, dur in [(4, 4.0), (8, 4.1), (16, 4.2), (32, 4.3)]:
        for (w, h, tag) in [(1280, 720, "1280"), (640, 360, "640")]:
            png = MEDIA / f"sqw{period}-{tag}.png"
            make_sqw(w, h, period, png)
            png_to_clip(png, dur, MEDIA / f"sqw{period}-{tag}.mp4")
    # lineart2px 1280 + 640, thời lượng 4.4
    for (w, h, tag) in [(1280, 720, "1280"), (640, 360, "640")]:
        png = MEDIA / f"lineart2px-{tag}.png"
        make_lineart2px(w, h, png)
        png_to_clip(png, 4.4, MEDIA / f"lineart2px-{tag}.mp4")
    print(f"\nXONG — media tại {MEDIA}")
    for p in sorted(MEDIA.glob("*.mp4")):
        print(f"  {p.name}  {p.stat().st_size} byte")


if __name__ == "__main__":
    main()
