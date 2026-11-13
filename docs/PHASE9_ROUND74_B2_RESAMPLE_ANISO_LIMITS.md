# Phase 9 đợt 74, luồng B2 — Resample dị hướng + verdict w1920/w2560 + khoảng thiếu Δkurt Y8: ĐÃ XONG (nợ đợt 73 §4 mục 6)

> **Kết luận chốt:**
> 1. **Dị hướng (sx≠sy): CẢ HAI mô hình trilinear đều SAI LỚN — và production
>    mới (blend-at-end) tệ hơn bản cũ ở 5/6 cặp.** Trên 6 cặp dẹt headed
>    thật (1.536 điểm × cửa sổ 13×13): NEW RMSE 1,33–3,76, maxAbs
>    **41–60**, 328–1024/43.264 ô ≥ 4; OLD RMSE 0,08–3,04, maxAbs
>    **1–51**. Quy ước LOD theo thang nhỏ nhất **SAI cho dị hướng**.
>    Mọi số khớp maxAbs = 1 của A1 **chỉ đúng khi sx = sy**.
>    **Ngoại lệ quan trọng:** ở cặp 256×512 (sx=0,5, sy=1,0) mô hình
>    CŨ (per-pass) khớp **đúng từng số** (RMSE 0,0769, maxAbs = 1,
>    0 ô ≥ 4) — vì fy = 0 nên các hạng chéo triệt tiêu và cấu trúc
>    mip-1D của OLD trùng kernel thật (≡ triangle h=1). Đây là manh
>    mối mạnh nhất cho model thống nhất (xem §2).
> 2. **Kernel thật dẹt HẸP hơn hẳn mọi biến thể trilinear, tách trục gần
>    hoàn hảo, bảo toàn DC** — nhưng KHÔNG ứng viên nào trong ~30 kernel
>    tách được (triangle/Gauss/box/Mitchell/Catmull-Rom/Lanczos, tham số
>    hoá theo src px lẫn dst px) khớp tốt (tốt nhất gaussDst σ=0,3 dst
>    px: RMSE 1,52, maxAbs 36). Dạng đóng chính xác của kernel dị hướng
>    **vẫn mở** — cần nghiên cứu filter dị hướng riêng. **Không sửa
>    production** (không có mô hình thay thế đã kiểm chứng).
> 3. **Đối chứng đẳng hướng bằng đúng harness dẹt: khớp y hệt Z7/A1**
>    (230×230 RMSE 0,0638, 384×384 RMSE 0,0544, maxAbs = 1, 0 ô ≥ 4) —
>    harness đúng, kernel dẹt hẹp là **THẬT**, không phải lỗi đo.
>    Chrome dùng filter khác hẳn cho thang không đều so với thang đều.
> 4. **Verdict w1920/w2560 tính lại bằng production mới: 24/25 check
>    pass. 7/8 verdict không đổi; 1 LẬT THẬT** — test-pattern noise10
>    w1920 **LỆCH → KHỚP** (Δkurt R 0,38 → 0,34). w2560 **y hệt từng
>    chữ số** (upscale f = 0 nên blend-at-end ≡ blend-từng-pass).
> 5. **Khoảng thiếu Δkurt R của mô hình Y8 được TÁI KHUNG: phần lớn là
>    PHƯƠNG SAI SEED, không phải thiếu hệ thống lớn.** Dải 5 seed sim
>    noise05 [0,09–0,23] vs đo 0,27; noise10 [0,21–0,30] vs đo 0,32.
>    YUV420 round-trip (E5) đóng ~1/3–1/2 khoảng thiếu (w1440), phần
>    còn lại trong ~1,5 độ lệch chuẩn seed. Các giả thuyết bị loại:
>    base shifted (E1), sigma ×1,1 (E2), nhiễu sau resample (E3),
>    hỗn hợp đuôi nặng 5% (E4), sigma ×0,9, hỗn hợp vi lượng 0,5–1%.
>    Hướng còn lại: lượng tử hoá DCT trong decode thật.

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
  **KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG file workflow.**
  Mọi số là đo thật trên VM này (Node v24.22.1; Chromium 158 qua Xvfb,
  `--disable-gpu`; probe B2 dùng display :170–:179 / debug 9590–9599).
- Nợ đóng: đợt 73 §4 mục 6 (A1 §7 mục 1–3: probe dẹt headed, verdict
  w1920/w2560, khoảng thiếu Y8).
- Quy ước kurt: excess kurtosis, như pipeline verdict T3/X6 (ngưỡng
  KHỚP: std ratio [0,85, 1,18]; Δkurt ≤ 0,35; Δcorr ≤ 0,12).
- Production `resamplePlaneTrilinear` trong
  `apps/web/scripts/chrome-resample.mjs` **không đổi** trong luồng này.

## 1. Probe headed dị hướng: thiết kế

