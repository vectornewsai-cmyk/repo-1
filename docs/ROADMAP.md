# Lộ trình phát triển

> Nguyên tắc: mỗi phase kết thúc bằng thứ **chạy được thật và kiểm chứng được**. Không sang phase tiếp theo khi phase hiện tại còn dở dang.

## Phase 0 — Khởi tạo ✅ (đang thực hiện)
- Repo skeleton, README, kiến trúc, roadmap, LICENSE
- Định dạng video-spec v0.1.0 (TypeScript types)
- Cấu trúc monorepo npm workspaces
- **Tiêu chí xong:** `npm install` + `npm run build` chạy sạch ở mọi package

## Phase 1 — Editor core (hiện tại: 3 agent con đang làm song song)
- **1A. Editor UI** (`apps/web`): layout dark theme tiếng Việt; preview canvas; timeline đa track (thêm/xoá track, kéo clip, playhead, zoom); media bin (import video/audio/ảnh); cắt (trim in/out), tách (split), xoá clip; text overlay (thêm/sửa/di chuyển); panel export.
  - *Tiêu chí xong:* `npm run dev` mở được editor, thao tác timeline mượt, `npm run build` pass. Giao diện phải đẹp — đây là yêu cầu cứng.
- **1B. Render engine** (`server/render`): đọc video-spec JSON → render MP4 thật bằng FFmpeg (cắt/ghép clip, text overlay bằng drawtext, transition fade bằng xfade, mix audio).
  - *Tiêu chí xong:* render được 1 video-spec demo thành file MP4 thật, kiểm chứng bằng ffprobe (đúng độ phân giải, fps, có tiếng).
- **1C. Kho tài nguyên** (`assets/`): sưu tầm transition/effect/filter/LUT **chỉ** giấy phép MIT/Apache-2.0/CC0 từ GitHub, ghi attribution đầy đủ vào `assets/SOURCES.md`.
  - *Tiêu chí xong:* ≥10 tài nguyên chất lượng, mỗi cái có nguồn + giấy phép rõ ràng. Giấy phép mập mờ → loại, không tiếc.
- **Cửa qua Phase 2:** editor tạo được project → xuất ra video-spec → render thành MP4 xem được. Chuỗi end-to-end này phải chạy thật.

## Phase 2 — Local AI (thay "hộp đen" của CapCut)
- Auto-caption: faster-whisper chạy local (ưu tiên tiếng Việt + tiếng Anh)
- Xoá nền video: rembg/BiRefNet local
- Text-to-speech local (giọng Việt)
- Cắt khoảng lặng, auto-reframe 16:9 → 9:16
- *Tiêu chí xong:* mỗi tính năng chạy local được trên CPU (chậm cũng được), có GPU thì nhanh hơn. Không fake bằng API cloud.

## Phase 3 — Asset library gốc + nâng cao
- Transition/effect/filter/text-animation **tự thiết kế 100%** (không clone asset của CapCut)
- Keyframe animation, audio waveform, mixer cơ bản
- *Tiêu chí xong:* ≥20 transition gốc + 10 text animation gốc, preview và export khớp nhau

## Phase 4 — Agent integration layer ⭐ (điểm mạnh hơn CapCut)
- MCP server (TypeScript SDK): `create_project`, `add_clip`, `add_text`, `apply_transition`, `render_video`...
- REST API + CLI song song
- Tài liệu + ví dụ cho Claude Code / Codex
- *Tiêu chí xong:* một AI agent (không phải con người) tạo được video hoàn chỉnh chỉ bằng cách gọi tools

## Phase 5 — Polish & production
- Template dự án, tối ưu hiệu năng, responsive, i18n EN/VI đầy đủ
- Benchmark chất lượng render, test suite

## Những gì đã loại trừ (ghi rõ để không ai hứa hão)
- App mobile native (ngoài phạm vi hiện tại — tập trung web trước)
- Tính năng cloud-AI real-time như CapCut (thay bằng bản local ở Phase 2)
- Sao chép y hệt UI CapCut (lý do pháp lý — xem ARCHITECTURE.md §7)
