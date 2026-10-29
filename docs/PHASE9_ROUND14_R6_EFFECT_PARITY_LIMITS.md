# Phase 9 đợt 14 — Luồng R6: effect parity residuals + harness tổng hợp V14 (LIMITS)

Ngày: 2026-10-27. Một luồng trong đợt lớn Phase 9 đợt 14 (chủ đề:
preview–render parity vòng 5, đóng nợ đợt 13). KHÔNG push, KHÔNG
tag/release, KHÔNG binary. Chỉ sửa file trên đĩa; batch stage do parent
đợt lớn tổng hợp (luồng này KHÔNG tự tạo file paths-loop riêng).

## 0. Nợ nhận từ đợt 11 P2 (điểm xuất phát)

Đợt 11 P2 đã KHỚP pixelate / shake / rgb-shift / mirror, còn để lại
4 type xấp xỉ: edgedetect khác cấu trúc, sharpen chỉ xấp xỉ (kernel
khác), noise/glitch chỉ xấp xỉ thống kê. Luồng này đo lại cả 4, cải
thiện được 2 (sharpen lên KHỚP, edgedetect + glitch cải thiện rõ nhưng
vẫn XẤP XỈ), giữ nguyên 1 (noise — đã khớp thống kê, không có gì để
cải thiện thêm mà không bịa).

Ngưỡng phân loại giữ đúng thang V6/V11/V12 (để so sánh được):
KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8 (lệch max theo kênh, như hàm
compare của harness parity); XẤP XỈ = MAD ≤ 20 và ≥ 90% pixel lệch
≤ 32. Trừ khi ghi chú khác, MAD dưới đây tính theo giá trị kênh
(theo cách của thí nghiệm R6); harness V14 và parity test dùng cách
max-kênh cho ≤8/≤32 nên 2 bảng số có thể lệch nhau vài phần mười ở
cột ≤8 (vd glitch) — đó là khác biệt định nghĩa, không phải sai số.

Máy đo: FFmpeg 8.1.2 trên VM này. Nguồn tổng hợp: pattern
(R = x·4, G = y·5, B = x + y·3), step dọc (trái 0 / phải 255), và nguồn
"tự nhiên" (gradient mượt + hình chữ nhật đỏ + tròn xanh + biên chéo
trắng). Số đo chỉ đúng các nguồn này, chưa phải footage thật/HD/clip
dài — đừng claim hơn.

## 1. Sharpen: từ XẤP XỈ lên KHỚP (đổi mô hình, đã nâng badge)

### Phát hiện

Render `unsharp=5:5:amount:5:5:0` có chroma amount = 0, tức chỉ làm sắc
nét luma. Bản preview cũ làm sắc nét từng kênh RGB bằng box-blur 3×3
nên càng tăng cường độ càng lệch: trên nguồn tự nhiên, MAD cũ 0.96
(t=0) → 2.21 (t=0.25) → 3.31 (t=0.5) → 4.96 (t=1).

### Mô hình mới (effectCanvas.ts `applySharpen`)

Độ sáng Y (BT.601) qua Gaussian tách được [1,4,6,4,1]/16 (5×5, biên
clamp-to-edge), delta Y = amount·(Y − blurY) cộng đều vào R,G,B,
amount = 0.2 + t·1.8 (mirror render). Hệ số Gaussian và thang luma
được chọn bằng đo, không đoán: box 3×3 luma (MAD 0.58/0.82), box 5×5
luma (0.79/1.45), Gaussian 5×5 luma (0.46/0.53) trên pattern/tự nhiên
t=0.5; nhân amount ×0.5/×0.75/×1.5/×2 đều tệ hơn ×1.0.

### Số đo sau đổi (16 điểm, pattern + tự nhiên, t = 0/0.25/0.5/1, 72×45 và 144×90)

| Nguồn | t=0 | t=0.25 | t=0.5 | t=1 |
|---|---|---|---|---|
| pattern 72×45 | MAD 0.43, ≤8 100% | 0.43, 100% | 0.46, 100% | 0.47, 99.9% |
| tự nhiên 72×45 | 0.46, 100% | 0.47, 100% | 0.53, 100% | 0.61, 99.7% |
| pattern 144×90 | 0.44, 100% | 0.44, 100% | 0.47, 99.9% | 0.58, 99.5% |
| tự nhiên 144×90 | 0.40, 100% | 0.40, 100% | 0.42, 100% | 0.45, 99.9% |

