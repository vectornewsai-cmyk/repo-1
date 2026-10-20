#!/usr/bin/env python3
"""bench_bgremove.py — Benchmark tốc độ xóa nền video (rembg) của VCut Studio.

Đo: thời gian xử lý video có người thật với session u2net.
Metric: fps = số_frame / thời_gian  (càng cao càng nhanh)

Cách chạy: dùng venv trong ~/workspace/scratch-bgremove/venv (đã cài rembg):
  ~/workspace/scratch-bgremove/venv/bin/python benchmarks/bgremove/bench_bgremove.py

LƯU Ý TRUNG THỰC:
  - Session mặc định của app là birefnet-general (chất lượng cao hơn), NHƯNG trên máy
    test 8GB RAM nó bị OOM/SIGKILL ở inference 1024x1024 (đã đo bởi agent BgRemoval).
    Vì vậy benchmark này dùng u2net (fallback chính thức của app) và ghi rõ.
  - Video test: tạo từ person.jpg (người thật) bằng zoompan để có chủ thể chuyển động nhẹ.
"""
import json
import os
import subprocess
import sys
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BGREMOVE_PY = os.path.join(ROOT, "server", "bgremove", "bgremove.py")
OUTDIR = os.path.join(os.path.dirname(__file__), "..", "results")
WORK = "/tmp/vcut-bench/bgremove"
os.makedirs(OUTDIR, exist_ok=True)
os.makedirs(WORK, exist_ok=True)

PERSON_JPG = os.path.expanduser("~/workspace/scratch-bgremove/person.jpg")
CASES = [
    ("3s", 3),
    ("10s", 10),
]


def make_video(dur_s, out):
    if os.path.exists(out):
        return
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-loop", "1", "-i", PERSON_JPG,
         "-vf", f"scale=1280:720,zoompan=z='1+0.05*sin(on/30)':d={dur_s*30}:s=1280x720:fps=30",
         "-t", str(dur_s), "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
         "-pix_fmt", "yuv420p", out],
        check=True,
    )


def main():
    if not os.path.exists(PERSON_JPG):
        print(f"[FAIL] không tìm thấy {PERSON_JPG}", file=sys.stderr)
        sys.exit(1)
    results = []
    for name, dur in CASES:
        src = os.path.join(WORK, f"person_{name}.mp4")
        out = os.path.join(WORK, f"person_{name}_nobg.mov")
        make_video(dur, src)
        t0 = time.perf_counter()
        r = subprocess.run(
            [sys.executable, BGREMOVE_PY, "--input", src, "--output", out,
             "--session", "u2net", "--mode", "alpha", "--max-side", "960"],
            capture_output=True, text=True, timeout=3600,
        )
        wall = time.perf_counter() - t0
        if r.returncode != 0:
            print(f"[FAIL] {name}: {r.stderr[-800:]}", file=sys.stderr)
            sys.exit(1)
        frames = dur * 30
        entry = {
            "case": name,
            "session": "u2net",
            "max_side": 960,
            "frames": frames,
            "wall_s": round(wall, 2),
            "fps": round(frames / wall, 2),
            "note": "birefnet-general (default của app) OOM trên máy 8GB -> dùng u2net fallback",
        }
        results.append(entry)
        print(f"{name}: {frames} frames -> {wall:.1f}s ({entry['fps']} fps, session u2net)")

    with open(os.path.join(OUTDIR, "bgremove.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Đã ghi {os.path.join(OUTDIR, 'bgremove.json')}")


if __name__ == "__main__":
    main()
