# TRANSITIONS2 (R1-073) — Giới hạn & trạng thái trung thực

> Nguyên tắc: chỉ liệt kê là "hoạt động" những gì đã render ra MP4 thật
> và được kiểm chứng bằng frame trích từ video (`demo_transitions2.js`).

## ✅ HOẠT ĐỘNG (15/15 đã kiểm chứng bằng video thật)

Tất cả dùng filter `xfade` có sẵn của FFmpeg 8.1.2. Mỗi transition đã render
thật trong `demo_transitions2.js` (3 video: `demo-smooth.mp4`,
`demo-slides2.mp4`, `demo-fx2.mp4`, mỗi transition nối 2 đoạn màu 2s bằng
xfade 1s), ffprobe xác nhận h264/độ dài đúng, frame trích tại 25%/50%/75%
transition có nội dung (không đen toàn bộ, không crash).

| type | Hiệu ứng | Ghi chú kiểm chứng |
|---|---|---|
| `smoothleft/right/up/down` | Trượt mượt có mờ biên | frame thấy 2 màu trộn mờ |
| `slideup` / `slidedown` | Trượt dọc | frame thấy 2 nửa màu rõ |
| `circleclose` | Vòng tròn khép vào | frame thấy vòng tròn khép dần |
| `circlecrop` | Clip cũ co thành vòng tròn | **đi qua frame đen ở giữa** (xem §2) |
| `rectcrop` | Clip cũ co thành chữ nhật | **đi qua frame đen ở giữa** (xem §2) |
| `pixelize` | Vỡ thành ô pixel | kiểm chứng bằng testsrc: thấy khối pixel rõ |
| `hblur` | Mờ nhòe ngang | frame thấy vệt mờ ngang |
| `distance` | Zoom tiến lại | frame thấy scale phóng to |
| `vertopen` / `horzopen` | Mở từ giữa | frame thấy khe mở giữa |
| `diagtl` | Quét chéo góc trái-trên | frame thấy đường chéo (đã xem bằng mắt ✅) |

Tổng catalog hiện tại: **28 transitions** (13 cũ + 15 mới), xem `transitions.js`.

## ⚠️ Giới hạn đã biết (trung thực)

1. **`circlecrop` / `rectcrop` đi qua frame đen ở chính giữa transition.**
   Đây là hành vi THẬT của filter xfade trong FFmpeg (đã kiểm chứng pixel:
   tại t=50% frame đen 100%, tại t=25%/75% thấy vòng tròn/chữ nhật co dần),
   không phải bug của VCut. Nếu không muốn frame đen, đừng dùng 2 kiểu này
   cho nội dung quan trọng.
2. **`pixelize` không nhìn thấy gì trên nguồn màu phẳng** (màu đặc): vỡ pixel
   chỉ hiện rõ khi nguồn có chi tiết. Đã kiểm chứng bằng testsrc2/testsrc —
   khối pixel hiện rõ.
3. **Preview trong TransitionPanel là MINH HỌA CSS**, không phải render thật.
   Một số hiệu ứng chỉ xấp xỉ (pixelize dùng `steps()` + `image-rendering:
   pixelated` trên gradient phẳng nên trông như fade — chấp nhận được vì
   chỉ là gợi ý thị giác).
4. **21 transition GLSL trong `assets/transitions/` vẫn KHÔNG dùng được**
   (thiếu filter `gltransition` trong build FFmpeg hiện tại) — xem
   TRANSITIONS_LIMITS.md §"CHƯA HỖ TRỢ". R1-073 không thay đổi điều này.
5. **Duration slider trong UI: 0.1s–2s.** Render worker chấp nhận mọi duration
   > 0, nhưng validate cảnh báo nếu transition dài hơn clip.
6. **Chưa có transition tùy chỉnh** (custom xfade expr), chưa có mask,
   chưa có blend modes — đó là R1-074+ (ngoài phạm vi task này).
7. Một số xfade còn lại của FFmpeg (wipetl/br, squeezeh/v, zoomin, fadefast/
   fadeslow, cover/reveal, wind, diagtr/bl/br, hlslice...) **chưa đưa vào
   catalog** — thêm sau khi kiểm chứng render thật từng cái.
