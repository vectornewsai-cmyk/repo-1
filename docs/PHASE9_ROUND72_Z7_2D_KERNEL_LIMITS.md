# Phase 9 đợt 72, luồng Z7 — Kernel 2D thật của Chrome: ĐÃ ĐÓNG (blend-at-end, không phải cone)

> **Kết luận chốt (đọc trước):**
> 1. **Kernel 2D thật của Chrome KHÔNG phải cone/Gauss xuyên tâm, cũng
>    không phải triangle tách trục như production đang dùng. Nó là
>    trilinear mipmap trộn 2D: `K(u,v) = (1−f)·T_L(u)T_L(v) +
>    f·T_{L+1}(u)T_{L+1}(v)`** — mỗi mức mip được bilinear-sample 2D
>    trước, rồi mới trộn 2 kết quả 2D với nhau (đúng cách Skia lấy mẫu
>    trilinear). Số đo: mô hình này khớp dữ liệu đo headed tới
>    **maxAbs = 1 mọi thang** (mức làm tròn uint8) trên 259.584 ô lưới
>    pha mịn + 50 ô Y8 độc lập (10 thang, gồm thang viewport w1440
>    s=0,3828 và thang L=1).
> 2. **Production sai ở CÁCH TRỘN, không sai hệ số:** `resamplePlaneTrilinear`
>    trộn 2 mức mip ngay trong từng pass 1D (X rồi Y), khai triển thành 4
>    số hạng, trong đó 2 số hạng chéo `f(1−f)·[T_L(u)T_{L+1}(v) +
>    T_{L+1}(u)T_L(v)]` (halve 1 trục) không tồn tại trong pipeline thật.
>    Lệch đo được: maxAbs tới **19**, RMSE 0,47–0,65, 112–160/256 điểm
>    pha có maxAbs ≥ 4 ở s=0,45–0,63. Hệ số blend f (bias LOD −0,5) thì
>    ĐÚNG: fit Δf ≈ 0 (±0,0008). 1D không hề sai (MAD ≤ 0,005, Y8) vì
>    hạng chéo vô hình trên ảnh 1D — đó là lý do nó trốn được tới đợt 72.
> 3. **Dự đoán verdict KHỚP của Y8 (§3.4) ĐÃ XÁC NHẬN trên dữ liệu headed
>    thật:** tính lại độc lập từ snapshot full-pixel của Y2 cho
>    test-pattern w1440 noise05 Δkurt R **0,29 KHỚP**, noise10 **0,34
>    KHỚP** (20/20 check pass). Lưu ý trung thực: Δkurt đo hơi cao hơn
>    dải Y8 dự đoán (0,08–0,23 cho noise05) nhưng verdict đúng.
> 4. **Mô hình nhiễu Y8 khái quát được lên nội dung tự nhiên ở mức
>    verdict: 22/24 đúng (mỗi seed 1 lần); 7/8 ô theo đa số.** 2 lần sai
>    đều là ô ocean-noise10 sát nút (sim 0,29–0,37 quanh ngưỡng 0,35,
>    đo 0,37 LỆCH). Ocean-noise05 sim đoán LỆCH đúng nhưng SAI KÊNH:
>    Δkurt R sim 0,36–0,43 khớp đo 0,44, nhưng Δkurt G sim 0,04–0,08
>    (đo 1,12) và Δcorr sim ~0,005 (đo 0,233) — phần đó do bước scale
>    video-path 1920→1280 mà mô hình không mô phỏng (đúng giả thuyết
>    Y2 §4.3).
> 5. **Bản sửa đã giao kèm (KHÔNG merge vào chrome-resample.mjs trong
>    luồng này):** module mới `apps/web/scripts/r72z7-trilinear-2dblend.mjs`
>    (`resampleRgb24Trilinear2D`) + test 4/4 xanh. Tính lại verdict w1440
>    bằng module mới: **8/8 verdicts không đổi**, Δkurt dịch ≤ 0,02 —
>    nên việc merge là an toàn cho các verdict đã công bố.

- Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
  **KHÔNG push, KHÔNG release/tag. Không sửa file production hay file
  của luồng khác trong đợt này** (xem §8 vì sao bản sửa để riêng).
  Mọi số là đo thật trên VM này (Node v24.22.1, Chromium 158 headed qua
  Xvfb, --disable-gpu, SwiftShader; loadavg 10–14 lúc probe do các
  luồng đợt 72 chạy song song — snapshot xác định, determinism
  byte-identical).
- Nợ đóng: đợt 71 §5 mục 8 (kernel 2D thật chưa biết dạng; capture
  full-pixel headed w1440 xác nhận dự đoán verdict KHỚP; kiểm mô hình
  nhiễu trên nội dung tự nhiên).
- Quy ước kurt: excess kurtosis, như pipeline verdict T3/X6 (ngưỡng
  KHỚP: std ratio [0,85, 1,18]; Δkurt ≤ 0,35; Δcorr ≤ 0,12).

## 1. Probe 2D lưới pha mịn — lệch production còn, và rộng hơn Y8 thấy

Script probe: `apps/web/scripts/r72z7-2d-grid.mjs` (headed, mẫu Y7:
Xvfb display :160, debug :9580, `--disable-gpu`). Mỗi thang: lưới
16×16 điểm (px,py ∈ 248..263) = 256 pha, xung điểm 1px trắng trên
canvas 512×512, `drawImage` smoothing "high", ghi cửa sổ 13×13 quanh
peak đo (scan 21×21 quanh peak kỳ vọng). 6 thang: dw 256 (s=0,5, đối
chứng sạch), 230 (0,4492), 282 (0,5508), 307 (0,5996), 323 (0,6309),
384 (0,75). Lặp dw=282 cuối phiên: **byte-identical**. Log:
`hidden_files/round72-z7/r72z7-2d-grid.log`, JSON `r72z7-2d-grid-A.json`
(1536 điểm). Phân tích: `r72z7-2d-fit.mjs` (+`.log`, `.json`).

### 1.1 Production blend-từng-pass vs đo (cửa sổ 13×13)

| s (thực) | RMSE | maxAbs | điểm có maxAbs ≥ 4 | điểm tệ nhất |
|---|---|---|---|---|
| 0,4492 | 0,57 | **19** @ (250,250): đo 98 vs prod 79 | 160/256 | (250,250) |
| 0,5000 | 0,00 | **0** (mọi điểm khớp tuyệt đối) | 0/256 | — |
| 0,5508 | 0,65 | **19** @ (251,251): đo 164 vs prod 145 | 140/256 | (251,251) |
| 0,5996 | 0,47 | **11** @ (254,254): đo 141 vs prod 130 | 124/256 | (254,254) |
| 0,6309 | 0,47 | **11** @ (254,254): đo 183 vs prod 172 | 112/256 | (254,254) |
| 0,7500 | 0,05 | **1** | 0/256 | — |

- Ô Y8 tái lập đúng từng số: (260,250) s=0,4492 maxAbs=13, peak đo 21,
  sum21 đo 32 vs prod 46; s=0,5508 maxAbs=11. Lưới mịn tìm thêm điểm
  tệ hơn Y8 (19 thay vì 13) vì Y8 chỉ có 5 điểm.
- Lệch lớn nhất ở **peak** (a=b=0) và khi xung **căn pha** (δ≈0):
  corr(maxAbs, |δx|+|δy|) = −0,35..−0,77. Peak đo dịch ±1px khỏi vị
  trí kỳ vọng ở 60/256 điểm (s=0,45/0,60), 28/256 (s=0,55), 0 điểm ở
  s=0,5/0,63/0,75.
- Tổng khối lượng bảo toàn: sum21 đo [32,109] vs prod [21,96]
  (s=0,4492); [113,177] vs [112,178] (s=0,75) — lệch là PHÂN BỐ LẠI,
  không phải mất khối lượng. Dao động mạnh của sum21 theo pha (32–109)
  cũng có trong production ([21,96]) — là đặc tính của kernel hẹp, không
  phải anomaly.
