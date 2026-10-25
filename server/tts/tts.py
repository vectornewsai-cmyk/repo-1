#!/usr/bin/env python3
"""
TTS LOCAL tiếng Việt cho dự án trình dựng video (R1-083, Batch H).

    python tts.py --text "Xin chào Việt Nam" --voice "Hải Đăng" --out out.wav

- 100% local: VieNeu-TTS v3 Turbo (bản 0.5B) chạy ONNX trên CPU, KHÔNG gọi API cloud.
- License: Apache 2.0 — verify 2 nguồn độc lập (2026-10-19):
  (1) PyPI package `vieneu` (pip show vieneu → "License: Apache License Version 2.0");
  (2) HuggingFace model repo pnnbao-ump/VieNeu-TTS-v3-Turbo (cardData license: apache-2.0).
- ⚠️ BẪY LICENSE: KHÔNG dùng bản 0.3B (CC BY-NC 4.0 — cấm thương mại).
  Script này ép mode="v3turbo" (bản 0.5B). Không có flag nào chọn bản khác.
- Watermark: VieNeu-TTS bật watermark MẶC ĐỊNH (Perth). Script này LUÔN gọi
  infer(..., apply_watermark=False) — xem TTS_LIMITS.md.

25 giọng preset có sẵn (xem --list-voices). Giọng là tên tiếng Việt, ví dụ "Hải Đăng".

Model được tải 1 lần vào --model-dir (mặc định server/tts/models).
Chạy `python fetch_model.py` trước để tải sẵn (không bắt buộc).
"""

import argparse
import json
import os
import sys
import time

HF_REPO = "pnnbao-ump/VieNeu-TTS-v3-Turbo"
CODEC_REPO = "OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX"
# Ép đúng bản 0.5B Apache-2.0 — không cho chọn mode khác qua CLI.
TTS_MODE = "v3turbo"
# Giới hạn độ dài text 1 lần gọi (bảo vệ server khỏi request khổng lồ).
# Phase 9 R4: nâng 2000 → 5000 ký tự vì tts.py nay tự chia câu + nối liền
# mạch (xem split_text_chunks); text dài hơn vẫn bị từ chối rõ ràng.
MAX_TEXT_LEN = 5000
SAMPLE_RATE = 48000
# Chunk tối đa khi tự chia text dài (model tự chunk ở tầng phoneme với
# max_chars=256 bên trong; chunk 800 ký tự ở đây là mức câu/đoạn để mỗi lần
# infer có đủ ngữ cảnh ngữ điệu, không cắt giữa từ — xem R4_LIMITS.md).
CHUNK_MAX_CHARS = 800
# Crossfade giữa 2 chunk nối nhau (tránh tiếng "tách" ở mối nối).
CHUNK_FADE_MS = 20
# Giọng mẫu clone tối đa 120s (encode_reference nạp toàn bộ file vào RAM).
MAX_REF_AUDIO_SEC = 120


def log(msg):
    print(f"[tts] {msg}", flush=True)


def parse_args(argv=None):
    p = argparse.ArgumentParser(description="TTS local tiếng Việt (VieNeu-TTS 0.5B)")
    p.add_argument("--text", required=True, help="Văn bản cần đọc")
    p.add_argument("--voice", default=None, help="Tên giọng (mặc định của model)")
    p.add_argument("--ref-audio", default=None,
                   help="Phase 9 R4: file audio giọng mẫu để CLONE giọng "
                        "(ghi đè --voice; mẫu 3-30s, giọng rõ, tối đa 120s)")
    p.add_argument("--out", required=True, help="Đường dẫn file WAV đầu ra")
    p.add_argument("--model-dir", default=None,
                   help="Thư mục cache model (mặc định server/tts/models)")
    p.add_argument("--list-voices", action="store_true",
                   help="Liệt kê giọng có sẵn rồi thoát")
    return p.parse_args(argv)


# ---------------------------------------------------------------------------
# Phase 9 R4: chia text dài thành chunk theo câu + nối liền mạch
# ---------------------------------------------------------------------------
_SENTENCE_RE = None


def _sentence_re():
    global _SENTENCE_RE
    if _SENTENCE_RE is None:
        import re
        # Câu = chuỗi không chứa dấu kết câu/xuống dòng + dấu kết câu kèm
        # dấu đóng ngoặc/ngoặc kép (nếu có) — hoặc phần còn lại cuối text.
        _SENTENCE_RE = re.compile(r'[^.!?…\n]+(?:[.!?…]+["\'”)\]]*|$)')
    return _SENTENCE_RE


