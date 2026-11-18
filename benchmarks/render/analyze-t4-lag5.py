#!/usr/bin/env python3
# Canonical copy — T3 dot 130 (unified CLI: chap nhan `tag=path` hoac duong dan tran).
# Logic phan tich GIONG HET ban round129-t4 (md5 goc round128-t4), chi khac parse argv.
# Cac dot sau copy analyzer luot yen tu benchmarks/render/ thay vi tu hidden_files.
"""Q5 dot 114 — trich chi tiet moi occurrence (b) lag >= +5f de theo doi
su kien stale-ghost P4 seq 220-223 (pixels dung yen o frame 26 ~0,42s).

Tai dung logic match cua analyze-q5-labellag.py (global match, thresh<=2
bit, strip 48px). Chi xet tick hau flip+2000ms, viaRvfc=0, ca skp=1/0.
Dung: analyze-q5-lag5.py <json> [out.txt]
In: moi occurrence (b) (|M|==1) co lag>=+5f: seq, tBlend, presented,
label, M(frame pixel-that), lag; gom nhom event theo frame M lien tuc.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

FRAMES_DIR = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round111-m5/frames-nonperiodic"


def load_frames():
    paths = [os.path.join(FRAMES_DIR, f"f{i + 1:03d}.png") for i in range(90)]
    return [np.asarray(Image.open(p).convert("RGB"), dtype=np.float32) for p in paths]


def snap_strip(src, w, h):
    small = Image.fromarray(src.astype(np.uint8)).resize((w, h), Image.BILINEAR)
    arr = np.asarray(small, dtype=np.float32)
    y = h // 2
    x0 = int(w * 0.2)
    return arr[y, x0:x0 + 48, 1].astype(int)


def bits_of(strip):
    return (np.asarray(strip) > 128).astype(int)


def decode_pix(b64):
    try:
        raw = __import__("base64").b64decode(b64)
        return np.frombuffer(raw, dtype=np.uint8).astype(int)
    except Exception:
        return None


def global_matches(bits, gb, thresh=2):
    return [f for f in range(90) if int(np.sum(bits != gb[f])) <= thresh]


def main():
    # T3 dot 130 — unified CLI: argv[1] chap nhan `tag=path` hoac duong dan
    # tran (tag chi de goi, khong doi ten file output mac dinh). Chi doi
    # interface, khong doi logic phan tich.
    if len(sys.argv) < 2:
        print("usage: analyze-t4-lag5.py [tag=]path.json [out.txt]", file=sys.stderr)
        sys.exit(2)
    _a1 = sys.argv[1]
    jpath = _a1.split("=", 1)[1] if "=" in _a1 else _a1
    if not jpath:
        print("usage: analyze-t4-lag5.py [tag=]path.json [out.txt]", file=sys.stderr)
        sys.exit(2)
    outpath = sys.argv[2] if len(sys.argv) > 2 else "lag5-detail.txt"
    L = []
    with open(jpath) as f:
        data = json.load(f)
    res = data["results"]["b"]
    flip = res.get("flip") or {}
    fwall = flip.get("wallMs")
    L.append(f"flip wallMs={fwall}")
    ticks = sorted(res["y2"]["blendTick"], key=lambda t: t.get("tBlend", 0))
    post = [t for t in ticks if t.get("viaRvfc") == 0 and t.get("tBlend", 0) >= fwall + 2000]
    srcs = load_frames()
    gt_cache = {}

    def gt_bits_for(w, h):
        key = (w, h)
        if key not in gt_cache:
            gt_cache[key] = [bits_of(snap_strip(s, w, h)) for s in srcs]
        return gt_cache[key]

    rows = []
    for skp in (1, 0):
        sub = [t for t in post if t.get("skippedLatest") == skp]
        for t in sub:
            for g in (t.get("ghostPix") or []):
                if not g or g.get("labelMs") is None or g.get("frame") is None:
                    continue
                lab = g["frame"]
                strip = decode_pix(g.get("pix"))
                if strip is None or len(strip) != 48 or lab < 0 or lab >= 90:
                    continue
                gb = gt_bits_for(g.get("w"), g.get("h"))
                M = global_matches(bits_of(strip), gb)
                if len(M) != 1:
                    continue
                lag = M[0] - lab
                if lag >= 5:
                    rows.append((t.get("seq"), t.get("tBlend"), t.get("presented"),
                                 lab, M[0], lag, skp))
    rows.sort(key=lambda r: (r[1] or 0, r[0] or 0))
    L.append(f"(b) lag>=+5f: {len(rows)} occurrence")
    L.append("seq | tBlend | presented | label | M(pixel-that) | lag | skp")
    for r in rows:
        L.append(" | ".join(str(x) for x in r))
    # gom event: cac occurrence lien tiep cung M, tBlend cach nhau <1000ms
    events = []
    for r in rows:
        if events and r[4] == events[-1][-1][4] and (r[1] or 0) - (events[-1][-1][1] or 0) < 1000:
            events[-1].append(r)
        else:
            events.append([r])
    L.append(f"event (cung M, tBlend cach <1000ms): {len(events)}")
    for i, ev in enumerate(events):
        ms = sorted({r[4] for r in ev})
        t0, t1 = ev[0][1], ev[-1][1]
        L.append(f"  event {i + 1}: {len(ev)} occ, M={ms}, "
                 f"tBlend {t0}-{t1} ({(t1 or 0) - (t0 or 0)}ms), "
                 f"presented {ev[0][2]}->{ev[-1][2]}, label {ev[0][3]}->{ev[-1][3]}, "
                 f"lag max +{max(r[5] for r in ev)}f")
    with open(outpath, "w") as f:
        f.write("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main()
