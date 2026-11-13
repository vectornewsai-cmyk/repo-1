# Đợt 99 A9 — G1: quyết định metric G5 hay M2? (PHÂN TÍCH, KHÔNG TỰ ĐÓNG G1)

Ngày: 13/11/2026 (lượt cron 00:35 +07; phân tích offline 00:39–00:49 +07).
Nợ: docs/PHASE9_ROUND98_Z9_G1_EVIDENCE9_LIMITS.md §8 mục 3 + docs/PHASE9_ROUND98_LIMITS.md §4 mục 8
("Parent quyết metric: G5 hay M2 làm chuẩn?").
Trạng thái G1 trước phân tích: pool 30fps n=59 PASS 50/59 (85%), chân yên 30fps n=18 PASS 14/18
(78%), còn thiếu 2 lần PASS yên liên tiếp (16/20); pool 60fps n=42 PASS 40/42 (95%);
G5 là metric chính thức, M2 chạy song song.

**Trạng thái cuối: CHỈ PHÂN TÍCH + KHUYẾN NGHỊ — KHÔNG sửa production, KHÔNG đổi ngưỡng,
KHÔNG đổi metric, KHÔNG tự đóng G1. Quyết định cuối thuộc parent/user.**
Không đo mới (không Chromium — RAM khả dụng chỉ ~548–688 MB lúc phân tích); mọi số dưới đây
tính lại từ dữ liệu đã có trên đĩa bằng
`hidden_files/round99-a9/analyze-g5-vs-m2.py` (xem §10). Không kiểm lại TTS 39. Không thử birefnet.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **Đồng thuận cao nhưng bất đồng có hệ thống: trên 69 lần còn fpsSlots (R6→Z9), G5 và M2
  đồng thuận 63/69 (91,3%); 6 lần bất đồng, CẢ 6 đều là G5 PASS → M2 FAIL, 0 lần ngược lại.**
  M2 chặt hơn G5 đúng như thiết kế — nhưng chỉ chặt ở đúng một hướng, và chỉ ở vùng G5 thấp.
- **Bất đồng là hiện tượng của máy tải, không phải của máy yên:** 5/6 ca bất đồng chạy dưới tải
  (baseline <10 fps); chân yên đồng thuận 24/25 (96%), máy tải chỉ 39/44 (88,6%).
  |G5−M2| trung bình: yên 0,058 — tải 0,112 (gấp ~2 lần).
- **Quy luật biên G5 (mạnh nhất trong phân tích này): trong 69 lần, G5 PASS nào có G5 ≥ 1,00
  thì KHÔNG BAO GIỜ lật dưới M2 (0/36); G5 PASS trong [0,75; 0,90) lật 4/10; trong
  [0,90; 1,00) lật 2/19.** Vùng tranh chấp là G5 ∈ [0,75; 1,00) — đúng vùng các lần đo
  mới nhất hay rơi vào (Z9 N10 run5: G5 0,84).
- **Bước làm M2 chặt hơn là MEDIAN, không phải bước loại mẫu số đóng băng:** chỉ 4/69 lần có
  tỉ lệ bị loại; M2 so với median-không-loại (M2c) khác verdict 0/58 lần; mean-chỉ-loại
  (M2mean) so với G5 khác verdict 0/58 lần. Toàn bộ 6 lần lật đều do median, không lần nào
  do loại. Đính chính số X6: M2mean E1 là **22/26 (85%), không phải 21/26 (81%)** như
  X6 §3.3 ghi — tính lại từ ratios cho 4 FAIL (S6 r1 0,73; U6 r2 0,67; W6 r6 0,74;
  W6 r7 0,69), khớp đúng G5 22/26 (xem §6).
- **Chân yên 30fps dưới M2 — con số đẹp trên bề mặt, xấu khi tính đủ:** tập con tính lại
  được cho 12/14 (86%) — nhưng 4 lần yên cũ (I5-1, J3-1, L3-1/2) mất fpsSlots, trong đó
  3/4 đã FAIL dưới G5 (0,68 / 0,65 / 0,68; chỉ I5-1 0,93 PASS). Tính cả 4 lần này, chân
  yên dưới M2 chỉ còn trong khoảng **12–13/18 (67–72%) — dưới 80% trong mọi trường hợp**,
  và khung 16/20 trở nên **KHÔNG ĐẠT ĐƯỢC** dù 2 lần yên tới đều PASS (tối đa 15/20 = 75%).
  Đừng trích "yên 12/14 = 86% dưới M2" mà không ghi 4 lần mất dữ liệu (xem §7).
- **KHUYẾN NGHỊ CHÍNH (§9): GIỮ G5 cho đến khi khung 16/20 khép lại** (chỉ còn thiếu 2 lần
  PASS yên liên tiếp), rồi chuyển sang M2 làm metric chính cho mọi quyết định G1 tiếp theo.
  Nếu parent muốn đổi sang M2 NGAY thì phải định nghĩa lại khung (12/14 hiện tại, cần 4 PASS
  trong 6 lần yên tiếp theo để đạt 16/20) và xử lý 4 lần mất fpsSlots bằng cờ rõ ràng —
  không được lặng lẽ loại chúng khỏi mẫu. **Ngưỡng giữ nguyên 0,75× trong cả hai phương án**
  (đổi ngưỡng không giảm bất đồng: 0,70 → 4 ca, 0,75 → 6 ca, 0,80 → 6 ca; và 0,70 tạo ra
  ca FAIL→PASS duy nhất, phá tính một chiều của M2).

