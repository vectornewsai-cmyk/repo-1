# Phase 9 đợt 72, luồng Z9 — Mô hình resample phụ thuộc thang + w2560 full-pixel: ĐÃ ĐO XONG

> **Kết luận chốt (đọc trước):**
> 1. **KHÔNG có mô hình resample phụ thuộc thang.** Trên lưới thang dày
>    43 thang vuông 512→dw (s = 0,30–0,85, gộp Y7 + Z9, Chrome 158
>    headed): bias LOD tối ưu từng thang = **−0,504…−0,498, trung bình
>    −0,5002** (33 thang xác định được; 32/33 khoảng bất định chứa −0,5,
>    thang còn lại lệch đúng 1 bước lưới 0,002). Hồi quy bias(s):
>    **slope = 0,0023 ± 0,0014 (1,6σ, không khác 0)**, intercept −0,5015,
>    residStd 0,0011. Quét bias pooled cực tiểu sắc tại −0,5 ở MỌI vùng
>    thang (toàn cục 0,0011; vùng 0,38: 0,0020; vùng 0,63–0,67: 0,0010).
>    **Trilinear bias −0,5 thắng 1-kernel và 2-stage ở mọi thang xác định
>    được** (pooled MAD 0,0011 vs 1K 0,1208 vs 2ST 0,2582) — kể cả đúng
>    hai vùng nợ gốc: s≈0,38 (TRI 0,0015 vs 2ST 0,0453 ở dw=195) và
>    s≈0,63–0,67 (TRI ~0,001 vs 1K 0,027–0,078). **ĐỀ XUẤT: KHÔNG đổi
>    production** — `chromeResampleRgb24` (trilinear −0,5) đã đúng; không
>    có bằng chứng nào cho bias theo thang.
> 2. **w2560 full-pixel: ĐÃ XÁC NHẬN — verdict vẫn LỆCH ở cả 2 mức, KHÔNG
>    lật thành KHỚP như dự đoán Y8 cho w1440.** Capture headed toàn bộ
>    pixel rect 1733×975 (upscale 1,354×), test-pattern, plain/noise05/
>    noise10, 3/3 pass, 0 lỗi trang. Sau hiệu chỉnh delta0:
>    noise05 Δkurt = [0,38, 0,05, 0,25] (R vượt ngưỡng 0,35),
>    noise10 Δkurt = [0,43, 0,03, 0,32]; Δcorr và std ratio đều đạt.
>    Lệch còn lại duy nhất là **Δkurt R**, và nó KHÔNG phải lỗi bộ lọc
>    resample (ở upscale, trilinear ≡ 1-kernel từng số; 1D đã khớp tới
>    MAD 0,001) — nó nằm ở đường nhiễu (xem §4).
> 3. **Mô hình nhiễu Y8 ĐÚNG CƠ CHẾ nhưng ĐÁNH GIÁ THẤP Δkurt R ở
>    w2560 — verdict đo LỆCH, sim KHỚP.** Sim forward verbatim
>    (addYuvNoise + trilinear production) tại 1733×975: noise05 Δkurt R
>    sim 0,13–0,23 (5 seed, KHỚP 5/5) vs đo 0,38; noise10 sim 0,27–0,34
>    vs đo 0,43. Ablation xác nhận lại cơ chế Y8 §3.3: bỏ giãn
>    est-chroma thì kurt R sụp 4,86 → 2,09; bỏ kẹp plane YUV không đổi
>    (4,86). Phần dư ~0,1–0,25 Δkurt R chưa giải thích được — không phải
>    lỗi resample (1D khớp MAD 0,001; trilinear ≡ 1-kernel ở upscale),
>    giả thuyết khả dĩ nhất là sai khác decode browser-vs-ffmpeg ở frame
>    gốc (cần capture 1:1 để kiểm — nợ đợt sau).
> 4. **KHÔNG sửa code production trong luồng này** (không có sửa nào được
>    chứng minh là đúng). Chỉ thêm LIMITS này + 4 script probe/phân tích
>    + log. KHÔNG push/tag/binary.

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
  **KHÔNG push, KHÔNG release/tag.** Mọi số là đo thật trên VM này
  (Chrome 158.0.0.0 headed qua Xvfb, `--disable-gpu`, Node v24.22.1,
  VM không GPU; loadavg 9–18 lúc đo do các luồng đợt 72 khác chạy song
  song — phép đo pixel là xác định, không phụ thuộc tải: lặp lại dw=195
  byte-identical).
