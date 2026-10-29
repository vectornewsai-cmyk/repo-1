# Phase 9 đợt 13 — Luồng C1: circleopen/circleclose gradient (LIMITS)

Ngày: 2026-10-27. Chạy trong đợt lớn đợt 13 (1 luồng trong nhiều luồng
song song). KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG code giả.
Phạm vi đúng task: circleopen + circleclose (mô hình gradient, vẽ mask
canvas, badge 2 type này). Không đụng dissolve, badge type khác, migrate,
speed-curve UI, click-test.

## 1. Kết luận trước (đọc nhanh)

- **circleclose CÓ cùng gradient với circleopen** — chính xác là ảnh
  gương thời gian: `w_close(rho, P) = 1 − w_open(rho, 1−P)`.
- **Cả 2 type nay KHỚP** theo đúng ngưỡng đợt trước (MAD ≤ 2 và
  ≥ 99% pixel lệch ≤ 8): MAD 0.07–1.56, ≤8 = 100% tại mọi điểm đo
  (p = 0.25/0.5/0.75 × 72×45, 320×180, 1280×720). Badge đã nâng từ
  "approx" lên "matched" cho đúng 2 type này.
- So với đợt 12: circleopen tại p=0.5, 72×45 từ MAD 43.50 → 1.56.

## 2. Công thức đã đo (FFmpeg 8.1.2, nguồn đỏ/xanh phẳng)

Trọng số blend B theo bán kính chuẩn hoá `rho = r / rMax`
(`rMax = hypot(W/2, H/2)`), đánh giá tại chỉ số pixel nguyên:

```
w_open(rho, P)  = (1 + cos(pi * clamp(rho - (3P-1) + 0.5, 0, 1))) / 2
w_close(rho, P) = 1 - w_open(rho, 1-P)
                = (1 - cos(pi * clamp(rho - (2-3P) + 0.5, 0, 1))) / 2
```

Bằng chứng gương thời gian (đo trực tiếp, không suy đoán):

| Điểm kiểm | circleclose đo | 1 − w_open tại 1−P | Khớp? |
|---|---|---|---|
| P=0.5, rho≈0.11 | 0.035 | 1 − 0.965 = 0.035 | ✓ |
| P=0.5, rho≈0.51 | 0.531 | 1 − 0.469 = 0.531 | ✓ |
| P=0.25, tâm (rho≈0) | 0.00 | 1 − w_open(0, 0.75) = 0.00 | ✓ |
| P=0.25, rho≈0.84 (mép) | 0.03 | 1 − w_open(0.84, 0.75) ≈ 0.02–0.03 | ✓ |
| P=0.75, tâm | 0.85 | 1 − w_open(0, 0.25) = 1 − 0.15 = 0.85 | ✓ |
| P=0.75, rho≈0.04 | 0.89 | 1 − w_open(0.04, 0.25) = 1 − 0.11 = 0.89 | ✓ |

Luật `mid = 3P−1` của đợt 12 giữ nguyên, nay mở rộng thành công thức
đầy đủ cả 2 chiều: dải chưa tới (P<1/3: w_max ở tâm < 0.5, vd P=0.25
tâm chỉ 0.15), dải đã qua (P>2/3: w_min ở góc > 0.5, vd P=0.75 góc
vẫn 0.85+). B thuần 100% từ P≈0.8, blend bắt đầu từ P≈0.3 — đều là hệ
quả của cùng một công thức, không cần luật riêng.

Quy ước bán kính: probe so sánh 3 quy ước tại 72×45, p=0.5 —
chỉ số nguyên vs tâm (W/2, H/2) cho MAD 1.56, tốt hơn tâm pixel
(1.98) và chỉ số vs ((W−1)/2, (H−1)/2) (1.98). Harness dùng quy ước
chỉ số nguyên; canvas vẽ mask liên tục nên lệch < 0.5px ở biên,
không đáng kể với mắt (xem §5).

## 3. Triển khai

