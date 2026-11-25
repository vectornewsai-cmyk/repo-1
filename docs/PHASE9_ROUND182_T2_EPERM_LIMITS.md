# PHASE 9 — ROUND 182 — T2 EPERM LIMITS

**T2 đợt 182** — EPERM probe #100, phân loại (m) #99 **DƯƠNG
(CUỐI)** + INSIDE #99 TRUE (chuỗi 0 → 1), mù #96?/#88?/#94?/#95?/
#77?, (m) #56 lần 25.
Đợt 182 mở 02:35:51Z 24/11/2026 (09:35:51 +07; lượt cron 09:35
+07). Boot lúc mở đã là 9897d4b4 (#99, btime 01:11:46Z) —
reboot #99 xảy ra TRONG đợt 181 (sau khi T10-181 đóng sổ).
**Số hiệu #99: T7-181 XÁC MINH 9 nguồn trong ~56 s; T0-182
XÁC NHẬN 9 nguồn (cờ DONE 03:05Z) khớp từng số** (boot
9897d4b4, btime 1795482706, uptime -s 01:11:46Z, /proc/1 mtime
01:12:02.118Z (+16,118 s), journal idx 0 first entry 01:12:02Z
(+16 s), wtmp begins 01:12:02Z (+16 s), who -b 01:12; marker
sống qua 51 reboot #49–#99) — phân loại dưới đây là **phân
loại cuối ở cấp T2 — parent quyết cuối**).
(m) #99: cửa hẹp đã khép trước khi T2 đọc — đủ dữ liệu phân
loại cuối.
**Reboot #100 MỚI giữa phiên (btime 03:09:07Z, boot 7a83ab15,
gap #99→#100 = 7.041 s):** T2-182 xác minh độc lập (uptime -s
03:09:07Z, who -b 03:09, /proc/1 mtime 03:09:18.136Z
(+11,136 s)); run 182 viết lại ×1 tại #100 (started
03:09:49Z = btime +42 s); requeue eid 10610 03:09:49.577Z =
btime +42,577 s (số liệu thô — phân loại (m) #100 + số hiệu
thuộc T7-182/T2-183 + parent 183, KHÔNG phải verdict đợt
này). Poller T4-182 chết theo #100, đã chạy lại ~03:12Z
trên boot #100; waiter T2-182 cũng chết theo #100, đã chạy
lại 03:14:44Z.

## §0. Headline

- **(m) #99: DƯƠNG (phân loại CUỐI ở cấp T2, parent quyết
  cuối).** Requeue duy nhất eid 10580, run 181 (c5bcb54f),
  01:12:26.108548Z = btime +40,109 s — TRONG dải [33; 49,8],
  KHÔNG sát biên (cách biên dưới 7,109 s, cách biên trên
  9,691 s; caveat phân số KHÔNG lật được). **n ứng viên
  41/42 → 42/43** (nếu parent chấp nhận #96/#97/#98 DƯƠNG
  đợt 181 rồi #99 DƯƠNG).
- **INSIDE #99: TRUE (FULL145) — chuỗi 0 → 1.** Hai dải
  (FULL145 neo #98 + FULL144 neo #97) ĐỒNG THUẬN TRUE — lần
  đầu đồng thuận kể từ #95 (chuỗi mâu thuẫn ngược hướng
  DỪNG ở 12).
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 18 không đổi);
  hole-recheck lần 26 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới —
  lần thứ 26 liên tiếp; H-U16 3 hit, 0 mới); U file-gap max
  8.968 s KHÔNG ĐỔI; **U union-B max GIẢM 8.968 s → 7.861 s**
  nhờ bổ sung system head #87–#99 (F-181-T2-6 đã làm —
  head #94 17:17:20Z tách hố U max thành 7.861 s + 1.107 s).
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 25 không thu hẹp**
  (4 hướng DB MỚI (xxxxii)–(xxxxv): đều 0 dòng; tổng 95
  hướng; file-based ÂM TÍNH).
- **EPERM probe #100: ok=2 fail=0** (02:53:00Z, boot
  9897d4b4). Sweep #100: 189 *.log, 6 file có marker (14 lần) —
  **TẤT CẢ trích dẫn, 0 sóng thật** (3 file log đợt 181 + 3
  file exec-log trích text đợt 180/181/182).
