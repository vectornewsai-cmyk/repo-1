# PHASE 9 ĐỢT 70 — LUỒNG X6: HEADED NOISE LỆCH — ĐÃ TÌM RA NGUYÊN NHÂN (delta0) + ĐÃ KHỚP PHẦN LỚN

**Ngày:** 09/11/2026 · **Nợ đóng:** đợt 69 §4 mục 6 (W6): sharpen — headed
noise vẫn LỆCH-THỐNG-KÊ, tìm hướng khác để khớp hẳn (hoặc kết luận giữ
verdict V7).
**Kết quả tóm tắt — nguyên nhân đã tìm ra, không phải ở bộ lọc, không phải
ở đường headed:**
1. **Phần dư corr R-G (≈0,20 ở w1440 noise05) là delta0** — trường xác
   định của `addYuvNoise`: base chroma của khung nhiễu là chroma native
   ƯỚC LƯỢNG theo khối 2×2 (k 1,04/1,12), khác base derived của khung
   plain. delta0 = RGB(Y, estCb, estCr) − RGB_plain: trơn (lag ~0,9),
   std ΔY ≈ 3,1 ở viewport, Var ≈ 9,9 — khớp Var thừa E2 (tỉ lệ
   0,75–1,28), corr 0,32–0,48 với delta preview (vs ~0,05 với render).
   Sau khi trừ delta0, Δcorr R-G sụp từ 0,20 → 0,01 (w1440 noise05) và
   ≤ 0,03 ở mọi tổ hợp; w1920/w2560 KHỚP-THỐNG-KÊ cả 2 mức.
2. **Đã triển khai hiệu chỉnh vào harness** (`parity-66t3-compare.mjs`:
   phương pháp mới `chrome-trilinear` + hiệu chỉnh delta0 cho cả
   `chrome-rgb`; đã chạy kiểm chứng end-to-end, khớp đúng số E7).
3. **Còn lại đúng MỘT số chưa khớp: Δkurt R ≈ 0,45–0,49 ở w1440**
   (cả 2 mức) và 0,42 ở w1920 noise10 (chỉ dưới trilinear) — KHÔNG đổi
   sau khi trừ delta0, và nhạy pha lấy mẫu (render kurt R dao động
   2,47–3,07 qua 4 pha). Cần capture toàn bộ pixel ở đợt sau mới kết
   luận chắc được ở ô này.
4. **Đã loại trừ bằng đo thật:** dither/quantization (E1, nhỏ hơn phần
   dư 5–30×); lệch khung (E3, D khung kề gấp ~5× phần thừa); đường
   chuyển đổi khác nhau plain-vs-effect (E4, Cov ≈ 0); predictor
   direct-branch và scaler đã thua từ W6/V7 (không làm lại).
