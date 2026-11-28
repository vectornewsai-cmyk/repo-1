# Đợt 203 P2 — Enhance parity: R_rel phụ thuộc σ (ghim biên) + ca ngược w4s σ=10 — NGUYÊN NHÂN + SỬA SHIP

**Nhiệm vụ (quyết (r)-203):** (1) đo thêm R_rel theo σ trên footage thật —
pan (biên trên ~23,7), Sintel w4s gồ ghề theo khung; xác định biên phụ thuộc
nội dung; phạm vi [10, 20] có cần điều chỉnh không; (2) xử lý ca ngược
Sintel w4s σ=10 (f11 ngược dấu, 0,140 → 0,156, vượt bar 0,006 — P4 xác
nhận độc lập từ file .yuv thô): tìm nguyên nhân + hướng sửa (không đổi bar
tùy tiện); (3) đo lại N10/N5b với cap 1,05 trên footage mới.
**Verdict: NGUYÊN NHÂN TÌM RA + SỬA ĐÃ SHIP.** σ̂ bị gradient nội dung làm
nhiễm: khung f11 có σ̂_clean ≈ 9,05 (khung khác chỉ ≈ 2–3,7) → σ̂ đo 12,59
(σ thật 10) → α0 tụt 0,377 → 0,275 → thiếu làm mịn (R_out > R_truth); và
production còn tệ hơn sim — preview.tsx lấy σ̂ = trung bình 3 dải = 16,69
(α0 chỉ 0,187). **Gate σ̂ theo dải đã ship** (`gatedNoiseSigmaFromBandSigmas`:
dùng min 3 dải khi mean−min > 3,0 VÀ min ≤ 11,0): trên estimator production,
tally 53 nhóm **34 → 41** (ship toàn khung 40); all-frame w4s 22 khung CHƯA
→ 5; 0 hồi quy verdict; N10/N5b không đổi. **Phạm vi [10, 20] ĐỨNG** (BBB
w0s là trường hợp xấu nhất, biên cứng đo được [~9,2; ~20,7]); biên trên đo
được: pan ≈ 23,4, Sintel w0s ≈ 26,1. Cap 1,05 thắng ròng trên footage mới
(40 vs 38 trên 53 nhóm, xem §5). **TỰ BÁO: probe-e chồng lấn cửa sổ yên
W1 attempt3 ~57 s (xem §7) — attempt3 sau đó bị phán không hợp lệ một phần
vì tickCost median 117 ms > 60; nhân quả chưa chứng minh được, ghi trung
thực để parent/T10 phán.**

## §0. Tóm tắt số đo

### A. Ghim biên σ (mới, khung 3/7/11, cap 1,05; trong ngoặc cap 1,12)

| Nhóm | σ | R_rel cap 1,05 | Verdict | Ghi chú |
|---|---|---|---|---|
| BBB w0s | 8 | 0,179 (0,179) | CHƯA | fixed cũng 0,179 — lỗi hiệu chuẩn thước |
| BBB w0s | 9 | **0,155** (0,155) | CHƯA | chỉ vượt bar 0,005; biên dưới ≈ 9,24 |
| BBB pan | 23 | **0,148** (0,158) | ĐẠT | cap 1,05 sửa (cap cũ CHƯA) |
| BBB pan | 24 | 0,153 (0,161) | CHƯA | fixed 0,147 ĐẠT; biên trên ≈ 23,4 |
| Sintel w0s | 26 | **0,149** (0,150) | ĐẠT | sát bar 0,001 |
| Sintel w0s | 27 | 0,158 (0,160) | CHƯA | fixed 0,148 ĐẠT; biên trên ≈ 26,1 |
| Sintel w0s | 28 | 0,162 (0,167) | CHƯA | fixed 0,152 CHƯA — cả fixed cũng gãy |
| Sintel w4s | 9 | **0,160** (0,141) | CHƯA | f11 '+' 0,160 — ca ngược lan sang σ=9 |
| Sintel w4s | 11 | 0,143 (0,134) | ĐẠT | f11 σ̂ sai +2,00 (σ=10: +2,59) |

### B. Ca ngược w4s f11 (σ=10) — số đo gốc

