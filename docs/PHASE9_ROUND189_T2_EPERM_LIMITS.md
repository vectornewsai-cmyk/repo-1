# PHASE 9 — ROUND 189 — T2 EPERM probe + (m)/INSIDE + mù

- Đợt 189, mở cron 09:35 +07 25/11/2026 (= 02:35:51Z 25/11). T2 viết ~03:40Z 25/11.
- Repo `~/workspace/repo-1`, branch main. CHỈ STAGE, KHÔNG PUSH, KHÔNG release/tag.
- Nguồn: aggregate 188 §12.3 BẢN PARENT (56.051 B, SẠCH, dedup python viết mới
  KHỚP TỪNG SỐ lần thứ 108 — lần sạch thứ ba kể từ đợt 179); LIMITS T2-188;
  T0-189/T5-189 .done (03:24Z/03:15Z). Script: `hidden_files/round189-t2/`.

## §0. Tóm tắt (parent quyết cuối)

- **Số hiệu: parent-186 (e) ĐÃ QUYẾT cách đếm A — cea79500 = #107; #106 reboot
  chưa xác minh; 7ea9d047 = #108; 6f1d9f87 = #109; 912f4a97 = #110;
  257c1eae = #111. Boot mới #112 = 27e6714f (T0-189 xác nhận 9 nguồn tươi),
  btime 02:33:19Z, gap #111→#112 = 12.155 s (3h22m35s, dài nhất chuỗi gần đây).**
- **(m) #111 (257c1eae) DƯƠNG (CUỐI ở cấp T2)** (+37,468 s, trong [33; 49,8];
  hẹp ĐÓNG 6 events đúng 1 requeue; rộng ĐÓNG bởi btime #112: 46 events đúng 1
  requeue toàn cửa; caveat overlap watcher +10 s / sampler +2 s (log) — NHƯNG
  T0-188 xác minh độc lập đồng hồ NHANH δ > 10 s trước #111 nên overlap thật
  có thể ~0 s; tiền lệ direction-blind, parent quyết). Run 188 bị requeue ở CẢ
  #110 VÀ #111 (reattach ×2, cùng run b7d4f596).
- **(m) #112 (27e6714f) SỐ THÔ: 0 requeue trong dải [33; 49,8]** (DB: 0 event
  trong [02:33:52Z, 02:34:09Z]); không run sống tại btime (run 189 finished
  btime −842 s; run 190 sched btime +152 s, ngoài dải) — dải ĐÃ ĐỊNH 0, không
  thể có requeue muộn trong dải; cửa rộng chờ #113 (chỉ xác nhận ngoài dải).
  T2 đề xuất KHÔNG CÓ ĐIỂM, parent quyết (hoặc dời xác nhận rộng sang T2-190).
- **INSIDE #107/#108/#109/#110/#111 (FULL153–157): KHÔNG TÍNH ĐƯỢC** theo quy ước
  đứng F-165-T2-1 — vẫn cần gap #106/#107, btime #106 chưa biết (không dữ kiện
  mới đợt 189). Chuỗi INSIDE GIỮ 7. Chéo cách đếm B: FULL157 27e6 FALSE (muộn
  3.316 s); chéo FULL156 cũng FALSE — mâu thuẫn ngược hướng #22; chuỗi B 4 → 0.
- **(m) #56 lần 32: VẪN CÓ ĐIỀU KIỆN** (5 hướng DB mới, tổng 130 — đều 0 dòng).
- **Mù #94?/#95?/#96?/#88?/#77? VẪN MỞ** (hole-recheck lần 33 NEW=0 mọi hố;
  R file 1.238 s lần 25 không đổi; U file-gap max 9.316 s KHÔNG ĐỔI; hố
  union-A mới 1.726 s (01:15:54–01:44:40Z 24/11) là NHÂN TẠO do 2 file
  exec-log bị xóa — KHÔNG phải hố mù mới, F-189-T2-2). CERT/FULL GIỮ 76/91.
- **EPERM: probe #109 (27e6714f, #112) ok=2 fail=0; sweep #109: 0 sóng thật**
  (384 file *.log, 17 lần marker — toàn tự trích).
