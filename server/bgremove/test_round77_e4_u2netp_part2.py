#!/usr/bin/env python3
"""
Test đợt 77 E4 — PHẦN 2 (chạy tiếp sau khi phần 1 abort ở assert fg>10
trên clip B p_1.jpg — ảnh vật thể chung, fg thật chỉ ~4%).

Không chạy lại các run đã xong ở phần 1; chỉ:
  1. So sánh lại từ đĩa các mask đã có (clip A @480/@640, clip B @480).
  2. Clip C (p_3.jpg — bàn làm việc, vật thể chung) mask @480 cả 2
     session + so sánh.
  3. Clip A @480 mode=alpha cả 2 session — so sánh kênh alpha LOSSLESS
     (alpha.mov PNG) + kiểm tra pix_fmt có alpha thật.
  4. Ảnh đối chiếu trực quan: original | mask u2net | mask u2netp |
     vùng bất đồng (đỏ) — ghi ra compare-A-480.png để xem bằng mắt.
  5. Gộp toàn bộ số đo (parse cả run1.log phần 1) vào results.json.

Chạy: .venv/bin/python -u test_round77_e4_u2netp_part2.py
"""
import json
import os
import re
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import test_round77_e4_u2netp as T  # noqa: E402

WORKDIR = os.path.expanduser("~/workspace/.tmp-r77e4")
LOG1 = os.path.join(WORKDIR, "run1.log")


def parse_run1_log():
    """Lấy các dòng [run] của phần 1 (wall/fps/rss) vào dict."""
    runs = []
    pat = re.compile(
        r"\[run\] (\S+) mask max-side=(\d+) clip=(\S+): wall=([\d.]+)s "
        r"frames=(\d+) ([\d.]+)s/f \(([\d.]+) fps\) maxrss=([\d.]+)GiB "
        r"load=(\[.*?\])->(\[.*?\]) free=(\d+)->(\d+)MB")
    with open(LOG1) as f:
        for line in f:
            m = pat.search(line)
            if m:
                (sess, ms, clip, wall, n, spf, fps, rss, la0, la1,
                 fr0, fr1) = m.groups()
                runs.append({"session": sess, "mode": "mask",
                             "max_side": int(ms),
                             "clip": clip.replace(".mp4", ""),
                             "wall_s": float(wall), "frames": int(n),
                             "sec_per_frame": float(spf), "fps": float(fps),
                             "maxrss_gib": float(rss),
                             "load_start": eval(la0), "load_end": eval(la1)})
    return runs


def compare_from_disk(a_path, b_path, label):
    fa = T.read_gray_frames(a_path)
    fb = T.read_gray_frames(b_path)
    sa = T.mask_stats(fa)
    sb = T.mask_stats(fb)
    print(f"[stats] {label} u2net : {sa}", flush=True)
    print(f"[stats] {label} u2netp: {sb}", flush=True)
    return sa, sb, T.compare_masks(fa, fb, label)


def visual_compare(workdir):
    """Ảnh đối chiếu clip A @480: gốc | u2net | u2netp | bất đồng (đỏ)."""
    cap = cv2.VideoCapture(os.path.join(workdir, "A-person.mp4"))
    ok, frame = cap.read()
    cap.release()
    assert ok
    fa = T.read_gray_frames(
        os.path.join(workdir, "mask-A-person-u2net-480.mp4"))[0]
    fb = T.read_gray_frames(
        os.path.join(workdir, "mask-A-person-u2netp-480.mp4"))[0]
    orig = cv2.resize(frame, (480, 480))
    diff = np.abs(fa.astype(int) - fb.astype(int)) > 32
    overlay = orig.copy()
    overlay[diff] = (0, 0, 255)  # BGR đỏ = vùng 2 mask bất đồng >32
    # Hàng trên: gốc | u2net | u2netp ; hàng dưới: overlay bất đồng
    top = np.hstack([orig,
                     cv2.cvtColor(fa, cv2.COLOR_GRAY2BGR),
                     cv2.cvtColor(fb, cv2.COLOR_GRAY2BGR)])
    bot = np.hstack([overlay,
                     np.zeros_like(orig),
                     np.zeros_like(orig)])
    combo = np.vstack([top, bot])
    out = os.path.join(workdir, "compare-A-480.png")
    cv2.imwrite(out, combo)
    print(f"[visual] đã ghi {out} "
          f"(trên: gốc|u2net|u2netp — dưới-trái: đỏ=vùng bất đồng>32)",
          flush=True)
    return out