Tất cả 16 điểm đều đạt ngưỡng KHỚP. Parity test
(effectCanvas.parity.test.ts, hàm compare max-kênh) xác nhận lại:
t=0.5 MAD 0.456 ≤8 100%, t=1 MAD 0.466 ≤8 99.8%.

### Badge

`previewStatus.ts`: sharpen chuyển từ EFFECT_CANVAS_APPROX sang
EFFECT_CANVAS_MATCHED; test badge v5 cập nhật theo (MATCHED 5 type,
APPROX còn 3). Chỉ nâng đúng type này vì chỉ nó có đủ 16 điểm đo;
không nâng theo cảm tính cho edgedetect/noise/glitch.

### Giới hạn còn lại của sharpen

- Phần dư MAD ~0.4–0.6 không phải lỗi mô hình: cùng bản chất với
  phần dư pixelate 0.667 (làm tròn chuyển đổi YUV của FFmpeg). Đừng
  cố "sửa" nó bằng hệ số hiệu chỉnh — mọi biến thể đã thử đều tệ hơn.
- Chưa đo trên footage thật, HD 1080p, clip dài, và chưa đo khi
  sharpen xếp chồng với effect khác (thứ tự chuỗi filter).

## 2. Edgedetect: cải thiện mọi nguồn, vẫn XẤP XỈ (không nâng badge)

### Mô hình mới (effectCanvas.ts `applyEdgeDetect`)

Sobel → NMS theo hướng gradient → ngưỡng kép + hysteresis, giữ lại
magnitude/4 cho pixel qua hysteresis. Hai chi tiết quyết định, đều có
bằng chứng đo:

1. **Thang ngưỡng là magnitude/4, không phải magnitude Sobel thô.**
   Sobel thô tới 4×255, còn ngưỡng render low/high là phần của 255
   (t=0.5 → low 51, high 114.75). Bản cũ so magnitude thô với 51/114.75
   nên gần như mọi biên đều bão hoà 255. Render cũng KHÔNG nhị phân:
   trên nguồn tự nhiên, frame render có 31 giá trị khác nhau (không
   chỉ 0/255) — vì vậy mô hình giữ magnitude (thay vì nhị phân hoá)
   là đúng cấu trúc hơn.
2. **NMS cần tie-break nghiêm (m >= m1 && m > m2).** Dải Sobel của
   một biên dọc hoàn hảo là plateau 2 cột bằng nhau; tie-break đối
   xứng (>= cả 2 phía) giữ cả 2 cột và cho đúng số cũ. Tie-break
   nghiêm mỏng plateau thành 1 cột.

### Số đo (t=0.5, low=0.2, high=0.45)

| Nguồn | Sobel tuyến tính cũ | NMS + hysteresis giữ magnitude (mới) | NMS nhị phân high (đối chiếu) |
|---|---|---|---|
| step dọc | MAD 6.77 | **3.86** | 6.77 |
| tự nhiên | 13.85 | **8.53** | 7.09 |
| pattern | 5.75 | **1.33** (≤8 99.3% — đạt KHỚP trên nguồn này) | 4.49 |

Mô hình mới được chọn vì tốt nhất trên tổng 3 nguồn (13.7 so với
19.1 của hysteresis nhị phân và 18.3 của nhị phân high) và đúng cấu
trúc Canny nhất (NMS + hysteresis + giữ magnitude). Nhị phân high
thắng riêng trên nguồn tự nhiên (7.09 so với 8.53) nhưng thua trên
step và phi cấu trúc (vứt bỏ giá trị trung gian mà render thực sự
xuất ra) nên không chọn.

Parity test xác nhận lại (compare max-kênh): step MAD 3.856
≤8 98.5%, tự nhiên MAD 8.528 ≤8 94.7% — đều trong band XẤP XỈ.

### Vì sao không thể KHỚP: hành vi plateau của Canny FFmpeg