- Nợ đóng: đợt 71 §5 mục 10 (mô hình resample phụ thuộc thang + w2560
  full-pixel). Đính chính nợ gốc: claim "2-stage tốt hơn ở s=0,38,
  1-kernel tốt hơn ở s=0,63–0,67" là **so sánh giữa hai mô hình sai**
  của V3 (2-stage vs 1-kernel) — dưới mô hình trilinear đúng, trilinear
  thắng cả hai ở cả hai vùng, với biên lớn (20–50×).

## 1. Probe thang dày: phương pháp

Script probe: `apps/web/scripts/r72z9-chrome-dense.mjs` (kế thừa nguyên
vẹn phương pháp Y7: sweep vuông 512→dw, 128 pha X + 128 pha Y, texture
trắng 3 seed, điểm 2D (256,256), phẳng 128 → DC; chunk 3 thang/eval,
ghi JSON tăng dần). Lưới mới 28 thang (Y7 đã đo 15 thang khác — fit
gộp sau, không đo lại):
- Dày quanh s≈0,38: dw 188/192/195/196/197/200/203/206/210
  (s = 0,3672–0,4102; dw=195 → s=0,3809, dw=196 → s=0,3828 ≈ thang
  preview w1440 thật 489/1280 = 0,3820).
- Dày quanh s≈0,63–0,67: dw 318/322/326/330/334/338/342/346
  (s = 0,6211–0,6758).
- Thưa ở biên: dw 154/170/180 (s = 0,30–0,35), 220/270/295/312,
  375/395/415/435 (s = 0,73–0,85).
- Display :150–159, cổng debug 9610–9619 (tránh đụng luồng đợt 72
  khác); determinism: lặp lại dw=195 cuối phiên → **IDENTICAL
  (byte-identical)**. Probe xong trong ~127 s, 28/28 thang.
- Dữ liệu: `hidden_files/round72-z9/r72z9-dense-A.json` (4,2 MB) +
  log `r72z9-chrome-A-stdout.log`.

Fit: `apps/web/scripts/r72z9-fit-dense.mjs` — mô hình bias TỔNG QUÁT
(khác Y7 ở chỗ Y7 giả định L=0 mọi thang; thang thấp dw=154 có
λ=1,733 nên L=1 ngay tại bias −0,5). Quét trực tiếp bias b trên lưới
0,002 trong [−0,80, −0,20]: λ* = max(0, λ+b), L = floor(λ*),
f = frac(λ*), blend giữa mip L và mip L+1 (halve L lần + triangle h=1,
làm tròn nửa-xuống đúng production). Cache mip0/mip1/mip2 theo pha.
**Kiểm nội bộ: blend(bias −0,5) tái tạo đúng từng số
`trilinearRow1D` production — max diff = 0 trên cả 43 thang × 256
pha.** Khoảng bất định bias: mọi b có MAD ≤ best+0,0005.

## 2. Kết quả: bias LOD theo thang — HẰNG SỐ −0,5, không phụ thuộc thang

### 2.1 Bảng bias tối ưu theo thang (33 thang xác định được)