def main():
    results = {"runs": parse_run1_log(), "mask_stats": {},
               "comparisons": []}
    print(f"[part2] parse run1.log: {len(results['runs'])} run phần 1",
          flush=True)

    # 1) So sánh lại từ đĩa — clip A @480/@640, clip B @480
    for clip, ms in (("A-person", 480), ("A-person", 640), ("B-p1", 480)):
        label = f"mask {clip} max-side={ms}"
        sa, sb, comp = compare_from_disk(
            os.path.join(WORKDIR, f"mask-{clip}-u2net-{ms}.mp4"),
            os.path.join(WORKDIR, f"mask-{clip}-u2netp-{ms}.mp4"), label)
        results["mask_stats"][f"{clip}-{ms}-u2net"] = sa
        results["mask_stats"][f"{clip}-{ms}-u2netp"] = sb
        results["comparisons"].append(comp)

    # 2) Clip C (p_3.jpg) mask @480 cả 2 session
    clip = "C-p3"
    v = os.path.join(WORKDIR, f"{clip}.mp4")
    T.make_test_video(v, os.path.join(T.SCRATCH, "p_3.jpg"))
    outs = {}
    for sess in T.SESSIONS:
        out = os.path.join(WORKDIR, f"mask-{clip}-{sess}-480.mp4")
        r = T.run_bgremove(sess, "mask", 480, v, out)
        r["clip"] = clip
        results["runs"].append(r)
        outs[sess] = out
    sa, sb, comp = compare_from_disk(outs["u2net"], outs["u2netp"],
                                     f"mask {clip} max-side=480")
    results["mask_stats"][f"{clip}-480-u2net"] = sa
    results["mask_stats"][f"{clip}-480-u2netp"] = sb
    results["comparisons"].append(comp)

    # 3) Alpha clip A @480 cả 2 session — so sánh lossless
    outs = {}
    for sess in T.SESSIONS:
        out = os.path.join(WORKDIR, f"alpha-A-person-{sess}-480.mov")
        r = T.run_bgremove(sess, "alpha", 480,
                           os.path.join(WORKDIR, "A-person.mp4"), out)
        r["clip"] = "A-person"
        results["runs"].append(r)
        outs[sess] = out
        pr = T.sh(["ffprobe", "-v", "error", "-show_entries",
                   "stream=pix_fmt", "-of", "csv=p=0", out])
        pix_fmt = pr.stdout.strip().split("\n")[0]
        print(f"[alpha] {sess} pix_fmt={pix_fmt}", flush=True)
        assert "a" in pix_fmt and pix_fmt != "yuv420p", \
            f"{sess}: output thiếu alpha"
    fa = T.read_alpha_frames(outs["u2net"])
    fb = T.read_alpha_frames(outs["u2netp"])
    results["comparisons"].append(
        T.compare_masks(fa, fb,
                        "alpha-channel A-person max-side=480 (lossless PNG)"))
    for sess, fr in (("u2net", fa), ("u2netp", fb)):
        a = np.stack(fr)
        print(f"[alpha-stats] {sess}: transparent(<55)="
              f"{float((a < 55).mean() * 100):.1f}% "
              f"opaque(>200)={float((a > 200).mean() * 100):.1f}%", flush=True)

    # 4) Ảnh đối chiếu trực quan
    visual_compare(WORKDIR)

    with open(os.path.join(WORKDIR, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    print("\n✅ PHẦN 2 XONG — xem results.json trong", WORKDIR, flush=True)


if __name__ == "__main__":
    main()
