# Phase 9 đợt 79 — G6: sweep G1/G2 (20 case mới) + recheck harness-hiện-tại

Ngày đo: 10/11/2026. Luồng G6, repo local `~/workspace/repo-1`.
Chỉ sửa harness đo (`apps/web/scripts/r79g6-*.mjs`,
`test_round79_g6_g1g2.mjs`); `delta0-harness.mjs` KHÔNG đổi, không sửa
production (luật delta0 không nằm trong production — xem E6 D4).
KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận trước

**G1 vs G2 VẪN CHƯA phân biệt được ở mức verdict — sau 73 case tính
bằng cùng một harness hiện tại.**

- 20 case mới: G1/G2 bất đồng cổng trên **16/20** (tất cả đều góc Q3:
  G1 áp d0, G2 từ chối), nhưng **0 case phân biệt được ở mức verdict**
  (cả 16 case đều KHỚP dưới cả hai cổng).
- Case mới duy nhất làm sai luật: `G6-sweep-w2048-testpattern-n10` —
  **cả 4 luật cùng sai** (R0, G1, G2, G12): cả hai cổng cùng áp d0 sai
  (noD0 Δkurt R 0,34 KHỚP → fullD0 0,36 LỆCH). Đây là lỗi của bản thân
  d0, không phân biệt được G1/G2.
- **ĐÍNH CHÍNH LỚN — case phân biệt duy nhất của F7 KHÔNG còn đứng:**
  `F7-sweep-w2880-testpattern-n05` (G2 đúng, G1 sai) được tính bằng
  resample tam giác cũ. Đợt 78 luồng F6 nối kernel BC(0,25, 0,375) làm
  nhánh upscale của `resamplePlaneTrilinear` lúc 01:09 UTC 10/11 —
  **4 phút sau khi F7 tính xong eval (01:05 UTC)**. Tính lại đúng
  snapshot F7 bằng harness hiện tại: w2880-n05 noD0 Δkurt R **0,12**
  KHỚP, fullD0 **0,14** KHỚP (trước: 0,34 KHỚP / 0,36 LỆCH) — cả hai
  cổng đều KHỚP, không còn phân biệt được. Xem §3.
- Điểm gộp **harness-hiện-tại** (73 case, toàn bộ tính lại — §5):
  R0 **60/67**, G1 **66/67**, G2 **66/67**, G12 **66/67**; bất đồng
  cổng 24/73; phân biệt được ở mức verdict: **0**. Điểm gộp cũ tiền-BC
  (F7: G2 44/44; E6: G12 23/23) không dùng nữa — chỉ còn giá trị lịch sử.
- G12 vẫn là lựa chọn an toàn (bằng G2, hơn R0 6 case, hơn G1 0 case
  trên tập này — nhưng G1 sai đúng 1 case mà G2 cũng sai, nên chưa có
  bằng chứng G1 đóng góp gì thêm ngoài G2; ngược lại cũng chưa có bằng
  chứng G2 hơn G1 — xem §6.1).

## 1. Thiết kế sweep: 20 case mới

Săn bất đồng G1/G2 ở góc Q3 (d0std_R ≤ 2 nhưng ratio_R > 1) và kiểm
tra vùng phân biệt quanh w2880-n05 (nợ F7 §6.1). Ba trục thay đổi:
độ phân giải (cửa sổ mới), nội dung (test-pattern + basgo), thang đo
(mức noise n07/n08 mới).

| Nhóm | Cửa sổ mới (rect) | Mức noise | Số case |
|---|---|---|---|
| test-pattern | w2048x1152 (937x527) | n05/n07/n08/n10 | 4 |
| test-pattern | w2400x1350 (1289x725) | n05/n07/n08/n10 | 4 |
| test-pattern | w2720x1530 (1609x905) | n05/n07/n08/n10 | 4 |
| test-pattern | w2880x1620 (1769x995) | n07/n08 (n05/n10 đã có F7) | 2 |
| basgo | w2240x1260 (1129x635) | n05/n10 | 2 |
| basgo | w2560x1440 (1449x815) | n05/n10 | 2 |
| basgo | w2880x1620 (1769x995) | n05/n10 | 2 |

