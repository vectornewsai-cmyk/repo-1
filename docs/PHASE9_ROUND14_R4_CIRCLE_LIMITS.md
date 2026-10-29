# Phase 9 đợt 14 — Luồng R4: hiệu chuẩn lại circleopen/circleclose (LIMITS)

Ngày: 2026-10-27. Luồng R4 trong đợt lớn round 14 (chủ đề
preview–render parity vòng 5, đóng nợ đợt 13). KHÔNG push, KHÔNG
tag/release, KHÔNG binary, KHÔNG code giả, KHÔNG tự tạo file stage
paths-loop (parent gộp batch — danh sách file ở §7).

## 1. Kết luận trước (đọc nhanh)

Nợ đợt 13 C1 đã đóng bằng **2 phát hiện đo thật**, không phải hiệu
chỉnh cảm tính:

1. **Đường cong thật là smoothstep, không phải cosin.** Đợt 13 dùng
   `w = (1+cos(pi*g))/2` — sai số dư có hệ thống ~0.01 trọng số tại
   p=0.5 chính là hiệu cosin − smoothstep. Mô hình mới:
   `w(rho) = 1 − S(clamp(rho−mid+0.5, 0, 1))`, `S(t) = 3t²−2t³`,
   khớp tới sàn lượng tử hoá 8-bit ở mọi frame, mọi kích thước đo.
2. **Tâm và rMax của FFmpeg lấy theo phép cắt nguyên.**
   `cx = floor(W/2)`, `cy = floor(H/2)`, `rMax = hypot(cx, cy)` —
   khác tâm (W/2, H/2) khi W hoặc H lẻ. Đây là lý do 72×45 vẫn còn
   sai số sau khi đổi sang smoothstep (rmse 0.0102), trong khi
   320×180 đã về sàn (rmse 0.0011).

Sau 2 sửa: circleopen/circleclose **MAD tối đa 0.33, ≤8 = 100%** ở
mọi điểm đo (p = 0.25/0.4/0.5/0.6/0.75 × 72×45, 320×180, 1280×720,
1920×1080) — cosin cũ là 1.12–1.56. Badge đã là "matched" từ đợt
13 nên không đổi nhãn, chỉ cập nhật số đo trong chú thích.
**14 type V3 không hồi quy** (harness V11: 0.00–0.52 như trước).

## 2. Phân tích sai số dư (đo thật, từng bước loại trừ)

### 2.1 Progress không sai — shape sai

Render circleopen 320×180 theo đúng kiểu harness V11 (rgb24,
duration=1, offset=1, 30fps), fit mid cosin cho từng frame 30..59:

- Frame 45 (P=0.5): mid fit = 0.5003 ≈ 0.5 — progress đúng tuyệt đối.
- dMid theo frame trơn tru (+0.008 ở P≈0.27 → 0 ở P=0.5 → −0.008 ở
  P≈0.73): đó là fit cosin tự bù cho sai shape, không phải lệch
  progress (lệch progress thật sẽ dời mid một chiều, không đổi dấu
  qua P=0.5).

### 2.2 Fit họ hàm tại frame 45 (P=0.5, mid=0.5 cố định, 200 bin rho)

| Họ hàm | rmse | mean\|dw\| | max\|dw\| |
|---|---|---|---|
| cosin (đợt 13) | 0.00716 | 0.00649 | 0.01029 |
| **smoothstep S(t)=3t²−2t³** | **0.00022** | **0.00016** | **0.00183** |
| smootherstep (5 bậc) | 0.03833 | 0.03475 | 0.05391 |
| cosin dãn dải (W tốt nhất 1.035) | 0.00160 | 0.00134 | 0.00475 |
| cosin + warp sin (c tốt nhất 0.0085) | 0.00081 | 0.00072 | 0.00184 |
| cosin scale rho (s tốt nhất 0.996) | 0.00671 | 0.00588 | 0.01159 |

Smoothstep thắng hơn 1 bậc so với họ tốt thứ hai và chạm sàn
lượng tử hoá (max 0.00183 < nửa bước 1/255 ≈ 0.00196). Dấu sai số
cosin cũng khớp đúng hiệu cosin − smoothstep: âm ở rho < 0.5
(tới −0.0103 quanh rho 0.25–0.30), dương ở rho > 0.5 (tới +0.0103
quanh rho 0.70–0.73), bằng 0 tại rho = 0/0.5/1.

