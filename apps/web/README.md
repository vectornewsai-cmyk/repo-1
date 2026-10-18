# Editor web (Phase 1A)

> ⏳ **Đang được agent 1A implement.** Thư mục này giữ yêu cầu.

## Yêu cầu bắt buộc

- React + TypeScript + Vite, state bằng Zustand
- Dark theme hiện đại, **tiếng Việt**, giao diện phải đẹp (yêu cầu cứng)
- Layout: preview canvas phía trên, timeline đa track phía dưới, toolbar, media bin
- Timeline: thêm/xoá track, kéo-thả clip, playhead, zoom, snap
- Thao tác clip: trim (in/out), split, delete
- Text overlay: thêm/sửa/di chuyển chữ trên preview
- Project model = `video-spec` JSON (`@repo-1/video-spec`) — UI đọc/ghi đúng schema này
- Panel Export: xuất video-spec JSON (nối sang render worker ở Phase 1B)

## Tiêu chí xong

`npm run dev` mở được editor thao tác mượt; `npm run build` pass không lỗi;
không có tính năng nào "nhìn có mà bấm không chạy".
