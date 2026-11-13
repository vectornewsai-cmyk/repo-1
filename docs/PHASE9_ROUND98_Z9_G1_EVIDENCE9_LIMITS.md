# Đợt 98 Z9 — G1 evidence vòng 9 (KHÔNG TỰ ĐÓNG G1)

Ngày: 12/11/2026 (lượt cron 21:35 +07; đo 14:38:57–15:08:22Z).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot #20 ~13:24:41Z trước đợt 98 — boot-id
65bc5fb6-6d90-4de1-adba-775675a21086, uptime 1:13 lúc Z9 bắt đầu,
KHÔNG reboot trong cửa sổ đo; RAM khả dụng 470–4866 MB trong cửa sổ;
load 1-phút 0,47–15,84).
Nợ: LIMITS gộp đợt 97 §4 mục 9 + docs/PHASE9_ROUND96_X6_G1_EVIDENCE8_LIMITS.md.
Trạng thái G1 trước vòng: pool 30fps n=53 PASS 44/53 = 83% biên 2;
chân yên 30fps n=14 PASS 10/14 (71%), cần 6 PASS yên liên tiếp nữa
(16/20); pool 60fps n=37 PASS 35/37 (95%); metric M2 đã cài song song,
G5 vẫn là chuẩn chính thức; quy tắc verdict vùng 0,6–0,9 (Y9) mới là
khuyến nghị, chưa cài vào E1.

**Trạng thái cuối: G1 VẪN CHƯA ĐÓNG — Z9 chỉ đưa số + khuyến nghị,
quyết định cuối thuộc parent/user.** Chỉ đo, không sửa production,
không đổi ngưỡng, không đổi metric G5. Không i18n key mới. Không kiểm
lại TTS 39.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **Chân yên 30fps — TIẾN SÁT ĐÍCH: 4 mẫu yên mới, cả 4 đều PASS
  (0,93 / 0,92 / 0,99 / 0,94) → chân yên nay n=18: median 0,940×,
  mean 0,913, CI 95% [0,840; 0,986], PASS 14/18 (78%)** — từ 10/14
  (71%) lên 14/18. Cả ba tiêu chí chặt: median ≥ 0,75 ✓, CI cận dưới
  0,840 ≥ 0,75 ✓, PASS 78% < 80% ✗ — **vẫn 2/3, nhưng chỉ còn thiếu
  đúng 2 lần PASS yên liên tiếp nữa (16/20 = 80%)**, thay vì 6 như
  X6. Chuỗi PASS yên liên tiếp hiện tại: **12** (V5-2, V5-3, X6-1..6,
  Z9-1..4; lần FAIL yên gần nhất là U6-2, 0,67×).
- **CẢNH BÁO — cửa sổ yên đóng giữa chừng:** lần E1 thứ 5 (run5)
  bắt đầu yên (baseline 15,72 fps) nhưng mean lần 1 chỉ 0,89×, rơi
  vùng xám 0,6–0,9 → quy tắc 98Z8 đo thêm lần 2, lúc này máy đã tải
  (baseline 5,61 fps, load vọt 1,96 → 12,04). Verdict gộp 10 tỉ lệ
  1,08× PASS, nhưng đây là lần **HỖN HỢP** — không tính vào chân yên,
  không nối chuỗi yên. Nếu 1 trong 2 lần yên tới FAIL thì 16/20 trở
  nên không đạt được trong cửa sổ đó (tối đa 15/20 = 75%) và mục tiêu
  phải đặt lại khung.
- **60fps: 5/5 lần Z9 mới đều PASS dưới G5 — 1,12 / 1,04 / 1,31 /
  1,12 / 0,84 → pool 60fps nay n=42: median 0,985×, mean 0,990,
  CI 95% [0,941; 1,039], PASS 40/42 (95%)** — dày hơn X6 (35/37).
  Cửa sổ 5 lần 60fps mới nhất: median 1,120, 5/5 PASS → luật (b)
  PASS ỔN ĐỊNH **lần thứ tám liên tiếp** (R6, S6, T6, U6, V5, W6,
  X6, Z9). **Nhưng dưới M2, run5 lật FAIL (0,73×)** — lần G5/M2
  bất đồng thứ hai trong lịch sử sau X6 e1-run6.
- **30fps: 6 lần Z9 mới (5 đơn + 1 gộp), 6/6 PASS → pool n=59:
  median 0,990×, mean 0,980, CI 95% [0,923; 1,037], PASS 50/59
  (85%) — biên nay là 3 lần FAIL** (50/62 = 80,6% sau 3 FAIL nữa;
  FAIL thứ 4 → 50/63 = 79,4%). Pool đứng được cả khi bỏ lần hỗn
  hợp (49/58 = 84%) lẫn khi bỏ thêm cả hai lần phồng lịch sử
  (R6 1,58× + W6 1,82×: 47/56 = 84%).
- **Quy tắc verdict vùng 0,6–0,9 — ĐÃ CÀI + ĐÃ BẮN THẬT LẦN ĐẦU:**
  sibling Z8 cài vào E1 giữa cửa sổ đo (14:46:26Z); run5 là lần đầu
  tiên quy tắc này bắn ngoài đời (lần 1 0,89× vùng xám → lần 2
  1,26× → gộp 1,08× PASS). Z9 không cài quy tắc này — chỉ ghi nhận
  và phân loại hệ quả của nó.
