# Phase 9 đợt 12 — Luồng T2: hình học transition cho 14 type V3 + mô hình circleopen (LIMITS)

Ngày: 2026-10-27. Chạy trong đợt lớn đợt 12 (đóng nợ đợt 11).
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG code giả.
Phạm vi đúng task: `transitionPreview.ts` (hình học transition) +
harness V11 phần transition + test của nó. Không đụng ghost preview,
`previewStatus.ts`, `projectRepo.ts`, speed-curve UI.

## 1. Việc đã làm

- Thêm hình học cho đủ 14 type V3 (đợt 10 thêm vào catalog render nhưng
  preview chưa có → fallback fade, MAD ~85 ở đợt 11 P1):
  diamondclose, squareopen/close, checker-alt, blinds-diag, split-h/v,
  barn-h/v, rings, corners, star, clock-ccw, spiral. Tất cả map trực
  tiếp từ expr trong `server/render/src/transitions.js`.
- Đổi mô hình circleopen sang đường cong hoàn thành sớm (xem §3).
- Mở rộng harness V11 (`server/render/src/test_v11_parity.js`) thêm 12
  case transition V3 còn lại (diamondclose, squareopen đã có từ P1).

## 2. Quy ước tọa độ khối V3 — phát hiện bằng probe, không phải đoán

Probe FFmpeg 8.1.2 (khung 72×45, nguồn đỏ/xanh, p=0.5) chứng minh expr
xfade custom đánh giá tại CHỈ SỐ pixel nguyên (X, Y), không phải tâm
pixel:

- split-h: hàng y=22 thuộc nửa trên (Y=22 < 22.5), B ở cột 0..35
  (X<36); hàng y=23 thuộc nửa dưới, B ở cột 37..71 (X>36, cột 36 là A).
- barn-h: dải phải bắt đầu ở cột 55, không phải 54 (X>54 → X>=55).
- blinds-diag: hàng y=0 có B tại [0,3), [6,9), [12,15)... khớp đúng
  `mod(X+Y, 5.625) < 2.8125` với X, Y nguyên.

Hệ quả: hình học V3 tính trong không gian chỉ số rồi dịch +0.5 sang
không gian tâm điểm (nơi harness lấy mẫu và canvas cắt clip). Không
dịch thì biên lệch 1 pixel ở mọi ngưỡng không nguyên — lần đo đầu
của đợt này (chưa dịch, quét hàng tại điểm giữa dải) cho blinds-diag
MAD 75.56 và rings MAD 77.34, tức gần như chưa có hình học. Sau khi
dịch, cả 14 type đều KHỚP ở frame giữa (xem §4). Quy đổi ngưỡng dùng
trong code: lt giữ nguyên +0.5; gt thành `floor(v)+1` rồi +0.5; lte
thành `[ceil(lo), floor(hi)+1)` rồi +0.5 (cận đóng 2 đầu, xem lỗi
square ở §5); polygon thì dịch tâm +0.5, bán kính không đổi.

Các type cũ (không phải V3) GIỮ NGUYÊN quy ước liên tục sẵn có, không
đổi trong đợt này — nên diamond cũ vẫn lệch nửa pixel so với expr
(ước tính MAD ~4, chưa đo lại). Đó là nợ mở, không phải lỗi mới.

## 3. circleopen: đo lại và đổi mô hình

### 3.1 Probe gradient theo bán kính (khung 72×45, A đỏ / B xanh)

Trọng số blend w = B/(A+B) theo bán kính chuẩn hoá rho = r/rMax:

| P | B thuần | A thuần | Blend | rho(w=0.9) | rho(w=0.5) | rho(w=0.1) |
|---|---|---|---|---|---|---|
| 0.1–0.2 | 0% | 100% | 0% | – | – | – |
| 0.3 | 0% | 97.9% | 2.1% | – | – | 0.202 |
| 0.4 | 0% | 70.0% | 30.0% | – | 0.197 | 0.501 |
| 0.5 | 13.5% | 24.7% | 61.9% | 0.193 | 0.497 | 0.799 |
| 0.6 | 56.9% | 0% | 43.1% | 0.492 | 0.795 | – |
| 0.7 | 95.9% | 0% | 4.1% | 0.791 | – | – |
| 0.8–0.9 | 100% | 0% | 0% | – | – | – |

