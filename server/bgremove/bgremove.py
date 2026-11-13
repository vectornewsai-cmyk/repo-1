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

# Phase 9 đợt 88 P7 — RAM guard cho session birefnet (nợ N4 đợt 86,
# xem docs/PHASE9_ROUND86_N4_BIREFNET_SHIP_LIMITS.md §5.2): birefnet-general
# chưa có lần chạy thành công nào trong gói — 6 lần chết SIGKILL liên tiếp
# (nghi OOM-kill) vì đỉnh RSS 2,62 GB (standalone, đã tắt ORT arena) tới
# 3,8 GB (in-app, spike lúc predict frame đầu) trong khi RAM khả dụng của
# VM trong giờ vòng lặp chỉ 0,6–5,5 GB. Guard đo MemAvailable TRƯỚC khi
# khởi tạo session; dưới ngưỡng thì chuyển u2net ngay thay vì đợi vài phút
# rồi chết SIGKILL mới fallback.
# Ngưỡng mặc định 6144 MB (≈ 6 GB) — cách chọn (ghi rõ để đợt sau đối chiếu):
#   đỉnh RSS birefnet đã đo ......... 2,62–3,81 GB
# + Electron + bridge (trong gói) ... ~1 GB
# + OS + tiến trình khác ............ ~0,5 GB
# + biên an toàn ................... ~0,5–1 GB (MemAvailable dao động mạnh
#                                    theo tải các luồng khác trong giờ vòng lặp)
# ≈ 5,6–6,3 GB → làm tròn 6 GB. Override bằng --min-ram-mb /
# env BGREMOVE_MIN_RAM_MB; tắt hẳn bằng --no-ram-guard.
DEFAULT_MIN_RAM_MB = 6144


def get_mem_available_mb(meminfo_path="/proc/meminfo"):
    """Đọc MemAvailable (MB) từ /proc/meminfo (Linux). Trả về int hoặc
    None nếu không đọc được (không phải Linux, /proc không có, parse lỗi)
    — caller quyết định: không đo được thì cho chạy tiếp + warn (không
    chặn oan). MemAvailable đã trừ cache có thể thu hồi nên là số đo đúng
    cho "còn bao nhiêu RAM thật sự dùng được"."""
    try:
        with open(meminfo_path, encoding="utf-8") as f:
            for line in f:
                if line.startswith("MemAvailable:"):
                    parts = line.split()
                    return int(parts[1]) // 1024
    except (OSError, ValueError, IndexError):
        return None
    return None


def ram_guard_decision(session_name, mem_available_mb, min_ram_mb=DEFAULT_MIN_RAM_MB):
    """Quyết định guard thuần (không đọc /proc — test được trực tiếp).
    Trả về dict {action, available_mb, min_mb, reason}:
      - "allow": session không phải birefnet, hoặc đủ RAM.
      - "allow-unknown": không đo được RAM → cho chạy tiếp, warn.
      - "fallback": session birefnet + RAM dưới ngưỡng → chuyển u2net ngay.
    """
    s = (session_name or "").strip().lower()
    if s not in BIREFNET_SESSIONS:
        return {"action": "allow", "available_mb": mem_available_mb,
                "min_mb": min_ram_mb, "reason": "session không phải birefnet"}
    if mem_available_mb is None:
        return {"action": "allow-unknown", "available_mb": None,
                "min_mb": min_ram_mb,
                "reason": "không đo được RAM khả dụng — cho chạy tiếp, có thể OOM-kill"}
    if mem_available_mb >= min_ram_mb:
        return {"action": "allow", "available_mb": mem_available_mb,
                "min_mb": min_ram_mb, "reason": "đủ RAM"}
    return {"action": "fallback", "available_mb": mem_available_mb,
            "min_mb": min_ram_mb,
            "reason": f"RAM khả dụng {mem_available_mb} MB < ngưỡng {min_ram_mb} MB"}