- **Chân yên 60fps: không đổi (n=10, 10/10 PASS)** — cả 5 lần N10
  Z9 đều tải, không thêm mẫu yên 60fps nào.

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy
yên. CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round98-z9/analyze-pool98z9.py` (kế thừa
`analyze-pool96x6.py`, cùng công thức; script kiểm lại tái tạo đúng
số X6 đã công bố — pool 30 n=53 PASS 44/53, pool 60 n=37 PASS 35/37
— trước khi thêm lần Z9; JSON gộp:
`benchmarks/results/g1-evidence-v9-98z9.json`).

### 2.1 Từng cửa sổ 5 lần (luật b) — chỉ cửa sổ đổi so với X6

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| **Z9 60fps 5 mới nhất = cửa sổ Z9 riêng (đợt 98)** | **tải 5 / yên 0 (4,60; 6,66; 3,78; 6,00; 2,49)** | **1,12 / 1,04 / 1,31 / 1,12 / 0,84** | **1,120** | **5/5** | **PASS ỔN ĐỊNH** | **[0,875; 1,297]** |
| Z9 30fps 6 lần riêng | yên 4 / hỗn hợp 1 / tải 1 | 0,93 / 0,92 / 0,99 / 0,94 / 1,08 / 1,15 | 0,965 | 6/6 | — (n=6) | [0,903; 1,100] |

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5+Q7+R6+S6+T6+U6+V5+W6+X6+Z9) | 59 | 0,990 | 0,980 | 0,219 | [0,923; 1,037] | 50/59 (85%) | PASS ỔN ĐỊNH (biên 3 FAIL) |
| 30fps — máy tải (<10 fps, trừ hỗn hợp) | 40 | 1,030 | 1,007 | 0,241 | [0,931; 1,084] | 35/40 (88%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps, trừ hỗn hợp) | 18 | **0,940** | 0,913 | 0,155 | **[0,840; 0,986]** | **14/18 (78%)** | **2/3 tiêu chí (PASS chưa đạt)** |
| **60fps fixture (M1+N10+R6+S6+T6+U6+V5+W6+X6+Z9)** | **42** | **0,985** | **0,990** | **0,157** | **[0,941; 1,039]** | **40/42 (95%)** | **PASS ỔN ĐỊNH** |
| 60fps — máy tải (<10 fps) | 32 | 0,995 | 0,997 | 0,178 | [0,934; 1,060] | 30/32 (94%) | PASS ỔN ĐỊNH |
| **60fps — máy yên (≥10 fps)** | **10** | **0,970** | **0,967** | **0,054** | **[0,928; 1,006]** | **10/10 (100%)** | **PASS ỔN ĐỊNH (không đổi từ X6)** |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 101 | 0,990 | 0,984 | 0,195 | [0,945; 1,023] | 90/101 (89%) | trên ngưỡng |
| Z9 riêng 30fps (6 lần) | 6 | 0,965 | 1,002 | 0,091 | [0,887; 1,123] | 6/6 (100%) | — |
| Z9 riêng 60fps (5 lần) | 5 | 1,120 | 1,086 | 0,170 | [0,875; 1,297] | 5/5 (100%) | PASS ỔN ĐỊNH |

### 2.3 Tiêu chí nào đạt / chưa đạt (so với X6)

| Tiêu chí | X6 (n=53/37) | Z9 (n=59/42) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 0,990 ✓ | 0,990 ✓ | 0 |
| Pool 30fps PASS ≥ 80% | 44/53 = 83% ✓ (biên 2 FAIL) | **50/59 = 85% ✓ (biên 3 FAIL)** | **+2 điểm; biên dày thêm 1** |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,914 ✓ | 0,923 ✓ | +0,009 |
| 30fps tải n≥20: median + PASS + CI | 1,030 / 87% / 0,926 ✓✓✓ | **1,030 / 88% / 0,931 ✓✓✓** | cả ba đều nhích lên |
| 30fps yên: median + PASS + CI cận dưới | 0,955 / 71% / 0,803 (2/3) | **0,940 / 78% / 0,840 (2/3)** | **PASS +7 điểm; còn thiếu 2 lần yên PASS liên tiếp** |
| **60fps: median + PASS + CI** | **0,980 / 95% / 0,927 ✓✓✓** | **0,985 / 95% / 0,941 ✓✓✓** | **cả ba đều nhích lên** |
| 60fps cửa sổ 5 mới nhất luật (b) | median 0,99, 5/5 → PASS | median 1,12, 5/5 → PASS | giữ PASS lần 8 liên tiếp; lần thấp nhất 0,84 (trên 0,75) |
| **60fps yên** | **n=10, CI [0,928; 1,006], 10/10 PASS** | **n=10, không đổi** | **không mẫu yên mới** |
| Cửa sổ trượt 5 lần 30fps PASS | 36/49 | 42/55 | +6 cửa sổ PASS; **10 cửa sổ mới nhất đều PASS 5/5** |
| Pearson(ratio, baselineFps) 30fps | −0,281 (n=53) | −0,271 (n=59) | yếu đi nhẹ (hàm chế độ máy mờ dần) |

**Đọc bảng đúng:** chân yên 30fps tiến thật (4 mẫu mới, 4/4 PASS,
CI cận dưới 0,840) nhưng PASS mới 78% — đừng trích "yên sắp đạt"
mà không ghi còn thiếu đúng 2 lần và 1 lần FAIL yên sẽ phá khung
16/20. Pool 30fps 85% nay có biên 3 FAIL nhưng vẫn là pool gộp trộn
hai chế độ + 1 lần hỗn hợp, không phải verdict. 60fps dày lên ở mọi
chiều, nhưng lần thấp nhất của cửa sổ Z9 chỉ 0,84× và dưới M2 còn
0,73× FAIL — đừng trích median 1,12× như tốc độ deint.

## 3. Cửa sổ Z9 mới — chi tiết từng lần

### 3.1 E1 30fps ×6 — 14:38–15:08Z — 6/6 PASS (G5)

Lệnh (mỗi lần, tuần tự): `E1_SCRATCH=hidden_files/round98-z9/e1-runN
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (cổng :5580 /
debug :9680 / display :180, tự pick; fixture 30fps, 11 slot × 3s xen
kẽ; đo E1 TRƯỚC N10 để bắt cửa sổ yên đầu lượt — công thức X6).
**Bắt được 4 lần yên liên tiếp ngay đầu lượt (run1–4), rồi cửa sổ
yên đóng giữa run5.**

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | M2 | Kết quả |
|---|---|---|---|---|---|---|---|---|
| 1 | 14:38–14:41 | 2,18 | 491 MB | 17,64 fps | 0,63 / 1,05 / 0,97 / 1,19 / 0,82 | **0,93×** | 0,97 | **10/10 PASS (yên)** |
| 2 | 14:41–14:43 | 4,98 | 2146 MB | 23,78 fps | 0,82 / 0,96 / 1,02 / 0,97 / 0,82 | **0,92×** | 0,96 | **10/10 PASS (yên)** |
| 3 | 14:43–14:45 | 4,83 | 2043 MB | 22,66 fps | 1,13 / 0,94 / 0,82 / 0,97 / 1,10 | **0,99×** | 0,97 | **10/10 PASS (yên)** |
| 4 | 14:45–14:47 | 2,78 | 1958 MB | 13,13 fps | 0,78 / 0,82 / 1,15 / 1,04 / 0,89 | **0,94×** | 0,89 | **10/10 PASS (yên)** |
| 5 | 14:47–14:51 | 1,96 | 2330 MB | lần 1: 15,72 / lần 2: 5,61 fps | lần 1: 1,27 / 0,39 / 0,83 / 1,21 / 0,77 → 0,89; lần 2: 0,98 / 2,05 / 1,18 / 1,00 / 1,08 → 1,26; **gộp 1,08** | **1,08×** | 1,04 | **10/10 PASS (HỖN HỢP — xem §3.3)** |
| 6 | 15:06–15:08 | 6,49 | 4866 MB | 6,73 fps | 0,93 / 1,76 / 0,59 / 1,29 / 1,20 | **1,15×** | 1,20 | **10/10 PASS (tải)** |

