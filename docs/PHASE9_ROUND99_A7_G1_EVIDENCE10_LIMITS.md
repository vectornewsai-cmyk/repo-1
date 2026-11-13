# Đợt 99 A7 — G1 evidence vòng 10 (KHÔNG TỰ ĐÓNG G1)

Ngày: 12/11/2026 (lượt cron 00:35 +07 ngày 13/11; đo 17:40:25–18:14:40Z).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot #21 ~17:25–17:26Z trước lượt — boot-id
99338d31-a4bc-4020-b910-301c997a24a2, uptime 14 phút lúc A7 bắt đầu,
KHÔNG reboot trong cửa sổ đo; RAM khả dụng 503–3732 MB trong cửa sổ;
load 1-phút 0,39–18,18).
Nợ: LIMITS gộp đợt 98 §4 mục 8 + docs/PHASE9_ROUND98_Z9_G1_EVIDENCE9_LIMITS.md.
Trạng thái G1 trước vòng: pool 30fps n=59 PASS 50/59 = 85% biên 3;
chân yên 30fps n=18 PASS 14/18 (78%), cần 2 PASS yên liên tiếp nữa
(16/20); chuỗi PASS yên liên tiếp 12; pool 60fps n=42 PASS 40/42
(95%); chân yên 60fps n=10, 10/10 PASS; metric M2 chạy song song,
G5 vẫn là chuẩn chính thức; quy tắc verdict đợt 98 Z8 (mean 5 tỉ lệ
≥0,9 PASS chắc, ≤0,6 FAIL chắc, vùng xám đo thêm lần 2 rồi verdict
mean gộp) đã cài vào E1.

**Trạng thái cuối: G1 VẪN CHƯA ĐÓNG — A7 chỉ đưa số + khuyến nghị,
quyết định cuối thuộc parent/user.** Chỉ đo, không sửa production,
không đổi ngưỡng, không đổi metric G5. Không i18n key mới. Không kiểm
lại TTS 39. Không thử birefnet.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **Chân yên 30fps — ĐẠT ĐỦ CẢ BA TIÊU CHÍ CHẶT LẦN ĐẦU TIÊN:
  3 mẫu yên mới, cả 3 đều PASS (0,83 / 1,02 / 0,93) → chân yên nay
  n=21: median 0,940×, mean 0,915, CI 95% [0,852; 0,979], PASS
  17/21 (81%)** — từ 14/18 (78%) lên 17/21. Cả ba tiêu chí chặt:
  median ≥ 0,75 ✓, PASS 81% ≥ 80% ✓, CI cận dưới 0,852 ≥ 0,75 ✓.
  **Mốc 16/20 = 80% đã đạt ngay ở lần yên thứ 2 của vòng (run7),
  run8 nâng lên 17/21.** Chuỗi PASS yên liên tiếp hiện tại: **15**
  (12 cũ + run1, run7, run8).
- **CAVEAT DUY NHẤT cho chân yên — run7 (1,02×):** baseline mean
  14,83 fps (≥10 → yên theo luật) nhưng slot baseline dao động
  5,52–25,77 fps, load 12–18 trong các slot đầu — máy chỉ "yên"
  theo baseline mean, không yên từng slot (cùng tiền lệ Z9 run4,
  baseline 13,13 fps, slot 6,47–24,05 fps, vẫn tính yên). **Nếu
  parent phân loại lại run7 thành hỗn hợp thì chân yên vẫn 16/20
  = 80% (run1 + run8), đủ mốc — kết luận không đổi, chỉ số đổi
  thành n=20, PASS 16/20.** Xem §3.3.
- **60fps: 4/5 lần A7 mới PASS dưới G5 — 0,71 FAIL / 0,90 / 0,94 /
  0,93 / 0,94 → pool 60fps nay n=47: median 0,960×, mean 0,979,
  CI 95% [0,934; 1,024], PASS 44/47 (94%)** — từ 40/42 (95%).
  **Run1 0,71× là lần FAIL 60fps đầu tiên kể từ M1** (pool Z9 5/5
  PASS); dưới M2 run1 cũng FAIL (0,73×) — G5/M2 ĐỒNG THUẬN lần
  này, số lần bất đồng trong lịch sử vẫn là 2. Cửa sổ 5 lần A7
  riêng: median 0,930, 4/5 PASS → luật (b) PASS ỔN ĐỊNH **lần thứ
  chín liên tiếp** (R6, S6, T6, U6, V5, W6, X6, Z9, A7).
- **Chân yên 60fps: +4 mẫu yên mới, cả 4 đều PASS (0,90 / 0,94 /
  0,93 / 0,94) → n=14, 14/14 PASS (100%), median 0,945×, mean
  0,956, CI 95% [0,927; 0,984]** — dày hơn Z9 (n=10) mà vẫn giữ
  100%.
- **30fps: 7 lần A7 mới có verdict, 7/7 PASS → pool n=66: median
  0,995×, mean 0,991, CI 95% [0,937; 1,045], PASS 57/66 (86%) —
  biên nay là 5 lần FAIL** (57/71 = 80,3% sau 5 FAIL nữa; FAIL
  thứ 6 → 57/72 = 79,2%). Cửa sổ trượt 5 lần: 49/62 PASS, **10
  cửa sổ mới nhất đều PASS 5/5**.
