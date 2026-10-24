#!/usr/bin/env python3
"""
gen_vcut_luts5.py — Q4 (Phase 8): 20 LUT gốc VCut vòng 3.

Nối tiếp gen_vcut_luts.py/2/3/4.py: lưới Adobe .cube 17x17x17, xuất từ hàm
màu thuần túy (không lấy từ nguồn ngoài, không clone LUT thương mại).
Các primitive giống gen_vcut_luts4.py.

Chạy: python3 assets/filters/gen_vcut_luts5.py
Ghi vào: assets/filters/*.cube (20 file mới, tiền tố vcut-)
"""
import os

SIZE = 17
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)))

def clamp(v):
    return max(0.0, min(1.0, v))

def luma(r, g, b):
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def saturate(rgb, s):
    r, g, b = rgb
    y = luma(r, g, b)
    return (clamp(y + (r - y) * s), clamp(y + (g - y) * s), clamp(y + (b - y) * s))

def scurve(v, k):
    """S-curve mềm: v' = v + k * v * (1 - v) * (v - 0.5) * 2."""
    return v + k * v * (1 - v) * (v - 0.5) * 2

def lift(rgb, v):
    return tuple(clamp(c + v) for c in rgb)

def gain(rgb, v):
    return tuple(clamp(c * v) for c in rgb)

def compress(rgb, lo, hi):
    return tuple(clamp(lo + c * (hi - lo)) for c in rgb)

def tint(rgb, dr, dg, db):
    r, g, b = rgb
    return (clamp(r + dr), clamp(g + dg), clamp(b + db))

def split_tone(rgb, sr, sg, sb, hr, hg, hb, mid):
    r, g, b = rgb
    y = luma(r, g, b)
    sh = 1.0 - min(1.0, y / max(mid, 0.01)) if y < mid else 0.0
    hi = max(0.0, (y - mid) / max(1.0 - mid, 0.01)) if y >= mid else 0.0
    return (clamp(r + sr * sh + hr * hi),
            clamp(g + sg * sh + hg * hi),
            clamp(b + sb * sh + hb * hi))

def channel_shift(rgb, dr, dg, db):
    r, g, b = rgb
    y = luma(r, g, b)
    return (clamp(r + dr * y), clamp(g + dg * y), clamp(b + db * y))

def duotone(rgb, dark, light):
    r, g, b = rgb
    y = luma(r, g, b)
    y = scurve(y, 0.2)
    return (clamp(dark[0] + (light[0] - dark[0]) * y),
            clamp(dark[1] + (light[1] - dark[1]) * y),
            clamp(dark[2] + (light[2] - dark[2]) * y))

def mono_tint(rgb, tr, tg, tb, sat=0.0):
    r, g, b = rgb
    y = luma(r, g, b)
    base = saturate((r, g, b), sat)
    return (clamp(base[0] + (tr - 0.5) * y * 0.6),
            clamp(base[1] + (tg - 0.5) * y * 0.6),
            clamp(base[2] + (tb - 0.5) * y * 0.6))


# ---------------------------------------------------------------------------
# Q4 — 20 LUT mới (hàm màu thuần túy, không lấy từ nguồn ngoài)
# ---------------------------------------------------------------------------

def lut_da_lat_mist(rgb):
    rgb = tint(rgb, -0.03, 0.01, 0.06)
    rgb = saturate(rgb, 0.9)
    return lift(rgb, 0.08)

def lut_pho_hanoi(rgb):
    rgb = tint(rgb, 0.10, 0.04, -0.06)
    rgb = saturate(rgb, 1.15)
    return gain(rgb, 1.05)

def lut_sea_breeze(rgb):
    rgb = tint(rgb, -0.04, 0.04, 0.08)
    rgb = saturate(rgb, 1.3)
    return lift(rgb, 0.05)

def lut_sunset_beach(rgb):
    rgb = tint(rgb, 0.12, 0.0, -0.04)
    rgb = saturate(rgb, 1.4)
    return split_tone(rgb, 0.02, 0.0, -0.02, 0.10, 0.02, -0.06, 0.5)

def lut_forest_deep(rgb):
    rgb = tint(rgb, -0.04, 0.10, -0.02)
    rgb = saturate(rgb, 1.25)
    return compress(rgb, 0.02, 0.94)

def lut_desert_sand(rgb):
    rgb = tint(rgb, 0.12, 0.06, -0.08)
    rgb = saturate(rgb, 1.05)
    return lift(rgb, 0.07)

def lut_winter_snow(rgb):
    rgb = tint(rgb, -0.02, 0.02, 0.08)
    rgb = saturate(rgb, 0.85)
    return lift(rgb, 0.12)

def lut_neon_city(rgb):
    rgb = tint(rgb, 0.08, -0.04, 0.10)
    rgb = saturate(rgb, 1.55)
    return tuple(clamp(scurve(c, 0.3)) for c in rgb)

def lut_coffee_brown(rgb):
    rgb = tint(rgb, 0.10, 0.02, -0.08)
    rgb = saturate(rgb, 0.95)
    return tuple(clamp(scurve(c, 0.25)) for c in rgb)

