# Phase 9 đợt 81, luồng I3 — Kernel BC: vì sao BC vẫn bù lệch đường sharp dù Chrome không dùng BC ở xung vuông

- **Luồng:** I3, đợt 81 (nợ đợt 80 H3 §5 mục 1 — nợ quan trọng nhất đợt 80 để lại).
- **Ngày:** 10/11/2026. Repo local `~/workspace/repo-1`, HEAD `5f548ef8`. **CHỈ stage, KHÔNG push.**
- **Kết luận ngắn: ĐÃ TÌM ĐƯỢC CƠ CHẾ — nhưng chỉ một nửa. Không sửa production.**

  Đường sharpen hai bên KHỚP NHAU ở project size (E1: MAD ≤ 1, blur của
  ffmpeg unsharp đúng là nhị thức — E7), nên lệch KHÔNG nằm ở đường effect.
  Lệch nằm ở **khâu resample/upscale**: toán tử hiệu dụng của Chrome trên
  mẫu delta đặc (xung vuông, bipolar, chu kỳ 8px nguồn) khác tam giác lý
  tưởng của mô hình — delta thật có năng lượng phân bố lại (đỉnh giảm
  ~20%, vai tăng ~25%, tổng năng lượng hơi cao hơn), và **kernel BC bù
  được đúng kiểu phân bố lại đó** (thùy âm + chuẩn hoá lại chuyển năng
  lượng từ đỉnh sang vai; gain hài của BC cao hơn tri 2–9%), nên MAD
  delta giảm 31–46% (4,04→2,79 / 4,69→2,64 ở sqw4-640). BC chỉ bù được
  MỘT NỬA phần dư (profile ±13 → ±7), vẫn XẤP XỈ, không KHỚP.

  **BC không phải kernel của Chrome** — H3 đã chứng minh Chrome không
  overshoot ở xung vuông (+0/−0, BC +6/−6). BC là kernel **bù**: nó bắt
  chước được đáp ứng hiệu dụng của Chrome trên mẫu delta đặc, không phải
  vì Chrome dùng BC. Quyết định: **GIỮ BC(0,25, 0,375) trong production,
  không đổi gì** — revert sẽ làm delta tệ đi ~1,9× mà không sửa được
  nguyên nhân gốc (toán tử hiệu dụng của Chrome vẫn chưa biết chính xác —
  xem nợ §7.1).

## 1. Câu hỏi và phương pháp

H3 §1.4 để lại mâu thuẫn: plain → tam giác thắng ~2,5×; sharp-delta →
BC thắng ~1,9×; trong khi probe xung vuông chứng minh kernel upscale của
Chrome là tam giác, không phải BC. Suy luận khi đó: "BC bù cho lệch ở
đường effect-sharp". Luồng này kiểm tra suy luận đó bằng probe offline
hoàn toàn trên dữ liệu H3 sẵn có (snaps headed run D w1920-p640 +
run A2 w2560-p1280, frame render fullrgb) — không chạy headed mới:

- **V0** tái lập số H3 (neo probe).
- **E1** delta ở PROJECT SIZE, không resample: `d_render = R_sharp−R_plain`
  vs `d_model = applySharpen(R_plain)−R_plain` (applySharpen thật, bundle
  từ `effectCanvas.ts` bằng esbuild).
- **E2** delta ở VIEWPORT: tri/BC/Mitchell/Catmull áp lên `d_render` và
  `d_model`, so với `dp_prev` thật — tách kernel khỏi delta gốc.
- **E3** fit gain `g` trên `tri(d_render)`.
- **E4** profile 1D qua cạnh (nửa trên = sọc dọc).
- **E5** kiểm kê clip ở project size.
- **E6** giả thuyết "sharpen sau upscale": `applySharpen(tri(R_plain))`.
- **E7** blur của ffmpeg unsharp có đúng nhị thức `[1,4,6,4,1]/16` không
  (bước gần-cô-lập sqw32).
- **E8** phân rã base-mismatch: `b = snap − tri(R_frame)`.
- **Fit A/B/C/D** (script thứ 2): fit lệch pha δ; blur hậu-kỳ; đáp ứng tần
  số tri vs BC tại các hài của mẫu delta; đo shift cạnh trực tiếp.
- **Base-amp test** (script thứ 3): khôi phục base Chrome bằng downscale
  snapshot về project size rồi sharpen trên base đó.
