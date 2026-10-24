#!/usr/bin/env python3
"""track.py — Motion tracking cho VCut Studio (Phase 8 Q5).

Track một vật thể trong video bằng OpenCV (license Apache-2.0) rồi xuất
quỹ đạo JSON để render worker gắn sticker bám theo (xem
server/render/src/tracking.js) hoặc UI vẽ xem trước.

Cách dùng:
  .venv/bin/python track.py --input video.mp4 --bbox 0.4,0.4,0.2,0.2 \\
      --start 0 --sample-fps 10 --out trajectory.json

  --bbox là hộp ban đầu theo tọa độ tương đối 0..1 (x, y, w, h), tâm hộp
  là điểm track. --start là thời điểm bắt đầu track (giây, mặc định 0).

Thuật toán (theo thứ tự ưu tiên, tự fallback nếu tracker không có sẵn):
  1. MIL (có sẵn trong opencv-python-headless 5.x, không cần model)
  2. CSRT/KCF nếu build OpenCV có (opencv-contrib cũ)
  3. Template matching (cv2.matchTemplate, luôn có trong opencv gốc):
     tìm mẫu trong cửa sổ tìm kiếm quanh vị trí trước đó.
  Đo thực tế trên video tổng hợp (xem test_track.py): template cho sai số
  trung bình 0.0035 khung hình, tốt hơn MIL — nên auto ưu tiên template
  trước MIL khi cả hai đều có (xem main()).

Khi tracker báo mất dấu: dừng lấy mẫu, đánh dấu lost=true, quỹ đạo kết
thúc ở điểm tốt cuối cùng. Render sẽ kẹp (clamp) về điểm cuối đó — KHÔNG
bịa thêm chuyển động sau khi mất dấu.

Làm mượt: trung bình trượt (moving average) trên x/y với cửa sổ --smooth
(mặc định 5 điểm) để giảm rung tracker; bản thô giữ trong `raw_points`
để đối chiếu. Điểm làm mượt vẫn giữ nguyên thời gian t của điểm gốc.
"""

import argparse
import json
import math
import sys

import cv2
import numpy as np


def make_tracker(name):
    """Tạo tracker theo tên, trả về None nếu OpenCV build này không có.
    Lưu ý: opencv-python-headless 5.x đã bỏ CSRT/KCF legacy; chỉ còn MIL
    (không cần model) và DaSiamRPN/Nano/Vit (cần model ngoài, không dùng).
    """
    try:
        if name == "csrt":
            if hasattr(cv2, "TrackerCSRT_create"):
                return cv2.TrackerCSRT_create()
            if hasattr(cv2, "legacy") and hasattr(cv2.legacy, "TrackerCSRT_create"):
                return cv2.legacy.TrackerCSRT_create()
        if name == "kcf":
            if hasattr(cv2, "TrackerKCF_create"):
                return cv2.TrackerKCF_create()
            if hasattr(cv2, "legacy") and hasattr(cv2.legacy, "TrackerKCF_create"):
                return cv2.legacy.TrackerKCF_create()
        if name == "mil":
            if hasattr(cv2, "TrackerMIL_create"):
                return cv2.TrackerMIL_create()
    except Exception:
        return None
    return None


def smooth_points(points, window):
    """Moving average trên x/y (giữ t và score của điểm gốc)."""
    if window <= 1 or len(points) < 2:
        return [dict(p) for p in points]
    half = window // 2
    out = []
    for i, p in enumerate(points):
        lo = max(0, i - half)
        hi = min(len(points), i + half + 1)
        seg = points[lo:hi]
        out.append({
            "t": p["t"],
            "x": float(np.mean([q["x"] for q in seg])),
            "y": float(np.mean([q["y"] for q in seg])),
            "score": p["score"],
        })
    return out


def track_template(cap, first_frame, bbox_px, sample_fps, fps, start, end):
    """Fallback template matching. Trả về (points, lost)."""
    x, y, w, h = bbox_px
    template = first_frame[y:y + h, x:x + w]
    if template.size == 0:
        raise ValueError("bbox ban đầu nằm ngoài khung hình")
    gray_t = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)
    points = []
    lost = False
    frame_idx = 0
    step = max(1, int(round(fps / sample_fps)))
    cx, cy = x + w / 2, y + h / 2
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        # Frame này là frame SAU frame seek (first), nên +1 trước khi tính t.
        frame_idx += 1
        t = start + frame_idx / fps
        if end is not None and t > end + 1e-9:
            break
        if frame_idx % step == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # Cửa sổ tìm kiếm: quanh vị trí trước đó, gấp 3 kích thước mẫu.
            sx = max(0, int(cx - w * 1.5))
            sy = max(0, int(cy - h * 1.5))
            ex = min(gray.shape[1], int(cx + w * 1.5))
            ey = min(gray.shape[0], int(cy + h * 1.5))
            search = gray[sy:ey, sx:ex]
            if search.shape[0] >= gray_t.shape[0] and search.shape[1] >= gray_t.shape[1]:
                res = cv2.matchTemplate(search, gray_t, cv2.TM_CCOEFF_NORMED)
                _, score, _, loc = cv2.minMaxLoc(res)
                if score < 0.3:
                    lost = True
                    break
                nx, ny = sx + loc[0], sy + loc[1]
                cx, cy = nx + w / 2, ny + h / 2
                points.append({
                    "t": round(t, 3),
                    "x": round(cx / gray.shape[1], 4),
                    "y": round(cy / gray.shape[0], 4),
                    "score": round(float(score), 3),
                })
            else:
                lost = True
                break
    return points, lost


