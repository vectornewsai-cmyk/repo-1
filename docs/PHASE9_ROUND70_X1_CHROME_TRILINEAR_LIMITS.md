# Phase 9 đợt 70, luồng X1 — Áp mô hình trilinear LOD-bias −0,5 vào production cho Chrome filter

> **Kết luận chốt (đọc trước):** Đáp án W5 đợt 69 (trilinear mipmap LOD
> bias −0,5) **đã áp vào code production** (`apps/web/scripts/
> chrome-resample.mjs`: `chromeResampleRgb24` giờ dùng trilinear cho mọi
> thang, thay cho 2-stage). Kiểm chứng độc lập bằng code production
> (không phải fit script): trên **18 thang đo** (s = 0,26–0,63) pooled
> MAD **0,0020** (s<0,5; kỳ vọng W5 0,002), madPeak **0,21** (kỳ vọng
> 0,21), dPeak |mean| **0,27** max **1** với autocorr lag-1 **+0,261**
> (khớp đúng từng số với W5 bản half-down); trên tất cả 18 thang MAD
> **0,0016** / madPeak **0,19**. Hai xung kiểm tra trong test (p=256:
> peak đo 101; p=272: peak đo 127) khớp **đúng từng số** (MAD 0,0000).
> Verdict w1440 bằng code production: **1/2 không đổi** (noise05 LỆCH
> Δcorr [0,197, 0,014, 0,024]; noise10 KHỚP Δcorr [0,118, 0,008, 0,026])
> — đúng dự báo W5: dư corr nằm ở mô hình nhiễu, không phải bộ lọc.
> Test suite `chrome-resample-67u2.test.mjs` **8/8 xanh** (kỳ vọng đã
> cập nhật sang trilinear). tsc 0 + vite build PASS. Nợ mở đợt 69 §4
> mục 1 **ĐÓNG**.

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
  **KHÔNG push, KHÔNG release/tag.** Mọi số là đo thật trên VM này
  (Node v24.22.1, VM 4 vCPU, không GPU; không cần Chrome headed cho
  đợt này — mọi kiểm chứng chạy trên dữ liệu đo headed đã có của U2/V3/
  probe B + frame render có sẵn).
- Nợ đóng: đợt 69 §4 mục 1 (áp mô hình trilinear LOD-bias −0,5 vào
  production, theo đề xuất W5 §6).

## 1. Thay đổi code production

File: `apps/web/scripts/chrome-resample.mjs` (chỉ file harness đo, không
sửa code sản phẩm UI/render).

- **Mới:** `roundHalfDown(x)` — làm tròn nửa-xuống (127,5 → 127; các giá
  trị khác làm tròn thường), khớp halve đo riêng của Chrome (W5 §3).
- **Mới:** `trilinearRow1D(src, dstLen)` — đúng đặc tả W5 §1:
  `λ=log2(srcLen/dstLen)`, `λ*=max(0, λ−0,5)`, `L=floor(λ*)`,
  `f=frac(λ*)`, `out=(1−f)·bilinear(mip L→dst) + f·bilinear(mip L+1→dst)`;
  mỗi mip = halve `(0,5, 0,5)` lặp lại (triangle h=1, thang 0,5);
  halve và bilinear làm tròn nửa-xuống từng pixel; blend cuối làm tròn
  thường (`Math.round`). Khi `f=0` chỉ tính mức L (vd s≥0,7071 → thuần
  triangle h=1, trùng 1-kernel cũ).
- **Mới:** `resamplePlaneTrilinear` / `resampleRgb24Trilinear` — tách
  trục X/Y, mỗi trục tính λ* riêng theo thang thực của trục đó (W5 §6).
  Pass ngang rồi pass dọc; trung gian sau pass ngang đã nguyên (blend
  làm tròn) — cùng tinh thần "chặng giữa uint8" của 2-stage cũ.