- Phương pháp nhanh (tính production 2D từ `trilinearRow1D` theo hàng +
  cột) đã kiểm chứng == `resampleRgb24Trilinear` đầy đủ trên
  **2.175.976/2.175.976 pixel giống hệt, maxDiff = 0**.

### 1.2 Kernel đo KHÔNG tách được — nhưng các dạng xuyên tâm cũng sai

- **Rank-1 ALS** trên kernel đã gộp (lưới 0,2px): kernel đo residual
  RMSE **0,15–0,31**, gấp 10–20× production control (0,015–0,021) —
  không tách được, định lượng được.
- Fit các dạng xuyên tâm lên kernel đã gộp: cone RMSE 0,70–1,43,
  Gauss 0,50–1,08, blend 2 cone 0,18–0,70 — **không tốt hơn fit lên
  chính production** (cone 0,29–0,77) — tức các dạng xuyên tâm không
  phân biệt được đo vs production, không phải đáp án.
- Phần dư trung bình theo pha R̄: dạng bàn cờ (+ tâm 1,8–2,1; − trục
  1,3–1,4; + chéo 1,1–1,2), rank-1 gần tuyệt đối (RMSE 0,008–0,028,
  ~98% phương sai) — nhưng biên độ chỉ ±2, nhỏ hơn nhiều so với lệch
  từng điểm (±19). Fit cone/Gauss lên R̄: RMSE 0,23–0,37 so với null
  0,31–0,50 (chỉ tốt hơn ~25%).
- Phần dư phụ thuộc **pha tuyệt đối**, không phải hàm cố định của
  (u,v): within-bin SD 0,33–0,45 (max 3,3–6,2), KHÔNG sụp khi loại
  60 điểm peak dịch. R00 theo pha tách được: R00(δx,δy) ≈ g(δx)·g(δy),
  g chẵn, +19 ở δ≈0, −13 ở |δ|≈0,5, qua 0 ở |δ|≈0,25–0,3;
  corr(R00, peak) = 0,63–0,83.
- **Parity chẵn/lẻ (px%2, py%2) KHÔNG ảnh hưởng:** mean R00 giống hệt
  nhau ở cả 4 lớp (vd s=0,4492: 0,22/0,22/0,22/0,22) — lưới halve cố
  định không phải cơ chế.
- Marginal của R̄ ≈ 0 (tổng hàng/cột sau hiệu chỉnh bề rộng bin:
  0,2–0,5 mức, ~0,1–0,5% khối lượng hàng) — phù hợp với 1D khớp tới
  MAD 0,005 (Y8).

## 2. Đáp án: blend-at-end — production trộn sai chỗ

Khai triển đại số (bỏ qua làm tròn, tuyến tính từng chặng):

- Production (`resamplePlaneTrilinear`: trộn trong từng pass 1D):
  `out = (1−f)²·T0T0 + f(1−f)·T0T1 + f(1−f)·T1T0 + f²·T1T1`
  với T0/T1 là triangle 1D của mip L / L+1. Hai số hạng giữa là
  "halve 1 trục" — ảnh không tồn tại trong pipeline thật.
- Chrome thật (Skia trilinear: bilinear-sample 2D từng mức mip rồi
  mới lerp 2 kết quả):
  `out = (1−f)·T0T0 + f·T1T1` — tức `K(u,v) = (1−f)·T_L(u)T_L(v) +
  f·T_{L+1}(u)T_{L+1}(v)`.

Giải thích mọi quan sát cũ bằng một cơ chế duy nhất:
- 1D khớp tuyệt đối: với ảnh 1D (vạch dọc/ngang) pass Y là đồng nhất
  (ảnh hằng theo y) nên 4 số hạng sụp về 2 — hạng chéo vô hình trên 1D.
- Sạch ở s=0,5: hai thành phần trùng nhau (T0=T1) nên 4 số hạng ≡ 2.
- Sạch ở s≥0,7071 (f=0): chỉ còn T0T0.
- Lệch lớn nhất khi f(1−f) lớn và xung căn pha (peak sắc nhất).
- (B−A) ở 1D lớn (MAD 0,09–0,50, max tới 106) nên Δf không thể ≠ 0
  mà 1D vẫn khớp — phù hợp với fit Δf ≈ 0.

