#!/usr/bin/env python3
"""L2 (đợt 110): liệt kê offset thực của mọi PULL không-EXACT (đọc trực tiếp từ clip).
Tổng quát hoá k2_offsets_109.py: kiểm tra các delta ứng viên +1.048.576 /
+2.097.152 / +4.194.304 (tách biến + dự đoán ring 4 MiB) rồi mới search toàn file.
Usage: l2_offsets_110.py <pull.log> [clip.mp4]"""
import sys
CLIP = "/home/hatch/workspace/round96-x1/clips-faststart/c2.mp4"
DELTAS = [1048576, 2097152, 4194304]
data = open(sys.argv[2] if len(sys.argv) > 2 else CLIP, "rb").read()
counts = {"exact": 0, "nodata": 0}
for d in DELTAS:
    counts[f"spliced+{d}"] = 0
counts["other"] = 0
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
        counts["nodata"] += 1
        continue
    b = bytes.fromhex(hx[:32])
    if data[ro:ro + 16] == b:
        counts["exact"] += 1
        continue
    hit = None
    for delta in DELTAS:
        if data[ro + delta:ro + delta + 16] == b:
            hit = delta
            break
    if hit is not None:
        counts[f"spliced+{hit}"] += 1
        print(f"SPLICED+{hit} ms={ms} elem={d.get('elem')} el={d.get('el')} req_off={ro} actual={ro+hit} delta=+{hit}")
        continue
    hits = []
    start = 0
    while len(hits) < 5:
        i = data.find(b, start)
        if i < 0:
            break
        hits.append(i)
        start = i + 1
    counts["other"] += 1
    print(f"OTHER ms={ms} elem={d.get('elem')} el={d.get('el')} req_off={ro} actual={hits} delta={[h-ro for h in hits]}")
print("SUMMARY " + " ".join(f"{k}={v}" for k, v in counts.items()))
