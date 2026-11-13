# Phase 9 đợt 75, luồng C2 — Model dị hướng riêng cho resample (LOD trung bình nhân + bilinear float): ĐÃ XONG (đóng nợ đợt 74 §4.2)

> **Kết luận chốt:**
> 1. **Model dị hướng riêng đã tìm ra và đã MERGE vào production: LOD theo
>    TRUNG BÌNH NHÂN s = √(sx·sy) (thang bảo toàn diện tích), trilinear
>    blend-at-end như A1, bilinear tính FLOAT (chỉ làm tròn một lần ở
>    cuối).** Trên toàn bộ lưới pha mịn headed dẹt của B2 (1.536 điểm ×
>    6 cặp, **259.584 ô**) + 2 cặp đẳng hướng đối chứng (86.528 ô):
>    **RMSE = 0, maxAbs = 0 — mô hình EXACT từng số, không chỉ maxAbs = 1.**
>    Tổng **346.112 ô, 0 ô lệch dù chỉ 1 mức.**
> 2. **Quy tắc min-scale của A1 (s = min(sx, sy)) SAI LỚN ở dẹt** (RMSE
>    1,33–3,76, maxAbs 41–60, 328–1024 ô ≥ 4/cặp) — mọi số khớp maxAbs = 1
>    của A1 chỉ đúng khi sx = sy. Quy tắc per-axis 4-mip (M1/ripmap) cũng
>    sai (RMSE 1,29–3,04, maxAbs 39–51). **Không một kernel tách trục đơn
>    nào (triangle/Gauss/box/Mitchell, kể cả (hx,hy) tự do từng cặp) fit
>    được dẹt** — tốt nhất (Gauss σ=0,5) cũng chỉ RMSE 0,85, maxAbs 15.
>    Kernel thật không phải một kernel đơn: nó là trilinear trên mip 2D
>    với LOD diện tích.
> 3. **M4 giải luôn mâu thuẫn vuông-vs-dẹt còn mở từ đợt 67 (U2):** trên
>    sweep DẸT độc lập 512×16 (sy=1, 6 thang), M4 cho maxAbs = 1 mọi thang
>    (RMSE 0,021–0,063), trong khi bản min-scale lệch maxAbs 89–109.
>    Sweep vuông đối chứng: M4 ≡ NEW đúng từng số.
> 4. **Dư ±1 còn lại của M4 ban đầu (RMSE 0,045–0,077, maxAbs = 1) hóa ra
>    chỉ là làm tròn trung gian:** `bilinearPlane2D` cũ làm `roundHalfDown`
>    sau từng pass. Bỏ làm tròn giữa các pass (bilinear float, làm tròn
>    một lần ở cuối) → **RMSE = 0**. Halve VẪN `roundHalfDown` (mức mip là
>    uint8 — đã đo: impulse mip1 = 127). Phát hiện phụ: 1-kernel thuần
>    (`resamplePlane`, float) cũng cho RMSE = 0 / maxAbs = 0 trên toàn bộ
>    lưới iso 384×384 (43.264 ô).
> 5. **Production đã đổi (2 chỗ + test):** `resamplePlaneTrilinear` dùng
>    s = √(sx·sy) thay cho min(sx, sy); `bilinearPlane2D` tính float;
>    module tham chiếu Z7 đổi cùng quy tắc (vẫn bit-identical).
>    Test: `chrome-resample-67u2.test.mjs` **8/8**,
>    `r72z7-trilinear-2dblend.test.mjs` **6/6** (thêm 2 test dị hướng mới),
>    `tsc` web **0 lỗi**. Một giá trị pin đổi theo hướng ĐÚNG: peak xung
>    2D tại s=0,63 từ 55 → **56 = đúng giá trị đo headed từng số** (55 là
>    artefact làm tròn cũ). **Verdict w1920/w2560: 24/25 pass, y hệt B2**
>    (cùng 1 FAIL đã biết — ô test-pattern noise10 w1920 lật so với baseline
>    Y2 cũ); chỉ 3 Δkurt R dịch ≤ 0,01, mọi verdict không đổi.
>    **KHÔNG thêm key i18n** (không đụng chuỗi UI) — dict giữ 2405 key.

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
  **KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG file workflow.**
  Mọi số là đo thật trên VM này (Node v24.22.1; dữ liệu headed Chromium
  158 qua Xvfb của B2/U2/Z7, dùng lại — không chạy headed capture mới).
