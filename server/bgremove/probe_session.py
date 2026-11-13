#!/usr/bin/env python3
"""
Probe nhanh 1 rembg session trên 1 ảnh (đo fps/latency + chất lượng mask).

Dùng cho đợt 76 D7 (birefnet closure): đo ứng viên thay thế nhẹ
(u2netp) mà không chạm production. KHÔNG sửa bgremove.py.

    .venv/bin/python -u probe_session.py --session u2netp \
        --image ~/workspace/scratch-bgremove/person.jpg

In ra: thời gian load session, thời gian predict 1 frame, thống kê
kênh alpha (mean, %>200, %<55), và max RSS của process. Exit 0 khi
predict xong và mask có cả vùng trắng lẫn vùng đen.
"""
import argparse
import resource
import sys
import time

import numpy as np
from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--session", required=True,
                    help="rembg session, vd u2netp, u2net, u2net_human_seg")
    ap.add_argument("--image", required=True, help="Ảnh đầu vào")
    ap.add_argument("--forbidden", default="bria-rmbg,rmbg-2.0,bria",
                    help="Session cấm (weights non-commercial), mặc định như bgremove.py")
    args = ap.parse_args()

    if args.session.strip().lower() in {s.strip().lower()
                                         for s in args.forbidden.split(",")}:
        sys.exit(f"Session '{args.session}' BỊ CẤM: weights non-commercial.")

    from rembg import new_session, remove

    t0 = time.time()
    session = new_session(args.session)
    print(f"[probe] session '{args.session}' load: {time.time() - t0:.1f}s",
          flush=True)
    img = Image.open(args.image)
    t1 = time.time()
    out = remove(img, session=session)
    dt = time.time() - t1
    alpha = np.array(out.split()[-1]) if out.mode == "RGBA" else np.array(out)
    fg = float((alpha > 200).mean() * 100)
    bg = float((alpha < 55).mean() * 100)
    print(f"[probe] mode={out.mode} size={out.size} predict={dt:.2f}s",
          flush=True)
    print(f"[probe] alpha mean={alpha.mean():.1f} "
          f">200={fg:.1f}% <55={bg:.1f}%", flush=True)
    print(f"[probe] maxrss={resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1048576:.2f} GiB",
          flush=True)
    assert fg > 5, f"Mask thiếu vùng trắng (chủ thể): chỉ {fg:.1f}%"
    assert bg > 5, f"Mask thiếu vùng đen (nền): chỉ {bg:.1f}%"
    print("[probe] PASS: mask có cả trắng và đen", flush=True)


if __name__ == "__main__":
    main()
