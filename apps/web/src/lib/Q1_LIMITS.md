# Q1 (Phase 8) — Giới hạn preview parity còn lại

Tài liệu này ghi những gì Q1 đã làm, sai số còn lại, và những gì Q1
KHÔNG làm (kèm lý do). Đọc cùng `PREVIEW_LIMITS.md` (giới hạn cũ).

## 1. Mask lên preview — ĐÃ XONG (cùng công thức render)

- `previewEngine.ts`: `maskAlphaAt(mask, W, H, px, py)` mirror chính xác
  `server/render/src/mask.js` (geq): rect dùng khoảng cách Chebyshev có dấu
  (âm = trong), ellipse dùng `d = (r-1)/grad` bậc nhất; feather = dải
  chuyển tiếp `feather × cạnh ngắn hơn của mask`; `invert` đảo alpha;
  alpha cuối = alpha gốc × alpha mask (không ghi đè).
- `preview.tsx`: `maskedUnitSource` vẽ nội dung đã letterbox (kèm CSS filter
  LUT/effects + chroma) vào offscreen unit rồi nhân alpha bằng `applyMask`,
  sau đó composite unit lên canvas chính. Thứ tự khớp render: mask áp lên
  unit TRƯỚC transform SR (mask xoay/co giãn cùng clip), chroma trước mask.
- Áp cho cả video clip và image clip (render P4 có áp mask cho ảnh).
  Text/sticker KHÔNG có mask (validator chỉ cảnh báo, render cũng bỏ qua).

Sai số còn lại (chỉ ở preview, render vẫn chính xác):
- Unit offscreen giới hạn 640px chiều rộng (như chroma, để giữ 30fps):
  feather co giãn theo tỉ lệ nên độ mềm TƯƠNG ĐỐI giữ nguyên, nhưng viền
  cứng bị mềm đi ~hệ số phóng đại khi upscale về khung xem (vd khung 1920
  → viền cứng mềm ~3px). Render dùng full resolution nên vẫn sắc.
- Lấy mẫu tại tọa độ nguyên (như geq), không phải tâm pixel — khớp render.
- Tại tâm ellipse, `grad = 0`: code dùng `-Infinity` để khớp render
  (`(-1)/0 = -inf` trong geq → alpha clamp về 1). Dùng `-1` sẽ sai
  (cho `0.5 + 1/band` thay vì 1) — đã có test bắt trường hợp này.
- Mask không hợp lệ (shape lạ, w/h <= 0, số không hữu hạn) → bỏ qua
  (alpha 1), không làm đen canvas; validator render báo lỗi riêng.

## 2. Speed ramp lên preview — ĐÃ XONG (tích phân đúng)

- `rampSpeedAt(clip, localT)`: có `speedKeyframes` → `speedAt` theo đường
  cong (ghi đè speed hằng như render); không có → speed hằng.
- `rampSourceTimeAt(clip, timelineT)`: có ramp (và không reverse) →
  `in + ∫speed` bằng `integrateRampSpeed` tự viết; không có ramp →
  `sourceTimeAt` chuẩn. `collectActives` dùng 2 hàm này cho cả target seek
  lẫn playbackRate mỗi frame RAF.
- Reverse + ramp: render validator CHẶN combo này nên preview fallback về
  mapping hằng (không đoán).

Sai số còn lại:
- `playbackRate` của HTMLVideoElement là một giá trị tại mỗi frame RAF,
  không phải đường cong liên tục: tốc độ phát nhảy theo bậc mỗi frame
  (16ms). Drift được chặn bằng re-seek khi lệch > 0.35s (khi đang phát).
  Khi pause/scrub, seek theo ∫speed nên vị trí là chính xác.
- Caption mapping vẫn dùng tốc độ hằng (gap Phase 7, không thuộc Q1).

### BUG THƯỢNG NGUỒN — cần sửa ngoài phạm vi Q1

