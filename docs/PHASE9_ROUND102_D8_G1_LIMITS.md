# Đợt 102 D8 — G1: thêm bằng chứng đo cho quyết định metric G5/M2 của user (KHÔNG TỰ ĐÓNG G1)

Ngày: 13/11/2026 (lượt cron 09:35 +07; đo 02:40–03:19Z).
Nợ: LIMITS gộp đợt 101 §4 mục 2 (G1 — user quyết metric G5 hay M2; C7 đợt 101:
khung trượt 20 lần yên mới nhất 19/20 dưới M2, khung cố định tối đa 15/20).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; boot 249407b6 suốt cửa sổ đo — **không reboot trong lúc đo**;
load 1-phút 1,41–25,15; RAM khả dụng 976–4552 MB trong cửa sổ đo).

**Trạng thái cuối: CHỈ THU THẬP BẰNG CHỨNG — KHÔNG sửa production, KHÔNG đổi
ngưỡng (0,75×), KHÔNG đổi metric, KHÔNG tự đóng G1, KHÔNG tự kết luận khung
nào mới là khung đúng. Quyết định cuối thuộc parent/user (§7).**
Đo mới: E1 30fps ×9 + N10 60fps ×5 (14 lần, harness C8 — md5 không đổi cả
cửa sổ đo, xem §3.4). Gộp vào pool v12 (30fps n=91, 60fps n=59).
Không kiểm lại TTS 39. Không thử birefnet. Không đụng ci-security.yml.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

**Câu hỏi của brief: "với mẫu mới, M2 có lần nào đạt 16/20 không?" — Đáp án
vẫn phụ thuộc vào KHUNG nào được tính. D8 trình bày đủ khung cũ + 4 khung
mới (f)–(i), không chọn thay user:**

| Khung chân yên 30fps dưới M2 | Số | Đạt 16/20 (80%)? |
|---|---|---|
| **(a) Khung cố định 20 lần yên ĐẦU** (khung A9 dùng) | tối đa **15/20 = 75%** | **KHÔNG — kết luận A9/C7 đứng vững** |
| **(b) Khung trượt 20 lần yên MỚI NHẤT** (khung C7 đề xuất) | **19/20 = 95%**, tính đủ, **0 mất dữ liệu** | **CÓ — vượt 16/20** |
| **(c) Tích lũy đầy đủ** (toàn bộ chân yên) | **23–24/29 = 79,3–82,8%** | **CẮT NGANG mốc** — phụ thuộc I5-1 (không tính lại được) |
| **(d) Chỉ lần tính-lại-được** (loại 4 lần mất fpsSlots) | **23/25 = 92%** | CÓ — nhưng là số có lệch chọn mẫu (A9 đã cảnh báo) |
| **(e) Yên sạch** (loại lần bị gắn cờ slot-tải-đầu) | **21/23 = 91%** tính-lại-được | CÓ (tập con) — xem §2.2 |
| **(f) MỚI — Trượt 10 lần yên mới nhất** (8/10 ≈ 16/20) | **10/10 = 100%**, tính đủ | **CÓ — vượt 8/10** |
| **(g) MỚI — Chỉ kỷ nguyên hậu-A9** (đợt 99–102: A7/B7/C7/D8) | **11/11 = 100%**, tính đủ | **CÓ — vượt 80%** |
| **(h) MỚI — Nhạy biên phân loại** (ngưỡng yên ≥ 9 thay vì ≥ 10) | **không đổi** — 0 lần biên trong pool 30fps | **KHÔNG KIỂM ĐƯỢC** — biên chưa từng bị đo (xem §4) |
| **(i) MỚI — Biên an toàn khung (b)** (mô phỏng FAIL liên tiếp) | chịu được **3 lần yên FAIL liên tiếp** (16/20); lần thứ 4 rơi xuống 15/20 | — |

- **Khung (a) không đổi dù đo thêm bao nhiêu lần nữa:** 5 lần FAIL đã chốt
  trong 20 lần đầu — tối đa 15/20 là trần cứng (như C7).
- **Khung (b) giữ 19/20 sau khi thêm 2 lần yên mới của D8** (run1 M2 0,90
  PASS, run3 M2 0,88 PASS — cả hai đều PASS nên không đổi tỉ số; cửa sổ
  trượt sang phải 2 bậc: X6-2 → D8-3, chỉ còn 1 FAIL là X6 r6).
  Nhưng khung trượt vẫn là khung C7 ĐỀ XUẤT để user xem xét, KHÔNG phải
  khung đã được duyệt (§7 Q1).
- **Khung (c) — LẦN YÊN TIẾP THEO LÀ QUYẾT ĐỊNH (xem §4):** thêm 1 lần
  yên PASS nữa thì kịch bản xấu nhất (I5-1 FAIL) thành **24/30 = 80,0%
  đúng mốc**; kịch bản tốt nhất thành 25/30 = 83,3%. Ngược lại, 1 lần
  yên FAIL nữa thì kịch bản xấu rơi xuống 23/30 = 76,7% (chỉ kịch bản
  tốt còn giữ đúng 80,0%). Đây là lần đầu tiên khung tích lũy đứng
  cách mốc đúng 1 lần đo — câu hỏi Q5 của C7 nay có đáp án cụ thể.
- **Khung (g) là điểm mới quan trọng nhất của đợt này:** cả 5 lần FAIL
  chặn khung (a) đều thuộc kỷ nguyên TRƯỚC A9 (J3-1/L3-1/L3-2 mất dữ
  liệu + U6 r2 + X6 r6); kỷ nguyên hậu-A9 (đợt 99–102, sau các sửa
  harness lớn) là **11/11 PASS dưới cả hai metric, 0 lần mất dữ liệu**.
  D8 không kết luận "nên bỏ lần cũ" — chỉ ghi rõ: bất đồng giữa các
  khung hoàn toàn nằm ở việc **lần cũ có còn tính hay không**, không
  phải ở số đo mới (§7 Q6).
