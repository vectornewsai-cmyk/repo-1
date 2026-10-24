#!/usr/bin/env python3
"""Regenerate VCut Studio PWA icons (Q6, Phase 8).

The PNG icons themselves are not committed (push-files route is text-only),
so run this script to recreate them locally:
    python3 apps/web/public/icons/gen_icons.py
It draws a simple original mark: dark rounded square + play triangle.
No CapCut trade dress, no third-party assets.
"""
from PIL import Image, ImageDraw

OUT = {
    "icon-192.png": 192,
    "icon-512.png": 512,
    "icon-maskable-512.png": 512,
    "apple-touch-icon.png": 180,
}

BG = (18, 18, 28, 255)
ACCENT = (124, 92, 255, 255)
TRIANGLE = (255, 255, 255, 255)


def draw(size: int, maskable: bool) -> Image.Image:
    pad = size // 8 if maskable else 0
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=size // 6,
        fill=BG,
    )
    # Play triangle, centred.
    cx, cy = size / 2, size / 2
    s = size * 0.28
    d.polygon(
        [(cx - s * 0.6, cy - s), (cx - s * 0.6, cy + s), (cx + s * 0.8, cy)],
        fill=TRIANGLE,
    )
    # Accent bar under the triangle.
    d.rounded_rectangle(
        [cx - s * 0.6, cy + s * 1.25, cx + s * 0.8, cy + s * 1.45],
        radius=size // 64,
        fill=ACCENT,
    )
    return img


def main() -> None:
    import os

    here = os.path.dirname(os.path.abspath(__file__))
    for name, size in OUT.items():
        img = draw(size, maskable=("maskable" in name))
        img.save(os.path.join(here, name))
        print(f"wrote {name} ({size}x{size})")


if __name__ == "__main__":
    main()
