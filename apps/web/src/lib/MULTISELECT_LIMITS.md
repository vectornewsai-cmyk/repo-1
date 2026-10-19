# MULTISELECT_LIMITS.md — Giới hạn trung thực của multi-select (R1-052)

## Đã làm (VERIFIED)
- `selection` là mảng `Selection[]` (`{trackId, clipId}`), mảng rỗng = không chọn gì.
- Shift+click: thêm vào vùng chọn. Ctrl/Cmd+click: bật/tắt từng clip.
- Kéo vùng trống trên timeline (box select): chọn mọi clip giao với hộp.
- Ctrl/Cmd+A: chọn tất cả clip (không kích hoạt khi đang gõ trong input/textarea).
- Xoá hàng loạt (Delete / nút 🗑): xoá mọi clip đang chọn, bỏ qua track bị khoá (R1-055).
- Kéo 1 clip đang trong nhóm: cả nhóm di chuyển cùng delta, giữ offset tương đối;
  clip nào bị chặn overlap thì đứng yên, các clip còn lại vẫn đi.
- Inspector hiện panel riêng khi chọn >1 clip: đếm theo loại, nút xoá, nút bỏ chọn.
- Các panel chỉnh thuộc tính (Inspector chi tiết, Speed, Keyframe, Chroma, Effect,
  Sticker) và split (S) dùng **mục chọn đầu tiên** (primary) — hành vi single-select cũ
  được giữ nguyên.
- Preview highlight clip đang chọn: chỉ mục đầu tiên.

## Hoàn tác / làm lại (VERIFIED — qua R1-050/R1-051)
- `deleteSelection()` và `moveSelectionBy()` chạy qua `execCommand` của command layer:
  mọi thao tác multi-select đều có thật trong undo stack.
- Xoá 3 clip → `undo()` → cả 3 về đúng track/vị trí cũ **và** selection được khôi phục.
- Kéo-thả nhóm được gộp thành 1 entry duy nhất nhờ `beginHistoryGroup`/
  `endHistoryGroup` trong Timeline (giống kéo 1 clip); ngoài ra `mergeKey`
  gộp các bước di chuyển liên tiếp.
- Nút "↩ Hoàn tác" trong panel multi-select hiện nhãn thao tác (vd. "Xoá 3 clip").

## Chưa làm / giới hạn còn lại
1. **Copy/paste/duplicate** (R1-052 ghi chung trong master plan): chưa implement —
   task này chỉ làm select + delete + move. Nên làm tiếp trong R1-052 phần 2.
2. **Trim nhiều clip cùng lúc**: chưa hỗ trợ — trim vẫn thao tác trên 1 clip.
3. **Áp thuộc tính hàng loạt** (vd. set opacity cho 5 clip): chưa — Inspector
   multi-select chỉ có xoá/bỏ chọn/hoàn tác.
4. **Box select**: chọn theo hình chữ nhật giao nhau, không có chế độ "bao trọn";
   không chọn được clip trên track bị ẩn khỏi DOM (nếu có).
5. **Multi-drag qua track khác**: kéo nhóm chỉ di chuyển ngang (thời gian), không
   kéo thả nhóm sang track khác — vẫn là R1-053.
6. **Snap khi multi-drag**: chỉ clip được nắm giữ snap mép (playhead/mép clip),
   cả nhóm dịch theo cùng delta; frame-snap (R1-056) áp cho mọi clip trong nhóm.
7. **Không có marquee khi kéo ra ngoài vùng nhìn**: hộp chọn không tự cuộn timeline.
8. **Test**: logic thuần (`lib/multiselect.ts`) có test Node đầy đủ; tương tác
   chuột (Shift+click, box select) chưa có test E2E click thật (nợ chung của dự án).
