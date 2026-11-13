# Phase 9 đợt 71, luồng Y8 — Lệch tách được 2D ở s≥0,6: ĐO LẠI BẰNG CODE PRODUCTION + V_1D s=0,30 + Mô hình nhiễu preview noise05 w1440

> **Kết luận chốt (đọc trước):**
> 1. **Lệch 2D CÒN, và rộng hơn W5 báo:** production trilinear tách trục so với
>    điểm 2D đo được cho maxAbs tới **13** (RMSE tới 2,8) trên 50 ô (10 thang ×
>    5 điểm); 14/50 ô có maxAbs ≥ 4. Không chỉ s≥0,6: tệ nhất ở s=0,4492
>    (điểm 260,250: maxAbs 13), s=0,5508 (11), s=0,5996/0,6309 (11). Sạch ở
>    s=0,5 (0) và s=0,3496 (≤1). **Đúng là hạng chéo 2D thật** (không phải
>    artefact của phép dự outer-product): hàng 1D khớp production tới MAD
>    ≤0,005 trong khi điểm 2D lệch tới 13; đối chứng outer-product của
>    production ≤1; làm tròn uint8 chặng giữa ≤1. Đo U2 vs V3 giống hệt nhau
>    (maxAbs diff 0) trên mọi thang trùng — lệch tái lập được, là tính chất
>    thật của kernel 2D Chrome, không phải nhiễu đo.
> 2. **V_1D s=0,30 lệch −0,0090: HẾT — đó là artefact dữ liệu, không phải lỗi
>    production.** U2 chỉ đo 10 pha (p=256..265) vì bảng PERIOD giả định thang
>    danh nghĩa 0,3 = 3/10 có chu kỳ 10, trong khi thang thực 154/512 = 77/256
>    có chu kỳ 256. Đo lại đủ 128 pha (probe B, B154): V_1D = 0,2678, khớp
>    production 0,2679 tới **0,0002** (256 pha: 0,2680). 10 pha chung giữa U2
>    và B154 giống hệt nhau (max|Δq| = 0). Trên cả 18 thang, lệch V_1D lớn
>    nhất còn lại là 0,0047 (s=0,40, cũng do U2 chỉ đo 5 pha).
> 3. **Mô hình nhiễu preview (noise05 w1440) ĐÃ XÂY XONG và KHỚP SỐ ĐO:**
>    mô phỏng thuận toàn bộ pipeline preview (addYuvNoise verbatim + resample
>    trilinear production) tái tạo kurt R preview 2,82–3,11 (đo 2,96; render
>    2,47) và corr R-G 0,038–0,061 (đo 0,053; render −0,147) trên 5 seed, và
>    dự đoán đúng verdict LỆCH ở step-4 (5/5 noise05). Ablation chỉ ra cơ
>    chế: **base est-chroma (S7) là thủ phạm chính** — bỏ nó thì kurt R sụp
>    2,95 → 0,82; bỏ kẹp plane YUV thì không đổi (2,95 → 2,95). **Mô hình dự
>    đoán verdict lật thành KHỚP khi capture full-pixel (có hiệu chỉnh
>    delta0): KHỚP 5/5 cả 2 mức** (noise05 Δkurt R 0,08–0,23; noise10
>    0,22–0,31). Cần capture full-pixel headed thật để xác nhận (chưa có dữ
>    liệu đó).
> 4. **GPU thật VẪN CHƯA ĐO.** VM này không có GPU (không nvidia-smi,
>    không /dev/dri, Chrome dùng SwiftShader). Mọi kết luận chỉ đúng trên
>    CPU/SwiftShader.

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
  **KHÔNG push, KHÔNG release/tag, KHÔNG sửa code production trong luồng
  này.** Mọi số là đo thật trên VM này (Node v24.22.1, VM không GPU;
  không chạy Chrome headed mới — tái dùng dữ liệu đo headed đã có của
  U2/V3/W6 + frame render T3 có sẵn).
- Nợ đóng: đợt 70 §4 mục 12 (lệch tách được 2D s≥0,6 + điểm 2D production
  chưa đo lại; V_1D s=0,30 lệch −0,0090; mô hình nhiễu preview noise05
  w1440 cần đợt riêng; GPU thật chưa đo — mục GPU vẫn mở, xem §6).
- Quy ước kurt trong file này: **excess kurtosis** (m4/m2² − 3), như
  pipeline verdict T3/X6 (ngưỡng KHỚP: std ratio [0,85, 1,18];
  Δkurt ≤ 0,35; Δcorr ≤ 0,12).

