#!/usr/bin/env python3
"""
gen_vcut_sounds3.py — Q4 (Phase 8): 30 hiệu ứng âm thanh gốc vòng 3.

Nối tiếp gen_vcut_sounds.py (K6) và gen_vcut_sounds2.py (P5): tác phẩm gốc
tổng hợp từ sóng sin/vuông/noise bằng numpy, WAV 16-bit 44.1kHz -> OGG
Vorbis bằng ffmpeg. Không sample, không copy từ nguồn nào. Vòng 3 mở rộng
các họ riser/impact/transition/sweep/downer/stinger/whoosh/chime.

Chạy: python3 gen_vcut_sounds3.py  (ghi vào assets/audio/vcut-synth-*.ogg)
Sau đó cập nhật assets/sounds/index.json (total 1013 -> 1043).
"""
import os
import subprocess
import numpy as np

SR = 44100
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "audio")
os.makedirs(OUT_DIR, exist_ok=True)


def env(n, attack=0.005, decay=None):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1) if attack > 0 else np.ones(n)
    d = np.exp(-t * (decay if decay else 8.0))
    return a * d


def fade_out(x, ms=10):
    n = int(SR * ms / 1000)
    if n > 0 and len(x) > n:
        x[-n:] *= np.linspace(1, 0, n)
    return x


def sine(freq, dur, amp=0.5, sweep_to=None):
    n = int(SR * dur)
    t = np.arange(n) / SR
    if sweep_to is not None:
        f = np.linspace(freq, sweep_to, n)
        phase = 2 * np.pi * np.cumsum(f) / SR
    else:
        phase = 2 * np.pi * freq * t
    return amp * np.sin(phase)


def square(freq, dur, amp=0.3, sweep_to=None):
    return np.sign(sine(freq, dur, 1.0, sweep_to)) * amp


def noise(dur, amp=0.4, seed=0):
    rng = np.random.default_rng(seed)
    return amp * rng.standard_normal(int(SR * dur))


def chord(freqs, dur, amp=0.3, decay=6.0):
    x = np.zeros(int(SR * dur))
    for f in freqs:
        x += sine(f, dur, amp / len(freqs))
    return x * env(int(SR * dur), attack=0.005, decay=decay)


def write_ogg(name, samples):
    samples = np.clip(samples, -0.95, 0.95)
    pcm = (samples * 32767).astype(np.int16)
    wav = os.path.join("/tmp", f"vcut2_{name}.wav")
    import wave
    with wave.open(wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    ogg = os.path.join(OUT_DIR, f"vcut-synth-{name}.ogg")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", wav, "-c:a", "libvorbis",
                    "-q:a", "4", ogg], check=True)
    os.remove(wav)
    return ogg



# ---------------------------------------------------------------------------
# RISER (+5)
# ---------------------------------------------------------------------------

def riser_vapor():
    n = int(SR * 1.3)
    x = noise(1.3, 0.25, seed=61) * np.linspace(0.05, 0.8, n)
    x += sine(600, 1.3, 0.12, sweep_to=3000)
    return fade_out(x * env(n, attack=0.1, decay=1.0))

def riser_spark():
    x = np.zeros(int(SR * 0.9))
    for i, f in enumerate((800, 1400, 2200, 3400)):
        seg = sine(f, 0.25, 0.2) * env(int(SR * 0.25), attack=0.001, decay=20)
        x[i * int(SR * 0.18):i * int(SR * 0.18) + len(seg)] += seg
    return fade_out(x * env(int(SR * 0.9), attack=0.05, decay=1.2))

def riser_tight():
    x = sine(150, 1.0, 0.45, sweep_to=1200)
    x *= 0.7 + 0.3 * np.sin(2 * np.pi * 12 * np.arange(int(SR * 1.0)) / SR)
    return fade_out(x * env(int(SR * 1.0), attack=0.03, decay=1.0))

def riser_glide():
    return fade_out(sine(400, 1.5, 0.4, sweep_to=5200) * env(int(SR * 1.5), attack=0.05, decay=1.2))

def riser_echo():
    x = sine(300, 1.1, 0.4, sweep_to=2000)
    n = int(SR * 1.1)
    for delay, amp in ((0.25, 0.3), (0.5, 0.18), (0.75, 0.1)):
        d = int(SR * delay)
        x[d:] += x[:n - d] * amp
    return fade_out(x * env(n, attack=0.05, decay=1.2))

