#!/usr/bin/env python3
"""Stub thay reframe.py cho test tiến trình + hủy (đợt 80 H8).

Nhận cùng argv cơ bản (--input, --output, --aspect), in tiến trình
"[reframe] i/N (pct%)" ra stderr giống reframe.py thật, tạo file output
tồn tại. Dùng qua env REFRAME_PY.

Biến môi trường điều khiển:
  AI_STUB_FRAMES=8       -> tổng frame giả lập (mặc định 8)
  AI_STUB_STEP_MS=300    -> ms ngủ mỗi frame (mặc định 300)
"""
import argparse
import os
import sys
import time

ap = argparse.ArgumentParser()
ap.add_argument("--input", required=True)
ap.add_argument("--output", required=True)
ap.add_argument("--aspect", default="9:16")
ap.add_argument("--analyze-only", action="store_true")
ap.add_argument("--json-out", default=None)
args = ap.parse_args()

if not os.path.isfile(args.input):
    print(f"[reframe] LỖI: không tìm thấy file: {args.input}", file=sys.stderr)
    sys.exit(2)

total = int(os.environ.get("AI_STUB_FRAMES", "8"))
step_ms = int(os.environ.get("AI_STUB_STEP_MS", "300"))

time.sleep(0.2)
for i in range(1, total + 1):
    time.sleep(step_ms / 1000.0)
    pct = round(i / total * 100)
    print(f"[reframe] {i}/{total} ({pct}%)", file=sys.stderr, flush=True)

with open(args.output, "wb") as f:
    f.write(b"FAKE-MP4-REFRAME" * 64)
print(f"[reframe] xong: {args.output}", file=sys.stderr, flush=True)