**Render frame noise07/noise08 mới** (test-pattern): `ffmpeg
noise=alls=37/41:allf=t` trên `fullyuv-plain.raw` (alls = round(5 +
t·45): t=0,7 → 37, t=0,8 → 41; khớp mapping preview
`strength = 5 + t*45` trong `effectCanvas.ts`), rồi convert yuv420p →
rgb24 với cờ màu bt709. Kiểm chứng chuỗi: convert plain tái lập
`fullrgb-plain.raw` **byte-identical**; build lại noise05 cùng chuỗi
cho std/kurt khớp frame gốc (std R 118,99 vs 118,94; kurt −1,93 =
−1,93). Frame noise07/noise08 nằm đơn điệu giữa noise05 và noise10
(std R 116,02 / 114,79; kurt −1,89 / −1,87). Frame `.raw` là binary,
chỉ lưu ở `hidden_files/round79-g6/render/`, KHÔNG stage — cách build
ghi ở đây để tái lập.

Capture headed mới (`r79g6-headed-capture.mjs`, copy từ r78f7 + thêm
variant noise07/noise08 intensity 0,7/0,8): 7 phiên, D1 plain-identical
+ D3 cùng-khung + H9 0 lỗi trang đều pass ở phiên thành công; 5 lần
flake do tải VM phải chạy lại (xem §7). Raw hash ổn định: test-pattern
f30 `ad4be1d3`, basgo f30 `4290ca0b` (khớp F7).

## 2. Kết quả 20 case mới

JSON `hidden_files/round79-g6/r79g6-sweep.json`. Ngưỡng verdict như
mọi đợt: std ratio [0,85, 1,18], |Δkurt| ≤ 0,35, |Δcorr| ≤ 0,12.

### 2.1 test-pattern — cửa sổ mới

| case | plainMad | d0std_R | residStd_R | ratio_R | cổng G1/G2 | noD0 Δkurt R | fullD0 Δkurt R | đúng |
|---|---|---|---|---|---|---|---|---|
| w2048 n05 | 0,988 | 1,14 | 1,32 | 0,86 | áp / áp | 0,27 KHỚP | 0,30 KHỚP | KHÔNG-d0 |
| w2048 n07 | 0,988 | 1,14 | 1,32 | 0,86 | áp / áp | 0,28 KHỚP | 0,30 KHỚP | KHÔNG-d0 |
| w2048 n08 | 0,988 | 1,14 | 1,32 | 0,86 | áp / áp | 0,27 KHỚP | 0,29 KHỚP | KHÔNG-d0 |
| **w2048 n10** | 0,988 | 1,14 | 1,32 | 0,86 | áp / áp | **0,34 KHỚP** | **0,36 LỆCH** | KHÔNG-d0 — **cả 4 luật sai** |
| w2400 n05 | 1,021 | 1,17 | 1,09 | 1,07 | áp / từ chối | 0,11 KHỚP | 0,14 KHỚP | KHÔNG-d0 |
| w2400 n07 | 1,021 | 1,17 | 1,09 | 1,07 | áp / từ chối | 0,15 KHỚP | 0,18 KHỚP | KHÔNG-d0 |
| w2400 n08 | 1,021 | 1,17 | 1,09 | 1,07 | áp / từ chối | 0,14 KHỚP | 0,17 KHỚP | KHÔNG-d0 |
| w2400 n10 | 1,021 | 1,17 | 1,09 | 1,07 | áp / từ chối | 0,21 KHỚP | 0,22 KHỚP | KHÔNG-d0 |
| w2720 n05 | 1,025 | 1,17 | 1,14 | 1,03 | áp / từ chối | 0,12 KHỚP | 0,15 KHỚP | KHÔNG-d0 |
| w2720 n07 | 1,025 | 1,17 | 1,14 | 1,03 | áp / từ chối | 0,17 KHỚP | 0,19 KHỚP | KHÔNG-d0 |
| w2720 n08 | 1,025 | 1,17 | 1,14 | 1,03 | áp / từ chối | 0,16 KHỚP | 0,18 KHỚP | KHÔNG-d0 |
| w2720 n10 | 1,025 | 1,17 | 1,14 | 1,03 | áp / từ chối | 0,22 KHỚP | 0,24 KHỚP | KHÔNG-d0 |
| w2880 n07 | 1,011 | 1,17 | 1,00 | 1,17 | áp / từ chối | 0,16 KHỚP | 0,19 KHỚP | KHÔNG-d0 |
| w2880 n08 | 1,011 | 1,17 | 1,00 | 1,17 | áp / từ chối | 0,15 KHỚP | 0,18 KHỚP | KHÔNG-d0 |

