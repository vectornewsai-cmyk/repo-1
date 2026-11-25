# PHASE 9 — ROUND 186 — T2 EPERM LIMITS

**T2 đợt 186** — EPERM probe #105, phân loại (m) #104 **KHÔNG CÓ
ĐIỂM** + (m) #105 **DƯƠNG (CUỐI)** + INSIDE #104 TRUE (FULL150,
chuỗi 5 → 6) + INSIDE #105 TRUE (FULL151, chuỗi 6 → 7), mù
#96?/#88?/#94?/#95?/#77?, (m) #56 lần 29.
Đợt 186 mở 17:35:51Z 24/11/2026 (00:35:51 +07 25/11; lượt cron
00:35 +07). Boot lúc mở đã là cea79500 (#106, btime 17:19:50Z) —
reboot #106 xảy ra TRƯỚC khi đợt mở (giữa hai đợt; gap #105→#106
= 14.778 s — số hiệu chờ T0-186).
**Số hiệu #105: chờ T0-186 XÁC MINH 9 nguồn** (boot 053a35c3,
btime 13:13:32Z, gap #104→#105 = 7.190 s — T7-185 + T9-185 KHỚP
btime; parent 185 đã xác minh boot_id hiện tại là 053a35c3).
**Số hiệu #104: T0-185 ĐÃ XÁC MINH 9 nguồn TƯƠI** (boot
9161bfd1, btime 11:13:42Z, gap #103→#104 = 7.127 s). Phân loại
dưới đây là **phân loại cuối ở cấp T2 — parent quyết cuối**.
**Run 185 SUCCEEDED 14:31:59Z** (số liệu DB tươi; kết cục thuộc
T7-186; claimed→finished 94 s — FLAG ca CA ≥60 s có thể mới, T2
chỉ ghi số, KHÔNG phán CA).
**Tuân thủ luật script nặng đợt 186: KHÔNG VI PHẠM (xem §4.2)**
— walk mù + hole-recheck + sweep + m56-file CHỜ poller T4-186
thoát hẳn mới chạy (gate dao động sát ngưỡng 2 lúc T2 kiểm —
bài học F-184-T2-8); watchdog v2 thử khô ĐẠT, 0 kích hoạt giả.
Chuỗi 0 vi phạm 1 → 2 (parent quyết cuối).

## §0. Headline

- **(m) #104: KHÔNG CÓ ĐIỂM (phân loại CUỐI ở cấp T2, parent
  quyết cuối).** 0 requeue trong cửa hẹp [11:13:42Z, 11:32:42Z]
  VÀ 0 requeue trong cửa rộng [11:13:42Z, 13:13:32Z] (tới btime
  #105) — DB tươi, 0 dòng (tiền lệ #94: 0 requeue cửa hẹp +
  cửa rộng → KHÔNG CÓ ĐIỂM). Cửa hẹp có 4 event, 0 requeue.
- **(m) #105: DƯƠNG (phân loại CUỐI ở cấp T2, parent quyết
  cuối).** Requeue duy nhất eid 10756, run 185 (3d57c217),
  13:14:06.931184Z = btime **+34,931 s** — TRONG dải [33; 49,8],
  **SÁT biên dưới** (cách biên dưới 1,931 s — chặt nhất từ
  trước tới nay; cách biên trên 14,869 s). Caveat phân số
  KHÔNG lật được (offset thật ∈ (33,931 s, 34,931 s] — xấu
  nhất vẫn TRONG 0,931 s). Overlap +24 s (watcher-185, mẫu 18)
  KHÔNG lật verdict theo tiền lệ #87/#90 — #99 có overlap +22 s
  và parent đã chấp nhận DƯƠNG đợt 182; #100 có +22/+6 s và
  parent đã chấp nhận DƯƠNG đợt 183.
- **INSIDE #104: TRUE (FULL150) — chuỗi 5 → 6.** Dải chéo
  FULL149 FALSE (muộn 6.034 s qua đầu dải) — **mâu thuẫn
  ngược hướng lần thứ 17; chuỗi mâu thuẫn mới = 5**.
- **INSIDE #105: TRUE (FULL151) — chuỗi 6 → 7.** Dải chéo
  FULL150 FALSE (muộn 5.562 s qua đầu dải) — **mâu thuẫn
  ngược hướng lần thứ 18; chuỗi mâu thuẫn mới = 6**.
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 22 không đổi);
  hole-recheck lần 30 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới —
  lần thứ 30 liên tiếp; H-U16 3 hit, 0 mới); U file-gap max
  8.968 s KHÔNG ĐỔI; U union-B max ĐỔI 7.861 s → 8.643 s (hố
  lặng giữa hai đợt 24/11, chứa boot #106 đã biết — KHÔNG
  phải hố mù mới, xem F-186-T2-9); witness #103/#104/#105/
  #106 0 thật mới (ngoài overlap #100/#105 đã biết).
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 29 không thu hẹp**
  (5 hướng DB MỚI (cxi)–(cxv): tất cả 0 dòng; tổng 115 hướng;
  file-based xem §4.1).
- **EPERM probe #105: ok=2 fail=0** (17:49:56Z, boot cea79500
  #106, bao btime #105). Sweep #105: 170 *.log, 4 file có
  marker (14 lần) — tất cả trích dẫn, 0 sóng thật (xem §5).
- **REBOOT #106 MỚI trước khi đợt mở** (boot cea79500,
  btime 17:19:50Z, gap #105→#106 = 14.778 s — T0-186 XÁC
  MINH 9 nguồn; (m) #106 thuộc T2-187).
- **Run 185 SUCCEEDED 14:31:59Z** (margin +232 s TRƯỚC hạn
  14:35:51Z; viết lại ×1 tại #105; claimed→finished 94 s —
  FLAG ca CA ≥60 s có thể mới cho T7-186; T2 chỉ ghi số,
  KHÔNG phán CA).
- **Tuân thủ luật script nặng đợt 186: KHÔNG VI PHẠM** —
  mọi script nặng CHỜ poller T4-186 thoát hẳn (gate dao động
  sát ngưỡng lúc kiểm — bài học F-184-T2-8 đã áp dụng đúng
  như đợt 185); watchdog v2 thử khô ĐẠT (arm OK, 0 kích hoạt
  giả). 0 chồng lấn với attempt T4. Chuỗi 0 vi phạm 1 → 2
  (parent quyết cuối).

