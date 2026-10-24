#!/usr/bin/env python3
"""
Scene detection cho VCut Studio (R1-085).

    python3 scene.py --input video.mp4 --threshold 0.4 --out scenes.json

- 100% local: chỉ dùng FFmpeg (filter `select='gt(scene,...)'` + `showinfo`),
  KHÔNG gọi API cloud, KHÔNG cần model ML.
- Đầu vào: file video bất kỳ mà ffmpeg đọc được.
- Đầu ra JSON gồm:
    * "cuts": [t1, t2, ...] — timestamps (giây) của các điểm chuyển cảnh,
      đã lọc theo --start/--end và khoảng cách tối thiểu giữa 2 cảnh.
    * "duration": thời lượng video (giây, từ ffprobe).
    * "threshold": ngưỡng đã dùng.
    * "cut_candidates": số frame ứng viên mà filter select giữ lại
      TRƯỚC khi lọc start/end và gộp điểm gần nhau.

Ngưỡng (threshold): 0.05..0.95, mặc định 0.4. Ngưỡng càng thấp càng nhạy
(nhiều cảnh giả do chuyển động mạnh); càng cao càng bỏ sót cảnh chuyển nhẹ
(fade/dissolve). 0.3–0.5 hợp với đa số video quay thật.

Phase 7 P6 — pass màu phẳng (color pass): metric scene của FFmpeg cho điểm
rất thấp với cảnh màu phẳng (đỏ→xanh lá thậm chí < 0.1) nên các cắt này
luôn bị bỏ sót. Pass thứ hai lấy mẫu frame 3fps ở 32×32, tính mean RGB mỗi
frame: một điểm cắt được nhận khi (a) mean màu nhảy một bước lớn giữa 2
frame liên tiếp VÀ (b) màu ỔN ĐỊNH ở cả 2 phía (cửa sổ 3 frame mỗi phía,
lệch khỏi mean của phía mình ≤ 15/255). Điều kiện (b) loại fade/dissolve
(màu biến đổi liên tục trong cửa sổ) và chuyển động máy (mean trôi dần).
Chỉ dùng ffmpeg + stdlib (không cv2/numpy) để bridge chạy được mọi nơi.
Cắt của color pass được hợp nhất với cắt FFmpeg (trùng trong 0.5s thì giữ
timestamp FFmpeg vì chính xác tới frame). Tắt pass này bằng --no-color-pass.

Khi chạy, in các dòng "[scene] ..." ra stdout để bridge parse tiến trình.
"""

import argparse
import json
import math
import os
import re
import subprocess
import sys

DEFAULT_THRESHOLD = 0.4
MIN_THRESHOLD = 0.05
MAX_THRESHOLD = 0.95
# Hai điểm cắt quá gần nhau (< ngần này giây) thì giữ điểm đầu, bỏ điểm sau —
# tránh tách cảnh vụn do nhiễu/chớp sáng.
MIN_SCENE_GAP = 0.3

# --- Phase 7 P6: tham số color pass (màu phẳng) ---
COLOR_FPS = 3.0          # lấy mẫu 3 frame/giây (đủ cho cắt màu, rẻ)
COLOR_SIZE = 32          # thu frame về 32x32 trước khi tính mean
COLOR_STEP_MIN = 60.0    # bước nhảy mean RGB tối thiểu (thang 0..255/kênh)
COLOR_STABLE_MAX = 15.0  # lệch tối đa của 1 frame khỏi mean phía của nó
COLOR_WINDOW = 3         # số frame mỗi phía dùng để kiểm tra ổn định
COLOR_DEDUP_GAP = 0.5    # cắt color trùng cắt FFmpeg trong khoảng này → giữ FFmpeg

# Dòng showinfo của 1 frame được select: "pts_time:12.345 ..."
PTS_RE = re.compile(r"pts_time:(\d+(?:\.\d+)?)")


def log(msg):
    print(f"[scene] {msg}", flush=True)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(
            f"Lệnh thất bại: {' '.join(cmd)}\n{r.stderr[-2000:]}"
        )
    return r


def probe_duration(input_path):
    """Thời lượng video (giây) qua ffprobe; None nếu không đọc được."""
    try:
        r = run([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", input_path,
        ])
        d = float(r.stdout.strip())
        return d if d > 0 else None
    except Exception:
        return None