- **Perturb test** (script thứ 4): dịch base đi δ rồi đo khuếch đại qua sharpen.

## 2. Tái lập H3 (V0) — probe neo đúng từng số

| Nội dung | plain tri / BC | delta05 tri / BC | delta10 tri / BC |
|---|---|---|---|
| sqw4-640 (run D) | 1,040 / 2,647 | 4,041 / 2,793 | 4,724 / 2,640 |
| sqw4 (run A2) | 1,081 / 2,715 | 4,118 / 2,786 | 4,732 / 2,602 |

Trùng đúng từng số với log analyzer H3 (`r80h3-analyze.log`) và LIMITS H3
§1.4. Mọi số dưới đây đo trên cùng pipeline này nên so sánh được trực tiếp.

## 3. Đường effect KHÔNG phải nguyên nhân (E1 + E7)

### 3.1 E1 — delta ở project size: applySharpen ≈ render unsharp

MAD(`d_model`, `d_render`) theo nội dung:

| Nội dung | sharp05 | sharp10 | clip render/model sharp10 |
|---|---|---|---|
| sqw4-640 | 0,993 | 0,251 | 49,4% / 49,4% |
| sqw8-640 | 0,496 | 0,125 | 24,7% / 24,7% |
| sqw16-640 | 0,250 | 0,063 | 12,4% / 12,4% |
| sqw32-640 | 0,132 | 0,033 | 6,6% / 6,6% |
| lineart2px-640 | 0,064 | 0,076 | 97,3% / 97,4% |
| sqw4 (1280) | 0,994 | 0,250 | 49,7% / 49,7% |
| sqw32 (1280) | 0,125 | 0,031 | 6,2% / 6,2% |

Profile project-size sqw4-640 sharp10 (x=20..43): `d_render` và `d_model`
giống hệt nhau trừ vai −17 vs −16 (làm tròn nguyên của blur). Tỉ lệ clip
giống hệt nhau tới 0,1%. **Suy luận "lệch ở đường effect-sharp" của H3 là
SAI ở mức project size** — hai đường sharpen cho cùng một delta (sai số
chỉ còn ±1 mức, xem §7.6).

### 3.2 E7 — blur của ffmpeg unsharp đúng là nhị thức

Trên bước gần-cô-lập sqw32, profile delta của render so với mô hình nhị
thức `amount·(Y − blur(Y))` tính từ `R_plain`:

- sharp05: MAD = 0,133 (640) / 0,125 (1280); profile `[0, 0, 8, 43, −45,
  −10]` vs nhị thức `[0, 0, 8,8, 44, −44, −8,8]` — trùng.
- sharp10: MAD = 1,12 / 1,06 — lệch CHỈ do clip: mô hình không kẹp cho
  ±80, render kẹp ở ±63/64 (giới hạn full-swing từ base 64/192). Blur
  vẫn là nhị thức; clip giải thích toàn bộ phần chênh.

Xác nhận lại kết luận S7 (đợt 65) bằng dữ liệu độc lập, trên nội dung mới.

## 4. Lệch nằm ở khâu resample (E2 + E4)

### 4.1 E2 — BC thắng là hiệu ứng thuần kernel trên delta

MAD so với `dp_prev` thật, sqw4-640:

| Phương pháp | sharp05 | sharp10 |
|---|---|---|
| tri(`d_render`) | 4,042 | 4,692 |
| **BC(`d_render`)** | **2,754** | **2,601** |
| Mitchell(`d_render`) | 2,738 | 2,541 |
| Catmull(`d_render`) | 3,758 | 4,510 |
| tri(`d_model`) | 3,969 | 4,727 |
| BC(`d_model`) | 2,569 | 2,740 |

`tri(d_model) ≈ tri(d_render)` và `BC(d_model) ≈ BC(d_render)` — delta
gốc (render hay model) không quyết định kết quả; **kernel quyết định**.
Mitchell nhỉnh hơn BC một chút trên delta sqw (0,02–0,10 MAD, ~1–4%),
nhưng xem §6: không đủ cơ sở đổi (B,C).

### 4.2 E4 — profile: BC chuyển năng lượng từ đỉnh sang vai

Profile viewport sharp10 sqw4-640, x=100..139 (kênh R, trung bình hàng
nửa trên):

- `dp_prev`: đỉnh ~±50–58, vai ~±13–45.
- `tri(d_render)`: đỉnh ±63, vai ±35 — đỉnh CAO hơn dp ~13, vai THẤP
  hơn dp ~10.