## 3. Kiểm chứng blend-at-end (fit5 + fit6)

Script: `r72z7-2d-fit5.mjs` (fit Δf), `r72z7-2d-fit6.mjs` (chốt).

| Tập kiểm | Blend-at-end | Production blend-từng-pass |
|---|---|---|
| Lưới mịn 72 (259.584 ô, 6 thang) | RMSE 0,054–0,066, **maxAbs = 1**, 0 ô ≥ 4 | RMSE 0,47–0,65, maxAbs 11–19, 168–240 ô ≥ 4/thang |
| 50 ô Y8 độc lập (10 thang, gồm s=0,3828 viewport w1440; s=0,3008/0,3496 L=1) | RMSE 0,09–0,22/thang, **maxAbs = 1** (tổng RMSE 0,15) | RMSE 1,04 tổng, maxAbs 13 |
| Fit Δf (giả thuyết bias LOD sai) | Δf = −0,0006..+0,0008 ≈ 0; RMSE không đổi (0,065→0,064) | — |

maxAbs = 1 là mức làm tròn uint8 — mô hình **khớp đúng tới làm tròn**.
Thang L=1 (s=0,3008/0,3496) cũng khớp (maxAbs 1) nên công thức đúng
cả khi mip sâu hơn 1 mức.

## 4. Xác nhận dự đoán verdict KHỚP (verify độc lập từ snapshot Y2)

Script: `hidden_files/round72-z7/r72z7-verify-y2-snaps.mjs` — tính lại
độc lập (không import code phân tích Y2) từ snapshot full-pixel headed
w1440 đã lưu (`r71y2-snaps-w1440.json`) + frame render: **20/20 pass**.
plainAbsMad tính lại trùng Y2 tới 0,001 (1,046/4,455/2,613/1,882);
verdict 8/8 ô khớp Y2 từng số (±0,011):

| Nguồn | noise05 | noise10 |
|---|---|---|
| test-pattern | KHỚP Δkurt [0,29, 0,16, 0,28] | KHỚP Δkurt [0,34, 0,04, 0,26] |
| ocean | LỆCH Δkurt [0,44, **1,12**, 0,08], Δcorr [0,233, ...] | LỆCH Δkurt [0,37, 0,15, 0,02] |
| basgo / slovenska | KHỚP | KHỚP |

→ Dự đoán Y8 §3.4 "verdict w1440 lật KHỚP khi capture full-pixel"
**đã xác nhận trên dữ liệu headed thật** (test-pattern cả 2 mức).
Đính chính độ lớn: Δkurt R đo 0,29/0,34 hơi cao hơn dải Y8 dự đoán
(0,08–0,23 / 0,22–0,31) — verdict đúng, biên độ mô hình hơi thiếu.
Không chạy lại phiên headed capture: snapshot Y2 đã pixel-identical
khi chạy lại (D1/D2 16/16 cặp, repeat ocean 5/5), chạy lại không thêm
thông tin mới.

## 5. Mô hình nhiễu Y8 trên nội dung tự nhiên

Script: `apps/web/scripts/r72z7-noise-nat.mjs` (3 seed × 2 mức × 4 nguồn,
forward simulation Y8 + delta0 từng nguồn, đối chiếu verdict đo Y2
w1440). Kết quả: **22/24 lần dự đoán đúng** (mỗi seed 1 lần); theo đa
số seed: 7/8 ô đúng.

| Nguồn | noise05 (sim Δkurt R, 3 seed) | noise10 (sim Δkurt R) | Verdict sim vs đo |
|---|---|---|---|
| test-pattern | 0,08–0,23 (đo 0,29) | 0,23–0,31 (đo 0,34) | KHỚP 6/6 |
| ocean | 0,36–0,43 (đo 0,44) | 0,29–0,37 (đo 0,37) | n05 LỆCH 3/3; n10 1/3 (2 seed KHỚP — ô sát nút) |
| basgo | 0,15–0,21 (đo 0,16) | 0,14–0,15 (đo 0,12) | KHỚP 6/6 |
| slovenska | 0,15–0,26 (đo 0,14) | 0,24–0,33 (đo 0,24) | KHỚP 6/6 |