- Nợ đóng: đợt 74 §4 mục 2 (B2 §7 mục 1: kernel dị hướng chưa có dạng đóng;
  production blend-at-end chỉ xác thực cho sx = sy) + mâu thuẫn vuông-vs-dẹt
  của U2 (đợt 67, sweep dẹt khác vuông ở s<0,5).
- Quy ước kurt: excess kurtosis, như pipeline verdict T3/X6 (ngưỡng
  KHỚP: std ratio [0,85, 1,18]; Δkurt ≤ 0,35; Δcorr ≤ 0,12).

## 1. Chẩn đoán: kernel tách trục với (hx,hy) tự do từng cặp — vẫn không đủ

Script: `hidden_files/round75-c2/r75c2-aniso-fit.mjs` (mô phỏng trực tiếp
như kernel-fit của B2, ~49 s cho toàn bộ). Dữ liệu: lưới dẹt headed B2
(1.536 điểm × 6 cặp) + lưới iso đối chứng (230×230, 384×384).

### 1.1 Grid-search độc lập từng cặp (tham số tự do mỗi cặp — chặn trên của họ kernel đơn)

| Cặp (sx, sy) | Triangle tốt nhất (hx, hy) | RMSE | maxAbs | Gauss tốt nhất (σx, σy) | RMSE | maxAbs |
|---|---|---|---|---|---|---|
| 230×384 (0,4492, 0,75) | (1,25, 1,25) | 1,2076 | 30 | (0,5, 0,5) | **0,854** | 15 |
| 384×230 (0,75, 0,4492) | (1,25, 1,25) | 1,2076 | 30 | (0,5, 0,5) | **0,854** | 15 |
| 282×196 (0,5508, 0,3828) | (1,5, 1,75) | 1,3228 | 32 | (0,6, 0,75) | 1,2192 | 28 |
| 196×282 (0,3828, 0,5508) | (1,75, 1,5) | 1,3228 | 32 | (0,75, 0,6) | 1,2192 | 28 |
| 512×128 (1,0, 0,25) | (1,25, 1,75) | 0,8652 | 11 | (0,5, 0,9) | 0,8737 | 10 |
| 256×512 (0,5, 1,0) | (0,75, 0,5) | **0** | **0** | (0,3, 0,3) | **0** | **0** |

- Ngay cả với tham số TỰ DO từng cặp, họ kernel đơn tốt nhất cũng chỉ
  RMSE 0,85–1,32, maxAbs 10–32 — xa chuẩn iso (RMSE ~0,06, maxAbs = 1).
  Tham số tốt nhất nhảy lung tung theo cặp (σ 0,5–0,9), không có quy luật
  chung. **Kết luận: kernel thật không phải một kernel tách trục đơn.**
- Ngoại lệ 256×512 khớp đúng từng số với nhiều tham số (triangle
  (0,75, 0,5) và Gauss (0,3, 0,3) đều RMSE = 0) — cặp này suy biến (một
  trục không scale), không phân biệt được họ kernel; không dùng làm bằng
  chứng cho họ nào. (OLD per-pass của B2 cũng khớp ở đây với RMSE 0,0769
  — sai số chỉ do làm tròn trung gian, xem §3.)

### 1.2 Các rule thống nhất (một công thức cho cả hai trục)

| Rule | RMSE toàn bộ | maxAbs | Ghi chú |
|---|---|---|---|
| gaussDst σ=0,3 dst px | **1,5229** | 36 | tốt nhất nhóm (trùng B2) |
| gauss σ=0,5·max(1,1/(2s)) | 1,5299 | 34 | |
| triChrome h=max(1,1/(2s)) | 1,6672 | 65 | 256×512: RMSE 0 |
| triDst H=0,75 dst px | 1,6948 | 39 | |
| gauss σ=0,5 cố định | 1,7661 | 54 | |
| triDst H=0,6 dst px | 1,9113 | 41 | |
| tri h=1 (bilinear thuần) | 2,4333 | 125 | |
| mitchell (support 2) | 2,4649 | 92 | |
| triArea h=1/s | 2,8326 | 84 | |
| box w=1/(2s) | 3,1008 | 91 | |
| 2-stage halve-box ⊛ triangle | 4,3143 | 115 | giả thuyết cascade CHẾT |

