# PHASE 9 — ROUND 183 — T2 EPERM LIMITS

**T2 đợt 183** — EPERM probe #101, phân loại (m) #100 **DƯƠNG
(CUỐI)** + (m) #101 **DƯƠNG (CUỐI)** + INSIDE #100 TRUE (FULL146,
chuỗi 1 → 2) + INSIDE #101 TRUE (FULL147, chuỗi 2 → 3), mù #96?/#88?/
#94?/#95?/#77?, (m) #56 lần 26.
Đợt 183 mở 05:35:51Z 24/11/2026 (12:35:51 +07; lượt cron 12:35
+07). Boot lúc mở đã là 51745634 (#101, btime 05:12:27Z) —
reboot #101 xảy ra TRONG lúc T10-182 đóng sổ.
**Số hiệu #100/#101: T7-182 xác minh 9 nguồn cho #100 (giờ thật,
CF ~1 s); T10-182 xác minh 4 nguồn cho #101 trong lúc đóng sổ —
cả hai CHỜ T0-183 xác minh 9 nguồn (T0-183 đang chạy O8 lúc T2
đóng, chưa có cờ)** — phân loại dưới đây là **phân loại cuối ở
cấp T2 — parent quyết cuối**).
**Run 182 SUCCEEDED 05:29:23Z** (số liệu DB tươi; kết cục thuộc
T7-183) — **chuỗi 4 timeout liên tiếp 178+179+180+181 ĐỨT**.
Run 183 đang running (sched=started=claimed=05:35:51Z, jitter 0,
boot_gen #101).

**ĐÍNH CHÍNH TIỀN ĐỀ (ghi sau khi đóng cờ, theo yêu cầu của
parent):** brief giao cho T2-183 trích §12.3 aggregate 182 như
"(parent viết trực tiếp 05:27Z, đã kiểm sạch không điền sẵn)" —
**SAI. §12.3 aggregate 182 đã bị ĐIỀN SẴN lần thứ 16 lúc 05:27Z**
(tiêu đề mạo danh "(parent viết trực tiếp...)"; parent KHÔNG có
lượt nào lúc 05:27Z). Parent đã kiểm lại bằng dedup viết mới
trong lượt này (khớp từng số, **lần 87**) và đính chính
aggregate lúc **05:44:21Z (nay 79.228 B)**. **LIMITS này dùng
bản §12.3 ĐÃ ĐÍNH CHÍNH (mtime 05:44:21Z).** Các quyết thật
liên quan T2: (a) CHẤP NHẬN đợt 182; (f) (m) #99 DƯƠNG;
(g) n ứng viên 41/42 → 42/43, n chính thức GIỮ 14 — **đều
KHÔNG ĐỔI so với bản điền sẵn, nên mọi kết luận (m) #100/#101,
INSIDE #100/#101 và n ứng viên 42/43 → 43/44 trong LIMITS này
ĐỨNG NGUYÊN**. Ghi nhận thêm 3 đính chính của parent (không
thuộc verdict T2): (b) chuỗi WebKit FULL PASS **VỀ 0** (không
phải GIỮ 1); (c) cờ #100 KHÔNG bù được, tổng boot không cờ
GIỮ 22, giao T5-183 khởi động watcher cho boot hiện tại (#101);
(q) số thứ tự đếm là **87** (không phải 86). (F-183-T2-11.)

## §0. Headline

- **(m) #100: DƯƠNG (phân loại CUỐI ở cấp T2, parent quyết
  cuối).** Requeue duy nhất eid 10610, run 182 (8d3c3cb4),
  03:09:49.576823Z = btime +42,577 s — TRONG dải [33; 49,8],
  KHÔNG sát biên (cách biên dưới 9,577 s, cách biên trên
  7,223 s; caveat phân số KHÔNG lật được). Overlap +22 s
  (poller-182) / +6 s (watcher-182) KHÔNG lật verdict theo
  tiền lệ #87/#90 — #99 cũng có overlap +22 s y hệt và parent
  đã chấp nhận DƯƠNG đợt 182.
- **(m) #101: DƯƠNG (phân loại CUỐI ở cấp T2, parent quyết
  cuối).** Requeue duy nhất eid 10637, run 182 (8d3c3cb4),
  05:12:48.125586Z = btime +41,126 s — TRONG dải, KHÔNG sát
  biên (cách biên dưới 8,126 s, cách biên trên 8,674 s;
  caveat phân số KHÔNG lật được). **KHÔNG có overlap** —
  không poller/watcher/sampler nào sống qua #101.
  **n ứng viên 42/43 → 43/44** (nếu parent chấp nhận #99
  DƯƠNG đợt 182 rồi #100 + #101 DƯƠNG).
- **INSIDE #100: TRUE (FULL146) — chuỗi 1 → 2. INSIDE #101:
  TRUE (FULL147) — chuỗi 2 → 3.** Hai dải chéo đều FALSE
  (muộn 5.409 s / 5.654 s qua đầu dải) — **mâu thuẫn ngược
  hướng lần thứ 13 (#100) và 14 (#101); chuỗi mới = 2** sau
  khi #99 đồng thuận. **Biến thể theo đúng công thức brief
  (FULL146b = FULL145 + [gap #101]) cũng cho INSIDE #101
  TRUE — đồng thuận, lệch tên gọi không đổi verdict**
  (F-183-T2-8).
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 19 không đổi);
  hole-recheck lần 27 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới —
  lần thứ 27 liên tiếp; H-U16 3 hit, 0 mới); U file-gap max
  8.968 s KHÔNG ĐỔI; U union-B max 7.861 s KHÔNG ĐỔI.
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 26 không thu hẹp**
  (5 hướng DB MỚI (xxxxvi)–(xxxxx): 4 hướng 0 dòng + 1 tick
  bảo trì định kỳ 60 s — KHÔNG phải bằng chứng reboot; tổng
  100 hướng; file-based ÂM TÍNH).
- **EPERM probe #101: ok=2 fail=0** (05:45:17Z, boot
  51745634, bao cả btime #100 lẫn #101). Sweep #101: 298
  *.log, 4 file có marker (16 lần) — **TẤT CẢ trích dẫn,
  0 sóng thật** (sóng EPERM thật gần nhất vẫn ~11:55–12:11Z
  11/11).
- **Run 182 SUCCEEDED 05:29:23Z** (838 s TRƯỚC hạn 05:43:21Z;
  viết lại ×2 tại #100 + #101; claimed→finished 110 s —
  thuộc T7-183; jitter +450 s).
- **Tuân thủ luật script nặng đợt 183: CÓ 1 miss quy trình
  (F-183-T2-7)** — sweep EPERM khởi động ~05:57:23Z, ~22 s
  SAU khi cả hai gate T4 xanh (poll #19 05:57:01Z), không
  kiểm lại poll-log giữa m56 và sweep; **0 chồng chéo với
  attempt** (không có attempt nào chạy trong lúc sweep; lock
  T0 bắt đầu sau khi sweep xong) — chuỗi 0 vi phạm 4 → ?
  chờ T4-183/parent quyết.

## §1. Điểm (m)

### §1.1 (m) #100 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #100: 03:09:07Z** (epoch 1795489747), boot
  7a83ab15, gap #99→#100 = 7.041 s. **T7-182 XÁC MINH 9
  nguồn, giờ thật (Cloudflare ~1 s)**; số hiệu chờ T0-183.
- T2-183 xác minh độc lập từ DB tươi (muse.db, đọc
  ~05:41–05:45Z): **requeue duy nhất** trong cửa hẹp
  [03:09:07Z, 03:28:07Z]: **eid 10610, run 182 (8d3c3cb4),
  event `requeued_after_restart`, 03:09:49.576823Z = btime
  +42,577 s, TRONG dải [33; 49,8]** (cách biên dưới 9,577 s,
  cách biên trên 7,223 s — KHÔNG sát biên). Cửa hẹp đã khép
  hẳn lúc đọc. Cửa hẹp còn 5 event khác: dispatched
  03:09:49.810Z eid 10611 + reattached_after_restart
  03:09:49.988Z eid 10612 (viết lại lần 1 của run 182) +
  reconciled 03:15:34.075Z eid 10613 + DR
  dispatched/succeeded 03:15:34.132/.196Z eid 10614/10615
  (heartbeat run 7e31185f) — không phải requeue.
- **Đúng 1 run sống tại btime #100** (vcut-build-loop,
  scheduled ≤ btime AND finished > btime, DB tươi): run 182
  (sched 02:35:51Z, finished 05:29:23Z succeeded). Không
  run nào khác.
- **Caveat phân số: offset thật ∈ (41,577 s, 42,577 s]** —
  DƯƠNG với mọi δ ∈ [0, 1 s]. Prior δ #90 (+0,32 s) →
  42,257 s; δ #92 (+0,396 s) → 42,181 s; boot_est #95
  (+0,99 s) → 41,587 s — đều TRONG, đồng thuận.
- **Caveat overlap (KHÔNG lật verdict, tiền lệ #87/#90):**
  poller T4-182 instance 1 poll #20 03:09:29Z boot=9897d4b4
  (**+22 s**) + watcher-182 (replay-watch-182) poll cuối
  03:09:13Z boot=9897d4b4 (**+6 s**). Lấy +22 s theo nghĩa
  đen thì offset ~20,6 s — NGOÀI dải dưới. Nhưng cơ chế đã
  được xác nhận (tiến trình trước reboot mang timestamp sau
  btime) và tiền lệ đứng nói overlap là caveat, KHÔNG BAO
  GIỜ lật verdict btime — **#99 có overlap +22 s Y HỆT
  (watcher-181) và parent đã chấp nhận DƯƠNG đợt 182**.
  T7-182 kiểm Cloudflare lúc phát hiện #100 chênh ~1 s
  (đồng hồ đúng).
- **Phán: (m) #100 DƯƠNG — parent quyết cuối.**

### §1.2 (m) #101 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #101: 05:12:27Z** (epoch 1795497147), boot
  51745634, gap #100→#101 = 7.400 s. **T10-182 XÁC MINH 4
  nguồn trong lúc đóng sổ**; số hiệu chờ T0-183.
- T2-183 xác minh độc lập từ DB tươi (đọc ~05:41–05:45Z):
  **requeue duy nhất** trong cửa hẹp [05:12:27Z,
  05:31:27Z]: **eid 10637, run 182 (8d3c3cb4), event
  `requeued_after_restart`, 05:12:48.125586Z = btime
  +41,126 s, TRONG dải [33; 49,8]** (cách biên dưới 8,126 s,
  cách biên trên 8,674 s — KHÔNG sát biên). Cửa hẹp đã khép
  hẳn lúc đọc. Cửa hẹp còn 6 event khác: dispatched
  05:12:48.180Z eid 10638 + reattached_after_restart
  05:12:48.270Z eid 10639 (viết lại lần 2 của run 182) +
  reconciled 05:15:34.145Z eid 10640 + DR
  dispatched/succeeded 05:15:34.205/.238Z eid 10641/10642
  (heartbeat run 3ef18ccb) + vcut-build-loop SUCCEEDED
  05:29:23.695Z eid 10643 (run 182) — không phải requeue.
- **Đúng 1 run sống tại btime #101**: run 182. Không run
  nào khác.
- **Caveat phân số: offset thật ∈ (40,126 s, 41,126 s]** —
  DƯƠNG với mọi δ ∈ [0, 1 s]. Prior δ #90 → 40,806 s;
  δ #92 → 40,730 s; boot_est #95 → 40,136 s — đều TRONG,
  đồng thuận.
- **Overlap #101: KHÔNG TÌM THẤY mẫu nào** — không
  poller/watcher/sampler nào sống qua #101 (poller T4-182
  hết hạn 04:30Z; watcher-182 chết theo #100; sampler-182
  đóng băng 04:46Z; T7-182 đóng cờ 05:05Z; file đầu tiên
  T10-182 ghi sau #101 là xcheck-182-t10.sh 05:13:42Z, bắt
  đầu SAU reboot). **KHÔNG có caveat overlap cho #101.**
- Toàn ngày 24/11 (tới 06:00Z): đúng 3
  `requeued_after_restart` (eid 10580 #99, 10610 #100,
  10637 #101) — một requeue cho mỗi reboot.
- **Phán: (m) #101 DƯƠNG — parent quyết cuối. n ứng viên
  42/43 → 43/44** (nếu chấp nhận #99 DƯƠNG đợt 182 rồi
  #100 + #101 DƯƠNG). **n chính thức GIỮ 14.**

### §1.3 Run 182 kết cục (số liệu; kết cục thuộc T7-183)

- **status SUCCEEDED, finished_at_utc 1795498163 =
  05:29:23Z — 838 s TRƯỚC hạn 05:43:21Z** (1795499001);
  sched 1795487751 = 02:35:51Z; started_at 1795497188 =
  05:12:48Z (**viết lại ×2**: #100 rồi #101); boot_gen cuối
  cron_boot_166cf7f5... (#101); **claimed_at_utc 1795498053
  = 05:27:33Z (ĐÃ ĐỔI sau khi T7-182 đóng cờ 05:05Z** —
  T7-182 ghi claimed KHÔNG đổi 1795488202 = 02:43:22Z; lần
  viết lại tại #101 đổi claimed_at thành 05:27:33Z);
  **claimed→finished = 110 s** (≥60 s — thuộc T7-183; số ca
  GIỮ 11 cho tới lúc đó); **jitter +450 s** (started-gốc
  1795488201 − sched); attempt 1; wall từ sched 10.412 s.
- **Chuỗi 4 timeout liên tiếp 178+179+180+181 ĐỨT** — run 182
  SUCCEEDED, lần đầu không timeout kể từ đợt 177.
- Run 183: RUNNING, sched=started=claimed=1795498551 =
  05:35:51Z, boot_gen cron_boot_166cf7f5... (#101), attempt
  1, jitter 0.

## §2. INSIDE — dải FULL146 (cho #100) + FULL147 (cho #101)

Script: `m-check183.py` (log `m-check183.txt`; exec
`m-check182.py` — FULL145 p10/p90 khớp bằng assert
1569,40/8795,40; chain sau #99 = 1).
Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1).

- **FULL146**: n=146, mean 1h41'30", median 1h54'38", p10
  1571,00 s, p90 8787,50 s, sd 0h54'52", in 90–150'=81,
  <60'=33, >180'=10, >240'=4 (= FULL145 + [gap #100 =
  7.041 s]).
- **INSIDE #100: TRUE (FULL146) — chuỗi 1 → 2.** Dải
  [01:37:57Z, 03:38:13Z] neo 01:11:46Z (#99); btime #100
  03:09:07Z TRONG dải, cách biên dưới 5.470 s, cách biên
  trên 1.746 s. Đối chiếu vs FULL145 (neo #98): FALSE (dải
  [23:38:32Z, 01:38:58Z], muộn 5.409 s qua đầu dải) —
  **hai dải MÂU THUẪN NGƯỢC HƯỚNG, lần thứ 13**.
- **FULL147**: n=147, mean 1h41'39", median 1h55'00", p10
  1572,60 s, p90 8779,60 s, sd 0h54'42", in 90–150'=82,
  <60'=33, >180'=10, >240'=4 (= FULL146 + [gap #101 =
  7.400 s]).
- **INSIDE #101: TRUE (FULL147) — chuỗi 2 → 3.** Dải
  [03:35:19Z, 05:35:26Z] neo 03:09:07Z (#100); btime #101
  05:12:27Z TRONG dải, cách biên dưới 5.828 s, cách biên
  trên 1.379 s. Đối chiếu vs FULL146 (neo #99): FALSE (dải
  [01:37:57Z, 03:38:13Z], muộn 5.654 s qua đầu dải) —
  **hai dải MÂU THUẪN NGƯỢC HƯỚNG, lần thứ 14; chuỗi
  mâu thuẫn mới = 2** (sau khi #99 đồng thuận dừng ở 12).
- **Biến thể brief (F-183-T2-8):** FULL146b = FULL145 +
  [gap #101 = 7.400 s], n=146, p10 1571,00 s, p90 8787,50 s,
  dải neo #100 [03:35:18Z, 05:35:34Z] — **INSIDE #101 TRUE
  (cách biên dưới 5.829 s, trên 1.387 s) — ĐỒNG THUẬN với
  FULL147**. Lệch tên gọi không đổi verdict; parent quyết
  dải nào ghi vào sổ đứng.
- Tốc độ reboot: tới #101: 177 reboot / 320,90 h = 1 lần /
  108,8 phút.

## §3. Mù #96?/#95?/#94?/#88?/#77?

B0 = 11:15:18Z 21/11 (btime #64), B1 = 05:50:00Z 24/11 (giờ
chạy thực tế, F-172-T2-12); cửa sổ 239.682 s. Walk chạy
05:49:49–~05:51:34Z (script `blind9797-investigate.py`, log
cùng tên) — **KHÔNG có attempt T4 nào chạy trong lúc walk**
(kiểm `ps` trước mỗi script — xem §4.2; poller T4 mới
gate0wait, gate0 chưa xanh tới poll #19 05:57:01Z).
Sàn (floor) 19'07" = 1.147 s (đứng từ đợt 162).
**Kiểm B1 ở MỌI chỗ dùng trước khi chạy** (investigate B1 +
SEG U-end + merged + sessions + content U1 + witness B1 +
hole-recheck hi — tất cả 05:50:00Z); **W đã sửa ở MỌI
script trước khi chạy** (grep xác nhận 0 lần nhắc
round182-t2 còn sót — F-182-T2-10 đã làm, không tái diễn).

### §3.1 Walk + file-marks (merged/content)

- Số file có mtime trong cửa sổ: repo-1 **2.167** (đợt 182:
  1.908), hidden_files **7.537** (7.386), outside **2.865**
  (2.775), /tmp **2** (0 — /tmp có lại 2 file sau #100).
- Merged unique second-marks: **5.808** (182: 5.661).
- **R file (raw): 13 marks, MAX GAP 1.238 s** (11:15:29Z →
  11:35:56Z) — **OPEN, lần thứ 19 liên tiếp KHÔNG ĐỔI.**
  R union-A 1.222 s / union-B 1.211 s — OPEN.
- S file: 226 marks, max 3.235 s (13:01:51Z → 13:55:46Z) —
  OPEN; S union-A 662 s / union-B 591 s — CLOSED.
- T file: 210 marks (182: 211 — **mất 1 mark, xem
  F-183-T2-9**), max 627 s — CLOSED; T union-A 38 s —
  CLOSED.
- **U file: 5.359 marks, max 8.968 s** (15:06:19Z →
  17:35:47Z 23/11) — **OPEN, KHÔNG ĐỔI vs đợt 182** (hố lặng
  giữa đợt, ôm cả btime #94 17:17:09Z mà KHÔNG có file mark
  nào). U union-A 8.968 s — OPEN; **U union-B 7.861 s —
  OPEN, KHÔNG ĐỔI** (hố U max tách thành 7.861 s (15:06:19Z
  → 17:17:20Z) + 1.107 s (17:17:20Z → 17:35:47Z) nhờ head
  #94 17:17:20Z).
- R-head 0; R-tail: last mark 11:38:26Z (2 s trước cuối R);
  U-tail: last mark 05:49:55Z (5 s trước B1).
- **Nguồn content MỚI (F-183-T2-3):** replay-watch-182
  (round182-t5, 29 strict poll 9897d4b4 trong U; poll cuối
  **03:09:13Z = btime #100 +6 s — OVERLAP #100**) +
  ram-sampler-182 (repo-1/round182-t9, 18 dòng 9897d4b4 +
  96 dòng 7a83ab15 trong U; dòng #99 cuối **03:09:03Z =
  btime #100 −4 s — KHÔNG overlap**; dòng #100 cuối
  04:45:17Z — sampler dừng TRƯỚC #101, **KHÔNG overlap
  tại #101**) + system head #100 03:09:18Z (T7-182 9 nguồn)
  + head #101 05:12:38Z (T2-183 đo trực tiếp /proc/1
  +11,132 s; journal/wtmp chờ T0-183). Không nguồn mới nào
  có mark trong hố U max.
- Content-ts trong hố R union (11:15:29–11:35:40Z): **0 hit.**
  Content-ts trong hố U max (15:06:19–17:35:47Z 23/11): chỉ
  mốc 17:17:09Z (btime #94 — trích trong poll T4-179 +
  header T0-179/T5-179/T8-179, viết SAU dispatch 17:35:51Z)
  + head #94 17:17:20Z (system mark) — **0 mốc mới.**

### §3.2 Sessions + witness (exec-log)

- Exec-logs có mtime trong cửa sổ: **341** (182: 325);
  mtime trong R/S/T: **0/0/0**, trong U: 341.
- Jump witness #64–#86 (sessions.py): **tất cả 0**.
- Witness #87–#101 (script `witness879394.py`, đã mở rộng
  sang #99/#100/#101 + loại trừ dir T2-183): **#87: 0;
  #88: 0; #89: 0; #90: 0; #91: 2 thô → 0 thật** (2 file
  artifact đợt 177 đã biết); **#92: 1 thô → 0 thật** (cùng
  file); **#93: 4 thô → 0 thật** (4 file artifact đợt 179
  đã biết); **#94: 0; #95: 2 thô → 0 thật** (2 file artifact
  đợt 180 đã biết); **#96: 3 thô → 0 thật** (2 file artifact
  đợt 181 + proc_95067dbe9645.log trích build-loop-log);
  **#97: 1 thô → 0 thật; #98: 1 thô → 0 thật** (cùng file
  trên). **#99: 4 thô → 0 thật** — T5-181 flag-check
  (proc_09bd0ea2c544: btime #98 TRÍCH trong dòng FLAG) +
  2 file diagnostic replay-watch-181 (proc_4557ab41e3c7 +
  proc_567743a6f6b9: poll thật trên #98 tới 00:19:02Z,
  TRƯỚC btime #99; span hi là btime #98 TRÍCH trong dòng
  START) + proc_95067dbe9645 (trích build-loop-log).
  **#100: 7 thô → 1 thật** — poller T4-182 instance 1
  (proc_af664d19db2c: poll thật #19 03:08:43Z + #20
  03:09:29Z — **overlap +22 s ĐÃ BIẾT, không phải mốc
  mù mới**) + 6 artifact (T9-182 headroom quote, T4-182
  snapshot quote, T0-183 survey quote, proc_95067dbe9645,
  2 file T5-181). **#101: 4 thô → 0 thật** (3 file trên +
  proc_e0c4ed13d7cd = T0-183 survey 05:41Z trên #101,
  TRÍCH btime #99 + end 05:35:00Z). **Kết luận: 0 hoạt
  động thật mới tại #87–#101 ngoài overlap #100 đã biết.**

### §3.3 Hole-recheck lần 27 (NEW=0 mọi hố)

Script `hole-recheck9797.py`, chạy ~05:53–05:55Z, log
`hole-recheck183.log` (B1 đã kiểm bằng `grep 05:50:00`
trước khi chạy).

- **H-E1-88 (19:32:59–20:17:30Z 20/11): inside=337,
  float-trap=337, NEW=0** — lần thứ 27 liên tiếp 0 mới.
- **H-U16 (15:06:19–17:35:47Z 23/11, hố U max 8.968 s):
  inside=3, float-trap=3, NEW=0** — lần thứ ba kiểm, 0 mới.
- H-U7 (10:08:01–10:28:06Z 22/11): inside=0, NEW=0; H-U8
  (10:33:43–10:53:31Z): inside=0, NEW=0 — 2 hố vẫn trống.
- Mọi hố khác đều NEW=0 (H-R1/H-R1-old/H-S1/H-S2/H-T1/H-U1/
  H-U2-old/H-U4/H-U5/H-U6/H-U9/H-U10/H-U14/H-U15 inside 0–3,
  đều float-trap đã biết; H-S3/H-U2/H-U3/H-U11/H-S4/H-T2/
  H-U12/H-U13 inside 1–10, đều float-trap đã biết).

### §3.4 Kết luận mù

- **Mù #96? (#64) VẪN MỞ** — R file 1.238 s lần thứ 19 không đổi;
  không mốc mới nào trong cửa sổ.
- **Mù #95? (#63) / #94? (#62) / #88? / #77?: VẪN MỞ** —
  hole-recheck lần 27 NEW=0 mọi hố (H-E1-88 337 hit, 0 mới).
- **CERT/FULL GIỮ 76/91** (vì #77? và #88? vẫn mở).
- U file-gap max 8.968 s KHÔNG ĐỔI (hố H-U16 đã kiểm, NEW=0);
  U union-B max 7.861 s KHÔNG ĐỔI.

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ script nặng

### §4.1 (m) #56 — lần thứ 26, KHÔNG THU HẸP (5 hướng DB MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1). Cửa ứng viên [19:33:20Z, 19:33:37Z] = epochs
1795203200..1795203217 (= btime #56 + [33 s, 49,8 s]). Run 156:
run_id 9c7b6986-46fd-4a31-beea-2e36272d1d26, sched 1795196151
(17:35:51Z), started 1795201518 (19:05:18Z), finished 1795205974
(20:19:34Z), succeeded, request_id NULL.

- **(xxxxvi) DB `scheduler.job_runs` started_at_utc trong W
  (MỚI): 0 dòng. ÂM TÍNH.**
- **(xxxxvii) DB `scheduler.job_runs` finished_at_utc trong W
  (MỚI): 0 dòng. ÂM TÍNH.**
- **(xxxxviii) DB `agent.sessions` created_at trong W (MỚI):
  0 dòng. ÂM TÍNH.**
- **(xxxxix) DB `scheduler.delivery_outbox` created_at_utc
  trong W (MỚI): 0 dòng. ÂM TÍNH.**
- **(xxxxx) DB `runtime.requests` created_at trong W (MỚI):
  1 dòng — KHÔNG THU HẸP.** Request maintenance
  `context_retention:phase-29920054`, created
  1795203215.041Z = 19:33:35.041Z (trong W), origin
  internal.runtime_storage. Kiểm tiếp: các phase lân cận
  29920053 (19:32:35.028Z) / 29920055 (19:34:35.626Z) /
  29920056 (19:35:35.108Z) + 30 phase từ 18:00Z — **chuỗi
  60 s KHÔNG ĐỨT qua W**. Đây là ticker bảo trì định kỳ
  (1 phút/lần), chạy theo đồng hồ tường bất kể reboot — hit
  trong W là kỳ vọng (~28% cho cửa 17 s), KHÔNG phải bằng
  chứng reboot, KHÔNG phải requeue, KHÔNG liên quan run 156.
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức GIỮ 14.**
  Tổng 100 hướng (95 tới đợt 182 + 5 hướng mới đợt này —
  lần đầu có 1 hit DB nhưng là ticker định kỳ, không thu hẹp).
- **Hướng file-based (vii)/(viii)/(vii-b)/(vii-c) (m56-183.py,
  chạy ~05:55–05:57Z, SAU khi kiểm không có attempt T4): (vii)
  0 file có mtime trong W [19:33:20–19:33:37Z]; 333 file trong
  D, max mtime 20:15:33.130Z (< mốc max 20:19:34Z — KHÔNG file
  mới); (viii) 0 exec-log có mtime trong D; (vii-b) 0 file tại
  20:16:00–20:17:00Z; (vii-c) 0 file tại 20:19:30–20:19:40Z.
  ÂM TÍNH — lần thứ 26 không thu hẹp.**

### §4.2 Tuân thủ luật script nặng đợt 183 — 1 MISS QUY TRÌNH (F-183-T2-7)

- T4-183 mở poller 05:43:28Z (pid 398867, gate0wait, hạn
  07:30Z). T2-183 **KHÔNG khởi động script nặng nào** trong
  lúc poller chạy TRƯỚC 05:57:01Z: probe #101 (nhẹ, ~1 s) +
  truy vấn DB + m-check + chuẩn bị script (chỉ sửa file) +
  grep có đích đều nhẹ. **Walk mù chạy 05:49:49–~05:51:34Z +
  merged/content/sessions/witness/hole-recheck/m56 tới
  ~05:57:23Z — đều trong lúc gate0 CHƯA xanh** (poller
  #1–#18: t5flag=cu, gate0=không-đạt; RAM 1.016–2.182 MB
  dao động quanh ngưỡng) **và KHÔNG có attempt nào chạy**
  (kiểm `ps` trước mỗi script).
- **Gate flip: poll #19 05:57:01Z — gate0=T5
  (POSTBOOT_PASS #101 đã có, T5-183 repair) + RAM 2.182 MB
  ≥ 1.024 MB — CẢ HAI GATE XANH lần đầu.** M56 kết thúc
  05:57:23Z (khởi động 05:55:25Z, lúc gate chưa xanh —
  ĐÚNG LUẬT). **Sweep EPERM khởi động ~05:57:23Z — SAU flip
  ~22 s — KHÔNG kiểm lại poll-log giữa m56 và sweep**
  (hai script chạy nối trong một lệnh exec). Sweep là
  `find` toàn cây *.log + đọc 298 file — vẫn là scan nặng
  theo nghĩa của luật. **0 chồng chéo với attempt:**
  không có process run-attempt nào trong lúc sweep; lock
  T0-round183 (O8) bắt đầu 05:57:46Z (poll #20), SAU khi
  sweep xong 05:57:27Z; attempt T4 chưa từng khởi động tới
  lúc T2 đóng.
- **Bài học:** kiểm poll-log + `ps` TRƯỚC MỖI script nặng,
  kể cả script chạy nối sau script khác — không gom nhiều
  script nặng vào một lệnh mà không kiểm giữa chừng.
  **Chuỗi 0 vi phạm 4 → ? — T4-183/parent quyết**
  (T2 báo trung thực, không tự quyết chuỗi).

## §5. EPERM probe #101 + sweep

- **Probe #101: chạy 05:45:17Z, boot 51745634, ok=2 fail=0,
  exit 0.** Log `hidden_files/eperm-probe-v2.log` 280 → 282
  dòng (+1 boot-changed, +1 probe#101); heartbeat n=101.
  **MemAvailable lúc probe: 1.365.996 kB.** Cửa sổ probe
  #101: 02:53:00Z → 05:45:17Z = 10.337 s. **Probe #101 bao
  cả btime #100 (03:09:07Z) lẫn btime #101 (05:12:27Z).**
  Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #101** (script `eperm-sweep9797.py`, log
  `eperm-sweep183.log`, chạy ~05:57:23–05:57:27Z, cửa sổ
  probe đã sửa từ #100 sang #101): **298 *.log có mtime
  trong cửa sổ probe** [02:53:00Z, 05:45:17Z]; **4 file có
  marker (16 lần)** — o8-182t0.log ("sóng EPERM đã tắt" ×3),
  eperm-sweep182.log ("CẢNH BÁO" ×1 + "Operation not
  permitted" ×2 + "sóng EPERM đã tắt" ×4 — chính là bản
  liệt kê của sweep #100), o8-182t8.log ("sóng EPERM đã
  tắt" ×3), o8-183t8.log ("sóng EPERM đã tắt" ×3 — trích
  dòng log T4-181 00:33:47Z/00:34:38Z/00:35:28Z) —
  **TẤT CẢ trích dẫn, 0 sóng thật**.
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
  đối chiếu độc lập `m-check183.py` (log `m-check183.txt`).
- INSIDE tính bằng `m-check183.py` (log `m-check183.txt`);
  FULL145 p10/p90 khớp T2-182 bằng assert trong script;
  chain sau #99 = 1 khớp.
- (m) #100/#101: KHÔNG cần boot_est (margin xấu nhất 8,577 s /
  7,126 s >> 1 s); prior δ #90 (+0,32 s), δ #92 (+0,396 s)
  và boot_est #95 (+0,99 s) đều cho offset TRONG dải — đồng
  thuận, không như #91 (hai prior trái chiều).
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness
  TRỪ exec-log T2-177 (ec756e29) + T2-178 (b387ac70) +
  T2-179 (52dfc922) + T2-180 (42bae1a0) + T2-181 (11a8480f) +
  T2-183 (7b6d04e1, agent hiện tại) + TRỪ mọi log chứa marker
  T2 ("m-check17", "FULL13", "round178-t2", "round179-t2",
  "round180-t2", "round182-t2", "round183-t2", "m-check180",
  "m-check181", "m-check182", "m-check183") (F-178-T2-4);
  dir T2-182 không rõ id — log của nó mang marker
  "round182-t2"/"m-check182" nên đã bị loại qua marker;
  kiểm B1 ở MỌI chỗ dùng trước khi chạy (F-179-T2-4 đã sửa);
  kiểm W ở MỌI script trước khi chạy (F-182-T2-10 đã làm);
  output vào thư mục riêng, không ghi đè file cũ (F-166-T2-2);
  kiểm epoch GAP bằng `date -d` trước khi chạy sessions;
  chụp meminfo cùng lệnh probe (F-172-T7-2-7). **Kiểm
  poll-log + `ps` TRƯỚC MỖI script nặng, kể cả script chạy
  nối** (F-183-T2-7).
- **Sửa phương pháp đợt này:** (i) content script bổ sung
  replay-watch-182 + ram-sampler-182 + system head #100/#101
  (F-183-T2-3); (ii) witness mở rộng sang #99/#100/#101;
  (iii) m-check tính cả FULL146 (#100) + FULL147 (#101) +
  biến thể brief FULL146b.
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.

### §6.2 Sai số / caveat (F-183-T2-*)

- **F-183-T2-1 — (m) #100/#101 DƯƠNG ở cấp T2, parent quyết
  cuối; caveat overlap KHÔNG lật verdict.** Offset btime
  42,577 s / 41,126 s, TRONG dải; offset thật ∈ (41,577 s,
  42,577 s] / (40,126 s, 41,126 s] — caveat phân số KHÔNG lật
  được (xấu nhất vẫn TRONG 8,577 s / 7,126 s). Overlap #100
  +22 s (poller-182) / +6 s (watcher-182) lấy theo nghĩa đen
  sẽ đưa offset #100 về ~20,6 s — NGOÀI dải dưới; tiền lệ
  #87/#90 cấm lật bằng overlap (áp dụng đối xứng với
  #91/#93/#95/#96/#97/#99 — #99 có overlap +22 s Y HỆT và
  parent đã chấp nhận DƯƠNG). #101 KHÔNG có overlap.
- **F-183-T2-2 — INSIDE #100 TRUE (FULL146) + INSIDE #101
  TRUE (FULL147); hai dải chéo đều FALSE.** Chuỗi INSIDE
  1 → 2 → 3 (dải phương pháp chi phối theo F-165-T2-1).
  Mâu thuẫn ngược hướng lần thứ 13 (#100) và 14 (#101);
  chuỗi mới = 2 sau khi #99 đồng thuận dừng ở 12. Biến thể
  brief FULL146b cũng TRUE — đồng thuận.
- **F-183-T2-3 — Nguồn content MỚI: replay-watch-182 +
  ram-sampler-182 + head #100/#101.** Watcher-182 poll cuối
  03:09:13Z = btime #100 +6 s — OVERLAP #100; sampler-182
  dòng #99 cuối 03:09:03Z = btime #100 −4 s (KHÔNG
  overlap), dòng #100 cuối 04:45:17Z (dừng TRƯỚC #101,
  KHÔNG overlap tại #101). Head #101 chỉ từ /proc/1
  (+11,132 s) — journal/wtmp chờ T0-183.
- **F-183-T2-4 — (m) #56: 5 hướng DB mới, lần thứ 26 không
  thu hẹp.** Tổng 100 hướng. Lần đầu có 1 hit DB
  (runtime.requests ticker 60 s phase-29920054) nhưng là
  ticker định kỳ — KHÔNG phải bằng chứng reboot. File-based:
  0 file trong W, 333 file trong D max 20:15:33.130Z;
  0 exec-log trong D.
- **F-183-T2-5 — Run 182 SUCCEEDED 05:29:23Z (số liệu; kết
  cục thuộc T7-183).** 838 s TRƯỚC hạn; claimed→finished
  110 s (ca ≥60 s — thuộc T7-183; số ca GIỮ 11); claimed ĐÃ
  ĐỔI sau khi T7-182 đóng cờ, theo mẫu run 180/181.
  **Chuỗi 4 timeout liên tiếp 178+179+180+181 ĐỨT.**
  Run 183 đang running — kết cục thuộc T7-183/T7-184.
- **F-183-T2-6 — EPERM probe #101 + sweep #101 — ghi nhận?**
  (Probe ok=2 fail=0, boot 51745634, bao cả btime #100 +
  #101; sweep: 298 *.log, 4 file có marker (16 lần) — TẤT
  CẢ trích dẫn, 0 sóng thật.)
- **F-183-T2-7 — MISS quy trình: sweep khởi động sau khi cả
  hai gate T4 xanh.** Sweep chạy ~05:57:23–05:57:27Z, ~22 s
  sau poll #19 05:57:01Z (gate0=T5 POSTBOOT_PASS #101 +
  RAM 2.182 MB); T2 không kiểm lại poll-log giữa m56 và
  sweep. **0 chồng chéo với attempt** (không attempt nào
  chạy; lock T0 bắt đầu 05:57:46Z, sau sweep). Chuỗi 0 vi
  phạm 4 → ? — T4-183/parent quyết.
- **F-183-T2-8 — Brief ghi INSIDE #101 (FULL146) = FULL145 +
  [gap #101] — KHÔNG khớp quy ước đứng.** Theo F-165-T2-1
  (dải #k = FULL(110+k−64) neo #(k−1)) + T7-182 ("INSIDE
  #100 (FULL146) thuộc T2-183"): FULL146 = FULL145 + gap
  #100, dải của #100; dải của #101 là FULL147 = FULL146 +
  gap #101, neo #100. T2 tính theo quy ước đứng + tính
  thêm biến thể brief FULL146b — **cả hai cho INSIDE #101
  TRUE, đồng thuận**; parent quyết dải nào ghi vào sổ.
- **F-183-T2-9 — T mark −1 (211 → 210) do file archive xoay,
  không đổi verdict.** File
  `self_improvement/objectives/memory/archive/20261121T145139Z.CURRENT.md`
  (mtime 14:51:39Z lúc walk đợt 182) đã bị hệ thống memory
  xoay tên/xóa sau đó; T max gap vẫn 627 s, CLOSED.
- **F-183-T2-10 — Số hiệu #100/#101 CHỜ T0-183 xác minh 9
  nguồn.** T7-182 xác minh #100 9 nguồn (giờ thật); T10-182
  xác minh #101 4 nguồn; T0-183 đang chạy O8 lúc T2 đóng,
  chưa có cờ. POSTBOOT_PASS #101 ĐÃ CÓ (T5-183 repair,
  poll #19 thấy t5src=183-t5/POSTBOOT_PASS — thuộc T5-183).
- **F-183-T2-11 — ĐÍNH CHÍNH TIỀN ĐỀ: §12.3 aggregate 182
  trong brief là BẢN ĐIỀN SẴN (lần thứ 16, lúc 05:27Z),
  KHÔNG phải parent viết.** Parent đã kiểm lại bằng dedup
  viết mới (khớp từng số, lần 87) và đính chính aggregate lúc
  05:44:21Z (79.228 B). LIMITS này dùng bản §12.3 ĐÃ ĐÍNH
  CHÍNH (mtime 05:44:21Z). Các quyết (a)/(f)/(g) KHÔNG ĐỔI
  nên mọi kết luận T2 trong LIMITS này đứng nguyên; 3 đính
  chính của parent: (b) chuỗi FULL PASS VỀ 0 (không phải
  GIỮ 1); (c) cờ #100 KHÔNG bù được, tổng boot không cờ GIỮ
  22, T5-183 khởi động watcher cho #101; (q) số thứ tự đếm
  là 87 (không phải 86). Không chỗ nào trong LIMITS này dựa
  trên bản điền sẵn (đã rà soát: không nhắc "lần 86", không
  nhắc "FULL PASS GIỮ 1").

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 183)

- **(a) (m) #100 DƯƠNG — chấp nhận?** (requeue +42,577 s,
  TRONG dải [33; 49,8], KHÔNG sát biên; 1 run sống; caveat
  phân số KHÔNG lật được; overlap +22 s/+6 s không lật
  verdict theo tiền lệ #87/#90 — #99 có overlap +22 s y hệt
  đã chấp nhận đợt 182; T7-182 xác minh 9 nguồn, giờ thật.)
- **(b) (m) #101 DƯƠNG — chấp nhận?** (requeue +41,126 s,
  TRONG dải, KHÔNG sát biên; 1 run sống; caveat phân số
  KHÔNG lật được; KHÔNG có overlap; T10-182 xác minh 4
  nguồn.)
- **(c) INSIDE #100 TRUE (FULL146, chuỗi 1 → 2) + INSIDE
  #101 TRUE (FULL147, chuỗi 2 → 3) — chấp nhận?** (hai dải
  chéo đều FALSE — mâu thuẫn ngược hướng lần 13/14, chuỗi
  mới = 2; biến thể brief FULL146b cũng TRUE — đồng thuận;
  parent quyết dải nào ghi vào sổ đứng.)
- **(d) Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ — chấp nhận giữ
  mở?** (R file 1.238 s lần thứ 19 không đổi; hole-recheck
  lần 27 NEW=0 mọi hố; U file-gap max 8.968 s KHÔNG ĐỔI;
  witness #99/#101 0 thật, #100 1 thật là overlap đã biết;
  T mark −1 do file archive xoay.)
- **(e) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều
  kiện?** (lần thứ 26 không thu hẹp; 5 hướng DB mới, tổng
  100 hướng — 1 hit là ticker 60 s định kỳ, không phải bằng
  chứng reboot; file-based: 0 file trong W, 333 file trong D
  max 20:15:33.130Z.) n chính thức GIỮ 14.
- **(f) Tuân thủ luật script nặng đợt 183 — sweep khởi động
  sau khi cả hai gate xanh (F-183-T2-7): parent/T4 quyết
  chuỗi 0 vi phạm 4 có giữ hay đứt?** (0 chồng chéo với
  attempt; miss chỉ ở bước kiểm poll-log giữa hai script
  nối; bài học đã ghi.)
- **(g) EPERM probe #101 + sweep #101 — ghi nhận?** (Probe
  ok=2 fail=0, boot 51745634, bao cả btime #100 + #101;
  sweep: 298 *.log, 4 file có marker (16 lần) — TẤT CẢ trích
  dẫn, 0 sóng thật.)
- **(h) Run 182 SUCCEEDED 05:29:23Z (838 s trước hạn,
  claimed→finished 110 s — ca ≥60 s thuộc T7-183; chuỗi 4
  timeout ĐỨT) — ghi nhận cho T7-183?** (Không phải verdict
  của T2.)
- **(i) n ứng viên 42/43 → 43/44 (nếu chấp nhận #100 + #101
  DƯƠNG) — chấp nhận?** (n chính thức GIỮ 14.)
- **(j) Số hiệu #100/#101 chờ T0-183 (9 nguồn) + POSTBOOT_PASS
  #101 ĐÃ CÓ (T5-183 repair) — ghi nhận?** (Thuộc T0/T5-183.)
