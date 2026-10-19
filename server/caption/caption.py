#!/usr/bin/env python3
"""
Auto-caption LOCAL cho dự án trình dựng video (Phase 2).

    python caption.py --input video.mp4 --lang vi --out captions.json

- 100% local: faster-whisper (CTranslate2), KHÔNG gọi API cloud nào.
- Đầu vào: file video hoặc audio bất kỳ mà ffmpeg đọc được.
- Đầu ra JSON gồm:
    * "segments": [{start, end, text}] — phụ đề đã gộp theo câu hiển thị
    * "words": [{start, end, word}] — word-level timestamps (để làm karaoke/highlight sau này)
    * "video_spec_track": track text đúng schema @repo-1/video-spec v0.1.0,
      nối thẳng vào editor (apps/web) hoặc render worker (server/render).

Heuristic gộp từ thành caption (xem README để biết lý do chọn):
  - Tối đa MAX_CHARS ký tự / caption (mặc định 42 ~ 2 dòng trên màn hình dọc)
  - Tối đa MAX_DUR giây / caption (mặc định 5.0)
  - Ưu tiên ngắt ở dấu câu kết thúc (. ! ? … : ;) hoặc khoảng lặng > 0.7s
  - Không để caption 1 từ trơ trọi (gộp tiếp trừ khi khoảng lặng > 1.5s)
  - Caption quá ngắn (< 1.0s) được gộp với caption sau nếu kề nhau (< 0.5s)
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile

DEFAULT_MODEL = "small"
DEFAULT_LANG = "vi"
MAX_CHARS = 42
MAX_DUR = 5.0
MIN_DUR = 1.0
GAP_BREAK = 0.7      # khoảng lặng >= ngần này giây -> ngắt caption
GAP_FORCE = 1.5      # khoảng lặng lớn -> ngắt luôn kể cả caption đang ngắn
MERGE_GAP = 0.5      # 2 caption kề nhau hơn ngần này -> gộp nếu caption đầu quá ngắn
SENTENCE_END = set(".!?…:;—-")

# Style chữ mặc định cho caption — khớp schema TextStyle, render-safe
# (animation "none" để mọi render worker đều vẽ được; muốn đẹp hơn đổi ở editor)
CAPTION_STYLE = {
    "fontFamily": "Inter",
    "fontSize": 56,
    "color": "#ffffff",
    "backgroundColor": "#000000",
    "bold": True,
    "italic": False,
    "x": 0.5,
    "y": 0.85,
    "animation": "none",
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Lệnh thất bại: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r


def extract_audio(src_path, tmp_wav):
    """Trích audio về wav 16kHz mono (định dạng whisper ưa nhất)."""
    run([
        "ffmpeg", "-y", "-v", "error",
        "-i", src_path,
        "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
        tmp_wav,
    ])
    if os.path.getsize(tmp_wav) == 0:
        raise RuntimeError(f"Không trích được audio từ {src_path} (file không có track audio?)")
    return tmp_wav


def load_model(model_arg, model_dir):
    """Nạp model: ưu tiên thư mục local (offline 100%), fallback mới tải về."""
    from faster_whisper import WhisperModel

    candidates = []
    if os.path.isdir(model_arg):
        candidates.append(model_arg)
    # Quy ước của dự án: models/fw-<tên> (vd: models/fw-small)
    candidates.append(os.path.join(model_dir, f"fw-{model_arg}"))
    for path in candidates:
        if os.path.isdir(path) and os.path.isfile(os.path.join(path, "model.bin")):
            print(f"[caption] dùng model local: {path}", flush=True)
            return WhisperModel(path, device="cpu", compute_type="int8")
    print(f"[caption] tải model '{model_arg}' từ HuggingFace...", flush=True)
    return WhisperModel(model_arg, device="cpu", compute_type="int8",
                        download_root=model_dir)


def load_wav_mono16k(wav_path):
    """Đọc wav PCM 16-bit mono 16kHz thành numpy float32 (tránh phụ thuộc PyAV)."""
    import wave
    import numpy as np

    with wave.open(wav_path, "rb") as w:
        assert w.getnchannels() == 1 and w.getsampwidth() == 2 \
            and w.getframerate() == 16000, "wav phải là mono 16-bit 16kHz"
        raw = w.readframes(w.getnframes())
    return (np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0)


def transcribe(wav_path, lang, model_name, model_dir):
    model = load_model(model_name, model_dir)
    audio = load_wav_mono16k(wav_path)   # mảng numpy -> không qua PyAV
    language = None if lang == "auto" else lang
    print(f"[caption] đang transcribe (lang={lang or 'auto'})...", flush=True)
    segments, info = model.transcribe(audio, language=language,
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
    detected = getattr(info, "language", lang)
    duration = getattr(info, "duration", 0.0) or (len(audio) / 16000.0)
    print(f"[caption] phát hiện ngôn ngữ: {detected}, "
          f"thời lượng audio: {duration:.1f}s, số từ: {len(words)}", flush=True)
    return words, detected, duration


def group_words(words, max_chars=MAX_CHARS, max_dur=MAX_DUR):
    """Gộp list từ (có timestamp) thành các caption hiển thị được."""
    captions = []
    cur = []          # list word dict đang gom
    cur_chars = 0

    def flush():
        nonlocal cur, cur_chars
        if not cur:
            return
        text = " ".join(w["word"] for w in cur)
        captions.append({
            "start": cur[0]["start"],
            "end": cur[-1]["end"],
            "text": text,
        })
        cur, cur_chars = [], 0

    for i, w in enumerate(words):
        cur.append(w)
        cur_chars += len(w["word"]) + 1
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["start"] - w["end"]) if nxt else 999.0
        dur = w["end"] - cur[0]["start"]
        ends_sentence = w["word"][-1] in SENTENCE_END if w["word"] else False

        too_long = cur_chars >= max_chars or dur >= max_dur
        natural_break = ends_sentence or gap >= GAP_BREAK
        force_break = gap >= GAP_FORCE

        # Ngắt khi: quá dài, hoặc ngắt tự nhiên mà caption đã đủ dài,
        # hoặc khoảng lặng lớn (kể cả caption ngắn)
        if too_long or (natural_break and cur_chars >= 8) or force_break:
            flush()

    flush()

    # Lượt 2: gộp caption quá ngắn (< MIN_DUR) với caption sau nếu kề nhau
    merged = []
    i = 0
    while i < len(captions):
        c = captions[i]
        dur = c["end"] - c["start"]
        if (dur < MIN_DUR and i + 1 < len(captions)
                and captions[i + 1]["start"] - c["end"] <= MERGE_GAP
                and len(c["text"]) + len(captions[i + 1]["text"]) + 1 <= max_chars):
            nxt = captions[i + 1]
            merged.append({"start": c["start"], "end": nxt["end"],
                           "text": c["text"] + " " + nxt["text"]})
            i += 2
        else:
            merged.append(c)
            i += 1
    return merged


def to_video_spec_track(segments, track_id="cap1"):
    """Đổi segments thành track text đúng schema video-spec v0.1.0."""
    clips = []
    for n, s in enumerate(segments, 1):
        clips.append({
            "kind": "text",
            "id": f"cap{n}",
            "text": s["text"],
            "start": s["start"],
            "duration": round(s["end"] - s["start"], 2),
            "style": dict(CAPTION_STYLE),
        })
    return {
        "id": track_id,
        "kind": "text",
        "label": "Auto-caption",
        "clips": clips,
    }


def main():
    ap = argparse.ArgumentParser(description="Auto-caption local (faster-whisper, không cloud).")
    ap.add_argument("--input", required=True, help="file video/audio đầu vào")
    ap.add_argument("--lang", default=DEFAULT_LANG,
                    help="mã ngôn ngữ (vi, en, ... hoặc 'auto' để tự phát hiện)")
    ap.add_argument("--out", required=True, help="file JSON output")
    ap.add_argument("--model", default=DEFAULT_MODEL, help="model faster-whisper")
    ap.add_argument("--model-dir", default=os.path.join(os.path.dirname(
        os.path.abspath(__file__)), "models"), help="thư mục chứa model")
    ap.add_argument("--track-out", default=None,
                    help="file JSON chỉ chứa video-spec track (tuỳ chọn)")
    ap.add_argument("--max-chars", type=int, default=MAX_CHARS)
    ap.add_argument("--max-dur", type=float, default=MAX_DUR)
    args = ap.parse_args()

    if not os.path.isfile(args.input):
        sys.exit(f"LỖI: không tìm thấy file đầu vào: {args.input}")

    import time
    t0 = time.time()
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "audio.wav")
        print(f"[caption] trích audio từ {args.input}...", flush=True)
        extract_audio(args.input, wav)
        words, detected_lang, audio_dur = transcribe(wav, args.lang,
                                                    args.model, args.model_dir)
    t_transcribe = time.time() - t0

    if not words:
        sys.exit("LỖI: không nhận diện được từ nào (audio câm hoặc quá nhiễu?)")

    segments = group_words(words, args.max_chars, args.max_dur)
    track = to_video_spec_track(segments)

    result = {
        "source": os.path.basename(args.input),
        "language": detected_lang,
        "model": args.model,
        "audio_duration_sec": round(audio_dur, 2),
        "transcribe_time_sec": round(t_transcribe, 1),
        "realtime_factor": round(t_transcribe / max(audio_dur, 0.01), 2),
        "segments": segments,
        "words": words,
        "video_spec_track": track,
        "spec_version": "0.1.0",
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    if args.track_out:
        with open(args.track_out, "w", encoding="utf-8") as f:
            json.dump(track, f, ensure_ascii=False, indent=2)

    print(f"[caption] xong: {len(segments)} captions, {len(words)} từ, "
          f"transcribe {t_transcribe:.1f}s cho {audio_dur:.1f}s audio "
          f"(x{t_transcribe / max(audio_dur, 0.01):.1f} realtime) -> {args.out}",
          flush=True)


if __name__ == "__main__":
    main()
