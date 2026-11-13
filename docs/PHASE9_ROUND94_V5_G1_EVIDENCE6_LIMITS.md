# Đợt 94 V5 — G1 evidence vòng 6 (KHÔNG TỰ ĐÓNG G1)

Ngày: 12/11/2026 (lượt cron 09:35 +07; đo 02:39–02:54Z).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot ngay trước đợt 94 — boot-id
9968199e-2e69-4835-b5fd-584f1cd2e66e, uptime 4 phút lúc V5 bắt đầu,
KHÔNG reboot trong cửa sổ đo; RAM khả dụng 1286–3127 MB; load 1-phút
0,44–12,48 do 8 luồng đợt 94 chạy song song).
Nợ: LIMITS gộp đợt 93 §4 mục 4 (G1 vẫn MỞ, quyết thuộc parent/user;
chân yên 60fps n=5, chân yên 30fps n=6 median 0,680; pool 30fps đúng
vạch 80%).

**Trạng thái cuối: G1 VẪN CHƯA ĐÓNG — V5 chỉ đưa số + khuyến nghị, quyết
định cuối thuộc parent/user.** Không sửa production, không đổi ngưỡng,
không đổi metric. Không i18n key mới. Không kiểm lại TTS 39.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **60fps: 5/5 lần V5 mới đều PASS — 0,98 / 0,95 / 0,91 / 0,77 / 1,14
  → pool 60fps nay n=27: median 0,960× (KHÔNG ĐỔI), mean 0,972,
  SD 0,160, CI 95% [0,911; 1,034], PASS 25/27 (93%)** — dày hơn U6
  (20/22 = 91%). Cửa sổ 5 lần 60fps mới nhất (chính 5 lần V5 — cửa
  sổ đầy đủ): median 0,950, 5/5 PASS → luật (b) PASS ỔN ĐỊNH
  **lần thứ năm liên tiếp** (R6, S6, T6, U6, V5).
- **Chân yên 60fps nay n=8 (0,99 / 1,04 / 1,01 / 0,96 / 0,93 / 0,98 /
  0,95 / 0,91), cả 8 đều PASS, median 0,970, mean 0,971, SD 0,043,
  CI 95% [0,936; 1,007]** — cả ba tiêu chí chặt vẫn đạt, nay n=8;
  riêng V5 có **2 lần yên toàn phiên** (run1, run2) + 1 lần yên gần
  trọn phiên (run3, chỉ slot cuối rơi).
- **30fps: 3/3 lần V5 mới PASS (1,12 / 0,94 / 1,02) → pool n=38:
  median 0,950×, mean 0,960, CI 95% [0,889; 1,031], PASS 31/38
  (82%) — RỜI KHỎI vạch 80% đúng của U6, nhưng chỉ còn biên 1 lần
  FAIL (31/39 = 79% nếu lần tới FAIL).** Chế độ tải 30fps n=30:
  median 1,030, PASS 27/30 (90%).
