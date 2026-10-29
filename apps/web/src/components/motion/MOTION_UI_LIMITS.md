# MOTION_UI_LIMITS.md — Panel slow-mo / nội suy frame / motion blur (S5-UI, Phase 9 đợt 8)

## Đã làm

- `MotionPanel.tsx`: chỉ hiện điều khiển cho clip video đang chọn; clip
  khác kind hiện tips giải thích (text/audio/ảnh/sticker).
- Điều khiển (mọi thay đổi qua `patchClip` sẵn có → undo/redo hoạt động,
  không sửa `store.ts`):
  - Bật/tắt nội suy: select `none` / `minterpolate`.
  - FPS đích: select 24 / 30 / 60, **chỉ enable khi nội suy bật**
    (`isTargetFpsDisabled` — targetFps khi interpolation `none` là no-op).
  - Motion blur: checkbox + slider số frame gộp 2..8.
  - Nút "Tắt tất cả slow-mo / motion blur" gỡ hẳn `clip.motion`.
- Cảnh báo trong panel:
  - (a) Chỉ có tác dụng khi **render**, preview chỉ xấp xỉ (theo S4).
  - (b) Clip đang bật `enhance.stabilize` + bật nội suy → cảnh báo
    không dùng chung (validator chặn, panel không tự tắt bên nào).
  - (c) Clip dài + nội suy render chậm — **chỉ viết định tính** ("thử đoạn
    ngắn trước"); S5 không đo benchmark render đợt này nên không ghi fps.
- Gắn vào `Inspector.tsx` bằng đúng 1 Section `inspector.secMotion` ngay
  sau Section Enhance, trong nhánh `clip.kind === "video"`.
- i18n: thêm `inspector.secMotion` + section `motion.*` (20 key) đầy đủ
  vi+en, parity 1–1 (check `r6-i18n-check.cjs` PASS, vi = en = 671 key).

## Khớp shape S1 (quan trọng)

- Ban đầu S5 không tìm thấy shape motion của S1 trong repo nên viết theo
  shape tạm; giữa đợt S1 đã hạ `packages/video-spec/src/motion.ts` nên S5
  đã **căn lại toàn bộ theo S1**: import type + hằng số từ
  `@repo-1/video-spec` (như mẫu EnhancePanel), không tự định nghĩa shape.
- Luật S1 mà UI tôn trọng (mọi patch đều sinh motion qua được
  `validateMotion` — test `S1-validity` mô phỏng đúng các luật này):
  - interpolation `none` thì **gỡ luôn targetFps/miMode** (kèm hai key này
    khi none là lỗi validate của S1, không chỉ đặt `interpolation: "none"`).
  - `minterpolate` bắt buộc có targetFps trong [1, 120]; select UI chỉ cho
    24/30/60 (tập con hợp lệ).
  - `miMode` chỉ `mci` / `blend` — **`dup` bị S1 loại**, UI mặc định `mci`.
  - `motionBlur` độc lập với interpolation (chỉ blur, không nội suy vẫn
    hợp lệ, và cũng không kèm targetFps/miMode).
  - `resolveMotion` tự sửa dữ liệu lệch cũ thành hợp lệ (none kèm
    targetFps/miMode → gỡ; miMode `dup` → `mci`; targetFps ngoài
    [1, 120] → 30; weights lệch → chia đều lại).

## Đợt 9 M3 — hoàn thiện UI MotionPanel (trả nợ đợt 8)

### Đã làm thêm

- **UI weights từng frame**: khi blur bật, mỗi frame có 1 slider 1–100%
  (`withBlurWeight` → `normalizeWeights`, tổng luôn = 1). Slider tối thiểu
  1% (không có 0) để mọi trọng số đều > 0 — đúng luật render S2
  (validateMotion của S2 reject trọng số <= 0; spec S1 chỉ yêu cầu tổng
  > 0, xem lưu ý dưới). Nút "Chia đều lại trọng số" gọi `withBlurFrames`
  với cùng số frames. **Đổi số frame gộp vẫn chia đều lại và MẤT weights
  tuỳ chỉnh** (hành vi cũ của `withBlurFrames`, panel ghi rõ bằng nút
  reset; chưa làm "giữ tỉ lệ khi đổi frames").
- **UI miMode**: select `mci` / `blend` (`withMiMode`), disable khi nội suy
  tắt (no-op như `withTargetFps`, không kèm miMode khi interpolation
  `none` — đúng luật S1).
- **Cảnh báo mới** (logic thuần trong `motion.ts`, panel chỉ hiển thị):
  - `isTransitionFpsBlocked`: nội suy + transition + targetFps khác fps
    project → render bị chặn (fail-fast). Xem "Sửa hiểu lầm" dưới.
  - `isFpsMismatch`: targetFps khác project fps nhưng KHÔNG transition →
    cảnh báo nhẹ: render vẫn chạy, output cuối bị resample về fps project
    nên độ mượt chỉ còn một phần (đúng `motion.js` S2).
  - `isStabilizeInterpConflict`: nội suy + stabilize → giữ cảnh báo cũ
    (xem mâu thuẫn S2 dưới — panel KHÔNG tự tắt bên nào).
  - `estimateInterpCost` / `estimateInterpOutputFrames`: ước lượng số
    frame đầu ra = duration × targetFps (+ tỉ lệ so với fps project).
    **Ghi rõ trong cả code, i18n và panel: chỉ là ước lượng khối lượng,
    KHÔNG phải thời gian render, KHÔNG có benchmark nào đứng sau.**
- **i18n**: thêm 10 key `motion.*` mới (miMode ×4, warnTransitionFps,
  warnFpsMismatch, costEstimate, blurWeightsLabel/Weight/Reset) đủ vi+en;
  text `motion.blurWeightsNote` cũ ("chưa có UI chỉnh từng trọng số") đã
  sửa vì nay đã sai. Check `r6-i18n-check.cjs` PASS, vi = en = 681 key
  (tăng từ 671 đợt 8 do các luồng đợt 9 khác cũng thêm key).
- **Inspector**: KHÔNG cần sửa — Section `inspector.secMotion` đã nối sẵn
  từ đợt 8, panel tự đọc `spec.meta.fps` + `transitionIn/Out` + `duration`
  của clip đang chọn.
- **Test**: `motion.test.ts` 18/18 (10 cũ + 8 mới: normalizeWeights,
  withBlurWeight, withBlurWeight+withBlurFrames, withMiMode,
  hasClipTransition, mismatch/blocked, stabilize conflict, estimate;
  2 case mới chèn vào test S1-validity cũ). `tsc --noEmit`: file motion
  0 lỗi; lần chạy tsc đầu thấy lỗi `preview.tsx` (drawMotionBlurGhost)
  nhưng đó là file của luồng đợt 9 khác đang sửa dở — chạy lại sau thì
  toàn repo 0 lỗi. `vite build` pass (17.83s).

### Sửa hiểu lầm về rule fail-fast (quan trọng, đọc trước khi dùng cảnh báo)

Brief đợt 9 M3 viết gọn "(a) transition + interpolation, (b) targetFps
khác project fps (render sẽ fail-fast)" — đọc theo nghĩa đen là sai so
với code thật. Rule đúng trong `server/render/src/motion.js`
`validateMotion` + `server/render/src/validate.js` (clip thường):
**CHỈ combo đủ 3 điều kiện** (interpolation bật + clip có transition +
targetFps ≠ project fps) mới lỗi, vì xfade yêu cầu 2 input cùng fps.
Từng điều kiện riêng lẻ KHÔNG lỗi: transition + targetFps = project fps
→ render bình thường; targetFps lệch nhưng không transition → render
chạy, output resample về project fps. Panel M3 implement đúng rule này
(cảnh báo chặn chỉ hiện khi đủ combo; lệch đơn lẻ hiện cảnh báo nhẹ
riêng), KHÔNG hiện cảnh báo chặn sai cho 2 trường hợp riêng lẻ.

### Mâu thuẫn chưa giải quyết: stabilize + interpolation

Panel (từ đợt 8, M3 giữ nguyên theo brief) viết "nội suy KHÔNG dùng
chung được với chống rung, render sẽ bị chặn". Nhưng `motion.js` S2
ghi rõ "motion + enhance.stabilize: CHO PHÉP — vidstabtransform chạy ở
enhPre, minterpolate chạy sau scale/pad, không chia sẻ state". Hai luồng
nói ngược nhau; M3 KHÔNG tự ý đổi text panel (brief yêu cầu giữ cảnh
báo) mà ghi lại đây để parent/luồng render quyết: hoặc S2 sai (có lỗi
chặn ở validate khác chưa tìm thấy), hoặc text panel đợt 8 sai và cần
sửa thành cảnh báo chất lượng (chưa đo) thay vì "bị chặn".

### Nợ còn lại (sau M3)

- **Weights**: chưa có "giữ tỉ lệ khi đổi frames"; `normalizeWeights`
  giữ nguyên trọng số 0 cho dữ liệu thô (spec S1 chỉ cần tổng > 0) —
  mảng có 0 vẫn FAIL validate render S2, chỉ path slider UI (min 1%) là
  đảm bảo > 0. Project cũ lưu weights có 0 sẽ cần migrate riêng.
- **Chưa click-test trên browser thật**: vẫn chỉ có test logic thuần +
  tsc + i18n + vite build. Panel chưa từng được mở/click trên browser thật.
- **Chưa đo benchmark**: cost estimate là công thức duration × targetFps,
  không phải số đo; mci-vs-blend, phần cứng, codec đều chưa đo.
- **Chưa sửa mâu thuẫn stabilize** (xem trên).

## Chưa làm / nợ còn lại (đợt 8, đã cập nhật ở mục M3 trên)

- **Weights chưa có UI**: `motionBlur.weights` luôn chia đều (1/frames mỗi
  frame) khi đổi frames; đợt này không có slider chỉnh từng trọng số.
- **`miMode` chưa có UI**: bật nội suy mặc định `mci`; giá trị `blend` cũ
  (nếu có) được giữ nguyên khi patch, nhưng user chưa đổi được từ panel.
- **Chưa click-test trên browser thật**: chỉ có test logic thuần
  (`motion.test.ts` 10/10, chạy bằng node trực tiếp) + `tsc` + i18n
  check. Panel chưa từng được mở/click trên browser thật.
- **Chưa đo benchmark**: mọi cảnh báo hiệu năng đều định tính, không có
  số fps/thời gian render nào do S5 đo.
- `tsconfig.json`: thêm đúng 1 dòng exclude cho `motion.test.ts` (ngoài
  danh sách file S5 được giao) — bắt buộc theo mẫu repo: mọi `*.test.ts`
  đều nằm trong exclude vì import `.ts` kiểu node type-stripping (đã thử
  import `.js`: node báo `ERR_MODULE_NOT_FOUND`, không chạy được).
- `tsc --noEmit` hiện vẫn còn lỗi ở file của luồng khác (S4:
  `preview.tsx`/`previewEngine.test.ts`; S1: `packages/video-spec/src/
  motion.ts` lỗi narrow `frames`) — **không phải lỗi của S5**, S5 không
  được sửa file luồng khác nên chỉ lọc ra báo cáo. File của S5 cho ra
  0 lỗi tsc.

## Đợt 9 tích hợp (parent) — sửa cảnh báo stabilize sai

- Panel đợt 8/M3 từng cảnh báo "nội suy KHÔNG dùng chung được với chống
  rung, render sẽ bị chặn" — SAI so với render thật. `validate.js` chỉ chặn
  stabilize + speedKeyframes; `motion.js` S2 ghi CHO PHÉP stabilize +
  interpolation, và M4 đã render thật chứng minh (vidstab trước minterpolate).
- Parent đã sửa: panel chỉ cảnh báo khi clip có cả stabilize và speedKeyframes;
  text i18n `motion.warnStabilize` (vi/en) đổi theo; hàm
  `isStabilizeInterpConflict` giữ lại vì test M3 + tương thích, kèm chú thích
  không còn dùng để cảnh báo chặn. Test logic motion.test.ts không đổi.