def split_into_sentences(text):
    """Tách text thành câu, giữ dấu kết câu. Không bao giờ cắt giữa từ."""
    out = []
    for m in _sentence_re().finditer(text):
        s = m.group(0).strip()
        if s:
            out.append(s)
    return out


def _split_long_sentence(sentence, max_chars):
    """Câu đơn dài hơn max_chars: tách ở dấu phẩy/chấm phẩy/hai chấm,
    cuối cùng tách ở khoảng trắng — KHÔNG BAO GIỜ cắt giữa từ."""
    import re
    pieces = []
    for part in re.split(r'(?<=[,;:])\s+', sentence):
        part = part.strip()
        if not part:
            continue
        if len(part) <= max_chars:
            pieces.append(part)
            continue
        # Tách ở khoảng trắng, gom từ cho tới khi đầy chunk.
        cur = ""
        for word in part.split(" "):
            if not word:
                continue
            if cur and len(cur) + 1 + len(word) > max_chars:
                pieces.append(cur)
                cur = word
            else:
                cur = f"{cur} {word}" if cur else word
        if cur:
            pieces.append(cur)
    return pieces


def split_text_chunks(text, max_chars=CHUNK_MAX_CHARS):
    """Chia text thành các chunk ≤ max_chars, ngắt ở biên câu (không cắt
    giữa từ, không cắt giữa câu trừ khi câu đơn vượt max_chars)."""
    chunks = []
    cur = ""
    for s in split_into_sentences(text):
        if len(s) > max_chars:
            if cur:
                chunks.append(cur)
                cur = ""
            chunks.extend(_split_long_sentence(s, max_chars))
            continue
        if cur and len(cur) + 1 + len(s) > max_chars:
            chunks.append(cur)
            cur = s
        else:
            cur = f"{cur} {s}" if cur else s
    if cur:
        chunks.append(cur)
    return chunks