Nhận xét:

- **ratio_R vượt 1 giữa w2048 (0,86) và w2400 (1,07)** — ranh giới
  Q3 của test-pattern nằm giữa hai cửa sổ này. Từ w2400 trở lên,
  ratio_R chỉ 1,03–1,17 (sát nút 1,0) nhưng d0 vẫn vô hại ở mọi mức
  noise (fullD0 Δkurt R ≤ 0,24, cách ngưỡng 0,35 khá xa).
- **Mức noise trung gian không tạo thêm case phân biệt:** n07/n08 ở
  w2880 đều KHỚP cả hai chế độ (0,15–0,19) — không lặp lại vùng
  0,34/0,36 của n05 cũ (vốn đã không còn đứng sau BC, xem §3). Quan
  hệ noise → Δkurt R đơn điệu tăng ở w2048 (0,27 → 0,28 → 0,27 →
  0,34 noD0) nhưng chỉ n10 chạm ngưỡng.
- w2048 là rect NHỎ NHẤT trong sweep mới — và là nơi duy nhất d0
  làm hại. Ở rect lớn hơn, d0 vô hại dù cổng mở hay đóng.

### 2.2 basgo — cửa sổ lớn

| case | plainMad | d0std_R | residStd_R | ratio_R | cổng G1/G2 | noD0 / fullD0 Δkurt R | đúng |
|---|---|---|---|---|---|---|---|
| w2240 n05 | 0,666 | 0,89 | 0,68 | 1,31 | áp / từ chối | 0,12 / 0,12 KHỚP | KHÔNG-d0 |
| w2240 n10 | 0,666 | 0,89 | 0,68 | 1,31 | áp / từ chối | 0,11 / 0,10 KHỚP | KHÔNG-d0 |
| w2560 n05 | 0,682 | 0,90 | 0,70 | 1,29 | áp / từ chối | 0,13 / 0,12 KHỚP | KHÔNG-d0 |
| w2560 n10 | 0,682 | 0,90 | 0,70 | 1,29 | áp / từ chối | 0,11 / 0,10 KHỚP | KHÔNG-d0 |
| w2880 n05 | 0,676 | 0,90 | 0,69 | 1,30 | áp / từ chối | 0,12 / 0,12 KHỚP | KHÔNG-d0 |
| w2880 n10 | 0,676 | 0,90 | 0,69 | 1,30 | áp / từ chối | 0,11 / 0,10 KHỚP | KHÔNG-d0 |

Basgo đã Q3 ở w1440/w1920 (F7, ratio 1,14–1,24) và vẫn Q3 ở mọi cửa
sổ lớn (ratio 1,29–1,31, gần như không đổi theo rect — khác
test-pattern). d0 không làm hại verdict ở bất kỳ cửa sổ nào
(Δkurt R ≤ 0,13 cả hai chế độ). Basgo đóng góp 6 case bất đồng cổng
nhưng 0 case phân biệt verdict.

### 2.3 Điểm luật trên 20 case mới

| luật | đúng / 20 | sai |
|---|---|---|
| R0 cũ | 19/20 | w2048-n10 |
| G1 | 19/20 | w2048-n10 |
| G2 | 19/20 | w2048-n10 |
| G12 | 19/20 | w2048-n10 |

