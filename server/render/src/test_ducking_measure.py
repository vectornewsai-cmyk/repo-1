#!/usr/bin/env python3
"""Đo mức nhạc (440 Hz) và giọng (880 Hz) trong file wav 48kHz mono.

Cửa sổ 1s = số nguyên chu kỳ của cả 2 tần số (440 và 880 chu kỳ) nên DFT
tại bin chính xác, không rò rỉ phổ. In JSON:
{"voice1": {"music": dB, "voice": dB}, "silence": {...}, "voice2": {...}}
  voice1  = [2.5, 3.5)s (trong burst 1)
  silence = [4.5, 5.5)s (khoảng lặng)
  voice2  = [6.5, 7.5)s (trong burst 2)
"""
import json
import math
import struct
import sys
import wave

import numpy as np

SR = 48000


def band_db(samples, freq):
    """Biên độ RMS (dBFS) của thành phần sine tại `freq` trong `samples`."""
    n = len(samples)
    t = np.arange(n) / SR
    # DFT tại 1 tần số (tương đương Goertzel): sine nguyên chu kỳ -> chính xác.
    re = float(np.sum(samples * np.cos(2 * math.pi * freq * t)))
    im = float(np.sum(samples * np.sin(2 * math.pi * freq * t)))
    amp = 2.0 * math.hypot(re, im) / n  # biên độ đỉnh của sine
    rms = amp / math.sqrt(2.0)
    return 20 * math.log10(rms) if rms > 1e-12 else -120.0


def main():
    with wave.open(sys.argv[1], "rb") as w:
        assert w.getframerate() == SR, f"sample rate {w.getframerate()} != {SR}"
        assert w.getnchannels() == 1, "cần wav mono"
        raw = w.readframes(w.getnframes())
    samples = np.array(struct.unpack(f"<{len(raw) // 2}h", raw), dtype=np.float64) / 32768.0
    out = {}
    for name, (a, b) in {"voice1": (2.5, 3.5), "silence": (4.5, 5.5), "voice2": (6.5, 7.5)}.items():
        seg = samples[int(a * SR):int(b * SR)]
        out[name] = {"music": band_db(seg, 440), "voice": band_db(seg, 880)}
    print(json.dumps(out))


if __name__ == "__main__":
    main()