| Lần | Slot draw fps (B/D xen kẽ, slot 0–10) | Slot đóng băng |
|---|---|---|
| 1 | 13,98 / 9,95 / 17,59 / 20,95 / 22,23 / 17,89 / 14,61 / 25,16 / 27,74 / 15,35 / 9,72 | không |
| 2 | 24,17 / 19,97 / 24,25 / 23,17 / 24,25 / 23,45 / 21,57 / 21,11 / 21,92 / 19,76 / 26,50 | không |
| 3 | 19,94 / 24,12 / 22,60 / 22,28 / 24,90 / 20,57 / 25,26 / 22,98 / 22,34 / 23,85 / 20,89 | không |
| 4 | 6,47 / 5,85 / 8,61 / 7,52 / 9,65 / 9,29 / 6,56 / 15,65 / 23,46 / 21,11 / 24,05 | không |
| 5 lần 1 | 24,78 / 19,46 / 5,97 / 5,46 / 22,22 / 14,18 / 12,02 / 21,35 / 23,26 / 11,28 / 6,09 | không |
| 5 lần 2 | 4,13 / 4,95 / 5,94 / 11,68 / 5,43 / 7,57 / 7,36 / 7,47 / 7,57 / 5,81 / 3,22 | không |
| 6 | 20,36 / 12,13 / 5,86 / 9,96 / 5,48 / 2,49 / 2,92 / 3,75 / 2,91 / 3,46 / 2,84 | không |

- **Run2 (0,92×) là lần yên sạch nhất đợt này:** tỉ lệ 0,82–1,02
  (biên hẹp nhất cửa sổ Z9), baseline 23,78 fps ổn định cả 11 slot
  (19,76–26,50 fps) — đối lập run4, slot baseline dao động
  6,47–24,05 fps trong cùng một lần "yên" (baseline mean 13,13).
  Phân loại yên/tải theo baseline mean vẫn nhiễm nhiễu slot — như
  X6 run6 đã ghi.
- **Run1 có tỉ lệ 0,63× đơn lẻ** (slot deint đầu chạy 9,95 fps)
  nhưng median 0,97 PASS — nhiễu slot tồn tại cả trên máy yên.
- **Run6 (1,15×):** slot draw sụp 20,36 → 2,84 fps giữa lần đo khi
  load vọt 5,2 → 12,3; tỉ lệ 1,76× đơn lẻ kéo mean lên, M2 1,20 vẫn
  PASS nhưng khiêm tốn hơn — ví dụ sống nữa cho vì sao cần M2.
