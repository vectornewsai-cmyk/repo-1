# Đợt 95 W6 — G1 evidence vòng 7 (KHÔNG TỰ ĐÓNG G1)

Ngày: 12/11/2026 (lượt cron 12:35 +07; đo 05:40:50–06:15:18Z).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot 05:18Z trước đợt 95 — boot-id
06a92916-d915-4220-9e96-f7dc42f916ae, uptime 23 phút lúc W6 bắt đầu,
KHÔNG reboot trong cửa sổ đo; RAM khả dụng lúc bắt đầu mỗi lần
1128–2531 MB; load 1-phút lúc bắt đầu mỗi lần 0,95–9,42, cuối cửa sổ
18,20 — 9 luồng đợt 95 chạy song song suốt cửa sổ).
Nợ: LIMITS gộp đợt 94 §4 mục 6 (G1 vẫn MỞ, quyết thuộc user; chân yên
30fps n=8 median 0,805; pool 30fps 82% biên 1 lần FAIL; chân yên 60fps
n=8, 8/8 PASS).

**Trạng thái cuối: G1 VẪN CHƯA ĐÓNG — W6 chỉ đưa số + khuyến nghị, quyết
định cuối thuộc parent/user.** Không sửa production, không đổi ngưỡng,
không đổi metric. Không i18n key mới. Không kiểm lại TTS 39.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **60fps: 5/5 lần W6 mới đều PASS — 1,09 / 0,98 / 1,09 / 1,10 / 0,75
  → pool 60fps nay n=32: median 0,970× (V5: 0,960), mean 0,977,
  SD 0,156, CI 95% [0,922; 1,032], PASS 30/32 (94%)** — dày hơn V5
  (25/27 = 93%). Cửa sổ 5 lần 60fps mới nhất (chính 5 lần W6 — cửa
  sổ đầy đủ): median 1,090, 5/5 PASS → luật (b) PASS ỔN ĐỊNH
  **lần thứ sáu liên tiếp** (R6, S6, T6, U6, V5, W6).
- **Chân yên 60fps KHÔNG ĐỔI: n=8** (cả 5 lần W6 đều tải — baseline
  1,59–2,74 fps, cửa sổ 60fps tải nặng nhất từ trước tới nay),
  median 0,970, 8/8 PASS, CI [0,936; 1,007] — cả ba tiêu chí chặt
  vẫn đạt.
- **30fps: 7 lần W6 mới, 5 PASS / 2 FAIL (1,82 / 0,88 / 1,05 / 1,01 /
  0,91 / 0,74 / 0,69) → pool n=45: median 0,950×, mean 0,968,
  CI 95% [0,896; 1,041], PASS 36/45 (80%) — ĐÚNG VẠCH 80%, KHÔNG CÒN
  BIÊN NÀO** (thêm 1 lần FAIL nữa là 36/46 = 78%). Chế độ tải 30fps
  n=37: median 1,010, PASS 32/37 (86%).
- **Chân yên 30fps — KHÔNG CÓ MẪU MỚI: 0/4 lần yên mục tiêu.**
  Cả 7 lần E1 đều tải (baseline 1,18–5,91 fps). Chân yên 30fps vẫn
  n=8, median 0,805, PASS 4/8 (50%), CI [0,683; 0,969] — y hệt V5.
- **ĐÍNH CHÍNH SỐ HỌC (quan trọng):** V5 và LIMITS gộp đợt 94 §4.6
  viết "chân yên 30fps cần thêm ~4 lần PASS nữa (10/12 để PASS
  ≥80%)" — **SAI: 4/8 + 4 lần PASS = 8/12 = 66,7%, không phải 80%.**
  Muốn PASS ≥80% cần **12 lần PASS liên tiếp** (16/20 = 80,0%).
  Đường "4 lần PASS nữa" không tồn tại; mọi kế hoạch lấy mẫu yên
  phải tính lại từ con số này (xem §4).
