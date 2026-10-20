# VCut Studio — Bridge Server API

REST API cho bridge server (R1-092). Bridge chạy local, mặc định tại
`http://127.0.0.1:8787` (đổi qua env `BRIDGE_PORT`).

OpenAPI 3.0 spec đầy đủ: [`openapi.yaml`](./openapi.yaml) — hoặc lấy trực tiếp
từ server đang chạy tại `GET /api/openapi.json` (mở bằng Swagger UI / Redoc).

```bash
# Xem spec
curl http://127.0.0.1:8787/api/openapi.json | python3 -m json.tool | head -40
```

## Quy ước chung

- Base URL: `http://127.0.0.1:8787`
- Mọi lỗi trả JSON `{"error": "<thông điệp tiếng Việt>"}` — không bao giờ trả HTML.
- Rate limit: 120 req/phút/IP cho API chung; 20 req/phút/IP cho các tác vụ nặng
  (render, caption, reframe, bgremove, scene, translate).
- File upload: tên file được sanitize + kiểm tra magic bytes; không nhận đường
  dẫn tuyệt đối từ client.

## Health & spec

```bash
# Kiểm tra server
curl http://127.0.0.1:8787/api/health
# → {"ok":true,"version":"0.1.0","ffmpeg":true,"runningJobs":0,"queuedJobs":0,
#    "caption":true,"translate":true,"reframe":true,"silence":true,
#    "scene":true,"bgremove":true, ...}
```

## Render (video-spec → MP4)

```bash
# 1. Tạo job render (spec JSON + file media, filename phải trùng clip.src)
curl -X POST http://127.0.0.1:8787/api/render \
  -F 'spec={"meta":{"name":"demo","width":1280,"height":720,"fps":30},"tracks":[...]}' \
  -F "media=@video.mp4" \
  -F "media=@nhac.mp3"
# → 201 {"jobId":"a1b2c3d4e5f6","status":"queued","queuePosition":0}

# 2. Theo dõi tiến độ (poll mỗi 1s như ExportPanel)
curl http://127.0.0.1:8787/api/render/a1b2c3d4e5f6
# → {"id":"...","status":"running","progress":0.42,"etaSeconds":18.5,
#    "queuePosition":0,"attempts":1,"qaReport":null,...}

# 3. Tải MP4 khi done
curl -OJ http://127.0.0.1:8787/api/render/a1b2c3d4e5f6/download

# Liệt kê job (mới nhất trước)
curl "http://127.0.0.1:8787/api/render?limit=10"

# Hủy job đang chạy/chờ
curl -X DELETE http://127.0.0.1:8787/api/render/a1b2c3d4e5f6
# → {"ok":true,"id":"...","status":"cancelled"}

# Chạy lại job bị lỗi
curl -X POST http://127.0.0.1:8787/api/render/a1b2c3d4e5f6/retry
# → {"jobId":"...","status":"queued","queuePosition":0}
```

`status` nhận một trong: `queued | running | done | error | cancelled`.
Job `done` đi kèm `qaReport` (kết quả kiểm tra codec/duration/resolution —
R1-043); QA fail → job `error`, file lỗi không được phục vụ.

## Caption — phụ đề tự động

Stream NDJSON: mỗi dòng là 1 JSON object `{"type":"phase"|"done"|"error",...}`.

```bash
# Transcribe tiếng Việt (mặc định lang=vi)
curl -X POST http://127.0.0.1:8787/api/caption \
  -F "media=@video.mp4" \
  -F "lang=vi" --no-buffer
# {"type":"phase","phase":"upload","message":"Đã nhận file, chuẩn bị…"}
# {"type":"phase","phase":"transcribe","message":"Đang nhận diện giọng nói…"}
# {"type":"done","language":"vi","audioDurationSec":12.5,
#  "transcribeTimeSec":4.2,"count":3,
#  "segments":[{"start":0.0,"end":2.4,"text":"Xin chào các bạn"}, ...]}

# Đọc NDJSON bằng python
curl -s -X POST http://127.0.0.1:8787/api/caption \
  -F "media=@video.mp4" | python3 -c "
import json,sys
for line in sys.stdin:
    ev = json.loads(line)
    if ev['type'] == 'done':
        for s in ev['segments']: print(f\"[{s['start']:.1f}-{s['end']:.1f}] {s['text']}\")
    elif ev['type'] == 'error':
        print('LỖI:', ev['error']); sys.exit(1)
"
```