## 2. Định nghĩa — G5 vs M2 (nguồn: `apps/web/scripts/deint-fps-verdict-83k3.mjs`)

Ngưỡng verdict cả hai metric: **0,75×**. Mỗi lần đo cho 5 tỉ lệ drift-corrected
(tỉ lệ slot deint / trung bình 2 slot baseline kề).

| | G5 (chuẩn chính thức) | M2 (frozen-safe, song song từ X6) |
|---|---|---|
| Công thức | **mean** 5 tỉ lệ | **loại** tỉ lệ có mẫu số kề < 0,5 fps (slot đóng băng), rồi lấy **median** các tỉ lệ còn lại; cần ≥3 tỉ lệ hợp lệ |
| Slot deint đóng băng (tử số 0) | giữ (làm mean sụt) | **giữ** — deint kẹt thật là tín hiệu (S6 e1-run1: tỉ lệ 0,0 giữ trong M2, median 0,57) |
| Ước lượng cái gì | trung bình 5 slot — bị kéo lên bởi slot may mắn | slot **điển hình** — kháng 2 outlier trong 5 |
| Cài đặt | harness E1 / probe N10 từ đầu (G1) | `g5FrozenSafeFromReport()` (X6) + 5 test hồi quy; test suite 17/17 xanh (chạy lại §10) |
| Lịch sử tính lại được | toàn bộ pool: 30fps n=59, 60fps n=42 | **chỉ 69 lần còn fpsSlots (R6→Z9)**; 32 lần cũ mất dữ liệu (I5–Q7/M1-đầu: 27 lần 30fps + 5 lần 60fps) |

Câu hỏi G1 là "deint có làm chậm playback không" — estimand đúng là **slot điển hình**
(median), không phải trung bình có trọng số bởi slot may mắn (mean). Đó là lý do khái niệm
của M2 đúng; phần còn lại của phân tích này là kiểm tra bằng số xem M2 có hành xử như
thiết kế không, và cái giá phải trả khi đổi metric giữa chừng là gì.

## 3. Bảng so sánh — toàn bộ pool tính lại được (R6→Z9, n=69)

Tập con này KHÔNG phải pool đầy đủ (thiếu 32 lần cũ). Số pool đầy đủ dưới G5 lấy từ Z9
(30fps 50/59; 60fps 40/42) để đối chiếu. CI 95% của mean (t-Student). Script:
`hidden_files/round99-a9/analyze-g5-vs-m2.py`; M2 tính lại từ ratios khớp 69/69 lần
đã công bố (xem §10).

### 3.1 Đồng thuận / bất đồng

| Tập | n | Đồng thuận | Bất đồng (G5 PASS → M2 FAIL) | Bất đồng ngược |
|---|---|---|---|---|
| Toàn bộ (R6→Z9) | 69 | **63/69 (91,3%)** | **6** | **0** |
| E1 30fps | 32 | 30/32 (93,8%) | 2 (W6 r5; X6 r6) | 0 |
| N10 60fps | 37 | 33/37 (89,2%) | 4 (R6 r2; U6 r5; W6 r5; Z9 r5) | 0 |
| Máy yên (baseline ≥10) | 25 | **24/25 (96,0%)** | 1 (X6 e1-r6) | 0 |
| Máy tải (baseline <10) | 44 | 39/44 (88,6%) | 5 | 0 |

### 3.2 Pool trên tập con — G5 vs M2

| Pool (tập con R6→Z9) | Metric | n | Median | Mean | SD | CI 95% mean | PASS |
|---|---|---|---|---|---|---|---|
| E1 30fps | G5 | 32 | 1,015 | 1,031 | 0,230 | [0,948; 1,114] | 28/32 (88%) |
| E1 30fps | **M2** | 32 | 0,985 | 0,951 | 0,183 | [0,885; 1,017] | **26/32 (81%)** |
| N10 60fps | G5 | 37 | 0,990 | 1,010 | 0,147 | [0,961; 1,059] | 37/37 (100%) |
| N10 60fps | **M2** | 37 | 0,980 | 0,975 | 0,174 | [0,917; 1,033] | **33/37 (89%)** |
| Gộp 69 lần | G5 | 69 | — | — | — | — | 65/69 (94%) |
| Gộp 69 lần | **M2** | 69 | — | — | — | — | **59/69 (86%)** |
| Yên 30fps (tính lại được) | G5 | 14 | 0,980 | 0,964 | 0,121 | [0,894; 1,034] | 13/14 (93%) |
| Yên 30fps (tính lại được) | **M2** | 14 | 0,970 | 0,934 | 0,155 | [0,844; 1,023] | **12/14 (86%)** |
| Yên 60fps | G5 | 10 | 0,965 | 0,965 | 0,055 | [0,926; 1,004] | 10/10 (100%) |
| Yên 60fps | **M2** | 10 | 0,980 | 0,982 | 0,082 | [0,923; 1,041] | **10/10 (100%)** |
| Tải 30fps | G5 | 17 | 1,050 | 1,083 | 0,290 | [0,942; 1,223] | 14/17 (82%) |
| Tải 30fps | **M2** | 17 | 1,000 | 0,960 | 0,211 | [0,858; 1,062] | **13/17 (76%)** |
| Tải 60fps | G5 | 27 | 1,060 | 1,027 | 0,167 | [0,963; 1,091] | 27/27 (100%) |
| Tải 60fps | **M2** | 27 | 0,970 | 0,972 | 0,199 | [0,896; 1,049] | **23/27 (85%)** |

