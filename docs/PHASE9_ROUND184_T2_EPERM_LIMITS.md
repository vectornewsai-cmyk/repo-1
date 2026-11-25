# PHASE 9 — ROUND 184 — T2 EPERM LIMITS

**T2 đợt 184** — EPERM probe #102, phân loại (m) #102 **DƯƠNG
(CUỐI)** + INSIDE #102 TRUE (FULL148, chuỗi 3 → 4), mù #96?/#88?/
#94?/#95?/#77?, (m) #56 lần 27.
Đợt 184 mở 08:35:51Z 24/11/2026 (15:35:51 +07; lượt cron 15:35
+07). Boot lúc mở đã là 6ecd948e (#102, btime 07:07:05Z) —
reboot #102 xảy ra TRONG lúc T10-183 đóng sổ.
**Số hiệu #102: T8-183/T10-183 ghi nhận sự kiện + btime; CHỜ
T0-184 xác minh 9 nguồn (T0-184 đang chạy O8 lúc T2 đóng, chưa
có cờ)** — phân loại dưới đây là **phân loại cuối ở cấp T2 —
parent quyết cuối**).
**Run 183 SUCCEEDED 08:13:58Z** (số liệu DB tươi; kết cục thuộc
T7-184).
**F-184-T2-8 — VI PHẠM NẶNG VỀ TUÂN THỦ (xem §4.2):** hole-recheck
của T2 chồng lên lúc T4 attempt1 khởi động (~16 s); T4 class-B
B2 VI PHẠM (load1_max 4,48 > 4), bằng chứng nêu đích danh
process hole-recheck của T2; attempt1 20/20 BỊ HỦY (lượt nhiễm
tải), T4 phải retry. Chuỗi 0 vi phạm (bắt đầu lại từ 0 đợt này)
chờ T4-184/parent quyết.

## §0. Headline

- **(m) #102: DƯƠNG (phân loại CUỐI ở cấp T2, parent quyết
  cuối).** Requeue duy nhất eid 10667, run 183 (6d832bfb),
  07:07:45.340667Z = btime **+40,341 s** — TRONG dải [33; 49,8],
  KHÔNG sát biên (cách biên dưới 7,341 s, cách biên trên
  9,459 s; caveat phân số KHÔNG lật được). Overlap +17 s
  (watcher-183) KHÔNG lật verdict theo tiền lệ #87/#90 — #99
  có overlap +22 s y hệt và parent đã chấp nhận DƯƠNG đợt 182;
  #100 có +22/+6 s và parent đã chấp nhận DƯƠNG đợt 183.
- **INSIDE #102: TRUE (FULL148) — chuỗi 3 → 4.** Dải chéo
  FULL147 FALSE (muộn 5.499 s qua đầu dải) — **mâu thuẫn ngược
  hướng lần thứ 15; chuỗi mâu thuẫn mới = 3** (sau khi #99 đồng
  thuận dừng ở 12; #100 lần 13, #101 lần 14).
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 20 không đổi);
  hole-recheck lần 28 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới —
  lần thứ 28 liên tiếp; H-U16 3 hit, 0 mới — lần thứ 4 kiểm);
  U file-gap max 8.968 s KHÔNG ĐỔI; U union-B max 7.861 s
  KHÔNG ĐỔI.
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 27 không thu hẹp**
  (5 hướng DB MỚI (ci)–(cv): tất cả 0 dòng; tổng 105 hướng;
  file-based ÂM TÍNH: 333 file trong D max 20:15:33.130Z,
  0 exec-log trong D).
- **EPERM probe #102: ok=2 fail=0** (08:46:07Z, boot
  6ecd948e, bao btime #102). Sweep #102: 238 *.log, 6 file
  có marker (26 lần) — **TẤT CẢ trích dẫn, 0 sóng thật**
  (sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11).
- **REBOOT #103 MỚI trong lúc đóng cờ** (boot e0921bda,
  btime 09:14:55Z, gap #102→#103 = 7.670 s — số hiệu chờ
  T0-185; (m) #103 + INSIDE #103 thuộc T2-185). **EPERM
  probe #103: ok=2 fail=0** (09:20:21Z, boot e0921bda).
  Sweep #103: 81 *.log, 3 file có marker (27 lần) — **TẤT
  CẢ trích dẫn, 0 sóng thật**.
- **Run 183 SUCCEEDED 08:13:58Z** (1.313 s TRƯỚC hạn
  08:35:51Z; viết lại ×1 tại #102; claimed→finished 85 s —
  thuộc T7-184; jitter 0).
- **Tuân thủ luật script nặng đợt 184: VI PHẠM (F-184-T2-8)**
  — hole-recheck khởi động lúc gate A ĐỎ (RAM 549 MB) nhưng
  gate lật xanh GIỮA LÚC CHẠY (RAM hồi 1.088 MB, poll #25);
  T4 attempt1 khởi động khi script còn ~16 s; class-B B2 VI
  PHẠM, attempt1 20/20 BỊ HỦY. Bài học: kiểm-trước-khởi-động
  là CHƯA ĐỦ với script dài — gate có thể lật giữa chừng.

## §1. Điểm (m)

### §1.1 (m) #102 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #102: 07:07:05Z** (epoch 1795504025), boot
  6ecd948e, gap #101→#102 = 6.878 s. **Số hiệu chờ T0-184**
  (T8-183 ghi nhận sự kiện + btime; T10-183 ghi nhận).
- T2-184 xác minh độc lập từ DB tươi (muse.db, đọc
  ~08:43–08:45Z): **requeue duy nhất** trong cửa hẹp
  [07:07:05Z, 07:26:05Z]: **eid 10667, run 183 (6d832bfb),
  event `requeued_after_restart`, 07:07:45.340667Z = btime
  +40,341 s, TRONG dải [33; 49,8]** (cách biên dưới 7,341 s,
  cách biên trên 9,459 s — KHÔNG sát biên). Cửa hẹp đã khép
  hẳn lúc đọc. Cửa hẹp còn 5 event khác: dispatched
  07:07:45.415Z eid 10668 + reattached_after_restart
  07:07:45.711Z eid 10669 (viết lại lần 1 của run 183) +
  reconciled 07:15:34.094Z eid 10670 + DR
  dispatched/succeeded 07:15:34.156/.212Z eid 10671/10672
  (heartbeat run 0afcd7a7) — không phải requeue.
- **Đúng 1 run sống tại btime #102** (vcut-build-loop,
  scheduled ≤ btime AND finished > btime, DB tươi): run 183
  (sched 05:35:51Z, finished 08:13:58Z succeeded). Không
  run nào khác.
