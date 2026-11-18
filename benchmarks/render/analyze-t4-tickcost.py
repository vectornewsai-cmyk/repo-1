#!/usr/bin/env python3
# Canonical copy — T3 dot 130 (unified CLI: chap nhan `tag=path` hoac duong dan tran).
# Logic phan tich GIONG HET ban round129-t4 (md5 goc round128-t4), chi khac parse argv.
# Cac dot sau copy analyzer luot yen tu benchmarks/render/ thay vi tu hidden_files.
"""M5 dot 111 — tom tat tickCost / tBlend / khung rAF moi luot + so sanh cac luot.

Dung: analyze-m5-tickcost.py <nhan=json> [<nhan=json> ...]
In: tickCost.total median/p90/max/min/n (toan luot + hau flip),
tBlend gap median/p90 (tu blendTick), khung rAF/pass, BlendTick/pass.
De hieu chuan nguong WebKit (prereg-m5 muc 2).
"""
import json
import os
import sys

import numpy as np


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
        print("usage: analyze-t4-tickcost.py [tag=]path.json ...", file=sys.stderr)
        sys.exit(2)
    return tag, path


def pct(a, q):
    return float(np.percentile(a, q)) if len(a) else float("nan")


def summ(tag, path):
    with open(path) as f:
        d = json.load(f)
    res = d["results"]["b"]
    tc = res["y2"].get("tickCost") or []
    tot = [t["total"] for t in tc if isinstance(t.get("total"), (int, float))]
    flip = (res.get("flip") or {}).get("wallMs")
    tot_post = [t["total"] for t in tc
                if isinstance(t.get("total"), (int, float))
                and flip is not None and t.get("wallMs", 0) >= flip + 2000]
    ticks = sorted(res["y2"]["blendTick"], key=lambda t: t.get("tBlend", 0))
    gaps = [ticks[i + 1]["tBlend"] - ticks[i]["tBlend"]
            for i in range(len(ticks) - 1)
            if ticks[i + 1].get("tBlend") and ticks[i].get("tBlend")]
    frames = [len(p) for p in res["passes"]]
    print(f"== {tag}: {path}")
    print(f"  tickCost total n={len(tot)} median={np.median(tot):.1f} "
          f"p90={pct(tot, 90):.1f} max={max(tot)} min={min(tot)} "
          f"| hau flip+2000ms n={len(tot_post)} median="
          f"{np.median(tot_post) if tot_post else float('nan'):.1f}")
    print(f"  tBlend gap n={len(gaps)} median={np.median(gaps):.1f} "
          f"p90={pct(gaps, 90):.1f} max={max(gaps) if gaps else None}")
    print(f"  BlendTick/pass={len(ticks) / max(1, len(res['passes'])):.1f} "
          f"rAF/pass median={np.median(frames):.0f} min={min(frames)} max={max(frames)}")
    print(f"  webkit={d.get('webkitVersion')} pageErrs={d.get('pageErrs')}")


if __name__ == "__main__":
    for a in sys.argv[1:]:
        tag, path = _parse_input_arg(a)
        summ(tag, path)
