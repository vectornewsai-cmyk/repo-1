#!/usr/bin/env python3
"""Dot 101 C2 — phan tich flip-protocol: gap presented-expected hau flip.

Cau hoi (dang ky truoc): sau khi tat rVFC giua run (pump chet, metadata
trinh chieu dong bang), presentedFrameIndex ngoai suy co giu duoc trong
+-3 so voi expected (frameIdx tu currentTime) qua cac seek khong?
- Neu gap van trong +-3 qua cac seek -> claim "nguoi suy chet o seek dau"
  SAI; fix nhan theo presented estimate don gian van kha thi.
- Neu gap phan ky >3 va tiep tuc tang sau seek dau tien -> claim DUNG;
  fix don gian chet, chi con huong tap rVFC doc lap.
Bonus: ti le mislabel cua snapshot duong tick hau flip (baseline cho A/B tap).
"""
import json
import math
import os
import sys
from collections import Counter

import numpy as np
from PIL import Image

SCRATCH = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round106-h5"
FRAMES_DIR = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round97-y2/frames-stripes"
FPS = 30


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


def match_set(bits, gt_bits, label, span=3, thresh=2):
    good = set()
    for f in range(max(0, label - span), min(89, label + span) + 1):
        if int(np.sum(bits != gt_bits[f])) <= thresh:
            good.add(f)
    return good


def decode_pix(b64):
    try:
        raw = __import__("base64").b64decode(b64)
        return np.frombuffer(raw, dtype=np.uint8).astype(int)
    except Exception:
        return None


def signed_off(d):
    return {0: 0, 1: 1, 2: 2, 3: -2, 4: -1}[d % 5]


