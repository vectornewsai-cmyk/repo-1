#!/usr/bin/env python3
"""Đo pixel frame giữa của 9 effect Q4 (chạy bởi test_q4_effects.js).

Nguồn gốc (q4src.png, 320x180): trái đỏ (255,0,0) / phải xanh (0,0,255),
dải gradient xám dưới cùng, tròn trắng + vuông xanh lá.
Mỗi assert có ngưỡng nới lỏng cho nén x264 (tolerance ~15-25).
"""
import os
import sys
from PIL import Image

OUT = sys.argv[1]


def px(name):
    return Image.open(os.path.join(OUT, name + ".png")).convert("RGB")


def mean_rgb(im, box):
    crop = im.crop(box)
    pxs = list(crop.getdata())
    n = len(pxs)
    return tuple(sum(p[i] for p in pxs) / n for i in range(3))


def uniq_colors(im):
    return len(set(im.getdata()))


def flat_std(im, box):
    # Độ lệch chuẩn kênh R trong vùng phẳng (đo nhiễu).
    import math
    pxs = [p[0] for p in im.crop(box).getdata()]
    m = sum(pxs) / len(pxs)
    return math.sqrt(sum((v - m) ** 2 for v in pxs) / len(pxs))


fails = []
total = [0]


def check(name, cond, detail):
    total[0] += 1
    print(("  ✅ " if cond else "  ❌ ") + f"{name}: {detail}")
    if not cond:
        fails.append(name)


src = px("src")
W, H = src.size
assert (W, H) == (320, 180), f"nguồn sai kích thước: {W}x{H}"

# --- glitch: lệch kênh ở biên tròn trắng (R-B chênh lớn tại biên), frame khác nguồn
g = px("glitch")
edge_diff = 0
for x in range(115, 205, 2):
    r1, _, b1 = g.getpixel((x, 60))
    edge_diff = max(edge_diff, abs(r1 - b1))
check("glitch fringing", edge_diff > 40, f"max|R-B| tại biên = {edge_diff}")
check("glitch khác nguồn", list(g.getdata()) != list(src.getdata()), "frame đã đổi")

# --- rgb-shift: lệch kênh nhưng vùng phẳng KHÔNG nhiễu (khác glitch)
rs = px("rgb-shift")
edge_diff = 0
for x in range(115, 205, 2):
    r1, _, b1 = rs.getpixel((x, 60))
    edge_diff = max(edge_diff, abs(r1 - b1))
check("rgb-shift fringing", edge_diff > 40, f"max|R-B| tại biên = {edge_diff}")
check("rgb-shift phẳng sạch", flat_std(rs, (10, 10, 100, 30)) < 8,
      f"std vùng đỏ phẳng = {flat_std(rs, (10, 10, 100, 30)):.1f}")

# --- shake: khác nguồn nhưng đúng kích thước 320x180
sh = px("shake")
check("shake đúng kích thước", sh.size == (320, 180), f"{sh.size}")
check("shake khác nguồn", list(sh.getdata()) != list(src.getdata()), "frame đã đổi")

# --- pixelate: dải gradient bị khối hóa — số đoạn màu liên tiếp trên 1 hàng
# giảm mạnh (nguồn ~212 bước mượt → pixelate ~35 khối lý thuyết; x264 +
# yuv420p làm nhiễu thêm nên thực đo ~80, ngưỡng nới theo đó).
def runs_on_row(im, y, x0=0, x1=320):
    row = [im.getpixel((x, y)) for x in range(x0, x1)]
    return 1 + sum(1 for a, b in zip(row, row[1:]) if a != b)

pix = px("pixelate")
r_src, r_pix = runs_on_row(src, 150), runs_on_row(pix, 150)
check("pixelate khối hóa gradient", r_pix < 100 and r_pix < r_src * 0.5,
      f"số đoạn màu hàng y=150: nguồn {r_src} → pixelate {r_pix}")

# --- mirror: nửa trái output ≈ nửa phải nguồn (đỏ ↔ xanh đảo chỗ).
# Lấy dải y=100..125 (dưới vuông xanh lá, trên dải gradient) để tránh lẫn màu khác.
mi = px("mirror")
ml = mean_rgb(mi, (10, 100, 100, 125))   # trái output: phải là xanh (nguồn phải)
mr = mean_rgb(mi, (220, 100, 310, 125))  # phải output: phải là đỏ (nguồn trái)
check("mirror đảo trái/phải", ml[2] > 180 and ml[0] < 80 and mr[0] > 180 and mr[2] < 80,
      f"trái output RGB={tuple(round(v) for v in ml)}, phải output RGB={tuple(round(v) for v in mr)}")

# --- old-film: bão hòa giảm + có nhiễu ở vùng phẳng
of = px("old-film")
sr, sg, sb = mean_rgb(of, (10, 10, 100, 100))
sat_proxy = max(sr, sg, sb) - min(sr, sg, sb)
check("old-film nhạt màu", sat_proxy < 200, f"max-min kênh vùng đỏ = {sat_proxy:.0f}")
check("old-film có nhiễu", flat_std(of, (10, 10, 100, 30)) > 2,
      f"std vùng phẳng = {flat_std(of, (10, 10, 100, 30)):.1f}")

# --- invert full (intensity=1): pixel ≈ 255 - nguồn (tolerance x264)
inv = px("invert-full")
diff = 0
for (x, y) in [(20, 20), (300, 20), (65, 65), (160, 60), (200, 150)]:
    r0, g0, b0 = src.getpixel((x, y))
    r1, g1, b1 = inv.getpixel((x, y))
    diff = max(diff, abs(r1 - (255 - r0)), abs(g1 - (255 - g0)), abs(b1 - (255 - b0)))
check("invert-full đảo màu", diff < 30, f"sai lệch max = {diff}")

# --- edgedetect: nền tối, biên sáng
ed = px("edgedetect")
mean_all = mean_rgb(ed, (0, 0, 320, 180))
mx = max(max(p) for p in ed.getdata())
check("edgedetect nền tối + biên sáng", mean_all[0] < 45 and mx > 100,
      f"mean R = {mean_all[0]:.1f}, max = {mx}")

# --- hue-rotate: vùng đỏ gốc chuyển tông (R không còn áp đảo tuyệt đối ở vùng đỏ)
hr = px("hue-rotate")
r0, g0, b0 = mean_rgb(hr, (10, 10, 100, 100))
check("hue-rotate đổi tông đỏ", not (r0 > 200 and g0 < 60 and b0 < 60),
      f"vùng đỏ cũ RGB = {tuple(round(v) for v in (r0, g0, b0))}")

print(f"== measure: {total[0] - len(fails)}/{total[0]} checks pass ==")
if fails:
    print("FAIL:", fails)
    sys.exit(1)
