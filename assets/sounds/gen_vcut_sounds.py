#!/usr/bin/env python3
"""
gen_vcut_sounds.py — Tổng hợp 36 hiệu ứng âm thanh gốc cho VCut Studio (K6, Phase 6).

Tác phẩm gốc (original work) của dự án VCut Studio — không sample, không copy
từ nguồn nào. Mọi âm thanh được tổng hợp từ sóng sin/vuông/noise bằng numpy,
xuất WAV 16-bit 44.1kHz rồi mã hoá OGG Vorbis bằng ffmpeg.

Lấp gap "whoosh CC0" mà Batch I đã ghi nhận (không tìm được nguồn CC0 sạch).

Chạy: python3 gen_vcut_sounds.py  (ghi vào assets/audio/vcut-synth-*.ogg)
"""
import os
import subprocess
import numpy as np

SR = 44100
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "audio")
os.makedirs(OUT_DIR, exist_ok=True)


def env(n, attack=0.005, decay=None):
    """Envelope: attack tuyến tính + decay hàm mũ."""
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
        # chirp tuyến tính theo tần số
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


def onepole_lowpass(x, cutoff):
    """Lọc thông thấp 1 cực, cutoff có thể là mảng theo thời gian."""
    y = np.zeros_like(x)
    if np.isscalar(cutoff):
        a = np.exp(-2 * np.pi * cutoff / SR)
        for i in range(1, len(x)):
            y[i] = (1 - a) * x[i] + a * y[i - 1]
    else:
        a = np.exp(-2 * np.pi * cutoff / SR)
        for i in range(1, len(x)):
            y[i] = (1 - a[i]) * x[i] + a[i] * y[i - 1]
    return y


def write_ogg(name, samples):
    samples = np.clip(samples, -0.95, 0.95)
    pcm = (samples * 32767).astype(np.int16)
    wav = os.path.join("/tmp", f"vcut_{name}.wav")
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
# Định nghĩa 36 âm thanh: (name, category, builder)
# ---------------------------------------------------------------------------

def click_hi():
    x = square(1800, 0.05, 0.25) * env(int(SR * 0.05), attack=0.001, decay=60)
    return fade_out(x)

def click_lo():
    x = square(900, 0.06, 0.25) * env(int(SR * 0.06), attack=0.001, decay=50)
    return fade_out(x)

def click_soft():
    x = sine(1200, 0.04, 0.3, sweep_to=800) * env(int(SR * 0.04), attack=0.001, decay=70)
    return fade_out(x)

def tap_wood():
    x = sine(300, 0.08, 0.5, sweep_to=150) * env(int(SR * 0.08), attack=0.001, decay=40)
    return fade_out(x)

def pop_up():
    x = sine(400, 0.12, 0.5, sweep_to=900) * env(int(SR * 0.12), attack=0.002, decay=25)
    return fade_out(x)

def pop_down():
    x = sine(900, 0.12, 0.5, sweep_to=300) * env(int(SR * 0.12), attack=0.002, decay=25)
    return fade_out(x)

def blip_a():
    x = sine(660, 0.08, 0.35) * env(int(SR * 0.08), attack=0.002, decay=40)
    return fade_out(x)

def blip_b():
    x = sine(880, 0.08, 0.35) * env(int(SR * 0.08), attack=0.002, decay=40)
    return fade_out(x)

def whoosh_up():
    n = int(SR * 0.5)
    x = noise(0.5, 0.4, seed=1)
    cut = np.linspace(300, 6000, n)
    y = onepole_lowpass(x, cut) * env(n, attack=0.05, decay=6)
    return fade_out(y, 30)

def whoosh_down():
    n = int(SR * 0.5)
    x = noise(0.5, 0.4, seed=2)
    cut = np.linspace(6000, 300, n)
    y = onepole_lowpass(x, cut) * env(n, attack=0.05, decay=6)
    return fade_out(y, 30)

def whoosh_fast():
    n = int(SR * 0.25)
    x = noise(0.25, 0.45, seed=3)
    cut = np.linspace(500, 8000, n)
    y = onepole_lowpass(x, cut) * env(n, attack=0.02, decay=12)
    return fade_out(y, 20)

