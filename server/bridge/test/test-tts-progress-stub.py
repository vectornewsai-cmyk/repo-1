#!/usr/bin/env python3
"""Stub thay tts.py cho test tiến trình + hủy (đợt 80 H8).

Nhận cùng argv cơ bản (--text, --voice/--ref-audio, --out), in các dòng
log giống tts.py thật ("nạp model", "chia thành N chunk", "chunk i/N
xong"), ghi file WAV tối thiểu (header RIFF hợp lệ, 0.1s im lặng) + dòng
JSON kết quả cuối stdout. Dùng qua env TTS_PY.

Biến môi trường điều khiển:
  AI_STUB_TTS_CHUNKS=4   -> số chunk giả lập (mặc định 4)
  AI_STUB_STEP_MS=400    -> ms ngủ mỗi chunk (mặc định 400)
  AI_STUB_FAIL=1         -> thoát mã 1 sau chunk đầu (giả lập lỗi synth)
"""
import argparse
import json
import os
import struct
import sys
import time

ap = argparse.ArgumentParser()
ap.add_argument("--text", required=True)
ap.add_argument("--voice", default=None)
ap.add_argument("--ref-audio", default=None)
ap.add_argument("--out", required=True)
args = ap.parse_args()

n_chunks = int(os.environ.get("AI_STUB_TTS_CHUNKS", "4"))
step_ms = int(os.environ.get("AI_STUB_STEP_MS", "400"))

print("[tts] nạp model VieNeu-TTS v3 Turbo ...", flush=True)
time.sleep(0.3)
print("[tts] model sẵn sàng sau 0.3s", flush=True)
print(f"[tts] tổng hợp {len(args.text)} ký tự, giọng "
      f"{'(clone từ mẫu)' if args.ref_audio else (args.voice or '(mặc định)')} ...",
      flush=True)
print(f"[tts] chia thành {n_chunks} chunk theo câu", flush=True)
for i in range(n_chunks):
    if os.environ.get("AI_STUB_FAIL") == "1" and i == 1:
        print("[tts] lỗi: giả lập lỗi synth", file=sys.stderr)
        sys.exit(1)
    time.sleep(step_ms / 1000.0)
    print(f"[tts]   chunk {i + 1}/{n_chunks} xong (10 ký tự)", flush=True)
print("[tts] xong sau 1.0s", flush=True)

# WAV tối thiểu: 0.1s mono 16-bit 48kHz im lặng (đủ để bridge/ffprobe đọc).
sr = 48000
n_frames = sr // 10
pcm = b"\x00\x00" * n_frames
with open(args.out, "wb") as f:
    f.write(b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVE")
    f.write(b"fmt " + struct.pack("<IHHIIHH", 16, 1, 1, sr, sr * 2, 2, 16))
    f.write(b"data" + struct.pack("<I", len(pcm)) + pcm)

print(json.dumps({
    "ok": True,
    "out": os.path.abspath(args.out),
    "voice": args.voice,
    "chars": len(args.text),
    "durationSec": 0.1,
    "synthSec": 1.0,
    "sampleRate": sr,
    "watermark": False,
    "mode": "v3turbo",
    "chunks": n_chunks,
    "cloned": bool(args.ref_audio),
}, ensure_ascii=False))