Tại P=0.5, w(rho) khớp đường cosin `(1+cos(pi*rho))/2` trong ±0.01
tại 20 bin (vd rho=0.28 → 0.81 đo vs 0.82 cosin; rho=0.48 → 0.53 vs
0.53; rho=0.68 → 0.24 vs 0.23). Bán kính giữa dải (w=0.5) tuân theo
luật tuyến tính `rho_mid = 3P − 1` với sai số ≤0.005 (0.4→0.197,
0.5→0.497, 0.6→0.795). Dải gradient rộng ~0.6*rMax, hoàn thành sớm:
B thuần 100% từ P≈0.8, blend bắt đầu từ P≈0.3.

### 3.2 Mô hình preview mới và chứng cứ cải thiện

Preview chỉ có vùng biên cứng + alpha đều nên KHÔNG vẽ được dải
gradient. Mô hình mới: vòng tròn biên cứng tại bán kính GIỮA dải,
`r = clamp(3p−1, 0, 1) * rMax`, thay vì `r = p * rMax`. Tại P=0.5 hai
mô hình trùng nhau (r = 0.5*rMax) nên MAD frame giữa không đổi —
nhưng đường cong thời gian đúng hơn hẳn, đo bằng MAD composite trên
frame render thật tại nhiều P:

| P | MAD cũ (p*rMax) | MAD mới (3p−1) |
|---|---|---|
| 0.30 | 23.96 | 3.16 |
| 0.35 | 28.62 | 14.29 |
| 0.40 | 34.49 | 22.73 |
| 0.45 | 40.13 | 39.78 |
| 0.50 | 43.50 | 43.50 |
| 0.55 | 46.81 | 39.75 |
| 0.60 | 45.02 | 31.72 |
| 0.65 | 45.45 | 12.36 |
| 0.70 | 39.11 | 5.71 |
| trung bình | 38.57 | 23.67 |

Mô hình mới thắng ở mọi P (trừ hòa tại 0.5). Nhưng trung thực mà nói:
tại P≈0.45–0.55 MAD mới vẫn ~40 vì lúc đó dải gradient phủ gần hết
khung — vòng tròn biên cứng nào cũng sai ~40. Muốn MAD thấp hẳn cần
vẽ gradient thật (mask alpha theo bán kính), ngoài phạm vi
`TransitionLayerSpec` hiện tại (1 vùng + 1 alpha). Circleopen vì vậy
VẪN LỆCH theo thang pixel ở frame giữa, nhưng là lệch đã hiểu rõ
nguyên nhân và đã đúng về thời gian, không còn là mô hình sai.

## 4. Kết quả harness V11 (chạy lại sau sửa, FFmpeg 8.1.2, VM 2 CPU)

Khung 72×45, A đỏ / B xanh, frame giữa p=0.5. Thang V6/V11 giữ nguyên:
KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤ 8; XẤP XỈ = MAD ≤ 20 và ≥90%
pixel lệch ≤ 32; còn lại LỆCH.

| Type | MAD | ≤8 | Kết luận | Ghi chú |
|---|---|---|---|---|
| diamondclose | 0.00 | 100.0% | KHỚP | Trước: 85.00 (fallback fade) |
| squareopen | 0.00 | 100.0% | KHỚP | Trước: 85.00; sau sửa cận đóng (§5) |
| squareclose | 0.00 | 100.0% | KHỚP | Mới |
| checker-alt | 0.00 | 100.0% | KHỚP | Mới |
| blinds-diag | 0.00 | 100.0% | KHỚP | Mới; lần đo đầu (chưa dịch) 75.56 |
| split-h | 0.00 | 100.0% | KHỚP | Mới |
| split-v | 0.00 | 100.0% | KHỚP | Mới |
| barn-h | 0.00 | 100.0% | KHỚP | Mới |
| barn-v | 0.00 | 100.0% | KHỚP | Mới |
| rings | 0.05 | 100.0% | KHỚP | Mới; lần đo đầu (nhánh ngược) 77.34 |
| corners | 0.00 | 100.0% | KHỚP | Mới |
| star | 0.52 | 99.7% | KHỚP | Mới; dư do lấy mẫu 96 đỉnh |
| clock-ccw | 0.00 | 100.0% | KHỚP | Mới |
| spiral | 0.05 | 100.0% | KHỚP | Mới; lần đo đầu (dây cung) 84.95 |
| circleopen | 43.50 | 5.5% | LỆCH | Gradient không mô hình hoá được (§3) |
| dissolve (cũ, ngoài phạm vi) | 85.52 | 49.7% | LỆCH | Giữ nguyên từ P1, không đụng tới |

