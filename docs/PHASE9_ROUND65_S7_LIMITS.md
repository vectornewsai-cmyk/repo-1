# PHASE9 ROUND65 S7 — LIMITS (chroma-rail simulation: noise N3 + sharpen S7)

Đợt 65, luồng S7. Nợ đóng: #7 từ `docs/PHASE9_ROUND64_LIMITS.md` §8 + §1/§4
(R64 R9: noise headed LỆCH-THỐNG-KÊ, sharpen XẤP XỈ le8 98,6%).
Hướng sửa: mô phỏng kẹp chroma-rail trong preview/effect canvas; đo lại
trên frame pre-encode / CRF 0 để tách lỗi mô phỏng khỏi lỗi encoder.

## 0. Kết luận ngắn (đọc trước)

- **Noise — model ĐÃ KHỚP ở full-res pre-encode (KHỚP-THỐNG-KÊ cả
  noise05 lẫn noise10, 4 seed, khái quát sang nội dung khác).**
  Headed vẫn LỆCH-THỐNG-KÊ, nhưng tỉ lệ std đã tốt lên rõ (w1440 R:
  2,95 → 1,90 bilinear / 1,32 lanczos) và phần dư nay là **lỗi
  resample viewport** (Chrome "high" vs ffmpeg bilinear/lanczos),
  không còn là lỗi model: ở full-res model khớp; sau resample, phân
  phối nhiễu của 2 đường biến đổi khác nhau (kurt render R 6–9, corr
  RG render −0,2 — dấu hiệu resample, không có ở full-res).
- **Sharpen — vẫn XẤP XỈ.** Full-res pre-encode delta MAD cải thiện
  (0,194 → 0,161 sharp05; 0,261 → 0,214 sharp10) nhưng le8 headed
  tốt nhất 98,3% (w2560 sharp05, pre-encode/bilinear), chưa tới 99%.
  Phần dư tập trung ở biên màu bão hoà; kernel đã xác nhận đúng bằng
  step-edge profile nên không phải lỗi kernel.
- **Glitch — đính chính model (phát hiện phụ, có số đo):** nhiễu glitch
  trong render thật chạy trên **plane RGB**, không phải yuv420p như
  R63 R8 giả định. Preview glitch đã sửa sang nhiễu Gauss RGB; nay
  khớp render (TB chênh ≤ 0,2, std chênh ≤ 0,5 trên fixture 64×8).
- **Parity test sharpen — đính chính chuỗi render (phát hiện phụ):**
  test cũ áp `unsharp` trực tiếp lên RGB24 (FFmpeg tự chèn convert
  bt601) trong khi render thật dùng bt709 — 2 render lệch nhau MAD
  2,2–4,9. Test đã sửa sang bt709-yuv444p; cả 4 case pattern/natural
  nay KHỚP với S7.

## 1. Noise: model N3 (chroma base expansion) — KHỚP ở full-res

### 1.1 Cơ chế đúng (probe 1–2)

- Rail-clip-only (kẹp plane sau khi cộng nhiễu) có **ZERO tác dụng**
  (std không đổi): `av_clip_uint8` không phải cơ chế chính.
- Cơ chế chính là **chiếu gamut (gamut projection)**: base YUV native
  của render nằm NGOÀI khối RGB (31,4% mẫu U và 30,9% mẫu V chạm rail
  ≤16/≥240 ở testsrc2 frame 30; qua RGB roundtrip 0%), nên nhiễu cộng
  vào base đó bị chiếu văng khi convert YUV→RGB; preview cộng nhiễu
  vào base derived (đã bị kéo vào trong gamut) nên nhiễu sống sót.
- Sửa đúng: đổi **base nhiễu** sang base native ước lượng, không phải
  chỉ kẹp nhiễu. Hồi quy native-theo-derived: U = 1,0402·derived − 5,3;
  V = 1,091·derived − 12,19 (frame 30 testsrc2).

### 1.2 Model N3 (đã vào code — `addYuvNoise`, `effectCanvas.ts`)

