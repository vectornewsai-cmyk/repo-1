#!/usr/bin/env python3
"""
gen_vcut_luts3.py — Sinh thêm 30 file .cube phong cách màu gốc cho VCut Studio (K6, Phase 6).

Tác phẩm gốc (original work) của dự án VCut Studio — không copy từ nguồn nào.
Tiếp nối gen_vcut_luts.py (10 LUT) và gen_vcut_luts2.py (42 LUT).
Mỗi LUT là một hàm biến đổi màu được định nghĩa rõ ràng bên dưới,
xuất ra lưới 17x17x17 theo chuẩn Adobe .cube.

Chạy: python3 gen_vcut_luts3.py  (ghi vào cùng thư mục assets/filters/)
"""
import os

SIZE = 17
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# Primitive màu (pure functions trên RGB [0,1]) — mirror từ gen_vcut_luts2.py
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
    """Split-toning: màu shadow (sr,sg,sb) + màu highlight (hr,hg,hb)."""
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

def mono_tint(rgb, tr, tg, tb, sat=0.0):
    """Đơn sắc phủ màu: khử bão hoà rồi phủ tint theo luma."""
    r, g, b = rgb
    y = luma(r, g, b)
    base = saturate((r, g, b), sat)
    return (clamp(base[0] + (tr - 0.5) * y * 0.6),
            clamp(base[1] + (tg - 0.5) * y * 0.6),
            clamp(base[2] + (tb - 0.5) * y * 0.6))

# ---------------------------------------------------------------------------
# BIỂN & ĐẢO (5)
# ---------------------------------------------------------------------------

def lut_lagoon(rgb):
    rgb = tint(rgb, -0.06, 0.04, 0.08)
    rgb = saturate(rgb, 1.35)
    return split_tone(rgb, -0.02, 0.05, 0.08, 0.08, 0.04, -0.02, 0.5)

def lut_deep_sea(rgb):
    rgb = tint(rgb, -0.10, 0.02, 0.12)
    rgb = saturate(rgb, 1.15)
    rgb = compress(rgb, 0.02, 0.92)
    return split_tone(rgb, -0.04, 0.02, 0.10, 0.02, 0.05, 0.06, 0.5)

def lut_coral_reef(rgb):
    rgb = tint(rgb, 0.10, -0.02, -0.04)
    return saturate(rgb, 1.5)

def lut_santorini(rgb):
    rgb = tint(rgb, -0.02, 0.02, 0.10)
    rgb = saturate(rgb, 1.2)
    return tuple(clamp(scurve(c, 0.25)) for c in rgb)

def lut_bali_sunset(rgb):
    rgb = tint(rgb, 0.12, 0.02, -0.10)
    rgb = saturate(rgb, 1.4)
    return split_tone(rgb, 0.06, 0.0, -0.04, 0.10, 0.03, -0.06, 0.6)

# ---------------------------------------------------------------------------
# ẨM THỰC & SẢN PHẨM (4)
# ---------------------------------------------------------------------------

def lut_coffee_roast(rgb):
    rgb = tint(rgb, 0.08, 0.02, -0.08)
    rgb = saturate(rgb, 1.1)
    return tuple(clamp(scurve(c, 0.3)) for c in rgb)

def lut_matcha(rgb):
    rgb = tint(rgb, -0.04, 0.10, -0.02)
    return saturate(rgb, 1.3)

def lut_candy_pop(rgb):
    rgb = saturate(rgb, 1.7)
    return tuple(clamp(scurve(c, 0.35)) for c in rgb)

def lut_champagne(rgb):
    rgb = tint(rgb, 0.06, 0.03, -0.06)
    rgb = saturate(rgb, 0.9)
    return lift(rgb, 0.08)

# ---------------------------------------------------------------------------
# ĐÊM & KINH DỊ (4)
# ---------------------------------------------------------------------------

def lut_blood_moon(rgb):
    rgb = tint(rgb, 0.12, -0.04, -0.06)
    rgb = saturate(rgb, 1.2)
    return compress(rgb, 0.05, 0.95)

def lut_graveyard_fog(rgb):
    rgb = saturate(rgb, 0.45)
    rgb = tint(rgb, -0.02, 0.03, 0.02)
    return lift(rgb, 0.12)

def lut_toxic_green(rgb):
    rgb = tint(rgb, -0.06, 0.12, -0.02)
    return saturate(rgb, 1.5)

def lut_midnight_purple(rgb):
    rgb = tint(rgb, 0.04, -0.04, 0.12)
    rgb = saturate(rgb, 1.1)
    return compress(rgb, 0.03, 0.90)

# ---------------------------------------------------------------------------
# RETRO TECH (4)
# ---------------------------------------------------------------------------

def lut_crt_green(rgb):
    return mono_tint(rgb, 0.2, 0.9, 0.3, sat=0.0)

def lut_terminal_amber(rgb):
    return mono_tint(rgb, 1.0, 0.65, 0.15, sat=0.0)

def lut_floppy_purple(rgb):
    rgb = tint(rgb, 0.08, -0.02, 0.10)
    rgb = saturate(rgb, 1.25)
    return tuple(clamp(scurve(c, 0.2)) for c in rgb)

def lut_vaporwave_sunset(rgb):
    rgb = tint(rgb, 0.10, -0.02, 0.12)
    rgb = saturate(rgb, 1.5)
    return split_tone(rgb, 0.05, -0.02, 0.10, 0.10, 0.02, 0.05, 0.5)

# ---------------------------------------------------------------------------
# ĐÁM CƯỚI & MỀM (3)
# ---------------------------------------------------------------------------