| dw | s thực | λ | TRI MAD | 1K MAD | 2ST MAD | bias\* | khoảng bias | L\* | f\* |
|---|---|---|---|---|---|---|---|---|---|
| 154 | 0,3008 | 1,733 | 0,0015 | 0,2869 | 0,0993 | −0,502 | [−0,504, −0,498] | 1 | 0,231 |
| 170 | 0,3320 | 1,591 | 0,0017 | 0,2898 | 0,0413 | −0,500 | [−0,502, −0,496] | 1 | 0,091 |
| 180 | 0,3516 | 1,508 | 0,0021 | 0,2894 | 0,0059 | −0,500 | [−0,510, −0,498] | 1 | 0,008 |
| 188 | 0,3672 | 1,445 | 0,0022 | 0,2806 | 0,0231 | −0,498 | [−0,500, −0,496] | 0 | 0,947 |
| 192 | 0,3750 | 1,415 | 0,0026 | 0,2826 | 0,0391 | −0,504 | [−0,504, −0,502] | 0 | 0,911 |
| 195 | 0,3809 | 1,393 | 0,0015 | 0,2727 | 0,0453 | −0,500 | [−0,504, −0,498] | 0 | 0,893 |
| 196 | 0,3828 | 1,385 | 0,0026 | 0,2709 | 0,0481 | −0,502 | [−0,504, −0,496] | 0 | 0,883 |
| 197 | 0,3848 | 1,378 | 0,0018 | 0,2691 | 0,0505 | −0,502 | [−0,502, −0,496] | 0 | 0,876 |
| 200 | 0,3906 | 1,356 | 0,0014 | 0,2666 | 0,0602 | −0,500 | [−0,502, −0,498] | 0 | 0,856 |
| 203 | 0,3965 | 1,335 | 0,0021 | 0,2626 | 0,0698 | −0,502 | [−0,502, −0,498] | 0 | 0,833 |
| 206 | 0,4023 | 1,313 | 0,0022 | 0,2607 | 0,0763 | −0,498 | [−0,500, −0,494] | 0 | 0,815 |
| 210 | 0,4102 | 1,286 | 0,0013 | 0,2548 | 0,0895 | −0,500 | [−0,502, −0,498] | 0 | 0,786 |
| 220 | 0,4297 | 1,219 | 0,0009 | 0,2435 | 0,1169 | −0,500 | [−0,502, −0,498] | 0 | 0,719 |
| 230 | 0,4492 | 1,155 | 0,0014 | 0,2326 | 0,1438 | −0,500 | [−0,504, −0,498] | 0 | 0,655 |
| 246 | 0,4805 | 1,057 | 0,0012 | 0,2161 | 0,1841 | −0,500 | [−0,502, −0,498] | 0 | 0,557 |
| 270 | 0,5273 | 0,923 | 0,0011 | 0,1754 | 0,2395 | −0,500 | [−0,502, −0,498] | 0 | 0,423 |
| 282 | 0,5508 | 0,860 | 0,0007 | 0,1495 | 0,2657 | −0,500 | [−0,502, −0,498] | 0 | 0,360 |
| 295 | 0,5762 | 0,795 | 0,0011 | 0,1216 | 0,2907 | −0,500 | [−0,502, −0,498] | 0 | 0,295 |
| 307 | 0,5996 | 0,738 | 0,0012 | 0,0947 | 0,3040 | −0,500 | [−0,502, −0,498] | 0 | 0,238 |
| 312 | 0,6094 | 0,715 | 0,0009 | 0,0885 | 0,3266 | −0,500 | [−0,504, −0,498] | 0 | 0,215 |
| 318 | 0,6211 | 0,687 | 0,0012 | 0,0777 | 0,3376 | −0,500 | [−0,502, −0,498] | 0 | 0,187 |
| 322 | 0,6289 | 0,669 | 0,0012 | 0,0699 | 0,3453 | −0,500 | [−0,502, −0,498] | 0 | 0,169 |
| 323 | 0,6309 | 0,665 | 0,0009 | 0,0680 | 0,3451 | −0,500 | [−0,502, −0,498] | 0 | 0,165 |
| 326 | 0,6367 | 0,651 | 0,0009 | 0,0627 | 0,3526 | −0,500 | [−0,502, −0,498] | 0 | 0,151 |
| 330 | 0,6445 | 0,634 | 0,0010 | 0,0553 | 0,3598 | −0,500 | [−0,502, −0,498] | 0 | 0,134 |
| 333 | 0,6504 | 0,621 | 0,0010 | 0,0502 | 0,3670 | −0,500 | [−0,502, −0,498] | 0 | 0,121 |
| 334 | 0,6523 | 0,616 | 0,0008 | 0,0481 | 0,3671 | −0,500 | [−0,502, −0,498] | 0 | 0,116 |
| 338 | 0,6602 | 0,599 | 0,0009 | 0,0409 | 0,3741 | −0,500 | [−0,502, −0,498] | 0 | 0,099 |
| 342 | 0,6680 | 0,582 | 0,0009 | 0,0342 | 0,3813 | −0,500 | [−0,502, −0,498] | 0 | 0,082 |
| 346 | 0,6758 | 0,565 | 0,0009 | 0,0272 | 0,3882 | −0,500 | [−0,502, −0,498] | 0 | 0,065 |
| 348 | 0,6797 | 0,557 | 0,0010 | 0,0235 | 0,3918 | −0,500 | [−0,502, −0,498] | 0 | 0,057 |
| 353 | 0,6895 | 0,536 | 0,0010 | 0,0151 | 0,4017 | −0,500 | [−0,502, −0,500] | 0 | 0,036 |
| 358 | 0,6992 | 0,516 | 0,0010 | 0,0063 | 0,4091 | −0,500 | [−0,502, −0,500] | 0 | 0,016 |

