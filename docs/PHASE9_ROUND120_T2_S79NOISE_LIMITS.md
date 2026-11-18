# PHASE9_ROUND120_T2_S79NOISE_LIMITS.md — Điều tra nguồn nhiễu điểm gãy s79: load1 KHÔNG đo tải thật trong cell này; giả thuyết throttle BỊ BÁC; trục đo load1 VÔ HIỆU; GIỮ vững 19,63 nhưng kèm caveat trục gãy

**Ngày:** 16/11/2026. **Luồng:** T2 (Phase 9 đợt 120, lượt cron
12:35 +07). **Chủ đề:** Điều tra NGUỒN NHIỄU điểm gãy s79 (quyết
parent đợt 119 §12 mục 3: TẠM DỪNG lặp s79 đơn lẻ; xem
docs/PHASE9_ROUND119_T3_LOADBREAK_LIMITS.md toàn bộ, đặc biệt §2,
§5, §10 mục 1/10/13/14).
**Bối cảnh:** s79r3 GIỮ 80,1% @24,80 vs s79r4 TRUNG GIAN 56,9%
@27,35 — cùng cấu hình, cùng cây H3f, chênh 23,2 điểm (nhiễu lớn
nhất từ trước); pattern "quý tải cao → %±1 tốt" bị phá vỡ 0/2;
bar (b) kẹt 0/12. Nhiệm vụ: ĐIỀU TRA TRƯỚC, không chạy thêm s79 lẻ;
chỉ chạy s79 mới nếu điều tra cần dữ liệu mới, và nếu chạy thì
theo LÔ ≥3 lấy trung vị. **Kết luận điều tra: KHÔNG chạy s79 mới
đợt này** — vì dữ liệu cũ + một thí nghiệm trực tiếp rẻ đã trả lời
câu hỏi, và câu trả lời làm vô hiệu chính trục đo của s79 (xem
§0/§7). GIỮ vững 19,63 không đổi.
**Cây:** preview.tsx md5 `5be5a250a552357c50cc189de9a9c08a` trước =
sau (kiểm 05:41Z + 06:00Z); media.ts `2c384ed1`. Không sửa
production. Không push, không release/tag. Không probe WebKit
(GST 0 plugin, boot #60 chờ replay — T7 owns). Không dùng lock
v2 (không chạy vite/browser).

**Kết quả lớn nhất — đọc trước mọi con số:**
- **(a) load1 TRONG CELL NÀY KHÔNG ĐO TẢI.** Thí nghiệm trực tiếp
  (§1, boot #60, 05:51–05:53Z): 6 hog nice-19 chạy 75 s, đốt
  **1,41 CPU thật** (utime), 6/6 hog sống suốt, 7–11 thread
  runnable — nhưng **load1 RƠI 0,45 → 0,30** (kỳ vọng ~4,3 nếu
  load1 theo dõi tải). Trong khi đó PSI cpu.some avg10 vọt
  **1% → 83,5%** (nghẽn CPU thật) và /proc/stat cho thấy **2,36
  CPU nhàn rỗi** trong lúc hogs bị chặn ở ~1,4 CPU. Ba thước đo
  cùng lúc, cùng máy: load1 nói "nhàn", PSI nói "nghẽn 87%",
  utime nói "1,41 CPU đang cháy". load1 sai.
- **(b) Tách rời load1 ↔ threadsR đã có trong MỌI lượt dài cũ
  (9/9 lượt, §2):** tương quan load1–threadsR theo mẫu là
  −0,18…+0,19 (≈0); **~27% mẫu trong lúc phát (289/1079) có
  load1 <5 trong khi ≥30 task đang runnable**; load1 suy giảm
  đúng hàm mũ exp(−t/60) (tỉ lệ ~0,92/mẫu 5 s) xuống 0,24 trong
  khi threadsR giữ ~60 — tức đầu vào của calc_load ≈ 0 trong
  nhiều phút dù hàng đợi chạy đầy. Đây không phải nhiễu đo: đây
  là trục đo gãy.
- **(c) load1 là SÓNG ~8,5 phút, biên độ ≈ số hog (§5):**
  peak-to-peak 7,8–8,9 phút ở 8/8 lượt có peak đo được, qua 3
  boot/ngày, 2 cây; 56 hog → đỉnh ~52–62, 24 hog → đỉnh ~25–30.
  Phân bố hai đỉnh của load1 (29% mẫu <5, 34% mẫu ≥40) là phân
  bố arcsine của một sóng sin — không phải hai chế độ tải thật.
  Dial "ĐẠT" chỉ là lúc sóng dâng vào [25,40]; dial "sụp" chỉ là
  lúc sóng xuống đáy.
- **(d) Giả thuyết throttle ("load1 thấp = main thread đói")
  BỊ BÁC theo cả hai chiều (§3):** (i) trong lượt, quý load1
  thấp nhất cho %±1 TỐT NHẤT (s79r3 Q2: 3,94 → 83,2%); gộp 9
  lượt, tỉ lệ mẫu trough (load1<5) tương quan DƯƠNG với %±1
  (Spearman +0,40), tỉ lệ peak tương quan ÂM (−0,42) — ngược
  hướng giả thuyết; (ii) thí nghiệm trực tiếp: load1 0,30 đi
  cùng nghẽn CPU tối đa (PSI 87%), tức load1 thấp KHÔNG có
  nghĩa là ít tranh chấp — nó đi cùng tranh chấp cao nhất.
- **(e) Chênh 23,2 điểm s79r3/s79r4 KHÔNG giải thích được bằng
  bất kỳ biến nào đã đo (§4):** hai lượt giống nhau ở mọi biến
  tải đo được (load1 mean 24,80 vs 27,35; trough 0,293 vs 0,257;
  peak 0,343 vs 0,361; threadsR 61,3 vs 62,6; cùng 56 hog, cùng
  cây H3f). Chỉ khác: tickRate 2,04 vs 1,50/s, trung vị offset 0
  vs +1, freeMB min 248 vs 113 MB, tuổi boot 38 vs 10 phút.
  Gộp 9 lượt: **chỉ tickRate tương quan mạnh với %±1
  (Spearman +0,90)** — nhưng tickRate là TRIỆU CHỨNG đi cùng
  (main thread đói → tick chậm VÀ offset lớn), không phải nguyên
  nhân; tuổi boot Spearman −0,07 (KHÔNG liên quan — bác giả
  thuyết "chạy sớm sau reboot" như quy luật chung: s78b tuổi
  boot 5 phút vẫn 80,9%, s77c 15 phút vẫn 88,7%).
- **(f) Hệ quả (§7): trục đo load1 (sampled mean) VÔ HIỆU cho
  chương trình loadbreak.** Mọi phân loại GIỮ/TRUNG GIAN/GÃY
  theo load1 mean, biên 19,63, và "nhiễu 23,2 điểm ở cùng tải"
  đều đo bằng thước gãy: hai lượt s79r3/r4 thực ra Ở CÙNG TẢI
  THẬT theo threadsR (~61 runnable cả hai) — chênh lệch là
  phương sai do yếu tố tiềm ẩn phía host (trạng thái ngân sách
  CPU của cell — không quan sát được từ trong VM), không phải
  "nhiễu ở cùng tải". **GIỮ vững 19,63** (không dời), nhưng từ
  nay phải hiểu nó là "điều kiện của lượt s77c", không phải một
  mức tải. Cần parent quyết trục đo mới trước khi chạy thêm s79
  (đề xuất §7).

---

## §0. Phương pháp + vì sao KHÔNG chạy s79 mới đợt này

- **Đọc trước khi đo:** T3-119 LIMITS toàn bộ (§2 bảng liều–đáp
  ứng 8 lượt, §5 tải hai đỉnh + dial sụp, §10 mục 1/10/13/14);
  prereg-t3 đợt 119; driver119t3.sh (hàm hog: `nice -n 19 node
  -e "while (true) { Math.sqrt(Math.random()); }"`); analyzer
  119t3 (threadsR = số runnable từ /proc/loadavg trường 4).
- **Phân tích lại từ dữ liệu thô (§2/§4/§5):** 6 lượt dài
  T3-117/118/119 (s79, s80b, s79r1, s79r2, s79r3, s79r4) +
  mở rộng sang 3 lượt R3/S3 (s77, s77c, s78b) — tổng **9 lượt**,
  tính lại trực tiếp từ `frame-parity-results.json`
  (blendTick + loadSamples) và `hog-load-*-attempt1.txt`
  (sampler 5 s của driver: load1/load5/load15/threadsR/freeMB/
  hogs). Script: `hidden_files/round120-t2/joint-analysis.py`
  → `joint-analysis.json/.txt`; bảng 9 lượt:
  `hidden_files/round120-t2/nine-run-table.json`.
- **Thí nghiệm trực tiếp (§1):** 6 hog cùng lệnh driver, 75 s,
  lấy mẫu 2 s (loadavg, Rthreads, hog utime từng PID,
  /proc/stat, PSI, cgroup cpu.stat), 30 s baseline trước + 30 s
  hồi phục sau, kill sạch, 0 node sót. Chọn 6 hog (không phải
  56) để nhiễu loạn tối thiểu cho các luồng sibling (T1 đang
  chờ cờ T7, không đo; T8 chỉ giữ lock 3 s; không luồng nào
  đang dial/phát lúc 05:51Z) mà vẫn đủ phân biệt: nếu load1
  theo dõi tải, 6 hog phải đẩy load1 → ~4,3 sau 75 s.
- **Vì sao không chạy lô s79 ≥3:** (i) điều tra đã có đáp án
  từ dữ liệu cũ + thí nghiệm rẻ — đáp án là trục đo gãy, nên
  thêm s79 trên cùng trục không thêm thông tin; (ii) lô ≥3 cần
  ~105 phút đo + phân tích, không vừa hạn cứng 08:00Z từ lúc
  bắt đầu điều tra (~05:45Z); (iii) quyết parent chỉ cho chạy
  s79 mới "nếu điều tra cần dữ liệu mới" — điều tra không cần.
  Ghi rõ để đợt sau không hiểu lầm là "T2 lười chạy".
- **Caveat:** mọi kết luận về load1 là kết luận về CELL NÀY
  (VM Secure, 4 vCPU nhìn thấy, chia sẻ 1,5 CPU theo
  sharedCpuMillis, uptime boot #60). Không suy ra kernel Linux
  nói chung. Cơ chế bên trong kernel/host gây ra tách rời
  load1↔runnable CHƯA xác định được từ trong VM (xem §6) — chỉ
  khẳng định bằng chứng thực nghiệm, không khẳng định cơ chế.

## §1. Thí nghiệm hog-response (quyết định): 6 hog đốt 1,41 CPU trong khi load1 RƠI xuống 0,30

**Thời gian:** 05:51:00–05:53:24Z 16/11/2026, boot #60
`0260101b-acd3-43f4-91d2-670c1960fb7d` (uptime 1:05 lúc bắt đầu).
**Lệnh hog:** y hệt driver T3 (`nice -n 19 node -e "while (true)
{ Math.sqrt(Math.random()); }"`). **Log thô:**
`hidden_files/round120-t2/hog-response-exp.log`
(script `hog-response-exp.sh`).

| pha | n mẫu | load1 mean [min, max] | load5 mean | threadsR mean | Rthreads mean | PSI cpu some avg10 (cuối pha) |
|---|---|---|---|---|---|---|
| BASE 30 s (0 hog) | 15 | 0,59 [0,49, 0,66] | 1,56 | 1,6 | 1,0 | 1,1% |
| BURST 75 s (6 hog) | 38 | **0,43 [0,30, 0,52]** | 1,34 | 9,2 | 8,3 | **83,5%** |
| RECOV 30 s (0 hog) | 15 | 0,59 [0,30, 0,84] | 1,22 | 2,4 | 1,3 | 6,7% |

- **Hog có chạy thật không? CÓ.** hogUtimeTicks (utime+stime
  cộng 6 PID, USER_HZ=100): 151 → 10618 trong ~74 s =
  **141,4 tick/s = 1,41 CPU**. /proc/stat cột nice: 1566 →
  12287 = **144,9 tick/s**. Hai nguồn độc lập khớp nhau.
  hogsAlive = 6/6 mọi mẫu burst; 0 node sót sau kill.
- **load1 đi NGƯỢC kỳ vọng.** Nếu load1 theo dõi số runnable,
  sau 75 s với 6 hog + baseline ~1, EMA 1 phút phải đạt
  ~6×(1−e^(−75/60)) ≈ **4,3**. Thực tế load1 **giảm** 0,45 →
  0,30 trong burst, và load5/load15 cũng giảm (1,47→1,20 /
  1,24→1,16). Không phải "chưa kịp lên": 75 s > 1 hằng số
  thời gian của EMA 1 phút; load1 đã ổn định ở ~0,3–0,5.
- **PSI thấy nghẽn, load1 thấy nhàn.** PSI cpu.some avg10:
  0,86% → **83,5%** cuối burst (task chờ CPU 83,5% thời gian),
  rồi rơi về 6,7% sau khi kill hog. Cùng lúc đó load1 = 0,30.
  PSI và load1 mô tả hai thực tại trái ngược về cùng một máy,
  cùng một phút — một trong hai sai về "tải"; utime (1,41 CPU
  đang cháy) đứng về phía PSI.
- **Hog bị chặn ở ~1,4 CPU dù còn 2,36 CPU nhàn.** /proc/stat
  trong burst: idle tăng 236,4 tick/s (≈2,36 CPU nhàn), user+
  system ~37 tick/s, nice ~145 tick/s, **steal chỉ ~4 tick/s**
  (2533→2845). Tổng tick ~407/s (≈4 CPU×100 Hz, đủ nhịp).
  Tức guest kernel vẫn tick đủ 4 vCPU, còn 2,36 CPU nhàn, vậy
  mà 6 hog runnable chỉ được ~1,4 CPU. Mức chặn ≈1,5 CPU khớp
  `sharedCpuMillis=1500` của cell. Không phải affinity (taskset
  0–3, Cpus_allowed_list 0–3), không phải cpuset (không có file
  cpuset.cpus.effective), không phải OOM (hog sống đủ 6/6).
- **Kết luận §1 (chứng minh trực tiếp, không suy luận):**
  trong cell này, **load1 không phản ánh số task runnable,
  không phản ánh CPU đang cháy, không phản ánh nghẽn** — cả ba
  đều tăng/vẫn cao trong khi load1 giảm. Bất kỳ phân loại nào
  dùng load1 làm trục đều đứng trên thước gãy.

## §2. Phân tích lại 9 lượt dài: load1 tách rời threadsR trong MỌI lượt

**Bảng gộp 9 lượt** (tính lại từ results.json thô; boot_age =
tuổi boot lúc envBefore ≈ lúc bắt đầu phát; trough = tỉ lệ mẫu
loadSamples có load1<5; peak = tỉ lệ ≥40):

| lượt | cây | hogs* | boot_age | load1 mean | threadsR mean | %±1 | med off | tickRate | trough | peak | freeMB min |
|---|---|---|---|---|---|---|---|---|---|---|---|
| s77 | 03bf029f | 40 | 18' | 25,10 | 50,0 | 80,1% | 0 | 2,17 | 0,231 | 0,308 | 332 |
| s77c | 03bf029f | 40 | 15' | 19,63 | 45,0 | 88,7% | 0 | 3,37 | 0,306 | 0,082 | 165 |
| s78b | 03bf029f | 56 | 5' | 21,07 | 62,9 | 80,9% | 0 | 2,19 | 0,339 | 0,267 | 212 |
| s79 | 03bf029f | 56 | 50' | 26,98 | 62,9 | 79,7% | 0 | 1,98 | 0,257 | 0,369 | 255 |
| s80b | 03bf029f | 64→24 | 23' | 12,03 | 30,9 | 64,4% | +1 | 1,96 | 0,354 | 0,000 | 252 |
| s79r1 | 03bf029f | 48→24 | 56' | 13,22 | 33,6 | 83,5% | 0 | 2,14 | 0,391 | 0,000 | 389 |
| s79r2 | 03bf029f | 56 | 83' | 27,75 | 63,2 | 79,0% | 0 | 1,91 | 0,280 | 0,374 | 364 |
| s79r3 | 5be5a250 | 56 | 38' | 24,80 | 61,3 | 80,1% | 0 | 2,04 | 0,293 | 0,343 | 248 |
| s79r4 | 5be5a250 | 56 | 10' | 27,35 | 62,6 | 56,9% | +1 | 1,50 | 0,257 | 0,361 | 113 |

\* hogs = max trong hog-load (số hog lúc phát có thể thấp hơn
do luật dial giảm hog khi load1 vượt trần; s80b/s79r1 chỉ còn
24 lúc phát — xem T3-117/118).

- **Tương quan load1–threadsR theo mẫu ≈ 0 trong mọi lượt:**
  s79 −0,045; s80b +0,187; s79r1 −0,179; s79r2 +0,082; s79r3
  +0,177; s79r4 −0,005. (Pearson trên ~180 mẫu/lượt; |r|<0,2
  = không liên hệ.)
- **Mẫu "load1 thấp + runnable cao" chiếm ~27% thời gian
  phát:** load1<5 mà threadsR≥30: s79 46/179, s80b 33/175,
  s79r1 63/179, s79r2 50/182, s79r3 51/181, s79r4 46/183 —
  tổng 289/1079. Ngược lại "load1 cao + runnable thấp":
  **0–1 mẫu/lượt** (chỉ s79r4 có 1). Tức load1 thấp KHÔNG bao
  giờ có nghĩa là ít task runnable; load1 cao thì luôn đi cùng
  runnable cao. Quan hệ một chiều này chính là dấu hiệu của
  sóng (§5): load1 chỉ "đúng" ở đỉnh sóng, sai ở đáy sóng.
- **threadsR gần như HẰNG SỐ trong lượt, load1 dao động
  ~100 lần:** s79r3: threadsR mean 61,3, min 5 / max 72 theo
  mẫu (phần lớn 58–70), trong khi load1 mean 24,80, dao động
  0,44–59,34. s79r4: threadsR 62,6 (59–70), load1 0,41–62,53.
  Tải runnable thật là HẰNG SỐ ≈ số hog + browser; load1 là
  thứ dao động.
- **Dial "sụp" là đáy sóng, không phải hog chết:** dãy thô
  s79r2 12:04:49–12:06:52Z: load1 rơi đơn điệu 1,70 → 0,24
  (24 mẫu, tỉ lệ ~0,92/mẫu 5 s = đúng suy giảm EMA 1 phút với
  đầu vào 0), load5 10,58 → 7,09, load15 10,76 → 9,45,
  trong khi **threadsR 58–77 và hogsS3=56 không đổi**.
  Rồi trong 60 s load1 nhảy 0,24 → 5,19 → 9,74 → 14,16 →
  21,90 → 26,15 → 29,74 → 32,57 → 35,64 → 38,56 → 40,83 →
  42,61 (bước ~+5/mẫu = tốc độ tối đa của EMA khi đầu vào
  bước từ 0 lên ~60). Đầu vào của calc_load đã bước từ ~0 lên
  ~60 trong MỘT mẫu 5 s, trong khi threadsR không đổi suốt.
  Cùng mẫu này lặp lại ở mọi lượt dial (đáy 0,41–0,68, ĐẠT ở
  283–387 s).
- **Trong lượt, %±1 theo quý KHÔNG đi theo quý tải (§5
  T3-119 đã ghi, nay củng cố gộp 6 lượt):** %±1 dao động chỉ
  ±3 điểm giữa các quý trong cùng một lượt (s79r4: 53,1–59,4%;
  s79r3: 77,9–83,2%) trong khi quý tải nhảy 4 ↔ 52. Yếu tố
  quyết định %±1 là MỨC của lượt (level shift), không phải
  pha sóng trong lượt.

## §3. Giả thuyết throttle ("load1 thấp = main thread đói") — BỊ BÁC

Giả thuyết gốc (T3-119 §5/§10 mục 10): hog bị throttle (bóp
CPU) → load1 thấp → main thread đói → offset tệ. Nó dự báo:
(a) quý load1 thấp → %±1 tệ; (b) lượt load1 thấp → %±1 tệ;
(c) load1 thấp đi cùng nghẽn thật.

- **(a) BÁC trong lượt:** s79r3 quý tải thấp nhất Q2 (3,94)
  có %±1 TỐT NHẤT (83,2%); s79r4 quý tải cao nhất Q3 (52,55)
  có %±1 TỆ NHẤT (53,1%). Gộp 5 lượt dài gần nhất: 3 lượt đầu
  ủng hộ, 2 lượt đợt 119 ngược hẳn (T3-119 §5 đã ghi).
- **(b) BÁC giữa các lượt:** Spearman 9 lượt: trough–%±1
  **+0,40** (nhiều thời gian trough → %±1 TỐT hơn), peak–%±1
  **−0,42** (nhiều thời gian peak → %±1 TỆ hơn) — ngược hướng
  giả thuyết. load1 mean–%±1: −0,48 (tải cao → tệ hơn, ngược
  hướng "tải cao = chưa bị bóp = tốt"). (n=9, ngưỡng ý nghĩa
  ~0,68 — các hệ số này CHƯA đạt ý nghĩa thống kê; chỉ dùng
  để bác hướng dự báo, không dùng để khẳng định hướng ngược.)
- **(c) BÁC trực tiếp:** thí nghiệm §1 — load1 0,30 đi cùng
  PSI nghẽn 83,5% và hog đốt 1,41 CPU. "Load1 thấp" đo được
  trong lúc nghẽn cao nhất. Giả thuyết dùng load1 làm chỉ báo
  đói là sai thước, không chỉ sai hướng.
- **Phần nào của trực giác throttle còn đứng?** Trực giác "hog
  tranh CPU với main thread" vẫn đúng về mặt vật lý (hog đốt
  1,41 CPU trong cell chỉ có ~1,5 CPU; PSI 87% chứng minh
  tranh chấp thật). Cái SAI là dùng **load1** để đo mức tranh
  chấp đó. Throttle (nếu có) phải đo bằng PSI / utime /
  threadsR, không phải load1. Xem §7.

## §4. Chênh 23,2 điểm s79r3/s79r4: không biến đo được nào tách được; yếu tố tiềm ẩn phía host

**So sánh trực tiếp hai lượt (cùng cây H3f, cùng 56 hog):**

| biến | s79r3 (80,1%) | s79r4 (56,9%) | chênh | tách được? |
|---|---|---|---|---|
| load1 mean / median | 24,80 / 17,51 | 27,35 / 19,89 | +2,55 / +2,38 | không (cùng dải) |
| trough / peak | 0,293 / 0,343 | 0,257 / 0,361 | ~0,03 | không |
| threadsR mean | 61,3 | 62,6 | +1,3 | không |
| n tick | 1832 | 1350 | −482 | là hệ quả, không phải nguyên nhân |
| tickRate | 2,04/s | 1,50/s | −0,54/s | **có — nhưng là triệu chứng** |
| trung vị offset | 0 | +1 (cả 4 quý) | +1 hệ thống | **có — nhưng là triệu chứng** |
| freeMB min lúc phát | 248 | 113 | −135 MB | yếu (xem dưới) |
| tuổi boot lúc phát | 38' | 10' | −28' | yếu (xem dưới) |
| load1 lúc bắt đầu phát | 45,81 | 53,33 | +7,5 | không (mẫu đơn, đã biết gây hiểu lầm) |

- **Spearman gộp 9 lượt vs %±1:** tickRate **+0,90** (duy
  nhất vượt ngưỡng ý nghĩa ~0,68 với n=9); load1 −0,48;
  peak −0,42; trough +0,40; threadsR −0,27; **tuổi boot
  −0,07; freeMB min +0,07** (không liên quan).
- **"Chạy sớm sau reboot" BÁC như quy luật chung.** Trong 6
  lượt T3 nó trông đơn điệu (tuổi boot 11'→56,9%;
  23'→64,4%; 38'→80,1%; 50'→79,7%; 56'→83,5%; 83'→79,0%),
  nhưng thêm s77 (18'→80,1%), s77c (15'→88,7%), s78b
  (5'→80,9%) thì quan hệ biến mất (Spearman −0,07). s78b mới
  5 phút sau boot vẫn GIỮ 80,9%; s77c 15 phút đạt 88,7% cao
  nhất. Đề xuất cũ "không chạy trong 30 phút đầu sau reboot"
  (T3-119 §10 mục 1) **KHÔNG còn được dữ liệu ủng hộ** — bỏ,
  hoặc chỉ giữ như một biến ghi chép, không phải luật.
  Tương tự freeMB min: s77c chỉ 165 MB vẫn 88,7%; s79r4
  113 MB đi cùng 56,9% nhưng s80b 252 MB chỉ 64,4%.
- **tickRate +0,90 — đọc đúng:** tickRate và %±1 cùng là
  đầu ra của main thread: khi main thread bị đói (vì lý do
  gì đó ngoài VM), tick chậm lại VÀ presented trễ hơn
  expected (offset +1 hệ thống). tickRate là **đồng hồ đo đói
  tốt nhất hiện có**, nhưng nó không cho biết TẠI SAO đói.
  Không dùng tickRate làm trục tải (nó là kết quả, không phải
  đầu vào), và không dùng nó để phân loại lượt (phân loại vẫn
  theo offset như prereg — chỉ ghi nhận tương quan).
- **Kết luận §4:** chênh 23,2 điểm là **phương sai mức-lượt
  (run-level) do yếu tố tiềm ẩn không đo được từ trong VM** —
  ứng viên mạnh nhất: **trạng thái ngân sách CPU phía host
  của cell** (token bucket ~1,5 CPU, chu kỳ ~8,5 phút — xem
  §5; s79r4 phát đúng lúc bucket cạn sau cơn bão post-boot,
  s79r3 phát lúc bucket đã hồi). Ứng viên này giải thích được
  cả tickRate thấp + median +1 + freeMB thấp của s79r4 (cùng
  là hệ quả của "máy đang kiệt sau reboot"), nhưng **không
  chứng minh được từ trong VM** (không thấy host). Ghi là giả
  thuyết mạnh nhất, chưa chứng minh — không phải kết luận.

## §5. Sóng load1 ~8,5 phút: chu kỳ của cell, không phải của phép đo

- **Chu kỳ peak-to-peak (từ hog-load 5 s, peak >30, cách nhau
  >120 s):** s77 8,3 / 8,9; s77c 7,8; s78b 8,0 / 8,5; s79 8,5;
  s79r1 8,7; s79r2 8,4 / 7,8; s79r3 8,3; s79r4 8,5 phút.
  s80b không có peak >30 (24 hog, đỉnh ~25–30 — ngưỡng 30 quá
  cao cho nó). **8/8 lượt đo được peak đều cho 7,8–8,9 phút**
  — ổn định qua 3 boot, 2 ngày, 2 cây, 3 mức hog.
- **Biên độ ≈ số hog:** 56 hog → đỉnh 52–62; 48 hog (s79r1
  lúc dial) → ~42; 40 hog (s77/s77c) → ~40; 24 hog → ~25–30.
  Đáy ~0,3–2 bất kể số hog. Chu kỳ không đổi theo số hog →
  chu kỳ là thuộc tính của **cơ chế cấp CPU phía host** (cửa
  sổ ngân sách cố định), không phải của hog.
- **Phân bố hai đỉnh = arcsine của sóng sin:** sóng sin dành
  phần lớn thời gian gần đỉnh/đáy, ít ở giữa — đúng phân bố
  loadSamples quan sát được (29% <5, 34% ≥40, chỉ 4% ở
  [20,25)). "Tải hai chế độ" (T3-117/118/119 §5) không phải
  hai chế độ tải thật: đó là MỘT sóng, lấy mẫu ở hai đầu.
- **Dial ĐẠT = sóng dâng vào dải:** mọi lượt dial đều sụp
  0,41–0,68 rồi nhảy vọt lên [25,40] ở 283–387 s. Thời gian
  ĐẠT (333/355/374 s đợt 119) chỉ là pha sóng lúc bắt đầu
  dial + thời gian sóng leo từ đáy lên — không phải "hog cần
  300 s để ngấm". Luật dial 600 s + hog ≥90 s vẫn ĐẠT 10/10
  vì cửa sổ 600 s đủ dài để sóng dâng qua dải bất kể pha bắt
  đầu — luật đứng về mặt vận hành, nhưng "ĐẠT" không có nghĩa
  là "đã khóa được tải" (T3-119 §10 mục 8 vẫn đứng: sampled
  mean lúc phát vẫn trôi khỏi dải dial 4–8 điểm).
- **Giả thuyết host token-bucket (CHƯA CHỨNG MINH, ghi để
  kiểm chứng sau):** cell được cấp ~1,5 CPU trung bình với
  cửa sổ nhiều phút; hog đốt vượt mức → bucket cạn → cell bị
  bóp gần 0 trong ~4–5 phút → bucket hồi → chạy lại ~3 phút.
  Phù hợp: chu kỳ ~8,5 phút ổn định; biên độ ∝ hog; hog bị
  chặn ~1,4 CPU dù vCPU nhàn (thí nghiệm §1). Không phù hợp
  / chưa giải thích: steal time rất nhỏ (~4 tick/s trong
  burst — nếu host deschedule vCPU thì steal phải lớn);
  load1 suy giảm mượt trong lúc guest kernel vẫn tick đủ
  (cơ chế kernel của tách rời load1↔runnable chưa rõ).
  Kiểm chứng được đề xuất: chạy hog ở 3 mức (6/24/56) mỗi
  mức 20 phút, xem chu kỳ có độc lập với mức hog không và
  biên độ có tỉ lệ với mức hog không — nếu chu kỳ không đổi
  thì cửa sổ host là cố định. (Không chạy đợt này: cần ~60
  phút + làm nhiễu sibling; để đợt sau quyết.)

## §6. cgroup: không đo được throttle từ trong VM; PSI là đường thay thế

- **/sys/fs/cgroup (cgroup v2, root, `0::/`):** có `cpu.stat`
  (chỉ `usage_usec/user_usec/system_usec/nice_usec/
  core_sched.force_idle_usec`), `cpu.pressure`,
  `memory.pressure`, `io.pressure`. **KHÔNG có** `cpu.max`,
  `memory.max`, `cpuset.cpus.effective`, và `cpu.stat`
  **KHÔNG có** `nr_periods/nr_throttled/throttled_usec`
  (các trường này chỉ xuất hiện khi có giới hạn băng thông
  được cấu hình ở cgroup nhìn thấy được). `nr_descendants=0`
  (không có cgroup con). Kết luận: **giới hạn CPU (nếu có)
  nằm ngoài tầm nhìn của VM** — ở phía host/sandbox, không đo
  được `nr_throttled` từ trong này. Mọi câu "throttle" trước
  đây (T3-117/118/119) đều là suy luận từ load1, không có số
  cgroup nào chống lưng — nay load1 đã gãy nên suy luận đó
  mất nền.
- **PSI (`/proc/pressure/cpu`) ĐO ĐƯỢC và NHẠY:** `some
  avg10` 1,1% (baseline) → 83,5% (6 hog) → 6,7% (sau kill)
  trong thí nghiệm §1; `full avg10` = 0,00 suốt (không có
  task nào bị chặn hoàn toàn — đúng vì hog nice-19 vẫn được
  chạy xen kẽ). PSI là ứng viên trục thay thế tốt nhất hiện
  có (xem §7): nó đo TRỰC TIẾP thời gian task chờ CPU, không
  qua trung gian loadavg.
- **`cpu.stat usage_usec` ĐO ĐƯỢC:** tốc độ tăng usage trong
  burst ≈ 1,4 CPU (khớp utime hog). Đây là thước đo "CPU
  thật đã tiêu" — dùng được để xác nhận hog có chạy không,
  nhưng không đo được nghẽn (nó đo throughput, không đo
  waiting).
- **Các nguồn nhiễu khác đã kiểm và LOẠI (§5 T3-119 + kiểm
  lại):** reboot cắt lượt (s79r4 attempt 1 — đã chạy lại, lượt
  hợp lệ không bị cắt); hog chưa tắt (hog-count=0 cuối đợt,
  0 node sót sau thí nghiệm); lock chờ (0 TIMEOUT đợt 119);
  ENOSPC (0 lần); RAM: freeMB min 113 MB ở s79r4 là thấp nhất
  nhưng không OOM, và gộp 9 lượt freeMB không tương quan với
  %±1 (Spearman +0,07). Không nguồn nào trong số này giải
  thích được chênh 23,2 điểm.

## §7. Hệ quả cho chương trình loadbreak + đề xuất thiết kế đo tiếp theo (cần parent quyết)

1. **Trục đo load1 (sampled mean) VÔ HIỆU — DỪNG dùng làm
   trục phân loại.** Mọi số "GIỮ @X / TRUNG GIAN @Y" theo
   load1 mean từ M7→T3-119 đều đo bằng thước gãy. Không xóa
   lịch sử (số %±1, tickRate, offset vẫn là dữ liệu thật),
   nhưng **không dùng load1 mean để đóng khoảng điểm gãy,
   không so sánh "cùng tải" giữa các lượt bằng load1 nữa.**
2. **GIỮ vững 19,63 — KHÔNG dời, KHÔNG diễn giải lại thành
   mức tải.** 19,63 từ nay là nhãn của "điều kiện lượt s77c"
   (56→40 hog, threadsR ~45, tickRate 3,37, PSI không đo).
   Bất kỳ biên mới nào cũng phải đo lại trên trục mới.
3. **Đề xuất trục thay thế (thứ tự ưu tiên, cần parent chọn
   MỘT trước khi chạy s79 tiếp):**
   - **(A) PSI cpu.some avg10/avg60 trong lúc phát** (đo chờ
     CPU trực tiếp; nhạy: 1%→87% với 6 hog; rẻ: đọc
     /proc/pressure/cpu mỗi 5 s). Nhược: PSI cũng là trung
     bình trượt, cần đăng ký cửa sổ (avg10 hay avg60) TRƯỚC.
   - **(B) threadsR (số runnable)** — trung thực, ổn định
     (~60 với 56 hog), nhưng gần như hằng số trong một cấu
     hình hog → dùng để XÁC NHẬN "cùng tải thật" (s79r3/r4
     cùng tải thật!), không dùng để tách các lượt.
   - **(C) tickRate** — chỉ làm chỉ báo đói đi kèm (đã tương
     quan +0,90), KHÔNG làm trục (nó là kết quả).
   - **(D) usage_usec rate** — xác nhận hog chạy thật.
   Đề xuất của T2: trục chính = **PSI some avg60 trong lúc
   phát** (ổn định hơn avg10) + báo kèm threadsR + tickRate +
   usage rate; prereg ghi rõ cửa sổ PSI trước khi đo.
4. **Thiết kế lô s79 tiếp theo (khi parent duyệt trục mới):**
   lô ≥3 lượt lấy trung vị (quyết cũ vẫn đứng); mỗi lượt ghi
   PSI + threadsR + tickRate theo quý; KHÔNG cần tránh 30
   phút đầu sau reboot (không có bằng chứng — §4); ghi tuổi
   boot + freeMB min như biến mô tả, không phải luật.
   Ước tính: 3 lượt × ~35 phút ≈ 105 phút đo + ~30 phút phân
   tích — phải xếp vào một lượt cron dài hoặc chia 2 lượt.
5. **Bar (b) 0/12 và bar (c) không áp dụng:** không bị ảnh
   hưởng bởi kết luận này (bar (b) đếm stall từ playhead,
   không dùng load1; bar (c) đã dừng). Giữ nguyên.
6. **Luật dial 600 s + hog ≥90 s:** giữ làm luật đứng vận hành
   (ĐẠT 10/10), nhưng đổi tên trong đầu: nó là "luật chờ sóng
   dâng", không phải "luật khóa tải".

## §8. Kiểm chứng + những gì KHÔNG làm đợt này

- **Không sửa production:** preview.tsx md5 `5be5a250` trước
  (05:41Z) = sau (06:00Z); media.ts `2c384ed1` trước = sau.
  Không tsc/vite build (không đổi cây; T1 đã verify cây H3f
  tsc 0 + build PASS 7,03 s đợt 119).
- **Không chạy s79 mới** (lý do §0). Không chạy probe WebKit
  (GST 0 plugin — T7 owns). Không dùng lock v2 (không chạy
  vite/browser; lock log cho thấy T8 giữ 3 s lúc 05:48Z, không
  xung đột với thí nghiệm hog — thí nghiệm không cần vite).
- **Thí nghiệm hog-response:** 6 hog, kill sạch, 0 node sót
  (kiểm 05:53Z + 06:00Z); log thô đầy đủ 68 mẫu 2 s
  (15 BASE + 38 BURST + 15 RECOV).
- **Tính lại độc lập:** mọi số §2/§4/§5 tính lại từ results.json
  + hog-load thô bằng script (không tin mù LIMITS cũ); bảng 9
  lượt khớp các số đã công bố ở T3-117/118/119 (§1/§2 từng
  file) trong sai số làm tròn (s79r3 80,13% vs 80,1%; s79r4
  56,89% vs 56,9%; load1 mean khớp 2 chữ số thập phân).
- **Caveat thống kê:** n=9 lượt, Spearman với n=9 có ngưỡng ý
  nghĩa ~0,68 — chỉ tickRate (+0,90) vượt ngưỡng; các hệ số
  khác (±0,4) là gợi ý hướng, không phải kết luận. Tương quan
  load1–threadsR ≈0 thì vững (n≈180 mẫu/lượt × 6 lượt, và
  thí nghiệm trực tiếp độc lập xác nhận).

## §9. File + stage (KHÔNG push)

- **LIMITS này:** `docs/PHASE9_ROUND120_T2_S79NOISE_LIMITS.md`
  (file duy nhất thêm/sửa trong repo-1 đợt này).
- **Dữ liệu thô + script (ngoài repo, trong hidden_files):**
  `hidden_files/round120-t2/joint-analysis.py`,
  `joint-analysis.json`, `joint-analysis.txt` (6 lượt T3),
  `nine-run-table.json` (bảng 9 lượt + Spearman),
  `hog-response-exp.sh`, `hog-response-exp.log` (68 mẫu thí
  nghiệm trực tiếp).
- **Stage:** `~/workspace/repo-1-push/paths-loop/
  phase9-round120-t2-s79noise.txt` (NUL-delimited, 1 file:
  LIMITS trên) — đã verify read-back. KHÔNG push.
- **Cờ:** `hidden_files/round120-t2.done` (tạo sau khi ghi
  LIMITS + stage xong). Log lượt: append
  `hidden_files/build-loop-log.md`.

## §10. Nợ còn lại

1. **Điểm gãy: VẪN MỞ, và nay thêm caveat trục gãy.** GIỮ
   vững 19,63 (nhãn lượt s77c, không phải mức tải). Cần parent
   quyết trục mới (§7 mục 3) trước khi chạy thêm s79. Không
   tự mở lại bar (c), không tự đổi luật dial.
2. **Cơ chế tách rời load1↔runnable CHƯA rõ (§6).** Ứng viên:
   /proc/loadavg được sandbox tổng hợp từ metric phía host;
   hoặc quirk kế toán loadavg của kernel cell. Kiểm chứng cần
   dữ liệu phía host (không có từ trong VM) hoặc thí nghiệm
   chu kỳ hog 3 mức (§5 cuối). Ghi là nợ mở, không đoán thêm.
3. **Giả thuyết host token-bucket ~8,5 phút / 1,5 CPU (§5):
   CHƯA CHỨNG MINH.** Bằng chứng ủng hộ: chu kỳ ổn định 7,8–
   8,9 phút; biên độ ∝ hog; chặn ~1,4 CPU dù vCPU nhàn. Bằng
   chứng ngược/chưa khớp: steal time rất nhỏ trong burst.
   Cần thí nghiệm chu kỳ 3 mức hog để kiểm chứng.
4. **tickRate +0,90 với %±1 (n=9): cần xác nhận trên trục
   mới.** Nếu PSI thành trục chính, kiểm tra lại xem tickRate
   có còn tương quan sau khi tách PSI không (tickRate có thể
   chỉ là proxy của PSI).
5. **s79r4 attempt 1 (bị reboot cắt lúc trích D-state):**
   không dùng cho bar nào (đã loại ở T3-119) — nhưng dữ liệu
   dial + play của nó (load1, threadsR) vẫn khớp mẫu sóng;
   không cần đào lại.
6. **Cờ DIALING sót sau reboot (T3-119 §0/§8):** vẫn là kẽ hở
   mở — đề xuất ghi boot_id vào cờ (chưa ai làm; không thuộc
   phạm vi T2).
7. **Dial ĐẠT không khóa được tải (§5):** nay đã rõ nguyên
   nhân một phần — dial đo sóng, không đo tải. Khi trục mới
   (PSI) được duyệt, luật dial cần viết lại theo PSI (vd: ĐẠT
   khi PSI some avg60 vào dải mục tiêu), không giữ dải load1
   [25,40].