def lut_blush_pink(rgb):
    rgb = tint(rgb, 0.08, 0.0, 0.02)
    rgb = saturate(rgb, 0.95)
    return lift(rgb, 0.10)

def lut_ivory(rgb):
    rgb = tint(rgb, 0.04, 0.02, -0.02)
    rgb = saturate(rgb, 0.85)
    return lift(rgb, 0.12)

def lut_silk_white(rgb):
    rgb = saturate(rgb, 0.7)
    rgb = compress(rgb, 0.08, 1.0)
    return lift(rgb, 0.06)

# ---------------------------------------------------------------------------
# THỂ THAO & SÂN KHẤU (3)
# ---------------------------------------------------------------------------

def lut_stadium_night(rgb):
    rgb = tint(rgb, -0.02, 0.0, 0.06)
    rgb = saturate(rgb, 1.3)
    return tuple(clamp(scurve(c, 0.35)) for c in rgb)

def lut_concert_laser(rgb):
    rgb = saturate(rgb, 1.6)
    rgb = tint(rgb, 0.06, -0.02, 0.10)
    return tuple(clamp(scurve(c, 0.3)) for c in rgb)

def lut_vinyl_warm(rgb):
    rgb = tint(rgb, 0.10, 0.03, -0.08)
    rgb = saturate(rgb, 1.05)
    return compress(rgb, 0.04, 0.96)

# ---------------------------------------------------------------------------
# ĐƠN SẮC PHỦ MÀU (3)
# ---------------------------------------------------------------------------

def lut_bw_blueprint(rgb):
    return mono_tint(rgb, 0.15, 0.35, 0.85, sat=0.0)

def lut_bw_sepia_deep(rgb):
    return mono_tint(rgb, 0.75, 0.55, 0.30, sat=0.0)

def lut_bw_night_green(rgb):
    return mono_tint(rgb, 0.1, 0.6, 0.25, sat=0.0)

# ---------------------------------------------------------------------------
# THỬ NGHIỆM (4)
# ---------------------------------------------------------------------------

def lut_solar_flare(rgb):
    rgb = tint(rgb, 0.14, 0.02, -0.10)
    rgb = saturate(rgb, 1.4)
    return gain(rgb, 1.12)

def lut_prism(rgb):
    rgb = channel_shift(rgb, 0.10, -0.05, -0.08)
    return saturate(rgb, 1.4)

def lut_acid_rain(rgb):
    rgb = channel_shift(rgb, -0.08, 0.10, 0.02)
    return saturate(rgb, 1.55)

def lut_synthwave_grid(rgb):
    rgb = tint(rgb, 0.08, -0.04, 0.14)
    rgb = saturate(rgb, 1.45)
    return split_tone(rgb, 0.06, -0.02, 0.12, 0.10, 0.0, 0.08, 0.5)

# ---------------------------------------------------------------------------
# Danh sách xuất
# ---------------------------------------------------------------------------

LUTS = [
    ("vcut-lagoon", "Đầm phá", lut_lagoon),
    ("vcut-deep-sea", "Biển sâu", lut_deep_sea),
    ("vcut-coral-reef", "Rạn san hô", lut_coral_reef),
    ("vcut-santorini", "Santorini", lut_santorini),
    ("vcut-bali-sunset", "Hoàng hôn Bali", lut_bali_sunset),
    ("vcut-coffee-roast", "Cà phê rang", lut_coffee_roast),
    ("vcut-matcha", "Matcha", lut_matcha),
    ("vcut-candy-pop", "Kẹo ngọt", lut_candy_pop),
    ("vcut-champagne", "Sâm panh", lut_champagne),
    ("vcut-blood-moon", "Trăng máu", lut_blood_moon),
    ("vcut-graveyard-fog", "Sương nghĩa địa", lut_graveyard_fog),
    ("vcut-toxic-green", "Xanh độc", lut_toxic_green),
    ("vcut-midnight-purple", "Tím nửa đêm", lut_midnight_purple),
    ("vcut-crt-green", "Màn hình CRT xanh", lut_crt_green),
    ("vcut-terminal-amber", "Terminal hổ phách", lut_terminal_amber),
    ("vcut-floppy-purple", "Tím floppy", lut_floppy_purple),
    ("vcut-vaporwave-sunset", "Hoàng hôn vaporwave", lut_vaporwave_sunset),
    ("vcut-blush-pink", "Hồng má", lut_blush_pink),
    ("vcut-ivory", "Ngà voi", lut_ivory),
    ("vcut-silk-white", "Lụa trắng", lut_silk_white),
    ("vcut-stadium-night", "Đêm sân vận động", lut_stadium_night),
    ("vcut-concert-laser", "Laser hòa nhạc", lut_concert_laser),
    ("vcut-vinyl-warm", "Đĩa than ấm", lut_vinyl_warm),
    ("vcut-bw-blueprint", "Đơn sắc bản vẽ", lut_bw_blueprint),
    ("vcut-bw-sepia-deep", "Nâu đỏ đậm", lut_bw_sepia_deep),
    ("vcut-bw-night-green", "Xanh đêm", lut_bw_night_green),
    ("vcut-solar-flare", "Lóe mặt trời", lut_solar_flare),
    ("vcut-prism", "Lăng kính", lut_prism),
    ("vcut-acid-rain", "Mưa axit", lut_acid_rain),
    ("vcut-synthwave-grid", "Lưới synthwave", lut_synthwave_grid),
]

def write_cube(path, fn):
    lines = ["# Generated by gen_vcut_luts3.py (VCut Studio original work)",
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
