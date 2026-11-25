# PHASE 9 — ROUND 176 — T2 EPERM LIMITS

**T2 đợt 176** — EPERM probe #94, phân loại (m) #88 **CUỐI** +
(m) #89 **ÂM**, INSIDE #88 TRUE (chuỗi 7) + #89 sơ bộ FALSE,
mù #96?/#88?/#94?/#95?/#77?, (m) #56 lần 19,
làm rõ mâu thuẫn F-175-T4-2.
Đợt 176 mở 05:35:51Z 23/11/2026 (12:35:51 +07 23/11; lượt cron
12:35 +07). Boot lúc viết: 15618ce8 (#89, btime 05:26:26Z) —
**REBOOT #89 xảy ra trong phiên T2** (phát hiện ~05:41Z).
**Số hiệu #87/#88/#89 ĐÃ ĐƯỢC T0-176 XÁC NHẬN 9 nguồn**
(round176-t0.done 05:51Z; marker sống qua 41 reboot #49–#89) —
(m) #88/#89 + INSIDE #88 dưới đây là **phân loại cuối ở cấp T2
— parent quyết cuối**; INSIDE #89 chỉ là sơ bộ (thuộc T2-177).

## §0. Headline

- **(m) #88: DƯƠNG — parent quyết cuối.** Requeue duy nhất
  eid 10309, run 175, 05:04:50.431Z = btime +33,431 s ∈ [33; 49,8]
  (cách biên DƯỚI **0,431 s — sát biên nhất từng ghi ở biên dưới**;
  cửa hẹp đã khép hẳn lúc đọc). 1 run sống tại btime. **Caveat
  F-176-T2-9: KHÔNG neo nào bắc qua btime** (sampler/watcher/T4
  đều chết/dừng trước #88); caveat phân số F-176-T0-4: offset thật
  ∈ (32,431 s, 33,431 s] — verdict DƯƠNG ⟺ boot_est−btime ≤ 0,431 s.
  **Nếu chấp nhận: n ứng viên 34/35 → 35/36.**
- **(m) #89: ÂM — parent quyết cuối.** 0 requeue trong cửa hẹp
  (đã khép); 0 run sống tại btime (run 175 xong 05:24:21Z, run 176
  lên lịch 05:35:51Z). Gap #88→#89 chỉ 1.329 s.
- **INSIDE #88: TRUE (FULL134) — chuỗi dài 7.** Hai dải MÂU THUẪN
  (FULL133 NGOÀI, muộn 5.749 s — lần thứ 4 liên tiếp); dải phương
  pháp FULL134 chi phối theo F-165-T2-1.
- **INSIDE #89 (sơ bộ): FALSE (FULL135)** — sớm 240 s trước dải;
  cross-check vs FULL134 TRUE (mâu thuẫn ngược hướng). Nếu chấp
  nhận: chuỗi 7 ĐỨT tại #89 → 0. Phân loại cuối thuộc T2-177.
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 12 liên tiếp không
  đổi); R union-A 1.222 s / union-B 1.211 s; U union 1.118 s, cách
  sàn 29 s. **Mù #88? VẪN MỞ** — hole-recheck lần 20: 337 hit,
  0 mốc mới (lần thứ 20 liên tiếp). Mù #95?/#94?/#77? giữ nguyên.
  **CERT/FULL GIỮ 76/91.**
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 19 không thu hẹp** (5 hướng
  MỚI đều âm tính/rỗng: events 0, requests 1 (maintenance, không
  thuộc run 156), claimed 0, journal rỗng, sessions-content 0
  trong cửa; tổng 67 hướng). Cửa R [2,56251; 2,66817) /
  J [2,566; 2,80753] s GIỮ NGUYÊN. **n chính thức GIỮ 14.**
- **F-175-T4-2 LÀM RÕ: CÓ VI PHẠM (nhẹ).** m56-175.py tồn tại
  ~2 s trong cửa sổ attempt1 (ps-before bắt được 4 process;
  guard giết 03:17:49Z; 0 s chồng với pass chạy; lớp B vẫn 5/5).
  "0 vi phạm" của T2-175 là SAI — guard chỉ giới hạn, không miễn
  trừ. Lượt yên #44 vẫn đứng.
- **EPERM probe #94: ok=2 fail=0** (05:41:51Z, boot 15618ce8).
  Sweep #94: 148 log, 12 marker — TẤT CẢ trích dẫn lại, **0 sóng
  thật**.
- **Run 175 SUCCEEDED** 05:24:21Z (số liệu; kết cục thuộc T7-176):
  wall gốc 10.410 s, trước hạn 690 s, claimed→finished **88 s
  (≥60 s — ứng viên ca thứ chín, thuộc T7-176 + parent)**;
  viết lại ×2 (#87 + #88).
- **Tuân thủ luật script nặng đợt 176: 0 vi phạm** — KHÔNG chạy
  script nặng nào trong lúc T4-176 gate0wait; chỉ chạy sau khi
  attempt2 đóng + poller thoát (06:06:46Z).

## §1. Điểm (m)

### §1.1 (m) #88 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #88: 05:04:17Z** (epoch 1795410257), boot 9131fbc6, gap
  #87→#88 = 7.092 s. **T0-176 XÁC NHẬN 9 nguồn** (round176-t0.done
  05:51Z; marker sống qua 41 reboot #49–#89).
- **Requeue duy nhất** trong cửa hẹp [05:04:17Z, 05:23:17Z] VÀ cửa
  mở rộng [05:04:17Z, ~05:42Z] (mọi job, DB tươi T2-176):
  **eid 10309, run 175 (f0ac7900), 05:04:50.431216Z = btime
  +33,431 s ∈ [33; 49,8]** (cách biên DƯỚI 0,431 s, biên trên
  16,369 s). **Cửa hẹp đã khép hẳn lúc đọc** (~05:42Z, sau
  05:23:17Z). Chỉ 3 requeue ngày 23/11 (#86/#87/#88).
- Run 175: 6 event trong cửa hẹp — requeued 05:04:50.431Z eid
  10309; dispatched 05:04:50.523Z eid 10310; reattached
  05:04:50.608Z eid 10311; reconciled 05:15:34.171Z eid 10312;
  heartbeat dispatched/succeeded 05:15:34.287Z/344Z eid 10313/
  10314. 3 event ngay trước btime [05:00:00Z, 05:04:17Z):
  reconciled 05:00:00.023Z eid 10306 + deterministic-doctor
  dispatched/succeeded 05:00:00.065Z/230Z eid 10307/10308 (doctor
  xong ~257 s TRƯỚC btime).
- **Đúng 1 run sống tại btime #88** (theo scheduled_for +
  finished): run 175 (sched 02:35:51Z, finished 05:24:21Z).
  Truy vấn theo claimed_at trả 0 dòng CHỈ VÌ claimed_at đã bị
  viết lại lúc cuối thành 05:22:53Z (cùng mẫu run 174 tại #86 —
  xem §1.2).
- **Phán: (m) #88 DƯƠNG — parent quyết cuối. Nếu chấp nhận:
  n ứng viên 34/35 → 35/36.**

### §1.2 Run 175 kết cục (số liệu; kết cục thuộc T7-176)

- **status SUCCEEDED, finished_at_utc 1795411461 = 05:24:21Z**
  (T0-176 khớp từng số). **claimed_at_utc 1795411373 =
  05:22:53Z; claimed→finished = 88 s**; wall từ sched gốc =
  10.410 s (2h53m30s); finished **690 s TRƯỚC hạn** 05:35:51Z;
  timed_out false; attempt 1; viết lại ×2 (#87 + #88);
  started_at_utc 1795410290 (= 05:04:50Z, viết lại tại #88);
  boot_gen cuối cron_boot_1f908a9c0e5d4246999b12c111eb419c (#88).
- **88 s ≥ 60 s — ỨNG VIÊN ca claimed→finished thứ chín** theo
  định nghĩa thống nhất parent đã chọn (quyết (p) đợt 174 — run
  172 = ca thứ tám). T7-175 ghi claimed_at = 1795401352
  (02:35:52Z, KHÔNG đổi qua 8 lần đọc tới ~05:05Z) — claimed đổi
  lúc cuối, mẫu F-173-T0-3 (cùng mẫu run 171/172/173/174;
  F-176-T0-3). **Phân loại cuối thuộc T7-176 + parent** — T2 chỉ
  ghi số liệu DB tươi. Run 176 (đợt này): T0-176 ghi jitter 0 s
  (thuộc T7-176).

### §1.3 Frame-drift #88 — KHÔNG CÓ NEO NÀO BẮC QUA BTIME

- **Sampler-175: dòng cuối ca31fac1 04:51:02Z = btime −795 s**
  (ram-sampler.log dòng 133). **Watcher-175: poll cuối 03:06:12Z
  = btime −11.825 s** (replay-watch-175.log dòng 57 — chết theo
  #87, không khởi động lại). **T4-poller: thoát 03:21:38Z**
  (không neo). **Tất cả vòng lặp nền T9-175 dừng ~04:51Z**
  (sampler 04:51:02Z, headroom probe-close 04:51:21Z, b2-spikes
  mtime 04:04:30Z) — **khoảng mù quan sát ~13 phút trước #88**
  (F-176-T2-8; giao T9-176 giải thích vì sao các vòng dừng
  04:51Z trong khi T9-175 đóng cờ 05:12Z).
- Hệ quả: **không có counterfactual neo nào** — verdict chỉ dựa
  vào quy ước btime nguyên + caveat phân số (§1.4). Khác #86/#87
  (cả hai đều có overlap sampler + watcher).

### §1.4 Caveat phân số F-176-T0-4 — hướng CHỐNG verdict

- T0-176 (XÁC NHẬN 9 nguồn): boot thật ∈ [btime, btime+1 s) →
  offset thật ∈ (32,431 s, 33,431 s]. **Không có ước lượng điểm
  boot_est cho #88** (boot đã qua, /proc/1 không còn — khác #89
  có boot_est +0,078 s). **Verdict DƯƠNG ⟺ boot_est−btime
  ≤ 0,431 s; nếu ≥ +0,5 s thì offset thật DƯỚI 33 s → verdict
  lật thành ÂM.** Ngược hướng #86 (phân số làm offset nhỏ đi
  nhưng vẫn trong dải, margin 1,279 s).
- Ghi rõ để parent cân: margin btime 0,431 s là SÁT BIÊN NHẤT
  từng ghi ở biên dưới (vượt #81 0,477 s) — và là lần đầu verdict
  DƯƠNG hoàn toàn không có neo overlap nào để đối chiếu. Tiền lệ
  chấp nhận: #81 (margin 0,477 s, estimator dưới dải) và #86
  (margin 0,382 s, estimator trong dải). #88 nằm giữa hai tiền lệ
  về margin, nhưng yếu hơn cả hai về bằng chứng neo.

### §1.5 (m) #89 — ÂM (CUỐI ở cấp T2, parent quyết cuối)

Reboot #89 xảy ra TRONG đợt 176 khi T2-176 đang hoạt động (phát
hiện ~05:41Z). Theo tiền lệ (T2-174 phân loại #84/#85, T2-175
phân loại #87 xảy ra trong đợt), T2-176 phân loại #89 ở cấp T2;
parent/T10 quyết cuối. **Số hiệu #89 ĐÃ ĐƯỢC T0-176 XÁC NHẬN
9 nguồn** (round176-t0.done 05:51Z; marker 41 reboot).

- **Btime #89: 05:26:26Z** (epoch 1795411586), boot
  15618ce8-2ec6-477e-b0b0-2f7e7c3ba4da, gap #88→#89 = 1.329 s
  (22m09s — lệch xa mẫu ~7 s). T2-176 xác minh trực tiếp 7 nguồn:
  boot_id + btime (/proc/stat) + uptime -s 05:26:26Z + /proc/1
  05:26:37.030Z (+11,03 s) + journal idx 0 first 05:26:37Z
  (+11 s) + wtmp begins 05:26:37Z (+11 s) + last reboot 05:26
  still running + who -b 05:26. T0-176: boot_est = btime +0,078 s.
- **0 requeue** trong cửa hẹp [05:26:26Z, 05:45:26Z] (đã khép lúc
  đọc cuối ~05:46Z) VÀ cửa rộng tới ~05:46Z: 5 event (reconciled
  + dispatched 05:35:51Z eid 10316/10317 run 2b4a5671 = run 176;
  reconciled + dispatched + succeeded 05:41:54Z eid 10318/10319/
  10320). 0 requeue kể từ 05:23:17Z.
- **0 run sống tại btime #89** (run 175 finished 05:24:21Z,
  run 176 scheduled 05:35:51Z) — không có run nào để requeue.
- **Phán: (m) #89 ÂM — parent quyết cuối.** n ứng viên không đổi
  vì #89 (chỉ đổi theo #88).

### §1.6 (m) #86/#87 — chỉ tham chiếu, KHÔNG mở lại

- #86/#87: parent đã CHẤP NHẬN DƯƠNG (quyết (f) đợt 175).
  KHÔNG mở lại.

## §2. INSIDE — dải FULL134/FULL135

Script: `m-check176.py` (log `m-check176.txt`; exec
`m-check175b.py` — FULL133 p10/p90 khớp bằng assert
1596,60/8811,20). Quy ước đứng (F-165-T2-1): dải cho reboot #k
là FULL(110+k−64) neo btime #(k−1).

- **FULL134**: n=134, mean 1h40'42", median 1h54'38", p10 1605,40 s,
  p90 8803,30 s, sd 0h54'39", in 90–150'=72, <60'=31, >180'=9,
  >240'=3 (= FULL133 + [gap #87 = 7.092 s]).
- **INSIDE #88: TRUE** — dải FULL134 [03:32:50Z, 05:32:48Z] neo
  03:06:05Z; btime #88 05:04:17Z TRONG dải, cách biên dưới 5.487 s,
  cách biên trên 1.711 s. **Chuỗi dài 7.** Đối chiếu vs FULL133
  còn hiệu lực: NGOÀI (muộn 5.749 s) — **hai dải MÂU THUẪN**
  (lần thứ 4 liên tiếp: #85 muộn 399 s, #86 muộn 5.595 s, #87
  muộn 5.970 s, #88 muộn 5.749 s); dải phương pháp FULL134 chi
  phối theo F-165-T2-1 (F-176-T2-3).
- **FULL135 (sơ bộ, cho #89)**: n=135, mean 1h40'07", median
  1h54'16", p10 1569,40 s, p90 8795,40 s, sd 0h54'52",
  in 90–150'=72, <60'=32, >180'=9, >240'=3 (= FULL134 +
  [gap #88 = 1.329 s]).
- **INSIDE #89 (sơ bộ): FALSE** — dải FULL135 [05:30:26Z,
  07:30:52Z] neo 05:04:17Z; btime #89 05:26:26Z SỚM 240 s trước
  dải. Đối chiếu vs FULL134: TRUE (dải [03:32:50Z, 05:32:48Z],
  cách biên trên 382 s) — **hai dải MÂU THUẪN ngược hướng**
  (dải mới nói NGOÀI-sớm, dải cũ nói TRONG). Nếu parent chấp
  nhận: **chuỗi dài 7 ĐỨT tại #89 → 0**. Phân loại cuối thuộc
  T2-177 + parent 177.
- Tốc độ reboot: tới #88: 164 reboot / 296,76 h = 1 lần / 108,6
  phút; tới #89: 165 reboot / 297,13 h = 1 lần / 108,0 phút.

## §3. Mù

B1 = **06:08:00Z 23/11** (giờ chạy thực tế, F-172-T2-12). Walk
`blind9696-investigate.py` chạy 06:08:20–~06:10:03Z (SAU khi
T4-176 đóng attempt2 + poller thoát 06:06:46Z — 0 chồng attempt;
xem §7): repo-1 462 file, hidden_files 5.604, outside 2.190,
**/tmp 802**, merged unique second-marks 3.989
(đợt 175: 3.656; +333). **Caveat: /tmp = 802 (khác đợt 175 = 0)**
vì #89 xóa tmpfs lúc 05:26:26Z rồi các luồng đợt 176 tạo file
mới sau đó — /tmp chỉ phản ánh sau #89, không phải toàn cửa sổ.
R/S/T không bị ảnh hưởng; U file gaps có thể hẹp hơn nhờ file
/tmp mới (U không phải đoạn verdict của #96?).

### §3.1 File gaps (merged, `blind9696-merged.log`)

- **R: 13 marks, MAX GAP 1.238 s (11:15:18→11:35:56Z) — MỞ,
  lần thứ 12 liên tiếp không đổi một giây.** S: 226 marks, max
  3.235 s (13:01:51→13:55:46Z). T: 211 marks, max 627 s — ĐÓNG.
  **U: 3.539 marks, max 2.701 s (22:06:28→22:51:29Z, H-U14 —
  không đổi so với đợt 175).** Hố U mới nhất vẫn H-U15: 1.221 s
  (01:03:18→01:23:39Z 23/11 — quãng yên sau #86); không có hố U
  mới sau 03:00Z.

### §3.2 Union-A / union-B (`blind9696-content.log`)

- **R union-A 1.222 s / union-B 1.211 s — MỞ** (union-B: head
  11:15:29Z +11 s; tail 11:38:26Z, 2 s trước cuối; gap lớn nhất
  1.211 s 11:15:29→11:35:40Z; biến thể + dispatch 11:35:51Z vẫn
  1.211 s — dispatch không thu hẹp).
- S union-A 662 s / union-B 591 s — ĐÓNG. T union-A 38 s — ĐÓNG.
- **U union-A 1.118 s / union-B 1.118 s — ĐÓNG, cách sàn 1.147 s
  đúng 29 s (không đổi).** Caveat: danh sách system-mark của
  content script dừng ở #86-head (chưa gồm #87/#88/#89) — không
  ảnh hưởng max gap (1.118 s ở 22/11, xa các head mới).
- **Kết luận: #96? (#64) VẪN MỞ** (R là đoạn verdict; U không phải
  đoạn verdict). #95? (#63), #94? (#62), #77? giữ nguyên.
  **CERT/FULL GIỮ 76/91.**

### §3.3 Sessions — jump witness (`blind9696-sessions.log` +
`witness878989.log`)

- Exec-logs mtime trong cửa sổ: 289 (đợt 175: 323 — giảm do 4 file
  bị xóa, xem dưới; chạy lại với gap args: 288 — 1 file đổi mtime
  giữa hai lần chạy, không ảnh hưởng witness). Exec-logs mtime
  trong R/S/T: 0/0/0; trong U: 289.
  R-head 0/0/0/0/0; R-tail repo-1=2 / hidden_files=51 / outside=2.
- Jump witness thô: #64: 5, #65: 6, #66: 6, #67: 6, #68: 6, #69: 6,
  #70: 6, #71: 6, #72: 8, #73: 8, #74: 8, #75: 9, #76: 9, #77: 9,
  #78: 9, #79: 7, #80: 7, #81: 7, #82: 6, #83: 5, #84: 8, #85: 4,
  **#86: 3 (không đổi)**.
- Giảm so với đợt 175 ở #64–#75 — đã kiểm từng số, toàn do
  **4 file exec-log BỊ XÓA giữa hai đợt (exec-log pruning, cùng
  mẫu đợt 174→175)**: proc_feb5e6bf35a2.log (agent 24b1c962, span
  19:04:44 20/11→06:06:02 22/11), proc_1c620b5730b5.log (agent
  a3752838, 22:05:25→04:18:06 22/11), proc_24fc370311e3.log
  (agent a3752838, 03:55:40→04:16:25 22/11),
  proc_baa572cf2e1d.log (agent a2cdd64e, 02:28:01→06:04:59
  22/11). Kiểm khớp: #74 −4 (cả 4 đều bắc qua 04:05:29Z), #75 −2
  (chỉ feb5e6bf35a2 + baa572cf2e1d bắc qua 05:32:46Z), #71–#73 −2,
  #64–#70 −1 (chỉ feb5e6bf35a2). 0 file mới.
- **Witness #87/#88/#89 (script mới `witness878989.py`, trừ
  exec-log của chính phiên — agent 48d7ba7d): #87: 4, #88: 2,
  #89: 2.** #88/#89 chỉ 2 file cũ T9-174 (proc_f4c14c9e5897.log +
  proc_910b750ec4a6.log — đã kiểm đợt 175, trích dẫn/linger).
  #87 thêm 2 file MỚI của T4-175 (agent eb668fcf), đã kiểm nội
  dung trực tiếp từng file: proc_cfe63df92cc7.log (699 B, poll
  03:16–03:17Z, span do trích btime #86 01:01:37Z) +
  proc_5c2dedefeeea.log (1.359 B, poll 03:31–03:33Z + trích cờ
  T4-175) — cả hai chỉ trích dẫn, phiên chạy HOÀN TOÀN sau #87.
- Content-ts trong hố R union (11:15:29–11:35:40Z): 3 hit
  (11:16:22Z ×3 — như đợt 173/174/175); trong hố file U H-U12
  (16:09:36–16:48:31Z): 3 hit tại 16:25:06Z (như đợt 175).
- **Kết luận: 0 hoạt động thật ở mọi reboot #64–#89** (sau khi
  trừ file trích dẫn + file của chính phiên + file đã bị xóa).
  F-176-T2-10.

### §3.4 Hole-recheck lần 20 (`hole-recheck176.log`,
`holerecheck-all.txt` mới trong `round176-t2/`)

- **H-E1-88 (19:32:59–20:17:30Z 20/11): inside=337,
  float-trap=337, NEW=0 — lần thứ 20 liên tiếp 337 hit, 0 mốc mới.
  #88? VẪN MỞ.**
- Các hố khác đều NEW=0 (H-R1/H-R1-old/H-S1/H-S2/H-T1/H-U1/
  H-U2-old/H-U4/H-U5: 0 hit; H-S3/H-U2/H-U6/H-U7/H-U8/H-U9/H-U10/
  H-U11/H-S4/H-T2/H-U12: 1 float-trap; H-U3: 10 float-trap;
  H-U13: 2 float-trap; H-U14: 3 float-trap — toàn trap ở biên hố,
  không mốc mới). **H-U15: inside=1, float-trap=1, NEW=0**
  (trap b2-spikes.log 01:03:18.732Z ở biên hố — cùng lớp trap).
- md5 `round176-t2/holerecheck-all.txt` = 83f20bee9fe596de6d0aa9e8397e5b73
  (16.366 dòng; khác file đợt 175 vì find range kéo tới B1 06:08:00Z
  + file mới đợt 176 — output đợt này là file mới).

## §4. Mô hình đồng hồ + (m) #56 + làm rõ F-175-T4-2

### §4.1 (m) #56 — lần thứ 19, KHÔNG THU HẸP (5 hướng MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1): R ≥ 2,562 (từ file session T10-156 mtime wall
20:16:36Z); #56 là điểm ÂM ⟺ R < 2,668 (run 156 còn chạy tại #56
⟺ true-finish > 19:32:47Z). Cửa ứng viên [19:33:20Z, 19:33:37Z]
= epochs 1795203200..1795203217.

- **(xiii) DB `scheduler.events` trong cửa ứng viên (MỚI —
  truy vấn trực tiếp bằng literal): 0 event. ÂM TÍNH** — khẳng
  định lại (iv) đợt 175.
- **(xiv) DB `runtime.requests` trong cửa ứng viên (MỚI): ĐÚNG
  1 request** — `maintenance:e033d2dd-59b9-46f1-ac13-c851d51657ac:
  context_retention:...:phase-29920054`, created_at
  19:33:35.041Z, root_request_id NULL, origin
  internal.runtime_storage — chính traffic maintenance e033d2dd
  đã phân loại ở (ii)/T2-173(i), KHÔNG thuộc chuỗi run 156
  (root của run 156 là run id 9c7b6986...). **ÂM TÍNH — nhưng
  ĐÍNH CHÍNH cách nói "TRỐNG" của (iv): cửa trống event + trống
  request run-156, KHÔNG trống mọi request.**
- **(xv) DB `scheduler.job_runs` claimed_at trong cửa ứng viên
  (MỚI): 0 run. ÂM TÍNH.**
- **(xvi) journalctl cửa ứng viên 20/11 (MỚI): "-- No entries --"**
  — journal chỉ giữ boot hiện tại (list-boots 1 boot); không có
  dữ liệu 20/11. RỖNG theo cấu trúc.
- **(xvii) Content grep sessions jsonl (MỚI — 1.252 file) cho
  "2026-11-20T19:33:": 52 hit, 0 event có `created_at` trong
  cửa.** Gần nhất: 1 commentary_text created_at 19:33:10.728Z
  (về waiter T4-156, poll 27 lúc 19:32:26Z — agent ad69c371) —
  TRƯỚC cửa 10 s, không thu hẹp. Các hit còn lại toàn trích dẫn:
  bounds cửa [19:33:20/37] (×5 mỗi mốc), artifact T8
  19:33:57.133Z/292Z (20 s SAU cửa đóng — đã biết ở (vii) đợt
  175), balloon chuỗi 4 kết 19:33:46Z (T9-156). **ÂM TÍNH.**
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức (ứng viên) GIỮ 14.**
  Tổng 67 hướng âm tính liên tiếp (62 tới đợt 175 + 5 hướng mới
  đợt này: (xiii)(xv)(xvii) âm tính theo dữ liệu + (xiv) âm tính
  sau khi phân loại + (xvi) rỗng theo cấu trúc).

### §4.2 Làm rõ mâu thuẫn F-175-T4-2 (giao T2-176 + T10-176)

T2-175 tự ghi "0 vi phạm script nặng" trong khi T4-175 ghi
VI PHẠM (T2 chạy m56-175.py ~4 s đầu cửa sổ attempt1). Thu thập
bằng chứng dòng thời gian từ file gốc (không qua trung gian):

- **03:15:49Z** — guard khởi động m56-175.py (pid 6019, group
  6019); poll cuối lúc đó #12 03:15:32Z; attempt CHƯA mở — lúc
  khởi động là hợp lệ.
- **03:17:47Z** — T4 poll #15: `CUA YEN MO`, attempt1 mở.
  ps-before mtime 03:17:47.94Z bắt **4 process m56**: pid 6010
  (bash wrapper `.../round175-t2 && bash run-guarded.sh m56
  python3 m56-175.py`), 6011 (run-guarded.sh), 6012 (tee), 6019
  (python3 m56-175.py).
- **03:17:49Z** — guard phát hiện CUA 0→1, giết process group
  6019 ("ATTEMPT OPENED — killing process group 6019 at
  03:17:49Z", exit 124). m56-175.log mtime 03:17:51.72Z (tee flush
  sau khi giết).
- **03:17:52Z** — Xvfb :193 lên; **03:17:53Z** — WebKit 27.2
  launch; 03:17:56Z app boot OK; pass chạy ~03:18–03:19:12Z.
  ps-after (03:21:09Z): **0 dòng m56**.
- **Kết luận: CÓ VI PHẠM — nhẹ.** Process m56 tồn tại ~2 s trong
  cửa sổ attempt (tính tới mtime log ~4 s, như T4 ghi); **0 s
  chồng với pass chạy** (chết trước khi Xvfb lên); lớp B vẫn
  ĐẠT 5/5. **"0 vi phạm" của T2-175 là SAI trên thực tế**: quy tắc
  đứng cấm script nặng CHẠY trong cửa sổ attempt, và ps-before
  chứng minh m56 đang chạy lúc attempt mở. **Guard chỉ GIỚI HẠN
  (2 s thay vì ~75 s đợt 174), không biến vi phạm thành tuân thủ**
  — vòng lặp poll 3 s của guard vốn cho phép chồng lấn tới ~3 s +
  thời gian giết. **Lỗi gốc: T2-175 KHỞI ĐỘNG m56 lúc 03:15:49Z
  khi cả hai gate đã xanh** (poll #12: gate0 T4-check-only + RAM
  1.887 MB) — đúng trường hợp bài học F-174-T2-5 đã cấm ("không
  chạy script dài khi T4 gate0wait với cả hai gate xanh; attempt
  có thể mở ở poll kế tiếp").
- **Lượt yên #44 vẫn đứng** (m56 chết trước khi pass chạy — T4-175
  và parent 175 đã quyết vậy; T2-176 không mở lại).
- **Đề xuất cho T10-176 phán cuối:** (1) ghi F-175-T4-2 =
  VI PHẠM (nhẹ, 0 ảnh hưởng pass); (2) đính chính "0 vi phạm"
  của T2-175; (3) nhắc lại quy tắc dưới dạng khởi động: KHÔNG
  khởi động script nặng khi T4 gate0wait với cả hai gate xanh —
  guard chỉ là lưới an toàn, độ trễ giết (~2–5 s) không miễn trừ
  chồng lấn.

### §4.3 Tuân thủ luật script nặng đợt 176 — 0 vi phạm

- T4-176 mở poller 05:43:26Z (poll #1, gate0=T5, gateA RAM
  1.169 MB — cả hai gate xanh từ poll #1). T2-176 **KHÔNG khởi
  động script nặng nào** trong lúc poller gate0wait: probe #94
  (05:41:51Z, nhẹ) chạy TRƯỚC khi poller mở; m-check176.py
  (python thuần) + mọi truy vấn DB đều nhẹ, không quét cây.
- Diễn biến T4-176 (theo poll-t4.log): poll #1–#19 gate0wait
  (load1/load5 vượt 2 nên cửa chưa mở); **attempt1 MỞ 05:57:48Z**
  (poll #20: gate0 T5 + gateA RAM 1.054 MB) — KHÔNG hợp lệ
  (14/20, pass-timeout, exit 3, ~06:02:24Z); **attempt2 MỞ
  06:02:57Z** (poll #21) — **20/20 + LỚP B ĐẠT 5/5 + tickCost
  median 46,0 ms — LƯỢT HỢP LỆ #45, poller thoát 06:06:46Z**
  (thuộc T4-176).
- Walk mù + content + sessions + hole-recheck + sweep + grep
  sessions jsonl chỉ chạy **sau 06:08Z** (sau khi poller thoát
  hẳn) — 0 chồng attempt. **0 vi phạm đợt 176.**
- Lưu ý: guard `run-guarded.sh` của đợt 175 trỏ poll-t4.log
  round175-t4 (chưa cập nhật cho round176) — đợt này không dùng
  tới vì chờ poller thoát hẳn thay vì dựa vào guard; T2-177 cập
  nhật nếu cần dùng lại.

## §5. EPERM probe #94 + sweep

- **Probe #94: chạy 05:41:51Z, boot 15618ce8, ok=2 fail=0, exit 0.**
  Log `hidden_files/eperm-probe-v2.log` 266 → 268 dòng (+1 boot-changed
  70b7f7ee → 15618ce8, +1 probe#94); heartbeat n=94.
  **MemAvailable lúc probe: 946.460 kB** (chụp cùng lệnh probe —
  bài học F-172-T2-7). Cửa sổ probe #94: 02:39:56Z (#93) → 05:41:51Z
  = 10.795 s. Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #94** (script `eperm-sweep9696.py`, log `eperm-sweep176.log`,
  chạy 06:14:47–06:16:08Z, sau khi T4-176 đóng attempt): 148 file
  `.log` mtime trong cửa sổ [02:39:56Z, 05:41:51Z]; **3 file có
  marker, 12 lần xuất hiện — TẤT CẢ đều là trích dẫn lại**
  (`sóng EPERM đã tắt` ×10 trong o8-175t0.log/o8-175t8.log +
  eperm-sweep175.log; `Operation not permitted` ×2 trong
  eperm-sweep175.log — trích bảng sweep cũ). **0 sóng EPERM thật
  — sweep #94 ÂM TÍNH.** Sóng EPERM thật gần nhất vẫn
  ~11:55–12:11Z 11/11.
- Script probe: `~/workspace/repo-1/scripts/probe-eperm-v2.sh`; log +
  heartbeat tại `~/workspace/goals/capcut-clone-video-editor/
  hidden_files/eperm-probe-v2.log` / `.heartbeat`.

## §6. Phương pháp, sai số, câu hỏi cho parent

### §6.1 Phương pháp

- DB đọc tươi qua `muse.db` (bảng `scheduler.job_runs` +
  `scheduler.events` + `agent.sessions` +
  `scheduler.terminal_signals` + `runtime.requests`); `muse.db` từ
  chối `to_timestamp` — dùng literal `'YYYY-MM-DD HH:MM:SS+00'::timestamptz` +
  `EXTRACT(EPOCH FROM created_at)`. Mọi số (m) trong LIMITS này đều
  có trong script đối chiếu độc lập `m-check176.py` (log
  `m-check176.txt`) — epoch thô + phép trừ, không qua trung gian.
  Lưu ý: `events.run_id`/`job_runs.run_id` là UUID ĐẦY ĐỦ
  (`f0ac7900-cc16-41b5-9299-70f52dbcee3b`) — tra bằng short id trả
  0 dòng (bẫy đã gặp, ghi cho T2 sau).
- INSIDE tính bằng `m-check176.py` (log `m-check176.txt`);
  FULL133 p10/p90 khớp T2-175 bằng assert trong script.
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness TRỪ
  exec-log của chính phiên (F-172-T2-3 — agent 48d7ba7d...);
  script sessions đợt này vẫn trừ agent T2-175 (b548b200) thay vì
  agent hiện tại — đã bù bằng script witness riêng
  (`witness878989.py`, trừ đúng agent 48d7ba7d) cho #87/#88/#89;
  kiểm `grep ^W =` / `grep ^hi =` trước khi chạy hole-recheck;
  output vào thư mục riêng, không ghi đè file cũ (F-166-T2-2);
  kiểm epoch GAP bằng `date -d` trước khi chạy sessions
  (F-172-T2-1/F-171-T2-2); chụp meminfo cùng lệnh probe
  (F-172-T7-2-7). **Bài học mới (F-176-T2-11): chờ T4 đóng attempt
  + poller thoát hẳn rồi mới chạy script nặng** — thay vì dựa vào
  guard giết giữa chừng (xem §4.2: guard không miễn trừ vi phạm).
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.

### §6.2 Sai số / caveat (F-176-T2-*)

- **F-176-T2-1 — (m) #88 DƯƠNG ở cấp T2, parent quyết cuối.**
  Nếu được chấp nhận: n ứng viên 34/35 → 35/36 (n chính thức vẫn
  GIỮ 14 — xem §4.1).
- **F-176-T2-2 — (m) #88: hai caveat phải đọc cùng verdict.**
  (a) KHÔNG neo overlap nào (sampler −795 s, watcher −11.825 s,
  T4-poller đã thoát) — verdict chỉ dựa vào quy ước btime.
  (b) Caveat phân số F-176-T0-4: offset thật ∈ (32,431 s,
  33,431 s]; DƯƠNG ⟺ boot_est−btime ≤ 0,431 s — không có ước
  lượng điểm cho #88. Nếu parent không chấp nhận quy ước btime
  nguyên cho trường hợp sát biên này, (m) #88 lật thành ÂM.
- **F-176-T2-3 — INSIDE: hai dải MÂU THUẪN ở #88.** FULL134 TRONG,
  FULL133 NGOÀI (muộn 5.749 s — lần thứ 4 liên tiếp mâu thuẫn).
  T2 áp dụng kỷ luật nhãn F-165-T2-1 (dải phương pháp chi phối),
  như tiền lệ #79/#82/#83/#85/#86/#87. Nếu parent không đồng ý kỷ
  luật này, chuỗi vẫn đứt từ #80, dài 0.
- **F-176-T2-4 — (m) #56: 5 hướng mới đều âm tính/rỗng (lần thứ
  19 không thu hẹp).** (xiv) là điểm mới duy nhất có dữ liệu trong
  cửa (1 request maintenance, không thuộc run 156); (xvii) gần
  nhất là event 19:33:10.728Z, trước cửa 10 s. Tổng 67 hướng.
- **F-176-T2-5 — Mù #96? VẪN MỞ.** R file 1.238 s (lần thứ 12
  liên tiếp không đổi); R union-A 1.222 s / union-B 1.211 s;
  U union 1.118 s, cách sàn 29 s. Caveat: walk chạy SAU reboot
  #89 nên /tmp = 802 (chỉ file sau #89) — không ảnh hưởng R/S/T;
  content script chưa gồm head #87/#88/#89 — không ảnh hưởng max
  gap. Hố U mới nhất vẫn H-U15 (đã recheck: NEW=0).
- **F-176-T2-6 — Sessions: 0 hoạt động thật ở #64–#89.**
  4 file exec-log bị xóa giữa hai đợt (pruning — giải thích từng
  số ở §3.3); 2 file mới ở #87 đều đã kiểm nội dung trực tiếp
  (T4-175 poll snapshot — toàn trích dẫn).
- **F-176-T2-7 — Run 175 SUCCEEDED 05:24:21Z (số liệu; kết cục
  thuộc T7-176).** Wall gốc 10.410 s, trước hạn 690 s,
  claimed→finished 88 s (claimed_at DB hiện tại 05:22:53Z khác
  T7-175 ghi 02:35:52Z — mẫu F-173-T0-3; F-176-T0-3). **88 s là
  ứng viên ca ≥60 s thứ chín — phân loại cuối thuộc T7-176 +
  parent.** Run 176 (đợt này): T0-176 ghi jitter 0 s; run 176
  bị viết lại lần 1 tại #89? — KHÔNG: run 176 scheduled 05:35:51Z,
  SAU btime #89 (05:26:26Z) nên không bị viết lại (kết cục thuộc
  T7-176).
- **F-176-T2-8 — Khoảng mù quan sát ~13 phút trước #88.**
  Mọi vòng lặp nền T9-175 dừng ~04:51Z (sampler 04:51:02Z,
  headroom probe-close 04:51:21Z, b2-spikes mtime 04:04:30Z) —
  không có sampler/watcher/B2 nào bắc qua btime #88. Giao T9-176
  giải thích vì sao các vòng dừng 04:51Z trong khi T9-175 đóng cờ
  05:12Z. Không ảnh hưởng verdict (m) #88 theo quy ước btime,
  nhưng làm mất mọi neo overlap.
- **F-176-T2-9 — (m) #89 ÂM ở cấp T2, parent quyết cuối.**
  0 requeue trong cửa hẹp đã khép; 0 run sống tại btime. Số hiệu
  #89 ĐÃ được T0-176 xác nhận 9 nguồn (khác #87 đợt 175 — lúc đó
  số hiệu chưa xác nhận).
- **F-176-T2-10 — INSIDE #89 (sơ bộ) FALSE (FULL135), chuỗi 7
  có thể ĐỨT tại #89.** Hai dải mâu thuẫn ngược hướng (FULL135
  NGOÀI-sớm 240 s; FULL134 TRONG, cách biên trên 382 s); dải
  phương pháp FULL135 chi phối theo F-165-T2-1 — nhưng phân loại
  cuối thuộc T2-177 + parent 177 (nhiệm vụ đợt này là #88).
- **F-176-T2-11 — Bài học guard (xem §4.2/§6.1).** Chờ poller
  thoát hẳn rồi mới chạy script nặng; guard chỉ là lưới an toàn.

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 176)

- **(a) (m) #88 DƯƠNG — chấp nhận?** (requeue +33,431 s, sát biên
  DƯỚI 0,431 s — sát biên nhất từng ghi ở biên dưới; 1 run sống;
  KHÔNG neo overlap nào; caveat phân số F-176-T0-4: offset thật
  ∈ (32,431 s, 33,431 s] — DƯƠNG ⟺ boot_est−btime ≤ 0,431 s.)
  Nếu chấp nhận: n ứng viên 34/35 → 35/36.