Script probe: `apps/web/scripts/r74b2-2d-grid-aniso.mjs` (mẫu Z7
`r72z7-2d-grid.mjs`, cùng code đường đi): canvas nguồn 512×512, xung
điểm 1 px trắng, lưới pha mịn 16×16 (px, py ∈ 248..263), cửa sổ đo
13×13 quanh peak, scan 21×21 quanh peak kỳ vọng; `imageSmoothingEnabled
= true`, `imageSmoothingQuality = "high"`, `drawImage(src, 0, 0, dw, dh)`.

6 cặp (dw, dh) — tỉ lệ dẹt bao cả hai hướng + 2 trường hợp biên:

| Cặp | sx | sy | Tỉ lệ dẹt |
|---|---|---|---|
| 230×384 | 0,4492 | 0,7500 | 1 : 1,67 |
| 384×230 | 0,7500 | 0,4492 | 1,67 : 1 (đối xứng) |
| 282×196 | 0,5508 | 0,3828 | 1,44 : 1 |
| 196×282 | 0,3828 | 0,5508 | 1 : 1,44 (đối xứng) |
| 512×128 | 1,0000 | 0,2500 | 4 : 1 (cực dẹt) |
| 256×512 | 0,5000 | 1,0000 | 1 : 2 (một trục upscale) |

- Determinism: cặp 230×384 chạy lặp **byte-identical**.
- edgePeak **0/256** mọi cặp (peak luôn trong scan 21×21).
- sum21 (tổng cửa sổ 21×21, DC ≈ 255·sx·sy kỳ vọng): [25,167],
  [25,167], [29,123], [29,123], [32,96], [128,128] — dải rộng theo
  pha, đúng bản chất aliasing của kernel hẹp (xem §3).

## 2. So production NEW (blend-at-end) và OLD (blend-từng-pass) với dữ liệu dẹt

Script fit: `hidden_files/round74-b2/r74b2-2d-fit-aniso.mjs` — so cửa
sổ đo với production NEW (`resamplePlaneTrilinear` hiện tại) và OLD
(per-pass, tái dựng từ `trilinearRow1D`); cross-check module tham
chiếu Z7 trên 1/4 điểm. Kết quả từng cặp (43.264 ô/cặp):

| Cặp (sx, sy) | NEW RMSE | NEW maxAbs | NEW ô ≥ 4 | OLD RMSE | OLD maxAbs | OLD ô ≥ 4 |
|---|---|---|---|---|---|---|
| 230×384 (0,4492, 0,7500) | 2,3214 | **60** | 608 | 1,9698 | 39 | 560 |
| 384×230 (0,7500, 0,4492) | 2,3210 | **60** | 552 | 1,9701 | 39 | 568 |
| 282×196 (0,5508, 0,3828) | 1,3348 | **53** | 328 | 1,2993 | 39 | 396 |
| 196×282 (0,3828, 0,5508) | 1,3356 | **53** | 328 | 1,2870 | 40 | 380 |
| 512×128 (1,0000, 0,2500) | 3,3300 | **60** | 1024 | 3,0392 | 51 | 1024 |
| 256×512 (0,5000, 1,0000) | 3,7567 | **41** | 1024 | **0,0769** | **1** | **0** |

- **Đối xứng x/y hoàn hảo:** cặp 384×230 cho đúng số của 230×384
  (RMSE 2,321, maxAbs 60); cặp 196×282 gần như đối xứng với 282×196
  (NEW 1,3356 vs 1,3348; OLD 1,2870 vs 1,2993 — chênh nhỏ do làm
  tròn) — pipeline đối xứng hai trục, như kỳ vọng.
- **NEW tệ hơn OLD ở 5/6 cặp** (maxAbs 60 vs 39–51; RMSE cao hơn
  0,04–0,29) — ngược hoàn toàn với đẳng hướng, nơi NEW khớp
  maxAbs = 1 còn OLD lệch tới 19. Bản sửa A1 đúng cho đẳng hướng,
  sai thêm cho dị hướng.
- **NGOẠI LỆ 256×512 — OLD KHỚP ĐÚNG TỪNG SỐ:** RMSE 0,0769,
  maxAbs = 1, 0 ô ≥ 4 (trong khi NEW: RMSE 3,7567, maxAbs 41, 1024
  ô ≥ 4). Ở cặp này sy = 1,0 → fy = 0 → các hạng chéo f(1−f) của
  khai triển per-pass triệt tiêu, và cấu trúc mip-1D của OLD (halve
  theo từng trục, impulse mip1 = 127,5) cho đúng kernel thật
  (≡ triangle h=1 — khớp với kernel-fit §3.2: tri(1) RMSE = 0 ở cặp
  này). Ngược lại NEW dùng mip 2D (impulse mip1 = 63,75) rồi
  upscale y ×2 trong mip — làm loãng khối lượng, sai hẳn.
  **Manh mối cho model thống nhất:** model đúng phải suy về NEW khi
  sx = sy VÀ suy về OLD (tri(1)) khi một trục không scale (f = 0).
  Ứng viên chưa thử: LOD từng trục + mip 1D (tức M1/OLD) nhưng
  triệt tiêu hạng chéo khi Lx = Ly — hoặc ripmaps. Chưa kiểm chứng
  trong luồng này.