- Đối chứng đẳng hướng của 3 rule tốt nhất: gaussDst σ=0,3 cho ISO RMSE
  1,0718 / maxAbs 20; gauss σ=0,5·… cho 1,6161 / 42; triChrome 1,7731 /
  75 — **mọi rule dị hướng đều THUA ở iso** (NEW cho 0,054–0,064 / 1).
  Chi tiết đáng chú ý: triChrome cho RMSE = 0 tại 384×384 (xem §3).
- Hệ quả: model dị hướng KHÔNG thể là một kernel đơn tách trục. Phải là
  mô hình có cấu trúc khác (mip) — xem §2.

## 2. M1–M4: chạy lại script B2 — M4 (trung bình nhân) thắng áp đảo

Script B2 `r74b2-2d-fit-aniso2.mjs` đã viết nhưng CHƯA chạy trong đợt 74;
luồng này chạy lại (181 s, EXIT=0, mẫu 64 điểm/cặp). Kết quả (10.816 ô/cặp):

| Cặp | NEW (min-scale) | M1 per-axis 4-mip | M2 thuần triangle | M3 max-scale | **M4 geo-mean √(sx·sy)** |
|---|---|---|---|---|---|
| 230×384 | 2,3214 / 60 | 1,9684 / 39 | 1,7641 / 45 | 1,7641 / 45 | **0,0652 / 1** |
| 384×230 | 2,3210 / 60 | 1,9701 / 39 | 1,7711 / 46 | 1,7711 / 46 | **0,0666 / 1** |
| 282×196 | 1,3348 / 53 | 1,2961 / 39 | 3,1405 / 125 | 1,3276 / 53 | **0,0451 / 1** |
| 196×282 | 1,3356 / 53 | 1,2948 / 39 | 3,1351 / 124 | 1,3201 / 52 | **0,0552 / 1** |
| 512×128 | 3,3300 / 60 | 3,0392 / 51 | 3,0270 / 51 | 3,0270 / 51 | **0,0544 / 1** |
| 256×512 | 3,7567 / 41 | 0,0769 / 1 | 0,0769 / 1 | 0,0769 / 1 | **0,0769 / 1** |

(RMSE / maxAbs; M4: 0 ô ≥ 4 mọi cặp.)

- **M4 = trilinear blend-at-end với s = √(sx·sy):** λ=log2(1/s),
  λ*=max(0,λ−0,5), L=floor(λ*), f=λ*−L,
  out=(1−f)·Bilin2D(mip L)+f·Bilin2D(mip L+1), mip 2D halve box 2×2.
  Khi sx=sy thì s_geo=s nên M4 ≡ NEW — đúng như B2 dự đoán cần "một
  model thống nhất suy về NEW khi sx=sy và về OLD khi một trục f=0"
  (B2 §2): tại 256×512, s_geo=√0,5≈0,7071 → λ*=0 → thuần bilinear,
  khớp đúng như OLD.
- M1 (LOD từng trục + blend 4-mip, "ripmaps") **thua hẳn M4** và cũng thua
  OLD ở 5/6 cặp — giả thuyết ripmap bị loại bằng số. M3 (thang lớn nhất)
  ≡ M2 ở 2 cặp (vì f=0) và thua M4 mọi cặp. M2 (thuần triangle) tệ nhất
  ở 282×196 (maxAbs 125).
- Vì sao M4 đúng về mặt nguyên tắc: √(sx·sy) là thang bảo toàn diện tích
  (định thức của ma trận scale) — quy tắc LOD theo diện tích, chuẩn cho
  trường hợp không làm lọc dị hướng thật (anisotropic filtering). Skia/
  Chrome dùng thang diện tích thay vì thang trục co nhất.

## 3. Kiểm chứng đầy đủ M4, rồi production cuối (geo-mean + bilinear float)

### 3.1 M4 đầy đủ (roundHalfDown từng pass như production cũ)

Script: `hidden_files/round75-c2/r75c2-verify-m4-full.mjs` (470 s) — toàn bộ
256 điểm × 6 cặp dẹt + 2 cặp iso, resample full-plane 512×512 mỗi điểm:

| Cặp | M4 RMSE | M4 maxAbs | M4 ô ≥ 4 | NEW RMSE | NEW maxAbs |
|---|---|---|---|---|---|
| 230×384 | 0,0652 | 1 | 0 | 2,3214 | 60 |
| 384×230 | 0,0666 | 1 | 0 | 2,3210 | 60 |
| 282×196 | 0,0456 | 1 | 0 | 1,3348 | 53 |
| 196×282 | 0,0552 | 1 | 0 | 1,3356 | 53 |
| 512×128 | 0,0544 | 1 | 0 | 3,3300 | 60 |
| 256×512 | 0,0769 | 1 | 0 | 3,7567 | 41 |
| **Tổng dẹt (259.584 ô)** | **0,0615** | **1** | **0** | — | — |
| 230×230 (iso) | 0,0638 | 1 | 0 | 0,0638 | 1 |
| 384×384 (iso) | 0,0544 | 1 | 0 | 0,0544 | 1 |

