#!/usr/bin/env python3
# Canonical copy — T3 dot 130 (unified CLI: chap nhan `tag=path` hoac duong dan tran).
# Logic phan tich GIONG HET ban round129-t4 (md5 goc round128-t4), chi khac parse argv.
# Cac dot sau copy analyzer luot yen tu benchmarks/render/ thay vi tu hidden_files.
"""K7 dot 109 — pixel-verified skipLatest cho WebKit (F6').

Doc tu JSON ghost WebKit (cung dinh dang J6) + ground-truth frames
round111-m5/frames-nonperiodic (f001..f090.png). Dung chung ham snap_strip /
match_set (span=3, thresh=2) voi flip analyzer J6.

Bar dang ky truoc (prereg-k7.md, SUA LAN 1 truoc khi do WebKit — ly do xem
cuoi docstring; chi doi dinh nghia (2), khong doi (1) hay nguong):
  (1) Nhan: >=90% tick skippedLatest=1 (hau flip+2000ms, viaRvfc=0) KHONG
      chua ghostPix nao voi frame == presented.
  (2) Pixel (kiem chung truc tiep claim "snapshot moi nhat bi loai khoi
      pool"): trong cac tick skippedLatest=1, mot ghostPix chi la VI PHAM
      THAT khi ca hai dieu kien dung: label cua no == presented VA strip
      pixel cua no khop dung frame ground-truth presented (classify clean
      voi lab=presented, cung match_set span=3/thresh=2). Bar: >=90% tick
      skippedLatest=1 KHONG co vi pham that nao.
  F6' DONG khi ca (1) va (2) >=90% voi n >= 30 tick skippedLatest=1.
  Chan doan them (khong vao bar):
  (3) Ghost co strip khop ground-truth presented nhung label khac
      presented: tach theo (presented - label) — neu la boi cua 4 thi la
      alias chu ky soc 48px (frame cach nhau 4 frame cho strip giong het,
      J6 §3.2), khong phai vi pham; neu khac thi liet ke cu the.
  (4) Ti le strip "clean" theo nhan (distinct + moi-occurrence) — chi so
      dung sai nhan chung, KHONG vao bar F6' (xem ly do sua bar).
  Doi chung: cung cac ti le tren tick skippedLatest=0.

Ly do sua bar (truoc khi co du lieu WebKit — chi tu hieu metric sau khi
chay thu analyzer tren JSON Chromium J6):
  - (2) cu ("strip khop nhan cua no") do DUNG SAI NHAN cua moi ghost,
    khong do claim skipLatest. Tren JSON Chromium C3b-quiet, (2) cu cho
    skp=1 chi 86,6% distinct (71/82) trong khi (1) la 99,9% (678/679) va
    all-occurrences 98,6% — co che skipLatest hoat dong ro rang nhung bar
    cu van fail vi nhieu nhan (strip khop frame ke ben do soc tuan hoan).
    Bar cu do sai thu can do.
  - (2) moi chi hoi: ghost nao DANH NGHIA la presented thi pixel cua no
    co DUNG LA presented khong. Day moi la "pixel-verified skipLatest"
    theo dung J6 §5.3 ("snapshot bi skip that su khong co mat trong anh
    blend"). Alias chu ky 4 frame duoc xu ly o (3): ghost label
    presented-4 co strip giong het presented theo thiet ke footage, nen
    khong tinh la vi pham khi label khac presented.
"""
import json
import os
import sys
from collections import Counter

import numpy as np
from PIL import Image

SCRATCH = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k7"
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


def classify(strip_bits, gb, lab):
    good = match_set(strip_bits, gb, lab)
    if not good:
        return "nomatch", None
    if lab in good:
        return "clean", lab % 5
    res = {f % 5 for f in good}
    return ("mislabeled", next(iter(res))) if len(res) == 1 else ("ambiguous", None)