- **sum21 — chữ ký thất bại rõ nhất ở 512×128:** đo [32,96] vs NEW
  **[62,62]** vs OLD **[63,63]** — cả hai model cho tổng HẰNG (bảo
  toàn DC đúng từng điểm) trong khi đo thật biến thiên 3× theo pha
  (aliasing). Ở 256×512: đo [128,128] vs NEW [127,127] vs OLD
  [127,127] — tổng khớp nhưng phân bố sai (NEW rải khối lượng ra
  ±1 px, OLD giữ đúng 1 px).
- **Cross-check Z7:** REF = NEW hệt (RMSE trùng từng chữ số;
  new-vs-ref maxDiff = 0 trên mẫu 1/4 điểm mọi cặp) — code
  production mới đúng như thiết kế; **sai là ở mô hình, không phải
  ở code**.
- Ô tệ nhất NEW, cặp 230×384, điểm (250,248): peak **đo 153**, model
  cho ~93 (lệch 60). Triangle căn pha kỳ vọng 255·sx·sy = 85,9 —
  đo tối đa 153, gấp ~1,8×. Ngược lại điểm (251,248): peak đo 11,
  model NEW cho ~50 (lệch 39 theo hướng ngược). Kernel thật dao động
  theo pha mạnh hơn hẳn mọi mô hình trilinear.
- sum21 đo vs model: 230×384 đo [25,167] vs NEW [53,122] vs OLD
  [49,130]; 282×196 đo [29,123] vs NEW [41,74] vs OLD [25,96] —
  model cho dải hẹp hơn đo (kernel thật biến thiên pha mạnh hơn).
- peak dịch khỏi vị trí kỳ vọng: 32/256 điểm (230×384), 96/256
  (282×196), 64/256 (512×128), **0/256 (256×512)** — cặp 256×512
  peak không dịch vì kernel thật là delta thuần theo y.

## 3. Kernel thật dẹt: hẹp, tách trục, bảo toàn DC — và không khớp họ nào

### 3.1 Dạng kernel (trích trực tiếp từ dữ liệu)

Script: `hidden_files/round74-b2/r74b2-2d-kernel-shape.mjs` —
kiểm rank-1 (SVD 2×2 trên cửa sổ) + hồ sơ hàng/cột trung bình +
peak theo pha.

- **Tách trục gần hoàn hảo:** rank-1 mean|err| **0,003–0,01 ≈ 0** mọi
  cặp — kernel = tích ngoài 2 kernel 1D (như trilinear), chỉ khác
  dạng từng trục.
- **Khối lượng bảo toàn theo DC:** tổng trung bình ≈ kỳ vọng
  255·sx·sy (vd 87,9 vs 85,9 ở 230×384; 128 vs 127,5 ở 256×512).
- **CỰC HẸP:** hồ sơ hàng trung bình qua peak, 230×384:
  `[0, 0, 0, 0, 0, 1,2, 65,5, 1,2, 0, 0, 0, 0]` — hàng xóm chỉ
  **1,8%** peak; hồ sơ cột: `[0, 0, 0, 0, 0,4, 8,3, 65,5, 8,3, 0,4,
  0, 0, 0, 0]` — hàng xóm 12,7%. Trục co nhiều hơn (x, sx=0,4492)
  hẹp hơn hẳn trục co ít hơn (y, sy=0,75): bề rộng kernel **giảm
  khi thang giảm** — ngược với filter average-diện-tích đúng
  (càng co càng rộng).
- **Peak dao động mạnh theo pha:** 230×384 min/max **9/153** (17×);
  theo |δx|: 0,03 → 122,5; 0,48 → 11. 282×196: 12–113 (kỳ vọng
  triangle 53,8). 512×128: 12–76.
- **256×512 (sx=0,5, sy=1,0): peak HẰNG 128 mọi pha, hồ sơ delta
  thuần** — khớp đúng công thức triangle h=1 src px không average
  diện tích (255×0,5×1 = 127,5 → 128). Đây là điểm neo duy nhất
  khớp một kernel đã biết (xem §3.2).

### 3.2 Fit trực tiếp ~30 ứng viên kernel 1D (mô phỏng, không qua resample đầy đủ)

Script: `hidden_files/round74-b2/r74b2-2d-kernel-fit.mjs` (họ
src-space) + `r74b2-2d-kernel-fit2.mjs` (họ dst-space) — mô phỏng
giá trị dst = 255·Kx·Ky/(Nx·Ny), chuẩn hoá Σ=1 theo từng mẫu, so
cửa sổ 13×13 toàn bộ 256 điểm × 6 cặp (259.584 ô). **Không ứng
viên nào khớp tốt:**

