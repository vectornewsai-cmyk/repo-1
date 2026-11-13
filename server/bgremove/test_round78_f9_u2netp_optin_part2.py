#!/usr/bin/env python3
"""
Test đợt 78 F9 — PHẦN 2: hoàn tất so sánh u2netp opt-in hẹp cho clip E + F.

Bối cảnh: phần 1 (test_round78_f9_u2netp_optin.py) abort ở clip E với
`AssertionError: u2netp mask rỗng` — ngưỡng fg>0,5% (copy từ E4, giả định
ảnh chân dung/vật thể lấp khung hình) không đúng với clip E: chủ thể
sáng thật chỉ chiếm ~1,4% khung hình theo u2net (đèn hải đăng đêm),
u2netp chỉ còn 0,4%. Đó là SỐ ĐO THẬT (mask gần rỗng), không phải lỗi
pipeline — assert quá chặt đã chặn việc so sánh. Phần 2 sửa ngưỡng
thành fg>0,1% (mask không rỗng) + cảnh báo khi fg<1% (chủ thể nhỏ,
IoU nhiễu hơn), rồi:

  1. Đọc lại mask D + E đã có trên đĩa (không chạy lại model).
  2. So sánh + verdict cho E (IoU/MAD/fg).
  3. Chạy F (u2net + u2netp, 45 frame) rồi so sánh + verdict.
  4. Tái dùng mask B đợt 77 E4 (90 frame) để có đủ 4 clip.
  5. Ghi results-f9-u2netp-optin-part2.json + in verdict gộp 4 clip.

Chạy (từ server/bgremove, venv bgremove):
    .venv/bin/python -u test_round78_f9_u2netp_optin_part2.py [--workdir DIR]
"""
import argparse
import json
import os
import subprocess
import sys
import time

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
BGREMOVE_PY = os.path.join(HERE, "bgremove.py")
E4_WORKDIR = os.path.expanduser("~/workspace/.tmp-r77e4")
MODEL_DIR = os.path.expanduser("~/.u2net")
SESSIONS = ["u2net", "u2netp"]
MAX_SIDE = 480
FRAMES = 45
IOU_MIN = 0.85
MAD_MAX = 15.0 / 255.0
FG_DIFF_MAX_PP = 8.0


def sh(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        raise RuntimeError(f"Lệnh thất bại: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r


def loadavg():
    with open("/proc/loadavg") as f:
        return f.read().split()[:3]


def free_mb():
    with open("/proc/meminfo") as f:
        for line in f:
            if line.startswith("MemAvailable:"):
                return int(line.split()[1]) // 1024
    return -1


def run_bgremove(session, mode, max_side, in_mp4, out_path):
    cmd = [sys.executable, BGREMOVE_PY,
           "--input", in_mp4, "--output", out_path,
           "--mode", mode, "--session", session,
           "--model-dir", MODEL_DIR, "--max-side", str(max_side),
           "--temporal", "0", "--feather", "0"]
    env = dict(os.environ, U2NET_HOME=MODEL_DIR)
    err_path = out_path + ".stderr.log"
    t0 = time.monotonic()
    la0, free0 = loadavg(), free_mb()
    with open(err_path, "w") as errf:
        p = subprocess.Popen(cmd, stdout=subprocess.DEVNULL,
                             stderr=errf, text=True, env=env)
        _, status, rusage = os.wait4(p.pid, 0)
    with open(err_path) as f:
        stderr = f.read()
    wall = time.monotonic() - t0
    maxrss_gib = rusage.ru_maxrss / 1048576.0
    if status != 0:
        raise RuntimeError(
            f"bgremove thất bại session={session} (exit {status}):\n{stderr[-2000:]}")
    cap = cv2.VideoCapture(out_path)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    print(f"[run] {session} mask max-side={max_side} clip={os.path.basename(in_mp4)}: "
          f"wall={wall:.1f}s frames={n} {wall / max(n, 1):.2f}s/f "
          f"({n / wall:.2f} fps) maxrss={maxrss_gib:.2f}GiB "
          f"load={la0}->{loadavg()} free={free0}->{free_mb()}MB",
          flush=True)
    return {"session": session, "mode": "mask", "max_side": max_side,
            "wall_s": round(wall, 1), "frames": n,
            "sec_per_frame": round(wall / max(n, 1), 3),
            "fps": round(n / wall, 3), "maxrss_gib": round(maxrss_gib, 2),
            "load_start": la0, "load_end": loadavg()}


def read_gray_frames(path):
    cap = cv2.VideoCapture(path)
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY))
    cap.release()
    return frames


