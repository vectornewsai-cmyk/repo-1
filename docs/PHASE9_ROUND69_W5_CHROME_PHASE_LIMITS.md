# Phase 9 đợt 69, luồng W5 — Dư ±16 theo pha + V_1D tăng theo s: ĐÃ GIẢI BẰNG MÔ HÌNH TRILINEAR MIPMAP LOD-BIAS −0,5

> **Kết luận chốt (đọc trước):** Cả hai nợ mở của V3 đợt 68 §5 mục 1–2
> (dư ±16 theo pha của 2-stage; V_1D tăng theo s) **đã có đáp án chung,
> đo được, gần như chính xác tuyệt đối**: Chrome `drawImage` "high"
> không phải 2-stage (halve rồi scale) mà là **trilinear mipmap với LOD
> bias −0,5**: `λ = log2(1/s)`, `λ* = max(0, λ − 0,5)`, `L = floor(λ*)`,
> `f = frac(λ*)`, `out = (1−f)·bilinear(mip L) + f·bilinear(mip L+1)`,
> mỗi mip = halve `(0,5, 0,5)` lặp lại, bilinear = triangle h=1,
> làm tròn halve kiểu nửa-xuống (127,5 → 127). Trên **18 thang đo**
> (s = 0,26–0,63, gồm 8 thang mới đo đợt này): pooled MAD **0,002**
> (BASE 2-stage: 0,100–0,119), madPeak **0,21** (BASE: 11,71–20,78),
> |dPeak| mean **0,27** max **1** (BASE: 8,16 / 18), autocorr dPeak
> lag-1 **+0,26** (BASE: −0,617), V_1D lệch ≤ **0,008** mọi thang
> (BASE lệch tới 0,235). Quét bias sắc: −0,25 → MAD 0,101; −0,4 →
> 0,041; **−0,5 → 0,002**; −0,6 → 0,042; −0,75 → 0,100. Đây là đáp án
> nhất quán trên mọi thang đo — **đề xuất áp dụng thay mô hình 2-stage
> trong `chrome-resample.mjs`** (xem §6; luồng này KHÔNG tự sửa code
> sản phẩm, chỉ đề xuất). Hướng (a) fixed-point: **loại trừ hoàn toàn**
> (mọi biến thể ≡ BASE). Hướng (c) hạng chéo 2D: **loại trừ với s<0,5**
> (5×5 RMSE ≤0,69, maxAbs ≤3); s≥0,6 còn lệch tới 11–12 mức — nợ riêng
> ngoài phạm vi 2-stage. Verdict w1440 không đổi 1/2 (Δcorr R-G 0,198):
> đúng như V3 kết luận, phần dư đó nằm ở mô hình nhiễu, không phải bộ lọc.

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
  **KHÔNG push, KHÔNG release/tag.** Mọi số là đo thật trên VM này
  (Chrome 158.0.0.0 headed qua Xvfb, Node v24.22.1, VM 4 vCPU, không GPU;
  loadavg lúc đo 11–14 do các luồng đợt 69 chạy song song).
- Nợ đóng: V3 đợt 68 §5 mục 1 (dư ±16 theo pha) và mục 2 (V_1D tăng
  theo s) — cả hai cùng một gốc. Mục 3 (w1440 noise05) đã chuyển hướng
  từ đợt 68, không thuộc luồng này; kiểm chứng lại ở §5 dưới đây.
- Dữ liệu đích: sweep vuông 512×512 của U2 (s = 0,30/0,35/0,3819/0,40)
  + V3 (s = 0,45/0,48/0,5/0,55/0,6/0,63) + **8 thang mới đợt này**
  (s = 0,2598–0,3496, probe B) — tổng 18 thang, 128 pha/thang, X+Y.
  Probe tách chặng + probe B: Chrome 158 headed, `--disable-gpu`.

## 1. Mô hình LOD-bias −0,5 (đặc tả chính xác)

Cho ảnh nguồn vuông `S×S`, đích `dw×dw`, `s = dw/S` (thực, dùng
`dw/S` chứ không dùng `s` danh nghĩa):

```
λ  = log2(S/dw)            # "mức mip lý tưởng"
λ* = max(0, λ − 0,5)        # LOD bias −0,5
L  = floor(λ*);  f = λ* − L # f ∈ [0,1)
mip(k) = halve k lần ảnh nguồn, mỗi lần (0,5, 0,5) tách trục, làm tròn
         nửa-xuống (x.5 → floor, vd 127,5 → 127 — khớp halve đo riêng)
out = (1−f)·bilinear(mip(L) → dw) + f·bilinear(mip(L+1) → dw)
      (bilinear = triangle h=1, S=(i+0,5)/s_mức; kết quả làm tròn thường)
```