- **POSTBOOT_PASS #112 CÓ 03:11:11Z (T5-189), KHÔNG caveat** (replay-đầy-đủ,
  poll=0, dpkg 1.461); replay #112 KHÔNG ĐÌNH TRỆ — DỨT chuỗi đình trệ #111.
  Tổng boot không cờ GIỮ 25.
- **Tuân thủ: 0 VI PHẠM** — mọi script nặng CHỜ poller T4-189 thoát hẳn
  (03:18:14Z, sau attempt1 HỢP LỆ: lượt yên #58, 20/20 + B 5/5 + median
  42,0 ms — lượt yên hợp lệ đầu tiên sau khi chuỗi đứt 1 → 0 ở (m)-188;
  (p) kiểm chứng live lần 9 thuộc T4-189) + kiểm gate trước/sau mỗi script.
  Chuỗi 0 vi phạm đề xuất 4 → 5 nếu đợt 189 sạch (parent quyết).
- **LƯU Ý NHÃN:** probe T2 #109 ≠ số hiệu boot #112 — bộ đếm probe riêng;
  đợt này probe #109 trên boot #112 (27e6714f). Ghi cả hai nhãn mọi nơi.

## §1. (m) — phân loại cuối ở cấp T2, parent quyết cuối

Dải đứng [33; 49,8] s (offset = requeue − btime). `events.run_id`/`job_runs.run_id`
là UUID đầy đủ; cột `job_runs`: `scheduled_for_utc`/`started_at_utc`/`finished_at_utc`.

### (m) #111 — 257c1eae-1c20-4bd4-a710-548adb1d34d5, btime 23:10:44Z — DƯƠNG
- Requeue eid 10875, run 188 (b7d4f596), 23:11:21,467938Z = btime +37,468 s →
  TRONG [33; 49,8]: trên biên dưới 4,468 s, dưới biên trên 12,332 s.
- Caveat phân số: offset thật ∈ (36,468; 37,468] s — xấu nhất vẫn TRONG 3,468 s,
  KHÔNG lật được. Các hiệu chỉnh prior (+0,32 s #90; +0,396 s #92; +0,99 s #95)
  đều giữ TRONG.
- Caveat overlap (KHÔNG lật verdict theo tiền lệ #87/#90/#99/#100/#105/#108 —
  parent quyết): watcher-187b poll cuối 23:10:54Z boot=912f4a97 (+10 s log;
  F-188-T5-1; watcher CHẾT theo #111); sampler-187 mẫu cuối #110 ghi 23:10:46Z
  (+2 s log). Hiểu theo nghĩa đen, +10 s dời offset về 27,468 s (DƯỚI biên
  dưới 5,532 s — SẼ LẬT nếu lấy theo nghĩa đen); +2 s → 35,468 s (TRONG
  2,468 s) — NHƯNG T0-188 KIỂM LẠI ĐỘC LẬP F-188-T0-2: đồng hồ NHANH
  δ > 10 s trước #111 (watcher-187b, mạnh hơn sampler δ > 2 s) → mẫu +10/+2 s
  (log) thực chất lấy TRƯỚC btime; overlap thật có thể ~0 s. Cùng mẫu
  direction-blind như #110 (literal +22 s sẽ lật nhưng δ > 22 s vô hiệu hoá).
  Poller T4-188 chưa bắt đầu lúc btime (bắt đầu 23:48:13Z) — không overlap.
- Cửa hẹp [23:10:44Z, 23:29:44Z] ĐÓNG: 6 events, đúng 1 requeue (eid 10875;
  + dispatched eid 10876 + reattached eid 10877 lúc 23:11:21,581Z — run 188
  REATTACHED lần thứ hai). Cửa rộng [23:10:44Z, 02:33:19Z] ĐÓNG bởi btime #112:
  46 events tới 02:33:31Z, đúng 1 requeue trong toàn cửa rộng (chỉ eid 10875);
  0 event trong (02:33:19Z, 02:33:31Z] nên độ mơ hồ btime 12 s không đổi số đếm.
  Event tiếp sau btime #112: eid 10921 reconciled 02:35:51Z + eid 10922
  dispatched run 190. Đúng 1 run sống tại btime #111 (run 188, sched 20:35:51Z,
  finished 23:38:46Z TIMEOUT) — DB tươi xác nhận.
- (m) #110 KHÔNG phân loại lại — chỉ đối chiếu: DƯƠNG (CUỐI) theo §12.3-188 (f).
- F-189-T2-1: brief ghi "(m) #110 đã DƯƠNG (CUỐI) ở §12.3-187 (f)" — SAI trích
  dẫn (xem §6); nội dung nay ĐÚNG, n 49/50 đã xác nhận.

### (m) #112 — 27e6714f-a60d-4105-a20b-7daca12d6421, btime 02:33:19Z — SỐ THÔ 0
- T0-189 giao phân loại cho T2-189 + parent. Truy vấn DB dải [33; 49,8]
  ([02:33:52Z, 02:34:09Z]): **0 event — 0 requeue trong dải.**
- Không run sống tại btime (run 189 finished btime −842 s; run 190 sched btime
  +152 s, started 02:35:51Z — ngoài dải). Không run nào tồn tại để bị requeue
  trong dải → **dải ĐÃ ĐỊNH 0**. Cửa rộng còn mở tới btime #113 (chỉ để xác nhận
  không có requeue ngoài dải — không ảnh hưởng verdict dải).
