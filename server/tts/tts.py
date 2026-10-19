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
# Giới hạn độ dài text 1 lần gọi (bảo vệ server khỏi request khổng lồ)
MAX_TEXT_LEN = 2000
SAMPLE_RATE = 48000


def log(msg):
    print(f"[tts] {msg}", flush=True)


def parse_args(argv=None):
    p = argparse.ArgumentParser(description="TTS local tiếng Việt (VieNeu-TTS 0.5B)")
    p.add_argument("--text", required=True, help="Văn bản cần đọc")
    p.add_argument("--voice", default=None, help="Tên giọng (mặc định của model)")
    p.add_argument("--out", required=True, help="Đường dẫn file WAV đầu ra")
    p.add_argument("--model-dir", default=None,
                   help="Thư mục cache model (mặc định server/tts/models)")
    p.add_argument("--list-voices", action="store_true",
                   help="Liệt kê giọng có sẵn rồi thoát")
    return p.parse_args(argv)


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
    log(f"tổng hợp {len(text)} ký tự, giọng {voice or '(mặc định)'} ...")
    t1 = time.time()
    # ⚠️ apply_watermark=False — tắt watermark mặc định của VieNeu-TTS.
    audio = tts.infer(text, voice=voice, apply_watermark=False)
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
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
