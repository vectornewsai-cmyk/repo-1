# TRANSLATE_LIMITS.md — Giới hạn trung thực của dịch phụ đề (R1-080)

`server/caption/translate.py` dịch phụ đề bằng **faster-whisper `translate` task**
(chạy 100% local, dùng model đã có — không tải thêm, không gọi cloud).

## Giới hạn đã biết

1. **Chỉ dịch sang tiếng Anh.** `translate` task của Whisper/faster-whisper chỉ
   hỗ trợ đích = English. Đây là giới hạn của model, không phải lựa chọn thiết
   kế. Muốn en→vi hoặc cặp khác cần engine MT riêng (xem #8).
2. **Timing lấy từ pass translate, không phải pass transcribe gốc.** Hai pass
   chạy độc lập trên cùng audio nên mốc thời gian có thể lệch nhẹ (thường
   < 0.3s). Nếu cần khớp từng khung hình với bản gốc, kéo tay trên timeline
   (đã có multi-select).
3. **Chất lượng dịch phụ thuộc model `small`.** Câu ngắn, tiếng lóng, thuật ngữ
   chuyên ngành có thể dịch sai hoặc bỏ sót. Luôn có bước review trước khi áp
   dụng — giống caption gốc.
4. **Cần model faster-whisper (~462MB)** trong `server/caption/models/fw-small`
   (dùng chung với caption.py). Chưa có model → lỗi rõ ràng khi chạy, không
   treo lặng lẽ.
5. **Tốc độ ~1–3x realtime trên CPU** (giống caption). Video 10 phút có thể mất
   tới ~30 phút; timeout bridge 20 phút cho mỗi lần dịch.
6. **Không giữ word-level timestamps của bản gốc.** Output có `words` của bản
   dịch (tiếng Anh) — karaoke/highlight theo bản gốc không áp dụng được cho
   bản dịch.
7. **Ngôn ngữ nguồn** theo whitelist của bridge (`vi, en, auto, zh, ja, ko, th,
   id, ms, fr, de, es`). Nguồn đã là tiếng Anh → translate vẫn chạy (viết lại
   câu, chuẩn hóa chính tả) nhưng ít giá trị.
8. **Chưa có en→vi.** `argos-translate` (MIT, offline) là ứng viên cho cặp
   vi↔en nhưng chưa được bundle/verify trong repo — để dành future work, không
   hứa hẹn trong UI.
9. **Chưa verify với model thật trong môi trường dev hiện tại**
   (`faster_whisper` chưa cài ở VM này — giống tình trạng caption.py). Pipeline
   đã được kiểm chứng end-to-end bằng stub (`test-translate-stub.py`):
   bridge → NDJSON → 5 segments tiếng Anh đúng nội dung. Chất lượng dịch thật
   cần kiểm chứng trên máy đã cài model.

## Quyết định thiết kế

- Tái sử dụng `caption.py` qua `import caption` (extract_audio, load_model,
  group_words, to_video_spec_track) — không copy-paste logic pipeline.
- Output JSON cùng schema với caption.py + thêm `source_language`,
  `target_language`, `engine` — UI và test dùng chung validator segments.
- Track dịch luôn tạo **track mới** ("Phụ đề (EN)"), không ghi đè track gốc —
  user so sánh/sửa song song được.

## Cách chạy test

```bash
cd server/caption && python3 test_translate.py        # 6 assertions, không cần model
cd ../bridge && node test/test-translate.cjs          # unit bridge (dùng stub)
bash test-translate-e2e.sh                            # E2E qua bridge thật + stub
```
