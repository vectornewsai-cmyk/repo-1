#!/usr/bin/env python3
"""analyze-f2.py v2 — Phase 9 đợt 104, luồng F2 (VCut Studio).

Phân tích dump f2_adapter_probe.so (v1/v2) của 1 run:
 - Phân loại PULL (qtdemux/typefind) EXACT / SPLICED+2MiB / OTHER.
 - Tái dựng FIFO cho MỌI adapter (APUSH refill + ATAKE/ATAKEB/AGETB
   + AMAP/AUNMAP/AFLUSH/ACLEAR): mỗi event chỉ có 16 byte đầu ->
   tra file offset bằng bytes.find (C-speed). Kiểm tra tính liên tục
   của luồng take/map trên từng adapter.
 - Đối chiếu pull bị splice: tìm event adapter (map/take) cùng pid
   trong cửa sổ ±3 ms quanh pull đó, và push nào đã cung cấp byte đó
   (mô phỏng FIFO: segment nào còn trong hàng đợi).
 - Thống kê "vì sao 2.097.152": tổng push/take tại thời điểm splice,
   bội số 4096, vị trí đọc adapter vs vị trí logic.

Dùng: python3 analyze-f2.py <pull.log> [gst.log] [clip.mp4]
"""
import sys, os, re
from collections import defaultdict, Counter, deque

CLIP = "/home/hatch/workspace/round96-x1/clips-faststart/c2.mp4"
TWOMIB = 2097152

def load_clip(path):
    with open(path, "rb") as f:
        return f.read()

def find_all(data, b, cap=5):
    out = []
    start = 0
    while len(out) < cap:
        i = data.find(b, start)
        if i < 0:
            break
        out.append(i)
        start = i + 1
    return out

def parse(path):
    evs = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line:
                continue
            parts = line.split(" ")
            kind = parts[0]
            d = {"kind": kind, "raw": line}
            for p in parts[1:]:
                if "=" in p:
                    k, v = p.split("=", 1)
                    d[k] = v
            try:
                d["ms"] = int(parts[1]) if kind not in ("F2PROBE", "F2CAP") else 0
            except Exception:
                d["ms"] = 0
            evs.append(d)
    return evs

def cls_pull(data, hexfield, req_off):
    if not hexfield or hexfield == "-" or len(hexfield) < 32:
        return "NODATA"
    b = bytes.fromhex(hexfield[:32])
    if data[req_off:req_off+16] == b:
        return "EXACT"
    if data[req_off+TWOMIB:req_off+TWOMIB+16] == b:
        return "SPLICED+2MiB"
    return "OTHER"

def off_of(data, hex16):
    if not hex16 or hex16 == "-" or len(hex16) < 32:
        return None
    try:
        b = bytes.fromhex(hex16)
    except ValueError:
        return None
    hits = find_all(data, b)
    if len(hits) == 1:
        return hits[0]
    return hits if hits else None