- **Pixel cả 6 lần giống hệt lịch sử:** G2 MAD 0,5821; G7a 0,6903;
  G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt
  N5/Q7/R6/S6/T6/U6/V5/W6/X6). **H9 0 lỗi trang cả 6 lần.** Không có
  dấu EPERM trong log 6 lần đo (grep 0 kết quả).
- **0 slot đóng băng trong cả 11 lần đo Z9** (E1 ×6 + N10 ×5) —
  như X6, cửa sổ yên sạch là một phần nguyên nhân; ngay cả các lần
  tải nặng (baseline 2,49 fps) cũng không có slot < 0,5 fps.

### 3.2 60fps deint-only ×5 (probe N10) — 14:54–15:05Z — 5/5 PASS (G5)

Lệnh (mỗi lần, tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round98-z9/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 14:54–14:56 | 4,32 | 4,60 fps | 0,65 / 0,97 / 1,12 / 1,18 / 1,66 | **1,12×** | 1,12 | PASS, 4/4 (tải) |
| 2 | 14:56–14:58 | 1,13 | 6,66 fps | 1,13 / 0,91 / 1,16 / 0,98 / 1,02 | **1,04×** | 1,02 | PASS, 4/4 (tải) |
| 3 | 14:58–15:00 | 13,85 | 3,78 fps | 1,47 / 0,96 / 1,39 / 1,80 / 0,93 | **1,31×** | 1,39 | PASS, 4/4 (tải nặng) |
| 4 | 15:01–15:02 | 13,48 | 6,00 fps | 0,77 / 1,24 / 1,20 / 0,84 / 1,56 | **1,12×** | 1,20 | PASS, 4/4 (tải) |
| 5 | 15:02–15:05 | 2,18 | 2,49 fps | 0,26 / 0,73 / 0,48 / 0,84 / 1,88 | **0,84×** | **0,73 FAIL** | PASS G5 / **FAIL M2**, 4/4 (tải rất nặng) |

- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 5/5 lần và giống hệt
  M1/N10/R6/S6/T6/U6/V5/W6/X6 — deint áp thật trên fixture 60fps,
  đường code không đổi (kể cả run5 chạy sau sửa preview.tsx của
  sibling — xem §3.4).
- **C3 0 lỗi trang cả 5 lần.** Không có dấu EPERM trong log 5 lần
  đo (grep 0 kết quả).
- **Run3 (1,31×):** tỉ lệ 1,47×/1,80× đơn lẻ kéo mean lên dưới tải
  nặng — cùng mẫu phồng do tải như X6 run4 (2,25×). M2 1,39 vẫn
  PASS nhưng là số cao nhất cửa sổ, đừng trích làm tốc độ deint.
- **Run5 (G5 0,84× PASS nhưng M2 0,73× FAIL):** tỉ lệ trong một lần
  dao động 0,26–1,88 — lần N10 nhiễu nhất kể từ W6; 3/5 tỉ lệ dưới
  ngưỡng (0,26 / 0,73 / 0,48), mean chỉ được kéo lên bởi một slot
  1,88×. Đây là lần G5/M2 bất đồng thứ hai trong lịch sử (sau X6
  e1-run6 0,99 → 0,63) và là lần đầu bất đồng ở fixture 60fps.
  Dưới M2, pool 60fps cửa sổ Z9 là 4/5 PASS, pool 60fps gộp là
  39/42 — parent cần quyết metric trước khi trích số pool 60fps.
- **Run5 là lần 60fps thấp nhất kể từ W6 run5 (0,75×)** — nhưng
  vẫn trên ngưỡng G5 với biên 0,09.

### 3.3 Lần hỗn hợp run5 — lần đầu quy tắc vùng xám bắn thật

**Bối cảnh:** sibling Z8 cài quy tắc verdict Y9 §3 vào E1 lúc
14:46:26Z (giữa run4 của Z9) — xem §3.4. Run5 là lần đầu tiên quy
tắc này bắn ngoài đời (không phải fault-injection).

**Diễn biến:** lần 1 bắt đầu lúc load 1,96, baseline mean 15,72 fps
(yên), nhưng slot baseline dao động 5,46–24,78 fps: hai slot baseline
sụp (5,97 / 5,46 fps) làm tỉ lệ slot 2 và 4 vọt 1,27× / 1,21×, trong
khi slot deint 5,46 fps làm tỉ lệ slot 1 chỉ 0,39×. Mean lần 1
0,89× — trong vùng xám 0,6–0,9, **không quyết được**. Script tự đo
thêm lần 2 (11 slot nữa): lúc này load đã vọt 12,04, baseline mean
5,61 fps (tải), mean lần 2 1,26×. Verdict gộp 10 tỉ lệ: mean 1,08×,
median 1,04× → **PASS**.

**Phân loại (quyết định của Z9, ghi rõ để parent kiểm):**
- Pool tổng 30fps: tính là **1 PASS** (verdict duy nhất của script
  là verdict gộp) — pool 50/59.
- Chân yên: **KHÔNG tính** — verdict không quyết được bằng dữ liệu
  yên đơn thuần (lần 1 yên chỉ cho 0,89× vùng xám; lần quyết định
  chạy dưới tải). Chân yên giữ 14/18.
- Chân tải: **KHÔNG tính** — một nửa dữ liệu là yên.
- Chuỗi PASS yên liên tiếp: **KHÔNG nối** (giữ 12), cũng **KHÔNG
  reset về 0** — run5 không phải lần FAIL yên; chuỗi chỉ đếm các
  lần yên thuần. Lần yên thuần tiếp theo PASS sẽ là lần thứ 13.
- M2 lần 1 = 0,83× (PASS — median cứu được lần này, khác X6 run6);
  M2 gộp 10 tỉ lệ = 1,04× PASS. Dưới cả hai metric, run5 đều PASS
  — bất đồng ở đây là về **phân loại chế độ**, không phải verdict.

**Bài học:** cửa sổ yên đóng nhanh hơn X6 tưởng — X6 mất ~12 phút
(run1–6 yên, run7 tải); Z9 chỉ giữ được ~9 phút (run1–4 yên, run5
đã hỗn hợp). Đo E1 ngay đầu lượt vẫn là công thức đúng, nhưng mỗi
lượt chỉ có ~4 lần yên chắc chắn, không phải 6 — muốn 6 mẫu yên
liên tiếp cần ít nhất 2 lượt yên liên tiếp, hoặc đo E1 ngay sau
reboot trước khi sibling dậy (lượt này Z9 bắt đầu 73 phút sau
reboot #20, không phải ngay sau reboot).

### 3.4 Nhiễu giữa cửa sổ: sibling sửa `preview.tsx` + E1 giữa lúc đo

Kỷ luật mtime trước/sau (14:38:50Z → 15:11:40Z):

- **`preview.tsx` đổi 2 lần giữa cửa sổ đo** (12:02:15Z →
  14:49:01Z → 14:57:21Z): sibling Z2 (marker "Đợt 98 Z2" ×10), Z3
  (×7), Z6 (×5) sửa trong lúc Z9 đo. E1 run1–5 + N10 run1–4 mount
  trước sửa 14:57:21Z; N10 run5 mount ~15:03:45Z, sau sửa đó.
- **`clicktest-77e1-deint-fps.mjs` đổi 2 lần** (11:41:04Z →
  14:46:26Z → 15:04:15Z): sibling Z8 — lần 1 cài quy tắc verdict
  vùng 0,6–0,9 (Y9 §3), lần 2 sửa vòng `/json/list` theo slot 5 s
  + deadline 60 s. E1 run1–4 chạy code trước Z8 (process Node load
  script lúc start); run5 chạy code sau sửa 1; run6 chạy code sau
  sửa 2.
- **Vì sao không ảnh hưởng số deint:** (1) sửa Z8 chỉ đổi đường
  verdict + vòng CDP list, không đổi đường đo slot/tỉ lệ/pixel —
  bằng chứng: pixel G2/G7a/G7b/G8 giống hệt lịch sử cả 6 lần E1,
  tỉ lệ tính lại từ `fpsSlots` trong JSON khớp log cả 6 lần
  (script gộp: KHOP); (2) sửa Z2/Z3/Z6 trên `preview.tsx` không đổi
  đường deint — bằng chứng: D1 MAD 0,3835 giống hệt 5/5 lần N10
  (cả trước và sau sửa 14:57:21Z), pixel E1 giống hệt 6/6 lần.
  **Giữ cả 11 lần trong pool, ghi rõ phiên bản code từng lần**
  (xem JSON `runs_60fps_n10[].code_version` + §3.1/3.2).
- Bài học lặp lại từ X6 §3.4: vòng lặp song song sửa cùng file là
  rủi ro thường trực — đợt sau nên khóa/ghi mtime file phụ thuộc
  trước/sau MỖI lần đo (Z9 chỉ ghi trước/sau cả cửa sổ), hoặc đo
  xong mới cho sibling sửa file chung.

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của Z9: KHÔNG đóng G1 toàn vẹn. Phương án A (đóng một
phần) nay MẠNH HƠN X6 ở chân yên 30fps (78%, còn thiếu 2) nhưng vẫn
CHƯA đủ điều kiện. Quyết định cuối thuộc parent/user.**

- **Phương án A — Đóng một phần: deint ĐẠT ở chế độ tải, cả 30fps
  lẫn 60fps + chân yên 60fps (ĐỀ XUẤT XEM XÉT, có điều kiện — như
  X6, cập nhật số):** 30fps-tải n=40: median 1,030×, mean 1,007,
  CI cận dưới 0,931, 35/40 PASS = 88%; 60fps-tải n=32: median
  0,995×, mean 0,997, CI cận dưới 0,934, 30/32 PASS = 94%;
  **60fps-yên n=10: median 0,970×, mean 0,967, CI [0,928; 1,006],
  10/10 PASS = 100% — cả ba tiêu chí chặt vẫn đạt**; cửa sổ 5 lần
  60fps mới nhất PASS luật (b) **lần thứ tám liên tiếp**, median
  1,12 (toàn tải, nhưng 5/5 PASS).
  - Điều kiện đóng (bắt buộc ghi kèm): (i) verdict "PASS" chỉ đúng
    ở chế độ tải / máy yếu + chân yên 60fps; chân yên 30fps vẫn
    CHƯA đạt đủ tiêu chí (PASS 14/18 = 78%, CI cận dưới 0,840 đã
    đạt, median 0,940 đã đạt — **2/3, thiếu mỗi PASS ≥80%**) —
    không được gộp vào verdict đóng; (ii) không trích số pool gộp
    (0,985× / 95% ở 60fps; 0,990× / 85% ở 30fps) như verdict duy
    nhất — pool gộp trộn hai chế độ (+ 1 lần hỗn hợp ở 30fps) nên
    không có nghĩa; (iii) **pool 30fps nay biên 3 FAIL (50/59 =
    85%)**; (iv) **chân yên 30fps cần 2 lần PASS yên liên tiếp nữa
    (16/20 = 80%)** — và 1 lần FAIL yên sẽ phá khung 16/20 (tối đa
    15/20 = 75%), mục tiêu phải đặt lại; (v) **dưới metric M2, lần
    N10 run5 lật thành FAIL (0,84 → 0,73)** — đừng trích "60fps
    5/5 PASS" mà không ghi tên metric; dưới M2 cửa sổ Z9 60fps là
    4/5; (vi) cửa sổ trượt 30fps mới nhất (55–59) PASS 5/5
    (median 0,99) — 10 cửa sổ mới nhất đều PASS, nhưng luật (b)
    trên cửa sổ 5 lần không phải verdict pool.
  - Vì sao Z9 không đề xuất đóng toàn vẹn: (1) chân yên 30fps vẫn
    thiếu 1/3 tiêu chí chặt (PASS 78% < 80%), chỉ còn thiếu 2 lần
    nhưng 2 lần đó phải liên tiếp và cửa sổ yên mỗi lượt chỉ mở
    ~9 phút (~4 lần); (2) lần hỗn hợp run5 cho thấy phân loại
    yên/tải theo baseline mean không còn đủ khi tải đổi giữa lần
    đo — cần quy tắc phân loại lần 2 vòng (ghi rõ parent đã chọn
    cách tính run5 vào đâu); (3) nhiễu slot vẫn lớn ngay cả trên
    máy yên (run4: 6,47–24,05 fps trong một lần; run5 lần 1:
    0,39–1,27 trong một lần); (4) metric tỉ lệ FPS vẫn là hàm của
    chế độ máy (Pearson −0,271) — nay có thêm 1 lần G5/M2 bất đồng
    ở fixture 60fps, parent chưa chọn metric nào làm chuẩn.
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5/Q7/R6/S6/T6/U6/V5/W6/X6.
  Z9 làm phương án này THÊM BẰNG CHỨNG: M2 nay có thêm 11 lần đo
  (E1 6/6 PASS cả hai metric; N10 4/5 PASS dưới M2). Đề xuất: từ
  đợt sau ghi cả G5 và M2 mỗi lần (Z9 đã làm); parent quyết có thay
  G5 bằng M2 trong pool hay không (lưu ý: pool đầy đủ không tính
  lại được dưới M2 với các lần cũ mất fpsSlots; và lần hỗn hợp run5
  cho thấy M2 gộp 10 tỉ lệ cần định nghĩa rõ).
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5/Q7/R6/S6/T6/U6/V5/W6/X6.
  Z9 chứng minh phương án này KHẢ THI NHƯNG CHẬM HƠN TƯỞNG: đo E1
  ngay đầu lượt lấy được 4/6 lần yên (X6: 6/7). Công thức lặp lại
  được, nhưng cần ít nhất 2 lượt yên liên tiếp nữa (mỗi lượt ~4
  mẫu yên chắc) mới đủ 2 lần còn thiếu — và lần hỗn hợp run5 cho
  thấy không phải lượt nào cũng cho mẫu yên sạch.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 95%/85% mà
  bỏ qua chân yên 30fps; trích pool 30fps "85%" như số chắc (biên
  chỉ 3 FAIL, trong đó có 1 lần hỗn hợp); trích "yên 4/4 PASS" mà
  không ghi lần thứ 5 là hỗn hợp; trích median yên 30fps 0,940 như
  số chắc (n=18 vẫn nhỏ, PASS mới 78%); trích 1,31× của N10 run3
  hay 1,15× của E1 run6 như tốc độ deint (M2 của hai lần này là
  1,39× / 1,20× — vẫn cao do tải, không phải tốc độ thật); trích
  "5 lần 60fps đều PASS" mà không ghi lần thấp nhất chỉ 0,84× và
  M2 lật 1 lần thành FAIL.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ đo (sửa `preview.tsx`/`clicktest-*.mjs` là của sibling Z2/Z3/Z6/Z8 — xem §3.4) |
| `node --test vite-diagnosis-regex-92t6.test.mjs` | **9/9** chạy lại xanh |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** chạy lại xanh |
| `node --check` 3 script đã dùng | **PASS** cả ba |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm (chỉ thêm LIMITS + JSON số đo + file trong hidden_files), cùng tiền lệ U6/V5/W6/X6 |
| Cửa sổ Z9 E1 30fps ×6 headed | run1–6 **10/10** (0,93 / 0,92 / 0,99 / 0,94 / 1,08 gộp / 1,15; yên 4 / hỗn hợp 1 / tải 1) |
| Cửa sổ Z9 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 5/5 PASS G5** (1,12 / 1,04 / 1,31 / 1,12 / 0,84), 4/4 cases mỗi lần; M2 4/5 |
| Gộp pool tính lại (`analyze-pool98z9.py`) | tái tạo đúng số X6 đã công bố khi chạy trên pool cũ (pool 30 n=53 PASS 44/53, pool 60 n=37 PASS 35/37) trước khi thêm lần Z9; 11 lần Z9 mới tính lại từ fpsSlots khớp G5/ratioMean đã ghi; frozenSlots khớp tính lại cả 6 lần E1 |
| M2 tính lại (`analyze-pool98z9.py`) | 11 lần Z9: E1 6/6 PASS (0,97 / 0,96 / 0,97 / 0,89 / 1,04 gộp / 1,20); N10 4/5 PASS (1,12 / 1,02 / 1,39 / 1,20 / 0,73 FAIL) |
| Headed H9/C3 (mọi lần chạy Z9) | **0 lỗi trang** (E1 10/10 ×6, 60fps 4/4 ×5) |
| Pixel D1 60fps (Z9) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1/N10/R6/S6/T6/U6/V5/W6/X6 — tap áp thật; giống hệt cả trước/sau sửa preview.tsx của sibling |
| Pixel G2/G7a/G7b/G8 E1 (cả 6 lần) | giống hệt N5/Q7/R6/S6/T6/U6/V5/W6/X6 (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522) |
| `preview.tsx` / `deint-fps-verdict-83k3.mjs` / `probe-86n10-config-fps.mjs` | Z9 không chạm; sibling Z2/Z3/Z6 sửa `preview.tsx` 2 lần, Z8 sửa E1 2 lần — xem §3.4 (không ảnh hưởng số deint) |
| Không process mồ côi của Z9 sau đo | không vite/chrome nào dùng scratch round98-z9 còn chạy; boot-id không đổi 65bc5fb6, không reboot trong cửa sổ đo |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — Z9 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn.
2. **Pool 30fps 85% (50/59) — biên 3 FAIL.** Thêm 3 FAIL nữa là về
   50/62 = 80,6%; FAIL thứ 4 là rơi dưới 80% (50/63 = 79,4%).
   Đừng trích 85% như số chắc — và đừng trích mà không ghi đây là
   pool gộp trộn hai chế độ + 1 lần hỗn hợp.
3. **Chân yên 30fps tiến thật nhưng chưa đạt: n=18, median 0,940,
   PASS 14/18 (78%), CI cận dưới 0,840 — 2/3 tiêu chí.** Cần 2 lần
   PASS yên liên tiếp nữa (16/20 = 80%). Chuỗi PASS yên liên tiếp
   hiện tại là 12 — nhưng 1 lần FAIL yên sẽ phá khung 16/20.
4. **Lần hỗn hợp run5 — phân loại do Z9 quyết, parent kiểm lại:**
   tính 1 PASS vào pool tổng, không tính vào chân yên/tải, không
   nối chuỗi yên. Nếu parent muốn tính khác (vd tính vào tải theo
   lần 2, hay loại khỏi pool) thì pool 30fps đổi thành 49/58 =
   84% (loại) hoặc tải thành 36/41 = 88% (tính vào tải) — kết luận
   không đổi, nhưng số chân yên/tải phải ghi theo cách tính đã
   chọn.
5. **M2 lật 1/11 verdict đợt này (N10 run5: 0,84 → 0,73).** M2 chặt
   hơn G5 — và đó là chủ đích. Pool đầy đủ KHÔNG tính lại được dưới
   M2 (các lần I5–Q7/M1/N10-đầu mất fpsSlots). Đừng trích "M2 pool"
   như số pool đầy đủ.
6. **Nhiễu slot vẫn lớn ngay cả trên máy yên:** Z9 run4 tỉ lệ
   0,78–1,15 trong một lần, slot baseline 6,47–24,05 fps; run5 lần
   1 tỉ lệ 0,39–1,27. Baseline mean ≥10 fps ("máy yên") không có
   nghĩa từng slot yên. Đừng trích một lần đo đơn lẻ (vd 1,31×)
   như tốc độ deint.
7. **Pool 60fps 95% (40/42) dày hơn** nhưng 2 lần FAIL trong pool
   đều là lần cũ (M1 run4 0,62×, M1 run5 0,73×); 5 lần Z9 đều PASS
   G5 nhưng lần thấp nhất chỉ 0,84× và M2 lật 1 lần. Chân yên 60fps
   n=10 vẫn nhỏ, không thêm mẫu mới đợt này. Không dùng 10 điểm
   này để nói "deint ngang baseline trên mọi máy nhanh".
8. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→Z9) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật. Bằng chứng mạnh nhất đợt này: cùng một lần
   N10 run5 chứa cả 0,26× và 1,88×.
9. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác).
   Đừng trích chỉ một tiêu chí (CI đạt, tỉ lệ PASS không).
