#!/usr/bin/env python3
"""structure.py — Hiểu cấu trúc nhạc cho beat sync (Phase 9 D5, gap A7).

beat.py trước đây chỉ trả BPM + beat cơ học. Module này thêm, thuần
numpy, không dependency mới, không model đóng, không gọi mạng:

  1. Downbeat + meter: thử nhịp 4/4 và 3/4 với mọi pha (phase) có thể,
     chấm điểm bằng độ mạnh onset (spectral flux) tại các beat ứng viên
     làm downbeat so với các beat còn lại. Nhịp 1 trong nhạc phổ biến
     thường được nhấn (kick/bass mạnh hơn) nên flux tại downbeat cao hơn
     trung bình — đó là toàn bộ "hiểu biết" của thuật toán, không hơn.
  2. Phân đoạn (verse/chorus/drop): chroma 12 cung từ magnitude STFT,
     gom đặc trưng theo từng beat (+ 1 chiều log-năng lượng chuẩn hoá,
     trọng số 0.5, để tách đoạn cùng tông nhưng khác năng lượng),
     ma trận tự tương đồng (self-similarity, cosine), đường novelty
     kiểu Foote dạng trung bình (mean khối trước + sau - 2*mean chéo)
     → biên đoạn → gom đoạn lặp lại bằng cosine giữa các đoạn.

Nhãn đoạn là HEURISTIC, không phải hiểu biết âm nhạc thật:
  - Đoạn nào lặp lại nhiều nhất được ghi chú "lặp lại nhiều nhất
    (kiểu chorus)" — vì chorus trong nhạc pop thường là phần lặp.
  - Đoạn năng lượng trung bình cao nhất được ghi chú "năng lượng cao
    nhất (kiểu drop)" — vì drop thường là phần to nhất.
  Cả hai đều có thể sai trên nhạc không theo cấu trúc pop, và module
  KHÔNG claim hiểu cảm xúc, thể loại hay "hay/dở" của nhạc.

Hàm thuần túy, test được không cần ffmpeg: test_structure.py kiểm chứng
trực tiếp các hàm này trên mảng tổng hợp, và kiểm chứng end-to-end qua
beat.py trên nhạc test tổng hợp có nhịp + cấu trúc biết trước.

Quy ước thời gian (khớp beat.py):
  - env (onset envelope) frame i ứng với thời gian
    i / env_fps + CENTER_OFFSET, với CENTER_OFFSET = (HOP + WIN/2) / SR.
  - STFT frame i có tâm tại (i * HOP + WIN / 2) / SR.
"""

import numpy as np

SR = 22050
WIN = 2048
HOP = 512
CENTER_OFFSET = (HOP + WIN / 2) / SR


# ---------------------------------------------------------------- chroma

def _chroma_matrix(n_bins, sr=SR, win=WIN):
    """Ma trận (12, n_bins): mỗi bin tần số đóng góp vào 1 cung.

    Cung tính từ MIDI: note = 69 + 12*log2(f/440), pc = note mod 12.
    Bin ngoài [50, 8000] Hz bỏ qua (quá trầm không phân biệt cung tốt,
    quá cao chủ yếu là hài âm/nhiễu).
    """
    freqs = np.arange(n_bins) * sr / win
    mat = np.zeros((12, n_bins), dtype=np.float32)
    valid = (freqs >= 50) & (freqs <= 8000)
    notes = 69 + 12 * np.log2(np.maximum(freqs[valid], 1e-6) / 440.0)
    pcs = np.mod(np.round(notes).astype(int), 12)
    for pc, col in zip(pcs, np.where(valid)[0]):
        mat[pc, col] = 1.0
    return mat


def chroma_from_mag(mag, sr=SR, win=WIN):
    """Magnitude STFT (freq_bins, frames) → chroma (12, frames).

    Dùng căn bậc hai magnitude để hài âm mạnh không lấn át nốt gốc.
    Mỗi frame chuẩn hoá L2 (frame câm → vector 0).
    """
    mat = _chroma_matrix(mag.shape[0], sr, win)
    chroma = mat @ np.sqrt(np.maximum(mag, 0))
    norms = np.linalg.norm(chroma, axis=0, keepdims=True)
    norms[norms == 0] = 1.0
    return chroma / norms


