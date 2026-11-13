#!/usr/bin/env python3
"""
Test đợt 79 G7: u2netp trên 3 clip MỚI (G/H/I) — xem có clip nào đạt
IoU >= 0.85 so với u2net không (nợ đợt 78 §4.7/§4.10 + đợt 77 E4).

Bối cảnh: u2netp đã đo trên 7 clip (A 0,63; B 0,86; C 0,69; D 0,99;
E 0,02; F 0,58) — chỉ 2/6 clip "phạm vi hẹp" đạt nên F9 đã chốt KHÔNG
triển khai opt-in. G7 thử thêm 3 clip mới, đa dạng loại chủ thể, để
xem có trường hợp nào khác đạt ngưỡng không — đặc biệt là chân dung
sáng ngoài trời (G, khác người với D) và động vật (H) + vật sáng trên
nền đen (I, kiểu B/F nhưng vật khác).

Clip mới (ảnh Wikimedia Commons, CHỈ dùng để đo trong scratch, KHÔNG
stage vào repo, không phân phối cùng sản phẩm):
  G: G-portrait-outdoors.jpg — "Portrait of a young woman standing
     outdoors (AM 74788-1).jpg", 946x1275, CC BY 4.0. Chân dung nữ
     đứng ngoài trời, ban ngày.
  H: H-golden-retriever.jpg — "Golden retriever alert (30190754125).jpg",
     960x650, CC0. Chó golden trên cỏ — động vật, chủ thể không phải người.
  I: I-red-rose-black.jpg — "Red rose against a black background.jpg",
     960x1445, CC BY-SA 3.0. Hoa hồng đỏ sáng trên nền đen tuyền.

Chạy (từ server/bgremove, venv bgremove):
    ~/workspace/scratch-bgremove/venv/bin/python -u test_round79_g7_u2netp.py \
        [--workdir DIR]

Việc làm (tuần tự, 1 process tại 1 thời điểm — RAM máy hẹp):
  1. Tạo video mẫu 1,5 s / 45 frame (640x640) từ mỗi ảnh (mẫu F9:
     clip tĩnh nên 45 frame cho cùng IoU/MAD như 90 frame, E4/F9 đã
     chứng minh IoU min ≈ mean, temporal diff ~0).
  2. Với mỗi clip, mỗi session (u2net, u2netp), max-side 480:
     chạy bgremove.py mode=mask --temporal 0 --feather 0 (mask THÔ) —
     đo wall time, fps, đỉnh RSS (wait4 rusage), loadavg.
  3. So sánh từng frame: IoU@128, MAD, % pixel |diff|>32, fg% mỗi bên.
     Assert mask có cả đen lẫn trắng, temporal coherence < 5.0.
  4. In bảng + ghi JSON vào <workdir>/results-g7-u2netp.json.

Tiêu chí (đặt trước, giống E4/F9): mean IoU@128 >= 0.85, MAD <= 15/255,
fg lệch <= 8 điểm mới coi là tương đương trên TỪNG clip. Chỉ đề xuất
mở lại đường dùng hẹp/opt-in khi có >= 2/3 clip mới đạt VÀ có đặc trưng
phân biệt được ca đạt/rớt (bài học F9: B vs F không phân biệt được).
KHÔNG sửa production.
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
WORKDIR_DEFAULT = os.path.expanduser("~/workspace/.tmp-r79g7")
MODEL_DIR = os.path.expanduser("~/.u2net")
CLIPS = {"G-portrait-outdoors": "G-portrait-outdoors.jpg",
         "H-golden-retriever": "H-golden-retriever.jpg",
         "I-red-rose-black": "I-red-rose-black.jpg"}
SESSIONS = ["u2net", "u2netp"]
MAX_SIDE = 480
FRAMES = 45


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


def run_bgremove(session, max_side, in_mp4, out_path):
    cmd = [sys.executable, BGREMOVE_PY,
           "--input", in_mp4, "--output", out_path,
           "--mode", "mask", "--session", session,
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
            f"bgremove thất bại session={session} max-side={max_side} "
            f"(exit {status}):\n{stderr[-2000:]}")
    cap = cv2.VideoCapture(out_path)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    print(f"[run] {session} max-side={max_side} clip={os.path.basename(in_mp4)}: "
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", default=WORKDIR_DEFAULT)
    args = ap.parse_args()
    os.makedirs(args.workdir, exist_ok=True)
    imgs = os.path.join(args.workdir, "imgs")

    results = {"runs": [], "mask_stats": {}, "comparisons": []}
    for clip, img in CLIPS.items():
        src = os.path.join(imgs, img)
        assert os.path.exists(src), f"Không thấy ảnh mẫu: {src}"
        v = os.path.join(args.workdir, f"{clip}.mp4")
        make_test_video(v, src)
        print(f"[test] video {clip}: {v} ({img})", flush=True)
        outs = {}
        for sess in SESSIONS:
            out = os.path.join(args.workdir, f"mask-{clip}-{sess}-480.mp4")
            r = run_bgremove(sess, MAX_SIDE, v, out)
            r["clip"] = clip
            results["runs"].append(r)
            outs[sess] = out
        fa = read_gray_frames(outs["u2net"])
        fb = read_gray_frames(outs["u2netp"])
        sa = mask_stats(fa)
        sb = mask_stats(fb)
        results["mask_stats"][f"{clip}-480-u2net"] = sa
        results["mask_stats"][f"{clip}-480-u2netp"] = sb
        print(f"[stats] {clip} u2net : {sa}", flush=True)
        print(f"[stats] {clip} u2netp: {sb}", flush=True)
        assert sa["fg_pct"] > 0.5 and sa["bg_pct"] > 10, f"{clip}: u2net mask rỗng"
        assert sb["fg_pct"] > 0.5 and sb["bg_pct"] > 10, f"{clip}: u2netp mask rỗng"
        assert sa["mean_interframe_diff"] < 5.0, f"{clip}: u2net mask giật"
        assert sb["mean_interframe_diff"] < 5.0, f"{clip}: u2netp mask giật"
        results["comparisons"].append(
            compare_masks(fa, fb, f"mask {clip} max-side=480"))

    with open(os.path.join(args.workdir, "results-g7-u2netp.json"), "w") as f:
        json.dump(results, f, indent=2)
    print("\n✅ TEST U2NETP XONG — xem results-g7-u2netp.json trong",
          args.workdir, flush=True)


if __name__ == "__main__":
    main()