- Chroma base ước lượng theo khối 2×2: mean derived của khối, mở rộng
  tuyến tính về rail: `est = 128 + k·(derived − 128)`, kẹp [16, 240],
  với **kCb = 1,04, kCr = 1,12** (lưới probe 4: kV = 1,12 là điểm duy
  nhất trong lưới cho noise05 KHỚP; kV 1,09 → Δkurt R 0,61; 1,15 →
  0,53; kU 1,06/1,02 phá kurt B).
- Nhiễu cộng vào base est (Cb/Cr theo mẫu chroma, Y giữ base derived),
  kẹp plane [0, 255], convert về RGB. Thứ tự rút RNG giữ nguyên
  (Cb hết, Cr hết, rồi Y từng pixel row-major) nên tính xác định của
  glitch/noise theo seed không đổi.

### 1.3 Số đo full-res pre-encode (probe 4–5, frame 30 testsrc2, so với render pre-encode)

| variant | tỉ lệ std [R,G,B] | Δkurt [R,G,B] | Δcorr | verdict |
|---|---|---|---|---|
| noise05, kU=1,04/kV=1,12 | [1,02, 0,99, 1,05] | [0,00, 0,31, 0,02] | ≤ 0,034 | **KHỚP-THỐNG-KÊ** |
| noise10, kU=1,04/kV=1,12 | [1,05, 0,97, 1,05] | [0,10, 0,12, 0,19] | ≤ 0,034 | **KHỚP-THỐNG-KÊ** |

- 4/4 seed KHỚP cho cả 2 mức (seed 42, 43, 7, 1234; kurt R Δ
  0,00–0,20 ở noise05). Band KHỚP của kV: [1,11, 1,14] (1,10 trượt
  sát nút Δkurt R 0,36; 1,14 pass ở 0,35).
- Khái quát (không overfit testsrc2): nội dung desaturated
  (saturation 0,3): KHỚP (tỉ lệ [1,01, 1,00, 1,01], Δkurt ≤ 0,09);
  smptebars: KHỚP (tỉ lệ [0,98, 0,99, 1,00], Δkurt ≤ 0,19).
- Đối chiếu code cũ (N0): noise05 tỉ lệ std [1,34, 1,00, 1,17],
  kurt R Δ 2,94 → N3 sửa cả std lẫn kurt.
- N3b (dùng Y_est làm base nhiễu) BỊ LOẠI: kurt R Δ 1,06–1,25 →
  LỆCH. N3 giữ Y base derived (Y native ≈ Y derived, 0% chạm rail).

### 1.4 Headed — vẫn LỆCH-THỐNG-KÊ, phần dư là resample (không phải model)

Headed harness 7/7 pass, 0 lỗi trang ở cả 3 cửa sổ; so sánh
`parity-65s7-compare.mjs` (pre-encode ≡ CRF 0 từng số — CRF 0
lossless nên trùng pre-encode, xác nhận chuỗi pre-encode sao đúng
render.js; CRF 18 tệ hơn một chút). Video rect / scale:

| cửa sổ | video rect | scale |
|---|---|---|
| w1440 | 489×275 | 0,382 |
| w1920 | 809×455 | 0,632 |
| w2560 | 1733×975 | 1,354 (upscale) |

Noise05, pre-encode (render R64 CRF 0 cho số giống hệt):

| cửa sổ | scaler | tỉ lệ std [R,G,B] | Δkurt [R,G,B] | Δcorr RG | verdict |
|---|---|---|---|---|---|
| w1440 | bilinear | [1,90, 1,33, 1,77] | [5,50, 0,31, 2,91] | 0,272 | LỆCH |
| w1440 | lanczos | [1,32, 1,00, 1,24] | [4,07, 0,32, 2,38] | 0,286 | LỆCH |
| w1920 | bilinear | [1,55, 1,25, 1,46] | [4,55, 0,25, 1,97] | 0,233 | LỆCH |
| w1920 | lanczos | **[1,08, 0,96, 1,05]** | [2,09, 0,25, 0,91] | 0,232 | LỆCH |
| w2560 | bilinear | [1,40, 1,03, 1,39] | [3,06, 0,14, 1,61] | 0,001 | LỆCH |
| w2560 | lanczos | [0,98, 0,80, 1,00] | [1,24, 0,07, 0,73] | 0,016 | LỆCH |

