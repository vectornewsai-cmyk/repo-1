# Templates — 10 mẫu video VCut Studio

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

- Sửa template: sửa trong `gen_templates.py` rồi chạy lại
  `python3 gen_templates.py` (sinh JSON), sau đó
  `python3 build_templates_ts.py` (sinh `apps/web/src/lib/templates.ts`
  — bản nhúng cho web app, đừng sửa tay).
- Kiểm chứng:
  - `bash apps/web/scripts/test-templates.sh` — 10 assertions cho engine
    + validation cả 10 template.
  - Cả 10 template đã qua `validateSpec` (zod của render worker) và
    youtube-intro đã render thật thành MP4.
