# Đợt 96 X6 — G1 evidence vòng 8 (KHÔNG TỰ ĐÓNG G1)

Ngày: 12/11/2026 (lượt cron 15:35 +07; đo 08:42:18–09:14:18Z).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot #17 ~08:01Z trước đợt 96 — boot-id
a3a13d5a-928a-42f8-91d7-c8405a28e1d5, uptime 41 phút lúc X6 bắt đầu,
KHÔNG reboot trong cửa sổ đo; RAM khả dụng lúc bắt đầu mỗi lần
1040–2612 MB; load 1-phút lúc bắt đầu mỗi lần 1,18–11,08).
Nợ: LIMITS gộp đợt 95 §4 mục 6 + §1 W6, docs/PHASE9_ROUND95_W6_G1_EVIDENCE7_LIMITS.md.
Trạng thái G1 trước vòng: pool 30fps 36/45 = 80% ĐÚNG VẠCH, biên 0,
phụ thuộc lần phồng 1,82×; chân yên 30fps n=8 PASS 4/8 (50%), cần
12 lần PASS liên tiếp (16/20), không phải 4 như V5 nói sai; pool
60fps n=32 PASS 30/32 (94%); fetch up-loop E1 không timeout (U6 §7.1);
metric tỉ lệ FPS nhạy slot đóng băng (W6 §8 mục 4).

**Trạng thái cuối: G1 VẪN CHƯA ĐÓNG — X6 chỉ đưa số + khuyến nghị, quyết
định cuối thuộc parent/user.** Chỉ sửa harness (E1 timeout fix + hàm
M2 trong verdict script + test), không sửa production, không đổi
ngưỡng, không đổi metric G5. Không i18n key mới. Không kiểm lại TTS 39.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **Chân yên 30fps — BƯỚC TIẾN LỚN NHẤT VÒNG NÀY: 6 mẫu yên mới,
  cả 6 đều PASS (1,02 / 0,97 / 0,84 / 1,00 / 1,23 / 0,99) → chân yên
  nay n=14: median 0,955×, mean 0,904, CI 95% [0,803; 1,005],
  PASS 10/14 (71%)** — từ 4/8 (50%) lên 10/14, **đạt 2/3 tiêu chí
  chặt** (median ≥ 0,75 ✓, CI cận dưới 0,803 ≥ 0,75 ✓, PASS 71% <
  80% ✗). Mục tiêu đúng còn lại: **6 lần PASS yên liên tiếp nữa**
  (16/20 = 80%) — đã đi được nửa đường 12 lần từ W6. Lần đầu tiên
  kể từ V5 lấy được mẫu yên (W6: 0/7), nhờ đo E1 NGAY ĐẦU lượt,
  trước khi sibling spin probe nặng.
- **60fps: 5/5 lần X6 mới đều PASS — 0,81 / 1,03 / 0,87 / 1,19 / 0,99
  → pool 60fps nay n=37: median 0,980×, mean 0,977, SD 0,153,
  CI 95% [0,927; 1,027], PASS 35/37 (95%)** — dày hơn W6 (30/32 =
  94%). Cửa sổ 5 lần 60fps mới nhất: median 0,990, 5/5 PASS → luật
  (b) PASS ỔN ĐỊNH **lần thứ bảy liên tiếp** (R6, S6, T6, U6, V5,
  W6, X6).
- **Chân yên 60fps: n=10 (thêm 2 mẫu yên X6 run2/run3), median 0,970,
  10/10 PASS, CI [0,928; 1,006] — cả ba tiêu chí chặt vẫn đạt.**
- **30fps: 8 lần X6 mới (7 đo chính + 1 smoke-test sau fix), 8/8 PASS
  (1,02 / 0,97 / 0,84 / 1,00 / 1,23 / 0,99 / 1,05 / 1,13) → pool
  n=53: median 0,990×, mean 0,978, CI 95% [0,914; 1,041], PASS
  44/53 (83%) — biên nay là 2 lần FAIL** (44/55 = 80,0% đúng vạch
  sau 2 FAIL nữa; FAIL thứ 3 → 44/56 = 79%). Chế độ tải 30fps n=39:
  median 1,030, PASS 34/39 (87%).
- **Pool 30fps KHÔNG CÒN PHỤ THUỘC lần phồng:** không có W6 e1-run1
  (1,82×) pool vẫn 43/52 = 83% (median 0,980); không có cả hai lần
  phồng (R6 1,58× + W6 1,82×) vẫn 42/51 = 82% — trên 80% cả hai
  trường hợp. W6 cảnh báo "bỏ lần 1,82× là 79,5%" nay KHÔNG còn
  đúng, nhờ 8 lần PASS mới của X6.
- **Metric mới M2 (frozen-safe) — ĐÃ ĐO + ĐÃ CÀI, chưa thay G5:**
  loại tỉ lệ có mẫu số kề < 0,5 fps rồi lấy MEDIAN các tỉ lệ còn
  lại. Tính lại trên toàn bộ 58 report còn fpsSlots (R6→X6): E1
  22/26 PASS (85%) → M2 20/26 (77%); N10 32/32 (100%) → M2 29/32
  (91%); chân yên 30fps (tập con n=10) G5 9/10 → M2 8/10 = 80%
  đúng vạch. **M2 lật 5/58 verdict — và 1 trong 5 là lần yên của
  chính X6 (e1-run6: G5 0,99 PASS → M2 0,63 FAIL).** Xem §3.3.
- **Fetch up-loop E1 — ĐÃ SỬA + ĐÃ CHỨNG MINH bằng fault-injection
  trước/sau:** trước-fix treo vĩnh viễn (bị `timeout 45` giết,
  exit 124); sau-fix thoát sau 15s, exit 2, chẩn đoán đúng "cổng
  bị chiếm". Smoke-test đường thường sau fix: e1-run8 10/10, G5
  1,13×, pixel giống hệt lịch sử.
