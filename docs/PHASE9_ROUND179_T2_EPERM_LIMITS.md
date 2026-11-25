# PHASE 9 — ROUND 179 — T2 EPERM LIMITS

**T2 đợt 179** — EPERM probe #97, phân loại (m) #93 **CUỐI** +
INSIDE #93 TRUE (chuỗi 3 → 4), mù #96?/#88?/#94?/#95?/#77?,
(m) #56 lần 22.
Đợt 179 mở 17:35:51Z 23/11/2026 (00:35:51 +07 24/11; lượt cron
00:35 +07). Boot lúc mở đã là ae2a9a47 (#94, btime 17:17:09Z) —
**REBOOT #94 xảy ra GIỮA đợt 178 và 179** (sau khi T10-178 đóng
sổ ~14:4xZ, trước khi đợt 179 mở), không trong phiên T2-179.
**Số hiệu #93 + #94 ĐÃ ĐƯỢC T0-179 XÁC MINH 9 nguồn** (cờ
18:14Z: #94 trực tiếp; #93 qua T7-178 9 nguồn + T4-178 độc
lập + T0-179 đối chiếu DB; marker sống qua 46 reboot
#49–#94) — (m)/INSIDE dưới đây là **phân loại cuối ở cấp
T2 — parent quyết cuối**. (m) #93: cửa hẹp đã khép 13:26:35Z,
trước khi đợt mở — đủ dữ liệu phân loại cuối.

## §0. Headline

- **(m) #93: DƯƠNG — phân loại CUỐI ở cấp T2, parent quyết
  cuối.** Requeue duy nhất eid 10428, run 178,
  13:08:11.248Z = btime +36,248 s, TRONG dải [33; 49,8],
  cách biên DƯỚI 3,248 s, cách biên TRÊN 13,552 s — KHÔNG sát
  biên (offset thật ∈ (35,248 s, 36,248 s], caveat phân số
  KHÔNG lật được). 1 run sống tại btime. **n ứng viên 36/37 →
  37/38** (nếu parent chấp nhận #91 ÂM + #92 ÂM đợt 178 rồi
  #93 DƯƠNG).
- **INSIDE #93: TRUE (FULL139) — chuỗi 3 → 4.** Hai dải MÂU
  THUẪN ngược hướng lần thứ 8 (FULL139 TRUE, biên trên
  1.195 s; FULL138 FALSE, trễ 5.624 s) — dải phương pháp chi
  phối theo F-165-T2-1.
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 15 không đổi);
  hole-recheck lần 23 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới —
  lần thứ 23 liên tiếp); U file-gap max TĂNG 3.530 → 8.322 s
  do mở rộng cửa sổ tới B1 (khoảng lặng giữa đợt 15:16:54Z →
  17:35:36Z 23/11, không phải mốc mới); 3 exec-log bị prune
  (2a68c5ee9e4f, 506c2c48e69a, 498dc39ec461 — đã xác nhận GONE).
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 22 không thu hẹp** (6
  hướng DB MỚI (xxviii)–(xxxiii) đều âm tính/rỗng; tổng 83
  hướng; file-based ÂM TÍNH).