- **Pool 30fps 80% PHỤ THUỘC VÀO MỘT LẦN ĐO PHỒNG:** không có lần
  W6 e1-run1 (1,82× — phồng bởi tỉ lệ slot 4,27× từ slot baseline
  đóng băng) thì pool về **35/44 = 79,5%** (median 0,945); không có
  cả hai lần phồng (R6 1,58× + W6 1,82×) thì **34/43 = 79,1%**
  (median 0,940). Chân tải 30fps thì bền: bỏ run1 vẫn 31/36 = 86%.

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy
yên. CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round95-w6/analyze-pool95w6.py` (kế thừa
`analyze-pool94v5.py`, cùng công thức; pool gốc = pool V5 đã công bố
n=38/n=27 + 12 lần W6 mới đọc từ report JSON; JSON gộp:
`benchmarks/results/g1-evidence-v7-95w6.json`).

### 2.1 Từng cửa sổ 5 lần (luật b) — chỉ cửa sổ đổi so với V5

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| V5 60fps 5 mới nhất (đợt 94) | yên 3 / tải 2 (23,28; 22,34; 17,93; 7,19; 3,13) | 0,98 / 0,95 / 0,91 / 0,77 / 1,14 | 0,950 | 5/5 | PASS ỔN ĐỊNH | [0,785; 1,115] |
| **W6 60fps 5 mới nhất = cửa sổ W6 riêng (đợt 95)** | **tải 5 / yên 0 (2,51; 2,74; 2,14; 1,59; 2,73)** | **1,09 / 0,98 / 1,09 / 1,10 / 0,75** | **1,090** | **5/5** | **PASS ỔN ĐỊNH** | **[0,817; 1,187]** |

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5+Q7+R6+S6+T6+U6+V5+W6) | 45 | 0,950 | 0,968 | 0,244 | [0,896; 1,041] | 36/45 (80%) | PASS ỔN ĐỊNH (đúng vạch) |
| 30fps — máy tải (<10 fps) | 37 | 1,010 | 0,999 | 0,249 | [0,917; 1,081] | 32/37 (86%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps) | 8 | **0,805** | 0,826 | 0,171 | [0,683; 0,969] | 4/8 (50%) | CHƯA ĐẠT (không đổi — 0 mẫu mới) |
| **60fps fixture (M1+N10+R6+S6+T6+U6+V5+W6)** | **32** | **0,970** | **0,977** | **0,156** | **[0,922; 1,032]** | **30/32 (94%)** | **PASS ỔN ĐỊNH** |
| 60fps — máy tải (<10 fps) | 24 | 0,970 | 0,979 | 0,180 | [0,905; 1,052] | 22/24 (92%) | PASS ỔN ĐỊNH |
| **60fps — máy yên (≥10 fps)** | **8** | **0,970** | **0,971** | **0,043** | **[0,936; 1,007]** | **8/8 (100%)** | **PASS ỔN ĐỊNH (không đổi — 0 mẫu mới)** |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 77 | 0,960 | 0,972 | 0,211 | [0,924; 1,020] | 66/77 (86%) | trên ngưỡng |
| W6 riêng 30fps (7 lần) | 7 | 0,910 | 1,014 | 0,379 | [0,664; 1,364] | 5/7 (71%) | — (SD lớn do 1,82× phồng) |
| W6 riêng 60fps (5 lần) | 5 | 1,090 | 1,002 | 0,149 | [0,817; 1,187] | 5/5 (100%) | PASS ỔN ĐỊNH |

### 2.3 Tiêu chí nào đạt / chưa đạt (so với V5)

| Tiêu chí | V5 (n=38/27) | W6 (n=45/32) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 0,950 ✓ | 0,950 ✓ | không đổi |
| Pool 30fps PASS ≥ 80% | 31/38 = 82% ✓ (biên 1 FAIL) | **36/45 = 80% ✓ (đúng vạch, biên 0)** | **mất biên; và 80% này phụ thuộc lần 1,82× phồng (bỏ nó: 79,5%)** |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,889 ✓ | 0,896 ✓ | +0,007 |
| 30fps tải n≥20: median + PASS + CI | 1,030 / 90% / 0,915 ✓✓✓ | **1,010 / 86% / 0,917 ✓✓✓** | median −0,02, PASS −4 điểm (vẫn đạt) |
| 30fps yên: median + PASS + CI cận dưới | 0,805 / 50% / 0,683 (1/3) | **0,805 / 50% / 0,683 (1/3) — KHÔNG ĐỔI** | **0 mẫu mới; đường "4 PASS nữa" đã đính chính sai (cần 12 PASS liên tiếp)** |
| **60fps: median + PASS + CI** | **0,960 / 93% / 0,911 ✓✓✓** | **0,970 / 94% / 0,922 ✓✓✓** | **cả ba đều nhích lên** |
| 60fps cửa sổ 5 mới nhất luật (b) | median 0,95, 5/5 → PASS | median 1,09, 5/5 → PASS | giữ PASS lần 6 liên tiếp; đây là cửa sổ W6 đầy đủ 5 lần |
| **60fps yên** | **n=8, CI [0,936; 1,007], 8/8 PASS** | **n=8, không đổi** | 0 mẫu mới (cả 5 lần W6 đều tải) |
| Cửa sổ trượt 5 lần 30fps PASS | 25/34 | 31/41 | +6 cửa sổ PASS, nhưng **cửa sổ mới nhất 41–45 CHƯA ĐẠT (3/5)** |
| Pearson(ratio, baselineFps) 30fps | −0,384 (n=38) | −0,332 (n=45) | yếu đi chút (hàm chế độ máy vẫn còn) |

**Đọc bảng đúng:** 60fps dày lên ở mọi chiều, nhưng cửa sổ W6
toàn tải nặng (baseline 1,59–2,74 fps) — đừng trích median 1,09
như tốc độ deint trên máy bình thường. Pool 30fps 80% là con số
đúng vạch, không còn biên, và đứng được nhờ một lần đo phồng —
đừng trích "80%" mà không kèm câu này. Chân yên 30fps không có
mẫu mới nào, và mục tiêu cũ "4 lần PASS nữa" đã chứng minh sai
số học.

## 3. Cửa sổ W6 mới — chi tiết từng lần

### 3.1 60fps deint-only ×5 (probe N10) — 05:40–05:51Z — 5/5 PASS

Lệnh (mỗi lần, tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round95-w6/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 05:40–05:42 | 2,20 | 1128 MB | 2,51 fps | 1,42 / 1,04 / 0,68 / 0,94 / 1,36 | **1,09×** | PASS, 4/4 |
| 2 | 05:42–05:44 | 8,19 | 2412 MB | 2,74 fps | 0,83 / 1,23 / 0,75 / 1,44 / 0,65 | **0,98×** | PASS, 4/4 |
| 3 | 05:44–05:46 | 4,71 | 2126 MB | 2,14 fps | 0,80 / 0,85 / 0,90 / 1,60 / 1,28 | **1,09×** | PASS, 4/4 |
| 4 | 05:46–05:49 | 1,71 | 1773 MB | 1,59 fps | 1,08 / 1,35 / 1,18 / 1,09 / 0,80 | **1,10×** | PASS, 4/4 |
| 5 | 05:49–05:51 | 8,06 | 2248 MB | 2,73 fps | 0,70 / 0,62 / 0,53 / 0,58 / 1,34 | **0,75×** | PASS, 4/4 |

Tốc độ tuyệt đối (draw fps):

| Lần | Baseline draw (6 slot) | Combo draw (5 slot) | Slot đóng băng (<0,5 fps) |
|---|---|---|---|
| W6-1 | 3,34 / 2,18 / 2,28 / 4,14 / 1,83 / 1,28 (mean 2,51) | 3,91 / 2,32 / 2,19 / 2,80 / 2,12 | không |
| W6-2 | 2,15 / 3,49 / 1,80 / 3,21 / 2,92 / 2,89 (mean 2,74) | 2,35 / 3,25 / 1,88 / 4,40 / 1,89 | không |
| W6-3 | 1,81 / 2,65 / 4,00 / 0,91 / 1,84 / 1,61 (mean 2,14) | 1,78 / 2,81 / 2,21 / 2,20 / 2,20 | không |
| W6-4 | 1,93 / 1,52 / 1,87 / **0,32** / 2,07 / 1,82 (mean 1,59) | 1,87 / 2,28 / 1,29 / 1,30 / 1,56 | **slot 6 (baseline)** |
| W6-5 | 2,80 / 2,56 / 2,64 / 2,96 / 2,79 / 2,61 (mean 2,73) | 1,87 / 1,62 / 1,47 / 1,66 / 3,62 | không |

- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 5/5 lần và giống hệt
  M1/N10/R6/S6/T6/U6/V5 — deint áp thật trên fixture 60fps, đường
  code không đổi.
- **C3 0 lỗi trang cả 5 lần.** Không có dấu EPERM trong log 5 lần
  đo (grep `EPERM|Operation not permitted` trên run log: 0 kết quả).
- **Run4 — slot baseline đóng băng lần đầu ở N10:** slot 6 baseline
  chỉ 0,32 fps làm tỉ lệ slot 5 phồng lên 1,18 (mẫu số kề
  (1,87+0,32)/2 = 1,095). Tính lại tỉ lệ slot 5 chỉ với slot 4
  (1,29/1,87 = 0,69) thì mean còn 1,00 — **vẫn PASS**, nên PASS
  của run4 là bền, không phụ thuộc artefact.
- **Run5 0,75× ĐÚNG NGƯỠNG — lần PASS mong manh nhất của 60fps từ
  trước tới nay** (trước đó thấp nhất là 0,77× của V5): 4/5 tỉ lệ
  slot dưới ngưỡng (0,70 / 0,62 / 0,53 / 0,58), mean chỉ được kéo
  lên bởi một slot 1,34× (combo slot 3,62 fps kề baseline ~2,7 fps).
  Median tỉ lệ slot của run5 chỉ 0,62 — đừng trích "run5 PASS"
  mà không kèm câu này.
- **Nhiễu slot vẫn lớn như mọi đợt:** run1 có 1,42× kề 0,68×; run2
  có 1,44× kề 0,65×; run3 có 1,60×. Cả 5 lần đều tải nặng (baseline
  < 3 fps) — cửa sổ 60fps này đo ở chế độ tải cực đoan, không phải
  máy yên.

### 3.2 E1 30fps ×7 — 05:51–06:15Z — 5 PASS / 2 FAIL

Lệnh (mỗi lần, tuần tự): `E1_SCRATCH=hidden_files/round95-w6/e1-runN
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (cổng :5580 /
debug :9680 / display :180, tự pick — cả 12 lần W6 đều dùng chung
:5580/:9680/:180 tuần tự; fixture 30fps, 11 slot × 4,5s xen kẽ).
Vòng E1 chạy tối đa 7 lần, dừng khi đủ 4 lần yên + 3 lần tải — **chỉ
đạt tải 7/7, yên 0/4** (VM không yên được lần nào trong cửa sổ này).

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | G5 mean | Kết quả |
|---|---|---|---|---|---|---|
| 1 | 05:51–05:55 | 9,42 | 1682 MB | 1,18 fps | **1,82×** | **10/10 PASS** |
| 2 | 05:55–05:59 | 0,95 | 2061 MB | 1,87 fps | **0,88×** | **10/10 PASS** |
| 3 | 05:59–06:01 | 9,26 | 2469 MB | 5,91 fps | **1,05×** | **10/10 PASS** |
| 4 | 06:01–06:05 | 2,68 | 2531 MB | 2,00 fps | **1,01×** | **10/10 PASS** |
| 5 | 06:05–06:08 | 2,21 | 1548 MB | 3,12 fps | **0,91×** | **10/10 PASS** |
| 6 | 06:08–06:11 | 9,17 | 1566 MB | 3,64 fps | **0,74×** | **9/10 FAIL (chỉ G5)** |
| 7 | 06:11–06:15 | 1,69 | 1420 MB | 1,51 fps | **0,69×** | **9/10 FAIL (chỉ G5)** |