Trên step dọc hoàn hảo, frame render chỉ có **4 pixel sáng: cột 36,
hàng 1, 2, 42, 43** (đo lặp lại, cả frame đơn và frame 15/30 — khớp
ghi nhận đợt 11 P2). Một biên dọc hoàn hảo mà Canny chỉ giữ lại 4
pixel ở gần biên trên/dưới khung là hành vi plateau + xử lý biên của
chính FFmpeg, không phải biên "thật" mà mô hình Sobel hợp lý nào cũng
tái tạo được. Ép mô hình bắt chước đúng 4 pixel đó là overfit nguồn
tổng hợp. Kết luận: edgedetect giữ badge "approx". Muốn kết luận về
footage thật cần đo trên ảnh có biên tự nhiên trước — trên nguồn tự
nhiên của luồng này, render vẫn cho biên mỏng, hợp lý (168 pixel),
và mô hình mới đã gần nó hơn hẳn bản cũ.

### Lưu ý về test unit

Ảnh test edgedetect cũ chỉ set kênh R (lum step 76 → magnitude/4 =
76, chỉ đạt ngưỡng weak nên hysteresis loại hết). Test đã sửa thành
trắng đủ kênh (lum step 255 → strong) và kỳ vọng đúng 1 cột sáng
(cột 3, cột 4 bị NMS triệt tiêu) — đó là hành vi Canny, không phải
lỗi test cũ "sai" mà là ngưỡng mới chặt chẽ hơn về mặt cấu trúc.

## 3. Noise: giữ nguyên mô hình (đã khớp thống kê)

Đo trên nguồn phẳng 128, t=0.5 (alls=28):

- Render 2 lần cho kết quả byte-identical (100%): với 1 frame đầu
  vào, nhiễu của render là xác định theo lần chạy — nhưng preview
  dùng seed khác nên vẫn không thể khớp từng frame; và với video
  nhiều frame, nhiễu render đổi theo thời gian (allf=t) nên không có
  seed tĩnh nào khớp được mọi frame. Đó là giới hạn thiết kế, không
  phải bug.
- Thống kê: std render theo kênh 15.70 / 15.40 / 15.64; std preview
  (uniform [-28, +28], seed 42) 15.90 / 15.89 / 15.87 — tỉ lệ
  1.01–1.03, tức khớp trong ~3%. Tương quan kênh render ≈ 0 (độc lập).
- Hình dạng phân phối khác nhau: histogram render hình chuông, lệch
  tới −47/+64 (vượt ±strength) — vì nhiễu cộng trên các mặt phẳng YUV
  rồi chuyển lại RGB, không phải uniform thuần trên RGB. Đổi preview
  sang Gaussian cũng chỉ đổi hình dạng histogram, không cải thiện
  MAD từng frame (hai nhiễu độc lập luôn cho MAD ~18), nên giữ mô
  hình uniform đơn giản, trung thực về std. MAD preview-vs-render
  1 frame cụ thể = 18.18 (chỉ tham khảo, không phải chỉ số chất lượng
  cho effect ngẫu nhiên).
- Badge giữ "approx". Harness V14 phân loại noise là STAT-APPROX khi
  tỉ lệ std 3 kênh đều trong [0.8, 1.25].

## 4. Glitch: đổi mô hình từ slice sang đúng cấu trúc render, vẫn XẤP XỈ

### Phát hiện: render không có slice

Render glitch = `rgbashift=rh=s:bh=-s,noise=alls=ns:allf=t` với
s = 6 + t·10, ns = round(10 + t·20) — không có bất kỳ lát ngang dịch
nào. Mô hình slice cũ của preview là hình dung sai về render.

### Mô hình mới (effectCanvas.ts `applyGlitch`)

Rgb-shift (đỏ phải s, xanh trái s, lục giữ nguyên, vùng trống đen)
rồi cộng nhiễu đều [-ns, +ns] có seed xác định. Chữ ký hàm không đổi
(img, intensity, seed) nên preview.tsx và canvasEffectOps không cần
sửa; seed vẫn đổi theo frame (12 lần/giây) để glitch "sống" như render.

### Số đo (t=0.5, s=11, ns=20)

| Nguồn | Slice cũ | Rgb-shift + noise (mới) | Chỉ rgb-shift (đối chiếu) |
|---|---|---|---|
| pattern | MAD 30.11 | **18.58** | 14.93 |
| tự nhiên | MAD 37.08 | **22.26** | 18.94 |

Đọc đúng bảng này: mô hình mới tốt hơn slice cũ ~40%. "Chỉ
rgb-shift" cho MAD thấp hơn nữa KHÔNG phải là tốt hơn — vì nhiễu
preview độc lập với nhiễu render nên cộng noise luôn làm tăng MAD
từng frame (E|nhiễu A − nhiễu B| > E|nhiễu B|), trong khi preview
không-nhiễu sẽ trình bày sai bản chất hiệu ứng (render luôn có hạt).
Vì vậy vẫn cộng noise và không claim MAD của bản shift-thuần.

