#!/usr/bin/env python3
"""beat.py — Phát hiện beat từ audio cho VCut Studio (Phase 8 Q5).

Chỉ dùng numpy + stdlib (không cần librosa — librosa nặng và kéo nhiều
dependency; thuật toán dưới đây đủ tốt cho nhạc có beat rõ, và trung thực
ghi rõ giới hạn trong BEATS_LIMITS.md).

Pipeline:
  1. ffmpeg decode audio → mono 22050 Hz, PCM 16-bit (pipe stdout).
  2. STFT (cửa sổ Hann 2048, hop 512) → magnitude spectrogram.
  3. Spectral flux: tổng phần tăng của magnitude theo thời gian → onset envelope.
  4. Ước lượng tempo: autocorrelation của onset envelope, tìm lag ứng với
     40–240 BPM có peak chuẩn hoá cao nhất (tránh octave bằng cách ưu tiên
     peak gần 120 BPM nhất khi 2 peak gần bằng nhau — xem code).
  5. Beat tracking: quy hoạch động kiểu Ellis đơn giản — mỗi beat được
     chọn sao cho vừa rơi vào onset mạnh, vừa cách beat trước ~1 chu kỳ.

Phase 9 D5 (gap A7): thêm trường "structure" từ structure.py —
downbeat + meter (accent onset) và phân đoạn verse/chorus/drop kiểu
heuristic (chroma + self-similarity + novelty). Lỗi ở bước cấu trúc
không làm hỏng kết quả beat: khi đó structure = {"error": ...}.
Xem D5_LIMITS.md để biết độ tin cậy thật (không claim hiểu nhạc).

Cách dùng:
  python3 beat.py --input music.mp3 --out beats.json
  python3 beat.py --input music.mp3 --out beats.json --min-bpm 60 --max-bpm 180

Output JSON: { bpm, beats: [giây...], duration, sample_rate, method,
                structure: { meter, meter_confidence, downbeats, sections } }.
"""

import argparse
import json
import subprocess
import sys

import numpy as np

SR = 22050
WIN = 2048
HOP = 512


def decode_audio(path):
    """ffmpeg decode → mono SR Hz, int16 numpy array."""
    cmd = ["ffmpeg", "-v", "error", "-i", path,
           "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"]
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(f"ffmpeg decode thất bại: {p.stderr.decode()[-500:]}")
    return np.frombuffer(p.stdout, dtype=np.int16).astype(np.float32) / 32768.0


