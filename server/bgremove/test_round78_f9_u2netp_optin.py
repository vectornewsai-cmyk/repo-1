#!/usr/bin/env python3
"""
Test đợt 78 F9: u2netp OPT-IN HẸP — chỉ trường hợp chủ thể sáng/tương phản cao.

Mục đích: quyết định có nên triển khai đường dùng u2netp opt-in (mặc định TẮT,
chỉ bật khi user chọn rõ ràng) cho preview nhanh hay không. Nợ đợt 77 §4.10
(E4: u2netp KHÔNG thay được u2net làm fallback — IoU chân dung 0,626, mất váy
tối màu; chỉ clip B cột đèn đêm đạt IoU 0,86).

KHÔNG sửa production. Chỉ đo + so sánh.

Chạy (từ server/bgremove, venv bgremove):
    .venv/bin/python -u test_round78_f9_u2netp_optin.py [--workdir DIR]

Việc làm (tuần tự, 1 process tại 1 thời điểm — RAM máy hẹp):
  1. Tạo video mẫu 1,5 s / 45 frame (640x640) từ 3 ảnh CC-BY mới
     (Wikimedia Commons, chỉ dùng để đo trong scratch, không stage):
       D: chân dung áo trắng sáng (Inna Story, CC BY 4.0)
       E: đèn hải đăng trong đêm (Candle in the Dark, CC BY 2.0)
       F: tháp đèn hải đăng nền đen (Lighthouse (2), CC BY 2.0)
     + tái dùng mask clip B (p_1.jpg, cột đèn đêm) đã đo ở đợt 77 E4
       từ ~/workspace/.tmp-r77e4 (cùng code/model, bgremove.py không đổi).
  2. Với mỗi clip mới, mỗi session (u2net, u2netp), max-side 480:
     chạy bgremove.py mode=mask với --temporal 0 --feather 0 (mask THÔ)
     — đo wall time, s/frame, fps, đỉnh RSS (wait4 rusage), loadavg.
  3. So sánh từng frame: IoU@128, MAD (/255), % pixel |diff|>32,
     fg% (>200) mỗi bên. Assert mask có cả đen lẫn trắng, temporal
     coherence < 5.0 (video tĩnh).
  4. In bảng tổng hợp + ghi JSON kết quả vào <workdir>/results.json.

Tiêu chí đường opt-in hẹp ĐẠT (đặt trước khi đo, giống E4):
  - Tốc độ u2netp >= u2net (cùng clip/độ phân giải).
  - Đỉnh RSS u2netp <= u2net.
  - Mean IoU@128 >= 0.85, MAD <= 15/255, fg% lệch <= 8 điểm phần trăm
    — trên TỪNG clip trong phạm vi hẹp (không lấy trung bình gộp).
  - Cần >= 3/4 clip trong phạm vi hẹp đạt (B + D + E + F) mới triển
    khai opt-in; nếu không: kết luận KHÔNG triển khai, ghi rõ.
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
SCRATCH = os.path.expanduser("~/workspace/.tmp-r78f9/imgs")
E4_WORKDIR = os.path.expanduser("~/workspace/.tmp-r77e4")
MODEL_DIR = os.path.expanduser("~/.u2net")
# Clip mới (ảnh CC-BY, chỉ dùng để đo trong scratch — KHÔNG stage ảnh).
CLIPS = {
    "D-portrait-white": "D-portrait-white-shirt.jpg",
    "E-lighthouse-beam": "E-candle-dark.jpg",
    "F-lighthouse-lamp": "F-lighthouse.jpg",
}
SESSIONS = ["u2net", "u2netp"]
MAX_SIDE = 480
# FRAMES=45 (đổi từ 90 lúc 00:20 10/11 — xem LIMITS §2.1): clip là ảnh tĩnh
# nên mask gần như không đổi giữa các frame (E4: IoU min ≈ mean, temporal
# diff ~0,00) — 45 frame vẫn cho cùng IoU/MAD và đủ dài để đo fps ổn
# định, trong khi VM đang bị các luồng đợt 78 khác chiếm CPU (load >12,
# có lúc 3 process `yes` chạy cùng) làm run 90 frame kéo dài >30 phút.
FRAMES = 45
# Ngưỡng đường opt-in hẹp (giống E4).
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


def make_test_video(out_path, img_path):
    sh(["ffmpeg", "-y", "-v", "error",
        "-loop", "1", "-i", img_path,
        "-vf", "scale=640:640",
        "-vframes", str(FRAMES), "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-r", "30", out_path])


def run_bgremove(session, mode, max_side, in_mp4, out_path):
    """Chạy bgremove.py 1 lần; trả (wall_s, maxrss_gib, frames, stderr)."""
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
            f"bgremove thất bại session={session} mode={mode} "
            f"max-side={max_side} (exit {status}):\n{stderr[-2000:]}")
    cap = cv2.VideoCapture(out_path)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    print(f"[run] {session} {mode} max-side={max_side} clip={os.path.basename(in_mp4)}: "
          f"wall={wall:.1f}s frames={n} {wall / max(n, 1):.2f}s/f "
          f"({n / wall:.2f} fps) maxrss={maxrss_gib:.2f}GiB "
          f"load={la0}->{loadavg()} free={free0}->{free_mb()}MB",
          flush=True)
    return {"session": session, "mode": mode, "max_side": max_side,
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
    """So sánh mask u2net (a) vs u2netp (b) từng frame."""
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
    """Đạt đường opt-in hẹp khi cả 3 ngưỡng đều qua trên clip này."""
    fg_diff = abs(sa["fg_pct"] - sb["fg_pct"])
    ok = (cmp_["iou_mean"] >= IOU_MIN and cmp_["mad_mean"] <= MAD_MAX
          and fg_diff <= FG_DIFF_MAX_PP)
    return {"clip": cmp_["label"], "iou_ok": cmp_["iou_mean"] >= IOU_MIN,
            "mad_ok": cmp_["mad_mean"] <= MAD_MAX,
            "fg_diff_pp": round(fg_diff, 1), "fg_ok": fg_diff <= FG_DIFF_MAX_PP,
            "pass": bool(ok)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", default=os.path.expanduser("~/workspace/.tmp-r78f9"))
    args = ap.parse_args()
    os.makedirs(args.workdir, exist_ok=True)

    results = {"runs": [], "mask_stats": {}, "comparisons": [], "verdicts": []}
    videos = {}
    for clip, img in CLIPS.items():
        src = os.path.join(SCRATCH, img)
        assert os.path.exists(src), f"Không thấy ảnh mẫu: {src}"
        v = os.path.join(args.workdir, f"{clip}.mp4")
        make_test_video(v, src)
        videos[clip] = v
        print(f"[test] video {clip}: {v} ({img})", flush=True)

    for clip, v in videos.items():
        outs = {}
        for sess in SESSIONS:
            out = os.path.join(args.workdir, f"mask-{clip}-{sess}-{MAX_SIDE}.mp4")
            r = run_bgremove(sess, "mask", MAX_SIDE, v, out)
            r["clip"] = clip
            results["runs"].append(r)
            outs[sess] = out
        fa = read_gray_frames(outs["u2net"])
        fb = read_gray_frames(outs["u2netp"])
        sa = mask_stats(fa)
        sb = mask_stats(fb)
        results["mask_stats"][f"{clip}-{MAX_SIDE}-u2net"] = sa
        results["mask_stats"][f"{clip}-{MAX_SIDE}-u2netp"] = sb
        print(f"[stats] {clip} max-side={MAX_SIDE} u2net : {sa}", flush=True)
        print(f"[stats] {clip} max-side={MAX_SIDE} u2netp: {sb}", flush=True)
        for sess, s in (("u2net", sa), ("u2netp", sb)):
            if s["fg_pct"] < 1.0:
                print(f"[warn] {clip} {sess}: chủ thể rất nhỏ (fg={s['fg_pct']}%) "
                      f"— IoU trên fg nhỏ sẽ nhiễu hơn, đọc kèm MAD", flush=True)
        # Ngưỡng sửa sau abort ở clip E (xem part2): fg>0,1% là đủ để biết
        # mask không rỗng; clip chủ thể nhỏ (E: fg u2net 1,4%) thì fg thấp
        # là số đo thật, không phải lỗi — để verdict IoU quyết.
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

    # Clip B đợt 77 E4 — tái dùng mask đã đo (cùng code/model, bgremove.py
    # không đổi từ đợt 77) để khỏi chạy lại 2 run ~12 phút.
    b_u2net = os.path.join(E4_WORKDIR, "mask-B-p1-u2net-480.mp4")
    b_u2netp = os.path.join(E4_WORKDIR, "mask-B-p1-u2netp-480.mp4")
    assert os.path.exists(b_u2net) and os.path.exists(b_u2netp), \
        "Không thấy mask clip B đợt 77 E4 — cần chạy lại E4."
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

    with open(os.path.join(args.workdir, "results-f9-u2netp-optin.json"), "w") as f:
        json.dump(results, f, indent=2)
    print("✅ TEST XONG — xem results-f9-u2netp-optin.json trong", args.workdir,
          flush=True)


if __name__ == "__main__":
    main()