- **Đổi:** `chromeResampleRgb24` giờ gọi `resampleRgb24Trilinear` cho
  MỌI thang (bỏ nhánh `s<0,5 → 2-stage, s>=0,5 → 1-kernel`).
- **Giữ nguyên:** `resamplePlane` / `resampleRgb24` (1-kernel),
  `resamplePlaneTwoStage` / `resampleRgb24TwoStage` (2-stage cũ, giờ là
  mốc đối chứng — ghi rõ trong chú thích, không xoá), `resampleYuv420p`,
  `yuv420pToRgb24`. Không file nào khác import hàm đã đổi
  (`parity-66t3-compare.mjs` chỉ dùng `resampleRgb24`/`resampleYuv420p`,
  không đổi hành vi).
- **Chú thích ngưỡng 0,5:** cập nhật theo W5 §1/§6 — ngưỡng 0,5 ĐÃ ĐO,
  PIN (V3: crossover trong (0,48, 0,55]) nhưng với trilinear nó chỉ là
  hệ quả (tại s=0,5 thì λ*=0,5, hai thành phần blend trùng nhau), không
  còn là điểm chuyển mô hình.

## 2. Kiểm chứng: production khớp fit W5 đúng từng số (18 thang)

Script: `hidden_files/round70-x1/r70x1-verify-trilinear.mjs` (import
trực tiếp `resamplePlaneTrilinear` production; dữ liệu U2 + threshold
V3 + probe B full, giống hệt W5). Log: `r70x1-verify-trilinear.log`.

|  | pooled MAD | madPeak | dPeak \|mean\|/max (s=0,3819) | autocorr lag-1 |
|---|---|---|---|---|
| **PROD trilinear, s<0,5 (14 thang)** | **0,0020** | **0,21** | **0,27 / 1** | **+0,261** |
| W5 fit half-down (kỳ vọng) | 0,002 | 0,21 | 0,27 / 1 | +0,261 |
| **PROD trilinear, tất cả 18 thang** | **0,0016** | **0,19** | — | — |
| W5 fit half-up, tất cả thang | 0,004 | 0,55 | — | — |
| PROD 2-stage (đối chứng, s<0,5) | 0,1004 | 11,71 | 8,16 / 18 | −0,617 |

Per-scale MAD của PROD trilinear: 0,000–0,003 mọi thang (0,30: 0,000;
0,35: 0,002; 0,3819: 0,003; 0,45: 0,001; 0,48: 0,001; 0,5: 0,000; 0,55:
0,001; 0,6: 0,001; 0,63: 0,001; 8 thang B: 0,002–0,003) — khớp đúng
bảng W5 §2.1 bản half-down. Production = fit script tới từng số.

### V_1D: lệch lớn nhất 0,0090 tại s=0,30 (báo trung thực)

| s | đo | PROD trilinear | lệch | W5 fit half-up | lệch |
|---|---|---|---|---|---|
| 0,30 | 0,2769 | 0,2679 | **−0,0090** | 0,2734 | −0,0034 |
| 0,35 | 0,3234 | 0,3245 | +0,0011 | 0,3295 | +0,0061 |
| 0,3819 | 0,3415 | 0,3419 | +0,0004 | 0,3466 | +0,0052 |
| 0,40 | 0,3631 | 0,3585 | −0,0047 | 0,3627 | −0,0004 |
| 0,45–0,63, 8 thang B | — | — | ≤0,0004 | — | ≤0,0078 |

Giải thích (đã đối chứng bằng script `r70x1-v1d-crosscheck.mjs`):
bảng V_1D của W5 §2.4 dùng bản **half-up**; production dùng bản
**half-down** (bản được chọn vì MAD/madPeak tốt hơn hẳn). Chạy lại fit
script với half-down tại s=0,30 cho đúng 0,2679 — tức production khớp
fit half-down, không phải lỗi áp dụng. Lệch V_1D 0,0090 chỉ vượt nhẹ
ngưỡng 0,008 của W5 tại đúng 1 thang (s=0,30, nơi λ*=1,237, blend
L1/L2 nên làm tròn halve 127,5→127 vs 128 tác động mạnh nhất tới tổng
bình phương); 17 thang còn lại ≤0,0047. MAD/madPeak (chỉ số chính)
không bị ảnh hưởng. Không ép số, không đổi mô hình để fit V_1D.

