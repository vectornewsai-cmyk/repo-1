# Phase 9 đợt 15, luồng T2 — grid + bars-fade: LIMITS (trung thực)

> Đợt 15, luồng T2. KHÔNG push, KHÔNG release/tag, KHÔNG file binary,
> KHÔNG đưa `dist/` vào kết quả (vite build có tái tạo `dist/` trên đĩa,
> đó là build artifact, không tính là file đổi).
> Nợ gốc: `docs/PHASE9_ROUND14_LIMITS.md` §3 (grid sai chữ L, bars-fade
> thiếu nền crossfade). FFmpeg 8.1.2, nguồn A đỏ / B xanh phẳng qua
> lavfi (như harness V13).

## 1. Grid: từ chữ L sai thành ô vuông đúng — ĐÓNG

### Lỗi cũ (đã xác nhận bằng render thật, không phải suy đoán)
- Expr render: `max(mod(X,s),mod(Y,s)) <= P*s`, `s = min(W,H)/8`.
  `max <= thr` nghĩa là CẢ 2 mod đều <= thr → B là 1 ô vuông ở góc
  trên-trái mỗi ô. Mô hình cũ vẽ dải trên + dải trái (chữ L).
- Probe 64x40 p=0.5: pixel (3,3) và (1,3) render ra A, (2,2) ra B —
  mô hình L cho B ở cả 2 pixel đầu. Chữ L sai thật, không phải
  chỉ lệch biên.

### Cách sửa (chỉ code path grid trong `transitionPreview.ts`)
- B mỗi ô = 1 rect duy nhất; A mỗi ô = dải phải + dải dưới (không
  giao nhau, hợp lại đúng bằng ô trừ đi vuông B).
- Rect là "thực thi pixel nguyên" của vuông liên tục
  `[x0, x0+p*s] x [y0, y0+p*s]`: FFmpeg đánh giá tại CHỈ SỐ pixel
  nguyên X, Y, nên B trong ô i là
  `X ∈ [ceil(x0), floor(x0+p*s)]` (cắt theo ô), tương tự cho Y.
  Rect nguyên `[a, a+w)` raster đúng cả bằng luật tâm pixel lẫn
  scanline, kể cả khi s phân số (320x180: s=22.5, ô 1 cho B là
  X=23..33 — rect liên tục `[22.5, 33.75)` sẽ cho thêm X=22 sai).
  Tại p=0, ô có gốc nguyên vẫn có đúng 1 pixel B ở góc (mod <= 0),
  đúng render — không phải rỗng.
- Không đụng code path circle-soft (luồng T6 giữ), không đụng harness
  V11/V12/V14 (luồng T1 giữ). Test cũ ghim chữ L (128 rect B) đã
  sửa theo mô hình mới (64 rect B, ô (0,0) là 7x7 tại 100x100).

### Số đo parity (render FFmpeg thật so với preview composite,
thang KHỚP = MAD <= 2 và >= 99% pixel lệch <= 8)
| case | CŨ (chữ L) | MỚI (ô vuông) |
|---|---|---|
| 320x180 p=0.25 | MAD 67.61, le8 60.3% — LỆCH | MAD 0.31, le8 100.0% — KHỚP |
| 320x180 p=0.50 | MAD 85.01, le8 49.9% — LỆCH | MAD 0.24, le8 100.0% — KHỚP |
| 320x180 p=0.75 | MAD 62.53, le8 63.2% — LỆCH | MAD 0.14, le8 100.0% — KHỚP |
| 1280x720 p=0.25 | MAD 62.97, le8 63.0% — LỆCH | MAD 0.31, le8 100.0% — KHỚP |
| 1280x720 p=0.50 | MAD 83.05, le8 51.1% — LỆCH | MAD 0.24, le8 100.0% — KHỚP |
| 1280x720 p=0.75 | MAD 61.48, le8 63.8% — LỆCH | MAD 0.14, le8 100.0% — KHỚP |
- Phần dư MAD mới (0.14–0.31) là sàn đo, không phải sai mô hình:
  lavfi đỏ qua yuv→rgb cho 254 thay vì 255 (B% render = B% preview
  tới 2 chữ số thập phân ở mọi case). Không có pixel nào lệch > 8.
- Kiểm chứng độc lập bằng harness V13 có sẵn (không sửa harness):
  `test_v13_hd_parity.js --only grid` cho 6/6 KHỚP ở cả 2 kích thước,
  B% render = preview (7.42/26.51/57.38 ở 320x180;
  6.83/26.51/57.38 ở 1280x720), 0 lỗi render.

