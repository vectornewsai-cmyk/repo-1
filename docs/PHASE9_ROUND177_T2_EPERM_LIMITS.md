# PHASE 9 — ROUND 177 — T2 EPERM LIMITS

**T2 đợt 177** — EPERM probe #95, phân loại (m) #90 **CUỐI** +
INSIDE #89 **CUỐI (ĐỨT chuỗi 7 → 0)** + INSIDE #90 TRUE (chuỗi mới 1),
mù #96?/#88?/#94?/#95?/#77?, (m) #56 lần 20.
Đợt 177 mở 08:35:51Z 23/11/2026 (15:35:51 +07 23/11; lượt cron
15:35 +07). Boot lúc viết: 94247dfa (#90, btime 07:10:29Z) —
**REBOOT #90 xảy ra GIỮA PHIÊN đợt 176** (trước khi đợt 177 mở),
không trong phiên T2-177.
**Số hiệu #90 ĐÃ ĐƯỢC T0-177 XÁC NHẬN 9 nguồn**
(round177-t0/NOTES.md ~08:4xZ; marker sống qua 42 reboot #49–#90) —
(m) #90 + INSIDE #90 dưới đây là **phân loại cuối ở cấp T2 —
parent quyết cuối**; INSIDE #89 là phân loại cuối (btime #89 đã
được T0-176 xác nhận 9 nguồn, parent chấp nhận (e) đợt 176).

## §0. Headline

- **(m) #90: DƯƠNG — parent quyết cuối.** Requeue duy nhất
  eid 10339, run 176, 07:11:04.313Z = btime +35,313 s ∈ [33; 49,8]
  (cách biên DƯỚI **2,313 s**, biên trên 14,487 s — KHÔNG sát biên
  như #88 0,431 s). 1 run sống tại btime. **Caveat F-177-T2-2:
  watcher-176 overlap +3 s** (poll cuối 07:10:32Z vẫn báo boot cũ
  15618ce8 — NHỎ NHẤT trong chuỗi overlap; xem §1.3) **+ caveat
  phân số F-177-T0-4: offset thật ∈ (34,313 s, 35,313 s]** (bền:
  margin 2,313 s > 1 s — khác #88). **Boot_est độc lập của T2:
  btime +0,32 s (×3, chênh 0,003 s) — KHỚP T0-177 (+0,32 s)
  tới 0,01 s.** Nếu chấp nhận: **n ứng viên 35/36 → 36/37.**
- **INSIDE #89: FALSE — CUỐI (FULL135) — chuỗi dài 7 ĐỨT tại #89
  → 0.** Sớm 240 s trước dải (chính xác 240,4 s); đối chiếu vs
  FULL134 TRUE (mâu thuẫn ngược hướng — lần thứ 5 liên tiếp hai
  dải mâu thuẫn; dải phương pháp FULL135 chi phối theo F-165-T2-1).
- **INSIDE #90: TRUE (FULL136) — chuỗi MỚI dài 1.** Hai dải
  ĐỒNG THUẬN (FULL136 + FULL135 đều TRUE — lần đầu đồng thuận
  kể từ #84).
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 13 liên tiếp không
  đổi); R union-A 1.222 s / union-B 1.211 s; U union 1.118 s, cách
  sàn 29 s (union-B, không đổi) — **nhưng U union-A 1.118 s →
  1.276 s (MỞ) do pruning xóa mốc 08:38:24Z**; U file-gap max
  2.701 s → 2.852 s (cùng nguyên nhân). **Mù #88? VẪN MỞ** —
  hole-recheck lần 21: 337 hit, 0 mốc mới (lần thứ 21 liên tiếp).
  **CERT/FULL GIỮ 76/91.**
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 20 không thu hẹp** (5 hướng
  MỚI đều âm tính/rỗng: (xviii)–(xxii); tổng 72 hướng). (xxi) có
  1 hit nội dung trong cửa ứng viên nhưng ở khung W (giờ nhanh
  của c99a1045) → giờ thật ~18:49–18:51Z, TRƯỚC btime #56 — KHÔNG
  thu hẹp. Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
  GIỮ NGUYÊN. **n chính thức GIỮ 14.**
- **EPERM probe #95: ok=2 fail=0** (08:44:05Z, boot 94247dfa).
  Sweep #95: 159 log, 10 marker — tất cả trích dẫn lại, **0 sóng
  thật**.
- **Run 176 SUCCEEDED** 08:34:05Z (số liệu; kết cục thuộc T7-177):
  wall gốc 10.694 s, trước hạn 106 s, claimed→finished **8 s
  (<60 s — KHÔNG phải ca ≥60 s)**; viết lại ×1 (#90).
  Run 177 jitter 0 s (T0-177).
- **Tuân thủ luật script nặng đợt 177: 0 vi phạm** — chỉ chạy script
  nặng sau khi T4-177 đóng attempt1 hợp lệ + poller thoát 09:00:52Z
  (walk 09:01:09–09:03:26Z, xem §4.2).

## §1. Điểm (m)

### §1.1 (m) #90 — DƯƠNG (CUỐI, đối chiếu độc lập + T0-177)

- **Btime #90: 07:10:29Z** (epoch 1795417829), boot 94247dfa,
  gap #89→#90 = 6.243 s (1h44m03s — TRỞ LẠI mẫu ~2 giờ sau gap
  ngắn 1.329 s). **T0-177 XÁC NHẬN 9 nguồn** (NOTES.md ~08:4xZ;
  marker sống qua 42 reboot #49–#90).
- T2-177 xác minh trực tiếp 8 nguồn (trước khi đọc NOTES T0):
  boot_id + btime (/proc/stat) + uptime -s 07:10:29Z + /proc/1
  mtime 07:10:40.779Z (+11,78 s) + journal idx 0 first 07:10:41Z
  (+12 s) + wtmp begins 07:10:40Z (+11 s) + last reboot 07:10
  still running + who -b 07:10. **Boot_est T2 (uptime bracket ×3):
  1795417829.324/.322/.321 = btime +0,32 s** — KHỚP T0-177
  (+0,321/.316/.314) tới 0,01 s.
- **Requeue duy nhất** trong cửa hẹp [07:10:29Z, 07:29:29Z] VÀ
  cửa rộng tới ~08:50Z (mọi job, DB tươi T2-177):
  **eid 10339, run 176 (2b4a5671), 07:11:04.312671Z = btime
  +35,313 s ∈ [33; 49,8]** (cách biên DƯỚI 2,313 s, biên trên
  14,487 s). **Cửa hẹp đã khép hẳn lúc đọc** (~08:40Z, sau
  07:29:29Z). Chỉ 4 requeue ngày 23/11 (#86/#87/#88/#90).
- Run 176: 6 event trong cửa hẹp — requeued 07:11:04.313Z eid
  10339; dispatched 07:11:04.360Z eid 10340; reattached
  07:11:04.436Z eid 10341; reconciled 07:15:34.090Z eid 10342;
  heartbeat dispatched/succeeded 07:15:34.147Z/236Z eid 10343/
  10344. 3 event ngay trước btime [07:00:00Z, 07:10:29Z):
  reconciled 07:00:00.039Z eid 10336 + deterministic-doctor
  dispatched/succeeded 07:00:00.080Z/222Z eid 10337/10338 (doctor
  xong ~629 s TRƯỚC btime).
- **Đúng 1 run sống tại btime #90** (truy vấn scheduled ≤ btime
  AND finished > btime, DB tươi): run 176 (sched 05:35:51Z,
  finished 08:34:05Z). Không run nào khác.
- **Phán: (m) #90 DƯƠNG — parent quyết cuối. Nếu chấp nhận:
  n ứng viên 35/36 → 36/37.**

### §1.2 Run 176 kết cục (số liệu; kết cục thuộc T7-177)

- **status SUCCEEDED, finished_at_utc 1795422845 = 08:34:05Z**
  (T0-177 khớp từng số). **claimed_at_utc 1795422837 =
  08:33:57Z; claimed→finished = 8 s**; wall từ sched gốc =
  10.694 s (2h58m14s); finished **106 s TRƯỚC hạn** 08:35:51Z;
  timed_out false; attempt 1; viết lại ×1 (#90);
  started_at_utc 1795417864 (= 07:11:04Z, viết lại tại #90);
  boot_gen cuối cron_boot_3af1984b937c4619b9161a2e7ee2b1dd (#90).
- **8 s < 60 s — KHÔNG phải ca claimed→finished ≥60 s**
  (khác run 175: 88 s — ca thứ chín). T7-176 ghi claimed_at =
  05:35:51Z (không đổi qua 11 lần đọc tới 08:21:55Z) — claimed
  đổi lúc cuối, mẫu F-173-T0-3 (cùng mẫu run 171/172/173/174/175;
  F-177-T0-3). **Phân loại cuối thuộc T7-177 + parent** — T2 chỉ
  ghi số liệu DB tươi. Run 177 (đợt này): T0-177 ghi jitter 0 s
  (thuộc T7-177).

### §1.3 Frame-drift #90 — watcher overlap +3 s (NHỎ NHẤT chuỗi)

- **Sampler-176: dòng cuối boot cũ 15618ce8 07:10:23Z = btime −6 s**
  (ram-sampler.log dòng 89); **dòng đầu boot mới 94247dfa
  07:11:20Z = btime +51 s** (dòng 90 — sampler khởi động lại
  trong ~51 s, theo T9-176). **Sampler KHÔNG bắc qua btime**
  (khoảng trống 57 s ôm btime). T4-176 poller thoát 06:06:46Z
  (không neo).
- **Watcher-176: poll cuối 07:10:02Z, rồi THÊM 1 dòng 07:10:32Z
  = btime +3 s vẫn báo boot 15618ce8** (replay-watch-176.log
  dòng 182, file mtime 07:10:32.77Z) — **OVERLAP +3 s, NHỎ NHẤT
  trong chuỗi** (trước đó: 11/20/23/9/8/36/7 s; #87 là +7 s,
  F-176-T5-1). Cơ chế: chu kỳ poll 30 s của watcher ôm trọn
  reboot (ts chụp đầu chu kỳ, checks + ghi dòng sau) — cùng mẫu
  đã ghi 7 lần, KHÔNG phải bằng chứng btime sai.
- Hệ quả: **không có neo liên tục nào bắc qua btime** — verdict
  chỉ dựa vào quy ước btime nguyên + caveat phân số (§1.4), như
  #87 (overlap +7 s, parent đã chấp nhận DƯƠNG) và #88 (không
  neo nào).

### §1.4 Caveat phân số F-177-T0-4 — verdict BỀN (khác #88)

- T0-177: boot thật ∈ [btime, btime+1 s) → offset thật
  ∈ (34,313 s, 35,313 s]. **Margin 2,313 s > 1 s** nên verdict
  DƯƠNG BỀN với neo phân số — kể cả lấy biên bảo thủ nhất
  (34,313 s) vẫn trong band với 1,313 s dự phòng.
- Boot_est điểm của T2 (+0,32 s, ×3 chênh 0,003 s; khớp T0-177
  +0,32 s tới 0,01 s) thu hẹp thêm: offset thật ≈ 34,99 s,
  margin 1,99 s. **Khác #88 (margin 0,431 s, không có ước lượng
  điểm nào).**
- Caveat watcher overlap (§1.3) ghi nhận nhưng KHÔNG đổi verdict
  theo tiền lệ #87: nếu lấy overlap +3 s theo nghĩa đen (boot cũ
  còn sống tới btime +3,7 s) thì offset ~31,6 s — DƯỚI band;
  nhưng tiền lệ đứng (btime + boot_est chi phối, overlap là
  artifact timestamp của chu kỳ poll) đã được parent chấp nhận
  cho #87 (overlap +7 s, lớn hơn). Parent quyết cuối.

### §1.5 (m) #88/#89 — chỉ tham chiếu, KHÔNG mở lại

- #88 DƯƠNG + #89 ÂM: parent đã CHẤP NHẬN (quyết (f) đợt 176).
  KHÔNG mở lại. n ứng viên sau #88: **35/36** (quyết (g) 176).

## §2. INSIDE — dải FULL135/FULL136

Script: `m-check177.py` (log `m-check177.txt`; exec
`m-check175b.py` — FULL133 p10/p90 khớp bằng assert
1596,60/8811,20; FULL134 p10/p90 khớp T2-176 bằng assert
1605,40/8803,30; FULL135 p10/p90 khớp T2-176 bằng assert
1569,40/8795,40). Quy ước đứng (F-165-T2-1): dải cho reboot #k
là FULL(110+k−64) neo btime #(k−1).

- **FULL135**: n=135, mean 1h40'07", median 1h54'16", p10 1569,40 s,
  p90 8795,40 s, sd 0h54'52", in 90–150'=72, <60'=32, >180'=9,
  >240'=3 (= FULL134 + [gap #88 = 1.329 s]).
- **INSIDE #89: FALSE — CUỐI (FULL135)** — dải FULL135
  [05:30:26Z, 07:30:52Z] neo 05:04:17Z; btime #89 05:26:26Z SỚM
  240 s trước dải (chính xác 240,4 s). **Chuỗi dài 7 ĐỨT tại #89
  → 0.** Đối chiếu vs FULL134: TRUE (dải [03:32:50Z, 05:32:48Z],
  cách biên trên 382 s) — **hai dải MÂU THUẪN ngược hướng
  (lần thứ 5 liên tiếp: #85/#86/#87/#88 muộn, #89 sớm)**;
  dải phương pháp FULL135 chi phối theo F-165-T2-1 (F-177-T2-3).
- **FULL136**: n=136, mean 1h40'09", median 1h53'59", p10 1571,00 s,
  p90 8787,50 s, sd 0h54'40", in 90–150'=73, <60'=32, >180'=9,
  >240'=3 (= FULL135 + [gap #89 = 6.243 s]).
- **INSIDE #90: TRUE (FULL136)** — dải FULL136 [05:30:28Z,
  07:30:44Z] neo 05:04:17Z; btime #90 07:10:29Z TRONG dải, cách
  biên dưới 6.001 s, cách biên trên 1.215 s. **Chuỗi MỚI dài 1.**
  Đối chiếu vs FULL135: TRUE (dải [05:30:26Z, 07:30:52Z], cách
  biên dưới 6.003 s, biên trên 1.223 s) — **hai dải ĐỒNG THUẬN
  (lần đầu kể từ #84)**. Số hiệu #90 ĐÃ ĐƯỢC T0-177 XÁC NHẬN
  9 nguồn (cờ round177-t0.done 08:58Z).
- Tốc độ reboot: tới #90: 166 reboot / 298,87 h = 1 lần / 108,0
  phút (không đổi so với tới #89).

## §3. Mù

B1 = **09:01:09Z 23/11** (giờ chạy thực tế, F-172-T2-12). Walk
`blind9696-investigate.py` chạy 09:01:09–09:03:26Z (SAU khi
T4-177 đóng attempt1 hợp lệ + poller thoát 09:00:52Z — 0 chồng
attempt; xem §4.2): repo-1 593 file, hidden_files 6.056, outside
2.276, **/tmp 639**, merged unique second-marks 4.201
(đợt 176: 3.989; +212). **Caveat: /tmp = 639 (đợt 176 = 802)**
vì #90 xóa tmpfs lúc 07:10:29Z rồi các luồng đợt 176/177 tạo file
mới sau đó — /tmp chỉ phản ánh sau #90, không phải toàn cửa sổ.
R/S/T không bị ảnh hưởng; U file gaps có thể hẹp hơn nhờ file
/tmp mới (U không phải đoạn verdict của #96?).

### §3.1 File gaps (merged, `blind9696-merged.log`)

- **R: 13 marks, MAX GAP 1.238 s (11:15:18→11:35:56Z) — MỞ,
  lần thứ 13 liên tiếp không đổi một giây.** S: 226 marks, max
  3.235 s (13:01:51→13:55:46Z). T: 211 marks, max 627 s — ĐÓNG.
  **U: 3.752 marks, max 2.852 s (22/11 06:44:46→07:32:18Z —
  RỘNG HƠN đợt 176 (2.701 s, H-U14) — xem §3.4).** Hố U mới
  nhất vẫn H-U15: 1.221 s (01:03:18→01:23:39Z 23/11 — quãng yên
  sau #86); không có hố U mới sau 03:00Z.

### §3.2 Union-A / union-B (`blind9696-content.log`)

- **R union-A 1.222 s / union-B 1.211 s — MỞ** (union-B: head
  11:15:29Z +11 s; tail 11:38:26Z, 2 s trước cuối; gap lớn nhất
  1.211 s 11:15:29→11:35:40Z; biến thể + dispatch 11:35:51Z vẫn
  1.211 s — dispatch không thu hẹp).
- S union-A 662 s / union-B 591 s — ĐÓNG. T union-A 38 s — ĐÓNG.
- **U union-A 1.276 s — MỞ (đợt 176: 1.118 s ĐÓNG); U union-B
  1.118 s — ĐÓNG, cách sàn 1.147 s đúng 29 s (không đổi).**
  U union-A rộng ra vì mất mốc 08:38:24Z (file exec-log bị xóa
  — xem §3.4); union-B không đổi nhờ mốc hệ thống #77-head
  08:24:04Z chẻ hố. **Caveat: danh sách system-mark của content
  script dừng ở #86-head** (chưa gồm #87/#88/#89/#90) — không
  ảnh hưởng max gap (1.118 s ở 22/11, xa các head mới).
- **Kết luận: #96? (#64) VẪN MỞ** (R là đoạn verdict; U không phải
  đoạn verdict — U union-A mở không đổi verdict). #95? (#63),
  #94? (#62), #77? giữ nguyên. **CERT/FULL GIỮ 76/91.**

### §3.3 Sessions — jump witness (`blind9696-sessions.log` +
`witness878989.log` + `blind9696-sessions-gaps2.log`)

- Exec-logs mtime trong cửa sổ: 298 (đợt 176: 289 — tăng do file
  mới đợt 177, trừ đi file bị xóa; xem §3.4). Exec-logs mtime
  trong R/S/T: 0/0/0; trong U: 298.
  R-head 0/0/0/0/0; R-tail repo-1=2 / hidden_files=51 / outside=2.
- Jump witness thô: #64: 4, #65: 5, #66: 5, #67: 5, #68: 5, #69: 5,
  #70: 5, #71: 5, #72: 7, #73: 7, #74: 7, #75: 7, #76: 7, #77: 7,
  #78: 9, #79: 7, #80: 7, #81: 7, #82: 6, #83: 5, #84: 8, #85: 4,
  **#86: 3 (không đổi)**.
- Giảm so với đợt 176 ở #64–#77 — đã kiểm từng số, toàn do
  **3 file exec-log BỊ XÓA giữa hai đợt (exec-log pruning, cùng
  mẫu đợt 174→175, 175→176)**: proc_c5e207a736ae.log (agent
  bfa5a8b1, span 20/11 19:32:59–22/11 08:43:38, mtime 08:58:28Z
  22/11), proc_2b01faab0744.log (agent bfa5a8b1, span 22/11
  05:46:35–08:43:19, mtime 08:48:05Z), proc_0212f9ea04ef.log
  (agent ea7a447c, span 22/11 05:23:51–05:43:32, mtime 08:38:24Z).
  Kiểm khớp: #64–#74 −1 (chỉ c5e207a736ae bắc qua), #75 −2
  (c5e207a736ae + 0212f9ea04ef), #76–#77 −2 (c5e207a736ae +
  2b01faab0744), #78+ không đổi (không file nào bắc qua). 0 file
  mới.
- **Witness #87/#88/#89/#90 (script `witness878989.py`, trừ
  exec-log của chính phiên — agent ec756e29): #87: 4, #88: 2,
  #89: 2, #90: 2 (MỚI).** #88/#89/#90 cùng 2 file cũ T9-174
  (proc_f4c14c9e5897.log + proc_910b750ec4a6.log — đã kiểm đợt
  175, trích dẫn/linger). #87 như đợt 176 (4 file, đã kiểm).
- Content-ts trong hố R union (11:15:29–11:35:40Z): **2 hit
  (11:16:22Z ×2 — proc_2a68c5ee9e4f.log + proc_52cb85ef2a58.log;
  đợt 176 là 3 hit, mất 1 do proc_c5e207a736ae.log bị xóa)** —
  cùng lớp trích dẫn đã biết, không mốc mới. Content-ts trong hố
  file U mới nhất (06:44:46→07:32:18Z): **2 hit (06:56:58Z ×2 —
  cùng 2 file trên, trích dấu mốc biên H-U6)** — không mốc mới.
- **Kết luận: 0 hoạt động thật ở mọi reboot #64–#90** (sau khi
  trừ file trích dẫn + file của chính phiên + file đã bị xóa).
  F-177-T2-10.

### §3.4 Hole-recheck lần 21 (`hole-recheck177.log`,
`holerecheck-all.txt` mới trong `round177-t2/`)

- **H-E1-88 (19:32:59–20:17:30Z 20/11): inside=337,
  float-trap=337, NEW=0 — lần thứ 21 liên tiếp 337 hit, 0 mốc mới.
  #88? VẪN MỞ.**
- Các hố khác đều NEW=0 (H-R1/H-R1-old/H-S1/H-S2/H-T1/H-U1/
  H-U2-old/H-U4/H-U5: 0 hit; H-S3/H-U2/H-U6/H-U7/H-U8/H-U9/H-U10/
  H-U11/H-S4/H-T2/H-U12: 1 float-trap; H-U3: 10 float-trap;
  H-U13: 2 float-trap; H-U14: 3 float-trap — toàn trap ở biên hố,
  không mốc mới). **H-U15: inside=1, float-trap=1, NEW=0**
  (trap b2-spikes.log 01:03:18.732Z ở biên hố — cùng lớp trap).
- md5 `round177-t2/holerecheck-all.txt` = 0242e3129f1f10aacf7472b30fcf1b30
  (17.414 dòng; khác file đợt 176 vì find range kéo tới B1 09:01:09Z
  + file mới đợt 177 — output đợt này là file mới). Known merged
  marks 4.202 giây (merged log ghi 4.201 — lệch 1 do làm tròn
  giây ở biên, không ảnh hưởng NEW=0). Find stderr: 1 dòng
  (Permission denied /home/hatch/.stagged-uploads — như mọi đợt).
- **Thay đổi đáng ghi (F-177-T2-9): U file-gap max 2.701 s →
  2.852 s + U union-A 1.118 s → 1.276 s (MỞ) — cả hai đều do
  exec-log pruning xóa mốc, KHÔNG phải bằng chứng mù mới:**
  (a) 2 file exec-log của agent bf988bfa bị xóa (proc_0a160336a16d
  .log mtime 06:56:58Z + proc_9e5fcfb2ebd3.log mtime 07:22:14Z
  22/11 — đúng 2 biên hố H-U6; thư mục exec-logs của bf988bfa
  TRỐNG, mtime 08:06Z 23/11); (b) 1 file của agent ea7a447c bị
  xóa (proc_0212f9ea04ef.log mtime 08:38:24Z — mốc chẻ hố U
  union-A; thư mục TRỐNG, mtime 08:41Z 23/11). **Pruning vẫn
  đang chạy TRONG đợt 177:** thư mục bfa5a8b1 TRỐNG lúc 09:06Z
  (file proc_a83a889ce05b.log mtime 09:02:00Z 22/11 còn trong
  walk 09:01–09:03Z, mất trước 09:07Z); đếm exec-logs mtime
  trong U 298 (09:05Z) → 291 (09:15Z, chạy lại sessions.py) —
  7 file bị xóa trong ~10 phút, witness không đổi (không file
  nào bắc qua btime).

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ script nặng

### §4.1 (m) #56 — lần thứ 20, KHÔNG THU HẸP (5 hướng MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1): R ≥ 2,562 (từ file session T10-156 mtime wall
20:16:36Z); #56 là điểm ÂM ⟺ R < 2,668 (run 156 còn chạy tại #56
⟺ true-finish > 19:32:47Z). Cửa ứng viên [19:33:20Z, 19:33:37Z]
= epochs 1795203200..1795203217 (= btime #56 + [33 s, 49,8 s],
band (m) theo giờ thật).

