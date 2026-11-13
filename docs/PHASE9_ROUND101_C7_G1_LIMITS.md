# Đợt 101 C7 — G1: thêm bằng chứng đo cho quyết định metric G5/M2 của user (KHÔNG TỰ ĐÓNG G1)

Ngày: 13/11/2026 (lượt cron 06:35 +07; đo 23:40Z 12/11 – 00:09Z 13/11).
Nợ: LIMITS gộp đợt 100 §4 mục 2 (G1 — user quyết metric G5 hay M2; A9 đợt 99:
dưới M2 khung 16/20 không đạt được, tối đa 15/20).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; boot aa3f2b67 đầu lượt, **reboot #25 lúc 23:51:32Z**
→ boot 3a12a7d3 giữa lúc đo — xem §3.4; load 1-phút 0,59–13,06;
RAM khả dụng 454–2969 MB trong cửa sổ đo).

**Trạng thái cuối: CHỈ THU THẬP BẰNG CHỨNG — KHÔNG sửa production, KHÔNG đổi
ngưỡng (0,75×), KHÔNG đổi metric, KHÔNG tự đóng G1, KHÔNG tự kết luận khung
nào mới là khung đúng. Quyết định cuối thuộc parent/user (§7).**
Đo mới: E1 30fps ×7 + N10 60fps ×5 (12 lần, cả tải lẫn yên, harness E1 đã
fix Space-toggle của B7); gộp thêm 9 lần E1 + 2 lần N10 của B7 đợt 100
**lần đầu tiên vào pool JSON** (B7 chỉ tính lại, chưa tạo v11).
Không kiểm lại TTS 39. Không thử birefnet. Không đụng ci-security.yml.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

**Câu hỏi của brief: "với mẫu mới, M2 có lần nào đạt 16/20 không?" — Đáp án
phụ thuộc vào KHUNG nào được tính. C7 trình bày đủ 4 khung, không chọn thay user:**

| Khung chân yên 30fps dưới M2 | Số | Đạt 16/20 (80%)? |
|---|---|---|
| **(a) Khung cố định 20 lần yên ĐẦU** (khung A9 dùng) | tối đa **15/20 = 75%** | **KHÔNG — kết luận A9 đứng vững** |
| **(b) Khung trượt 20 lần yên MỚI NHẤT** (khung mới C7 trình bày) | **19/20 = 95%**, tính đủ, không mất dữ liệu | **CÓ — vượt 16/20** || **(c) Tích lũy đầy đủ** (toàn bộ chân yên) | **21–22/27 = 77,8–81,5%** | **CẮT NGANG mốc** — phụ thuộc I5-1 (không tính lại được) |
| **(d) Chỉ lần tính-lại-được** (loại 4 lần mất fpsSlots) | **21/23 = 91%** | CÓ — nhưng là số có lệch chọn mẫu (A9 đã cảnh báo) |

- **Khung (a) không đổi dù đo thêm bao nhiêu lần nữa:** 5 lần FAIL đã chốt
  trong 20 lần đầu (J3-1, L3-1, L3-2 là G5 FAIL → M2 FAIL chắc chắn;
  U6 r2 và X6 r6 FAIL dưới cả hai metric) — tối đa 15/20 là trần cứng,
  không phải do thiếu mẫu. 3 lần yên mới của C7 đều nằm NGOÀI 20 lần đầu
  nên không cứu được khung này.
- **Khung (b) là điểm mới của đợt này:** 20 lần yên mới nhất (V5 r3 →
  C7 r3) có 19/20 PASS dưới M2, chỉ 1 FAIL (X6 r6, 0,63×) — và 6 lần yên
  mới nhất (B7 r7–r9, C7 r1–r3) đều PASS dưới cả hai metric.
  Nhưng khung trượt là khung C7 ĐỀ XUẤT để user xem xét, KHÔNG phải khung
  đã được duyệt — user phải quyết có chấp nhận đổi khung hay không (§7 Q1).
- **Khung (c):** 21 PASS chắc chắn + I5-1 (G5 0,93×) chưa biết. Nếu I5-1
  PASS dưới M2 thì 22/27 = 81,5% ≥ 80%; nếu FAIL thì 21/27 = 77,8% < 80%.
  M2 của I5-1 **không bao giờ tính lại được** (mất fpsSlots) — khoảng
  này là vĩnh viễn, không đo thêm nào xóa được.
- **Để đạt 80% tích lũy trong kịch bản tốt nhất (I5-1 PASS): cần thêm
  1 lần yên PASS dưới M2 nữa** (23/28 = 82,1%). Trong kịch bản xấu
  (I5-1 FAIL): cần thêm 2 lần (23/28 với 21 hiện có + 2).
- **0 lần bất đồng mới:** 23 lần B7+C7 đều đồng thuận G5/M2 (12/12 C7 +
  11/11 B7). Đồng thuận toàn lịch sử nay **98/104 (94,2%)**, vẫn đúng
  6 lần bất đồng cũ của A9, 0 lần FAIL→PASS.
