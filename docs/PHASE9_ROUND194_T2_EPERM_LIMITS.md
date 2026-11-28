# PHASE9_ROUND194_T2_EPERM_LIMITS.md — T2 đợt 194 (EPERM probe + (m)/INSIDE + mù)

Luồng nền đợt 194. Đợt 193 đã đóng, parent CHẤP NHẬN toàn bộ ở §14.2-193 (aggregate docs/PHASE9_ROUND193_LIMITS.md, 56.830 B — NGUỒN GỐC CHƯA NGÃ NGŨ, nội dung parent chấp nhận 0 đính chính, kiểm đếm lần thứ 123; KHÔNG ghi "parent viết trực tiếp", KHÔNG ghi 193 là "lần sạch"; KHÔNG dùng DB result_summary làm nguồn narrative — F-193-T7-2/T7-194 F-194-T7-3).
Nguồn đúng thứ hai: §14.2 aggregate 192 (docs/PHASE9_ROUND192_LIMITS.md, 99.871 B, bản parent-kiểm).
Cửa sổ mù: B0 2026-11-21T11:15:18Z → B1 [xem §3].
Boot: #117 = 1c0bcaad (btime 20:22:37Z, parent-193 (e) XÁC NHẬN); #118 = 8a23277a (btime 22:21:55Z, parent-193 (e) XÁC NHẬN); #119 ứng viên = 55c9e0b7 (btime 02:28:08Z 26/11, T01-194 khảo sát 9 nguồn — (m) #119 thuộc T2-195).
Viết 26/11/2026 ~03:15–04:15Z; hạn cờ ~05:00Z, hạn cứng ~05:35:51Z. KHÔNG PUSH.

## §0. Tóm tắt verdicts (cấp T2 — parent quyết cuối ở §14.2-194)

