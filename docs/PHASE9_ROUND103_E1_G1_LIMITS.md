# Đợt 103 E1 — G1: thêm bằng chứng đo cho quyết định metric G5/M2 của user (KHÔNG TỰ ĐÓNG G1)

Ngày: 13/11/2026 (lượt cron 12:35 +07; đo 05:40–06:12Z).
Nợ: LIMITS gộp đợt 102 §4 mục 1 (G1 — user quyết metric G5 hay M2; D8 đợt 102:
khung tích lũy (c) 23–24/29 cắt ngang mốc — **lần yên tiếp theo là quyết định**).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; boot 9576eac3 suốt cửa sổ đo — **không reboot trong lúc đo**;
load 1-phút 0,74–16,73; RAM khả dụng 1266–4023 MB trong cửa sổ đo).

**Trạng thái cuối: CHỈ THU THẬP BẰNG CHỨNG — KHÔNG sửa production, KHÔNG đổi
ngưỡng (0,75×), KHÔNG đổi metric, KHÔNG tự đóng G1, KHÔNG tự kết luận khung
nào mới là khung đúng. Quyết định cuối thuộc parent/user (§7).**
Đo mới: E1 30fps ×9 + N10 60fps ×5 (14 lần, harness C8 + fault-injection của
D7 đã land — md5 không đổi cả cửa sổ đo, xem §3.4). Gộp vào pool v13 (30fps
n=100, 60fps n=64).
Không kiểm lại TTS 39. Không thử birefnet. Không đụng ci-security.yml.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

**Lần yên quyết định mà D8 chờ đã tới — và nó PASS dưới cả hai metric:**
E1 run1 (yên, baseline 23,19 fps): **G5 0,91× PASS, M2 0,91× PASS**.
Khung tích lũy (c) nay là **24–25/30 = 80,0%–83,3%** — **kịch bản xấu nhất
(I5-1 FAIL) đạt đúng mốc 80,0%** (trước đây 23–24/29, cắt ngang mốc). Đây là
lần đầu tiên khung tích lũy đứng ĐÚNG mốc ngay cả trong kịch bản xấu nhất.
Caveat: đúng mốc nghĩa là không có đệm — 1 lần yên FAIL nữa sẽ kéo kịch bản
xấu xuống 24/31 = 77,4% (xem §7 Q5 mới).

| Khung chân yên 30fps dưới M2 | Số | Đạt 16/20 (80%)? |
|---|---|---|
| **(a) Khung cố định 20 lần yên ĐẦU** (khung A9 dùng) | tối đa **15/20 = 75%** | **KHÔNG — kết luận A9/C7/D8 đứng vững** |
| **(b) Khung trượt 20 lần yên MỚI NHẤT** (khung C7 đề xuất) | **19/20 = 95%**, tính đủ, **0 mất dữ liệu** | **CÓ — vượt 16/20** |
| **(c) Tích lũy đầy đủ** (toàn bộ chân yên) | **24–25/30 = 80,0%–83,3%** | **CÓ — kịch bản xấu đúng mốc 80,0%** |
| **(d) Chỉ lần tính-lại-được** (loại 4 lần mất fpsSlots) | **24/26 = 92%** | CÓ — nhưng là số có lệch chọn mẫu (A9 đã cảnh báo) |
| **(e) Yên sạch** (loại lần bị gắn cờ slot-tải-đầu) | **22/24 = 92%** tính-lại-được | CÓ (tập con) — xem §2.2 |
| **(f) Trượt 10 lần yên mới nhất** (8/10 ≈ 16/20) | **10/10 = 100%**, tính đủ | **CÓ — vượt 8/10** |
| **(g) Kỷ nguyên hậu-A9** (đợt 99–103: A7/B7/C7/D8/E1) | **12/12 = 100%**, tính đủ | **CÓ — vượt 80%** |
| **(h) Nhạy biên phân loại** (ngưỡng yên ≥ 9 thay vì ≥ 10) | **không đổi** — 0 lần biên trong pool 30fps | **KHÔNG KIỂM ĐƯỢC** — biên chưa từng bị đo (xem §4) |
| **(i) Biên an toàn khung (b)** (mô phỏng FAIL liên tiếp) | chịu được **4 lần yên FAIL liên tiếp** (16/20); lần thứ 5 rơi xuống 15/20 | — (đệm tăng từ 3 lên 4, xem §4) |

- **Khung (a) không đổi dù đo thêm bao nhiêu lần nữa:** 5 lần FAIL đã chốt
  trong 20 lần đầu — tối đa 15/20 là trần cứng (như C7/D8).
- **Khung (b) giữ 19/20 sau khi thêm 1 lần yên mới của E1** (run1 M2 0,91
  PASS — cửa sổ trượt sang phải 1 bậc: X6-2 ra, E1-1 vào; chỉ còn 1 FAIL
  là X6 r6). Khung trượt vẫn là khung C7 ĐỀ XUẤT để user xem xét, KHÔNG
  phải khung đã được duyệt (§7 Q1).
- **Khung (c) — LẦN YÊN QUYẾT ĐỊNH ĐÃ TỚI (xem §4):** thêm 1 lần yên PASS
  (E1 run1) thì kịch bản xấu nhất (I5-1 FAIL) thành **24/30 = 80,0% đúng
  mốc**; kịch bản tốt nhất thành 25/30 = 83,3%. Khoảng bất định do I5-1
  vẫn còn đó vĩnh viễn — nhưng cả hai đầu khoảng nay đều ≥ 80%.
- **Khung (g) mở rộng: 12/12 PASS dưới cả hai metric** (thêm E1-1 vào
  11/11 của D8). Toàn bộ 5 lần FAIL chặn khung (a) vẫn đều thuộc kỷ
  nguyên TRƯỚC A9; kỷ nguyên hậu-A9 0 lần mất dữ liệu. E1 không kết
  luận "nên bỏ lần cũ" — chỉ ghi rõ: bất đồng giữa các khung hoàn toàn
  nằm ở việc **lần cũ có còn tính hay không**, không phải ở số đo mới
  (§7 Q6).
