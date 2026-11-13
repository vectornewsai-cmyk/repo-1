# Phase 9 đợt 76, luồng D6 — Nối M4 vào production resample + đo lại verdict: ĐÃ XONG (không cần sửa code — M4 đã có sẵn trong production từ C2)

> **Kết luận chốt:**
> 1. **Tiền đề nhiệm vụ SAI — M4 đã nối vào production từ đợt 75 C2.**
>    Kiểm chứng trên đĩa trước khi sửa: `apps/web/scripts/chrome-resample.mjs:407`
>    đã là `Math.log2(1 / Math.sqrt(sx * sy))` (geo-mean), `bilinearPlane2D`
>    đã tính float (không `roundHalfDown` giữa các pass, chỉ `Math.round`
>    một lần ở blend cuối / nhánh f=0), module tham chiếu Z7
>    (`r72z7-trilinear-2dblend.mjs:102`) cũng đã geo-mean + float.
>    C2 LIMITS §5.1/§8.5 đã ghi rõ "Production đã đổi"; chỉ có LIMITS gộp
>    đợt 75 §4 mục 6 ghi sai "hiện chỉ đo, chưa sửa code" — dòng đó là
>    lỗi ghi chép, không phải trạng thái code. **D6 KHÔNG sửa thêm một
>    dòng production nào** (sửa thừa một chỗ đã đúng chỉ tạo rủi ro
>    phá verdict; trung thực ghi lại đúng sự thật trên đĩa).
> 2. **"Production" ở đây là mô hình đo trong `apps/web/scripts/`, không
>    phải `apps/web/src/preview.tsx`.** A1 cũng chỉ sửa `chrome-resample.mjs`
>    (A1 §8.4: "KHÔNG sửa code sản phẩm web nào"); `preview.tsx` không chứa
>    hàm resample JS nào — resample thật lúc chạy là `drawImage` của trình
>    duyệt, còn `chrome-resample.mjs` là mô hình đo hành vi của Chrome dùng
>    cho pipeline verdict. D6 đã grep toàn repo: không còn chỗ nào dùng
>    quy tắc min-scale cho đường 2D (chỉ còn nhắc trong comment của script
>    probe cũ `r74b2-2d-grid-aniso.mjs` và helper 1D `trilinearRow1D` —
>    chỉ dùng trong script phân tích cũ r71y2/r72z9, không nằm trên đường
>    chạy 2D; xem §7.3 C2). Vì vậy không đụng `preview.tsx` — **không xung
>    đột với D2/D4** (cũng đang sửa file này trong đợt 76).
> 3. **Đo lại độc lập bằng đúng harness C2/B2/A1 (không chạy lại headed
>    capture, dùng lại snapshot headed đã lưu):**
>    - Lưới 2D dị hướng đầy đủ: **RMSE = 0, maxAbs = 0, 0 ô ≥ 1 trên toàn
>      bộ 346.112 ô** (6 cặp dẹt 259.584 ô + 2 cặp iso 86.528 ô) — tái hiện
>      đúng từng số kết quả C2 §3.2.
>    - Sweep dẹt U2 (512×16, sy=1): M4-bản-cục-bộ (roundHalfDown) tái hiện
>      đúng từng số C2 §4 (RMSE 0,021–0,063, maxAbs = 1); **production cuối
>      (geo-mean + float) cho RMSE = 0 / maxAbs = 0 ở cả 6 thang dẹt lẫn
>      6 thang vuông** — exact, tốt hơn cả M4-roundHalfDown của C2.
>    - Verdict w1920/w2560: **24/25 pass, y hệt C2/B2** (cùng 1 FAIL đã
>      biết: test-pattern noise10 w1920, Δkurt R 0,38 → 0,34).
>    - Verdict w1440: **8/8 verdict KHÔNG ĐỔI** so với Y2/A1; khớp số
>      ±0,011 là **17/20** (A1: 18/20) — 1 check khớp-số rớt thêm, xem §4.
> 4. **Hồi quy xanh, trừ 1 lỗi tsc KHÔNG phải của D6:** 67u2 **8/8**,
>    Z7 **6/6**, previewEngine **14 passed**, nestedPreview **46 passed**,
>    vite build **pass** (24,40 s). `tsc` web exit 2 với đúng 1 lỗi
>    `src/lib/aspectFit76D9.test.ts(42,8): 'AspectFit' declared but never
>    read` — file của luồng D9 đợt 76 (mtime 00:57 +07, trong lúc đợt 76
>    đang chạy); D6 không sửa file `src` nào nên không thể là lỗi của D6.
>    D6 không tự sửa file của luồng khác đang chạy — để D9/parent xử lý.
> 5. **Cơ chế Skia vẫn mở như C2 §5.3–§5.4** (model chọn bằng số đo headed,
>    không bằng đọc mã nguồn; Mitchell tách trục đã bị bác bằng số hai lần;
>    backend headed chưa xác định được). D6 không chạy lại probe Skia.

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
  **KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG file workflow.**
  Mọi số là đo thật trên VM này (Node v24.22.1; dữ liệu headed Chromium
  158 qua Xvfb của B2/U2/Z7, dùng lại — không chạy headed capture mới).
