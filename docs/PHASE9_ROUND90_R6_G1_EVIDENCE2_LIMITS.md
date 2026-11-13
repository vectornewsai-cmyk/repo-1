# Đợt 90 R6 — G1 evidence vòng 2: sửa harness + đo thêm 60fps (KHÔNG TỰ ĐÓNG)

Ngày: 11/11/2026 (lượt cron 21:35 +07; đo headed 14:58–15:10 UTC).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot trước lượt — uptime 1:29 lúc bắt đầu).
Nợ: LIMITS gộp đợt 89 §4 mục 6 + Q7 §7 mục 3 (60fps cần thêm 2 PASS
liên tiếp → 8/10 = 80%) và §7 mục 4 (harness: chẩn đoán "cổng bị
chiếm?" sai; bọc lỗi trước-try L3 §7.5; ghi số slot đóng băng kèm mọi
verdict).

**Trạng thái cuối: G1 VẪN CHƯA ĐÓNG — R6 chỉ đưa số + khuyến nghị, quyết
định cuối thuộc parent/user.** Không sửa production, không đổi ngưỡng,
không đổi metric. Không i18n key mới. Không kiểm lại TTS 39.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **60fps: 3/3 lần R6 mới đều PASS — 1,13 / 0,81 / 1,26 → pool 60fps
  nay n=11: median 0,940×, mean 0,943, SD 0,186, CI 95% [0,818;
  1,068], PASS 9/11 (82%)** — lần đầu tiên cả ba tiêu chí chặt cùng
  đạt ở fixture 60fps (median ≥0,75; PASS ≥80%; CI cận dưới ≥0,75).
  Cửa sổ 5 lần 60fps mới nhất [1,13, 0,92, 1,13, 0,81, 1,26]:
  median 1,130, 5/5 PASS → luật (b) **PASS ỔN ĐỊNH** (cửa sổ 60fps
  hoàn chỉnh đầu tiên đạt luật b).
- **Nhưng mức vượt 80% chỉ đúng 1 lần PASS** (9/11 = 81,8%; 8/11 =
  72,7%) — đúng mẫu "lằn ranh mỏng" N5/Q7 đã cảnh báo ở pool 30fps.
  Và **cả 3 lần R6 đều đo ở tải cực đoan nhất lịch sử 60fps
  (baseline 0,75–1,03 fps; M1: 2,13–3,67; N10: 1,37–4,93)** — ở
  baseline <1 fps, tỉ lệ mất ổn định số học: lần 1 có slot 0,26×
  và 1,89× trong cùng một lần; lần 3 có slot baseline đóng băng
  0,00 fps. Đừng trích "deint 60fps nay nhanh hơn baseline 13–26%"
  — đó là số của sóng tải, như Q7 đã cảnh báo cho 1,22×.
- **Chân yên vẫn KHÔNG có số mới:** cả 11 lần 60fps đều ở chế độ
  tải; pool 30fps-yên vẫn n=4 (median 0,680, 1/4 PASS). Đây là đợt
  thứ 5 liên tiếp (L3, M1, N5, Q7, R6) không đo được lần yên nào
  trong giờ vòng lặp.
- **Pool 30fps:** không đổi nếu không tính lần verify (n=27,
  median 0,930, PASS 22/27 = 81%); thêm 1 lần E1-verify của R6
  (1,58× — xem cảnh báo dưới) thành n=28, median 0,935, PASS 23/28
  (82%); chế độ tải n=24: median 0,950, PASS 22/24 (92%).