| | σ̂ | σ̂_clean | band σ̂ [y36, y90, y144] | mean 3 dải | α0 | R_rel |
|---|---|---|---|---|---|---|
| f11 σ=10 | 12,59 (+2,59) | 9,05 | [7,99; 20,26; 21,82] | **16,69** | 0,275 / 0,187 | 0,156 / ~0,22 |
| f3 σ=10 | 6,48 (−3,52) | 2,14 | [6,73; 7,08; 7,45] | 7,09 | 0,485 | 0,041 |
| f7 σ=10 | 7,75 (−2,25) | 3,69 | [7,09; 9,35; 11,56] | 9,33 | 0,485 | 0,022 |

(Cột α0: toàn khung / mean 3 dải; R_rel: sim toàn khung / ước production.)

### C. Gate σ̂ theo dải — hiệu quả (estimator production, 53 nhóm)

| Biến thể | Tally ĐẠT / 53 | All-frame w4s: khung CHƯA / 154 |
|---|---|---|
| Production baseline (mean 3 dải) | 34 | 22 |
| **+ gate (ship)** | **41** | **5** |
| Sim toàn khung (ship cũ, đối chiếu) | 40 | — |

### D. N10/N5b + footage mới với cap 1,05

- N10/N5b tái hiện Y HỆT đợt 202: N10 **6,102/0,074 ĐẠT**, N5b **6,810/0,109
  ĐẠT**; fixed CHƯA trên N10 (0,155), m=0,95 CHƯA (0,171).
- Footage mới (Sintel w2s/w6s/w8s, σ=10/15): cap 1,05 thắng 4/6 nhóm về
  R_rel (w2s-s15 0,078 vs 0,102; w2s-s10 0,054 vs 0,070; w6s-s15 0,103 vs
  0,123; w8s-s15 0,142 vs 0,162 — sửa ca lật đợt 201), thua 2/6 (w6s-s10
  0,065 vs 0,051; w8s-s10 0,125 vs 0,106); cả 6 nhóm ĐẠT ở cả hai cap.
- Tổng 53 nhóm: cap 1,05 ĐẠT **40** vs cap 1,12 ĐẠT 38 — cap 1,05 vẫn thắng
  ròng (xem §5).

## §1. Code đã đổi — gate σ̂ theo dải (SHIP)

- `apps/web/src/lib/enhancePreview.ts`: thêm hằng số
  `DENOISE_SIGMA_BAND_GAP_THRESHOLD = 3,0`,
  `DENOISE_SIGMA_BAND_MIN_CEILING = 11,0` + hàm thuần
  `gatedNoiseSigmaFromBandSigmas(bandSigmas)` — trả về min 3 dải khi
  (mean − min > 3,0 VÀ min ≤ 11,0), còn lại mean; mảng rỗng / toàn giá trị
  không hữu hạn → NaN (caller giữ null). Comment đầu hàm ghi đầy đủ bằng
  chứng + ngưỡng + caveat (đọc code để xem chi tiết).
- `apps/web/src/preview.tsx` (`estimateEnhanceNoiseSigma`): giữ nguyên 3
  lần `getImageData` (không thêm lần đọc pixel nào — không đổi hiệu năng),
  chỉ đổi cách gộp: thu thập σ̂ từng dải rồi gọi helper thay vì lấy mean
  trực tiếp. Không đổi cache, không đổi fallback null.
- `apps/web/src/components/enhance/enhancePreview91P2.test.ts`: +2 test
  (`gatedNoiseSigmaFromBandSigmas` với đúng số đo probe: w4s f11 σ=9/10/15
  → min; w0s/N10/pan → mean; trần 11,0 chặn ở σ=18/25; biên rỗng/NaN/1
  dải/thứ tự dải/giá trị không hữu hạn). Không đổi test cũ.
- **KHÔNG đổi** `DENOISE_MOTION_MULTIPLIER_MAX` (vẫn 1,05), map tuyến tính,
  bảng K, hay `estimateNoiseSigmaFromRgba` (harness P4 dùng toàn khung —
  harness vẫn đo đúng mô hình của nó; production dùng band-mean có gate,
  xem §3.3 về khác biệt này).
