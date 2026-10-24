#!/usr/bin/env python3
"""Test P5 custom xfade expr transitions with raw ffmpeg + pixel checks."""
import subprocess, os, sys
import numpy as np
from PIL import Image

W, H, FPS, DUR = 320, 240, 10, 4
WORK = "/tmp/p5_expr"
os.makedirs(WORK, exist_ok=True)

EXPRS = {
    "blinds-h": "if(lt(mod(Y,H/8),P*H/8),B,A)",
    "bars-v": "if(lt(mod(X,W/8),P*W/8),B,A)",
    "checker": "if(gt(P*4,mod(floor(X/(W/8))+floor(Y/(H/8)),4)),B,A)",
    "diamond": "if(lte(abs(X-W/2)+abs(Y-H/2),P*(W+H)/2),B,A)",
    "plus": "if(lte(min(abs(X-W/2),abs(Y-H/2)),P*min(W,H)/2),B,A)",
    "grid": "if(lte(max(mod(X,min(W,H)/8),mod(Y,min(W,H)/8)),P*min(W,H)/8),B,A)",
    "clock": "if(lt(atan2(Y-H/2,X-W/2),-PI+2*PI*P),B,A)",
    "circle-soft": "A*(1-clip((sqrt(pow(X-W/2,2)+pow(Y-H/2,2))-P*sqrt(pow(W/2,2)+pow(H/2,2)))/(0.15*sqrt(pow(W/2,2)+pow(H/2,2))),0,1))+B*clip((sqrt(pow(X-W/2,2)+pow(Y-H/2,2))-P*sqrt(pow(W/2,2)+pow(H/2,2)))/(0.15*sqrt(pow(W/2,2)+pow(H/2,2))),0,1)",
    "bars-fade": "if(lt(mod(X,W/8),P*W/8),B,A*(1-P)+B*P)",
}

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stderr[-500:] if r.returncode else ""

def frame_png(video, t, out):
    rc, err = run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", video,
                   "-frames:v", "1", out])
    assert rc == 0, err
    return np.array(Image.open(out).convert("RGB")).astype(float)

def mean_abs_diff(a, b):
    return float(np.mean(np.abs(a - b)))

results = {}
for name, expr in EXPRS.items():
    out = f"{WORK}/{name}.mp4"
    filt = (f"[0:v][1:v]xfade=transition=custom:duration=2:offset=1:expr='{expr}'[v]")
    rc, err = run(["ffmpeg", "-v", "error", "-y",
                   "-f", "lavfi", "-i", f"color=c=red:s={W}x{H}:r={FPS}:d={DUR}",
                   "-f", "lavfi", "-i", f"color=c=blue:s={W}x{H}:r={FPS}:d={DUR}",
                   "-filter_complex", filt, "-map", "[v]",
                   "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(FPS), out])
    if rc != 0:
        print(f"FAIL {name}: render error: {err}")
        results[name] = False
        continue
    # mid-transition frame at t=2.0 (P=0.5); pure A at 0.5, pure B at 3.5
    fa = frame_png(out, 0.5, f"{WORK}/{name}-a.png")
    fm = frame_png(out, 2.0, f"{WORK}/{name}-m.png")
    fb = frame_png(out, 3.5, f"{WORK}/{name}-b.png")
    d_a = mean_abs_diff(fm, fa)
    d_b = mean_abs_diff(fm, fb)
    # mid frame must differ from BOTH pure frames (real transition happening)
    ok = d_a > 5 and d_b > 5
    # extra spatial check for blinds/bars: rows (or cols) must alternate
    extra = ""
    if name == "blinds-h":  # per-row blue fraction (mean over channels erases red/blue)
        rowmeans = fm.mean(axis=(1, 2))
        bluefrac = ((fm[:,:,2] > 150) & (fm[:,:,0] < 100)).mean(axis=1)
        alt = float(np.mean(np.abs(np.diff(bluefrac[::10]))))
        extra = f" row-alt={alt:.1f}"
        ok = ok and alt > 0.3
    if name == "bars-v":  # per-col blue fraction
        colmeans = fm.mean(axis=(0, 2))
        bluefrac = ((fm[:,:,2] > 150) & (fm[:,:,0] < 100)).mean(axis=0)
        alt = float(np.mean(np.abs(np.diff(bluefrac[::10]))))
        extra = f" col-alt={alt:.1f}"
        ok = ok and alt > 0.3
    print(f"{'PASS' if ok else 'CHECK'} {name}: dA={d_a:.1f} dB={d_b:.1f}{extra}")
    results[name] = ok

print()
print("PASS:", sum(results.values()), "/", len(results))
sys.exit(0 if all(results.values()) else 1)