- **(b) INSIDE #88 TRUE — chấp nhận chuỗi dài 7?** (FULL134;
  mâu thuẫn hai dải: FULL133 NGOÀI, muộn 5.749 s — dải phương pháp
  chi phối theo F-165-T2-1.)
- **(c) (m) #89 ÂM — chấp nhận?** (0 requeue, 0 run sống; số hiệu
  #89 đã được T0-176 xác nhận 9 nguồn.)
- **(d) INSIDE #89 (sơ bộ) FALSE — ghi nhận, phân loại cuối thuộc
  T2-177?** (FULL135 NGOÀI-sớm 240 s; FULL134 TRONG — mâu thuẫn
  ngược hướng; nếu chấp nhận: chuỗi 7 ĐỨT tại #89 → 0.)
- **(e) Mù #96? VẪN MỞ — chấp nhận giữ mở?** (R file 1.238 s lần
  thứ 12 không đổi; R union-A 1.222 s / union-B 1.211 s; U union
  1.118 s cách sàn 29 s; sessions 0 hoạt động thật ở #64–#89.)
- **(f) Mù #88? VẪN MỞ — chấp nhận?** (hole-recheck lần 20:
  337 hit, 0 mốc mới, lần thứ 20 liên tiếp; các hố khác đều NEW=0,
  kể cả H-U15.)