def main():
    jpath = sys.argv[1]
    outpath = sys.argv[2] if len(sys.argv) > 2 else os.path.join(SCRATCH, "analyze-c2-flip.txt")
    L = []
    out = L.append
    with open(jpath) as f:
        data = json.load(f)
    res = data["results"]["b"]
    flip = res.get("flip") or {}
    fwall = flip.get("wallMs")
    out("=== C2 flip-protocol: gap presented-expected hau flip ===")
    out(f"flip afterPass={flip.get('afterPass')} wallMs={fwall}")
    ticks = sorted(res["y2"]["blendTick"], key=lambda t: t.get("tBlend", 0))
    out(f"blendTick: {len(ticks)}")
    if fwall is None:
        out("KHONG CO FLIP (wallMs null) — khong phan tich duoc")
        with open(outpath, "w") as f:
            f.write("\n".join(L) + "\n")
        print("\n".join(L))
        return
    pre = [t for t in ticks if t.get("tBlend", 0) < fwall]
    post = [t for t in ticks if t.get("tBlend", 0) >= fwall]
    out(f"tick truoc flip: {len(pre)} (viaRvfc=1: {sum(1 for t in pre if t.get('viaRvfc') == 1)}); "
        f"sau flip: {len(post)} (viaRvfc=1: {sum(1 for t in post if t.get('viaRvfc') == 1)}, viaRvfc=0: {sum(1 for t in post if t.get('viaRvfc') == 0)})")
    # gap = presented - expected theo thoi gian hau flip
    gaps = [(t.get("tBlend") - fwall, t.get("presented") - t.get("expected"), t.get("expected")) for t in post
            if isinstance(t.get("presented"), (int, float)) and isinstance(t.get("expected"), (int, float))]
    out(f"tick hau flip co gap: {len(gaps)}")
    for lo, hi in [(0, 2000), (2000, 5000), (5000, 15000), (15000, 1e12)]:
        b = [g for (dt, g, e) in gaps if lo <= dt < hi]
        if not b:
            continue
        within = sum(1 for g in b if abs(g) <= 3)
        out(f"  hau flip [{lo},{hi})ms: n={len(b)} gap trung vi {float(np.median(b)):.1f} min {min(b)} max {max(b)} |gap|<=3: {within}/{len(b)} ({100.0 * within / len(b):.0f}%)")
    # seek hau flip: expected tut lu > 20; gap ngay truoc/sau moi seek
    out("seek hau flip (expected reset) va gap quanh seek:")
    prev_e = None
    for (dt, g, e) in gaps:
        if prev_e is not None and e < prev_e - 20:
            out(f"  seek tai +{dt:.0f}ms: expected {prev_e}->{e}, gap tai seek = {g}")
        prev_e = e
    # gap o 10 tick dau hau flip vs 10 tick cuoi
    if len(gaps) >= 20:
        out(f"10 gap dau hau flip: {[g for _, g, _ in gaps[:10]]}")
        out(f"10 gap cuoi: {[g for _, g, _ in gaps[-10:]]}")
    # bonus: mislabel snapshot duong tick hau flip+2000ms (baseline A/B tap)
    srcs = load_frames()
    gt_cache = {}

    def gt_bits_for(w, h):
        key = (w, h)
        if key not in gt_cache:
            gt_cache[key] = [bits_of(snap_strip(s, w, h)) for s in srcs]
        return gt_cache[key]

    seen = {}
    for t in post:
        if t.get("viaRvfc") != 0:
            continue
        if t.get("tBlend", 0) < fwall + 2000:
            continue
        for g in (t.get("ghostPix") or []):
            if not g or g.get("labelMs") is None:
                continue
            # Đợt 106 H5: dedup theo (label, pix, labelSrc) — sửa artifact
            # G1 §3.2 (dedup cũ theo (label, pix) gán sai labelSrc).
            key = (g.get("frame"), g.get("pix"), g.get("labelSrc") or "?")
            if key not in seen:
                seen[key] = (t, g)
    rows = []
    for (lab, _pix, _src), (t, g) in seen.items():
        strip = decode_pix(g.get("pix"))
        if strip is None or len(strip) != 48 or lab is None or lab < 0:
            continue
        gb = gt_bits_for(g.get("w"), g.get("h"))
        good = match_set(bits_of(strip), gb, lab)
        if not good:
            cls, true_res = "nomatch", None
        elif lab in good:
            cls, true_res = "clean", lab % 5
        else:
            res = {f % 5 for f in good}
            cls, true_res = ("mislabeled", next(iter(res))) if len(res) == 1 else ("ambiguous", None)
        rows.append({"label": lab, "cls": cls, "trueRes": true_res, "anchor": t.get("anchorSrc") or "?", "labelSrc": g.get("labelSrc") or "?"})
    det = [r for r in rows if r["cls"] in ("clean", "mislabeled")]
    for src in ("pump", "tap", "frameIdx", "?"):
        sub = [r for r in det if r["anchor"] == src]
        if not sub:
            continue
        cl = sum(1 for r in sub if r["cls"] == "clean")
        out(f"  anchor={src} (hau flip+2000ms): n={len(sub)} clean {cl}/{len(sub)} ({100.0 * cl / len(sub):.1f}%)")
    for src in ("tap", "pump", "rawAnchor", "frameIdx", "off", "?"):
        sub = [r for r in det if r["labelSrc"] == src]
        if not sub:
            continue
        cl = sum(1 for r in sub if r["cls"] == "clean")
        out(f"  F3 labelSrc={src} (hau flip+2000ms): n={len(sub)} clean {cl}/{len(sub)} ({100.0 * cl / len(sub):.1f}%)")
    out(f"bonus — snapshot duong tick hau flip+2000ms: distinct {len(rows)} phan loai {dict(Counter(r['cls'] for r in rows))}; "
        f"don-nghia n={len(det)}, clean {sum(1 for r in det if r['cls'] == 'clean')}/{len(det)} "
        f"({100.0 * sum(1 for r in det if r['cls'] == 'clean') / max(1, len(det)):.1f}%) — baseline cho A/B tap sau nay")
    # --- H5: bonus moi occurrence (khong dedup) — doi chieu breakdown ---
    rows_all = []
    for t in post:
        if t.get("viaRvfc") != 0:
            continue
        if t.get("tBlend", 0) < fwall + 2000:
            continue
        for g in (t.get("ghostPix") or []):
            if not g or g.get("labelMs") is None:
                continue
            lab = g.get("frame")
            strip = decode_pix(g.get("pix"))
            if strip is None or len(strip) != 48 or lab is None or lab < 0:
                continue
            gb = gt_bits_for(g.get("w"), g.get("h"))
            good = match_set(bits_of(strip), gb, lab)
            if not good:
                cls, true_res = "nomatch", None
            elif lab in good:
                cls, true_res = "clean", lab % 5
            else:
                res = {f % 5 for f in good}
                cls, true_res = ("mislabeled", next(iter(res))) if len(res) == 1 else ("ambiguous", None)
            rows_all.append({"label": lab, "cls": cls, "trueRes": true_res, "labelSrc": g.get("labelSrc") or "?"})
    det_all = [r for r in rows_all if r["cls"] in ("clean", "mislabeled")]
    out(f"H5 bonus ALL-OCCURRENCES hau flip+2000ms: n={len(rows_all)} phan loai {dict(Counter(r['cls'] for r in rows_all))}; "
        f"don-nghia n={len(det_all)}, clean {sum(1 for r in det_all if r['cls'] == 'clean')}/{len(det_all)} "
        f"({100.0 * sum(1 for r in det_all if r['cls'] == 'clean') / max(1, len(det_all)):.1f}%)")
    for src in ("tap", "pump", "rawAnchor", "frameIdx", "off", "?"):
        sub = [r for r in det_all if r["labelSrc"] == src]
        if not sub:
            continue
        cl = sum(1 for r in sub if r["cls"] == "clean")
        out(f"  ALL F3 labelSrc={src} (hau flip+2000ms): n={len(sub)} clean {cl}/{len(sub)} ({100.0 * cl / len(sub):.1f}%)")
    with open(outpath, "w") as f:
        f.write("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main()
