# Phase 9 đợt 71, luồng Y7 — Ngưỡng halve Chrome: ĐÃ ĐO XONG (đóng nợ đợt 70 §4 mục 10)

> **Kết luận chốt (đọc trước):** (1) "Halve" là **một mức mip**: downscale
> ×0,5 bằng triangle h=1, làm tròn nửa-xuống. Dưới mô hình trilinear hiện
> tại, ngưỡng halve KHÔNG còn là điểm chuyển mô hình ở 0,5 như V3 đo dưới
> mô hình 2-stage cũ — 0,5 chỉ là hệ quả (λ*=0,5 tại s=0,5). Ngưỡng halve
> thật là **ngưỡng BẬT MIP-1**: thang s* mà dưới nó Chrome bắt đầu blend
> mip 1 (halve một lần), trên nó dùng thuần triangle h=1. (2) **Đã đo:
> s* = 0,7071 (2^−0,5), bias LOD = −0,500 ± 0,001.** Sweep 15 thang
> (s = 0,45–0,80, 256 hàng xung/thang, Chrome 158 headed): trọng số blend
> t_fit khớp frac(λ*) tới ±0,002 mọi thang xác định được; bias suy ra từng
> thang −0,501…−0,499; quét bias pooled MAD cực tiểu sắc tại −0,5
> (0,0008; ±0,02 đã tệ 6–8×). Ngưỡng bật bracket trực tiếp: t = 0,016
> (rõ ràng ≠ 0) ở s = 0,6992, t = 0 ở s ≥ 0,7070 (trong ±0,002). (3)
> **KHÔNG sửa code production**: `chromeResampleRgb24` (trilinear
> LOD-bias −0,5, X1 đợt 70) đã implement đúng ngưỡng này; kiểm chứng
> blend(f=frac(λ*)) tái tạo đúng từng số `trilinearRow1D` production
> (max diff 0, 15 thang × 256 pha); pooled MAD production trên dữ liệu
> mới **0,0008** (1-kernel 0,0574; 2-stage 0,3281). Nợ U2 §7.1 **ĐÓNG** —
> với đính chính: khoảng 0,45–0,63 trong nợ gốc đã được V3 pin dưới mô
> hình cũ, và dưới mô hình đúng thì trong khoảng đó KHÔNG có ngưỡng nào
> (chỉ có blend mượt), ngưỡng thật nằm ở 0,7071.

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
  **KHÔNG push, KHÔNG release/tag.** Mọi số là đo thật trên VM này
  (Chrome 158.0.0.0 headed qua Xvfb, `--disable-gpu`, Node v24.22.1,
  VM không GPU; loadavg 1,3–6,4 lúc đo — phép đo pixel là xác định,
  không phụ thuộc tải: lặp lại dw=282 byte-identical).
- Nợ đóng: đợt 70 §4 mục 10 (ngưỡng halve 0,45–0,63 chưa đo, nợ U2 §7.1).
- Dữ liệu đích: sweep vuông 512×512 mới đo đợt này (15 thang) + dữ liệu
  U2/V3/probe B/W5 (18 thang cũ, dùng để đối chứng — không đo lại).

## 1. "Halve" là gì — xác định chính xác (nhiệm vụ (a))

- **Halve** = một bước downscale đúng ×0,5 trong tháp mipmap của Skia khi
  `drawImage` với `imageSmoothingQuality = "high"`: kernel triangle h=1,
  vị trí lấy mẫu S=(i+0,5)/0,5, làm tròn **nửa-xuống** (127,5 → 127 —
  đo riêng W5 §3, impulse chặng 1 chỉ 1 tap 127 mọi pha).
- Mô hình đúng (W5, X1 đã áp vào production): trilinear mipmap
  `λ=log2(1/s)`, `λ*=max(0, λ−0,5)`, `L=floor(λ*)`, `f=frac(λ*)`,
  `out=(1−f)·bilinear(mip L) + f·bilinear(mip L+1)`; mỗi mip = halve
  lặp lại. "Halve" xuất hiện qua **trọng số blend f** (tỉ lệ mip thô)
  và qua **số mức mip L**.
