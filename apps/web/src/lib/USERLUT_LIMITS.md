# USERLUT_LIMITS.md — Giới hạn trung thực của K3 (Phase 6)

## Những gì đã kiểm chứng (test_userlut_k3.js: 20/20 pass)

1. **Nhập LUT .cube tự chế:**
   - Parse + validate chặt: bắt buộc `LUT_3D_SIZE` (2..256), số dòng dữ liệu
     phải đúng size³, mỗi dòng đúng 3 số trong -1..2, từ chối LUT 1D,
     file > 10MB, file rỗng, TITLE/DOMAIN đọc đúng.
   - Id luôn `user-<slug>`, không đè được LUT hệ thống; trùng id tự thêm hậu tố.
   - Render thật: LUT đảo kênh R/B làm |dR|+|dB| = 204 (ngưỡng > 30).
   - Thiếu file .cube lúc render → fail fast với thông báo rõ.
   - LUT catalog cũ vẫn render bình thường (regression).
2. **Sticker động APNG:** render thật qua pipeline sticker có sẵn; vùng sticker
   đổi hash theo thời gian (động thật, không phải frame tĩnh).
3. **Web (tsc):** userLut.ts, LutPicker.tsx, StickerPanel.tsx, ExportPanel.tsx,
   video-spec lut.ts — 0 lỗi. Bridge `node --check` pass. lut.js self-test pass.

## Giới hạn còn lại (trung thực, không giấu)

1. **WebP động KHÔNG render được với FFmpeg 8.1.2 ở đây.** File WebP động
   hợp lệ (PIL đọc được 20 frame) nhưng demuxer webp của FFmpeg báo
   "image data not found" và render fail (exit 69). Vì vậy StickerPanel từ
   chối WebP động ngay lúc upload với thông báo rõ + gợi ý dùng APNG.
   WebP tĩnh vẫn dùng bình thường. Nếu FFmpeg được build lại với demuxer
   webp khác, chỉ cần bỏ nhánh từ chối này (detectAnimatedImage đã có sẵn).
2. **LUT user chỉ sống trong trình duyệt/profile đã nhập** (IndexedDB
   `vcut-user-luts`). Mở project ở máy khác, hoặc xóa dữ liệu trình duyệt,
   thì clip vẫn giữ id `user-...` nhưng export sẽ báo thiếu file và yêu cầu
   nhập lại file .cube. Project JSON không chứa nội dung .cube.
3. **Preview LUT user trong LutPicker là swatch cầu vồng trung tính** (không
   phải màu thật) — màu thật chỉ thấy khi render, giống LUT hệ thống vốn chỉ
   có CSS approx. Preview canvas của clip cũng chưa áp LUT user.
4. **Sticker động chỉ qua track sticker** (overlay), không phải image clip
   full-frame. Tốc độ phát = fps gốc của file APNG (vd 10fps), không đồng bộ
   lên fps project. Preview canvas chưa vẽ sticker (giới hạn cũ, không phải
   do K3).
5. **Bridge chỉ kiểm tra .cube ở mức "không chứa byte điều khiển lạ"**
   (64 byte đầu) vì chỉ đọc được head ngắn. Parse chặt nằm ở web
   (parseCube) và FFmpeg lut3d lúc render — file .cube giả mạo qua được
   bridge vẫn bị 2 lớp sau chặn.
6. **Kích thước LUT tối đa 10MB, lưới tối đa 256³.** LUT lớn hơn (vd 512³
   ≈ 134M dòng) bị từ chối — FFmpeg lut3d cũng không xử lý nổi file đó
   trong thời gian hợp lý trên máy thường.
7. **Xung đột file với agent khác (ghi nhận, không phải lỗi của K3):**
   - `packages/video-spec/src/sticker.ts` đang được agent K6 sửa dở (mảng
     STICKER_LIBRARY bị chèn sau `] as const;`) → tsc hiện báo 123 lỗi
     đều từ file này, vite build cũng gãy theo. K3 không chạm vào file đó.
   - `apps/web/src/lib/fonts.ts` (sửa 14:17 ngày 21/10 bởi agent khác) thiếu
     export `fontsByCategory` mà FontPicker.tsx đang import → vite build gãy
     ở bước này trước cả sticker.ts. K3 không chạm vào 2 file đó.
   - Cả hai cần agent sở hữu sửa xong thì `tsc --noEmit` và `vite build`
     mới xanh lại toàn dự án; code K3 đã sạch riêng lẻ.

## File thay đổi (K3, KHÔNG push)

- Mới: `apps/web/src/lib/userLut.ts`, `apps/web/src/lib/USERLUT_LIMITS.md`
  (file này), `server/render/test_userlut_k3.js`
- Sửa: `packages/video-spec/src/lut.ts` (+ mirror `lut.js`),
  `server/render/src/lut.js`, `server/render/src/render.js`,
  `server/bridge/src/index.js` (whitelist `.cube`/`.apng` + magic),
  `apps/web/src/components/lut/LutPicker.tsx` (+ `lut.css`),
  `apps/web/src/components/sticker/StickerPanel.tsx`,
  `apps/web/src/ExportPanel.tsx`