- Nợ đóng: đợt 75 §4 mục 6 (nối M4 vào production rồi đo lại verdict) —
  đóng bằng **kiểm chứng + đo lại độc lập**, sau khi xác minh trên đĩa là
  C2 đã merge rồi; đồng thời đính chính dòng ghi sai trong LIMITS gộp
  đợt 75 §4.6.
- Quy ước kurt: excess kurtosis, như pipeline verdict T3/X6 (ngưỡng
  KHỚP: std ratio [0,85, 1,18]; Δkurt ≤ 0,35; Δcorr ≤ 0,12).

## 1. Xác minh trên đĩa: M4 đã có trong production (trước khi sửa gì)

| Chỗ | Trên đĩa lúc D6 bắt đầu | Kết luận |
|---|---|---|
| `apps/web/scripts/chrome-resample.mjs:407` | `const lam = Math.log2(1 / Math.sqrt(sx * sy));` | geo-mean M4 đã có |
| `bilinearPlane2D` (cùng file, ~dòng 362–385) | float cả hai pass, không `roundHalfDown`; comment đầu hàm ghi "ĐỢT 75 C2" | bilinear float đã có |
| `resamplePlaneTrilinear` nhánh f=0 | `Math.round` tường minh từng ô (dòng ~415) | làm tròn một lần đã có |
| `halvePlane2D` | vẫn `roundHalfDown` (mip uint8, đã đo) | đúng spec C2 |
| `apps/web/scripts/r72z7-trilinear-2dblend.mjs:102` | `trilinear2DParams(Math.sqrt(sx * sy))`, `bilinear2D` float + làm tròn nhánh f=0 | module tham chiếu đã đổi cùng |
| `chrome-resample-67u2.test.mjs:124` | peak xung 2D s=0,63 pin **56** | pin C2 đã có |
| `apps/web/src/preview.tsx` | không có hàm resample/LOD nào (chỉ `drawImage` + `Math.min` layout) | không có gì để sửa ở đây |
| grep `Math.min(sx` / `min(sx, sy)` toàn `apps/web/scripts` | 0 kết quả ở đường production (chỉ comment trong script probe cũ + helper 1D) | không còn min-scale |

- C2 LIMITS §5.1 ghi "Production đã đổi (2 chỗ + test)" và §8.5 ghi
  "ĐÃ merge vào production" — khớp với đĩa. LIMITS gộp đợt 75 §4.6 ghi
  "(hiện chỉ đo, chưa sửa code)" là **mâu thuẫn nội bộ với chính LIMITS
  C2**; D6 lấy đĩa làm chuẩn (code là bằng chứng, LIMITS gộp là ghi chép
  sai). Parent/đợt sau lưu ý: khi giao nợ, đối chiếu LIMITS luồng gốc
  trước LIMITS gộp.
- Vì production đã đúng spec M4, D6 **không đổi code** — nhiệm vụ còn lại
  là đo lại độc lập để xác nhận (đúng yêu cầu mục 2–3 của task).

## 2. Đo lại: lưới 2D dị hướng đầy đủ (harness C2, production thẳng)

