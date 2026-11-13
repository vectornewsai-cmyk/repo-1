# Đợt 91 S6 — G1 evidence vòng 3: đo thêm 30fps + 60fps, sửa chẩn đoán probe tick-time, kích hoạt chẩn đoán E1 bằng fail thật (KHÔNG TỰ ĐÓNG)

Ngày: 11/11/2026 (lượt cron 00:35 +07 12/11; đo headed 17:43–17:57 UTC).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot trước lượt — uptime 15 phút lúc S6 bắt đầu,
33 phút lúc kết thúc; RAM khả dụng 536 MB lúc bắt đầu → ~3,1 GB giữa
lượt; load 1-phút 1,18 lúc bắt đầu, lên tới 10,25 trong lúc đo).
Nợ: LIMITS gộp đợt 90 §4 mục 6 + R6 §7 mục 4 (chẩn đoán EPERM-vs-port +
bọc try/finally chưa kích hoạt bằng 1 lần vite fail thật; probe
tick-time 78f1/79g1 vẫn còn chuỗi "cổng bị chiếm?" cũ).

**Trạng thái cuối: G1 VẪN CHƯA ĐÓNG — S6 chỉ đưa số + khuyến nghị, quyết
định cuối thuộc parent/user.** Không sửa production, không đổi ngưỡng,
không đổi metric. Không i18n key mới. Không kiểm lại TTS 39.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **60fps: 3/3 lần S6 mới đều PASS — 1,19 / 1,33 / 0,99 → pool 60fps
  nay n=14: median 0,970×, mean 0,991, SD 0,201, CI 95% [0,875;
  1,108], PASS 12/14 (86%)** — cả ba tiêu chí chặt vẫn đạt, biên dày
  hơn R6 (9/11 = 82% → 12/14 = 86%; nay cần thêm 2 lần FAIL mới rơi
  dưới 80%, thay vì 1 lần như R6).
- **Lần đầu tiên có số 60fps ở chế độ YÊN: run3 baseline 19,01 fps,
  0,99× PASS (n=1).** Trước S6, pool 60fps-yên là n=0. Một điểm chưa
  chứng minh được gì (n=1), nhưng nó phá vỡ giả định "không đo được
  lần yên nào trong giờ vòng lặp" ở fixture 60fps — lần yên này xuất
  hiện vì tải sibling hạ đúng lúc (load 1-phút rơi về 0,79 cuối run1),
  không phải do S6 tắt bớt luồng.
- **30fps: 1 FAIL + 1 PASS mới (0,73 / 1,05) → pool n=30: median
  0,935×, mean 0,940, CI 95% [0,857; 1,023], PASS 24/30 (80%)** —
  đúng vạch 80%, mỏng hơn R6 (23/28 = 82%). Thêm 1 lần FAIL nữa là
  rơi dưới 80%. Chế độ tải n=26: median 0,950, PASS 23/26 (88%);
  chế độ yên n=4 không đổi (median 0,680, 1/4 PASS = 25%).
- **Cửa sổ 5 lần 60fps mới nhất [0,81, 1,26, 1,19, 1,33, 0,99]:
  median 1,190, 5/5 PASS → luật (b) PASS ỔN ĐỊNH** (lần thứ hai liên
  tiếp, sau cửa sổ R6).
- **Chẩn đoán probe tick-time đã sửa xong (b):** 78f1 + 79g1 nay dùng
  đúng chẩn đoán EPERM-vs-port như R6, `node --check` OK. Chuỗi cũ
  chỉ còn trong comment giải thích đã bỏ.
