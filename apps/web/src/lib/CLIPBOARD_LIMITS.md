# CLIPBOARD_LIMITS.md — Giới hạn trung thực của copy/paste/duplicate (K2, Phase 6)

## Đã làm (test thật: `node apps/web/src/lib/clipboard.test.ts` — 12/12 pass)

- **Copy (Ctrl+C / nút 📋 Sao chép)**: lưu selection (1 hoặc nhiều clip, nhiều
  track) vào clipboard nội bộ, giữ nguyên mọi thuộc tính qua deep copy
  (JSON clone). Copy được từ cả track khóa/ẩn vì chỉ đọc, không sửa gì.
- **Paste (Ctrl+V / nút 📥 Dán)**: dán khối tại playhead, giữ nguyên offset
  tương đối giữa các clip (neo ở clip bắt đầu sớm nhất), cấp id mới, rồi
  dịch toàn bộ khối sang phải cho tới khi không còn chồng lấn clip nào trên
  track đích. Dán 2 lần liên tiếp không chồng nhau (lần 2 tự dịch qua lần 1).
- **Duplicate (Ctrl+D / nút ⧉ Nhân bản)**: nhân bản TỪNG clip ngay sau clip
  gốc trên cùng track, đẩy các clip sau sang phải đúng bằng độ dài bản sao
  (ví dụ A,B kề nhau → A, copyA, B, copyB).
- **Undo**: paste và duplicate mỗi thao tác là đúng 1 entry trong CommandStack
  (dùng `execCommand` hiện có); selection sau thao tác = các clip vừa tạo.
- **Track khóa/ẩn**: paste/duplicate bỏ qua clip có track đích bị khóa, ẩn
  hoặc đã xóa; nếu tất cả đều bị bỏ qua thì không làm gì (không push entry
  rỗng vào history).
- **Transition**: clip dán/nhân bản chỉ giữ transition khi điểm nối đó cũng
  được dán/nhân bản cùng lúc và vẫn kề nhau sau khi đặt; mọi transition ở
  biên khối đều bị strip (validator render báo lỗi cứng nếu transitionOut
  không có clip kề ngay sau — xem `server/render/src/validate.js`).
- **Phím tắt**: Ctrl/Cmd+C/V/D trong App.tsx; handler đã return sớm khi focus
  trong input/textarea/select/contentEditable nên copy/paste văn bản gốc của
  trình duyệt vẫn hoạt động.

## Giới hạn (trung thực)

1. **Clipboard nội bộ, không phải system clipboard**: không dán được clip
   sang ứng dụng khác, không copy được từ ứng dụng khác vào. Clip là object
   spec phức tạp (hiệu ứng, keyframe, transition) không biểu diễn được bằng
   text/plain. Clipboard cũng không sống qua reload trang.
2. **Đổi project thì mất clipboard**: `newProject`/`loadSample`/`replaceProject`
   đều xóa clipboard để tránh dán clip của project cũ (trackId không còn khớp
   nên paste cũng sẽ bỏ qua hết — xóa chủ động cho rõ ràng).
3. **Duplicate là nhân bản từng clip, không phải nhân bản cả khối**: chọn
   nhiều clip rồi Ctrl+D sẽ chèn mỗi bản sao ngay sau clip gốc của nó, chứ
   không tạo một khối liền mạch sau selection. Hành vi này đã chọn và ghi
   rõ; nhân bản khối là tính năng khác nếu sau này cần.
4. **Paste luôn về đúng track gốc**: không có chọn track đích; clip có track
   gốc đã xóa/khóa/ẩn sẽ bị bỏ qua lặng lẽ (không báo). Track đích không
   được tạo tự động.
5. **Paste không snap từng clip về frame**: chỉ neo khối (playhead) đã snap
   về frame (playhead vốn đã snap theo R1-055); offset tương đối giữa các
   clip được giữ nguyên tuyệt đối, không làm tròn.
6. **Không có cắt (cut)**: chỉ có copy/paste/duplicate. Cut = copy + delete
   thì delete đã có sẵn (Delete) nhưng chưa gộp thành 1 undo step.
7. **Không kéo-thả clipboard giữa các track**: paste không đổi track; muốn
   chuyển clip sang track khác vẫn phải xóa rồi thêm lại (hoặc dùng move
   nếu cùng loại track — move hiện chỉ trong cùng track).
8. **Kỹ thuật**: `clipboard.ts` chỉ dùng `import type` (không import runtime
   từ module khác) để test chạy được bằng Node type-stripping — Node không
   resolve import không có đuôi `.ts`, còn tsc lại cấm đuôi `.ts` (TS5097).
   Hai helper nhỏ (`getFlag`, `dedupeSels`) được viết lại tại chỗ, logic y
   hệt bản gốc trong trackFlags/multiselect. Vì test import `./clipboard.ts`
   có đuôi nên `clipboard.test.ts` được exclude khỏi tsconfig (giống mẫu
   `assetStore.test.ts`).
9. **Chưa kiểm chứng trên browser thật**: phím tắt và nút TopBar mới chỉ
   được kiểm chứng ở mức unit test + tsc (xem mục dưới). Click-test editor
   trên browser thật vẫn nghẽn hạ tầng chung của repo.

## Trạng thái kiểm chứng lúc giao

- `node apps/web/src/lib/clipboard.test.ts`: **12/12 pass**.
- `npx tsc --noEmit`: **0 lỗi trong các file K2 chạm tới**
  (`clipboard.ts`, `clipboard.test.ts`, `store.ts`, `App.tsx`, `TopBar.tsx`,
  `i18n/*.json`, `tsconfig.json`).
- `npx vite build`: **CHƯA PASS toàn app** — lỗi parse nằm ở
  `packages/video-spec/src/sticker.ts` (agent K6 đang sửa dở, thêm batch
  sticker ngoài array literal) và lỗi type LUT `user-` ở `Inspector.tsx`
  (agent K3 đang làm). Cả hai đều ngoài phạm vi K2, không phải do file K2
  gây ra; cần chạy lại sau khi K3/K6 hoàn tất.
