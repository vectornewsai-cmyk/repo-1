# Phase 9 round 16, luồng H1 — harness + badge: LIMITS (trung thực)

> Đợt lớn round 16, luồng H1 (chỉ luồng này). KHÔNG push GitHub,
> KHÔNG release/tag, KHÔNG file binary, KHÔNG sửa build-loop-log.md,
> KHÔNG sửa file trong `~/workspace/repo-1-push/paths-loop/` (parent
> stage). Chỉ sửa code trong `~/workspace/repo-1`.
> Nợ gốc: `docs/PHASE9_ROUND15_LIMITS.md` §3 (harness V11/V12/V14 chưa
> hiểu kind bars-fade; V13 chưa kiểm tra; badge blinds-h/plus/checker/
> grid/bars-fade chưa nâng vì số đo đợt 15 chỉ qua script /tmp).
> FFmpeg đo: 8.1.2. Thang KHỚP V6/V11: MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8.

## 0. Kết luận ngắn

1. **Bars-fade đã vào cả 4 harness** (V11/V12/V14 + V13): nhánh
   composite riêng — dải → B thuần, nền → A\*(1-p)+B\*p, đánh giá
   tại CHỈ SỐ pixel nguyên X qua hàm thật `barsFadePixelIsBar`
   (fallback nội bộ cùng công thức). Không còn PENDING/FAIL giả
   cho kind này.
2. **V13 đã sửa xong, và phát hiện khác mô tả nhiệm vụ:** V13 KHÔNG
   dùng rasterizer circle cosin cũ — nó THIẾU HẲN nhánh
   radial-gradient (circleopen/circleclose rơi vào default → mask
   rỗng → frame đen). Baseline 320×180 p=0,5: bars-fade MAD 84,833,
   circleopen MAD 83,819, B% preview 0,00 — cả hai đều FAIL giả.
   Nhánh mới: smoothstep thật từ `radialGradientWeight`, tâm/rMax
   lấy từ chính region (floor(W/2), floor(H/2), hypot — hiệu chuẩn
   đợt 14 R4), đánh giá tại chỉ số nguyên. Nhánh "circle" biên
   cứng cũ GIỮ NGUYÊN vì nó đúng cho circlecrop (vùng circle thật,
   không phải gradient) — không phải "rasterizer cũ" cần thay.
3. **Badge đã nâng cả 5 kind** (blinds-h/plus/checker/grid/bars-fade)
   trong `previewStatus.ts`, vì điều kiện nhiệm vụ đã đủ: cả 5 đều
   KHỚP qua harness (không còn chỉ qua script /tmp). Phạm vi nhãn
   ghi rõ trong chú thích file đó và §4 dưới đây — bars-fade vẫn
   giữ giới hạn canvas đơn clip (không vẽ được crossfade thật).

## 1. Việc đã làm (theo file)

### V11 / V12 / V14 — nhánh bars-fade + 5 case mới mỗi harness
- Thêm `barsFadeIsBarFn` (ưu tiên hàm thật từ module
  `transitionPreview`, fallback cùng công thức mod) + nhánh
  `hasBarsFade` trong `rasterizeTransitionPreview` (đặt sau nhánh
  radial, trước nhánh geometric/fade): dải → B thuần, nền →
  A\*(1-p)+B\*p. Cả 2 lớp bars-fade đều full-frame, alpha=1 theo
  case `bars-fade` trong `describeTransition`, nên nhánh này không
  nhân thêm alpha từng lớp — nếu sau này case đó đổi alpha thì
  nhánh này phải sửa theo (xem §5).
- V14 thêm `"bars-fade"` vào `SUPPORTED_REGION_KINDS` (trước đây
  kind này sẽ PENDING vì không thuộc tập hỗ trợ) và log load hàm
  thật trong phần T.
- Mỗi harness thêm đúng 5 case vào danh sách case transition:
  bars-fade, blinds-h, plus, checker, grid. Các kind rects
  (blinds-h/plus/checker/grid) vốn đã raster được qua nhánh rects
  sẵn có — việc thêm case là để harness ĐO chúng, không phải sửa
  rasterizer cho chúng. Không đụng phần text/effect/V3 của V12,
  không đụng phần E của V14.