Đọc bảng đúng:

- Đổi sang M2 không lật bất kỳ verdict pool nào trên tập con: cả ba tiêu chí chặt
  (median ≥ 0,75; PASS ≥ 80%; CI cận dưới ≥ 0,75) vẫn đạt ở E1 (81%), N10 (89%),
  yên 30fps tính-lại-được (86%), yên 60fps (100%) — **trừ tải 30fps dưới M2 rơi xuống
  13/17 = 76% < 80%** (tập con nhỏ, không phải pool tải đầy đủ 35/40 = 88% dưới G5).
- Median pool hầu như không đổi (E1 1,015 → 0,985; N10 0,990 → 0,980) — M2 không làm
  thay đổi kết luận "deint ngang baseline ở mức trung vị"; nó chỉ cắt phần phồng của mean
  (E1 mean 1,031 → 0,951; tải-30fps mean 1,083 → 0,960).
- SD giảm ở E1 (0,230 → 0,183) nhưng TĂNG ở N10 (0,147 → 0,174): median của 5 tỉ lệ là
  thống kê nhiễu hơn mean khi các tỉ lệ trải rộng — đừng nói "M2 ổn định hơn" một cách
  chung chung; M2 chính xác hơn về estimand, không phải lúc nào cũng ít biến động hơn.
- Yên 60fps là ngoại lệ duy nhất M2 cao hơn G5 ở cả median lẫn mean (0,980 vs 0,965):
  phân phối tỉ lệ ở đây lệch trái (1 slot thấp kéo mean xuống), median sửa theo hướng ngược.

### 3.3 Luật (b) — cửa sổ trượt 5 lần trên tập con (theo thứ tự đo)

| Tập con | G5: cửa sổ PASS luật (b) | M2: cửa sổ PASS luật (b) |
|---|---|---|
| E1 30fps (28 cửa sổ) | 24/28 | 23/28 |
| N10 60fps (33 cửa sổ) | 33/33 | 33/33 |
| 5 lần 60fps mới nhất (Z9) | median 1,12; 5/5 PASS | median 1,12; **4/5 PASS — luật (b) vẫn PASS** (median ≥ 0,75 và 4/5 ≥ 0,75) |
| 5 lần 30fps mới nhất (Z9) | median 0,99; 5/5 PASS | median 0,97; 5/5 PASS |

Luật (b) trên cửa sổ 5 lần **không nhạy với metric**: M2 chỉ làm mất 1/28 cửa sổ E1,
0/33 cửa sổ N10. Chuỗi "PASS ổn định" 8 lần liên tiếp ở 60fps đứng vững dưới cả hai metric.

## 4. Sáu ca bất đồng — từng ca một (nguồn: ratios trong `m2-analysis.txt` + JSON v9)

Mẫu chung của cả 6 ca: **≥3/5 tỉ lệ slot dưới ngưỡng 0,75, nhưng 1–2 tỉ lệ cao kéo mean
(G5) lên trên ngưỡng**. G5 PASS ở đây dựa vào 1–2 slot may mắn, không dựa vào slot điển hình.

| # | Lần | Chế độ (baseline) | 5 tỉ lệ | G5 → M2 | Cơ chế |
|---|---|---|---|---|---|
| 1 | W6 e1-run5 (30fps) | tải (3,12 fps) | 0,60 / 0,72 / 0,60 / **1,26 / 1,36** | 0,91 → **0,72** | 2 outlier cao kéo mean; 3/5 dưới ngưỡng; không mẫu số đóng băng |
| 2 | X6 e1-run6 (30fps) | **yên (12,96 fps)** | 0,50 / 0,49 / **2,67** / 0,63 / 0,65 | 0,99 → **0,63** | 1 spike cực đoan 2,67× (slot deint 24,79 fps lúc máy thoáng tải); 4/5 dưới ngưỡng — ca "PASS giả" rõ nhất; lần yên duy nhất lật |
| 3 | R6 60fps-deint-run2 | tải nặng (0,98 fps) | **1,16** / 0,80 / 0,70 / 0,72 / 0,65 | 0,81 → **0,72** | không có spike lớn; phân phối dịch xuống, mean được 1 slot 1,16 đỡ lên; 3/5 dưới ngưỡng |
| 4 | U6 60fps-deint-run5 | tải (4,92 fps) | 0,50 / **1,16** / 0,70 / **1,12** / 0,65 | 0,83 → **0,70** | 2 giá trị cao vừa (1,16 / 1,12) đối 3 giá trị thấp |
| 5 | W6 60fps-deint-run5 | tải (2,73 fps) | 0,70 / 0,62 / 0,53 / 0,58 / **1,34** | 0,75 → **0,62** | G5 đúng vạch 0,75 (biên 0,00) — PASS mong manh nhất pool; 4/5 dưới ngưỡng |
| 6 | Z9 N10-run5 (60fps) | tải rất nặng (2,49 fps) | 0,26 / 0,73 / 0,48 / 0,84 / **1,88** | 0,84 → **0,73** | trải rộng nhất lịch sử N10 (0,26–1,88); 3/5 dưới ngưỡng; lần bất đồng đầu tiên ở fixture 60fps kể từ X6 |

