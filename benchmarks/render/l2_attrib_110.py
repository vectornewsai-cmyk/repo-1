#!/usr/bin/env python3
"""L2 (đợt 110): gán mỗi PULL splice cho playbin nào (attribution fresh-element).
Đọc pull log: L2PLAYBIN (playbin name + el ptr + ms) + L2BINADD (bin@ptr ->
child@ptr) + PULL (elem + el ptr + req_off). Đi ngược chuỗi bin-add từ
element của pull lên playbin gần nhất. Tên bin "?" (chưa đặt tên lúc add)
được suy lại từ con trỏ qua các dòng khác (cùng con trỏ, tên thật).
Usage: l2_attrib.py <pull.log> [clip.mp4]  (clip để phân loại splice như l2_offsets)"""
import sys
CLIP = "/home/hatch/workspace/round96-x1/clips-faststart/c2.mp4"
DELTAS = [1048576, 2097152, 4194304]
data = open(sys.argv[2] if len(sys.argv) > 2 else CLIP, "rb").read()

playbins = {}   # el ptr -> (ms, name)
parent = {}     # child ptr -> bin ptr
names = {}      # ptr -> tên (ưu tiên tên khác "?")
splices = []

for raw in open(sys.argv[1], encoding="utf-8", errors="replace"):
    line = raw.strip()
    if not line:
        continue
    p = line.split(" ")
    if not p:
        continue
    if p[0] == "L2PLAYBIN":
        d = dict(x.split("=", 1) for x in p[1:] if "=" in x)
        playbins[d.get("el", "?")] = (p[1], d.get("name", "?"))
        names[d.get("el", "?")] = d.get("name", "?")
    elif p[0] == "L2BINADD":
        d = dict(x.split("=", 1) for x in p[1:] if "=" in x)
        b = d.get("bin", "?")
        c = d.get("child", "?")
        if "@" in b and "@" in c:
            bname, bptr = b.rsplit("@", 1)
            cname, cptr = c.rsplit("@", 1)
            parent[cptr] = bptr
            if bname != "?":
                names[bptr] = bname
            if cname != "?":
                names[cptr] = cname
    elif p[0] == "PULL":
        d = dict(x.split("=", 1) for x in p[1:] if "=" in x)
        try:
            ro = int(d.get("req_off", -1))
        except ValueError:
            continue
        hx = d.get("hex", "-")
        if not hx or hx == "-" or len(hx) < 32:
            continue
        b = bytes.fromhex(hx[:32])
        if data[ro:ro + 16] == b:
            continue
        hit = None
        for delta in DELTAS:
            if data[ro + delta:ro + delta + 16] == b:
                hit = delta
                break
        splices.append((p[1], d.get("elem"), d.get("el"), ro, hit))

print(f"PLAYBINS ({len(playbins)}):")
for ptr, (ms, name) in sorted(playbins.items(), key=lambda kv: int(kv[1][0])):
    print(f"  ms={ms} {name} el={ptr}")
print(f"BINADD edges: {len(parent)}")
print(f"SPLICED PULLS ({len(splices)}):")
for ms, elem, el, ro, hit in splices:
    chain = [f"{elem}@{el}"]
    cur = el
    seen = set()
    pb = None
    while cur in parent and cur not in seen:
        seen.add(cur)
        bptr = parent[cur]
        chain.append(f"{names.get(bptr, '?')}@{bptr}")
        if bptr in playbins:
            pb = (bptr, playbins[bptr])
            break
        cur = bptr
    pb_txt = f"{pb[1][1]} (tạo ms={pb[1][0]})" if pb else "KHÔNG GÁN ĐƯỢC"
    print(f"  ms={ms} elem={elem} req_off={ro} delta=+{hit} -> {pb_txt} | chain: {' <- '.join(chain)}")
