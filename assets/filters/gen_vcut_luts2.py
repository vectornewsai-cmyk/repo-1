#!/usr/bin/env python3
"""
gen_vcut_luts2.py — Sinh thêm 42 file .cube phong cách màu gốc cho VCut Studio.

Tác phẩm gốc (original work) của dự án VCut Studio — không copy từ nguồn nào.
Tiếp nối gen_vcut_luts.py (10 LUT đầu). Mỗi LUT là một hàm biến đổi màu
được định nghĩa rõ ràng bên dưới, xuất ra lưới 17x17x17 theo chuẩn Adobe .cube.

Chạy: python3 gen_vcut_luts2.py  (ghi vào cùng thư mục assets/filters/)
"""
import os

SIZE = 17
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# Primitive màu (pure functions trên RGB [0,1]) — mirror từ gen_vcut_luts.py
# ---------------------------------------------------------------------------

def clamp(x):
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)

def luma(r, g, b):
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def saturate(rgb, amt):
    r, g, b = rgb
    y = luma(r, g, b)
    return (clamp(y + (r - y) * amt),
            clamp(y + (g - y) * amt),
            clamp(y + (b - y) * amt))

def scurve(x, amount):
    return clamp(x + amount * 4.0 * x * (1.0 - x) * (x - 0.5))

def lift(rgb, amt):
    return tuple(clamp(c + amt * (1.0 - c)) for c in rgb)

def gain(rgb, amt):
    return tuple(clamp(c * amt) for c in rgb)

def compress(rgb, lo, hi):
    return tuple(clamp(lo + c * (hi - lo)) for c in rgb)

def tint(rgb, dr, dg, db):
    r, g, b = rgb
    return (clamp(r + dr), clamp(g + dg), clamp(b + db))

def split_tone(rgb, sr, sg, sb, hr, hg, hb, amt):
    """Split-toning linh hoạt: màu shadow (sr,sg,sb) + màu highlight (hr,hg,hb)."""
    r, g, b = rgb
    y = luma(r, g, b)
    ws = (1 - y) * (1 - y)
    wh = y * y
    r = r + amt * (sr * ws + hr * wh)
    g = g + amt * (sg * ws + hg * wh)
    b = b + amt * (sb * ws + hb * wh)
    return (clamp(r), clamp(g), clamp(b))

def channel_shift(rgb, dr, dg, db):
    """Dịch kênh màu theo luma (kiểu cross-process)."""
    r, g, b = rgb
    y = luma(r, g, b)
    return (clamp(r + dr * y), clamp(g + dg * y), clamp(b + db * y))

def duotone(rgb, dark, light):
    """Duotone: map luma về gradient 2 màu."""
    r, g, b = rgb
    y = luma(r, g, b)
    y = scurve(y, 0.2)
    return (clamp(dark[0] + (light[0] - dark[0]) * y),
            clamp(dark[1] + (light[1] - dark[1]) * y),
            clamp(dark[2] + (light[2] - dark[2]) * y))

# ---------------------------------------------------------------------------
# CINEMATIC (8)
# ---------------------------------------------------------------------------

def lut_desert_heat(rgb):
    rgb = tint(rgb, 0.10, 0.03, -0.08)
    rgb = tuple(scurve(c, 0.30) for c in rgb)
    rgb = split_tone(rgb, -0.05, -0.02, -0.06, 0.12, 0.05, -0.02, 0.8)
    return saturate(rgb, 1.25)

def lut_emerald_city(rgb):
    rgb = tint(rgb, -0.06, 0.04, 0.02)
    rgb = tuple(scurve(c, 0.25) for c in rgb)
    rgb = split_tone(rgb, -0.04, 0.06, 0.02, 0.02, 0.08, -0.02, 0.7)
    return saturate(rgb, 1.15)

def lut_crimson_dusk(rgb):
    rgb = split_tone(rgb, -0.03, -0.06, 0.02, 0.14, -0.02, -0.04, 0.9)
    rgb = tuple(scurve(c, 0.35) for c in rgb)
    return saturate(rgb, 1.20)

