# P7 — Render worker hiểu src `asset:`: giới hạn đã biết

## Cơ chế resolve (`resolveSrc(src, mediaDir, assetMap)` trong validate.js)

Thứ tự cho src dạng `asset:<id>`:
1. **Asset map trước** (nếu có): map là JSON object `{ assetId: file }` do
   bridge (`asset-map.json` trong thư mục job, từ field `assetMap` của
   POST `/api/render`) hoặc CLI (`--asset-map <file>`) truyền kèm.
   - Value tuyệt đối → dùng trực tiếp (tin cậy caller: bridge/CLI là phía
     tin cậy, giống như `--media-dir`).
   - Value tương đối → resolve dưới `mediaDir`, có chặn traversal (`../`
     thoát mediaDir → null → lỗi rõ).
2. **Fallback mediaDir**: không có map, hoặc id không có trong map → tìm file
   cùng tên `<id>` trong `mediaDir`. Đường dẫn fallback được trả về ngay cả
   khi file chưa tồn tại để `validateMedia` báo thiếu asset rõ ràng.
3. `null` chỉ khi: id rỗng (`asset:`) hoặc traversal — cả hai đều thành lỗi
   nêu tên asset, không thành lỗi ffmpeg khó hiểu.

Src không phải `asset:` giữ nguyên hành vi cũ (tuyệt đối → dùng luôn; tương
đối → dưới mediaDir; traversal → null).

## Validate (`validateMedia(spec, mediaDir, ffprobeBin, assetMap)`)

- Video/audio/image: kiểm tra như cũ (tồn tại, ffprobe stream, độ dài),
  chỉ khác thông báo khi thiếu: nêu tên asset + cách sửa (upload file kèm
  spec, hoặc truyền asset map).
- Sticker track (MỚI): trước P7, sticker thiếu file chỉ fail khó hiểu ở
  ffmpeg input registration; nay kiểm tra tồn tại sớm (stat, không probe
  stream — sticker là PNG/APNG, không cần stream video). File không phải
  file thường → lỗi rõ.
- User LUT `user-...` (K3) không đổi: vẫn resolve từ `__lut_<id>.cube` trong
  mediaDir, độc lập với asset map.
- Animated WebP vẫn bị FFmpeg 8.1.2 từ chối như K3 đã ghi (không thuộc P7).

## Giới hạn còn lại

- `asset:` id KHÔNG được validate với bất kỳ catalog nào: gõ sai id chỉ fail
  ở validate lúc render, với tên asset trong thông báo (không fail sớm ở
  lúc submit spec — bridge không kiểm tra nội dung spec theo asset).
- Asset map không được version hóa theo spec: nếu caller đổi file sau khi job
  đã enqueue, worker sẽ đọc map lúc spawn (bridge ghi map trước enqueue nên
  trong luồng chuẩn không có race này; chỉ xảy ra nếu sửa tay file job).
- Map value trỏ tới file ngoài mediaDir (tuyệt đối) là CHO PHÉP theo thiết
  kế (caller tin cậy); nếu muốn sandbox chặt hơn, cần thêm whitelist ở
  bridge — ngoài phạm vi P7.
- Test: `src/test_p7_asset.js` (7 check, render thật: map, fallback,
  thiếu asset, sticker asset, traversal, value tuyệt đối).
