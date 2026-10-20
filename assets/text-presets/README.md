# Text Presets — VCut Studio

Thư viện 56 preset chữ CSS thuần (không dependency), dùng cho preview web của editor.
Render video (FFmpeg drawtext) chỉ port được một phần — xem ghi chú "Port sang drawtext"
trong từng file.

## Cách dùng

- File `animate-css-*.css`: gắn class `text-preset` vào element chữ.
- File `vcut-*.css`: gắn class `text-preset vcut-<tên>` vào element chữ.
- Mỗi phiên preview chỉ load 1 file preset (các file animate-css dùng chung class `.text-preset`).
- Mở `_test_all.html` bằng browser để xem toàn bộ 56 preset.

## Danh mục

### Entrance — xuất hiện (30)

| File | Hiệu ứng | Port drawtext |
|---|---|---|
| animate-css-fadeIn.css | mờ dần | ✅ fade alpha |
| animate-css-fadeInUp.css | mờ + trượt lên | ✅ |
| animate-css-fadeInDown.css | mờ + trượt xuống | ✅ |
| animate-css-fadeInLeft.css | mờ + trượt từ trái | ✅ |
| animate-css-fadeInRight.css | mờ + trượt từ phải | ✅ |
| animate-css-slideInLeft.css | trượt từ trái | ✅ |
| animate-css-slideInRight.css | trượt từ phải | ✅ |
| animate-css-slideInUp.css | trượt lên | ✅ |
| animate-css-slideInDown.css | trượt xuống | ✅ |
| animate-css-bounceIn.css | nảy vào | ⚠️ mô phỏng đơn giản |
| animate-css-bounceInDown.css | nảy từ trên | ⚠️ mô phỏng đơn giản |
| animate-css-bounceInUp.css | nảy từ dưới | ⚠️ mô phỏng đơn giản |
| animate-css-zoomIn.css | phóng to | ⚠️ fontsize nội suy |
| animate-css-zoomInDown.css | phóng to + rơi xuống | ⚠️ fontsize nội suy |
| animate-css-zoomInUp.css | phóng to + bay lên | ⚠️ fontsize nội suy |
| animate-css-flipInX.css | lật trục X | ❌ (cần 3D) |
| animate-css-flipInY.css | lật trục Y | ❌ (cần 3D) |
| animate-css-rotateIn.css | xoay vào | ❌ (cần rotate) |
| animate-css-rotateInDownLeft.css | xoay từ góc | ❌ (cần rotate) |
| animate-css-rollIn.css | lăn vào | ⚠️ chỉ phần trượt |
| animate-css-lightSpeedIn.css | tốc độ ánh sáng | ⚠️ chỉ phần trượt |
| animate-css-jackInTheBox.css | bật ra từ hộp | ⚠️ mô phỏng đơn giản |
| vcut-blur-in.css | mờ nhòe → sắc nét | ⚠️ chỉ fade |
| vcut-pop.css | bật ra có nảy | ⚠️ fontsize nội suy |
| vcut-slide-reveal.css | lộ dần mặt nạ trượt | ❌ (cần clip-path) |
| vcut-stamp.css | đóng dấu | ⚠️ scale + box |
| vcut-tracking-expand.css | giãn cách ký tự | ❌ (cần letter-spacing) |

### Exit — biến mất (1)

| File | Hiệu ứng | Port drawtext |
|---|---|---|
| animate-css-fadeOutDown.css | mờ + trượt xuống | ✅ |

### Attention — thu hút, lặp (13)

| File | Hiệu ứng | Port drawtext |
|---|---|---|
| animate-css-heartBeat.css | nhịp tim | ⚠️ fontsize nội suy |
| animate-css-pulse.css | đập nhẹ | ⚠️ fontsize nội suy |
| animate-css-rubberBand.css | co giãn thun | ❌ (cần scaleXY độc lập) |
| animate-css-tada.css | nhảy múa | ⚠️ chỉ scale |
| animate-css-shake.css | rung ngang | ✅ x dao động |
| animate-css-swing.css | đung đưa | ❌ (cần rotate) |
| animate-css-wobble.css | lắc lư | ⚠️ chỉ trượt x |
| vcut-neon.css | neon nhấp nháy | ✅ alpha nhấp nháy |
| vcut-wave.css | lượn sóng | ✅ y dao động |
| vcut-rainbow.css | cầu vồng chạy màu | ❌ (cần đổi màu theo t) |
| vcut-flicker-sign.css | bảng hiệu chập chờn | ✅ alpha nhấp nháy |
| vcut-karaoke.css | karaoke quét sáng | ⚠️ 2 lớp drawtext chồng |
| vcut-shine.css | vệt sáng quét | ❌ (cần mask quét) |

### Static style — kiểu chữ tĩnh (12)

| File | Hiệu ứng | Port drawtext |
|---|---|---|
| vcut-outline.css | viền outline | ❌ (cần text-stroke) |
| vcut-outline-glow.css | viền neon phát sáng | ❌ (cần text-stroke) |
| vcut-gradient.css | gradient tím→hồng→cam | ❌ (1 màu) |
| vcut-fire.css | lửa | ❌ (1 màu) |
| vcut-ice.css | băng | ❌ (1 màu) |
| vcut-gold.css | vàng kim loại | ❌ (1 màu) |
| vcut-split-color.css | 2 tông chia nửa | ❌ (1 màu) |
| vcut-retro.css | retro 3D | ⚠️ 1 lớp shadow |
| vcut-shadow-3d.css | 3D nhiều lớp | ⚠️ vẽ chồng 4 lần |
| vcut-cinematic.css | giãn cách rộng | ❌ (cần letter-spacing) |
| vcut-bubble.css | bong bóng sticker | ⚠️ box + màu đặc |
| vcut-marker.css | highlight quét | ⚠️ 2 lớp drawtext |
| vcut-glitch.css | glitch RGB | ⚠️ vẽ chồng lệch kênh |
| vcut-typewriter-caret.css | con trỏ gõ máy | ✅ (caret vẽ riêng) |
| vcut-underline-draw.css | gạch chân vẽ dần | ⚠️ underline width theo t |

## Nguồn & giấy phép

- `animate-css-*`: keyframes từ animate.css tag 3.7.2, MIT (Copyright (c) 2019 Daniel Eden).
  Bản main hiện tại của animate.css dùng Hippocratic License → KHÔNG dùng, chỉ dùng tag 3.7.2.
- `vcut-*`: tác phẩm gốc của VCut Studio, MIT.
- Chi tiết từng file xem `assets/SOURCES.md`.