def lut_steel_blue(rgb):
    rgb = tint(rgb, -0.08, -0.02, 0.06)
    rgb = tuple(scurve(c, 0.28) for c in rgb)
    rgb = lift(rgb, 0.02)
    return saturate(rgb, 0.85)

def lut_amber_noir(rgb):
    rgb = split_tone(rgb, -0.08, -0.05, -0.02, 0.10, 0.06, -0.04, 1.0)
    rgb = tuple(scurve(c, 0.45) for c in rgb)
    rgb = gain(rgb, 0.92)
    return saturate(rgb, 0.90)

def lut_violet_haze(rgb):
    rgb = tint(rgb, 0.04, -0.02, 0.08)
    rgb = lift(rgb, 0.08)
    rgb = compress(rgb, 0.05, 0.95)
    return saturate(rgb, 1.05)

def lut_copper_tone(rgb):
    rgb = channel_shift(rgb, 0.08, 0.02, -0.06)
    rgb = tuple(scurve(c, 0.22) for c in rgb)
    return saturate(rgb, 1.18)

def lut_midnight_teal(rgb):
    rgb = split_tone(rgb, -0.06, 0.04, 0.08, 0.04, -0.02, -0.06, 1.0)
    rgb = tuple(scurve(c, 0.38) for c in rgb)
    rgb = gain(rgb, 0.88)
    return saturate(rgb, 1.10)

# ---------------------------------------------------------------------------
# VINTAGE / FILM (8)
# ---------------------------------------------------------------------------

def lut_sepia_classic(rgb):
    y = luma(*rgb)
    r = clamp(y * 1.10 + 0.08)
    g = clamp(y * 0.95 + 0.04)
    b = clamp(y * 0.78)
    return (r, g, b)

def lut_kodachrome_pop(rgb):
    rgb = tuple(scurve(c, 0.30) for c in rgb)
    rgb = saturate(rgb, 1.35)
    rgb = tint(rgb, 0.03, -0.01, -0.04)
    return rgb

def lut_polaroid_fade(rgb):
    rgb = lift(rgb, 0.14)
    rgb = compress(rgb, 0.10, 0.90)
    rgb = tint(rgb, 0.05, 0.02, -0.02)
    return saturate(rgb, 0.75)

def lut_lomography(rgb):
    rgb = tuple(scurve(c, 0.40) for c in rgb)
    rgb = saturate(rgb, 1.45)
    rgb = split_tone(rgb, -0.02, -0.04, 0.06, 0.06, 0.02, -0.06, 0.6)
    return rgb

def lut_cross_process(rgb):
    r, g, b = rgb
    r = clamp(r * 1.08 + 0.04 * (1 - g))
    g = clamp(g * 0.96 + 0.03)
    b = clamp(b * 1.12 - 0.02 * r)
    rgb = (r, g, b)
    rgb = tuple(scurve(c, 0.18) for c in rgb)
    return saturate(rgb, 1.15)

def lut_bleach_warm(rgb):
    y = luma(*rgb)
    rgb = tuple(clamp(c * 0.7 + y * 0.3) for c in rgb)  # bleach bypass một phần
    rgb = tint(rgb, 0.06, 0.02, -0.04)
    rgb = tuple(scurve(c, 0.25) for c in rgb)
    return saturate(rgb, 0.90)

def lut_retro_neon(rgb):
    rgb = saturate(rgb, 1.50)
    rgb = split_tone(rgb, 0.02, -0.06, 0.10, 0.10, -0.04, -0.08, 0.8)
    rgb = tuple(scurve(c, 0.28) for c in rgb)
    return rgb

def lut_vhs_tracking(rgb):
    rgb = lift(rgb, 0.06)
    rgb = tint(rgb, 0.02, 0.04, -0.02)
    rgb = compress(rgb, 0.08, 0.92)
    return saturate(rgb, 1.10)