Ba điểm rút ra:

- **Không ca nào do mẫu số đóng băng:** cột loại của cả 6 ca đều là 0 (không tỉ lệ nào có
  mẫu số kề < 0,5 fps). Cơ chế lật duy nhất là (B) tử số đột biến / phân phối lệch phải —
  đúng cơ chế X6 §3.3 đã nêu, nhưng bằng chứng nay là 6/6 ca, không còn là giả thuyết.
- **5/6 ca dưới tải, và ca yên duy nhất (X6 run6) cũng là ca có spike lớn nhất (2,67×):**
  máy yên không miễn nhiễm — baseline mean 12,96 fps của run6 cũng bị kéo lên bởi 2 slot
  baseline vọt (26,75 / 18,95 fps), như X6 đã ghi. Phân loại yên/tải theo baseline mean
  nhiễm nhiễu spike theo cả hai chiều.
- **Biên G5 của các ca lật đều mỏng:** 0,75 / 0,81 / 0,83 / 0,84 / 0,91 / 0,99 — không ca
  nào có G5 ≥ 1,00. Đối chiếu §5: G5 ≥ 1,00 là vùng an toàn tuyệt đối trong dữ liệu này.

## 5. Độ nhạy — tải, nhiễu, biên G5, ngưỡng

### 5.1 Độ nhạy với tải và nhiễu trong lần đo

| Đại lượng (n=69) | Số |
|---|---|
| G5−M2 (có dấu): mean +0,056; median +0,020; min −0,22; max +0,82 | G5 cao hơn M2 trong đa số lần, nhưng **M2 > G5 ở 25/69 lần (36%)** — median vượt mean khi phân phối lệch trái (1 slot thấp kéo mean xuống, vd Z9 N10 run3: G5 1,31 → M2 1,39) |
| \|G5−M2\|: mean 0,092; median 0,040 | 18/69 lần lệch ≥ 0,10; 5/69 lần lệch ≥ 0,20; lệch lớn nhất 0,82 (R6 e1-verify-run1: G5 1,58 → M2 0,86 — cả hai đều PASS, chỉ khác độ lớn) |
| \|G5−M2\| theo chế độ | yên: mean 0,058 / median 0,030 / max 0,36; tải: mean 0,112 / median 0,065 / max 0,82 |
| Pearson(\|G5−M2\|, baseline fps) | **−0,295** — lệch metric lớn dần khi máy tải (baseline thấp) |
| Pearson(\|G5−M2\|, trải rộng tỉ lệ max−min) | **+0,823** — lệch metric gần như là hàm của nhiễu trong lần đo |
| Pearson(G5−M2, trải rộng) | +0,738 — trải rộng càng lớn, G5 càng phồng lên so với M2 |

Kết luận: **bất đồng G5/M2 không phải là nhiễu ngẫu nhiên giữa hai metric tương đương —
nó là tín hiệu của nhiễu slot.** Khi các tỉ lệ trong một lần trải rộng (max−min lớn, điển
hình dưới tải), mean và median tách nhau; khi các tỉ lệ chụm lại (máy yên sạch như X6
run1: 0,86–1,12), hai metric gần như trùng nhau (|Δ| ≤ 0,03).

### 5.2 Độ nhạy theo biên G5 — quy luật "G5 ≥ 1,00 không bao giờ lật"

| G5 của lần PASS | n | Lật dưới M2 |
|---|---|---|
| G5 < 0,90 | 10 | **4/10 (40%)** |
| 0,90 ≤ G5 < 1,00 | 19 | **2/19 (11%)** |
| G5 ≥ 1,00 | 36 | **0/36 (0%)** |

Hệ quả thực hành: một lần PASS đơn lẻ chỉ "chắc" dưới cả hai metric khi G5 ≥ 1,00.
G5 PASS trong [0,75; 1,00) là **PASS cần xác nhận bằng M2** — nên ghi cả hai số, đừng
trích G5 đơn lẻ trong vùng này. 4 lần G5-PASS còn lại có M2 trong [0,75; 0,85) — sát
ngưỡng, dễ lật thêm nếu đo lại: W6 e1-run2 (M2 0,77), U6 N10-run3 (0,81),
V5 N10-run4 (0,76), W6 N10-run2 (0,83).

### 5.3 Độ nhạy ngưỡng (0,70 / 0,75 / 0,80) — đổi ngưỡng không giảm bất đồng

