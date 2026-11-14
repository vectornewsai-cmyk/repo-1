#!/usr/bin/env python3
"""Dot 101 C2 — do lai jitter + on dinh delta + counterfactual relabel + window-shift.

Co so: analyze-b2b.py (phan T tinh-che) + analyze-b2.py (phan W).
Chay: python3 analyze-c2.py <norvfc-json> [out.txt]
  - norvfc-json: probe C2 --disable-rvfc --passes 20 (duong tick).
Phan bo sung so voi B2:
  Q2: phan doan theo pass (gap tBlend > 800ms), offset mode + mode share
      tung pass — kiem tra delta co on dinh theo pass/phien khong.
  CF: counterfactual relabel — dich nhan moi snapshot theo hang so delta*
      (theo run, roi theo pass), tinh lai ti le clean. Neu co delta* day
      clean >= 85% thi fix hieu chuan pha (F5) kha thi; neu khong thi delta
      ngau nhien theo tick.
  Q3: |offset| + ti le mislabel theo bucket rAF gap (delta tBlend giua 2
      blend tick lien tiep trong cung pass) va theo bucket inRaw.
  Q4: P2 kiem lai tren mau lon.
Dot 106 H5: dedup distinct theo (label, pix, labelSrc) thay vi
(label, pix) — sua artifact G1 LIMITS §3.2 (breakdown labelSrc bi bias:
thoi phong tap, dim fallback). Them phep dem MOI occurrence de doi chieu.
"""
import json
import math
import os
import sys
from collections import Counter

import numpy as np
from PIL import Image

SCRATCH = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round106-h5"
B2SCRATCH = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round100-b2"
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
    """mod-5 offset -> dang co dau: 0, +1, +2, -2, -1."""
    return {0: 0, 1: 1, 2: 2, 3: -2, 4: -1}[d % 5]