def resolve_min_ram_mb(args):
    """Ngưỡng RAM guard hiệu lực (MB): --no-ram-guard hoặc --min-ram-mb 0
    → 0 (tắt); --min-ram-mb > 0 thắng env BGREMOVE_MIN_RAM_MB; env thắng
    mặc định. Giá trị env lỗi/không hợp lệ → mặc định (không crash)."""
    if getattr(args, "no_ram_guard", False):
        return 0
    if getattr(args, "min_ram_mb", None) is not None:
        return max(0, int(args.min_ram_mb))
    try:
        v = int(os.environ.get("BGREMOVE_MIN_RAM_MB", ""))
        if v >= 0:
            return v
    except ValueError:
        pass
    return DEFAULT_MIN_RAM_MB


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
    # Phase 9 đợt 88 P7 — RAM guard (nợ N4 đợt 86): ngưỡng RAM khả dụng
    # tối thiểu để chạy session birefnet; dưới ngưỡng thì chuyển u2net
    # ngay thay vì thử rồi chết SIGKILL (xem DEFAULT_MIN_RAM_MB).
    p.add_argument("--min-ram-mb", type=int, default=None,
                   help="Ngưỡng RAM khả dụng tối thiểu (MB) để chạy session "
                        "birefnet (mặc định 6144; env BGREMOVE_MIN_RAM_MB; "
                        "0 = tắt guard)")
    p.add_argument("--no-ram-guard", action="store_true",
                   help="Tắt RAM guard cho session birefnet (chạy thẳng, "
                        "có thể bị OOM-kill trên máy ít RAM)")
    # Phase 9 đợt 2 — mượt matte theo thời gian (xem BGREMOVE_LIMITS.md §2.5):
    # EMA giữa các frame chống nhấp nháy + feather viền bằng box blur
    # numpy thuần (không cần cv2) để test được mà không cần rembg/model.
    p.add_argument("--temporal", type=_temporal_arg, default=0.4,
                   help="Trọng số frame trước trong EMA alpha (0 = tắt, "
                        "mặc định 0.4; cắt cảnh tự reset, không kéo bóng ma)")
    p.add_argument("--feather", type=_feather_arg, default=1,
                   help="Bán kính feather viền alpha, px ở độ phân giải xử lý "
                        "(0 = tắt, mặc định 1)")
    p.add_argument("--scene-cut", type=_scene_cut_arg, default=0.30,
                   help="Ngưỡng mean |diff| alpha (0–1) để coi là cắt cảnh và "
                        "reset EMA (mặc định 0.30)")
    return p.parse_args(argv)


def _temporal_arg(s):
    v = float(s)
    if not 0.0 <= v <= 0.9:
        raise argparse.ArgumentTypeError("--temporal phải trong [0, 0.9]")
    return v


def _feather_arg(s):
    v = int(s)
    if not 0 <= v <= 8:
        raise argparse.ArgumentTypeError("--feather phải trong [0, 8]")
    return v


def _scene_cut_arg(s):
    v = float(s)
    if not 0.0 < v <= 1.0:
        raise argparse.ArgumentTypeError("--scene-cut phải trong (0, 1]")
    return v


def smooth_alpha(prev, cur, strength, scene_cut=0.30):
    """EMA 1 bước cho alpha matte (float 0–1, cùng shape).

    - prev None → trả cur nguyên (frame đầu, không có gì để mượt).
    - mean |cur - prev| > scene_cut → coi là cắt cảnh, trả cur nguyên
      (không kéo bóng ma của cảnh cũ sang cảnh mới).
    - Ngược lại: out = strength*prev + (1-strength)*cur.
    Thuần numpy, không cần cv2/rembg — test được độc lập.
    """
    import numpy as np
    cur = np.asarray(cur, dtype=np.float32)
    if prev is None or strength <= 0.0:
        return cur
    prev = np.asarray(prev, dtype=np.float32)
    if prev.shape != cur.shape:
        return cur
    if float(np.mean(np.abs(cur - prev))) > scene_cut:
        return cur
    return (strength * prev + (1.0 - strength) * cur).astype(np.float32)