## 1. (a) Điểm 2D bằng code production — lệch CÒN, rộng hơn W5 báo

Script: `hidden_files/round71-y8/r71y8-2d-prod.mjs` (import trực tiếp
`resampleRgb24Trilinear` production; ảnh delta 512×512, 1 pixel 255 tại
(px,py); so 5×5 quanh peak đo với `pointsSq` của U2/V3). Log:
`r71y8-2d-prod.log`, JSON `r71y8-2d-prod.json`. Phân tích thêm:
`r71y8-2d-analyze.mjs` (+`.log`).

### 1.1 Bảng tóm tắt: maxAbs PROD-2D vs đo (điểm tệ nhất mỗi thang)

| s (thực) | maxAbs | RMSE | điểm tệ nhất | ghi chú |
|---|---|---|---|---|
| 0,3008 | 4 | 1,00 | 260,250 | |
| 0,3496 | 1 | 0,20 | 256,256 | sạch |
| 0,3828 | 5 | 1,00 | 300,100 | |
| 0,4004 | 3 | 0,69 | 256,256 | |
| 0,4492 | **13** | 2,70 | 260,250 | peak đo 21 vs prod 34 |
| 0,4805 | 3 | 0,60 | 100,400 | |
| 0,5000 | **0** | 0,00 | — | sạch tuyệt đối, mọi điểm |
| 0,5508 | **11** | 2,35 | 260,250 | + 300,100: 10; 100,400: 9 |
| 0,5996 | **11** | 2,76 | 257,257 | đúng số W5 |
| 0,6309 | **11** | 2,62 | 257,257 | + 300,100: 9; 100,400: 7 |

Trên 50 ô (10 thang × 5 điểm): maxAbs ≥ 4 ở **14/50** ô; maxAbs ≤ 1 ở
29/50 ô. W5 chỉ kiểm 2 điểm (256,256)/(257,257) nên bỏ sót các ô tệ ở
(260,250), (300,100), (100,400).

### 1.2 Đây là hạng chéo 2D thật, không phải artefact phương pháp

Ba đối chứng loại trừ mọi bước khác:

1. **Hàng 1D khớp production gần như tuyệt đối.** Tại đúng các điểm/thang
   lệch 2D, hàng 1D production vs sweep đo: MAD **0,000–0,005**, dPeak ≤ 1
   (vd s=0,6/0,63 pt 257,257: MAD 0 / 0,0031). Mô hình 1D đúng; lệch chỉ
   xuất hiện khi đi sang 2D.
2. **Outer-product nội bộ của production ≤ 1.** Dự 2D bằng outer product
   của hàng/cột 1D PRODUCTION rồi so với 2D PRODUCTION trực tiếp: RMSE
   ≤ 0,35, maxAbs ≤ 1 mọi ô — tức làm tròn uint8 chặng giữa (pass X rồi
   pass Y) chỉ gây ≤ 1 mức, không giải thích được lệch 11–13.
3. **Đo lặp lại giống hệt nhau.** U2 (đợt 67) vs V3 (đợt 68) trên 3 thang
   trùng (0,3819/0,45/0,5): điểm 2D (peak, vị trí, toàn bộ nb 5×5) và
   sweep X đều có maxAbs diff = **0**. Lệch tái lập qua 2 phiên headed độc
   lập — là tính chất thật của kernel 2D Chrome, không phải nhiễu đo.

### 1.3 Chữ ký hạng chéo (diff 5×5 chuẩn hoá theo peak đo)

Đa số ô lệch (12/14): peak đo **cao hơn** production 5–8% (+0,05..+0,08),
hàng xóm trục **thấp hơn** 2–5% (−0,02..−0,05), chéo +0,01..+0,02 — kernel
thật "tròn hơn" (tập trung vào tâm + chéo) so với outer product tách được.
Tổng khối lượng 5×5 bảo toàn trong ±3 ở 12/14 ô.

Hai ô ngoại lệ ở điểm (260,250) — đo **phẳng/rộng hơn** production:
- s=0,4492: peak đo 21 vs prod 34 (−62%); tổng 5×5 đo 32 vs prod 46 —
  14 đơn vị khối lượng nằm NGOÀI cửa sổ 5×5 (production gom hết khối
  lượng trong 5×5, tổng toàn ảnh = 46). Đáp ứng đo rộng hơn 5×5 ở ô này.