def whoosh_slow():
    n = int(SR * 0.9)
    x = noise(0.9, 0.35, seed=4)
    cut = np.linspace(200, 4000, n)
    y = onepole_lowpass(x, cut) * env(n, attack=0.1, decay=4)
    return fade_out(y, 50)

def whoosh_air():
    n = int(SR * 0.4)
    x = noise(0.4, 0.3, seed=5)
    cut = np.linspace(1000, 5000, n)
    y = onepole_lowpass(x, cut) * env(n, attack=0.05, decay=8)
    return fade_out(y, 30)

def whoosh_gate():
    n = int(SR * 0.3)
    x = noise(0.3, 0.5, seed=6)
    cut = np.linspace(8000, 400, n)
    y = onepole_lowpass(x, cut) * env(n, attack=0.01, decay=15)
    return fade_out(y, 20)

def riser_short():
    x = sine(200, 0.5, 0.3, sweep_to=1200) * env(int(SR * 0.5), attack=0.4, decay=1.2)
    return fade_out(x, 20)

def riser_long():
    x = sine(150, 1.2, 0.3, sweep_to=1800) * env(int(SR * 1.2), attack=1.0, decay=0.8)
    return fade_out(x, 30)

def riser_noise():
    n = int(SR * 0.8)
    x = noise(0.8, 0.3, seed=7)
    cut = np.linspace(400, 7000, n)
    y = onepole_lowpass(x, cut) * env(n, attack=0.7, decay=1.0)
    return fade_out(y, 30)

def riser_tension():
    x = sine(110, 1.0, 0.35, sweep_to=440) * env(int(SR * 1.0), attack=0.8, decay=1.0)
    x += sine(165, 1.0, 0.2, sweep_to=660) * env(int(SR * 1.0), attack=0.8, decay=1.0)
    return fade_out(x, 30)

def chime_success():
    t = np.arange(int(SR * 0.8)) / SR
    x = (np.sin(2 * np.pi * 660 * t) + 0.5 * np.sin(2 * np.pi * 880 * t)
         + 0.3 * np.sin(2 * np.pi * 1320 * t)) * 0.3 * np.exp(-t * 4)
    return fade_out(x, 20)

def chime_notify():
    t = np.arange(int(SR * 0.5)) / SR
    x = (np.sin(2 * np.pi * 1046 * t) + 0.4 * np.sin(2 * np.pi * 1568 * t)) * 0.3 * np.exp(-t * 6)
    return fade_out(x, 20)

def ding_high():
    t = np.arange(int(SR * 0.6)) / SR
    x = (np.sin(2 * np.pi * 1568 * t) + 0.3 * np.sin(2 * np.pi * 2093 * t)) * 0.3 * np.exp(-t * 5)
    return fade_out(x, 20)

def bell_soft():
    t = np.arange(int(SR * 1.0)) / SR
    x = (np.sin(2 * np.pi * 523 * t) + 0.4 * np.sin(2 * np.pi * 784 * t)
         + 0.2 * np.sin(2 * np.pi * 1046 * t)) * 0.3 * np.exp(-t * 3)
    return fade_out(x, 30)

def coin():
    x = sine(988, 0.3, 0.3) * env(int(SR * 0.3), attack=0.001, decay=12)
    x += sine(1319, 0.3, 0.2) * env(int(SR * 0.3), attack=0.001, decay=12)
    return fade_out(x, 20)

def sparkle():
    t = np.arange(int(SR * 0.4)) / SR
    x = (np.sin(2 * np.pi * 2093 * t) + np.sin(2 * np.pi * 2637 * t)) * 0.2 * np.exp(-t * 8)
    return fade_out(x, 20)

def buzz_error():
    x = square(140, 0.3, 0.3) * env(int(SR * 0.3), attack=0.005, decay=8)
    return fade_out(x, 20)

def buzz_warn():
    x = square(220, 0.2, 0.25) * env(int(SR * 0.2), attack=0.005, decay=10)
    return fade_out(x, 20)

