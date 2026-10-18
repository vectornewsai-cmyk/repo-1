# Kiến trúc kỹ thuật

Tài liệu này mô tả thiết kế hệ thống. Mọi quyết định quan trọng đều ghi lý do ở đây để sau này không phải đoán.

## 1. Tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                        apps/web (React)                      │
│  UI editor: preview canvas, timeline đa track, toolbar,      │
│  media bin, text tool, export panel                          │
└──────────────┬──────────────────────────────┬───────────────┘
               │ video-spec JSON              │ REST (Phase 4)
               ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   server/render (Node)   │    │   mcp-server (Phase 4)   │
│   video-spec → FFmpeg →  │    │   MCP tools cho AI agent │
│   MP4 (H.264/AAC)        │    │   (Claude Code, Codex…)  │
└──────────────────────────┘    └──────────────────────────┘
               ▲
               │ local AI (Phase 2)
┌──────────────┴──────────────┐
│ whisper (caption)           │
│ rmbg/birefnet (xoá nền)     │
│ piper TTS (lồng tiếng)      │
└─────────────────────────────┘
```

## 2. Công nghệ

| Thành phần      | Lựa chọn              | Lý do                                                        |
|----------------|-----------------------|--------------------------------------------------------------|
| Editor web     | React + TypeScript + Vite | Hệ sinh thái lớn, build nhanh, dễ tuyển người sau này   |
| State          | Zustand               | Nhẹ, đủ cho project model phức tạp, không boilerplate        |
| Preview        | HTML Canvas 2D (Phase 1) → WebGL (sau) | Canvas 2D đủ cho MVP; WebGL khi cần filter/effect nặng |
| Render export  | FFmpeg (server-side)  | Chuẩn công nghiệp, đã kiểm chứng: ffmpeg 8.1.2 sẵn sàng      |
| Local AI       | Python: faster-whisper, rembg, Piper TTS | Chạy local, không phụ thuộc cloud               |
| Agent layer    | MCP (TypeScript SDK) + REST + CLI | Chuẩn mở để mọi AI agent đều dùng được           |
| Monorepo       | npm workspaces         | Đơn giản, đủ dùng cho quy mô hiện tại                        |

## 3. Mô hình dữ liệu (dùng chung qua `packages/video-spec`)

Mọi thứ trong editor đều biểu diễn được bằng **video-spec JSON** — đây là "ngôn ngữ chung" giữa UI, render worker và AI agent:

```jsonc
{
  "version": "0.1.0",
  "meta": { "name": "demo", "width": 1920, "height": 1080, "fps": 30 },
  "tracks": [
    {
      "id": "v1", "kind": "video",
      "clips": [
        { "id": "c1", "src": "intro.mp4", "start": 0, "duration": 5,
          "in": 0, "out": 5, "transitionOut": { "type": "fade", "duration": 0.5 } }
      ]
    },
    {
      "id": "t1", "kind": "text",
      "clips": [
        { "id": "tx1", "text": "Xin chào!", "start": 1, "duration": 3,
          "style": { "fontSize": 64, "color": "#ffffff", "fontFamily": "Inter",
                     "animation": "fadeUp" } }
      ]
    }
  ]
}
```

Định nghĩa TypeScript đầy đủ xem `packages/video-spec/src/index.ts` (đây là source of truth — render worker và UI đều phải tuân theo).

## 4. Render pipeline (server/render)

```
video-spec JSON → validate (zod, theo schema) → build filter_complex FFmpeg
→ chạy ffmpeg → MP4 H.264 + AAC → trả file
```

Nguyên tắc: **mọi hiệu ứng trong spec đều phải render được thật**. Hiệu ứng nào FFmpeg chưa làm được thì không đưa vào spec — không fake.

## 5. Preview trong editor (apps/web)

Phase 1: vẽ từng frame lên Canvas 2D theo playhead (đủ cho cắt/ghép/text/transition cơ bản).
Về sau: chuyển sang WebGL khi thêm filter nặng.

Preview và export **phải khớp nhau** — đây là yêu cầu bắt buộc, kiểm chứng bằng test so sánh frame.

## 6. Lớp AI agent (Phase 4, thiết kế trước để không phải đập đi làm lại)

- **MCP server**: tools như `create_project`, `add_clip`, `add_text`, `apply_transition`, `render_video`. Agent gọi tool → server thao tác trên video-spec → render.
- **Video-spec là hợp đồng**: agent không cần biết UI, chỉ cần sinh JSON đúng schema.
- Không bao giờ để agent chạy shell/ffmpeg trực tiếp — mọi thứ qua API có validate.

## 7. Những gì KHÔNG làm (giữ trung thực về phạm vi)

- Không clone y hệt giao diện CapCut (tránh kiện tụng) — layout tương tự (preview trên, timeline dưới) nhưng visual design gốc.
- Không hứa tính năng cloud-AI của CapCut trong ngắn hạn — thay bằng bản local từng bước (Phase 2).
- Không fake demo: mọi thứ commit vào `main` đều phải build được và chạy được.
