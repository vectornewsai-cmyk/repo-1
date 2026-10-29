# NESTED_UI_LIMITS.md — UI Timeline cho nested clip + adjustment layer (N4, Phase 9)

## Đã làm (UI only, không đụng render/spec lõi)

- `apps/web/src/components/nested/nestUtils.ts`: logic thuần gom/rã nested
  clip + thêm/xoá adjustment layer (xem header file về ngữ nghĩa).
- `apps/web/src/components/nested/NestedClipPanel.tsx`: tạo compound clip từ
  clip đang chọn (tên tùy chọn), liệt kê nested clip, xem bên trong (liệt kê
  clip gốc trong subSpec), rã về clip gốc, chọn trên timeline.
- `apps/web/src/components/nested/AdjustmentLayerPanel.tsx`: thêm layer với
  filter từ EFFECT_TYPES (16 filter FFmpeg native đã có thật trong repo),
  cường độ, start/duration; liệt kê + chọn + xoá layer.
- `apps/web/src/Timeline.tsx` (sửa tối thiểu, không viết lại): nested clip vẽ
  màu tím riêng + badge 📦 + tên; adjustment layer vẽ trên hàng FX riêng
  (cao 34px, cam, nét đứt) phía trên các track kèm ô gutter "🎛 FX" để
  không lệch hàng; click chọn được cả hai loại; 2 nút toolbar mở panel.
- `apps/web/src/store.ts` (thêm tối thiểu, không viết lại): 4 action
  `nestSelection` / `unnestClip` / `addAdjustmentLayer` /
  `deleteAdjustmentLayer`, tất cả qua `execCommand` nên **undo/redo hoạt
  động** (mỗi thao tác = 1 bước undo, label tiếng Việt).
- `apps/web/tsconfig.json`: thêm `nestUtils.test.ts` vào exclude — đúng quy
  ước repo (mọi test file đều exclude khỏi tsc, chạy bằng node).

## Tương thích với spec của luồng N1 (phát hiện trong lúc làm)

- Luồng N1 đã thêm `NestedClip` vào video-spec (`packages/video-spec/src/
  nested.ts`, union `Clip` gồm `NestedClip`). Bản ghi nested do UI tạo dùng
  thẳng type này: subSpec rebase về 0, không đặt trim/speed (mặc định phát
  toàn bộ subSpec tốc độ 1) nên duration luôn khớp `nestedDuration()`.
- Đã kiểm chứng thật bằng script một lần (không nằm trong repo):
  `validateNestedClip()` trả `[]` và `flattenNested()` mở phẳng đúng vị trí
  (c1@2+3, c2@6+2). Script ở /tmp, không commit.
- Nested clip kế thừa hành vi editor chung: kéo di chuyển (moveSelectionBy),
  trim (nhánh đơn giản vì `isSpeedable` = false với kind nested), xoá
  (deleteSelection) đều hoạt động vì chúng chỉ dùng start/duration. Tách
  (split) không áp dụng cho nested clip (splitClipAt trả null) — đúng, chưa
  phải là thiếu sót cần vá ở luồng này.

## Giới hạn còn tồn (trung thực, không giả vờ)

1. **Preview chưa vẽ nội dung nested clip** (preview.tsx bỏ qua kind lạ;
   N1 cũng ghi rõ trong nested.ts: preview CHƯA biết đọc kind "nested").
   Trên preview, đoạn nested clip hiện là khoảng trống. Thuộc luồng N5.
2. **Render chưa hiểu nested clip và adjustment layer.** Export/render ra
   MP4 chưa áp dụng được hai tính năng này. Thuộc luồng render/spec.
3. **Adjustment layer chưa có type trong video-spec** (chỉ nested có).
   Layer hiện là bản ghi UI ngoài union, lưu trong track.clips bằng cast.
   Save/load project JSON vẫn giữ nguyên layer (JSON thuần) nhưng validator
   của render worker có thể từ chối kind lạ khi export — chưa kiểm chứng
   export, không claim.
4. **"Xem bên trong" chỉ là liệt kê**, chưa phải timeline con chỉnh sửa
   được (xem/sửa clip gốc phải rã ra trước, sửa xong gộp lại).
5. **Không nest lồng nhau ở tầng UI**: gộp clip đã là nested/adjustment bị
   từ chối (tránh đệ quy phức tạp); spec cho phép sâu tới 8 tầng nhưng UI
   chưa khai thác.
6. **Rã bị từ chối nếu clip khôi phục đè lên clip khác** trên track đích
   (giữ bất biến không-chồng-clip). Panel chỉ báo chung chung, không nêu
   tên clip gây đè.
7. **Adjustment layer không tham gia box-select** (chỉ click chọn từng cái)
   và không kéo/trim được trên hàng FX (chỉ xoá qua panel). Di chuyển layer
   = xoá + thêm lại.
8. **Chưa click-test.** Toàn bộ UI mới (panel, hàng FX, badge) mới chỉ qua
   tsc + vite build, chưa chạy trên browser thật (subagent không có live
   browser). Parent cần click-test trước khi coi là xong về mặt UX.
9. **Lỗi tsc còn lại KHÔNG thuộc luồng này**: `KeyframePanel.tsx` (2 lỗi
   `animations` trên `NestedClip`) và `preview.tsx` (1 lỗi `src` trên
   `NestedClip`) — do union `Clip` của N1 thêm kind mới mà các file đó
   (thuộc luồng khác) chưa xử lý. Luồng N4 không sửa file của luồng khác.
   `vite build` vẫn pass vì vite không type-check.

## i18n — key đề xuất, parent merge sau (panel hiện dùng chuỗi Việt trực tiếp)

- `nested.title` = "Nested clip (compound clip)"
- `nested.note` = ghi chú preview/render chưa hỗ trợ (xem panel)
- `nested.selected` = "Đang chọn: {n} clip"
- `nested.needTwo` = "Chọn ít nhất 2 clip trên timeline để gộp."
- `nested.namePlaceholder` = "Tên compound clip (để trống = tự đặt)"
- `nested.nestButton` = "Gộp thành compound clip"
- `nested.listTitle` = "Danh sách nested clip"
- `nested.viewInside` / `nested.hideInside` = "Xem bên trong" / "Ẩn bên trong"
- `nested.unnest` = "Rã"
- `nested.selectOnTimeline` = "Chọn trên timeline"
- `adjustment.title` = "Adjustment layer"
- `adjustment.note` = ghi chú layer áp cho clip bên dưới (xem panel)
- `adjustment.noVideoTrack` = "Cần ít nhất 1 track video để chứa adjustment layer."
- `adjustment.addButton` = "Thêm layer"
- `adjustment.deleteButton` = "Xoá layer"
- `timeline.nestedButton` / `timeline.adjustmentButton` = tooltip 2 nút toolbar

## Test thật đã chạy

- `node apps/web/src/components/nested/nestUtils.test.ts`: **10/10 pass**
  (gom/rã đúng vị trí, rebase subSpec, từ chối <2 clip/track khóa/đè clip/
  đè layer, xoá layer không ripple).
- `npx tsc --noEmit` (apps/web): **0 lỗi trong file của luồng N4** (3 lỗi
  còn lại ở KeyframePanel/preview — xem mục 9).
- `npx vite build`: **pass** (built in 4.79s).
- Chưa click-test (xem mục 8). Chưa test export/render với project chứa
  nested/adjustment (xem mục 3).
