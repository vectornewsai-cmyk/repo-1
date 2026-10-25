#!/usr/bin/env python3
"""
Đo độ giống giọng clone một cách trung thực (Phase 9 đợt 4, agent D2).

Phương pháp: dùng CHÍNH `encode_reference()` của engine VieNeu-TTS đã cài
(vieneu 3.8.3, mode v3turbo 0.5B Apache-2.0) để lấy speaker embedding (192,)
của từng file audio, rồi tính cosine similarity giữa các embedding.

Mọi file đều được cắt về cùng 20s đầu (ffmpeg) trước khi encode để so sánh
công bằng và tránh encode file dài tốn RAM. Không có ngưỡng "giống/không
giống" do D2 tự đặt: kết quả được đọc cùng các cặp đối chứng:
  - ref x ref (encode 2 lần): kiểm tra tính xác định của encoder (kỳ vọng ~1.0).
  - cùng giọng khác text (ref Truc Ly x trucly_short2): thang tham chiếu
    "cùng người nói" của chính encoder này.
  - khác giọng (ref Truc Ly x preset Hai Dang): thang tham chiếu "khác người".
  - ref x clone: con số cần đánh giá — chỉ được claim clone giữ giọng khi
    nó gần thang "cùng người" và rõ ràng trên thang "khác người".

Chạy: .venv2/bin/python test_d2_similarity.py <dir-chua-wav>
  Cần có trong dir: ref.wav, clone_long.wav, preset_long.wav, trucly_short2.wav
  (tên đúng như test D2). In ra bảng cosine + JSON.
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

    d = sys.argv[1] if len(sys.argv) > 1 else "/tmp/d2-test"
    model_dir = os.path.join(HERE, "models")
    tts = load_engine(model_dir)
    if tts is None:
        print("không nạp được engine", file=sys.stderr)
        return 3

    names = ["ref", "clone_long", "preset_long", "trucly_short2"]
    embs = {}
    for n in names:
        src = os.path.join(d, n + ".wav")
        if not os.path.isfile(src):
            print(f"thiếu file: {src}", file=sys.stderr)
            return 2
        cut = os.path.join(d, n + "_20s.wav")
        trim20(src, cut)
        enc = tts.encode_reference(cut)
        if not (isinstance(enc, (list, tuple)) and len(enc) == 2):
            print(f"encode_reference không trả tuple (emb, codes) cho {n}: "
                  f"{type(enc)}", file=sys.stderr)
            return 2
        emb = np.asarray(enc[0], dtype=np.float64).flatten()
        embs[n] = emb
        print(f"{n}: emb shape {emb.shape}, norm {float((emb * emb).sum() ** 0.5):.3f}")

    # Tính xác định: encode lại ref một lần nữa.
    enc2 = tts.encode_reference(os.path.join(d, "ref_20s.wav"))
    embs["ref2"] = np.asarray(enc2[0], dtype=np.float64).flatten()

    pairs = [
        ("ref x ref (encode 2 lan, tinh xac dinh)", "ref", "ref2"),
        ("cung giong khac text: ref x trucly_short2", "ref", "trucly_short2"),
        ("khac giong: ref x preset_long (Hai Dang)", "ref", "preset_long"),
        ("CANH GIA CHINH: ref x clone_long", "ref", "clone_long"),
        ("doi chung: preset_long x clone_long (cung text, khac giong goc)", "preset_long", "clone_long"),
    ]
    out = {}
    print("\n== COSINE SIMILARITY (speaker_emb 192 chieu, 20s dau) ==")
    for label, a, b in pairs:
        s = cosine(embs[a], embs[b])
        out[label] = round(s, 4)
        print(f"{s:.4f}  {label}")
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