Noise10 tương tự (w1920/lanczos std [1,07, 0,92, 1,05] KHỚP-std,
Δkurt [1,17, 0,77, 0,67], Δcorr RG 0,162; w2560 corr KHỚP hết
Δcorr ≤ 0,111 cả 2 scaler).

Bằng chứng phần dư là resample, không phải model:

1. **Tỉ lệ std thu hẹp khi scale → 1:** w1440 R 1,90 → w1920
   1,08 (lanczos) → w2560 0,98. Ở full-res (scale 1, không resample)
   tỉ lệ là 1,02–1,05 (KHỚP). Resample một mình gây ra phần lớn
   tỉ lệ thừa.
2. **Scaler đổi kết quả mạnh:** bilinear vs lanczos đổi tỉ lệ std
   R từ 1,90 → 1,32 (w1440) — đúng hệ số resampler 1,44× của
   phân rã R64 R9. Chrome `imageSmoothingQuality="high"` (preview
   drawImage) giữ nhiễu cao tần khác cả 2 scaler ffmpeg.
3. **Kurt/corr của RENDER đổi dấu sau resample:** ở full-res,
   render noise05 có kurt [5,73, 0,09, 3,61], corr RG +0,15. Sau
   downscale bilinear w1440, render có kurt R **8,46** (tăng, không
   giảm như trung bình tuyến tính kỳ vọng) và corr RG **−0,219**
   (đổi dấu). Preview có kurt R 2,96, corr RG +0,053. Lệch kurt/corr
   headed là lệch GIỮA 2 phép resample, không phải giữa 2 model
   nhiễu — model đã khớp trước khi resample.
4. **CRF 0 ≡ pre-encode từng số** ở mọi variant/cửa sổ → codec
   không đóng góp gì thêm ở CRF 0; CRF 18 chỉ tệ hơn chút ít.

**Nợ còn lại (cho đợt sau):** headed noise parity cần khớp phép
resample viewport — hoặc mô phỏng đúng filter downscale của Chrome
trong harness, hoặc áp nhiễu sau downscale trong preview (đổi kiến
trúc effect), hoặc đo headed ở scale ≈ 1. Không nên sửa model N3
thêm: model đã khớp ở full-res và mọi can thiệp vào model để "bù"
resample sẽ phá khớp full-res.

## 2. Sharpen: model S7 (bt709 + Y_est) — vẫn XẤP XỈ, MAD cải thiện

### 2.1 Model S7 (đã vào code — `applySharpen`, `effectCanvas.ts`)

- Luma **bt709** (Y của render là plane Y bt709, không phải bt601 —
  xác nhận bằng step-edge profile: delta Y render trên step xám
  [0,0,0,0,−8,−38,37,7,0,0,0,0] khớp nhị thức [−7,6,−37,8,37,8,7,6]
  trong sai số làm tròn; Gauss σ1,0 tệ hơn rõ).
- Kernel nhị thức [1,4,6,4,1]/16 (xác nhận đúng — không phải nguyên
  nhân dư). Các biến thể biên (clamp/mirror/renorm) cho số giống hệt
  → không phải xử lý biên. YUV420 chroma averaging tệ hơn S2 → không
  phải subsampling.
- Delta tính từ **Y native ước lượng** (`estimateNativeY`, 2 bước
  hiệu chỉnh gamut-offset, đúng hệ số ×219/255) thay vì Y derived:
  Y native lệch Y derived tới ~+10–17 ở vùng bão hoà. Delta áp qua
  chroma native ước lượng theo khối 2×2 (est-chroma delta) để triệt
  tiêu base-shift, chỉ giữ phần delta như render.

### 2.2 Số đo full-res pre-encode (delta MAD/le8, frame 30 testsrc2)

| variant | S0 (cũ: bt601+RGB) | S2 (bt709+YUV) | S7 (mới) |
|---|---|---|---|
| sharp05 | MAD 0,29 / le8 98,1% | 0,194 / 98,1% | **0,161 / 98,3%** |
| sharp10 | MAD 0,499 / le8 96,8% | 0,261 / 97,6% | **0,214 / 97,5%** |

