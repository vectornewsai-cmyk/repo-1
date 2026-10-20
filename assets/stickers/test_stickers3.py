#!/usr/bin/env python3
"""Test sticker batch 3 (StickerHarvest): Twemoji CC-BY 4.0 + Noto Emoji Apache-2.0.

Kiểm tra:
[1] manifest JSON hợp lệ, đủ 173 entries, mỗi entry có sha256/file/license
[2] fetch_stickers.sh: syntax bash ok, số lượng fetch() khớp manifest
[3] mỗi PNG trong manifest: tồn tại ở assets/stickers + public/stickers,
    mở được bằng PIL, có alpha channel, có pixel không trong suốt,
    sha256 khớp manifest
[4] SOURCES.md: mỗi file có 1 dòng attribution
[5] sticker.ts: STICKER_LIBRARY chứa đủ file mới
"""
import hashlib
import json
import os
import re
import subprocess
import sys

REPO = os.path.expanduser("~/workspace/repo-1")
DIR = os.path.join(REPO, "assets/stickers")
PUB = os.path.join(REPO, "apps/web/public/stickers")

fails = []
def check(cond, msg):
    print(("  ✓ " if cond else "  ✗ FAIL ") + msg)
    if not cond:
        fails.append(msg)

print("== [1] sticker-manifest.json ==")
man_path = os.path.join(DIR, "sticker-manifest.json")
try:
    man = json.load(open(man_path))
    check(isinstance(man, list) and len(man) == 173, f"manifest có 173 entries (có {len(man) if isinstance(man, list) else '?'})")
    files = [m["file"] for m in man]
    check(len(set(files)) == len(files), "không trùng tên file")
    check(all(re.match(r"^[0-9a-f]{64}$", m.get("sha256", "")) for m in man), "mọi entry có sha256 hợp lệ")
    check(all(m.get("license") in ("CC-BY-4.0", "Apache-2.0") for m in man), "license chỉ CC-BY-4.0 / Apache-2.0")
    check(all(m.get("category") == "emoji" for m in man), "category = emoji")
    tw = sum(1 for m in man if m["file"].startswith("twemoji-"))
    noto = sum(1 for m in man if m["file"].startswith("noto-"))
    check(tw == 96, f"96 Twemoji (có {tw})")
    check(noto == 77, f"77 Noto (có {noto})")
except Exception as e:
    check(False, f"đọc manifest: {e}")
    man = []

print("== [2] fetch_stickers.sh ==")
sh = os.path.join(DIR, "fetch_stickers.sh")
r = subprocess.run(["bash", "-n", sh], capture_output=True)
check(r.returncode == 0, "bash -n syntax ok")
txt = open(sh).read()
n_fetch = txt.count('fetch "')
check(n_fetch == 173, f"173 lệnh fetch (có {n_fetch})")
check("sha256sum -c" in txt, "có verify SHA256")
check('PUB="../../apps/web/public/stickers"' in txt, "copy sang public/stickers")

print("== [3] PNG files ==")
from PIL import Image
n_ok = 0
for m in man:
    f = m["file"]
    pa, pb = os.path.join(DIR, f), os.path.join(PUB, f)
    if not (os.path.exists(pa) and os.path.exists(pb)):
        check(False, f"{f}: tồn tại ở assets + public")
        continue
    try:
        im = Image.open(pa); im.load()
        rgba = im.convert("RGBA")  # palette (tRNS) -> RGBA để check alpha
        assert rgba.split()[3].getbbox() is not None, "trong suốt hoàn toàn"
        assert rgba.size[0] >= 64 and rgba.size[1] >= 64, f"quá nhỏ {rgba.size}"
        h = hashlib.sha256(open(pa, "rb").read()).hexdigest()
        assert h == m["sha256"], "sha256 khớp manifest"
        n_ok += 1
    except Exception as e:
        check(False, f"{f}: {e}")
check(n_ok == 173, f"173 PNG hợp lệ + sha256 khớp ({n_ok})")

print("== [4] SOURCES.md ==")
src = open(os.path.join(REPO, "assets/SOURCES.md")).read()
missing = [m["file"] for m in man if f"`stickers/{m['file']}`" not in src]
check(not missing, f"SOURCES.md đủ 173 dòng ({len(missing)} thiếu)")

print("== [5] sticker.ts STICKER_LIBRARY ==")
ts = open(os.path.join(REPO, "packages/video-spec/src/sticker.ts")).read()
missing_ts = [m["file"] for m in man if f'"{m["file"]}"' not in ts]
check(not missing_ts, f"STICKER_LIBRARY đủ 173 entries ({len(missing_ts)} thiếu)")

print()
if fails:
    print(f"FAIL: {len(fails)} lỗi")
    sys.exit(1)
print("TẤT CẢ PASS")