| Ứng viên | RMSE toàn bộ | maxAbs | Ghi chú |
|---|---|---|---|
| gaussDst σ=0,3 dst px | **1,5229** | 36 | tốt nhất tổng thể, nhưng vẫn tệ |
| gaussDst σ=0,25 | 1,6573 | 42 | |
| triDst H=0,75 dst px | 1,6948 | 39 | RMSE = 0 ở 256×512, 2,10 ở 230×384 |
| gaussSrc σ=0,5 src px | 1,7661 | 54 | tốt nhất ở 230×384 (0,854), tệ ở 282×196 (1,947) |
| triSrc H=1,25 | 1,9313 | 37 | |
| triSrc H=1 (bilinear thuần) | 2,4333 | 125 | **RMSE = 0 ở 256×512**, 3,14 ở 282×196 |
| triArea H=1/s (= M2) | 2,8326 | 84 | triangle average-diện-tích |
| mitchell | 2,4649 | 92 | |
| lanczos2 / lanczos3 | 3,86 / 4,81 | 143 / 145 | tệ nhất nhóm |
| box(1) | 2,9303 | 89 | RMSE = 0 ở 256×512 |

- Các cặp **ưa kernel khác nhau**: 230×384 ưa gaussSrc(0,5);
  282×196 ưa gaussDst(0,3)/triDst(0,75); 256×512 ưa tri(1)/
  triDst(0,75) đúng từng số. Kernel thật đổi dạng theo thang theo
  cách không họ nào trong này bắt được.
- M1–M4 (trilinear: LOD từng trục 4-mip / thuần triangle / LOD
  thang lớn nhất / LOD trung bình nhân — script
  `r74b2-2d-fit-aniso2.mjs` đã viết) **KHÔNG chạy**: M2 ≡ triArea
  đã đo (RMSE 2,83); M1 ≡ OLD (per-pass = 4 hạng với mip 1D) nên
  đã đo gián tiếp — OLD khớp đúng ở 256×512 nhưng lệch maxAbs 19
  ở đẳng hướng, vậy M1 **không thể** là model thống nhất (xung đột
  trực tiếp với Z7/A1); M3/M4 đều thuộc họ trilinear, bị chặn trên
  bởi cùng bằng chứng kernel hẹp. Chạy thêm chỉ xác nhận lại điều
  đã biết.

### 3.3 Kernel kinh nghiệm trích không giả định họ hàm

Script: `hidden_files/round74-b2/r74b2-2d-kernel-empirical.mjs` —
tách ma trận peak 16×16 (log-domain) thành fx(δx)·fy(δy), rồi gom
mẫu K(u) theo offset u (bin 0,1 dst px).

- 230×384, Kx(u) (u tính bằng dst px): `0:1, ±0,1:0,838,
  ±0,2:0,697, ±0,3:0,478, ±0,4:0,16, ±0,5:0,059, ±0,6:0,043,
  ±0,7–0,8:0, ±0,9–1,1:0,004–0,015` — thùy chính nửa-rộng ~0,5–0,6
  dst px, gần triangle H≈0,53 dst px nhưng rơi nhanh hơn ở 0,4;
  có **đuôi nhỏ ~1% ở ±0,9–1,1** (không phải 0 hẳn).
- Ky(v) cùng cặp (sy=0,75): `±0,1:1, ±0,4:0,572, ±0,6:0,419,
  ±0,9:0,053, ±1,1:0,158, ±1,6:0,055` — không đơn điệu (0,158 ở
  ±1,1 > 0,053 ở ±0,9): pha δy chỉ có 4 giá trị phân biệt nên
  profile có nhiễu lấy mẫu; đuôi ở ±1,1 có thể thật (đuôi phụ) hoặc
  artefact — chưa phân biệt được.
- 512×128, Kx(u) (sx=1,0): `−2:0,096, −1:0,386, 0:1, 1:0,386,
  2:0,096` — gần triangle H≈1,6 dst px + đuôi 0,096 ở ±2 (triangle
  H=1,6 cho 0 ở ±2; Gauss σ=0,72 cho 0,021 ở ±2 — không họ nào khớp
  cả hai điểm cùng lúc).
- Tách peak log-domain: residual RMSE 0,084 (230×384), 0,199
  (282×196), 0,000 (512×128, 256×512 — pha suy biến). Tách không
  hoàn hảo ở cặp giữa → kernel có thể không tách hoàn toàn, hoặc
  peak-pixel selection làm nhiễu (peak dịch 32–96/256 điểm).

