# PHASE 9 — ROUND 180 — T2 EPERM LIMITS

**T2 đợt 180** — EPERM probe #98, phân loại (m) #95 **CUỐI** +
INSIDE #94 FALSE (chuỗi 4 → 0) + INSIDE #95 TRUE (chuỗi mới = 1),
mù #96?/#88?/#94?/#95?/#77?, (m) #56 lần 23.
Đợt 180 mở 20:35:51Z 23/11/2026 (03:35:51 +07 24/11; lượt cron
03:35 +07). Boot lúc mở đã là 95b483a2 (#95, btime 19:10:22Z) —
**REBOOT #95 xảy ra GIỮA đợt 179 và 180** (sau khi T10-179 đóng
sổ ~20:4xZ, trước khi đợt 180 mở), không trong phiên T2-180.
**Số hiệu #95 ĐÃ ĐƯỢC T0-180 XÁC MINH 9 nguồn** (cờ 21:17Z:
boot 95b483a2, btime 19:10:22Z, gap #94→#95 = 6.793 s, khớp
T7-179 từng số; marker sống qua 47 reboot #49–#95) — (m)/INSIDE
dưới đây là **phân loại cuối ở cấp T2 — parent quyết cuối**.
(m) #95: cửa hẹp đã khép 19:29:22Z, trước khi đợt mở — đủ dữ
liệu phân loại cuối.

## §0. Headline

- **(m) #95: DƯƠNG — phân loại CUỐI ở cấp T2, parent quyết
  cuối.** Requeue duy nhất eid 10490, run 179,
  19:11:00.743Z = btime +38,743 s, TRONG dải [33; 49,8],
  cách biên DƯỚI 5,743 s, cách biên TRÊN 11,057 s — KHÔNG sát
  biên (offset thật ∈ (37,743 s, 38,743 s], caveat phân số
  KHÔNG lật được). 1 run sống tại btime. **n ứng viên 37/38 →
  38/39** (nếu parent chấp nhận #93 DƯƠNG đợt 179 rồi
  #95 DƯƠNG).
- **INSIDE #94: FALSE (FULL140) — chuỗi 4 → 0 (ĐỨT tại #94).**
  **INSIDE #95: TRUE (FULL141) — chuỗi MỚI = 1.** Hai dải
  MÂU THUẪN ngược hướng lần thứ 9 (FULL141 TRUE, biên trên
  2.034 s; FULL140 FALSE, trễ 12.937 s) — dải phương pháp chi
  phối theo F-165-T2-1.
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 16 không đổi);
  hole-recheck lần 24 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới —
  lần thứ 24 liên tiếp); U file-gap max TĂNG 8.322 → 8.968 s
  do mốc biên di chuyển (không phải mốc mới); 2 exec-log bị
  prune (32ef7e42a529, badf15ae992c — đã xác nhận GONE).
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 23 không thu hẹp** (4
  hướng DB MỚI (xxxiv)–(xxxvii) đều rỗng; tổng 87 hướng;
  file-based ÂM TÍNH).
- **EPERM probe #98: ok=2 fail=0** (20:58:10Z, boot 95b483a2).
  Sweep #98: 175 *.log, 4 file có marker (12 lần) — TẤT CẢ
  trích dẫn trong log đợt 179 + 1 lệnh dmesg một lần (KHÔNG
  phải sóng), **0 sóng thật**. Sóng EPERM thật gần nhất vẫn
  ~11:55–12:11Z 11/11.
- **Run 179 TIMEOUT** 20:36:19Z (28 s SAU hạn 20:35:51Z;
  claimed→finished 7 s; viết lại ×1 tại #95) — số liệu DB
  tươi; kết cục thuộc T7-180.
- **Tuân thủ luật script nặng đợt 180: 0 chồng chéo** — T2
  CHỜ poller T4 thoát hẳn (attempt1 xong 21:21:23Z, exit 0)
  rồi mới chạy walk mù (21:22:16Z); attempt1-95b483a2:
  20/20 + B 5/5, median 44,0 ms — LƯỢT YÊN HỢP LỆ (thuộc
  T4-180; T4 chưa đóng cờ lúc T2 viết).

## §1. Điểm (m)

### §1.1 (m) #95 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #95: 19:10:22Z** (epoch 1795461022), boot 95b483a2,
  gap #94→#95 = 6.793 s. **T0-180 XÁC NHẬN 9 nguồn** (cờ
  21:17Z; khớp T7-179 từng số: T7 xác minh 9 nguồn trong
  52 s sau btime; T4-179 xác nhận độc lập btime + gap).
  Marker sống qua 47 reboot #49–#95. **F-179-T9-2 ĐÃ ĐƯỢC
  T0-180 XÁC NHẬN:** đồng hồ cell nhanh ~26 s trước reboot,
  boot mới đúng giờ; gap sampler THẬT ~136 s (không phải
  110 s danh nghĩa).
