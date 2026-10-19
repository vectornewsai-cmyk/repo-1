#!/usr/bin/env python3
"""
Silence removal LOCAL cho dự án trình dựng video (R1-084, Batch H).

    python silence.py --input video.mp4 --noise -35 --min-dur 0.5 --out silence.json

- 100% local: dùng FFmpeg filter `silencedetect` (có sẵn trong ffmpeg 8.1),
  KHÔNG gọi API cloud nào, KHÔNG cần model ML.
- Đầu vào: file video hoặc audio bất kỳ mà ffmpeg đọc được.
- Đầu ra JSON gồm:
    * "silences": [{start, end, duration}] — các khoảng lặng phát hiện được
      (thời gian theo FILE NGUỒN, giây)
    * "keep": [{start, end}] — các đoạn GIỮ LẠI (phần bù của silences)
    * "audio_duration_sec": thời lượng audio
    * "noise_db", "min_duration_sec": tham số đã dùng

Cách dùng trong editor: UI lấy `silences`, cắt theo [in, out) của clip
đang chọn rồi gọi store.removeSilence() — split + xóa các đoạn im trong
1 bước undo.

Ngưỡng mặc định: noise=-35dB, min-dur=0.5s (phù hợp giọng nói quay mic thường).
"""

import argparse
import json
import os
import re
import subprocess
import sys

# Giới hạn tham số — chặn giá trị vô lý / quá nặng.
NOISE_DB_MIN = -80.0
NOISE_DB_MAX = 0.0
MIN_DUR_MIN = 0.1
MIN_DUR_MAX = 10.0
MAX_SILENCES = 5000

RE_START = re.compile(r"silence_start:\s*([0-9.]+)")
RE_END = re.compile(r"silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)")


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Lệnh thất bại: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r


def probe_audio_duration(src_path):
    """Lấy thời lượng audio (giây) bằng ffprobe. Trả về None nếu không có audio."""
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0",
         "-show_entries", "stream=duration", "-of", "csv=p=0", src_path],
        capture_output=True, text=True,
    )
    try:
        d = float(r.stdout.strip().split("\n")[0])
        return d if d > 0 else None
    except (ValueError, IndexError):
        return None


def detect_silences(src_path, noise_db, min_dur):
    """
    Chạy ffmpeg silencedetect, parse stderr.
    Trả về (silences, audio_duration).

    Xử lý biên (hành vi thật của silencedetect):
    - Im lặng ngay đầu file: chỉ có silence_end (không có silence_start) → start=0.
    - Im lặng tới hết file: chỉ có silence_start (không có silence_end) → end=audio_duration.
    """
    r = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", src_path,
         "-af", f"silencedetect=noise={noise_db}dB:d={min_dur}",
         "-f", "null", "-"],
        capture_output=True, text=True,
    )
    # silencedetect không làm ffmpeg lỗi — nhưng file hỏng thì exit != 0.
    if r.returncode != 0 and "silence_start" not in r.stderr and "silence_end" not in r.stderr:
        raise RuntimeError(f"ffmpeg không đọc được {src_path}:\n{r.stderr[-1500:]}")

    audio_dur = probe_audio_duration(src_path)

    silences = []
    pending_start = None  # silence_start chưa có cặp silence_end
    for line in r.stderr.splitlines():
        m_start = RE_START.search(line)
        m_end = RE_END.search(line)
        if m_start:
            pending_start = float(m_start.group(1))
        elif m_end:
            end = float(m_end.group(1))
            start = pending_start if pending_start is not None else 0.0
            pending_start = None
            dur = round(end - start, 3)
            if dur >= min_dur - 1e-6 and end > start:
                silences.append({"start": round(start, 3),
                                 "end": round(end, 3),
                                 "duration": dur})
    # Im lặng kéo tới hết file: đóng bằng audio_duration.
    if pending_start is not None and audio_dur:
        end = audio_dur
        dur = round(end - pending_start, 3)
        if dur >= min_dur - 1e-6 and end > pending_start:
            silences.append({"start": round(pending_start, 3),
                             "end": round(end, 3),
                             "duration": dur})

    silences.sort(key=lambda s: s["start"])
    return silences, audio_dur


def complement(silences, total_dur):
    """Phần bù của silences trong [0, total_dur) = các đoạn giữ lại."""
    keep = []
    cursor = 0.0
    for s in silences:
        if s["start"] > cursor + 1e-6:
            keep.append({"start": round(cursor, 3),
                         "end": round(s["start"], 3)})
        cursor = max(cursor, s["end"])
    if total_dur and cursor < total_dur - 1e-6:
        keep.append({"start": round(cursor, 3),
                     "end": round(total_dur, 3)})
    return keep


def main():
    ap = argparse.ArgumentParser(
        description="Phát hiện khoảng lặng bằng FFmpeg silencedetect (100% local).")
    ap.add_argument("--input", required=True, help="file video/audio đầu vào")
    ap.add_argument("--noise", type=float, default=-35.0,
                    help=f"ngưỡng dB (mặc định -35; phạm vi {NOISE_DB_MIN}..{NOISE_DB_MAX})")
    ap.add_argument("--min-dur", type=float, default=0.5,
                    help=f"độ dài tối thiểu của khoảng lặng, giây "
                         f"(mặc định 0.5; phạm vi {MIN_DUR_MIN}..{MIN_DUR_MAX})")
    ap.add_argument("--out", required=True, help="file JSON output")
    args = ap.parse_args()

    if not os.path.isfile(args.input):
        sys.exit(f"LỖI: không tìm thấy file đầu vào: {args.input}")
    if not (NOISE_DB_MIN <= args.noise <= NOISE_DB_MAX):
        sys.exit(f"LỖI: --noise phải trong [{NOISE_DB_MIN}, {NOISE_DB_MAX}] dB.")
    if not (MIN_DUR_MIN <= args.min_dur <= MIN_DUR_MAX):
        sys.exit(f"LỖI: --min-dur phải trong [{MIN_DUR_MIN}, {MIN_DUR_MAX}] giây.")

    import time
    t0 = time.time()
    silences, audio_dur = detect_silences(args.input, args.noise, args.min_dur)
    elapsed = time.time() - t0

    if audio_dur is None:
        sys.exit("LỖI: file không có track audio (không có gì để phát hiện khoảng lặng).")
    if len(silences) > MAX_SILENCES:
        sys.exit(f"LỖI: quá nhiều khoảng lặng ({len(silences)} > {MAX_SILENCES}) "
                 f"— thử tăng --noise hoặc --min-dur.")

    result = {
        "source": os.path.basename(args.input),
        "audio_duration_sec": round(audio_dur, 3),
        "noise_db": args.noise,
        "min_duration_sec": args.min_dur,
        "detect_time_sec": round(elapsed, 2),
        "silence_count": len(silences),
        "silences": silences,
        "keep": complement(silences, audio_dur),
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    total_sil = sum(s["duration"] for s in silences)
    print(f"[silence] xong: {len(silences)} khoảng lặng, tổng {total_sil:.1f}s / "
          f"{audio_dur:.1f}s audio ({elapsed:.1f}s xử lý) -> {args.out}",
          flush=True)


if __name__ == "__main__":
    main()
