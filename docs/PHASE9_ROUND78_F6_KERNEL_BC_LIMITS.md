# Phase 9 đợt 78, luồng F6 — Kernel upscale BC + G12: KẾT QUẢ & GIỚI HẠN

- **Luồng:** F6, đợt 78 (nợ đợt 77 §4.6, xem `docs/PHASE9_ROUND77_LIMITS.md` và `docs/PHASE9_ROUND77_E9_EFFECTS_PARITY_LIMITS.md`).
- **Ngày:** 10/11/2026. Repo local `~/workspace/repo-1`, HEAD `5f548ef8`. **CHỈ stage, KHÔNG push.**
- **Kết luận ngắn: ĐÃ NỐI kernel BC(0,25, 0,375) làm nhánh upscale trong `resamplePlaneTrilinear`** (`apps/web/scripts/chrome-resample.mjs`). BC khớp trên 4 nội dung ở thang upscale 1,132 (19/20 verdict KHỚP, so với tam giác 15/20); downscale không đổi (bit-identical, kiểm chứng lại bằng E9 + 67u2). Giới hạn trung thực ở §7.

## 1. Thay đổi code (duy nhất 1 file production)

`apps/web/scripts/chrome-resample.mjs`:

- Thêm `bcCubicKernel(x, B, C)` (export, công thức Keys 1981 chuẩn, support |x| < 2), hằng `CHROME_UPSCALE_BC = { B: 0.25, C: 0.375 }` và `chromeUpscaleKernel(x)` (BC với (B, C) đã fit, cắm được vào `chromeWeights1D`).
- `bilinearPlane2D(..., kernel = triangleKernel)` — thêm tham số kernel (mặc định tam giác, truyền vào `chromeWeights1D` ở cả 2 pass).
- `resamplePlaneTrilinear`: `const kernel = sx > 1 && sy > 1 ? chromeUpscaleKernel : triangleKernel` — dùng BC cho cả 2 lần gọi `bilinearPlane2D` (mức mip L và L+1). **Chỉ nhánh upscale thuần cả 2 trục.** Mọi thang downscale hoặc dị hướng hỗn hợp giữ tam giác (chưa đo).
- **Giữ nguyên:** `resamplePlane` / `resampleRgb24` (1-kernel cũ), `trilinearRow1D`, mip/halve, LOD-bias −0,5, LOD theo trung bình nhân s = √(sx·sy) (C2), blend-at-end (A1), làm tròn 1 lần cuối (C2).
- **Quy ước quan trọng (giữ nguyên như E9 đã fit):** ở upscale, `chromeWeights1D` dùng h = 1 nên cửa sổ tap chỉ bao |x| ≤ 1,5 rồi chuẩn hoá lại — kernel BC thực tế bị cắt đuôi ở |x| ∈ [1,5, 2). Bản đo E9/F6 và bản nối dùng đúng cùng quy ước này (xem §5: bit-identical).

## 2. Nội dung đo (mới so với E9)

- 3 clip 1280×720, 30fps, frame đo = 30: `ocean-720p` (sóng biển, texture giàu tần số cao), `basgo-720p`, `slovenska-720p` (từ `hidden_files/round67-u3/media/`), + `ocean640` (project 640×360).
- 5 biến thể mỗi nội dung: plain / sharp05 / sharp10 / noise05 / noise10 (preencode plain/sharp tái dùng chuỗi R65 y hệt; noise sinh mới `noise=alls=28/50:allf=t`).
- 4 run headed (Playwright Chromium 1254, Xvfb, vite dev + CDP, cổng tránh F1/F2/E9): Run B w1920-p1280 (test-pattern+ocean, 7/7), Run A w2560-p1280 (ocean+basgo+slovenska, 10/10), Run C w1920-p640 (ocean, 4/4, rect 809×455, scale 1,264), Run D w2560-p640 (ocean, 4/4, rect 1449×815, scale 2,264). Log + snaps JSON trong `hidden_files/round78-f6/`.
- Ngưỡng verdict (như E9): noise KHỚP-THỐNG-KÊ khi std ratio ∈ [0,85, 1,18] và |Δkurt| ≤ 0,35 và |Δcorr| ≤ 0,12; sharpen KHỚP khi MAD ≤ 2 và ≥99% pixel lệch ≤8; XẤP XỈ khi MAD ≤ 20 và ≥90% lệch ≤32.

