# Render worker (Phase 1B)

> ⏳ **Đang được agent 1B implement.** Thư mục này giữ hợp đồng đầu vào/ra.

## Hợp đồng

- **Vào**: file `video-spec` JSON (đúng schema `@repo-1/video-spec` v0.1.0)
- **Ra**: file MP4 (H.264 video + AAC audio), đúng `meta.width/height/fps`
- **Cách chạy** (mục tiêu):
  ```bash
  node src/render.js --spec project.json --out video.mp4
  ```

## Yêu cầu bắt buộc

1. Validate spec trước khi render — spec sai thì báo lỗi rõ ràng, không render bừa.
2. Mọi hiệu ứng trong spec phải render được **thật** (không fake bằng placeholder).
3. Có file `examples/demo.json` + script tự kiểm chứng bằng `ffprobe`.