- **Nhiễu giữa cửa sổ đo:** sibling X2 sửa `preview.tsx` lúc
  08:58:45Z, giữa 2 lần N10 — E1 không ảnh hưởng (xong trước đó),
  N10 run1–2 chạy code cũ, run3–5 chạy code mới; bằng chứng cho
  thấy KHÔNG ảnh hưởng số deint (xem §3.4).

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy
yên. CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round96-x6/analyze-pool96x6.py` (kế thừa
`analyze-pool95w6.py`, cùng công thức; pool gốc = pool W6 đã công bố
n=45/n=32 — script kiểm lại tái tạo đúng số W6 trước khi thêm lần
X6; JSON gộp: `benchmarks/results/g1-evidence-v8-96x6.json`).

### 2.1 Từng cửa sổ 5 lần (luật b) — chỉ cửa sổ đổi so với W6

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| W6 60fps 5 mới nhất (đợt 95) | tải 5 / yên 0 (2,51; 2,74; 2,14; 1,59; 2,73) | 1,09 / 0,98 / 1,09 / 1,10 / 0,75 | 1,090 | 5/5 | PASS ỔN ĐỊNH | [0,817; 1,187] |
| **X6 60fps 5 mới nhất = cửa sổ X6 riêng (đợt 96)** | **tải 3 / yên 2 (8,07; 13,94; 17,74; 5,99; 3,75)** | **0,81 / 1,03 / 0,87 / 1,19 / 0,99** | **0,990** | **5/5** | **PASS ỔN ĐỊNH** | **[0,794; 1,162]** |
| X6 30fps 8 lần riêng | yên 6 / tải 2 | 1,02 / 0,97 / 0,84 / 1,00 / 1,23 / 0,99 / 1,05 / 1,13 | 1,010 | 8/8 | — (n=8) | [0,933; 1,125] |

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5+Q7+R6+S6+T6+U6+V5+W6+X6) | 53 | 0,990 | 0,978 | 0,230 | [0,914; 1,041] | 44/53 (83%) | PASS ỔN ĐỊNH (biên 2 FAIL) |
| 30fps — máy tải (<10 fps) | 39 | 1,030 | 1,004 | 0,243 | [0,926; 1,082] | 34/39 (87%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps) | 14 | **0,955** | 0,904 | 0,175 | **[0,803; 1,005]** | **10/14 (71%)** | **2/3 tiêu chí (PASS chưa đạt)** |
| **60fps fixture (M1+N10+R6+S6+T6+U6+V5+W6+X6)** | **37** | **0,980** | **0,977** | **0,153** | **[0,927; 1,027]** | **35/37 (95%)** | **PASS ỔN ĐỊNH** |
| 60fps — máy tải (<10 fps) | 27 | 0,980 | 0,981 | 0,177 | [0,912; 1,049] | 25/27 (93%) | PASS ỔN ĐỊNH |
| **60fps — máy yên (≥10 fps)** | **10** | **0,970** | **0,967** | **0,054** | **[0,928; 1,006]** | **10/10 (100%)** | **PASS ỔN ĐỊNH** |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 90 | 0,980 | 0,977 | 0,201 | [0,935; 1,020] | 79/90 (88%) | trên ngưỡng |
| X6 riêng 30fps (8 lần) | 8 | 1,010 | 1,029 | 0,115 | [0,933; 1,125] | 8/8 (100%) | — |
| X6 riêng 60fps (5 lần) | 5 | 0,990 | 0,978 | 0,148 | [0,794; 1,162] | 5/5 (100%) | PASS ỔN ĐỊNH |

### 2.3 Tiêu chí nào đạt / chưa đạt (so với W6)

| Tiêu chí | W6 (n=45/32) | X6 (n=53/37) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 0,950 ✓ | 0,990 ✓ | +0,04 |
| Pool 30fps PASS ≥ 80% | 36/45 = 80% ✓ (biên 0) | **44/53 = 83% ✓ (biên 2 FAIL)** | **+3 điểm; không còn phụ thuộc lần phồng** |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,896 ✓ | 0,914 ✓ | +0,018 |
| 30fps tải n≥20: median + PASS + CI | 1,010 / 86% / 0,917 ✓✓✓ | **1,030 / 87% / 0,926 ✓✓✓** | cả ba đều nhích lên |
| 30fps yên: median + PASS + CI cận dưới | 0,805 / 50% / 0,683 (1/3) | **0,955 / 71% / 0,803 (2/3)** | **tiến 1 tiêu chí; cần 6 PASS yên liên tiếp nữa** |
| **60fps: median + PASS + CI** | **0,970 / 94% / 0,922 ✓✓✓** | **0,980 / 95% / 0,927 ✓✓✓** | **cả ba đều nhích lên** |
| 60fps cửa sổ 5 mới nhất luật (b) | median 1,09, 5/5 → PASS | median 0,99, 5/5 → PASS | giữ PASS lần 7 liên tiếp; lần thấp nhất 0,81 (trên 0,75 của W6) |
| **60fps yên** | **n=8, CI [0,936; 1,007], 8/8 PASS** | **n=10, CI [0,928; 1,006], 10/10 PASS** | **thêm 2 mẫu yên, vẫn 3/3 tiêu chí** |
| Cửa sổ trượt 5 lần 30fps PASS | 31/41 | 36/49 | +5 cửa sổ PASS; **4 cửa sổ mới nhất đều PASS 5/5** (lần đầu từ W6) |
| Pearson(ratio, baselineFps) 30fps | −0,332 (n=45) | −0,281 (n=53) | yếu đi (hàm chế độ máy mờ dần) |

**Đọc bảng đúng:** chân yên 30fps tiến thật (6 mẫu mới, 6/6 PASS,
CI cận dưới vượt 0,75 lần đầu tiên) nhưng PASS mới 71% — đừng trích
"yên đã đạt" hay "còn 6 lần nữa" mà không ghi cả hai. Pool 30fps
83% nay có biên 2 FAIL và đứng được cả khi bỏ hai lần phồng — nhưng
vẫn là pool gộp trộn hai chế độ, không phải verdict. 60fps dày lên
ở mọi chiều, và cửa sổ X6 có 2 lần yên (khác W6 toàn tải nặng) nên
median 0,99 đáng tin hơn median 1,09 của W6.

## 3. Cửa sổ X6 mới — chi tiết từng lần

### 3.1 60fps deint-only ×5 (probe N10) — 08:56–09:05Z — 5/5 PASS

Lệnh (mỗi lần, tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round96-x6/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | M2 | Kết quả |
|---|---|---|---|---|---|---|---|---|
| 1 | 08:56–08:58 | 6,67 | 2239 MB | 8,07 fps | 1,00 / 0,62 / 0,67 / 0,87 / 0,88 | **0,81×** | 0,87 | PASS, 4/4 (code trước X2) |
| 2 | 08:58–08:59 | 1,58 | 1884 MB | 13,94 fps | 1,00 / 1,33 / 1,12 / 1,12 / 0,60 | **1,03×** | 1,12 | PASS, 4/4 (code trước X2, yên) |
| 3 | 08:59–09:01 | 1,20 | 2206 MB | 17,74 fps | 0,77 / 0,86 / 1,03 / 0,53 / 1,17 | **0,87×** | 0,86 | PASS, 4/4 (code sau X2, yên) |
| 4 | 09:01–09:03 | 4,08 | 2540 MB | 5,99 fps | 1,19 / 0,79 / 2,25 / 0,86 / 0,88 | **1,19×** | 0,88 | PASS, 4/4 (code sau X2) |
| 5 | 09:03–09:05 | 11,08 | 1917 MB | 3,75 fps | 0,58 / 1,58 / 1,49 / 0,87 / 0,43 | **0,99×** | 0,87 | PASS, 4/4 (code sau X2) |

Tốc độ tuyệt đối (draw fps):

| Lần | Baseline draw (6 slot) | Combo draw (5 slot) | Slot đóng băng (<0,5 fps) |
|---|---|---|---|
| X6-1 | 9,13 / 6,62 / 10,33 / 6,60 / 8,57 / 7,15 (mean 8,07) | 7,90 / 5,23 / 5,66 / 6,57 / 6,89 | không |
| X6-2 | 20,93 / 23,18 / 9,95 / 7,48 / 8,70 / 13,37 (mean 13,94) | 22,00 / 22,11 / 9,76 / 9,09 / 6,58 | không |
| X6-3 | 17,26 / 20,56 / 23,46 / 6,89 / 16,09 / 22,19 (mean 17,74) | 14,49 / 18,90 / 15,58 / 6,04 / 22,39 | không |
| X6-4 | 2,44 / 4,79 / 10,15 / 4,65 / 6,86 / 7,04 (mean 5,99) | 4,31 / 5,92 / 16,68 / 4,97 / 6,13 | không |
| X6-5 | 8,52 / 2,00 / 3,51 / 2,27 / 1,97 / 4,21 (mean 3,75) | 3,04 / 4,35 / 4,30 / 1,85 / 1,32 | không |

- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 5/5 lần và giống hệt
  M1/N10/R6/S6/T6/U6/V5/W6 — deint áp thật trên fixture 60fps, đường
  code không đổi. Đặc biệt: MAD giống hệt nhau giữa run1–2 (code
  trước X2) và run3–5 (code sau X2) — sửa blend của X2 không đổi
  pixel deint (xem §3.4).
- **C3 0 lỗi trang cả 5 lần.** Không có dấu EPERM trong log 5 lần
  đo (grep `EPERM|Operation not permitted` trên run log: 0 kết quả).
- **Run4 1,19× (G5) nhưng M2 chỉ 0,88×:** tỉ lệ 2,25× đơn lẻ kéo
  mean lên; median 0,88 mới là tỉ lệ điển hình của lần này — ví dụ
  sống cho vì sao cần M2 (xem §3.3).
- **Run1 0,81× là lần 60fps thấp nhất của X6** nhưng vẫn trên ngưỡng
  với biên 0,06 — tốt hơn lần thấp nhất của W6 (0,75× đúng ngưỡng).
- **Cửa sổ X6 có 2 lần yên (baseline 13,94 / 17,74 fps)** — lần đầu
  cửa sổ 60fps có mẫu yên kể từ V5; median 0,99 không còn là số của
  riêng máy tải nặng như W6 (1,09).

### 3.2 E1 30fps ×7 (+1 smoke-test) — 08:42–09:14Z — 8/8 PASS

Lệnh (mỗi lần, tuần tự): `E1_SCRATCH=hidden_files/round96-x6/e1-runN
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (cổng :5580 /
debug :9680 / display :180, tự pick — cả 8 lần X6 đều dùng chung
:5580/:9680/:180 tuần tự; fixture 30fps, 11 slot × 3s xen kẽ).
**Đo E1 TRƯỚC N10 trong lượt này** (ngược W6) để bắt cửa sổ yên
ngay đầu lượt, trước khi sibling spin probe nặng — và đã bắt được:
6/7 lần yên.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | G5 mean | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 08:42–08:44 | 1,18 | 1040 MB | 24,19 fps | **1,02×** | 1,03 | **10/10 PASS (yên)** |
| 2 | 08:44–08:46 | 2,73 | 1980 MB | 25,07 fps | **0,97×** | 1,00 | **10/10 PASS (yên)** |
| 3 | 08:46–08:48 | 2,19 | 1705 MB | 27,58 fps | **0,84×** | 0,90 | **10/10 PASS (yên)** |
| 4 | 08:48–08:50 | 1,89 | 1644 MB | 18,21 fps | **1,00×** | 1,09 | **10/10 PASS (yên)** |
| 5 | 08:50–08:52 | 2,40 | 2612 MB | 14,67 fps | **1,23×** | 1,07 | **10/10 PASS (yên)** |
| 6 | 08:52–08:54 | 2,27 | 2078 MB | 12,96 fps | **0,99×** | **0,63 FAIL** | **10/10 PASS (yên) — nhưng M2 FAIL** |
| 7 | 08:54–08:56 | 9,06 | 2383 MB | 8,33 fps | **1,05×** | 1,07 | **10/10 PASS (tải)** |
| 8 | 09:11–09:14 | 10,55 | 2262 MB | 4,92 fps | **1,13×** | 1,14 | **10/10 PASS (tải) — smoke-test sau fix timeout** |