- **Bias\* ∈ [−0,504, −0,498], trung bình −0,5002; 32/33 khoảng bất
  định chứa −0,5.** Thang duy nhất không chứa: dw=192, khoảng
  [−0,504, −0,502] — lệch đúng 1 bước lưới (0,002), dưới độ phân giải
  có ý nghĩa; không phải bằng chứng cho bias khác −0,5.
- **Trilinear thắng ở mọi thang xác định được**: TRI MAD 0,0007–0,0026;
  1K tệ hơn 20–190× (0,0063–0,29), 2ST tệ hơn 3–400× (0,0059–0,44).
  Hai vùng nợ gốc được đo dày và kết luận rõ:
  - s≈0,38 (9 thang dw 188–210): TRI 0,0013–0,0026 vs 2ST 0,0231–
    0,0895 (2ST tệ 10–60×) vs 1K 0,25–0,28. Claim V3 "2-stage tốt hơn
    ở s=0,38" chỉ đúng khi so 2-stage với 1-kernel (cả hai đều sai);
    trilinear thắng 2-stage với biên lớn.
  - s≈0,63–0,67 (10 thang dw 318–346): TRI 0,0008–0,0012 vs 1K
    0,0272–0,0777 (1K tệ 30–65×) vs 2ST 0,34–0,39. Claim V3 "1-kernel
    tốt hơn ở s=0,63–0,67" cũng chỉ đúng trong cặp mô hình cũ.
- **Hồi quy bias(s) trên 33 thang xác định được: slope = 0,0023 ±
  0,0014 (SE), tức 1,6σ — KHÔNG khác 0 có ý nghĩa; intercept −0,5015;
  residStd 0,0011 (≈ độ phân giải lưới).** Không có xu hướng bias theo
  thang. Bias hằng số −0,500 ± 0,002 (bảo thủ, theo dải bias\* và bề
  rộng khoảng bất định).

### 2.2 Thang không xác định được bias (10 thang) — phù hợp mô hình, không phải thiếu dữ liệu

- s = 0,5 (dw=256): mip0 ≡ mip1 đúng từng số (triangle h=1 thang 0,5 =
  trung bình 2 px = halve) nên bias không xác định được — như Y7 đã
  ghi. TRI MAD 0,0000.
- s ≥ 0,7071 (9 thang dw 362–435): mọi bias ≤ −λ đều cho λ* = 0 (thuần
  triangle h=1, không blend) nên chỉ có **cận trên**: bias ≤ −0,498
  (s=0,7070), ≤ −0,490 (0,7109), ≤ −0,470 (0,7207), ≤ −0,446 (0,7324),
  ≤ −0,412 (0,75), ≤ −0,372 (0,7715), ≤ −0,318 (0,8008), ≤ −0,300
  (0,8105), ≤ −0,232 (0,8496) — tất cả thỏa với −0,5. TRI ≡ 1K ở đây
  (MAD 0,0000 cả hai, trừ s=0,75 — xem §2.4); 2ST tệ 0,41–0,44.
- Ngoại lệ duy nhất 1K "thắng" TRI: dw=384 (s=0,75), 1K MAD 0,0013 vs
  TRI 0,0026 — đây là **dư ±1 mức do chính xác float đã biết của Y7
  §4** (256/98304 pixel lệch đúng 1 mức, Skia tích lũy khác float64),
  không phải mô hình sai: V_1D exact tại s=0,75 lệch −0,0044, thang
  duy nhất vượt 0,001 (xem §2.3). Không đổi mô hình vì dư này.

### 2.3 Quét bias pooled — cực tiểu sắc tại −0,5 ở mọi vùng

| bias | −0,25 | −0,4 | −0,45 | −0,48 | **−0,5** | −0,52 | −0,55 | −0,6 | −0,75 |
|---|---|---|---|---|---|---|---|---|---|
| toàn cục (43 thang) | 0,0887 | 0,0349 | 0,0172 | 0,0070 | **0,0011** | 0,0064 | 0,0155 | 0,0294 | 0,0607 |
| s<0,5 (15 thang) | 0,0930 | 0,0409 | 0,0211 | 0,0088 | **0,0018** | 0,0084 | 0,0207 | 0,0412 | 0,1022 |
| 0,5≤s<0,7071 (20 thang) | 0,0984 | 0,0395 | 0,0198 | 0,0080 | **0,0009** | 0,0073 | 0,0176 | 0,0321 | 0,0536 |
| vùng 0,38 (9 thang) | 0,0860 | 0,0403 | 0,0211 | 0,0088 | **0,0020** | 0,0087 | 0,0209 | 0,0419 | 0,1041 |
| vùng 0,63–0,67 (10 thang) | 0,1038 | 0,0416 | 0,0207 | 0,0084 | **0,0010** | 0,0083 | 0,0208 | 0,0393 | 0,0534 |
| s≥0,7071 (8 thang) | 0,0564 | 0,0122 | 0,0037 | 0,0010 | **0,0004** | 0,0004 | 0,0004 | 0,0004 | 0,0004 |

