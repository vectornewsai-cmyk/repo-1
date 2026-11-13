# Đợt 93 U6 — G1 evidence vòng 5 + kích hoạt nhánh regex EADDRINUSE qua harness thật (KHÔNG TỰ ĐÓNG G1)

Ngày: 11–12/11/2026 (lượt cron 06:35 +07 12/11; làm việc 23:40–00:10Z 11–12/11).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot ~23:36Z 11/11 ngay trước lượt — uptime ~6 phút
lúc U6 bắt đầu; RAM khả dụng 935 MB lúc bắt đầu, 1,1–2,8 GB trong cửa sổ
đo; load 1-phút 0,76 lúc bắt đầu, lên tới 17,26 cuối cửa sổ vì sibling
vòng 93 tăng tải).
Nợ: LIMITS gộp đợt 92 §4 mục 6 (G1 quyết định thuộc user; chân yên 60fps
n=2, chân yên 30fps n=5; nhánh regex EADDRINUSE qua harness thật chưa
kích hoạt — giữ cổng bằng nc thay vì dummy HTTP; parent đợt 92 đã CHẤP
NHẬN e1-run1 của T6 — không loại run1 khỏi pool, không tranh luận lại).

**Trạng thái cuối: G1 VẪN CHƯA ĐÓNG — U6 chỉ đưa số + khuyến nghị, quyết
định cuối thuộc parent/user.** Không sửa production, không đổi ngưỡng,
không đổi metric. Không i18n key mới. Không kiểm lại TTS 39.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **60fps: 5/5 lần U6 mới đều PASS — 1,01 / 0,96 / 0,82 / 0,93 / 0,83
  → pool 60fps nay n=22: median 0,960×, mean 0,977, SD 0,168,
  CI 95% [0,906; 1,049], PASS 20/22 (91%)** — dày hơn T6 (15/17 = 88%).
  Cửa sổ 5 lần 60fps mới nhất (chính 5 lần U6 — cửa sổ đầy đủ, khác
  cửa sổ 3 lần của T6): median 0,930, 5/5 PASS → luật (b) PASS ỔN ĐỊNH
  **lần thứ tư liên tiếp** (R6, S6, T6, U6).
- **Chân yên 60fps nay n=5 (0,99 / 1,04 / 1,01 / 0,96 / 0,93), cả 5
  đều PASS, median 0,990, mean 0,986, SD 0,043, CI 95% [0,933; 1,039]
  — LẦN ĐẦU TIÊN chân yên 60fps có CI có nghĩa, cận dưới 0,933 ≥ 0,75.**
  Cả ba tiêu chí chặt (median + PASS ≥80% + CI cận dưới) cùng đạt ở
  chân yên 60fps. Lần yên sạch nhất từ trước tới nay: U6 run4, yên
  toàn phiên (mọi slot baseline 18–27 fps), 0,93× PASS, các tỉ lệ
  slot sát nhau nhất cửa sổ (0,84–1,05).
- **30fps: 2/3 lần U6 mới PASS (1,14 / 1,33) + 1 FAIL 0,67× → pool
  n=35: median 0,950×, mean 0,954, CI 95% [0,878; 1,030], PASS 28/35
  (80%) — ĐÚNG VẠCH 80%, biên T6 cảnh báo đã hết: thêm 1 lần FAIL nữa
  là rơi dưới 80% (28/36 = 78%).** Chế độ tải 30fps n=29: median
  1,030, PASS 26/29 (90%).
- **Chân yên 30fps nay n=6: median 0,680 (KHÔNG ĐỔI so với T6), PASS
  2/6 (33%), CI [0,600; 0,950].** Lần yên mới duy nhất (e1-run2,
  0,67×) là FAIL — làm mạnh thêm, không làm yếu, kết luận "deint
  chậm hơn một cách có hệ thống trên máy yên 30fps".