def main():
    pull_log = sys.argv[1]
    gst_log = sys.argv[2] if len(sys.argv) > 2 else None
    clip = sys.argv[3] if len(sys.argv) > 3 else CLIP
    data = load_clip(clip)
    evs = parse(pull_log)
    print(f"== {os.path.basename(pull_log)}: {len(evs)} dòng, clip {len(data)} B ==")

    # ---- 1. PULL classification ----
    pulls = [e for e in evs if e["kind"] == "PULL"]
    pc = Counter()
    spliced = []
    for p in pulls:
        try:
            ro = int(p.get("req_off", -1))
        except Exception:
            continue
        c = cls_pull(data, p.get("hex", "-"), ro)
        pc[(p.get("elem", "?"), c)] += 1
        if c == "SPLICED+2MiB":
            spliced.append(p)
    print(f"-- PULL: {len(pulls)} --")
    for (elem, c), n in sorted(pc.items()):
        print(f"   {elem}: {c} x{n}")
    print(f"   BOGUS RUN: {'YES' if spliced else 'NO'} ({len(spliced)} spliced pulls)")
    for p in spliced[:8]:
        print(f"   SPLICED ms={p['ms']} pid={p.get('pid')} {p.get('elem')} req_off={p.get('req_off')} size={p.get('req_size')} hex={p.get('hex','')[:32]}")

    # ---- 2. Adapter inventory ----
    kinds = ["APUSH", "ATAKE", "ATAKEB", "AGETB", "AMAP", "AUNMAP", "ACOPY", "ACLEAR", "AFLUSH", "APEEK"]
    for kind in kinds:
        sub = [e for e in evs if e["kind"] == kind]
        if not sub:
            continue
        cc = Counter(e.get("caller", "?") for e in sub)
        print(f"-- {kind}: {len(sub)} | caller: {dict(cc)}")
    adap_push = defaultdict(list)
    adap_read = defaultdict(list)  # take/map/get/copy (đọc ra)
    adap_clear = defaultdict(list)
    for e in evs:
        a = e.get("adap")
        if not a:
            continue
        if e["kind"] == "APUSH":
            adap_push[a].append(e)
        elif e["kind"] in ("ATAKE", "ATAKEB", "AGETB", "AMAP", "ACOPY"):
            adap_read[a].append(e)
        elif e["kind"] in ("ACLEAR", "AFLUSH"):
            adap_clear[a].append(e)
    wk_adaps = sorted(a for a, ps in adap_push.items()
                      if any(p.get("caller", "").startswith("libwebkitgtk") for p in ps))
    print(f"-- adapter webkitwebsrc (push từ libwebkitgtk): {wk_adaps}")
    all_adaps = sorted(set(list(adap_push) + list(adap_read)))
    print(f"-- tất cả adapter: {all_adaps}")

    # ---- 3. FIFO + continuity per adapter (chỉ tóm tắt + điểm lạ) ----
    for a in all_adaps:
        pushes = sorted(adap_push[a], key=lambda e: e["ms"])
        reads = sorted(adap_read[a], key=lambda e: e["ms"])
        clears = sorted(adap_clear[a], key=lambda e: e["ms"])
        callers_p = Counter(p.get("caller", "?") for p in pushes)
        callers_r = Counter(r.get("caller", "?") for r in reads)
        tl = []
        for i, p in enumerate(pushes):
            tl.append((p["ms"], 0, "PUSH", i, p))
        for i, t in enumerate(reads):
            tl.append((t["ms"], 1, "READ", i, t))
        for i, c in enumerate(clears):
            tl.append((c["ms"], 2, "CLEAR", i, c))
        tl.sort(key=lambda x: (x[0], x[1]))
        q = deque()
        total_pushed = 0
        total_read = 0
        prev_end = None
        discs = []
        push_detail = []
        for ms, _, typ, i, e in tl:
            if typ == "PUSH":
                try:
                    sz = int(e.get("size", 0))
                except Exception:
                    sz = 0
                total_pushed += sz
                fo = off_of(data, e.get("hex16", ""))
                q.append([i, fo, sz, ms])
                push_detail.append((ms, i, sz, fo))
            elif typ == "CLEAR":
                if e["kind"] == "AFLUSH":
                    # flush chỉ bỏ N byte đầu, không xóa hết
                    try:
                        fl = int(e.get("flush", 0))
                    except Exception:
                        fl = 0
                    need = fl
                    while need > 0 and q:
                        seg = q[0]
                        tn = min(need, seg[2])
                        seg[2] -= tn
                        need -= tn
                        if seg[2] == 0:
                            q.popleft()
                    if isinstance(prev_end, int):
                        prev_end = prev_end + fl
                else:
                    q.clear()
                    prev_end = None
            else:
                got = 0
                try:
                    got = int(e.get("got", e.get("req", 0)) or 0)
                except Exception:
                    got = 0
                is_map = e["kind"] == "AMAP"
                if is_map:
                    try:
                        got = int(e.get("req", 0))
                    except Exception:
                        got = 0
                total_read += got
                fo = off_of(data, e.get("hex16", ""))
                if isinstance(fo, int) and prev_end is not None and fo != prev_end:
                    discs.append((ms, e["kind"], i, fo, prev_end, fo - prev_end))
                if isinstance(fo, int) and not is_map:
                    prev_end = fo + got
                elif isinstance(fo, int) and is_map:
                    # map là peek (không tiêu thụ): chỉ ghi nhận vị trí
                    # peek, không dời prev_end của luồng take
                    pass
                need = 0 if is_map else got
                consumed = []
                while need > 0 and q:
                    seg = q[0]
                    tn = min(need, seg[2])
                    consumed.append((seg[0], seg[1], tn))
                    seg[2] -= tn
                    need -= tn
                    if seg[2] == 0:
                        q.popleft()
                e["_consumed"] = consumed
                e["_file_off"] = fo
        print(f"\n== adapter {a}: push {len(pushes)} {dict(callers_p)} | read {len(reads)} {dict(callers_r)} | clear {len(clears)}")
        print(f"   pushed={total_pushed} read={total_read} discontinuities={len(discs)}")
        for ms, i, sz, fo in push_detail:
            print(f"   PUSH#{i} ms={ms} size={sz} file_off={fo}")
        for d in discs[:10]:
            print(f"   <<< DISC ms={d[0]} {d[1]}#{d[2]} file_off={d[3]} prev_end={d[4]} jump={d[5]:+d}")

    # ---- 4. Đối chiếu từng pull splice với event adapter cùng ms ----
    print("\n== ĐỐI CHIẾU PULL SPLICE ==")
    reads_by_ms = defaultdict(list)
    for e in evs:
        if e["kind"] in ("ATAKE", "ATAKEB", "AGETB", "AMAP", "ACOPY") and e.get("adap"):
            reads_by_ms[(e.get("pid"), e["ms"])].append(e)
    for p in spliced[:8]:
        ms = p["ms"]
        pid = p.get("pid")
        print(f"-- spliced PULL ms={ms} pid={pid} {p.get('elem')} req_off={p.get('req_off')} size={p.get('req_size')}")
        found = False
        for dm in (-2, -1, 0, 1, 2, 3):
            for e in reads_by_ms.get((pid, ms + dm), []):
                fo = e.get("_file_off", off_of(data, e.get("hex16", "")))
                cons = e.get("_consumed", "?")
                print(f"   {e['kind']} ms={e['ms']} adap={e.get('adap')} caller={e.get('caller')} req={e.get('req')} got={e.get('got')} file_off={fo} from_pushes={cons}")
                found = True
        if not found:
            print("   (không có event đọc adapter nào trong ±3 ms — byte đến từ cache/adapter nội bộ của typefind, không qua take/map lúc đó)")

    # ---- 5. GST log ----
    if gst_log and os.path.exists(gst_log):
        txt = open(gst_log, encoding="utf-8", errors="replace").read()
        print(f"-- GST {os.path.basename(gst_log)}: bogus={txt.count('bogus size')} "
              f"already-active={txt.count('download already active')} "
              f"stopping={len(re.findall(r': stopping download', txt))} "
              f"restarting={len(re.findall(r': restarting download', txt))}")

if __name__ == "__main__":
    main()