**Kết luận §3:** kernel dị hướng thật là một filter **hẹp, gần như
tách trục, không average diện tích theo 1/s** — khác họ với mọi
filter đã thử. Dạng đóng chính xác vẫn mở. Hướng nghiên cứu tiếp:
hai giai đoạn (halve-box ⊛ triangle → trapezoid có flat-top, gợi ý
từ Kx(282×196) phẳng ở |u| ≤ 0,2 và đuôi phụ ở ±0,9–1,3), hoặc
đường đi Skia khác hẳn cho ma trận không đều (cần đọc mã Skia
`SkBitmapProcState`/`SkMipmapAccessor` — chưa làm trong luồng này).

## 4. Đối chứng đẳng hướng: harness đúng, khác biệt là thật

Script: `apps/web/scripts/r74b2-2d-grid-iso-control.mjs` — chạy lại
probe với dst **vuông** 230×230 (s=0,4492) và 384×384 (s=0,75) bằng
**đúng code probe dị hướng** (chỉ đổi dw/dh), rồi so với production
NEW bằng đúng code fit.

| Cặp | sum21 | NEW RMSE | NEW maxAbs | NEW ô ≥ 4 |
|---|---|---|---|---|
| 230×230 | [32,109] | **0,0638** | **1** | 0 |
| 384×384 | [113,177] | **0,0544** | **1** | 0 |

- Số khớp **đúng từng chữ số** với A1 §2 (RMSE 0,0638 / 0,0544) và
  sum21 khớp Z7 — harness dẹt đo đúng; khác biệt dẹt vs vuông là
  **thật**, không phải artefact của probe/script.
- Hệ quả: Chrome/Skia dùng **hai đường filter khác nhau** cho thang
  đều và thang không đều (ít nhất trong cấu hình headless
  `--disable-gpu` / SwiftShader trên VM này). Mô hình production
  blend-at-end chỉ được xác thực cho sx = sy.

## 5. Verdict nhiễu w1920/w2560 tính lại bằng production mới

Script: `hidden_files/round74-b2/r74b2-verify-verdict-w1920-w2560.mjs`
(mẫu A1 `r73a1-verify-verdict-prod.mjs`; W=1280, H=720; w1920
viewport 809×455, s=0,632; w2560 viewport 1733×975, s=1,354
upscale). **Chạy xong: 24/25 check pass (97 s).**

### 5.1 Hai cái bẫy đã gặp và sửa (ghi lại để đợt sau khỏi lặp)

1. **Frame render nguồn tự nhiên SAI ở lần chạy đầu:** script dùng
   `round71-y2/render-nat` thay vì frame rebuild của Z2 —
   plainAbsMad lệch lớn (ocean 3,689 vs gốc 2,678; basgo 1,838 vs
   1,246). Chẩn đoán bằng `r74b2-plainmad-check.mjs`: |headed−new|
   ≈ |headed−old| (basgo 1,838 vs 1,827; |old−new| trung bình 0,102,
   max 5–6) → đổi mô hình không giải thích được. Nguyên nhân thật
   (đọc header `r72z2-analyze.mjs`): Z2 §B dùng frame render MỚI
   `hidden_files/round72-z2/render-1k/fullrgb-{ocean,basgo,
   slovenska}-{plain,noise05,noise10}.raw`; chỉ test-pattern tái
   dùng frame T3. Đã sửa script và chạy lại.
2. **Artifact float ở ngưỡng 0,35:** một lần "lật" ocean-noise05
   giả (Δkurt 0,35) do float: 0,79−0,44 = 0,35000000000000003 >
   0,35 trong hàm verdict — không phải kết quả thật. Sau khi sửa
   frame (mục 1), không còn hiện tượng này.

### 5.2 Kết quả sau sửa

- **w1920 — plainAbsMad khớp baseline trong 0,004 mọi nguồn**
  (test-pattern 1,019 vs 1,026; ocean 2,682 vs 2,678; basgo 1,250
  vs 1,246; slovenska 1,917 vs 1,92).
- **w1920 — Δkurt R:**

| Nguồn | noise05 (Y2 → mới) | noise10 (Y2 → mới) |
|---|---|---|
| test-pattern | 0,33 → 0,28 | **0,38 → 0,34 — LẬT THẬT: LỆCH → KHỚP** |
| ocean | 0,34 → 0,34 | 0,31 → 0,31 |
| basgo | 0,14 → 0,14 | 0,12 → 0,12 |
| slovenska | 0,14 → 0,15 | 0,24 → 0,24 |

  **7/8 verdict không đổi; 1 lật thật.** Check FAIL duy nhất trong
  log là ô test-pattern noise10 này (thay đổi thật, không phải lỗi
  script). Δkurt dịch tối đa 0,05 (0,38→0,34), lớn hơn mức dịch ở
  w1440 (≤0,02) — đúng hướng Z7 §6 đã dự đoán (lại gần dải Y8 hơn).