10. **Luật median-5 lật 13/55 cửa sổ trượt 30fps** (42/55 PASS).
    Đừng trích verdict của một cửa sổ 5 lần đơn lẻ như kết luận chắc;
    luôn ghi kèm chế độ đo (baseline mean fps) và cửa sổ. 10 cửa sổ
    mới nhất (46–50 → 55–59) đều PASS 5/5.
11. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích
    "combo 0,76×" như tốc độ combo.
12. **e1-run1 của T6 và W6 vẫn giữ trong pool** theo quyết định parent
    đợt 92 (đã chấp nhận, 0 EPERM trong mọi log) — Z9 không loại,
    không tranh luận lại, và ghi rõ độ nhạy thay vì loại. Lưu ý:
    pool nay đứng được cả khi loại cả hai lần phồng + lần hỗn hợp
    (47/56 = 84%).
13. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 9–10 luồng song
    song.** Tải sibling là biến số lớn nhất (load 1-phút 0,47–15,84;
    RAM khả dụng 0,47–4,87 GB trong cửa sổ Z9). Loadavg lúc bắt đầu
    KHÔNG dự báo được tải trong lúc đo (run5 bắt đầu 1,96 nhưng
    load vọt 12,04 giữa lần đo). Cửa sổ yên chỉ mở ~9 phút đầu lượt
    đợt này (X6: ~12 phút).
