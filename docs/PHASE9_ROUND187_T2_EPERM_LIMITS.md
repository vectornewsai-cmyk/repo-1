# PHASE 9 — ROUND 187 — T2 EPERM probe + (m)/INSIDE + mù

- Đợt 187, mở cron 03:35 +07 25/11/2026 (= 20:35:51Z 24/11). T2 viết ~21:36Z 24/11.
- Repo `~/workspace/repo-1`, branch main. CHỈ STAGE, KHÔNG PUSH, KHÔNG release/tag.
- Nguồn: aggregate 186 §12.3 (parent quyết 21:07Z, 107.950 B, SẠCH không điền sẵn,
  dedup python viết mới KHỚP TỪNG SỐ lần thứ 99); LIMITS T2-186; T5-187; T0-187;
  GAP §114/§115. Script: `hidden_files/round187-t2/`.

## §0. Tóm tắt (parent quyết cuối)

- **Số hiệu: parent-186 (e) CHẤP NHẬN cách đếm T0 — cea79500 = #107; #106 là reboot
  chưa xác minh (ước ~15:13:32Z, KHÔNG khẳng định btime); 7ea9d047 = #108;
  6f1d9f87 = #109.** Mọi nhãn dưới đây theo cách đếm A (đã quyết); cách đếm B chỉ
  ghi ở mục chéo.
- **(m) #107 (cea79500) KHÔNG CÓ ĐIỂM** (final ở T2). **(m) #108 (7ea9d047) DƯƠNG**
  (+39,438 s, trong [33; 49,8], caveat overlap +13/+16 s — tiền lệ direction-blind).
  **(m) #109 (6f1d9f87) KHÔNG CÓ ĐIỂM** (final ở T2 — cửa rộng đóng bởi boot #110).
- **INSIDE #107/#108/#109 (FULL153/154/155): KHÔNG TÍNH ĐƯỢC** theo quy ước đứng
  F-165-T2-1 — cả ba đều cần gap #106/#107, btime #106 chưa biết. Chuỗi INSIDE
  GIỮ 7 (từ #105 TRUE, parent-186 (d)) chờ #106 xác minh. Chéo cách đếm B
  (không phải chuỗi chính): FALSE / TRUE / TRUE.
- **Boot mới #110 (912f4a97, btime 21:13:21Z) giữa đợt** — gap #109→#110 chỉ 2.568 s;
  (m) thô DƯƠNG (+43,959 s) — thuộc T2-188 phân loại cuối, chỉ ghi số thô ở đây.
- **(m) #56 lần 30: VẪN CÓ ĐIỀU KIỆN** (5 hướng DB mới, tổng 120 — đều 0 dòng).
- **Mù #94?/#95?/#96?/#88?/#77? VẪN MỞ** (hole-recheck lần 31 NEW=0 mọi hố;
  R file 1.238 s lần 23 không đổi; U file-gap max 8.968 s KHÔNG ĐỔI;
  U union-B max ĐỔI 8.643 → 7.861 s — hiệu chỉnh phương pháp F-187-T2-3,
  KHÔNG phải hố mù mới). CERT/FULL GIỮ 76/91.
- **EPERM: probe #106 (6f1d9f87) ok=2 fail=0; probe #107 (912f4a97) ok=2 fail=0;
  sweep #106 + #107: 0 sóng thật** (chỉ trích dẫn).
- **Tuân thủ: 0 VI PHẠM** (mọi script nặng CHỜ poller T4 thoát hẳn — F-184-T2-8).
  Chuỗi 0 vi phạm đề xuất 2 → 3 nếu đợt 187 sạch (parent quyết §12.3-187).
- Run 187 FAILED 20:17:06Z (lần FAILED đầu sau 182–186 SUCCEEDED liên tiếp);
  claimed→finished 202 s ≥ 60 s — FLAG CA thuộc T7-187 (T2 chỉ ghi số).

## §1. (m) — phân loại cuối ở cấp T2, parent quyết cuối