- **Run 181 TIMEOUT** 02:43:21Z (450 s SAU hạn sched
  02:35:51Z; 231 s SAU hạn started-gốc 02:39:30Z;
  claimed→finished 163 s — ca ≥60 s thứ mười một NẾU T7-182
  đồng ý; viết lại ×1 tại #99) — số liệu DB tươi; kết cục
  thuộc T7-182.
- **Tuân thủ luật script nặng đợt 182: 0 chồng chéo với
  attempt** — KHÔNG có attempt T4 nào chạy trong lúc T2 làm
  việc nặng (walk 03:30:27–03:32:12Z + merged/content/
  sessions/witness/hole-recheck/m56/sweep tới ~03:45Z; kiểm
  `ps` trước mỗi script; poller T4 gate0wait suốt, chưa mở
  attempt — xem §4.2; T4-182 xác nhận cuối trong cờ của T4).

## §1. Điểm (m)

### §1.1 (m) #99 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #99: 01:11:46Z** (epoch 1795482706), boot
  9897d4b4, gap #98→#99 = 7.163 s (trở lại mẫu ~2h).
  **T7-181 XÁC MINH 9 nguồn trong ~56 s; T0-182 XÁC NHẬN 9
  nguồn (cờ DONE 03:05Z) khớp từng số** (xem đầu file).
  Marker sống qua 51 reboot #49–#99 (T0-182 đếm).
- T2-182 xác minh độc lập từ DB tươi (muse.db, đọc ~02:52Z):
  **requeue duy nhất** trong cửa hẹp [01:11:46Z, 01:30:46Z]:
  **eid 10580, run 181 (c5bcb54f), event
  `requeued_after_restart`, 01:12:26.108548Z = btime +40,109 s,
  TRONG dải [33; 49,8]** (cách biên dưới 7,109 s, cách biên
  trên 9,691 s — KHÔNG sát biên). Cửa hẹp đã khép hẳn lúc đọc.
  Cửa hẹp còn 5 event khác: dispatched 01:12:26.204Z eid
  10581 + reattached_after_restart 01:12:26.302Z eid 10582
  (viết lại lần 1 của run 181) + reconciled 01:15:34.115Z eid
  10583 + DR dispatched/succeeded 01:15:34.203/.266Z eid
  10584/10585 (heartbeat run 0549a8f2) — không phải requeue.
- **Đúng 1 run sống tại btime #99** (vcut-build-loop,
  scheduled ≤ btime AND finished > btime, DB tươi): run 181
  (sched 23:35:51Z 23/11, finished 02:43:21Z timeout). Không
  run nào khác.
- **Caveat phân số: offset thật ∈ (39,109 s, 40,109 s]** —
  DƯƠNG với mọi δ ∈ [0, 1 s]. Prior δ #90 (+0,32 s) → 39,789 s;
  δ #92 (+0,396 s) → 39,713 s; boot_est #95 (+0,99 s) →
  39,119 s — đều TRONG, đồng thuận.
- **Caveat overlap (KHÔNG lật verdict, tiền lệ #87/#90):**
  watcher-181 poll cuối muộn hơn btime #99 22 s biểu kiến
  + sampler cuối #98 muộn 7 s (F-181-T9-3; **T0-182 XÁC NHẬN
  độc lập: đồng hồ cell nhanh trước #99, delta ≥ 22 s**).
  Lấy +22 s theo nghĩa đen thì offset ~18 s — NGOÀI dải
  dưới. Nhưng cơ chế đã được xác nhận (đồng hồ nhanh
  trước reboot) — tiền lệ đứng nói overlap là caveat, KHÔNG
  BAO GIỜ lật verdict btime.
- Toàn ngày 24/11 (tới lúc đọc ~02:52Z): đúng 1
  `requeued_after_restart` (eid 10580) — 0 requeue khác.
- **Phán: (m) #99 DƯƠNG — parent quyết cuối. n ứng viên
  41/42 → 42/43** (nếu chấp nhận #96/#97/#98 DƯƠNG đợt 181
  rồi #99 DƯƠNG). **n chính thức GIỮ 14.**

### §1.2 Run 181 kết cục (số liệu; kết cục thuộc T7-182)

- **status TIMEOUT, finished_at_utc 1795488201 = 02:43:21Z
  — 450 s SAU hạn sched 02:35:51Z; 231 s SAU hạn
  started-gốc 02:39:30Z** (chênh 219 s = đúng jitter run
  181). **claimed_at_utc 1795488038 = 02:40:38Z;
  claimed→finished = 163 s**; wall từ sched gốc = 11.250 s;
  started_at_utc 1795482746 (= 01:12:26Z, viết lại lần 1 tại
  #99); boot_gen cuối cron_boot_7e85b461... (#99); attempt 1.
- **163 s ≥ 60 s — ca claimed→finished ≥60 s thứ mười một
  NẾU T7-182 đồng ý** (số ca GIỮ 10 cho tới lúc đó). Lưu ý:
  claimed ĐÃ ĐỔI sau khi T7-181 đóng cờ (T7-181 ghi claimed
  KHÔNG đổi 1795477170 lúc đóng 02:25Z — đó là claim gốc;
  lần viết lại đổi claimed_at thành 02:40:38Z). **Phân loại
  cuối thuộc T7-182 + parent** — T2 chỉ ghi số liệu DB tươi.
- Ghi nhận thêm (không phải verdict T2): run 182 (sched
  02:35:51Z, jitter +450 s) đang running — **viết lại ×1 tại
  #100** (started 03:09:49Z, boot_gen 4ac4ff66, claimed KHÔNG
  đổi 02:43:22Z); kết cục thuộc T7-182 (timeout?) / T7-183
  nếu còn chạy qua đợt 183.

## §2. INSIDE — dải FULL145

Script: `m-check182.py` (log `m-check182.txt`; exec
`m-check181.py` — FULL144 p10/p90 khớp bằng assert
1567,80/8803,30; FULL141 p10/p90 khớp 1579,00/8827,00).
Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1).

- **FULL145**: n=145, mean 1h41'23", median 1h54'16", p10
  1569,40 s, p90 8795,40 s, sd 0h55'02", in 90–150'=80,
  <60'=33, >180'=10, >240'=4 (= FULL144 + [gap #99 =
  7.163 s]).