- **Chân yên 30fps — THAY ĐỔI LỚN NHẤT VÒNG NÀY: nay n=8, median
  0,805 (U6: 0,680), PASS 4/8 (50%), CI [0,683; 0,969].** Median
  **vượt 0,75 lần đầu tiên**, nhờ 2 lần yên mới đều PASS (0,94 /
  1,02) và đều yên toàn phiên. Nhưng vẫn CHƯA đạt 2/3 tiêu chí chặt
  (PASS 50% < 80%, CI cận dưới 0,683 < 0,75) — và median rất mong
  manh: thêm 1 lần FAIL ~0,67 nữa (n=9) là median rơi về 0,68.

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy
yên. CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round94-v5/analyze-pool94v5.py` (kế thừa
`analyze-pool93u6.py`, cùng công thức; pool gốc = pool U6 đã công bố
n=35/n=22 + 8 lần V5 mới đọc từ report JSON; JSON gộp:
`benchmarks/results/g1-evidence-v6-94v5.json`).

### 2.1 Từng cửa sổ 5 lần (luật b) — chỉ cửa sổ đổi so với U6

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| U6 60fps 5 mới nhất (đợt 93) | yên 3 / tải 2 (18,34; 14,05; 7,62; 23,73; 4,92) | 1,01 / 0,96 / 0,82 / 0,93 / 0,83 | 0,930 | 5/5 | PASS ỔN ĐỊNH | [0,807; 1,013] |
| **V5 60fps 5 mới nhất = cửa sổ V5 riêng (đợt 94)** | **yên 3 / tải 2 (23,28; 22,34; 17,93; 7,19; 3,13)** | **0,98 / 0,95 / 0,91 / 0,77 / 1,14** | **0,950** | **5/5** | **PASS ỔN ĐỊNH** | **[0,785; 1,115]** |

Các cửa sổ 30fps U6 không đổi (xem U6 §2.1). Cửa sổ trượt 30fps
nay 25/34 PASS (U6: 22/31); 3 cửa sổ mới nhất (32–36, 33–37, 34–38)
đều PASS.

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5+Q7+R6+S6+T6+U6+V5) | 38 | 0,950 | 0,960 | 0,217 | [0,889; 1,031] | 31/38 (82%) | PASS ỔN ĐỊNH |
| 30fps — máy tải (<10 fps) | 30 | 1,030 | 0,996 | 0,217 | [0,915; 1,076] | 27/30 (90%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps) | 8 | **0,805** | 0,826 | 0,171 | [0,683; 0,969] | 4/8 (50%) | CHƯA ĐẠT (median đạt, 2 tiêu chí còn lại chưa) |
| **60fps fixture (M1+N10+R6+S6+T6+U6+V5)** | **27** | **0,960** | **0,972** | **0,160** | **[0,911; 1,034]** | **25/27 (93%)** | **PASS ỔN ĐỊNH** |
| 60fps — máy tải (<10 fps) | 19 | 0,950 | 0,973 | 0,190 | [0,885; 1,060] | 17/19 (89%) | PASS ỔN ĐỊNH |
| **60fps — máy yên (≥10 fps)** | **8** | **0,970** | **0,971** | **0,043** | **[0,936; 1,007]** | **8/8 (100%)** | **PASS ỔN ĐỊNH** |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 65 | 0,950 | 0,965 | 0,194 | [0,917; 1,013] | 56/65 (86%) | trên ngưỡng |
| Combo | 6 | 0,815 | 0,763 | 0,356 | [0,389; 1,137] | 3/6 (50%) | không verdict (n nhỏ, SD lớn) |

### 2.3 Tiêu chí nào đạt / chưa đạt (so với U6)

| Tiêu chí | U6 (n=35/22) | V5 (n=38/27) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 0,950 ✓ | 0,950 ✓ | không đổi |
| Pool 30fps PASS ≥ 80% | 28/35 = 80% ✓ (đúng vạch) | **31/38 = 82% ✓** | **rời vạch, biên 1 lần FAIL** |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,878 ✓ | 0,889 ✓ | +0,011 |
| 30fps tải n≥20: median + PASS + CI | 1,030 / 90% / 0,910 ✓✓✓ | 1,030 / 90% / 0,915 ✓✓✓ | không đổi thực chất |
| 30fps yên: median + PASS + CI cận dưới | 0,680 / 33% / 0,600 ✗✗✗ | **0,805 ✓ / 50% ✗ / 0,683 ✗** | **median vượt 0,75 lần đầu; PASS 33% → 50%** |
| **60fps: median + PASS + CI** | **0,960 / 91% / 0,906 ✓✓✓** | **0,960 / 93% / 0,911 ✓✓✓** | **median không đổi, PASS 91% → 93%** |
| 60fps cửa sổ 5 mới nhất luật (b) | median 0,93, 5/5 → PASS | median 0,95, 5/5 → PASS | giữ PASS lần 5 liên tiếp; đây là cửa sổ V5 đầy đủ 5 lần |
| **60fps yên** | **n=5, CI [0,933; 1,039], 5/5 PASS** | **n=8, CI [0,936; 1,007], 8/8 PASS** | **cả ba tiêu chí chặt vẫn đạt, n=8, CI hẹp hơn** |
| Cửa sổ trượt 5 lần 30fps PASS | 22/31 | 25/34 | +3 cửa sổ PASS |
| Pearson(ratio, baselineFps) 30fps | −0,413 (n=35) | −0,384 (n=38) | yếu đi chút (hàm chế độ máy vẫn còn) |

**Đọc bảng đúng:** 60fps dày lên ở mọi chiều, chân yên 60fps nay
n=8 với CI hẹp hơn ([0,936; 1,007]); chân yên 30fps lần đầu có
median ≥ 0,75 — nhưng chỉ median đạt, PASS và CI cận dưới vẫn
chưa, và median này lật lại chỉ bằng 1 lần FAIL nữa. Đừng trích
93% của 60fps hay 82% của 30fps mà không kèm chế độ đo và biên
mỏng của chúng.

## 3. Cửa sổ V5 mới — chi tiết từng lần

### 3.1 60fps deint-only ×5 (probe N10) — 02:39–02:47Z — 5/5 PASS

Lệnh (mỗi lần, tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round94-v5/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 02:39–02:41 | 1,26 | 1286 MB | **23,28 fps** | 0,84 / 1,00 / 0,95 / 1,05 / 1,04 | **0,98×** | PASS, 4/4 |
| 2 | 02:41–02:42 | 2,47 | 1889 MB | **22,34 fps** | 0,98 / 0,91 / 0,71 / 1,09 / 1,07 | **0,95×** | PASS, 4/4 |
| 3 | 02:42–02:44 | 1,23 | 1545 MB | **17,93 fps** | 0,46 / 0,98 / 0,87 / 0,81 / 1,41 | **0,91×** | PASS, 4/4 |
| 4 | 02:44–02:46 | 5,90 | 1813 MB | 7,19 fps | 0,44 / 1,29 / 0,50 / 0,76 / 0,86 | **0,77×** | PASS, 4/4 |
| 5 | 02:46–02:48 | 12,48 | 1891 MB | 3,13 fps | 0,80 / 1,55 / 1,00 / 1,24 / 1,11 | **1,14×** | PASS, 4/4 |

Tốc độ tuyệt đối (draw fps):

| Lần | Baseline draw (6 slot) | Combo draw (5 slot) | Slot đóng băng (<0,5 fps) |
|---|---|---|---|
| V5-1 | 24,88 / 25,33 / 19,83 / 24,60 / 20,21 / 24,83 (mean 23,28) | 20,97 / 22,51 / 21,12 / 23,52 / 23,31 | không |
| V5-2 | 23,74 / 21,26 / 22,36 / 20,63 / 23,25 / 22,78 (mean 22,34) | 21,95 / 19,78 / 15,16 / 23,90 / 24,59 | không |
| V5-3 | 17,32 / 19,59 / 21,48 / 21,83 / 21,71 / 5,65 (mean 17,93) | 8,52 / 20,03 / 18,74 / 17,58 / 19,24 | không |
| V5-4 | 1,18 / 13,97 / 8,17 / 5,47 / 6,46 / 7,87 (mean 7,19) | 3,36 / 14,27 / 3,44 / 4,56 / 6,18 | không |
| V5-5 | 5,64 / 1,63 / 2,99 / 2,66 / 2,90 / 2,95 (mean 3,13) | 2,92 / 3,57 / 2,82 / 3,44 / 3,25 | không |

- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 5/5 lần và giống hệt M1/N10/R6/S6/T6/U6
  — deint áp thật trên fixture 60fps, đường code không đổi.
- **C3 0 lỗi trang cả 5 lần** (probe N10 có check C3 riêng, giống H9
  của E1). Không có dấu EPERM trong log 5 lần đo (grep
  `EPERM|Operation not permitted` trên run log + report: 0 kết quả).
- **Chân yên 60fps — đọc kỹ từng lần:** run1 và run2 yên toàn phiên
  (mọi slot baseline 19,83–25,33 fps và 20,63–23,74 fps); run3 yên
  gần trọn phiên (5 slot đầu 17,32–21,83 fps, chỉ slot cuối rơi
  5,65 fps vì sibling quay lại cuối phiên). Phân loại "yên" theo quy
  tắc đã định (baseline mean ≥10) — 3 lần đều đạt, 2 lần yên thật
  100% phiên. Đừng trích "3 lần yên 60fps" mà không kèm chú thích này.
- **Nhiễu slot vẫn lớn như mọi đợt:** run4 có tỉ lệ slot 0,44× kề
  1,29×; run3 có 0,46× kề 1,41×; run5 có 1,55× (slot baseline chỉ
  1,63 fps kéo mẫu số kề xuống). Metric tỉ lệ FPS vẫn nhạy với sóng
  tải từng slot (xem §6 mục 6).
- **Run4 0,77× là lần PASS sát ngưỡng nhất trong mọi cửa sổ 5 lần
  60fps từ trước tới nay** (trước đó thấp nhất là 0,82×/0,83× của
  U6) — cửa sổ V5 5/5 PASS nhưng biên dưới mỏng hơn cửa sổ U6.

### 3.2 E1 30fps ×3 — 02:47–02:54Z — 3/3 PASS, 10/10 cả 3 lần

Lệnh (mỗi lần, tuần tự): `E1_SCRATCH=hidden_files/round94-v5/e1-runN
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (cổng :558x /
debug :968x / display :180, tự pick; fixture 30fps, 11 slot × 4,5s
xen kẽ).

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | G5 mean | Kết quả |
|---|---|---|---|---|---|---|
| 1 | 02:47–02:50 | 2,96 | 2099 MB | 4,10 fps | **1,12×** | **10/10 PASS** |
| 2 | 02:50–02:52 | 0,44 | 2413 MB | **17,07 fps** | **0,94×** | **10/10 PASS** |
| 3 | 02:52–02:54 | 4,32 | 3127 MB | **22,25 fps** | **1,02×** | **10/10 PASS** |

