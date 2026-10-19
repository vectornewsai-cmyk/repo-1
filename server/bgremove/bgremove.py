#!/usr/bin/env python3
"""
AI background removal (xóa nền video) LOCAL cho VCut Studio.

    python bgremove.py --input in.mp4 --output out_alpha.mov
    python bgremove.py --input in.mp4 --output mask.mp4 --mode mask
    python bgremove.py --input in.mp4 --output preview.mp4 --mode composite --bg 0,177,64

- 100% local: rembg + ONNX Runtime CPU, KHÔNG gọi API cloud nào.
- Stack giấy phép (đã kiểm chứng trực tiếp ngày 2026-10-19):
    * rembg 2.0.38 — MIT (PyPI classifier "License :: OSI Approved :: MIT License")
    * BiRefNet (gốc của weights birefnet-general) — MIT
      (GitHub API repos/ZhengPeng7/BiRefNet/license -> key "mit")
    * File ONNX birefnet-general do chính project rembg (MIT) phân phối
      qua GitHub releases của danielgatis/rembg.
  => AN TOÀN cho repo MIT, dùng được thương mại.
- BẪY LICENSE ĐÃ TRÁNH: preset bria-rmbg / RMBG-2.0 của rembg là weights
  NON-COMMERCIAL — TUYỆT ĐỐI KHÔNG dùng (dù chất lượng cao). Script này
  mặc định session "birefnet-general" và từ chối chạy nếu session là bria.
- Đầu ra:
    * mode "alpha": MOV PNG có kênh alpha (rgba, lossless) — nối thẳng render worker
      (không dùng WebM VP9 vì build ffmpeg hiện tại lặng lẽ bỏ alpha khi encode VP9)
    * mode "mask":  video grayscale của alpha matte
    * mode "composite": video ghép lên nền màu tùy chọn (để xem trước)
"""

import argparse
import os
import subprocess
import sys

FORBIDDEN_SESSIONS = {"bria-rmbg", "rmbg-2.0", "bria"}
DEFAULT_SESSION = "birefnet-general"


def parse_args(argv=None):
    p = argparse.ArgumentParser(description="AI background removal local (rembg)")
    p.add_argument("--input", required=True, help="Video đầu vào")
    p.add_argument("--output", required=True, help="Video đầu ra")
    p.add_argument("--session", default=DEFAULT_SESSION,
                   help=f"rembg session (mặc định {DEFAULT_SESSION}; "
                        "CẤM bria-rmbg/rmbg-2.0 vì non-commercial)")
    p.add_argument("--mode", default="alpha", choices=["alpha", "mask", "composite"],
                   help="alpha: MOV PNG có alpha | mask: matte grayscale | composite: ghép nền")
    p.add_argument("--bg", default="0,177,64",
                   help="Màu nền cho mode composite, dạng R,G,B (mặc định xanh lá)")
    p.add_argument("--max-side", type=int, default=960,
                   help="Thu nhỏ cạnh dài về tối đa bấy nhiêu px để chạy nhanh (0 = giữ nguyên)")
    p.add_argument("--model-dir", default=None,
                   help="Thư mục chứa/tải model (mặc định ~/.u2net của rembg)")
    return p.parse_args(argv)


def main(argv=None):
    import cv2
    import numpy as np
    from PIL import Image

    args = parse_args(argv)

    if args.session.strip().lower() in FORBIDDEN_SESSIONS:
        sys.exit(
            f"Session '{args.session}' BỊ CẤM: weights non-commercial, "
            "không được dùng trong repo MIT này. Dùng 'birefnet-general'."
        )

    if args.model_dir:
        os.environ["U2NET_HOME"] = args.model_dir

    try:
        from rembg import new_session
    except ImportError:
        sys.exit("Thiếu rembg. Cài: pip install \"rembg[cpu]\"  (xem requirements.txt)")

    print(f"[bgremove] khởi tạo session '{args.session}'...", file=sys.stderr, flush=True)
    session = new_session(args.session)

    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        sys.exit(f"Không mở được video: {args.input}")
    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps != fps:
        fps = 30.0
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    ok, frame = cap.read()
    if not ok:
        sys.exit("Video đầu vào không có frame nào.")

    ih, iw = frame.shape[:2]
    scale = 1.0
    if args.max_side > 0 and max(iw, ih) > args.max_side:
        scale = args.max_side / max(iw, ih)
    w, h = (int(iw * scale) // 2) * 2, (int(ih * scale) // 2) * 2

    try:
        bg_rgb = tuple(int(x) for x in args.bg.split(","))
        assert len(bg_rgb) == 3
    except Exception:
        sys.exit("--bg phải có dạng R,G,B, ví dụ 0,177,64")

    if args.mode == "alpha":
        # PNG trong MOV: giữ alpha lossless.
        cmd = ["ffmpeg", "-y", "-v", "error",
               "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{w}x{h}", "-r", str(fps),
               "-i", "-",
               "-c:v", "png", "-pix_fmt", "rgba",
               args.output]
    elif args.mode == "mask":
        cmd = ["ffmpeg", "-y", "-v", "error",
               "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{w}x{h}", "-r", str(fps),
               "-i", "-",
               "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
               args.output]
    else:  # composite
        cmd = ["ffmpeg", "-y", "-v", "error",
               "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(fps),
               "-i", "-",
               "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
               args.output]
    try:
        writer = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    except FileNotFoundError:
        sys.exit("Không tìm thấy ffmpeg trong PATH.")

    idx = 0
    try:
        while True:
            ok, frame = cap.read() if idx else (True, frame)
            if not ok:
                break
            if scale != 1.0:
                frame = cv2.resize(frame, (w, h), interpolation=cv2.INTER_AREA)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            # rembg session.predict nhận PIL, trả về mask PIL ("L")
            mask = session.predict(Image.fromarray(rgb))[0]
            mask_np = np.array(mask.resize((w, h), Image.Resampling.LANCZOS))
            alpha = (mask_np.astype(np.float32) / 255.0)[..., None]

            if args.mode == "mask":
                writer.stdin.write(mask_np.tobytes())
            elif args.mode == "composite":
                bg_img = np.zeros((h, w, 3), np.float32)
                bg_img[:] = np.array(bg_rgb, np.float32) / 255.0
                com = rgb.astype(np.float32) / 255.0 * alpha + bg_img * (1 - alpha)
                bgr = cv2.cvtColor((com * 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
                writer.stdin.write(bgr.tobytes())
            else:  # alpha -> RGBA
                rgba = np.dstack([rgb, mask_np])
                writer.stdin.write(rgba.tobytes())

            idx += 1
            if idx % 10 == 0 or (total and idx == total):
                pct = f"{100*idx/total:.0f}%" if total else f"{idx} frames"
                print(f"[bgremove] {idx}/{total or '?'} ({pct})",
                      file=sys.stderr, flush=True)
    finally:
        cap.release()
        try:
            writer.stdin.close()
        except BrokenPipeError:
            pass
        writer.wait()

    print(f"[bgremove] xong: {args.output} ({idx} frames)", file=sys.stderr)


if __name__ == "__main__":
    main()
