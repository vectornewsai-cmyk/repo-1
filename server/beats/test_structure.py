#!/usr/bin/env python3
"""test_structure.py — Kiểm chứng structure.py (Phase 9 D5, gap A7).

Phần 1 — unit, không cần ffmpeg:
  - chroma: năng lượng ở bin 440 Hz phải rơi vào cung A (pc 9).
  - downbeat: envelope tổng hợp có accent mỗi 4 beat → meter 4, pha 0.
  - novelty + phân đoạn: đặc trưng 3 khối A/B/A → biên gần 16 và 32,
    nhãn đoạn 1 == đoạn 3, khác đoạn 2.

Phần 2 — end-to-end qua beat.py trên nhạc test tổng hợp, cấu trúc biết
trước (không phải nhạc thật):
  - 120 BPM, 4/4, 64s = 32 ô nhịp. Kick mỗi beat, downbeat to hơn
    (0.6 vs 0.35). Đoạn: A 8 ô (tông C+E), B 8 ô (tông D+F#),
    A lặp lại 8 ô, C 8 ô (tông A + năng lượng cao hơn).
  - Kỳ vọng: BPM ±2; >= 80% ô nhịp thật có downbeat phát hiện trong
    ±0.15s, sai số trung bình <= 0.10s; >= 2/3 biên đoạn thật (16/32/48s)
    được tìm thấy trong ±2s (1 ô nhịp); >= 2 nhãn đoạn khác nhau.
  - Mọi con số đều in ra thật — không giấu khi kiểm chứng phụ (nhãn lặp
    A==A, đoạn năng lượng cao nhất) không đạt thì chỉ báo, không fail
    cứng, vì đó là heuristic phụ, không phải yêu cầu của gap A7.

Chạy: python3 server/beats/test_structure.py (cần numpy + ffmpeg).
"""

import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from structure import (  # noqa: E402
    CENTER_OFFSET, HOP, SR, WIN, chroma_from_mag, estimate_downbeats,
    novelty_curve, pick_boundaries, segment_sections, self_similarity,
)

BEAT_PY = os.path.join(HERE, "beat.py")
TMP = "/tmp/vcut-d5-structure"

FAILURES = []


def check(name, cond, detail=""):
    print(f"  {'✓' if cond else '✗'} {name} {detail}")
    if not cond:
        FAILURES.append(name)


# ------------------------------------------------------------- unit tests