Pooled MAD theo mô hình: toàn cục TRI **0,0011** vs 1K 0,1208 vs 2ST
0,2582; vùng 0,38: TRI 0,0020 vs 1K 0,2689 vs 2ST 0,0558; vùng
0,63–0,67: TRI 0,0010 vs 1K 0,0534 vs 2ST 0,3618. Vùng s≥0,7071 phẳng
0,0004 với mọi bias ≤ −0,5 (đúng như lý thuyết: λ* = 0).

### 2.4 V_1D exact từ sweep + điểm 2D

- V_1D exact (mean qua 256 pha của Σ(row/255)² / s): đo vs trilinear
  production lệch ≤ 0,0007 trên 42/43 thang; ngoại lệ duy nhất s=0,75
  (−0,0044, cùng gốc dư float §2.2). Vd vùng 0,38: đo 0,3387 vs TRI
  0,3388 (dw=195); vùng 0,63–0,67: 0,5626 vs 0,5621 (dw=318) tới
  0,6282 vs 0,6281 (dw=346).
- Điểm 2D (xung tại 256,256): vị trí peak production **đúng 43/43**;
  dPeak TRI ∈ [−4, 0] (tệ nhất −4 ở dw=295; vùng 0,38: −1…−3; vùng
  0,63–0,67: −1…−3) — vẫn là hạng chéo 2D đã biết của Y8 (peak đo cao
  hơn production vài %), không phải lỗi 1D. 1K dPeak tới +43/−26, 2ST
  tới −154.
- DC phẳng 128 → **đúng 128 (min=max=128)** cả 43 thang.

### 2.5 Đề xuất: KHÔNG đổi production

- Không có bằng chứng nào cho bias theo thang: slope hồi quy không
  khác 0, bias\* dao động trong ±0,004 quanh −0,5 (tại độ phân giải
  lưới 0,002), pooled minimum sắc tại −0,5 ở mọi vùng. Đổi production
  sang bias theo thang (vd bảng tra theo thang) sẽ chỉ fit nhiễu lưới
  và phá tính đơn giản/đúng đắn của mô hình hiện tại.
- `chromeResampleRgb24` (trilinear LOD-bias −0,5, X1 đợt 70) đã đúng
  trên toàn bộ dải s = 0,30–0,85. Không có hằng số nào cần đổi.
- Lưu ý: kết luận chỉ đúng trên hình học vuông 512×512, CPU/
  SwiftShader (Chrome 158 headed, `--disable-gpu`). Hình học dẹt
  (T3) và GPU thật vẫn là nợ riêng (xem §6).

## 3. w2560 full-pixel: verdict vẫn LỆCH (đã xác nhận)

Capture: `apps/web/scripts/r71y2-headed-capture.mjs` (harness Y2, dùng
lại nguyên vẹn) với `R71Y2_WIN_W=2560 R71Y2_WIN_H=1600
R71Y2_SOURCES=test-pattern R71Y2_SCRATCH=…/round72-z9/headed-w2560
R71Y2_DEV_PORT=5580 R71Y2_DEBUG_PORT=9690`. Chạy xong trong 57 s:
**3/3 pass, 0 lỗi trang** (D1 plain 2 lần pixel-identical, D2 noise05
2 lần pixel-identical, H9 0 lỗi trang). Rect video **1733×975 @
(129,0), scale 1,3542 (upscale)**; mean plain 126,36 / noise05 126,63
/ noise10 126,75. Snapshot: `headed-w2560/r71y2-snaps-w2560.json`
(33,8 MB, full-pixel RGB24 toàn rect).