# ---------------------------------------------------------------- downbeat

def _env_at(env, t, env_fps):
    """Giá trị onset envelope quanh thời điểm t (max trong ±1 frame)."""
    i = int(round((t - CENTER_OFFSET) * env_fps))
    lo = max(0, i - 1)
    hi = min(len(env), i + 2)
    if lo >= hi:
        return 0.0
    return float(np.max(env[lo:hi]))


def estimate_downbeats(beats, env, env_fps):
    """Thử meter 4 và 3, mọi pha. Trả về dict.

    Điểm của 1 ứng viên (meter m, pha p):
        mean(accent tại beat p, p+m, ...) - mean(accent tại beat còn lại)
    Accent = onset flux quanh beat. Meter thắng là điểm cao nhất; nếu
    4/4 đạt >= 95% điểm của 3/4 thì ưu tiên 4/4 (phổ biến hơn, tránh
    chọn 3/4 do nhiễu khi bài thực ra là 4/4).
    Confidence = biên độ thắng / (điểm thắng + eps), kẹp 0..1 — chỉ là
    độ tách biệt giữa các ứng viên, KHÔNG phải xác suất đúng.
    """
    beats = [float(b) for b in beats]
    if len(beats) < 8 or len(env) == 0:
        return {"meter": None, "meter_confidence": 0.0, "downbeats": []}
    accents = np.array([_env_at(env, b, env_fps) for b in beats])
    best = None  # (score, meter, phase)
    per_meter = {}
    for meter in (4, 3):
        if len(beats) < 2 * meter:
            continue
        for phase in range(meter):
            idx_down = np.arange(phase, len(beats), meter)
            mask = np.zeros(len(beats), dtype=bool)
            mask[idx_down] = True
            if mask.sum() < 2 or (~mask).sum() < 2:
                continue
            score = float(accents[mask].mean() - accents[~mask].mean())
            per_meter.setdefault(meter, []).append((score, phase))
            if best is None or score > best[0]:
                best = (score, meter, phase)
    if best is None:
        return {"meter": None, "meter_confidence": 0.0, "downbeats": []}
    # Ưu tiên 4/4 khi gần bằng 3/4.
    if 4 in per_meter and 3 in per_meter:
        s4, p4 = max(per_meter[4])
        s3, _ = max(per_meter[3])
        if s4 >= 0.95 * s3 and best[1] == 3:
            best = (s4, 4, p4)
    score, meter, phase = best
    # Confidence: biên độ thắng so với ứng viên tốt thứ hai khác meter/pha.
    all_scores = sorted(
        (s for m in per_meter for (s, _) in per_meter[m]), reverse=True)
    second = all_scores[1] if len(all_scores) > 1 else 0.0
    margin = score - second
    conf = margin / (abs(score) + 1e-9) if score > 0 else 0.0
    conf = float(max(0.0, min(1.0, conf)))
    downbeats = [beats[i] for i in range(phase, len(beats), meter)]
    return {"meter": meter, "meter_confidence": round(conf, 3),
            "downbeats": [round(d, 3) for d in downbeats]}


# ---------------------------------------------------------------- sections

def _frame_range_for_time(t0, t1, n_frames):
    """Đổi khoảng thời gian → khoảng frame STFT (theo tâm frame)."""
    f0 = int(np.floor((t0 * SR - WIN / 2) / HOP))
    f1 = int(np.ceil((t1 * SR - WIN / 2) / HOP))
    return max(0, f0), min(n_frames, max(f1, f0 + 1))


def beat_features(chroma, mag, beats, duration):
    """Đặc trưng mỗi beat: chroma trung bình (L2-norm) + năng lượng.

    Trả về (features (N, 12), energy (N,), beat_starts (N,)).
    N = số beat; beat cuối kéo tới cuối nhạc.
    """
    n_frames = chroma.shape[1]
    feats = []
    energy = []
    starts = []
    for i, b in enumerate(beats):
        e = beats[i + 1] if i + 1 < len(beats) else duration
        f0, f1 = _frame_range_for_time(b, e, n_frames)
        c = chroma[:, f0:f1].mean(axis=1) if f1 > f0 else np.zeros(12)
        n = np.linalg.norm(c)
        feats.append(c / n if n > 0 else c)
        energy.append(float(mag[:, f0:f1].mean()) if f1 > f0 else 0.0)
        starts.append(float(b))
    return np.array(feats), np.array(energy), np.array(starts)


