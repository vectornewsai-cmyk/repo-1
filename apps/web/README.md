# Editor web (Phase 1A)

> ✅ **Đã hoàn thành bởi agent 1A (2026-10-18).** `npm run build` pass, `npm run dev` chạy được.

## Đã implement

- React + TypeScript + Vite, state Zustand; dark theme, tiếng Việt
- Layout: TopBar (tên dự án, transport, thao tác clip, export) / MediaBin (trái)
  / Preview canvas (giữa) / Inspector (phải) / Timeline đa track (dưới)
- Preview Canvas 2D vẽ theo playhead: video thật (đồng bộ seek), ảnh, chữ
  (fadeUp/typewriter), transition fade, opacity; kéo chữ trực tiếp trên preview
- Timeline: thêm/xoá track (video/audio/text), kéo-thả clip (có snap), trim 2 mép,
  playhead kéo được, zoom, kéo-thả media từ thư viện vào track
- Phím tắt: Space (phát/dừng), S (tách tại playhead), Delete (xoá clip)
- Text: thêm/sửa/cỡ/màu/nền/đậm/nghiêng/hiệu ứng/vị trí (slider hoặc kéo trên preview)
- Export: validate bằng `isVideoSpec` + kiểm tra sâu, xem trước JSON,
  tải xuống `.videospec.json`, sao chép clipboard
- Project model = `@repo-1/video-spec` v0.1.0 (khớp 100% types)
- Dự án mẫu tự sinh 2 clip webm thật bằng Canvas + MediaRecorder khi mở app

## Chạy thử

```bash
npm install          # ở root repo-1 (workspaces)
npm run dev --workspace=@repo-1/web   # mở http://localhost:5173
npm run build        # tsc + vite build, phải pass không lỗi
```

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