- **Quy luật "G5 ≥ 1,00 không bao giờ lật" MỞ RỘNG: nay 50 lần, 0 lần lật**
  (A9: 36 lần). G5 PASS trong [0,75; 1,00): 49 lần, 6 lần lật — cả 6 đều
  là 6 ca cũ.
- **Chân yên 30fps dưới G5: n=27, PASS 23/27 (85%)**, median 0,950,
  CI [0,880; 0,984] — đủ cả ba tiêu chí chặt, biên dày hơn A7 (17/21);
  chuỗi PASS yên liên tiếp nay là **21**. Loại run7 (slot-tải-đầu) vẫn
  còn 22/26 = 84,6%.
- **Chân yên 60fps: 17/17 PASS (100%) dưới CẢ HAI metric**, tính đủ
  hoàn toàn (không mất dữ liệu), median M2 0,980, CI [0,928; 1,010].
- **C7 riêng: 12/12 lần PASS dưới cả hai metric** (E1 7/7, N10 5/5).
  Lần sát ngưỡng nhất: C7 N10 run4 (G5 0,80 → M2 0,77) và C7 E1 run7
  (G5 0,91 → M2 0,79) — cả hai đều giữ PASS nhưng M2 chỉ hơn ngưỡng
  0,02–0,04.

## 2. Bảng quyết định — pool v11 (G5) + chân yên M2

Ngưỡng 0,75× giữ nguyên. Yên: baseline mean ≥ 10 fps (luật X6). Luật (b) =
median 5 lần ≥ 0,75 VÀ ≥4/5 lần ≥ 0,75. CI 95% của mean (t-Student).
Script: `hidden_files/round101-c7/analyze-pool101c7.py` (gộp pool) +
`analyze-m2-quiet101c7.py` (chân yên M2, kế thừa parser A9). JSON gộp:
`benchmarks/results/g1-evidence-v11-101c7.json` (pool30 n=82, pool60 n=54).

### 2.1 Pool v11 dưới G5 (so với v10/A7)

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Đổi so với v10 |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ | 82 | 0,995 | 0,997 | 0,205 | [0,951; 1,042] | **73/82 (89%)** | +7 điểm n, +3 điểm PASS (57/66 = 86%) |
| 30fps — máy tải (<10, trừ hỗn hợp) | 53 | 1,030 | 1,030 | 0,230 | [0,967; 1,093] | 48/53 (91%) | +9 lần, giữ 91% |
| 30fps — máy yên (≥10, trừ hỗn hợp) | 27 | **0,950** | **0,932** | 0,135 | **[0,880; 0,984]** | **23/27 (85%)** | +6 lần, +4 điểm (17/21 = 81%) |
| 60fps fixture | 54 | 0,955 | 0,969 | 0,149 | [0,928; 1,009] | **51/54 (94%)** | +7 lần, giữ 94% |
| 60fps — máy tải (<10) | 37 | 0,980 | 0,978 | 0,176 | [0,920; 1,036] | 34/37 (92%) | +4 lần |
| **60fps — máy yên (≥10)** | **17** | **0,940** | **0,948** | 0,055 | **[0,921; 0,975]** | **17/17 (100%)** | +3 lần, vẫn 100% |
| Cửa sổ 5 lần 30fps mới nhất (C7 r3–r7) | 5 | 0,94 | — | — | — | 5/5 | luật (b) PASS ỔN ĐỊNH |
| Cửa sổ 5 lần 60fps mới nhất (C7 r1–r5) | 5 | 0,87 | — | — | — | 5/5 | luật (b) PASS ỔN ĐỊNH |

### 2.2 Chân yên 30fps dưới M2 — bốn khung (§1)

| Khung | n | M2 PASS | Median M2 | Mean M2 | CI 95% | Ghi chú |
|---|---|---|---|---|---|---|
| (a) 20 lần yên đầu (cố định) | 20 | tối đa 15/20 (75%) | — | — | — | 5 FAIL đã chốt; trần cứng, không cứu được |
| (b) 20 lần yên mới nhất (trượt) | 20 | **19/20 (95%)** | 0,955 | 0,945 | [0,896; 0,993] | tính đủ, 0 mất dữ liệu; chỉ FAIL X6 r6 |
| (c) Tích lũy đầy đủ | 27 | **21–22/27 (77,8–81,5%)** | 0,950 | 0,933 | [0,879; 0,986] | khoảng do I5-1 chưa biết |
| (d) Chỉ lần tính-lại-được | 23 | **21/23 (91%)** | 0,950 | 0,933 | [0,879; 0,986] | lệch chọn mẫu: loại đúng 3/4 lần xấu nhất |
| (e) Yên sạch (loại run7 slot-tải-đầu) | 26 | 20–21/26 (76,9–80,8%) | 0,955 | 0,938 | [0,882; 0,995] | tính-lại-được 20/22 (91%); cũng cắt ngang 80% |

