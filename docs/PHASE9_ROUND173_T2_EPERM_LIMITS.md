# PHASE 9 — ROUND 173 — T2 EPERM LIMITS

**T2 đợt 173** — EPERM probe #91, phân loại (m) #82 (chính), sơ bộ (m) #83/#84,
INSIDE #82/#83/#84, mù #96?/#88?/#94?/#95?/#77?, (m) #56 lần 16, F-172-T5-1.
Đợt 173 mở 03:35:51 +07 23/11/2026 = 20:35:51Z 22/11. Boot lúc viết: dd08464a
(#83, btime 20:25:47Z) — rồi **reboot #84 (boot 4ae2d2ea, btime 21:01:15Z)
xảy ra GIỮA đợt** (xem §1.3). Số hiệu #83/#84 chờ T0 xác minh 9 nguồn
(T0-173 cho #83, T0-174 cho #84) — T2 KHÔNG tự chứng nhận số hiệu nào.

## §0. Headline

- **(m) #82: DƯƠNG ỨNG VIÊN — parent quyết cuối.** Requeue duy nhất
  eid 10167, run 172, 19:01:26.438Z = btime +38,438 s ∈ [33; 49,8]
  (cách biên dưới 5,438 s, biên trên 11,362 s). 1 run sống tại btime.
  Khớp lean T7-172. **Nếu chấp nhận: n ứng viên 29/30 → 30/31.**
- **(m) #83: KHÔNG PHẢI ĐIỂM (sơ bộ).** 0 requeue + 0 run sống tại btime.
  Phân loại cuối thuộc T2-174 + parent 174.
- **(m) #84: DƯƠNG ỨNG VIÊN (sơ bộ)** — reboot giữa đợt, btime 21:01:15Z,
  requeue eid 10197, run 173, 21:02:00.482Z = btime +45,482 s ∈ [33; 49,8]
  (cách biên dưới 12,482 s, biên trên 4,318 s). 1 run sống tại btime.
  Phân loại cuối thuộc T2-174 + parent 174.
- **INSIDE #82: TRUE** (dải FULL128) — **chuỗi MỚI BẮT ĐẦU tại #82, dài 1**
  (sau khi đứt từ #80, dài 0). Dải FULL127 còn hiệu lực nói NGOÀI (muộn
  7.348 s) — **hai dải MÂU THUẪN** (như #79); dải phương pháp FULL128
  chi phối theo kỷ luật nhãn (F-165-T2-1). FULL127 kiểm lại độc lập: PASS
  — **nợ F-171-T10-7 ĐÃ TRẢ.**
- **INSIDE #83 sơ bộ: TRUE** (FULL129) — chuỗi dài 2 nếu xác nhận.
  **INSIDE #84 sơ bộ: TRUE** (FULL130) — chuỗi dài 3 nếu xác nhận.
- **Mù #96? VẪN MỞ** — đoạn R 1.238 s (file) / 1.222 s (union-A) /
  1.211 s (union-B), **lần thứ CHÍN liên tiếp không đổi một giây**.
  U union-A/B 1.118 s — ĐÓNG theo union, **VẪN cách sàn 1.147 s đúng
  29 s** (không đổi). **Mù #88? VẪN MỞ** — hole-recheck lần 17:
  337 hit, **0 mốc mới** (lần thứ mười bảy liên tiếp).
  Mù #95?/#94?/#77? giữ nguyên. **CERT/FULL GIỮ 76/91.**
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 16 không thu hẹp** (7 hướng MỚI:
  3 âm tính theo dữ liệu, 3 rỗng theo cấu trúc, 1 bị chặn bởi reboot #84).
  Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s GIỮ NGUYÊN.
  **n chính thức GIỮ 14.**
- **EPERM probe #91: ok=2 fail=0** (20:44:34Z, boot dd08464a).
  Sweep #91: 156 file *.log, 3 file có hit, 11 occurrence — **0 sóng thật**.
  Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **F-172-T5-1: ĐÃ GIẢI THÍCH** (xem §4.2) — cơ chế container
  stop/start overlap, 4 reboot liên tiếp có bằng chứng; #84 có BA tiến
  trình cũ viết qua btime (+5/+9/+21 s) — OVERLAP thứ mười một.
- Run 172 SUCCEEDED 20:16:59.553Z (eid 10185), claimed→finished
  109,553 s (≈110 s) — ca thứ năm ≥60 s. Kết cục thuộc T7-173.

## §1. Điểm (m)

### §1.1 (m) #82 — DƯƠNG ỨNG VIÊN (chính, đối chiếu độc lập)

- **Btime #82: 19:00:48Z** (epoch 1795374048), boot 34e61c92, gap #81→#82
  = 7.123 s. T7-172 xác minh 9 nguồn (aggregate 172 §7: /proc/1
  19:01:00.012Z +12,012 s; journal first entry 19:01:00Z +12 s; wtmp
  begins 19:01:00Z +12 s; uptime -s 19:00:48Z; Cloudflare ±1 s).
  T10-172 đóng sổ trên boot 34e61c92. T2-173 kẹp btime độc lập bằng
  sampler-172 (dòng 4b9db449 cuối 19:00:47Z = btime −1 s; dòng 34e61c92
  đầu 19:02:19Z = btime +91 s) + watcher-172 (poll cuối 19:01:11Z =
  btime +23 s — OVERLAP thứ chín, xem §4.2).
- **Requeue duy nhất** trong cửa hẹp [19:00:48Z, 19:19:43Z] VÀ cửa mở
  rộng [19:00:48Z, 20:00:00Z] (mọi job): **eid 10167, run 172
  (b12b8a64), 19:01:26.438Z = btime +38,438 s ∈ [33; 49,8]**
  (cách biên dưới 5,438 s, biên trên 11,362 s). Khớp lean T7-172.
- Run 172: đúng 5 event — dispatched 17:35:51.077Z eid 10145;
  requeued 19:01:26.438Z eid 10167; dispatched 19:01:26.572Z eid 10168;
  reattached 19:01:26.639Z eid 10169; **succeeded 20:16:59.553Z
  eid 10185**. Bị viết lại 1 lần tại #82: started_at
  1795368951 → 1795374086 (+5.135 s); boot_gen
  cron_boot_307b8432877842edbcb8ee5d0224ed91 (#82); attempt 1;
  timed_out false.
- **Đúng 1 run sống tại btime #82** (event-based, mọi job, không lọc
  sched): run 172. Spanning theo started_at (3h trước btime) = 0 dòng
  — artifact viết-lại-tự-loại (như #81).
- 6 event trong cửa hẹp (3 của run 172 + reconciled 19:15:34Z eid 10170
  + heartbeat dispatched+succeeded 19:15:34Z eid 10171/10172). 3 event
  ngay trước btime [18:50:00Z, 19:00:48Z): reconciled 19:00:00Z
  eid 10164 + deterministic-doctor dispatched+succeeded 19:00:00Z
  eid 10165/10166.
- **Lệch khung:** watcher-172 poll cuối btime +23 s (OVERLAP thứ chín);
  counterfactual khung cũ cho offset requeue +15,438 s (DƯỚI dải) —
  nhưng theo quy tắc đứng (quyết (e) đợt 165) + tiền lệ #71, offset
  btime-tương đối +38,438 s chi phối → verdict không đổi.
- **Run 172 kết cục** (số liệu; kết cục thuộc T7-173): SUCCEEDED
  20:16:59.553Z (eid 10185); claimed 20:15:10Z → finished
  109,553 s (≈110 s) — ca thứ năm ≥60 s sau 164 (66 s), 166 (64 s),
  167 (108 s), 171 (82 s); run 170 cũng 110 s. Wall từ start gốc
  9.668,476 s; margin tới hạn 20:35:51Z 1.131,447 s; attempt 1;
  timed_out false.
- **Phán: (m) #82 DƯƠNG ỨNG VIÊN — parent quyết cuối. Nếu chấp nhận:
  n ứng viên 29/30 → 30/31.** (m) #81 đã CHẤP NHẬN DƯƠNG ở đợt 172
  (quyết (e)) — KHÔNG mở lại.

### §1.2 (m) #83 — KHÔNG PHẢI ĐIỂM (sơ bộ)

- **Btime #83: 20:25:47Z** (epoch 1795379147), boot dd08464a, gap #82→#83
  = 5.099 s. T2-173 đọc trực tiếp /proc/stat + uptime -s; T0-173 đang
  xác minh 9 nguồn (survey tới §9 lúc 20:56Z: /proc/1 20:25:59.680Z
  +12,68 s; journal first entry 20:26:00Z +13 s; wtmp begins 20:25:59Z
  +12 s). Số hiệu #83 chờ T0-173 chứng nhận.
- **0 requeue** trong cửa hẹp [20:25:47Z, 20:44:42Z] (mọi job).
  5 event trong cửa hẹp (reconciled 20:35:51Z eid 10186; dispatched
  run 173 20:35:51.082Z eid 10187; reconciled 20:41:54Z eid 10188;
  feed-pulse-03 dispatched+succeeded 20:41:54Z eid 10189/10190).
- **0 run sống tại btime #83** (event-based): run 172 succeeded
  20:16:59Z = btime −528 s; run 173 dispatched 20:35:51Z = btime
  +604 s; deterministic-doctor finished 20:00:00Z; heartbeat finished
  20:15:34Z. 4 event ngay trước btime [20:15:00Z, 20:25:47Z):
  reconciled 20:15:34Z eid 10182 + heartbeat 20:15:34Z eid 10183/10184
  + succeeded run 172 eid 10185.
- Kiểm lại cửa mở rộng [20:25:47Z, 21:30:00Z]: đúng 1 requeue —
  eid 10197 lúc 21:02:00.482Z, là **requeue của #84** (run 173, offset
  +45,482 s từ btime #84; offset từ btime #83 sẽ là +2.173,482 s —
  xa ngoài dải). **0 requeue thuộc về #83.**
- **Sơ bộ: (m) #83 KHÔNG PHẢI ĐIỂM (0 requeue + 0 run sống).**
  Phân loại cuối thuộc T2-174 + parent 174.

### §1.3 (m) #84 — DƯƠNG ỨNG VIÊN (sơ bộ; reboot giữa đợt)

- **Reboot #84 xảy ra GIỮA đợt 173** (trong lúc T2 đang chạy m56-173.py).
  T4 poll #26 lúc 21:01:36Z còn ghi boot dd08464a; T2 phát hiện boot
  mới 21:04:14Z. **Btime #84: 21:01:15Z** (epoch 1795381275),
  boot 4ae2d2ea, gap #83→#84 = 2.128 s. T2-173 tự xác minh 8 nguồn
  trực tiếp: boot_id + btime (/proc/stat) + uptime -s 21:01:15Z +
  /proc/1 21:01:27.309Z (+12,309 s) + journal idx 0 first entry
  21:01:27Z (+12 s) + wtmp begins 21:01:27.868Z (+12,868 s) + last
  reboot 21:01 still running + who -b 21:01. Số hiệu #84 chờ T0-174
  chứng nhận 9 nguồn — T2 KHÔNG tự chứng nhận số hiệu.
- **Requeue duy nhất** trong cửa hẹp [21:01:15Z, 21:20:10Z] (mọi job,
  kiểm lại ĐẦY ĐỦ sau 21:20:10Z): **eid 10197, run 173 (d95c3e04),
  21:02:00.482Z = btime +45,482 s ∈ [33; 49,8]** (cách biên dưới
  12,482 s, biên trên 4,318 s).
- Run 173: 4 event tới lúc đọc — dispatched 20:35:51.082Z eid 10187;
  requeued 21:02:00.482Z eid 10197; dispatched 21:02:00.779Z eid 10198;
  reattached 21:02:00.905Z eid 10199. Bị viết lại 1 lần tại #84:
  started_at 1795379751 → 1795381320 (+1.569 s); boot_gen
  cron_boot_a6a30a368e814e418d0eb6b8c21dc134 (#84); attempt 1; status
  running (kết cục thuộc T7-174).
- **Đúng 1 run sống tại btime #84** (event-based): run 173. 6 event
  trong cửa hẹp (3 của run 173 + reconciled 21:15:34.068Z eid 10200 +
  heartbeat dispatched+succeeded 21:15:34.121Z/177Z eid 10201/10202)
  — cùng dạng cửa hẹp #82 (6 event). 3 event ngay trước btime
  [20:50:00Z, 21:01:15Z): reconciled 21:00:00Z eid 10194 +
  deterministic-doctor dispatched+succeeded 21:00:00Z eid 10195/10196
  (doctor xong 75 s TRƯỚC btime).
- **Lệch khung:** BA tiến trình cũ viết qua btime #84 — sampler-173
  +5 s, watcher-173 +9 s, T4 poll-wait +21 s (OVERLAP thứ mười một,
  xem §4.2). Counterfactual: neo sampler +5 s → offset +40,482 s
  (TRONG dải); neo watcher +9 s → +36,482 s (TRONG dải); neo T4-poller
  +21 s → +24,482 s (DƯỚI dải). Theo quy tắc đứng + tiền lệ #71,
  offset btime-tương đối +45,482 s chi phối. **Khác #81: verdict #84
  BỀN với neo sampler/watcher** (cả hai vẫn trong dải); chỉ neo muộn
  nhất (T4-poller +21 s) đẩy xuống dưới — cùng dạng #71.
- **Sơ bộ: (m) #84 DƯƠNG ỨNG VIÊN.** Phân loại cuối thuộc T2-174 +
  parent 174. **Nếu #82 và #84 cùng được chấp nhận: n ứng viên
  29/30 → 31/32** (n chính thức vẫn GIỮ 14 — xem §4.1).

### §1.4 (m) #81 / #80 — chỉ tham chiếu, KHÔNG mở lại

- #81: parent đã CHẤP NHẬN DƯƠNG (quyết (e) đợt 172, +33,477 s, caveat
  estimator phân số ≈ +32,85 s — nếu hiệu chuẩn sau chứng minh
  estimator phân số đúng thì quyết này cần xem lại). KHÔNG mở lại.
- #80: T2-171 phán KHÔNG PHẢI ĐIỂM (0 requeue; 0 run sống); quyết (e)
  đợt 171 vẫn chờ parent. KHÔNG mở lại.

## §2. INSIDE — dải FULL127/128/129/130

Script: `blind9696-gaps173.py` (exec `blind9696-gaps172.py`, log
`gaps173.log`). Quy ước đứng (F-165-T2-1): dải cho reboot #k là
FULL(110+k−64) neo btime #(k−1); mỗi dải gồm gap kết thúc tại neo của
nó. Dải cũ chỉ để đối chiếu.

- **FULL127 kiểm lại độc lập: PASS** — p10/p90 1572,60/8839,80 s khớp
  T2-172 bằng `statistics.quantiles` method='inclusive' VÀ nội suy
  chỉ số-sắp xếp viết mới VÀ giá trị chuỗi. Danh sách FULL127 khớp
  chain (FULL125 n=125 → +11996 → FULL126 n=126 → +9064 → FULL127
  n=127). **Nợ F-171-T10-7 ĐÃ TRẢ.**
- **FULL128**: n=128, mean 1h40'42", median 1h53'59", p10 1574,20 s,
  p90 8836,60 s, sd 0h55'29", min 0h00'55", max 5h43'18",
  in 90–150'=68, <60'=30, >180'=9, >240'=3
  (= FULL127 + [gap #81 = 7.123 s]).
- **INSIDE #82: TRUE** — dải FULL128 [17:28:19Z, 19:29:21Z] neo btime
  #81 17:02:05Z; btime #82 19:00:48Z TRONG dải, cách biên dưới 5.549 s,
  cách biên trên 1.713,6 s. **Chuỗi MỚI BẮT ĐẦU tại #82, dài 1.**
  Đối chiếu vs FULL127 còn hiệu lực: NGOÀI (muộn 7.347,2 s) — **hai
  dải MÂU THUẪN** (khác #81 nơi hai dải đồng thuận NGOÀI; giống #79);
  dải phương pháp FULL128 chi phối theo kỷ luật nhãn (F-165-T2-1).
- **FULL129 sơ bộ**: n=129, mean 1h40'35", median 1h53'42",
  p10 1575,80 s, p90 8833,40 s, sd 0h55'17",
  in 90–150'=68, <60'=30, >180'=9, >240'=3
  (= FULL128 + [gap #82 = 5.099 s]).
- **INSIDE #83 sơ bộ: TRUE** — dải FULL129 [19:27:03Z, 21:28:01Z] neo
  19:00:48Z; btime #83 20:25:47Z TRONG dải, cách biên 3.524 s /
  3.734,4 s. Chỉ sơ bộ (số hiệu #83 chờ T0-173; quyết cuối thuộc
  T2-174 + parent 174). Nếu xác nhận, chuỗi dài 2.
- **FULL130 sơ bộ**: n=130, mean 1h40'05", median 1h53'21",
  p10 1577,40 s, p90 8830,20 s, sd 0h55'22",
  in 90–150'=68, <60'=31, >180'=9, >240'=3
  (= FULL129 + [gap #83 = 2.128 s]).
- **INSIDE #84 sơ bộ: TRUE** — dải FULL130 [20:52:04Z, 22:52:57Z] neo
  20:25:47Z; btime #84 21:01:15Z TRONG dải, cách biên dưới 551 s,
  cách biên trên 6.702,2 s. Chỉ sơ bộ (số hiệu #84 chờ T0-174; quyết
  cuối thuộc T2-174 + parent 174). Nếu xác nhận, chuỗi dài 3.
  Lưu ý: biên dưới chỉ 551 s — gần biên dưới nhất trong ba dải đợt này.
- Tốc độ reboot: tới #82: 158 reboot / 286,71 h = 1 lần / 108,9 phút;
  tới #83: 159 / 288,13 h = 1 lần / 108,7 phút; tới #84: 160 /
  288,72 h = 1 lần / 108,3 phút.

## §3. Mù

### §3.1 Mù #96? (#64) — VẪN MỞ (lần thứ chín không đổi)

B1 quét = 20:52:00Z (giờ chạy thực tế, F-172-T2-12). Walk 20:51:06–
20:52:46Z. Script `blind9696-investigate.py` / `blind9696-merged.py` /
`blind9696-content.py` / `blind9696-sessions.py` (log tương ứng).

- Đếm file mtime trong cửa sổ [11:15:18Z 21/11, 20:52:00Z 22/11]:
  repo-1 147 (đợt 172: 133), hidden_files 4.493 (4.021), ngoài cây
  1.906 (1.854), /tmp 803 (1.408 — tmpfs bị #82/#83 xóa rồi tạo lại
  bởi đợt 173), fifth 16. Merged **3.144 mốc giây duy nhất**
  (đợt 172: 2.805).
- **R: file 1.238 s / union-A 1.222 s / union-B 1.211 s — MỞ, Y HỆT
  T2-171/T2-172, lần thứ CHÍN liên tiếp không đổi một giây.**
  S: file 3.235 s / union-A 662 s / union-B 591 s — ĐÓNG theo union.
  T: file 627 s / union-A 38 s — ĐÓNG.
  **U: file 2.335 s / union-A 1.118 s (11:19:20→11:37:58) / union-B
  1.118 s — ĐÓNG theo union, VẪN cách sàn 1.147 s đúng 29 s
  (không đổi).** Biến thể +dispatch 11:35:51Z: 1.211 s — cũng MỞ.
- Hố file U mới trong top 8: **1.787 s (19:04:19→19:34:06Z 22/11)**
  → hố mới H-U13 (nằm trong phần U mở rộng [18:00, 20:52]).
- R-head 0/0/0/0/0 mọi scope; R-tail repo-1=2 / hidden_files=51 /
  outside=2 / tmp=0 — y hệt đợt 172. Mốc dpkg 11:35:40Z trong hố R
  vẫn là mốc nội dung thật (T0-162 quan sát trực tiếp).
- Nội dung sampler/watcher (content.py đã cập nhật SYS82/SYS83):
  sampler-172 FULL — 4b9db449 83 dòng (17:38:45Z→19:00:47Z; dòng cuối =
  btime #82 −1 s, KHÔNG overlap sampler tại #82) + 34e61c92 85 dòng
  (19:02:19Z→20:26:20Z; dòng cuối = btime #83 **+33 s — OVERLAP
  thứ mười**). Watcher-172 FULL — 142 strict poll (17:41:39Z→
  19:01:11Z; poll cuối = btime #82 **+23 s — OVERLAP thứ chín**).
  Sampler-173: 12 dòng trong U ≤20:52:00Z (đầu 20:40:19Z = btime #83
  +872 s; khoảng không-sampler [20:26:20Z, 20:40:19Z] = 839 s chứa
  #83 — caveat cho T9-173, cùng mẫu #81 3.255 s). Watcher-173: 19
  strict poll ≤20:52:00Z (START 20:42:50Z pid 13457; replay #83
  đang chạy, dpkg 323 dòng lúc 20:52:54Z). SYS82 = 19:01:00Z
  (T7-172 9 nguồn); SYS83 = 20:25:59Z (T0-173: wtmp +12 s, journal
  +13 s, /proc/1 +12,68 s).
- **Verdict: #96? VẪN MỞ (qua đoạn R). CERT/FULL GIỮ 76/91.**

### §3.2 Sessions / jump witness — 0 hoạt động thật ở mọi reboot

- 305 exec-log trong cửa sổ (đợt 172: 328 — 23 file bị xóa giữa hai
  đợt). Dir exec-log của chính phiên tôi (agent
  eb0e8340-80fc-47e0-81e0-053a6edd7c8c) đã loại khỏi walk theo bài học
  F-172-T2-3 — chỉ có 1 file `proc_7f84cbd96907.log` (lệnh find bị
  kill, 232 byte, không chứa timestamp) nên việc loại không đổi số liệu.
- Số THẬT sau khi trừ 2 artifact của T2-172 (cùng agent 7b0156bc:
  `proc_506c2c48e69a.log` + `proc_2a68c5ee9e4f.log` — file sau là
  output hole-recheck của T2-172, trích deadline 19:30:00Z + lo
  19:32:59Z, tạo sau lần chạy sessions của T2-172 nên đợt trước chưa
  trừ; đã kiểm nội dung trực tiếp) và 1 trích dẫn aggregate-171
  (`proc_498dc39ec461.log`, agent 7d2dea21, span 14:31:01→17:07:10
  toàn trích dẫn): **#64: 3, #65: 3, #66: 3, #67: 3, #68: 3, #69: 3,
  #70: 4, #71: 6, #72: 4, #73: 4, #74: 5, #75: 4, #76: 2, #77: 2,
  #78: 2, #79: 0, #80: 0, #81: 0, #82: 0, #83: 0.** Tất cả hit còn
  lại đều là file trích dẫn lâu đời — **0 hoạt động thật ở mọi
  reboot** (cùng kết luận đợt 172).
- File bị xóa giải thích số giảm #64–#68/#70: b70bb0edc372,
  82da543947c6, 2fbfe27779af, c540462a2ff4, cc179b1ce95a, d8b6351398eb,
  3c3d0c6723b7, fa64a6b73754, 6ceb333587e9.
- Content-ts trong hố R union (11:15:29–11:35:40): 3 hit
  (11:16:22Z ×3, y hệt đợt 172), 0 mốc mới. Content-ts trong hố file
  U max H-U12 (16:09:36–16:48:31): 3 hit tại 16:25:06Z (toàn file
  trích dẫn, gồm cả 2a68c5ee9e4f), 0 mốc mới.

### §3.3 Hole-recheck lần 17 — 0 mốc mới (lần thứ mười bảy)

- Find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp
  [19:32:59Z 20/11, 20:52:00Z 22/11]: **13.575 file** (đợt 172:
  12.537). Find stderr: 1 dòng (`/home/hatch/.stagged-uploads:
  Permission denied` — giới hạn đứng).
- **H-E1-88: 337 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI —
  lần thứ MƯỜI BẢY liên tiếp 0 mốc mới** (y hệt lần 9–16). Mọi hố
  khác: 0 mới. H-U13 mới: 2 inside = 2 trap (cạnh trái 19:04:19.162Z/
  165Z, probe-loop-82.sh +.out), 0 mới. H-T1/H-U1/H-U4 vẫn 0 hit
  (trap cũ đã mất theo file bị xóa).
- File `round172-t2/holerecheck-all.txt` md5 KHÔNG ĐỔI sau lần chạy
  (75a1e58af2a65ab497891ada7311d700). Output lần này ghi file MỚI
  trong `round173-t2/` (không ghi đè file cũ).
- **Mù #88? VẪN MỞ. Mù #95?/#94?/#77? giữ nguyên (không bằng chứng
  mới). CERT/FULL GIỮ 76/91.**

## §4. Mô hình đồng hồ + (m) #56 + F-172-T5-1

### §4.1 (m) #56 — lần thứ 16, KHÔNG THU HẸP (7 hướng MỚI)

Cửa D: [19:04:44Z, 20:22:43Z] 20/11/2026 = epochs 1795201484..
1795206163. Mốc max đã biết: 20:19:34.327Z (sessions.json agent
964f2bc4) / 20:19:34.532Z (DB run 156 finished). Cửa R [2,56251;
2,66817) / J [2,566; 2,80753] s (T2-160 §4.1): R ≥ 2,562 (từ file
session T10-156 mtime wall 20:16:36Z); #56 là điểm ÂM ⟺ R < 2,668
(run 156 còn chạy tại #56 ⟺ true-finish > 19:32:47Z).

- **(i) DB bảng phi-scheduler (MỚI):** `agent.sessions` — 0 session
  created trong D. `runtime.requests` — 167 request created trong D,
  max **20:22:35.041Z** (maintenance:e033d2dd…:context_retention:
  phase-29920103; 5 mốc mới nhất 20:20:35–20:22:35Z, cách nhau
  ~27–33 s). **ÂM TÍNH — không thu hẹp:** dòng maintenance chạy
  liên tục QUA D1 (request đầu sau D1: 20:23:24.170Z) nên D1 không
  phải biên hoạt động; đây là traffic nền định kỳ cho session
  e033d2dd (session sống dài), không liên quan tới neo R (session
  T10-156 mtime 20:16:36Z; true-finish run 156 vs btime #56
  19:32:47Z). Mốc 20:22:35Z chỉ là request cuối trước mốc cắt D1
  tùy ý — không ràng buộc R.
- **(ii) Chromium History (MỚI): RỖNG theo cấu trúc** —
  `~/.config/chromium/` chỉ chứa "Crash Reports" (mtime 28/10),
  không có Default/ profile, không có History/Cookies/Preferences.
  Máy này không có dữ liệu lịch sử trình duyệt.
- **(iii) Shell/voice history (MỚI): ÂM TÍNH** — `~/.bash_history`,
  `~/.zsh_history`, fish history đều KHÔNG TỒN TẠI;
  `~/workspace/voices/.voice_history.jsonl` tồn tại (mtime
  18/11, trước D), 0 ISO timestamp + 0 epoch-like stamp trong D.
- **(iv) systemd timer stamps (MỚI): RỖNG theo cấu trúc** —
  `/var/lib/systemd/timers/` KHÔNG TỒN TẠI.
- **(v) /var/log/apt content (MỚI): BỊ CHẶN — KHÔNG KIỂM ĐƯỢC đợt
  này.** Lúc 21:00:54Z tôi xác nhận history.log (14.783 byte),
  term.log, eipp.log.xz TỒN TẠI (mtime 20:50Z — từ replay của #83);
  reboot #84 (~21:01:15Z) đã xóa `/var/log/apt/` trước khi script
  m56 chạy (~21:02:30Z). Không đếm là âm tính; hướng này vẫn mở
  cho đợt sau (nhưng lưu ý: log apt của #83 chỉ chứa hoạt động
  22/11, gần như chắc chắn không có entry 20/11 — dpkg.log reset
  theo boot đã quan sát nhiều lần).
- **(vi) VS Code state.vscdb (MỚI): RỖNG theo cấu trúc** —
  `~/.config/Code` KHÔNG TỒN TẠI.
- **(vii) mtime scan ~/workspace trong D (MỚI): ÂM TÍNH** — 333 file,
  max mtime **20:15:33.131Z** (`round156-t10.done` — cờ đóng của
  T10-156), THẤP HƠN mốc max đã biết 20:19:34.326Z đúng 241 s.
- Mốc max đã biết ĐÃ XÁC NHẬN CÒN SỐNG trên đĩa:
  `/home/hatch/agents/agent-964f2bc4-…/sessions/964f2bc4-….jsonl`
  mtime 20:19:34.326Z (atime 20:17:31.130Z). Lưu ý: file này nằm
  dưới `/home/hatch/agents/`, NGOÀI `~/workspace` — nên scan (vii)
  không thấy nó; không mâu thuẫn với max 20:15:33Z của (vii).
- **Kết luận: cửa GIỮ NGUYÊN R ∈ [2,56251; 2,66817), J ∈ [2,566;
  2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức (ứng viên) GIỮ 14.**
  Tổng 43 hướng âm tính liên tiếp (36 tới đợt 172 + 7 hướng mới đợt
  này, tính cả 3 rỗng theo cấu trúc + 1 bị chặn — chỉ 3 hướng âm tính
  theo dữ liệu thuần: (i), (iii), (vii)).

### §4.2 F-172-T5-1 — poll cuối watcher-171 SAU btime #81 20 s: ĐÃ GIẢI THÍCH

- Đọc `replay-watch-172.sh`: timestamp `ts=$(date)` lấy ở ĐẦU mỗi vòng
  poll, boot_id đọc ngay trước đó (cách nhau mili-giây) — nên **thứ tự
  đọc boot_id → timestamp trong script KHÔNG giải thích được +20/+23 s**.
- Bằng chứng mới đợt 173 — **bốn reboot liên tiếp đều có overlap**:
  #81: watcher-171 +20 s; #82: watcher-172 +23 s (sampler −1 s);
  #83: sampler-172 +33 s; **#84: BA tiến trình cũ cùng viết qua btime
  — sampler-173 +5 s, watcher-173 +9 s, T4 poll-wait +21 s**
  (OVERLAP thứ mười một).
- **Giải thích có căn cứ (không phải chứng minh tuyệt đối): container
  stop/start overlap.** Btime mới được ghi khi container mới khởi động
  TRONG LÚC container cũ vẫn đang tắt dần (grace period); tiến trình
  boot cũ sống thêm ~5–33 s sau btime mới rồi mới bị giết. Thời gian
  sống sót khác nhau theo tiến trình (sampler-172: −1 s tại #82 nhưng
  +33 s tại #83; watcher-172 +23 s; T4 poller +21 s). **Btime đánh
  dấu lúc boot MỚI bắt đầu, KHÔNG phải lúc boot CŨ chết** — cận trên
  "boot cũ chết" từ btime là không chắc chắn, đúng như gợi ý của task.
- Hệ quả cho (m): xem §1.1/§1.3 — counterfactual khung cũ được ghi
  rõ, verdict theo quy tắc đứng (offset btime-tương đối chi phối).
- Liên quan: pid watcher-172 lệch giữa T5 (17944) và T6 (6126) — giao
  T5/T6-173 đối chiếu (F-172-T6-5), không thuộc T2.

### §4.3 T4-173 (theo dõi để tránh cửa sổ attempt)

- T4 chỉ gate-polling, **chưa có attempt nào** tới poll #26 lúc
  21:01:36Z (gate0 chưa đạt, POSTBOOT_PASS #83 vẫn là cờ cũ,
  postboot_exit=1, dpkg_lines=323 đứng yên từ 20:52:54Z, RAM 849–
  1.856 MB, poll mỗi 45 s). Reboot #84 giết poller cũ (poll #26
  chính là OVERLAP +21 s); poll-wait KHỞI ĐỘNG LẠI 21:02:28Z trên
  boot mới (chain-t4.log), poll #3–#13 tới 21:11:30Z vẫn gate0 chưa
  đạt, dpkg_lines=2 (boot mới). **POSTBOOT_PASS #83 KHÔNG BAO GIỜ
  ĐƯỢC VIẾT** (gate0 chưa đạt trước khi #84 tới) — thuộc T4/T5-173.
  Tôi đã kiểm chain-t4.log trước mỗi script nặng (walk,
  hole-recheck, sessions, gaps, content, sweep, m56).

## §5. EPERM probe #91 + sweep

- **Probe #91: chạy 20:44:34Z, boot dd08464a, ok=2 fail=0, exit 0.**
  Log `hidden_files/eperm-probe-v2.log` 260 → 262 dòng (+1 boot-changed
  4b9db449 → dd08464a, +1 probe#91); heartbeat n=91.
  **MemAvailable lúc probe: 788.528 kB** (chụp cùng lệnh probe —
  bài học F-172-T2-7). Cửa sổ probe #91: 17:39:15Z (#90) → 20:44:34Z
  = 11.119 s. Dòng boot-changed nhảy qua #82 (không có probe nào
  chạy trên #82). Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
- **Sweep #91** (script `eperm-sweep9696.py`, log `eperm-sweep173.log`):
  156 file `*.log` có mtime trong cửa sổ, **3 file có hit, 11
  occurrence** — toàn "sóng EPERM đã tắt" (10×) + 1× "Operation not
  permitted" (trong eperm-sweep172.log, trích kết quả sweep #90) —
  **0 sóng thật.** (Exec-log của chính phiên tôi không xuất hiện vì
  không chứa cụm "sóng EPERM đã tắt" — khác đợt 172.)
- Script probe: `~/workspace/repo-1/scripts/probe-eperm-v2.sh`; log +
  heartbeat tại `~/workspace/goals/capcut-clone-video-editor/
  hidden_files/eperm-probe-v2.log` / `.heartbeat`.

## §6. Phương pháp, sai số, câu hỏi cho parent

### §6.1 Phương pháp

- DB đọc tươi qua `muse.db` (bảng `scheduler.job_runs` +
  `scheduler.events`); `muse.db` từ chối `to_timestamp` — dùng
  literal `'YYYY-MM-DD HH:MM:SS+00'::timestamptz` +
  `EXTRACT(EPOCH FROM created_at)`. Mọi số (m) trong LIMITS này đều
  có trong script đối chiếu độc lập `m-check173.py` (log
  `m-check173.txt`) — epoch thô + phép trừ, không qua trung gian.
- INSIDE tính bằng `blind9696-gaps173.py` (log `gaps173.log`); FULL127
  kiểm lại độc lập bằng hai implementation (statistics.quantiles +
  nội suy chỉ số-sắp xếp viết mới) + giá trị chuỗi.
- Mù: B1 = giờ chạy thực tế (F-172-T2-12); đếm jump witness TRỪ
  exec-log của chính phiên (F-172-T2-3); kiểm `grep ^W =` /
  `grep ^hi =` trước khi chạy hole-recheck; output vào thư mục riêng,
  không ghi đè file cũ (F-166-T2-2); kiểm epoch GAP bằng `date -d`
  trước khi chạy sessions (F-172-T2-1/F-171-T2-2); chụp meminfo cùng
  lệnh probe (F-172-T2-7).
- Trước khi kết luận thread nào thiếu/mất, đã kiểm tra trên đĩa
  (sessions: 2 artifact T2-172 + 1 trích dẫn aggregate-171 đã trừ
  sau khi kiểm nội dung trực tiếp).

### §6.2 Sai số / caveat (F-173-T2-*)

- **F-173-T2-1 — (m) #82 KHÔNG CHỐT ở cấp T2.** Phán DƯƠNG ỨNG VIÊN
  (requeue +38,438 s, 1 run sống, spanning 0 là artifact) — parent
  quyết cuối. Nếu chấp nhận: n 29/30 → 30/31.
- **F-173-T2-2 — (m) #83/#84 + INSIDE #83/#84 đều SƠ BỘ.** Số hiệu
  #83 chờ T0-173, #84 chờ T0-174 chứng nhận 9 nguồn; phân loại cuối
  thuộc T2-174 + parent 174. Cửa hẹp #84 đã kiểm lại ĐẦY ĐỦ sau
  21:20:10Z (6 event, 1 requeue duy nhất — xem §1.3).
- **F-173-T2-3 — INSIDE #82: hai dải MÂU THUẪN.** FULL128 nói TRONG
  (chuỗi mới dài 1), FULL127 còn hiệu lực nói NGOÀI (muộn 7.348 s).
  T2 áp dụng kỷ luật nhãn F-165-T2-1 (dải phương pháp FULL128 chi
  phối), như tiền lệ #79. Nếu parent không đồng ý kỷ luật này, chuỗi
  vẫn đứt từ #80, dài 0.
- **F-173-T2-4 — (m) #56 hướng (v) BỊ CHẶN.** /var/log/apt bị reboot
  #84 xóa giữa lúc kiểm tra (21:00:54Z → ~21:02:30Z); hướng này chưa
  được kiểm đợt này — không đếm là âm tính. Hướng (ii)/(iv)/(vi)
  rỗng theo cấu trúc (không có dữ liệu để kiểm).
- **F-173-T2-5 — (m) #84: neo T4-poller +21 s đẩy counterfactual
  xuống dưới dải.** Verdict BỀN với neo sampler/watcher (+5/+9 s)
  nhưng KHÔNG bền với neo muộn nhất (+21 s). Theo quy tắc đứng +
  tiền lệ #71, offset btime-tương đối chi phối — nhưng parent cần
  biết biên này (tương tự caveat estimator phân số của #81).
- **F-173-T2-6 — Mù #96?: U cách sàn đúng 29 s, lần thứ 9 không đổi.**
  R không đổi một giây lần thứ 9 liên tiếp. Không có bằng chứng mới
  nào cho #95?/#94?/#77?/#88? (hole-recheck lần 17: 0 mới).
- **F-173-T2-7 — (1c') (c') GIỮ NGUYÊN diag-only; (f') V1 đã được
  chấp nhận ở đợt 172** (giao T8-173 triển khai + replay trên log
  đợt 172); **Q3 heartbeat 84l10** (giao T8-173). Không thuộc T2
  đợt này.
- **F-173-T2-8 — T4: 0 attempt trước #84; POSTBOOT_PASS #83 không
  bao giờ được viết.** Thuộc T4/T5-173, T2 chỉ ghi nhận.

### §6.3 Câu hỏi cho parent (quyết §12.3 aggregate 173)

- **(a) (m) #82 DƯƠNG ỨNG VIÊN — chấp nhận?** (requeue +38,438 s,
  1 run sống; counterfactual khung cũ +15,438 s dưới dải — theo quy
  tắc đứng + tiền lệ #71, offset btime-tương đối chi phối.) Nếu
  chấp nhận: n ứng viên 29/30 → 30/31.
- **(b) INSIDE #82 — chấp nhận chuỗi MỚI BẮT ĐẦU tại #82, dài 1?**
  (FULL128 TRONG, FULL127 còn hiệu lực NGOÀI — mâu thuẫn; dải phương
  pháp FULL128 chi phối theo F-165-T2-1.)
- **(c) (m) #83 KHÔNG PHẢI ĐIỂM (sơ bộ) — ghi nhận?** (0 requeue +
  0 run sống; quyết cuối T2-174 + parent 174.)
- **(d) (m) #84 DƯƠNG ỨNG VIÊN (sơ bộ) — ghi nhận?** (+45,482 s;
  verdict bền với neo sampler/watcher, không bền với neo T4-poller
  +21 s — xem F-173-T2-5; quyết cuối T2-174 + parent 174.)
- **(e) INSIDE #83/#84 sơ bộ (chuỗi dài 2 → 3 nếu xác nhận) — ghi
  nhận?**
- **(f) Mù #96? VẪN MỞ — chấp nhận giữ mở?** (R không đổi lần thứ 9;
  U cách sàn đúng 29 s không đổi; H-U13 mới 1.787 s — 0 mốc mới.)
- **(g) Mù #88? VẪN MỞ — chấp nhận?** (hole-recheck lần 17: 337 hit,
  0 mốc mới — lần thứ mười bảy liên tiếp.)
- **(h) (m) #56 VẪN CÓ ĐIỀU KIỆN — chấp nhận giữ có điều kiện?**
  (lần thứ 16 không thu hẹp; 7 hướng mới: 3 âm tính theo dữ liệu,
  3 rỗng theo cấu trúc, 1 bị chặn bởi #84.) n chính thức GIỮ 14.
- **(i) F-172-T5-1 — chấp nhận giải thích container stop/start
  overlap làm lời giải thích đứng?** (4 reboot liên tiếp có bằng
  chứng; #84 có 3 tiến trình cũ viết qua btime.)
- **(j) EPERM probe #91 + sweep #91 (0 sóng thật) — ghi nhận?**
- **(k) Run 172 claimed→finished ~110 s (ca thứ năm ≥60 s) — ghi
  nhận cho T7-173?** (Không phải verdict của T2.)
- **(l) T4: 0 attempt trước #84; POSTBOOT_PASS #83 không bao giờ
  được viết — ghi nhận?** (Thuộc T4/T5-173.)