- **w2560 — số Y HỆT từng chữ số** (noise05 Δkurt 0,38; noise10
  0,43; cả hai vẫn LỆCH) — đúng như dự đoán: upscale λ*=0, f=0 nên
  blend-at-end ≡ blend-từng-pass (thuần bilinear). plainAbsMad
  1,029 = 1,029.
- **"khớp số: KHÔNG" (±0,011) ở mọi ô w1920:** do Δcorr — mô hình
  mới cho Δcorr nhỏ hơn một cách hệ thống ở w1920 (vd basgo
  0,025→0,004; ocean 0,076→0,057) — mọi giá trị vẫn xa ngưỡng 0,12,
  không ảnh hưởng verdict. Ngưỡng ±0,011 (A1 hiệu chuẩn ở w1440)
  quá chặt cho Δcorr ở w1920 — chỉ là ghi chú báo cáo, không phải
  lệch mới.
- Dữ liệu: `hidden_files/round74-b2/r74b2-verify-verdict-w1920-w2560.json`
  (+`.log`).

## 6. Khoảng thiếu Δkurt R của mô hình nhiễu Y8: điều tra xong, tái khung

### 6.1 Đối chiếu mô hình

Mô hình Y8 (`addYuvNoiseSim`, port verbatim từ
`apps/web/src/lib/effectCanvas.ts` ~dòng 697–762): sigma =
strength/√3, strengths noise05=28 / noise10=50, RNG mulberry32,
nhiễu chroma theo khối 2×2, kẹp YUV [0,255]; delta0 qua
`buildShifted` X6, K_CB=1,04, K_CR=1,12. Đã đối chiếu code thật:
port sim khớp verbatim (ghi float vào ImageData = làm tròn+kẹp như
`clamp255` của sim).

### 6.2 Thí nghiệm chính: 5 biến thể (script `r74b2-noise-gap.mjs`, 562 s)

Chỉ test-pattern, w1440 + w2560, baseline 5 seed + mỗi biến thể 3
seed, chia sẻ frame full-res. Biến thể: A baseline; E1 base =
buildShifted(plain); E2 sigma×1,1; E3 nhiễu cộng SAU resample (tại
viewport); E4 hỗn hợp đuôi nặng (95% N(0,σ)+5% N(0,3σ), chuẩn hoá
cùng phương sai); E5 base = YUV420 round-trip (Y uint8 + chroma
subsample 2×2 uint8 rồi về RGB).

| Ô | Đo Δkurt R | A | E1 | E2 | E4 | E5 | E3 (stdRatio) |
|---|---|---|---|---|---|---|---|
| w1440 noise05 | **0,27** | 0,162 | 0,060 ✗ | 0,087 ✗ | 7,84 ✗✗ | **0,197** | 7,03 (1,83) ✗ |
| w1440 noise10 | **0,32** | 0,250 | 0,170 | 0,147 | 3,94 | **0,283** | 2,48 (1,52) |
| w2560 noise05 | **0,38** | 0,172 | 0,090 | 0,133 | 10,50 | **0,190** | 2,01 (1,33) |
| w2560 noise10 | **0,43** | 0,302 | 0,190 | 0,153 | 5,04 | **0,313** | 1,03 (1,23) |

- **E5 là biến thể duy nhất đi đúng hướng:** w1440 đóng ~1/3
  khoảng thiếu (noise05 0,162→0,197; noise10 0,250→0,283) trong
  khi stdRatio nguyên vẹn (1,03). w2560 E5 chỉ đóng ~0,02
  (0,172→0,190) — round-trip YUV420 không giải thích được khoảng
  thiếu lớn hơn ở w2560.
- **E1 sai hướng** (0,060 < 0,162) — và bị bác độc lập:
  plainAbsMad vs snapPlain: renderPlain **1,049** | shifted 2,071
  | yuv420rt 1,108 (w1440) — preview plain thật gần render plain
  nhất, KHÔNG phải shifted.
- **E2 sai hướng + vỡ stdRatio** (1,17 vs đo 1,02) — tăng sigma
  làm Δkurt GIẢM (do kẹp/clipping tăng), không tăng.
- **E3 bị loại dứt khoát:** Δkurt vọt 2–7, stdRatio 1,33–1,83 —
  nhiễu cộng TRƯỚC resample, như Y8 đã giả định.
- **E4 bị loại dứt khoát:** hỗn hợp 5% ở 3σ cho Δkurt 3,94–10,5
  (gấp 10–30× khoảng thiếu) — nhiễu thật không nặng đuôi ở mức này.
- Số kẹp: noise05 clampY ~1.282 px, clampC ~105k px / 921.600 px;
  noise10 clampY ~21,5k, clampC ~223k.

### 6.3 Follow-up: phân rã m4, sigma×0,9, hỗn hợp vi lượng, kurt full-res

Script: `hidden_files/round74-b2/r74b2-noise-gap2.mjs` (320 s).