Tổng harness: 23 case (19 transition + 4 text), FAIL (LỆCH) chỉ còn
circleopen và dissolve; text không đổi so với P1 (tiltIn 1.10 XẤP XỈ,
skewIn 0.94 XẤP XỈ, slideReveal 0.93 KHỚP, curtainIn 0.40 KHỚP).
Unit test: `node apps/web/src/lib/transitionPreview.test.ts` → 18/18
pass (gồm 3 test V3 mới + test circleopen theo luật 3p−1 + catalog
đủ 82 type). `tsc --noEmit` trong apps/web → exit 0, không lỗi.

## 5. Ba lỗi tìm ra và sửa trong đợt (đều có số đo trước/sau)

1. **rings viết ngược 2 nhánh vành** (bản đầu): khi tâm hàng nằm
   NGOÀI vành (dy < lo) code cũ trả về 1 khoảng xuyên tâm thay vì 2
   khoảng 2 bên → B phủ 95.6% khung (render 50.9%), MAD 77.34. Sửa
   nhánh: `dy >= lo` → 1 khoảng xuyên tâm, còn lại → 2 khoảng.
   Sau sửa MAD 0.05.
2. **spiral đóng dải bằng dây cung thẳng** (bản đầu): 2 đầu dải cách
   nhau 2PI*p (tại p=0.5 là đối nhau qua tâm) nên dây cung đi xuyên
   tâm và chẻ dải thành 2 thùy hẹp → B chỉ 15.9% (render 51.3%),
   MAD 84.95. Sửa: đóng dải bằng CUNG TRÒN ngoài bán kính rMax.
   Sau sửa B 51.2% vs render 51.3%, MAD 0.05.
3. **squareopen/squareclose dùng cạnh s cho cận lte đóng 2 đầu**
   (bản đầu): tập chỉ số là [cx−s/2, cx+s/2] nhưng rect lấy đúng s
   → thiếu 1 cột khi cx nguyên mà cy nửa nguyên (khung 72×45 thiếu
   cột 54), MAD 1.89. Sửa: cận qua `ceil(lo)` / `floor(hi)+1` rồi
   dịch +0.5. Sau sửa MAD 0.00. Cùng lỗi này ở p=0: bản đầu cho B rỗng,
   bản sửa cho đúng 1 pixel tâm (1×1) như expr.

## 6. Giới hạn còn lại (đọc trước khi claim)

- **circleopen vẫn LỆCH ở frame giữa** (MAD 43.50): dải gradient rộng
  ~0.6*rMax không biểu diễn được bằng 1 vùng biên cứng + alpha đều.
  Mô hình mới chỉ đúng về thời gian (bán kính giữa dải + hoàn thành
  sớm), không đúng về từng pixel trong dải. Cần mask alpha xuyên tâm
  mới khớp pixel — đó là việc cho đợt sau, không phải sửa số.
- **Composite harness ≠ preview canvas thật** (kế thừa từ P1): harness
  vẽ CẢ 2 lớp A/B lên cùng 1 frame để kiểm tra hình học; preview thật
  chỉ vẽ 1 clip/lần, phần còn lại là nền đen. Composite KHỚP chứng
  minh hình học đúng, không chứng minh canvas vẽ ra frame đó.