- T2 đề xuất **KHÔNG CÓ ĐIỂM**; parent quyết cuối (hoặc dời xác nhận rộng sang
  T2-190 theo mẫu đứng boot đợt N phân loại đợt N+1 — nhưng ở đây dải đã định).

### Số đếm (m) và nhịp reboot
- Parent-187 (f): n ứng viên 48/49 (sau #108 DƯƠNG). Parent-188 (f):
  (m) #110 DƯƠNG → **49/50**. (m) #111 DƯƠNG → **50/51 nếu parent chấp nhận
  ở §12.3-189**. (m) #112 KHÔNG CÓ ĐIỂM → không đổi n. n chính thức GIỮ 14.
- Gap: #110→#111 = 7.043 s; #111→#112 = 12.155 s (3h22m35s — dài nhất chuỗi
  gần đây, T0-189). Tốc độ reboot tới #112: 187 reboot / 342,25 h =
  1 per 109,8 phút. Marker sống qua 64 reboot (#49–#112, T0-189).
- Run 189 (98271fb8, sched 23:35:51Z 24/11): SUCCEEDED, finished 02:19:17Z
  (1795573157), started 23:38:46Z (cùng giây run 188 finished),
  started→finished 9.631 s (2h40m31s), jitter started−sched = 175 s, attempt 1,
  timed_out false. Kết cục thuộc T7-189; T2 chỉ ghi số.
  Run 190 (eb18559f, sched 1795574151 = 02:35:51Z 25/11): started 1795574151,
  status running — kết cục thuộc T7-190.
- POSTBOOT_PASS (T5-189): #112 CÓ 03:11:11Z (boot+37m52s, replay-đầy-đủ,
  poll=0, KHÔNG caveat — GST thư mục thật 269=269 + tools ĐÃ CÀI + dpkg
  1461/50 transaction); #111/#110/#109/#107/#104/#102/#101/#99/#98/#96/#95
  VẪN CÓ; #108/#105/#103/#100/#97 VẪN KHÔNG CÓ. **Tổng boot không cờ GIỮ 25.**
  Replay #112 KHÔNG ĐÌNH TRỆ — heal 02:35:40Z (boot+2m21s), replay host chạy
  thật 50 transaction, dpkg 2 → 1461, GST 32 → 269 (02:57:39Z), xong 03:10:41Z;
  DỨT chuỗi đình trệ #111 (kết luận thuộc T5-189).

## §2. INSIDE — theo quy ước đứng F-165-T2-1

