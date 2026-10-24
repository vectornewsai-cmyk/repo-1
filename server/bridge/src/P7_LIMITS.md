# P7 — Bridge queue bền vững (job.json): giới hạn đã biết

## Lưu cái gì, không lưu cái gì

- Mỗi job có `job.json` trong thư mục job (`<WORK_ROOT>/<id>/job.json`),
  ghi **nguyên tử** (tmp + rename) tại mỗi lần đổi trạng thái: enqueue,
  start (running), done, error, retry, và khi recover ghi đè running →
  interrupted. Ghi lỗi chỉ log `console.error`, không bao giờ làm hỏng job
  đang chạy.
- ĐƯỢC lưu: id, dir, mediaDir, specPath, outPath, status, progress (giá trị
  cuối cùng trước crash), totalDuration, attempts, error, outputName,
  outputSize, createdAt, startedAt, finishedAt, note, preset, qaReport.
- KHÔNG được lưu (mất khi restart, đây là giới hạn có chủ đích):
  - Tiến trình render realtime: `proc`, kill timer, stderr tail, ETA samples
    (chuỗi `time=`/`frame=` của ffmpeg). Job queued khôi phục sẽ render từ
    progress 0, không tiếp tục từ 0.4.
  - Job đang chạy KHÔNG BAO GIỜ được tự render tiếp sau restart: nó trở thành
    `interrupted` (trạng thái terminal mới, retry được). Partial `output.mp4`
    bị xóa để tránh phục vụ file dở dang (download chỉ cho status `done`).
  - Job cancelled vẫn bị xóa thư mục (như cũ) → không khôi phục được, đúng
    với ý nghĩa "hủy".

## Khôi phục sau restart (`recover()`)

- `job.json` queued → xếp hàng lại, giữ nguyên id/createdAt/preset/note,
  `recovered: true`; `spec.json` thiếu → khôi phục thành `error` (không đoán).
- `job.json` running → `interrupted`, error nêu rõ "Bị gián đoạn do bridge
  restart — dùng retry để render lại từ đầu.", `finishedAt` = lúc restart,
  partial output bị xóa, `job.json` ghi đè ngay để restart lần 2 vẫn thấy
  `interrupted` (ổn định, không dao động).
- `job.json` done/error/cancelled → khôi phục nguyên trạng, không spawn lại
  (sửa luôn bug cũ: `recover()` cũ re-enqueue cả job done vì chỉ nhìn
  `spec.json`, rồi fail do media đã prune theo R1-040).
- Thư mục legacy (không có `job.json`, tạo trước P7): không có `spec.json` →
  bỏ qua; có `output.mp4` (> 0 byte) + media đã prune + tên dir 16-hex →
  khôi phục `done` (dấu hiệu R1-040); còn lại → hành vi cũ (xếp hàng lại,
  sinh id mới, note "Phục hồi sau khi server restart").
- `recover()` vẫn trả về tổng số (number) như cũ; chi tiết nằm ở
  `service.recoverStats = { queued, interrupted, restored, legacy, skipped }`.
  Log khởi động bridge in breakdown này.
- Queue đầy trong lúc recover → dừng vòng lặp (như cũ); job còn lại sẽ được
  thử lại ở lần recover sau (không mất, vì thư mục vẫn còn trên đĩa).

## Giới hạn còn lại

- Janitor TTL vẫn xóa thư mục job terminal (kể cả `job.json`) sau TTL mặc
  định 3600s — queue bền vững không có nghĩa là lưu trữ vĩnh viễn.
- `asset-map.json` (P7, xem `server/render/src/P7_LIMITS.md`) được ghi kèm
  job và spawn worker nhận `--asset-map`; nếu file này bị xóa tay, job
  `asset:` sẽ fail ở validate với tên asset rõ ràng (không crash bridge).
- Crash giữa lúc ghi `job.json` không làm hỏng trạng thái cũ: rename nguyên
  tử giữ bản cũ nguyên vẹn; file `.job.json.tmp-*` sót lại là vô hại
  (janitor xóa cùng thư mục job).
- Test: `test/test-p7-queue-persist.cjs` (26 check, fake proc) và
  `test/test-p7-bridge-restart.sh` (14 check, kill -9 thật).
