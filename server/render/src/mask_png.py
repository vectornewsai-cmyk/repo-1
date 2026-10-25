#!/usr/bin/env python3
"""mask_png.py — Vẽ alpha mask ra PNG grayscale (Phase 9 R2).

Thay cho chuỗi geq tính alpha từng pixel mỗi frame trong render (mask.js),
vẽ mask MỘT LẦN ra PNG W×H rồi dùng movie+blend+alphamerge trong FFmpeg.
Toán học mirror CHÍNH XÁC công thức geq trong server/render/src/mask.js
(cùng tọa độ pixel nguyên X=0..W-1, Y=0..H-1, cùng band feather):

- rect: d = khoảng cách Chebyshev có dấu tới biên (âm = trong hình).
  band = feather × min(wPx, hPx); band≈0 → alpha = 1 nếu d<0 else 0;
  ngược lại alpha = clamp(0.5 - d/band, 0, 1).
- ellipse: r = sqrt(((X-cx)/rx)^2 + ((Y-cy)/ry)^2);
  grad = sqrt(((X-cx)/rx^2)^2 + ((Y-cy)/ry^2)^2); d = (r-1)/grad;
  band≈0 → alpha = 1 nếu r<1 else 0; ngược lại clamp như rect.
- invert: alpha = 1 - alpha.

Sai số duy nhất so với geq: lượng tử hoá 8-bit (round(alpha*255)),
tối đa ~0.5/255 mỗi pixel. Dùng numpy khi có, fallback pure-python
(chậm hơn nhưng vẫn đúng) khi thiếu numpy.

Cách dùng:
  python3 mask_png.py --shape rect --x 0.5 --y 0.5 --w 0.5 --h 0.5 \\
      --feather 0.2 --width 1280 --height 720 --out /tmp/mask.png
"""
import argparse
import math
import sys

EPS = 1e-6


def alpha_rect(W, H, x, y, w, h, feather, invert):
    """Trả về hàm alpha(X, Y) cho rect (dùng chung cho cả 2 backend)."""
    x0 = (x - w / 2) * W
    x1 = (x + w / 2) * W
    y0 = (y - h / 2) * H
    y1 = (y + h / 2) * H
    band = feather * min(w * W, h * H)

    def f(X, Y):
        d = max(max(x0 - X, X - x1), max(y0 - Y, Y - y1))
        if band <= EPS:
            a = 1.0 if d < 0 else 0.0
        else:
            a = 0.5 - d / band
            a = 0.0 if a < 0 else (1.0 if a > 1 else a)
        return 1.0 - a if invert else a

    return f


def alpha_ellipse(W, H, x, y, w, h, feather, invert):
    cx = x * W
    cy = y * H
    rx = w * W / 2
    ry = h * H / 2
    band = feather * min(w * W, h * H)

    def f(X, Y):
        dx = (X - cx) / rx
        dy = (Y - cy) / ry
        r = math.sqrt(dx * dx + dy * dy)
        if band <= EPS:
            a = 1.0 if r < 1 else 0.0
        else:
            gx = (X - cx) / (rx * rx)
            gy = (Y - cy) / (ry * ry)
            grad = math.sqrt(gx * gx + gy * gy)
            d = (r - 1) / grad if grad > 0 else 0.0
            a = 0.5 - d / band
            a = 0.0 if a < 0 else (1.0 if a > 1 else a)
        return 1.0 - a if invert else a

    return f


def render(W, H, shape, x, y, w, h, feather, invert):
    """Trả về bytes grayscale W*H (0..255), hàng-major, Y từ trên xuống."""
    try:
        import numpy as np

        xs = np.arange(W, dtype=np.float64)
        ys = np.arange(H, dtype=np.float64)[:, None]
        if shape == "rect":
            x0 = (x - w / 2) * W
            x1 = (x + w / 2) * W
            y0 = (y - h / 2) * H
            y1 = (y + h / 2) * H
            band = feather * min(w * W, h * H)
            d = np.maximum(
                np.maximum(x0 - xs, xs - x1),
                np.maximum(y0 - ys, ys - y1),
            )
            if band <= EPS:
                a = (d < 0).astype(np.float64)
            else:
                a = np.clip(0.5 - d / band, 0.0, 1.0)
        else:
            cx = x * W
            cy = y * H
            rx = w * W / 2
            ry = h * H / 2
            band = feather * min(w * W, h * H)
            dx = (xs - cx) / rx
            dy = (ys - cy) / ry
            r = np.sqrt(dx * dx + dy * dy)
            if band <= EPS:
                a = (r < 1).astype(np.float64)
            else:
                gx = (xs - cx) / (rx * rx)
                gy = (ys - cy) / (ry * ry)
                grad = np.sqrt(gx * gx + gy * gy)
                d = np.where(grad > 0, (r - 1) / np.where(grad > 0, grad, 1.0), 0.0)
                a = np.clip(0.5 - d / band, 0.0, 1.0)
        if invert:
            a = 1.0 - a
        return np.round(a * 255).astype("uint8").tobytes()
    except ImportError:
        fn = alpha_rect(W, H, x, y, w, h, feather, invert) if shape == "rect" \
            else alpha_ellipse(W, H, x, y, w, h, feather, invert)
        buf = bytearray(W * H)
        for Y in range(H):
            row = Y * W
            for X in range(W):
                buf[row + X] = max(0, min(255, round(fn(X, Y) * 255)))
        return bytes(buf)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Vẽ PNG alpha mask (grayscale).")
    ap.add_argument("--shape", choices=["rect", "ellipse"], required=True)
    ap.add_argument("--x", type=float, required=True)
    ap.add_argument("--y", type=float, required=True)
    ap.add_argument("--w", type=float, required=True)
    ap.add_argument("--h", type=float, required=True)
    ap.add_argument("--feather", type=float, required=True)
    ap.add_argument("--invert", action="store_true")
    ap.add_argument("--width", type=int, required=True)
    ap.add_argument("--height", type=int, required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    if not (args.w > 0 and args.h > 0):
        print("w và h phải > 0", file=sys.stderr)
        return 2
    if not (0 <= args.feather <= 1):
        print("feather phải trong 0..1", file=sys.stderr)
        return 2
    if args.width <= 0 or args.height <= 0:
        print("width/height phải > 0", file=sys.stderr)
        return 2

    from PIL import Image

    data = render(args.width, args.height, args.shape, args.x, args.y,
                  args.w, args.h, args.feather, args.invert)
    img = Image.frombytes("L", (args.width, args.height), data)
    img.save(args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