# ---------------------------------------------------------------------------
# BLACK & WHITE (6)
# ---------------------------------------------------------------------------

def lut_bw_high_contrast(rgb):
    y = luma(*rgb)
    y = scurve(y, 0.70)
    return (y, y, y)

def lut_bw_soft(rgb):
    y = luma(*rgb)
    y = clamp(0.08 + y * 0.84)
    return (y, y, y)

def lut_bw_selenium(rgb):
    y = luma(*rgb)
    y = scurve(y, 0.35)
    r = clamp(y + 0.06 * (1 - y))
    g = clamp(y + 0.02 * (1 - y))
    b = clamp(y + 0.10 * (1 - y))
    return (r, g, b)

def lut_bw_warm(rgb):
    y = luma(*rgb)
    y = scurve(y, 0.30)
    return (clamp(y + 0.05), clamp(y + 0.02), clamp(y - 0.04))

def lut_bw_cold(rgb):
    y = luma(*rgb)
    y = scurve(y, 0.30)
    return (clamp(y - 0.04), clamp(y + 0.01), clamp(y + 0.06))

def lut_bw_infrared(rgb):
    r, g, b = rgb
    y = clamp(0.3 * r + 0.5 * g + 0.2 * b)
    y = scurve(y, 0.45)
    glow = clamp((g - luma(r, g, b)) * 0.8 + 0.12)
    return (clamp(y + glow * 0.4), clamp(y + glow * 0.5), clamp(y + glow * 0.4))

# ---------------------------------------------------------------------------
# NATURE / OUTDOOR (6)
# ---------------------------------------------------------------------------

def lut_forest_mist(rgb):
    rgb = lift(rgb, 0.10)
    rgb = tint(rgb, -0.04, 0.03, -0.02)
    rgb = compress(rgb, 0.06, 0.94)
    return saturate(rgb, 0.85)

def lut_ocean_deep(rgb):
    rgb = split_tone(rgb, -0.04, 0.02, 0.10, 0.02, 0.06, 0.02, 0.8)
    rgb = tuple(scurve(c, 0.25) for c in rgb)
    return saturate(rgb, 1.20)

def lut_desert_dusk(rgb):
    rgb = tint(rgb, 0.08, 0.02, -0.10)
    rgb = split_tone(rgb, -0.02, -0.04, 0.04, 0.12, 0.04, -0.08, 0.9)
    return saturate(rgb, 1.15)

def lut_autumn_glow(rgb):
    r, g, b = rgb
    y = luma(r, g, b)
    r = clamp(r + 0.08 * y)
    g = clamp(g + 0.03 * y)
    b = clamp(b - 0.06 * y)
    rgb = (r, g, b)
    rgb = tuple(scurve(c, 0.20) for c in rgb)
    return saturate(rgb, 1.25)

def lut_spring_fresh(rgb):
    rgb = tint(rgb, -0.02, 0.05, 0.02)
    rgb = lift(rgb, 0.05)
    return saturate(rgb, 1.15)

def lut_winter_frost(rgb):
    rgb = tint(rgb, -0.03, 0.0, 0.07)
    rgb = lift(rgb, 0.06)
    rgb = tuple(scurve(c, 0.12) for c in rgb)
    return saturate(rgb, 0.80)

# ---------------------------------------------------------------------------
# URBAN / NIGHT (6)
# ---------------------------------------------------------------------------

def lut_neon_nights(rgb):
    rgb = saturate(rgb, 1.55)
    rgb = split_tone(rgb, 0.06, -0.04, 0.12, 0.08, 0.02, -0.06, 0.9)
    rgb = tuple(scurve(c, 0.32) for c in rgb)
    rgb = gain(rgb, 0.92)
    return rgb

def lut_tokyo_drift(rgb):
    rgb = tint(rgb, 0.02, -0.03, 0.08)
    rgb = split_tone(rgb, -0.02, 0.04, 0.10, 0.08, -0.02, -0.04, 0.8)
    rgb = tuple(scurve(c, 0.28) for c in rgb)
    return saturate(rgb, 1.30)