| Lần | Slot draw fps (B/D xen kẽ, slot 0–10) | 5 tỉ lệ | Slot đóng băng |
|---|---|---|---|
| 1 | 24,69 / 25,56 / 21,59 / 24,19 / 27,12 / 27,13 / 25,49 / 27,78 / 24,13 / 19,86 / 22,13 | 1,10 / 0,99 / 1,03 / 1,12 / 0,86 | không |
| 2 | 21,37 / 26,75 / 28,22 / 26,24 / 24,33 / 18,18 / 24,14 / 26,42 / 26,93 / 25,77 / 25,41 | 1,08 / 1,00 / 0,75 / 1,03 / 0,98 | không |
| 3 | 25,51 / 23,92 / 27,43 / 26,85 / 28,39 / 27,42 / 28,05 / 25,45 / 29,23 / 12,91 / 26,88 | 0,90 / 0,96 / 0,97 / 0,89 / 0,46 | không |
| 4 | 16,59 / 18,78 / 21,57 / 25,61 / 25,22 / 25,93 / 14,92 / 8,39 / 21,86 / 18,20 / 9,11 | 0,98 / 1,09 / 1,29 / 0,46 / 1,18 | không |
| 5 | 22,93 / 21,59 / 6,14 / 17,82 / 27,16 / 10,13 / 8,92 / 25,32 / 13,55 / 9,04 / 9,31 | 1,49 / 1,07 / 0,56 / 2,25 / 0,79 | không |
| 6 | 5,46 / 8,11 / 26,75 / 8,72 / 8,95 / 24,79 / 9,62 / 9,04 / 18,95 / 8,74 / 8,05 | 0,50 / 0,49 / 2,67 / 0,63 / 0,65 | không |
| 7 | 8,23 / 9,57 / 10,26 / 7,46 / 7,79 / 8,69 / 7,61 / 8,68 / 8,64 / 9,70 / 7,42 | 1,04 / 0,83 / 1,13 / 1,07 / 1,21 | không |
| 8 | 4,19 / 4,49 / 3,54 / 2,60 / 3,86 / 8,95 / 6,93 / 7,08 / 5,46 / 5,52 / 5,52 | 1,16 / 0,70 / 1,66 / 1,14 / 1,01 | không |

