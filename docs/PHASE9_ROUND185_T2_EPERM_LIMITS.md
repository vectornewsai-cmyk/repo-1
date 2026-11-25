# PHASE 9 — ROUND 185 — T2 EPERM LIMITS

**T2 đợt 185** — EPERM probe #104, phân loại (m) #103 **DƯƠNG
(CUỐI)** + INSIDE #103 TRUE (FULL149, chuỗi 4 → 5), mù #96?/#88?/
#94?/#95?/#77?, (m) #56 lần 28.
Đợt 185 mở 11:35:51Z 24/11/2026 (18:35:51 +07; lượt cron 18:35
+07). Boot lúc mở đã là 9161bfd1 (#104, btime 11:13:42Z) —
reboot #104 xảy ra TRƯỚC khi đợt mở (trong lúc T10-184 đóng
sổ / giữa hai đợt).
**Số hiệu #103: T0-185 ĐÃ XÁC MINH 9 nguồn** (cờ 11:48Z —
boot e0921bda, btime 09:14:55Z, gap #102→#103 = 7.670 s; hạn
chế: journal/wtmp #103 không đọc tươi lại được — đối chiếu
hồ sơ lưu + DB tươi). **Số hiệu #104: T0-185 ĐÃ XÁC MINH 9
nguồn TƯƠI** (boot 9161bfd1, btime 11:13:42Z, gap #103→#104
= 7.127 s — KHỚP phép tính độc lập của T2). Phân loại dưới
đây là **phân loại cuối ở cấp T2 — parent quyết cuối**.
**Run 184 SUCCEEDED 11:16:07Z** (số liệu DB tươi + T0-185
độc lập KHỚP; kết cục thuộc T7-185).
**Tuân thủ luật script nặng đợt 185: KHÔNG VI PHẠM (xem
§4.2)** — mọi script nặng đều chạy lúc gate ĐỎ có watchdog
trực sẵn, hoặc SAU khi poller T4-185 thoát; 0 chồng lấn với
attempt T4. Chuỗi 0 vi phạm GIỮ 0 (đã đứt về 0 đợt 183 theo
quyết (p) parent; vi phạm F-184-T2-8 thuộc đợt 184).

## §0. Headline

- **(m) #103: DƯƠNG (phân loại CUỐI ở cấp T2, parent quyết
  cuối).** Requeue duy nhất eid 10697, run 184 (b8fc08e4),
  09:15:32.543346Z = btime **+37,543 s** — TRONG dải [33; 49,8],
  KHÔNG sát biên (cách biên dưới 4,543 s, cách biên trên
  12,257 s; caveat phân số KHÔNG lật được). Overlap +9 s
  (watcher-184) KHÔNG lật verdict theo tiền lệ #87/#90 —
  #99 có overlap +22 s và parent đã chấp nhận DƯƠNG đợt 182;
  #100 có +22/+6 s và parent đã chấp nhận DƯƠNG đợt 183.
  **ĐÍNH CHÍNH: T7-184 viết "KHÔNG có overlap" — SAI**
  (xem F-185-T2-1).
- **INSIDE #103: TRUE (FULL149) — chuỗi 4 → 5.** Dải chéo
  FULL148 FALSE (muộn 5.777 s qua đầu dải) — **mâu thuẫn
  ngược hướng lần thứ 16; chuỗi mâu thuẫn mới = 4** (sau
  khi #99 đồng thuận dừng ở 12; #100 lần 13, #101 lần 14,
  #102 lần 15).
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 21 không đổi);
  hole-recheck lần 29 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới —
  lần thứ 29 liên tiếp; H-U16 3 hit, 0 mới); U file-gap max
  8.968 s KHÔNG ĐỔI; U union-B max 7.861 s KHÔNG ĐỔI.
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 28 không thu hẹp**
  (5 hướng DB MỚI (cvi)–(cx): tất cả 0 dòng; tổng 110 hướng;
  file-based ÂM TÍNH).
- **EPERM probe #104: ok=2 fail=0** (11:42:30Z, boot
  9161bfd1, bao btime #104). Sweep #104: 156 *.log trong
  cửa sổ; 3 file có marker (13 lần) — **TẤT CẢ trích dẫn,
  0 sóng thật** (sóng EPERM thật gần nhất vẫn ~11:55–
  12:11Z 11/11).
- **REBOOT #104 MỚI trước khi đợt mở** (boot 9161bfd1,
  btime 11:13:42Z, gap #103→#104 = 7.127 s — T0-185 XÁC
  MINH 9 nguồn tươi). **(m) #104 thô: 0 requeue trong cửa
  hẹp** [11:13:42Z, 11:32:42Z] (T2-185 xác minh độc lập —
  KHỚP T0-185; phân loại (m) #104 KHÔNG thuộc phạm vi T2-185
  — xem F-185-T2-2).
- **Run 184 SUCCEEDED 11:16:07Z** (margin +1.184 s TRƯỚC
  hạn 11:35:51Z; viết lại ×2; claimed→finished 48 s —
  thuộc T7-185; T2 chỉ ghi số, KHÔNG phán CA).
- **Tuân thủ luật script nặng đợt 185: KHÔNG VI PHẠM** —
  walk + merged/sessions/witness chạy lúc gate ĐỎ, watchdog
  trực sẵn, 0 kích hoạt; hole-recheck/sweep/m56-file chạy
  SAU khi poller T4-185 thoát (11:56:12Z). 0 chồng lấn với
  attempt T4; watchdog v1 kích hoạt GIẢ 2 lần trên dòng
  "CUA YEN MO" cũ (đã sửa v2, xem F-185-T2-9). Bài học
  F-184-T2-8 đã áp dụng: KHÔNG chạy script dài khi gate
  đang dao động về ngưỡng.

## §1. Điểm (m)