- s=0,5508: hàng xóm (143,138) đo 20 vs prod 31 (−39%), chéo +0,14.

Tương quan lệch với độ sắc hàng 1D yếu (Pearson(maxAbs, peak1D) = 0,41;
Pearson(maxAbs, số tap) = 0,16): lệch phụ thuộc **pha 2D** (φx, φy kết
hợp), không dự đoán được chỉ từ 1D. Không có quy tắc đơn giản "thang
nào thì lệch" ngoài: s=0,5 sạch tuyệt đối (halve chính xác, không blend);
s=0,3496 sạch; còn lại lệch rải rác theo pha.

### 1.4 Ảnh hưởng thực tế + hướng tiếp theo

- Ảnh hưởng thực tế **hẹp**: chỉ nội dung gần-xung (điểm/góc sắc ở đúng
  pha) mới lệch tới 11–13 mức. Thống kê verdict (std/kurt/corr) do các
  marginal 1D chi phối — mà 1D khớp tới MAD 0,001 — nên lệch 2D này
  không ảnh hưởng verdict nhiễu (§4) và không ảnh hưởng preview ảnh thật
  ở mức đo được bằng các chỉ số hiện tại.
- Chưa có đáp án cho hình dạng kernel 2D thật (họ nào: cone xuyên tâm?
  mip xây bằng kernel 2D không tách được? đường video khác đường ảnh?).
  Cần probe 2D riêng với lưới pha mịn (nhiều điểm (px,py), không chỉ 5
  điểm) mới fit được — để lại đợt sau, không ép số ở đây.
- **Cảnh báo GPU:** kernel 2D đo được là trên SwiftShader/CPU. Skia
  backend GPU thật có thể dùng đường lọc khác — lệch 2D có thể khác trên
  GPU thật (xem §6).

## 2. (b) V_1D s=0,30 lệch −0,0090 — HẾT, là artefact pha của dữ liệu U2

Script: `hidden_files/round71-y8/r71y8-v1d-recheck.mjs` (+`.log`).
V_1D = (mean qua các pha của Σ(row/255)²) / s, như W5/X1.

### 2.1 Kết quả đo lại bằng production trực tiếp

| | V_1D s=0,30 (thực 0,3008) |
|---|---|
| Đo U2 (10 pha) | 0,2769 |
| Đo B154 probe B (128 pha) | **0,2678** |
| PROD trilinear (128 pha) | **0,2679** |
| PROD trilinear (256 pha, toàn bộ chu kỳ) | 0,2680 |
| **Lệch PROD − B154** | **+0,0001..0,0002** |
| Lệch PROD − U2 (cũ) | −0,0090 |

### 2.2 Nguyên nhân gốc: bảng PERIOD của U2 sai chu kỳ

- U2 (`r67u2-chrome-filter2.mjs:131`): `PERIOD = {"0.3": 10, ...}` — giả
  định thang danh nghĩa 0,3 = 3/10 có chu kỳ pha 10, nên chỉ đo 10 pha
  (p=256..265).
- Thang thực là dw/512 = 154/512 = **77/256** (77 và 256 nguyên tố cùng
  nhau) → chu kỳ pha thật là **256**, không phải 10. Mẫu 10 pha đầu
  (mean q = 0,0833) chệch so với mean thật 128 pha (0,0806) đúng 0,0090
  sau khi chia s.
- 10 pha chung giữa U2 và B154 **giống hệt nhau** (max|Δq| = 0,0000;
  MAD hàng = 0,0000; vd p=256: hàng [76:1, 77:79, 78:4] cả 3 nguồn) —
  phép đo tái lập hoàn hảo, chỉ thiếu phủ pha.
- Cùng lỗi ở các thang U2 khác (chu kỳ danh nghĩa vs thực): s=0,35 (20
  pha thay vì 512) lệch +0,0011; s=0,40 (5 pha) lệch −0,0047; s=0,45
  (20 pha) lệch 0,0000 (may mắn); s=0,5 (2 pha, chu kỳ thật đúng 2)
  lệch 0,0000. V3 đã sửa bằng cách đo 128 pha mọi thang nên các thang
  V3/B đều khớp production ≤ 0,0004.

### 2.3 Bảng V_1D đầy đủ (PROD vs đo, 18 thang)

