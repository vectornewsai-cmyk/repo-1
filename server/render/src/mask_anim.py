#!/usr/bin/env python3
"""mask_anim.py — Vẽ video mask animation cho mask keyframes (Phase 9 D4).

Mask tĩnh (Phase 9 R2) vẽ 1 PNG rồi lặp vô hạn qua movie+blend. Mask có
keyframes cần alpha THAY ĐỔI theo thời gian nên vẽ N frame (mỗi frame =
hình học mask nội suy tuyến tính tại thời điểm frame đó) rồi encode thành
video grayscale lossless (ffv1, pix_fmt gray) để render.js dùng chung đường
movie+blend+alphamerge — KHÔNG dùng geq chậm tính từng pixel mỗi frame.

Nội suy mirror CHÍNH XÁC interpolateMaskAt() ở packages/video-spec/src/
mask.ts và server/render/src/mask.js: tuyến tính giữa 2 keyframe kề,
giữ nguyên (hold) trước keyframe đầu / sau keyframe cuối. Keyframes đầu
vào được sắp theo t, trùng t thì sau thắng (giống normalizeMask).

Đồng bộ frame: frame i ứng với thời gian cục bộ t = i / fps (0 = clip
bắt đầu trên timeline, khớp unit sau trim/setpts + fps trong render.js).
Số frame n = round(duration × fps) — render.js chặn thêm bằng
trim=end_frame=n nên video không bao giờ dài hơn unit (tránh tràn sang
clip kề); nếu unit dài hơn do làm tròn, blend repeat frame mask cuối
(hold đúng).

Cách dùng:
  python3 mask_anim.py --shape rect --feather 0.2 --width 1280 --height 720 \\
      --fps 30 --duration 2 --keyframes '[{"t":0,"x":0.2,"y":0.5,"w":0.4,"h":0.4},
      {"t":2,"x":0.8,"y":0.5,"w":0.4,"h":0.4}]' --out /tmp/maskanim.mkv

Thất bại (thiếu PIL/numpy/ffmpeg, tham số sai) → exit != 0, render.js
fallback về PNG tĩnh tại t=0 rồi geq, KHÔNG fail job. Thư mục frame tạm
chỉ bị xoá khi encode thành công (giữ lại để debug khi lỗi, giống pattern
PNG text SR / mask PNG của R2).
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mask_png  # noqa: E402


def sort_keyframes(kfs):
    """Sắp theo t, trùng t thì sau thắng (mirror sortMaskKeyframes)."""
    out = []
    for kf in sorted(kfs, key=lambda k: k["t"]):
        if out and out[-1]["t"] == kf["t"]:
            out[-1] = dict(kf)
        else:
            out.append(dict(kf))
    return out


def interpolate(kfs, t):
    """Nội suy tuyến tính {x,y,w,h} tại t (kfs đã sắp, >= 1 phần tử)."""
    if t <= kfs[0]["t"]:
        k = kfs[0]
        return (k["x"], k["y"], k["w"], k["h"])
    if t >= kfs[-1]["t"]:
        k = kfs[-1]
        return (k["x"], k["y"], k["w"], k["h"])
    for a, b in zip(kfs, kfs[1:]):
        if a["t"] <= t <= b["t"]:
            f = 0.0 if b["t"] == a["t"] else (t - a["t"]) / (b["t"] - a["t"])
            return (
                a["x"] + (b["x"] - a["x"]) * f,
                a["y"] + (b["y"] - a["y"]) * f,
                a["w"] + (b["w"] - a["w"]) * f,
                a["h"] + (b["h"] - a["h"]) * f,
            )
    k = kfs[-1]
    return (k["x"], k["y"], k["w"], k["h"])


def main(argv=None):
    ap = argparse.ArgumentParser(description="Vẽ video mask animation (ffv1 gray).")
    ap.add_argument("--shape", choices=["rect", "ellipse"], required=True)
    ap.add_argument("--feather", type=float, required=True)
    ap.add_argument("--invert", action="store_true")
    ap.add_argument("--width", type=int, required=True)
    ap.add_argument("--height", type=int, required=True)
    ap.add_argument("--fps", type=float, required=True)
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--keyframes", required=True,
                    help="JSON array [{t,x,y,w,h}, ...], t giây tương đối từ clip.start")
    ap.add_argument("--ffmpeg", default="ffmpeg")
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    if not (0 <= args.feather <= 1):
        print("feather phải trong 0..1", file=sys.stderr)
        return 2
    if args.width <= 0 or args.height <= 0 or args.fps <= 0 or args.duration <= 0:
        print("width/height/fps/duration phải > 0", file=sys.stderr)
        return 2
    try:
        kfs = sort_keyframes(json.loads(args.keyframes))
    except (ValueError, KeyError, TypeError) as e:
        print(f"keyframes JSON không hợp lệ: {e}", file=sys.stderr)
        return 2
    if not kfs:
        print("cần ít nhất 1 keyframe", file=sys.stderr)
        return 2
    for kf in kfs:
        if kf["t"] < 0 or kf["w"] <= 0 or kf["h"] <= 0:
            print(f"keyframe không hợp lệ: {kf}", file=sys.stderr)
            return 2

    try:
        from PIL import Image
    except ImportError:
        print("thiếu Pillow (PIL)", file=sys.stderr)
        return 2

    n = max(1, round(args.duration * args.fps))
    tmpdir = tempfile.mkdtemp(prefix="repo1-maskan-frames-")
    try:
        for i in range(n):
            x, y, w, h = interpolate(kfs, i / args.fps)
            data = mask_png.render(args.width, args.height, args.shape,
                                   x, y, w, h, args.feather, args.invert)
            img = Image.frombytes("L", (args.width, args.height), data)
            img.save(os.path.join(tmpdir, f"frame_{i:05d}.png"))
        cmd = [
            args.ffmpeg, "-y",
            "-framerate", str(args.fps),
            "-i", os.path.join(tmpdir, "frame_%05d.png"),
            "-c:v", "ffv1", "-pix_fmt", "gray",
            args.out,
        ]
        r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if r.returncode != 0:
            print(f"ffmpeg encode mask anim thất bại: "
                  f"{r.stderr.decode(errors='replace')[-500:]}", file=sys.stderr)
            print(f"(giữ frame tạm để debug: {tmpdir})", file=sys.stderr)
            return 3
    except Exception as e:  # noqa: BLE001 — báo lỗi rồi fallback ở render.js
        print(f"mask_anim thất bại: {e} (giữ frame tạm: {tmpdir})", file=sys.stderr)
        return 3
    shutil.rmtree(tmpdir, ignore_errors=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