### Theo cách đếm A (parent-186 (e) ĐÃ QUYẾT): KHÔNG TÍNH ĐƯỢC — PENDING
- INSIDE #110 = FULL156, INSIDE #111 = FULL157 — cả hai đều cần gap #106/#107
  (#106→#107); btime #106 chưa biết. KHÔNG có dữ kiện mới đợt 189: T0-189 chỉ
  xác minh boot #112 (9 nguồn tươi); GAP không thêm btime #106.
- **Chuỗi INSIDE GIỮ 7** (parent-186 (d): #104 TRUE FULL150 → 6; #105 TRUE
  FULL151 → 7); #107/#108/#109/#110/#111 pending → chuỗi chờ #106 xác minh,
  KHÔNG đứt, KHÔNG tăng. T2-190 tính lại khi btime #106 được xác lập.
- F-189-T2-5: INSIDE #110/#111 PENDING dưới cách đếm A (nối F-188-T2-5).

### Chéo cách đếm B (cea=#106, 7ea=#107, 6f1=#108, 912f=#109, 257c=#110, 27e6=#111) — CHỈ GHI NHẬN
- FULL157 (n=157, mean 1h43'20", median 1h55'41", p10 1631,80 s, p90 8839,80 s,
  sd 0h55'05", in 88/34/12/5): INSIDE 27e6 (B-#111) FALSE — muộn 3.316 s qua
  band end (exact 3.315,2 s), dải [23:37:55Z 24/11, 01:38:03Z 25/11].
  Chéo FULL156 cũng FALSE (muộn 10.411 s) — mâu thuẫn ngược hướng #22
  (tổng 22; #21 ở đợt 188). **Chuỗi B 4 → 0 (reset).**
  FULL156 p10/p90 khớp T2-188 (1623,00/8787,50).
- Chuỗi theo B đã là 7 → 0 → 1 → 2 → 3 → 4 → 0 — NHƯNG parent đã quyết cách đếm
  A, nên dãy này chỉ là tham chiếu phương pháp, không dùng làm chuỗi đứng.

## §3. Mù — walk B0 11:15:18Z 21/11 → B1 03:21:00Z 25/11 (= 317.142 s)

Walk chạy 03:20:57–03:22:38Z TRÊN boot #112 (btime 02:33:19Z); B1 = 03:21:00Z.
Quét theo mtime (bền vững qua reboot) nên không vô hiệu. Script: `blind9797-*.py`,
`witness879394.py`, `hole-recheck9797.py` (đã đổi B1 01:33:00Z → 03:21:00Z toàn
cục trước khi chạy; 0 sót "01:33:00Z"; W đổi round188-t2 → round189-t2 cho
hole-recheck — known = danh sách đợt trước, theo đúng thực hành T2-188).

- File trong cửa sổ: repo-1 4.398 (188: 3.902, +496); hidden_files 9.203
  (188: 8.947, +256); outside 3.471 (188: 3.372, +99); /tmp 631 (188: 48, +583
  — tmpfs có lại file sau reboot #112); fifthscope 20 (không đổi).
  Merged unique second-marks 7.549 (188: 7.288, +261).
- **R file: max 1.238 s — lần thứ 25 KHÔNG ĐỔI.** R union-A 1.222 s,
  union-B 1.211 s (không đổi). Content-ts trong hố R union: 0.
- S: max 3.235 s — OPEN (không đổi). S union-A 662 s, union-B 591 s (không đổi).
- T: max 627 s — CLOSED (không đổi). T union-A 38 s (không đổi).
- **U file: max 9.316 s (15:00:33Z → 17:35:49Z 24/11) — KHÔNG ĐỔI so với đợt
  188.** Thứ hai 8.968 s (15:06:19Z → 17:35:47Z 23/11) không đổi; thứ ba
  2.013 s (22:16:57Z → 22:50:30Z 24/11 — ĐÃ CÓ ở đợt 188, T2-188 không nhắc);
  **MỚI thứ tư 1.726 s (01:15:54Z → 01:44:40Z 24/11)** — NHÂN TẠO do 2 file
  exec-log bị xóa (proc_3508dd8c62eb 01:32:24Z + proc_50783e1c71f1 01:44:03Z),
  KHÔNG phải hố mù mới (F-189-T2-2 — xem §6).
- U union-A: max 9.316 s (cùng hố); thứ hai 8.968 s; thứ ba 2.013 s; thứ tư
  1.726 s (cùng nhân tạo trên).
- **U union-B: max 8.372 s (15:00:33Z → 17:20:05Z 24/11) — KHÔNG ĐỔI so với
  đợt 188.** Thứ hai 7.861 s (15:06:19Z → 17:17:20Z 23/11) không đổi.
  SYS marks mới: SYS257C = 23:10:56Z (T5-188 trực tiếp, journal first +12 s,
  /proc/1 +11,989 s); SYS27E6 = 02:33:31Z (T0-189 survey trực tiếp, journal
  first +12 s, wtmp begins 02:33:30Z, /proc/1 +11,72 s). SYS912F (#110) KHÔNG
  thêm — không có đo head trực tiếp trên hồ sơ (như SYS105/SYS-7ea).
- Content mới: replay-watch-188 (257c1eae) 273 dòng trong U (START 23:55:49Z,
  CHẾT theo #112); ram-sampler-188-FROZEN 123 dòng trong U (đóng băng 01:48Z).
  replay-watch-187 vẫn 53 dòng (như đợt 188; log không tăng — watcher chết
  theo #110).
- Sessions: exec-logs 333 trong cửa sổ (188: 336, −3 — file bị xóa); #64–#86:
  1 thô → 0 thật MỚI (cùng 1 file `proc_34889a901a7e.log` — session main agent,
  span 2026-11-20T11:26:05..2026-11-24T23:46:54, trích dẫn build-loop-log — mẫu
  F-184-T2-3). Content-ts trong hố R union: 0; trong hố U file max: 9 — toàn
  mốc đã biết (5× 17:19:50Z btime #107 trích dẫn; 17:20:50Z; 17:24:01Z launcher
  T4-187; 15:15:34Z; 15:13:32Z đầu span sampler T9-187). R-head 0; U-tail tới
  03:20:57Z (3 s trước B1, trên boot #112).
- Witness: exec-logs 316 trong cửa sổ (188: 336, −20); bỏ qua 30 log trích dẫn
  (quote-marker; 188: 28). #87–#93: 1 thô → 0 thật (chỉ file session main
  agent, trích dẫn); #94–#99: 2 thô → 0 thật (file session main agent + file
  MỚI proc_f921c1b2aee4.log — shell cha của các daemon sampler/b2watch/
  probe-loop/autotrigger T9-189, tạo 02:43Z 25/11; mọi timestamp 23/11 trong
  đó đều là trích dẫn brief); #100: 4 thô → 0 thật MỚI (đợt 188: 6 — MẤT 3:
  proc_95067dbe9645 + proc_af664d19db2c + proc_bb14329ae4f6; còn
  proc_e606d7b4f921 + proc_e0c4ed13d7cd + 2 file quote dài); #101: 4 → 0;
  #102: 5 → 0; #103: 12 → 0; #104: 6 → 0; #105: 8 → 0; #106-B/#107-A: 6 → 0;
  #107-B/#108-A: 8 → 0; #108-B/#109-A: 5 → 0; #109-B/#110-A: 8 → 0;
  #110-B/#111-A: 3 → 0; **#111-B/#112-A: 5 thô → 0 thật MỚI** (5 file span
  dài trích dẫn; đã kiểm tay: 0 dòng nào trong 02:30–02:36Z ở cả 5 file — span
  cắt #112 chỉ nhờ các timestamp trích dẫn xa nhau, gồm cả giờ tương lai
  23:59:01/23:49:06/23:48:13 ngày 25/11). **0 hoạt động thật mới tại
  #87–#112 ngoài overlap đã biết.**
- **Hole-recheck lần 33: NEW=0 ở MỌI hố (27 hố).** H-E1-88: 337 hit, 0 mới
  (lần thứ 33 liên tiếp); H-U16: 3 hit, 0 mới; whole-tree 27.685 file
  (188: 28.836, −1.151 — tỉa exec-log); find stderr 1 dòng: Permission denied
  `/home/hatch/.stagged-uploads` (có từ trước, không phải hố mới).
- **CERT/FULL GIỮ 76/91. Mù #94?/#95?/#96?/#88?/#77? VẪN MỞ.**

## §4. (m) #56 lần 32 + tuân thủ

- (m) #56 lần 32: thêm 5 hướng DB mới (tổng 130 — T2-188: 125), đều 0 dòng
  trong cửa sổ ứng viên W [19:33:20Z, 19:33:37Z] 20/11/2026
  (epoch 1795203200..1795203217): (cxxvi) `device.calendar_events` start_at;
  (cxxvii) `device.media_upload_events` received_at; (cxxviii)
  `self_improvement.learning_adoption_events` created_at; (cxxix)
  `agent.recovery_owner_terminal_events` claimed_at; (cxxx)
  `ideas.bandit_folded_events` folded_at. Đã kiểm chưa dùng trong LIMITS T2
  trước khi truy vấn (truy vấn tươi qua muse.db, ÂM TÍNH).
- File: (vii) 333 file trong D (không đổi), max mtime 20:15:33,130Z
  (round156-t10.done; max đã biết 20:19:34Z); (viii) 0 exec-log; (vii-b) 0;
  (vii-c) 0.
- Cửa sổ R ∈ [2,56251; 2,66817) s, J ∈ [2,566; 2,80753] s KHÔNG ĐỔI.
  **(m) #56 VẪN CÓ ĐIỀU KIỆN lần thứ 32; n chính thức GIỮ 14.**
- Tuân thủ (F-184-T2-8 — bài học đứng): poller T4-189 bắt đầu 02:47:12Z,
  hạn cắt 04:30:00Z, poll 45 s. Thoát 03:18:14Z (waiter T2 xác nhận
  POLLER-EXITED 03:18:14Z, poll-log-mtime-age 92 s) sau attempt1 HỢP LỆ:
  20/20 + LOP B 5/5 + tickCost median 42,0 ms ≤ 60 — LƯỢT YÊN HỢP LỆ, dùng
  ngân sách 1/3. Đây là lượt yên hợp lệ đầu tiên sau khi chuỗi đứt 1 → 0 ở
  (m)-188 (số hiệu lượt yên thuộc T4-189; (p) kiểm chứng live lần 9 thuộc
  T4-189). T4 attempt1 chạy 03:12:48–03:16:42Z TRƯỚC O8 (T0-189), 0 chồng lấn.
  Mọi script nặng (walk, merged, content, sessions, witness, hole-recheck,
  sweep, m56-file) chạy SAU khi poller thoát, mỗi script kiểm gate trước
  (0 tiến trình poll-wait/run-attempt + poll-t4.log mtime đóng băng) và kiểm
  lại sau. **0 VI PHẠM phía T2-189.** Chuỗi 0 vi phạm: parent-188 (p) = 4 →
  đề xuất 4 → 5 nếu đợt 189 sạch (parent quyết).
- Lưu ý pgrep: mọi lần kiểm tay dùng mẫu ngoặc `run-attempt-18[9]` /
  `poll-wait-t4-18[9]` (không tự khớp) — bài học F-188-T2-6 đã áp dụng đúng
  cả đợt, không báo sai lần nào.

## §5. EPERM probe + sweep — 0 sóng thật

- **Probe #109: 02:50:06Z, boot 27e6714f (#112), tmp+ws ok=2 fail=0.**
  MemAvailable 881.920 kB lúc probe. Log `hidden_files/eperm-probe-v2.log`
  có dòng đổi boot 257c1eae → 27e6714f; heartbeat cập nhật n=109
  (pid 205198, ts 02:50:06Z). File ws: `hidden_files/eperm-probe-ws-109.txt`
  (nội dung "probe-189"); tmp: `/tmp/eperm-probe-tmp-109.txt`.
  (Nhãn probe #109 ≠ số hiệu boot #112 — bộ đếm probe riêng; xem §0.)
- Sweep #109, cửa sổ [23:50:09Z 24/11, 02:50:06Z 25/11]: 384 file *.log,
  5 file có marker, 17 lần xuất hiện — toàn tự trích ("sóng EPERM đã tắt" ×15
  trong log phân tích T2/T0/T8; "CẢNH BÁO" ×1 + "Operation not permitted" ×1
  trong chính eperm-sweep188.log). "sóng EPERM vẫn bật" ×0.
- **0 sóng EPERM thật trong cửa sổ.** (F-150-T2-2: không grep -r tùy tiện
  cho chuỗi marker — sweep chỉ đọc *.log có giới hạn.)

## §6. Phương pháp, lỗi, F mới, câu hỏi cho parent

- F-189-T2-1: brief ghi "(m) #110 đã DƯƠNG (CUỐI) ở §12.3-187 (f)" — SAI trích
  dẫn: §12.3-187 (f) quyết #108 DƯƠNG; quyết #110 DƯƠNG là §12.3-188 (f),
  viết ~02:55–03:07Z SAU khi brief ra (aggregate 188: 48.141 B lúc T10 đóng
  02:51Z → 56.051 B sau khi parent viết). Nội dung nay ĐÚNG, n 49/50 đã được
  xác nhận. Đã sửa docstring m-check189.py cho khớp và chạy lại (exit 0).
- F-189-T2-2: tỉa exec-log MỞ RỘNG — kiểm 40 đường dẫn exec-log được trích
  trong log witness/sessions đợt 187/188: chỉ còn 34, MẤT 6 (2 đã biết
  F-188-T2-4 + 4 mới: proc_4557ab41e3c7, proc_95067dbe9645, proc_8f7c301fcd71,
  proc_f0bea09d5272); kiểm toàn bộ 351 đường dẫn trong danh sách merged đợt
  188: MẤT 34 (9,7%) — tổng **39 file exec-log đã biến mất** (34 trong danh
  sách merged + 5 chỉ trích trong witness log, 2 trong số đó đã biết ở
  F-188-T2-4). Nhiều thư mục exec-log của agent nay RỖNG hoàn toàn (13+ thư
  mục; vd 3956a652 + ec6c5cab, mtime thư mục 02:01Z/02:21Z 25/11 — TRƯỚC reboot
  #112). Hệ quả 1: hố union-A 1.726 s mới (§3) là nhân tạo do 2 file bị xóa,
  không phải hố mù mới. Hệ quả 2: bộ 6 file bằng chứng #100 còn 3/6 trên đĩa.
  Bằng chứng overlap +22 s vẫn đứng theo hồ sơ đợt 187/T4-182. Cơ chế chưa xác
  định (không phán); khoảng mất bao gồm reboot #112 nhưng mtime thư mục cho
  thấy việc xóa bắt đầu trước đó. Script: evidence-check189.py/.log +
  evidence-check189b.log.
- F-189-T2-3: MEMORY.md bị sửa từ bên ngoài trong lượt này (mục đợt 185 viết
  lại + thêm mục 'Đợt 188'); AGENTS.md xác nhận parent không sửa MEMORY.md;
  T1-189/T6-189 cùng quan sát; T5-189 F-189-T5-3 ghi lần sửa ~02:51Z. Chỉ ghi
  nhận, không phán tác giả; giữ làm bằng chứng.
- F-189-T2-4: sessions.py lần chạy đầu dùng epoch gõ tay SAI (R gap
  07:55:18–08:15:40Z, U gap 21:40:33Z–00:15:49Z — lệch 12.000 s / 24.000 s);
  số đếm in-gap của lần sai (62 trong cửa U sai) KHÔNG dùng. Đã chạy lại với
  epoch đúng lấy từ python (1795259718 1795260940 1795532433 1795541749) — mọi
  số trong LIMITS này đều từ lần chạy đúng (phần jump-witness không dùng
  tham số gap nên không bị ảnh hưởng). Bài học: không gõ tay epoch; lấy output
  python thẳng vào lệnh.
- F-189-T2-5: INSIDE #110/#111 PENDING dưới cách đếm A (nối F-188-T2-5);
  chéo B: FULL157 27e6 FALSE + chéo FULL156 FALSE — mâu thuẫn ngược hướng #22;
  chuỗi B 4 → 0.
- Tham chiếu chéo (không phải F của T2): F-189-T0-1 (boot #112 rơi vào cửa sổ
  đóng sổ đợt 188 — T10-188 làm việc trên boot mới nhưng .done không nhắc);
  F-189-T0-2 (dấu chênh Cloudflare ở T0-188 bị đảo — local chậm hơn CF ~1–2 s,
  không phải nhanh +1 s; verdict ĐÚNG không đổi); F-189-T0-3 (socket X193 của
  T4 còn sót); F-189-T5-1 (watcher-188 dừng poll 02:27:51Z, trước reboot —
  không mẫu overlap mới, chuỗi dừng ở mẫu 21); F-189-T5-2 (§12.3-187 nguồn gốc
  CHƯA NGÃ NGŨ — nội dung (c)/(k) không tranh chấp); F-189-T5-3 (xem F-189-T2-3).
- Lỗi đã sửa trong đợt: (1) docstring m-check189.py lạc hậu về §12.3-188
  (đã sửa + chạy lại exit 0); (2) eperm-sweep189.py sed thay nhầm cả W0/W1
  (đã sửa bằng python: W0 = 23:50:09Z 24/11, W1 = 02:50:06Z 25/11);
  (3) chuỗi label union-B trong content.py bị hỏng `\"` do muse.edit (đã sửa
  bằng python replace thành `))")`, kiểm syntax OK cho toàn bộ 10 script);
  (4) lần chạy m-check189.py đầu tiên sai đường dẫn (cd không áp dụng sau
  background `&` — chạy lại bằng đường dẫn tuyệt đối thì OK); (5) hole-recheck
  W: ban đầu sed nhầm sang round189-t2, đã revert về round188-t2 (known =
  danh sách đợt trước); (6) sessions epoch gõ tay sai (F-189-T2-4).
- Câu hỏi cho parent (§12.3-189):
  (a) Chấp nhận (m) #111 DƯƠNG (CUỐI)? → n ứng viên 49/50 → 50/51; n chính
      thức GIỮ 14. (m) #112 SỐ THÔ 0 requeue — chấp nhận KHÔNG CÓ ĐIỂM (dải
      đã định) hay dời xác nhận rộng sang T2-190?
  (b) INSIDE #107/#108/#109/#110/#111 PENDING, chuỗi GIỮ 7 chờ #106 xác minh?
  (c) Chéo cách đếm B (chuỗi 4 → 0; mâu thuẫn #22) chỉ ghi nhận?
  (d) POSTBOOT_PASS #112 CÓ không caveat (replay-đầy-đủ, poll=0) — tổng boot
      không cờ GIỮ 25; replay #112 KHÔNG ĐÌNH TRỆ (dứt chuỗi #111)?
  (e) Chuỗi 0 vi phạm 4 → 5 nếu đợt 189 sạch? (p) lần 9 thuộc T4-189 (lượt
      yên #58 HỢP LỆ — chuỗi lượt yên 0 → 1).
  (f) Mù #94?/#95?/#96?/#88?/#77? VẪN MỞ; CERT/FULL GIỮ 76/91;
      (m) #56 VẪN CÓ ĐIỀU KIỆN lần thứ 32.
  (g) Ghi nhận F-189-T2-2 (39 file exec-log mất; hố union-A 1.726 s là nhân
      tạo; bộ bằng chứng #100 còn 3/6) + F-189-T2-3 (MEMORY.md sửa ngoài)?
- Script đợt này: `hidden_files/round189-t2/` (m-check189.py/.txt,
  blind9797-*.py + blind189-*.log, witness879394.py + blind189-witness.log,
  hole-recheck9797.py + hole-recheck189.log, eperm-sweep189.py +
  eperm-sweep189.log, m56-189.py/.log, evidence-check189.py/.log +
  evidence-check189b.log, gate-wait189.sh/.log/.out).
