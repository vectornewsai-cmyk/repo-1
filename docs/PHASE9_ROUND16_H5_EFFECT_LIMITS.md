# Phase 9 đợt 16 — Luồng H5: effect parity residuals (LIMITS)

Ngày: 2026-10-28. Một luồng trong đợt lớn Phase 9 đợt 16 (chủ đề:
đóng nợ parity còn lại). KHÔNG push, KHÔNG tag/release, KHÔNG binary.
Chỉ sửa file trên đĩa; batch stage do parent đợt lớn tổng hợp (luồng
này KHÔNG tự tạo file paths-loop riêng, KHÔNG sửa build-loop-log.md).

Máy đo: FFmpeg 8.1.2 trên VM này. Mọi số dưới đây là nguồn tổng hợp
(step / pattern / tự nhiên như parity test), chưa phải footage thật /
HD / clip dài — đừng claim hơn.

## 0. Kết luận nhanh (trung thực)

- **Edgedetect: cải thiện lớn, vẫn XẤP XỈ — KHÔNG nâng badge.**
  Step 72×45: MAD 3.856 → 0.315 (đạt ngưỡng KHỚP riêng nguồn này);
  tự nhiên 72×45: MAD 8.528 → 2.130 (chưa đạt: cần MAD ≤ 2 và
  ≤8 ≥ 99%, nay là 2.130 / 95.6%). Pattern còn hơi tệ đi (xem §1).
- **Glitch: cải thiện lớn, vẫn XẤP XỈ — KHÔNG nâng badge.**
  MAD từng frame về gần sàn lý thuyết của 2 nhiễu độc lập
  (≈ 13.0 với ns=20); phần dịch kênh nay KHỚP TUYỆT ĐỐI (0 byte
  lệch). Badge giữ approx vì MAD từng frame không bao giờ đạt
  ngưỡng KHỚP với nhiễu độc lập — như kết luận đợt 14 R6.
- **Noise: từ "khớp std" lên "khớp cả dạng phân phối" — vẫn
  STAT-APPROX, KHÔNG nâng badge** (không thể khớp từng frame do
  nhiễu thời gian). Test có ngưỡng rõ ràng nay assert cả std,
  tương quan kênh và kurtosis (xem §3).
- **Rgb-shift (hệ quả, không phải nợ): phần dịch nay KHỚP TUYỆT
  ĐỐI trên cả nguồn tự nhiên** (trước đây chỉ khớp trên nguồn
  gradient kênh vì biên của nó bằng 0, che giấu lỗi điền vùng
  trống). Badge matched giữ nguyên, không đổi nhãn.

## 1. Edgedetect: 3 phát hiện, 1 mô hình mới

### Phát hiện 1 — NMS phải nghiêm cả 2 phía (quyết định trên step)

Render trên step dọc hoàn hảo chỉ cho 4 pixel (cột 36, hàng 1,2,42,43
trên 72×45; tương tự step ngang: hàng 22, cột 1,2,69,70). Lý do: dải
Sobel của biên hoàn hảo là plateau 2 cột bằng nhau; NMS của FFmpeg
triệt tiêu cả 2 phía (m > m1 && m > m2) nên phần trong của biên biến
mất, chỉ còn vài pixel gần biên khung nơi gradient đổi hướng. Mô
hình R6 dùng tie-break m >= m1 && m > m2 nên giữ 1 cột đủ chiều cao
và lệch đúng phần đó. Đổi sang NMS nghiêm: step 3.86 → 0.31 (72×45),
1.85 → 0.08 (144×90).

### Phát hiện 2 — thang độ lớn là Sobel thô, không phải magnitude/4

Trên dốc tuyến tính (ramp 0→255 qua 12 pixel), render cho giá trị
~172–176, đúng bằng độ lớn Sobel thô (~170 = 8×độ dốc), không phải
magnitude/4 (~42). Mô hình R6 chia 4 vì cho rằng "Sobel thô tới
4×255, ngưỡng render là phần của 255" — suy luận đó sai thang: ngưỡng
low/high của render áp trên độ lớn thô (51 / 114.75 ở t=0.5) và đầu
ra giữ lại độ lớn thô (kẹp 255). Mô hình mới bỏ phép chia 4.

### Phát hiện 3 — cần blur Gaussian trước Sobel (quyết định trên tự nhiên)