- Mô hình hơi thiếu Δkurt R một cách hệ thống (~0,05–0,1) trên mọi
  nguồn — cùng hướng với đính chính §4 (dải dự đoán Y8 thấp hơn đo).
- **Ocean-noise05: verdict đúng, cơ chế chỉ đúng một nửa.** Sim tái
  tạo đúng Δkurt R (0,36–0,43 vs đo 0,44) — phần phình kurt do
  est-chroma/clamp — nhưng Δkurt G sim 0,04–0,08 (đo **1,12**) và
  Δcorr R-G sim ~0,005 (đo **0,233**) hoàn toàn không tái tạo được.
  Phần thiếu này là hiệu ứng của bước scale video-path 1920→1280
  (plain absMAD 4,46) mà mô hình không mô phỏng — **xác nhận giả
  thuyết Y2 §4.3 bằng cách mô hình thất bại đúng chỗ đó**.
- Sim Δcorr nhỏ hơn đo một cách hệ thống trên nội dung tự nhiên
  (sim ~0,005 vs đo 0,03–0,09 ở basgo/slovenska) — phần dư corr đến
  từ lệch khung plain render-vs-preview, ngoài phạm vi mô hình.
- Không hiệu chỉnh delta0: test-pattern noise05 sim LỆCH 3/3 — hiệu
  chỉnh delta0 là cần thiết cho mô hình khớp (như Y8 đã kết luận).

## 6. Ảnh hưởng của bản sửa lên verdict đã công bố

Tính lại toàn bộ verdict w1440 (§4) bằng module blend-at-end mới
(`r72z7-verify-2dblend.mjs`, cùng dữ liệu): **8/8 verdicts không đổi**;
Δkurt dịch ≤ 0,02 (test-pattern 0,29→0,27 và 0,34→0,32 — lại gần hơn
với dải dự đoán Y8); plainAbsMad dịch ≤ 0,03. Merge module mới là an
toàn cho các verdict đã công bố. (Chỉ kiểm ở w1440; w1920/w2560 xem §9.)

## 7. Kiểm chứng độc lập

| Kiểm tra | Kết quả |
|---|---|
| Probe headed 6 thang × 256 điểm | xong, determinism dw=282 **byte-identical**, edgePeak 0/256 mọi thang |
| fast-prod == `resampleRgb24Trilinear` đầy đủ | **2.175.976/2.175.976** pixel giống hệt, maxDiff 0 |
| Blend-at-end trên lưới mịn + 50 ô Y8 | **maxAbs = 1** cả 2 tập (0 ô ≥ 4) |
| Test mới `r72z7-trilinear-2dblend.test.mjs` (`node --test`) | **4/4 pass** (lưới mịn mẫu, 50 ô Y8, pin peak cũ 79→mới 98, 1D exact) |
| `chrome-resample-67u2.test.mjs` (`node --test`) | **8/8 pass** (không đụng file này) |
| Verify verdict Y2 từ snapshot (độc lập) | **20/20 pass** |
| Mô hình nhiễu trên tự nhiên | 22/24 lần dự đoán verdict đúng |
| Verdict w1440 bằng module mới | 8/8 không đổi |

## 8. Đã làm / không làm

1. **ĐÃ** probe lưới pha mịn headed (1536 điểm) + phân tích 4 vòng
   (fit, fit2 phần dư, fit3 pha/parity, fit4 tập sạch, fit5 Δf, fit6
   chốt) — tìm ra dạng kernel thật là blend-at-end.
2. **ĐÃ** kiểm chứng độc lập verdict full-pixel w1440 từ snapshot Y2
   (không chạy lại headed) + chạy mô hình nhiễu Y8 trên 3 nguồn tự
   nhiên (3 seed × 2 mức).
3. **ĐÃ** giao bản sửa drop-in + test: `r72z7-trilinear-2dblend.mjs`
   (`resampleRgb24Trilinear2D`, `resamplePlaneTrilinear2D`) và
   `r72z7-trilinear-2dblend.test.mjs` (4/4 xanh).