14. **Không có sóng EPERM hay port-conflict thật nào trong cửa sổ Z9
    (0 dấu EPERM trong 11 log đo).** Sóng thật gần nhất vẫn
    ~11:55–12:11Z (R7); EPERM KHÔNG tuyên bố đã hết.
15. **Quy tắc verdict vùng 0,6–0,9 nay đã cài vào E1 (Z8) nhưng
    chưa cài vào G5/pool:** lần hỗn hợp run5 cho thấy cần quy tắc
    phân loại lần 2 vòng (lần gộp tính vào chế độ nào) trước khi
    trích số chân yên/tải; M2 gộp 10 tỉ lệ cũng cần định nghĩa rõ.
    Hai fetch không-timeout còn lại trong E1 đã được Z8 vá một
    phần (vòng `/json/list` nay slot 5 s + deadline 60 s) — media
    probe fetch vẫn mở (Y9 §3, Z8 chưa sửa trong đợt này).

## 7. Cách chạy lại

```bash
# Do 30fps 1 lan E1 (doi E1_SCRATCH moi lan; DO E1 TRUOC, ngay dau luot de bat cua so yen):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round98-z9/e1-run1 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Do 60fps 1 lan (probe N10, deint-only; doi N10_LABEL moi lan):
N10_LABEL=60fps-deint-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round98-z9/60fps-deint-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Gop so (doc report JSON da co + so da cong bo, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round98-z9/analyze-pool98z9.py
# Test hoi quy luat median + M2 (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
# Test regex chan doan vite (offline, trich regex that tu source):
node --test apps/web/scripts/vite-diagnosis-regex-92t6.test.mjs
```