Quét biến thể (ngưỡng trên độ lớn thô, NMS nghiêm, t=0.5, MAD trung
bình theo kênh; xem bảng §1.1): không blur cho tự nhiên 8.31, blur
3×3 cho 2.13, blur 5×5 [1,4,6,4,1]/16 cho 2.13, blur 7×7 cho 4.13,
Gauss σ=1 cho 1.79 nhưng làm step tệ đi (3.23). Blur zero-pad tệ hơn
hẳn (tự nhiên 11.79) nên dùng clamp-to-edge. Chọn blur 5×5 vì tốt
nhất tổng 6 ô đo (MAD tổng 10.11, so với 11.49 của blur 3×3 và 23.35
của mô hình R6) và là kernel quen thuộc (cùng họ với sharpen).

### 1.1 Bảng MAD trước/sau (t=0.5, MAD trung bình theo kênh)

| Nguồn | Kích thước | R6 (mag/4, tie>=/>) | H5 (blur 5×5, NMS nghiêm, độ lớn thô) |
|---|---|---|---|
| step | 72×45 | 3.86 | **0.31** |
| step | 144×90 | 1.85 | **0.08** |
| tự nhiên | 72×45 | 8.85 | **2.13** |
| tự nhiên | 144×90 | 2.64 | **0.77** |
| pattern | 72×45 | 2.04 | 2.52 (tệ đi 0.48) |
| pattern | 144×90 | 4.11 | 4.30 (tệ đi 0.19) |

Số qua parity test (so sánh max-kênh, chuẩn V6): step 72×45
MAD 3.856 / ≤8 98.5% → **0.315 / 99.9%**; tự nhiên 72×45
MAD 8.528 / ≤8 94.7% → **2.130 / 95.6%**. Hai cách tính MAD khác
nhau vài phần mười là khác biệt định nghĩa (đã ghi từ R6), không
phải sai số.

Các biến thể đã thử và loại (mỗi effect ≥ 2 biến thể theo yêu cầu):
ngưỡng ×1.164 (giả thuyết luma limited-range — không đổi số đo);
blur zero-pad (tệ hơn); blur 7×7 (tệ hơn 5×5); Gauss σ=1 (tự nhiên
tốt nhất nhưng step tệ nhất, tổng tệ hơn); NMS nội suy (không thử
vì NMS nghiêm đã giải thích đúng hành vi plateau, và nội suy không
thay đổi được plateau bằng nhau).

### Vì sao vẫn XẤP XỈ, không nâng badge

- Tự nhiên 72×45: MAD 2.13 > 2 và ≤8 95.6% < 99% → chưa đạt ngưỡng
  KHỚP. Case step riêng đạt ngưỡng KHỚP (0.315 / 99.9%) nhưng badge
  gắn với type, không gắn với từng case — nâng badge theo 1 case
  trong khi 2 nguồn còn lại chưa đạt là claim sai.
- Pattern tệ đi nhẹ ở cả 2 cỡ: cạnh wrap tần số cao của nguồn
  pattern (x·4 mod 256, y·5 mod 256) chưa khớp hẳn sau blur. Đây là
  nợ còn lại, không phải hồi quy nghiêm trọng (vẫn trong band XẤP XỈ:
  MAD ≤ 20, ≤8 ≥ 90%).
- Hệ quả cho test unit: step đối xứng hoàn hảo nay cho toàn 0 trên
  ảnh test 8×4 (đúng hành vi render, không phải lỗi) — test cũ kỳ
  vọng 1 cột đã sửa thành: step đối xứng → toàn 0, step bất đối
  xứng (0,0,0,128,255,…) → đúng 1 cột x=3. Test cũ không "sai" theo
  mô hình cũ; nó sai theo hành vi render thật.

## 2. Glitch: phần dịch nay tuyệt đối đúng, nhiễu nay đúng dạng

### Phát hiện 1 — rgbashift cắt phần thập phân, không làm tròn

render(8.5) == render(8) đúng từng byte (0 byte lệch), trong khi
làm tròn cho 9 (lệch 952 byte trên stripe 64×8). Preview cũ dùng
Math.round (8.5→9, 13.5→14) nên sai ở mọi t cho s phân đoạn. Nay
dùng Math.trunc cho cả glitch và rgb-shift (t=0.5 cho s nguyên nên
case KHỚP cũ không đổi).

### Phát hiện 2 — vùng trống của rgbashift là NHÂN BIÊN, không phải 0

So sánh từng byte trên tự nhiên 72×45, s=9: điền 0 lệch 810 byte
(toàn bộ 2 dải biên s pixel, chỉ kênh R/B, kênh G đúng tuyệt đối);
nhân biên lệch **0 byte**. Tương tự tự nhiên 144×90 (1620 → 0) và
stripe 64×8 (72 → 0, dải B phải). Nguồn gradient kênh của parity
test cũ che giấu lỗi này vì biên của nó bằng 0 — nay parity test
thêm case rgb-shift trên nguồn tự nhiên để khóa fix này. Nội suy
tuyến tính giữa floor/ceil đã thử và LOẠI: tệ hơn cả floor lẫn
ceil (s=8.5: floor 3.20, nội suy 4.66, ceil 6.10; s=5.5: ceil 2.40
tốt nhất) — vì render cắt chứ không nội suy.

