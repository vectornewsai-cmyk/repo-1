# Templates — 30 mẫu video VCut Studio

Tất cả do VCut Studio thiết kế gốc (**MIT**), không sao chép layout hay
preset độc quyền của CapCut.

## Danh sách

| ID | Tên | Khổ | Dài | Placeholder |
|---|---|---|---|---|
| youtube-intro | Intro YouTube | 16:9 | 5s | Video nền, tiêu đề, slogan |
| youtube-outro | Outro YouTube | 16:9 | 8s | Video nền, cảm ơn, kênh, CTA |
| tiktok-viral | TikTok dọc | 9:16 | 15s | 3 cảnh, hook, chú thích |
| slideshow | Slideshow ảnh | 16:9 | 12s | 4 ảnh, tiêu đề |
| lyric-video | Lyric video | 16:9 | 24s | Nhạc, nền, 4 câu lyric |
| lower-third | Bảng tên (Lower Third) | 16:9 | 6s | Video, tên, chức danh |
| title-card | Thẻ tiêu đề | 16:9 | 4s | Nền, tiêu đề |
| product-showcase | Giới thiệu sản phẩm | 1:1 | 10s | Sản phẩm, tên, giá, CTA |
| travel-vlog-intro | Mở đầu Vlog du lịch | 16:9 | 6s | Cảnh quay, địa điểm, thời gian |
| podcast-audiogram | Audiogram Podcast | 1:1 | 30s | Audio, bìa, tên tập, khách mời |
| wedding-teaser | Teaser đám cưới | 16:9 | 8s | Video, tên cặp đôi, ngày cưới |
| food-reel | Reel món ăn | 9:16 | 12s | 3 cảnh, hook, tên món |
| gaming-highlight | Highlight game | 9:16 | 10s | 2 pha, tỉ số |
| breaking-news | Tin nóng | 16:9 | 6s | Video, headline, dòng chạy |
| quote-card | Thẻ trích dẫn | 1:1 | 6s | Ảnh nền, trích dẫn, tác giả |
| tutorial-vertical | Hướng dẫn dọc | 9:16 | 12s | 3 bước, 3 nhãn |
| unboxing | Mở hộp sản phẩm | 1:1 | 10s | Video, tên, giá |
| fitness-promo | Quảng cáo gym | 16:9 | 8s | Video, khẩu hiệu, CTA |
| lofi-visual | Nhạc lofi thư giãn | 16:9 | 12s | Ảnh nền, nhạc, tên bài, nghệ sĩ |
| album-teaser | Teaser album | 1:1 | 8s | Ảnh bìa, tên album, ngày phát hành |
| interview-cut | Cắt phỏng vấn | 16:9 | 12s | 2 góc máy, 2 tên |
| audiobook-promo | Quảng cáo sách nói | 1:1 | 8s | Ảnh bìa, tên sách, giọng đọc |
| event-invite | Thiệp mời sự kiện | 9:16 | 8s | Ảnh, tên sự kiện, thời gian/địa điểm |
| real-estate-tour | Tour bất động sản | 16:9 | 12s | 3 không gian, địa chỉ, giá |
| recipe-card | Công thức nấu ăn | 9:16 | 12s | Video, tên món, nguyên liệu |
| travel-diary | Nhật ký du lịch | 16:9 | 12s | 4 ảnh, 2 chú thích |
| birthday-card | Thiệp sinh nhật | 1:1 | 6s | Ảnh nền, tên, lời chúc |
| sale-banner | Banner giảm giá | 16:9 | 6s | Video, mức giảm, điều kiện |
| documentary-title | Tiêu đề phim tài liệu | 16:9 | 6s | Video, tên phim, số tập |
| outro-creator | Kết video creator | 16:9 | 8s | Video, cảm ơn, kênh, đăng ký |

## Định dạng

Mỗi file JSON gồm 2 phần:

- `template`: metadata — id, tên, mô tả, category, `version`, `author`,
  `license`, tags, aspect, `durationSec`, và `placeholders[]`
  (mỗi placeholder có `id`, `kind` video/image/audio/text, `label`,
  `default`).
- `spec`: video-spec JSON (SPEC_VERSION 0.2.0). Mọi chỗ cần người dùng
  điền được đánh dấu `{{placeholder_id}}` trong field chuỗi
  (`clip.src`, `text clip .text`, ...).

## Dùng trong editor

Nút **🎬 Mẫu** trên TopBar → chọn mẫu → điền placeholder (chữ: gõ trực
tiếp; media: chọn từ kho media đã nạp hoặc giữ tên file mặc định) →
**Tạo project**. Project mới thay thế project hiện tại (có hộp xác nhận).
File media chưa nạp sẽ được RelinkPanel báo để chọn lại file.

## Phát triển / đồng bộ

  - Vòng 1 (10 mẫu): `gen_templates.py`.
  - Vòng 2 (20 mẫu, P5 Phase 7): `gen_templates2.py`.
- Sửa template: sửa trong `gen_templates.py` (vòng 1) hoặc `gen_templates2.py`
  (vòng 2) rồi chạy lại script tương ứng (sinh JSON), sau đó
  `python3 build_templates_ts.py` (sinh `apps/web/src/lib/templates.ts`
  — bản nhúng cho web app, đừng sửa tay).
- Kiểm chứng:
  - `bash apps/web/scripts/test-templates.sh` — 10 assertions cho engine
    + validation cả 30 template.
  - Cả 30 template đã qua `validateSpec` (zod của render worker) và
    youtube-intro đã render thật thành MP4 (vòng 1); 20 template vòng 2
    render thật thành MP4 bằng test_p5_templates (xem P5_LIMITS.md).
