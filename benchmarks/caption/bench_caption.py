#!/usr/bin/env python3
"""bench_caption.py — Benchmark tốc độ auto-caption (faster-whisper small) của VCut Studio.

Đo: thời gian transcribe cho các file audio có độ dài khác nhau.
Metric: realtime factor = thời_lượng_audio / thời_gian_xử_lý  (>1 = nhanh hơn realtime)

Cách chạy: dùng venv của server/caption (đã cài faster_whisper):
  ~/workspace/repo-1/server/caption/.venv/bin/python benchmarks/caption/bench_caption.py

Input: audio giọng nói thật do bench_tts.py tạo ra (benchmarks/results/tts_audio/*.wav).
Nếu chưa chạy bench_tts.py trước, script tự tạo 1 file tone test 10s và ghi chú rõ
(lúc đó số liệu chỉ mang tính tham chiếu về tốc độ, không phản ánh chất lượng).
"""
import json
import os
import subprocess
import sys
import time
import wave

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CAPTION_PY = os.path.join(ROOT, "server", "caption", "caption.py")
MODEL_DIR = os.path.join(ROOT, "server", "caption", "models", "fw-small")
OUTDIR = os.path.join(os.path.dirname(__file__), "..", "results")
AUDIO_DIR = os.path.join(OUTDIR, "tts_audio")
os.makedirs(OUTDIR, exist_ok=True)


def audio_duration(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / float(w.getframerate())


def ensure_inputs():
    files = sorted(f for f in os.listdir(AUDIO_DIR) if f.endswith(".wav")) if os.path.isdir(AUDIO_DIR) else []
    if files:
        return [os.path.join(AUDIO_DIR, f) for f in files], "tts-speech"
    # Fallback: tone test 10s (ghi rõ trong kết quả)
    fallback = os.path.join(OUTDIR, "tone_10s.wav")
    if not os.path.exists(fallback):
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
             "sine=frequency=440:duration=10", "-ar", "16000", "-ac", "1", fallback],
            check=True,
        )
    return [fallback], "tone-fallback"


def main():
    inputs, kind = ensure_inputs()
    print(f"Nguồn audio: {kind} ({len(inputs)} file)")
    results = []
    for path in inputs:
        dur = audio_duration(path)
        out = path + ".caption.json"
        t0 = time.perf_counter()
        r = subprocess.run(
            [sys.executable, CAPTION_PY, "--input", path, "--lang", "vi",
             "--out", out, "--model-dir", MODEL_DIR],
            capture_output=True, text=True, timeout=3600,
        )
        wall = time.perf_counter() - t0
        if r.returncode != 0:
            print(f"[FAIL] {os.path.basename(path)}: {r.stderr[-500:]}", file=sys.stderr)
            sys.exit(1)
        nseg = 0
        try:
            with open(out, encoding="utf-8") as f:
                data = json.load(f)
            segs = data.get("segments", data if isinstance(data, list) else [])
            nseg = len(segs)
        except Exception:
            pass
        entry = {
            "file": os.path.basename(path),
            "source_kind": kind,
            "audio_s": round(dur, 2),
            "wall_s": round(wall, 2),
            "rt_factor": round(dur / wall, 3),
            "segments": nseg,
        }
        results.append(entry)
        print(f"{entry['file']}: audio {dur:.1f}s -> xử lý {wall:.1f}s "
              f"(RT {entry['rt_factor']}x), {nseg} segments")

    with open(os.path.join(OUTDIR, "caption.json"), "w", encoding="utf-8") as f:
        json.dump({"source_kind": kind, "results": results}, f, ensure_ascii=False, indent=2)
    print(f"Đã ghi {os.path.join(OUTDIR, 'caption.json')}")


if __name__ == "__main__":
    main()
