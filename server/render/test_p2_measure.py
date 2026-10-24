#!/usr/bin/env python3
"""Đo metric pixel cho test P2 (stabilize / denoise / deinterlace).
Dùng: python3 test_p2_measure.py <lệnh> <video> [tham số]
  jitter <video>   : độ lệch chuẩn vị trí x của hình vuông trắng qua các frame
  noisestd <video> : độ lệch chuẩn pixel vùng phẳng trung tâm (frame giữa)
  idet <video>     : tỉ lệ frame progressive theo filter idet của FFmpeg
"""
import subprocess
import sys

import numpy as np
from PIL import Image


def frames(video, fps=None):
    cmd = ["ffmpeg", "-v", "error", "-i", video]
    if fps:
        cmd += ["-vf", f"fps={fps}"]
    cmd += ["-f", "image2pipe", "-vcodec", "png", "-"]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    imgs = []
    # Tách các PNG nối tiếp nhau bằng magic header
    start = 0
    while True:
        i = out.find(b"\x89PNG\r\n\x1a\n", start)
        if i < 0:
            break
        j = out.find(b"\x89PNG\r\n\x1a\n", i + 8)
        chunk = out[i:j] if j >= 0 else out[i:]
        import io
        imgs.append(np.asarray(Image.open(io.BytesIO(chunk)).convert("L"), dtype=np.float64))
        if j < 0:
            break
        start = j
    return imgs


def cmd_jitter(video):
    fs = frames(video)
    xs = []
    for f in fs:
        mask = f > 200
        if mask.sum() < 100:
            continue
        ys, xcoords = np.where(mask)
        xs.append(xcoords.mean())
    xs = np.array(xs)
    print(f"frames={len(xs)} centroid_x_mean={xs.mean():.2f} centroid_x_std={xs.std():.3f}")
    return xs.std()


def frames_rgb(video):
    cmd = ["ffmpeg", "-v", "error", "-i", video,
           "-f", "image2pipe", "-vcodec", "png", "-"]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    imgs = []
    start = 0
    while True:
        i = out.find(b"\x89PNG\r\n\x1a\n", start)
        if i < 0:
            break
        j = out.find(b"\x89PNG\r\n\x1a\n", i + 8)
        chunk = out[i:j] if j >= 0 else out[i:]
        import io
        imgs.append(np.asarray(Image.open(io.BytesIO(chunk)).convert("RGB"), dtype=np.float64))
        if j < 0:
            break
        start = j
    return imgs


def cmd_redx(video):
    """Centroid x của marker ĐỎ (R>200, G<100, B<100) — đo rung không bị
    texture xám làm pha loãng như metric jitter trắng cũ."""
    fs = frames_rgb(video)
    xs = []
    for f in fs:
        mask = (f[:, :, 0] > 200) & (f[:, :, 1] < 100) & (f[:, :, 2] < 100)
        if mask.sum() < 100:
            continue
        ys, xcoords = np.where(mask)
        xs.append(xcoords.mean())
    xs = np.array(xs)
    print(f"frames={len(xs)} red_centroid_x_mean={xs.mean():.2f} red_centroid_x_std={xs.std():.3f}")
    return xs.std()


def cmd_mad(video):
    """Mean absolute consecutive-frame difference — rung làm MAD tăng."""
    fs = frames(video)
    diffs = [np.abs(fs[i] - fs[i + 1]).mean() for i in range(len(fs) - 1)]
    print(f"frames={len(fs)} consec_MAD={np.mean(diffs):.3f}")
    return float(np.mean(diffs))


def cmd_noisestd(video):
    fs = frames(video)
    f = fs[len(fs) // 2]
    h, w = f.shape
    crop = f[h // 2 - 20:h // 2 + 20, w // 2 - 40:w // 2 + 40]
    print(f"center_crop_std={crop.std():.3f}")
    return crop.std()


def cmd_idet(video):
    r = subprocess.run(
        ["ffmpeg", "-i", video, "-vf", "idet", "-f", "null", "-"],
        capture_output=True, text=True)
    import re
    m = re.findall(r"Single frame detection:.*?TFF:\s*(\d+).*?BFF:\s*(\d+).*?Progressive:\s*(\d+).*?Undetermined:\s*(\d+)",
                   r.stderr)
    if not m:
        print("idet: không parse được output")
        print(r.stderr[-500:])
        return -1
    tff, bff, prog, und = map(int, m[-1])
    total = tff + bff + prog + und
    # Undetermined tính là KHÔNG progressive (không có bằng chứng progressive).
    ratio = prog / total if total else 0
    print(f"TFF={tff} BFF={bff} Progressive={prog} Undetermined={und} prog_ratio={ratio:.3f}")
    return ratio


if __name__ == "__main__":
    fn = {"jitter": cmd_jitter, "redx": cmd_redx, "mad": cmd_mad, "noisestd": cmd_noisestd, "idet": cmd_idet}[sys.argv[1]]
    fn(sys.argv[2])
