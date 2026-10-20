# vcut CLI — Command-line interface cho VCut Studio

Điều khiển trình dựng video VCut Studio từ terminal, không cần mở browser.
Dành cho AI agent (Claude Code, Codex...) và power user.

## Cài đặt

```bash
cd cli
npm install
npm run build
# Chạy: node dist/cli/src/index.js <lệnh>
# Hoặc link global: npm link
```

Yêu cầu: Node.js ≥ 20, FFmpeg trên PATH (cho render).

## Cách dùng

```
vcut <lệnh> [tùy chọn]
```

Mọi lệnh đều đọc/ghi file project JSON (video-spec). Dùng `--project` để chỉ định file.

### Tạo project

```bash
vcut create --name "My Video" --width 1920 --height 1080 --fps 30 --out proj.json
```

### Thêm clip

```bash
# Video
vcut add-clip --project proj.json --src clip.mp4 --start 0 --duration 5
# Audio
vcut add-clip --project proj.json --kind audio --src music.mp3 --start 0 --duration 30
# Ảnh
vcut add-clip --project proj.json --kind image --src photo.jpg --start 5 --duration 3
# Cắt đoạn nguồn khác
vcut add-clip --project proj.json --src clip.mp4 --start 0 --duration 5 --in 10 --out 15
```

### Thêm chữ

```bash
vcut add-text --project proj.json --text "Xin chào" --start 1 --duration 3 \
  --font-size 64 --color "#ffffff" --animation fadeUp --x 0.5 --y 0.3
```

Tùy chọn: `--font`, `--bg` (màu nền), `--bold`, `--italic`,
`--animation` (xem `vcut list-animations`).

### Transition

```bash
vcut apply-transition --project proj.json --clip <clip-id> --type fade \
  --duration 0.5 --side out
```

`--side`: `in` | `out` (mặc định) | `both`. Xem `vcut list-transitions`.

### Bộ lọc màu

```bash
vcut apply-filter --project proj.json --clip <clip-id> --lut vcut-warm-bloom
```

Xem `vcut list-luts`.

### Tốc độ phát

```bash
vcut set-speed --project proj.json --clip <clip-id> --speed 2
```

0.25–4. Duration tự cập nhật theo invariant `(out-in)/speed`.

### Auto-caption (local)

```bash
vcut caption --project proj.json --src video.mp4 --lang vi
```

Chạy faster-whisper local (không cloud), thêm track phụ đề vào project.
Cần model faster-whisper (tải lần đầu tự động).

### Text-to-speech (local)

```bash
vcut tts --project proj.json --text "Xin chào Việt Nam" --voice hai_dang --start 0
```

Tổng hợp giọng nói bằng VieNeu-TTS local, copy WAV vào `./media`,
thêm audio clip vào project. Xem `vcut list-voices`.

### Render

```bash
vcut render --project proj.json --preset 1080p --output out.mp4 --media-dir ./media -y
```

Preset: `720p`, `1080p`, `4k`, `tiktok` (9:16), `youtube`, `ig-square`.
Validate tự động trước khi render — project sai sẽ bị từ chối.

### Kiểm tra & xem thông tin

```bash
vcut validate --project proj.json   # kiểm tra hợp lệ
vcut info --project proj.json        # tóm tắt project
```

## Ví dụ end-to-end

```bash
# 1. Tạo project
vcut create --name "Demo" --out demo.json

# 2. Thêm video + chữ
vcut add-clip --project demo.json --src intro.mp4 --start 0 --duration 5
vcut add-text --project demo.json --text "Chào mừng" --start 0.5 --duration 2 --animation fadeUp

# 3. Hiệu ứng
CLIP=$(vcut add-clip --project demo.json --src main.mp4 --start 5 --duration 10 | python3 -c "import json,sys; print(json.load(sys.stdin)['clip_id'])")
vcut apply-transition --project demo.json --clip $CLIP --type fade --duration 0.5
vcut apply-filter --project demo.json --clip $CLIP --lut vcut-cinematic

# 4. Caption + TTS
vcut caption --project demo.json --src main.mp4 --lang vi
vcut tts --project demo.json --text "Cảm ơn đã xem" --start 14

# 5. Render
vcut render --project demo.json --preset tiktok --output demo-tiktok.mp4 -y
```

## Liệt kê tùy chọn

```bash
vcut list-transitions   # 28 loại transition
vcut list-luts          # 20 bộ lọc LUT
vcut list-animations    # 18 animation chữ
vcut list-voices        # giọng TTS (cần model)
```

## Trợ giúp

```bash
vcut help               # tất cả lệnh
vcut help render        # chi tiết từng lệnh
```

## Giới hạn

- `caption` cần model faster-whisper (~462MB, tải lần đầu).
- `tts` cần model VieNeu-TTS (~2.3GB, tải lần đầu).
- `render` cần FFmpeg trên PATH.
- Project file là JSON thuần — có thể version bằng git.
- Không có undo: mỗi lệnh ghi đè file project. Backup trước khi thử nghiệm.