def detect_cuts(input_path, threshold, start=None, end=None):
    """
    Trả về (cuts, cut_candidates).
    cuts: list timestamp (giây, tuyệt đối theo file) đã lọc theo [start, end]
          và MIN_SCENE_GAP.
    cut_candidates: số frame mà filter select giữ lại TRƯỚC khi lọc
          (không phải tổng số frame đã quét — tổng frame không có trong
          output của showinfo sau select).
    """
    vf = f"select='gt(scene,{threshold})',showinfo"
    cmd = ["ffmpeg", "-hide_banner", "-i", input_path,
           "-vf", vf, "-f", "null", "-"]
    log(f"quét scene (threshold={threshold})...")
    # ffmpeg in tiến trình ra stderr; parse pts_time từ stderr.
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        # File không có video stream → select/showinfo vẫn chạy nhưng không
        # có frame nào; lỗi thật (file hỏng) thì stderr báo rõ.
        if "does not contain any stream" in r.stderr or "Invalid data" in r.stderr:
            raise RuntimeError(
                f"Không đọc được video từ file: {input_path}")
        raise RuntimeError(
            f"ffmpeg scene detection thất bại.\n{r.stderr[-2000:]}")

    cuts = []
    cut_candidates = 0
    for line in r.stderr.splitlines():
        if "Parsed_showinfo" not in line:
            continue
        cut_candidates += 1
        m = PTS_RE.search(line)
        if m:
            cuts.append(float(m.group(1)))
    cuts.sort()

    # Lọc theo khoảng [start, end] (thời gian TUYỆT ĐỐI của file).
    if start is not None:
        cuts = [c for c in cuts if c >= start - 1e-3]
    if end is not None:
        cuts = [c for c in cuts if c <= end + 1e-3]

    # Gộp các điểm cắt quá gần nhau.
    merged = []
    for c in cuts:
        if merged and c - merged[-1] < MIN_SCENE_GAP:
            continue
        merged.append(c)
    return merged, cut_candidates