- **Nhánh regex EADDRINUSE — ĐÃ KÍCH HOẠT qua đường chạy harness thật
  (nợ T6 §8 ĐÃ ĐÓNG, xem §7):** giữ :5580 bằng `nc -l -k -w 1`
  (TCP thô, không trả HTTP) → E1 exit 2 sau ~9s, chẩn đoán "cổng bị
  chiếm" đúng, cả 3 lần `portStillServes=false` + `media=null` nên
  nhánh foreign-server provably KHÔNG bắn — chẩn đoán chỉ có thể đến
  từ regex. Log vite thật chứa "Port 5580 is already in use" ×3,
  0 lần "EADDRINUSE"; regex cũ → false, regex mới → true trên log
  đó. Phát hiện phụ: `nc` trơn (không `-w`) giữ kết nối mở và sẽ
  treo fetch không-timeout trong vòng up-loop của E1 — phải dùng
  `-w 1` (xem §7.1).

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy
yên. CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round93-u6/analyze-pool93u6.py` (kế thừa
`analyze-pool92t6.py`, cùng công thức; pool gốc = pool T6 đã công bố
n=32/n=17 + 8 lần U6 mới đọc từ report JSON; JSON gộp:
`benchmarks/results/g1-evidence-v5-93u6.json`).

### 2.1 Từng cửa sổ 5 lần (luật b) — chỉ cửa sổ đổi so với T6

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| T6 60fps 5 mới nhất (đợt 92) | tải 3 / yên 2 (6,23; 19,01; 12,60; 5,28; 5,89) | 1,33 / 0,99 / 1,04 / 0,96 / 1,07 | 1,040 | 5/5 | PASS ỔN ĐỊNH | [0,895; 1,261] |
| **U6 60fps 5 mới nhất = cửa sổ U6 riêng (đợt 93)** | **yên 3 / tải 2 (18,34; 14,05; 7,62; 23,73; 4,92)** | **1,01 / 0,96 / 0,82 / 0,93 / 0,83** | **0,930** | **5/5** | **PASS ỔN ĐỊNH** | **[0,807; 1,013]** |

Các cửa sổ 30fps T6 không đổi (xem T6 §2.1). Cửa sổ trượt 30fps
nay 22/31 PASS (T6: 19/28).

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5+Q7+R6+S6+T6+U6) | 35 | 0,950 | 0,954 | 0,225 | [0,878; 1,030] | 28/35 (80%) | PASS ỔN ĐỊNH |
| 30fps — máy tải (<10 fps) | 29 | 1,030 | 0,991 | 0,219 | [0,910; 1,073] | 26/29 (90%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps) | 6 | 0,680 | 0,775 | 0,167 | [0,600; 0,950] | 2/6 (33%) | CHƯA ĐẠT |
| **60fps fixture (M1+N10+R6+S6+T6+U6)** | **22** | **0,960** | **0,977** | **0,168** | **[0,906; 1,049]** | **20/22 (91%)** | **PASS ỔN ĐỊNH** |
| 60fps — máy tải (<10 fps) | 17 | 0,950 | 0,975 | 0,191 | [0,882; 1,067] | 15/17 (88%) | PASS ỔN ĐỊNH |
| **60fps — máy yên (≥10 fps)** | **5** | **0,990** | **0,986** | **0,043** | **[0,933; 1,039]** | **5/5 (100%)** | **PASS ỔN ĐỊNH** |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 57 | 0,950 | 0,963 | 0,203 | [0,909; 1,017] | 48/57 (84%) | đúng ngưỡng |
| Combo | 6 | 0,815 | 0,763 | 0,356 | [0,389; 1,137] | 3/6 (50%) | không verdict (n nhỏ, SD lớn) |

### 2.3 Tiêu chí nào đạt / chưa đạt (so với T6)

| Tiêu chí | T6 (n=32/17) | U6 (n=35/22) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 0,945 ✓ | 0,950 ✓ | +0,005 |
| Pool 30fps PASS ≥ 80% | 26/32 = 81% ✓ | **28/35 = 80% ✓** | **đúng vạch — 1 FAIL nữa là rơi dưới 80%** |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,869 ✓ | 0,878 ✓ | +0,009 |
| 30fps tải n≥20: median + PASS + CI | 0,950 / 89% / 0,891 ✓✓✓ | 1,030 / 90% / 0,910 ✓✓✓ | cả ba dày hơn |
| 30fps yên: median + PASS | 0,680 / 40% ✗✗ | 0,680 / 33% ✗✗ | median không đổi; PASS 40% → 33% (lần yên mới là FAIL) |
| **60fps: median + PASS + CI** | **0,990 / 88% / 0,908 ✓✓✓** | **0,960 / 91% / 0,906 ✓✓✓** | **median −0,030 nhưng PASS 88% → 91%** |
| 60fps cửa sổ 5 mới nhất luật (b) | median 1,04, 5/5 → PASS | median 0,93, 5/5 → PASS | giữ PASS lần 4 liên tiếp; đây là cửa sổ U6 đầy đủ 5 lần |
| **60fps yên** | **n=2 (0,99 / 1,04×), CI [0,697; 1,333]** | **n=5 (0,99 / 1,04 / 1,01 / 0,96 / 0,93×), CI [0,933; 1,039], 5/5 PASS** | **lần đầu cả ba tiêu chí chặt cùng đạt ở chân yên 60fps** |
| Cửa sổ trượt 5 lần 30fps PASS | 19/28 | 22/31 | +3 cửa sổ PASS |
| Pearson(ratio, baselineFps) 30fps | −0,408 (n=32) | −0,413 (n=35) | không đổi thực chất |

**Đọc bảng đúng:** 60fps dày lên ở mọi chiều, và chân yên 60fps lần
đầu có CI có nghĩa — nhưng 30fps gộp ngồi đúng vạch 80% và chân yên
30fps vẫn là điểm yếu nhất (n=6, median 0,680, lần yên mới nhất là
FAIL 0,67×). Đừng trích 91% của 60fps hay 80% của 30fps mà không kèm
chế độ đo và biên mỏng của chúng.

## 3. Cửa sổ U6 mới — chi tiết từng lần

### 3.1 60fps deint-only ×5 (probe N10) — 23:42–23:51Z — 5/5 PASS

Lệnh (mỗi lần, tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round93-u6/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 23:42–23:44 | 0,76 | 935 MB | **18,34 fps** | 0,97 / 0,90 / 0,98 / 1,06 / 1,13 | **1,01×** | PASS, 4/4 |
| 2 | 23:44–23:46 | 3,34 | 1607 MB | **14,05 fps** | 0,85 / 1,03 / 0,47 / 1,34 / 1,10 | **0,96×** | PASS, 4/4 |
| 3 | 23:46–23:48 | 2,17 | 2508 MB | 7,62 fps | 0,81 / 0,21 / 1,48 / 0,68 / 0,92 | **0,82×** | PASS, 4/4 |
| 4 | 23:48–23:49 | 1,24 | 2100 MB | **23,73 fps** | 0,87 / 0,94 / 0,84 / 1,05 / 0,95 | **0,93×** | PASS, 4/4 |
| 5 | 23:49–23:51 | 1,92 | 2405 MB | 4,92 fps | 0,50 / 1,16 / 0,70 / 1,12 / 0,65 | **0,83×** | PASS, 4/4 |

Tốc độ tuyệt đối (draw fps):

| Lần | Baseline draw (6 slot) | Deint draw (5 slot) | Slot đóng băng (<0,5 fps) |
|---|---|---|---|
| U6-1 | 21,90 / 20,02 / 21,70 / 22,75 / 20,04 / 3,61 (mean 18,34) | 20,39 / 18,70 / 21,69 / 22,67 / 13,34 | không |
| U6-2 | 23,31 / 7,20 / 8,43 / 3,62 / 22,49 / 19,26 (mean 14,05) | 12,98 / 8,07 / 2,83 / 17,54 / 23,00 | không |
| U6-3 | 5,60 / 0,88 / 13,50 / 16,94 / 3,65 / 5,16 (mean 7,62) | 2,64 / 1,53 / 22,50 / 6,98 / 4,05 | không |
| U6-4 | 18,15 / 26,56 / 26,68 / 20,84 / 25,37 / 24,79 (mean 23,73) | 19,51 / 25,12 / 19,85 / 24,25 / 23,76 | không |
| U6-5 | 10,99 / 4,26 / 3,65 / 2,05 / 5,68 / 1,92 (mean 4,92) | 3,83 / 4,26 / 2,70 / 5,79 / 2,13 | không |

- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 5/5 lần và giống hệt M1/N10/R6/S6/T6
  — deint áp thật trên fixture 60fps, đường code không đổi.
- **C3 0 lỗi trang cả 5 lần** (probe N10 có check C3 riêng, giống H9
  của E1). Không có dấu EPERM trong log 5 lần đo (grep
  `EPERM|Operation not permitted` trên run log + report: 0 kết quả).
- **Chân yên 60fps — đọc kỹ từng lần:** chỉ run4 yên toàn phiên
  (mọi slot baseline 18–27 fps — lần yên sạch nhất từ trước tới nay,
  tỉ lệ slot sát nhau nhất 0,84–1,05). Run1 yên slot 0–8 rồi rơi
  (slot 10 baseline 3,61 fps — sibling quay lại cuối phiên). Run2
  yên đầu + cuối, tải giữa phiên (slot baseline 7,20 / 8,43 / 3,62).
  Phân loại "yên" theo quy tắc đã định (baseline mean ≥10) — 3 lần
  đều đạt, nhưng chỉ run4 là yên thật 100% phiên. Đừng trích "3 lần
  yên 60fps" mà không kèm chú thích này.
- **Nhiễu slot vẫn lớn như mọi đợt:** run3 có tỉ lệ slot 0,21× (slot
  2 baseline chỉ 0,88 fps) và 1,48× kề nhau; run2 có 0,47× kề 1,34×.
  Metric tỉ lệ FPS vẫn nhạy với sóng tải từng slot (xem §6 mục 6).

### 3.2 E1 30fps ×3 — 23:51–23:59Z — 2 PASS + 1 FAIL

Lệnh (mỗi lần, tuần tự): `E1_SCRATCH=hidden_files/round93-u6/e1-runN
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (cổng :558x /
debug :968x / display :18x, tự pick; fixture 30fps, 11 slot × 4,5s
xen kẽ).

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | G5 mean | Kết quả |
|---|---|---|---|---|---|---|
| 1 | 23:50–23:53 | 13,48 | 2573 MB | 4,83 fps | **1,14×** | **10/10 PASS** |
| 2 | 23:53–23:56 | 4,88 | 2559 MB | **12,01 fps** | **0,67×** | **9/10 — G5 FAIL** |
| 3 | 23:56–23:59 | 1,61 | 2764 MB | 4,11 fps | **1,33×** | **10/10 PASS** |

