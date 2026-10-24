#!/usr/bin/env python3
"""
reframe.py — Auto-reframe: crop video ngang (16:9...) sang dọc/vuông (9:16, 1:1, 4:5)
theo dõi chủ thể, 100% local.

Cách hoạt động (2 pass, không model AI nặng):
  Pass 1 (phân tích): lấy mẫu mỗi N frame (mặc định 15) ở độ phân giải thấp:
    1. Phát hiện khuôn mặt bằng Haar cascade có sẵn của OpenCV
       (haarcascade_frontalface_default.xml — đi kèm opencv-python, license BSD).
    2. Nếu không thấy mặt → phát hiện chuyển động (frame differencing với
       background chạy) → bounding box của vùng chuyển động lớn nhất.
    3. Không thấy gì → giữ vị trí cũ / giữa khung hình.
  Pass 2 (render): nội suy tuyến tính vị trí chủ thể giữa các mẫu, làm mượt
  bằng EMA (tránh giật), crop window di chuyển theo, resize về kích thước đích,
  pipe raw frame sang ffmpeg (libx264 + AAC, copy audio từ nguồn).

  Phase 7 P6 — trajectory preview: crop window thực tế dùng khi render được
  xuất ra JSON (mỗi điểm {t, x0, y0, w, h, x_center_norm}, tọa độ pixel
  trong frame nguồn). `--analyze-only` chỉ chạy pass 1 + tính window, không
  encode — UI vẽ overlay quỹ đạo từ JSON này để user thấy trước vùng cắt
  sẽ di chuyển ra sao. Lưu ý trung thực: thuật toán chỉ track theo trục X
  (window luôn cao toàn frame); nếu nguồn đã hẹp hơn đích thì window = toàn
  frame, trajectory là hằng số (không có gì để xem trước).

Giới hạn trung thực: Haar cascade chỉ bắt mặt chính diện, đủ sáng; chuyển động
chỉ theo vùng chuyển động LỚN NHẤT (không phân biệt người/vật); không có
theo dõi đa đối tượng hay nhận diện chủ thể tĩnh không mặt.

Usage:
  python reframe.py --input in.mp4 --output out.mp4 --aspect 9:16
  python reframe.py --input in.mp4 --analyze-only --json-out traj.json --aspect 9:16
"""
from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys

import cv2
import numpy as np

ASPECTS = {
    "9:16": (9, 16),
    "1:1": (1, 1),
    "4:5": (4, 5),
}

# Kích thước đích mặc định cho từng aspect (rộng x cao).
DEFAULT_OUT_SIZE = {
    "9:16": (1080, 1920),
    "1:1": (1080, 1080),
    "4:5": (1080, 1350),
}


def eprint(*a):
    print(*a, file=sys.stderr, flush=True)


def parse_args(argv=None):
    p = argparse.ArgumentParser(description="Auto-reframe video theo chủ thể (local, OpenCV).")
    p.add_argument("--input", required=True, help="Video nguồn.")
    p.add_argument("--output", default="",
                   help="MP4 đích (bắt buộc trừ khi --analyze-only).")
    p.add_argument("--aspect", default="9:16", choices=sorted(ASPECTS),
                   help="Tỉ lệ đích (mặc định 9:16).")
    p.add_argument("--width", type=int, default=0, help="Rộng đích (0 = mặc định theo aspect).")
    p.add_argument("--height", type=int, default=0, help="Cao đích (0 = mặc định theo aspect).")
    p.add_argument("--sample-every", type=int, default=15,
                   help="Phân tích mỗi N frame (mặc định 15).")
    p.add_argument("--smooth", type=float, default=0.35,
                   help="Hệ số EMA làm mượt zero-phase 0.05..0.9 "
                        "(mặc định 0.35; càng nhỏ càng mượt, không gây trễ).")
    p.add_argument("--crf", type=int, default=20, help="CRF x264 (mặc định 20).")
    p.add_argument("--json-out", default="", help="Ghi trajectory + thống kê ra file JSON.")
    p.add_argument("--analyze-only", action="store_true",
                   help="Chỉ phân tích + tính crop window, không encode video. "
                        "Dùng để xem trước quỹ đạo (kèm --json-out).")
    p.add_argument("--traj-max-points", type=int, default=240,
                   help="Số điểm tối đa của trajectory trong JSON (mặc định 240; "
                        "lấy mẫu đều, luôn giữ điểm cuối).")
    return p.parse_args(argv)


