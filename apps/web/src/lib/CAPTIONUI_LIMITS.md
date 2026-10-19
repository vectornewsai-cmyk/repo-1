# CAPTION UI — Giới hạn trung thực (R1-072)

Giao diện tạo phụ đề tự động: nút "💬 Phụ đề" trên TopBar → modal chọn
file + ngôn ngữ → `POST /api/caption` (NDJSON stream) → xem trước segments →
chèn thành track "Phụ đề" trên timeline.

## Những gì đã kiểm chứng

- `POST /api/caption` E2E qua bridge thật (stub thay model): 14/14 pass —
  phase upload/extract/transcribe/group, 3 segments đúng nội dung + thời gian,
  các case lỗi 400 (thiếu file, lang sai, file ảnh), stub fail → event error.
- Unit `caption.js`: 17/17 (validateLang, validateSegments, phaseFromLine, config).
- Unit `lib/captions.ts`: 9/9 (validate, segments→clips, style khớp caption.py).
- `group_words`/`to_video_spec_track` của caption.py: 15/15 (không cần model).
- `tsc --noEmit` apps/web: 0 lỗi.

## Giới hạn còn lại (trung thực)

1. **Cần model faster-whisper (~462MB)** trong `server/caption/models/fw-small`
   (hoặc để caption.py tải 1 lần từ HuggingFace — cần mạng). Máy chưa có model
   thì request fail với message rõ ràng, không treo.
2. **Chậm theo thời lượng video**: faster-whisper small ~1–3x realtime trên CPU.
   Video 10 phút có thể mất 10–30 phút; server timeout sau 20 phút
   (`CAPTION_TIMEOUT_MS`). Modal hiện phase + đồng hồ, không có % chi tiết
   vì faster-whisper không báo tiến độ từng phần.
3. **Phụ đề căn theo thời gian gốc của file** (giây 0 = đầu file). Nếu clip đã
   bị trim/move trên timeline, các câu phụ đề sẽ lệch — chọn nhiều câu
   (Shift+click) rồi kéo cho khớp. Chưa có offset tự động.
4. **Whisper không hoàn hảo**: dấu câu/ngắt câu tiếng Việt có thể sai, từ
   chuyên ngành có thể nhận diện lệch — bước "xem trước" tồn tại vì lý do này.
   Hãy đọc lại trước khi áp dụng.
5. **Chưa dùng word-level timestamps**: caption.py có trả `words` (để làm
   karaoke/highlight sau này) nhưng bridge hiện chỉ forward `segments`.
6. **Không có phân biệt người nói** (diarization) — mọi lời thoại gộp chung
   một track.
7. **Ngôn ngữ giới hạn whitelist**: vi, en, auto, zh, ja, ko, th, id, ms, fr,
   de, es. Thêm ngôn ngữ = sửa `CAPTION_LANGS` trong `server/bridge/src/caption.js`.
8. **Bridge phải đang chạy** (`cd server/bridge && npm start`). Nút "💬 Phụ đề"
   bị disable khi kho media không có file video/audio gốc; modal báo rõ nếu
   không kết nối được bridge hoặc caption chưa sẵn sàng (503).
9. **Áp dụng luôn tạo track mới** tên "Phụ đề N" — không gộp vào track chữ có
   sẵn. Muốn gộp thì xóa track cũ hoặc kéo clip sang.
10. **Đánh số task**: brief ghi R1-072 nhưng master plan liệt kê R1-072 là
    "Complete sticker workflow" (caption UI trong plan là R1-081, Batch H).
    Implement theo brief của parent; parent quyết định mapping số hiệu.

## Bảo mật (kế thừa từ bridge)

- Không nhận đường dẫn từ client — file do client upload, bridge tự lưu vào
  thư mục tạm riêng rồi xóa sau khi xong.
- `lang` qua whitelist nghiêm ngặt (chặn injection argv).
- Spawn `python3 caption.py` với argv cố định, `shell: false`.
- Rate limit như render (20 req/phút/IP mặc định).