| Lần | Slot draw fps (B/D xen kẽ, slot 0–10) | 5 tỉ lệ | Slot đóng băng |
|---|---|---|---|
| 1 | 2,56 / 1,29 / 1,06 / 2,07 / 2,50 / 1,25 / **0** / 0,64 / **0,30** / 0,95 / 0,66 | 0,71 / 1,16 / 1,00 / **4,27** / 1,98 | slot 6, 8 (baseline) |
| 2 | 1,28 / 1,32 / 0,91 / **0,31** / **0,31** / 0,52 / 0,62 / 2,99 / 5,51 / 2,31 / 2,59 | 1,21 / 0,51 / 1,12 / 0,98 / 0,57 | slot 3 (deint), 4 (baseline) |
| 3 | 6,26 / 6,23 / 5,26 / 6,12 / 5,23 / 5,58 / 5,53 / 5,70 / 5,76 / 6,17 / 7,41 | 1,08 / 1,17 / 1,04 / 1,01 / 0,94 | không |
| 4 | 4,22 / 3,91 / 2,37 / 0,99 / 0,84 / 1,87 / 1,65 / 1,21 / 1,29 / 1,33 / 1,62 | 1,19 / 0,62 / 1,50 / 0,82 / 0,91 | không |
| 5 | 1,99 / 2,55 / 6,55 / 4,58 / 6,26 / 2,22 / 1,14 / 1,05 / 0,53 / 1,89 / 2,25 | 0,60 / 0,72 / 0,60 / 1,26 / 1,36 | không |
| 6 | 7,00 / 6,64 / 6,56 / 2,24 / 2,73 / 1,62 / 1,81 / 1,52 / 1,77 / 1,24 / 2,00 | 0,98 / 0,48 / 0,71 / 0,85 / 0,66 | không |
| 7 | 2,27 / 1,00 / 2,36 / 1,56 / 0,95 / 0,54 / 0,94 / 0,84 / 1,38 / 0,97 / 1,17 | 0,43 / 0,94 / 0,57 / 0,72 / 0,76 | không |

