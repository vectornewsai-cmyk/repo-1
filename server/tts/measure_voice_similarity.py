#!/usr/bin/env python3
"""
Đo độ giống giọng bằng speaker embedding của chính engine VieNeu-TTS
(Phase 9 đợt 85 M7 — thay cho script cosine_l8.py dùng 1 lần ở đợt 84
rồi không lưu lại repo).

Phương pháp (như test_d2_similarity.py đợt 4): dùng `encode_reference()`
của engine đã cài (vieneu, mode v3turbo 0.5B Apache-2.0) để lấy speaker
embedding (192,) của từng file audio, rồi tính cosine giữa các cặp.
Mọi file đều cắt về cùng 20s đầu (ffmpeg) trước khi encode để so sánh
công bằng và tránh encode file dài tốn RAM. Không có ngưỡng "giống/không
giống" tự đặt: kết quả đọc cùng các cặp đối chứng trong cùng 1 lần chạy:
  - ref x ref (encode 2 lần): tính xác định của encoder (kỳ vọng ~1.0).
  - cùng người nói khác text: thang tham chiếu "cùng giọng".
  - khác người nói: thang tham chiếu "khác giọng".
  - ref x clone: con số cần đánh giá — chỉ claim clone giữ giọng khi nó
    gần thang "cùng người" và rõ ràng trên thang "khác người".

Chạy: .venv2/bin/python measure_voice_similarity.py <dir-chua-wav> <file1> <file2> [...]
  In ra bảng cosine tất cả các cặp + JSON. Ví dụ:
    .venv2/bin/python measure_voice_similarity.py /tmp/m7-sim \\
      ref2277.wav clone2277.wav ref2086.wav
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

TRIM_SEC = 20


def trim20(src, dst):
    r = subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", src, "-t", str(TRIM_SEC),
         "-ar", "48000", "-ac", "1", dst],
        capture_output=True, text=True)
    if r.returncode != 0 or not os.path.isfile(dst):
        raise RuntimeError(f"ffmpeg trim thất bại cho {src}: {r.stderr.strip()}")


def cosine(a, b):
    import numpy as np
    a = np.asarray(a, dtype=np.float64).flatten()
    b = np.asarray(b, dtype=np.float64).flatten()
    na = float((a * a).sum() ** 0.5)
    nb = float((b * b).sum() ** 0.5)
    if na == 0 or nb == 0:
        return 0.0
    return float((a * b).sum() / (na * nb))


def main():
    import numpy as np
    from tts import load_engine

    if len(sys.argv) < 4:
        print(__doc__, file=sys.stderr)
        print("cần: <dir> <file1> <file2> [file3 ...]", file=sys.stderr)
        return 2
    d = sys.argv[1]
    names = [os.path.splitext(f)[0] for f in sys.argv[2:]]
    files = sys.argv[2:]
    model_dir = os.path.join(HERE, "models")
    tts = load_engine(model_dir)
    if tts is None:
        print("không nạp được engine", file=sys.stderr)
        return 3

    embs = {}
    for name, f in zip(names, files):
        src = os.path.join(d, f)
        if not os.path.isfile(src):
            print(f"thiếu file: {src}", file=sys.stderr)
            return 2
        cut = os.path.join(d, name + "_20s.wav")
        trim20(src, cut)
        enc = tts.encode_reference(cut)
        if not (isinstance(enc, (list, tuple)) and len(enc) == 2):
            print(f"encode_reference không trả tuple (emb, codes) cho {name}: "
                  f"{type(enc)}", file=sys.stderr)
            return 2
        embs[name] = np.asarray(enc[0], dtype=np.float64).flatten()
        print(f"encoded {name}: emb dim {embs[name].shape[0]}", file=sys.stderr)

    # Đối chứng xác định: encode lại file đầu tiên 1 lần nữa.
    first = names[0]
    enc2 = tts.encode_reference(os.path.join(d, first + "_20s.wav"))
    det = cosine(embs[first], np.asarray(enc2[0], dtype=np.float64).flatten())

    pairs = {}
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            pairs[f"{names[i]} x {names[j]}"] = round(cosine(embs[names[i]], embs[names[j]]), 4)
    out = {"determinism_ref_x_ref_again": round(det, 4), "pairs": pairs}
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
