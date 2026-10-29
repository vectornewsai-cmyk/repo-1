# Phase 9 đợt 12 — Luồng T5: speed-curve editor + click-test (LIMITS)

Ngày: 2026-10-27. Chạy từ cron vcut-build-loop (08:03 +07), luồng T5 trong
đợt lớn đợt 12. KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG sửa
file của luồng khác. Harness mới: `apps/web/scripts/t5-round12-clicktest.cjs`
(vite dev riêng cổng 5192, debug port 9339, CDP Chromium headless,
mẫu P5 đợt 11). Chạy: `node apps/web/scripts/t5-round12-clicktest.cjs`
(từ `apps/web/`).

## 1. Việc đã làm: speed-curve editor thật trong SpeedPanel

Trước đợt này, không có UI nào tạo được `speedKeyframes` (đợt 11 P5 ghi
SKIP nhánh dương cảnh báo stabilize+ramp vì lý do này). Nay
`SpeedPanel` có thêm khối "Đường cong tốc độ (speed curve)":

- Nút "Bật speed curve" → tạo `speedKeyframes` thật qua `patchClip`
  (lưu vào project, undo/redo hoạt động như mọi patch khác), mặc định
  2 điểm `{t: 0, v: 1}` và `{t: duration, v: 1}` (clip mẫu 4s → điểm cuối
  @4s).
- 3 preset 2 điểm: "Đều 1×", "Chậm → nhanh (0.5→2×)",
  "Nhanh → chậm (2→0.5×)" — ghi đè toàn bộ curve.
- Sửa từng điểm: slider thời điểm `t` (0.1s, kẹp trong khoảng 2 điểm
  kề), slider tốc độ `v` (0.25–4, bước 0.05), select easing cho các điểm
  trừ điểm cuối (easing của điểm cuối không có đoạn sau nên không hiện).
- "Thêm điểm giữa": chèn điểm `v = 1` tại giữa khoảng trống lớn nhất;
  nếu mọi khoảng đều < 0.2s thì báo `warnNoGap` thay vì tạo điểm trùng
  (trùng `t` sẽ bị `normalizeSpeedKeyframes` gộp lặng lẽ).
- "Xoá điểm" từng điểm (giữ tối thiểu 1 điểm), "Tắt speed curve" gỡ
  field khỏi clip (patch `speedKeyframes: undefined`, cùng mẫu
  `motion: undefined` của MotionPanel).
- Cảnh báo thật, không chặn cứng (cùng triết lý MotionPanel/
  EnhancePanel): curve + reverse → cảnh báo reverse+ramp trong chính
  SpeedPanel; curve + stabilize → cảnh báo stabilize+ramp (đã có sẵn
  ở MotionPanel/EnhancePanel, nay mới click-test được nhánh dương).
  Khi có curve, panel ghi rõ tốc độ hằng ở trên bị curve ghi đè (đúng
  ngữ nghĩa `speedcurve.ts`: `speedAt`/`rampSourceTimeAt` bỏ qua speed
  hằng khi có ramp).
- i18n: 18 key mới trong nhóm `speed`, đủ cả `vi.json` và `en.json`
  (`r6-i18n-check.cjs` PASS, 737 = 737 key).

Panel này dùng chung cho clip video và audio (cả 2 đều là
`isSpeedable` và đều có field `speedKeyframes` trong spec); MotionPanel
chỉ nhận clip video nên cảnh báo stabilize chỉ áp dụng cho video.

## 2. Kết quả click-test thật (lần chạy cuối, 16/16 PASS, 0 SKIP)