## 3. Bằng chứng PRE-wiring — thang upscale 1,132 (w2560, project 1280, full-pixel)

Nguồn: `hidden_files/round78-f6/r78f6-analysis.json` (chạy TRƯỚC khi nối). "tri" = trilinear tam giác cũ; "BC" = BC(0,25, 0,375) độc lập kiểu E9. Δkurt R = |Δkurt| kênh R theo cổng G12.

| Nội dung | plain MAD tri → BC (verdict) | sharp05 delta MAD tri → BC | sharp10 delta MAD tri → BC | noise05 Δkurt R tri → BC | noise10 Δkurt R tri → BC |
|---|---|---|---|---|---|
| test-pattern (E9 gốc) | 0,969 → 1,017 (KHỚP cả 2) | 0,603 → 0,588 (KHỚP) | 0,629 XẤP XỈ → 0,603 KHỚP | 0,35 LỆCH → 0,12 KHỚP | 0,42 LỆCH → 0,22 KHỚP |
| ocean | 1,937 KHỚP → 2,086 XẤP XỈ (le8 99,3%) | 1,147 XẤP XỈ → 0,905 KHỚP | 1,356 XẤP XỈ → 0,903 KHỚP | 0,13 → 0,10 KHỚP | 0,21 → 0,20 KHỚP |
| basgo | 0,727 → 0,862 (KHỚP) | 1,107 → 0,990 (KHỚP) | 1,122 → 0,869 (KHỚP) | 0,15 → 0,13 KHỚP | 0,12 → 0,10 KHỚP |
| slovenska | 0,652 → 0,676 (KHỚP) | 0,590 → 0,584 (KHỚP) | 0,601 → 0,578 (KHỚP) | 0,13 → 0,12 KHỚP | 0,21 → 0,18 KHỚP |

- **Tổng verdict KHỚP (4 nội dung × 5): BC 19/20 vs tam giác 15/20.** BC sửa đúng 5 lỗi của tam giác (sharp10 test-pattern, sharp05+sharp10 ocean, noise05+noise10 test-pattern) và chỉ mất 1 plain KHỚP của ocean, sát nút 2,086 vs ngưỡng 2,0.
- **Đính chính:** bản tóm tắt lượt trước ghi nhầm noise ocean là 0,34/0,31 → số thật từ `r78f6-analysis.json` là 0,13/0,21 (tri) → 0,10/0,20 (BC). Số 0,34 là noise10 w1920 của test-pattern (§6), không phải ocean.

### Lưới (B, C) — vùng fit, không phải điểm may mắn

Trên ocean 1,132, cả 3 điểm lưới đều sharpen-delta KHỚP + noise KHỚP:

| (B, C) | plain MAD | sharp05 / sharp10 delta MAD | noise05 / noise10 Δkurt R |
|---|---|---|---|
| (1/3, 1/3) | 2,049 XẤP XỈ | 0,905 / 0,888 KHỚP | 0,12 / 0,21 KHỚP |
| (1/3, 0,4) | 2,095 XẤP XỈ | 0,876 / 0,839 KHỚP | 0,10 / 0,19 KHỚP |
| (0,25, 1/3) | 2,059 XẤP XỈ | 0,923 / 0,934 KHỚP | 0,12 / 0,21 KHỚP |
| **(0,25, 0,375) đã chọn** | 2,086 XẤP XỈ | 0,905 / 0,903 KHỚP | 0,10 / 0,20 KHỚP |

Chọn (0,25, 0,375) vì là điểm E9 fit trên test-pattern (nhất quán với E9), không vì nó tốt nhất trên ocean — cả vùng đều khớp, điểm nào cũng được; giữ điểm của E9 để tránh fit theo nội dung mới.

## 4. Thang 1,264 / 2,264 (project-640) — NHIỄM, không phân biệt được