- T2-180 xác minh độc lập từ DB tươi (muse.db, đọc ~21:00Z):
  **requeue duy nhất** trong cửa hẹp [19:10:22Z, 19:29:22Z]:
  **eid 10490, run 179 (f253dced), event
  `requeued_after_restart`, 19:11:00.743372Z = btime +38,743 s,
  TRONG dải [33; 49,8].** Cửa hẹp đã khép hẳn lúc đọc. 8
  `requeued_after_restart` ngày 23/11 (#86/#87/#88/#90/#91/
  #92/#93/#95) — eid 10490 là cái thứ 8, đúng của #95.
  **KHÔNG có requeue cho #89 hay #94** (xem §1.3).
- Run 179: 5 event — dispatched 17:35:51.044Z eid 10468;
  requeued_after_restart 19:11:00.743Z eid 10490 (#95);
  dispatched 19:11:00.897Z eid 10491; reattached_after_restart
  19:11:01.032Z eid 10492; timeout 20:36:19.057Z eid 10509.
  **Đúng 1 lần viết lại** (tại #95). Cửa hẹp còn 3 event khác:
  reconciled 19:15:34.262Z eid 10493 + DR dispatched/succeeded
  19:15:34.406Z/522Z eid 10494/10495 (heartbeat run
  ea4e0ed5) — không phải requeue.
- **Đúng 1 run sống tại btime #95** (vcut-build-loop,
  scheduled ≤ btime AND finished > btime, DB tươi): run 179
  (sched 17:35:51Z, finished 20:36:19Z timeout). Không run
  nào khác.
- **Caveat phân số: offset thật ∈ (37,743 s, 38,743 s]** —
  DƯƠNG với mọi δ ∈ [0, 1 s] (δ = 1 s → 37,743 s, vẫn TRONG
  4,743 s). **KHÔNG CẦN boot_est #95** (chưa có lúc viết;
  margin 5,743 s >> 1 s). Prior δ #90 (+0,32 s) → 38,423 s;
  prior δ #92 (+0,396 s) → 38,347 s — đều TRONG, đồng thuận.
- **Caveat overlap (KHÔNG lật verdict, tiền lệ #87/#90):**
  watcher-179 poll cuối 19:10:48Z = btime +26 s biểu kiến
  (boot ae2a9a47 — FILE KẾT THÚC, chết theo #95; mẫu overlap
  thứ mười một, F-180-T5-1); sampler cuối #94 19:10:45Z =
  btime +23 s biểu kiến (F-179-T9-2). Lấy +26 s theo nghĩa
  đen thì offset ~12,7 s — NGOÀI dải dưới. Nhưng T0-180 đã
  XÁC NHẬN cơ chế: đồng hồ cell nhanh ~26 s trước reboot —
  các dòng cuối boot cũ mang dấu thời gian của khung đồng hồ
  nhanh, không phải hoạt động sau btime. Tiền lệ đứng nói
  overlap là caveat, KHÔNG BAO GIỜ lật verdict btime — áp
  dụng đối xứng với #91 (ở #91 lấy overlap theo nghĩa đen
  sẽ lật ÂM→DƯƠNG; ở #93/#95 sẽ lật DƯƠNG→ÂM; cả ba đều
  KHÔNG lật).
- **Phán: (m) #95 DƯƠNG — parent quyết cuối. n ứng viên
  37/38 → 38/39** (nếu chấp nhận #93 DƯƠNG đợt 179 rồi
  #95 DƯƠNG). **n chính thức GIỮ 14.**

### §1.2 (m) #94 — KHÔNG CÓ ĐIỂM (xác minh độc lập lại)

- **Btime #94: 17:17:09Z** (epoch 1795454229), boot ae2a9a47,
  gap #93→#94 = 14.974 s. **T0-179 XÁC NHẬN 9 nguồn; parent
  chấp nhận (f) 179 là GHI NHẬN.**
- T2-180 xác minh độc lập từ DB tươi: **0 requeue** trong
  cửa hẹp [17:17:09Z, 17:36:09Z] VÀ **0 requeue trên toàn
  ngày 23/11 ngoài 8 cái đã biết** (#86/#87/#88/#90/#91/
  #92/#93/#95) — không có requeue nào thuộc #94 ở cửa rộng.
  **(m) #94 KHÔNG CÓ ĐIỂM — khớp T0-179.** Phân loại này
  không đổi (không phải việc phân loại lại của T2-180).

### §1.3 Run 179 kết cục (số liệu; kết cục thuộc T7-180)

- **status TIMEOUT, finished_at_utc 1795466179.057 =
  20:36:19Z — 28 s SAU hạn 20:35:51Z** (T7-179 đóng cờ lúc
  run vẫn running, còn 837 s tới hạn; run không kịp).
  **claimed_at_utc 1795466172 = 20:36:12Z; claimed→finished
  = 7 s**; wall từ sched gốc = 10.828 s; started_at_utc
  1795461060 (= 19:11:00Z, viết lại tại #95); boot_gen cuối
  cron_boot_d67600a2... (#95). Attempt 1.
- **7 s < 60 s — KHÔNG phải ca claimed→finished ≥60 s**
  (số ca GIỮ 9, nếu T7-180 đồng ý). **Phân loại cuối thuộc
  T7-180 + parent** — T2 chỉ ghi số liệu DB tươi.
- Ghi nhận thêm (không phải verdict T2): run 180 (sched
  20:35:51Z, run_id 6ee0f154) started 20:36:19Z (= đúng lúc
  run 179 timeout — trễ 28 s so với sched), boot_gen
  cron_boot_d67600a2... (#95), RUNNING lúc T2 đọc; kết cục
  thuộc T7-181 (T0-180 ghi "jitter 0 đứt" — thuộc T7-180).

## §2. INSIDE — dải FULL140 / FULL141

Script: `m-check180.py` (log `m-check180.txt`; exec
`m-check179.py` — FULL139 p10/p90 khớp bằng assert
1575,80/8763,80; FULL138/FULL137 in lại khớp số đợt 179).
Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1).

- **FULL140**: n=140, mean 1h41'37", median 1h54'38", p10
  1577,40 s, p90 8830,20 s, sd 0h55'24", in 90–150'=76,
  <60'=32, >180'=10, >240'=4 (= FULL139 + [gap #94 =
  14.974 s]).
- **INSIDE #94: FALSE (FULL140)** — dải [13:33:52Z,
  15:34:45Z] neo 13:07:35Z (#93); btime #94 17:17:09Z NGOÀI
  dải, trễ 6.144 s. **Chuỗi 4 → 0 (ĐỨT tại #94).** Đối chiếu
  vs FULL139 (neo #92): FALSE (dải [11:27:42Z, 13:27:30Z],
  trễ 13.779 s) — **hai dải ĐỒNG THUẬN FALSE (không mâu
  thuẫn)**. (Số hiệu #94 đã được T0-179 xác nhận.) Gap
  #94 = 14.974 s (~4h10m — dài gấp đôi mẫu ~2 giờ) là
  nguyên nhân đứt: btime rơi quá xa sau neo.
- **FULL141**: n=141, mean 1h41'42", median 1h54'16", p10
  1579,00 s, p90 8827,00 s, sd 0h55'12", in 90–150'=77,
  <60'=32, >180'=10, >240'=4 (= FULL140 + [gap #95 =
  6.793 s]).
- **INSIDE #95: TRUE (FULL141) — chuỗi MỚI = 1.** Dải
  [17:43:28Z, 19:44:16Z] neo 17:17:09Z (#94); btime #95
  19:10:22Z TRONG dải, cách biên dưới 5.214 s, cách biên
  trên 2.034 s. Đối chiếu vs FULL140 (neo #93): FALSE
  (dải [13:33:52Z, 15:34:45Z], trễ 12.937 s) — **hai dải
  MÂU THUẪN ngược hướng (lần thứ 9)**; dải phương pháp
  FULL141 chi phối theo F-165-T2-1 (F-180-T2-2). (Số hiệu
  #95 đã được T0-180 xác nhận.)
- Tốc độ reboot: tới #94: 170 reboot / 308,98 h = 1 lần /
  109,1 phút; tới #95: 171 / 310,87 h = 1 lần / 109,1 phút
  (không đổi).

## §3. Mù

B0 = 11:15:18Z 21/11 (btime #64), B1 = 21:22:30Z 23/11 (giờ chạy
thực tế, F-172-T2-12); cửa sổ 209.232 s. Walk chạy 21:22:16–
21:23:40Z (script `blind9797-investigate.py`, log cùng tên) —
**SAU khi poller T4 thoát hẳn** (attempt1 xong 21:21:23Z,
exit 0; xem §4.2). Sàn (floor) 19'07" = 1.147 s (đứng từ đợt 162).
**Lưu ý phương pháp (F-179-T2-4 đã sửa):** lần này kiểm B1 ở
MỌI chỗ dùng trước khi chạy (investigate B1 + SEG U-end +
merged + sessions + content U1 + witness B1 + hole-recheck hi
— tất cả 21:22:30Z); không còn lỗi U-end cũ.

### §3.1 Walk + file-marks (merged/content)

- Số file có mtime trong cửa sổ: repo-1 **1.306** (đợt 179:
  990), hidden_files **6.872** (6.615), outside **2.557**
  (2.489), /tmp **0** (629 — /tmp bị wipe bởi #95, chưa có
  file mới trên boot #95).
- Merged unique second-marks: **5.063** (179: 4.794).
- **R file (raw): 13 marks, MAX GAP 1.238 s** (11:15:29Z →
  11:35:56Z) — **OPEN, lần thứ 16 liên tiếp KHÔNG ĐỔI.**
  R union-A 1.222 s / union-B 1.211 s — OPEN.
- S file: 226 marks, max 3.235 s (13:01:51Z → 13:55:46Z) —
  OPEN; S union-A 662 s / union-B 591 s — CLOSED.
- T file: 211 marks, max 627 s — CLOSED; T union-A 38 s —
  CLOSED.
- **U file: 4.613 marks, max 8.968 s** (15:06:19Z →
  17:35:47Z 23/11) — **OPEN, TĂNG từ 8.322 s** (đợt 179).
  Nguyên nhân: **mốc biên di chuyển, không phải mốc mới** —
  mốc 15:16:54Z đợt 179 là sessions.jsonl của main agent
  e033d2dd (đã được ghi tiếp sau đó nên mtime dời về sau);
  mốc biên mới 15:06:19Z là 3 file sessions của agent
  T10-179 chat 3180d60b (ngừng ghi lúc 15:06:19Z). Khoảng
  lặng giữa đợt, ôm cả btime #94 (17:17:09Z) mà KHÔNG có
  file mark nào. Hố cũ 8.322 s (15:16:54Z → 17:35:36Z) nay
  đã bị nuốt vào hố mới; hố 3.530 s (09:55:21Z → 10:54:11Z
  22/11) vẫn đó, nay là hố lớn thứ ba. U union-A 8.968 s —
  OPEN; **U union-B 8.968 s — OPEN** (chỉ số cũ 1.118 s,
  cách sàn 29 s, nay chỉ còn là hố lớn thứ tư trong U mở
  rộng — theo dõi bằng hố mới 8.968 s thay cho mốc cũ).
- R-head 0; R-tail repo-1=2 / hidden_files=51 / outside=2 /
  tmp=0 (như 179). U-tail mới (21:03:23–21:22:30Z): repo-1=10
  / hidden_files=158 / outside=54 / tmp=0.

### §3.2 Sessions + witness (exec-log)

- Exec-logs có mtime trong cửa sổ: **305** (179: 306); mtime
  trong R/S/T: **0/0/0**, trong U: 305.
- Jump witness #64–#86 (sau khi trừ T2-177 + T2-178 +
  T2-179 + T2-180, xem F-180-T2-3): **#64–#71: 3 (KHÔNG
  ĐỔI); #72–#83: 5 → 4; #84: 8 → 6; #85: 4; #86: 3 (KHÔNG
  ĐỔI).** Nguyên nhân: pruning xóa 2 exec-log (đã xác nhận
  GONE): proc_32ef7e42a529.log (witness #72–#84),
  proc_badf15ae992c.log (witness #84) — không phải mốc mới,
  chỉ mất witness do pruning (cùng họ F-177-T2-9/F-178-T2-9/
  F-179-T2-5).
- Witness #87–#95 (script `witness879394.py`, trừ dir T2-177 +
  T2-178 + T2-179 + T2-180 + mọi log chứa marker T2):
  **#87: 4, #88: 2, #89: 2, #90: 2 (KHÔNG ĐỔI so với đợt
  177/178/179)** — cùng 2 file cũ T9-174 (proc_f4c14c9e5897.log
  + proc_910b750ec4a6.log — đã kiểm đợt 175, trích dẫn/linger).
  **#91: 4 thô → 2 thật; #92: 3 thô → 2 thật** — cùng 2 file
  T9-174 trên (2 file "thừa" là trích dẫn đã kiểm tay đợt
  178). **#93: 6 thô → 2 thật** — cùng 2 file T9-174; 4 file
  "thừa" đã kiểm tay đợt 179, đều là ARTIFACT. **#94: 2 thô
  → 2 thật** — cùng 2 file T9-174 trên (linger/trích dẫn
  đã biết). 0 hoạt động thật tại #94.
- **#95: 4 thô → 2 thật** — cùng 2 file T9-174; 2 file
  "thừa" đã kiểm tay, đều là ARTIFACT (header trích btime
  #94 + hạn 20:35:00Z của đợt 179, KHÔNG phải hoạt động tại
  btime #95):
  (a) proc_4c2d6895f1f5.log (agent c5023318 = T0-179: `ls`
  thư mục round180-t5, header trích btime #94 17:17:09Z +
  end 20:35:00Z; mtime 17:58:00Z — TRƯỚC btime #95);
  (b) proc_58b6a8ae27cf.log (agent 4f76c55c = T5-179:
  `REPLAY-WATCH-179-START ... btime=2026-11-23 17:17:09Z
  end=2026-11-23T20:35:00Z`; mtime 17:59:21Z — TRƯỚC btime
  #95). **Kết luận: 0 hoạt động thật mới tại #95.**
- Content-ts trong hố R union (11:15:29–11:35:40Z): **2 hit**
  — 11:16:22Z + 11:35:35Z (mốc biên R1-old đã biết), cùng 1
  file còn sống proc_52cb85ef2a58.log (bản sao 11:16:22Z kia,
  proc_2a68c5ee9e4f.log, đã bị prune — xem trên). Content-ts
  trong hố U mới (15:06:19–17:35:47Z 23/11): **đúng 1 mốc
  riêng biệt — 17:17:09Z (btime #94), ×15 lần** — trích
  btime #94 trong exec-log của các luồng đợt 179 (T4-179
  và các luồng khác), viết SAU dispatch 17:35:51Z — không
  phải hoạt động trong hố. **0 mốc mới.**

### §3.3 Hole-recheck lần 24 (NEW=0 mọi hố)

Script `hole-recheck9797.py`, chạy ~21:25Z, log
`hole-recheck180.log` (mtime 21:25:21Z; B1 đã kiểm bằng `grep 21:22:30` trước
khi chạy; 1 dòng stderr `find: /home/hatch/.stagged-uploads:
Permission denied` — không ảnh hưởng).

- **H-E1-88 (19:32:59–20:17:30Z 20/11): inside=337,
  float-trap=337, NEW=0** — lần thứ 24 liên tiếp 0 mới.
- H-U7 (10:08:01–10:28:06Z 22/11): inside=0, NEW=0; H-U8
  (10:33:43–10:53:31Z): inside=0, NEW=0 — 2 hố vẫn trống.
- Mọi hố khác đều NEW=0 (H-R1/H-R1-old/H-S1/H-S2/H-T1/H-U1/
  H-U2-old/H-U4/H-U5/H-U6/H-U9/H-U10/H-U14/H-U15 inside 0–3,
  đều float-trap đã biết; H-S3/H-U2/H-U3/H-U11/H-S4/H-T2/
  H-U12/H-U13 inside 1–10, đều float-trap đã biết).

### §3.4 Kết luận mù

- **Mù #96? (#64) VẪN MỞ** — R file 1.238 s lần thứ 16 không đổi;
  không mốc mới nào trong cửa sổ.
- **Mù #95? (#63) / #94? (#62) / #88? / #77?: VẪN MỞ** —
  hole-recheck lần 24 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới).
- **CERT/FULL GIỮ 76/91** (vì #77? và #88? vẫn mở).
- U file-gap max nay 8.968 s (hố lặng giữa đợt) — chỉ số
  "U union-B cách sàn 29 s" đợt 179 không còn dùng được;
  theo dõi hố mới 8.968 s.

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ script nặng

### §4.1 (m) #56 — lần thứ 23, KHÔNG THU HẸP (4 hướng DB MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1). Cửa ứng viên [19:33:20Z, 19:33:37Z] = epochs
1795203200..1795203217 (= btime #56 + [33 s, 49,8 s]). Run 156:
run_id 9c7b6986-46fd-4a31-beea-2e36272d1d26, sched 1795196151
(17:35:51Z), started 1795201518 (19:05:18Z), finished 1795205974
(20:19:34Z), succeeded, request_id NULL.

- **(xxxiv) DB `runtime.events` created_at trong W (MỚI):
  0 dòng. ÂM TÍNH.**
- **(xxxv) DB `agent.subagent_spawns` created_at (epoch) trong
  W (MỚI): 0 dòng. ÂM TÍNH.**
- **(xxxvi) DB `runtime.tool_calls` created_at trong W (MỚI):
  0 dòng. ÂM TÍNH.**
- **(xxxvii) DB `scheduler.job_runs` worker_claimed_at_utc
  trong W (MỚI — mọi run): 0 dòng. ÂM TÍNH.**
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức GIỮ 14.**
  Tổng 87 hướng âm tính/rỗng liên tiếp (83 tới đợt 179 + 4
  hướng mới đợt này).
- **Hướng file-based (vii)/(viii)/(vii-b)/(vii-c) (m56-180.py,
  chạy ~21:26Z, SAU khi attempt T4 xong): (vii) 0 file có
  mtime trong W [19:33:20–19:33:37Z]; 333 file trong D, max
  mtime 20:15:33.130Z (< mốc max 20:19:34Z — KHÔNG file mới);
  (viii) 0 exec-log có mtime trong D; (vii-b) 0 file tại
  20:16:00–20:17:00Z; (vii-c) 0 file tại 20:19:30–20:19:40Z.
  ÂM TÍNH — lần thứ 23 không thu hẹp.**

### §4.2 Tuân thủ luật script nặng đợt 180 — 0 chồng chéo

- T4-180 mở poller 21:04:40Z (pid 139764, gate0wait, hạn
  22:30Z). T2-180 **KHÔNG khởi động script nặng nào** trong
  lúc poller chạy: probe #98 (nhẹ, ~1 s) + truy vấn DB +
  m-check + chuẩn bị script (chỉ sửa file) + grep có đích
  đều nhẹ. **Chờ poller thoát bằng waiter nền** (kiểm `ps`
  mỗi 60 s; chỉ đọc `tail` poll-t4.log mỗi vài phút).
- **Cửa yên MỞ poll #18 21:17:29Z** (gate0=T5 POSTBOOT_PASS
  #95 20:59:47Z, replay-đầy-đủ, poll=0, KHÔNG caveat repair
  + gateA RAM 1.280 MB); **attempt1 21:17:29–21:21:23Z:
  20/20 + B 5/5, tickCost median 44,0 ms — LƯỢT YÊN HỢP LỆ
  (theo poll-t4.log; thuộc T4-180; T4 chưa đóng cờ lúc T2
  viết — chuỗi 42 → 43 nếu T4 xác nhận)**. Poller thoát
  ngay sau attempt (exit 0); T2 xác minh trực tiếp bằng `ps`
  21:22:00Z: không còn process poll-wait/run-attempt nào +
  marker `attempt-done-attempt1-95b483a2` đã có (21:20Z).
- **Walk mù chạy 21:22:16–21:23:40Z — SAU khi poller thoát
  ~53 s, SAU khi attempt kết thúc ~53 s.** Merged/content
  21:23:48–21:23:49Z; sessions/witness 21:24:19–21:24:22Z;
  hole-recheck ~21:25Z; m56 + sweep ~21:26Z — TẤT CẢ sau
  attempt. **0 chồng chéo với attempt1. Chuỗi 0 vi phạm
  tính lại từ 1 ở đợt 179 — đợt này GIỮ SẠCH (chờ parent
  xác nhận, xem F-180-T2-6).**
- Lưu ý: waiter nền của T2 (pid 135520) bị SIGTERM lúc
  ~21:21Z khi runtime kết thúc phiên monitor của T2 — T2
  KHÔNG dựa vào waiter nữa mà xác minh trực tiếp bằng `ps`
  + poll-t4.log + marker trước khi chạy walk (F-180-T2-6).
  Bài học F-176-T2-11 vẫn đứng: chờ poller thoát hẳn, không
  dựa vào guard giết giữa chừng — và không dựa vào tiến
  trình waiter nền.

## §5. EPERM probe #98 + sweep

- **Probe #98: chạy 20:58:10Z, boot 95b483a2, ok=2 fail=0, exit 0.**
  Log `hidden_files/eperm-probe-v2.log` 274 → 276 dòng (+1
  boot-changed, +1 probe#98); heartbeat n=98.
  **MemAvailable lúc probe: 711.008 kB.** Cửa sổ probe #98:
  17:42:16Z (#97) → 20:58:10Z = 11.754 s. **Lưu ý: probe #98
  bao cả btime #95 (19:10:22Z)** — lần đầu tiên sau 2 lượt,
  một probe bao được btime của reboot mới (probe #97 bỏ qua
  cả #93 lẫn #94). Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z
  11/11.
- **Sweep #98** (script `eperm-sweep9797.py`, log
  `eperm-sweep180.log`, chạy ~21:26Z, sau khi attempt kết
  thúc): **175 *.log có mtime trong cửa sổ probe**
  [17:42:16Z, 20:58:10Z]; **4 file có marker (12 lần)** —
  proc_8791a80fb8d4.log ("Operation not permitted" ×1 — log
  T8-179, xem dưới), o8-179t0.log ("sóng EPERM đã tắt" ×3),
  eperm-sweep179.log ("Operation not permitted" ×1 + "sóng
  EPERM đã tắt" ×4), o8-179t8.log ("sóng EPERM đã tắt" ×3) —
  **TẤT CẢ là trích dẫn trong log đợt 179 hoặc một lệnh chẩn
  đoán một lần, 0 sóng thật.**
- **Dòng "Operation not permitted" duy nhất KHÔNG phải sóng
  (F-180-T2-4):** `dmesg: read kernel buffer failed: Operation
  not permitted` trong exec-log T8-179 (proc_8791a80fb8d4.log
  dòng 21, ~18:26Z, mtime file 18:26:48Z) — T8-179 chạy
  `dmesg` làm baseline chẩn đoán; kernel từ chối đọc buffer
  (dmesg_restrict) và in "-- No entries --". Đây là một lần
  từ chối quyền đọc của một lệnh chẩn đoán, KHÔNG phải lỗi
  ghi file EPERM, KHÔNG lặp lại, probe #98 ok=2 fail=0 —
  không tính là sóng.
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
  đối chiếu độc lập `m-check180.py` (log `m-check180.txt`).
- INSIDE tính bằng `m-check180.py` (log `m-check180.txt`);
  FULL139 p10/p90 khớp T2-179 bằng assert trong script;
  FULL138/FULL137 in lại khớp số đợt 179.
- (m) #95: KHÔNG cần boot_est (margin 5,743 s >> 1 s); prior
  δ #90 (+0,32 s) và δ #92 (+0,396 s) đều cho offset TRONG
  dải — đồng thuận, không như #91 (hai prior trái chiều).
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness
  TRỪ exec-log T2-177 (ec756e29) + T2-178 (b387ac70) +
  T2-179 (52dfc922) + T2-180 (42bae1a0, agent hiện tại) +
  TRỪ mọi log chứa marker T2 ("m-check17", "FULL13",
  "round178-t2", "round179-t2", "round180-t2", "m-check180")
  (F-178-T2-4); kiểm B1 ở MỌI chỗ dùng trước khi chạy
  (F-179-T2-4 đã sửa); output vào thư mục riêng, không ghi đè
  file cũ (F-166-T2-2); kiểm epoch GAP bằng `date -d` trước
  khi chạy sessions; chụp meminfo cùng lệnh probe
  (F-172-T7-2-7). **Chờ T4 đóng attempt + poller thoát hẳn
  rồi mới chạy script nặng** (F-176-T2-11).
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.

### §6.2 Sai số / caveat (F-180-T2-*)

- **F-180-T2-1 — (m) #95 DƯƠNG ở cấp T2, parent quyết cuối;
  caveat overlap KHÔNG lật verdict.** Offset btime 38,743 s,
  TRONG dải 5,743 s; offset thật ∈ (37,743 s, 38,743 s] —
  caveat phân số KHÔNG lật được (cần δ ≥ 1 s mới ra ngoài,
  δ tối đa < 1 s). Overlap +26 s (watcher-179, F-180-T5-1,
  mẫu thứ mười một) / +23 s (sampler, F-179-T9-2) lấy theo
  nghĩa đen sẽ lật thành ÂM — tiền lệ #87/#90 cấm lật bằng
  overlap (áp dụng đối xứng với #91/#93); T0-180 đã XÁC
  NHẬN cơ chế (đồng hồ cell nhanh ~26 s trước reboot).
- **F-180-T2-2 — INSIDE #94 FALSE (chuỗi 4 → 0); INSIDE #95
  TRUE (chuỗi mới = 1); hai dải MÂU THUẪN ngược hướng lần
  thứ 9.** FULL140 FALSE (trễ 6.144 s; cross-check FULL139
  cũng FALSE — đồng thuận); FULL141 TRUE (cách biên trên
  2.034 s; cross-check FULL140 FALSE, trễ 12.937 s). T2 áp
  dụng kỷ luật F-165-T2-1 (dải phương pháp chi phối), như
  tiền lệ #79/#82/#83/#85/#86/#87/#88/#89/#91/#92/#93. Chuỗi
  mới = 1 phụ thuộc kỷ luật này + việc #94 FALSE; nếu parent
  không đồng ý, chuỗi theo dải cũ vẫn đứt từ #94 — parent quyết.
- **F-180-T2-3 — Mù: #72–#84 mất witness do pruning 2
  exec-log (SỬA SỐ, không đổi verdict).** proc_32ef7e42a529
  (#72–#84), proc_badf15ae992c (#84) — cả hai đã xác nhận
  GONE. #72–#83: 5 → 4; #84: 8 → 6; #64–#71/#85/#86 không
  đổi. R file 1.238 s lần thứ 16 không đổi; hole-recheck lần
  24 NEW=0 mọi hố; **U file-gap max TĂNG 8.322 → 8.968 s do
  mốc biên di chuyển (sessions.jsonl main agent được ghi
  tiếp; mốc mới là session T10-179 chat) — không phải mốc
  mới; chỉ số "U union-B cách sàn 29 s" đợt 179 không còn
  dùng được.**
- **F-180-T2-4 — Sweep #98: 1 dòng "Operation not permitted"
  là lệnh dmesg một lần của T8-179 (KHÔNG phải sóng).**
  `dmesg: read kernel buffer failed` (~18:26Z) là từ chối
  đọc kernel buffer (dmesg_restrict), không phải lỗi ghi
  file; không lặp lại; probe #98 ok=2 fail=0. 0 sóng thật.
- **F-180-T2-5 — (m) #56: 4 hướng DB mới đều rỗng (lần thứ
  23 không thu hẹp).** Tổng 87 hướng. File-based: 0 file
  trong W; 333 file trong D, max mtime 20:15:33.130Z (< mốc
  max 20:19:34Z).
- **F-180-T2-6 — Tuân thủ luật script nặng: 0 chồng chéo đợt
  này (parent xác nhận?).** Walk 21:22:16Z chạy SAU khi
  poller thoát (attempt xong 21:21:23Z, xác minh `ps`
  21:22:00Z + marker attempt-done); mọi script nặng sau
  attempt. Waiter nền bị SIGTERM lúc ~21:21Z (runtime kết
  thúc phiên monitor) — T2 xác minh trực tiếp, không dựa
  vào waiter.
- **F-180-T2-7 — Run 179 TIMEOUT 20:36:19Z (số liệu; kết cục
  thuộc T7-180).** 28 s SAU hạn 20:35:51Z, claimed→finished
  7 s (KHÔNG phải ca ≥60 s — số ca GIỮ 9, nếu T7-180 đồng
  ý). Run 180 started 20:36:19Z (trễ 28 s — thuộc T7-180).
- **F-180-T2-8 — (m) #94: 0 requeue trên toàn 23/11 (xác minh
  độc lập lại).** 8 requeue cả ngày (#86/#87/#88/#90/#91/
  #92/#93/#95); không có #89/#94 — khớp "KHÔNG CÓ ĐIỂM"
  của T0-179.
- **F-180-T2-9 — #95 XÁC NHẬN (T0-180, cờ 21:17Z).**
  9 nguồn; khớp T7-179 từng số; marker 47 reboot.
  **POSTBOOT_PASS #95 CÓ 20:59:47Z (replay-đầy-đủ, poll=0,
  dpkg 1545, KHÔNG caveat repair — T5-180, cờ 21:05Z).**
  F-179-T9-2 ĐÃ XÁC NHẬN (T0-180: clock fast ~26 s; sampler
  gap THẬT ~136 s).

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 180)

- **(a) (m) #95 DƯƠNG — chấp nhận?** (requeue +38,743 s,
  TRONG dải [33; 49,8], cách biên dưới 5,743 s; 1 run sống;
  caveat phân số KHÔNG lật được; overlap +26/+23 s không lật
  verdict theo tiền lệ #87/#90; T0-180 xác nhận cơ chế clock
  fast ~26 s.) Nếu chấp nhận: n ứng viên 37/38 → 38/39.
- **(b) INSIDE #94 FALSE — chuỗi 4 → 0 — chấp nhận? INSIDE
  #95 TRUE — chuỗi mới = 1 — chấp nhận?** (FULL140/FULL141;
  hai dải mâu thuẫn ngược hướng lần thứ 9; dải phương pháp
  chi phối theo F-165-T2-1.)
- **(c) Mù #96? VẪN MỞ — chấp nhận giữ mở?** (R file 1.238 s
  lần thứ 16 không đổi; hole-recheck lần 24 NEW=0 mọi hố;
  U file-gap max 8.968 s do mốc biên di chuyển — không phải
  mốc mới; 2 exec-log bị prune.)
- **(d) Mù #88? VẪN MỞ — chấp nhận?** (hole-recheck lần 24:
  H-E1-88 inside=337, NEW=0 — lần thứ 24 liên tiếp 0 mới;
  #95?/#94?/#77? cũng MỞ; CERT/FULL GIỮ 76/91.)
- **(e) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều
  kiện?** (lần thứ 23 không thu hẹp; 4 hướng DB mới đều rỗng,
  tổng 87 hướng.) n chính thức GIỮ 14.
- **(f) Tuân thủ luật script nặng đợt 180 — 0 chồng chéo:
  parent xác nhận chuỗi 0 vi phạm tính tiếp từ 1 ở đợt 179
  lên 2?** (Walk 21:22:16Z sau khi poller thoát 21:21:23Z;
  waiter bị SIGTERM nhưng T2 xác minh trực tiếp bằng `ps` +
  poll log + marker.)
- **(g) EPERM probe #98 + sweep #98 — ghi nhận?** (Probe
  ok=2 fail=0, boot 95b483a2; sweep: 175 *.log, 4 file có
  marker (12 lần) — TẤT CẢ trích dẫn trong log đợt 179 +
  1 lệnh dmesg một lần (F-180-T2-4), 0 sóng thật; probe bao
  được btime #95.)
- **(h) Run 179 TIMEOUT 20:36:19Z (28 s sau hạn,
  claimed→finished 7 s — KHÔNG phải ca ≥60 s, thuộc T7-180)
  — ghi nhận cho T7-180?** (Không phải verdict của T2.)
- **(i) T0-180: #95 XÁC NHẬN 9 nguồn; marker 47 reboot;
  POSTBOOT_PASS #95 CÓ (replay-đầy-đủ, poll=0, KHÔNG caveat
  repair); F-179-T9-2 ĐÃ XÁC NHẬN (clock fast ~26 s; sampler
  gap THẬT ~136 s) — ghi nhận?** (Thuộc T0/T5-180.)
- **(j) Lượt yên #49 CÓ lượt hợp lệ (attempt1-95b483a2 20/20 +
  B 5/5, median 44,0 ms theo poll-t4.log; T4 chưa đóng cờ lúc
  T2 viết — chuỗi 42 → 43 nếu T4 xác nhận) — ghi nhận cho
  T4-180?** (Không phải verdict của T2.)
