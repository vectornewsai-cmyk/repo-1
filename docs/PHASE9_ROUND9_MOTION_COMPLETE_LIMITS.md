# Phase 9 đợt 9 — Hoàn thiện motion: LIMITS tổng hợp (parent)

> Ngày: 2026-10-26, lượt cron 14:03. Chủ đề: đóng nợ đợt 8 của motion
> (đuôi đóng băng, ghost preview, UI thiếu weights/miMode, tổ hợp chưa đo,
> benchmark HD, E2E/click-test). KHÔNG push — batch chỉ stage, chờ user push
> từ main chat. Không tag/release.

## Đã làm (6 luồng, đều có test/render/số đo thật)

- **M1 — đuôi đóng băng:** `tpad=stop_mode=clone:stop=4` trước minterpolate +
  `trim` sau tmix. Nhánh thường 0.5x: đóng băng ở frame sai 6 → 0 frame,
  frame cuối sát frame nguồn thật (diff 1.305 so với 5.096 trước), giữa chuỗi
  không đổi (mid diff 1.344 cả trước/sau). Nhánh ramp: frozen_tail = 0.
- **M2 — preview ghost:** bóng theo frames/weights thật (alpha = 0.35 ×
  weights[i]/max), nối cả 4 đường vẽ video (thường, track, mask, mask+SR).
  Image/text clip không có field `motion` nên không có ghost — cần spec thêm
  field trước, không bịa.
- **M3 — UI:** slider weights từng frame (min 1%, chuẩn hoá tổng = 1), select
  miMode mci/blend, cảnh báo transition+targetFps, cảnh báo fps mismatch,
  ước lượng chi phí (chỉ là ước lượng khối lượng, KHÔNG phải thời gian render).
- **M4 — tổ hợp render:** stabilize+interp, stabilize+blur, mask-keyframes+
  interp/blur/ramp, ramp+motion+transition đều HỖ TRỢ (render thật). Bắt bug
  validator lọt cặp transition một phía → vá fail-fast mức cặp trong
  `validate.js`. Stabilize+ramp vẫn bị chặn (validator cũ, giữ nguyên).
- **M5 — benchmark:** footage tổng hợp (testsrc2 + khối đỏ chuyển động —
  KHÔNG phải quay thật). 720p interp 110.8s/4s (76× plain), 1080p 245.4s/4s
  (27.9×), 4K 216.2s/2s (31.5×); tmix gần miễn phí ở 1080p (1.02×);
  stabilize chỉ +15.5% trên interp ở 720p. Ngoại suy clip dài CHỈ LÀ NGOẠI
  SUY (30s 1080p ≈ 30.7 phút), và plain 30s đo thật lệch 2.12× so với dự đoán
  tuyến tính từ mẫu 4s — ngoại suy có thể lệch ~2×, dao động giữa 2 lần chạy
  ~18%.
- **M6 — E2E + click-test:** E2E 19/19 (preview-parity biên dịch code thật);
  click-test CDP headless 8/8 cho panel cơ bản (bật/tắt interp/blur, đổi
  frames). Chỉ sửa bug harness (lệch 38px do nút mới xuất hiện), không bug
  sản phẩm mới.

## Sửa của parent ở bước tích hợp (quan trọng, trung thực)

- **Cảnh báo stabilize của panel đợt 8/M3 là SAI:** panel từng ghi nội suy
  không dùng chung được với chống rung. Sự thật theo render: `validate.js`
  chỉ chặn stabilize + speedKeyframes; `motion.js` ghi CHO PHÉP stabilize +
  interpolation; M4 render thật chứng minh vidstab chạy trước minterpolate.
  Parent đã sửa panel: chỉ cảnh báo khi clip có cả stabilize và speedKeyframes,
  đổi text `motion.warnStabilize` (vi/en), ghi chú hàm
  `isStabilizeInterpConflict` (giữ lại vì test M3 + tương thích, không dùng để
  cảnh báo chặn nữa). Test logic motion.test.ts không đổi (18/18).

## Kiểm chứng gộp của parent (chạy lại độc lập)

- tsc 0 lỗi; vite build pass; i18n check PASS; motion UI 18/18;
  previewEngine 14/14 + script preview-engine 337; render thường 29/29;
  ramp 17/17; combos M4 42/42; E2E 19/19; K1 21/21; motion.js self-test OK.
- Không sửa xung đột sâu nào: các file chung (MOTION_LIMITS.md do M1+M4 nối
  tiếp, render.js chỉ M1, validate.js chỉ M4, preview.tsx chỉ M2) đã gộp sạch.

## Nợ còn lại (không claim ngược)

- 0.25x vẫn còn ~4 frame hội tụ về frame cuối thật (blend 3 frame) — đó là
  frame cuối thật, không phải frame sai; muốn hết hẳn phải bịa chuyển động nên
  cố tình không làm. Pad stop=4 chưa đo cho nguồn fps rất thấp + speed rất
  chậm.
- Weights = 0 trong project cũ vẫn fail validate render S2 (UI slider min 1%
  chỉ bảo vệ dữ liệu mới); chưa có "giữ tỉ lệ weights khi đổi frames".
- Click-test mới chỉ phủ panel cơ bản — chưa click-test control weights/miMode
  mới, chưa click-test cảnh báo stabilize+ramp mới sửa, chưa click-test ghost
  trên canvas thật (ghost chỉ có test logic thuần + tsc/build).
- Chưa đo: đuôi trên footage quay thật, 1080p/4K + clip dài thật, chất lượng
  artifact nội suy, tmix ở 4K, ramp+motion ở HD. Số M5 mỗi cấu hình chỉ chạy
  1 lần (trừ plain 30s chạy 2 lần), chỉ đúng máy đo (2 vCPU, 7.7 GiB, CPU-only).
- Preview trail ≠ tmix: frame hiện tại vẽ đủ alpha, tổng alpha bóng không
  chuẩn hoá về 1 — vệt preview sáng hơn render, chỉ để gợi chuyển động.
- Bóng mask/SR đặt theo transform hiện tại, không tính lại mask keyframes/
  placement theo thời gian của chính bóng đó — mask keyframes đổi nhanh thì
  bóng hơi lệch so với render.