## 8. Nợ còn lại cho đợt sau

1. **G1 vẫn MỞ, chờ user quyết** (§4) — chân yên 30fps mới đạt 2/3
   (median 0,940; PASS 78%, CI cận dưới 0,840), còn thiếu 2 lần
   PASS yên liên tiếp nữa; chân yên 60fps đủ cả ba tiêu chí chặt
   (n=10) nhưng không thêm mẫu mới đợt này; pool 30fps 85% biên 3
   FAIL, cửa sổ trượt mới nhất PASS 5/5 (10 cửa sổ mới nhất đều
   PASS).
2. **Lấy 2 mẫu yên 30fps PASS liên tiếp nữa** (16/20 = 80%) — công
   thức X6/Z9: đo E1 ngay đầu lượt, trước khi sibling spin probe
   nặng. Lưu ý mới từ Z9: cửa sổ yên đợt này chỉ mở ~9 phút (~4
   lần yên chắc), nên có thể cần 2 lượt yên liên tiếp; và 1 lần
   FAIL yên sẽ phá khung 16/20 — đợt sau cần quyết trước khung mục
   tiêu mới nếu xảy ra FAIL yên.
3. **Parent quyết metric: G5 hay M2 làm chuẩn?** M2 đã đo + đã cài
   + test xanh; G5 vẫn là metric pool chính thức. N10 run5 là lần
   G5/M2 bất đồng đầu tiên ở fixture 60fps. Nếu chọn M2: cần quyết
   cách xử lý 4 lần yên cũ mất fpsSlots + 5 lần lịch sử bị lật
   verdict + định nghĩa M2 cho lần gộp 2 vòng (run5).
