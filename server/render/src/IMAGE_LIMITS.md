# IMAGE_LIMITS.md — Giới hạn trung thực của image clip (P0-03 / R1-010)

Tài liệu này ghi NHỮNG GÌ CHƯA LÀM ĐƯỢC, để không ai hiểu lầm image clip
ngang hàng video clip về tính năng.

## Đã làm được (kiểm chứng bằng MP4 thật, xem demo_image.js)

- Ảnh tĩnh (PNG, JPEG, BMP, TIFF) thành clip full-frame trên image track.
- `fit: "contain"` (giữ tỉ lệ + letterbox/pillarbox nền đen) và `"cover"`
  (lấp đầy + crop giữa) — cả hai render thật qua FFmpeg.
- Đặt lên timeline đúng `start`/`duration` (setpts + overlay, giống video unit).
- Ảnh và video có thể ở cùng project (thứ tự composite: video → image → sticker → text).
- Cùng một file PNG vừa làm image clip vừa làm sticker được (không xung đột
  input — image dùng filter-level loop, không dùng `-loop 1`).

## Chưa làm được

1. **Thời lượng tối đa ~18 phút/clip ở 30fps.** Filter `loop` giới hạn 32767
   frame (giới hạn cứng của FFmpeg). Vượt quá sẽ hết frame để loop.
2. **Không có transition cho image clip.** `transitionIn`/`transitionOut`
   chỉ hoạt động giữa 2 video clip trên cùng video track.
3. **Không có LUT / effects / keyframe / chroma / speed cho image clip.**
   Các field đó chỉ áp dụng cho `kind: "video"`. Muốn có phải mở rộng
   `buildImageChain()` trong tương lai.
4. **Alpha flatten về nền đen.** PNG trong suốt → vùng trong suốt thành đen
   (do `format=yuv420p` bỏ kênh alpha). Chưa hỗ trợ nền tùy chỉnh cho vùng
   trong suốt (ngoài màu pad đen của contain).
5. **Không có audio.** Image clip không mang audio stream (đúng bản chất ảnh tĩnh).
6. **Ảnh động (GIF/APNG/WebP động) không được hỗ trợ** — validator yêu cầu
   ảnh tĩnh (1 frame). GIF sẽ bị từ chối ở validateMedia.
7. **Ảnh rất lớn** (vd 8K) sẽ tốn RAM/CPU khi scale — không có downscale
   tiền xử lý. Khuyến nghị resize trước khi import.
8. **Chưa có Ken Burns** (pan/zoom trên ảnh tĩnh kiểu CapCut) — cần keyframe
   cho image clip, chưa triển khai.

## Quyết định thiết kế đáng chú ý

- **Filter-level loop thay vì `-loop 1`:** sticker module cũng dùng filter
  `loop` cho PNG. Nếu input dùng `-loop 1` (stream vô hạn), filter loop của
  sticker sẽ đệm 32767 frame (~11GB RAM ở 640x360) trước khi xuất — cùng file
  vừa làm image clip vừa làm sticker sẽ nổ RAM. Cách hiện tại tránh hoàn toàn
  xung đột và không cần sửa logic đăng ký input trong render.js.
- **Image track riêng, không trộn vào video track:** ImageClip không có
  `in`/`out` (ảnh không có trục thời gian), nên để chung track video sẽ phá vỡ
  invariant của video clip. Track riêng giữ validator/render đơn giản và rõ ràng.
