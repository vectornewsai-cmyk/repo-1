#!/usr/bin/env python3
r"""Đo pixel cho test_text_anim_parity.js (1 PNG -> JSON).

Dải đo phải khớp bố cục trong test JS (fontSize 64, 640x360):
  tilt    [40, 104]   (tâm y 0.20)
  skew    [119, 183]  (tâm y 0.42)
  reveal  [198, 262]  (tâm y 0.64)
  curtain [278, 342]  (tâm y 0.86)

- tilt/skew: hiệu (tâm-x nửa trên − tâm-x nửa dưới) của hàng pixel chữ
  trong dải — xoay/nghiêng làm hiệu này lệch khỏi mức nền của chữ đứng yên.
- reveal/curtain: min-x / max-x / số pixel chữ trong dải — mép cắt của
  \clip quét HỘP CHỮ (đợt 11 P4) chặn pixel ngoài hình chữ nhật cắt.

Ngưỡng xám > 60 (chữ trắng trên nền đen; \fad làm chữ mờ dần nên ngưỡng
thấp để bắt cả chữ đang mờ vào).
"""
import json
import sys

from PIL import Image
import numpy as np

BANDS = {
    "tilt": (40, 104),
    "skew": (119, 183),
    "reveal": (198, 262),
    "curtain": (278, 342),
}


def band_stats(gray, y0, y1):
    band = gray[y0:y1, :]
    mask = band > 60
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return {"count": 0, "diff": 0.0, "minX": -1, "maxX": -1}
    rows = np.where(mask.any(axis=1))[0]
    r0, r1 = rows.min(), rows.max()
    mid = (r0 + r1) // 2
    top = mask[r0:mid, :]
    bot = mask[mid:r1 + 1, :]
    _, tx = np.where(top)
    _, bx = np.where(bot)
    diff = float(tx.mean() - bx.mean()) if len(tx) and len(bx) else 0.0
    return {
        "count": int(len(xs)),
        "diff": round(diff, 1),
        "minX": int(xs.min()),
        "maxX": int(xs.max()),
    }


def main():
    gray = np.array(Image.open(sys.argv[1]).convert("L"))
    out = {name: band_stats(gray, y0, y1) for name, (y0, y1) in BANDS.items()}
    print(json.dumps(out))


if __name__ == "__main__":
    main()