- **Run1 (1,02×) là lần E1 yên sạch nhất từ trước tới nay:** baseline
  24,19 fps, tỉ lệ 0,86–1,12 (biên hẹp nhất trong toàn bộ pool yên),
  không slot đóng băng — đo ngay đầu lượt sau reboot #17, load 1,18.
- **Run6 (G5 0,99× PASS nhưng M2 0,63× FAIL):** 4/5 tỉ lệ slot dưới
  ngưỡng (0,50 / 0,49 / 0,63 / 0,65), mean chỉ được kéo lên bởi một
  slot 2,67× (slot deint 5 chạy 24,79 fps lúc máy thoáng tải). Nhìn
  slot thô mới thấy rõ: các slot deint chạy đều ~8–9 fps, còn slot
  baseline dao động 5,46–26,75 fps (hai slot baseline vọt 26,75 /
  18,95 fps làm 3 tỉ lệ còn lại sụt xuống ~0,5–0,65). Đây là lần yên
  "PASS giả" rõ nhất từng đo được — G5 nói PASS, nhưng 4/5 slot
  thực tế chạy chậm hơn baseline. M2 bắt được, G5 không (xem §3.3).
  Lưu ý: chính baseline mean 12,96 fps ("yên") cũng bị kéo lên bởi
  hai slot baseline vọt — phân loại yên/tải theo baseline mean
  cũng nhiễm nhiễu spike.
- **Run5 (1,23×):** tỉ lệ 2,25× đơn lẻ + 1,49× kéo mean lên; M2
  1,07 — vẫn PASS nhưng khiêm tốn hơn nhiều.
- **Run3/Run4 có tỉ lệ 0,46× đơn lẻ** (slot deint kẹt) nhưng median
  vẫn PASS — nhiễu slot tồn tại cả trên máy yên: tỉ lệ trong một lần
  dao động 0,46–1,29 (run4), 0,49–2,67 (run6). Máy "yên" theo
  baseline mean vẫn không yên ở粒度 slot.
- **Run7 chuyển tải đúng lúc load vọt 9,06** (sibling dậy lúc
  ~08:54Z) — ranh giới yên/tải của lượt này nằm giữa run6 và run7.
  Loadavg lúc bắt đầu vẫn KHÔNG dự báo được chế độ trong phiên
  (run2 bắt đầu 2,73 nhưng baseline 25,07 fps; run7 bắt đầu 9,06
  nhưng baseline vẫn 8,33 fps — như V5/W6 đã ghi).
- **Pixel cả 8 lần giống hệt lịch sử:** G2 MAD 0,5821; G7a 0,6903;
  G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt
  N5/Q7/R6/S6/T6/U6/V5/W6). **H9 0 lỗi trang cả 8 lần.** Không có dấu
  EPERM trong log 8 lần đo (grep 0 kết quả). Run8 (sau fix timeout)
  pixel cũng giống hệt — fix không đổi đường đo.
- **0 slot đóng băng trong cả 13 lần đo X6** (E1 ×8 + N10 ×5) — lần
  đầu tiên kể từ đợt 93 không có slot đóng băng nào; cửa sổ yên
  sạch là một phần nguyên nhân.

### 3.3 Metric mới M2 (frozen-safe) — đề xuất + đo

**Định nghĩa (đã cài vào `deint-fps-verdict-83k3.mjs` dạng hàm
`g5FrozenSafeFromReport`, kèm 5 test hồi quy — xem §5):** với mỗi
lần đo, lấy 5 tỉ lệ drift-corrected như G5; **loại tỉ lệ có mẫu số
kề (baseline) < 0,5 fps** (slot đóng băng — không mang thông tin
tốc độ); rồi lấy **MEDIAN** các tỉ lệ còn lại; cần ≥3 tỉ lệ hợp lệ
mới verdict (dưới 3 → không verdict, không bịa số). Slot deint đóng
băng (tử số 0) vẫn GIỮ — deint kẹt thật là tín hiệu, không phải
artefact. Trả kèm M2mean (mean sau khi loại), M2b (tỉ lệ thô
mean-deint/mean-baseline), M2c (median 5 tỉ lệ cũ, không loại) để
đối chiếu. **G5 KHÔNG đổi** — M2 là metric song song, chưa thay G5
(cần parent quyết).

**Vì sao cần cả loại + median (hai chế độ phồng khác nhau):**
- (A) Mẫu số đóng băng — W6 e1-run1: tỉ lệ 4,27× do mẫu số kề 0,15
  fps; G5 cả lần 1,82×, M2 1,00×. Chỉ loại đã sửa được.