- **Run1 (1,82×) là lần đo phồng nhất trong toàn bộ pool 30fps,
  vượt cả R6 1,58×:** tỉ lệ slot 4,27× sinh ra vì slot baseline 6
  đóng băng ở **0 fps** (mẫu số kề (0+0,30)/2 = 0,15); tỉ lệ slot
  1,98× cũng dùng slot 8 baseline 0,30 fps làm mẫu số. Tỉ lệ thô
  deint/baseline (1,24/1,18) chỉ là 1,05×. W6 giữ run1 trong pool
  theo tiền lệ parent đợt 92 (giữ R6 1,58×) — nhưng **ghi rõ độ
  nhạy ở §1/§6: pool 30fps 80% đứng được là nhờ lần này**.
- **Run2 (0,88× PASS):** load lúc bắt đầu chỉ 0,95 nhưng sibling
  quay lại giữa phiên, baseline vẫn chỉ 1,87 fps — minh chứng nữa
  rằng loadavg lúc bắt đầu KHÔNG dự báo được chế độ trong phiên
  (như V5 §6.11).
- **Run3 (1,05× PASS) là lần E1 sạch nhất vòng W6** (không slot
  đóng băng, tỉ lệ 0,94–1,17) — nhưng vẫn tải (baseline 5,91 fps).
