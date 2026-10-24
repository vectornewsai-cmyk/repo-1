#!/usr/bin/env python3
"""
Test trajectory preview của reframe.py (Phase 7 P6).

Chạy bằng venv có cv2 (bridge dùng venv này):
  server/reframe/.venv/bin/python server/reframe/test_trajectory.py

Test thật, không stub:
  1. Tạo video 640x360 3s: vòng tròn trắng di chuyển trái -> phải trên nền đen
     (đi theo motion path, không cần mặt người).
  2. Chạy reframe.py --analyze-only --json-out: assert trajectory có điểm,
     x0 nằm trong [0, W-cw], trung bình nửa sau > nửa đầu (vật đi sang phải),
     crop_window đúng 9:16 từ nguồn 640x360.
  3. Chạy reframe.py render thật: assert MP4 ra đúng 1080x1920 (ffprobe).
  4. Nguồn hẹp (360x640): trajectory x0 hằng 0 (window = toàn frame).

Lưu ý trung thực: test chỉ kiểm chứng trajectory theo trục X (thuật toán
hiện chỉ track X); không kiểm chứng "chủ thể luôn ở giữa khung render" bằng
pixel vì cần detector độc lập — render đúng kích thước + trajectory khớp
window render là bằng chứng đủ cho preview.
"""
import json
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REFRAME = os.path.join(HERE, "reframe.py")
PASS = 0
FAIL = 0
FAILED = []


def test(name, fn):
    global PASS, FAIL
    try:
        fn()
        PASS += 1
        print(f"  ✓ {name}")
    except Exception as e:
        FAIL += 1
        FAILED.append(name)
        print(f"  ✗ {name}: {e}")


def sh(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Lệnh thất bại: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r


def make_moving_video(out_path, w, h, fps=30, seconds=3):
    n = fps * seconds
    writer = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
    assert writer.isOpened(), "không mở được VideoWriter"
    for i in range(n):
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        # Vòng tròn đi từ 15% -> 85% chiều rộng (đủ lớn để motion detect thấy).
        cx = int(w * (0.15 + 0.70 * i / max(1, n - 1)))
        cv2.circle(frame, (cx, h // 2), 45, (255, 255, 255), -1)
        writer.write(frame)
    writer.release()


def ffprobe_size(path):
    r = sh(["ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height", "-of", "csv=p=0", path])
    w, h = r.stdout.strip().split(",")
    return int(w), int(h)


def main():
    with tempfile.TemporaryDirectory() as d:
        src = os.path.join(d, "move.mp4")
        make_moving_video(src, 640, 360)
        traj_json = os.path.join(d, "traj.json")
        out_mp4 = os.path.join(d, "out.mp4")

        def analyze():
            sh([sys.executable, REFRAME, "--input", src, "--analyze-only",
                "--aspect", "9:16", "--json-out", traj_json])
            with open(traj_json, encoding="utf-8") as f:
                return json.load(f)

        def check_common(data):
            assert data["source_size"] == [640, 360], data["source_size"]
            # Nguồn 640x360 -> 9:16: cw = 360*9/16 = 202 (chẵn), ch = 360.
            assert data["crop_window"] == [202, 360], data["crop_window"]
            traj = data["trajectory"]
            assert len(traj) >= 5, f"quá ít điểm: {len(traj)}"
            for p in traj:
                assert 0 <= p["x0"] <= 640 - 202, p
                assert p["y0"] == 0 and p["w"] == 202 and p["h"] == 360, p
            first_half = [p["x0"] for p in traj[: len(traj) // 2]]
            second_half = [p["x0"] for p in traj[len(traj) // 2:]]
            assert (sum(second_half) / len(second_half)) > (sum(first_half) / len(first_half)), \
                f"x0 không tăng theo vật di chuyển phải: {traj[0]['x0']} -> {traj[-1]['x0']}"
            return traj

        def t_analyze():
            data = analyze()
            check_common(data)
            assert data["detections"]["motion"] >= 1, data["detections"]
            assert data["output"] is None, "analyze-only không có output video"

        def t_render():
            sh([sys.executable, REFRAME, "--input", src, "--output", out_mp4,
                "--aspect", "9:16", "--json-out", traj_json])
            assert os.path.getsize(out_mp4) > 0, "output rỗng"
            assert ffprobe_size(out_mp4) == (1080, 1920), ffprobe_size(out_mp4)
            # Trajectory kèm theo render phải khớp analyze-only (cùng window).
            with open(traj_json, encoding="utf-8") as f:
                check_common(json.load(f))

        def t_narrow_source():
            narrow = os.path.join(d, "narrow.mp4")
            make_moving_video(narrow, 360, 640)
            nj = os.path.join(d, "traj_narrow.json")
            sh([sys.executable, REFRAME, "--input", narrow, "--analyze-only",
                "--aspect", "9:16", "--json-out", nj])
            with open(nj, encoding="utf-8") as f:
                data = json.load(f)
            assert data["source_size"] == [360, 640]
            # Nguồn hẹp hơn đích -> window = toàn frame, x0 hằng 0.
            assert all(p["x0"] == 0 for p in data["trajectory"]), data["trajectory"][:3]
            assert all(p["w"] == 360 for p in data["trajectory"])

        test("analyze-only: trajectory theo vật di chuyển phải", t_analyze)
        test("render thật 9:16 1080x1920 + trajectory kèm theo khớp", t_render)
        test("nguồn hẹp: trajectory x0 hằng 0 (window = toàn frame)", t_narrow_source)

    print(f"\n== KẾT QUẢ: {PASS} pass, {FAIL} fail ==")
    if FAIL:
        print(f"Thua ở: {', '.join(FAILED)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
