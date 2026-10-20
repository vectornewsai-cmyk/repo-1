#!/usr/bin/env python3
"""bench_tts.py — Benchmark tốc độ TTS (VieNeu-TTS 0.5B) của VCut Studio.

Đo: thời gian tổng hợp cho 3 văn bản có độ dài tăng dần (ngắn / vừa / dài).
Metric:
  - realtime factor = thời_lượng_audio_đầu_ra / thời_gian_tổng_hợp  (>1 = nhanh hơn realtime)
  - chars/sec = số ký tự văn bản / thời_gian_tổng_hợp

Cách chạy: dùng venv của server/tts (đã cài vieneu):
  ~/workspace/repo-1/server/tts/.venv2/bin/python benchmarks/tts/bench_tts.py

Audio đầu ra được lưu vào benchmarks/results/tts_audio/ để caption bench dùng lại
(giọng nói thật, không phải tiếng tone tổng hợp).
"""
import json
import os
import subprocess
import sys
import time
import wave

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TTS_PY = os.path.join(ROOT, "server", "tts", "tts.py")
OUTDIR = os.path.join(os.path.dirname(__file__), "..", "results")
AUDIO_DIR = os.path.join(OUTDIR, "tts_audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

TEXTS = [
    ("short", "Xin chào, đây là video hướng dẫn sử dụng trình dựng video VCut Studio."),
    ("medium", "Hôm nay chúng ta sẽ học cách cắt ghép video, thêm phụ đề tự động, "
               "chèn hiệu ứng chuyển cảnh và xuất bản video lên mạng xã hội một cách nhanh chóng."),
    ("long", "Trí tuệ nhân tạo đang thay đổi cách con người làm việc mỗi ngày. "
             "Từ việc viết văn bản, vẽ tranh, sáng tác nhạc cho đến dựng video, "
             "các công cụ mới giúp rút ngắn thời gian sản xuất từ nhiều giờ xuống còn vài phút. "
             "Tuy nhiên, yếu tố quan trọng nhất vẫn là ý tưởng và sự sáng tạo của con người, "
             "bởi công nghệ chỉ là công cụ hỗ trợ, không thể thay thế hoàn toàn tư duy nghệ thuật."),
]


def wav_duration(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / float(w.getframerate())


def main():
    results = []
    for name, text in TEXTS:
        out = os.path.join(AUDIO_DIR, f"tts_{name}.wav")
        t0 = time.perf_counter()
        r = subprocess.run(
            [sys.executable, TTS_PY, "--text", text, "--out", out],
            capture_output=True, text=True, timeout=1800,
        )
        wall = time.perf_counter() - t0
        if r.returncode != 0:
            print(f"[FAIL] {name}: {r.stderr[-500:]}", file=sys.stderr)
            sys.exit(1)
        dur = wav_duration(out)
        entry = {
            "case": name,
            "chars": len(text),
            "audio_s": round(dur, 2),
            "wall_s": round(wall, 2),
            "rt_factor": round(dur / wall, 3),
            "chars_per_s": round(len(text) / wall, 1),
            "file": os.path.basename(out),
        }
        results.append(entry)
        print(f"{name}: {len(text)} ký tự -> audio {dur:.2f}s, "
              f"tổng hợp {wall:.2f}s (RT {entry['rt_factor']}x, {entry['chars_per_s']} ký tự/s)")

    with open(os.path.join(OUTDIR, "tts.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Đã ghi {os.path.join(OUTDIR, 'tts.json')}")


if __name__ == "__main__":
    main()