- `BC(d_render)`: đỉnh ±57, vai ±39 — nằm giữa, gần dp hơn ở ~33/40 vị
  trí.

Phần dư `dp − tri(d_render)` có đỉnh ±10–13; phần dư `dp − BC(d_render)`
chỉ còn ±5–7. **BC bù bằng cách làm phẳng mẫu delta**: đỉnh giảm, vai
tăng — đúng kiểu tái phân bố của kernel có thùy âm trên mẫu bipolar đặc
(xem §5).

### 4.3 Tỉ lệ cải thiện của BC không đổi theo chu kỳ/thang

`(tri−BC)/tri` trên delta, mọi nội dung sqw, cả 2 thang (1,132 / 1,264):

| | sqw4 | sqw8 | sqw16 | sqw32 |
|---|---|---|---|---|
| sharp05 | 31% | 33% | 33% | 34% |
| sharp10 | 44% | 46% | 46% | 46% |

Giá trị tuyệt đối tỉ lệ với mật độ cạnh (1/chu kỳ) — cùng tỉ lệ với
plain MAD (1,04 / 0,53 / 0,27 / 0,15). BC thắng một PHẦN TRĂM cố định
của lệch, không phải một lượng tuyệt đối — gợi ý cơ chế là đáp ứng tần
số/không gian, không phải bù một sai số cố định.

### 4.4 Control: lineart2px — kernel không ảnh hưởng gì

| | tri | BC | Mitchell | Catmull |
|---|---|---|---|---|
| delta05/10 | 4,107/4,113 | 4,306/4,313 | 4,295/4,302 | 4,302/4,313 |

Delta MAD ~4,1 với MỌI kernel; E1 project-size MAD chỉ 0,064–0,076
(đường effect khớp). Lệch ở đây là aliasing đường 2px, không phải kernel
— giới hạn của kết luận BC: **BC chỉ bù được trên mẫu delta đặc tuần
hoàn, không phải mọi lệch sharp**.

## 5. Cơ chế BC bù — và 5 giả thuyết đã loại trừ

### 5.1 Đáp ứng tần số (fit C): BC khuếch đại hài cao hơn tri

Đo gain/pha của tri vs BC trên sóng sin thuần tại các hài của mẫu delta
(f = k/8 chu kỳ/px nguồn), đúng thang s=1,2639:

| f | tri gain / φ | BC gain / φ |
|---|---|---|
| 0,125 | 0,949 / −0,082 | 0,972 / −0,083 |
| 0,25 | 0,810 / −0,165 | 0,868 / −0,165 |
| 0,375 | 0,616 / −0,248 | 0,669 / −0,247 |

BC gain cao hơn tri +2,4% / +7,2% / +8,6% ở hài 1/2/3, **pha giống hệt**
(chênh 0,001 rad). Delta thật của Chrome có năng lượng hài cao hơn mô
hình tam giác; BC bù một phần đúng chỗ đó. Cùng với thùy âm nhỏ của
BC(0,25, 0,375) (−0,042 tại |x|=1,5, sau chuẩn hoá lại) tạo tái phân bố
đỉnh→vai ở §4.2. Hai hiệu ứng này là một: kernel BC vừa boost hài cao
vừa ringing nhẹ trên mẫu bipolar đặc.

### 5.2 Năm giả thuyết đã loại bằng số đo