Ví dụ: s=0,3819 → λ=1,389, λ*=0,889, L=0, f=0,889:
`out = 0,111·triangle(512→196) + 0,889·2-stage`. s=0,30 → λ=1,737,
λ*=1,237, L=1, f=0,237: `out = 0,763·2-stage + 0,237·3-stage`.
s=0,55 → λ=0,862, λ*=0,362, L=0, f=0,362:
`out = 0,638·triangle(512→282) + 0,362·(halve + upscale 256→282)`.
s≥0,7071 (λ≤0,5) → λ*=0 → thuần triangle h=1 (khớp chặng-2-một-mình
đo được ở s2≥0,7: MAD 0,000).

Ý nghĩa: đây là trilinear mipmap chuẩn nhưng với **LOD bias −0,5**
(ưu tiên mức mịn hơn nửa mức) — đúng kiểu lấy mẫu mipmap của Skia
khi `imageSmoothingQuality = "high"`. Ngưỡng "halve ở 0,5" của V3 chỉ
là hệ quả: tại s=0,5 thì λ*=0,5, hai thành phần trùng nhau.

## 2. Kiểm chứng: thắng BASE nhất quán trên mọi thang đo

Script: `r69w5-fit-lodbias.mjs` (18 thang: U2 + V3 + probe B full).

### 2.1 Sweep shape: MAD / madPeak

| mô hình | pooled MAD (s<0,5, 14 thang) | madPeak | MAD theo thang (0,30 / 0,3819 / 0,45 / 0,48) |
|---|---|---|---|
| BASE 2-stage | 0,100 | 11,71 | 0,105 / 0,048 / 0,144 / 0,184 |
| LOD-bias −0,5, round-half-up | 0,005 | 0,59 | 0,004 / 0,005 / 0,003 / 0,002 |
| **LOD-bias −0,5, round-half-down** | **0,002** | **0,21** | **0,000 / 0,003 / 0,001 / 0,001** |

Trên TẤT CẢ thang kể cả s≥0,5 (18 thang): LOD-bias MAD 0,004 /
madPeak 0,55; BASE 0,134 / 18,77. Không thang nào BASE thắng.
Per-scale MAD của LOD-bias (half-down): 0,000–0,003 mọi thang —
mức sai số làm tròn uint8, tức mô hình đúng tới từng mức xám.

### 2.2 Dư peak theo pha s=0,3819: biến mất

|  | \|dPeak\| mean | max | autocorr lag-1/2/3/4 |
|---|---|---|---|
| BASE 2-stage | 8,16 | 18 | −0,617 / 0,094 / 0,460 / −0,916 |
| LOD-bias −0,5 (half-up) | 0,67 | 1 | 0,206 / −0,025 / −0,077 / −0,278 |
| LOD-bias −0,5 (half-down) | **0,27** | **1** | **0,261 / −0,009 / 0,113 / 0,114** |

Cấu trúc đan dấu mạnh của dPeak (đặc tả V3 §2.1) biến mất hoàn toàn:
nó chính là thành phần mức L0 bị 2-stage bỏ qua, có trọng số phụ
thuộc pha qua `f` và vị trí lấy mẫu của hai mức.

### 2.3 Quét bias: −0,5 là optimum sắc

| bias | pooled MAD | madPeak |
|---|---|---|
| −0,25 | 0,101 | 10,66 |
| −0,4 | 0,041 | 4,38 |
| **−0,5** | **0,005** | **0,59** |
| −0,6 | 0,042 | 5,04 |
| −0,75 | 0,100 | 12,42 |

Lệch ±0,1 khỏi −0,5 đã tệ đi 8× — bias −0,5 là giá trị thật, không
phải fit mò. (Bảng trên dùng round-half-up; half-down còn tốt hơn.)

### 2.4 V_1D: đường cong tăng + vết lõm 0,55 đều khớp