| Ngưỡng | G5 PASS /69 | M2 PASS /69 | Bất đồng | Chiều lật |
|---|---|---|---|---|
| 0,70 | 67 | 65 | 4 | 3 PASS→FAIL + **1 FAIL→PASS** (W6 e1-run7: G5 0,69 → M2 0,72) |
| **0,75 (hiện tại)** | 65 | 59 | **6** | 6 PASS→FAIL, 0 ngược |
| 0,80 | 63 | 57 | 6 | 6 PASS→FAIL (thêm W6 e1-run2 0,88 → 0,77; bớt W6 N10-run5 thành đồng thuận FAIL) |

- Hạ ngưỡng xuống 0,70 là phương án tệ nhất về mặt phương pháp: nó tạo ra ca FAIL→PASS
  duy nhất trong toàn bộ phân tích, phá tính một chiều "M2 chỉ chặt hơn" của metric.
- Nâng lên 0,80 không giảm tổng bất đồng (vẫn 6 ca), chỉ đổi ca nào bất đồng.
- **Giữ 0,75×.** Ngưỡng không phải là vấn đề; vấn đề là mean-vs-median.

## 6. Bước loại vs bước median — phần nào của M2 làm việc?

| Biến thể | Định nghĩa | PASS trên 58 lần X6 | Verdict khác G5 |
|---|---|---|---|
| G5 | mean 5 tỉ lệ | E1 22/26; N10 32/32; gộp 54/58 | — |
| M2mean (chỉ loại, giữ mean) | loại mẫu số < 0,5 fps, rồi mean | E1 **22/26**; N10 32/32; gộp 54/58 | **0 lần** |
| M2c (chỉ median, không loại) | median 5 tỉ lệ | E1 20/26; N10 29/32; gộp 49/58 | 5 lần (= đúng 5 lần lật của X6) |
| M2 (loại + median) | như định nghĩa §2 | E1 20/26; N10 29/32; gộp 49/58 | 5 lần (X6) + 1 lần (Z9) = 6/69 |

- **Bước loại gần như không làm việc gì trong dữ liệu đã có:** chỉ 4/69 lần có tỉ lệ bị
  loại (W6 e1-run1 loại 2; W6 e1-run2 loại 1; N10 run3-đầu loại 1; R6 N10-run3 loại 1);
  M2 khác M2c về giá trị ở đúng 4 lần đó (vd W6 e1-run1: M2 1,00 vs M2c 1,16) nhưng
  **khác verdict 0 lần**. Bước loại chỉ sửa độ lớn, không sửa verdict.
- **Bước median làm toàn bộ việc:** M2c (median thuần, không loại) cho đúng 5/5 lần lật
  của X6; M2mean (loại thuần, giữ mean) cho 0 lần lật.
- **Đính chính số X6:** X6 §3.3 ghi "M2mean (chỉ loại, giữ mean): E1 21/26 (81%)".
  Tính lại từ ratios trong `m2-analysis.txt`: 4 FAIL dưới M2mean (S6 r1 0,73; U6 r2 0,67;
  W6 r6 0,74; W6 r7 0,69) → **22/26 (85%), khớp đúng G5**. Con số 21/26 là sai số
  cộng trong doc X6, không đổi kết luận nào (M2mean vẫn 0 lần lật verdict), nhưng ghi
  lại để đợt sau không trích số sai. N10 M2mean 32/32 của X6 tính lại đúng.
- Hệ quả: nếu parent chỉ muốn sửa lỗi phồng do mẫu số đóng băng (cơ chế A) thì M2mean đã
  đủ — nhưng cơ chế A chưa bao giờ lật verdict nào; lỗi verdict thực tế toàn là cơ chế B
  (tử số đột biến / lệch phải), chỉ median mới sửa được. **Đừng gọi M2 là "metric
  frozen-safe" như thể phần loại là phần quan trọng — phần quan trọng là median.**

## 7. Hệ quả cho chân yên 30fps và khung 16/20 — ĐIỂM QUYẾT ĐỊNH

Chân yên 30fps dưới G5 (Z9): n=18, PASS 14/18 (78%), median 0,940, CI cận dưới 0,840 —
2/3 tiêu chí chặt, còn thiếu 2 lần PASS yên liên tiếp để đạt 16/20 = 80%.

Dưới M2, chân yên chia làm hai lớp:

| Lớp | n | G5 PASS | M2 PASS |
|---|---|---|---|
| Yên 30fps tính lại được (T6 r2; U6 r2; V5 r2/r3; X6 r1–r6; Z9 r1–r4) | 14 | 13/14 (93%) | **12/14 (86%)** |
| Yên 30fps mất fpsSlots (I5-1 0,93; J3-1 0,68; L3-1 0,65; L3-2 0,68) | 4 | 1/4 (chỉ I5-1) | **không tính được** |
| **Chân yên đầy đủ (cả hai lớp)** | **18** | **14/18 (78%)** | **12–13/18 (67–72%)** |

- Khoảng 12–13/18: cận dưới 12/18 (67%) nếu I5-1 (0,93) lật FAIL dưới M2; cận trên 13/18
  (72%) nếu I5-1 giữ PASS. **Cả hai đầu đều dưới 80%.**
