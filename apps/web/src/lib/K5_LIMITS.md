# K5_LIMITS.md — Giới hạn trung thực của đợt UI/UX Phase 6 (K5)

## Đã làm + đã kiểm chứng

1. **Toast thống nhất** (`lib/toast.ts`, `components/Toasts.tsx`): thay toàn bộ
   `window.alert` ở App.tsx (lưu project) và ProjectMenu.tsx (mở/lưu/xuất/nhập)
   bằng toast góc dưới-phải, tự đóng sau 4.5s. Test: `scripts/test-k5.sh` 16/16.
2. **Fullscreen preview** (`preview.tsx`): nút ⛶ góc trên-phải + phím `F`
   (qua `togglePreviewFullscreen`, id `vcut-preview-wrap`). Canvas đã tự co
   theo wrap mỗi frame nên fullscreen không cần resize tay.
3. **Thả media có phản hồi** (`lib/drop.ts`, `Timeline.tsx`): vạch vàng chỉ vị
   trí clip sẽ rơi khi rê trên lane; thả trượt (track khóa / sai loại /
   chồng clip) báo lý do bằng toast thay vì im lặng. Luật validation mirror
   đúng store (R1-054 khóa, mediaKindForTrack, R1-055 snap frame). Test 16/16.
4. **Phím tắt mới** (`App.tsx`): `J`/`L` tua ∓5s, `K` phát/dừng, `Home`/`End`
   về đầu/cuối, `←`/`→` tua từng frame, `F` fullscreen. Danh sách trong
   Inspector (ProjectInfo) đã cập nhật theo.
5. **Empty state**: MediaBin trống có 3 bước hướng dẫn + nút nhập file;
   preview hiện gợi ý khi project chưa có clip nào (không chặn thao tác).
6. **Inspector gập/mở**: các nhóm điều khiển của clip video/audio/chữ/thời
   gian thành section bấm để gập/mở (mặc định mở hết — không giấu tính năng).
   Chỉ sửa Inspector.tsx, không đụng các panel con.

## Chưa kiểm chứng được (không có browser thật)

- Toàn bộ tương tác click/chuột: nút fullscreen, vạch thả, section gập/mở,
  toast hiển thị — chỉ kiểm chứng bằng `tsc` (sạch ở apps/web/src) và
  `vite build` pass. Cần click-test trên browser thật khi có hạ tầng.
- Phím tắt mới chưa được bấm thử trên bàn phím thật (chỉ đọc code path).

## Cố ý KHÔNG làm / để cho agent khác

- `window.confirm` vẫn giữ (ProjectMenu bỏ thay đổi chưa lưu, BgRemovePanel):
  xác nhận phá hủy cần quyết định thật của user, toast không thay thế được.
- `Ctrl+D` duplicate clip: thuộc phạm vi K2 (copy/paste/duplicate) — K5
  không đụng để tránh xung đột.
- `J` là tua lại 5s, KHÔNG phải phát ngược thật: preview chưa hỗ trợ phát
  ngược (xem SEEK_LIMITS) nên không giả vờ làm shuttle ngược chuẩn.
- Drag-drop MediaBin → Timeline đã có từ trước (K5 chỉ thêm vạch chỉ +
  báo lỗi); không viết lại.
- Thiết kế gốc, không copy trade dress CapCut: chỉ học luồng thao tác chuẩn
  (thả vào timeline, fullscreen, phím tắt, toast, empty state).

## Lưu ý khi merge với các agent Phase 6 khác

- `App.tsx` (khối phím tắt) và `Inspector.tsx` cũng có thể bị K2 chạm tới
  (copy/paste) — parent cần kiểm tra xung đột khi gộp.
- Tại thời điểm K5 xong, `tsc` toàn repo báo lỗi ở
  `packages/video-spec/src/sticker.ts` (dòng 277–317, batch Fluent UI Emoji
  của K6 đang sửa dở) — KHÔNG phải lỗi của K5: `tsc` lọc riêng apps/web/src
  sạch 0 lỗi, `vite build` pass. Đừng sửa file của K6 từ phía K5.