- **Lần abort run2 (E1):** harness lỗi ở slot 7 ("bấm Space lần 2
  mà playing vẫn true", exit 2), không verdict, không report —
  KHÔNG tính vào pool, KHÔNG tính là FAIL yên, KHÔNG nối/không
  reset chuỗi yên. Slot 0–6 cho thấy máy đang yên (baseline
  ~23 fps) nhưng không có verdict nên không được tính là mẫu yên.
  Đây là lần abort harness đầu tiên trong chuỗi E1 G1 (xem §3.3).

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy
yên. CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round99-a7/analyze-pool99a7.py` (kế thừa
`analyze-pool98z9.py`, cùng công thức; script kiểm lại tái tạo đúng
số Z9 đã công bố — pool 30 n=59 PASS 50/59, pool 60 n=42 PASS 40/42
— trước khi thêm lần A7; JSON gộp:
`benchmarks/results/g1-evidence-v10-99a7.json`).

### 2.1 Từng cửa sổ 5 lần (luật b) — chỉ cửa sổ đổi so với Z9

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| **A7 60fps 5 mới nhất = cửa sổ A7 riêng (đợt 99)** | **tải 1 / yên 4 (6,70; 21,23; 12,64; 19,92; 11,38)** | **0,71 / 0,90 / 0,94 / 0,93 / 0,94** | **0,930** | **4/5** | **PASS ỔN ĐỊNH** | **[0,762; 1,006]** |
| A7 30fps 7 lần riêng | yên 3 / tải 4 | 0,83 / 1,03 / 1,13 / 1,49 / 1,15 / 1,02 / 0,93 | 1,03 | 7/7 | — (n=7) | [0,868; 1,274] |

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5+Q7+R6+S6+T6+U6+V5+W6+X6+Z9+A7) | 66 | 0,995 | 0,991 | 0,219 | [0,937; 1,045] | 57/66 (86%) | PASS ỔN ĐỊNH (biên 5 FAIL) |
| 30fps — máy tải (<10 fps, trừ hỗn hợp) | 44 | 1,030 | 1,025 | 0,242 | [0,952; 1,098] | 39/44 (89%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps, trừ hỗn hợp) | 21 | **0,940** | **0,915** | 0,146 | **[0,852; 0,979]** | **17/21 (81%)** | **3/3 tiêu chí ✓ (mới)** |
| **60fps fixture (M1+N10+R6+S6+T6+U6+V5+W6+X6+Z9+A7)** | **47** | **0,960** | **0,979** | 0,155 | **[0,934; 1,024]** | **44/47 (94%)** | **PASS ỔN ĐỊNH** |
| 60fps — máy tải (<10 fps) | 33 | 0,990 | 0,988 | 0,182 | [0,925; 1,052] | 30/33 (91%) | PASS ỔN ĐỊNH |
| **60fps — máy yên (≥10 fps)** | **14** | **0,945** | **0,956** | 0,049 | **[0,927; 0,984]** | **14/14 (100%)** | **PASS ỔN ĐỊNH (dày hơn Z9)** |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 113 | 0,980 | 0,983 | 0,196 | [0,946; 1,020] | 100/113 (88%) | trên ngưỡng |
| A7 riêng 30fps (7 lần) | 7 | 1,030 | 1,081 | 0,214 | [0,868; 1,274] | 7/7 (100%) | — |
| A7 riêng 60fps (5 lần) | 5 | 0,930 | 0,884 | 0,099 | [0,762; 1,006] | 4/5 (80%) | PASS ỔN ĐỊNH |

### 2.3 Tiêu chí nào đạt / chưa đạt (so với Z9)

| Tiêu chí | Z9 (n=59/42) | A7 (n=66/47) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 0,990 ✓ | 0,995 ✓ | +0,005 |
| Pool 30fps PASS ≥ 80% | 50/59 = 85% ✓ (biên 3 FAIL) | **57/66 = 86% ✓ (biên 5 FAIL)** | **+1 điểm; biên dày thêm 2** |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,923 ✓ | 0,937 ✓ | +0,014 |
| 30fps tải n≥20: median + PASS + CI | 1,030 / 88% / 0,931 ✓✓✓ | **1,030 / 89% / 0,952 ✓✓✓** | cả ba đều nhích lên |
| 30fps yên: median + PASS + CI cận dưới | 0,940 / 78% / 0,840 (2/3) | **0,940 / 81% / 0,852 (3/3 ✓)** | **PASS +3 điểm — ĐỦ CẢ BA LẦN ĐẦU** |
| **60fps: median + PASS + CI** | **0,985 / 95% / 0,941 ✓✓✓** | **0,960 / 94% / 0,934 ✓✓✓** | **median −0,025, PASS −1 điểm (1 FAIL mới), CI −0,007 — vẫn đủ cả ba** |
| 60fps cửa sổ 5 mới nhất luật (b) | median 1,12, 5/5 → PASS | median 0,93, 4/5 → PASS | giữ PASS lần 9 liên tiếp; lần thấp nhất 0,71 FAIL |
| **60fps yên** | **n=10, CI [0,928; 1,006], 10/10 PASS** | **n=14, CI [0,927; 0,984], 14/14 PASS** | **+4 mẫu, vẫn 100%** |
| Cửa sổ trượt 5 lần 30fps PASS | 42/55 | 49/62 | +7 cửa sổ PASS; **10 cửa sổ mới nhất đều PASS 5/5** |
| Pearson(ratio, baselineFps) 30fps | −0,271 (n=59) | −0,291 (n=66) | đậm hơn nhẹ (hàm chế độ máy vẫn đó) |

**Đọc bảng đúng:** chân yên 30fps nay đủ cả ba tiêu chí chặt
(median 0,940; PASS 17/21 = 81%; CI cận dưới 0,852) — nhưng n=21
vẫn nhỏ, PASS chỉ hơn ngưỡng 1 điểm (16/20 cũng vừa đủ), và 1
trong 3 mẫu yên mới (run7) có caveat slot-tải đầu (§3.3). Pool
60fps dày lên về n nhưng mỏng đi 1 điểm vì lần FAIL đầu tiên kể
từ M1 — đừng trích "60fps 94%" mà không ghi lần FAIL 0,71×.
Đừng trích median tải 1,030× hay 1,49× của E1 run5 như tốc độ
deint (M2 của run5 là 1,34× — vẫn cao do tải).

## 3. Cửa sổ A7 mới — chi tiết từng lần

### 3.1 E1 30fps ×8 lần thử — 17:40–18:05Z — 7 verdict, 7/7 PASS (G5) + 1 abort

Lệnh (mỗi lần, tuần tự): `E1_SCRATCH=hidden_files/round99-a7/e1-runN
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (cổng :558x /
debug :968x / display :180, tự pick; fixture 30fps, 11 slot × 3s xen
kẽ; đo E1 TRƯỚC N10 để bắt cửa sổ yên đầu lượt — công thức X6/Z9).
**Cửa sổ yên mở ngay đầu lượt (run1 yên), đóng ở run2–6, mở lại
cuối lượt (run7–8 yên).**

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | M2 | Kết quả |
|---|---|---|---|---|---|---|---|---|
| 1 | 17:40–17:43 | 1,91 | 503 MB | vòng 1: 23,00 / vòng 2: 24,34 fps | vòng 1: 0,69 / 1,07 / 0,59 / 0,86 / 0,66 → 0,77; vòng 2: 0,97 / 0,92 / 0,75 / 0,85 / 0,93 → 0,88; **gộp 0,83** | **0,83×** | 0,85 | **10/10 PASS (yên, 2 vòng)** |
| 2 | 17:43–17:45 | 3,16 | 1974 MB | (slot 0–6: ~23 fps) | — (abort slot 7, không verdict) | — | — | **ABORT harness (xem §3.3)** |
| 3 | 17:45–17:49 | 8,35 | 1238 MB | vòng 1: 8,10 / vòng 2: 4,60 fps | vòng 1: 0,79 / 1,03 / 0,53 / 0,75 / 0,52 → 0,72; vòng 2: 1,11 / 1,10 / 2,39 / 1,01 / 1,11 → 1,34; **gộp 1,03** | **1,03×** | 1,02 | **10/10 PASS (tải, 2 vòng)** |
| 4 | 17:49–17:52 | 2,43 | 2027 MB | 6,93 fps | 0,67 / 1,11 / 0,95 / 0,96 / 1,96 | **1,13×** | 0,96 | **10/10 PASS (tải)** |
| 5 | 17:54–17:56 | 3,73 | 2886 MB | 4,91 fps | 1,43 / 1,32 / 1,34 / 2,13 / 1,21 | **1,49×** (tính lại từ tỉ lệ làm tròn: 1,48) | 1,34 | **10/10 PASS (tải)** |
| 6 | 17:56–17:59 | 1,18 | 1676 MB | 5,42 fps | 1,14 / 1,39 / 1,41 / 0,95 / 0,87 | **1,15×** | 1,14 | **10/10 PASS (tải)** |
| 7 | 18:00–18:03 | 12,08 | 1659 MB | 14,83 fps | 0,93 / 2,07 / 0,81 / 0,57 / 0,73 | **1,02×** | 0,81 | **10/10 PASS (yên — caveat §3.3)** |
| 8 | 18:03–18:05 | 5,29 | 3174 MB | 20,56 fps | 1,06 / 0,85 / 0,91 / 0,99 / 0,82 | **0,93×** | 0,91 | **10/10 PASS (yên, sạch nhất)** |

| Lần | Slot draw fps (B/D xen kẽ, slot 0–10) | Slot đóng băng |
|---|---|---|
| 1 vòng 1 | 20,83 / 16,29 / 26,50 / 23,23 / 16,78 / 12,24 / 24,50 / 21,51 / 25,47 / 16,17 / 23,90 | không |
| 1 vòng 2 | 19,51 / 21,81 / 25,38 / 22,81 / 24,07 / 18,78 / 26,13 / 21,17 / 23,90 / 23,77 / 27,06 | không |
| 2 (abort) | 23,38 / 23,00 / 22,47 / 21,18 / 25,48 / 12,60 / 8,29 / (slot 7 lỗi) | không (tới slot 6) |
| 3 vòng 1 | 10,17 / 6,00 / 5,07 / 6,55 / 7,62 / 4,88 / 10,96 / 8,11 / 10,62 / 3,80 / 4,13 | không |
| 3 vòng 2 | 5,18 / 4,87 / 3,61 / 4,40 / 4,40 / 9,36 / 3,42 / 3,88 / 4,28 / 6,13 / 6,73 | không |
| 4 | 6,29 / 4,18 / 6,14 / 7,88 / 8,08 / 6,30 / 5,16 / 5,45 / 6,19 / 15,63 / 9,75 | không |
| 5 | 10,33 / 11,62 / 5,97 / 6,63 / 4,06 / 4,82 / 3,14 / 6,58 / 3,05 / 3,62 / 2,93 | không |
| 6 | 7,29 / 6,76 / 4,53 / 6,52 / 4,88 / 6,93 / 4,96 / 6,61 / 8,92 / 4,73 / 1,92 | không |
| 7 | 5,52 / 9,36 / 14,61 / 21,26 / 5,93 / 7,96 / 13,67 / 10,67 / 23,46 / 17,88 / 25,77 | không |
| 8 | 16,86 / 19,49 / 19,79 / 17,49 / 21,25 / 18,60 / 19,61 / 20,57 / 21,94 / 18,72 / 23,92 | không |

- **Run8 (0,93×) là lần yên sạch nhất vòng này:** tỉ lệ 0,82–1,06
  (biên hẹp nhất cửa sổ A7), baseline 20,56 fps ổn định cả 11 slot
  (16,86–23,92 fps) — đối lập run7, slot baseline dao động
  5,52–25,77 fps trong cùng một lần "yên" (baseline mean 14,83).
- **Run1 (0,83×) là lần yên 2 vòng thứ hai trong lịch sử G1**
  (sau Z9 run5 hỗn hợp): vòng 1 mean 0,77× rơi vùng xám 0,6–0,9
  → quy tắc 98Z8 đo thêm vòng 2 (0,88×), verdict gộp 10 tỉ lệ
  0,83× PASS. Khác Z9 run5: cả 2 vòng đều yên (23,00 / 24,34 fps)
  nên lần này tính trọn vào chân yên — không phải hỗn hợp.
- **Run5 (1,49×):** tỉ lệ 1,21–2,13, baseline sụp 10,33 → 2,93
  fps giữa lần đo — ví dụ rõ nhất vòng này cho "tải phồng mean":
  deint slot chỉ 3–12 fps nhưng baseline sụp nhanh hơn nên tỉ lệ
  vọt. M2 1,34 vẫn PASS nhưng cao — đừng trích 1,49× làm tốc độ.
- **Run3 vòng 2 có tỉ lệ 2,39× đơn lẻ** (slot deint 9,36 fps
  trong lúc baseline chỉ 3,42–4,40 fps) — cùng mẫu phồng do tải.
- **Pixel cả 7 lần có verdict giống hệt lịch sử:** G2 MAD 0,5821;
  G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt
  N5/Q7/R6/S6/T6/U6/V5/W6/X6/Z9). **H9 0 lỗi trang cả 7 lần.**
  Không có dấu EPERM trong log 8 lần E1 (grep 0 kết quả, kể cả
  log run2 abort).