5. **Đính chính W5 §7:** verdict nhiễu dưới trilinear của W5 dùng lấy
   mẫu render (0,0)-aligned trong khi preview là canvas-aligned — trộn
   pha. Với pha nhất quán + implementation trilinear production (X1),
   noise10 w1440 KHÔNG còn KHỚP (Δkurt R 0,45, Δcorr R-G 0,121).

Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`. **KHÔNG
push, KHÔNG release/tag, KHÔNG sửa code production trong luồng này.**
Mọi số dưới đây là đo thật (Node v24; Chrome 158 headed W6 tái dùng —
không chạy headed mới trong luồng này; VM không GPU). Probe/log/JSON tại
`hidden_files/round70-x6/` (`r70x6-dither.mjs`, `r70x6-noise-trilinear.mjs`,
`r70x6-decompose.mjs`, `r70x6-framediff.mjs`, `r70x6-pathfield.mjs`,
`r70x6-clip.mjs`, `r70x6-estshift.mjs`, `r70x6-corrected.mjs`,
`r70x6-compare-report.json`, các `.json` kèm theo), log luồng
`hidden_files/round70-x6.md`.

---

## 1. Thí nghiệm E1 — Dither/quantization: CHẾT THEO ĐỊNH LƯỢNG

Giả thuyết (b) trong task: dithering/quantization của Chrome headed gây
lệch. Phương pháp: resample render full-res T3 về 489×275 bằng
`resampleRgb24TwoStage` thật (đối chứng: thống kê base khớp đúng số W6
từng số — std [12,32, 7,79, 17,07], kurt [2,34, 0,50, 1,56], corr
[−0,152, −0,186, −0,100] ở noise05), rồi cộng nhiễu đều độc lập
U(−a,+a) vào mỗi khung (plain + noisy) rồi làm tròn uint8 — đúng cách
dither 8-bit tác động lên delta đo được. 5 seed.

| a | mean\|Δstd\| | mean\|Δkurt\| | mean\|Δcorr\| |
|---|---|---|---|
| 0,5 (dither 8-bit thực tế) | 0,000 | 0,000 | 0,000 |
| 1,0 (giới hạn trên 2×) | ≤ 0,16 | ≤ 0,10 | ≤ 0,006 |

Phần dư cần giải thích: Δkurt R 0,56–0,62, Δcorr R-G 0,123–0,205.
Dither nhỏ hơn 5–30 lần, và ở a=0,5 nó là no-op theo đúng nghĩa đen
(cộng U(−0,5,+0,5) vào khung uint8 rồi làm tròn lại trả về đúng khung
cũ). **Giả thuyết (b) chết.** Lượng tử hoá 2 lần cũng đã chết từ W6
(float-mid vs uint8-mid cho cùng kurt tới 0,01).

---

## 2. Thí nghiệm E0 — Verdict nhiễu dưới trilinear + đính chính W5

W5 giải bộ lọc bằng trilinear (MAD 0,002) nhưng verdict nhiễu dưới mô
hình mới CHƯA ai đo đúng cách (X1 chỉ kiểm chứng đáp ứng xung + V_1D).
E0 tính lại verdict cho 3 mô hình × 3 cửa sổ × 2 mức, pha lấy mẫu
canvas-aligned nhất quán như W6 (đối chứng: 1-kernel/2-stage tái lập
đúng số W6 từng số).

### 2.1 Bảng verdict (pha canvas-aligned)

| Cửa sổ | Mức | 1-kernel | 2-stage | trilinear (X1) |
|---|---|---|---|---|
| w1440 | noise05 | LỆCH (std G 0,83) | LỆCH (Δkurt R 0,62; Δcorr 0,205) | LỆCH (Δkurt R 0,49; Δcorr 0,20) |
| w1440 | noise10 | LỆCH (std G 0,76) | LỆCH (Δkurt R 0,56; Δcorr 0,123) | LỆCH (Δkurt R 0,45; Δcorr 0,121) |
| w1920 | noise05 | **KHỚP** | LỆCH | LỆCH (Δcorr R-G 0,128) |
| w1920 | noise10 | **KHỚP** | LỆCH | LỆCH (Δkurt R 0,40) |
| w2560 | noise05 | LỆCH (Δkurt G 0,39†) | LỆCH | LỆCH (Δkurt G 0,39†) |
| w2560 | noise10 | **KHỚP** | LỆCH | **KHỚP** |

(† sát nút, đổi theo pha — xem W6 §3.3. Trilinear ≡ 1-kernel ở w2560
vì upscale λ*=0.)

**Đọc bảng:** không mô hình nào khớp cả 6 tổ hợp (1-kernel 3/6,
trilinear 1/6, 2-stage 0/6). Trilinear cải thiện kurt so với 2-stage ở
w1440 (0,49 vs 0,62) nhưng không đủ; ở w1920 nó TỆ HƠN 1-kernel về
thống kê nhiễu dù khớp đáp ứng xung tới MAD 0,002 — đáp ứng xung
(bậc 1) và kurt nhiễu (bậc 4) ràng buộc bộ lọc theo cách khác nhau.

### 2.2 Đính chính W5 §7 — verdict của W5 trộn pha lấy mẫu

Script verdict của W5 (`r69w5-verdict-lodbias.mjs:153`, hàm
`deltaSampled`) lấy mẫu render từ (0,0) (rx≡0 mod 4) trong khi thống kê
preview lấy từ báo cáo T3 (canvas-aligned, rx≡1 mod 4) — đúng lỗi trộn
pha W6 đã chỉ ra ở U2. Số render kurt R của W5 (3,10) ≈ giá trị pha-0
của E0 (3,07), không phải pha đúng (2,47). Với pha nhất quán +
implementation trilinear production: noise05 Δkurt R 0,49 (W5 báo 0,14),
noise10 Δkurt R 0,45 + Δcorr 0,121 (W5 báo KHỚP). **Kết luận "noise10
KHỚP dưới trilinear" của W5 là sai do trộn pha; tỉ lệ KHỚP đúng dưới
trilinear (chưa hiệu chỉnh delta0) là 1/6, không phải 1/2.**

### 2.3 Nhạy pha của kurt R ở w1440

Render kurt R trilinear noise05 theo pha: 3,07 / 2,47 / 2,94 / 2,75
(toàn bộ pixel: 2,93); preview (pha canvas-aligned): 2,96. Verdict
Δkurt R lật theo pha (pha-0: 0,11 KHỚP; pha-1 đúng: 0,49 LỆCH).
Tiêu chí Δkurt trên mẫu step-4 là mong manh ở w1440 — chỉ capture
toàn bộ pixel mới kết luận chắc được (xem §10).

---

## 3. Thí nghiệm E2 — Phân rã delta thành Y/Cb/Cr: tìm ra thành phần thừa

Phân rã delta viewport (preview headed W6 vs render trilinear) thành
(ΔY, ΔCb, ΔCr) bt709 + ma trận hiệp phương sai + lag không gian.

**Kiểm chứng phân rã:** corr R-G suy ra từ ma trận thành phần khớp
đúng số đo trực tiếp ở MỌI tổ hợp (vd w1440 noise05: preview 0,053/
0,053; render −0,147/−0,147) — phép kế toán là chính xác, phần chênh
corr hoàn toàn nằm trong ma trận thành phần.

**Phát hiện — thành phần thừa thuần-Y, cộng thêm, hằng số:**
tỉ lệ Var preview/render (trilinear):

| Cửa sổ | Mức | Var ΔY | Var ΔCb | Var ΔCr | lag4x ΔY prev/render |
|---|---|---|---|---|---|
| w1440 | noise05 | **1,344** | 1,029 | 0,888 | 0,337 / 0,151 |
| w1440 | noise10 | 1,070 | 0,996 | 0,900 | 0,336 / 0,303 |
| w1920 | noise05 | 1,156 | 1,071 | 0,952 | 0,188 / 0,075 |
| w1920 | noise10 | 1,045 | 1,050 | 0,972 | 0,180 / 0,159 |
| w2560 | noise05 | 1,130 | 1,099 | 0,975 | 0,164 / 0,058 |
| w2560 | noise10 | 1,034 | 1,074 | 0,985 | 0,151 / 0,123 |

Chênh Var ΔY quy ra std của thành phần cộng thêm (giả thiết độc lập):
**3,43 / 2,78 / 3,52 / 3,24 / 3,65 / 3,20** — gần như HẰNG SỐ qua cả
6 tổ hợp (trung bình ≈ 3,3), không tỉ lệ với cường độ nhiễu (nên không
phải sai hiệu chuẩn strength) và không đổi theo cửa sổ. Thành phần thừa
trơn theo không gian (lag4x ΔY preview cao hơn render ở cả 6 ô).
Var ΔCr của preview THẤP HƠN render ~10% ở cả 6 ô (0,888–0,985) —
dấu hiệu phụ, xem §7.

**Cấu trúc full-res phía render (chỉ render có full-res):** ΔY std
14,72, lag1x 0,051 (gần như trắng); ΔCb std 12,81, lag1x 0,557; ΔCr
std 11,78, lag1x 0,43; độ khối của ΔCr: tương quan trong khối 2×2 là
0,729 vs qua biên khối 0,131 (noise05) — nhiễu chroma đúng cấu trúc
khối nửa-res như kỳ vọng.

---

## 4. Thí nghiệm E3 — Lệch khung (frame mismatch): CHẾT (biên 5×)

Ứng viên: snapshot nhiễu thực ra là khung kề (30±1) còn plain là khung
30 (do seek/patch trong harness) → delta = nhiễu + (khung kề − khung 30).
Đo trực tiếp: trích khung 29/30/31/32 từ test-pattern.mp4, hiệu khung
kề resample trilinear về viewport.

- D(31−30): std ΔY **15,6–16,1** ở viewport (lag4x 0,73–0,87), gấp
  ~5× thành phần thừa (3,3). Cộng D vào delta render: std RGB 29,8
  (preview 12,5), corr R-G −0,425 (preview +0,053) ở w1440 noise05.
- D(30−29) và D(32−30) cho cùng bậc độ lớn (15,9–18,5).

**Lệch khung chết:** nếu snapshot nhiễu lệch 1 khung, delta preview đã
lớn gấp ~2,4× số đo thật. Các snapshot là cùng khung 30.

---

## 5. Thí nghiệm E4 — Đường chuyển đổi khác nhau (ΔPF): CHẾT (Cov ≈ 0)

Ứng viên: snapshot plain đi đường video-trực-tiếp (video YUV → canvas
chính, convert + downscale một bước) còn snapshot nhiễu/sharpen đi qua
effectCanvas (convert YUV→RGB ở full-res rồi mới downscale RGB) — hiệu
của hai đường ΔPF là trường xác định, trơn, không đổi theo mức nhiễu.
Kiểm tra bằng hiệp phương sai chéo: đặt R_noise = (N_p−P_p)−(N_r−P_r),
R_sharp = (S_p−P_p)−(S_r−P_r); nếu ΔPF chia sẻ thì
Cov(R_noise, R_sharp) = Var(ΔPF) ≈ Var thừa E2 (≈ 10–13).

| Cửa sổ | Cov_Y trung bình (4 cặp noise×sharp) | Var thừa E2 | Tỉ lệ |
|---|---|---|---|
| w1440 | 0,075 | 9,75 | 0,008 |
| w1920 | 0,053 | 11,45 | 0,005 |
| w2560 | 0,300 | 11,76 | 0,026 |

corr(R_noise, R_sharp) ≈ 0,01–0,02 ở kênh Y (0,01–0,09 ở RGB).
**ΔPF không tồn tại ở bậc độ lớn cần thiết** (nhỏ hơn ~100×). Đường
chuyển đổi khác nhau không phải nguyên nhân. (Var dư sharpen ở Y chỉ
0,3–1,1 — sharpen gần như khớp tuyệt đối ở kênh Y, phù hợp V7.)

---

## 6. Thí nghiệm E5 — Kẹp (clipping): có thật nhưng KHÔNG phải yếu tố phân biệt

Chia pixel theo Y khung plain (<32 / 32–100 / 100–180 / 180–220 / >220),
đo mean/std ΔY từng bin (preview vs render trilinear):

| Bin Y-plain | w1440 noise05 preview mean | render mean | w1440 noise10 preview | render |
|---|---|---|---|---|
| <32 | +3,88 | +3,11 | +9,95 | +9,12 |
| 32–100 | **−3,78** | −0,87 | **−2,05** | +0,34 |
| 100–180 | **+4,71** | +0,45 | **+4,69** | +0,62 |
| 180–220 | +1,86 | −0,89 | −1,41 | −3,42 |
| >220 | −4,32 | −4,31 | −10,30 | −10,51 |

Ở 2 bin rail (<32, >220), mean lệch ±4/±10 ở CẢ HAI PHÍA gần như bằng
nhau — kẹp tại rail là có thật nhưng CHIA SẺ giữa preview và render
(nên triệt tiêu khi so delta, không giải thích phần thừa). Ở 3 bin giữa,
chỉ preview lệch có hệ thống (±4–5, gần như không đổi theo mức nhiễu)
còn render ≈ 0 — đây mới là chữ ký của thành phần thừa, và nó trỏ tới
§7 (kẹp RGB sau dịch base est-chroma, xem dưới).

---

## 7. Thí nghiệm E6 — Dịch base chroma ước lượng (delta0): ĐÃ XÁC NHẬN ✓

**Cơ chế:** `addYuvNoise` cộng nhiễu vào base chroma NATIVE ƯỚC LƯỢNG
theo khối 2×2 (estCb/estCr = mean khối × k 1,04/1,12, kẹp [16,240]),
trong khi khung plain dùng chroma derived từng pixel. Ngay cả khi nhiễu
= 0, khung nhiễu đã lệch khỏi plain một trường xác định
delta0 = RGB(Y_derived, estCb, estCr) − RGB_plain. Chiếu Y tuyến tính
của dịch chroma thuần ≈ 0 — nhưng qua kẹp RGB [0,255] (màu bão hoà của
testsrc2), phần bị kẹp làm Y-projection ≠ 0. Tính bằng đúng code
verbatim của production (K_CR = 1,12 — lưu ý V7 ghi 1,09 là hằng số
SHARPEN, không phải noise).

**Số đo (delta0):**
- Full-res: 68,0% pixel đổi, mean|dmax| 3,75.
- Viewport (trilinear): std(Y,Cb,Cr) = 3,14 / 1,72 / 2,10; **Var ΔY
  ≈ 9,85–9,99 ở cả 3 cửa sổ** (gần như hằng số); lag4x Y 0,91–0,97
  (cực trơn — vì là hiệu của hai lần chuyển đổi trên cùng khung).
- Var(delta0_Y) so với Var thừa E2: tỉ lệ **0,75–1,28** qua 6 tổ hợp
  (w1440: 0,84/1,28; w1920: 0,81/0,95; w2560: 0,75/0,98) — trong tiêu
  chí ±35% đã đăng ký ở ≥5/6 ô.
- corr(delta0_Y, preview ΔY) = **0,48 / 0,35 / 0,32** (noise05) và
  0,20 / 0,14 / 0,13 (noise10); corr(delta0_Y, render ΔY) ≈ 0,05 /
  −0,03 — delta0 là của riêng preview, đúng như dự đoán.
- Mẫu mean ΔY theo bin của delta0: <32: 0; 32–100: −3,73; 100–180:
  +3,46; 180–220: +3,52; >220: 0 — khớp dấu + độ lớn với mẫu preview
  ở cả 3 bin giữa (−3,78 / +4,71 / +1,86). Ở 2 bin rail delta0 = 0
  (màu đã ở biên 0/255 nên dịch bị kẹp chết) — đúng phần kẹp chia sẻ
  đã thấy ở E5.

**Vì sao chỉ lộ sau downscale:** delta0 trơn nên downscale gần như
không triệt nó (std 3,3 ở cả full-res lẫn viewport), trong khi nhiễu
trắng bị triệt ~3× ở w1440 (ΔY std 14,7 → 5,9). Ở full-res delta0 chỉ
chiếm ~5% Var delta (nên U2 đo full-res KHỚP); ở viewport w1440 nó
chiếm ~26% Var → làm lệch corr R-G và kurt. Mức độ hiệu ứng tỉ lệ
nghịch với thang downscale — đúng mẫu quan sát qua 3 cửa sổ.

**Kết luận E6: delta0 LÀ thành phần thừa.** Nó là artefact của THIẾT
KẾ `addYuvNoise` (base est-chroma, có chủ đích từ đợt 65 S7 để khớp
thống kê chiếu gamut ở full-res: trước S7, std R/B của preview thừa
34%/17% và kurt R lệch 2,94 so với render), không phải lỗi bộ lọc hay
mô hình nhiễu. Trên nội dung tự nhiên, hồi quy native-vs-derived cho
k ≈ 1,00–1,03 nên delta0 nhỏ hơn nhiều — artefact này nặng nhất trên
nội dung tổng hợp bão hoà như testsrc2.

---

## 8. Thí nghiệm E7 + triển khai harness — Verdict SAU KHI TRỪ delta0

Hiệu chỉnh: delta_preview' = delta_preview − delta0_viewport (tương
đương cộng delta0 vào phía render — cùng một phép so like-with-like).
Đã triển khai vào `apps/web/scripts/parity-66t3-compare.mjs`:
phương pháp mới `chrome-trilinear` (trilinear LOD-bias −0,5) + hiệu
chỉnh delta0 cho `chrome-trilinear` và `chrome-rgb` (chỉ verdict
nhiễu; sharpen không đổi; các phương pháp cũ giữ nguyên để đối chiếu;
env `R66T3_OUT` đổi đường ghi JSON để không ghi đè báo cáo T3).

### 8.1 Verdict sau hiệu chỉnh (trilinear)

| Cửa sổ | Mức | Trước (E0) | Sau khi trừ delta0 |
|---|---|---|---|
| w1440 | noise05 | LỆCH (Δkurt R 0,49; Δcorr 0,20) | LỆCH (**chỉ Δkurt R 0,49**; Δcorr 0,014) |
| w1440 | noise10 | LỆCH (Δkurt R 0,45; Δcorr 0,121) | LỆCH (**chỉ Δkurt R 0,46**; Δcorr 0,029) |
| w1920 | noise05 | LỆCH (Δcorr 0,128) | **KHỚP** (Δkurt ≤ 0,30; Δcorr 0,001) |
| w1920 | noise10 | LỆCH (Δkurt R 0,40) | LỆCH (Δkurt R 0,42; Δcorr 0,017) |
| w2560 | noise05 | LỆCH (Δkurt G 0,39) | **KHỚP** (Δkurt ≤ 0,23; Δcorr 0,011) |
| w2560 | noise10 | KHỚP | **KHỚP** |

**Δcorr R-G sụp ở mọi tổ hợp** (0,20 → 0,01; 0,128 → 0,001; 0,095 →
0,011) — vấn đề corr đã giải quyết xong. std ratio ≈ 1,00 ở mọi ô sau
hiệu chỉnh. **4/6 KHỚP dưới trilinear; 5/6 KHỚP nếu chọn mô hình tốt
nhất từng cửa sổ** (w1920 noise10 KHỚP dưới 1-kernel: Δkurt 0,11).
Đã kiểm chứng bằng cách chạy lại harness thật
(`parity-66t3-compare.mjs`, JSON `r70x6-compare-report.json`): khớp
đúng từng số với E7; các phương pháp cũ (chrome-yuv, ffmpeg-*) vẫn
LỆCH như trước — đối chiếu hồi quy còn nguyên; sharpen không đổi
(XẤP XỈ như trước).

### 8.2 Phần dư còn lại — chỉ Δkurt R

Sau hiệu chỉnh, phần dư duy nhất là **Δkurt R ≈ 0,45–0,49 ở w1440**
(cả 2 mức, không đổi trước/sau trừ delta0) và 0,42 ở w1920 noise10
(chỉ dưới trilinear; 1-kernel cho 0,11). delta0 không động tới kurt R
vì nó là trường trơn, đuôi nhẹ — đóng góp vào momen bậc 4 không đáng
kể, trong khi nó chi phối hiệp phương sai chéo. Hai điểm cần lưu ý:
- Kurt R nhạy pha lấy mẫu (E0 §2.3: render kurt R 2,47–3,07 qua 4
  pha) — verdict ở ô này có thể lật nếu lấy mẫu toàn bộ pixel.
- Ở w1920, kurt R "thích" 1-kernel hơn trilinear dù trilinear khớp đáp
  ứng xung tốt hơn — gợi ý bộ lọc thật của đường VIDEO có thể hơi khác
  bộ lọc của đường ảnh/canvas mà U2/W5 đã probe (xem §10).

---

## 9. Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| E1 dither: pipeline tái lập số W6 | Khớp đúng từng số (render 2-stage noise05) |
| E0: 1-kernel/2-stage tái lập số W6 | Khớp đúng từng số, cả 6 tổ hợp |
| E2: corr R-G từ ma trận thành phần vs đo trực tiếp | Khớp đúng (0,053/0,053; −0,147/−0,147; mọi ô) |
| E3: D khung kề vs thành phần thừa | D lớn gấp ~5× → loại trừ |
| E4: Cov(R_noise, R_sharp) vs Var thừa | 0,03–0,32 vs ~10–13 (tỉ lệ ≤ 0,03) → loại trừ |
| E5: mean ΔY theo bin | Mẫu preview-only ở 3 bin giữa khớp delta0 (E6) |
| E6: Var(delta0_Y) vs Var thừa E2 | Tỉ lệ 0,75–1,28 (6/6 ô trong ±35%) |
| E6: corr(delta0, preview) vs render | 0,32–0,48 vs ~0,05 (noise05) |
| E7/harness: chạy lại `parity-66t3-compare.mjs` | Khớp đúng số E7 cả 12 ô; exit 0 |
| `node --test chrome-resample-67u2.test.mjs` | **8/8 pass** |
| `node --check parity-66t3-compare.mjs` | OK |
| tsc / unit effectCanvas | Không sửa code production nên không chạy lại; cây không đổi ở đó |
| Headed mới / headless | KHÔNG chạy (xem §10): sau E6, nguyên nhân nằm trong code preview (`addYuvNoise`, giống hệt ở headless lẫn headed) — chạy headless không còn là phép phân biệt; chỉ còn giá trị xác nhận |

**Giả thuyết (a)/(c) trong task — trạng thái:** (b) dither đã đo chết
(E1). (c) sai số đo lường: đã loại bằng tính xác định của phép đo
(W6: trôi 0,00 vs T3; C1/C4b pixel-identical) + capture là getImageData
trong trang (không qua compositor/screenshot) + pha lấy mẫu đã pin
(W6 §3.3) + dải chặn E1. (a) headed-vs-headless: không chạy browser
mới vì chuỗi E2→E6 đã cô lập nguyên nhân vào code preview không phụ
thuộc chế độ — xem §10 mục 2.

---

## 10. Nợ còn lại (trung thực)

1. **Δkurt R ở w1440 (0,45–0,49, cả 2 mức) và w1920 noise10 dưới
   trilinear (0,42) vẫn LỆCH sau hiệu chỉnh delta0.** Đây là phần dư
   cuối của nợ headed-noise. Hai hướng tiếp theo, theo thứ tự:
   (a) capture toàn bộ pixel ở headed (không step-4) rồi tính lại
   verdict — kurt R nhạy pha tới ±0,6 nên verdict hiện tại ở ô này
   chưa vững; (b) probe bộ lọc với NGUỒN VIDEO thật (U2/W5 probe bằng
   ảnh/canvas; preview vẽ `<video>`) và fit lại LOD bias cho đường
   video — kurt R ở w1920 "thích" 1-kernel hơn trilinear gợi ý đường
   video có thể dùng bias khác (hoặc libyuv bilinear thay vì Skia
   trilinear).
2. **Chưa chạy headless-vs-headed:** chỉ còn giá trị xác nhận, không
   còn là phép phân biệt — delta0 là thuộc tính của `addYuvNoise`
   (chạy giống hệt ở cả 2 chế độ) và bộ lọc đã chứng minh độc lập cờ
   GPU (U2 §1.1). Nếu đợt sau vẫn muốn chạy để đóng hẳn giả thuyết
   (a), chỉ cần so delta stats headless-vs-headed trên cùng harness
   w1440 (kỳ vọng drift ≈ 0).
3. **KHÔNG sửa code production trong luồng này — và không nên vội sửa:**
   base est-chroma là có chủ đích (S7) và đang giữ khớp thống kê ở
   full-res (bỏ nó sẽ làm std R/B lệch lại 34%/17% như trước S7).
   Cách đúng là hiệu chỉnh ở PHÍA ĐO (đã làm ở harness §8) — hoặc, nếu
   muốn khớp tuyệt đối cả ở render, thêm delta0 vào mô hình render
   của noise (đợt sau quyết).
4. **Hiệu chỉnh delta0 là đặc thù nội dung:** delta0 tính từ khung
   plain đang so (tự thích ứng theo nội dung), nhưng độ lớn của nó phụ
   thuộc độ bão hoà của nội dung — lớn nhất trên testsrc2, nhỏ hơn
   nhiều trên nội dung tự nhiên (k ≈ 1,00–1,03). Verdict sau hiệu
   chỉnh trên nội dung tự nhiên (ocean/slovenska/basgo) chưa đo.
5. **Ngưỡng halve 0,45–0,63 vẫn chưa đo** (nợ U2 §7.1, không thuộc
   luồng này); với trilinear thì ngưỡng đó chỉ là hệ quả (λ*=0,5 tại
   s=0,5), không phải điểm chuyển mô hình.
6. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền,
   chờ user) — nợ chung.

## 11. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/parity-66t3-compare.mjs` — thêm phương pháp
  `chrome-trilinear` + hiệu chỉnh delta0 cho verdict nhiễu (chỉ 2
  phương pháp Chrome; sharpen + phương pháp cũ không đổi; env
  `R66T3_OUT` đổi đường ghi JSON). Đã chạy kiểm chứng end-to-end
  (khớp đúng số E7; test resample 8/8 xanh).
- `docs/PHASE9_ROUND70_X6_SHARPEN_NOISE_LIMITS.md` — file này.

Chỉ dùng để đo, KHÔNG stage (probe nội bộ / log / JSON): probe +
JSON + log tại `hidden_files/round70-x6/` (`r70x6-dither.mjs`,
`r70x6-noise-trilinear.mjs`, `r70x6-decompose.mjs`,
`r70x6-framediff.mjs`, `r70x6-pathfield.mjs`, `r70x6-clip.mjs`,
`r70x6-estshift.mjs`, `r70x6-corrected.mjs`,
`r70x6-compare-report.json`, `r70x6-*.json` kèm theo), log luồng
`hidden_files/round70-x6.md`. Dữ liệu đo tái dùng: snapshot headed W6
(`round69-w6/headed/w*`), frame render T3 (`round66-t3/render/`).