- **Run6 (0,74× FAIL) / run7 (0,69× FAIL):** exit=1 của hai lần này
  là harness FAIL ở G5 (9/10, chỉ G5 rớt) — **không phải harness
  crash**: report đầy đủ, mọi check khác PASS, pixel giống hệt lịch
  sử. Dữ liệu hợp lệ, đưa vào pool như 2 lần FAIL. Run7 có hiện
  tượng draw/tick lệch nhau ở slot deint (slot 1: tick 9,3 fps vs
  draw 1 fps; slot 5: tick 3,51 vs draw 0,54; playhead 0,18×) khi
  load vọt lên 15,09 cuối phiên — tick vẫn chạy nhưng draw kẹt,
  đúng pattern tải cực đoan.
- **Pixel cả 7 lần giống hệt lịch sử:** G2 MAD 0,5821; G7a 0,6903;
  G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt
  N5/Q7/R6/S6/T6/U6/V5). **H9 0 lỗi trang cả 7 lần.** Không có dấu
  EPERM trong log 7 lần đo (grep 0 kết quả).

### 3.3 Cửa sổ yên — 0 lần yên trong 12 lần đo

Trong suốt cửa sổ đo (~35 phút, 05:40–06:15Z), load 1-phút dao động
0,95–18,20. **Đây là cửa sổ đầu tiên kể từ U6 không có lấy một lần
yên nào** (cả 12 lần đều tải, baseline cao nhất chỉ 5,91 fps).
Nguyên nhân: khác V5/U6 (đo ngay đầu lượt, sibling chưa tăng tải
hết), đợt 95 có 9 luồng chạy song song suốt cửa sổ và nhiều luồng
chạy probe nặng (W3/W4) + load cuối cửa sổ vọt 18,20. Mẹo "đo sớm
sau reboot" **không đủ** khi cả đợt cùng chạy probe nặng — lấy mẫu
yên cần cửa sổ ít tải thật (ngoài giờ vòng lặp, hoặc sau khi sibling
xong việc), không chỉ đo sớm.

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của W6: KHÔNG đóng G1 toàn vẹn. Phương án A (đóng một
phần) nay HỖN HỢP so với V5 — không còn mạnh hơn toàn diện. Quyết
định cuối thuộc parent/user.**