def self_similarity(features):
    """Ma trận cosine (N, N), đường chéo = 1."""
    norms = np.linalg.norm(features, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    fn = features / norms
    ssm = fn @ fn.T
    return np.clip(ssm, -1.0, 1.0)


def novelty_curve(ssm, kernel_half=4):
    """Đường novelty kiểu Foote, dạng trung bình (không phải tổng).

    Tại tâm i: novelty = mean(khối trước) + mean(khối sau)
    - mean(tương đồng chéo trước-sau). Khối trước = SSM[i-k:i, i-k:i],
    khối sau = SSM[i:i+k, i:i+k].
    Dạng trung bình (thay vì tổng checkerboard) là bắt buộc ở biên:
    bản tổng tạo đỉnh giả ở beat 0/cuối vì cửa sổ lệch hẳn một phía
    làm góc kernel toàn +1 (đo thật: đỉnh giả 16.0 ở beat 0, 9.0 ở beat
    cuối, trong khi biên đoạn thật chỉ ~7). Tâm cần >= 2 beat mỗi phía,
    nếu không novelty = 0 (biên trong 2 beat đầu/cuối nhạc bị bỏ qua —
    đánh đổi có ghi trong D5_LIMITS.md).
    """
    n = ssm.shape[0]
    k = max(1, min(kernel_half, n // 4)) if n >= 8 else 1
    nov = np.zeros(n)
    for i in range(n):
        lo = max(0, i - k)
        hi = min(n, i + k)
        if i - lo < 2 or hi - i < 2:
            continue
        before = ssm[lo:i, lo:i].mean()
        after = ssm[i:hi, i:hi].mean()
        cross = 0.5 * (ssm[lo:i, i:hi].mean() + ssm[i:hi, lo:i].mean())
        nov[i] = float(before + after - 2.0 * cross)
    # Làm mượt 3 điểm để đỉnh không vỡ vì nhiễu từng beat.
    if n >= 3:
        sm = nov.copy()
        sm[1:-1] = (nov[:-2] + nov[1:-1] + nov[2:]) / 3.0
        nov = sm
    return nov


def pick_boundaries(novelty, min_distance=8):
    """Đỉnh cục bộ vượt ngưỡng.

    Ngưỡng = max(median + 0.5*(max - median), median + 0.15): vế thứ hai
    là sàn tuyệt đối để nhạc đồng nhất (không có đoạn nào thật) không
    sinh biên giả từ nhiễu — novelty trong đoạn thường < 0.1.
    """
    n = len(novelty)
    if n < 2 * min_distance:
        return []
    med = float(np.median(novelty))
    mx = float(np.max(novelty))
    thresh = max(med + 0.5 * (mx - med), med + 0.15)
    peaks = []
    for i in range(1, n - 1):
        if novelty[i] >= novelty[i - 1] and novelty[i] >= novelty[i + 1] \
                and novelty[i] > thresh:
            peaks.append(i)
    # Lọc đỉnh quá gần nhau, giữ đỉnh mạnh hơn.
    peaks.sort(key=lambda i: -novelty[i])
    kept = []
    for p in peaks:
        if all(abs(p - q) >= min_distance for q in kept):
            kept.append(p)
    return sorted(kept)


def segment_sections(features, energy, beats, duration, boundaries):
    """Biên (chỉ số beat) → đoạn {start, end, label, repeats, mean_energy}.

    Gom nhãn tham lam theo thứ tự: đoạn giống (cosine trung bình chroma
    > 0.90) một nhãn đã có thì nhận nhãn đó, ngược lại nhận chữ cái mới.
    """
    n = len(beats)
    if n == 0:
        return []
    cuts = [0] + [b for b in boundaries if 0 < b < n] + [n]
    # Gộp đoạn ngắn (< 4 beat) vào đoạn trước (trừ đoạn đầu gộp vào sau).
    segs = []
    for a, b in zip(cuts[:-1], cuts[1:]):
        if segs and b - a < 4:
            segs[-1] = (segs[-1][0], b)
        elif not segs and b - a < 4 and len(cuts) > 2:
            segs.append((a, b))
        else:
            segs.append((a, b))
    if not segs:
        segs = [(0, n)]
    labels = []
    reps = []  # mean chroma đại diện mỗi nhãn
    out = []
    for (a, b) in segs:
        mean_feat = features[a:b].mean(axis=0)
        lab = None
        for j, rep in enumerate(reps):
            denom = np.linalg.norm(mean_feat) * np.linalg.norm(rep)
            sim = float(mean_feat @ rep / denom) if denom > 0 else 0.0
            if sim > 0.90:
                lab = chr(ord("A") + j)
                break
        if lab is None:
            lab = chr(ord("A") + len(reps))
            reps.append(mean_feat)
        labels.append(lab)
        start = 0.0 if a == 0 else float(beats[a])
        end = float(duration) if b >= n else float(beats[b])
        out.append({
            "start": round(start, 3),
            "end": round(end, 3),
            "label": lab,
            "mean_energy": round(float(energy[a:b].mean()) if b > a else 0.0, 6),
        })
    # Đếm lặp + đánh dấu đoạn năng lượng cao nhất.
    counts = {}
    for s in out:
        counts[s["label"]] = counts.get(s["label"], 0) + 1
    max_e = max((s["mean_energy"] for s in out), default=0.0)
    for s in out:
        s["repeats"] = counts[s["label"]]
        s["highest_energy"] = bool(max_e > 0 and s["mean_energy"] == max_e)
    return out


def analyze_structure(mag, env, beats, period, duration, sr=SR):
    """Chạy toàn bộ: downbeat + phân đoạn. Không raise khi thiếu dữ liệu.

    Trả về dict JSON-serializable cho beat.py gắn vào output.
    """
    beats = [float(b) for b in beats]
    env_fps = sr / HOP
    result = {"meter": None, "meter_confidence": 0.0, "downbeats": [],
              "sections": []}
    if len(beats) < 8 or mag.shape[1] < 8:
        return result
    db = estimate_downbeats(beats, env, env_fps)
    result.update(db)
    chroma = chroma_from_mag(mag, sr)
    feats, energy, _ = beat_features(chroma, mag, beats, duration)
    # Chiều năng lượng phụ (log-energy chuẩn hoá, trọng số 0.5): đoạn
    # cùng tông nhưng to hơn hẳn (kiểu verse -> drop) vẫn tách được —
    # chroma thuần không phân biệt nổi (đo thật: cosine A-C = 0.94).
    # Trọng số nhỏ để crescendo từ từ trong đoạn không tạo biên giả.
    log_e = np.log(energy + 1e-6)
    std_e = float(log_e.std())
    z_e = (log_e - log_e.mean()) / std_e if std_e > 1e-9 else np.zeros_like(log_e)
    feats = np.concatenate([feats, (0.5 * np.clip(z_e, -2, 2))[:, None]], axis=1)
    if len(feats) >= 16:
        # SSM quá lớn trên nhạc rất dài → gom 2 beat/đơn vị cho N <= 1500.
        step = 1
        while len(feats) // step > 1500:
            step *= 2
        if step > 1:
            nf = len(feats) // step
            feats = feats[:nf * step].reshape(nf, step, -1).mean(axis=1)
            energy = energy[:nf * step].reshape(nf, step).mean(axis=1)
            beats_ds = [beats[i * step] for i in range(nf)]
        else:
            beats_ds = beats
        ssm = self_similarity(feats)
        nov = novelty_curve(ssm)
        # Biên là chỉ số vào mảng đặc trưng (đã gom nếu step > 1); mốc
        # thời gian tương ứng lấy từ beats_ds nên không cần đổi chỉ số.
        bounds = pick_boundaries(nov)
        result["sections"] = segment_sections(
            feats, energy, beats_ds, duration, bounds)
    return result