- **0 slot đóng băng trong cả 12 lần đo A7** (E1 ×7 verdict + N10
  ×5) — như X6/Z9; ngay cả các lần tải nặng (baseline 2,49–4,91
  fps) cũng không có slot < 0,5 fps. Run2 abort dừng ở slot 7
  nên không tính vào đếm này (slot 0–6 không đóng băng).

### 3.2 60fps deint-only ×5 (probe N10) — 18:06–18:14Z — 4/5 PASS (G5)

Lệnh (mỗi lần, tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round99-a7/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 18:06–18:08 | 1,24 | 6,70 fps | 0,65 / 0,18 / 1,01 / 0,97 / 0,73 | **0,71×** | **0,73 FAIL** | **FAIL G5 + FAIL M2**, 4/4 (tải) |
| 2 | 18:08–18:09 | 9,80 | 21,23 fps | 0,98 / 0,70 / 0,89 / 1,03 / 0,89 | **0,90×** | 0,89 | PASS, 4/4 (yên) |
| 3 | 18:09–18:11 | 5,23 | 12,64 fps | 0,45 / 1,21 / 0,61 / 1,36 / 1,05 | **0,94×** | 1,05 | PASS, 4/4 (yên) |
| 4 | 18:11–18:12 | 3,34 | 19,92 fps | 0,93 / 0,87 / 0,95 / 0,83 / 1,08 | **0,93×** | 0,93 | PASS, 4/4 (yên) |
| 5 | 18:13–18:14 | 2,87 | 11,38 fps | 1,27 / 0,54 / 0,99 / 1,10 / 0,80 | **0,94×** | 0,99 | PASS, 4/4 (yên) |

- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 5/5 lần và giống hệt
  M1/N10/R6/S6/T6/U6/V5/W6/X6/Z9 — deint áp thật trên fixture 60fps,
  đường code không đổi (cả run1 chạy trước sửa preview.tsx của
  sibling lẫn run2–5 chạy sau — xem §3.4).
- **C3 0 lỗi trang cả 5 lần.** Không có dấu EPERM trong log 5 lần
  đo (grep 0 kết quả).
- **Run1 (0,71× FAIL — lần FAIL 60fps đầu tiên kể từ M1 run5
  0,73×):** slot combo 0,97 fps (tỉ lệ 0,18×) và slot baseline
  1,29 fps trong cùng lần đo — máy tải nặng, cả hai phía đều sụp.
  3/5 tỉ lệ dưới ngưỡng (0,65 / 0,18 / 0,73); mean chỉ được kéo
  lên bởi 1,01× / 0,97×. Dưới M2 cũng FAIL (0,73×) — **G5/M2
  đồng thuận, không phải bất đồng thứ ba**; số lần bất đồng trong
  lịch sử vẫn là 2 (X6 e1-run6, Z9 N10 run5).
- **Run3 (0,94×):** tỉ lệ trong một lần dao động 0,45–1,36 — lần
  N10 nhiễu nhất vòng này; M2 1,05 PASS nhưng là median cứu (3/5
  tỉ lệ ≥0,75 chỉ vừa đủ). Đừng trích 1,36× đơn lẻ.
- **Run4 (0,93×) là lần 60fps sạch nhất vòng:** tỉ lệ 0,83–1,08,
  baseline 19,92 fps ổn định (11,00–23,27 fps, chỉ slot 10 sụt
  11,00) — đối lập run1/run3.
- **4/4 lần yên 60fps mới đều PASS** — chân yên 60fps nay n=14,
  14/14, CI [0,927; 0,984]. Lần tải 60fps duy nhất vòng này lại
  FAIL — đảo ngược mẫu Z9 (5/5 tải PASS).

### 3.3 Các lần đặc biệt — phân loại do A7 quyết, parent kiểm lại

**Run7 E1 — yên theo luật, caveat slot-tải đầu:**
Lần bắt đầu lúc load 12,08 (cao nhất cửa sổ E1), slot 0 baseline
chỉ 5,52 fps, slot 4 baseline 5,93 fps — nhưng slot 8–10 baseline
23,46 / 17,88 / 25,77 fps kéo mean lên 14,83 fps (≥10 → yên theo
luật baseline mean đã dùng từ X6 tới nay; tiền lệ Z9 run4: baseline
13,13 fps, slot 6,47–24,05 fps, tính yên). Tỉ lệ 2,07× đơn lẻ ở
slot 3 (baseline slot 2 chỉ 14,61 nhưng deint slot 3 chạy 21,26
fps) kéo mean lên 1,02×; M2 0,81 PASS nhưng khiêm tốn hơn — đúng
kiểu M2 sinh ra để xử lý. **Phân loại: YÊN PASS** (tính vào chân
yên + chuỗi yên). **Độ nhạy: nếu parent loại run7 khỏi chân yên
(hỗn hợp) thì chân yên còn 16/20 = 80% — vẫn đủ mốc 16/20; nếu
loại cả run7 lẫn run1 (2 vòng) thì còn 15/19 = 79% — không đủ.
Kết luận "đủ 3/3 tiêu chí" phụ thuộc vào việc giữ run1 (2 vòng
đều yên, không có gì phải loại) — run1 là mẫu yên chắc.**

**Run2 E1 — abort harness, không verdict:**
Dừng ở slot 7 (17:45:15Z): `HARNESS LỖI: deint slot 7: bấm Space
lần 2 mà playing vẫn true` (exit 2). G0–G4 đã PASS, slot 0–6 chạy
xong (baseline ~23 fps, đang yên), không có file report. Không
phải FAIL G5 (không có mean tỉ lệ), không phải FAIL trang (H9
chưa tới bước kiểm). **Phân loại: ABORT — loại khỏi mọi pool,
không nối/không reset chuỗi yên.** Đây là lần abort harness đầu
tiên trong chuỗi E1 G1; load lúc abort vọt 3,16 → 9,08 trong 90
giây — nghi ngờ sibling spin probe nặng giữa lần đo làm rVFC/
playing kẹt, nhưng không có bằng chứng trực tiếp (không log
chrome lỗi). Nợ mở: harness Space-toggle flaky dưới tải (xem §8).

**Run1 + run3 E1 — lần 2 vòng, verdict gộp 10 tỉ lệ:**
Cả hai đều vòng 1 rơi vùng xám (0,77× / 0,72×) → quy tắc 98Z8 đo
thêm vòng 2 → verdict gộp PASS (0,83× / 1,03×). Run1 cả 2 vòng
yên → chân yên; run3 cả 2 vòng tải → chân tải. Không lần nào là
hỗn hợp vòng này (khác Z9 run5). M2 gộp 10 tỉ lệ: run1 0,85 PASS,
run3 1,02 PASS.

### 3.4 Nhiễu giữa cửa sổ: sibling sửa `preview.tsx` giữa lúc đo

Kỷ luật mtime trước/sau (17:40:08Z → 18:16:35Z):

- **`preview.tsx` đổi 1 lần giữa cửa sổ đo** (14:57:21Z →
  17:54:44Z, md5 41b05c8e → efce65dd): sửa lúc E1 run5 đang chạy
  (run5 bắt đầu 17:54:19, sửa 17:54:44 — ~25 giây sau khi mount,
  trước các slot G5). Marker trong file hiện tại: "Đợt 99 A2"
  (expose ring snapshots — chẩn đoán ghost residual) và "Đợt 99 A6"
  (clip-active window) — sibling A2/A6 đợt 99.
- **`clicktest-77e1-deint-fps.mjs` / `deint-fps-verdict.mjs` /
  `probe-86n10-config-fps.mjs`: KHÔNG đổi** trong cửa sổ đo
  (mtime + md5 giống hệt trước/sau).
- **Vì sao không ảnh hưởng số deint:** sửa A2/A6 không chạm đường
  deint (ring snapshots + clip-active window) — bằng chứng: pixel
  G2/G7a/G7b/G8 giống hệt lịch sử cả 7 lần E1 có verdict (cả trước
  sửa: run1/3/4, lẫn sau sửa: run5/6/7/8), D1 MAD 0,3835 giống hệt
  5/5 lần N10 (cả trước và sau sửa 17:54:44Z), tỉ lệ tính lại từ
  `fpsSlots` trong JSON khớp log (script gộp: KHOP, trừ run5
  1,48 vs 1,49 do làm tròn tỉ lệ từng slot — xem §5).
  **Giữ cả 12 lần có verdict trong pool, ghi rõ phiên bản code
  từng lần** (xem JSON `pool30[].dot/lan` + §3.1/3.2; run5 chạy
  đúng lúc sửa — mount trước, slot G5 sau sửa).
- Bài học lặp lại từ X6/Z9 §3.4: vòng lặp song song sửa cùng file
  là rủi ro thường trực — A7 ghi mtime trước/sau cả cửa sổ (như
  Z9), chưa ghi trước/sau MỖI lần đo; đợt sau nên ghi mtime
  trước/sau mỗi lần đo để xác định chính xác lần nào mount trước/
  sau sửa (đặc biệt khi sửa rơi giữa một lần đo như run5).

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của A7: PHƯƠNG ÁN A (đóng một phần) nay ĐỦ ĐIỀU KIỆN
ở chân yên 30fps — lần đầu tiên cả ba chân (tải 30fps, yên 30fps,
tải 60fps, yên 60fps) đều đạt đủ ba tiêu chí chặt. Quyết định cuối
vẫn thuộc parent/user; A7 KHÔNG tự đóng.**

- **Phương án A — Đóng một phần: deint ĐẠT ở cả 4 chân (ĐỀ XUẤT
  XEM XÉT, có điều kiện — như Z9, cập nhật số):** 30fps-tải n=44:
  median 1,030×, mean 1,025, CI cận dưới 0,952, 39/44 PASS = 89%;
  **30fps-yên n=21: median 0,940×, mean 0,915, CI cận dưới 0,852,
  17/21 PASS = 81% — đủ 3/3 lần đầu**; 60fps-tải n=33: median
  0,990×, mean 0,988, CI cận dưới 0,925, 30/33 PASS = 91%;
  **60fps-yên n=14: median 0,945×, mean 0,956, CI [0,927; 0,984],
  14/14 PASS = 100% — cả ba tiêu chí chặt vẫn đạt**; cửa sổ 5 lần
  60fps mới nhất PASS luật (b) **lần thứ chín liên tiếp**, median
  0,93.
  - Điều kiện đóng (bắt buộc ghi kèm): (i) verdict "PASS" chỉ đúng
    trên VM này (CPU-only, 4 vCPU, Chrome `--disable-gpu`, Xvfb) —
    không suy ra máy khác / máy có GPU / Safari thật; (ii) chân yên
    30fps mới vượt ngưỡng PASS đúng 1 điểm (17/21 = 81%; 16/20 cũng
    vừa đủ) và 1/3 mẫu yên mới (run7) có caveat slot-tải đầu —
    nếu parent loại run7 thì chân yên còn 16/20 = 80%, vẫn đủ
    nhưng không còn biên; (iii) không trích số pool gộp (0,995× /
    86% ở 30fps; 0,960× / 94% ở 60fps) như verdict duy nhất — pool
    gộp trộn hai chế độ; (iv) **pool 60fps nay biên mỏng hơn Z9
    (44/47 = 94%, 2 lần FAIL trong pool đều là M1 run4/run5 cũ +
    A7 run1 mới)** — đừng trích "60fps 94%" mà không ghi lần FAIL
    0,71×; (v) **dưới metric M2, A7 là 7/7 (30fps) + 4/5 (60fps)**
    — M2 đồng thuận G5 ở cả 12 lần vòng này (0 lần bất đồng mới);
    parent vẫn chưa chọn metric nào làm chuẩn (sibling A9 đợt 99
    đang làm mảng metric — chờ kết luận A9 trước khi đổi chuẩn);
    (vi) lần abort run2 cho thấy harness Space-toggle flaky dưới
    tải — verdict "10/10" của harness không bao gồm độ tin cậy
    của chính harness.
  - Vì sao A7 vẫn không đề xuất đóng toàn vẹn: (1) chân yên 30fps
    đủ 3/3 nhưng biên PASS chỉ 1 điểm và n=21 vẫn nhỏ — 2 lần FAIL
    yên liên tiếp nữa là về 17/23 = 74%; (2) pool 60fps vừa có
    FAIL mới sau 5 lượt toàn PASS (Z9 5/5) — deint 60fps dưới tải
    nặng chưa chứng minh là ổn định tuyệt đối; (3) nhiễu slot vẫn
    lớn ngay cả trên máy yên (run7: 0,57–2,07 trong một lần; run1
    vòng 1: 0,59–1,07); (4) metric tỉ lệ FPS vẫn là hàm của chế độ
    máy (Pearson −0,291) — parent chưa chọn G5 hay M2 làm chuẩn.
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5/Q7/R6/S6/T6/U6/
  V5/W6/X6/Z9. A7 làm phương án này THÊM BẰNG CHỨNG: M2 nay có
  thêm 12 lần đo (E1 7/7 PASS cả hai metric; N10 4/5 PASS dưới
  M2, đồng thuận G5 12/12 lần). Đề xuất: chờ kết luận sibling A9
  (metric) đợt 99 rồi parent quyết có thay G5 bằng M2 trong pool
  hay không (lưu ý: pool đầy đủ không tính lại được dưới M2 với
  các lần cũ mất fpsSlots).
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5/Q7/R6/S6/
  T6/U6/V5/W6/X6/Z9. A7 chứng minh phương án này ĐÃ CHO ĐỦ SỐ:
  đo E1 ngay đầu lượt + cuối lượt (khi load hạ) lấy được 3/8 lần
  yên (run1 đầu lượt, run7–8 cuối lượt) — cửa sổ yên đợt này mở
  2 lần (~4 phút đầu + ~5 phút cuối), không phải 1 lần như Z9.
  Công thức lặp lại được, nhưng mỗi lượt chỉ cho ~3 mẫu yên.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 86%/94%
  mà bỏ qua caveat run7 và lần FAIL 60fps mới; trích pool 30fps
  "86%" như số chắc (biên 5 FAIL, trong đó có 1 lần hỗn hợp Z9);
  trích "yên 3/3 PASS" mà không ghi run7 có slot tải đầu và run1
  là lần 2 vòng; trích median yên 30fps 0,940 như số chắc (n=21
  vẫn nhỏ, PASS mới 81%); trích 1,49× của E1 run5 hay 1,34× M2
  của nó như tốc độ deint (cả hai đều cao do tải, không phải tốc
  độ thật); trích "60fps 4/5 PASS" mà không ghi lần FAIL chỉ
  0,71× và M2 cũng FAIL.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ đo (sửa `preview.tsx` là của sibling A2/A6 — xem §3.4) |
| `node --test vite-diagnosis-regex-92t6.test.mjs` | **9/9** chạy lại xanh |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** chạy lại xanh |
| `node --check` 3 script đã dùng | **PASS** cả ba |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm (chỉ thêm LIMITS + JSON số đo + file trong hidden_files), cùng tiền lệ U6/V5/W6/X6/Z9 |
| Cửa sổ A7 E1 30fps ×8 lần thử headed | 7 verdict **7/7 PASS** (0,83 / 1,03 / 1,13 / 1,49 / 1,15 / 1,02 / 0,93; yên 3 / tải 4) + **1 abort run2** (harness, không verdict) |
| Cửa sổ A7 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 4/5 PASS G5** (0,71 FAIL / 0,90 / 0,94 / 0,93 / 0,94), 4/4 cases mỗi lần; M2 4/5 |
| Gộp pool tính lại (`analyze-pool99a7.py`) | tái tạo đúng số Z9 đã công bố khi chạy trên pool cũ (pool 30 n=59 PASS 50/59, pool 60 n=42 PASS 40/42) trước khi thêm lần A7; 12 lần A7 mới tính lại từ fpsSlots khớp G5/ratioMean đã ghi (trừ run5 E1: tính lại 1,48 vs report 1,49 — lệch 0,01 do làm tròn tỉ lệ từng slot); frozenSlots khớp tính lại cả 7 lần E1 có verdict |
| M2 tính lại (`analyze-pool99a7.py`) | 12 lần A7: E1 7/7 PASS (0,85 / 1,02 / 0,96 / 1,34 / 1,14 / 0,81 / 0,91); N10 4/5 PASS (0,73 FAIL / 0,89 / 1,05 / 0,93 / 0,99) — đồng thuận G5 12/12 |
| Headed H9/C3 (mọi lần chạy A7) | **0 lỗi trang** (E1 10/10 ×7, 60fps 4/4 ×5; run2 abort dừng trước bước H9) |
| Pixel D1 60fps (A7) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1/N10/R6/S6/T6/U6/V5/W6/X6/Z9 — tap áp thật; giống hệt cả trước/sau sửa preview.tsx của sibling |
| Pixel G2/G7a/G7b/G8 E1 (cả 7 lần có verdict) | giống hệt N5/Q7/R6/S6/T6/U6/V5/W6/X6/Z9 (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522) |
| `preview.tsx` / `deint-fps-verdict-83k3.mjs` / `probe-86n10-config-fps.mjs` | A7 không chạm; sibling A2/A6 sửa `preview.tsx` 1 lần giữa cửa sổ đo (17:54:44Z) — xem §3.4 (không ảnh hưởng số deint) |
| Không process mồ côi của A7 sau đo | không vite/chrome nào dùng scratch round99-a7 còn chạy; boot-id không đổi 99338d31, không reboot trong cửa sổ đo |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — A7 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn. Lần đầu tiên cả 4 chân đều đủ 3/3 tiêu chí
   chặt — nhưng biên PASS chân yên 30fps chỉ 1 điểm.
2. **Pool 30fps 86% (57/66) — biên 5 FAIL.** Thêm 5 FAIL nữa là về
   57/71 = 80,3%; FAIL thứ 6 là rơi dưới 80% (57/72 = 79,2%).
   Đừng trích 86% như số chắc — và đừng trích mà không ghi đây là
   pool gộp trộn hai chế độ + 1 lần hỗn hợp (Z9 run5).
3. **Chân yên 30fps đủ 3/3 lần đầu: n=21, median 0,940, PASS
   17/21 (81%), CI cận dưới 0,852.** Chuỗi PASS yên liên tiếp là
   15. Nhưng: 1/3 mẫu yên mới (run7) có caveat slot-tải đầu (§3.3)
   — nếu parent loại run7 thì chân yên còn 16/20 = 80%, vẫn đủ
   nhưng hết biên; 2 lần FAIL yên liên tiếp nữa là về 17/23 = 74%.
4. **Lần abort run2 — phân loại do A7 quyết, parent kiểm lại:**
   loại khỏi mọi pool, không nối/không reset chuỗi yên. Nếu parent
   muốn tính abort là FAIL thì pool 30fps đổi thành 57/67 = 85%
   (chân yên không đổi vì run2 không có verdict chế độ) — kết luận
   không đổi, nhưng số pool phải ghi theo cách tính đã chọn.
5. **M2 đồng thuận G5 12/12 lần vòng này (0 lần bất đồng mới).**
   Số lần bất đồng trong lịch sử vẫn là 2 (X6 e1-run6, Z9 N10
   run5). Pool đầy đủ KHÔNG tính lại được dưới M2 (các lần
   I5–Q7/M1/N10-đầu mất fpsSlots). Đừng trích "M2 pool" như số
   pool đầy đủ. Chờ kết luận sibling A9 (metric) đợt 99.
6. **Nhiễu slot vẫn lớn ngay cả trên máy yên:** A7 run7 tỉ lệ
   0,57–2,07 trong một lần, slot baseline 5,52–25,77 fps; run1
   vòng 1 tỉ lệ 0,59–1,07. Baseline mean ≥10 fps ("máy yên")
   không có nghĩa từng slot yên. Đừng trích một lần đo đơn lẻ
   (vd 1,49×) như tốc độ deint.
7. **Pool 60fps 94% (44/47) mỏng đi 1 điểm vì lần FAIL mới
   (A7 run1 0,71×)** — lần FAIL 60fps đầu tiên kể từ M1. Chân
   yên 60fps n=14 vẫn nhỏ (dù 14/14 PASS, CI [0,927; 0,984]).
   Không dùng 14 điểm này để nói "deint ngang baseline trên mọi
   máy nhanh".
8. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→A7) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật. Bằng chứng mạnh nhất vòng này: cùng một lần
   E1 run5 chứa cả 1,21× và 2,13×; cùng một lần N10 run1 chứa cả
   0,18× và 1,01×.
9. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác).
   Đừng trích chỉ một tiêu chí (CI đạt, tỉ lệ PASS không).
10. **Luật median-5 lật 13/62 cửa sổ trượt 30fps** (49/62 PASS).
    Đừng trích verdict của một cửa sổ 5 lần đơn lẻ như kết luận chắc;
    luôn ghi kèm chế độ đo (baseline mean fps) và cửa sổ. 10 cửa sổ
    mới nhất (53–57 → 62–66) đều PASS 5/5.
11. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích
    "combo 0,76×" như tốc độ combo.
12. **e1-run1 của T6 và W6 vẫn giữ trong pool** theo quyết định parent
    đợt 92 (đã chấp nhận, 0 EPERM trong mọi log) — A7 không loại,
    không tranh luận lại, và ghi rõ độ nhạy thay vì loại. Lưu ý:
    pool nay đứng được cả khi loại cả hai lần phồng + lần hỗn hợp
    Z9 (54/63 = 86%).
13. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 9–10 luồng song
    song.** Tải sibling là biến số lớn nhất (load 1-phút 0,39–18,18;
    RAM khả dụng 0,50–3,73 GB trong cửa sổ A7). Loadavg lúc bắt đầu
    KHÔNG dự báo được tải trong lúc đo (run7 bắt đầu 12,08 nhưng
    baseline mean vẫn 14,83; run6 bắt đầu 1,18 nhưng baseline mean
    chỉ 5,42). Cửa sổ yên đợt này mở 2 lần (~4 phút đầu + ~5 phút
    cuối lượt).
