# VCut Bridge Server

Local bridge nối web UI (`apps/web`) với render worker (`server/render/src/render.js`).

## Vì sao cần bridge? (R1-040)

Web UI chạy trong browser, không thể spawn FFmpeg trực tiếp. Bridge là một HTTP server
nhỏ chạy trên cùng máy, nhận video-spec JSON + file media từ UI, gọi render worker
bằng `child_process.spawn` (argv cố định, không shell), rồi trả MP4 về cho UI tải xuống.

**Đã chọn Option A (local bridge)** thay vì Option B (script + hướng dẫn thủ công) vì:
- P0-01 yêu cầu "nối UI tới một runtime/backend chính thức để xuất MP4 từ chính project đang mở"
- R1-040 yêu cầu "Choose and document local runtime bridge/backend"
- Trải nghiệm 1-click export là chuẩn tối thiểu của editor (CapCut parity Gate A)

## Chạy

```bash
cd server/bridge
npm install
npm start          # mặc định http://127.0.0.1:8787
# hoặc: npm run dev  (alias của start)
```

Biến môi trường:

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `BRIDGE_PORT` | `8787` | Port lắng nghe |
| `BRIDGE_MAX_JOBS` | `2` | Số job render đồng thời tối đa |
| `BRIDGE_MAX_UPLOAD` | `2147483648` (2GB) | Giới hạn dung lượng upload |
| `BRIDGE_JOB_TTL` | `3600000` (1h) | Job tự dọn sau bao lâu |
| `BRIDGE_WORK_DIR` | `<tmp>/vcut-bridge-jobs` | Thư mục chứa job tạm |
| `FFMPEG` / `FFPROBE` | `ffmpeg` / `ffprobe` | Đường dẫn binary |

Web UI trỏ tới bridge qua `VITE_BRIDGE_URL` (mặc định `http://127.0.0.1:8787`).

## API

### `GET /api/health`
→ `{ ok, version, ffmpeg: boolean, runningJobs: number }`

### `POST /api/render`
Multipart form:
- `spec`: JSON string của video-spec
- `media`: một hoặc nhiều file (field name `media`, filename phải khớp `clip.src`)

→ `201 { jobId }` | `400` (spec/file không hợp lệ) | `429` (đủ job đồng thời)

### `GET /api/render/:id`
→ `{ id, status, progress, error, outputName, outputSize }`

`status`: `queued` | `running` | `done` | `error` | `cancelled`
`progress`: 0..1 (parse từ stderr của ffmpeg)

### `GET /api/render/:id/download`
Tải file MP4 (chỉ khi `status=done`). → `409` nếu chưa xong.

### `DELETE /api/render/:id`
Hủy job (SIGTERM process) + xóa thư mục tạm sau 2s. → `{ ok: true }`

## Bảo mật

1. **Không shell tùy ý:** chỉ `spawn(process.execPath, [render.js, ...argv])` với
   `shell: false`. Không có đường nào để client chèn lệnh shell.
2. **Chống path traversal:** tên file upload qua `sanitizeFilename()` —
   chỉ `basename`, whitelist `[\w\-. ]`, từ chối `.`/`..`/file ẩn.
   Double-check `dest.startsWith(mediaDir + sep)` trước khi ghi.
3. **Không nhận đường dẫn từ client:** mọi file media đều do client upload;
   bridge không đọc file theo path client gửi.
4. **Giới hạn tài nguyên:** max concurrent jobs, max upload size, job TTL tự dọn.
5. **Spec được validate** bởi chính render worker (validate.js) trước khi render.

## Giới hạn (trung thực)

- Bridge chỉ chạy local (`127.0.0.1`); chưa có auth — không expose ra mạng công cộng.
- Progress là ước lượng từ `time=` của ffmpeg, không chính xác 100%.
- Job lưu trong RAM — restart bridge mất danh sách job (file tạm còn trên đĩa đến TTL).
- Chưa có retry tự động; client (UI) tự bấm "Xuất MP4" lại khi lỗi.
- Media phải upload lại mỗi lần export (chưa có cache theo hash) — xem R1-032/R1-035.
