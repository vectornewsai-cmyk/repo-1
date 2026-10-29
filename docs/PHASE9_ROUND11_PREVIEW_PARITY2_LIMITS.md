# Phase 9 đợt 11 — Preview–render parity vòng 2 (LIMITS tổng hợp)

Ngày: 2026-10-27, lượt cron vcut-build-loop 02:03 +07. Đợt lớn 6 luồng,
KHÔNG push, KHÔNG tag/release, KHÔNG binary vào batch. Đóng nợ mở của
đợt 10 (preview parity) + đợt 9 (motion complete). Chi tiết từng luồng
ở các file `docs/PHASE9_ROUND11_P{1..6}_*_LIMITS.md`.

## 1. Đã làm (mỗi mục đều có số đo thật, xem file luồng tương ứng)

- **P1 harness V11** (`server/render/src/test_v11_parity.js`): đối chiếu
  tự động transition + text, preview composite vs frame render FFmpeg
  thật. Kết quả: fade KHỚP, slideright KHỚP, slideReveal KHỚP,
  curtainIn KHỚP (MAD 0.40, cải thiện từ 0.81 nhờ clip theo hộp chữ
  của P4); wipeleft XẤP XỈ (lệch 1 cột biên); tiltIn/skewIn XẤP XỈ
  (MAD ~1, do rasterizer khác nhau, không phải sai công thức).
- **P2 pixelate**: đổi điểm lấy mẫu sang tâm khối (đúng cách FFmpeg
  `scale flags=neighbor` lấy mẫu) → MAD 26.75 → 0.667 trên mọi k
  (2/6/9/16), KHỚP. Kèm: shake sửa sang crop+pad đúng render
  (MAD 44.58 → 0.000), rgb-shift xác nhận KHỚP (MAD 0.000).
  Edgedetect vẫn khác cấu trúc (Sobel vs Canny), sharpen vẫn xấp xỉ,
  noise/glitch chỉ xấp xỉ về thống kê — không claim khớp.
- **P3 adjustment sync**: xác minh adjustment layer ĐÃ đi qua
  effectCanvas (không cần nối thêm); `PREVIEW_SKIPPED_EFFECTS` thành
  tập rỗng, nestedPreview không còn báo skip 8 type canvas. Viết script
  `gen-transitions-mirror.mjs`: mirror video-spec transitions.js
  59 → 82 type, khớp 100% với `.ts` (idempotent). Các mirror khác
  KHÔNG regenerate bừa (tập con viết tay theo thiết kế).
- **P4 text clip theo hộp chữ**: render ASS `\clip` quét theo hộp chữ
  thật (đo bằng PIL qua `measure_text.py`, hiệu chuẩn thực nghiệm
  LIBASS_SCALE 0.84 vì libass vẽ hẹp hơn PIL); preview mirror quét
  theo hộp canvas của chính nó. 4 animation (tiltIn, skewIn,
  slideReveal, curtainIn) vào TextAnimPicker + i18n (18 → 22 ô).
  Render thật 18/18, mirror 8/8, i18n 720/720.
- **P5 click-test**: CDP headless 10/12 PASS, 1 SKIP có lý do (nhánh
  dương cảnh báo stabilize+ramp không click tới được vì không có UI
  nào tạo được speedKeyframes), 1 FAIL là phát hiện sản phẩm thật:
  ghost motion blur không lộ pixel trên clip đục vì `preview.tsx` vẽ
  ghost TRƯỚC rồi frame hiện tại phủ kín bằng `drawImage` alpha 1.
  P5 KHÔNG sửa (cần quyết định ngữ nghĩa ghost ở đợt sau) — xem §3.
- **P6 HD + weights 0**: tmix 4K gần như miễn phí (chìm trong encode);
  ramp+motion 1080p đắt ~17× ramp-only (82.5s vs 4.8s, mẫu 2s);
  PSNR/SSIM nội suy: 720p mci thắng dup +4.8dB, 360p mci thua dup
  (nền chi tiết cao) — chất lượng nội suy phụ thuộc nội dung, không
  gom thành một câu. Tailfix chỉ tác dụng lên đuôi (bằng chứng thứ 2).
  Weights 0 / thiếu frames / blur {} ở project cũ được migrate ở cổng
  load render (`validate.js` + `normalizeLegacyMotion`); validate
  strict vẫn fail với input thô; project mới trả về nguyên vẹn.
  Test legacy 14/14, render thật clip cũ ra MP4 đúng 60 frame / 2s.

## 2. Kiểm chứng gộp của parent (chạy lại độc lập, không tin báo cáo mù)