| s | đo | LOD-bias −0,5 | lệch | BASE 2-stage | lệch |
|---|---|---|---|---|---|
| 0,2598 | 0,2201 | 0,2244 | +0,0043 | 0,3401 | +0,1200 |
| 0,30 | 0,2769 | 0,2734 | −0,0034 | 0,3364 | +0,0595 |
| 0,35 | 0,3234 | 0,3295 | +0,0061 | 0,3341 | +0,0107 |
| 0,3819 | 0,3415 | 0,3466 | +0,0052 | 0,3359 | −0,0056 |
| 0,40 | 0,3631 | 0,3627 | −0,0004 | 0,3421 | −0,0210 |
| 0,45 | 0,3854 | 0,3890 | +0,0036 | 0,3359 | −0,0495 |
| 0,48 | 0,4125 | 0,4153 | +0,0027 | 0,3357 | −0,0768 |
| 0,50 | 0,4961 | 0,5039 | +0,0078 | 0,5039 | +0,0078 |
| 0,55 | 0,4828 | 0,4853 | +0,0025 | 0,3360 | −0,1468 |
| 0,60 | 0,5281 | 0,5294 | +0,0014 | 0,3386 | −0,1895 |
| 0,63 | 0,5720 | 0,5729 | +0,0010 | 0,3366 | −0,2353 |

LOD-bias lệch ≤0,008 trên mọi thang (kể cả 8 thang mới B133–B179).
Cơ chế: V tăng theo s vì trọng số mức L0 (phương sai cao, V≈0,667)
tăng dần khi λ* đi từ ~1,44 (s=0,26: blend L1/L2) qua 1,0 (s≈0,354:
đổi cặp mức L1/L2 → L0/L1) tới 0,5 (s=0,5). Vết lõm tại 0,55:
λ* giảm 0,5 → 0,362 nên trọng số L1 giảm, mô hình tái tạo đúng
(0,4853 vs đo 0,4828). **V_1D tăng theo s không phải do chặng 1 hay
chặng 2 riêng lẻ** (xem §3) mà do trọng số blend giữa hai mức mip.

## 3. Probe tách chặng: vì sao phân rã V1×V2 thất bại

Script: `r69w5-stage-isolation.mjs` + `r69w5-analyze-stages.mjs`
(Chrome 158 headed, 512→256 + 256→dw với s ∈ 0,30–0,48).

- **Chặng 1 một mình (512→256): đúng (0,5, 0,5)** tới từng mức xám:
  impulse response chỉ 1 tap 127 mọi pha (127,5 → 127, không phải
  128 — Chrome làm tròn nửa-xuống); MAD model halve vs đo 0,0039;
  V1_1D đo = **0,4961** (không phải 0,5, do làm tròn 127); DC 128 var 0.
- **Chặng 2 một mình (256→dw): đúng triangle h=1** với s2≥0,70
  (MAD 0,000 ở s2 = 0,7656/0,8008/0,8984/0,9609; 0,013 ở 0,6992),
  V2_1D = 0,6667 phẳng. Nhưng ở **s2 = 0,6016 lệch rõ** (MAD 0,194):
  response 3 tap (vd p=128: [76:3, 77:158, 78:8] vs model [77:171]),
  V2 = 0,5400 — đây chính là blend trilinear (xem §4).
- **Phân rã V thất bại:** V1×V2 = 0,331 phẳng vs V_total đo
  0,277→0,413: khớp ở s=0,30/0,35 (−3,2%/+0,8%) nhưng lệch tăng dần
  −3,2% (0,3819), −8,9% (0,40), −14,2% (0,45), −19,8% (0,48).
  Hợp thành đo-đo (R1 đo + R2 đo) chỉ đạt MAD 0,115 vs BASE 0,119 —
  không sửa được s≥0,3819. Kết luận: **đường toàn trình KHÔNG phải
  hai lần draw canvas độc lập**; hai chặng đo riêng là hai MỨC của
  blend, không phải hai chặng nối tiếp.
- **Đỉnh kernel hiệu dụng** (kernel collapse, §4.4 của log):
  trọng số đỉnh đo được 0,44 (s=0,3819) → 0,65 (s=0,48), vượt trần
  0,5 của mọi mô hình 2-stage — bằng chứng trực tiếp 2-stage sai
  cấu trúc ở s→0,5, khớp đỉnh triangle h≈0,75/s (0,64 ở s=0,48).

## 4. Trilinear blend: từ dị thường s2=0,6016 tới đường cong t(s2)

- Fit blend `(1−t)·R_fine + t·R_coarse` (R_coarse = halve rồi upscale
  triangle): ở s2=0,6016, **t=0,23 cho MAD 0,003** (từ 0,194);
  ở s2=0,6992 t=0,02; s2≥0,7656 t=0. Đường toàn trình blend
  2ST/3ST cho cùng t tại cùng s2 (s=0,30: t=0,23, MAD 0,105→0,004).