| Giả thuyết | Test | Kết quả |
|---|---|---|
| **Gain (preview sharpen mạnh hơn)** | E3: fit g trên `tri(d_render)` | g tốt nhất 1,05–1,10, cải thiện chỉ 2–4% (4,042→3,946); BC cải thiện 31–46%. **Loại.** |
| **Sharpen sau upscale** | E6: `applySharpen(tri(R_plain))` | Tệ hơn 1,4–3,8× (sqw4-640: 7,605/9,963 vs 4,042/4,692; lineart2px: 11,777/15,674 vs 4,121/4,128). **Loại dứt khoát.** Khớp code: `effectCanvasSource(drawSrc, dw, dh, …)` sharpen ở khổ letterbox project, rồi mới drawImage lên viewport. |
| **Lệch pha subpixel** | Fit A: shift δ cho resample tri; fit D: đo shift cạnh trực tiếp | Plain muốn δ=−0,03px nguồn (MAD 1,041→0,643), delta muốn δ=+0,03 (4,042→3,769) — **ngược dấu nhau**; cải thiện delta chỉ 4–7%. D: shift cạnh −0,05px viewport (RMSE 0,7; pixel giữa cạnh snap 128 vs model 122,9). **Loại làm cơ chế chính.** |
| **Làm mờ thêm** | Fit B: blur hậu-kỳ lên `tri(d_render)` | Tệ hơn 2,7–3,4×: tap121 10,76, binom5 13,90 vs 4,042 (sharp05); plain cũng tệ hơn (8,693 vs 1,041). **Loại dứt khoát.** Profile "phẳng hơn" ở §4.2 không phải blur — blur đối xứng làm hỏng cả vai. |
| **Base-mismatch khuếch đại qua sharpen** | Perturb test: dịch base ±0,03px (≈ đúng cỡ b_plain, base MAD 0,991) rồi sharpen | Project Δ thay đổi 1,49 nhưng viewport `tri(d_pert)` vs `dp_prev` chỉ đổi −0,03..+0,24 theo hướng KHÔNG nhất quán (sqw4-640 sharp05: 4,012/4,246 vs baseline 4,042; sharp10: 4,935/4,453 vs 4,692). sqw32 cũng chỉ đổi ±0,04. **Loại làm cơ chế chính.** |
| Đường effect khác nhau | E1/E7 (§3) | Khớp ở project size (MAD ≤ 1). **Loại.** |

### 5.3 Base-amp test: thất bại về phương pháp, ghi lại để khỏi lặp

Ý tưởng: downscale snapshot plain về project size để khôi phục base
Chrome, rồi sharpen trên base đó. **Không dùng được**: round-trip
upscale→downscale qua 2 lần triangle làm mất độ sắc cạnh (v1 δ=0:
MAD(chromeBase_est, R_plain) = 8,393 ở sqw4-640, 1,13 ở sqw32-640;
v2 δ=−0,5: 1,927 ở sqw32-640). Quy ước `S=(i+0,5)/s` không round-trip
một cách ngây thơ — phép nghịch đảo đúng cần chú ý pha, và dù đúng pha
thì 2 lần triangle vẫn làm cùn cạnh. `d_browser` tính ra là rác
(MAD ~36–47). Đây là kết quả âm VỀ PHƯƠNG PHÁP, không phải bằng chứng
chống lại giả thuyết base-amp (giả thuyết này đã bị loại độc lập bằng
perturb test ở §5.2).

### 5.4 Cơ chế còn lại — và phần chưa biết

Sau khi loại 6 giả thuyết, còn lại một khả năng duy nhất phù hợp mọi số
đo: **toán tử upscale hiệu dụng của Chrome trên mẫu delta đặc khác tam
giác lý tưởng của mô hình** — đáp ứng hài cao hơn một chút và tái phân
bố năng lượng đỉnh→vai; BC bắt chước được một nửa hiệu ứng đó. Nhưng
**nguyên nhân gốc của sự khác biệt này vẫn chưa biết**: có thể là chi
tiết implement bilinear của Skia (trọng số/làm tròn/pha ở 2D), đường
video→canvas qua GPU, hoặc một khâu khác trong pipeline preview chưa
tách được. Probe xung vuông của H3 chỉ đo đáp ứng trên BƯỚC ĐƠN (plain)
— bước đơn không nhạy với khác biệt này; mẫu delta bipolar đặc mới lộ
ra. Cần probe trực tiếp toán tử upscale của Chrome trên mẫu bipolar đặc
(xem nợ §7.1) mới tách được "kernel Chrome khác tri" khỏi "khâu khác
trong pipeline preview".

## 6. Quyết định: GIỮ BC, không sửa production

- **Không đổi `chrome-resample.mjs`, không đổi `effectCanvas.ts`,
  không đổi `preview.tsx`.** Không có bằng chứng A/B nào ủng hộ một thay
  đổi production: BC vẫn là lựa chọn tốt nhất hiện có cho sharp-delta
  (tốt hơn tri 31–46%, tốt hơn Catmull-Rom rõ rệt); revert về tri sẽ làm
  delta tệ đi ~1,9× mà không sửa được nguyên nhân gốc.
