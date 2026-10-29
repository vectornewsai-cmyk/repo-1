# Phase 9 đợt nested/adjustment — LIMITS tổng hợp (đợt lớn, cron 14:03 25/10)

> Đợt này gồm 6 luồng N1–N6 + parent kiểm chứng gộp. Mọi claim dưới đây đều
> có test/số đo đi kèm trong log vòng lặp; phần chưa làm được ghi rõ, không
> tô hồng. Chi tiết từng mảng xem các file LIMITS riêng của từng luồng.

## Đã chứng minh thật (kiểm chứng gộp của parent)

- tsc apps/web: 0 lỗi (sau khi parent sửa 3 lỗi do union `Clip` thêm kind
  mới); vite build pass; i18n check R6 PASS.
- N1 spec: 37/37 — nested clip kind `"nested"`, trim + speed, flatten
  placement, độ sâu tối đa 8, chặn vòng lặp tham chiếu, project cũ tương thích.
- N2 render: 24/24 — flatten + render FFmpeg thật (MP4 320x240, duration
  6.5s khớp project phẳng tương đương).
- N3 adjustment: 46/46 — render thật chứng minh layer chỉ đổi frame trong
  khoảng layer, frame ngoài giữ nguyên tuyệt đối.
- N4 UI: 10/10 — gom/rã compound clip đúng spec N1, 4 action qua execCommand
  nên undo/redo hoạt động.
- N5 preview: 14/14 — flatten + áp adjustment cho preview, vite build pass.
- N6 demo/E2E: 8/8 + 12 kiểm tra — MP4 thật 640x360, 6s.
- Kiểm chứng chéo của parent (script ngoài repo, không stage): spec đúng shape
  N1 (`trim: { in: 1, out: 3 }`, start 10) qua flatten của N2 cho ra đúng
  clip a@10 dur 1 in 1 và clip b@11 dur 1 in 0 — khớp nối N1↔N2 đã thông.

## Sửa do xung đột song song (parent)

- 3 lỗi tsc: `KeyframePanel.tsx` (nested vào nhánh keyframe chưa hỗ trợ, thêm
  key i18n `keyframe.kindNested` vi/en) và `preview.tsx` (guard bỏ qua nested
  clip trong `collectActives` — nested đã được `buildPreviewSpec` làm phẳng
  trước đó nên guard này chỉ là defensive).
- Shape N1↔N2: lúc N2 chạy, `nested.ts` chưa tồn tại nên N2 tự định nghĩa
  shape `in/out` trực tiếp; parent đã sửa `server/render/src/nested.js`
  (`nestedWindow`) chấp nhận cả `trim: { in, out }` (shape N1, thắng khi cả
  hai cùng có) lẫn `in/out` trực tiếp (shape cũ của N2, giữ test N2 xanh).
  Trong lúc sửa, parent tự gây 1 lỗi syntax (dấu `\"` lọt vào file) — đã sửa
  và chạy lại N2 về 24/24 trước khi stage.
- `apps/web/tsconfig.json` bị 3 luồng cùng thêm exclude test — đã gộp thành
  3 dòng, không trùng, không mất dòng nào.

## Chưa làm được / chưa nối (trung thực, không claim ngược)

1. **Adjustment layer chưa nối vào render.js thật.** N3 chỉ để hàm riêng +
   điểm nối ghi rõ trong header `adjustment.js`; test render của N3 dựng
   filter_complex tay mô phỏng đúng điểm nối đó. Clip giao một phần với
   layer vẫn chịu toàn bộ filter trên toàn bộ clip (chưa tách clip theo biên
   layer) — giới hạn lớn nhất so với CapCut.
2. **Adjustment layer chưa có type trong spec.** `adjustment.ts` (N3) chưa
   được export từ `packages/video-spec/src/index.ts` — cố tình chưa thêm,
   vì thêm export TS mà không có mirror `.js` sẽ lệch với quy ước mirror
   của repo, còn port mirror sẽ tạo bản sao thứ ba trùng `render/adjustment.js`.
   Cần quyết định thống nhất mirror trước khi export. Hệ quả: bản ghi
   adjustment của UI (N4) hiện nằm ngoài union spec; export project chứa
   layer chưa kiểm chứng.
3. **Transition qua biên nested clip chưa hỗ trợ ở cả render lẫn preview**
   (render: validator phẳng báo lỗi; preview: cắt cứng, không xfade).
   Opacity đặt trên nested clip không nhân vào clip lá (preview); render
   từ chối field `opacity` trên nested clip (fail fast).
4. **Preview ≠ render ở nested/adjustment (R4 đã sửa 3 điểm cho preview,
   render vẫn chưa nối).** Preview nay: adjustment chỉ áp clip dưới layer
   theo đúng thứ tự track (kể cả qua các tầng nested, `trackStack`);
   chuỗi LUT nối thật lần lượt (WebGL từng LUT, fallback CSS nối chuỗi);
   effect bỏ qua liệt kê trung thực đủ 8 loại + lý do (`SKIPPED_EFFECT_REASONS`,
   type lạ → "chưa biết"). Còn lại ở preview: badge LUT không báo số mắt
   xích chuỗi; cảnh báo effect bỏ qua chưa tới clip image/text/sticker;
   fallback CSS thiếu mắt xích LUT user; transition qua biên nested và
   opacity nested vẫn như mục 3. Render vẫn khác preview cho tới khi nối
   adjustment vào render.js (mục 1).
5. **UI chưa click-test thật.** N4 tự ghi rõ: subagent không có live browser;
   "xem bên trong" nested clip chỉ liệt kê, chưa sửa được trong timeline con;
   không nest lồng ở tầng UI; layer không box-select/kéo/trim trên hàng FX.
6. **Test N6 dùng flatten tự viết** (lúc N6 chạy, `nested.js` của N2 chưa
   tồn tại). Sau khi N2 hạ cánh, test N6 chưa được chạy lại với import từ
   code N2 — kiểm chứng chéo của parent ở trên chỉ chứng minh flatten N2
   đúng shape N1, chưa thay thế flatten trong test N6.
7. **Chưa hỗ trợ:** nested clip mang `reverse`, `speedKeyframes`,
   `animations`, `mask`, `filter`, `effects`, `enhance`, `chromaKey`,
   `audioEffects` (render fail fast thay vì render sai); audio trong subSpec
   mới chỉ test flatten, chưa render MP4 có tiếng lồng nhau để đo; ducking
   không nhắm vào trong project con; fps/kích thước subSpec khác project
   ngoài chưa được validate, hành vi render chưa định nghĩa.
8. **Key i18n đề xuất của N1/N4/N5 chưa merge** (trừ `keyframe.kindNested`
   parent đã thêm). Panel nested/adjustment hiện dùng chuỗi Việt trực tiếp;
   merge key + nối UI sang i18n là việc của đợt sau, không claim đã xong.

## Không làm (đúng chủ trương)

- Không push GitHub, không tag/release, không binary trong batch (chỉ file
  text; script gen/fetch nếu có asset thì không nằm trong đợt này).
- Không đụng cloud/collab, model đóng, nhạc có bản quyền.