- **Phương án A — Đóng một phần: deint ĐẠT ở chế độ tải, cả 30fps
  lẫn 60fps + chân yên 60fps (ĐỀ XUẤT XEM XÉT, có điều kiện — như
  U6/V5, cập nhật số):** 30fps-tải n=37: median 1,010×, mean 0,999,
  CI cận dưới 0,917, 32/37 PASS = 86%; 60fps-tải n=24: median
  0,970×, mean 0,979, CI cận dưới 0,905, 22/24 PASS = 92%;
  **60fps-yên n=8: median 0,970×, mean 0,971, CI [0,936; 1,007],
  8/8 PASS = 100% — cả ba tiêu chí chặt vẫn đạt (không đổi)**;
  cửa sổ 5 lần 60fps mới nhất PASS luật (b) **lần thứ sáu liên
  tiếp**, median 1,09 (cao nhất từ trước tới nay).
  - Điều kiện đóng (bắt buộc ghi kèm): (i) verdict "PASS" chỉ đúng
    ở chế độ tải / máy yếu + chân yên 60fps; chân yên 30fps vẫn
    CHƯA đạt đủ tiêu chí (PASS 4/8 = 50%, CI cận dưới 0,683 <
    0,75) — không được gộp vào verdict đóng; (ii) không trích số
    pool gộp (0,970× / 94% ở 60fps; 0,950× / 80% ở 30fps) như
    verdict duy nhất — pool gộp trộn hai chế độ nên không có nghĩa;
    (iii) **pool 30fps nay ĐÚNG VẠCH 80% (36/45) — thêm 1 lần FAIL
    nữa là rơi dưới 80% (36/46 = 78%) — và 80% này phụ thuộc lần
    1,82× phồng: bỏ lần đó pool về 79,5% (35/44)**; (iv) **chân
    yên 30fps 0 mẫu mới; đính chính: +4 lần PASS nữa chỉ đưa PASS
    lên 8/12 = 67%, cần 12 lần PASS liên tiếp mới đạt 16/20 =
    80%** — đừng trích mục tiêu cũ "4 lần PASS nữa" nữa; (v) cửa
    sổ trượt 30fps mới nhất (41–45) CHƯA ĐẠT (3/5 PASS) — lần đầu
    cửa sổ mới nhất rớt kể từ đợt 93; (vi) lần 60fps thấp nhất cửa
    sổ W6 chỉ 0,75× đúng ngưỡng (4/5 tỉ lệ slot dưới ngưỡng).
  - Vì sao W6 không đề xuất đóng toàn vẹn, và vì sao phương án A
    yếu đi ở một chân so với V5: (1) chân yên 30fps vẫn thiếu 2/3
    tiêu chí chặt VÀ không tiến thêm được mẫu nào; (2) pool 30fps
    từ 82% (biên 1 FAIL) về đúng vạch 80% (biên 0) và phụ thuộc
    artefact; (3) cửa sổ trượt mới nhất rớt; (4) metric tỉ lệ FPS
    vẫn là hàm của chế độ máy (Pearson −0,332) — nay thêm bằng
    chứng mới: slot đóng băng (3/12 lần W6) làm mẫu số kề bằng 0
    hoặc gần 0, tỉ lệ slot nổ lên 4,27×.
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5/Q7/R6/S6/T6/U6/V5.
  W6 bổ sung bằng chứng ủng hộ B mạnh nhất từ trước tới nay: cùng
  một lần đo e1-run1 chứa tỉ lệ 0,71× kề 4,27×; 60fps run5 chứa
  0,53× kề 1,34× — metric tỉ lệ FPS nhạy với sóng tải từng slot
  tới mức một lần đo có thể chứa cả hai thái cực, và nay thêm
  trường hợp mẫu số bằng 0 (slot đóng băng). Gap-mean vẫn chỉ 2/3
  PASS và lệch chiều draw-fps nên vẫn chưa có metric thay thế sẵn.
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5/Q7/R6/S6/T6/U6/V5.
  W6 làm phương án này KHÓ HƠN: đo sớm sau reboot không còn đủ khi
  9 luồng cùng chạy probe nặng — 0/7 lần E1 yên được. Cần cửa sổ
  đo ngoài giờ vòng lặp (hoặc sau khi sibling xong) mới lấy được
  mẫu yên; và mục tiêu đúng là **12 lần PASS liên tiếp** (16/20),
  không phải 4.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 94%/80% mà
  bỏ qua chân yên 30fps; trích pool 30fps "80%" như số chắc (bỏ
  lần 1,82× là 79,5%); trích median yên 30fps 0,805 như số chắc
  (0 mẫu mới, vẫn mong manh như V5 đã cảnh báo); trích 1,82× của
  e1-run1 hay 1,09× median cửa sổ 60fps như tốc độ deint (artefact
  mẫu số nhỏ / cửa sổ toàn tải nặng); trích "5 lần 60fps đều PASS"
  mà không ghi lần thấp nhất chỉ 0,75× đúng ngưỡng.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ đo + thêm số liệu ngoài production |
| `node --test vite-diagnosis-regex-92t6.test.mjs` | **9/9** chạy lại xanh (trích regex thật từ source) |
| `node --test deint-fps-verdict-83k3.test.mjs` | **12/12** chạy lại xanh |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm (chỉ thêm LIMITS + JSON số đo + file trong hidden_files), cùng tiền lệ U6/V5 |
| Cửa sổ W6 E1 30fps ×7 headed | run1–5 **10/10** (1,82 / 0,88 / 1,05 / 1,01 / 0,91, tải) / run6 **9/10** (G5 0,74× FAIL) / run7 **9/10** (G5 0,69× FAIL) |
| Cửa sổ W6 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 5/5 PASS** (1,09 / 0,98 / 1,09 / 1,10 / 0,75), 4/4 cases mỗi lần |
| Gộp pool tính lại (`analyze-pool95w6.py`) | tái tạo đúng số V5 đã công bố khi chạy trên pool cũ (pool 30 n=38, pool 60 n=27) trước khi thêm lần W6; 12 lần W6 mới tính lại từ fpsSlots khớp G5/ratioMean đã ghi — xem lưu ý làm tròn §5.1; frozenSlots E1 khớp tính lại cả 7 lần |
| Headed H9/C3 (mọi lần chạy W6) | **0 lỗi trang** (E1 10/10 ×5 + 9/10 ×2, 60fps 4/4 ×5) |
| Pixel D1 60fps (W6) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1/N10/R6/S6/T6/U6/V5 — tap áp thật |
| Pixel G2/G7a/G7b/G8 E1 (cả 7 lần) | giống hệt N5/Q7/R6/S6/T6/U6/V5 (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522) |
| `preview.tsx` / `playheadPacing.ts` / `media.ts` | không chạm |
| Không process mồ côi của W6 sau đo | không vite/chrome nào của W6 còn chạy (vite :5580 / chrome :9680 đã tắt sau mỗi lần; process vite/chrome còn lại lúc 06:19 là của W3/W4 — không phải của W6, không giết); socket X `/tmp/.X11-unix/X180` còn lại sau lần E1 là hành vi cũ như S6/T6/U6/V5 (cả 12 lần W6 đều dùng DISPLAY=:180) |