- **m4-decomp w1440 seed=1:** noise05 đo kurtR 3,22 stdR 12,74,
  share [0,0113, 0,1333, 0,2851, 0,2724, 0,1636, 0,0871, 0,0471,
  0]; sim kurtR 3,17 stdR 12,94, share [0,0125, 0,1346, 0,2702,
  0,2861, 0,1816, 0,0777, 0,0316, 0,0057], top20 max 107,2 vs đo
  94,8. noise10: đo 1,98 vs sim 1,96, share gần trùng. Đuôi
  P(≥3σ) đo-vs-sim gần như trùng (noise05 0,0155 vs 0,0170; ≥4σ
  0,00378 vs 0,0037; noise10 0,01234 vs 0,0124); share moment-4
  theo quintile gradient/luma/sat/|d0| gần như trùng; phần thiếu
  **KHÔNG khu trú ở bin nào** (chỉ hơi cao ở quintile gradient cao
  nhất 0,258 vs 0,242 và |d0| cao nhất 0,258 vs 0,25).
- **TÁI KHUNG khoảng thiếu (quan trọng nhất §6): phần lớn là
  PHƯƠNG SAI SEED, không phải thiếu hệ thống lớn.** Seed 1 cho
  Δkurt 0,22 (noise05) gần đo 0,27; dải 5 seed noise05 [0,09–0,23]
  vs đo 0,27 (trên max 0,04); noise10 [0,21–0,30] vs đo 0,32
  (trên max 0,02). Khoảng thiếu trung bình 0,11/0,07; E5 đóng
  ~0,035; phần còn lại trong ~1,5 độ lệch chuẩn seed.
- **sigma×0,9: Δkurt VƯỢT** (noise05 0,527 vs 0,27; noise10 0,43
  vs 0,32; w2560 0,60 vs 0,38) và stdRatio vỡ xuống 0,89–0,90
  (đo 1,01–1,03). Kết hợp E2 ×1,1 (thiếu + std 1,13–1,17):
  **sigma đúng ở ×1,0; khoảng thiếu KHÔNG phải lỗi sigma.**
- **Hỗn hợp vi lượng: 0,5% → Δkurt 2,06** (noise05 w1440), 0,85
  (noise10); 1% → 3,66/1,38; w2560 tương tự. Ngay cả 0,5% cũng
  gấp ~8× quá nhiều. **Nhiễu thật KHÔNG nặng đuôi hơn Gauss; hỗn
  hợp bị loại tới mức <0,1%.**
- **Kurt full-res sim (trước resample):** noise05 ΔkurtR 0,100
  (sim 5,75 vs render 5,65); noise10 0,260 (4,22 vs 3,96) —
  khoảng thiếu đã có ở full-res; resample về w1440 khuếch đại thêm.
- **Hướng còn lại có thể:** lượng tử hoá DCT trong decode thật
  (round-trip YUV420 của E5 chưa mô phỏng DCT). Chưa kiểm chứng
  trong luồng này — cần thí nghiệm encode/decode JPEG thật (nợ §8).

## 7. Giới hạn còn lại / nợ mở

1. **Kernel dị hướng chưa có dạng đóng** (§3): production
   blend-at-end chỉ xác thực cho sx = sy. Mọi phân tích parity
   dùng viewport scale đều (sx = sy) nên không bị ảnh hưởng; hình
   học dẹt (vd video dọc xuất ngang, thumbnail dẹt) chưa có model
   đúng. **Manh mối mới nhất:** OLD khớp đúng ở 256×512 (fy = 0,
   hạng chéo triệt tiêu) — model thống nhất phải suy về NEW khi
   sx = sy và về OLD khi một trục f = 0. Cần: đọc mã Skia (đường
   mip cho ma trận không đều) và/hoặc thử M1 với mip 1D + kiểm tra
   đẳng hướng có còn khớp không.
2. **Fit-1 đã xong cả 6 cặp** (cặp 4–6 chạy lại bằng subset p456,
   EXIT=0, 311 s; xem §9.1). Không còn nợ đo nào trong mục này.
3. **DCT trong decode thật** chưa mô phỏng (hướng còn lại cho
   khoảng thiếu Y8, §6.3) — cần encode/decode JPEG thật so với
   YUV420 round-trip.
4. **Ocean w1440 (Δkurt G 1,12 + Δcorr 0,233)** vẫn chưa giải thích
   xong (nợ kế thừa Z7 §9.4 / A3 §4.6) — do bước scale video-path
   1920→1280, ngoài phạm vi luồng này.
5. **GPU thật / Safari thật vẫn chưa đo** (nợ kế thừa; mọi kết luận
   chỉ đúng trên CPU/SwiftShader + Chromium 158).
6. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403
   quyền, chờ user) — nợ chung.
7. Ngưỡng khớp số ±0,011 của script verify-verdict (hiệu chuẩn ở
   w1440) quá chặt cho Δcorr ở w1920 (§5.2) — đợt sau nên hiệu
   chuẩn lại ngưỡng theo cửa sổ, hoặc so verdict thay vì so số
   tuyệt đối.