| Lần | Slot draw fps (B/D xen kẽ, slot 0–10) | 5 tỉ lệ |
|---|---|---|
| 1 | 4,20 / 4,54 / 3,88 / 2,57 / 10,27 / 6,08 / 4,06 / 4,23 / 3,23 / 7,27 / 3,32 | 1,12 / 0,36 / 0,85 / 1,16 / 2,22 |
| 2 | 23,93 / 12,24 / 23,25 / 7,72 / 3,92 / 5,50 / 9,03 / 6,94 / 5,77 / 2,87 / 6,18 | 0,52 / 0,57 / 0,85 / 0,94 / 0,48 |
| 3 | 5,19 / 4,52 / 0,63 / 2,43 / 3,97 / 10,02 / 7,49 / 5,05 / 3,21 / 4,96 / 4,17 | 1,55 / 1,06 / 1,75 / 0,94 / 1,34 |

- **Run1 (tải, 1,14×):** tỉ lệ 0,36× và 2,22× là artefact sóng tải
  (slot 4 baseline vọt 10,27 fps giữa phiên tải) — cùng cơ chế như
  tỉ lệ 1,53×/0,50× của T6 e1-run2, chiều ngược lại. G1 PASS (gap
  0,14). Không slot đóng băng.
- **Run2 (yên theo mean, 0,67× FAIL):** lần yên 30fps FAIL thứ 4
  trong 6 lần yên (cùng 0,93 / 0,68 / 0,65 / 0,68 trước đó; chỉ
  1,04× của T6 là PASS). Nửa đầu phiên yên thật (slot 0–2 baseline
  23,93 / 23,25 fps), nửa sau trượt về tải (slot 4–10 baseline
  3,92–9,03 fps) — nhưng cả 5 tỉ lệ đều ≤0,94×, không có tỉ lệ nào
  phồng do sóng tải; FAIL này không phải artefact một slot. G1 PASS
  (gap 0,14); G2/G3/G4/G7a/G7b/G8/H9 đều PASS — chỉ G5 đỏ nên
  harness exit 1 (9/10), đúng hành vi thiết kế. Không slot đóng băng.
