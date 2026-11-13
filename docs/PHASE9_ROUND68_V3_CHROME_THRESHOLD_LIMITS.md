# Phase 9 đợt 68, luồng V3 — Ngưỡng halve Chrome + fit pha 2-stage cho resample noise (đóng nợ U2 đợt 67 §7 mục 1–3)

> **Kết luận chốt (đọc trước):** (1) **Ngưỡng halve đã pin: 0,5.** Probe thang
> 0,45/0,48/0,5/0,55/0,6/0,63 trên hình học vuông cho thấy 2-stage thắng ở
> s≤0,48 (×1,2 ở 0,48; ×1,6 ở 0,45; ×5,6 ở 0,3819) và 1-kernel thắng ở
> s≥0,55 (×1,8 ở 0,55; ×3,2 ở 0,6; ×5,1 ở 0,63); tại s=0,5 hai mô hình
> trùng nhau đúng từng số. Ngưỡng 0,5 trong `chromeResampleRgb24` (đợt 67
> U2 đặt tạm) là **đúng** — không đổi code, chỉ cập nhật chú thích trạng
> thái từ "xấp xỉ, chưa đo" thành "đã đo, pin". (2) **Dư ±16 theo pha của
> 2-stage KHÔNG giải được bằng mọi biến thể đã thử** — lệch pha hằng số
> (δ1/δ2, cả cặp), mô hình 3 chặng, kernel lệch (skew), h1/h2<1, h2 phụ
> thuộc s2, làm tròn mid — tất cả đều tệ hơn hoặc bằng BASE; 3 chặng tệ
> hẳn (MAD 0,448 vs 0,119) và V_1D 0,159 xa số đo. Dư pha vẫn mở, nhưng
> đã loại trừ được cả họ giả thuyết. (3) **w1440 noise05 Δcorr R-G 0,199
> KHÔNG phải lỗi bộ lọc.** Chrome THẬT drawImage trên cùng frame nhiễu
> render cho corr R-G −0,147, trùng mô hình 2-stage (−0,148) tới 0,001 và
> đều nhau theo mọi lớp pha; trần verdict với đích Chrome-thật vẫn LỆCH
> (Δcorr 0,200). Phần dư nằm ở **khác biệt cấu trúc nhiễu giữa 2 đường**
> (render: ffmpeg noise trên YUV420p native; preview: addYuvNoise trên
> base RGB-derived) — không sửa được bằng mô hình resample. (4) **Không
> sửa mô hình trong `chrome-resample.mjs`**: biến thể duy nhất hơi tốt
> hơn trên impulse (h2=0,95, MAD 0,116 vs 0,119) làm verdict nhiễu w1440
> TỆ ĐI (noise10 KHỚP→LỆCH, 1/2→0/2) nên bị loại. Kết quả âm tính được
> ghi đầy đủ dưới đây.

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`. **KHÔNG push,
  KHÔNG release/tag.** Mọi số dưới đây là đo thật trên VM này (Chrome 158.0.8127.18
  headed qua Xvfb, Node v24.22.1, VM 4 vCPU, không GPU).
- Nợ đóng: U2 đợt 67 §7 mục 1 (ngưỡng halve), mục 2 (dư ±16 theo pha),
  mục 3 (w1440 noise05 Δcorr R-G).
- Dữ liệu đích: `hidden_files/round66-t3/render/` — `fullrgb-{plain,noise05,
  noise10}.raw` (1280×720) + `ff-bilinear-{plain,noise05,noise10}-{489x275,
  809x455,1733x975}.raw`. Tiêu chí KHỚP-THỐNG-KÊ: tỉ lệ std từng kênh
  ∈ [0,85, 1,18]; Δkurt ≤ 0,35; Δcorr ≤ 0,12 (delta frame preview−plain vs
  render−plain, lấy mẫu mỗi 4 px).
- Thang: w1440 video 489×275 (scale 0,3819444); w1920 809×455 (0,6319444);
  w2560 1733×975 (1,3541667, upscale).

## 1. Probe ngưỡng chuyển mô hình (headed, hình học vuông 512×512)

Script: `hidden_files/round68-v3/r68v3-chrome-threshold.mjs` (mẫu
r67u2-chrome-filter2.mjs), flag `--disable-gpu` (U2 đã chứng minh 3 bộ flag
byte-identical). Thang s ∈ {0,3819 (đối chứng), 0,45, 0,48, 0,5, 0,55, 0,6,
0,63}; mỗi thang 128 pha sweep X/Y từ p=256, xung điểm 2D 5 vị trí, texture
trắng seed 42/43/44 → V(s), phẳng 128 → DC, step edge dọc/ngang.
Kết quả: `r68v3-threshold-A.json`.

### 1.1 Tái hiện: Chrome 158 = Chromium 1254 từng số

Sweep s=0,3819 đo lại trên Chrome 158 **byte-identical** với dữ liệu U2 trên
Chromium 1254: MAD giữa 2 lần đo = 0,0000, max diff = 0, 0/50176 điểm khác;
5 xung điểm 2D peak/vị trí giống hệt (41/59/12/58/28). Hành vi bộ lọc
drawImage "high" không đổi giữa 2 phiên bản Chrome. Mọi kết luận U2 vẫn
đứng nguyên trên Chrome hiện tại.

### 1.2 Crossover: 2-stage thắng dưới 0,5; 1-kernel thắng trên 0,5

fullRowMAD trên sweep vuông (128 pha, X+Y), script `r68v3-fit-threshold.mjs`:

| s (thực) | dw | 1-kernel MAD | 2-stage MAD | thắng | hệ số |
|---|---|---|---|---|---|
| 0,3819 (0,3828) | 196 | 0,271 | **0,048** | 2-stage | ×5,6 |
| 0,45 (0,4492) | 230 | 0,233 | **0,144** | 2-stage | ×1,6 |
| 0,48 (0,4805) | 246 | 0,216 | **0,184** | 2-stage | ×1,2 |
| 0,50 (0,5000) | 256 | 0,004 | 0,004 | hoà (trùng nhau) | ×1,0 |
| 0,55 (0,5508) | 282 | **0,149** | 0,266 | 1-kernel | ×1,8 |
| 0,60 (0,5996) | 307 | **0,095** | 0,304 | 1-kernel | ×3,2 |
| 0,63 (0,6309) | 323 | **0,068** | 0,345 | 1-kernel | ×5,1 |

madPeak cùng hướng: ở 0,48 là 32,8 (2-stage) vs 35,1 (1-kernel); ở 0,63 là
56,9 (2-stage) vs 11,9 (1-kernel).

→ **Ngưỡng chuyển nằm trong (0,48, 0,55], phù hợp 0,5** — đúng quy luật
"halve khi s<0,5" của Skia (halve một lần rồi dừng vì thang còn lại ≥0,5).
Ngưỡng 0,5 trong `chromeResampleRgb24` được **xác nhận bằng đo**, không còn
là xấp xỉ. Lưu ý: ở 0,45–0,48 cả hai mô hình đều tệ theo giá trị tuyệt đối
(MAD 0,14–0,23, xem §2) — ngưỡng đúng nhưng mô hình 2-stage vẫn chưa phải
đáp án cuối ở vùng này.

### 1.3 V_1D / V_2D theo thang (đo mới)

| s | V_1D đo | V_1D² | V_2D texture đo | Vtex/V_1D² | DC |
|---|---|---|---|---|---|
| 0,3819 | 0,3415 | 0,1166 | 0,1188 | 1,019 | 128, var 0 |
| 0,45 | 0,3854 | 0,1485 | 0,1605 | 1,081 | 128, var 0 |
| 0,48 | 0,4125 | 0,1702 | 0,1875 | 1,102 | 128, var 0 |
| 0,50 | 0,4961 | 0,2461 | 0,2533 | 1,029 | 128, var 0 |
| 0,55 | 0,4828 | 0,2331 | 0,2601 | 1,116 | 128, var 0 |
| 0,60 | 0,5281 | 0,2789 | 0,3171 | 1,137 | 128, var 0 |
| 0,63 | 0,5720 | 0,3271 | 0,3550 | 1,085 | 128, var 0 |

- V_1D tăng đơn điệu theo s (trừ **vết lõm tại 0,55: 0,4828 < 0,4961 ở
  0,5**) — đúng dấu hiệu đổi chế độ tại ngưỡng 0,5: ở s=0,5 kernel là
  triangle h=1 đúng nghĩa (V=0,5); vừa qua ngưỡng, Chrome chuyển sang
  1-kernel với h=1 nhưng s>0,5 nên V lại thấp hơn rồi mới tăng tiếp.
- Vtex/V_1D² = 1,02–1,14 mọi thang → bộ lọc **tách được** (separable),
  nhất quán với U2.
- Step edge: hard, 2 mức xám duy nhất ở s≤0,5; 3–4 mức ở s≥0,55 (không
  điểm trung gian dài) — phù hợp kernel hẹp.

### 1.4 Tách được 2D giữ đúng mọi thang mới

Peak xung điểm 2D (256,256) đo vs dự từ sweep 1D (peakX·peakY/255):

| s | dự 2D | đo | lệch |
|---|---|---|---|
| 0,3819 | 40,0 | 41 | +1,0 |
| 0,45 | 50,1 | 50 | −0,1 |
| 0,48 | 57,4 | 58 | +0,6 |
| 0,50 | 63,3 | 63 | −0,3 |
| 0,55 | 76,9 | 78 | +1,1 |
| 0,60 | 49,2 | 52 | +2,8 |
| 0,63 | 53,7 | 56 | +2,3 |

Lệch ≤2,8 mức xám trên thang 0–255 ở mọi thang → mô hình 1D tách được
đủ để mô tả cả điểm 2D; không có thành phần chéo (cross-term) đáng kể.

## 2. Dư ±16 theo pha của 2-stage: mọi biến thể đã thử đều thua BASE (kết quả âm tính)

Script: `r68v3-fit-phase.mjs` (vòng 1) + `r68v3-fit-phase2.mjs` (vòng 2).
Dữ liệu fit: sweep vuông s<0,5 — U2 s=0,30/0,35/0,3819/0,40 + mới
s=0,45/0,48 (128 pha). Chỉ số chính: fullRowMAD pooled (6 thang) +
madPeak; BASE 2-stage = **0,119 / 20,78** (X và Y bằng nhau đúng 0,119 /
0,119 — không phụ thuộc trục).

### 2.1 Đặc tả lại dư (tái tạo từ dữ liệu U2, script r68v3-fit-existing.mjs)

Tại s=0,3819, peak đo vs peak mô hình 2-stage (128 pha X): |dPeak| mean
8,16, max 18; vị trí peak trùng 126/128 pha (chỉ sai biên độ, không sai
vị trí). Tự tương quan của dPeak theo pha: lag-1 −0,617, lag-2 0,094,
lag-3 0,460, lag-4 −0,916 — đan dấu mạnh nhưng không phải sin chu kỳ 2
thuần (lag-2 ≈ 0 thay vì +1), gợi ý cấu trúc rời rạc của lưới trọng số
hơn là một độ lệch pha liên tục. Mean dPeak k chẵn = k lẻ = +0,50 (không
lệch hệ thống theo chẵn/lẻ).

### 2.2 Vòng 1: lệch pha hằng số, 3 chặng, box, mid float — tất cả thua

| biến thể | pooled MAD | madPeak | kết luận |
|---|---|---|---|
| **BASE 2ST (tri/tri, uint8-mid)** | **0,119** | **20,78** | mốc |
| 2ST mid float (không tròn) | 0,119 | 20,77 | ≈ BASE (xác nhận U2) |
| 2ST chặng 1 box (trung bình 2 px) | 0,119 | 20,78 | ≡ BASE (ở s=0,5 triangle h=1 = box) |
| 3ST (halve, halve, scale) | 0,448 | 43,86 | **tệ 3,8× — LOẠI** |
| 3ST mid float | 0,448 | 44,01 | LOẠI |
| 2ST δ1=±0,25 | 0,245–0,262 | 43,7–48,0 | tệ ~2× — LOẠI |
| 2ST δ1=±0,5 | 0,490–0,508 | 87,6–92,3 | tệ ~4× — LOẠI |
| 2ST δ2=±0,25 | 0,253–0,259 | 30,4–30,7 | tệ ~2× — LOẠI |
| 2ST δ2=±0,5 | 0,455–0,468 | 43,1–43,4 | tệ ~4× — LOẠI |
| 2ST δ1=±0,25, δ2=±0,25 (4 cặp) | 0,296–0,367 | 44,0–55,0 | tệ ~3× — LOẠI |
| 3ST δ3=±0,25 | 0,493–0,495 | 41,5 | tệ ~4× — LOẠI |

δ=0 là optimum sắc: mọi độ lệch vị trí lấy mẫu đều làm tệ đi rõ rệt.
Quy ước vị trí lấy mẫu S=(i+0,5)/s của cả 2 chặng được **xác nhận**, không
phải nguồn dư.

### 2.3 Vòng 2: kernel lệch (skew), h<1, h2(s2) — tất cả thua hoặc hoà vô nghĩa

| biến thể | pooled MAD | madPeak | kết luận |
|---|---|---|---|
| **BASE 2ST** | **0,119** | **20,78** | mốc |
| skew chặng 1 ε=±0,05 | 0,124–0,128 | 21,6–22,8 | tệ hơn — LOẠI |
| skew chặng 1 ε=±0,1/±0,2 | 0,145–0,219 | 25,3–40,4 | tệ — LOẠI |
| skew chặng 2 ε=±0,05 | 0,120 | 20,84 | ≈ BASE (tệ hơn 0,001) — LOẠI |
| skew chặng 2 ε=±0,1/±0,2 | 0,122–0,135 | 21,0–21,6 | tệ hơn — LOẠI |
| h2=0,8 / 0,85 / 0,9 | 0,141 / 0,129 / 0,120 | 22,6 / 21,9 / 21,4 | tệ hơn — LOẠI |
| **h2=0,95** | **0,116** | **21,04** | xem §2.4 — **LOẠI sau kiểm verdict** |
| h1=0,85/0,9/0,95 | 0,119 | 20,78 | ≡ BASE (không nhận diện được ở s=0,5) |
| h2=1−0,5·(1−s2) | 0,126 | 21,78 | tệ hơn — LOẠI |
| h2=1−1,0·(1−s2) | 0,145 | 24,03 | tệ hơn — LOẠI |

### 2.4 h2=0,95: cải thiện impulse giả tạo, làm tệ verdict nhiễu thật → LOẠI

h2=0,95 là ứng viên duy nhất có pooled MAD nhỉnh hơn BASE (0,116 vs
0,119, −2,5%) nhưng madPeak tệ hơn (21,04 vs 20,78) và cải thiện không
đều theo thang (tốt hơn ở 0,40/0,45/0,48, tệ hơn ở 0,30/0,35/0,3819).
Kiểm chứng quyết định trên verdict nhiễu w1440 thật (script
`r68v3-verdict-final.mjs` §2, so preview headed):

|  | h2=1,0 (BASE) | h2=0,95 |
|---|---|---|
| noise05 | std [1,02, 1,09, 1,04], Δkurt [0,03, 0,22, 0,32], Δcorr [0,199, 0,009, 0,03] → **LỆCH** (chỉ corr R-G) | std [0,99, 1,05, 1,01], Δkurt [0,39, 0,29, 0,01], Δcorr [0,209, 0,02, 0,025] → **LỆCH** (corr tệ hơn + kurt R vượt ngưỡng) |
| noise10 | std [1,01, 0,98, 1,04], Δkurt [0,24, 0,19, 0,33], Δcorr [0,118, 0,002, 0,031] → **KHỚP** | std [0,99, 0,94, 1,01], Δkurt [0,09, 0,08, 0,03], Δcorr [0,127, 0,013, 0,026] → **LỆCH** (corr R-G 0,127 > 0,12) |

Tỉ lệ KHỚP w1440: **1/2 → 0/2**. h2=0,95 bị loại dứt khoát — cải thiện
MAD impulse 2,5% là overfit, không chuyển thành khớp thống kê thật.

### 2.5 V_1D: mô hình phẳng, đo tăng — chưa biến thể nào sửa được

V_1D Monte Carlo (nhiễu trắng 1D, 8 seed) vs đo:

| s | đo | BASE 2ST | 3ST |
|---|---|---|---|
| 0,30 | 0,277 | 0,333 | 0,160 |
| 0,35 | 0,323 | 0,339 | 0,159 |
| 0,3819 | 0,341 | 0,330 | 0,158 |
| 0,40 | 0,363 | 0,334 | 0,158 |
| 0,45 | 0,385 | 0,335 | 0,159 |
| 0,48 | 0,413 | 0,335 | 0,159 |

Mô hình 2-stage phẳng ~0,333 trong khi đo tăng 0,277→0,413 (thiếu 30%
V_2D ở s=0,45 theo U2; thừa 42% ở s=0,30). 3-stage cho V_1D ≈0,159
phẳng — sai hướng hoàn toàn (càng tệ). Không biến thể nào trong §2.2–2.3
làm V_1D tăng theo s như đo. Hướng chưa thử: trọng số tính bằng số
thực cố định (fixed-point) trong Chrome, hoặc chặng giữa thực hiện trên
đường GPU/CPU khác với làm tròn uint8 đơn thuần — cần probe sâu hơn
(xem §5).

## 3. w1440 noise05 Δcorr R-G: không phải dư pha, không phải lỗi bộ lọc

### 3.1 Δcorr đều nhau theo mọi lớp pha — loại trừ giả thuyết dư pha

Từ snapshot headed R65 (step 4; lưu ý: lưới lấy mẫu chỉ chứa MỘT lớp pha
rx≡1 mod 4, ry≡0 mod 4), tách theo lớp con (rx mod 8, ry mod 8), script
`r68v3-corr-phase.mjs` §A (n≈2100/lớp):

| lớp (rx%8, ry%8) | preview corr R-G | 2-stage corr R-G | Δcorr R-G |
|---|---|---|---|
| 1,0 | +0,041 | −0,154 | 0,195 |
| 1,4 | +0,082 | −0,152 | 0,234 |
| 5,0 | +0,058 | −0,148 | 0,206 |
| 5,4 | +0,032 | −0,155 | 0,187 |
| toàn bộ | +0,053 | −0,152 | 0,205 |

Δcorr 0,19–0,23 **đều nhau mọi lớp pha** (không tập trung ở lớp nào) →
dư pha §2 không phải nguyên nhân. Trên lưới đầy step 1, corr R-G của
render 2-stage cũng đều nhau theo 4 lớp parity (x%2,y%2): −0,146…
−0,151; ff-bilinear: −0,214…−0,219 (đều nhau). Bộ lọc không tạo ra phụ
thuộc pha cho corr.

### 3.2 Thí nghiệm quyết định: Chrome THẬT trên cùng frame nhiễu render

Script `r68v3-chrome-noise-corr.mjs`: phục vụ `fullrgb-plain.raw` /
`fullrgb-noise05.raw` qua HTTP local, trang probe `putImageData` rồi
`drawImage` "high" → 489×275, tính delta stats theo lớp pha trong trang.
Kết quả (`r68v3-chrome-noise-corr.json`):

|  | std [R,G,B] | kurt [R,G,B] | corr [R-G, R-B, G-B] |
|---|---|---|---|
| **Chrome thật** | [12,501, 8,042, 16,922] | [2,958, 0,380, 1,729] | **[−0,147, −0,158, −0,091]** |
| Mô hình 2-stage | [12,333, 7,818, 16,712] | [2,791, 0,408, 1,589] | [−0,148, −0,164, −0,095] |
| ff-bilinear | [6,665, 6,489, 9,511] | [9,835, −0,095, 5,297] | [−0,216, −0,034, −0,040] |
| Preview headed (R65) | [12,54, 8,61, 17,35] | [2,96, 0,21, 1,91] | **[+0,053, −0,184, −0,065]** |

- Chrome thật vs mô hình 2-stage: corr R-G **−0,147 vs −0,148 (lệch
  0,001)**, std lệch ≤3%, kurt lệch ≤0,14 — mô hình tái tạo đúng cấu trúc
  corr của bộ lọc thật trên nội dung nhiễu thật, đều nhau theo 4 lớp
  parity (−0,144…−0,150).
- **Trần verdict** (script `r68v3-verdict-final.mjs` §1): lấy delta stats
  Chrome-thật làm đích render thay cho mô hình → std [1,00, 1,07, 1,03],
  Δkurt [0,00, 0,17, 0,18], **Δcorr [0,200, 0,026, 0,026] → vẫn LỆCH**.
  Ngay cả bộ lọc thật cũng không khớp được corr của preview → phần dư
  **không nằm ở bộ lọc**.

### 3.3 Cơ chế: khác biệt cấu trúc nhiễu giữa 2 đường

- Render: ffmpeg `noise=alls=28:allf=t` trên YUV420p native rồi pre-encode
  → nhiễu Cr khối 2×2 (tần số thấp, ít bị downscale triệt) vs nhiễu Y
  trắng (tần số cao, bị triệt mạnh) → sau downscale, var(Cr)/var(Y) tăng
  → cov(R,G) = var(Y) − 0,737·var(Cr) âm → corr R-G ≈ −0,15 (mọi phép
  resample: Chrome-thật −0,147; 2-stage −0,148; ff-bilinear −0,216).
- Preview: `addYuvNoise` trên base RGB-derived trong trình duyệt → cân
  bằng Y/Cr khác → corr R-G ≈ +0,05.
- Bằng chứng phụ — lag-1 không gian của delta (step 4, theo x, tính đúng
  bằng Map theo toạ độ): preview [0,406, 0,169, 0,422] vs render 2-stage
  [0,423, 0,062, 0,496]. R/B tương đồng; **kênh G lệch rõ (0,169 vs
  0,062)** — đúng dấu hiệu cấu trúc nhiễu theo kênh khác nhau giữa 2
  đường, không phải lỗi resample (resample tác động như nhau lên mọi
  kênh nếu tách được — đã chứng minh §1.4).
- Kết luận: muốn khớp corr R-G phải thay đổi **mô hình nhiễu preview**
  (cân bằng Y/Cr của `addYuvNoise`) hoặc chấp nhận lệch — không phải việc
  của mô hình resample. Nợ này chuyển sang hướng model nhiễu (xem §5),
  không còn thuộc bộ lọc Chrome.

## 4. Đã làm / không làm (quyết định mô hình)

1. **Ngưỡng `chromeResampleRgb24` giữ 0,5** — đã đo pin (§1.2), không đổi
   hành vi. Chỉ cập nhật chú thích header trong `apps/web/scripts/
   chrome-resample.mjs` (từ "ngưỡng chính xác 0,45–0,63 CHƯA đo" thành
   "đã đo: crossover trong (0,48, 0,55], phù hợp 0,5; Chrome 158
   byte-identical với 1254") — thay đổi chú thích, không đổi code.
2. **Không cập nhật mô hình 2-stage**: không biến thể nào cải thiện tỉ lệ
   KHỚP có đo được (§2.4: h2=0,95 làm tệ đi 1/2→0/2); BASE giữ nguyên.
3. `effectCanvas.ts` / `preview.tsx` / `previewEngine`: **không đổi**.
4. Kiểm chứng: `node --test apps/web/scripts/chrome-resample-67u2.test.mjs`
   — 7/7 xanh sau khi sửa chú thích (xem log luồng); tsc/vite build
   không cần chạy lại (chỉ sửa comment trong .mjs, không đụng TS) —
   ghi rõ ở đây để đợt gộp khỏi chạy thừa.

## 5. Nợ mở / hướng tiếp theo

1. **Dư ±16 theo pha của 2-stage vẫn mở** (§2): đã loại trừ lệch pha hằng
   số, 3 chặng, skew, h<1, h2(s2), mid float/box, phụ thuộc trục. Hướng
   chưa thử: (a) trọng số fixed-point trong Chrome (Skia dùng fixed
   16.16 cho filter weights — sai số lượng tử hoá có thể tạo đan dấu
   theo pha); (b) chặng giữa không phải canvas uint8 mà là F16/texture
   GPU với làm tròn khác; (c) kernel 2D không tách được ở chặng halve
   (dù điểm 2D khớp tới ±2,8, phần dư nhỏ có thể nằm ở hạng chéo).
   Cần probe trọng số thực tế ở độ phân giải bit (so sánh từng trọng số
   suy ra từ sweep với fixed-point 2^-k).
2. **V_1D tăng theo s chưa giải thích được** (§2.5): mô hình 2-stage phẳng
   0,333 vs đo 0,277→0,413 (0,30→0,48) và 0,496→0,572 (0,5→0,63).
   Có thể cùng gốc với mục 1 (cùng một chi tiết implementation chưa biết
   của Chrome).
3. **w1440 noise05 Δcorr R-G (0,199) chuyển hướng**: không còn là nợ bộ
   lọc — cần đợt riêng về mô hình nhiễu preview (cân bằng Y/Cr của
   `addYuvNoise` so với ffmpeg noise trên YUV420p native) nếu muốn khớp;
   hoặc chấp nhận lệch corr ở w1440 noise05 và chỉ claim khớp noise10 +
   w1920/w2560. Lưu ý lag-1 kênh G lệch (0,169 vs 0,062) là manh mối.
4. **Mô hình 2-stage ở 0,45–0,48 vẫn tệ theo giá trị tuyệt đối** (MAD
   0,144–0,184): ngưỡng đúng nhưng fit chưa tốt ở vùng này — cùng gốc
   mục 1, chờ đáp án fixed-point/implementation.
5. **GPU thật**: mọi kết luận vẫn chỉ đúng trên CPU/SwiftShader (VM này
   không có GPU). Cần đo lại trên máy có GPU thật trước khi kết luận
   chung (nợ kế thừa U2 §7 mục 5).
6. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền, chờ
   user) — nợ chung, không thuộc luồng này.

## 6. Files

- `docs/PHASE9_ROUND68_V3_CHROME_THRESHOLD_LIMITS.md` (file này)
- `apps/web/scripts/chrome-resample.mjs` (chỉ sửa chú thích header: pin
  ngưỡng 0,5 + ghi chú Chrome 158; không đổi hành vi)
- Log + probe/fit/noise scripts:
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round68-v3/`
  (`r68v3-chrome-threshold.mjs`, `r68v3-threshold-A.json`,
  `r68v3-chrome-noise-corr.mjs`, `r68v3-chrome-noise-corr.json`,
  `r68v3-fit-existing.mjs`, `r68v3-fit-threshold.mjs`,
  `r68v3-fit-phase.mjs`, `r68v3-fit-phase2.mjs`,
  `r68v3-corr-phase.mjs`, `r68v3-verdict-final.mjs`, các `.log` kèm theo),
  log luồng `hidden_files/round68-v3.md`.