| Case | Kết quả | Số đo thật |
|---|---|---|
| T0 load sample | PASS | 3 clip: 2 video + 1 text |
| T0b welcome modal | PASS | modal tự mở, đã đóng bằng click backdrop |
| T0c chọn clip video đầu | PASS | timeline index 0 |
| T1 bật speed curve (click thật) | PASS | 2 điểm: "Điểm 1: 1× tại 0s", "Điểm 2: 1× tại 4s" |
| T2a preset Chậm → nhanh (click thật) | PASS | "0.5× tại 0s", "2× tại 4s" |
| T2b thêm điểm giữa (click thật) | PASS | 3 điểm, điểm giữa "1× tại 2s" |
| T2c tăng v điểm giữa (phím thật) | PASS | "1× tại 2s" → "1.05× tại 2s" (1 bước slider 0.05) |
| T3 curve survive đổi selection | PASS | clip khác không có curve; quay lại clip đầu vẫn đủ 3 điểm (0.5× / 1.05× / 2×) — chứng tỏ curve lưu trong project qua patchClip, không phải state cục bộ |
| T4 chống rung + curve: cảnh báo HIỆN (nhánh dương đợt 11 P6b) | PASS | stabilize=true, motionWarn=true, enhanceWarn=true, app sống |
| T5 tắt curve: cảnh báo BIẾN MẤT (nhánh âm) | PASS | kfs=0, cả 2 cảnh báo false, app sống |
| T6a motion blur: 3 slider weights | PASS | pcts=[33,33,33] |
| T6b nội suy + miMode (phím thật) | PASS | interp → minterpolate, miMode hết disable, mci → blend, app sống |
| T7 ghost UI: badge BLUR≈ khi đang phát | PASS | badge='NỘI SUY • BLUR≈' — CHỈ kiểm tra UI hiển thị, KHÔNG đo pixel (pixel thuộc luồng T1) |
| T8pre tắt chống rung (dọn trạng thái T4) | PASS | stabilize=false |
| T8a reverse + curve: cảnh báo HIỆN trong SpeedPanel | PASS | warns=[cảnh báo reverse+ramp], nút đảo ngược chuyển sang "◀ Đang đảo ngược" |
| T8b trả trạng thái sạch | PASS | kfs=0, nút bật curve trở lại, app sống |

Tổng: **16 PASS, 0 FAIL, 0 SKIP**.

## 3. Bug harness đã sửa trong lúc chạy (không phải bug sản phẩm)

Lần chạy đầu T8a FAIL: sau khi bật curve, click nút đảo ngược không có
tác dụng (`revBtn` vẫn "▶ Phát xuôi", warns rỗng sau khi đã tắt
stabilize ở T8pre). Lần chạy 2 (đã tắt stabilize trước) vẫn FAIL y hệt
nên không phải do nhiễu trạng thái. Nguyên nhân: finder `speed` cuộn
lần lượt nhiều control rồi mới đo tọa độ — nút đảo ngược ở đầu panel
bị cuộn ra khỏi viewport khi slider keyframe cuối panel được cuộn vào
giữa, khiến click CDP rơi nhầm chỗ mà không báo lỗi (CDP không kiểm
tra element tại tọa độ click). Đã sửa: thêm finder `speedTarget` đo
tọa độ của RIÊNG control sắp click (cuộn riêng nó vào view ngay trước
khi click) và dùng nó cho mọi click nút trong SpeedPanel. Sau sửa, lần
chạy cuối 16/16 PASS, nút đảo ngược toggle đúng và cảnh báo reverse+
ramp hiện đúng. Bài học cho harness sau: đừng tái dùng tọa độ đo từ
một lần cuộn hàng loạt cho control ở xa control cuối cùng được cuộn.

Lần chạy đầu còn một nhiễu do thiết kế test: T8a khi đó vẫn còn
stabilize bật từ T4 nên warns lẫn cả cảnh báo stabilize+ramp. Đã sửa
bằng bước T8pre tắt stabilize trước, để T8a chỉ còn ứng viên
reverse+ramp — không phải sửa sản phẩm, chỉ làm sạch điều kiện test.

## 4. Kiểm chứng khác

- `r6-i18n-check.cjs`: PASS (vi=737, en=737).
- `npx vite build`: PASS (7.50s, 176 modules; cảnh báo chunk > 500 kB
  và dynamic-import userLut đã có từ trước, không liên quan đợt này).