### Bảng MAD từng frame trước/sau (t=0.5, ns=20)

| Nguồn | Kích thước | R6 (round + điền 0 + nhiễu đều) | H5 (trunc + nhân biên + nhiễu Gauss) |
|---|---|---|---|
| tự nhiên | 72×45 | 22.26 | **12.67** |
| tự nhiên | 144×90 | 15.40 | **11.66** |
| pattern | 72×45 | 18.58 | **12.32** |
| pattern | 144×90 | 15.29 | **12.18** |

Số cũ khớp đúng số R6 (22.26 / 18.58) nên phép đo trước/sau là cùng
một thước. Số mới ≈ sàn lý thuyết của 2 nhiễu Gauss độc lập
(E|N1−N2| = 2σ/√π ≈ 13.03 với σ = 20/√3) — tức phần dịch đã hết
lệch, phần còn lại là nhiễu độc lập không thể triệt tiêu. Vẫn giữ
badge approx vì lý do đó, không phải vì còn lỗi mô hình.

### Kiểm tra cấu trúc V14 (đã cập nhật tiêu chí)

Tiêu chí cũ (max ≤ 21) chỉ đúng với nhiễu đều; nhiễu Gauss có đuôi
vượt ns (max đo 40) nên max chỉ còn in tham khảo. Tiêu chí mới
(trung bình |lệch| 7–13, std 9–14 với ns=20) đúng cho cả đều lẫn
Gauss (đều: TB 10, std 11.55) nên vẫn bắt được sai cường độ. V14
nay đo: TB 8.85, std 11.24 → STRUCT-OK. Nguồn tham chiếu shift-thuần
của V14 cũng sửa sang nhân biên (tham chiếu điền 0 cũ là sai).

## 3. Noise: xác nhận bằng test có ngưỡng rõ ràng

### Giả thuyết nào đúng? (phẳng 128, 144×90, alls=28)

| Mô hình | std kênh | tương quan kênh | kurtosis | min/max lệch |
|---|---|---|---|---|
| Render thật | 15.77 / 15.73 / 15.64 | ≈ 0.01 | −0.17 / 0.05 / −0.18 | −52 / +64 |
| Đều cũ (R6) | 16.21 / 16.15 / 16.16 | ≈ 0.01 | −1.20 | −28 / +28 (kẹp) |
| Mặt phẳng YUV | 24.52 / 19.85 / 36.48 | 0.19 / 0.29 / 0.07 | −0.62..−0.81 | ±84 |
| Gauss mới (σ=ns/√3) | 16.00 / 16.26 / 16.17 | ≈ 0.00 | −0.06..0.00 | −75 / +60 |

Kết luận: render là nhiễu Gauss (kurtosis ≈ 0, vượt ±strength, std =
strength/√3). Giả thuyết YUV của R6 (“hình chuông vì cộng trên mặt
phẳng YUV”) nay BÁC BỎ bằng số: std lệch tới 56% và tương quan
0.19–0.30, trong khi render có tương quan ≈ 0. Đều cũ chỉ đúng std
và tương quan, sai dạng phân phối và tầm vượt. Nay preview dùng
Gauss (Box–Muller trên mulberry32, sigma = strength/√3) cho cả
applyNoise và phần noise của applyGlitch, giữ nguyên std cũ.

### Test ngưỡng (effectCanvas.parity.test.ts, mới)

Phẳng 128, 144×90, 2 cường độ, assert cả 3 kênh:

| Case | std render | std preview | tỉ lệ | kurt render | kurt preview | corr preview |
|---|---|---|---|---|---|---|
| t=0.5 (alls=28) | 15.77/15.73/15.64 | 15.91/15.83/15.95 | 1.01–1.02 | −0.17/0.05/−0.18 | 0.01/0.02/−0.05 | ≤ 0.016 |
| t=1 (alls=50) | 28.49/28.40/28.21 | 28.92/28.76/29.00 | 1.01–1.03 | −0.21/0.00/−0.22 | 0.01/0.01/−0.05 | ≤ 0.016 |

Ngưỡng: tỉ lệ std ∈ [0.8, 1.25] (luật V14), |corr| ≤ 0.1 (YUV rớt),
kurtosis ∈ [−0.6, 0.6] (đều rớt với −1.2). "Khớp" ở đây nghĩa là
khớp phân phối, không phải khớp từng frame — với nhiễu thời gian
(allf=t) thì khớp từng frame là không thể theo thiết kế. Vì vậy
badge noise giữ STAT-APPROX/approx, không nâng lên matched.