## Caption translate — dịch sang tiếng Anh

```bash
curl -X POST http://127.0.0.1:8787/api/caption/translate \
  -F "media=@video.mp4" -F "lang=vi" -F "target=en" --no-buffer
# {"type":"done","sourceLanguage":"vi","targetLanguage":"en",...,
#  "segments":[{"start":0.0,"end":2.4,"text":"Hello everyone"}, ...]}
```

Hiện chỉ hỗ trợ `target=en` (giới hạn của faster-whisper translate task).

## TTS — đọc thành tiếng

```bash
# Danh sách 25 giọng
curl http://127.0.0.1:8787/api/tts/voices
# → {"voices":[{"name":"Hải Đăng","gender":"nam","desc":"..."}, ...],
#     "default":"Hải Đăng"}

# Tổng hợp giọng đọc → file WAV
curl -X POST http://127.0.0.1:8787/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Xin chào Việt Nam","voice":"Hải Đăng"}' \
  -o noi.wav -D -
# Header trả về: X-TTS-Voice (URL-encoded), X-TTS-Duration, X-TTS-Chars
```

Giới hạn: text ≤ 2000 ký tự; model ~2.3GB tải lần đầu qua
`server/tts/fetch_model.py`; watermark đã tắt.

## AI local khác

```bash
# Xóa nền video → file MOV có kênh alpha (<tên>_no_bg.mov)
curl -X POST http://127.0.0.1:8787/api/bgremove \
  -F "media=@nguoi.mp4" -F "session=birefnet-general" \
  -o nguoi_no_bg.mov
# session mặc định: birefnet-general (MIT). bria-rmbg / rmbg-2.0 BỊ CẤM (non-commercial).

# Auto-reframe 16:9 → 9:16 (theo dõi chủ thể)
curl -X POST http://127.0.0.1:8787/api/reframe \
  -F "media=@ngang.mp4" -F "aspect=9:16" -o doc_9x16.mp4
# aspect: 9:16 | 1:1 | 4:5 (mặc định 9:16)

# Phát hiện khoảng lặng → JSON {silences, keep}
curl -X POST http://127.0.0.1:8787/api/silence \
  -F "media=@podcast.mp3" -F "noiseDb=-35" -F "minDur=0.5"
# → {"audioDurationSec":10.0,"count":2,
#    "silences":[{"start":2.0,"end":4.0,"duration":2.0}, ...],
#    "keep":[{"start":0.0,"end":2.0}, ...]}

# Tách cảnh → stream NDJSON
curl -X POST http://127.0.0.1:8787/api/scene \
  -F "media=@video.mp4" -F "threshold=0.4" --no-buffer
# {"type":"done","cuts":[2.0,4.0],"duration":6.0,"threshold":0.4,"count":2}
# threshold 0.05..0.95 (mặc định 0.4); thêm start/end (giây) để giới hạn vùng quét.
```

## Mã lỗi

| Mã  | Ý nghĩa |
|-----|---------|
| 400 | Tham số sai (thiếu file, sai định dạng, ngưỡng ngoài khoảng, session bị cấm…) |
| 404 | Không tìm thấy (job id sai, API không tồn tại) |
| 409 | Xung đột trạng thái (tải file khi job chưa xong, hủy job đã kết thúc) |
| 413 | Spec render > 10MB |
| 429 | Hàng đợi render đầy / vượt rate limit |
| 500 | Lỗi máy chủ (chi tiết trong log server, không leak ra client) |
| 503 | Tác vụ AI chưa sẵn sàng (thiếu python/venv/model) |
| 507 | Ổ đĩa sắp đầy (< 256MB trống) |

## Dùng với Swagger UI (thử API trên trình duyệt)

```bash
# Cách nhanh nhất: mở https://editor.swagger.io, chọn File → Import URL,
# dán http://127.0.0.1:8787/api/openapi.json
# (CORS đã bật trên bridge nên Swagger editor đọc được trực tiếp.)
```

## Ghi chú cho agent (MCP/CLI)

- Mọi endpoint đều chạy local, không cần API key.
- Render là bất đồng bộ (job queue); các endpoint AI khác là đồng bộ
  (chờ đến khi xong, timeout 10–30 phút tùy tác vụ).
- `GET /api/health` cho biết từng module AI có sẵn không
  (`caption/translate/reframe/silence/scene/bgremove: true/false`) — kiểm tra
  trước khi gọi để báo lỗi thân thiện.