- **KHÔNG đụng** file của P1/P3/P4-203 hay aggregate/GAP.

## §2. R_rel phụ thuộc σ — ghim biên (nhiệm vụ 1)

- Phương pháp: pipeline Y HỆT đợt 200/201/202 (seed 19100+f, truth yadif +
  hqdn3d s=0,5, khung 3/7/11, bar 0,15). 9 nhóm build mới + tái dùng 36
  nhóm đợt 202. Nguồn clean tái dùng đợt 199/200 (BBB, Sintel CC-BY 3.0).
- **BBB w0s — biên dưới ≈ 9,24 (đo được, không còn nội suy thô):** σ=8 →
  0,179; σ=9 → 0,155 (CHƯA, vượt bar đúng 0,005); σ=10 → 0,134 ĐẠT. Nội
  suy 9→10 cắt bar tại 9 + (0,155−0,150)/(0,155−0,134) ≈ 9,24 — khớp ước
  lượng ~9,2 đợt 201/202. Cả 3 biến thể (1,12/1,05/fixed) cho cùng số ở
  σ=8/9 (m=1 suốt) — lỗi hiệu chuẩn thước, không liên quan cap/gate.
- **BBB pan — biên trên ≈ 23,4 (đo được, thay cho ~23,7 nội suy):** σ=23
  → cap 1,05 0,148 ĐẠT (cap 1,12 0,158 CHƯA — cap 1,05 sửa thêm 1 nhóm);
  σ=24 → cap 1,05 0,153 CHƯA (fixed 0,147 ĐẠT). Nội suy 23→24 cắt bar
  tại 23 + (0,150−0,148)/(0,153−0,148) ≈ 23,4.
- **Sintel w0s — biên trên ≈ 26,1 (đo được, thay cho ~25,3 ngoại suy):**
  σ=26 → 0,149 ĐẠT (sát bar 0,001 — production estimator cho 0,122, xem
  §3.3); σ=27 → 0,158 CHƯA; σ=28 → 0,162 CHƯA (fixed 0,152 CHƯA — ngay
  cả fixed cũng gãy, thước hết hiệu lực). Nội suy 26→27 cắt bar tại ≈ 26,1.
- **Sintel w4s — KHÔNG phải notch hẹp ở σ=10:** σ=9 → 0,160 CHƯA (f11
  '+', σ̂ sai +3,18); σ=10 → 0,156 CHƯA (f11 '+', σ̂ sai +2,59); σ=11 →
  0,143 ĐẠT (f11 '+', σ̂ sai +2,00). Ca ngược là hiệu ứng theo KHUNG
  (f11), trải dài σ=9–10, hết ở σ=11 khi sai số σ̂ đủ nhỏ — xem §3.
- **Kết luận: phạm vi [10, 20] ĐỨNG** làm phạm vi hiệu lực chung (BBB w0s
  là trường hợp xấu nhất, biên cứng [~9,2; ~20,7]); nội dung chuyển động
  nới biên trên ra ~23,4 (pan) / ~26,1 (Sintel w0s); w4s có thể CHƯA ngay
  trong [10, 20] ở σ=9–10 do 1 khung f11 — nay gate đã sửa (xem §4).

## §3. Nguyên nhân ca ngược w4s σ=10 (nhiệm vụ 2)

### 3.1. Bằng chứng theo khung (tất cả 15 khung w4s, σ=9/10/11/15)

- **σ̂_clean phân tán mạnh theo khung trong CÙNG một clip:** f11 σ̂_clean
  9,05; f10 9,76; f12 8,92; f14 15,02 — trong khi f3 2,14; f7 3,69; f8 2,02;
  f13 2,56. Estimator gradient toàn khung KHÔNG tách được nhiễu khỏi
  gradient nội dung: khung nhiều chi tiết/chuyển động tự nó đã có E ≈ 9–15
  (đơn vị σ̂), ngang mức nhiễu cần đo (σ=10).