- Mitchell (1/3, 1/3) nhỉnh hơn BC một chút trên delta sqw (0,02–0,10
  MAD, ~1–4%; tuyệt đối sharp10 sqw4-640: 1,105 vs BC 2,223) nhưng
  plain tệ hơn tri như BC, và lưới G5 §5 đã cho thấy không có điểm
  (B,C) nào thắng nhất quán trên nội dung tự nhiên — **không đủ cơ sở
  đổi (B,C)**. Giữ điểm E9 (0,25, 0,375).
- Catmull-Rom (0, 0,5) tệ hẳn (delta 3,7–4,5): thùy âm càng lớn càng tệ
  — "một chút ringing thì bù được, nhiều thì hỏng".

## 7. Giới hạn trung thực (nợ mở / chưa giải quyết)

1. **Nguyên nhân gốc của đáp ứng hiệu dụng Chrome ≠ tri trên mẫu delta
   đặc vẫn mở.** Cần probe headed mới: đưa trực tiếp một mẫu bipolar đặc
   đã biết (không qua sharpen) vào Chrome drawImage upscale rồi đo đáp
   ứng — tách "kernel Chrome khác tri" khỏi "khâu khác trong pipeline".
   Cho tới khi có probe đó, đừng claim đã hiểu hết cơ chế; §5.4 chỉ là
   kết luận loại trừ, không phải đo trực tiếp toán tử Chrome.
2. **BC chỉ bù được một nửa** (delta MAD 4,04→2,79 / 4,69→2,64, vẫn
   XẤP XỈ, le8 95,7–95,8% < 99%): đừng trích BC là "khớp" cho sharp trên
   xung vuông; verdict KHỚP chỉ đạt trên nội dung tự nhiên (F6/G5).
3. **Lineart2px delta MAD ~4,1 không phụ thuộc kernel** (aliasing) —
   vẫn mở; BC không sửa được.
4. **Downscale-back không dùng được để khôi phục base** (§5.3) — đừng
   dùng lại phương pháp này cho mẫu đặc; round-trip 2 lần triangle làm
   cùn cạnh (MAD 1,1–1,9 chỉ từ round-trip).
5. `applySharpen` vẫn dùng bt709 (nợ H3 §5.2) — kề với fix noise bt601,
   chưa có bằng chứng trực tiếp; không đụng trong luồng này.
6. E1 sharp05 MAD 0,993 trên sqw4 (gấp 4× sharp10: 0,251): sai khác ±1
   giữa applySharpen và ffmpeg unsharp trên pixel chưa clip — có thể là
   làm tròn nguyên trong blur của ffmpeg vs float64 nhị thức. Nhỏ, chỉ
   ghi nhận; muốn đuổi ±1 cuối thì so trực tiếp output unsharp của
   ffmpeg với mô hình nhị thức float trên bước chưa clip.
7. Chỉ đo 2 thang upscale (1,132 / 1,264), nội dung tổng hợp grayscale,
   frame 30, 1 capture/biến thể. Chưa đo thang >1,3, dị hướng, nội dung
   màu bão hoà (HYB4/chroma có thể đổi câu chuyện E1), hay frame
   chuyển động.

## 8. Kiểm chứng

- V0 tái lập đúng từng số H3 (log analyzer + LIMITS H3 §1.4).
- `node --test apps/web/scripts/chrome-resample-67u2.test.mjs`: **8/8
  pass** (chrome-resample.mjs không đổi).
- Không sửa file production nào trong luồng này (chỉ thêm 4 script đo +
  doc này) nên tsc/vite build không bị ảnh hưởng; không chạy lại
  (không có gì để hồi quy).
- Probe chính chạy offline trên dữ liệu H3 (9 nội dung × 2 run, ~16
  phút); fit pha/blur/tần số + perturb test chạy sau, exit 0.

## 9. File

- Script mới (4, `apps/web/scripts/`): `r81i3-sharp-mechanism.mjs`
  (V0 + E1–E8), `r81i3-phase-blur-fit.mjs` (fit A/B/C/D),
  `r81i3-base-amp-test.mjs` (v2, δ=−0,5 — v1 δ=0 chỉ còn trong log),
  `r81i3-perturb-test.mjs`.
- Doc này: `docs/PHASE9_ROUND81_I3_KERNEL_BC_SHARP_LIMITS.md`.
- Bằng chứng (KHÔNG stage — không phải file repo):
  `hidden_files/round81-i3/` (`r81i3-mechanism.{json,log}`,
  `r81i3-phase-blur-fit.{json,log}`, `r81i3-base-amp-test{,2}.{json,log}`,
  `r81i3-perturb-test.{json,log}`).