### 2.3 Dư sót tại 72×45: tách đôi theo nửa trên/dưới → tâm y lệch

Sau khi đổi sang smoothstep, 320×180 về sàn (rmse 0.00114) nhưng
72×45 vẫn rmse 0.01019. Phân tích theo góc phần tư tại frame 45:

| Nửa khung | mean dw | std dw |
|---|---|---|
| trên (y < cy) | +0.0037 / +0.0040 | 0.0054 |
| dưới (y ≥ cy) | −0.0116 / −0.0119 | 0.0054 |

Tách đôi theo y, không theo x → tâm y thật lệch lên ~0.5px so với
H/2 = 22.5, tức cy = 22 = floor(H/2). Kiểm chứng các quy ước
(frame 45, smoothstep):

| Quy ước tâm/rMax | 72×45 rmse | 73×45 rmse | 320×180 rmse |
|---|---|---|---|
| (W/2, H/2), rMax hypot halves (cũ) | 0.01019 | 0.01821 | 0.00114 |
| (W/2, floor(H/2)), rMax halves | 0.00433 | — | 0.00114 |
| **(floor(W/2), floor(H/2)), rMax hypot center** | **0.00116** | **0.00116** | 0.00114 |
| tâm pixel (x+0.5), halves | 0.01230 | — | 0.00357 |
| ((W−1)/2, (H−1)/2), rMax halves | 0.01351 | — | 0.00436 |

Quy ước thắng là duy nhất về sàn lượng tử hoá ở cả 3 kích thước,
kể cả W lẻ (73×45: chỉ floor cả 2 trục mới thắng — floor riêng
x hoặc riêng y đều thua). Tại kích thước chẵn mọi quy ước trùng
nhau nên 320×180/720p/1080p không phân biệt được — bằng chứng
chỉ lộ ra ở kích thước lẻ, đúng như harness V11 dùng 72×45.

## 3. Mô hình mới (đã cài vào code)

```
cx = floor(W/2);  cy = floor(H/2);  rMax = hypot(cx, cy)
rho = hypot(x - cx, y - cy) / rMax        (x, y: chỉ số pixel nguyên)
w(rho) = 1 - S(clamp(rho - mid + 0.5, 0, 1)),  S(t) = 3t² - 2t³
circleopen:  mid = 3P - 1,  A = 1-w, B = w
circleclose: mid = 2 - 3P,  A = w,    B = 1-w   (ảnh gương thời gian)
```

Ảnh gương kiểm chứng đúng tới sàn lượng tử hoá: frame close(k)
so với 1 − open(90−k) cho rmse 0.00000 (320×180, các cặp k chẵn đo
được); ở HD, MAD close(p) = MAD open(1−p) đúng từng ô (xem §4.3).

## 4. Số đo thật (FFmpeg 8.1.2, nguồn đỏ/xanh phẳng, VM 2 CPU)

Ngưỡng KHỚP: MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8.

### 4.1 Harness V11 đầy đủ (72×45, p=0.5, hàm thật từ module)

| Type | MAD trước (đợt 13) | MAD nay | ≤8 | Kết luận |
|---|---|---|---|---|
| circleopen | 1.56 | **0.33** | 100.0% | KHỚP |
| circleclose | 1.56 | **0.33** | 100.0% | KHỚP |
| 14 type V3 (diamondclose…spiral) | 0.00–0.52 | 0.00–0.52 | ≥ 99.7% | KHỚP, không đổi |
| fade/wipeleft/slideright | như trước | như trước | 100% | KHỚP, không đổi |
| dissolve | 85.52 FAIL | 85.00 FAIL | 0% | LỆCH, không đụng (của R2) |

MAD 0.33 (không phải 0.17) là sàn của thang harness: probe đo w
trực tiếp bằng trung bình 2 kênh cho MAD tương đương ~0.17, nhưng
harness so từng kênh riêng và FFmpeg truncate kênh khi blend nên
mỗi kênh lệch 0/1 với trung bình ~0.33 — đó là sàn đo, không phải
sai mô hình (xem §6).