`integrateSpeed`/`sourcePosAt` trong CẢ `packages/video-spec/src/speedcurve.ts`
VÀ `server/render/src/speedramp.js` (2 bản mirror cùng code) tính SAI đoạn
con nằm trong 1 segment: với segment linear 1→2 trên [0,4],
`integrateSpeed(0,2)` trả 3 thay vì 2.5 (dùng trung bình 2 đầu mút segment
thay vì giá trị tại điểm cắt). Ease-in/ease-out đoạn con cũng sai cùng
kiểu (dùng hệ số 1/3, 2/3 của toàn segment). Bezier (Simpson) thì đúng.
May mắn: render KHÔNG dùng `sourcePosAt` (dùng `planSpeedSegments` với
`speedAt` tại giữa đoạn nên bản render vẫn đúng); hiện chưa có consumer
nào khác dùng `sourcePosAt` (đã grep toàn repo). Vì vậy preview Q1 tự
tích phân từ `speedAt` (đúng) thay vì dùng `sourcePosAt`. Đề nghị task
riêng sửa 2 file trên (công thức đúng đã có trong `integrateRampSpeed`).

## 3. LUT / effect / chroma — CẢI THIỆN ĐO ĐƯỢC, CHƯA PHẢI 3D LUT THẬT

- Đã đo sai số CSS hiện tại so với file `.cube` thật (nội suy trilinear,
  lưới train 6³ + 500 màu ngẫu nhiên held-out) và fit lại THAM SỐ của cùng
  chuỗi filter bằng least squares (script `apps/web/scripts/fit-lut-css.py`,
  báo cáo `fit-lut-css-report.json`). Chỉ chấp nhận entry mới khi sai số
  held-out < 0.7 × sai số cũ. Kết quả (thang RMSE 0-255/kênh, held-out):
  174 mục đo được, 110 mục đạt ngưỡng và đã ghi vào `LUT_CSS`;
  trung bình toàn bộ: 24.73 → 15.98; trung bình riêng 110 mục được fit:
  11.22. 64 mục giữ nguyên vì affine không bắt kịp đường cong thật, đáng
  chú ý: `vcut-solarized` 100.35 → 71.88 (vẫn tệ, giữ nguyên),
  các LUT phim đen trắng (ilford/kodak/tmax/trix) 39-54 (đường cong filmic
  phi tuyến mạnh, `grayscale(1) contrast(...)` viết tay sai rất xa),
  `vcut-duotone-cyan-orange` 56.46 → 41.01. Hai key trùng
  (`vcut-matcha`, `vcut-coral-reef`) đã được dọn trong lúc `--apply`
  (giữ occurrence cuối = giá trị production, xoá occurrence trước);
  giá trị fit cuối của 2 key này tính từ form occurrence đầu vì occurrence
  sau đã bị agent khác xoá trước lúc chạy apply — nhưng giá trị mới vẫn
  là fit đã validate trên held-out (matcha 28.23 → 18.57, coral-reef
  20.98 → 12.86).
- Giới hạn CỐ HỮU của CSS filter (không fit nào vượt qua được): một LUT 3D
  là ánh xạ phi tuyến 3 chiều; chuỗi CSS filter chỉ là một ánh xạ affine
  (ma trận 3×3 + offset) trong không gian sRGB. Fit affine chỉ bắt được
  phần "màu tổng thể" của LUT, không bắt được các cong phi tuyến mạnh
  (vd LUT filmic có shoulder/toe khác nhau theo vùng sáng). Muốn preview
  LUT chính xác từng pixel cần một trong hai thứ, đều ngoài phạm vi Q1:
  (a) WebGL shader đọc `.cube` (cần đưa file .cube tới browser — hiện
  `apps/web/public/` không chứa `.cube` nào, `LutPicker` chỉ đọc file user
  upload qua IndexedDB); hoặc (b) bridge phục vụ route tĩnh cho
  `assets/filters/*.cube` rồi preview fetch + trilinear bằng JS/WebGL.
