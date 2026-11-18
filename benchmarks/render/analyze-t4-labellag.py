#!/usr/bin/env python3
# Canonical copy — T3 dot 130 (unified CLI: chap nhan `tag=path` hoac duong dan tran).
# Logic phan tich GIONG HET ban round129-t4 (md5 goc round128-t4), chi khac parse argv.
# Cac dot sau copy analyzer luot yen tu benchmarks/render/ thay vi tu hidden_files.
"""L7 dot 110 — do do tre nhan-pixel TRUC TIEP tren WebKit (F6' / K7 §9.4).

Doc tu JSON ghost WebKit (cung dinh dang J6/K7) + ground-truth frames
round111-m5/frames-nonperiodic (f001..f090.png). Tai dung ham snap_strip /
bits_of / decode_pix cua analyzer K7, nhung match TOAN CUC (moi frame
0..89) thay vi cua so +-3 quanh nhan — muc dich la tim frame pixel-that
cua snapshot, khong phai kiem nhan.

Dinh nghia (dang ky truoc trong prereg-l7.md):
  M(g) = tap frame f trong 0..89 ma strip ground-truth cua f khop strip
         cua ghost trong thresh<=2 bit (cung match_set cua flip analyzer).
  lag(g) = m* - label, voi m* la frame khop GAN NHAT label
           (neu hoa thi lay m nho nhat). Day la uoc luong thap cua tre
           that: neu strip khop ca label va label+4 (alias chu ky soc)
           thi lag bao 0 trong khi tre that co the la 4.
  (a) Toan bo occurrence match duoc (M khac rong): phan phoi lag.
  (b) Chi occurrence match DUY NHAT 1 frame (|M|==1): lag khong mo ho
      — phep do truc tiep sach nhat.
  (c) Tap "dang ngo": strip khop presented (presented thuoc M) nhung
      label != presented — lag_to_presented = presented - label; kiem
      cum lech 18 frame cua K7 (label 46 -> presented 64) co tai hien
      luc yen khong.
  (d) Nomatch: strip khong khop frame ground-truth nao (M rong).
Bao them: n, median/p90/max tre (frame + ms theo 30fps = frame*33,3ms),
so occurrence tre >=5 frame, >=10 frame. Tinh tren tick hau flip+2000ms,
viaRvfc=0, ca skp=1 va skp=0 (tach rieng).
"""
import json
import os
import sys
from collections import Counter

import numpy as np
from PIL import Image

FRAMES_DIR = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round111-m5/frames-nonperiodic"
FPS = 30.0


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


def pct(a, q):
    return float(np.percentile(a, q)) if len(a) else float("nan")


def summarize(name, lags):
    if not lags:
        return f"  {name}: n=0"
    a = np.asarray(lags, dtype=float)
    return (f"  {name}: n={len(lags)} median={np.median(a):.0f}f "
            f"({np.median(a) * 1000 / FPS:.0f}ms) p90={pct(a, 90):.0f}f "
            f"({pct(a, 90) * 1000 / FPS:.0f}ms) max={a.max():.0f}f "
            f"({a.max() * 1000 / FPS:.0f}ms) min={a.min():.0f}f "
            f">=5f: {int((a >= 5).sum())} >=10f: {int((a >= 10).sum())} "
            f"am (lag<0): {int((a < 0).sum())}")


