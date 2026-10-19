# RIPPLE_LIMITS.md — Giới hạn trung thực của ripple delete/trim (R1-054)

Ngày: 2026-10-19. Module: `apps/web/src/lib/ripple.ts` (pure functions).

## Đã làm được

- **Ripple delete**: xóa clip → mọi clip đứng sau trên cùng track dồn về trước
  đúng bằng duration clip bị xóa. Test: 3 clip `[0,2),[2,4),[4,6)` → xóa clip
  giữa → còn `[0,2),[2,4)` khít nhau.
- **Ripple trim (mép phải)**: trim ngắn/dài → clip sau dồn/đẩy theo đúng delta.
- **Toggle**: nút 🧲 Ripple trên timeline toolbar. Tắt = hành vi cũ
  (xóa để lại gap, trim phải bị chặn khi đè clip khác).
- Chỉ ảnh hưởng track chứa clip — track khác giữ nguyên.
- Phím `Delete`/`Backspace` tự ripple khi toggle bật (qua `deleteSelection`).

## Giới hạn còn lại (trung thực)

1. **Ripple trim chỉ áp dụng cho mép PHẢI.** Trim mép trái không ripple
   (Premiere cũng phân biệt ripple-trim head/tail; scope R1-054 chỉ yêu cầu mép phải).
2. **Không ripple khi move clip.** Kéo clip đè lên clip khác vẫn bị chặn như cũ.
3. **Keyframe/animations** của clip bị dịch: giữ nguyên theo local-time
   (đúng vì keyframe tính theo thời gian nội bộ clip, không theo timeline).
4. **Playhead không tự dịch** khi ripple — nếu playhead đang ở vùng bị dồn,
   nó vẫn giữ nguyên giá trị cũ (có thể trỏ vào clip khác sau ripple).
5. **Chưa có undo/redo** — ripple là mutation vĩnh viễn cho tới khi user sửa tay
   (undo/redo thuộc R1-05x khác của Batch E).
6. **Clip bị dịch có thể vượt quá media duration?** Không — ripple chỉ đổi
   `start`, không đổi `in/out/duration` của clip bị dịch, nên không bao giờ
   đọc ngoài phạm vi file nguồn.
7. **Floating-point**: so sánh `start >= end` dùng epsilon 1e-9 để tránh lỗi
   làm tròn sau nhiều lần trim/split.
8. Chưa test E2E click thật trên browser (nợ chung của dự án).
