#!/usr/bin/env python3
"""Stub thay bgremove.py cho test tiến trình + hủy (đợt 80 H8).

Nhận cùng argv cơ bản (--input, --output, --mode, --session, --temporal,
--feather), in tiến trình "[bgremove] i/N (pct%)" ra stderr giống
bgremove.py thật, tạo file output rỗng-nhưng-tồn-tại + marker
session_used. Dùng qua env BGREMOVE_PY.

Biến môi trường điều khiển:
  AI_STUB_FRAMES=9       -> tổng frame giả lập (mặc định 9)
  AI_STUB_STEP_MS=300    -> ms ngủ mỗi frame (mặc định 300)
  AI_STUB_FAIL=1         -> thoát mã 1 giữa chừng (giả lập lỗi session)
"""
import argparse
import os
import sys
import time

ap = argparse.ArgumentParser()
ap.add_argument("--input", required=True)
ap.add_argument("--output", required=True)
ap.add_argument("--mode", default="alpha")
ap.add_argument("--session", default="u2net")
ap.add_argument("--temporal", type=float, default=0.4)
ap.add_argument("--feather", type=int, default=1)
ap.add_argument("--model-dir", default=None)
args = ap.parse_args()

if not os.path.isfile(args.input):
    print(f"[bgremove] LỖI: không tìm thấy file: {args.input}", file=sys.stderr)
    sys.exit(2)

total = int(os.environ.get("AI_STUB_FRAMES", "9"))
step_ms = int(os.environ.get("AI_STUB_STEP_MS", "300"))

print(f"[bgremove] khởi tạo session '{args.session}'...", file=sys.stderr,
      flush=True)
time.sleep(0.2)
for i in range(1, total + 1):
    if os.environ.get("AI_STUB_FAIL") == "1" and i == total // 2:
        print("[bgremove] LỖI: giả lập lỗi session", file=sys.stderr)
        sys.exit(1)
    time.sleep(step_ms / 1000.0)
    pct = round(i / total * 100)
    print(f"[bgremove] {i}/{total} ({pct}%)", file=sys.stderr, flush=True)

# File output giả lập: chỉ cần tồn tại + non-empty để bridge coi là xong.
with open(args.output, "wb") as f:
    f.write(b"FAKE-MOV-NO-BG" * 64)
print(f"[bgremove] xong: {args.output} ({total} frames)", file=sys.stderr)
print(f"[bgremove] session_used={args.session}", file=sys.stderr, flush=True)