- (B) Tử số đột biến — R6 e1-verify-run1: tỉ lệ 4,34× do slot deint
  8,4 fps trong lúc máy thoáng tải (mẫu số kề 1,94 fps bình thường);
  G5 cả lần 1,58×, M2 0,86×; tỉ lệ thô còn phồng hơn (1,69×). Chỉ
  median mới sửa được.
- Tính lại trên toàn bộ 58 report còn fpsSlots trên đĩa (R6→X6;
  các lần I5–Q7/M1/N10-đầu không còn fpsSlots nên pool đầy đủ KHÔNG
  tính lại được dưới M2 — đừng trích số M2 pool như số pool đầy đủ):

| Tập con (có fpsSlots) | G5 | M2 | Lật verdict |
|---|---|---|---|
| E1 30fps n=26 | median 1,020, PASS 22/26 (85%), SD 0,252 | median 1,000, PASS 20/26 (77%), SD 0,196 | 2: W6 run5 0,91→0,72; X6 run6 0,99→0,63 |
| N10 60fps n=32 | median 0,985, PASS 32/32 (100%), SD 0,143 | median 0,965, PASS 29/32 (91%), SD 0,158 | 3: R6 run2 0,81→0,72; U6 run5 0,83→0,70; W6 run5 0,75→0,62 |
| Chân yên 30fps n=10 | median 0,995, PASS 9/10 (90%) | median 1,000, PASS 8/10 (80%) | 1: X6 run6 (lần yên) |
| Chân yên 60fps n=10 | median 0,965, PASS 10/10 (100%) | median 0,980, PASS 10/10 (100%) | 0 |

- **M2 chặt hơn G5 ở cả hai fixture** (E1 −8 điểm PASS, N10 −9
  điểm) — vì mean luôn bị kéo lên bởi outlier cao, median gỡ
  phần kéo đó. M2 không lật chiều nào khác ngoài PASS→FAIL trong
  58 lần (0 lần FAIL→PASS).
- **M2mean (chỉ loại, giữ mean):** E1 21/26 (81%), N10 32/32 (100%)
  — chứng tỏ bước median, không phải bước loại, mới là phần làm
  M2 chặt hơn ở phần lớn các lần (chỉ W6 run1 là cần bước loại).
- **Khuyến nghị:** áp M2 làm metric song song từ đợt sau (ghi cả G5
  và M2 mỗi lần); KHÔNG lặng lẽ thay G5 trong pool cho đến khi
  parent quyết, vì M2 phân loại lại 5/58 lần lịch sử và pool đầy
  đủ không tính lại được.

### 3.4 Nhiễu giữa cửa sổ: sibling X2 sửa `preview.tsx` lúc 08:58:45Z

Kỷ luật mtime trước/sau phát hiện `apps/web/src/preview.tsx` đổi
mtime trong cửa sổ đo (06:15:41Z → 08:58:45Z): sibling X2 đợt 96
sửa đường motion-blur blend (sửa tập ghost sai, nợ W4 §1.6/§6.1) +
thêm trường debug `lastDrawnPresentedFrame`.

- **E1 không ảnh hưởng:** cả 7 lần E1 chính xong lúc 08:56:39Z,
  trước khi sửa 08:58:45Z. (Run8 smoke-test chạy 09:11Z, sau khi
  sửa — nhưng pixel G2/G7a/G7b/G8 giống hệt lịch sử, chứng tỏ đường
  deint không đổi.)
- **N10 run1 (mount 08:57:01Z) + run2 (mount 08:58:36Z) chạy code
  cũ; run3–5 (mount 09:00:09Z / 09:01:38Z / 09:03:23Z) chạy code
  mới** (vite `hmr: false` — trang load code có tại lúc mount).
- **Vì sao không ảnh hưởng số deint:** code X2 đổi chỉ chạy khi
  `ghostWeights.length > 0` / `vis.motion.motionBlur`
  (preview.tsx:3018) — cấu hình N10 deint-only không có motion
  blur nên đường đó không thực thi trong slot FPS. Bằng chứng thực
  nghiệm: D1 MAD 0,3835 giống hệt 5/5 lần (cả trước và sau sửa),
  5/5 lần 4/4, tỉ lệ không lệch hệ thống (trước sửa 0,81/1,03; sau
  sửa 0,87/1,19/0,99). **Giữ cả 5 lần N10 trong pool, ghi rõ phiên
  bản code từng lần** (xem JSON `runs_60fps_n10[].code_version`).
- Bài học cho đợt sau: đo E1/N10 cần khóa mtime hoặc ghi lại commit
  nội dung file phụ thuộc trước/sau mỗi lần — vòng lặp song song
  sửa cùng file là rủi ro thường trực (đợt này may là đường code
  không giao nhau).

### 3.5 Fetch up-loop E1 — đã sửa + chứng minh trước/sau (U6 §7.1)

**Vấn đề:** `clicktest-77e1-deint-fps.mjs` vòng up-loop fetch `DEV_URL`
KHÔNG có timeout — listener TCP thô giữ kết nối mở (nc trơn, không
`-w`) làm fetch đầu tiên treo vĩnh viễn, vòng lặp không bao giờ kịp
kiểm tra `vite.exitCode`.

**Chứng minh TRƯỚC-fix (fault-injection có kiểm soát, scratch
`hidden_files/round96-x6/fault-inject-nc/`):** nc trơn giữ :5580
(curl probe `--max-time 3` exit 28 = timeout, kết nối bị giữ); chạy
E1 với `E1_DEV_PORT=5580` bọc `timeout 45` → **exit 124 sau 45s**
(bị giết — treo thật); không vite/chrome nào spawn; :5580 free lại
sau khi kill nc.

**Sửa (harness duy nhất, marker "Đợt 96 X6"):** fetch up-loop nay
`fetch(DEV_URL, { signal: AbortSignal.timeout(2000) })` — cùng
timeout 2s đã dùng cho fetch `portStillServes` trong cùng file.
Mỗi vòng lặp nay tối đa 2s + 1s sleep rồi kiểm tra `vite.exitCode`.