Ocean w1920-p640 (scale 1,264) và w2560-p640 (scale 2,264), full-pixel:

| Thang | plain MAD tri → BC | sharp05 delta tri → BC | sharp10 delta tri → BC | noise Δkurt R tri → BC |
|---|---|---|---|---|
| 1,264 | 2,751 → 2,700 (XẤP XỈ cả 2) | 1,254 → 1,192 (XẤP XỈ) | 2,112 → 2,010 (XẤP XỈ) | 0,13/0,21 → 0,10/0,19 (KHỚP cả 2) |
| 2,264 | 2,745 → 2,699 (XẤP XỈ cả 2) | 1,246 → 1,190 (XẤP XỈ) | 2,099 → 2,006 (XẤP XỈ) | 0,13/0,20 → 0,10/0,19 (KHỚP cả 2) |

BC nhỉnh hơn mọi chỉ số nhưng verdict không đổi. Nguyên nhân nhiễm (đã chẩn đoán bằng `r78f6-downscale-check.mjs`): preview đi qua khung project 640, mà downscale 1280→640 của preview (trilinear) khác render (ffmpeg-bicubic) — lệch MAD 1,956 (le8 90,3%) ngay ở bước downscale; phần còn lại sau khi sửa base (~2,16–2,22) ≈ sàn base của ocean, không phải nhiễm thêm. **Kết luận: 2 thang này không đủ sức phân biệt kernel — không dùng làm bằng chứng nối, chỉ ghi nhận BC không tệ hơn.**

## 5. Kiểm chứng SAU khi nối (mô hình đã nối = mô hình đo)

| Kiểm chứng | Lệnh / cách | Kết quả |
|---|---|---|
| Tương đương bit | `/tmp/r78f6-equiv.mjs` (so `resampleRgb24Trilinear` đã nối vs BC độc lập kiểu E9, ocean plain 1280×720→1449×815) | **maxAbs = 0, 0/3.542.805 ô khác** — bản nối đúng y hệt bản đo |
| Downscale hồi quy | `node --test apps/web/scripts/chrome-resample-67u2.test.mjs` | **8/8 pass** |
| E9 chạy lại | `R77E9_OUT=hidden_files/round78-f6/r78f6-e9-rerun-analysis.json node apps/web/scripts/r77e9-fullpixel-analyze.mjs` | EXIT 0. **w2560: sharp05/sharp10 KHỚP (delta 0,588/0,603), noise05/noise10 KHỚP (Δkurt R 0,12/0,22)** — đúng dự đoán E9 §6. w1440/w1920 **giống hệt từng số** E9 gốc (sharp 0,584/0,62 và 0,578/0,595; noise10 w1920 Δkurt R 0,34) |
| T3 compare chạy lại | `R66T3_OUT=hidden_files/round78-f6/r78f6-t3-compare.json node apps/web/scripts/parity-66t3-compare.mjs` | EXIT 0. w2560 step-4: noise05/noise10 chrome-trilinear **KHỚP-THỐNG-KÊ** (Δkurt [0,01,0,08,0,02]/[0,11,0,15,0,08]); w1440/w1920 step-4 giữ nguyên artifact lấy mẫu cũ (xem §6) |
| effectCanvas | `node --experimental-strip-types apps/web/src/lib/effectCanvas.test.ts` và `effectCanvas.parity.test.ts` | **15/15 và 15/15 PASS** |
| tsc | `npx tsc --noEmit` (apps/web) và `npx tsc --noEmit -p apps/desktop/tsconfig.json` | **0 / 0** |
| vite build | `npx vite build` từ `apps/web` | **pass, 22,66s** (chỉ cảnh báo chunk >500kB cũ) |

- **Không chạy lại toàn bộ F6 analysis sau khi nối** (lý do: bản nối bit-identical với BC độc lập đã đo — §5 dòng 1 — nên mọi hàng "trilinear" ở cửa sổ upscale sẽ trùng đúng hàng BC cũ; hàng downscale không đổi vì code path đó không đụng; file `r78f6-analysis.json` PRE-wiring được giữ nguyên làm bằng chứng gốc). E9 chạy lại (§5 dòng 3) đã kiểm chứng độc lập trên tập E9.
- `test_v14_parity.js` **không** import `chrome-resample` (grep 0 kết quả) nên không chạy lại V14.

