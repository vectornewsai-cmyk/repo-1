#!/usr/bin/env python3
"""Test Phase 9 đợt 2 — temporal smoothing + feather cho bgremove.py.

Chạy:  python3 test_bgremove_smooth.py
Không cần rembg, model, cv2 hay video thật: chỉ test hàm thuần numpy
smooth_alpha / feather_alpha và parse args của bgremove.py.

Các assert phải có số đo thật in ra stdout (không assert mù):
  1. EMA giảm nhiễu liên frame (mean inter-frame diff giảm rõ rệt).
  2. Cắt cảnh reset EMA (không kéo bóng ma cảnh cũ).
  3. Feather làm mềm cạnh cứng (xuất hiện giá trị trung gian) nhưng
     vùng phẳng xa viền không đổi.
  4. radius=0 / temporal=0 là identity; parse args mặc định đúng.
"""
import importlib.util
import sys

import numpy as np

SPEC = importlib.util.spec_from_file_location(
    "bgremove",
    __file__.rsplit("/", 1)[0] + "/bgremove.py")
MOD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)


def mean_diff(frames):
    return float(np.mean([np.mean(np.abs(frames[i] - frames[i - 1]))
                          for i in range(1, len(frames))]))


def test_ema_reduces_jitter():
    rng = np.random.default_rng(42)
    base = np.zeros((32, 32), np.float32)
    base[10:22, 10:22] = 1.0
    raw = [np.clip(base + rng.normal(0, 0.20, base.shape), 0, 1).astype(np.float32)
           for _ in range(20)]
    prev, smooth = None, []
    for f in raw:
        prev = MOD.smooth_alpha(prev, f, 0.4, 0.30)
        smooth.append(prev)
    d_raw, d_smooth = mean_diff(raw), mean_diff(smooth)
    print(f"[test] jitter: raw mean inter-frame diff={d_raw:.4f}, "
          f"smoothed={d_smooth:.4f} (giảm {100*(1-d_smooth/d_raw):.0f}%)")
    assert d_smooth < d_raw * 0.75, "EMA không giảm nhiễu đủ mạnh"


def test_scene_cut_resets():
    prev = np.zeros((8, 8), np.float32)
    cur = np.ones((8, 8), np.float32)  # cắt cảnh: diff = 1.0 > 0.30
    out = MOD.smooth_alpha(prev, cur, 0.4, 0.30)
    print(f"[test] scene-cut: out mean={out.mean():.3f} (phải = 1.0, không bóng ma)")
    assert float(out.mean()) == 1.0
    # Thay đổi nhỏ dưới ngưỡng thì vẫn mượt (không reset oan).
    cur2 = np.full((8, 8), 0.05, np.float32)
    out2 = MOD.smooth_alpha(prev, cur2, 0.4, 0.30)
    print(f"[test] small-change: out mean={out2.mean():.3f} (phải = 0.03 = EMA)")
    assert abs(float(out2.mean()) - 0.03) < 1e-6


def test_feather():
    a = np.zeros((16, 16), np.float32)
    a[:, 8:] = 1.0  # cạnh cứng dọc
    f = MOD.feather_alpha(a, 1)
    mid = f[:, 7:9]
    print(f"[test] feather: giá trị quanh cạnh={sorted(set(np.round(mid.ravel(), 3)))} "
          f"(phải có giá trị trung gian 0<x<1)")
    assert np.any((mid > 0) & (mid < 1)), "Feather không làm mềm cạnh"
    assert float(f[0, 0]) == 0.0 and float(f[0, 15]) == 1.0, \
        "Vùng phẳng xa viền phải không đổi"
    ident = MOD.feather_alpha(a, 0)
    assert np.array_equal(ident, a), "feather radius=0 phải là identity"
    print("[test] feather: radius=0 identity OK, vùng phẳng không đổi OK")


def test_args():
    args = MOD.parse_args(["--input", "in.mp4", "--output", "out.mov"])
    print(f"[test] args mặc định: temporal={args.temporal}, feather={args.feather}, "
          f"scene_cut={args.scene_cut}")
    assert args.temporal == 0.4 and args.feather == 1 and args.scene_cut == 0.30
    args2 = MOD.parse_args(["--input", "in.mp4", "--output", "o.mov",
                            "--temporal", "0", "--feather", "0"])
    assert args2.temporal == 0.0 and args2.feather == 0
    try:
        MOD.parse_args(["--input", "in.mp4", "--output", "o.mov",
                        "--temporal", "1.5"])
        raise AssertionError("temporal=1.5 phải bị từ chối")
    except SystemExit:
        print("[test] args: temporal ngoài [0, 0.9] bị từ chối OK")
    # temporal=0 phải là identity qua smooth_alpha.
    cur = np.full((4, 4), 0.7, np.float32)
    out = MOD.smooth_alpha(np.zeros((4, 4), np.float32), cur, 0.0)
    assert np.array_equal(out, cur)


def main():
    test_ema_reduces_jitter()
    test_scene_cut_resets()
    test_feather()
    test_args()
    print("[test] PASS: bgremove temporal smoothing + feather (4/4)")


if __name__ == "__main__":
    main()