- Con số 12/14 (86%) trên tập con tính-lại-được **đẹp một cách gây hiểu lầm**: 4 lần mất
  dữ liệu là 3/4 FAIL dưới G5, nên loại chúng khỏi mẫu là loại đúng những lần xấu nhất.
  Trích "yên 86% dưới M2" mà không ghi 4 lần này là trích sai lệch.
- **Khung 16/20 KHÔNG ĐẠT ĐƯỢC dưới M2 với mẫu hiện tại:** chân yên đang có tối đa
  13/18; dù 2 lần yên tới đều PASS dưới M2 thì cũng chỉ 15/20 = 75% < 80%. Khung này
  được định nghĩa trên verdict G5; đổi metric giữa chừng mà giữ nguyên khung là đổi luật
  chơi sau khi bóng đã lăn — và luật mới làm mục tiêu trở nên bất khả.
- Nếu đổi sang M2 và định nghĩa lại khung trên các lần tính-lại-được (12/14): cần **4 lần
  PASS yên nữa trong 6 lần yên tiếp theo** để đạt 16/20 (12+4=16, n=20). Khả thi, nhưng
  là một khung mới, không phải khung cũ — và mỗi lượt chỉ cho ~4 mẫu yên chắc (Z9: cửa
  sổ yên mở ~9 phút), nên cần ít nhất 2 lượt yên liên tiếp nữa, chưa kể 1 lần FAIL yên
  sẽ phá khung tương tự như dưới G5.
- Chân yên 60fps không bị ảnh hưởng: 10/10 dưới cả hai metric (M2 median 0,980 còn cao
  hơn G5 0,965) — phần "đóng một phần" của phương án A (Z9 §4) đứng vững dưới M2.

## 8. Hệ quả cho pool đầy đủ nếu đổi sang M2 (ước tính có điều kiện)

Pool đầy đủ KHÔNG tính lại được dưới M2 (thiếu 32 lần). Chỉ có thể chặn khoảng:

| Pool đầy đủ | G5 (đã biết) | M2: chặn khoảng | M2: ước tính theo tỉ lệ lật quan sát được (6/65 lần G5-PASS lật ≈ 9%) |
|---|---|---|---|
| 30fps (n=59) | 50/59 (85%) | 26–48/59 (44–81%) — cận trên giả định 0/22 lần G5-PASS mất dữ liệu lật; cận dưới giả định tất cả lật | **≈ 46/59 (78%)** — dưới 80%; khoảng tin cậy rộng, KHÔNG dùng làm verdict |
| 60fps (n=42) | 40/42 (95%) | 33–38/42 (79–90%) — 5 lần M1 mất dữ liệu gồm 2 FAIL đã biết dưới G5 (run4 0,62; run5 0,73), M2 không cứu FAIL thành PASS ở ngưỡng 0,75 | **≈ 37–38/42 (88–90%)** |

Lưu ý: ước tính 30fps ≈ 78% dựa trên giả định tỉ lệ lật 9% áp dụng được cho các lần cũ
I5–Q7 — giả định này KHÔNG kiểm chứng được (các lần cũ đo trên harness/code cũ hơn, tải
khác). Chỉ nêu để parent thấy **đổi sang M2 có thể kéo pool 30fps xuống dưới 80%** —
không phải để trích làm số chính thức. Số duy nhất được phép trích dưới M2 là số tập con
R6→Z9 (§3.2) kèm nhãn tập con.

## 9. Khuyến nghị có điều kiện — cho parent/user quyết

**Khuyến nghị chính (A9): GIỮ G5 làm metric chính thức cho đến khi khung chân yên 30fps
16/20 khép lại, rồi chuyển sang M2 làm metric chính cho mọi quyết định G1 tiếp theo.**

- Vì sao giữ G5 lúc này: khung 16/20 chỉ còn thiếu 2 lần PASS yên liên tiếp dưới G5;
  đổi metric ngay bây giờ phá khung (§7) mà không mang lại verdict nào khác cho phần
  đã đủ điều kiện (chân tải 30/60fps + chân yên 60fps đều đạt cả ba tiêu chí chặt dưới
  cả hai metric — §3.2). G5 vẫn là metric duy nhất có lịch sử đầy đủ (59/42).
- Vì sao chuyển sang M2 sau đó: M2 đo đúng estimand của câu hỏi G1 (slot điển hình),
  đã bắt được 6/6 lần "PASS giả" mà G5 bỏ qua, và tính một chiều của nó (chỉ chặt hơn,
  không bao giờ nới lỏng ở ngưỡng 0,75) làm nó an toàn làm chuẩn. Mọi quyết định G1
  tương lai (đo thêm, đóng phần còn lại) nên dùng M2 để không phải tranh luận lại từng
  lần PASS mong manh.
- Trong thời gian chờ: **ghi cả G5 và M2 mỗi lần đo** (Z9 đã làm); gắn cờ tự động mọi lần
  G5 PASS có G5 ∈ [0,75; 1,00) là "PASS cần xác nhận bằng M2" (§5.2); không trích G5
  đơn lẻ trong vùng này.

**Phương án thay thế — đổi sang M2 NGAY (chỉ chọn nếu parent chấp nhận định nghĩa lại khung):**