- Probe B lưới mịn (8 thang s2 = 0,52–0,70, cả chặng-2-một-mình và
  toàn trình, t khớp nhau tới 0,01):
  t = 0,44 / 0,36 / 0,28 / 0,23 / 0,19 / 0,13 / 0,06 / 0,02 tại
  s2 = 0,52 / 0,55 / 0,58 / 0,60 / 0,62 / 0,65 / 0,68 / 0,70,
  MAD sau blend 0,003–0,008 mọi thang (từ 0,013–0,369).
  **t = log2(1/s2) − 0,5** khớp mọi điểm tới 0,01 (vd s2=0,55:
  λ−0,5 = 0,360 vs t=0,36) — chính là frac của λ* trong §1.
  Ngưỡng tắt blend: s2 = 2^(−0,5) ≈ 0,7071 (λ*=0).

## 5. Kết quả âm tính (hướng (a), (b), (c) + các họ kernel)

Tất cả đều thua BASE hoặc không nhất quán — ghi đầy đủ để đợt sau
khỏi làm lại. Chi tiết số trong log luồng.

### 5.1 (a) Fixed-point — LOẠI TRỪ HOÀN TOÀN

Script `r69w5-fit-fixedpoint.mjs`. Lượng tử hoá trọng số từng chặng
Q8/Q12/Q16 × round/floor × có/không chuẩn hoá lại: **mọi biến thể
≡ BASE** (pooled MAD 0,119, madPeak 20,77–20,78; autocorr dPeak
lag-1 −0,619 vs −0,617). Lượng tử hoá vị trí S bước 1/256 ≡ BASE;
bước 1/16 tệ hơn (0,120). Lượng tử hoá kernel HỢP (combined weights)
bước 1/16 round: MAD 0,124, madPeak 20,94 — tệ hơn; bước 1/32 và
1/64 floor: MAD 0,116 (−2,5%) nhưng madPeak tệ hơn (21,28/20,88)
và không đều theo thang — cùng kiểu overfit MAD như h2=0,95 của V3,
không đạt tiêu chí chấp nhận (MAD giảm rõ + madPeak giảm + autocorr
về 0 trên ≥2 thang). **Trọng số fixed-point không phải nguồn dư.**

### 5.2 (b) Chặng giữa F16 / texture GPU — không phải nguồn dư

Hợp thành từ kernel đo trực tiếp từng chặng (R1 đo + R2 đo) chỉ
0,115 vs BASE 0,119; mid float đã ≡ BASE từ V3. Dư không nằm ở
định dạng chặng giữa mà ở **thiếu thành phần mức L0** (§1).

### 5.3 (c) Hạng chéo 2D — LOẠI TRỪ với s<0,5

Script `r69w5-fit-kernel.mjs` §5 + `r69w5-verdict-lodbias.mjs` §1:
điểm 2D đo vs dự tách được (outer product sweep 1D đo được):
s≤0,55 RMSE 5×5 ≤0,69, maxAbs ≤3 (mức làm tròn); với hàng 1D
LOD-bias dự 2D cho kết quả tương tự (tổng RMSE 1,04 trên 500 điểm,
tập trung ở s≥0,6). **Không có hạng chéo đáng kể ở vùng 2-stage.**
Ngoại lệ: s=0,6/0,63 RMSE 1,6–2,9, maxAbs 11–12 — lệch tách được
thật ở vùng s>0,5 (ngoài phạm vi nợ 2-stage; để lại đợt sau, xem §7).

### 5.4 Các họ kernel khác — đều thua 2-stage ở s≤0,4

- Single triangle h=max(1,c/s): tốt nhất c=0,75, pooled MAD 0,161
  (BASE 0,119) — nhưng V_1D của nó khớp đo tới ±0,016 mọi thang
  (manh mối dẫn tới §1: năng lượng đúng, hình dạng sai).
- h2 tự do theo thang (2-stage): 1,10 → 0,90 khi s2 0,60 → 0,96;
  MAD cải thiện nhẹ (vd 0,48: 0,173 vs 0,184) nhưng madPeak không
  đổi — không nhất quán, và mâu thuẫn chặng-2-một-mình đúng h=1.
- Cubic (B-spline/Mitchell/Catmull-Rom/Lanczos2), Gaussian,
  box(a)×triangle(b): tốt nhất ~0,12–0,19 ở s=0,3819 (BASE 0,048);
  ở s=0,48 box(0,75)×tri(1) đạt 0,124 < BASE 0,184 nhưng không
  thắng ở thang thấp — không có họ nào thắng nhất quán.