- (m) #117: **KHÔNG CÓ ĐIỂM (CUỐI)** — 0 event bất kỳ trong [20:22:37Z, 20:25:00Z]; 0 requeue trong [20:22:37Z, 20:35:51Z]; không run nào spanning. n: không đổi (quy tắc đứng).
- (m) #118: **DƯƠNG (CUỐI)** — requeue eid 11184, run 196 (32dddfa5), +43,802063 s, TRONG [33; 49,8]; dải thật [42,802; 43,802] (trên biên dưới 9,80 s, dưới biên trên 6,00 s); cửa (m) đúng 3 event; duy nhất 1 requeue trong [22:21:55Z, 23:35:51Z]. n: +1/+1 theo quy tắc đứng.
- **F-194-T2-1 (số n — T2-193 áp dụng SAI quy tắc cho #116):** quy tắc đứng (7 tiền lệ 184–191, parent chấp nhận mỗi lần): DƯƠNG → +1/+1, KHÔNG CÓ ĐIỂM → không đổi. (m) #116 DƯƠNG phải là **52/53**, không phải 51/52 như T2-193 ghi (không có mũi tên, không lý do) và §14.2-193 (f) giữ lại (nguồn gốc CHƯA NGÃ NGŨ — không coi là parent sửa luật). Chuỗi đã đính chính: sau #116 = 52/53; #117 KHÔNG CÓ ĐIỂM → GIỮ 52/53; **#118 DƯƠNG → 53/54**. Nếu parent giữ mốc đã chấp nhận 51/52 thì #118 → 52/53. **Parent quyết mốc.** n chính thức GIỮ 14.
- INSIDE #113/#114/#115 (đếm A): **KHÔNG TÍNH ĐƯỢC** (thiếu btime #106); chuỗi GIỮ 7. Đếm B (tham chiếu): **#115 TRUE — kiểm lại KHỚP** (4dda8234 vs FULL161, biên dưới +5.390 s, biên trên −2.007 s); chuỗi B 0 → 1. Tham chiếu mới: B-#116 FALSE (muộn 5.392 s); B-#117 TRUE (biên +5.488/−1.913 s).
- Mù: R 1.238 s MỞ (lần 27) / S 3.235 s MỞ / T 627 s ĐÓNG / U file 9.316 s MỞ / U union-B 8.372 s MỞ; CERT/FULL GIỮ 76/91; 0 hoạt động thật mới ở mọi witness.
- Hole-recheck lần 37: NEW=0 ở 27 hố cũ (H-E1-88 lần 36); hố MỚI H-U20 6.175 s NEW=7 (kỹ thuật, 0 hoạt động thật).
- (m) #56 lần 36: **VẪN CÓ ĐIỀU KIỆN** (DB 5 hướng mới đều 0 dòng, tổng 150; file (vii) 333, max 20:15:33.130Z — không đổi).
- EPERM: probe #113 04:05:03Z ok=2 fail=0; sweep 566 log, 0 sóng thật.
- Bằng chứng bị xóa: **F-194-T2-8 — purge hàng loạt exec-log: 349-list 0/349 còn (mới mất 118); #100 còn 0/6** (proc_34889a901a7e mất).
- Vi phạm đợt 194: **F-194-T2-9 VI PHẠM pha (b) attempt1** (T01 recount + P4 tsc/parity + P1 chrome; load1_max 15,11; 68 spike; B2 VI PHẠM → attempt1 vô hiệu) — **chuỗi 0 vi phạm GIỮ 0** (đã đứt đợt 193). F-194-T56-4 (chunk 4 chồng ~48 s với t01 O8, không phải T4, 0 bằng chứng ảnh hưởng) giao parent quyết riêng. T56 harness **0 chồng pha (b) với T4**; lock log 3 cửa attempt: 0 dòng phi-T4. Lượt yên #62: 0/3 attempt hợp lệ (attempt3 sạch B2 nhưng tickCost median 61,0 ms, thiếu 1,0 ms); live-check lần 13 KHÔNG THỂ KIỂM, chuỗi live ĐẠT GIỮ 9.
- Run 196 SUCCEEDED cf 117 s — CA #25 MỚI (T7-194 quyết, họ 25/22); run 197 SUCCEEDED cf 8 s (KHÔNG CA); run 198 RUNNING lúc đọc.

## §1. (m) #117 CUỐI + (m) #118 CUỐI + run 196/197/198 + boot #119 (thô)

### (m) #117 = KHÔNG CÓ ĐIỂM (CUỐI)
- **0 event bất kỳ** trong [20:22:37Z, 20:25:00Z] (bao cửa (m) [20:23:10Z, 20:23:26.8Z] trọn vẹn) — DB tươi (muse.db, scheduler.events, đọc ~02:47Z 26/11).
- **0 `requeued_after_restart`** trong [20:22:37Z, 20:35:51Z].
- Không run nào sống tại btime (run 195 đã xong 17:54:32Z; run 196 dispatch sau boot 20:35:51Z).
- **n: không đổi** (KHÔNG CÓ ĐIỂM → không đổi n, quy tắc đứng — xem F-194-T2-1).

### (m) #118 = DƯƠNG (CUỐI)
- Requeue duy nhất: eid **11184**, 22:22:38.802063Z, run 196 (32dddfa5-12e3-4bdd-817d-81f7942adb9a), detail "daemon startup recovery" = btime #118 (22:21:55Z) **+43,802063 s — TRONG [33; 49,8]**.
- Dải thật (btime nguyên giây): **[42,802; 43,802] s — TRONG cả hai biên** (trên biên dưới 9,80 s: 42,802 − 33 = 9,802 s; dưới biên trên 6,00 s: 49,8 − 43,802 = 5,998 s).
- Cửa (m) [22:22:28Z, 22:22:44.8Z] có đúng 3 event: requeue 11184 + dispatched 11185 (22:22:38.905556Z) + reattached 11186 (22:22:39.016437Z, "execute turn already complete (model-output evidence)").
- Kiểm rộng: đúng **1** `requeued_after_restart` trong [22:21:55Z, 23:35:51Z] (eid 11184).
- Overlap: requeue là dòng DB (scheduler.events) với run_id đầy đủ + dispatched/reattached đi kèm — không phải artefact log. (Caveat F-194-T7-2: worker_boot_generation KHÔNG ổn định theo run — T2 KHÔNG dùng boot_gen làm bằng chứng; verdict chỉ dựa trên dòng DB + btime.)
- **n: +1/+1** (DƯƠNG → +1/+1, quy tắc đứng — xem F-194-T2-1).

### F-194-T2-1 (n ứng viên — T2-193 áp dụng SAI quy tắc cho #116, parent quyết mốc)
- Quy tắc đứng, parent chấp nhận 7 lần (đợt 184–191): DƯƠNG → +1/+1; KHÔNG CÓ ĐIỂM → không đổi. Chuỗi: #102 → 45/46; #103 → 46/47; #105 → 47/48; #108 → 48/49; #110 → 49/50; #111 → 50/51; #113 → 51/52 (parent-191 (f)); #114/#115 KHÔNG CÓ ĐIỂM → GIỮ 51/52 (parent-192 (f)).
- (m) #116 DƯƠNG do đó PHẢI là **52/53** — nhưng T2-193 ghi "GIỮ 51/52" không mũi tên, không lý do, và §14.2-193 (f) (nguồn gốc CHƯA NGÃ NGŨ) giữ nguyên số sai. T2-194 cờ lỗi này, KHÔNG lặng lẽ chấp nhận.
- Chuỗi đã đính chính: sau #116 = 52/53; #117 KHÔNG CÓ ĐIỂM → GIỮ 52/53; **#118 DƯƠNG → 53/54**. Nếu parent giữ mốc đã chấp nhận 51/52 thì #118 → 52/53. **Parent quyết mốc cuối; quy tắc +1/+1 đứng, không tranh chấp.**
- **n chính thức GIỮ 14.**

### Run 196 / 197 / 198 (số liệu cho T7-194, không phán verdict — T7 đã quyết CA)
- Run 196 (32dddfa5, sched 1795638951 = 20:35:51Z, đợt 193): **SUCCEEDED**, finished 1795648305 = 23:11:45Z (trước hạn 23:35:51Z 24m06s, timed_out=false); started_at VIẾT LẠI 1795645358 = 22:22:38Z (btime #118 +43 s); claimed CUỐI 1795648188 = 23:09:48Z; **claimed→finished = 117 s (≥60 s — CA #25 MỚI, T7-194 quyết; họ nay 25 ca / 22 trong cửa sổ)**; boot_gen `cron_boot_17dd01f5…` lúc đóng (giá trị ghi lại, KHÔNG dùng làm bằng chứng boot — F-194-T7-2).
- Run 197 (c6cac684, sched 1795649751 = 23:35:51Z 25/11, lượt đóng đợt 193): **SUCCEEDED**, finished 1795651821 = 00:10:21Z 26/11; claimed 1795651813; claimed→finished = 8 s (KHÔNG phải CA); started 1795649751 (jitter 0).
- Run 198 (8256daf7, sched 1795660551 = 02:35:51Z 26/11, đợt 194): RUNNING lúc đọc; started = claimed = 1795660551 (jitter 0). Kết cục thuộc T7-195.
- Cách đếm nối tiếp theo quyết (n)-193 + kiểm độc lập từ DB tươi (muse.db, scheduler.job_runs, job_id vcut-build-loop, ~02:47Z 26/11): 8 run liên tiếp cách nhau đúng 10.800 s; 8256daf7 = run 198 — **KHỚP brief ("lượt này = run 198")**, không lặp mẫu F-193-T01-1 (lần này brief đếm đủ lượt đóng; T7-194 F-194-T7-1 chỉ ghi epoch sched trong brief sai −400 s, số hiệu run ĐÚNG).
- **F-194-T2-6 (lỗi giờ của chính T2-194, đã sửa TRƯỚC khi đóng LIMITS):** bản nháp m-check194.py ghi finished run 196 = "23:38:25Z" và run 197 = "01:23:41Z" (cộng tay sai từ epoch). T7-194 LIMITS đối chiếu độc lập cho 23:11:45Z / 00:10:21Z; T2 kiểm lại bằng `datetime.fromtimestamp` và sửa cả hai chỗ trong script + chạy lại (exit 0). Số epoch trong DB không đổi; chỉ giờ clock hiển thị sai. Kết luận (không run spanning btime #119) không đổi: run 197 xong 00:10:21Z, trước boot #119 2h17m47s.

### Boot #119 ứng viên (thô — phân loại thuộc T2-195)
- Boot id `55c9e0b7-2d97-4260-a6ca-45538e24b6c1`, btime **1795660088 = 02:28:08Z** (đọc trực tiếp /proc/stat + uptime -s lúc ~02:46Z; T01-194 khảo sát 9 nguồn: journal idx 0 first 02:28:27Z = btime +19 s; wtmp begins 02:28:27Z; /proc/1 start_ticks 1784 = btime +17,84 s; CF-Date local chậm hơn ~2 s, cùng dấu với #118). Gap #118→#119 = **14.773 s (4h06m13s)**.
- **0 event** bất kỳ trong [02:28:08Z, 02:30:31Z] (bao cửa (m) [02:28:41Z, 02:28:58Z]); 0 requeue trong cửa; không run nào sống tại btime (run 197 đã xong 00:10:21Z; run 198 dispatch sau boot 02:35:51Z). T7-194 §5 ghi rộng hơn: 0 event scheduler nào trong 01:15:34Z → 02:35:41Z (khoảng lặng + daemon hồi phục bằng reconciled 02:35:41Z, KHÔNG qua requeue).
- Thô: (m) #119 trông như KHÔNG CÓ ĐIỂM, nhưng phân loại thuộc T2-195 (T01-194 khảo sát boot).

## §2. INSIDE #113/#114/#115 (đếm A) + #115/#116/#117 (đếm B)

- Đếm A (đứng): **KHÔNG TÍNH ĐƯỢC** — btime #106 vẫn chưa biết; đợt 194 không có dữ liệu mới (T01-194 chỉ khảo sát boot #119). Chuỗi GIỮ 7 (parent-193 (d): #113/#114 KHÔNG TÍNH ĐƯỢC → 7; #115 cùng lý do). INSIDE #107–#115 theo A đều CHỜ.
- Đếm B (chỉ tham chiếu, không phải chuỗi đứng):
  - FULL161 (n=161, mean 1h45'54", median 1h56'27", p10 1667.00 s, p90 9064.00 s) — chuỗi nối từ m-check193 (assert khớp giá trị in của T2-193).
  - 4dda8234 (B-#115) vs FULL161 neo 14:23:56Z (ebc5a3b9) → **TRUE — KIỂM LẠI KHỚP** (trong dải [14:51:43Z, 16:55:00Z]; biên dưới +5.390 s, biên trên −2.007 s); chuỗi B 0 → 1 (parent-193 (d) đã chấp nhận).
  - FULL162 (n=162, mean 1h46'44", median 1h56'46", p10 1668.60 s, p90 9072.10 s) = FULL161 + gap 14.464 s (#116→#117).
  - 1c0bcaad (B-#116) vs FULL162 neo 16:21:33Z (4dda8234) → **FALSE** (muộn 5.392 s sau cuối dải [16:49:21Z, 18:52:45Z]; gap #116→#117 = 14.464 s quá dài); chuỗi B 1 → 0 nếu parent cho tiến.
  - FULL163 (n=163, mean 1h46'49", median 1h57'05", p10 1670.20 s, p90 9071.20 s) = FULL162 + gap 7.158 s (#117→#118).
  - 8a23277a (B-#117) vs FULL163 neo 20:22:37Z (1c0bcaad) → **TRUE** (trong dải [20:50:27Z, 22:53:48Z]; biên dưới +5.488 s, biên trên −1.913 s); chuỗi B 0 → 1 nếu parent cho tiến từ B-#116.
  - B-#116/B-#117 là THAM CHIẾU cho T2-195; parent quyết chuỗi B có tiến hay không. Đếm A vẫn đứng.
- Khoảng cách: #114→#115 = 21.493 s (dài nhất chuỗi gần đây); **#115→#116 = 7.057 s**; **#116→#117 = 14.464 s**; **#117→#118 = 7.158 s**; #118→#119cand = 14.773 s. Tốc độ reboot: tới #116: 191 reboot / 356,05 h = 1 lần / 111,8 phút; tới #117: 192 / 360,07 h = 1 lần / 112,5 phút; tới #118: 193 / 362,06 h = 1 lần / 112,6 phút; tới #119cand: 194 / 366,16 h = 1 lần / 113,2 phút.

## §3. Mù — blind walk (B0 2026-11-21T11:15:18Z → B1 2026-11-26T03:42:20Z = 404.822 s)

- Merged second-marks: **10.088** (193: 9.183, +905). Scope mtime trong cửa sổ: repo-1 6.736 / hidden_files 10.546 / outside 30.702 / tmp 2.928 (+34 vs gen — tmpfs churn) / fifthscope 0. Kiểm chéo investigate (os.walk, loại cùng 4 thư mục): repo-1 6.736 / hidden_files 10.546 / outside 30.702 / tmp 2.962 — lệch nhỏ (file bị xóa/ghi giữa 2 lần quét). Outside +3.696: chủ yếu tmp-round19x-p3 (P3 trích frame) + agents. find stderr: 1 dòng (Permission denied /home/hatch/.stagged-uploads, như đợt 192/193).
- R [11:15:18Z → 11:38:28Z 21/11]: file max **1.238 s MỞ** (lần 27, không đổi); union-A 1.222 s MỞ; union-B 1.211 s MỞ (dispatch 11:35:51Z DB không tính vào union chính). R-head: mark đầu 11:35:56Z (+1.238 s).
- S [11:38:28Z → 14:41:28Z]: file max **3.235 s MỞ** (không đổi); union-A 662 s ĐÓNG; union-B 591 s ĐÓNG.
- T [14:41:28Z → 16:06:45Z]: file max **627 s ĐÓNG** (không đổi); union-A 38 s ĐÓNG.
- U [16:06:45Z 21/11 → 03:42:20Z 26/11]: file max **9.316 s MỞ** (15:00:33Z → 17:35:49Z 24/11, không đổi); thứ hai 8.968 s; thứ ba 6.807 s; **thứ tư 6.175 s MỚI** (00:52:42Z → 02:35:37Z 26/11 — xem H-U20 §4); thứ năm 5.783 s (18:59:35Z → 20:35:58Z — H-U19 RỘNG từ 5.013 s: đầu mút 20:23:08Z (live-config) bị viết lại sau nên rớt khỏi merged; xem §4); rồi 3.530 s. U-tail: mark cuối 03:42:17Z (3 s trước B1).
- U union-A **9.316 s MỞ** (thứ hai 8.968 s; thứ ba 6.807 s; thứ tư 6.175 s; thứ năm 5.783 s; rồi 3.406 s).
- U union-B **8.372 s MỞ** (thứ hai 7.861 s; thứ ba 6.100 s — SYS EBC5 14:24:14Z chẻ hố 6.807 s; thứ tư **5.745 s** — SYS55C9 02:28:27Z chẻ hố H-U20 6.175 s; thứ năm **4.995 s** — SYS1C0B 20:22:50Z chẻ hố 5.783 s; rồi 3.406 / 2.632 s). SYS marks mới: SYS4DDA 16:21:46Z (F-194-T2-3), SYS1C0B 20:22:50Z, SYS8A23 22:22:13Z, SYS55C9 02:28:27Z — cả 4 đều đo trực tiếp.
- **CERT/FULL GIỮ 76/91** (quy ước đứng từ đợt 191; brief đợt 194 giao giữ).
- Content mới trong U (predicate boot-agnostic cho watcher/sampler 192/193/194 — F-194-T2-4): watcher-192 173 poll, watcher-193 167 poll, watcher-194 102 poll; sampler-192 130 dòng, sampler-193 130 dòng, sampler-194 56 dòng (tính tới B1). Watcher-193 poll cuối 22:22:23Z ghi boot=1c0bcaad (28 s sau reboot #118 — boot-id đọc stale, dòng vẫn là timestamp thật).
- Blind #94?/#95?/#96?/#88?/#77? vẫn MỞ.
- Sessions: exec-logs có mtime trong cửa sổ: **243** (193: 295 — giảm vì purge exec-log, xem §7); skipped own-session marker logs (round189–194-t2/m-check189–194): **23**. Sessions #64–#86: **3 mỗi khoảng** (193: 5 — mất 2: proc_34889a901a7e + proc_d3d4ab5f7009, cả hai đã bị purge — xem §7). R-gap in-gap: [xem blind194-sessions.log]; U-gap: 3 hit như đợt 192/193.
- Witness (exec-log content spans): **#116-B/#117-A: 2 thô → 0 thật** (proc_05caaff611b6 + proc_dea9d8605ff5 — trích dẫn); **#117-B/#118-A (MỚI): 5 thô → 0 thật** (2 trích dẫn cũ + proc_852243ad7728 / proc_1234834de997 = output headroom-check T9-193, proc_916186a284d9 = dump log replay-watch-193 của T56 — đều trích dẫn, 0 hoạt động thật trong hố); **#118-B/#119-A (MỚI): 0** — không witness nào qua btime #119 (khớp (m) #119 thô 0 event). Các khoảng cũ (#87–#115) giữ nguyên như đợt 193. **0 hoạt động thật mới ở mọi witness.**
- QUOTE_MARKERS đã có "round194-t2" + "m-check194" (witness skipped_quote=24).

## §4. Hole-recheck lần 37 — NEW=0 ở 27 hố cũ; hố MỚI H-U20 NEW=7 (kỹ thuật, 0 hoạt động thật)

- Toàn cây find: 63.019 file có mtime trong [2026-11-20T19:32:59Z, B1-194] (stderr 1 dòng .stagged-uploads). Known marks từ list 193: 9.161 giây; base #88?: 557 giây.
- **27 hố cũ: NEW=0 tất cả** (chỉ float-trap: H-S3 1, H-U2 1, H-U3 10, H-U9 1, H-U11 1, H-S4 1, H-T2 1, H-U12 1, H-U13 2, H-U14 3, H-U15 1, H-U16 3, H-U17 3, H-U19 1, H-U18 1; còn lại inside=0). **H-E1-88 lần thứ 36 liên tiếp 0 mới** (inside=337, toàn float-trap).
- **H-U20 (MỚI, 6.175 s, 00:52:42Z → 02:35:37Z 26/11): inside=7, float-trap=0, NEW=7 — cả 7 đều là kỹ thuật, 0 hoạt động thật trong lòng hố:**
  - 4 file tại 00:52:42.7–.8Z (đầu mút hố — chính là mark mở đầu hố, giây chưa có trong list 193 vì ghi sau B1-193): `memory/archive/20261126T005242Z.CURRENT.md`, `memory/CURRENT.md`, `memory/bank/reflections.md`, `memory/bank/world.md` — job bảo trì memory định kỳ (cùng mẫu H-U18/H-U19: file CURRENT.md tại biên hố).
  - 3 file tại 02:28:27.4–.5Z: `/var/log/wtmp`, `/var/log/btmp`, `/var/log/lastlog` — bản ghi đăng nhập của reboot #119 (wtmp begins 02:28:27Z = btime +19 s, T01-194 trực tiếp; SYS55C9).
  - Hố chứa btime #119 (02:28:08Z) + khoảng lặng scheduler 01:15:34Z → 02:35:41Z (T7-194 §7); đã giải thích đầy đủ bằng reboot + im lặng scheduler, không cần hoạt động lạ. Union-B: SYS55C9 chẻ còn 5.745 s.
- H-U19 RỘNG (5.013 s → 5.783 s, đầu mút 20:23:08Z → 20:35:58Z): live-config bị viết lại sau nên mark 20:23:08Z rớt khỏi merged-194 — kỹ thuật, theo tiền lệ F-186-T2-9 (không phải hố mù mới); hố giữ nguyên đầu mút cũ để recheck (NEW=0).
- H-U17 giữ nguyên 6.807 s (đầu mút 14:36:01Z); union-B chẻ bởi SYS EBC5 còn 6.100 s.

## §5. (m) #56 lần 36 — VẪN CÓ ĐIỀU KIỆN

- DB (5 hướng mới cxlvi–cl, tổng 150), trong cửa sổ ứng viên W [19:33:20Z, 19:33:37Z] 20/11/2026 (epoch 1795203200..1795203217):
  - (cxlvi) device.calendar_events start_at: **0** — ÂM TÍNH. (cxlvii) device.media_upload_events received_at: **0** — ÂM TÍNH. (cxlviii) runtime.maintenance_markers completed_at: **0** — ÂM TÍNH. (cxlix) scheduler.job_definitions created_at: **0** — ÂM TÍNH. (cl) runtime.workflow_runs created_at: **0** — ÂM TÍNH.
  - Tất cả đã xác minh chưa dùng trong m56-193.py (grep 0 kết quả).
  - **F-194-T2-2 (lỗi chọn hướng của chính T2, bắt được TRƯỚC khi đếm):** lần chọn đầu dùng 3 bảng ĐÃ DÙNG ở các đợt trước — memory.entries (cxxxv, đợt 192), ingest.data_source_events (cxxi, đợt 188), health.events (cxxiii, đợt 188) — cả 3 đều 0 dòng trong W (nhất quán với lần đếm gốc) nhưng KHÔNG được tính là hướng mới; đã chọn lại 3 hướng thật mới (cxlviii–cl) ở trên. Tổng vẫn 150 hướng (145 + 5 mới).
- File: (vii) mtime scan ~/workspace trong D: **333 file** (không đổi vs đợt 193), max **20:15:33.130Z** (round156-t10.done — dưới mốc max đã biết 20:19:34Z); (viii) exec-log trong D: **0**; (vii-b) file 20:16:00–20:17:00Z: 0; (vii-c) file 20:19:30–20:19:40Z: 0.
- Cửa sổ R ∈ [2,56251; 2,66817) s, J ∈ [2,566; 2,80753] s không đổi.
- Log: hidden_files/round194-t2/m56-194.log.

## §6. EPERM — probe #113 + sweep

- **Probe #113: 2026-11-26T04:05:03Z, boot 55c9e0b7, tmp+ws ok=2 fail=0** (2 file tạm: /tmp/eperm-probe-tmp-113.txt + hidden_files/eperm-probe-ws-113.txt; log hidden_files/eperm-probe-v2.log; boot đổi 1c0bcaad → 55c9e0b7, uptime từ 02:28:08Z).
- **Sweep #113** (cửa [20:52:52Z 25/11 (probe #112), 04:05:03Z 26/11]): 566 file *.log có mtime trong cửa; 7 file có hit, tổng 29 lần xuất hiện — **0 lần "sóng EPERM vẫn bật"** (sóng BẬT); toàn bộ hit là "sóng EPERM đã tắt" (6 file o8-*.log của T01/T8, mỗi file 3 lần) + eperm-sweep193.log tự trích (CẢNH BÁO 2, Operation not permitted 2, đã tắt 7 — log sweep cũ trích lại danh sách marker, không phải sóng thật). **Kết luận: 0 sóng thật đợt này** (như đợt 193: 170 log, 0 sóng thật).
- Log: hidden_files/round194-t2/eperm-sweep194.log.

## §7. Bằng chứng bị xóa — F-194-T2-8 (purge hàng loạt exec-log giữa đợt 193 → 194)

- **349-list (exec-log trong blind list đợt 189): present 0/349, MISSING 349/349; mới mất từ đợt 193: 118** (231 → 349). **41-list (đường dẫn trích trong log đợt 189): present 0/41, MISSING 41/41; mới mất: 9** (trong đó proc_34889a901a7e).
- **Bộ chứng cứ #100: nay 0/6** — file sống sót cuối cùng **proc_34889a901a7e MẤT** giữa đợt 193 và 194 (đợt 193 còn 1/6). proc_e606d7b4f921 + proc_e0c4ed13d7cd vẫn missing.
- Kiểm chéo độc lập: toàn bộ `~/workspace/agents/*/exec-logs/` nay chỉ còn **258 file**, TẤT CẢ có mtime ≥ B0 (2026-11-21T11:15:18Z) — các exec-log cũ hơn đã bị xóa hàng loạt (thư mục exec-logs của agent f2d919d6 không còn). Hệ quả thấy được: sessions exec-logs trong cửa sổ 295 → 243; witness #64–#86 5 → 3 (mất đúng 2 file đã purge: proc_34889a901a7e, proc_d3d4ab5f7009).
- Cơ chế purge chưa xác định (không phải việc T2) — ghi nhận: từ nay số "toàn lịch sử" dựa trên exec-log cũ không còn kiểm chứng được từ đĩa; các blind walk sau chỉ còn log mới.
- Log: hidden_files/round194-t2/evidence-check194.log + evidence-check194-{349,missing,newmissing,41missing}.txt.

## §8. Vi phạm quy tắc đứng đợt 194 — F-194-T2-9 VI PHẠM pha (b) attempt1; chuỗi 0 vi phạm GIỮ 0

### T4-194: 0/3 attempt hợp lệ (lượt yên #62 KHÔNG CÓ LƯỢT HỢP LỆ)
- Attempt1 [02:54:12Z → 03:00:46Z, hold 394 s]: 20/20 NHƯNG **LỚP B VI PHẠM** (load1_max 15,11; load5 cuối 5,89; sampler n=174, RAM_min 877 MB; apt/dpkg 0) — lượt nhiễm tải, KHÔNG dùng verdict. tickCost median 220,0 ms.
- Attempt2 [03:29:23Z → 03:33:20Z, hold 237 s]: 20/20 NHƯNG **LỚP B VI PHẠM** (load1_max 5,64; load5 cuối 2,87; RAM_min 632 MB, 42/111 mẫu <1024 MB; apt/dpkg 0) — KHÔNG dùng verdict. tickCost median 75,0 ms. Tải chủ yếu TỰ-TẢI (WebKitWebProcess 53,9% + MiniBrowser 23,0% = 76,9% top CPU tại đỉnh 03:30:47Z); chrome lạ có mặt trước/sau nhưng KHÔNG vào top-5 CPU ở bất kỳ spike nào đã kiểm.
- Attempt3 [03:36:52Z → 03:40:34Z, hold 222 s]: 20/20 + **LỚP B ĐẠT 5/5** (load1_max 2,99; load5 cuối 1,62; RAM_min 733 MB; apt/dpkg 0) NHƯNG **tickCost median 61,0 ms > 60 (thiếu 1,0 ms)** → KHÔNG hợp lệ, KHÔNG dùng verdict. Cửa sổ sạch nhất đợt (0 spike T9; chỉ 1 file ghi trong cửa: round194-p4.done 03:39:37Z).
- **FULL PASS GIỮ 0 (KHÔNG THỂ)** — lượt yên #62 không có lượt hợp lệ. Live-check lần 13: **KHÔNG THỂ KIỂM** (chỉ đối chiếu trên cửa sổ hợp lệ — không có; T4-194 §3, F-194-T4-6); chuỗi live ĐẠT GIỮ 9. Auto-trigger LIVE chạy trong cả 3 cửa sổ, 0 FIRE (15 mẫu; T9-194 phán cuối).
- **Lock log:** cả 3 cửa attempt đều chỉ có 3 dòng T4 (TICKET/ACQUIRED/RELEASED), **0 dòng phi-T4** — không luồng nào khác acquire lock vite trong cửa attempt.
- **F-194-T2-7 (sai số trong MEMORY.md — parent đính chính, T2 không sửa MEMORY.md):** mục Đợt 193 trong MEMORY.md ghi "attempt2 median 61,0 ms, thiếu 1,0 ms" — SAI theo poll-t4.log + tickcost: **attempt2 = 75,0 ms; attempt3 = 61,0 ms** (thiếu 1,0 ms là attempt3). Số còn lại trong mục đó (0/3 attempt, chuỗi GIỮ 0) đúng.

### F-194-T2-9 — VI PHẠM pha (b) attempt1 (T01 recount + P4 tsc/parity + P1 chrome)
- Bằng chứng (T4-194 §3 + ps-before/after attempt1, T2 xác minh độc lập từ file): pid 27502 (`npx tsc` + `node scripts/parity194-run.mjs`) CÓ ở ps-before, KHÔNG ở ps-after → chạy lúc attempt1 mở, thoát giữa cửa; pid 8115 (shell T01-194: recount + crosscheck python nặng) CÓ ở cả hai → sống xuyên cửa; P1 chrome headless /tmp/vf194-chrome-xilK7P (pid 28924/29040/30216) hoạt động trong cửa (ghi `chrome-2026-11-26T02-54-38-973Z.json` 02:54:38Z + `sample-tel-pitch7-preview.wav` 02:59:04Z); T01 ghi thêm `o8-driver-194t01.sh`/`o8-s1-probe-194t01.mjs` 02:57:47Z + `crosscheck-194-t01.sh` 03:00:06Z; T7 ghi `appendix194.py/.txt` 02:59:38Z. Đỉnh load1 15,11 lúc 02:57:00Z: MainThread 23,0% + WebKitWebProcess 21,2% + chrome lạ 17,8% + hatch 11,3%; spike sớm 02:55:02Z load1 8,32: `npm exec tsc` lạ (MainThread 25,8%, PID 37055) + chrome lạ 13,3%. **68 spike T9 trong cửa W1.**
- Mức độ: nặng hơn F-193-T56-3 (harness chồng pha (b) ~10–12 s → LIGHT VIOLATION): lần này NHIỀU luồng nặng + suốt cửa 394 s + load1_max 15,11 (gấp 3,8× bar 4,0) + attempt1 vô hiệu VÌ B2. T4 ghi nhận sự kiện, không tự phán — T2 phán theo quy tắc đứng: **VI PHẠM**.
- Attempt2: B2 vi phạm nhưng tải chính là tự-tải của T4 (không tính là vi phạm chồng lấn của luồng khác; P3 chỉ ghi 2 file nhẹ 03:31:35Z). Attempt3: sạch, 0 spike.
- **F-194-T56-4 (chunk 4 T56 chồng ~48 s với t01-round194 O8, 03:12:27–03:13:15Z):** đối tác chồng là t01 (O8 click-test Playwright theo screenshot), KHÔNG phải T4; 0 bằng chứng ảnh hưởng (O8 S0/S1/S2 PASS trong cửa chồng; 0 lần nhắc "WebProcess-churn" trong log/dir round194-t01); monitor T56 chỉ theo dõi t4/t8 nên không kill (đã sửa cho đợt sau: theo dõi MỌI ACQUIRED mới). T56 + T4 đều giao parent quyết — **T2 không tính F-194-T56-4 vào chuỗi** (chuỗi đã 0 vì F-194-T2-9; parent quyết riêng ở §10).
- **Đề xuất chuỗi 0 vi phạm: GIỮ 0** (đã ĐỨT đợt 193 theo quyết (p)-193; đợt này có vi phạm mới nên KHÔNG khởi động lại — tiền lệ đợt 179: đợt sạch đầu tiên sau khi đứt thì chuỗi tính lại từ 1).

## §9. Ghi chú phương pháp — F-194-T2-1 … F-194-T2-9

- **F-194-T2-1 (n ứng viên — T2-193 áp dụng SAI quy tắc cho #116):** xem §1. Quy tắc đứng: DƯƠNG +1/+1, KHÔNG CÓ ĐIỂM không đổi (7 tiền lệ 184–191). T2-193 ghi GIỮ 51/52 không mũi tên/lý do; §14.2-193 (f) (nguồn gốc CHƯA NGÃ NGŨ) giữ số sai. Parent quyết mốc (53/54 theo chuỗi đính chính, hay 52/53 nếu giữ mốc đã chấp nhận).
- **F-194-T2-2 (lỗi chọn hướng (m) #56 của chính T2):** xem §5 — 3 bảng đã dùng bị chọn lại, bắt được bằng grep trước khi đếm; đã chọn lại 3 hướng mới.
- **F-194-T2-3 (SYS mark #116 bị bỏ sót ở đợt 193):** đầu mút #116 (4dda8234) ĐÃ có đo trực tiếp trên hồ sơ — T01-192: journal first 16:21:46Z = btime +13 s, wtmp begins 16:21:46Z, /proc/1 mtime 16:21:46.028Z = btime +13,03 s — nhưng content.py-193 KHÔNG thêm SYS4DDA vào union-B (chỉ có SYSB0AA/SYSEBC5). T2-194 thêm SYS4DDA = 16:21:46Z (cùng SYS1C0B 20:22:50Z, SYS8A23 22:22:13Z, SYS55C9 02:28:27Z — cả ba đều đo trực tiếp). Ảnh hưởng lên union-B ở §3.3.
- **F-194-T2-4 (watcher/sampler log TRUNCATE khi restart — content.py-193 đếm 0 là ĐÚNG file sống, KHÔNG phải artefact sed):** F-193-T2-2 (d) chẩn đoán "0 lines là artefact đổi tên bằng sed" là SAI. Bằng chứng trên đĩa: round193-t9/ram-sampler.log nay chỉ còn 101 dòng 1c0bcaad (20:42:10Z–22:22:13Z) + 29 dòng 8a23277a (22:23:54Z–22:51:55Z), 0 dòng ebc5a3b9; round193-t56/replay-watch-193.log chỉ còn 170 poll 1c0bcaad (20:45:41Z–22:22:23Z) + dòng FLAG-WRITTEN "(old=ebc5a3b9)" — file bị truncate khi watcher/sampler restart trên boot mới. Tương tự round192-t9 (100 ebc5a3b9 + 30 4dda8234, 0 b0aab705) và round192-t56 (176 poll ebc5a3b9, 0 b0aab705). Hệ quả: content.py-193 KHÔNG đếm được các mark đó (đúng theo file sống lúc đọc), và LIMITS-193 §3.3 trình bày "125 dòng b0aab705" như content đang có là SAI — con số đó chỉ còn trong hồ sơ T9-192, không còn trên đĩa. **Sửa ở 194:** các block watcher/sampler 192/193/194 trong content.py-194 dùng predicate KHÔNG phân biệt boot (mọi dòng poll/sample có timestamp trong [T1, U1]) — thu hồi các mark còn trên đĩa; số đếm cũ (0) ghi làm tham chiếu. Union-A/B đợt này KHÔNG so sánh trực tiếp được với 193 ở các đoạn đó (phương pháp đổi — ghi rõ ở §3.3).
- **F-194-T2-5 (DM_RE day window mở rộng tới 26/11):** sessions/witness chỉ chấp nhận DD/MM trong 20–24/11 (sessions) / 20–25/11 (witness); log đợt 194 trích ngày 26/11 (bare time + DD/MM) sẽ bị gán nhầm ngày. Mở rộng cả hai lên 26/11 — chỉ ảnh hưởng log mới (log cũ không chứa 26/11).
- **F-194-T2-6 (lỗi giờ của chính T2-194):** xem §1 — finished run 196/197 cộng tay sai, đã sửa bằng `datetime.fromtimestamp` + chạy lại m-check194.py (exit 0); đối chiếu KHỚP T7-194.
- **F-194-T2-7 (MEMORY.md ghi sai median attempt):** xem §8 — mục Đợt 193 ghi "attempt2 median 61,0 ms" trong khi đúng là attempt3 = 61,0 ms, attempt2 = 75,0 ms (poll-t4.log + tickcost). T2 không sửa MEMORY.md; parent đính chính.
- **F-194-T2-8 (purge hàng loạt exec-log giữa đợt 193 → 194):** xem §7 — 349-list 0/349 còn, 41-list 0/41 còn, #100 còn 0/6; toàn bộ agents exec-logs chỉ còn 258 file (tất cả mtime ≥ B0). Từ nay số "toàn lịch sử" dựa trên exec-log cũ không còn kiểm chứng được từ đĩa.
- **F-194-T2-9 (VI PHẠM pha (b) attempt1):** xem §8 — T01 recount + P4 tsc/parity + P1 chrome chồng cửa attempt1 (load1_max 15,11; 68 spike); chuỗi 0 vi phạm GIỮ 0.
- Epoch B0/B1 lấy từ python (không gõ tay). Thư mục exec-log của chính tôi: `~/workspace/agents/0a4bc48f-19df-4446-b24e-a53edffe8d2e/` (session id). Log của tôi trong cửa sổ không chứa marker "round194-t2"/"m-check194" trong nội dung trước B1 — sessions skipped_own + witness skipped_quote sẽ kiểm chứng; các script 194 đã thêm thư mục agent của chính tôi + marker đầy đủ (sửa lỗ hổng F-193-T2-2 (f)).

## §10. Đề xuất cho parent (§14.2-194)

- (a) Chấp nhận (m) #117 = KHÔNG CÓ ĐIỂM (CUỐI) và (m) #118 = DƯƠNG (CUỐI) → n ứng viên theo chuỗi đính chính 53/54 (hay 52/53 nếu parent giữ mốc 51/52 — parent quyết mốc, xem F-194-T2-1); n chính thức GIỮ 14.
- (b) INSIDE #113/#114/#115 theo A KHÔNG TÍNH ĐƯỢC, chuỗi GIỮ 7; B chỉ tham chiếu (#115 TRUE kiểm lại khớp; B-#116 FALSE, B-#117 TRUE — parent quyết chuỗi B có tiến hay không).
- (c) Boot #119: 55c9e0b7, btime 02:28:08Z (T01-194 khảo sát 9 nguồn; (m) #119 thuộc T2-195).
- (d) Vi phạm đợt 194: **F-194-T2-9 VI PHẠM pha (b) attempt1** — chuỗi 0 vi phạm GIỮ 0 (đã đứt đợt 193, không khởi động lại). F-194-T56-4 (chunk 4 chồng ~48 s với t01 O8, KHÔNG phải T4, 0 bằng chứng ảnh hưởng) — parent quyết riêng: có tính là vi phạm không (không đổi chuỗi, đã 0). Lượt yên #62: 0/3 attempt hợp lệ; live-check lần 13 KHÔNG THỂ KIỂM, chuỗi live ĐẠT GIỮ 9.
- (e) (m) #56 vẫn có điều kiện, lần 36 (tổng 150 hướng).
- (f) Mù vẫn MỞ (R/S/U); R 1.238 s / S 3.235 s / T 627 s ĐÓNG / U file 9.316 s / U union-B 8.372 s; CERT/FULL GIỮ 76/91; hole-recheck lần 37 NEW=0 ở 27 hố cũ (H-E1-88 lần 36); hố MỚI H-U20 6.175 s NEW=7 (kỹ thuật, 0 hoạt động thật); H-U19 rộng 5.013 → 5.783 s (kỹ thuật).
- (g) Ghi nhận F-194-T2-1 (n #116 sai), F-194-T2-2 (chọn hướng #56), F-194-T2-3 (SYS4DDA sót), F-194-T2-4 (log truncate — content 193 đếm 0 là đúng file sống), F-194-T2-5 (DM window), F-194-T2-6 (giờ run 196/197), F-194-T2-7 (MEMORY.md ghi sai attempt2/attempt3 median), F-194-T2-8 (purge exec-log: 349-list 0/349, #100 còn 0/6), F-194-T2-9 (vi phạm pha (b) attempt1).
- (h) Run 196 SUCCEEDED cf 117 s — CA #25 MỚI (T7-194 quyết); run 197 SUCCEEDED cf 8 s (KHÔNG CA); run 198 kết cục thuộc T7-195.

## §11. Files

- LIMITS này: docs/PHASE9_ROUND194_T2_EPERM_LIMITS.md (xem kích thước cuối báo cáo).
- Script + log: hidden_files/round194-t2/m-check194.py/.txt; adapt194.py; blind194-{gen,merged,content,sessions,witness,investigate}.py; blind194-{repo-1,hidden_files,outside,tmp,fifthscope}.txt; blind194-{merged,content,sessions,witness,investigate}.log; hole-recheck194.py/.log; m56-194.py/.log; eperm-sweep194.py/.log; evidence-check194.py/.log + evidence-check194-{349,missing,newmissing,41missing}.txt.
- Paths stage: ~/workspace/repo-1-push/paths-loop/phase9-round194-t2-eperm.txt (NUL-delimited, chỉ file text, đã kiểm od -c).
- Cờ: hidden_files/round194-t2.done (CÓ NỘI DUNG).