14. **Không có sóng EPERM hay port-conflict thật nào trong cửa sổ A7
    (0 dấu EPERM trong 13 log đo).** Sóng thật gần nhất vẫn
    ~11:55–12:11Z (R7); EPERM KHÔNG tuyên bố đã hết.
15. **Quy tắc verdict vùng 0,6–0,9 đã cài vào E1 (Z8) và đã bắn
    thật 2 lần vòng này (run1 + run3, cả hai đều vòng 1 vùng xám
    → vòng 2 → PASS gộp).** Quy tắc phân loại lần hỗn hợp (Z9
    §3.3) không cần dùng vòng này (không có lần hỗn hợp 2 vòng
    khác chế độ); nhưng run7 cho thấy cần quy tắc phân loại
    slot-tải-đầu trong một lần yên (baseline mean ≥10 nhưng slot
    đầu <6 fps). Hai fetch không-timeout còn lại trong E1 (media
    probe fetch vẫn mở — Y9 §3, Z8 chưa sửa) không bắn vòng này.

## 7. Cách chạy lại

```bash
# Do 30fps 1 lan E1 (doi E1_SCRATCH moi lan; DO E1 TRUOC, ngay dau luot de bat cua so yen;
# vong nay cua so yen mo lai cuoi luot khi load ha — neu lan dau tai thi thu lai sau 15-20 phut):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round99-a7/e1-run1 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Do 60fps 1 lan (probe N10, deint-only; doi N10_LABEL moi lan):
N10_LABEL=60fps-deint-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round99-a7/60fps-deint-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Gop so (doc report JSON da co + so da cong bo, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round99-a7/analyze-pool99a7.py
# Test hoi quy luat median + M2 (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
# Test regex chan doan vite (offline, trich regex that tu source):
node --test apps/web/scripts/vite-diagnosis-regex-92t6.test.mjs
```