4. **KHÔNG** sửa `chrome-resample.mjs` (file production/harness chung):
   các luồng Z khác đang chạy song song và dùng file này; sửa giữa đợt
   có thể làm lệch số đo của họ và gây xung đột merge. Bản sửa đã kiểm
   chứng xong, để parent quyết merge (đổi `chromeResampleRgb24` sang
   dùng `resampleRgb24Trilinear2D` + chạy lại suite liên quan).
   Theo đúng luật task: số đo đã chứng minh production sai, chỗ sai đã
   xác định đúng (trộn trong từng pass 1D), test đi kèm xanh — chỉ còn
   bước merge do parent quyết.
5. **KHÔNG** sửa code sản phẩm nào khác. **KHÔNG** push/tag/binary.
   **KHÔNG** chạy headed capture mới (dữ liệu Y2 đã đủ, §4).

## 9. Nợ mở / hướng tiếp theo

1. **Merge bản sửa trilinear blend-at-end vào production** (parent
   quyết): đổi `chromeResampleRgb24`/`resamplePlaneTrilinear` sang
   blend-at-end, chạy lại `chrome-resample-67u2.test.mjs` + các suite
   dùng resample (keyframe suites, css60/61) + tính lại verdict
   w1920/w2560 bằng mô hình mới (w1440 đã xong, 8/8 không đổi).
2. **Thang khác nhau 2 trục (hình học dẹt):** module mới dùng λ* =
   max(λx*, λy*) — CHƯA đo. Cần probe dẹt (vd 512×16 như T3) trước khi
   dùng cho hình học dẹt; mọi số trong file này chỉ đúng khi sx = sy.
3. **Mô hình nhiễu còn thiếu ~0,05–0,1 Δkurt R** một cách hệ thống
   (sim thấp hơn đo trên cả 4 nguồn) — cần tìm phần thiếu (nghi ngờ:
   làm tròn uint8 chặng giữa của pipeline preview thật, hoặc seed
   nhiễu thật khác seed mô phỏng).
4. **Ocean w1440 (Δkurt G 1,12 + Δcorr 0,233):** vẫn chưa giải thích
   xong — cần khớp bước scale video-path 1920→1280 bằng bộ lọc thật
   (probe §2 của Y2: thang 0,667 1-kernel fit tốt nhất) rồi đo lại;
   mô hình Y8 không bao được phần này (đã chứng minh ở §5).
5. **GPU thật / Safari thật vẫn chưa đo** (nợ kế thừa; mọi kết luận
   chỉ đúng trên CPU/SwiftShader + Chromium 158).
6. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền,
   chờ user) — nợ chung.

## 10. Files

- LIMITS này: `docs/PHASE9_ROUND72_Z7_2D_KERNEL_LIMITS.md`
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round72-z7.md`
- Probe + sửa + test (stage, KHÔNG push):
  `apps/web/scripts/r72z7-2d-grid.mjs`,
  `apps/web/scripts/r72z7-noise-nat.mjs`,
  `apps/web/scripts/r72z7-trilinear-2dblend.mjs`,
  `apps/web/scripts/r72z7-trilinear-2dblend.test.mjs`
- Probe/phân tích nội bộ (KHÔNG stage — goal hidden_files):
  `hidden_files/round72-z7/` — `r72z7-2d-grid-A.json` (+`.log`,
  `r72z7-chrome-A-chrome.log`, `chrome-userdata-z7/`),
  `r72z7-2d-fit{,2,3,4,5,6}.mjs` (+`.log`, `.json`),
  `r72z7-verify-y2-snaps.mjs` (+`.log`, `.json`),
  `r72z7-verify-2dblend.mjs` (+`.log`, `.json`),
  `r72z7-noise-nat.json` (+`.log`).
- Batch stage (KHÔNG push):
  `~/workspace/repo-1-push/paths-loop/phase9-round72-z7-2d-kernel.txt`
  — 5 entry (LIMITS này + 4 script/test trên).