1. Đóng băng khung mới: chân yên tính trên các lần **có fpsSlots** (hiện 12/14); mục tiêu
   16/20 → cần 4 PASS trong 6 lần yên tiếp theo.
2. 4 lần yên cũ mất fpsSlots (I5-1, J3-1, L3-1/2) ghi rõ là "không tính lại được — mang
   giá trị G5, gắn cờ", KHÔNG lặng lẽ loại khỏi mẫu, KHÔNG gán M2 ước tính.
3. Giữ ngưỡng **0,75×** (§5.3: 0,70 tạo flip ngược; 0,80 không giảm bất đồng).
4. Định nghĩa M2 cho lần gộp 2 vòng: **median của 10 tỉ lệ** (tiền lệ Z9 run5: M2 gộp
   1,04 từ 10 tỉ lệ [0,39–2,05]; median 10 số = trung bình 2 số giữa = (1,00+1,08)/2).
   Định nghĩa này chưa có trong `g5FrozenSafeFromReport` (hàm chỉ nhận 5 tỉ lệ) — cần
   bổ sung + test trước khi dùng.
5. Không trích pool đầy đủ dưới M2; chỉ trích tập con R6→Z9 + chặn khoảng §8, kèm nhãn.
6. Đổi tên gọi trong doc: M2 là "median 5 tỉ lệ (loại mẫu số đóng băng)" — bỏ nhãn
   "frozen-safe" làm tên chính, vì phần loại chưa bao giờ đổi verdict (§6).

**Không khuyến nghị:**

- Đổi sang M2 ngay mà giữ nguyên khung 16/20 trên n=18 — khung trở nên bất khả (§7).
- Trích "yên 12/14 = 86% dưới M2" hay "N10 33/37 = 89% dưới M2" như số pool đầy đủ —
  đó là số tập con, và tập con 60fps loại đúng 2 FAIL đã biết của M1 nên bị flatter
  (chặn khoảng đầy đủ: 79–90%, §8).
- Hạ ngưỡng xuống 0,70 để "giảm bất đồng" — bất đồng giảm từ 6 xuống 4 nhưng xuất hiện
  ca FAIL→PASS duy nhất (W6 e1-run7), phá tính một chiều của M2.
- Dùng M2mean (chỉ loại, giữ mean) làm chuẩn thay thế — nó không lật verdict nào so
  với G5 (0/58), tức là không sửa được lỗi verdict thực tế; chỉ M2 (median) mới sửa.
- Đóng G1 toàn vẹn ngay dựa trên phân tích này — phân tích metric không thay đổi trạng
  thái G1: chân yên 30fps vẫn thiếu tiêu chí PASS ≥ 80% dưới cả hai metric khi tính đủ
  (G5 78%; M2 67–72%).

## 10. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ phân tích + thêm LIMITS + script phân tích offline trong hidden_files |
| M2 tính lại từ ratios (`analyze-g5-vs-m2.py`) | **KHOP 69/69 lần** đã công bố (58 lần X6 trong `m2-analysis.txt` + 11 lần Z9 trong JSON v9); script đối chiếu cả M2mean/M2b/M2c |
| M2 của lần gộp Z9 run5 | median 10 tỉ lệ = (1,00+1,08)/2 = **1,04 ✓** khớp JSON v9 (`m2_pooled`) |
| `node --test deint-fps-verdict-83k3.test.mjs` (offline) | **17/17 PASS** — hàm `g5FrozenSafeFromReport` + luật median không đổi |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS/JS nào (chỉ thêm LIMITS + script Python phân tích ngoài repo) |
| Đo mới / Chromium | **không chạy** — RAM khả dụng ~548–688 MB lúc phân tích; brief cấm đo mới trừ 1–2 lần xác minh nhỏ, không cần vì dữ liệu trên đĩa đã đủ (69 lần) |
| 4 lần yên cũ mất fpsSlots | đối chiếu `g1-evidence-v8-96x6.json` `pool_30fps_quiet.values` [0,93; 0,68; 0,65; 0,68; 1,04; 0,67; 0,94; 1,02; 1,02; 0,97; 0,84; 1,00; 1,23; 0,99] với 10 lần có fpsSlots (T6 r2 1,04; U6 r2 0,67; V5 r2 0,94; V5 r3 1,02; X6 r1–r6) — 4 giá trị đầu khớp đúng 4 lần I5-1/J3-1/L3-1/L3-2 theo ghi chú `metric_m2.quiet_e1_subset_n10` trong cùng JSON |
| Không process mồ côi | chỉ Python offline; không vite/chrome nào spawn |

## 11. Giới hạn — đọc trước khi trích số

1. **G1 VẪN MỞ — A9 không tự đóng, không đổi metric.** Mọi khuyến nghị ở §9 cần
   parent/user chọn.
2. **Mọi số M2 pool là số tập con R6→Z9 (n=69), không phải pool đầy đủ (n=101).**
   Đừng trích "M2 81%/89%" như số pool đầy đủ — chặn khoảng đầy đủ ở §8 (30fps 44–81%,
   60fps 79–90%).
