#!/usr/bin/env python3
"""Stub thay caption.py/translate.py cho test tiến trình + hủy (đợt 80 H8).

Nhận cùng argv cơ bản (--input, --lang, --out), in các dòng phase +
progress giống caption.py thật (đã thêm ở đợt 80 H8), ghi JSON output
cùng schema. Dùng qua env CAPTION_PY / TRANSLATE_PY.

Biến môi trường điều khiển:
  AI_STUB_TOTAL_SEC=60   -> tổng giây audio giả lập (mặc định 10)
  AI_STUB_STEPS=5         -> số bước progress (mặc định 5)
  AI_STUB_STEP_MS=400     -> ms ngủ mỗi bước (mặc định 400)
  AI_STUB_FAIL=1          -> thoát mã 1 sau 1 bước (giả lập lỗi transcribe)
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

# Tag progress: caption.py dùng "[caption]", translate.py dùng "[translate]".
# Stub này dùng chung cho cả hai: tag lấy từ tên file (stub tên chứa
# "translate" -> [translate], còn lại [caption]).
TAG = "translate" if "translate" in os.path.basename(sys.argv[0]) else "caption"

if not os.path.isfile(args.input):
    sys.exit(f"LỖI: không tìm thấy file đầu vào: {args.input}")

total = float(os.environ.get("AI_STUB_TOTAL_SEC", "10"))
steps = int(os.environ.get("AI_STUB_STEPS", "5"))
step_ms = int(os.environ.get("AI_STUB_STEP_MS", "400"))

print(f"[{TAG}] nạp model...", flush=True)
time.sleep(0.2)
print(f"[{TAG}] trích audio từ {args.input}...", flush=True)
time.sleep(0.2)
if TAG == "caption":
    print(f"[{TAG}] đang transcribe (lang={args.lang})...", flush=True)
else:
    print(f"[{TAG}] đang dịch (nguồn={args.lang} -> en)...", flush=True)

for i in range(1, steps + 1):
    if os.environ.get("AI_STUB_FAIL") == "1" and i == 2:
        print("giả lập lỗi: model hỏng", file=sys.stderr)
        sys.exit(1)
    time.sleep(step_ms / 1000.0)
    done = total * i / steps
    print(f"[{TAG}] progress {done:.1f}/{total:.1f}", flush=True)

segments = [
    {"start": 0.5, "end": 2.3, "text": "Xin chào các bạn"},
    {"start": 2.8, "end": 5.1, "text": "Đây là video test phụ đề"},
]
words = [{"start": 0.5, "end": 0.9, "word": "Xin"}]
result = {
    "source": os.path.basename(args.input),
    "language": "vi",
    "model": args.model,
    "audio_duration_sec": total,
    "transcribe_time_sec": 1.0,
    "translate_time_sec": 1.0,
    "realtime_factor": 0.1,
    "segments": segments,
    "words": words,
}
with open(args.out, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print(f"[{TAG}] xong: {len(segments)} captions, {len(words)} từ -> {args.out}",
      flush=True)
