#!/usr/bin/env python3
"""
Test scene.py: ghép 3 cảnh nội dung khác nhau rõ rệt (mỗi cảnh 2s)
-> phải detect đúng 2 điểm cắt tại ~2.0s và ~4.0s (sai số ±0.5s).

LƯU Ý: không dùng màu phẳng (color=red/green/...) cho test vì metric scene
của FFmpeg cho điểm rất thấp với màu phẳng (đỏ->xanh lá thậm chí < 0.1) —
đây là quirk của filter, đã ghi trong SCENE_LIMITS.md. Dùng test pattern
(smptebars/testsrc/gradients) giống video thật hơn.

Chạy: python3 test_scene.py
Cần ffmpeg/ffprobe trong PATH.
"""

import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCENE_PY = os.path.join(HERE, "scene.py")

PASS = 0
FAIL = 0


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS {name}")
    else:
        FAIL += 1
        print(f"  FAIL {name} {detail}")


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Lệnh thất bại: {' '.join(cmd)}\n{r.stderr[-1500:]}")
    return r


def main():
    global FAIL
    with tempfile.TemporaryDirectory(prefix="scene-test-") as tmp:
        video = os.path.join(tmp, "three_scenes.mp4")
        out = os.path.join(tmp, "scenes.json")

        print("== [1] dựng video 3 cảnh (smptebars 2s / testsrc 2s / gradients 2s) ==")
        run([
            "ffmpeg", "-hide_banner", "-y",
            "-f", "lavfi", "-i", "smptebars=s=320x240:d=2:r=30",
            "-f", "lavfi", "-i", "testsrc=s=320x240:d=2:r=30",
            "-f", "lavfi", "-i", "gradients=s=320x240:d=2:r=30:speed=0.5",
            "-filter_complex", "[0:v][1:v][2:v]concat=n=3:v=1:a=0",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", video,
        ])
        check("video test tạo xong", os.path.getsize(video) > 0)

        print("== [2] chạy scene.py ==")
        r = subprocess.run(
            [sys.executable, SCENE_PY, "--input", video,
             "--threshold", "0.4", "--out", out],
            capture_output=True, text=True)
        check("exit code 0", r.returncode == 0, r.stderr[-500:])
        check("file JSON tạo ra", os.path.isfile(out))
        with open(out, encoding="utf-8") as f:
            data = json.load(f)

        print("== [3] kiểm tra kết quả ==")
        cuts = data.get("cuts", [])
        check("đúng 2 điểm cắt", len(cuts) == 2, f"nhận {cuts}")
        if len(cuts) == 2:
            check("cắt 1 tại ~2.0s (±0.5s)",
                  abs(cuts[0] - 2.0) <= 0.5, f"nhận {cuts[0]}")
            check("cắt 2 tại ~4.0s (±0.5s)",
                  abs(cuts[1] - 4.0) <= 0.5, f"nhận {cuts[1]}")
        check("duration ~6s", abs((data.get("duration") or 0) - 6.0) <= 0.5,
              f"nhận {data.get('duration')}")
        check("threshold echo đúng", data.get("threshold") == 0.4)
        check("có cut_candidates", isinstance(data.get("cut_candidates"), int))

        print("== [4] lọc theo --start/--end ==")
        out2 = os.path.join(tmp, "scenes2.json")
        r2 = subprocess.run(
            [sys.executable, SCENE_PY, "--input", video,
             "--start", "3.0", "--end", "6.0", "--out", out2],
            capture_output=True, text=True)
        check("exit code 0", r2.returncode == 0, r2.stderr[-500:])
        with open(out2, encoding="utf-8") as f:
            data2 = json.load(f)
        check("chỉ còn 1 cắt trong [3,6]",
              len(data2["cuts"]) == 1 and abs(data2["cuts"][0] - 4.0) <= 0.5,
              f"nhận {data2['cuts']}")

        print("== [5] video 1 cảnh -> 0 điểm cắt ==")
        one = os.path.join(tmp, "one.mp4")
        out3 = os.path.join(tmp, "scenes3.json")
        run(["ffmpeg", "-hide_banner", "-y",
             "-f", "lavfi", "-i", "color=c=gray:s=320x240:d=3:r=30",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", one])
        r3 = subprocess.run(
            [sys.executable, SCENE_PY, "--input", one, "--out", out3],
            capture_output=True, text=True)
        check("exit code 0", r3.returncode == 0, r3.stderr[-500:])
        with open(out3, encoding="utf-8") as f:
            data3 = json.load(f)
        check("0 điểm cắt", data3["cuts"] == [], f"nhận {data3['cuts']}")

        print("== [6] lỗi đầu vào ==")
        r4 = subprocess.run(
            [sys.executable, SCENE_PY, "--input", os.path.join(tmp, "nope.mp4"),
             "--out", os.path.join(tmp, "x.json")],
            capture_output=True, text=True)
        check("file không tồn tại -> exit 2", r4.returncode == 2)
        r5 = subprocess.run(
            [sys.executable, SCENE_PY, "--input", video, "--threshold", "5",
             "--out", os.path.join(tmp, "x.json")],
            capture_output=True, text=True)
        check("threshold ngoài khoảng -> exit 2", r5.returncode == 2)

    print(f"\n{'='*44}\nSCENE TEST: {PASS} pass, {FAIL} fail\n{'='*44}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