def main():
    # T3 dot 130 — unified CLI: argv[1] chap nhan `tag=path` hoac duong dan
    # tran (tag chi de goi, khong doi ten file output mac dinh). Chi doi
    # interface, khong doi logic phan tich.
    if len(sys.argv) < 2:
        print("usage: analyze-t4-labellag.py [tag=]path.json [out.txt]", file=sys.stderr)
        sys.exit(2)
    _a1 = sys.argv[1]
    jpath = _a1.split("=", 1)[1] if "=" in _a1 else _a1
    if not jpath:
        print("usage: analyze-t4-labellag.py [tag=]path.json [out.txt]", file=sys.stderr)
        sys.exit(2)
    outpath = sys.argv[2] if len(sys.argv) > 2 else "analyze-l7-labellag.txt"
    L = []
    out = L.append
    with open(jpath) as f:
        data = json.load(f)
    out(f"engine: {data.get('engine')} webkitVersion: {data.get('webkitVersion')}")
    res = data["results"]["b"]
    flip = res.get("flip") or {}
    fwall = flip.get("wallMs")
    out(f"flip afterPass={flip.get('afterPass')} wallMs={fwall}")
    ticks = sorted(res["y2"]["blendTick"], key=lambda t: t.get("tBlend", 0))
    if fwall is None:
        out("KHONG CO FLIP (wallMs null) — khong phan tich duoc")
        with open(outpath, "w") as f:
            f.write("\n".join(L) + "\n")
        print("\n".join(L))
        return
    post = [t for t in ticks if t.get("viaRvfc") == 0 and t.get("tBlend", 0) >= fwall + 2000]
    out(f"tick viaRvfc=0 hau flip+2000ms: {len(post)}")
    srcs = load_frames()
    gt_cache = {}

    def gt_bits_for(w, h):
        key = (w, h)
        if key not in gt_cache:
            gt_cache[key] = [bits_of(snap_strip(s, w, h)) for s in srcs]
        return gt_cache[key]

    for skp, tag in ((1, "skippedLatest=1"), (0, "skippedLatest=0")):
        sub = [t for t in post if t.get("skippedLatest") == skp]
        occ = []
        for t in sub:
            for g in (t.get("ghostPix") or []):
                if not g or g.get("labelMs") is None or g.get("frame") is None:
                    continue
                occ.append((t, g))
        out(f"--- {tag}: nTick={len(sub)} nOccurrence={len(occ)}")
        lags_a, lags_b, lags_c = [], [], []
        lags_c_alias, lags_c_susp = [], []
        nomatch = 0
        c_rows = []
        c_susp_rows = []
        for t, g in occ:
            lab = g["frame"]
            strip = decode_pix(g.get("pix"))
            if strip is None or len(strip) != 48 or lab < 0 or lab >= 90:
                nomatch += 1
                continue
            gb = gt_bits_for(g.get("w"), g.get("h"))
            M = global_matches(bits_of(strip), gb)
            if not M:
                nomatch += 1
                continue
            m_star = min(M, key=lambda m: (abs(m - lab), m))
            lags_a.append(m_star - lab)
            if len(M) == 1:
                lags_b.append(M[0] - lab)
            pres = t.get("presented")
            if pres is not None and pres in M and lab != pres:
                lags_c.append(pres - lab)
                c_rows.append((t.get("seq"), pres, lab, pres - lab))
                # tach alias (strip GT cua label BANG strip GT cua presented)
                # khoi dang ngo that — cung dinh nghia K7 (3).
                if 0 <= lab < 90 and 0 <= pres < 90 and int(np.sum(gb[lab] != gb[pres])) == 0:
                    lags_c_alias.append(pres - lab)
                else:
                    lags_c_susp.append(pres - lab)
                    c_susp_rows.append((t.get("seq"), pres, lab, pres - lab))
        out(f"  (d) nomatch (strip khong khop frame GT nao): {nomatch}/{len(occ)} "
            f"({100.0 * nomatch / max(1, len(occ)):.1f}%)")
        out(summarize("(a) tat ca occurrence match duoc — lag = frame gan nhat - label", lags_a))
        out("      LUU Y (a): do soc tuan hoan chu ky 4 frame, frame gan nhat luon trong +-2 frame cua label theo cau truc — (a) KHONG do duoc tre that >2f; chi la can duoi.")
        out(summarize("(b) chi match DUY NHAT 1 frame (|M|==1) — lag khong mo ho", lags_b))
        out("      LUU Y (b): n=0 co nghia KHONG co strip nao xac dinh duy nhat 1 frame — strip 48px mo ho hoan toan do alias soc; tre truc tiep theo ghost don le la khong kha thi, chi (c) moi co thong tin.")
        out(summarize("(c) dang ngo — strip khop presented, label khac: lag = presented - label", lags_c))
        out(summarize("(c1) trong (c): alias — strip GT[label]==strip GT[presented]", lags_c_alias))
        out(summarize("(c2) trong (c): DANG NGO THAT — strip GT[label]!=strip GT[presented], pixel that su khac nhan", lags_c_susp))
        if c_rows:
            out(f"      (c) mau toi da 10 (seq, presented, label, lag): {c_rows[:10]}")
        if c_susp_rows:
            out(f"      (c2) dang ngo that, tat ca (seq, presented, label, lag): {c_susp_rows}")
        # phan phoi lag (a) theo khoang
        if lags_a:
            cnt = Counter()
            for v in lags_a:
                if v < 0:
                    cnt["<0"] += 1
                elif v == 0:
                    cnt["0"] += 1
                elif v <= 2:
                    cnt["1-2"] += 1
                elif v <= 4:
                    cnt["3-4"] += 1
                elif v <= 9:
                    cnt["5-9"] += 1
                elif v <= 18:
                    cnt["10-18"] += 1
                else:
                    cnt[">18"] += 1
            out(f"  (a) phan phoi lag (frame): {dict(cnt)}")
        if lags_b:
            cnt = Counter()
            for v in lags_b:
                if v < 0:
                    cnt["<0"] += 1
                elif v == 0:
                    cnt["0"] += 1
                elif v <= 2:
                    cnt["1-2"] += 1
                elif v <= 4:
                    cnt["3-4"] += 1
                elif v <= 9:
                    cnt["5-9"] += 1
                else:
                    cnt[">=10"] += 1
            out(f"  (b) phan phoi lag (frame): {dict(cnt)}")
    with open(outpath, "w") as f:
        f.write("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main()