- **0 lần bất đồng mới:** 14/14 lần E1 đều đồng thuận G5/M2. Đồng thuận
  toàn lịch sử nay **126/132 (95,5%)**, vẫn đúng 6 lần bất đồng cũ
  của A9, 0 lần FAIL→PASS.
- **Quy luật "G5 ≥ 1,00 không bao giờ lật" MỞ RỘNG: nay 66 lần, 0 lần lật**
  (D8: 58 lần). G5 PASS trong [0,75; 1,00): 61 lần, 6 lần lật — cả 6
  đều là 6 ca cũ; tỉ lệ lật trong vùng 6/61 = 10%.
- **Chân yên 30fps dưới G5: n=30, PASS 26/30 (87%)**, median 0,945;
  chuỗi PASS yên liên tiếp nay là **24**.
- **Chân yên 60fps: 21/21 PASS (100%) dưới CẢ HAI metric**, tính đủ
  hoàn toàn (không mất dữ liệu), median M2 0,970, CI [0,936; 1,001].
- **E1 riêng: 14/14 lần PASS dưới cả hai metric** (E1 9/9, N10 5/5).
  Lần sát ngưỡng nhất: E1 run3 (G5 1,02 → M2 0,80) và E1 run8
  (G5 0,92 → M2 0,84) — đều giữ PASS.

## 2. Bảng quyết định — pool v13 (G5) + chân yên M2

Ngưỡng 0,75× giữ nguyên. Yên: baseline mean ≥ 10 fps (luật X6). Luật (b) =
median 5 lần ≥ 0,75 VÀ ≥4/5 lần ≥ 0,75. CI 95% của mean (t-Student).
Script: `hidden_files/round103-e1/analyze-pool103e1.py` (gộp pool) +
`analyze-m2-quiet103e1.py` (chân yên M2 + khung (a)–(i), kế thừa
parser A9/C7/D8). JSON gộp:
`benchmarks/results/g1-evidence-v13-103e1.json` (pool30 n=100, pool60 n=64).

### 2.1 Pool v13 dưới G5 (so với v12/D8)

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Đổi so với v12 |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ | 100 | 1,000 | 1,003 | 0,195 | [0,964; 1,042] | **91/100 (91%)** | +9 điểm n, +9 điểm PASS (82/91 = 90%) |
| 30fps — máy tải (<10, trừ hỗn hợp) | 65 | 1,030 | 1,040 | 0,216 | [0,987; 1,094] | 60/65 (92%) | +7 lần, +7 điểm PASS (53/58 = 91%) |
| 30fps — máy yên (≥10, trừ hỗn hợp) | 30 | **0,945** | **0,933** | 0,129 | **[0,885; 0,981]** | **26/30 (87%)** | +1 lần, +1 điểm PASS (25/29 = 86%) |
| 60fps fixture | 64 | 0,960 | 0,987 | 0,155 | [0,948; 1,026] | **61/64 (95%)** | +5 lần, +5 điểm PASS (56/59 = 95%) |
| 60fps — máy tải (<10) | 43 | 1,000 | 1,006 | 0,183 | [0,950; 1,062] | 40/43 (93%) | +4 lần, +4 điểm PASS (36/39 = 92%) |
| **60fps — máy yên (≥10)** | **21** | **0,950** | **0,947** | 0,051 | **[0,924; 0,970]** | **21/21 (100%)** | +1 lần, vẫn 100% |
| Cửa sổ 5 lần 30fps mới nhất (E1 r5–r9) | 5 | 0,99 | — | — | — | 5/5 | luật (b) PASS ỔN ĐỊNH |
| Cửa sổ 5 lần 60fps mới nhất (E1 r1–r5) | 5 | 1,15 | — | — | — | 5/5 | luật (b) PASS ỔN ĐỊNH |

### 2.2 Chân yên 30fps dưới M2 — các khung (§1)

| Khung | n | M2 PASS | Median M2 | Mean M2 | CI 95% | Ghi chú |
|---|---|---|---|---|---|---|
| (a) 20 lần yên đầu (cố định) | 20 | tối đa 15/20 (75%) | — | — | — | 5 FAIL đã chốt; trần cứng |
| (b) 20 lần yên mới nhất (trượt) | 20 | **19/20 (95%)** | 0,930 | 0,927 | [0,880; 0,975] | tính đủ, 0 mất dữ liệu; chỉ FAIL X6 r6 |
| (c) Tích lũy đầy đủ | 30 | **24–25/30 (80,0–83,3%)** | 0,945 | 0,928 | [0,880; 0,977] | khoảng do I5-1 chưa biết; **kịch bản xấu đúng mốc** |
| (d) Chỉ lần tính-lại-được | 26 | **24/26 (92%)** | 0,945 | 0,928 | [0,880; 0,977] | lệch chọn mẫu: loại đúng 3/4 lần xấu nhất |
| (e) Yên sạch (loại run bị gắn cờ slot-tải-đầu) | 28 | 22/24 (92%) tính-lại-được | 0,950 | 0,935 | [0,884; 0,987] | 2 lần bị gắn cờ: A7-7, D8-3 (E1 không có lần nào bị gắn cờ) |
| **(f) Trượt 10 lần yên mới nhất** | 10 | **10/10 (100%)** | 0,930 | 0,941 | [0,906; 0,976] | tính đủ; bản sạch (loại cờ) cũng 10/10 |
| **(g) Kỷ nguyên hậu-A9** (A7/B7/C7/D8/E1) | 12 | **12/12 (100%)** | 0,915 | 0,922 | [0,884; 0,961] | tính đủ; G5 cũng 12/12 |
| **(h) Yên "mở rộng" (ngưỡng ≥ 9)** | 30 | **24–25/30** (y hệt (c)) | — | — | — | 0 lần biên 9–10 fps trong pool 30fps |

### 2.3 Chân yên 60fps dưới M2 (tính đủ hoàn toàn)

