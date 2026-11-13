#!/usr/bin/env python3
"""
Test đợt 77 E4: u2netp end-to-end SO VỚI u2net trên video thật.

Mục đích: quyết định u2netp có thay được u2net làm fallback chính thức
của bgremove.py không (nợ đợt 76 D7 §5 mục 1). KHÔNG sửa production.

Chạy (từ server/bgremove, venv bgremove):
    .venv/bin/python -u test_round77_e4_u2netp.py [--workdir DIR]

Việc làm (tuần tự, 1 process tại 1 thời điểm — RAM máy hẹp):
  1. Tạo video mẫu 3 s / 90 frame (640x640) từ 2 ảnh người thật:
     person.jpg (clip A) và p_1.jpg (clip B).
  2. Với mỗi clip, mỗi session (u2net, u2netp), mỗi max-side (480, 640):
     chạy bgremove.py mode=mask với --temporal 0 --feather 0 (mask THÔ,
     so sánh công bằng giữa 2 model) — đo wall time, s/frame, fps,
     đỉnh RSS (wait4 rusage), loadavg đầu/cuối.
  3. Clip A @480 thêm mode=alpha cho cả 2 session — so sánh kênh alpha
     LOSSLESS (alpha.mov là PNG) bên cạnh so sánh mask.mp4 (x264 crf 18,
     có nhiễu nén nhỏ — ghi rõ trong LIMITS).
  4. So sánh từng frame: IoU@128, MAD (/255), % pixel |diff|>32,
     fg% (>200) mỗi bên. Assert mask có cả đen lẫn trắng, temporal
     coherence < 5.0 (video tĩnh).
  5. In bảng tổng hợp + ghi JSON kết quả vào <workdir>/results.json.

Tiêu chí thay thế (ghi trong docs/PHASE9_ROUND77_E4_U2NETP_LIMITS.md):
  tốc độ u2netp >= u2net; RSS đỉnh <= u2net; mean IoU@128 >= 0.85;
  MAD <= 15/255; fg% u2netp không thấp hơn u2net quá 8 điểm phần trăm
  (mask mỏng hơn nhiều = cắt hẹp vào người — D7 đã cảnh báo).
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
SCRATCH = os.path.expanduser("~/workspace/scratch-bgremove")
MODEL_DIR = os.path.expanduser("~/.u2net")
CLIPS = {"A-person": "person.jpg", "B-p1": "p_1.jpg"}
SESSIONS = ["u2net", "u2netp"]
MAX_SIDES = [480, 640]
FRAMES = 90


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


def make_test_video(out_path, person_jpg):
    sh(["ffmpeg", "-y", "-v", "error",
        "-loop", "1", "-i", person_jpg,
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
    # Không dùng communicate(): nó reap child, làm os.wait4 mất rusage
    # theo từng run. Redirect stderr ra file rồi wait4 trực tiếp.
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


def read_alpha_frames(path):
    """Đọc kênh alpha lossless từ alpha.mov (PNG) qua ffmpeg rawvideo rgba."""
    r = sh(["ffprobe", "-v", "error", "-show_entries", "stream=width,height",
            "-of", "csv=p=0", path])
    w, h = (int(x) for x in r.stdout.strip().split(",")[:2])
    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path,
         "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
        capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(f"Không đọc được alpha.mov: {path}")
    n = len(p.stdout) // (w * h * 4)
    arr = np.frombuffer(p.stdout, dtype=np.uint8).reshape(n, h, w, 4)
    return [arr[i, :, :, 3] for i in range(n)]


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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", default=os.path.expanduser("~/workspace/.tmp-r77e4"))
    args = ap.parse_args()
    os.makedirs(args.workdir, exist_ok=True)

    results = {"runs": [], "mask_stats": {}, "comparisons": []}
    videos = {}
    for clip, img in CLIPS.items():
        src = os.path.join(SCRATCH, img)
        assert os.path.exists(src), f"Không thấy ảnh mẫu: {src}"
        v = os.path.join(args.workdir, f"{clip}.mp4")
        make_test_video(v, src)
        videos[clip] = v
        print(f"[test] video {clip}: {v} ({img})", flush=True)

    # 1) Mask runs: 2 clip x 2 session x 2 max-side
    for clip, v in videos.items():
        for ms in MAX_SIDES:
            outs = {}
            for sess in SESSIONS:
                out = os.path.join(args.workdir, f"mask-{clip}-{sess}-{ms}.mp4")
                r = run_bgremove(sess, "mask", ms, v, out)
                r["clip"] = clip
                results["runs"].append(r)
                outs[sess] = out
            fa = read_gray_frames(outs["u2net"])
            fb = read_gray_frames(outs["u2netp"])
            sa = mask_stats(fa)
            sb = mask_stats(fb)
            results["mask_stats"][f"{clip}-{ms}-u2net"] = sa
            results["mask_stats"][f"{clip}-{ms}-u2netp"] = sb
            print(f"[stats] {clip} max-side={ms} u2net : {sa}", flush=True)
            print(f"[stats] {clip} max-side={ms} u2netp: {sb}", flush=True)
            # Ngưỡng fg>10 của test_bgremove.py giả định ảnh chân dung
            # lấp đầy khung hình; clip vật thể chung (vd p_1.jpg: cột đèn
            # đêm) có fg thật chỉ ~4% — ghi nhận, không abort cả lượt.
            for sess, s in (("u2net", sa), ("u2netp", sb)):
                if not (s["fg_pct"] > 10 and s["bg_pct"] > 10):
                    print(f"[warn] {clip} max-side={ms} {sess}: mask fg/bg "
                          f"ngoài ngưỡng chân dung {s} — vẫn so sánh tiếp",
                          flush=True)
            assert sa["fg_pct"] > 0.5 and sa["bg_pct"] > 10, "u2net mask rỗng"
            assert sb["fg_pct"] > 0.5 and sb["bg_pct"] > 10, "u2netp mask rỗng"
            assert sa["mean_interframe_diff"] < 5.0, "u2net mask giật"
            assert sb["mean_interframe_diff"] < 5.0, "u2netp mask giật"
            results["comparisons"].append(
                compare_masks(fa, fb, f"mask {clip} max-side={ms}"))

    # 2) Alpha runs clip A @480 — so sánh lossless + kiểm tra alpha thật
    outs = {}
    for sess in SESSIONS:
        out = os.path.join(args.workdir, f"alpha-A-person-{sess}-480.mov")
        r = run_bgremove(sess, "alpha", 480, videos["A-person"], out)
        r["clip"] = "A-person"
        results["runs"].append(r)
        outs[sess] = out
        pr = sh(["ffprobe", "-v", "error", "-show_entries", "stream=pix_fmt",
                 "-of", "csv=p=0", out])
        pix_fmt = pr.stdout.strip().split("\n")[0]
        print(f"[alpha] {sess} pix_fmt={pix_fmt}", flush=True)
        assert "a" in pix_fmt and pix_fmt != "yuv420p", f"{sess}: output thiếu alpha"
    fa = read_alpha_frames(outs["u2net"])
    fb = read_alpha_frames(outs["u2netp"])
    results["comparisons"].append(
        compare_masks(fa, fb, "alpha-channel A-person max-side=480 (lossless PNG)"))
    for sess, fr in (("u2net", fa), ("u2netp", fb)):
        a = np.stack(fr)
        print(f"[alpha-stats] {sess}: transparent(<55)="
              f"{float((a < 55).mean() * 100):.1f}% "
              f"opaque(>200)={float((a > 200).mean() * 100):.1f}%", flush=True)

    with open(os.path.join(args.workdir, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    print("\n✅ TEST XONG — xem results.json trong", args.workdir, flush=True)


if __name__ == "__main__":
    main()