Script: `hidden_files/round76-d6/r76d6-verify-prod-full.mjs` (bản sao
`r75c2-verify-prod-full.mjs`, chỉ đổi tên output; import thẳng production
`resamplePlaneTrilinear`). Chạy 972 s, EXIT=0. Dữ liệu: lưới pha mịn
headed B2 (`round74-b2/r74b2-2d-grid-aniso.json`, 256 điểm/cặp) + đối
chứng iso (`r74b2-2d-grid-iso-control.json`).

| Cặp | D6 RMSE | D6 maxAbs | D6 ô ≥ 1 | C2 RMSE / maxAbs |
|---|---|---|---|---|
| 230×384 | 0 | 0 | 0 | 0 / 0 |
| 384×230 | 0 | 0 | 0 | 0 / 0 |
| 282×196 | 0 | 0 | 0 | 0 / 0 |
| 196×282 | 0 | 0 | 0 | 0 / 0 |
| 512×128 | 0 | 0 | 0 | 0 / 0 |
| 256×512 | 0 | 0 | 0 | 0 / 0 |
| **Tổng dẹt (259.584 ô)** | **0** | **0** | **0** | **0 / 0** |
| 230×230 (iso) | 0 | 0 | 0 | 0 / 0 |
| 384×384 (iso) | 0 | 0 | 0 | 0 / 0 |
| **Tổng cộng 346.112 ô** | **0** | **0** | **0** | **0 / 0** |

- Tái hiện đúng từng số C2 §3.2. Không có ô nào lệch dù chỉ 1 mức.
  (Lưu ý: script in `ô≥1`/`ô≥4` theo cửa sổ 13×13 quanh peak, 169 ô/điểm
  × 2.048 điểm = 346.112 ô — đúng tổng C2.)

## 3. Đo lại: sweep dẹt U2 (512×16, sy=1) — production cuối còn exact hơn M4-roundHalfDown

Script: `hidden_files/round76-d6/r76d6-verify-flat-sweep.mjs` (bản sao
`r75c2-verify-flat-sweep.mjs`; đã sửa 1 bug in log kế thừa từ C2: hai
dòng `console.log` in `.max` thay vì `.maxAbs` nên in ra `undefined` —
số trong JSON vẫn đúng; xem §6). Chạy 79 s, EXIT=0. Dữ liệu: probe 2
đợt 67 (`r67u2-filter2-A.json`), vạch dọc, hàng y=8 (dẹt) / y=floor(dw/2)
(vuông). Cột "NEW" của script này import thẳng production hiện tại
(nên ở C2 nó là min-scale cũ, còn ở D6 nó chính là production geo-mean
+ float — đọc bảng theo nghĩa đó).

| s | DẸT: M4-cục-bộ (RMSE / maxAbs) | DẸT: production cuối (RMSE / maxAbs) | VUÔNG: M4-cục-bộ | VUÔNG: production cuối |
|---|---|---|---|---|
| 0,30 | 0,051 / 1 (C2 y hệt) | **0 / 0** | 0 / 0 | 0 / 0 |
| 0,35 | 0,0442 / 1 (C2 y hệt) | **0 / 0** | 0,0472 / 1 | 0 / 0 |
| 0,3828 | 0,0268 / 1 (C2 y hệt) | **0 / 0** | 0,0505 / 1 | 0 / 0 |
| 0,40 | 0,0312 / 1 (C2 y hệt) | **0 / 0** | 0,0312 / 1 | 0 / 0 |
| 0,45 | 0,0208 / 1 (C2 y hệt) | **0 / 0** | 0,0361 / 1 | 0 / 0 |
| 0,50 | 0,0625 / 1 (C2 y hệt) | **0 / 0** | 0 / 0 | 0 / 0 |

- M4-cục-bộ (bản roundHalfDown trong script, như C2 §4) tái hiện đúng
  từng số C2 — harness không đổi, dữ liệu không đổi.
- Production cuối exact cả 12 thang (dẹt + vuông): dư ±1 của M4-cục-bộ
  đúng là chỉ do làm tròn trung gian (như C2 §3.2 đã kết luận), và bản
  float đã triệt tiêu hết — kể cả ở hình học dẹt sy=1, nơi s_geo khác
  hẳn s_min. Đây là số mới của D6 (C2 §4 chỉ đo M4-roundHalfDown ở đây).