def test_chroma():
    print("== unit: chroma ==")
    mag = np.zeros((WIN // 2 + 1, 10), dtype=np.float32)
    bin440 = int(round(440 * WIN / SR))
    mag[bin440, :] = 1.0
    chroma = chroma_from_mag(mag)
    pc = int(np.argmax(chroma[:, 0]))
    check("440 Hz -> cung A (pc 9)", pc == 9, f"(pc={pc})")


def test_downbeat_unit():
    print("== unit: downbeat ==")
    env_fps = SR / HOP
    beats = [i * 0.5 for i in range(40)]
    env = np.zeros(3000, dtype=np.float32)
    for j, b in enumerate(beats):
        i = int(round((b - CENTER_OFFSET) * env_fps))
        env[i] = 1.0 if j % 4 == 0 else 0.3
    res = estimate_downbeats(beats, env, env_fps)
    check("meter == 4", res["meter"] == 4, f"(meter={res['meter']})")
    check("downbeat == beat 0,4,8...",
          res["downbeats"] == [round(beats[i], 3) for i in range(0, 40, 4)],
          f"({len(res['downbeats'])} downbeat)")
    check("confidence > 0", res["meter_confidence"] > 0,
          f"(conf={res['meter_confidence']})")


def test_segmentation_unit():
    print("== unit: novelty + phân đoạn ==")
    va = np.zeros(12); va[0] = 1.0; va[4] = 0.2
    vb = np.zeros(12); vb[2] = 1.0; vb[6] = 0.2
    feats = np.array([va] * 16 + [vb] * 16 + [va] * 16)
    energy = np.ones(48)
    ssm = self_similarity(feats)
    nov = novelty_curve(ssm)
    bounds = pick_boundaries(nov, min_distance=8)
    near16 = any(abs(b - 16) <= 2 for b in bounds)
    near32 = any(abs(b - 32) <= 2 for b in bounds)
    check("biên gần 16", near16, f"(bounds={bounds})")
    check("biên gần 32", near32, f"(bounds={bounds})")
    secs = segment_sections(feats, energy, [i * 0.5 for i in range(48)],
                            24.0, bounds)
    labels = [s["label"] for s in secs]
    check(">= 2 nhãn khác nhau", len(set(labels)) >= 2, f"(labels={labels})")
    check("đoạn 1 == đoạn 3 (lặp lại)", len(labels) >= 3 and labels[0] == labels[2],
          f"(labels={labels})")


def test_short_guard():
    print("== unit: guard nhạc quá ngắn ==")
    from structure import analyze_structure
    mag = np.zeros((WIN // 2 + 1, 10), dtype=np.float32)
    env = np.zeros(9, dtype=np.float32)
    res = analyze_structure(mag, env, [0.0, 0.5, 1.0], 0.5, 1.5)
    check("beats < 8 -> structure rỗng, không crash",
          res["meter"] is None and res["downbeats"] == [] and res["sections"] == [])


# ------------------------------------------------------------- end-to-end

BPM = 120.0
DUR = 64.0
BAR = 2.0  # 4 beat * 0.5s


def gen_structured_song(path):
    t = np.arange(int(SR * DUR)) / SR
    x = np.zeros_like(t)
    # Tông từng đoạn: A = C+E, B = D+F#, C = A + năng lượng cao.
    sections = [(0.0, 16.0, [261.63, 329.63], 0.10),
                (16.0, 32.0, [293.66, 369.99], 0.10),
                (32.0, 48.0, [261.63, 329.63], 0.10),
                (48.0, 64.0, [261.63, 329.63, 392.00, 523.25], 0.12)]
    for s0, s1, freqs, amp in sections:
        m = (t >= s0) & (t < s1)
        for f in freqs:
            x[m] += amp * np.sin(2 * np.pi * f * t[m])
    # Kick mỗi beat; downbeat (mỗi 4 beat) to hơn.
    period = 60.0 / BPM
    b = 0.0
    j = 0
    while b < DUR:
        s = int(b * SR)
        e = min(len(x), s + int(0.05 * SR))
        amp = 0.6 if j % 4 == 0 else 0.35
        x[s:e] += amp * np.sin(2 * np.pi * 1000 * np.arange(e - s) / SR)
        b += period
        j += 1
    pcm16 = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    p = subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le",
                        "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-c:a", "libmp3lame", path],
                       input=pcm16.tobytes(), capture_output=True)
    assert p.returncode == 0, f"ffmpeg tạo nhạc test thất bại: {p.stderr[:500]}"


def test_e2e():
    print("== e2e: beat.py + structure trên nhạc 64s có cấu trúc ==")
    os.makedirs(TMP, exist_ok=True)
    mp3 = os.path.join(TMP, "song120.mp3")
    out = os.path.join(TMP, "beats.json")
    gen_structured_song(mp3)
    r = subprocess.run([sys.executable, BEAT_PY, "--input", mp3, "--out", out],
                       capture_output=True, text=True)
    print(" ", r.stdout.strip())
    if r.returncode != 0:
        print("  STDERR:", r.stderr[-2000:])
        FAILURES.append("beat.py exit != 0")
        return
    res = json.load(open(out))
    st = res.get("structure", {})
    print(f"  bpm={res['bpm']} (thật 120), beats={len(res['beats'])}, "
          f"meter={st.get('meter')} conf={st.get('meter_confidence')}")
    check("BPM trong ±2", abs(res["bpm"] - BPM) <= 2.0, f"(bpm={res['bpm']})")
    # Downbeat: ô nhịp thật tại 0, 2, 4, ..., 62.
    true_bars = [i * BAR for i in range(int(DUR / BAR))]
    det = st.get("downbeats", [])
    errs = []
    matched = 0
    for tb in true_bars:
        near = [abs(d - tb) for d in det]
        if near and min(near) <= 0.15:
            matched += 1
            errs.append(min(near))
    mean_err = float(np.mean(errs)) if errs else 999.0
    max_err = float(np.max(errs)) if errs else 999.0
    print(f"  downbeat: khớp {matched}/{len(true_bars)} ô nhịp, "
          f"sai số TB {mean_err:.3f}s, max {max_err:.3f}s, "
          f"phát hiện {len(det)} downbeat")
    check("downbeat khớp >= 80% ô nhịp", matched >= 0.8 * len(true_bars),
          f"({matched}/{len(true_bars)})")
    check("downbeat sai số TB <= 0.10s", mean_err <= 0.10, f"({mean_err:.3f}s)")
    # Phân đoạn: biên thật 16/32/48.
    secs = st.get("sections", [])
    det_bounds = [s["start"] for s in secs[1:]] if len(secs) > 1 else []
    print(f"  sections: {[(s['start'], s['end'], s['label']) for s in secs]}")
    print(f"  biên phát hiện: {det_bounds} (thật [16, 32, 48])")
    found = sum(1 for tb in (16.0, 32.0, 48.0)
                if any(abs(d - tb) <= 2.0 for d in det_bounds))
    check("tìm >= 2/3 biên đoạn thật (±2s)", found >= 2, f"({found}/3)")
    labels = [s["label"] for s in secs]
    check(">= 2 nhãn đoạn khác nhau", len(set(labels)) >= 2, f"({labels})")
    # Báo thêm (không fail cứng): nhãn lặp A==A và đoạn năng lượng cao.
    if len(labels) >= 4:
        print(f"  (thông tin) nhãn lặp A==A: {labels[0] == labels[2]}")
    hi = [s for s in secs if s.get("highest_energy")]
    print(f"  (thông tin) đoạn năng lượng cao nhất: "
          f"{[(s['start'], s['label']) for s in hi]} (thật: đoạn C từ 48s)")


def main():
    test_chroma()
    test_downbeat_unit()
    test_segmentation_unit()
    test_short_guard()
    test_e2e()
    if FAILURES:
        print(f"\ntest_structure: FAIL ({len(FAILURES)}: {FAILURES})")
        return 1
    print("\ntest_structure: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
