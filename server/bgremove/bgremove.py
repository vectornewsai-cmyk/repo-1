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
# Session rembg nặng RAM — trên máy 8GB, birefnet-general từng bị kernel
# OOM-kill (SIGKILL, xem BGREMOVE_LIMITS.md). Khi các session này lỗi,
# tự fallback sang u2net (nhẹ hơn nhiều, vẫn MIT) thay vì báo lỗi khô.
BIREFNET_SESSIONS = {"birefnet-general", "birefnet-general-lite"}
FALLBACK_SESSION = "u2net"


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
    p.add_argument("--no-fallback", action="store_true",
                   help="Tắt fallback tự động sang u2net khi session birefnet lỗi "
                        "(mặc định: bật — xem BGREMOVE_LIMITS.md)")
    return p.parse_args(argv)


def _fail(msg):
    """Lỗi chạy: raise thay vì sys.exit để main() bắt được và fallback."""
    raise RuntimeError(msg)


def run_once(args, session_name):
    """Chạy toàn bộ pipeline xóa nền với 1 session. Raise khi lỗi.

    Được tách riêng để main() thử lại từ đầu bằng u2net khi session
    birefnet lỗi: session, VideoCapture và writer ffmpeg đều mở lại mới,
    file output dở dang của lần trước đã bị main() xóa trước khi retry.
    """
    import cv2
    import numpy as np
    from PIL import Image

    if args.model_dir:
        os.environ["U2NET_HOME"] = args.model_dir

    try:
        from rembg import new_session
    except ImportError:
        _fail("Thiếu rembg. Cài: pip install \"rembg[cpu]\"  (xem requirements.txt)")

    print(f"[bgremove] khởi tạo session '{session_name}'...", file=sys.stderr, flush=True)
    session = new_session(session_name)

    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        _fail(f"Không mở được video: {args.input}")
    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps != fps:
        fps = 30.0
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    ok, frame = cap.read()
    if not ok:
        _fail("Video đầu vào không có frame nào.")

    ih, iw = frame.shape[:2]
    scale = 1.0
    if args.max_side > 0 and max(iw, ih) > args.max_side:
        scale = args.max_side / max(iw, ih)
    w, h = (int(iw * scale) // 2) * 2, (int(ih * scale) // 2) * 2

    try:
        bg_rgb = tuple(int(x) for x in args.bg.split(","))
        assert len(bg_rgb) == 3
    except Exception:
        _fail("--bg phải có dạng R,G,B, ví dụ 0,177,64")

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
        _fail("Không tìm thấy ffmpeg trong PATH.")

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
    # Marker machine-readable cho bridge/MCP: session thực sự đã dùng.
    print(f"[bgremove] session_used={session_name}", file=sys.stderr, flush=True)


def _remove_partial(path):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


def decide_fallback(requested, fallback_enabled=True):
    """Logic fallback thuần (để test không cần rembg): trả về session
    fallback ("u2net") nếu requested là birefnet và fallback đang bật,
    ngược lại None. --no-fallback hoặc session đã là u2net → không retry."""
    if not fallback_enabled:
        return None
    if requested.strip().lower() in BIREFNET_SESSIONS:
        return FALLBACK_SESSION
    return None


def main(argv=None):
    args = parse_args(argv)

    if args.session.strip().lower() in FORBIDDEN_SESSIONS:
        sys.exit(
            f"Session '{args.session}' BỊ CẤM: weights non-commercial, "
            "không được dùng trong repo MIT này. Dùng 'birefnet-general'."
        )

    requested = args.session.strip().lower()
    fallback = decide_fallback(requested, fallback_enabled=not args.no_fallback)

    try:
        run_once(args, requested)
        return
    except (Exception, SystemExit) as e:
        first_err = e.code if isinstance(e, SystemExit) else str(e)
        if not first_err:
            first_err = f"exit {e.code}"
        if not fallback:
            _remove_partial(args.output)
            sys.exit(f"Xóa nền thất bại (session {requested}): {first_err}")
        # Fallback: chạy lại từ đầu bằng u2net, báo rõ trên stderr.
        print(f"[bgremove] FALLBACK session={requested} -> {fallback} "
              f"(lý do: {first_err})", file=sys.stderr, flush=True)
        _remove_partial(args.output)
        try:
            run_once(args, fallback)
        except (Exception, SystemExit) as e2:
            second_err = e2.code if isinstance(e2, SystemExit) else str(e2)
            _remove_partial(args.output)
            sys.exit(
                f"Xóa nền thất bại cả 2 session ({requested} lỗi: {first_err}; "
                f"{fallback} lỗi: {second_err}). Thử video ngắn hơn hoặc "
                "chạy trực tiếp với --session u2net."
            )
        # Marker fallback cho bridge/MCP (ngoài session_used= của run_once).
        print(f"[bgremove] fallback_from={requested}", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