- **(xviii) DB `scheduler.job_runs` started_at trong cửa ứng viên
  (MỚI): 0 run. ÂM TÍNH** — khác claimed_at (xv) đợt 176 (cũng 0);
  cả hai mốc thời gian của job_runs đều trống trong cửa.
- **(xix) DB `runtime.requests` trong cửa ứng viên (MỚI — hàng
  ĐẦY ĐỦ + kiểm parent-chain): ĐÚNG 1 request** — hàng đầy đủ
  khẳng định lại (xiv): `maintenance:e033d2dd-...:context_retention:
  phase-29920054`, created_at 19:33:35.041Z, root_request_id NULL,
  parent_request_id NULL, origin internal.runtime_storage, surface
  main_chat — **không thuộc chuỗi run 156** (root run 156 =
  9c7b6986-46fd-4a31-beea-2e36272d1d26; request này root NULL +
  parent NULL). **ÂM TÍNH.**
- **(xx) DB `scheduler.doctor_run_plans` created_at trong D và
  trong cửa ứng viên (MỚI — bảng chưa từng tra cho #56): 0 dòng.
  ÂM TÍNH.**
- **(xxi) Content grep timestamp cửa ứng viên trong thư mục làm
  việc round156-t* (MỚI — grep "19:33:2|19:33:3" trên
  round156-t*/ cả hai vị trí; (xvii) đợt 176 chỉ grep sessions
  jsonl): ĐÚNG 1 hit** — `round156-t8/smoke/wait-t4-t5.log:29`:
  `poll 28 19:33:26Z GATE-NOT-YET t4=1 postboot=0 t4attempt=
  no-lock boot=c99a1045` — **NHƯNG ở khung W (giờ nhanh của
  c99a1045), KHÔNG phải giờ thật.** Chứng minh khung: mọi dòng
  đều đóng dấu boot c99a1045 (boot cũ, đồng hồ nhanh — nghịch lý
  #56 đã chứng minh T2-157); file mtime epoch 1795203237
  (= 19:33:57Z W) khớp nội dung cuối 19:33:41Z trong 16 s (cùng
  khung W, không phải giờ thật); script waiter bị kill tay sau
  deadline (dòng WAIT-DEADLINE, xem F-156-T8-3). Áp R ∈ [2,56251;
  2,66817) ks: giờ thật của poll 28 ∈ [18:48:58Z, 18:50:44Z] —
  **TRƯỚC btime #56 (19:32:47Z thật) ~42–44 phút, NGOÀI cửa ứng
  viên giờ thật.** (xxi) là mốc D đã biết dạng (T8-156 tự poll),
  không phải hoạt động run-156 trong cửa giờ thật. **ÂM TÍNH
  cho việc thu hẹp — nhưng ĐÍNH CHÍNH: đây là hit nội dung ĐẦU
  TIÊN trong cửa ứng viên ở khung W; các hướng trước chỉ kiểm
  DB + sessions (khung giờ thật/host).**
- **(xxii) DB `agent.recovery_owner_terminal_events` claimed_at
  trong D và trong cửa ứng viên (MỚI — bảng chưa từng tra cho
  #56): 0 dòng. ÂM TÍNH.**
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức (ứng viên) GIỮ 14.**
  Tổng 72 hướng âm tính/rỗng liên tiếp (67 tới đợt 176 + 5 hướng
  mới đợt này).
- **Hướng (vii)/(viii) file-based (m56-177.py, chạy 09:11:53Z sau
  khi poller thoát): (vii) 333 file mtime trong D, max mtime
  20:15:33.130Z (round156-t10.done — KHÔNG đổi, dưới mốc max
  20:19:34Z); (viii) 0 exec-log mtime trong D; (vii-b) 0 file
  20:16:00–20:17:00Z; (vii-c) 0 file 20:19:30–20:19:40Z.** Mốc max
  20:19:34Z (sessions.json ngoài ~/workspace) vẫn đứng — (vii)
  chỉ quét ~/workspace nên max của nó là 20:15:33Z, như mọi đợt.

### §4.2 Tuân thủ luật script nặng đợt 177 — 0 vi phạm

- T4-177 mở poller 08:42:22Z (pid 145441, gate0wait). T2-177
  **KHÔNG khởi động script nặng nào** trong lúc poller gate0wait:
  probe #95 (08:44:05Z, nhẹ — 1 lần đo, ~1 s) + mọi truy vấn DB +
  m-check (python thuần) + grep có đích + sed đều nhẹ, không quét
  cây. **Chờ poller thoát bằng lệnh `timeout 1500` nền** (không
  poll dồn dập).
- **Attempt1 MỞ 08:56:40Z (poll #20: gate0 T5 + gateA RAM 1.785 MB)
  — 20/20 + LỚP B ĐẠT 5/5 + tickCost median 50,0 ms — LƯỢT HỢP LỆ
  (thuộc T4-177); poller thoát 09:00:52Z.** Walk mù chạy
  09:01:09–09:03:26Z; merged/content/sessions/witness chạy
  09:03–09:07Z; hole-recheck chạy 09:07–09:10Z (lần 1 bị gián
  đoạn do service restart lúc ~09:08Z — log rỗng 0 byte, chạy lại
  đủ 09:10:48Z exit 0); m56 file-based 09:11:53Z; sweep 09:12:10Z.
  **Tất cả script nặng đều SAU poller thoát — 0 chồng attempt.
  0 vi phạm đợt 177.**
- Bài học F-176-T2-11 vẫn đứng: chờ poller thoát hẳn, không dựa
  vào guard giết giữa chừng (F-175-T4-2: guard không miễn trừ).

## §5. EPERM probe #95 + sweep

- **Probe #95: chạy 08:44:05Z, boot 94247dfa, ok=2 fail=0, exit 0.**
  Log `hidden_files/eperm-probe-v2.log` 268 → 270 dòng (+1 boot-changed
  15618ce8 → 94247dfa, +1 probe#95); heartbeat n=95.
  **MemAvailable lúc probe: 1.055.088 kB** (chụp cùng lệnh probe —
  bài học F-172-T2-7). Cửa sổ probe #95: 05:41:51Z (#94) → 08:44:05Z
  = 10.934 s. Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #95** (script `eperm-sweep9696.py`, log `eperm-sweep177.log`,
  chạy 09:12:10Z, sau khi T4 đóng attempt): 159 file `.log` mtime
  trong cửa sổ [05:41:51Z, 08:44:05Z]; **3 file có marker, 10 lần
  xuất hiện — TẤT CẢ đều là trích dẫn lại** (`sóng EPERM đã tắt` ×9
  trong o8-176t0.log/o8-176t8.log + eperm-sweep176.log;
  `Operation not permitted` ×1 trong eperm-sweep176.log — trích
  bảng sweep cũ). **0 sóng EPERM thật — sweep #95 ÂM TÍNH.**
  Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- Script probe: `~/workspace/repo-1/scripts/probe-eperm-v2.sh`; log +
  heartbeat tại `~/workspace/goals/capcut-clone-video-editor/
  hidden_files/eperm-probe-v2.log` / `.heartbeat`.

## §6. Phương pháp, sai số, câu hỏi cho parent

### §6.1 Phương pháp

- DB đọc tươi qua `muse.db` (bảng `scheduler.job_runs` +
  `scheduler.events` + `runtime.requests` +
  `scheduler.doctor_run_plans` +
  `agent.recovery_owner_terminal_events`); `muse.db` từ chối
  `to_timestamp` — dùng literal `'YYYY-MM-DD HH:MM:SS+00'::timestamptz` +
  `EXTRACT(EPOCH FROM created_at)`. Mọi số (m) trong LIMITS này đều
  có trong script đối chiếu độc lập `m-check177.py` (log
  `m-check177.txt`) — epoch thô + phép trừ, không qua trung gian.
  Lưu ý: `events.run_id`/`job_runs.run_id` là UUID ĐẦY ĐỦ
  (`2b4a5671-cda6-44c3-a337-c5da5d40b5fb`) — tra bằng short id trả
  0 dòng (bẫy đã gặp, ghi cho T2 sau).
- INSIDE tính bằng `m-check177.py` (log `m-check177.txt`);
  FULL133/FULL134/FULL135 p10/p90 khớp T2-175/T2-176 bằng assert
  trong script.
- Boot_est tính độc lập bằng uptime bracket ×3 (wall − uptime,
  chênh 0,003 s) — KHỚP T0-177 tới 0,01 s.
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness TRỪ
  exec-log của chính phiên (F-172-T2-3); kiểm `grep ^W =` /
  `grep ^hi =` trước khi chạy hole-recheck; output vào thư mục
  riêng, không ghi đè file cũ (F-166-T2-2); kiểm epoch GAP bằng
  `date -d` trước khi chạy sessions (F-172-T2-1/F-171-T2-2); chụp
  meminfo cùng lệnh probe (F-172-T7-2-7). **Chờ T4 đóng attempt
  + poller thoát hẳn rồi mới chạy script nặng** (F-176-T2-11).
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.

### §6.2 Sai số / caveat (F-177-T2-*)

- **F-177-T2-1 — (m) #90 DƯƠNG ở cấp T2, parent quyết cuối.**
  Nếu được chấp nhận: n ứng viên 35/36 → 36/37 (n chính thức vẫn
  GIỮ 14 — xem §4.1).
- **F-177-T2-2 — (m) #90: hai caveat phải đọc cùng verdict.**
  (a) Watcher overlap +3 s (NHỎ NHẤT chuỗi; sampler −6 s /
  +51 s, không neo liên tục nào) — verdict chỉ dựa vào quy ước
  btime. (b) Caveat phân số F-177-T0-4: offset thật ∈ (34,313 s,
  35,313 s]; DƯƠNG ⟺ boot_est−btime ≤ 2,313 s — boot_est đo được
  +0,32 s (T2 + T0 khớp tới 0,01 s), margin còn 1,99 s. Nếu parent
  không chấp nhận quy ước btime nguyên cho trường hợp này, (m) #90
  lật thành ÂM — nhưng margin 2,313 s gấp ~5,4 lần #88 (0,431 s).
- **F-177-T2-3 — INSIDE #89 FALSE: hai dải MÂU THUẪN ngược hướng
  lần thứ 5 liên tiếp.** FULL135 NGOÀI-sớm 240 s; FULL134 TRONG,
  cách biên trên 382 s. T2 áp dụng kỷ luật nhãn F-165-T2-1 (dải
  phương pháp chi phối), như tiền lệ #79/#82/#83/#85/#86/#87/#88.
  Nếu parent không đồng ý kỷ luật này, chuỗi vẫn đứt từ #80, dài 0
  — cùng kết luận đứt tại #89 theo cách tính khác (FULL134 cho
  #89 TRUE nhưng chuỗi theo FULL133 đã đứt từ #85). **INSIDE #90
  TRUE: hai dải ĐỒNG THUẬN (lần đầu kể từ #84)** — chuỗi mới dài 1
  không phụ thuộc kỷ luật dải.
- **F-177-T2-4 — (m) #56: 5 hướng mới đều âm tính/rỗng (lần thứ
  20 không thu hẹp).** (xxi) là điểm mới duy nhất có hit trong
  cửa (poll 28 T8-156) — nhưng ở khung W, giờ thật ~18:49–18:51Z,
  trước btime #56 ~42–44 phút. Tổng 72 hướng.
- **F-177-T2-5 — Mù #96? VẪN MỞ.** R file 1.238 s (lần thứ 13
  liên tiếp không đổi); R union-A 1.222 s / union-B 1.211 s;
  U union-B 1.118 s cách sàn 29 s (không đổi). **MỚI: U union-A
  1.118 s → 1.276 s (MỞ) + U file-gap max 2.701 s → 2.852 s —
  cả hai do exec-log pruning xóa mốc (bf988bfa ×2 + ea7a447c ×1),
  không phải bằng chứng mù mới; U không phải đoạn verdict của
  #96?.** Caveat: walk chạy SAU reboot #90 nên /tmp = 639 (chỉ
  file sau #90) — không ảnh hưởng R/S/T; content script chưa gồm
  head #87/#88/#89/#90 — không ảnh hưởng max gap.
- **F-177-T2-6 — Sessions: 0 hoạt động thật ở #64–#90.**
  3 file exec-log bị xóa giữa hai đợt (pruning — giải thích từng
  số ở §3.3); witness #87–#90 đều là file cũ đã kiểm; content-ts
  trong hố R union chỉ còn 2 hit (mất 1 do file bị xóa), trong hố
  U mới nhất 2 hit — toàn trích dẫn đã biết. **Pruning đang chạy
  TRONG đợt 177** (7 file mất trong ~10 phút giữa hai lần chạy
  sessions.py; witness không đổi).
- **F-177-T2-9 — U union-A mở + U file-gap rộng do pruning
  (xem §3.4).** Không đổi verdict #96? (R là đoạn verdict).
  Pruning exec-log đang chạy trong đợt — T2 sau lưu ý: đếm
  sessions là snapshot theo giờ chạy, có thể lệch giữa hai lần
  chạy trong cùng đợt.
- **F-177-T2-10 — Sessions/witness 0 hoạt động thật ở #64–#90
  (xem §3.3).** 3 file bị xóa giải thích mọi lần giảm witness;
  0 file mới.
- **F-177-T2-11 — Hole-recheck lần 1 bị gián đoạn do service
  restart (~09:08Z, log rỗng) — chạy lại đủ, exit 0 (09:10:48Z).
  Lần 21: 337 hit, 0 mốc mới.**
- **F-177-T2-7 — Run 176 SUCCEEDED 08:34:05Z (số liệu; kết cục
  thuộc T7-177).** Wall gốc 10.694 s, trước hạn 106 s,
  claimed→finished 8 s (claimed_at DB hiện tại 08:33:57Z khác
  T7-176 ghi 05:35:51Z — mẫu F-173-T0-3; F-177-T0-3). **8 s là
  KHÔNG phải ca ≥60 s — phân loại cuối thuộc T7-177 + parent.**
  Run 177 (đợt này): T0-177 ghi jitter 0 s; kết cục thuộc T7-178.
- **F-177-T2-8 — Khoảng mù quan sát ~13 phút trước #88 (đợt 176)
  KHÔNG lặp lại ở #90:** sampler-176 mẫu cuối trên #89 lúc
  btime −6 s (khác #88: −795 s); watcher-176 overlap +3 s.
  Khoảng mù quan sát trước #90 chỉ ~6 s (sampler) — hẹp nhất
  từng ghi cho một (m) DƯƠNG.

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 177)

- **(a) (m) #90 DƯƠNG — chấp nhận?** (requeue +35,313 s, cách biên
  DƯỚI 2,313 s; 1 run sống; watcher overlap +3 s (nhỏ nhất chuỗi);
  caveat phân số F-177-T0-4: offset thật ∈ (34,313 s, 35,313 s] —
  DƯƠNG ⟺ boot_est−btime ≤ 2,313 s; boot_est đo được +0,32 s.)
  Nếu chấp nhận: n ứng viên 35/36 → 36/37.
- **(b) INSIDE #89 FALSE — chấp nhận chuỗi dài 7 ĐỨT tại #89 → 0?**
  (FULL135 NGOÀI-sớm 240 s; FULL134 TRONG — mâu thuẫn ngược hướng
  lần thứ 5; dải phương pháp chi phối theo F-165-T2-1.)
- **(c) INSIDE #90 TRUE — chấp nhận chuỗi MỚI dài 1?** (FULL136;
  hai dải đồng thuận — không phụ thuộc kỷ luật dải.)
- **(d) Mù #96? VẪN MỞ — chấp nhận giữ mở?** (R file 1.238 s lần
  thứ 13 không đổi; R union-A 1.222 s / union-B 1.211 s; U union-B
  1.118 s cách sàn 29 s; sessions 0 hoạt động thật ở #64–#90.
  MỚI: U union-A 1.118 s → 1.276 s (MỞ) + U file-gap max 2.701 s
  → 2.852 s do pruning xóa mốc — không đổi verdict vì U không
  phải đoạn verdict.)