### §1.1 (m) #103 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #103: 09:14:55Z** (epoch 1795511695), boot
  e0921bda, gap #102→#103 = 7.670 s. **Số hiệu T0-185 ĐÃ
  XÁC MINH 9 nguồn** (cờ 11:48Z; hạn chế: journal/wtmp
  #103 không đọc tươi lại được — đối chiếu hồ sơ lưu +
  DB tươi).
- T2-185 xác minh độc lập từ DB tươi (muse.db, đọc
  ~11:40–11:42Z): **requeue duy nhất** trong cửa hẹp
  [09:14:55Z, 09:33:55Z]: **eid 10697, run 184 (b8fc08e4),
  event `requeued_after_restart`, 09:15:32.543346Z = btime
  +37,543 s, TRONG dải [33; 49,8]** (cách biên dưới 4,543 s,
  cách biên trên 12,257 s — KHÔNG sát biên; KHỚP từng số
  với số sơ bộ T7-184 +37,543 s). Cửa hẹp đã khép hẳn lúc
  đọc. Cửa hẹp còn 2 event khác: dispatched
  09:15:32.768Z eid 10699 + reattached_after_restart
  09:15:32.858Z eid 10702 (viết lại lần 1 của run 184) —
  không phải requeue.
- **Đúng 1 run sống tại btime #103** (vcut-build-loop,
  scheduled ≤ btime AND finished > btime, DB tươi): run 184
  (sched 08:35:51Z, finished 11:16:07Z succeeded). Không
  run nào khác.
- **Caveat phân số: offset thật ∈ (36,543 s, 37,543 s]** —
  DƯƠNG với mọi δ ∈ [0, 1 s]. Prior δ #90 (+0,32 s) →
  37,223 s; δ #92 (+0,396 s) → 37,147 s; boot_est #95
  (+0,99 s) → 36,553 s — đều TRONG, đồng thuận.