- **Ngưỡng halve có hai nghĩa, cần tách bạch:**
  1. *Ngưỡng V3* (mô hình 2-stage cũ): thang mà 2-stage và 1-kernel đổi
     nhau thắng — đã pin **0,5** (V3: 2-stage thắng s≤0,48, 1-kernel
     thắng s≥0,55, trùng nhau tại 0,5). Đây là **artefact của việc so
     hai mô hình sai**: tại s=0,5 thì λ*=0,5, hai thành phần blend trùng
     nhau (W5 §1) nên hai mô hình cũ trùng nhau — không phải điểm
     chuyển hành vi của Chrome.
  2. *Ngưỡng thật* (mô hình trilinear): **s\* = 2^−0,5 ≈ 0,7071** — thang
     mà λ* chạm 0: trên s* thì f=0, L=0, Chrome dùng thuần triangle h=1
     (không halve nào cả); dưới s* thì f>0, mip 1 (halve một lần) bắt
     đầu được blend vào. Đây mới là ngưỡng halve còn chưa đo chính xác
     trước đợt này (W5 chỉ bracket (0,70; 0,7656] qua probe chặng-2:
     t=0,02 ở s2=0,70; t=0 ở s2≥0,7656).
- **Trong khoảng 0,45–0,63 (nợ gốc): không có ngưỡng nào cả.** Blend
  mượt: f giảm đơn điệu 0,655 → 0,165; trilinear thắng 1-kernel và
  2-stage ở MỌI thang (xem §2). Ai còn dùng "ngưỡng halve 0,5" theo
  nghĩa chuyển mô hình thì đã lỗi thời từ W5.

## 2. Đo ngưỡng: sweep 15 thang, đường toàn trình 512→dw (nhiệm vụ (b))

Script probe: `hidden_files/round71-y7/r71y7-chrome-threshold.mjs`
(Chrome 1254 = Chrome 158, headed Xvfb, `--disable-gpu`; display
:180–189, cổng 9680–9689 — tránh đụng các luồng đợt 71 khác; chia
thành eval 3 thang/lần sau khi bản v1 timeout CDP 180s vì 1 eval 15
thang quá dài dưới tải cao — xem §6). Mỗi thang: sweep X 128 pha +
sweep Y 128 pha (xung 1D), texture trắng 3 seed → V, xung điểm 2D
(256,256), phẳng 128 → DC. Ghi JSON: `r71y7-threshold-A.json`.
Fit: `r71y7-fit-threshold.mjs` (cache fine/coarse theo pha; lưới t
bước 0,002; khoảng bất định t = mọi t có MAD ≤ best+0,0005).
Kết quả: `r71y7-fit-threshold.json`.

### 2.1 Bảng sweep: MAD từng mô hình + t_fit + bias suy ra

fullRowMAD = mean |model−đo| trên mọi điểm của 256 hàng sweep
(128 pha X + 128 pha Y). `t_fit` = trọng số blend đo được
(lưới 0,002); `bias` = t_fit − log2(1/s) (L=0 mọi thang).

| dw | s thực | λ* (bias −0,5) | 1-kernel MAD | 2-stage MAD | **TRI prod MAD** | t_fit [khoảng] | bias suy ra |
|---|---|---|---|---|---|---|---|
| 230 | 0,4492 | 0,655 | 0,2326 | 0,1438 | **0,0014** | 0,656 [0,652, 0,656] | −0,499 |
| 246 | 0,4805 | 0,557 | 0,2161 | 0,1841 | **0,0012** | 0,558 [0,556, 0,558] | −0,499 |
| 256 | 0,5000 | 0,500 | 0,0039 | 0,0039 | **0,0000** | N/A (fine≡coarse) | N/A |
| 282 | 0,5508 | 0,360 | 0,1495 | 0,2657 | **0,0007** | 0,360 [0,358, 0,362] | −0,500 |
| 307 | 0,5996 | 0,238 | 0,0947 | 0,3040 | **0,0012** | 0,238 [0,236, 0,240] | −0,500 |
| 323 | 0,6309 | 0,165 | 0,0680 | 0,3451 | **0,0009** | 0,164 [0,164, 0,166] | −0,501 |
| 333 | 0,6504 | 0,121 | 0,0502 | 0,3670 | **0,0010** | 0,120 [0,120, 0,122] | −0,501 |
| 348 | 0,6797 | 0,057 | 0,0235 | 0,3918 | **0,0010** | 0,056 [0,056, 0,058] | −0,501 |
| 353 | 0,6895 | 0,036 | 0,0151 | 0,4017 | **0,0010** | 0,036 [0,036, 0,038] | −0,500 |
| 358 | 0,6992 | 0,016 | 0,0063 | 0,4091 | **0,0010** | 0,016 [0,014, 0,016] | −0,500 |
| 362 | 0,7070 | 0,000 | 0,0000 | 0,4152 | **0,0000** | 0,000 [0,000, 0,002] | (cận trên, xem §2.2) |
| 364 | 0,7109 | 0,000 | 0,0000 | 0,4154 | **0,0000** | 0,000 [0,000, 0,002] | (cận trên) |
| 369 | 0,7207 | 0,000 | 0,0000 | 0,4170 | **0,0000** | 0,000 [0,000, 0,002] | (cận trên) |
| 384 | 0,7500 | 0,000 | 0,0013 | 0,4427 | **0,0026** | 0,000 [0,000, 0,004] | (cận trên) |
| 410 | 0,8008 | 0,000 | 0,0000 | 0,4153 | **0,0001** | 0,000 [0,000, 0,002] | (cận trên) |

