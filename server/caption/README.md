# Auto-caption LOCAL (Phase 2)

Tạo phụ đề tự động từ video/audio — **chạy 100% local, không gọi API cloud nào**
(OpenAI, Google...). Đây là bản local của tính năng "Auto captions" của CapCut.

## Cài đặt

```bash
cd server/caption
python3 -m venv .venv
.venv/bin/pip install faster-whisper
# Model (tải 1 lần, ~460MB cho "small"):
# Cách 1 (khuyên dùng): tải trực tiếp vào models/fw-small/
mkdir -p models/fw-small && cd models/fw-small
for f in model.bin config.json tokenizer.json vocabulary.txt; do
  curl -L -o "$f" "https://huggingface.co/Systran/faster-whisper-small/resolve/main/$f"
done
```

Model mặc định: **faster-whisper `small`** (244M params, ~460MB, int8).
`caption.py` tự tìm `models/fw-small/` trước — không có mới tải từ HuggingFace.

## Cách chạy

```bash
.venv/bin/python caption.py --input video.mp4 --lang vi --out captions.json
.venv/bin/python caption.py --input audio.mp3 --lang auto --out captions.json --track-out track.json
```

| Tham số | Mặc định | Ý nghĩa |
|---|---|---|
| `--input` | (bắt buộc) | file video/audio bất kỳ ffmpeg đọc được |
| `--lang` | `vi` | mã ngôn ngữ (`vi`, `en`, … hoặc `auto` để tự phát hiện) |
| `--out` | (bắt buộc) | JSON output: segments + words + video-spec track |
| `--track-out` | — | ghi riêng track text (nối thẳng vào spec) |
| `--model` | `small` | tên model hoặc **đường dẫn thư mục model local** |
| `--model-dir` | `server/caption/models` | nơi tìm/tải model |
| `--max-chars` | `42` | số ký tự tối đa mỗi caption |
| `--max-dur` | `5.0` | số giây tối đa mỗi caption |

## Output

`captions.json` gồm:
- `segments`: `[{start, end, text}]` — caption đã gộp để hiển thị
- `words`: `[{start, end, word}]` — word-level timestamps (làm karaoke/highlight sau này)
- `video_spec_track`: track `kind: "text"` **đúng schema video-spec v0.1.0** —
  nối thẳng vào `spec.tracks` của editor hoặc render worker mà không cần sửa gì.
  Đã kiểm chứng: render track này qua `server/render` ra MP4 có chữ thật.

## Heuristic gộp từ thành caption (lý do chọn)

Mục tiêu: giống cách CapCut hiển thị — mỗi caption 1–2 dòng, đủ dài để đọc,
đủ ngắn để không che hình.

1. **Tối đa 42 ký tự / 5 giây mỗi caption** — vừa 2 dòng trên video dọc 9:16 ở cỡ chữ 56.
2. **Ưu tiên ngắt ở dấu câu** (`. ! ? … : ;`) hoặc **khoảng lặng ≥ 0.7s** — tự nhiên như ngắt câu nói.
3. **Không ngắt khi caption < 8 ký tự** trừ khi khoảng lặng ≥ 1.5s — tránh mảnh vụn 1-2 từ.
4. **Lượt gộp lần 2**: caption < 1.0s mà kề caption sau (< 0.5s) thì gộp — tránh chữ nhấp nháy.
5. Word timestamps từ faster-whisper (`word_timestamps=True` + `vad_filter=True`).

## Kết quả đo thực tế (trung thực)

Môi trường: CPU 2 cores, RAM 7GB, model `small` int8, **không GPU**.

| Test | Kết quả |
|---|---|
| Audio test | 10.4s giọng Việt tổng hợp (Piper `vi_VN-vais1000-medium`) — 49 từ |
| Thời gian transcribe | **8.8–10.7s cho 10.4s audio ≈ 0.8–1.0x realtime** (CPU!) |
| Độ chính xác tiếng Việt | ~47/49 từ đúng trên giọng tổng hợp sạch. Lỗi ghi nhận: "Cảm ơn"→"Tảm ơn", "thật đẹp"→"thật là". **Chưa đo WER chính thức** trên giọng người thật/nhiễu — con số trên chỉ mang tính tham khảo. |
| Đầu vào video | trích audio bằng ffmpeg rồi transcribe — đã test MP4 10.4s, OK |
| Nối vào render | track caption render thẳng qua `server/render` ra MP4 1280x720, chữ hiện đúng thời gian (đã xem frame bằng mắt) |

## Giới hạn (trung thực — đọc trước khi kỳ vọng)

1. **Chưa đo trên giọng người thật ngoài đời** (ồn, nhiều người nói, nhạc nền) — độ chính xác sẽ thấp hơn con số trên. Đây là việc cần làm khi có dữ liệu test thật.
2. **Tốc độ CPU**: ~1x realtime với model `small`. Audio 10 phút ≈ 10 phút chờ. Có GPU (CUDA) nhanh hơn 5–10x. Model `tiny`/`base` nhanh hơn nhưng sai nhiều hơn; `medium`/`large` chính xác hơn nhưng chậm và nặng (1.5–3GB).
3. **Dấu câu**: whisper đôi khi thiếu/dư dấu — câu ngắn 2-3 từ ("chúng tôi.") có thể hơi cụt, chấp nhận được.
4. **Chữ dài tràn mép**: caption ~42 ký tự ở cỡ 56 có thể chạm mép video 1280px — editor nên tự giảm cỡ chữ hoặc ngắt dòng khi hiển thị.
5. **Ngôn ngữ**: `--lang vi` bắt buộc đúng ngôn ngữ; để `auto` nếu không chắc (chậm hơn một chút).
6. **Không diarization** (phân biệt người nói) — tính năng nâng cao, chưa làm.
