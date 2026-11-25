# PHASE 9 — ROUND 181 — T2 EPERM LIMITS

**T2 đợt 181** — EPERM probe #99, phân loại (m) #96/#97/#98 **DƯƠNG
(CUỐI)** + INSIDE #96 TRUE (chuỗi 1 → 2) + INSIDE #97 TRUE (chuỗi
2 → 3) + INSIDE #98 FALSE (chuỗi 3 → 0), mù #96?/#88?/#94?/#95?/
#77?, (m) #56 lần 24.
Đợt 181 mở 23:35:51Z 23/11/2026 (03:35:51 +07 24/11; lượt cron
03:35 +07). Boot lúc mở đã là e62eef3f (#98, btime 23:12:23Z) —
**cả 3 reboot #96/#97/#98 đều xảy ra TRONG đợt 180** (sau khi
T10-180 đóng sổ ~23:4xZ), không trong phiên T2-181.
**Số hiệu #98 ĐÃ ĐƯỢC T0-181 XÁC MINH 9 nguồn** (cờ 00:22Z:
boot e62eef3f, btime 23:12:23Z, gap #97→#98 = 576 s; marker sống
qua 50 reboot #49–#98); **#96/#97 T0-181 ĐỐI CHIẾU** (T7-180 xác
minh 9 nguồn từng cái trong phiên) — (m)/INSIDE dưới đây là
**phân loại cuối ở cấp T2 — parent quyết cuối**.
(m) #96/#97/#98: cả ba cửa hẹp đã khép trước khi T2 đọc — đủ dữ
liệu phân loại cuối.

## §0. Headline

- **(m) #96: DƯƠNG — (m) #97: DƯƠNG — (m) #98: DƯƠNG (phân
  loại CUỐI ở cấp T2, parent quyết cuối).** Requeue duy nhất
  mỗi cái, run 180 sống duy nhất: #96 eid 10523 +41,129 s;
  #97 eid 10547 +39,441 s; #98 eid 10550 +37,030 s — đều TRONG
  dải [33; 49,8], KHÔNG sát biên (margin xấu nhất #98: 4,030 s
  tới biên dưới; caveat phân số KHÔNG lật được). **n ứng viên
  38/39 → 39/40 → 40/41 → 41/42** (nếu parent chấp nhận #95
  DƯƠNG đợt 180 rồi #96/#97/#98 DƯƠNG).
- **INSIDE #96: TRUE (FULL142) — chuỗi 1 → 2. INSIDE #97: TRUE
  (FULL143) — chuỗi 2 → 3. INSIDE #98: FALSE (FULL144) — chuỗi
  3 → 0 (ĐỨT tại #98, gap 576 s quá ngắn, sớm 991 s).** Ba lần
  mâu thuẫn ngược hướng liên tiếp (lần thứ 10, 11, 12) — dải
  phương pháp chi phối theo F-165-T2-1.
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 17 không đổi);
  hole-recheck lần 25 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới —
  lần thứ 25 liên tiếp; H-U16 mới 3 hit, 0 mới); U file-gap max
  8.968 s KHÔNG ĐỔI; **6 exec-log bị prune (đã xác nhận GONE)
  — witness #64–#85 về 0**.
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 24 không thu hẹp** (4
  hướng DB MỚI (xxxviii)–(xxxxi): 3 rỗng + 1 dòng maintenance
  đã biết, KHÔNG phải hoạt động run 156; tổng 91 hướng;
  file-based ÂM TÍNH).
- **EPERM probe #99: ok=2 fail=0** (23:54:29Z, boot e62eef3f).
  Sweep #99: 172 *.log, 3 file có marker (11 lần) — TẤT CẢ
  trích dẫn trong log đợt 180, **0 sóng thật**. Sóng EPERM thật
  gần nhất vẫn ~11:55–12:11Z 11/11.
- **Run 180 TIMEOUT** 23:39:30Z (219 s SAU hạn 23:35:51Z;
  claimed→finished 86 s — ca ≥60 s thứ mười NẾU T7-181 đồng ý;
  viết lại ×3 tại #96/#97/#98) — số liệu DB tươi; kết cục
  thuộc T7-181.
- **Tuân thủ luật script nặng đợt 181: 0 chồng chéo** — T2
  CHỜ poller T4 thoát hẳn (attempt1 xong 00:24:06Z, exit 0)
  rồi mới chạy walk mù (00:25:38Z); attempt1-e62eef3f:
  20/20 + B 5/5, median 50,0 ms — LƯỢT YÊN HỢP LỆ #50 (thuộc
  T4-181; chuỗi 43 → 44).

## §1. Điểm (m)

### §1.1 (m) #96 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #96: 21:20:56Z** (epoch 1795468856), boot 8d2a69df,
  gap #95→#96 = 7.834 s. **T7-180 XÁC MINH 9 nguồn trong ~47 s;
  T0-181 ĐỐI CHIẾU** (cờ 00:22Z). Marker sống qua 50 reboot.
- T2-181 xác minh độc lập từ DB tươi (muse.db, đọc ~23:55Z):
  **requeue duy nhất** trong cửa hẹp [21:20:56Z, 21:39:56Z]:
  **eid 10523, run 180 (6ee0f154), event
  `requeued_after_restart`, 21:21:37.129085Z = btime +41,129 s,
  TRONG dải [33; 49,8]** (cách biên dưới 8,129 s, cách biên
  trên 8,671 s — KHÔNG sát biên). Cửa hẹp đã khép hẳn lúc đọc.
  Cửa hẹp còn 2 event khác: dispatched 21:21:37.298Z eid 10524
  + reattached_after_restart 21:21:37.396Z eid 10525 (viết lại
  lần 1 của run 180) — không phải requeue.
- **Đúng 1 run sống tại btime #96** (vcut-build-loop,
  scheduled ≤ btime AND finished > btime, DB tươi): run 180
  (sched 20:35:51Z, finished 23:39:30Z timeout). Không run nào
  khác.
