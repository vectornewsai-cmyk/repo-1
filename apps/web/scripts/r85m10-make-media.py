#!/usr/bin/env python3
"""r85m10-make-media.py — Phase 9 đợt 85, luồng M10: sinh clip video probe
scaler kiểu J2 nhưng với NGUỒN VIDEO thật (nợ L5 đợt 84 §7 mục 1).

Mục đích: đọc trực tiếp đáp ứng xung/lobe của scaler video→canvas của
Chrome (drawImage video element), tách delta lineart 5,39/4,05 theo khâu:
decode (video→native 1:1 vs ffmpeg) / scale (video→viewport vs kernel
trên frame decode thật) / color-convert (xung đỏ: luma/chroma tách riêng?).

Media (640x360, 30fps, yuv420p, libx264 crf 18 — cùng cấu hình media G5/H3;
-g nhỏ để seek từng frame nhanh trong probe headed):
- impulse-v-640.mp4: 640 frame; frame f: nền xám 128, cột trắng 255 tại
  x=f (sweep kiểu J2 §2.3 nhưng nguồn video; 255 trên 128 để lobe âm
  hiện thành dip dưới 128, như mẫu impulse của J2).
- impulse-h-640.mp4: 360 frame; frame f: nền 128, hàng trắng 255 tại y=f
  (kiểm đẳng hướng X vs Y của scaler video).
- step-640.mp4: tĩnh 30 frame; nửa trái 64, nửa phải 192, bước tại x=320
  (đo overshoot/đáp ứng bước của scaler video).
- impulse-red-640.mp4: tĩnh 30 frame; nền 128, cột ĐỎ (255,0,0) tại x=320
  (khâu color-convert: nếu scaler video tách mặt phẳng Y và UV — kiểu
  libyuv — thì profile kênh R sẽ rộng/khác kênh G/B; trên nội dung xám
  U=V=128 hằng nên không thấy được).
Ra: hidden_files/round85-m10/media/*.mp4 (+ manifest JSON).
Chỉ chạy numpy/ffmpeg, không sửa code production. KHÔNG push/tag/binary.
"""
import json
import subprocess
from pathlib import Path

import numpy as np

GOAL = Path.home() / "workspace" / "goals" / "capcut-clone-video-editor" / "hidden_files"
MEDIA = GOAL / "round85-m10" / "media"
W, H, FPS = 640, 360, 30


def encode(frames, out_mp4, gop):
    """frames: iterable np.uint8 (H, W, 3) RGB — pipe rawvideo vào ffmpeg."""
    if out_mp4.exists():
        print(f"  bỏ qua (đã có) {out_mp4.name}")
        return
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
           "-g", str(gop), "-preset", "veryfast",
           "-movflags", "+faststart", str(out_mp4)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = 0
    for fr in frames:
        p.stdin.write(fr.astype(np.uint8, copy=False).tobytes())
        n += 1
    p.stdin.close()
    rc = p.wait()
    if rc != 0:
        raise SystemExit(f"encode {out_mp4.name} thất bại (exit {rc})")
    print(f"  ok {out_mp4.name} ({n} frame, {out_mp4.stat().st_size} byte)")


def impulse_v():
    for f in range(W):
        fr = np.full((H, W, 3), 128, dtype=np.uint8)
        fr[:, f, :] = 255
        yield fr


def impulse_h():
    for f in range(H):
        fr = np.full((H, W, 3), 128, dtype=np.uint8)
        fr[f, :, :] = 255
        yield fr


def step():
    fr = np.full((H, W, 3), 192, dtype=np.uint8)
    fr[:, :320, :] = 64
    for _ in range(30):
        yield fr


def impulse_red():
    fr = np.full((H, W, 3), 128, dtype=np.uint8)
    fr[:, 320, :] = (255, 0, 0)
    for _ in range(30):
        yield fr


def main():
    MEDIA.mkdir(parents=True, exist_ok=True)
    encode(impulse_v(), MEDIA / "impulse-v-640.mp4", gop=5)
    encode(impulse_h(), MEDIA / "impulse-h-640.mp4", gop=5)
    encode(step(), MEDIA / "step-640.mp4", gop=10)
    encode(impulse_red(), MEDIA / "impulse-red-640.mp4", gop=10)
    manifest = {
        "w": W, "h": H, "fps": FPS, "pix_fmt": "yuv420p", "crf": 18,
        "clips": {
            "impulse-v-640": {"file": "impulse-v-640.mp4", "frames": 640, "duration": 640 / FPS},
            "impulse-h-640": {"file": "impulse-h-640.mp4", "frames": 360, "duration": 360 / FPS},
            "step-640": {"file": "step-640.mp4", "frames": 30, "duration": 1.0},
            "impulse-red-640": {"file": "impulse-red-640.mp4", "frames": 30, "duration": 1.0},
        },
        "reused": {
            "lineart640": "round79-g5/media/lineart-640.mp4",
            "lineart2px-640": "round80-h3/media/lineart2px-640.mp4",
            "sqw4-640": "round80-h3/media/sqw4-640.mp4",
        },
    }
    (MEDIA / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print("XONG — media tại", MEDIA)


if __name__ == "__main__":
    main()