## 3. Test suite: kỳ vọng cập nhật sang trilinear — 8/8 xanh

File: `apps/web/scripts/chrome-resample-67u2.test.mjs` (đã sửa).
Chạy: `node --test apps/web/scripts/chrome-resample-67u2.test.mjs` →
**pass 8, fail 0**.

- p=272: trilinear khớp đúng từng số (MAD 0,0000, peak 127) — giữ.
- p=256: trilinear khớp đúng từng số (MAD 0,0000, peak **101**) — thay
  test cũ "lệch nhỏ, peak 108" của 2-stage; dư ±16 theo pha đã biến mất.
- So sánh 3 mô hình tại p=256, s=0,3828: trilinear MAD 0 vs 2-stage
  0,036 vs 1-kernel 0,138.
- s=0,5: trilinear cho tap **127** (halve nửa-xuống, đúng Chrome đo
  riêng W5 §3), 2-stage cũ cho 128 (làm tròn thường, lệch 1) — hai mô
  hình KHÔNG còn trùng nhau đúng từng số tại s=0,5 như V3 ghi; chênh
  đúng 1 mức xám do quy tắc làm tròn halve, đã đo và đã pin.
- DC phẳng 128 → 128 qua trilinear (mọi mức mip).
- `chromeResampleRgb24` == `resampleRgb24Trilinear` ở cả s=0,3828 và
  s=0,63; xung điểm 2D tại s=0,63: trilinear peak 53 vs 1-kernel 64
  (khác nhau thật — test cũ dùng ảnh phẳng không phân biệt được nên đã
  sửa sang xung điểm; lỗi test này do người viết test, đã sửa, không
  phải lỗi code).
- 2-stage cũ giữ nguyên hành vi (test mốc đối chứng: p=272 MAD 0,
  p=256 peak 108).
- `resampleRgb24` (1-kernel) không đổi.

## 4. Verdict w1440 bằng code production — 1/2 không đổi

Script: `hidden_files/round70-x1/r70x1-verdict-w1440.mjs` (import
`chromeResampleRgb24` production; frame `fullrgb-{plain,noise05,
noise10}.raw` 1280×720 → 489×275; ngưỡng KHỚP như cũ).
Log: `r70x1-verdict-w1440.log`.

|  | render std | Δkurt | Δcorr | verdict |
|---|---|---|---|---|
| PROD trilinear noise05 | [12,47, 8,07, 16,90] | [0,11, 0,17, 0,21] | **[0,197, 0,014, 0,024]** | **LỆCH** (chỉ corr R-G) |
| PROD trilinear noise10 | [26,23, 14,19, 32,60] | [0,11, 0,20, 0,22] | **[0,118, 0,008, 0,026]** | **KHỚP** |
| W5 fit-script LOD-bias (đối chứng) | — | — | [0,198/0,117, …] | LỆCH / KHỚP |

Tỉ lệ KHỚP **1/2 không đổi** (đúng dự báo W5 §7): production tái tạo
đúng verdict của fit script tới ±0,003. Dư Δcorr R-G 0,197 ở noise05
nằm ở mô hình nhiễu preview (cân bằng Y/Cr của `addYuvNoise` vs
ffmpeg noise YUV420p) — không phải việc của bộ lọc, chuyển hướng như
V3 §5 mục 3 đã kết luận.

Hiệu năng harness: resample 2 frame 1280×720 → 489×275 hết **3,8s**
(trilinear tính 2 mức thay vì 1, đắt hơn 2-stage ~2× như W5 §6 dự
báo, vẫn rẻ so với render thật; không ảnh hưởng preview vì hàm này
chỉ dùng cho harness đo).

