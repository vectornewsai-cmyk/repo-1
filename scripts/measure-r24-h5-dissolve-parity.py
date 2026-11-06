#!/usr/bin/env python3
"""Đo parity nhanh dissolve RGB24 cho cặp dọc mới đợt 24 H5 (N1 -> N2).

Phương pháp (trung thực, không dùng lại script đo đợt 22 vì nó không còn
trong repo — xem docs/PHASE9_ROUND24_H5_VERTICAL_LIBRARY_LIMITS.md):
  1. ffmpeg cắt 2 cửa sổ 2 s (mặc định N1 10-12 s, N2 10-12 s), chuẩn
     hoá 720x1280, 30 fps, rgb24.
  2. ffmpeg xfade transition=dissolve (offset 0, duration 2 s) cho ra
     chuỗi render R (60 frame).
  3. Mô hình preview: pixel (x, y) thành B khi frand(x, y) < p, với
     frand tái tạo đúng vf_xfade.c bằng float32 từng bước (xem
     apps/web/src/lib/dissolveFrand.ts: sinf float32, hằng float32).
     Tiến độ p của từng frame KHÔNG đoán theo công thức thời gian mà
     đo từ chính frame render: p_hat = tỉ lệ pixel gần B hơn A (pixel
     dissolve luôn đúng bằng A hoặc B, nên p_hat đo được sạch). Nhờ
     vậy số đo kiểm tra TRƯỜNG NGẪU NHIÊN không gian của frand, còn
     sai lệch ánh xạ thời gian (nếu có) lộ ra ở cột p_hat so với tiến
     độ danh nghĩa (i+1)/N.
  4. MAD = trung bình |model - render| trên mọi kênh/pixel/frame;
     le8 = tỉ lệ pixel có max|diff| <= 8. Ngưỡng V6: MAD <= 2 và
     le8 >= 99% => KHOP, ngược lại ghi đúng số, không ép verdict.

Cách dùng:
  measure-r24-h5-dissolve-parity.py A.mp4 B.mp4 OUT.json [--a-start 10 --b-start 10]
Chỉ đọc file đầu vào, không ghi gì ngoài OUT.json. Cần ffmpeg + numpy.
"""
import argparse
import json
import subprocess
import sys

import numpy as np

W, H, FPS, DUR = 720, 1280, 30, 2
NFRAMES = FPS * DUR


def extract_window(path, start):
    cmd = [
        "ffmpeg", "-v", "error", "-ss", str(start), "-i", path,
        "-t", str(DUR), "-vf", f"scale={W}:{H},fps={FPS},format=rgb24",
        "-f", "rawvideo", "-",
    ]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    frames = np.frombuffer(out, dtype=np.uint8)
    expect = NFRAMES * H * W * 3
    if frames.size != expect:
        raise SystemExit(f"{path}: got {frames.size} bytes, expected {expect}")
    return frames.reshape(NFRAMES, H, W, 3).astype(np.int16)


def render_dissolve(a_path, b_path, a_start, b_start):
    cmd = [
        "ffmpeg", "-v", "error",
        "-ss", str(a_start), "-i", a_path,
        "-ss", str(b_start), "-i", b_path,
        "-filter_complex",
        f"[0:v]scale={W}:{H},fps={FPS},format=rgb24,trim=0:{DUR},setpts=PTS-STARTPTS[va];"
        f"[1:v]scale={W}:{H},fps={FPS},format=rgb24,trim=0:{DUR},setpts=PTS-STARTPTS[vb];"
        f"[va][vb]xfade=transition=dissolve:duration={DUR}:offset=0,format=rgb24[v]",
        "-map", "[v]", "-f", "rawvideo", "-",
    ]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    frames = np.frombuffer(out, dtype=np.uint8)
    expect = NFRAMES * H * W * 3
    if frames.size != expect:
        raise SystemExit(f"xfade: got {frames.size} bytes, expected {expect}")
    return frames.reshape(NFRAMES, H, W, 3).astype(np.int16)


def frand_field():
    xs = np.arange(W, dtype=np.float32)
    ys = np.arange(H, dtype=np.float32)
    xx, yy = np.meshgrid(xs, ys)
    arg = (xx * np.float32(12.9898) + yy * np.float32(78.233)).astype(np.float32)
    s = np.sin(arg).astype(np.float32)
    r = (s * np.float32(43758.545)).astype(np.float32)
    return (r - np.floor(r)).astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("a")
    ap.add_argument("b")
    ap.add_argument("out")
    ap.add_argument("--a-start", type=float, default=10.0)
    ap.add_argument("--b-start", type=float, default=10.0)
    args = ap.parse_args()

    a = extract_window(args.a, args.a_start)
    b = extract_window(args.b, args.b_start)
    r = render_dissolve(args.a, args.b, args.a_start, args.b_start)
    fr = frand_field()

    total_abs = 0.0
    total_pix = 0
    le8_pix = 0
    per_frame = []
    for i in range(NFRAMES):
        # p_hat: pixel render gần B hơn A (theo tổng |diff| trên 3 kênh).
        d_a = np.abs(r[i] - a[i]).sum(axis=2)
        d_b = np.abs(r[i] - b[i]).sum(axis=2)
        p_hat = float((d_b < d_a).mean())
        model = np.where((fr < p_hat)[..., None], b[i], a[i])
        diff = np.abs(model - r[i])
        mad = float(diff.mean())
        le8 = float((diff.max(axis=2) <= 8).mean() * 100.0)
        total_abs += float(diff.sum())
        total_pix += H * W * 3
        le8_pix += int((diff.max(axis=2) <= 8).sum())
        per_frame.append({"frame": i, "p_hat": round(p_hat, 4),
                          "p_nominal": round((i + 1) / NFRAMES, 4),
                          "mad": round(mad, 4), "le8_pct": round(le8, 2)})
    mad = total_abs / total_pix
    le8 = le8_pix / (NFRAMES * H * W) * 100.0
    verdict = "KHOP" if (mad <= 2 and le8 >= 99.0) else ("XAP_XI" if mad <= 5 else "LECH")
    res = {"a": args.a, "b": args.b, "a_start": args.a_start,
           "b_start": args.b_start, "size": f"{W}x{H}", "fps": FPS,
           "frames": NFRAMES, "transition": "dissolve",
           "method": "frand float32 (vf_xfade.c) + p_hat measured from render frame",
           "mad": round(mad, 4), "le8_pct": round(le8, 2),
           "verdict": verdict, "per_frame": per_frame}
    with open(args.out, "w") as f:
        json.dump(res, f, indent=2)
    print(f"MAD={mad:.4f} le8={le8:.2f}% verdict={verdict} -> {args.out}")


if __name__ == "__main__":
    main()