| | n | M2 PASS | Median | Mean | CI 95% |
|---|---|---|---|---|---|
| Yên 60fps | 21 | **21/21 (100%)** | 0,970 | 0,969 | [0,936; 1,001] |

Không lần yên 60fps nào mất fpsSlots, không lần nào bị gắn cờ
slot-tải-đầu — đây là chân duy nhất không có khoảng bất định nào.

## 3. Cửa sổ đo mới E1 — chi tiết từng lần

### 3.1 E1 30fps ×9 — 05:40–06:03Z — 9/9 PASS cả hai metric, 1 lần 9/10

Lệnh (tuần tự): `E1_SCRATCH=hidden_files/round103-e1/e1-runN
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (harness C8 + land
fault-injection của D7, md5 không đổi cả cửa sổ đo — xem §3.4). Driver
dừng ở 9 lần thử, chỉ đủ 1/3 lần yên mục tiêu: **cửa sổ yên mở đúng
phút đầu rồi đóng** (run1 yên → run2 hỗn hợp → run3–9 tải; load 1-phút
lên tới 16,73 do 8–10 luồng đợt 103 chạy song song).

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | Baseline mean | 5–10 tỉ lệ drift-corrected | G5 | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 05:40–05:42 | 0,74 | 23,19 | 0,91 / 1,01 / 0,75 / 0,87 / 1,03 | **0,91×** | 0,91 | **PASS (yên — LẦN YÊN QUYẾT ĐỊNH)** |
| 2 | 05:42–05:45 | 3,16 | vòng 1: 9,72 / vòng 2: 25,45 | v1+v2 gộp: 0,87 / 0,91 / 0,57 / 0,35 / 1,15 / 0,64 / 0,82 / 0,93 / 1,00 / 0,92; **gộp 0,82** | **0,82×** | 0,89 | **PASS (HỖN HỢP — chỉ tính pool tổng)** |
| 3 | 05:45–05:47 | 1,34 | 5,15 | 0,80 / 1,72 / 1,07 / 0,78 / 0,74 | **1,02×** | 0,80 | **PASS (tải)** |
| 4 | 05:47–05:50 | 11,31 | 5,42 | 1,09 / 1,00 / 2,55 / 0,86 / 1,27 | **1,35×** | 1,09 | **PASS (tải)** |
| 5 | 05:50–05:52 | 10,32 | 4,77 | 1,06 / 0,66 / 1,27 / 0,93 / 1,49 | **1,08×** | 1,06 | **PASS (tải)** |
| 6 | 05:52–05:55 | 2,05 | 4,12 | 1,20 / 1,08 / 0,81 / 0,84 / 1,03 | **0,99×** | 1,03 | **PASS (tải)** |
| 7 | 05:55–05:57 | 16,73 | 4,25 | 1,44 / 1,35 / 1,73 / 1,19 / 0,97 | **1,34×** | 1,35 | **PASS (tải)** |
| 8 | 05:57–06:00 | 13,92 | 4,50 | 0,71 / 0,84 / 1,01 / 0,78 / 1,28 | **0,92×** | 0,84 | **PASS (tải) — nhưng harness 9/10 (G4 flake, xem §3.5)** |
| 9 | 06:00–06:03 | 1,89 | 3,27 | 1,13 / 0,34 / 1,27 / 1,24 / 0,99 | **0,99×** | 1,13 | **PASS (tải)** |

- **Run1 (0,91×) là lần yên quyết định mà D8 chờ:** 1 vòng duy nhất,
  5 tỉ lệ, không vòng 2 (mean 0,91 ≥ 0,9 — PASS chắc theo quy tắc
  98Z8, không rơi vùng xám). M2 = median 5 tỉ lệ = 0,91 PASS. Cả G5
  lẫn M2 đều PASS với biên 0,16 — không sát ngưỡng.
- **Run2 là lần hỗn hợp thứ năm trong lịch sử G1** (sau Z9 run5, C7
  run6, D8 run2, D8 run4) — và là lần đầu tiên vòng 1 tải → vòng 2
  yên (các lần trước đều yên → tải). Theo tiền lệ Z9/C7/D8: **chỉ tính
  vào pool tổng, KHÔNG tính vào chân yên lẫn chân tải**. Lưu ý: vòng 1
  của run2 có baseline 9,72 fps — giá trị gần biên 9–10 fps nhất từng
  quan sát trong một vòng đo — nhưng vì cả lần là hỗn hợp nên nó
  không tính là một lần biên cho khung (h) (§4).
- **Run3 (M2 0,80×) là lần sát ngưỡng nhất đợt này dưới M2:** tỉ lệ
  thấp nhất 0,74, median cứu PASS với biên 0,05. G5 1,02× phồng nhẹ
  do 1 tỉ lệ 1,72× — đừng trích 1,72× đơn lẻ.
- **Run4 (G5 1,35×) và run7 (G5 1,34×) là số phồng do tải** (baseline
  5,42 / 4,25 fps, tỉ lệ tới 2,55× / 1,73×) — đừng trích làm tốc độ
  deint.
- **Run9 (M2 1,13×) có tỉ lệ thấp nhất đợt 30fps: 0,34×** nhưng median
  cứu PASS — đúng kiểu M2 sinh ra để xử lý.
- **0 slot đóng băng trong cả 14 lần đo E1** (E1 ×9 + N10 ×5) — như
  X6/Z9/A7/B7/C7/D8; bước loại của M2 không bắn lần nào đợt này.
- **Pixel cả 9 lần giống hệt lịch sử:** G2 MAD 0,5821; G7a 0,6903;
  G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt N5→D8).
  **H9 0 lỗi trang cả 9 lần.** Không có dấu EPERM trong log 14 lần đo
  E1 (grep 0 kết quả).
- **Toggle Space: 220 lần toggle, 0 retry, 0 fallback, tất cả lật
  bằng Space.** Play >400ms: **0**; pause >400ms: **0**. Chậm nhất:
  play 370ms (run9), pause 392ms (run7) — đều dưới mốc 400ms của code
  cũ. Khác D8 (9 slot play >400ms, 1 slot 804ms): đợt này không có
  slot nào vượt mốc 400ms dù load cao tương tự.

### 3.2 60fps deint-only ×5 (probe N10) — 06:03–06:12Z — 5/5 PASS cả hai metric

Lệnh (tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round103-e1/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 06:03–06:05 | 12,23 | 7,83 fps | 1,40 / 0,77 / 2,12 / 0,40 / 1,08 | **1,15×** | 1,08 | PASS, 4/4 (tải) |
| 2 | 06:05–06:07 | 11,38 | 4,92 fps | 0,20 / 1,81 / 0,92 / 1,47 / 1,69 | **1,22×** | 1,47 | PASS, 4/4 (tải) |
| 3 | 06:07–06:09 | 3,60 | 6,60 fps | 1,12 / 1,76 / 0,72 / 1,14 / 2,41 | **1,43×** | 1,14 | PASS, 4/4 (tải) |
| 4 | 06:09–06:11 | 1,08 | 5,60 fps | 0,99 / 1,07 / 1,34 / 0,98 / 1,04 | **1,08×** | 1,04 | PASS, 4/4 (tải) |
| 5 | 06:11–06:12 | 7,02 | 14,24 fps | 0,79 / 0,84 / 1,11 / 0,94 / 1,12 | **0,96×** | 0,94 | PASS, 4/4 (yên) |

- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 5/5 lần và giống hệt
  M1/N10/R6/S6/T6/U6/V5/W6/X6/Z9/A7/B7/C7/D8 — deint áp thật trên
  fixture 60fps, đường code không đổi.
- **C3 0 lỗi trang cả 5 lần.** Không có dấu EPERM trong log 5 lần đo.
- **Run2 (M2 1,47×) có tỉ lệ thấp nhất đợt 60fps: 0,20×** nhưng median
  cứu PASS — đúng kiểu M2 sinh ra để xử lý. G5 1,22× phồng do tỉ lệ
  1,81×/1,69× dưới tải nặng (baseline 4,92 fps) — đừng trích làm tốc
  độ deint.
- **Run5 là lần yên 60fps duy nhất đợt này** (baseline 14,24 fps,
  G5 0,96 / M2 0,94 — lần yên 60fps sát ngưỡng nhất kể từ D8 run4
  G5 0,90 / M2 0,97, nhưng vẫn PASS cả hai với biên ≥ 0,19).
- Cửa sổ yên 60fps chỉ mở ở lần cuối (run5), ngược với E1 (yên chỉ
  lần đầu) — giống D8: hai fixture bắt cửa sổ yên ở hai đầu lượt
  khác nhau.

### 3.3 So sánh cửa sổ yên các đợt gần đây (điều kiện đo)

| Đợt | E1 yên (mục tiêu 3) | E1 hỗn hợp | Load 1-phút cao nhất trong cửa sổ E1 |
|---|---|---|---|
| B7 (100) | 3 (run7–9, cuối lượt) | 0 | ~8 |
| C7 (101) | 3 (run1–3, đầu lượt) | 1 (run6) | 13,06 |
| D8 (102) | 2 (run1 + run3-cờ), hết 9 lần thử | 2 (run2, run4) | 25,15 |
| **E1 (103)** | **1 (run1), hết 9 lần thử** | **1 (run2)** | **16,73** |

Cửa sổ yên đợt 103 ngắn nhất trong 4 đợt gần đây — chỉ mở đúng lần đo
đầu tiên (load 0,74 lúc bắt đầu, RAM khả dụng chỉ 1266 MB nhưng CPU
rảnh), rồi đóng ngay khi các luồng song song khởi động. Hệ quả cho đợt
sau: với 8–10 luồng song song, đừng kỳ vọng 3 lần yên/đợt; 1 lần yên
vẫn đủ để cập nhật mọi khung (như đợt này đã chứng minh), nhưng nếu
user muốn thêm mẫu yên nhanh thì cần đo vào lúc ít luồng song song
hơn, hoặc chấp nhận nhiều lần thử hơn 9.

### 3.4 Harness trong cửa sổ đo — ĐỔI SO VỚI D8 (land của D7), nhưng không đổi trong lúc đo

- `clicktest-77e1-deint-fps.mjs` md5 **4ba1d86c** (bản D7 đã land code
  fault-injection), `deint-fps-verdict.mjs` **57a4f6d8**,
  `probe-86n10-config-fps.mjs` **9ca985cd** (bản D7 đã land) —
  **không đổi trước/sau MỖI lần E1** (ghi trong runs.log) và không đổi
  cả cửa sổ N10. **Khác D8:** D8 đo bằng md5 E1 `d18e0465` / N10
  `3bc93119` (bản C8 trước khi D7 land). D7 land fault-injection vào
  file harness thật trong đợt 102, sau cửa sổ đo của D8 — nên số đo
  E1 đợt này chạy trên harness mới hơn D8 một bản land. Đường đo
  G5/M2 không đổi (cùng logic đo, chỉ thêm code fault-injection
  retry/fallback — và đợt này 0 retry/fallback bắn, xem §3.1 — nên số
  đo so sánh được trực tiếp với D8).
- **Không reboot trong cửa sổ đo** (boot-id 9576eac3 đầu và cuối lượt;
  uptime 13 phút lúc bắt đầu đo — boot ~05:26Z, trước khi lượt bắt
  đầu; reboot #27). Ghi cho luồng EPERM: không có khoảng mù mới nào
  mở trong cửa sổ E1.
- Không process mồ côi của E1 sau đo (0 vite/chrome nào dùng scratch
  round103-e1 còn chạy).

### 3.5 G4 flake ở E1 run8 — lần đầu tiên G4 FAIL trong lịch sử G1

E1 run8: harness 9/10, exit=1 — **FAIL G4 đối chứng progressive**:
R=0,48 (thỏa < 0,8) nhưng hook `deinterlaceTap=false`, `applied=[]`,
`hasEnhance=false` — tap deint không áp lên clip progressive ở bước
G4. 7 lần còn lại của E1 (run1–7, run9) đều PASS G4 (R=0,51,
tap=true). G2 cùng lần vẫn PASS (tap áp đúng trên clip interlaced,
MAD 0,5821), G3 PASS, G5 sau đó vẫn PASS 0,92×, G7a/G7b/G8 đều PASS
với tap=true — nên lỗi **cô lập ở bước bật lại deint sau G3 trong
lần này**, không phải hồi quy deint. Giả thuyết khả dĩ nhất: toggle
bật deint chưa kịp áp trước khi snapshot G4 dưới tải (load 13,92 lúc
bắt đầu lần 8). E1 không điều tra sâu (ngoài phạm vi G1) — ghi nhận
là flake đầu tiên của G4 (1/9 lần đợt này, 0/9 ở D8, 0 lần trong các
đợt trước), cần luồng harness theo dõi: nếu G4 FAIL lặp lại thì điều
tra thời gian áp enhance sau toggle.

**Số G5/M2 của run8 vẫn dùng được:** G5 0,92 / M2 0,84 tính từ
fpsSlots đầy đủ 11 slot (10/10 tỉ lệ hợp lệ, 0 slot đóng băng), cùng
cách tính như mọi lần khác; G4 là bước đối chứng pixel độc lập, không
chạm tới phép đo FPS. Run8 được tính vào pool tổng như một lần tải
bình thường, và ghi rõ harness 9/10 trong JSON gộp.

## 4. Quy luật G5 ≥ 1,00, khung mới (f)–(i), và lần yên quyết định

| G5 của lần PASS | A9 (n=69) | C7 (n=104) | D8 (n=118) | Nay (n=132, R6→E1) |
|---|---|---|---|---|
| G5 ≥ 1,00 | 36 lần, **0 lật** | 50 lần, 0 lật | 58 lần, 0 lật | **66 lần, 0 lật** |
| 0,90 ≤ G5 < 1,00 | 19 lần, 2 lật | 33 lần, 2 lật | 37 lần, 2 lật | 39 lần, 2 lật |
| 0,75 ≤ G5 < 0,90 | 10 lần, 4 lật | 16 lần, 4 lật | 18 lần, 4 lật | 22 lần, 4 lật |
| G5 PASS trong [0,75; 1,00) | 29 lần, 6 lật | 49 lần, 6 lật | 55 lần, 6 lật | **61 lần, 6 lật** |

- Quy luật A9 §5.2 đứng vững với mẫu lớn hơn: **không một lần G5 PASS
  nào có G5 ≥ 1,00 lật dưới M2 (0/66)**. 8 lần mới trong vùng này
  (E1: run3, run4, run5, run7 + N10 run1, run2, run3, run4) — tất cả
  giữ PASS.
- Tỉ lệ lật trong vùng [0,75; 1,00) giảm từ 6/55 (11%) xuống 6/61 (10%)
  — M2 "bắt PASS giả" ít dần khi mẫu mới toàn PASS, nhưng 6 ca cũ
  không biến mất.
- Lần sát ngưỡng nhất đợt này dưới M2: E1 run3 (0,80×) — G5 PASS
  trong [0,75; 1,00) và giữ PASS dưới M2 với biên 0,05. Nếu đo lại
  lần này, khả năng lật là có thật (không tính được xác suất từ 1 lần
  đo).

### Khung (f) — trượt 10 lần yên mới nhất: 10/10 PASS dưới M2

Thành phần: A7-8, B7-7, B7-8, B7-9, C7-1, C7-2, C7-3, D8-1, D8-3,
E1-1. Median M2 0,930, CI [0,906; 0,976]. Bản "sạch" (loại A7-7 và
D8-3 bị gắn cờ) cũng 10/10 PASS. Khung ngắn hơn (10 thay vì 20) nhưng
vẫn đạt mốc tương đương 80% — và không chứa lần FAIL nào trong 10 lần
gần nhất. Hạn chế: cửa sổ 10 lần nhạy hơn với 1–2 lần FAIL tương lai
(2 lần FAIL liên tiếp đã rơi xuống 8/10 đúng mốc; 3 lần FAIL là 7/10
dưới mốc) — E1 không trình bày khung này như khung chính thức, chỉ
như bằng chứng bổ sung.

### Khung (g) — kỷ nguyên hậu-A9: 12/12 PASS dưới M2

Thành phần: A7-1, A7-7, A7-8, B7-7, B7-8, B7-9, C7-1, C7-2, C7-3,
D8-1, D8-3, E1-1. Median M2 0,915, CI [0,884; 0,961]; dưới G5 cũng
12/12. 0 lần mất dữ liệu trong kỷ nguyên này. Ý nghĩa (chỉ phân tích,
không kết luận): toàn bộ 5 lần FAIL chặn khung (a) đều trước A9 — 3
lần mất fpsSlots (I5-1/J3-1/L3-1/L3-2, đợt ≤93) + U6 r2 (đợt 94) +
X6 r6 (đợt 96). Nếu user coi các lần trước A9 là "lỗi thời" thì mọi
khung đều đạt; nếu user giữ toàn bộ lịch sử thì khung (a) vẫn chặn.
Đây là quyết định về **tuổi thọ của bằng chứng**, không phải về số đo
(§7 Q6).

### Khung (h) — nhạy biên phân loại: KHÔNG KIỂM ĐƯỢC với pool 30fps

**0 lần** trong toàn bộ pool 30fps (n=100) có baseline trong [9, 10)
fps — khung "mở rộng" (ngưỡng ≥ 9) cho đúng số cũ 24–25/30. Biên
phân loại yên/tải ở 10 fps **chưa từng bị đo** với fixture 30fps.
Ngoại lệ đáng ghi (không tính): E1 run2 vòng 1 có baseline 9,72 fps
— giá trị gần biên nhất từng quan sát trong một vòng đo — nhưng cả
lần là hỗn hợp (vòng 2 yên 25,45 fps) nên không tính là một lần biên
theo luật phân loại theo lần. Với 60fps: chỉ có đúng 1 lần biên trong
lịch sử — C7 N10 run1 (baseline 9,71 fps, G5 0,99, M2 1,07 PASS, hiện
phân loại tải). Nếu đổi ngưỡng sang ≥ 9 thì chân yên 60fps thành
22/22 (vẫn 100%) — kết luận không đổi. Ghi nhận: muốn kiểm biên thật
thì đợt sau cần cố tình đo vào lúc baseline lanh quanh 9–10 fps (khó
chủ động — phụ thuộc load máy lúc đo).

### Khung (i) — biên an toàn của khung trượt-20

Mô phỏng k lần yên FAIL liên tiếp (cửa sổ trượt, lần cũ nhất bị đẩy
ra; X6 r6 là FAIL duy nhất trong cửa sổ nên 4 FAIL đầu đẩy cả FAIL
cũ ra): +1 → 18/20, +2 → 17/20, +3 → **16/20 (vẫn đạt)**, +4 →
**16/20 (vẫn đạt — X6 r6 bị đẩy ra khỏi cửa sổ ở lần thứ 4)**,
+5 → **15/20 (rơi dưới mốc)**, +6 → 14/20. Khung (b) có đệm
**4 lần FAIL liên tiếp** (tăng từ 3 ở D8, vì X6 r6 đã trôi gần mép
cửa sổ) — không mong manh (1 lần FAIL không đổi kết luận), nhưng
cũng không dày: 5 lần FAIL liên tiếp là đủ lật.

### Lần yên quyết định cho khung tích lũy (c) — ĐÃ TỚI, ĐÃ PASS

Tích lũy trước đợt: 23–24/29. **E1 run1 yên PASS → 24–25/30: kịch bản
xấu 24/30 = 80,0% đúng mốc; kịch bản tốt 25/30 = 83,3%.** Đây là lần
đầu tiên khung tích lũy đứng đúng mốc ngay cả trong kịch bản xấu
nhất. D8 đã dự báo đúng: lần yên tiếp theo là quyết định, và nó đã
quyết theo hướng PASS. E1 không tự đo thêm lần yên nữa trong đợt này
(driver đã thử hết 9 lần, cửa sổ yên đã đóng) — câu hỏi còn lại cho
user là mốc 80,0% đúng chóc có đủ không, hay cần đệm (§7 Q5 mới).
Lưu ý: 1 lần yên FAIL nữa sẽ kéo kịch bản xấu xuống 24/31 = 77,4%
(chỉ kịch bản tốt còn giữ 25/31 = 80,6%) — khung (c) vẫn mong manh ở
đầu dưới của khoảng.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ đo + phân tích |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** chạy lại xanh |
| `node --test deint-fps-verdict-100b7.test.mjs` | **13/13** chạy lại xanh |
| `node --check` 3 script đã dùng | **PASS** cả ba |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS/JS nào (chỉ thêm LIMITS + JSON số đo + file trong hidden_files), cùng tiền lệ A7/A9/C7/D8 |
| Tái tạo v12 (`analyze-pool103e1.py`) | **KHỚP đúng** số D8 đã công bố trước khi thêm lần mới (pool 30 n=91 PASS 82/91; pool 60 n=59 PASS 56/59) |
| G5/M2 tính lại từ `fpsSlots`/`g5Rounds` | **KHỚP** report cả 14 lần E1 (G5 khớp combinedMean/rMean/ratioMean ±0,01; M2 = median sau loại mẫu số < 0,5 fps — 0 lần có tỉ lệ bị loại; lần 2 vòng = median 10 tỉ lệ theo định nghĩa A9 §9.4) |
| M2 tính lại độc lập (`analyze-m2-quiet103e1.py`) | tái tạo đúng 6 lần lật của A9 + 118 lần R6→D8 trước khi thêm E1; đồng thuận 126/132 |
| Cửa sổ E1 E1 30fps ×9 headed | **9/9 hoàn thành, 9/9 PASS G5+M2, 0 abort, 0 `HARNESS LỖI`** — G5: 0,91 / 0,82 / 1,02 / 1,35 / 1,08 / 0,99 / 1,34 / 0,92 / 0,99; yên 1 / tải 7 / hỗn hợp 1; **run8 harness 9/10 (G4 flake, §3.5)** |
| Cửa sổ E1 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 4/4 mỗi lần, 5/5 PASS G5** (1,15 / 1,22 / 1,43 / 1,08 / 0,96), M2 5/5 PASS |
| Headed H9/C3 (mọi lần chạy E1) | **0 lỗi trang** (E1 10/10 ×9, 60fps 4/4 ×5) |
| Pixel D1 60fps (E1) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1→D8 — tap áp thật |
| Pixel G2/G7a/G7b/G8 E1 (cả 9 lần) | giống hệt N5→D8 (G2 MAD 0,5821 ×9; G7a MAD 0,6903; G7b MAD 0,0119; G8 R 0,55 → 0,52, MAD 1,5522) |
| Harness md5 trước/sau mỗi lần E1 | **không đổi trong từng lần và cả cửa sổ** (4ba1d86c / 57a4f6d8 / 9ca985cd) — nhưng KHÁC D8 (d18e0465 / 57a4f6d8 / 3bc93119) do D7 land fault-injection sau cửa sổ đo của D8 (§3.4) |
| Không process mồ côi của E1 sau đo | 0 vite/chrome nào dùng scratch round103-e1 còn chạy; boot-id 9576eac3 đầu = cuối, không reboot trong cửa sổ |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 VẪN MỞ — E1 không tự đóng, không đổi metric, không chọn khung.**
   Mọi câu hỏi ở §7 cần parent/user quyết. Đáp án "M2 có đạt 16/20
   không" đổi theo khung (§1) — đừng trích một khung mà không ghi tên
   khung đó. Điểm mới đợt này: khung (c) kịch bản xấu nay đúng mốc
   80,0% — nhưng đó là mốc đúng chóc, không đệm.
2. **Khung (b) trượt 20 lần mới nhất và khung (f)/(g) mới là khung D8/E1
   trình bày để xem xét, KHÔNG phải khung đã duyệt.** Khung gốc của
   G1 là tích lũy (14/18 → 16/20), khung A9 phân tích là cố định 20
   lần đầu. Đừng trình bày 19/20, 10/10 hay 12/12 như thể đó là khung
   chính thức.
3. **Khoảng 24–25/30 là vĩnh viễn:** M2 của I5-1 không bao giờ tính lại
   được (mất fpsSlots). Mọi kết luận về chân yên tích lũy dưới M2 đều
   phải mang khoảng này, không được chọn một đầu rồi trích như số chắc.
   Lần yên quyết định chỉ thu hẹp tương đối, không xóa được khoảng.
4. **Số "24/26 = 92% dưới M2" là số tập con có lệch chọn mẫu** (A9 §11
   mục 4): 4 lần mất dữ liệu là 3/4 FAIL. Số trung thực là khoảng
   24–25/30 (80,0–83,3%).
5. **Khung (a) 15/20 là trần cứng, không phải do thiếu mẫu:** 5 FAIL đã
   chốt trong 20 lần đầu. Đo thêm 100 lần yên nữa cũng không đổi khung
   này — chỉ đổi khung mới (trượt/tích lũy/hậu-A9) mới thay đổi đáp án.
6. **Khung (h) không kiểm được:** 0 lần biên 9–10 fps trong pool
   30fps. Đừng trích "đổi ngưỡng không đổi kết luận" như một kiểm
   chứng — đó là hệ quả của việc không có dữ liệu biên, không phải
   của độ ổn định. Vòng 1 của E1 run2 (9,72 fps) là lần gần biên nhất
   từng thấy nhưng thuộc lần hỗn hợp nên không tính.
7. **Median của 5 tỉ lệ là thống kê nhiễu:** M2 SD tăng ở N10 trong
   phân tích A9. Lần sát ngưỡng đợt này (M2 0,80× ở E1 run3) có thể
   lật nếu đo lại — đừng dùng M2 của 1 lần để kết luận; luôn dùng
   median-of-runs + CI + tỉ lệ PASS.
8. **Phân loại yên/tải theo baseline mean nhiễm nhiễu spike** (tiền lệ
   X6 run6; E1 run2 vòng 1 baseline 9,72 fps chỉ dưới ngưỡng 0,28).
   Các bảng dùng cùng định nghĩa này để so sánh được với lịch sử —
   đừng đọc "yên" như "mọi slot đều yên". Đợt này có 1 lần hỗn hợp —
   lần thứ năm trong lịch sử, và là lần đầu tiên vòng 1 tải → vòng 2
   yên (ngược hướng các lần trước).
9. **Lần hỗn hợp E1 run2 tính là 1 lần trong pool tổng** (G5 gộp
   0,82; M2 gộp 0,89 từ 10 tỉ lệ), theo phân loại của Z9 run5 / C7
   run6 / D8 run2/run4. Nếu parent tính khác (tính vòng yên như 1 mẫu
   yên) thì chân yên G5 thành 27/31 — kết luận không đổi, nhưng số
   phải ghi theo cách tính đã chọn.
10. **Cửa sổ yên đợt 103 ngắn nhất trong 4 đợt gần đây** (chỉ 1/9 lần
    E1 yên, mở đúng phút đầu rồi đóng; load 1-phút tới 16,73). Số đo
    chỉ đúng trên VM này (CPU-only, 4 vCPU, Chrome `--disable-gpu`,
    Xvfb) trong giờ vòng lặp 8–10 luồng song song. Không suy ra máy
    khác / máy có GPU / Safari thật.
11. **Đường retry/fallback của B7/D7 vẫn chưa bắn thật trong E1**
    (§3.1): 220 toggle, 0 retry, 0 fallback; caveat B7 §7 mục 1 vẫn
    đứng nguyên. Đợt này 0 slot vượt 400ms (khác D8: 9 slot, cao nhất
    804ms) — mốc 800ms của code cũ không bị chạm tới đợt này.
12. **G4 flake lần đầu tiên trong lịch sử G1** (E1 run8, §3.5): tap
    không áp lên clip progressive ở bước G4 (R vẫn thỏa 0,48 < 0,8).
    G5/M2 của run8 vẫn dùng được (FPS đo độc lập với G4). Cần theo
    dõi: nếu G4 FAIL lặp lại thì điều tra thời gian áp enhance sau
    toggle dưới tải.
13. **Harness đợt này mới hơn D8 một bản land** (D7 fault-injection,
    §3.4): md5 E1 4ba1d86c / N10 9ca985cd thay cho d18e0465 / 3bc93119
    của D8. Logic đo G5/M2 không đổi và 0 retry/fallback bắn trong
    cửa sổ E1, nên số đo so sánh được trực tiếp — nhưng khi trích
    md5 harness phải ghi đúng bản của từng đợt.
14. G1 (deint) vẫn mở, chờ user quyết (§7) — birefnet 0 lần thành công
    (chỉ thử lại khi RAM đổi); EPERM probe #22 + khoảng mù #21 (sau
    reboot #27 05:26:18Z 13/11 — E1 không mở khoảng mù mới);
    ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; WebKit clip
    D, pre-pass keyframes, motion blur + mask, trackgeq, fallback,
    harness O8.

## 7. Câu hỏi cho user — E1 chỉ hỏi, không tự trả lời

**Q1 — Khung 16/20 tính theo khung nào? (lặp lại từ C7/D8, nay có đáp
án mới cho khung (c))**
(a) Cố định 20 lần yên đầu: M2 tối đa 15/20 — KHÔNG BAO GIỜ đạt, dù đo
thêm bao nhiêu lần. (b) Trượt 20 lần yên mới nhất: M2 đang 19/20 — ĐÃ
ĐẠT, đệm 4 lần FAIL liên tiếp. (c) Tích lũy đầy đủ: M2 đang 24–25/30
— **kịch bản xấu nay đúng mốc 80,0%** (đã đạt, nhưng đúng chóc không
đệm). (f) Trượt 10 lần mới nhất: 10/10 — ĐÃ ĐẠT mốc tương đương. (g)
Kỷ nguyên hậu-A9: 12/12 — ĐÃ ĐẠT. E1 không chọn thay user: nếu user
giữ khung (a) thì đáp án là "M2 không đạt, giữ G5"; nếu user chấp
nhận (b), (c), (f) hoặc (g) thì đáp án đổi. **Đây là quyết định về
luật chơi, không phải về số đo.**

**Q2 — 4 lần yên cũ mất fpsSlots xử lý thế nào? (lặp lại từ C7/D8)**
Giữ nguyên khoảng 24–25/30 (trung thực nhất, nhưng không bao giờ cho
một số duy nhất); loại khỏi mẫu và trích 24/26 = 92% (đẹp nhưng lệch
chọn mẫu — A9 đã cảnh báo); hay ghi I5-1 là "không xác định" và hoãn
quyết định tích lũy? Lưu ý mới: khoảng nay đã thu hẹp về phía đạt
(cả hai đầu ≥ 80%), nên câu hỏi này ít gay gắt hơn trước — nhưng vẫn
chưa có số duy nhất.

**Q3 — Chọn G5 hay M2 làm chuẩn, và khi nào? (lặp lại từ C7/D8)**
Theo khuyến nghị A9: giữ G5 đến khi khung 16/20 khép rồi chuyển M2.
Khung (c) kịch bản xấu nay đã khép đúng mốc, khung (b)/(f)/(g) đã
khép vượt mốc — nên "khép" ở đây phải hiểu theo khung nào (Q1)? Nếu
user chọn M2 ngay: có chấp nhận định nghĩa lại khung (khung mới trên
lần có fpsSlots + 6 điều kiện A9 §9) không? Ngưỡng giữ nguyên 0,75×
trong mọi phương án (A9 §5.3).

**Q4 — Lần hỗn hợp E1 run2 (và Z9 run5, C7 run6, D8 run2/run4) có giữ
cách tính "chỉ pool tổng" không? (lặp lại từ C7/D8, nay có 5 lần/đợt
lịch sử)**
E1 giữ tiền lệ Z9. Nếu user muốn tính vòng yên của run2 như mẫu yên
thì chân yên G5 thành 27/31 (87,1%), chân yên M2 tính-lại-được thành
25/27 (92,6%) — kết luận không đổi, nhưng số khung đổi. Cần user xác
nhận cách tính trước khi đợt sau trích số. Lưu ý: run2 là lần hỗn hợp
đầu tiên có hướng tải → yên (ngược 4 lần trước), và vòng 1 của nó
(9,72 fps) là giá trị gần biên phân loại nhất từng thấy.

**Q5 (MỚI — thay Q5 cũ của D8, nay đã có đáp án) — Mốc 80,0% đúng
chóc của khung (c) có đủ không, hay cần đệm?**
Lần yên quyết định đã PASS: kịch bản xấu của khung (c) là 24/30 =
80,0% đúng mốc. Nhưng 1 lần yên FAIL nữa sẽ kéo kịch bản xấu xuống
24/31 = 77,4% (chỉ kịch bản tốt còn giữ 25/31 = 80,6%). User có muốn
(a) chấp nhận 80,0% đúng mốc là đủ để coi khung (c) đã khép, (b) chờ
thêm 1 lần yên PASS nữa để có đệm (kịch bản xấu 25/31 = 80,6%), hay
(c) coi khung (c) vẫn chưa khép vì thiếu đệm? Nếu chọn (b) thì đợt
104 nên ưu tiên E1 đầu lượt như đợt này.

**Q6 (lặp lại từ D8) — Các lần đo trước A9 có còn tính không?**
Khung (g) cho thấy kỷ nguyên hậu-A9 là 12/12 PASS dưới M2, trong khi
toàn bộ lần FAIL chặn khung (a) đều trước A9. User có muốn đặt "tuổi
thọ" cho bằng chứng (vd chỉ tính các lần từ đợt 99 trở đi), hay giữ
toàn bộ lịch sử? Nếu đặt tuổi thọ thì khung (a) cố định cũng đổi
thành phần — cần user định nghĩa lại khung cố định trên kỷ nguyên mới
(vd 20 lần yên đầu KỂ TỪ A7) thay vì E1 tự định nghĩa.

## 8. Cách chạy lại

```bash
# 1 lan E1 30fps bang harness C8 + land D7 (doi E1_SCRATCH moi lan; DO E1 TRUOC,
# ngay dau luot de bat cua so yen; dot 103 cua so yen chi mo phut dau — co the
# can toi 9 lan thu moi du 1 lan yen):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e1/e1-runX \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# 1 lan N10 60fps (probe C8 + land D7: ca hai chieu cho-trang-thai):
N10_LABEL=60fps-deint-runX N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e1/60fps-deint-runX \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Gop pool v13 + chan yen M2 + khung (a)-(i) (doc report JSON da co, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e1/analyze-pool103e1.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e1/analyze-m2-quiet103e1.py
# Test hoi quy luat median + M2 + luat phan loai slot-tai-dau (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs   # 17/17
node --test apps/web/scripts/deint-fps-verdict-100b7.test.mjs  # 13/13
```

## 9. File đã đổi/thêm (stage, không push)

- `docs/PHASE9_ROUND103_E1_G1_LIMITS.md` (file này).
- `benchmarks/results/g1-evidence-v13-103e1.json` (mới — pool v13:
  30fps n=100, 60fps n=64; kèm e1_e1/e1_60 với G5+M2 từng lần).
- Log + dữ liệu thô: `hidden_files/round103-e1/` (run-e1.sh,
  runs.log, driver-out.log, e1-run1..9 + log, 60fps-deint-run1..5 +
  log, analyze-pool103e1.py, analyze-m2-quiet103e1.py,
  pool103e1-analysis.json, m2-quiet103e1.json,
  pool103e1-analysis.log, m2-quiet103e1.log).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round103-e1-g1.txt`.