Phân tích: `apps/web/scripts/r72z9-analyze-w2560.mjs` (copy
r71y2-analyze.mjs, chỉ đổi đường dẫn sang round72-z9 + cửa sổ w2560;
delta0 + ngưỡng verdict verbatim X6/T3: std ratio [0,85, 1,18],
|Δkurt| ≤ 0,35, |Δcorr| ≤ 0,12). Kết quả (`r72z9-analysis-w2560.json`):

| | noise05 | noise10 |
|---|---|---|
| Sau delta0 — Δkurt [R,G,B] | **[0,38, 0,05, 0,25]** | **[0,43, 0,03, 0,32]** |
| Sau delta0 — Δcorr | [0,011, 0,007, 0,024] ✓ | [0,024, 0,005, 0,017] ✓ |
| Sau delta0 — std ratio | [1,03, 1,00, 1,05] ✓ | [1,03, 1,01, 1,05] ✓ |
| **Verdict sau delta0** | **LỆCH** (chỉ Δkurt R) | **LỆCH** (chỉ Δkurt R) |
| Trước delta0 — Δkurt | [0,35, 0,37, 0,24] | [0,42, 0,23, 0,31] |
| Trước delta0 — Δcorr | [0,095, 0,007, 0,015] | [0,061, 0,005, 0,021] |
| Δkurt R theo pha step-4 | 0,23–0,37 | 0,30–0,42 |

- **Dự đoán Y8 §3.4 KHÔNG đúng cho w2560**: Y8 dự đoán verdict lật
  KHỚP khi capture full-pixel + delta0 (dự đoán đó xây cho w1440
  downscale; ở đó delta0 sửa được Δcorr và downscale trung bình hoá
  làm kurt hạ). Ở w2560 (upscale), delta0 sửa được Δkurt G (0,37 →
  0,05 ở noise05) và Δcorr, nhưng **Δkurt R còn 0,38/0,43 — vẫn vượt
  ngưỡng 0,35**. Verdict cũ ở w2560 (R63: noise05 Δkurt G 0,39 sát nút
  theo step-4) nay được giải thích lại: G là artefact delta0/step-4;
  vấn đề thật còn lại là **kurt R**.
- Trilinear vs 1-kernel: **giống hệt nhau** ở w2560 (upscale λ* = 0,
  triangle thuần — Δkurt/Δcorr/std giống từng số). Lệch này KHÔNG phải
  lỗi bộ lọc resample.
- Plain absMAD trilinear = 1,029, le8 = 99,11% — đúng sàn sai khác
  decode Chrome-vs-ffmpeg đã biết (R66: 1,04–1,23). delta0 std RGB
  viewport = [1,14, 4,43, 0,67] (kênh G mang dịch est-chroma lớn).
- Nhạy pha: Δkurt R step-4 dao động 0,23–0,37 (noise05) qua 4 pha —
  verdict step-4 cũ mong manh; full-pixel mới là kết luận chắc:
  **LỆCH thật, nhưng sát nút** (0,38/0,43 so với ngưỡng 0,35).

## 4. Mô hình nhiễu Y8 ở w2560: đúng cơ chế, nhưng đánh giá thấp Δkurt R

Script: `apps/web/scripts/r72z9-noise-model-w2560.mjs` (copy Y8, đổi
viewport sang 1733×975, delta0 kiểu analyze — est-shift tính ở
full-res rồi resample; 5 seed × 2 mức + 2 ablation). Chạy xong trong
125 s. Kết quả (`r72z9-noise-model-w2560.json`):

### 4.1 Sim vs đo (full-pixel + delta0, test-pattern frame 30)

| | render kurt R | sim kurt R (5 seed) | đo kurt R | Δkurt R sim | Δkurt R đo | verdict sim | verdict đo |
|---|---|---|---|---|---|---|---|
| noise05 | 4,67 | 4,80–4,90 (mean 4,86) | 5,05 | 0,13–0,23 | **0,38** | KHỚP 5/5 | **LỆCH** |
| noise10 | 3,09 | 3,36–3,43 (mean 3,40) | 3,52 | 0,27–0,34 | **0,43** | KHỚP 5/5 | **LỆCH** |

- Sim tái tạo đúng std ratio ([1,03, 1,01, 1,06] sim vs [1,03, 1,00,
  1,05] đo, noise05) và Δcorr (≤ 0,022 sim vs ≤ 0,024 đo) — chỉ kurt R
  là lệch.