| Lần | Slot draw fps (B/D xen kẽ, slot 0–10) | 5 tỉ lệ |
|---|---|---|
| 1 | 2,94 / 3,23 / 2,49 / 3,88 / 4,86 / 7,12 / 5,65 / 7,10 / 5,34 / 3,05 / 3,31 | 1,19 / 1,06 / 1,35 / 1,29 / 0,71 |
| 2 | 15,65 / 10,03 / 10,12 / 15,19 / 9,99 / 4,85 / 14,84 / 21,77 / 25,24 / 23,91 / 26,61 | 0,78 / 1,51 / 0,39 / 1,09 / 0,92 |
| 3 | 24,02 / 24,55 / 26,71 / 22,37 / 21,39 / 22,90 / 24,27 / 22,08 / 18,50 / 21,47 / 18,61 | 0,97 / 0,93 / 1,00 / 1,03 / 1,16 |

- **Run1 (tải, 1,12×):** không slot đóng băng; tỉ lệ thấp nhất
  0,71× là slot cuối (deint 3,05 fps sau baseline 5,34 fps) — không
  phải artefact mẫu số nhỏ. G1 PASS (gap 0,14).
- **Run2 (yên, 0,94× PASS):** lần yên 30fps PASS thứ hai liên tiếp
  trong cửa sổ này (sau lần 1,04× của T6 và trước run3). Yên toàn
  phiên (slot baseline 9,99–26,61 fps; slot 4 ở 9,99 fps — sát vạch
  10 nhưng thực chất vẫn yên). Tỉ lệ 0,39× là artefact sóng tải
  (deint slot 4,85 fps kề baseline 9,99/14,84 fps); tỉ lệ 1,51× kề
  ngay sau là artefact chiều ngược. G1 PASS (gap 0,14). Không slot
  đóng băng.