## 8. Nợ còn lại cho đợt sau

1. **G1 vẫn MỞ, chờ user quyết** (§4) — chân yên 30fps mới đạt
   đủ 3/3 lần đầu (median 0,940; PASS 81%, CI cận dưới 0,852),
   còn thiếu quyết định của parent/user; chân yên 60fps n=14,
   14/14 PASS; pool 30fps 86% biên 5 FAIL, pool 60fps 94% với 1
   FAIL mới (A7 run1 0,71×); cửa sổ trượt mới nhất PASS 5/5
   (10 cửa sổ mới nhất đều PASS).
2. **Parent quyết metric: G5 hay M2 làm chuẩn?** M2 đã đo + đã cài
   + test xanh; G5 vẫn là metric pool chính thức. A7: M2 đồng
   thuận G5 12/12 lần (0 bất đồng mới). Sibling A9 đợt 99 đang
   làm mảng metric — chờ kết luận A9 rồi parent quyết.
3. **Harness Space-toggle flaky dưới tải:** E1 run2 abort ở slot 7
   ("bấm Space lần 2 mà playing vẫn true") khi load vọt 3,16 →
   9,08 giữa lần đo. Lần abort harness đầu tiên trong chuỗi E1
   G1 — cần hiểu có phải do tải sibling làm rVFC/playing kẹt
   không, và có cần retry slot thay vì abort cả lần không.