- Effect: blur/grayscale/sepia/brightness → CSS tương đương; sharpen/noise
  vẫn bị bỏ qua (đã warn) vì không có filter CSS tương đương rẻ.
- Chroma: vẫn là xấp xỉ Euclid RGB của FFmpeg YUV chromakey (inner =
  similarity×0.5, outer += blend×0.5), chạy ở 640px cap như trước.

## 4. Chưa click-test browser thật — Q2 LO PHẦN ĐÓ

Toàn bộ Q1 chỉ verify bằng test Node (pure logic) + vite build. Đường vẽ
mask trên canvas thật (`preview.tsx`: `maskedUnitSource`, nhánh SR/non-SR,
vignette sau mask) CHƯA được click-test trên browser thật — Q2 lo phần đó.
Nếu Q2 thấy mask lệch vị trí, nghi ngờ đầu tiên: unit offscreen vẽ
`drawImage(drawSrc, dx*s, dy*s, dw*s, dh*s)` với `s = min(1, 640/W)`.

## 5. Trạng thái verify (2026-10-24)

- Preview-engine test: 272 → **317 assertions, tất cả pass** (mục 12 mask,
  mục 13 ramp). Chạy bằng cùng pipeline tsc của `test-preview-engine.sh`
  nhưng bỏ `set -e` ở bước tsc (xem dưới) — vì lỗi type của agent khác.
- `vite build`: pass (32s).
- `tsc` (toàn app): KHÔNG 0 — 1 lỗi duy nhất thuộc về agent song song Q5
  (`packages/video-spec/src/sticker.ts`: field `track` mới thêm vào
  `StickerClip` nhưng `normalizeStickerClip` chưa trả `track`; lỗi đổi
  dạng trong phiên — Q5 đang sửa, Q1 không đụng file đó). File của Q1
  (`previewEngine.ts`, `preview.tsx`) không có lỗi type nào.
- Lỗi TS1117 (duplicate key) trong `previewEngine.ts` (`vcut-matcha`,
  `vcut-coral-reef`): script fit `--apply` đã dọn bằng cách giữ occurrence
  cuối (giá trị production) và xoá occurrence trước. Lưu ý: cây file đang
  được nhiều agent sửa song song — lần chạy tsc giữa phiên của Q1 từng
  thấy TS1117 ở `lut.ts` nhưng kiểm tra lại sau đó thì `LUT_META` đã hết
  trùng (174 key unique); vì vậy trạng thái tsc cần kiểm tra lại lúc
  merge, đừng tin tuyệt đối số liệu của phiên này.
- Ghi chú thêm: giữa phiên, catalog `LUT_IDS` đã tăng 154 → 174 do agent
  nội dung song song thêm LUT (đồng thời cập nhật luôn assertion mục 3
  trong test của Q1 từ 154 → 174). Vì vậy tổng assertion cuối là 337
  (272 gốc + 45 mục mask/ramp của Q1 + 20 LUT mới của agent khác), chứ
  không phải 317 như lúc Q1 chạy test lần đầu. Script fit LUT chạy sau
  đợt tăng này nên đã đo đủ 174 id.
- CẢNH BÁO cho agent khác: `packages/video-spec/src/` chứa file `.js`
  biên dịch cũ nằm cạnh `.ts` (vd `lut.js` chỉ có 20 LUT thời Phase 5).
  esbuild/vite resolve import `"./lut.js"` về file `.js` CŨ đó thay vì
  `.ts` mới khi cả hai cùng tồn tại — đã kiểm chứng: bundle esbuild cho
  `LUT_IDS.length = 20` thay vì 154. Đừng tin bundle esbuild khi chưa
  kiểm tra; và nên xoá các `.js` cũ khỏi `src/` (Q1 không xoá vì sợ ảnh
  hưởng agent đang chạy).
