# OUTPUTQA_LIMITS.md — Giới hạn trung thực của output QA (R1-043)

Module: `server/bridge/src/outputQA.js`, tích hợp tại `server/bridge/src/index.js`
(`proc.on("close")` → `verifyOutput()` trước khi đánh dấu `done`).

## QA kiểm tra gì (5 checks, chỉ ffprobe — không decode)

1. File tồn tại, size > 0
2. Có video stream, codec `h264`
3. Có audio stream, codec `aac` (đúng hợp đồng H.264+AAC của render worker)
4. Duration ≈ kỳ vọng ±0.5s (kỳ vọng = `job.totalDuration` từ spec)
5. Độ phân giải = `spec.meta.width`×`spec.meta.height`

QA fail → `job.status = "error"`, `job.error` bắt đầu bằng
"Kiểm tra chất lượng output thất bại: ...", kèm `qaReport` chi tiết
trong `GET /api/render/:id`. File lỗi KHÔNG được trả qua `/download`
(endpoint chỉ phục vụ khi `status === "done"`).

## Giới hạn còn lại (trung thực)

1. **QA chỉ đọc header (ffprobe), không decode frame** — file decode được
   header nhưng hỏng frame giữa chừng (rất hiếm) sẽ lọt. Đây là trade-off
   tốc độ có chủ ý: decode toàn bộ 1 video 10 phút tốn hàng chục giây.
2. **Không kiểm tra chất lượng hình ảnh** — không phát hiện frame đen,
   nhiễu, hay màu sai. Chỉ kiểm tra "đúng định dạng", không kiểm tra
   "đẹp".
3. **Không kiểm tra đồng bộ A/V** — audio lệch vài trăm ms so với video
   sẽ không bị phát hiện.
4. **Duration tolerance ±0.5s là heuristic** — container duration của MP4
   có thể lệch nhỏ do edit list; 0.5s đủ rộng cho render đúng, đủ hẹp
   để bắt file bị cụt nghiêm trọng.
5. **Không kiểm tra fps** — render worker ép `-r <fps>` nên fps sai là
   cực hiếm; bỏ qua để QA nhanh.
6. **Không kiểm tra bitrate/filesize hợp lý** — file 10s mà chỉ 5KB
   (gần như chắc chắn hỏng) vẫn pass nếu header đúng. Có thể thêm
   ngưỡng bitrate tối thiểu sau.
7. **QA chạy sau khi ffmpeg thoát mã 0** — nếu ffmpeg crash (mã ≠ 0),
   job đã lỗi từ trước, QA không chạy.
8. **File lỗi được GIỮ LẠI** trong job dir để debug, dọn theo TTL 1h
   như job thường — không xóa ngay để còn điều tra.
9. **Nhánh QA-fail chưa được kích hoạt end-to-end qua HTTP** trong test
   (render thật luôn đúng nên QA luôn pass); các case fail của
   `verifyOutput()` đã được self-test 13/13, nhánh wiring trong bridge
   đã review bằng mắt. Muốn test E2E nhánh này cần test hook
   (ví dụ env `BRIDGE_QA_FORCE_FAIL=1`) — chưa làm.

## Đã kiểm chứng (2026-10-19)

- `node src/outputQA.js --self-test`: **13/13 pass** — file đúng pass;
  sai duration/resolution/codec/thiếu audio/file cụt/file không tồn tại
  đều fail với message rõ ràng (vd: "duration 2.00s, kỳ vọng 10s").
- Bridge E2E: POST render thật → `status=done` + `qaReport` có đủ 5 checks,
  `GET .../download` trả file MP4.
