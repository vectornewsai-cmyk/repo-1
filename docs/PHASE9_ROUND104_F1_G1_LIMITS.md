# Đợt 104 F1 — G1: LẦN YÊN QUYẾT ĐỊNH THỨ HAI — 2 LẦN YÊN PASS, KHUNG (c) VƯỢT MỐC 80,0% (Q5 ĐÃ CÓ ĐÁP ÁN BẰNG SỐ)

Ngày: 13/11/2026 (lượt cron 15:35 +07; đo 08:39–09:17Z).
Nợ: LIMITS gộp đợt 103 §4 mục 1 (G1 — user quyết metric G5 hay M2; E1 đợt 103:
khung tích lũy (c) 24–25/30, kịch bản xấu đúng mốc 80,0% — **Q5 mới: mốc
80,0% đúng chóc có đủ không, hay cần đệm**).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; **reboot #29 lúc 08:56:39Z giữa đợt** — boot 8c1c5131
(lần 1–4) → cff65e89 (lần 5–9 + N10); load 1-phút 0,22–23,22; RAM khả
dụng 426–2951 MB trong cửa sổ đo).

**Trạng thái cuối: CHỈ THU THẬP BẰNG CHỨNG — KHÔNG sửa production, KHÔNG đổi
ngưỡng (0,75×), KHÔNG đổi metric, KHÔNG tự đóng G1, KHÔNG tự kết luận khung
nào mới là khung đúng. Quyết định cuối thuộc parent/user (§7).**
Đo mới: F1 30fps ×9 + N10 60fps ×5 (14 lần, harness C8 + fault-injection của
D7 đã land — md5 không đổi cả cửa sổ đo, xem §3.4). Gộp vào pool v14 (30fps
n=109, 60fps n=69).
Không kiểm lại TTS 39. Không thử birefnet. Không đụng ci-security.yml.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT (TRẢ LỜI TRỰC TIẾP Q5)

**Hai lần yên liên tiếp đều PASS dưới cả hai metric:**
F1 run8 (yên, baseline 21,87 fps): **G5 0,91× PASS, M2 0,94× PASS**;
F1 run9 (yên, baseline 27,39 fps): **G5 0,90× PASS, M2 0,92× PASS**.
Khung tích lũy (c) nay là **26–27/32 = 81,2%–84,4%** — **kịch bản xấu nhất
(I5-1 FAIL) là 26/32 = 81,25%, VƯỢT mốc 80,0% với đệm +1,25 điểm**
(trước đây 24/30 = 80,0% đúng chóc, đệm 0).

**Trả lời Q5 (E1 đợt 103): phương án (b) đã được thỏa bằng số đo — KHÔNG
còn "đúng chóc" nữa.** Đợt 103 hỏi: chờ thêm 1 lần yên PASS nữa để có đệm
(kịch bản xấu 25/31 = 80,6%)? Đợt này đo được **2 lần yên PASS**, kịch bản
xấu nay 81,25%. Nhưng đệm vẫn mỏng theo nghĩa sau — user vẫn phải quyết
(a)/(b)/(c) ở §7, vì:

| Sau đợt này, nếu thêm… | Kịch bản xấu khung (c) | Kết luận |
|---|---|---|
| 1 lần yên FAIL nữa | 26/33 = **78,8%** | RƠI DƯỚI mốc |
| 1 lần yên PASS nữa | 27/33 = **81,8%** | Vượt mốc, đệm +1,8đ |
| 2 lần yên PASS nữa | 28/34 = **82,4%** | Vượt mốc; sau đó chịu được 1 FAIL (28/35 = 80,0% đúng mốc) |

Đệm hiện tại (+1,25đ) đủ để nói "đã vượt mốc", chưa đủ để nói "chịu được
1 lần FAIL nữa". Muốn khung (c) chịu được 1 lần yên FAIL mà vẫn ≥ 80%
kịch bản xấu thì cần thêm **2 lần yên PASS nữa** (28/34 → 28/35 = 80,0%
đúng mốc sau 1 FAIL). E1 không tự chọn — chỉ đưa số.

| Khung chân yên 30fps dưới M2 | Số | Đạt 16/20 (80%)? |
|---|---|---|
| **(a) Khung cố định 20 lần yên ĐẦU** (khung A9 dùng) | tối đa **15/20 = 75%** | **KHÔNG — kết luận A9/C7/D8/E1 đứng vững** |
| **(b) Khung trượt 20 lần yên MỚI NHẤT** (khung C7 đề xuất) | **19/20 = 95%**, tính đủ, **0 mất dữ liệu** | **CÓ — vượt 16/20** |
| **(c) Tích lũy đầy đủ** (toàn bộ chân yên) | **26–27/32 = 81,2%–84,4%** | **CÓ — kịch bản xấu 81,25%, vượt mốc** |
| **(d) Chỉ lần tính-lại-được** (loại 4 lần mất fpsSlots) | **26/28 = 93%** | CÓ — nhưng là số có lệch chọn mẫu (A9 đã cảnh báo) |
| **(e) Yên sạch** (loại lần bị gắn cờ slot-tải-đầu) | **24/26 = 92%** tính-lại-được | CÓ (tập con) — xem §2.2 |
| **(f) Trượt 10 lần yên mới nhất** (8/10 ≈ 16/20) | **10/10 = 100%**, tính đủ | **CÓ — vượt 8/10** |
| **(g) Kỷ nguyên hậu-A9** (đợt 99–104: A7/B7/C7/D8/E1/F1) | **14/14 = 100%**, tính đủ | **CÓ — vượt 80%** |
| **(h) Nhạy biên phân loại** (ngưỡng yên ≥ 9 thay vì ≥ 10) | **không đổi** — 0 lần biên trong pool 30fps | **KHÔNG KIỂM ĐƯỢC** — biên chưa từng bị đo (xem §4) |
| **(i) Biên an toàn khung (b)** (mô phỏng FAIL liên tiếp) | chịu được **4 lần yên FAIL liên tiếp** (16/20) | — (đệm giữ nguyên 4, xem §4) |

- **Khung (a) không đổi dù đo thêm bao nhiêu lần nữa:** 5 lần FAIL đã chốt
  trong 20 lần đầu — tối đa 15/20 là trần cứng (như C7/D8/E1).
- **Khung (b) giữ 19/20 sau khi thêm 2 lần yên mới của F1** (cửa sổ trượt
  sang phải 2 bậc: X6-1..4 ra, F1-8/9 vào; chỉ còn 1 FAIL là X6 r6).
  Khung trượt vẫn là khung C7 ĐỀ XUẤT để user xem xét, KHÔNG phải khung
  đã được duyệt (§7 Q1).
- **Khung (c) — Q5 ĐÃ CÓ ĐÁP ÁN BẰNG SỐ (xem §4):** thêm 2 lần yên PASS
  (F1 run8 + run9) thì kịch bản xấu nhất (I5-1 FAIL) thành **26/32 =
  81,25%**; kịch bản tốt nhất thành 27/32 = 84,4%. Khoảng bất định do
  I5-1 vẫn còn đó vĩnh viễn — nhưng cả hai đầu khoảng nay đều vượt
  mốc với đệm ≥ 1,25 điểm.