Cả 4 luật đồng hạng trên case mới — vì case sai duy nhất là case cả
hai cổng cùng áp. Không có case nào trong 20 case mới tách G1 khỏi G2.

## 3. Đính chính F7: kernel BC upscale làm đổi số đo cũ

### 3.1 Dòng thời gian (giờ UTC 10/11)

- 00:04 — F7 ghi `r78f7-screen.json` (d0std_R test-pattern w2880 = 1,14).
- 01:05 — F7 ghi `r78f7-postfix.json` (case phân biệt w2880-n05:
  noD0 Δkurt R 0,34 KHỚP / fullD0 0,36 LỆCH).
- **01:09 — F6 sửa `apps/web/scripts/chrome-resample.mjs`**: nối
  kernel BC(0,25, 0,375) làm nhánh upscale của
  `resamplePlaneTrilinear` (`sx > 1 && sy > 1 → BC`, còn lại giữ tam
  giác; xem `docs/PHASE9_ROUND78_F6_KERNEL_BC_LIMITS.md` §1–§5).
- Mọi phép đo G6 (từ 02:44 UTC) dùng resample đã nối BC.

### 3.2 Kiểm chứng: tính lại snapshot F7 bằng harness hiện tại

Script `/tmp/r79g6-f7-recheck.mjs` (tạm, không stage) + bản stage
`r79g6-f7-recheck.mjs` (chạy lại toàn bộ 26 case F7):

| case F7 | trước (tam giác) | nay (BC) |
|---|---|---|
| w2240 n05/n10 (downscale 1129x635) | KHÔNG-d0, cả hai KHỚP | **y hệt từng số** (plainMad 0,971, d0std_R 1,15, ratio 1,16) |
| w2560 n05/n10 (upscale 1449x815) | cả-hai-LỆCH | **KHÔNG-d0, cả hai KHỚP** (noD0 Δkurt R 0,12/0,22; plainMad 0,969 → 1,017; d0std_R 1,14 → 1,17; ratio 1,23 → 0,96) |
| **w2880 n05 (upscale 1769x995)** | **KHÔNG-d0, G1 LỆCH / G2 KHỚP — case phân biệt duy nhất** | **KHÔNG-d0, cả hai KHỚP** (noD0 Δkurt R 0,12; fullD0 0,14; plainMad 0,965 → 1,011; d0std_R 1,14 → 1,17; ratio 1,41 → 1,17) |
| w2880 n10 (upscale 1769x995) | cả-hai-LỆCH (Δkurt R 0,40/0,42) | **KHÔNG-d0, cả hai KHỚP** (0,21/0,23) |

Cơ chế: chỉ rect upscale thuần (1449x815, 1769x995) đổi nhánh kernel;
rect downscale không đổi (F6 kiểm chứng bit-identical, và w2240 tái
lập y hệt từng số ở trên). d0std_R đổi nhỏ (1,14 → 1,17) nhưng
Δkurt R đổi lớn (0,34 → 0,12 ở w2880-n05 noD0) vì render plain/noise
resample bằng BC cho delta thống kê khác hẳn ở thang upscale.

Đánh giá: case phân biệt của F7 là **đúng dưới mô hình tam giác cũ,
sai dưới mô hình BC hiện tại**. F6/E9 đã chứng minh BC khớp hành vi
upscale thật của Chrome hơn tam giác (19/20 vs 15/20 verdict), nên số
BC là số đáng tin hơn — và dưới số đó, G1/G2 không còn phân biệt
được. File JSON F7 gốc KHÔNG sửa (giữ làm tài liệu lịch sử); mọi điểm
gộp từ nay dùng số tính lại (§5).

### 3.3 Recheck toàn bộ case cũ bằng harness hiện tại