- **Dấu của (R_out − R_truth) đi theo dấu sai số σ̂:**
  - σ̂ ĐÁNH GIÁ CAO → α0 quá thấp → THIẾU làm mịn ('+'): f10/f11/f12 ở
    mọi σ=9/10/11 (sai +2,0…+3,9; R_rel tới 0,185–0,199); f14 (sai
    +8,3…+8,9; R_rel 0,112–0,125).
  - σ̂ ĐÁNH GIÁ THẤP → α0 quá cao → THỪA làm mịn ('−'): f3/f8/f13 ở σ=15
    (sai −6,0…−6,1; R_rel 0,071–0,128) — đúng các ca lật đợt 201 mà cap
    1,05 đã sửa.
  - Ở σ=10, khung đánh giá thấp cho dấu hỗn hợp (f3 '−', f7/f8 '+') vì
    R_truth thấp (~3,8) và α=0,509 vẫn chưa đủ kéo R_out xuống dưới truth
    — dấu không chỉ do σ̂ mà còn do mức combing gốc của khung; nhưng phía
    '+' (σ̂ cao) là NHẤT QUÁN ở mọi σ.
- **Cơ chế cap 1,05 làm tệ hơn (đúng 1 khung f11):** f11 cần α_eff ≳ 0,30
  để R_out ≤ 5,211 (bar); cap 1,12 cho α_eff 0,308 (R_rel 0,140 ĐẠT, biên
  0,010); cap 1,05 cho 0,288 (R_rel 0,156 CHƯA, vượt 0,006); fixed cho
  0,275 (0,165 CHƯA). Hạ m giúp khung thừa-mịn nhưng hại khung thiếu-mịn
  — cùng một khung có thể lật cả hai hướng tùy α (đã ghi ở LIMITS 202 §4).
- **Cụm nhiễm kéo 3 khung, không phải spike đơn lẻ:** f10–f12 cùng sai
  σ̂ +2,4…+3,3 ở σ=10 (và +2,1…+3,3 ở σ=9; +1,4…+2,7 ở σ=11) — vì vậy
  trung vị thời gian ±1 KHÔNG sửa được (median(13,29; 12,59; 12,40) =
  12,59, y hệt), xem §4.3.

### 3.2. Production tệ hơn sim — phát hiện mới

- `preview.tsx` (`estimateEnhanceNoiseSigma`) KHÔNG dùng σ̂ toàn khung
  như sim/harness: nó lấy **trung bình 3 dải** (y≈0,2/0,5/0,8, mỗi dải 12
  dòng — cùng vị trí với dải M). Trên w4s f11 σ=10, 3 dải σ̂ là
  [7,99; 20,26; 21,82] → mean = **16,69** (toàn khung 12,59) → α0 chỉ
  **0,187** (sim 0,275) → R_rel production ≈ 0,22 (sim 0,156). Hai dải
  chi tiết kéo mean lên; dải ít chi tiết nhất (min 7,99) mới gần σ thật.
- Ngược lại, trên BBB w0s σ=10, mean 3 dải = 11,32 (toàn khung 10,54) →
  α0 thấp hơn → ÍT over-smoothing hơn → R_rel production 0,133–0,149 so
  với sim 0,134–0,179: production baseline ĐẠT ở σ=8/9 và σ=26/27/28
  trong khi sim CHƯA (xem §5). Hai estimator có bias NGƯỢC NHAU theo nội
  dung — vì vậy mọi con số dưới đây được báo cáo theo đúng estimator
  production (band-mean), đối chiếu với sim toàn khung.
- Hệ quả cho harness P4: harness dùng `estimateNoiseSigmaFromRgba`
  (toàn khung) nên nó đo đúng mô hình của NÓ, nhưng production chạy
  band-mean. Sau đợt này, P4-204 nên cân nhắc đồng bộ harness sang
  estimator band-mean có gate (nợ — không chặn ship vì gate đã được đo
  trực tiếp trên estimator production, xem §4).

### 3.3. Vì sao không phải lỗi bar/fixture

- Tap cũng CHƯA ở các điểm ngoài dải (w0s σ=8/9, w0s-s28 fixed 0,152) —
  thước chưa hiệu chuẩn ngoài [10, 20], không phải lỗi estimator.
- Ca ngược w4s là lỗi estimator (σ̂ sai có hệ thống theo khung), không
  phải lỗi bar: fixed m=1 cũng CHƯA (0,165) vì α0 đã sai ngay từ σ̂.