def stft_mag(x):
    """Magnitude spectrogram (Hann, WIN, HOP). Trả về (freq_bins, frames)."""
    if len(x) < WIN:
        x = np.pad(x, (0, WIN - len(x)))
    window = np.hanning(WIN)
    frames = 1 + (len(x) - WIN) // HOP
    mag = np.empty((WIN // 2 + 1, frames), dtype=np.float32)
    for i in range(frames):
        seg = x[i * HOP:i * HOP + WIN] * window
        mag[:, i] = np.abs(np.fft.rfft(seg))
    return mag


def onset_envelope(mag):
    """Spectral flux: tổng phần tăng magnitude giữa 2 frame liên tiếp."""
    diff = np.diff(mag, axis=1)
    diff[diff < 0] = 0
    env = diff.sum(axis=0)
    # Chuẩn hoá về 0..1 để ngưỡng không phụ thuộc âm lượng tuyệt đối.
    mx = env.max() if env.size else 0.0
    if mx > 0:
        env = env / mx
    return env


def estimate_tempo(env, min_bpm=40, max_bpm=240):
    """Autocorrelation của onset envelope → BPM. Trả về (bpm, period_s)."""
    e = env - env.mean()
    if len(e) < 10:
        return 120.0, 0.5
    corr = np.correlate(e, e, mode="full")[len(e) - 1:]
    corr = corr / (corr[0] + 1e-12)
    # Lag ứng với BPM: lag = SR_beat? onset envelope có fps = SR/HOP.
    env_fps = SR / HOP
    min_lag = int(env_fps * 60 / max_bpm)
    max_lag = int(env_fps * 60 / min_bpm)
    min_lag = max(1, min_lag)
    max_lag = min(len(corr) - 1, max_lag)
    if max_lag <= min_lag:
        return 120.0, 0.5
    window = corr[min_lag:max_lag + 1]
    # Chống octave: autocorrelation của nhạc có beat thường có peak mạnh ở
    # cả chu kỳ T và bội số 2T (thậm chí 4T). Peak ở 2T hay cao hơn peak ở T
    # một chút vì onset trùng khít hơn sau nhiều chu kỳ — nhưng tempo thật
    # là chu kỳ NGẮN nhất còn mạnh. Vì vậy cứ chia đôi lag chừng nào lag
    # con vẫn giữ >= 80% giá trị peak (kiểm tra cả 2 bin kề vì peak thật
    # có thể nằm giữa 2 bin rời rạc, vd chu kỳ 0.5s = 21.53 frame).
    # Phase 9 D5: ngưỡng 80% thay vì 85% — nhạc 4/4 có downbeat nhấn mạnh
    # (kick ô 1 to hơn) làm corr ở lag 2 beat cao hơn hẳn lag 1 beat
    # (đo thật: 0.879 vs 0.736, tỉ lệ 0.837): ngưỡng 85% kẹt ở half-time
    # 60 BPM cho bài 120 BPM, kéo theo downbeat thưa gấp đôi. Ngưỡng 80%
    # vẫn chặn chia đôi khi lag con thực sự yếu (vd corr lag 0.25s âm),
    # và test click đều của Q5 vẫn pass (xem test_beat.py + test_structure.py).
    best = int(np.argmax(window)) + min_lag
    best_val = corr[best]
    while best // 2 >= min_lag:
        half = best // 2
        half_val = max(corr[half], corr[half + 1] if half + 1 <= max_lag else 0)
        if half_val >= 0.80 * best_val:
            best = half if corr[half] >= corr[half + 1] else half + 1
            best_val = corr[best]
        else:
            break
    # Nội suy parabol quanh đỉnh để có lag phân số: 1 bin rời rạc = ~23ms,
    # ở 120 BPM đã là ~5 BPM sai số — không nội suy thì không đạt ±2 BPM.
    lag_frac = float(best)
    if 0 < best < len(corr) - 1:
        a, b, c = corr[best - 1], corr[best], corr[best + 1]
        denom = a - 2 * b + c
        if denom != 0:
            delta = 0.5 * (a - c) / denom
            if abs(delta) <= 1.0:
                lag_frac = best + delta
    period = lag_frac / env_fps
    return 60.0 / period, period


def track_beats(env, period, first_beat_bias=0.0):
    """DP beat tracking: chọn beat vừa mạnh onset vừa đều chu kỳ.

    Đổi khung thời gian: env[i] là flux giữa 2 frame STFT i và i+1, mà
    frame STFT i+1 có cửa sổ [start, start+WIN] — sự kiện (click) làm
    magnitude tăng ngay khi nó LỌT VÀO cửa sổ, tức sớm hơn thời điểm thật
    tới ~WIN/SR. Không bù offset này thì beat phát hiện lệch sớm ~80ms
    (đo thật trên click track). Offset bù = tâm cửa sổ frame i+1:
    (HOP + WIN/2)/SR ≈ 69.7ms.
    """
    env_fps = SR / HOP
    CENTER_OFFSET = (HOP + WIN / 2) / SR
    n = len(env)
    if n == 0:
        return []
    period_frames = max(1.0, period * env_fps)
    # dp[i] = điểm tốt nhất của chuỗi kết thúc tại frame i.
    NEG = -1e18
    dp = np.full(n, NEG)
    prev = np.full(n, -1, dtype=int)
    # Khởi tạo: beat đầu có thể ở bất kỳ frame nào trong 1 chu kỳ đầu.
    warmup = max(1, int(period_frames))
    for i in range(min(warmup, n)):
        dp[i] = env[i]
    for i in range(n):
        if dp[i] == NEG:
            continue
        # Beat tiếp theo trong [0.5, 2] chu kỳ sau i.
        lo = i + max(1, int(0.5 * period_frames))
        hi = min(n - 1, i + int(2.0 * period_frames) + 1)
        for j in range(lo, hi + 1):
            gap = (j - i) / period_frames
            penalty = 4.0 * (np.log(max(gap, 1e-6))) ** 2
            score = dp[i] + env[j] - penalty
            if score > dp[j]:
                dp[j] = score
                prev[j] = i
    # Backtrack từ frame có dp cao nhất trong nửa cuối.
    end = int(np.argmax(dp[n // 2:])) + n // 2 if n > 1 else 0
    beats = []
    i = end
    while i >= 0:
        beats.append(i / env_fps + CENTER_OFFSET + first_beat_bias)
        i = prev[i]
    beats.reverse()
    # Lọc beat quá gần nhau (< 0.35 chu kỳ) — giữ beat mạnh hơn.
    filtered = []
    for b in beats:
        if filtered and b - filtered[-1] < 0.35 * period:
            continue
        filtered.append(b)
    return filtered


def main():
    ap = argparse.ArgumentParser(description="Phát hiện beat từ audio (numpy-only).")
    ap.add_argument("--input", required=True, help="File audio/video nguồn")
    ap.add_argument("--out", required=True, help="File JSON beat xuất ra")
    ap.add_argument("--min-bpm", type=float, default=40)
    ap.add_argument("--max-bpm", type=float, default=240)
    args = ap.parse_args()

    x = decode_audio(args.input)
    duration = len(x) / SR
    if len(x) < SR // 2:
        print("LỖI: audio quá ngắn (< 0.5s), không đủ phát hiện beat", file=sys.stderr)
        return 2
    mag = stft_mag(x)
    env = onset_envelope(mag)
    bpm, period = estimate_tempo(env, args.min_bpm, args.max_bpm)
    beats = [round(b, 3) for b in track_beats(env, period) if b <= duration]
    # Phase 9 D5: cấu trúc nhạc — lỗi ở đây không được hỏng beat.
    try:
        from structure import analyze_structure
        structure = analyze_structure(mag, env, beats, period, duration)
    except Exception as e:  # noqa: BLE001 — báo lỗi, vẫn trả beat
        structure = {"error": f"phân tích cấu trúc thất bại: {e}"}
    out = {
        "version": 1,
        "method": "numpy-spectral-flux+dp",
        "input": args.input,
        "duration": round(duration, 3),
        "sample_rate": SR,
        "bpm": round(bpm, 2),
        "period": round(period, 4),
        "beats": beats,
        "structure": structure,
    }
    with open(args.out, "w") as f:
        json.dump(out, f, indent=2)
    print(f"beat xong: bpm={bpm:.1f}, {len(beats)} beats, duration={duration:.2f}s -> {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