def load_face_cascade():
    """Trả về CascadeClassifier hoặc None nếu không có file cascade."""
    try:
        cands = [
            os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml"),
        ]
        for c in cands:
            if os.path.exists(c):
                clf = cv2.CascadeClassifier(c)
                if not clf.empty():
                    return clf
    except Exception:
        pass
    return None


def detect_subject_x(face_clf, gray_small, bg, min_motion_frac=0.02):
    """Trả về (x_center_norm 0..1, kind) hoặc (None, 'none').

    kind: 'face' | 'motion' | 'none'. x_center_norm tính theo frame gốc.
    bg: background trung vị (median) của các mẫu — chủ thể di chuyển luôn
    khác bg nên không bị "bóng ma" như background chạy (accumulateWeighted).
    """
    h, w = gray_small.shape
    faces = face_clf.detectMultiScale(
        gray_small, scaleFactor=1.15, minNeighbors=4,
        minSize=(max(24, w // 12), max(24, h // 12)),
    ) if face_clf is not None else []
    if len(faces):
        # Mặt lớn nhất = chủ thể chính.
        x, y, fw, fh = max(faces, key=lambda r: r[2] * r[3])
        return ((x + fw / 2) / w, "face")

    # Fallback: chuyển động — vùng khác background lớn nhất.
    if bg is not None:
        diff = cv2.absdiff(gray_small, bg)
        _, th = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
        th = cv2.dilate(th, None, iterations=2)
        cnts, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        best = None
        best_area = 0
        for c in cnts:
            a = cv2.contourArea(c)
            if a > best_area:
                best_area = a
                best = c
        if best is not None and best_area >= min_motion_frac * w * h:
            x, y, bw, bh = cv2.boundingRect(best)
            return ((x + bw / 2) / w, "motion")
    return (None, "none")


def zero_phase_smooth(traj, alpha=0.35, passes=2):
    """Làm mượt không trễ: EMA xuôi rồi ngược (zero-phase), giữ nguyên độ dài."""
    a = min(0.9, max(0.05, alpha))
    for _ in range(passes):
        fwd = [traj[0]]
        for x in traj[1:]:
            fwd.append(a * x + (1 - a) * fwd[-1])
        bwd = [fwd[-1]]
        for x in reversed(fwd[:-1]):
            bwd.append(a * x + (1 - a) * bwd[-1])
        traj = list(reversed(bwd))
    return traj


def analyze(input_path, sample_every, smooth_alpha):
    """Pass 1: trả về dict với trajectory x_norm cho MỌI frame + thống kê."""
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError(f"Không mở được video: {input_path}")
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    face_clf = load_face_cascade()
    eprint(f"[reframe] phân tích {W}x{H} @ {fps:.2f}fps, {n} frames, "
           f"face_cascade={'có' if face_clf is not None else 'không'}")

    # Khung phân tích: co về chiều rộng tối đa 480 để nhanh.
    scale = min(1.0, 480.0 / W)
    sw, sh = max(1, int(W * scale)), max(1, int(H * scale))

    samples = []  # (frame_idx, gray_small)
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx % sample_every == 0:
            small = cv2.resize(frame, (sw, sh))
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (5, 5), 0)
            samples.append((idx, gray))
        idx += 1
    cap.release()
    total = idx
    if total == 0:
        raise RuntimeError("Video không có frame nào.")

    # Background = trung vị các mẫu: chủ thể di chuyển không "dính" vào bg,
    # phát hiện chuyển động chính xác vị trí hiện tại, không bóng ma.
    bg = None
    if samples:
        stack = np.stack([g for (_i, g) in samples], axis=0)
        bg = np.median(stack, axis=0).astype(np.uint8)

    detections = []  # (frame_idx, x_norm | None, kind)
    counts = {"face": 0, "motion": 0, "none": 0}
    for (i, gray) in samples:
        x_norm, kind = detect_subject_x(face_clf, gray, bg)
        detections.append((i, x_norm, kind))
        counts[kind] += 1

    # Dựng trajectory cho mọi frame: nội suy tuyến tính giữa các mẫu có x,
    # forward/backward fill, mặc định giữa khung.
    known = [(i, x) for (i, x, _k) in detections if x is not None]
    traj = [0.5] * total
    if known:
        # fill trước mẫu đầu và sau mẫu cuối
        first_i, first_x = known[0]
        last_i, last_x = known[-1]
        for i in range(0, first_i + 1):
            traj[i] = first_x
        for i in range(last_i, total):
            traj[i] = last_x
        for (i0, x0), (i1, x1) in zip(known, known[1:]):
            span = i1 - i0
            for i in range(i0, i1 + 1):
                t = (i - i0) / span if span else 0
                traj[i] = x0 + (x1 - x0) * t

    # Làm mượt zero-phase (EMA xuôi + ngược): crop không giật mà cũng không trễ.
    traj = zero_phase_smooth(traj, alpha=smooth_alpha)

    eprint(f"[reframe] phát hiện: face={counts['face']} motion={counts['motion']} "
           f"none={counts['none']} / {len(detections)} mẫu")
    return {
        "W": W, "H": H, "fps": fps, "total": total,
        "traj": traj, "counts": counts, "n_samples": len(detections),
    }


def compute_crop_windows(info, aspect):
    """Tính crop window thực tế cho MỌI frame từ trajectory (Phase 7 P6).

    Trả về (cw, ch, windows) với windows[i] = {frame, t, x0, y0, w, h,
    x_center_norm} — tọa độ pixel trong frame nguồn. Đây là window mà
    render() dùng thật (render gọi hàm này, không tính riêng), nên JSON
    trajectory và video render ra KHỚP nhau theo định nghĩa.
    Chú ý: chỉ track trục X; window luôn cao toàn frame (y0=0, h=H).
    Nguồn hẹp hơn đích → window = toàn frame (x0=0 hằng số).
    """
    W, H, fps, total, traj = info["W"], info["H"], info["fps"], info["total"], info["traj"]
    aw, ah = ASPECTS[aspect]
    if W / H >= aw / ah:
        ch = H
        cw = int(round(H * aw / ah))
    else:
        cw = W
        ch = int(round(W * ah / aw))
    cw = min(cw, W) // 2 * 2  # chẵn cho yuv420p
    ch = min(ch, H) // 2 * 2
    half = cw / 2
    windows = []
    for idx in range(total):
        xc_norm = traj[idx] if idx < len(traj) else 0.5
        xc = xc_norm * W
        x0 = int(round(min(max(xc - half, 0), W - cw))) if W > cw else 0
        windows.append({
            "frame": idx,
            "t": round(idx / fps, 3) if fps else idx,
            "x0": x0,
            "y0": 0,
            "w": cw,
            "h": H,
            "x_center_norm": round(xc_norm, 4),
        })
    return cw, ch, windows


def downsample_trajectory(windows, max_points):
    """Lấy mẫu đều tối đa max_points điểm, luôn giữ điểm cuối."""
    if max_points <= 0 or len(windows) <= max_points:
        return windows
    step = len(windows) / max_points
    out = [windows[int(i * step)] for i in range(max_points)]
    if out[-1] is not windows[-1]:
        out[-1] = windows[-1]
    return out


def render(input_path, output_path, info, aspect, out_w, out_h, crf):
    """Pass 2: crop theo trajectory, pipe sang ffmpeg (x264 + AAC)."""
    W, H, fps, total = info["W"], info["H"], info["fps"], info["total"]
    cw, ch, windows = compute_crop_windows(info, aspect)
    eprint(f"[reframe] crop window {cw}x{ch} → resize {out_w}x{out_h}")

    ff = [
        "ffmpeg", "-y",
        "-f", "rawvideo", "-pix_fmt", "bgr24",
        "-s", f"{out_w}x{out_h}", "-framerate", f"{fps:.3f}",
        "-i", "-",
        "-i", input_path,
        "-map", "0:v:0", "-map", "1:a:0?",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-crf", str(crf), "-preset", "veryfast",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest", "-movflags", "+faststart",
        output_path,
    ]
    proc = subprocess.Popen(ff, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    cap = cv2.VideoCapture(input_path)
    written = 0
    try:
        idx = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            # Window đã tính sẵn trong compute_crop_windows (khớp JSON).
            win = windows[idx] if idx < len(windows) else windows[-1]
            x0 = win["x0"]
            crop = frame[0:H, x0:x0 + cw]
            out = cv2.resize(crop, (out_w, out_h), interpolation=cv2.INTER_AREA)
            try:
                proc.stdin.write(out.tobytes())
            except BrokenPipeError:
                raise RuntimeError("ffmpeg đóng pipe giữa chừng (lỗi encode?).")
            written += 1
            idx += 1
            if written % max(1, total // 20) == 0:
                eprint(f"[reframe] {written}/{total} ({100*written//total}%)")
    finally:
        cap.release()
        try:
            proc.stdin.close()
        except Exception:
            pass
        rc = proc.wait()
    if rc != 0:
        raise RuntimeError(f"ffmpeg thoát mã {rc}.")
    eprint(f"[reframe] xong: {output_path} ({written} frames)")
    return {"crop_w": cw, "crop_h": ch, "frames": written}


def main(argv=None):
    args = parse_args(argv)
    if not os.path.exists(args.input):
        eprint(f"[reframe] LỖI: không tìm thấy input: {args.input}")
        return 2
    if not args.analyze_only and not args.output:
        eprint("[reframe] LỖI: cần --output trừ khi dùng --analyze-only.")
        return 2
    dw, dh = DEFAULT_OUT_SIZE[args.aspect]
    out_w = args.width or dw
    out_h = args.height or dh
    out_w = (out_w // 2) * 2
    out_h = (out_h // 2) * 2

    try:
        info = analyze(args.input, args.sample_every, args.smooth)
        cw, ch, windows = compute_crop_windows(info, args.aspect)
    except RuntimeError as e:
        eprint(f"[reframe] LỖI: {e}")
        return 1

    # Trajectory lấy mẫu đều cho JSON/preview (render vẫn dùng full list).
    trajectory = downsample_trajectory(windows, args.traj_max_points)

    if args.analyze_only:
        summary = {
            "input": args.input,
            "output": None,
            "aspect": args.aspect,
            "out_size": [out_w, out_h],
            "source_size": [info["W"], info["H"]],
            "duration_sec": round(info["total"] / info["fps"], 2),
            "detections": info["counts"],
            "crop_window": [cw, ch],
            "trajectory": trajectory,
            "trajectory_points": len(trajectory),
            "trajectory_full_frames": len(windows),
        }
        eprint(f"[reframe] analyze-only: {len(trajectory)} điểm trajectory, "
               f"window {cw}x{ch}")
        if args.json_out:
            with open(args.json_out, "w", encoding="utf-8") as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)
        print(json.dumps(summary, ensure_ascii=False))
        return 0

    try:
        stats = render(args.input, args.output, info, args.aspect, out_w, out_h, args.crf)
    except RuntimeError as e:
        eprint(f"[reframe] LỖI: {e}")
        return 1

    size = os.path.getsize(args.output) if os.path.exists(args.output) else 0
    if size == 0:
        eprint("[reframe] LỖI: output rỗng.")
        return 1
    summary = {
        "input": args.input,
        "output": args.output,
        "aspect": args.aspect,
        "out_size": [out_w, out_h],
        "source_size": [info["W"], info["H"]],
        "duration_sec": round(info["total"] / info["fps"], 2),
        "detections": info["counts"],
        "crop_window": [stats["crop_w"], stats["crop_h"]],
        "output_bytes": size,
        "trajectory": trajectory,
        "trajectory_points": len(trajectory),
        "trajectory_full_frames": len(windows),
    }
    eprint(f"[reframe] OK {out_w}x{out_h}, {size} bytes")
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
    print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