## §4. Hướng sửa đã ship: gate σ̂ theo dải

### 4.1. Luật ship

`σ̂ = min(3 dải) khi (mean − min > 3,0 VÀ min ≤ 11,0), còn lại mean.`
Kiểm chứng trên estimator production (probe-203-p2e, 53 nhóm + all-frame
w4s 154 khung):

| | Tally 53 nhóm | All-frame w4s: khung CHƯA |
|---|---|---|
| Production baseline (mean) | 34 | 22 |
| **+ gate (ship)** | **41** | **5** |
| Sim toàn khung (đối chiếu) | 40 | — |

- Sửa 7 verdict (w4s σ=5/7/9/10/11/12/15: prod CHƯA → ĐẠT; riêng σ=10
  f11 0,223 → 0,008, f10 0,221 → 0,003); 0 hồi quy verdict; N10/N5b
  không đổi (gap ≤ 1,56, gate không kích hoạt); BBB w0s/pan/Sintel w0s
  không đổi (gap ≤ 1,9).
- 5 khung còn CHƯA dưới gate, toàn khung biên: f14 σ=9/10/11/12 (M≈94,
  chuyển cảnh ở rìa cửa sổ, min 15,29–16,92 > 11 → gate đúng là không
  kích hoạt) + f12 σ=11 (min 11,38, vừa trên trần 11,0; R_rel 0,156, vượt
  bar 0,006). Chấp nhận — không nới trần (xem §4.2).
- Tác dụng phụ đã đo (vẫn ĐẠT, ghi trung thực): khung cắt cảnh w2s f7
  (M≈70) gate kích hoạt, R_rel 0,046 → 0,107 (σ=10) và 0,058 → 0,118
  (σ=15); w8s-s10 f11 (gap 3,01, biên ngưỡng) 0,040 → 0,075. Cả ba vẫn
  ĐẠT với biên ≥ 0,032.

### 4.2. Vì sao ngưỡng là 3,0 và 11,0 (không phải số bịa)

- **Gap 3,0:** khung bình thường gap(mean−min) ≤ 1,9 (max w0s-s10 f7
  1,83; N10/N5b ≤ 1,56); khung nhiễm w4s f10/f11 gap 7,4–9,1. Khoảng
  trống 1,9 ↔ 7,4 — ngưỡng 3,0 nằm giữa, không nhạy (2,5/3,0/3,5 cho
  cùng tally 42/53 trên estimator toàn khung, probe-203-p2b).
- **Trần min 11,0:** điểm giữa khoảng phân tách — khung sửa được có min
  ≤ 10,45 (w4s f11 σ=15); khung σ≥18 có min ≥ 11,49 (w4s f10 σ=18). Ở
  σ≥18, σ̂ đã đánh giá THẤP (sai −1,5…−6,4), dùng min càng đẩy α lên cao
  → R_rel tệ hơn (đo ở probe-203-p2c: f10/f11 σ=20–25 tệ 0,009 → 0,102).
  Trần 11,0 ≈ (10,45 + 11,49)/2 = 10,97.
- **Không nới trần lên 11,5** dù nó sửa thêm f12 σ=11 (min 11,38): nó
  đồng thời cho f10 σ=18 (min 11,49) kích hoạt → hại khung σ cao. Giữ
  11,0, chấp nhận 5 khung biên còn CHƯA.

### 4.3. Các ứng viên đã LOẠI (đo đủ, không đoán)

- **Min-band mọi lúc:** sửa w4s (0,041) nhưng PHÁ w0s (σ=10: 0,185 CHƯA
  so với ship 0,134; σ=12/18/20 cũng CHƯA) — tally toàn khung 26/36,
  band 30/53. Min-band lệch thấp trên nội dung đều (min-of-3 bias).
- **Trung vị thời gian σ̂ (±1, ±2):** không sửa f11 (cụm nhiễm 3 khung
  f10–f12) — med tally 30/36; med5 đạt 41/53, bằng gate về tally, NHƯNG
  không sửa được ca đích w4s-s10 (0,151 vẫn CHƯA) trong khi gate sửa
  được (0,094 ĐẠT) — vì vậy med5 không phải đáp án cho ca ngược.