- **Run3 (yên, 1,02× PASS):** lần yên 30fps sạch nhất từ trước tới
  nay — yên toàn phiên (slot baseline 18,50–26,71 fps), tỉ lệ slot
  sát nhau nhất của mọi lần yên 30fps (0,93–1,16, không artefact
  nào). G1 PASS (gap 0,14). Không slot đóng băng.
- **Pixel cả 3 lần giống hệt lịch sử:** G2 MAD 0,5821; G7a 0,6903;
  G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt N5/Q7/R6/S6/T6/U6).
  **H9 0 lỗi trang cả 3 lần.** Không có dấu EPERM trong log 3 lần
  đo (grep 0 kết quả).

### 3.3 Cửa sổ yên — 3 lần yên 60fps + 2 lần yên 30fps đều PASS

Trong suốt cửa sổ đo (~15 phút, 02:39–02:54Z), load 1-phút dao động
0,44–12,48. Đây là cửa sổ đầu tiên có **cả 5 lần yên đều PASS**
(3 lần yên 60fps: 0,98 / 0,95 / 0,91; 2 lần yên 30fps: 0,94 /
1,02) — và là cửa sổ đầu tiên có 2 lần yên 30fps trong một lượt.
Cả 5 lần yên đều yên toàn phiên hoặc gần trọn phiên (chỉ run3 60fps
rơi slot cuối). Nguyên nhân: VM vừa reboot trước đợt 94 + đo ngay
đầu lượt, trước khi sibling tăng tải hết (load chỉ vọt lên 12,48 ở
lần 60fps cuối, rồi hạ lại 0,44–4,32 trong 3 lần E1). Cách lấy mẫu
yên có chủ đích này (đo sớm sau reboot) đã chứng minh hiệu quả 2
lượt liên tiếp (U6, V5).

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của V5: KHÔNG đóng G1 toàn vẹn. Phương án A (đóng một
phần) nay mạnh hơn ở CẢ HAI chân so với U6 — nhưng chân yên 30fps
vẫn chưa đủ cả ba tiêu chí chặt, và pool 30fps chỉ còn biên 1 lần
FAIL. Quyết định cuối thuộc parent/user.**