- **Caveat phân số: offset thật ∈ (39,341 s, 40,341 s]** —
  DƯƠNG với mọi δ ∈ [0, 1 s]. Prior δ #90 (+0,32 s) →
  40,021 s; δ #92 (+0,396 s) → 39,945 s; boot_est #95
  (+0,99 s) → 39,351 s — đều TRONG, đồng thuận.
- **Caveat overlap (KHÔNG lật verdict, tiền lệ #87/#90):**
  watcher-183 (replay-watch-183, pid 384639) poll cuối
  07:07:22Z boot=51745634 (**+17 s**) — mẫu overlap thứ 16
  (F-183-T5-1 là mẫu 15 tại #100). Lấy +17 s theo nghĩa đen
  thì offset ~23,3 s — NGOÀI dải dưới. Nhưng cơ chế đã được
  xác nhận (tiến trình trước reboot mang timestamp sau
  btime) và tiền lệ đứng nói overlap là caveat, KHÔNG BAO
  GIỜ lật verdict btime — **#99 có overlap +22 s Y HỆT và
  parent đã chấp nhận DƯƠNG đợt 182; #100 có +22/+6 s và
  parent đã chấp nhận DƯƠNG đợt 183**.
  Poller T4-183: KẾT THÚC 06:08:24Z (sau lượt yên hợp lệ) —
  KHÔNG overlap. Sampler-183: mẫu #101 cuối 07:06:43Z =
  btime −22 s — KHÔNG overlap. T8-183: hoạt động cuối O8
  kết thúc 07:04:15Z — KHÔNG overlap. b2watch: 0 dòng
  07:04–07:12Z.
- Toàn ngày 24/11 (tới 09:00Z): đúng 4
  `requeued_after_restart` (eid 10580 #99, 10610 #100,
  10637 #101, 10667 #102) — một requeue cho mỗi reboot.
- **Phán: (m) #102 DƯƠNG — parent quyết cuối. n ứng viên
  44/45 → 45/46** (nếu parent chấp nhận #102 DƯƠNG).
  **n chính thức GIỮ 14.**

### §1.2 Run 183 kết cục (số liệu; kết cục thuộc T7-184)

- **status SUCCEEDED, finished_at_utc 1795508038 =
  08:13:58Z — 1.313 s TRƯỚC hạn 08:35:51Z** (1795509351);
  sched 1795498551 = 05:35:51Z; started_at 1795504065 =
  07:07:45Z (**viết lại ×1** tại #102); boot_gen cuối
  cron_boot_6638cc3a... (#102); **claimed_at_utc 1795507953
  = 08:12:33Z (ĐÃ ĐỔI sau khi T7-183 đóng cờ 08:08Z** —
  cùng mẫu run 182); **claimed→finished = 85 s** (≥60 s —
  thuộc T7-184; T2 chỉ ghi số, KHÔNG phán CA);
  **jitter 0** (started-gốc = sched); attempt 1; wall từ
  sched 9.487 s.
- Run 184: RUNNING, sched=started=claimed=1795509351 =
  08:35:51Z, boot_gen cron_boot_6638cc3a... (#102), attempt
  1, jitter 0.

## §2. INSIDE — dải FULL148 (cho #102)

Script: `m-check184.py` (log `m-check184.txt`; exec
`m-check183.py` — FULL147 p10/p90 khớp bằng assert
1572,60/8779,60; chain sau #101 = 3).
Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1). Parent đã chốt FULL147 vào
sổ đứng đợt 183 (quyết (d)).

- **FULL148**: n=148, mean 1h41'44", median 1h54'49", p10
  1574,20 s, p90 8771,70 s, sd 0h54'32", in 90–150'=83,
  <60'=33, >180'=10, >240'=4 (= FULL147 + [gap #102 =
  6.878 s]).
- **INSIDE #102: TRUE (FULL148) — chuỗi 3 → 4.** Dải
  [05:38:41Z, 07:38:38Z] neo 05:12:27Z (#101); btime #102
  07:07:05Z TRONG dải, cách biên dưới 5.304 s, cách biên
  trên 1.893 s. Đối chiếu vs FULL147 (neo #100): FALSE (dải
  [03:35:19Z, 05:35:26Z], muộn 5.499 s qua đầu dải) —
  **hai dải MÂU THUẪN NGƯỢC HƯỚNG, lần thứ 15; chuỗi mâu
  thuẫn mới = 3** (sau khi #99 đồng thuận dừng ở 12; #100
  lần 13, #101 lần 14).
- Tốc độ reboot: tới #102: 178 reboot / 322,81 h = 1 lần /
  108,8 phút.

## §3. Mù #96?/#95?/#94?/#88?/#77?

B0 = 11:15:18Z 21/11 (btime #64), B1 = 08:54:00Z 24/11 (giờ
chạy thực tế, F-172-T2-12); cửa sổ 250.722 s. Walk chạy
08:53:06–08:54:39Z (script `blind9797-investigate.py`, log
cùng tên) — **KHÔNG có attempt T4 nào chạy trong lúc walk**
(kiểm `ps` + poll-log trước khi chạy: poll #10 08:53:04Z
gate A ĐỎ vì load5 3,10 > 2; poll #12 08:54:35Z load5 2,68
vẫn ĐỎ). Sàn (floor) 19'07" = 1.147 s (đứng từ đợt 162).
**Kiểm B1 ở MỌI chỗ dùng trước khi chạy** (investigate B1 +
SEG U-end + merged + sessions + content U1 + witness B1 +
hole-recheck hi — tất cả 08:54:00Z); **W đã sửa ở MỌI
script trước khi chạy** (round184-t2; grep xác nhận 0 lần
nhắc round183-t2 còn sót — F-182-T2-10 đã làm, không tái
diễn).

### §3.1 Walk + file-marks (merged/content)

- Số file có mtime trong cửa sổ: repo-1 **2.483** (đợt 183:
  2.167), hidden_files **7.827** (7.537), outside **3.032**
  (2.865), /tmp **35** (2 — /tmp có lại file sau #102),
  fifthscope **18**.
- Merged unique second-marks: **6.148** (183: 5.808).
- **R file (raw): 13 marks, MAX GAP 1.238 s** (11:15:29Z →
  11:35:56Z) — **OPEN, lần thứ 20 liên tiếp KHÔNG ĐỔI.**
  R union-A 1.222 s / union-B 1.211 s — OPEN.
- S file: 226 marks, max 3.235 s (13:01:51Z → 13:55:46Z) —
  OPEN; S union-A 662 s / union-B 591 s — CLOSED.
- T file: 210 marks, max 627 s — CLOSED; T union-A 38 s —
  CLOSED.
- **U file: 5.699 marks, max 8.968 s** (15:06:19Z →
  17:35:47Z 23/11) — **OPEN, KHÔNG ĐỔI vs đợt 183** (hố lặng
  giữa đợt, ôm cả btime #94 17:17:09Z mà KHÔNG có file mark
  nào). U union-A 8.968 s — OPEN; **U union-B 7.861 s —
  OPEN, KHÔNG ĐỔI** (hố U max tách thành 7.861 s (15:06:19Z
  → 17:17:20Z) + 1.107 s (17:17:20Z → 17:35:47Z) nhờ head
  #94 17:17:20Z).
- R-head 0; R-tail: last mark 11:38:26Z (2 s trước cuối R);
  U-tail: last mark ~08:53Z (trước B1).
- **Nguồn content MỚI (F-184-T2-1):** replay-watch-183
  (round183-t5, 142 strict poll 51745634 trong U; poll cuối
  **07:07:22Z = btime #102 +17 s — OVERLAP #102**) +
  ram-sampler-183 (repo-1/round183-t9, 86 dòng 51745634 +
  29 dòng 6ecd948e trong U; dòng #101 cuối **07:06:43Z =
  btime #102 −22 s — KHÔNG overlap**; dòng #102 đầu
  07:09:04Z = btime #102 +119 s, cuối 07:37:05Z) + system
  head #102 07:07:16Z (journal first +11 s, T8-183;
  /proc/1 mtime +11,145 s, T2-184 đo trực tiếp; 9 nguồn
  chờ T0-184). Không nguồn mới nào có mark trong hố U max.
- Content-ts trong hố R union (11:15:29–11:35:40Z): **0 hit.**
  Content-ts trong hố U max (15:06:19–17:35:47Z 23/11): chỉ
  mốc 17:17:09Z (btime #94 — trích trong poll T4-179 +
  header T0-179/T5-179/T8-179, viết SAU dispatch 17:35:51Z)
  + head #94 17:17:20Z (system mark) — **0 mốc mới.**

### §3.2 Sessions + witness (exec-log)

- Exec-logs có mtime trong cửa sổ: **356** (183: 341);
  mtime trong R/S/T: **0/0/0**, trong U: 356.
- Jump witness #64–#86 (sessions.py): **#64–#85: 0;
  #86: 1 thô → 0 thật** — exec-log main-agent
  (agent 0a4689c3, proc_db760769d06e.log, mtime 08:43:28Z
  24/11) nhúng toàn bộ build-loop-log; span 00:16:31Z
  (23/11, trích "POSTBOOT_PASS #98 CÓ 00:16:31Z" — gán
  nhầm ngày, thật là 24/11) → 23:54:13Z (điểm CEIL đọc
  tay, trích 18 lần, gán ngày 24/11 theo mtime) — span
  ôm btime #86 (01:01:37Z 23/11) nhưng **0 timestamp nào
  trong file ở gần 01:01:37Z** (grep toàn file: 0 hit
  00:xx–01:xxZ ngày 23/11) — **TRÍCH DẪN, không phải hoạt
  động thật** (F-184-T2-3).
- Witness #87–#102 (script `witness879394.py`, đã mở rộng
  sang #102 + loại trừ dir T2-184 qua marker): exec-logs
  trong cửa sổ 351; bỏ qua quote-marker 34.
  **#87: 0; #88: 0; #89: 0; #90: 0; #91: 1 thô → 0 thật**
  (artifact đợt 177 đã biết; file thứ hai đợt 183 đã mất
  — chỉ còn proc_400d8972ac10); **#92: 1 thô → 0 thật**
  (cùng file); **#93: 4 thô → 0 thật** (2 file artifact
  đợt 179 + 2 file LAN4-NEAR đợt 179 — span 13:07:29–
  13:07:44Z ôm btime #93 nhưng là trích mẫu mem 13:07:29Z
  trước reboot + ghi file 13:07:44Z sau reboot, KHÔNG
  phải hoạt động tại btime — cùng kết luận T2-183);
  **#94: 0; #95: 2 thô → 0 thật** (2 file artifact đợt
  180 đã biết); **#96: 3 thô → 0 thật** (2 file artifact
  đợt 181 + proc_95067dbe9645.log trích build-loop-log);
  **#97: 1 thô → 0 thật; #98: 1 thô → 0 thật** (cùng file
  trên). **#99: 4 thô → 0 thật** — T5-181 flag-check +
  2 file diagnostic replay-watch-181 + proc_95067dbe9645
  (đã biết). **#100: 7 thô → 1 thật** — poller T4-182
  instance 1 (proc_af664d19db2c: poll thật #19 03:08:43Z +
  #20 03:09:29Z — **overlap +22 s ĐÃ BIẾT, không phải mốc
  mù mới**) + 6 artifact. **#101: 5 thô → 0 thật** (4 file
  đã biết đợt 183 + **1 MỚI proc_05486d86b251** — log
  poller T4-183, span 03:09:07Z (btime #100 TRÍCH) →
  06:12:27Z — trích dẫn, 0 thật). **#102: 5 thô → 0 thật
  MỚI** — 3 file trích đã biết (proc_09bd0ea2c544,
  proc_567743a6f6b9, proc_95067dbe9645) + **proc_66b0edb1fca4**
  (log T5-183, span 05:12:27Z (btime #101 TRÍCH trong dòng
  REPLAY-WATCH-183-START) → 08:35:00Z (end= TRÍCH) — trích
  dẫn) + **proc_fb8b22e27c07** (log sampler T9-183, span
  05:42:04–07:37:05Z — daemon ĐÃ BIẾT, mẫu của nó đã đếm
  trong content.py, KHÔNG overlap tại #102). **Kết luận:
  0 hoạt động thật mới tại #87–#102 ngoài overlap #100/
  #102 đã biết.**

### §3.3 Hole-recheck lần 28 (NEW=0 mọi hố)

Script `hole-recheck9797.py`, chạy ~09:02:20–09:04:38Z, log
`hole-recheck184.log` (B1 đã kiểm bằng `grep 08:54:00`
trước khi chạy). **LƯU Ý: script còn chạy khi T4 attempt1
khởi động 09:04:22Z — xem F-184-T2-8 (§4.2).**

- **H-E1-88 (19:32:59–20:17:30Z 20/11): inside=337,
  float-trap=337, NEW=0** — lần thứ 28 liên tiếp 0 mới.
- **H-U16 (15:06:19–17:35:47Z 23/11, hố U max 8.968 s):
  inside=3, float-trap=3, NEW=0** — lần thứ tư kiểm, 0 mới.
- H-U7 (10:08:01–10:28:06Z 22/11): inside=0, NEW=0; H-U8
  (10:33:43–10:53:31Z): inside=0, NEW=0 — 2 hố vẫn trống.
- Mọi hố khác đều NEW=0 (H-R1/H-R1-old/H-S1/H-S2/H-S3/H-T1/
  H-U1/H-U2/H-U2-old/H-U3/H-U4/H-U5/H-U6/H-U9/H-U10/H-U11/
  H-S4/H-T2/H-U12/H-U13/H-U14/H-U15 inside 0–10, đều
  float-trap đã biết).

### §3.4 Kết luận mù

- **Mù #96? (#64) VẪN MỞ** — R file 1.238 s lần thứ 20 không đổi;
  không mốc mới nào trong cửa sổ.
- **Mù #95? (#63) / #94? (#62) / #88? / #77?: VẪN MỞ** —
  hole-recheck lần 28 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới).
- **CERT/FULL GIỮ 76/91** (vì #77? và #88? vẫn mở).
- U file-gap max 8.968 s KHÔNG ĐỔI (hố H-U16 đã kiểm, NEW=0);
  U union-B max 7.861 s KHÔNG ĐỔI.

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ script nặng

### §4.1 (m) #56 — lần thứ 27, KHÔNG THU HẸP (5 hướng DB MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1). Cửa ứng viên [19:33:20Z, 19:33:37Z] = epochs
1795203200..1795203217 (= btime #56 + [33 s, 49,8 s]). Run 156:
run_id 9c7b6986-46fd-4a31-beea-2e36272d1d26, sched 1795196151
(17:35:51Z), started 1795201518 (19:05:18Z), finished 1795205974
(20:19:34Z), succeeded, request_id NULL.

- **(ci) DB `scheduler.job_runs` worker_claimed_at_utc trong W
  (MỚI): 0 dòng. ÂM TÍNH.**
- **(cii) DB `scheduler.doctor_run_plans` created_at trong W
  (MỚI): 0 dòng. ÂM TÍNH.**
- **(ciii) DB `agent.subagent_spawns` created_at (epoch giây)
  trong W (MỚI): 0 dòng. ÂM TÍNH.**
- **(civ) DB `runtime.events` created_at trong W (MỚI):
  0 dòng. ÂM TÍNH.**
- **(cv) DB `runtime.tool_calls` created_at trong W (MỚI):
  0 dòng. ÂM TÍNH.**
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức GIỮ 14.**
  Tổng 105 hướng (100 tới đợt 183 + 5 hướng mới đợt này —
  lần thứ 27 không thu hẹp, tất cả 0 dòng).
- **Hướng file-based (vii)/(viii)/(vii-b)/(vii-c) (m56-184.py,
  chạy ~09:12–09:14Z, SAU khi T4 attempt2 hợp lệ + poller
  thoát — KHÔNG có attempt nào chạy): (vii) 333 file trong
  D, max mtime 20:15:33.130Z (< mốc max 20:19:34Z — KHÔNG file
  mới); (viii) 0 exec-log có mtime trong D; (vii-b) 0 file tại
  20:16:00–20:17:00Z; (vii-c) 0 file tại 20:19:30–20:19:40Z.
  ÂM TÍNH — lần thứ 27 không thu hẹp.**

### §4.2 Tuân thủ luật script nặng đợt 184 — VI PHẠM (F-184-T2-8)

- T4-184 mở poller 08:46:16Z (gate0wait, hạn 10:30Z). T2-184
  kiểm poll-log + `ps` TRƯỚC MỖI script nặng. Diễn biến gate:
  poll #1 08:46:16Z gate0=T5 xanh, RAM 987 MB < 1.024 (gate A
  ĐỎ); poll #2 08:47:02Z RAM 1.067 MB — cả hai gate xanh
  NHƯNG lock còn giữ bởi T0-184 (O8) nên attempt chưa chạy;
  poll #3–#4 RAM 873/1.039 MB (gate A lúc đỏ lúc xanh, lock
  còn giữ); poll #5 08:49:19Z lock TRỐNG, RAM 1.627 MB — cả
  hai gate xanh + lock trống, NHƯNG load1 6,57/load5 5,38
  (gate A còn đòi load1<2 VÀ load5<2) nên attempt vẫn chưa
  chạy; poll #6–#14 load hạ dần (load5 5,00 → 2,03), RAM dao
  động 873–1.627 MB; poll #15–#16 load1/load5 < 2 NHƯNG RAM
  969/903 MB < 1.024 (gate A ĐỎ vì RAM).
- **Walk mù chạy 08:53:06–08:54:39Z + merged/content/sessions
  tới ~08:56Z — đều trong lúc gate A ĐỎ** (load5 3,10 → 2,37
  > 2, rồi RAM < 1.024) **và KHÔNG có attempt nào chạy**
  (kiểm `ps` + poll-log trước mỗi script).
- **RAM đảo chiều:** sau 20 phút rơi đều (1.627 MB poll #5 →
  403 MB ~09:02Z), RAM hồi mạnh: poll #21 09:01:21Z 549 MB →
  poll #25 09:04:21Z **1.088 MB** (gate A đủ) → poll #26
  09:08:13Z 2.112 MB. Nguyên nhân hồi RAM chưa xác định
  (balloon host-side, thuộc T9 — xem F-184-T2-9); KHÔNG phải
  do script T2 (process T2 ngắn hạn, đã thoát).
- **Hole-recheck khởi động ~09:02:20Z — SAU kiểm poll #21
  (09:01:21Z, RAM 549 MB, gate A ĐỎ rõ, 0 attempt) — ĐÚNG
  LUẬT lúc khởi động.** Nhưng script dài ~125 s; **giữa lúc
  chạy, poll #25 09:04:21Z gate lật xanh → T4 khởi động
  attempt1 09:04:22Z khi hole-recheck còn ~16 s** (kết thúc
  09:04:38Z; file holerecheck-all.txt ghi 09:04:38.625Z —
  find kết thúc ở thời điểm KHÔNG xác định được trong
  khoảng chạy, pha cuối là ghi file + phân loại, nhẹ CPU).
- **Hậu quả (bằng chứng T4):** class-B attempt1 (file
  `classb-t4-attempt1-6ecd948e.txt`, 09:07:51Z): sampler n=101,
  **load1_max=4,48 (vượt ngưỡng B2 ≤4)**; B2 VI PHẠM với
  ps-before/after nêu đích danh 2 process T2
  (`python3 hole-recheck9797.py`, pid 348035 + shell cha
  348034) là "process phân tích nặng lượng khác"; B1/B3/B4/
  B5 đều ĐẠT. **Attempt1 20/20 BỊ HỦY — lượt nhiễm tải,
  KHÔNG dùng verdict; T4 phải retry** (attempt2 09:08:13Z,
  20/20 + lớp B ĐẠT 5/5, tickCost median 43,5 ms — LƯỢT HỢP
  LỆ, poller thoát; lượt yên #53 thuộc T4-184).
- **Bài học:** kiểm-trước-khởi-động là CHƯA ĐỦ với script
  dài — gate có thể lật giữa chừng khi RAM/load dao động
  mạnh quanh ngưỡng. Với script > ~1 chu kỳ poll (45 s),
  chỉ chạy khi gate ỔN ĐỊNH đỏ (cả hai điều kiện chặn đều xa
  ngưỡng) HOẶC sau khi T4 đã đóng attempt/poller thoát.
  **Chuỗi 0 vi phạm bắt đầu lại từ 0 đợt này → T4-184/
  parent quyết** (T2 báo trung thực, không tự quyết chuỗi).
  Đây là vi phạm NẶNG HƠN F-183-T2-7 (đợt 183: 0 chồng chéo,
  kết quả đứng) — đợt này có chồng chéo THẬT (~16 s) và
  attempt1 BỊ HỦY.

## §5. EPERM probe #102 + sweep

- **Probe #102: chạy 08:46:07Z, boot 6ecd948e, ok=2 fail=0,
  exit 0.** Log `hidden_files/eperm-probe-v2.log` 282 → 284
  dòng (+1 boot-changed, +1 probe#102); heartbeat n=102.
  **MemAvailable lúc probe: 1.218.652 kB** (08:45:52Z). Cửa
  sổ probe #102: 05:45:17Z → 08:46:07Z = 10.850 s. **Probe
  #102 bao btime #102 (07:07:05Z).** Sóng EPERM thật gần
  nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #102** (script `eperm-sweep9797.py`, log
  `eperm-sweep184.log`, chạy ~09:14Z — SAU khi T4 attempt2
  hợp lệ + poller thoát, 0 attempt chạy; cửa sổ probe
  [05:45:17Z, 08:46:07Z]): **238 *.log có mtime trong cửa
  sổ**; **6 file có marker (26 lần)** — proc_db760769d06e.log
  (log main-agent: "CẢNH BÁO" ×1 + "Operation not permitted"
  ×1 + "sóng EPERM đã tắt" ×3), proc_995453354f9a.log (log
  T2-183: ×1 + ×1 + ×4 — chính là bản liệt kê của sweep
  #101), o8-183t0.log ("sóng EPERM đã tắt" ×3),
  eperm-sweep183.log ("CẢNH BÁO" ×1 + "Operation not
  permitted" ×1 + "sóng EPERM đã tắt" ×4 — chính là bản
  liệt kê của sweep #101), o8-183t8.log ("sóng EPERM đã
  tắt" ×3), o8-184t8.log ("sóng EPERM đã tắt" ×3) —
  **TẤT CẢ trích dẫn, 0 sóng thật** (0 lần "sóng EPERM vẫn
  bật" trong toàn bộ 238 file).
- **Probe #103: chạy 09:20:21Z, boot e0921bda, ok=2 fail=0,
  exit 0.** Log `hidden_files/eperm-probe-v2.log` 284 → 286
  dòng (+1 boot-changed, +1 probe#103); heartbeat n=103.
  **MemAvailable lúc probe: 1.407.228 kB** (09:20:21Z). Cửa
  sổ probe #103: 08:46:07Z → 09:20:21Z = 12.254 s. **Probe
  #103 bao btime #103 (09:14:55Z).**
- **Sweep #103** (script `eperm-sweep9797.py` — cửa sổ đổi
  sang [08:46:07Z, 09:20:21Z] — log `eperm-sweep184b.log`,
  chạy ~09:21Z, sau khi T4 poller đã thoát, 0 attempt chạy):
  **81 *.log có mtime trong cửa sổ**; **3 file có marker
  (27 lần)** — proc_eb6f312d6d39.log (log exec của CHÍNH T2
  đợt này, agent 69e1c3d1: "CẢNH BÁO" ×3 + "Operation not
  permitted" ×3 + "sóng EPERM đã tắt" ×6 — trích output
  sweep #102), o8-184t0.log ("sóng EPERM đã tắt" ×3),
  eperm-sweep184.log ("CẢNH BÁO" ×3 + "Operation not
  permitted" ×3 + "sóng EPERM đã tắt" ×6 — chính là bản
  liệt kê của sweep #102) — **TẤT CẢ trích dẫn, 0 sóng
  thật** (0 lần "sóng EPERM vẫn bật").
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
  đối chiếu độc lập `m-check184.py` (log `m-check184.txt`).
- INSIDE tính bằng `m-check184.py` (log `m-check184.txt`);
  FULL147 p10/p90 khớp T2-183 bằng assert trong script;
  chain sau #101 = 3 khớp.
- (m) #102: KHÔNG cần boot_est (margin xấu nhất 6,341 s
  >> 1 s); prior δ #90 (+0,32 s), δ #92 (+0,396 s)
  và boot_est #95 (+0,99 s) đều cho offset TRONG dải — đồng
  thuận, không như #91 (hai prior trái chiều).
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness
  TRỪ exec-log T2-177 (ec756e29) + T2-178 (b387ac70) +
  T2-179 (52dfc922) + T2-180 (42bae1a0) + T2-181 (11a8480f) +
  T2-183 (7b6d04e1) + T2-184 (dir chưa biết, loại qua marker
  "round184-t2"/"m-check184") + TRỪ mọi log chứa marker
  T2 ("m-check17", "FULL13", "round178-t2", "round179-t2",
  "round180-t2", "round182-t2", "round183-t2", "round184-t2",
  "m-check180", "m-check181", "m-check182", "m-check183",
  "m-check184") (F-178-T2-4); dir T2-182 không rõ id — log
  của nó mang marker "round182-t2"/"m-check182" nên đã bị
  loại qua marker; kiểm B1 ở MỌI chỗ dùng trước khi chạy
  (F-179-T2-4 đã sửa); kiểm W ở MỌI script trước khi chạy
  (F-182-T2-10 đã làm); output vào thư mục riêng, không ghi
  đè file cũ (F-166-T2-2); kiểm epoch GAP bằng `date -d`
  trước khi chạy sessions; chụp meminfo cùng lệnh probe
  (F-172-T7-2-7). **Kiểm poll-log + `ps` TRƯỚC MỖI script
  nặng, kể cả script chạy nối** (F-183-T2-7) — **và BÀI HỌC
  MỚI đợt này (F-184-T2-8): kiểm-trước-khởi-động CHƯA ĐỦ
  với script dài; gate có thể lật giữa chừng.**
- **Sửa phương pháp đợt này:** (i) content script bổ sung
  replay-watch-183 + ram-sampler-183 + system head #102
  (F-184-T2-1); (ii) witness mở rộng sang #102; (iii)
  m-check tính FULL148 (#102); (iv) m56 thêm 5 hướng DB
  mới (ci)–(cv); (v) ghi nhận artifact trích dẫn mới:
  log main-agent nhúng build-loop-log có thể false-witness
  (F-184-T2-3) — triage tay mọi hit witness thô.
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.

### §6.2 Sai số / caveat (F-184-T2-*)

- **F-184-T2-1 — (m) #102 DƯƠNG ở cấp T2, parent quyết
  cuối; caveat overlap KHÔNG lật verdict.** Offset btime
  40,341 s, TRONG dải; offset thật ∈ (39,341 s, 40,341 s] —
  caveat phân số KHÔNG lật được (xấu nhất vẫn TRONG 6,341 s).
  Overlap #102 +17 s (watcher-183) lấy theo nghĩa đen sẽ đưa
  offset #102 về ~23,3 s — NGOÀI dải dưới; tiền lệ #87/#90
  cấm lật bằng overlap (áp dụng đối xứng với #91/#93/#95/
  #96/#97/#99/#100 — #99 có overlap +22 s Y HỆT và parent
  đã chấp nhận DƯƠNG; #100 có +22/+6 s và parent đã chấp
  nhận DƯƠNG). Poller/sampler/T8 KHÔNG overlap tại #102.
- **F-184-T2-2 — INSIDE #102 TRUE (FULL148); dải chéo
  FALSE.** Chuỗi INSIDE 3 → 4 (dải phương pháp chi phối theo
  F-165-T2-1). Mâu thuẫn ngược hướng lần thứ 15; chuỗi mâu
  thuẫn mới = 3.
- **F-184-T2-3 — Artifact trích dẫn MỚI: log main-agent
  nhúng build-loop-log false-witness #86.** Exec-log agent
  0a4689c3 (proc_db760769d06e.log, mtime 08:43:28Z 24/11)
  chứa toàn bộ lịch sử build-loop-log; span trích
  00:16:31Z → 23:54:13Z ôm btime #86 nhưng 0 timestamp nào
  gần 01:01:37Z trong file. Sessions.py đếm span, không đếm
  mark — mọi hit witness thô đều phải triage tay (đã làm
  cho #86, #91–#102 đợt này). Không đổi verdict mù nào.
- **F-184-T2-4 — (m) #56: 5 hướng DB mới, lần thứ 27 không
  thu hẹp.** Tổng 105 hướng, tất cả 0 dòng đợt này.
  File-based: 333 file trong D max 20:15:33.130Z (< mốc max
  20:19:34Z); 0 exec-log trong D; 0 file tại (vii-b)/(vii-c).
- **F-184-T2-5 — Run 183 SUCCEEDED 08:13:58Z (số liệu; kết
  cục thuộc T7-184).** 1.313 s TRƯỚC hạn; claimed→finished
  85 s (ca ≥60 s — thuộc T7-184; T2 KHÔNG phán); claimed ĐÃ
  ĐỔI sau khi T7-183 đóng cờ, theo mẫu run 182. Run 184
  đang running — kết cục thuộc T7-184/T7-185.
- **F-184-T2-6 — EPERM probe #102 + sweep #102 + probe #103
  + sweep #103 — ghi nhận?**
  (Probe #102 ok=2 fail=0, boot 6ecd948e, bao btime #102;
  sweep #102: 238 *.log, 6 file có marker (26 lần) — TẤT CẢ
  trích dẫn, 0 sóng thật. Probe #103 ok=2 fail=0, boot
  e0921bda, bao btime #103; sweep #103: 81 *.log, 3 file có
  marker (27 lần) — TẤT CẢ trích dẫn, 0 sóng thật.)
- **F-184-T2-7 — ĐÍNH CHÍNH NHỎ (prose, không đổi verdict):
  T2-183 ghi sai giờ requeue eid 10637.** LIMITS 183 +
  m-check183 docstring viết "05:12:48.125586Z" — đúng là
  **05:13:08.125586Z** (epoch 1795497188.125586 = btime #101
  +41,126 s; 05:12:27 + 41,126 s = 05:13:08.126). Mọi phép
  tính epoch đợt 183 đều đúng; chỉ prose HH:MM:SS lệch 20 s.
  Quyết (f) đợt 183 ("#101 +41,126 s") KHÔNG đổi.
- **F-184-T2-8 — VI PHẠM TUÂN THỦ: hole-recheck chồng lên
  T4 attempt1.** Khởi động ĐÚNG LUẬT (poll #21 RAM 549 MB,
  gate A ĐỎ) nhưng gate lật xanh giữa chừng (poll #25 RAM
  1.088 MB); script còn ~16 s khi attempt1 khởi động
  09:04:22Z; class-B B2 VI PHẠM (load1_max 4,48 > 4), bằng
  chứng nêu đích danh process hole-recheck của T2;
  attempt1 20/20 BỊ HỦY, T4 retry (attempt2 HỢP LỆ).
  Chuỗi 0 vi phạm (bắt đầu lại từ 0 đợt này) → T4-184/
  parent quyết. Bài học: với script dài, kiểm-trước-
  khởi-động CHƯA ĐỦ — chỉ chạy khi gate ỔN ĐỊNH đỏ hoặc
  sau khi T4 đóng attempt.
- **F-184-T2-9 — RAM rơi rồi hồi mạnh trong phiên (quan sát,
  thuộc T9).** MemAvailable 1.627 MB (poll #5, 08:49Z) →
  403 MB (~09:02Z) → 2.112 MB (poll #26, 09:08Z). T4 attempt
  bị chặn bởi RAM phần lớn phiên; nguyên nhân hồi RAM chưa
  xác định (balloon host-side). Process T2 ngắn hạn, không
  phải nguyên nhân (RSS lớn nhất là hatch daemon 318 MB).
- **F-184-T2-10 — Số hiệu #102 CHỜ T0-184 xác minh 9 nguồn.**
  T8-183 ghi nhận sự kiện + btime; T0-184 đang chạy O8 lúc
  T2 đóng. POSTBOOT_PASS #102 ĐÃ CÓ (T5-184 — poll #1 T4
  thấy t5flag=PASS, t5src=184-t5/POSTBOOT_PASS — thuộc
  T5-184).
- **F-184-T2-11 — REBOOT #103 MỚI trong lúc T2 đóng cờ
  (boot e0921bda, btime 09:14:55Z, gap #102→#103 = 7.670 s).**
  Reboot xảy ra SAU khi m56 + sweep #102 xong (09:14:40Z)
  và TRƯỚC khi T2 đóng cờ (09:18Z) — KHÔNG ảnh hưởng số
  liệu (m) #102 / INSIDE #102 / mù / (m) #56 / sweep #102
  (tất cả tính trên #102, trước #103). **LƯU Ý đồng hồ:**
  lệnh `cat /proc/sys/kernel/random/boot_id` lúc 09:14:59Z
  vẫn trả 6ecd948e trong khi btime #103 là 09:14:55Z — lệch
  4 s, nhiều khả năng đồng hồ cell nhảy lùi khi reboot
  (cùng họ lệch đã biết: đồng hồ cell nhanh trước #99,
  delta ≥ 22 s — F-181-T9-3). Btime #103 lấy theo
  /proc/stat + /proc/uptime (267,87 s lúc 09:19:23Z →
  09:14:55Z) + /proc/1 mtime 09:15:06.753Z (+11,753 s) —
  ba nguồn nội bộ khớp nhau; số hiệu #103 CHỜ T0-185 xác
  minh 9 nguồn. **(m) #103 + INSIDE #103 thuộc T2-185**
  (cửa hẹp [09:14:55Z, 09:33:55Z] chưa khép lúc T2 đóng —
  T2-184 KHÔNG phân loại). Watcher-184 (T5-184) + sampler
  T9-184 chết theo #103 — POSTBOOT_PASS #103 thuộc T5-185.

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 184)

- **(a) (m) #102 DƯƠNG — chấp nhận?** (requeue +40,341 s,
  TRONG dải [33; 49,8], KHÔNG sát biên; 1 run sống; caveat
  phân số KHÔNG lật được; overlap +17 s (watcher-183) không
  lật verdict theo tiền lệ #87/#90.)
- **(b) INSIDE #102 TRUE (FULL148, chuỗi 3 → 4) — chấp
  nhận?** (dải chéo FALSE — mâu thuẫn ngược hướng lần thứ
  15, chuỗi mới = 3.)
- **(c) Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ — chấp nhận giữ
  mở?** (R file 1.238 s lần thứ 20 không đổi; hole-recheck
  lần 28 NEW=0 mọi hố; U file-gap max 8.968 s KHÔNG ĐỔI;
  witness #101/#102 0 thật mới; artifact trích dẫn mới
  F-184-T2-3.)
- **(d) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều
  kiện?** (lần thứ 27 không thu hẹp; 5 hướng DB mới, tổng
  105 hướng — tất cả 0 dòng; file-based: 333 file trong D
  max 20:15:33.130Z.) n chính thức GIỮ 14.
- **(e) EPERM probe #102 + sweep #102 + probe #103 + sweep
  #103 — ghi nhận?** (Probe #102 ok=2 fail=0, boot 6ecd948e,
  bao btime #102; sweep #102: 238 *.log, 6 file có marker
  (26 lần) — TẤT CẢ trích dẫn, 0 sóng thật. Probe #103
  ok=2 fail=0, boot e0921bda, bao btime #103; sweep #103:
  81 *.log, 3 file có marker (27 lần) — TẤT CẢ trích dẫn,
  0 sóng thật.)
- **(f) F-184-T2-8 — VI PHẠM tuân thủ (hole-recheck chồng
  attempt1, B2 VI PHẠM, attempt1 20/20 BỊ HỦY): parent/T4
  quyết chuỗi 0 vi phạm (bắt đầu lại từ 0 đợt này) giữ hay
  đứt? Và có cần biện pháp gì thêm ngoài bài học đã ghi?**
  (Khởi động ĐÚNG LUẬT lúc gate A ĐỎ; gate lật xanh giữa
  chừng; chồng ~16 s ở pha cuối script; attempt2 đã HỢP LỆ
  nên lượt yên #53 đứng.)
- **(g) Run 183 SUCCEEDED 08:13:58Z (1.313 s trước hạn,
  claimed→finished 85 s — ca ≥60 s thuộc T7-184) — ghi nhận
  cho T7-184?** (Không phải verdict của T2.)
- **(h) n ứng viên 44/45 → 45/46 (nếu chấp nhận #102 DƯƠNG)
  — chấp nhận?** (n chính thức GIỮ 14.)
- **(i) Số hiệu #102 chờ T0-184 (9 nguồn) + POSTBOOT_PASS
  #102 ĐÃ CÓ (T5-184) — ghi nhận?** (Thuộc T0/T5-184.)
- **(j) Đính chính nhỏ F-184-T2-7 (prose giờ eid 10637 đợt
  183: 05:12:48 → 05:13:08Z; epoch đúng, không đổi verdict)
  — ghi nhận?**
- **(k) Reboot #103 MỚI (e0921bda, btime 09:14:55Z, gap
  7.670 s — F-184-T2-11): ghi nhận; số hiệu chờ T0-185;
  (m) #103 + INSIDE #103 + POSTBOOT_PASS #103 thuộc đợt
  185?** (Probe #103 ok=2 fail=0; sweep #103: 81 *.log,
  3 file có marker (27 lần) — TẤT CẢ trích dẫn, 0 sóng
  thật.)

