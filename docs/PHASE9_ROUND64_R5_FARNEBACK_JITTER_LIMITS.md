# Đợt 64 R5 — Metric jitter bằng Farneback dense optical flow: LIMITS trung thực

Ngày đo: 2026-11-08 (lượt cron ~12:35 +07).
Máy đo: VM này (4 vCPU, RAM ~7.8GB, CPU-only, FFmpeg 8.1.2, libx264, OpenCV 5.0.0
trong `server/tracking/.venv`).
Đóng nợ đợt 63 R2 §8 mục 4 (`docs/PHASE9_ROUND63_R2_RENDER_COST_LIMITS.md` §8 (c)):
thử optical flow dày (Farneback) làm metric jitter — phase correlation đã bị bác bỏ.
Harness mới: `server/render/src/test_round64_r5_farneback_jitter.js`
(**27/27 pass, exit 0**).
Log đầy đủ tại `workspace/goals/capcut-clone-video-editor/hidden_files/round64-r5/`
(`r64r5-farneback-run1.log`, `r64r5-marker.log`, `r64r5-marker2.log`,
`r64r5-pan8.log`).
Không sửa code production, không đụng web (không cần tsc/vite — xem §9).

## 1. Kết luận ngắn — đọc trước

- **Farneback KHÔNG bị bác bỏ như phase correlation — nhưng cũng KHÔNG thay
  MAD làm headline.** Kết luận: **đồng-chính (co-primary) với MAD**.
  F2_V5 (= mean|Δm| trên chuỗi dịch chuyển toàn cục ước lượng bằng Farneback
  thresholded-median, winsize 25) ổn định hơn MAD ở cả 2 lượt độc lập và nhạy
  với jitter thật (giảm 85–91% so với đối chứng), đồng thời đo đúng chuyển động
  (không lẫn nhiễu pixel như MAD). Nhưng giá trị tuyệt đối của nó trên video
  stabilize bị đội lên bởi sàn nhiễu của bộ ước lượng, và nó bị nhiễu bởi mức
  denoise (tăng ~50% từ denoise 0 lên 0.5) — nên không được dùng một mình để
  kết luận, và không được so sánh xuyên mức denoise.
- **V0 (median naive) BỊ BÁC BỎ hoàn toàn.** Median flow trên nội dung phẳng
  tổng hợp ≈ 0 (corr 0,67/0,78; RMSE 7,07px; slope 0,005) vì flow field 2 chế
  độ: ~60% pixel vùng phẳng có |flow|≈0, ~40% pixel cạnh có flow đúng — median
  rơi vào phe phẳng. Đừng bao giờ dùng median flow thô làm metric.
- **F5 BỊ LOẠI.** Tỉ lệ pixel dư >1px gần như không phân biệt stabilize với
  đối chứng (giảm −3,1% lượt 3, +7,7% lượt 4) — nó đo sàn nhiễu, không đo
  jitter. Spread thấp của nó (10,5%) là rỗng (không nhạy = ổn định giả).
  Harness có tính "metric ổn định nhất theo spread" và đã chọn F5 ở lượt 3 —
  con số đó VÔ NGHĨA, đừng trích.
- **F4 chỉ là chẩn đoán phụ về ghosting, không phải metric jitter.** F4 tăng
  theo denoise (0,67 → 0,98 → 0,95) trong khi jitter thật không đổi — nó nhạy
  với vệt blend của hqdn3d.
- **Phase correlation J1c/J2c/J3c bị giáng cấp thêm một bậc.** Trọng tài độc lập
  bằng marker đỏ (ground truth, corr 1,0 / RMSE 0,033px trên đối chứng) cho
  thấy spread 72–179% của J*c ở lượt 4 là TẠO TÁC của bộ ước lượng (nó vừa
  đánh giá thấp 5× vừa đánh giá cao 2–4× so với chuyển động thật), không phải
  chất lượng stabilize thật. J2c không còn là "chẩn đoán phụ nhạy nhất" nữa —
  chỉ giữ làm tham chiếu lịch sử.