## §1. Điểm (m)

### §1.1 (m) #104 — KHÔNG CÓ ĐIỂM (CUỐI, đối chiếu độc lập)

- **Btime #104: 11:13:42Z** (epoch 1795518822), boot 9161bfd1,
  gap #103→#104 = 7.127 s. **Số hiệu T0-185 ĐÃ XÁC MINH 9
  nguồn TƯƠI** (parent chấp nhận (e) đợt 185).
- T2-186 xác minh độc lập từ DB tươi (muse.db, đọc
  ~17:41–17:43Z): **0 requeue** trong cửa hẹp [11:13:42Z,
  11:32:42Z] VÀ **0 requeue** trong cửa rộng [11:13:42Z,
  13:13:32Z] (tới btime #105). Cửa hẹp có đúng 4 event, 0
  requeue: reconciled 11:15:34.068Z eid 10727 + dispatched
  11:15:34.114Z eid 10728 + succeeded 11:15:34.150Z eid 10729
  (run 010e7805) + succeeded 11:16:07.605Z eid 10730 (run 184
  finished — kết cục run 184). Requeue gần nhất TRƯỚC btime
  là eid 10724 lúc 11:11:06.655Z = btime **−155,345 s**
  (viết lại lần 2 của run 184, T0-185: KHÔNG do reboot).
- **Đúng 1 run sống tại btime #104** (scheduled ≤ btime AND
  finished > btime, DB tươi): run 184 (sched 08:35:51Z,
  finished 11:16:07Z succeeded). Không run nào khác.
- Toàn ngày 24/11 (tới ~17:45Z): đúng 7
  `requeued_after_restart` (eid 10580 #99, 10610 #100,
  10637 #101, 10667 #102, 10697 #103, 10724 run 184 LẠI
  11:11:06.655Z — daemon restart, KHÔNG phải requeue reboot —
  và 10756 #105). 0 requeue sau 13:14:06Z tới 17:45:00Z
  (bao cửa hẹp #106 tới lúc đọc — chỉ ghi nhận số thô,
  (m) #106 thuộc T2-187).
- **Phán: (m) #104 KHÔNG CÓ ĐIỂM — parent quyết cuối. n
  KHÔNG ĐỔI do #104** (tiền lệ #94: 0 requeue cửa hẹp +
  cửa rộng → KHÔNG CÓ ĐIỂM).

### §1.2 (m) #105 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #105: 13:13:32Z** (epoch 1795526012), boot 053a35c3,
  gap #104→#105 = 7.190 s. **Số hiệu chờ T0-186 XÁC MINH 9
  nguồn** (T7-185 + T9-185 KHỚP btime; parent 185 đã xác minh
  boot_id hiện tại là 053a35c3).
- T2-186 xác minh độc lập từ DB tươi (muse.db, đọc
  ~17:43–17:45Z): **requeue duy nhất** trong cửa hẹp
  [13:13:32Z, 13:32:32Z]: **eid 10756, run 185 (3d57c217),
  event `requeued_after_restart`, 13:14:06.931184Z = btime
  +34,931 s, TRONG dải [33; 49,8]** (cách biên dưới 1,931 s
  — **SÁT biên dưới, chặt nhất từ trước tới nay**; cách biên
  trên 14,869 s; KHỚP từng số với số sơ bộ T7-185 +34,931 s).
  Cửa hẹp đã khép hẳn lúc đọc. Cửa hẹp còn 5 event khác:
  dispatched 13:14:07.020Z eid 10757 + reattached_after_restart
  13:14:07.109Z eid 10758 (viết lại lần 1 của run 185) +
  reconciled 13:15:34.056Z eid 10759 + dispatched 13:15:34.077Z
  eid 10760 + succeeded 13:15:34.116Z eid 10761 (run fc9cf6c4)
  — không phải requeue.
- **Đúng 1 run sống tại btime #105** (DB tươi): run 185
  (sched 11:35:51Z, finished 14:31:59Z succeeded). Không run
  nào khác.
- **Caveat phân số: offset thật ∈ (33,931 s, 34,931 s]** —
  DƯƠNG với mọi δ ∈ [0, 1 s] (xấu nhất vẫn TRONG 0,931 s —
  biên mỏng, ghi trung thực). Prior δ #90 (+0,32 s) →
  34,611 s; δ #92 (+0,396 s) → 34,535 s; boot_est #95
  (+0,99 s) → 33,941 s — đều TRONG, đồng thuận.
- **Caveat overlap (KHÔNG lật verdict, tiền lệ #87/#90):**
  watcher-185 (replay-watch-185) poll cuối 13:13:56Z
  boot=9161bfd1 (**+24 s**) — mẫu overlap thứ 18 (F-184-T5-1
  là mẫu 16 tại #102; F-185-T5-1 là mẫu 17 tại #103).
  Watcher CHẾT THEO #105 (log kết thúc 13:13:56Z, poll kế
  13:14:26Z không bao giờ chạy — cơ chế đồng hồ cell nhanh
  trước reboot như #103). Lấy +24 s theo nghĩa đen thì
  offset ~10,9 s — NGOÀI dải dưới. Nhưng tiền lệ đứng nói
  overlap là caveat, KHÔNG BAO GIỜ lật verdict btime —
  **#99 có overlap +22 s Y HỆT và parent đã chấp nhận DƯƠNG
  đợt 182; #100 có +22/+6 s và parent đã chấp nhận DƯƠNG
  đợt 183; #105 +24 s cùng LOẠI, lớn hơn một chút — ghi rõ,
  parent quyết**. Poller T4-185: KẾT THÚC 11:56:12Z — KHÔNG
  overlap. Sampler-185: mẫu #104 cuối 13:13:11Z = btime −21 s
  — KHÔNG overlap; mẫu #105 đầu 13:14:46Z = btime +74 s.
  T8-185: harness 12:03:46–12:18:56Z + O8 12:20:27–12:22:57Z
  — đều ~50' TRƯỚC btime #105, KHÔNG hoạt động nào gần btime.
  b2watch: 0 dòng.
- **Phán: (m) #105 DƯƠNG — parent quyết cuối. n ứng viên
  46/47 → 47/48** (nếu parent chấp nhận #105 DƯƠNG; #104
  KHÔNG CÓ ĐIỂM nên không cộng). **n chính thức GIỮ 14.**

### §1.3 Run 185 kết cục (số liệu; kết cục thuộc T7-186)

- **status SUCCEEDED, finished_at_utc 1795530719 =
  14:31:59Z — 232 s TRƯỚC hạn 14:35:51Z** (1795530951);
  sched 1795520151 = 11:35:51Z; started_at (hiện tại)
  1795526047 = 13:14:07Z (**viết lại ×1** — tại #105
  13:14:06Z, eid 10756/10757/10758); boot_gen cuối
  cron_boot_a5f49c21...; **claimed_at_utc 1795530625
  = 14:30:25Z; claimed→finished = 94 s** (≥60 s — **FLAG
  cho T7-186: ca CA ≥60 s có thể mới**; T2 chỉ ghi số,
  KHÔNG phán CA); **jitter 0** (started-gốc = sched);
  attempt 1; timed_out false.
- Run 08d940ea (sched 1795530951 = 14:35:51Z, KHÔNG phải
  run của đợt T): SUCCEEDED finished 1795531962 = 14:52:42Z
  (ghi nhận cho T7-186).
- Run 887c998d (sched 1795541751 = 17:35:51Z): running,
  boot_gen cron_boot_54857bd6... (#106) — run của đợt 186.

## §2. INSIDE — dải FULL150 (cho #104) + FULL151 (cho #105)

Script: `m-check186.py` (log `m-check186.txt`; exec
`m-check185.py` — FULL149 p10/p90 khớp bằng assert
1575,80/8763,80; chain sau #103 = 5).
Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1). Parent đã chốt FULL149 vào
sổ đứng đợt 185 (quyết (d)).

- **FULL150**: n=150, mean 1h42'01", median 1h55'20", p10
  1577,40 s, p90 8755,90 s, sd 0h54'13", in 90–150'=85,
  <60'=33, >180'=10, >240'=4 (= FULL149 + [gap #104 =
  7.127 s]).
- **FULL151**: n=151, mean 1h42'08", median 1h55'41", p10
  1579,00 s, p90 8748,00 s, sd 0h54'04", in 90–150'=86,
  <60'=33, >180'=10, >240'=4 (= FULL150 + [gap #105 =
  7.190 s]).