### 5.1 Lưu ý làm tròn khi tính lại (không phải lỗi số liệu)

- 60fps run3: script gộp tính lại tỉ lệ từ `drawFps` đã lưu trong
  JSON (làm tròn 2 chữ số thập phân) nên lệch 0,01: tính lại 1,08 so
  với report 1,09. Đối chứng bằng trường `ratios` của chính report:
  trung bình `ratios` = 1,086 → 1,09 — khớp `ratioMean` đã ghi.
  Pool dùng đúng `ratioMean` của report (như V5 §5.1).
- E1 run7: log harness ghi G5 **0,68×** nhưng script gộp tính lại
  từ `fpsSlots` thô ra **0,69×**: tỉ lệ thô trung bình 0,6862, còn
  trung bình của tỉ lệ làm tròn 2dp (0,43/0,94/0,57/0,72/0,76) là
  0,6840 — lệch ở biên làm tròn. **FAIL theo cả hai cách tính**;
  pool dùng 0,69 (số script gộp, nhất quán với các lần khác).
- E1 run6: log harness ghi baseline 3,64 fps, script gộp 3,65 fps —
  lệch 0,01 do làm tròn từ fps thô; không ảnh hưởng verdict hay
  phân loại chế độ (đều < 10 = tải).

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — W6 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn.
2. **Pool 30fps 80% (36/45) — ĐÚNG VẠCH, biên 0.** Thêm 1 lần FAIL
   nữa là rơi dưới 80% (36/46 = 78%); bỏ lần phồng 1,82× là đã
   79,5% (35/44). Đừng trích 80% như số chắc.
3. **Chân yên 30fps không tiến thêm: n=8, median 0,805, PASS 4/8
   (50%), CI cận dưới 0,683 < 0,75 — 0 mẫu mới vòng này.** Và mục
   tiêu cũ "4 lần PASS nữa" đã đính chính sai: cần 12 lần PASS liên
   tiếp (16/20 = 80%).
4. **Slot đóng băng xuất hiện 3/12 lần W6** (E1 run1 slot 6,8;
   run2 slot 3,4; N10 run4 slot 6) — lần đầu slot đóng băng xuất
   hiện ở cả hai harness trong cùng một vòng (V5: 0 slot). Khi slot
   baseline đóng băng ở 0 fps, tỉ lệ slot drift-corrected nổ lên
   4,27× — metric hiện tại không có cơ chế chặn mẫu số bằng 0.
   Đây là nợ metric mới, xem §8 mục 4.
5. **Pool 60fps 94% (30/32) dày hơn** nhưng lần thấp nhất cửa sổ W6
   chỉ 0,75× đúng ngưỡng (4/5 tỉ lệ slot dưới ngưỡng); CI cận dưới
   cửa sổ 0,817. Cả 5 lần W6 đều tải nặng (baseline 1,59–2,74 fps).
   Đừng trích 94% hay median cửa sổ 1,09 mà không kèm chế độ đo.
6. **Chân yên 60fps nay vẫn n=8, CI [0,936; 1,007] — cả ba tiêu chí
   chặt vẫn đạt, nhưng chỉ đúng cho fixture 60fps này trên VM này.**
   0 mẫu mới vòng này; n=8 vẫn nhỏ. Không dùng 8 điểm này để nói
   "deint ngang baseline trên mọi máy nhanh".
7. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→W6) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật. Bằng chứng mạnh nhất đợt này: e1-run1 chứa
   cả 0,71× và 4,27× trong cùng một lần; 60fps run5 chứa 0,53× kề
   1,34× — chỉ vì sóng tải từng slot và slot đóng băng.
8. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác).
   Đừng trích chỉ một tiêu chí (CI đạt, tỉ lệ PASS không).
