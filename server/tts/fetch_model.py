#!/usr/bin/env python3
"""
Tải trước model VieNeu-TTS v3 Turbo (0.5B, Apache-2.0) vào server/tts/models/.

    python fetch_model.py [--model-dir DIR]

Không bắt buộc — lần chạy đầu của tts.py cũng tự tải. Script này chỉ để
chuẩn bị trước (ví dụ khi đóng gói installer).

⚠️ Chỉ tải bản v3turbo (0.5B, Apache-2.0). KHÔNG tải bản 0.3B (CC BY-NC).
"""

import argparse
import os
import sys


def main():
    p = argparse.ArgumentParser(description="Tải trước model VieNeu-TTS v3 Turbo")
    p.add_argument("--model-dir", default=None)
    args = p.parse_args()

    model_dir = args.model_dir
    if not model_dir:
        here = os.path.dirname(os.path.abspath(__file__))
        model_dir = os.path.join(here, "models")
    os.makedirs(model_dir, exist_ok=True)
    os.environ.setdefault("HF_HUB_CACHE", model_dir)
    os.environ.setdefault("HF_HOME", model_dir)

    try:
        from vieneu import factory
    except ImportError:
        print("chưa cài 'vieneu': pip install -r requirements.txt", file=sys.stderr)
        return 1

    print(f"[fetch] tải pnnbao-ump/VieNeu-TTS-v3-Turbo vào {model_dir} ...")
    from huggingface_hub import snapshot_download
    local_repo = os.path.join(model_dir, "VieNeu-TTS-v3-Turbo")
    # local_dir_use_symlinks=False: file thật (không symlink) để ONNX Runtime
    # đọc được external data (tránh lỗi "External data path escapes model directory")
    snapshot_download(repo_id="pnnbao-ump/VieNeu-TTS-v3-Turbo",
                      local_dir=local_repo, local_dir_use_symlinks=False)
    with open(os.path.join(local_repo, ".vcut-complete"), "w") as f:
        f.write("ok\n")
    print("[fetch] tải codec OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX ...")
    codec_dir = os.path.join(model_dir, "MOSS-Audio-Tokenizer-Nano-ONNX")
    snapshot_download(repo_id="OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX",
                      local_dir=codec_dir, local_dir_use_symlinks=False)
    with open(os.path.join(codec_dir, ".vcut-complete"), "w") as f:
        f.write("ok\n")
    print("[fetch] xong.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