### V13 — nhánh radial-gradient + bars-fade + mở rộng --check
- Thêm `layerPixelAlphaV13` (mirror V11/V12: smoothstep qua hàm
  thật `radialGradientWeight`, tâm/rMax từ region, chỉ số nguyên)
  + `barsFadeIsBarV13` + nhánh `hasRadial`/`hasBarsFade` trong
  `rasterizeV12` (rasterizer tham chiếu per-pixel).
- `rasterizeV13` (scanline): radial-gradient/bars-fade không biểu
  diễn được bằng mask nhị phân nên đi đường per-pixel (như
  `rasterizeV12`) và return sớm; các kind mask khác vẫn đi đường
  scanline nhanh. Giá phải trả: ở 1920×1080, case circle/bars-fade
  raster per-pixel ~0,7–3,8s/case (xem log V13: preview 667–3844ms
  cho circle, 136–344ms cho bars-fade — bars-fade rẻ vì không có
  hypot; circle đắt vì hypot từng pixel).
- `--check` mở rộng thêm circleopen/circleclose/bars-fade vào danh
  sách đối chiếu 2 rasterizer ở 72×45.
- Load hàm thật (`radialGradientWeight`, `barsFadePixelIsBar`) đặt
  ngay sau khi load module, trước cả nhánh `--check` lẫn đo chính.

### Badge — `previewStatus.ts`
- Thêm blinds-h, plus, checker, grid, bars-fade vào
  `TRANSITION_MATCHED` + chú thích số đo/phạm vi ở đầu file (theo
  tiền lệ circleopen/dissolve/circle-soft: đổi nhãn sau khi có số
  đo harness, không trước).

## 2. Số đo thật (FFmpeg 8.1.2, nguồn đỏ/xanh phẳng)

### V11 — 29 case (25 transition + 4 text), FAIL: không có
| Case mới | MAD | ≤8 | Hạng |
|---|---|---|---|
| bars-fade | 0,30 | 100,0% | KHỚP |
| blinds-h | 0,00 | 100,0% | KHỚP |
| plus | 0,00 | 100,0% | KHỚP |
| checker | 0,00 | 100,0% | KHỚP |
| grid | 0,00 | 100,0% | KHỚP |
- Toàn bộ case cũ giữ nguyên (24 case trước đó vẫn không FAIL);
  B% render = preview ở cả 5 case mới (bars-fade 55,6%;
  blinds-h 51,1%; plus 65,2%; checker 50,0%; grid 27,0%).
- Lệnh: `node src/test_v11_parity.js` từ `server/render/`.

### V12 — 37 case (A 12 + A2 V3 14 + B text 4 + C effect 7), FAIL: không có, PENDING V3: không có
- 5 case mới cho số giống hệt V11 (bars-fade 0,30; còn lại 0,00;
  ≤8 = 100%) — hai harness độc lập cho cùng số, đúng kỳ vọng vì
  cùng mô hình.
- Lệnh: `node src/test_v12_parity.js` từ `server/render/`.

### V14 — KHỚP 20 (trước: 15), XẤP XỈ 2, LỆCH 0, PENDING 0, STAT-APPROX 1, STRUCT-OK 1
| Case mới | MAD | ≤8 | Hạng |
|---|---|---|---|
| bars-fade | 0,296 | 100,0% | KHỚP |
| blinds-h | 0,000 | 100,0% | KHỚP |
| plus | 0,000 | 100,0% | KHỚP |
| checker | 0,000 | 100,0% | KHỚP |
| grid | 0,000 | 100,0% | KHỚP |
- 5 case mới cộng đúng 5 vào KHỚP (15 → 20); effect và các case
  transition cũ không đổi; PENDING vẫn 0 (không còn nhánh PENDING
  nào cho bars-fade).