- **Phương án A — Đóng một phần: deint ĐẠT ở chế độ tải, cả 30fps
  lẫn 60fps + chân yên 60fps (ĐỀ XUẤT XEM XÉT, có điều kiện — như
  U6, cập nhật số):** 30fps-tải n=30: median 1,030×, mean 0,996, CI
  cận dưới 0,915, 27/30 PASS = 90%; 60fps-tải n=19: median 0,950×,
  mean 0,973, CI cận dưới 0,885, 17/19 PASS = 89%;
  **60fps-yên n=8: median 0,970×, mean 0,971, CI [0,936; 1,007],
  8/8 PASS = 100% — cả ba tiêu chí chặt vẫn đạt, CI hẹp hơn U6**;
  cửa sổ 5 lần 60fps mới nhất PASS luật (b) 5/5 **lần thứ năm liên
  tiếp**; **chân yên 30fps lần đầu có median ≥ 0,75 (0,805)** với 2
  lần yên mới nhất đều PASS toàn phiên (0,94 / 1,02).
  - Điều kiện đóng (bắt buộc ghi kèm): (i) verdict "PASS" chỉ đúng
    ở chế độ tải / máy yếu + chân yên 60fps; chân yên 30fps vẫn
    CHƯA đạt đủ tiêu chí (PASS 4/8 = 50%, CI cận dưới 0,683 <
    0,75) — không được gộp vào verdict đóng; (ii) không trích số
    pool gộp (0,960× / 93% ở 60fps; 0,950× / 82% ở 30fps) như
    verdict duy nhất — pool gộp trộn hai chế độ nên không có nghĩa;
    (iii) **ghi rõ pool 30fps nay 82% (31/38) — thêm 1 lần FAIL nữa
    là rơi dưới 80% (31/39 = 79%)**; (iv) **median chân yên 30fps
    0,805 rất mong manh: thêm 1 lần FAIL ~0,67 nữa là median (n=9)
    rơi về 0,68** — đừng trích 0,805 như số chắc; (v) cửa sổ V5
    60fps 5/5 PASS nhưng lần thấp nhất chỉ 0,77× (sát ngưỡng nhất
    từ trước tới nay), CI cận dưới 0,785.
  - Vì sao V5 vẫn không đề xuất đóng toàn vẹn dù cả hai chân đều
    dày lên: (1) chân yên 30fps vẫn thiếu 2/3 tiêu chí chặt; (2)
    pool 30fps chỉ còn biên 1 lần FAIL trên vạch 80%; (3) metric tỉ
    lệ FPS vẫn là hàm của chế độ máy (Pearson −0,384, chỉ yếu đi
    chút); (4) kết luận "deint chậm hơn có hệ thống trên máy yên
    30fps" của U6 nay đã yếu đi (2 lần yên mới nhất đều PASS) —
    nhưng chưa đảo ngược được: 4/8 lần yên vẫn FAIL, và 3 trong 4
    lần FAIL đó ≤ 0,68×.
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5/Q7/R6/S6/T6/U6.
  V5 bổ sung bằng chứng ủng hộ B: e1-run2 có tỉ lệ 0,39× kề tỉ lệ
  1,51× trong cùng một lần; 60fps run3 có 0,46× kề 1,41× — metric
  tỉ lệ FPS nhạy với sóng tải từng slot tới mức một lần đo có thể
  chứa cả hai thái cực. Gap-mean vẫn chỉ 2/3 PASS và lệch chiều
  draw-fps nên vẫn chưa có metric thay thế sẵn.
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5/Q7/R6/S6/T6/U6.
  V5 làm phương án này khả thi hơn hẳn: đo sớm sau reboot cho 5/5
  lần yên PASS trong một cửa sổ — lấy mẫu yên có chủ đích đã chứng
  minh hiệu quả 2 lượt liên tiếp (U6, V5). Chân yên 30fps cần thêm
  ~4 lần PASS nữa để PASS ≥ 80% ở n=12 (cần 10/12) — vẫn là con
  số cụ thể, không còn vô vọng.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 93%/82% mà
  bỏ qua chân yên 30fps; trích median yên 30fps 0,805 như số chắc
  (1 FAIL nữa là lật về 0,68); trích 1,55× tỉ lệ slot của run5
  60fps hay 1,51× của e1-run2 như tốc độ deint (artefact mẫu số
  nhỏ); trích "5 lần yên đều PASS" mà không ghi run3 60fps chỉ yên
  gần trọn phiên (slot cuối rơi 5,65 fps).

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ đo + thêm số liệu ngoài production |
| `node --test vite-diagnosis-regex-92t6.test.mjs` | **9/9** chạy lại xanh (trích regex thật từ source) |
| `node --test deint-fps-verdict-83k3.test.mjs` | **12/12** chạy lại xanh |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm (chỉ thêm LIMITS + JSON số đo + file trong hidden_files), cùng tiền lệ U6 |
| Cửa sổ V5 E1 30fps ×3 headed | run1 **10/10** (G5 1,12×, tải) / run2 **10/10** (G5 0,94×, yên) / run3 **10/10** (G5 1,02×, yên) |
| Cửa sổ V5 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 5/5 PASS** (0,98 / 0,95 / 0,91 / 0,77 / 1,14), 4/4 cases mỗi lần |
| Gộp pool tính lại (`analyze-pool94v5.py`) | khớp số U6 đã công bố khi chạy lại trên pool cũ (pool 30 n=35, pool 60 n=22); 8 lần V5 mới tính lại từ fpsSlots khớp G5/ratioMean đã ghi — xem lưu ý làm tròn §5.1; frozenSlots E1 khớp tính lại cả 3 lần |
| Headed H9/C3 (mọi lần chạy V5) | **0 lỗi trang** (E1 10/10 ×3, 60fps 4/4 ×5) |
| Pixel D1 60fps (V5) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1/N10/R6/S6/T6/U6 — tap áp thật |
| Pixel G2/G7a/G7b/G8 E1 (cả 3 lần) | giống hệt N5/Q7/R6/S6/T6/U6 (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52) |
| `preview.tsx` / `playheadPacing.ts` / `media.ts` | không chạm |
| Không process mồ côi sau đo | không vite/chrome nào của V5 còn chạy (vite :5580 của V4 bắt đầu sau khi V5 xong — không phải của V5); socket X `/tmp/.X11-unix/X180` còn lại sau lần E1 là hành vi cũ như S6/T6/U6 |