## 4. Đo lại: verdict nhiễu w1920/w2560 và w1440

### 4.1 w1920/w2560 — 24/25, y hệt C2/B2

Script: `hidden_files/round76-d6/r76d6-verify-verdict-w1920-w2560.mjs`
(bản sao script C2, chỉ đổi tên output; import thẳng production). Chạy
229 s, kết quả **24/25 pass**.

| Nguồn / mức | D6 Δkurt R | C2-final Δkurt R | Verdict D6 | Ghi chú |
|---|---|---|---|---|
| w1920 test-pattern noise05 | 0,27 | 0,27 | KHỚP | y hệt C2 |
| w1920 test-pattern noise10 | 0,34 | 0,34 | KHỚP (FAIL check vs baseline Y2 cũ) | **FAIL duy nhất, đã biết** — lật thật so với baseline Y2 LỆCH, như B2/C2 đã ghi; KHÔNG phải hồi quy của D6 (D6 không đổi code) |
| w1920 ocean noise05/10 | 0,34 / 0,31 | 0,34 / 0,31 | KHỚP / KHỚP | y hệt |
| w1920 basgo noise05/10 | 0,14 / 0,12 | 0,14 / 0,12 | KHỚP / KHỚP | y hệt; plainAbsMad 1,213 = C2 |
| w1920 slovenska noise05/10 | 0,14 / 0,24 | 0,14 / 0,24 | KHỚP / KHỚP | y hệt; plainAbsMad 1,883 = C2 |
| w2560 test-pattern noise05 | 0,37 | 0,37 | LỆCH | y hệt C2 (vẫn LỆCH như Z9) |
| w2560 test-pattern noise10 | 0,43 | 0,43 | LỆCH | y hệt C2; plainAbsMad 1,029 = C2 |

- Mọi số Δkurt R / plainAbsMad khớp C2-final từng số (test-pattern w1920
  plainAbsMad 1,020; ocean 2,670). Không có verdict nào đổi so với C2.

### 4.2 w1440 — 8/8 verdict không đổi; khớp số 17/20 (A1: 18/20)

Script: `hidden_files/round76-d6/r76d6-verify-verdict-w1440.mjs` (bản
sao `r73a1-verify-verdict-prod.mjs`, chỉ đổi tên output). Chạy 74 s,
EXIT=1 do 3 check khớp-số (không phải do verdict đổi — xem dưới).

| Nguồn | noise05 Δkurt D6 (A1) | noise10 Δkurt D6 (A1) | Verdict D6 = A1 = Y2 |
|---|---|---|---|
| test-pattern | [0,26, 0,16, 0,26] ([0,27, 0,17, 0,27]) | [0,32, 0,04, 0,24] ([0,32, 0,04, 0,25]) | KHỚP / KHỚP |
| ocean | [0,44, 1,12, 0,08] (y hệt A1) | [0,37, **0,17**, 0,02] ([0,37, 0,16, 0,02]) | LỆCH / LỆCH |
| basgo | [0,16, 0,20, 0,12] (y hệt A1) | [0,12, 0,10, 0,11] (y hệt A1) | KHỚP / KHỚP |
| slovenska | [0,14, 0,05, 0,05] (y hệt A1) | [0,24, 0,05, 0,07] ([0,23, 0,06, 0,07]) | KHỚP / KHỚP |

- **8/8 verdict không đổi** (KHỚP vẫn KHỚP, LỆCH vẫn LỆCH). Ocean w1440
  Δkurt G 1,12 + Δcorr 0,233 vẫn LỆCH như cũ (nợ C1 đợt 75 đã đóng riêng
  ở preview-path; verdict ở đây tính bằng production resample nên không
  bị ảnh hưởng bởi sửa rò plain).
