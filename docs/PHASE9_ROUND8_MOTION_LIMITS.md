# Phase 9 đợt 8 (cron 08:03 26/10) — Slow-mo mượt / nội suy frame / motion blur — LIMITS tổng hợp của parent

> Chủ đề từ PHASE9_GAP_ANALYSIS.md gap E8 (chưa từng làm, grep trước đợt
> không có `minterpolate`/`tmix` trong code của repo). Chỉ dùng filter
> FFmpeg có sẵn — KHÔNG RIFE, KHÔNG model đóng, KHÔNG cloud.
> Mọi claim dưới đây đều có test/render/số đo đi kèm trong log vòng lặp.

## Ngữ nghĩa chuẩn đã chốt (áp dụng từ đợt này)

Shape chuẩn duy nhất: `packages/video-spec/src/motion.ts` (S1),
`VideoClip.motion?: ClipMotion`:
`interpolation?: "none" | "minterpolate"` (vắng = `"none"`),
`targetFps?: number` (1..120, bắt buộc khi `minterpolate` ở tầng spec),
`miMode?: "mci" | "blend"` (vắng = `"mci"`, `"dup"` đã loại),
`motionBlur?: { frames?: number; weights?: number[] }` (độc lập với
interpolation). Motion CHỈ cho clip video, validator fail-fast.

Vị trí chain render (cả hai nhánh đều đo thật, không đoán):
- Nhánh thường (S2): `... scale, pad, setsar=1, [fps | minterpolate,fps],
  [tmix], format, color, LUT, effects, enhPost, plugin, adj ...` —
  interpolation THAY filter `fps`, tmix ngay sau bước fps/minterpolate.
- Nhánh ramp (S3): minterpolate THAY bước fps từng đoạn + sau concat
  (vị trí "cuối postChain" trong brief đã đo là KHÔNG có tác dụng thật:
  frame-diff y hệt bản không motion + frame cuối đen — đã bỏ);
  tmix sau minterpolate khi chỉ có blur thì ở cuối postChain như cũ.
- Ramp + motion: `minterpolate=fps=<projectFps>` (cùng fps, KHÔNG tăng
  số frame); `targetFps` phải bằng project fps hoặc vắng, khác thì
  fail-fast. Ramp không đoạn nào speed < 1 vẫn chạy, hiệu quả ~0.

## Đã chứng minh thật (kiểm chứng gộp của parent, chạy lại toàn bộ)

- tsc apps/web: 0 lỗi; vite build pass; i18n check R6 PASS (vi=en=671,
  motion 20 key mới).
- Spec: motion.test 19/19 (S1). UI logic: motion.test 10/10 (S5).
- Preview: previewEngine.test 8/8, nestedPreview 44/44 (S4).
- Render thường: test_motion_render 22/22 (S2) — 15fps + speed 0.5 +
  nội suy 30fps = đúng 120 frame / 4s (sau vá đuôi); tmix giảm năng
  lượng biên 5.531 → 5.044 (0.912); alpha yuva420p giữ được (RGBA).
- Render ramp: test_motion_ramp 17/17 (S3) — ramp 2s @20fps = 40 frame
  cả ba bản; nội suy giảm max frame-diff 4.551 → 3.705, std 1.092 →
  0.732; blur giảm độ sắc nét 9.394 → 7.711 (~18%).
- E2E: test_motion_e2e 11/11 sau khi parent sửa kỳ vọng lỗi thời (S6)
  — CLI thuần minterpolate 57 frame, qua builder 60 frame (nhờ fps
  lấp đuôi); bench 640x360: plain 0.299s, minterpolate 7.191s (~24×
  plain, ~0.56x realtime trên VM 2vCPU), tmix 0.352s.
- Hồi quy: test_k1 21/21.

## Parent đã sửa trong lúc tích hợp (không phải báo cáo của luồng)