- **Run3 (tải, 1,33×):** tỉ lệ 1,75× do slot 2 baseline chỉ 0,63
  fps kéo mẫu số kề xuống (artefact, không phải tốc độ deint). G1
  PASS (gap 0,14). Không slot đóng băng.
- **Pixel cả 3 lần giống hệt lịch sử:** G2 MAD 0,5821; G7a 0,6903;
  G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt N5/Q7/R6/S6/T6).
  **H9 0 lỗi trang cả 3 lần.** Không có dấu EPERM trong log 3 lần
  đo (grep 0 kết quả).

### 3.3 Cửa sổ yên — 3 lần yên 60fps, 1 lần yên 30fps FAIL

Trong suốt cửa sổ đo (~17 phút, 23:42–23:59Z), load 1-phút dao động
0,76–17,26. Ba lần yên 60fps (run1/2/4) và một lần yên 30fps (e1-run2)
đều xuất hiện nhờ VM vừa reboot + sibling chưa tăng tải hết trong
nửa đầu cửa sổ; nửa sau cửa sổ (từ ~23:51Z) load vọt lên 13–17 do
sibling vòng 93. Đây là đợt đầu tiên có 3 lần yên 60fps trong một
cửa sổ 5 lần — và là đợt đầu tiên có lần yên 30fps FAIL sau lần yên
30fps PASS đầu tiên của T6. Cả hai chiều đều là dữ liệu thật, không
phải may mắn một chiều: chân yên 60fps mạnh lên, chân yên 30fps yếu
đi — đúng với bức tranh "deint ngang baseline ở 60fps, chậm hơn ở
30fps trên máy yên" mà pool đã gợi ý từ S6.

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của U6: KHÔNG đóng G1 toàn vẹn. Phương án A (đóng một
phần, chế độ tải) nay có thêm một chân đứng mới — chân yên 60fps lần
đầu đạt cả ba tiêu chí chặt — nhưng 30fps gộp đúng vạch 80% và chân
yên 30fps vẫn CHƯA ĐẠT rõ ràng. Quyết định cuối thuộc parent/user.**