Lệch lớn nhất còn lại: **0,0047 @s=0,40** (U2, 5 pha); mọi thang V3/B
≤ 0,0004. Ngưỡng W5 (≤0,008) giờ **đạt trên mọi thang khi dùng dữ liệu
đủ pha**. Không cần sửa mô hình, không cần sửa code. Đính chính X1 §2:
lệch −0,0090 không phải do "bản half-down" (half-down vẫn đúng — MAD/
madPeak tốt hơn hẳn half-up); half-down vs half-up chỉ là chuyện 1 mức
xám ở halve 127,5, không liên quan tới V_1D ở đây.

## 3. (c) Mô hình nhiễu preview cho noise05 w1440 — ĐÃ XÂY, KHỚP SỐ ĐO, DỰ ĐOÁN ĐƯỢC VERDICT

Script: `hidden_files/round71-y8/r71y8-noise-model.mjs` (+`.log`,
`.json`) và `r71y8-noise-model-delta0.mjs` (+`.log`, `.json`, hiệu chỉnh
delta0 cho verdict full-pixel).

### 3.1 Công thức mô hình (forward, dùng đúng code production)

```
preview_delta = trilinear(addYuvNoise(plain_fullres; σ=strength/√3,
              Gauss Box-Muller mulberry32, base est-chroma kCb=1,04/kCr=1,12,
              kẹp plane YUV [0,255], clamp RGB cuối))
              − trilinear(plain_fullres)
render_delta  = trilinear(fullrgb-noiseXX.raw) − trilinear(fullrgb-plain.raw)
```
`addYuvNoise` port verbatim từ `apps/web/src/lib/effectCanvas.ts`
(mulberry32, gaussianGenerator, rgbToYuv709/yuv709ToRgb, estimateNativeChroma);
resample bằng `resampleRgb24Trilinear` production; lấy mẫu step-4 đúng
pha canvas w1440 (rx≡1, ry≡0, vx0=191) như harness X6. So sánh trên
frame testsrc2 khung 30 (1280×720 → 489×275).

### 3.2 Mô hình khớp số đo (step-4, pha canvas)

| noise05, kurt R (excess) | giá trị |
|---|---|
| Đo preview (snapshot W6) | 2,96 |
| Mô phỏng A, 5 seed (1..5) | 2,87 / 2,87 / 3,11 / 2,82 / 2,86 (mean 2,91) |
| Render | 2,47 |
| Δkurt R mô phỏng − render | 0,35–0,64 (mean 0,44) vs đo 0,49 |

| noise05, các chỉ số khác | mô phỏng (mean 5 seed) | đo | render |
|---|---|---|---|
| corr R-G | +0,051 | +0,053 | −0,147 |
| std ratio [R,G,B] | [1,03, 1,08, 1,04] | [1,00, 1,08, 1,00] | — |
| kurt G / B | 0,16 / 1,81 | 0,21 / 1,91 | 0,49 / 1,66 |

noise10 (đối chứng): kurt R mô phỏng 1,66–1,93 (mean 1,81) vs đo 1,83 vs
render 1,38; Δkurt R 0,28–0,55 (mean 0,43) vs đo 0,45. Mô hình tái tạo
đúng cả 2 mức, cả 3 kênh, trong sai số seed (±0,15 ở kurt R).

**Verdict step-4 mô phỏng vs đo:** noise05 LỆCH 5/5 seed (Δkurt R
0,35–0,64); noise10 LỆCH 4/5 (1 seed KHỚP ở 0,28) — khớp verdict đo
(LỆCH cả 2 mức). Mô hình **dự đoán đúng verdict trong miền đã đo**.

### 3.3 Cơ chế gây lệch kurt — ablation (noise05, step-4 kurt R, mean 3 seed)

| Biến thể | kurt R |
|---|---|
| **A. Full pipeline (est-chroma + kẹp YUV)** | **2,95** (≈ đo 2,96) |
| B. Bỏ giãn est-chroma (base derived trực tiếp) | **0,82** (sụp 2,1) |
| C. Bỏ kẹp plane YUV [0,255] (giữ est + clamp RGB) | **2,95** (không đổi) |
| Render (ffmpeg noise, base native thật) | 2,47 |