- Lệnh: `node src/test_v14_parity.js` từ `server/render/`.

### V13 HD — 21 case (7 type × p=0,25/0,5/0,75) ở 1920×1080, FAIL: không có
| Type | p=0,25 | p=0,5 | p=0,75 | ≤8 |
|---|---|---|---|---|
| circleopen | 0,440 | 1,200 | 0,178 | 100% |
| circleclose | 0,529 | 1,162 | 0,098 | 100% |
| bars-fade | 0,750 | 0,333 | 0,167 | 100% |
| blinds-h | 0,249 | 0,165 | 0,081 | 100% |
| plus | 0,214 | 0,119 | 0,048 | 100% |
| checker | 0,250 | 0,167 | 0,083 | 100% |
| grid | 0,311 | 0,247 | 0,142 | 100% |
- Lệnh: `node src/test_v13_hd_parity.js --only
  circleopen,circleclose,bars-fade,blinds-h,plus,checker,grid`
  (mặc định 1920×1080, 3 p). Trước sửa, cùng lệnh ở 320×180 cho
  bars-fade/circleopen FAIL giả (MAD ~84, B% preview 0).
- `--check` sau sửa: lệch V12-vs-V13 lớn nhất 0 pixel trên 19 type
  (V3 14 + EXTRA 2 + circleopen/circleclose/bars-fade).
- Phần dư MAD ở HD (0,05–1,20, khác 0,00 ở 72×45 cho cùng type
  rects) là sàn yuv của lavfi (đỏ render 254 thay vì 255) + làm
  tròn blend trên nhiều pixel gradient — không phải sai hình
  học: B% render = preview tới 2 chữ số thập phân ở hầu hết case,
  không pixel nào lệch > 8. Circleopen p=0,5 MAD 1,200 ở cả
  320×180 và 1920×1080 (trùng nhau) củng cố đây là sàn đo, không
  phải nhiễu ngẫu nhiên.

### Kiểm chứng khác
- `node apps/web/src/lib/transitionPreview.test.ts`: 26/26 pass
  (không sửa `transitionPreview.ts` nên không đổi).
- `npx tsc --noEmit` (apps/web): CHỈ 1 lỗi, KHÔNG thuộc luồng này:
  `src/components/speed/nestedStore.test.ts(39,8)` TS5097
  (import `../nested/nestUtils.ts` kèm đuôi `.ts`) — file của
  luồng khác (nested), luồng này KHÔNG sửa để tránh xung đột với
  luồng đó; 0 lỗi trong các file luồng này chạm tới
  (`previewStatus.ts` sạch). Vì vậy `npm run build` (tsc &&
  vite build) hiện bị chặn bởi lỗi đó, không phải bởi luồng này.
- `npx vite build` (riêng lẻ, không qua script build): pass,
  25,98s. `dist/` tái tạo là build artifact, KHÔNG đưa vào batch
  stage.

## 3. V13: kết quả kiểm tra "rasterizer circle cũ"

- Nhiệm vụ hỏi: V13 có dùng rasterizer circle cũ (cosin/tâm chưa
  cắt nguyên) không? Trả lời: KHÔNG — V13 không có cosin, cũng
  không có nhánh radial-gradient nào. V11/V12 mới là nơi từng có
  fallback cosin (đã bỏ ở đợt 15 T1). V13 chỉ có nhánh "circle"
  biên cứng (đúng cho circlecrop) và default rỗng (sai cho
  circleopen/circleclose). Sửa theo đúng mô hình đợt 14 (smoothstep
  + tâm floor(W/2), floor(H/2) từ region) và chạy lại case circle
  HD: circleopen/circleclose KHỚP ở cả 3 p tại 1920×1080 (bảng §2).
- V13 vẫn CHƯA hỗ trợ `radial-soft` (circle-soft) và
  `dissolve-noise` (dissolve): `--only circle-soft/dissolve` sẽ
  cho frame đen → LỆCH (không phải PENDING — V13 không có khái
  niệm PENDING cho kind). Badge circle-soft/dissolve vẫn giữ
  nguyên (đã matched từ đợt 14/15 qua harness khác), nhưng V13
  chưa phải là bằng chứng cho 2 kind đó — ghi rõ để đợt sau khỏi
  hiểu lầm "V13 đã phủ hết".

