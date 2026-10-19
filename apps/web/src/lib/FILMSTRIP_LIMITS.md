# Filmstrip timeline — Giới hạn trung thực (R1-066)

## Đã làm
- Clip **video** dài hơn 2s hiện dải filmstrip N frame cách đều (như CapCut):
  1 frame mỗi ~2s thời lượng, tối đa 10 frame.
- Clip video ≤2s giữ 1 frame như cũ (R1-035); image/sticker giữ hành vi cũ.
- Các mốc timestamp là hàm pure (`filmstripTimestamps`) — điểm giữa mỗi đoạn,
  offset theo `clip.in` (source time).
- Mỗi frame đi qua pipeline có sẵn của `thumbnails.ts`: cache LRU 100 mục,
  dedupe request trùng, tối đa 3 capture song song — không spawn ồ ạt thẻ video.
- Lazy qua `IntersectionObserver` (±120px): clip ngoài viewport không capture.
- Frame lỗi → ô trống (fallback block màu), không crash.

## Test
- `bash apps/web/scripts/test-filmstrip.sh`: 15/15 assertions pass
  (filmstripCount biên, timestamps đúng [1,3,5,7,9] cho clip 10s, offset theo
  `in`, cache key phân biệt → không bị dedupe gộp).
- Ground-truth ffmpeg: video 10s có nội dung thay đổi → 5 frame ở 5 mốc đều
  khác nhau (5/5 hash phân biệt).
- `npx tsc --noEmit`: 0 lỗi; `npm run build` (vite): pass.

## Chưa làm / giới hạn
1. **Không phải proxy video**: các ô là ảnh tĩnh JPEG 120×68, không scrub-preview
   động khi hover (CapCut có).
2. **Timestamp không tính speed/reverse**: clip speed 2x thì các mốc source-time
   không còn cách đều theo nội dung hiển thị — chỉ là gợi ý thị giác.
3. **Chroma/LUT/effects không áp vào filmstrip**: frame gốc của video, không qua
   filter chain (preview thật mới thấy hiệu ứng).
4. **Thumbnail import lúc add media (10%/0.5s) bị bỏ qua** khi clip có filmstrip
   (>1 frame) — vì nó chỉ là 1 frame, không dựng được dải. Hơi phí 1 lần capture
   đã có sẵn; chấp nhận để logic đơn giản.
5. **Cache theo session**: blob URL mất hiệu lực khi reload trang → filmstrip của
   media cũ phải capture lại (nợ chung P0-02 asset manifest).
6. **Keyframe times không ảnh hưởng filmstrip**: keyframe opacity/position không
   phản ánh trong ảnh.
7. Filmstrip của nhiều clip dài cùng lúc có thể đầy cache 100 mục → frame cũ bị
   đẩy ra, capture lại khi cuộn về (hành vi LRU, chấp nhận được).
8. Chưa có test tự động trên browser thật (nợ chung của dự án) — capture path
   (`captureFrame`) kế thừa từ R1-035 đã ship, không sửa trong task này.