Kết luận cơ chế: **base est-chroma (S7, k 1,04/1,12) là thủ phạm chính
gây phình kurtosis preview.** Base giãn đẩy màu ra ngoài gamut RGB nên
clamp RGB cuối (Uint8ClampedArray) chạm thường xuyên hơn → phân phối
delta bị spike ở rail → leptokurtic. Kẹp plane YUV không phải cơ chế
(C ≡ A). Phần dư Δkurt R ≈ 0,44 (step-4) / ≈ 0,15 (full-pixel) là **chênh
hiệu chuẩn giữa base est (kCr=1,12) và base native thật (hồi quy
kCr≈1,09)** — tức là xấp xỉ S7, không phải lỗi bộ lọc. X6 đã chứng minh
trừ delta0 (trường dịch trung bình) không động tới kurt — nhất quán:
delta0 là hiệu ứng bậc 1 (mean/corr), còn phình kurt là hiệu ứng bậc 2
(clamp × base), chỉ lộ khi mô phỏng toàn bộ pipeline.

### 3.4 Dự đoán verdict full-pixel (cần capture thật để xác nhận)

Sau khi trừ delta0 (like-with-like như X6 E7; không trừ thì noise05 vẫn
LỆCH vì Δcorr R-G ≈ 0,20 — hiệu ứng delta0 đã biết):

| | full-pixel + hiệu chỉnh delta0 | step-4 + hiệu chỉnh delta0 |
|---|---|---|
| noise05, 5 seed | **KHỚP 5/5** (Δkurt R 0,08–0,23; Δcorr ≤ 0,05) | LỆCH 4/5 (Δkurt R 0,33–0,66) |
| noise10, 5 seed | **KHỚP 5/5** (Δkurt R 0,22–0,31; Δcorr ≤ 0,05) | LỆCH 4/5 (Δkurt R 0,29–0,56) |

**Dự đoán của mô hình: verdict w1440 lật thành KHỚP khi capture
full-pixel (có hiệu chỉnh delta0).** Đây là dự đoán, chưa phải kết luận
đo được — phía preview full-pixel chưa có dữ liệu (snapshot W6 chỉ có
step-4). Cần một lần capture headed toàn bộ pixel (X6 §10 mục 1) để xác
nhận; nếu capture cho Δkurt R ≈ 0,1–0,3 như dự đoán thì nợ headed-noise
đóng hẳn về bản chất.

Lưu ý: verdict step-4 nhạy seed (noise05: 1/5 seed KHỚP ở Δkurt R
0,33) — tiêu chí Δkurt ≤ 0,35 trên một lần thực hiện nhiễu duy nhất là
mong manh ở w1440; đánh giá bằng nhiều seed hoặc full-pixel mới vững.
`noise05b` trong snapshot **không phải** lần thực hiện thứ hai — thống kê
giống hệt noise05 tới từng số (Δkurt = 0, Δcorr = 0), tức là bản sao
cùng seed/khung, không dùng được để đo phương sai realization (phương
sai seed đo được từ mô phỏng: kurt R step-4 dao động ±0,15).

### 3.5 Giới hạn của mô hình

- Chỉ kiểm chứng trên testsrc2 (nội dung tổng hợp bão hoà) tại w1440.
  Trên nội dung tự nhiên, hồi quy native-vs-derived cho k ≈ 1,00–1,03
  (X6) nên cả delta0 lẫn phình kurt đều nhỏ hơn nhiều — mô hình cần kiểm
  lại trên ocean/slovenska/basgo trước khi khái quát.
- Mô hình dùng frame plain do ffmpeg decode (`fullrgb-plain.raw`) làm
  đầu vào thay cho frame browser decode — sai khác chuyển đổi ±1 mức
  không ảnh hưởng thống kê (đã kiểm bằng việc tái tạo đúng số đo tới
  ±0,15).
- Mô hình không thay code production: không cần sửa `addYuvNoise` (base
  est là có chủ đích từ S7, đang giữ khớp full-res; hạ kCr 1,12 → 1,09
  có thể giảm Δkurt R nhưng sẽ phá khớp thống kê full-res — KHÔNG đổi
  khi chưa có đợt quyết riêng).

## 4. Kiểm chứng độc lập

| Kiểm tra | Kết quả |
|---|---|
| `node --test chrome-resample-67u2.test.mjs` (production) | **8/8 pass** (code production nguyên vẹn) |
| 2D PROD vs đo: tái lập số W5 tại (257,257) s=0,6/0,63 | RMSE 2,76/2,62, maxAbs 11/11 — khớp đúng W5 |
| U2 vs V3 (thang trùng): điểm 2D + sweep | maxAbs diff **0** (tái lập hoàn hảo) |
| V_1D PROD vs B154 (128 pha) | lệch 0,0002; vs 256 pha: 0,0001 |
| Render delta stats tái lập X6 | step-4 kurt R [2,47, 0,49, 1,66], full [2,93, 0,39, 1,71] — khớp đúng số |
| Mô phỏng A vs đo preview (5 seed) | kurt R 2,82–3,11 vs đo 2,96; corr R-G 0,038–0,061 vs đo 0,053 |
| Hiệu chỉnh delta0 trên mô phỏng (step-4) | Δcorr R-G → 0,008–0,031 (X6 trên dữ liệu đo: 0,014) — cùng cơ chế |
| Ablation B/C | B: kurt R 2,95 → 0,82; C: 2,95 → 2,95 |

