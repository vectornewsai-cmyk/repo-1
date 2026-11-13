#!/usr/bin/env python3
"""r79g5-make-media.py — Phase 9 đợt 79, luồng G5: sinh 6 nội dung MỚI
(text nhỏ, gradient, ảnh thật, noise, line art, video frame thật) để sweep
kernel BC(0,25, 0,375) vs tam giác.

Nội dung (media 1280x720, 30fps, trừ videoframe 1920x1080 25fps):
  textsmall  — nền tối + nhiều dòng chữ nhỏ (PIL, DejaVuSans 12px) — 4.0s
  gradient   — gradient 3 màu chéo mượt (ffmpeg gradients) — 4.1s
  photo      — 1 frame thật từ ocean06.ogv (t=3s), loop thành clip tĩnh — 4.2s
  noise      — noise thuần (nullsrc + noise alls=60) — 4.3s
  lineart    — nền trắng + lưới 1px, đường chéo, vòng tròn đồng tâm — 4.4s
  videoframe — ocean06.ogv transcode h264 (clip chuyển động thật) — 6.4s
Bản 640x360 (sinh NATIVE ở 640, không downscale từ 1280 — tránh nhiễm
downscale như F6 §4): textsmall640, gradient640, photo640, noise640,
lineart640. Videoframe KHÔNG có bản 640 (1920->640 sẽ nhiễm như F6).
Thời lượng khác nhau (4.0/4.1/4.2/4.3/4.4/6.4) để harness headed khớp
video element theo duration (fix D3 của F6).

Ra: hidden_files/round79-g5/media/*.mp4 (+ PNG trung gian).
Chỉ chạy PIL/ffmpeg, không sửa code production. KHÔNG push/tag/binary.
"""
import os
import subprocess
import sys
from pathlib import Path

GOAL = Path.home() / "workspace" / "goals" / "capcut-clone-video-editor" / "hidden_files"
MEDIA = GOAL / "round79-g5" / "media"
U3MEDIA = GOAL / "round67-u3" / "media"
OCEAN06 = U3MEDIA / "ocean06.ogv"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def run(cmd, label):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"{label} thất bại (exit {r.returncode}): {(r.stderr or r.stdout)[-800:]}")
    print(f"  ok {label}")


def make_textsmall(w, h, fontsize, out_png):
    from PIL import Image, ImageDraw, ImageFont
    img = Image.new("RGB", (w, h), (30, 34, 40))
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, fontsize)
    font_b = ImageFont.truetype(FONT, fontsize + 2)
    lines = [
        "The quick brown fox jumps over the lazy dog 0123456789",
        "Pack my box with five dozen liquor jugs — 9876543210",
        "Sphinx of black quartz, judge my vow! Voix ambiguë d'un",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz",
        "Video editing is a craft: cut, trim, grade, mix, export.",
        "0123456789 !@#$%^&*()_+-=[]{};':\",./<>?`~ \\|",
    ]
    y = 24
    d.text((24, 8), "SMALL TEXT  •  12px body  •  VCut kernel sweep G5", font=font_b, fill=(220, 225, 235))
    for i in range(26):
        txt = lines[i % len(lines)]
        shade = 150 + (i * 37) % 90
        d.text((24, y), f"{i+1:02d}  {txt}", font=font, fill=(shade, shade, shade + 10))
        y += fontsize + 7
        if y > h - 40:
            break
    # hàng ô màu nhỏ (cạnh sắc, tần số cao theo trục x)
    for k in range(24):
        x0 = 24 + k * 20
        d.rectangle([x0, h - 28, x0 + 16, h - 12],
                    fill=((k * 53) % 256, (k * 97) % 256, (k * 149) % 256))
    img.save(out_png)
    print(f"  ok PNG {out_png.name} ({w}x{h}, font {fontsize}px)")


