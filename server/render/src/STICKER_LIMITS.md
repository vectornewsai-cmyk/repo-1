# Giới hạn sticker overlay — ghi trung thực ngày 2026-10-19

## Đã làm được (có video MP4 thật chứng minh)

- Dán PNG (nền trong suốt) lên video tại vị trí x/y tương đối, kích thước theo
  tỉ lệ khung hình, độ mờ, góc xoay — tất cả render THẬT bằng FFmpeg
  (`overlay` + `colorchannelmixer` + `rotate`), đã xem frame bằng mắt.
- Sticker hiện/ẩn đúng theo `start`/`duration` trên timeline (pattern
  `setpts` + `overlay eof_action=pass`, giống video unit).
- 6 sticker mẫu tự vẽ 100% (PIL), không bản quyền.

## Chưa làm được / giới hạn

1. **Chưa tích hợp vào render.js/validate.js/index.ts** — theo phân công không
   sửa file agent khác. Module `sticker.js` độc lập, đã có hướng dẫn tích hợp
   từng bước trong `apps/web/src/components/sticker/README.md`.
2. **Preview web chưa hiển thị sticker** — panel UI ghi rõ "hiệu lực khi render".
3. **Không có keyframe cho sticker** — vị trí/kích thước/độ mờ là hằng số trong
   suốt clip. Muốn sticker bay theo thời gian thì cần thêm `animations` như
   keyframes (khả thi: overlay x/y nhận biểu thức theo `t`).
4. **Chỉ 1 ảnh tĩnh mỗi sticker** — không hỗ trợ sticker động (GIF/APNG/WebP
   động). Muốn thì dùng `ignore_loop` + trim, chưa làm.
5. **Xoay làm tăng bounding box** — `rotate` mở rộng khung chứa, nên tâm xoay
   hơi lệch khi góc lớn + scale lớn. Với sticker nhỏ (< 0.5 khung hình) không
   đáng kể.
6. **`loop` filter giới hạn 32767 frame** (~18 phút ở 30fps) — sticker trong
   video dài hơn sẽ đứng hình sau ngưỡng này. Thực tế không ai dán 1 sticker
   18 phút, nhưng ghi rõ ở đây.
7. **Chữ trong sticker là ảnh** — không edit text được, muốn đổi chữ phải vẽ
   lại PNG.
8. **File nhị phân** — PNG không push được qua API text-only; cần pipeline
   push binary riêng (ghi chú cho agent chính).