- `transitionPreview.ts`: thêm vùng mới `ClipRegion` kind
  `"radial-gradient"` (`cx, cy, rMax, mid, inverted`) + hàm thuần
  xuất khẩu `radialGradientWeight(mid, rho)`. circleopen: A dùng
  `1−w` (inverted), B dùng `w`, mid = 3p−1. circleclose: A dùng `w`,
  B dùng `1−w`, mid = 2−3p. Mô hình vòng tròn biên cứng cũ (đợt 12)
  bỏ hẳn cho 2 type này (circlecrop giữ nguyên, không liên quan).
- `preview.tsx`: `drawVideoClipWithTransition` rẽ nhánh khi lớp là
  radial-gradient — vẽ clip lên canvas offscreen (kèm trượt/scale của
  lớp), áp mask `destination-in` bằng radial gradient 64 điểm dừng
  từ cùng hàm `radialGradientWeight`, rồi đưa lên ctx chính. Sai số
  lấy mẫu 64 dừng < 0.001 trọng số, nhỏ hơn lượng tử hoá 8-bit.
  Các vùng khác vẫn đi đường clip path cũ, không đổi.
- `test_v11_parity.js` (harness): `regionCovers` coi radial-gradient
  là phủ khắp khung; thêm `layerPixelAlpha` (alpha từng pixel) và
  nhánh composite crossfade cho cặp radial (a+b=1) — sequential-over
  cũ sẽ cho `A·a + B·b·(1−a)` là sai công thức xfade khi 2 lớp chồng
  khắp khung. Harness ưu tiên dùng hàm `radialGradientWeight` THẬT từ
  module đã transpile, fallback công thức mirror 1 dòng. Thêm case
  circleclose vào bảng transition (trước đó harness không có case này).