- **Trilinear thắng mọi thang**: pooled MAD 15 thang **0,0008**
  (1-kernel 0,0574 — tệ 72×; 2-stage 0,3281 — tệ 410×). Vùng nhiệm
  vụ 0,45–0,63: TRI **0,0009** (1K 0,1275; 2ST 0,2078). Vùng bật
  mip-1 0,65–0,80: TRI **0,0007** (1K 0,0107; 2ST 0,4084).
- **t_fit khớp frac(λ*) tới ±0,002** ở mọi thang xác định được
  (9/9 thang s≠0,5, s<0,7071) — độ nhạy cao: khoảng bất định t chỉ
  rộng ±0,002–0,004, tức bias xác định tới ±0,001–0,002 từng thang.
- **s=0,5: t KHÔNG xác định được** (khoảng [0, 1]): fine≡coarse đúng
  từng số vì triangle h=1 thang 0,5 = trung bình 2 px = halve. Thang
  này loại khỏi suy luận bias (v1 của fit đã tính nhầm bias=−1,000
  ở đây — đã sửa ở v2; số v1 ở 4 thang đầu đã đối chiếu lại, khớp v2).
- **Blend(f=frac(λ\*)) tái tạo đúng từng số production**:
  max diff giữa blend tự tính và `trilinearRow1D` production = **0**
  trên cả 15 thang × 256 pha — fit script và code production là một.
- DC phẳng 128 → **đúng 128 (min=max=128)** cả 15 thang.

### 2.2 Ngưỡng bật mip-1: s\* = 0,7071 — bracket trực tiếp + bias

- Thang cuối cùng t rõ ràng ≠ 0: **s = 0,6992, t = 0,016**
  [0,014, 0,016] (1-kernel MAD 0,0063 đã thấy lệch, trilinear 0,0010).
- Thang đầu tiên t = 0 (trong ±0,002): **s = 0,7070, t ∈ [0, 0,002]**;
  t dự báo theo mô hình tại đây là 0,0002 — nằm trong khoảng đo.
  s = 0,7109 trở lên: t = 0, 1-kernel MAD 0,0000 (thuần triangle).
- → **s\* ∈ (0,6992, 0,7109]**, chứa đúng **2^−0,5 = 0,70711**.
- Bias từng thang (9 thang xác định): **−0,501…−0,499, trung bình
  −0,500**. Giao các khoảng bất định: [−0,5004, −0,5003] — lệch khỏi
  −0,5 đúng 0,0003, dưới độ phân giải lưới t (0,002) nên **phù hợp
  −0,5 trong sai số đo**. Kết luận: **bias = −0,500 ± 0,001**.
- Các thang s>0,7071 chỉ cho **cận trên** bias (bias ≤ −log2(1/s)):
  ≤ −0,498 (s=0,7070), ≤ −0,492 (0,7109), ≤ −0,473 (0,7207),
  ≤ −0,415 (0,75), ≤ −0,321 (0,8008) — đều thỏa với −0,5. (Trường
  `biasImplied` trong JSON ở 4 thang này là cận trên, không phải ước
  lượng điểm — đừng đọc nhầm.)