- Khớp số ±0,011 vs Y2: **17/20** (A1: 18/20). 3 check FAIL đều là
  khớp-số, không phải verdict đổi:
  - test-pattern noise05: Δkurt R 0,29 (Y2) → 0,26 (D6) — A1 đã FAIL
    check này (0,27), D6 dịch thêm 0,01 theo hướng xa Y2 hơn.
  - test-pattern noise10: Δkurt R 0,34 → 0,32 — A1 đã FAIL check này,
    D6 giữ nguyên 0,32.
  - ocean noise10: Δkurt G 0,15 (Y2) → **0,17** (D6) — **check rớt thêm
    so với A1** (A1: 0,16, trong ngưỡng ±0,011). Dịch +0,02, cùng độ lớn
    với dịch do bilinear float ở w1920 (C2 §6: ≤ 0,01–0,02). Verdict
    vẫn LỆCH như Y2/A1 — **không lật xấu**, chỉ là số tuyệt đối dịch
    khỏi ngưỡng khớp-số vốn đã quá chặt (C2 §7.7 đã cảnh báo ngưỡng này).
- plainAbsMad D6 vs A1 vs Y2: test-pattern 1,047 / 1,049 / 1,046;
  ocean 4,417 / 4,439 / 4,455; basgo 2,534 / 2,584 / 2,613 (dịch xa Y2
  thêm 0,05 so với A1 — cùng hướng dịch của float, verdict không đổi);
  slovenska 1,863 / 1,881 / 1,882.

## 5. Hồi quy

| Suite | Kết quả |
|---|---|
| `chrome-resample-67u2.test.mjs` (`node --test`) | **8/8 pass** (16,0 s) |
| `r72z7-trilinear-2dblend.test.mjs` (`node --test`) | **6/6 pass** (226,9 s; gồm 2 test dị hướng mới của C2: khớp lưới dẹt maxAbs ≤ 2 + bit-identical production vs module tham chiếu ở dẹt) |
| `previewEngine.test.ts` (`node --experimental-strip-types`) | **14 passed** |
| `nestedPreview.test.ts` (`node --experimental-strip-types`) | **46 passed** |
| `tsc` web (`npx tsc --noEmit`, apps/web) | **exit 2 — 1 lỗi, KHÔNG phải của D6**: `src/lib/aspectFit76D9.test.ts(42,8): error TS6133: 'AspectFit' is declared but its value is never read`. File của luồng D9 đợt 76 (mtime 2026-11-10 00:57 +07, trong lúc đợt 76 đang chạy); D6 không sửa file `src` nào. Để D9/parent xử lý, D6 không sửa file của luồng khác đang chạy. |
| vite build (`npx vite build`, apps/web) | **pass** (24,40 s; chỉ cảnh báo chunk > 500 kB có sẵn từ trước) |

- Không chạy lại headed capture; không chạy `chrome-resample` trên GPU
  thật / Safari thật (nợ kế thừa).

## 6. Ghi chú vận hành (để đợt sau khỏi lặp)

1. **Đối chiếu LIMITS luồng gốc trước LIMITS gộp khi giao nợ.** Nợ đợt 75
   §4.6 ("M4 ... hiện chỉ đo, chưa sửa code") mâu thuẫn trực tiếp với
   LIMITS C2 §5.1/§8.5 ("Production đã đổi", "ĐÃ merge vào production")
   và với code trên đĩa. D6 mất công xác minh mới biết không cần sửa
   code — may là xác minh trước khi sửa, nếu không đã sửa thừa.
2. **Bug in log kế thừa:** script verify flat-sweep của C2 in
   `report...M4.max` trong khi field là `maxAbs` → log in
   `maxAbs=undefined` (JSON vẫn đúng). D6 đã sửa 2 dòng log trong bản sao
   của mình (`hidden_files/round76-d6/`); bản gốc C2 giữ nguyên.
3. **Cột "NEW" trong script flat-sweep là production hiện tại**, không
   còn là min-scale cũ sau khi C2 merge — đọc kết quả phải theo nghĩa
   này (D6 §3). Đợt sau nếu dùng lại script thì đổi tên cột thành
   "PROD" cho khỏi nhầm.
4. **Ngưỡng khớp số ±0,011 quá chặt** (C2 §7.7): D6 rớt thêm 1 check
   khớp-số ở w1440 (ocean noise10 Δkurt G) dù verdict không đổi và dịch
   chỉ 0,02. Đợt sau nên so verdict thay vì so số tuyệt đối, hoặc hiệu
   chuẩn lại ngưỡng theo cửa sổ.