S7 tốt nhất ở full-res cả 2 mức (MAD giảm ~17–18% so với S2).

### 2.3 Số đo parity test Node (chuỗi render đã đính chính — xem §4)

| nguồn | t | S0 | S2 | S7 |
|---|---|---|---|---|
| pattern 72×45 | 0,5 | 0,585 / 99,5% KHỚP | 0,447 / 100% KHỚP | 0,493 / 100% KHỚP |
| pattern 72×45 | 1,0 | 0,74 / 97,2% XẤP XỈ | 0,472 / 100% KHỚP | 0,587 / 100% KHỚP |
| natural 72×45 | 0,5 | 1,123 / 98,2% XẤP XỈ | 0,521 / 100% KHỚP | 0,603 / 100% KHỚP |
| natural 72×45 | 1,0 | 1,713 / 92,8% XẤP XỈ | 0,557 / 100% KHỚP | 0,707 / 99,2% KHỚP |

S2 nhỉnh hơn S7 một chút trên pattern/natural (MAD thấp hơn
~0,05–0,15) nhưng S7 tốt hơn trên testsrc2 thật; cả 2 đều KHỚP
cả 4 case với chuỗi bt709 đúng. Giữ S7 (quyết định theo nội dung
thật, không theo fixture tổng hợp).

### 2.4 Số đo headed (delta, pre-encode/bilinear; CRF 0 giống hệt)

| cửa sổ | sharp05 MAD / le8 | sharp10 MAD / le8 |
|---|---|---|
| w1440 | 0,419 / 97,3% | 0,631 / 95,5% |
| w1920 | 0,336 / 98,2% | 0,522 / 96,7% |
| w2560 | **0,319 / 98,3%** | 0,454 / 97,2% |

- Tốt nhất đợt này: le8 **98,3%** (w2560 sharp05), sát kỷ lục R64
  98,6% (w1920 sharp05, CRF 0, scaler area) nhưng chưa vượt qua
  ngưỡng KHỚP 99%. MAD cải thiện theo cửa sổ (0,419 → 0,319).
- Sàn đo: đối chứng plain tuyệt đối đã chỉ XẤP XỈ (MAD 1,23,
  le8 96,0% w1440 pre-encode/bilinear) — decode + resample viewport
  một mình đã lệch le8 4%; sharpen tuyệt đối (MAD 1,15–1,56) nằm
  trong cùng bậc với sàn này.
- Phần dư tập trung ở biên màu bão hoà (probe 4: lưới step-4,
  lỗi > 8 tập trung y ≥ 128: 943/969 điểm; biên clamp/mirror/
  renorm không đổi số) — ước lượng Y_est/chroma-est chưa chính xác
  tuyệt đối ở vùng bão hoà. **Nợ còn lại:** cần mô hình ước lượng
  base native chính xác hơn ở vùng bão hoà (hoặc chấp nhận XẤP XỈ:
  le8 98,3% đã sát 99% và MAD delta ≤ 0,64 ở mọi điều kiện đo).

## 3. Glitch: đính chính không gian nhiễu (R63 R8 sai)

- Chuỗi render glitch: `format=yuv420p,rgbashift=...,noise=...`.
  FFmpeg tự chèn scale **yuv420p→gbrp** cho rgbashift (log verbose
  probe9) và noise chạy tiếp trên các plane RGB đó — KHÔNG quay về
  yuv420p. Đo thật (fixture 64×8, ns=20): delta render vs
  shift-only có std [11,13, 10,85, 11,07] ≈ σ = 20/√3 = 11,55 và
  corr chéo kênh [0,038, −0,003, 0,008] ≈ 0 — đúng dấu hiệu nhiễu
  RGB độc lập, sai dấu hiệu YUV (std [24,7, 15,0, 27,9],
  corr [0,15, 0,26, 0,30]).