- **Quét bias pooled MAD** (15 thang, 256 hàng/thang):

  | bias | −0,25 | −0,4 | −0,45 | −0,48 | **−0,5** | −0,52 | −0,55 | −0,6 | −0,75 |
  |---|---|---|---|---|---|---|---|---|---|
  | pooled MAD | 0,0886 | 0,0329 | 0,0158 | 0,0061 | **0,0008** | 0,0051 | 0,0112 | 0,0197 | 0,0381 |

  Cực tiểu sắc tại −0,5 (lệch ±0,02 đã tệ 6–8×) — khớp W5 §2.3 trên
  18 thang cũ, nay xác nhận lại trên 15 thang mới gồm cả vùng bật.

### 2.3 V_1D: khớp tới 0,0002 (số exact từ sweep, thay cho texture nhiễu)

V_1D = Σw² tính trực tiếp từ hàng xung đo (không nhiễu lấy mẫu) vs
mô hình trilinear production:

| s | 0,4492 | 0,4805 | 0,5000 | 0,5508 | 0,5996 | 0,6309 | 0,6504 | 0,6797 | 0,6895 | 0,6992 | 0,7070 | 0,7109 | 0,7207 | 0,7500 | 0,8008 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| đo | 0,1731 | 0,1982 | 0,2480 | 0,2659 | 0,3166 | 0,3608 | 0,3903 | 0,4303 | 0,4457 | 0,4593 | 0,4713 | 0,4741 | 0,4822 | 0,4871 | 0,5338 |
| TRI | 0,1731 | 0,1982 | 0,2480 | 0,2659 | 0,3164 | 0,3609 | 0,3904 | 0,4303 | 0,4456 | 0,4594 | 0,4713 | 0,4741 | 0,4822 | 0,4838 | 0,5338 |
| lệch | 0,0000 | −0,0001 | 0,0000 | 0,0000 | −0,0002 | +0,0001 | +0,0001 | −0,0001 | −0,0002 | +0,0001 | 0,0000 | −0,0001 | −0,0000 | **−0,0033** | −0,0001 |

Lệch ≤0,0002 trên 14/15 thang — mô hình đúng tới từng mức năng
lượng. Ngoại lệ duy nhất s=0,75 (−0,0033): cùng gốc với dư làm tròn
§4 (chỉ thang này có nhiều ca .5 đúng). Lưu ý trung thực: bảng V_1D
theo texture trong log fit (lệch tới +0,033) là **nhiễu lấy mẫu**
của ước lượng texture (3 seed, Monte Carlo 8 seed), không phải lỗi
mô hình — số sweep exact ở trên mới là kết luận.

### 2.4 Điểm 2D bằng code production: peak đúng vị trí, lệch ≤3

Xung điểm 512×512 tại (256,256) → dw×dw bằng `resampleRgb24Trilinear`
production (so 1-kernel / 2-stage):

| dw | s | đo peak@(x,y) | TRI peak | dPeak TRI | dPeak 1K | dPeak 2ST |
|---|---|---|---|---|---|---|
| 230 | 0,4492 | 50@(115,115) | 50 | 0 | −8 | +7 |
| 246 | 0,4805 | 58@(123,123) | 58 | 0 | −3 | +3 |
| 256 | 0,5000 | 63@(128,128) | 63 | 0 | +1 | +1 |
| 282 | 0,5508 | 78@(141,141) | 77 | −1 | +11 | −20 |
| 307 | 0,5996 | 52@(153,153) | 49 | −3 | +12 | −24 |
| 323 | 0,6309 | 56@(161,161) | 53 | −3 | +8 | −24 |
| 333 | 0,6504 | 58@(166,166) | 55 | −3 | +6 | −24 |
| 348 | 0,6797 | 143@(174,174) | 141 | −2 | +6 | −95 |
| 353 | 0,6895 | 62@(176,176) | 61 | −1 | +2 | −24 |
| 358 | 0,6992 | 155@(179,179) | 155 | 0 | +2 | −108 |
| 362 | 0,7070 | 160@(181,181) | 160 | 0 | 0 | −113 |
| 364 | 0,7109 | 162@(182,182) | 162 | 0 | 0 | −116 |
| 369 | 0,7207 | 64@(184,184) | 63 | −1 | 0 | −22 |
| 384 | 0,7500 | 177@(192,192) | 177 | 0 | 0 | −133 |
| 410 | 0,8008 | 196@(205,205) | 195 | −1 | 0 | −154 |