| tập | script | kết quả |
|---|---|---|
| D2 24 case | `r79g6-e6-recheck.mjs` | khớp D2 **21/24**; lệch 3 case — tất cả ở rect upscale: B1-w2560-ocean, B1-w2880-ocean, D2-w2560-ocean (plainMad 2,943 → 2,711; residStd_R 5,24 → 4,73; kurtDiff G 0,03 → 0,18 — nhưng verdict + điểm luật KHÔNG đổi: G12 20/20, R0 18/20) |
| E6 3 case mới | `r79g6-e6-newcases-recheck.mjs` | y hệt E6 (rect downscale): G12 3/3, R0 2/3 |
| F7 26 case | `r79g6-f7-recheck.mjs` | G1 **24/24**, G2 **24/24**, G12 **24/24** (chấm được 24, tăng từ 21 — 3 case test-pattern upscale từ cả-hai-LỆCH thành KHÔNG-d0); R0 21/24 |

Script recheck E6 tự báo exit 1 ("KHÔNG ĐẠT") vì có mismatch vs D2 —
đó chính là kết quả cần ghi nhận (resample đã đổi), không phải lỗi
chạy. File E6/F7 gốc không ghi đè; JSON recheck ra
`hidden_files/round79-g6/r79g6-e6-recheck.json`,
`r79g6-e6-newcases-recheck.json`, `r79g6-f7-recheck.json`.

## 4. Case w2048-n10: cả hai cổng cùng sai

`G6-sweep-w2048-testpattern-n10` (rect 937x527 — rect nhỏ nhất sweep
mới): noD0 KHỚP (Δkurt [0,34, 0,06, 0,19]), fullD0 LỆCH (Δkurt
[0,36, 0,19, 0,19]) — kênh R vượt ngưỡng 0,35 đúng 0,01 mỗi phía.
d0std_R 1,14 (≤ 2, G1 áp), ratio_R 0,86 (≤ 1, G2 áp) nên cả hai cổng
cùng áp d0 và cùng sai; G12 cũng sai. Đây là lần đầu G12 sai trên
một case chấm được (trước đó: D2 20/20, E6 23/23 — đều tiền-BC).

Đối chiếu: test-pattern w1280-n10 (F7, rect 311x175): d0 GIÚP
(noD0 LỆCH Δkurt G 0,43 → fullD0 KHỚP). Dấu tác dụng của d0 đổi chiều
giữa rect 311 (giúp) và rect 937 (hại) ở cùng mức noise n10 — chưa có
mô hình giải thích; có thể do d0std/residStd đổi theo rect trong khi
ngưỡng verdict cố định. Biên mỏng ±0,01 quanh ngưỡng 0,35 (giống hệt
biên case F7 cũ) nhắc rằng mọi kết luận "đúng/sai" ở đây đều nhạy
ngưỡng — xem §6.2.

## 5. Điểm gộp harness-hiện-tại: 73 case

`r79g6-combined.mjs` gộp 4 JSON đều tính bằng harness hiện tại
(24 D2 tính lại + 3 E6 tính lại + 26 F7 tính lại + 20 G6 mới):

| luật | đúng / chấm được | sai |
|---|---|---|
| R0 cũ | 60/67 | 7 (6 ocean post-fix + w2048-n10) |
| G1 | **66/67** | w2048-n10 |
| G2 | **66/67** | w2048-n10 |
| G12 | **66/67** | w2048-n10 |

Không chấm được 6 case (cả-hai-LỆCH): F7 w1280-n05, F7 w1760-n10,
Y2-w1440-ocean-noise05, B1-w1280/w1440/w1600-ocean (toàn pre-fix).
G1/G2 bất đồng cổng **24/73** (16 mới + 8 cũ: basgo F7 ×4,
test-pattern F7 w2240 ×2 + w2880 ×2). **Phân biệt được ở mức verdict:
0.** Mọi case bất đồng đều Q3 (G1 áp, G2 từ chối); chưa có case Q4
nào (d0std_R > 2 nhưng ratio_R ≤ 1), nên G2 vs G12 cũng chưa phân
biệt được.

## 6. Giới hạn trung thực