- Sửa: `applyGlitch` dùng `addRgbNoise` mới (Gauss độc lập từng kênh
  RGB, σ = ns/√3, rút RNG R,G,B từng pixel row-major) thay cho
  `addYuvNoise`. `addYuvNoise` (N3) chỉ còn dùng cho effect noise.
- Đo sau sửa (seed 42): preview TB/std từng kênh [8,12/10,63,
  9,13/11,41, 8,62/10,72] vs render TB [8,04, 8,98, 8,84] / std
  [11,13, 10,85, 11,07] — khớp trong 0,2 TB / 0,5 std.
- Ngưỡng test cập nhật theo số đo thật (không nới lặng): unit test
  dùng lý thuyết RGB TB 9,22/std 11,55 với band [0,8, 1,25] (giá trị
  đo nằm trong band); parity test dùng TB 7–13/std 9–15 (đo thật
  TB 8,84/std 11,23; ngưỡng vẫn phân biệt được model YUV sai —
  std ~22 sẽ rớt).

## 4. Parity test sharpen: đính chính chuỗi render (R63 R8 cùng họ lỗi)

- Test cũ: `renderEffect(unsharp…)` áp trực tiếp lên RGB24 →
  FFmpeg tự chèn convert với ma trận mặc định **bt601**, trong khi
  render thật (render.js, nguồn HD) dùng **bt709**. Đo thật (probe9):
  2 render lệch nhau MAD 2,227 (pattern t=0,5) tới 4,857 (natural
  t=1) — test cũ đo model bt601 cũ là "KHỚP" và model bt709 mới là
  "XẤP XỈ", ngược với pipeline thật.
- Sửa: thêm `renderEffectYuv444` (bt709 tường minh, yuv444p thay vì
  yuv420p vì unsharp chỉ động vào luma Y full-res ở cả 2 format nên
  delta giống hệt render yuv420p thật, trong khi yuv420p đưa
  subsampling chroma vào base — MAD ~2,1–4,8 cho MỌI model, át cả
  model, probe9). Base roundtrip bt709-yuv444p chỉ MAD 0,37–0,40.
- Chuỗi yuv420p bt709 tường minh đã thử và LOẠI (probe9): MAD
  2,1–4,8 cho mọi model do subsampling base, không đo được model.

## 5. Kiểm chứng đã chạy (lệnh + kết quả thật)

- `node --experimental-strip-types apps/web/src/lib/effectCanvas.test.ts`
  → **PASS 14 test** (glitch fail 1 lần giữa chừng với model N3/YUV
  cũ — TB kênh R 13,31 < ngưỡng 15,78 — đã sửa bằng §3, nay xanh).
- `node --experimental-strip-types apps/web/src/lib/effectCanvas.parity.test.ts`
  → **PASS 15 test** (sharpen t=1 fail 1 lần giữa chừng với chuỗi
  bt601 cũ — le8 97,7% < 99% — đã sửa bằng §4, nay xanh; S7 KHỚP
  cả 2 case sharpen với chuỗi bt709 mới).
- `cd apps/web && npx tsc --noEmit` → exit 0, 0 lỗi (đã xoá hàm
  `luminance` chết sau khi applySharpen chuyển sang bt709).
- `cd apps/web && npx vite build` → pass (built in 8,80s).
- Headed (vite dev + Xvfb + CDP, Chromium 1254): w1440/w1920/w2560
  đều **7/7 pass, 0 lỗi trang**.
- So sánh (`parity-65s7-compare.mjs`, 3 đích × 2 scaler): pre-encode
  ≡ CRF 0 từng số; CRF 18 tệ hơn chút ít (xem §1.4/§2.4).
- Spec R65 đã verify byte-identical với spec R63 (cả 5 file) trước
  khi tái dùng render R64.

## 6. File đổi (fragment round65-s7)

- `apps/web/src/lib/effectCanvas.ts` — N3 (noise), S7 (sharpen),
  `addRgbNoise` (glitch), xoá `luminance` chết, cập nhật comment.
- `apps/web/src/lib/effectCanvas.test.ts` — ngưỡng glitch sang
  nhiễu RGB (§3).