- **Cạnh biên V3 trên canvas thật mềm 0.5px**: rect/polygon đã dịch
  +0.5 nên biên rơi giữa pixel → canvas antialias cho biên mềm 1px
  (50% ở pixel biên khi ngưỡng không nguyên). Mắt thường không thấy;
  harness lấy mẫu tâm pixel thì khớp tuyệt đối.
- **Quét hàng ở khung lớn là xấp xỉ**: `rowScanPair` dùng tối đa 160
  dải; dải cao hơn 1px lấy khoảng tại hàng giữa dải (sai số ≤ nửa
  dải, ~0.3% chiều cao ở 1080p). Khung ≤ 360px quét đúng từng hàng
  pixel. Chưa đo pixel ở 1080p, chỉ đo ở 72×45.
- **Spiral ở khung lớn chưa đo pixel**: dải xoắn quấn nhiều vòng khi
  rMax lớn (0.03*rMax ≈ 33 rad ở 1080p); polygon vẫn đơn (2 biên không
  cắt nhau vì cần chênh r ≈ 209 mới trùng góc) nhưng chỉ mới kiểm
  chứng MAD ở 72×45 (0.05). Đừng claim khớp ở HD khi chưa đo.
- **corners: trường hợp biên reach nguyên**: khoảng góc tính bằng
  `sqrt(R²−dy²)`; nếu reach rơi đúng số nguyên thì lệch 1 cột (đo ở
  p=0.5 không gặp vì R² có phần lẻ). Hiếm, không đáng sửa.
- **Type cũ diamond (không phải V3) chưa dịch +0.5**: vẫn dùng quy ước
  liên tục cũ, lệch nửa pixel so với expr. Đợt sau có thể áp cùng
  phép dịch cho diamond/clock cũ để đồng nhất — không làm trong đợt
  này vì ngoài phạm vi task.
- **Chỉ đo frame giữa p=0.5** (trừ probe circleopen đo nhiều P):
  đường cong thời gian của 14 type V3 chưa đo toàn bộ, chỉ suy ra từ
  việc map đúng expr. Chưa đo footage thật, HD, clip dài.
- **dissolve vẫn LỆCH** (85.52): lưới hash 20×12 vs nhiễu từng pixel
  của render — ngoài phạm vi đợt này, giữ nguyên từ P1.

## 7. File đổi/thêm (đường dẫn đầy đủ, tương đối từ repo root)

- `apps/web/src/lib/transitionPreview.ts` — thêm 14 case V3 + helper
  `rowScanPair`/`mergeIntervals`, đổi mô hình circleopen sang
  `clamp(3p−1, 0, 1)*rMax`, cập nhật chú thích đầu file (catalog 81 type).
- `apps/web/src/lib/transitionPreview.test.ts` — 3 test V3 mới, test
  circleopen theo luật 3p−1, catalog 68 → 82 type.
- `server/render/src/test_v11_parity.js` — thêm 12 case transition V3
  (diamondclose, squareopen đã có từ P1).
- `docs/PHASE9_ROUND12_T2_TRANSITION_LIMITS.md` — file này.
- Probe chỉ chạy ở /tmp (không commit): `/tmp/probe_circleopen.js`
  (w(rho) theo P), `/tmp/probe_v3.js` (ngưỡng chỉ số nguyên),
  `/tmp/probe_co_mad.js` (MAD cũ/mới theo P), `/tmp/debug_spiral.js`
  (đối chiếu polygon spiral với expr).

## 8. Chưa chứng minh được

- Preview canvas thật (preview.tsx) vẽ 14 type V3 ra đúng frame như
  composite harness hay không — cần click-test CDP trên browser thật
  (ngoài phạm vi luồng này; harness chỉ chứng minh hình học).
- MAD của 14 type V3 ở kích thước khác 72×45 (đặc biệt HD 1080p) và
  ở các p khác 0.5 — mới chỉ có circleopen đo nhiều P.
- circleclose có cùng gradient với circleopen hay không — chưa đo,
  không claim; circleclose giữ nguyên mô hình cũ.
