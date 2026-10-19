# JOBQUEUE_LIMITS.md — Giới hạn trung thực của RenderJobService (R1-041)

Ngày: 2026-10-19. Quy tắc: chỉ ghi những gì đã kiểm chứng, không ghi "dự kiến".

## 1. Hàng đợi là in-memory — restart mất trạng thái

- `queued` / `running` chỉ tồn tại trong RAM của tiến trình bridge.
- Khi server restart (crash, deploy, reboot):
  - Job đang `running` chết cùng ffmpeg — **không resume được**, phải render lại.
  - Job đang `queued` được phục hồi **best-effort** qua `recover()`: quét
    `WORK_ROOT`, mỗi thư mục có `spec.json` được xếp hàng lại với cờ
    `recovered: true` và render lại từ đầu (output.mp4 cũ, nếu có, bị xóa
    để tránh file dở dang).
  - Điều kiện: `WORK_ROOT` (mặc định `os.tmpdir()/vcut-bridge-jobs`) còn tồn
    tại sau restart. Nếu OS xóa /tmp khi reboot → không còn gì để phục hồi.
- **Đã kiểm chứng:** unit test `recover()` (test 9: 2 job phục hồi, output dở
  dang bị xóa). Chưa kiểm chứng restart thật của bridge process (khó giả lập
  ổn định trong CI) — ghi nhận là nợ kiểm chứng.

## 2. Không có persistence tiến trình

- `progress` mất khi restart. Job phục hồi render lại từ 0%.
- Không có journal/WAL. Đây là quyết định thiết kế có chủ ý ở phase này
  (đơn giản, tránh corruption); nếu cần durability thật, thay `Map` + `fifo`
  bằng SQLite (nợ R1-04x tương lai).

## 3. Retry chỉ từ trạng thái `error`

- `POST /api/render/:id/retry` chỉ chấp nhận job `error`.
- Job `cancelled` bị từ chối (`BAD_STATE`): cancel xóa thư mục job ngay để
  giải phóng đĩa → không còn media để chạy lại. Muốn render lại → tạo job mới.
- Job `done` bị từ chối: đã có output, tải về thay vì render lại.
- Retry là **thủ công** (user/API gọi), không có auto-retry. Lý do: render lỗi
  thường do spec/media sai — tự chạy lại chỉ tốn CPU/đĩa vô ích.
- **Đã kiểm chứng:** unit test 7 (error → retry → done, attempts=2),
  test 8 (retry sau cancel → BAD_STATE), integration test (retry job lỗi).

## 4. Cancel kill cả process group (POSIX) — Windows là fallback yếu

- Render worker (`node render.js`) spawn ffmpeg bằng `spawnSync`. Kill node
  đơn thuần để lại ffmpeg mồ côi.
- `killProcessTree()` gửi signal tới **process group** (`process.kill(-pid)`),
  yêu cầu worker được spawn với `detached: true` (đã làm trong index.js).
- Trên Windows, kill group không được hỗ trợ → fallback `proc.kill()`
  (chỉ giết node, ffmpeg có thể mồ côi). Bridge hiện tại target Linux/macOS;
  Windows ghi nhận là chưa kiểm chứng.
- Sau `SIGTERM` 5s (`killGraceMs`) mà process còn sống → `SIGKILL`.
- **Đã kiểm chứng:** unit test 6 — cancel job đang chạy `sleep 30` thật,
  process chết (không mồ côi), thư mục job bị xóa.

## 5. Hàng đợi đầy → 429 (giữ lại, nhưng ngưỡng cao hơn trước)

- Trước R1-041: vượt `MAX_CONCURRENT_JOBS` → 429 ngay.
- Sau R1-041: job được xếp hàng; chỉ khi số job **queued** vượt
  `MAX_QUEUE_LENGTH` (mặc định 100, env `BRIDGE_MAX_QUEUE`) mới 429.
- **Đã kiểm chứng:** unit test 10 (`QUEUE_FULL`).

## 6. Progress là ước lượng thô

- Parse dòng `time=HH:MM:SS` từ stderr ffmpeg (kế thừa qua render worker).
- Chuẩn hóa theo `totalDuration` ước lượng từ spec (`meta.duration` hoặc max
  end clip). Nếu spec không có duration → progress luôn 0 cho đến khi done.
- Giai đoạn trước khi ffmpeg chạy (validate, dựng filter graph) không có
  progress — job có thể ở 0% một lúc với project nặng. Đây là giới hạn kế thừa
  từ kiến trúc `spawnSync` của render.js, không phải bug của queue.
- Giá trị clamp ở 0.99 cho đến khi worker thoát mã 0 (tránh hiện 100% giả).

## 7. TTL dọn job và file output

- Job terminal (`done`/`error`/`cancelled`) bị xóa sau `JOB_TTL_MS`
  (mặc định 1h, env `BRIDGE_JOB_TTL`), kèm thư mục job và file output.
- **Hệ quả:** link download hết hạn sau 1h. UI phải tải về trước đó.
- Chưa kiểm chứng sweep TTL thật (chờ 1h); logic `sweep()` đã được gọi trong
  code nhưng chưa có test thời gian thật — nợ kiểm chứng nhỏ.

## 8. Thứ tự `list()` khi `createdAt` trùng nhau

- Dùng `seq` tăng dần làm tiebreak để `GET /api/render` luôn trả về mới nhất
  trước, kể cả khi nhiều job được tạo trong cùng 1ms.
- **Đã kiểm chứng:** unit test 3.

## 9. Tương tác với R1-043 (output QA)

- Sau khi worker thoát mã 0, service chạy `verifyOutput` (ffprobe) trước khi
  đánh dấu `done`. QA fail → job `error`, file lỗi **không** được download.
- `RenderJobService` có option `enableQA` (mặc định `true`); unit test đặt
  `false` để không phụ thuộc ffprobe/file mp4 thật.
- Chi tiết QA xem `src/outputQA.js` (thuộc R1-043, không thuộc phạm vi file này).

## 10. Giới hạn chưa đụng tới (ngoài phạm vi R1-041)

- Không ưu tiên job (mọi job FIFO bình đẳng).
- Không pause/resume job đang chạy.
- Không giới hạn băng thông/CPU theo job.
- `GET /api/render` không phân trang con trỏ (chỉ `?limit=` tối đa 200).
