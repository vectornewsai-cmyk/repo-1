# VCut Studio — Trình dựng video trên web

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-339933.svg)](https://nodejs.org)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-8.x-blue.svg)](https://ffmpeg.org)
[![AI local](https://img.shields.io/badge/AI-100%25%20local-orange.svg)](docs/USER_GUIDE.md)
[![MCP](https://img.shields.io/badge/MCP-29%20tools-purple.svg)](mcp-server/TOOLS.md)

> ⚠️ **Tên thương mại chính thức CHƯA chốt.** "VCut Studio" là tên làm việc nội bộ.
> Tên cuối cùng sẽ gốc 100% — tuyệt đối không dùng "CapCut" hay trademark của ByteDance.

Trình dựng video chạy trên web với UX lấy cảm hứng từ CapCut (học hỏi rồi viết lại
sạch từ đầu, không copy), nhưng có hai điểm **mạnh hơn CapCut gốc**:

1. **AI chạy local 100%** — phụ đề, dịch, đọc thành tiếng (TTS), xoá nền, auto-reframe,
   cắt khoảng lặng, tách cảnh: tự phát triển, chạy trên máy bạn, không cloud.
2. **Lớp tích hợp cho AI agent** — MCP server (29 tools) + REST/OpenAPI + CLI `vcut` +
   định dạng "video spec" JSON: để Claude Code, Codex... điều khiển trình dựng bằng code.

## Quickstart

```bash
# Yêu cầu: Node.js ≥ 20, Python ≥ 3.12, FFmpeg trong PATH

# Editor web → http://127.0.0.1:5173
cd apps/web && npm install && npm run dev

# Bridge server (render MP4 thật + AI) → http://127.0.0.1:8787
cd server/bridge && npm install && node src/index.js

# App desktop Electron (Linux) → xem docs/DESKTOP.md
npm run dev:desktop    # dev: build web + chạy Electron (load Vite :5173)
npm run start:desktop  # production: electron . — load app://vcut/
```

Model AI tải một lần khi dùng lần đầu (local, không cloud): xem
[Hướng dẫn sử dụng](docs/USER_GUIDE.md#1-cài-đặt--chạy).

## Tính năng chính

| Nhóm | Nội dung |
|---|---|
| Timeline | Đa track, drag/trim/split/snap, multi-select, ripple, undo 100 bước, mute/lock/hide từng track |
| Chữ | 59 font Việt (67 file .ttf), 21 animation render thật (16 drawtext + 5 ASS: typewriter, tiltIn, skewIn, slideReveal, curtainIn), 96 text preset |
| Chuyển cảnh | 81 loại (58 FFmpeg xfade + 23 custom-expr) |
| Màu sắc | 174 LUT + 7 slider chỉnh tay |
| Hiệu ứng | 16 video FX, chroma key giữ alpha, keyframe x/y/opacity |
| Âm thanh | Waveform, EQ/noise/compressor/reverb, 1043 SFX CC0 |
| Sticker | 244 sticker (Twemoji CC-BY, Noto Emoji Apache-2.0) |
| AI local | Phụ đề faster-whisper, dịch vi→en, TTS 25 giọng Việt, xoá nền BiRefNet, auto-reframe 9:16, cắt lặng, tách cảnh |
| Xuất | 720p/1080p/4K/TikTok/YouTube/IG, hàng đợi, tiến trình + ETA thời gian thực |
| Agent API | MCP 29 tools, REST 23 endpoint (OpenAPI mô tả 17 operation trên 15 path), CLI `vcut` 15 lệnh |

Tài liệu đầy đủ: [USER_GUIDE.md](docs/USER_GUIDE.md) (tiếng Việt) ·
[DEVELOPER.md](docs/DEVELOPER.md) (English) · [ARCHITECTURE.md](ARCHITECTURE.md) ·
[ROADMAP.md](docs/ROADMAP.md) · [Tính năng & trạng thái](docs/FEATURE_STATUS.md)

## Cấu trúc repo

```
repo-1/
├── apps/web/              # Editor: React + TypeScript + Vite, dark theme, vi/en
├── apps/desktop/          # App Electron Linux (Phase 10: AppImage + .deb, xem docs/DESKTOP.md)
├── packages/video-spec/   # Định dạng "video spec" JSON — hợp đồng dùng chung (SPEC v0.2.0)
├── server/render/         # Render worker: video-spec → MP4 bằng FFmpeg (0 dependency)
├── server/bridge/         # Bridge HTTP 8787: hàng đợi render + endpoint AI + OpenAPI
├── server/{caption,tts,bgremove,reframe,silence,scene}/
│                          # Dịch vụ AI Python, 100% local
├── mcp-server/            # MCP server cho AI agent (stdio, 29 tools)
├── cli/                   # CLI `vcut` — dựng video từ terminal
├── assets/                # Kho tài nguyên + SOURCES.md (attribution 1:1)
└── docs/                  # Tài liệu
```

## Nguyên tắc bất di bất dịch

1. **Trung thực**: không code giả, không stub giả vờ chạy được. Chưa làm thì ghi `TODO`.
2. **Gốc 100%**: không copy code/asset/thiết kế đặc trưng của CapCut/ByteDance.
3. **Giấy phép sạch**: chỉ MIT / Apache-2.0 / CC0 / CC-BY / OFL. Nguồn ghi đầy đủ trong `assets/SOURCES.md`.
4. **Chất lượng > tốc độ**: tính năng phải chạy thật, kiểm chứng được mới tính là xong.
5. **Giao diện phải đẹp**: dark theme hiện đại, UX mượt.

## Giấy phép

MIT — xem [LICENSE](LICENSE). Mọi đóng góp đều là code gốc của dự án.