### 5.1 Lưu ý làm tròn khi tính lại ratioMean 60fps (không phải lỗi số liệu)

Script gộp tính lại tỉ lệ từ `drawFps` đã lưu trong JSON (làm tròn
2 chữ số thập phân), nên lệch 0,01 ở 2/5 lần: run1 tính lại 0,97 so
với report 0,98; run3 tính lại 0,90 so với report 0,91. Đối chứng
bằng trường `ratios` của chính report (harness tính từ fps thô):
trung bình `ratios` = 0,976 → 0,98 (run1), 0,906 → 0,91 (run3) —
khớp `ratioMean` đã ghi cả 5/5 lần. Pool dùng đúng `ratioMean` của
report, không dùng số tính lại lệch làm tròn.

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — V5 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn.
2. **Pool 30fps 82% (31/38) — biên chỉ còn 1 lần FAIL.** Thêm 1 lần
   FAIL nữa là rơi dưới 80% (31/39 = 79%); đừng trích 82% như số chắc.
3. **Chân yên 30fps median 0,805 lần đầu vượt 0,75 — nhưng mong manh.**
   Thêm 1 lần FAIL ~0,67 nữa là median (n=9) rơi về 0,68; PASS chỉ
   4/8 (50%), CI cận dưới 0,683 < 0,75. Hai lần PASS mới nhất (0,94 /
   1,02) làm yếu kết luận "chậm hơn có hệ thống" của U6 nhưng chưa
   đảo ngược được nó (4/8 lần yên vẫn FAIL, 3 lần ≤ 0,68×).
