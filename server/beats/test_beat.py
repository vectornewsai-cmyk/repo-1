#!/usr/bin/env python3
"""test_beat.py — Kiểm chứng beat.py bằng click track tổng hợp (BPM biết trước).

Tạo click track 120 BPM, 8s: mỗi beat là 1 xung sine 1000 Hz dài 50ms,
cộng thêm nền nhạc nhẹ (2 sine 220/330 Hz ở -20dB) để không quá "sạch".
Kỳ vọng: BPM phát hiện trong ±2, và mỗi beat thật có 1 beat phát hiện
trong ±60ms (sai số cho phép của DP + hop 512).

Chạy: python3 server/beats/test_beat.py (chỉ cần numpy + ffmpeg hệ thống).
"""

import json
import math
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
BEAT_PY = os.path.join(HERE, "beat.py")
TMP = "/tmp/vcut-q5-beat"
SR = 22050
BPM = 120.0
DUR = 8.0


def gen_click(path):
    t = np.arange(int(SR * DUR)) / SR
    x = 0.1 * np.sin(2 * np.pi * 220 * t) + 0.1 * np.sin(2 * np.pi * 330 * t)
    period = 60.0 / BPM
    truth = []
    b = 0.0
    while b < DUR:
        truth.append(b)
        s = int(b * SR)
        e = min(len(x), s + int(0.05 * SR))
        x[s:e] += 0.9 * np.sin(2 * np.pi * 1000 * np.arange(e - s) / SR)
        b += period
    pcm = np.clip(x, -1, 1)
    pcm16 = (pcm * 32767).astype(np.int16)
    p = subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR),
                        "-ac", "1", "-i", "-", "-c:a", "libmp3lame", path],
                       input=pcm16.tobytes(), capture_output=True)
    assert p.returncode == 0, f"ffmpeg tạo click track thất bại: {p.stderr[:500]}"
    return truth


def main():
    os.makedirs(TMP, exist_ok=True)
    mp3 = os.path.join(TMP, "click120.mp3")
    out = os.path.join(TMP, "beats.json")
    truth = gen_click(mp3)
    r = subprocess.run([sys.executable, BEAT_PY, "--input", mp3, "--out", out],
                       capture_output=True, text=True)
    print(r.stdout.strip())
    if r.returncode != 0:
        print("STDERR:", r.stderr[-2000:])
        return 1
    res = json.load(open(out))
    print(f"bpm={res['bpm']} (thật {BPM}), beats={len(res['beats'])} (thật {len(truth)})")
    assert abs(res["bpm"] - BPM) <= 2.0, f"BPM lệch quá nhiều: {res['bpm']} vs {BPM}"
    # Mỗi beat thật phải có 1 beat phát hiện trong ±60ms.
    detected = res["beats"]
    missing = 0
    for tb in truth:
        if not any(abs(d - tb) <= 0.06 for d in detected):
            missing += 1
    print(f"beat thật bị miss: {missing}/{len(truth)}")
    assert missing <= 1, f"miss quá nhiều beat: {missing}"
    # Không quá nhiều beat giả (tối đa 150% số beat thật).
    assert len(detected) <= int(len(truth) * 1.5), f"quá nhiều beat giả: {len(detected)}"
    print("test_beat: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