def main():
    # T3 dot 130 — unified CLI: argv[1] chap nhan `tag=path` hoac duong dan
    # tran (tag chi de goi, khong doi ten file output mac dinh). Chi doi
    # interface, khong doi logic phan tich.
    if len(sys.argv) < 2:
        print("usage: analyze-t4-skiplatest.py [tag=]path.json [out.txt]", file=sys.stderr)
        sys.exit(2)
    _a1 = sys.argv[1]
    jpath = _a1.split("=", 1)[1] if "=" in _a1 else _a1
    if not jpath:
        print("usage: analyze-t4-skiplatest.py [tag=]path.json [out.txt]", file=sys.stderr)
        sys.exit(2)
    outpath = sys.argv[2] if len(sys.argv) > 2 else os.path.join(SCRATCH, "analyze-k7-skiplatest.txt")
    L = []
    out = L.append
    with open(jpath) as f:
        data = json.load(f)
    out(f"engine: {data.get('engine')} webkitVersion: {data.get('webkitVersion')} gst: {data.get('gstPluginPath')}")
    res = data["results"]["b"]
    flip = res.get("flip") or {}
    fwall = flip.get("wallMs")
    out(f"flip afterPass={flip.get('afterPass')} wallMs={fwall}")
    ticks = sorted(res["y2"]["blendTick"], key=lambda t: t.get("tBlend", 0))
    out(f"blendTick: {len(ticks)} (viaRvfc=1: {sum(1 for t in ticks if t.get('viaRvfc') == 1)}, viaRvfc=0: {sum(1 for t in ticks if t.get('viaRvfc') == 0)})")
    out(f"anchorSrc hau flip+2000ms: {dict(Counter(t.get('anchorSrc') or '?' for t in ticks if fwall is not None and t.get('tBlend', 0) >= fwall + 2000))}")
    if fwall is None:
        out("KHONG CO FLIP (wallMs null) — khong phan tich duoc")
        with open(outpath, "w") as f:
            f.write("\n".join(L) + "\n")
        print("\n".join(L))
        return
    post = [t for t in ticks if t.get("viaRvfc") == 0 and t.get("tBlend", 0) >= fwall + 2000]
    out(f"tick viaRvfc=0 hau flip+2000ms: {len(post)}")
    # gap presented-expected hau flip (nhu flip analyzer, de chan doan)
    gaps = [(t.get("tBlend") - fwall, t.get("presented") - t.get("expected")) for t in post
            if isinstance(t.get("presented"), (int, float)) and isinstance(t.get("expected"), (int, float))]
    if gaps:
        within = sum(1 for _, g in gaps if abs(g) <= 3)
        out(f"gap presented-expected hau flip: n={len(gaps)} |gap|<=3: {within}/{len(gaps)} ({100.0 * within / len(gaps):.1f}%) median {float(np.median([g for _, g in gaps])):.1f} min {min(g for _, g in gaps)} max {max(g for _, g in gaps)}")
    srcs = load_frames()
    gt_cache = {}

    def gt_bits_for(w, h):
        key = (w, h)
        if key not in gt_cache:
            gt_cache[key] = [bits_of(snap_strip(s, w, h)) for s in srcs]
        return gt_cache[key]

    for skp, tag in ((1, "skippedLatest=1 (CHINH)"), (0, "skippedLatest=0 (doi chung)")):
        sub = [t for t in post if t.get("skippedLatest") == skp and (t.get("ghostPix") or [])]
        sub = [t for t in sub if any(g and g.get("labelMs") is not None for g in t.get("ghostPix"))]
        out(f"--- {tag}: nTick={len(sub)}")
        if not sub:
            continue
        # (1) nhan: tick co ghostPix frame == presented ?
        viol_lab = [t for t in sub if any(g.get("frame") == t.get("presented") for g in t.get("ghostPix") if g)]
        ok1 = len(sub) - len(viol_lab)
        out(f"  (1) nhan: tick KHONG chua ghost==presented: {ok1}/{len(sub)} ({100.0 * ok1 / len(sub):.1f}%) — vi pham nhan {len(viol_lab)} tick")
        if viol_lab:
            out(f"      vi pham nhan mau (toi da 10): {[(t.get('seq'), t.get('presented'), sorted({g.get('frame') for g in t.get('ghostPix') if g})) for t in viol_lab[:10]]}")
        # (2) pixel-verified: ghost label==presented MA strip khop dung presented moi la vi pham that
        real_viol_ticks = []
        cand_n = 0
        cand_clean = 0
        for t in sub:
            pres = t.get("presented")
            tick_real = False
            for g in (t.get("ghostPix") or []):
                if not g or g.get("labelMs") is None or g.get("frame") != pres:
                    continue
                cand_n += 1
                strip = decode_pix(g.get("pix"))
                if strip is None or len(strip) != 48:
                    continue
                gb = gt_bits_for(g.get("w"), g.get("h"))
                cls, _ = classify(bits_of(strip), gb, pres)
                if cls == "clean":
                    cand_clean += 1
                    tick_real = True
            if tick_real:
                real_viol_ticks.append(t)
        ok2 = len(sub) - len(real_viol_ticks)
        out(f"  (2) pixel-verified: ung vien ghost label==presented: {cand_n} strip, trong do strip khop dung presented: {cand_clean}; tick co VI PHAM THAT: {len(real_viol_ticks)} — tick KHONG vi pham that: {ok2}/{len(sub)} ({100.0 * ok2 / len(sub):.1f}%)")
        if real_viol_ticks:
            out(f"      vi pham that mau (toi da 10): {[(t.get('seq'), t.get('presented')) for t in real_viol_ticks[:10]]}")
        # (3) chan doan alias: strip khop presented nhung label khac presented.
        # Alias khi strip ground-truth cua label BANG strip ground-truth
        # cua presented (doan strip 48px khong phan biet duoc 2 frame nay):
        #   - frame lien ke trung nhau trong footage goc: (14,15), (26,27),
        #     (32,33), (38,39), (50,51), (56,57), (62,63), (74,75),
        #     (80,81), (86,87) — full-frame identical;
        #   - alias chu ky soc 48px: frame cach nhau 4 frame co strip
        #     giong het (J6 §3.2).
        # Chi "dang ngo" khi strip(gt[label]) != strip(gt[presented]) ma
        # strip cua ghost lai khop presented — pixel that su khac nhan.
        alias_dup = 0
        susp = []
        for t in sub:
            pres = t.get("presented")
            for g in (t.get("ghostPix") or []):
                if not g or g.get("labelMs") is None or g.get("frame") == pres:
                    continue
                strip = decode_pix(g.get("pix"))
                if strip is None or len(strip) != 48:
                    continue
                gb = gt_bits_for(g.get("w"), g.get("h"))
                good_p = match_set(bits_of(strip), gb, pres)
                if pres in good_p:
                    lab = g.get("frame")
                    if lab is not None and 0 <= lab < 90 and int(np.sum(gb[lab] != gb[pres])) == 0:
                        alias_dup += 1
                    else:
                        susp.append((t.get("seq"), pres, lab))
        out(f"  (3) alias-chan-doan: ghost strip khop presented nhung label khac: alias (strip gt[label]==strip gt[presented]): {alias_dup}; KHAC (dang ngo, liet ke toi da 10): {susp[:10]} (n={len(susp)})")
        # (4) chan doan dung sai nhan chung (distinct + moi-occurrence) — khong vao bar
        seen = {}
        for t in sub:
            for g in (t.get("ghostPix") or []):
                if not g or g.get("labelMs") is None:
                    continue
                key = (g.get("frame"), g.get("pix"), g.get("labelSrc") or "?")
                if key not in seen:
                    seen[key] = g
        rows = []
        for (lab, _pix, _src), g in seen.items():
            strip = decode_pix(g.get("pix"))
            if strip is None or len(strip) != 48 or lab is None or lab < 0:
                continue
            gb = gt_bits_for(g.get("w"), g.get("h"))
            cls, _ = classify(bits_of(strip), gb, lab)
            rows.append(cls)
        cnt = Counter(rows)
        det = [r for r in rows if r in ("clean", "mislabeled")]
        cl = sum(1 for r in det if r == "clean")
        out(f"  (4) chan-doan label-clean distinct: n={len(rows)} phan loai {dict(cnt)}; don-nghia n={len(det)}, clean {cl}/{len(det)} ({100.0 * cl / max(1, len(det)):.1f}%)")
        rows_all = []
        for t in sub:
            for g in (t.get("ghostPix") or []):
                if not g or g.get("labelMs") is None:
                    continue
                lab = g.get("frame")
                strip = decode_pix(g.get("pix"))
                if strip is None or len(strip) != 48 or lab is None or lab < 0:
                    continue
                gb = gt_bits_for(g.get("w"), g.get("h"))
                cls, _ = classify(bits_of(strip), gb, lab)
                rows_all.append(cls)
        cnt_all = Counter(rows_all)
        det_all = [r for r in rows_all if r in ("clean", "mislabeled")]
        cl_all = sum(1 for r in det_all if r == "clean")
        out(f"  (4b) chan-doan label-clean moi-occurrence: n={len(rows_all)} phan loai {dict(cnt_all)}; don-nghia n={len(det_all)}, clean {cl_all}/{len(det_all)} ({100.0 * cl_all / max(1, len(det_all)):.1f}%)")
    # Verdict theo bar prereg
    sub1 = [t for t in post if t.get("skippedLatest") == 1 and (t.get("ghostPix") or [])]
    sub1 = [t for t in sub1 if any(g and g.get("labelMs") is not None for g in t.get("ghostPix"))]
    out("=== VERDICT F6' (bar prereg-k7, sua lan 1) ===")
    out(f"n tick skippedLatest=1 hau flip+2000ms: {len(sub1)} (can >=30)")
    if len(sub1) < 30:
        out("KET LUAN: CHUA DU MAU — F6' van mo")
    else:
        viol = sum(1 for t in sub1 if any(g.get("frame") == t.get("presented") for g in t.get("ghostPix") if g))
        r1 = 100.0 * (len(sub1) - viol) / len(sub1)
        # (2) tinh lai o day cho verdict (khong doc lai tu tren)
        real_viol = 0
        for t in sub1:
            pres = t.get("presented")
            for g in (t.get("ghostPix") or []):
                if not g or g.get("labelMs") is None or g.get("frame") != pres:
                    continue
                strip = decode_pix(g.get("pix"))
                if strip is None or len(strip) != 48:
                    continue
                gb = gt_bits_for(g.get("w"), g.get("h"))
                cls, _ = classify(bits_of(strip), gb, pres)
                if cls == "clean":
                    real_viol += 1
                    break
        r2 = 100.0 * (len(sub1) - real_viol) / len(sub1)
        out(f"(1) nhan: {r1:.1f}% (bar >=90%)")
        out(f"(2) pixel-verified (khong vi pham that): {r2:.1f}% (bar >=90%)")
        if r1 >= 90 and r2 >= 90:
            out("KET LUAN: F6' DONG — skipLatest pixel-verified tren WebKit")
        else:
            out("KET LUAN: F6' VAN MO — xem (1)/(2) o tren")
    with open(outpath, "w") as f:
        f.write("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main()