Hệ quả cho test unit: assert "mọi pixel lệch ≤ strength" của bản
đều cũ đã thay bằng assert thống kê (trung bình, std, kurtosis,
có pixel vượt strength) — vì bản Gauss đúng với render thì bắt
buộc vượt strength.

## 4. Kiểm chứng của luồng

- `effectCanvas.test.ts`: **14/14 PASS** (13 cũ + 1 test cấu trúc
  glitch viết lại; test edgedetect/noise/glitch sửa theo mô hình mới).
- `effectCanvas.parity.test.ts`: **14/14 PASS** (11 cũ + 1 case
  rgb-shift tự nhiên + 2 case noise thống kê có ngưỡng).
- Harness V14 (`--only effect`): KHỚP 8, XẤP XỈ 1 (edgedetect tự
  nhiên), LỆCH 0, PENDING 0, STAT-APPROX 1, STRUCT-OK 1. Lưu ý:
  case edgedetect step của V14 nay phân loại KHỚP (0.315 / 99.9%)
  nhưng badge type vẫn approx — đúng, vì badge gắn với type và
  nguồn tự nhiên/pattern chưa đạt (xem §1). Chạy V14 toàn phần
  (transition) để parent chạy lại khi gộp; luồng này chỉ chạy
  nhánh effect vì phần transition không đụng tới.
- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **PASS** (8.93s; dist tái tạo, không liệt kê vào
  file đổi — parent quyết định có stage dist hay không).
- Không sửa previewStatus.ts: không có badge nào đủ điều kiện nâng
  (edgedetect/glitch/noise đều chưa đạt ngưỡng KHỚP toàn diện).

## 5. File đã đổi / thêm (báo cho parent gộp batch, không tự stage)

Đổi:

- `apps/web/src/lib/effectCanvas.ts` — applyEdgeDetect (blur
  Gaussian 5×5 + NMS nghiêm + ngưỡng/đầu ra trên độ lớn Sobel thô),
  applyRgbShift + applyGlitch (trunc + nhân biên), applyNoise +
  applyGlitch (nhiễu Gauss qua gaussianGenerator mới), cập nhật
  comment mirror đầu file.
- `apps/web/src/lib/effectCanvas.test.ts` — test edgedetect (step
  đối xứng → 0, step bất đối xứng → 1 cột), test glitch/noise
  chuyển sang assert thống kê Gauss.
- `apps/web/src/lib/effectCanvas.parity.test.ts` — cập nhật số
  edgedetect H5, thêm case rgb-shift tự nhiên (khóa fix nhân biên)
  và 2 case noise thống kê có ngưỡng (std/corr/kurtosis).
- `server/render/src/test_v14_parity.js` — kiểm tra glitch chuyển
  sang tiêu chí TB/std Gauss + tham chiếu shift-thuần nhân biên;
  cập nhật chú thích đầu file.

Thêm:

- `docs/PHASE9_ROUND16_H5_EFFECT_LIMITS.md` — file này.

## 6. Nợ còn lại / việc cho đợt sau (trung thực)

1. **Edgedetect pattern**: MAD 2.52 (72×45) / 4.30 (144×90), hơi tệ
   hơn mô hình R6 — cạnh wrap tần số cao chưa khớp hẳn sau blur.
   Cần nguồn kiểm tra mới (ảnh có cạnh tự nhiên, không wrap nhân
   tạo) trước khi kết luận mô hình nào tốt nhất ngoài nguồn tổng
   hợp; đừng overfit thêm vào pattern.
2. **Edgedetect chưa đạt KHỚP toàn diện**: tự nhiên 2.13 / 95.6%
   vẫn ngoài ngưỡng. Muốn nâng badge cần thêm nguồn đo (footage
   thật, HD) và mô hình qua được cả 3 nguồn — hiện chưa có.
3. **Noise/glitch không bao giờ KHỚP từng frame** theo thiết kế
   (nhiễu thời gian vs seed): chỉ theo dõi bằng chỉ số thống kê /
   cấu trúc, đừng đưa chúng vào bảng KHỚP pixel.
4. **Chưa đo**: footage thật, HD/4K cho edgedetect/glitch/noise;
   xếp chồng effect (thứ tự chuỗi filter); V14 toàn phần sau gộp.
5. **Lưu ý môi trường (không phải lỗi code)**: /tmp của VM đã đầy
   (tmpfs 512M, phần lớn là file của luồng khác trong đợt này) nên
   các harness dùng os.tmpdir() phải chạy với TMPDIR trỏ sang
   workspace mới chạy được — parent nên nhắc các luồng dọn /tmp
   của mình sau khi chạy xong.