**Chứng minh SAU-fix (cùng nc trơn giữ :5580):** E1 **exit 2 sau
15s** (3 lần thử × ~5s), chẩn đoán đúng **"cổng bị chiếm"**
(`Port 5580 is already in use` ×3 trong vite log),
`portStillServes=false` ×3, media probe không chạy. Không process
mồ côi; :5580 free lại.

**Smoke-test đường thường sau fix (e1-run8):** exit 0, 10/10, G5
1,13×, baseline 4,92 fps (tải), pixel G2 MAD 0,5821 / G7a 0,6903 /
G7b 0,0119 giống hệt lịch sử — fix không đổi đường đo. Tính vào pool
như 1 lần tải (xem §3.2).

**Nợ còn lại:** hai fetch không-timeout khác trong cùng file KHÔNG
sửa (ngoài phạm vi brief): media probe fetch (sau khi vite đã lên)
và vòng CDP `/json/list` fetch (cùng kiểu treo nếu peer giữ kết
nối). Ghi để đợt sau quyết.

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của X6: KHÔNG đóng G1 toàn vẹn. Phương án A (đóng một
phần) nay MẠNH HƠN W6 ở chân yên 30fps nhưng vẫn CHƯA đủ điều kiện.
Quyết định cuối thuộc parent/user.**

- **Phương án A — Đóng một phần: deint ĐẠT ở chế độ tải, cả 30fps
  lẫn 60fps + chân yên 60fps (ĐỀ XUẤT XEM XÉT, có điều kiện — như
  W6, cập nhật số):** 30fps-tải n=39: median 1,030×, mean 1,004,
  CI cận dưới 0,926, 34/39 PASS = 87%; 60fps-tải n=27: median
  0,980×, mean 0,981, CI cận dưới 0,912, 25/27 PASS = 93%;
  **60fps-yên n=10: median 0,970×, mean 0,967, CI [0,928; 1,006],
  10/10 PASS = 100% — cả ba tiêu chí chặt vẫn đạt**; cửa sổ 5 lần
  60fps mới nhất PASS luật (b) **lần thứ bảy liên tiếp**, median
  0,99 (có 2 lần yên, đáng tin hơn median 1,09 toàn-tải của W6).
  - Điều kiện đóng (bắt buộc ghi kèm): (i) verdict "PASS" chỉ đúng
    ở chế độ tải / máy yếu + chân yên 60fps; chân yên 30fps vẫn
    CHƯA đạt đủ tiêu chí (PASS 10/14 = 71%, CI cận dưới 0,803 đã
    đạt, median 0,955 đã đạt — **2/3, thiếu mỗi PASS ≥80%**) —
    không được gộp vào verdict đóng; (ii) không trích số pool gộp
    (0,980× / 95% ở 60fps; 0,990× / 83% ở 30fps) như verdict duy
    nhất — pool gộp trộn hai chế độ nên không có nghĩa; (iii) **pool
    30fps nay biên 2 FAIL (44/53 = 83%) — và nay KHÔNG còn phụ
    thuộc lần phồng (bỏ cả hai lần phồng vẫn 42/51 = 82%)**;
    (iv) **chân yên 30fps cần 6 lần PASS liên tiếp nữa (16/20 =
    80%)** — đã đi được nửa đường từ 12 lần của W6; (v) **dưới
    metric M2, chân yên 30fps (tập con n=10) đúng vạch 80% (8/10)
    nhưng 1 trong 6 lần yên mới của X6 lật thành FAIL (run6 0,99
    → 0,63) và 4 lần yên cũ không tính lại được** — đừng trích
    "yên 80%" mà không ghi tên metric và tập con; (vi) cửa sổ
    trượt 30fps mới nhất (49–53) PASS 5/5 (median 1,05) — lần đầu
    từ W6, nhưng luật (b) trên 1 cửa sổ 5 lần không phải verdict
    pool.
  - Vì sao X6 không đề xuất đóng toàn vẹn: (1) chân yên 30fps vẫn
    thiếu 1/3 tiêu chí chặt (PASS 71% < 80%); (2) dưới M2, chính
    cửa sổ yên mới nhất của X6 cũng có 1 lần FAIL (run6) — G5 nói
    6/6 PASS yên nhưng M2 nói 5/6, và 4/5 tỉ lệ slot của run6
    dưới ngưỡng; (3) nhiễu slot vẫn lớn ngay cả trên máy yên
    (run6: 0,49–2,67 trong một lần); (4) metric tỉ lệ FPS vẫn là
    hàm của chế độ máy (Pearson −0,281) — nay có M2 làm metric
    song song nhưng parent chưa chọn metric nào làm chuẩn.
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5/Q7/R6/S6/T6/U6/V5/W6.
  X6 làm phương án này TIẾN ĐƯỢC MỘT BƯỚC LỚN: M2 nay đã đo trên
  58 lần + đã cài vào verdict script + 5 test hồi quy xanh. M2
  chặt hơn G5 ở cả hai fixture và bắt được lần "PASS giả" (X6
  run6). Đề xuất: từ đợt sau ghi cả G5 và M2 mỗi lần; parent quyết
  có thay G5 bằng M2 trong pool hay không (lưu ý: pool đầy đủ không
  tính lại được dưới M2).
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5/Q7/R6/S6/T6/U6/V5/W6.
  X6 chứng minh phương án này KHẢ THI: đo E1 ngay đầu lượt, trước
  khi sibling spin probe nặng, lấy được 6/7 lần yên trong một cửa
  sổ (W6: 0/7). Công thức lặp lại được: reboot → đo E1 đầu tiên →
  mục tiêu 6 lần PASS yên liên tiếp nữa (16/20 = 80%). Nhưng lưu
  ý: cửa sổ yên đóng lại nhanh (run7 đã tải khi load vọt 9,06) —
  mỗi lượt chỉ có ~15 phút đầu để bắt mẫu yên.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 95%/83% mà
  bỏ qua chân yên 30fps; trích pool 30fps "83%" như số chắc (biên
  chỉ 2 FAIL); trích "yên 6/6 PASS" mà không ghi M2 lật 1 lần
  thành FAIL; trích median yên 30fps 0,955 như số chắc (n=14 vẫn
  nhỏ, PASS mới 71%); trích 1,23× của e1-run5 hay 1,19× của
  60fps-run4 như tốc độ deint (M2 của hai lần này chỉ 1,07× /
  0,88×); trích "5 lần 60fps đều PASS" mà không ghi lần thấp nhất
  chỉ 0,81×.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ đo + sửa harness (E1 timeout fix, M2) |