9. **Luật median-5 lật 10/41 cửa sổ trượt 30fps** (31/41 PASS).
   Đừng trích verdict của một cửa sổ 5 lần đơn lẻ như kết luận chắc;
   luôn ghi kèm chế độ đo (baseline mean fps) và cửa sổ. Cửa sổ
   mới nhất 41–45 CHƯA ĐẠT — lần đầu cửa sổ mới nhất rớt kể từ đợt 93.
10. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích
    "combo 0,76×" như tốc độ combo.
11. **e1-run1 của T6 vẫn giữ trong pool** theo quyết định parent đợt
    92 (đã chấp nhận, 0 EPERM trong mọi log) — W6 không loại, không
    tranh luận lại, và giữ W6 e1-run1 theo cùng tiền lệ (ghi rõ độ
    nhạy thay vì loại). Lưu ý: nếu loại cả hai lần phồng (R6 1,58×
    + W6 1,82×), pool 30fps về n=43 (34/43 = 79% — DƯỚI 80%).
12. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 9 luồng song
    song.** Tải sibling là biến số lớn nhất (load 1-phút 0,95–18,20;
    RAM khả dụng 1,1–2,5 GB trong cửa sổ W6). Loadavg lúc bắt đầu
    KHÔNG dự báo được tải trong lúc đo (e1-run2: bắt đầu 0,95 →
    baseline chỉ 1,87 fps vì sibling quay lại giữa phiên).
13. **Không có sóng EPERM hay port-conflict thật nào trong cửa sổ W6
    (0 dấu EPERM trong 12 log đo).** Sóng thật gần nhất vẫn
    ~11:55–12:11Z (R7); EPERM KHÔNG tuyên bố đã hết.

## 7. Cách chạy lại

```bash
# Do 60fps 1 lan (probe N10, deint-only; doi N10_LABEL moi lan):
N10_LABEL=60fps-deint-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w6/60fps-deint-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Do 30fps 1 lan E1 (doi E1_SCRATCH moi lan):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w6/e1-run1 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Gop so (doc report JSON da co + so da cong bo, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w6/analyze-pool95w6.py
# Test hoi quy luat median + slot dong bang (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
# Test regex chan doan vite (offline, trich regex that tu source):
node --test apps/web/scripts/vite-diagnosis-regex-92t6.test.mjs
```

## 8. Nợ còn lại cho đợt sau

1. **G1 vẫn MỞ, chờ user quyết** (§4) — chân yên 60fps đủ cả ba
   tiêu chí chặt (n=8), chân yên 30fps mới đạt 1/3 (median 0,805;
   PASS 50%, CI cận dưới 0,683), pool 30fps đúng vạch 80% và phụ
   thuộc lần phồng 1,82×, cửa sổ trượt mới nhất rớt.
2. **Lấy mẫu yên 30fps có chủ đích — CẦN ĐỔI CÁCH LẤY MẪU:** đo sớm
   sau reboot không còn đủ khi 9 luồng cùng chạy probe nặng (W6:
   0/7 lần yên). Đề xuất: đo ngoài giờ vòng lặp, hoặc sau khi
   sibling xong việc, hoặc một lượt riêng chỉ chạy E1. Mục tiêu
   đúng: **12 lần PASS liên tiếp** (16/20 = 80%), không phải 4.
   Lấy 4 lần PASS nữa chỉ đưa PASS yên lên 8/12 = 67%.
3. **Fetch up-loop của E1 không có timeout** (U6 §7.1, vẫn mở): nc
   trơn giữ kết nối mở sẽ treo harness vĩnh viễn. Đề xuất đợt sau:
   thêm `AbortSignal.timeout(...)` cho fetch trong vòng up-loop (sửa
   harness, cần test hồi quy) — hoặc ghi rõ trong tài liệu harness
   rằng holder cổng phải tự đóng kết nối (như `nc -w 1`).
4. **Metric tỉ lệ FPS nhạy slot đóng băng (MỚI):** khi slot baseline
   đóng băng ở 0 fps, tỉ lệ slot nổ lên 4,27× (e1-run1) và G5 cả
   lần phồng lên 1,82×. Đề xuất đợt sau: chặn mẫu số (floor cho
   fps kề, hoặc loại/báo riêng slot có baseline kề < 0,5 fps khỏi
   G5) — sửa harness, cần test hồi quy và tính lại pool cũ theo
   cùng luật mới trước khi áp.
5. **Metric tỉ lệ FPS nhạy sóng tải từng slot** (§6 mục 7): một lần
   đo có thể chứa cả 0,71× và 4,27×. Gap-mean vẫn chưa phải metric
   thay thế sẵn (2/3 PASS, lệch chiều draw-fps).
