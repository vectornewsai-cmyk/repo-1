#!/usr/bin/env python3
"""test_mask_anim.py — Test nội suy + hình học frame của mask_anim.py (Phase 9 D4).

Fixture nội suy GIỐNG HỆT mask.js self-test §9 (cùng keyframe, cùng kỳ
vọng) để 3 mirror (TS/JS/Python) không lệch nhau:
  kfs thô: t=2 x=0.8, t=0 x=0.2, t=2 x=0.9 → sau sort+dedupe: t=0 x=0.2, t=2 x=0.9
  hold trước (t=-1) → 0.2; giữa (t=1) → 0.55; hold sau (t=5) → 0.9.

Chạy: python3 test_mask_anim.py (exit 0 = pass hết).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mask_anim  # noqa: E402
import mask_png  # noqa: E402

FAILURES = []


def check(name, cond, detail=""):
    if cond:
        print(f"  ✓ {name}")
    else:
        print(f"  ✗ {name} {detail}")
        FAILURES.append(name)


def main():
    print("== nội suy (fixture giống mask.js §9) ==")
    raw = [
        {"t": 2, "x": 0.8, "y": 0.5, "w": 0.5, "h": 0.5},
        {"t": 0, "x": 0.2, "y": 0.5, "w": 0.5, "h": 0.5},
        {"t": 2, "x": 0.9, "y": 0.5, "w": 0.5, "h": 0.5},
    ]
    kfs = mask_anim.sort_keyframes(raw)
    check("sort+dedupe → [0, 2]", [k["t"] for k in kfs] == [0, 2], str(kfs))
    check("trùng t=2 thì sau thắng (x=0.9)", kfs[1]["x"] == 0.9)
    check("hold trước → 0.2", mask_anim.interpolate(kfs, -1)[0] == 0.2)
    check("giữa t=1 → 0.55", abs(mask_anim.interpolate(kfs, 1)[0] - 0.55) < 1e-9)
    check("hold sau → 0.9", mask_anim.interpolate(kfs, 5)[0] == 0.9)
    check("1 keyframe → luôn giá trị đó",
          mask_anim.interpolate([{"t": 3, "x": 0.7, "y": 0.4, "w": 0.3, "h": 0.3}], 0)[0] == 0.7)

    print("== hình học frame: rect di chuyển ngang, W=200 H=100 ==")
    # Mask rect w=0.4 h=1.0, x: 0.2→0.8 trong 2s, y=0.5, feather=0 (viền cứng).
    # Frame t=1 (giữa): x=0.5 → rect phủ X 60..140. Pixel (100,50) trong → 255,
    # pixel (10,50) ngoài → 0. Khung 200x100, kiểm tra đúng pixel nguyên
    # theo công thức mask_png (d<0 → trong, biên d=0 → ngoài khi cứng).
    kfs2 = mask_anim.sort_keyframes([
        {"t": 0, "x": 0.2, "y": 0.5, "w": 0.4, "h": 1.0},
        {"t": 2, "x": 0.8, "y": 0.5, "w": 0.4, "h": 1.0},
    ])
    x, y, w, h = mask_anim.interpolate(kfs2, 1.0)
    check("t=1 → x=0.5", abs(x - 0.5) < 1e-9, str(x))
    data = mask_png.render(200, 100, "rect", x, y, w, h, 0.0, False)
    check("pixel trong (100,50) = 255", data[50 * 200 + 100] == 255)
    check("pixel ngoài trái (10,50) = 0", data[50 * 200 + 10] == 0)
    check("pixel ngoài phải (190,50) = 0", data[50 * 200 + 190] == 0)
    # Frame t=0: x=0.2 → rect phủ X 0..80. Pixel (100,50) ngoài → 0.
    x0, _, _, _ = mask_anim.interpolate(kfs2, 0.0)
    data0 = mask_png.render(200, 100, "rect", x0, 0.5, 0.4, 1.0, 0.0, False)
    check("t=0: pixel (100,50) = 0 (mask còn ở trái)", data0[50 * 200 + 100] == 0)
    check("t=0: pixel (40,50) = 255", data0[50 * 200 + 40] == 255)
    # Ellipse phóng to: t=0 w=0.2 → tâm trong, biên ngoài; t=2 w=0.8 → rộng ra.
    kfs3 = mask_anim.sort_keyframes([
        {"t": 0, "x": 0.5, "y": 0.5, "w": 0.2, "h": 0.2},
        {"t": 2, "x": 0.5, "y": 0.5, "w": 0.8, "h": 0.8},
    ])
    _, _, w0, _ = mask_anim.interpolate(kfs3, 0.0)
    _, _, w2, _ = mask_anim.interpolate(kfs3, 2.0)
    check("ellipse phóng to: w 0.2 → 0.8", abs(w0 - 0.2) < 1e-9 and abs(w2 - 0.8) < 1e-9)
    d_small = mask_png.render(200, 100, "ellipse", 0.5, 0.5, w0, 0.2, 0.0, False)
    d_big = mask_png.render(200, 100, "ellipse", 0.5, 0.5, w2, 0.8, 0.0, False)
    # Điểm (140,50): ngoài ellipse nhỏ (rx=20) nhưng trong ellipse lớn (rx=80).
    check("ellipse nhỏ: (140,50) = 0", d_small[50 * 200 + 140] == 0)
    check("ellipse lớn: (140,50) = 255", d_big[50 * 200 + 140] == 255)

    print(f"\ntest_mask_anim: {len(FAILURES)} fail")
    return 1 if FAILURES else 0


if __name__ == "__main__":
    sys.exit(main())