Dải đứng [33; 49,8] s (offset = requeue − btime). `events.run_id`/`job_runs.run_id`
là UUID đầy đủ; cột `job_runs`: `scheduled_for_utc`/`started_at_utc`/`finished_at_utc`.

### (m) #107 — cea79500-8d3a-4f6c-9f2e-1c8a5d6e7f90, btime 17:19:50Z — KHÔNG CÓ ĐIỂM
- 0 requeue cửa hẹp [17:19:50Z, 17:38:50Z] (7 events) VÀ 0 requeue cửa rộng
  [17:19:50Z, 19:09:52Z] (DB tươi).
- Cả ngày 24/11: 8 requeue (eid 10580 #99, 10610 #100, 10637 #101, 10667 #102,
  10697 #103, 10724 run 184 daemon-restart, 10756 #105, 10818 7ea) — KHÔNG có
  requeue nào giữa 13:14:06Z và 19:10:31Z.
- 0 run vcut nào sống tại btime (run 186 finished 14:52:42Z; run 187 sched 17:35:51Z
  chưa bắt đầu). Sched-test trả 1 run feed-pulse-23 (f7ac870b, sched 16:41:54Z,
  started+finished 17:35:40Z SAU btime, dispatched post-reboot, succeeded,
  không requeue — không chạy tại btime). Tiền lệ #94. n không đổi.

### (m) #108 — 7ea9d047-963a-4dec-a864-643cf2f01c47, btime 19:09:52Z — DƯƠNG
- Requeue eid 10818, run 187 (887c998d), 19:10:31.437927Z = btime +39,438 s →
  TRONG [33; 49,8]: trên biên dưới 6,438 s, dưới biên trên 10,362 s.
- Caveat phân số: offset thật ∈ (38,438; 39,438] s — xấu nhất vẫn TRONG 5,438 s,
  KHÔNG lật được. Các hiệu chỉnh prior (+0,32 s #90; +0,396 s #92; +0,99 s #95)
  đều giữ TRONG.
- Caveat overlap (KHÔNG lật verdict theo tiền lệ #87/#90/#99/#100/#105 — parent
  quyết): watcher-186 poll cuối 19:10:05Z (+13 s, mẫu 19, chết cùng boot);
  sampler-186 mẫu cea cuối 19:10:08Z (+16 s); mẫu 7ea đầu 19:51:26Z. Hiểu theo
  nghĩa đen, +13/+16 s dời offset về ~23,4–26,4 s (NGOÀI phía dưới) — tiền lệ
  direction-blind, parent quyết. Poller T4-186 kết thúc 18:12:30Z — không overlap.
  b2watch: 0 dòng gần btime.
- Cửa hẹp [19:09:52Z, 19:28:52Z] ĐÓNG: 6 events, đúng 1 requeue (eid 10818).
  Cửa rộng [19:09:52Z, 20:30:33Z]: 0 requeue thêm. Đúng 1 run sống tại btime
  (run 187).
- F-187-T2-1: (m) #108 DƯƠNG + caveat overlap (n ứng viên +1/+1 nếu chấp nhận).

### (m) #109 — 6f1d9f87-7b23-4e5b-b2f5-597e6de37db4, btime 20:30:33Z — KHÔNG CÓ ĐIỂM
- 0 requeue cửa hẹp [20:30:33Z, 20:49:33Z] (8 events, đóng lúc đọc ~20:52Z) VÀ
  0 requeue cửa rộng [20:30:33Z, 21:13:21Z] — cửa rộng ĐÓNG bởi btime boot #110
  (21:13:21Z); requeue duy nhất sau 20:30:33Z là eid 10848 lúc 21:14:04,959Z,
  SAU btime #110 nên ngoài cửa. FINAL ở cấp T2 (không hoãn sang T2-188 nữa).
- 0 run sống tại btime (run 187 failed 20:17:06Z; run 188 sched 20:35:51Z chưa
  bắt đầu). Tiền lệ #94/#104. n không đổi.

### (m) #110 — 912f4a97-0841-47eb-805f-d7bbccaecd17, btime 21:13:21Z — SỐ THÔ CHO T2-188
- Boot mới giữa đợt 187 (lần đọc 6f1 cuối 21:13:14Z; btime 21:13:21Z —
  /proc/stat btime + `uptime -s` khớp; đọc 21:27:46Z; vẫn là boot hiện tại
  lúc viết LIMITS 21:33:55Z).
- Requeue eid 10848, run 188 (b7d4f596), 21:14:04,95861Z = btime +43,959 s →
  TRONG [33; 49,8] thô: trên biên dưới 10,959 s, dưới biên trên 5,841 s.
  Phân số: offset thật ∈ (42,959; 43,959] s — xấu nhất TRONG 9,959 s, KHÔNG lật.
- Cửa hẹp [21:13:21Z, 21:32:21Z] ĐÓNG: 6 events, đúng 1 requeue (eid 10848;
  + dispatched eid 10849 + reattached_after_restart eid 10850 lúc 21:14:05,149Z
  — run 188 REATTACHED, không khởi động lại từ đầu). Cửa rộng còn mở tới btime
  kế — T2-188 hoàn tất. Chưa biết caveat overlap (watcher-187 còn chạy trên
  6f1d9f87 lúc walk; T5-188 báo cáo poll cuối).
- Gap #109→#110 = 2.568 s (0h42m48s) — ngắn hơn hẳn nhịp chuẩn ~7,1–7,2k s;
  T0-188/T5-188 xác minh (không khẳng định kỷ lục).
- KHÔNG phân loại cuối ở đây (mẫu đứng: boot trong đợt N phân loại ở đợt N+1).

### Số đếm (m) và nhịp reboot
- Parent-186 (g): n ứng viên 47/48 (sau #105 DƯƠNG), n chính thức GIỮ 14.
  (m) #108 DƯƠNG → n ứng viên 48/49 nếu parent chấp nhận; (m) #107/#109
  KHÔNG CÓ ĐIỂM không đổi n. n chính thức vẫn GIỮ 14.
- Gap: #105→#107 = 14.778 s (2 reboot, #106 chưa xác minh, ước ~15:13:32Z);
  #107→#108 = 6.602 s; #108→#109 = 4.841 s; #109→#110 = 2.568 s.
- Tốc độ reboot: 182 reboot / 333,03 h = 1 per 109,8 phút (tới #107);
  183 / 334,86 h = 109,8 (tới #108); 184 / 336,20 h = 109,6 (tới #109);
  185 / 336,91 h = 109,3 (tới #110).
- Run 187: sched 17:35:51Z; started (hiện tại) 19:10:31Z (viết lại ×1 tại #108);
  FAILED, finished 20:17:06Z; claimed 20:13:44Z; claimed→finished 202 s
  (≥ 60 s — FLAG CA thuộc T7-187; T2 chỉ ghi số); jitter 0; attempt 1.
  Run 188 (b7d4f596, sched 20:35:51Z): đang chạy, reattached trên #110
  21:14:05Z — kết cục thuộc T7-188.
- POSTBOOT_PASS (T5-187, theo cách đếm A): #107 VẪN CÓ (cea, repair, poll=1,
  caveat); #108 KHÔNG CÓ (7ea, không thử repair, boot chết); #109 CÓ (6f1,
  replay, poll=0, không caveat). Tổng boot không cờ 24 → 25 nếu parent chấp
  nhận #108 (parent-186 (c) đã chấp nhận #105 → 24).

## §2. INSIDE — theo quy ước đứng F-165-T2-1

### Theo cách đếm A (parent-186 (e) ĐÃ QUYẾT): KHÔNG TÍNH ĐƯỢC — PENDING
- INSIDE #107 = FULL153, neo btime #106 — cần gap #107 (#106→#107); btime #106
  chưa biết → FULL153 không xây được.
- INSIDE #108 = FULL154 (gaps #55..#107) — cũng cần gap #107 → không xây được.
- INSIDE #109 = FULL155 (gaps #56..#108) — cần gap #106 + #107 → không xây được.
- **Chuỗi INSIDE GIỮ 7** (parent-186 (d): #104 TRUE FULL150 → 6; #105 TRUE
  FULL151 → 7); #107/#108/#109 pending → chuỗi chờ #106 xác minh, KHÔNG đứt,
  KHÔNG tăng. T2-188 tính lại FULL153/154/155 khi btime #106 được xác lập.
- F-187-T2-2: INSIDE #107/#108/#109 PENDING dưới cách đếm A; không đoán btime
  #106, không suy dải từ ước ~15:13:32Z.

### Chéo cách đếm B (cea=#106, 7ea=#107, 6f1=#108) — CHỈ GHI NHẬN, không phải chuỗi chính
- FULL152 (n=152, mean 1h43'05", median 1h55'48", p10 1587,80 s, p90 8819,10 s,
  sd 0h55'08", in 90–150'=86, <60'=33, >180'=11, >240'=5): INSIDE cea FALSE —
  muộn 5.959 s sau cuối dải [13:39:59Z, 15:40:31Z]. Chéo FULL151 cũng FALSE
  (muộn 13.220 s) — ĐỒNG THUẬN. Chuỗi B: 7 → 0.
- FULL153 (n=153, mean 1h43'08", median 1h55'41", p10 1596,60 s, p90 8811,20 s,
  sd 0h54'58", in 87/33/11/5): INSIDE 7ea TRUE — biên 5.006 s dưới / 2.209 s
  trên, dải [17:46:26Z, 19:46:41Z]. Chéo FULL152 FALSE (muộn 12.561 s) —
  mâu thuẫn ngược hướng #19. Chuỗi B mới = 1.
- FULL154 (n=154, mean 1h42'59", median 1h55'20", p10 1605,40 s, p90 8803,30 s,
  sd 0h54'49", in 87/33/11/5): INSIDE 6f1 TRUE — biên 3.236 s dưới / 3.962 s
  trên, dải [19:36:37Z, 21:36:35Z]. Chéo FULL153 FALSE (muộn 2.632 s) —
  mâu thuẫn #20. Chuỗi B = 2.
- Chuỗi theo B sẽ là 7 → 0 → 1 → 2 — NHƯNG parent đã quyết cách đếm A, nên dãy
  này chỉ là tham chiếu phương pháp (cho thấy phép thử dải vật lý vẫn chạy),
  không dùng làm chuỗi đứng. Mâu thuẫn ngược hướng tích lũy: #19, #20
  (tổng 20; #17/#18 ở đợt 186).

## §3. Mù — walk B0 11:15:18Z 21/11 → B1 21:14:00Z 24/11 (= 295.122 s)

Walk chạy 21:14:01–21:14:45Z TRÊN boot #110 (btime 21:13:21Z, 40 s sau reboot);
B1 = btime+39 s. Quét theo mtime (bền vững qua reboot) nên không vô hiệu.
Script: `blind9797-*.py`, `witness879394.py`, `hole-recheck9797.py` (đã đổi B1
18:18:00Z → 21:14:00Z toàn cục trước khi chạy; 0 sót "18:18:00Z").

- File trong cửa sổ: repo-1 3.498 (186: 3.081, +417 file đợt 187); hidden_files
  8.653 (186: 8.424); outside 3.236 (186: 3.210); /tmp 0 (186: 639 — /tmp là
  tmpfs, bị xóa bởi 3 reboot cea/7ea/6f1; quan sát, không phải phát hiện).
- **R file: 13 marks, max 1.238 s — lần thứ 23 KHÔNG ĐỔI.** R union-A 1.222 s,
  union-B 1.211 s. Content-ts trong hố R union: 0.
- S: 226 marks, max 3.235 s — OPEN. T: 210 marks, max 627 s — CLOSED.
- **U file: 6.476 marks, max 8.968 s (15:06:19Z → 17:35:47Z 23/11) KHÔNG ĐỔI;**
  thứ hai 8.746 s (15:10:03Z → 17:35:49Z 24/11) — hố lặng giữa hai đợt đã biết,
  chứa btime #107 (cea); đo lại rộng hơn phía file (đầu sớm hơn 91 s, cuối muộn
  hơn 12 s so với biên union-B đợt 186) do cắt tỉa mốc biên (F-186-T2-7 tiếp diễn),
  KHÔNG phải hố mới.
- U union-A: max 8.968 s; thứ hai 8.746 s; thêm hố 1.320 s (20:19:30Z →
  20:41:30Z 24/11) CHỨA btime #109 — lặng giữa đợt + cửa không watcher;
  ĐÓNG trong union-B nhờ đầu SYS-6f1 20:30:44Z (tách 674 + 646 s).
- **U union-B: max 7.861 s (15:06:19Z → 17:17:20Z 23/11) — ĐỔI từ 8.643 s.**
  F-187-T2-3 (hiệu chỉnh phương pháp, KHÔNG phải bằng chứng mù mới): thêm 3 đầu
  hệ thống đo trực tiếp vào union-B — SYS104 11:13:54Z (T0-185, wtmp +12 s,
  journal đầu +12 s), SYS-cea 17:20:05Z (T0-186, wtmp +15 s), SYS-6f1 20:30:44Z
  (T0-187 survey, journal đầu +11 s, wtmp +11 s, /proc/1 +11,228 s). SYS105 và
  SYS-7ea KHÔNG thêm — không có đo đầu trực tiếp trên hồ sơ. SYS-cea tách hố
  cũ 8.643 s thành 7.802 s (15:10:03Z → 17:20:05Z 24/11) + 944 s; max còn lại
  là hố 23/11 (7.861 s). Các union-B khác: R 1.211 s, S 591 s.
- Content-ts trong hố U file max (15:06:19–17:35:47Z 23/11): chỉ mốc đã biết
  btime #94 17:17:09Z (trích dẫn, viết sau dispatch) + đầu SYS94 17:17:20Z —
  0 mốc mới.
- Sessions: exec-logs 313 trong cửa sổ (186: 309); #64–#85: 0; #86: 1 thô → 0
  thật (file đã biết proc_db760769d06e, trích dẫn — F-184-T2-3). Content-ts
  trong hố R union và hố U file max: 0. R-head 0; U-tail tới 21:13:44Z
  (16 s trước B1, trên boot #110).
- Witness: exec-logs 311 (sessions 313 — chênh 2 file, cùng mẫu đợt 186);
  bỏ qua 38 log trích dẫn (quote-marker, gồm dir T2-187 của chính tôi).
  #87–#95: 0. #96: 3 thô → 0 thật; #97: 1 → 0; #98: 1 → 0; #99: 4 → 0;
  #100: 7 → 1 thật (overlap poller đã biết +22 s); #101: 5 → 0; #102: 6 → 0;
  #103: 13 → 0; #104: 7 → 0 (file mới proc_e91e180416da = output grep của
  T7-186, chỉ trích dẫn LIMITS khác); #105: 9 → 0; #106-B/#107-A: 6 → 0;
  #107-B/#108-A: 8 thô → 0 thật MỚI (probe headroom T9-186 SAU reboot
  19:11:50Z/19:12:57Z trên boot mới; log T5-187 chỉ trích dẫn, 0 dòng ±180 s;
  grep watcher của T7-186 = overlap đã biết +13 s; file grep T7-186 trích dẫn);
  #108-B/#109-A: 5 thô → 0 thật MỚI (log T5-187 + file grep T7-186, trích dẫn).
  **0 hoạt động thật mới tại #87–#109 ngoài overlap đã biết.**
- **Hole-recheck lần 31: NEW=0 ở MỌI hố (27 hố).** H-E1-88: 337 hit, 0 mới
  (lần thứ 31 liên tiếp); H-U16: 3 hit, 0 mới; whole-tree 27.616 file
  (find stderr 1 dòng: Permission denied `/home/hatch/.stagged-uploads` —
  có từ trước, không phải hố mới).
- **CERT/FULL GIỮ 76/91. Mù #94?/#95?/#96?/#88?/#77? VẪN MỞ.**

## §4. Mô hình đồng hồ + (m) #56 lần 30 + tuân thủ

- (m) #56 lần 30: thêm 5 hướng DB mới (tổng 120 — T2-186: 115), đều 0 dòng
  trong cửa sổ ứng viên W [19:33:20Z, 19:33:37Z] 20/11/2026
  (epoch 1795203200..1795203217): (cxvi) `chat.message_bindings` created_at;
  (cxvii) `goals.engagement_events` created_at; (cxviii) `device.call_log`
  created_at; (cxix) `agent.subagent_monitor_decisions` created_at (bigint
  epoch s); (cxx) `agent.runtime_restart_checkpoints` created_at (bigint
  epoch s). Đã kiểm chưa dùng trong LIMITS T2 trước khi truy vấn.
- File: (vii) 333 file trong D (không đổi), max mtime 20:15:33,130Z
  (round156-t10.done); (viii) 0 exec-log; (vii-b) 0; (vii-c) 0.
- Cửa sổ R ∈ [2,56251; 2,66817) s, J ∈ [2,566; 2,80753] s KHÔNG ĐỔI.
  **(m) #56 VẪN CÓ ĐIỀU KIỆN lần thứ 30; n chính thức GIỮ 14.**
- Tuân thủ (F-184-T2-8 — bài học đứng): poller T4-187 bắt đầu 20:47:32Z, gate0
  ĐẠT ở poll #8; attempt1 chạy ~21:03Z–21:09:27Z HỢP LỆ (20/20 + lớp B 5/5 +
  tickCost median 39,0 ms ≤ 60); poller thoát 21:12:26Z. Mọi script nặng (walk,
  merged, content, sessions, witness, hole-recheck, sweep ×2, m56-file) chạy
  SAU khi poller thoát, mỗi script kiểm gate trước (ps 0 tiến trình
  poll-wait/run-attempt + poll-t4.log mtime đóng băng 21:09:27Z) và kiểm lại sau.
  **0 VI PHẠM phía T2-187.** Chuỗi 0 vi phạm: parent-186 (p) = 2 → đề xuất
  2 → 3 nếu đợt 187 sạch (parent quyết §12.3-187).
- Lưu ý thời gian: reboot #110 xảy ra 21:13:21Z, giữa lần kiểm gate cuối
  (21:13:14Z, boot 6f1) và walk (bắt đầu ~21:14:01Z, trên #110). Không script
  nào chồng lên lúc reboot; walk chạy trên boot mới. Không vi phạm.
- (p) kiểm chứng live lần 6: ĐẠT (parent-186 (p)) — T2-187 không chạy analyzer
  trong cửa attempt; 0 file analyzer ghi trong cửa sổ attempt (theo T4-187).

## §5. EPERM probe + sweep — 0 sóng thật

- **Probe #106: 20:47:50Z, boot 6f1d9f87, tmp+ws ok=2 fail=0.**
  MemAvailable ~1.039.884 kB lúc 20:47:35Z.
- **Probe #107: 21:32:01Z, boot 912f4a97 (#110), tmp+ws ok=2 fail=0.**
  MemAvailable 1.880.776 kB (boot mới). Log `hidden_files/eperm-probe-v2.log`
  có dòng đổi boot 6f1d9f87 → 912f4a97; heartbeat cập nhật n=107.
- Sweep #106, cửa sổ [17:49:56Z, 20:47:50Z]: 188 file *.log, 4 file có marker,
  15 lần xuất hiện — toàn trích dẫn ("sóng EPERM đã tắt" ×13, "CẢNH BÁO" ×1,
  "Operation not permitted" ×1 trong chính log sweep186).
- Sweep #107, cửa sổ [20:47:50Z, 21:32:01Z]: 89 file *.log, 2 file có marker,
  9 lần xuất hiện — toàn trích dẫn ("sóng EPERM đã tắt" ×7, "CẢNH BÁO" ×1,
  "Operation not permitted" ×1 trong chính log sweep187).
- **0 sóng EPERM thật trong cả hai cửa sổ.** (F-150-T2-2: không grep -r tùy tiện
  cho chuỗi marker — sweep chỉ đọc *.log có giới hạn.)

## §6. Phương pháp, lỗi, F mới, câu hỏi cho parent

- F-187-T2-1: (m) #108 DƯƠNG (+39,438 s) + caveat overlap +13/+16 s
  (direction-blind, parent quyết).
- F-187-T2-2: INSIDE #107/#108/#109 PENDING dưới cách đếm A — FULL153/154/155
  cần gap #106/#107 (btime #106 chưa biết); chuỗi GIỮ 7.
- F-187-T2-3: U union-B max ĐỔI 8.643 → 7.861 s do thêm đầu hệ thống SYS-cea
  (17:20:05Z) — hiệu chỉnh phương pháp, không phải hố mù mới.
- F-187-T2-4: boot #110 giữa đợt (btime 21:13:21Z, gap #109→#110 2.568 s,
  (m) thô DƯƠNG +43,959 s, probe #107 + sweep #107 đã chạy).
- F-187-T2-5: hố union-A 1.320 s (20:19:30Z → 20:41:30Z 24/11) chứa btime #109 —
  lặng giữa đợt + cửa không watcher; ĐÓNG trong union-B nhờ SYS-6f1.
- Lỗi đã sửa trong đợt: (1) epoch sai 1795546792 (= 18:59:52Z) dùng trong 1 truy
  vấn và lần chạy m-check đầu — đã sửa thành 1795547392 (= 19:09:52Z) mọi nơi,
  m-check chạy lại exit 0; (2) gap 7ea→6f1 tính nhầm 5.441 s — đúng 4.841 s,
  assert trong script bắt được; (3) pgrep -f tự khớp lệnh của chính mình —
  kiểm lại bằng `ps aux | grep -v grep`.
- Câu hỏi cho parent (§12.3-187):
  (a) Chấp nhận (m) #108 DƯƠNG, (m) #107/#109 KHÔNG CÓ ĐIỂM? → n ứng viên
      48/49 nếu chấp nhận; n chính thức GIỮ 14.
  (b) INSIDE #107/#108/#109 PENDING, chuỗi GIỮ 7 chờ #106 xác minh? T2-188 tính
      lại FULL153/154/155 khi btime #106 được xác lập.
  (c) Chéo cách đếm B (FALSE/TRUE/TRUE, chuỗi 7→0→1→2) chỉ ghi nhận, không
      dùng làm chuỗi chính?
  (d) (m) #110 thô DƯƠNG (+43,959 s) — T2-188 phân loại cuối.
  (e) POSTBOOT_PASS #108 KHÔNG CÓ — tổng boot không cờ 24 → 25?
  (f) Chuỗi 0 vi phạm 2 → 3 nếu đợt 187 sạch?
  (g) Mù #94?/#95?/#96?/#88?/#77? VẪN MỞ; CERT/FULL GIỮ 76/91;
      (m) #56 VẪN CÓ ĐIỀU KIỆN lần thứ 30.
- Script đợt này: `hidden_files/round187-t2/` (m-check187.py/.txt,
  blind9797-*.py + blind187-*.log, witness879394.py + blind187-witness.log,
  hole-recheck9797.py + hole-recheck187.log, eperm-sweep9797.py +
  eperm-sweep187.log/187b.log, m56-187.py/.log, gate-wait187.sh/.log).