- **Gap có hệ thống, không phải phương sai seed**: đo vượt sim tối đa
  0,15–0,25 (noise05) / 0,09–0,16 (noise10) về Δkurt R, cả 2 mức cùng
  chiều; spread giữa 5 seed sim chỉ 0,10 (noise05) / 0,07 (noise10).
  Seed may mắn không giải thích được.
- Lưu ý số render: kurt R render ở w2560 là 4,67/3,09 — KHÁC số w1440
  của Y8 (2,93/1,64) vì viewport khác (upscale 1,354× vs downscale
  0,382×). (Lần chạy mô hình v1 đã in nhầm số w1440 do lỗi VW/VH —
  xem §5 mục 5; đã chạy lại đúng.)

### 4.2 Ablation: cơ chế Y8 §3.3 vẫn đúng ở upscale

noise05, kurt R full-pixel + delta0, trung bình 3 seed:

| Biến thể | kurt R |
|---|---|
| **A. Full pipeline (est-chroma + kẹp YUV)** | **4,86** (≈ đo 5,05; render 4,67) |
| B. Bỏ giãn est-chroma (base derived trực tiếp) | **2,09** (sụp 2,77) |
| C. Bỏ kẹp plane YUV [0,255] (giữ est + clamp RGB) | **4,86** (không đổi) |

Kết luận cơ chế: **base est-chroma vẫn là thủ phạm chính gây phình
kurtosis preview ở cả upscale** (như Y8 đã chứng minh ở w1440).
Kẹp plane YUV không phải cơ chế (C ≡ A). Phần dư đo-vs-sim (+0,19
kurt R tuyệt đối ở noise05) là **ngoài** cơ chế này — mô hình đã bao
đúng cơ chế mà vẫn thiếu ~0,2 kurt R.

### 4.3 Chẩn đoán delta0-browser: giả thuyết decode chưa chứng minh được

Script: `apps/web/scripts/r72z9-delta0-browser.mjs`. Thử tính est-shift
trực tiếp trên snapshot plain của browser ở 1733×975 rồi trừ khỏi delta
preview đo được:
- d0_browser vs d0_ffmpeg(viewport): MAD 0,546, maxAbs 45 — hai trường
  est-shift khác nhau đáng kể; nhưng d0_browser vs d0_ffmpeg-full
  (cách analyze: est-shift ở full-res rồi resample): MAD 1,158,
  maxAbs 204 — khác hẳn.
- Verdict khi trừ d0_browser / d0_ffmpeg(viewport): noise05 Δkurt R
  **2,03 / 2,18** (tệ hơn nhiều so với 0,38 của cách analyze);
  noise10: 0,32/0,34 (KHỚP, nhưng là may mắn sau khi phá noise05).
- **Kết luận phương pháp: est-shift PHẢI tính ở full-res (nơi nhiễu
  được cộng) rồi mới resample — cách analyze là đúng.** Tính est-shift
  ở viewport là sai (lưới subsample chroma 2×2 ở viewport khác lưới ở
  full-res; trường d0 viewport có std R 6,76 / frac|d0|>5 tới 3,9%
  trong khi d0 full-res-resample chỉ std R 1,14 / frac 1,4%).
- Giả thuyết "decode browser khác ffmpeg ở frame gốc gây ra phần dư"
  **không được chứng minh cũng không bị bác** bởi test này — test đúng
  cần frame browser decode ở full-res (capture 1:1), không có trong
  đợt này. Ghi làm nợ đợt sau, không ép kết luận.
- Hệ quả thực tế: mô hình Y8 **không đủ chính xác để dự đoán verdict
  sát nút ở upscale** (ngưỡng 0,35; đo 0,38/0,43; sim 0,13–0,34).
  Phần dư ~0,1–0,25 Δkurt R còn mở — nhưng đã loại trừ được resample
  (1D khớp MAD 0,001; trilinear ≡ 1-kernel ở upscale) và kẹp YUV.
  Không sửa production vì nó.

## 5. Đã làm / không làm + sự cố

1. **ĐÃ** probe thang dày 28 thang mới + fit gộp 43 thang (bias(s),
   hồi quy, quét pooled, V_1D exact, điểm 2D) — nợ mô hình resample
   theo thang ĐÓNG với kết luận KHÔNG có phụ thuộc thang.
2. **ĐÃ** capture full-pixel headed w2560 (3/3 pass) + phân tích verdict
   sau delta0 — w2560 ĐÃ XÁC NHẬN: LỆCH ở cả 2 mức do Δkurt R.
