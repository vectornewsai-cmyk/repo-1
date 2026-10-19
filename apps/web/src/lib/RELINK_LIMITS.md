# RELINK_LIMITS.md — Giới hạn trung thực của Missing-media relink (R1-033)

## Đã làm (đã kiểm chứng)

- `findMissingAssets()`: quét spec, liệt kê asset thiếu theo `src` — 16/16 test pass
  (`scripts/test-relink.sh`).
- `relinkAsset()`: cập nhật `src` mọi clip dùng asset cũ — pure, không mutate input.
- `RelinkPanel`: modal liệt kê từng file thiếu (loại, tên, số clip, track) + nút
  "Chọn lại" mở file picker đúng loại (`accept`).
- `store.relinkMedia()`: import file qua `fileToMediaItem` (probe thật bằng
  `<video>/<audio>/<img>`), verify metadata trước khi chấp nhận.
- Tích hợp: sau khi mở file (ProjectMenu) và sau khi khôi phục autosave (App)
  → tự động hiện panel nếu có asset thiếu.
- Clip thiếu media: preview đã hiện placeholder "Thiếu media: ..." (có sẵn từ
  trước), không crash.

## Giới hạn

1. **Match theo tên file, không theo content hash.** Nếu user đổi tên file gốc
   rồi relink, clip sẽ trỏ sang tên mới — đúng ý đồ relink, nhưng không phát
   hiện được "đây có phải đúng file cũ không". Asset manifest + hash (R1-032)
   sẽ cho phép gợi ý relink tự động theo hash.
2. **Không có gợi ý tự động.** CapCut tự tìm file cùng tên trong thư mục gần
   đó; ở đây user phải chọn tay từng file. (Cần File System Access API hoặc
   asset store mới làm được quét thư mục.)
3. **blob: URL luôn bị coi là thiếu.** Đúng vì blob của phiên cũ đã chết, nhưng
   nếu project vừa save trong cùng phiên (chưa reload) mà user mở lại file vừa
   lưu, panel sẽ hiện dù media vẫn còn trong MediaBin — user chỉ cần "Bỏ qua".
4. **Verify metadata nông.** Chỉ check duration/kích thước > 0; không decode
   thử toàn file. File hỏng giữa chừng vẫn có thể lọt.
5. **Relink 1 file cho 1 src.** Không có "relink hàng loạt" (chọn 1 thư mục cho
   nhiều file thiếu cùng lúc).
6. **Chưa có test E2E click thật** trên browser (nợ chung của dự án). Logic
   pure đã test bằng Node; UI panel chỉ kiểm tra bằng `tsc` + build.
7. **Sticker kind:** sticker clip dùng PNG từ kho asset built-in (`assets/`);
   nếu project trỏ tới sticker PNG ngoài mà thiếu, relink chấp nhận mọi ảnh —
   không kiểm tra có phải sticker "chuẩn" không.