- `apps/web/src/lib/effectCanvas.parity.test.ts` — sharpen dùng
  chuỗi bt709-yuv444p (§4); ngưỡng glitch sang RGB (§3).
- `apps/web/scripts/parity-65s7-rail-clamp-headed.mjs` — harness
  headed đợt 65 S7 (bản sao R63, đổi round).
- `apps/web/scripts/parity-65s7-compare.mjs` — so sánh 3 đích ×
  2 scaler (mới).
- `docs/PHASE9_ROUND65_S7_LIMITS.md` — tài liệu này.

## 7. Nợ mở (trung thực, chưa đóng)

1. **Noise headed vẫn LỆCH-THỐNG-KÊ** ở cả 3 cửa sổ (xem §1.4):
   nguyên nhân còn lại là resample viewport, không phải model
   nhiễu. Cần đợt riêng khớp phép resample (mô phỏng filter
   downscale của Chrome, hoặc áp nhiễu sau downscale, hoặc đo ở
   scale ≈ 1).
2. **Sharpen vẫn XẤP XỈ** (le8 tốt nhất 98,3% < 99%): phần dư ở
   biên màu bão hoà; ước lượng base native (Y_est/chroma-est) chưa
   chính xác tuyệt đối ở đó. S2 nhỉnh hơn S7 một chút trên
   pattern/natural nhưng S7 tốt hơn trên testsrc2 thật — nếu đợt sau
   tìm được estimator tốt hơn, đo lại cả 2 nguồn trước khi đổi.
3. **Hệ số kCb/kCr (1,04/1,12) hiệu chuẩn trên testsrc2** (nội dung
   bão hoà cao). Đã kiểm khái quát trên desaturated + smptebars
   (KHỚP), nhưng chưa kiểm trên nội dung tự nhiên thật (video quay
   tay / ảnh người). Nếu nội dung tự nhiên cho tỉ lệ std lệch,
   cần hiệu chuẩn lại k theo độ bão hoà trung bình.
4. **Y_est có sai số hệ thống nhỏ** (signed mean −1,00 trên frame 30
   testsrc2 — estimator 2 bước chưa hội tụ hoàn toàn); ảnh hưởng
   hiện tại nhỏ (MAD cải thiện 0,194 → 0,161) nhưng là ứng viên
   cải thiện sharpen nếu làm vòng lặp Newton đầy đủ.
5. **Glitch: nhiễu RGB đã khớp thống kê, nhưng chưa đo MAD từng
   frame vs render** (nhiễu preview độc lập với nhiễu render theo
   thiết kế — chỉ đo được thống kê, như noise). Không phải nợ mới.
6. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403
   quyền, nợ cũ từ Phase 6 — không thuộc luồng này).

## 8. Probe (lưu tại hidden_files/round65-s7/)

- `r65s7-probe6.mjs/.json/.log` — S6/S7 sharpen (Y_est).
- `r65s7-probe7.mjs/.json/.log` — N3b loại, mean delta N3.
- `r65s7-probe8.mjs/.json` — S0/S2/S7 trên fixture parity +
  glitch render vs preview (chuỗi glitch chưa đúng yuv420p input —
  xem probe9 mới là chuỗi đúng).
- `r65s7-probe9.mjs/.json` — sharpen naive-vs-bt709; glitch verbose
  (auto-insert gbrp) + corr delta render.
- `r65s7-probe10.mjs/.json` — sharpen bt709-yuv444p S0/S2/S7.
- `r65s7-probe11.mjs` — glitch RGB mới: TB/std 2 fixture.
- probe1–5: script trong /tmp đã mất do /tmp wipe giữa các lượt;
  số đo đã ghi trong báo cáo đợt (`round65-s7.md`) và §1/§2 trên.
- Headed: `headed/r65-preview-snaps-{w1440,w1920,w2560}.json`,
  `headed/r65-compare-report-{w1440,w1920,w2560}.json`,
  `headed/r65-headed-report-{w1440,w1920,w2560}.json`.
- Pre-encode frames: `render/preencode-{plain,sharp05,sharp10,
  noise05,noise10}.yuv` (rawvideo yuv420p 1280×720, 120 frame).
