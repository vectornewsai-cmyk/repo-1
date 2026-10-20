# Benchmarks — VCut Studio

Bộ benchmark đo hiệu năng các pipeline chính của VCut Studio trên máy thật.
Mọi số liệu trong `RESULTS.md` đều là số đo thật, không ước lượng.

## Cấu trúc

```
benchmarks/
├── README.md            # file này
├── RESULTS.md           # kết quả đo (điền sau khi chạy)
├── BENCH_LIMITS.md      # giới hạn & lưu ý trung thực của bộ benchmark
├── run_all.sh           # chạy toàn bộ (TTS trước để tạo audio cho caption)
├── render/bench_render.sh
├── caption/bench_caption.py
├── tts/bench_tts.py
├── bgremove/bench_bgremove.py
├── preview/bench_preview.js   # chạy THỦ CÔNG trong browser (subagent không có browser)
└── results/             # JSON thô từng lần chạy (gitignore)
```

## Chạy

```bash
# Toàn bộ (có thể mất 30-60 phút tùy máy):
bash benchmarks/run_all.sh

# Từng phần:
bash benchmarks/render/bench_render.sh
~/workspace/repo-1/server/tts/.venv2/bin/python benchmarks/tts/bench_tts.py
~/workspace/repo-1/server/caption/.venv/bin/python benchmarks/caption/bench_caption.py
~/workspace/scratch-bgremove/venv/bin/python benchmarks/bgremove/bench_bgremove.py
```

Yêu cầu môi trường:
- `ffmpeg`/`ffprobe` 8.x trên PATH, `bc`, `node`
- venv caption: `server/caption/.venv` (faster-whisper)
- venv tts: `server/tts/.venv2` (vieneu)
- venv bgremove: `~/workspace/scratch-bgremove/venv` (rembg) — chỉ dùng cho benchmark,
  không phải venv chính thức của dự án
- Model: `server/caption/models/fw-small`, `server/tts/models` (tải 1 lần)

## Metric chuẩn

| Pipeline | Metric chính | Ý nghĩa |
|---|---|---|
| Render | fps = frame / giây wall | Tốc độ encode; so với 30fps realtime |
| Render | RT factor = độ_dài_video / thời_gian | >1 = nhanh hơn realtime |
| Caption | RT factor | faster-whisper small trên CPU |
| TTS | RT factor + ký tự/giây | VieNeu-TTS 0.5B trên CPU |
| BgRemoval | fps | rembg u2net, video 720p |
| Preview | FPS (browser) | đo thủ công, xem `preview/bench_preview.js` |

## So sánh với CapCut

Xem mục "So sánh" trong `RESULTS.md`. Mọi con số CapCut đều là **ước tính từ tài liệu
công khai** và được ghi rõ — không có số đo trực tiếp CapCut trên cùng máy.