def lut_iced_matcha(rgb):
    rgb = tint(rgb, -0.02, 0.08, 0.02)
    rgb = saturate(rgb, 1.15)
    return lift(rgb, 0.07)

def lut_lavender_field(rgb):
    rgb = tint(rgb, 0.04, -0.02, 0.10)
    rgb = saturate(rgb, 1.2)
    return lift(rgb, 0.06)

def lut_reef_glow(rgb):
    rgb = tint(rgb, -0.02, 0.06, 0.04)
    rgb = saturate(rgb, 1.5)
    return gain(rgb, 1.06)

def lut_golden_harvest(rgb):
    rgb = tint(rgb, 0.12, 0.06, -0.10)
    rgb = saturate(rgb, 1.25)
    return split_tone(rgb, 0.06, 0.02, -0.04, 0.10, 0.04, -0.06, 0.55)

def lut_midnight_blue(rgb):
    rgb = tint(rgb, -0.02, 0.0, 0.12)
    rgb = saturate(rgb, 1.2)
    return compress(rgb, 0.03, 0.92)

def lut_rose_dusk(rgb):
    rgb = tint(rgb, 0.10, -0.02, 0.04)
    rgb = saturate(rgb, 1.3)
    return split_tone(rgb, 0.04, 0.0, 0.0, 0.08, 0.0, -0.02, 0.5)

def lut_mint_fresh(rgb):
    rgb = tint(rgb, -0.02, 0.08, 0.04)
    rgb = saturate(rgb, 1.2)
    return lift(rgb, 0.09)

def lut_amber_glow(rgb):
    rgb = tint(rgb, 0.12, 0.05, -0.08)
    rgb = saturate(rgb, 1.3)
    return gain(rgb, 1.07)

def lut_slate_grey(rgb):
    rgb = saturate(rgb, 0.6)
    rgb = tint(rgb, 0.0, 0.0, 0.03)
    return tuple(clamp(scurve(c, 0.2)) for c in rgb)

def lut_peach_blush(rgb):
    rgb = tint(rgb, 0.10, 0.02, -0.02)
    rgb = saturate(rgb, 1.2)
    return lift(rgb, 0.08)

def lut_aurora(rgb):
    rgb = tint(rgb, -0.02, 0.10, 0.06)
    rgb = saturate(rgb, 1.4)
    return split_tone(rgb, 0.0, 0.06, 0.02, 0.04, -0.02, 0.08, 0.5)

LUTS = [
    ("vcut-da-lat-mist", "Sương Đà Lạt", lut_da_lat_mist),
    ("vcut-pho-hanoi", "Phở Hà Nội", lut_pho_hanoi),
    ("vcut-sea-breeze", "Gió biển", lut_sea_breeze),
    ("vcut-sunset-beach", "Hoàng hôn biển", lut_sunset_beach),
    ("vcut-forest-deep", "Rừng sâu", lut_forest_deep),
    ("vcut-desert-sand", "Cát sa mạc", lut_desert_sand),
    ("vcut-winter-snow", "Tuyết trắng", lut_winter_snow),
    ("vcut-neon-city", "Thành phố neon", lut_neon_city),
    ("vcut-coffee-brown", "Cà phê nâu", lut_coffee_brown),
    ("vcut-iced-matcha", "Matcha đá", lut_iced_matcha),
    ("vcut-lavender-field", "Đồng oải hương", lut_lavender_field),
    ("vcut-reef-glow", "San hô phát sáng", lut_reef_glow),
    ("vcut-golden-harvest", "Mùa gặt vàng", lut_golden_harvest),
    ("vcut-midnight-blue", "Xanh nửa đêm", lut_midnight_blue),
    ("vcut-rose-dusk", "Hồng hoàng hôn", lut_rose_dusk),
    ("vcut-mint-fresh", "Bạc hà tươi", lut_mint_fresh),
    ("vcut-amber-glow", "Hổ phách sáng", lut_amber_glow),
    ("vcut-slate-grey", "Xám đá", lut_slate_grey),
    ("vcut-peach-blush", "Đào ửng", lut_peach_blush),
    ("vcut-aurora", "Cực quang", lut_aurora),
]

def write_cube(path, fn):
    lines = ["# Generated by gen_vcut_luts5.py (VCut Studio original work)",
             f"LUT_3D_SIZE {SIZE}", ""]
    step = 1.0 / (SIZE - 1)
    for b in range(SIZE):
        for g in range(SIZE):
            for r in range(SIZE):
                rgb = (r * step, g * step, b * step)
                out = fn(rgb)
                lines.append(f"{out[0]:.6f} {out[1]:.6f} {out[2]:.6f}")
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")

def main():
    n = 0
    for lut_id, label, fn in LUTS:
        path = os.path.join(OUT_DIR, f"{lut_id}.cube")
        write_cube(path, fn)
        n += 1
        print(f"  wrote {lut_id}.cube ({label})")
    print(f"Done: {n} LUTs")

if __name__ == "__main__":
    main()