3. **Tập con M2 bị lệch chọn mẫu:** 60fps thiếu đúng 2 FAIL đã biết của M1 (run4 0,62;
   run5 0,73) nên tập con G5 37/37 = 100% đẹp hơn pool đầy đủ 40/42 = 95%; 30fps thiếu
   27 lần cũ. Mọi so sánh G5-vs-M2 ở §3 đều là so sánh **trong cùng tập con** — đó là
   so sánh công bằng duy nhất có được, nhưng đừng ngoại suy thành verdict pool đầy đủ.
4. **Chân yên M2 12/14 (86%) là số tập con có lệch chọn mẫu** (§7): 4 lần mất dữ liệu
   là 3/4 FAIL. Số trung thực là khoảng 12–13/18 (67–72%).
5. **Median của 5 tỉ lệ là thống kê nhiễu:** M2 SD tăng ở N10 (0,147 → 0,174). Một lần
   đo đơn lẻ dưới M2 không chắc hơn dưới G5 — M2 chỉ đúng hơn về estimand ở mức pool.
   Đừng dùng M2 của 1 lần để kết luận; luôn dùng median-of-runs + CI + tỉ lệ PASS.
6. **Ngưỡng 0,75× là quy ước, không phải hằng số vật lý.** Tính một chiều của M2
   (chỉ chặt hơn) đã kiểm chứng ở ngưỡng 0,75 và 0,80, nhưng KHÔNG giữ ở 0,70
   (1 ca FAIL→PASS). Đừng đổi ngưỡng mà không kiểm tra lại chiều lật.
7. **Phân loại yên/tải theo baseline mean nhiễm nhiễu spike** (X6 run6: baseline mean
   12,96 fps "yên" nhưng 2 slot baseline vọt 26,75/18,95 fps). Các bảng §3.1/§5.1 dùng
   cùng định nghĩa này để so sánh được với lịch sử — đừng đọc "yên" như "mọi slot đều yên".
8. **Lần hỗn hợp Z9 run5 tính là 1 lần** trong tập con (G5 gộp 1,08; M2 gộp 1,04 từ
   10 tỉ lệ), theo phân loại của Z9 (chỉ pool tổng). Nếu parent tính khác (loại khỏi
   pool) thì E1 tập con thành 31 lần, M2 25/31 = 81% — kết luận không đổi.
9. **Số đo chỉ đúng trên VM này** (CPU-only, 4 vCPU, Chrome `--disable-gpu`, Xvfb) trong
   giờ vòng lặp 9–10 luồng song song. Không suy ra máy khác / máy có GPU / Safari thật.
10. **Đính chính X6 (ghi để không trích sai):** M2mean E1 là 22/26, không phải 21/26
    (X6 §3.3). Không đổi kết luận nào của X6.
11. **G1 (deint) vẫn mở, chờ user quyết** (§9) — birefnet 0 lần thành công (chỉ thử lại
    khi RAM đổi); EPERM probe #17 ok=2 fail=0, còn khoảng mù/reboot không ai ghi nhận;
    ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; WebKit clip D, pre-pass
    keyframes, motion blur + mask, trackgeq, fallback, harness O8.

## 12. Nợ còn lại cho đợt sau

1. **Parent/user quyết metric: G5 hay M2** (§9) — A9 khuyến nghị giữ G5 đến khi khung
   16/20 khép, rồi chuyển M2; phương án đổi ngay kèm 6 điều kiện.
2. **Lấy 2 mẫu yên 30fps PASS liên tiếp nữa** (16/20 = 80% dưới G5) — công thức X6/Z9:
   đo E1 ngay đầu lượt; cửa sổ yên mỗi lượt chỉ ~4 mẫu chắc (~9 phút, Z9).
3. **Nếu chọn M2:** bổ sung định nghĩa M2 cho lần gộp 2 vòng (median 10 tỉ lệ) vào
   `g5FrozenSafeFromReport` + test hồi quy (hàm hiện chỉ nhận 5 tỉ lệ); quyết cách xử
   lý 4 lần yên cũ mất fpsSlots; định nghĩa lại khung 16/20 trên lần có fpsSlots.
4. **Gắn cờ tự động "G5 PASS nhưng G5 ∈ [0,75; 1,00)"** trong harness E1/N10 (vùng cần
   xác nhận bằng M2, §5.2) — chưa cài, chỉ là khuyến nghị.
5. **Nhiễu slot trên máy yên** (§4 ca X6 run6; §5.1 Pearson +0,823 với trải rộng): tỉ lệ
   trong một lần yên dao động 0,49–2,67 — cần hiểu nguồn nhiễu (load spike từng slot?
   rVFC? decode?) trước khi tin hoàn toàn vào verdict 1 lần. M2 giảm nhẹ chứ không hết
   nhiễu (median của 5 vẫn nhiễu — §11 mục 5).
6. **G1 (deint) vẫn mở, chờ user quyết** (§9) — birefnet 0 lần thành công (chỉ thử lại
   khi RAM đổi); EPERM probe #18 + khoảng mù #17; ci-security.yml vẫn 403 chờ user;
   TTS 39 CẤM kiểm lại; WebKit clip D, pre-pass keyframes, motion blur + mask, trackgeq,
   fallback, harness O8.
