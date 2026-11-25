# PHASE 9 — ROUND 188 — T2 EPERM probe + (m)/INSIDE + mù

- Đợt 188, mở cron 06:35 +07 25/11/2026 (= 23:35:51Z 24/11). T2 viết ~01:50Z 25/11.
- Repo `~/workspace/repo-1`, branch main. CHỈ STAGE, KHÔNG PUSH, KHÔNG release/tag.
- Nguồn: aggregate 186 §12.3 BẢN PARENT ĐỌC TRƯỚC 23:49Z (107.950 B, quyết
  (a)–(r), SẠCH, dedup python CHỈ python KHỚP TỪNG SỐ lần thứ 99) — XEM CẢNH BÁO
  NGUỒN GỐC Ở §6: aggregate này BỊ VIẾT LẠI 23:49:15Z trong đợt 188
  (107.950 → 108.730 B); T4-188 kiểm spot (b)/(m)/(p) GIỮ NGUYÊN; T2 KHÔNG phán
  nguồn gốc bản viết lại (F-188-T5-2/F-188-T4-9). LIMITS T2-187; T0/T4/T5-188.
  Script: `hidden_files/round188-t2/`.

## §0. Tóm tắt (parent quyết cuối)

- **Số hiệu: parent-186 (e) ĐÃ QUYẾT cách đếm A — cea79500 = #107; #106 reboot
  chưa xác minh; 7ea9d047 = #108; 6f1d9f87 = #109; 912f4a97 = #110;
  257c1eae = #111 (T0-188 xác nhận 9 nguồn tươi).**
- **(m) #110 (912f4a97) DƯƠNG** (+43,959 s, trong [33; 49,8], caveat overlap
  watcher +6 s / sampler +22 s (log) — NHƯNG T0-188 xác minh độc lập đồng hồ
  NHANH δ > 22 s trước #110 nên overlap thật có thể ≤ 0 s; tiền lệ
  direction-blind, parent quyết). **(m) #111 (257c1eae) SỐ THÔ DƯƠNG**
  (+37,468 s; hẹp ĐÓNG 6 events đúng 1 requeue; rộng còn mở — T2-189 phân
  loại cuối). Run 188 bị requeue ở CẢ #110 VÀ #111 (reattach ×2).
- **INSIDE #107/#108/#109/#110/#111 (FULL153–157): KHÔNG TÍNH ĐƯỢC** theo quy ước
  đứng F-165-T2-1 — vẫn cần gap #106/#107, btime #106 chưa biết (không dữ kiện
  mới đợt 188). Chuỗi INSIDE GIỮ 7. Chéo cách đếm B (không phải chuỗi chính):
  #110 TRUE / TRUE; #111 TRUE / FALSE (mâu thuẫn ngược hướng #21).
- **(m) #56 lần 31: VẪN CÓ ĐIỀU KIỆN** (5 hướng DB mới, tổng 125 — đều 0 dòng).
- **Mù #94?/#95?/#96?/#88?/#77? VẪN MỞ** (hole-recheck lần 32 NEW=0 mọi hố;
  R file 1.238 s lần 24 không đổi; U file-gap max ĐỔI 8.968 → 9.316 s và
  U union-B max ĐỔI 7.861 → 8.372 s — CẢ HAI đều do mốc biên bị dời
  (AGENTS.md sửa 23:50:23Z + session main agent append), KHÔNG phải hố mù mới,
  F-188-T2-3). CERT/FULL GIỮ 76/91.
- **EPERM: probe #108 (257c1eae, #111) ok=2 fail=0; sweep #108: 0 sóng thật.**
- **Tuân thủ: 0 VI PHẠM** — mọi script nặng CHỜ poller T4-188 thoát hẳn
  (01:30:36Z, 0 attempt, hết hạn cắt) + kiểm gate trước/sau mỗi script.
  Chuỗi 0 vi phạm đề xuất 2 → 3 nếu đợt 187 sạch (parent quyết §12.3-187;
  T4-188 cũng đề xuất 2 → 3 nếu 187 sạch).
- T4-188: 0 attempt, KHÔNG CÓ lượt yên hợp lệ (balloon ghim ~6,44 GB, RAM
  <1024 MB trong 101/136 poll; (p) lần 8 KHÔNG THỂ KIỂM). Run 188 TIMEOUT
  23:38:46Z (claimed→finished 146 s ≥ 60 s — FLAG CA thuộc T7-188).