# ---------------------------------------------------------------------------
# IMPACT (+5)
# ---------------------------------------------------------------------------

def _impact_body(base_freq, dur, noise_amp, seed):
    n = int(SR * dur)
    x = sine(base_freq, dur, 0.7, sweep_to=base_freq * 0.25)
    x += noise(dur, noise_amp, seed=seed) * env(n, attack=0.001, decay=30)
    return fade_out(x * env(n, attack=0.001, decay=6.0))

def impact_thud():
    return _impact_body(70, 0.4, 0.15, 71)

def impact_crack():
    x = noise(0.25, 0.6, seed=72) * env(int(SR * 0.25), attack=0.001, decay=60)
    x += sine(1800, 0.25, 0.2) * env(int(SR * 0.25), attack=0.001, decay=40)
    return fade_out(x)

def impact_boom():
    return _impact_body(55, 1.0, 0.4, 73)

def impact_tick():
    x = square(1200, 0.12, 0.35) * env(int(SR * 0.12), attack=0.001, decay=50)
    x += sine(300, 0.12, 0.3) * env(int(SR * 0.12), attack=0.001, decay=40)
    return fade_out(x)

def impact_gong():
    x = np.zeros(int(SR * 1.4))
    for f, a in ((220, 0.35), (331, 0.25), (553, 0.15), (880, 0.08)):
        x += sine(f, 1.4, a)
    return fade_out(x * env(int(SR * 1.4), attack=0.002, decay=2.5))

# ---------------------------------------------------------------------------
# TRANSITION (+4)
# ---------------------------------------------------------------------------

def transition_zip():
    x = noise(0.3, 0.4, seed=81) * np.linspace(0.2, 1.0, int(SR * 0.3))
    x += sine(900, 0.3, 0.2, sweep_to=3600)
    return fade_out(x)

def transition_sweep():
    return fade_out(sine(500, 0.35, 0.35, sweep_to=250) * env(int(SR * 0.35), attack=0.01, decay=8.0))

def transition_flick():
    x = np.zeros(int(SR * 0.3))
    for i in range(6):
        seg = square(1000 + i * 200, 0.03, 0.25) * env(int(SR * 0.03), attack=0.001, decay=60)
        x[i * int(SR * 0.05):i * int(SR * 0.05) + len(seg)] += seg
    return fade_out(x)

def transition_morph():
    x = sine(200, 0.5, 0.35, sweep_to=1400)
    x += sine(1400, 0.5, 0.15, sweep_to=300)
    return fade_out(x * env(int(SR * 0.5), attack=0.02, decay=5.0))

# ---------------------------------------------------------------------------
# SWEEP (+4)
# ---------------------------------------------------------------------------

def sweep_shimmer():
    x = np.zeros(int(SR * 0.8))
    for f in (1500, 2100, 2900):
        x += sine(f, 0.8, 0.12, sweep_to=f * 0.6)
    return fade_out(x * env(int(SR * 0.8), attack=0.02, decay=4.0))

def sweep_dip():
    return fade_out(sine(2000, 0.6, 0.35, sweep_to=300) * env(int(SR * 0.6), attack=0.02, decay=4.0))

def sweep_glide():
    return fade_out(sine(800, 0.7, 0.35, sweep_to=4800) * env(int(SR * 0.7), attack=0.02, decay=4.0))

def sweep_pulse():
    n = int(SR * 0.8)
    t = np.arange(n) / SR
    x = sine(400, 0.8, 0.35, sweep_to=2400) * (0.6 + 0.4 * np.sin(2 * np.pi * 10 * t))
    return fade_out(x * env(n, attack=0.02, decay=4.0))

# ---------------------------------------------------------------------------
# DOWNER (+4)
# ---------------------------------------------------------------------------

def downer_soft():
    return fade_out(sine(500, 0.9, 0.4, sweep_to=120) * env(int(SR * 0.9), attack=0.01, decay=3.0))

def downer_long():
    return fade_out(sine(300, 1.6, 0.45, sweep_to=60) * env(int(SR * 1.6), attack=0.01, decay=2.0))

