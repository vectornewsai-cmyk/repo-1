# Phase 9 đợt 73, luồng A1 — Merge trilinear blend-at-end vào production: ĐÃ XONG

> **Kết luận chốt:**
> 1. `resamplePlaneTrilinear` trong `apps/web/scripts/chrome-resample.mjs`
>    **đã sửa sang blend-at-end** (đóng nợ đợt 72 §4 mục 1, ưu tiên).
>    Bản cũ trộn 2 mức mip ngay trong từng pass 1D (X rồi Y), sinh 2 hạng
>    chéo `f(1−f)` không tồn tại trong pipeline thật của Chrome/Skia.
>    Bản mới bilinear-sample 2D từng mức mip trước, rồi mới trộn 2 kết
>    quả 2D — đúng cách Skia lấy mẫu trilinear.
> 2. **Số đo sau merge, trên dữ liệu headed thật của Z7 (không chạy lại
>    headed): maxAbs = 1 mọi thang** (mức làm tròn uint8), RMSE
>    0,054–0,064, **0 ô ≥ 4** trên toàn bộ **259.584 ô** lưới pha mịn
>    (1.536 điểm × 6 thang) + 50 ô Y8 đã khớp trong test Z7. Trước merge:
>    maxAbs tới **19**, RMSE 0,47–0,65, 112–160/256 điểm/thang có
>    maxAbs ≥ 4.
> 3. **Production mới bit-identical với module tham chiếu Z7**
>    (`r72z7-trilinear-2dblend.mjs`) trên 20/20 case kiểm tra (xung điểm
>    6 thang, nhiễu ngẫu nhiên, phẳng, dẹt, upscale, vạch dọc) — 0 byte
>    khác.
> 4. **Verdict nhiễu w1440: 8/8 KHÔNG ĐỔI** (KHỚP vẫn KHỚP, LỆCH vẫn
>    LỆCH) khi tính lại bằng production đã merge. Δkurt R test-pattern
>    dịch đúng như Z7 §6 đã dự đoán: noise05 0,29→0,27, noise10
>    0,34→0,32 (lại gần hơn với dải dự đoán Y8). plainAbsMad dịch ≤ 0,029.
> 5. Hệ số blend f (bias LOD −0,5) KHÔNG đổi — fit Δf ≈ 0 đã chứng minh
>    từ đợt 72. Các test 1D cũ xanh đúng từng số (hạng chéo vô hình
>    trên 1D).

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
  **KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG file workflow.**
  Mọi số là đo thật trên VM này (Node v24.22.1; dữ liệu headed Chromium
  158 qua Xvfb của đợt 72 Z7, đã pixel-identical khi chạy lại).
- Nợ đóng: đợt 72 §4 mục 1 (merge bản sửa trilinear blend-at-end vào
  production).
- Quy ước kurt: excess kurtosis, như pipeline verdict T3/X6 (ngưỡng
  KHỚP: std ratio [0,85, 1,18]; Δkurt ≤ 0,35; Δcorr ≤ 0,12).

## 1. Bản sửa (merge từ module tham chiếu Z7)

File sửa: `apps/web/scripts/chrome-resample.mjs` — hàm
`resamplePlaneTrilinear` (dòng ~279 cũ), giữ nguyên chữ ký
`(src, srcW, srcH, dstW, dstH)` và kiểu trả `Float64Array`:

- **Trước (đợt 70 X1, blend-từng-pass):** pass X gọi `trilinearRow1D`
  theo hàng (trộn mip L/L+1 trong 1D), pass Y gọi `trilinearRow1D`
  theo cột. Khai triển: `(1−f)²·T0T0 + f(1−f)·T0T1 + f(1−f)·T1T0 +
  f²·T1T1` — 2 hạng giữa là "halve 1 trục", không tồn tại trong
  pipeline thật.
- **Sau (đợt 73 A1, blend-at-end):** tính `(L, f)` từ thang nhỏ nhất
  `s = min(dstW/srcW, dstH/srcH)` — tức `λ* = max(λx*, λy*)`, quy ước
  LOD chuẩn theo trục co nhất; halve 2D `L` lần (helper nội bộ mới
  `halvePlane2D`, box 2×2 qua 2 pass 1D, `roundHalfDown` từng pixel);
  bilinear 2D từng mức mip (helper nội bộ mới `bilinearPlane2D`,
  triangle h=1, pass X rồi Y, `roundHalfDown`); trộn cuối
  `Math.round((1−f)·a + f·b)`. Công thức:
  `out = (1−f)·Bilin2D(mip L) + f·Bilin2D(mip L+1)`.
