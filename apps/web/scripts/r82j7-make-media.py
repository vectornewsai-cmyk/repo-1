#!/usr/bin/env python3
"""r82j7-make-media.py — Phase 9 đợt 82, luồng J7: sinh lineart 3px/4px
(đối chứng độ dày cho nợ I3 §4.4 — delta MAD ~4,1 không phụ thuộc kernel).

Cùng bố cục lineart2px của H3 (r80h3-make-media.py: lưới 8px ở 640, vòng
tròn, đường chéo, hình chữ nhật), chỉ đổi độ dày nét thành 3px / 4px.
Thời lượng 4.5 / 4.6 s (khác 4.4 của lineart2px-640) để harness headed
khớp video element theo duration (fix D3 của F6). Bản 640×360 sinh NATIVE.

Ra: hidden_files/round82-j7/media/*.mp4 (+ PNG trung gian).
Chỉ chạy PIL/ffmpeg, không sửa code production. KHÔNG push/tag/binary.
"""
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

GOAL = Path.home() / "workspace" / "goals" / "capcut-clone-video-editor" / "hidden_files"
MEDIA = GOAL / "round82-j7" / "media"


def run(cmd, label):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"{label} thất bại (exit {r.returncode}): {(r.stderr or r.stdout)[-800:]}")
    print(f"  ok {label}")


def make_lineart(w, h, width, out_png):
    img = Image.new("RGB", (w, h), (255, 255, 255))
    d = ImageDraw.Draw(img)
    step = 16 if w >= 1280 else 8
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=(0, 0, 0), width=width)
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=(0, 0, 0), width=width)
    d.line([(0, 0), (w, h)], fill=(200, 0, 0), width=width)
    d.line([(w, 0), (0, h)], fill=(0, 0, 200), width=width)
    cx, cy = w // 2, h // 2
    r = 12
    while r < min(w, h) // 2:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(0, 0, 0), width=width)
        r += 14 if w >= 1280 else 7
    d.rectangle([40, 40, 240, 52], outline=(0, 0, 0), width=width)
    d.rectangle([w - 260, h - 90, w - 40, h - 40], outline=(0, 0, 0), width=width)
    d.line([(40, h - 60), (w - 40, 60)], fill=(0, 128, 0), width=width)
    img.save(out_png)
    print(f"  ok PNG {out_png.name} ({w}x{h}, lưới {step}px, nét {width}px)")


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
    for width, dur in [(3, 4.5), (4, 4.6)]:
        png = MEDIA / f"lineart{width}px-640.png"
        make_lineart(640, 360, width, png)
        png_to_clip(png, dur, MEDIA / f"lineart{width}px-640.mp4")
    print("\nXONG — media tại", MEDIA)
    for p in sorted(MEDIA.glob("*.mp4")):
        print(f"  {p.name}  {p.stat().st_size} byte")


if __name__ == "__main__":
    main()
