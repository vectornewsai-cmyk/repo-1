#!/usr/bin/env python3
"""test_track.py — Kiểm chứng track.py bằng video tổng hợp (ground truth biết trước).

Tạo video 320x180, 30fps, 4s: hình vuông đỏ 40x40 di chuyển thẳng từ
(60, 70) tới (220, 70) trên nền nhiễu xám (đủ texture để CSRT bám được).
Chạy track.py với bbox ban đầu ôm hình vuông, rồi so quỹ đạo với ground
truth: sai số trung bình < 0.05 khung hình, và >= 80% số điểm kỳ vọng
phải có mặt (không lost sớm).

Chạy: server/tracking/.venv/bin/python server/tracking/test_track.py
"""

import json
import math
import os
import subprocess
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VENV_PY = os.path.join(HERE, ".venv", "bin", "python")
TRACK_PY = os.path.join(HERE, "track.py")
TMP = "/tmp/vcut-q5-track"
W, H, FPS, DUR = 320, 180, 30, 4.0


def gen_video(path):
    rng = np.random.default_rng(7)
    # Nền nhiễu tĩnh (giữ nguyên mọi frame để tracker không bị lạc nền).
    bg = rng.integers(60, 140, size=(H, W), dtype=np.uint8)
    bg = cv2.cvtColor(bg, cv2.COLOR_GRAY2BGR)
    vw = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*"mp4v"), FPS, (W, H))
    assert vw.isOpened(), "không mở được VideoWriter"
    for i in range(int(FPS * DUR)):
        f = bg.copy()
        t = i / FPS
        cx = 80 + (240 - 80) * (t / DUR)  # tâm x: 80 -> 240
        cy = 90
        cv2.rectangle(f, (int(cx - 20), int(cy - 20)), (int(cx + 20), int(cy + 20)),
                      (0, 0, 255), -1)
        # Thêm vài chi tiết trong hình vuông để CSRT có texture bám.
        cv2.circle(f, (int(cx), int(cy)), 8, (255, 255, 255), -1)
        vw.write(f)
    vw.release()


def gt(t):
    return (80 + 160 * (t / DUR)) / W, 90 / H


def main():
    os.makedirs(TMP, exist_ok=True)
    video = os.path.join(TMP, "move.mp4")
    out = os.path.join(TMP, "traj.json")
    gen_video(video)
    py = VENV_PY if os.path.exists(VENV_PY) else sys.executable
    # bbox ban đầu: ôm hình vuông ở t=0 (tâm 80,90; 40x40 -> tương đối).
    r = subprocess.run([py, TRACK_PY, "--input", video,
                        "--bbox", "0.1875,0.3889,0.125,0.2222",
                        "--sample-fps", "10", "--out", out],
                       capture_output=True, text=True)
    print(r.stdout.strip())
    if r.returncode != 0:
        print("STDERR:", r.stderr[-2000:])
        return 1
    traj = json.load(open(out))
    pts = traj["points"]
    print(f"tracker={traj['source']} lost={traj['lost']} points={len(pts)}")
    assert traj["source"] in ("opencv-csrt", "opencv-kcf", "opencv-mil", "opencv-template"), \
        f"tracker lạ: {traj['source']}"
    # Kỳ vọng ~41 điểm (t=0..4.0 ở 10Hz); chấp nhận mất tối đa 20%.
    assert len(pts) >= 32, f"quá ít điểm: {len(pts)} (kỳ vọng >= 32)"
    errs = []
    for p in pts:
        gx, gy = gt(p["t"])
        errs.append(math.hypot(p["x"] - gx, p["y"] - gy))
    mean_err = sum(errs) / len(errs)
    max_err = max(errs)
    print(f"sai số trung bình={mean_err:.4f} khung hình, max={max_err:.4f}")
    assert mean_err < 0.05, f"sai số trung bình quá lớn: {mean_err}"
    assert max_err < 0.12, f"sai số max quá lớn: {max_err}"
    assert traj["lost"] is False, "tracker báo lost trên video đơn giản"
    # So sánh MIL (chỉ báo cáo, không fail — MIL kém bền hơn template trên
    # video tổng hợp này, đó là lý do auto ưu tiên template trước).
    out_mil = os.path.join(TMP, "traj_mil.json")
    rm = subprocess.run([py, TRACK_PY, "--input", video,
                         "--bbox", "0.1875,0.3889,0.125,0.2222",
                         "--sample-fps", "10", "--tracker", "mil", "--out", out_mil],
                        capture_output=True, text=True)
    if rm.returncode == 0:
        tm = json.load(open(out_mil))
        merrs = [math.hypot(p["x"] - gt(p["t"])[0], p["y"] - gt(p["t"])[1])
                 for p in tm["points"]]
        print(f"MIL so sánh: {len(tm['points'])} điểm, "
              f"sai số TB={sum(merrs) / len(merrs):.4f}, lost={tm['lost']}")
    else:
        print("MIL chạy lỗi (bỏ qua so sánh):", rm.stderr[-300:])
    print("test_track: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
