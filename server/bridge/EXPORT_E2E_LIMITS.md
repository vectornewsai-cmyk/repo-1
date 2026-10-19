# EXPORT_E2E_LIMITS.md — Giới hạn trung thực của test E2E export (R1-044)

Script: `server/bridge/test-export-e2e.sh` — chạy bằng `bash test-export-e2e.sh [--port N] [--keep]`.

## Những gì test cover (đã kiểm chứng thật, 10/10 pass ngày 2026-10-19)

| # | Case | Kiểm chứng |
|---|------|-----------|
| 1 | Video đơn giản, preset 720p | MP4 h264 1280×720 ~3s, ffprobe + giải mã 10 frame OK |
| 2 | Video + text overlay, preset 1080p | MP4 h264 1920×1080 ~3s; **xem frame bằng mắt**: chữ "Xin chao E2E" hiện đúng |
| 3 | Video có audio (sourceAudioMode=inherit) | Audio AAC được giữ, `mean_volume: -24.1 dB` (tiếng thật, không phải track câm) |
| 4 | Spec sai định dạng | POST → 400 |
| 5 | Tên file nguy hiểm (`.hidden.mp4`, `evil$.mp4`) | POST → 400 (sanitizeFilename) |
| 6 | Hủy job (DELETE) | Trả về `ok:true` |

## Giới hạn (trung thực)

1. **Text chỉ kiểm tra "render không lỗi" + xem 1 frame bằng mắt** — không có pixel-assert tự động cho vị trí/màu chữ (textfx demo đã có pixel check riêng).
2. **Không test concurrent jobs** — các case chạy tuần tự (tránh flakiness); giới hạn MAX_CONCURRENT_JOBS chưa được kiểm chứng ở đây.
3. **Không test preset R1-042** (crf/x264Preset) — sibling agent đang làm song song; script dùng meta width/height/fps làm "preset".
4. **Không test job recover sau restart** — thuộc R1-041 (RenderJobService), ngoài phạm vi R1-044.
5. **Không test file lớn** — media test chỉ vài trăm KB; upload 2GB và timeout chưa được cover.
6. **Rate limit/disk guard được nới lỏng trong test** (`BRIDGE_RATE_GENERAL=1000`, `BRIDGE_MIN_DISK_FREE=50MB`) vì môi trường test chật — production dùng default nghiêm ngặt hơn.
7. **Traversal `../evil.mp4` không tới được handler** — busboy/multer đã chuẩn hóa thành `evil.mp4` trước (đã kiểm chứng bằng echo server). Đây là lớp phòng thủ thứ nhất; sanitizeFilename là lớp thứ hai cho các tên busboy không chuẩn hóa (file ẩn, ký tự lạ).
8. **Không test trên browser thật** — script dùng curl, không qua ExportPanel UI (nợ kiểm chứng chung của dự án).
9. **Không test QA report của bridge** (R1-043) một cách độc lập — chỉ kiểm tra job `done`; nội dung qaReport do sibling agent sở hữu.
10. **Phụ thuộc môi trường**: cần node/npm/curl/ffmpeg/ffprobe/python3 và font "Noto Sans" cho case text.

## Bug tìm được nhờ test này (đã báo/ghi nhận)

- **Race "Không đọc được file spec"**: bản bridge trung gian (đang được sibling agent refactor) rename job dir sau khi worker đã spawn → worker đọc path cũ. Bản cuối (id-first, không rename) đã hết lỗi.
- **`readSpecMeta is not defined`**: bản trung gian của `jobQueue.js` gọi QA trước khi hàm được thêm vào — hết lỗi ở bản cuối.
- Bridge trả **507 khi /tmp đầy** (tính năng đúng, không phải bug) — script set `BRIDGE_MIN_DISK_FREE=50MB` cho môi trường test.
