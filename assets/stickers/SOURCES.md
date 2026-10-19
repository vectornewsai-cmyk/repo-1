# Nguồn sticker — `assets/stickers/`

Tất cả 30 sticker trong thư mục này do **VCut Studio tự vẽ 100%** bằng script
Python PIL. Không sao chép, không phái sinh từ bất kỳ tài sản có bản quyền nào.

## Batch 1 (6 sticker, script `/tmp/make_stickers.py`, 2026-10-19)

| File | Mô tả | Màu |
|---|---|---|
| `star.png` | Ngôi sao 5 cánh | Vàng #FFC107, viền trắng |
| `heart.png` | Trái tim | Đỏ #F44336, viền trắng |
| `arrow-right.png` | Mũi tên sang phải | Xanh dương #2196F3, viền trắng |
| `lightning.png` | Tia sét | Vàng #FFEB3B, viền trắng |
| `badge.png` | Huy hiệu tròn rỗng | Tím #9C27B0, viền trắng |
| `bubble.png` | Bong bóng chat 3 chấm | Trắng, viền xanh #2196F3 |

## Batch 2 (24 sticker, script `make_stickers2.py`, 2026-10-19, R1-078)

### Emoji

| File | Mô tả |
|---|---|
| `smile.png` | Mặt cười vàng, mắt tròn + miệng cười |
| `wink.png` | Mặt nháy mắt một bên |
| `laugh.png` | Cười lớn: mắt cong + miệng mở có lưỡi |
| `cool.png` | Mặt đeo kính râm đen |
| `party.png` | Mặt cười đội mũ tiệc + giấy vụn |
| `fire.png` | Ngọn lửa 3 lớp cam/đỏ/vàng |

### Hình khối

| File | Mô tả |
|---|---|
| `shape-circle.png` | Tròn đặc xanh dương, viền trắng |
| `shape-square.png` | Vuông bo góc đỏ, viền trắng |
| `shape-triangle.png` | Tam giác xanh lá, viền trắng |
| `shape-diamond.png` | Hình thoi tím, viền trắng |
| `shape-plus.png` | Dấu cộng xanh teal, viền trắng |

### Mũi tên

| File | Mô tả |
|---|---|
| `arrow-up.png` | Mũi tên lên xanh dương, viền trắng |
| `arrow-down.png` | Mũi tên xuống (xoay 180° từ arrow-up) |
| `arrow-left.png` | Mũi tên trái (xoay 90° từ arrow-up) |
| `arrow-curved.png` | Mũi tên cong cam |
| `arrow-double.png` | Mũi tên 2 đầu tím (↔) |

### Huy hiệu

| File | Mô tả |
|---|---|
| `badge-check.png` | Tích trắng trên tròn xanh lá |
| `badge-cross.png` | Dấu X trắng trên tròn đỏ |
| `badge-medal.png` | Huy chương vàng + dải ruy băng |
| `badge-crown.png` | Vương miện vàng + ngọc đỏ |

### Bong bóng

| File | Mô tả |
|---|---|
| `bubble-speech.png` | Bóng thoại trắng viền xanh + đuôi |
| `bubble-thought.png` | Bóng suy nghĩ (ellipse + bong bóng nhỏ) |
| `bubble-shout.png` | Bóng hét vàng răng cưa viền đỏ + "!" |
| `bubble-tag.png` | Thẻ giá xanh teal có lỗ tròn |

- Kích thước: 256×256 PNG, nền trong suốt (alpha).
- Giấy phép sử dụng trong dự án: tự do (tài sản gốc của dự án, MIT theo LICENSE repo).
- Bản copy phục vụ UI web nằm ở `apps/web/public/stickers/` (Vite serve thư mục `public/`).
- Script `make_stickers2.py` được giữ lại trong thư mục này để tái tạo/audit.
