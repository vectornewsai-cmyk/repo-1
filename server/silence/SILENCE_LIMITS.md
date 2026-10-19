# SILENCE_LIMITS.md — Giới hạn trung thực của Silence Removal (R1-084, Batch H)

## Cách hoạt động
`server/silence/silence.py` chạy `ffmpeg -af silencedetect` trên file gốc,
parse `silence_start`/`silence_end` từ stderr. Không có model ML, không cloud.
Bridge (`server/bridge/src/silence.js` + `POST /api/silence`) chạy script với
argv cố định. UI (`SilenceModal`) cho preview danh sách rồi gọi
`store.removeSilence()` — split + xóa + dồn gap trong **1 bước undo**.

## Giới hạn (trung thực)

1. **Phát hiện theo năng lượng, không hiểu nội dung.** Tiếng thở mạnh, tiếng
   quạt, nhạc nền nhỏ đều có thể bị coi là "có tiếng" và không bị cắt.
   Ngược lại, đoạn nói thì thầm dưới ngưỡng dB sẽ bị cắt nhầm — luôn kiểm tra
   preview trước khi apply.

2. **Ngưỡng dB phụ thuộc mic/thiết bị.** Mặc định -35dB hợp với mic thường;
   mic tốt/ồn nền thấp có thể cần -45dB, môi trường ồn cần -25dB. Không có
   auto-calibrate — user phải thử.

3. **Chỉ cắt trong phạm vi 1 clip đang chọn.** Không quét toàn bộ timeline
   một lần (muốn cắt nhiều clip → làm từng clip). Cố tình: mỗi clip có thể
   cần ngưỡng khác nhau.

4. **Khoảng lặng ở biên clip được xử lý, nhưng clip bị rút ngắn.**
   Sau khi cắt, các clip đứng SAU trên cùng track tự dồn về trước (ripple).
   Track khác không bị ảnh hưởng. Ctrl+Z hoàn tác toàn bộ.

5. **Không cắt hết clip.** Nếu toàn bộ clip là khoảng lặng → từ chối
   (trả null) thay vì xóa clip. Muốn xóa hẳn thì dùng Delete.

6. **Keyframe của clip được giữ theo local-time** (dịch về gốc clip con),
   nhưng keyframe nằm TRONG đoạn bị cắt sẽ mất cùng đoạn đó.

7. **Transition in/out của clip gốc bị xóa** trên các clip con (đặt về none).
   Lý do: transition trỏ tới clip kề đã bị dịch chuyển sau ripple — giữ lại
   sẽ sai ngữ nghĩa.

8. **Detect theo file NGUỒN, không theo timeline.** Nếu clip đã trim/speed/
   reverse, UI tự map về local-time (đúng cả reverse), nhưng độ chính xác
   phụ thuộc `in`/`out` hiện tại của clip.

9. **Không có fade/crossfade ở điểm cắt.** Cắt "khô" có thể gây click/pop
   ở biên nếu audio không về 0. Muốn mượt → thêm fade tay sau khi cắt.

10. **Bridge cần python3 + ffmpeg/ffprobe trên máy chạy bridge.**
    Endpoint trả 503 nếu thiếu `silence.py`. Timeout 5 phút/job.

11. **Chưa có batch mode, chưa có preview nghe thử** đoạn sẽ cắt,
    chưa có "đánh dấu thay vì cắt" (marker mode).

12. **Chưa test trên browser thật** (nợ chung hạ tầng của dự án) —
    logic thuần đã test bằng Node, API đã test bằng script.