### 4.2 Đo theo frame (320×180, mid=3P−1 cố định, không fit lại)

| Frame (P) | smooth rmse | cosin rmse |
|---|---|---|
| 36 (0.20) – 44 (0.47) | 0.00017 – 0.00112 | 0.00022 – 0.00682 |
| 45 (0.50) | 0.00114 | 0.00724 |
| 46 (0.53) – 54 (0.80) | 0.00112 – 0.00023 | 0.00739 – 0.00029 |
| ≤ 0.167 / ≥ 0.833 | 0.00000 (ngoài dải) | 0.00000 |

### 4.3 Đo HD bằng hàm thật (pipe, không ghi file lớn; @60fps để
### p chính xác: p=0.25→frame 75, 0.4→84, 0.5→90, 0.6→96, 0.75→105)

| Type | Kích thước | p=0.25 | p=0.4 | p=0.5 | p=0.6 | p=0.75 |
|---|---|---|---|---|---|---|
| circleopen | 1280×720 | 0.038 | 0.244 | 0.333 | 0.278 | 0.068 |
| circleclose | 1280×720 | 0.068 | 0.278 | 0.333 | 0.244 | 0.038 |
| circleopen | 1920×1080 | 0.038 | 0.244 | 0.333 | 0.278 | 0.068 |
| circleclose | 1920×1080 | 0.068 | 0.278 | 0.333 | 0.244 | 0.038 |

Mọi ô: ≤8 = 100%. Hai độ phân giải cho số giống hệt nhau (mô hình
thuần hàm, không phụ thuộc độ phân giải); gương close(p) =
open(1−p) đúng từng ô. Thêm 72×45 (harness) + 73×45 (probe tâm lẻ)
+ 320×180 (probe frame) → tổng 5 kích thước, 2 type.

### 4.4 Test suite liên quan

- `node apps/web/src/lib/transitionPreview.test.ts`: **23/23 pass**
  (trước: 22 — thêm test tâm cắt nguyên 73×45 + 2 điểm smoothstep).
- Harness V11: exit 0, chỉ còn FAIL là dissolve (của R2).
- `tsc --noEmit --incremental false` toàn apps/web: **exit 0,
  0 lỗi**. (Lưu ý: một lần chạy tsc giữa chừng báo 3 lỗi ở
  `nestedSpeedcurve.test.ts` — file không thuộc luồng này, lúc đó
  các luồng round 14 khác đang sửa cây làm việc; chạy lại toàn
  bộ sạch — xem §6.)

## 5. Triển khai (vùng sửa, để parent hợp nhất với R2)

- `apps/web/src/lib/transitionPreview.ts` — CHỈ 3 vùng:
  (a) comment kiểu `radial-gradient` (smoothstep + tâm cắt nguyên);
  (b) `radialGradientWeight` đổi cosin → smoothstep;
  (c) 2 case `circleopen`/`circleclose` dùng `ccx/ccy/crMax`
  cắt nguyên thay cho `cx/cy/rMax` chung. KHÔNG đụng base
  cx/cy/rMax (các type khác dùng chung) và KHÔNG đụng dissolve.
- `apps/web/src/lib/transitionPreview.test.ts` — test
  `radialGradientWeight` đổi sang giá trị smoothstep
  (0.15625/0.84375 thay cho 0.1464/0.8536), thêm test tâm cắt
  nguyên 73×45. Test gương thời gian giữ nguyên (đồng nhất thức
  cấu trúc, không phụ thuộc dạng hàm).
- `apps/web/src/preview.tsx` — CHỈ comment của
  `drawVideoClipWithRadialMask` (cosin → smoothstep); code mask
  dùng sẵn `region.cx/cy/rMax` + `radialGradientWeight` nên tự
  hưởng sửa, không đổi logic. R2 cũng sửa file này ở phần
  dissolve-noise (vùng khác).
