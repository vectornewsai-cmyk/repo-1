#!/usr/bin/env python3
"""
gen_vcut_sounds2.py — P5 (Phase 7): 30 hiệu ứng âm thanh gốc vòng 2.

Nối tiếp gen_vcut_sounds.py (K6, Phase 6): tác phẩm gốc tổng hợp từ sóng
sin/vuông/noise bằng numpy, WAV 16-bit 44.1kHz -> OGG Vorbis bằng ffmpeg.
Không sample, không copy từ nguồn nào. Lấp các gap còn thiếu sau vòng 1:
riser thêm biến thể, impact nặng hơn, transition thêm kiểu, sweep, downer
(kết trầm), stinger (điểm nhấn ngắn).

Chạy: python3 gen_vcut_sounds2.py  (ghi vào assets/audio/vcut-synth-*.ogg)
Sau đó cập nhật assets/sounds/index.json (total 983 -> 1013).
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
# RISER (+6)
# ---------------------------------------------------------------------------

def riser_air():
    # noise dâng, lọc dần mở (mô phỏng bằng biên độ tăng + chirp cao dần)
    n = int(SR * 1.2)
    x = noise(1.2, 0.35, seed=11) * np.linspace(0.05, 1.0, n)
    x += sine(300, 1.2, 0.15, sweep_to=2400)
    return fade_out(x * env(n, attack=0.05, decay=1.2))

def riser_bright():
    x = sine(500, 1.0, 0.4, sweep_to=4000)
    x += sine(1000, 1.0, 0.2, sweep_to=6000)
    return fade_out(x * env(int(SR * 1.0), attack=0.05, decay=1.5))

def riser_dark():
    x = sine(80, 1.4, 0.5, sweep_to=320)
    x += noise(1.4, 0.15, seed=12) * np.linspace(0.1, 0.6, int(SR * 1.4))
    return fade_out(x * env(int(SR * 1.4), attack=0.05, decay=1.0))

def riser_pulse():
    # riser theo nhịp: chirp + tremolo 8Hz
    n = int(SR * 1.0)
    t = np.arange(n) / SR
    x = sine(200, 1.0, 0.4, sweep_to=1600) * (0.6 + 0.4 * np.sin(2 * np.pi * 8 * t))
    return fade_out(x * env(n, attack=0.05, decay=1.2))

def riser_shimmer():
    x = np.zeros(int(SR * 1.0))
    for f in (1200, 1800, 2400, 3200):
        x += sine(f, 1.0, 0.12, sweep_to=f * 1.5)
    return fade_out(x * env(int(SR * 1.0), attack=0.05, decay=1.5))

def riser_drop():
    # riser rồi cắt đột ngột (để nối vào impact)
    x = sine(200, 0.9, 0.45, sweep_to=1800)
    x += noise(0.9, 0.2, seed=13) * np.linspace(0.1, 0.8, int(SR * 0.9))
    x = x * env(int(SR * 0.9), attack=0.05, decay=1.0)
    x[-int(SR * 0.02):] = 0  # cắt cứng cuối
    return x

# ---------------------------------------------------------------------------
# IMPACT (+7)
# ---------------------------------------------------------------------------

def _impact_body(base_freq, dur, noise_amp, seed):
    n = int(SR * dur)
    x = sine(base_freq, dur, 0.7, sweep_to=base_freq * 0.25)
    x += noise(dur, noise_amp, seed=seed) * env(n, attack=0.001, decay=30)
    return fade_out(x * env(n, attack=0.001, decay=6.0))

def impact_slam():
    return _impact_body(120, 0.5, 0.3, 21)

def impact_crash():
    x = _impact_body(200, 0.8, 0.5, 22)
    x += noise(0.8, 0.3, seed=23) * env(int(SR * 0.8), attack=0.001, decay=4.0)
    return fade_out(x)

def impact_stomp():
    return _impact_body(90, 0.35, 0.2, 24)

def impact_metal():
    # kim loại: nhiều hài cao, decay dài
    x = np.zeros(int(SR * 0.9))
    for f, a in ((620, 0.3), (930, 0.2), (1470, 0.15), (2100, 0.1)):
        x += sine(f, 0.9, a)
    x = x * env(int(SR * 0.9), attack=0.001, decay=5.0)
    return fade_out(x)

def impact_wood_hit():
    x = sine(220, 0.15, 0.6, sweep_to=90) * env(int(SR * 0.15), attack=0.001, decay=35)
    x += noise(0.15, 0.2, seed=25) * env(int(SR * 0.15), attack=0.001, decay=50)
    return fade_out(x)

def impact_deep_boom():
    return _impact_body(55, 1.2, 0.15, 26)

def impact_snap():
    x = noise(0.08, 0.6, seed=27) * env(int(SR * 0.08), attack=0.0005, decay=80)
    x += sine(1500, 0.08, 0.3, sweep_to=500)
    return fade_out(x, ms=5)

# ---------------------------------------------------------------------------
# TRANSITION (+6)
# ---------------------------------------------------------------------------

def transition_flip():
    # lật: chirp lên rồi xuống nhanh
    x = np.concatenate([sine(300, 0.12, 0.4, sweep_to=1200),
                         sine(1200, 0.12, 0.4, sweep_to=300)])
    return fade_out(x)

def transition_slide():
    x = noise(0.3, 0.3, seed=31) * env(int(SR * 0.3), attack=0.01, decay=10)
    x += sine(500, 0.3, 0.25, sweep_to=900)
    return fade_out(x)

def transition_spin():
    # xoay: tremolo nhanh dần + chirp
    n = int(SR * 0.5)
    t = np.arange(n) / SR
    rate = np.linspace(4, 20, n)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(rate) / SR)
    x = sine(400, 0.5, 0.4, sweep_to=1000) * trem
    return fade_out(x)

def transition_warp():
    # biến dạng: 2 chirp ngược chiều
    x = sine(200, 0.4, 0.35, sweep_to=2000) + sine(2000, 0.4, 0.2, sweep_to=200)
    return fade_out(x * env(int(SR * 0.4), attack=0.01, decay=8))

def transition_zoom():
    x = sine(300, 0.35, 0.45, sweep_to=2400)
    x += noise(0.35, 0.15, seed=32) * np.linspace(0.1, 0.7, int(SR * 0.35))
    return fade_out(x)

def transition_blip():
    x = sine(900, 0.1, 0.4, sweep_to=1800) * env(int(SR * 0.1), attack=0.002, decay=30)
    tail = sine(1800, 0.06, 0.2) * env(int(SR * 0.06), attack=0.001, decay=40)
    x[-len(tail):] += tail  # blip cao chồng lên cuối chirp (cùng độ dài)
    return fade_out(np.concatenate([x, np.zeros(int(SR * 0.04))]))

# ---------------------------------------------------------------------------
# SWEEP (+4)
# ---------------------------------------------------------------------------

def sweep_rise():
    return fade_out(noise(0.7, 0.35, seed=41) * np.linspace(0.1, 1.0, int(SR * 0.7)))

def sweep_fall():
    return fade_out(noise(0.7, 0.35, seed=42) * np.linspace(1.0, 0.1, int(SR * 0.7)))

def sweep_band():
    # sweep qua lại: lên rồi xuống
    up = noise(0.4, 0.3, seed=43) * np.linspace(0.1, 1.0, int(SR * 0.4))
    dn = noise(0.4, 0.3, seed=44) * np.linspace(1.0, 0.1, int(SR * 0.4))
    return fade_out(np.concatenate([up, dn]))

def sweep_whoosh_soft():
    x = noise(0.6, 0.25, seed=45) * env(int(SR * 0.6), attack=0.1, decay=6.0)
    return fade_out(x)

# ---------------------------------------------------------------------------
# DOWNER (+3) — kết trầm, hạ dần
# ---------------------------------------------------------------------------

def downer_deep():
    x = sine(300, 1.0, 0.5, sweep_to=60)
    return fade_out(x * env(int(SR * 1.0), attack=0.01, decay=2.5))

def downer_echo():
    x = sine(400, 0.8, 0.4, sweep_to=100)
    echo = np.zeros_like(x)
    d = int(SR * 0.18)
    echo[d:] = x[:-d] * 0.4
    return fade_out(x + echo)

def downer_final():
    x = chord((220, 277, 330), 1.2, amp=0.4, decay=2.0)
    x += sine(110, 1.2, 0.3, sweep_to=55)
    return fade_out(x)

# ---------------------------------------------------------------------------
# STINGER (+4) — điểm nhấn ngắn
# ---------------------------------------------------------------------------

def stinger_brass():
    x = chord((440, 554, 659), 0.5, amp=0.45, decay=8.0)
    x += square(440, 0.5, 0.1)
    return fade_out(x)

def stinger_hit():
    x = chord((523, 659, 784), 0.3, amp=0.5, decay=12.0)
    x += noise(0.3, 0.2, seed=51) * env(int(SR * 0.3), attack=0.001, decay=40)
    return fade_out(x)

def stinger_reveal():
    x = chord((392, 523, 659, 784), 0.7, amp=0.4, decay=5.0)
    return fade_out(x)

def stinger_twinkle():
    x = np.zeros(int(SR * 0.6))
    for i, f in enumerate((1568, 2093, 2637, 3520)):
        seg = sine(f, 0.15, 0.25) * env(int(SR * 0.15), attack=0.001, decay=25)
        x[i * int(SR * 0.12):i * int(SR * 0.12) + len(seg)] += seg
    return fade_out(x)

SOUNDS = [
    ("riser-air", "riser", riser_air),
    ("riser-bright", "riser", riser_bright),
    ("riser-dark", "riser", riser_dark),
    ("riser-pulse", "riser", riser_pulse),
    ("riser-shimmer", "riser", riser_shimmer),
    ("riser-drop", "riser", riser_drop),
    ("impact-slam", "impact", impact_slam),
    ("impact-crash", "impact", impact_crash),
    ("impact-stomp", "impact", impact_stomp),
    ("impact-metal", "impact", impact_metal),
    ("impact-wood-hit", "impact", impact_wood_hit),
    ("impact-deep-boom", "impact", impact_deep_boom),
    ("impact-snap", "impact", impact_snap),
    ("transition-flip", "transition", transition_flip),
    ("transition-slide", "transition", transition_slide),
    ("transition-spin", "transition", transition_spin),
    ("transition-warp", "transition", transition_warp),
    ("transition-zoom", "transition", transition_zoom),
    ("transition-blip", "transition", transition_blip),
    ("sweep-rise", "sweep", sweep_rise),
    ("sweep-fall", "sweep", sweep_fall),
    ("sweep-band", "sweep", sweep_band),
    ("sweep-whoosh-soft", "sweep", sweep_whoosh_soft),
    ("downer-deep", "downer", downer_deep),
    ("downer-echo", "downer", downer_echo),
    ("downer-final", "downer", downer_final),
    ("stinger-brass", "stinger", stinger_brass),
    ("stinger-hit", "stinger", stinger_hit),
    ("stinger-reveal", "stinger", stinger_reveal),
    ("stinger-twinkle", "stinger", stinger_twinkle),
]

def main():
    for name, cat, fn in SOUNDS:
        write_ogg(name, fn())
        print(f"  wrote vcut-synth-{name}.ogg ({cat})")
    print(f"Done: {len(SOUNDS)} sounds")

if __name__ == "__main__":
    main()