- `resampleRgb24Trilinear` và `chromeResampleRgb24` không đổi chữ ký,
  tự hưởng sửa qua `resamplePlaneTrilinear`.
- `trilinearRow1D` **giữ nguyên** (mô hình 1D đúng; hạng chéo vô hình
  trên 1D — các test 1D cũ vẫn xanh đúng từng số, xem §4).
- Module tham chiếu Z7 `r72z7-trilinear-2dblend.mjs` **giữ lại** làm
  cross-check độc lập (đã stage trong batch Z7, không đụng tới).
- Ghi chú lịch sử X1 trong header file được giữ nguyên; thêm đoạn A1
  mô tả bản sửa.

**Lưu ý về (L, f) theo trục:** bản cũ tính λ* riêng từng trục
(`trilinearRow1D` mỗi pass tự tính); bản mới dùng một (L, f) chung
theo thang nhỏ nhất — đúng quy ước LOD của OpenGL/Skia (lấy trục co
nhất). Trường hợp `sx = sy` (mọi thang đã đo) hai cách trùng hệt
nhau. Trường hợp thang khác nhau 2 trục CHƯA đo headed (nợ Z7 §9.2,
xem §6); bản mới và module tham chiếu cho cùng kết quả ở đó (kiểm
bit-identical §3, gồm 2 case dẹt).

## 2. Đo lại trên lưới pha mịn headed (toàn bộ, production đã merge)

Script: `hidden_files/round73-a1/r73a1-verify-grid-prod.mjs` (chạy
~14 phút, 1.536 resample 512×512) — so production mới với dữ liệu đo
headed đợt 72 (`r72z7-2d-grid-A.json`, cửa sổ 13×13 quanh peak).
Kết quả từng thang (43.264 ô/thang):

| s (thực) | RMSE trước (Z7) | RMSE sau | maxAbs trước | maxAbs sau | ô ≥ 4 sau |
|---|---|---|---|---|---|
| 0,4492 (dw=230) | 0,57 | 0,0638 | **19** | **1** | 0 |
| 0,5000 (dw=256) | 0,00 | 0,0000 | 0 | 0 | 0 |
| 0,5508 (dw=282) | 0,65 | 0,0608 | **19** | **1** | 0 |
| 0,5996 (dw=307) | 0,47 | 0,0544 | **11** | **1** | 0 |
| 0,6309 (dw=323) | 0,47 | 0,0631 | **11** | **1** | 0 |
| 0,7500 (dw=384) | 0,05 | 0,0544 | 1 | 1 | 0 |

- **Tổng: 259.584 ô, maxAbs = 1, RMSE 0,054–0,064, 0 ô ≥ 4** —
  khớp đúng tới mức làm tròn uint8, đúng như Z7 fit6 đã đo cho module
  tham chiếu. Ô tệ nhất còn lại chỉ lệch 1 mức (vd (250,248) dw=230:
  đo 4 vs prod 5; (248,248) dw=384: đo 177 vs prod 178).
- **Ô tệ nhất của production cũ (250,250), s=0,4492: peak đo 98,
  production cũ 79, production mới 98 — khớp đúng từng số.**
- Kiểm tra chéo: peak 2D tại (256,256), s=0,6309 (dw=323): đo **56**,
  production mới **55** (±1, mức làm tròn), production cũ 53 (lệch 3)
  — xem test 67u2 đã cập nhật §4.

## 3. Production bit-identical với module tham chiếu Z7

Cùng script §2 (20 case, so từng byte):

| Nhóm case | Số case | Kết quả |
|---|---|---|
| Xung điểm (250,250) và (263,248), 6 thang (230–384) | 12 | 12/12 identical, maxDiff 0 |
| Nhiễu ngẫu nhiên (mulberry32 seed 73), 512→230/323/384 | 3 | 3/3 identical |
| Phẳng 128, 512→196 | 1 | identical |
| Dẹt 512×256→196×196 và →384×96 (anisotropic, chưa đo) | 2 | 2/2 identical |
| Upscale 256→512 | 1 | identical |
| Vạch dọc (ảnh 1D), 512×512→307×307 | 1 | identical |

→ **20/20 identical, 0 byte khác.** Production đã merge và module
tham chiếu là cùng một thuật toán tới từng byte, kể cả trường hợp dẹt
và upscale (chỉ khác nhau ở cách tổ chức code, không khác số).

## 4. Test suite liên quan