## 2. Bars-fade: dạy preview nền crossfade — ĐÓNG Ở TẦNG MÔ HÌNH

### Vì sao rects thuần không bao giờ đủ (chứng minh, không phải cảm tính)
- Expr render: `if(lt(mod(X,W/8),P*W/8),B,A*(1-P)+B*P)` — dải là
  B thuần, nền là crossfade. Với 2 lớp phẳng mỗi lớp 1 alpha duy
  nhất, không có cách gán alpha nào cho ra đồng thời "dải = B thuần"
  và "nền = A*(1-p)+B*p" (lớp phủ cả 2 vùng thì dải cũng bị blend,
  lớp chỉ phủ 1 vùng thì nền thiếu 1 trong 2 màu). Vì vậy phải có
  kind riêng — đúng tiền lệ radial-gradient (circle) và
  dissolve-noise (dissolve) trong cùng file này.
- Probe xác nhận nền đúng là crossfade: p=0.5 nền (127,0,127);
  p=0.25 nền (190,0,62); p=0.75 nền (63,0,190). Dải luôn B thuần.

### Cách sửa (chỉ code path bars-fade trong `transitionPreview.ts`,
cộng 1 nhánh tương thích bars-fade-only trong `preview.tsx`)
- Kind mới `bars-fade { p, bandW }`: CẢ 2 lớp A và B mang cùng 1
  kind (blend là thuộc tính của cặp, không của riêng 1 lớp, khác
  dissolve-noise có invert riêng từng lớp).
- Quy tắc composite mà rasterizer PHẢI tuân theo (ghi trong comment
  kind, rasterizer của luồng này đã tuân theo đúng luật này):
  với X là CHỈ SỐ pixel nguyên, mod float như FFmpeg:
  `barsFadePixelIsBar(X, bandW, p)` đúng → B thuần; còn lại →
  `A*(1-p) + B*p`. Đánh giá tại tâm pixel (x+0.5) sẽ lệch 1 cột/dải
  (probe W=73, bandW=9.125, p=0.5: X=5 là nền, X=10 là dải).
- Helper export mới: `barsFadePixelIsBar(x, bandW, p)`.
- Nhánh `preview.tsx` (bars-fade-only): canvas đơn clip chỉ có 1
  clip nên KHÔNG vẽ được crossfade — nhánh này vẽ dải cho clip vào
  / nền cho clip ra bằng rects, đúng hành vi cũ. Không có nhánh
  này, `applyTransitionLayer` sẽ clip theo path rỗng và clip
  bars-fade biến mất khỏi canvas. Nhánh này không đổi hành vi hiển
  thị so với trước, chỉ giữ canvas không hồi quy khi kind đổi.

### Số đo parity (cùng frame render với bảng grid, cùng thang)
| case | CŨ (nền A thuần) | MỚI (kind bars-fade) |
|---|---|---|
| 320x180 p=0.25 | MAD 31.75, le8 25.0% — LỆCH | MAD 0.75, le8 100.0% — KHỚP |
| 320x180 p=0.50 | MAD 42.50, le8 50.0% — LỆCH | MAD 0.33, le8 100.0% — KHỚP |
| 320x180 p=0.75 | MAD 31.83, le8 75.0% — LỆCH | MAD 0.17, le8 100.0% — KHỚP |
| 1280x720 p=0.25 | MAD 31.75, le8 25.0% — LỆCH | MAD 0.75, le8 100.0% — KHỚP |
| 1280x720 p=0.50 | MAD 42.50, le8 50.0% — LỆCH | MAD 0.33, le8 100.0% — KHỚP |
| 1280x720 p=0.75 | MAD 31.83, le8 75.0% — LỆCH | MAD 0.17, le8 100.0% — KHỚP |
- le8 của mô hình cũ đúng bằng tỉ lệ dải (25/50/75%) — tức mọi pixel
  nền đều lệch, đúng như chẩn đoán "thiếu nền crossfade".
- Phần dư MAD mới (0.17–0.75) là sàn yuv + làm tròn blend
  (preview blend trên 255, render trên 254, lệch tối đa 2/kênh tại
  p=0.25: preview (191,0,64) vs render (190,0,62)). Không pixel nào
  lệch > 8.

