# MCP Tools — VCut Studio

Tài liệu đầy đủ các tools mà AI agent (Claude Code, Codex...) dùng để điều khiển VCut Studio qua MCP.

**Tổng: 29 tools** (6 gốc + 23 mới trong Batch I).

## Nhóm 1: Project cơ bản (6 tools gốc)

| Tool | Mô tả |
|------|-------|
| `create_project` | Tạo project mới. Args: `name`, `width`, `height`, `fps`, `media_dir?` |
| `add_clip` | Thêm clip bất kỳ (video/audio/text/sticker/image). Args: `project_id`, `track_kind`, `clip`, `track_id?`, `track_label?` |
| `add_text` | Shortcut thêm chữ. Args: `project_id`, `text`, `start`, `duration`, `style?`, `track_id?` |
| `apply_transition` | Gắn transition vào đầu/cuối clip video. Args: `project_id`, `clip_id`, `direction` ("in"\|"out"), `type`, `duration` |
| `get_project` | Lấy video-spec JSON hiện tại |
| `render_video` | Render MP4 thật bằng FFmpeg. Args: `project_id`, `out_path`, `media_dir?` |

## Nhóm 2: Thêm clip (3 tools mới)

| Tool | Mô tả |
|------|-------|
| `add_audio` | Thêm nhạc nền/giọng đọc. Hỗ trợ `volume` (0..2), `fadeIn`, `fadeOut`, `in`/`out` |
| `add_sticker` | Thêm sticker PNG. Hỗ trợ `x`, `y` (0..1), `scale`, `opacity`, `rotation` |
| `add_image` | Thêm ảnh tĩnh. Hỗ trợ `fit` ("contain"\|"cover") |

## Nhóm 3: Chỉnh sửa clip (6 tools mới)

| Tool | Mô tả |
|------|-------|
| `apply_filter` | Áp LUT màu cho clip video. `lut` là 1 trong 20 ID (10 cartcut-* + 10 vcut-*) |
| `apply_effect` | Thêm hiệu ứng video (blur, grayscale, sepia, vignette...). `intensity` 0..1 |
| `apply_text_animation` | Đổi animation chữ (18 kiểu: fadeUp, typewriter, bounce...) |
| `set_speed` | Chỉnh `speed` (0.25–4) và `reverse` cho clip video/audio |
| `set_volume` | Chỉnh `volume`/`fadeIn`/`fadeOut` cho audio; `mute_source` để tắt tiếng gốc của video |
| `add_keyframe` | Thêm keyframe (`x`, `y`, `opacity`, `scale`, `rotation`) với `easing` (linear/ease-in/ease-out) |

## Nhóm 4: Cắt/ghép (3 tools mới)

| Tool | Mô tả |
|------|-------|
| `trim_clip` | Chỉnh `in`/`out`/`start`/`duration` của clip |
| `split_clip` | Tách clip thành 2 tại thời điểm `at` (tính đúng in/out theo speed) |
| `delete_clip` | Xoá clip |

## Nhóm 5: Undo/Redo (2 tools mới)

| Tool | Mô tả |
|------|-------|
| `undo` | Hoàn tác 1 bước (tối đa 50 bước/project, in-memory) |
| `redo` | Làm lại 1 bước vừa undo |

## Nhóm 6: AI local (7 tools mới, 100% on-device)

| Tool | Mô tả | Script |
|------|-------|--------|
| `auto_caption` | Phụ đề tự động (faster-whisper, hỗ trợ tiếng Việt). Trả `segments[]` | `server/caption/caption.py` |
| `translate_captions` | Dịch audio sang phụ đề tiếng Anh | `server/caption/translate.py` |
| `text_to_speech` | TTS tiếng Việt (VieNeu-TTS, Apache 2.0). Lưu WAV vào media_dir | `server/tts/tts.py` |
| `remove_background` | Xoá nền video (rembg + BiRefNet, MIT). Trả file MOV có alpha | `server/bgremove/bgremove.py` |
| `auto_reframe` | Crop 16:9→9:16/1:1/4:5 theo chủ thể (OpenCV) | `server/reframe/reframe.py` |
| `remove_silence` | Phát hiện khoảng lặng (FFmpeg). Trả danh sách để agent quyết định cắt | `server/silence/silence.py` |
| `detect_scenes` | Phát hiện chuyển cảnh (FFmpeg). Trả `cuts[]` (giây) | `server/scene/scene.py` |

## Nhóm 7: Export (2 tools mới)

| Tool | Mô tả |
|------|-------|
| `export_video` | Render MP4 với preset: `720p`, `1080p`, `4k`, `tiktok` (9:16), `youtube`, `instagram` (1:1). Có thể ghi đè `crf` |
| `list_export_presets` | Liệt kê 6 preset với thông số chi tiết |

## Ví dụ workflow

```
# 1. Tạo project
create_project(name="My Video", width=1920, height=1080, fps=30)
→ { project_id: "proj_abc123" }

# 2. Thêm video + nhạc nền
add_clip(project_id, track_kind="video", clip={kind:"video", id:"v1", src:"clip.mp4", start:0, duration:10, in:0, out:10})
add_audio(project_id, src="music.mp3", start=0, duration=10, volume=0.3, fadeOut=2)

# 3. Thêm chữ với animation
add_text(project_id, text="Xin chào!", start=1, duration=3)
apply_text_animation(project_id, clip_id="tx_xxx", animation="typewriter")

# 4. Hiệu ứng + tốc độ
apply_filter(project_id, clip_id="v1", lut="cartcut-teal-orange")
set_speed(project_id, clip_id="v1", speed=1.25)

# 5. AI: tạo phụ đề tự động
auto_caption(project_id, src="clip.mp4", lang="vi")
→ { segments: [{start:0, end:2.5, text:"Xin chào các bạn"}, ...] }
# (agent tự thêm từng segment bằng add_text, hoặc dùng track)

# 6. TTS cho phần mở đầu
text_to_speech(project_id, text="Chào mừng đến với kênh của tôi", voice="...", out_name="intro.wav")
add_audio(project_id, src="intro.wav", start=0, duration=5)

# 7. Export TikTok
export_video(project_id, out_path="final_tiktok.mp4", preset="tiktok")
→ { mp4_path: ".../renders/final_tiktok.mp4", ffprobe: {...} }
```

## Bảo mật

- **Không shell tuỳ ý**: tool duy nhất chạm shell là `render_video`/`export_video` (chỉ gọi render worker với argv cố định) và 7 AI tools (chỉ gọi đúng Python script với argv cố định).
- **Không path traversal**: mọi `src`/`out_path`/`out_name` đều validate — cấm `..`, đường dẫn tuyệt đối, ký tự đặc biệt.
- **Validate chặt**: mọi spec đều qua `validateVideoSpec()` trước khi lưu; input sai trả lỗi tiếng Việt rõ ràng để agent tự sửa.

## Giới hạn

- Undo/redo là in-memory (mất khi restart server), tối đa 50 bước/project.
- AI tools cần model đã tải (faster-whisper 462MB, VieNeu-TTS ~2.3GB, BiRefNet ~973MB) — lần đầu chạy sẽ tải.
- `remove_background` với BiRefNet cần RAM lớn; máy yếu dùng session `u2net` (qua CLI trực tiếp, chưa expose qua MCP).