Harness V14 kiểm tra glitch bằng cấu trúc thay vì MAD từng frame:
preview glitch so với nguồn chỉ rgb-shift phải lệch tối đa ≤ 21 và
trung bình ~10 (đo thật: max 20, TB 9.35) → STRUCT-OK. Badge giữ
"approx" vì MAD từng frame không thể đạt ngưỡng KHỚP với nhiễu độc
lập — bất kỳ claim "glitch khớp" nào theo MAD từng frame đều sai.

## 5. Harness tổng hợp V14 (`server/render/src/test_v14_parity.js`)

Chạy từ `server/render/`: `node src/test_v14_parity.js`
(`--only effect|transition`, `--list` chỉ liệt kê case).
Exit 0 khi mọi case render xong (kể cả LỆCH/PENDING); 1 khi có case
render lỗi; 2 khi harness lỗi (thiếu ffmpeg, module bắt buộc lỗi).

### Thiết kế chống phụ thuộc luồng khác

- Mọi module preview đều load thật qua tsc sang /tmp (kỹ thuật
  V6/V11/V12); load không được → PENDING với lý do, không crash.
- Transition: type có `geometric=false` mà không phải họ fade →
  PENDING (fallback, hình học chưa có). Region kind mà rasterizer V14
  không hỗ trợ → PENDING với tên kind.
- Badge đọc từ previewStatus.ts lúc chạy; badge khác tier đo được
  chỉ ghi chú, không tự sửa.
- Không dùng code nào mà luồng khác chưa chắc đã đẩy lên đĩa: case
  dissolve luôn PENDING ở V14 (cần mask ImageData, phần của luồng
  khác) kể cả khi module dissolveFrand đã có trên đĩa.

### Kết quả chạy V14 trên trạng thái đĩa lúc giao (2026-10-27)

```
KHỚP 12, XẤP XỈ 2, LỆCH 0, PENDING 3, STAT-APPROX 1, STRUCT-OK 1, lỗi render 0
```

- Effect: pixelate k=9, mirror, rgb-shift s=9, shake t=0/t=0.5,
  sharpen t=0.5/t=1 → KHỚP; edgedetect step/tự nhiên → XẤP XỈ;
  noise → STAT-APPROX (tỉ lệ std 1.01–1.03); glitch → STRUCT-OK.
  Badge đọc được khớp với tier đo cho cả 8 type effect này.
- Transition (p=0.5, 72×45): fade, wipeleft, slideright,
  diamondclose, squareopen → KHỚP (MAD 0.000–0.667).
- PENDING 3: circleopen/circleclose (region kind `radial-gradient`
  của đợt 13 C1 — rasterizer V14 chưa hỗ trợ alpha gradient theo
  bán kính, KHÔNG phải circle hỏng; nguồn đo cho 2 type này vẫn là
  harness V12/V13 và LIMITS đợt 13 C1), dissolve (mask, xem trên).

### Giới hạn của chính harness V14

- Rasterizer transition chỉ hỗ trợ region rect/rects/circle/
  circle-inverted/polygon/polygon-inverted và alpha vô hướng; type
  nào dùng alpha gradient, mask, hoặc region mới đều PENDING chứ
  không LỆCH — PENDING ở đây nghĩa là "V14 chưa đo được", không phải
  "type đó hỏng".
- Composite transition (vẽ cả 2 lớp A và B) kiểm tra hình học như
  V11/V12; preview thật vẫn vẽ từng clip riêng lẻ trên nền đen
  (giới hạn chung đã ghi từ đợt 10).
- Chưa có phần text (phần B của V11/V12 không đưa vào V14 — V14 tập
  trung transition + effect theo nhiệm vụ R6; chạy V12 khi cần số
  text).
- Thời gian chạy ~52 giây trên VM này (chủ yếu là render transition
  qua xfade); không dùng cho vòng lặp nhanh, chỉ dùng làm bảng tổng
  hợp cuối đợt.

## 6. Kiểm chứng của luồng

- `effectCanvas.test.ts`: 14/14 PASS (13 cũ + 1 test cấu trúc glitch
  mới; test edgedetect sửa theo §2).