4. **Quy tắc phân loại lần hỗn hợp:** lần gộp 2 vòng (yên + tải)
   tính vào chế độ nào — Z9 đã chọn "chỉ pool tổng" (§3.3); parent
   kiểm lại. Quy tắc verdict vùng 0,6–0,9 đã cài vào E1 (Z8) nhưng
   chưa cài vào G5/pool.
5. **Nhiễu slot trên máy yên** (§6 mục 6): tỉ lệ trong một lần yên
   dao động 0,39–1,27 — cần hiểu nguồn nhiễu (load spike từng
   slot? rVFC? decode?) trước khi tin hoàn toàn vào verdict 1 lần.
   M2 (median) giảm nhẹ chứ không hết nhiễu.
6. **Mốc Z2/Z3/Z6/Z8 trong cửa sổ đo** (§3.4): vòng lặp song song
   sửa cùng file là rủi ro thường trực — đợt sau nên khóa/ghi mtime
   file phụ thuộc trước/sau MỖI lần đo, hoặc đo xong mới cho
   sibling sửa file chung.
7. **G1 (deint) vẫn mở, chờ user quyết** (§4) — birefnet 0 lần thành
   công (chỉ thử lại khi RAM đổi); EPERM probe #17 + khoảng mù #16
   (bắt đầu 11:37:29Z, reboot #20 13:24:41Z đã xảy ra trong khoảng
   mù — xem LIMITS gộp đợt 98); ci-security.yml vẫn 403 chờ user;
   TTS 39 CẤM kiểm lại; WebKit clip D, pre-pass keyframes, motion
   blur + mask, trackgeq, fallback, harness O8.