def mask_stats(frames):
    a = np.stack(frames)
    fg = float((a > 200).mean() * 100)
    bg = float((a < 55).mean() * 100)
    diffs = [float(np.abs(frames[i].astype(int) - frames[i - 1].astype(int)).mean())
             for i in range(1, len(frames))]
    return {"frames": len(frames), "fg_pct": round(fg, 1), "bg_pct": round(bg, 1),
            "mean_interframe_diff": round(float(np.mean(diffs)), 2) if diffs else 0.0}


def compare_masks(frames_a, frames_b, label):
    assert len(frames_a) == len(frames_b), \
        f"{label}: số frame khác nhau {len(frames_a)} vs {len(frames_b)}"
    ious, mads, diff32 = [], [], []
    for fa, fb in zip(frames_a, frames_b):
        assert fa.shape == fb.shape, f"{label}: shape khác {fa.shape} vs {fb.shape}"
        ba = fa > 128
        bb = fb > 128
        inter = np.logical_and(ba, bb).sum()
        union = np.logical_or(ba, bb).sum()
        ious.append(inter / union if union else 1.0)
        mads.append(float(np.abs(fa.astype(int) - fb.astype(int)).mean()) / 255.0)
        diff32.append(float((np.abs(fa.astype(int) - fb.astype(int)) > 32).mean() * 100))
    out = {"label": label, "frames": len(frames_a),
           "iou_mean": round(float(np.mean(ious)), 4),
           "iou_min": round(float(np.min(ious)), 4),
           "mad_mean": round(float(np.mean(mads)), 4),
           "mad_max": round(float(np.max(mads)), 4),
           "pct_diff_gt32_mean": round(float(np.mean(diff32)), 2)}
    print(f"[compare] {label}: IoU mean={out['iou_mean']} min={out['iou_min']} "
          f"MAD mean={out['mad_mean']} max={out['mad_max']} "
          f"|diff|>32 mean={out['pct_diff_gt32_mean']}%", flush=True)
    return out


def verdict_clip(cmp_, sa, sb):
    fg_diff = abs(sa["fg_pct"] - sb["fg_pct"])
    ok = (cmp_["iou_mean"] >= IOU_MIN and cmp_["mad_mean"] <= MAD_MAX
          and fg_diff <= FG_DIFF_MAX_PP)
    return {"clip": cmp_["label"], "iou_ok": cmp_["iou_mean"] >= IOU_MIN,
            "mad_ok": cmp_["mad_mean"] <= MAD_MAX,
            "fg_diff_pp": round(fg_diff, 1), "fg_ok": fg_diff <= FG_DIFF_MAX_PP,
            "pass": bool(ok)}