- **Phương án A — Đóng một phần: deint ĐẠT ở chế độ tải, cả 30fps
  lẫn 60fps + nay thêm chân yên 60fps (ĐỀ XUẤT XEM XÉT, có điều kiện
  — như T6, cập nhật số):** 30fps-tải n=29: median 1,030×, mean
  0,991, CI cận dưới 0,910, 26/29 PASS = 90%; 60fps-tải n=17:
  median 0,950×, mean 0,975, CI cận dưới 0,882, 15/17 PASS = 88%;
  **60fps-yên n=5: median 0,990×, mean 0,986, CI [0,933; 1,039],
  5/5 PASS = 100% — lần đầu cả ba tiêu chí chặt cùng đạt ở một chân
  yên**; cửa sổ 5 lần 60fps mới nhất PASS luật (b) 5/5 lần thứ tư
  liên tiếp.
  - Điều kiện đóng (bắt buộc ghi kèm): (i) verdict "PASS" chỉ đúng
    ở chế độ tải / máy yếu + chân yên 60fps; trên máy yên 30fps
    deint vẫn chậm hơn một cách có hệ thống (median 0,68×, n=6,
    PASS 2/6 = 33%) — chân yên 30fps vẫn MỞ, không được gộp vào
    verdict đóng; (ii) không trích số pool gộp (0,960× / 91% ở
    60fps; 0,950× / 80% ở 30fps) như verdict duy nhất — pool gộp
    trộn hai chế độ nên không có nghĩa; (iii) **ghi rõ pool 30fps
    nay ĐÚNG 80% (28/35) — thêm 1 lần FAIL nữa là rơi dưới 80%**
    — phương án A ở 30fps nay mỏng hơn cả T6 về biên này, dù median
    và CI dày hơn; (iv) **chân yên 60fps n=5 nhưng chỉ 1 lần (U6
    run4) yên toàn phiên** — 2/5 lần chỉ yên một phần phiên (T6
    run1, U6 run1/run2); n=5 vẫn nhỏ, CI t-Student với n=5 rộng
    theo định nghĩa; (v) chân yên 30fps vẫn MỞ (n=6, median 0,680).
  - Vì sao U6 vẫn không đề xuất đóng toàn vẹn dù 60fps dày lên:
    (1) 30fps gộp đúng vạch 80% — không còn biên an toàn nào;
    (2) lần yên 30fps mới nhất là FAIL 0,67×, củng cố kết luận
    "chậm hơn có hệ thống" ở chân yên 30fps thay vì làm yếu nó;
    (3) metric tỉ lệ FPS vẫn là hàm của chế độ máy (Pearson −0,413,
    không đổi); (4) cửa sổ U6 60fps 5/5 PASS nhưng median 0,930
    thấp hơn hẳn cửa sổ T6 (1,040) — hai lần tải trong cửa sổ chỉ
    0,82×/0,83×, sát ngưỡng hơn các cửa sổ trước.
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5/Q7/R6/S6/T6. U6 bổ
  sung bằng chứng ủng hộ B: e1-run1 có tỉ lệ 0,36× kề tỉ lệ 2,22×
  trong cùng một lần; 60fps run3 có 0,21× kề 1,48× — metric tỉ lệ
  FPS nhạy với sóng tải từng slot tới mức một lần đo có thể chứa cả
  hai thái cực. Gap-mean hiện chỉ 2/3 PASS và lệch chiều draw-fps
  nên vẫn chưa có metric thay thế sẵn.
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5/Q7/R6/S6/T6.
  U6 làm phương án này bớt vô vọng hơn T6 một chút: 3 lần yên 60fps
  trong một cửa sổ 5 lần (nhờ VM vừa reboot + đo sớm trước khi
  sibling tăng tải) — cửa sổ đo ngoài giờ vòng lặp hoặc ngay sau
  reboot là cách lấy mẫu yên có chủ đích, không cần tắt sibling.
  Nhưng chân yên 30fps vẫn cần thêm mẫu (n=6, chỉ 2 PASS) và 30fps
  gộp cần thêm PASS để rời khỏi vạch 80% — chờ đợi thụ động vẫn có
  thể kéo dài.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 91%/80% mà
  bỏ qua chân yên 30fps; đóng chân yên 30fps theo 1 lần 1,04× của
  T6 (nay đã có thêm 1 lần FAIL 0,67×); trích 1,33× của e1-run3 như
  tốc độ deint (có artefact slot 0,63 fps); trích 2,22× tỉ lệ slot
  của e1-run1 như tốc độ deint; trích "3 lần yên 60fps" mà không ghi
  chỉ 1 lần yên toàn phiên.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ đo + thêm test/số liệu ngoài production |