- **LƯU Ý NHÃN:** probe T2-187 #106/#107 KHÔNG khớp số hiệu boot (#109/#110) —
  bộ đếm probe riêng; đợt này probe #108 trên boot #111 (257c1eae). Ghi cả hai
  nhãn mọi nơi để khỏi nhầm.

## §1. (m) — phân loại cuối ở cấp T2, parent quyết cuối

Dải đứng [33; 49,8] s (offset = requeue − btime). `events.run_id`/`job_runs.run_id`
là UUID đầy đủ; cột `job_runs`: `scheduled_for_utc`/`started_at_utc`/`finished_at_utc`.

### (m) #110 — 912f4a97-0841-47eb-805f-d7bbccaecd17, btime 21:13:21Z — DƯƠNG
- Requeue eid 10848, run 188 (b7d4f596), 21:14:04,95861Z = btime +43,959 s →
  TRONG [33; 49,8]: trên biên dưới 10,959 s, dưới biên trên 5,841 s.
- Caveat phân số: offset thật ∈ (42,959; 43,959] s — xấu nhất vẫn TRONG 9,959 s,
  KHÔNG lật được. Các hiệu chỉnh prior (+0,32 s #90; +0,396 s #92; +0,99 s #95)
  đều giữ TRONG.
- Caveat overlap (KHÔNG lật verdict theo tiền lệ #87/#90/#99/#100/#105/#108 —
  parent quyết): watcher-187 poll cuối 21:13:27Z boot=6f1d9f87 (+6 s;
  F-187-T5-3; watcher CHẾT theo #110); sampler-187 mẫu cuối #109 ghi 21:13:43Z
  (+22 s log); mẫu 912f đầu 21:15:44Z. Hiểu theo nghĩa đen, +6/+22 s dời offset
  về ~21,96–37,96 s (vượt biên dưới nếu lấy +22 s) — NHƯNG T0-188 KIỂM LẠI ĐỘC
  LẬP F-187-T9-3: đồng hồ NHANH δ > 22 s trước #110 (sampler) → mẫu sampler
  +22 s (log) thực chất lấy TRƯỚC btime (offset thật ≤ 0 s); overlap thật có
  thể chỉ còn watcher +6 s (đọc boot_id trước rồi mới lấy timestamp — xem
  F-172-T5-1) → offset thật ~37,96 s, VẪN TRONG. Caveat yếu đi, verdict giữ.
  Poller T4-187 kết thúc 21:09:27Z — không overlap. b2watch: 0 dòng gần btime.
- Cửa hẹp [21:13:21Z, 21:32:21Z] ĐÓNG: 6 events, đúng 1 requeue (eid 10848;
  + dispatched eid 10849 + reattached eid 10850 lúc 21:14:05,149Z — run 188
  REATTACHED). Cửa rộng [21:13:21Z, 23:10:44Z] ĐÓNG bởi btime #111: đúng 1
  requeue trong toàn cửa rộng (chỉ eid 10848). Đúng 1 run sống tại btime
  (run 188, sched 20:35:51Z, finished 23:38:46Z).
- F-188-T2-1: (m) #110 DƯƠNG + caveat overlap (n ứng viên +1/+1 nếu chấp nhận).

### (m) #111 — 257c1eae-1c20-4bd4-a710-548adb1d34d5, btime 23:10:44Z — SỐ THÔ + HẸP CHO T2-189
- Requeue eid 10875, run 188 (b7d4f596 — CÙNG run 188, requeue ở HAI boot liên
  tiếp), 23:11:21,467938Z = btime +37,468 s → TRONG [33; 49,8] thô: trên biên
  dưới 4,468 s, dưới biên trên 12,332 s. Phân số: offset thật ∈ (36,468;
  37,468] s — xấu nhất TRONG 3,468 s, KHÔNG lật.
- Cửa hẹp [23:10:44Z, 23:29:44Z] ĐÓNG: 6 events, đúng 1 requeue (eid 10875;
  + dispatched eid 10876 + reattached eid 10877 lúc 23:11:21,581Z — run 188
  REATTACHED lần thứ hai). Cửa rộng còn mở tới btime kế — T2-189 hoàn tất.
  Đúng 1 run sống tại btime (run 188). KHÔNG phân loại cuối ở đây (mẫu đứng:
  boot trong đợt N phân loại ở đợt N+1).
- Caveat overlap thô: watcher-187b poll cuối 23:10:54Z boot=912f4a97 (+10 s;
  F-188-T5-1; watcher CHẾT theo #111); sampler-187 mẫu cuối #110 ghi 23:10:46Z
  (+2 s log); T0-188 xác minh đồng hồ NHANH δ > 10 s trước #111 (watcher-187b,
  mạnh hơn sampler δ > 2 s) → poll watcher +10 s (log) thực chất có thể lấy
  TRƯỚC btime; overlap thật có thể ~0 s. Poller T4-188 CHƯA bắt đầu lúc btime
  (bắt đầu 23:48:13Z) — không overlap. (m) #111 chi tiết thuộc T2-189.
- F-188-T2-2: run 188 requeue ở 2 boot liên tiếp (#110 + #111) — lần đầu ghi
  nhận một run bị requeue 2 lần trong 2 đợt liên tiếp (xem §1 cuối).

### Số đếm (m) và nhịp reboot
- Parent-186 (g): n ứng viên 47/48 (sau #105 DƯƠNG), n chính thức GIỮ 14.
  (m) #108 DƯƠNG (T2-187, parent quyết §12.3-187 — T10-187b đang đóng song song,
  chưa có lúc T2 viết) → 48/49 nếu chấp nhận; (m) #110 DƯƠNG → 49/50 nếu chấp
  nhận CẢ #108 VÀ #110. Ghi rõ từng nấc — parent quyết cuối cả #108 lẫn #110.
  n chính thức vẫn GIỮ 14.
- Gap: #105→#107 = 14.778 s (2 reboot, #106 chưa xác minh); #107→#108 = 6.602 s;
  #108→#109 = 4.841 s; #109→#110 = 2.568 s; #110→#111 = 7.043 s (trở lại mẫu ~2h).
- Tốc độ reboot: 185 reboot / 336,91 h = 1 per 109,3 phút (tới #110);
  186 / 338,87 h = 109,3 (tới #111).
- Run 188: sched 20:35:51Z; started_at (hiện tại) 23:11:21Z (viết lại tại #111;
  lần viết lại thứ 2 trong lúc run sống — lần 1 tại #110, xem m-check188);
  TIMEOUT, finished 23:38:46Z; claimed 23:36:20Z; claimed→finished 146 s
  (≥ 60 s — FLAG CA thuộc T7-188; T2 chỉ ghi số); jitter 0; attempt 1.
  Run 189 (98271fb8, sched 23:35:51Z): started 23:38:46Z (cùng giây run 188
  finished), status running — kết cục thuộc T7-189.
- POSTBOOT_PASS (T5-188): #111 CÓ 00:11:36Z (repair-sớm-quyết-h, poll=1,
  CÓ caveat — GST symlink + tools chưa cài + dpkg 768); #110 VẪN CÓ (replay,
  poll=0, KHÔNG caveat); #109 VẪN CÓ; #108/#105 VẪN KHÔNG CÓ. Tổng boot không cờ
  GIỮ 24; 24 → 25 nếu parent chấp nhận #108 ở §12.3-187.

## §2. INSIDE — theo quy ước đứng F-165-T2-1

### Theo cách đếm A (parent-186 (e) ĐÃ QUYẾT): KHÔNG TÍNH ĐƯỢC — PENDING
- INSIDE #110 = FULL156, INSIDE #111 = FULL157 — cả hai đều cần gap #107
  (#106→#107); btime #106 chưa biết. KHÔNG có dữ kiện mới đợt 188: T0-188 chỉ
  xác minh boot #111 (9 nguồn tươi); T1-188 chưa đóng cờ lúc T2 viết; GAP
  §114/§115 không thêm btime #106.
- **Chuỗi INSIDE GIỮ 7** (parent-186 (d): #104 TRUE FULL150 → 6; #105 TRUE
  FULL151 → 7); #107/#108/#109/#110/#111 pending → chuỗi chờ #106 xác minh,
  KHÔNG đứt, KHÔNG tăng. T2-189 tính lại khi btime #106 được xác lập.
- F-188-T2-5: INSIDE #110/#111 PENDING dưới cách đếm A (nối F-187-T2-2).

### Chéo cách đếm B (cea=#106, 7ea=#107, 6f1=#108, 912f=#109, 257c=#110) — CHỈ GHI NHẬN
- FULL155 (n=155, mean 1h42'36", median 1h55'00", p10 1614,20 s, p90 8795,40 s,
  sd 0h54'51", in 87/34/11/5): INSIDE 912f TRUE — biên 954 s dưới / 6.227 s
  trên, dải [20:57:27Z, 22:57:08Z]. Chéo FULL154 cũng TRUE — ĐỒNG THUẬN.
  Chuỗi B: 2 → 3.
- FULL156 (n=156, mean 1h42'41", median 1h55'20", p10 1623,00 s, p90 8787,50 s,
  sd 0h54'41", in 88/34/11/5): INSIDE 257c TRUE — biên 5.420 s dưới / 1.744 s
  trên, dải [21:40:24Z, 23:39:48Z]. Chéo FULL155 FALSE (muộn 816 s) —
  mâu thuẫn ngược hướng #21 (tổng 21; #19/#20 ở đợt 187). Chuỗi B mới = 4
  (theo dải chính; chéo FALSE sẽ reset về 0 nếu lấy chéo làm chuẩn).
- Chuỗi theo B sẽ là 7 → 0 → 1 → 2 → 3 → 4 — NHƯNG parent đã quyết cách đếm A,
  nên dãy này chỉ là tham chiếu phương pháp, không dùng làm chuỗi đứng.

## §3. Mù — walk B0 11:15:18Z 21/11 → B1 01:33:00Z 25/11 (= 310.662 s)

Walk chạy 01:33:02–01:35:12Z TRÊN boot #111 (btime 23:10:44Z); B1 = 01:33:00Z.
Quét theo mtime (bền vững qua reboot) nên không vô hiệu. Script: `blind9797-*.py`,
`witness879394.py`, `hole-recheck188.py` (đã đổi B1 21:14:00Z → 01:33:00Z toàn
cục trước khi chạy; 0 sót "21:14:00Z"; W đổi round187-t2 → round188-t2).

- File trong cửa sổ: repo-1 3.902 (187: 3.498, +404 file đợt 188); hidden_files
  8.947 (187: 8.653); outside 3.372 (187: 3.236); /tmp 48 (187: 0 — /tmp là
  tmpfs, đã có lại file sau reboot #111; các file mới của đợt 188).
- **R file: 13 marks, max 1.238 s — lần thứ 24 KHÔNG ĐỔI.** R union-A 1.222 s,
  union-B 1.211 s. Content-ts trong hố R union: 0.
- S: 226 marks, max 3.235 s — OPEN. T: 210 marks, max 627 s — CLOSED.
- **U file: 6.839 marks, max 9.316 s (15:00:33Z → 17:35:49Z 24/11) — ĐỔI từ
  8.968 s.** Thứ hai 8.968 s (15:06:19Z → 17:35:47Z 23/11) KHÔNG ĐỔI.
  F-188-T2-3 (dời mốc biên, KHÔNG phải hố mù mới): mốc mở 15:10:03Z của đợt 187
  là `/home/hatch/AGENTS.md` — file này bị sửa lúc 23:50:23Z 24/11 (sau walk
  đợt 187), mốc dời về mốc trước đó 15:00:33Z (`PHASE9_ROUND185_LIMITS.md`,
  không đổi). Hố vẫn là hố lặng giữa hai đợt đã biết, chứa btime #107 (cea);
  đo lại rộng hơn phía file do cắt tỉa mốc biên (F-186-T2-7 tiếp diễn).
- U union-A: max 9.316 s (cùng hố trên); thứ hai 8.968 s; thêm hố 1.464 s
  (20:17:06Z → 20:41:30Z 24/11, ĐỔI từ 1.320 s — mốc mở 20:19:30Z là session
  main agent `agent-e033d2dd/.../prompt-continuity + sessions.jsonl`, bị append
  tới 23:51:11Z; mốc mở dời về 20:17:06Z = run 187 finished) CHỨA btime #109 —
  lặng giữa đợt + cửa không watcher; ĐÓNG trong union-B nhờ đầu SYS-6f1
  20:30:44Z (tách 674 + 646 s — không đổi).
- **U union-B: max 8.372 s (15:00:33Z → 17:20:05Z 24/11) — ĐỔI từ 7.861 s.**
  Cùng nguyên nhân F-188-T2-3 (mốc AGENTS.md dời; đầu SYS-cea 17:20:05Z không
  đổi tách hố). Các union-B khác: R 1.211 s, S 591 s.
- Content-ts trong hố U file max (15:00:33–17:35:49Z 24/11): chỉ mốc đã biết
  btime #107 17:19:50Z (trích dẫn, viết sau dispatch) + đầu SYS-cea 17:20:05Z —
  0 mốc mới.
- Sessions: exec-logs 336 trong cửa sổ (187: 313, +23); #64–#85: 1 thô → 0
  thật MỚI (cùng 1 file `proc_34889a901a7e.log` — session main agent, span
  2026-11-20T11:26:05..2026-11-24T23:46:54, trích dẫn build-loop-log — mẫu
  F-184-T2-3); #86: 2 thô → 0 thật (file đã biết proc_db760769d06e + file
  session main agent trên). Content-ts trong hố R union và hố U file max: 0.
  R-head 0; U-tail tới 01:32:58Z (2 s trước B1, trên boot #111).
- Witness: exec-logs 336 (sessions 336 — KHỚP, khác đợt 187 chênh 2);
  bỏ qua 28 log trích dẫn (quote-marker). #87–#95: 1 thô → 0 thật (chỉ file
  session main agent, trích dẫn); #96–#99: 2 thô → 0 thật (file quote
  proc_95067dbe9645 + session main agent); #100: 6 thô → 0 thật MỚI
  (2 file mang bằng chứng overlap +22 s đợt 187 — proc_09bd0ea2c544 +
  proc_567743a6f6b9 — ĐÃ BỊ XÓA khỏi đĩa; bằng chứng overlap vẫn đứng theo
  hồ sơ đợt 187/T4-182, không phải phát hiện mới; 4 file còn lại: sampler +
  launcher T4-182 + watcher182 (+6 s, đã biết) — F-188-T2-4); #101: 4 → 0;
  #102: 5 → 0; #103: 12 → 0; #104: 6 → 0; #105: 8 → 0; #106-B/#107-A: 6 → 0;
  #107-B/#108-A: 8 → 0; #108-B/#109-A: 5 → 0; #109-B/#110-A: 8 thô → 0 thật
  MỚI (T9-187 probe headroom SAU reboot 21:15:15Z/21:16:11Z + launcher T4-187
  trích dẫn deadline 22:30:00Z + 3 file quote dài — 0 dòng ±180 s quanh btime);
  #110-B/#111-A: 3 thô → 0 thật MỚI (3 file quote dài). **0 hoạt động thật mới
  tại #87–#111 ngoài overlap đã biết.**
- **Hole-recheck lần 32: NEW=0 ở MỌI hố (27 hố).** H-E1-88: 337 hit, 0 mới
  (lần thứ 32 liên tiếp); H-U16: 3 hit, 0 mới; whole-tree 28.836 file
  (find stderr 1 dòng: Permission denied `/home/hatch/.stagged-uploads` —
  có từ trước, không phải hố mới).
- **CERT/FULL GIỮ 76/91. Mù #94?/#95?/#96?/#88?/#77? VẪN MỞ.**

## §4. Mô hình đồng hồ + (m) #56 lần 31 + tuân thủ

- (m) #56 lần 31: thêm 5 hướng DB mới (tổng 125 — T2-187: 120), đều 0 dòng
  trong cửa sổ ứng viên W [19:33:20Z, 19:33:37Z] 20/11/2026
  (epoch 1795203200..1795203217): (cxxi) `ingest.data_source_events`
  received_at; (cxxii) `ideas.idea_events` created_at; (cxxiii)
  `health.events` event_at; (cxxiv) `agent.subagent_progress_message_events`
  created_at (epoch s); (cxxv) `agent.subagent_progress_tool_events`
  created_at (epoch s). Đã kiểm chưa dùng trong LIMITS T2 trước khi truy vấn.
- File: (vii) 333 file trong D (không đổi), max mtime 20:15:33,130Z
  (round156-t10.done); (viii) 0 exec-log; (vii-b) 0; (vii-c) 0 (mốc 20:19:30Z
  đã dời theo session main agent — xem §3).
- Cửa sổ R ∈ [2,56251; 2,66817) s, J ∈ [2,566; 2,80753] s KHÔNG ĐỔI.
  **(m) #56 VẪN CÓ ĐIỀU KIỆN lần thứ 31; n chính thức GIỮ 14.**
- Tuân thủ (F-184-T2-8 — bài học đứng): poller T4-188 bắt đầu 23:48:13Z,
  gate0=T5 từ poll #33, hết hạn cắt 01:30:00Z — 0 attempt (balloon ghim, RAM
  <1024 MB; xem T4-188). Poller thoát 01:30:36Z; waiter T2 xác nhận
  POLLER-EXITED 01:32:07Z (log mtime age 91 s). Mọi script nặng (walk, merged,
  content, sessions, witness, hole-recheck, sweep, m56-file) chạy SAU khi
  poller thoát, mỗi script kiểm gate trước (ps 0 tiến trình poll-wait/
  run-attempt + poll-t4.log mtime đóng băng 01:30:36Z) và kiểm lại sau.
  **0 VI PHẠM phía T2-188.** Chuỗi 0 vi phạm: parent-186 (p) = 2 → đề xuất
  2 → 3 nếu đợt 187 sạch (parent quyết §12.3-187; T4-188 cùng đề xuất).
- Lưu ý thời gian: waiter T2 lần 1 TIMEOUT 00:38:49Z (poller chưa thoát — hết
  45 phút); waiter lần 2 khởi động lại 00:40:35Z; lần 3 (sau khi kill lần 2)
  01:12:06Z — xác nhận poller thoát 01:32:07Z. Không script nặng nào chạy
  trong lúc waiter timeout; không vi phạm.
- **CẢNH BÁO pgrep tự khớp (lỗi đã sửa trong đợt, xem §6):** các lần kiểm
  `pgrep -f "run-attempt-188"` của T2 trong lúc chờ đã TỰ KHỚP lệnh kiểm của
  chính mình (dòng lệnh chứa chuỗi mẫu) → báo "ATTEMPT RUNNING" SAI từ ~00:40Z
  tới 01:22Z; kiểm lại bằng mẫu `run-attempt-18[8]` (không tự khớp): 0 tiến
  trình attempt trong cả đợt — poll-t4.log cũng KHÔNG có dòng attempt nào
  (chỉ header + poll). T2-187 đã ghi bài học này nhưng T2-188 vẫn mắc lại
  ở bước kiểm tay (waiter script dùng pgrep -f nhưng tiến trình waiter không
  chứa chuỗi mẫu nên waiter KHÔNG sai — chỉ các lần kiểm tay sai).
- (p) kiểm chứng live lần 8: KHÔNG THỂ KIỂM (T4-188 — 0 cửa sổ attempt).

## §5. EPERM probe + sweep — 0 sóng thật

- **Probe #108: 23:50:09Z, boot 257c1eae (#111), tmp+ws ok=2 fail=0.**
  MemAvailable 1.326.840 kB lúc 23:50:09Z. Log `hidden_files/eperm-probe-v2.log`
  có dòng đổi boot 912f4a97 → 257c1eae; heartbeat cập nhật n=108.
  (Nhãn probe #108 ≠ số hiệu boot #111 — bộ đếm probe riêng; xem §0.)
- Sweep #108, cửa sổ [21:32:01Z, 23:50:09Z]: 89 file *.log, 3 file có marker,
  10 lần xuất hiện — toàn trích dẫn ("sóng EPERM đã tắt" ×8, "CẢNH BÁO" ×1,
  "Operation not permitted" ×1 trong log sweep187b; "sóng EPERM vẫn bật" ×0).
- **0 sóng EPERM thật trong cửa sổ.** (F-150-T2-2: không grep -r tùy tiện
  cho chuỗi marker — sweep chỉ đọc *.log có giới hạn.)

## §6. Phương pháp, lỗi, F mới, câu hỏi cho parent

- F-188-T2-1: (m) #110 DƯƠNG (+43,959 s) + caveat overlap +6/+22 s (log);
  T0-188 xác minh đồng hồ nhanh δ > 22 s → overlap thật có thể ≤ 0 s.
- F-188-T2-2: run 188 requeue ở 2 boot liên tiếp (#110 + #111) — lần đầu ghi
  nhận; (m) #111 thô DƯƠNG +37,468 s, hẹp đóng, rộng còn mở.
- F-188-T2-3: U file-gap max 8.968 → 9.316 s + U union-B max 7.861 → 8.372 s
  do dời mốc biên (AGENTS.md sửa 23:50:23Z; session main agent append) —
  hiệu chỉnh phương pháp, không phải hố mù mới (nối F-186-T2-7/F-187-T2-3).
- F-188-T2-4: 2 file mang bằng chứng overlap #100 (+22 s, đợt 187) đã bị xóa
  khỏi đĩa (proc_09bd0ea2c544 + proc_567743a6f6b9); witness #100 đợt này
  6 thô → 0 thật MỚI; bằng chứng overlap vẫn đứng theo hồ sơ đợt 187.
- F-188-T2-5: INSIDE #110/#111 PENDING dưới cách đếm A (nối F-187-T2-2);
  chéo B: #110 TRUE/TRUE, #111 TRUE/FALSE — mâu thuẫn ngược hướng #21.
- F-188-T2-6: pgrep -f tự khớp lệnh kiểm của chính mình → báo "ATTEMPT RUNNING"
  SAI (00:40–01:22Z); bài học T2-187 đã ghi nhưng vẫn mắc lại ở kiểm tay.
  Sửa: luôn dùng mẫu ngoặc `[8]` + đối chiếu poll-t4.log.
- F-188-T2-7: poller T4-188 chạy 101 phút (23:48:13Z–01:30:36Z, 138 poll) mới
  hết hạn cắt — dài gấp ~4,6 lần đợt 187 (22 phút); 0 attempt do balloon ghim
  (tiền lệ đợt 182 cũng 0 attempt vì RAM <1024). T2 chờ đúng luật, không chạy
  script nặng sớm — cờ trễ nhưng trong hạn cứng.
- **CẢNH BÁO NGUỒN GỐC (§12.3-186):** T2 đọc §12.3-186 lúc ~23:44Z (107.950 B,
  header SẠCH, đếm khớp 99 — KHỚP brief). Aggregate BỊ VIẾT LẠI 23:49:15Z trong
  đợt 188 (107.950 → 108.730 B; header SẠCH → CHƯA NGÃ NGŨ; đếm khớp 99 → 101;
  theo F-188-T4-9/F-188-T5-2). AGENTS.md cũng bị sửa 23:50:23Z (thêm mục về
  nguồn gốc §12.3-186). T2 GHI NHẬN SỰ THẬT, KHÔNG phán ai viết, KHÔNG dùng
  bản viết lại làm nguồn — mọi quyết dùng ở đây là bản parent đọc trước
  23:49Z; (b)/(m)/(p) giữ nguyên theo kiểm spot của T4-188.
- Lỗi đã sửa trong đợt: (1) epoch requeue #110 gõ sai 1795554804 (thiếu 40 s)
  trong m-check188 lần chạy đầu → assert bắt được (offset +3,959 s OUT sai);
  đã sửa thành 1795554844, chạy lại exit 0, +43,959 s IN; (2) pgrep tự khớp
  (xem trên); (3) waiter T2 timeout lần 1 (45 phút) — khởi động lại, không
  chạy script nặng trong lúc chờ.
- Câu hỏi cho parent (§12.3-188):
  (a) Chấp nhận (m) #110 DƯƠNG, (m) #111 thô DƯƠNG (hẹp đóng)? → n ứng viên
      48/49 (#108) rồi 49/50 (#108 + #110) nếu chấp nhận cả hai; n chính thức
      GIỮ 14.
  (b) INSIDE #107/#108/#109/#110/#111 PENDING, chuỗi GIỮ 7 chờ #106 xác minh?
  (c) Chéo cách đếm B (chuỗi 7→0→1→2→3→4; mâu thuẫn #21) chỉ ghi nhận?
  (d) POSTBOOT_PASS #111 CÓ caveat (repair, poll=1) — tổng boot không cờ
      GIỮ 24 (24 → 25 nếu chấp nhận #108)?
  (e) Chuỗi 0 vi phạm 2 → 3 nếu đợt 187 sạch? (p) lần 8 KHÔNG THỂ KIỂM (0 attempt).
  (f) Mù #94?/#95?/#96?/#88?/#77? VẪN MỞ; CERT/FULL GIỮ 76/91;
      (m) #56 VẪN CÓ ĐIỀU KIỆN lần thứ 31.
  (g) Ghi nhận cảnh báo nguồn gốc §12.3-186 (viết lại 23:49:15Z trong đợt 188)?
- Script đợt này: `hidden_files/round188-t2/` (m-check188.py/.txt,
  blind9797-*.py + blind188-*.log, witness879394.py + blind188-witness.log,
  hole-recheck188.py + hole-recheck188.log, eperm-sweep188.py +
  eperm-sweep188.log, m56-188.py/.log, gate-wait188.sh/.log).