- **Caveat phân số: offset thật ∈ (40,129 s, 41,129 s]** —
  DƯƠNG với mọi δ ∈ [0, 1 s]. Prior δ #90 (+0,32 s) → 40,809 s;
  δ #92 (+0,396 s) → 40,733 s; boot_est #95 (+0,99 s) →
  40,139 s — đều TRONG, đồng thuận.
- **Caveat overlap (KHÔNG lật verdict, tiền lệ #87/#90):**
  sampler cuối #95 21:21:14Z = btime +18 s biểu kiến (F-180-T9-3;
  **T0-181 XÁC NHẬN độc lập: đồng hồ cell nhanh 18–27 s trước
  #96**); watcher-180 poll cuối 95b483a2 21:21:20Z = btime +24 s
  biểu kiến (**mẫu MỚI, F-181-T2-2**). Lấy +24 s theo nghĩa đen
  thì offset ~17 s — NGOÀI dải dưới. Nhưng cơ chế đã được xác
  nhận (đồng hồ nhanh trước reboot) — tiền lệ đứng nói overlap
  là caveat, KHÔNG BAO GIỜ lật verdict btime.
- **Phán: (m) #96 DƯƠNG — parent quyết cuối.**

### §1.2 (m) #97 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #97: 23:02:47Z** (epoch 1795474967), boot 9e440707,
  gap #96→#97 = 6.111 s. **T7-180 XÁC MINH 9 nguồn trong ~42 s;
  T0-181 ĐỐI CHIẾU.**
- T2-181 xác minh độc lập từ DB tươi: **requeue duy nhất
  trong phần cửa hẹp quan sát được [23:02:47Z, 23:12:23Z)**:
  **eid 10547, run 180, 23:03:26.441168Z = btime +39,441 s,
  TRONG dải [33; 49,8]** (cách biên dưới 6,441 s, cách biên
  trên 10,359 s — KHÔNG sát biên). Phần cửa còn 2 event khác:
  dispatched 23:03:26.600Z eid 10548 + reattached 23:03:26.688Z
  eid 10549 (viết lại lần 2).
- **Cửa hẹp #97 BỊ #98 CẮT NGANG ở +576 s** (btime #98
  23:12:23Z): cửa hẹp đầy đủ [23:02:47Z, 23:21:47Z] chứa 2
  requeue — eid 10547 (thuộc #97) + eid 10550 23:13:00.030Z
  (**thuộc #98**, sau btime #98). Phân biệt theo thời gian /
  boot_gen: một requeue `daemon startup recovery` thuộc về
  reboot gần nhất TRƯỚC nó (10547 ở +39,441 s sau #97 và 8m57s
  TRƯỚC #98; 10550 ở +37,030 s sau #98). Events.detail không
  mang boot_gen nên phân biệt bằng thời gian — KHÔNG gộp nhầm.
- **Đúng 1 run sống tại btime #97**: run 180.
- **Caveat phân số: offset thật ∈ (38,441 s, 39,441 s]** —
  KHÔNG lật được. Prior δ #90/#92/#95 → 39,121 / 39,045 /
  38,451 s — đều TRONG.
- **Caveat overlap (KHÔNG lật verdict):** watcher-180 poll cuối
  8d2a69df 23:03:16Z = btime +29 s biểu kiến (**mẫu MỚI,
  F-181-T2-2; T0-181 XÁC NHẬN độc lập là F-181-T0-2: delta
  ≥29 s trước #97**). Lấy theo nghĩa đen thì offset ~10 s —
  NGOÀI dải dưới; tiền lệ cấm lật bằng overlap.
- **Phán: (m) #97 DƯƠNG — parent quyết cuối.**

### §1.3 (m) #98 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #98: 23:12:23Z** (epoch 1795475543), boot e62eef3f,
  gap #97→#98 = 576 s (9m36s — NGẮN BẤT THƯỜNG, lần đầu gap
  <1.000 s trong chuỗi #93–#98). **T0-181 XÁC NHẬN 9 nguồn**
  (cờ 00:22Z; khớp T7-180 từng số). T2-181 kiểm độc lập:
  /proc/uptime 2.595,72 s lúc 23:55:39Z → boot 23:12:23Z;
  `who -b` 23:12; /proc/1 start 23:12:34Z = btime +11 s (cùng
  mẫu +11 s như #95); boot_id e62eef3f còn sống lúc 00:33Z.
- T2-181 xác minh độc lập từ DB tươi: **requeue duy nhất**
  trong cửa hẹp [23:12:23Z, 23:31:23Z]: **eid 10550, run 180,
  23:13:00.030496Z = btime +37,030 s, TRONG dải [33; 49,8]**
  (cách biên dưới 4,030 s, cách biên trên 12,770 s — KHÔNG sát
  biên; margin xấu nhất trong ba cái nhưng vẫn gấp 4 lần δ tối
  đa 1 s). Cửa hẹp đã khép hẳn lúc đọc. Cửa hẹp còn 5 event
  khác: dispatched 23:13:00.128Z eid 10551 + reattached
  23:13:00.185Z eid 10552 (viết lại lần 3) + reconciled
  23:15:34.106Z eid 10553 + DR dispatched/succeeded
  23:15:34.192/.267Z eid 10554/10555 (heartbeat run c98e7d07)
  — không phải requeue.
- **Đúng 1 run sống tại btime #98**: run 180.
- **Caveat phân số: offset thật ∈ (36,030 s, 37,030 s]** —
  KHÔNG lật được (δ = 1 s → 36,030 s, vẫn TRONG 3,030 s).
  Prior δ #90/#92/#95 → 36,710 / 36,634 / 36,040 s — đều TRONG.
- **Overlap: KHÔNG có mẫu overlap nào ghi nhận cho #98 lúc T2
  viết** (T0/T7-181 xác minh; verdict không phụ thuộc vào nó
  — tiền lệ: overlap không bao giờ lật verdict theo cả hai
  hướng).
- Toàn ngày 23/11: 11 `requeued_after_restart` (eid 10252 /
  10282 / 10309 / 10339 / 10369 / 10396 / 10428 / 10490 / 10523
  / 10547 / 10550) — 3 cái cuối là #96/#97/#98; **0 requeue
  trên 24/11** (kiểm lại lúc ~00:33Z — không reboot mới sau
  #98).
- **Phán: (m) #98 DƯƠNG — parent quyết cuối. n ứng viên 38/39
  → 39/40 → 40/41 → 41/42** (nếu chấp nhận #95 DƯƠNG đợt 180
  rồi #96/#97/#98 DƯƠNG). **n chính thức GIỮ 14.**

### §1.4 Run 180 kết cục (số liệu; kết cục thuộc T7-181)

- **status TIMEOUT, finished_at_utc 1795477170.758 =
  23:39:30Z — 219 s SAU hạn 23:35:51Z** (T7-180 đóng cờ lúc run
  vẫn running; run không kịp). **claimed_at_utc 1795477084 =
  23:38:04Z; claimed→finished = 86 s**; wall từ sched gốc =
  11.019 s; started_at_utc 1795475580 (= 23:13:00Z, viết lại
  lần 3 tại #98); boot_gen cuối cron_boot_473f9460... (#98);
  11 event; attempt 1.
- **86 s ≥ 60 s — ca claimed→finished ≥60 s thứ mười NẾU
  T7-181 đồng ý** (số ca GIỮ 9 cho tới lúc đó). Lưu ý T0-181:
  claimed ĐÃ ĐỔI sau khi T7-180 đóng cờ (T7-180 ghi claimed
  KHÔNG đổi 20:36:19Z — đó là claim gốc; các lần viết lại đổi
  claimed_at thành 23:38:04Z). **Phân loại cuối thuộc T7-181
  + parent** — T2 chỉ ghi số liệu DB tươi.
- Ghi nhận thêm (không phải verdict T2): run 181 (sched
  23:35:51Z) jitter +219 s (T0-181), RUNNING lúc T2 đọc; kết
  cục thuộc T7-182.

## §2. INSIDE — dải FULL142 / FULL143 / FULL144

Script: `m-check181.py` (log `m-check181.txt`; exec
`m-check180.py` — FULL141 p10/p90 khớp bằng assert
1579,00/8827,00; FULL140/FULL139 in lại khớp số đợt 180).
Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1).

- **FULL142**: n=142, mean 1h41'54", median 1h54'38", p10
  1587,80 s, p90 8819,10 s, sd 0h55'04", in 90–150'=78,
  <60'=32, >180'=10, >240'=4 (= FULL141 + [gap #96 =
  7.834 s]).
- **INSIDE #96: TRUE (FULL142) — chuỗi 1 → 2.** Dải
  [19:36:49Z, 21:37:21Z] neo 19:10:22Z (#95); btime #96
  21:20:56Z TRONG dải, cách biên dưới 6.247 s, cách biên trên
  985 s. Đối chiếu vs FULL141 (neo #94): FALSE (dải
  [17:43:28Z, 19:44:16Z], trễ 5.800 s) — **hai dải MÂU THUẪN
  ngược hướng (lần thứ 10)**; dải phương pháp chi phối theo
  F-165-T2-1 (F-181-T2-1). (Số hiệu #96 T7-180 xác minh 9
  nguồn; T0-181 đối chiếu.)
- **FULL143**: n=143, mean 1h41'54", median 1h54'16", p10
  1596,60 s, p90 8811,20 s, sd 0h54'52", in 90–150'=79,
  <60'=32, >180'=10, >240'=4 (= FULL142 + [gap #97 =
  6.111 s]).
- **INSIDE #97: TRUE (FULL143) — chuỗi 2 → 3.** Dải
  [21:47:32Z, 23:47:47Z] neo 21:20:56Z (#96); btime #97
  23:02:47Z TRONG dải, cách biên dưới 4.515 s, cách biên trên
  2.700 s. Đối chiếu vs FULL142 (neo #95): FALSE (dải
  [19:36:49Z, 21:37:21Z], trễ 5.126 s) — **hai dải MÂU THUẪN
  ngược hướng (lần thứ 11)**; dải phương pháp chi phối theo
  F-165-T2-1. (Số hiệu #97 T7-180 xác minh 9 nguồn; T0-181
  đối chiếu.)
- **FULL144**: n=144, mean 1h41'16", median 1h54'02", p10
  1567,80 s, p90 8803,30 s, sd 0h55'13", in 90–150'=79,
  <60'=33, >180'=10, >240'=4 (= FULL143 + [gap #98 = 576 s]).
- **INSIDE #98: FALSE (FULL144) — chuỗi 3 → 0 (ĐỨT tại #98).**
  Dải [23:28:54Z, 01:29:30Z] neo 23:02:47Z (#97); btime #98
  23:12:23Z NGOÀI dải, sớm 991 s. Đối chiếu vs FULL143 (neo
  #96): TRUE (dải [21:47:32Z, 23:47:47Z], cách biên dưới
  5.091 s, cách biên trên 2.124 s) — **hai dải MÂU THUẪN ngược
  hướng (lần thứ 12)**; dải phương pháp chi phối theo
  F-165-T2-1. (Số hiệu #98 đã được T0-181 xác nhận.) Gap #98 =
  576 s (9m36s — ngắn bất thường, nguyên nhân chưa xác định,
  host-side; T0-181 không tìm thấy dấu hiệu trong log truy cập
  được) là nguyên nhân đứt: btime rơi quá sớm so với neo.
- Tốc độ reboot: tới #96: 172 reboot / 313,04 h = 1 lần /
  109,2 phút; tới #97: 173 / 314,74 h = 1 lần / 109,2 phút;
  tới #98: 174 / 314,90 h = 1 lần / 108,6 phút.

## §3. Mù

B0 = 11:15:18Z 21/11 (btime #64), B1 = 00:25:32Z 24/11 (giờ chạy
thực tế, F-172-T2-12); cửa sổ 220.214 s. Walk chạy 00:25:38–
00:26:58Z (script `blind9797-investigate.py`, log cùng tên) —
**SAU khi poller T4 thoát hẳn** (attempt1 xong 00:24:06Z,
exit 0; xem §4.2). Sàn (floor) 19'07" = 1.147 s (đứng từ đợt 162).
**Lưu ý phương pháp (F-179-T2-4 đã sửa):** kiểm B1 ở MỌI chỗ dùng
trước khi chạy (investigate B1 + SEG U-end + merged + sessions +
content U1 + witness B1 + hole-recheck hi — tất cả 00:25:32Z);
không còn lỗi U-end cũ.

### §3.1 Walk + file-marks (merged/content)

- Số file có mtime trong cửa sổ: repo-1 **1.641** (đợt 180:
  1.306), hidden_files **7.150** (6.872), outside **2.649**
  (2.557), /tmp **638** (0 — /tmp bị wipe bởi #95, nay đã có
  file mới trên boot #98).
- Merged unique second-marks: **5.394** (180: 5.063).
- **R file (raw): 13 marks, MAX GAP 1.238 s** (11:15:29Z →
  11:35:56Z) — **OPEN, lần thứ 17 liên tiếp KHÔNG ĐỔI.**
  R union-A 1.222 s / union-B 1.211 s — OPEN.
- S file: 226 marks, max 3.235 s (13:01:51Z → 13:55:46Z) —
  OPEN; S union-A 662 s / union-B 591 s — CLOSED.
- T file: 211 marks, max 627 s — CLOSED; T union-A 38 s —
  CLOSED.
- **U file: 4.944 marks, max 8.968 s** (15:06:19Z →
  17:35:47Z 23/11) — **OPEN, KHÔNG ĐỔI vs đợt 180** (hố lặng
  giữa đợt, ôm cả btime #94 17:17:09Z mà KHÔNG có file mark
  nào). U union-A 8.968 s — OPEN; **U union-B 8.968 s — OPEN**
  (xem caveat F-181-T2-6: system head #87–#98 chưa đưa vào —
  chỉ có thể làm max nhỏ đi).
- R-head 0; R-tail repo-1=2 / hidden_files=51 / outside=2 /
  tmp=0 (như 180). U-tail mới (00:06:25–00:25:32Z): repo-1=3
  / hidden_files=99 / outside=33 / tmp=628 / fifthscope=1.
- **Nguồn content MỚI (F-181-T2-3):** content script đã bổ sung
  sampler/watcher 176–179 + watcher-180 (đợt 180 chỉ tới
  174/175). Không nguồn mới nào có mark trong hố U max
  (sampler-179 bắt đầu 17:43:43Z, watcher-179 bắt đầu
  17:49:58Z — đều SAU khi hố khép 17:35:47Z). Round180-t9
  KHÔNG có thư mục ram-sampler.log lúc chuẩn bị (T9-181 lo).
  Mẫu overlap tìm lại được từ các nguồn mới: watcher-176 poll
  cuối 07:10:32Z = btime #90 +3 s; sampler-177 dòng cuối
  09:07:55Z = btime #91 +15 s; watcher-177 poll cuối 09:07:57Z
  = btime #91 +17 s; watcher-178 poll cuối 13:07:57Z = btime
  #93 +22 s — tất cả cùng họ clock-fast, chỉ là caveat.

### §3.2 Sessions + witness (exec-log)

- Exec-logs có mtime trong cửa sổ: **306** (180: 305); mtime
  trong R/S/T: **0/0/0**, trong U: 306.
- **F-181-T2-4 — LOẠI 1 file artifact khỏi đếm witness:**
  `proc_b65641ddba50.log` (agent 84ec3653 = T5-181, mtime
  23:57:14Z 23/11): 93 dòng `grep #97 boot_id candidates` —
  trích dẫn timestamp 2026-11-15..23, KHÔNG phải session có
  hoạt động thật bắc qua các btime. Không loại thì MỌI đếm
  #64–#98 tăng +1 giả. Cùng họ F-178-T2-10 (log output T2-177
  trích biên hố). Các log khác của agent này (watcher-181,
  poll dpkg, meminfo — 23:59Z–00:19Z 24/11) là việc thật hẹp
  và ĐƯỢC GIỮ. Đã chạy lại sessions + witness SAU khi loại.
- Jump witness #64–#86 (sau khi trừ T2-177 + T2-178 +
  T2-179 + T2-180 + T2-181 + file artifact trên, xem
  F-181-T2-4/F-181-T2-5): **#64–#71: 3 → 0; #72–#83: 4 → 0;
  #84: 6 → 0; #85: 4 → 0; #86: 3 (KHÔNG ĐỔI).** Nguyên nhân:
  **pruning xóa 6 exec-log (đã xác nhận GONE, cả thư mục agent
  cũng vắng)**: proc_87d1108d2f8d + proc_2be330feb105 (agent
  5bdd6efb), proc_52cb85ef2a58 (208d5e57), proc_bf06af5a174d
  (7e416a1d), proc_be50692b8dde (978071ba), proc_82c6979af0fd
  (47795047) — không phải mốc mới, chỉ mất witness do pruning
  (cùng họ F-177-T2-9/F-178-T2-9/F-179-T2-5/F-180-T2-3, lần này
  mạnh nhất: 6 file, toàn bộ witness #64–#85). **Mù không
  đóng vì witness về 0** — witness chỉ là bằng chứng phụ;
  R file 1.238 s + hole-recheck NEW=0 mới là căn cứ giữ mở.
- Witness #87–#98 (script `witness879394.py`, trừ dir T2-177 +
  T2-178 + T2-179 + T2-180 + T2-181 + file artifact trên):
  **#87: 4, #88: 2, #89: 2, #90: 2 (KHÔNG ĐỔI so với đợt
  180)** — cùng 2 file cũ T9-174 (proc_f4c14c9e5897.log +
  proc_910b750ec4a6.log — linger/trích dẫn đã biết) + 2 file
  eb668fcf (đợt 180 đã có). **#91: 4 thô → 2 thật; #92: 3 thô
  → 2 thật** — cùng 2 file T9-174 trên (2 file "thừa" là
  trích dẫn đã kiểm tay đợt 178: poll T4-177 + epoch check —
  CÙNG FILE với đợt 180, đã xác minh lại). **#93: 6 thô → 2
  thật** — cùng 2 file T9-174; 4 file "thừa" CÙNG FILE với đợt
  179 (2× LAN4-NEAR 0a2ffa0b + 2× poll-wait-t4-178 9dc615f0 —
  đã kiểm tay đợt 179, đều là ARTIFACT). **#94: 2 thô → 2
  thật** — cùng 2 file T9-174 trên (linger/trích dẫn đã
  biết). 0 hoạt động thật tại #94.
- **#95: 4 thô → 2 thật** — cùng 2 file T9-174; 2 file
  "thừa" CÙNG FILE với đợt 180 (proc_4c2d6895f1f5.log T0-179
  + proc_58b6a8ae27cf.log T5-179 — header trích btime #94 +
  hạn 20:35:00Z, mtime TRƯỚC btime #95) — ARTIFACT.
- **#96: 4 thô → 2 thật** — cùng 2 file T9-174; 2 file
  "thừa" đã kiểm tay, đều là ARTIFACT:
  (a) proc_8f7c301fcd71.log (agent 9c167909 = T7-180: `ls` +
  trích NOTES T7-180 về #96, mtime 22:33:14Z — trích dẫn);
  (b) proc_f0bea09d5272.log (agent dd2e27e2 = T9-180: dòng
  `open-180 2026-11-23T21:00:00Z headroom=0` trích mốc mở
  cửa + sampler lines 21:48–21:50Z TRÊN boot #96 — hoạt động
  thật chỉ SAU btime, không bắc qua btime). **Kết luận: 0
  hoạt động thật mới tại #96.**
- **#97: 1** — chỉ file T9-174 proc_f4c14c9e5897.log (file kia
  kết thúc 22:59:36Z, TRƯỚC btime #97). **#98: 1** — cùng
  file. **Kết luận: 0 hoạt động thật mới tại #97/#98.**
- Content-ts trong hố R union (11:15:29–11:35:40Z): **0 hit.**
  Content-ts trong hố U mới (15:06:19–17:35:47Z 23/11): **9
  file, đúng 1 mốc riêng biệt — 17:17:09Z (btime #94)** —
  trích btime #94 trong poll T4-179 (`btime=...17:17:09Z`
  trong dòng poll 17:49–17:55Z) + header T0-179/T5-179/T8-179,
  viết SAU dispatch 17:35:51Z — không phải hoạt động trong hố.
  **0 mốc mới.**

### §3.3 Hole-recheck lần 25 (NEW=0 mọi hố)

Script `hole-recheck9797.py`, chạy ~00:32Z, log
`hole-recheck181.log` (B1 đã kiểm bằng `grep 00:25:32` trước
khi chạy; 1 dòng stderr `find: /home/hatch/.stagged-uploads:
Permission denied` — không ảnh hưởng).

- **H-E1-88 (19:32:59–20:17:30Z 20/11): inside=337,
  float-trap=337, NEW=0** — lần thứ 25 liên tiếp 0 mới.
- **H-U16 MỚI (15:06:19–17:35:47Z 23/11, hố U max 8.968 s):
  inside=3, float-trap=3, NEW=0** — lần đầu kiểm, 0 mới.
- H-U7 (10:08:01–10:28:06Z 22/11): inside=0, NEW=0; H-U8
  (10:33:43–10:53:31Z): inside=0, NEW=0 — 2 hố vẫn trống.
- Mọi hố khác đều NEW=0 (H-R1/H-R1-old/H-S1/H-S2/H-T1/H-U1/
  H-U2-old/H-U4/H-U5/H-U6/H-U9/H-U10/H-U14/H-U15 inside 0–3,
  đều float-trap đã biết; H-S3/H-U2/H-U3/H-U11/H-S4/H-T2/
  H-U12/H-U13 inside 1–10, đều float-trap đã biết).

### §3.4 Kết luận mù

- **Mù #96? (#64) VẪN MỞ** — R file 1.238 s lần thứ 17 không đổi;
  không mốc mới nào trong cửa sổ.
- **Mù #95? (#63) / #94? (#62) / #88? / #77?: VẪN MỞ** —
  hole-recheck lần 25 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới).
- **CERT/FULL GIỮ 76/91** (vì #77? và #88? vẫn mở).
- U file-gap max 8.968 s KHÔNG ĐỔI (hố H-U16 đã kiểm, NEW=0).

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ script nặng

### §4.1 (m) #56 — lần thứ 24, KHÔNG THU HẸP (4 hướng DB MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1). Cửa ứng viên [19:33:20Z, 19:33:37Z] = epochs
1795203200..1795203217 (= btime #56 + [33 s, 49,8 s]). Run 156:
run_id 9c7b6986-46fd-4a31-beea-2e36272d1d26, sched 1795196151
(17:35:51Z), started 1795201518 (19:05:18Z), finished 1795205974
(20:19:34Z), succeeded, request_id NULL.

- **(xxxviii) DB `scheduler.terminal_signals` created_at trong
  W (MỚI): 0 dòng. ÂM TÍNH.**
- **(xxxix) DB `scheduler.delivery_outbox` created_at_utc trong
  W (MỚI): 0 dòng. ÂM TÍNH.**
- **(xxxx) DB `runtime.requests` created_at trong W (MỚI):
  1 dòng — maintenance `e033d2dd ... :context_retention`,
  created 19:33:35.041Z, root NULL, class `internal`, origin
  `internal.runtime_storage`.** Thuộc nhóm maintenance NULL-root
  ĐÃ BIẾT của hướng (ii) (137 dòng, max 20:22:35.041Z) —
  KHÔNG phải hoạt động của run 156 (run 156 request_id NULL,
  không có requests row). **KHÔNG thu hẹp cửa.**
- **(xxxxi) DB `agent.sessions` created_at/updated_at trong W
  (MỚI): 0 dòng. ÂM TÍNH.**
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức GIỮ 14.**
  Tổng 91 hướng âm tính/rỗng liên tiếp (87 tới đợt 180 + 4
  hướng mới đợt này).
- **Hướng file-based (vii)/(viii)/(vii-b)/(vii-c) (m56-181.py,
  chạy ~00:33Z, SAU khi attempt T4 xong): (vii) 0 file có
  mtime trong W [19:33:20–19:33:37Z]; 333 file trong D, max
  mtime 20:15:33.130Z (< mốc max 20:19:34Z — KHÔNG file mới);
  (viii) 0 exec-log có mtime trong D; (vii-b) 0 file tại
  20:16:00–20:17:00Z; (vii-c) 0 file tại 20:19:30–20:19:40Z.
  ÂM TÍNH — lần thứ 24 không thu hẹp.**

### §4.2 Tuân thủ luật script nặng đợt 181 — 0 chồng chéo

- T4-181 mở poller 23:56:06Z (pid 184190, gate0wait, hạn
  01:30Z). T2-181 **KHÔNG khởi động script nặng nào** trong
  lúc poller chạy: probe #99 (nhẹ, ~1 s) + truy vấn DB +
  m-check + chuẩn bị script (chỉ sửa file) + grep có đích
  đều nhẹ. **Chờ poller thoát bằng waiter nền** (kiểm `ps`
  mỗi 60 s; chỉ đọc `tail` poll-t4.log mỗi vài phút).
- **Cửa yên MỞ poll #33 00:20:12Z** (gate0=T5 POSTBOOT_PASS
  #98 00:16:31Z, repair, poll=1, CÓ caveat + gateA RAM 1.910 MB);
  **attempt1 00:20:12–00:24:06Z: 20/20 + B 5/5, tickCost median
  50,0 ms — LƯỢT YÊN HỢP LỆ #50 (theo poll-t4.log + cờ T4-181;
  chuỗi 43 → 44)**. Poller thoát ngay sau attempt (exit 0);
  T2 xác minh trực tiếp bằng `ps` 00:25:09Z: không còn process
  poll-wait/run-attempt nào + marker
  `attempt-done-attempt1-e62eef3f` đã có (00:23Z).
- **Walk mù chạy 00:25:38–00:26:58Z — SAU khi poller thoát
  ~92 s, SAU khi attempt kết thúc ~92 s.** Merged/content
  00:27:05–00:27:16Z; sessions/witness ~00:27Z;
  hole-recheck ~00:32Z; m56 + sweep ~00:32–00:33Z — TẤT CẢ sau
  attempt. **0 chồng chéo với attempt1. Chuỗi 0 vi phạm 2 → 3
  (T4-181 xác nhận trong cờ).**
- Lưu ý: waiter nền của T2 chạy 00:03:56–00:24:56Z (21 lần
  kiểm, thoát đúng khi poller gone + marker có) — lần này
  waiter SỐNG tới cuối (khác đợt 180 bị SIGTERM lúc ~21:21Z);
  T2 vẫn xác minh trực tiếp bằng `ps` + poll-t4.log + marker
  trước khi chạy walk (F-180-T2-6).

## §5. EPERM probe #99 + sweep

- **Probe #99: chạy 23:54:29Z, boot e62eef3f, ok=2 fail=0, exit 0.**
  Log `hidden_files/eperm-probe-v2.log` 276 → 278 dòng (+1
  boot-changed, +1 probe#99); heartbeat n=99.
  **MemAvailable lúc probe: 528.824 kB.** Cửa sổ probe #99:
  20:58:10Z (#98) → 23:54:29Z = 10.579 s. **Probe #99 bao cả
  3 btime #96 (21:20:56Z) / #97 (23:02:47Z) / #98 (23:12:23Z)**
  — lần đầu tiên một probe bao được 3 btime reboot mới. Sóng
  EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #99** (script `eperm-sweep9797.py`, log
  `eperm-sweep181.log`, chạy ~00:32Z, sau khi attempt kết
  thúc): **172 *.log có mtime trong cửa sổ probe**
  [20:58:10Z, 23:54:29Z]; **3 file có marker (11 lần)** —
  o8-180t0.log ("sóng EPERM đã tắt" ×3), eperm-sweep180.log
  ("Operation not permitted" ×2 + "sóng EPERM đã tắt" ×3),
  o8-180t8.log ("sóng EPERM đã tắt" ×3) — **TẤT CẢ là trích
  dẫn trong log đợt 180** ("Operation not permitted" ×2 trong
  eperm-sweep180.log là trích lại dòng dmesg của T8-179 từ
  đợt 180, KHÔNG phải lần mới), **0 sóng thật.**
- Script probe: `~/workspace/repo-1/scripts/probe-eperm-v2.sh`; log +
  heartbeat tại `~/workspace/goals/capcut-clone-video-editor/
  hidden_files/eperm-probe-v2.log` / `.heartbeat`.

## §6. Phương pháp, sai số, câu hỏi cho parent

### §6.1 Phương pháp

- DB đọc tươi qua `muse.db` (bảng `scheduler.job_runs` +
  `scheduler.events` + `runtime.requests` +
  `scheduler.terminal_signals` + `scheduler.delivery_outbox` +
  `agent.sessions` + `runtime.events` + `agent.subagent_spawns`
  + `runtime.tool_calls`); `muse.db` từ chối `to_timestamp` —
  dùng literal `'YYYY-MM-DD HH:MM:SS+00'::timestamptz` +
  `EXTRACT(EPOCH FROM created_at)` / cột `*_utc` bigint.
  `events.run_id`/`job_runs.run_id` là UUID ĐẦY ĐỦ — tra bằng
  short id trả 0 dòng. Mọi số (m)/INSIDE đều có trong script
  đối chiếu độc lập `m-check181.py` (log `m-check181.txt`).
- INSIDE tính bằng `m-check181.py` (log `m-check181.txt`);
  FULL141 p10/p90 khớp T2-180 bằng assert trong script;
  FULL140/FULL139 in lại khớp số đợt 180.
- (m) #96/#97/#98: KHÔNG cần boot_est (margin xấu nhất 4,030 s
  >> 1 s); prior δ #90 (+0,32 s), δ #92 (+0,396 s) và boot_est
  #95 (+0,99 s) đều cho offset TRONG dải — đồng thuận, không
  như #91 (hai prior trái chiều).
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness
  TRỪ exec-log T2-177 (ec756e29) + T2-178 (b387ac70) +
  T2-179 (52dfc922) + T2-180 (42bae1a0) + T2-181 (11a8480f,
  agent hiện tại) + TRỪ 1 file artifact T5-181 (F-181-T2-4) +
  TRỪ mọi log chứa marker T2 ("m-check17", "FULL13",
  "round178-t2", "round179-t2", "round180-t2", "round181-t2",
  "m-check180", "m-check181") (F-178-T2-4); kiểm B1 ở MỌI chỗ
  dùng trước khi chạy (F-179-T2-4 đã sửa); output vào thư mục
  riêng, không ghi đè file cũ (F-166-T2-2); kiểm epoch GAP bằng
  `date -d` trước khi chạy sessions; chụp meminfo cùng lệnh
  probe (F-172-T7-2-7). **Chờ T4 đóng attempt + poller thoát
  hẳn rồi mới chạy script nặng** (F-176-T2-11).
- **Sửa phương pháp đợt này:** (i) cửa sổ ngày DD/MM trong
  sessions.py + witness879394.py mở tới 24/11 (trước đó chỉ
  tới 23/11 — B1 đợt này sang 24/11, log đợt 181 có thể trích
  ngày 24/11); (ii) content script bổ sung sampler/watcher
  176–179 + watcher-180 (F-181-T2-3); (iii) hole-recheck thêm
  H-U16 (hố U max mới).
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.
- **Sự cố log (không ảnh hưởng số liệu):** lần chạy m56-181.py
  đầu tiên bị cắt log giữa chừng do `head` đóng pipe (SIGPIPE
  vào `tee`) — đã chạy lại với redirect thẳng ra file, exit 0,
  log đầy đủ 343 dòng (F-181-T2-11). Lần chạy sessions.py đầu
  tiên (trước khi loại file artifact F-181-T2-4) làm MỌI đếm
  #64–#98 tăng +1 giả — đã chạy lại sau khi loại; log trên đĩa
  là bản chạy lại đã sửa.

### §6.2 Sai số / caveat (F-181-T2-*)

- **F-181-T2-1 — (m) #96/#97/#98 DƯƠNG ở cấp T2, parent quyết
  cuối; caveat overlap KHÔNG lật verdict.** Offset btime
  41,129 / 39,441 / 37,030 s, TRONG dải; offset thật ∈
  (off−1 s, off] — caveat phân số KHÔNG lật được (xấu nhất #98
  vẫn TRONG 3,030 s). Overlap +18/+24 s (#96), +29 s (#97)
  lấy theo nghĩa đen sẽ lật thành ÂM — tiền lệ #87/#90 cấm lật
  bằng overlap (áp dụng đối xứng với #91/#93/#95); T0-181 đã
  XÁC NHẬN cơ chế (đồng hồ cell nhanh 18–27 s trước #96,
  delta ≥29 s trước #97).
- **F-181-T2-2 — Mẫu overlap MỚI cho #96/#97 (watcher-180).**
  Poll cuối 95b483a2 21:21:20Z = btime #96 +24 s; poll cuối
  8d2a69df 23:03:16Z = btime #97 +29 s (T0-181 xác nhận độc lập
  mẫu #97 là F-181-T0-2). Cùng họ clock-fast; caveat, không
  lật verdict.
- **F-181-T2-3 — Mẫu overlap tìm lại được cho #90/#91/#93
  (nguồn content mới).** Watcher-176 +3 s (#90); sampler-177
  +15 s + watcher-177 +17 s (#91); watcher-178 +22 s (#93).
  Cùng họ clock-fast; caveat, không phán lại verdict các
  reboot cũ.
- **F-181-T2-4 — LOẠI file artifact T5-181 khỏi đếm witness.**
  `proc_b65641ddba50.log` là grep dump trích timestamp
  2026-11-15..23 — không phải hoạt động thật. Không loại thì
  mọi đếm #64–#98 tăng +1 giả (đã chạy lại sau khi loại).
- **F-181-T2-5 — Mù: pruning xóa 6 exec-log, witness #64–#85
  về 0 (SỬA SỐ, không đổi verdict).** proc_87d1108d2f8d +
  proc_2be330feb105 + proc_52cb85ef2a58 + proc_bf06af5a174d +
  proc_be50692b8dde + proc_82c6979af0fd — cả sáu đã xác nhận
  GONE (cả thư mục agent cũng vắng). #64–#71: 3 → 0; #72–#83:
  4 → 0; #84: 6 → 0; #85: 4 → 0; #86: 3 không đổi. R file
  1.238 s lần thứ 17 không đổi; hole-recheck lần 25 NEW=0 mọi
  hố; **U file-gap max 8.968 s KHÔNG ĐỔI.**
- **F-181-T2-6 — Union-B: system head #87–#98 chưa đưa vào
  content script (HẠN CHẾ đã biết).** Content script chỉ có
  system mark tới #86. Nếu đưa head #94 (~17:17:21Z) vào, hố
  U max 8.968 s sẽ tách thành ~7.662 s + ~1.106 s — union-B max
  chỉ có thể NHỎ đi, không đổi verdict OPEN (file-gap 8.968 s
  là chỉ số theo dõi đứng, không phụ thuộc content). Giao T2-182
  bổ sung head #87–#98 nếu lấy được wtmp-begins đã xác minh.
- **F-181-T2-7 — Run 180 TIMEOUT 23:39:30Z (số liệu; kết cục
  thuộc T7-181).** 219 s SAU hạn, claimed→finished 86 s (ca
  ≥60 s thứ mười NẾU T7-181 đồng ý — claimed ĐÃ ĐỔI sau khi
  T7-180 đóng cờ, theo T0-181). Run 181 jitter +219 s, đang
  running — kết cục thuộc T7-182.
- **F-181-T2-8 — Tuân thủ luật script nặng: 0 chồng chéo đợt
  này (parent xác nhận?).** Walk 00:25:38Z chạy SAU khi poller
  thoát (attempt xong 00:24:06Z, xác minh `ps` 00:25:09Z +
  marker attempt-done); mọi script nặng sau attempt. Waiter nền
  lần này sống tới cuối (21 lần kiểm) — khác đợt 180 bị SIGTERM.
  T4-181 xác nhận 0 vi phạm, chuỗi 0 vi phạm 2 → 3.
- **F-181-T2-9 — EPERM probe #99 + sweep #99 — ghi nhận?**
  (Probe ok=2 fail=0, boot e62eef3f, bao cả 3 btime #96/#97/#98;
  sweep: 172 *.log, 3 file có marker (11 lần) — TẤT CẢ trích
  dẫn trong log đợt 180, 0 sóng thật.)
- **F-181-T2-10 — (m) #56: 4 hướng DB mới, lần thứ 24 không
  thu hẹp.** Tổng 91 hướng. Hướng (xxxx) có 1 dòng maintenance
  e033d2dd trong W — đã phân loại (nhóm NULL-root đã biết,
  không phải run 156). File-based: 0 file trong W; 333 file
  trong D, max mtime 20:15:33.130Z (< mốc max 20:19:34Z).
- **F-181-T2-11 — Sự cố log m56 lần chạy đầu (không ảnh hưởng
  số liệu).** `head` đóng pipe làm `tee` chết giữa chừng
  (SIGPIPE) — đã chạy lại redirect thẳng, exit 0, log đủ 343
  dòng. Bài học: không pipe `tee` qua `head` với script dài.

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 181)

- **(a) (m) #96 DƯƠNG — chấp nhận? (m) #97 DƯƠNG — chấp
  nhận? (m) #98 DƯƠNG — chấp nhận?** (requeue +41,129 /
  +39,441 / +37,030 s, TRONG dải [33; 49,8], KHÔNG sát biên;
  mỗi cái 1 run sống; caveat phân số KHÔNG lật được; overlap
  +18/+24 s (#96), +29 s (#97) không lật verdict theo tiền lệ
  #87/#90; T0-181 xác nhận cơ chế clock fast + số hiệu #98.)
  Nếu chấp nhận cả ba: n ứng viên 38/39 → 41/42.
- **(b) INSIDE #96 TRUE — chuỗi 1 → 2 — chấp nhận? INSIDE #97
  TRUE — chuỗi 2 → 3 — chấp nhận? INSIDE #98 FALSE — chuỗi
  3 → 0 — chấp nhận?** (FULL142/FULL143/FULL144; ba lần mâu
  thuẫn ngược hướng liên tiếp (10, 11, 12); dải phương pháp chi
  phối theo F-165-T2-1.)
- **(c) Mù #96? VẪN MỞ — chấp nhận giữ mở?** (R file 1.238 s
  lần thứ 17 không đổi; hole-recheck lần 25 NEW=0 mọi hố;
  U file-gap max 8.968 s KHÔNG ĐỔI; 6 exec-log bị prune —
  witness #64–#85 về 0, không phải mốc mới.)
- **(d) Mù #88? VẪN MỞ — chấp nhận?** (hole-recheck lần 25:
  H-E1-88 inside=337, NEW=0 — lần thứ 25 liên tiếp 0 mới;
  #95?/#94?/#77? cũng MỞ; CERT/FULL GIỮ 76/91.)
- **(e) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều
  kiện?** (lần thứ 24 không thu hẹp; 4 hướng DB mới, tổng 91
  hướng; 1 dòng maintenance trong W đã phân loại.) n chính thức
  GIỮ 14.
- **(f) Tuân thủ luật script nặng đợt 181 — 0 chồng chéo:
  parent xác nhận chuỗi 0 vi phạm 2 → 3?** (Walk 00:25:38Z
  sau khi poller thoát 00:24:06Z; T4-181 xác nhận 0 vi phạm.)
- **(g) EPERM probe #99 + sweep #99 — ghi nhận?** (Probe
  ok=2 fail=0, boot e62eef3f, bao cả 3 btime #96/#97/#98;
  sweep: 172 *.log, 3 file có marker (11 lần) — TẤT CẢ trích
  dẫn trong log đợt 180, 0 sóng thật.)
- **(h) Run 180 TIMEOUT 23:39:30Z (219 s sau hạn,
  claimed→finished 86 s — ca ≥60 s thứ mười NẾU T7-181 đồng ý,
  thuộc T7-181) — ghi nhận cho T7-181?** (Không phải verdict
  của T2.)
- **(i) T0-181: #98 XÁC NHẬN 9 nguồn; #96/#97 đối chiếu (T7-180
  9 nguồn); marker 50 reboot; POSTBOOT_PASS #98 CÓ 00:16:31Z
  (repair, poll=1, caveat — cùng profile #96); #97 CHƯA CÓ;
  tổng boot không cờ GIỮ 20; F-181-T0-2 (delta ≥29 s trước #97)
  — ghi nhận?** (Thuộc T0/T5-181.)
- **(j) Lượt yên #50 CÓ lượt hợp lệ (attempt1-e62eef3f 20/20 +
  B 5/5, median 50,0 ms theo poll-t4.log + cờ T4-181 — chuỗi
  43 → 44) — ghi nhận cho T4-181?** (Không phải verdict của T2.)
