# PROGRESS_LIMITS.md — Giới hạn trung thực của tiến trình export (R1-065)

Tiến trình render được parse từ stderr của ffmpeg (`time=HH:MM:SS.ss`),
ETA ước lượng từ tốc độ render trong cửa sổ trượt 8 giây.

## Những gì đúng

1. **Progress đơn điệu 0 → 0.99 trong lúc render, = 1 khi done.** Bridge giữ
   `Math.max` nên progress không bao giờ giảm, kể cả khi ffmpeg báo time lùi
   (ví dụ phase muxing cuối).
2. **Chuẩn hóa `\r`.** ffmpeg viết progress updates bằng carriage return
   (cùng 1 dòng); bridge chuẩn hóa `\r` → `\n` và lấy update mới nhất trong
   mỗi chunk stderr.
3. **ETA là ước lượng, không phải cam kết.** Tính bằng
   `(duration − time_đã_render) / tốc_độ_gần_nhất`; tốc độ đo trên cửa sổ
   trượt 8 giây (tối đa 20 sample).
4. **Fallback `frame=`.** Khi ffmpeg không báo `time=` (một số build/format),
   progress ước lượng từ `frame= / (fps × duration)` với fps lấy từ
   `spec.meta.fps`.

## Giới hạn đã biết

1. **ETA không chính xác với render có tốc độ không đều.** Ví dụ: video có
   đoạn hiệu ứng nặng ở cuối, hoặc phase encode audio cuối chậm hơn video →
   ETA nhảy. Đây là bản chất của ước lượng tuyến tính.
2. **ETA = null ở đầu job.** Cần ≥ 2 sample trong cửa sổ 8s; job render
   nhanh (< ~2s) có thể xong mà không bao giờ hiện ETA.
3. **Parse stderr dạng text là mong manh.** Nếu ffmpeg đổi format dòng
   progress trong tương lai, parser `time=`/`frame=` có thể im lặng trả về
   progress = 0. Không có cơ chế phát hiện "parser đã lỗi thời".
4. **Không có progress cho phase upload.** Trạng thái `uploading` (tải media
   lên bridge) hiển thị riêng, không có %.
5. **Clamp 0.99.** Progress không bao giờ hiện 100% cho đến khi job `done`
   (tránh "100% giả" rồi vẫn chờ QA/download).
6. **Poll 1s ở UI.** ExportPanel poll `/api/render/:id` mỗi 1 giây → độ trễ
   hiển thị tối đa ~1s + network. Giảm poll interval sẽ tăng tải bridge.
7. **In-memory.** Restart bridge mất toàn bộ tiến trình; job recover render
   lại từ đầu (progress reset về 0).
8. **Retry reset tiến trình.** Chạy lại job lỗi bắt đầu lại từ 0, không tiếp
   tục từ điểm cũ (ffmpeg không hỗ trợ resume).
9. **`frame=` fallback cần fps đúng.** Nếu `spec.meta.fps` sai/thiếu, fallback
   không kích hoạt và progress có thể đứng yên ở 0 cho đến khi `time=` xuất hiện.
10. **Chưa có progress cho caption/AI job tương lai.** Cơ chế này gắn với
    ffmpeg; các job AI (Batch H) cần cơ chế riêng.

## Cách chạy test

```bash
cd server/bridge
node test/test-progress.cjs        # unit: 17 assertions (parse, ETA, fallback)
bash test-export-progress.sh       # E2E: render 10s thật qua bridge, port 18797
```
