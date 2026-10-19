# CHROMA_LIMITS.md — Giới hạn trung thực của chroma key

> Nguyên tắc của dự án: nói rõ cái gì làm được, cái gì chưa. File này là
> cam kết trung thực, không phải disclaimer cho code ẩu.

## Đã kiểm chứng chạy THẬT ✅

- `buildChromaFilter()` sinh filter FFmpeg `chromakey` đúng chuẩn — self-test 1 pass.
- Demo `demo_chroma.js` render MP4 thật 5s: nền xanh lá #00FF00 bị xoá hoàn toàn,
  thay bằng background xanh dương; hộp đỏ foreground giữ nguyên màu đỏ.
  Kiểm chứng pixel-level: pixel nền RGB(0,0,254), pixel vật thể RGB(253,0,0).
- Spec TypeScript `chroma.ts`: validate đầy đủ (hex, similarity/blend 0..1).

## Giới hạn (trung thực)

1. **Chỉ key được ĐÚNG 1 màu mỗi clip.** Muốn xoá 2 màu khác nhau phải tách
   thành 2 clip chồng nhau — chưa hỗ trợ multi-color trong 1 filter.

2. **Không phải AI segmentation.** Đây là key theo màu (color distance), không
   phải tách nền bằng machine learning như CapCut ("Remove background" AI).
   Hậu quả cụ thể:
   - Tóc tơ, lông, vật trong suốt (kính, ly nước) sẽ bị răng cưa hoặc mất chi tiết.
   - Vùng bán trong suốt (bóng đổ trên phông xanh) không xử lý được mượt.

3. **Phông nền phải đều màu và đủ sáng.** Nếp nhăn, bóng đổ, vùng tối trên
   phông xanh sẽ không bị xoá hết (vì màu lệch khỏi màu key). Tăng `similarity`
   để xoá rộng hơn — nhưng sẽ "ăn" vào vật thể nếu vật thể có màu gần phông
   (vd: áo xanh lá trước phông xanh lá).

4. **`similarity` cao + `blend` cao = biên nhòe.** Vật thể nhỏ, mảnh (ngón tay,
   dây) có thể bị mờ hoặc mất hẳn ở biên khi blend > 0.3.

5. **Chưa tích hợp vào `render.js` chính.** Module `chroma.js` đã sẵn sàng với
   hướng dẫn tích hợp 1-dòng trong header file (chèn sau `format=yuv420p`,
   giữ kênh alpha `yuva420p` cho overlay). Agent chính cần nối vào.

6. **Tương tác với transition (xfade):** unit đã qua xfade mà mang kênh alpha
   có thể composite không như mong đợi. Khuyến nghị: không đặt transition
   ngay tại clip đang bật chroma key cho tới khi được kiểm chứng riêng.

7. **Preview trên web chưa hiển thị hiệu ứng.** Canvas preview của editor vẽ
   clip gốc (chưa key). Hiệu ứng chỉ thấy được sau khi render. UI đã ghi rõ
   điều này để user không hiểu lầm.

8. **Chroma key + keyframe vị trí video:** hai tính năng độc lập, chưa test
   kết hợp. Về lý thuyết tương thích (key trước, overlay sau) nhưng chưa
   có video kiểm chứng.

9. **Màu key phải là hex #rrggbb chính xác.** Không hỗ trợ tên màu ("green"),
   không hỗ trợ key theo khoảng màu HSV.

## So với CapCut (trung thực)

| Khía cạnh | VCut Studio (hiện tại) | CapCut |
|---|---|---|
| Xoá phông xanh (green screen) | ✅ FFmpeg chromakey, local | ✅ |
| Tách nền AI (không cần phông xanh) | ❌ chưa có | ✅ (cloud/AI) |
| Key 1 màu tùy chọn | ✅ | ✅ |
| Tinh chỉnh similarity/blend | ✅ | ✅ (tương đương) |
| Xử lý tóc tơ mượt | ❌ (giới hạn của key màu) | ✅ (AI) |