- **INSIDE #104: TRUE (FULL150) — chuỗi 5 → 6.** Dải
  [09:41:12Z, 11:40:50Z] neo 09:14:55Z (#103); btime #104
  11:13:42Z TRONG dải, cách biên dưới 5.550 s, cách biên
  trên 1.628 s. Đối chiếu vs FULL149 (neo #102): FALSE (dải
  [07:33:20Z, 09:33:08Z], muộn 6.034 s qua đầu dải) —
  **hai dải MÂU THUẪN NGƯỢC HƯỚNG, lần thứ 17; chuỗi mâu
  thuẫn mới = 5** (sau khi #103 lần 16, chuỗi = 4).
- **INSIDE #105: TRUE (FULL151) — chuỗi 6 → 7.** Dải
  [11:40:01Z, 13:39:30Z] neo 11:13:42Z (#104); btime #105
  13:13:32Z TRONG dải, cách biên dưới 5.611 s, cách biên
  trên 1.558 s. Đối chiếu vs FULL150 (neo #103): FALSE (dải
  [09:41:12Z, 11:40:50Z], muộn 5.562 s qua đầu dải) —
  **hai dải MÂU THUẪN NGƯỢC HƯỚNG, lần thứ 18; chuỗi mâu
  thuẫn mới = 6**.
- Tốc độ reboot: tới #104: 180 reboot / 326,92 h = 1 lần /
  109,0 phút; tới #105: 181 reboot / 328,92 h = 1 lần /
  109,0 phút.

## §3. Mù #96?/#95?/#94?/#88?/#77?

B0 = 11:15:18Z 21/11 (btime #64), B1 = 18:18:00Z 24/11 (giờ
chạy thực tế của walk, F-172-T2-12); cửa sổ 284.562 s. Walk
chạy 18:15:01–18:16:17Z (script `blind9797-investigate.py`,
log `blind186-investigate.log`) — **SAU khi poller T4-186
thoát 18:12:30Z** (kiểm `ps` + poll-log trước khi chạy:
0 process run-attempt/poll-wait; poll-t4.log mtime dừng
18:12Z; xem §4.2 về watchdog không arm — F-186-T2-8). Sàn
(floor) 19'07" = 1.147 s (đứng từ đợt 162).
**Kiểm B1 ở MỌI chỗ dùng trước khi chạy** (investigate B1 +
SEG U-end + merged + sessions + content U1 + witness B1 +
hole-recheck hi — tất cả 18:18:00Z); **W đã sửa ở MỌI
script trước khi chạy** (round186-t2; grep xác nhận 0 lần
nhắc round185-t2 còn sót — F-182-T2-10 không tái diễn).

### §3.1 Walk + file-marks (merged/content)

- Số file có mtime trong cửa sổ: repo-1 **3.081** (đợt 185:
  2.737), hidden_files **8.424** (8.099), outside **3.210**
  (3.124), /tmp **639** (36 — tăng mạnh: file tạm của các
  luồng đợt 186, T8/T4 work).
- Merged unique second-marks: **6.705** (185: 6.404).
- **R file (raw): 13 marks, MAX GAP 1.238 s** (11:15:29Z →
  11:35:56Z) — **OPEN, lần thứ 22 liên tiếp KHÔNG ĐỔI.**
  R union-A 1.222 s / union-B 1.211 s — OPEN.
- S file: 226 marks, max 3.235 s (13:01:51Z → 13:55:46Z) —
  OPEN; S union-A 662 s / union-B 591 s — CLOSED.
- T file: 210 marks, max 627 s — CLOSED; T union-A 38 s —
  CLOSED.
- **U file: 6.256 marks, max 8.968 s** (15:06:19Z →
  17:35:47Z 23/11) — **OPEN, KHÔNG ĐỔI vs đợt 185** (hố lặng
  giữa đợt, ôm cả btime #94 17:17:09Z mà KHÔNG có file mark
  nào). U union-A 8.968 s — OPEN; **U union-B 8.643 s —
  OPEN, ĐỔI (đợt 185: 7.861 s)** — hố mới 15:11:34Z →
  17:35:37Z 24/11 (**hố lặng GIỮA HAI ĐỢT, chứa btime #106
  17:19:50Z ĐÃ BIẾT, KHÔNG phải hố mù mới** — xem
  F-186-T2-9) + 7.861 s (15:06:19Z → 17:17:20Z 23/11, nhờ
  head #94) + 1.107 s.
- R-head 0; R-tail: last mark 11:38:26Z (2 s trước cuối R);
  U-tail: last mark 18:15:56Z (124 s trước B1).
- **Nguồn content MỚI (F-186-T2-3):** replay-watch-185
  (round185-t5, **184 strict poll 9161bfd1** trong U; poll
  cuối **13:13:56Z = btime #105 +24 s — OVERLAP #105**,
  mẫu 18) + ram-sampler-185 (repo-1/round185-t9, 94 dòng
  9161bfd1 + 28 dòng 053a35c3 trong U; dòng #104 cuối
  **13:13:11Z = btime #105 −21 s — KHÔNG overlap**; dòng
  #105 đầu 13:14:46Z = btime #105 +74 s) + system head #103
  09:15:06Z (đã có). Không nguồn mới nào có mark trong hố
  U max hay hố R.
- Content-ts trong hố R union (11:15:29–11:35:40Z): **0 hit**
  (chỉ mốc dpkg 11:35:40Z ở cuối hố — đã biết).
  Content-ts trong hố U max (15:06:19–17:35:47Z 23/11): chỉ
  mốc 17:17:09Z (btime #94 — trích trong poll T4-179 +
  header T0-179/T5-179/T8-179, viết SAU dispatch 17:35:51Z)
  + head #94 17:17:20Z (system mark) — **0 mốc mới.**

### §3.2 Sessions + witness (exec-log)

- Exec-logs có mtime trong cửa sổ: **309** (185: 360 —
  **GIẢM do pruning exec-log giữa các đợt, xem F-186-T2-7**);
  mtime trong R/S/T: **0/0/0**, trong U: 309. (Witness đếm
  307 — chênh đúng 2 = 2 exec-log của T2-183, witness loại
  qua thư mục còn sessions không loại; 0 ảnh hưởng.)
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
- **F-186-T2-7 (mới — phương pháp):** đếm exec-log đợt này
  GIẢM 360 → 309 dù cửa sổ DÀI hơn (B1 18:18:00Z so với
  11:48:00Z đợt 185) — đếm lại trực tiếp: cùng cửa sổ
  [B0, 11:48:00Z] nay chỉ còn 289 file (đợt 185 đếm 360) —
  **71 exec-log đã bị prune/xóa giữa hai đợt** (dọn thư
  mục agents). Witness 307 = sessions 309 − 2 (mẫu đứng).
  Verdicts KHÔNG ảnh hưởng: đợt 185 đã kiểm các file bị
  prune (0 thật cho #64–#85; #86 trích dẫn) — counts
  không so sánh được trực tiếp giữa các đợt nữa, chỉ so
  sánh verdicts.
- Witness #87–#106 (script `witness879394.py`, đã mở rộng
  sang #105 + #106; loại trừ dir T2-184/T2-185/T2-186 qua
  thư mục + marker "round186-t2"/"m-check186"; 39 log bị
  loại qua quote-marker): exec-logs trong cửa sổ 307.
  **#87: 0; #88: 0; #89: 0; #90: 0; #91: 0; #92: 0;
  #93: 0; #94: 0; #95: 0** (đợt 185 còn hit thô ở #93/#95
  — đã biến mất do pruning exec-log, F-186-T2-7; 0 ảnh
  hưởng verdict vì đợt 185 đã phân loại 0 thật).
  **#96: 3 thô → 0 thật** — proc_8f7c301fcd71 (**0 dòng
  trong ±180 s quanh btime #96**) + proc_f0bea09d5272
  (T9-180: 2 dòng "win-96 21:22:06Z" +70 s + "open-180
  21:22:21Z" +85 s, cả 4 mốc boot= đều 8d2a69df = **boot
  MỚI #96 — probe SAU reboot, KHÔNG phải hoạt động tại
  btime**) + proc_95067dbe9645 (trích đã biết).
  **#97: 1 thô → 0 thật; #98: 1 thô → 0 thật** (cùng
  proc_95067dbe9645).
  **#99: 4 thô → 0 thật** — 09bd0ea2c544 +
  4557ab41e3c7 (T5-181 flag-check) + 567743a6f6b9 +
  95067dbe9645 (đều trích đã biết; 2 file diagnostic
  replay-watch-181 đợt 185 đã bị prune).
  **#100: 7 thô → 1 thật** — poller T4-182 instance 1
  (proc_af664d19db2c: poll #19 03:08:43Z + #20 03:09:29Z —
  **overlap +22 s ĐÃ BIẾT, không phải mốc mù mới**) +
  6 artifact/trích: e606d7b4f921 (T9 probe +88/+102 s SAU
  reboot #100) + bb14329ae4f6 (0 dòng ±180 s) +
  e0c4ed13d7cd (watcher polls −54/−24 s + **+6 s trên boot
  CŨ 9897d4b4 — overlap +6 s, cùng cơ chế clock nhanh đã
  biết**) + 3 file trích đã biết. **#101: 5 thô → 0 thật**
  (3 file trích đã biết + proc_05486d86b251 — log poller
  T4-183, trích dẫn + e0c4ed13d7cd). **#102: 6 thô →
  0 thật** — 82b903289d32 (đã biết đợt 185) + 3 file trích
  đã biết + 66b0edb1fca4 (0 dòng ±180 s) + fb8b22e27c07
  (T9 probe +62/+142 s SAU reboot #102).
  **#103: 13 thô → 0 thật** (đợt 185: 12) — 4 file trích
  đã biết + proc_0335f156262f (log main-agent: chỉ dòng
  phân cách 09:14:52Z (−3 s) + COVERAGE-CHECK 09:12:01Z —
  session host-side, KHÔNG phải hoạt động tại btime) +
  **6 file agent d6168558** (log T9-184: mỗi file 3 dòng
  gần btime — probe lan-2 09:12:28Z (−147 s, trên #102) +
  win103-open 09:15:56Z (+61 s, trên #103) + open-184
  09:16:05Z — probe TRƯỚC/SAU reboot, 0 mark tại btime
  #103) + proc_e0657c041a7b (span 09:04:22Z → 11:39:52Z —
  **0 dòng trong ±180 s quanh btime #103/#104**) +
  **1 MỚI proc_fe9278002a33** (T5-186, span 07:33:20Z →
  14:35:51Z — **0 dòng trong ±180 s quanh btime
  #103/#104/#105** — trích dẫn, 0 thật). **#104: 6 thô → 0 thật** (đợt
  185: 5) — 4 file trích đã biết + proc_e0657c041a7b
  (0 dòng ±180 s) + proc_fe9278002a33 (MỚI, 0 dòng).
  **#105: 8 thô → 0 thật MỚI** — proc_bee58295d12b
  (span 11:20:50Z → 17:20:50Z — **0 dòng trong ±180 s
  quanh btime #105/#106**; 2 đầu mút là giờ slot HB/DR
  trích dẫn) + 3 file trích đã biết + proc_a1a4ec8bfd62
  (T0-185, span 11:13:42Z → 13:30:00Z — **0 dòng trong
  ±180 s**) + proc_468059b04754 (T5-186: 7 dòng watcher-185
  −156 s … −6 s + **+24 s = 13:13:56Z trên boot CŨ
  9161bfd1 — chính overlap #105 ĐÃ BIẾT, trích từ
  replay-watch-185.log, KHÔNG phải mốc mù mới**) +
  proc_fe9278002a33 (0 dòng) + proc_9fba008df1a9 (T6-186,
  span 11:40:32Z → 17:40:45Z — **0 dòng trong ±180 s**). **#106: 5 thô → 0 thật MỚI** —
  proc_bee58295d12b (0 dòng) + 3 file trích đã biết +
  proc_9fba008df1a9 (0 dòng). **Kết luận: 0 hoạt động
  thật mới tại #87–#106 ngoài overlap #100/#105 đã
  biết.**

### §3.3 Hole-recheck lần 30

Script `hole-recheck9797.py` (log `hole-recheck186.log`),
chạy 18:23:13–18:25:31Z (sau poller thoát); whole-tree
26.592 file có mtime trong union range (185: 25.397);
known merged marks 6.705; known #88? base 557.
**NEW=0 ở MỌI hố (27 hố):** H-R1 0, H-R1-old 0, H-S1 0,
H-S2 0, H-S3 1 (đã biết), H-T1 0, H-U1 0, H-U2 1 (đã biết),
H-U2-old 0, H-U3 10 (đã biết), H-U4 0, **H-E1-88 337 hit,
0 mới — lần thứ 30 liên tiếp**, H-U5–H-U15: 0 hoặc 1–3
hit đã biết, 0 mới,
**H-U16 3 hit, 0 mới** (3 file trap đã biết ở biên hố:
sessions.* của agent 3180d60b, mtime 15:06:19.598–.660Z). **CERT/FULL GIỮ 76/91** (không có bằng chứng
đổi — mù #96?/#95?/#94?/#88?/#77? **VẪN MỞ**).

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ script nặng

### §4.1 (m) #56 — lần thứ 29, KHÔNG THU HẸP (5 hướng DB MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1). Cửa ứng viên [19:33:20Z, 19:33:37Z] = epochs
1795203200..1795203217 (= btime #56 + [33 s, 49,8 s]). Run 156:
run_id 9c7b6986-46fd-4a31-beea-2e36272d1d26, sched 1795196151
(17:35:51Z), started 1795201518 (19:05:18Z), finished 1795205974
(20:19:34Z), succeeded, request_id NULL.

- **(cxi) DB `agent.token_usage` created_at trong W (MỚI):
  0 dòng. ÂM TÍNH.**
- **(cxii) DB `agent.subagent_progress` created_at trong W
  (MỚI): 0 dòng. ÂM TÍNH.**
- **(cxiii) DB `scheduler.cron_mutations` created_at trong W
  (MỚI): 0 dòng. ÂM TÍNH.**
- **(cxiv) DB `activity.feed_entries` created_at trong W
  (MỚI): 0 dòng. ÂM TÍNH.**
- **(cxv) DB `scheduler.doctor_task_state` updated_at trong W
  (MỚI): 0 dòng. ÂM TÍNH.**
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức GIỮ 14.**
  Tổng 115 hướng (110 tới đợt 185 + 5 hướng mới đợt này —
  lần thứ 29 không thu hẹp, tất cả 0 dòng).
- **Hướng file-based (vii)/(viii)/(vii-b)/(vii-c)
  (m56-186.py, log `m56-186.log`, chạy 18:26:38–
  18:27:54Z): (vii) 333 file có mtime trong D** (đợt 185:
  333, không đổi) — max mtime 20:15:33.130Z
  (`round156-t10.done`); **(viii) 0 exec-log có mtime
  trong D; (vii-b) 0 file ở 20:16:00–20:17:00Z; (vii-c)
  0 file ở 20:19:30–20:19:40Z** — tất cả ÂM TÍNH,
  cửa sổ R/J KHÔNG THU HẸP (lần 29).

### §4.2 Tuân thủ luật script nặng đợt 186 — KHÔNG VI PHẠM

T4-186 mở poller 17:45:49Z (gate0wait, hạn cắt 19:30Z).
T2-186 KHÔNG chạy script nặng nào trong lúc gate đỏ hay
trong lúc attempt chạy — lịch trình đầy đủ (giờ Z 24/11):
- 17:41–17:56Z: truy vấn DB (m), probe #105, m-check
  (đọc/chạy script nhẹ, KHÔNG phải sweep nặng; gate T4
  chưa mở attempt nào — CUA YEN MO đầu tiên 17:53:23Z).
- 17:56–18:00Z: soạn watchdog v2 + **thử khô ĐẠT**
  (arm OK, 0 kích hoạt giả, target kết thúc bình thường,
  exit 0 — mark `/tmp/watch186-dryrun.mark`).
- 18:00–18:12Z: **CHỜ poller thoát** — waiter nền kiểm
  poll-t4.log mỗi 20 s (tối đa 30 phút); T2 không chạy
  script nặng nào trong khoảng này (attempt1 17:53:23–
  17:57:41Z, attempt2 18:03:45–18:08:03Z, attempt3
  18:08:04–18:12:16Z đều đang chạy).
- **Attempt1 (CUA poll #11 17:53:23Z): 20/20 NHƯNG lớp B
  VI PHẠM** — không dùng verdict. **Attempt2 (CUA poll
  #20 18:03:45Z): 20/20 + lớp B ĐẠT 5/5 NHƯNG tickCost
  median 68,0 ms > 60** (cổng F-146-T4-1) — không hợp lệ.
  **Attempt3 (CUA poll #21 18:08:04Z): 20/20 NHƯNG lớp B
  VI PHẠM.** Hết 3 attempt, **poller thoát 18:12:30Z**;
  poll-t4.log mtime dừng 18:12Z.
- 18:12:30Z (waiter báo POLLER-EXITED) → kiểm lại poll-log
  + `ps` (0 process run-attempt/poll-wait) rồi mới chạy:
  walk 18:15:01–18:16:17Z, merged 18:17:00–18:17:02Z,
  content 18:17:35–18:17:36Z, sessions 18:18:46–18:18:47Z,
  witness 18:20:13–18:20:14Z, hole-recheck 18:23:13–
  18:25:31Z, sweep 18:25:44–18:26:29Z, m56-file 18:26:38–
  18:27:54Z. Poll-t4.log không ghi thêm sau 18:12:30Z —
  **0 chồng lấn với attempt T4**.
- **F-186-T2-8 (mới — sự cố watchdog, KHÔNG vi phạm):**
  watchdog v2 **KHÔNG arm cho walk** — lỗi launcher của
  T2 (chuỗi `setsid ... &` tách lệnh làm PGID/MARK rỗng;
  walk vẫn chạy xong bình thường). Cửa sổ walk vẫn sạch
  đã chứng minh bằng poll-log + `ps` (poller đã thoát
  18:12:30Z, 0 attempt chạy) — KHÔNG có chồng lấn thực
  tế. Sửa đợt sau: watchdog qua script wrapper riêng.
- **Chuỗi 0 vi phạm 1 → 2 (parent quyết cuối).**

## §5. EPERM probe #105 + sweep

- **Probe #105: chạy 17:49:56Z, boot cea79500 (#106), ok=2
  fail=0, exit 0.** Log `hidden_files/eperm-probe-v2.log`
  288 → 291 dòng (+1 boot-changed, +1 probe#105, +1 dòng
  boot-changed 9161bfd1 → cea79500); heartbeat n=105.
  **MemAvailable lúc probe: 6.508.544 kB** (17:49:56Z). Cửa
  sổ probe #105: 11:42:30Z → 17:49:56Z = 22.044 s. **Probe
  #105 bao btime #105 (13:13:32Z).** Sóng EPERM thật gần
  nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #105** (script `eperm-sweep9797.py`, log
  `eperm-sweep186.log`, cửa sổ probe [11:42:30Z,
  17:49:56Z]): **170 *.log** có mtime trong cửa sổ;
  **4 file có marker (14 lần)** — o8-185t0.log ('sóng EPERM
  đã tắt' ×3) + eperm-sweep185.log ('CẢNH BÁO' ×1 +
  'Operation not permitted' ×1 + 'sóng EPERM đã tắt' ×3) +
  o8-185t8.log ('sóng EPERM đã tắt' ×3) + o8-186t8.log
  ('sóng EPERM đã tắt' ×3) — **TẤT CẢ trích dẫn, 0 sóng
  thật** (0 lần "sóng EPERM vẫn bật"; sóng EPERM thật gần
  nhất vẫn ~11:55–12:11Z 11/11).
- Script probe: `~/workspace/repo-1/scripts/probe-eperm-v2.sh`; log +
  heartbeat tại `~/workspace/goals/capcut-clone-video-editor/
  hidden_files/eperm-probe-v2.log` / `.heartbeat`.

## §6. Phương pháp, sai số, câu hỏi cho parent

### §6.1 Phương pháp

- DB đọc tươi qua `muse.db` (bảng `scheduler.job_runs` +
  `scheduler.events` + `agent.token_usage` +
  `agent.subagent_progress` + `scheduler.cron_mutations` +
  `activity.feed_entries` + `scheduler.doctor_task_state`);
  `muse.db` từ chối `to_timestamp` — dùng literal
  `'YYYY-MM-DD HH:MM:SS+00'::timestamptz` +
  `EXTRACT(EPOCH FROM created_at)` / cột `*_utc` bigint.
  `events.run_id`/`job_runs.run_id` là UUID ĐẦY ĐỦ — tra bằng
  short id trả 0 dòng. Mọi số (m)/INSIDE đều có trong script
  đối chiếu độc lập `m-check186.py` (log `m-check186.txt`).
- INSIDE tính bằng `m-check186.py` (log `m-check186.txt`);
  FULL149 p10/p90 khớp T2-185 bằng assert trong script;
  chain sau #103 = 5 khớp.
- (m) #105: SÁT biên dưới (1,931 s) — caveat phân số KHÔNG
  lật được (xấu nhất vẫn TRONG 0,931 s); prior δ #90
  (+0,32 s), δ #92 (+0,396 s) và boot_est #95 (+0,99 s) đều
  cho offset TRONG dải — đồng thuận, không như #91 (hai prior
  trái chiều). Overlap +24 s là caveat, KHÔNG lật verdict
  theo tiền lệ #87/#90 (#99 +22 s / #100 +22/+6 s đã được
  parent chấp nhận DƯƠNG).
- (m) #104: 0 requeue cửa hẹp + cửa rộng — tiền lệ #94.
- Mù: B1 = giờ chạy thực tế của walk (F-172-T2-12); đếm jump
  witness TRỪ exec-log T2-177 (ec756e29) + T2-178 (b387ac70) +
  T2-179 (52dfc922) + T2-180 (42bae1a0) + T2-181 (11a8480f) +
  T2-183 (7b6d04e1) + T2-184 (69e1c3d1) + T2-185 (17354ac6) +
  T2-186 (26ee3ea8 — thư mục của chính đợt này) + TRỪ mọi log
  chứa marker T2 ("m-check17", "FULL13", "round178-t2",
  "round179-t2", "round180-t2", "round182-t2", "round183-t2",
  "round184-t2", "round185-t2", "round186-t2", "m-check178",
  "m-check179", "m-check180", "m-check181", "m-check182",
  "m-check183", "m-check184", "m-check185", "m-check186")
  (F-178-T2-4); dir T2-182 không rõ id — log của nó mang
  marker "round182-t2"/"m-check182" nên đã bị loại qua
  marker; kiểm B1 ở MỌI chỗ dùng trước khi chạy
  (F-179-T2-4 đã sửa); kiểm W ở MỌI script trước khi chạy
  (F-182-T2-10 đã làm); output vào thư mục riêng, không ghi
  đè file cũ (F-166-T2-2); kiểm epoch GAP bằng `date -d`
  trước khi chạy sessions; chụp meminfo cùng lệnh probe
  (F-172-T7-2-7). **Kiểm poll-log + `ps` TRƯỚC MỖI script
  nặng, kể cả script chạy nối** (F-183-T2-7) — **và BÀI HỌC
  MỚI đợt 184 (F-184-T2-8): kiểm-trước-khởi-động CHƯA ĐỦ
  với script dài; lần này T2-186 CHỜ poller T4 thoát hẳn
  rồi mới chạy các script dài (walk/hole-recheck/sweep/
  m56-file), thay vì chạy khi gate đang dao động về ngưỡng.**
- **Sửa phương pháp đợt này:** (i) content script bổ sung
  replay-watch-185 + ram-sampler-185 (F-186-T2-3); (ii)
  witness mở rộng sang #105 + #106; (iii) m-check tính
  FULL150 (#104) + FULL151 (#105); (iv) m56 thêm 5 hướng
  DB mới (cxi)–(cxv); (v) loại thư mục agent T2-186 khỏi
  sessions/witness (F-186-T2-4); (vi) watchdog v2 thử khô
  ĐẠT trước khi dùng (arm OK, 0 kích hoạt giả).

### §6.2 Sai số / caveat (F-186-T2-*)

- **F-186-T2-1 — (m) #105 DƯƠNG ở cấp T2, parent quyết
  cuối; caveat overlap KHÔNG lật verdict; SÁT BIÊN DƯỚI.**
  Offset btime 34,931 s, TRONG dải; offset thật
  ∈ (33,931 s, 34,931 s] — caveat phân số KHÔNG lật được
  (xấu nhất vẫn TRONG 0,931 s — biên mỏng nhất từ trước
  tới nay, ghi trung thực). Overlap #105 +24 s (watcher-185,
  poll cuối 13:13:56Z) lấy theo nghĩa đen sẽ đưa offset
  #105 về ~10,9 s — NGOÀI dải dưới; tiền lệ #87/#90 cấm lật
  bằng overlap (áp dụng đối xứng với #91/#93/#95/#96/#97/
  #99/#100/#102/#103 — #99 có overlap +22 s Y HỆT và parent
  đã chấp nhận DƯƠNG; #100 có +22/+6 s và parent đã chấp
  nhận DƯƠNG; #105 +24 s cùng loại, lớn hơn một chút).
  Poller/sampler/T8/b2watch KHÔNG overlap tại #105.
- **F-186-T2-2 — (m) #104 KHÔNG CÓ ĐIỂM ở cấp T2, parent
  quyết cuối.** 0 requeue trong cửa hẹp [11:13:42Z,
  11:32:42Z] VÀ cửa rộng [11:13:42Z, 13:13:32Z] (DB tươi —
  KHỚP T0-185/T2-185 đã ghi số thô 0 requeue; T2-186 kiểm
  độc lập + mở rộng cửa rộng tới btime #105). Tiền lệ #94
  (T0 — 0 requeue cửa hẹp + cửa rộng). n KHÔNG ĐỔI do #104.
- **F-186-T2-3 — INSIDE #104 TRUE (FULL150, chuỗi 5 → 6)
  + INSIDE #105 TRUE (FULL151, chuỗi 6 → 7).** Dải chéo
  FALSE cả hai (muộn 6.034 s / 5.562 s qua đầu dải) — mâu
  thuẫn ngược hướng lần thứ 17/18; chuỗi mâu thuẫn mới = 5
  rồi 6 (sau khi #103 lần 16, chuỗi = 4). Chuỗi INSIDE
  5 → 6 → 7 (dải phương pháp chi phối theo F-165-T2-1).
- **F-186-T2-4 — Loại thư mục agent T2-186 khỏi
  sessions/witness (phương pháp).** Log exec của chính đợt
  này trích btime/hố (đọc LIMITS + script đợt 185) — nếu
  không loại sẽ tự false-witness. Đã loại bằng thư mục
  (26ee3ea8) + marker ("round186-t2"/"m-check186").
- **F-186-T2-5 — Run 185 SUCCEEDED 14:31:59Z (số liệu;
  kết cục thuộc T7-186) + FLAG CA.** Margin +232 s TRƯỚC
  hạn 14:35:51Z; claimed→finished 94 s (≥60 s — FLAG ca
  CA ≥60 s có thể mới cho T7-186; T2 chỉ ghi số, KHÔNG phán
  CA). Run 08d940ea (sched 14:35:51Z) SUCCEEDED 14:52:42Z
  (không phải run của đợt T — ghi nhận cho T7-186).
- **F-186-T2-6 — REBOOT #106 MỚI trước khi đợt mở (số liệu;
  số hiệu thuộc T0-186).** Boot cea79500, btime 17:19:50Z,
  gap #105→#106 = 14.778 s (dài hơn mẫu ~2h — gồm khoảng
  trống giữa hai đợt). (m) #106 + INSIDE #106 thuộc T2-187.
  Probe #105 chạy trên boot #106 (ok=2 fail=0) — bao btime
  #105 qua cửa sổ probe [11:42:30Z, 17:49:56Z].
- **F-186-T2-7 — Pruning exec-log giữa các đợt (phương
  pháp).** Đếm exec-log GIẢM 360 → 309 dù cửa sổ DÀI hơn
  (B1 18:18:00Z so với 11:48:00Z đợt 185); đếm lại trực
  tiếp: cùng cửa sổ [B0, 11:48:00Z] nay chỉ còn 289 file
  — **71 exec-log đã bị prune/xóa giữa hai đợt** (dọn thư
  mục agents). Verdicts KHÔNG ảnh hưởng: đợt 185 đã kiểm
  các file bị prune (0 thật cho #64–#85; #86 trích dẫn) —
  counts không so sánh được trực tiếp giữa các đợt nữa,
  chỉ so sánh verdicts.
- **F-186-T2-8 — Watchdog v2 KHÔNG arm cho walk (sự cố
  launcher, KHÔNG vi phạm).** Chuỗi `setsid ... &` tách
  lệnh làm PGID/MARK rỗng; walk vẫn chạy xong bình thường
  trong cửa sổ sạch đã chứng minh bằng poll-log + `ps`
  (poller thoát 18:12:30Z, 0 attempt chạy). Sửa đợt sau:
  chạy watchdog qua script wrapper riêng thay vì nối
  chuỗi `&`. Thử khô 17:59Z: arm OK, 0 kích hoạt giả.
- **F-186-T2-9 — U union-B max ĐỔI 7.861 s → 8.643 s
  (hố lặng giữa hai đợt, KHÔNG phải hố mù mới).** Hố mới
  15:11:34Z → 17:35:37Z 24/11 chứa btime #106 17:19:50Z
  ĐÃ BIẾT (T0-186 xác minh 9 nguồn; (m) #106 thuộc
  T2-187). U file-gap max GIỮ 8.968 s; H-U16 vẫn NEW=0.
- **F-186-T2-10 — T4-186 hết 3 attempt, KHÔNG có lượt
  yên hợp lệ đợt này** (thuộc T4-186; T2 chỉ ghi nhận vì
  ảnh hưởng lịch chờ): attempt1 lớp B vi phạm; attempt2
  tickCost median 68,0 ms > 60 (cổng F-146-T4-1);
  attempt3 lớp B vi phạm; poller thoát 18:12:30Z.
- **F-186-T2-11 — Sửa script content.py đợt 186 (lỗi của
  T2, đã sửa + chạy lại khớp).** (a) Đường dẫn
  ram-sampler-185 sai (hidden_files → repo-1/round185-t9);
  (b) comment watcher-185 ghi "63 strict poll" (số của
  watcher-184) — đúng là **184 strict poll / 189 dòng**.
- **F-186-T2-12 — Witness #103/#104 tăng +1 thô, #105/
  #106 lần đầu có hit** (file T5-186/T6-186, trích dẫn,
  0 thật mới — xem §3.2; overlap #105 +24 s đã biết).

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 186)

- **(a) (m) #104 KHÔNG CÓ ĐIỂM — chấp nhận?** (0 requeue
  trong cửa hẹp VÀ cửa rộng tới btime #105; 4 event trong
  cửa hẹp, 0 requeue; 1 run sống; tiền lệ #94.)
- **(b) (m) #105 DƯƠNG — chấp nhận?** (requeue +34,931 s,
  TRONG dải [33; 49,8] nhưng SÁT biên dưới 1,931 s — chặt
  nhất từ trước tới nay; caveat phân số KHÔNG lật được, xấu
  nhất vẫn TRONG 0,931 s; overlap +24 s (watcher-185, mẫu
  18) không lật verdict theo tiền lệ #87/#90.)
- **(c) INSIDE #104 TRUE (FULL150, chuỗi 5 → 6) + INSIDE
  #105 TRUE (FULL151, chuỗi 6 → 7) — chấp nhận?** (dải chéo
  FALSE cả hai — mâu thuẫn ngược hướng lần thứ 17/18, chuỗi
  mới = 5 rồi 6.)
- **(d) Mù #96?/#95?/#94?/#88?/#77? — VẪN MỞ: chấp
  nhận?** (hole-recheck lần 30 NEW=0 mọi hố; H-E1-88 337
  hit 0 mới — lần thứ 30; H-U16 3 hit 0 mới; R file
  1.238 s lần thứ 22 không đổi; U file-gap max 8.968 s
  KHÔNG ĐỔI; U union-B max ĐỔI 7.861 → 8.643 s — hố lặng
  giữa hai đợt, chứa #106 đã biết, KHÔNG phải hố mù
  mới; CERT/FULL GIỮ 76/91; witness #105/#106 0 thật
  mới.)
- **(e) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều
  kiện?** (lần thứ 29 không thu hẹp; 5 hướng DB mới, tổng
  115 hướng — tất cả 0 dòng; file-based xem §4.1.) n chính
  thức GIỮ 14.
- **(f) EPERM probe #105 + sweep #105 — ghi nhận?**
  (Probe #105 ok=2 fail=0, boot cea79500, bao btime #105;
  sweep #105: 170 *.log, 4 file có marker (14 lần) — tất
  cả trích dẫn, 0 sóng thật.)
- **(g) Tuân thủ script nặng đợt 186 — KHÔNG VI PHẠM:
  parent quyết chuỗi 0 vi phạm 1 → 2?** (Mọi script nặng
  CHỜ poller T4 thoát hẳn; watchdog v2 thử khô ĐẠT, 0 kích
  hoạt giả; 0 chồng lấn với attempt T4 — khác hẳn
  F-184-T2-8.)
- **(h) Run 185 SUCCEEDED 14:31:59Z (margin +232 s,
  claimed→finished 94 s — FLAG ca CA ≥60 s có thể mới cho
  T7-186) — ghi nhận cho T7-186?** (Không phải verdict
  của T2.)
- **(i) n ứng viên 46/47 → 47/48 (nếu chấp nhận #105 DƯƠNG;
  #104 KHÔNG CÓ ĐIỂM nên không cộng) — chấp nhận?** (n
  chính thức GIỮ 14.)
- **(j) Số hiệu #106 mới giữa hai đợt (boot cea79500, btime
  17:19:50Z, gap #105→#106 = 14.778 s — số hiệu chờ T0-186;
  (m) #106 + INSIDE #106 thuộc T2-187) — ghi nhận?**
