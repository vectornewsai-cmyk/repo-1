#!/usr/bin/env python3
"""
Test color pass (màu phẳng) của scene.py (Phase 7 P6).

Chạy: python3 test_scene_color.py
Cần ffmpeg/ffprobe trong PATH. Không cần cv2.

  1. Video màu phẳng đỏ 2s / xanh lá 2s / xanh dương 2s: FFmpeg scene
     (--no-color-pass) BỎ SÓT cắt đỏ→xanh lá ở ~2.0s (quirk đã biết:
     metric đỏ→xanh lá < 0.1; cắt xanh lá→xanh dương ở ~4.0s thì FFmpeg
     vẫn bắt được). Mặc định (có color pass) phải tìm đủ 2 cắt ~2.0s và
     ~4.0s (±0.5s), trong đó ~2.0s đến từ color pass.
  2. Video 1 cảnh chuyển động liên tục (testsrc 6s, gradients 6s): color pass
     không được thêm cắt giả (tổng vẫn 0 cắt).
  3. Video màu phẳng 1 màu 3s: 0 cắt (không tự cắt trong màu đồng nhất).
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


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Lệnh thất bại: {' '.join(cmd)}\n{r.stderr[-1500:]}")
    return r


def detect(video, out, extra=None):
    r = subprocess.run(
        [sys.executable, SCENE_PY, "--input", video, "--out", out] + (extra or []),
        capture_output=True, text=True)
    assert r.returncode == 0, f"scene.py exit {r.returncode}: {r.stderr[-500:]}"
    with open(out, encoding="utf-8") as f:
        return json.load(f)


def main():
    with tempfile.TemporaryDirectory(prefix="scene-color-") as tmp:
        flat = os.path.join(tmp, "flat.mp4")
        run(["ffmpeg", "-hide_banner", "-y",
             "-f", "lavfi", "-i", "color=c=red:s=320x240:d=2:r=30",
             "-f", "lavfi", "-i", "color=c=green:s=320x240:d=2:r=30",
             "-f", "lavfi", "-i", "color=c=blue:s=320x240:d=2:r=30",
             "-filter_complex", "[0:v][1:v][2:v]concat=n=3:v=1:a=0",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", flat])
        out = os.path.join(tmp, "s.json")

        def t_ffmpeg_only_misses_red_green():
            data = detect(flat, out, ["--no-color-pass"])
            assert not any(abs(c - 2.0) <= 0.5 for c in data["cuts"]), \
                f"FFmpeg-only phải bỏ sót cắt ~2.0s, nhận {data['cuts']}"
            assert data["color_pass"] is False

        def t_color_pass_finds_both():
            data = detect(flat, out)
            cuts = data["cuts"]
            assert len(cuts) == 2, f"muốn đúng 2 cắt, nhận {cuts}"
            assert abs(cuts[0] - 2.0) <= 0.5, f"cắt 1 lệch: {cuts[0]}"
            assert abs(cuts[1] - 4.0) <= 0.5, f"cắt 2 lệch: {cuts[1]}"
            assert data["color_pass"] is True
            # color_cuts chỉ báo phần THÊM MỚI (cắt 4.0 FFmpeg đã có nên
            # không tính) — phần thêm phải chứa ~2.0s.
            assert any(abs(c - 2.0) <= 0.5 for c in data["color_cuts"]), \
                f"color_cuts phải chứa ~2.0s: {data['color_cuts']}"

        def t_single_flat_no_cut():
            one = os.path.join(tmp, "one.mp4")
            run(["ffmpeg", "-hide_banner", "-y",
                 "-f", "lavfi", "-i", "color=c=gray:s=320x240:d=3:r=30",
                 "-c:v", "libx264", "-pix_fmt", "yuv420p", one])
            data = detect(one, out)
            assert data["cuts"] == [], f"1 màu phải 0 cắt, nhận {data['cuts']}"

        def t_motion_no_false_positive():
            for src_name, src in [
                ("testsrc", "testsrc=s=320x240:d=6:r=30"),
                ("gradients", "gradients=s=320x240:d=6:r=30"),
            ]:
                v = os.path.join(tmp, f"{src_name}.mp4")
                run(["ffmpeg", "-hide_banner", "-y",
                     "-f", "lavfi", "-i", src,
                     "-c:v", "libx264", "-pix_fmt", "yuv420p", v])
                data = detect(v, out)
                assert data["cuts"] == [], \
                    f"{src_name} 1 cảnh phải 0 cắt, nhận {data['cuts']}"

        test("FFmpeg-only: bỏ sót cắt đỏ→xanh lá ~2.0s (quirk đã biết)", t_ffmpeg_only_misses_red_green)
        test("color pass: tìm đúng 2 cắt ~2.0s/~4.0s trên video màu phẳng", t_color_pass_finds_both)
        test("1 màu đồng nhất: 0 cắt", t_single_flat_no_cut)
        test("chuyển động liên tục (testsrc/gradients): 0 cắt giả", t_motion_no_false_positive)

    print(f"\n== KẾT QUẢ: {PASS} pass, {FAIL} fail ==")
    if FAIL:
        print(f"Thua ở: {', '.join(FAILED)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