- **Phát hiện phụ quan trọng: vidstab sinh frame nhảy hoang đơn lẻ.** Ở lượt 3
  stab3, frame 20 marker nhảy +32px trong đúng 1 frame rồi về chỗ cũ. Metric
  trung bình (MAD, F2) giấu nhẹm frame này; metric std/RMS (J1, M1, J3, M3)
  bị nó thổi phồng 2–3×. Cần thêm metric "frame tệ nhất" (max/p99) — nợ mở.

## 2. Thiết kế estimator — vì sao median thô chết, thresholded-median sống

Nội dung test là testsrc tổng hợp (nền phẳng lớn + ô cờ 20px + vài hình lớn).
Chẩn đoán trên cặp frame thật (dịch chuyển (−1,95, +4,05)px theo phase corr):
flow field 2 chế độ — p25|flow| = 0, p50 ≈ 0, p75 ≈ 4,5px, 42% pixel có
|flow|>1px. Dịch chuyển tổng hợp (+5,+3)px: median flow = (0,001, 0,000),
mean = (1,73, 1,06) (chỉ 35% giá trị thật). Median rơi vào đa số phẳng → 0.

Các biến thể đã thử (validate trên rung đã biết, seed 7; bar R2: corr>0,8,
RMSE<1,5px):

| Biến thể | corrX / corrY | RMSE (px) | slope X / Y | Kết luận |
|---|---|---|---|---|
| V0 median w15 | 0,670 / 0,782 | 7,067 | 0,005 / 0,005 | LOẠI |
| V1 median w25 | 0,939 / 0,991 | 2,646 | 0,673 / 0,746 | corr qua, RMSE trượt |
| V2 thresh-median w15 (\|flow\|>1px) | 0,965 / 1,000 | 1,559 | 0,872 / 0,992 | sát bar (trượt 0,06px) |
| **V5 thresh-median w25 (\|flow\|>1px)** | **0,970 / 1,000** | **1,410** | **0,906 / 0,988** | **QUA bar — estimator chính** |
| V3 mean w25 | 0,974 / 0,999 | 3,614 | 0,480 / 0,536 | nén hệ số ~0,5 |
| V4 mean w15 | 0,974 / 0,999 | 4,572 | 0,344 / 0,387 | nén hệ số ~0,35 |
| V6 thresh 0,5px w15 | 0,962 / 1,000 | 1,632 | 0,859 / 0,990 | trượt nhẹ |
| V7 thresh 0,5px w25 | 0,968 / 1,000 | 1,458 | 0,898 / 0,984 | qua bar (dự phòng) |