- **Chẩn đoán E1 đã kích hoạt bằng fail thật (c) — một nửa:** nhánh
  port-conflict kích hoạt thật bằng fault-injection (dummy server giữ
  :5580, exit 2, chẩn đoán "cổng bị chiếm" đúng). Nhánh EPERM vẫn
  CHƯA kích hoạt bằng fail thật. Phát hiện thêm: thông báo thân thiện
  của vite ("Port 5580 is already in use") KHÔNG khớp regex
  EADDRINUSE hiện tại — ghi ở §6 mục 11, chưa sửa (chờ parent quyết).

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy
yên. CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round91-s6/analyze-pool91s6.py` (kế thừa
`analyze-pool90r6.py`, cùng công thức; 60fps tính lại từ report khớp
ratioMean đã ghi cả 3 lần; frozenSlots E1 khớp tính lại cả 2 lần).

### 2.1 Từng cửa sổ 5 lần (luật b) — chỉ cửa sổ đổi so với R6

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| R6 60fps 5 mới nhất (đợt 90) | tải 5 (2,05; 1,37; 1,03; 0,98; 0,75) | 1,13 / 0,92 / 1,13 / 0,81 / 1,26 | 1,130 | 5/5 | PASS ỔN ĐỊNH | [0,825; 1,275] |
| **S6 60fps 5 mới nhất (đợt 91)** | **tải 4 / yên 1 (0,98; 0,75; 2,26; 6,23; 19,01)** | **0,81 / 1,26 / 1,19 / 1,33 / 0,99** | **1,190** | **5/5** | **PASS ỔN ĐỊNH** | **[0,852; 1,380]** |
| **S6 60fps riêng (3 lần)** | **tải 2 / yên 1 (2,26; 6,23; 19,01)** | **1,19 / 1,33 / 0,99** | **1,190** | **3/3** | **CHƯA ĐỦ MẪU (cần 5)** | **[0,745; 1,595]** |

Các cửa sổ 30fps I5–Q7 không đổi (xem R6 §2.1). Cửa sổ trượt 30fps
nay 17/26 PASS (R6: 15/24).

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5+Q7+R6+S6) | 30 | 0,935 | 0,940 | 0,223 | [0,857; 1,023] | 24/30 (80%) | PASS ỔN ĐỊNH (đúng vạch) |
| 30fps — máy tải (<10 fps) | 26 | 0,950 | 0,971 | 0,219 | [0,885; 1,057] | 23/26 (88%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps) | 4 | 0,680 | 0,735 | 0,131 | [0,527; 0,943] | 1/4 (25%) | CHƯA ĐẠT |
| **60fps fixture (M1+N10+R6+S6)** | **14** | **0,970** | **0,991** | **0,201** | **[0,875; 1,108]** | **12/14 (86%)** | **PASS ỔN ĐỊNH** |
| 60fps — máy tải (<10 fps) | 13 | 0,950 | 0,992 | 0,209 | [0,865; 1,118] | 11/13 (85%) | PASS ỔN ĐỊNH |
| 60fps — máy yên (≥10 fps) | 1 | 0,990 | 0,990 | — | — | 1/1 (100%) | KHÔNG ĐỦ MẪU (n=1) |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 44 | 0,945 | 0,956 | 0,215 | [0,891; 1,021] | 36/44 (82%) | đúng ngưỡng |
| Combo | 6 | 0,815 | 0,763 | 0,356 | [0,389; 1,137] | 3/6 (50%) | không verdict (n nhỏ, SD lớn) |

### 2.3 Tiêu chí nào đạt / chưa đạt (so với R6)

| Tiêu chí | R6 (n=28/11) | S6 (n=30/14) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 0,935 ✓ | 0,935 ✓ | không đổi |
| Pool 30fps PASS ≥ 80% | 23/28 = 82% ✓ | 24/30 = 80% ✓ | mỏng đi: đúng vạch 80% |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,858 ✓ | 0,857 ✓ | −0,001 |
| 30fps tải n≥20: median + PASS + CI | 0,950 / 92% / 0,887 ✓✓✓ | 0,950 / 88% / 0,885 ✓✓✓ | PASS 92% → 88% |
| 30fps yên: median + PASS | 0,680 / 25% ✗✗ | không đổi | không có số mới |
| **60fps: median + PASS + CI** | **0,940 / 82% / 0,818 ✓✓✓** | **0,970 / 86% / 0,875 ✓✓✓** | **cả ba dày hơn** |
| 60fps cửa sổ 5 mới nhất luật (b) | median 1,13, 5/5 → PASS | median 1,19, 5/5 → PASS | giữ PASS lần 2 liên tiếp |
| 60fps yên | n=0 | **n=1 (0,99× PASS)** | **điểm yên đầu tiên** |
| Cửa sổ trượt 5 lần 30fps PASS | 15/24 | 17/26 | +2 cửa sổ PASS |
| Pearson(ratio, baselineFps) 30fps | (R6 không công bố) | −0,413 (n=30) | tỉ lệ giảm nhẹ khi baseline tăng |

**Đọc bảng đúng:** chân tải 60fps nay dày hơn (86%, cần 2 FAIL mới
rơi dưới 80%); chân tải 30fps vẫn đạt nhưng mỏng đi (80% đúng vạch).
Chân yên 60fps có điểm đầu tiên (0,99× PASS) nhưng n=1 — gợi ý,
không phải bằng chứng. Chân yên 30fps vẫn n=4, 25%, không có số mới.

## 3. Cửa sổ S6 mới — chi tiết từng lần

### 3.1 E1 30fps run1 — 17:43:42–17:47:13Z — G5 FAIL 0,73×

Lệnh: `E1_SCRATCH=hidden_files/round91-s6/e1-run1 node
apps/web/scripts/clicktest-77e1-deint-fps.mjs` (cổng :5580 / debug
:9680 / display :180, tự pick; fixture 30fps, 11 slot × 4,5s xen kẽ).
Kết quả: **8/10 PASS, exit 0, 3m31s.** Vite lên ngay lần 1.

| Slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Config | B | D | B | D | B | D | B | D | B | D | B |
| Draw fps | 0,00 | 0,00 | 1,82 | 1,50 | 3,74 | 3,83 | 1,91 | 1,93 | 1,33 | 0,94 | 1,98 |
| Tick fps | 4,51 | 5,97 | 8,18 | 12,92 | 9,97 | 11,18 | 11,48 | 14,47 | 14,63 | 11,59 | 14,20 |
| Playhead | 0,39 | 0,79 | 0,43 | 0,34 | 0,60 | 0,56 | 0,32 | 0,33 | 0,29 | 0,25 | 0,45 |

G5 mean **0,73×** (tỉ lệ 0 / 0,54 / 1,36 / 1,19 / 0,57), baseline
mean 1,80 fps, **slot đóng băng 2/11 (slot 0, 1 — cả hai đều 0,00
fps)**. Load 1-phút 2,17 → 10,25 trong lúc đo; RAM khả dụng ~0,5–3
GB. G1 FAIL (R interlaced 0,74 = progressive 0,74, gap 0 — cùng giá
trị tuyệt đối 0,74 như mọi lần trước; xem §6 mục 5). G2/G3/G4/G7a/
G7b/G8/H9 PASS; pixel giống hệt N5/Q7/R6 (G2 MAD 0,5821; G7a 0,6903;
G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522).

**Vì sao FAIL — đọc kỹ:** tỉ lệ 0× ở slot 1 là do slot 0 baseline
và slot 1 deint CÙNG đóng băng 0,00 fps ngay đầu phiên (máy vừa
reboot + RAM khả dụng chỉ ~536 MB lúc bắt đầu; tick vẫn chạy 4,5–6
fps nhưng không có lần vẽ nào — decoder/video chưa lên, không phải
deint chậm). Bỏ slot đóng băng đầu phiên này ra thì 4 tỉ lệ còn lại
là 0,54 / 1,36 / 1,19 / 0,57 (mean 0,915). Đây vẫn là 1 lần FAIL
hợp lệ cho pool (không loại khỏi pool), nhưng đừng trích "deint
30fps nay chỉ 0,73×" — số này là số của 2 slot đầu phiên đóng băng.

### 3.2 E1 30fps run2 — 17:47:59–17:50:25Z — G5 PASS 1,05×

Cùng lệnh, scratch `e1-run2`. Kết quả: **10/10 PASS, exit 0,
2m26s.** Vite lên ngay lần 1.

| Slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Config | B | D | B | D | B | D | B | D | B | D | B |
| Draw fps | 3,96 | 4,82 | 6,08 | 9,34 | 5,48 | 4,17 | 4,83 | 3,83 | 4,22 | 4,37 | 4,49 |
| Playhead | 0,59 | 0,62 | 1,01 | 1,00 | 0,70 | 0,63 | 0,74 | 0,54 | 0,59 | 0,71 | 0,62 |

G5 mean **1,05×** (tỉ lệ 0,96 / 1,62 / 0,81 / 0,85 / 1,00), baseline
mean 4,84 fps, **không slot đóng băng**. G1 PASS lần này (gap 0,14:
R 0,74 − 0,60). Pixel giống hệt run1 (G2 MAD 0,5821; G7a 0,6903;
G7b 0,0119). Load 1-phút ~8,27 lúc kết thúc slot FPS.

**Hai lần E1 liên tiếp 0,73× rồi 1,05× trên cùng một máy, cùng một
harness, cách nhau 4 phút** — chênh lệch hoàn toàn do tải/decoder
khởi động, không do code (không sửa gì giữa 2 lần). Đây là bằng
chứng trực tiếp nhất cho "tỉ lệ FPS là hàm của chế độ máy".

### 3.3 60fps deint-only ×3 (probe N10) — 17:51–17:57Z — 3/3 PASS

Lệnh (mỗi lần, tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round91-s6/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu→cuối) | RAM khả dụng | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 17:51–17:53 | 3,92 → 0,79 | ~3,1 GB | 2,26 fps | 0,99 / 2,45 / 0,67 / 1,21 / 0,62 | **1,19×** | PASS, 4/4 |
| 2 | 17:53–17:55 | ~5 → 5,37 | ~3,1 GB | 6,23 fps | 1,30 / 1,52 / 1,29 / 1,23 / 1,32 | **1,33×** | PASS, 4/4 |
| 3 | 17:55–17:57 | ~5,9 | ~3,0 GB | **19,01 fps** | 0,96 / 0,81 / 1,01 / 1,24 / 0,92 | **0,99×** | PASS, 4/4 |

Tốc độ tuyệt đối (draw fps):

| Lần | Baseline draw (6 slot) | Deint draw (5 slot) | Slot đóng băng (<0,5 fps) |
|---|---|---|---|
| S6-1 | 1,57 / 0,63 / 0,61 / 5,90 / 3,26 / 1,61 (mean 2,26) | 1,09 / 1,52 / 2,19 / 5,56 / 1,52 (mean 2,38) | không |
| S6-2 | 4,37 / 6,18 / 6,53 / 6,58 / 7,57 / 6,13 (mean 6,23) | 6,86 / 9,65 / 8,48 / 8,73 / 9,01 (mean 8,55) | không |
| S6-3 | 22,00 / 25,30 / 23,79 / 24,41 / 10,44 / 8,12 (mean 19,01) | 22,64 / 19,80 / 24,26 / 21,58 / 8,51 (mean 19,36) | không |

- **D1 cả 3 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 3/3 lần và giống hệt M1/N10/R6
  — deint áp thật trên fixture 60fps, đường code không đổi.
- **Playhead 60fps (33 slot S6): run1 0,21–1,05×, run2 0,83–1,02×,
  run3 0,98–1,01×, không slot nào vượt 1,3×** — đối chứng sạch.
  Run1 có playhead thấp 0,21–0,31× ở các slot đầu (tải nặng, giống
  mẫu E1 run1) — lag chứ không teleport.
- **C3 0 lỗi trang cả 3 lần.** Không có dấu EPERM trong log 3 lần
  đo (grep `EPERM|Operation not permitted` trên run log + report:
  0 kết quả) — cũng 0 kết quả ở cả 2 lần E1.
- **Run2 là lần 60fps "sạch" nhất lịch sử pool:** cả 5 tỉ lệ đều
  1,23–1,52, baseline 6,23 fps (đủ nhanh để tỉ lệ có nghĩa, đủ tải
  để không phải máy yên). Không slot nào dưới 1,23.
- **Run3 là lần yên 60fps ĐẦU TIÊN (baseline 19,01 fps ≥ 10):**
  0,99× PASS. Nhưng 3 slot cuối (8/9/10) rơi từ ~22–25 fps xuống
  ~8–10 fps — tải sibling tăng lại cuối phiên (load 1-phút 5,92
  lúc kết thúc). Nửa đầu phiên (slot 0–7) baseline ~20–25 fps là
  máy yên thật; nửa sau đã trượt về tải. Đừng trích 19,01 fps như
  "máy yên suốt phiên" — chỉ đúng nửa đầu.
- **Run1 có 1 tỉ lệ phồng 2,45×** (deint slot 3: 1,52 fps kề 2
  baseline 0,63/0,61 fps) — cùng cơ chế sóng tải như R6 run1
  (1,89×) và Q7. Đừng trích 1,19× mà không kèm cảnh báo này; trung
  vị 5 tỉ lệ run1 chỉ 0,99.

### 3.4 Cửa sổ yên — MỘT lần yên 60fps xuất hiện, 30fps vẫn không

Trong suốt cửa sổ đo (~14 phút, 17:43–17:57Z), load 1-phút dao động
0,79–10,25. Lần yên duy nhất là 60fps run3 nửa đầu (baseline
~20–25 fps). Không có lần yên 30fps nào — E1 run1/run2 đều baseline
1,80/4,84 fps. Đây là đợt thứ 6 liên tiếp không có lần yên 30fps
nào trong giờ vòng lặp (L3, M1, N5, Q7, R6, S6).

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của S6: KHÔNG đóng G1 toàn vẹn; phương án A nay mạnh
hơn ở 60fps nhưng mỏng đi ở 30fps, và lần yên 60fps đầu tiên chưa đủ
để đóng chân yên. Quyết định cuối thuộc parent/user.**

- **Phương án A — Đóng một phần: deint ĐẠT ở chế độ tải, cả 30fps
  lẫn 60fps (ĐỀ XUẤT XEM XÉT, có điều kiện — như R6, cập nhật số):**
  30fps-tải n=26: median 0,950×, mean 0,971, CI cận dưới 0,885,
  23/26 PASS = 88%; 60fps-tải n=13: median 0,950×, mean 0,992, CI
  cận dưới 0,865, 11/13 PASS = 85%; cửa sổ 5 lần 60fps mới nhất
  PASS luật (b) 5/5 lần thứ hai liên tiếp.
  - Điều kiện đóng (bắt buộc ghi kèm — như R6, cộng 2 điều kiện
    mới): (i) verdict "PASS" chỉ đúng ở chế độ tải / máy yếu; trên
    máy nhanh (baseline ≥10 fps) deint chậm hơn ngưỡng một cách có
    hệ thống ở 30fps (~0,68×, n=4) và ở 60fps mới chỉ có n=1
    (0,99× PASS — chưa đủ để kết luận); (ii) không trích số pool
    gộp (0,970× / 86% ở 60fps; 0,935× / 80% ở 30fps) như verdict
    duy nhất — pool gộp trộn hai chế độ nên không có nghĩa;
    (iii) **ghi rõ pool 30fps nay đúng vạch 80% (24/30) — thêm 1
    lần FAIL nữa là rơi dưới 80%** — phương án A ở 30fps mỏng hơn
    R6, không dày hơn; (iv) **điểm yên 60fps đầu tiên (0,99×) là
    n=1 và nửa sau phiên đã trượt về tải** — không dùng 1 điểm này
    để đóng chân yên 60fps; (v) chân yên 30fps vẫn MỞ (n=4).
  - Vì sao S6 vẫn không đề xuất đóng toàn vẹn dù 60fps dày hơn:
    (1) 30fps đúng vạch 80% — biên mỏng nhất kể từ khi pool vượt
    80% (N5); (2) 2 lần E1 liên tiếp chênh nhau 0,73× → 1,05× chỉ
    vì tải — metric tỉ lệ FPS vẫn là hàm của chế độ máy, không
    phải hằng số của code; (3) chân yên 60fps mới n=1, chân yên
    30fps n=4, cả hai đều chưa đủ CI có nghĩa; (4) cửa sổ S6 60fps
    chỉ 3 lần, không đủ 5 — pool vượt nhờ cộng dồn qua cửa sổ
    trượt, không nhờ một cửa sổ S6 hoàn chỉnh (cùng lưu ý như R6).
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5/Q7/R6. S6 bổ sung
  bằng chứng ủng hộ B: 2 lần E1 liên tiếp 0,73× → 1,05× (cùng máy,
  cùng code, cách nhau 4 phút) và run1 60fps có tỉ lệ 2,45× kề tỉ
  lệ 0,62× trong cùng một lần. Gap-mean hiện chỉ 2/3 PASS và lệch
  chiều draw-fps nên vẫn chưa có metric thay thế sẵn.
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5/Q7/R6. S6
  làm phương án này bớt vô vọng hơn một chút: lần yên 60fps đầu
  tiên xuất hiện mà không cần tắt sibling — tải sibling có lúc hạ
  đủ để baseline lên ~20 fps. Nhưng đó là may mắn về thời điểm
  (nửa sau phiên đã trượt về tải); chờ đợi thụ động vẫn có thể kéo
  dài — cần quyết định vận hành (đo ngoài giờ vòng lặp hoặc tắt bớt
  sibling) nếu parent muốn n≥10 lần yên. Đó là quyết định của
  parent/user, không phải của S6.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 86%/80% mà
  bỏ qua chân yên; đóng chân yên 60fps theo 1 điểm 0,99×; trích
  1,33× của run2 như tốc độ deint (số của cửa sổ tải thuận lợi);
  trích 0,73× của E1 run1 như tốc độ deint (số của 2 slot đầu phiên
  đóng băng).

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa chẩn đoán probe 78f1/79g1 (EPERM-vs-port, ghi kèm từng lần thử) | `node --check` OK cả 2 file; chuỗi "(cổng bị chiếm?)" cũ không còn ở code chạy (chỉ còn trong comment giải thích đã bỏ) |
| Fault-injection kích hoạt chẩn đoán E1 (nhánh port-conflict) | dummy server giữ :5580 → E1 exit 2, chẩn đoán "cổng bị chiếm" đúng qua nhánh mediaStatus=200 (xem §7); không vite/chrome mồ côi sau đó |
| Regex chẩn đoán kiểm tra offline | 5/5 case đúng kỳ vọng (EPERM thật / npm EPERM / EADDRINUSE / thông báo thân thiện của vite / log sạch) — xem §7 |
| `node --test deint-fps-verdict-83k3.test.mjs` | **12/12** (11 cũ + 1 mới đếm slot đóng băng) |
| Gộp pool tính lại (`analyze-pool91s6.py`) | khớp số R6 đã công bố (pool 30 n=27/n=28, pool 60 n=11); 60fps S6 tính lại từ fpsSlots khớp ratioMean đã ghi (1,19 / 1,33 / 0,99); frozenSlots E1 khớp tính lại cả 2 lần |
| Cửa sổ S6 60fps ×3 headed (probe N10) | **3/3 hoàn thành, 3/3 PASS** (1,19 / 1,33 / 0,99), 4/4 cases mỗi lần |
| Cửa sổ S6 E1 30fps ×2 headed | run1 **8/10** (G1+G5 FAIL), run2 **10/10 PASS** |
| Headed H9/C3 (mọi lần chạy S6) | **0 lỗi trang** (E1 10/10 + 10/10, 60fps 4/4 ×3) |
| Pixel D1 60fps (S6) | MAD 0,3835 giống hệt nhau 3/3 lần, giống hệt M1/N10/R6 — tap áp thật |
| Pixel G2/G7a/G7b/G8 E1 (cả 2 lần) | giống hệt N5/Q7/R6 (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52) |
| Playhead 60fps S6 (33 slot) | run2/run3 0,83–1,02× sạch; run1 0,21–1,05× (lag dưới tải, không teleport); không slot nào ≥1,3× |
| Harness md5 trước–sau cửa sổ đo | `clicktest-77e1-deint-fps.mjs` 26b7d572… (khớp R6), `deint-fps-verdict-83k3.mjs` fcac097d… (khớp R6), test 7a49f9ad… (khớp R6), `probe-86n10-config-fps.mjs` 3d2443e0… (không đổi) — **không đổi** suốt lượt |
| Probe 78f1/79g1 md5 sau sửa | 78f1: 5b123275…, 79g1: 53686333… (mới — chỉ sửa của S6 trước khi đo) |
| `preview.tsx` / `playheadPacing.ts` | không chạm (không sửa production) |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm |
| Không process mồ côi sau đo | không vite/chrome nào còn chạy; không listener :55xx/:96xx; Xvfb :199 còn chạy là của luồng sibling (bắt đầu 17:40, trước lượt S6); socket X `/tmp/.X11-unix/X180` còn lại sau lần E1 (hành vi cũ như R6) |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — S6 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn.
2. **Pool 30fps đúng vạch 80% (24/30).** Thêm 1 lần FAIL nữa là rơi
   dưới 80%; đừng trích 80% như số chắc. Lần E1 run1 0,73× bị kéo
   xuống bởi 2 slot đầu phiên đóng băng 0,00 fps (xem §3.1).
3. **Pool 60fps vượt 80% nay dày hơn (12/14 = 86%)** nhưng 3 lần S6
   vẫn đo dưới tải sibling (baseline 2,26 / 6,23 / 19,01 fps — run3
   chỉ yên nửa đầu). Đừng trích 86% mà không kèm chế độ đo.
4. **Chân yên 60fps mới n=1 (0,99×).** Một điểm không có CI có nghĩa;
   đừng dùng để đóng chân yên hay để nói "deint ngang baseline trên
   máy nhanh".
5. **G1 FAIL ở E1 run1 (gap combing 0)** là hành vi đo đã biết (R
   interlaced = progressive = 0,74 ở canvas này — cùng giá trị tuyệt
   đối như mọi lần trước), không phải hồi quy sản phẩm: cùng phiên
   đó G2 chứng minh tap hoạt động đúng (R 0,74 → 0,51, MAD 0,5821).
   G1 PASS ở run2 (gap 0,14) với cùng canvas.
6. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→S6) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật. Bằng chứng mạnh nhất đợt này: 2 lần E1 liên
   tiếp 0,73× → 1,05× cách nhau 4 phút, không đổi code.
7. **Cửa sổ S6 60fps chỉ 3 lần** (nhiệm vụ chỉ yêu cầu 3 lần đo
   thêm, không phải cửa sổ 5 lần đầy đủ). Không có verdict luật
   (b) riêng cho cửa sổ S6 — chỉ có cửa sổ trượt 5 lần mới nhất
   (5/5 PASS) và pool gộp n=14.
8. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác).
   Đừng trích chỉ một tiêu chí (CI đạt, tỉ lệ PASS không).
9. **Luật median-5 lật 9/26 cửa sổ trượt 30fps.** Đừng trích
   verdict của một cửa sổ 5 lần đơn lẻ như kết luận chắc; luôn
   ghi kèm chế độ đo (baseline mean fps) và cửa sổ.
10. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích
    "combo 0,76×" như tốc độ combo.
11. **Chẩn đoán EPERM-vs-port: nhánh EPERM vẫn CHƯA kích hoạt bằng
    fail thật** (xem §7). Thêm nữa: thông báo thân thiện của vite
    ("Port 5580 is already in use") KHÔNG khớp regex EADDRINUSE
    hiện tại (`/EADDRINUSE|address already in use/i`) — nếu vite
    thoát chỉ với thông báo đó và không có server lạ nào trả lời
    cổng, chẩn đoán sẽ là "chưa rõ" thay vì "cổng bị chiếm". S6
    KHÔNG sửa regex (giữ đúng logic R6 đã review; cần parent quyết
    có thêm mẫu `/Port \d+ is already in use/` hay không).
12. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 8–10 luồng song
    song.** Tải sibling là biến số lớn nhất (load 1-phút 0,79–10,25;
    RAM khả dụng 0,5–3,5 GB trong cửa sổ S6). Loadavg lúc bắt đầu
    KHÔNG dự báo được tải trong lúc đo (E1 run1: bắt đầu 2,17 →
    kết thúc 10,25).

## 7. Nợ mở cho đợt sau

1. **G1 đóng hay chưa — QUYẾT ĐỊNH CỦA PARENT/USER** (xem §4).
   Nếu đóng một phần (chế độ tải, cả hai fixture), chân yên vẫn
   mở như hai mục con riêng (30fps n=4, 60fps n=1).
2. Chế độ yên cần thêm lần đo nếu chọn phương án C — đợt thứ 6 liên
   tiếp không có lần yên 30fps nào; lần yên 60fps đầu tiên đến nhờ
   tải sibling hạ đúng lúc, không nhờ thay đổi vận hành.
3. 30fps: pool đúng vạch 80% (24/30) — cần thêm lần đo để biên dày
   hơn; đặc biệt cần lần đo ở baseline "sạch" hơn (≥2 fps, không
   đóng băng đầu phiên) để tỉ lệ có nghĩa hơn E1 run1.
4. Harness: (a) kích hoạt thử nhánh chẩn đoán EPERM bằng 1 lần vite
   fail thật do EPERM (hoặc fault-injection tương đương) — hiện
   chỉ nhánh port-conflict đã kích hoạt thật; (b) xem xét thêm mẫu
   `/Port \d+ is already in use/` vào regex EADDRINUSE (phát hiện
   §6 mục 11 — S6 chưa sửa, chờ parent quyết); (c)
   `probe-79g1-deint-source.mjs` KHÔNG có vòng thử lại vite và
   không có chuỗi "cổng bị chiếm?" — ngoài phạm vi S6, chưa sửa.
5. Playhead teleport (M1 §3.2 / N10 §7.3): luồng riêng, đo A/B
   trước–sau — không thuộc S6.
6. EPERM: probe v2 DEAD/STALE (Q7 §3.1); cần quyết cron riêng 10
   phút (LIMITS gộp đợt 88 §3 mục 4 — parent KHÔNG tự tạo trong
   phiên nền, chờ user). S6 chỉ ghi nhận: không có dấu EPERM
   trong log 5 lần đo (grep 0 kết quả).
7. TTS / gate / vidstab / kernel / G1-G2 / WebKit / GPU-Safari:
   nợ của các luồng khác — không thuộc S6.

## 8. Kích hoạt chẩn đoán E1 bằng fail thật (mục c) — chi tiết

Mục tiêu: kiểm tra bọc try/finally + chẩn đoán EPERM-vs-port của R6
đã kích hoạt bằng 1 lần vite fail thật chưa.

**Fault-injection (có kiểm soát, không chạm production):** chạy
dummy server Node giữ cổng :5580, trả 200 mọi path (giả lập "server
luồng khác/mồ côi giữ cổng" — đúng kịch bản E9 đợt 77), rồi chạy E1
với `E1_DEV_PORT=5580` ép cứng. Scratch:
`hidden_files/round91-s6/fault-inject-port/`.

**Kết quả: nhánh port-conflict ĐÃ kích hoạt bằng fail thật.**
Harness exit 2 sau 3 lần thử (~1s; vite chưa kịp in log đã bị media
probe 200 loại). Thông báo lỗi cuối vòng:

> `vite dev + media probe không lên sau 3 lần thử — chẩn đoán: cổng
> bị chiếm (EADDRINUSE trong log hoặc cổng vẫn trả lời sau khi vite
> thoát — có server khác/mồ côi giữ cổng). lần 1: cổng :5580, exit
> null, media 200, cổng-vẫn-trả-lời=false, đuôi log: (trống) | lần
> 2: … | lần 3: …`

- Chẩn đoán đúng ("cổng bị chiếm") và kích hoạt qua nhánh
  `mediaStatus === 200` (foreign server) — đúng kịch bản E9.
- **Nhưng 2 chi tiết phải ghi trung thực:** (i) vite tail TRỐNG và
  exit null ở cả 3 lần — vite chưa kịp thoát/in log trước khi
  harness loại lần thử (fetch trúng dummy ngay); nên nhánh con
  regex EADDRINUSE trong log KHÔNG được kiểm chứng — chẩn đoán đúng
  nhờ nhánh foreign-server, không nhờ regex. (ii) `portStillServes`
  = false ở cả 3 lần vì nhánh đó chỉ chạy khi `!up` — ở đây `up`
  = true ngay (dummy trả 200) nên không đo cờ này.
- **Bọc try/finally ĐÃ kích hoạt:** harness exit 2 nhưng `killAll()`
  trong finally chạy — sau đó không còn vite/chrome nào, không
  listener :55xx/:96xx. Dummy server đã tắt tay sau test (:5580
  không còn trả lời). Một sự cố nhỏ: lệnh `pkill -f
  dummy-foreign-server.mjs` khớp cả dòng lệnh shell của chính S6
  nên shell đó bị SIGTERM (exit 15) — dummy đã chết trước đó nên
  không ảnh hưởng kết quả; lần sau dùng `pkill -f` với pattern
  không tự khớp hoặc kill theo PID.
- **Nhánh EPERM vẫn CHƯA kích hoạt bằng fail thật:** không có sóng
  EPERM nào trong lượt (grep 0 kết quả ở cả 5 lần đo + lần
  fault-injection), và S6 không tạo được sóng EPERM giả một cách an
  toàn — chẩn đoán EPERM vẫn chỉ qua review code + kiểm tra regex
  offline. Regex kiểm tra offline 5/5 đúng: EPERM thật → true,
  npm EPERM → true, EADDRINUSE node → true, thông báo thân thiện
  của vite ("Port 5580 is already in use") → false (xem §6 mục
  11), log vite sạch → false.

## 9. Sửa chẩn đoán probe tick-time 78f1/79g1 (mục b) — chi tiết

Cả hai file giữ nguyên vòng thử vite 3 lần (pickFreePort + media
probe 206) nhưng thay dòng throw cuối vòng:

- Cũ: `throw new Error("vite dev + media probe không lên sau 3 lần
  thử (cổng bị chiếm?)")` — chẩn đoán mặc định sai khi vite exit 1
  do EPERM (Q7 §3.1).
- Mới: ghi `viteAttempts[]` từng lần (cổng, exit code, media status,
  cờ cổng-vẫn-trả-lời — fetch DEV_URL sau khi vite thoát), đọc đuôi
  file log vite (best-effort), chẩn đoán EPERM-trước / port-sau
  đúng như R6, kèm chi tiết từng lần trong thông báo lỗi.
- Khác R6 ở một điểm (ghi rõ): hai probe này ghi vite log qua fd
  file nên dưới sóng EPERM file có thể 0 byte — khi đó chẩn đoán chỉ
  là "chưa rõ" kèm cờ cổng-vẫn-trả-lời, không khẳng định cổng bị
  chiếm. Nâng cấp lên pipe + đuôi log bộ nhớ như E1 là việc để đợt
  sau (ngoài phạm vi S6: chỉ sửa chuỗi chẩn đoán).
- `node --check` OK cả 2 file; không chạy lại probe 78f1/79g1 đầy đủ
  (ngoài phạm vi S6 — chỉ sửa chẩn đoán, không đổi logic đo).

## 10. Cách chạy lại

```bash
# Đo 60fps 1 lần (probe N10, deint-only; đổi N10_LABEL mỗi lần):
N10_LABEL=60fps-deint-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round91-s6/60fps-deint-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Đo 30fps 1 lần E1 (harness mới; đổi E1_SCRATCH mỗi lần):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round91-s6/e1-run1 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Gộp số (đọc report JSON đã có + số đã công bố, không cần headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round91-s6/analyze-pool91s6.py
# Verdict riêng 1 thư mục E1 (đọc headed-runN):
node apps/web/scripts/deint-fps-verdict-83k3.mjs analyze <dir>
# Test hồi quy luật median + slot đóng băng (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
# Fault-injection kích hoạt chẩn đoán E1 (xem §8):
node ~/workspace/goals/capcut-clone-video-editor/hidden_files/round91-s6/dummy-foreign-server.mjs &
E1_DEV_PORT=5580 E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round91-s6/fault-inject-port \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
```
