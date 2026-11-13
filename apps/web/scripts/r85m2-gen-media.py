#!/usr/bin/env python3
"""r85m2-gen-media.py — Phase 9 đợt 85, luồng M2: sinh clip tổng hợp có
ground truth cho probe danh tính toán tử video (nhiệm vụ 1) + video noise
cho probe B (nhiệm vụ 2).

Tất cả clip 640x360, tĩnh 2 s, 30 fps, yuv420p, libx264 crf 0 (gần
lossless cho plane luma; chroma 4:2:0 theo chuẩn pipeline video).
Nền xám 128, đặc trưng 200 (line/impulse) hoặc bậc 64->192 (step) để
lộ lobe âm (không bị kẹp 0/255). Biên step đặt ở x=320 (chẵn) để khớp
lưới chroma 2x2 khi encode yuv420p.

Clip nhiệm vụ 1 (đo đáp ứng xung/bậc của scaler video):
  stepV-gray  : bậc luma dọc x=320 (64 -> 192)
  stepH-gray  : bậc luma ngang y=180
  lineV-gray  : vạch dọc 1 px x=320, giá trị 200
  lineH-gray  : vạch ngang 1 px y=180, giá trị 200
  impulse-gray: 1 pixel 200 tại (320,180)
  stepV-colorCb: bậc chroma Cb 90 -> 166, Y=128 hằng, Cr=128 hằng
  stepV-colorCr: bậc chroma Cr 90 -> 166, Y=128 hằng, Cb=128 hằng
Clip nhiệm vụ 2 (cùng frame với render F6, để so video-path vs canvas-path):
  ocean-plain / ocean-noise05 / ocean-noise10: từ fullrgb-*.raw (F6)
Chạy: python3 r85m2-gen-media.py  (cần ffmpeg; ghi vào hidden_files/round85-m2/media)
KHÔNG push/tag/binary/workflow. Media mp4 là bằng chứng đo, KHÔNG stage.
"""
import os
import subprocess
import sys

import numpy as np

HOME = os.path.expanduser("~")
M2 = os.path.join(HOME, "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round85-m2")
MEDIA = os.path.join(M2, "media")
F6R = os.path.join(HOME, "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round78-f6", "render", "ocean640")
W, H = 640, 360
FPS = 30
DUR = 2  # s


def yuv709_to_rgb(y, cb, cr):
    yy = 1.164383 * (y - 16)
    return (yy + 1.79274 * (cr - 128),
            yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128),
            yy + 2.1122 * (cb - 128))


def write_rgb_frame(rgb, path):
    """rgb: (H, W, 3) uint8."""
    with open(path, "wb") as f:
        f.write(rgb.astype(np.uint8).tobytes())


def encode(rgb_path, mp4_path):
    cmd = ["ffmpeg", "-y", "-v", "error",
           "-stream_loop", "59",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", rgb_path,
           "-vf", "format=yuv420p",
           "-c:v", "libx264", "-crf", "0", "-preset", "veryfast",
           "-pix_fmt", "yuv420p", "-r", str(FPS), "-t", str(DUR),
           "-movflags", "+faststart", mp4_path]
    subprocess.run(cmd, check=True)
    # kiểm chứng nhanh: số frame + kích thước
    p = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                        "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
                        "-of", "csv=p=0", mp4_path],
                       capture_output=True, text=True, check=True)
    print(f"  {os.path.basename(mp4_path)}: {p.stdout.strip()}")


def main():
    os.makedirs(MEDIA, exist_ok=True)
    # --- nhiệm vụ 1 ---
    bg = np.full((H, W, 3), 128, dtype=np.uint8)
    # stepV-gray
    f = bg.copy(); f[:, :320] = 64; f[:, 320:] = 192
    write_rgb_frame(f, os.path.join(MEDIA, "stepV-gray.rgb")); encode(os.path.join(MEDIA, "stepV-gray.rgb"), os.path.join(MEDIA, "stepV-gray.mp4"))
    # stepH-gray
    f = bg.copy(); f[:180, :] = 64; f[180:, :] = 192
    write_rgb_frame(f, os.path.join(MEDIA, "stepH-gray.rgb")); encode(os.path.join(MEDIA, "stepH-gray.rgb"), os.path.join(MEDIA, "stepH-gray.mp4"))
    # lineV-gray
    f = bg.copy(); f[:, 320] = 200
    write_rgb_frame(f, os.path.join(MEDIA, "lineV-gray.rgb")); encode(os.path.join(MEDIA, "lineV-gray.rgb"), os.path.join(MEDIA, "lineV-gray.mp4"))
    # lineH-gray
    f = bg.copy(); f[180, :] = 200
    write_rgb_frame(f, os.path.join(MEDIA, "lineH-gray.rgb")); encode(os.path.join(MEDIA, "lineH-gray.rgb"), os.path.join(MEDIA, "lineH-gray.mp4"))
    # impulse-gray
    f = bg.copy(); f[180, 320] = 200
    write_rgb_frame(f, os.path.join(MEDIA, "impulse-gray.rgb")); encode(os.path.join(MEDIA, "impulse-gray.rgb"), os.path.join(MEDIA, "impulse-gray.mp4"))
    # stepV-colorCb: Y=128 const, Cb 90->166, Cr=128 (bt709)
    y = np.full((H, W), 128.0)
    cb = np.full((H, W), 90.0); cb[:, 320:] = 166.0
    cr = np.full((H, W), 128.0)
    r, g, b = yuv709_to_rgb(y, cb, cr)
    f = np.stack([np.clip(r, 0, 255), np.clip(g, 0, 255), np.clip(b, 0, 255)], axis=-1)
    write_rgb_frame(f, os.path.join(MEDIA, "stepV-colorCb.rgb")); encode(os.path.join(MEDIA, "stepV-colorCb.rgb"), os.path.join(MEDIA, "stepV-colorCb.mp4"))
    # stepV-colorCr: Y=128 const, Cr 90->166, Cb=128
    cb = np.full((H, W), 128.0)
    cr = np.full((H, W), 90.0); cr[:, 320:] = 166.0
    r, g, b = yuv709_to_rgb(y, cb, cr)
    f = np.stack([np.clip(r, 0, 255), np.clip(g, 0, 255), np.clip(b, 0, 255)], axis=-1)
    write_rgb_frame(f, os.path.join(MEDIA, "stepV-colorCr.rgb")); encode(os.path.join(MEDIA, "stepV-colorCr.rgb"), os.path.join(MEDIA, "stepV-colorCr.mp4"))
    # --- nhiệm vụ 2: video từ frame render F6 ---
    for v in ["plain", "noise05", "noise10"]:
        raw = os.path.join(F6R, f"fullrgb-{v}.raw")
        data = np.fromfile(raw, dtype=np.uint8)
        assert data.size == W * H * 3, (v, data.size)
        rgb_path = os.path.join(MEDIA, f"ocean-{v}.rgb")
        with open(rgb_path, "wb") as f:
            f.write(data.tobytes())
        encode(rgb_path, os.path.join(MEDIA, f"ocean-{v}.mp4"))
    print("OK gen-media")


if __name__ == "__main__":
    main()
