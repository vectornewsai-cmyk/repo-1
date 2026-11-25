# PHASE9 ROUND 170 — T2 (mù #96? theo dõi tiếp + EPERM #88 + INSIDE #77/#78 + (m) #78 đối chiếu độc lập + (m) #79 MỚI + (m) #56 lần thứ mười ba) — LIMITS

**Đợt 170 mở 11:35:51Z 22/11/2026. Hạn cờ ~14:00Z, hạn cứng đóng 14:30Z 22/11. T2 viết ~12:0xZ 22/11.**
**KHÔNG push, KHÔNG release/tag. Chỉ stage 1 file (LIMITS này).**

> **GHI CHÚ ĐỨNG (quyết (e) đợt 165 — nhắc lại, áp dụng cho #74/#75; quyết (e) đợt 166 áp dụng đầy đủ cho #70; quyết (f) đợt 166 + quyết (e) đợt 167 áp dụng cho #71): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Tiền lệ #71: DƯƠNG đã CHẤP NHẬN (quyết (f) đợt 166) với offset btime +41,274 s MẶC DÙ các neo lệch-khung đều DƯỚI dải (21,274 s). Đợt này: (m) #78 DƯƠNG theo btime +40,693 s; các neo lệch-khung TRÁI CHIỀU nhau (28,869 / 29,693 s dưới dải; 58,693 s trên dải) — xem §4.5, caveat ghi rõ cho parent.

## 0. Kết luận trước (headline)

1. **(m) #78 — DƯƠNG (đối chiếu độc lập, DB đọc tươi):** requeue duy nhất trong cửa [09:14:38Z, 09:30:00Z] (mọi job): eid 10027, 09:15:18.693Z = **btime +40,693 s ∈ [33; 49,8]**; viết lại run 169 lần 1; run 169 ĐANG CHẠY tại btime (event-based, đúng 1 run); spanning-bởi-started_at = 0 là artifact viết-lại-tự-loại (như #76). **Nếu parent CHẤP NHẬN: n ứng viên 27→28 / 28→29.**
2. **(m) #79 — KHÔNG PHẢI ĐIỂM (MỚI, trong phiên):** boot 5df1871f, btime 11:11:05Z (T2-170 xác minh 7 nguồn; số hiệu theo đếm tuần tự — chờ T0-170 chứng nhận); requeue duy nhất trong cửa [11:11:05Z, 11:30:00Z]: eid 10054, 11:15:16.007Z = **btime +251,007 s — NGOÀI dải 201,207 s trên biên**; run 169 ĐANG CHẠY tại btime nhưng offset không thuộc dải. **n không đổi vì #79.**
3. **Run 169: SUCCEEDED 11:17:44Z** (eid 10060), wall gốc 9.713 s, **margin 1.087 s** tới hạn 11:35:51Z, claimed→finished **35 s** (NGOÀI họ 6–11 s — ca đầu tiên kể từ 108 s của run 167; xem F-170-T2-7); **2 lần viết lại** (tại #78 +40,693 s; tại #79 +251,007 s); 8 event, 0 event sau succeeded. (Kết cục run 169 thuộc T7-170; T2 chỉ ghi các số DB cần cho (m) #78/#79.)
4. **INSIDE: #77 INSIDE dải FULL123 [07:58:29Z, 09:57:51Z] neo 07:32:23Z** (biên dưới 1.523 s, biên trên 5.639 s) **và #78 INSIDE dải FULL124 [08:49:59Z, 10:49:10Z] neo 08:23:52Z** (biên 1.479/5.672 s) → **CHUỖI MỚI từ #73 TIẾP TỤC, dài 5.** #77 NGOÀI dải FULL122 còn hiệu lực (muộn 1.528 s — cùng mẫu #71); **#78 INSIDE CẢ dải FULL123 còn hiệu lực** (biên 4.569/2.593 s) — lần đầu hai dải đồng thuận. **FULL121/FULL122 KIỂM LẠI ĐỘC LẬP: ĐẠT** (p10/p90 khớp T2-169 bằng hai cách tính mới + giá trị chuỗi — nợ từ §10.5 (ix) aggregate 169 đã trả).
5. **Mù #96? (#64) — VẪN MỞ (theo dõi tiếp, quét tươi + kiểm nội dung đầy đủ):** đoạn R file 1.238 s / union-A 1.222 s / union-B 1.211 s (y hệt T2-164/T2-165/T2-166/T2-167/T2-168/T2-169, không đổi một giây — lần thứ sáu liên tiếp); S ĐÓNG (file 843 s / union-A 662 s / union-B 591 s); T ĐÓNG (file 307 s / union-A 31 s); U ĐÓNG theo union (file max 1.516 s H-U6; union-A max MỚI 1.067 s — xem F-170-T2-10; union-B 860 s). **Kết luận: #96? VẪN MỞ.**
6. **Mù #88? VẪN MỞ — hole-recheck lần thứ MƯỜI BỐN: 337 hit, 0 mốc mới** (y hệt lần 9–13 — 337 hit, không trôi thêm; xem §2.6). **#95?/#94?/#77? giữ nguyên** (không có bằng chứng mới). CERT/FULL chính thức GIỮ 76/91.
7. **(m) #56: KHÔNG thu hẹp được lần thứ MƯỜI BA** (7 hướng — 6 âm tính + 1 hướng birth-time BỊ CHẶN do find không hỗ trợ `-newerBt` trên hệ này, xem F-170-T2-4; ctime scan 351 hit nhưng 0 neo mới — 8 hit sau tường D đều là 18 file session đã biết). Cửa GIỮ NGUYÊN R [2,56251; 2,66817) / J [2,566; 2,80753] s. **#56 VẪN CÓ ĐIỀU KIỆN; n ứng viên GIỮ 27/28 (28/29 nếu #78 được chấp nhận); n chính thức GIỮ 14.**
8. **Lệch khung giờ biên #77/#78/#79 (§4.5): tại #77 KHÔNG có overlap** (0 nội dung boot cũ sau btime); **tại #78 OVERLAP thứ bảy** (poll cuối watcher-169 09:14:49Z, +11 s sau btime, nhãn boot cũ c44cc3ba); **tại #79 KHÔNG có overlap** (dòng sampler-169 cuối 10:54:11Z, −1.014 s). Offset requeue #78 dưới mọi neo TRÁI CHIỀU (btime 40,693 s TRONG dải; /proc/1 28,869 s + poll cuối 29,693 s DƯỚI dải; dòng sampler cuối 58,693 s TRÊN dải) — **caveat ghi rõ, verdict DƯƠNG theo quy tắc đứng btime + tiền lệ #71, parent quyết**.
9. **Reboot #79 MỚI (5df1871f, btime 11:11:05Z) xảy ra 24m46s TRƯỚC khi đợt 170 mở** — T2-170 xác minh 7 nguồn (T0-170 sở hữu xác minh đầy đủ 9 nguồn + chứng nhận số hiệu); gap #78→#79 = 6.987 s (1h56m27s). **#79 viết lại run 169 lần 2** (requeue +251,007 s); **run 169 SUCCEEDED sau đó 11:17:44Z** (margin 1.087 s). Marker sống qua #78 chưa đếm độc lập — giao T0-170 (T0-169 đếm tới #77: 29 reboot #49–#77).
10. **Probe EPERM #89: KHÔNG chạy trong phạm vi T2-170** (brief giao blind spots + (m) + INSIDE, không giao probe; cửa sổ mù neo ở 11:55:00Z giờ quét thay vì probe — xem §5). Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
11. **Jump witness (hoạt động) tại #64–#79: đều = 0 hoạt động thật** (`blind9696-sessions.py`, 328 exec-log có mtime trong cửa sổ). Số đếm mới sau sửa F-169-T2-5 (xem §2.3 + F-170-T2-1/2): #64: 8, #65: 8, #66: 9, #67: 9, #68: 7, #69: 4, #70: 6, #71: 6, #72: 4, #73: 4, #74: 5, #75: 4, #76: 2, #77: 2, #78: 2 (MỚI — 2 log phiên T7-169), #79: 0 (MỚI). Tất cả đều là trích dẫn/artifact, 0 hoạt động thật.

## 1. Điểm (m) #78 + (m) #79 — đối chiếu độc lập từ DB đọc tươi

**Nguồn: T2-170 tự đọc DB qua muse.db (`scheduler.job_runs` + `scheduler.events`, đọc 11:38–11:42Z 22/11 — 8 query: 2 run vcut 168/169 đầy đủ + events 2 run + requeue theo 2 cửa + spanning theo 2 btime (cả started_at lẫn event-based)). run_id đầy đủ `1ad9d142-743a-415e-91c7-5257648dd692` (run_id rút gọn `1ad9d142` trong NOTES T7-169 không query được — phải dùng UUID đầy đủ). Btime #78 lấy từ xác minh 9 nguồn trong phiên của T7-169 (T2-170 đối chiếu events, không xác minh lại btime — btime giờ là lịch sử); btime #79 T2-170 xác minh 7 nguồn (xem §1.3).**

### 1.1 (m) #78 — DƯƠNG

| Hạng mục | Giá trị |
|---|---|
| Btime #78 | 1795338878 = 09:14:38Z 22/11 (boot e298bb52 — T7-169 xác minh 9 nguồn trong phiên) |
| Requeue trong cửa [09:14:38Z, 09:30:00Z] | **Đúng 1 dòng (mọi job): eid 10027, run 169, 09:15:18.693Z = btime +40,693 s ∈ [33; 49,8]** |
| Tất cả event trong cửa | **6 dòng: requeue + dispatched + reattached run 169 (eid 10027/10028/10029); reconciled; dispatched + succeeded heartbeat 09:20:50Z (eid 10031/10032, started 09:15:34Z, jitter −316 s)** |
| Run đang chạy tại btime #78 (event-based, mọi job, không lọc sched) | **Đúng 1 — run 169** (dispatched 08:35:51.105Z, eid 10017; 0 event terminal trước btime) |
| Run spanning btime #78 (theo started_at, 3h trước btime) | **0 dòng — ARTIFACT VIẾT-LẠI-TỰ-LOẠI** (started_at viết lại 09:15:19Z sau btime nên tự loại; verdict dựa trên EVENTS, không dựa trên spanning — như #76) |
| Dispatch / reattach sau requeue | 09:15:19.644Z (+41,644 s) / 09:15:19.705Z (+41,705 s) |
| Viết lại run 169 lần 1 | started_at 1795336551 → 1795338919 (delta 2.368 s); boot_gen đổi thành cron_boot_a85062be473d4ffe8a7c737fef9f2cbc (T7-169) |

**Chữ ký giống #68/#69/#71/#74 (run đang chạy tại btime + 1 requeue duy nhất trong cửa + offset trong dải). T2-170 ĐỒNG Ý DƯƠNG (đối chiếu độc lập với T7-169) — parent quyết cuối (quyết (f) đợt 169 đã hoãn phân loại cho T2-170 + parent).**

### 1.2 (m) #79 — KHÔNG PHẢI ĐIỂM (MỚI)

| Hạng mục | Giá trị |
|---|---|
| Btime #79 | 1795345865 = 11:11:05Z 22/11 (boot 5df1871f — T2-170 xác minh 7 nguồn, xem §1.3) |
| Requeue trong cửa [11:11:05Z, 11:30:00Z] | **Đúng 1 dòng (mọi job): eid 10054, run 169, 11:15:16.007Z = btime +251,007 s — NGOÀI dải 201,207 s trên biên trên** |
| Tất cả event trong cửa | **7 dòng: requeue + dispatched + reattached run 169 (eid 10054/10055/10056); reconciled; dispatched + succeeded heartbeat 11:20:50Z (eid 10058/10059, started 11:15:34Z, jitter −316 s); succeeded run 169 (eid 10060)** |
| Run đang chạy tại btime #79 (event-based, mọi job, không lọc sched) | **Đúng 1 — run 169** (dispatched/reattached 09:15:19Z; 0 event terminal trước btime) |
| Run spanning btime #79 (theo started_at, 3h trước btime) | **0 dòng — ARTIFACT VIẾT-LẠI-TỰ-LOẠI** (started_at viết lại 11:15:16Z sau btime nên tự loại; verdict dựa trên EVENTS, như #78) |
| Dispatch / reattach sau requeue | 11:15:16.127Z (+251,127 s) / 11:15:16.184Z (+251,184 s) |
| Viết lại run 169 lần 2 | started_at 1795338919 → 1795346116 (delta 7.197 s); boot_gen đổi thành cron_boot_82e24f95b2574c1a85d5aa34bf57980e |
| Độ trễ hồi phục sau #79 | **251,007 s so với 40,693 s sau #78 — daemon mất ~6× lâu hơn để requeue** (chỉ ghi nhận, không suy cơ chế; T5-170 sở hữu POSTBOOT_PASS #79 — xem F-170-T2-8) |

**Run 169 ĐANG CHẠY tại btime #79 nhưng offset requeue không thuộc dải → (m) #79 KHÔNG PHẢI ĐIỂM. n không đổi vì #79.**

### 1.3 Reboot #79 — xác minh btime (T2-170, 7 nguồn)

Boot_id 5df1871f-7e19-45e1-a357-1ca4fd89bc33; `/proc/stat` btime 1795345865 = 11:11:05Z; `uptime -s` 11:11:05Z; /proc/1 mtime 11:11:15.986Z (+10,986 s); journal idx 0 duy nhất, first entry 11:11:16Z (+11 s); wtmp begins 11:11:16Z (+11 s); `last` reboot 11:11 still running; `who -b` 11:11. Cloudflare Date 11:39:32 vs local 11:39:31 — chênh 1 s (trong ±1 s). **KHÔNG nghịch lý đồng hồ.** Gap #78→#79 = **6.987 s** (1h56m27s). **#79 xảy ra 24m46s TRƯỚC khi đợt 170 mở (11:35:51Z). Số hiệu #79 theo đếm tuần tự — chờ T0-170 chứng nhận (T2 ghi nhận, không tự chứng nhận).**

### 1.4 Run 169 — kết cục (T2-170 đọc DB tươi; kết cục thuộc T7-170, T2 chỉ ghi số cần cho (m))

**SUCCEEDED 11:17:44Z** (event 11:17:44.354Z, eid 10060), wall từ started gốc 9.713 s, **margin 1.087 s** tới hạn 11:35:51Z, claimed→finished **35 s** (claimed 11:17:09Z — NGOÀI họ 6–11 s, ca đầu tiên kể từ 108 s của run 167; xem F-170-T2-7), attempt 1, **2 lần viết lại** (tại #78 +40,693 s; tại #79 +251,007 s); 8 event đầy đủ, 0 event sau succeeded; worker_execution_timed_out false.

### 1.5 (m) #77 — CHỈ GHI CHÚ THAM CHIẾU (parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM — KHÔNG mở lại)

Quyết (e) đợt 169: **#77 KHÔNG PHẢI ĐIỂM** (0 requeue; run 168 finish 297 s trước btime; run 169 start 719 s sau btime). T2-170 KHÔNG mở lại phân loại — chỉ ghi chú tham chiếu theo giao; kiểm lệch khung §4.5 xác nhận #77 không có overlap.

## 2. Điều tra mù #96? (#64) — THEO DÕI TIẾP (quét tươi + kiểm nội dung đầy đủ)

Mù # = reboot # + 32. #96? = reboot #64, btime 11:15:18Z 21/11/2026. Sàn luật gap: **1.147 s (19'07")** — file max gap hoặc union max gap vượt sàn ⇒ MỞ.

### 2.1 Sự kiện + định nghĩa đoạn

Cửa sổ điều tra: **[11:15:18Z 21/11, 11:55:00Z 22/11] = 88.782 s** (btime #64 → giờ quét T2-170; probe #88 là 08:43:38Z — cửa sổ đợt này KHÔNG neo ở probe vì T2-170 không chạy probe #89, xem §5). Các đoạn, neo bằng btime/probe:

| Đoạn | Cửa sổ | Độ dài | Mốc phải |
|---|---|---|---|
| R | [11:15:18, 11:38:28] 21/11 | 1.390 s | btime #64 (11:15:18Z) → T0-163 lần đầu 11:38:28Z |
| S | [11:38:28, 14:41:28] 21/11 | 10.980 s | T0-163 → probe #82 |
| T | [14:41:28, 16:06:45] 21/11 | 5.117 s | probe #82 → btime #66 |
| U | [16:06:45 21/11, 11:55:00 22/11] | 71.295 s | btime #66 → giờ quét (thuộc #97?/#98?/#99?/#100?/#101?/#102?, chỉ tham chiếu) |

Quét tươi (`blind9696-investigate.py`): repo-1 108 file, hidden_files 3.147, ngoài cây 1.740, /tmp **644**, fifth 15 → merged **2.321 mốc giây duy nhất** (T2-169: 1.969 — tăng 352 do cửa sổ kéo dài tới 11:55:00Z, chủ yếu là file đợt 169/170 trong U). **/tmp = 644 file: toàn bộ là file đợt 170 tạo SAU reboot #79** (tmpfs đã bị #79 xóa sạch rồi tạo lại từ 11:35:51Z; R/S/T /tmp vẫn = 0).

### 2.2 Đồng hồ, reboot #78/#79 (T7-169 + T2-170 đối chiếu)

**Reboot #79 — T2-170 xác minh btime bằng 7 nguồn (xem §1.3; T0-170 sở hữu xác minh đầy đủ 9 nguồn + chứng nhận số hiệu).** Gap #78→#79 = **6.987 s**. **#79 xảy ra 24m46s TRƯỚC khi đợt 170 mở (11:35:51Z).** Marker có sống qua #78 không — CHƯA có đếm độc lập lúc T2 viết (giao T0-170; T0-169 đếm độc lập tới #77: 29 reboot #49–#77).

**Reboot #78 — T7-169 xác minh 9 nguồn trong phiên (T2-170 đối chiếu events):** boot_id e298bb52-ca46-4862-ae2d-a739fbb06da0; btime 1795338878 = 09:14:38Z; uptime -s 09:14:38Z; /proc/1 mtime 09:14:49.824Z (+11,824 s); journal idx 0 duy nhất, first entry 09:14:50Z (+12 s); wtmp begins 09:14:49Z (+11 s); `last` reboot 09:14 still running; `who -b` 09:14; Cloudflare ±1 s. Gap #77→#78 = **3.046 s**. **#78 viết lại run 169 lần 1, requeue +40,693 s TRONG dải → (m) #78 ỨNG VIÊN DƯƠNG** (T7-169; T2-170 đối chiếu độc lập §1.1). **Run 169 SUCCEEDED 11:17:44Z** (xem §1.4) — kết cục thuộc T7-170.

**POSTBOOT_PASS / watcher (T5-170 sở hữu — T2 chỉ ghi nhận):** POSTBOOT_PASS #77 ĐÃ CÓ 08:46:44Z (replay-đầy-đủ, poll=0 — quyết (j) đợt 169); #76 KHÔNG CÓ (boot thứ 13 lọt); #75 còn hiệu lực (mode repair). Watcher-169 (pid 25426, START 08:46:43Z, boot c44cc3ba) CHẾT theo #78 (poll cuối 09:14:49Z — xem §4.5). Watcher-170 thuộc T5-170. **Sampler-169 DỪNG 10:54:11Z** (dòng e298bb52 cuối = btime #79 −1.014 s) — **không có sampler nào đo trong [10:54:11Z, 11:38:04Z] = 2.623 s chứa reboot #79** (sampler-170 dòng đầu 11:38:04Z; caveat cho T9 — xem F-170-T2-6).

### 2.3 Hoạt động từng đoạn (merged log, mốc giây)

| Đoạn | Mốc giây | File-marks | Nhận xét |
|---|---|---|---|
| R [11:15:18, 11:38:28] | 13 | 55 | Hố 1.238 s (xem §2.4) — Y HỆT T2-164/T2-165/T2-166/T2-167/T2-168/T2-169 về hố; 1 file-mark mất do mtime trôi (xem F-170-T2-9) |
| S [11:38:28, 14:41:28] | 249 | 471 | Đóng — hố max y hệt T2-169 (843 s); 7 file-mark mất do mtime trôi |
| T [14:41:28, 16:06:45] | 234 | 667 | Đóng — y hệt T2-169 từng số |
| U [16:06:45, 11:55:00] | 1.825 | 5.936 | Đóng theo union (xem §2.4) — hố file max vẫn 1.516 s (H-U6); 2 hố file MỚI 1.205 s + 1.040 s, đã lấp bằng nội dung |

**Nội dung trong R (55 file-marks, kiểm tay — y hệt T2-164/T2-165/T2-166/T2-167/T2-168/T2-169 trừ 1 file mất):** đầu 11:35:56Z tool-output exec-call agent 5001d1e4; 11:37:30Z tool-output agent 2c32ef43; 11:37:42Z sampler-162 scripts. R-head [11:15:18–11:34:25]: 0/0/0/0/0 mọi scope (trống). R-tail: repo-1=2 / hidden_files=51 / outside=2 / tmp=0 / fifth=0 (T2-169: outside=3 — file mất là exec-log 11:37:51Z, xem F-170-T2-9). **Mốc dpkg 11:35:40Z (TRONG hố R) là mốc nội dung THẬT:** hoạt động dpkg đầu trên #64, 2 dòng "startup packages configure", boot+20m22s — T0-162 quan sát trực tiếp từ dpkg.log #64 (dòng đầu 11:35:40Z; file đã reset theo #65/#66/#67/#68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79, quan sát còn trong T0-162 LIMITS + aggregate 162). Cùng loại với mốc dpkg 08:35:41Z mà T2-162 đã tính cho đoạn N. Được tính vào cả UNION-A lẫn UNION-B. **Không có nguồn độc lập thứ ba cho R-head:** dpkg.log đã reset 15 lần kể từ #64; journal/dmesg chỉ còn boot hiện tại (journal xoay theo boot; dmesg EPERM) — ghi rõ, không giấu. R-head trống hoàn toàn trên mọi scope đo được.

**Nội dung khác (content script, `blind9696-content.py` — số R/S/T khớp T2-169 từng dòng, cộng thêm sampler/watcher-169/170):** sampler-162 (d9a8d1ce) 1 dòng trong R (11:37:42Z, sau hố) + 138 dòng trong S; watcher-162 strict polls 331 trong S (last poll 14:25:20Z — chết sớm, T0-163); watcher-161 linger polls sau btime #64: 0; sampler-163 3 dòng trong S tail + 45 dòng edb2acdb trong U (dòng cuối 16:52:21Z); watcher-163 163 poll trong T + **1 dòng trong U (poll cuối 16:06:54Z — poll đua với reboot #66, 9 s sau btime, nhãn boot cũ 1c1cf10c)**; sampler-164: 28 dòng f1d4ce1a + 107 dòng 0c8a94aa trong U (dòng cuối 19:53:52Z); watcher-164: 52 strict poll trong U (last poll 18:06:41Z — poll đua với reboot #68, 11 s sau btime, nhãn boot cũ f1d4ce1a); sampler-165: 88 dòng 9a1a9319 + 46 dòng d1ddd946 trong U (dòng cuối 22:51:29Z); watcher-165: 164 strict poll trong U (last poll 22:05:31Z — poll đua với reboot #70, 6 s sau btime, nhãn boot cũ 9a1a9319); sampler-166: 30 dòng d1ddd946 + 93 dòng ea73ac4f trong U (dòng cuối 01:41:07Z); watcher-166: 56 strict poll trong U (last poll 00:08:20Z — poll đua với reboot #71, 20 s sau btime, nhãn boot cũ d1ddd946); sampler-167: 88 dòng b643911f + 40 dòng 194efd93 trong U (dòng cuối 04:45:54Z; dòng b643911f cuối 04:05:35Z = btime #74 +6 s — dòng sampler khung cũ sau btime, cùng mẫu OVERLAP); watcher-167: 170 strict poll b643911f trong U (last poll 04:05:41Z — poll đua với reboot #74, 12 s sau btime, nhãn boot cũ b643911f) + 163 strict poll 194efd93 trong U (last poll 05:29:40Z — kết thúc theo lịch, không chết theo #75); sampler-168: 113 dòng 576ca271 + 22 dòng f2b97695 trong U (dòng 576ca271 cuối 07:32:37Z = btime #76 +14 s — dòng sampler khung cũ sau btime, OVERLAP thứ sáu; dòng f2b97695 đầu 07:33:32Z = btime #76 +69 s, cuối 07:54:32Z — sampler dừng ~07:54:32Z); watcher-168: 191 strict poll 576ca271 trong U (last poll 07:32:18Z — CHẾT THEO #76, 5 s TRƯỚC btime, KHÔNG có poll nào sau btime); **sampler-169 MỚI ĐẦY ĐỦ: 33 dòng c44cc3ba + 99 dòng e298bb52 trong U (dòng c44cc3ba cuối 09:14:20Z = btime #78 −18 s; dòng e298bb52 đầu 09:16:09Z = btime #78 +91 s, cuối 10:54:11Z = btime #79 −1.014 s — sampler dừng ~10:54:11Z)**; **watcher-169 MỚI ĐẦY ĐỦ: 57 strict poll c44cc3ba trong U (last poll 09:14:49Z = btime #78 +11 s — poll đua với reboot #78, nhãn boot cũ c44cc3ba — OVERLAP thứ bảy; CHẾT THEO #78)**; **sampler-170 MỚI: 7 dòng 5df1871f trong U (đầu 11:38:04Z = btime #79 +1.619 s — chỉ 7 dòng vì content script chạy ~11:46Z, sampler vẫn đang chạy)**.

**Jump witness (hoạt động) tại #64–#79: đều = 0 hoạt động thật** (`blind9696-sessions.py`, 328 exec-log có mtime trong cửa sổ — tăng từ 296 do thêm log phiên đợt 169/170). Số đếm MỚI sau sửa F-169-T2-5 (xem F-170-T2-1/2 — số đếm đợt 169 theo phương pháp cũ nay đã được tính lại đúng):
- #64 (8 hit — tăng từ 7): 7 hit cũ + proc_c5e207a736ae.log MỚI (log phiên T2-169 trích source hole-recheck9696.py — dòng `lo = ...19:32:59Z` + `hi = ...08:43:38Z` — trích dẫn).
- #65 (8 — tăng từ 7): cùng +1 như #64.
- #66 (9 — tăng từ 8): cùng +1 như #64.
- #67 (9 — tăng từ 8): cùng +1 như #64.
- #68 (7 — tăng từ 6): cùng +1 như #64.
- #69 (4 — tăng từ 3): cùng +1 như #64.
- #70 (6 — tăng từ 5): cùng +1 như #64.
- #71 (6 — tăng từ 5): cùng +1 như #64.
- #72 (4 — tăng từ 3): cùng +1 như #64.
- #73 (4 — tăng từ 3): cùng +1 như #64.
- #74 (5 — tăng từ 4): 4 hit cũ + proc_c5e207a736ae.log MỚI (trích dẫn).
- #75 (4 — tăng từ 3): proc_feb5e6bf35a2.log (trích dẫn, span nay 19:04:44Z 20/11..06:06:02Z 22/11 — max THẬT sau sửa, xem F-170-T2-1) + proc_baa572cf2e1d.log (trích dẫn) + **proc_0212f9ea04ef.log (trích bảng T0-168 — `round167-t10.done` mtime 05:23:51Z + `round168-t0.done` 05:43:32Z — trích dẫn; span nay 05:23:51..05:43:32Z 22/11 — ĐÚNG sau khi sửa lỗi "9/9", xem F-170-T2-2)** + proc_c5e207a736ae.log MỚI (trích dẫn). **0 hoạt động VM thật bắc qua btime #75.**
- #76 (2 — tăng từ 1): proc_c5e207a736ae.log MỚI (trích dẫn) + **proc_2b01faab0744.log MỚI** (log phiên T1-169 trích dải sampler-168/169 — "first 05:46:35Z last 07:54:32Z" + "first 08:42:19Z last 08:43:19Z" — trích dẫn). proc_feb5e6bf35a2.log và proc_a83a889ce05b.log ĐÃ RƠI RA sau sửa F-170-T2-1 (span thật của chúng kết thúc 06:06:02Z 22/11 / 20:22:43Z 20/11 — không bắc qua #76). **0 hoạt động thật bắc qua btime #76.**
- #77 (2 — tăng từ 1): cùng 2 file như #76 (trích dẫn). **0 hoạt động thật bắc qua btime #77.**
- **#78 (2 hit — MỚI):** proc_7e7f36045583.log (log phiên T7-169: trích dòng sampler-169 09:42:10Z + dòng "SPIKE 08:49:06Z" — trích dẫn; session chạy xuyên reboot) + proc_6b03cdc0bb27.log (log phiên T7-169: trích dòng sampler-169 10:07:10Z + dòng "SPIKE 08:49:41Z" — trích dẫn; session chạy xuyên reboot). **0 hoạt động VM thật bắc qua btime #78.**
- **#79 (0 hit — MỚI):** không một exec-log nào có content span bắc qua btime #79 sau khi sửa F-170-T2-1 (2 file cũ feb5e6bf35a2/a83a889ce05b đã rơi ra — span thật kết thúc trước btime). **0 hoạt động thật bắc qua btime #79.**
- Exec-log content-ts trong hố R union (11:15:29–11:35:40): 4 hit, 0 mốc hoạt động: 11:16:22Z ×4 (trích biên hố H-R1-old — 3 hit cũ + proc_c5e207a736ae.log trích dòng hole-recheck của T2-169) — y hệt T2-169 về bản chất.
- Exec-log content-ts trong hố U file max MỚI H-U6 (06:56:58–07:22:14): **0 hit, 0 mốc hoạt động** (hố nằm trong phiên T7-168 — sau harness 06:39:13Z, trước khi sleep #5 spawn 07:22:24Z; được lấp đầy bởi mốc nội dung sampler-168 576ca271 mỗi 60 s → union-A max vẫn 1.067 s ở nơi khác).

### 2.4 Mốc merged + verdict (luật gap, sàn 1.147 s)

| Đoạn | File max gap | Union-A max gap | Union-B max gap | Verdict |
|---|---|---|---|---|
| **R** | **1.238 s** (11:15:18 → 11:35:56) | **1.222 s** (11:15:18 → 11:35:40) | **1.211 s** (11:15:29 → 11:35:40) | **MỞ (y hệt T2-169 — lần thứ sáu liên tiếp không đổi)** |
| S | 843 s | 662 s | 591 s | ĐÓNG |
| T | 307 s | 31 s | — | ĐÓNG |
| U | **1.516 s** (06:56:58 → 07:22:14, H-U6) | **1.067 s** (08:20:37 → 08:38:24, MỚI) | **860 s** | ĐÓNG theo union (tham chiếu) |

Union-A = mốc file + mốc nội dung (dpkg 11:35:40Z); Union-B = Union-A + mốc hệ thống trước btime (11:15:29Z) + mốc đầu boot #71 (00:08:16Z) + #72 (02:05:17Z) + #73 (02:28:13Z) + #74 (04:05:44Z) + #75 (05:32:57Z) + #76 (07:32:34Z) + #77 (08:24:04Z) + **#78 (09:14:50Z — MỚI, T7-169 trực tiếp)** + **#79 (11:11:16Z — MỚI, T2-170 trực tiếp)**. **R: mọi cách đếm đều MỞ — y hệt T2-169 từng giây (lần thứ sáu liên tiếp không đổi).** Biến thể +dispatch 11:35:51Z (DB, không tính vào union chính): 1.211 s — cũng MỞ.

**U — union-A max MỚI 1.067 s (08:20:37→08:38:24, tăng từ 926 s):** hố nằm trước khi đợt 169 mở (08:35:51Z) — khoảng yên giữa T0-169/T1-169 chuẩn bị và dispatch; không có sampler/watcher nào chạy trong hố (sampler-168 dừng 07:54:32Z; sampler-169 bắt đầu 08:42:19Z; watcher-168 chết 07:32:18Z; watcher-169 bắt đầu 08:46:43Z). Được chia nhỏ bởi mốc hệ thống #77 (08:24:04Z) → union-B max 860 s. **ĐÓNG theo union.** Hố file max H-U6 (1.516 s) vẫn còn trong danh sách file-gap (đứng đầu); hố file MỚI H-U7 1.205 s (10:08:01→10:28:06) + H-U8 1.040 s (10:36:11→10:53:31) — cả hai đều được lấp đầy bởi mốc nội dung sampler-169 e298bb52 mỗi 60 s (T7-169 ngủ giữa các lần đọc). Union-B max vẫn là 860 s (08:24:04→08:38:24). U chỉ tham chiếu cho #96? — không đổi verdict R.

S khớp T2-169 về file (843 s), union-A (662 s) và union-B (591 s) — S ổn định hoàn toàn (249 mốc giây / 471 file-marks — 7 file-mark mất do mtime trôi, hố max không đổi). T đóng chắc (31 s).

**Kết luận đầy đủ: #96? VẪN MỞ qua đoạn R. Quét tươi + kiểm nội dung + sessions + hole-recheck đều đã chạy đầy đủ đợt này và xác nhận lại từng số của T2-169 (R/S/T không đổi một giây; U union-A/B tăng nhẹ 926→1.067 s / 814→860 s nhưng vẫn ĐÓNG).**

### 2.5 CERT/FULL ứng viên + INSIDE

**CERT/FULL chính thức GIỮ 76/91** (quyết (b) đợt 164, giữ theo quyết (m) đợt 165, quyết (m) đợt 166, quyết (m) đợt 167, quyết (m) đợt 168 và quyết (m) đợt 169; #95?/#94?/#77? vẫn mở). Gap #63 = 9.073 s cho ứng viên CERT95/FULL110.

**FULL121/FULL122 KIỂM LẠI ĐỘC LẬP — ĐẠT (nợ từ §10.5 (ix) aggregate 169, đã trả):** (a) danh sách: FULL121 = FULL120 + [5.848] ✓; FULL122 = FULL121 + [7.177] ✓; (b) `statistics.quantiles` method='inclusive' VÀ (c) nội suy chỉ số-sắp xếp viết mới đều cho **FULL121 p10/p90 1.563,00/8.748,00 s** và **FULL122 p10/p90 1.564,60/8.738,30 s** — KHỚP giá trị T2-169 đã in VÀ giá trị chuỗi s121/s122. T2-170 đã kiểm lại phép tính dải FULL121/FULL122 độc lập như parent giao.

**FULL123** (gap #76 NOMINAL 3.089 s, CÓ ĐIỀU KIỆN): n=123, mean 1h39'37", median 1h53'00", p10 0h26'06" (1.566,20 s), p90 2h25'29" (8.728,60 s), sd 0h55'28", min 0h00'55", max 5h43'18"; trong 90–150'=66, <60'=29, >180'=8, >240'=3.
**FULL124** (gap #77 NOMINAL 3.046 s, CÓ ĐIỀU KIỆN): n=124, mean 1h39'13", median 1h51'50", p10 0h26'08" (1.567,80 s), p90 2h25'19" (8.718,90 s), sd 0h55'25", min 0h00'55", max 5h43'18"; trong 90–150'=66, <60'=30, >180'=8, >240'=3.
**FULL120/FULL121/FULL122 kiểm lại:** p10/p90 KHỚP T2-169 từng số (FULL120 1.555,20/8.755,90 s — đã kiểm đợt 169; FULL121 1.563,00/8.748,00 s; FULL122 1.564,60/8.738,30 s — script có assert, không trôi chuỗi).

Tốc độ reboot: tới #77: 153 reboot / 276,10 h = 1 lần / 108,3 phút; tới #78: 154 reboot / 276,94 h = 1 lần / 107,9 phút; tới #79: 155 reboot / 278,88 h = 1 lần / 108,0 phút.

**INSIDE:**
- **#77 INSIDE dải FULL123 [07:58:29Z, 09:57:51Z] neo 07:32:23Z** (biên dưới 1.523 s, biên trên 5.639 s; biên trên chính xác 5.639,6 s) → **chuỗi MỚI từ #73 tiếp tục, dài 4.**
- Đối chiếu vs dải còn hiệu lực: #77 NGOÀI dải FULL122 [05:58:50Z, 07:58:24Z] neo 05:32:46Z (muộn 1.528 s; chính xác 1.527,7 s) — **hai dải KHÔNG đồng thuận (cùng mẫu #71: INSIDE dải phương pháp nhưng NGOÀI dải còn hiệu lực — xem caveat dưới).**
- **#78 INSIDE dải FULL124 [08:49:59Z, 10:49:10Z] neo 08:23:52Z** (biên dưới 1.479 s, biên trên 5.672 s; biên trên chính xác 5.672,9 s) → **chuỗi MỚI từ #73 tiếp tục, dài 5.**
- Đối chiếu vs dải còn hiệu lực: **#78 INSIDE CẢ dải FULL123 [07:58:29Z, 09:57:51Z] neo 07:32:23Z** (biên dưới 4.569 s, biên trên 2.593 s; biên trên chính xác 2.593,6 s) — **hai dải ĐỒNG THUẬN — lần đầu tiên kể từ khi chuỗi mới bắt đầu (#74/#75/#76/#77 đều mâu thuẫn dải còn hiệu lực).**
- **Caveat (ghi rõ, parent quyết):** theo dải PHƯƠNG PHÁP (F-165-T2-1: dải cho #k là FULL(110+k−64) neo btime #(k−1)), #77 và #78 đều INSIDE → chuỗi mới từ #73 dài 5. Theo dải CÒN HIỆU LỰC, #77 NGOÀI (muộn 1.528 s) nhưng #78 INSIDE. Tiền lệ #71: INSIDE FULL117 nhưng NGOÀI FULL116 muộn 5.521,5 s — chuỗi vẫn được tính tiếp tục theo dải phương pháp (FULL118→#72, FULL119→#73 đã tính; chuỗi chỉ ĐỨT tại #73 theo FULL119, quyết (c) đợt 167). T2-170 áp dụng cùng tiền lệ: **chuỗi tiếp tục dài 5 theo phương pháp; mâu thuẫn với dải còn hiệu lực ở #77 được ghi rõ để parent quyết** — T2 không tự chốt khi hai dải mâu thuẫn ở #77 (dù #78 đồng thuận cả hai).
- **Nhãn dải — kiểm lại đúng phương pháp (bài học F-165-T2-1):** #77 kiểm theo FULL123 neo btime #76 (mẫu FULL112→#66 … FULL122→#76 ⇒ FULL123→#77, FULL124→#78; mỗi dải gồm gap kết thúc tại neo của nó). FULL122 chỉ là dải đối chiếu còn hiệu lực cho #77, FULL123 chỉ là dải đối chiếu còn hiệu lực cho #78 — KHÔNG phải dải phương pháp.

### 2.6 Hole-recheck

`hole-recheck9696.py`: find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp [19:32:59Z 20/11, 11:55:00Z 22/11]: **10.974 file**. Find stderr: 1 dòng — `/home/hatch/.stagged-uploads: Permission denied` (giới hạn đứng, thư mục mode 0000). **KIỂM TRƯỚC KHI CHẠY (bài học F-166-T2-2): `grep ^W =` → round170-t2 ✓; `grep ^hi =` → 11:55:00Z 22/11 ✓; KHÔNG dùng `#` làm delimiter; output vào thư mục RIÊNG round170-t2 (file MỚI `holerecheck-all.txt`, KHÔNG ghi đè file cũ). File `round169-t2/holerecheck-all.txt` md5 KHÔNG ĐỔI sau lần chạy (de57b144… — kiểm lại sau khi chạy).**

| Hố | Kết quả |
|---|---|
| H-R1 (11:15:18, 11:35:56) | **0 hit — 0 mốc mới** |
| H-R1-old (11:16:22, 11:35:35) | 0 hit |
| H-S1/H-S2/H-S3/H-T1/H-U1/H-U4 | mỗi hố 1 float-trap (cùng giây cạnh trái), 0 mới |
| H-U2 (17:20:48, 17:36:14 — bắc qua btime #67) | 1 inside = 1 trap (cạnh trái 17:20:48.627Z), 0 mới |
| H-U2-old (17:22:25, 17:35:37) | 0 hit |
| H-U3 (19:37:11, 19:49:46) | 10 inside = 10 trap (cùng giây 19:37:11, file stall T8-164), 0 mới |
| H-U5 (22:09:05, 22:32:32) | 1 inside = 1 trap (cạnh trái 22:09:05.886Z, proc_5c237211ba31.log), 0 mới |
| H-U6 (06:56:58, 07:22:14) | 1 inside = 1 trap (cạnh trái 06:56:58.721Z, proc_0a160336a16d.log), 0 mới |
| **H-U7 MỚI (10:08:01, 10:28:06)** | **1 inside = 1 trap (cạnh trái 10:08:01.145Z, proc_6b03cdc0bb27.log), 0 mới** |
| **H-U8 MỚI (10:36:11, 10:53:31)** | **1 inside = 1 trap (cạnh trái 10:36:11.214Z, context.md), 0 mới** |
| H-E1-88 (19:32:59Z, 20:17:30Z) | **337 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI — lần thứ MƯỜI BỐN liên tiếp 0 mốc mới** |

Known base: 2.321 mốc giây đợt này; base #88? T2-157: 557 giây. **H-E1-88 giữ 337 hit — y hệt lần 9/lần 10/lần 11/lần 12/lần 13, không trôi thêm** (lần 13 giảm 345 → 337 do 8 exec-log mtime trôi; đợt này 0 file trôi thêm trong hố #88?).

### 2.7 Verdict mù (tổng hợp)

| Mù | Verdict đợt 170 | Cơ sở |
|---|---|---|
| #96? (#64) | **VẪN MỞ** (R 1.238/1.222/1.211 s vượt sàn; S/T đóng; U đóng theo union) | Quét tươi + kiểm nội dung đầy đủ, số R/S/T y hệt T2-169 (U union-A/B tăng nhẹ nhưng vẫn đóng) |
| #95? (#63) | **MỞ** (giữ nguyên quyết (b) đợt 164) | Không có bằng chứng mới |
| #94? (#62) | **MỞ** (giữ nguyên) | Không có bằng chứng mới |
| #88? | **VẪN MỞ** (lần thứ 14: 337 hit, 0 mới) | Hole-recheck §2.6 |
| #77? | **VẪN MỞ** (giữ nguyên) | Không có bằng chứng mới |

**CERT/FULL chính thức GIỮ 76/91** (vì #77?/#88?/#94?/#95? vẫn mở; #96? VẪN MỞ — chưa đổi được khi chưa chứng nhận theo thứ tự).

## 3. Mù #88?/#77?/#95?/#94? — giữ nguyên

Mù #88? VẪN MỞ (lần thứ 14, §2.6: 337 hit, 0 mốc mới — y hệt lần 9–13). **#95?/#94?/#77? GIỮ NGUYÊN, không đổi** — không có bằng chứng mới đợt này. **CERT/FULL chính thức GIỮ 76/91.** T2 không tự đóng/mở bất kỳ mù nào — parent quyết.

## 4. Mô hình đồng hồ + điểm (m)

### 4.1 Điểm (m) #56 — thu hẹp lần thứ MƯỜI BA: 7 hướng MỚI, 6 âm tính + 1 bị chặn

Cửa GIỮ NGUYÊN: **R [2,56251; 2,66817) s / J [2,566; 2,80753] s** (T2-168, §4.1). **#56 VẪN CÓ ĐIỀU KIỆN; KHÔNG chốt n=15.** Các hướng đã thử đợt này (`m56-170.py`, epoch cửa D [19:04:44Z, 20:22:43Z] 20/11 đã kiểm độc lập):

| Hướng (đợt 170) | Kết quả |
|---|---|
| (i) wtmp/btmp đã xoay (`/var/log/wtmp.*`, `btmp*`) + `last`/`lastb` trên file xoay | **0 file xoay tồn tại** (chỉ có wtmp sống 384 B + btmp sống 0 B, cả hai mtime 11:11:16Z 22/11 — boot #79); `last -f wtmp -t 20261120202243` chỉ còn dòng "wtmp begins Nov 22" — **0 bản ghi ngày 20/11** |
| (ii) journal bền vững `/var/log/journal/<machine-id>/` — inventory + `journalctl --list-boots` | **Chỉ 1 file `system.journal` 8 MB, mtime 11:50:36Z 22/11; `--list-boots` chỉ có boot #79** — không có journal lưu trữ của boot ngày 20/11 |
| (iii) shell history (`~/.bash_history`, `~/.zsh_history`, fish history, `/root/.bash_history`) | **TẤT CẢ MISSING** — không có file history nào trên VM này |
| (iv) `/var/log/apt/history.log*` + `term.log*` (kể cả .gz, zgrep) | **0 dòng Start-Date 19:xx/20:xx ngày 20/11** (history.log 38.180 B, term.log 83.262 B) |
| (v) quét BIRTH-time (`find -newerBt`) trên /home/hatch + /var/log + /etc + /opt + /srv | **BỊ CHẶN — find không hỗ trợ `-newerBt` trên hệ này** ("This system does not provide a way to find the birth time of a file") — xem F-170-T2-4; stat birth từng file đã thử trên 3 file then chốt đợt 169, 0 thu hẹp |
| (vi) dpkg log đã xoay sau `.1` (`dpkg.log.2.gz` trở về trước) | **Không có file nào** — chỉ tồn tại `/var/log/dpkg.log` sống; không có gì để zgrep |
| (vii) quét CTIME (`find -newerct`) trên cùng 5 cây | **351 hit trong D — nhưng 0 neo mới:** max ctime 20:19:34.327Z (sessions.json agent 964f2bc4); 8 hit sau tường D 20:16:36.699Z đều là 18 file session đã biết (6fc7dd16/af13c1c2/964f2bc4 — af13c1c2/964f2bc4 đã phân loại E từ đợt 157); **0 hit có mtime NGOÀI D** (không file cũ nào bị chạm metadata trong D); ctime 20:16:36.700Z của sessions.json chỉ hơn mtime tường 0,001 s (cùng sự kiện tạo file) — **không thu hẹp** |

**Đợt 169 (đối chiếu — 5 hướng cũ đều âm tính):** (i) find fifth-scope + dot-config trong cửa D — đúng 18 file session đã biết; (ii) stat birth/ctime 3 file + session 6fc7dd16 — 0 thu hẹp; (iii) syslog family — TẤT CẢ MISSING; (iv) /boot + /var/log inventory — 0 file; (v) grep 20:16:37–40 — 1 file trích dẫn. Đợt này thêm 7 hướng MỚI — tổng 22 hướng âm tính liên tiếp (15 hướng đợt 167/168/169 + 7 hướng đợt này, chưa kể các hướng đợt 158–166; hướng (v) đợt này bị chặn do công cụ, không tính là âm tính). **Cửa R/J GIỮ NGUYÊN; không có mốc mới nào để thu hẹp.**

### 4.2 Điểm (m) #78 — DƯƠNG (đối chiếu độc lập — xem §1.1)

Tóm tắt: requeue eid 10027 09:15:18.693Z = btime +40,693 s ∈ [33; 49,8]; 1 requeue duy nhất trong cửa; run 169 đang chạy tại btime (event-based); spanning 0 là artifact. **T2-170 ĐỒNG Ý DƯƠNG — parent quyết cuối.**

### 4.3 Điểm (m) #79 — KHÔNG PHẢI ĐIỂM (xem §1.2)

Tóm tắt: requeue eid 10054 11:15:16.007Z = btime +251,007 s — ngoài dải 201,207 s trên biên; 1 requeue duy nhất trong cửa; run 169 đang chạy tại btime nhưng offset không thuộc dải. **n không đổi vì #79.**

### 4.4 Reboot #79 — xác nhận bổ sung (T2-170 + T0-170)

Xem §1.3. T2-170 xác minh btime #79 bằng 7 nguồn (không có `last` đầy đủ chi tiết boot cũ — giao T0-170 xác minh đầy đủ 9 nguồn + chứng nhận số hiệu). Parent đã XÁC NHẬN số hiệu #77/#78 ở quyết (d) đợt 169; **số hiệu #79 thuộc T0-170 chứng nhận — T2 ghi nhận, không tự chứng nhận.**

### 4.5 Lệch khung giờ biên #77/#78/#79 — #77 KHÔNG OVERLAP; #78 OVERLAP (thứ bảy); #79 KHÔNG OVERLAP

**Bằng chứng (T5-169 + T7-169 + T9-169 + T2-170 kiểm trực tiếp từ `round169-t5/replay-watch-169.log`, `round169-t9/ram-sampler.log` và `round170-t9/ram-sampler.log`):**

| Bằng chứng | Giá trị | Offset so với btime |
|---|---|---|
| **Biên #77 (btime 08:23:52Z):** | | |
| Nội dung boot cũ sau btime #77 | **0 dòng** (sampler-168 dòng 576ca271 cuối 07:32:37Z; watcher-168 poll cuối 07:32:18Z; sampler-169 dòng đầu 08:42:19Z) | — |
| /proc/1 mtime (boot mới) | 08:24:03.990Z | +11,990 s |
| journal first entry (boot mới) | 08:24:04Z | +12 s |
| wtmp begins (boot mới) | 08:24:04Z | +12 s |
| **Biên #78 (btime 09:14:38Z):** | | |
| Poll cuối watcher-169 | **09:14:49Z** | **+11 s** (OVERLAP — nhãn boot cũ c44cc3ba; poll trước 09:14:18Z, −20 s) |
| Dòng sampler-169 cuối c44cc3ba | **09:14:20Z** | **−18 s** (không có dòng boot cũ sau btime từ sampler) |
| Dòng sampler-169 đầu e298bb52 | 09:16:09Z | +91 s |
| /proc/1 mtime (boot mới) | **09:14:49.824Z** | **+11,824 s** (T7-169) |
| journal first entry (boot mới) | 09:14:50Z | +12 s |
| wtmp begins (boot mới) | 09:14:49Z | +11 s |
| **Biên #79 (btime 11:11:05Z):** | | |
| Dòng sampler-169 cuối e298bb52 | **10:54:11Z** | **−1.014 s** (sampler dừng 10:54:11Z; không có sampler nào sau đó tới 11:38:04Z) |
| Poll watcher-169 | **không có** (chết theo #78) | — |
| Dòng sampler-170 đầu 5df1871f | 11:38:04Z | +1.619 s |
| /proc/1 mtime (boot mới) | 11:11:15.986Z | +10,986 s |
| journal first entry (boot mới) | 11:11:16Z | +11 s |
| wtmp begins (boot mới) | 11:11:16Z | +11 s |

**Tại #77: KHÔNG CÓ OVERLAP** — không một dòng nội dung boot cũ nào sau btime #77; bằng chứng khung mới đến ngay sau btime (+12 s) và không có gì mâu thuẫn. Không có vấn đề lệch khung tại #77.

**Tại #78: OVERLAP (thứ bảy — sau #62: 824 s, #68: ≥11 s, #70: ≥6 s, #71: 20 s, #73/#74: 12 s, #76: 14 s).** Khác #76 (bằng chứng khung mới +11,062 s đến TRƯỚC dòng boot cũ cuối +14 s — khoảng neo "thật" RỖNG): tại #78, bằng chứng khung mới (/proc/1 +11,824 s) đến **SAU** poll cuối khung cũ (+11 s) 0,824 s — **khoảng neo "thật" [11 s, 11,824 s] KHÔNG RỖNG nhưng chỉ rộng 0,824 s** (so với #74: 3,575 s). Offset requeue theo các neo: **btime 40,693 s — TRONG dải**; /proc/1 28,869 s — DƯỚI dải; poll cuối khung cũ 29,693 s — DƯỚI dải; dòng sampler cuối khung cũ 58,693 s — TRÊN dải. **Các neo TRÁI CHIỀU nhau (khác #74: neo khung cũ 34,242 s đồng thuận với btime; khác #71: các neo đều dưới dải nhưng điểm vẫn được chấp nhận).**

**Phán: OVERLAP thứ bảy tại #78; KHÔNG OVERLAP tại #77/#79. Theo quy tắc đứng (dải (m) định nghĩa theo offset btime-tương đối; dữ kiện khung cũ không đổi verdict) + tiền lệ #71 (các neo dưới dải nhưng điểm DƯƠNG vẫn được chấp nhận), (m) #78 giữ verdict DƯƠNG theo btime +40,693 s — T2-170 chỉ phán theo quy tắc đứng, parent quyết cuối; caveat các neo trái chiều được ghi rõ ở đây (xem F-170-T2-5).**

### 4.6 Nhãn n (tổng hợp)

- **n chính thức: GIỮ 14** (parent quyết; T2 không tự đổi).
- n ứng viên (nhánh khuyến nghị): **GIỮ 27** (24 dương + 3 âm — #74 đã CHẤP NHẬN theo quyết (f) đợt 168; #75/#76/#77 KHÔNG PHẢI ĐIỂM; #79 KHÔNG PHẢI ĐIỂM — n không đổi vì #79; **#78 CHỜ parent quyết — nếu CHẤP NHẬN DƯƠNG: 27→28**).
- n ứng viên (nhánh #56 ÂM): **GIỮ 28** (24 dương + 4 âm — #56; **nếu #78 được chấp nhận: 28→29**).
- #56 vẫn CÓ ĐIỀU KIỆN (§4.1) — KHÔNG chốt n=15.
- #78 DƯƠNG (chờ parent) — n đổi chỉ khi parent chấp nhận; #79 KHÔNG PHẢI ĐIỂM — n không đổi vì #79.

## 5. Probe EPERM #89 — KHÔNG CHẠY (ngoài phạm vi brief T2-170)

Brief T2-170 giao: blind spots + (m) + INSIDE (+ hole-recheck + (m) #56 + lệch khung). **Không giao chạy probe EPERM.** T2-170 KHÔNG chạy `probe-eperm-v2.sh` đợt này; cửa sổ điều tra mù neo ở **11:55:00Z giờ quét** thay vì một probe mới. Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11 (~261 h trước probe #88). Nếu parent muốn khôi phục nhịp probe mỗi đợt, giao lại cho T2-171.

## 6. Phương pháp, sai số của T2, câu hỏi cho parent

### 6.1 Phương pháp (tóm tắt — script trong `~/workspace/goals/capcut-clone-video-editor/hidden_files/round170-t2/`)

- (m): `m-check170.py` (epoch số học + đếm requeue theo cửa — DB đọc tươi qua muse.db, 8 query) + đối chiếu 3 nguồn (§1.1/§1.2) / tham chiếu (§1.5); `m56-170.py` (7 hướng mới).
- INSIDE: `blind9696-gaps170.py` (FULL123/FULL124, p10/p90 theo đúng phương pháp các đợt trước; kiểm lại FULL121/FULL122 độc lập bằng hai cách tính mới + đối chiếu FULL122/FULL123 còn hiệu lực; reboot rate).
- Mù: `blind9696-investigate.py` (5 scope, mtime float, merge — cửa sổ tới 11:55:00Z), `blind9696-content.py` (kiểm nội dung sampler/watcher từng đoạn + union-A/B — thêm sampler-169 đầy đủ, watcher-169, sampler-170, SYS78/SYS79), `blind9696-sessions.py` (jump witness + DD/MM carry-over, xem F-170-T2-1/2), `blind9696-merged.py` (gap file/union-A/union-B), `hole-recheck9696.py` (find toàn cây + float-trap — thêm H-U7/H-U8; file MỚI, không ghi đè file cũ).
- **Caveat quét mù (F-170-T2-11):** B1 = 11:55:00Z là mốc cắt cố định; vòng walk kết thúc ~11:44:40Z nên các mốc U trong (11:44:40Z, 11:55:00Z] có thể thiếu — U chỉ tham chiếu, không ảnh hưởng verdict (hố max U kết thúc 07:22:14Z).

### 6.2 Sai số của T2 đợt này (F-170-T2-*)

**F-170-T2-1 (sửa F-169-T2-5 chưa đủ — bare-time cùng dòng DD/MM vẫn sai ngày khi lặp lại ở dòng khác — ĐÃ SỬA BẰNG CARRY-OVER):** hướng sửa F-169-T2-5 (fallback thử pattern DD/MM trong CÙNG DÒNG) đã áp dụng, nhưng `proc_feb5e6bf35a2.log` dòng 12 lặp lại bare-time "20:16:40" mà KHÔNG có ngày trên dòng (dòng 11 có "20/11", dòng 12 không) nên vẫn gán sai 22/11. T2-170 bổ sung **carry-over: ngày tường minh gần nhất đã thấy TRƯỚC ĐÓ trong file** (full ISO hoặc DD/MM) được dùng cho bare-time không có ngày trên dòng. Kết quả: max thật của feb5e6bf35a2.log nay là **06:06:02Z 22/11** (full ISO duy nhất muộn nhất — đúng mtime file); file này nay chỉ span #64–#75 (trước đây span giả tới #79); `proc_a83a889ce05b.log` nay span 19:04:44..20:22:43Z **20/11** (toàn bộ nội dung là trích m56 script cửa D) — không span btime nào. Số đếm jump-witness thay đổi theo (xem §2.3) — verdict 0 hoạt động thật không đổi.

**F-170-T2-2 (false positive DD/MM "9/9 nguồn" — ĐÃ SỬA BẰNG WINDOW GUARD):** pattern DD/MM bắt nhầm điểm số "9/9" trong dòng "boot #75 9/9 nguồn" của `proc_0212f9ea04ef.log` (9/9 nguồn = 9 trên 9 nguồn, KHÔNG phải ngày 9/9) — làm bare-time 05:23:51Z/05:43:32Z (22/11 thật) bị gán sai 2026-09-09, khiến file rơi khỏi danh sách span #75. T2-170 thêm **window guard: chỉ chấp nhận DD/MM trong cửa sổ điều tra 2026-11-20..22** (cả same-line lẫn carry-over). Kết quả: span thật của file nay là **05:23:51..05:43:32Z 22/11** — trở lại danh sách span #75 như T2-169 (đúng). Bài học: pattern ngày DD/MM luôn cần guard chống điểm số "N/M".

**F-170-T2-3 (lỗi pipe của chính T2 — bắt và chạy lại trước khi viết LIMITS):** lần chạy `blind9696-sessions.py` đầu tiên pipe qua `tee | head -75` — `head` đóng pipe sớm gây SIGPIPE, stdout log chỉ còn 107 dòng (dừng ở #75); file `sessions-9696.txt` vẫn được ghi đầy đủ (134 dòng) vì script ghi file trước khi chết. Đã chạy lại với redirect trực tiếp (`> file 2>&1`, exit 0, log 144 dòng đầy đủ). LIMITS dùng lần chạy thứ hai; số đếm hai lần chạy KHỚP nhau ở các mục đã in (chỉ khác do code carry-over/window-guard thay đổi giữa hai lần chạy — xem F-170-T2-1/2).

**F-170-T2-4 (hướng (v) (m) #56 bị chặn do công cụ — KHÔNG phải 0 file):** `find -newerBt` không được hỗ trợ trên hệ này ("This system does not provide a way to find the birth time of a file") — quét birth-time toàn cây KHÔNG chạy được. Ghi rõ là BỊ CHẶN, không claim 0 file sinh trong D. Stat birth từng file đã thử trên 3 file then chốt đợt 169 (0 thu hẹp). Hướng thay thế cho T2-171: `stat` birth theo danh sách file rút gọn (không quét toàn cây bằng find).

**F-170-T2-5 (caveat lệch khung (m) #78 — các neo TRÁI CHIỀU, xem §4.5):** offset requeue #78 theo btime TRONG dải (40,693 s) nhưng theo /proc/1 (28,869 s) và poll cuối khung cũ (29,693 s) DƯỚI dải, theo dòng sampler cuối khung cũ (58,693 s) TRÊN dải. Khác #74 (neo khung cũ đồng thuận) và #71 (các neo đều dưới dải). T2-170 phán DƯƠNG theo quy tắc đứng + tiền lệ #71, parent quyết cuối — caveat ghi rõ, không giấu.

**F-170-T2-6 (sampler-169 dừng 10:54:11Z — khoảng không-sampler chứa #79):** không có mẫu RAM nào trong [10:54:11Z, 11:38:04Z] = 2.623 s chứa reboot #79 (sampler-169 dừng trước khi T9-169 đóng; sampler-170 bắt đầu 11:38:04Z). Peak RAM / headroom / ENOSPC trong khoảng này là cận dưới — caveat cho T9-170 (T2 không đo RAM đợt này).

**F-170-T2-7 (run 169 claimed→finished 35 s — ngoài họ 6–11 s):** claimed 11:17:09Z → finished 11:17:44Z = 35 s (run 168: 7 s; họ 6–11 s từ đợt 150). Ca 35 s đầu tiên kể từ ca 108 s của run 167 (lớn nhất tới nay). Chỉ ghi nhận — kết cục run 169 thuộc T7-170, T2 không suy cơ chế. Margin run 169 vẫn hẹp: 1.087 s (run 168: 1.016 s).

**F-170-T2-8 (độ trễ requeue sau #79 gấp ~6× sau #78):** requeue #79 +251,007 s so với +40,693 s sau #78. Daemon hồi phục chậm bất thường sau #79 (HB 11:20:50Z dispatch 11:15:34Z — daemon đã lên 18 s sau requeue). Chỉ ghi nhận, không suy cơ chế — T5-170 sở hữu POSTBOOT_PASS #79.

**F-170-T2-9 (mtime trôi làm mất file-mark R/S — hố max không đổi):** R mất 1 file-mark (exec-log 11:37:51Z `proc_d322f62a856f.log` — file bị ghi đè sau, mtime trôi khỏi R; R-tail outside 3→2); S mất 7 file-mark (5 exec-log 11:38:40–11:42:17Z + 2 file feed staging 11:42:17Z). Hố max R/S/T không đổi một giây — drift chỉ làm mất mốc đuôi, không tạo mốc mới trong hố (cùng họ F-167-T2-3).

**F-170-T2-10 (U union-A max tăng 926 → 1.067 s — vẫn ĐÓNG):** hố union-A mới 08:20:37→08:38:24 (khoảng yên trước dispatch đợt 169 — không sampler/watcher nào chạy); union-B max 814 → 860 s (nhờ mốc #77). Cả hai vẫn dưới sàn 1.147 s. U chỉ tham chiếu — không đổi verdict #96?.

**F-170-T2-11 (B1 quét mù là mốc cắt cố định 11:55:00Z — walk kết thúc ~11:44:40Z):** các mốc U trong (11:44:40Z, 11:55:00Z] có thể thiếu trong danh sách merged (walk đã qua các cây trước khi mốc đó sinh ra). U chỉ tham chiếu, hố max U kết thúc 07:22:14Z — không ảnh hưởng verdict nào. Ghi rõ để T2-171 dùng B1 = giờ chạy thực tế thay vì mốc cắt tương lai.

**F-170-T2-12 (sai số ghi chú trong `m-check170.py` — đã sửa trong LIMITS):** docstring ghi "/proc/1 +11.0s" cho #79 — giá trị chính xác là **+10,986 s** (11:11:15.986Z). LIMITS dùng số chính xác; script không in số này ra output (chỉ docstring) nên không có output nào đã ghi bị ảnh hưởng.

**Đã biết, giao T10-170:** nhãn GAP §98 còn cũ so với quyết parent §12.3 đợt 169 (quyết (a)–(o) đã viết — §98 hiện vẫn ghi "chờ quyết parent §12.1 aggregate 169") — T10-170 cập nhật khi viết §99 (cùng mẫu F-168-T1-1/F-169-T1-1). Không thuộc phạm vi T2. **R9 (a) vẫn chờ user** (số đếm vẫn là 16); **G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời).

### 6.3 Câu hỏi cho parent (chờ quyết ở aggregate 170)

1. **(m) #78 DƯƠNG: CHẤP NHẬN?** (T2-170 đối chiếu độc lập: requeue +40,693 s ∈ [33; 49,8]; 1 requeue duy nhất trong cửa; run 169 đang chạy tại btime. Caveat: các neo lệch-khung trái chiều — /proc/1 28,869 s + poll cuối 29,693 s dưới dải, dòng sampler cuối 58,693 s trên dải (xem §4.5 + F-170-T2-5). Nếu chấp nhận: n 27→28 / 28→29.)
2. **(m) #79 KHÔNG PHẢI ĐIỂM: ghi nhận?** (requeue +251,007 s ngoài dải 201,207 s; 1 requeue duy nhất trong cửa; n không đổi vì #79.)
3. **INSIDE #77/#78: chuỗi MỚI từ #73 tiếp tục dài 5 — ghi nhận theo dải phương pháp hay theo dải còn hiệu lực?** (#77 INSIDE FULL123 nhưng NGOÀI FULL122 còn hiệu lực muộn 1.528 s; #78 INSIDE CẢ FULL124 phương pháp VÀ FULL123 còn hiệu lực — hai dải đồng thuận ở #78. FULL121/FULL122 kiểm lại độc lập ĐẠT — nợ §10.5 (ix) aggregate 169 đã trả.)
4. **(m) #77 ghi chú tham chiếu (parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM): ghi nhận lệch khung #77/#78/#79?** (#77 không overlap; #78 OVERLAP thứ bảy, offset dưới mọi neo trừ btime và sampler đều dưới/trên dải trái chiều — quyết DƯƠNG #78 theo quy tắc đứng; #79 không overlap.)
5. **#96? vẫn MỞ / theo dõi tiếp đợt 171?** (R không đổi một giây qua 6 đợt liên tiếp; S/T đóng; U có hố file mới H-U7/H-U8 nhưng đóng theo union 1.067/860 s.)
6. **#56 vẫn CÓ ĐIỀU KIỆN?** (lần thứ 13 âm tính — 7 hướng MỚI, 6 âm + 1 bị chặn do công cụ; cửa R/J giữ nguyên; KHÔNG chốt n=15.)
7. **F-170-T2-1..12 ghi nhận?** (đặc biệt F-170-T2-1/2 — sửa bare-time xong (carry-over + window guard), số đếm jump-witness thay đổi nhưng verdict 0 hoạt động thật không đổi; F-170-T2-4 — birth-scan bị chặn; F-170-T2-5 — caveat neo #78 trái chiều.)
8. **Probe EPERM #89 không chạy đợt này (ngoài brief T2-170): ghi nhận?** (Cửa sổ mù neo ở 11:55:00Z giờ quét; giao lại cho T2-171 nếu parent muốn khôi phục nhịp probe.)
9. **R9 (a) vẫn chờ user** (số đếm vẫn là 16); **G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời). **(m) #96?/#95?/#94?/#88?/#77? — không tự đóng/mở, chỉ đề xuất, parent quyết.**

## 7. File + stage

- LIMITS này: `docs/PHASE9_ROUND170_T2_EPERM_LIMITS.md`
- Stage: `phase9-round170-t2-eperm.txt` (1 entry, NUL-delimited, text only — xem paths-loop)
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round170-t2.done`
- Thư mục làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round170-t2/` (script + log: blind9696-*.py, hole-recheck9696.py, m-check170.py, m56-170.py, blind9696-gaps170.py, eperm-sweep9696.py (không dùng đợt này), ram-max9696.py (không dùng đợt này), scan-wfs73/74.sh (không dùng đợt này), *.log/*.txt)

**Trạng thái cờ đợt 170 lúc T2 viết (~12:0xZ):** T6 đã có thư mục (chưa kiểm cờ); các luồng khác đang chạy. **Caveat:** các số T9-170 cuối đợt (birefnet, headroom, ENOSPC, E-173 kết cục, POSTBOOT_PASS #79) chưa có lúc T2 viết — T10-170 lấy từ T9-170/T5-170 khi tổng hợp. Run 170 vẫn running lúc T2 viết — kết cục thuộc T7-170.