| `node --test vite-diagnosis-regex-92t6.test.mjs` | **9/9** chạy lại xanh (trích regex thật từ source) |
| `node --test deint-fps-verdict-83k3.test.mjs` | **12/12** chạy lại xanh |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm (chỉ thêm LIMITS + JSON số đo + file trong hidden_files) |
| Cửa sổ U6 E1 30fps ×3 headed | run1 **10/10** (G5 1,14×, tải) / run2 **9/10** (G5 0,67× FAIL, yên — đúng hành vi thiết kế, chỉ G5 đỏ) / run3 **10/10** (G5 1,33×, tải) |
| Cửa sổ U6 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 5/5 PASS** (1,01 / 0,96 / 0,82 / 0,93 / 0,83), 4/4 cases mỗi lần |
| Gộp pool tính lại (`analyze-pool93u6.py`) | khớp số T6 đã công bố khi chạy lại trên pool cũ (pool 30 n=32, pool 60 n=17); 8 lần U6 mới tính lại từ fpsSlots khớp ratioMean/G5 đã ghi 8/8 lần (0 lệch làm tròn); frozenSlots E1 khớp tính lại cả 3 lần |
| Headed H9/C3 (mọi lần chạy U6) | **0 lỗi trang** (E1 10/10 + 9/10 + 10/10, 60fps 4/4 ×5) |
| Pixel D1 60fps (U6) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1/N10/R6/S6/T6 — tap áp thật |
| Pixel G2/G7a/G7b/G8 E1 (cả 3 lần) | giống hệt N5/Q7/R6/S6/T6 (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52) |
| Nhánh regex EADDRINUSE qua harness thật | **ĐÃ KÍCH HOẠT** — xem §7 (E1 exit 2, chẩn đoán đúng, 3/3 lần portStillServes=false) |
| `preview.tsx` / `playheadPacing.ts` / `media.ts` | không chạm |
| Không process mồ côi sau đo | không vite/chrome nào của U6 còn chạy; không listener :55xx/:96xx của U6; Xvfb :199 + vite 4173/5173 đang chạy là của luồng sibling (bắt đầu trước lượt U6); socket X `/tmp/.X11-unix/X180`–`X189` còn lại sau lần E1 là hành vi cũ như S6/T6 |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — U6 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn.
2. **Pool 30fps ĐÚNG 80% (28/35) — không còn biên.** Thêm 1 lần FAIL
   nữa là rơi dưới 80%; đừng trích 80% như số chắc. Lần E1 run2
   0,67× là lần yên 30fps FAIL mới nhất — chân yên 30fps vẫn là
   điểm yếu nhất của toàn bộ bằng chứng G1.
3. **Pool 60fps 91% (20/22) dày hơn** nhưng 2/5 lần U6 chỉ 0,82× /
   0,83× (tải, sát ngưỡng); median cửa sổ U6 0,930 thấp hơn cửa sổ
   T6 1,040. Đừng trích 91% mà không kèm chế độ đo.
4. **Chân yên 60fps nay n=5, CI [0,933; 1,039] — lần đầu có nghĩa,
   nhưng n=5 vẫn nhỏ và chỉ 1 lần yên toàn phiên** (U6 run4). Hai
   lần yên mới (run1/run2) chỉ yên một phần phiên. Không dùng 5
   điểm này để nói "deint ngang baseline trên mọi máy nhanh" — chỉ
   đúng cho fixture 60fps này trên VM này.
5. **Chân yên 30fps n=6, median 0,680, PASS 2/6 (33%).** Lần PASS
   1,04× của T6 nay chỉ còn là 1 trong 6; lần FAIL 0,67× của U6
   củng cố kết luận "deint chậm hơn có hệ thống trên máy yên 30fps".
6. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→U6) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật. Bằng chứng mạnh nhất đợt này: e1-run1 có tỉ lệ
   0,36× kề tỉ lệ 2,22× trong cùng một lần; 60fps run3 có 0,21× kề
   1,48× — chỉ vì sóng tải từng slot.
7. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác).
   Đừng trích chỉ một tiêu chí (CI đạt, tỉ lệ PASS không).
8. **Luật median-5 lật 9/31 cửa sổ trượt 30fps.** Đừng trích
   verdict của một cửa sổ 5 lần đơn lẻ như kết luận chắc; luôn
   ghi kèm chế độ đo (baseline mean fps) và cửa sổ.
9. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích
   "combo 0,76×" như tốc độ combo.
10. **e1-run1 của T6 vẫn giữ trong pool** theo quyết định parent đợt
    92 (đã chấp nhận, 0 EPERM trong mọi log) — U6 không loại, không
    tranh luận lại. Nếu loại run1, pool 30fps về n=34 (27/34 = 79%
    — RƠI DƯỚI 80%) — lưu ý: quyết định chấp nhận run1 của parent
    nay là điểm giữ pool 30fps ở đúng vạch 80%; trích số này phải
    kèm chú thích đó.
11. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 8–10 luồng song
    song.** Tải sibling là biến số lớn nhất (load 1-phút 0,76–17,26;
    RAM khả dụng 0,9–2,8 GB trong cửa sổ U6). Loadavg lúc bắt đầu
    KHÔNG dự báo được tải trong lúc đo (e1-run1: bắt đầu 13,48 →
    baseline chỉ 4,83 fps; e1-run3: bắt đầu 1,61 → baseline 4,11 fps
    vì sibling tăng tải giữa phiên).
12. **Nhánh regex EADDRINUSE nay ĐÃ kích hoạt qua harness thật
    (§7) — nhưng đó là fault-injection có kiểm soát, không phải
    sóng thật.** Không có sóng EPERM hay port-conflict thật nào
    trong cửa sổ U6 (0 dấu EPERM trong 8 log đo). Sóng thật gần nhất
    vẫn ~11:55–12:11Z (R7); EPERM KHÔNG tuyên bố đã hết.

## 7. Kích hoạt nhánh regex EADDRINUSE qua đường harness thật (mục b)

### 7.1 Vì sao `nc` trơn không dùng được trực tiếp — phát hiện trước khi chạy E1

T6 §8 gợi ý "giữ cổng bằng nc (lắng nghe TCP thô, không trả HTTP)
thay vì dummy HTTP". U6 thử trước bằng curl, chưa chạy E1:

- **`nc -l -k -p 5580 < /dev/null` (trơn): GIỮ KẾT NỐI MỞ.** curl
  tới :5580 treo tới timeout 5s (exit 28), nc vẫn sống và in request
  ra stdout. nc không đóng kết nối vì không có `-w` và stdin đã EOF
  không làm nó đóng socket đã accept.
- **Hệ quả cho E1:** vòng up-loop của harness fetch `DEV_URL` KHÔNG
  có timeout (`clicktest-77e1-deint-fps.mjs`, vòng `for i < 120`:
  `await fetch(DEV_URL)` rồi mới kiểm tra lại `vite.exitCode`). Với
  nc trơn, fetch đầu tiên treo vĩnh viễn — harness kẹt trước khi kịp
  kiểm tra vite đã exit — dù vite chết EADDRINUSE ngay sau đó. Đây
  là **giới hạn thật của harness** (fetch up-loop không timeout),
  không phải lỗi của nc; dummy HTTP của S6/T6 tránh được vì nó trả
  200 ngay. Ghi để đợt sau quyết có nên thêm timeout cho fetch
  up-loop hay không (ngoài brief U6, không sửa).
- **`nc -l -k -w 1 -p 5580 < /dev/null`: ĐÓNG MỖI KẾT NỐI SAU ~1s
  idle.** curl fail sau ~1,1s (exit 52, empty reply), nc vẫn sống
  và tiếp tục listen. Đây là dạng "TCP thô, không trả HTTP" mà
  harness chịu được: fetch up-loop fail nhanh → vòng lặp kiểm tra
  `vite.exitCode !== null` → break; fetch `portStillServes` (timeout
  2s) cũng fail trong ~1s → `false`. U6 dùng đúng dạng này cho lần
  chạy E1 thật (không dùng listener Node dự phòng
  `hold-port-raw.mjs` đã chuẩn bị — để lại trong scratch làm bằng
  chứng phương án dự phòng, không cần tới).

### 7.2 Lần chạy E1 thật với cổng bị nc giữ — NHÁNH REGEX ĐÃ KÍCH HOẠT

**Fault-injection (có kiểm soát, không chạm production):** nc giữ
cổng :5580 (`-l -k -w 1`, TCP thô, không trả HTTP), rồi chạy E1 với
`E1_DEV_PORT=5580` ép cứng. Scratch:
`hidden_files/round93-u6/fault-inject-nc/` (vite log + run log).
Bọc `timeout 300` đề phòng treo (không cần tới — E1 tự thoát sau ~9s).

**Kết quả: E1 exit 2 sau ~9s, chẩn đoán "cổng bị chiếm" đúng cả 3 lần
thử.** Toàn văn lỗi cuối:

> `HARNESS LỖI: vite dev + media probe không lên sau 3 lần thử —
> chẩn đoán: cổng bị chiếm (EADDRINUSE trong log hoặc cổng vẫn trả
> lời sau khi vite thoát — có server khác/mồ côi giữ cổng). lần 1:
> cổng :5580, exit 1, media —, cổng-vẫn-trả-lời=false, đuôi log: ...
> Port 5580 is already in use ... | lần 2: ... | lần 3: ...`

- Cả 3 lần: vite exit 1, media probe không chạy (media —), cổng
  không còn trả lời (`portStillServes=false`).