4. **Quy tắc phân loại slot-tải-đầu trong lần yên:** run7 (baseline
   mean 14,83 nhưng slot 0/4 chỉ 5,52/5,93 fps, load 12–18) —
   parent kiểm lại cách tính (A7 tính yên; loại run7 thì chân yên
   còn 16/20 = 80%, vẫn đủ). Quy tắc verdict vùng 0,6–0,9 đã cài
   vào E1 (Z8) nhưng chưa cài vào G5/pool.
5. **Nhiễu slot trên máy yên** (§6 mục 6): tỉ lệ trong một lần yên
   dao động 0,57–2,07 — cần hiểu nguồn nhiễu (load spike từng
   slot? rVFC? decode?) trước khi tin hoàn toàn vào verdict 1 lần.
   M2 (median) giảm nhẹ chứ không hết nhiễu.
6. **Mốc A2/A6 trong cửa sổ đo** (§3.4): vòng lặp song song sửa
   cùng file là rủi ro thường trực — đợt sau nên ghi mtime file
   phụ thuộc trước/sau MỖI lần đo (A7 chỉ ghi trước/sau cả cửa
   sổ), hoặc đo xong mới cho sibling sửa file chung. Sửa 17:54:44Z
   rơi đúng giữa E1 run5 — lần đo nào mount trước/sau sửa chỉ
   suy từ log, không có mtime từng lần.
7. **G1 (deint) vẫn mở, chờ user quyết** (§4) — birefnet 0 lần thành
   công (chỉ thử lại khi RAM đổi); EPERM probe #18/#19 + khoảng mù
   (xem LIMITS gộp đợt 98; A8 đợt 99 đang làm probe #18); TTS 39
   CẤM kiểm lại; WebKit clip D, pre-pass keyframes, motion blur +
   mask, trackgeq, fallback, harness O8.