### Downscale (w1920, scale 0,632) — trilinear vẫn KHỚP hết

| Nội dung | plain MAD | sharp05 / sharp10 delta MAD | noise05 / noise10 Δkurt R |
|---|---|---|---|
| test-pattern | 1,020 KHỚP | 0,595 / 0,604 KHỚP | 0,27 / 0,34 KHỚP |
| ocean | 2,169 XẤP XỈ (le8 99,0%) | 0,953 / 0,929 KHỚP | 0,10 / 0,21 KHỚP |

Ocean plain MAD cao ở cả 2 thang (1,94–2,17) vs test-pattern 1,02 / basgo 0,73: **không phải lệch khung** — `r78f6-frame-offset.mjs` chứng minh n=30 tốt nhất áp đảo (w1920: MAD 2,169 vs n=29/31 là 11,55/11,34; test-pattern đối chứng n=30 MAD 1,02 vs 4,6/4,5). Là base mismatch decoder/render thật trên texture sóng (le8 vẫn 99–99,9%).

## 6. Cổng G12 step-4 vs full-pixel + noise10 w1920 lặp lại

- **Chênh lệch G12 do LẤY MẪU, không do kernel.** Test-pattern w1920 lặp lại đúng mismatch E9: full-pixel ratioR 0,95 ÁP d0 (plainMad 1,02 / d0std_R 1,12 / residStd_R 1,18 — trùng từng số E9); step-4 ratioR 1,33 KHÔNG áp; step-4 lấy mẫu đầy đủ ratioR 1,37 KHÔNG áp. d0std_R gần như không đổi khi lấy mẫu (1,15 vs 1,12) nhưng residStd_R step-4 bị đánh giá thấp (0,84 vs 1,18, −29%). Ở w1920 kernel cố định (trilinear, downscale) nên kernel không thể là nguyên nhân. Ocean w1920: full-pixel ratioR 2,57 vs step-4 2,59 — đồng ý (cùng KHÔNG áp; quyết định do d0std_R 3,96 > 2,0).
- **Cổng G12 nhạy với kernel qua residStd_R** (ghi nhận, không phải lỗi): test-pattern w2560 ratioR 1,23 (tri, KHÔNG áp) → 0,96 (BC, ÁP d0); basgo w2560 1,04 (KHÔNG áp) → 0,77 (ÁP d0). **Verdict noise KHỚP cả 2 cách** (d0 gần như không ảnh hưởng ở đây: basgo Δkurt 0,14 vs 0,13). Cổng lật nhưng kết luận không đổi.
- **noise10 w1920 Δkurt R 0,34 ỔN ĐỊNH qua 2 capture:** capture F6 (mới) 0,34 (có-d0) / 0,33 (không-d0) — trùng đúng số E9 0,34. Không phải may mắn một capture; nhưng vẫn sát nút ngưỡng 0,35 (chỉ còn 0,01 dư) — xem §7.
- Step-4 T3 sau khi nối: w1440 noise05/noise10 LỆCH (Δkurt R 0,46/0,44), w1920 noise10 LỆCH (0,36) — **giữ nguyên artifact lấy mẫu đã biết từ E9**, full-pixel tương ứng đều KHỚP. Step-4 chỉ là xấp xỉ; đừng dùng step-4 để kết luận noise.

## 7. Giới hạn trung thực (nợ mở / chưa giải quyết)