def _rgb_dist(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def sample_frame_means(input_path, fps=COLOR_FPS, size=COLOR_SIZE):
    """Lấy mẫu frame (fps, size×size) qua ffmpeg rawvideo, trả về
    [(t, (r, g, b)), ...] với mean RGB mỗi frame. Lỗi/empty → [] (không
    làm hỏng pass chính — caller tự quyết định)."""
    cmd = ["ffmpeg", "-hide_banner", "-i", input_path,
           "-vf", f"fps={fps},scale={size}:{size}",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    try:
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    except Exception:
        return []
    frame_bytes = size * size * 3
    samples = []
    idx = 0
    try:
        while True:
            buf = p.stdout.read(frame_bytes)
            if len(buf) < frame_bytes:
                break
            n = size * size
            samples.append((idx / fps,
                            (sum(buf[0::3]) / n, sum(buf[1::3]) / n, sum(buf[2::3]) / n)))
            idx += 1
    except Exception:
        return []
    finally:
        try:
            p.wait(timeout=30)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass
    return samples


def detect_color_cuts(samples):
    """Tìm cắt màu phẳng từ mean RGB đã lấy mẫu.

    Một biên giữa frame i và i+1 là cắt khi: mean màu 2 phía nhảy >=
    COLOR_STEP_MIN VÀ mọi frame trong cửa sổ mỗi phía lệch khỏi mean phía
    mình <= COLOR_STABLE_MAX (màu phẳng thật, không phải fade/chuyển động).
    Timestamp = thời gian frame đầu của màu mới (khớp quy ước FFmpeg).
    """
    cuts = []
    for i in range(len(samples) - 1):
        before = samples[max(0, i - COLOR_WINDOW + 1):i + 1]
        after = samples[i + 1:i + 1 + COLOR_WINDOW]
        if len(before) < 2 or len(after) < 2:
            continue
        mean_b = tuple(sum(c[k] for _, c in before) / len(before) for k in range(3))
        mean_a = tuple(sum(c[k] for _, c in after) / len(after) for k in range(3))
        if _rgb_dist(mean_b, mean_a) < COLOR_STEP_MIN:
            continue
        if any(_rgb_dist(c, mean_b) > COLOR_STABLE_MAX for _, c in before):
            continue
        if any(_rgb_dist(c, mean_a) > COLOR_STABLE_MAX for _, c in after):
            continue
        cuts.append(samples[i + 1][0])
    return cuts


def merge_cuts(ffmpeg_cuts, color_cuts, start=None, end=None):
    """Hợp nhất 2 nguồn cắt: lọc color theo [start, end], bỏ color trùng
    FFmpeg trong COLOR_DEDUP_GAP (giữ timestamp FFmpeg), gộp theo
    MIN_SCENE_GAP. Trả về (merged, color_added)."""
    kept_color = []
    for c in color_cuts:
        if start is not None and c < start - 1e-3:
            continue
        if end is not None and c > end + 1e-3:
            continue
        kept_color.append(c)
    out = list(ffmpeg_cuts)
    added = []
    for c in kept_color:
        if all(abs(c - o) >= COLOR_DEDUP_GAP for o in out):
            out.append(c)
            added.append(c)
    out.sort()
    merged = []
    for c in out:
        if merged and c - merged[-1] < MIN_SCENE_GAP:
            continue
        merged.append(c)
    # Color cut bị gộp mất do quá gần cắt FFmpeg thì không tính là "added".
    added = [c for c in added if any(abs(c - m) < 1e-6 for m in merged)]
    return merged, added


def main():
    ap = argparse.ArgumentParser(description="Scene detection (FFmpeg, local).")
    ap.add_argument("--input", required=True, help="File video đầu vào.")
    ap.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD,
                    help=f"Ngưỡng scene {MIN_THRESHOLD}..{MAX_THRESHOLD} (mặc định {DEFAULT_THRESHOLD}).")
    ap.add_argument("--start", type=float, default=None,
                    help="Chỉ xét cảnh từ giây này (tuyệt đối theo file).")
    ap.add_argument("--end", type=float, default=None,
                    help="Chỉ xét cảnh đến giây này (tuyệt đối theo file).")
    ap.add_argument("--out", required=True, help="File JSON đầu ra.")
    ap.add_argument("--no-color-pass", action="store_true",
                    help="Tắt pass màu phẳng (Phase 7 P6) — chỉ dùng FFmpeg scene.")
    args = ap.parse_args()

    if not os.path.isfile(args.input):
        print(f"[scene] LỖI: không tìm thấy file: {args.input}", file=sys.stderr)
        return 2
    if not (MIN_THRESHOLD <= args.threshold <= MAX_THRESHOLD):
        print(f"[scene] LỖI: threshold phải trong khoảng "
              f"{MIN_THRESHOLD}..{MAX_THRESHOLD}, nhận {args.threshold}",
              file=sys.stderr)
        return 2
    if args.start is not None and args.start < 0:
        print("[scene] LỖI: --start không được âm.", file=sys.stderr)
        return 2
    if args.end is not None and args.start is not None and args.end <= args.start:
        print("[scene] LỖI: --end phải lớn hơn --start.", file=sys.stderr)
        return 2

    try:
        duration = probe_duration(args.input)
        if duration is None:
            log("cảnh báo: không đọc được duration (ffprobe).")
        cuts, candidates = detect_cuts(args.input, args.threshold, args.start, args.end)
        # Phase 7 P6: pass màu phẳng — chỉ bổ sung, không bao giờ bớt cắt
        # của FFmpeg; lỗi ở pass này chỉ cảnh báo, không fail toàn bộ.
        color_added = []
        if not args.no_color_pass:
            try:
                samples = sample_frame_means(args.input)
                raw_color = detect_color_cuts(samples)
                cuts, color_added = merge_cuts(cuts, raw_color, args.start, args.end)
                log(f"color pass: {len(samples)} mẫu, {len(raw_color)} cắt thô, "
                    f"+{len(color_added)} cắt mới.")
            except Exception as e:
                log(f"cảnh báo: color pass lỗi, bỏ qua ({e}).")
        log(f"xong: {len(cuts)} điểm cắt, {candidates} ứng viên.")
        result = {
            "cuts": [round(c, 3) for c in cuts],
            "duration": round(duration, 3) if duration is not None else None,
            "threshold": args.threshold,
            "cut_candidates": candidates,
            "color_pass": not args.no_color_pass,
            "color_cuts": [round(c, 3) for c in color_added],
        }
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        log(f"đã ghi {args.out}")
        return 0
    except RuntimeError as e:
        print(f"[scene] LỖI: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