def concat_with_crossfade(arrays, sample_rate=SAMPLE_RATE, fade_ms=CHUNK_FADE_MS):
    """Nối các chunk audio bằng crossfade tuyến tính ở mối nối (tránh tiếng
    'tách'). Toàn bộ chunk đều từ cùng 1 lần infer nên cùng sample rate."""
    import numpy as np
    arrays = [np.asarray(a, dtype=np.float32).flatten() for a in arrays if len(a) > 0]
    if not arrays:
        return np.array([], dtype=np.float32)
    if len(arrays) == 1:
        return arrays[0]
    fade = int(sample_rate * fade_ms / 1000)
    out = arrays[0]
    for nxt in arrays[1:]:
        f = min(fade, len(out) // 2, len(nxt) // 2)
        if f > 0:
            ramp_out = np.linspace(1.0, 0.0, f, dtype=np.float32)
            ramp_in = np.linspace(0.0, 1.0, f, dtype=np.float32)
            out = np.concatenate([out[:-f], out[-f:] * ramp_out + nxt[:f] * ramp_in, nxt[f:]])
        else:
            out = np.concatenate([out, nxt])
    return out


def ref_audio_duration_sec(path):
    """Thời lượng file audio (giây) qua ffprobe; None nếu không đo được."""
    import shutil
    import subprocess
    import json
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return None
    try:
        r = subprocess.run(
            [ffprobe, "-v", "quiet", "-print_format", "json",
             "-show_format", path],
            capture_output=True, text=True, timeout=30)
        d = json.loads(r.stdout or "{}")
        return float(d.get("format", {}).get("duration", 0)) or None
    except Exception:
        return None


def load_engine(model_dir):
    try:
        from vieneu import factory
    except ImportError:
        print("[tts] lỗi: chưa cài package 'vieneu'. Chạy:\n"
              "  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt",
              file=sys.stderr)
        return None
    # Tải model về thư mục THẬT (file thật, không symlink) để ONNX Runtime đọc
    # được external data (vieneu_backbone_shared.data). HF hub cache mặc định
    # dùng symlink/blob → ONNX báo "External data path escapes model directory".
    local_repo = os.path.join(model_dir, "VieNeu-TTS-v3-Turbo")
    marker = os.path.join(local_repo, ".vcut-complete")
    if not os.path.exists(marker):
        try:
            from huggingface_hub import snapshot_download
        except ImportError:
            print("[tts] lỗi: thiếu huggingface_hub (đi kèm package vieneu)",
                  file=sys.stderr)
            return None
        log(f"tải model {HF_REPO} về {local_repo} (lần đầu, ~1-2GB) ...")
        snapshot_download(repo_id=HF_REPO, local_dir=local_repo,
                          local_dir_use_symlinks=False)
        with open(marker, "w") as f:
            f.write("ok\n")
        log("tải model xong")
    # onnx_dir trỏ thẳng vào thư mục onnx_update: engine không gọi
    # hf_hub_download với local path (sẽ lỗi HFValidationError), và ONNX đọc
    # được external data vì file nằm thật cùng thư mục.
    onnx_dir = os.path.join(local_repo, "onnx_update")
    # Codec cũng tải về local (tránh lỗi ONNX external data với HF cache symlink)
    from huggingface_hub import snapshot_download
    from pathlib import Path
    codec_dir = os.path.join(model_dir, "MOSS-Audio-Tokenizer-Nano-ONNX")
    codec_marker = os.path.join(codec_dir, ".vcut-complete")
    if not os.path.exists(codec_marker):
        log(f"tải codec {CODEC_REPO} ...")
        snapshot_download(repo_id=CODEC_REPO, local_dir=codec_dir,
                          local_dir_use_symlinks=False)
        with open(codec_marker, "w") as f:
            f.write("ok\n")
    # V3TurboVieNeuTTS KHÔNG forward codec_dir xuống engine, mà engine._fetch
    # gọi hf_hub_download(codec_repo, ...) → rớt vào HF cache symlink → ONNX lỗi
    # "External data path escapes model directory". Patch _fetch để trả về
    # thư mục codec local đã tải (file thật, cùng thư mục với .data).
    from vieneu._v3_turbo_engine import onnx_runtime_lite
    _orig_fetch = onnx_runtime_lite.OnnxV3LiteEngine._fetch

    @staticmethod
    def _fetch_local(repo, files, subfolder):
        if repo == CODEC_REPO:
            return Path(codec_dir)
        return _orig_fetch(repo, files, subfolder)

    onnx_runtime_lite.OnnxV3LiteEngine._fetch = _fetch_local
    try:
        return factory.Vieneu(mode=TTS_MODE, backbone_repo=local_repo,
                              onnx_dir=onnx_dir)
    finally:
        onnx_runtime_lite.OnnxV3LiteEngine._fetch = _orig_fetch


def main(argv=None):
    args = parse_args(argv)

    model_dir = args.model_dir
    if not model_dir:
        here = os.path.dirname(os.path.abspath(__file__))
        model_dir = os.path.join(here, "models")
    os.makedirs(model_dir, exist_ok=True)

    if args.list_voices:
        tts = load_engine(model_dir)
        if tts is None:
            return 3
        voices = []
        presets = getattr(tts, "_preset_voices", {}) or {}
        for name, v in presets.items():
            voices.append({
                "name": name,
                "gender": v.get("gender", ""),
                "desc": v.get("description", ""),
            })
        print(json.dumps({"voices": voices, "mode": TTS_MODE}, ensure_ascii=False))
        return 0

    text = (args.text or "").strip()
    if not text:
        print("[tts] lỗi: text rỗng", file=sys.stderr)
        return 2
    if len(text) > MAX_TEXT_LEN:
        print(f"[tts] lỗi: text quá dài ({len(text)} > {MAX_TEXT_LEN} ký tự)",
              file=sys.stderr)
        return 2

    tts = load_engine(model_dir)
    if tts is None:
        return 3

    log(f"nạp model VieNeu-TTS v3 Turbo ({HF_REPO}) ...")
    t0 = time.time()
    # factory.Vieneu đã nạp model trong __init__; đo thêm 1 lần infer warmup nhỏ
    # không cần — infer thật sẽ đo riêng.
    log(f"model sẵn sàng sau {time.time() - t0:.1f}s")

    voice = (args.voice or "").strip() or None
    # Phase 9 R4: voice cloning — API thật của vieneu 3.8.3 (V3Turbo):
    #   encode_reference(ref_audio) -> (speaker_emb, ref_codes)  [tuple 2 mảng]
    #   infer(text, voice={"speaker_emb": emb, "codes": codes})
    # hoặc infer(text, ref_audio=path) (engine tự enroll mỗi lần gọi).
    # KHÔNG dùng np.asarray() lên tuple (gây lỗi ragged) và KHÔNG truyền
    # embedding trần làm `voice` — engine chỉ hiểu preset name hoặc dict.
    # Enroll 1 lần rồi truyền dict cho mọi chunk (tránh enroll lại mỗi chunk).
    voice_dict = None
    cloned = False
    if args.ref_audio:
        ref_path = args.ref_audio
        if not os.path.isfile(ref_path):
            print(f"[tts] lỗi: không tìm thấy file giọng mẫu: {ref_path}",
                  file=sys.stderr)
            return 2
        dur = ref_audio_duration_sec(ref_path)
        if dur is not None and dur > MAX_REF_AUDIO_SEC:
            print(f"[tts] lỗi: giọng mẫu dài {dur:.0f}s, tối đa "
                  f"{MAX_REF_AUDIO_SEC}s (cắt ngắn file mẫu rồi thử lại).",
                  file=sys.stderr)
            return 2
        if voice:
            log("cảnh báo: có cả --voice và --ref-audio → dùng giọng mẫu clone, bỏ --voice")
        log(f"mã hoá giọng mẫu {ref_path} ...")
        try:
            import numpy as np
            enrolled = tts.encode_reference(ref_path)
        except Exception as e:
            print(f"[tts] lỗi: không mã hoá được giọng mẫu: {e}",
                  file=sys.stderr)
            return 2
        if isinstance(enrolled, (list, tuple)) and len(enrolled) == 2:
            emb, codes = enrolled
            voice_dict = {"speaker_emb": np.asarray(emb, dtype=np.float32),
                          "codes": np.asarray(codes, dtype=np.float32)}
            log(f"giọng mẫu đã mã hoá (emb {voice_dict['speaker_emb'].shape}, "
                f"codes {voice_dict['codes'].shape})")
        else:
            # Engine khác không trả tuple (emb, codes) → fallback về đường
            # chính thức infer(ref_audio=...) cho mỗi chunk (chậm hơn nhưng đúng).
            log("cảnh báo: encode_reference không trả tuple (emb, codes) → "
                "dùng ref_audio trực tiếp cho mỗi chunk")
        cloned = True
    log(f"tổng hợp {len(text)} ký tự, giọng "
        f"{'(clone từ mẫu)' if cloned else (voice or '(mặc định)')} ...")
    t1 = time.time()
    # ⚠️ apply_watermark=False — tắt watermark mặc định của VieNeu-TTS.
    # Text dài được chia theo câu rồi nối bằng crossfade (không cắt giữa từ).
    chunks = split_text_chunks(text)
    log(f"chia thành {len(chunks)} chunk theo câu")
    audios = []
    for i, ch in enumerate(chunks):
        if cloned:
            if voice_dict is not None:
                audios.append(tts.infer(ch, voice=voice_dict, apply_watermark=False))
            else:
                audios.append(tts.infer(ch, ref_audio=ref_path, apply_watermark=False))
        else:
            audios.append(tts.infer(ch, voice=voice, apply_watermark=False))
        log(f"  chunk {i + 1}/{len(chunks)} xong ({len(ch)} ký tự)")
    audio = concat_with_crossfade(audios)
    synth_s = time.time() - t1
    log(f"xong sau {synth_s:.1f}s")

    out_path = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    try:
        import soundfile as sf
        sf.write(out_path, audio, SAMPLE_RATE)
    except ImportError:
        # fallback: wave stdlib (16-bit PCM)
        import wave
        import numpy as np
        a = np.asarray(audio, dtype=np.float32)
        a = np.clip(a, -1.0, 1.0)
        pcm = (a * 32767).astype(np.int16)
        with wave.open(out_path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SAMPLE_RATE)
            w.writeframes(pcm.tobytes())

    duration = 0.0
    try:
        import wave
        with wave.open(out_path, "rb") as w:
            duration = w.getnframes() / float(w.getframerate() or 1)
    except Exception:
        pass

    print(json.dumps({
        "ok": True,
        "out": out_path,
        "voice": voice,
        "chars": len(text),
        "durationSec": round(duration, 2),
        "synthSec": round(synth_s, 1),
        "sampleRate": SAMPLE_RATE,
        "watermark": False,
        "mode": TTS_MODE,
        "chunks": len(chunks),
        "cloned": cloned,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