- `effectCanvas.parity.test.ts`: 11/11 PASS (pixelate 3, mirror,
  rgb-shift, shake 2, sharpen 2 nay KHỚP, edgedetect 2 XẤP XỈ).
- Harness V14: chạy trọn vẹn, bảng kết quả ở §5 (exit 0).
- Badge test `scripts/v5-preview-badge.test.cjs`: 144 assertions PASS.
- `tsc --noEmit` (apps/web): 0 lỗi trong file của luồng; 3 lỗi còn
  lại đều ở `src/components/speed/nestedSpeedcurve.test.ts` — file của
  luồng khác, bị sửa giữa phiên (xem §7).
- `vite build`: PASS (29.84s). Lưu ý: build viết lại `apps/web/dist/`
  (sản phẩm build, không tính là đổi source; parent quyết định có
  stage dist hay không — luồng này không liệt kê dist vào file đổi).

## 7. Nợ còn lại / việc cho đợt sau (trung thực)

1. **Build `npm run build` (tsc && vite build) đang đỏ do file của
   luồng khác**: `src/components/speed/nestedSpeedcurve.test.ts`
   có lỗi TS5097 (import đuôi `.ts` khi chưa bật
   `allowImportingTsExtensions`) và TS2352 ở dòng 356. File này bị
   sửa lúc ~20:14 +07 trong phiên (lần tsc đầu của luồng còn xanh).
   Luồng này KHÔNG sửa file đó (ngoài ranh giới, parent gộp sẽ xử
   lý với luồng sở hữu). Vite build riêng vẫn xanh.
2. **Edgedetect vẫn XẤP XỈ** (step 3.86, tự nhiên 8.53): cần đo trên
   ảnh biên tự nhiên/footage thật trước khi kết luận mô hình nào là
   tốt nhất ngoài nguồn tổng hợp; đừng overfit 4 pixel step.
3. **Noise/glitch không bao giờ KHỚP từng frame** theo thiết kế
   (nhiễu thời gian vs seed): chỉ theo dõi bằng chỉ số thống kê /
   cấu trúc của V14, đừng đưa chúng vào bảng KHỚP pixel.
4. **Sharpen chưa đo** trên footage thật, HD 1080p, clip dài, và khi
   xếp chồng effect — badge "matched" hiện chỉ có giá trị trong
   phạm vi nguồn tổng hợp đã đo (§1).
5. **V14 chưa đo**: circleopen/circleclose (PENDING do kind
   radial-gradient), dissolve (PENDING do mask), text animation
   (không đưa vào V14). Chạy V12/V13 khi cần số cho các nhóm đó.
6. **Phạm vi chung**: mọi số trên là nguồn tổng hợp, FFmpeg 8.1.2,
   VM này. Đừng trích MAD ra khỏi ngữ cảnh nguồn/máy đo.

## 8. File đã đổi / thêm (báo cho parent gộp batch, không tự stage)

Đổi:

- `apps/web/src/lib/effectCanvas.ts` — applySharpen (luma +
  Gaussian 5×5), applyEdgeDetect (Sobel + NMS tie-break nghiêm +
  hysteresis giữ magnitude/4), applyGlitch (rgb-shift + noise đúng
  tham số render, bỏ slice); cập nhật comment mirror.
- `apps/web/src/lib/effectCanvas.test.ts` — test edgedetect mỏng
  1 cột; thêm test cấu trúc glitch.
- `apps/web/src/lib/effectCanvas.parity.test.ts` — sharpen lên
  assert KHỚP (t=0.5, t=1); edgedetect cập nhật số + thêm case tự
  nhiên; ghi chú glitch mới.
- `apps/web/src/components/transitions/previewStatus.ts` —
  sharpen từ EFFECT_CANVAS_APPROX sang EFFECT_CANVAS_MATCHED + cập
  nhật chú thích đầu file (số R6 cho cả 4 type).
- `apps/web/scripts/v5-preview-badge.test.cjs` — cập nhật kỳ vọng
  badge theo số R6 (MATCHED 5, APPROX 3).

Thêm:

- `server/render/src/test_v14_parity.js` — harness tổng hợp V14
  (transition + effect, PENDING-aware, không phụ thuộc code luồng khác).
- `docs/PHASE9_ROUND14_R6_EFFECT_PARITY_LIMITS.md` — file này.
