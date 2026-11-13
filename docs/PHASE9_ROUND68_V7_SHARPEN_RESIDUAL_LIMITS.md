# PHASE 9 ĐỢT 68 — LUỒNG V7: SHARPEN FLOOR CÒN LẠI — OCEAN SHARP10 + BASGO SHARP10 W1440

**Ngày:** 09/11/2026 · **Nợ đóng:** đợt 67 U3 §9 mục 2
(`docs/PHASE9_ROUND67_U3_SHARPEN_DECODE_FLOOR_LIMITS.md`): metric trừ sàn
`le8_net_nb` under-correct trên texture cao tần — ocean sharp10 còn
1,09–4,89%, basgo sharp10 w1440/1:1 còn 2,29%/1,40% — dù effect đã chứng
minh chính xác tuyệt đối trong decoder của preview ((A') MAD = 0,000).
**Kết quả tóm tắt: phần dư còn lại là SÀN CHUỖI ĐO, không phải lỗi effect —
không sửa code production, giữ HYB4.** Bốn nguồn chứng cứ hội tụ:

1. **Per-cell (headed):** phần dư của ocean nằm 100% ở ô sàn bẩn
   (floorMad > 1,5), 0 pixel ở ô sạch — ở cả 8 ô cảnh×cỡ×mức; basgo w1440
   cũng 0 pixel ở ô sạch. Sàn plain cực kỳ không đều: ô tệ nhất của ocean
   MAD tới 10,70 (trung bình toàn khung chỉ 1,28–2,45).
2. **Full-res M-hp (metric cao tần mới, ĐÃ CHẤP NHẬN):** HYB4 cho
   0,00–0,17% trên cả 8 ô cảnh×mức (ngưỡng KHỚP ≤ 1%); đối chứng âm
   amount×1,5 / blur 3-tap bị bắt rõ (1,15–15,81% trên testsrc2+ocean);
   S7 tệ hơn HYB4 ở mọi nơi nó khác HYB4. slovenska/basgo: 0 pixel lỗi
   delta > 8 ở full-res.
3. **Chẩn đoán direct:** phần dư full-res còn lại (testsrc2 934–1586 px,
   ocean 239–432 px) nằm 90–99% ở pixel nhánh direct (mask shot) — nơi lỗi
   đến từ đường chroma/R0_est, không phải sàn luma mà mọi metric trừ sàn
   luma mô hình hoá được. Đây là giới hạn của metric, không phải lỗi effect.
4. **Đối chứng scaler (Node thuần):** chỉ đổi scaler downscale (cùng một
   cặp frame, không đổi decode/effect) đã tạo ra le8_net_nb 1,33–1,59% ở
   1:1 sharp10 — đúng bằng phần dư headed của basgo 1:1 (1,40%); cùng
   scaler thì residual = 0,00% ở mọi ô. Phần dư 1:1 là sai khác scaler
   (Chrome drawImage ≠ ffmpeg bilinear), không phải effect.

Tiêu chí (giữ nguyên từ U3): KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8 (le8);
XẤP XỈ = MAD ≤ 20 và ≥ 90% pixel lệch ≤ 32. KHỚP-trừ-sàn = le8_net_nb ≤ 1%.
KHỚP-trừ-sàn-cao-tần = le8_net_hp ≤ 1% (full-res). Mọi số dưới đây đều đo
thật; probe/log/JSON tại `hidden_files/round68-v7/` (percell/,
fullres/, scaler/, r68v7-*.mjs, *.log).

---

## 1. Phương pháp và quy tắc chấp nhận (đăng ký trước khi chạy)

### 1.1 Vì sao metric cũ under-correct

`le8_net_nb` (U3) điều kiện trên ĐỘ LỚN của sàn: pixel được tính là "sàn
giải thích được" nếu max |D| trên lân cận 3×3 mẫu ≤ 8. Nhưng delta sharpen
đáp ứng với THÀNH PHẦN CAO TẦN của sàn: delta error ≈ amount × (D_Y −
blur(D_Y)). D dao động ±8 thì blur(D)≈0, delta error ≈ amount×8 ≈ 16 > 8
dù sàn lân cận ≤ 8. Trên texture cao tần (sóng biển) metric này bỏ sót
một cách có hệ thống — phần dư 1–5% không phân biệt được "effect sai" với
"sàn cao tần".

### 1.2 Ba ứng viên metric mới — và quy tắc chấp nhận

- **M-hp lưới:** pred_hp = amount × |D_Y − mean(3×3 mẫu lưới)|,
  le8_net_hp = tỉ lệ pixel err>8 VÀ pred_hp ≤ 8 (D_Y = sàn luma tại mẫu lưới).
- **M-range lưới:** pred_range = amount × (max−min D_Y trên 3×3 mẫu lưới).
- **M-hp full-res:** pred_hp = amount × |D_Y − blur5(D_Y)|, blur đúng kernel
  sharpen [1,4,6,4,1]/16, trên dữ liệu full-res within-decoder-exact.
- **M-est full-res:** pred_est = amount × |(lumEst_p − blur5(lumEst_p)) −
  (Y_f − blur5(Y_f))| — thêm số hạng sai số estimator E_p (Y_f = mặt phẳng
  Y gốc của preencode, mà unsharp của render nhìn thấy).
- **Per-cell:** chia vùng video thành ô 16×16 mẫu lưới (≈64×64px canvas),
  đo floor MAD + số pixel dư từng ô.

**Quy tắc chấp nhận (đăng ký trước, xem `hidden_files/round68-v7.md`):**
một metric mới chỉ được chấp nhận nếu (a) HYB4 cho ≤ 1% trên MỌI ô đã biết
KHỚP-trừ-sàn, (b) KHÔNG làm S7 (biến thể đã biết tệ hơn trên testsrc2)
trông tốt bằng HYB4, và (c) trên full-res, đối chứng âm amount×1,5 /
blur 3-tap phải bị bắt (> 1%). Nếu không đạt: BÁC metric, verdict dựa vào
(A')=0 của U3 + per-cell; KHÔNG được "làm đẹp số".

### 1.3 Dữ liệu dùng lại (không chạy headed mới)

Snaps headed 12 lượt U3 (3 cảnh × 4 cỡ) + snaps testsrc2 HYB4/S7 (đợt
65/66) + screenshots full-res within-decoder-exact 4 cảnh + preencode YUV.
Không chạy headed mới trong luồng này (VM tải cao, nhiều luồng song song;
và mọi câu hỏi đều trả lời được bằng phân tích lại dữ liệu đã có).

---

## 2. Probe 1 — Per-cell trên headed + metric lưới (17 combo)

### 2.1 Bảng tổng hợp HYB4 (bilinear; le8_net_nb tái lập đúng số U3 ±0,01pp)

| Cảnh × cỡ | Mức | floor MAD | le8_net_nb (cũ) | le8_net_hp lưới | le8_net_range lưới | Dư ở ô sạch / tổng dư | Ô tệ nhất (floorMad) |
|---|---|---|---|---|---|---|---|
| slovenska w1440 | 05 | 0,729 | 0,00% | 0,00% | 0,00% | 0 / 0 | 1,80 |
| slovenska w1440 | 10 | 0,729 | 0,12% | 0,05% | 0,00% | 2 / 10 | 1,80 |
| slovenska w1920 | 05 | 0,475 | 0,00% | 0,00% | 0,00% | 1 / 1 | 1,47 |
| slovenska w1920 | 10 | 0,475 | 0,06% | 0,04% | 0,01% | 9 / 14 | 1,47 |
| slovenska w2560 | 05 | 0,354 | 0,00% | 0,00% | 0,00% | 2 / 2 | 1,94 |
| slovenska w2560 | 10 | 0,354 | 0,02% | 0,02% | 0,02% | 25 / 25 | 1,94 |
| slovenska 1:1 | 05 | 0,414 | 0,00% | 0,00% | 0,00% | 1 / 2 | 1,61 |
| slovenska 1:1 | 10 | 0,414 | 0,04% | 0,03% | 0,02% | 8 / 22 | 1,61 |
| basgo w1440 | 05 | 1,466 | 0,62% | 0,59% | 0,20% | 0 / 52 | 2,99 |
| basgo w1440 | **10** | 1,466 | **2,29%** | 1,48% | **0,13%** | **0 / 193** | 2,99 |
| basgo w1920 | 05 | 1,331 | 0,07% | 0,16% | 0,03% | 1 / 15 | 3,60 |
| basgo w1920 | 10 | 1,331 | 0,56% | 0,44% | 0,02% | 3 / 129 | 3,60 |
| basgo w2560 | 05 | 0,720 | 0,15% | 0,17% | 0,13% | 71 / 159 | 2,44 |
| basgo w2560 | 10 | 0,720 | 0,63% | 0,61% | 0,31% | 276 / 670 | 2,44 |
| basgo 1:1 | 05 | 0,819 | 0,38% | 0,45% | 0,25% | 50 / 221 | 3,19 |
| basgo 1:1 | **10** | 0,819 | **1,40%** | 1,16% | **0,45%** | **137 / 811** | 3,19 |
| ocean w1440 | 05 | 2,364 | 0,44% | 4,10% | 0,13% | 0 / 37 | 10,30 |
| ocean w1440 | **10** | 2,364 | **2,15%** | 6,08% | **0,05%** | **0 / 181** | 10,30 |
| ocean w1920 | 05 | 2,448 | 0,20% | 2,09% | 0,07% | 0 / 45 | 10,10 |
| ocean w1920 | **10** | 2,448 | **1,09%** | 3,87% | **0,08%** | **0 / 252** | 10,10 |
| ocean w2560 | 05 | 1,281 | 1,88% | 2,59% | 2,23% | 0 / 1983 | 6,00 |
| ocean w2560 | **10** | 1,281 | **4,89%** | 5,90% | 2,92% | **0 / 5166** | 6,00 |
| ocean 1:1 | 05 | 1,749 | 1,64% | 4,28% | 1,27% | 0 / 947 | 10,70 |
| ocean 1:1 | **10** | 1,749 | **4,75%** | 7,07% | 1,25% | **0 / 2747** | 10,70 |
| testsrc2 w1440 | 05 | 1,228 | 0,01% | 1,21% | 0,25% | 0 / 1 | 7,16 |
| testsrc2 w1440 | 10 | 1,228 | 0,11% | 1,21% | 0,12% | 0 / 9 | 7,16 |
| testsrc2 w1920 | 05 | 1,041 | 0,02% | 0,71% | 0,09% | 0 / 4 | 11,45 |
| testsrc2 w1920 | 10 | 1,041 | 0,09% | 0,71% | 0,13% | 1 / 21 | 11,45 |
| testsrc2 w2560 | 05 | 1,052 | 0,46% | 2,13% | 1,55% | 1 / 484 | 11,29 |
| testsrc2 w2560 | 10 | 1,052 | 0,33% | 2,13% | 0,92% | 1 / 349 | 11,29 |
| testsrc2 1:1 | 05 | 1,165 | 0,07% | 1,38% | 0,90% | 10 / 38 | 12,50 |
| testsrc2 1:1 | 10 | 1,165 | 0,12% | 2,21% | 0,73% | 11 / 71 | 12,50 |

("Ô sạch" = tile floorMad ≤ 1,0. In đậm = 6 ô còn XẤP XỈ-trừ-sàn theo
metric cũ — đúng 2 trường hợp trong nhiệm vụ, cộng ocean sharp05 w2560/1:1.)

**Đọc bảng:**
- **Ocean: 0 pixel dư ở ô sạch trong cả 8 ô** — 100% phần dư nằm ở ô có
  floorMad > 1,5 (vd w1to1 sharp10: 2747/2747 ở ô bẩn). Sàn plain của
  ocean cực kỳ không đều theo không gian: ô sóng MAD tới 10,70 trong khi
  ô nước lặng chỉ ~1,0. Đây là bằng chứng độc lập với mọi metric trừ sàn:
  phần dư sống đúng nơi sàn tệ nhất.
- **Basgo w1440 sharp10: 0 / 193 ở ô sạch** — cùng kết luận. Basgo
  w1920/w2560/1:1 còn 3–276 pixel dư ở ô sạch (vd 1:1 sharp10: 137/811 =
  17%) — xem §5: nhóm này được giải thích bằng đối chứng scaler (§4),
  không phải bằng sàn theo ô.
- **M-hp lưới: BÁC.** Tệ hơn metric cũ ở hầu hết các ô, kể cả ô đã biết
  KHỚP (testsrc2 w1440 sharp05: 1,21% vs 0,01%; ocean w1440 sharp10:
  6,08% vs 2,15%) — vi phạm quy tắc (a). Nguyên nhân: lưới step 4
  (≈3–10px full-res tùy cỡ) alias trường sàn ở thang blur 5px, và mô hình
  luma-thuần bỏ sót sai số estimator + nhánh direct + clip (xem §3.3).
  Số này chỉ còn giá trị chẩn đoán (cho thấy mô hình luma-thuần là chưa đủ).
- **M-range lưới: CHỈ THAM KHẢO.** Xoá được phần dư ocean/basgo
  (0,02–0,45% ở 6 ô residual, trừ ocean w2560 sharp10 2,92% và ocean
  sharp05 w2560/1:1 2,23%/1,27%) nhưng VI PHẠM quy tắc (a)+(b) trên
  testsrc2: w2560 sharp05 HYB4 1,55% (> 1% trong khi metric cũ KHỚP
  0,46%) và đảo thứ hạng vs S7 ở đó (xem §2.2). Không phải metric chung.

### 2.2 Đối chứng S7 vs HYB4 trên testsrc2 (M-range lưới, sharp10)

| Cỡ | HYB4 | S7 | Nhận xét |
|---|---|---|---|
| w1440 | 0,12% | 0,65% | S7 tệ hơn 5× |
| w1920 | 0,13% | 0,66% | S7 tệ hơn 5× |
| w2560 | 0,92% | 1,39% | S7 tệ hơn; HYB4 vẫn ≤ 1% |
| sharp05 w2560 | **1,55%** | 1,15% | **đảo thứ hạng — M-range lưới vi phạm quy tắc (b)** |

Ở sharp10 M-range vẫn xếp S7 tệ hơn HYB4 (đúng), nhưng ở sharp05 w2560
nó đảo ngược — vì phần dư testsrc2 nằm ở biên bão hoà nhánh direct, nơi
mô hình luma-range không mô tả được cơ chế lỗi (xem §3.3). M-range chỉ
đáng tin trên cảnh add-dominated (ocean/basgo, direct ≈ 0–18%).

---

## 3. Probe 2 — Full-res M-hp / M-est + đối chứng âm (4 cảnh × 2 mức)

Dữ liệu: screenshots full-res 1280×720 within-decoder-exact (scale đúng
1,0) + frame render pre-encode; delta cross-decoder |Δp−Δr| (Δp từ shots,
Δr từ render). Đối chứng dương: production `applySharpen` import thật
(vs shot MAD = 0,000 — tái khẳng định (A') của U3).

### 3.1 HYB4 production: metric cao tần full-res

| Cảnh | Mức | delta MAD | nErr8 (>8) | le8_net_hp | le8_net_range5 | le8_net_nb5 | le8_net_est | Verdict |
|---|---|---|---|---|---|---|---|---|
| testsrc2 | 05 | 0,486 | 934 | **0,10%** | 0,10% | 0,08% | 0,10% | KHỚP-cao-tần |
| testsrc2 | 10 | 0,507 | 1586 | **0,17%** | 0,17% | 0,13% | 0,17% | KHỚP-cao-tần |
| slovenska | 05 | 0,340 | 0 | **0,00%** | 0,00% | 0,00% | 0,00% | KHỚP-cao-tần |
| slovenska | 10 | 0,526 | 0 | **0,00%** | 0,00% | 0,00% | 0,00% | KHỚP-cao-tần |
| basgo | 05 | 0,539 | 0 | **0,00%** | 0,00% | 0,00% | 0,00% | KHỚP-cao-tần |
| basgo | 10 | 0,620 | 0 | **0,00%** | 0,00% | 0,00% | 0,00% | KHỚP-cao-tần |
| ocean | 05 | 0,421 | 239 | **0,03%** | 0,03% | 0,03% | 0,03% | KHỚP-cao-tần |
| ocean | 10 | 0,557 | 432 | **0,05%** | 0,05% | 0,05% | 0,05% | KHỚP-cao-tần |

(delta MAD = MAD của |Δp−Δr|; nErr8 = số pixel delta error > 8. Số tuyệt
đối cross (prod vs render sharp, MAD/le8): testsrc2 0,547/99,64% và
0,545/99,50%; slovenska 1,058/100% và 1,001/100%; basgo 1,377/100% và
1,110/100%; ocean 2,420/99,76% và 2,160/99,65% — khớp (C) của U3 §5.2.
Delta MAD đo lại bằng staged script `parity-68v7-compare.mjs` chế độ
fullres; các cột verdict lấy từ JSON probe 2 và đã kiểm chứng lại bằng
staged script trên cả 4 cảnh.)

**Đọc bảng:**
- **HYB4 ≤ 0,17% trên cả 8 ô** — đạt quy tắc (a) với biên rộng (ngưỡng 1%).
  slovenska/basgo: **0 pixel** có delta error > 8 ở full-res — tức ở scale
  1,0 không resample, delta cross-decoder của hai cảnh này là chính xác
  gần như tuyệt đối.
- **Cả 4 predictor trùng nhau** (hp = range5 = nb5 = est, tới 0,01pp) trên
  mọi ô full-res. Giải thích: tập dư là các pixel nhánh direct mà sàn luma
  nhỏ theo MỌI nghĩa (xem §3.3) — predictor nào cũng "không giải thích
  được" cùng một tập pixel. M-est không bổ sung khả năng phân biệt so với
  M-hp trên dữ liệu này; giữ lại M-est để đối chứng, không claim nó mạnh hơn.
- **explEst ≈ 0** (chỉ 0,4–3% số pixel err>8 được pred_est giải thích):
  số hạng sai số estimator KHÔNG phải thứ lái phần dư full-res — phần dư
  nằm ở nhánh direct (§3.3), không phải ở cao tần luma hay cao tần estimator.

### 3.2 Đối chứng âm — metric có bắt được effect sai thật không? (le8_net_hp, %)

| Cảnh | Mức | HYB4-prod | SIMP-hyb4† | N1 amount×1,5 | N2 blur 3-tap | N3 S7 |
|---|---|---|---|---|---|---|
| testsrc2 | 05 | 0,10% | 0,46% | **1,36%** | **1,15%** | 1,22% |
| testsrc2 | 10 | 0,17% | 1,02% | **2,88%** | **3,52%** | 1,85% |
| slovenska | 05 | 0,00% | 0,00% | 0,02% | 0,06% | 0,00% |
| slovenska | 10 | 0,00% | 0,00% | 0,16% | 0,61% | 0,00% |
| basgo | 05 | 0,00% | 0,02% | 0,69% | **2,60%** | 0,02% |
| basgo | 10 | 0,00% | 0,31% | **3,92%** | **9,02%** | 0,31% |
| ocean | 05 | 0,03% | 0,38% | **4,47%** | **6,56%** | 0,36% |
| ocean | 10 | 0,05% | 3,03% | **12,24%** | **15,81%** | 3,00% |

(† SIMP-hyb4 = cùng code đơn giản hoá (không kẹp ΔY như production),
đúng amount+kernel — baseline đúng cho N1/N2, vì N1/N2 cũng dùng code đơn
giản hoá này. In đậm = bị bắt (> 1%).)

**Đọc bảng — quy tắc (b)+(c) đạt:**
- (c) N1/N2 bị bắt trên testsrc2+ocean ở cả 2 mức (1,15–15,81%), cao hơn
  HYB4 từ 7× tới 300×, và cao hơn cả baseline SIMP-hyb4 (vd ocean
  sharp10: N1 12,24% vs SIMP 3,03%). Trên slovenska N1/N2 KHÔNG bị bắt
  (0,02–0,61%) — đúng như kỳ vọng: delta ở đó quá nhỏ nên sai amount
  1,5× vẫn dưới ngưỡng thấy được (ngay cả MAD thô của N1 cũng KHỚP
  99,97%). Metric không thể — và không nên — bắt lỗi không thấy được.
  Quy tắc (c) đăng ký cho "cảnh có tín hiệu delta đo được" (testsrc2+ocean).
- (b) S7 tệ hơn HYB4 ở mọi nơi nó khác HYB4: testsrc2 1,22/1,85% vs
  0,10/0,17% (7–11×); ocean 0,36/3,00% vs 0,03/0,05% (12–60×).
  Trên slovenska/basgo S7 ≡ HYB4 (0,00–0,31%) vì direct ≈ 0% — hai biến
  thể trùng nhau về mặt toán học ở đó (U3 §6 đã thấy).
- **SIMP-hyb4 tự nó đã bị bắt ở ocean sharp10 (3,03%)** — tức metric đủ
  nhạy để bắt cả lỗi nhỏ như bỏ kẹp ΔY. Điều này vừa củng cố độ nhạy của
  metric, vừa buộc so sánh N1/N2 với SIMP (baseline đúng) thay vì với
  production — đã làm ở trên, kết luận không đổi.

**Kết luận phương pháp: M-hp full-res ĐƯỢC CHẤP NHẬN** làm metric trừ sàn
cho phép đo full-res (scale 1,0). M-hp lưới BÁC; M-range lưới chỉ tham khảo.

### 3.3 Phần dư full-res còn lại nằm ở đâu? — chẩn đoán nhánh direct

| Cảnh | Mức | nErr8 | direct frac (shot/render) | err>8 là direct: shot / render / either |
|---|---|---|---|---|
| testsrc2 | 05 | 934 | 96,8% / 97,2% | 82,1% / 89,9% / 90,1% |
| testsrc2 | 10 | 1586 | 96,8% / 97,2% | 88,3% / 93,4% / 93,6% |
| slovenska | 05/10 | 0 | 0,0% / 0,0% | — (không có pixel dư) |
| basgo | 05/10 | 0 | 0,0% / 0,0% | — (không có pixel dư) |
| ocean | 05 | 239 | 19,2% / 18,8% | **99,2%** / 59,4% / **99,2%** |
| ocean | 10 | 432 | 19,2% / 18,8% | **97,5%** / 74,3% / **97,7%** |

- Ocean: 97–99% pixel dư là direct theo mask tính từ shot (Chrome).
  Mask tính từ render chỉ bắt 59–74% — đúng hiện tượng U3 §3: hai decode
  gán nhánh khác nhau tại đúng pixel biên (mask sai ngay nơi cần đo), nên
  "either" (99%) mới là con số có ý nghĩa, "both" không dùng.
- Testsrc2: 90–94% pixel dư là direct (either). Direct frac 96,8%
  (pixel có ≥1 kênh direct) — khớp U3 §3 (95% pixel, 53,6% kênh).
- **Cơ chế:** ở pixel direct, preview xuất `clip(R0_est + ΔY)` với R0_est
  ước lượng từ chroma decode Chrome; render cộng delta vào Y thật rồi mới
  chuyển sang RGB. Chroma hai decode lệch nhau một chút → R0_est lệch →
  đầu ra direct lệch, DÙ sàn luma D_Y tại đó nhỏ. Đây là **sàn đường
  chroma**, không phải sàn luma — nên mọi predictor luma (hp/range/nb/est)
  đều không giải thích được nó (expl ≈ 0). Nó vẫn là sàn (khác decode),
  không phải lỗi effect: trong cùng một decode, (A') = 0,000 chứng minh
  effect chạy đúng từng pixel, kể cả các pixel direct này.
- Giới hạn trung thực: chẩn đoán này dùng mask per-pixel mà U3 §3 đã chứng
  minh là không đáng tin tại biên — tỉ lệ "either" 97–99% là bằng chứng
  mạnh nhưng không phải chứng minh hình thức. Chứng minh hình thức vẫn là
  (A') = 0,000 của U3.

---

## 4. Probe 3 — Đối chứng scaler (Node thuần, không ffmpeg)

Vì ghi file qua exec/ffmpeg bị chặn EPERM từ ~18:05 UTC 08/11 (xem §7),
probe này viết lại hoàn toàn bằng Node: tự decode PNG (zlib có sẵn —
**kiểm chứng khớp từng byte với raw ffmpeg** đã decode trước khi bị chặn:
0/2.764.800 byte lệch trên shot ocean-plain) + tự scale bilinear /
Lanczos-3 tách được. Dữ liệu: shots full-res + frame render 1280×720 đã
trích trước đó. Mỗi cặp (preview-scaler × render-scaler) đo floor MAD +
delta le8_net_nb trên lưới step 4.

| Cảnh × cỡ | Mức | bil/bil (cùng scaler) | bil/lanc | lanc/bil | lanc/lanc (cùng scaler) |
|---|---|---|---|---|---|
| basgo w1440 | sharp10 le8_net_nb | 0,00% (floor 0,97) | 0,08% (floor 1,95) | 0,01% (floor 1,91) | 0,00% (floor 0,98) |
| basgo w1440 | sharp05 | 0,00% | 0,00% | 0,00% | 0,00% |
| basgo 1:1 | sharp10 | 0,00% (floor 0,97) | **1,49%** (floor 1,52) | **1,33%** (floor 1,52) | 0,00% (floor 0,98) |
| basgo 1:1 | sharp05 | 0,00% | 0,03% | 0,03% | 0,00% |
| ocean w1440 | sharp10 | 0,00% (floor 2,16) | 0,08% (floor 2,71) | 0,07% (floor 2,78) | 0,00% (floor 2,15) |
| ocean w1440 | sharp05 | 0,00% | 0,00% | 0,00% | 0,00% |
| ocean 1:1 | sharp10 | 0,01% (floor 2,15) | **1,59%** (floor 2,78) | **1,39%** (floor 2,79) | 0,02% (floor 2,15) |
| ocean 1:1 | sharp05 | 0,00% | 0,09% | 0,08% | 0,00% |

**Đọc bảng:**
- **Cùng scaler → residual = 0,00% ở mọi ô.** Chỉ đổi scaler (không đổi
  decode, không đổi effect) đã đủ tạo ra residual; dùng cùng scaler thì
  phép đo delta ở viewport là chính xác tuyệt đối. Đây là đối chứng sạch:
  phần dư headed đến từ chuỗi đo, không từ effect.
- **Chéo scaler ở 1:1 sharp10: 1,33–1,59%** — đúng bằng phần dư headed
  của basgo 1:1 sharp10 (1,40%). Tức toàn bộ phần dư basgo 1:1 giải thích
  được bằng sai khác scaler (Chrome drawImage ≠ ffmpeg bilinear) — khớp
  với việc full-res basgo có nErr8 = 0 (§3.1) và 137 pixel dư "ô sạch"
  (§2.1) thực ra là nhiễu resample, không phải lỗi effect.
- **Chéo scaler ở w1440 chỉ 0,07–0,08%** (so với headed 2,15–2,29%):
  ở cỡ downscale mạnh, scaler đóng góp ít; phần dư w1440 chủ yếu là sàn
  decode (per-cell: 100% ở ô bẩn, §2.1).
- **Ocean 1:1 sharp10:** scaler giải thích ~1,4–1,6% trong 4,75% headed;
  phần còn lại là sàn decode (floor MAD 1,75, ô tệ nhất 10,70).
- Giới hạn: bộ scale Node không phải ffmpeg scale; drawImage của Chrome
  không đúng bằng bilinear hay lanczos — đối chứng chỉ đo BẬC ĐỘ LỚN nội
  bộ (cùng vs chéo scaler), không tái tạo đúng số headed. Không đo w1920/
  w2560 (ngoài phạm vi probe; suy luận ở đó dựa vào per-cell + full-res).

---

## 5. Verdict từng ô còn XẤP XỈ (tổng hợp 4 nguồn chứng cứ)

| Ô residual (metric cũ) | Verdict | Chứng cứ chính |
|---|---|---|
| ocean sharp10 w1440 (2,15%) | **SÀN** | Per-cell 0/181 ô sạch; M-range 0,05%; full-res 0,03%; (A')=0 |
| ocean sharp10 w1920 (1,09%) | **SÀN** | Per-cell 0/252 ô sạch; M-range 0,08%; full-res 0,03% |
| ocean sharp10 w2560 (4,89%) | **SÀN** | Per-cell 0/5166 ô sạch (ô tệ nhất 6,00); full-res 0,05%; (A')=0. Lưu ý: không một metric lưới nào xoá được ô này (M-range 2,92%) — verdict dựa vào per-cell + full-res, không dựa vào metric lưới |
| ocean sharp10 1:1 (4,75%) | **SÀN** | Per-cell 0/2747 ô sạch; scaler chéo giải thích ~1,4–1,6%; full-res 0,05%; (A')=0 |
| ocean sharp05 w2560 (1,88%) | **SÀN** | Per-cell 0/1983 ô sạch; full-res 0,03% |
| ocean sharp05 1:1 (1,64%) | **SÀN** | Per-cell 0/947 ô sạch; full-res 0,03% |
| basgo sharp10 w1440 (2,29%) | **SÀN** | Per-cell 0/193 ô sạch; M-range 0,13%; full-res 0,00% (nErr8=0) |
| basgo sharp10 1:1 (1,40%) | **SÀN** | Full-res nErr8=0; scaler chéo 1,33–1,49% ≈ đúng 1,40% headed; per-cell còn 137 px ô sạch (0,24%) được giải thích bằng scaler, không phải effect |
| Mọi ô còn lại (16 ô HYB4) | **KHỚP-trừ-sàn** (không đổi) | le8_net_nb ≤ 0,97% theo metric cũ; full-res 0,00–0,17% |

**Không tìm thấy lỗi effect thật nào.** Không sửa code production trong
luồng này; giữ HYB4 và hằng số `SHARPEN_CHROMA_K_CB/CR = 1,04/1,09`.
Mọi lệch headed còn lại đều thuộc về chuỗi đo (sàn decode Chrome-vs-ffmpeg
+ sai khác scaler downscale + nhánh direct khuếch đại khác biệt chroma),
đã được tách và đo riêng từng phần.

---

## 6. Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| `tsc --noEmit` (apps/web, chạy trực tiếp `./node_modules/.bin/tsc`, không qua npx) | **0 lỗi** |
| Unit `effectCanvas.test.ts` | **PASS 15 test** (`node --experimental-strip-types`) |
| Parity `effectCanvas.parity.test.ts` | **BỊ CHẶN — 14/15 check báo EPERM** (xem §7): các check cần ffmpeg render frame tham chiếu đều lỗi `EPERM: operation not permitted, write`; chỉ check glitch (không cần ffmpeg) xanh. Đây là lỗi môi trường, không phải hồi quy code — code production KHÔNG đổi trong luồng này; U3 đo xanh 15/15 trước khi bị chặn |
| Script staged `parity-68v7-compare.mjs` chế độ fullres (ocean) | Tái lập đúng số probe 2: nErr8 239/432, netHp 0,03%/0,05%, direct 0,992/0,975 |
| Script staged chế độ headed (ocean-w1to1) | Tái lập đúng số probe 1: le8_net_nb 1,64%/4,75%, le8_net_hp lưới 4,28%/7,07%, residNbClean 0 |
| Probe 3 decoder PNG Node vs raw ffmpeg | **Khớp từng byte** (0/2.764.800 byte lệch, shot ocean-plain) |
| Probe 3 tính xác định | Chạy 2 lần cho cùng số tới 0,01pp (vd basgo 1:1 bil/lanc sharp10 1,49% cả 2 lần) |

Không đổi code production trong luồng này (chỉ thêm harness/script đo +
LIMITS), nên tsc/unit chỉ là kiểm chứng cây vẫn xanh.

---

## 7. Sự cố trong lúc chạy (đã xử lý — và 1 sự cố môi trường chưa hết)

1. **Ghi file qua exec bị lỗi EPERM từ ~18:05 UTC 08/11 (01:05 +07 09/11):**
   mọi tiến trình con spawn qua exec (ffmpeg, cp, python, dd, head) ghi
   file đều có thể lỗi `EPERM: operation not permitted` / file 0 byte —
   không theo kích cỡ hay công cụ (lúc được lúc không, ghi nhỏ ≤100B thỉnh
   thoảng qua, ghi ≥100KB thường lỗi; node ghi cũng chập chờn). Ghi bằng
   file-tools (muse.write/edit) vẫn được. Parent đã ghi nhận vào MEMORY.md
   từ trước phiên này ("file-tools vẫn ghi được"). Ảnh hưởng trong luồng:
   parity test 14/15 check bị chặn (§6); probe 3 bản ffmpeg phải viết lại
   Node thuần; JSON scaler + JSON staged-script phải lưu bằng file-tool
   hoặc in ra stdout. **Không cố lách:** không thử push hay ghi bằng đường
   khác; chỉ đổi sang công cụ còn ghi được (file-tool / stdout) cho đúng
   phần việc của mình.
2. **`/tmp` (tmpfs 512MB) đầy 100%** khi chạy probe 1 (cache frame raw):
   combo testsrc2-w1to1 lỗi `No space left on device`. Đã dọn cache
   `/tmp/r68v7-*` và chuyển mọi scratch sang đĩa home
   (`hidden_files/round68-v7/scratch/`, /home còn 103GB). Bài học: không
   dùng /tmp cho frame raw nữa.
3. **Bug Int16 trong probe 2 (đã sửa, có đối chứng):** bản đầu lưu delta
   có dấu vào `Buffer` (wrap modulo 256) khiến mọi metric trừ sàn cho cùng
   một số vô nghĩa (netHp = 3,24% = netRange5 = netNb5 = netEst) và
   `explEst = 0`. Phát hiện nhờ kiểm tra tính nhất quán (net không thể lớn
   hơn tỉ lệ err>8). Sửa sang `Int16Array`, chạy lại: số trở về đúng
   (netHp 0,03%/0,05%, explEst 0,004/0,03). Số trong tài liệu này là số sau
   khi sửa.
4. **Bug chỉ số PNG decoder (đã sửa, có đối chứng):** bản đầu dùng
   `si = y*stride + x*bpp` để đọc dòng đã unfilter (phải là `x*bpp`) —
   hàng 0 đúng, các hàng sau sai (floorMAD 105!). Phát hiện nhờ đối chứng
   decoder Node vs raw ffmpeg (99,83% byte lệch, byte lệch đầu tiên đúng
   đầu hàng 1). Sửa xong: **0 byte lệch**.
5. **Bug ghi đè tại chỗ trong staged script (đã sửa, có đối chứng):**
   bản đầu tính floorMax5 bằng cách ghi đè `fmax` trong cùng vòng lặp
   (max lan truyền → netNb5 = 0 giả). Sửa sang mảng riêng; chạy lại cho
   đúng số probe 2 (netNb5 0,03%/0,05%).
6. **`npx tsc` lỗi quyền npm** (npm không ghi được log/cache — cùng EPERM):
   chạy trực tiếp `./node_modules/.bin/tsc` thì 0 lỗi.

---

## 8. Nợ còn lại (trung thực)

1. **Headed sharpen theo metric thô vẫn XẤP XỈ** trên ocean (le8 84,8–
   95,5%) và testsrc2 (le8 96,4–98,5%): đó là sàn decode + sai khác scaler
   của chuỗi đo, không phải lỗi effect — đã tách từng phần (§2–§4). Muốn số
   headed thô KHỚP thì phải thay đổi chuỗi đo (preview đọc frame YUV gốc,
   hoặc render dùng cùng decoder/scaler với Chrome) — ngoài phạm vi luồng này.
2. **Không có metric lưới nào dùng được cho headed:** M-hp lưới bị bác,
   M-range lưới chỉ tham khảo trên cảnh add-dominated. Headed vẫn dùng
   le8_net_nb + per-cell. Muốn metric trừ sàn đúng ở viewport cần đo ở
   full-res (M-hp full-res, đã chấp nhận) hoặc lấy trường sàn ở đúng thang
   blur — lưới step 4 không đủ phân giải.
3. **Phần dư direct-branch (0,03–0,17% full-res) chưa có predictor nào
   giải thích được:** cần mô hình sàn đường chroma (R0_est khác nhau giữa
   hai decode) nếu muốn số trừ sàn về 0 tuyệt đối. Thực tế không cần thiết
   cho verdict (đã ≤ 0,17% và (A')=0), nhưng là giới hạn đã biết của metric.
4. **Đối chứng scaler chưa đo w1920/w2560** (chỉ w1440 + 1:1); suy luận ở
   hai cỡ đó dựa vào per-cell + full-res.
5. **Parity test bị chặn bởi EPERM môi trường** (14/15 check) — cần chạy
   lại khi hết chặn để xác nhận cây vẫn xanh toàn diện (unit + tsc đã xanh).
6. **Headed noise vẫn LỆCH-THỐNG-KÊ** (nợ từ S7/đợt 66, không đo lại ở đây).

## 9. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/parity-68v7-compare.mjs` — compare mới, 2 chế độ:
  headed (metric cũ + per-cell + chẩn đoán lưới) và fullres (M-hp/M-est +
  direct-diag; PNG decoder Node đã kiểm chứng byte-identical). Tái dùng
  frame đã trích khi đúng cỡ; trích bằng ffmpeg khi cần (báo BLOCKER nếu
  ffmpeg bị chặn); ghi JSON thất bại thì in JSON ra stdout để lưu tay.
- `docs/PHASE9_ROUND68_V7_SHARPEN_RESIDUAL_LIMITS.md` — file này.

Chỉ dùng để đo, KHÔNG stage (probe nội bộ / log / scratch): probe +
JSON + log tại `hidden_files/round68-v7/` (`r68v7-percell.mjs`,
`r68v7-fullres-hp.mjs`, `r68v7-scaler-control.mjs`, `r68v7-png-debug.mjs`,
`percell/`, `fullres/`, `scaler/`, `scratch/`, `*.log`), footage đo U3
tái dùng (`hidden_files/round67-u3/media/`, binary — không stage).