| `node --test vite-diagnosis-regex-92t6.test.mjs` | **9/9** chạy lại xanh |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** chạy lại xanh (12 cũ + 5 M2 mới) |
| `node --check` 2 file script đã sửa | **PASS** cả hai |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm (chỉ thêm LIMITS + JSON số đo + file trong hidden_files + sửa 2 script harness JS), cùng tiền lệ U6/V5/W6 |
| Cửa sổ X6 E1 30fps ×8 headed | run1–8 **10/10** (1,02 / 0,97 / 0,84 / 1,00 / 1,23 / 0,99 / 1,05 / 1,13; yên 6 / tải 2) |
| Cửa sổ X6 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 5/5 PASS** (0,81 / 1,03 / 0,87 / 1,19 / 0,99), 4/4 cases mỗi lần |
| Gộp pool tính lại (`analyze-pool96x6.py`) | tái tạo đúng số W6 đã công bố khi chạy trên pool cũ (pool 30 n=45 PASS 36/45, pool 60 n=32 PASS 30/32) trước khi thêm lần X6; 13 lần X6 mới tính lại từ fpsSlots khớp G5/ratioMean đã ghi — xem lưu ý làm tròn §5.1; frozenSlots khớp tính lại cả 8 lần E1 |
| M2 tính lại (`analyze-m2-metric.py`) | 58 report còn fpsSlots (R6→X6) tính lại khớp hàm `g5FrozenSafeFromReport` (test hồi quy dùng đúng số W6 run1 / R6 run1 / X6 run1) |
| Fault-injection timeout E1 (U6 §7.1) | trước-fix: exit 124 sau 45s (treo); sau-fix: exit 2 sau 15s, chẩn đoán "cổng bị chiếm" đúng; smoke-test e1-run8 10/10 sau fix; **kiểm lại bởi X6b sau reboot #18 (12/11 10:11Z): fault-injection chạy lại exit 2 sau đúng 15s, chẩn đoán "cổng bị chiếm" đúng, nc đã kill, :5580 free lại — log tại hidden_files/round96-x6b-fault-inject/** |
| Headed H9/C3 (mọi lần chạy X6) | **0 lỗi trang** (E1 10/10 ×8, 60fps 4/4 ×5) |
| Pixel D1 60fps (X6) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1/N10/R6/S6/T6/U6/V5/W6 — tap áp thật; giống hệt cả trước/sau sửa X2 |
| Pixel G2/G7a/G7b/G8 E1 (cả 8 lần) | giống hệt N5/Q7/R6/S6/T6/U6/V5/W6 (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522) |
| `preview.tsx` / `playheadPacing.ts` / `media.ts` | X6 không chạm; X2 (sibling) sửa `preview.tsx` lúc 08:58:45Z — xem §3.4 (không ảnh hưởng số deint) |
| Không process mồ côi của X6 sau đo | không vite/chrome nào dùng scratch round96-x6 còn chạy; nc holder đã kill tay sau mỗi lần fault-injection, :5580 free lại; socket X `/tmp/.X11-unix/X180` còn lại sau lần E1 là hành vi cũ như S6/T6/U6/V5/W6 |

### 5.1 Lưu ý làm tròn khi tính lại (không phải lỗi số liệu)

- 60fps run4: script gộp tính lại tỉ lệ từ `drawFps` đã lưu trong
  JSON (làm tròn 2 chữ số thập phân) nên lệch 0,01: tính lại 1,20 so
  với report 1,19. Đối chứng bằng trường `ratios` của chính report:
  trung bình `ratios` = 1,194 → 1,19 — khớp `ratioMean` đã ghi.
  Pool dùng đúng `ratioMean` của report (như V5/W6 §5.1).
- Các lần còn lại: KHOP hoàn toàn (tính lại = report) cả 12 lần
  đo chính + run8.

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — X6 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn.
2. **Pool 30fps 83% (44/53) — biên 2 FAIL.** Thêm 2 FAIL nữa là về
   đúng vạch 80% (44/55); FAIL thứ 3 là rơi dưới 80% (44/56 = 79%).
   Đừng trích 83% như số chắc — và đừng trích mà không ghi đây là
   pool gộp trộn hai chế độ.
3. **Chân yên 30fps tiến thật nhưng chưa đạt: n=14, median 0,955,
   PASS 10/14 (71%), CI cận dưới 0,803 — 2/3 tiêu chí.** Cần 6 lần
   PASS yên liên tiếp nữa (16/20 = 80%). Dưới M2, tập con n=10
   là 8/10 = 80% đúng vạch — nhưng 4 lần yên cũ không tính lại
   được dưới M2, và X6 run6 lật FAIL dưới M2.
4. **M2 chặt hơn G5 — và đó là chủ đích.** M2 lật 5/58 verdict lịch
   sử (toàn PASS→FAIL, 0 lần ngược lại). Pool đầy đủ KHÔNG tính
   lại được dưới M2 (các lần I5–Q7/M1/N10-đầu mất fpsSlots). Đừng
   trích "M2 pool 77%/91%" như số pool đầy đủ — đó là số tập con
   R6→X6.
5. **Nhiễu slot vẫn lớn ngay cả trên máy yên:** X6 run6 tỉ lệ
   0,49–2,67 trong một lần; run4 0,46–1,29; run5 0,56–2,25.
   Baseline mean ≥10 fps ("máy yên") không có nghĩa từng slot yên.
   Đừng trích một lần đo đơn lẻ (vd 1,23×) như tốc độ deint.
6. **Pool 60fps 95% (35/37) dày hơn** nhưng 2 lần FAIL trong pool
   đều là lần cũ (M1 run4 0,62×, M1 run5 0,73×); 5 lần X6 đều PASS
   nhưng lần thấp nhất chỉ 0,81×. Chân yên 60fps n=10 vẫn nhỏ.
   Không dùng 10 điểm này để nói "deint ngang baseline trên mọi
   máy nhanh".
7. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→X6) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật. Bằng chứng mạnh nhất đợt này: cùng một lần
   yên X6 run6 chứa cả 0,49× và 2,67×.
8. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác).
   Đừng trích chỉ một tiêu chí (CI đạt, tỉ lệ PASS không).
9. **Luật median-5 lật 13/49 cửa sổ trượt 30fps** (36/49 PASS).
   Đừng trích verdict của một cửa sổ 5 lần đơn lẻ như kết luận chắc;
   luôn ghi kèm chế độ đo (baseline mean fps) và cửa sổ. 4 cửa sổ
   mới nhất (46–50 → 49–53) đều PASS 5/5 — lần đầu từ W6.
10. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích
    "combo 0,76×" như tốc độ combo.
11. **e1-run1 của T6 và W6 vẫn giữ trong pool** theo quyết định parent
    đợt 92 (đã chấp nhận, 0 EPERM trong mọi log) — X6 không loại,
    không tranh luận lại, và ghi rõ độ nhạy thay vì loại. Lưu ý:
    pool nay đứng được cả khi loại cả hai lần phồng (42/51 = 82%).
12. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 9–10 luồng song
    song.** Tải sibling là biến số lớn nhất (load 1-phút 1,18–11,08;
    RAM khả dụng 1,0–2,6 GB trong cửa sổ X6). Loadavg lúc bắt đầu
    KHÔNG dự báo được tải trong lúc đo. Cửa sổ yên chỉ mở ~15 phút
    đầu lượt (run7 đã tải khi load vọt 9,06).
13. **Không có sóng EPERM hay port-conflict thật nào trong cửa sổ X6
    (0 dấu EPERM trong 13 log đo + 2 log fault-injection).** Sóng
    thật gần nhất vẫn ~11:55–12:11Z (R7); EPERM KHÔNG tuyên bố đã
    hết.
14. **N10 run3–5 chạy code sau sửa X2** (preview.tsx 08:58:45Z) —
    giữ trong pool với bằng chứng vô hại ở §3.4 (đường đổi không
    thực thi khi deint-only; D1 MAD giống hệt). Nếu parent muốn
    thận trọng hơn thì loại 3 lần này: pool 60fps còn 32/34 = 94%,
    chân yên 60fps còn 8/8 — không đổi kết luận.
15. **Fix timeout chỉ sửa vòng up-loop E1.** Hai fetch không-timeout
    khác trong cùng file (media probe, vòng CDP `/json/list`) vẫn
    mở — cùng kiểu treo nếu peer giữ kết nối.

## 7. Cách chạy lại

```bash
# Do 60fps 1 lan (probe N10, deint-only; doi N10_LABEL moi lan):
N10_LABEL=60fps-deint-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x6/60fps-deint-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Do 30fps 1 lan E1 (doi E1_SCRATCH moi lan; DO E1 TRUOC, ngay dau luot de bat cua so yen):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x6/e1-run1 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Gop so (doc report JSON da co + so da cong bo, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x6/analyze-pool96x6.py
# Tinh M2 tren moi report con fpsSlots (offline):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x6/analyze-m2-metric.py
# Test hoi quy luat median + M2 (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
# Test regex chan doan vite (offline, trich regex that tu source):
node --test apps/web/scripts/vite-diagnosis-regex-92t6.test.mjs
# Fault-injection timeout up-loop (lap lai U6 §7.1, can than — chi sau khi do xong):
#   nc -l -k -p 5580 < /dev/null &  (KHONG -w: giu ket noi)
#   timeout 120 env E1_DEV_PORT=5580 E1_SCRATCH=<scratch-moi> node apps/web/scripts/clicktest-77e1-deint-fps.mjs
#   ky vong: exit 2 sau ~15s, chan doan "cong bi chim"; nho kill nc sau do.
```

## 8. Nợ còn lại cho đợt sau

1. **G1 vẫn MỞ, chờ user quyết** (§4) — chân yên 60fps đủ cả ba
   tiêu chí chặt (n=10), chân yên 30fps mới đạt 2/3 (median 0,955;
   PASS 71%, CI cận dưới 0,803), pool 30fps 83% biên 2 FAIL, cửa
   sổ trượt mới nhất PASS 5/5.
2. **Lấy 6 mẫu yên 30fps PASS liên tiếp nữa** (16/20 = 80%) — công
   thức đã chứng minh được ở X6: reboot → đo E1 ngay đầu lượt,
   trước khi sibling spin probe nặng. Cửa sổ yên chỉ mở ~15 phút
   đầu lượt. Dưới M2, tập con yên là 8/10 — đợt sau ghi cả hai
   metric để parent so.
3. **Parent quyết metric: G5 hay M2 làm chuẩn?** M2 đã đo + đã cài
   + test xanh; G5 vẫn là metric pool chính thức. Nếu chọn M2:
   cần quyết cách xử lý 4 lần yên cũ mất fpsSlots + 5 lần lịch
   sử bị lật verdict.
4. **Hai fetch không-timeout còn lại trong E1** (media probe, vòng
   CDP `/json/list`) — cùng kiểu treo như up-loop, chưa sửa.
5. **Nhiễu slot trên máy yên** (§6 mục 5): tỉ lệ trong một lần yên
   dao động 0,46–2,67 — cần hiểu nguồn nhiễu (load spike từng
   slot? rVFC? decode?) trước khi tin hoàn toàn vào verdict 1 lần.
   M2 (median) giảm nhẹ chứ không hết nhiễu.
6. **Mốc X2 trong cửa sổ đo** (§3.4): vòng lặp song song sửa cùng
   file là rủi ro thường trực — đợt sau nên khóa/ghi mtime file
   phụ thuộc trước/sau MỖI lần đo (X6 chỉ ghi trước/sau cả cửa
   sổ), hoặc đo xong mới cho sibling sửa file chung.
7. **G1 (deint) vẫn mở, chờ user quyết** (§4) — birefnet 0 lần thành
   công (chỉ thử lại khi RAM đổi); EPERM probe #14 ok=2 fail=0,
   còn khoảng mù/reboot không ai ghi nhận; ci-security.yml vẫn 403
   chờ user; TTS 39 CẤM kiểm lại; WebKit clip D, pre-pass keyframes,
   motion blur + mask, trackgeq, fallback, harness O8.
