# Phase 9 đợt 67, luồng U2 — Giới hạn bộ lọc Chrome ở s≈0,38 + nhiễu sau downscale

> **Kết luận chốt (đọc trước):** (1) Bộ lọc Chrome thật ở s<0,5 là **2 chặng** (halve
> triangle h=1 rồi scale triangle h=1), KHÔNG phải kernel đơn — fit tốt hơn 4,6×
> trên impulse vuông (fullRowMAD 0,058 vs 0,265), và với đích 2-stage thì
> **w1440 noise10 chuyển LỆCH → KHỚP-THỐNG-KÊ**, noise05 chỉ còn lệch Δcorr R-G
> (0,199 > 0,12). (2) Ở s≥0,5 (w1920/w2560) mô hình **1-kernel vẫn đúng**, 2-stage
> lệch nặng — bộ lọc Chrome đổi hành vi theo thang, ngưỡng chính xác 0,45–0,63
> chưa đo. (3) Hướng **nhiễu-sau-downscale (POST) THUA** cả 2 đích tham chiếu
> (0/18 tổ hợp KHỚP, kể cả với hiệu chuẩn hoàn hảo) — **không triển khai vào
> production**. Đường hiện tại (nhiễu full-res rồi drawImage) là đúng bản chất
> vật lý; phần dư w1440 là lỗi **mô hình đo**, không phải lỗi preview. (4) Đã
> triển khai mô hình 2-stage vào **harness** (`chrome-resample.mjs` +
> `chrome-resample-67u2.test.mjs`, 7/7 xanh) — `resampleRgb24` mặc định giữ
> nguyên, không đụng code production (`effectCanvas.ts`/`preview.tsx` không đổi).

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`. **KHÔNG push,
  KHÔNG release/tag.** Mọi số dưới đây là đo thật (Chromium 1254 headed qua Xvfb,
  Node v24.22.1, VM 4 vCPU AMD EPYC 9D25, không GPU).
- Nợ đợt 66 §8 mục 2 (T3): 24 tổ hợp chỉ 3/24 KHỚP-THỐNG-KÊ (cả 3 chrome-rgb);
  noise LỆCH ở w1440, noise05 w2560 sát nút; phần dư nằm ở bộ lọc Chrome thật ở
  s≈0,38.
- Dữ liệu đích: `hidden_files/round66-t3/render/` — `fullrgb-{plain,noise05,
  noise10}.raw` (1280×720) + `ff-bilinear-{plain,noise05,noise10}-{489x275,
  809x455,1733x975}.raw` (3 cửa sổ w1440/w1920/w2560). Tiêu chí KHỚP-THỐNG-KÊ:
  tỉ lệ std từng kênh ∈ [0,85, 1,18]; Δkurt ≤ 0,35; Δcorr ≤ 0,12 (delta frame
  preview−plain vs render−plain, lấy mẫu mỗi 4 px).
- Thang: w1440 video 489×275, scale danh nghĩa 0,3819444; w1920 809×455, scale
  0,6319444; w2560 1733×975, scale 1,3541667 (upscale).

## 1. Probe bộ lọc Chrome (headed, s = 0,30–0,50)

Script: `hidden_files/round67-u2/r67u2-chrome-filter.mjs` (mẫu r66t3-filter-probe3),
`r67u2-chrome-filter2.mjs` (hình học vuông + GPU check).

### 1.1 GPU-vs-CPU: bộ lọc không đổi theo flag GPU; VM này KHÔNG có GPU

- 3 bộ flag: A=`--disable-gpu`, B=mặc định, C=`--disable-accelerated-2d-canvas` →
  **3 JSON byte-identical** (md5 `fb58f5cb7d2f4914d5b924a643a8d727`). drawImage
  downscale không đổi theo flag GPU trên VM này.
- VM **không có GPU**: `/dev/dri` không tồn tại, lspci không có VGA; CPU AMD EPYC
  9D25. WebGL null ở flag mặc định (Chrome ≥139 chặn SwiftShader WebGL mặc định);
  chỉ với `--enable-unsafe-swiftshader` mới có renderer `ANGLE (Google, Vulkan
  1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)` — phần
  mềm. Xung điểm (256,256) cho 41 ở cả mặc định lẫn SwiftShader → filter độc lập
  đường GPU/CPU.
- Mọi phép đo lặp n=3 identical (xác định, không nhiễu đo).

### 1.2 Nội dung probe

Mỗi thang s ∈ {0,30; 0,35; 0,3819444; 0,40; 0,45; 0,50}: sweep xung 1D theo pha
trục X/Y riêng (SRC 512×16 / 16×512), xung điểm 2D 1×1, texture trắng seed 42/43/44
→ V(s), phẳng 128 → DC, step edge dọc/ngang.

- V_2D texture (mean 3 seed): s=0,30→0,078; 0,35→0,108; 0,3819→0,120; 0,40→0,128;
  0,45→0,160; 0,50→0,249. Phẳng 128 → đúng 128, var 0. Step → hard, không điểm
  trung gian.

### 1.3 Phát hiện then chốt: hình học nguồn làm đổi bộ lọc

- Sweep **DẸT** 512×16 (sy=1, mẫu T3/probe1) vs **VUÔNG** 512×512 (sy=sx, đúng
  viewport thật): ở s<0,5 khác hẳn (vuông-vs-dẹt MAD 0,29, madPeak tới 80); ở
  s=0,5 giống hệt (MAD 0,004). → **Dữ liệu T3 fit trên hình học dẹt KHÔNG đại
  diện cho viewport thật.** Mọi fit dưới đây dùng hình học vuông.
- Hình học vuông: **TÁCH ĐƯỢC** — điểm 2D dự đoán từ vạch 1D: (256,256) đo 41 vs
  dự 40,0; (257,257) đo 59 vs dự 55,5; Vtex/V1D² = 0,97–1,06 (6 thang).
  V_1D (vuông): 0,277/0,323/0,342/0,363/0,387/0,496.

## 2. Fit kernel: không kernel đơn nào đủ; mô hình 2 chặng thắng

Script: `r67u2-filter-fit{,2,3,4,5,6,7}.mjs`, `r67u2-crossover.mjs`.

### 2.1 Kernel đơn (lưới triangle/Mitchell/Catmull/B-spline/Lanczos2/3/box/Gauss × h × norm/area × phi)

- Tốt nhất trên sweep vuông: triangle h≈2, fullRowMAD 0,199, madPeak 20,5.
  BASE (triangle h=1/(2s), mô hình T3): fullRowMAD 0,265, madPeak 39.
  → Không kernel đơn nào fit tốt dữ liệu vuông.

### 2.2 Mô hình 2 chặng (ĐỘT PHÁ)

Halve 512→256 (triangle h=1) rồi scale 256→dw (triangle h=1), phi=0 cả 2 chặng,
mid làm tròn uint8 (khớp đúng từng số tại xung p=272; float-mid lệch 1):

| s | fullRowMAD BASE | fullRowMAD 2-stage |
|---|---|---|
| 0,30 | 0,269 | 0,105 |
| 0,35 | 0,292 | **0,010** |
| 0,3819 | 0,271 | **0,048** |
| 0,40 | 0,237 | 0,080 |
| 0,45 | 0,229 | 0,142 |
| 0,50 | 0,004 | 0,004 |

- Pooled fullRowMAD **0,058** (tốt hơn BASE 0,265, **4,6×**), madPeak 9,36
  (BASE 39). M=256 là optimum sắc (M khác ≥ 0,227); s2=dw/256 đúng (thang danh
  nghĩa 2·s); h2>1 tệ hơn; 2-stage qua box/trilinear tệ hơn; float-mid ≈ uint8-mid
  (0,057 vs 0,058 pooled — nhưng uint8-mid khớp đúng từng số tại p=272, nên
  implementation dùng uint8-mid).
- Per-phase tại s=0,3819 (128 pha 256–383): 2-stage mad 0,000–0,092 (mean 0,048);
  BASE mad 0,005–0,413 (mean ~0,27) với lỗi thảm hoạ (dự ~0 nơi Chrome đo 61–
  170, và ngược lại).

### 2.3 Dư còn lại của 2-stage (CHƯA phải đáp án cuối)

- Peak lệch **±16 theo pha** (đan dấu, chu kỳ ~2 pha) ở s=0,3819: mô hình cho
  cùng peak cho cặp pha kề (108/108) trong khi Chrome xen kẽ (101/119). Gợi ý
  chặng 2 có thêm hạng bất đối xứng theo pha — chưa xác định.
- V_1D mô hình **phẳng ~0,333** theo s, trong khi đo tăng 0,277→0,496:
  ở s=0,45 mô hình thiếu 30% V_2D; ở s=0,30 thừa 42%.

| s | V_1D đo | V_1D BASE | V_1D 2-stage | V_2D tex đo | V_2D BASE² | V_2D 2-stage² |
|---|---|---|---|---|---|---|
| 0,30 | 0,277 | 0,400 | 0,333 | 0,078 | 0,160 | 0,111 |
| 0,35 | 0,323 | 0,466 | 0,333 | 0,108 | 0,217 | 0,111 |
| 0,3819 | 0,341 | 0,509 | 0,333 | 0,120 | 0,259 | 0,111 |
| 0,40 | 0,363 | 0,531 | 0,333 | 0,128 | 0,282 | 0,111 |
| 0,45 | 0,387 | 0,596 | 0,333 | 0,160 | 0,356 | 0,111 |
| 0,50 | 0,496 | 0,500 | 0,500 | 0,249 | 0,250 | 0,250 |

## 3. Quy luật theo thang: 2-stage chỉ đúng khi s<0,5

Verdict nhiễu headed (preview Chrome thật, `r66t3-compare-report.json`) vs render
resample bằng từng mô hình (script `r67u2-noise-final.mjs`,
`r67u2-verify-module.mjs` — tái tạo đích 1-kernel cũ khớp báo cáo T3 trong
±0,5 std, ±0,7 kurt, ±0,02 corr, đủ tin cậy):

**Đích 2-stage** (render resample bằng `resampleRgb24TwoStage`):

| cửa sổ | mức | std ratio | Δkurt | Δcorr | verdict |
|---|---|---|---|---|---|
| w1440 | noise05 | [1,02, 1,09, 1,04] | [0,03, 0,22, 0,32] | [0,199, 0,009, 0,03] | LỆCH (chỉ Δcorr R-G) |
| w1440 | noise10 | [1,01, 0,98, 1,04] | [0,24, 0,19, 0,33] | [0,118, 0,002, 0,031] | **KHỚP-THỐNG-KÊ** |
| w1920 | noise05 | [1,19, 1,53, 1,20] | [1,56, 0,32, 1,24] | [0,26, 0,073, 0,168] | LỆCH |
| w1920 | noise10 | [1,17, 1,39, 1,18] | [1,52, 0,22, 1,23] | [0,212, 0,075, 0,17] | LỆCH |
| w2560 | noise05 | [1,26, 1,72, 1,25] | [2,17, 0,39, 1,58] | [0,269, 0,108, 0,195] | LỆCH |
| w2560 | noise10 | [1,23, 1,55, 1,23] | [1,92, 0,11, 1,58] | [0,231, 0,108, 0,201] | LỆCH |

**Đích 1-kernel** (T3, đã biết): w1440 0/2; w1920 2/2 KHỚP; w2560 1/2 (noise05 sát nút).

→ **Chrome có vẻ chỉ halve khi s<0,5** (ở s≥0,5 một chặng duy nhất). Ngưỡng chính
xác nằm trong 0,45–0,63, **chưa đo** — cần probe thang 0,45–0,65 (đợt sau).
`chromeResampleRgb24` tạm lấy ngưỡng 0,5 và ghi rõ là xấp xỉ.

Lưu ý sửa sai: bản CUR-2ST đầu (`r67u2-noise-post.mjs`) lấy nhầm plain 2-stage làm
mốc → số đó vô hiệu; bản sửa (`r67u2-noise-post2.mjs`, `r67u2-noise-final.mjs`)
dùng mốc đúng. Mô hình 2-stage tái tạo đúng std nhiễu preview headed
([12,31, 7,87, 16,7] vs đo thật [12,54, 8,61, 17,35] ở w1440 noise05, lệch ≤2%)
— "bất thường" trước đó chỉ do so với đích ffmpeg-bilinear (xem §4).

## 4. Nhiễu sau downscale (POST): THUA cả 2 đích — không triển khai

Thiết kế: thay vì nhiễu ở full-res 1280×720 rồi downscale (đường hiện tại),
áp nhiễu trực tiếp tại viewport sau drawImage. Động cơ: rẻ hơn ở w1440
(~5,5×, §5) và có thể khớp render downscale bằng ffmpeg bilinear.

### 4.1 Hệ số suy giảm A(s) của render (ffmpeg bilinear)

A = std(delta viewport)/std(delta full-res), từng kênh [R,G,B], mean 3 seed:

| cửa sổ | noise05 | noise10 |
|---|---|---|
| w1440 | [0,365, 0,349, 0,404] mean 0,373 | [0,400, 0,368, 0,440] mean 0,402 |
| w1920 | [0,534, 0,516, 0,577] mean 0,543 | [0,567, 0,532, 0,604] mean 0,568 |
| w2560 | [0,610, 0,703, 0,634] mean 0,649 | [0,639, 0,714, 0,657] mean 0,670 |

Render delta: kurt R/B cao (w1440 noise05 render kurt [9,89, −0,08, 4,83]);
lag-1 [0,33, 0,25, 0,33]; corr R-G −0,214 (w1440 noise05).

### 4.2 POST-V1 (addYuvNoise nguyên bản tại viewport, strength×Amean): 0/18 KHỚP

- w1440 noise05: std [1,66, 1,44, 1,55], Δkurt [28,5, 0,4, 28,9].
- w2560 noise10 gần nhất: std [1,03, 0,99, 1,05], Δkurt [0,22, 0,44, 0,36]
  (G 0,44 vượt 0,35 sát nút). Không thắng đường hiện tại (headed 3/6).

### 4.3 Chẩn đoán kurt nổ (tìm ra cơ chế)

- Sanity full-res tái tạo đúng T3: noise05 std [1,02, 1,00, 1,04], Δkurt
  [0,11, 0,29, 0,04] → KHỚP (code thống kê đúng).
- `addYuvNoise` tại viewport w1440 (strength×A): base phẳng-128 → delta kurt
  [0, 0,02, −0,02] (sạch); base testsrc2-viewport → kurt **[40,65, 0,76, 39,75]**
  (R/B nổ, G bình thường). Cơ chế: ước lượng native-chroma theo khối 2×2 trên
  base bão hoà/cạnh sắc → delta đuôi nặng; ở viewport khối 2×2 tương đương
  ~5×5 px nguồn nên hiệu ứng mạnh hơn full-res. (Render full-res cũng có kurt
  R/B cao nhưng preview khớp được ở full-res.)

### 4.4 POST-V2 (YUV từng pixel, base derived KHÔNG ước lượng native, Cb/Cr noise từng pixel, hiệu chuẩn strength 2 bước): 0/18 KHỚP nhưng cải thiện rõ

Đích ffmpeg-bilinear:

- std hầu hết pass: w1440 noise05 [1,13, 0,97, 0,89]; w1920 noise10
  [1,04, 1,04, 0,92]; w2560 noise10 [1,11, 0,89, 1,00]. Chỉ w2560 noise05 R
  1,19 vượt 1,18 sát nút.
- kurt sim [2,4–2,9, ~0, 2,4–2,9] vs render [4,8–9,9, ~0, 3,3–5,1] → Δkurt R
  2,0–7,5 (cần ≤0,35): **FAIL mọi tổ hợp**. B: 0,4–2,6.
- corr: Δcorr R-G 0,23–0,35 ở w1440/w1920 (FAIL ≤0,12); w2560 pass (~0,01).
  Cơ chế: render corr R-G âm (−0,214 ở w1440) vì nhiễu Y (trắng, bị downscale
  triệt mạnh) vs nhiễu Cr khối (triệt ít hơn) — nhiễu POST tại viewport không
  tái tạo được (corr sim ≈ +0,07).
- → POST-V2 sửa được vụ nổ kurt (40→2,7) và std, nhưng vẫn lệch kurt/corr so
  với render. Cần nhiễu Y được làm mượt không gian (tương quan lag-1 ~0,3–0,4
  như render) + đuôi nặng hơn mới khớp — chưa thử (xem §7).

### 4.5 POST-V2 vs đích 2-stage (đích đúng): càng thua

| cửa sổ | mức | std ratio | Δkurt |
|---|---|---|---|
| w1440 | noise05 | [0,61, 0,80, 0,51] | [0,52, 0,47, 0,96] |
| w1440 | noise10 | [0,59, 0,88, 0,54] | [0,78, 0,78, 1,37] |
| w1920 | noise05 | [0,90, 1,16, 0,75] | [0,08, 0,45, 0,80] |
| w1920 | noise10 | [0,85, 1,22, 0,77] | [1,23, 0,61, 1,17] |
| w2560 | noise05 | [1,07, 1,35, 0,89] | [0,03, 0,49, 1,07] |
| w2560 | noise10 | [1,01, 1,41, 0,90] | [1,26, 0,51, 1,45] |

POST hiệu chuẩn theo A_ff (đích ffmpeg-bilinear) nên std chỉ ~0,5–0,6 so với
đích Chrome-filter ở w1440. **POST không thắng ở đích nào.**

### 4.6 Trade-off (trả lời thẳng task §2)

- **Đúng bản chất render không?** Không. Render cộng nhiễu ở full-res rồi mới
  downscale: nhiễu Y trắng bị triệt mạnh, nhiễu chroma khối 2×2 bị triệt ít →
  tạo ra kurt cao + corr R-G âm ở viewport. Nhiễu POST tại viewport (dù hiệu
  chuẩn std đúng) không tái tạo được cấu trúc tương quan này — kurt và corr
  lệch về nguyên tắc, không phải do hiệu chuẩn chưa đủ tốt. POST chỉ "khớp số
  std" với một bộ lọc downscale cụ thể (ffmpeg bilinear) mà preview không dùng.
- **Hiệu năng:** POST rẻ hơn ở w1440 (~5,5×) nhưng **đắt hơn ở w2560**
  (upscale: nhiễu trên 1733×975 đắt hơn full-res 1280×720) — xem §5.
- **Kết luận:** không triển khai POST. Preview hiện tại (nhiễu full-res +
  drawImage Chrome) là phép mô phỏng đúng bản chất nhất có thể trong trình duyệt;
  sai khác còn lại là do bộ lọc Chrome ≠ bộ lọc ffmpeg, không phải do vị trí
  áp nhiễu.

## 5. Hiệu năng (Node, n=5, `addYuvNoise`; tải VM cao lúc đo, chỉ dùng tương đối)

- full-res 1280×720: mean 880,3 ms (594–1320 ms).
- w1440 viewport 489×275: mean 160,2 ms; w1920 809×455: 281,0 ms; w2560
  1733×975: 1288,0 ms.
- → Nhiễu-sau-downscale rẻ hơn ~5,5× ở w1440 nhưng ĐẮT hơn ở w2560 (upscale).
  Số Node, không phải browser; tải VM lúc đo cao (load ~2,66, 4 vCPU).

## 6. Đã triển khai (harness, KHÔNG production)

1. `apps/web/scripts/chrome-resample.mjs`: thêm `resamplePlaneTwoStage` /
   `resampleRgb24TwoStage` / `chromeResampleRgb24` (tự chọn: s<0,5 → 2-stage,
   s≥0,5 → 1-kernel) + `chromeWeights1D`/`resamplePlane` thêm tham số `stretch`
   tuỳ chọn (mặc định không đổi). `resampleRgb24`/`resampleYuv420p` **không đổi
   hành vi** (consumer duy nhất `parity-66t3-compare.mjs` dùng 2 hàm này).
   Header ghi đầy đủ số đo + dư + ngưỡng chưa pin.
2. `apps/web/scripts/chrome-resample-67u2.test.mjs` (mới, `node:test`):
   fixture hàng sweep đo thật (xung p=256 → 101 @ 98; p=272 → 127 @ 104,
   s=0,3828): 2-stage mad 0,036/0,000, peak trong ±18; 2-stage tốt hơn 1-kernel
   >2×; s=0,5 hai mô hình trùng; DC bảo toàn; selector đúng; `resampleRgb24`
   không đổi. **7/7 xanh.**
3. `effectCanvas.ts` / `preview.tsx` / `previewEngine`: **không đổi** (không có
   phép khớp nào tốt hơn cho code production).
4. Kiểm chứng: `node --test apps/web/scripts/chrome-resample-67u2.test.mjs`
   7/7 pass; `npm run build` (tsc + vite build) — xem log luồng.
   Verdict 2-stage bằng implementation thật (`r67u2-verify-module.mjs`) khớp
   bản inline (std giống tới 2 chữ số thập phân).

## 7. Nợ mở / hướng tiếp theo

1. **Ngưỡng halve 0,45–0,63 chưa đo:** probe thang 0,45 / 0,48 / 0,5 / 0,55 /
   0,6 / 0,63 trên hình học vuông để pin quy luật chuyển mô hình của Chrome
   (đợt sau, ưu tiên cao — quyết định ngưỡng `chromeResampleRgb24`).
2. **Dư ±16 theo pha của 2-stage:** chặng 2 có hạng bất đối xứng theo pha chưa
   xác định (chu kỳ ~2 pha); V_1D mô hình phẳng trong khi đo tăng theo s.
   Cần fit kernel chặng 2 có tham số lệch pha / hoặc mô hình 3 chặng ở s thấp.
3. **w1440 noise05 vẫn lệch Δcorr R-G (0,199):** với đích 2-stage, std+kurt đã
   pass; corr R-G là phần dư cuối của nợ T3. Có thể do dư pha §2.3 hoặc do
   nhiễu chroma khối của render — cần đo corr theo pha/kênh chi tiết hơn.
4. **POST-V3 (nếu còn muốn thử):** nhiễu Y làm mượt không gian (blur/box 2×2
   hoặc sinh ở full-res rồi downscale chỉ thành phần Y) + Cb/Cr từng pixel +
   hiệu chuẩn strength. Lưu ý: V3 chỉ có ý nghĩa nếu đích là ffmpeg-bilinear;
   với đích Chrome-filter thì đường hiện tại đã tốt hơn.
5. **GPU thật:** VM này không có GPU; mọi kết luận "độc lập GPU" chỉ đúng trên
   CPU/SwiftShader. Cần đo lại trên máy có GPU thật trước khi kết luận chung.
6. **Perf browser:** số §5 là Node; cần đo `addYuvNoise` trong browser thật
   (preview path) trước khi dùng cho quyết định hiệu năng.
7. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền, chờ user)
   — nợ chung, không thuộc luồng này.

## 8. Files

- `docs/PHASE9_ROUND67_U2_NOISE_CHROME_FILTER_LIMITS.md` (file này)
- `apps/web/scripts/chrome-resample.mjs` (sửa: +2-stage, header)
- `apps/web/scripts/chrome-resample-67u2.test.mjs` (mới)
- Log + probe/fit/noise scripts: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round67-u2/`
  (`r67u2-chrome-filter*.mjs`, `r67u2-filter-fit*.mjs`, `r67u2-noise-post*.mjs`,
  `r67u2-noise-final.mjs`, `r67u2-verify-module.mjs`, `r67u2-crossover.mjs`,
  JSON + log kèm theo), log luồng `hidden_files/round67-u2.md`.