## 5. Đã làm / không làm

1. **ĐÃ** đo lại điểm 2D bằng code production trên cả 50 ô (10 thang × 5
   điểm) + phân tích chữ ký hạng chéo + kiểm tái lập U2/V3.
2. **ĐÃ** đo lại V_1D s=0,30 bằng production (128 + 256 pha) + đối chiếu
   U2/B154 từng pha — tìm ra nguyên nhân là bảng PERIOD của U2.
3. **ĐÃ** xây mô hình nhiễu preview (forward simulation verbatim
   addYuvNoise + trilinear production), 5 seed × 2 mức, + 2 ablation +
   verdict full-pixel sau hiệu chỉnh delta0.
4. **KHÔNG** sửa code production (không có sửa nào được chứng minh là
   đúng: kernel 2D thật chưa biết dạng; kCr est không đổi khi chưa có
   đợt quyết riêng).
5. **KHÔNG** chạy headed mới / đo GPU (xem §6). **KHÔNG** push/tag/binary.

## 6. Nợ mở / hướng tiếp theo

1. **Kernel 2D thật của Chrome chưa biết dạng.** Cần probe 2D lưới pha
   mịn (nhiều điểm (px,py) hơn 5 điểm hiện có, nhiều thang) để fit hạng
   chéo — có thể là thành phần xuyên tâm (cone) cộng thêm vào outer
   product, hoặc mip xây bằng kernel 2D không tách được. Hiện chỉ biết
   chữ ký (peak +5–8%, trục −2–5%, chéo +1–2%) và 2 ô ngoại lệ phẳng/rộng
   ở (260,250).
2. **Capture full-pixel headed (w1440, noise05/noise10)** để xác nhận dự
   đoán §3.4 (verdict lật KHỚP). Đây là phép đo duy nhất còn thiếu để
   đóng hẳn nợ headed-noise.
3. **Kiểm mô hình nhiễu trên nội dung tự nhiên** (ocean/slovenska/basgo):
   k est ≈ 1,00–1,03, delta0 + phình kurt dự kiến nhỏ hơn nhiều — cần
   đo để biết verdict có còn LỆCH ở đó không.
4. **GPU thật (macOS/Windows/Linux có GPU, VideoToolbox/NVENC path) vẫn
   chưa đo — VM này không có GPU** (không `nvidia-smi`, không `/dev/dri`,
   không thiết bị VGA/3D trong `lspci`; Chrome WebGL renderer là
   SwiftShader phần mềm — U2 đã đo impulse giống hệt giữa cờ default và
   SwiftShader, nhưng đó không phải GPU thật). Mọi kết luận trong file
   này chỉ đúng trên CPU/SwiftShader; đặc biệt lệch 2D (§1) có thể khác
   trên backend GPU của Skia.
5. **V_1D s=0,40 lệch −0,0047** (U2, 5 pha) — cùng nguyên nhân PERIOD,
   trong ngưỡng nên không cần đo lại, nhưng nếu đợt sau đo lại thang này
   đủ pha thì lệch dự kiến về ~0,000x.
6. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền,
   chờ user) — nợ chung.

## 7. Files

- LIMITS này: `docs/PHASE9_ROUND71_Y8_2D_SEPARABLE_LIMITS.md`
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round71-y8.md`
- Probe + fit + JSON (goal hidden_files, không stage lên GitHub):
  `hidden_files/round71-y8/` — `r71y8-2d-prod.mjs` (+`.log`, `.json`),
  `r71y8-2d-analyze.mjs` (+`.log`), `r71y8-v1d-recheck.mjs` (+`.log`),
  `r71y8-noise-model.mjs` (+`.log`, `.json`),
  `r71y8-noise-model-delta0.mjs` (+`.log`, `.json`).
- Batch stage (KHÔNG push):
  `~/workspace/repo-1-push/paths-loop/phase9-round71-y8-2d-separable.txt`
  — 1 entry (LIMITS này); không sửa code sản phẩm trong đợt này.