- Mẫu 64 điểm và đầy đủ 256 điểm cho cùng số tới 4 chữ số thập phân —
  không có lệch pha lẻ nào bị mẫu chẵn che.
- **M4 ≡ NEW bit-identical ở iso:** so full-plane trực tiếp, maxDiff = 0
  (0 ô khác) cả hai cặp iso — đổi quy tắc LOD là no-op khi sx = sy.

### 3.2 Dư ±1 chỉ do làm tròn trung gian → bilinear float cho EXACT

- Gợi ý từ §1.2: `resamplePlane` (1-kernel, float, chỉ làm tròn cuối) cho
  **RMSE = 0,0000 / maxAbs = 0** trên toàn bộ lưới iso 384×384 (43.264 ô)
  — bilinear thuần không-mip của Chrome là EXACT khi tính float.
- Script: `hidden_files/round75-c2/r75c2-verify-m4-float.mjs` (127 s, mẫu
  64 điểm/cặp): M4 với bilinear float (không `roundHalfDown` giữa các
  pass, chỉ `Math.round` cuối) cho **RMSE = 0 / maxAbs = 0 mọi cặp**
  (6 dẹt + 2 iso), trong khi M4 cũ cho 0,045–0,077 / 1. Halve VẪN
  `roundHalfDown` (mức mip là uint8 — đã đo).
- **Production cuối** (geo-mean + bilinear float) kiểm chứng đầy đủ
  (script `r75c2-verify-prod-full.mjs`, 287 s, dùng thẳng hàm production):
  **RMSE = 0, maxAbs = 0, 0 ô ≥ 1 trên toàn bộ 8 cặp = 346.112 ô.**
  Mô hình resample của Chrome giờ là EXACT từng số trên mọi dữ liệu
  headed đã đo (dẹt + vuông + sweep dẹt, xem §4).

### 3.3 Hệ quả cho test 1D cũ (mặt phẳng 512×1)

- Với s_geo, mặt phẳng 512×1 (sy=1) có s=√sx ≠ sx nên KHÔNG còn là mô
  hình đúng cho sweep vạch dọc trên canvas vuông. Các test 1D trong
  `chrome-resample-67u2.test.mjs` đã đổi sang hình học thật của fixture
  (vạch dọc trên canvas 512×512, đọc hàng y=98) — **giữ nguyên mọi giá
  trị đo đã pin** (mad 0, peak 101, tap 127) và xanh 8/8. Đây là sửa
  test cho đúng hình học, không phải nới kỳ vọng.
- `trilinearRow1D` (helper 1D thuần) GIỮ NGUYÊN (chỉ còn dùng trong các
  script phân tích cũ r71y2/r72z9; pipeline 2D — đường chạy thật — đã
  exact nên không cần đụng tới).

## 4. Kiểm chứng độc lập: sweep DẸT của U2 (512×16, sy=1)

Script: `hidden_files/round75-c2/r75c2-verify-flat-sweep.mjs` (36 s) —
dữ liệu headed probe 2 đợt 67 (`r67u2-filter2-A.json`, vạch dọc, 6 thang),
canvas dẹt 512×16 → dw×16, hàng y=8; đối chứng vuông 512×512 → dw×dw:

| s | DẸT: M4 (RMSE / maxAbs) | DẸT: NEW (RMSE / maxAbs) | VUÔNG: M4 | VUÔNG: NEW |
|---|---|---|---|---|
| 0,30 | **0,051 / 1** | 3,8238 / 90 | 0 / 0 | 0 / 0 |
| 0,35 | **0,0442 / 1** | 4,3594 / 106 | 0,0472 / 1 | 0,0472 / 1 |
| 0,3828 | **0,0268 / 1** | 4,0608 / 109 | 0,0505 / 1 | 0,0505 / 1 |
| 0,40 | **0,0312 / 1** | 4,356 / 105 | 0,0312 / 1 | 0,0312 / 1 |
| 0,45 | **0,0208 / 1** | 3,37 / 89 | 0,0361 / 1 | 0,0361 / 1 |
| 0,50 | **0,0625 / 1** | 0,0625 / 1 | 0 / 0 | 0 / 0 |