## 5. tsc + vite build

- `npm run build` trong `apps/web` (tsc && vite build): **PASS** —
  tsc 0 lỗi, vite build 6,48s (chunk-size warning có sẵn, không đổi).
  Đợt này chỉ sửa file `.mjs` harness (không đụng TS/UI) nhưng vẫn chạy
  đủ build để chắc chắn.

## 6. Đã làm / không làm

1. **ĐÃ áp trilinear vào production** (`chromeResampleRgb24` mặc định
   trilinear mọi thang); 2-stage giữ làm mốc đối chứng.
2. **KHÔNG sửa** `effectCanvas.ts` / `preview.tsx` / `previewEngine`
   (hàm này chỉ dùng cho harness đo; preview headed dùng Chrome thật).
3. **KHÔNG sửa** mô hình nhiễu preview (`addYuvNoise`) — nợ riêng
   (V3 §5 mục 3), cần đợt riêng.
4. **KHÔNG đo lại headed** — mọi kiểm chứng dùng dữ liệu đo headed đã
   có (U2/V3/probe B) + frame render có sẵn; không bịa kết quả Chrome
   mới (Xvfb/Chrome không cần cho đợt này).
5. **KHÔNG push/tag/binary.**

## 7. Nợ mở / hướng tiếp theo

1. **Lệch tách được 2D ở s≥0,6** (W5 §7 mục 2, kế thừa): maxAbs 11–12,
   RMSE ~2,8 ở s=0,6/0,63 — có thể là thành phần chéo thật của kernel
   2D ở vùng upscale-nhẹ; cần probe 2D riêng. Production trilinear
   tách trục nên không bắt được phần này (MAD 1D vẫn 0,001 ở s≥0,6
   nhưng điểm 2D có thể lệch — chưa đo lại điểm 2D bằng production,
   xem mục 3).
2. **Điểm 2D bằng code production chưa đo lại**: W5 §5.3/§7 mục 2 dùng
   fit script (outer product hàng 1D). Cần chạy lại check 5×5 bằng
   `resampleRgb24Trilinear` để xác nhận RMSE/maxAbs khớp W5.
3. **V_1D tại s=0,30 lệch −0,0090** (bản half-down; xem §2): nhỏ, chỉ
   1 thang, không ảnh hưởng MAD/verdict — ghi nhận, không cần sửa.
4. **GPU thật chưa đo** (VM không GPU) — mọi kết luận chỉ đúng trên
   CPU/SwiftShader (nợ kế thừa U2 §7 mục 5).
5. **Mô hình nhiễu preview** (`addYuvNoise` cân bằng Y/Cr) — muốn khớp
   noise05 w1440 phải sửa đường nhiễu, không phải bộ lọc (V3 §5 mục 3).
6. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền,
   chờ user) — nợ chung.

## 8. Files

- LIMITS này: `docs/PHASE9_ROUND70_X1_CHROME_TRILINEAR_LIMITS.md`
- Code: `apps/web/scripts/chrome-resample.mjs` (trilinear + chú thích
  ngưỡng 0,5), `apps/web/scripts/chrome-resample-67u2.test.mjs`
  (kỳ vọng trilinear, 8/8 xanh)
- Log + verify scripts:
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round70-x1/`
  (`r70x1-verify-trilinear.mjs` + `.log`, `r70x1-v1d-crosscheck.mjs`,
  `r70x1-test-vectors.mjs`, `r70x1-s05.mjs`, `r70x1-peak2d.mjs`,
  `r70x1-verdict-w1440.mjs` + `.log`), log luồng
  `hidden_files/round70-x1.md`.
- Batch stage (KHÔNG push):
  `~/workspace/repo-1-push/paths-loop/phase9-round70-x1-chrome-trilinear.txt`
  — 3 entry (2 file code + LIMITS này).