- **Khung (g) mở rộng: 14/14 PASS dưới cả hai metric** (thêm F1-8/9 vào
  12/12 của E1). Toàn bộ 5 lần FAIL chặn khung (a) vẫn đều thuộc kỷ
  nguyên TRƯỚC A9; kỷ nguyên hậu-A9 0 lần mất dữ liệu. F1 không kết
  luận "nên bỏ lần cũ" — chỉ ghi rõ: bất đồng giữa các khung hoàn toàn
  nằm ở việc **lần cũ có còn tính hay không**, không phải ở số đo
  (§7 Q6).
- **0 lần bất đồng mới:** 14/14 lần F1 đều đồng thuận G5/M2. Đồng thuận
  toàn lịch sử nay **140/146 (95,9%)**, vẫn đúng 6 lần bất đồng cũ
  của A9, 0 lần FAIL→PASS.
- **Quy luật "G5 ≥ 1,00 không bao giờ lật" MỞ RỘNG: nay 71 lần, 0 lần lật**
  (E1: 66 lần). G5 PASS trong [0,75; 1,00): 70 lần, 6 lần lật — cả 6
  đều là 6 ca cũ; tỉ lệ lật trong vùng 6/70 = 9%.
- **Chân yên 30fps dưới G5: n=32, PASS 28/32 (88%)**, median 0,940;
  chuỗi PASS yên liên tiếp nay là **26**.
- **Chân yên 60fps: 26/26 PASS (100%) dưới CẢ HAI metric**, tính đủ
  hoàn toàn (không mất dữ liệu), median M2 0,975, CI [0,944; 0,997].
  Đây là lần đầu tiên cả 5 lần N10 trong một đợt đều yên.
- **F1 riêng: 14/14 lần PASS dưới cả hai metric** (F1 9/9, N10 5/5).
  Lần sát ngưỡng nhất: F1 run9 (G5 0,90 → M2 0,92) và F1 run8
  (G5 0,91 → M2 0,94) — cả hai đều giữ PASS với biên ≥ 0,15.

## 2. Bảng quyết định — pool v14 (G5) + chân yên M2

Ngưỡng 0,75× giữ nguyên. Yên: baseline mean ≥ 10 fps (luật X6). Luật (b) =
median 5 lần ≥ 0,75 VÀ ≥4/5 lần ≥ 0,75. CI 95% của mean (t-Student).
Script: `hidden_files/round104-f1/analyze-pool104f1.py` (gộp pool) +
`analyze-m2-quiet104f1.py` (chân yên M2 + khung (a)–(i), kế thừa
parser A9/C7/D8/E1). JSON gộp:
`benchmarks/results/g1-evidence-v14-104f1.json` (pool30 n=109, pool60 n=69).

### 2.1 Pool v14 dưới G5 (so với v13/E1)

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Đổi so với v13 |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ | 109 | 1,000 | 1,011 | 0,199 | [0,973; 1,049] | **100/109 (92%)** | +9 điểm n, +9 điểm PASS (91/100 = 91%) |
| 30fps — máy tải (<10, trừ hỗn hợp) | 71 | 1,030 | 1,050 | 0,220 | [0,998; 1,102] | 66/71 (93%) | +6 lần, +6 điểm PASS (60/65 = 92%) |
| 30fps — máy yên (≥10, trừ hỗn hợp) | 32 | **0,940** | **0,932** | 0,124 | **[0,888; 0,976]** | **28/32 (88%)** | +2 lần, +2 điểm PASS (26/30 = 87%) |
| 60fps fixture | 69 | 0,960 | 0,984 | 0,150 | [0,948; 1,020] | **66/69 (96%)** | +5 điểm n, +5 điểm PASS (61/64 = 95%) |
| 60fps — máy tải (<10) | 43 | 1,000 | 1,006 | 0,183 | [0,950; 1,062] | 40/43 (93%) | không đổi |
| **60fps — máy yên (≥10)** | **26** | **0,955** | **0,948** | 0,047 | **[0,930; 0,967]** | **26/26 (100%)** | +5 lần, vẫn 100% |
| Cửa sổ 5 lần 30fps mới nhất (F1 r5–r9) | 5 | 0,94 | — | — | — | 5/5 | luật (b) PASS ỔN ĐỊNH |
| Cửa sổ 5 lần 60fps mới nhất (F1 r1–r5) | 5 | 0,96 | — | — | — | 5/5 | luật (b) PASS ỔN ĐỊNH |

### 2.2 Chân yên 30fps dưới M2 — các khung (§1)

| Khung | n | M2 PASS | Median M2 | Mean M2 | CI 95% | Ghi chú |
|---|---|---|---|---|---|---|
| (a) 20 lần yên đầu (cố định) | 20 | tối đa 15/20 (75%) | — | — | — | 5 FAIL đã chốt; trần cứng |
| (b) 20 lần yên mới nhất (trượt) | 20 | **19/20 (95%)** | 0,930 | 0,927 | [0,880; 0,975] | tính đủ, 0 mất dữ liệu; chỉ FAIL X6 r6 |
| (c) Tích lũy đầy đủ | 32 | **26–27/32 (81,2–84,4%)** | 0,940 | 0,929 | [0,885; 0,972] | khoảng do I5-1 chưa biết; **kịch bản xấu vượt mốc** |
| (d) Chỉ lần tính-lại-được | 28 | **26/28 (93%)** | 0,940 | 0,929 | [0,885; 0,972] | lệch chọn mẫu: loại đúng 3/4 lần xấu nhất |
| (e) Yên sạch (loại run bị gắn cờ slot-tải-đầu) | 30 | 24/26 (92%) tính-lại-được | 0,945 | 0,935 | [0,888; 0,982] | 2 lần bị gắn cờ: A7-7, D8-3 (F1 không có lần nào bị gắn cờ) |
| **(f) Trượt 10 lần yên mới nhất** | 10 | **10/10 (100%)** | 0,940 | 0,944 | [0,909; 0,979] | tính đủ; bản sạch (loại cờ) cũng 10/10 |
| **(g) Kỷ nguyên hậu-A9** (A7/B7/C7/D8/E1/F1) | 14 | **14/14 (100%)** | 0,920 | 0,924 | [0,888; 0,959] | tính đủ; G5 cũng 14/14 |
| **(h) Yên "mở rộng" (ngưỡng ≥ 9)** | 32 | **26–27/32** (y hệt (c)) | — | — | — | 0 lần biên 9–10 fps trong pool 30fps |

### 2.3 Chân yên 60fps dưới M2 (tính đủ hoàn toàn)

| | n | M2 PASS | Median | Mean | CI 95% |
|---|---|---|---|---|---|
| Yên 60fps | 26 | **26/26 (100%)** | 0,975 | 0,971 | [0,944; 0,997] |

