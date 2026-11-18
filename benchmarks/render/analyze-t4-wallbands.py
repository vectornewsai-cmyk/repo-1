#!/usr/bin/env python3
# Canonical copy — T3 dot 130 (unified CLI: chap nhan `tag=path` hoac duong dan tran).
# Logic phan tich GIONG HET ban round129-t4 (md5 goc round128-t4), chi khac parse argv.
# Cac dot sau copy analyzer luot yen tu benchmarks/render/ thay vi tu hidden_files.
"""Q5 dot 114 — phan ra tickCost theo dai wallMs (DANG KY TRUOC trong prereg-q5).

Dai: 0-20k / 20-32k / 32-45k / 45-62k / 62-70k / 70-80k (giong P4 §1.3).
Dung: analyze-q5-wallbands.py <json> [<json> ...]
In moi dai: n / median / p90; them median hau flip+2000ms va toan luot.
"""
import json
import os
import sys

import numpy as np

BANDS = [(0, 20000), (20000, 32000), (32000, 45000),
         (45000, 62000), (62000, 70000), (70000, 80000)]


def pct(a, q):
    return float(np.percentile(a, q)) if len(a) else float("nan")


def _parse_input_arg(a):
    """T3 dot 130 — unified CLI: chap nhan `tag=path` hoac duong dan tran.
    Duong dan tran -> tag = ten file (bo .json). Chi doi interface, khong doi logic."""
    if "=" in a:
        tag, path = a.split("=", 1)
    else:
        path = a
        tag = os.path.basename(path)
        if tag.endswith(".json"):
            tag = tag[:-5]
    if not path:
        print("usage: analyze-t4-wallbands.py [tag=]path.json ...", file=sys.stderr)
        sys.exit(2)
    return tag, path


def summ(tag, path):
    with open(path) as f:
        d = json.load(f)
    res = d["results"]["b"]
    tc = res["y2"].get("tickCost") or []
    tot = [(t.get("wallMs", 0), t["total"]) for t in tc
           if isinstance(t.get("total"), (int, float))]
    flip = (res.get("flip") or {}).get("wallMs")
    print(f"== {tag}: {path} flipWallMs={flip}")
    allv = [v for _, v in tot]
    print(f"  TOAN LUOT n={len(allv)} median={np.median(allv):.1f} "
          f"p90={pct(allv, 90):.1f} max={max(allv)} min={min(allv)}")
    if flip is not None:
        post = [v for w, v in tot if w >= flip + 2000]
        print(f"  HAU FLIP+2000ms n={len(post)} median={np.median(post):.1f} "
              f"p90={pct(post, 90):.1f}")
    for lo, hi in BANDS:
        band = [v for w, v in tot if lo <= w < hi]
        if band:
            print(f"  wallMs {lo // 1000}-{hi // 1000}k n={len(band)} "
                  f"median={np.median(band):.1f} p90={pct(band, 90):.1f} "
                  f"max={max(band)} min={min(band)}")
        else:
            print(f"  wallMs {lo // 1000}-{hi // 1000}k n=0")


if __name__ == "__main__":
    for a in sys.argv[1:]:
        tag, path = _parse_input_arg(a)
        summ(tag, path)
