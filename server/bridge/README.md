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
| `BRIDGE_MAX_QUEUE` | `100` | Số job xếp hàng tối đa (vượt → 429) |
| `BRIDGE_MAX_UPLOAD` | `2147483648` (2GB) | Giới hạn dung lượng upload |
| `BRIDGE_JOB_TTL` | `3600000` (1h) | Job tự dọn sau bao lâu |
| `BRIDGE_WORK_DIR` | `<tmp>/vcut-bridge-jobs` | Thư mục chứa job tạm |
| `FFMPEG` / `FFPROBE` | `ffmpeg` / `ffprobe` | Đường dẫn binary |

Web UI trỏ tới bridge qua `VITE_BRIDGE_URL` (mặc định `http://127.0.0.1:8787`).

## API

### `GET /api/health`
→ `{ ok, version, ffmpeg: boolean, runningJobs: number, queuedJobs: number }`

### `POST /api/render`
Multipart form:
- `spec`: JSON string của video-spec
- `media`: một hoặc nhiều file (field name `media`, filename phải khớp `clip.src`)

→ `201 { jobId, status, queuePosition }` | `400` (spec/file không hợp lệ) |
`429` (hàng đợi đầy — vượt `BRIDGE_MAX_QUEUE`)

Job được xếp hàng FIFO (R1-041): vượt `BRIDGE_MAX_JOBS` thì job chờ (`queued`)
thay vì bị từ chối như trước. `queuePosition` cho biết vị trí chờ (1-based).

### `GET /api/render`
Danh sách job, mới nhất trước. `?limit=` (mặc định 50, tối đa 200).
→ `{ jobs: [...], running: number, queued: number }`

### `GET /api/render/:id`
→ `{ id, status, progress, queuePosition, attempts, error, outputName, outputSize, qaReport }`

`status`: `queued` | `running` | `done` | `error` | `cancelled`
`progress`: 0..1 (parse từ stderr của ffmpeg)
`qaReport`: kết quả kiểm tra output (R1-043, null nếu chưa có)

### `GET /api/render/:id/download`
Tải file MP4 (chỉ khi `status=done`). → `409` nếu chưa xong.

### `DELETE /api/render/:id`
Hủy job: gỡ khỏi hàng đợi nếu đang `queued`; kill cả process group
(SIGTERM → SIGKILL sau 5s) nếu đang `running`, để ffmpeg con cũng chết theo.
Xóa thư mục tạm ngay. → `{ ok: true, id, status: "cancelled" }` |
`404` | `409` (job đã ở trạng thái cuối).

### `POST /api/render/:id/retry`
Chạy lại job bị lỗi (`error`) — xếp hàng lại, giữ nguyên thư mục media.
→ `{ jobId, status, queuePosition }` | `404` | `409` (không ở trạng thái `error`;
job đã `cancelled` thì thư mục đã bị xóa — phải tạo job mới).

## Test

```bash
node test/test-jobqueue.cjs   # unit test RenderJobService (52 test, không cần ffmpeg)
bash test/test-bridge-queue.sh # integration: bridge thật + render thật, MAX_JOBS=1
```

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
- Job lưu trong RAM — restart bridge mất job đang chạy; job queued được phục hồi
  best-effort từ thư mục tạm (render lại từ đầu). Chi tiết: `JOBQUEUE_LIMITS.md`.
- Không có retry tự động — retry thủ công qua `POST /api/render/:id/retry`.
- Media phải upload lại mỗi lần export (chưa có cache theo hash) — xem R1-032/R1-035.