## 7. Giới hạn còn lại / nợ mở

1. **Cơ chế Skia chính xác vẫn mở** (C2 §5.3–§5.4): model geo-mean trilinear
   đã exact 346.112 ô + sweep dẹt exact, Mitchell tách trục đã bị bác
   bằng số hai lần, nhưng vì sao LOD là geo-mean thay vì min-scale như
   `SkMipmap::ComputeLevel` nói thì chưa rõ (backend headed chưa xác
   định: Graphite/SwiftShader hay software raster). Hướng kiểm chứng:
   chạy lại phép đo với `--disable-skia-graphite`.
2. **GPU thật / Safari thật vẫn chưa đo** (mọi kết luận chỉ đúng trên
   CPU/SwiftShader + Chromium 158).
3. **`trilinearRow1D` (helper 1D thuần) giữ rounding cũ** — chỉ dùng trong
   script phân tích cũ (r71y2/r72z9); pipeline 2D đã exact. Nếu đợt sau
   dùng helper 1D cho việc mới thì kiểm tra lại rounding của nó.
4. **Ocean w1440 (Δkurt G 1,12 + Δcorr 0,233)** vẫn LỆCH ở verdict
   resample-path (C1 đợt 75 đã sửa rò plain ở preview-path; hai đường
   khác nhau — xem LIMITS C1).
5. **tsc đang đỏ 1 lỗi do file D9** (`aspectFit76D9.test.ts:42`) — cần
   D9 sửa import thừa trước khi đợt 76 coi tsc là xanh.
6. `.github/workflows/ci-security.yml` + `ci-build.yml` vẫn chưa lên
   GitHub (403 quyền, chờ user) — nợ chung.
7. Ngưỡng khớp số ±0,011 (xem §6.4) — nên hiệu chuẩn lại.

## 8. Đã làm / không làm

1. **ĐÃ** xác minh trên đĩa M4 đã merge vào production (geo-mean +
   bilinear float + làm tròn một lần) ở cả production lẫn module tham
   chiếu, và xác minh không còn min-scale ở đường 2D — **không sửa code
   production** vì đã đúng spec.
2. **ĐÃ** đo lại độc lập toàn bộ: lưới 2D đầy đủ 346.112 ô (exact),
   sweep dẹt U2 (production exact cả 12 thang), verdict w1920/w2560
   (24/25 y hệt C2), verdict w1440 (8/8 verdict không đổi; khớp số
   17/20, rớt thêm 1 check so với A1 — báo rõ, không giấu).
3. **ĐÃ** chạy lại hồi quy: 67u2 8/8, Z7 6/6, previewEngine 14,
   nestedPreview 46, vite build pass; tsc exit 2 do 1 lỗi của luồng D9
   (báo rõ, không sửa file luồng khác).
4. **ĐÃ** sửa bug in log `maxAbs=undefined` trong bản sao script
   flat-sweep của mình (2 dòng `console.log`).
5. **KHÔNG** sửa `preview.tsx` (không có hàm resample; tránh xung đột
   D2/D4); **KHÔNG** sửa code sản phẩm web nào; **KHÔNG** chạy lại
   headed capture; **KHÔNG** push/tag/binary/workflow.

## 9. Files

- LIMITS này: `docs/PHASE9_ROUND76_D6_RESAMPLE_M4_PROD_LIMITS.md`
- Code sửa: **không có** (production đã đúng spec M4 từ C2 — xem §1).
- Test: không đổi test nào (mọi suite chạy lại trên code hiện tại).
- Log luồng:
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round76-d6.md`
- Verify nội bộ (KHÔNG stage — goal hidden_files):
  `hidden_files/round76-d6/` — `r76d6-verify-prod-full.mjs` (+`.log/.json`),
  `r76d6-verify-flat-sweep.mjs` (+`.log/.json`),
  `r76d6-verify-verdict-w1920-w2560.mjs` (+`.log/.json`),
  `r76d6-verify-verdict-w1440.mjs` (+`.log/.json`).
- Batch stage (KHÔNG push):
  `~/workspace/repo-1-push/paths-loop/phase9-round76-d6-resample-m4-prod.txt`
  — 1 entry (chỉ LIMITS này; không có file code/test đổi).