- M4 khớp sweep dẹt ở mọi thang (bản M4 ở đây là bản roundHalfDown cũ —
  maxAbs = 1; bản float cuối còn exact hơn, xem §3.2). Bản min-scale
  lệch maxAbs 89–109 — đúng mâu thuẫn U2 đã ghi (MAD 0,29 giữa vuông
  và dẹt ở s<0,5). **Mâu thuẫn này giờ đã giải:** vuông và dẹt khác nhau
  vì LOD tính theo diện tích, không phải theo trục co nhất; một model
  duy nhất giải thích cả hai.
- Tại s=0,5, M4 và NEW trùng nhau (0,0625) — như U2 đã đo ("ở s=0,5
  giống hệt").

## 5. Merge production + test

### 5.1 Code đổi (2 file, 3 chỗ + chú thích)

- `apps/web/scripts/chrome-resample.mjs`:
  - `resamplePlaneTrilinear`: `Math.min(sx, sy)` → `Math.sqrt(sx * sy)`
    (dòng LOD duy nhất); doc comment + header cập nhật (ghi chú C2).
  - `bilinearPlane2D`: bỏ `roundHalfDown` sau từng pass (tính float);
    `resamplePlaneTrilinear` làm tròn một lần ở blend cuối (`Math.round`)
    và ở nhánh f=0 (mới thêm — trước đây nhánh f=0 trả giá trị đã nguyên
    nhờ làm tròn từng pass; giờ phải làm tròn tường minh để giữ hợp đồng
    "trả giá trị nguyên").
  - `halvePlane2D` KHÔNG đổi (mip uint8, `roundHalfDown` đã đo).
- `apps/web/scripts/r72z7-trilinear-2dblend.mjs` (module tham chiếu):
  đổi cùng 2 chỗ (`Math.min` → geo-mean; `bilinear2D` float + làm tròn
  nhánh f=0) để production vẫn bit-identical với nó.

### 5.2 Test

| Suite | Kết quả |
|---|---|
| `chrome-resample-67u2.test.mjs` (`node --test`) | **8/8 pass** |
| `r72z7-trilinear-2dblend.test.mjs` (`node --test`, 131 s) | **6/6 pass** (thêm 2 test dị hướng mới, §5.3) |
| `tsc` web (`npx tsc --noEmit`, apps/web) | **0 lỗi** |
| vite build | KHÔNG chạy (chỉ đụng `apps/web/scripts/*.mjs` — harness đo, không phải code web bundle; như A1) |

- **1 giá trị pin đổi theo hướng ĐÚNG:** peak xung 2D tại s=0,63
  (dw=323) từ **55 → 56**. 56 là giá trị đo headed từng số (Z7:
  (256,256) dw=323 đo 56); 55 là artefact làm tròn `roundHalfDown`
  từng pass của bản cũ. `peak1` (1-kernel) vẫn 64. Mọi test 1D/vạch
  dọc giữ nguyên số đã pin (mad 0, peak 101, tap 127, 2-stage 108/128).
- **Test dị hướng mới** (`r72z7-trilinear-2dblend.test.mjs`):
  (5) khớp lưới dẹt B2 — 8 điểm/cặp × 6 cặp, cả module tham chiếu lẫn
  production, maxAbs ≤ 2, RMSE ≤ 0,1 (đo thật: maxAbs = 0);
  (6) production bit-identical với module tham chiếu ở dẹt (xung điểm
  512×512→230×384 + nhiễu ngẫu nhiên 512×512→282×196, `deepEqual`).

### 5.3 Ghi chú nghiên cứu Skia (cơ chế — chưa phải bằng chứng quyết định)

- Một luồng nghiên cứu song song đã đọc mã nguồn Skia (commit
  `b5b6f29d690f`, Chromium `f73447c0…`); báo cáo đầy đủ đã về sau khi
  LIMITS viết lần đầu (bổ sung 09/11, xem thêm §5.4). Kết luận của nó:
  `imageSmoothingQuality="high"` nhiều khả năng là **bicubic Mitchell
  tách trục (B=C=1/3), 4×4 tap, ở mức gốc, không mip, không giãn kernel
  theo 1/s** (mô hình A), dựa trên `SkSamplingPriv::FromFQ` (`kHigh` →
  `SkCubicResampler{1/3, 1/3}`), `SkMipmapMode::kNone`, và assert
  `SkImageShader.cpp` L1022–1072 (`!sampling.useCubic ||
  sampling.mipmap == kNone`). **Ghi rõ: giả thuyết này KHÔNG khớp số đo
  headed** — C2 đã kiểm chứng ĐÚNG công thức của báo cáo (không chuẩn
  hoá lại tổng trọng số, clamp [0,255] sau cộng, half-pixel chuẩn;
  script `hidden_files/round75-c2/r75c2-verify-skia-mitchell.mjs`, 0,2 s)
  trên lưới dẹt đầy đủ + lưới iso: dẹt RMSE 1,02–2,97 / maxAbs 8–92
  (480–1024 ô ≥4 mỗi cặp), iso 230×230 RMSE 3,40 / maxAbs 100, iso
  384×384 RMSE 0,60 / maxAbs 9 — trong khi trilinear geo-mean khớp
  EXACT 346.112 ô (RMSE 0, maxAbs 0). B2 kernel-fit (chuẩn hoá Σ=1):
  Mitchell RMSE 2,4649 / maxAbs 92. Model A bị bác bằng số, hai lần,
  hai cách tính khác nhau.
- Giả thuyết hoà giải #1 của báo cáo nghiên cứu ("ảnh test uniform quá
  mềm — gradient/ramp nên cubic và trilinear đều khớp") **sai với dữ
  liệu của luồng này**: các fit uniform dùng lưới xung điểm (impulse)
  Z7/B2, không phải chỉ gradient — Mitchell lệch maxAbs 100 ngay tại
  230×230 iso. Giả thuyết #2 ("GPU downscale = trilinear, bicubic chỉ
  upscale") cũng không giải thích được geo-mean: LOD Vulkan là đạo hàm
  lớn nhất (tương đương min-scale), mà min-scale đã bị bác ở dẹt
  (maxAbs 60).
- Điểm xác nhận được từ mã nguồn: `SkMipmap::ComputeLevel`
  (L394–440) dùng thang nhỏ nhất, bias −0,5 ("Use the smallest scale
  to match the GPU impl", "-0,5 bias … to emulate GPU's sharpen
  mipmap option") — khớp đúng quy tắc LOD của trường hợp uniform
  (ở đó min = geo-mean nên hai quy tắc trùng nhau). Nhưng đường CPU
  raster (`SkMipmapAccessor`, single scalar level, không ripmap/aniso)
  nói min-scale, trong khi headed đo geo-mean EXACT — **mâu thuẫn
  chưa giải được**: backend thực tế trong phép đo headed chưa xác
  định được (Graphite/SwiftShader hay software raster; `--disable-gpu`
  không phân biệt được), và code sampler phía Graphite không locate
  được (luồng nghiên cứu không tìm thấy `asFragmentProcessor` cho
  image shader; 2 file fetch timeout — `cc/paint/paint_flags.cc`,
  `src/opts/SkRasterPipeline_opts.h` — không thử lại; `SkMipmap::
  MakeDownSampler` không tìm thấy định nghĩa).
- **Kết luận đứng:** mô hình được chọn bằng số đo headed (geo-mean
  trilinear, exact 346.112 ô), không bằng đọc mã nguồn. Cơ chế chính
  xác (backend nào, vì sao LOD diện tích) vẫn là câu hỏi mở; hướng
  kiểm chứng tiếp theo (không thuộc luồng này): chạy lại phép đo với
  `--disable-skia-graphite` để phân biệt backend, và chạy uniform với
  ảnh xung (đã có — Mitchell đã bị bác).

### 5.4 Bổ sung sau báo cáo Skia đầy đủ (09/11)

- Script `r75c2-verify-skia-mitchell.mjs` (+ `.log`, `.json`) lưu ở
  `hidden_files/round75-c2/` (KHÔNG stage — script kiểm chứng nội bộ).
  Kết quả đầy đủ: 230×384 RMSE 1,9892 maxAbs 43; 384×230 y hệt;
  282×196 RMSE 2,9739 maxAbs 92; 196×282 y hệt; 512×128 RMSE 2,6608
  maxAbs 45; 256×512 RMSE 1,0234 maxAbs 8; iso 230×230 RMSE 3,3954
  maxAbs 100; iso 384×384 RMSE 0,5958 maxAbs 9. Mitchell gần nhất ở
  384×384 (downscale nhẹ, sx=sy=0,75 — cubic và trilinear gần nhau)
  nhưng vẫn lệch maxAbs 9; ở 230×230 lệch maxAbs 100 — bác dứt điểm.
- Không đổi model, không đổi batch đã stage: chỉ bổ sung §5.3/§5.4
  vào LIMITS này (cùng 1 file đã stage, không thêm file mới).

## 6. Verdict nhiễu w1920/w2560 tính lại bằng production cuối

Script: `hidden_files/round75-c2/r75c2-verify-verdict-w1920-w2560.mjs`
(bản sao script B2, chỉ đổi tên output; import thẳng production) —
chạy 2 lần: lần 1 ngay sau merge geo-mean (production còn roundHalfDown),
lần 2 sau khi đổi bilinear float. Kết quả lần 2 (final, 54 s):
**24/25 check pass**, y hệt B2 (cùng 1 FAIL đã biết).

- Lần 1 (geo-mean + roundHalfDown): JSON **giống hệt B2 từng check
  (0/25 khác)** — đúng như dự đoán (viewport iso → geo-mean là no-op).
- Lần 2 (geo-mean + float): vẫn 24/25; chỉ 3 check khác B2 ở chuỗi chi
  tiết Δkurt R (dịch ≤ 0,01), **mọi verdict KHÔNG đổi**:
  - w1920 test-pattern noise05: Δkurt R 0,28 → **0,27** (vẫn KHỚP)
  - w1920 slovenska noise05: Δkurt R 0,15 → **0,14** (vẫn KHỚP)
  - w2560 test-pattern noise05: Δkurt R 0,38 → **0,37** (vẫn LỆCH)
  - plainAbsMad dịch ≤ 0,037 (basgo w1920: 1,250 → 1,213; slovenska:
    1,917 → 1,883; ocean: 2,682 → 2,670; test-pattern: 1,019 → 1,020;
    w2560: 1,029 không đổi).
  - Ô FAIL duy nhất vẫn là test-pattern noise10 w1920 (Δkurt R 0,34,
    KHỚP — lật thật so với baseline Y2 cũ LỆCH, như B2 đã ghi; KHÔNG
    phải hồi quy do đổi này).

## 7. Giới hạn còn lại / nợ mở

1. **GPU thật / Safari thật vẫn chưa đo** (nợ kế thừa; mọi kết luận chỉ
   đúng trên CPU/SwiftShader + Chromium 158). LOD diện tích có thể khác
   trên GPU (anisotropic filtering thật) — cần probe headed trên GPU
   thật trước khi dùng model này cho đường render GPU.
2. **Cơ chế Skia chính xác** (§5.3–5.4) vẫn mở — model đã exact bằng
   số đo, Mitchell ở mức gốc đã bị bác bằng số hai lần (B2 kernel-fit
   và C2 công thức có clamp), nhưng vì sao LOD là geo-mean thay vì
   min-scale như `SkMipmap::ComputeLevel` nói thì chưa rõ (backend
   headed chưa xác định: Graphite/SwiftShader hay software raster;
   code sampler Graphite chưa locate được). Hướng kiểm chứng: chạy lại
   phép đo với `--disable-skia-graphite`.
3. **`trilinearRow1D` (helper 1D thuần) giữ rounding cũ** — chỉ dùng trong
   script phân tích cũ; pipeline 2D đã exact. Nếu đợt sau dùng helper 1D
   cho việc mới thì kiểm tra lại rounding của nó (có thể cũng cần float).
4. **Ocean w1440 (Δkurt G 1,12 + Δcorr 0,233)** vẫn chưa giải thích xong
   (nợ kế thừa Z7 §9.4 / B1) — do bước scale video-path 1920→1280, ngoài
   phạm vi luồng này (luồng C1 đợt 75 đang xử lý).
5. **DCT trong decode thật** chưa mô phỏng (hướng còn lại cho khoảng
   thiếu Y8, B2 §6.3) — ngoài phạm vi luồng này.
6. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền,
   chờ user) — nợ chung.
7. Ngưỡng khớp số ±0,011 của script verify-verdict (hiệu chuẩn ở w1440)
   vẫn quá chặt cho Δcorr ở w1920 (B2 §7 mục 7) — đợt sau nên hiệu
   chuẩn lại ngưỡng theo cửa sổ, hoặc so verdict thay vì so số tuyệt đối.

## 8. Đã làm / không làm

1. **ĐÃ** fit kernel tách trục (grid-search độc lập từng cặp + 17 rule
   thống nhất) → loại họ kernel đơn bằng số.
2. **ĐÃ** chạy lại M1–M4 của B2 → M4 (geo-mean) thắng áp đảo trên mẫu
   64 điểm/cặp.
3. **ĐÃ** kiểm chứng đầy đủ M4 (259.584 ô dẹt + 86.528 ô iso, maxAbs = 1)
   + sweep dẹt U2 độc lập (M4 maxAbs = 1, NEW 89–109).
4. **ĐÃ** phát hiện dư ±1 chỉ do làm tròn trung gian → bilinear float →
   production cuối **EXACT (RMSE = 0, maxAbs = 0, 346.112 ô)**.
5. **ĐÃ** merge vào production (`chrome-resample.mjs` + module tham
   chiếu Z7) + cập nhật 2 test suite (thêm 2 test dị hướng mới; sửa test
   1D sang hình học thật; peak 55 → 56 đúng số đo) + chạy `node --test`
   cả 2 suite + `tsc` 0 lỗi.
6. **ĐÃ** tính lại verdict w1920/w2560 bằng production cuối (24/25,
   y hệt B2; 3 Δkurt R dịch ≤ 0,01, verdict không đổi).
7. **KHÔNG** thêm key i18n (không đụng chuỗi UI — dict giữ 2405 key,
   không cần bump test khóa số key); **KHÔNG** sửa code sản phẩm web
   nào (`apps/web/src` không import module này); **KHÔNG** chạy lại
   headed capture; **KHÔNG** push/tag/binary/workflow.

## 9. Ghi chú vận hành (để đợt sau khỏi lặp)

1. **Script B2 `r74b2-2d-fit-aniso2.mjs` (M1–M4) đã viết nhưng chưa chạy
   trong đợt 74** — luồng này chạy lại và nó cho đáp án ngay (M4). Đợt
   sau: kiểm tra các script "đã viết, chưa chạy" trong hidden_files trước
   khi viết script mới.
2. **Fit kernel trực tiếp rẻ hơn fit full-plane ~100×** (49 s vs ~8 phút
   cho cùng dữ liệu) — dùng để loại họ mô hình trước, chỉ verify
   full-plane ứng viên thắng.
3. **Làm tròn trung gian là nguồn sai số thật:** residual RMSE ~0,05
   trông như "nhiễu mô hình" nhưng hóa ra chỉ là `roundHalfDown` từng
   pass. Khi một mô hình đã cho maxAbs = 1 khắp nơi, hãy thử bỏ làm
   tròn trung gian trước khi kết luận mô hình chưa đủ.
4. **Test pin giá trị bằng mặt phẳng 1 hàng là mô hình sai hình học**
   khi quy tắc LOD phụ thuộc cả hai trục — fixture sweep vạch dọc đo
   trên canvas vuông thì test phải dùng canvas vuông (vạch dọc 2D),
   không dùng mặt phẳng 512×1 làm stand-in.

## 10. Files

- LIMITS này: `docs/PHASE9_ROUND75_C2_RESAMPLE_ANISO_MODEL_LIMITS.md`
- Code sửa: `apps/web/scripts/chrome-resample.mjs`,
  `apps/web/scripts/r72z7-trilinear-2dblend.mjs`
- Test cập nhật: `apps/web/scripts/chrome-resample-67u2.test.mjs`,
  `apps/web/scripts/r72z7-trilinear-2dblend.test.mjs`
- Log luồng:
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round75-c2.md`
- Verify nội bộ (KHÔNG stage — goal hidden_files):
  `hidden_files/round75-c2/` — `r75c2-aniso-fit.mjs` (+`.log/.json`),
  `r75c2-verify-m4-full.mjs` (+`.log/.json`),
  `r75c2-verify-flat-sweep.mjs` (+`.log/.json`),
  `r75c2-verify-m4-float.mjs` (+`.log/.json`),
  `r75c2-verify-prod-full.mjs` (+`.log/.json`),
  `r75c2-verify-verdict-w1920-w2560.mjs` (+`.log` lần 1,
  `-final.log` lần 2, `.json` = lần 2).
  Script M1–M4 đã chạy: `hidden_files/round74-b2/r74b2-2d-fit-aniso2.mjs`
  (+`r74b2-2d-fit-aniso2.json`, `r74b2-2d-fit-aniso2-r75c2.log`).
- Batch stage (KHÔNG push):
  `~/workspace/repo-1-push/paths-loop/phase9-round75-c2-resample-aniso-model.txt`
  — 5 entry (LIMITS này + 4 file code/test trên).