Vị trí peak **đúng 15/15**; |dPeak| TRI ≤3 (1-kernel tới 12,
2-stage tới 154). Dư −1…−3 ở s=0,55–0,68 là phần tách-được-2D đã
biết (W5 §5.3/§7 mục 2, X1 §7 mục 1: maxAbs 11–12 trên patch 5×5)
— peak chỉ lệch ≤3, nhỏ hơn nhiều so với ước lượng outer-product
cũ; patch 5×5 đầy đủ vẫn chưa đo (probe này chỉ lưu peak — xem §5).

## 3. Ảnh hưởng tới code production: KHÔNG sửa (nhiệm vụ (c))

- Ngưỡng đo được (bias −0,5, bật mip-1 tại s\*=0,7071) **đúng bằng**
  những gì `chromeResampleRgb24` / `trilinearRow1D` đã implement
  (X1 đợt 70). Không có hằng số nào cần đổi, không có nhánh nào cần
  thêm. File `apps/web/scripts/chrome-resample.mjs` **không đụng**
  (mtime giữ nguyên 08/11 23:45).
- Kiểm chứng regression: `node --test
  apps/web/scripts/chrome-resample-67u2.test.mjs` → **8/8 xanh**;
  `npx tsc --noEmit` apps/web → **0 lỗi** (chạy lại trực tiếp, xem
  log luồng). Không chạy vite build (không đổi code TS/.mjs production
  — test + tsc đủ; X1 đã build PASS sau lần sửa production gần nhất).
- Ghi chú cho đợt sau: chú thích header trong `chrome-resample.mjs`
  (dòng ~80–88) hiện viết ngưỡng 0,5 "đã đo, pin" theo nghĩa V3 — nay
  đã rõ 0,5 chỉ là hệ quả, ngưỡng thật là 0,7071. Đây là **chú thích**,
  không phải code; đợt gộp có thể cập nhật 1 dòng cho chính xác, không
  bắt buộc trong luồng này (tránh đụng file chung với các luồng đợt 71
  khác đang chạy song song).

## 4. Dư ±1 mức xám ở s=0,75: nhiễu chính xác float, KHÔNG phải lỗi mô hình

Phát hiện phụ duy nhất: tại s=0,75, TRI MAD 0,0026 (1-kernel 0,0013)
— 256/98304 pixel (0,26%) lệch đúng 1 mức. Phân tích chi tiết:

- 128 pixel: TRI≠1-kernel (acc đúng x,5 trong float64 của tôi) và đo
  khớp Math.round (làm tròn lên) cả 128 — thoạt nhìn như "đường
  triangle thuần làm tròn lên", NHƯNG tại s=0,7070 có 2 pixel acc
  đúng 127,5 mà đo cho **127 (làm tròn xuống)** — mâu thuẫn với một
  quy tắc làm tròn thống nhất.
- 128 pixel còn lại: cả hai mô hình đều sai ±1; acc float64 của tôi là
  x,5 ± 1e-11 (vd 42,50000000000483 → tôi cho 43, đo cho 42;
  212,49999999999517 → tôi cho 212, đo cho 213) — tức phép tích lũy
  của Chrome rơi sang phía bên kia của .5 so với float64 của tôi
  trong cả 128 ca, có hệ thống.
- → Kết luận: **quy tắc làm tròn vẫn là nửa-xuống** (ca 127,5 đúng
  tuyệt đối ở s=0,7070 chứng minh); dư ở s=0,75 là **sai khác chính
  xác số học tích lũy** (Skia tính trọng số/tích lũy với độ chính
  xác khác float64 — có thể float32/fixed-point — nên các ca sát .5
  rơi sang phía bên kia). Không thể sửa bằng cách đổi quy tắc làm
  tròn (đổi sang Math.round chỉ sửa được 128 pixel và làm sai 2 pixel
  ở s=0,7070 + phá fit half-down ở vùng blend), và không thể sửa
  đúng nếu không tái tạo đúng từng bit phép tính của Skia — ngoài
  phạm vi, lợi ích chỉ 0,26% pixel ±1 mức tại đúng 1 thang.