- **Harness đã sửa xong + kiểm chứng bằng chạy thật:** E1 bọc toàn
  bộ `main()` trong try/finally (L3 §7.5), vite spawn qua pipe +
  đuôi log trong bộ nhớ, chẩn đoán EPERM-vs-port trong thông báo
  lỗi, slot đóng băng ghi kèm mọi verdict (E1 + K3 + test 12/12).
  **Chưa kiểm chứng được bằng 1 lần vite fail thật** (vite lên ngay
  lần 1 ở lần verify) — chẩn đoán mới chỉ qua review code + syntax.

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy
yên. CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round90-r6/analyze-pool90r6.py` (đọc report JSON R6 +
số đã công bố; 60fps tính lại từ report khớp ratioMean đã ghi).

### 2.1 Từng cửa sổ 5 lần (luật b)

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| I5 (đợt 81) | yên 1 / tải 4 (16,35; 3,16; 2,61; 1,77; 1,64) | 0,93 / 0,75 / 0,80 / 0,81 / 0,94 | 0,810 | 5/5 | PASS ỔN ĐỊNH | [0,741; 0,951] |
| J3 (đợt 82) | yên 1 / tải 4 (27,35; 2,47; 0,88; 2,11; 1,56) | 0,68 / 0,73 / 1,13 / 0,75 / 1,13 | 0,750 | 3/5 | CHƯA ĐẠT | [0,603; 1,165] * |
| K3 (đợt 83) | tải 5 (5,53; 4,10; 4,12; 2,60; 3,24) | 0,95 / 1,04 / 0,69 / 0,85 / 0,84 | 0,850 | 4/5 | PASS ỔN ĐỊNH | [0,711; 1,037] |
| L3 (đợt 84) | yên 2 / tải 3 (38,52; 38,97; 6,26; 1,81; 2,70) | 0,65 / 0,68 / 0,75 / 0,75 / 1,03 | 0,750 | 3/5 | CHƯA ĐẠT | [0,585; 0,959] |
| M1 60fps (đợt 85) | tải 5 (3,01; 2,13; 3,67; 2,91; 3,31) | 1,00 / 0,88 / 0,94 / 0,62 / 0,73 | 0,880 | 3/5 | CHƯA ĐẠT | [0,640; 1,028] |
| N5 (đợt 86) | tải 4 / yên 0 (5,72; 2,35; 8,18; 3,80) + lần 5 gãy | 1,06 / 0,95 / 1,03 / 1,29 (4 lần) | 1,045 | 4/4 | CHƯA ĐỦ MẪU (cần 5) | [0,850; 1,315] |
| Q7 (đợt 89) | tải 3 / yên 0 (2,80; 0,90; 1,44) + lần 4/5 gãy | 1,22 / 1,23 / 1,17 (3 lần) | 1,220 | 3/3 | CHƯA ĐỦ MẪU (cần 5) | [1,127; 1,287] |
| **R6 60fps (đợt 90)** | **tải 3 / yên 0 (1,03; 0,98; 0,75)** | **1,13 / 0,81 / 1,26 (3 lần)** | **1,130** | **3/3** | **CHƯA ĐỦ MẪU (cần 5)** | **[0,491; 1,642]** |
| **60fps 5 mới nhất** | **tải 5 (2,05; 1,37; 1,03; 0,98; 0,75)** | **1,13 / 0,92 / 1,13 / 0,81 / 1,26** | **1,130** | **5/5** | **PASS ỔN ĐỊNH** | **[0,825; 1,275]** |

\* CI cửa sổ J3 tính lại lệch ±0,02–0,05 so với công bố (do làm tròn
đầu vào) — ghi lại từ N5, không đổi verdict nào.

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5+Q7) | 27 | 0,930 | 0,920 | 0,193 | [0,845; 0,994] | 22/27 (81%) | PASS ỔN ĐỊNH |
| 30fps + R6 E1 verify | 28 | 0,935 | 0,943 | 0,227 | [0,858; 1,029] | 23/28 (82%) | PASS ỔN ĐỊNH |
| 30fps — máy tải (<10 fps) | 24 | 0,950 | 0,978 | 0,222 | [0,887; 1,068] | 22/24 (92%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps) | 4 | 0,680 | 0,735 | 0,131 | [0,527; 0,943] | 1/4 (25%) | CHƯA ĐẠT |
| **60fps fixture (M1+N10+R6)** | **11** | **0,940** | **0,943** | **0,186** | **[0,818; 1,068]** | **9/11 (82%)** | **PASS ỔN ĐỊNH (lần đầu)** |
| 60fps — máy tải (<10 fps) | 11 | 0,940 | 0,943 | 0,186 | [0,818; 1,068] | 9/11 (82%) | PASS ỔN ĐỊNH |
| 60fps — máy yên (≥10 fps) | 0 | — | — | — | — | — | KHÔNG CÓ SỐ |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 39 | 0,940 | 0,943 | 0,213 | [0,875; 1,011] | 32/39 (82%) | đúng ngưỡng |
| Combo | 6 | 0,815 | 0,763 | 0,356 | [0,389; 1,137] | 3/6 (50%) | không verdict (n nhỏ, SD lớn) |

### 2.3 Tiêu chí nào đạt / chưa đạt (so với Q7)

| Tiêu chí | Q7 (n=27/8) | R6 (n=28/11) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 0,930 ✓ | 0,935 ✓ | +0,005 |
| Pool 30fps PASS ≥ 80% | 22/27 = 81% ✓ | 23/28 = 82% ✓ | +1 PASS (lần verify phồng) |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,845 ✓ | 0,858 ✓ | +0,013 |
| 30fps tải n≥20: median + PASS + CI | 0,950 / 91% / 0,875 ✓✓✓ | 0,950 / 92% / 0,887 ✓✓✓ | biên lớn hơn |
| 30fps yên: median + PASS | 0,680 / 25% ✗✗ | không đổi | không có số mới |
| **60fps: median + PASS + CI** | **0,930 / 75% / 0,764 (PASS ✗)** | **0,940 / 82% / 0,818 ✓✓✓** | **cả ba nay đạt — lần đầu** |
| 60fps cửa sổ 5 mới nhất luật (b) | median 0,92, 3/5 → CHƯA ĐẠT | median 1,13, 5/5 → PASS ỔN ĐỊNH | **đạt lần đầu** |
| 60fps yên | n=0 | n=0 | không có số mới |
| Cửa sổ trượt 5 lần 30fps PASS | 14/23 | 15/24 | vẫn 9 cửa sổ CHƯA ĐẠT |
| Cửa sổ R6 60fps đủ 5 lần | — | 3/5 (chỉ đo 3) | không verdict cửa sổ R6 riêng |

**Đọc bảng đúng:** chân tải nay đạt cả ba tiêu chí chặt ở CẢ HAI
fixture (30fps: 92%; 60fps: 82%) — nhưng chân 60fps vượt 80% đúng
1 lần PASS và cả 3 lần mới đều ở tải cực đoan nhất lịch sử pool.
Chân yên (cả hai fixture) vẫn chưa có số mới nào.

## 3. Cửa sổ R6 mới — chi tiết từng lần

### 3.1 E1 verify 1 lần (30fps, harness mới) — 14:58:43–15:01:14Z

Lệnh: `E1_SCRATCH=hidden_files/round90-r6/e1-verify-run1 node
apps/web/scripts/clicktest-77e1-deint-fps.mjs` (cổng :5580 / debug
:9680 / display :180, tự pick; fixture 30fps, 11 slot × 3s xen kẽ).
Kết quả: **10/10 PASS, exit 0, 2m31s.** Vite lên ngay lần 1.

| Slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Config | B | D | B | D | B | D | B | D | B | D | B |
| Draw fps | 1,29 | 1,55 | 1,53 | 1,33 | 1,62 | 1,66 | 2,24 | 1,94 | 2,90 | 8,40 | 0,97 |
| Tỉ lệ drift-corrected | — | 1,10 | — | 0,84 | — | 0,86 | — | 0,75 | — | 4,34 | — |

G5 mean **1,58×**, baseline mean 1,76 fps, **không slot đóng băng**.
Pixel giống hệt N5/Q7 (G2 R 0,74 → 0,51, MAD 0,5821; G7a MAD
0,6903; G7b 0,0119; G8 R 0,55 → 0,52); H9 0 lỗi trang; playhead
0,90–1,04× mọi slot. Load 1-phút tăng 4,54 → 14,43 trong lúc đo.

**Cảnh báo (quan trọng): 1,58× BỊ PHỒNG bởi đúng 1 slot** — slot 9
deint 8,40 fps kề slot 10 baseline sụp còn 0,97 fps (tỉ lệ 4,34×);
trung vị 5 tỉ lệ chỉ 0,86. Cùng cơ chế sóng tải như N5 lần 4
(1,29×) và Q7 slot 2,02×. Đừng trích 1,58× như tốc độ deint; pool
30fps n=28 chỉ nên đọc kèm cảnh báo này (bỏ lần này ra thì pool
vẫn 22/27 = 81%).

### 3.2 60fps deint-only ×3 (probe N10) — 15:02:23–15:10:41Z

Lệnh (mỗi lần, tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round90-r6/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.
Lưu ý phương pháp: nhiệm vụ ghi "đo 60fps bằng script K3", nhưng
K3 chạy harness E1 hardcode fixture 30fps (`interlaced720.mp4`) —
K3 KHÔNG có đường đo 60fps. R6 đo 60fps bằng đúng đường chuẩn từ
M1/N10 (probe-86n10-config-fps.mjs), cùng công thức tỉ lệ
drift-corrected, gộp thẳng vào pool 60fps n=8 của N10.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu→cuối) | RAM khả dụng | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 15:02–15:05 | 9,88 → 1,98 | ~3,0 → 3,5 GB | 1,03 fps | 1,89 / 0,26 / 0,78 / 1,36 / 1,35 | **1,13×** | PASS, 4/4 |
| 2 | 15:05–15:08 | 1,67 → 15,13 | ~2,8 → 1,8 GB | 0,98 fps | 1,16 / 0,80 / 0,70 / 0,72 / 0,65 | **0,81×** | PASS, 4/4 |
| 3 | 15:08–15:11 | 15,52 → 12,87 | ~1,8 GB | 0,75 fps | 1,79 / 1,39 / 1,11 / 1,04 / 0,98 | **1,26×** | PASS, 4/4 |

Tốc độ tuyệt đối (draw fps, từ report JSON):

| Lần | Baseline draw (6 slot) | Deint draw (5 slot) | Slot đóng băng (<0,5 fps) |
|---|---|---|---|
| R6-1 | 0,65 / 0,96 / 1,22 / 0,91 / 0,94 / 1,52 (mean 1,03) | 1,52 / 0,28 / 0,83 / 1,26 / 1,66 (mean 1,11) | slot 3 deint 0,28 |
| R6-2 | 0,60 / 0,97 / 1,52 / 1,24 / 1,22 / 0,31 (mean 0,98) | 0,91 / 1,00 / 0,97 / 0,88 / 0,50 (mean 0,85) | slot 10 baseline 0,31 |
| R6-3 | 0,00 / 0,97 / 0,92 / 0,81 / 0,89 / 0,91 (mean 0,75) | 0,87 / 1,31 / 0,96 / 0,88 / 0,88 (mean 0,98) | slot 0 baseline 0,00 |

- **D1 cả 3 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 3/3 lần và giống hệt N10 (0,3835)
  — deint áp thật trên fixture 60fps, đường code không đổi.
- **Playhead deint-only 60fps (33 slot R6): 0,79–1,14×, không slot
  nào vượt 1,3×** — đối chứng sạch, giống M1/N10. Dị thường
  playhead vẫn là đặc trưng của lớp fx/combo, không phải deint.
- **C3 0 lỗi trang cả 3 lần.** Không có dấu EPERM trong log 3 lần
  đo (grep `EPERM|Operation not permitted` trên run log + report:
  0 kết quả).
- **Tải cực đoan, cần đọc kèm:** baseline 0,75–1,03 fps là thấp
  nhất lịch sử 60fps. Lần 1: slot 1,89× (baseline kề 0,65–0,96
  fps) và slot 0,26× (deint 0,28 fps đóng băng) trong cùng một lần
  — chênh nhau 0,05 fps tuyệt đối lật tỉ lệ ~1,6. Lần 3: slot 0
  baseline 0,00 fps (đóng băng hoàn toàn) làm tỉ lệ slot 1 phồng
  lên 1,79×. Mean 3 lần (1,067) có CI rất rộng [0,491; 1,642]
  (n=3). Đây là bằng chứng mới cho Q7 §4 phương án B: ở baseline
  <1 fps, metric tỉ lệ FPS gần như mất nghĩa.

### 3.3 Cửa sổ yên — KHÔNG xuất hiện trong lượt

Trong suốt cửa sổ đo (~40 phút, 14:58–15:11Z), load 1-phút dao
động 1,67–15,52 và load 5-phút không xuống dưới ~4,5; mọi lần đo
đều baseline 0,75–1,76 fps. Đáng chú ý: lần 60fps-2 bắt đầu lúc
load 1-phút chỉ 1,67 nhưng baseline vẫn 0,98 fps — loadavg lúc
bắt đầu KHÔNG dự báo được tải trong lúc đo (sibling tăng vọt
giữa chừng: 1,67 → 15,13). Đây là đợt thứ 5 liên tiếp không có
lần yên nào trong giờ vòng lặp. R6 KHÔNG đo thêm lần yên nào.

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của R6: KHÔNG đóng G1 toàn vẹn; phương án A nay mạnh
hơn ở cả hai fixture nhưng vẫn kèm hai điều kiện mới. Quyết định
cuối thuộc parent/user.**

- **Phương án A — Đóng một phần: deint ĐẠT ở chế độ tải, cả 30fps
  lẫn 60fps (ĐỀ XUẤT XEM XÉT, có điều kiện):** 30fps-tải n=24:
  median 0,950×, mean 0,978, CI cận dưới 0,887, 22/24 PASS = 92%;
  60fps-tải n=11: median 0,940×, mean 0,943, CI cận dưới 0,818,
  9/11 PASS = 82%; cửa sổ 5 lần 60fps mới nhất PASS luật (b) 5/5.
  Đây là lần đầu cả hai fixture cùng đạt cả ba tiêu chí chặt ở
  chế độ tải.
  - Điều kiện đóng (bắt buộc ghi kèm): (i) verdict "PASS" chỉ
    đúng ở chế độ tải / máy yếu; trên máy nhanh (baseline ≥10
    fps) deint chậm hơn ngưỡng một cách có hệ thống ở 30fps
    (~0,68×) và CHƯA CÓ SỐ ở 60fps (n=0); (ii) không trích số
    pool gộp (0,940× / 82%) như verdict duy nhất — pool gộp
    trộn hai chế độ nên không có nghĩa; (iii) **ghi rõ 3 lần R6
    làm 60fps vượt 80% được đo dưới tải cực đoan nhất lịch sử
    pool (baseline 0,75–1,03 fps, loadavg tới 15,5) và tỉ lệ
    cao của chúng là sóng tải, không phải tốc độ code** — nếu
    parent muốn một con số "sạch", 3 lần R6 không cho được;
    (iv) mức vượt 80% ở 60fps chỉ đúng 1 lần PASS (9/11) —
    thêm 1 lần FAIL nữa là rơi lại dưới 80%, đúng như N5/Q7
    cảnh báo; (v) chân yên vẫn MỞ như hai mục con riêng (30fps
    n=4, 60fps n=0), không gộp vào quyết định đóng này.
  - Vì sao R6 vẫn không đề xuất đóng toàn vẹn dù cả hai fixture
    đã vượt 80%: (1) 60fps vượt đúng 1 lần PASS; (2) cửa sổ R6
    60fps chỉ 3 lần, không đủ 5 — pool vượt nhờ cộng dồn qua
    cửa sổ trượt 5 lần mới nhất, không nhờ một cửa sổ R6 hoàn
    chỉnh; (3) không có số yên nào ở cả hai fixture trong 5
    đợt liên tiếp; (4) ở baseline <1 fps, metric tỉ lệ FPS mất
    ổn định số học (lần 1: 0,26× và 1,89× cùng một lần) — một
    verdict đóng dựa trên các lần đo này là verdict trên metric
    đang mất nghĩa ở biên.
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5/Q7 (luật
  median-5 không cho verdict duy nhất không phụ thuộc chế độ;
  cần metric không bị lượng tử hoá khung chi phối, vd gap-mean
  tick-time hoặc thời gian xử lý/frame). R6 bổ sung bằng chứng
  ủng hộ B: ở baseline <1 fps, tỉ lệ FPS còn mất ổn định hơn
  cả ở baseline <1,5 fps mà Q7 đã ghi (slot 0,00 fps làm tỉ lệ
  phồng 1,79×; slot 0,28 fps làm tỉ lệ sụp 0,26×). Gap-mean
  hiện chỉ 2/3 PASS và lệch chiều draw-fps nên vẫn chưa có
  metric thay thế sẵn.
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5/Q7 (cần
  n≥10 lần yên để CI chế độ yên có nghĩa; 30fps hiện n=4,
  60fps n=0). R6 là đợt thứ 5 liên tiếp không đo được lần yên
  nào trong giờ vòng lặp — chờ đợi này có thể kéo dài vô hạn
  nếu vòng lặp vẫn chạy 8–10 luồng song song; cần quyết định
  vận hành (đo ngoài giờ vòng lặp hoặc tắt bớt sibling), không
  phải lý do giữ G1 mở vô hạn — nhưng đó là quyết định của
  parent/user, không phải của R6.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 82% mà
  bỏ qua chân yên; đóng theo một cửa sổ 5 lần đơn lẻ; trích
  1,26×/1,58× của R6 như tốc độ deint (số của sóng tải); trích
  median pool 0,940× mà không kèm chế độ đo và điều kiện tải.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa harness E1 (try/finally toàn main, vite pipe + đuôi log bộ nhớ, chẩn đoán EPERM-vs-port, slot đóng băng) | `node --check` OK; 1 lần E1 đầy đủ 10/10 PASS qua harness mới (xem §3.1) |
| Sửa verdict script K3 (frozenSlots, printVerdict, ghi summary bọc try/catch, dispatch bọc try/catch) | `node --check` OK; `analyze` trên dữ liệu Q7 tái hiện đúng số đã công bố + hiện slot đóng băng Q7-run2 (slot 7) |
| `node --test deint-fps-verdict-83k3.test.mjs` | **12/12** (11 cũ + 1 mới đếm slot đóng băng) |
| Gộp pool tính lại (`analyze-pool90r6.py`) | khớp số Q7/N5 đã công bố (pool 30 n=27, pool 60 n=8); 60fps R6 tính lại từ fpsSlots khớp ratioMean đã ghi (1,13 / 0,81 / 1,26); frozenSlots E1 trong report khớp tính lại |
| Cửa sổ R6 60fps ×3 headed (probe N10) | **3/3 hoàn thành, 3/3 PASS** (1,13 / 0,81 / 1,26), 4/4 cases mỗi lần |
| Headed H9/C3 (mọi lần chạy R6) | **0 lỗi trang** (E1 10/10 + 60fps 4/4 ×3) |
| Pixel D1 60fps (R6) | MAD 0,3835 giống hệt nhau 3/3 lần, giống hệt N10 — tap áp thật |
| Pixel G2/G7a/G7b/G8 E1 verify | giống hệt N5/Q7 (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119) |
| Playhead 60fps R6 (33 slot) | 0,79–1,14×, không slot nào ≥1,3× — sạch, không teleport |
| Harness md5 trước–sau cửa sổ đo | `clicktest-77e1-deint-fps.mjs` 26b7d572…, `deint-fps-verdict-83k3.mjs` fcac097d…, test 7a49f9ad… — **không đổi** suốt lượt (chỉ sửa của R6 trước khi đo) |
| `preview.tsx` / `playheadPacing.ts` | không chạm (không sửa production) |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm |
| Không process mồ côi sau đo | không vite/chrome nào còn chạy; không listener :55xx/:96xx (15:11Z) |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — R6 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn.
2. **Pool 60fps vượt 80% đúng 1 lần PASS (9/11).** Thêm hay bớt
   1 lần PASS đều lật tỉ lệ gộp; đừng trích 82% như số chắc. Ba
   lần R6 làm pool vượt được đo dưới tải cực đoan nhất lịch sử
   60fps (baseline 0,75–1,03 fps) — số này không so được ngang
   hàng với các lần trước.
3. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→R6) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật. Ở baseline <1 fps, tỉ lệ còn mất ổn định
   số học nặng hơn cả mức Q7 ghi (lần 1: 0,26× và 1,89× cùng một
   lần; lần 3: slot baseline 0,00 fps).
4. **Cửa sổ R6 60fps chỉ 3 lần** (nhiệm vụ chỉ yêu cầu 3 lần đo
   thêm, không phải cửa sổ 5 lần đầy đủ). Không có verdict luật
   (b) riêng cho cửa sổ R6 — chỉ có cửa sổ trượt 5 lần mới nhất
   (5/5 PASS) và pool gộp n=11.
5. **Lần E1 verify 1,58× bị phồng bởi 1 slot** (slot 9: 8,40 fps
   kề baseline 0,97 fps → tỉ lệ 4,34×; trung vị 5 tỉ lệ chỉ
   0,86). Pool 30fps n=28 chỉ nên đọc kèm cảnh báo này; pool
   n=27 không đổi vẫn là số tham chiếu sạch hơn cho 30fps.
6. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác).
   Đừng trích chỉ một tiêu chí (CI đạt, tỉ lệ PASS không — nay
   cả hai đều đạt ở 60fps, nhưng xem mục 2).
7. **Luật median-5 lật 9/24 cửa sổ trượt 30fps.** Đừng trích
   verdict của một cửa sổ 5 lần đơn lẻ như kết luận chắc; luôn
   ghi kèm chế độ đo (baseline mean fps) và cửa sổ.
8. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích
   "combo 0,76×" như tốc độ combo.
9. **Gap-mean và draw-fps lệch chiều nhau** (L3: gap PASS 0,78,
   draw FAIL 0,72 cùng lần). Chưa có metric chuẩn duy nhất.
10. **Chẩn đoán EPERM-vs-port mới + bọc try/finally CHƯA được
    kích hoạt bằng 1 lần vite fail thật** trong lượt này (vite
    lên ngay lần 1 ở lần verify; không throw trước-try nào xảy
    ra) — chỉ kiểm tra cú pháp + review logic + test offline.
    Cần 1 lần fail thật (hoặc fault-injection) để chứng minh.
11. **Socket X `/tmp/.X11-unix/X180` còn lại sau lần E1 verify**
    (Xvfb bị SIGKILL trong killAll) — hành vi cũ, pickDisplay
    dọn ở lần chạy sau; không phải rò mới của R6.
12. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 8–10 luồng
    song song.** Tải sibling là biến số lớn nhất (load 1-phút
    1,67–15,52; RAM khả dụng 1,8–3,5 GB trong cửa sổ R6).
    Loadavg lúc bắt đầu KHÔNG dự báo được tải trong lúc đo
    (lần 60fps-2: bắt đầu 1,67 → kết thúc 15,13).

## 7. Nợ mở cho đợt sau

1. **G1 đóng hay chưa — QUYẾT ĐỊNH CỦA PARENT/USER** (xem §4).
   Nếu đóng một phần (chế độ tải, cả hai fixture), chân yên vẫn
   mở như hai mục con riêng (30fps n=4, 60fps n=0).
2. Chế độ yên cần thêm lần đo nếu chọn phương án C — đợt thứ 5
   liên tiếp không đo được lần yên nào trong giờ vòng lặp (cần
   quyết định vận hành: đo ngoài giờ vòng lặp hoặc tắt bớt
   sibling).
3. 60fps: mức vượt 80% chỉ đúng 1 lần PASS (9/11) — cần thêm
   lần đo để biên dày hơn, và cần ít nhất 1 lần ở baseline
   "sạch" hơn (≥2 fps) để tỉ lệ có nghĩa hơn các lần R6.
4. Harness: kích hoạt thử chẩn đoán EPERM-vs-port + bọc
   try/finally bằng 1 lần vite fail thật (hoặc fault-injection
   như test eperm-retry K8) — hiện chỉ kiểm tra cú pháp/review.
   Probe tick-time 78f1/79g1 vẫn còn chuỗi "cổng bị chiếm?" cũ
   — chưa sửa (ngoài phạm vi R6: chỉ E1 + verdict script).
5. Playhead teleport (M1 §3.2 / N10 §7.3): luồng riêng, đo A/B
   trước–sau — không thuộc R6.
6. EPERM: probe v2 DEAD/STALE (Q7 §3.1); cần quyết cron riêng 10
   phút (LIMITS gộp đợt 88 §3 mục 4 — parent KHÔNG tự tạo trong
   phiên nền, chờ user). R6 chỉ ghi nhận: không có dấu EPERM
   trong log 3 lần đo 60fps (grep 0 kết quả).
7. TTS / gate / vidstab / kernel / G1-G2 / WebKit / GPU-Safari:
   nợ của các luồng khác — không thuộc R6.

## 8. Cách chạy lại

```bash
# Đo 60fps 1 lần (probe N10, deint-only; đổi N10_LABEL mỗi lần):
N10_LABEL=60fps-deint-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round90-r6/60fps-deint-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Đo 30fps 1 lần E1 (harness mới; đổi E1_SCRATCH mỗi lần):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round90-r6/e1-verify-run1 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Gộp số (đọc report JSON đã có + số đã công bố, không cần headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round90-r6/analyze-pool90r6.py
# Verdict riêng 1 thư mục E1 (đọc headed-runN):
node apps/web/scripts/deint-fps-verdict-83k3.mjs analyze <dir>
# Test hồi quy luật median + slot đóng băng (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
```