- **EPERM probe #97: ok=2 fail=0** (17:42:16Z, boot ae2a9a47).
  Sweep #97: 190 *.log, 4 file có marker (11 lần) — TẤT CẢ
  trích dẫn trong log đợt 178, **0 sóng thật**. Sóng EPERM
  thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Run 178 TIMEOUT** 14:36:29Z (38 s SAU hạn 14:35:51Z;
  claimed→finished 7 s; viết lại ×1 tại #93) — số liệu DB
  tươi; kết cục thuộc T7-179.
- **Tuân thủ luật script nặng đợt 179: 0 chồng chéo** — T2
  CHỜ poller T4 thoát hẳn (attempt1 xong 18:13:27Z) rồi mới
  chạy walk mù (18:14:58Z); F-179-T4-5 (ghi nhẹ 18:13:20Z
  trong cửa sổ attempt) KHÔNG phải của T2 — xem §4.2.

## §1. Điểm (m)

### §1.1 (m) #93 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #93: 13:07:35Z** (epoch 1795439255), boot 97054ac6,
  gap #92→#93 = 7.568 s. **T0-179 XÁC NHẬN** (cờ 18:14Z):
  T7-178 xác minh 9 nguồn trong 64 s sau btime; T4-178 xác
  nhận độc lập btime + gap; T0-179 đối chiếu DB (boot_gen
  dcf769fa → 92e3cfb8; requeue eid 10428 = btime +36,248 s,
  TRONG band — khớp T7-178). Marker sống qua 46 reboot
  #49–#94. Hạn chế: journal/wtmp hiện chỉ còn #94 nên T0-179
  không đọc lại trực tiếp 9 nguồn địa phương của #93 — xác
  minh dựa trên bản ghi trong phiên của T7-178 + đối chiếu DB.
- T2-179 xác minh độc lập từ DB tươi (muse.db, đọc ~17:45Z):
  **requeue duy nhất** trong cửa hẹp [13:07:35Z, 13:26:35Z]:
  **eid 10428, run 178 (1949f57a), event
  `requeued_after_restart`, 13:08:11.248160Z = btime +36,248 s,
  TRONG dải [33; 49,8].** Cửa hẹp đã khép hẳn lúc đọc. 7
  `requeued_after_restart` ngày 23/11 (#86/#87/#88/#90/#91/
  #92/#93) — eid 10428 là cái thứ 7, đúng của #93.
- Run 178: 5 event — dispatched 11:35:51.165Z eid 10404;
  requeued_after_restart 13:08:11.248Z eid 10428 (#93);
  dispatched 13:08:11.642Z eid 10429; reattached_after_restart
  13:08:11.725Z eid 10430; timeout 14:36:29.756Z eid 10447.
  **Đúng 1 lần viết lại** (tại #93). Cửa hẹp còn 3 event khác:
  reconciled 13:15:34.061Z eid 10431 + DR dispatched/succeeded
  13:15:34.136Z/183Z eid 10432/10433 (heartbeat run
  79b9fd1e) — không phải requeue.
- **Đúng 1 run sống tại btime #93** (vcut-build-loop,
  scheduled ≤ btime AND finished > btime, DB tươi): run 178
  (sched 11:35:51Z, finished 14:36:29Z timeout). Không run
  nào khác.
- **Caveat phân số: offset thật ∈ (35,248 s, 36,248 s]** —
  DƯƠNG với mọi δ ∈ [0, 1 s] (δ = 1 s → 35,248 s, vẫn TRONG
  2,248 s). **KHÔNG CẦN boot_est #93** (chưa có lúc viết;
  margin 3,248 s >> 1 s). Prior δ #90 (+0,32 s) → 35,928 s;
  prior δ #92 (+0,396 s) → 35,852 s — đều TRONG, đồng thuận.
- **Caveat overlap (KHÔNG lật verdict, tiền lệ #87/#90):**
  poll T4-178 #118 dòng cuối 13:07:43Z = btime +8 s biểu kiến;
  watcher-178 dòng cuối 13:07:57Z = btime +22 s biểu kiến
  (boot 985bc2a3 — FILE KẾT THÚC, chết theo #93). Lấy +22 s
  theo nghĩa đen thì offset ~14 s — NGOÀI dải dưới. Nhưng
  tiền lệ đứng nói overlap là caveat, KHÔNG BAO GIỜ lật
  verdict btime — áp dụng đối xứng với #91 (ở #91 lấy overlap
  theo nghĩa đen sẽ lật ÂM→DƯƠNG; ở #93 sẽ lật DƯƠNG→ÂM;
  cả hai đều KHÔNG lật).
- **Phán: (m) #93 DƯƠNG — parent quyết cuối. n ứng viên
  36/37 → 37/38** (nếu chấp nhận #91 ÂM + #92 ÂM đợt 178).
  **n chính thức GIỮ 14.**

### §1.2 (m) #94 — KHÔNG phân loại ở đây (thuộc T2-180)

- **Btime #94: 17:17:09Z** (epoch 1795454229), boot ae2a9a47,
  gap #93→#94 = 14.974 s (~4h10m — dài nhất trong chuỗi gần
  đây; tốc độ reboot tới #94: 170 / 308,98 h = 1 lần /
  109,1 phút). **T0-179 XÁC NHẬN 9 nguồn trực tiếp** (cờ
  18:14Z). T2-179 xác minh trực tiếp: /proc/stat btime +
  uptime -s 17:17:09Z + boot_id ae2a9a47 + probe #97 dòng
  boot-change. Marker sống qua 46 reboot #49–#94.
- Số thô ghi nhận cho T2-180: **0 requeue** trong cửa hẹp
  [17:17:09Z, 17:36:09Z] (đã khép lúc T2 đọc); run hiện tại
  f253dced (sched 17:35:51Z) started 17:35:51Z, running, chưa
  viết lại. **#94 KHÔNG ảnh hưởng (m) #93** (xảy ra 4h09m
  sau khi cửa hẹp #93 khép).

### §1.3 Run 178 kết cục (số liệu; kết cục thuộc T7-179)

- **status TIMEOUT, finished_at_utc 1795444589.756 =
  14:36:29Z — 38 s SAU hạn 14:35:51Z** (T7-178 đóng cờ lúc
  run vẫn running, còn 1.998 s tới hạn; run không kịp).
  **claimed_at_utc 1795444582 = 14:36:22Z; claimed→finished
  = 7 s**; wall từ sched gốc = 10.838 s; started_at_utc
  1795439291 (= 13:08:11Z, viết lại tại #93); boot_gen cuối
  cron_boot_92e3cfb8... (#93). Attempt 1.
- **7 s < 60 s — KHÔNG phải ca claimed→finished ≥60 s**
  (số ca GIỮ 9, nếu T7-179 đồng ý). **Phân loại cuối thuộc
  T7-179 + parent** — T2 chỉ ghi số liệu DB tươi.
- Ghi nhận thêm (không phải verdict T2): run 17c51ba6 (sched
  14:35:51Z) SUCCEEDED 14:53:32Z, claimed→finished 8 s,
  started 14:36:29Z (= đúng lúc run 178 timeout), boot_gen
  cron_boot_92e3cfb8... (#93).

## §2. INSIDE — dải FULL139

Script: `m-check179.py` (log `m-check179.txt`; exec
`m-check175b.py` — FULL133 p10/p90 khớp bằng assert
1596,60/8811,20; FULL134 khớp T2-176 1605,40/8803,30;
FULL135 khớp T2-176 1569,40/8795,40; FULL136 khớp T2-177
1571,00/8787,50; FULL137/FULL138 in lại khớp số đợt 178).
Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1).

- **FULL139**: n=139, mean 1h40'33", median 1h54'16", p10
  1575,80 s, p90 8763,80 s, sd 0h54'08", in 90–150'=76,
  <60'=32, >180'=9, >240'=3 (= FULL138 + [gap #93 =
  7.568 s]).
- **INSIDE #93: TRUE (FULL139)** — dải [11:27:42Z,
  13:27:30Z] neo 11:01:27Z (#92); btime #93 13:07:35Z TRONG
  dải, cách biên dưới 5.993 s, cách biên trên 1.195 s.
  **Chuỗi 3 → 4.** Đối chiếu vs FULL138 (neo #91): FALSE
  (dải [09:33:54Z, 11:33:51Z], trễ 5.624 s) — **hai dải MÂU
  THUẪN ngược hướng (lần thứ 8)**; dải phương pháp FULL139
  chi phối theo F-165-T2-1 (F-179-T2-3). (Số hiệu #93 đã được
  T0-179 xác nhận.)
- Tốc độ reboot: tới #93: 169 reboot / 304,82 h = 1 lần /
  108,2 phút; tới #94: 170 / 308,98 h = 1 lần / 109,1 phút
  (gap #94 = 14.974 s kéo giãn nhẹ).

## §3. Mù

B0 = 11:15:18Z 21/11 (btime #64), B1 = 18:14:37Z 23/11 (giờ chạy
thực tế, F-172-T2-12); cửa sổ 197.959 s. Walk chạy 18:14:58–
18:16:31Z (script `blind9797-investigate.py`, log cùng tên) —
**SAU khi poller T4 thoát hẳn** (attempt1 xong 18:13:27Z; xem
§4.2). Sàn (floor) 19'07" = 1.147 s (đứng từ đợt 162).
**Lưu ý phương pháp (F-179-T2-4):** bản sao script đợt 178
ban đầu vẫn giữ U-end cũ 13:09:46Z (bằng B1 đợt 178) ở
merged/content/sessions — T2 phát hiện trước khi kết luận,
sửa U-end về B1 18:14:37Z và chạy LẠI merged + content +
sessions; số liệu dưới đây là bản chạy lại (khác bản chạy
đầu ở U).

### §3.1 Walk + file-marks (merged/content)

- Số file có mtime trong cửa sổ: repo-1 **990** (đợt 178: 732),
  hidden_files **6.615** (6.323), outside **2.489** (2.442),
  /tmp **629** (0 — đã có file mới trên boot #94).
- Merged unique second-marks: **4.794** (178: 4.512).
- **R file (raw): 13 marks, MAX GAP 1.238 s** (11:15:29Z →
  11:35:56Z) — **OPEN, lần thứ 15 liên tiếp KHÔNG ĐỔI.**
  R union-A 1.222 s / union-B 1.211 s — OPEN.
- S file: 226 marks, max 3.235 s (13:01:51Z → 13:55:46Z) —
  OPEN; S union-A 662 s / union-B 591 s — CLOSED.
- T file: 211 marks, max 627 s — CLOSED; T union-A 38 s —
  CLOSED.
- **U file: 4.346 marks, max 8.322 s** (15:16:54Z →
  17:35:36Z 23/11) — **OPEN, TĂNG từ 3.530 s** (đợt 178).
  Nguyên nhân: **mở rộng cửa sổ tới B1** — khoảng lặng giữa
  đợt (sau hoạt động cuối 15:16:54Z, trước dispatch đợt 179
  17:35:36Z), ôm cả btime #94 (17:17:09Z) mà KHÔNG có file
  mark nào — khoảng lặng thật giữa hai đợt, không phải mốc
  mới. Hố cũ 3.530 s (09:55:21Z → 10:54:11Z 22/11) vẫn đó,
  nay là hố lớn thứ hai. U union-A 8.322 s — OPEN;
  **U union-B 8.322 s — OPEN** (chỉ số cũ 1.118 s, cách sàn
  29 s, nay chỉ còn là hố lớn thứ ba trong U mở rộng — theo
  dõi bằng hố mới 8.322 s thay cho mốc cũ).
- R-head 0; R-tail repo-1=2 / hidden_files=51 / outside=2 /
  tmp=0 (như 178). U-tail mới (17:55:30–18:14:37Z): repo-1=4 /
  hidden_files=108 / outside=35 / tmp=628.

### §3.2 Sessions + witness (exec-log)

- Exec-logs có mtime trong cửa sổ: **306** (178: 330); mtime
  trong R/S/T: **0/0/0**, trong U: 306.
- Jump witness #64–#86 (sau khi trừ T2-177 + T2-178 +
  T2-179, xem F-179-T2-5): **GIẢM 2 ở hầu hết các reboot so
  với đợt 178** — #64: 3, #65: 3, #66: 3, #67: 3, #68: 3,
  #69: 3, #70: 3, #71: 3, #72: 5, #73: 5, #74: 5, #75: 5,
  #76: 5, #77: 5, #78: 5, #79: 5, #80: 5, #81: 5, #82: 5,
  #83: 5, #84: 8, #85: 4, #86: 3. **Nguyên nhân: pruning
  xóa 3 exec-log** (đã xác nhận GONE):
  proc_2a68c5ee9e4f.log (witness #64–#82),
  proc_506c2c48e69a.log (witness #65–#81),
  proc_498dc39ec461.log (witness #81) — không phải mốc mới,
  chỉ mất witness do pruning (cùng họ F-177-T2-9/F-178-T2-9).
- Witness #87–#94 (script `witness879394.py`, trừ dir T2-177 +
  T2-178 + T2-179 + mọi log chứa marker T2): **#87: 4, #88: 2,
  #89: 2, #90: 2 (KHÔNG ĐỔI so với đợt 177/178)** — cùng 2
  file cũ T9-174 (proc_f4c14c9e5897.log +
  proc_910b750ec4a6.log — đã kiểm đợt 175, trích dẫn/linger).
  **#91: 4 thô → 2 thật; #92: 3 thô → 2 thật** — cùng 2 file
  T9-174 trên (2 file "thừa" là trích dẫn đã kiểm tay đợt
  178). **#93: 6 thô → 2 thật** — cùng 2 file T9-174; 4 file
  "thừa" đã kiểm tay, đều là ARTIFACT, không phải hoạt động
  thật tại btime #93:
  (a) proc_1b7ffb82b7fb.log + proc_d764233af824.log (agent
  0a2ffa0b — log sampler T9-178 lan-4: 1 mẫu thật 13:07:29Z
  TRƯỚC btime, boot cũ; span 13:07:29–13:07:44Z do header
  framework 13:07:42/44Z theo đồng hồ boot cũ nhanh — cùng
  họ overlap #91/#93);
  (b) proc_a7b044dbc0d6.log (log poller T4-178: span do trích
  btime #92 11:01:27Z trong header + deadline 13:30:00Z);
  (c) proc_36dec3e212c5.log (log khởi động lại tay của T4 lúc
  13:09:15Z trên #93 — hoạt động SAU btime, đã biết; span do
  trích header poller cũ). **Kết luận: 0 hoạt động thật mới
  tại #93.**
- **#94: 2 thô → 2 thật** — cùng 2 file T9-174 trên (linger/
  trích dẫn đã biết). 0 hoạt động thật tại #94.
- Content-ts trong hố R union (11:15:29–11:35:40Z): **2 hit**
  — 11:16:22Z + 11:35:35Z (mốc biên R1-old đã biết), cùng 1
  file còn sống proc_52cb85ef2a58.log (bản sao 11:16:22Z kia,
  proc_2a68c5ee9e4f.log, đã bị prune — xem trên). Content-ts
  trong hố U mới (15:16:54–17:35:36Z 23/11): **14 hit, TẤT
  CẢ tại 17:17:09Z** — trích btime #94 trong log poll/header
  của các luồng đợt 179 (T4 poll #33/#34, ghi chú T5...),
  viết SAU dispatch 17:35:51Z — không phải hoạt động trong
  hố. **0 mốc mới.**

### §3.3 Hole-recheck lần 23 (NEW=0 mọi hố)

Script `hole-recheck9797.py`, chạy 18:21:08–18:22:44Z, log
`hole-recheck179.log` + `holerecheck-all.txt` (B1 đã kiểm bằng
`grep ^W =` / `grep ^hi =` trước khi chạy; 1 dòng stderr
`find: /home/hatch/.stagged-uploads: Permission denied` —
không ảnh hưởng).

- **H-E1-88 (19:32:59–20:17:30Z 20/11): inside=337,
  float-trap=337, NEW=0** — lần thứ 23 liên tiếp 0 mới.
- H-U7 (10:08:01–10:28:06Z 22/11): inside=0, NEW=0; H-U8
  (10:33:43–10:53:31Z): inside=0, NEW=0 — 2 hố vẫn trống.
- Mọi hố khác đều NEW=0 (H-R1/H-R1-old/H-S1/H-S2/H-T1/H-U1/
  H-U2-old/H-U4/H-U5/H-U6/H-U9/H-U10/H-U14/H-U15 inside 0–3,
  đều float-trap đã biết; H-S3/H-U2/H-U3/H-U11/H-S4/H-T2/
  H-U12/H-U13 inside 1–10, đều float-trap đã biết).

### §3.4 Kết luận mù

- **Mù #96? (#64) VẪN MỞ** — R file 1.238 s lần thứ 15 không đổi;
  không mốc mới nào trong cửa sổ.
- **Mù #95? (#63) / #94? (#62) / #88? / #77?: VẪN MỞ** —
  hole-recheck lần 23 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới).
- **CERT/FULL GIỮ 76/91** (vì #77? và #88? vẫn mở).
- U file-gap max nay 8.322 s (hố lặng giữa đợt) — chỉ số
  "U union-B cách sàn 29 s" đợt 178 không còn dùng được;
  theo dõi hố mới 8.322 s.

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ script nặng

### §4.1 (m) #56 — lần thứ 22, KHÔNG THU HẸP (6 hướng DB MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1). Cửa ứng viên [19:33:20Z, 19:33:37Z] = epochs
1795203200..1795203217 (= btime #56 + [33 s, 49,8 s]). Run 156:
run_id 9c7b6986-46fd-4a31-beea-2e36272d1d26, sched 1795196151
(17:35:51Z), started 1795201518 (19:05:18Z), finished 1795205974
(20:19:34Z), succeeded, request_id NULL.

- **(xxviii) DB `agent.sessions` created_at trong W (MỚI):
  0 dòng. ÂM TÍNH.**
- **(xxix) DB `agent.sessions` updated_at trong W (MỚI):
  0 dòng. ÂM TÍNH.**
- **(xxx) DB `scheduler.terminal_signals` created_at trong W
  (MỚI — mọi run): 0 dòng. ÂM TÍNH.**
- **(xxxi) DB `scheduler.delivery_outbox` created_at trong W
  (MỚI — mọi run): 0 dòng. ÂM TÍNH.**
- **(xxxii) DB `runtime.requests` created_at trong W (MỚI):
  ĐÚNG 1 dòng** — maintenance:e033d2dd-...:context_retention:
  phase-29920054, origin internal.runtime_storage, root NULL,
  work_class internal, ts 1795203215.041Z = 19:33:35.041Z
  (TRONG W). **ÂM TÍNH cho #56:** đây là 1 dòng của nhóm
  maintenance e033d2dd đã biết (hướng (ii): 137 dòng root
  NULL, max 20:22:35Z) — context-retention của runtime,
  KHÔNG phải hoạt động của run 156.
- **(xxxiii) DB `scheduler.job_runs` started_at trong W (MỚI
  — mọi run): 0 dòng. ÂM TÍNH.**
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức GIỮ 14.**
  Tổng 83 hướng âm tính/rỗng liên tiếp (77 tới đợt 178 + 6
  hướng mới đợt này).
- **Hướng file-based (vii)/(viii)/(vii-b)/(vii-c) (m56-179.py,
  chạy ~18:23Z): (vii) 0 file có mtime trong W
  [19:33:20–19:33:37Z]; 333 file trong D, max mtime
  20:15:33.130Z (< mốc max 20:19:34Z — KHÔNG file mới);
  (viii) 0 exec-log có mtime trong D; (vii-b) 0 file tại
  20:16:00–20:17:00Z; (vii-c) 0 file tại 20:19:30–20:19:40Z.
  ÂM TÍNH — lần thứ 22 không thu hẹp.**

### §4.2 Tuân thủ luật script nặng đợt 179 — 0 chồng chéo

- T4-179 mở poller 17:44:40Z (pid 28560, gate0wait, hạn
  19:30Z). T2-179 **KHÔNG khởi động script nặng nào** trong
  lúc poller chạy: probe #97 (nhẹ, ~1 s) + truy vấn DB +
  m-check + chuẩn bị script (chỉ sửa file) + grep có đích
  đều nhẹ. **Chờ poller thoát bằng waiter nền** (kiểm `ps`
  mỗi 60 s; chỉ đọc `tail` poll-t4.log mỗi ~2–5 phút).
- **Cửa yên MỞ poll #34 18:09:31Z** (gate0=T5 POSTBOOT_PASS
  #94 repair-sớm poll=1 18:03:08Z + gateA RAM 1.535 MB);
  **attempt1 18:09:31–18:13:27Z: 20/20 + B 5/5, tickCost
  median 49,5 ms — LƯỢT YÊN HỢP LỆ #48, chuỗi 41 → 42**
  (thuộc T4-179; T2 chỉ ghi lại từ cờ T4). Poller thoát
  ngay sau attempt (exit 0); T2 xác minh trực tiếp bằng `ps`
  18:14:22Z: không còn process poll-wait/run-attempt nào.
- **Walk mù chạy 18:14:58–18:16:31Z — SAU khi poller thoát
  91 s, SAU khi attempt kết thúc 91 s.** Merged/content/
  sessions/witness 18:16:3x–18:16:45Z; hole-recheck
  18:21:08–18:22:44Z; m56 + sweep ~18:22–18:24Z — TẤT CẢ
  sau attempt. **0 chồng chéo với attempt1. Chuỗi 0 vi phạm
  đếm lại từ 0 ở đợt 179 — đợt này GIỮ SẠCH (chờ parent
  xác nhận, xem F-179-T2-8).**
- **F-179-T4-5 (ghi nhẹ 18:13:20Z trong cửa sổ attempt —
  KHÔNG phải của T2-179).** File `round109-k7/analyze-k7-
  skiplatest.txt` (2.084 B, mtime 18:13:20.013Z, 7 s trước
  khi attempt kết thúc) — T4 nghi "T2 chạy lại analyzer k7
  cũ". **Bằng chứng T2 KHÔNG làm:** (1) exec-log của agent
  T2-179 (52dfc922...) KHÔNG chứa chuỗi nào "round109-k7"
  hay "skiplatest"; (2) trong cửa sổ attempt T2 chỉ chạy
  `process.poll` chờ waiter + đọc `tail`/`ps` nhẹ — không
  chạy script phân tích nào; (3) file đó là **output mặc
  định của chính script `analyze-t4-skiplatest.py` của T4**
  (`SCRATCH = .../round109-k7`, outpath mặc định
  `round109-k7/analyze-k7-skiplatest.txt`) — T4 chạy các
  analyzer per-pass trên dữ liệu attempt1; (4) exec-log của
  agent T4-179 (29fefc1b) liệt kê file này với md5 khớp nội
  dung hiện tại. T2 KHÔNG khẳng định chắc chắn process nào
  đã ghi (không có ps bắt tại chỗ) — chỉ khẳng định KHÔNG
  phải T2, và ứng viên khả dĩ nhất là analyzer của chính T4.
  Parent quyết theo tiền lệ F-178-T2-8.
- Lưu ý: gate0 chuyển xanh poll #26 (~18:03:29Z, T5 viết
  POSTBOOT_PASS #94 18:03:08Z, repair-sớm, poll=1, dpkg 795);
  gateA RAM <1.024 MB trong phần lớn thời gian chờ (tối thiểu
  ~468 MB, Balloon kẹt) rồi hồi lên 1.535 MB ở poll #34.
  Bài học F-176-T2-11 vẫn đứng: chờ poller thoát hẳn, không
  dựa vào guard giết giữa chừng.

## §5. EPERM probe #97 + sweep

- **Probe #97: chạy 17:42:16Z, boot ae2a9a47, ok=2 fail=0, exit 0.**
  Log `hidden_files/eperm-probe-v2.log` 272 → 274 dòng (+1
  boot-changed, +1 probe#97); heartbeat n=97.
  **MemAvailable lúc probe: 905.712 kB.** Cửa sổ probe #97:
  11:42:49Z (#96) → 17:42:16Z = 21.594 s. **Lưu ý: probe #97
  bỏ qua cả #93 lẫn #94** (không probe nào chạy trong đời
  #93 13:07–17:17Z; probe đầu tiên trên #94 là #97 lúc
  17:42:16Z). Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #97** (script `eperm-sweep9797.py`, log
  `eperm-sweep179.log`, chạy ~18:24Z, sau khi attempt kết
  thúc): **190 *.log có mtime trong cửa sổ probe**
  [11:42:49Z, 17:42:16Z]; **4 file có marker (11 lần)** —
  proc_a3be12f5f0d5.log ("sóng EPERM đã tắt" ×1 — log O8
  T0-178 11:58:09Z, trích dẫn), o8-178t0.log ("sóng EPERM đã
  tắt" ×3), eperm-sweep178.log ("Operation not permitted" ×1
  + "sóng EPERM đã tắt" ×3), o8-178t8.log ("sóng EPERM đã tắt"
  ×3) — **TẤT CẢ là trích dẫn trong log đợt 178, 0 sóng thật.**
  Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- Script probe: `~/workspace/repo-1/scripts/probe-eperm-v2.sh`; log +
  heartbeat tại `~/workspace/goals/capcut-clone-video-editor/
  hidden_files/eperm-probe-v2.log` / `.heartbeat`.

## §6. Phương pháp, sai số, câu hỏi cho parent

### §6.1 Phương pháp

- DB đọc tươi qua `muse.db` (bảng `scheduler.job_runs` +
  `scheduler.events` + `runtime.requests` +
  `scheduler.terminal_signals` + `scheduler.delivery_outbox` +
  `agent.sessions`); `muse.db` từ chối `to_timestamp` — dùng
  literal `'YYYY-MM-DD HH:MM:SS+00'::timestamptz` +
  `EXTRACT(EPOCH FROM created_at)` / cột `*_utc` bigint.
  `events.run_id`/`job_runs.run_id` là UUID ĐẦY ĐỦ — tra bằng
  short id trả 0 dòng. Mọi số (m)/INSIDE đều có trong script
  đối chiếu độc lập `m-check179.py` (log `m-check179.txt`).
- INSIDE tính bằng `m-check179.py` (log `m-check179.txt`);
  FULL134/FULL135/FULL136 p10/p90 khớp T2-176/T2-177 bằng
  assert trong script; FULL137/FULL138 in lại khớp số đợt 178.
- (m) #93: KHÔNG cần boot_est (margin 3,248 s >> 1 s); prior
  δ #90 (+0,32 s) và δ #92 (+0,396 s) đều cho offset TRONG
  dải — đồng thuận, không như #91 (hai prior trái chiều).
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness
  TRỪ exec-log T2-177 (ec756e29) + T2-178 (b387ac70) +
  T2-179 (52dfc922, agent hiện tại) + TRỪ mọi log chứa marker
  T2 ("m-check17", "FULL13", "round178-t2", "round179-t2")
  (F-178-T2-4); kiểm `grep ^W =` / `grep ^hi =` trước khi
  chạy hole-recheck; output vào thư mục riêng, không ghi đè
  file cũ (F-166-T2-2); kiểm epoch GAP bằng `date -d` trước
  khi chạy sessions; chụp meminfo cùng lệnh probe
  (F-172-T7-2-7). **Chờ T4 đóng attempt + poller thoát hẳn
  rồi mới chạy script nặng** (F-176-T2-11).
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.

### §6.2 Sai số / caveat (F-179-T2-*)

- **F-179-T2-1 — (m) #93 DƯƠNG ở cấp T2, parent quyết cuối;
  caveat overlap KHÔNG lật verdict.** Offset btime 36,248 s,
  TRONG dải 3,248 s; offset thật ∈ (35,248 s, 36,248 s] —
  caveat phân số KHÔNG lật được (cần δ ≥ 1 s mới ra ngoài,
  δ tối đa < 1 s). Overlap +8 s (poll T4) / +22 s (watcher)
  lấy theo nghĩa đen sẽ lật thành ÂM — tiền lệ #87/#90 cấm
  lật bằng overlap (áp dụng đối xứng với #91).
- **F-179-T2-2 — (m) #94: T0-179 ghi "KHÔNG CÓ ĐIỂM" (0
  requeue cửa hẹp + cửa rộng).** Phân loại (m) #94 thuộc
  T2-180 — T2-179 chỉ ghi số thô (0 requeue trong
  [17:17:09Z, 17:36:09Z]); theo tiền lệ hòa giải (m) #92
  đợt 178, nhãn phân loại cuối là việc của cấp phân loại
  (T2-180 + parent), không phải nhãn khảo sát của T0.
- **F-179-T2-3 — INSIDE #93 TRUE nhưng hai dải MÂU THUẪN
  ngược hướng lần thứ 8.** FULL139 TRUE (biên trên 1.195 s);
  cross-check FULL138 FALSE (trễ 5.624 s). T2 áp dụng kỷ
  luật F-165-T2-1 (dải phương pháp chi phối), như tiền lệ
  #79/#82/#83/#85/#86/#87/#88/#89/#91/#92. Chuỗi 3 → 4 phụ
  thuộc kỷ luật này; nếu parent không đồng ý, chuỗi theo dải
  cũ vẫn đứt từ #89 — parent quyết.
- **F-179-T2-4 — Lỗi U-end cũ trong bản sao script (SỬA Ở
  ĐỢT NÀY, không đổi verdict mù).** Bản sao từ đợt 178 giữ
  U-end 13:09:46Z (= B1 đợt 178) ở merged/content/sessions;
  bản chạy đầu đã cắt U ở 13:09:46Z. T2 phát hiện, sửa U-end
  về B1 18:14:37Z và chạy LẠI cả ba — số liệu trong file này
  là bản chạy lại. Bài học: khi sao script, thay B1 ở MỌI
  chỗ dùng (SEG + B0/B1 + U-end), không chỉ dòng B1.
- **F-179-T2-5 — Mù: #64–#86 mất witness do pruning 3
  exec-log (SỬA SỐ, không đổi verdict).** proc_2a68c5ee9e4f
  (#64–#82), proc_506c2c48e69a (#65–#81), proc_498dc39ec461
  (#81) — cả ba đã xác nhận GONE. #64: 4 → 3; #65–#71:
  5 → 3; #72–#81: 7 → 5; #82: 6 → 5; #83–#86 không đổi.
  R file 1.238 s lần thứ 15 không đổi; hole-recheck lần 23
  NEW=0 mọi hố; **U file-gap max TĂNG 3.530 → 8.322 s do mở
  rộng cửa sổ (khoảng lặng giữa đợt 15:16:54Z → 17:35:36Z,
  ôm btime #94, 0 mark) — không phải mốc mới; chỉ số "U
  union-B cách sàn 29 s" đợt 178 không còn dùng được.**
- **F-179-T2-6 — (m) #56: 6 hướng DB mới đều âm tính/rỗng
  (lần thứ 22 không thu hẹp).** Tổng 83 hướng. (xxxii) là
  hướng duy nhất có dòng: 1 dòng maintenance e033d2dd
  context_retention trong W — thuộc nhóm đã biết (ii), KHÔNG
  phải hoạt động run 156.
- **F-179-T2-7 — Run 178 TIMEOUT 14:36:29Z (số liệu; kết cục
  thuộc T7-179).** 38 s SAU hạn 14:35:51Z, claimed→finished
  7 s (KHÔNG phải ca ≥60 s — số ca GIỮ 9, nếu T7-179 đồng
  ý). Run 179 (sched 17:35:51Z) running lúc T2 đọc; kết cục
  thuộc T7-180.
- **F-179-T2-8 — Tuân thủ luật script nặng: 0 chồng chéo đợt
  này (parent xác nhận?).** Walk 18:14:58Z chạy SAU khi
  poller thoát (attempt xong 18:13:27Z, xác minh `ps`
  18:14:22Z); mọi script nặng sau attempt. **F-179-T4-5
  (ghi nhẹ 18:13:20Z trong cửa sổ attempt) KHÔNG phải của
  T2-179** — bằng chứng §4.2 (exec-log T2 không chứa
  "round109-k7"/"skiplatest"; file là output mặc định của
  chính analyzer T4 `analyze-t4-skiplatest.py`). Parent
  quyết có tính vi phạm không — và ghi nhẹ đó thuộc về ai.
- **F-179-T2-9 — #93/#94 XÁC NHẬN (T0-179, cờ 18:14Z).**
  #94 trực tiếp 9 nguồn; #93 qua T7-178 + T4-178 + đối
  chiếu DB (nợ đợt 178 đã trả); marker 46 reboot. **#93
  KHÔNG CÓ POSTBOOT_PASS — ĐÃ XÁC NHẬN (T5-179), tổng boot
  không cờ 19 → 20.** POSTBOOT_PASS #94 CÓ (repair-sớm,
  poll=1, 18:03:08Z, dpkg 795) — gate (a) cho attempt1 #48.

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 179)

- **(a) (m) #93 DƯƠNG — chấp nhận?** (requeue +36,248 s,
  TRONG dải [33; 49,8], cách biên dưới 3,248 s; 1 run sống;
  caveat phân số KHÔNG lật được; overlap +8/+22 s không lật
  verdict theo tiền lệ #87/#90.) Nếu chấp nhận: n ứng viên
  36/37 → 37/38.
- **(b) INSIDE #93 TRUE — chấp nhận chuỗi 3 → 4?**
  (FULL139; hai dải mâu thuẫn ngược hướng lần thứ 8; dải
  phương pháp chi phối theo F-165-T2-1.)
- **(c) Mù #96? VẪN MỞ — chấp nhận giữ mở?** (R file 1.238 s
  lần thứ 15 không đổi; hole-recheck lần 23 NEW=0 mọi hố;
  U file-gap max 8.322 s do khoảng lặng giữa đợt — không
  phải mốc mới; 3 exec-log bị prune.)
- **(d) Mù #88? VẪN MỞ — chấp nhận?** (hole-recheck lần 23:
  H-E1-88 inside=337, NEW=0 — lần thứ 23 liên tiếp 0 mới;
  #95?/#94?/#77? cũng MỞ; CERT/FULL GIỮ 76/91.)
- **(e) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều
  kiện?** (lần thứ 22 không thu hẹp; 6 hướng DB mới đều âm
  tính/rỗng, tổng 83 hướng.) n chính thức GIỮ 14.
- **(f) Tuân thủ luật script nặng đợt 179 — 0 chồng chéo:
  parent xác nhận chuỗi 0 vi phạm đếm lại từ 0?**
  (Walk 18:14:58Z sau khi poller thoát; F-179-T4-5 KHÔNG
  phải của T2 — bằng chứng §4.2; parent quyết ghi nhẹ
  18:13:20Z thuộc về ai / có tính vi phạm không.)
- **(g) EPERM probe #97 + sweep #97 — ghi nhận?** (Probe
  ok=2 fail=0, boot ae2a9a47; sweep: 190 *.log, 4 file có
  marker (11 lần) — TẤT CẢ trích dẫn trong log đợt 178,
  0 sóng thật; probe bỏ qua cả #93 lẫn #94.)
- **(h) Run 178 TIMEOUT 14:36:29Z (38 s sau hạn,
  claimed→finished 7 s — KHÔNG phải ca ≥60 s, thuộc T7-179)
  — ghi nhận cho T7-179?** (Không phải verdict của T2.)
- **(i) T0-179: #94 XÁC NHẬN 9 nguồn; #93 XÁC NHẬN (nợ đợt
  178 đã trả); marker 46 reboot; (m) #94: 0 requeue ("KHÔNG
  CÓ ĐIỂM" theo T0 — phân loại thuộc T2-180); POSTBOOT_PASS
  #94 CÓ (repair-sớm, poll=1); #93 KHÔNG CÓ cờ (tổng boot
  không cờ 19 → 20) — ghi nhận?** (Thuộc T0/T5-179.)
- **(j) Lượt yên #48 CÓ lượt hợp lệ (attempt1 20/20 + B 5/5,
  median 49,5 ms; chuỗi 41 → 42) — ghi nhận cho T4-179?**
  (Không phải verdict của T2.)