- **Quyết định: KHÔNG sửa code vì dư này. Ghi nhận trung thực.**
  V_1D sweep tại s=0,75 lệch −0,0033 cùng gốc (14 thang còn lại
  ≤0,0002).

## 5. Nợ mở / hướng tiếp theo

1. **Patch 5×5 điểm 2D đầy đủ** (nợ kế thừa W5 §7 mục 2, X1 §7 mục 1–2):
   probe đợt này chỉ lưu peak/vị trí (dPeak TRI ≤3, vị trí đúng
   15/15) — chưa đo RMSE/maxAbs trên patch 5×5 để xác nhận dư tách
   được 2D ở s≥0,6 (W5 đo maxAbs 11–12 bằng outer-product dự báo;
   cần probe lưu patch thật so với `resampleRgb24Trilinear`).
2. **Dư ±1 mức do chính xác float ở s=0,75** (§4): chỉ sửa được nếu
   tái tạo đúng phép tính fixed-point/float32 của Skia — cần probe
   trọng số ở độ phân giải bit (hướng V3 §5 mục 1, vẫn mở). Lợi ích
   thấp (0,26% pixel, ±1 mức, 1 thang); không ưu tiên.
3. **Chú thích ngưỡng trong `chrome-resample.mjs`** (§3): cập nhật
   "ngưỡng 0,5 đã đo" → "ngưỡng bật mip-1 s\*=0,7071 đã đo (đợt 71
   Y7); 0,5 chỉ là hệ quả λ\*=0,5" — 1 dòng chú thích, đợt gộp làm.
4. **GPU thật chưa đo** (nợ kế thừa U2 §7 mục 5): mọi kết luận chỉ
   đúng trên CPU/SwiftShader (VM này không GPU).
5. **Mô hình nhiễu preview** (`addYuvNoise` cân bằng Y/Cr) — muốn
   khớp noise05 w1440 phải sửa đường nhiễu, không phải bộ lọc
   (V3 §5 mục 3, W5 §7, X1 §7 mục 5); không thuộc luồng này.

## 6. Đã làm / không làm + sự cố probe

1. **ĐÃ đo xong ngưỡng halve** (15 thang mới, Chrome 158 headed):
   bias −0,500 ± 0,001, s\* = 0,7071, pooled MAD production 0,0008.
2. **KHÔNG sửa code production** (không cần — đã đúng), **KHÔNG push/
   tag/binary**. Chỉ thêm LIMITS này (1 file).
3. **Sự cố probe v1**: 1 eval 15 thang timeout CDP 180s (máy tải cao,
   loadavg ~10 do các luồng đợt 71 khác chạy song song; log node còn
   bị file log Chrome truncate đè mất do cùng trỏ 1 file). Đã sửa ở
   v2: chia eval 3 thang/lần, timeout 300s, tách file log, ghi JSON
   tăng dần sau mỗi chunk. v2 chạy xong trong 88s, 15/15 thang,
   determinism dw=282 **byte-identical**.
4. **Fit v1 chậm** (~50s/thang do tính lại trọng số cho mỗi t trong
   lưới 501 điểm; đã kill sau 4 thang, số 4 thang khớp v2) — v2 cache
   fine/coarse theo pha, chạy hết 15 thang + quét bias + V_1D + điểm
   2D trong ~80s. Số v1 ở 4 thang đầu đã đối chiếu lại bằng v2, khớp.
5. Kiểm chứng: test suite 8/8, tsc 0 (xem §3). Không chạy vite build
   (không đổi code — xem §3).

## 7. Files

- LIMITS này: `docs/PHASE9_ROUND71_Y7_HALVE_THRESHOLD_LIMITS.md`
- Log + probe/fit scripts + JSON:
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round71-y7/`
  (`r71y7-chrome-threshold.mjs`, `r71y7-chrome-A-stdout.log`,
  `r71y7-chrome-A-chrome.log`, `r71y7-threshold-A.json`,
  `r71y7-fit-threshold.mjs`, `r71y7-fit-threshold.log`,
  `r71y7-fit-threshold.json`), log luồng `hidden_files/round71-y7.md`.
- Batch stage (KHÔNG push):
  `~/workspace/repo-1-push/paths-loop/phase9-round71-y7-halve-threshold.txt`
  — 1 entry (LIMITS này); không sửa code production trong đợt này.
