# MCP server cho AI agent (Phase 4)

> ⏳ **Chưa implement** — thư mục giữ chỗ để kiến trúc không bị quên.
> Mọi AI agent (Claude Code, Codex...) sẽ điều khiển trình dựng qua đây.

## Thiết kế dự kiến (đã chốt trong ARCHITECTURE.md §6)

- MCP tools: `create_project`, `add_clip`, `add_text`, `apply_transition`,
  `set_audio`, `render_video`, `get_project_status`
- Agent chỉ sinh/gọi trên **video-spec JSON** — không bao giờ chạy shell/ffmpeg trực tiếp.
- Song song có REST API + CLI với cùng hợp đồng.

## Quy tắc khi implement (Phase 4)

1. Mọi tool phải validate input bằng schema của `@repo-1/video-spec`.
2. Mọi tool phải có test: agent gọi tool → video-spec hợp lệ → render ra MP4 thật.
3. Tài liệu ví dụ cho Claude Code / Codex trong `docs/`.
