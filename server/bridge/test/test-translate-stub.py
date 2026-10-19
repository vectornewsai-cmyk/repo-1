#!/usr/bin/env python3
"""Stub thay translate.py cho test E2E (không cần model faster-whisper).

Nhận cùng argv cơ bản (--input, --lang, --out), in các dòng phase giống
translate.py thật ([translate] ...), ghi JSON output cùng schema với 5 câu
tiếng Anh cố định. Dùng qua env TRANSLATE_PY.
Biến môi trường điều khiển:
  TRANSLATE_STUB_FAIL=1   -> thoát mã 1 (giả lập lỗi dịch)
  TRANSLATE_STUB_EMPTY=1  -> ghi segments rỗng (giả lập video câm)
"""
import argparse
import json
import os
import sys
import time

ap = argparse.ArgumentParser()
ap.add_argument("--input", required=True)
ap.add_argument("--lang", default="vi")
ap.add_argument("--out", required=True)
ap.add_argument("--model", default="small")
ap.add_argument("--model-dir", default="")
ap.add_argument("--track-out", default=None)
ap.add_argument("--max-chars", type=int, default=42)
ap.add_argument("--max-dur", type=float, default=5.0)
args = ap.parse_args()

if not os.path.isfile(args.input):
    sys.exit(f"LỖI: không tìm thấy file đầu vào: {args.input}")

if os.environ.get("TRANSLATE_STUB_FAIL") == "1":
    print("[translate] trích audio từ test...", flush=True)
    print("giả lập lỗi: model hỏng", file=sys.stderr)
    sys.exit(1)

print(f"[translate] trích audio từ {args.input}...", flush=True)
time.sleep(0.2)
print(f"[translate] đang dịch (nguồn={args.lang} -> en)...", flush=True)
time.sleep(0.5)

if os.environ.get("TRANSLATE_STUB_EMPTY") == "1":
    segments, words = [], []
else:
    # 5 câu vi->en cố định — test assert đúng nội dung này.
    segments = [
        {"start": 0.5, "end": 2.3, "text": "Hello everyone"},
        {"start": 2.8, "end": 5.1, "text": "This is a subtitle test video"},
        {"start": 6.0, "end": 8.7, "text": "Thanks for watching"},
        {"start": 9.2, "end": 11.5, "text": "See you in the next video"},
        {"start": 12.0, "end": 14.3, "text": "Goodbye"},
    ]
    words = [
        {"start": 0.5, "end": 0.9, "word": "Hello"},
        {"start": 0.9, "end": 1.3, "word": "everyone"},
    ]

result = {
    "source": os.path.basename(args.input),
    "source_language": "vi" if args.lang in ("vi", "auto") else args.lang,
    "target_language": "en",
    "engine": "faster-whisper-translate",
    "model": args.model,
    "audio_duration_sec": 15.0,
    "translate_time_sec": 0.7,
    "realtime_factor": 0.05,
    "segments": segments,
    "words": words,
    "video_spec_track": {
        "id": "cap1", "kind": "text", "label": "Phụ đề (EN)",
        "clips": [
            {"kind": "text", "id": f"cap{n+1}", "text": s["text"],
             "start": s["start"], "duration": round(s["end"] - s["start"], 2),
             "style": {"fontFamily": "Inter", "fontSize": 56, "color": "#ffffff"}}
            for n, s in enumerate(segments)
        ],
    },
    "spec_version": "0.2.0",
}
with open(args.out, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print(f"[translate] xong: {len(segments)} captions tiếng Anh, {len(words)} từ -> {args.out}",
      flush=True)
