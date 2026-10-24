#!/usr/bin/env python3
"""
gen_vcut_luts4.py — P5 (Phase 7): 20 LUT gốc VCut vòng 2.

Nối tiếp gen_vcut_luts.py/2/3.py: lưới Adobe .cube 17x17x17, xuất từ hàm
màu thuần túy (không lấy từ nguồn ngoài, không clone LUT thương mại).
Các primitive (clamp, luma, saturate, scurve, lift, gain, compress, tint,
split_tone, channel_shift, duotone, mono_tint) giống gen_vcut_luts3.py.

Chạy: python3 assets/filters/gen_vcut_luts4.py
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
# VIỆT NAM & CHÂU Á (6)
# ---------------------------------------------------------------------------

def lut_monsoon_rain(rgb):
    rgb = tint(rgb, -0.04, 0.02, 0.08)
    rgb = saturate(rgb, 1.1)
    return compress(rgb, 0.03, 0.94)

def lut_saigon_night(rgb):
    rgb = tint(rgb, 0.06, -0.02, 0.08)
    rgb = saturate(rgb, 1.45)
    return tuple(clamp(scurve(c, 0.3)) for c in rgb)

def lut_hanoi_autumn(rgb):
    rgb = tint(rgb, 0.10, 0.02, -0.06)
    rgb = saturate(rgb, 1.15)
    return split_tone(rgb, 0.04, 0.0, -0.02, 0.08, 0.02, -0.04, 0.5)

def lut_lantern_fest(rgb):
    rgb = tint(rgb, 0.12, 0.02, -0.08)
    rgb = saturate(rgb, 1.3)
    return gain(rgb, 1.08)

def lut_rice_terrace(rgb):
    rgb = tint(rgb, -0.02, 0.08, -0.02)
    rgb = saturate(rgb, 1.35)
    return tuple(clamp(scurve(c, 0.2)) for c in rgb)

def lut_midnight_market(rgb):
    rgb = tint(rgb, 0.08, 0.0, 0.06)
    rgb = saturate(rgb, 1.4)
    return compress(rgb, 0.02, 0.96)

# ---------------------------------------------------------------------------
# THIÊN NHIÊN (5)
# ---------------------------------------------------------------------------

def lut_cherry_festival(rgb):
    rgb = tint(rgb, 0.10, -0.02, 0.06)
    rgb = saturate(rgb, 1.25)
    return lift(rgb, 0.06)

def lut_glacier_blue(rgb):
    rgb = tint(rgb, -0.06, 0.02, 0.10)
    rgb = saturate(rgb, 1.2)
    return compress(rgb, 0.05, 0.98)

def lut_meadow_light(rgb):
    rgb = tint(rgb, 0.02, 0.06, -0.02)
    rgb = saturate(rgb, 1.3)
    return lift(rgb, 0.08)

def lut_bamboo_green(rgb):
    rgb = tint(rgb, -0.04, 0.10, 0.0)
    return saturate(rgb, 1.35)

def lut_lotus_pink(rgb):
    rgb = tint(rgb, 0.08, 0.0, 0.04)
    rgb = saturate(rgb, 1.1)
    return lift(rgb, 0.08)

# ---------------------------------------------------------------------------
# ẨM THỰC & ẤM (3)
# ---------------------------------------------------------------------------

def lut_bubble_tea(rgb):
    rgb = tint(rgb, 0.08, 0.04, -0.04)
    rgb = saturate(rgb, 1.1)
    return lift(rgb, 0.06)

def lut_honey_glow(rgb):
    rgb = tint(rgb, 0.10, 0.05, -0.06)
    rgb = saturate(rgb, 1.2)
    return gain(rgb, 1.06)

def lut_chili_ember(rgb):
    rgb = tint(rgb, 0.14, -0.02, -0.06)
    rgb = saturate(rgb, 1.45)
    return tuple(clamp(scurve(c, 0.3)) for c in rgb)

# ---------------------------------------------------------------------------
# ĐÊM & ĐƠN SẮC (3)
# ---------------------------------------------------------------------------

def lut_typhoon_grey(rgb):
    rgb = saturate(rgb, 0.55)
    rgb = tint(rgb, -0.02, 0.0, 0.04)
    return lift(rgb, 0.06)

def lut_ember_night(rgb):
    rgb = tint(rgb, 0.10, -0.02, -0.04)
    rgb = saturate(rgb, 1.1)
    return compress(rgb, 0.04, 0.92)

def lut_noir_smoke(rgb):
    rgb = saturate(rgb, 0.3)
    rgb = tint(rgb, 0.02, 0.0, 0.02)
    return tuple(clamp(scurve(c, 0.35)) for c in rgb)

# ---------------------------------------------------------------------------
# MƠ & SÁNG TẠO (3)
# ---------------------------------------------------------------------------

def lut_silk_road(rgb):
    rgb = tint(rgb, 0.08, 0.03, -0.05)
    rgb = saturate(rgb, 1.05)
    return split_tone(rgb, 0.05, 0.02, -0.02, 0.06, 0.02, -0.02, 0.55)

def lut_opal_dream(rgb):
    rgb = tint(rgb, 0.02, 0.0, 0.10)
    rgb = saturate(rgb, 1.2)
    return lift(rgb, 0.10)

def lut_coral_dawn(rgb):
    rgb = tint(rgb, 0.10, 0.02, -0.02)
    rgb = saturate(rgb, 1.35)
    return split_tone(rgb, 0.02, 0.0, -0.02, 0.08, 0.02, -0.04, 0.5)

LUTS = [
    ("vcut-monsoon-rain", "Mưa mùa hạ", lut_monsoon_rain),
    ("vcut-saigon-night", "Đêm Sài Gòn", lut_saigon_night),
    ("vcut-hanoi-autumn", "Thu Hà Nội", lut_hanoi_autumn),
    ("vcut-lantern-fest", "Đèn lồng", lut_lantern_fest),
    ("vcut-rice-terrace", "Ruộng bậc thang", lut_rice_terrace),
    ("vcut-midnight-market", "Chợ đêm", lut_midnight_market),
    ("vcut-cherry-festival", "Lễ hội anh đào", lut_cherry_festival),
    ("vcut-glacier-blue", "Băng hà xanh", lut_glacier_blue),
    ("vcut-meadow-light", "Đồng cỏ sáng", lut_meadow_light),
    ("vcut-bamboo-green", "Tre xanh", lut_bamboo_green),
    ("vcut-lotus-pink", "Sen hồng", lut_lotus_pink),
    ("vcut-bubble-tea", "Trà sữa", lut_bubble_tea),
    ("vcut-honey-glow", "Mật ong sáng", lut_honey_glow),
    ("vcut-chili-ember", "Ớt than hồng", lut_chili_ember),
    ("vcut-typhoon-grey", "Xám bão", lut_typhoon_grey),
    ("vcut-ember-night", "Than đêm", lut_ember_night),
    ("vcut-noir-smoke", "Khói noir", lut_noir_smoke),
    ("vcut-silk-road", "Con đường tơ lụa", lut_silk_road),
    ("vcut-opal-dream", "Mơ đá opal", lut_opal_dream),
    ("vcut-coral-dawn", "Bình minh san hô", lut_coral_dawn),
]

def write_cube(path, fn):
    lines = ["# Generated by gen_vcut_luts4.py (VCut Studio original work)",
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
