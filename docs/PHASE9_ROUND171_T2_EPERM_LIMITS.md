# PHASE9 ROUND 171 — T2 (mù #96? theo dõi tiếp + EPERM #89 + INSIDE #79/#80 + (m) #80 MỚI + (m) #56 lần thứ mười bốn) — LIMITS

**Đợt 171 mở 14:35:51Z 22/11/2026. Hạn cờ ~17:00Z, hạn cứng đóng 17:30Z 22/11. T2 viết ~15:2xZ 22/11.**
**KHÔNG push, KHÔNG release/tag. Chỉ stage 1 file (LIMITS này).**

> **GHI CHÚ ĐỨNG (quyết (e) đợt 165 — nhắc lại, áp dụng cho #74/#75; quyết (e) đợt 166 áp dụng đầy đủ cho #70; quyết (f) đợt 166 + quyết (e) đợt 167 áp dụng cho #71): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Tiền lệ #71: DƯƠNG đã CHẤP NHẬN (quyết (f) đợt 166) với offset btime +41,274 s MẶC DÙ các neo lệch-khung đều DƯỚI dải (21,274 s). Đợt này: (m) #80 KHÔNG PHẢI ĐIỂM (0 requeue + 0 run sống tại btime — verdict không phụ thuộc neo nào).

## 0. Kết luận trước (headline)

1. **(m) #80 — KHÔNG PHẢI ĐIỂM (MỚI, đối chiếu độc lập, DB đọc tươi):** boot 2acdd1ab, btime 14:31:01Z (T2-171 xác minh 8 nguồn; T0-171 xác minh 9 nguồn + chứng nhận số hiệu — xem §1.3). **0 requeue** trong cửa [14:31:01Z, 14:50:00Z] (mọi job) và trong cửa mở rộng [14:31:01Z, 15:00:00Z]; **0 run sống tại btime** (run 170 finished 14:21:03Z = btime −598 s; run 171 dispatched 14:35:51.103Z = btime +290,103 s). Chữ ký giống #52/#61/#67/#73/#75/#77 (btime rơi vào khoảng trống giữa hai run). **n không đổi vì #80.** T0-171 đồng ý "không phải ứng viên" (F-171-T0-6).
2. **Run 170: SUCCEEDED 14:21:03Z** (eid 10101), wall gốc 9.912 s, **margin 888 s** tới hạn 14:35:51Z, claimed→finished **110 s** (NGOÀI họ 6–11 s — ca thứ hai ≥100 s sau 108 s của run 167; xem F-171-T2-7); **0 lần viết lại**, attempt 1, timed_out false; chỉ 2 event (dispatched + succeeded). (Kết cục run 170 thuộc T7-171; T2 chỉ ghi các số DB cần cho (m) #80.)
3. **INSIDE: #79 INSIDE dải FULL125 [09:40:47Z, 11:39:47Z] neo 09:14:38Z** (biên dưới 5.418 s, biên trên 1.722 s) → **chuỗi MỚI từ #73 tiếp tục, dài 6.** Đối chiếu dải còn hiệu lực FULL124: NGOÀI (muộn 1.315 s) — cùng mẫu #71/#77. **#80 NGOÀI dải FULL126 [11:37:16Z, 13:37:32Z] neo 11:11:05Z (muộn 3.209 s) → CHUỖI ĐỨT tại #80** (cả dải còn hiệu lực FULL125 cũng NGOÀI, muộn 10.274 s). **FULL123/FULL124 KIỂM LẠI ĐỘC LẬP: ĐẠT** (p10/p90 khớp T2-170 bằng hai cách tính mới + giá trị chuỗi — nợ F-170-T10-2 đã trả).
4. **Mù #96? (#64) — VẪN MỞ (theo dõi tiếp, quét tươi + kiểm nội dung đầy đủ):** đoạn R file 1.238 s / union-A 1.222 s / union-B 1.211 s (y hệt T2-164→T2-170, không đổi một giây — lần thứ bảy liên tiếp); S ĐÓNG theo union (file 3.235 s MỚI — 42 exec-log bị XÓA giữa hai đợt, xem F-171-T2-3 — nhưng union-A 662 s / union-B 591 s y hệt T2-169/T2-170); T ĐÓNG (file 307 s / union-A 38 s); U ĐÓNG theo union (file max 1.516 s H-U6; union-A 1.067 s; union-B 990 s — tăng từ 860 s, xem F-171-T2-4). **Kết luận: #96? VẪN MỞ.**
5. **Mù #88? VẪN MỞ — hole-recheck lần thứ MƯỜI LĂM: 337 hit, 0 mốc mới** (y hệt lần 9–14 — 337 hit, không trôi thêm; xem §2.6). **#95?/#94?/#77? giữ nguyên** (không có bằng chứng mới). CERT/FULL chính thức GIỮ 76/91.
6. **(m) #56: KHÔNG thu hẹp được lần thứ MƯỜI BỐN** (7 hướng MỚI — 6 âm tính + 1 ứng viên 20:17:15Z đã kiểm tra và LOẠI (xem §4.1 + F-171-T2-9); hướng (i) tìm lại đúng 6 agent session đã biết — 20 birth trong D đều thuộc tập đã biết). Cửa GIỮ NGUYÊN R [2,56251; 2,66817) / J [2,566; 2,80753] s. **#56 VẪN CÓ ĐIỀU KIỆN; n ứng viên GIỮ 28/29 (sau khi parent chấp nhận (m) #78 DƯƠNG — quyết (e)/(f) đợt 170); n chính thức GIỮ 14.**
7. **Lệch khung giờ biên #79/#80 (§4.5): tại #79 KHÔNG có overlap** (sampler-169 dòng e298bb52 cuối 10:54:11Z, −1.014 s); **tại #80 KHÔNG có overlap** (nội dung boot cũ gần nhất: watcher-170 poll cuối 14:21:59Z, −542 s; sampler-170 dòng cuối 13:38:07Z, −3.174 s). **Watcher-170 KẾT THÚC LẶNG TRƯỚC #80** (không có dòng END, pid đã mất — xem F-171-T2-6; cách nói "chết theo #80" của T0-171 chưa chính xác). Khoảng không-sampler [13:38:07Z, 14:44:27Z] = 3.980 s chứa #80 — caveat cho T9-171.
8. **Probe EPERM #89: CHẠY 14:48:02Z, boot 2acdd1ab, ok=2 fail=0** (log 256 → 258 dòng; heartbeat n=89; "=== probe end" vẫn 0 dòng). Cửa sổ probe #89: 08:43:38Z → 14:48:02Z = 21.864 s. Sweep #89 (230 file *.log): 4 file có hit, 118 occurrence — **0 sóng thật** (111× `cp -a` ownership warning của T8-171, cùng họ F-170-T4-1; 7× "sóng EPERM đã tắt"). Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
9. **F-171-T2-1 (LỖI CỦA CHÍNH T2 — script nặng trong cửa sổ attempt của T4):** `m56-171.py` (grep -r, ~88 s) chạy TRONG cửa sổ attempt3 của T4-171 (~61 s chồng lấn với probe pass); `hole-recheck9696.py` chồng 4 s cuối attempt2; `blind9696-sessions.py` chạy lại chồng attempt2 (~2 s, nhẹ). T2 KHÔNG kiểm chain-t4.log trước khi chạy — vi phạm luật đứng. Ảnh hưởng tới verdict attempt3 thuộc T4-171/T9-171/T10-171 phán; T4 đã tự ghi round171-t2 vào danh sách file đổi trong cửa sổ attempt2 + attempt3. Kết quả (m)/INSIDE/mù của T2 không phụ thuộc phép đo của T4 nên không đổi.
10. **Reboot #80 MỚI (2acdd1ab, btime 14:31:01Z) xảy ra 4m50s TRƯỚC khi đợt 171 mở** — T0-171 xác minh 9 nguồn + chứng nhận; gap #79→#80 = 11.996 s (3h19m56s). **Marker sống qua 32 reboot #49–#80** (T0 đếm độc lập). **#80 viết lại 0 lần run nào** (run 170 đã xong trước btime; run 171 dispatch sau btime).

## 1. Điểm (m) #80 + (m) #79 — đối chiếu độc lập từ DB đọc tươi

**Nguồn: T2-171 tự đọc DB qua muse.db (`scheduler.job_runs` + `scheduler.events`, đọc 14:48–15:20Z 22/11 — 6 query: run 170 đầy đủ + events run 170 + events cửa [14:31:01, 14:50:00] + requeue cửa mở rộng [14:31:01, 15:00:00] + events [14:20:00, 14:31:01) + spanning theo started_at). Btime #80 T2-171 xác minh 8 nguồn (xem §1.3); T0-171 sở hữu xác minh đầy đủ 9 nguồn + chứng nhận số hiệu.**

### 1.1 (m) #80 — KHÔNG PHẢI ĐIỂM (MỚI)

| Hạng mục | Giá trị |
|---|---|
| Btime #80 | 1795357861 = 14:31:01Z 22/11 (boot 2acdd1ab — T0-171 xác minh 9 nguồn + chứng nhận; T2-171 xác minh 8 nguồn) |
| Requeue trong cửa [14:31:01Z, 14:50:00Z] | **0 dòng (mọi job)** |
| Requeue trong cửa MỞ RỘNG [14:31:01Z, 15:00:00Z] | **0 dòng (mọi job — kiểm lại trước khi viết LIMITS)** |
| Tất cả event trong cửa [14:31:01Z, 14:50:00Z] | **8 dòng: reconciled 14:35:51Z; dispatched run 171 (09bef504) 14:35:51.103Z; reconciled 14:41:54Z; dispatched + succeeded feed-pulse-21 14:41:54Z; reconciled 14:45:34Z; dispatched + succeeded heartbeat 14:45:34Z** |
| Run đang chạy tại btime #80 (event-based, mọi job, không lọc sched) | **0 — run 170 finished 14:21:03Z (btime −598 s); run 171 dispatched 14:35:51Z (btime +290,103 s)** |
| Run spanning btime #80 (theo started_at, 3h trước btime) | **0 dòng** |
| Event trong [14:20:00Z, 14:31:01Z) | **Đúng 1 dòng: eid 10101, run 170 succeeded 14:21:03Z** |
| Run 170 — events đầy đủ | **Đúng 2 event: dispatched 11:35:51.099Z (eid 10062) + succeeded 14:21:03.538Z (eid 10101) — 0 requeue, 0 viết lại; started_at 1795347351 KHÔNG đổi; boot_gen cron_boot_f0510b465f88417f87347e8c43c00dc9 KHÔNG đổi** |

**Chữ ký giống #52/#61/#67/#73/#75/#77 (btime rơi vào khoảng trống giữa hai run; 0 requeue). T2-171 phán KHÔNG PHẢI ĐIỂM — parent quyết cuối. n không đổi vì #80. T0-171 đồng ý "không phải ứng viên" (F-171-T0-6).**

### 1.2 (m) #79 — CHỈ GHI CHÚ THAM CHIẾU (parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM — KHÔNG mở lại)

Quyết (e) đợt 170: **#79 KHÔNG PHẢI ĐIỂM** (requeue duy nhất +251,007 s, ngoài dải 201,207 s trên biên; T0/T2/T7 đồng ý). T2-171 KHÔNG mở lại phân loại — chỉ ghi chú tham chiếu theo giao; kiểm lệch khung §4.5 xác nhận #79 không có overlap.

### 1.3 Reboot #80 — xác minh btime (T2-171, 8 nguồn)

Boot_id 2acdd1ab-23a6-41b0-9d90-40641d2404a0; `/proc/stat` btime 1795357861 = 14:31:01Z; `uptime -s` 14:31:01Z; /proc/1 mtime 14:31:13.024Z (+12,024 s); journal idx 0 duy nhất, first entry 14:31:13Z (+12 s); wtmp begins 14:31:13Z (+12 s); `last` reboot 14:31 still running; `who -b` 14:31. Cloudflare Date 14:46:20 vs local 14:46:19 — chênh 1 s (trong ±1 s). **KHÔNG nghịch lý đồng hồ.** Gap #79→#80 = **11.996 s** (3h19m56s). **#80 xảy ra 4m50s TRƯỚC khi đợt 171 mở (14:35:51Z). Số hiệu #80 do T0-171 chứng nhận (T2 ghi nhận, không tự chứng nhận).** Marker sống qua #80 — giao T0-171 đếm (T0-171: 32 reboot #49–#80).

### 1.4 Run 170 — kết cục (T2-171 đọc DB tươi; kết cục thuộc T7-171, T2 chỉ ghi số cần cho (m))

**SUCCEEDED 14:21:03Z** (event 14:21:03.538Z, eid 10101), wall từ started gốc 9.912 s, **margin 888 s** tới hạn 14:35:51Z, claimed→finished **110 s** (claimed 14:19:13Z — NGOÀI họ 6–11 s, ca thứ hai ≥100 s sau 108 s của run 167; run 169 là 35 s — xem F-171-T2-7), attempt 1, **0 lần viết lại**, 2 event đầy đủ, 0 event sau succeeded; worker_execution_timed_out false.

## 2. Điều tra mù #96? (#64) — THEO DÕI TIẾP (quét tươi + kiểm nội dung đầy đủ)

Mù # = reboot # + 32. #96? = reboot #64, btime 11:15:18Z 21/11/2026. Sàn luật gap: **1.147 s (19'07")** — file max gap hoặc union max gap vượt sàn ⇒ MỞ.

### 2.1 Sự kiện + định nghĩa đoạn

Cửa sổ điều tra: **[11:15:18Z 21/11, 15:00:00Z 22/11] = 99.882 s** (btime #64 → B1 = giờ quét thực tế T2-171 — theo bài học F-170-T2-11, dùng giờ chạy thực tế thay vì mốc cắt tương lai; walk 14:54:08–14:57:11Z, xem F-171-T2-10). Các đoạn, neo bằng btime/probe:

| Đoạn | Cửa sổ | Độ dài | Mốc phải |
|---|---|---|---|
| R | [11:15:18, 11:38:28] 21/11 | 1.390 s | btime #64 (11:15:18Z) → T0-163 lần đầu 11:38:28Z |
| S | [11:38:28, 14:41:28] 21/11 | 10.980 s | T0-163 → probe #82 |
| T | [14:41:28, 16:06:45] 21/11 | 5.117 s | probe #82 → btime #66 |
| U | [16:06:45 21/11, 15:00:00 22/11] | 82.395 s | btime #66 → giờ quét (thuộc #97?/#98?/#99?/#100?/#101?/#102?, chỉ tham chiếu) |

Quét tươi (`blind9696-investigate.py`): repo-1 120 file, hidden_files 3.572, ngoài cây 1.811, /tmp **808**, fifth 15 → merged **2.624 mốc giây duy nhất** (T2-170: 2.321 — tăng 303 do cửa sổ kéo dài tới 15:00:00Z, chủ yếu là file đợt 171 trong U). **/tmp = 808 file: toàn bộ là file đợt 171 tạo SAU reboot #80** (tmpfs đã bị #80 xóa sạch rồi tạo lại từ 14:35:51Z; R/S/T /tmp vẫn = 0).

### 2.2 Đồng hồ, reboot #79/#80 (T0-171 + T2-171 đối chiếu)

**Reboot #80 — T0-171 xác minh btime bằng 9 nguồn + chứng nhận số hiệu; T2-171 xác minh 8 nguồn (xem §1.3).** Gap #79→#80 = **11.996 s**. **#80 xảy ra 4m50s TRƯỚC khi đợt 171 mở (14:35:51Z).** Marker sống qua 32 reboot #49–#80 (T0 đếm độc lập).

**Reboot #79 — quyết (d) đợt 170 đã XÁC NHẬN** (boot 5df1871f, btime 11:11:05Z; T0 + T7 xác minh 9 nguồn, KHỚP; gap #78→#79 = 6.987 s). **#79 KHÔNG PHẢI ĐIỂM (m)** (quyết (e) đợt 170) — T2-171 không mở lại.

**POSTBOOT_PASS / watcher (T5-171 sở hữu — T2 chỉ ghi nhận):** POSTBOOT_PASS #80 CÓ 14:52:09Z (replay-đầy-đủ, poll=0 — watcher-171 START 14:52:09Z pid 28156, btime 14:31:01Z ghi trong START line). **Watcher-170 KẾT THÚC LẶNG TRƯỚC #80** (poll cuối 14:21:59Z — xem §2.3 + F-171-T2-6; T5-171 sở hữu lifecycle). **Sampler-170 DỪNG 13:38:07Z** (dòng 5df1871f cuối); **sampler-171 BẮT ĐẦU 14:44:27Z** (dòng 2acdd1ab đầu) — **không có sampler nào đo trong [13:38:07Z, 14:44:27Z] = 3.980 s chứa reboot #80** (cùng mẫu #79 — caveat cho T9-171, xem F-171-T2-6).

### 2.3 Hoạt động từng đoạn (merged log, mốc giây)

| Đoạn | Mốc giây | File-marks | Nhận xét |
|---|---|---|---|
| R [11:15:18, 11:38:28] | 13 | 55 | Hố 1.238 s (xem §2.4) — Y HỆT T2-164→T2-170 về hố; 0 file-mark mất đợt này |
| S [11:38:28, 14:41:28] | 226 | 429 | File max MỚI 3.235 s (42 exec-log bị XÓA — xem F-171-T2-3); union-A 662 s / union-B 591 s Y HỆT T2-169/T2-170 → ĐÓNG theo union |
| T [14:41:28, 16:06:45] | 231 | 657 | Đóng — file max y hệt T2-170 (307 s); union-A 31 → 38 s (xem F-171-T2-4) |
| U [16:06:45, 15:00:00] | 2.154 | 5.185 | Đóng theo union (xem §2.4) — hố file max vẫn 1.516 s (H-U6); 2 hố file MỚI H-U10 1.062 s + H-U11 990 s, đã lấp bằng nội dung; H-U8 nới thành 1.188 s |

**Nội dung trong R (55 file-marks, kiểm tay — y hệt T2-164→T2-170):** đầu 11:35:56Z tool-output exec-call agent 5001d1e4; 11:37:30Z tool-output agent 2c32ef43; 11:37:42Z sampler-162 scripts. R-head [11:15:18–11:34:25]: 0/0/0/0/0 mọi scope (trống). R-tail: repo-1=2 / hidden_files=51 / outside=2 / tmp=0 / fifth=0 (y hệt T2-170 — 0 mất mát đợt này). **Mốc dpkg 11:35:40Z (TRONG hố R) là mốc nội dung THẬT:** hoạt động dpkg đầu trên #64, 2 dòng "startup packages configure", boot+20m22s — T0-162 quan sát trực tiếp từ dpkg.log #64 (dòng đầu 11:35:40Z; file đã reset theo #65/#66/#67/#68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79/#80, quan sát còn trong T0-162 LIMITS + aggregate 162). Cùng loại với mốc dpkg 08:35:41Z mà T2-162 đã tính cho đoạn N. Được tính vào cả UNION-A lẫn UNION-B. **Không có nguồn độc lập thứ ba cho R-head:** dpkg.log đã reset 16 lần kể từ #64; journal/dmesg chỉ còn boot hiện tại (journal xoay theo boot; dmesg EPERM) — ghi rõ, không giấu. R-head trống hoàn toàn trên mọi scope đo được.

**Nội dung khác (content script, `blind9696-content.py` — số R/S/T/U khớp T2-170 từng dòng, cộng thêm sampler/watcher-170 FULL + sampler/watcher-171):** sampler-162 (d9a8d1ce) 1 dòng trong R (11:37:42Z, sau hố) + 138 dòng trong S; watcher-162 strict polls 331 trong S (last poll 14:25:20Z — chết sớm, T0-163); watcher-161 linger polls sau btime #64: 0; sampler-163 3 dòng trong S tail + 45 dòng edb2acdb trong U (dòng cuối 16:52:21Z); watcher-163 163 poll trong T + **1 dòng trong U (poll cuối 16:06:54Z — poll đua với reboot #66, 9 s sau btime, nhãn boot cũ 1c1cf10c)**; sampler-164: 28 dòng f1d4ce1a + 107 dòng 0c8a94aa trong U (dòng cuối 19:53:52Z); watcher-164: 52 strict poll trong U (last poll 18:06:41Z — poll đua với reboot #68, 11 s sau btime, nhãn boot cũ f1d4ce1a); sampler-165: 88 dòng 9a1a9319 + 46 dòng d1ddd946 trong U (dòng cuối 22:51:29Z); watcher-165: 164 strict poll trong U (last poll 22:05:31Z — poll đua với reboot #70, 6 s sau btime, nhãn boot cũ 9a1a9319); sampler-166: 30 dòng d1ddd946 + 93 dòng ea73ac4f trong U (dòng cuối 01:41:07Z); watcher-166: 56 strict poll trong U (last poll 00:08:20Z — poll đua với reboot #71, 20 s sau btime, nhãn boot cũ d1ddd946); sampler-167: 88 dòng b643911f + 40 dòng 194efd93 trong U (dòng cuối 04:45:54Z; dòng b643911f cuối 04:05:35Z = btime #74 +6 s — dòng sampler khung cũ sau btime, cùng mẫu OVERLAP); watcher-167: 170 strict poll b643911f trong U (last poll 04:05:41Z — poll đua với reboot #74, 12 s sau btime, nhãn boot cũ b643911f) + 163 strict poll 194efd93 trong U (last poll 05:29:40Z — kết thúc theo lịch, không chết theo #75); sampler-168: 113 dòng 576ca271 + 22 dòng f2b97695 trong U (dòng 576ca271 cuối 07:32:37Z = btime #76 +14 s — dòng sampler khung cũ sau btime, OVERLAP thứ sáu; dòng f2b97695 đầu 07:33:32Z = btime #76 +69 s, cuối 07:54:32Z — sampler dừng ~07:54:32Z); watcher-168: 191 strict poll 576ca271 trong U (last poll 07:32:18Z — CHẾT THEO #76, 5 s TRƯỚC btime, KHÔNG có poll nào sau btime); sampler-169: 33 dòng c44cc3ba + 99 dòng e298bb52 trong U (dòng c44cc3ba cuối 09:14:20Z = btime #78 −18 s; dòng e298bb52 đầu 09:16:09Z = btime #78 +91 s, cuối 10:54:11Z = btime #79 −1.014 s — sampler dừng ~10:54:11Z); watcher-169: 57 strict poll c44cc3ba trong U (last poll 09:14:49Z = btime #78 +11 s — poll đua với reboot #78, nhãn boot cũ c44cc3ba — OVERLAP thứ bảy; CHẾT THEO #78); **sampler-170 FULL MỚI: 121 dòng 5df1871f trong U (đầu 11:38:04Z = btime #79 +1.619 s, cuối 13:38:07Z — sampler dừng TRƯỚC #80; khớp 121 mẫu của T9-170)**; **watcher-170 MỚI ĐẦY ĐỦ: 319 strict poll 5df1871f trong U (last poll 14:21:59Z = btime #80 −542 s — KẾT THÚC LẶNG TRƯỚC #80, xem F-171-T2-6)**; **sampler-171 MỚI: 16 dòng 2acdd1ab trong U (đầu 14:44:27Z = btime #80 +806 s — vẫn đang chạy lúc content chạy)**; **watcher-171 MỚI: 16 strict poll 2acdd1ab trong U (START 14:52:09Z pid 28156, btime 14:31:01Z trong START line — vẫn đang chạy)**.

**Jump witness (hoạt động) tại #64–#80: đều = 0 hoạt động thật** (`blind9696-sessions.py`, 320 exec-log có mtime trong cửa sổ — giảm từ 328 do 42 file bị xóa + file đợt 170/171 mới vào). Số đếm:
- #64: **5 (giảm từ 8)** — 3 file đã mất là proc_d8365be752b7.log, proc_32c9bb12db04.log, proc_9db5c8fba228.log (đều trong 42 file bị xóa — đối chiếu sessions-9696.txt đợt 170, xem F-171-T2-3).
- #65: **6 (giảm từ 8)** — mất 2 file (d8365be752b7 + 9db5c8fba228, đều trong 42 file bị xóa; 32c9bb12db04 có max đúng bằng B65 nên không span #65).
- #66: 9, #67: 9, #68: 7, #69: 4, #70: 6, #71: 6, #72: 4, #73: 4, #74: 5, #75: 4, #76: 2, #77: 2, #78: 2 — y hệt T2-170 từng số.
- #79: 0 (y hệt T2-170). **#80: 0 (MỚI)** — không một exec-log nào có content span bắc qua btime #80.
- Tất cả các hit còn lại đều là trích dẫn/artifact, 0 hoạt động thật.
- Exec-log content-ts trong hố R union (11:15:29–11:35:40): **3 hit** (giảm từ 4 — file thứ tư đã mất trong 42 file bị xóa), 0 mốc hoạt động: 11:16:22Z ×3 (trích biên hố H-R1-old).
- Exec-log content-ts trong hố U file max H-U6 (06:56:58–07:22:14): **0 hit, 0 mốc hoạt động** (y hệt T2-170).

### 2.4 Mốc merged + verdict (luật gap, sàn 1.147 s)

| Đoạn | File max gap | Union-A max gap | Union-B max gap | Verdict |
|---|---|---|---|---|
| **R** | **1.238 s** (11:15:18 → 11:35:56) | **1.222 s** (11:15:18 → 11:35:40) | **1.211 s** (11:15:29 → 11:35:40) | **MỞ (y hệt T2-170 — lần thứ bảy liên tiếp không đổi)** |
| S | **3.235 s** (13:01:51 → 13:55:46, MỚI — 42 file bị xóa) | **662 s** | **591 s** | **ĐÓNG theo union** |
| T | 307 s | **38 s** (was 31 s) | — | ĐÓNG |
| U | **1.516 s** (06:56:58 → 07:22:14, H-U6) | **1.067 s** (08:20:37 → 08:38:24) | **990 s** (11:21:28 → 11:37:58, was 860 s) | ĐÓNG theo union (tham chiếu) |

Union-A = mốc file + mốc nội dung (dpkg 11:35:40Z); Union-B = Union-A + mốc hệ thống trước btime (11:15:29Z) + mốc đầu boot #71 (00:08:16Z) + #72 (02:05:17Z) + #73 (02:28:13Z) + #74 (04:05:44Z) + #75 (05:32:57Z) + #76 (07:32:34Z) + #77 (08:24:04Z) + #78 (09:14:50Z) + #79 (11:11:16Z) + **#80 (14:31:13Z — MỚI, T2-171 trực tiếp)**. **R: mọi cách đếm đều MỞ — y hệt T2-170 từng giây (lần thứ bảy liên tiếp không đổi).** Biến thể +dispatch 11:35:51Z (DB, không tính vào union chính): 1.211 s — cũng MỞ.

**S — file max MỚI 3.235 s (13:01:51→13:55:46):** 42 exec-log trong S bị runtime dọn sạch giữa hai đợt (xem F-171-T2-3) — toàn bộ 42 file đều KHÔNG CÒN trên đĩa (0 file chỉ trôi mtime). Union-A/B S không đổi một giây (662/591 s) vì nội dung watcher-162 (poll 30 s) + sampler-162 (dòng 60 s) lấp đầy S. **ĐÓNG theo union.** Hố file S cũ 843 s (13:19:54→13:33:57) nay nằm gọn trong hố mới 3.235 s.

**U — union-B max MỚI 990 s (11:21:28→11:37:58, tăng từ 860 s):** 13 mốc trong khoảng này đã trôi mất (build-loop-log.md 11:36:57Z + 12 file runtime — live-config, sessions.json, subscriptions, system_prompt.md, .pki nssdb, filesystem_watch_hashes — đều bị ghi đè lúc đợt 171 mở, xem F-171-T2-4). Hố nằm giữa sampler-169 dừng (10:54:11Z) và sampler-170 bắt đầu (11:38:04Z). **Vẫn dưới sàn 1.147 s → ĐÓNG theo union.** Hố file U mới H-U10 1.062 s (13:19:15→13:36:57) + H-U11 990 s (cùng khoảng với union-B max) — cả hai đều được lấp đầy bởi mốc nội dung sampler-170 5df1871f mỗi 60 s. H-U8 nới thành 1.188 s (10:33:43→10:53:31 — mốc 10:36:11Z trôi mất). Union-A max vẫn 1.067 s (08:20:37→08:38:24). U chỉ tham chiếu cho #96? — không đổi verdict R.

T đóng chắc (file 307 s; union-A 31 → 38 s — trôi nhẹ, vẫn đóng).

**Kết luận đầy đủ: #96? VẪN MỞ qua đoạn R. Quét tươi + kiểm nội dung + sessions + hole-recheck đều đã chạy đầy đủ đợt này và xác nhận lại từng số của T2-170 (R không đổi một giây lần thứ bảy; S/T/U union không đổi verdict dù file-gap trôi).**

### 2.5 CERT/FULL ứng viên + INSIDE

**CERT/FULL chính thức GIỮ 76/91** (quyết (b) đợt 164, giữ theo quyết (m) đợt 165–170; #95?/#94?/#77? vẫn mở). Gap #63 = 9.073 s cho ứng viên CERT95/FULL110.

**FULL123/FULL124 KIỂM LẠI ĐỘC LẬP — ĐẠT (nợ F-170-T10-2, đã trả):** (a) danh sách: FULL123 = FULL122 + [3.089] ✓; FULL124 = FULL123 + [3.046] ✓; (b) `statistics.quantiles` method='inclusive' VÀ (c) nội suy chỉ số-sắp xếp viết mới đều cho **FULL123 p10/p90 1.566,20/8.728,60 s** và **FULL124 p10/p90 1.567,80/8.718,90 s** — KHỚP giá trị T2-170 đã in VÀ giá trị chuỗi s123/s124. T2-171 đã kiểm lại phép tính dải FULL123/FULL124 độc lập như T10-170 còn nợ.

**FULL125** (gap #78 NOMINAL 6.987 s, CÓ ĐIỀU KIỆN): n=125, mean 1h39'22", median 1h53'00", p10 0h26'09" (1.569,40 s), p90 2h25'09" (8.709,20 s), sd 0h55'13", min 0h00'55", max 5h43'18"; trong 90–150'=67, <60'=30, >180'=8, >240'=3.
**FULL126** (gap #79 NOMINAL 11.996 s, CÓ ĐIỀU KIỆN): n=126, mean 1h40'09", median 1h53'21", p10 0h26'11" (1.571,00 s), p90 2h26'28" (8.787,50 s), sd 0h55'43", min 0h00'55", max 5h43'18"; trong 90–150'=67, <60'=30, >180'=9, >240'=3.
**FULL123/FULL124 kiểm lại:** p10/p90 KHỚP T2-170 từng số (FULL123 1.566,20/8.728,60 s; FULL124 1.567,80/8.718,90 s — script có assert, không trôi chuỗi).

Tốc độ reboot: tới #78: 154 reboot / 276,94 h = 1 lần / 107,9 phút; tới #79: 155 reboot / 278,88 h = 1 lần / 108,0 phút; tới #80: 156 reboot / 282,21 h = 1 lần / 108,5 phút.

**INSIDE:**
- **#79 INSIDE dải FULL125 [09:40:47Z, 11:39:47Z] neo 09:14:38Z** (biên dưới 5.418 s, biên trên 1.722 s; biên trên chính xác 1.722,2 s) → **chuỗi MỚI từ #73 tiếp tục, dài 6.**
- Đối chiếu vs dải còn hiệu lực: #79 NGOÀI dải FULL124 [08:49:59Z, 10:49:10Z] neo 08:23:52Z (muộn 1.315 s; chính xác 1.314,1 s) — **hai dải KHÔNG đồng thuận (cùng mẫu #71/#77: INSIDE dải phương pháp nhưng NGOÀI dải còn hiệu lực — xem caveat dưới).**
- **#80 NGOÀI dải FULL126 [11:37:16Z, 13:37:32Z] neo 11:11:05Z** (muộn 3.209 s; chính xác 3.208,5 s) → **CHUỖI ĐỨT tại #80.**
- Đối chiếu vs dải còn hiệu lực: #80 NGOÀI CẢ dải FULL125 [09:40:47Z, 11:39:47Z] neo 09:14:38Z (muộn 10.274 s; chính xác 10.273,8 s) — **hai dải ĐỒNG THUẬN (cùng NGOÀI).**
- **Caveat (ghi rõ, parent quyết):** theo dải PHƯƠNG PHÁP (F-165-T2-1: dải cho #k là FULL(110+k−64) neo btime #(k−1)), #79 INSIDE → chuỗi dài 6; #80 NGOÀI → chuỗi ĐỨT tại #80. Theo dải CÒN HIỆU LỰC, #79 cũng NGOÀI (muộn 1.315 s) — nếu parent đọc theo dải còn hiệu lực thì chuỗi đã đứt tại #79, không phải #80. Tiền lệ #71: INSIDE FULL117 nhưng NGOÀI FULL116 muộn 5.521,5 s — chuỗi vẫn được tính tiếp tục theo dải phương pháp (FULL118→#72, FULL119→#73 đã tính; chuỗi chỉ ĐỨT tại #73 theo FULL119, quyết (c) đợt 167). T2-171 áp dụng cùng tiền lệ: **chuỗi dài 6 sau #79 theo phương pháp, ĐỨT tại #80; mâu thuẫn với dải còn hiệu lực ở #79 được ghi rõ để parent quyết** — T2 không tự chốt khi hai dải mâu thuẫn ở #79 (dù #80 đồng thuận cả hai là NGOÀI).
- **Nhãn dải — kiểm lại đúng phương pháp (bài học F-165-T2-1):** #79 kiểm theo FULL125 neo btime #78 (mẫu FULL112→#66 … FULL124→#78 ⇒ FULL125→#79, FULL126→#80; mỗi dải gồm gap kết thúc tại neo của nó). FULL124 chỉ là dải đối chiếu còn hiệu lực cho #79, FULL125 chỉ là dải đối chiếu còn hiệu lực cho #80 — KHÔNG phải dải phương pháp.
- Gap #79 NOMINAL 11.996 s là gap dài nhất kể từ #74 (5.848 s) — đẩy #80 ra ngoài dải trên tới 3.209 s. FULL127 (cho #81) thuộc T2-172.

### 2.6 Hole-recheck

`hole-recheck9696.py`: find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp [19:32:59Z 20/11, 15:00:00Z 22/11]: **11.778 file** (was 10.974 — tăng 804 do cửa sổ kéo dài tới 15:00:00Z). Find stderr: 1 dòng — `/home/hatch/.stagged-uploads: Permission denied` (giới hạn đứng, thư mục mode 0000). **KIỂM TRƯỚC KHI CHẠY (bài học F-166-T2-2): `grep ^W =` → round171-t2 ✓; `grep ^hi =` → 15:00:00Z 22/11 ✓; KHÔNG dùng `#` làm delimiter; output vào thư mục RIÊNG round171-t2 (file MỚI `holerecheck-all.txt`, KHÔNG ghi đè file cũ). File `round170-t2/holerecheck-all.txt` md5 KHÔNG ĐỔI sau lần chạy (d5a0f87c… — kiểm lại sau khi chạy).**

| Hố | Kết quả |
|---|---|
| H-R1 (11:15:18, 11:35:56) | **0 hit — 0 mốc mới** |
| H-R1-old (11:16:22, 11:35:35) | 0 hit |
| H-S1/H-S2 | mỗi hố 0 hit |
| H-S3 (14:25:21, 14:36:23) | 1 inside = 1 trap (cạnh trái 14:25:21.013Z, replay-watch-162.log), 0 mới |
| H-S4 MỚI (13:01:51, 13:55:46) | **1 inside = 1 trap (cạnh trái 13:01:51.071Z, proactive_notification md), 0 mới** |
| H-T1 (15:23:25, 15:28:32) | 1 inside = 1 trap (cạnh trái 15:23:25.879Z, proc_f7ccbba2a25c.log), 0 mới |
| H-U1 (16:25:06, 16:40:12) | 1 inside = 1 trap (cạnh trái 16:25:06.180Z, proc_2a111ad13bcc.log), 0 mới |
| H-U2 (17:20:48, 17:36:14 — bắc qua btime #67) | 1 inside = 1 trap (cạnh trái 17:20:48.627Z, PHASE9_ROUND163_LIMITS.md), 0 mới |
| H-U2-old (17:22:25, 17:35:37) | 0 hit |
| H-U3 (19:37:11, 19:49:46) | 10 inside = 10 trap (cùng giây 19:37:11, file stall T8-164), 0 mới |
| H-U4 (16:13:06, 16:25:06) | 1 inside = 1 trap (cạnh trái 16:13:06.290Z, proc_f4d2cc5e81cf.log), 0 mới |
| H-U5 (22:09:05, 22:32:32) | 1 inside = 1 trap (cạnh trái 22:09:05.886Z, proc_5c237211ba31.log), 0 mới |
| H-U6 (06:56:58, 07:22:14) | 1 inside = 1 trap (cạnh trái 06:56:58.721Z, proc_0a160336a16d.log), 0 mới |
| H-U7 (10:08:01, 10:28:06) | 1 inside = 1 trap (cạnh trái 10:08:01.145Z, proc_6b03cdc0bb27.log), 0 mới |
| H-U8 (10:33:43, 10:53:31 — BIÊN TRÁI DỜI TỪ 10:36:11) | **1 inside = 1 trap (cạnh trái 10:33:43.011Z, proc_e174402912c9.log), 0 mới** |
| H-U9 MỚI (08:20:37, 08:38:24) | **1 inside = 1 trap (cạnh trái 08:20:37.538Z, PHASE9_ROUND168_LIMITS.md), 0 mới** |
| H-U10 MỚI (13:19:15, 13:36:57) | **1 inside = 1 trap (cạnh trái 13:19:15.852Z, proc_860da8744e60.log), 0 mới** |
| H-U11 MỚI (11:21:28, 11:37:58) | **1 inside = 1 trap (cạnh trái 11:21:28.169Z, sessions e033d2dd jsonl), 0 mới** |
| H-E1-88 (19:32:59Z, 20:17:30Z) | **337 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI — lần thứ MƯỜI LĂM liên tiếp 0 mốc mới** |

Known base: 2.624 mốc giây đợt này; base #88? T2-157: 557 giây. **H-E1-88 giữ 337 hit — y hệt lần 9–14, không trôi thêm** (lần 14 giảm 345 → 337 do 8 exec-log mtime trôi; đợt này 0 file trôi thêm trong hố #88? — 42 file bị xóa đều nằm ngoài hố #88?).

### 2.7 Verdict mù (tổng hợp)

| Mù | Verdict đợt 171 | Cơ sở |
|---|---|---|
| #96? (#64) | **VẪN MỞ** (R 1.238/1.222/1.211 s vượt sàn; S/T/U đóng theo union) | Quét tươi + kiểm nội dung đầy đủ, số R y hệt T2-170 (S/T/U union không đổi verdict dù file-gap trôi) |
| #95? (#63) | **MỞ** (giữ nguyên quyết (b) đợt 164) | Không có bằng chứng mới |
| #94? (#62) | **MỞ** (giữ nguyên) | Không có bằng chứng mới |
| #88? | **VẪN MỞ** (lần thứ 15: 337 hit, 0 mới) | Hole-recheck §2.6 |
| #77? | **VẪN MỞ** (giữ nguyên) | Không có bằng chứng mới |

**CERT/FULL chính thức GIỮ 76/91** (vì #77?/#88?/#94?/#95? vẫn mở; #96? VẪN MỞ — chưa đổi được khi chưa chứng nhận theo thứ tự).

## 3. Mù #88?/#77?/#95?/#94? — giữ nguyên

Mù #88? VẪN MỞ (lần thứ 15, §2.6: 337 hit, 0 mốc mới — y hệt lần 9–14). **#95?/#94?/#77? GIỮ NGUYÊN, không đổi** — không có bằng chứng mới đợt này. **CERT/FULL chính thức GIỮ 76/91.** T2 không tự đóng/mở bất kỳ mù nào — parent quyết.

## 4. Mô hình đồng hồ + điểm (m)

### 4.1 Điểm (m) #56 — thu hẹp lần thứ MƯỜI BỐN: 7 hướng MỚI, 6 âm tính + 1 ứng viên đã loại

Cửa GIỮ NGUYÊN: **R [2,56251; 2,66817) s / J [2,566; 2,80753] s** (T2-168, §4.1). **#56 VẪN CÓ ĐIỀU KIỆN; KHÔNG chốt n=15.** Các hướng đã thử đợt này (`m56-171.py`, epoch cửa D [19:04:44Z, 20:22:43Z] 20/11 đã kiểm độc lập):

| Hướng (đợt 171) | Kết quả |
|---|---|
| (i) birth-time qua `stat` từng file trên shortlist (F-170-T2-4 gợi ý — `find -newerBt` bị chặn nhưng `stat -c %W` chạy được từng file) | **20 birth trong D — NHƯNG 0 MỚI: tất cả thuộc 6 agent session đã biết** (6fc7dd16 @20:16:36Z = đúng giây mtime tường D; 964f2bc4 @20:19:34Z = max đã biết từ T2-170 (vii); af13c1c2 @20:17:30Z; a71de8cb @20:04:17Z; ad69c371 @19:59:50Z; c90387c7 @19:56:09Z — cộng 2 file .jsonl cùng agent: 6fc7dd16 @20:05:53Z, 964f2bc4 @20:17:31Z — cùng agent đã biết, phân loại E từ đợt 157, nằm trong khoảng đã tính [.., 20:19:34Z], không nới tường). **0 birth nào muộn hơn mốc đã biết → không thu hẹp** |
| (ii) grep content-timestamp ISO trong D trên file text KHÔNG phải exec-log (/var/log + hidden_files + repo-1/docs) | **230 file trong hidden_files + 8 file docs trích mốc trong D — NHƯNG 0 MỚI:** kiểm max từng file: mốc sau tường D duy nhất là 20:17:30Z (trích af13c1c2 — đã biết) và 20:19:34Z (trích 964f2bc4 — đã biết), cộng 20:22:43Z trong chính output m56-171.txt của T2 (trích biên D1, không phải mốc). /var/log: 0 file. Các mốc trước tường (sampler-156 19:00–19:05, vite-lock 19:34–19:41, b2-spikes 19:47–19:51) đều nằm trong khoảng đã tính, không muộn hơn tường |
| (iii) file database dpkg (/var/lib/dpkg/status, status-old, available, diversions, updates/*) + /var/lib/apt/lists/* + /var/cache/apt/*.bin | **0 file có mtime trong D** (status/status-old mtime 14:37:43Z 22/11; available 0 B epoch 0; diversions 14:36:09Z 22/11; apt lists 2024-04; pkgcache.bin 14:37:43Z 22/11; updates/ trống) |
| (iv) quét MTIME trong D trên cây MỚI: /var/lib, /var/cache, /usr/local, /boot, /root | **0 file trong D trên cả 5 cây** (/var/lib: 1 dòng stderr — `find: '/var/lib/hatch/postgres': Permission denied`, giới hạn đứng; 4 cây còn lại 0 dòng stderr) |
| (v) content timestamp trong session JSON (/home/hatch/agents/*/sessions/*.json*) | **53 file có mốc trong D — NHƯNG 0 MỚI:** toàn bộ là trích mốc đã biết/biên cửa (19:04:44Z D0 ×16, 19:32:59Z lo ×14, 20:16:36Z tường ×8, 20:16:37Z/20:16:40Z lát dưới-giây đã kiểm đợt 168/169, 20:17:30Z af13c1c2 ×14, 20:22:43Z D1 ×10) + **1 ứng viên 20:17:15Z ×11 — ĐÃ KIỂM TRA VÀ LOẠI** (xem F-171-T2-9: goal-update "Đợt 156 đóng sổ", bản ghi phía scheduler, không phải mốc filesystem của VM, nằm trong khoảng đã tính) |
| (vi) tìm trong tài liệu: grep mốc D trong toàn bộ docs PHASE9 + log T2 đợt 157–162 | **8 file docs + 20/7/6/6/5/5 file round157–162-t2 trích mốc D — NHƯNG 0 MỚI:** kiểm max từng file (cùng phép kiểm như (ii)): mốc sau tường duy nhất là 20:17:30Z/20:19:34Z (đã biết) — toàn bộ là trích dẫn, không có mốc D-wall mới |
| (vii) `journalctl --since/--until` trong D + kiểm 3 exec-log bị xóa có phải nhân chứng D không | **journal: 0 dòng ("-- No entries --" — journal chỉ còn boot hiện tại, đã biết). 3 file bị xóa (d8365be752b7, 32c9bb12db04, 9db5c8fba228) CÓ trong sessions-9696.txt đợt 170 — nhưng chỉ còn min/max span, nội dung trong D KHÔNG khôi phục được (xem F-171-T2-9); proc_9db5c8fba228 span toàn bộ D (19:32:59Z 20/11 → 14:35:37Z 21/11), nội dung đã biết của nó là trích biên hole-recheck (lo=19:32:59Z)** |

**Đợt 170 (đối chiếu — 7 hướng cũ: 6 âm tính + 1 bị chặn):** (i) wtmp/btmp xoay — không tồn tại; (ii) journal bền vững — chỉ 1 file, --list-boots chỉ có boot #79; (iii) shell history — TẤT CẢ MISSING; (iv) apt history/term.log — 0 Start-Date Nov 20; (v) birth-time scan BỊ CHẶN (find -newerBt không hỗ trợ — F-170-T2-4); (vi) dpkg xoay sau .1 — không tồn tại; (vii) ctime scan — 351 file, 0 neo mới. Đợt này thêm 7 hướng MỚI — tổng **29 hướng âm tính liên tiếp** (15 hướng đợt 167/168/169 + 7 hướng đợt 170 + 7 hướng đợt này, chưa kể các hướng đợt 158–166; hướng (v) đợt 170 bị chặn do công cụ, không tính là âm tính). **Cửa R/J GIỮ NGUYÊN; không có mốc mới nào để thu hẹp.**

### 4.2 Điểm (m) #80 — KHÔNG PHẢI ĐIỂM (đối chiếu độc lập — xem §1.1)

Tóm tắt: 0 requeue trong cửa [14:31:01Z, 14:50:00Z] và cửa mở rộng tới 15:00:00Z (mọi job); 0 run sống tại btime (run 170 xong −598 s, run 171 dispatch +290,103 s); 0 run spanning theo started_at; run 170 chỉ 2 event, 0 viết lại. **T2-171 phán KHÔNG PHẢI ĐIỂM — parent quyết cuối. n không đổi vì #80.**

### 4.3 Điểm (m) #79 — KHÔNG PHẢI ĐIỂM (parent ĐÃ QUYẾT — xem §1.2)

Tóm tắt: parent đã quyết (e) đợt 170: requeue duy nhất +251,007 s, NGOÀI dải 201,207 s trên biên. **T2-171 KHÔNG mở lại. n không đổi vì #79.**

### 4.4 Điểm (m) #78 — DƯƠNG ĐÃ ĐƯỢC CHẤP NHẬN (ghi nhận quyết parent, không phải việc của T2 đợt này)

Quyết (e)/(f) đợt 170: **(m) #78 DƯƠNG — CHẤP NHẬN** (requeue +40,693 s ∈ [33; 49,8]; T2-170 đối chiếu độc lập + T7-170 xác nhận lại). **→ n 27→28 / 28→29** (xem §4.6). Bookkeeping thuộc T10/GAP — T2 chỉ ghi nhận.

### 4.5 Lệch khung giờ biên #79/#80 — #79 KHÔNG OVERLAP; #80 KHÔNG OVERLAP

**Bằng chứng (T5-170 + T7-170 + T9-170 + T0-171 + T2-171 kiểm trực tiếp từ `round170-t9/ram-sampler.log`, `round170-t5/replay-watch-170.log`, `round171-t9/ram-sampler.log` và `round171-t5/replay-watch-171.log`):**

| Bằng chứng | Giá trị | Offset so với btime |
|---|---|---|
| **Biên #79 (btime 11:11:05Z):** | | |
| Dòng sampler-169 cuối e298bb52 | **10:54:11Z** | **−1.014 s** (sampler dừng 10:54:11Z; không có sampler nào sau đó tới 11:38:04Z) |
| Poll watcher-169 | **không có** (chết theo #78) | — |
| Dòng sampler-170 đầu 5df1871f | 11:38:04Z | +1.619 s |
| /proc/1 mtime (boot mới) | 11:11:15.986Z | +10,986 s |
| journal first entry (boot mới) | 11:11:16Z | +11 s |
| wtmp begins (boot mới) | 11:11:16Z | +11 s |
| **Biên #80 (btime 14:31:01Z):** | | |
| Poll cuối watcher-170 | **14:21:59Z** | **−542 s** (KẾT THÚC LẶNG TRƯỚC #80 — không có poll nào sau btime; xem F-171-T2-6) |
| Dòng sampler-170 cuối 5df1871f | **13:38:07Z** | **−3.174 s** (sampler dừng 13:38:07Z; không có sampler nào sau đó tới 14:44:27Z) |
| Dòng sampler-171 đầu 2acdd1ab | 14:44:27Z | +806 s |
| Poll đầu watcher-171 | 14:52:09Z | +1.248 s |
| /proc/1 mtime (boot mới) | **14:31:13.024Z** | **+12,024 s** (T2-171) |
| journal first entry (boot mới) | 14:31:13Z | +12 s |
| wtmp begins (boot mới) | 14:31:13Z | +12 s |

**Tại #79: KHÔNG CÓ OVERLAP** — không một dòng nội dung boot cũ nào sau btime #79; bằng chứng khung mới đến ngay sau btime (+11 s) và không có gì mâu thuẫn. Không có vấn đề lệch khung tại #79.

**Tại #80: KHÔNG CÓ OVERLAP** — không một dòng nội dung boot cũ nào sau btime #80; nội dung boot cũ GẦN NHẤT (watcher-170 poll cuối) nằm TRƯỚC btime tới 542 s. Khác #78 (poll cuối +11 s sau btime) và #76 (dòng sampler +14 s sau btime): tại #80 không có bằng chứng khung cũ nào vượt qua btime, và cũng không có bằng chứng khung mới nào đến trước btime. **Không có vấn đề lệch khung tại #80 — verdict (m) #80 không phụ thuộc neo nào (requeue = 0).**

**Phán: KHÔNG OVERLAP tại #79 và #80. (m) #79 đã quyết KHÔNG PHẢI ĐIỂM; (m) #80 KHÔNG PHẢI ĐIỂM theo DB — parent quyết cuối.**

### 4.6 Nhãn n (tổng hợp)

- **n chính thức: GIỮ 14** (parent quyết; T2 không tự đổi).
- n ứng viên (nhánh khuyến nghị): **28** (24 dương + 4 âm — #74 đã CHẤP NHẬN theo quyết (f) đợt 168; **#78 đã CHẤP NHẬN DƯƠNG theo quyết (e)/(f) đợt 170 → 27→28**; #75/#76/#77/#79/#80 KHÔNG PHẢI ĐIỂM — n không đổi vì #79/#80).
- n ứng viên (nhánh #56 ÂM): **29** (24 dương + 5 âm — #56; **#78 đã chấp nhận → 28→29**).
- #56 vẫn CÓ ĐIỀU KIỆN (§4.1) — KHÔNG chốt n=15.
- #80 KHÔNG PHẢI ĐIỂM — n không đổi vì #80; #79 KHÔNG PHẢI ĐIỂM — n không đổi vì #79.

## 5. Probe EPERM #89 + sweep

**Probe #89 — CHẠY 14:48:02Z** (`probe-eperm-v2.sh once`, trước cửa sổ attempt2 của T4-171 — attempt2 bắt đầu 15:02:43Z): boot 2acdd1ab, **ok=2 fail=0**, exit 0. Log `eperm-probe-v2.log` 256 → **258 dòng** (+1 dòng boot-changed c44cc3ba → 2acdd1ab, +1 dòng probe#89); heartbeat n=89 (pid 11462, ts 14:48:02Z, boot 2acdd1ab-23a6-41b0-9d90-40641d2404a0). `=== probe end` vẫn **0 dòng** (1 dòng `=== probe start` duy nhất từ 11/11). **Cửa sổ probe #89: 08:43:38Z → 14:48:02Z = 21.864 s** (6h04m24s). MemAvailable lúc probe: **1.569 MB** (RAM peak trong cửa sổ thuộc T9-171 — T2 không đo RAM đợt này). Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.

**Sweep #89** (`eperm-sweep9696.py`, 230 file `*.log` mtime trong cửa sổ): 4 file có hit, 118 occurrence — **0 sóng thật**:
- `proc_0ac1e67bd2b7.log` (exec-log agent 70dbe1fc, mtime 14:44:48Z): "Operation not permitted" ×111 — **KHÔNG phải sóng: toàn bộ là `cp: failed to preserve ownership` của lệnh `cp -a` sao chép thư mục round171-t8 của T8-171** (cùng họ F-170-T4-1: `cp -a` báo EPERM từng file vì không giữ được ownership, nhưng vẫn sao chép nội dung; probe #89 ghi ok=2 fail=0 ngay sau đó).
- `proc_2b01faab0744.log`: "sóng EPERM đã tắt" ×1 (trích dẫn).
- `round169-t8/o8-169t8.log` + `round170-t8/o8-170t8.log`: "sóng EPERM đã tắt" ×3 mỗi file (dòng trạng thái của T8).
- 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO" mới. **0 sóng thật trong cửa sổ probe #89.**

## 6. Phương pháp, sai số của T2, câu hỏi cho parent

### 6.1 Phương pháp (tóm tắt — script trong `~/workspace/goals/capcut-clone-video-editor/hidden_files/round171-t2/`)

- (m): `m-check171.py` (epoch số học + đếm requeue theo cửa — DB đọc tươi qua muse.db, 6 query) + đối chiếu 3 nguồn (§1.1/§1.2) / tham chiếu (§1.2); `m56-171.py` (7 hướng mới).
- INSIDE: `blind9696-gaps171.py` (FULL125/FULL126, p10/p90 theo đúng phương pháp các đợt trước; kiểm lại FULL123/FULL124 độc lập bằng hai cách tính mới + đối chiếu FULL124/FULL125 còn hiệu lực; reboot rate).
- Mù: `blind9696-investigate.py` (5 scope, mtime float, merge — cửa sổ tới 15:00:00Z), `blind9696-content.py` (kiểm nội dung sampler/watcher từng đoạn + union-A/B — thêm sampler-170 FULL, watcher-170, sampler-171, watcher-171, SYS80), `blind9696-sessions.py` (jump witness + DD/MM carry-over, xem F-170-T2-1/2 — thêm #80), `blind9696-merged.py` (gap file/union-A/union-B), `hole-recheck9696.py` (find toàn cây + float-trap — thêm H-U9/H-U10/H-U11/H-S4, cập nhật H-U8; file MỚI, không ghi đè file cũ).
- Probe: `probe-eperm-v2.sh once` (probe #89) + `eperm-sweep9696.py` (sweep cửa sổ #89).
- **Caveat quét mù (F-171-T2-10):** B1 = 15:00:00Z là mốc cắt; vòng walk kết thúc 14:57:11Z nên các mốc U trong (14:57:11Z, 15:00:00Z] có thể thiếu — U chỉ tham chiếu, không ảnh hưởng verdict (hố max U kết thúc 07:22:14Z; U-tail last mark 14:57:10Z khớp walk-end).

### 6.2 Sai số của T2 đợt này (F-171-T2-*)

**F-171-T2-1 (LỖI CỦA CHÍNH T2 — script phân tích nặng trong cửa sổ attempt của T4-171 — VI PHẠM LUẬT ĐỨNG):** T2 không kiểm `chain-t4.log` trước khi chạy script nặng. Chồng lấn thực tế (mốc giờ từ chain-t4.log + mtime file):
- attempt1 (14:50:04–14:53:57Z): KHÔNG chồng — walk mù bắt đầu 14:54:08Z (11 s SAU khi attempt1 kết thúc). ✓
- attempt2 (15:02:43–15:06:15Z, inner-end 15:06:12Z): `blind9696-sessions.py` chạy lại ~15:04Z (~2 s, chỉ đọc — nhẹ) + `hole-recheck9696.py` bắt đầu 15:06:08Z (chồng 4 s cuối probe pass, tới inner-end 15:06:12Z; find toàn cây, nặng I/O).
- attempt3 (15:08:10–15:11:35Z, inner-end 15:11:32Z): `m56-171.py` chạy ~15:10:31–15:11:59Z (88 s, grep -r toàn hidden_files + docs — NẶNG) — **chồng ~61 s với probe pass của attempt3** (tới inner-end 15:11:32Z).
- T4-171 đã tự ghi round171-t2 vào danh sách file đổi trong cửa sổ attempt2 + attempt3. Ảnh hưởng tới verdict attempt3 (B2/load) thuộc T4-171/T9-171/T10-171 phán — T2 không tự phán. Kết quả (m)/INSIDE/mù của T2 không phụ thuộc phép đo của T4 nên không đổi. **Bài học: từ đợt 172, T2 kiểm `chain-t4.log` (mốc attempt) TRƯỚC MỖI script nặng, và hoãn script nặng tới sau khi attempt kết thúc.**

**F-171-T2-2 (lỗi tham số của chính T2 — bắt và chạy lại trước khi viết LIMITS):** lần chạy `blind9696-sessions.py` đầu tiên truyền sai cửa sổ U (13:56:58–14:22:14Z thay vì H-U6 06:56:58–07:22:14Z — tự tính epoch nhầm giờ). Đã chạy lại với epoch đúng (1795330618/1795332134, kiểm bằng `date -d`); LIMITS dùng lần chạy thứ hai (R-gap 3 hit + H-U6 0 hit). Lần chạy sai không ghi vào file sessions-9696.txt cuối (file bị ghi đè bởi lần chạy đúng).

**F-171-T2-3 (42 exec-log trong S bị XÓA giữa hai đợt — runtime dọn dẹp, KHÔNG phải trôi mtime):** 42 file `~/workspace/agents/*/exec-logs/*.log` có mtime trong S ở danh sách đợt 170 đều KHÔNG CÒN trên đĩa lúc T2-171 quét (kiểm `os.path.exists` từng file: 42/42 deleted, 0 moved). Hệ quả: S file-marks 471 → 429; S file max gap 843 s → 3.235 s (13:01:51→13:55:46Z); jump witness #64 8→5, #65 8→6 (3/2 file mất đều trong 42 file này — đối chiếu sessions-9696.txt đợt 170); R-gap exec-log hit 4→3. Union-A/B S KHÔNG ĐỔI (662/591 s) → S vẫn ĐÓNG theo union. Verdict #96? không đổi (R vẫn mở). Lần đầu tiên mất mát là XÓA hẳn (F-170-T2-9 là trôi mtime, file còn) — ghi rõ khác biệt.

**F-171-T2-4 (U union-B max 860 → 990 s + T union-A 31 → 38 s — trôi mốc, vẫn ĐÓNG):** 13 mốc trong (11:21:28, 11:37:58) đã trôi mất (build-loop-log.md 11:36:57Z + 12 file runtime bị ghi đè lúc đợt 171 mở); hố union-B U nay 990 s, vẫn dưới sàn 1.147 s. T union-A 31 → 38 s (trôi nhẹ). Cả hai vẫn ĐÓNG — ghi rõ, không giấu.

**F-171-T2-5 (số U file-marks của T2-170 — 5.936 — KHÔNG tái hiện được; sai số không thuộc verdict):** đếm lại độc lập từ chính danh sách đợt 170 (`round170-t2/blind9696-*.txt`): U = **4.461 file-marks**, không phải 5.936. Hơn nữa 5.936 VƯỢT tổng số file trong cửa sổ đợt 170 (108+3.147+1.740+644+15 = 5.654) — không thể đúng nếu các đoạn rời nhau. File `round170-t2/blind9696-merged.log` chỉ dài 101 dòng, DỪNG NGAY SAU mục T marks (không có mục U) — cùng họ SIGPIPE như F-170-T2-3 (log bị cắt khi pipe qua head). Số mốc-giây thì tái hiện đúng (2.321). **Kết luận: số 5.936 là sai; số đúng cho U đợt 170 là 4.461 (đếm lại từ danh sách). Số U đợt 171 của T2 là 5.185 — kiểm hai cách (merged.py + đếm độc lập) KHỚP, và tổng các đoạn 55+429+657+5.185 = 6.326 khớp đúng tổng file quét được (120+3.572+1.811+808+15 = 6.326).** Không verdict nào dùng file-marks U nên không ảnh hưởng verdict nào — chỉ đính chính số đếm.

**F-171-T2-6 (watcher-170 kết thúc lặng TRƯỚC #80 + khoảng không-sampler chứa #80):** watcher-170 (pid 20516, START 11:42:42Z) poll cuối 14:21:59Z = btime #80 −542 s; pid đã mất lúc T2 kiểm; log không có dòng END. Nó KHÔNG chết theo #80 — nó đã kết thúc lặng ~9 phút trước #80 (khớp cửa sổ chết (14:21:59Z, 14:31:01Z] = 542 s mà T0-171 ghi). Cách nói "chết theo #80" trong LIMITS T0-171 (F-171-T0-?) chưa chính xác — T2 ghi rõ, T5-171 sở hữu lifecycle watcher. Sampler-170 dừng 13:38:07Z, sampler-171 bắt đầu 14:44:27Z → khoảng không-sampler 3.980 s chứa #80 — caveat cho T9-171 (cùng mẫu F-170-T2-6 cho #79).

**F-171-T2-7 (run 170 claimed→finished 110 s — ngoài họ 6–11 s):** claimed 14:19:13Z → finished 14:21:03Z = 110 s (run 169: 35 s; họ 6–11 s từ đợt 150). Ca thứ hai ≥100 s sau 108 s của run 167 (lớn nhất tới nay). Chỉ ghi nhận — kết cục run 170 thuộc T7-171, T2 không suy cơ chế. Margin run 170 vẫn rộng: 888 s (run 169: 1.087 s).

**F-171-T2-8 (m56-171.py in thừa — 200 KB output):** script in birth của MỌI sessions.json (hàng trăm dòng) thay vì chỉ birth trong D. Lãng phí log, không ảnh hưởng verdict. Từ đợt 172 chỉ in birth trong D.

**F-171-T2-9 ((m) #56 hướng (v): ứng viên 20:17:15Z đã kiểm tra và LOẠI + 3 exec-log bị xóa là nhân chứng #64):** mốc 20:17:15Z xuất hiện trong 11 session .jsonl — kiểm ngữ cảnh: đó là goal-update "Đợt 156 đóng sổ" (Effective at: 2026-11-20T20:17:15Z), bản ghi phía scheduler được trích trong transcript các session, KHÔNG phải mốc filesystem của VM; nằm trong khoảng đã tính (max 20:19:34Z) → không thu hẹp. 3 exec-log bị xóa từng là nhân chứng #64 (proc_d8365be752b7, proc_32c9bb12db04, proc_9db5c8fba228) — chỉ còn min/max span trong sessions-9696.txt đợt 170; proc_9db5c8fba228 span toàn bộ D nhưng nội dung đã biết của nó là trích biên hole-recheck (lo=19:32:59Z). Nội dung trong D của 3 file này KHÔNG khôi phục được — caveat, không suy thêm.

**F-171-T2-10 (B1 quét mù là mốc cắt 15:00:00Z — walk kết thúc 14:57:11Z):** các mốc U trong (14:57:11Z, 15:00:00Z] có thể thiếu trong danh sách merged (walk đã qua các cây trước khi mốc đó sinh ra; U-tail last mark 14:57:10Z khớp walk-end). U chỉ tham chiếu, hố max U kết thúc 07:22:14Z — không ảnh hưởng verdict nào. Ghi rõ để T2-172 dùng B1 = giờ chạy thực tế (đã làm đợt này).

**F-171-T2-11 (hole-recheck: H-U8 đổi biên + 4 hố mới):** H-U8 biên trái dời 10:36:11Z → 10:33:43Z (mốc 10:36:11Z trôi mất; hố nay 1.188 s, vẫn 1 trap 0 mới). Hố mới H-U9 (08:20:37→08:38:24, union-A max), H-U10 (13:19:15→13:36:57), H-U11 (11:21:28→11:37:58), H-S4 (13:01:51→13:55:46, S file max mới) — tất cả 1 trap, 0 mới.

**F-171-T2-12 (sweep #89: 111× "Operation not permitted" KHÔNG phải sóng):** toàn bộ là `cp: failed to preserve ownership` của `cp -a` sao chép thư mục round171-t8 (T8-171) — cùng họ F-170-T4-1. Probe #89 ghi ok=2 fail=0 ngay sau đó (14:48:02Z). 0 sóng thật trong cửa sổ #89.

**Đã biết, giao T10-171:** nhãn GAP §99 còn cũ so với quyết parent §12.3 đợt 170 (quyết (a)–(o) đã viết — §99 hiện vẫn ghi "chờ quyết parent §12.1 aggregate 170") — T10-171 cập nhật khi viết §100 (cùng mẫu F-168-T1-1/F-169-T1-1/F-170-T1-2). Không thuộc phạm vi T2. **R9 (a) vẫn chờ user** (số đếm vẫn là 16); **G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời).

### 6.3 Câu hỏi cho parent (chờ quyết ở aggregate 171)

1. **(m) #80 KHÔNG PHẢI ĐIỂM: ghi nhận?** (0 requeue trong cửa [14:31:01Z, 14:50:00Z] và cửa mở rộng tới 15:00:00Z; 0 run sống tại btime; T0-171 đồng ý "không phải ứng viên"; T2-171 đối chiếu độc lập. n không đổi vì #80.)
2. **INSIDE chuỗi: #79 INSIDE FULL125 → chuỗi MỚI từ #73 dài 6 theo dải phương pháp (nhưng NGOÀI FULL124 còn hiệu lực, muộn 1.315 s — cùng mẫu #71/#77); #80 NGOÀI FULL126 (muộn 3.209 s) → CHUỖI ĐỨT tại #80 — ghi nhận theo dải nào?** (FULL123/FULL124 kiểm lại độc lập ĐẠT — nợ F-170-T10-2 ĐÃ TRẢ. FULL125 (gap #78 NOMINAL 6.987 s): n=125, p10 1.569,40 s / p90 8.709,20 s; #79 INSIDE [09:40:47Z, 11:39:47Z] neo 09:14:38Z (biên 5.418/1.722 s) → chuỗi dài 6. FULL126 (gap #79 NOMINAL 11.996 s): n=126, p10 1.571,00 s / p90 8.787,50 s; #80 NGOÀI [11:37:16Z, 13:37:32Z] neo 11:11:05Z (muộn 3.209 s) → chuỗi ĐỨT; đối chiếu FULL125 cũng NGOÀI (muộn 10.274 s) — hai dải đồng thuận ở #80.)
3. **(m) #56 VẪN CÓ ĐIỀU KIỆN lần thứ 14 — CHƯA CHỐT?** (7 hướng mới: 6 âm tính + 1 ứng viên 20:17:15Z đã loại (goal-update quote); 20 birth trong D đều thuộc 6 agent đã biết; cửa R 2,56251–2,66817 / J 2,566–2,80753 s VẪN MỞ. Tổng 29 hướng âm tính liên tiếp.)
4. **Mù #96? VẪN MỞ (R không đổi lần thứ bảy); mù #88? VẪN MỞ (hole-recheck lần 15: 337 hit, 0 mới); CERT/FULL GIỮ 76/91: ghi nhận?** (#95?/#94?/#77? giữ nguyên, không có bằng chứng mới.)
5. **F-171-T2-1 (script nặng của T2 trong cửa sổ attempt T4 — attempt3 chồng ~61 s): giao T4-171/T9-171/T10-171 phán ảnh hưởng tới attempt3 không?** (T2 nhận lỗi: không kiểm chain-t4.log trước khi chạy m56-171.py/hole-recheck; T4 đã tự ghi round171-t2 vào danh sách file đổi trong cửa sổ attempt2 + attempt3. Kết quả (m)/INSIDE/mù của T2 không phụ thuộc phép đo của T4.)
6. **F-171-T2-5 (số U file-marks T2-170 5.936 không tái hiện được — đếm lại từ danh sách đợt 170 là 4.461): ghi nhận đính chính?** (Không ảnh hưởng verdict nào — số mốc-giây/gap tái hiện đúng; merged log đợt 170 bị cắt sau mục T, cùng họ SIGPIPE F-170-T2-3.)