- `apps/web/src/components/transitions/previewStatus.ts` — CHỈ
  đoạn chú thích circleopen/circleclose (số đo mới, bỏ dòng "sai
  số dư"); nhãn `matched` giữ nguyên, tập `TRANSITION_MATCHED`
  không đổi. R2 có thể cũng chạm file này cho dissolve — cần
  parent đối chiếu khi gộp.
- Harness V11 KHÔNG cần sửa: `layerPixelAlpha` đã dùng
  `r.cx/r.cy/r.rMax` từ vùng + hàm thật từ module nên tự hưởng
  cả 2 sửa.

## 6. Giới hạn còn lại (trung thực, không claim quá)

- **MAD sàn 0.33 là sàn đo, không phải sai mô hình.** Probe đo w
  trực tiếp (trung bình 2 kênh) cho rmse 0.0012; harness so từng
  kênh cho MAD 0.33 vì FFmpeg truncate kênh khi blend (render
  R/B lệch 0/1 so với preview làm tròn). Muốn MAD về ~0.17 thì
  preview phải truncate như FFmpeg — đổi quy ước làm tròn toàn
  cục, ngoài phạm vi luồng này và không cần thiết (ngưỡng là 2).
- **Tỉ lệ pixel gần-B của circleclose lệch nhẹ ở V11:**
  render 7.8% vs preview 8.1% (fracNear tol 16 tới xanh thuần).
  Đây là hiệu ứng ngưỡng tại biên w≈0.063 (pixel có w sát ngưỡng
  lật do truncate/làm tròn), MAD/le8 vẫn pass — không phải lệch
  hình học.
- **Quy tắc tâm cắt nguyên chỉ áp cho vùng radial-gradient.**
  Chưa kiểm chứng FFmpeg có dùng tâm cắt nguyên cho hình học các
  type khác không — biên nhị phân của chúng che lệch 0.5px nên
  V3 vẫn KHỚP (0.00–0.52) và không có lý do đổi base chung; nếu
  một ngày đo gradient của type khác thì kiểm tra lại quy tắc này.
- **Preview canvas thật chưa chụp màn hình**: mask 64 điểm dừng
  dùng chung hàm trọng số (sai số nội suy < 0.001), nhưng chưa
  có ảnh chụp frame preview thật của circleopen/circleclose
  (giới hạn chung, cần click-test CDP riêng).
- **Chỉ đo nguồn màu phẳng**: chưa đo footage quay thật / clip
  dài / 4K; gradient chỉ phụ thuộc hình học nên nguồn phẳng là
  đủ cho mô hình, nhưng chưa chứng minh trên footage.
- **dissolve vẫn LỆCH ở V11 (85.00)**: ngoài phạm vi, của R2 —
  V11 chưa raster được vùng dissolve-noise nên số này không phản
  ánh mô hình mới của R2.
- **Chi phí mask canvas** (1 canvas offscreen full-frame mỗi
  frame trong cửa sổ circle) chưa đo FPS — nợ kế thừa.
- Lần chạy tsc đầu báo lỗi ở `nestedSpeedcurve.test.ts` (file
  ngoài phạm vi, đang được luồng khác sửa dở); chạy lại toàn bộ
  sạch — nếu parent thấy lỗi này tái hiện thì đó là trạng thái
  giữa chừng của luồng khác, không phải của batch này.

## 7. File đổi/thêm (tương đối từ repo root)

KHÔNG tạo file stage paths-loop (theo nhiệm vụ, parent gộp):

- `apps/web/src/lib/transitionPreview.ts` (SỬA — 3 vùng §5)
- `apps/web/src/lib/transitionPreview.test.ts` (SỬA — test
  smoothstep + tâm cắt nguyên)
- `apps/web/src/preview.tsx` (SỬA — chỉ comment mask radial)
- `apps/web/src/components/transitions/previewStatus.ts`
  (SỬA — chỉ chú thích số đo circle)
- `docs/PHASE9_ROUND14_R4_CIRCLE_LIMITS.md` (MỚI — chính file này)

Probe chỉ chạy ở /tmp (không commit): `/tmp/probe_circle14a.js`
(profile theo frame), `/tmp/fit_circle14.js` (fit họ hàm),
`/tmp/verify_smooth14.js` (xác minh frame/type/kích thước nhỏ),
`/tmp/conv_circle14.js` (so quy ước lấy mẫu),
`/tmp/resid_structure14.js` (cấu trúc dư theo góc phần tư),
`/tmp/center_trunc14.js` (tâm cắt nguyên),
`/tmp/measure_hd14.js` (đo HD bằng hàm thật).