- **INSIDE #99: TRUE (FULL145) — chuỗi 0 → 1.** Dải
  [23:38:32Z, 01:38:58Z] neo 23:12:23Z (#98); btime #99
  01:11:46Z TRONG dải, cách biên dưới 5.594 s, cách biên trên
  1.632 s. Đối chiếu vs FULL144 (neo #97): TRUE (dải
  [23:28:54Z, 01:29:30Z], cách biên dưới 6.172 s, cách biên
  trên 1.064 s) — **hai dải ĐỒNG THUẬN (lần đầu kể từ #95)**;
  chuỗi mâu thuẫn ngược hướng DỪNG ở 12. (Số hiệu #99
  T7-181 xác minh 9 nguồn; T0-182 survey khớp từng số.)
- Tốc độ reboot: tới #99: 175 reboot / 316,89 h = 1 lần /
  108,6 phút.

B0 = 11:15:18Z 21/11 (btime #64), B1 = 03:30:21Z 24/11 (giờ chạy
thực tế, F-172-T2-12); cửa sổ 231.303 s. Walk chạy 03:30:27–
03:32:12Z (script `blind9797-investigate.py`, log cùng tên) —
**KHÔNG có attempt T4 nào chạy trong lúc walk** (kiểm `ps`
trước mỗi script — xem §4.2; poller T4 vẫn gate0wait, chưa mở
attempt). Sàn (floor) 19'07" = 1.147 s (đứng từ đợt 162).
**Lưu ý phương pháp (F-179-T2-4 đã sửa):** kiểm B1 ở MỌI chỗ dùng
trước khi chạy (investigate B1 + SEG U-end + merged + sessions +
content U1 + witness B1 + hole-recheck hi — tất cả 03:30:21Z);
không còn lỗi U-end cũ.
**Sự cố phương pháp (F-182-T2-10):** lần chạy investigate đầu
ghi đè 5 file `blind9797-*.txt` của đợt 181 (W trong script vẫn
trỏ round181-t2 — T2 chỉ sửa W ở content script, quên
investigate) — đã chuyển 5 file (dữ liệu đợt 182, ghi 03:30:46–
03:32:27Z) sang round182-t2 + sửa W ở MỌI script + chạy lại
merged (số KHỚP hệt lần đầu: 5.661 marks, R 1.238 s, U 8.968 s).
Số liệu đợt 181 KHÔNG đổi (log blind181-* còn nguyên, verdict
đợt 181 đã đóng); chỉ mất file mark thô đợt 181.

### §3.1 Walk + file-marks (merged/content)

- Số file có mtime trong cửa sổ: repo-1 **1.908** (đợt 181:
  1.641), hidden_files **7.386** (7.150), outside **2.775**
  (2.649), /tmp **0** (638 — /tmp bị wipe bởi #100 03:09:07Z,
  chưa có file mới nào trong cửa sổ sau đó).
- Merged unique second-marks: **5.661** (181: 5.394).
- **R file (raw): 13 marks, MAX GAP 1.238 s** (11:15:29Z →
  11:35:56Z) — **OPEN, lần thứ 18 liên tiếp KHÔNG ĐỔI.**
  R union-A 1.222 s / union-B 1.211 s — OPEN.
- S file: 226 marks, max 3.235 s (13:01:51Z → 13:55:46Z) —
  OPEN; S union-A 662 s / union-B 591 s — CLOSED.
- T file: 211 marks, max 627 s — CLOSED; T union-A 38 s —
  CLOSED.
- **U file: 4.944 marks, max 8.968 s** (15:06:19Z →
  17:35:47Z 23/11) — **OPEN, KHÔNG ĐỔI vs đợt 181** (hố lặng
  giữa đợt, ôm cả btime #94 17:17:09Z mà KHÔNG có file mark
  nào). U union-A 8.968 s — OPEN; **U union-B 7.861 s — OPEN**
  (hố U max tách thành 7.861 s (15:06:19Z → 17:17:20Z) +
  1.107 s (17:17:20Z → 17:35:47Z) nhờ head #94 17:17:20Z —
  F-181-T2-6 ĐÃ LÀM, xem F-182-T2-4).
- R-head 0; R-tail repo-1=2 / hidden_files=51 / outside=2 /
  tmp=0 (như 181). U-tail mới (03:11:14–03:30:21Z): repo-1=5
  / hidden_files=10 / outside=25 / tmp=0 / fifthscope=1.
- **Nguồn content MỚI (F-182-T2-3):** replay-watch-181
  (round181-t5, 112 strict poll e62eef3f trong U; poll cuối
  **01:12:08Z = btime #99 +22 s — OVERLAP #99, T0-182 XÁC
  NHẬN độc lập delta ≥ 22 s**). Không nguồn mới nào có mark
  trong hố U max (sampler-179 bắt đầu 17:43:43Z, watcher-179
  bắt đầu sau đó — đều SAU khi hố khép 17:35:47Z; chỉ có head
  #94 17:17:20Z nằm trong hố — system mark, union-B).
  Ram-sampler-180/181: KHÔNG có file trong round180-t9/
  round181-t9 (T9-182 owns; round182-t9/ram-sampler.log đã có
  trong repo-1 — bắt đầu sau #100, không ảnh hưởng hố U max).
- Content-ts trong hố R union (11:15:29–11:35:40Z): **0 hit.**
  Content-ts trong hố U max (15:06:19–17:35:47Z 23/11): chỉ
  mốc 17:17:09Z (btime #94 — trích trong poll T4-179 + header
  T0-179/T5-179/T8-179, viết SAU dispatch 17:35:51Z) + head
  #94 17:17:20Z (system mark mới) — **0 mốc mới.**

### §3.2 Sessions + witness (exec-log)

- Exec-logs có mtime trong cửa sổ: **325** (181: 306); mtime
  trong R/S/T: **0/0/0**, trong U: 325.
- Jump witness #64–#86 (sessions.py): **tất cả 0** — #86
  3 → 0 (pruning, xem F-182-T2-5).
- **F-182-T2-5 — Mù: pruning xóa tiếp exec-log, witness
  #64–#90 về 0 (SỬA SỐ, không đổi verdict).** 2 file T9-174
  (proc_f4c14c9e5897.log + proc_910b750ec4a6.log — witness
  #87–#90 đợt 181) + 1 file eb668fcf (proc_5c2dedefeeea.log —
  witness #87 đợt 181, mtime 03:33:59Z 23/11) **ĐÃ GONE**
  (kiểm trực tiếp: `find` 0 kết quả; file eb668fcf biến mất
  trong ~2 phút sau khi witness chạy xong — pruning đúng
  ngưỡng ~24h). #87: 4 → 1 thô → **0 thật** (file đã prune
  trước khi kiểm tay — không xác minh được thật/artifact);
  #88: 2 → 0; #89: 2 → 0; #90: 2 → 0; #86: 3 → 0. **Mù
  không đóng vì witness về 0** — witness chỉ là bằng chứng
  phụ; R file 1.238 s + hole-recheck NEW=0 mới là căn cứ giữ
  mở.
- Witness #87–#98 (script `witness879394.py`): **#87: 1 thô
  → 0 thật** (file trên, đã prune); **#88: 0; #89: 0; #90: 0**
  (đã trừ T9-174 + eb668fcf — GONE); **#91: 2 thô → 0 thật**
  — 2 file MỚI kiểm tay, đều là ARTIFACT: (a)
  proc_e0519f42fe88.log (agent a0493e91 = T4-177 poller:
  poll thật 08:42–08:44Z TRƯỚC btime #91; span 07:10:29Z là
  btime #90 trích trong dòng poll); (b)
  proc_400d8972ac10.log (agent 1075a569: output epoch-check
  trích btime #91 + mốc 09:07:57Z — chính là overlap #91 đã
  biết — viết SAU, không phải session sống). **#92: 1 thô →
  0 thật** — cùng file (b). **#93: 4 thô → 0 thật** — cùng 4
  file artifact đợt 179 (2× LAN4-NEAR 0a2ffa0b + 2×
  poll-wait-t4-178 9dc615f0). **#94: 0. #95: 2 thô → 0 thật**
  — cùng 2 file artifact đợt 180 (proc_4c2d6895f1f5.log T0-179
  + proc_58b6a8ae27cf.log T5-179). **#96: 3 thô → 0 thật** —
  2 file artifact đợt 181 (8f7c301fcd71 T7-180 +
  f0bea09d5272 T9-180) + 1 file MỚI proc_95067dbe9645.log
  (agent 8df53f77: 48 dòng TRÍCH build-loop-log đợt 180/181 —
  span 19:10:48Z 23/11..23:54:13Z 24/11 là timestamp TRÍCH
  trong text, không phải hoạt động thật — cùng họ F-181-T2-4;
  F-182-T2-6). **#97: 1 thô → 0 thật; #98: 1 thô → 0 thật**
  — cùng file trên. **Kết luận: 0 hoạt động thật mới tại
  #87–#98. #99: witness script không bao (phạm vi tới #98);
  file 95067dbe9645 trích text cũng span qua #99 — cùng họ
  artifact, 0 hoạt động thật.**
- **#100 (03:09:07Z, giữa phiên):** witness chưa chạy cho
  #100 (thuộc T2-183); ghi nhận file 95067dbe9645 span qua
  #100 cũng là trích text.

### §3.3 Hole-recheck lần 26 (NEW=0 mọi hố)

Script `hole-recheck9797.py`, chạy ~03:37Z, log
`hole-recheck182.log` (B1 đã kiểm bằng `grep 03:30:21` trước
khi chạy).

- **H-E1-88 (19:32:59–20:17:30Z 20/11): inside=337,
  float-trap=337, NEW=0** — lần thứ 26 liên tiếp 0 mới.
- **H-U16 (15:06:19–17:35:47Z 23/11, hố U max 8.968 s):
  inside=3, float-trap=3, NEW=0** — lần thứ hai kiểm, 0 mới.
- H-U7 (10:08:01–10:28:06Z 22/11): inside=0, NEW=0; H-U8
  (10:33:43–10:53:31Z): inside=0, NEW=0 — 2 hố vẫn trống.
- Mọi hố khác đều NEW=0 (H-R1/H-R1-old/H-S1/H-S2/H-T1/H-U1/
  H-U2-old/H-U4/H-U5/H-U6/H-U9/H-U10/H-U14/H-U15 inside 0–3,
  đều float-trap đã biết; H-S3/H-U2/H-U3/H-U11/H-S4/H-T2/
  H-U12/H-U13 inside 1–10, đều float-trap đã biết).

### §3.4 Kết luận mù

- **Mù #96? (#64) VẪN MỞ** — R file 1.238 s lần thứ 18 không đổi;
  không mốc mới nào trong cửa sổ.
- **Mù #95? (#63) / #94? (#62) / #88? / #77?: VẪN MỞ** —
  hole-recheck lần 26 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới).
- **CERT/FULL GIỮ 76/91** (vì #77? và #88? vẫn mở).
- U file-gap max 8.968 s KHÔNG ĐỔI (hố H-U16 đã kiểm, NEW=0);
  U union-B max 8.968 s → 7.861 s (chỉ số phụ, không đổi
  verdict OPEN).

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ script nặng

### §4.1 (m) #56 — lần thứ 25, KHÔNG THU HẸP (4 hướng DB MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1). Cửa ứng viên [19:33:20Z, 19:33:37Z] = epochs
1795203200..1795203217 (= btime #56 + [33 s, 49,8 s]). Run 156:
run_id 9c7b6986-46fd-4a31-beea-2e36272d1d26, sched 1795196151
(17:35:51Z), started 1795201518 (19:05:18Z), finished 1795205974
(20:19:34Z), succeeded, request_id NULL.

- **(xxxxii) DB `scheduler.doctor_run_plans` created_at trong
  W (MỚI): 0 dòng. ÂM TÍNH.**
- **(xxxxiii) DB `agent.subagent_spawns` created_at trong W
  (MỚI): 0 dòng. ÂM TÍNH.**
- **(xxxxiv) DB `runtime.events` created_at trong W (MỚI):
  0 dòng. ÂM TÍNH.**
- **(xxxxv) DB `runtime.tool_calls` created_at trong W (MỚI):
  0 dòng. ÂM TÍNH.**
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức GIỮ 14.**
  Tổng 95 hướng âm tính/rỗng liên tiếp (91 tới đợt 181 + 4
  hướng mới đợt này).
- **Hướng file-based (vii)/(viii)/(vii-b)/(vii-c) (m56-182.py,
  chạy ~03:39Z, SAU khi kiểm không có attempt T4): (vii) 0 file có
  mtime trong W [19:33:20–19:33:37Z]; 333 file trong D, max
  mtime 20:15:33.130Z (< mốc max 20:19:34Z — KHÔNG file mới);
  (viii) 0 exec-log có mtime trong D; (vii-b) 0 file tại
  20:16:00–20:17:00Z; (vii-c) 0 file tại 20:19:30–20:19:40Z.
  ÂM TÍNH — lần thứ 25 không thu hẹp.**

### §4.2 Tuân thủ luật script nặng đợt 182 — 0 chồng chéo với attempt

- T4-182 mở poller 02:55:02Z (pid 236013, gate0wait, hạn
  04:30Z). T2-182 **KHÔNG khởi động script nặng nào** trong
  lúc poller chạy TRƯỚC 03:30Z: probe #100 (nhẹ, ~1 s) +
  truy vấn DB + m-check + chuẩn bị script (chỉ sửa file) +
  grep có đích đều nhẹ. **Chờ bằng waiter nền** (kiểm `ps`
  mỗi 60 s; chỉ đọc `tail` poll-t4.log mỗi vài phút).
- **Reboot #100 (03:09:07Z) giết cả poller T4 lẫn waiter T2**
  (waiter dừng ở check 15, 03:09:33Z; poller dừng ở poll #20,
  03:09:29Z — KHÔNG có attempt nào chạy trước #100, KHÔNG có
  marker attempt-done). **Poller chạy lại ~03:12Z trên boot
  #100** (poll #1 mới 03:12Z; chain-t4.log 03:12Z); **waiter
  T2 chạy lại 03:14:44Z** (wait-t4-182b.log). T2 xác minh
  trực tiếp bằng `ps` + poll-t4.log trước khi chạy walk.
- **Cửa yên CHƯA MỞ tới lúc T2 đóng LIMITS (~03:45Z):**
  poll #40 03:42:01Z vẫn gate0wait (blockers=0, lock=không,
  load1 1,98 — nhưng **gate0 T5flag=cu** (POSTBOOT_PASS trên
  đĩa vẫn của #99, T5-182 đã đóng cờ trước #100 — POSTBOOT_PASS
  #100 chưa có) + **gateA RAM 483–566 MB < 1.024 MB** trong
  03:22–03:27Z (hồi lên 2.251 MB lúc 03:42Z). **KHÔNG có
  attempt nào chạy trong cả phiên T2 tới lúc đóng** — poller
  chỉ poll, attempt chưa từng khởi động.
- **Walk mù chạy 03:30:27–03:32:12Z + merged/content/
  sessions/witness/hole-recheck/m56/sweep tới ~03:45Z — đều
  trong lúc KHÔNG có attempt chạy** (kiểm `ps` trước mỗi
  script: 0 process run-attempt/test-vite-lock). Theo chữ
  của F-175-T4-2, lệnh cấm khởi động script nặng áp dụng khi
  T4 gate0wait với **cả hai gate xanh** — ở đây cả hai gate
  đều KHÔNG xanh (gate0 stale + gateA RAM đỏ) và không có
  measurement nào đang chạy; T2 vẫn kiểm `ps` trước mỗi
  script để không chạm attempt nếu nó mở giữa chừng.
  **0 chồng chéo với attempt. Chuỗi 0 vi phạm 3 → 4
  (T4-182 xác nhận cuối trong cờ của T4).**
- Lưu ý: waiter nền lần 1 của T2 chết theo #100 (15 lần
  kiểm); waiter lần 2 chạy lại 03:14:44Z, sống tới cuối
  (28 lần kiểm tới 03:41:45Z).

## §5. EPERM probe #100 + sweep

- **Probe #100: chạy 02:53:00Z, boot 9897d4b4, ok=2 fail=0, exit 0.**
  Log `hidden_files/eperm-probe-v2.log` 278 → 280 dòng (+1
  boot-changed, +1 probe#100); heartbeat n=100.
  **MemAvailable lúc probe: 879.652 kB.** Cửa sổ probe #100:
  23:54:29Z (#99) → 02:53:00Z = 10.711 s. **Probe #100 bao
  btime #99 (01:11:46Z).** Sóng EPERM thật gần nhất vẫn
  ~11:55–12:11Z 11/11.
- **Sweep #100** (script `eperm-sweep9797.py`, log
  `eperm-sweep182.log`, chạy ~03:44Z, cửa sổ probe đã sửa từ
  #99 sang #100 — lần chạy đầu dùng nhầm cửa sổ #99 (172 log,
  3 file — y hệt sweep #99), đã sửa W0/W1 rồi chạy lại):
  **189 *.log có mtime trong cửa sổ probe**
  [23:54:29Z, 02:53:00Z]; **6 file có marker (14 lần)** —
  o8-181t0.log ("sóng EPERM đã tắt" ×3), eperm-sweep181.log
  ("Operation not permitted" ×1 + "sóng EPERM đã tắt" ×3),
  o8-181t8.log ("sóng EPERM đã tắt" ×3) — **trích dẫn trong
  log đợt 181** — + 3 file exec-log MỚI kiểm tay, đều là
  trích text, **0 sóng thật**: (a) proc_95067dbe9645.log
  (agent 8df53f77 — 'CẢNH BÁO' ×2 trong đoạn trích
  build-loop-log đợt 180/181, không phải marker EPERM);
  (b) proc_cdc6ce071d44.log (agent a45d4848 — "sóng EPERM đã
  tắt, khởi động vite" ×1 lúc 00:33:47Z, dòng log T4-181
  trích lại); (c) proc_a52f23999254.log (agent aafa47c0 =
  T0-182 boot survey — "dmesg: read kernel buffer failed:
  Operation not permitted" ×1, dòng từ chối đọc dmesg mặc
  định của container, đã có trong mọi survey T0 trước —
  KHÔNG phải sóng EPERM mới).
- Script probe: `~/workspace/repo-1/scripts/probe-eperm-v2.sh`; log +
  heartbeat tại `~/workspace/goals/capcut-clone-video-editor/
  hidden_files/eperm-probe-v2.log` / `.heartbeat`.

## §6. Phương pháp, sai số, câu hỏi cho parent

### §6.1 Phương pháp

- DB đọc tươi qua `muse.db` (bảng `scheduler.job_runs` +
  `scheduler.events` + `runtime.requests` +
  `scheduler.terminal_signals` + `scheduler.delivery_outbox` +
  `agent.sessions` + `runtime.events` + `agent.subagent_spawns`
  + `runtime.tool_calls` + `scheduler.doctor_run_plans`);
  `muse.db` từ chối `to_timestamp` — dùng literal
  `'YYYY-MM-DD HH:MM:SS+00'::timestamptz` +
  `EXTRACT(EPOCH FROM created_at)` / cột `*_utc` bigint.
  `events.run_id`/`job_runs.run_id` là UUID ĐẦY ĐỦ — tra bằng
  short id trả 0 dòng. Mọi số (m)/INSIDE đều có trong script
  đối chiếu độc lập `m-check182.py` (log `m-check182.txt`).
- INSIDE tính bằng `m-check182.py` (log `m-check182.txt`);
  FULL144 p10/p90 khớp T2-181 bằng assert trong script;
  FULL141 p10/p90 khớp T2-180 bằng assert trong script.
- (m) #99: KHÔNG cần boot_est (margin xấu nhất 7,109 s
  >> 1 s); prior δ #90 (+0,32 s), δ #92 (+0,396 s) và boot_est
  #95 (+0,99 s) đều cho offset TRONG dải — đồng thuận, không
  như #91 (hai prior trái chiều).
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness
  TRỪ exec-log T2-177 (ec756e29) + T2-178 (b387ac70) +
  T2-179 (52dfc922) + T2-180 (42bae1a0) + T2-181 (11a8480f) +
  T2-182 (agent hiện tại) + TRỪ mọi log chứa marker T2
  ("m-check17", "FULL13", "round178-t2", "round179-t2",
  "round180-t2", "round181-t2", "round182-t2", "m-check180",
  "m-check181", "m-check182") (F-178-T2-4); kiểm B1 ở MỌI chỗ
  dùng trước khi chạy (F-179-T2-4 đã sửa); output vào thư mục
  riêng, không ghi đè file cũ (F-166-T2-2); kiểm epoch GAP bằng
  `date -d` trước khi chạy sessions; chụp meminfo cùng lệnh
  probe (F-172-T7-2-7). **Chờ T4 đóng attempt + poller thoát
  hẳn rồi mới chạy script nặng** (F-176-T2-11).
- **Sửa phương pháp đợt này:** (i) content script bổ sung
  system head #87–#99 (F-181-T2-6 — wtmp-begins/journal-first-
  entry đã xác minh từng cái); (ii) content script bổ sung
  replay-watch-181 (F-182-T2-3); (iii) hole-recheck giữ
  H-U16 (hố U max).
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.

### §6.2 Sai số / caveat (F-182-T2-*)

- **F-182-T2-1 — (m) #99 DƯƠNG ở cấp T2, parent quyết cuối;
  caveat overlap KHÔNG lật verdict.** Offset btime
  40,109 s, TRONG dải; offset thật ∈ (39,109 s, 40,109 s] —
  caveat phân số KHÔNG lật được (xấu nhất vẫn TRONG 6,109 s).
  Overlap +22 s (watcher-181, T0-182 xác nhận) / +7 s
  (sampler #98, F-181-T9-3) lấy theo nghĩa đen sẽ đưa offset
  về ~18 s — NGOÀI dải dưới; tiền lệ #87/#90 cấm lật bằng
  overlap (áp dụng đối xứng với #91/#93/#95/#96/#97).
- **F-182-T2-2 — INSIDE #99 TRUE, hai dải ĐỒNG THUẬN.** Lần
  đầu đồng thuận kể từ #95; chuỗi mâu thuẫn ngược hướng DỪNG
  ở 12 (lần 10, 11, 12 tại #96/#97/#98). Chuỗi INSIDE 0 → 1.
- **F-182-T2-3 — Nguồn content MỚI: replay-watch-181.**
  112 strict poll e62eef3f trong U; poll cuối 01:12:08Z =
  btime #99 +22 s — OVERLAP #99 (T0-182 xác nhận độc lập
  delta ≥ 22 s). Ram-sampler-180/181: không có file trong
  round180-t9/round181-t9 (T9-182 owns).
- **F-182-T2-4 — U union-B max GIẢM 8.968 s → 7.861 s nhờ
  system head #87–#99 (F-181-T2-6 ĐÃ LÀM).** Head #94
  17:17:20Z (wtmp begins đã xác minh, T0-179) tách hố U max
  thành 7.861 s + 1.107 s; các head khác không nằm trong hố
  U max nên không đổi thêm. Chỉ số phụ — file-gap 8.968 s
  (chỉ số theo dõi đứng) KHÔNG ĐỔI, verdict OPEN không đổi.
- **F-182-T2-5 — (m) #56: 4 hướng DB mới, lần thứ 25 không
  thu hẹp.** Tổng 95 hướng. File-based: 0 file trong W; 333
  file trong D, max mtime 20:15:33.130Z (< mốc max 20:19:34Z);
  0 exec-log trong D.
- **F-182-T2-6 — Run 181 TIMEOUT 02:43:21Z (số liệu; kết cục
  thuộc T7-182).** 450 s SAU hạn sched, 231 s SAU hạn
  started-gốc; claimed→finished 163 s (ca ≥60 s thứ mười một
  NẾU T7-182 đồng ý — claimed ĐÃ ĐỔI sau khi T7-181 đóng cờ,
  theo mẫu run 180). Run 182 đang running — kết cục thuộc
  T7-183.
- **F-182-T2-7 — POSTBOOT_PASS #99 ĐÃ CÓ 02:55:07Z (T5-182,
  replay-đầy-đủ, poll=0, KHÔNG caveat — ghi nhận, thuộc
  T5-182).** T0-182 XÁC NHẬN #99 9 nguồn (cờ DONE 03:05Z);
  marker sống qua 51 reboot #49–#99; O8 trên #99 PASS 3/3
  (thuộc T0-182). **Reboot #100 mới giữa phiên (btime
  03:09:07Z, boot 7a83ab15, gap 7.041 s) — số hiệu + (m) #100
  thuộc T7-182/T2-183; run 182 viết lại ×1 tại #100
  (started 03:09:49Z); requeue eid 10610 +42,577 s (số liệu
  thô).** F-182-T0-2 (/proc/1 #99 +16,118 s — boot chậm lên
  userspace ~5 s, KHÔNG phải lệch đồng hồ — ghi nhận).
- **F-182-T2-8 — Tuân thủ luật script nặng: 0 chồng chéo với
  attempt (parent/T4 xác nhận?).** Walk + mọi script nặng
  chạy trong lúc KHÔNG có attempt T4 nào (poller gate0wait,
  cả hai gate đều không xanh, attempt chưa từng khởi động
  tới lúc T2 đóng — xem §4.2). Reboot #100 giết poller T4 +
  waiter T2 (cả hai đã chạy lại). T4-182 xác nhận cuối.
- **F-182-T2-9 — EPERM probe #100 + sweep #100 — ghi nhận?**
  (Probe ok=2 fail=0, boot 9897d4b4, bao btime #99; sweep:
  189 *.log, 6 file có marker (14 lần) — TẤT CẢ trích dẫn
  trong log đợt 181 / exec-log trích text, 0 sóng thật.)
- **F-182-T2-10 — SỰ CỐ phương pháp: investigate ghi đè file
  mark đợt 181 (không ảnh hưởng số liệu).** W trong
  investigate.py vẫn trỏ round181-t2 — 5 file blind9797-*.txt
  đợt 181 bị ghi đè bằng dữ liệu đợt 182; đã chuyển sang
  round182-t2 + sửa W ở MỌI script + chạy lại merged (số
  KHỚP hệt). Verdict đợt 181 không đổi (log còn nguyên);
  chỉ mất file mark thô đợt 181. Bài học: kiểm W ở MỌI script
  copy từ đợt trước, không chỉ script đang sửa.
- **F-182-T2-11 — Pruning xóa tiếp exec-log, witness #64–#90
  về 0 (SỬA SỐ, không đổi verdict).** 2 file T9-174 + 1 file
  eb668fcf GONE (file eb668fcf biến mất ~2 phút sau khi
  witness chạy xong — pruning đúng ngưỡng ~24h); #91/#92
  2 file MỚI kiểm tay đều là artifact (poll T4-177 trích
  btime #90 + epoch-check trích overlap #91); #96/#97/#98
  file MỚI proc_95067dbe9645.log là trích build-loop-log
  (cùng họ F-181-T2-4). 0 hoạt động thật mới tại #87–#98.
- **F-182-T2-12 — Reboot #100 mới giữa phiên (btime 03:09:07Z,
  boot 7a83ab15, gap #99→#100 = 7.041 s — số liệu thô, phân
  loại thuộc T7-182/T2-183).** Run 182 viết lại ×1 tại #100
  (started 03:09:49Z, requeue eid 10610 +42,577 s — số liệu
  thô); poller T4 + waiter T2 chết theo #100, đã chạy lại;
  /tmp bị wipe (0 file trong cửa sổ walk); lượt yên #51
  CHƯA MỞ attempt tới lúc T2 đóng (gate0 stale + gateA RAM
  đỏ — thuộc T4-182).

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 182)

- **(a) (m) #99 DƯƠNG — chấp nhận?** (requeue +40,109 s,
  TRONG dải [33; 49,8], KHÔNG sát biên; 1 run sống; caveat
  phân số KHÔNG lật được; overlap +22 s/+7 s không lật verdict theo
  tiền lệ #87/#90; T7-181 xác minh 9 nguồn + T0-182 XÁC NHẬN 9 nguồn
  (cờ 03:05Z) khớp từng số.) Nếu chấp nhận: n ứng viên 41/42 → 42/43.
- **(b) INSIDE #99 TRUE — chuỗi 0 → 1 — chấp nhận?**
  (FULL145; hai dải ĐỒNG THUẬN lần đầu kể từ #95; chuỗi mâu
  thuẫn ngược hướng DỪNG ở 12.)
- **(c) Mù #96? VẪN MỞ — chấp nhận giữ mở?** (R file 1.238 s
  lần thứ 18 không đổi; hole-recheck lần 26 NEW=0 mọi hố;
  U file-gap max 8.968 s KHÔNG ĐỔI; pruning xóa tiếp exec-log
  — witness #64–#90 về 0, không phải mốc mới; investigate
  ghi đè file mark đợt 181 — không đổi số liệu.)
- **(d) Mù #88? VẪN MỞ — chấp nhận?** (hole-recheck lần 26:
  H-E1-88 inside=337, NEW=0 — lần thứ 26 liên tiếp 0 mới;
  #95?/#94?/#77? cũng MỞ; CERT/FULL GIỮ 76/91.)
- **(e) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều
  kiện?** (lần thứ 25 không thu hẹp; 4 hướng DB mới, tổng 95
  hướng; file-based: 0 file trong W, 333 file trong D max
  20:15:33.130Z.) n chính thức GIỮ 14.
- **(f) Tuân thủ luật script nặng đợt 182 — 0 chồng chéo với
  attempt: parent xác nhận chuỗi 0 vi phạm 3 → 4?** (Walk +
  mọi script nặng chạy trong lúc KHÔNG có attempt T4 nào;
  poller gate0wait, cả hai gate đều không xanh; #100 giết
  poller + waiter, cả hai đã chạy lại; T4-182 xác nhận cuối.)
- **(g) EPERM probe #100 + sweep #100 — ghi nhận?** (Probe
  ok=2 fail=0, boot 9897d4b4, bao btime #99; sweep: 189 *.log,
  6 file có marker (14 lần) — TẤT CẢ trích dẫn, 0 sóng thật.)
- **(h) Run 181 TIMEOUT 02:43:21Z (450 s sau hạn sched,
  231 s sau hạn started-gốc, claimed→finished 163 s — ca
  ≥60 s thứ mười một NẾU T7-182 đồng ý, thuộc T7-182) — ghi
  nhận cho T7-182?** (Không phải verdict của T2.)
- **(i) T0-182: #99 XÁC NHẬN 9 nguồn (cờ DONE 03:05Z); marker
  sống qua 51 reboot #49–#99; O8 trên #99 PASS 3/3; POSTBOOT_PASS
  #99 ĐÃ CÓ 02:55:07Z (replay-đầy-đủ, poll=0, KHÔNG caveat —
  thuộc T5-182); #100 mới giữa phiên (btime 03:09:07Z — số hiệu
  + (m) #100 thuộc T7-182/T2-183) — ghi nhận?** (Thuộc T0/T5-182.)
- **(j) Lượt yên #51 CÓ lượt hợp lệ hay không — thuộc T4-182?**
  (Không phải verdict của T2.)
