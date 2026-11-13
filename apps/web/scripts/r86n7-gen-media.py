#!/usr/bin/env python3
"""r86n7-gen-media.py — Phase 9 đợt 86, luồng N7: sinh clip tổng hợp có
ground truth để hoàn thiện danh tính toán tử video (đóng nợ M2 §1.4 + L2 §5.1).

Clip 640x360, tĩnh 2 s, 30 fps, yuv420p, libx264 crf 0 (cùng công thức M2).
Khác M2: bậc 0->255 (biên độ tối đa -> trích trọng số rời rạc với độ phân
giải 1/255 thay vì 1/128), 2 vị trí biên (x=320 và x=160 / y=180 và y=90)
để phủ pha dày hơn, và patch màu bão hoà để định danh ma trận YUV->RGB
+ cách upscale chroma của đường decode video.

  stepV255 : bậc luma dọc x=320 (0 -> 255)
  stepH255 : bậc luma ngang y=180 (0 -> 255)
  stepV255b: bậc luma dọc x=160 (0 -> 255)
  stepH255b: bậc luma ngang y=90 (0 -> 255)
  patches  : 4x2 ô 160x180: đen/trắng/đỏ/lục / lam/vàng/cyan/magenta

Chạy: python3 r86n7-gen-media.py (ghi vào hidden_files/round86-n7/media).
KHÔNG push/tag/binary/workflow. Media mp4 là bằng chứng đo, KHÔNG stage.
"""
import os
import subprocess

import numpy as np

HOME = os.path.expanduser("~")
N7 = os.path.join(HOME, "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round86-n7")
MEDIA = os.path.join(N7, "media")
W, H = 640, 360
FPS = 30
DUR = 2


def write_rgb_frame(rgb, path):
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
    p = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                        "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
                        "-of", "csv=p=0", mp4_path],
                       capture_output=True, text=True, check=True)
    print(f"  {os.path.basename(mp4_path)}: {p.stdout.strip()}")


def main():
    os.makedirs(MEDIA, exist_ok=True)
    # stepV255
    f = np.zeros((H, W, 3), dtype=np.uint8); f[:, 320:] = 255
    write_rgb_frame(f, os.path.join(MEDIA, "stepV255.rgb")); encode(os.path.join(MEDIA, "stepV255.rgb"), os.path.join(MEDIA, "stepV255.mp4"))
    # stepH255
    f = np.zeros((H, W, 3), dtype=np.uint8); f[180:, :] = 255
    write_rgb_frame(f, os.path.join(MEDIA, "stepH255.rgb")); encode(os.path.join(MEDIA, "stepH255.rgb"), os.path.join(MEDIA, "stepH255.mp4"))
    # stepV255b (edge x=160)
    f = np.zeros((H, W, 3), dtype=np.uint8); f[:, 160:] = 255
    write_rgb_frame(f, os.path.join(MEDIA, "stepV255b.rgb")); encode(os.path.join(MEDIA, "stepV255b.rgb"), os.path.join(MEDIA, "stepV255b.mp4"))
    # stepH255b (edge y=90)
    f = np.zeros((H, W, 3), dtype=np.uint8); f[90:, :] = 255
    write_rgb_frame(f, os.path.join(MEDIA, "stepH255b.rgb")); encode(os.path.join(MEDIA, "stepH255b.rgb"), os.path.join(MEDIA, "stepH255b.mp4"))
    # patches: 4 cols x 2 rows, 160x180 each
    cols = [(0, 0, 0), (255, 255, 255), (255, 0, 0), (0, 255, 0),
            (0, 0, 255), (255, 255, 0), (0, 255, 255), (255, 0, 255)]
    f = np.zeros((H, W, 3), dtype=np.uint8)
    for k, c in enumerate(cols):
        cx, cy = (k % 4) * 160, (k // 4) * 180
        f[cy:cy + 180, cx:cx + 160] = c
    write_rgb_frame(f, os.path.join(MEDIA, "patches.rgb")); encode(os.path.join(MEDIA, "patches.rgb"), os.path.join(MEDIA, "patches.mp4"))
    print("xong.")


if __name__ == "__main__":
    main()