- **0 lần bất đồng mới:** 14/14 lần D8 đều đồng thuận G5/M2. Đồng thuận
  toàn lịch sử nay **112/118 (94,9%)**, vẫn đúng 6 lần bất đồng cũ
  của A9, 0 lần FAIL→PASS.
- **Quy luật "G5 ≥ 1,00 không bao giờ lật" MỞ RỘNG: nay 58 lần, 0 lần lật**
  (C7: 50 lần). G5 PASS trong [0,75; 1,00): 55 lần, 6 lần lật — cả 6
  đều là 6 ca cũ; tỉ lệ lật trong vùng 6/55 = 11%.
- **Chân yên 30fps dưới G5: n=29, PASS 25/29 (86%)**, median 0,950,
  CI [0,886; 0,983]; chuỗi PASS yên liên tiếp nay là **23**.
- **Chân yên 60fps: 20/20 PASS (100%) dưới CẢ HAI metric**, tính đủ
  hoàn toàn (không mất dữ liệu), median M2 0,975, CI [0,936; 1,004].
- **D8 riêng: 14/14 lần PASS dưới cả hai metric** (E1 9/9, N10 5/5).
  Lần sát ngưỡng nhất: D8 E1 run9 (G5 0,99 → M2 0,81) và D8 N10 run4
  (G5 0,90 → M2 0,97) — đều giữ PASS.

## 2. Bảng quyết định — pool v12 (G5) + chân yên M2

Ngưỡng 0,75× giữ nguyên. Yên: baseline mean ≥ 10 fps (luật X6). Luật (b) =
median 5 lần ≥ 0,75 VÀ ≥4/5 lần ≥ 0,75. CI 95% của mean (t-Student).
Script: `hidden_files/round102-d8/analyze-pool102d8.py` (gộp pool) +
`analyze-m2-quiet102d8.py` (chân yên M2 + khung mới (f)–(i), kế thừa
parser A9/C7). JSON gộp:
`benchmarks/results/g1-evidence-v12-102d8.json` (pool30 n=91, pool60 n=59).

### 2.1 Pool v12 dưới G5 (so với v11/C7)

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Đổi so với v11 |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ | 91 | 1,000 | 0,999 | 0,197 | [0,957; 1,040] | **82/91 (90%)** | +9 điểm n, +9 điểm PASS (73/82 = 89%) |
| 30fps — máy tải (<10, trừ hỗn hợp) | 58 | 1,030 | 1,033 | 0,221 | [0,975; 1,091] | 53/58 (91%) | +5 lần, giữ 91% |
| 30fps — máy yên (≥10, trừ hỗn hợp) | 29 | **0,950** | **0,934** | 0,131 | **[0,886; 0,983]** | **25/29 (86%)** | +2 lần, +1 điểm (23/27 = 85%) |
| 60fps fixture | 59 | 0,960 | 0,972 | 0,145 | [0,934; 1,009] | **56/59 (95%)** | +5 lần, +5 điểm PASS (51/54 = 94%) |
| 60fps — máy tải (<10) | 39 | 0,990 | 0,984 | 0,173 | [0,929; 1,040] | 36/39 (92%) | +2 lần, giữ 92% |
| **60fps — máy yên (≥10)** | **20** | **0,945** | **0,947** | 0,052 | **[0,922; 0,971]** | **20/20 (100%)** | +3 lần, vẫn 100% |
| Cửa sổ 5 lần 30fps mới nhất (D8 r5–r9) | 5 | 1,03 | — | — | — | 5/5 | luật (b) PASS ỔN ĐỊNH |
| Cửa sổ 5 lần 60fps mới nhất (D8 r1–r5) | 5 | 0,96 | — | — | — | 5/5 | luật (b) PASS ỔN ĐỊNH |

### 2.2 Chân yên 30fps dưới M2 — các khung (§1)

| Khung | n | M2 PASS | Median M2 | Mean M2 | CI 95% | Ghi chú |
|---|---|---|---|---|---|---|
| (a) 20 lần yên đầu (cố định) | 20 | tối đa 15/20 (75%) | — | — | — | 5 FAIL đã chốt; trần cứng |
| (b) 20 lần yên mới nhất (trượt) | 20 | **19/20 (95%)** | 0,945 | 0,932 | [0,884; 0,980] | tính đủ, 0 mất dữ liệu; chỉ FAIL X6 r6 |
| (c) Tích lũy đầy đủ | 29 | **23–24/29 (79,3–82,8%)** | 0,950 | 0,929 | [0,879; 0,980] | khoảng do I5-1 chưa biết |
| (d) Chỉ lần tính-lại-được | 25 | **23/25 (92%)** | 0,950 | 0,929 | [0,879; 0,980] | lệch chọn mẫu: loại đúng 3/4 lần xấu nhất |
| (e) Yên sạch (loại run bị gắn cờ slot-tải-đầu) | 27 | 21/23 (91%) tính-lại-được | 0,950 | 0,937 | [0,884; 0,989] | 2 lần bị gắn cờ: A7-7, D8-3 |
| **(f) Trượt 10 lần yên mới nhất** | 10 | **10/10 (100%)** | 0,930 | 0,931 | [0,887; 0,975] | tính đủ; bản sạch (loại cờ) cũng 10/10 |
| **(g) Kỷ nguyên hậu-A9 (A7/B7/C7/D8)** | 11 | **11/11 (100%)** | 0,920 | 0,924 | [0,881; 0,966] | tính đủ; G5 cũng 11/11 |
| **(h) Yên "mở rộng" (ngưỡng ≥ 9)** | 29 | **23–24/29** (y hệt (c)) | — | — | — | 0 lần biên 9–10 fps trong pool 30fps |