- **Caveat overlap (KHÔNG lật verdict, tiền lệ #87/#90):**
  watcher-184 (replay-watch-184, pid 211325) poll cuối
  09:15:04Z boot=6ecd948e (**+9 s**) — mẫu overlap thứ 17
  (F-184-T5-1 là mẫu 16 tại #102). Lấy +9 s theo nghĩa đen
  thì offset ~28,5 s — NGOÀI dải dưới. Nhưng cơ chế đã được
  xác nhận (đồng hồ cell nhanh trước #103 — T0-185 trả lời
  F-184-T2-11: KHÔNG nhảy lùi, đồng hồ nhanh, delta > 9 s)
  và tiền lệ đứng nói overlap là caveat, KHÔNG BAO GIỜ lật
  verdict btime — **#99 có overlap +22 s Y HỆT và parent
  đã chấp nhận DƯƠNG đợt 182; #100 có +22/+6 s và parent
  đã chấp nhận DƯƠNG đợt 183**. Poller T4-184: KẾT THÚC
  09:12:01Z — KHÔNG overlap. Sampler-184: mẫu #102 cuối
  09:14:24Z = btime −31 s — KHÔNG overlap. T8-184: không
  hoạt động nào gần btime #103 (harness 10:31Z + selfcheck
  09:21:02Z — đều SAU #103). b2watch: 0 dòng.
- Toàn ngày 24/11 (tới ~11:42Z): đúng 6
  `requeued_after_restart` (eid 10580 #99, 10610 #100,
  10637 #101, 10667 #102, 10697 #103, 10724 run 184 LẠI
  11:11:06.655Z — xem F-185-T2-2, KHÔNG phải requeue #104).
- **Phán: (m) #103 DƯƠNG — parent quyết cuối. n ứng viên
  45/46 → 46/47** (nếu parent chấp nhận #103 DƯƠNG).
  **n chính thức GIỮ 14.**

### §1.2 Run 184 kết cục (số liệu; kết cục thuộc T7-185)

- **status SUCCEEDED, finished_at_utc 1795518967 =
  11:16:07Z — 1.184 s TRƯỚC hạn 11:35:51Z** (1795520151);
  sched 1795509351 = 08:35:51Z; started_at (hiện tại)
  1795518666 = 11:11:06Z (**viết lại ×2** — tại #103
  09:15:32Z + tại 11:11:06Z, eid 10724/10726; T0-185: lần
  viết lại thứ hai KHÔNG do reboot); boot_gen cuối
  cron_boot_dbbf0826...; **claimed_at_utc 1795518919
  = 11:15:19Z; claimed→finished = 48 s** (<60 s — KHÔNG
  phải ca CA ≥60 s; thuộc T7-185; T2 chỉ ghi số, KHÔNG
  phán CA); **jitter 0** (started-gốc = sched); attempt 1;
  timed_out false. T0-185 tính margin +1.184 s độc lập —
  KHỚP T2 từng số (cùng đọc DB tươi).
- Run 185: RUNNING, sched=started=claimed=1795520151 =
  11:35:51Z, boot_gen cron_boot_7c896c1e... (#104),
  attempt 1, jitter 0.

## §2. INSIDE — dải FULL149 (cho #103)

Script: `m-check185.py` (log `m-check185.txt`; exec
`m-check184.py` — FULL148 p10/p90 khớp bằng assert
1574,20/8771,70; chain sau #102 = 4).
Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1). Parent đã chốt FULL148 vào
sổ đứng đợt 184 (quyết (d)).

- **FULL149**: n=149, mean 1h41'54", median 1h55'00", p10
  1575,80 s, p90 8763,80 s, sd 0h54'23", in 90–150'=84,
  <60'=33, >180'=10, >240'=4 (= FULL148 + [gap #103 =
  7.670 s]).
- **INSIDE #103: TRUE (FULL149) — chuỗi 4 → 5.** Dải
  [07:33:20Z, 09:33:08Z] neo 07:07:05Z (#102); btime #103
  09:14:55Z TRONG dải, cách biên dưới 6.095 s, cách biên
  trên 1.093 s. Đối chiếu vs FULL148 (neo #101): FALSE (dải
  [05:38:41Z, 07:38:38Z], muộn 5.777 s qua đầu dải) —
  **hai dải MÂU THUẪN NGƯỢC HƯỚNG, lần thứ 16; chuỗi mâu
  thuẫn mới = 4** (sau khi #99 đồng thuận dừng ở 12; #100
  lần 13, #101 lần 14, #102 lần 15).
- Tốc độ reboot: tới #103: 179 reboot / 324,94 h = 1 lần /
  108,9 phút.

## §3. Mù #96?/#95?/#94?/#88?/#77?

B0 = 11:15:18Z 21/11 (btime #64), B1 = 11:48:00Z 24/11 (giờ
chạy thực tế, F-172-T2-12); cửa sổ 261.162 s. Walk chạy
11:46:04–11:48:00Z (script `blind9797-investigate.py`, log
cùng tên) — **KHÔNG có attempt T4 nào chạy trong lúc walk**
(kiểm `ps` + poll-log trước khi chạy: poll #6 11:45:33Z
gate A ĐỎ vì load5 3,09 > 2 + lock còn giữ bởi T0-185;
poll #9 11:47:49Z load5 4,11 vẫn ĐỎ, lock đã nhả nhưng
load còn cao; watchdog trực sẵn, 0 lần kích hoạt). Sàn
(floor) 19'07" = 1.147 s (đứng từ đợt 162).
**Kiểm B1 ở MỌI chỗ dùng trước khi chạy** (investigate B1 +
SEG U-end + merged + sessions + content U1 + witness B1 +
hole-recheck hi — tất cả 11:48:00Z); **W đã sửa ở MỌI
script trước khi chạy** (round185-t2; grep xác nhận 0 lần
nhắc round184-t2 còn sót trong W — F-182-T2-10 đã làm,
không tái diễn; chỉ còn 1 lần nhắc round184-t2 CÓ CHỦ Ý
trong m-check185.py — đọc m-check184.py làm nền).

### §3.1 Walk + file-marks (merged/content)

- Số file có mtime trong cửa sổ: repo-1 **2.737** (đợt 184:
  2.483), hidden_files **8.099** (7.827), outside **3.124**
  (3.032), /tmp **36** (35), fifthscope **18** (18).
- Merged unique second-marks: **6.404** (184: 6.148).
- **R file (raw): 13 marks, MAX GAP 1.238 s** (11:15:29Z →
  11:35:56Z) — **OPEN, lần thứ 21 liên tiếp KHÔNG ĐỔI.**
  R union-A 1.222 s / union-B 1.211 s — OPEN.
- S file: 226 marks, max 3.235 s (13:01:51Z → 13:55:46Z) —
  OPEN; S union-A 662 s / union-B 591 s — CLOSED.
- T file: 210 marks, max 627 s — CLOSED; T union-A 38 s —
  CLOSED.
- **U file: 5.955 marks, max 8.968 s** (15:06:19Z →
  17:35:47Z 23/11) — **OPEN, KHÔNG ĐỔI vs đợt 184** (hố lặng
  giữa đợt, ôm cả btime #94 17:17:09Z mà KHÔNG có file mark
  nào). U union-A 8.968 s — OPEN; **U union-B 7.861 s —
  OPEN, KHÔNG ĐỔI** (hố U max tách thành 7.861 s (15:06:19Z
  → 17:17:20Z) + 1.107 s (17:17:20Z → 17:35:47Z) nhờ head
  #94 17:17:20Z).
- R-head 0; R-tail: last mark 11:38:26Z (2 s trước cuối R);
  U-tail: last mark ~11:47Z (trước B1).
- **Nguồn content MỚI (F-185-T2-3):** replay-watch-184
  (round184-t5, 63 strict poll 6ecd948e trong U; poll cuối
  **09:15:04Z = btime #103 +9 s — OVERLAP #103**) +
  ram-sampler-184 (repo-1/round184-t9, 33 dòng 6ecd948e +
  86 dòng e0921bda trong U; dòng #102 cuối **09:14:24Z =
  btime #103 −31 s — KHÔNG overlap**; dòng #103 đầu
  09:16:00Z = btime #103 +65 s, cuối 10:41:02Z) + system
  head #103 09:15:06Z (/proc/1 mtime +11,753 s, T2-184 đo
  trực tiếp; journal/wtmp chờ T0-185 xác minh 9 nguồn).
  Không nguồn mới nào có mark trong hố U max.
- Content-ts trong hố R union (11:15:29–11:35:40Z): **0 hit.**
  Content-ts trong hố U max (15:06:19–17:35:47Z 23/11): chỉ
  mốc 17:17:09Z (btime #94 — trích trong poll T4-179 +
  header T0-179/T5-179/T8-179, viết SAU dispatch 17:35:51Z)
  + head #94 17:17:20Z (system mark) — **0 mốc mới.**

### §3.2 Sessions + witness (exec-log)

- Exec-logs có mtime trong cửa sổ: **360** (184: 356);
  mtime trong R/S/T: **0/0/0**, trong U: 360. (Witness đếm
  358 — chênh đúng 2 = 2 exec-log của T2-183 trong cửa sổ,
  witness loại qua thư mục còn sessions không loại; 0 ảnh
  hưởng — cả hai đều 0 span.)
- Jump witness #64–#86 (sessions.py): **#64–#85: 0;
  #86: 1 thô → 0 thật** — exec-log main-agent
  (agent 0a4689c3, proc_db760769d06e.log, mtime 08:43:28Z
  24/11) nhúng toàn bộ build-loop-log; span 00:16:31Z
  (23/11, trích "POSTBOOT_PASS #98 CÓ 00:16:31Z" — gán
  nhầm ngày, thật là 24/11) → 23:54:13Z (điểm CEIL đọc
  tay, trích 18 lần, gán ngày 24/11 theo mtime) — span
  ôm btime #86 (01:01:37Z 23/11) nhưng **0 timestamp nào
  trong file ở gần 01:01:37Z** — **TRÍCH DẪN, không phải
  hoạt động thật** (F-184-T2-3 — giữ nguyên kết luận).
- **F-185-T2-5 (mới — phương pháp):** lần chạy sessions
  ĐẦU TIÊN (trước khi sửa) cho #64–#85 đều 1 hit + #86
  2 hit — TẤT CẢ từ CÙNG 1 file: exec-log của T2-184
  (agent 69e1c3d1, proc_e5d2f0ec2e15.log, mtime 09:04:38Z
  24/11 — log chạy hole-recheck184, trích biên hố
  19:32:59Z 20/11 → 17:35:47Z 23/11 trong output). T2-184
  không gặp vì B1 của nó (08:54:00Z) TRƯỚC khi file này
  sinh ra; B1 đợt này (11:48:00Z) bao nó. Đã loại CẢ
  THƯ MỤC agent T2-184 khỏi sessions.py + witness879394.py
  (theo tiền lệ F-178-T2-10) và chạy lại sạch: **#64–#85:
  0; #86: 1 thô → 0 thật** (chỉ còn file main-agent đã
  biết). Đồng thời loại thư mục agent T2-185 (F-185-T2-4
  — log của chính đợt này trích btime).
- Witness #87–#104 (script `witness879394.py`, đã mở rộng
  sang #103 + #104; loại trừ dir T2-184/T2-185 qua thư mục
  + marker "round185-t2"/"m-check185"; 39 log bị loại qua
  quote-marker): exec-logs trong cửa sổ 358.
  **#87: 0; #88: 0; #89: 0; #90: 0; #91: 0; #92: 0;**
  **#93: 3 thô → 0 thật** (2 file artifact đợt 183 đã biết
  + **1 MỚI proc_36dec3e212c5** — log T4-178 poll-wait,
  poll #1 13:09:15Z (+100 s sau btime #93) + poll #2
  13:10:00Z (+145 s) trên boot mới 97054ac6 — ghi SAU
  reboot, KHÔNG phải hoạt động tại btime); **#94: 0;**
  **#95: 2 thô → 0 thật** (2 file artifact đợt 180 đã
  biết); **#96: 3 thô → 0 thật** (2 file artifact đợt 181
  + proc_95067dbe9645.log trích build-loop-log);
  **#97: 1 thô → 0 thật; #98: 1 thô → 0 thật** (cùng file
  trên). **#99: 4 thô → 0 thật** — T5-181 flag-check +
  2 file diagnostic replay-watch-181 + proc_95067dbe9645
  (đã biết). **#100: 7 thô → 1 thật** — poller T4-182
  instance 1 (proc_af664d19db2c: poll thật #19 03:08:43Z +
  #20 03:09:29Z — **overlap +22 s ĐÃ BIẾT, không phải mốc
  mù mới**) + 6 artifact. **#101: 5 thô → 0 thật** (4 file
  đã biết đợt 183 + proc_05486d86b251 — log poller T4-183,
  trích dẫn, 0 thật). **#102: 6 thô → 0 thật** — 5 file
  đã biết đợt 184 + **1 MỚI proc_82b903289d32** (agent
  e033d2dd, span 05:56:42Z → 11:35:51Z — trích giờ cờ
  POSTBOOT_PASS #101 + giờ dispatch đợt 185; **0 dòng
  nào trong ±180 s quanh btime #102/#103/#104** — trích
  dẫn, 0 thật). **#103: 12 thô → 0 thật MỚI** — 4 file
  trích đã biết (82b903289d32, 09bd0ea2c544, 567743a6f6b9,
  95067dbe9645) + proc_0335f156262f (log main-agent: chỉ
  có dòng phân cách 09:14:52Z (−3 s) + COVERAGE-CHECK
  09:12:01Z — session host-side, KHÔNG phải hoạt động
  tại btime) + **6 file agent d6168558** (log T9-184:
  mỗi file 3 dòng gần btime — 09:12:28Z (probe lan-2
  trên #102, −147 s) + 09:15:56Z (probe win103-open
  trên #103, +61 s) + 09:16:05Z (open-184) — đều là
  probe của T9-184 TRƯỚC/SAU reboot, KHÔNG có mark
  NÀO tại btime #103) + proc_e0657c041a7b (session dài,
  span 09:04:22Z → 11:39:52Z — **0 dòng trong ±180 s
  quanh btime #103/#104**). **#104: 5 thô → 0 thật
  MỚI** — 4 file trích đã biết + proc_e0657c041a7b
  (0 dòng trong ±180 s quanh btime #104). **Kết luận:
  0 hoạt động thật mới tại #87–#104 ngoài overlap #100/
  #102/#103 đã biết.**

### §3.3 Hole-recheck lần 29 (NEW=0 mọi hố)

Chạy 11:56:33–11:58:19Z (script `hole-recheck9797.py`, log
`hole-recheck185.log`, exit 0) — 21 s sau khi poller T4-185
thoát (11:56:12Z); xem §4.2 về watchdog v1 không arm
(F-185-T2-9) — cửa sổ chạy sạch đã chứng minh (poll-t4.log
không ghi thêm sau 11:56:12Z; 0 attempt chạy). 25.397 file
có mtime trong union range; 6.404 known merged marks.
**H-E1-88: inside=337, NEW=0 (lần thứ 29 liên tiếp); H-U16:
inside=3, NEW=0.** Toàn bộ các hố còn lại NEW=0 (H-R1 0,
H-R1-old 0, H-S1 0, H-S2 0, H-S3 1 trap/0 mới, H-T1 0,
H-U1 0, H-U2 1 trap/0 mới, H-U2-old 0, H-U3 10 trap/0 mới,
H-U4 0, H-U5 0, H-U6 0, H-U7 0, H-U8 0, H-U9 1 trap/0 mới,
H-U10 0, H-U11 1 trap/0 mới, H-S4 1 trap/0 mới, H-T2 1
trap/0 mới, H-U12 1 trap/0 mới, H-U13 2 trap/0 mới, H-U14
3 trap/0 mới, H-U15 1 trap/0 mới — mọi trap đều là file đã
biết, mtime trùng biên hố, không mốc mới).

### §3.4 Kết luận mù

- **Mù #96? (#64) VẪN MỞ** — R file 1.238 s lần thứ 21 không đổi;
  không mốc mới nào trong cửa sổ.
- **Mù #95? (#63) / #94? (#62) / #88? / #77?: VẪN MỞ** —
  hole-recheck lần 29 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới).
- **CERT/FULL GIỮ 76/91** (vì #77? và #88? vẫn mở).
- U file-gap max 8.968 s KHÔNG ĐỔI (hố H-U16 đã kiểm, NEW=0);
  U union-B max 7.861 s KHÔNG ĐỔI.

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ script nặng

### §4.1 (m) #56 — lần thứ 28, KHÔNG THU HẸP (5 hướng DB MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1). Cửa ứng viên [19:33:20Z, 19:33:37Z] = epochs
1795203200..1795203217 (= btime #56 + [33 s, 49,8 s]). Run 156:
run_id 9c7b6986-46fd-4a31-beea-2e36272d1d26, sched 1795196151
(17:35:51Z), started 1795201518 (19:05:18Z), finished 1795205974
(20:19:34Z), succeeded, request_id NULL.

- **(cvi) DB `agent.subagent_spawns` completed_at (epoch s)
  trong W (MỚI): 0 dòng. ÂM TÍNH.**
- **(cvii) DB `agent.subagent_spawns` seen_at (epoch s)
  trong W (MỚI): 0 dòng. ÂM TÍNH.**
- **(cviii) DB `scheduler.delivery_outbox` updated_at_utc
  trong W (MỚI): 0 dòng. ÂM TÍNH.**
- **(cix) DB `scheduler.delivery_outbox` delivered_at_utc
  trong W (MỚI): 0 dòng. ÂM TÍNH.**
- **(cx) DB `scheduler.delivery_outbox` next_attempt_at_utc
  trong W (MỚI): 0 dòng. ÂM TÍNH.**
- Sanity: MAX(completed_at)=1795518797,
  MAX(seen_at)=1795518919 (độ lớn epoch giây — truy vấn
  BETWEEN giây hợp lệ).
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức GIỮ 14.**
  Tổng 110 hướng (105 tới đợt 184 + 5 hướng mới đợt này —
  lần thứ 28 không thu hẹp, tất cả 0 dòng).
- **Hướng file-based (vii)/(viii)/(vii-b)/(vii-c) (m56-185.py,
  log `m56-185.log`, chạy 12:02:00–12:04:17Z sau khi poller
  thoát, watchdog v2 0 kích hoạt):** (vii) **333 file** trong D,
  max mtime **20:15:33.130Z** (round156-t10.done — KHÔNG ĐỔI
  vs đợt 184; dưới mốc max đã biết 20:19:34Z); (viii) **0
  exec-log** có mtime trong D; (vii-b) **0 file** tại
  20:16:00–20:17:00Z; (vii-c) **0 file** tại 20:19:30–
  20:19:40Z. **ÂM TÍNH toàn bộ — (m) #56 KHÔNG thu hẹp.**

### §4.2 Tuân thủ luật script nặng đợt 185 — KHÔNG VI PHẠM

- T4-185 mở poller 11:41:43Z (gate0wait, hạn 13:30Z).
  T2-185 kiểm poll-log + `ps` TRƯỚC MỖI script nặng VÀ
  chạy watchdog trực sẵn trong lúc script chạy (script
  `/tmp/watch185.sh`: kiểm poll-t4.log mỗi 2 s; giết-ngay
  (TERM rồi KILL cả process-group) nếu thấy dòng "CUA YEN
  MO", hoặc process `run-attempt-185`, hoặc poll mới cho
  thấy gate A xanh (load1<2 VÀ load5<2 VÀ lock=khong).
  Watchdog đã thử khô trước khi dùng (target sleep 20 s —
  0 kích hoạt giả trong lúc gate ĐỎ).
- **Walk mù chạy 11:46:04–11:48:00Z — trong lúc gate A ĐỎ**
  (poll #6 11:45:33Z load5 3,09; poll #9 11:47:49Z load5
  4,11; lock còn giữ bởi T0-185 tới 11:47:49Z) **và KHÔNG
  có attempt nào chạy** (watchdog 0 kích hoạt).
- **Merged/content/sessions/witness chạy 11:48–11:50Z —
  trong lúc gate A ĐỎ** (poll #10 11:48:34Z load5 3,61;
  poll #11 11:49:19Z load1 1,59 nhưng load5 3,24 vẫn ĐỎ;
  poll #12 11:50:04Z load1 0,75 nhưng load5 2,79 vẫn ĐỎ)
  **và KHÔNG có attempt nào chạy** (watchdog 0 kích hoạt).
- **Diễn biến gate sau đó: load5 rơi đều 3,61 → 3,24 →
  2,79 → 2,51 (poll #13 11:50:49Z) → 2,18 (poll #14
  11:51:35Z) — TIẾN SÁT NGƯỠNG 2.** Theo bài học
  F-184-T2-8 (chỉ chạy script dài khi gate ỔN ĐỊNH đỏ
  hoặc sau khi T4 đã đóng attempt), T2-185 **DỪNG mọi
  script nặng còn lại** (hole-recheck, sweep #104,
  m56-file) và **CHỜ poller T4-185 thoát** rồi mới chạy
  tiếp — KHÔNG đánh cược với cửa sổ 1 s giữa dòng poll
  xanh và "CUA YEN MO" (bằng chứng đợt 184: poll #25
  09:04:21Z → CUA YEN MO 09:04:22Z, chỉ cách 1 s).
- **Sau khi poller thoát: poller T4-185 thoát 11:56:12Z**
  ("thoat poller" trong log; attempt1-9161bfd1 20/20 + B
  5/5, median 45,0 ms — LƯỢT HỢP LỆ; poll-t4.log mtime
  dừng 11:56:12Z — không ghi thêm). Hole-recheck chạy
  11:56:33–11:58:19Z (exit 0; watchdog v1 KHÔNG arm — xem
  F-185-T2-9 — nhưng cửa sổ sạch đã chứng minh). Sweep
  chạy lại 12:01:17–12:02:00Z (exit 0) + m56-file chạy lại
  12:02:00–12:04:17Z (exit 0), cả hai dưới watchdog v2,
  **0 kích hoạt, 0 attempt chạy trong lúc script chạy.**
- **Chuỗi 0 vi phạm GIỮ 0** (đã đứt về 0 đợt 183 theo
  quyết (p) parent; vi phạm F-184-T2-8 thuộc đợt 184) —
  T2 báo trung thực, parent quyết cuối.

## §5. EPERM probe #104 + sweep

- **Probe #104: chạy 11:42:30Z, boot 9161bfd1, ok=2 fail=0,
  exit 0.** Log `hidden_files/eperm-probe-v2.log` 286 → 288
  dòng (+1 boot-changed, +1 probe#104); heartbeat n=104.
  **MemAvailable lúc probe: 1.667.088 kB** (11:42:30Z). Cửa
  sổ probe #104: 09:20:21Z → 11:42:30Z = 13.329 s. **Probe
  #104 bao btime #104 (11:13:42Z).** Sóng EPERM thật gần
  nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #104** (script `eperm-sweep9797.py`, log
  `eperm-sweep185.log`, cửa sổ probe [09:20:21Z,
  11:42:30Z]): **156 *.log** có mtime trong cửa sổ;
  **3 file có marker (13 lần)** — eperm-sweep184b.log
  (round184-t2: 'CẢNH BÁO' ×2 + 'Operation not permitted'
  ×2 + 'sóng EPERM đã tắt' ×3) + 2 bản o8-184t8.log
  ('sóng EPERM đã tắt' ×3 mỗi bản) — **TẤT CẢ trích dẫn
  log sweep đợt 184, 0 sóng thật** (0 lần "sóng EPERM vẫn
  bật"; lần kích hoạt giả của watchdog v1 11:59:39Z xem
  F-185-T2-9 — KHÔNG phải sóng thật).
- Script probe: `~/workspace/repo-1/scripts/probe-eperm-v2.sh`; log +
  heartbeat tại `~/workspace/goals/capcut-clone-video-editor/
  hidden_files/eperm-probe-v2.log` / `.heartbeat`.

## §6. Phương pháp, sai số, câu hỏi cho parent

### §6.1 Phương pháp

- DB đọc tươi qua `muse.db` (bảng `scheduler.job_runs` +
  `scheduler.events` + `runtime.requests` +
  `scheduler.delivery_outbox` + `agent.sessions` +
  `scheduler.doctor_run_plans` + `agent.subagent_spawns` +
  `runtime.events` + `runtime.tool_calls`);
  `muse.db` từ chối `to_timestamp` — dùng literal
  `'YYYY-MM-DD HH:MM:SS+00'::timestamptz` +
  `EXTRACT(EPOCH FROM created_at)` / cột `*_utc` bigint.
  `events.run_id`/`job_runs.run_id` là UUID ĐẦY ĐỦ — tra bằng
  short id trả 0 dòng. Mọi số (m)/INSIDE đều có trong script
  đối chiếu độc lập `m-check185.py` (log `m-check185.txt`).
- INSIDE tính bằng `m-check185.py` (log `m-check185.txt`);
  FULL148 p10/p90 khớp T2-184 bằng assert trong script;
  chain sau #102 = 4 khớp.
- (m) #103: KHÔNG cần boot_est (margin xấu nhất 3,543 s
  >> 1 s); prior δ #90 (+0,32 s), δ #92 (+0,396 s)
  và boot_est #95 (+0,99 s) đều cho offset TRONG dải — đồng
  thuận, không như #91 (hai prior trái chiều).
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness
  TRỪ exec-log T2-177 (ec756e29) + T2-178 (b387ac70) +
  T2-179 (52dfc922) + T2-180 (42bae1a0) + T2-181 (11a8480f) +
  T2-183 (7b6d04e1) + T2-184 (69e1c3d1 — MỚI đợt này,
  F-185-T2-5) + T2-185 (17354ac6 — thư mục của chính đợt
  này, F-185-T2-4) + TRỪ mọi log chứa marker T2
  ("m-check17", "FULL13", "round178-t2", "round179-t2",
  "round180-t2", "round182-t2", "round183-t2", "round184-t2",
  "round185-t2", "m-check180", "m-check181", "m-check182",
  "m-check183", "m-check184", "m-check185") (F-178-T2-4);
  dir T2-182 không rõ id — log của nó mang marker
  "round182-t2"/"m-check182" nên đã bị loại qua marker;
  kiểm B1 ở MỌI chỗ dùng trước khi chạy (F-179-T2-4 đã sửa);
  kiểm W ở MỌI script trước khi chạy (F-182-T2-10 đã làm);
  output vào thư mục riêng, không ghi đè file cũ (F-166-T2-2);
  kiểm epoch GAP bằng `date -d` trước khi chạy sessions;
  chụp meminfo cùng lệnh probe (F-172-T7-2-7). **Kiểm
  poll-log + `ps` TRƯỚC MỖI script nặng, kể cả script chạy
  nối** (F-183-T2-7) — **và BÀI HỌC MỚI đợt 184
  (F-184-T2-8): kiểm-trước-khởi-động CHƯA ĐỦ với script
  dài; lần này T2-185 CHỜ poller T4 thoát hẳn rồi mới chạy
  các script dài còn lại (hole-recheck/sweep/m56-file),
  thay vì chạy khi gate đang dao động về ngưỡng.**
- **Sửa phương pháp đợt này:** (i) content script bổ sung
  replay-watch-184 + ram-sampler-184 + system head #103
  (F-185-T2-3); (ii) witness mở rộng sang #103 + #104;
  (iii) m-check tính FULL149 (#103); (iv) m56 thêm 5 hướng
  DB mới (cvi)–(cx); (v) loại thư mục agent T2-184 khỏi
  sessions/witness (F-185-T2-5) + loại thư mục agent
  T2-185 (F-185-T2-4); (vi) watchdog giết-ngay cho script
  nặng (F-184-T2-8) — **v2 đợt này: chỉ tính dòng log MỚI
  + chờ process-group xuất hiện trước khi arm
  (F-185-T2-9).**
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.

### §6.2 Sai số / caveat (F-185-T2-*)

- **F-185-T2-1 — (m) #103 DƯƠNG ở cấp T2, parent quyết
  cuối; caveat overlap KHÔNG lật verdict; ĐÍNH CHÍNH
  T7-184.** Offset btime 37,543 s, TRONG dải; offset thật
  ∈ (36,543 s, 37,543 s] — caveat phân số KHÔNG lật được
  (xấu nhất vẫn TRONG 3,543 s). Overlap #103 +9 s
  (watcher-184, poll cuối 09:15:04Z) lấy theo nghĩa đen sẽ
  đưa offset #103 về ~28,5 s — NGOÀI dải dưới; tiền lệ
  #87/#90 cấm lật bằng overlap (áp dụng đối xứng với #91/
  #93/#95/#96/#97/#99/#100/#102 — #99 có overlap +22 s Y
  HỆT và parent đã chấp nhận DƯƠNG; #100 có +22/+6 s và
  parent đã chấp nhận DƯƠNG). **T7-184 viết "KHÔNG có
  overlap" là SAI** — log replay-watch-184 ghi rõ poll
  09:15:04Z boot=6ecd948e (+9 s); T0-185 đã trả lời
  F-184-T2-11 theo cùng hướng (đồng hồ nhanh trước #103,
  delta > 9 s — KHÔNG nhảy lùi). Poller/sampler/T8/b2watch
  KHÔNG overlap tại #103.
- **F-185-T2-2 — (m) #104 thô: 0 requeue trong cửa hẹp
  [11:13:42Z, 11:32:42Z] (T2-185 xác minh độc lập từ DB
  tươi — KHỚP T0-185).** Requeue duy nhất của run 184 sau
  #103 là eid 10724 lúc 11:11:06.655Z = btime #104
  **−155,345 s** (TRƯỚC btime, ngoài cửa hẹp). T0-185
  khẳng định lần viết lại 11:11:06Z KHÔNG do reboot.
  T2-185 **KHÔNG phân loại (m) #104** — ngoài phạm vi
  brief T2-185 (brief giao (m) #103 + INSIDE #103);
  T0-185 ghi "(thuộc T2-185)" trong cờ — T2-185 ghi nhận
  mâu thuẫn phạm vi này để parent quyết: hoặc (m) #104
  thuộc T2-186 theo mẫu đứng, hoặc parent giao thêm.
  Dữ kiện thô đã xác minh xong (0 requeue trong cửa hẹp;
  eid 10724 −155,345 s; boot_gen cuối run 184 dbbf0826).
- **F-185-T2-3 — INSIDE #103 TRUE (FULL149); dải chéo
  FALSE.** Chuỗi INSIDE 4 → 5 (dải phương pháp chi phối theo
  F-165-T2-1). Mâu thuẫn ngược hướng lần thứ 16; chuỗi mâu
  thuẫn mới = 4.
- **F-185-T2-4 — Loại thư mục agent T2-185 khỏi
  sessions/witness (phương pháp).** Log exec của chính đợt
  này trích btime/hố (đọc LIMITS + script đợt 184) — nếu
  không loại sẽ tự false-witness. Đã loại bằng thư mục
  (17354ac6) + marker.
- **F-185-T2-5 — Log hole-recheck của T2-184 false-witness
  #64–#86 (phương pháp, ĐÃ SỬA).** Xem §3.2.
- **F-185-T2-6 — ĐÍNH CHÍNH NHỎ (prose giờ run 184/185,
  không đổi verdict): bản nháp đầu của m-check185 viết
  sai giờ finished/claimed run 184 (11:36:07Z/11:35:19Z)
  và epoch sched run 185 (1795518951) — do lấy nhầm
  1795518951 (= 11:15:51Z) làm 11:35:51Z (đúng là
  1795520151 = sched + 10.800 s). Số ĐÚNG: run 184 finished
  11:16:07Z, claimed 11:15:19Z, margin +1.184 s TRƯỚC hạn
  (KHỚP T0-185 độc lập); run 185 sched 1795520151, row ĐÃ
  CÓ, running, boot_gen 7c896c1e (#104). Mọi phép tính epoch
  (m)/INSIDE đều đúng; chỉ prose HH:MM:SS lệch.**
- **F-185-T2-7 — Run 184 SUCCEEDED 11:16:07Z (số liệu;
  kết cục thuộc T7-185).** Margin +1.184 s TRƯỚC hạn
  11:35:51Z; claimed→finished 48 s (<60 s — KHÔNG phải
  ca CA ≥60 s; T2 KHÔNG phán); claimed ĐÃ ĐỔI sau khi
  T7-184 đóng cờ (cùng mẫu run 182/183). Run 185 đang
  running — kết cục thuộc T7-186.
- **F-185-T2-8 — EPERM probe #104 + sweep #104 — ghi nhận?**
  (Probe #104 ok=2 fail=0, boot 9161bfd1, bao btime #104;
  sweep #104: 156 *.log, 3 file có marker (13 lần) — TẤT CẢ
  trích dẫn, 0 sóng thật.)
- **F-185-T2-9 — Watchdog v1: 2 lỗi phương pháp (ĐÃ SỬA
  thành v2, KHÔNG vi phạm).** (1) Trigger (a) grep TOÀN
  BỘ poll-t4.log: sau khi dòng "CUA YEN MO poll #15
  11:52:20Z" xuất hiện, MỌI lần chạy watchdog đều kích
  hoạt giả NGAY LẬP TỨC — sweep + m56 lần đầu 11:59:39Z
  bị giết lúc khởi động (exit 143), log trống rỗng, 0
  chồng lấn (không attempt nào chạy; poller đã chết
  11:56:12Z) — kích hoạt GIẢ, không phải gate lật.
  (2) Race arm thầm lặng: `while kill -0 -$PGID` chạy
  trong cửa sổ micro-giây trước khi tiến trình con gọi
  setsid() thì group chưa tồn tại → vòng lặp không chạy,
  watchdog thoát 0 không báo — hole-recheck 11:56:33Z
  chạy KHÔNG có watchdog thật (nhưng cửa sổ sạch đã
  chứng minh: bắt đầu 21 s sau khi poller thoát;
  poll-t4.log không ghi thêm sau 11:56:12Z). **v2 sửa
  cả hai: chỉ xét dòng log MỚI sau lúc bắt đầu + chờ
  tối đa 5 s cho process-group xuất hiện (không xuất
  hiện → ghi mark WATCHDOG-NO-GROUP, exit 2).** v2 thử
  khô 12 s: arm OK, 0 kích hoạt giả; sweep + m56 chạy
  lại dưới v2: exit 0, 0 kích hoạt. **Tuân thủ: KHÔNG
  VI PHẠM — 0 chồng lấn với attempt T4 ở bất kỳ thời
  điểm nào; parent quyết chuỗi 0 vi phạm.**

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 185)

- **(a) (m) #103 DƯƠNG — chấp nhận?** (requeue +37,543 s,
  TRONG dải [33; 49,8], KHÔNG sát biên; 1 run sống; caveat
  phân số KHÔNG lật được; overlap +9 s (watcher-184) không
  lật verdict theo tiền lệ #87/#90; đính chính T7-184
  "không overlap" là sai.)
- **(b) INSIDE #103 TRUE (FULL149, chuỗi 4 → 5) — chấp
  nhận?** (dải chéo FALSE — mâu thuẫn ngược hướng lần thứ
  16, chuỗi mới = 4.)
- **(c) Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ — chấp nhận giữ
  mở?** (R file 1.238 s lần thứ 21 không đổi; hole-recheck
  lần 29 NEW=0 mọi hố; U file-gap max 8.968 s KHÔNG ĐỔI;
  witness #103/#104 0 thật mới; artifact trích dẫn mới
  F-185-T2-5.)
- **(d) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều
  kiện?** (lần thứ 28 không thu hẹp; 5 hướng DB mới, tổng
  110 hướng — tất cả 0 dòng; file-based: (vii) 333 file,
  max 20:15:33.130Z; (viii) 0; (vii-b) 0; (vii-c) 0 — ÂM
  TÍNH.) n chính thức GIỮ 14.
- **(e) EPERM probe #104 + sweep #104 — ghi nhận?**
  (Probe #104 ok=2 fail=0, boot 9161bfd1, bao btime #104;
  sweep #104: 156 *.log, 3 file có marker (13 lần) —
  TẤT CẢ trích dẫn, 0 sóng thật.)
- **(f) Tuân thủ script nặng đợt 185 — KHÔNG VI PHẠM:
  parent quyết chuỗi 0 vi phạm GIỮ 0?** (Walk + merged/
  sessions/witness chạy lúc gate ĐỎ, watchdog trực sẵn, 0
  kích hoạt; hole-recheck/sweep/m56-file chạy sau khi
  poller T4 thoát; watchdog v1 kích hoạt GIẢ 2 lần (dòng
  CUA YEN MO cũ) + 1 lần không arm (race setsid) — đã sửa
  v2, xem F-185-T2-9; 0 chồng lấn với attempt T4 — khác
  hẳn F-184-T2-8.)
- **(g) Run 184 SUCCEEDED 11:16:07Z (margin +1.184 s,
  claimed→finished 48 s — KHÔNG phải ca CA ≥60 s) — ghi
  nhận cho T7-185?** (Không phải verdict của T2.)
- **(h) n ứng viên 45/46 → 46/47 (nếu chấp nhận #103 DƯƠNG)
  — chấp nhận?** (n chính thức GIỮ 14.)
- **(i) Số hiệu #103/#104 T0-185 ĐÃ XÁC MINH 9 nguồn +
  F-184-T2-11 ĐÃ TRẢ LỜI (đồng hồ nhanh trước #103, delta
  > 9 s — KHÔNG nhảy lùi) + POSTBOOT_PASS #103 CHƯA CÓ —
  ghi nhận?** (Thuộc T0/T5-185.)
- **(j) (m) #104 thô (0 requeue trong cửa hẹp; eid 10724
  −155,345 s; T0-185: viết lại 11:11:06Z KHÔNG do reboot)
  — parent quyết phạm vi: thuộc T2-186 theo mẫu đứng, hay
  giao T2-185 phân loại?** (T2-185 chỉ xác minh số thô,
  KHÔNG phân loại cuối.)
- **(k) Đính chính nhỏ F-185-T2-6 (prose giờ run 184/185:
  finished 11:16:07Z, claimed 11:15:19Z, sched run 185
  1795520151; epoch đúng, không đổi verdict) — ghi nhận?**
- **(l) F-185-T2-9 (watchdog v1: kích hoạt giả trên dòng cũ +
  race arm thầm lặng; đã sửa v2; KHÔNG vi phạm) — ghi nhận?**