def compare_pair(workdir, clip, results):
    """So sánh 1 clip từ mask đã có trên đĩa; trả verdict."""
    outs = {}
    for sess in SESSIONS:
        p = os.path.join(workdir, f"mask-{clip}-{sess}-{MAX_SIDE}.mp4")
        assert os.path.exists(p), f"Không thấy mask: {p}"
        outs[sess] = p
    fa = read_gray_frames(outs["u2net"])
    fb = read_gray_frames(outs["u2netp"])
    sa = mask_stats(fa)
    sb = mask_stats(fb)
    results["mask_stats"][f"{clip}-{MAX_SIDE}-u2net"] = sa
    results["mask_stats"][f"{clip}-{MAX_SIDE}-u2netp"] = sb
    print(f"[stats] {clip} max-side={MAX_SIDE} u2net : {sa}", flush=True)
    print(f"[stats] {clip} max-side={MAX_SIDE} u2netp: {sb}", flush=True)
    # Ngưỡng sửa so với phần 1: fg>0,1% (mask không rỗng). Clip chủ thể
    # nhỏ (E: fg u2net chỉ 1,4%) thì fg thấp là số đo thật, không phải
    # lỗi — chỉ cảnh báo, vẫn so sánh tiếp và để verdict IoU quyết.
    for sess, s in (("u2net", sa), ("u2netp", sb)):
        if s["fg_pct"] < 1.0:
            print(f"[warn] {clip} {sess}: chủ thể rất nhỏ (fg={s['fg_pct']}%) "
                  f"— IoU trên fg nhỏ sẽ nhiễu hơn, đọc kèm MAD", flush=True)
    assert sa["fg_pct"] > 0.1 and sa["bg_pct"] > 10, "u2net mask rỗng"
    assert sb["fg_pct"] > 0.1 and sb["bg_pct"] > 10, "u2netp mask rỗng"
    assert sa["mean_interframe_diff"] < 5.0, "u2net mask giật"
    assert sb["mean_interframe_diff"] < 5.0, "u2netp mask giật"
    cmp_ = compare_masks(fa, fb, f"mask {clip} max-side={MAX_SIDE}")
    results["comparisons"].append(cmp_)
    vd = verdict_clip(cmp_, sa, sb)
    results["verdicts"].append(vd)
    print(f"[verdict] {clip}: {'ĐẠT opt-in hẹp' if vd['pass'] else 'KHÔNG ĐẠT'} "
          f"(iou_ok={vd['iou_ok']} mad_ok={vd['mad_ok']} fg_diff={vd['fg_diff_pp']}pp)",
          flush=True)
    return vd


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", default=os.path.expanduser("~/workspace/.tmp-r78f9"))
    args = ap.parse_args()

    results = {"runs": [], "mask_stats": {}, "comparisons": [], "verdicts": []}

    # 1) D + E: mask đã có từ phần 1 — chỉ so sánh lại (không chạy model).
    #    D đã có verdict ở phần 1 (ĐẠT, IoU 0,9918) — tính lại để JSON đủ.
    compare_pair(args.workdir, "D-portrait-white", results)
    compare_pair(args.workdir, "E-lighthouse-beam", results)

    # 2) F: chạy 2 run (video đã tạo ở phần 1).
    v_f = os.path.join(args.workdir, "F-lighthouse-lamp.mp4")
    assert os.path.exists(v_f), f"Không thấy video F: {v_f}"
    for sess in SESSIONS:
        out = os.path.join(args.workdir, f"mask-F-lighthouse-lamp-{sess}-{MAX_SIDE}.mp4")
        r = run_bgremove(sess, "mask", MAX_SIDE, v_f, out)
        r["clip"] = "F-lighthouse-lamp"
        results["runs"].append(r)
    compare_pair(args.workdir, "F-lighthouse-lamp", results)

    # 3) B đợt 77 E4 — tái dùng mask 90 frame trên đĩa.
    b_u2net = os.path.join(E4_WORKDIR, "mask-B-p1-u2net-480.mp4")
    b_u2netp = os.path.join(E4_WORKDIR, "mask-B-p1-u2netp-480.mp4")
    assert os.path.exists(b_u2net) and os.path.exists(b_u2netp), \
        "Không thấy mask clip B đợt 77 E4."
    fa = read_gray_frames(b_u2net)
    fb = read_gray_frames(b_u2netp)
    sa = mask_stats(fa)
    sb = mask_stats(fb)
    results["mask_stats"]["B-p1-480-u2net(reused-E4)"] = sa
    results["mask_stats"]["B-p1-480-u2netp(reused-E4)"] = sb
    cmp_ = compare_masks(fa, fb, "mask B-p1 max-side=480 (tái dùng E4)")
    results["comparisons"].append(cmp_)
    vd = verdict_clip(cmp_, sa, sb)
    results["verdicts"].append(vd)
    print(f"[verdict] B-p1 (E4): {'ĐẠT opt-in hẹp' if vd['pass'] else 'KHÔNG ĐẠT'} "
          f"(iou_ok={vd['iou_ok']} mad_ok={vd['mad_ok']} fg_diff={vd['fg_diff_pp']}pp)",
          flush=True)

    n_pass = sum(1 for v in results["verdicts"] if v["pass"])
    n_total = len(results["verdicts"])
    results["optin_verdict"] = {
        "clips_pass": n_pass, "clips_total": n_total,
        "deploy_optin": n_pass >= 3,
        "note": ("Triển khai opt-in hẹp" if n_pass >= 3 else
                 "KHÔNG triển khai opt-in — bằng chứng trong phạm vi hẹp "
                 "không đủ (cần >=3/4 clip đạt)."),
    }
    print(f"\n[optin] {n_pass}/{n_total} clip đạt → {results['optin_verdict']['note']}",
          flush=True)

    with open(os.path.join(args.workdir, "results-f9-u2netp-optin-part2.json"), "w") as f:
        json.dump(results, f, indent=2)
    print("✅ TEST XONG — xem results-f9-u2netp-optin-part2.json trong",
          args.workdir, flush=True)


if __name__ == "__main__":
    main()