## 4. Badge: phạm vi nhãn sau khi nâng

- 5 badge mới có giá trị ở mức **mô hình composite vs render
  xfade trên nguồn phẳng**: 72×45 p=0,5 (V11/V12/V14) + 1920×1080
  p=0,25/0,5/0,75 (V13). Chưa có: footage thật, yuv420p e2e, clip
  dài, p khác các điểm đã đo (V11/V12/V14 chỉ đo p=0,5).
- Riêng bars-fade: canvas đơn clip trong `preview.tsx` vẫn KHÔNG
  vẽ được crossfade (chỉ vẽ dải/nền bằng rects cho từng clip) —
  đây là giới hạn kiến trúc đã ghi trong comment kind
  bars-fade, không phải lỗi của badge: nhãn matched ở đây nghĩa
  là "mô hình transition đã khớp render", như tiền lệ
  dissolve/circle (preview thật cũng vẽ từng clip riêng lẻ trên
  nền đen). Đừng đọc nhãn này thành "canvas đã vẽ đúng crossfade
  bars-fade".
- Các type khác trong `previewStatus.ts` không đổi.

## 5. Nợ còn lại / giới hạn (trung thực)

- 4 harness nay chứa 4 bản copy của logic bars-fade (V11/V12/V13/
  V14, nối tiếp 3 bản copy radial/dissolve từ đợt 15) — sửa mô
  hình sau này phải sửa cả 4 nơi (hoặc tách module raster dùng
  chung ở đợt sau, như nợ đã ghi từ đợt 15).
- Nhánh bars-fade trong 4 harness giả định cả 2 lớp full-frame,
  alpha=1 (đúng case `bars-fade` hiện tại). Nếu case đó đổi alpha
  hoặc thêm transform, nhánh này cho số sai mà không báo.
- V13: radial-soft + dissolve-noise chưa hỗ trợ (xem §3); đường
  per-pixel cho circle ở HD tốn 0,7–3,8s/case (chấp nhận được cho
  harness, không phải FPS canvas).
- `tsc` toàn apps/web vẫn còn 1 lỗi của luồng khác
  (nestedStore.test.ts:39) — parent gộp batch cần xác nhận luồng
  đó sửa trước khi chạy `npm run build` gộp; luồng này cố tình
  không đụng file đó.
- Click-test browser thật vẫn là nợ mở chung của repo (mọi số
  trên là composite mô hình vs render FFmpeg, chưa phải pixel
  canvas trình duyệt).
- `dist/` tái tạo bởi vite build là artifact, không stage.

## 6. File đã đổi/thêm (đường dẫn tương đối repo — parent stage)

- `server/render/src/test_v11_parity.js` (SỬA — nhánh bars-fade +
  hàm thật/fallback + 5 case mới)
- `server/render/src/test_v12_parity.js` (SỬA — như V11, chỉ phần A)
- `server/render/src/test_v13_hd_parity.js` (SỬA — nhánh
  radial-gradient smoothstep + bars-fade cho cả 2 rasterizer +
  load hàm thật + --check mở rộng)
- `server/render/src/test_v14_parity.js` (SỬA — bars-fade vào
  SUPPORTED + nhánh composite + 5 case mới)
- `apps/web/src/components/transitions/previewStatus.ts` (SỬA —
  thêm 5 type vào TRANSITION_MATCHED + chú thích số đo/phạm vi)
- `docs/PHASE9_ROUND16_H1_HARNESS_LIMITS.md` (MỚI — chính file này)

KHÔNG đổi: `apps/web/src/lib/transitionPreview.ts`,
`server/render/src/transitions.js`, `apps/web/src/preview.tsx`,
mọi file test khác, workflow, binary, `paths-loop/`,
`build-loop-log.md`.