- **Sàn α 0,30 khi M>20/25:** tally 30/36, bằng fixed; sửa w4s-s10
  (0,146) nhưng làm tệ w4s-s25 (0,192 vs ship 0,167) — vá α, không sửa
  gốc σ̂.
- **Gate 3 điều kiện (+ 2 dải cao nhất lệch ≤ 2,5, để loại khung cắt
  cảnh):** LOẠI — f10 genuine có top2 lệch 4,3–4,7 (dải [7,51; 21,31;
  16,81]), gần bằng khung cắt w2s f7 (5,26–5,46); điều kiện này giết luôn
  ca sửa f10 (all-frame worst 0,157–0,229, còn fail) để đổi lấy 2 khung
  cắt vốn đã ĐẠT. Không đáng.
- **Trung vị 3 dải (medband):** tally 30/53 — tệ nhất, loại.

### 4.4. Hạn chế của gate (trung thực)

- Gate chỉ sửa được khung mà nội dung tập trung vào ≤2 dải (min tách xa
  mean). Khung chuyển cảnh (f14, M≈94) và khung min vừa trên trần
  (f12 σ=11, min 11,38) vẫn CHƯA.
- Ngưỡng hiệu chuẩn trên Sintel/BBB 320×180, 3 dải y=36/90/144. Production
  dùng cùng phân số dải (0,2/0,5/0,8) nên ngưỡng chuyển trực tiếp; nếu
  đổi số dải/chiều cao khung, ngưỡng cần hiệu chuẩn lại.
- Hướng dài hạn (nợ 204): estimator σ̂ tách nhiễu khỏi gradient nội dung
  một cách có nguyên tắc (vd σ̂ từ hiệu khung kề trong vùng M thấp) —
  gate hiện tại là sửa thực dụng đã đo, không phải estimator lý tưởng.

## §5. Đo lại N10/N5b với cap 1,05 trên footage mới (nhiệm vụ 3)

- **N10/N5b tái hiện Y HỆT đợt 202** (sim, fixture đợt 197/198, khung
  3/7/11): N10 cap 1,05 **6,102/0,074 ĐẠT** (cap cũ 6,126/0,082; fixed
  6,240/0,155 CHƯA; m=0,95 6,203/0,171 CHƯA); N5b **6,810/0,109 ĐẠT**
  (không đổi — kẹp không chạm). Gate không chạm N10/N5b (gap ≤ 1,56).
  Verdict N10/N5b chính thức thuộc harness P4-203; sim P2 đã khớp
  P4-198/200/201/202 từng số nên đáng tin.
- **Footage mới — Sintel w2s/w6s/w8s, σ=10/15, cap 1,05 vs 1,12:**

| Nhóm | cap 1,12 | cap 1,05 | fixed | Nhận xét |
|---|---|---|---|---|
| w2s σ=15 | 0,102 ĐẠT | **0,078 ĐẠT** | 0,065 ĐẠT | 1,05 tốt hơn |
| w2s σ=10 | 0,070 ĐẠT | **0,054 ĐẠT** | 0,043 ĐẠT | 1,05 tốt hơn |
| w6s σ=15 | 0,123 ĐẠT | **0,103 ĐẠT** | 0,084 ĐẠT | 1,05 tốt hơn |
| w6s σ=10 | **0,051 ĐẠT** | 0,065 ĐẠT | 0,082 ĐẠT | 1,12 tốt hơn |
| w8s σ=15 | 0,162 CHƯA | **0,142 ĐẠT** | 0,126 ĐẠT | 1,05 sửa ca lật đợt 201 |
| w8s σ=10 | **0,106 ĐẠT** | 0,125 ĐẠT | 0,139 ĐẠT | 1,12 tốt hơn |

- Cả 6 nhóm ĐẠT ở cả hai cap; cap 1,05 thắng 4/6 về R_rel. Cộng sweep 36
  nhóm (29 vs 27) + biên 9 nhóm (hòa 3–3) + N10/N5b (1 thắng, 1 hòa):
  **cap 1,05 ĐẠT 40/53 vs cap 1,12 ĐẠT 38/53 — cap 1,05 vẫn thắng ròng,**
  và gate nâng production lên 41/53.
