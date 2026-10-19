# STICKER2_LIMITS.md — Giới hạn trung thực của thư viện sticker mở rộng (R1-078)

Tạo ngày 2026-10-19. Script: `assets/stickers/make_stickers2.py` (PIL 10.2.0).

## Đã làm thật
- 24 sticker PNG mới, 256×256 RGBA, nền trong suốt — mở được bằng PIL, kiểm tra kích thước/mode/nội dung.
- Phân loại 5 nhóm: emoji (6), shapes (5), arrows (5), badges (4), bubbles (4).
- StickerPanel có tabs phân loại + ô search theo tên tiếng Việt.
- Copy đồng bộ sang `apps/web/public/stickers/` (Vite serve).
- Attribution 1:1 trong `assets/stickers/SOURCES.md` + 30 dòng trong `assets/SOURCES.md`.

## Giới hạn còn lại
1. **Vẽ bằng hình học cơ bản** — không chi tiết như sticker CapCut vẽ tay; style flat đơn giản.
2. **Chưa có sticker động** (animated/GIF/Lottie) — CapCut có nhiều.
3. **Không có theo chủ đề/từ khóa tiếng Anh** — search chỉ theo tên tiếng Việt.
4. **arrow-down/arrow-left** là bản xoay của arrow-up, không phải thiết kế riêng.
5. **Chữ "!" trong bubble-shout** dùng font bitmap mặc định của PIL — đơn giản, không typography đẹp.
6. **Chưa có bản quyền kiểm tra ngược** — tự vẽ nên không lo, nhưng không thể đảm bảo 100% không trùng ý tưởng với sticker có sẵn (hình học cơ bản như tròn/vuông/mũi tên là phổ quát).
7. **Chưa test render thật** với 24 sticker mới — render worker dùng FFmpeg overlay với PNG bất kỳ, không phụ thuộc nội dung cụ thể; sticker cũ đã pass.
8. **Chưa click-test browser thật** (nợ chung hạ tầng của dự án).