3. **ĐÃ** chạy mô hình nhiễu Y8 ở w2560 (125 s, 5 seed × 2 mức + 2
   ablation) + chẩn đoán delta0-browser — mô hình đúng cơ chế
   (est-chroma) nhưng đánh giá thấp Δkurt R: sim KHỚP 5/5 cả 2 mức,
   đo LỆCH cả 2 mức; gap ~0,1–0,25 chưa giải thích được (xem §4).
4. **KHÔNG** sửa code production, **KHÔNG** push/tag/binary. Chỉ thêm
   LIMITS này + 4 script mới (xem §7).
5. **Sự cố mô hình v1**: script r72z9-noise-model-w2560.mjs chạy lần
   đầu với VW/VH vẫn là 489×275 (lệnh patch chuỗi không khớp vì dòng
   gốc là `const W = 1280, H = 720, VW = 489, VH = 275;` — Python
   `str.replace` không báo lỗi khi mẫu vắng mặt; log tiêu đề đã đổi nên
   thoạt nhìn tưởng đúng). Kết quả v1 (render kurt R 2,93 — đúng số
   w1440 của X6/Y8) bị phát hiện sai nhờ đối chiếu với số render của
   analyze (4,67) — đã sửa VW/VH bằng assert + chạy lại. Bài học: patch
   bằng script phải assert mẫu tồn tại; đối chiếu chéo số render giữa
   hai script độc lập đã bắt được lỗi.

## 6. Nợ mở / hướng tiếp theo

1. **Δkurt R w2560 (0,38/0,43)**: phần dư nằm ở đường nhiễu, không
   phải resample (§4). Hướng tiếp theo: (a) capture 1:1 lấy frame
   browser decode full-res rồi chạy lại sim — kiểm giả thuyết decode;
   (b) kiểm trên nội dung tự nhiên (ocean/slovenska/basgo) trước khi
   quyết có sửa `addYuvNoise` hay không. Không sửa khi chưa có đợt
   quyết riêng (hạ kCr có thể phá khớp full-res như Y8 đã cảnh báo).
2. **Kernel 2D thật của Chrome** (nợ Y8 §6 mục 1): dPeak TRI −1…−4
   trên 43 thang, vị trí đúng 43/43 — hạng chéo 2D vẫn còn, cần probe
   2D lưới pha mịn để fit dạng kernel.
3. **Dư ±1 mức float ở s=0,75** (Y7 §4, xác nhận lại ở đây): chỉ sửa
   được nếu tái tạo đúng phép tính fixed-point/float32 của Skia — lợi
   ích thấp (0,26% pixel, ±1 mức, 1 thang).
4. **GPU thật / Safari thật chưa đo** (nợ chung): mọi kết luận chỉ đúng
   trên CPU/SwiftShader + Chromium 158.
5. `.github/workflows/` vẫn 403 (chờ user) — nợ chung.

## 7. Files

- LIMITS này: `docs/PHASE9_ROUND72_Z9_RESAMPLE_SCALE_LIMITS.md`
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round72-z9.md`
- Probe + fit + JSON + log (goal hidden_files, không stage lên GitHub):
  `hidden_files/round72-z9/` — `r72z9-dense-A.json`,
  `r72z9-chrome-A-stdout.log`, `r72z9-chrome-A-chrome.log`,
  `r72z9-fit-dense.json`, `r72z9-fit-dense.log`,
  `headed-w2560/` (snaps + report + log vite/chrome),
  `r72z9-headed-w2560.log`, `r72z9-analysis-w2560.json`,
  `r72z9-analyze-w2560.log`, `r72z9-noise-model-w2560.json`,
  `r72z9-noise-model-w2560.log`, `r72z9-delta0-browser.json`,
  `r72z9-delta0-browser.log`, `chrome-userdata-z9/`.
- Script mới (stage lên GitHub — text, KHÔNG push trong luồng này):
  `apps/web/scripts/r72z9-chrome-dense.mjs`,
  `apps/web/scripts/r72z9-fit-dense.mjs`,
  `apps/web/scripts/r72z9-analyze-w2560.mjs`,
  `apps/web/scripts/r72z9-noise-model-w2560.mjs`,
  `apps/web/scripts/r72z9-delta0-browser.mjs`.
- Batch stage (KHÔNG push):
  `~/workspace/repo-1-push/paths-loop/phase9-round72-z9-resample-scale.txt`
  — 6 entry (LIMITS này + 5 script); không sửa code production, không
  binary, không workflow `.yml`.