def lut_urban_decay(rgb):
    rgb = compress(rgb, 0.10, 0.85)
    rgb = tint(rgb, 0.03, 0.02, -0.03)
    rgb = lift(rgb, 0.06)
    return saturate(rgb, 0.70)

def lut_rooftop_dawn(rgb):
    rgb = split_tone(rgb, -0.04, -0.02, 0.06, 0.12, 0.05, -0.02, 0.9)
    rgb = lift(rgb, 0.04)
    return saturate(rgb, 1.10)

def lut_subway_green(rgb):
    rgb = tint(rgb, -0.06, 0.06, -0.02)
    rgb = tuple(scurve(c, 0.30) for c in rgb)
    rgb = gain(rgb, 0.90)
    return saturate(rgb, 0.95)

def lut_street_sodium(rgb):
    rgb = tint(rgb, 0.12, 0.04, -0.12)
    rgb = split_tone(rgb, 0.06, 0.02, -0.08, 0.10, 0.04, -0.10, 0.9)
    rgb = tuple(scurve(c, 0.25) for c in rgb)
    return saturate(rgb, 1.10)

# ---------------------------------------------------------------------------
# PORTRAIT (4)
# ---------------------------------------------------------------------------

def lut_skin_glow(rgb):
    r, g, b = rgb
    y = luma(r, g, b)
    wm = 1 - abs(2 * y - 1)
    r = clamp(r + 0.05 * wm)
    g = clamp(g + 0.02 * wm)
    rgb = (r, g, clamp(b - 0.02 * wm))
    rgb = lift(rgb, 0.03)
    return saturate(rgb, 1.05)

def lut_soft_beauty(rgb):
    rgb = lift(rgb, 0.08)
    rgb = compress(rgb, 0.04, 0.96)
    rgb = tint(rgb, 0.03, 0.01, -0.01)
    return saturate(rgb, 0.90)

def lut_golden_skin(rgb):
    rgb = split_tone(rgb, -0.02, -0.03, -0.02, 0.10, 0.05, -0.03, 0.8)
    rgb = tuple(scurve(c, 0.15) for c in rgb)
    return saturate(rgb, 1.12)

def lut_porcelain(rgb):
    rgb = lift(rgb, 0.10)
    rgb = tint(rgb, 0.02, 0.0, 0.03)
    rgb = compress(rgb, 0.08, 0.98)
    return saturate(rgb, 0.75)

# ---------------------------------------------------------------------------
# CREATIVE (4)
# ---------------------------------------------------------------------------

def lut_duotone_magenta(rgb):
    return duotone(rgb, (0.05, 0.0, 0.10), (1.0, 0.45, 0.85))

def lut_duotone_cyan_orange(rgb):
    return duotone(rgb, (0.0, 0.10, 0.15), (1.0, 0.65, 0.25))

def lut_infrared_false(rgb):
    r, g, b = rgb
    return (clamp(b * 1.1), clamp(r * 1.05), clamp(g * 1.1))

def lut_solarized(rgb):
    r, g, b = rgb
    def sol(x):
        return clamp(1.0 - x if x > 0.5 else x * 1.15)
    return (sol(r), sol(g), sol(b))

# ---------------------------------------------------------------------------
# Danh sách LUT
# ---------------------------------------------------------------------------