- **Chứng minh chẩn đoán đến từ regex, không từ nhánh
  foreign-server:** `foreignServer = some(portStillServes) ||
  some(mediaStatus === 200)` — cả 3 lần `portStillServes=false`
  và `mediaStatus=null` nên `foreignServer = false`. Với
  `hasEperm = false` (log không có EPERM), chẩn đoán "cổng bị
  chiếm" chỉ có thể đến từ `hasAddrInUse = true`. Đây là **lần đầu
  tiên nhánh regex kích hoạt qua đường chạy harness thật** — nợ T6
  §8 **ĐÃ ĐÓNG**.
- **Đối chứng regex cũ/mới trên log vite THẬT** (file
  `fault-inject-nc/c77e1-headed-vite.log`): chứa
  `Error: Port 5580 is already in use` **×3** (mỗi lần thử 1 lần),
  **0 lần** chuỗi `EADDRINUSE`. Regex cũ
  `/EADDRINUSE|address already in use/i` → **false**; regex mới
  `/EADDRINUSE|address already in use|Port \d+ is already in use/i`
  (trích từ source harness hiện tại, dòng 503) → **true**.
- **Bọc try/finally ĐÃ kích hoạt:** harness exit 2 nhưng không còn
  vite/chrome/Xvfb nào của U6, không listener :55xx/:96xx của U6.
  nc holder đã kill tay sau lần chạy, cổng :5580 free lại (đã kiểm
  tra bằng `ss`).

### 7.3 Ý nghĩa

Trước U6, regex mới chỉ được chứng minh bằng (a) test offline trên
log vite thật và (b) vite trực tiếp in đúng thông báo (T6 §7.1/§8).
Nay có thêm (c): **đường chạy harness thật kích hoạt đúng nhánh
regex, với chẩn đoán đúng, trong khi nhánh foreign-server im lặng
hoàn toàn** — đúng kịch bản T6 mô tả ("vite in được log rồi mới
chết mà không có server lạ trả lời cổng"). Cả hai nhánh chẩn đoán
của E1 (EPERM — T6 §7.2, EADDRINUSE — U6 §7.2) nay đều đã kích hoạt
bằng fail thật qua harness.

## 8. Cách chạy lại

```bash
# Do 60fps 1 lan (probe N10, deint-only; doi N10_LABEL moi lan):
N10_LABEL=60fps-deint-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round93-u6/60fps-deint-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Do 30fps 1 lan E1 (doi E1_SCRATCH moi lan):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round93-u6/e1-run1 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Gop so (doc report JSON da co + so da cong bo, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round93-u6/analyze-pool93u6.py
# Test hoi quy luat median + slot dong bang (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
# Test regex chan doan vite (offline, trich regex that tu source):
node --test apps/web/scripts/vite-diagnosis-regex-92t6.test.mjs
# Fault-injection EADDRINUSE qua nc (xem §7; LUY Y: nc tron khong -w
# se TREO E1 — phai dung -w 1; boc timeout 300 de phong):
nc -l -k -w 1 -p 5580 < /dev/null &
E1_DEV_PORT=5580 E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round93-u6/fault-inject-nc \
  timeout 300 node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Ket qua ky vong: E1 exit 2, chan doan "cong bi chiem", 3/3 lan
# portStillServes=false + media null (nhanh regex, khong phai foreign-server).
```

## 9. Nợ còn lại cho đợt sau

1. **G1 vẫn MỞ, chờ user quyết** (§4) — chân yên 60fps nay đủ cả ba
   tiêu chí chặt (n=5), chân yên 30fps vẫn chưa đạt (n=6, median
   0,680), pool 30fps đúng vạch 80% (28/35).
2. **Lấy thêm mẫu yên có chủ đích:** đo ngay sau reboot / ngoài giờ
   vòng lặp (U6 lấy được 3 lần yên 60fps nhờ đo sớm sau reboot);
   cần thêm mẫu yên 30fps (n=6, chỉ 2 PASS) và thêm PASS 30fps để
   rời khỏi vạch 80%.
3. **Fetch up-loop của E1 không có timeout** (§7.1): nc trơn giữ kết
   nối mở sẽ treo harness vĩnh viễn. Đề xuất đợt sau: thêm
   `AbortSignal.timeout(...)` cho fetch trong vòng up-loop (sửa
   harness, cần test hồi quy) — hoặc ghi rõ trong tài liệu harness
   rằng holder cổng phải tự đóng kết nối (như `nc -w 1`).
4. **Metric tỉ lệ FPS nhạy sóng tải từng slot** (§6 mục 6): một lần
   đo có thể chứa cả 0,21× và 1,48×. Gap-mean vẫn chưa phải metric
   thay thế sẵn (2/3 PASS, lệch chiều draw-fps).