## 3. Kiểm chứng không hồi quy (đã chạy)
- `node apps/web/src/lib/transitionPreview.test.ts`: 26/26 pass
  (gồm test mới đợt 15 T2: grid đúng luật expr nguyên toàn khung
  tại p=0.25/0.5/0.75 + bars-fade kind/helper; và toàn bộ test cũ,
  gồm circleopen/circleclose, dissolve, circle-soft của T6,
  blinds-h/plus/checker của T6 — không test nào bị sửa kết quả
  ngoài assertion grid chữ L cũ).
- `tsc --noEmit` (apps/web): 0 lỗi.
- `vite build` (apps/web): pass (24.40s; `dist/` tái tạo, không stage).
- Harness V13 `--only grid`: 6/6 KHỚP (xem §1). Không chạy V13 cho
  bars-fade vì rasterizer V13 chưa biết kind mới — xem §4.

## 4. Nợ còn lại (trung thực — không giấu)
- **Harness chưa hiểu kind bars-fade (thuộc luồng T1, không phải T2
  tự ý sửa):** V11/V12/V14 hiện tại không có nhánh cho kind này
  (V14 sẽ báo PENDING vì kind không thuộc SUPPORTED_REGION_KINDS;
  V11/V12 raster mặc định kind lạ thành không phủ → frame đen).
  Số KHỚP của bars-fade ở §2 đo bằng rasterizer riêng của luồng này
  (script `/tmp`, tuân đúng quy tắc trong comment kind), KHÔNG phải
  bằng harness V11/V12/V14. Muốn harness báo KHỚP cho bars-fade thì
  T1 phải thêm nhánh composite theo đúng quy tắc đó (dải → B thuần
  tại chỉ số nguyên, nền → blend). Cho đến khi đó, đừng claim
  "harness V14 pass bars-fade".
- **Canvas đơn clip vẫn không thấy crossfade thật:** nhánh
  `preview.tsx` chỉ giữ hành vi cũ (dải/nền thuần từng clip). Đây là
  giới hạn kiến trúc đã ghi ở header `transitionPreview.ts`
  (preview đặt clip kề nhau, không chồng cặp như xfade render),
  không phải lỗi của kind này. Composite đúng chỉ tồn tại ở tầng
  mô hình + harness hiểu kind.
- **Badge `previewStatus.ts` KHÔNG nâng cho bars-fade/grid:**
  badge gắn với canvas (xem §4 trên) nên bars-fade vẫn "approx" ở
  canvas là đúng; grid vẽ rects đúng nhưng luồng này không đổi
  badge để tránh đụng phần luồng khác — parent quyết định có nâng
  badge grid hay không.
- **Phạm vi đo:** nguồn phẳng đỏ/xanh qua lavfi (yuv floor 254);
  chưa đo footage thật, 4K, yuv420p/16-bit, clip dài; p render mới
  đo 0.25/0.5/0.75 (p=0/1 của grid chỉ kiểm bằng luật expr trong
  unit test, chưa render frame); blend bars-fade trên footage thật
  có thể lệch thêm vài đơn vị do xfade tính trong không gian yuv
  (trên nền phẳng đã đo lệch tối đa 2).
- **Không đụng:** code path circle-soft (T6), harness V11/V12/V14
  (T1), `previewStatus.ts`, render worker (`transitions.js` không
  đổi — expr render vốn đã đúng, lỗi chỉ ở phía preview).
- Script đo của luồng này nằm ở `/tmp` (t2_measure.mjs, t2_probe.js,
  t2_probe2.js), không đưa vào repo — số đo trong file này đủ để
  tái tạo (cùng phương pháp pipe lavfi như V13, DUR 0.4, OFFSET 1.0,
  FPS 30, frame đích 30+round(p*12)).

## 5. File đã đổi (đường dẫn tương đối trong repo)
- `apps/web/src/lib/transitionPreview.ts` — kind `bars-fade` mới +
  helper `barsFadePixelIsBar` + case bars-fade mới + case grid mới
  (ô vuông, thực thi pixel nguyên). Không sửa case circle-soft hay
  case nào khác.
- `apps/web/src/lib/transitionPreview.test.ts` — sửa assertion grid
  chữ L cũ + thêm test đợt 15 T2 (grid luật expr nguyên toàn khung,
  bars-fade kind/helper).
- `apps/web/src/preview.tsx` — nhánh bars-fade-only trong
  `drawVideoClipWithTransition` (giữ hành vi canvas cũ, chống clip
  rỗng do kind mới). Không sửa nhánh radial/dissolve/circle-soft.
- `docs/PHASE9_ROUND15_T2_GRID_BARS_LIMITS.md` — file này.
