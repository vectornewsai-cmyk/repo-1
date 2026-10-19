# MCP server cho AI agent

> ✅ **Đã implement và kiểm chứng end-to-end** (demo `npm run demo` PASS 28/28 kiểm tra:
> agent mô phỏng tạo project 10s → render MP4 thật 1280x720@30fps, h264+aac).

MCP server (giao thức **stdio**) để AI agent — Claude Code, Codex, ... — điều khiển
trình dựng video repo-1 bằng code: tạo project → thêm clip/chữ/transition → render MP4.

**Nguyên tắc an toàn:** agent chỉ thao tác trên video-spec JSON đã validate.
Tool duy nhất chạm tới shell là `render_video`, và nó chỉ được gọi đúng render worker
(`server/render/src/render.js`) với argv cố định — không shell tuỳ ý, chặn path traversal
ở mọi đường dẫn vào/ra.

## Cài đặt & chạy

```bash
cd mcp-server
npm install
npm run build     # biên dịch TypeScript → dist/
npm start         # chạy server (stdio)
npm run demo      # mô phỏng 1 AI agent tạo + render video thật, tự kiểm chứng bằng ffprobe
```

Yêu cầu: Node >= 20, `ffmpeg` + `ffprobe` trên PATH.

## Kết nối từ Claude Code

Thêm vào file config MCP của Claude Code (`~/.claude.json` hoặc project `.mcp.json`):

```json
{
  "mcpServers": {
    "repo-1-video": {
      "command": "node",
      "args": ["/đường/dẫn/tuyệt/đối/tới/repo-1/mcp-server/dist/mcp-server/src/index.js"]
    }
  }
}
```

Codex / các client MCP khác: trỏ tới cùng file `dist/mcp-server/src/index.js` với stdio transport.

## Danh sách tools

| Tool | Mô tả |
|------|-------|
| `create_project(name, width, height, fps, media_dir?)` | Tạo project mới, trả về `project_id`. Project lưu tại `mcp-server/projects/<id>.json` |
| `add_clip(project_id, track_kind, clip, track_id?, track_label?)` | Thêm clip video/audio/text vào track (tự tạo track nếu chưa có). `clip.kind` phải khớp `track_kind` |
| `add_text(project_id, text, start, duration, style?, track_id?)` | Shortcut thêm chữ (mặc định: trắng, cỡ 64, giữa khung, animation fadeUp) |
| `apply_transition(project_id, clip_id, direction, type, duration)` | Gắn transition (`fade`) vào đầu (`in`) / cuối (`out`) clip video |
| `get_project(project_id)` | Lấy video-spec JSON hiện tại + tổng thời lượng |
| `render_video(project_id, out_path, media_dir?)` | Validate spec → render MP4 thật bằng FFmpeg → trả về đường dẫn + thông tin ffprobe. `out_path` là đường dẫn tương đối trong `mcp-server/renders/`, bắt buộc `.mp4` |

Mọi tool validate input chặt chẽ theo video-spec v0.1.0 — input sai trả lỗi rõ ràng
(`isError: true`) kèm hướng dẫn sửa, không bao giờ ghi spec hỏng.

## Cấu trúc

```
mcp-server/
├── src/
│   ├── index.ts      # MCP server + 6 tools (stdio)
│   ├── validate.ts   # Validate input/tools theo video-spec (không phụ thuộc zod ở runtime logic)
│   └── store.ts      # Lưu/đọc project JSON, resolve đường dẫn an toàn
├── examples/
│   └── agent-demo.js # Mô phỏng AI agent: gọi tools qua MCP thật → render → kiểm chứng ffprobe
├── projects/         # Project JSON của agent (không commit)
├── renders/          # MP4 output (không commit)
├── package.json
└── tsconfig.json
```

## Giới hạn hiện tại (trung thực)

- Transition mới chỉ có `fade` (giống render worker Phase 1) — thêm loại mới phải implement
  ở cả render worker trước, rồi mới khai báo tool ở đây.
- Chưa có tool xoá/sửa clip (`remove_clip`, `update_clip`) — agent hiện tại tạo project
  theo luồng "xây từ đầu tới cuối". Sẽ bổ sung khi editor UI cần.
- Chưa có REST API/CLI song song (theo roadmap, cùng hợp đồng video-spec).
- Render chạy đồng bộ trong tool call (timeout 10 phút) — chưa có hàng đợi job.