def thud_low():
    x = sine(80, 0.25, 0.6, sweep_to=40) * env(int(SR * 0.25), attack=0.001, decay=14)
    return fade_out(x, 20)

def impact_hit():
    x = sine(120, 0.2, 0.6, sweep_to=50) * env(int(SR * 0.2), attack=0.001, decay=16)
    nb = noise(0.2, 0.3, seed=8)
    nb[int(SR * 0.1):] = 0
    x += nb * env(int(SR * 0.2), attack=0.001, decay=30)
    return fade_out(x, 20)

def punch():
    x = sine(150, 0.15, 0.6, sweep_to=60) * env(int(SR * 0.15), attack=0.001, decay=20)
    return fade_out(x, 15)

def boom_soft():
    x = sine(60, 0.5, 0.6, sweep_to=30) * env(int(SR * 0.5), attack=0.005, decay=7)
    return fade_out(x, 40)

def swipe_left():
    return whoosh_down()

def swipe_right():
    return whoosh_up()

def transition_swoop():
    n = int(SR * 0.35)
    x = noise(0.35, 0.4, seed=9)
    cut = np.linspace(400, 6000, n)
    y = onepole_lowpass(x, cut) * env(n, attack=0.03, decay=10)
    return fade_out(y, 25)

def transition_drop():
    n = int(SR * 0.35)
    x = noise(0.35, 0.4, seed=10)
    cut = np.linspace(6000, 400, n)
    y = onepole_lowpass(x, cut) * env(n, attack=0.03, decay=10)
    return fade_out(y, 25)

def transition_glitch():
    x = square(1200, 0.05, 0.2) * env(int(SR * 0.05), attack=0.001, decay=50)
    x = np.concatenate([x, square(700, 0.05, 0.2) * env(int(SR * 0.05), attack=0.001, decay=50),
                        square(1600, 0.05, 0.2) * env(int(SR * 0.05), attack=0.001, decay=50)])
    return fade_out(x, 15)

SOUNDS = [
    ("click-hi", "ui", click_hi), ("click-lo", "ui", click_lo),
    ("click-soft", "ui", click_soft), ("tap-wood", "ui", tap_wood),
    ("pop-up", "ui", pop_up), ("pop-down", "ui", pop_down),
    ("blip-a", "ui", blip_a), ("blip-b", "ui", blip_b),
    ("whoosh-up", "whoosh", whoosh_up), ("whoosh-down", "whoosh", whoosh_down),
    ("whoosh-fast", "whoosh", whoosh_fast), ("whoosh-slow", "whoosh", whoosh_slow),
    ("whoosh-air", "whoosh", whoosh_air), ("whoosh-gate", "whoosh", whoosh_gate),
    ("riser-short", "riser", riser_short), ("riser-long", "riser", riser_long),
    ("riser-noise", "riser", riser_noise), ("riser-tension", "riser", riser_tension),
    ("chime-success", "chime", chime_success), ("chime-notify", "chime", chime_notify),
    ("ding-high", "chime", ding_high), ("bell-soft", "chime", bell_soft),
    ("coin", "chime", coin), ("sparkle", "chime", sparkle),
    ("buzz-error", "error", buzz_error), ("buzz-warn", "error", buzz_warn),
    ("thud-low", "impact", thud_low), ("impact-hit", "impact", impact_hit),
    ("punch", "impact", punch), ("boom-soft", "impact", boom_soft),
    ("swipe-left", "transition", swipe_left), ("swipe-right", "transition", swipe_right),
    ("transition-swoop", "transition", transition_swoop),
    ("transition-drop", "transition", transition_drop),
    ("transition-glitch", "transition", transition_glitch),
]


def main():
    made = []
    for name, cat, fn in SOUNDS:
        out = write_ogg(name, fn())
        size = os.path.getsize(out)
        made.append((name, cat, size))
        print(f"  wrote vcut-synth-{name}.ogg ({cat}, {size}B)")
    print(f"Done: {len(made)} sounds")


if __name__ == "__main__":
    main()