def main():
    ap = argparse.ArgumentParser(description="Track vật thể trong video, xuất quỹ đạo JSON.")
    ap.add_argument("--input", required=True, help="File video nguồn")
    ap.add_argument("--bbox", required=True, help="Hộp ban đầu 'x,y,w,h' tương đối 0..1")
    ap.add_argument("--start", type=float, default=0.0, help="Thời điểm bắt đầu track (giây)")
    ap.add_argument("--end", type=float, default=None, help="Thời điểm kết thúc track (giây)")
    ap.add_argument("--sample-fps", type=float, default=10.0, help="Số điểm mẫu mỗi giây")
    ap.add_argument("--smooth", type=int, default=5, help="Cửa sổ làm mượt (số điểm)")
    ap.add_argument("--tracker", default="auto", choices=["auto", "csrt", "kcf", "mil", "template"],
                    help="Thuật toán track (auto thử template → mil → csrt → kcf)")
    ap.add_argument("--out", required=True, help="File JSON quỹ đạo xuất ra")
    args = ap.parse_args()

    try:
        bx, by, bw, bh = [float(v) for v in args.bbox.split(",")]
    except ValueError:
        print("LỖI: --bbox phải có dạng 'x,y,w,h' (4 số)", file=sys.stderr)
        return 2
    if not (0 <= bx < 1 and 0 <= by < 1 and 0 < bw <= 1 and 0 < bh <= 1):
        print("LỖI: bbox phải nằm trong 0..1", file=sys.stderr)
        return 2

    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        print(f"LỖI: không mở được video {args.input}", file=sys.stderr)
        return 2
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    nframes = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration = nframes / fps if nframes else 0.0
    cap.set(cv2.CAP_PROP_POS_MSEC, args.start * 1000.0)
    ok, first = cap.read()
    if not ok:
        print("LỖI: không đọc được frame tại thời điểm bắt đầu", file=sys.stderr)
        return 2
    # Sau khi seek, frame đầu tiên đọc được là mốc t = start.
    bx_px, by_px = int(bx * width), int(by * height)
    bw_px, bh_px = max(1, int(bw * width)), max(1, int(bh * height))
    bx_px = min(bx_px, width - bw_px)
    by_px = min(by_px, height - bh_px)
    if bx_px < 0 or by_px < 0 or bw_px <= 0 or bh_px <= 0:
        print("LỖI: bbox sau khi clamp vẫn không hợp lệ", file=sys.stderr)
        return 2

    tracker_name = None
    tracker = None
    # Auto: template trước (đo tốt nhất trên video tổng hợp), rồi MIL/CSRT/KCF.
    if args.tracker == "auto":
        tracker = None
        tracker_name = "opencv-template"  # template chạy ở nhánh riêng bên dưới
    else:
        if args.tracker == "csrt":
            tracker = make_tracker("csrt")
            tracker_name = "opencv-csrt" if tracker is not None else None
        elif args.tracker == "kcf":
            tracker = make_tracker("kcf")
            tracker_name = "opencv-kcf" if tracker is not None else None
        elif args.tracker == "mil":
            tracker = make_tracker("mil")
            tracker_name = "opencv-mil" if tracker is not None else None
        elif args.tracker == "template":
            tracker = None
            tracker_name = "opencv-template"

    points = []
    lost = False
    if tracker is not None:
        tracker.init(first, (bx_px, by_px, bw_px, bh_px))
        step = max(1, int(round(fps / args.sample_fps)))
        frame_idx = 0
        # Điểm đầu tiên = hộp ban đầu (t = start).
        points.append({
            "t": round(args.start, 3),
            "x": round((bx_px + bw_px / 2) / width, 4),
            "y": round((by_px + bh_px / 2) / height, 4),
            "score": 1.0,
        })
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame_idx += 1
            t = args.start + frame_idx / fps
            if args.end is not None and t > args.end + 1e-9:
                break
            ok, box = tracker.update(frame)
            if not ok:
                lost = True
                break
            if frame_idx % step == 0:
                tx, ty, tw, th = box
                points.append({
                    "t": round(t, 3),
                    "x": round(max(0.0, min(1.0, (tx + tw / 2) / width)), 4),
                    "y": round(max(0.0, min(1.0, (ty + th / 2) / height)), 4),
                    "score": 1.0,
                })
    else:
        tracker_name = "opencv-template"
        points, lost = track_template(cap, first, (bx_px, by_px, bw_px, bh_px),
                                       args.sample_fps, fps, args.start, args.end)
        # Template path: điểm đầu tiên chưa có (vòng lặp bắt đầu từ frame sau
        # seek) nên thêm điểm gốc vào đầu nếu chưa có.
        if not points or points[0]["t"] > args.start + 1e-9:
            points.insert(0, {
                "t": round(args.start, 3),
                "x": round((bx_px + bw_px / 2) / width, 4),
                "y": round((by_px + bh_px / 2) / height, 4),
                "score": 1.0,
            })
    cap.release()

    smoothed = smooth_points(points, args.smooth)
    out = {
        "version": 1,
        "source": tracker_name,
        "video": args.input,
        "width": width,
        "height": height,
        "fps": fps,
        "sample_fps": args.sample_fps,
        "start": args.start,
        "end": args.end,
        "duration": duration,
        "lost": lost,
        "points": smoothed,
        "raw_points": points,
    }
    with open(args.out, "w") as f:
        json.dump(out, f, indent=2)
    print(f"track xong: {len(points)} điểm thô, {len(smoothed)} điểm mượt, "
          f"tracker={tracker_name}, lost={lost} -> {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