## 8. Đã làm / không làm

1. **ĐÃ** probe headed dị hướng 6 cặp (1.536 điểm, determinism
   byte-identical) + fit NEW/OLD + fit ~30 kernel + trích kernel
   kinh nghiệm + đối chứng đẳng hướng (harness đúng).
2. **ĐÃ** tính lại verdict w1920/w2560 bằng production mới (24/25
   check; 1 lật thật test-pattern noise10 w1920).
3. **ĐÃ** điều tra khoảng thiếu Y8: 5 biến thể + 4 follow-up, tái
   khung thành phương sai seed + E5 đóng một phần.
4. **KHÔNG** sửa production (không có mô hình thay thế đã kiểm
   chứng); **KHÔNG** sửa code sản phẩm web nào; **KHÔNG** chạy lại
   headed capture; **KHÔNG** push/tag/binary/workflow; **KHÔNG**
   chạy tsc (không đụng code TS nào — chỉ script `.mjs` + docs).
5. **KHÔNG** chạy M1–M4 (lý do ở §3.2) — script đã viết, để lại
   trong hidden_files nếu đợt sau cần.

## 9. Ghi chú vận hành (để đợt sau khỏi lặp)

1. **Phiên nền fit-1 gốc bị mất giữa chừng:** process nền
   `r74b2-2d-fit-aniso.mjs` (session `proc_62779c2cea92`) biến mất
   khỏi danh sách process sau cặp 3 (log dừng ở 903 s, không có
   JSON, `ps` không thấy process). Đã kiểm tra đĩa trước khi kết
   luận (theo skill verify_delegated_work): cặp 1–3 có log đầy đủ,
   cặp 4–6 chưa chạy. Khắc phục: chạy lại riêng 3 cặp còn lại
   bằng script subset `r74b2-2d-fit-aniso-p456.mjs` (lọc 3 cặp,
   ghi `r74b2-2d-fit-aniso-p456.json/.log`) — **đã xong, EXIT=0,
   311 s**, bảng §2 đã đầy đủ cả 6 cặp (kèm phát hiện OLD khớp
   đúng ở 256×512).
2. **Lần chạy probe đầu FAIL do redirect log:** thư mục
   `round74-b2` chưa tồn tại lúc launch → shell redirect thất bại,
   exit 1. Luôn `mkdir -p` thư mục log trước khi launch.
3. **Frame render nguồn tự nhiên:** Z2 §B dùng frame rebuild
   `round72-z2/render-1k/`, không phải `round71-y2/render-nat`
   (§5.1) — và hàm verdict có artifact float ở ngưỡng 0,35.
4. **Chi phí tính:** fit-1 resample full-plane 512×512 mỗi điểm
   (~1,4 s/điểm, ~5–6 phút/cặp); kernel-fit mô phỏng trực tiếp
   chỉ ~12 s cho toàn bộ 6 cặp — lần sau fit kernel trước, fit
   full-plane sau.

## 10. Files

- LIMITS này: `docs/PHASE9_ROUND74_B2_RESAMPLE_ANISO_LIMITS.md`
- Probe stageable: `apps/web/scripts/r74b2-2d-grid-aniso.mjs`,
  `apps/web/scripts/r74b2-2d-grid-iso-control.mjs`
- Log luồng:
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round74-b2.md`
- Verify nội bộ (KHÔNG stage — goal hidden_files):
  `hidden_files/round74-b2/` — `r74b2-2d-fit-aniso.mjs` (+`.log`,
  JSON cặp 1–3), `r74b2-2d-fit-aniso-p456.mjs` (+`.log/.json`),
  `r74b2-2d-fit-aniso2.mjs` (M1–M4, chưa chạy),
  `r74b2-2d-kernel-shape.mjs` (+`.json`),
  `r74b2-2d-kernel-fit.mjs` (+`.json`),
  `r74b2-2d-kernel-fit2.mjs` (+`.json`),
  `r74b2-2d-kernel-empirical.mjs` (+`.json`),
  `r74b2-verify-verdict-w1920-w2560.mjs` (+`.json/.log`),
  `r74b2-plainmad-check.mjs`, `r74b2-noise-gap.mjs` (+`.json/.log`),
  `r74b2-noise-gap2.mjs` (+`.json/.log`),
  `r74b2-2d-grid-aniso.json` (+`.log`), `r74b2-2d-grid-iso-control.json`
  (+`r74b2-chrome-iso.log`), `r74b2-chrome.log`, `chrome-userdata-b2/`,
  `chrome-userdata-b2-iso/`.
- Batch stage (KHÔNG push):
  `~/workspace/repo-1-push/paths-loop/phase9-round74-b2-resample-aniso.txt`
  — 3 entry (LIMITS này + 2 probe script).