### 2.3 Chân yên 60fps dưới M2 (tính đủ hoàn toàn)

| | n | M2 PASS | Median | Mean | CI 95% |
|---|---|---|---|---|---|
| Yên 60fps | 17 | **17/17 (100%)** | 0,980 | 0,969 | [0,928; 1,010] |

Không lần yên 60fps nào mất fpsSlots, không lần nào bị gắn cờ
slot-tải-đầu — đây là chân duy nhất không có khoảng bất định nào.

## 3. Cửa sổ đo mới C7 — chi tiết từng lần

### 3.1 E1 30fps ×7 — 23:40–00:09Z — 7/7 PASS cả hai metric, 0 abort

Lệnh (tuần tự): `E1_SCRATCH=hidden_files/round101-c7/e1-runN
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (harness B7 đã fix
Space-toggle; wave 1 lần 1–3 đầu lượt bắt cửa sổ yên, wave 2 lần 4–7
sau reboot #25 để thêm mẫu tải).
**Cửa sổ yên mở ngay đầu lượt (run1–3 yên), đóng từ run4 (tải/hỗn hợp).**

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | Baseline mean | 5–10 tỉ lệ drift-corrected | G5 | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 23:40–23:43 | 1,35 | vòng 1: 18,14 / vòng 2: 14,21 | v1: 1,00 / 0,90 / 0,85 / 0,99 / 0,58 → 0,86; v2: 1,40 / 2,07 / 1,76 / 0,81 / 0,78 → 1,36; **gộp 1,11** | **1,11×** | 0,95 | **PASS (yên, 2 vòng)** |
| 2 | 23:43–23:45 | 1,51 | 22,79 | 0,86 / 0,95 / 1,15 / 0,60 / 1,10 | **0,93×** | 0,95 | **PASS (yên)** |
| 3 | 23:45–23:47 | 5,96 | 19,88 | 1,10 / 0,85 / 0,78 / 1,08 / 1,31 | **1,02×** | 1,08 | **PASS (yên)** |
| 4 | 23:59–00:01 | 1,82 | 7,10 | 1,35 / 1,37 / 0,57 / 0,86 / 1,16 | **1,06×** | 1,16 | **PASS (tải)** |
| 5 | 00:01–00:03 | 0,59 | 5,21 | 0,47 / 1,04 / 1,20 / 0,99 / 1,01 | **0,94×** | 1,01 | **PASS (tải)** |
| 6 | 00:03–00:07 | 13,06 | vòng 1: 5,09 / vòng 2: 17,22 | v1: 0,91 / 0,89 / 1,02 / 0,76 / 0,78; v2: 0,59 / 1,00 / 0,84 / 0,90 / 1,09; **gộp 0,88** | **0,88×** | 0,90 | **PASS (HỖN HỢP — chỉ tính pool tổng)** || 7 | 00:07–00:09 | 5,39 | 4,12 | 0,87 / 1,48 / 0,77 / 0,79 / 0,65 | **0,91×** | 0,79 | **PASS (tải)** |

- **Run1 (1,11×) là lần yên 2 vòng thứ hai trong lịch sử G1** (sau
  A7 run1 yên; Z9 run5 là hỗn hợp, A7 run3 và B7 run4 là tải): vòng 1
  mean 0,86× rơi vùng xám 0,6–0,9 → quy
  tắc 98Z8 đo thêm vòng 2 (1,36×), verdict gộp 10 tỉ lệ 1,11× PASS.
  Cả 2 vòng đều yên (18,14 / 14,21 fps) nên tính trọn vào chân yên —
  không phải hỗn hợp. M2 gộp 10 tỉ lệ 0,95 PASS.
- **Run6 (0,88×) là lần hỗn hợp thứ hai trong lịch sử G1** (sau Z9
  run5): vòng 1 tải (5,09 fps, mean 0,87×) → vòng 2 yên (17,22 fps,
  mean 0,88×), verdict gộp 0,88× PASS. Theo tiền lệ Z9 §3.3: **chỉ tính
  vào pool tổng, KHÔNG tính vào chân yên lẫn chân tải**. Nếu parent
  tính khác (vd tính vòng 2 như 1 mẫu yên) thì chân yên thành 24/28
  dưới G5 — C7 không tự đổi cách tính, chỉ ghi rõ độ nhạy.
- **Run7 (M2 0,79×) là lần sát ngưỡng nhất đợt này:** 3/5 tỉ lệ dưới
  0,85 (0,77 / 0,79 / 0,65); median cứu PASS nhưng chỉ hơn ngưỡng
  0,04. Đừng trích 1,48× đơn lẻ trong lần này.
- **Run4 (M2 1,16 > G5 1,06):** median vượt mean — phân phối lệch trái
  (1 slot thấp 0,57 kéo mean xuống), cùng hướng với Z9 N10 run3
  (G5 1,31 → M2 1,39). M2 > G5 ở 5/7 lần E1 đợt này (run2–run6) —
  tỉ lệ trong các lần này lệch trái nhiều hơn lệch phải.
- **0 slot đóng băng trong cả 12 lần đo C7** (E1 ×7 + N10 ×5) — như
  X6/Z9/A7/B7; ngay cả lần tải nặng (baseline 3,26–5,21 fps) cũng
  không có slot < 0,5 fps. Bước loại của M2 không bắn lần nào đợt này
  (cả 23 lần B7+C7).
- **Pixel cả 7 lần giống hệt lịch sử:** G2 MAD 0,5821; G7a 0,6903;
  G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt N5→B7).
  **H9 0 lỗi trang cả 7 lần.** Không có dấu EPERM trong log 12 lần đo
  C7 (grep 0 kết quả).
- **Toggle Space (harness B7): 198 lần toggle, 0 retry, 0 fallback,
  tất cả lật ngay bằng Space.** Chậm nhất: run6 slot 6 play 415ms
  (pause 68ms) — xem §3.5 về cách đọc đúng con số này.

### 3.2 60fps deint-only ×5 (probe N10) — 23:47–23:59Z — 5/5 PASS cả hai metric

Lệnh (tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round101-c7/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 23:47–23:49 | 3,95 | 9,71 fps | 1,07 / 1,08 / 1,11 / 0,88 / 0,83 | **0,99×** | 1,07 | PASS, 4/4 (tải) |
| 2 | 23:49–23:51 | 5,84 | 10,08 fps | 0,94 / 0,99 / 1,16 / 0,33 / 0,95 | **0,87×** | 0,95 | PASS, 4/4 (yên) |
| 3 | 23:53–23:54 | 2,05 | 12,51 fps | 0,88 / 1,09 / 1,02 / 0,32 / 1,70 | **1,00×** | 1,02 | PASS, 4/4 (yên) |
| 4 | 23:54–23:56 | 7,56 | 3,26 fps | 0,74 / 1,10 / 0,88 / 0,77 / 0,52 | **0,80×** | 0,77 | PASS, 4/4 (tải) |
| 5 | 23:56–23:59 | 7,36 | 7,53 fps | 0,52 / 0,75 / 1,22 / 0,95 / 0,91 | **0,87×** | 0,91 | PASS, 4/4 (tải) |

- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 5/5 lần và giống hệt
  M1/N10/R6/S6/T6/U6/V5/W6/X6/Z9/A7/B7 — deint áp thật trên fixture
  60fps, đường code không đổi (cả run1–2 chạy bằng probe trước C8 lẫn
  run3–5 chạy bằng probe sau C8 — xem §3.4).
- **C3 0 lỗi trang cả 5 lần.** Không có dấu EPERM trong log 5 lần đo.
- **Run4 (0,80× → M2 0,77×) là lần 60fps sát ngưỡng nhất đợt này:**
  G5 trong vùng [0,75; 1,00) cần xác nhận bằng M2 (A9 §5.2) và đã giữ
  PASS, nhưng biên chỉ 0,02. 4/5 tỉ lệ dưới 0,90 (0,74 / 0,88 / 0,77 / 0,52).
- **Run2 và run3 đều có 1 tỉ lệ rất thấp (0,33× / 0,32×)** nhưng median
  cứu PASS (0,95× / 1,02×) — đúng kiểu M2 sinh ra để xử lý; G5 của
  run3 = 1,00× đúng vạch quy luật §4.
- **Run1 baseline 9,71 fps — tải theo luật nhưng chỉ thiếu 0,29 fps
  là yên:** phân loại tải/yên theo baseline mean là ranh giới cứng;
  lần này là ca biên của luật (không phải ca biên của verdict).

### 3.3 Các lần B7 đợt 100 — lần đầu tiên vào pool (G5/M2 tính lại từ report)

B7 đo 9 E1 + 2 N10 (20:46–21:15Z 12/11) nhưng chỉ tính lại chân yên,
chưa gộp vào JSON pool nào. C7 tính lại toàn bộ từ report JSON thật
(`hidden_files/round100-b7/`, cùng công thức) và đưa vào pool v11:

| Lần B7 | Baseline | G5 | M2 | Chế độ |
|---|---|---|---|---|
| E1 run1–6 (tải) | 6,00 / 6,53 / 8,38 / 2,53 / 3,70 / 4,93 | 1,01 / 1,05 / 1,06 / 1,00 / 1,49 / 0,98 | 0,89 / 1,07 / 1,05 / 0,84 / 1,19 / 0,98 | tải ×6 |
| E1 run7–9 (yên) | 18,26 / 17,76 / 18,96 | 0,95 / 0,98 / 0,96 | 0,92 / 0,97 / 0,94 | yên ×3 |
| N10 run1 (yên) | 13,98 | 0,86 | 0,82 | yên |
| N10 run2 (tải) | 5,15 | 0,91 | 0,90 | tải |

- Cả 11 lần đều PASS dưới cả hai metric, 0 lần bất đồng mới.
- B7 run5 (G5 1,49×, M2 1,19×) là số phồng do tải (baseline 3,70 fps,
  tỉ lệ 0,45–2,82) — đừng trích làm tốc độ deint.
- 3 lần yên B7 (0,95 / 0,98 / 0,96 dưới G5) là cầu nối giữa A7 và C7:
  chuỗi PASS yên liên tiếp dưới G5 nay là 21 (12 cũ + A7 3 + B7 3 + C7 3).

### 3.4 Nhiễu giữa cửa sổ: reboot #25 + sibling C8 sửa harness giữa lúc đo

- **Reboot #25 lúc 23:51:32Z (boot aa3f2b67 → 3a12a7d3, uptime 1 phút
  lúc kiểm tra 23:52:24Z):** giết driver gốc + runtime session giữa
  N10 lần 3 (slot 4/10 xong, baseline 4,72 / 7,34 / 8,60 fps, combo
  7,30 / 7,40 fps — dữ liệu dở, KHÔNG report, KHÔNG tính vào pool).
  Driver resume (23:53:30Z) xóa scratch lần 3 và chạy lại sạch
  (23:53–23:54, G5 1,00×, report đầy đủ). Không process mồ côi của C7
  sau đo (vite :5173 chạy từ 23:52:33Z không phải của C7 — có thể của
  luồng sibling, C7 không kill).
  Ghi cho luồng EPERM: reboot #25 đóng khoảng mù #19 (bắt đầu sau
  reboot #24 ~21:41:50Z) và mở khoảng mù #20 — việc của luồng EPERM,
  C7 chỉ ghi giờ.
- **Sibling C8 (đợt 101) sửa cả 2 harness giữa cửa sổ đo:**
  `clicktest-77e1-deint-fps.mjs` đổi 23:49:33Z (md5 400efa0a →
  d18e0465), `probe-86n10-config-fps.mjs` đổi 23:50:30Z (md5 3d2443e0
  → 3bc93119); `deint-fps-verdict.mjs` KHÔNG đổi (57a4f6d8).
  Nội dung sửa (đọc code, không sửa production): E1 thêm fault-injection
  keydown chậm — **env-gated, mặc định TẮT** (`E1_FAULT_KEYDOWN_DELAY_MS=0`,
  `E1_FAULT_KEYDOWN_COUNT=0`) nên hành vi đo của C7 không đổi; N10 thêm
  chờ-trạng-thái ở chiều PHÁT (theo mẫu E1/B7) thay cho sleep 800ms cố
  định + throw ngay — thay đổi thời điểm bắt đầu cửa sổ đo 3 giây, KHÔNG
  đổi công thức tỉ lệ.
  Phân bổ phiên bản theo lần đo: E1 run1–3 + N10 run1–2 dùng harness
  trước C8 (node load script lúc bắt đầu lần đo, trước giờ sửa);
  N10 run3–5 + E1 run4–7 dùng harness sau C8.
  Bằng chứng không ảnh hưởng số deint: pixel G2/G7a/G7b/G8 giống hệt
  lịch sử cả 7 lần E1 (trước và sau sửa), D1 MAD 0,3835 giống hệt 5/5
  lần N10 (trước và sau sửa), tỉ lệ tính lại từ `fpsSlots` khớp
  report (script gộp: KHOP, trừ làm tròn 0,01 như tiền lệ A7).
  Bài học lặp lại từ A7 §3.4/B7 §7: vòng lặp song song sửa cùng file là
  rủi ro thường trực — C7 ghi md5 trước/sau MỖI lần E1 (driver gốc) và
  đầu lượt resume; N10 resume chỉ ghi md5 đầu lượt (thiếu md5 từng lần
  — lần sau bổ sung).

### 3.5 Toggle Space — đọc đúng con số 415ms (đính chính heuristic cũ)

E1 run6 slot 6: playWaitMs = 415ms, pauseWaitMs = 68ms. Driver in log
"ghi toggle >400ms (code cũ đã abort)" — **nhãn này SAI ở chiều PHÁT:**
code cũ chờ 800ms cố định ở chiều phát (không throw) và chỉ throw ở
chiều dừng sau 400ms. Play 415ms < 800ms nên code cũ cũng không abort
lần này; nó chỉ ăn mất ~nửa cửa sổ sleep cố định nếu đo bằng code cũ
(B7 đã đổi sang lấy mẫu SAU KHI xác nhận playing=true nên không mất
mẫu). **Kết luận trung thực: đường retry/fallback của B7 VẪN CHƯA bắn
thật trong C7** (198 toggle, 0 retry, 0 fallback; pause chậm nhất
205ms < 400ms; play chậm nhất 415ms < 800ms). 415ms là lần toggle chậm
nhất quan sát được trong C7 — ghi nhận là mốc, không phải bằng chứng
cứu abort. Caveat §7 mục 1 của B7 vẫn đứng nguyên.

## 4. Quy luật G5 ≥ 1,00 và vùng tranh chấp — kiểm lại với mẫu lớn hơn

| G5 của lần PASS | A9 (n=69) | Nay (n=104, R6→C7) |
|---|---|---|
| G5 ≥ 1,00 | 36 lần, **0 lật** | **50 lần, 0 lật** |
| 0,90 ≤ G5 < 1,00 | 19 lần, 2 lật | 33 lần, 2 lật |
| 0,75 ≤ G5 < 0,90 | 10 lần, 4 lật | 16 lần, 4 lật |
| G5 PASS trong [0,75; 1,00) | 29 lần, 6 lật | **49 lần, 6 lật** |

- Quy luật A9 §5.2 đứng vững với mẫu lớn hơn: **không một lần G5 PASS
  nào có G5 ≥ 1,00 lật dưới M2 (0/50)**. 14 lần mới trong vùng này
  (A7 5 lần + B7 5 lần + C7 4 lần) — tất cả giữ PASS.
- Cả 6 lần lật trong lịch sử vẫn nằm trong [0,75; 1,00) — và vùng này
  nay có thêm 20 lần mới (B7+C7: 23 lần, trong đó 14 lần có G5 trong
  [0,75; 1,00)) mà **không lần nào lật thêm**. Tỉ lệ lật trong vùng
  giảm từ 6/29 (21%) xuống 6/49 (12%) — M2 "bắt PASS giả" ít dần khi
  mẫu mới toàn PASS, nhưng 6 ca cũ không biến mất.
- Lần sát ngưỡng nhất đợt này dưới M2: C7 N10 run4 (0,77×) và C7 E1
  run7 (0,79×) — cả hai đều là G5 PASS trong [0,75; 1,00) và giữ PASS
  dưới M2 với biên 0,02–0,04. Nếu đo lại 2 lần này, khả năng lật là
  có thật (không tính được xác suất từ 1 lần đo).

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ đo (sửa harness là của sibling C8 — xem §3.4) |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** chạy lại xanh |
| `node --test deint-fps-verdict-100b7.test.mjs` | **13/13** chạy lại xanh |
| `node --check` 3 script đã dùng | **PASS** cả ba |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS/JS nào (chỉ thêm LIMITS + JSON số đo + file trong hidden_files), cùng tiền lệ A7/A9 |
| Tái tạo v10 (`analyze-pool101c7.py`) | **KHOP đúng** số A7 đã công bố trước khi thêm lần mới (pool 30 n=66 PASS 57/66; pool 60 n=47 PASS 44/47) |
| G5/M2 tính lại từ `fpsSlots`/`g5Rounds` | **KHOP** report cả 23 lần B7+C7 (G5 khớp combinedMean/run1.mean; M2 = median sau loại mẫu số < 0,5 fps — 0 lần có tỉ lệ bị loại; lần 2 vòng = median 10 tỉ lệ theo định nghĩa A9 §9.4) |
| M2 tính lại độc lập (`analyze-m2-quiet101c7.py`) | tái tạo đúng 6 lần lật của A9 + 69 lần R6→Z9 trước khi thêm A7/B7/C7; đồng thuận 98/104 |
| Cửa sổ C7 E1 30fps ×7 headed | **7/7 hoàn thành, 10/10 mỗi lần, 0 abort, 0 `HARNESS LỖI`** — G5: 1,11 / 0,93 / 1,02 / 1,06 / 0,94 / 0,88 / 0,91; yên 3 / tải 3 / hỗn hợp 1 |
| Cửa sổ C7 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 4/4 mỗi lần, 5/5 PASS G5** (0,99 / 0,87 / 1,00 / 0,80 / 0,87), M2 5/5 PASS |
| Headed H9/C3 (mọi lần chạy C7) | **0 lỗi trang** (E1 10/10 ×7, 60fps 4/4 ×5) |
| Pixel D1 60fps (C7) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1→B7 — tap áp thật; giống hệt cả trước/sau sửa probe của C8 |
| Pixel G2/G7a/G7b/G8 E1 (cả 7 lần) | giống hệt N5→B7 (G2 MAD 0,5821; G7a MAD 0,6903; G7b MAD 0,0119; G8 R 0,55 → 0,52, MAD 1,5522) |
| Harness md5 trước/sau mỗi lần E1 | **không đổi trong từng lần** (chỉ đổi GIỮA các lần do C8 sửa — xem §3.4); `deint-fps-verdict.mjs` không đổi cả cửa sổ |
| Không process mồ côi của C7 sau đo | không vite/chrome nào dùng scratch round101-c7 còn chạy; boot-id sau resume 3a12a7d3, không reboot thêm trong cửa sổ resume |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 VẪN MỞ — C7 không tự đóng, không đổi metric, không chọn khung.**
   Mọi câu hỏi ở §7 cần parent/user quyết. Đáp án "M2 có đạt 16/20
   không" đổi theo khung (§1) — đừng trích một khung mà không ghi tên
   khung đó.
2. **Khung (b) trượt 20 lần mới nhất là khung C7 đề xuất để xem xét,
   KHÔNG phải khung đã duyệt.** Khung gốc của G1 là tích lũy (14/18 →
   16/20), khung A9 phân tích là cố định 20 lần đầu. Đừng trình bày
   19/20 như thể đó là khung chính thức.
3. **Khoảng 21–22/27 là vĩnh viễn:** M2 của I5-1 không bao giờ tính lại
   được (mất fpsSlots). Mọi kết luận về chân yên tích lũy dưới M2 đều
   phải mang khoảng này, không được chọn một đầu rồi trích như số chắc.
4. **Số "21/23 = 91% dưới M2" là số tập con có lệch chọn mẫu** (A9 §11
   mục 4): 4 lần mất dữ liệu là 3/4 FAIL. Số trung thực là khoảng
   21–22/27 (77,8–81,5%).
5. **Khung (a) 15/20 là trần cứng, không phải do thiếu mẫu:** 5 FAIL đã
   chốt trong 20 lần đầu. Đo thêm 100 lần yên nữa cũng không đổi khung
   này — chỉ đổi khung mới (trượt/tích lũy) mới thay đổi đáp án.
6. **Median của 5 tỉ lệ là thống kê nhiễu:** M2 SD tăng ở N10 trong
   phân tích A9. Hai lần sát ngưỡng đợt này (M2 0,77× / 0,79×) có thể
   lật nếu đo lại — đừng dùng M2 của 1 lần để kết luận; luôn dùng
   median-of-runs + CI + tỉ lệ PASS.
7. **Phân loại yên/tải theo baseline mean nhiễm nhiễu spike** (tiền lệ
   X6 run6; C7 N10 run1 baseline 9,71 fps chỉ thiếu 0,29 là yên).
   Các bảng dùng cùng định nghĩa này để so sánh được với lịch sử —
   đừng đọc "yên" như "mọi slot đều yên".
8. **Lần hỗn hợp C7 run6 tính là 1 lần trong pool tổng** (G5 gộp 0,88;
   M2 gộp 0,90 từ 10 tỉ lệ), theo phân loại của Z9 run5. Nếu parent
   tính khác (tính vòng 2 như 1 mẫu yên) thì chân yên G5 thành 24/28
   — kết luận không đổi, nhưng số phải ghi theo cách tính đã chọn.
9. **Harness đổi giữa cửa sổ đo (C8):** E1 run1–3 + N10 run1–2 dùng
   bản trước C8; N10 run3–5 + E1 run4–7 dùng bản sau C8. Thay đổi N10
   ở chiều PHÁT (chờ-trạng-thái thay sleep 800ms) đổi thời điểm bắt
   đầu cửa sổ đo — số deint không đổi theo bằng chứng pixel + tỉ lệ
   tính lại (§3.4), nhưng 2 nhóm lần đo không còn dùng đúng một bản
   harness. Ghi rõ phiên bản từng lần khi trích.
10. **Số đo chỉ đúng trên VM này** (CPU-only, 4 vCPU, Chrome
    `--disable-gpu`, Xvfb) trong giờ vòng lặp 8–10 luồng song song
    + 1 lần reboot giữa chừng. Không suy ra máy khác / máy có GPU /
    Safari thật.
11. **Đường retry/fallback của B7 vẫn chưa bắn thật** (§3.5): 198 toggle
    C7, 0 retry, 0 fallback; caveat B7 §7 mục 1 vẫn đứng nguyên.
    415ms play ở run6 slot 6 KHÔNG phải ca cứu abort (code cũ chờ
    800ms ở chiều phát).
12. **N10 run3 lần đầu chết do reboot #25** (slot 4/10, không report)
    — đã chạy lại sạch; dữ liệu dở KHÔNG tính vào pool, KHÔNG tính
    là FAIL. Reboot #25 cũng là thông tin cho luồng EPERM (khoảng mù
    #19 đóng / #20 mở).
13. G1 (deint) vẫn mở, chờ user quyết (§7) — birefnet 0 lần thành công
    (chỉ thử lại khi RAM đổi); EPERM probe #20 + khoảng mù #20 (sau
    reboot #25 23:51:32Z); ci-security.yml vẫn 403 chờ user; TTS 39
    CẤM kiểm lại; WebKit clip D, pre-pass keyframes, motion blur +
    mask, trackgeq, fallback, harness O8.

## 7. Câu hỏi cho user — C7 chỉ hỏi, không tự trả lời

**Q1 — Khung 16/20 tính theo khung nào?**
(a) Cố định 20 lần yên đầu: M2 tối đa 15/20 — KHÔNG BAO GIỜ đạt, dù đo
thêm bao nhiêu lần. (b) Trượt 20 lần yên mới nhất: M2 đang 19/20 — ĐÃ
ĐẠT. (c) Tích lũy đầy đủ: M2 đang 21–22/27 — cắt ngang 80%, phụ thuộc
I5-1 không tính lại được. C7 không chọn thay user: nếu user giữ khung
(a) thì đáp án là "M2 không đạt, giữ G5"; nếu user chấp nhận (b) hoặc
(c) với điều kiện I5-1 PASS thì đáp án đổi. **Đây là quyết định về
luật chơi, không phải về số đo.**

**Q2 — 4 lần yên cũ mất fpsSlots xử lý thế nào?**
Giữ nguyên khoảng 21–22/27 (trung thực nhất, nhưng không bao giờ cho
một số duy nhất); loại khỏi mẫu và trích 21/23 = 91% (đẹp nhưng lệch
chọn mẫu — A9 đã cảnh báo); hay ghi I5-1 là "không xác định" và hoãn
quyết định tích lũy cho đến khi có thêm 1–2 lần yên mới (lúc đó khoảng
sẽ thu hẹp tương đối)?

**Q3 — Chọn G5 hay M2 làm chuẩn, và khi nào?**
Theo khuyến nghị A9: giữ G5 đến khi khung 16/20 khép rồi chuyển M2.
Nhưng khung (a) dưới M2 không bao giờ khép — nên "khép" ở đây phải
hiểu theo khung nào (Q1)? Nếu user chọn M2 ngay: có chấp nhận định
nghĩa lại khung (khung mới trên lần có fpsSlots + 6 điều kiện A9 §9)
không? Ngưỡng giữ nguyên 0,75× trong mọi phương án (A9 §5.3).

**Q4 — Lần hỗn hợp C7 run6 (và Z9 run5) có giữ cách tính "chỉ pool
tổng" không?**
C7 giữ tiền lệ Z9. Nếu user muốn tính vòng 2 yên của run6 như 1 mẫu
yên thì chân yên G5 thành 24/28 (85,7%), chân yên M2 tính-lại-được
thành 22/24 (91,7%) — kết luận không đổi, nhưng số khung đổi. Cần
user xác nhận cách tính trước khi đợt sau trích số.

**Q5 (không cần user trả lời ngay) — Có nên đo thêm 1–2 lần yên nữa
trước khi quyết?**
Trong kịch bản tốt nhất (I5-1 PASS), 1 lần yên PASS dưới M2 nữa là
đủ 80% tích lũy (23/28). Cửa sổ yên mỗi lượt chỉ mở ~5–9 phút đầu
lượt (C7: run1–3 đầu lượt; B7: run7–9 cuối lượt) nên mỗi lượt chỉ cho
~3 mẫu yên chắc. Nếu user muốn thêm mẫu trước khi quyết thì đợt sau
nên đo E1 ngay đầu lượt như công thức A7/B7/C7.

## 8. Cách chạy lại

```bash
# 1 lan E1 30fps bang harness B7/C8 (doi E1_SCRATCH moi lan; DO E1 TRUOC,
# ngay dau luot de bat cua so yen; vong nay cua so yen mo dau luot):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c7/e1-runX \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# 1 lan N10 60fps (probe C8: ca hai chieu cho-trang-thai):
N10_LABEL=60fps-deint-runX N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c7/60fps-deint-runX \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Gop pool v11 + chan yen M2 (doc report JSON da co, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c7/analyze-pool101c7.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c7/analyze-m2-quiet101c7.py
# Test hoi quy luat median + M2 + luat phan loai slot-tai-dau (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs   # 17/17
node --test apps/web/scripts/deint-fps-verdict-100b7.test.mjs  # 13/13
```

## 9. File đã đổi/thêm (stage, không push)

- `docs/PHASE9_ROUND101_C7_G1_LIMITS.md` (file này).
- `benchmarks/results/g1-evidence-v11-101c7.json` (mới — pool v11:
  30fps n=82, 60fps n=54; kèm b7_e1/b7_60/c7_e1/c7_60 với G5+M2 từng lần).
- Log + dữ liệu thô: `hidden_files/round101-c7/` (run-c7.sh,
  run-c7-resume.sh, runs.log, runs-resume.log, e1-run1..7 + log,
  60fps-deint-run1..5 + log, analyze-pool101c7.py,
  analyze-m2-quiet101c7.py, pool101c7-analysis.json,
  m2-quiet101c7.json, pool101c7-analysis.log, m2-quiet101c7.log,
  verify-ratios101c7.log).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round101-c7-g1.txt`.