Thresholded-median = median chỉ trên pixel có |flow| > 1px (quần thể "đang
chuyển động"). Nó gần như không chệch (slope ~0,9–1,0) vì quần thể trên ngưỡng
mang đúng dịch chuyển, trong khi median/mean bị pha loãng bởi pixel phẳng.
Ngưỡng 1px không nhạy cảm lắm: 0,5px cũng qua bar (V7 RMSE 1,458px) — lựa
chọn ngưỡng không phải điểm yếu chí mạng, nhưng vẫn là một hằng số tùy chọn
cần ghi rõ.

Metric (crop giữa 160×90 của frame 320×180 gray, như J\*c của R2; m_t =
chuỗi dịch chuyển toàn cục theo estimator):
F1 = std(mx)+std(my); F2 = mean|Δmx|+mean|Δmy|;
F3 = RMS quỹ đạo tích lũy đã khử xu hướng (cửa sổ 15) — cùng công thức J1/J2/J3.
F4 = mean |flow25 − m5| (dư cục bộ / phi-rigid, chỉ flow dày mới có);
F5 = tỉ lệ pixel có |flow25 − m5| > 1px.

## 3. Pan texture — giới hạn dịch chuyển lớn của Farneback

Clip pan từ noise texture (Gaussian σ=2, texture khắp nơi), shift đã biết:

| Pan | V0 (median w15) | V5 (thresh w25) | Phase corr toàn frame |
|---|---|---|---|
| 24px/frame, kỳ vọng (−24, 0) | mean (−0,31, −0,11), RMSE **23,72px**, trong ±2px: 0% | mean (−0,30, −0,10), RMSE **23,76px**, trong ±2px: 0% | mean (−23,97, 0,00), RMSE **0,034px**, 100% |
| 8px/frame, kỳ vọng (−8, 0) | mean (−7,53, 0), RMSE **1,14px**, trong ±2px: 94,6% | mean (−7,89, 0), RMSE **0,285px**, trong ±2px: 99,3% | mean (−7,99, 0,00), RMSE **0,017px**, 100% |

- Farneback (levels=3, winsize 15/25, 320×180) **không theo kịp dịch chuyển
  24px/frame** — kể cả trên nội dung giàu texture, kể cả V5. Đây là giới hạn
  pyramid/window với dịch chuyển lớn, không phải lỗi texture. Với đo jitter
  (dịch chuyển dư ~0–2px, rung nguồn ~5–10px) giới hạn này không chạm tới —
  nhưng đừng bao giờ dùng Farneback tham số này để ước lượng chuyển động lớn.
- V0 làm việc được trên texture ở 8px/frame (RMSE 1,14px) nhưng chết trên nội
  dung phẳng tổng hợp — thất bại của V0 là **do nội dung**, không phải do
  Farneback nói chung.
- Phase correlation vẫn là vua với dịch chuyển lớn, nguyên vẹn (RMSE 0,02–
  0,03px) — điểm mạnh của nó nằm ở đó, không phải ở đo jitter sub-pixel.

## 4. So sánh trực tiếp trên cùng render R2 (2 lượt × đối chứng 2 + stab 0.5 ×3)

Đối chứng tái lập giống hệt R2 tới 4 chữ số (MAD 11,8789; J1c 9,9443;
F2_V5 13,4624; lặp lại chênh 0,00% — pipeline xác định). Toàn bộ số dưới đây
đo trên CÙNG render, CÙNG frame với R2.

### 4.1 Lượt 3 (phiên .trf xấu: stab3 tốt thật, stab1/stab2 tệ)

| Metric | Đối chứng | stab1 / stab2 / stab3 | Giảm | Spread |
|---|---|---|---|---|
| MAD mean | 11,8789 | 4,3694 / 4,2967 / 1,9272 | 70,3% | **69,2%** |
| J1c | 9,9443 | 7,7877 / 1,7314 / 2,8323 | 58,6% | 147,1% |
| J2c | 14,1619 | 2,7647 / 0,7968 / 1,0295 | 89,2% | 128,6% |
| J3c | 4,3137 | 6,8412 / 1,1489 / 1,5280 | 26,5% | 179,4% |
| F1_V5 | 9,4973 | 2,9462 / 3,2531 / 2,1251 | 70,8% | 40,7% |
| **F2_V5** | 13,4624 | 2,4884 / 2,4455 / 1,2065 | **84,8%** | **62,6%** |
| F3_V5 | 4,2553 | 2,0532 / 2,2928 / 1,9260 | 50,9% | 17,5% |
| F4 | 2,9366 | 1,2782 / 1,2115 / 0,8932 | 61,6% | 34,1% |
| F5 | 0,5151 | 0,5631 / 0,5075 / 0,5233 | −3,1% | 10,5% (rỗng) |
| F2_V2 | 13,2891 | 2,3309 / 2,4014 / 1,2457 | 85,0% | 58,0% |
| F2_V1 | 10,6545 | 0,1225 / 0,1020 / 0,0404 | 99,2% | 93,0% |
| F2_V0 | 0,8845 | 0,0584 / 0,0305 / 0,0084 | 96,3% | 154,2% |

### 4.2 Lượt 4 (phiên .trf tốt: 3 lần stabilize đều tốt)

| Metric | Đối chứng | stab1 / stab2 / stab3 | Giảm | Spread |
|---|---|---|---|---|
| MAD mean | 11,8789 | 1,8953 / 2,2412 / 1,9611 | 82,9% | **17,0%** |
| J1c | 9,9443 | 1,3495 / 1,0347 / 0,2645 | 91,1% | 122,9% |
| J2c | 14,1619 | 0,4815 / 0,4332 / 0,2109 | 97,4% | 72,1% |
| J3c | 4,3137 | 1,2816 / 0,7024 / 0,2164 | 83,0% | 145,2% |
| F1_V5 | 9,4973 | 2,1008 / 1,6820 / 1,9960 | 79,7% | 21,7% |
| **F2_V5** | 13,4624 | 1,2409 / 1,1735 / 1,2766 | **90,9%** | **8,4%** |
| F3_V5 | 4,2553 | 1,6195 / 1,3869 / 1,3876 | 65,6% | 15,9% |
| F4 | 2,9366 | 0,9185 / 0,8178 / 0,8213 | 71,0% | 11,8% |
| F5 | 0,5151 | 0,5099 / 0,4697 / 0,4463 | 7,7% | 13,4% |
| F2_V2 | 13,2891 | 1,2379 / 1,2901 / 1,3035 | 90,4% | 5,1% |
| F2_V1 | 10,6545 | 0,0331 / 0,0617 / 0,0438 | 99,6% | 61,9% |
| F2_V0 | 0,8845 | 0,0051 / 0,0152 / 0,0074 | 99,0% | 109,4% |

### 4.3 Đọc số

- **F2_V5 ổn định hơn MAD ở cả 2 lượt**: 62,6% so với 69,2% (lượt 3, hơn
  10% tương đối) và 8,4% so với 17,0% (lượt 4, hơn 51% tương đối). F2_V2 còn
  hơn nữa: 58,0% / 5,1%. Gộp 2 lượt (trung bình): F2_V5 35,5% so với MAD
  43,1%; F2_V2 31,6% so với 43,1%.
- **Nhưng đừng đọc quá:** ở lượt 3, spread chủ yếu là biến thiên chất lượng
  THẬT (stab3 tốt gấp ~2× stab1/stab2 theo MAD) — F2_V5 xếp hạng đúng y như
  MAD (stab3 tốt nhất), nên spread 62,6% của nó phần lớn là phản ánh thực tế,
  không phải nhiễu đo. So sánh nhiễu đo sạch nhất là lượt 4 (chất lượng đồng
  đều): F2_V5 8,4% so với MAD 17,0% — ổn định gấp ~2× khi chất lượng giữ
  nguyên.
- **F2_V5 nhạy với jitter thật**: giảm 85–91% so với đối chứng (ngang J2c
  89–97%, hơn MAD 70–83%). Trên đối chứng, F2_V5 ≈ J2c (13,46 so với 14,16)
  và F1_V5 ≈ J1c (9,50 so với 9,94) — hai bộ ước lượng đồng thuận khi dịch
  chuyển lớn.
- **F1_V5 / F3_V5 cũng tốt nhưng không vượt trội**: F1_V5 thắng MAD ở lượt 3
  (40,7% so với 69,2%) nhưng thua ở lượt 4 (21,7% so với 17,0%). F3_V5:
  17,5% / 15,9% so với MAD 69,2% / 17,0% — tốt ở lượt 3, ngang ở lượt 4.
- **V1 (median w25) tuy giảm sâu (99%+) nhưng spread 62–93%** — nén hệ số
  không đều giữa các lần chạy, không dùng được. V0 tệ nhất (109–154%).
- **Full-frame V5 (đối chứng bẫy)**: trên đối chứng F1_V5full ≈ F1_V5
  (9,94 so với 9,50 — không viền đen nên giống nhau); trên video stabilize
  full-frame đọc CAO hơn center ~15–30% (stab1 lượt 3: 3,85 so với 2,95;
  lượt 4: 2,45 so với 2,10) — ngược với phase corr (full-frame đọc thấp hẳn
  vì viền đen tĩnh). Lý do: thresholded-median loại pixel viền (flow≈0) khỏi
  quần thể tính, nên không bị pha loãng; phần tăng thêm đến từ vùng biên
  viền đen/nội dung của vidstab. Vẫn dùng crop giữa như R2 — full-frame chỉ
  để đối chiếu, không phải số chính.

## 5. Trọng tài marker đỏ — ground truth độc lập

Nguồn shaky có vuông đỏ 40×40 làm marker. Centroid marker mỗi frame = chuyển
động toàn cục thật, độc lập với cả phase corr lẫn Farneback. Validate trên đối
chứng: **corrX = 1,0; corrY = 1,0; RMSE 0,033px**; M1 = 9,967 (J1c: 9,944),
M2 = 14,19 (J2c: 14,16), M3 = 4,32 (J3c: 4,31) — marker khớp phase corr gần
như tuyệt đối khi dịch chuyển lớn. Phương pháp đáng tin.

| Video | M1 (marker) | M2 (marker) | M3 (marker) | J1c | F2_V5 | MAD |
|---|---|---|---|---|---|---|
| Lượt 4 stab1 | 1,51 | 0,86 | 0,75 | 1,35 | 1,24 | 1,90 |
| Lượt 4 stab2 | 2,07 | 0,99 | 1,04 | 1,03 | 1,17 | 2,24 |
| Lượt 4 stab3 | 1,43 | 0,71 | 0,71 | 0,26 | 1,28 | 1,96 |
| Lượt 3 stab1 | 3,14 | 2,23 | 1,50 | 7,79 | 2,49 | 4,37 |
| Lượt 3 stab2 | 2,29 | 1,23 | 1,16 | 1,73 | 2,45 | 4,30 |
| Lượt 3 stab3 | 3,10* / 5,67† | 0,98* / 2,06† | 1,58* / 3,11† | 2,83 | 1,21 | 1,93 |

\* nội suy frame glitch 20; † gồm frame glitch (xem §6).

- **Lượt 4: marker nói 3 lần stabilize tương đương nhau** (M2 spread ~33%,
  M1 ~37%) — J1c nói stab3 tốt gấp 5× stab1 (0,26 so với 1,35) là SAI, là
  tạo tác của phase correlation ở dịch chuyển sub-pixel (nó vừa đánh giá thấp
  5× ở stab3 vừa đánh giá cao ~2× ở stab1 lượt 3 so với marker). MAD và
  F2_V5 đúng: 3 lần tương đương.
- **Lượt 3: marker xác nhận stab1 tệ nhất** (M2 2,23) và stab3 tốt nhất
  (M2 0,98 sau nội suy glitch) — cùng thứ hạng với MAD và F2_V5.
- **F2_V5 đọc cao hơn marker ~1,3–2× trên video stabilize** (lượt 4: F2
  1,17–1,28 so với M2 0,71–0,99; lượt 3 stab2: 2,45 so với 1,23). Có sàn
  nhiễu của bộ ước lượng (~0,5–1,2) cộng vào — F2 tốt để XẾP HẠNG và so với
  đối chứng, nhưng giá trị tuyệt đối trên video stabilize bị đội lên. Đây là
  lý do chính nó chưa thay được MAD làm headline: MAD là ground truth pixel,
  F2 là ước lượng có sàn nhiễu.
- J3c/M3: marker M3 lượt 4 (0,71–1,04) so với J3c (0,22–1,28) — J3c cũng
  dao động quanh ground truth cả hai chiều.

## 6. Frame nhảy hoang đơn lẻ (vidstab glitch frame)

Lượt 3 stab3, frame 20 (trong 150): centroid marker (202,0, 108,2) so với
frame 19/21 (169,6, 100,5) — **nhảy (+32,4, +7,7)px trong đúng 1 frame rồi về
chỗ cũ**; max kênh đỏ 219 thay vì 255; ngưỡng đỏ chặt tìm được 0 pixel (frame
này làm NaN cả phép đo marker lần đầu). Farneback V5 chỉ thấy ~10px của cú
nhảy (cặp 19→20: (8,32, 6,28)) — flow bị bão hòa. Cặp 19→20 và 20→21 đóng góp
~0,16 vào F2_V5 (1,21 có glitch so với 1,05 không có). V5 series còn vài cú
nhảy lớn khác ở cặp ~30–31 và ~40 (|Δm| 13–14px).

Hệ quả đo lường: metric trung bình (MAD, F2) giấu frame glitch (2/149 cặp);
metric std/RMS (J1, M1, J3, M3) bị một frame thổi phồng 2–3× (M1 stab3 lượt 3:
5,67 gồm glitch so với 3,10 sau nội suy). Một frame nhảy 32px là glitch nhìn
thấy được, nhưng không metric hiện tại nào bắt nó đúng mức. Cần metric
"max/p99 shift từng cặp" (nợ mở §10).

## 7. Phiên denoise mới — MAD và F2 bị nhiễu ngược chiều nhau

Stabilize smoothing 10, denoise 0 / 0,5 / 1,0, mỗi mức ×2, phiên tươi
(đối chứng tái tạo giống hệt R2: MAD 11,8789; F2_V5 13,4624). Lưu ý: detect
(.trf) chạy trên nguồn gốc, không phụ thuộc denoise — khác biệt theo mức
denoise là hiệu ứng đo, không phải hiệu ứng .trf.

| Metric | Đối chứng | d0 mean (spread) | d05 mean (spread) | d10 mean (spread) |
|---|---|---|---|---|
| MAD mean | 11,8789 | 3,3064 (4,4%) | 2,2089 (41,9%) | 2,1729 (85,2%) |
| J2c | 14,1619 | 0,7602 (133,2%) | 1,1931 (37,6%) | 1,2164 (90,8%) |
| F2_V5 | 13,4624 | 1,1026 (3,6%) | 1,5612 (25,4%) | 1,6487 (44,1%) |
| F1_V5 | 9,4973 | 1,6067 (3,0%) | 2,6504 (22,9%) | 2,5956 (17,1%) |
| F4 | 2,9366 | 0,6701 (9,6%) | 0,9841 (5,1%) | 0,9481 (23,8%) |
| F5 | 0,5151 | 0,3842 (17,0%) | 0,4911 (7,1%) | 0,4767 (21,1%) |

- **MAD GIẢM theo denoise** (3,31 → 2,21 → 2,17): denoise hạ sàn nhiễu pixel
  nên MAD hạ theo — MAD lẫn nhiễu với jitter, đúng như R2 đã cảnh báo.
  Spread của MAD cũng nở theo denoise (4,4% → 41,9% → 85,2%).
- **F2_V5 TĂNG theo denoise** (1,10 → 1,56 → 1,65, +42–50% từ d0 lên d05):
  denoise không làm giảm jitter đo bằng flow — ngược lại còn tăng. Giả thuyết
  (chưa kiểm chứng): vệt blend thời gian của hqdn3d tạo flow cục bộ giả, hoặc
  mất texture làm median nhiễu hơn. Dù nguyên nhân nào, **F2 chỉ được so sánh
  ở mức denoise CỐ ĐỊNH** — giống hệt quy tắc đã có cho MAD, nhưng ngược
  chiều. Đọc chung MAD + F2 (một giảm, một tăng theo denoise) thì kết luận
  vững hơn đọc riêng một metric.
- **Ở denoise 0, F2_V5 cực kỳ ổn định**: spread 3,6% (F1_V5 3,0%) so với MAD
  4,4% — cả hai đều tốt khi không có denoise; J2c vẫn tệ (133,2%: hai lần
  d0 cho J1c 0,25 so với 4,56 — chênh 18×).
- F4/F5 cũng tăng theo denoise (F4 0,67 → 0,98) — củng cố giả thuyết ghosting
  hqdn3d tạo flow cục bộ; F4 không phải metric jitter.

## 8. Chi phí tính toán Farneback

Khung 320×180 gray, crop giữa 160×90, 149 cặp/video, OpenCV 5.0 CPU-only:

| Đo | ms/cặp (dưới tải, loadavg 12–18) |
|---|---|
| winsize 15, center | 24,9–49,8 |
| winsize 25, center | 19,0–52,2 |
| winsize 25, full-frame | ~90–123 (pilot) |

Một video 150 frame: cả 2 scale center ≈ 6–15s wall dưới tải (3–7s lúc yên).
Đắt hơn phase correlation (~vài giây/video) nhưng rẻ hơn nhiều so với render
(70–156s/clip 5s dưới tải). Không phải rào cản để đưa vào harness đo; không
đủ rẻ để chạy realtime trong editor (không phải mục đích của metric này).

## 9. Kiểm chứng gộp + khuyến nghị tích hợp

- Harness chính: **27/27 pass, exit 0** (S0 kiểm tra dữ liệu R2, S1 validate
  V5 qua bar, S2 pan, S3 đo 10 render R2, S4 phiên denoise 7 render, S5 tổng
  kết). Đối chứng lặp lại giống hệt (MAD + F2_V5 chênh 0,00%). Đối chứng
  tươi tái tạo giống hệt R2 tới 4 chữ số.
- Không sửa code production; không đụng web → không chạy tsc/vite.
- **Khuyến nghị tích hợp (cho parent quyết):** đưa F1/F2/F3_V5 (+ F2_V2 làm
  cross-check) vào harness metric chuyển động chính thức làm **metric
  đồng-chính với MAD** — báo cáo cả hai; dùng F2 để xếp hạng chất lượng
  stabilize (ổn định hơn MAD ~2× khi chất lượng đồng đều, không lẫn nhiễu
  pixel), dùng MAD làm ground truth pixel. **Không bỏ MAD. Không dùng F2 một
  mình. Không so sánh F2 xuyên mức denoise.** J2c giữ làm tham chiếu lịch sử,
  không dùng để kết luận. F4 chỉ làm chẩn đoán ghosting. F5 bỏ. V0 cấm dùng.
  Luồng này KHÔNG tự sửa harness R2 (`test_round63_r2_motion_metric.js`,
  đã verify 11/11 của luồng khác) — code Farneback nằm gọn trong harness mới
  (`test_round64_r5_farneback_jitter.js`, `farneback.py` nhúng) để parent
  gộp khi duyệt.

## 10. Giới hạn — đọc trước khi trích số

1. **Tải VM là biến số lớn nhất (như mọi đợt).** Loadavg 12–18 trong phiên
   S4 (8–10 luồng đợt 64 chạy song song); render mỗi clip 5s mất 70–156s
   wall (so với ~20–40s lúc yên). Chỉ tỉ lệ/spread trong cùng phép đo mới
   trích được; đừng trích wall tuyệt đối hay ms/cặp tuyệt đối như tốc độ sản
   phẩm (ms/cặp Farneback dao động 19–52ms theo tải).
2. **n nhỏ: 6 lần stabilize R2 + 6 lần tươi, 1 nguồn rung tổng hợp, 1 preset
   (smoothing 10), clip 5s.** Kết luận "F2 ổn định hơn MAD" vững ở 2 lượt
   độc lập + 1 phiên denoise, nhưng estimator V5 được CHỌN trong 8 biến thể
   trên cùng tập validate (chọn lọc trên tập validate — V5 RMSE 1,41 so với
   V2 1,56 chỉ hơn một chút). Cần xác nhận trên footage thật + clip dài hơn
   trước khi tin hoàn toàn.
3. **Nội dung test là tổng hợp, phẳng nhiều.** V0 chết trên nội dung này
   nhưng sống trên texture thật (pan 8px: RMSE 1,14px). Mọi số validate đều
   gắn với nội dung này; footage thật giàu texture có thể cho số khác (có thể
   tốt hơn cho Farneback).
4. **Ngưỡng 1px của V5 là hằng số tùy chọn.** 0,5px cũng qua bar (V7 RMSE
   1,458px). Chưa kiểm tra độ nhạy của F2 theo ngưỡng trên render thật.
5. **F2 có sàn nhiễu chưa tách được.** Trên video stabilize, F2_V5 đọc cao
   hơn ground truth marker ~1,3–2×. Sàn này nén khác biệt giữa các lần
   stabilize tốt — F2 không phân biệt được "tốt" với "rất tốt".
6. **Denoise làm lệch F2 (+42–50% từ d0 lên d05).** Nguyên nhân chưa chứng
   minh (ghosting hqdn3d hay mất texture). Đừng so sánh F2 xuyên mức denoise.
7. **Glitch frame đơn lẻ** (§6) làm méo M1/J1/M3/J3 (thổi phồng 2–3×) và bị
   MAD/F2 giấu nhẹm. Chưa có metric "frame tệ nhất".
8. **Bug log nhỏ (không ảnh hưởng số):** dòng in pan `phaseFull` hiện
   `biasDx/biasDy: undefined` vì JSON của phaseFull không có 2 field đó —
   meanDx/meanDy/RMSE/fracWithin2px vẫn đủ và đúng.
9. **Marker lần đo đầu bị NaN** ở lượt 3 stab3 vì ngưỡng đỏ chặt (R>150,
   G<100, B<100) tìm được 0 pixel ở frame glitch 20 — đã đo lại bằng ngưỡng
   lỏng (R−G>50), validate tốt hơn (RMSE 0,033px so với 0,069px). Số marker
   trích trong tài liệu này là bản lỏng; bản chặt nằm trong log
   `r64r5-marker.log` để đối chiếu.

## 11. Cách chạy lại

```bash
node server/render/src/test_round64_r5_farneback_jitter.js   # ~40-60 phút dưới tải cao; 27 pass
# Dùng lại render R2 nếu scratch còn (.scratch-r63r2m-auyFk4 / -2ulK66),
# thiếu thì tự tái tạo tương đương. Đặt R64R5_RUN3/R64R5_RUN4 để chỉ scratch khác.
```

## 12. Nợ mở thêm (cho đợt sau)

- **Xác nhận F2_V5 trên footage thật + clip dài 15–30s** (nợ đợt 61 §8, nay có
  thêm ứng viên metric): nếu F2 vẫn ổn định hơn MAD trên footage thật thì mới
  chốt đồng-chính; nếu không thì hạ xuống chẩn đoán phụ.
- **Tách nguyên nhân F2 tăng theo denoise**: denoise chỉ không gian (không
  blend thời gian) so với hqdn3d — nếu F2 không tăng nữa thì thủ phạm là
  ghosting thời gian; nếu vẫn tăng thì là mất texture.
- **Metric "frame tệ nhất"**: max/p99 của |Δm| từng cặp + đếm frame nhảy
  hoang — để glitch 1-frame không bị giấu bởi trung bình và không thổi phồng
  std.
- **Điều tra frame nhảy hoang của vidstab** (§6): tần suất, có phát hiện/cắt
  được không (vd clamp transform outlier trong .trf).
- **Độ nhạy F2 theo ngưỡng** (0,5 / 1,0 / 1,5px) trên cùng render thật.
- **Gộp F2_V5 vào harness motion-metric chính thức** (quyết ở §9) + cập nhật
  tài liệu metric jitter (MAD + F2 đồng-chính; J2c tham chiếu lịch sử).