def make_lineart(w, h, out_png):
    from PIL import Image, ImageDraw
    img = Image.new("RGB", (w, h), (255, 255, 255))
    d = ImageDraw.Draw(img)
    step = 16 if w >= 1280 else 8
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=(0, 0, 0), width=1)
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=(0, 0, 0), width=1)
    # đường chéo 1px
    d.line([(0, 0), (w, h)], fill=(200, 0, 0), width=1)
    d.line([(w, 0), (0, h)], fill=(0, 0, 200), width=1)
    # vòng tròn đồng tâm 1px
    cx, cy = w // 2, h // 2
    r = 12
    while r < min(w, h) // 2:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(0, 0, 0), width=1)
        r += 14 if w >= 1280 else 7
    # vài hình chữ nhật mỏng (cạnh sắc ngang/dọc)
    d.rectangle([40, 40, 240, 52], outline=(0, 0, 0), width=1)
    d.rectangle([w - 260, h - 90, w - 40, h - 40], outline=(0, 0, 0), width=1)
    d.line([(40, h - 60), (w - 40, 60)], fill=(0, 128, 0), width=1)
    img.save(out_png)
    print(f"  ok PNG {out_png.name} ({w}x{h}, lưới {step}px)")


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
    if not OCEAN06.exists():
        raise SystemExit(f"không thấy {OCEAN06}")
    # 1. textsmall (PIL) — 1280 + 640
    for (w, h, fs, tag, dur) in [(1280, 720, 12, "1280", 4.0), (640, 360, 6, "640", 4.0)]:
        png = MEDIA / f"textsmall-{tag}.png"
        make_textsmall(w, h, fs, png)
        png_to_clip(png, dur, MEDIA / f"textsmall-{tag}.mp4")
    # 2. gradient (ffmpeg gradients) — 1280 + 640
    for (w, h, tag, dur) in [(1280, 720, "1280", 4.1), (640, 360, "640", 4.1)]:
        out = MEDIA / f"gradient-{tag}.mp4"
        if out.exists():
            print(f"  bỏ qua (đã có) {out.name}")
            continue
        run(["ffmpeg", "-v", "error", "-y",
             "-f", "lavfi", "-i", f"gradients=s={w}x{h}:c0=1a2a6c:c1=b21f1f:c2=fdbb2d:nb_colors=3",
             "-t", str(dur), "-r", "30",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", str(out)],
            f"clip {out.name}")
    # 3. photo — 1 frame thật ocean06.ogv t=3s (frame 75 @25fps), loop tĩnh
    for (w, h, tag, dur) in [(1280, 720, "1280", 4.2), (640, 360, "640", 4.2)]:
        png = MEDIA / f"photo-{tag}.png"
        if not png.exists():
            run(["ffmpeg", "-v", "error", "-y", "-i", str(OCEAN06),
                 "-vf", f"select='eq(n,75)',scale={w}:{h}", "-frames:v", "1", str(png)],
                f"PNG photo {tag}")
        png_to_clip(png, dur, MEDIA / f"photo-{tag}.mp4")
    # 4. noise TĨNH (v2, sửa sau khi đo lần 1 — xem LIMITS G5 §5):
    #    bản v1 (nullsrc + noise alls=60, temporal) KHÔNG DÙNG ĐƯỢC:
    #    frame trôi độ sáng theo thời gian (Y mean 14,5→24→38,5),
    #    file 78MB không faststart nên metadata/seek của <video> chậm,
    #    preview seek racy → snapshot plain 12,67 vs render 28,53,
    #    D3 đọc nhầm element (duration NaN → fallback els[0]).
    #    v2: 1 khung noise tĩnh (numpy uniform [0,255], seed 79) loop 4.3s
    #    + faststart — mọi frame giống hệt nhau nên seek không còn quan
    #    trọng, file nhỏ, metadata tải ngay. Vẫn là nội dung tần số cao.
    import numpy as np
    from PIL import Image
    for (w, h, tag, dur) in [(1280, 720, "1280", 4.3), (640, 360, "640", 4.3)]:
        png = MEDIA / f"noise-{tag}.png"
        if not png.exists():
            rng = np.random.default_rng(79)
            arr = rng.integers(0, 256, size=(h, w, 3), dtype=np.uint8)
            Image.fromarray(arr, "RGB").save(png)
            print(f"  ok PNG {png.name} ({w}x{h}, uniform [0,255] seed 79)")
        png_to_clip(png, dur, MEDIA / f"noise-{tag}.mp4")
    # 5. lineart (PIL) — 1280 + 640
    for (w, h, tag, dur) in [(1280, 720, "1280", 4.4), (640, 360, "640", 4.4)]:
        png = MEDIA / f"lineart-{tag}.png"
        make_lineart(w, h, png)
        png_to_clip(png, dur, MEDIA / f"lineart-{tag}.mp4")
    # 6. videoframe — ocean06.ogv transcode h264 1920x1080, giữ 25fps/6.4s
    out = MEDIA / "videoframe.mp4"
    if out.exists():
        print(f"  bỏ qua (đã có) {out.name}")
    else:
        run(["ffmpeg", "-v", "error", "-y", "-i", str(OCEAN06),
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
             "-an", str(out)], "clip videoframe.mp4")
    print(f"\nXONG — media tại {MEDIA}")
    for p in sorted(MEDIA.glob("*.mp4")):
        print(f"  {p.name}  {p.stat().st_size} byte")


if __name__ == "__main__":
    main()
