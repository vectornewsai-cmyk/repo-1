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

Khi chạy, in các dòng "[scene] ..." ra stdout để bridge parse tiến trình.
"""

import argparse
import json
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
        log(f"xong: {len(cuts)} điểm cắt, {candidates} ứng viên.")
        result = {
            "cuts": [round(c, 3) for c in cuts],
            "duration": round(duration, 3) if duration is not None else None,
            "threshold": args.threshold,
            "cut_candidates": candidates,
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