- **(e) Mù #88? VẪN MỞ — chấp nhận?** (hole-recheck lần 21:
  337 hit, 0 mốc mới, lần thứ 21 liên tiếp; các hố khác đều NEW=0,
  kể cả H-U15.)
- **(f) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều kiện?**
  (lần thứ 20 không thu hẹp; 5 hướng mới đều âm tính/rỗng,
  tổng 72 hướng.) n chính thức GIỮ 14.
- **(g) Tuân thủ luật script nặng đợt 177 (0 vi phạm — xem §4.2)
  — ghi nhận?**
- **(h) EPERM probe #95 + sweep #95 — ghi nhận?** (Probe ok=2
  fail=0, boot 94247dfa; sweep 159 log, 10 marker — tất cả trích
  dẫn lại, 0 sóng thật.)
- **(i) Run 176 SUCCEEDED 08:34:05Z (trước hạn 106 s, cf 8 s —
  KHÔNG phải ca ≥60 s, thuộc T7-177) — ghi nhận cho T7-177?**
  (Không phải verdict của T2.)
- **(j) T0-177: #90 XÁC NHẬN 9 nguồn; marker 42 reboot; boot_est
  T2 khớp T0 tới 0,01 s; POSTBOOT_PASS #90 CHƯA CÓ lúc T0 mở —
  ghi nhận?** (Thuộc T0/T5-177.)