- **(g) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều kiện?**
  (lần thứ 19 không thu hẹp; 5 hướng mới đều âm tính/rỗng,
  tổng 67 hướng.) n chính thức GIỮ 14.
- **(h) F-175-T4-2 = VI PHẠM (nhẹ) — chấp nhận kết luận của
  T2-176?** (m56 tồn tại ~2 s trong cửa sổ attempt1, 0 s chồng
  pass; "0 vi phạm" của T2-175 được đính chính; lượt #44 vẫn đứng;
  đề xuất nhắc lại quy tắc dưới dạng khởi động — xem §4.2.)
- **(i) Tuân thủ luật script nặng đợt 176 (0 vi phạm — xem §4.3)
  — ghi nhận?**
- **(j) EPERM probe #94 + sweep #94 (0 sóng thật) — ghi nhận?**
  (Probe ok=2 fail=0, boot 15618ce8; sweep 148 log, 12 marker —
  tất cả trích dẫn lại, 0 sóng thật.)
- **(k) Run 175 SUCCEEDED 05:24:21Z (trước hạn 690 s, cf 88 s —
  ứng viên ca thứ chín, thuộc T7-176) — ghi nhận cho T7-176?**
  (Không phải verdict của T2.)
- **(l) T0-176: #87/#88/#89 XÁC NHẬN 9 nguồn; marker 41 reboot;
  O8 trên #89 WebKit PASS 21/21 ×2 + Chromium PASS 21/21;
  POSTBOOT_PASS #89 ĐÃ CÓ 05:42:19Z (replay-đầy-đủ, poll=0) —
  ghi nhận?** (Thuộc T0/T5-176.)
- **(m) T4-176: attempt1 KHÔNG hợp lệ (14/20) + attempt2 HỢP LỆ
  (20/20 + B 5/5 + median 46,0 ms — lượt yên #45) — ghi nhận?**
  (Thuộc T4-176; T2 chỉ ghi timeline chờ attempt.)