1. **G1/G2 chưa phân biệt được — và bằng chứng cũ đã mất.** Sau 73
   case, 24 bất đồng cổng nhưng 0 phân biệt verdict. Case phân biệt
   duy nhất từng có (F7 w2880-n05) không tái lập được dưới resample
   BC hiện tại (§3). Muốn tách G1/G2 cần nội dung/cửa sổ mới mà d0
   vừa đủ lớn để làm hại verdict khi áp sai — w2048-n10 cho thấy dạng
   case đó tồn tại (d0 hại dù cả hai cổng áp), nhưng chưa có case nào
   mà hai cổng quyết định ngược nhau VÀ verdict tách ra.
2. **Ngưỡng Δkurt 0,35 là điểm nhạy nhất.** Cả hai case "sát nút"
   (F7 w2880-n05 cũ, G6 w2048-n10 mới) đều nằm ±0,01 quanh ngưỡng.
   Mọi claim đúng/sai ở biên này đều phụ thuộc quy ước ngưỡng thực
   nghiệm, chưa có cơ sở lý thuyết độc lập.
3. **Điểm gộp trộn 4 thế hệ capture nhưng cùng một harness** — tất cả
   73 case đã tính lại bằng resample BC hiện tại nên so sánh được.
   JSON D2/E6/F7 gốc tiền-BC chỉ còn giá trị lịch sử, không dùng để
   chấm nữa.
4. **Kênh G của test-pattern vẫn bất thường** (d0std_G ~4,4 ở mọi cửa
   sổ, trong khi d0std_R ~1,1–1,2, d0std_B ~0,6–0,7; nợ F7 §5.4):
   luật chỉ dùng kênh R, việc bỏ qua kênh G chưa được biện minh độc
   lập. Ở w2048-n10, kênh G không phải nguyên nhân lệch (Δkurt G
   0,06 noD0 / 0,19 fullD0 — đều qua ngưỡng), nhưng câu hỏi vẫn mở.
5. **slovenska post-fix gần như không cải thiện** (nợ F7 §5.5) —
   không đụng trong đợt này; phần dư post-fix (residStd_R 2,58–2,95)
   vẫn chưa rõ nguồn.
6. **Q4 vẫn trống:** không frame nào trong tập hiện tại có d0std_R
   trong (1,17; 3,27] — khoảng trống giữa test-pattern (~1,17) và
   ocean (~3,3). Săn Q4 (phân biệt G2 vs G12) vẫn cần nội dung mới
   (nợ F7 §6.2, chưa làm đợt này).
7. **D3 của phiên w2880-testpattern-n0708:** script capture báo FAIL
   D3 vì D3 cứng so plain vs noise05 trong khi phiên này chỉ capture
   noise07/noise08 (không có noise05). Dữ liệu vẫn đúng: kiểm chứng
   tay từ JSON — raw hash plain = noise07 = noise08 = `ad4be1d3`,
   ct=1 (cùng khung); eval D3 (so theo đúng mức noise của case) =
   true cả 2 case. Lỗi là của script kiểm tra, không phải của dữ liệu.
8. **Nhãn stdout sai:** `r79g6-sweep-stdout.log` ghi "(case mới F7)"
   trong 4 dòng điểm luật — do copy script từ F7; đã sửa nhãn trong
   `r79g6-sweep.mjs` sau khi chạy. JSON `r79g6-sweep.json` không ảnh
   hưởng (chỉ có scores theo tên luật).
9. **Capture flake do tải VM** (xem §7): không sửa production hay nới
   timeout để chữa flake đo.

## 7. Kiểm chứng

Lệnh (từ gốc repo, trừ tsc/vite chạy trong `apps/web`):

- Capture: 7 phiên `r79g6-headed-capture.mjs` + 4 rerun (xem
  `hidden_files/round79-g6/captures-*.log`). Pass: w2048/w2400/w2720
  test-pattern 3/3, w2240-basgo 3/3, w2880-basgo-r2 3/3,
  w2560-basgo-r4 3/3, w2880-testpattern-n0708-r2 2/3 (chỉ FAIL D3 giả
  — xem §6.7, dữ liệu dùng được). Lỗi flake: w2880-testpattern lần 1
  modal chào kẹt (exit 2); w2560-basgo lần 1 `__vcutMediaEls=0`, lần 2
  modal chào kẹt, lần 3 videoWidth=0 sau 90 s; w2880-basgo lần 1
  videoWidth=0 sau 90 s (VP8 webm load chậm khi VM đông, load 7–11).
  Tất cả đều pass khi chạy lại; không nới timeout, không sửa
  production.