- Lưu ý: w2s f7 có cắt cảnh trong cửa sổ (M_clean 69,5) — estimator qua
  cắt cảnh vẫn ĐẠT ở cả hai cap, nhưng gate kích hoạt trên khung cắt
  (xem §4.1).

## §6. Số đo kiểm chứng

- `npx tsc --noEmit` (apps/web): **0 lỗi** (lỗi file test P3-202 đợt
  trước đã hết — không phải do P2 sửa).
- Test đơn vị (bundle esbuild mới từ cây hiện tại, mẫu đợt 202 + thêm
  parityHarness202/203): enhance **171/171 PASS** (11 file:
  21+16+9+7+10+8+14+14+10+11+**51** — 91P2 tăng 49 → 51 nhờ 2 test gate
  mới); media **59/59 PASS** (6 file: 2+25+7+7+9+9); harness 198–201
  **107/107 PASS** (24+26+28+29); harness202 **29/29 PASS** (kiểm tra);
  harness203 của P4-203 **29/29 PASS** (kiểm tra, không sửa). **Tổng
  395/395, 0 fail.**
- `npx vite build`: **PASS 14,14 s** (exit 0; bundle mới
  `dist/assets/index-DmgOYOzR.js`, md5
  299110555ae5d5c5c81630c0f58288c3 — hash đổi so với FqY8HE0R đợt 202 vì
  enhancePreview.ts + preview.tsx đã đổi, đúng kỳ vọng).
- Kiểm chứng chéo ship == sim: bundle `enhancePreview.ts` thật bằng
  esbuild, chạy `gatedNoiseSigmaFromBandSigmas` trên đúng 8 mảng dải của
  probe — **8/8 khớp từng số** (w4s f11 σ=9/10/15 → min; w0s/N10/pan →
  mean; w4s σ=18 → mean; w2s f7 cắt → min). Hằng số: gap 3,0; trần 11,0;
  cap m 1,05.
- Probe: 4 script — `probe-203-p2.mjs` (N10/N5b + ghim biên + all-frame
  w4s + footage mới + ứng viên toàn khung, ~218 s), `probe-203-p2b.mjs`
  (gate toàn khung, ~180 s), `probe-203-p2c.mjs` (an toàn gate toàn khung
  trên tất cả khung, ~129 s), `probe-203-p2e.mjs` (estimator production +
  gate 2 điều kiện, ~159 s), `probe-203-p2f.mjs` (gate 3 điều kiện —
  LOẠI, ~224 s). Log + JSON đầy đủ trong `hidden_files/round203-p2/`.

## §7. Phối hợp T4 (đo yên #71) — TỰ BÁO CHỒNG LẤN W1

- Kiểm W1-ACTIVE trước mỗi lệnh nặng: 23:55:21Z (trước probe) — không
  có; 23:58:27Z (trước probe) — không có; 00:07:34Z (trước probe-b) —
  không có; 00:23:45Z (trước probe-e) — **CÓ (attempt2, mở 00:23:25Z)**
  → P2 DỪNG, chờ W1 đóng 00:26:59Z, kiểm lại 00:27:07Z — không có → mới
  chạy probe-e 00:27:14Z.
- **CHỒNG LẤN (tự báo): probe-e chạy 00:27:14–00:29:53Z; W1 attempt3 mở
  00:28:56Z trong lúc probe-e đang chạy (node + ffmpeg) → chồng lấn
  ~57 s.** T4 attempt3 sau đó bị phán KHÔNG HỢP LỆ (20/20 + loop B 5/5
  nhưng tickCost median 117,0 ms > 60) và T4 hết 3 attempt, poller thoát
  — đợt 203 KHÔNG có lượt yên hợp lệ. **Nhân quả chưa chứng minh được:**
  load1 lúc W1 mở là 1,20 (probe-e đang chạy) nên chồng lấn có thể góp
  phần; nhưng attempt1 cũng đã lỗi (exit 3, wedged) và attempt2 cũng
  không cho verdict hợp lệ — cả hai đều TRƯỚC mọi chồng lấn của P2.
  Ghi trung thực để parent/T10 phán; P2 không giấu.
