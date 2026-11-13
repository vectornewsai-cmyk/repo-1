#!/usr/bin/env python3
"""Pooled frame-parity analysis cho W3 (đợt 95).
Khớp đúng (clip, frameIdx) giữa mọi cặp run cùng config; báo:
- n matched, n exact (MAD < 1), MAD mean/median/p90
- phân bố shift cột (profile cột dịch nguyên -3..+3): 0 = cùng pha,
  +/-1..2 = jitter vị trí/resample dưới pixel (đã thấy ở chr x chr).
Loại frameIdx >= 90 và prefix stale-biên (giống analyzer).
Chạy: python3 pool95w3.py <tag...> (tag = thư mục round95-w3/<tag>)
"""
import json, sys, os
import numpy as np
from collections import Counter

BASE = os.path.expanduser("~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w3")

def load(tag):
    r = json.load(open(os.path.join(BASE, tag, "frame-parity-results.json")))
    caps = {}
    # dropStale giống analyzer: prefix stale <=3 capture đầu, biên độ >20
    byclip = {}
    for c in r["caps"]:
        byclip.setdefault(c["clip"], []).append(c)
    for clip, seq in byclip.items():
        start = 0
        for i in range(1, min(4, len(seq))):
            if seq[i]["frameIdx"] < seq[i - 1]["frameIdx"] and seq[i - 1]["frameIdx"] - seq[i]["frameIdx"] > 20:
                start = i
                break
        last = -1
        for c in seq[start:]:
            if c["frameIdx"] < last:
                continue
            last = c["frameIdx"]
            if 0 <= c["frameIdx"] <= 89:
                caps[c["key"]] = c
    return r, caps

def prof(px):
    return np.array(px, dtype=float).reshape(54, 96).mean(axis=0)

def best_shift(pa, pb):
    best = (1e18, 0)
    for s in range(-3, 4):
        m = float(np.mean(np.abs(pa - np.roll(pb, s))))
        if m < best[0]:
            best = (m, s)
    return best

def pair_stats(ra, ca, rb, cb):
    keys = sorted(set(ca) & set(cb))
    mads, exact, shifts = [], 0, Counter()
    mads_best, near = [], 0
    win_match, win_tot = 0, 0
    for k in keys:
        a, b = ca[k], cb[k]
        pa = np.array(a["px"], dtype=float).reshape(54, 96)
        pb = np.array(b["px"], dtype=float).reshape(54, 96)
        m = float(np.mean(np.abs(pa - pb)))
        mads.append(m)
        if m < 1:
            exact += 1
        if m < 5:
            near += 1
        mb, s = best_shift(pa.mean(axis=0), pb.mean(axis=0))
        mads_best.append(mb)
        shifts[s] += 1
        wa, wb = a.get("dbg", {}).get(a["clip"], {}), b.get("dbg", {}).get(b["clip"], {})
        if wa.get("lastDrawnLast") is not None and wb.get("lastDrawnLast") is not None:
            win_tot += 1
            if wa["lastDrawnLast"] == wb["lastDrawnLast"] and wa["lastDrawnPrev"] == wb["lastDrawnPrev"]:
                win_match += 1
    mads = np.array(mads) if mads else np.array([0.0])
    mads_best = np.array(mads_best) if mads_best else np.array([0.0])
    return dict(n=len(keys), exact=exact, near=near,
                mean=round(float(np.mean(mads)), 2), median=round(float(np.median(mads)), 2),
                p90=round(float(np.quantile(mads, 0.9)), 2), mx=round(float(np.max(mads)), 2),
                best_mean=round(float(np.mean(mads_best)), 2), best_med=round(float(np.median(mads_best)), 2),
                shifts=dict(sorted(shifts.items())), win=f"{win_match}/{win_tot}")

tags = sys.argv[1:]
runs = {t: load(t) for t in tags}
for t, (r, _) in runs.items():
    print(f"run {t}: {r['engine']} {r['config']} caps={r['nCaps']} tagAgree={r.get('tagAgree')}/{r.get('tagBoth')} mtimeChanged={r['mtimeChangedMidRun']}")
print()
for i, a in enumerate(tags):
    for b in tags[i + 1:]:
        ra, ca = runs[a]
        rb, cb = runs[b]
        kind = ("chr-chr" if ra["engine"] == rb["engine"] == "chromium" else
                "wk-wk" if ra["engine"] == rb["engine"] == "webkit" else "chr-wk")
        s = pair_stats(ra, ca, rb, cb)
        print(f"{kind} {a} vs {b}: matched={s['n']} exact(MAD<1)={s['exact']} near(MAD<5)={s['near']} MAD mean={s['mean']} med={s['median']} p90={s['p90']} max={s['mx']} | bestShiftMAD mean={s['best_mean']} med={s['best_med']} shifts={s['shifts']} winMatch={s['win']}")