- `node apps/web/scripts/r79g6-sweep.mjs` — exit 1 theo đúng logic
  script (G12 sai 1 case mới — đó là kết quả, không phải lỗi chạy),
  ghi `hidden_files/round79-g6/r79g6-sweep.json` (20 case mới).
- `node apps/web/scripts/r79g6-e6-recheck.mjs` — exit 1 theo logic
  script (3 mismatch vs D2 — chính là phát hiện §3.3); G12 20/20.
- `node apps/web/scripts/r79g6-e6-newcases-recheck.mjs` — exit 0,
  G12 3/3, số y hệt E6.
- `node apps/web/scripts/r79g6-f7-recheck.mjs` — exit 0, G12 24/24.
- `node apps/web/scripts/r79g6-combined.mjs` — exit 0, 73 case,
  G1=G2=G12=66/67, phân biệt verdict 0.
- `node --test apps/web/scripts/test_round79_g6_g1g2.mjs` —
  **8/8 pass** (2 kỳ vọng viết sai lúc đầu đã sửa theo số đo thật:
  w2880-n05 F7 gốc là KHÔNG-d0 chứ không phải cả-hai-LỆCH; điểm vượt
  ratio_R là w2400 chứ không phải w2240 — xem log luồng).
- `node --test apps/web/scripts/test_round77_e6_g12.mjs` —
  **7/7 pass** (hồi quy, đọc JSON E6 gốc).
- `node --test apps/web/scripts/test_round78_f7_g1g2.mjs` —
  **7/7 pass** (hồi quy, đọc JSON F7 gốc — JSON gốc không đổi nên
  vẫn pass; test này KHÔNG kiểm chứng số recheck).
- `node --test apps/web/scripts/chrome-resample-67u2.test.mjs` —
  **8/8 pass**.
- `npx tsc --noEmit` (trong `apps/web`) — **0 lỗi**.
- `npx vite build` (trong `apps/web`) — **pass** (28,21 s; cảnh báo
  chunk-size có sẵn từ trước).

## 8. File đổi/thêm (stage, KHÔNG push)

- `apps/web/scripts/r79g6-headed-capture.mjs` (mới — capture headed +
  variant noise07/noise08)
- `apps/web/scripts/r79g6-sweep.mjs` (mới — eval 20 case + gộp stale;
  gộp trong file này trộn số tiền-BC nên đã bị thay thế bởi
  `r79g6-combined.mjs` — chỉ dùng phần 20 case mới)
- `apps/web/scripts/r79g6-e6-recheck.mjs` (mới — tính lại 24 case D2)
- `apps/web/scripts/r79g6-e6-newcases-recheck.mjs` (mới — tính lại 3
  case E6)
- `apps/web/scripts/r79g6-f7-recheck.mjs` (mới — tính lại 26 case F7)
- `apps/web/scripts/r79g6-combined.mjs` (mới — điểm gộp 73 case
  harness-hiện-tại)
- `apps/web/scripts/test_round79_g6_g1g2.mjs` (mới — 8 test)
- `docs/PHASE9_ROUND79_G6_G1G2_SWEEP_LIMITS.md` (mới — file này)

Không stage: `hidden_files/round79-g6/` (snapshot/JSON/log nội bộ),
frame render noise07/noise08 `.raw` (binary — cách build ở §1),
`/tmp/r79g6-f7-recheck.mjs`, driver `captures-*.sh`,
`rechecks-run.sh`, không workflow `.yml`. File paths:
`~/workspace/repo-1-push/paths-loop/phase9-round79-g6-g1g2-sweep.txt`.