| Suite | Kết quả |
|---|---|
| `chrome-resample-67u2.test.mjs` (`node --test`) | **8/8 pass** |
| `r72z7-trilinear-2dblend.test.mjs` (`node --test`, 72 s) | **4/4 pass** |
| `tsc` web (`npx tsc --noEmit`, apps/web) | **0 lỗi** |
| vite build | KHÔNG chạy (chỉ đụng `apps/web/scripts/*.mjs` — harness đo, không phải code web bundle; không file nào trong `apps/web/src` import module này) |

**Test cũ phải cập nhật số (1 chỗ duy nhất, lý do ghi trong test):**
- `chrome-resample-67u2.test.mjs`, test `chromeResampleRgb24`: peak
  xung điểm 2D tại s=0,63 (dw=323) đổi **53 → 55**. 53 là giá trị SAI
  của bản blend-từng-pass; 55 là giá trị đúng của bản blend-at-end,
  khớp peak đo headed 56 ± 1 tại ô đó. `peak1` (1-kernel) vẫn 64,
  không đổi. Mọi test 1D trong file này (xung p=272/p=256 khớp đúng
  từng số, tap 127 tại s=0,5, DC phẳng 128, 2-stage giữ nguyên) xanh
  **không đổi một số nào** — đúng như Z7 dự đoán (hạng chéo vô hình
  trên 1D).
- `r72z7-trilinear-2dblend.test.mjs`, test (3): đổi kỳ vọng — production
  (đã merge) phải cho peak **98 ± 1** tại ô tệ nhất cũ (cũ pin 79) và
  `deepEqual` module tham chiếu. Test (1)/(2) (module tham chiếu khớp
  lưới pha mịn + 50 ô Y8) và test (4) (1D exact) không đổi, vẫn xanh.

## 5. Verdict nhiễu w1440 tính lại bằng production đã merge

Script: `hidden_files/round73-a1/r73a1-verify-verdict-prod.mjs` —
bản sao của `r72z7-verify-2dblend.mjs` (Z7) chỉ đổi import sang
production `resampleRgb24Trilinear` của `chrome-resample.mjs`; cùng
snapshot headed Y2 + frame render, cùng code tính delta0/stats.
Kết quả: **18/20 check pass; 8/8 verdict KHÔNG ĐỔI.**

| Nguồn | noise05 | noise10 |
|---|---|---|
| test-pattern | KHỚP Δkurt [0,27, 0,17, 0,27] (Y2: [0,29, 0,16, 0,28]) | KHỚP Δkurt [0,32, 0,04, 0,25] (Y2: [0,34, 0,04, 0,26]) |
| ocean | LỆCH Δkurt [0,44, 1,12, 0,08] (Y2: giống hệt) | LỆCH Δkurt [0,37, 0,16, 0,02] (Y2: [0,37, 0,15, 0,02]) |
| basgo | KHỚP Δkurt [0,16, 0,20, 0,12] (Y2: [0,16, 0,19, 0,11]) | KHỚP Δkurt [0,12, 0,10, 0,11] (Y2: [0,12, 0,09, 0,11]) |
| slovenska | KHỚP Δkurt [0,14, 0,05, 0,05] (Y2: [0,14, 0,04, 0,05]) | KHỚP Δkurt [0,23, 0,06, 0,07] (Y2: [0,24, 0,05, 0,07]) |