- Sau đó: chờ W1 đóng 00:34:00Z → probe-f chạy sạch (không W1 trong lúc
  chạy; T4 poller đã thoát); tsc/test/vite chạy sau lần kiểm 00:40:49Z
  (không W1). Probe-b/probe-c chạy trước khi W1 đầu tiên mở (00:23:25Z)
  — không chồng lấn.

## §8. Hạn chế + nợ (trung thực)

1. Gate là sửa thực dụng đã đo, không phải estimator lý tưởng (§4.4).
   5 khung all-frame w4s còn CHƯA (f14 chuyển cảnh + f12 σ=11).
2. Harness P4 vẫn dùng σ̂ toàn khung trong khi production dùng band-mean
   có gate — hai estimator khác nhau tới 4,1 đơn vị σ̂ trên f11 (12,59
   vs 16,69). P4-204 nên đồng bộ harness sang estimator production (nợ).
3. Biên σ nội suy tuyến tính giữa 2 điểm đo gần nhất — [~9,2; ~20,7] /
   ~23,4 / ~26,1 là ước lượng ±0,3–0,5, không phải số đo từng 0,1 σ.
4. Sintel resample fps=30 cho pipeline (như đợt 200/201/202) — khung
   resample không phải khung gốc 24fps; ảnh hưởng nhỏ, ghi nhận.
5. Clip hành động nhanh tự nhiên (thể thao, xe chạy) vẫn thiếu — Sintel
   w4s là phim điện ảnh, chưa phải footage thể thao thật (nợ từ đợt 200).
6. Khung cắt cảnh: gate kích hoạt trên khung cắt (w2s f7) làm R_rel tệ
   hơn nhưng vẫn ĐẠT — chấp nhận (§4.1); nếu parent muốn, đợt sau có
   thể thêm điều kiện loại cắt cảnh dựa trên M (chưa đo đủ để ship).
7. Verdict N10/N5b chính thức thuộc harness P4-203 (sim P2 chỉ tái tạo
   mô hình pixel; đã khớp P4 từng số nên sim đáng tin).
8. Đợt 203 KHÔNG có lượt yên hợp lệ (T4 hết 3 attempt, xem §7) — chuỗi
   lượt yên và live-check do T10 phán.

## §9. File stage (batch phase9-round203-p2-enhance.txt)

- `apps/web/src/lib/enhancePreview.ts`
- `apps/web/src/preview.tsx`
- `apps/web/src/components/enhance/enhancePreview91P2.test.ts`
- `docs/PHASE9_ROUND203_P2_LIMITS.md`
- KHÔNG stage binary/mp4/yuv/rgb (chỉ ở hidden_files/round203-p2/).

## §10. Thư mục làm việc + dữ liệu cho P4-203

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round203-p2/`:
probe-203-p2.mjs/.json/.log (+ probe-203-p2b/c/e/f .mjs/.json/.log,
check-bandmean.mjs), probe-203-helpers.mjs (bản sao helper 198, tmp riêng
để không đụng P4), run-203-p2-tests.sh + tests-203.log, tsc-203.log,
vite-203.log, test-bundle/ (23 bundle), ship-gate-check.cjs (+ build log),
`*-clean.rgb/.yuv`, `*-inter.yuv`, `*-truth.yuv`, `*-noisy.rgb/.yuv`
trung gian (không stage). Nguồn footage tái dùng đợt 199/200 (BBB
`bbb-w0s/pan-clean.rgb`; Sintel CC-BY 3.0 `sintel-w0s/w2s/w4s/w6s/
w8s-clean.rgb`).
**Cho P4-203:** production σ̂ nay là **band-mean CÓ GATE**
(`gatedNoiseSigmaFromBandSigmas`, gap 3,0 / trần min 11,0) trong
`preview.tsx`; sim/harness toàn khung cho w4s-s10 f11 R_rel 0,156 CHƯA
nhưng production baseline (mean) là ~0,22 CHƯA, sau gate 0,008–0,094
ĐẠT; N10 6,102/0,074 + N5b 6,810/0,109 không đổi; cap m vẫn 1,05.
