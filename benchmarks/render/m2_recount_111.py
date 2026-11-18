#!/usr/bin/env python3
"""M2 (dot 111): recount doc lap so lieu pull log — khong import script L2.
Doc truc tiep byte clip: moi dong PULL co req_off + hex (16 byte dau).
- EXACT: 16 byte dau tai req_off khop clip.
- SPLICED+<delta>: 16 byte dau tai req_off+delta khop (delta ung vien:
  1048576, 2097152, 4194304, 8388608).
- OTHER: khong khop dau — search toan file (toi da 5 hit).
- NODATA: hex thieu/ngan (khong ket luan duoc).
In moi pull SPLICED/OTHER + SUMMARY. Con dem APUSH (tong byte adapter
push, de tinh so flood) va last-pull ms tu dong PULL.
Usage: m2_recount_111.py <pull.log> <clip.mp4> [--after-ms N]
  --after-ms N: chi dem SPLICED/OTHER co ms >= N (de tach pull sau seek)."""
import sys

CLIP = "/home/hatch/workspace/round96-x1/clips-faststart/c8.mp4"
DELTAS = [1048576, 2097152, 4194304, 8388608]

args = sys.argv[1:]
after_ms = None
if "--after-ms" in args:
    i = args.index("--after-ms")
    after_ms = int(args[i + 1])
    del args[i:i + 2]
pull_log = args[0]
clip_path = args[1] if len(args) > 1 else CLIP
data = open(clip_path, "rb").read()

counts = {"exact": 0, "nodata": 0, "other": 0}
for d in DELTAS:
    counts[f"spliced+{d}"] = 0
counts_after = dict(counts)
apush_total = 0
apush_n = 0
last_pull_ms = None
first_pull_ms = None
spliced_list = []

for line in open(pull_log, encoding="utf-8", errors="replace"):
    p = line.split(" ")
    if not p:
        continue
    if p[0] == "APUSH":
        d = dict(x.split("=", 1) for x in p[1:] if "=" in x)
        try:
            apush_total += int(d.get("size", 0))
            apush_n += 1
        except ValueError:
            pass
        continue
    if p[0] != "PULL":
        continue
    d = dict(x.split("=", 1) for x in p[1:] if "=" in x)
    try:
        ms = int(p[1])
    except (ValueError, IndexError):
        ms = -1
    if first_pull_ms is None:
        first_pull_ms = ms
    last_pull_ms = ms
    try:
        ro = int(d.get("req_off", -1))
    except ValueError:
        continue
    hx = d.get("hex", "-")
    if not hx or hx == "-" or len(hx) < 32:
        counts["nodata"] += 1
        if after_ms is not None and ms >= after_ms:
            counts_after["nodata"] += 1
        continue
    b = bytes.fromhex(hx[:32])
    if data[ro:ro + 16] == b:
        counts["exact"] += 1
        if after_ms is not None and ms >= after_ms:
            counts_after["exact"] += 1
        continue
    hit = None
    for delta in DELTAS:
        if data[ro + delta:ro + delta + 16] == b:
            hit = delta
            break
    if hit is not None:
        counts[f"spliced+{hit}"] += 1
        if after_ms is not None and ms >= after_ms:
            counts_after[f"spliced+{hit}"] += 1
        spliced_list.append((ms, d.get("elem"), d.get("el"), ro, hit))
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
    if after_ms is not None and ms >= after_ms:
        counts_after["other"] += 1
    print(f"OTHER ms={ms} elem={d.get('elem')} el={d.get('el')} req_off={ro} actual={hits} delta={[h-ro for h in hits]}")

print("SUMMARY " + " ".join(f"{k}={v}" for k, v in counts.items()))
if after_ms is not None:
    print(f"SUMMARY-AFTER-{after_ms}ms " + " ".join(f"{k}={v}" for k, v in counts_after.items()))
print(f"APUSH total={apush_total} n={apush_n} floods~={apush_total / len(data):.2f} first_pull_ms={first_pull_ms} last_pull_ms={last_pull_ms}")
print(f"SPLICED req_offs={[s[3] for s in spliced_list]} deltas={[s[4] for s in spliced_list]}")