4. **Pool 60fps 93% (25/27) dày hơn** nhưng lần thấp nhất cửa sổ V5
   chỉ 0,77× (sát ngưỡng nhất từ trước tới nay); CI cận dưới cửa sổ
   0,785. Đừng trích 93% mà không kèm chế độ đo.
5. **Chân yên 60fps nay n=8, CI [0,936; 1,007] — cả ba tiêu chí chặt
   vẫn đạt, nhưng chỉ đúng cho fixture 60fps này trên VM này.**
   2/8 lần chỉ yên gần trọn phiên (U6 run1/run2, V5 run3); n=8 vẫn
   nhỏ. Không dùng 8 điểm này để nói "deint ngang baseline trên mọi
   máy nhanh".
6. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→V5) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật. Bằng chứng mạnh nhất đợt này: e1-run2 có tỉ lệ
   0,39× kề tỉ lệ 1,51× trong cùng một lần; 60fps run3 có 0,46× kề
   1,41× — chỉ vì sóng tải từng slot.
7. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác).
   Đừng trích chỉ một tiêu chí (CI đạt, tỉ lệ PASS không).
8. **Luật median-5 lật 9/34 cửa sổ trượt 30fps.** Đừng trích
   verdict của một cửa sổ 5 lần đơn lẻ như kết luận chắc; luôn
   ghi kèm chế độ đo (baseline mean fps) và cửa sổ.
9. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích
   "combo 0,76×" như tốc độ combo.
10. **e1-run1 của T6 vẫn giữ trong pool** theo quyết định parent đợt
    92 (đã chấp nhận, 0 EPERM trong mọi log) — V5 không loại, không
    tranh luận lại. Lưu ý mới: nếu loại run1, pool 30fps nay về n=37
    (30/37 = 81% — VẪN TRÊN 80%, khác U6 lúc đó 79%) — quyết định
    chấp nhận run1 của parent nay KHÔNG còn là điểm giữ pool 30fps
    trên vạch 80%.
11. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 8 luồng song
    song.** Tải sibling là biến số lớn nhất (load 1-phút 0,44–12,48;
    RAM khả dụng 1,3–3,1 GB trong cửa sổ V5). Loadavg lúc bắt đầu
    KHÔNG dự báo được tải trong lúc đo (60fps run5: bắt đầu 12,48 →
    baseline chỉ 3,13 fps; e1-run3: bắt đầu 4,32 → baseline 22,25 fps
    vì sibling hạ tải giữa phiên).
12. **Không có sóng EPERM hay port-conflict thật nào trong cửa sổ V5
    (0 dấu EPERM trong 8 log đo).** Sóng thật gần nhất vẫn
    ~11:55–12:11Z (R7); EPERM KHÔNG tuyên bố đã hết.

## 7. Cách chạy lại

```bash
# Do 60fps 1 lan (probe N10, deint-only; doi N10_LABEL moi lan):
N10_LABEL=60fps-deint-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v5/60fps-deint-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Do 30fps 1 lan E1 (doi E1_SCRATCH moi lan):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v5/e1-run1 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Gop so (doc report JSON da co + so da cong bo, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v5/analyze-pool94v5.py
# Test hoi quy luat median + slot dong bang (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
# Test regex chan doan vite (offline, trich regex that tu source):
node --test apps/web/scripts/vite-diagnosis-regex-92t6.test.mjs
```

## 8. Nợ còn lại cho đợt sau

1. **G1 vẫn MỞ, chờ user quyết** (§4) — chân yên 60fps đủ cả ba
   tiêu chí chặt (n=8), chân yên 30fps mới đạt 1/3 (median 0,805;
   PASS 50%, CI cận dưới 0,683), pool 30fps 82% biên 1 lần FAIL.
2. **Lấy thêm mẫu yên 30fps có chủ đích:** đo sớm sau reboot / ngoài
   giờ vòng lặp (V5 lấy được 2 lần yên 30fps PASS toàn phiên nhờ đo
   sớm); cần thêm ~4 lần PASS nữa để PASS ≥ 80% ở n=12 (cần 10/12)
   và để median yên 30fps đứng vững trước 1 lần FAIL.
3. **Fetch up-loop của E1 không có timeout** (U6 §7.1, vẫn mở): nc
   trơn giữ kết nối mở sẽ treo harness vĩnh viễn. Đề xuất đợt sau:
   thêm `AbortSignal.timeout(...)` cho fetch trong vòng up-loop (sửa
   harness, cần test hồi quy) — hoặc ghi rõ trong tài liệu harness
   rằng holder cổng phải tự đóng kết nối (như `nc -w 1`).
4. **Metric tỉ lệ FPS nhạy sóng tải từng slot** (§6 mục 6): một lần
   đo có thể chứa cả 0,39× và 1,51×. Gap-mean vẫn chưa phải metric
   thay thế sẵn (2/3 PASS, lệch chiều draw-fps).
