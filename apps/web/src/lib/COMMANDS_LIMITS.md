# COMMANDS_LIMITS.md — Giới hạn trung thực của undo/redo (R1-050, R1-051)

## Thiết kế

- **Command pattern**: mỗi thao tác là `SpecCommand { label, mergeKey?, apply }`.
  `do()` = `apply(before)` → spec mới; `undo()` = khôi phục snapshot `before`.
- **Snapshot + structural sharing**: lưu tham chiếu spec cũ (không deep clone).
  Mọi mutation trong store đều tạo object mới qua spread nên cây con không đổi
  được chia sẻ — mỗi entry tốn O(1) bộ nhớ thêm.
- **Hai cơ chế gộp**:
  1. `beginHistoryGroup`/`endHistoryGroup`: kéo-thả timeline → 1 entry khi thả chuột.
  2. `mergeKey` + cửa sổ 800ms: slider/spinner trong Inspector bắn `onChange`
     liên tục → gộp thành 1 entry.

## Giới hạn (trung thực)

1. **Bất biến bắt buộc**: không code nào được mutate `spec`/`track`/`clip` tại chỗ.
   Nếu một mutation tương lai mutate trực tiếp, history sẽ hỏng lặng lẽ
   (snapshot `before` cũng bị đổi theo). Mọi mutation hiện tại đều pure.

2. **Đổi tên project (`setProjectName`) không undo được** — là metadata, gõ từng
   ký tự sẽ spam history. Quyết định chủ ý.

3. **Media bin không undo được** — import file chỉ đổi `media[]`, không đổi spec.

4. **Đổi project xoá history** — `loadSample` / `newProject` / `replaceProject`
   gọi `history.clear()`. Không undo xuyên qua project khác.

5. **History không bền vững qua reload** — autosave chỉ lưu spec, không lưu stack.
   Reload trang = mất undo.

6. **Tối đa 100 bước** (`MAX_HISTORY`) — entry cũ nhất bị đẩy ra.

7. **MCP / bridge / CLI sửa spec không qua history** — undo/redo chỉ cho thao tác
   trên web UI. Agent sửa project qua MCP không undo được trên UI.

8. **Gộp theo thời gian có thể gộp quá tay**: hai lần chỉnh opacity cách nhau
   < 800ms (cùng clip) gộp thành 1 bước undo. Chủ ý để slider không spam.

9. **Label của group lấy lúc bắt đầu kéo** — nếu giữa chừng kéo mà user kịp bấm
   phím tắt khác (hiếm), entry vẫn mang label "Di chuyển clip"/"Cắt clip".

10. **Không undo được khi đang kéo** — `undo()`/`redo()` trả về null trong group
    để tránh trạng thái nửa vời.

11. **Stopgap `undoDelete`/`canUndoDelete` đã xoá** — thay bằng undo/redo đầy đủ.
    Nút "Hoàn tác" trong Inspector giờ gọi `undo()` thật.
