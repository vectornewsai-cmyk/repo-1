#!/usr/bin/env python3
"""J2 (dot 108): liệt kê offset thực của mọi PULL không-EXACT (đọc trực tiếp từ clip),
để so sánh splice offset giữa các mức queue2 (classifier analyze-h2.py chỉ
biết SPLICED+2MiB cố định, sẽ báo OTHER khi offset dời)."""
import sys
CLIP = "/home/hatch/workspace/round96-x1/clips-faststart/c2.mp4"
data = open(sys.argv[3] if len(sys.argv) > 3 else CLIP, "rb").read()
n_exact = n_spliced2m = n_other = n_nodata = 0
for line in open(sys.argv[1], encoding="utf-8", errors="replace"):
    p = line.split(" ")
    if not p or p[0] != "PULL":
        continue
    d = dict(x.split("=", 1) for x in p[1:] if "=" in x)
    ms = p[1] if len(p) > 1 else "?"
    try:
        ro = int(d.get("req_off", -1))
    except ValueError:
        continue
    hx = d.get("hex", "-")
    if not hx or hx == "-" or len(hx) < 32:
        n_nodata += 1
        continue
    b = bytes.fromhex(hx[:32])
    if data[ro:ro+16] == b:
        n_exact += 1
        continue
    if data[ro+2097152:ro+2097152+16] == b:
        n_spliced2m += 1
        print(f"SPLICED+2MiB ms={ms} elem={d.get('elem')} req_off={ro} actual={ro+2097152} delta=+2097152")
        continue
    hits = []
    start = 0
    while len(hits) < 5:
        i = data.find(b, start)
        if i < 0:
            break
        hits.append(i)
        start = i + 1
    n_other += 1
    print(f"OTHER ms={ms} elem={d.get('elem')} req_off={ro} actual={hits} delta={[h-ro for h in hits]}")
print(f"SUMMARY exact={n_exact} spliced+2MiB={n_spliced2m} other={n_other} nodata={n_nodata}")