def downer_drop():
    x = sine(800, 0.7, 0.4, sweep_to=90)
    x[-int(SR * 0.05):] *= np.linspace(1, 0, int(SR * 0.05))
    return fade_out(x * env(int(SR * 0.7), attack=0.01, decay=3.0))

def downer_fade():
    x = chord((392, 523, 659), 1.2, amp=0.35, decay=3.0)
    return fade_out(x)

# ---------------------------------------------------------------------------
# STINGER (+4)
# ---------------------------------------------------------------------------

def stinger_chime():
    x = np.zeros(int(SR * 0.8))
    for i, f in enumerate((1319, 1760, 2093)):
        seg = sine(f, 0.3, 0.25) * env(int(SR * 0.3), attack=0.001, decay=12)
        x[i * int(SR * 0.15):i * int(SR * 0.15) + len(seg)] += seg
    return fade_out(x)

def stinger_pop():
    x = sine(600, 0.2, 0.5, sweep_to=1800) * env(int(SR * 0.2), attack=0.001, decay=25)
    x += noise(0.2, 0.2, seed=91) * env(int(SR * 0.2), attack=0.001, decay=40)
    return fade_out(x)

def stinger_flare():
    x = chord((523, 659, 784, 1047), 0.5, amp=0.4, decay=8.0)
    x += sine(2000, 0.5, 0.1, sweep_to=4000)
    return fade_out(x)

def stinger_ding():
    return fade_out((sine(1568, 0.6, 0.35) + sine(2093, 0.6, 0.15)) * env(int(SR * 0.6), attack=0.001, decay=6.0))

# ---------------------------------------------------------------------------
# WHOOSH (+2) & CHIME (+2)
# ---------------------------------------------------------------------------

def whoosh_spin():
    x = noise(0.7, 0.4, seed=95) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * np.arange(int(SR * 0.7)) / SR))
    return fade_out(x * env(int(SR * 0.7), attack=0.05, decay=3.0))

def whoosh_burst():
    x = noise(0.4, 0.55, seed=96) * env(int(SR * 0.4), attack=0.005, decay=12)
    return fade_out(x)

def chime_bright():
    return fade_out((sine(1760, 0.7, 0.3) + sine(2637, 0.7, 0.12)) * env(int(SR * 0.7), attack=0.001, decay=5.0))

def chime_deep():
    return fade_out((sine(523, 1.0, 0.3) + sine(784, 1.0, 0.15)) * env(int(SR * 1.0), attack=0.001, decay=4.0))

SOUNDS = [
    ("riser-vapor", "riser", riser_vapor),
    ("riser-spark", "riser", riser_spark),
    ("riser-tight", "riser", riser_tight),
    ("riser-glide", "riser", riser_glide),
    ("riser-echo", "riser", riser_echo),
    ("impact-thud", "impact", impact_thud),
    ("impact-crack", "impact", impact_crack),
    ("impact-boom", "impact", impact_boom),
    ("impact-tick", "impact", impact_tick),
    ("impact-gong", "impact", impact_gong),
    ("transition-zip", "transition", transition_zip),
    ("transition-sweep", "transition", transition_sweep),
    ("transition-flick", "transition", transition_flick),
    ("transition-morph", "transition", transition_morph),
    ("sweep-shimmer", "sweep", sweep_shimmer),
    ("sweep-dip", "sweep", sweep_dip),
    ("sweep-glide", "sweep", sweep_glide),
    ("sweep-pulse", "sweep", sweep_pulse),
    ("downer-soft", "downer", downer_soft),
    ("downer-long", "downer", downer_long),
    ("downer-drop", "downer", downer_drop),
    ("downer-fade", "downer", downer_fade),
    ("stinger-chime", "stinger", stinger_chime),
    ("stinger-pop", "stinger", stinger_pop),
    ("stinger-flare", "stinger", stinger_flare),
    ("stinger-ding", "stinger", stinger_ding),
    ("whoosh-spin", "whoosh", whoosh_spin),
    ("whoosh-burst", "whoosh", whoosh_burst),
    ("chime-bright", "chime", chime_bright),
    ("chime-deep", "chime", chime_deep),
]

def main():
    for name, cat, fn in SOUNDS:
        write_ogg(name, fn())
        print(f"  wrote vcut-synth-{name}.ogg ({cat})")
    print(f"Done: {len(SOUNDS)} sounds")

if __name__ == "__main__":
    main()