Không lần yên 60fps nào mất fpsSlots, không lần nào bị gắn cờ
slot-tải-đầu — đây là chân duy nhất không có khoảng bất định nào.

## 3. Cửa sổ đo mới F1 — chi tiết từng lần

### 3.1 F1 30fps ×9 — 08:39–09:11Z — 9/9 PASS cả hai metric, 1 lần 9/10, 1 lần bị reboot giết

Lệnh (tuần tự): `E1_SCRATCH=hidden_files/round104-f1/e1-runN
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (harness C8 + land
fault-injection của D7, md5 không đổi cả cửa sổ đo — xem §3.4). Driver
dừng ở 9 lần thử, đủ 2/3 lần yên mục tiêu — nhưng 2 lần yên đều rơi
vào cuối lượt (run8–9, sau reboot #29), ngược với đợt 103 (yên ngay
lần đầu).

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | Baseline mean | 5–10 tỉ lệ drift-corrected | G5 | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 08:39–08:42 | 0,80 | 3,81 | 0,66 / 1,40 / 0,70 / 1,00 / 0,84 | **0,92×** | 0,84 | **PASS (tải)** |
| 2 | 08:42–08:45 | 3,33 | 2,81 | 0,90 / 1,01 / 1,39 / 0,93 / 0,75 | **1,00×** | 0,93 | **PASS (tải) — harness 9/10 (G4 flake #2, §3.5)** |
| 3 | 08:45–08:49 | 23,22 | 1,56 | 3,03 / 0,78 / 0,86 / 1,03 / 1,13 | **1,37×** | 0,95 | **PASS (tải) — slot 0 đóng băng, §3.6** |
| 4 | 08:49–08:55 | 0,78 | vòng 1: 1,90 / vòng 2: 2,68 | v1+v2 gộp: 0,60 / 0,65 / 1,18 / 1,34 / 0,65 / 1,28 / 2,32 / 0,71 / 1,41 / 1,03; **gộp 1,12** | **1,12×** | 1,10 | **PASS (tải, 2 vòng)** |
| 5 (cũ) | 08:54–08:57 | 7,49 | — | — | — | — | **BỊ REBOOT #29 GIẾT ở slot 8/11, không report (§3.7)** |
| 5 (làm lại) | 08:58–09:01 | 2,98 | vòng 1: 14,86 / vòng 2: 8,24 | v1+v2 gộp: 0,77 / 0,87 / 0,62 / 0,85 / 1,03 / 1,40 / 1,81 / 1,59 / 1,86 / 0,78; **gộp 1,16** | **1,16×** | 0,95 | **PASS (HỖN HỢP — chỉ tính pool tổng)** |
| 6 | 09:01–09:05 | 7,82 | vòng 1: 6,56 / vòng 2: 4,17 | v1+v2 gộp: 0,41 / 0,18 / 0,84 / 1,42 / 1,21 / 0,88 / 1,79 / 1,03 / 1,01 / 0,64; **gộp 0,94** | **0,94×** | 0,95 | **PASS (tải, 2 vòng)** |
| 7 | 09:05–09:07 | 1,16 | 4,81 | 1,27 / 4,06 / 1,00 / 0,39 / 1,10 | **1,56×** | 1,10 | **PASS (tải)** |
| 8 | 09:07–09:09 | 0,22 | 21,87 | 0,60 / 1,02 / 1,11 / 0,90 / 0,94 | **0,91×** | 0,94 | **PASS (YÊN — LẦN YÊN QUYẾT ĐỊNH #1)** |
| 9 | 09:09–09:11 | 2,53 | 27,39 | 0,92 / 0,88 / 0,92 / 0,94 / 0,86 | **0,90×** | 0,92 | **PASS (YÊN — LẦN YÊN QUYẾT ĐỊNH #2)** |

- **Run8 (0,91×/0,94×) và run9 (0,90×/0,92×) là 2 lần yên quyết định:**
  mỗi lần 1 vòng duy nhất, 5 tỉ lệ, không vòng 2 (mean ≥ 0,9 — PASS chắc
  theo quy tắc 98Z8, không rơi vùng xám). M2 = median 5 tỉ lệ. Cả G5
  lẫn M2 đều PASS với biên ≥ 0,15 — không sát ngưỡng. Run8 bắt đầu lúc
  load 0,22 (thấp nhất đợt), RAM khả dụng 2757 MB, boot cff65e89
  (sau reboot #29); run9 bắt đầu load 2,53, RAM 2188 MB.
- **Run5 (làm lại) là lần hỗn hợp thứ sáu trong lịch sử G1** (sau Z9 run5,
  C7 run6, D8 run2, D8 run4, E1 run2) — và là lần thứ hai có hướng
  yên → tải (E1 run2 đợt 103 là tải → yên). Theo tiền lệ Z9/C7/D8/E1:
  **chỉ tính vào pool tổng, KHÔNG tính vào chân yên lẫn chân tải**.
  Lưu ý: vòng 1 của run5 là yên (14,86 fps) — nếu user quyết tính vòng
  yên của lần hỗn hợp như mẫu yên (Q4) thì chân yên G5 thành 29/33.
- **Run3 (G5 1,37×) có tỉ lệ 3,03× — tỉ lệ đơn lẻ cao nhất từ trước tới
  nay trong pool 30fps** (vượt 2,67× của X6 r6). M2 loại tỉ lệ này
  (mẫu số kề < 0,5 fps do slot 0 đóng băng, §3.6) nên M2 chỉ 0,95× —
  đúng kiểu M2 sinh ra để xử lý. Đừng trích 3,03× hay 1,37× làm tốc
  độ deint.
- **Run7 (G5 1,56×) có tỉ lệ 4,06× — tỉ lệ đơn lẻ cao nhất tuyệt đối
  trong lịch sử G1** (slot 1 deint 3,72 fps trên nền baseline kề ~0,9
  fps). Lại là số phồng do tải, M2 1,10× cứu về mức hợp lý. Đừng trích
  4,06× hay 1,56× làm tốc độ deint.
- **Run6 có 2 tỉ lệ rất thấp 0,18× và 0,41×** nhưng median cứu PASS
  (M2 0,95×) — đúng kiểu M2 sinh ra để xử lý.
- **Run4 là lần 2 vòng thứ hai đợt này** (cả 2 vòng đều tải, G5 gộp 1,12
  từ 10 tỉ lệ theo định nghĩa A9 §9.4).
- **0 slot đóng băng trong 8/9 lần hoàn thành** — ngoại lệ duy nhất là
  slot 0 của run3 (§3.6).
- **Pixel cả 9 lần giống hệt lịch sử:** G2 MAD 0,5821; G7a 0,6903;
  G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt N5→E1).
  **H9 0 lỗi trang cả 9 lần.** Không có dấu EPERM trong log 14 lần đo
  F1 (grep 0 kết quả).
- **Toggle Space: 198 lần toggle (9 lần E1 × 22), 0 retry, 0 fallback,
  tất cả lật bằng Space.** Play >400ms: **6 slot** (run3: 4, run4: 2);
  pause >400ms: **1 slot** (run3). Chậm nhất: play 621ms, **pause
  837ms (run3 slot 5) — chậm nhất từng quan sát trong lịch sử G1**
  (vượt 804ms của D8). Xem §3.6 — ghi cho luồng harness.

### 3.2 60fps deint-only ×5 (probe N10) — 09:11–09:17Z — 5/5 PASS cả hai metric, 5/5 YÊN

Lệnh (tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round104-f1/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 | M2 | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 09:11–09:12 | 2,11 | 24,16 fps | 1,09 / 0,98 / 0,80 / 0,97 / 0,97 | **0,96×** | 0,97 | PASS, 4/4 (yên) |
| 2 | 09:12–09:13 | 2,11 | 24,35 fps | 1,01 / 0,98 / 0,95 / 0,95 / 1,01 | **0,98×** | 0,98 | PASS, 4/4 (yên) |
| 3 | 09:13–09:15 | 1,25 | 23,95 fps | 1,01 / 0,91 / 1,00 / 0,88 / 1,04 | **0,97×** | 1,00 | PASS, 4/4 (yên) |
| 4 | 09:15–09:16 | 0,57 | 24,02 fps | 0,95 / 0,88 / 0,89 / 0,94 / 0,98 | **0,93×** | 0,94 | PASS, 4/4 (yên) |
| 5 | 09:16–09:17 | 0,57 | 17,16 fps | 1,08 / 1,16 / 1,01 / 0,56 / 0,83 | **0,93×** | 1,01 | PASS, 4/4 (yên) |

- **Lần đầu tiên cả 5 lần N10 trong một đợt đều yên** (E1 đợt 103 chỉ
  1/5 yên). Tỉ lệ 60fps đợt này rất "sạch": biên độ 0,56–1,16, không
  có tỉ lệ phồng 2× như các đợt tải nặng — đúng kỳ vọng của chân yên.
- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 5/5 lần và giống hệt
  M1/N10/R6/S6/T6/U6/V5/W6/X6/Z9/A7/B7/C7/D8/E1 — deint áp thật trên
  fixture 60fps, đường code không đổi.
- **C3 0 lỗi trang cả 5 lần.** Không có dấu EPERM trong log 5 lần đo.
- **Run5 có tỉ lệ thấp nhất đợt 60fps: 0,56×** nhưng median cứu PASS
  (M2 1,01×) — đúng kiểu M2 sinh ra để xử lý.

### 3.3 So sánh cửa sổ yên các đợt gần đây (điều kiện đo)

| Đợt | E1 yên (mục tiêu 3) | E1 hỗn hợp | Load 1-phút cao nhất trong cửa sổ E1 |
|---|---|---|---|
| B7 (100) | 3 (run7–9, cuối lượt) | 0 | ~8 |
| C7 (101) | 3 (run1–3, đầu lượt) | 1 (run6) | 13,06 |
| D8 (102) | 2 (run1 + run3-cờ), hết 9 lần thử | 2 (run2, run4) | 25,15 |
| E1 (103) | 1 (run1), hết 9 lần thử | 1 (run2) | 16,73 |
| **F1 (104)** | **2 (run8–9, cuối lượt, sau reboot #29)** | **1 (run5 làm lại)** | **23,22** |

Cửa sổ yên đợt 104 mở muộn và chỉ mở sau reboot #29: 7 lần thử đầu
(run1–7) toàn tải dù có lúc load 1-phút chỉ 0,22–1,16 (xem §3.6 về
nghịch lý baseline thấp khi load thấp). 2 lần yên rơi vào cuối lượt
(run8–9), khi các luồng song song khác đã gần xong. Hệ quả cho đợt
sau: với 8–10 luồng song song, đừng kỳ vọng 3 lần yên/đợt; 2 lần yên
vẫn đủ để cập nhật mọi khung (như đợt này đã chứng minh), và **cửa sổ
yên sau reboot là thật** — đợt sau nên cân nhắc đo ngay sau reboot
nếu bắt được.

### 3.4 Harness trong cửa sổ đo — KHÔNG ĐỔI SO VỚI E1 (đợt 103)

- `clicktest-77e1-deint-fps.mjs` md5 **4ba1d86c** (bản D7 đã land code
  fault-injection), `deint-fps-verdict.mjs` **57a4f6d8**,
  `probe-86n10-config-fps.mjs` **9ca985cd** (bản D7 đã land) —
  **không đổi trước/sau MỖI lần F1** (ghi trong runs.log) và không đổi
  cả cửa sổ N10. **Giống hệt E1 đợt 103** — số đo so sánh được trực
  tiếp, không có caveat về bản harness như đợt 103 so với D8.
- **Reboot #29 lúc 08:56:39Z (uptime -s), boot 8c1c5131 → cff65e89,
  giữa lần 5** (xem §3.7). Ghi cho luồng EPERM: khoảng mù #22 bắt đầu
  05:40:24Z vẫn mở trong cửa sổ F1; F1 không mở khoảng mù mới nào
  ngoài reboot #29 (đã ghi giờ).
- Không process mồ côi của F1 sau đo (0 vite/chrome nào dùng scratch
  round104-f1 còn chạy).

### 3.5 G4 flake lần thứ hai trong lịch sử G1 (F1 run2)

F1 run2: harness 9/10, exit=1 — **FAIL G4 đối chứng progressive**:
R=0,48 (thỏa < 0,8) nhưng hook `deinterlaceTap=false`, `applied=[]`,
`hasEnhance=false` — tap deint không áp lên clip progressive ở bước
G4. 8 lần còn lại của F1 (run1, run3–9) đều PASS G4 (R=0,51,
tap=true). G2 cùng lần vẫn PASS (tap áp đúng trên clip interlaced,
MAD 0,5821), G3 PASS, G5 sau đó vẫn PASS 1,00×, G7a/G7b/G8 đều PASS
với tap=true — nên lỗi **cô lập ở bước bật lại deint sau G3 trong
lần này**, không phải hồi quy deint. Giả thuyết khả dĩ nhất (như E1
run8 đợt 103): toggle bật deint chưa kịp áp trước khi snapshot G4
dưới tải (load 19,58 lúc G5, cao nhất trong các lần có G4 FAIL).
**Đây là lần thứ hai G4 FAIL — 2/18 lần E1 trong 2 đợt gần nhất
(103 run8 + 104 run2), cả hai đều dưới tải nặng.** Tỉ lệ flake này
(11%) đã đủ cao để luồng harness đợt sau phải điều tra thời gian áp
enhance sau toggle dưới tải, thay vì chỉ "theo dõi" như E1 đã ghi.

**Số G5/M2 của run2 vẫn dùng được:** G5 1,00 / M2 0,93 tính từ
fpsSlots đầy đủ 11 slot (10/10 tỉ lệ hợp lệ, 0 slot đóng băng), cùng
cách tính như mọi lần khác; G4 là bước đối chứng pixel độc lập, không
chạm tới phép đo FPS. Run2 được tính vào pool tổng như một lần tải
bình thường, và ghi rõ harness 9/10 trong JSON gộp.

### 3.6 Slot 0 đóng băng (run3) + toggle chậm kỷ lục + nghịch lý baseline thấp khi load thấp

- **Run3 slot 0 đóng băng:** draw 0,32 fps trong khi tick 7,41 fps,
  playhead 0,32× — draw/tick tách rời (draw gần như đứng yên trong
  khi tick vẫn chạy). Đây là lần đầu tiên trong lịch sử G1 có slot
  baseline draw < 0,5 fps mà tick vẫn > 7 fps. M2 đã loại đúng tỉ lệ
  3,03× (mẫu số kề (0,32 + draw2)/2 < 0,5 fps) nên M2 run3 = 0,95×
  (không phải 1,03× nếu tính đủ 5 tỉ lệ). Bước loại của M2 đã bắn
  đúng 1 lần đợt này — lần đầu tiên kể từ khi M2 được định nghĩa.
- **Toggle chậm kỷ lục:** run3 có 4 slot > 400ms (play max 621ms,
  pause max **837ms ở slot 5** — vượt kỷ lục cũ 804ms của D8);
  run4 thêm 2 slot > 400ms (play max 490ms). Tổng F1: 6 slot > 400ms
  / 198 toggle, 0 retry, 0 fallback — tất cả đều lật bằng Space.
  Keydown chậm tự nhiên vẫn chưa lọt đúng cửa sổ 2s của fallback #1
  (xem E8 đợt 103) — nhưng 837ms là lần gần nhất từng quan sát.
  Ghi cho luồng harness đợt 104.
- **Nghịch lý baseline thấp khi load thấp:** run1 bắt đầu load 0,80
  nhưng baseline chỉ 3,81 fps; run7 bắt đầu load 1,16 (giữa lượt
  load 0,53) nhưng baseline chỉ 4,81 fps. Trong khi run8 bắt đầu
  load 0,22 thì baseline 21,87 fps. Load 1-phút thấp KHÔNG đủ để
  đảm bảo baseline cao — có thể do CPU dùng chung bị throttle
  (shared 1,5 CPU) hoặc các luồng khác giữ browser instance ngầm
  mà loadavg không phản ánh. F1 không chẩn đoán sâu (ngoài phạm vi
  G1) — chỉ ghi: **đừng dùng load 1-phút làm chỉ báo duy nhất cho
  cửa sổ yên; baseline fps đo được mới là chuẩn phân loại** (đúng
  như luật X6 đã làm).

### 3.7 Reboot #29 giữa đợt — giết lần 5, chạy lại sau reboot

- **Reboot #29: 08:56:39Z theo `uptime -s`, boot-id 8c1c5131 →
  cff65e89.** Driver gốc (chạy từ 08:39:19Z) bị giết giữa lần 5
  (slot 8/11 đã chạy, không có report JSON). F1 lưu bằng chứng lần
  bị giết (`e1-run5-killed-reboot29/` + `e1-run5-run.log.killed-reboot29`)
  rồi chạy lại lần 5 từ đầu trên boot mới (08:58:12Z, load 2,98, RAM
  khả dụng 2012 MB) — lần làm lại hoàn thành, kết quả hỗn hợp (§3.1).
- **Mâu thuẫn thời gian nhỏ (ghi trung thực):** log lần 5 cũ có dòng
  slot tới 08:57:03Z — 24 giây SAU giờ boot 08:56:39Z theo uptime -s.
  Có thể do độ chi tiết của đồng hồ boot/runtime restart trễ hơn
  kernel reboot, hoặc `uptime -s` làm tròn. F1 không bịa giờ khác —
  ghi cả hai số để luồng EPERM tự đối chiếu. Reboot tiếp theo dự
  kiến ~11:03Z (chu kỳ ~2h07' sau #29).
- Bài học (như E9 đợt 103): đừng kết luận missing từ việc driver
  chết — kiểm tra đĩa trước, rồi chạy tiếp phần còn lại thay vì
  chạy lại từ đầu.

## 4. Quy luật G5 ≥ 1,00, khung mới (f)–(i), và đáp án Q5 bằng số

| G5 của lần PASS | A9 (n=69) | C7 (n=104) | D8 (n=118) | E1 (n=132) | Nay (n=146, R6→F1) |
|---|---|---|---|---|---|
| G5 ≥ 1,00 | 36 lần, **0 lật** | 50 lần, 0 lật | 58 lần, 0 lật | 66 lần, 0 lật | **71 lần, 0 lật** |
| 0,90 ≤ G5 < 1,00 | 19 lần, 2 lật | 33 lần, 2 lật | 37 lần, 2 lật | 39 lần, 2 lật | **48 lần, 2 lật** |
| 0,75 ≤ G5 < 0,90 | 10 lần, 4 lật | 16 lần, 4 lật | 18 lần, 4 lật | 22 lần, 4 lật | **22 lần, 4 lật** |
| G5 PASS trong [0,75; 1,00) | 29 lần, 6 lật | 49 lần, 6 lật | 55 lần, 6 lật | 61 lần, 6 lật | **70 lần, 6 lật** |

- Quy luật A9 §5.2 đứng vững với mẫu lớn hơn: **không một lần G5 PASS
  nào có G5 ≥ 1,00 lật dưới M2 (0/71)**. 5 lần mới trong vùng này
  (F1 run2 1,00 / run3 1,37 / run4 1,12 / run5 1,16 / run7 1,56;
  không lần N10 nào ≥ 1,00) — tất cả giữ PASS.
- Tỉ lệ lật trong vùng [0,75; 1,00) giảm từ 6/61 (10%) xuống 6/70 (9%)
  — M2 "bắt PASS giả" ít dần khi mẫu mới toàn PASS, nhưng 6 ca cũ
  không biến mất.
- Lần sát ngưỡng nhất đợt này dưới M2: F1 run9 (0,92×) và run8 (0,94×)
  — cả hai đều là lần yên, biên ≥ 0,15. Nếu đo lại, khả năng lật là
  thấp nhưng không tính được xác suất từ 1 lần đo.

### Khung (f) — trượt 10 lần yên mới nhất: 10/10 PASS dưới M2

Thành phần: B7-8, B7-9, C7-1, C7-2, C7-3, D8-1, D8-3, E1-1, F1-8, F1-9.
Median M2 0,940, CI [0,909; 0,979]. Bản "sạch" (loại A7-7 và D8-3 bị
gắn cờ) cũng 10/10 PASS. Khung ngắn hơn (10 thay vì 20) nhưng vẫn đạt
mốc tương đương 80% — và không chứa lần FAIL nào trong 10 lần gần
nhất. Hạn chế: cửa sổ 10 lần nhạy hơn với 1–2 lần FAIL tương lai
(2 lần FAIL liên tiếp đã rơi xuống 8/10 đúng mốc; 3 lần FAIL là 7/10
dưới mốc) — F1 không trình bày khung này như khung chính thức, chỉ
như bằng chứng bổ sung.

### Khung (g) — kỷ nguyên hậu-A9: 14/14 PASS dưới M2

Thành phần: A7-1, A7-7, A7-8, B7-7, B7-8, B7-9, C7-1, C7-2, C7-3,
D8-1, D8-3, E1-1, F1-8, F1-9. Median M2 0,920, CI [0,888; 0,959]; dưới
G5 cũng 14/14. 0 lần mất dữ liệu trong kỷ nguyên này. Ý nghĩa (chỉ
phân tích, không kết luận): toàn bộ 5 lần FAIL chặn khung (a) đều
trước A9 — 3 lần mất fpsSlots (I5-1/J3-1/L3-1/L3-2, đợt ≤93) + U6 r2
(đợt 94) + X6 r6 (đợt 96). Nếu user coi các lần trước A9 là "lỗi thời"
thì mọi khung đều đạt; nếu user giữ toàn bộ lịch sử thì khung (a)
vẫn chặn. Đây là quyết định về **tuổi thọ của bằng chứng**, không phải
về số đo (§7 Q6).

### Khung (h) — nhạy biên phân loại: KHÔNG KIỂM ĐƯỢC với pool 30fps

**0 lần** trong toàn bộ pool 30fps (n=109) có baseline trong [9, 10)
fps — khung "mở rộng" (ngưỡng ≥ 9) cho đúng số cũ 26–27/32. Biên
phân loại yên/tải ở 10 fps **chưa từng bị đo** với fixture 30fps.
Ngoại lệ đáng ghi (không tính): F1 run5 vòng 2 có baseline 8,24 fps
— giá trị gần biên nhất trong đợt này nhưng thuộc lần hỗn hợp nên
không tính là một lần biên theo luật phân loại theo lần. Với 60fps:
chỉ có đúng 1 lần biên trong lịch sử — C7 N10 run1 (baseline 9,71
fps, G5 0,99, M2 1,07 PASS, hiện phân loại tải). Nếu đổi ngưỡng sang
≥ 9 thì chân yên 60fps thành 27/27 (vẫn 100%) — kết luận không đổi.
Ghi nhận: muốn kiểm biên thật thì đợt sau cần cố tình đo vào lúc
baseline lanh quanh 9–10 fps (khó chủ động — phụ thuộc load máy lúc
đo).

### Khung (i) — biên an toàn của khung trượt-20

Mô phỏng k lần yên FAIL liên tiếp (cửa sổ trượt, lần cũ nhất bị đẩy
ra; X6 r6 là FAIL duy nhất trong cửa sổ nên 4 FAIL đầu đẩy cả FAIL
cũ ra): +1 → 18/20, +2 → 18/20, +3 → **17/20 (vẫn đạt)**, +4 →
**16/20 (vẫn đạt — X6 r6 bị đẩy ra khỏi cửa sổ ở lần thứ 4)**,
+5 → **15/20 (rơi dưới mốc)**, +6 → 14/20. Khung (b) có đệm
**4 lần FAIL liên tiếp** (giữ nguyên so với E1, vì X6 r6 đã trôi gần
mép cửa sổ) — không mong manh (1 lần FAIL không đổi kết luận), nhưng
cũng không dày: 5 lần FAIL liên tiếp là đủ lật.

### Đáp án Q5 bằng số — khung tích lũy (c) ĐÃ VƯỢT MỐC, ĐỆM +1,25 ĐIỂM

Tích lũy trước đợt: 24–25/30 (kịch bản xấu đúng mốc 80,0%). **F1 run8
yên PASS → 25–26/31 (kịch bản xấu 80,6%); F1 run9 yên PASS →
26–27/32: kịch bản xấu 26/32 = 81,25%, kịch bản tốt 27/32 = 84,4%.**
Đây là lần đầu tiên khung tích lũy đứng VƯỢT mốc ngay cả trong kịch
bản xấu nhất, với đệm +1,25 điểm. E1 đợt 103 đã hỏi user có muốn chờ
thêm 1 lần yên PASS để có đệm không — đợt này đã đo được 2 lần, đệm
đã có. Câu hỏi còn lại cho user là đệm +1,25đ có đủ không (xem §7 Q5
cập nhật): 1 lần yên FAIL nữa vẫn kéo kịch bản xấu xuống 26/33 =
78,8% (dưới mốc); cần thêm 2 lần yên PASS nữa thì khung (c) mới chịu
được 1 lần FAIL mà vẫn ≥ 80% kịch bản xấu.

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — chỉ đo + phân tích |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** chạy lại xanh |
| `node --test deint-fps-verdict-100b7.test.mjs` | **13/13** chạy lại xanh |
| `node --check` 3 script đã dùng | **PASS** cả ba |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS/JS nào (chỉ thêm LIMITS + JSON số đo + file trong hidden_files), cùng tiền lệ A7/A9/C7/D8/E1 |
| Tái tạo v13 (`analyze-pool104f1.py`) | **KHỚP đúng** số E1 đã công bố trước khi thêm lần mới (pool 30 n=100 PASS 91/100; pool 60 n=64 PASS 61/64) |
| G5/M2 tính lại từ `fpsSlots`/`g5Rounds` | **KHỚP** report cả 14 lần F1 (G5 khớp combinedMean/rMean/ratioMean ±0,01; M2 = median sau loại mẫu số < 0,5 fps — run3 loại đúng 1 tỉ lệ 3,03×; lần 2 vòng = median 10 tỉ lệ theo định nghĩa A9 §9.4) |
| M2 tính lại độc lập (`analyze-m2-quiet104f1.py`) | tái tạo đúng 6 lần lật của A9 + 132 lần R6→E1 trước khi thêm F1; đồng thuận 140/146 |
| Cửa sổ F1 E1 30fps ×9 headed | **9/9 hoàn thành, 9/9 PASS G5+M2, 0 abort, 0 `HARNESS LỖI`** — G5: 0,92 / 1,00 / 1,37 / 1,12 / 1,16 / 0,94 / 1,56 / 0,91 / 0,90; yên 2 / tải 6 / hỗn hợp 1; **run2 harness 9/10 (G4 flake #2, §3.5)**; lần 5 cũ bị reboot giết, đã chạy lại |
| Cửa sổ F1 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 4/4 mỗi lần, 5/5 PASS G5** (0,96 / 0,98 / 0,97 / 0,93 / 0,93), M2 5/5 PASS, **5/5 yên** |
| Headed H9/C3 (mọi lần chạy F1) | **0 lỗi trang** (H9 9/9 E1, C3 5/5 N10) |
| Pixel D1 60fps (F1) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1→E1 — tap áp thật |
| Pixel G2/G7a/G7b/G8 F1 (cả 9 lần) | giống hệt N5→E1 (G2 MAD 0,5821 ×9; G7a MAD 0,6903; G7b MAD 0,0119; G8 R 0,55 → 0,52, MAD 1,5522) |
| Harness md5 trước/sau mỗi lần F1 | **không đổi trong từng lần và cả cửa sổ** (4ba1d86c / 57a4f6d8 / 9ca985cd) — **giống hệt E1 đợt 103** |
| Không process mồ côi của F1 sau đo | 0 vite/chrome nào dùng scratch round104-f1 còn chạy; boot-id cff65e89 đầu = cuối (sau reboot #29) |
| Reboot #29 trong cửa sổ đo | 08:56:39Z (uptime -s), giết lần 5 cũ ở slot 8; lần 5 làm lại hoàn thành trên boot mới |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 VẪN MỞ — F1 không tự đóng, không đổi metric, không chọn khung.**
   Mọi câu hỏi ở §7 cần parent/user quyết. Đáp án "M2 có đạt 16/20
   không" đổi theo khung (§1) — đừng trích một khung mà không ghi tên
   khung đó. Điểm mới đợt này: khung (c) kịch bản xấu nay VƯỢT mốc
   80,0% với đệm +1,25 điểm — nhưng 1 lần yên FAIL nữa vẫn kéo nó
   xuống dưới mốc.
2. **Khung (b) trượt 20 lần mới nhất và khung (f)/(g) mới là khung D8/E1/F1
   trình bày để xem xét, KHÔNG phải khung đã duyệt.** Khung gốc của
   G1 là tích lũy (14/18 → 16/20), khung A9 phân tích là cố định 20
   lần đầu. Đừng trình bày 19/20, 10/10 hay 14/14 như thể đó là khung
   chính thức.
3. **Khoảng 26–27/32 là vĩnh viễn:** M2 của I5-1 không bao giờ tính lại
   được (mất fpsSlots). Mọi kết luận về chân yên tích lũy dưới M2 đều
   phải mang khoảng này, không được chọn một đầu rồi trích như số chắc.
   Hai lần yên quyết định chỉ thu hẹp tương đối, không xóa được khoảng.
4. **Số "26/28 = 93% dưới M2" là số tập con có lệch chọn mẫu** (A9 §11
   mục 4): 4 lần mất dữ liệu là 3/4 FAIL. Số trung thực là khoảng
   26–27/32 (81,2–84,4%).
5. **Khung (a) 15/20 là trần cứng, không phải do thiếu mẫu:** 5 FAIL đã
   chốt trong 20 lần đầu. Đo thêm 100 lần yên nữa cũng không đổi khung
   này — chỉ đổi khung mới (trượt/tích lũy/hậu-A9) mới thay đổi đáp án.
6. **Khung (h) không kiểm được:** 0 lần biên 9–10 fps trong pool
   30fps. Đừng trích "đổi ngưỡng không đổi kết luận" như một kiểm
   chứng — đó là hệ quả của việc không có dữ liệu biên, không phải
   của độ ổn định. Vòng 2 của F1 run5 (8,24 fps) là lần gần biên nhất
   đợt này nhưng thuộc lần hỗn hợp nên không tính.
7. **Median của 5 tỉ lệ là thống kê nhiễu:** M2 SD tăng ở N10 trong
   phân tích A9. Lần sát ngưỡng đợt này (M2 0,92× ở F1 run9 yên) có
   thể lật nếu đo lại — đừng dùng M2 của 1 lần để kết luận; luôn dùng
   median-of-runs + CI + tỉ lệ PASS.
8. **Phân loại yên/tải theo baseline mean nhiễm nhiễu spike** (tiền lệ
   X6 run6; F1 run5 vòng 1 baseline 14,86 fps chỉ trên ngưỡng 4,86).
   Các bảng dùng cùng định nghĩa này để so sánh được với lịch sử —
   đừng đọc "yên" như "mọi slot đều yên". Đợt này có 1 lần hỗn hợp —
   lần thứ sáu trong lịch sử, và là lần thứ hai có hướng yên → tải.
9. **Lần hỗn hợp F1 run5 tính là 1 lần trong pool tổng** (G5 gộp
   1,16; M2 gộp 0,95 từ 10 tỉ lệ), theo phân loại của Z9 run5 / C7
   run6 / D8 run2/run4 / E1 run2. Nếu parent tính khác (tính vòng yên
   như 1 mẫu yên) thì chân yên G5 thành 29/33 (87,9%), chân yên M2
   tính-lại-được thành 27/29 (93,1%) — kết luận không đổi, nhưng số
   phải ghi theo cách tính đã chọn.
10. **Cửa sổ yên đợt 104 mở muộn và chỉ mở sau reboot #29** (2/9 lần
    E1 yên, đều cuối lượt; load 1-phút tới 23,22). Số đo chỉ đúng trên
    VM này (CPU-only, 4 vCPU, Chrome `--disable-gpu`, Xvfb) trong giờ
    vòng lặp 8–10 luồng song song. Không suy ra máy khác / máy có GPU /
    Safari thật. Baseline thấp bất thường ngay cả khi load 1-phút < 1
    (run1 3,81 fps lúc load 0,80; run7 4,81 fps lúc load 0,53) — xem
    §3.6; đừng dùng loadavg làm chỉ báo duy nhất cho cửa sổ yên.
11. **Đường retry/fallback của B7/D7 vẫn chưa bắn thật trong F1**
    (§3.1): 198 toggle, 0 retry, 0 fallback; caveat B7 §7 mục 1 vẫn
    đứng nguyên. Đợt này có 6 slot vượt 400ms (cao nhất pause 837ms,
    vượt kỷ lục 804ms của D8) — mốc 800ms của code cũ đã bị chạm tới
    lần đầu tiên, nhưng vẫn chưa lọt cửa sổ 2s của fallback #1.
12. **G4 flake lần thứ hai trong lịch sử G1** (F1 run2, §3.5): tap
    không áp lên clip progressive ở bước G4 (R vẫn thỏa 0,48 < 0,8).
    G5/M2 của run2 vẫn dùng được (FPS đo độc lập với G4). Tỉ lệ flake
    2/18 lần E1 trong 2 đợt gần nhất — luồng harness đợt sau nên điều
    tra thời gian áp enhance sau toggle dưới tải, không chỉ theo dõi.
13. **Harness đợt này giống hệt E1 đợt 103** (md5 4ba1d86c / 57a4f6d8 /
    9ca985cd): số đo so sánh được trực tiếp, không caveat bản harness.
14. G1 (deint) vẫn mở, chờ user quyết (§7) — birefnet 0 lần thành công
    (chỉ thử lại khi RAM đổi); EPERM probe #23 + khoảng mù #22 (sau
    reboot #27 05:26:18Z 13/11) + **reboot #29 lúc 08:56:39Z** (F1 đã
    ghi giờ; khoảng mù #22 nay có thêm mốc reboot #29 để đối chiếu);
    ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; WebKit clip
    D, pre-pass keyframes, motion blur + mask, trackgeq, fallback,
    harness O8.

## 7. Câu hỏi cho user — F1 chỉ hỏi, không tự trả lời

**Q1 — Khung 16/20 tính theo khung nào? (lặp lại từ C7/D8/E1, nay có đáp
án mới cho khung (c))**
(a) Cố định 20 lần yên đầu: M2 tối đa 15/20 — KHÔNG BAO GIỜ đạt, dù đo
thêm bao nhiêu lần. (b) Trượt 20 lần yên mới nhất: M2 đang 19/20 — ĐÃ
ĐẠT, đệm 4 lần FAIL liên tiếp. (c) Tích lũy đầy đủ: M2 đang 26–27/32
— **kịch bản xấu nay 81,25%, VƯỢT mốc với đệm +1,25 điểm**. (f) Trượt
10 lần mới nhất: 10/10 — ĐÃ ĐẠT mốc tương đương. (g) Kỷ nguyên hậu-A9:
14/14 — ĐÃ ĐẠT. F1 không chọn thay user: nếu user giữ khung (a) thì
đáp án là "M2 không đạt, giữ G5"; nếu user chấp nhận (b), (c), (f)
hoặc (g) thì đáp án đổi. **Đây là quyết định về luật chơi, không phải
về số đo.**

**Q2 — 4 lần yên cũ mất fpsSlots xử lý thế nào? (lặp lại từ C7/D8/E1)**
Giữ nguyên khoảng 26–27/32 (trung thực nhất, nhưng không bao giờ cho
một số duy nhất); loại khỏi mẫu và trích 26/28 = 93% (đẹp nhưng lệch
chọn mẫu — A9 đã cảnh báo); hay ghi I5-1 là "không xác định" và hoãn
quyết định tích lũy? Lưu ý mới: khoảng nay đã thu hẹp về phía đạt
(cả hai đầu vượt mốc), nên câu hỏi này ít gay gắt hơn trước — nhưng
vẫn chưa có số duy nhất.

**Q3 — Chọn G5 hay M2 làm chuẩn, và khi nào? (lặp lại từ C7/D8/E1)**
Theo khuyến nghị A9: giữ G5 đến khi khung 16/20 khép rồi chuyển M2.
Khung (c) kịch bản xấu nay đã khép VƯỢT mốc, khung (b)/(f)/(g) đã
khép vượt mốc — nên "khép" ở đây phải hiểu theo khung nào (Q1)? Nếu
user chọn M2 ngay: có chấp nhận định nghĩa lại khung (khung mới trên
lần có fpsSlots + 6 điều kiện A9 §9) không? Ngưỡng giữ nguyên 0,75×
trong mọi phương án (A9 §5.3).

**Q4 — Lần hỗn hợp F1 run5 (và Z9 run5, C7 run6, D8 run2/run4, E1 run2)
có giữ cách tính "chỉ pool tổng" không? (lặp lại từ C7/D8/E1, nay có
6 lần/đợt lịch sử)**
F1 giữ tiền lệ Z9. Nếu user muốn tính vòng yên của run5 như mẫu yên
thì chân yên G5 thành 29/33 (87,9%), chân yên M2 tính-lại-được thành
27/29 (93,1%) — kết luận không đổi, nhưng số khung đổi. Cần user xác
nhận cách tính trước khi đợt sau trích số. Lưu ý: run5 là lần hỗn hợp
thứ hai có hướng yên → tải (sau E1 run2 đợt 103 là tải → yên — thứ tự
đã đảo hai đợt liên tiếp), và vòng 2 của nó (8,24 fps) là giá trị gần
biên phân loại nhất đợt này.

**Q5 (CẬP NHẬT — đáp án bằng số đã có, user vẫn phải quyết "đủ hay chưa")**
E1 đợt 103 hỏi: mốc 80,0% đúng chóc của khung (c) có đủ không, hay cần
đệm — và đề xuất chờ thêm 1 lần yên PASS (kịch bản xấu 25/31 = 80,6%).
Đợt này đã đo được **2 lần yên PASS**: kịch bản xấu nay **26/32 =
81,25% (đệm +1,25 điểm)**. User có muốn (a) chấp nhận 81,25% là đủ
đệm để coi khung (c) đã khép, (b) chờ thêm 2 lần yên PASS nữa để
khung (c) chịu được 1 lần FAIL mà vẫn ≥ 80% kịch bản xấu (28/34 →
28/35 = 80,0% đúng mốc sau 1 FAIL), hay (c) coi khung (c) vẫn chưa
khép vì đệm hiện tại chưa chịu được 1 lần FAIL (1 FAIL nữa → 26/33 =
78,8%)? F1 không chọn thay user — chỉ đưa số.

**Q6 (lặp lại từ D8/E1) — Các lần đo trước A9 có còn tính không?**
Khung (g) cho thấy kỷ nguyên hậu-A9 là 14/14 PASS dưới M2, trong khi
toàn bộ lần FAIL chặn khung (a) đều trước A9. User có muốn đặt "tuổi
thọ" cho bằng chứng (vd chỉ tính các lần từ đợt 99 trở đi), hay giữ
toàn bộ lịch sử? Nếu đặt tuổi thọ thì khung (a) cố định cũng đổi
thành phần — cần user định nghĩa lại khung cố định trên kỷ nguyên mới
(vd 20 lần yên đầu KỂ TỪ A7) thay vì F1 tự định nghĩa.

## 8. Cách chạy lại

```bash
# 1 lan E1 30fps bang harness C8 + land D7 (doi E1_SCRATCH moi lan; DO E1 TRUOC,
# ngay dau luot de bat cua so yen; dot 104 cua so yen mo muon, sau reboot #29 —
# co the can toi 9 lan thu moi du 2 lan yen):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f1/e1-runX \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# 1 lan N10 60fps (probe C8 + land D7: ca hai chieu cho-trang-thai):
N10_LABEL=60fps-deint-runX N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f1/60fps-deint-runX \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Gop pool v14 + chan yen M2 + khung (a)-(i) (doc report JSON da co, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f1/analyze-pool104f1.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f1/analyze-m2-quiet104f1.py
# Test hoi quy luat median + M2 + luat phan loai slot-tai-dau (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs   # 17/17
node --test apps/web/scripts/deint-fps-verdict-100b7.test.mjs  # 13/13
```

## 9. File đã đổi/thêm (stage, không push)

- `docs/PHASE9_ROUND104_F1_G1_LIMITS.md` (file này).
- `benchmarks/results/g1-evidence-v14-104f1.json` (mới — pool v14:
  30fps n=109, 60fps n=69; kèm f1_e1/f1_60 với G5+M2 từng lần).
- Log + dữ liệu thô: `hidden_files/round104-f1/` (run-f1.sh,
  run-f1-resume.sh, runs.log, driver-out.log, driver-resume-out.log,
  e1-run1..9 + log, e1-run5-killed-reboot29/ + log (lần bị reboot giết),
  60fps-deint-run1..5 + log, analyze-pool104f1.py,
  analyze-m2-quiet104f1.py, pool104f1-analysis.json,
  m2-quiet104f1.json, pool104f1-analysis.log, m2-quiet104f1.log).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round104-f1-g1.txt`.