LUTS = [
    # Cinematic (8)
    ("vcut-desert-heat", "Desert Heat", lut_desert_heat),
    ("vcut-emerald-city", "Emerald City", lut_emerald_city),
    ("vcut-crimson-dusk", "Crimson Dusk", lut_crimson_dusk),
    ("vcut-steel-blue", "Steel Blue", lut_steel_blue),
    ("vcut-amber-noir", "Amber Noir", lut_amber_noir),
    ("vcut-violet-haze", "Violet Haze", lut_violet_haze),
    ("vcut-copper-tone", "Copper Tone", lut_copper_tone),
    ("vcut-midnight-teal", "Midnight Teal", lut_midnight_teal),
    # Vintage/Film (8)
    ("vcut-sepia-classic", "Sepia Classic", lut_sepia_classic),
    ("vcut-kodachrome-pop", "Kodachrome Pop", lut_kodachrome_pop),
    ("vcut-polaroid-fade", "Polaroid Fade", lut_polaroid_fade),
    ("vcut-lomography", "Lomography", lut_lomography),
    ("vcut-cross-process", "Cross Process", lut_cross_process),
    ("vcut-bleach-warm", "Bleach Warm", lut_bleach_warm),
    ("vcut-retro-neon", "Retro Neon", lut_retro_neon),
    ("vcut-vhs-tracking", "VHS Tracking", lut_vhs_tracking),
    # B&W (6)
    ("vcut-bw-high-contrast", "B&W High Contrast", lut_bw_high_contrast),
    ("vcut-bw-soft", "B&W Soft", lut_bw_soft),
    ("vcut-bw-selenium", "B&W Selenium", lut_bw_selenium),
    ("vcut-bw-warm", "B&W Warm", lut_bw_warm),
    ("vcut-bw-cold", "B&W Cold", lut_bw_cold),
    ("vcut-bw-infrared", "B&W Infrared", lut_bw_infrared),
    # Nature (6)
    ("vcut-forest-mist", "Forest Mist", lut_forest_mist),
    ("vcut-ocean-deep", "Ocean Deep", lut_ocean_deep),
    ("vcut-desert-dusk", "Desert Dusk", lut_desert_dusk),
    ("vcut-autumn-glow", "Autumn Glow", lut_autumn_glow),
    ("vcut-spring-fresh", "Spring Fresh", lut_spring_fresh),
    ("vcut-winter-frost", "Winter Frost", lut_winter_frost),
    # Urban/Night (6)
    ("vcut-neon-nights", "Neon Nights", lut_neon_nights),
    ("vcut-tokyo-drift", "Tokyo Drift", lut_tokyo_drift),
    ("vcut-urban-decay", "Urban Decay", lut_urban_decay),
    ("vcut-rooftop-dawn", "Rooftop Dawn", lut_rooftop_dawn),
    ("vcut-subway-green", "Subway Green", lut_subway_green),
    ("vcut-street-sodium", "Street Sodium", lut_street_sodium),
    # Portrait (4)
    ("vcut-skin-glow", "Skin Glow", lut_skin_glow),
    ("vcut-soft-beauty", "Soft Beauty", lut_soft_beauty),
    ("vcut-golden-skin", "Golden Skin", lut_golden_skin),
    ("vcut-porcelain", "Porcelain", lut_porcelain),
    # Creative (4)
    ("vcut-duotone-magenta", "Duotone Magenta", lut_duotone_magenta),
    ("vcut-duotone-cyan-orange", "Duotone Cyan Orange", lut_duotone_cyan_orange),
    ("vcut-infrared-false", "Infrared False", lut_infrared_false),
    ("vcut-solarized", "Solarized", lut_solarized),
]

def write_cube(path, title, fn):
    with open(path, "w") as f:
        f.write(f'TITLE "{title}"\n')
        f.write(f"LUT_3D_SIZE {SIZE}\n")
        f.write("DOMAIN_MIN 0.0 0.0 0.0\n")
        f.write("DOMAIN_MAX 1.0 1.0 1.0\n\n")
        n = SIZE - 1
        for bi in range(SIZE):
            for gi in range(SIZE):
                for ri in range(SIZE):
                    r, g, b = fn((ri / n, gi / n, bi / n))
                    f.write(f"{r:.6f} {g:.6f} {b:.6f}\n")

def main():
    for lut_id, title, fn in LUTS:
        path = os.path.join(OUT_DIR, f"{lut_id}.cube")
        write_cube(path, title, fn)
        print(f"  wrote {lut_id}.cube")

if __name__ == "__main__":
    main()
    print(f"✅ {len(LUTS)} file .cube đã sinh trong {OUT_DIR}")