- `tsc --noEmit` (apps/web): 0 lỗi. `vite build`: pass.
- effectCanvas.test 13/13, parity 9/9, nestedPreview 46/46,
  textAnimParity 8/8, preview-engine 354 assertions,
  motion legacy 14/14, text render 18/18, i18n 720/720 vi-only 0.
- Combos M4 chạy lại: **42/42** — fail 41/42 mà P6 ghi là ngưỡng đo
  nhạy (jitter vidstab), không phải hồi quy; P6 không đụng đường code
  của case đó (identity + chain byte-identical).
- Harness V11 chạy lại: bảng số khớp đúng báo cáo P1 (fade/slideright/
  slideReveal/curtainIn KHỚP, circleopen/dissolve/diamondclose/
  squareopen LỆCH), /tmp tự dọn (19% sau chạy).

## 3. Nợ mở / phát hiện chưa sửa — đọc trước khi claim

1. **Ghost motion blur vô hình trên clip đục (P5, phát hiện sản phẩm
   thật).** Sửa đúng cần quyết định ngữ nghĩa: vẽ frame hiện tại với
   alpha bằng weight của nó rồi composite bóng sau, hoặc blend bóng
   sau frame hiện tại. Đợt sau quyết định rồi sửa + đo lại bằng probe
   P7c (ngưỡng đã có sẵn trong harness P5).
2. **14 type custom-expr V3 chưa có hình học trong
   transitionPreview.ts** (fallback fade; harness V11 đo LỆCH MAD 85).
   Đợt sau thêm hình học V3 (các expr đều là chọn pixel A/B theo công
   thức đóng, map được như blinds/checker/diamond cũ) rồi chạy lại V11.
3. **circleopen FFmpeg không phải vòng tròn biên cứng** (gradient rộng,
   hoàn thành sớm ~P=0.8); preview mô hình biên cứng → LỆCH MAD 43.50.
   Cần đổi mô hình preview sang gradient + đường cong S, hoặc giữ nhãn
   "xấp xỉ" có chủ ý.
4. **dissolve LỆCH có cơ sở**: preview lưới hash 20×12 vs render nhiễu
   từng pixel — tỉ lệ B gần nhau (~50%) nhưng vị trí ô khác nhau.
5. **LIBASS_SCALE 0.84 là hiệu chuẩn thực nghiệm** (DejaVu/Liberation,
   ASCII + tiếng Việt); font display/kerning mạnh/emoji chưa đo.
   Hộp preview (canvas) và hộp render (PIL×0.84) khác nhau ~20% bề
   rộng — lệch đo canvas-vs-libass có từ trước, nay lộ rõ vì clip bám
   hộp. Mirror `.js` textfx vẫn ghi mô tả cũ "quét khung hình".
6. **Badge preview "xấp xỉ" cho 8 effect canvas đã lỗi thời** với
   pixelate/shake/rgb-shift/mirror (nay đã KHỚP trên nguồn video-like)
   — P2 không đụng `previewStatus.ts` theo phân luồng; đợt sau nâng
   badge + cập nhật test badge tương ứng.
7. **Web load path (`projectRepo.ts`) chưa gọi `migrateMotion`** khi mở
   file (chỉ ảnh hưởng hiển thị; cổng render đã cứu) — follow-up.
8. **Chưa đo**: footage quay thật, clip dài thật, HD/clip dài cho đuôi,
   toàn bộ đường cong thời gian (harness V11 chỉ đo frame giữa),
   pixelate trên nguồn nhiễu rgb24 (chuyển đổi không gian màu làm lệch,
   không phải lỗi lấy mẫu), shake lệch pha khi clip không bắt đầu ở 0
   (localT vs timeline — vấn đề chung mọi effect theo thời gian).
9. **Nhánh dương cảnh báo stabilize+ramp không click-test được** vì
   không có UI tạo speedKeyframes — cần speed-curve editor hoặc đường
   import project có sẵn speedKeyframes.
10. **Số đo chỉ đúng máy đo** (VM 2 CPU, CPU-only, FFmpeg 8.1.2, 1 lần
    chạy); ngoại suy clip dài từ mẫu 2s đã chứng minh lệch tới 2.12×
    nên không ngoại suy.

## 4. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round11-preview-parity2.txt`
  (NUL-delimited, chỉ file text; không binary, không dist, không
  `benchmarks/results/` — 2 file số đo P6
  `benchmarks/results/motion_p6.jsonl` /
  `motion_p6_quality.json` chỉ nằm trên đĩa, không đưa vào batch
  theo quy ước các đợt trước).