- `previewStatus.ts`: `TRANSITION_MATCHED` thêm `circleopen`,
  `circleclose` — đúng điều kiện đợt 12 T3 đã ghi ("khi đổi mô hình
  preview sang gradient + đo lại đạt ngưỡng KHỚP, mới nâng").
- Test: `transitionPreview.test.ts` thay test biên cứng cũ bằng 3 test
  gradient (giá trị hàm, vùng 2 type, đồng nhất thức gương thời gian);
  `regionNonEmpty` thêm nhánh radial-gradient.

## 4. Số đo thật (FFmpeg 8.1.2, VM 2 CPU)

Ngưỡng KHỚP đợt trước: MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8.

### 4.1 Harness V11 chạy lại đầy đủ (72×45, p=0.5)

| Type | MAD trước | MAD nay | ≤8 | Kết luận |
|---|---|---|---|---|
| circleopen | 43.50 (đợt 12) | 1.56 | 100.0% | KHỚP |
| circleclose | (chưa có case) | 1.56 | 100.0% | KHỚP |
| dissolve | 85.52 | 85.52 | 49.7% | LỆCH (không đụng, nợ cũ) |

Các type khác không đổi (14 type V3 vẫn 0.00–0.52 KHỚP; text không
đổi). Harness exit 0, chỉ còn FAIL là dissolve.

### 4.2 Đo mở rộng: nhiều p × nhiều kích thước

Composite từ `describeTransition` thật (transpile) vs render xfade
thật, nguồn đỏ/xanh phẳng:

| Type | Kích thước | p=0.25 | p=0.5 | p=0.75 |
|---|---|---|---|---|
| circleopen | 72×45 | 0.08 | 1.56 | 0.19 |
| circleopen | 320×180 | 0.07 | 1.12 | 0.13 |
| circleopen | 1280×720 | 0.07 | 1.12 | 0.13 |
| circleclose | 72×45 | 0.19 | 1.56 | 0.08 |
| circleclose | 320×180 | 0.13 | 1.12 | 0.07 |
| circleclose | 1280×720 | 0.13 | 1.12 | 0.07 |

Mọi ô: ≤8 = 100%, ≤32 = 100% → KHỚP ở tất cả 18 điểm đo.
Đối xứng gương đúng như lý thuyết: MAD open(p) = MAD close(1−p).

### 4.3 Test suite liên quan

- `node apps/web/src/lib/transitionPreview.test.ts`: 20/20 pass
  (trước: 18 — thay 1 test biên cứng cũ bằng 3 test gradient).
- `node apps/web/scripts/v5-preview-badge.test.cjs`: 141 assertions PASS.
- `tsc --noEmit` toàn apps/web: exit 0, không lỗi.
- esbuild parse `preview.tsx`: pass (chỉ kiểm tra cú pháp, không thay
  tsc).

## 5. Giới hạn còn lại (trung thực, không claim quá)

- **Sai số dư có hệ thống nhỏ tại p=0.5**: MAD 1.12–1.56 (so với
  0.07–0.19 tại p=0.25/0.75). Phân tích theo bin rho tại 72×45, p=0.5:
  trọng số đo thấp hơn mô hình cosin trung bình ~0.011 ở rho 0.2–0.5,
  ~0.003 ở các bin còn lại. Nguyên nhân chưa xác định chắc chắn
  (có thể FFmpeg đánh giá nội bộ khác cosin thuần một chút, hoặc làm
  tròn trung gian) — KHÔNG bịa hệ số hiệu chỉnh để ép MAD về 0 khi
  chưa có công thức có nguyên lý. Số vẫn trong ngưỡng KHỚP với biên
  an toàn (MAD ≤ 1.56 so với ngưỡng 2), nhưng nếu ngưỡng siết xuống
  dưới 1.0 thì p=0.5 sẽ rớt — cần công thức chính xác hơn mới claim
  mạnh hơn.
- **Preview canvas thật chưa chụp màn hình**: mask canvas được kiểm
  chứng bằng cùng hàm trọng số + logic destination-in (đọc code +
  esbuild parse), không phải ảnh chụp trình duyệt — giống giới hạn
  chung của harness (composite ≠ canvas thật). Cần click-test CDP
  riêng để chụp frame preview thật của circleopen/circleclose
  (ngoài phạm vi luồng này).
- **Mask canvas tốn 1 canvas offscreen full-frame mỗi frame** khi clip
  đang trong cửa sổ circleopen/circleclose — chưa đo FPS ảnh hưởng
  (nợ đo FPS kế thừa từ các đợt trước).
- **Chỉ đo nguồn màu phẳng**: chưa đo footage quay thật / clip dài /
  1080p (đo lớn nhất 1280×720). Gradient chỉ phụ thuộc hình học nên
  nguồn phẳng là đủ cho mô hình, nhưng chưa chứng minh trên footage.
- **dissolve vẫn LỆCH (85.52)**: ngoài phạm vi, không đụng.
- **Type cũ diamond/clock chưa dịch +0.5**: nợ cũ từ đợt 12, không đụng.

## 6. File đổi/thêm (tương đối từ repo root)

- `apps/web/src/lib/transitionPreview.ts` — vùng radial-gradient,
  `radialGradientWeight`, viết lại 2 case circleopen/circleclose.
- `apps/web/src/lib/transitionPreview.test.ts` — 3 test gradient,
  `regionNonEmpty` thêm nhánh radial-gradient, import hàm mới.
- `apps/web/src/preview.tsx` — nhánh mask radial-gradient trong
  `drawVideoClipWithTransition` + hàm `drawVideoClipWithRadialMask`,
  import `radialGradientWeight`.
- `apps/web/src/components/transitions/previewStatus.ts` — nâng badge
  circleopen/circleclose lên matched + chú thích số đo.
- `server/render/src/test_v11_parity.js` — rasterizer radial-gradient
  (regionCovers, layerPixelAlpha, nhánh crossfade), thêm case
  circleclose, dùng hàm trọng số thật từ module khi có.
- `docs/PHASE9_ROUND13_C1_CIRCLE_LIMITS.md` — file này.

Probe chỉ chạy ở /tmp (không commit): `/tmp/probe_circle13.js`
(w(rho) theo P cho cả 2 type), `/tmp/measure_circle13b.js` (MAD đa
p/đa kích thước), `/tmp/analyze_resid.js` (phân tích sai số dư).