def feather_alpha(alpha, radius):
    """Làm mềm viền alpha bằng box blur tách được (numpy thuần).

    radius=0 → trả nguyên. Blur 2 lần (ngang + dọc) với kernel (2r+1);
    biên dùng edge-padding nên vùng phẳng xa viền không đổi. Đây là
    box blur, KHÔNG phải guided filter — trung thực ghi rõ ở LIMITS.
    """
    import numpy as np
    a = np.asarray(alpha, dtype=np.float32)
    if radius <= 0:
        return a
    k = 2 * radius + 1
    pad = radius
    padded = np.pad(a, pad, mode="edge")
    # Blur ngang: cumsum theo trục 1.
    c = np.cumsum(padded, axis=1, dtype=np.float32)
    c = np.concatenate([np.zeros((c.shape[0], 1), np.float32), c], axis=1)
    horiz = (c[:, k:] - c[:, :-k]) / k
    # Đợt 42 X3: KHÔNG pad thêm hàng trước blur dọc — blur ngang không đổi
    # số hàng nên horiz vẫn còn H+2r hàng đã edge-pad từ lần pad đầu; pad
    # thêm sẽ làm kết quả thừa 2r hàng (540→542 với r=1) và dstack với
    # frame gốc lỗi shape ở mode alpha. Không pad: (H+2r+1)-k = H, đúng.
    c2 = np.cumsum(horiz, axis=0, dtype=np.float32)
    c2 = np.concatenate([np.zeros((1, c2.shape[1]), np.float32), c2], axis=0)
    return ((c2[k:, :] - c2[:-k, :]) / k).astype(np.float32)


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
    elif os.environ.get("VCUT_MODELS_DIR"):
        # ROUND52-I5: app đóng gói đặt VCUT_MODELS_DIR=userData/models —
        # model BiRefNet tải riêng về <đó>/bgremove (resources AppImage chỉ
        # đọc). --model-dir / BGREMOVE_MODEL_DIR (bridge) vẫn thắng env.
        os.environ["U2NET_HOME"] = os.path.join(os.environ["VCUT_MODELS_DIR"], "bgremove")

    try:
        from rembg import new_session
    except ImportError:
        _fail("Thiếu rembg. Cài: pip install \"rembg[cpu]\"  (xem requirements.txt)")

    # N4 đợt 86 — giảm đỉnh RSS cho session birefnet (đo thật, xem
    # docs/PHASE9_ROUND86_N4_BIREFNET_SHIP_LIMITS.md): birefnet-general cần
    # ~4,5–4,7 GB RSS đỉnh (model 973 MB + arena ONNX Runtime) và bị kernel
    # OOM-kill (SIGKILL) trên VM 8 GB khi RAM khả dụng chỉ ~1–2,5 GB — 3 lần
    # chết liên tiếp (M6 đợt 85 trong gói, N4 attempt 2 trong gói, N4
    # standalone không Electron). Tắt CPU memory arena + memory pattern của
    # ONNX Runtime cho session birefnet để RSS bám theo bộ nhớ sống thay vì
    # giữ lại block đã giải phóng. Chỉ áp cho session birefnet (u2net nhẹ,
    # giữ nguyên hành vi). rembg.new_session nhận sess_opts (ort 1.23.2).
    sess_opts = None
    if session_name in BIREFNET_SESSIONS:
        try:
            import onnxruntime as ort
            sess_opts = ort.SessionOptions()
            sess_opts.enable_cpu_mem_arena = False
            sess_opts.enable_mem_pattern = False
            print("[bgremove] birefnet low-memory: cpu_mem_arena=off, "
                  "mem_pattern=off", file=sys.stderr, flush=True)
        except Exception as e:  # noqa: BLE001 — không đặt được thì chạy mặc định
            print(f"[bgremove] không đặt được session options ({e}) — "
                  "chạy mặc định", file=sys.stderr, flush=True)
            sess_opts = None

    print(f"[bgremove] khởi tạo session '{session_name}'...", file=sys.stderr, flush=True)
    session = (new_session(session_name, sess_opts=sess_opts)
               if sess_opts is not None else new_session(session_name))

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
    prev_alpha = None  # Phase 9 đợt 2: EMA theo thời gian (float 0–1, HxW)
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
            # Phase 9 đợt 2: EMA chống nhấp nháy rồi feather viền, trước
            # khi đưa alpha vào mọi mode (mask/composite/alpha dùng chung).
            raw_alpha = mask_np.astype(np.float32) / 255.0
            smoothed = smooth_alpha(prev_alpha, raw_alpha,
                                    getattr(args, "temporal", 0.4),
                                    getattr(args, "scene_cut", 0.30))
            smoothed = feather_alpha(smoothed, getattr(args, "feather", 1))
            prev_alpha = smoothed
            mask_np = np.clip(np.rint(smoothed * 255.0), 0, 255).astype(np.uint8)
            alpha = smoothed[..., None]

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

    # Phase 9 đợt 88 P7 — RAM guard: chỉ áp cho session birefnet, chạy
    # TRƯỚC khi khởi tạo session (run_once import rembg + load model 973 MB
    # nên guard phải chặn ở đây, không phải trong run_once). Không đo được
    # RAM → warn rồi cho chạy tiếp (không chặn oan).
    min_ram_mb = resolve_min_ram_mb(args)
    guard_from = None
    if requested in BIREFNET_SESSIONS and min_ram_mb > 0:
        avail = get_mem_available_mb()
        decision = ram_guard_decision(requested, avail, min_ram_mb)
        if decision["action"] == "allow-unknown":
            print(f"[bgremove] RAM_GUARD warn: {decision['reason']} "
                  f"(ngưỡng {min_ram_mb} MB) — vẫn thử {requested}",
                  file=sys.stderr, flush=True)
        elif decision["action"] == "fallback":
            if not fallback:
                # --no-fallback: user cấm retry u2net → chặn thẳng, báo rõ,
                # không chạy birefnet rồi chết SIGKILL sau vài phút.
                sys.exit(
                    f"RAM_GUARD: không chạy session {requested} — "
                    f"{decision['reason']}. "
                    f"Chạy lại với --session u2net hoặc tăng RAM khả dụng."
                )
            print(f"[bgremove] RAM_GUARD session={requested} "
                  f"avail_mb={avail} min_mb={min_ram_mb} -> {fallback} "
                  f"(RAM khả dụng thấp, tránh OOM-kill — không thử {requested})",
                  file=sys.stderr, flush=True)
            # Marker machine-readable cho bridge/MCP (parseSessionMarkers
            # đọc ram_guard_* + fallback_from để báo UI lý do thật).
            print(f"[bgremove] ram_guard_from={requested}",
                  file=sys.stderr, flush=True)
            print(f"[bgremove] ram_guard_avail_mb={avail}",
                  file=sys.stderr, flush=True)
            print(f"[bgremove] ram_guard_min_mb={min_ram_mb}",
                  file=sys.stderr, flush=True)
            guard_from = requested
            requested = fallback
            fallback = None

    try:
        run_once(args, requested)
        if guard_from:
            # Marker fallback cho bridge/MCP (như đường retry sau lỗi).
            print(f"[bgremove] fallback_from={guard_from}",
                  file=sys.stderr, flush=True)
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