1. **Plain MAD của BC tệ hơn tam giác 0,02–0,15 ở mọi nội dung** (test-pattern +0,048; ocean +0,149; basgo +0,135; slovenska +0,024). Ocean vượt ngưỡng KHỚP (2,086 > 2,0, le8 99,3%). BC thắng ở sharpen/noise nhưng thua ở plain — trade-off có thật, đã chấp nhận vì sharpen+noise là thứ kernel upscale quyết định (plain MAD chủ yếu do base mismatch decoder/render, không do kernel).
2. **Thang 1,264/2,264 nhiễm downscale** (§4) — chưa phân biệt được kernel ở thang >1,3. Cần probe sạch ở thang lớn (project 1280, cửa sổ lớn hơn, hoặc nội dung 4K) mới kết luận BC ở thang lớn.
3. **T3 dẹt 512×16 nói tam giác KHỚP TỪNG SỐ ở thang 2,0 — chưa được giải quyết triệt để.** U2 đã chứng minh hình học dẹt không đại diện viewport thật ở s<0,5; ở upscale, probe dẹt 2,0 vẫn mâu thuẫn với BC (BC khớp viewport thật 1,132). Nợ đợt sau: probe xung hình vuông ở upscale (thay vì dẹt) để xem tam giác hay BC đúng ở thang 2,0.
4. **D3 stale-element (bug harness):** `RAW_FN` bản E9 lấy video element đầu tiên trong `__vcutMediaEls`; pool giữ element nguồn cũ nên nguồn thứ 2+ bị đọc nhầm element nguồn đầu (Run B: ocean cho hash y hệt test-pattern `ad4be1d3`). Đã sửa: khớp theo `duration` (4 nguồn khác nhau: 4s / 6,4s / 26,1s / 54,133s), fallback srcKey rồi els[0] — fix có tác dụng (Run A ocean hash riêng `76a63ff8`). **Hậu quả còn lại: D3 của nguồn thứ 2+ trong Run A/B chỉ kiểm chứng element đầu pool** — phải ghi vào đây; tính đúng đắn snapshot được chứng minh độc lập bằng plain-MAD cross-check + D1/D2 + mean riêng từng nội dung. Không chạy lại A/B chỉ vì D3.
5. **Kernel BC bị cắt đuôi** (§1): `chromeWeights1D` h=1 cắt |x| ∈ [1,5, 2) rồi chuẩn hoá lại. Đây đúng là quy ước E9 đã fit — nhưng nếu Chrome thật dùng đủ support ±2 thì mô hình này vẫn là xấp xỉ (dù khớp số đo). Ghi rõ để đợt sau không "sửa" h thành 2 mà không đo lại.
6. **noise10 w1920 Δkurt R 0,34 sát nút ngưỡng 0,35** (dư 0,01), ổn định qua 2 capture (§6). Bất kỳ thay đổi nhỏ nào ở pipeline (decoder, Chrome mới) cũng có thể lật verdict này — theo dõi ở các đợt sau, không coi là "an toàn".
7. **G12 step-4 ≠ full-pixel** (§6) — step-4 đánh giá thấp residStd_R ~29% ở w1920. Mọi kết luận noise từ step-4 phải đối chiếu full-pixel; cổng G12 chỉ tin cậy ở full-pixel.
8. **Chỉ đo 1 frame (frame 30) mỗi biến thể, 4 nội dung, 2 thang sạch (0,632 / 1,132).** Chưa đo thang upscale dị hướng (sx≠sy), thang <0,38, nội dung 4K, hay frame khác (motion mạnh). Phạm vi nối chỉ sx>1 && sy>1 — dị hướng upscale một trục chưa đo, chưa nối.

## 8. File liên quan

- Đổi: `apps/web/scripts/chrome-resample.mjs` (nối kernel + header F6).
- Thêm (harness đo, trong repo): `apps/web/scripts/r78f6-render-frames.mjs`, `r78f6-fullpixel-headed.mjs`, `r78f6-fullpixel-analyze.mjs`, `r78f6-frame-offset.mjs`, `r78f6-downscale-check.mjs`.
- Bằng chứng (hidden_files, KHÔNG stage — không phải file repo): `hidden_files/round78-f6/` (snaps JSON, log headed/analyze, `r78f6-analysis.json` PRE-wiring, `r78f6-e9-rerun-analysis.json`, `r78f6-t3-compare.json`, log luồng `round78-f6.md`).
- File này: `docs/PHASE9_ROUND78_F6_KERNEL_BC_LIMITS.md`.
