# EXPORT_PRESETS — Giới hạn trung thực (R1-042, Batch D)

## Đã làm gì
- `apps/web/src/lib/exportPresets.ts`: 4 preset (720p/1080p/4K/custom) với
  width/height/fps/crf/x264Preset/audioBitrateKbps + `validateExportPreset()`.
- `apps/web/src/ExportPanel.tsx`: dropdown chọn preset, form custom khi chọn
  "Tùy chỉnh", nút Xuất hiện resolution, disable khi preset sai.
- `server/bridge/src/index.js`: nhận field `preset` (optional), validate
  whitelist nghiêm ngặt → 400 nếu sai, truyền vào render.js qua argv cố định.
- `server/render/src/render.js`: thêm `--crf`, `--x264-preset`, `--audio-bitrate`
  (validate, fail fast exit 2). Mặc định: crf 20, medium, 128k (như cũ).

## Kiểm chứng
- `bash apps/web/scripts/test-export-presets.sh`: 33/33 pass.
- `node server/render/test_export_presets.js`: 22/22 pass —
  dry-run hiện đúng `-preset`/`-crf`/`-b:a` cho cả 3 preset;
  args sai → exit 2; render thật 720p/1080p → ffprobe đúng resolution.
- Bridge E2E thật: POST preset → job done, output 1280x720 h264+aac;
  preset sai → 400 với message rõ ràng.
- `npx tsc --noEmit` (apps/web): 0 lỗi.

## Giới hạn còn lại (trung thực)
1. **Preset chỉ đổi resolution/fps/quality lúc render** — project gốc không đổi.
   Muốn đổi vĩnh viễn thì sửa meta trong project.
2. **Không có 2-pass encoding** — chỉ CRF 1-pass. File cần bitrate chính xác
   (vd giới hạn nền tảng) thì chưa hỗ trợ.
3. **4K render chậm** — `slow` preset + 8.3MP/frame; máy yếu có thể mất hàng
   chục phút cho video dài. Không có ước lượng thời gian trước khi render.
4. **Không có HDR** — luôn SDR yuv420p, dù preset 4K.
5. **FPS override có thể gây judder** — nếu nguồn 24fps mà preset 30fps,
   render.js dùng `fps` filter (duplicate/drop frame), không có motion interpolation.
6. **Audio chỉ AAC** — không có Opus/MP3; bitrate tối đa 512k.
7. **Preset không lưu theo project** — mỗi lần mở ExportPanel lại về 1080p.
   (Có thể lưu vào localStorage ở task sau.)
8. **Job recover sau restart bridge** dùng default quality (preset gốc không
   được persist trong job record) — đã ghi chú trong code.
