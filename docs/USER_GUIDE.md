# Hướng dẫn sử dụng VCut Studio

> VCut Studio là trình dựng video chạy trên web, lấy cảm hứng UX từ CapCut nhưng
> là sản phẩm gốc 100% (không dùng trademark của ByteDance). Mọi tính năng AI
> (phụ đề, đọc thành tiếng, xoá nền...) đều **chạy local trên máy bạn** — không
> gửi dữ liệu lên cloud.

## Mục lục

1. [Cài đặt & chạy](#1-cài-đặt--chạy)
2. [Tổng quan giao diện](#2-tổng-quan-giao-diện)
3. [Nhập media](#3-nhập-media)
4. [Timeline cơ bản](#4-timeline-cơ-bản)
5. [Chữ & tiêu đề](#5-chữ--tiêu-đề)
6. [Chuyển cảnh (transition)](#6-chuyển-cảnh-transition)
7. [Màu sắc & bộ lọc](#7-màu-sắc--bộ-lọc)
8. [Hiệu ứng video](#8-hiệu-ứng-video)
9. [Âm thanh](#9-âm-thanh)
10. [Sticker](#10-sticker)
11. [Keyframe](#11-keyframe)
12. [Tốc độ & đảo ngược](#12-tốc-độ--đảo-ngược)
13. [Xoá phông xanh (chroma key)](#13-xoá-phông-xanh-chroma-key)
14. [AI: phụ đề tự động](#14-ai-phụ-đề-tự-động)
15. [AI: đọc thành tiếng (TTS)](#15-ai-đọc-thành-tiếng-tts)
16. [AI: xoá nền video](#16-ai-xoá-nền-video)
17. [AI: auto-reframe 9:16](#17-ai-auto-reframe-916)
18. [AI: cắt khoảng lặng & tách cảnh](#18-ai-cắt-khoảng-lặng--tách-cảnh)
19. [Xuất video](#19-xuất-video)
20. [Quản lý dự án](#20-quản-lý-dự-án)
21. [Phím tắt](#21-phím-tắt)
22. [Chuyển ngôn ngữ giao diện](#22-chuyển-ngôn-ngữ-giao-diện)
23. [Giới hạn đã biết](#23-giới-hạn-đã-biết)

---

## 1. Cài đặt & chạy

Yêu cầu: **Node.js ≥ 18**, **Python ≥ 3.10**, **FFmpeg** (đã có sẵn `ffmpeg` trong PATH).

```bash
# 1. Editor web
cd apps/web
npm install
npm run dev          # mở http://127.0.0.1:5173

# 2. Bridge server (để render MP4 thật + gọi các tính năng AI)
cd server/bridge
npm install
node src/index.js    # chạy ở cổng 8787
```

Lần đầu dùng tính năng AI, tải model một lần (chạy trên máy bạn, không cloud):

```bash
# Phụ đề (faster-whisper small, ~462MB) — tự tải khi chạy lần đầu
# TTS tiếng Việt (VieNeu-TTS, ~2.3GB)
cd server/tts && python3 fetch_model.py
# Xoá nền (BiRefNet, ~973MB)
cd server/bgremove && bash download_model.sh
# Sticker / font / LUT / sound bổ sung
bash assets/stickers/fetch_stickers.sh
bash assets/fonts/fetch_fonts.sh
bash assets/filters/fetch_harvested_luts.sh
bash assets/sounds/fetch_sounds.sh
```

## 2. Tổng quan giao diện

| Khu vực | Chức năng |
|---|---|
| Thanh trên (TopBar) | Tên dự án, phát/tạm dừng, hoàn tác/làm lại, thêm chữ, tách clip, phụ đề, cắt lặng, xoá, xuất bản |
| Thư viện (trái) | Nhập file video/audio/ảnh, kéo-thả vào timeline |
| Xem trước (giữa) | Preview video, hiển thị đúng thứ tự pipeline render |
| Inspector (phải) | Thuộc tính clip đang chọn: chữ, màu, hiệu ứng, âm thanh... |
| Timeline (dưới) | Các track video/audio/text/sticker/image, kéo-cắt-nối clip |

## 3. Nhập media

- Bấm **＋ Nhập** trong Thư viện, chọn nhiều file video/audio/ảnh cùng lúc.
- Hoặc **kéo-thả** thẻ media vào track timeline.
- Bấm **＋ Thêm** trên thẻ media để chèn tại vị trí playhead.
- Nút **↺ Dự án mẫu** tải lại project demo.

> Nếu mở project mà thiếu file gốc, panel **Relink** hiện ra để bạn chọn lại file.

## 4. Timeline cơ bản

- **Di chuyển playhead**: bấm vào thước timeline.
- **Chọn clip**: bấm vào clip. **Shift+click / Ctrl+click**: chọn nhiều. **Kéo khung** (box select): chọn vùng. **Ctrl+A**: chọn tất cả.
- **Kéo clip**: di chuyển ngang trên track.
- **Trim**: kéo mép trái/phải của clip để cắt ngắn/dài.
- **Tách clip**: đặt playhead rồi bấm **✂ Tách** (hoặc phím **S**).
- **Xoá**: chọn clip rồi bấm **🗑 Xoá** (hoặc **Delete**).
- **Ripple** (nút 🧲): khi bật, xoá/trim clip sẽ tự dồn các clip phía sau lấp khoảng trống.
- **Hoàn tác/làm lại**: **Ctrl+Z** / **Ctrl+Shift+Z** (tối đa 100 bước).
- **Track controls**: mỗi track có 3 nút — 🔇 tắt tiếng, 🔒 khoá (không cho sửa), 👁 ẩn (không render).

## 5. Chữ & tiêu đề

1. Bấm **＋ Chữ** trên TopBar (thêm tại playhead) hoặc thêm text clip trên track text.
2. Trong Inspector: sửa nội dung, font (43 font hỗ trợ tiếng Việt đầy đủ dấu), cỡ, màu, vị trí, in đậm/nghiêng.
3. **Animation**: 18 kiểu (fade, slide, pop, typewriter, wave...) — chạy thật khi render.
4. **Text preset**: 56 mẫu CSS dựng sẵn (hiệu ứng karaoke, lửa, vàng gold, neon...).

## 6. Chuyển cảnh (transition)

Chọn điểm nối giữa 2 clip video → chọn trong **58 loại transition** (fade, wipe, slide, circle, dissolve...), chỉnh thời lượng 0.1–2s. Render bằng FFmpeg `xfade` thật.

## 7. Màu sắc & bộ lọc

- **104 LUT** (.cube): cinematic, vintage, B&W, film looks (Kodak Portra...), neon...
- **7 thanh trượt chỉnh tay**: brightness, contrast, saturation, temperature, tint, highlights, shadows.
- Thứ tự áp dụng: chỉnh màu → LUT → hiệu ứng (khớp giữa preview và render).

## 8. Hiệu ứng video

7 hiệu ứng: blur, sharpen, grayscale, sepia, vignette, noise, brightness — chỉnh được cường độ 0–100%.

## 9. Âm thanh

- **Waveform** hiển thị trên clip audio.
- Mỗi clip audio/video: âm lượng, fade in/out.
- **Hiệu ứng âm thanh**: bass/treble ±12dB, giảm ồn (noise reduction), compressor, reverb (vang).
- **Chế độ audio gốc của video**: giữ nguyên / tắt tiếng.
- **Kho SFX**: 948 hiệu ứng âm thanh CC0 (UI, whoosh, impact...) — chạy `assets/sounds/fetch_sounds.sh` để tải.

## 10. Sticker

203 sticker (emoji Twemoji + Noto Emoji, nhãn tiếng Việt, phân loại): chèn vào track sticker, kéo-thả di chuyển, chỉnh tỉ lệ/xoay/độ mờ.

## 11. Keyframe

Chọn clip → panel keyframe: đặt keyframe cho **vị trí (x/y)** và **độ mờ (opacity)** theo thời gian, chỉnh easing. Preview nội suy mượt.

> Giới hạn trung thực: keyframe scale/rotation lưu được trong spec nhưng render chưa áp dụng.

## 12. Tốc độ & đảo ngược

Mỗi clip video/audio: tốc độ **0.25x–4x**, bật **reverse** để phát ngược. Công thức timeline thống nhất: `độ dài timeline = (out - in) / speed`.

## 13. Xoá phông xanh (chroma key)

Chọn clip video → panel chroma: chọn màu phông (mặc định xanh lá `#00FF00`), chỉnh similarity/blend. Kênh alpha được giữ suốt pipeline render.

## 14. AI: phụ đề tự động

1. Bấm **💬 Phụ đề** trên TopBar.
2. Chọn file video/audio + ngôn ngữ (mặc định tiếng Việt).
3. Đợi faster-whisper chạy local → xem lại danh sách câu (bỏ câu sai) → **Áp dụng** tạo track phụ đề (1 bước undo).
4. **Dịch sang tiếng Anh**: bật tuỳ chọn "Dịch sang" trong cùng cửa sổ — tạo thêm track phụ đề EN giữ nguyên timing.

## 15. AI: đọc thành tiếng (TTS)

Chọn text clip → bấm **🔊 Đọc thành tiếng** → chọn 1 trong 25 giọng Việt → tạo audio clip. Chạy bằng VieNeu-TTS local, watermark đã tắt.

## 16. AI: xoá nền video

Chọn clip video → **🤖 Xoá nền AI** → đợi rembg + BiRefNet xử lý từng frame → nhận video có kênh alpha (MOV), composite lên nền khác trong timeline.

> Máy RAM 8GB: BiRefNet có thể hết RAM — dùng session `u2net` nhẹ hơn trong tuỳ chọn.

## 17. AI: auto-reframe 9:16

Trong panel Xuất video: chọn video trong kho → **🔍 Auto-reframe** → chọn tỉ lệ 9:16/1:1/4:5 → nhận bản crop tự bám theo chủ thể (phát hiện mặt + chuyển động, làm mượt trajectory).

## 18. AI: cắt khoảng lặng & tách cảnh

- **🔇 Cắt lặng** (TopBar): phát hiện đoạn im lặng bằng FFmpeg → xem preview danh sách → áp dụng (cắt + dồn gap, 1 bước undo).
- **🔍 Tách cảnh** (Inspector, khi chọn video): phát hiện chuyển cảnh → chọn điểm cắt → tách clip thành nhiều clip con (1 bước undo).

## 19. Xuất video

Bấm **⬇ Xuất bản** → panel xuất video:

- **Preset**: 720p, 1080p, 4K, TikTok (1080×1920), YouTube (1080p CRF18), Instagram (1080×1080), tuỳ chỉnh.
- Hiện **ước tính dung lượng** trước khi render.
- **Tiến trình + ETA** thời gian thực khi render.
- **Hàng đợi render**: nhiều job xếp hàng FIFO, huỷ được.
- Sau render: tự kiểm tra file MP4 hợp lệ mới cho tải về.

> Xuất video-spec JSON: để chia sẻ project cho AI agent hoặc lưu bản text.

## 20. Quản lý dự án

- **Tự động lưu** mỗi 5s (localStorage) — tải lại trang không mất việc.
- **Ctrl+S**: lưu file `.vcut.json` ra máy.
- **Archive**: xuất/nhập `.vcut.zip` (kèm media + manifest SHA-256) để chuyển máy.
- **Migration**: project cũ (spec v0.1.0) tự nâng lên v0.2.0 khi mở.

## 21. Phím tắt

| Phím | Chức năng |
|---|---|
| Space | Phát / tạm dừng |
| S | Tách clip tại playhead |
| Delete / Backspace | Xoá clip đang chọn |
| Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) | Hoàn tác / làm lại |
| Ctrl+S | Lưu project |
| Ctrl+A | Chọn tất cả clip |
| Esc | Đóng cửa sổ đang mở |

## 22. Chuyển ngôn ngữ giao diện

Bấm nút **🇻🇳/🇺🇸** trên TopBar để chuyển giữa tiếng Việt và tiếng Anh (lưu lựa chọn vào máy). Hiện đã dịch thanh công cụ, thư viện media và màn hình chờ; các panel chuyên sâu đang dịch dần.

## 23. Giới hạn đã biết

Trung thực với người dùng — những điểm chưa bằng CapCut:

- Kho nội dung (template trending, nhạc bản quyền) còn ít — đang nhập kho dần.
- Chưa có app mobile, chưa có cloud sync / mạng xã hội.
- Keyframe scale/rotation chưa render.
- Preview phát ngược hiển thị xuôi (render vẫn đúng).
- Xoá nền AI chậm trên CPU (khuyên dùng GPU hoặc `u2net`).

Chi tiết từng tính năng xem các file `*_LIMITS.md` trong repo.