def main():
    jpath = sys.argv[1]
    outpath = sys.argv[2] if len(sys.argv) > 2 else os.path.join(SCRATCH, "analyze-c2.txt")
    L = []
    out = L.append
    srcs = load_frames()
    gt_cache = {}

    def gt_bits_for(w, h):
        key = (w, h)
        if key not in gt_cache:
            strips = [snap_strip(s, w, h) for s in srcs]
            gt_cache[key] = [bits_of(s) for s in strips]
        return gt_cache[key]

    with open(jpath) as f:
        data = json.load(f)
    ticks = data["results"]["b"]["y2"]["blendTick"]
    tick_cost = data["results"]["b"]["y2"].get("tickCost", [])
    out("=== C2 phan T: jitter tren mau lon + on dinh delta + counterfactual ===")
    out(f"blendTick: {len(ticks)}; tickCost slice: {len(tick_cost)}")
    # --- phan doan pass theo RESET cua expected (frameIdx): pass moi bat
    # dau khi expected tut lu > 20 (tu ~70 ve ~0); gap tBlend khong dung
    # duoc vi cac pass chay lien nhau (gap max < 800ms o D1) ---
    ticks_sorted = sorted(ticks, key=lambda t: t.get("tBlend", 0))
    segs, cur = [], []
    prev_tb = None
    prev_exp = None
    gaps = []
    for t in ticks_sorted:
        tb = t.get("tBlend")
        if tb is None:
            continue
        exp = t.get("expected")
        if prev_exp is not None and exp is not None and exp < prev_exp - 20:
            segs.append(cur)
            cur = []
        if prev_tb is not None and tb - prev_tb > 0:
            gaps.append(tb - prev_tb)
        cur.append(t)
        prev_tb = tb
        prev_exp = exp
    if cur:
        segs.append(cur)
    out(f"phan doan pass theo reset expected: {len(segs)} doan, kich thuoc {[len(s) for s in segs]}")
    pass_of_seq = {}
    for pi, seg in enumerate(segs):
        for t in seg:
            pass_of_seq[t.get("seq")] = pi
    # gap giua 2 blend tick lien tiep (trong cung pass) -> gan cho tick sau
    gap_of_seq = {}
    for seg in segs:
        prev = None
        for t in seg:
            tb = t.get("tBlend")
            if prev is not None and tb is not None:
                gap_of_seq[t.get("seq")] = tb - prev
            prev = tb
    if gaps:
        out(f"gap blend-tick: trung vi {float(np.median(gaps)):.1f}ms p90 {float(np.percentile(gaps, 90)):.1f} max {max(gaps):.1f} (n={len(gaps)})")

    # --- thu thap snapshot phan biet ---
    # Đợt 106 H5 (sửa artifact G1 LIMITS §3.2): dedup theo (label, pix, labelSrc).
    # Dedup cũ theo (label, pix) gán mỗi cặp cho labelSrc của lần xuất hiện
    # ĐẦU TIÊN, nên breakdown theo labelSrc bị bias (thổi phồng tap, dìm
    # fallback: 21/47 cặp rawAnchor run B bị gán sai labelSrc).
    seen = {}
    for t in ticks:
        for g in (t.get("ghostPix") or []):
            if not g or g.get("labelMs") is None:
                continue
            key = (g.get("frame"), g.get("pix"), g.get("labelSrc") or "?")
            if key not in seen:
                seen[key] = (t, g)
    out(f"snapshot distinct theo (label, pix, labelSrc) [H5 fix]: {len(seen)}")
    rows = []
    for (lab, _pix, _src), (t, g) in seen.items():
        strip = decode_pix(g.get("pix"))
        if strip is None or len(strip) != 48 or lab is None or lab < 0:
            continue
        gb = gt_bits_for(g.get("w"), g.get("h"))
        good = match_set(bits_of(strip), gb, lab)
        if not good:
            cls = "nomatch"
            true_res = None
        elif lab in good:
            cls = "clean"
            true_res = lab % 5
        else:
            res = {f % 5 for f in good}
            if len(res) == 1:
                cls = "mislabeled"
                true_res = next(iter(res))
            else:
                cls = "ambiguous"
                true_res = None
        label_ms, raw_ms = g.get("labelMs"), g.get("rawMs")
        label_ct, raw_ct = g.get("labelCt"), g.get("rawCt")
        in_raw = (raw_ms - label_ms) if isinstance(raw_ms, (int, float)) and isinstance(label_ms, (int, float)) else None
        pred_raw = math.floor(raw_ct * FPS) if isinstance(raw_ct, (int, float)) else None
        rows.append({"label": lab, "cls": cls, "trueRes": true_res, "inRaw": in_raw,
                     "predRaw": pred_raw, "pass": pass_of_seq.get(t.get("seq")),
                     "gap": gap_of_seq.get(t.get("seq")), "tickSeq": t.get("seq"),
                     "anchor": t.get("anchorSrc") or "?",
                     "labelSrc": g.get("labelSrc") or "?"})
    out(f"distinct phan loai: {dict(Counter(r['cls'] for r in rows))} (n={len(rows)})")
    det = [r for r in rows if r["cls"] in ("clean", "mislabeled")]
    out(f"ca don-nghia (clean+mislabeled): n={len(det)}")

    # --- Q1: phan bo offset ---
    off = Counter()
    for r in det:
        if r["trueRes"] is None or r["predRaw"] is None:
            continue
        off[signed_off(r["trueRes"] - r["predRaw"])] += 1
    out(f"Q1 offset (trueRes - predRawRes), distinct: {dict(sorted(off.items()))} (0=khop; B2 n=71: {{0:35,+1:15,+2:8,-2:4,-1:9}})")

    # --- Q4: P2 kiem lai ---
    p2h = sum(1 for r in det if r["predRaw"] is not None and r["trueRes"] is not None and r["predRaw"] % 5 == r["trueRes"])
    p2n = sum(1 for r in det if r["predRaw"] is not None and r["trueRes"] is not None)
    out(f"Q4 P2 distinct: hit {p2h}/{p2n} ({100.0 * p2h / max(1, p2n):.1f}%) vs label-baseline "
        f"{sum(1 for r in det if r['cls'] == 'clean')}/{len(det)} ({100.0 * sum(1 for r in det if r['cls'] == 'clean') / max(1, len(det)):.1f}%) (B2: 49,3% vs 47,9%)")

    # --- D2: clean share theo nguon anchor (pump/tap/frameIdx) ---
    out("D2 clean share theo anchorSrc cua blend tick (chi ca don-nghia):")
    for src in ("pump", "tap", "frameIdx", "?"):
        sub = [r for r in det if r["anchor"] == src]
        if not sub:
            continue
        cl = sum(1 for r in sub if r["cls"] == "clean")
        out(f"  anchor={src}: n={len(sub)} clean {cl}/{len(sub)} ({100.0 * cl / len(sub):.1f}%)")
    # phan bo anchorSrc tren TOAN BO blend tick (ke ca snapshot khong phan biet)
    out(f"  anchorSrc tren toan bo blendTick: {dict(Counter(t.get('anchorSrc') or '?' for t in ticks))}")
    # --- F3: clean share theo NGUON NHAN snapshot (tap/pump/frameIdx/off) ---
    out("F3 clean share theo labelSrc cua snapshot (chi ca don-nghia):")
    for src in ("tap", "pump", "rawAnchor", "frameIdx", "off", "?"):
        sub = [r for r in det if r["labelSrc"] == src]
        if not sub:
            continue
        cl = sum(1 for r in sub if r["cls"] == "clean")
        out(f"  labelSrc={src}: n={len(sub)} clean {cl}/{len(sub)} ({100.0 * cl / len(sub):.1f}%)")
    out(f"  labelSrc tren toan bo snapshot distinct: {dict(Counter(r['labelSrc'] for r in rows))}")
    # --- H5: phep dem MOI occurrence (khong dedup) — doi chieu breakdown ---
    # Cung phan loai nhu distinct, nhung moi lan snapshot xuat hien dem 1.
    # Breakdown labelSrc o day KHONG chiu bias dedup (G1 §3.2); dung lam
    # chuan de kiem distinct moi het bias.
    rows_all = []
    for t in ticks:
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
    out(f"H5 ALL-OCCURRENCES (khong dedup): n={len(rows_all)} phan loai {dict(Counter(r['cls'] for r in rows_all))}; "
        f"don-nghia n={len(det_all)}, clean {sum(1 for r in det_all if r['cls'] == 'clean')}/{len(det_all)} "
        f"({100.0 * sum(1 for r in det_all if r['cls'] == 'clean') / max(1, len(det_all)):.1f}%)")
    for src in ("tap", "pump", "rawAnchor", "frameIdx", "off", "?"):
        sub = [r for r in det_all if r["labelSrc"] == src]
        if not sub:
            continue
        cl = sum(1 for r in sub if r["cls"] == "clean")
        out(f"  ALL labelSrc={src}: n={len(sub)} clean {cl}/{len(sub)} ({100.0 * cl / len(sub):.1f}%)")
    # --- Q2: on dinh delta theo pass ---
    out("Q2 on dinh delta theo pass (offset true-label, chi ca don-nghia):")
    by_pass = {}
    for r in det:
        if r["trueRes"] is None:
            continue
        by_pass.setdefault(r["pass"], []).append(r)
    for pi in sorted(by_pass, key=lambda x: (x is None, x)):
        rs = by_pass[pi]
        c = Counter(signed_off(r["trueRes"] - r["label"]) for r in rs)
        mode, mode_n = c.most_common(1)[0]
        out(f"  pass {pi}: n={len(rs)} offset={dict(sorted(c.items()))} mode={mode} ({mode_n}/{len(rs)}={100.0 * mode_n / len(rs):.0f}%)")
    # mode toan run
    c_all = Counter(signed_off(r["trueRes"] - r["label"]) for r in det if r["trueRes"] is not None)
    mode_all, mode_all_n = c_all.most_common(1)[0]
    out(f"  TOAN RUN: offset true-label {dict(sorted(c_all.items()))} mode={mode_all} ({mode_all_n}/{sum(c_all.values())}={100.0 * mode_all_n / max(1, sum(c_all.values())):.0f}%)")

    # --- CF: counterfactual relabel theo hang so delta ---
    out("CF counterfactual relabel (clean share neu dich nhan moi snapshot theo delta*):")
    for scope, subset in [("toan run", det)] + [(f"pass {pi}", rs) for pi, rs in sorted(by_pass.items(), key=lambda kv: (kv[0] is None, kv[0]))]:
        rs2 = [r for r in subset if r["trueRes"] is not None]
        if len(rs2) < 5:
            continue
        best = None
        line = []
        for d in (-2, -1, 0, 1, 2):
            clean = sum(1 for r in rs2 if (r["label"] + d) % 5 == r["trueRes"])
            line.append(f"d={d:+d}:{clean}/{len(rs2)}={100.0 * clean / len(rs2):.0f}%")
            if best is None or clean > best[1]:
                best = (d, clean)
        out(f"  {scope}: n={len(rs2)} | " + " ".join(line) + f"  => delta* tot nhat {best[0]:+d} ({100.0 * best[1] / len(rs2):.0f}%)")

    # --- Q3: tuong quan gap / inRaw ---
    out("Q3a |offset| + mislabel theo bucket rAF gap (delta tBlend, ms):")
    for lo, hi in [(0, 60), (60, 150), (150, 400), (400, 1e9)]:
        b = [r for r in det if r["gap"] is not None and lo <= r["gap"] < hi and r["trueRes"] is not None and r["predRaw"] is not None]
        if not b:
            continue
        m = sum(1 for r in b if r["cls"] == "mislabeled")
        ao = Counter(abs(signed_off(r["trueRes"] - r["predRaw"])) for r in b)
        so = Counter(signed_off(r["trueRes"] - r["predRaw"]) for r in b)
        out(f"  gap [{lo},{hi}): n={len(b)} mislabeled={m} ({100.0 * m / len(b):.0f}%) |offset|={dict(sorted(ao.items()))} signed={dict(sorted(so.items()))}")
    out("Q3b mislabel + offset theo bucket inRaw (ms):")
    for lo, hi in [(0, 16.7), (16.7, 33.3), (33.3, 66.7), (66.7, 1e9)]:
        b = [r for r in det if r["inRaw"] is not None and lo <= r["inRaw"] < hi and r["trueRes"] is not None and r["predRaw"] is not None]
        if not b:
            continue
        m = sum(1 for r in b if r["cls"] == "mislabeled")
        ao = Counter(abs(signed_off(r["trueRes"] - r["predRaw"])) for r in b)
        out(f"  inRaw [{lo},{hi}): n={len(b)} mislabeled={m} ({100.0 * m / len(b):.0f}%) |offset|={dict(sorted(ao.items()))}")
    # tickCost raw/total (nhu B2)
    raws = [t["raw"] for t in tick_cost if t.get("path") == "mask-blend" and isinstance(t.get("raw"), (int, float))]
    tots = [t["total"] for t in tick_cost if isinstance(t.get("total"), (int, float))]
    if raws:
        out(f"tickCost mask-blend n={len(raws)}: rawMs trung vi {float(np.median(raws)):.1f} p90 {float(np.percentile(raws, 90)):.1f} max {max(raws):.1f}; "
            f"totalMs trung vi {float(np.median(tots)):.1f} p90 {float(np.percentile(tots, 90)):.1f} max {max(tots):.1f} (B2: raw 0,1/0,5; total 93,5/273,5)")
    with open(outpath, "w") as f:
        f.write("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main()
