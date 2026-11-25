# PHASE 9 — ROUND 175 — T2 EPERM LIMITS

**T2 đợt 175** — EPERM probe #93, phân loại (m) #86 **CUỐI**,
INSIDE #86, mù #96?/#88?/#94?/#95?/#77?, (m) #56 lần 18,
tuân thủ luật script nặng (KHÔNG vi phạm — xem §4.2).
Đợt 175 mở 02:35:51Z 23/11/2026 (09:35:51 +07 23/11; lượt cron
09:35 +07). Boot lúc viết: ca31fac1 (#87, btime 03:06:05Z) —
**REBOOT #87 xảy ra trong phiên T2** (phát hiện ~03:07Z; T0-175 đóng
cờ 02:48Z TRƯỚC #87 nên số hiệu #87 chờ T0-176 xác minh 9 nguồn).
**Số hiệu #86 ĐÃ ĐƯỢC T0-175 XÁC NHẬN 9 nguồn**
(round175-t0.done 02:48Z) — (m) #86 + INSIDE #86 dưới đây là
**phân loại cuối ở cấp T2 — parent quyết cuối**; (m) #87 +
INSIDE #87 (§1.6/§2) cũng là phân loại cuối ở cấp T2 (theo tiền lệ
T2-174 phân loại #84/#85 xảy ra trong đợt) — parent quyết cuối.

## §0. Headline

- **(m) #86: DƯƠNG — parent quyết cuối.** Requeue duy nhất
  eid 10252, run 174, 01:02:26.418Z = btime +49,418 s ∈ [33; 49,8]
  (cách biên TRÊN **0,382 s — sát biên nhất từng ghi**; biên dưới
  16,418 s). 1 run sống tại btime. Đối chiếu độc lập từ DB tươi +
  neo frame-drift kiểm lại từ file gốc (sampler +2 s, watcher +36 s
  — neo watcher MUỘN NHẤT từng ghi — khớp T7-174/T0-175 từng số).
  Caveat phân số F-175-T0-4: boot_est +0,897 s → offset ≈ +48,521 s
  — **vẫn trong dải** (cách biên trên 1,279 s); hướng caveat
  CÓ LỢI cho verdict (xem §1.4). **Nếu chấp nhận: n ứng viên
  32/33 → 33/34.**
- **INSIDE #86: TRUE (FULL132) — chuỗi dài 5.** Hai dải MÂU THUẪN
  (FULL131 nói NGOÀI, muộn 5.595 s — lớn thứ hai trong các lần mâu
  thuẫn, sau #82 với 7.348 s); dải phương pháp FULL132 chi phối
  theo F-165-T2-1.
- **(m) #87: DƯƠNG — parent quyết cuối.** Requeue duy nhất eid
  10282, run 175, 03:06:44.864Z = btime +39,864 s ∈ [33; 49,8]
  (cách biên dưới 6,864 s, biên trên 9,936 s — KHÔNG sát biên theo
  btime). Caveat F-175-T2-9: verdict KHÔNG bền với neo watcher
  (+7 s → counterfactual +32,864 s, DƯỚI dải chỉ 0,136 s — hụt
  nhỏ nhất từng ghi) và neo sampler (+16 s → +23,864 s); bền với
  neo T4-poller (−8 s → +47,864 s). Số hiệu #87 CHƯA được T0 xác
  nhận (chờ T0-176). **Nếu chấp nhận: n ứng viên 33/34 → 34/35.**
- **INSIDE #87: TRUE (FULL133) — chuỗi dài 6.** Hai dải MÂU THUẪN
  (FULL132 nói NGOÀI, muộn 5.970 s — cùng dạng #86; dải phương pháp
  FULL133 chi phối theo F-165-T2-1).
- **Mù #96? VẪN MỞ** — R file 1.238 s (lần thứ 11 liên tiếp không
  đổi một giây); R union-A 1.222 s / union-B 1.211 s; U union-A/B
  1.118 s, cách sàn 29 s (không đổi). **Mù #88? VẪN MỞ** —
  hole-recheck lần 19: 337 hit, 0 mốc mới (lần thứ 19 liên tiếp).
  Mù #95?/#94?/#77? giữ nguyên. **CERT/FULL GIỮ 76/91.**
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 18 không thu hẹp** (11 hướng
  MỚI đều âm tính/rỗng: 7 âm tính theo dữ liệu, 2 rỗng theo cấu trúc,
  (vii) 333 file mtime trong D — 0 trong cửa ứng viên, 0 ở anchor R
  / vùng mốc max — và (viii) 0 exec-log mtime trong D). Cửa
  R [2,56251; 2,66817) / J [2,566; 2,80753] s GIỮ NGUYÊN.
  **n chính thức GIỮ 14.**
- **EPERM probe #93: ok=2 fail=0** (02:39:56Z, boot 70b7f7ee).
  Sweep #93: 187 log mtime trong cửa sổ, 4 file có marker (20 lần)
  — TẤT CẢ đều là trích dẫn lại output probe/sweep cũ, **0 sóng
  thật**.
- **Run 174 SUCCEEDED** 02:24:03Z (số liệu; kết cục thuộc T7-175):
  wall gốc 10.092 s, trước hạn 708 s, claimed→finished 11 s
  (claimed_at DB hiện tại 02:23:52Z — khác T7-174 ghi 23:36:04Z,
  mẫu F-173-T0-3; xem F-175-T0-3); viết lại 1 lần (#86).
- **Tuân thủ luật script nặng: 0 vi phạm** — mọi script nặng đều
  chạy ngoài cửa sổ attempt T4 (kiểm poll-t4.log trước mỗi lần
  chạy; xem §4.2).

## §1. Điểm (m)

### §1.1 (m) #86 — DƯƠNG (CUỐI, đối chiếu độc lập)

- **Btime #86: 01:01:37Z** (epoch 1795395697), boot 70b7f7ee, gap
  #85→#86 = 7.321 s. **T0-175 XÁC NHẬN 9 nguồn** (round175-t0.done
  02:48Z; marker sống qua 38 reboot #49–#86). T7-174 xác minh 9
  nguồn; T2-175 xác minh 8 nguồn trực tiếp: boot_id + btime
  (/proc/stat) + uptime -s 01:01:37Z + /proc/1 01:01:55.793Z
  (+18,793 s) + journal idx 0 first entry 01:01:56Z (+19 s) +
  wtmp begins 01:01:56Z (+19 s) + last reboot 01:01 still running
  + who -b 01:01.
- **Requeue duy nhất** trong cửa hẹp [01:01:37Z, 01:20:37Z] VÀ cửa
  mở rộng [01:01:37Z, 02:40:00Z] (mọi job, DB tươi T2-175):
  **eid 10252, run 174 (3bcde515), 01:02:26.418Z = btime +49,418 s
  ∈ [33; 49,8]** (cách biên TRÊN 0,382 s, biên dưới 16,418 s).
  Kiểm lại cả ngày 23/11 TRƯỚC btime [00:00:00Z, 01:01:37Z]:
  0 requeue nào khác.
- Run 174: 5 event tổng cộng — dispatched 23:36:04.686Z eid 10230;
  requeued 01:02:26.418Z eid 10252; dispatched 01:02:26.505Z eid
  10253; reattached 01:02:26.564Z eid 10254; succeeded 02:24:03.966Z
  eid 10270. Bị viết lại lần 1 tại #86: started_at 1795390564 →
  1795395746 (+5.182 s); boot_gen cron_boot_0762915dd0b340129cec9e524f6c0834
  (#86); attempt 1.
- **Đúng 1 run sống tại btime #86** (event-based): run 174. 6 event
  trong cửa hẹp (3 của run 174 + reconciled 01:15:34.143Z eid 10255
  + heartbeat dispatched+succeeded 01:15:34.259Z/345Z eid
  10256/10257). 3 event ngay trước btime [00:50:00Z, 01:01:37Z):
  reconciled 01:00:00.053Z eid 10249 + deterministic-doctor
  dispatched+succeeded 01:00:00.092Z/330Z eid 10250/10251 (doctor
  xong 97 s TRƯỚC btime).
- **Phán: (m) #86 DƯƠNG — parent quyết cuối. Nếu chấp nhận:
  n ứng viên 32/33 → 33/34.**

### §1.2 Run 174 kết cục (số liệu; kết cục thuộc T7-175)

- **status SUCCEEDED, finished_at_utc 1795400643 = 02:24:03Z**
  (succeeded event eid 10270 lúc 02:24:03.966Z). **claimed_at_utc
  1795400632 = 02:23:52Z; claimed→finished = 11 s**; wall từ sched
  gốc = 10.092 s (2h48m12s); finished **708 s TRƯỚC hạn**
  02:35:51Z; timed_out false; attempt 1; viết lại 1 lần (#86);
  boot_gen cuối cron_boot_0762915dd0b340129cec9e524f6c0834 (#86).
  T0-175 khớp từng số (round175-t0.done; F-175-T0-3: claimed_at DB
  hiện tại 02:23:52Z khác T7-174 ghi 23:36:04Z — claimed đổi lúc
  cuối, mẫu F-173-T0-3; T7-175 đối chiếu).
- Run 175 (đợt này): T0-175 ghi jitter 0 s (thuộc T7-175).

### §1.3 Frame-drift #86 — OVERLAP thứ 13

- **#86 (OVERLAP 13th, HAI tiến trình cũ viết qua btime — T2-175
  KIỂM LẠI TỪ FILE GỐC, khớp T7-174/T0-175 từng số):** sampler-174
  dòng 3c704685 cuối 01:01:39Z = btime +2 s (ram-sampler.log dòng
  84); watcher-174 poll cuối 01:02:13Z = btime +36 s
  (replay-watch-174.log dòng 166; 0 poll trên boot mới 70b7f7ee —
  watcher chết theo #86). Sampler đầu 70b7f7ee 01:03:13Z = btime
  +96 s (gap 94 s — T9 khởi động lại trong ~96 s); /proc/1 mới
  01:01:55.793Z = btime +18,793 s (LỚN HƠN mẫu +12 s của
  #83/#84/#85 — T7-174 đã ghi rõ). T4 poller: KHÔNG CÓ tại #86
  (T4-174 đóng 00:13:52Z).
- Counterfactual: sampler +2 s → +47,418 s (TRONG dải); watcher
  +36 s → +13,418 s (DƯỚI dải). Verdict BỀN với neo sampler, KHÔNG
  bền với neo watcher — cùng dạng #71/#81/#85 (F-175-T2-2).
  **Neo watcher +36 s là MUỘN NHẤT từng ghi** (trước đó: T4-poller
  +21 s tại #84; watcher +20 s tại #81) — T0-175 ghi F-175-T0-1.
- Cơ chế đứng (F-172-T5-1, đã giải thích): container stop/start
  overlap — btime đánh dấu boot mới bắt đầu, không phải boot cũ chết.

### §1.4 Caveat phân số F-175-T0-4 — hướng CÓ LỢI cho verdict

- T0-175 (XÁC NHẬN 9 nguồn): boot_est #86 = btime +0,897 s →
  offset ≈ +48,521 s — **vẫn trong dải** (cách biên trên 1,279 s).
- Hướng của caveat CÓ LỢI cho verdict ở biên TRÊN: boot thật ∈
  [btime, btime+1 s) → offset thật ∈ (48,418 s, 49,418 s] — MỌI giá
  trị đều < 49,8 s; margin tới biên trên chỉ có thể TĂNG khi
  boot_est tăng. Khác #81/#85 (caveat kéo về biên DƯỚI, chống lại
  verdict) — ở #86 caveat kéo RA KHỎI biên trên. Parent đã chấp
  nhận #81 với caveat nặng hơn (margin 0,477 s, estimator dưới
  dải); #86 nhẹ hơn ở cả hai chiều (margin btime 0,382 s < 0,477 s
  nhưng estimator phân số vẫn trong dải với margin 1,279 s).
- Ghi rõ để parent cân: margin btime-tương đối 0,382 s là SÁT BIÊN
  NHẤT từng ghi (vượt #81 0,477 s) — nhưng đó là margin theo btime
  nguyên, quy ước đứng từ trước tới nay.

### §1.6 (m) #87 — DƯƠNG (CUỐI ở cấp T2, parent quyết cuối)

Reboot #87 xảy ra TRONG đợt 175 khi T2-175 đang hoạt động (phát hiện
~03:07Z, giữa lúc chạy walk mù). Theo tiền lệ (T2-174 phân loại
#84/#85 xảy ra trong đợt), T2-175 phân loại #87 ở cấp T2; parent/T10
quyết cuối. **Số hiệu #87 CHƯA được T0 xác minh 9 nguồn** (T0-175
đóng cờ 02:48Z, trước #87) — T0-176 xác minh; T2-175 xác minh trực
tiếp 6 nguồn: boot_id + btime (/proc/stat) + uptime -s 03:06:05Z +
/proc/1 03:06:15.967Z (+10,967 s) + wtmp begins 03:06:16Z (+11 s) +
last reboot 03:06 still running + who -b 03:06.

- **Btime #87: 03:06:05Z** (epoch 1795403165), boot
  ca31fac1-9e71-4de3-97b6-0dd7904a426c, gap #86→#87 = 7.468 s.
- **Requeue duy nhất** trong cửa hẹp [03:06:05Z, 03:25:05Z] VÀ cửa
  mở rộng [03:06:05Z, ~03:21Z] (mọi job, DB tươi T2-175, đọc
  ~03:21–03:23Z): **eid 10282, run 175
  (f0ac7900-cc16-41b5-9299-70f52dbcee3b), 03:06:44.864Z = btime
  +39,864 s ∈ [33; 49,8]** (cách biên dưới 6,864 s, biên trên
  9,936 s — KHÔNG sát biên theo btime). Kiểm lại cả ngày 23/11
  TRƯỚC btime: chỉ 1 requeue khác — eid 10252 (#86, 01:02:26Z).
- Run 175: scheduled 02:35:51Z, claimed 1795401352 = 02:35:52Z,
  started_at VIẾT LẠI 03:06:45Z tại #87 (+1.854 s so với sched
  gốc), status running lúc đọc, boot_gen
  cron_boot_7f2165b970fc4686a666ce5fcc6af724. **Đúng 1 run sống tại
  btime #87** theo claimed_at (run 175); truy vấn theo started_at
  trả 0 dòng CHỈ VÌ started_at đã bị viết lại (cùng mẫu run 174
  tại #86). 6 event trong cửa hẹp (3 của run 175: requeued
  03:06:44.864Z eid 10282 + dispatched 03:06:45.045Z eid 10283 +
  reattached 03:06:45.210Z eid 10284; reconciled 03:15:34.109Z
  eid 10285 + heartbeat dispatched/succeeded 03:15:34.213Z/306Z
  eid 10286/10287). 3 event ngay trước btime [03:00:00Z, 03:06:05Z):
  reconciled 03:00:00.039Z eid 10279 + deterministic-doctor
  dispatched/succeeded 03:00:00.096Z/342Z eid 10280/10281 (doctor
  xong ~365 s TRƯỚC btime).
- **Frame-drift #87 — OVERLAP thứ 14 (cả sampler + watcher):**
  sampler-175 dòng 70b7f7ee cuối 03:06:21Z = btime +16 s
  (ram-sampler.log; 28 dòng 70b7f7ee); watcher-175 poll cuối
  03:06:12Z = btime +7 s (replay-watch-175.log; 56 dòng 70b7f7ee).
  T4-poller: poll cuối 70b7f7ee #33 03:05:57Z = btime −8 s (TRƯỚC
  btime — neo duy nhất không vượt btime); poll #1 trên ca31fac1
  03:07:15Z. Cơ chế đứng F-172-T5-1 (container stop/start overlap).
- Counterfactual (requeue − neo): btime +39,864 s TRONG;
  T4-poller −8 s → +47,864 s TRONG; **watcher +7 s → +32,864 s
  DƯỚI dải chỉ 0,136 s — hụt nhỏ nhất từng ghi**; sampler +16 s →
  +23,864 s DƯỚI dải. Verdict BỀN với neo T4-poller, KHÔNG bền với
  neo watcher/sampler — caveat F-175-T2-9. Phân số boot_est cho #87
  chưa có (chờ T0-176); với offset btime +39,864 s, caveat phân số
  tối đa ±1 s KHÔNG thể đổi verdict (mọi giá trị trong
  (38,864 s, 39,864 s] đều trong dải).
- **Phán: (m) #87 DƯƠNG — parent quyết cuối. Nếu chấp nhận:
  n ứng viên 33/34 → 34/35.** (Nếu #86 được chấp nhận trước:
  32/33 → 33/34 rồi → 34/35; nếu #86 bị bác: 32/33 → 33/34.)

### §1.7 (m) #85/#84 — chỉ tham chiếu, KHÔNG mở lại

- #85: parent đã CHẤP NHẬN DƯƠNG (quyết (f) đợt 174, +34,397 s).
  KHÔNG mở lại.
- #84: parent đã CHẤP NHẬN DƯƠNG (quyết (f) đợt 174, +45,482 s).
  KHÔNG mở lại.

## §2. INSIDE — dải FULL132

Script: `blind9696-gaps175.py` (exec `blind9696-gaps174.py`, log
`gaps175.log`). Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1). FULL129/130/131 p10/p90 khớp T2-174
bằng assert (1575,80/8833,40; 1577,40/8830,20; 1579,00/8827,00).

- **FULL132**: n=132, mean 1h40'23", median 1h53'59", p10 1587,80 s,
  p90 8819,10 s, sd 0h55'00", in 90–150'=70, <60'=31, >180'=9, >240'=3
  (= FULL131 + [gap #85 = 7.321 s]).
- **INSIDE #86: TRUE** — dải FULL132 [23:26:03Z, 01:26:35Z] neo
  22:59:36Z; btime #86 01:01:37Z TRONG dải, cách biên dưới 5.734 s,
  cách biên trên 1.498,1 s. **Chuỗi dài 5.** Đối chiếu vs FULL131
  còn hiệu lực: NGOÀI (muộn 5.595 s) — **hai dải MÂU THUẪN** (muộn
  5.595 s là lớn thứ hai trong các lần mâu thuẫn, sau #82 với
  7.348 s; #83 muộn 3.386 s, #85 muộn 399 s); dải phương pháp FULL132
  chi phối theo F-165-T2-1 (F-175-T2-3).
- **INSIDE #87: TRUE** — dải FULL133 [01:28:13Z, 03:28:28Z] neo
  01:01:37Z; btime #87 03:06:05Z TRONG dải, cách biên dưới 5.872 s,
  cách biên trên 1.343 s. **Chuỗi dài 6.** Đối chiếu vs FULL132
  còn hiệu lực: NGOÀI (muộn 5.970 s) — **hai dải MÂU THUẪN** (muộn
  5.970 s là lớn thứ hai trong các lần mâu thuẫn, sau #82 với
  7.348 s, vượt #86 với 5.595 s); dải phương pháp FULL133 chi phối
  theo F-165-T2-1 (F-175-T2-3). Lưu ý: mâu thuẫn ở đây cùng dạng #86 (dải cũ kết
  thúc trước khi boot mới xảy ra — FULL132 kết thúc 01:26:35Z,
  #87 lúc 03:06:05Z).
- **FULL133**: n=133, mean 1h40'34", median 1h54'16", p10 1596,60 s,
  p90 8811,20 s, sd 0h54'50", in 90–150'=71, <60'=31, >180'=9, >240'=3
  (= FULL132 + [gap #86 = 7.468 s]). Script `m-check175b.py` (log
  `m-check175b.txt`; exec `blind9696-gaps175.py` — FULL132 p10/p90
  khớp bằng assert 1587,80/8819,10).
- Tốc độ reboot: tới #86: 162 reboot / 292,72 h = 1 lần / 108,4 phút;
  tới #87: 163 reboot / 294,79 h = 1 lần / 108,5 phút.

## §3. Mù

B1 = **03:00:00Z 23/11** (giờ chạy thực tế, F-172-T2-12). Walk
`blind9696-investigate.py` chạy 03:07:24–03:08:57Z (dưới guard,
exit 0, không bị giết): repo-1 360 file, hidden_files 5.281,
outside 2.083, **/tmp 0**, merged unique second-marks 3.656
(đợt 174: 3.485; +171). **Caveat lớn: walk chạy SAU reboot #87
(03:06:05Z)** — /tmp là tmpfs nên bị #87 xóa sạch; /tmp = 0 KHÔNG
có nghĩa là không có file /tmp trong cửa sổ tại B1. R/S/T không bị
ảnh hưởng (file /tmp từ 21/11 đã bị nhiều reboot xóa từ trước);
U file gaps có thể rộng hơn do mất file /tmp đợt 174–175 (U không
phải đoạn verdict của #96?).

### §3.1 File gaps (merged, `blind9696-merged.log`)

- **R: 13 marks, MAX GAP 1.238 s (11:15:18→11:35:56Z) — MỞ,
  lần thứ 11 liên tiếp không đổi một giây.** S: 226 marks, max
  3.235 s (13:01:51→13:55:46Z). T: 211 marks, max 627 s — ĐÓNG.
  **U: 3.206 marks, max 2.701 s (22:06:28→22:51:29Z, H-U14 —
  không đổi so với đợt 174).** Hố U mới H-U15: 1.221 s
  (01:03:18→01:23:39Z 23/11 — quãng yên sau #86; sampler khởi
  động lại 01:03:13Z, mốc file tiếp 01:23:39Z).

### §3.2 Union-A / union-B (`blind9696-content.log`)

- **R union-A 1.222 s / union-B 1.211 s — MỞ** (union-B: head
  11:15:29Z +11 s; tail 11:38:26Z, 2 s trước cuối; gap lớn nhất
  1.211 s 11:15:29→11:35:40Z; biến thể + dispatch 11:35:51Z vẫn
  1.211 s — dispatch không thu hẹp).
- S union-A 662 s / union-B 591 s — ĐÓNG. T union-A 38 s — ĐÓNG.
- **U union-A 1.118 s / union-B 1.118 s — ĐÓNG, cách sàn 1.147 s
  đúng 29 s (không đổi).** Sampler-174: 84 dòng 3c704685 (cuối
  01:01:39Z = btime #86 +2 s — OVERLAP 13th) + 53 dòng 70b7f7ee
  (đầu 01:03:13Z); sampler-175: 21 dòng 70b7f7ee. Watcher-174:
  161 poll (cuối 01:02:13Z = btime #86 +36 s — OVERLAP 13th);
  watcher-175: 39 poll.
- **Kết luận: #96? (#64) VẪN MỞ** (R là đoạn verdict; U không phải
  đoạn verdict). #95? (#63), #94? (#62), #77? giữ nguyên.
  **CERT/FULL GIỮ 76/91.**

### §3.3 Sessions — jump witness (`blind9696-sessions.log`)

- Exec-logs mtime trong cửa sổ: 323 (đợt 174: 336 — giảm do trừ
  exec-log của chính phiên này + 3 file đợt 174 đã bị xóa, xem
  dưới). Exec-logs mtime trong R/S/T: 0/0/0; trong U: 323.
  R-head 0/0/0/0/0; R-tail repo-1=2 / hidden_files=51 / outside=2.
- Jump witness thô: #64: 6, #65: 7, #66: 7, #67: 7, #68: 7, #69: 7,
  #70: 7, #71: 8 (was 10), #72: 10, #73: 10, #74: 12 (was 11),
  #75: 11 (was 10), #76: 9 (was 8), #77: 9 (was 8), #78: 9 (was 8),
  #79: 7 (was 6), #80: 7 (was 6), #81: 7 (was 6), #82: 6 (was 5),
  #83: 5 (was 4), #84: 8 (was 7), #85: 4 (was 3), **#86: 3 (MỚI)**.
- Thay đổi so với đợt 174 — đã kiểm nội dung từng file MỚI:
  (a) +1 ở hầu hết các boot (#74–#85): file proc_52cb85ef2a58.log
  — exec-log của CHÍNH T2-174 (agent 208d5e57), nay được đếm vì
  T2-175 chỉ trừ phiên mình (F-172-T2-3); toàn trích dẫn số liệu
  đợt 174, không phải hoạt động thật.
  (b) #71: 10 → 8 = −3 file ĐÃ BỊ XÓA giữa hai đợt (xác minh
  `ls`: No such file — proc_67205a208d61, proc_9f64a205f621,
  proc_3f36e49bbc0f; exec-log pruning, cùng mẫu H-U14) +1 (a).
  #72/#73 giữ 10 (−1 file bị xóa +1 (a) — khớp từng số).
  (c) #86: 3 file MỚI, đều của agent 22ee7124 (exec-log của T9-174,
  đã kiểm nội dung trực tiếp từng file): proc_f4c14c9e5897.log
  (sampler 00:53–00:55Z trên #85 + trích dẫn POSTBOOT_PASS #85
  23:46:57Z — span dài chỉ do trích dẫn), proc_a2ddaa0c4e36.log
  (sampler 01:28–01:30Z trên #86 + trích dẫn mốc cũ),
  proc_910b750ec4a6.log (sampler 01:52–01:54Z trên #86 + trích dẫn
  btime #85 22:59:36Z). Cả 3 đều là file trích dẫn/linger — phiên
  chạy HOÀN TOÀN trước hoặc sau #86, không có hoạt động thật nào
  bắc qua #86.
- Content-ts trong hố R union (11:15:29–11:35:40Z): 3 hit
  (11:16:22Z ×3 — như đợt 173/174); trong hố file U H-U12
  (16:09:36–16:48:31Z): 3 hit tại 16:25:06Z (như đợt 174).
- **Kết luận: 0 hoạt động thật ở mọi reboot #64–#86** (sau khi
  trừ file trích dẫn + file của chính phiên). F-175-T2-10.

### §3.4 Hole-recheck lần 19 (`hole-recheck175.log`,
`holerecheck-all.txt` mới trong `round175-t2/`)

- **H-E1-88 (19:32:59–20:17:30Z 20/11): inside=337,
  float-trap=337, NEW=0 — lần thứ 19 liên tiếp 337 hit, 0 mốc mới.
  #88? VẪN MỞ.**
- Các hố khác đều NEW=0 (H-R1/H-R1-old/H-S1/H-S2/H-T1/H-U1/
  H-U2-old/H-U4/H-U5: 0 hit; H-S3/H-U2/H-U6/H-U7/H-U8/H-U9/H-U10/
  H-U11/H-S4/H-T2/H-U12: 1 float-trap; H-U3: 10 float-trap;
  H-U13: 2 float-trap; H-U14: 3 float-trap — toàn trap ở biên hố,
  không mốc mới). **H-U15 (mới): inside=1, float-trap=1, NEW=0**
  (trap b2-spikes.log 01:03:18.732Z ở biên hố — cùng lớp trap).
- md5 `round174-t2/holerecheck-all.txt` = 51417ff6b9d1f4c9ec04b127d5e53b83
  (file cũ không bị ghi đè — output đợt này là file mới).

## §4. Mô hình đồng hồ + (m) #56 + tuân thủ luật script nặng

### §4.1 (m) #56 — lần thứ 18, KHÔNG THU HẸP (9 hướng MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished, succeeded event
eid 9500). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s
(T2-160 §4.1): R ≥ 2,562 (từ file session T10-156 mtime wall
20:16:36Z); #56 là điểm ÂM ⟺ R < 2,668 (run 156 còn chạy tại #56
⟺ true-finish > 19:32:47Z).

- **(i) DB `scheduler.job_runs` — mọi run có started/finished trong
  D (MỚI): 6 run** — run 156 (9c7b6986, started 19:05:18Z,
  finished 20:19:34Z DB) là run DUY NHẤT spans btime #56
  (19:32:47Z); 5 run khác (heartbeat 19:15:34Z, feed-pulse-02
  19:41:54Z, heartbeat 19:45:34Z, doctor 20:00:00Z, heartbeat
  20:15:34Z) đều xong trong cùng giây started, không spans btime.
  **ÂM TÍNH — không run mới sống tại #56.**
- **(ii) DB `runtime.requests` theo root trong D (MỚI — phân rã
  đầy đủ): chỉ 2 nhóm** — 30 request root run-156 (max
  20:19:34.636Z) + 137 request root NULL (max 20:22:35.041Z —
  traffic maintenance e033d2dd, KHẲNG ĐỊNH LẠI hướng (i) đợt 173).
  Không nhóm root thứ ba. **ÂM TÍNH — khớp T2-174 (iv) từng số.**
- **(iii) Request .636Z — chi tiết hàng (MỚI): chính là ROOT
  request row của run 156** (request_id = run id, parent
  `...:resolve`, origin internal.scheduler_cron, work_class
  user_facing) — created_at lúc resolve, KHÔNG phải hoạt động mới
  sau khi run kết thúc. **KHẲNG ĐỊNH CÁCH ĐỌC đợt 174 (cùng chuỗi
  kết thúc) — không thu hẹp.**
- **(iv) DB `scheduler.events` trong D (KIỂM LẠI): vẫn đúng 19
  event**, max **20:19:34.533Z** (succeeded run 156, eid 9500 —
  chính mốc DB đã biết). **Cửa ứng viên (m) #56 [19:33:20Z,
  19:33:37Z] TRỐNG theo giờ DB** (không event nào giữa 19:15:34Z
  và 19:41:54Z). **ÂM TÍNH — không thu hẹp.**
- **(v) DB `scheduler.terminal_signals` trong D (KIỂM LẠI +
  chi tiết trace MỚI): vẫn 1 dòng** — run 156, signal
  `notify_main_agent`, created_at_utc 1795205974 (= 20:19:34.286Z),
  producer agent 964f2bc4. Chi tiết MỚI trong trace JSON:
  `request_received_at_ms` 1795205851088 = **20:17:31.088Z** —
  resolve request đến TRƯỚC mốc max (20:19:34Z), không phải mốc
  muộn hơn. **ÂM TÍNH — không thu hẹp.**
- **(vi) DB `agent.sessions` created/updated trong D (KIỂM LẠI):
  0 session. ÂM TÍNH.**
- **(vii) mtime scan ~/workspace trong D (MỚI — đợt 174 (vii) chỉ
  quét /home/hatch NGOÀI ~/workspace): ÂM TÍNH — 333 file mtime
  trong D (find hoàn tất, stderr 0 dòng).** Chạy lần 1 dưới guard
  03:15:49–03:17:49Z, BỊ GUARD GIẾT (in tới ~19:56Z) vì T4 mở
  attempt1 lúc 03:17:47Z — guard hoạt động ĐÚNG, 0 vi phạm; chạy
  lại lần 2 (guard đã vá lỗi nhận biết attempt đóng, xem §4.2)
  03:25–03:27:47Z, exit 0. **Cửa ứng viên [19:33:20Z, 19:33:37Z]
  có 0 file** (grep 19:33:2x + 19:33:30–37 = 0; cũng 0 file lúc
  19:32:xx). File gần nhất: 19:33:57.133Z `round156-t8/smoke/
  wait-t4-t5.log` + 19:33:57.292Z `round156-t8/smoke/
  selfcheck-postboot-156t8.txt` — 20 s SAU khi cửa đóng, artifact
  thường của T8 đợt 156. **(vii-b) anchor R 20:16:00–20:17:00Z:
  0 file. (vii-c) vùng mốc max 20:19:30–20:19:40Z: 0 file.**
  Max mtime trong D: 20:15:33.130Z (`round156-t10.done`) — TRƯỚC
  mốc max đã biết 20:19:34Z (mốc đó là sessions.jsonl ngoài
  ~/workspace, xem (xii)).
- **(viii) exec-log mtimes trong D (MỚI): ÂM TÍNH — 0 exec-log có
  mtime trong D** (chạy lại cùng lần 2 của (vii), exit 0).
- **(ix) wtmp/last cho 20/11 (MỚI): RỖNG theo cấu trúc** — wtmp
  chỉ còn boot hiện tại (#86, begins 01:01:56Z 23/11); không có
  dữ liệu login nào cho 20/11.
- **(x) apt/dpkg logs (MỚI theo file): RỖNG theo cấu trúc cho
  20/11** — dpkg.log/history.log/term.log/eipp.log.xz đều mtime
  01:22Z 23/11 (chỉ hoạt động sau #86); KHÔNG có bản xoay nào
  (dpkg.log.1[.gz], history.log.1[.gz], term.log.1, eipp.log.1.xz
  đều KHÔNG TỒN TẠI).
- **(xii) Mốc max đã biết ĐÃ XÁC NHẬN CÒN SỐNG trên đĩa:**
  `/home/hatch/agents/agent-964f2bc4-…/sessions/964f2bc4-….jsonl`
  mtime 20:19:34.326Z (stat trực tiếp).
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức (ứng viên) GIỮ 14.**
  Tổng 62 hướng âm tính liên tiếp (51 tới đợt 174 + 11 hướng mới
  đợt này: 7 âm tính theo dữ liệu (i)(ii)(iii)(iv)(v)(vi)(xii) +
  2 rỗng theo cấu trúc (ix)(x) + (vii)(viii) âm tính đầy đủ).

### §4.2 Tuân thủ luật script nặng — 0 vi phạm

- T4-175 mở poller 02:41:36Z (poll #1); T2-175 kiểm poll-t4.log
  TRƯỚC MỖI script nặng (probe #93 lúc 02:39:57Z chạy TRƯỚC khi
  T4 mở poller; m-check/gaps là python thuần, không quét cây).
- Diễn biến T4 (theo poll-t4.log): poll #1–#33 trên boot 70b7f7ee
  (02:41:36Z–03:05:57Z) — gate0wait, **CHƯA BAO GIỜ mở attempt**
  (0 lần `CUA YEN MO`); RAM 1552 MB → ~429 MB (dưới gateA 1024);
  lock từng bị thread sót `t0-round174` pid 17064 giữ tới poll #8;
  gate0=T5 từ poll #1 (POSTBOOT_PASS #86 có 02:40:29Z). Poll #33
  03:05:57Z là poll cuối trên 70b7f7ee (8 s TRƯỚC btime #87).
  Sau #87: poll #1–#15 trên boot ca31fac1 (03:07:15Z–03:17:47Z),
  RAM 1876–1994 MB → 1414–1887 MB; gate0=khong-dat (POSTBOOT_PASS
  #86 đã cũ, chờ POSTBOOT_PASS #87 — T5-175/watcher-175).
  **Attempt1 MỞ lúc 03:17:47Z** (poll #15: gate0 T4-check-only
  pb_age=2 + gateA đủ RAM=1887 MB; đã dùng 0/3).
- Các script nặng CHỈ chạy ngoài cửa sổ attempt: walk mù
  03:07:24–03:08:57Z, content 03:09Z, sessions 03:10Z,
  hole-recheck 03:11–03:12:54Z, sweep 03:14:47–03:15:39Z, m56
  03:15:49Z — tất cả trước khi attempt mở 03:17:47Z. **Guard
  `run-guarded.sh` giết script m56 đúng lúc attempt mở (03:17:49Z,
  2 s sau `CUA YEN MO`, exit 124) — chứng minh cơ chế bảo vệ
  hoạt động; 0 vi phạm.** Lỗi guard sau đó: nó từ chối chạy lại vì
  grep `CUA YEN MO` toàn file (không phân biệt attempt đã đóng) —
  đã vá trong phiên (F-175-T2-11b: chỉ từ chối khi CUA cuối chưa có
  dòng đóng sau nó; trong lúc chạy chỉ giết khi SỐ CUA tăng);
  m56 chạy lại 03:25–03:27:47Z exit 0.
- Bài học F-174-T2-5 đã áp dụng: KHÔNG chạy script dài khi T4 đang
  gate0wait với cả hai gate xanh (attempt có thể mở ở poll kế
  tiếp — ĐÚNG như đã xảy ra lúc 03:17:47Z); dùng waiter nền theo
  dõi poll-t4.log (kiểm mỗi 60 s) thay vì chạy script nặng chen
  giữa các poll. Một waiter nền 25 phút bị SIGTERM sau ~19 phút
  (không attempt nào mở trong cửa sổ đó) — không dựa vào nó nữa.

## §5. EPERM probe #93 + sweep

- **Probe #93: chạy 02:39:56Z, boot 70b7f7ee, ok=2 fail=0, exit 0.**
  Log `hidden_files/eperm-probe-v2.log` 264 → 266 dòng (+1 boot-changed
  3c704685 → 70b7f7ee, +1 probe#93); heartbeat n=93.
  **MemAvailable lúc probe: 615.876 kB** (chụp cùng lệnh probe —
  bài học F-172-T2-7). Cửa sổ probe #93: 23:39:02Z (#92) → 02:39:56Z
  = 10.854 s. Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #93** (script `eperm-sweep9696.py`, log `eperm-sweep175.log`,
  chạy dưới guard 03:14:47–03:15:39Z): 187 file `.log` mtime trong
  cửa sổ [23:39:02Z, 02:39:56Z]; **4 file có marker, 20 lần xuất
  hiện — TẤT CẢ đều là trích dẫn lại** output probe/sweep cũ
  (`sóng EPERM đã tắt` ×16 + `Operation not permitted` ×4, trong
  đó 2 lần trong exec-log T2-174 thực chất trích lại bảng đếm của
  sweep-173). **0 sóng EPERM thật — sweep #93 ÂM TÍNH.** Sóng
  EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
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
  có trong script đối chiếu độc lập `m-check175.py` (log
  `m-check175.txt`) — epoch thô + phép trừ, không qua trung gian.
  Lưu ý: `events.run_id`/`job_runs.run_id` là UUID ĐẦY ĐỦ
  (`3bcde515-6550-43bd-9753-ef1e990b0b7e`) — tra bằng short id trả
  0 dòng (bẫy đã gặp, ghi cho T2 sau).
- INSIDE tính bằng `blind9696-gaps175.py` (log `gaps175.log`);
  FULL129/130/131 p10/p90 khớp T2-174 bằng assert trong script.
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness TRỪ
  exec-log của chính phiên (F-172-T2-3 — agent b548b200...);
  kiểm `grep ^W =` / `grep ^hi =` trước khi chạy hole-recheck;
  output vào thư mục riêng, không ghi đè file cũ (F-166-T2-2);
  kiểm epoch GAP bằng `date -d` trước khi chạy sessions
  (F-172-T2-1/F-171-T2-2); chụp meminfo cùng lệnh probe
  (F-172-T7-2-7). **Bài học mới (F-175-T2-11):** guard giết script
  nặng đúng lúc attempt mở (m56 bị giết 2 s sau `CUA YEN MO`) —
  khi script bị giết giữa chừng, phần output ĐÃ IN vẫn dùng được
  nếu liệt kê theo mtime đã sắp xếp (cửa ứng viên (vii) đã trả
  lời 0 file trước khi bị giết); phần chưa in phải chạy lại sau
  khi attempt đóng, KHÔNG chạy chen trong attempt.
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa.

### §6.2 Sai số / caveat (F-175-T2-*)

- **F-175-T2-1 — (m) #86 DƯƠNG ở cấp T2, parent quyết cuối.**
  Nếu được chấp nhận: n ứng viên 32/33 → 33/34 (n chính thức vẫn
  GIỮ 14 — xem §4.1).
- **F-175-T2-2 — (m) #86: hai caveat phải đọc cùng verdict.**
  (a) Neo watcher +36 s → counterfactual +13,418 s DƯỚI dải
  (verdict không bền với neo này — cùng dạng #71/#81/#85; theo quy
  tắc đứng, offset btime-tương đối +49,418 s chi phối). Neo +36 s
  là MUỘN NHẤT từng ghi.
  (b) Caveat phân số F-175-T0-4: boot_est +0,897 s → offset
  ≈ +48,521 s — **vẫn trong dải** (cách biên trên 1,279 s), và
  hướng caveat CÓ LỢI cho verdict (xem §1.4). Parent đã chấp nhận
  #81 với caveat nặng hơn (margin 0,477 s, estimator dưới dải).
- **F-175-T2-3 — INSIDE: hai dải MÂU THUẪN ở #86.** FULL132 TRONG,
  FULL131 NGOÀI (muộn 5.595 s — lớn thứ hai trong các lần mâu
  thuẫn, sau #82 với 7.348 s). T2 áp dụng kỷ luật nhãn F-165-T2-1
  (dải phương pháp chi phối), như tiền lệ #79/#82/#83/#85. Nếu
  parent không đồng ý kỷ luật này, chuỗi vẫn đứt từ #80, dài 0.
- **F-175-T2-4 — (m) #56: (vii) + (viii) âm tính ĐẦY ĐỦ (lần thứ
  18 không thu hẹp).** (vii): 333 file mtime trong D, 0 trong cửa
  ứng viên, 0 ở anchor R 20:16–20:17Z, 0 ở vùng mốc max
  20:19:30–20:19:40Z, max mtime 20:15:33.130Z. (viii): 0 exec-log
  mtime trong D. Tổng 62 hướng âm tính liên tiếp.
- **F-175-T2-5 — Mù #96? VẪN MỞ.** R file 1.238 s (lần thứ 11
  liên tiếp không đổi); R union-A 1.222 s / union-B 1.211 s;
  U union-A/B 1.118 s, cách sàn 29 s. Caveat: walk chạy SAU reboot
  #87 nên /tmp = 0 (tmpfs bị xóa) — không ảnh hưởng R/S/T; U file
  gaps có thể rộng hơn do mất file /tmp đợt 174–175 (U không phải
  đoạn verdict). Hố U mới H-U15 (1.221 s sau #86) đã recheck:
  NEW=0.
- **F-175-T2-6 — Sessions: 0 hoạt động thật ở #64–#86.**
  4 file mới so với đợt 174 đều đã kiểm nội dung trực tiếp
  (T2-174's own log + 3 exec-log T9-174 — toàn trích dẫn/linger);
  3 file đợt 174 đã BỊ XÓA (exec-log pruning — cùng mẫu H-U14).
  #71: 10 → 8 giải thích từng số (−3 xóa +1 T2-174's log).
- **F-175-T2-7 — Run 174 SUCCEEDED 02:24:03Z (số liệu; kết cục
  thuộc T7-175).** Wall gốc 10.092 s, trước hạn 708 s,
  claimed→finished 11 s (claimed_at DB hiện tại 02:23:52Z khác
  T7-174 ghi 23:36:04Z — mẫu F-173-T0-3; F-175-T0-3). Run 175
  (đợt này): T0-175 ghi jitter 0 s; run 175 bị viết lại lần 1
  tại #87 (started_at 02:35:51Z → 03:06:45Z; kết cục thuộc T7-175).
- **F-175-T2-8 — T4-175: attempt1 MỞ 03:17:47Z trên boot #87
  (gate0 T4-check-only pb_age=2 + gateA RAM 1887 MB; đã dùng 0/3)
  và ĐÓNG 03:21:38Z — 20/20 + LOP B ĐẠT 5/5 + tickCost median
  41,0 ms ≤ 60 — LƯỢT HỢP LỆ, poller thoát** (lượt yên hợp lệ
  #44 — chuỗi lượt yên hợp lệ 37 → 38); trước đó 0 attempt trên cả
  hai boot (poll #1–#33 trên 70b7f7ee, poll #1–#15 trên ca31fac1).
  POSTBOOT_PASS #87 CHƯA CÓ lúc T2 viết (chờ T5-175/watcher-175).
- **F-175-T2-9 — (m) #87 DƯƠNG ở cấp T2, parent quyết cuối
  (caveat nặng hơn #86).** Offset btime +39,864 s — KHÔNG sát biên
  (cách biên dưới 6,864 s, biên trên 9,936 s) — nhưng verdict
  KHÔNG bền với neo watcher (+7 s → +32,864 s, DƯỚI dải chỉ
  0,136 s — hụt nhỏ nhất từng ghi) và neo sampler (+16 s →
  +23,864 s); bền với neo T4-poller (−8 s → +47,864 s). Số hiệu
  #87 CHƯA được T0 xác minh 9 nguồn (chờ T0-176). Nếu chấp nhận:
  n ứng viên 33/34 → 34/35 (n chính thức GIỮ 14). Phân số boot_est
  chưa có nhưng không thể đổi verdict (±1 s).
- **F-175-T2-10 — INSIDE #87 TRUE (FULL133), chuỗi dài 6.**
  Hai dải MÂU THUẪN (FULL132 NGOÀI, muộn 5.970 s — lớn thứ hai
  trong các lần mâu thuẫn, sau #82 7.348 s); dải phương pháp
  FULL133 chi phối theo F-165-T2-1. Mâu thuẫn cùng dạng #86 (dải
  cũ kết thúc 01:26:35Z trước khi #87 xảy ra 03:06:05Z).
- **F-175-T2-11 — Guard giết script nặng đúng lúc attempt mở.**
  Xem §6.1 (bài học mới).

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 175)

- **(a) (m) #86 DƯƠNG — chấp nhận?** (requeue +49,418 s, sát biên
  TRÊN 0,382 s — sát biên nhất từng ghi; 1 run sống; verdict KHÔNG
  bền với neo watcher +36 s (counterfactual +13,418 s dưới dải —
  neo muộn nhất từng ghi); caveat phân số F-175-T0-4 +48,521 s vẫn
  trong dải, hướng có lợi.) Nếu chấp nhận: n ứng viên 32/33 → 33/34.
- **(b) INSIDE #86 TRUE — chấp nhận chuỗi dài 5?** (FULL132;
  mâu thuẫn hai dải: FULL131 NGOÀI, muộn 5.595 s — dải phương pháp
  chi phối theo F-165-T2-1.)
- **(c) Mù #96? VẪN MỞ — chấp nhận giữ mở?** (R file 1.238 s lần
  thứ 11 không đổi; R union-A 1.222 s / union-B 1.211 s; U union
  1.118 s cách sàn 29 s; sessions 0 hoạt động thật ở #64–#86.)
- **(d) Mù #88? VẪN MỞ — chấp nhận?** (hole-recheck lần 19:
  337 hit, 0 mốc mới, lần thứ 19 liên tiếp; các hố khác đều NEW=0,
  kể cả H-U15 mới.)
- **(e) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều kiện?**
  (lần thứ 18 không thu hẹp; 11 hướng mới đều âm tính/rỗng,
  tổng 62 hướng.) n chính thức GIỮ 14.
- **(f) Tuân thủ luật script nặng (0 vi phạm — xem §4.2) — ghi nhận?**
- **(g) EPERM probe #93 + sweep #93 (0 sóng thật) — ghi nhận?**
  (Probe ok=2 fail=0, boot 70b7f7ee; sweep 187 log, 20 marker —
  tất cả trích dẫn lại, 0 sóng thật.)
- **(h) Run 174 SUCCEEDED 02:24:03Z (trước hạn 708 s, cf 11 s) —
  ghi nhận cho T7-175?** (Không phải verdict của T2.)
- **(i) T0-175: #86 XÁC NHẬN 9 nguồn; marker 38 reboot; O8 trên #86
  WebKit PASS 21/21 ×2 + Chromium PASS 21/21; POSTBOOT_PASS #86
  ĐÃ CÓ 02:40:29Z (replay-đầy-đủ, poll=0) — ghi nhận?** (Thuộc
  T0/T5-175.)
- **(j) (m) #87 DƯƠNG — chấp nhận?** (requeue +39,864 s, KHÔNG sát
  biên theo btime; 1 run sống; verdict KHÔNG bền với neo watcher
  +7 s (counterfactual +32,864 s, DƯỚI dải chỉ 0,136 s — hụt nhỏ
  nhất từng ghi) và neo sampler +16 s; bền với neo T4-poller −8 s;
  số hiệu #87 CHƯA được T0 xác minh — chờ T0-176.) Nếu chấp nhận:
  n ứng viên 33/34 → 34/35.
- **(k) INSIDE #87 TRUE — chấp nhận chuỗi dài 6?** (FULL133;
  mâu thuẫn hai dải: FULL132 NGOÀI, muộn 5.970 s — dải phương pháp
  chi phối theo F-165-T2-1.)