- `npx tsc --noEmit`: CHỈ còn đúng 1 lỗi, nằm ở file test của luồng
  khác cùng đợt 12 (`src/lib/projectRepo.test.ts` — luồng T4, import
  `./projectRepo.ts` bị TS5097 vì thiếu `allowImportingTsExtensions`).
  Luồng T5 KHÔNG đụng file đó (nằm ngoài phạm vi cho phép: cấm sửa
  `projectRepo.ts` và file của luồng khác) nên để lại cho parent/T4 xử
  lý; không có lỗi nào ở `SpeedPanel.tsx` hay i18n. LƯU Ý: vì vậy
  `npm run build` (`tsc && vite build`) hiện FAIL ở bước tsc do file
  của T4, dù `vite build` riêng vẫn PASS.
- `dist/` được tái tạo bởi lần chạy `vite build` để kiểm chứng — là
  build artifact, KHÔNG đưa vào batch stage của luồng này.

## 5. Giới hạn trung thực — click-test này KHÔNG chứng minh

- Render thật chặn đúng tổ hợp stabilize+ramp / reverse+ramp: validator
  render đã có test riêng (`server/render/test_p3.js`); luồng này chỉ
  chứng minh UI tạo được trạng thái và cảnh báo phản ứng đúng theo
  trạng thái đó, không chạy render một clip có ramp trong đợt này.
- Preview đi theo ramp theo thời gian thực: code path đã có sẵn
  (`preview.tsx` dùng `rampSourceTimeAt` cho clip speedable) và field
  curve ghi ra có đúng shape mà path đó đọc (`keyframes` t/v/easing),
  nhưng luồng này không đo thời điểm frame preview dưới ramp (không
  có probe thời gian nguồn) — đừng suy ra "preview khớp render dưới
  ramp" từ kết quả click-test.
- Ghost pixel: T7 chỉ kiểm tra badge hiển thị. Vệt ghost có lộ bằng
  pixel hay không là việc của luồng T1; kết luận đợt 11 P5 (frame hiện
  tại đục phủ kín bóng giữa clip) vẫn đứng nguyên, chưa được kiểm
  chứng lại ở đây.
- Keyframe `t` vượt `duration` sau khi trim clip ngắn lại: panel không
  tự cắt keyframe thừa (preview `speedAt` clamp về giá trị biên nên
  không vỡ, nhưng keyframe thừa vẫn nằm trong project). Đây là hành vi
  đã biết, chưa phải bug đo được — ghi lại để luồng trim/speed sau
  quyết định có nên cắt hay không.
- Easing `bezier` trong select của điểm: chọn được và lưu vào keyframe
  (đúng shape `SpeedKeyframe.bezier?`), nhưng panel không có UI sửa 4
  số bezier — điểm bezier mới lưu sẽ dùng bezier mặc định
  `[0.25, 0.1, 0.25, 1]` của `applySpeedEasing` khi render/preview. Đừng
  claim "sửa được bezier" — mới chỉ chọn được loại easing.
- Chỉ đo trên project mẫu + Chromium headless VM (clip mẫu 4s, 2 video
  + 1 text). Chưa đo trên clip dài, clip audio (editor có mặt ở panel
  audio nhưng click-test chỉ chạy trên clip video), hay trình duyệt
  thật.

## 6. File đổi/thêm (tương đối từ repo root, KHÔNG push)

- `apps/web/src/components/speed/SpeedPanel.tsx` (sửa: thêm speed-curve
  editor + cảnh báo reverse+ramp/stabilize+ramp trong panel)
- `apps/web/src/i18n/vi.json` (thêm 18 key nhóm `speed`)
- `apps/web/src/i18n/en.json` (thêm 18 key nhóm `speed`, đủ bộ với vi)
- `apps/web/scripts/t5-round12-clicktest.cjs` (mới, harness click-test T5)
- `docs/PHASE9_ROUND12_T5_SPEEDCURVE_LIMITS.md` (mới, file này)

Không đụng: `transitionPreview.ts`, ghost logic (`preview.tsx`),
`previewStatus.ts`, `projectRepo.ts` (cả file chính lẫn file test của
luồng T4), và mọi file click-test của luồng khác.
