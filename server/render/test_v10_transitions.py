#!/usr/bin/env python3
"""Test V3 (Phase 9 dot 10) custom xfade expr transitions.

Khac voi test P5 (hardcode expr): script nay DOC expr truc tiep tu
server/render/src/transitions.js (regex tren entry custom) roi render that
bang ffmpeg, nen test luon ca catalog that chu khong phai ban sao expr.
Moi transition: render 2 mau phang do/xanh (320x240, 10fps, xfade 2s),
frame giua (P=0.5) phai khac ca 2 frame goc, va probe diem phai dung
pattern hinh hoc cua hieu ung. Them buoc node: buildXfadeFilter chay duoc
cho ca 14 type (chung to quoting expr dung).

Chay: python3 server/render/test_v10_transitions.py
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TRANSITIONS_JS = os.path.join(ROOT, "src", "transitions.js")
if not os.path.exists(TRANSITIONS_JS):
    TRANSITIONS_JS = os.path.join(HERE, "src", "transitions.js")

W, H, FPS, DUR = 320, 240, 10, 4
WORK = "/tmp/v10_transitions"
os.makedirs(WORK, exist_ok=True)

NEW_TYPES = [
    "diamondclose", "squareopen", "squareclose", "checker-alt",
    "blinds-diag", "split-h", "split-v", "barn-h", "barn-v",
    "rings", "corners", "star", "clock-ccw", "spiral",
]

# (x, y, expected "B" = mau moi / "A" = mau cu) tai frame giua P=0.5
PROBES = {
    "diamondclose": [(160, 120, "A"), (5, 5, "B")],
    "squareopen": [(160, 120, "B"), (5, 5, "A")],
    "squareclose": [(160, 120, "A"), (5, 5, "B")],
    "checker-alt": [(20, 15, "B"), (60, 15, "A"), (20, 45, "A")],
    "blinds-diag": [(5, 120, "B"), (20, 120, "A"), (35, 120, "B")],
    "split-h": [(10, 10, "B"), (310, 10, "A"), (10, 230, "A"), (310, 230, "B")],
    "split-v": [(10, 10, "B"), (10, 230, "A"), (310, 10, "A"), (310, 230, "B")],
    "barn-h": [(5, 120, "B"), (160, 120, "A"), (315, 120, "B")],
    "barn-v": [(160, 5, "B"), (160, 120, "A"), (160, 235, "B")],
    "rings": [(160, 120, "B"), (200, 120, "A"), (220, 120, "B")],
    "corners": [(5, 5, "B"), (160, 120, "A"), (160, 5, "A")],
    "star": [(310, 120, "B"), (281, 208, "A")],
    "clock-ccw": [(160, 200, "B"), (160, 40, "A")],
    "spiral": [(210, 120, "A"), (270, 120, "B")],
}


def load_exprs():
    with open(TRANSITIONS_JS, encoding="utf-8") as f:
        src = f.read()
    exprs = {}
    for m in re.finditer(
        r'type:\s*"([^"]+)",\s*xfade:\s*"custom",\s*expr:\s*"([^"]+)"', src
    ):
        exprs[m.group(1)] = m.group(2)
    return exprs


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stderr[-400:] if r.returncode else ""


def frame_png(video, t, out):
    rc, err = run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", video,
                   "-frames:v", "1", out])
    assert rc == 0, err
    return np.array(Image.open(out).convert("RGB")).astype(float)


def classify(px):
    if px[2] > 150 and px[0] < 100:
        return "B"
    if px[0] > 150 and px[2] < 100:
        return "A"
    return "?"


def main():
    exprs = load_exprs()
    missing = [t for t in NEW_TYPES if t not in exprs]
    if missing:
        print(f"FAIL catalog thieu expr: {missing}")
        return 1

    # Buoc node: buildXfadeFilter phai chay duoc cho ca 14 type (quote dung).
    node_prog = (
        "const m=require(%s);"
        "for (const t of %s) { const f=m.buildXfadeFilter(t,1,2);"
        " if (!f.includes(\"expr='\")) throw new Error('thieu quote: '+t); }"
        "console.log('node buildXfadeFilter OK');"
        % (json.dumps(TRANSITIONS_JS), json.dumps(NEW_TYPES))
    )
    rc, err = run(["node", "-e", node_prog])
    if rc != 0:
        print(f"FAIL node buildXfadeFilter: {err}")
        return 1
    print("node buildXfadeFilter OK (14/14)")

    results = {}
    for name in NEW_TYPES:
        expr = exprs[name]
        out = f"{WORK}/{name}.mp4"
        filt = (f"[0:v][1:v]xfade=transition=custom:duration=2:offset=1"
                f":expr='{expr}'[v]")
        rc, err = run(["ffmpeg", "-v", "error", "-y",
                       "-f", "lavfi", "-i", f"color=c=red:s={W}x{H}:r={FPS}:d={DUR}",
                       "-f", "lavfi", "-i", f"color=c=blue:s={W}x{H}:r={FPS}:d={DUR}",
                       "-filter_complex", filt, "-map", "[v]",
                       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(FPS), out])
        if rc != 0:
            print(f"FAIL {name}: render error: {err}")
            results[name] = False
            continue
        fa = frame_png(out, 0.5, f"{WORK}/{name}-a.png")
        fm = frame_png(out, 2.0, f"{WORK}/{name}-m.png")
        fb = frame_png(out, 3.5, f"{WORK}/{name}-b.png")
        d_a = float(np.mean(np.abs(fm - fa)))
        d_b = float(np.mean(np.abs(fm - fb)))
        ok = d_a > 5 and d_b > 5
        msgs = []
        for (x, y, exp) in PROBES[name]:
            got = classify(fm[y, x])
            good = got == exp
            ok = ok and good
            msgs.append(f"({x},{y})={got}{'!' if not good else ''}")
        print(f"{'PASS' if ok else 'CHECK'} {name}: dA={d_a:.1f} dB={d_b:.1f} "
              f"{' '.join(msgs)}")
        results[name] = ok

    print()
    print("PASS:", sum(results.values()), "/", len(results))
    return 0 if all(results.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