1. **E2E S6 lỗi thời sau vá đuôi của S2:** kỳ vọng builder filter thiếu
   `,fps=30` → sửa thành `INTERP + ",fps=30"`; kỳ vọng frame qua
   builder 57 → 60±3 (fps lấp đuôi); check `validateMotion(motion +
   speedKeyframes)` vốn pass nhờ lý do sai (thiếu targetFps, không phải
   vì ramp) → thay bằng check luật spec S1 thật: `none + targetFps`
   phải báo lỗi. Sau sửa: E2E 11/11.
2. **Validate render khớp spec S1:** `validateMotion` trong
   `server/render/src/motion.js` chưa chặn `none + targetFps/miMode`
   (S1 cấm) → parent thêm luật này + self-test assert. UI S5 đã strip
   sẵn nên không test nào vỡ.
3. **Ghi chú lỗi thời trong MOTION_LIMITS.md của S2:** mục "Lệch shape
   với S3" và câu "cần đối chiếu shape S3" → thay bằng mục "ĐÃ KHỚP"
   (S3 import trực tiếp builder/validator của motion.js; S4/S5 đọc
   shape S1). Header `motion.js` đổi từ "SHAPE (TẠM…)" thành shape chuẩn.

## Khác biệt có chủ ý giữa tầng spec và tầng render (đừng "sửa" nhầm)

- Spec (S1) bắt `targetFps` khi `minterpolate`; render cho phép vắng và
  mặc định bằng project fps (nhánh ramp cần trường hợp vắng này).
- Spec resolve blur vắng frames thành 3 + weights đều; render yêu cầu
  `frames` explicit (UI luôn ghi frames nên project từ UI không chạm
  vào trường hợp này).
- Render chặn thêm `targetFps != project fps` + transition (xfade bắt
  cùng fps); spec không có luật này. UI chưa cảnh báo trường hợp này
  (xem nợ dưới).

## Chưa làm được / chưa nối (trung thực)

1. **Minterpolate rớt đuôi + đóng băng đuôi:** minterpolate bidir cần
   frame lookahead nên rớt ~3 frame biên; vá bằng `fps=<targetFps>`
   sau minterpolate lấp đủ frame nhưng ~0.23s cuối clip bị đóng băng
   frame cuối thay vì đen. UI không được hứa duration/mượt tuyệt đối
   ở đuôi clip khi bật nội suy.
2. **Preview ≠ render:** preview KHÔNG nội suy frame mới (giữ fps
   project, chỉ badge NỘI SUY); blur preview chỉ là ghost 1 frame
   trước alpha 0.35, không theo `frames`/`weights`, không có cho đường
   vẽ mask và SR. Chưa click-test trực quan trên browser thật.
3. **UI chưa cảnh báo transition + targetFps khác project fps** (render
   sẽ fail-fast với thông báo rõ, nhưng user chỉ biết khi render).
   Weights chưa có UI (luôn chia đều); `miMode` chưa có UI (mặc định
   `mci`, giữ `blend` cũ nếu có).
4. **Chưa đo:** footage thật (người, chuyển động nhanh, cắt cảnh),
   minterpolate 1080p/4K, clip ramp dài/HD, kết hợp stabilize +
   interpolation (cho phép nhưng chưa đo chất lượng), mask-keyframes +
   motion và ramp + motion + transition (chưa có test E2E).
5. **Tốc độ:** minterpolate chậm hơn plain ~24× ở 640x360 trên VM này
   (S6) — clip dài cần cảnh báo thời gian trước khi render; số này chỉ
   đúng máy đo, không suy ra máy khác.
6. Ghi chú cũ trong header `motion.ts` của S1 về shape tạm S5/S3 đã
   lỗi thời (cả hai đã khớp trong đợt này) — đợt sau đọc LIMITS này
   làm chuẩn thay vì header đó.

## Không làm (đúng chủ trương)

- Không push GitHub, không tag/release, không binary trong batch.
- Không đụng cloud/collab, model đóng, nhạc có bản quyền.
- Batch chỉ stage file text; `dist/` và `benchmarks/results/` là
  output kiểm chứng, không stage.