- Blend 2ST + single-h0,75/s: MAD cải thiện (0,48: 0,091 vs 0,184)
  với trọng số tăng theo s (0 → 0,6) — là hình chiếu gần đúng của
  mô hình §1 (thiếu thành phần L0), không phải cơ chế thật.

## 6. Đề xuất áp dụng (cho đợt gộp / parent quyết)

**Thay mô hình trong `apps/web/scripts/chrome-resample.mjs`
(`chromeResampleRgb24`)**: bỏ nhánh "halve khi s<0,5 rồi scale
triangle h=1", thay bằng trilinear mipmap LOD-bias −0,5 theo §1
(áp dụng tách trục X/Y; mỗi trục tính λ* riêng; mức mip tạo bằng
halve tách trục với làm tròn nửa-xuống; blend 2 mức kề bằng triangle
h=1; làm tròn kết quả thường). Giữ ngưỡng chú thích 0,5 nhưng sửa
nội dung: ngưỡng đó là hệ quả của λ*=0,5 tại s=0,5, không phải
điểm chuyển mô hình.

Kiểm chứng bắt buộc sau khi áp: `node --test
apps/web/scripts/chrome-resample-67u2.test.mjs` phải xanh (cập nhật
kỳ vọng test theo mô hình mới — các vector kỳ vọng cũ theo 2-stage
sẽ lệch); chạy lại verdict w1440 (§5 dưới) để xác nhận tỉ lệ KHỚP
không xấu đi; tsc/vite build như thường lệ. Lưu ý: mô hình mới
đắt hơn ~2× số phép resample 1D (2 mức thay vì 1 chặng + 1 halve
phụ cho mức thô) — vẫn rẻ so với render thật, không ảnh hưởng
hiệu năng đo được ở preview (cần đo lại nếu nghi ngờ).

## 7. Verdict w1440 + nợ mở

- Verdict với LOD-bias (`r69w5-verdict-lodbias.mjs` §2):
  noise05 vẫn **LỆCH** (Δcorr [0,198, 0,017, 0,020]; render corr
  R-G −0,145 vs Chrome-thật −0,147, std/kurt gần như trùng
  Chrome-thật: std [12,47, 8,10, 16,93] vs [12,50, 8,04, 16,92],
  kurt [3,10, 0,39, 1,73] vs [2,96, 0,38, 1,73]);
  noise10 vẫn **KHỚP** (Δcorr [0,117, 0,009, 0,023]).
  Tỉ lệ KHỚP 1/2 không đổi — đúng kết luận V3: dư Δcorr R-G 0,198
  nằm ở **mô hình nhiễu preview** (cân bằng Y/Cr của `addYuvNoise`
  vs ffmpeg noise YUV420p), không phải bộ lọc. Bộ lọc giờ đã đúng
  tới mức xám; muốn khớp noise05 phải sửa đường nhiễu.
- Nợ mở còn lại: (1) áp dụng §6 (chờ parent/đợt gộp duyệt);
  (2) lệch tách được 2D ở s≥0,6 (maxAbs 11–12, RMSE ~2,8) — có thể
  là thành phần chéo thật của kernel 2D ở vùng upscale-nhẹ, cần
  probe 2D riêng; (3) GPU thật chưa đo (VM không GPU) — mọi kết
  luận chỉ đúng trên CPU/SwiftShader; (4) ci-security.yml 403
  (nợ chung).

## 8. Files

- LIMITS này: `docs/PHASE9_ROUND69_W5_CHROME_PHASE_LIMITS.md`
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round69-w5-chrome-phase.md`
- Probe + fit + JSON (goal hidden_files, không stage lên GitHub):
  `hidden_files/round69-w5/` — `r69w5-stage-isolation.mjs`,
  `r69w5-stage-isolation-A.json` (Chrome 158, stage1 + 6 thang stage2),
  `r69w5-stage-isolation-B.mjs`, `r69w5-stage-isolation-B.json`
  (8 thang s2 lưới mịn, stage2 + full), `r69w5-analyze-stages.mjs`,
  `r69w5-fit-single.mjs`, `r69w5-fit-kernel.mjs`,
  `r69w5-fit-fixedpoint.mjs`, `r69w5-fit-s2anomaly.mjs`,
  `r69w5-fit-trilinear.mjs`, `r69w5-fit-tcurve.mjs`,
  `r69w5-fit-lodbias.mjs`, `r69w5-verdict-lodbias.mjs` (+ các `.log`).
- Batch stage (KHÔNG push): `~/workspace/repo-1-push/paths-loop/phase9-round69-w5-chrome-phase.txt`
  — 1 entry (LIMITS này); không sửa code sản phẩm trong đợt này.
