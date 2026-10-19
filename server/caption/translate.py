#!/usr/bin/env python3
"""
Dịch phụ đề LOCAL bằng faster-whisper translate task (R1-080).

    python translate.py --input video.mp4 --lang vi --out translated.json

- 100% local: dùng model faster-whisper ĐÃ CÓ (không tải thêm gì, không cloud).
- faster-whisper "translate" task: mọi ngôn ngữ -> TIẾNG ANH (giới hạn của model,
  không phải lựa chọn thiết kế — xem TRANSLATE_LIMITS.md).
- Pipeline giống caption.py: trích audio -> translate -> gộp câu -> JSON.
- Tái sử dụng code caption.py (extract_audio, load_model, group_words...) qua
  import — không copy-paste logic.

Heuristic gộp câu: giống hệt caption.py (MAX_CHARS=42, MAX_DUR=5.0, ...).
"""

import argparse
import json
import os
import sys
import tempfile

# Tái sử dụng pipeline caption.py — script cùng thư mục nên import trực tiếp.
import caption as cap

TARGET_LANG = "en"
TRANSLATE_TRACK_LABEL = "Phụ đề (EN)"


def parse_args(argv=None):
    ap = argparse.ArgumentParser(
        description="Dịch phụ đề local sang tiếng Anh (faster-whisper translate, không cloud).")
    ap.add_argument("--input", required=True, help="file video/audio đầu vào")
    ap.add_argument("--lang", default="vi",
                    help="mã ngôn ngữ NGUỒN (vi, en, ... hoặc 'auto' để tự phát hiện)")
    ap.add_argument("--out", required=True, help="file JSON output")
    ap.add_argument("--model", default=cap.DEFAULT_MODEL, help="model faster-whisper")
    ap.add_argument("--model-dir", default=os.path.join(os.path.dirname(
        os.path.abspath(__file__)), "models"), help="thư mục chứa model")
    ap.add_argument("--track-out", default=None,
                    help="file JSON chỉ chứa video-spec track (tuỳ chọn)")
    ap.add_argument("--max-chars", type=int, default=cap.MAX_CHARS)
    ap.add_argument("--max-dur", type=float, default=cap.MAX_DUR)
    return ap.parse_args(argv)


def translate_transcribe(wav_path, src_lang, model_name, model_dir):
    """Chạy faster-whisper với task='translate' (nguồn -> tiếng Anh).

    Trả về (words, detected_src_lang, audio_duration_sec). Cấu trúc words
    giống caption.transcribe để tái dùng group_words.
    """
    model = cap.load_model(model_name, model_dir)
    audio = cap.load_wav_mono16k(wav_path)
    language = None if src_lang == "auto" else src_lang
    print(f"[translate] đang dịch (nguồn={src_lang} -> en)...", flush=True)
    segments, info = model.transcribe(audio, task="translate",
                                      language=language,
                                      word_timestamps=True, vad_filter=True)
    words = []
    for seg in segments:
        if not seg.words:
            continue
        for w in seg.words:
            text = w.word.strip()
            if text:
                words.append({"start": round(w.start, 2),
                              "end": round(w.end, 2),
                              "word": text})
    detected = getattr(info, "language", src_lang)
    duration = getattr(info, "duration", 0.0) or (len(audio) / 16000.0)
    print(f"[translate] phát hiện ngôn ngữ nguồn: {detected}, "
          f"thời lượng audio: {duration:.1f}s, số từ (en): {len(words)}",
          flush=True)
    return words, detected, duration


def build_result(args, words, detected_lang, audio_dur, elapsed):
    """Dựng dict output JSON (thuần — test được không cần model)."""
    segments = cap.group_words(words, args.max_chars, args.max_dur)
    track = cap.to_video_spec_track(segments)
    track["label"] = TRANSLATE_TRACK_LABEL
    return {
        "source": os.path.basename(args.input),
        "source_language": detected_lang,
        "target_language": TARGET_LANG,
        "engine": "faster-whisper-translate",
        "model": args.model,
        "audio_duration_sec": round(audio_dur, 2),
        "translate_time_sec": round(elapsed, 1),
        "realtime_factor": round(elapsed / max(audio_dur, 0.01), 2),
        "segments": segments,
        "words": words,
        "video_spec_track": track,
        "spec_version": "0.2.0",
    }


def main(argv=None):
    args = parse_args(argv)

    if not os.path.isfile(args.input):
        sys.exit(f"LỖI: không tìm thấy file đầu vào: {args.input}")

    import time
    t0 = time.time()
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "audio.wav")
        print(f"[translate] trích audio từ {args.input}...", flush=True)
        cap.extract_audio(args.input, wav)
        words, detected_lang, audio_dur = translate_transcribe(
            wav, args.lang, args.model, args.model_dir)
    elapsed = time.time() - t0

    if not words:
        sys.exit("LỖI: không dịch được từ nào (audio câm hoặc quá nhiễu?)")

    result = build_result(args, words, detected_lang, audio_dur, elapsed)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    if args.track_out:
        with open(args.track_out, "w", encoding="utf-8") as f:
            json.dump(result["video_spec_track"], f, ensure_ascii=False, indent=2)

    print(f"[translate] xong: {len(result['segments'])} captions tiếng Anh, "
          f"{len(words)} từ, dịch {elapsed:.1f}s cho {audio_dur:.1f}s audio "
          f"(x{elapsed / max(audio_dur, 0.01):.1f} realtime) -> {args.out}",
          flush=True)


if __name__ == "__main__":
    main()
