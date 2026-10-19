# EXPORTPRESETS_LIMITS.md — Giới hạn trung thực của module export presets (R1-042 + R1-064)

File liên quan: `apps/web/src/lib/exportPresets.ts`, `apps/web/src/ExportPanel.tsx`.
Test: `bash apps/web/scripts/test-export-presets.sh` (55/55 pass).

## 1. Preset là lựa chọn ở THỜI ĐIỂM RENDER, không phải thuộc tính project
- UI clone spec, override `meta.width/height/fps` theo preset, gửi kèm quality params
  (crf/x264Preset/audioBitrateKbps) qua bridge → render.js. **Project gốc trong store không đổi.**
- Preset mạng xã hội (TikTok 9:16, YouTube, Instagram vuông) chỉ đổi độ phân giải/chất lượng
  nén — **không tự crop/reframe nội dung**. Video 16:9 xuất preset TikTok 9:16 vẫn render
  khung 1080×1920 nhưng nội dung nằm theo layout timeline cũ (không có auto-reframe,
  đó là việc của R1-07x Batch H).

## 2. Ước tính dung lượng là ƯỚC TÍNH — không chính xác
- Công thức: `bpppf = 0.1 × 2^((23 − crf) / 6)`, `videoKbps = w×h×fps×bpppf/1000`,
  cộng audio bitrate, nhân overhead container 2%.
- 0.1 bpppf ở CRF 23 là mức điển hình cho video quay thường (live action).
- **Video tĩnh (slide, màn hình)** có thể nhỏ hơn ước tính 2–5 lần.
- **Video nhiễu/phức tạp** (mưa, cỏ cây đung đưa, pháo hoa) có thể lớn hơn 2–3 lần.
- `x264Preset` không được tính vào ước tính — nó ảnh hưởng tốc độ encode và chất lượng
  ở cùng CRF, không đổi dung lượng nhiều.
- Số track/clip/effect (LUT, chroma…) không được tính: ước tính chỉ dựa trên độ phân giải,
  fps, crf, audio bitrate và thời lượng.
- UI ghi rõ "(ước tính)" và label có câu "file thật có thể chênh lệch".

## 3. Preset custom không có validate phía server
- `validateExportPreset()` dùng ở UI (disable nút Xuất) — bridge/render.js KHÔNG gọi lại
  validate này cho params preset (bridge có whitelist riêng, xem R1-042).

## 4. Số lượng preset cố định trong code
- Thêm/sửa preset phải sửa `EXPORT_PRESETS` trong code và rebuild — chưa có preset do user
  tự lưu (không có "preset của tôi").

## 5. Chưa kiểm tra không gian đĩa
- Ước tính chỉ để user tham khảo, không block xuất khi ước tính lớn.

## 6. Chưa có click-test browser thật
- Hiển thị estimate trong ExportPanel chưa được click-test (nợ chung hạ tầng của dự án).
