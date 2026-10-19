# Render worker (Phase 1B)

> ✅ **Đã implement xong** — `node src/render.js --spec <file.json> --out <video.mp4>`

## Hợp đồng

- **Vào**: file `video-spec` JSON (đúng schema `@repo-1/video-spec` v0.1.0)
- **Ra**: file MP4 (H.264 video + AAC audio), đúng `meta.width/height/fps`
- **Cách chạy**:
  ```bash
  # Tạo media mẫu (testsrc/sine — không tải file ngoài)
  bash examples/make_demo_media.sh
  # Render demo (2 clip + chữ fadeUp + transition fade + nhạc nền)
  node src/render.js --spec examples/demo.json --out demo.mp4 -y
  ```

## Những gì đã implement (tất cả đều render THẬT bằng FFmpeg)

| Tính năng | Cách làm |
|---|---|
| Cắt/ghép nhiều clip (`in`/`out`/`start`/`duration`) | `trim` + `setpts`, chuẩn hoá `scale`/`pad`/`fps`/`format`, đặt lên timeline bằng `setpts=PTS+S/TB` + `overlay=eof_action=pass` trên nền đen |
| Text overlay | `drawtext`: đúng nội dung, fontSize, màu, vị trí tương đối `x`/`y`, `enable=between(t,…)` đúng start/duration; `box` khi có `backgroundColor`; font resolve qua `fc-match` (hỗ trợ bold/italic) |
| Animation `fadeUp` | `alpha` + `y` là biểu thức theo `t`: hiện dần + trồi lên 30px trong 0.6s đầu |
| Animation `typewriter` | Sinh file ASS tạm (mỗi ký tự một dialogue) + filter `subtitles` (libass) — reveal từng ký tự thật |
| Transition `fade` | `xfade=transition=fade` giữa 2 clip kề nhau cùng track |
| Audio | `atrim`/`asetpts` → `aresample` 48kHz → `volume` → `afade` in/out → `adelay` tới vị trí timeline → `amix` → `apad` đủ tổng thời lượng; không có track audio thì tạo track câm (`anullsrc`) để luôn có audio stream |
| Output | H.264 (`libx264`, CRF 20, `yuv420p`) + AAC 128k, `+faststart`, đúng `meta.width/height/fps` |

## Ngữ nghĩa transition (quan trọng)

`transitionOut: { type: "fade", duration: T }` giữa 2 clip kề nhau A→B (cùng track,
B.start = A.start + A.duration): **T giây cuối của A crossfade với T giây đầu của B**
(`xfade`, offset = dA − T). Hệ quả: nội dung B bắt đầu sớm hơn T giây so với `start`
đã khai báo; tổng thời lượng output vẫn = `projectDuration` theo spec. Phần đuôi
timeline (nếu có) là nền đen — trong demo tạo hiệu ứng outro tự nhiên.

`xfade` chỉ mượt khi 2 đầu vào cùng độ phân giải/fps/format — worker tự chuẩn hoá
tất cả clip trước khi nối nên luôn đảm bảo điều này.

## Validate

`src/validate.js` (mirror của `packages/video-spec`) kiểm tra trước khi render:
cấu trúc từng field, clip cùng track không chồng lấn, transition phải có clip kề sau,
`duration ≤ out − in`, file media tồn tại + đúng loại stream + `out` không vượt quá
độ dài file (qua `ffprobe`). Spec sai → in danh sách lỗi chi tiết, thoát mã 1,
**không render bừa**.

## Giới hạn (trung thực)

- **Audio của video clip nguồn bị bỏ qua** — Phase 1 chỉ lấy tiếng từ track `"audio"`
  riêng (đã cảnh báo trong validator).
- **`opacity < 1` chưa hỗ trợ** — spec có field này nhưng worker báo lỗi rõ ràng thay vì
  render sai.
- **Ảnh tĩnh làm clip video chưa hỗ trợ** (báo lỗi rõ ràng).
- Transition chỉ có `"fade"` (đúng schema Phase 1); `transitionIn` đặt ở clip đầu track
  được bỏ qua kèm cảnh báo.
- Chưa tối ưu seek (`trim` decode từ đầu file — đủ nhanh cho Phase 1).
