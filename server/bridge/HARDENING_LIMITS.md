# Bridge Hardening — Giới hạn & thiết kế (R1-040)

`server/bridge/src/index.js` — hardening cho local bridge server.

## Đã làm

### 1. Rate limiting (in-memory, theo IP)
- `RATE_MAX_GENERAL` (mặc định 120 req/phút/IP) cho mọi `/api/`
- `RATE_MAX_RENDER` (mặc định 20 req/phút/IP) riêng cho `POST /api/render`
- Fixed window 60s; trả `429` + header `Retry-After`, `X-RateLimit-Limit/Remaining`
- Điều chỉnh qua `BRIDGE_RATE_GENERAL`, `BRIDGE_RATE_RENDER`

### 2. Dọn file tạm
- Job hết hạn (TTL 1h, quét mỗi 5 phút): kill process + xoá thư mục — đã có từ trước
- **Mới:** dọn thư mục job mồ côi lúc khởi động (server từng crash giữa chừng)
- **Mới:** khi job `done` → xoá ngay thư mục `media/` (chỉ giữ `output.mp4` + `spec.json`)
- `DELETE /api/render/:id` vẫn huỷ job + xoá thư mục sau 2s

### 3. Validation
- Spec: giới hạn `BRIDGE_SPEC_MAX` (mặc định 10MB) — multipart text field không bị
  multer giới hạn nên phải check tay; vượt → `413`
- Media: whitelist đuôi file (`ALLOWED_MEDIA_EXTS`: mp4/mov/webm/mkv/mp3/wav/ogg/
  png/jpg/gif/webp/...) + **kiểm tra magic bytes** (chống file giả mạo đuôi)
- Tên file: giữ nguyên sanitize cũ (basename, whitelist ký tự, chặn `.` đầu)
  + double-check `dest.startsWith(mediaDir)` chống path traversal
- Đĩa: từ chối job mới bằng `507` khi dung lượng trống < `BRIDGE_MIN_DISK_FREE`
  (mặc định 256MB); đo bằng `fs.statfsSync`
- Job id: validate format hex 16 ký tự trên mọi route `:id` → `400` nếu sai

### 4. Error handling
- Mọi lỗi trả JSON `{ error: "..." }` — không còn HTML của Express
- 404 cho API không tồn tại → JSON
- Global error handler: log stack ở server, client chỉ nhận "Lỗi máy chủ nội bộ."
- Lỗi multer (file quá lớn...) → `413` JSON rõ ràng
- Lỗi render worker: chi tiết stderr chỉ log ở server, client nhận tóm tắt
- Stream lỗi khi download → 500 JSON hoặc destroy stream

### 5. Health check mở rộng (`GET /api/health`)
```json
{
  "ok": true, "version": "0.1.0",
  "ffmpeg": true, "ffmpegVersion": "ffmpeg version 8.1.2 ...",
  "runningJobs": 0, "totalJobs": 0,
  "disk": { "freeBytes": 123, "freeGB": 45.6, "lowDisk": false },
  "workDirWritable": true, "uptimeSec": 3600, "node": "v24.20.0"
}
```

### 6. Headers bảo mật cơ bản
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
Không phá API hiện tại (CORS giữ nguyên).

## Kiểm chứng
`bash server/bridge/test_hardening.sh` — khởi động server trên cổng test,
chạy các case tấn công/lỗi cơ bản, tắt server.

## Giới hạn còn lại (trung thực)

1. **Rate limit in-memory**: restart server là mất; không chia sẻ giữa nhiều instance
   (bridge chạy local 1 instance nên chấp nhận được).
2. **Không có auth**: bridge bind `0.0.0.0`? — hiện `app.listen(PORT)` bind mọi interface.
   Trên máy cá nhân OK, nhưng nếu mở firewall thì ai trong LAN cũng gọi được.
   Khuyến nghị: bind `127.0.0.1` khi production hoá (chưa đổi để không phá UI hiện tại).
3. **Magic bytes không đầy đủ**: chỉ cover các định dạng phổ biến; file lạ nhưng đuôi
   hợp lệ mà không có rule → cho qua (fail-open ở tầng này, render worker/ffprobe
   sẽ từ chối sau).
4. **Multer memoryStorage**: toàn bộ file upload nằm trong RAM trước khi ghi đĩa.
   File 2GB có thể làm server OOM — giới hạn `MAX_UPLOAD_BYTES` giảm rủi ro nhưng
   không triệt để; cần chuyển sang diskStorage nếu upload file lớn thường xuyên.
5. **Race nhỏ**: check `runningCount()` rồi mới spawn — 2 request đồng thời có thể
   cùng qua (không critical vì chỉ là giới hạn mềm).
6. **Spec JSON parse**: spec độc hại (deep nesting) có thể làm `JSON.parse` chậm —
   giới hạn 10MB giảm thiểu, chưa có depth limit.
7. `fs.statfsSync` không có trên Windows cũ — đã fallback `-1` (bỏ qua check đĩa).