### 2.3 Chân yên 60fps dưới M2 (tính đủ hoàn toàn)

| | n | M2 PASS | Median | Mean | CI 95% |
|---|---|---|---|---|---|
| Yên 60fps | 20 | **20/20 (100%)** | 0,975 | 0,970 | [0,936; 1,004] |

Không lần yên 60fps nào mất fpsSlots, không lần nào bị gắn cờ
slot-tải-đầu — đây là chân duy nhất không có khoảng bất định nào.

## 3. Cửa sổ đo mới D8 — chi tiết từng lần

### 3.1 E1 30fps ×9 — 02:40–03:10Z — 9/9 PASS cả hai metric, 0 abort

Lệnh (tuần tự): `E1_SCRATCH=hidden_files/round102-d8/e1-runN
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (harness C8, md5
không đổi cả cửa sổ — xem §3.4). Driver dừng ở 9 lần thử, chỉ đủ 2/3
lần yên mục tiêu: **cửa sổ yên nhấp nháy rồi đóng** (run1 yên → run2
hỗn hợp → run3 yên-cờ → run4 hỗn hợp → run5–9 tải; load 1-phút lên
tới 25,15 do 8–10 luồng đợt 102 chạy song song).

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | Baseline mean | 5–10 tỉ lệ drift-corrected | G5 | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 02:40–02:43 | 1,41 | vòng 1: 18,54 / vòng 2: 18,13 | v1: 0,74 / 0,68 / 0,89 / 1,05 / 0,81; v2: 0,91 / 0,93 / 1,13 / 0,78 / 1,24; **gộp 0,92** | **0,92×** | 0,90 | **PASS (yên, 2 vòng)** |
| 2 | 02:43–02:47 | 2,17 | vòng 1: 10,10 / vòng 2: 6,04 | v1+v2 gộp: 0,63 / 0,93 / 0,49 / 0,81 / 1,15 / 1,45 / 1,18 / 1,55 / 0,94 / 0,85; **gộp 1,00** | **1,00×** | 0,94 | **PASS (HỖN HỢP — chỉ tính pool tổng)** |
| 3 | 02:47–02:49 | 11,41 | 12,03 | 0,75 / 0,88 / 0,86 / 1,35 / 1,15 | **1,00×** | 0,88 | **PASS (yên-slot-tải-đầu, bị gắn cờ)** |
| 4 | 02:49–02:52 | 3,86 | vòng 1: 20,67 / vòng 2: 8,56 | v1+v2 gộp: 0,55 / 1,00 / 0,90 / 0,87 / 0,98 / 0,96 / 0,76 / 0,66 / 1,41 / 0,84; **gộp 0,89** | **0,89×** | 0,89 | **PASS (HỖN HỢP — chỉ tính pool tổng)** |
| 5 | 02:52–02:56 | 6,66 | vòng 1: 3,39 / vòng 2: 3,43 | v1+v2 gộp: 0,67 / 0,97 / 0,93 / 1,14 / 0,68 / 1,50 / 1,07 / 0,66 / 1,49 / 1,22; **gộp 1,03** | **1,03×** | 1,02 | **PASS (tải)** |
| 6 | 02:56–02:59 | 11,74 | 4,88 | 1,79 / 0,60 / 0,89 / 1,02 / 1,28 | **1,12×** | 1,02 | **PASS (tải)** |
| 7 | 02:59–03:03 | 1,58 | 2,83 | 1,30 / 0,77 / 1,21 / 0,91 / 0,95 | **1,03×** | 0,95 | **PASS (tải)** |
| 8 | 03:03–03:06 | 25,15 | 3,48 | 0,82 / 1,24 / 1,55 / 0,74 / 1,56 | **1,18×** | 1,24 | **PASS (tải)** |
| 9 | 03:06–03:10 | 5,71 | vòng 1: 5,94 / vòng 2: 6,21 | v1+v2 gộp: 0,47 / 0,78 / 0,69 / 0,85 / 1,29 / 0,37 / 0,59 / 1,78 / 1,19 / 1,86; **gộp 0,99** | **0,99×** | 0,81 | **PASS (tải)** |

- **Run1 (0,92×) là lần yên 2 vòng thứ ba trong lịch sử G1** (sau A7
  run1 và C7 run1): vòng 1 mean 0,83× rơi vùng xám 0,6–0,9 → quy tắc
  98Z8 đo thêm vòng 2 (1,00×), verdict gộp 10 tỉ lệ 0,92× PASS. Cả 2
  vòng đều yên (18,54 / 18,13 fps) nên tính trọn vào chân yên.
  M2 gộp 10 tỉ lệ 0,90 PASS.
- **Run2 và run4 là lần hỗn hợp thứ ba và thứ tư trong lịch sử G1**
  (sau Z9 run5, C7 run6): vòng 1 yên → vòng 2 tải. D8 là đợt đầu
  tiên có **2 lần hỗn hợp trong một đợt** — dấu hiệu cửa sổ yên
  đợt 102 nhấp nháy mạnh hơn các đợt trước (load song song 8–10
  luồng). Theo tiền lệ Z9/C7: **chỉ tính vào pool tổng, KHÔNG tính
  vào chân yên lẫn chân tải**. Nếu parent tính khác (tính vòng yên
  như 1 mẫu yên) thì chân yên G5 thành 27/31 — D8 không tự đổi cách
  tính, chỉ ghi rõ độ nhạy (xem §7 Q4 của C7, vẫn mở).
- **Run3 (1,00×) bị gắn cờ yên-slot-tải-đầu** (slot 0 chỉ 3,91 fps
  dù baseline mean 12,03): tính vào chân yên theo tiền lệ (như A7
  run7), loại khỏi khung "yên sạch" (e). M2 0,88 PASS.
- **Run9 (M2 0,81×) là lần sát ngưỡng nhất đợt này dưới M2:** 3/10
  tỉ lệ dưới 0,6 (0,47 / 0,37 / 0,59) nhưng median cứu PASS; biên
  0,06. Đừng trích 1,86× đơn lẻ trong lần này.
- **Run6 (G5 1,12×) và run8 (G5 1,18×) là số phồng do tải** (baseline
  4,88 / 3,48 fps, tỉ lệ tới 1,79×) — đừng trích làm tốc độ deint.
- **0 slot đóng băng trong cả 14 lần đo D8** (E1 ×9 + N10 ×5) — như
  X6/Z9/A7/B7/C7; ngay cả lần tải nặng (baseline 2,83–3,48 fps)
  cũng không có slot < 0,5 fps. Bước loại của M2 không bắn lần nào
  đợt này (cả 37 lần B7+C7+D8).
- **Pixel cả 9 lần giống hệt lịch sử:** G2 MAD 0,5821; G7a 0,6903;
  G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt N5→C7).
  **H9 0 lỗi trang cả 9 lần.** Không có dấu EPERM trong log 14 lần đo
  D8 (grep 0 kết quả).
- **Toggle Space: 154 lần toggle, 0 retry, 0 fallback, tất cả lật
  bằng Space.** Play >400ms: **9 slot** (run5: 1; run7: 2; run8: 3;
  run9: 3); pause >400ms: **0**. Chậm nhất: run8 slot 2 play **804ms**
  — xem §3.5.

### 3.2 60fps deint-only ×5 (probe N10) — 03:10–03:19Z — 5/5 PASS cả hai metric

Lệnh (tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round102-d8/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 03:10–03:12 | 15,60 | 3,97 fps | 1,32 / 0,48 / 1,46 / 0,97 / 1,44 | **1,13×** | 1,32 | PASS, 4/4 (tải) |
| 2 | 03:12–03:14 | 18,16 | 3,49 fps | 0,85 / 1,09 / 0,65 / 1,45 / 1,31 | **1,07×** | 1,09 | PASS, 4/4 (tải) |
| 3 | 03:14–03:16 | 7,72 | 12,10 fps | 1,00 / 0,93 / 0,80 / 1,08 / 0,97 | **0,96×** | 0,97 | PASS, 4/4 (yên) |
| 4 | 03:16–03:18 | 1,88 | 15,03 fps | 1,03 / 1,07 / 0,48 / 0,97 / 0,96 | **0,90×** | 0,97 | PASS, 4/4 (yên) |
| 5 | 03:18–03:19 | 1,94 | 12,29 fps | 0,99 / 1,42 / 0,60 / 1,38 / 0,40 | **0,96×** | 0,99 | PASS, 4/4 (yên) |

- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 5/5 lần và giống hệt
  M1/N10/R6/S6/T6/U6/V5/W6/X6/Z9/A7/B7/C7 — deint áp thật trên fixture
  60fps, đường code không đổi.
- **C3 0 lỗi trang cả 5 lần.** Không có dấu EPERM trong log 5 lần đo.
- **Run5 (M2 0,99×) có tỉ lệ thấp nhất đợt 60fps: 0,40×** nhưng median
  cứu PASS — đúng kiểu M2 sinh ra để xử lý.
- **Run1 (G5 1,13×, M2 1,32×) là số phồng do tải** (baseline 3,97 fps)
  — đừng trích làm tốc độ deint.
- Cửa sổ yên 60fps mở muộn (run3–5, sau khi load hạ từ 18,16 xuống
  1,88): 3/5 lần yên, ngược với E1 (yên chỉ đầu lượt).

### 3.3 So sánh cửa sổ yên các đợt gần đây (điều kiện đo)

| Đợt | E1 yên (mục tiêu 3) | E1 hỗn hợp | Load 1-phút cao nhất trong cửa sổ E1 |
|---|---|---|---|
| B7 (100) | 3 (run7–9, cuối lượt) | 0 | ~8 |
| C7 (101) | 3 (run1–3, đầu lượt) | 1 (run6) | 13,06 |
| **D8 (102)** | **2 (run1 + run3-cờ), hết 9 lần thử** | **2 (run2, run4)** | **25,15** |

Cửa sổ yên đợt 102 ngắn và nhấp nháy nhất trong 3 đợt gần đây — trùng
với lúc 8–10 luồng đợt 102 cùng chạy. Hệ quả cho đợt sau: đừng kỳ vọng
3 lần yên/đợt khi load song song cao; 2 lần yên + 2 lần hỗn hợp vẫn đủ
để cập nhật mọi khung (xem §4), nhưng nếu user muốn thêm mẫu yên nhanh
thì cần đo vào lúc ít luồng song song hơn, hoặc chấp nhận nhiều lần thử
hơn (driver đã thử hết 9 lần).

### 3.4 Harness không đổi trong cửa sổ đo

- `clicktest-77e1-deint-fps.mjs` md5 **d18e0465** (bản C8), `deint-fps-
  verdict.mjs` **57a4f6d8**, `probe-86n10-config-fps.mjs` **3bc93119**
  (bản C8) — **không đổi trước/sau MỖI lần E1** (ghi trong runs.log)
  và không đổi cả cửa sổ N10. Đây là đợt đầu tiên kể từ A7 không có
  sibling nào sửa harness giữa lúc đo.
- **Không reboot trong cửa sổ đo** (boot-id 249407b6 đầu và cuối lượt;
  uptime 1:08 lúc kết thúc — boot ~02:12Z, trước khi lượt bắt đầu).
  Ghi cho luồng EPERM: không có khoảng mù mới nào mở trong cửa sổ D8.
- Không process mồ côi của D8 sau đo (0 vite/chrome nào dùng scratch
  round102-d8 còn chạy).

### 3.5 Toggle Space — lần đầu tiên play vượt 800ms

E1 run8 slot 2: playWaitMs = **804ms**, pauseWaitMs = 80ms; cùng lần
còn slot 5 play 416ms và slot 9 play 614ms. Tổng đợt D8: **9 slot
play >400ms** (run5: 407ms; run7: 406/413ms; run8: 804/416/614ms;
run9: 510/463/480ms), **0 slot pause >400ms** (chậm nhất 269ms),
**0 retry, 0 fallback** trong 154 toggle.

Đọc đúng con số theo đính chính của C7 §3.5: code cũ chờ 800ms cố
định ở chiều PHÁT (không throw) và chỉ throw ở chiều dừng sau 400ms.
804ms **vượt mốc 800ms đó 4ms** — đây là lần đầu tiên trong lịch sử
G1 một lần đo vượt mốc chờ cố định chiều phát của code cũ. Dưới code
cũ, slot này có nguy cơ lấy mẫu khi chưa playing=true (mẫu sai);
đường chờ-trạng-thái của B7 đã xử lý được (chờ tới khi playing=true
rồi mới lấy mẫu, 10/10 pass, không retry/fallback). **Kết luận trung
thực: đường retry/fallback của B7 VẪN CHƯA bắn thật trong D8**
(154 toggle, 0 retry, 0 fallback; pause chậm nhất 269ms < 400ms).
804ms là lần toggle chậm nhất quan sát được trong toàn lịch sử G1 —
ghi nhận là mốc mới, và là bằng chứng đầu tiên cho thấy mốc 800ms
của code cũ đã từng bị vượt. Caveat B7 §7 mục 1 vẫn đứng nguyên.
Chuyển cho luồng harness (O8): play >400ms nay xuất hiện 9 slot/đợt
(vs 1 slot ở C7) — có thể do load song song cao (25,15 lúc run8).

## 4. Quy luật G5 ≥ 1,00, khung mới (f)–(i), và lần yên tiếp theo

| G5 của lần PASS | A9 (n=69) | C7 (n=104) | Nay (n=118, R6→D8) |
|---|---|---|---|
| G5 ≥ 1,00 | 36 lần, **0 lật** | 50 lần, 0 lật | **58 lần, 0 lật** |
| 0,90 ≤ G5 < 1,00 | 19 lần, 2 lật | 33 lần, 2 lật | 37 lần, 2 lật |
| 0,75 ≤ G5 < 0,90 | 10 lần, 4 lật | 16 lần, 4 lật | 18 lần, 4 lật |
| G5 PASS trong [0,75; 1,00) | 29 lần, 6 lật | 49 lần, 6 lật | **55 lần, 6 lật** |

- Quy luật A9 §5.2 đứng vững với mẫu lớn hơn: **không một lần G5 PASS
  nào có G5 ≥ 1,00 lật dưới M2 (0/58)**. 8 lần mới trong vùng này
  (D8: run2, run3, run5, run6, run7, run8 + N10 run1, run2) — tất cả
  giữ PASS.
- Tỉ lệ lật trong vùng [0,75; 1,00) giảm từ 6/49 (12%) xuống 6/55 (11%)
  — M2 "bắt PASS giả" ít dần khi mẫu mới toàn PASS, nhưng 6 ca cũ
  không biến mất.
- Lần sát ngưỡng nhất đợt này dưới M2: D8 E1 run9 (0,81×) — G5 PASS
  trong [0,75; 1,00) và giữ PASS dưới M2 với biên 0,06. Nếu đo lại
  lần này, khả năng lật là có thật (không tính được xác suất từ 1 lần
  đo).

### Khung (f) — trượt 10 lần yên mới nhất: 10/10 PASS dưới M2

Thành phần: A7-7, A7-8, B7-7, B7-8, B7-9, C7-1, C7-2, C7-3, D8-1,
D8-3. Median M2 0,930, CI [0,887; 0,975]. Bản "sạch" (loại A7-7 và
D8-3 bị gắn cờ) cũng 10/10 PASS (Z9-4, A7-1, A7-8, B7-7/8/9,
C7-1/2/3, D8-1). Khung ngắn hơn (10 thay vì 20) nhưng vẫn đạt mốc
tương đương 80% — và không chứa lần FAIL nào trong 10 lần gần nhất.
Hạn chế: cửa sổ 10 lần nhạy hơn với 1–2 lần FAIL tương lai (2 lần
FAIL liên tiếp đã rơi xuống 8/10 đúng mốc; 3 lần FAIL là 7/10 dưới
mốc) — D8 không trình bày khung này như khung chính thức, chỉ như
bằng chứng bổ sung.

### Khung (g) — kỷ nguyên hậu-A9: 11/11 PASS dưới M2

Thành phần: A7-1, A7-7, A7-8, B7-7, B7-8, B7-9, C7-1, C7-2, C7-3,
D8-1, D8-3. Median M2 0,920, CI [0,881; 0,966]; dưới G5 cũng 11/11.
0 lần mất dữ liệu trong kỷ nguyên này. Ý nghĩa (chỉ phân tích, không
kết luận): toàn bộ 5 lần FAIL chặn khung (a) đều trước A9 — 3 lần mất
fpsSlots (I5-1/J3-1/L3-1/L3-2, đợt ≤93) + U6 r2 (đợt 94) + X6 r6
(đợt 96). Nếu user coi các lần trước A9 là "lỗi thời" thì mọi khung
đều đạt; nếu user giữ toàn bộ lịch sử thì khung (a) vẫn chặn. Đây là
quyết định về **tuổi thọ của bằng chứng**, không phải về số đo (§7 Q6).

### Khung (h) — nhạy biên phân loại: KHÔNG KIỂM ĐƯỢC với pool 30fps

**0 lần** trong toàn bộ pool 30fps (n=91) có baseline trong [9, 10)
fps — khung "mở rộng" (ngưỡng ≥ 9) cho đúng số cũ 23–24/29. Biên
phân loại yên/tải ở 10 fps **chưa từng bị đo** với fixture 30fps.
Với 60fps: chỉ có đúng 1 lần biên trong lịch sử — C7 N10 run1
(baseline 9,71 fps, G5 0,99, M2 1,07 PASS, hiện phân loại tải). Nếu
đổi ngưỡng sang ≥ 9 thì chân yên 60fps thành 21/21 (vẫn 100%) — kết
luận không đổi. Ghi nhận: muốn kiểm biên thật thì đợt sau cần cố
tình đo vào lúc baseline lanh quanh 9–10 fps (khó chủ động — phụ
thuộc load máy lúc đo).

### Khung (i) — biên an toàn của khung trượt-20

Mô phỏng k lần yên FAIL liên tiếp (cửa sổ trượt, lần cũ nhất bị đẩy
ra; X6 r6 là FAIL duy nhất trong cửa sổ nên 4 FAIL đầu đẩy cả FAIL
cũ ra): +1 → 18/20, +2 → 17/20, +3 → **16/20 (vẫn đạt)**, +4 →
**15/20 (rơi dưới mốc)**, +5 → 15/20, +6 → 14/20. Khung (b) có đệm
3 lần FAIL liên tiếp — không mong manh (1 lần FAIL không đổi kết
luận), nhưng cũng không dày: 4 lần FAIL liên tiếp là đủ lật.

### Lần yên tiếp theo là quyết định cho khung tích lũy (c)

Tích lũy hiện 23–24/29. **+1 lần yên PASS → kịch bản xấu 24/30 =
80,0% đúng mốc; kịch bản tốt 25/30 = 83,3%. +1 lần yên FAIL →
kịch bản xấu 23/30 = 76,7%; kịch bản tốt 24/30 = 80,0% đúng mốc.**
Lần yên tới (đợt 103) sẽ thu hẹp khoảng này về một phía: PASS thì
cả hai kịch bản đều ≥ 80%; FAIL thì chỉ kịch bản tốt còn giữ mốc.
D8 không tự đo thêm lần yên nữa trong đợt này (driver đã thử hết 9
lần) — để lại cho đợt sau, đúng như Q5 của C7 đề xuất.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ đo + phân tích |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** chạy lại xanh |
| `node --test deint-fps-verdict-100b7.test.mjs` | **13/13** chạy lại xanh |
| `node --check` 3 script đã dùng | **PASS** cả ba |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS/JS nào (chỉ thêm LIMITS + JSON số đo + file trong hidden_files), cùng tiền lệ A7/A9/C7 |
| Tái tạo v11 (`analyze-pool102d8.py`) | **KHOP đúng** số C7 đã công bố trước khi thêm lần mới (pool 30 n=82 PASS 73/82; pool 60 n=54 PASS 51/54) |
| G5/M2 tính lại từ `fpsSlots`/`g5Rounds` | **KHOP** report cả 14 lần D8 (G5 khớp combinedMean/rMean/ratioMean ±0,01; M2 = median sau loại mẫu số < 0,5 fps — 0 lần có tỉ lệ bị loại; lần 2 vòng = median 10 tỉ lệ theo định nghĩa A9 §9.4) |
| M2 tính lại độc lập (`analyze-m2-quiet102d8.py`) | tái tạo đúng 6 lần lật của A9 + 81 lần R6→A7 trước khi thêm B7/C7/D8; đồng thuận 112/118 |
| Cửa sổ D8 E1 30fps ×9 headed | **9/9 hoàn thành, 10/10 mỗi lần, 0 abort, 0 `HARNESS LỖI`** — G5: 0,92 / 1,00 / 1,00 / 0,89 / 1,03 / 1,12 / 1,03 / 1,18 / 0,99; yên 2 (1 bị gắn cờ) / tải 5 / hỗn hợp 2 |
| Cửa sổ D8 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 4/4 mỗi lần, 5/5 PASS G5** (1,13 / 1,07 / 0,96 / 0,90 / 0,96), M2 5/5 PASS |
| Headed H9/C3 (mọi lần chạy D8) | **0 lỗi trang** (E1 10/10 ×9, 60fps 4/4 ×5) |
| Pixel D1 60fps (D8) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1→C7 — tap áp thật |
| Pixel G2/G7a/G7b/G8 E1 (cả 9 lần) | giống hệt N5→C7 (G2 MAD 0,5821 ×9; G7a MAD 0,6903; G7b MAD 0,0119; G8 R 0,55 → 0,52, MAD 1,5522) |
| Harness md5 trước/sau mỗi lần E1 | **không đổi trong từng lần và cả cửa sổ** (d18e0465 / 57a4f6d8 / 3bc93119) — đợt đầu tiên không có sibling sửa harness giữa lúc đo kể từ A7 |
| Không process mồ côi của D8 sau đo | 0 vite/chrome nào dùng scratch round102-d8 còn chạy; boot-id 249407b6 đầu = cuối, không reboot trong cửa sổ |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 VẪN MỞ — D8 không tự đóng, không đổi metric, không chọn khung.**
   Mọi câu hỏi ở §7 cần parent/user quyết. Đáp án "M2 có đạt 16/20
   không" đổi theo khung (§1) — đừng trích một khung mà không ghi tên
   khung đó.
2. **Khung (b) trượt 20 lần mới nhất và khung (f)/(g) mới là khung D8
   trình bày để xem xét, KHÔNG phải khung đã duyệt.** Khung gốc của
   G1 là tích lũy (14/18 → 16/20), khung A9 phân tích là cố định 20
   lần đầu. Đừng trình bày 19/20, 10/10 hay 11/11 như thể đó là khung
   chính thức.
3. **Khoảng 23–24/29 là vĩnh viễn:** M2 của I5-1 không bao giờ tính lại
   được (mất fpsSlots). Mọi kết luận về chân yên tích lũy dưới M2 đều
   phải mang khoảng này, không được chọn một đầu rồi trích như số chắc.
   Lần yên tiếp theo chỉ thu hẹp tương đối, không xóa được khoảng.
4. **Số "23/25 = 92% dưới M2" là số tập con có lệch chọn mẫu** (A9 §11
   mục 4): 4 lần mất dữ liệu là 3/4 FAIL. Số trung thực là khoảng
   23–24/29 (79,3–82,8%).
5. **Khung (a) 15/20 là trần cứng, không phải do thiếu mẫu:** 5 FAIL đã
   chốt trong 20 lần đầu. Đo thêm 100 lần yên nữa cũng không đổi khung
   này — chỉ đổi khung mới (trượt/tích lũy/hậu-A9) mới thay đổi đáp án.
6. **Khung (h) không kiểm được:** 0 lần biên 9–10 fps trong pool
   30fps. Đừng trích "đổi ngưỡng không đổi kết luận" như một kiểm
   chứng — đó là hệ quả của việc không có dữ liệu biên, không phải
   của độ ổn định.
7. **Median của 5 tỉ lệ là thống kê nhiễu:** M2 SD tăng ở N10 trong
   phân tích A9. Lần sát ngưỡng đợt này (M2 0,81× ở E1 run9) có thể
   lật nếu đo lại — đừng dùng M2 của 1 lần để kết luận; luôn dùng
   median-of-runs + CI + tỉ lệ PASS.
8. **Phân loại yên/tải theo baseline mean nhiễm nhiễu spike** (tiền lệ
   X6 run6; D8 run2 vòng 1 baseline 10,10 fps chỉ hơn ngưỡng 0,10).
   Các bảng dùng cùng định nghĩa này để so sánh được với lịch sử —
   đừng đọc "yên" như "mọi slot đều yên". Đợt này có 2 lần hỗn hợp —
   cao nhất từ trước tới nay trong một đợt.
9. **Lần hỗn hợp D8 run2/run4 tính là 1 lần trong pool tổng** (G5 gộp
   1,00 / 0,89; M2 gộp 0,94 / 0,89 từ 10 tỉ lệ), theo phân loại của
   Z9 run5 / C7 run6. Nếu parent tính khác (tính vòng yên như 1 mẫu
   yên) thì chân yên G5 thành 27/31 — kết luận không đổi, nhưng số
   phải ghi theo cách tính đã chọn.
10. **Cửa sổ yên đợt 102 nhấp nháy do load song song cao** (tải 1-phút
    tới 25,15; chỉ 2/9 lần E1 yên dù driver thử hết 9 lần). Số đo chỉ
    đúng trên VM này (CPU-only, 4 vCPU, Chrome `--disable-gpu`, Xvfb)
    trong giờ vòng lặp 8–10 luồng song song. Không suy ra máy khác /
    máy có GPU / Safari thật.
11. **Đường retry/fallback của B7 vẫn chưa bắn thật** (§3.5): 154
    toggle D8, 0 retry, 0 fallback; caveat B7 §7 mục 1 vẫn đứng nguyên.
    804ms play ở run8 slot 2 là lần đầu vượt mốc 800ms của code cũ —
    ghi nhận là mốc, không phải bằng chứng cứu abort (đường chờ-trạng-
    thái xử lý được, không cần retry).
12. **D8 chỉ đủ 2/3 lần yên mục tiêu** (run1 + run3 bị gắn cờ) dù đã
    thử 9 lần. Khung tích lũy vẫn cắt ngang mốc; lần yên quyết định
    (§4) để lại cho đợt 103.
13. G1 (deint) vẫn mở, chờ user quyết (§7) — birefnet 0 lần thành công
    (chỉ thử lại khi RAM đổi); EPERM probe #21 + khoảng mù #20 (sau
    reboot #25 23:51:32Z 12/11 — D8 không mở khoảng mù mới); ci-security.yml
    vẫn 403 chờ user; TTS 39 CẤM kiểm lại; WebKit clip D, pre-pass
    keyframes, motion blur + mask, trackgeq, fallback, harness O8.

## 7. Câu hỏi cho user — D8 chỉ hỏi, không tự trả lời

**Q1 — Khung 16/20 tính theo khung nào? (lặp lại từ C7, nay có thêm
khung mới)**
(a) Cố định 20 lần yên đầu: M2 tối đa 15/20 — KHÔNG BAO GIỜ đạt, dù đo
thêm bao nhiêu lần. (b) Trượt 20 lần yên mới nhất: M2 đang 19/20 — ĐÃ
ĐẠT, đệm 3 lần FAIL liên tiếp. (c) Tích lũy đầy đủ: M2 đang 23–24/29 —
cắt ngang 80%, phụ thuộc I5-1 không tính lại được, và **lần yên tiếp
theo sẽ quyết định kịch bản xấu** (PASS → 24/30 = 80,0% đúng mốc).
(f) Trượt 10 lần mới nhất: 10/10 — ĐÃ ĐẠT mốc tương đương. (g) Kỷ
nguyên hậu-A9: 11/11 — ĐÃ ĐẠT. D8 không chọn thay user: nếu user giữ
khung (a) thì đáp án là "M2 không đạt, giữ G5"; nếu user chấp nhận
(b), (c) (sau 1 lần yên PASS nữa), (f) hoặc (g) thì đáp án đổi. **Đây
là quyết định về luật chơi, không phải về số đo.**

**Q2 — 4 lần yên cũ mất fpsSlots xử lý thế nào? (lặp lại từ C7)**
Giữ nguyên khoảng 23–24/29 (trung thực nhất, nhưng không bao giờ cho
một số duy nhất); loại khỏi mẫu và trích 23/25 = 92% (đẹp nhưng lệch
chọn mẫu — A9 đã cảnh báo); hay ghi I5-1 là "không xác định" và hoãn
quyết định tích lũy cho đến khi có thêm 1 lần yên mới (lúc đó khoảng
sẽ thu hẹp tương đối — và lần yên tới là quyết định, xem §4)?

**Q3 — Chọn G5 hay M2 làm chuẩn, và khi nào? (lặp lại từ C7)**
Theo khuyến nghị A9: giữ G5 đến khi khung 16/20 khép rồi chuyển M2.
Nhưng khung (a) dưới M2 không bao giờ khép — nên "khép" ở đây phải
hiểu theo khung nào (Q1)? Nếu user chọn M2 ngay: có chấp nhận định
nghĩa lại khung (khung mới trên lần có fpsSlots + 6 điều kiện A9 §9)
không? Ngưỡng giữ nguyên 0,75× trong mọi phương án (A9 §5.3).

**Q4 — Lần hỗn hợp D8 run2/run4 (và Z9 run5, C7 run6) có giữ cách tính
"chỉ pool tổng" không? (lặp lại từ C7, nay có 2 lần/đợt)**
D8 giữ tiền lệ Z9. Nếu user muốn tính vòng yên của run2/run4 như mẫu
yên thì chân yên G5 thành 27/31 (87,1%), chân yên M2 tính-lại-được
thành 25/27 (92,6%) — kết luận không đổi, nhưng số khung đổi. Cần
user xác nhận cách tính trước khi đợt sau trích số. Lưu ý: số lần hỗn
hợp đang tăng theo load song song (0 → 1 → 2 lần/đợt) nên câu hỏi này
sẽ còn lặp lại.

**Q5 — Có nên đo thêm 1 lần yên nữa trước khi quyết? (nay có đáp án
cụ thể — xem §4)**
1 lần yên PASS nữa là đủ cho khung tích lũy trong kịch bản xấu nhất
(24/30 = 80,0% đúng mốc). Cửa sổ yên mỗi lượt chỉ mở ~5–9 phút đầu
lượt và nhấp nháy khi load cao (D8: 2/9 lần thử thành yên) nên đợt
sau nên đo E1 ngay đầu lượt như công thức A7/B7/C7/D8, và có thể cần
nhiều lần thử hơn 9. Nếu user muốn thêm mẫu trước khi quyết thì đợt
103 nên ưu tiên E1 đầu lượt.

**Q6 (MỚI) — Các lần đo trước A9 có còn tính không?**
Khung (g) cho thấy kỷ nguyên hậu-A9 là 11/11 PASS dưới M2, trong khi
toàn bộ lần FAIL chặn khung (a) đều trước A9. User có muốn đặt "tuổi
thọ" cho bằng chứng (vd chỉ tính các lần từ đợt 99 trở đi), hay giữ
toàn bộ lịch sử? Nếu đặt tuổi thọ thì khung (a) cố định cũng đổi
thành phần — cần user định nghĩa lại khung cố định trên kỷ nguyên mới
(vd 20 lần yên đầu KỂ TỪ A7) thay vì D8 tự định nghĩa.

## 8. Cách chạy lại

```bash
# 1 lan E1 30fps bang harness C8 (doi E1_SCRATCH moi lan; DO E1 TRUOC,
# ngay dau luot de bat cua so yen; dot 102 cua so yen nhap nhay — co the
# can toi 9 lan thu moi du 2-3 lan yen):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d8/e1-runX \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# 1 lan N10 60fps (probe C8: ca hai chieu cho-trang-thai):
N10_LABEL=60fps-deint-runX N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d8/60fps-deint-runX \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Gop pool v12 + chan yen M2 + khung moi (f)-(i) (doc report JSON da co, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d8/analyze-pool102d8.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d8/analyze-m2-quiet102d8.py
# Test hoi quy luat median + M2 + luat phan loai slot-tai-dau (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs   # 17/17
node --test apps/web/scripts/deint-fps-verdict-100b7.test.mjs  # 13/13
```

## 9. File đã đổi/thêm (stage, không push)

- `docs/PHASE9_ROUND102_D8_G1_LIMITS.md` (file này).
- `benchmarks/results/g1-evidence-v12-102d8.json` (mới — pool v12:
  30fps n=91, 60fps n=59; kèm d8_e1/d8_60 với G5+M2 từng lần).
- Log + dữ liệu thô: `hidden_files/round102-d8/` (run-d8.sh,
  runs.log, e1-run1..9 + log, 60fps-deint-run1..5 + log,
  analyze-pool102d8.py, analyze-m2-quiet102d8.py,
  pool102d8-analysis.json, m2-quiet102d8.json,
  pool102d8-analysis.log, m2-quiet102d8.log).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round102-d8-g1.txt`.