- **2 check "FAIL" trong log KHÔNG phải verdict đổi:** cả 2 đều là
  test-pattern, verdict tính lại KHỚP = verdict Y2 KHỚP. Chỉ số
  Δkurt R dịch **0,02** (0,29→0,27 và 0,34→0,32), vượt ngưỡng khớp
  số ±0,011 của script kiểm tra — đúng y như Z7 §6 đã dự đoán và đo
  bằng module tham chiếu ("Δkurt dịch ≤ 0,02 — lại gần hơn với dải
  dự đoán Y8"). Đây là hiệu ứng ĐÃ BIẾT của bản sửa, không phải lệch
  mới. Các kênh còn lại dịch ≤ 0,01, trong ngưỡng.
- plainAbsMad tính lại vs Y2: test-pattern 1,049 vs 1,046 (+0,003);
  ocean 4,439 vs 4,455 (−0,016); basgo 2,584 vs 2,613 (−0,029);
  slovenska 1,881 vs 1,882 (−0,001) — đều ≤ 0,03 như Z7 §6.
- Không chạy lại phiên headed capture: snapshot Y2 đã
  pixel-identical khi chạy lại (D1/D2 12/12 check trong script này
  đều PASS).

## 6. Ảnh hưởng lên các phân tích cũ dùng `resampleRgb24Trilinear`

Các script phân tích (không phải test suite, không có assert) import
hàm này: `parity-66t3-compare.mjs`, `r71y2-analyze.mjs`,
`r72z2-*.mjs`, `r72z7-noise-nat.mjs`, `r72z9-*.mjs`. Số của chúng
được tính bằng bản blend-từng-pass cũ nên sẽ dịch nhẹ nếu chạy lại
(theo §5: Δkurt dịch ≤ 0,02, verdict không đổi ở w1440). Không chạy
lại chúng trong luồng này (ngoài phạm vi merge; kết luận verdict
w1440 đã tính lại trực tiếp ở §5). Các LIMITS cũ ghi số theo bản cũ
vẫn giữ nguyên giá trị lịch sử — đọc kèm LIMITS này để biết số mới.

## 7. Giới hạn còn lại / nợ mở

1. **Thang khác nhau 2 trục (hình học dẹt) CHƯA đo headed** (nợ kế
   thừa Z7 §9.2): bản mới dùng λ* = max(λx*, λy*) — quy ước LOD
   chuẩn — nhưng chưa có dữ liệu headed dẹt để xác nhận. Mọi số
   khớp maxAbs = 1 trong file này chỉ đúng khi sx = sy. Cần probe
   dẹt (vd 512×16 như T3) trước khi dùng cho hình học dẹt.
2. **Verdict w1920/w2560 chưa tính lại bằng mô hình mới** (nợ Z7
   §9.1): w1440 đã xong 8/8 không đổi; w1920/w2560 cần chạy lại
   tương tự §5 (dữ liệu Z2/Z9 đã có).
3. **Mô hình nhiễu Y8 còn thiếu ~0,05–0,1 Δkurt R** một cách hệ thống
   (Z7 §9.3) — không liên quan trực tiếp tới merge này; test-pattern
   Δkurt R đo 0,27–0,32 vẫn hơi cao hơn dải sim Y8 (0,08–0,23 /
   0,22–0,31), nhưng verdict KHỚP đã đúng.
4. **Ocean w1440 (Δkurt G 1,12 + Δcorr 0,233)** vẫn chưa giải thích
   xong (Z7 §9.4) — do bước scale video-path 1920→1280, ngoài phạm
   vi merge.
5. **GPU thật / Safari thật vẫn chưa đo** (nợ kế thừa; mọi kết luận
   chỉ đúng trên CPU/SwiftShader + Chromium 158).
6. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403
   quyền, chờ user) — nợ chung.
7. Chi phí tính: bản mới làm nhiều pass hơn bản cũ (halve + 2 lần
   bilinear 2D thay vì 2 pass trilinear 1D) — chậm hơn một chút trên
   harness đo thuần JS (verify lưới 1.536 điểm mất ~14 phút; test Z7
   20 s → 72 s do thêm resample + deepEqual). Đây là model harness,
   không phải code sản phẩm chạy realtime, nên chấp nhận được.

## 8. Đã làm / không làm

1. **ĐÃ** sửa `resamplePlaneTrilinear` sang blend-at-end trong
   `chrome-resample.mjs` (giữ chữ ký, giữ `trilinearRow1D`,
   giữ module tham chiếu Z7 làm cross-check).
2. **ĐÃ** đo lại toàn bộ lưới pha mịn headed (259.584 ô, maxAbs = 1)
   + bit-identity 20/20 + verdict w1440 8/8 không đổi — tất cả bằng
   production đã merge, không dùng module tham chiếu thay thế.
3. **ĐÃ** cập nhật 2 test assert số cũ (ghi rõ lý do trong test) +
   chạy `node --test` cả 2 suite + `tsc` web 0 lỗi.
4. **KHÔNG** sửa code sản phẩm web nào (`apps/web/src` không import
   module này); **KHÔNG** sửa module tham chiếu Z7; **KHÔNG** chạy
   lại headed capture; **KHÔNG** push/tag/binary/workflow.

## 9. Files

- LIMITS này: `docs/PHASE9_ROUND73_A1_RESAMPLE_BLEND_LIMITS.md`
- Code sửa: `apps/web/scripts/chrome-resample.mjs`
- Test cập nhật: `apps/web/scripts/chrome-resample-67u2.test.mjs`,
  `apps/web/scripts/r72z7-trilinear-2dblend.test.mjs`
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round73-a1.md`
- Verify nội bộ (KHÔNG stage — goal hidden_files):
  `hidden_files/round73-a1/` — `r73a1-verify-grid-prod.mjs` (+`.json`),
  `r73a1-verify-verdict-prod.mjs` (+`.json`).
- Batch stage (KHÔNG push):
  `~/workspace/repo-1-push/paths-loop/phase9-round73-a1-resample-blend.txt`
  — 4 entry (LIMITS này + 3 file code/test trên).
