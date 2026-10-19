# Thumbnail timeline — Giới hạn trung thực (R1-035)

## Đã làm
- Timeline hiển thị thumbnail dạng **filmstrip nhiều frame** cho clip **video**
  dài (R1-066: 1 frame mỗi ~2s, tối đa 10 frame, lazy + cache + dedupe) và
  thumbnail đơn cho clip **image** (ảnh gốc lúc import), thumbnail đơn cho clip
  **sticker** (PNG gốc, contain).
- Capture qua `<video>` + `<canvas>`, async, không block UI; lazy qua
  `IntersectionObserver` (chỉ capture khi clip lọt vào vùng nhìn ±120px).
- Cache LRU 100 mục (`apps/web/src/lib/thumbnails.ts`), dedupe request trùng,
  tối đa 3 capture song song.
- Media import qua thư viện đã có sẵn `thumbnail` (chụp ở 10%/0.5s lúc import)
  → dùng luôn cho clip ngắn/image, không capture lại.
- Lỗi load/seek/CORS → trả `null`, fallback block màu như cũ (không crash).

## Chưa làm / giới hạn
1. **Không phải proxy video**: chỉ là ảnh tĩnh JPEG 120×68, không scrub-preview
   động khi hover (CapCut có). Muốn có phải thêm hover logic.
2. **Thumbnail chụp theo mốc cách đều** (`in + (i+0.5)*dur/count`), không tính
   speed/reverse/keyframe — chỉ là gợi ý thị giác.
3. **Chroma/LUT/effects không áp vào thumbnail**: ảnh là frame gốc của video,
   không qua filter chain (preview thật mới thấy hiệu ứng).
4. **Cache theo session**: blob URL mất hiệu lực khi reload trang → thumbnail của
   media cũ không còn; phải import lại (nợ chung P0-02 asset manifest).
5. **Sticker dùng PNG gốc** (có thể lớn) thay vì bản resize — chấp nhận được vì
   sticker thư viện nhỏ; sticker upload lớn có thể tốn RAM decode.
6. **Không có thumbnail cho text/audio**: text hiện label, audio hiện waveform
   (đã có từ trước) — đúng như thiết kế.
7. Chưa có test tự động trên browser thật (nợ chung của dự án — xem
   `apps/web/VERIFICATION.md`); logic cache có thể test unit bằng mock DOM.
