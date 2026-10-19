#!/usr/bin/env python3
"""
Test cho server/bgremove/bgremove.py (R1-084).

Yêu cầu: đã cài requirements.txt, đã tải model (xem download_model.sh).
Chạy:  python test_bgremove.py [--session u2net] [--keep]

Test:
  1. Tạo video mẫu 3s (90 frames) từ ảnh chân dung (ffmpeg zoompan).
  2. Chạy bgremove.py mode=mask.
  3. Assert: mask có cả vùng đen (nền) và vùng trắng (chủ thể) —
     KHÔNG được toàn đen hoặc toàn trắng.
  4. Assert: temporal coherence (trung bình diff giữa các frame liên tiếp nhỏ).
  5. Chạy bgremove.py mode=alpha → assert output có kênh alpha thật.
"""
import argparse
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np


def sh(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        raise RuntimeError(f"Lệnh thất bại: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r


def make_test_video(out_path, person_jpg):
    """Video 3s 90 frames từ ảnh tĩnh (loop đơn giản, không zoom)."""
    sh([
        "ffmpeg", "-y", "-v", "error",
        "-loop", "1", "-i", person_jpg,
        "-vf", "scale=640:640",
        "-vframes", "90", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-r", "30", out_path,
    ])


def test_mask(bgremove_py, test_mp4, out_mask, session, model_dir):
    sh([
        sys.executable, bgremove_py,
        "--input", test_mp4, "--output", out_mask,
        "--mode", "mask", "--session", session,
        "--model-dir", model_dir, "--max-side", "480",
    ])
    cap = cv2.VideoCapture(out_mask)
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY))
    cap.release()
    assert len(frames) >= 30, f"Quá ít frame: {len(frames)}"
    a = np.stack(frames)
    fg = (a > 200).mean() * 100
    bg = (a < 55).mean() * 100
    print(f"[test] mask: {len(frames)} frames, "
          f"foreground(>200)={fg:.1f}%, background(<55)={bg:.1f}%")
    assert fg > 10, f"Mask thiếu vùng TRẮNG (chủ thể): chỉ {fg:.1f}%"
    assert bg > 10, f"Mask thiếu vùng ĐEN (nền): chỉ {bg:.1f}%"
    diffs = [np.abs(frames[i].astype(int) - frames[i - 1].astype(int)).mean()
             for i in range(1, len(frames))]
    mean_diff = float(np.mean(diffs))
    print(f"[test] temporal coherence: mean inter-frame diff = {mean_diff:.2f}")
    # Video test tĩnh nên mask gần như không đổi giữa các frame;
    # ngưỡng này chỉ bắt FLICKER (nhiễu ngẫu nhiên).
    assert mean_diff < 5.0, f"Mask giật giữa các frame: {mean_diff:.2f}"
    print("[test] PASS: mask có cả đen và trắng, temporal coherence tốt")


def test_alpha(bgremove_py, test_mp4, out_alpha, session, model_dir):
    sh([
        sys.executable, bgremove_py,
        "--input", test_mp4, "--output", out_alpha,
        "--mode", "alpha", "--session", session,
        "--model-dir", model_dir, "--max-side", "480",
    ])
    r = sh([
        "ffprobe", "-v", "error", "-show_entries", "stream=pix_fmt",
        "-of", "csv=p=0", out_alpha,
    ])
    pix_fmt = r.stdout.strip().split("\n")[0]
    print(f"[test] alpha output pix_fmt: {pix_fmt}")
    assert "a" in pix_fmt and pix_fmt not in ("yuv420p",), \
        f"Output không có alpha: {pix_fmt}"
    # Đọc 1 frame RGBA qua pipe, kiểm tra kênh alpha có cả trong suốt và đục
    p = subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", out_alpha,
         "-vframes", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
        capture_output=True,
    )
    assert p.returncode == 0 and p.stdout, "Không đọc được frame RGBA"
    # Lấy kích thước từ ffprobe
    r = sh(["ffprobe", "-v", "error", "-show_entries", "stream=width,height",
            "-of", "csv=p=0", out_alpha])
    w, h = (int(x) for x in r.stdout.strip().split(",")[:2])
    rgba = np.frombuffer(p.stdout, dtype=np.uint8).reshape(h, w, 4)
    alpha = rgba[..., 3]
    transparent = (alpha < 55).mean() * 100
    opaque = (alpha > 200).mean() * 100
    print(f"[test] alpha channel: transparent={transparent:.1f}%, "
          f"opaque={opaque:.1f}%")
    assert transparent > 5, "Kênh alpha thiếu vùng trong suốt"
    assert opaque > 5, "Kênh alpha thiếu vùng đục"
    print("[test] PASS: output có kênh alpha thật (cả trong suốt và đục)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--session", default="u2net",
                    help="rembg session để test (mặc định u2net — nhanh, chạy được trên CPU/RAM nhỏ)")
    ap.add_argument("--person", default=None,
                    help="Ảnh chân dung làm video mẫu (mặc định: tải ảnh CC từ Wikimedia)")
    ap.add_argument("--model-dir", default=os.path.expanduser("~/.u2net"))
    ap.add_argument("--keep", action="store_true", help="Giữ file test")
    args = ap.parse_args()

    here = os.path.dirname(os.path.abspath(__file__))
    bgremove_py = os.path.join(here, "bgremove.py")
    assert os.path.exists(bgremove_py), "Không thấy bgremove.py"

    tmp = tempfile.mkdtemp(prefix="bgremove-test-")
    person_jpg = args.person or os.path.join(tmp, "person.jpg")
    if not args.person:
        print("[test] tải ảnh mẫu (CC BY-SA 4.0, Wikimedia Commons)...")
        sh(["curl", "-sL",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/"
            "Smiling_woman_holding_a_cup_and_a_bottle_of_beer.jpg/"
            "640px-Smiling_woman_holding_a_cup_and_a_bottle_of_beer.jpg",
            "-o", person_jpg])
    test_mp4 = os.path.join(tmp, "test3s.mp4")
    print("[test] tạo video mẫu 3s...")
    make_test_video(test_mp4, person_jpg)

    out_mask = os.path.join(tmp, "mask.mp4")
    out_alpha = os.path.join(tmp, "alpha.mov")
    test_mask(bgremove_py, test_mp4, out_mask, args.session, args.model_dir)
    test_alpha(bgremove_py, test_mp4, out_alpha, args.session, args.model_dir)

    if not args.keep:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)
    print("\n✅ TẤT CẢ TEST PASS")


if __name__ == "__main__":
    main()
