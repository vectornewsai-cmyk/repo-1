# PHASE9 ROUND 172 — T2 (mù #96? theo dõi tiếp + EPERM #90 + INSIDE #81 + (m) #81 DƯƠNG MỚI + (m) #56 lần thứ mười lăm) — LIMITS

**Đợt 172 mở 17:35:51Z 22/11/2026. Hạn cờ ~20:00Z, hạn cứng đóng 20:30Z 22/11. T2 viết ~18:0xZ 22/11.**
**KHÔNG push, KHÔNG release/tag. Chỉ stage 1 file (LIMITS này).**

> **GHI CHÚ ĐỨNG (quyết (e) đợt 165 — nhắc lại, áp dụng cho #74/#75; quyết (e) đợt 166 áp dụng đầy đủ cho #70; quyết (f) đợt 166 + quyết (e) đợt 167 áp dụng cho #71): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Tiền lệ #71: DƯƠNG đã CHẤP NHẬN (quyết (f) đợt 166) với offset btime +41,274 s MẶC DÙ các neo lệch-khung đều DƯỚI dải (21,274 s). Đợt này: (m) #81 DƯƠNG ỨNG VIÊN theo btime +33,477 s; neo lệch-khung duy nhất (poll cuối watcher-171 +20 s) cho offset +13,477 s — DƯỚI dải, cùng hình #71 (xem §4.5).

## 0. Kết luận trước (headline)

1. **(m) #81 — DƯƠNG ỨNG VIÊN (MỚI, đối chiếu độc lập, DB đọc tươi):** boot 4b9db449, btime 17:02:05Z (T2-172 xác minh 8 nguồn; T10-171 xác minh 5 nguồn lúc đóng; số hiệu chờ T0-172 chứng nhận 9 nguồn). **Requeue duy nhất trong cửa [17:02:05Z, 18:00:00Z] (mọi job): eid 10137, 17:02:38.477Z = btime +33,477 s ∈ [33; 49,8]** — chỉ hơn biên dưới **0,477 s** (sát biên nhất trong mọi điểm (m) DƯƠNG từng ghi: #71 +41,274 s, #78 +40,693 s). **Run 171 ĐANG CHẠY tại btime** (event-based, đúng 1 run) và **BỊ VIẾT LẠI 1 lần** bởi #81 (started_at 1795358151 → 1795366958, +8.807 s; attempt vẫn 1). Chữ ký giống #68/#69/#71/#74/#78 (run đang chạy + 1 requeue duy nhất trong cửa + offset trong dải). **Nếu parent CHẤP NHẬN: n ứng viên 28→29 / 29→30.** T2-172 phán DƯƠNG ỨNG VIÊN — parent quyết cuối.
2. **Run 171: SUCCEEDED 17:29:26Z** (eid 10143), wall gốc 10.415 s, **margin 385 s** tới hạn 17:35:51Z, claimed→finished **82 s** (NGOÀI họ 6–11 s — ca thứ tư ≥60 s: 164: 66 s, 166: 64 s, 167: 108 s, 171: 82 s); **1 lần viết lại** (tại #81 +33,477 s); 5 event đầy đủ, 0 event sau succeeded. (Kết cục run 171 thuộc T7-172; T2 chỉ ghi các số DB cần cho (m) #81.)
3. **INSIDE: #81 NGOÀI dải FULL127 [14:57:13Z, 16:58:20Z] neo 14:31:01Z (muộn 225 s; chính xác 224,2 s) → CHUỖI KHÔNG BẮT ĐẦU LẠI** (đã đứt tại #80 theo quyết (c) đợt 171 — chờ parent; #81 NGOÀI nên chuỗi vẫn đứt, dài 0). Đối chiếu dải còn hiệu lực FULL126: cũng NGOÀI (muộn 12.273 s) — **hai dải ĐỒNG THUẬN cùng NGOÀI** (khác #79, nơi hai dải mâu thuẫn). **FULL125/FULL126 KIỂM LẠI ĐỘC LẬP: ĐẠT** (p10/p90 khớp T2-171 bằng hai cách tính mới + giá trị chuỗi — **nợ F-171-T10-7 ĐÃ TRẢ**). **FULL128 KHÔNG TÍNH ĐƯỢC đợt này** (cần gap #81 = btime #82 − btime #81; #82 chưa xảy ra — ghi rõ, không bịa số).
4. **Mù #96? (#64) — VẪN MỞ (theo dõi tiếp, quét tươi + kiểm nội dung đầy đủ):** đoạn R file 1.238 s / union-A 1.222 s / union-B 1.211 s (y hệt T2-164→T2-171, không đổi một giây — **lần thứ tám liên tiếp**); S ĐÓNG theo union (file 3.235 s / union-A 662 s / union-B 591 s — y hệt T2-171); T ĐÓNG (file max MỚI 627 s do 23 exec-log bị XÓA — xem F-172-T2-5; union-A 38 s y hệt T2-171); U ĐÓNG theo union (file max MỚI 2.335 s do 4 exec-log bị XÓA; union-A/B max MỚI **1.118 s — chỉ còn cách sàn 29 s**, xem F-172-T2-4). **Kết luận: #96? VẪN MỞ.**
5. **Mù #88? VẪN MỞ — hole-recheck lần thứ MƯỜI SÁU: 337 hit, 0 mốc mới** (y hệt lần 9–15 — 337 hit, không trôi thêm; xem §2.6). **#95?/#94?/#77? giữ nguyên** (không có bằng chứng mới). CERT/FULL chính thức GIỮ 76/91.
6. **(m) #56: KHÔNG thu hẹp được lần thứ MƯỜI LĂM** (7 hướng MỚI — 6 âm tính + 1 hướng DB (vii) chỉ xác nhận lại mốc max đã biết; xem §4.1 + F-172-T2-9/10). Cửa GIỮ NGUYÊN R [2,56251; 2,66817) / J [2,566; 2,80753] s. **#56 VẪN CÓ ĐIỀU KIỆN; n ứng viên GIỮ 28/29 (29/30 nếu (m) #81 được chấp nhận); n chính thức GIỮ 14.**
7. **Lệch khung giờ biên #81 (§4.5): OVERLAP THỨ TÁM** (poll cuối watcher-171 17:02:25Z = btime +20 s, nhãn boot cũ 2acdd1ab — dị thường timestamp mà T10-171 đã ghi; không lật được 5 nguồn xác nhận reboot của T10-171 + 8 nguồn của T2-172). **Sampler-171 NGỪNG GHI 16:44:30Z** (17m35s TRƯỚC #81); **khoảng không-sampler [16:44:30Z, 17:38:45Z] = 3.255 s chứa #81** — caveat cho T9-172 (cùng mẫu #79/#80).
8. **Probe EPERM #90: CHẠY 17:39:15Z, boot 4b9db449, ok=2 fail=0** (log 258 → 260 dòng; heartbeat n=90; "=== probe end" vẫn 0 dòng). Cửa sổ probe #90: 14:48:02Z → 17:39:15Z = 10.273 s. Sweep #90 (144 file *.log): 4 file có hit, 11 occurrence — **0 sóng thật** (1× "Operation not permitted" là trích dòng sweep #89; 10× "sóng EPERM đã tắt"). Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.
9. **F-172-T2-3 (LỖI ĐO CỦA CHÍNH T2 — exec-log của phiên mình làm phồng số đếm):** exec-log `proc_506c2c48e69a.log` của chính phiên T2-172 (agent 7b0156bc) chứa trích dẫn timestamp từ output `m-check171.py`/`gaps171.py` mà T2 đọc lúc đầu phiên — content-span của nó (11:15:18Z 21/11 → 14:52:09Z 22/11) làm jump-witness counts tăng +1 giả cho #65–#80 và góp 1× "sóng EPERM đã tắt" vào sweep #90. **Số thật sau khi trừ artifact: #65: 6, #66: 7, #67: 7, #68: 7, #69: 3, #70–#78 như T2-171, #79: 0, #80: 0 — 0 hoạt động thật ở mọi reboot.** LIMITS này dùng số đã trừ; số thô có ghi chú rõ.
10. **TUÂN THỦ LUẬT SCRIPT NẶNG (F-171-T2-1 — đợt này KHÔNG vi phạm):** T2 kiểm `chain-t4.log` TRƯỚC MỖI script nặng (walk 17:40:31Z, hole-recheck 17:47:15Z, m56 17:51:40Z, atime-max 17:53:43Z, sweep 17:55:57Z — mọi lần chỉ có dòng poll-wait start 17:41:20Z, **0 attempt nào đang chạy**); T4 vẫn gate-polling lúc kiểm cuối 17:56:51Z (poll #12 lúc 17:49:39Z, gate0 chưa đạt — POSTBOOT_PASS #81 vẫn cờ cũ). Không script nặng nào chồng lên cửa sổ attempt của T4 đợt này.

## 1. Điểm (m) #81 + (m) #80 — đối chiếu độc lập từ DB đọc tươi

**Nguồn: T2-172 tự đọc DB qua muse.db (`scheduler.job_runs` + `scheduler.events`, đọc 17:39–17:57Z 22/11 — 7 query: run 171/172 + events run 171 + events cửa [17:02:05, 17:21:00] + requeue cửa mở rộng [17:02:05, 18:00:00] (2 lần: lúc đọc + kiểm lại trước khi viết LIMITS) + events [16:50:00, 17:02:05) + spanning theo started_at). Btime #81 T2-172 xác minh 8 nguồn (xem §1.3); T10-171 xác minh 5 nguồn lúc đóng; số hiệu chờ T0-172 chứng nhận 9 nguồn.**

### 1.1 (m) #81 — DƯƠNG ỨNG VIÊN (MỚI)

| Hạng mục | Giá trị |
|---|---|
| Btime #81 | 1795366925 = 17:02:05Z 22/11 (boot 4b9db449 — T2-172 xác minh 8 nguồn; T10-171 xác minh 5 nguồn lúc đóng) |
| Requeue trong cửa [17:02:05Z, 17:21:00Z] | **Đúng 1 dòng (mọi job): eid 10137, run 171, 17:02:38.477Z = btime +33,477 s ∈ [33; 49,8]** — hơn biên dưới 0,477 s, dưới biên trên 16,323 s |
| Requeue trong cửa MỞ RỘNG [17:02:05Z, 18:00:00Z] | **Đúng 1 dòng (mọi job — kiểm lại trước khi viết LIMITS)** |
| Tất cả event trong cửa [17:02:05Z, 17:21:00Z] | **6 dòng: requeued_after_restart run 171 (eid 10137); dispatched run 171 (eid 10138); reattached_after_restart run 171 (eid 10139); reconciled 17:15:34Z (eid 10140); dispatched + succeeded heartbeat 17:15:34Z (eid 10141/10142)** |
| Run đang chạy tại btime #81 (event-based, mọi job, không lọc sched) | **Đúng 1 — run 171** (dispatched 14:35:51.103Z eid 10103; succeeded 17:29:26.374Z eid 10143 = btime +1.641 s) |
| Run spanning btime #81 (theo started_at, 3h trước btime) | **0 dòng — ARTIFACT VIẾT-LẠI-TỰ-LOẠI** (started_at viết lại 17:02:38Z sau btime nên tự loại; verdict dựa trên EVENTS, như #76/#78) |
| Event trong [16:50:00Z, 17:02:05Z) | **Đúng 3 dòng: reconciled 17:00:00Z (eid 10134); dispatched + succeeded deterministic-doctor 17:00:00Z (eid 10135/10136)** |
| Run 171 — events đầy đủ | **Đúng 5 event: dispatched 14:35:51.103Z (eid 10103) + requeued_after_restart 17:02:38.477Z (eid 10137) + dispatched 17:02:38.518Z (eid 10138) + reattached_after_restart 17:02:38.573Z (eid 10139) + succeeded 17:29:26.374Z (eid 10143) — 1 lần viết lại; started_at 1795358151 → 1795366958 (+8.807 s); boot_gen hiện tại cron_boot_0672507b3b7d4ad482ac5011a387a8ec (trùng run 172 — gán lại khi requeue)** |

**Chữ ký giống #68/#69/#71/#74/#78 (run đang chạy tại btime + 1 requeue duy nhất trong cửa + offset trong dải). Điểm khác mọi điểm DƯƠNG trước: offset +33,477 s chỉ hơn biên dưới 0,477 s — sát biên nhất từng ghi (so #71 +41,274 s, #78 +40,693 s). T2-172 phán DƯƠNG ỨNG VIÊN — parent quyết cuối. Nếu chấp nhận: n 28→29 / 29→30.**

### 1.2 (m) #80 — CHỈ GHI CHÚ THAM CHIẾU (parent CHƯA QUYẾT (e) đợt 171 — KHÔNG mở lại)

Quyết (e) đợt 171 đang chờ parent: **#80 KHÔNG PHẢI ĐIỂM** theo T2-171 (0 requeue trong [14:31:01Z, 15:00:00Z]; 0 run sống tại btime). T2-172 KHÔNG mở lại phân loại — chỉ ghi chú tham chiếu theo giao.

### 1.3 Reboot #81 — xác minh btime (T2-172, 8 nguồn)

Boot_id 4b9db449-7699-4441-a4cf-72983f15dbbd; `/proc/stat` btime 1795366925 = 17:02:05Z; `uptime -s` 17:02:05Z; /proc/1 mtime 17:02:16.745Z (+11,745 s); journal idx 0 duy nhất, first entry 17:02:17Z (+12 s); wtmp begins 17:02:16Z (+11 s); `last` reboot 17:02 still running; `who -b` 17:02. Cloudflare Date 17:39:54 vs local 17:39:53 — chênh 1 s (trong ±1 s). **KHÔNG nghịch lý đồng hồ.** Gap #80→#81 = **9.064 s** (2h31m04s — KHỚP T10-171). **#81 xảy ra 33m46s TRƯỚC khi đợt 172 mở (17:35:51Z). Số hiệu #81 do T0-172 chứng nhận (T2 ghi nhận, không tự chứng nhận).** Marker mtime 2026-11-20 11:39:47.272154981Z không đổi lúc T2 kiểm (17:39Z) — số reboot sống qua giao T0-172 đếm (T10-171 đếm 33 reboot #49–#81 lúc đóng đợt 171).

### 1.4 Run 171 — kết cục (T2-172 đọc DB tươi; kết cục thuộc T7-172, T2 chỉ ghi số cần cho (m))

**SUCCEEDED 17:29:26Z** (event 17:29:26.374Z, eid 10143), wall từ started gốc 10.415 s, **margin 385 s** tới hạn 17:35:51Z, claimed→finished **82 s** (claimed 17:28:04Z — NGOÀI họ 6–11 s, ca thứ tư ≥60 s sau 66 s (164), 64 s (166), 108 s (167); run 170 là 110 s — xem F-172-T2-11), attempt 1, **1 lần viết lại** (tại #81), 5 event đầy đủ, 0 event sau succeeded; worker_execution_timed_out false. Run 172 (b12b8a64): scheduled/started 17:35:51Z, status running lúc đọc DB, boot_gen cron_boot_0672507b3b7d4ad482ac5011a387a8ec — kết cục thuộc T7-173.

## 2. Điều tra mù #96? (#64) — THEO DÕI TIẾP (quét tươi + kiểm nội dung đầy đủ)

Mù # = reboot # + 32. #96? = reboot #64, btime 11:15:18Z 21/11/2026. Sàn luật gap: **1.147 s (19'07")** — file max gap hoặc union max gap vượt sàn ⇒ MỞ.

### 2.1 Sự kiện + định nghĩa đoạn

Cửa sổ điều tra: **[11:15:18Z 21/11, 18:00:00Z 22/11] = 110.682 s** (btime #64 → B1 = giờ quét thực tế T2-172 — theo bài học F-170-T2-11, dùng giờ chạy thực tế thay vì mốc cắt tương lai; walk 17:40:31–17:43:30Z, xem F-172-T2-12). Các đoạn, neo bằng btime/probe:

| Đoạn | Cửa sổ | Độ dài | Mốc phải |
|---|---|---|---|
| R | [11:15:18, 11:38:28] 21/11 | 1.390 s | btime #64 (11:15:18Z) → T0-163 lần đầu 11:38:28Z |
| S | [11:38:28, 14:41:28] 21/11 | 10.980 s | T0-163 → probe #82 |
| T | [14:41:28, 16:06:45] 21/11 | 5.117 s | probe #82 → btime #66 |
| U | [16:06:45 21/11, 18:00:00 22/11] | 93.195 s | btime #66 → giờ quét (thuộc #97?/#98?/#99?/#100?/#101?/#102?, chỉ tham chiếu) |

Quét tươi (`blind9696-investigate.py`): repo-1 133 file, hidden_files 4.021, ngoài cây 1.854, /tmp **1.408**, fifth 16 → merged **2.805 mốc giây duy nhất** (T2-171: 2.624 — tăng 181 do cửa sổ kéo dài tới 18:00:00Z, chủ yếu là file đợt 172 trong U). **/tmp = 1.408 file: toàn bộ là file đợt 172 tạo SAU reboot #81** (tmpfs đã bị #81 xóa sạch rồi tạo lại từ 17:35:51Z; R/S/T /tmp vẫn = 0).

### 2.2 Đồng hồ, reboot #81 (T10-171 + T2-172 đối chiếu)

**Reboot #81 — T10-171 xác minh btime bằng 5 nguồn lúc đóng đợt 171; T2-172 xác minh 8 nguồn (xem §1.3).** Gap #80→#81 = **9.064 s**. **#81 xảy ra 33m46s TRƯỚC khi đợt 172 mở (17:35:51Z).** Marker mtime không đổi lúc T2 kiểm — số reboot sống qua giao T0-172 đếm (T10-171: 33 reboot #49–#81).

**POSTBOOT_PASS / watcher (T5-172 sở hữu — T2 chỉ ghi nhận):** POSTBOOT_PASS #81 CHƯA CÓ lúc T2 kiểm cuối (17:56:51Z — T4 poll #12 lúc 17:49:39Z vẫn gate0 chưa đạt, cờ POSTBOOT_PASS vẫn là cờ cũ của #80; replay-watch-172 START 17:41:39Z pid 17944, verify form-B exit=1). **Watcher-171 CHẾT THEO #81** (poll cuối 17:02:25Z — xem §2.3 + §4.5). **Sampler-171 NGỪNG GHI 16:44:30Z** (dòng 2acdd1ab cuối); **sampler-172 BẮT ĐẦU 17:38:45Z** (dòng 4b9db449 đầu) — **không có sampler nào ghi trong [16:44:30Z, 17:38:45Z] = 3.255 s chứa reboot #81** (cùng mẫu #79/#80 — caveat cho T9-172, xem F-172-T2-13).

### 2.3 Hoạt động từng đoạn (merged log, mốc giây)

| Đoạn | Mốc giây | File-marks | Nhận xét |
|---|---|---|---|
| R [11:15:18, 11:38:28] | 13 | 55 | Hố 1.238 s (xem §2.4) — Y HỆT T2-164→T2-171 về hố; 0 file-mark mất đợt này |
| S [11:38:28, 14:41:28] | 226 | 429 | File max y hệt T2-171 (3.235 s); union-A 662 s / union-B 591 s Y HỆT T2-171 → ĐÓNG theo union |
| T [14:41:28, 16:06:45] | 211 | 634 | File max MỚI 627 s (23 exec-log bị XÓA — xem F-172-T2-5); union-A 38 s Y HỆT T2-171 → ĐÓNG theo union |
| U [16:06:45, 18:00:00] | 2.355 | 6.314 | File max MỚI 2.335 s (4 exec-log bị XÓA — xem F-172-T2-5); union-A/B max MỚI 1.118 s — chỉ còn cách sàn 29 s (xem F-172-T2-4) → ĐÓNG theo union (tham chiếu) |

**Nội dung trong R (55 file-marks, kiểm tay — y hệt T2-164→T2-171):** đầu 11:35:56Z tool-output exec-call agent 5001d1e4; 11:37:30Z tool-output agent 2c32ef43; 11:37:42Z sampler-162 scripts. R-head [11:15:18–11:34:25]: 0/0/0/0/0 mọi scope (trống). R-tail: repo-1=2 / hidden_files=51 / outside=2 / tmp=0 / fifth=0 (y hệt T2-171 — 0 mất mát đợt này). **Mốc dpkg 11:35:40Z (TRONG hố R) là mốc nội dung THẬT:** hoạt động dpkg đầu trên #64, 2 dòng "startup packages configure", boot+20m22s — T0-162 quan sát trực tiếp từ dpkg.log #64 (dòng đầu 11:35:40Z; file đã reset theo #65/#66/#67/#68/#69/#70/#71/#72/#73/#74/#75/#76/#77/#78/#79/#80/#81, quan sát còn trong T0-162 LIMITS + aggregate 162). Cùng loại với mốc dpkg 08:35:41Z mà T2-162 đã tính cho đoạn N. Được tính vào cả UNION-A lẫn UNION-B. **Không có nguồn độc lập thứ ba cho R-head:** dpkg.log đã reset 17 lần kể từ #64; journal/dmesg chỉ còn boot hiện tại (journal xoay theo boot; dmesg EPERM) — ghi rõ, không giấu. R-head trống hoàn toàn trên mọi scope đo được.

**Nội dung khác (content script, `blind9696-content.py` — số R/S/T/U khớp T2-171 từng dòng, cộng thêm sampler-171 FULL + watcher-171 FULL + sampler-172 + watcher-172):** sampler-162 (d9a8d1ce) 1 dòng trong R (11:37:42Z, sau hố) + 138 dòng trong S; watcher-162 strict polls 331 trong S (last poll 14:25:20Z — chết sớm, T0-163); watcher-161 linger polls sau btime #64: 0; sampler-163 3 dòng trong S tail + 45 dòng edb2acdb trong U (dòng cuối 16:52:21Z); watcher-163 163 poll trong T + **1 dòng trong U (poll cuối 16:06:54Z — poll đua với reboot #66, 9 s sau btime, nhãn boot cũ 1c1cf10c)**; sampler-164: 28 dòng f1d4ce1a + 107 dòng 0c8a94aa trong U (dòng cuối 19:53:52Z); watcher-164: 52 strict poll trong U (last poll 18:06:41Z — poll đua với reboot #68, 11 s sau btime, nhãn boot cũ f1d4ce1a); sampler-165: 88 dòng 9a1a9319 + 46 dòng d1ddd946 trong U (dòng cuối 22:51:29Z); watcher-165: 164 strict poll trong U (last poll 22:05:31Z — poll đua với reboot #70, 6 s sau btime, nhãn boot cũ 9a1a9319); sampler-166: 30 dòng d1ddd946 + 93 dòng ea73ac4f trong U (dòng cuối 01:41:07Z); watcher-166: 56 strict poll trong U (last poll 00:08:20Z — poll đua với reboot #71, 20 s sau btime, nhãn boot cũ d1ddd946); sampler-167: 88 dòng b643911f + 40 dòng 194efd93 trong U (dòng cuối 04:45:54Z; dòng b643911f cuối 04:05:35Z = btime #74 +6 s — dòng sampler khung cũ sau btime, cùng mẫu OVERLAP); watcher-167: 170 strict poll b643911f trong U (last poll 04:05:41Z — poll đua với reboot #74, 12 s sau btime, nhãn boot cũ b643911f) + 163 strict poll 194efd93 trong U (last poll 05:29:40Z — kết thúc theo lịch, không chết theo #75); sampler-168: 113 dòng 576ca271 + 22 dòng f2b97695 trong U (dòng 576ca271 cuối 07:32:37Z = btime #76 +14 s — dòng sampler khung cũ sau btime, OVERLAP thứ sáu; dòng f2b97695 đầu 07:33:32Z = btime #76 +69 s, cuối 07:54:32Z — sampler dừng ~07:54:32Z); watcher-168: 191 strict poll 576ca271 trong U (last poll 07:32:18Z — CHẾT THEO #76, 5 s TRƯỚC btime, KHÔNG có poll nào sau btime); sampler-169: 33 dòng c44cc3ba + 99 dòng e298bb52 trong U (dòng c44cc3ba cuối 09:14:20Z = btime #78 −18 s; dòng e298bb52 đầu 09:16:09Z = btime #78 +91 s, cuối 10:54:11Z = btime #79 −1.014 s — sampler dừng ~10:54:11Z); watcher-169: 57 strict poll c44cc3ba trong U (last poll 09:14:49Z = btime #78 +11 s — poll đua với reboot #78, nhãn boot cũ c44cc3ba — OVERLAP thứ bảy; CHẾT THEO #78); sampler-170 FULL: 121 dòng 5df1871f trong U (đầu 11:38:04Z = btime #79 +1.619 s, cuối 13:38:07Z — sampler dừng TRƯỚC #80; khớp 121 mẫu của T9-170); watcher-170: 319 strict poll 5df1871f trong U (last poll 14:21:59Z = btime #80 −542 s — KẾT THÚC LẶNG TRƯỚC #80, xem F-171-T2-6); **sampler-171 FULL MỚI: 121 dòng 2acdd1ab trong U (đầu 14:44:27Z = btime #80 +806 s, cuối 16:44:30Z — sampler NGỪNG GHI 17m35s TRƯỚC #81; khớp 121 mẫu của T9-171)**; **watcher-171 FULL MỚI: 261 strict poll 2acdd1ab trong U (START 14:52:09Z pid 28156; last poll 17:02:25Z = btime #81 +20 s — poll khung cũ SAU btime, OVERLAP thứ tám; CHẾT THEO #81)**; **sampler-172 MỚI: 7 dòng 4b9db449 trong U (đầu 17:38:45Z = btime #81 +2.200 s — vẫn đang chạy lúc content chạy)**; **watcher-172 MỚI: 1 strict poll 4b9db449 trong U (START 17:41:39Z pid 17944, btime 17:02:05Z trong START line — vẫn đang chạy)**.

**Jump witness (hoạt động) tại #64–#80: đều = 0 hoạt động thật** (`blind9696-sessions.py`, 328 exec-log có mtime trong cửa sổ — bằng T2-171; xem F-172-T2-3 về artifact +1 của chính phiên T2). Số đếm THẬT (đã trừ artifact của chính phiên T2 — số thô trong ngoặc):
- #64: **5** (y hệt T2-171; artifact của T2 không span #64 vì content-min của nó đúng bằng btime #64).
- #65: **6** (thô 7; −1 artifact) — y hệt T2-171.
- #66: **7** (thô 8; −1 artifact; −2 thật so với T2-171: proc_f4d2cc5e81cf + proc_471dd8b624d5 bị XÓA — xem F-172-T2-5).
- #67: **7** (thô 8; −1 artifact; −2 thật so với T2-171: proc_7aedeeb5297e + proc_6ecb5bcb64ad bị XÓA).
- #68: **7** (thô 8; −1 artifact) — y hệt T2-171.
- #69: **3** (thô 4; −1 artifact; −1 thật so với T2-171: proc_b6ce5fee0f84 bị XÓA — file này span đúng cửa D [19:04:44, 20:22:43], xem F-172-T2-14).
- #70: **6**, #71: **6**, #72: **4**, #73: **4**, #74: **5**, #75: **4**, #76: **2**, #77: **2**, #78: **2** — y hệt T2-171 từng số (sau khi trừ artifact).
- #79: **0** (thô 1; −1 artifact) — y hệt T2-171. **#80: 0** (thô 1; −1 artifact) — y hệt T2-171.
- Tất cả các hit còn lại đều là trích dẫn/artifact, 0 hoạt động thật.
- Exec-log content-ts trong hố R union (11:15:29–11:35:40): **3 hit** (y hệt T2-171), 0 mốc hoạt động: 11:16:22Z ×3 (trích biên hố H-R1-old).
- Exec-log content-ts trong hố U file max H-U6 (06:56:58–07:22:14): **0 hit, 0 mốc hoạt động** (y hệt T2-171).

### 2.4 Mốc merged + verdict (luật gap, sàn 1.147 s)

| Đoạn | File max gap | Union-A max gap | Union-B max gap | Verdict |
|---|---|---|---|---|
| **R** | **1.238 s** (11:15:18 → 11:35:56) | **1.222 s** (11:15:18 → 11:35:40) | **1.211 s** (11:15:29 → 11:35:40) | **MỞ (y hệt T2-171 — lần thứ tám liên tiếp không đổi)** |
| S | **3.235 s** (13:01:51 → 13:55:46) | **662 s** | **591 s** | **ĐÓNG theo union** |
| T | **627 s** (15:22:55 → 15:33:22, MỚI — 23 exec-log bị XÓA) | **38 s** | — | ĐÓNG |
| U | **2.335 s** (16:09:36 → 16:48:31, MỚI — 4 exec-log bị XÓA) | **1.118 s** (11:19:20 → 11:37:58, MỚI — xem F-172-T2-4) | **1.118 s** | ĐÓNG theo union (tham chiếu) |

Union-A = mốc file + mốc nội dung (dpkg 11:35:40Z); Union-B = Union-A + mốc hệ thống trước btime (11:15:29Z) + mốc đầu boot #71 (00:08:16Z) + #72 (02:05:17Z) + #73 (02:28:13Z) + #74 (04:05:44Z) + #75 (05:32:57Z) + #76 (07:32:34Z) + #77 (08:24:04Z) + #78 (09:14:50Z) + #79 (11:11:16Z) + #80 (14:31:13Z) + **#81 (17:02:16Z — MỚI, T2-172 trực tiếp)**. **R: mọi cách đếm đều MỞ — y hệt T2-171 từng giây (lần thứ tám liên tiếp không đổi).** Biến thể +dispatch 11:35:51Z (DB, không tính vào union chính): 1.211 s — cũng MỞ.

**S — file max y hệt T2-171 (3.235 s, 13:01:51→13:55:46):** không thêm file nào bị xóa đợt này trong S (42 file đã mất từ đợt 171 vẫn mất; 0 mất mới). Union-A/B S không đổi một giây (662/591 s). **ĐÓNG theo union.**

**T — file max MỚI 627 s (15:22:55→15:33:22):** 23 exec-log trong T bị runtime dọn sạch giữa hai đợt (xem F-172-T2-5) — toàn bộ 23 file đều KHÔNG CÒN trên đĩa (0 file chỉ trôi mtime). Union-A T KHÔNG ĐỔI (38 s) vì nội dung watcher-163 (poll 30 s) + sampler-163 lấp đầy T. **ĐÓNG theo union.**

**U — file max MỚI 2.335 s (16:09:36→16:48:31):** 4 exec-log trong khoảng này bị XÓA (16:13:06, 16:25:06, 16:40:12, 16:47:16 — xem F-172-T2-5). Hố được lấp bởi nội dung watcher-163/sampler-163 (union-A không còn hố này trong top 6). **Union-A max MỚI 1.118 s (11:19:20→11:37:58, tăng từ 1.067 s):** file sessions e033d2dd bị ghi thêm (append) lúc 17:40:39Z trong phiên đợt 172 — mtime trôi từ 11:21:28Z → 17:40:39Z (xem F-172-T2-4); hố nằm giữa sampler-169 dừng (10:54:11Z) và sampler-170 bắt đầu (11:38:04Z). **Vẫn dưới sàn 1.147 s — nhưng chỉ còn cách sàn 29 s. ĐÓNG theo union.** Hố file U mới H-U12 2.335 s + H-T2 627 s — cả hai đều được lấp đầy bởi mốc nội dung. Union-B max = union-A max (1.118 s; SYS81 17:02:16Z không nằm trong hố max). U chỉ tham chiếu cho #96? — không đổi verdict R.

T đóng chắc (file 627 s; union-A 38 s y hệt T2-171).

**Kết luận đầy đủ: #96? VẪN MỞ qua đoạn R. Quét tươi + kiểm nội dung + sessions + hole-recheck đều đã chạy đầy đủ đợt này và xác nhận lại từng số của T2-171 (R không đổi một giây lần thứ tám; S union không đổi; T/U union không đổi verdict dù file-gap trôi mạnh).**

### 2.5 CERT/FULL ứng viên + INSIDE

**CERT/FULL chính thức GIỮ 76/91** (quyết (b) đợt 164, giữ theo quyết (m) đợt 165–171; #95?/#94?/#77? vẫn mở). Gap #63 = 9.073 s cho ứng viên CERT95/FULL110.

**FULL125/FULL126 KIỂM LẠI ĐỘC LẬP — ĐẠT (nợ F-171-T10-7, đã trả):** (a) danh sách: FULL125 = FULL124 + [6.987] ✓; FULL126 = FULL125 + [11.996] ✓ (đối chiếu với danh sách chuỗi từ gaps171 exec); (b) `statistics.quantiles` method='inclusive' VÀ (c) nội suy chỉ số-sắp xếp viết mới đều cho **FULL125 p10/p90 1.569,40/8.709,20 s** và **FULL126 p10/p90 1.571,00/8.787,50 s** — KHỚP giá trị T2-171 đã in VÀ giá trị chuỗi s125/s126. T2-172 đã kiểm lại phép tính dải FULL125/FULL126 độc lập như T10-171 còn nợ.

**FULL127** (gap #80 NOMINAL 9.064 s, CÓ ĐIỀU KIỆN): n=127, mean 1h40'34", median 1h53'42", p10 0h26'13" (1.572,60 s), p90 2h27'20" (8.839,80 s), sd 0h55'41", min 0h00'55", max 5h43'18"; trong 90–150'=67, <60'=30, >180'=9, >240'=3.
**FULL128 (cho #82) — KHÔNG TÍNH ĐƯỢC:** FULL128 = FULL127 + [gap #81]; gap #81 = btime #82 − btime #81 cần reboot #82, chưa xảy ra. Mọi giá trị FULL128 in ra khi chưa có #82 đều là bịa — T2-172 ghi rõ, giao T2-173 tính.

Tốc độ reboot: tới #79: 155 reboot / 278,88 h = 1 lần / 108,0 phút; tới #80: 156 reboot / 282,21 h = 1 lần / 108,5 phút; tới #81: 157 reboot / 284,73 h = 1 lần / 108,8 phút.

**INSIDE:**
- **#81 NGOÀI dải FULL127 [14:57:13Z, 16:58:20Z] neo 14:31:01Z** (muộn 225 s; chính xác 224,2 s) → **CHUỖI KHÔNG BẮT ĐẦU LẠI** (đã đứt tại #80; chuỗi vẫn dài 0).
- Đối chiếu vs dải còn hiệu lực: #81 NGOÀI CẢ dải FULL126 [11:37:16Z, 13:37:32Z] neo 11:11:05Z (muộn 12.273 s; chính xác 12.272,5 s) — **hai dải ĐỒNG THUẬN (cùng NGOÀI)** — khác #79, nơi hai dải mâu thuẫn (INSIDE FULL125 nhưng NGOÀI FULL124).
- **Nhãn dải — kiểm lại đúng phương pháp (bài học F-165-T2-1):** #81 kiểm theo FULL127 neo btime #80 (mẫu FULL112→#66 … FULL126→#80 ⇒ FULL127→#81; mỗi dải gồm gap kết thúc tại neo của nó). FULL126 chỉ là dải đối chiếu còn hiệu lực cho #81 — KHÔNG phải dải phương pháp.
- Gap #80 NOMINAL 9.064 s là gap ngắn thứ hai kể từ #74 (5.848 s) — nhưng vẫn đẩy #81 ra ngoài dải trên tới 225 s vì p90 FULL127 (8.839,80 s) chỉ hơn gap một chút. FULL128 (cho #82) thuộc T2-173.

### 2.6 Hole-recheck

`hole-recheck9696.py`: find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp [19:32:59Z 20/11, 18:00:00Z 22/11]: **12.537 file** (was 11.778 — tăng 759 do cửa sổ kéo dài tới 18:00:00Z). Find stderr: 1 dòng — `/home/hatch/.stagged-uploads: Permission denied` (giới hạn đứng, thư mục mode 0000). **KIỂM TRƯỚC KHI CHẠY (bài học F-166-T2-2): `grep ^W =` → round172-t2 ✓; `grep ^hi =` → 18:00:00Z 22/11 ✓; KHÔNG dùng `#` làm delimiter; output vào thư mục RIÊNG round172-t2 (file MỚI `holerecheck-all.txt`, KHÔNG ghi đè file cũ). File `round171-t2/holerecheck-all.txt` md5 KHÔNG ĐỔI sau lần chạy (44c0198c… — kiểm lại sau khi chạy).**

| Hố | Kết quả |
|---|---|
| H-R1 (11:15:18, 11:35:56) | **0 hit — 0 mốc mới** |
| H-R1-old (11:16:22, 11:35:35) | 0 hit |
| H-S1/H-S2 | mỗi hố 0 hit |
| H-S3 (14:25:21, 14:36:23) | 1 inside = 1 trap (cạnh trái 14:25:21.013Z, replay-watch-162.log), 0 mới |
| H-S4 (13:01:51, 13:55:46) | **1 inside = 1 trap (cạnh trái 13:01:51.071Z, proactive_notification md), 0 mới** |
| H-T1 (15:23:25, 15:28:32) | **0 hit — trap cũ ĐÃ MẤT** (file proc_f7ccbba2a25c.log bị xóa; xem F-172-T2-8) |
| H-T2 MỚI (15:22:55, 15:33:22) | **1 inside = 1 trap (cạnh trái 15:22:55.098Z, stats-163-output.txt), 0 mới** |
| H-U1 (16:25:06, 16:40:12) | **0 hit — trap cũ ĐÃ MẤT** (file proc_2a111ad13bcc.log bị xóa; xem F-172-T2-8) |
| H-U2 (17:20:48, 17:36:14 — bắc qua btime #67) | 1 inside = 1 trap (cạnh trái 17:20:48.627Z, PHASE9_ROUND163_LIMITS.md), 0 mới |
| H-U2-old (17:22:25, 17:35:37) | 0 hit |
| H-U3 (19:37:11, 19:49:46) | 10 inside = 10 trap (cùng giây 19:37:11, file stall T8-164), 0 mới |
| H-U4 (16:13:06, 16:25:06) | **0 hit — trap cũ ĐÃ MẤT** (file proc_f4d2cc5e81cf.log bị xóa; xem F-172-T2-8) |
| H-U5 (22:09:05, 22:32:32) | 1 inside = 1 trap (cạnh trái 22:09:05.886Z, proc_5c237211ba31.log), 0 mới |
| H-U6 (06:56:58, 07:22:14) | 1 inside = 1 trap (cạnh trái 06:56:58.721Z, proc_0a160336a16d.log), 0 mới |
| H-U7 (10:08:01, 10:28:06) | 1 inside = 1 trap (cạnh trái 10:08:01.145Z, proc_6b03cdc0bb27.log), 0 mới |
| H-U8 (10:33:43, 10:53:31) | 1 inside = 1 trap (cạnh trái 10:33:43.011Z, proc_e174402912c9.log), 0 mới |
| H-U9 (08:20:37, 08:38:24) | 1 inside = 1 trap (cạnh trái 08:20:37.538Z, PHASE9_ROUND168_LIMITS.md), 0 mới |
| H-U10 (13:19:15, 13:36:57) | 1 inside = 1 trap (cạnh trái 13:19:15.852Z, proc_860da8744e60.log), 0 mới |
| H-U11 (11:19:20, 11:37:58 — BIÊN TRÁI DỜI TỪ 11:21:28) | **1 inside = 1 trap (cạnh trái 11:19:20.534Z, PHASE9_ROUND169_LIMITS.md), 0 mới** |
| H-U12 MỚI (16:09:36, 16:48:31) | **1 inside = 1 trap (cạnh trái 16:09:36.391Z, b2-spikes.log round163-t9), 0 mới** |
| H-E1-88 (19:32:59Z, 20:17:30Z) | **337 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI — lần thứ MƯỜI SÁU liên tiếp 0 mốc mới** |

Known base: 2.805 mốc giây đợt này; base #88? T2-157: 557 giây. **H-E1-88 giữ 337 hit — y hệt lần 9–15, không trôi thêm** (lần 15 giảm 345 → 337 do 8 exec-log mtime trôi; đợt này 0 file trôi thêm trong hố #88? — 27 file bị xóa đều nằm ngoài hố #88?).

### 2.7 Verdict mù (tổng hợp)

| Mù | Verdict đợt 172 | Cơ sở |
|---|---|---|
| #96? (#64) | **VẪN MỞ** (R 1.238/1.222/1.211 s vượt sàn; S/T/U đóng theo union) | Quét tươi + kiểm nội dung đầy đủ, số R y hệt T2-171 (S union không đổi; T/U union không đổi verdict dù file-gap trôi mạnh) |
| #95? (#63) | **MỞ** (giữ nguyên quyết (b) đợt 164) | Không có bằng chứng mới |
| #94? (#62) | **MỞ** (giữ nguyên) | Không có bằng chứng mới |
| #88? | **VẪN MỞ** (lần thứ 16: 337 hit, 0 mới) | Hole-recheck §2.6 |
| #77? | **VẪN MỞ** (giữ nguyên) | Không có bằng chứng mới |

**CERT/FULL chính thức GIỮ 76/91** (vì #77?/#88?/#94?/#95? vẫn mở; #96? VẪN MỞ — chưa đổi được khi chưa chứng nhận theo thứ tự).

## 3. Mù #88?/#77?/#95?/#94? — giữ nguyên

Mù #88? VẪN MỞ (lần thứ 16, §2.6: 337 hit, 0 mốc mới — y hệt lần 9–15). **#95?/#94?/#77? GIỮ NGUYÊN, không đổi** — không có bằng chứng mới đợt này. **CERT/FULL chính thức GIỮ 76/91.** T2 không tự đóng/mở bất kỳ mù nào — parent quyết.

## 4. Mô hình đồng hồ + điểm (m)

### 4.1 Điểm (m) #56 — thu hẹp lần thứ MƯỜI LĂM: 7 hướng MỚI, 7 âm tính

Cửa GIỮ NGUYÊN: **R [2,56251; 2,66817) s / J [2,566; 2,80753] s** (T2-168, §4.1). **#56 VẪN CÓ ĐIỀU KIỆN; KHÔNG chốt n=15.** Các hướng đã thử đợt này (`m56-172.py`, epoch cửa D [19:04:44Z, 20:22:43Z] 20/11 đã kiểm độc lập):

| Hướng (đợt 172) | Kết quả |
|---|---|
| (i) ctime scan trong D trên cây MỚI: /var/lib, /var/cache, /usr/local, /boot, /root | **0 file trong D trên cả 5 cây** (/var/lib: 1 dòng stderr — `find: '/var/lib/hatch/postgres': Permission denied`, giới hạn đứng; 4 cây còn lại 0 dòng stderr). Đợt 170 ctime-scan 5 cây khác (351 hit, 0 neo mới); đợt này thêm 5 cây — tổng 10 cây đã ctime-scan, 0 neo mới |
| (ii) atime trong D dưới /home/hatch (+ kiểm mount mode) | **343 file có atime trong D — NHƯNG 0 MỚI:** /home/hatch mount **noatime** (overlayfs, subvol btrfs noatime) nên atime KHÔNG được duy trì — 343 hit là atime đóng băng từ lúc tạo file. Max atime trong D = **20:19:34.327Z** (sessions.json agent 964f2bc4 — ĐÚNG mốc max đã biết, tới từng mili-giây; file thứ hai trên max là prompt-continuity-964f2bc4 .230, cùng agent). **0 atime nào muộn hơn mốc đã biết → không thu hẹp** (xem F-172-T2-9) |
| (iii) git commit timestamps trong D (author + committer date) | **0 repo git local** — `~/workspace/repo-1` KHÔNG có thư mục `.git` (cây file thuần, không phải checkout git); glob toàn `~/workspace` cũng 0 repo. Hướng này RỖNG theo cấu trúc, không phải âm tính theo dữ kiện (xem F-172-T2-10) |
| (iv) rotated/compressed logs: /var/log + /var/lib | **0 ứng viên rotated-log** (0 file *.gz/*.1/*.old) — không có log xoay nào để zgrep; 0 dòng D. Đợt 170 chỉ kiểm dpkg xoay; đợt này kiểm toàn bộ — xác nhận không tồn tại |
| (v) journal files trên đĩa (/run/log/journal + /var/log/journal) | **Chỉ 1 file duy nhất: system.journal 8 MB, mtime 17:53:30Z (boot hiện tại)** — 0 file journal lưu trữ từ boot cũ. Vắng mặt đã ghi thành tài liệu (khác với --list-boots: kiểm trực tiếp trên đĩa) |
| (vi) content timestamp trong tool-output JSON (/home/hatch/workspace/agents/*/tool-output/*.json) | **98 file — NHƯNG 0 MỚI:** chỉ 1 file có mốc trong D, max đúng **19:04:44Z** (exec-call_01a1fac4e15571c0903dbd77bd6934f7.json, n=1) — đúng biên D0, đã là biên cửa, không phải mốc mới. Cây này chưa từng được grep (171(ii) chỉ grep /var/log + hidden_files + docs) |
| (vii) scheduler DB trong D (muse.db, T2 chạy riêng) | **6 run + 19 event trong D — NHƯNG 0 MỚI:** requeue #55 eid 9482 (19:05:18.916Z) đã biết từ đợt 157 ("Requeue chỉ 3 lần cũ #53/#54/#55"); run 156 finished **20:19:34.532Z** (eid 9500) — cùng giây với mốc max đã biết 20:19:34.327Z (sessions.json 964f2bc4), chỉ là **xác nhận độc lập từ DB**, không thu hẹp; heartbeat/feed-pulse-02/deterministic-doctor là run định kỳ (started 19:15:34Z, 19:41:54Z, 19:45:34Z, 20:00:00Z, 20:15:34Z — xem chi tiết dưới), tất cả ≤ max đã biết |

Chi tiết (vii) — 6 run trong D (started/finished trong D): vcut-build-loop 9c7b6986 (started 19:05:18Z, finished 20:19:34Z, succeeded); heartbeat 20517aa2 (19:15:34Z); feed-pulse-02 8a5f67cf (19:41:54Z); heartbeat cb4058b6 (19:45:34Z); deterministic-doctor d8789cb1 (20:00:00Z); heartbeat 4c5c88d5 (20:15:34Z). 19 event: requeued/dispatched/reattached run 156 (eid 9482/9483/9484, 19:05:18Z — requeue #55, ĐÃ BIẾT) + reconciled/dispatched/succeeded ×5 nhóm + succeeded run 156 (eid 9500, 20:19:34.532Z). **Max timestamp DB trong D = 20:19:34.532Z = mốc max filesystem 20:19:34.327Z (cùng giây, hai nguồn độc lập) — xác nhận, không thu hẹp.**

**Đợt 171 (đối chiếu — 7 hướng cũ):** (i) birth-time stat shortlist — 20 birth, 0 mới; (ii) grep content-timestamp non-exec-log — 230 file, 0 mới; (iii) dpkg database files — 0 file mtime trong D; (iv) mtime scan 5 cây mới — 0 file; (v) session JSON content — 53 file, 0 mới (1 ứng viên 20:17:15Z đã loại); (vi) literature grep docs — 0 mới; (vii) journal content + 3 exec-log bị xóa — journal 0 dòng, nội dung đã mất không khôi phục được. Đợt này thêm 7 hướng MỚI — tổng **36 hướng âm tính liên tiếp** (15 hướng đợt 167/168/169 + 7 hướng đợt 170 + 7 hướng đợt 171 + 7 hướng đợt này, chưa kể các hướng đợt 158–166; hướng (iii) đợt này rỗng theo cấu trúc, hướng (v) đợt 170 bị chặn do công cụ — không tính là âm tính). **Cửa R/J GIỮ NGUYÊN; không có mốc mới nào để thu hẹp.**

### 4.2 Điểm (m) #81 — DƯƠNG ỨNG VIÊN (đối chiếu độc lập — xem §1.1)

Tóm tắt: 1 requeue duy nhất trong cửa [17:02:05Z, 18:00:00Z] (mọi job): eid 10137, 17:02:38.477Z = btime +33,477 s ∈ [33; 49,8] (hơn biên dưới chỉ 0,477 s); run 171 đang chạy tại btime (event-based, đúng 1 run), bị viết lại 1 lần; spanning-bởi-started_at = 0 là artifact viết-lại-tự-loại. **T2-172 phán DƯƠNG ỨNG VIÊN — parent quyết cuối. Nếu chấp nhận: n 28→29 / 29→30.**

### 4.3 Điểm (m) #80 — KHÔNG PHẢI ĐIỂM (parent CHƯA QUYẾT (e) đợt 171 — xem §1.2)

Tóm tắt: T2-171 phán KHÔNG PHẢI ĐIỂM (0 requeue; 0 run sống tại btime). **T2-172 KHÔNG mở lại. n không đổi vì #80.**

### 4.4 Điểm (m) #79 — KHÔNG PHẢI ĐIỂM (parent ĐÃ QUYẾT — tham chiếu)

Quyết (e) đợt 170: **#79 KHÔNG PHẢI ĐIỂM** (requeue duy nhất +251,007 s, NGOÀI dải 201,207 s trên biên). **T2-172 KHÔNG mở lại.**

### 4.5 Lệch khung giờ biên #81 — OVERLAP THỨ TÁM

**Bằng chứng (T5-171 + T10-171 + T2-172 kiểm trực tiếp từ `round171-t5/replay-watch-171.log`, `round171-t9/ram-sampler.log` và `round172-t9/ram-sampler.log`):**

| Bằng chứng | Giá trị | Offset so với btime |
|---|---|---|
| **Biên #81 (btime 17:02:05Z):** | | |
| Poll cuối watcher-171 | **17:02:25Z** | **+20 s (OVERLAP — nội dung boot cũ SAU btime)** |
| Poll watcher-171 trước đó | 17:01:55Z / 17:01:25Z | −10 s / −40 s |
| Dòng sampler-171 cuối 2acdd1ab | **16:44:30Z** | **−1.055 s** (sampler ngừng ghi 16:44:30Z; không có sampler nào sau đó tới 17:38:45Z) |
| Dòng sampler-172 đầu 4b9db449 | 17:38:45Z | +2.200 s |
| Poll đầu watcher-172 | 17:41:39Z | +2.374 s |
| /proc/1 mtime (boot mới) | **17:02:16.745Z** | **+11,745 s** (T2-172) |
| journal first entry (boot mới) | 17:02:17Z | +12 s |
| wtmp begins (boot mới) | 17:02:16Z | +11 s |

**Tại #81: CÓ OVERLAP** — một dòng nội dung boot cũ duy nhất (poll watcher-171 17:02:25Z) nằm SAU btime #81 tới 20 s. Đây là OVERLAP thứ tám (#64?/ #66?/ #67?/ #74/ #76/ #78 + #81; xem F-172-T2-15). Một tiến trình boot cũ không thể poll sau khi máy reboot — dòng này là dị thường timestamp mà T10-171 đã ghi (poll 17:02:25Z không thể thuộc boot cũ theo nghĩa đen); T10-171 phán nó KHÔNG đủ lật 5 nguồn xác nhận reboot, T2-172 đồng ý (8 nguồn xác minh btime, xem §1.3). **Counterfactual (khung giờ boot cũ, neo = poll cuối +20 s): requeue offset sẽ là +13,477 s — DƯỚI dải.** Nhưng theo quy tắc đứng (quyết (e) đợt 165) + tiền lệ #71 (DƯƠNG đã chấp nhận với offset btime +41,274 s mặc dù neo lệch-khung 21,274 s DƯỚI dải), **verdict (m) #81 theo offset btime-tương đối +33,477 s — DƯƠNG ỨNG VIÊN — không đổi.** T2 ghi rõ cả hai hướng để parent quyết.

**Phán: OVERLAP tại #81 (thứ tám). (m) #81 DƯƠNG ỨNG VIÊN theo btime — parent quyết cuối.**

### 4.6 Nhãn n (tổng hợp)

- **n chính thức: GIỮ 14** (parent quyết; T2 không tự đổi).
- n ứng viên (nhánh khuyến nghị): **28** (24 dương + 4 âm — #74 đã CHẤP NHẬN theo quyết (f) đợt 168; **#78 đã CHẤP NHẬN DƯƠNG theo quyết (e)/(f) đợt 170 → 27→28**; #75/#76/#77/#79/#80 KHÔNG PHẢI ĐIỂM — n không đổi vì #79/#80; **#81 DƯƠNG ỨNG VIÊN — nếu parent chấp nhận: 28→29**).
- n ứng viên (nhánh #56 ÂM): **29** (24 dương + 5 âm — #56; **#78 đã chấp nhận → 28→29**; **#81 DƯƠNG ỨNG VIÊN — nếu parent chấp nhận: 29→30**).
- #56 vẫn CÓ ĐIỀU KIỆN (§4.1) — KHÔNG chốt n=15.
- #81 DƯƠNG ỨNG VIÊN — n đổi chỉ khi parent chấp nhận.

## 5. Probe EPERM #90 + sweep

**Probe #90 — CHẠY 17:39:15Z** (`probe-eperm-v2.sh once`, trước khi T4 bắt đầu attempt — T4 vẫn gate-polling lúc 17:56:51Z): boot 4b9db449, **ok=2 fail=0**, exit 0. Log `eperm-probe-v2.log` 258 → **260 dòng** (+1 dòng boot-changed 2acdd1ab → 4b9db449, +1 dòng probe#90); heartbeat n=90 (pid 6419, ts 17:39:15Z, boot 4b9db449-7699-4441-a4cf-72983f15dbbd). `=== probe end` vẫn **0 dòng** (1 dòng `=== probe start` duy nhất từ 11/11). **Cửa sổ probe #90: 14:48:02Z → 17:39:15Z = 10.273 s** (2h51m13s). MemAvailable lúc probe: KHÔNG ghi được tại đúng thời điểm (xem F-172-T2-7 — sampler-172 gần nhất 17:38:45Z mem=841.420 kB; free lúc 17:56Z: 2.517 MB). Sóng EPERM thật gần nhất vẫn ~11:55–12:11Z 11/11.

**Sweep #90** (`eperm-sweep9696.py`, 144 file `*.log` mtime trong cửa sổ): 4 file có hit, 11 occurrence — **0 sóng thật**:
- `proc_506c2c48e69a.log` (exec-log của CHÍNH phiên T2-172, mtime 17:38:57Z): "sóng EPERM đã tắt" ×1 — **trích dẫn** (output `m-check171.py`/`gaps171.py` mà T2 đọc đầu phiên; xem F-172-T2-3).
- `round171-t2/eperm-sweep171.log`: "Operation not permitted" ×1 — **trích dòng kết quả sweep #89** (dòng `proc_0ac1e67bd2b7.log: {'Operation not permitted': 111}` — cp -a ownership warning đã phân loại F-171-T2-12) + "sóng EPERM đã tắt" ×3 (dòng trạng thái).
- `round171-t0/o8-171t0.log` + `round171-t8/o8-171t8.log`: "sóng EPERM đã tắt" ×3 mỗi file (dòng trạng thái của T0/T8).
- 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO" mới. **0 sóng thật trong cửa sổ probe #90.**

## 6. Phương pháp, sai số của T2, câu hỏi cho parent

### 6.1 Phương pháp (tóm tắt — script trong `~/workspace/goals/capcut-clone-video-editor/hidden_files/round172-t2/`)

- (m): `m-check172.py` (epoch số học + đếm requeue theo cửa — DB đọc tươi qua muse.db, 7 query) + đối chiếu 3 nguồn (§1.1/§1.2) / tham chiếu (§1.2); `m56-172.py` (7 hướng mới) + 2 query DB hướng (vii) chạy riêng.
- INSIDE: `blind9696-gaps172.py` (FULL127, p10/p90 theo đúng phương pháp các đợt trước; kiểm lại FULL125/FULL126 độc lập bằng hai cách tính mới + đối chiếu FULL126 còn hiệu lực; reboot rate; FULL128 ghi rõ KHÔNG TÍNH ĐƯỢC).
- Mù: `blind9696-investigate.py` (5 scope, mtime float, merge — cửa sổ tới 18:00:00Z), `blind9696-content.py` (kiểm nội dung sampler/watcher từng đoạn + union-A/B — thêm sampler-171 FULL, watcher-171 FULL, sampler-172, watcher-172, SYS81), `blind9696-sessions.py` (jump witness + DD/MM carry-over + R-gap/H-U6 content-ts, xem F-171-T2-2/F-172-T2-1 — chạy lại với epoch đúng), `blind9696-merged.py` (gap file/union-A/union-B), `hole-recheck9696.py` (find toàn cây + float-trap — thêm H-T2/H-U12, nới H-U11, cập nhật H-T1/H-U1/H-U4; file MỚI, không ghi đè file cũ).
- Probe: `probe-eperm-v2.sh once` (probe #90) + `eperm-sweep9696.py` (sweep cửa sổ #90).
- **Caveat quét mù (F-172-T2-12):** B1 = 18:00:00Z là mốc cắt; vòng walk kết thúc 17:43:30Z nên các mốc U trong (17:43:30Z, 18:00:00Z] có thể thiếu — U-tail last mark 17:43:29Z khớp walk-end (merged U-tail 17:43:29Z; content U-tail 17:44:45Z do content chạy sau walk). U chỉ tham chiếu, hố max U kết thúc 07:22:14Z — không ảnh hưởng verdict nào. Ghi rõ để T2-173 dùng B1 = giờ chạy thực tế (đã làm đợt này).

### 6.2 Sai số của T2 đợt này (F-172-T2-*)

**F-172-T2-1 (lỗi tham số của chính T2 — bắt và chạy lại trước khi viết LIMITS, cùng họ F-171-T2-2):** lần chạy `blind9696-sessions.py` đầu tiên KHÔNG truyền argv GAP (GAP_R0/GAP_U0 = None → kiểm R-gap/H-U6 không chạy); lần chạy thứ hai truyền sai epoch R-gap (1795332929/1795334140 = 07:35:29–07:55:40Z 22/11 thay vì 11:15:29–11:35:40Z 21/11 — tự tính epoch nhầm ngày). Đã chạy lại lần thứ ba với epoch đúng (1795259729/1795260940, kiểm bằng `date -d`); LIMITS dùng lần chạy thứ ba (R-gap 3 hit + H-U6 0 hit). Hai lần chạy sai không ghi vào file sessions-9696.txt cuối (file bị ghi đè bởi lần chạy đúng; log lần sai đã xóa).

**F-172-T2-2 (lỗi tham số của chính T2 — assert bắt được, cùng họ F-163-T2-3):** sed thay cửa sổ sweep làm W0=W1=17:39:15Z (thay hai lần chồng nhau); assert `W0 < W1` trong script bắt được ngay, exit 1, 0 số sai vào log. Đã sửa trực tiếp 2 dòng W0/W1 bằng file tool và chạy lại OK (sweep #90: 144 file, 11 occurrence, 0 sóng thật).

**F-172-T2-3 (exec-log của chính phiên T2 làm phồng số đếm — xem §0.9):** `proc_506c2c48e69a.log` (agent 7b0156bc, phiên T2-172) chứa trích dẫn timestamp từ output các script đợt 171 mà T2 đọc lúc đầu phiên (lệnh `head blind9696-gaps171.py` + `head m-check171.py`); content-span của nó (11:15:18Z 21/11 → 14:52:09Z 22/11) làm jump-witness counts tăng +1 giả cho #65–#80 và góp 1× "sóng EPERM đã tắt" vào sweep #90. **Số thật sau khi trừ: #65: 6, #66: 7, #67: 7, #68: 7, #69: 3, #70: 6, #71: 6, #72: 4, #73: 4, #74: 5, #75: 4, #76: 2, #77: 2, #78: 2, #79: 0, #80: 0 — 0 hoạt động thật ở mọi reboot.** Bài học: từ đợt 173, T2 đếm jump witness TRỪ exec-log của chính phiên mình (lọc theo agent-id hiện tại) thay vì trừ tay sau khi chạy.

**F-172-T2-4 (U union-A max 1.067 → 1.118 s — trôi mốc, chỉ còn cách sàn 29 s):** file sessions e033d2dd-59b9-46f1-ac13-c851d51657ac.jsonl bị ghi thêm lúc 17:40:39Z trong phiên đợt 172 (live session) — mtime trôi 11:21:28Z → 17:40:39Z; hố union-A U nay 1.118 s (11:19:20→11:37:58), vẫn dưới sàn 1.147 s. **Vẫn ĐÓNG — nhưng biên mỏng nhất kể từ khi U được đo theo union.** Giao T2-173 theo dõi: nếu hố này vượt sàn thì U (tham chiếu) sẽ MỞ theo union — không đổi verdict #96? (R vẫn là đoạn quyết định) nhưng phải ghi rõ.

**F-172-T2-5 (27 exec-log bị XÓA giữa hai đợt — runtime dọn dẹp, KHÔNG phải trôi mtime):** 23 file có mtime trong T + 4 file có mtime trong đầu U (16:09:36–16:48:31) trong danh sách đợt 171 đều KHÔNG CÒN trên đĩa lúc T2-172 quét (kiểm `os.path.exists` từng file qua diff danh sách: 27/27 deleted, 0 moved; 0 file chỉ trôi mtime trong T/U-early). Hệ quả: T file-marks 231 → 211; T file max gap 307 s → 627 s (15:22:55→15:33:22); U file max gap 1.516 s → 2.335 s (16:09:36→16:48:31); jump witness #66 9→7 thật, #67 9→7 thật, #69 4→3 thật (3/2/1 file mất đều trong 27 file này — đối chiếu sessions-9696.txt đợt 171). Union-A/B T/U KHÔNG ĐỔI verdict (T 38 s; U 1.118 s). Verdict #96? không đổi (R vẫn mở). Lần thứ hai liên tiếp mất mát là XÓA hẳn (F-171-T2-3: 42 file) — ghi rõ, không giấu.

**F-172-T2-6 (m-check172.py hai lỗi gõ — bắt và sửa trước khi viết LIMITS):** (1) docstring ghi sampler-171 "btime −1.075 s" (sai — đúng là −1.055 s = 17m35s); (2) dòng in requeue bị "17:02:38Z.476Z" (định dạng ms thừa chữ Z + làm tròn .477 → .476). Đã sửa cả hai bằng file tool và chạy lại; LIMITS dùng output lần chạy đúng.

**F-172-T2-7 (MemAvailable lúc probe không ghi được tại đúng thời điểm):** T2-172 không chụp `/proc/meminfo` ngay lúc probe #90 chạy (17:39:15Z) — khác T2-171 (ghi 1.569 MB). Số gần nhất: sampler-172 17:38:45Z mem=841.420 kB; `free` lúc 17:56Z: MemAvailable 2.517 MB. Hai số khác xa nhau vì RAM dao động mạnh theo tải (script nặng của T2 chạy giữa hai mốc) — ghi cả hai kèm mốc giờ, không suy ra số lúc probe. Từ đợt 173, chụp meminfo cùng lệnh probe.

**F-172-T2-8 (hole-recheck: 3 trap cũ đã mất + 2 hố mới):** H-T1 (15:23:25→15:28:32) nay 0 hit — trap proc_f7ccbba2a25c.log bị xóa; H-U1 (16:25:06→16:40:12) nay 0 hit — trap proc_2a111ad13bcc.log bị xóa; H-U4 (16:13:06→16:25:06) nay 0 hit — trap proc_f4d2cc5e81cf.log bị xóa (cả ba đều trong 27 file bị xóa, xem F-172-T2-5). Hố mới H-T2 (15:22:55→15:33:22, T file max mới) + H-U12 (16:09:36→16:48:31, U file max mới) — cả hai 1 trap, 0 mới. H-U11 biên trái dời 11:21:28Z → 11:19:20Z (mốc 11:21:28Z trôi mất, xem F-172-T2-4); hố nay 1.118 s, vẫn 1 trap 0 mới.

**F-172-T2-9 ((m) #56 hướng (ii): atime — noatime, max đúng mốc đã biết):** /home/hatch mount noatime nên 343 hit atime-trong-D là atime đóng băng từ lúc tạo file, không phải bằng chứng đọc-trong-D. Max atime trong D = 20:19:34.327Z (sessions.json agent 964f2bc4) — ĐÚNG mốc max đã biết tới từng mili-giây; 0 atime nào muộn hơn → không thu hẹp. Ghi rõ giới hạn của hướng này để T2 sau không dùng atime làm neo độc lập.

**F-172-T2-10 ((m) #56 hướng (iii): 0 repo git local — hướng rỗng theo cấu trúc):** `~/workspace/repo-1` không có thư mục `.git` (cây file thuần); glob toàn `~/workspace` cũng 0 repo. Hướng git-log không có dữ kiện để kiểm — ghi là RỖNG, không tính là âm tính theo dữ kiện (khác 6 hướng còn lại).

**F-172-T2-11 (run 171 claimed→finished 82 s — ngoài họ 6–11 s):** claimed 17:28:04Z → finished 17:29:26Z = 82 s (run 170: 110 s; họ 6–11 s từ đợt 150). Ca thứ tư ≥60 s sau 66 s (164), 64 s (166), 108 s (167). Chỉ ghi nhận — kết cục run 171 thuộc T7-172, T2 không suy cơ chế. Margin run 171 vẫn rộng: 385 s (run 170: 888 s).

**F-172-T2-12 (B1 quét mù là mốc cắt 18:00:00Z — walk kết thúc 17:43:30Z):** các mốc U trong (17:43:30Z, 18:00:00Z] có thể thiếu trong danh sách merged (walk đã qua các cây trước khi mốc đó sinh ra; U-tail last mark 17:43:29Z khớp walk-end; content U-tail 17:44:45Z do content chạy sau walk). U chỉ tham chiếu, hố max U kết thúc 07:22:14Z — không ảnh hưởng verdict nào. Ghi rõ để T2-173 dùng B1 = giờ chạy thực tế (đã làm đợt này).

**F-172-T2-13 (khoảng không-sampler [16:44:30Z, 17:38:45Z] = 3.255 s chứa #81):** sampler-171 ngừng ghi 16:44:30Z (17m35s TRƯỚC #81); sampler-172 bắt đầu 17:38:45Z (boot+2.200 s). Không có quan sát sampler nào lúc #81 xảy ra — caveat cho T9-172 (cùng mẫu F-170-T2-6 cho #79, F-171-T2-6 cho #80). Watcher-171 vẫn poll tới 17:02:25Z nên biên #81 có quan sát watcher (dù là poll +20 s, xem §4.5).

**F-172-T2-14 (1 exec-log span đúng cửa D bị XÓA — nội dung trong D không khôi phục được):** proc_b6ce5fee0f84.log (agent f8a07232, mtime 15:02:43Z 21/11) có content-span đúng [19:04:44, 20:22:43] = cửa D — đã bị xóa giữa hai đợt (trong 27 file, xem F-172-T2-5). Min/max span của nó trùng đúng biên D nên nhiều khả năng nội dung của nó chỉ là trích biên cửa (cùng họ hole-recheck lo=19:32:59Z / trích D), không phải mốc độc lập — nhưng nội dung trong D của nó KHÔNG khôi phục được, ghi rõ caveat, không suy thêm (cùng họ F-171-T2-9).

**F-172-T2-15 (OVERLAP thứ tám tại #81 — poll watcher-171 +20 s sau btime):** poll cuối watcher-171 17:02:25Z = btime +20 s, nhãn boot cũ 2acdd1ab. T10-171 đã ghi là dị thường timestamp (một tiến trình boot cũ không thể poll sau reboot); T2-172 đồng ý — 8 nguồn xác minh btime vẫn đứng. Counterfactual khung cũ cho offset requeue +13,477 s (DƯỚI dải); verdict DƯƠNG theo quy tắc đứng btime + tiền lệ #71 (xem §4.5). Giao T0/T5-172 kiểm lại cách watcher ghi timestamp (cùng giao từ §10.5 (xii) aggregate 171).

**Đã biết, giao T10-172:** nhãn GAP §100 còn cũ so với quyết parent §12.3 đợt 170 (quyết (a)–(o) đã viết — §100 hiện vẫn ghi "chờ quyết parent §12.1 aggregate 171") — T10-172 cập nhật khi viết §101 (cùng mẫu F-168-T1-1/F-169-T1-1/F-170-T1-2/F-171-T1-2). Không thuộc phạm vi T2. **R9 (a) vẫn chờ user** (số đếm vẫn là 16); **G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời).

### 6.3 Câu hỏi cho parent (chờ quyết ở aggregate 172)

1. **(m) #81 DƯƠNG ỨNG VIÊN: chấp nhận?** (Requeue duy nhất eid 10137, 17:02:38.477Z = btime +33,477 s ∈ [33; 49,8] — hơn biên dưới chỉ 0,477 s; run 171 đang chạy tại btime, bị viết lại 1 lần; T2-172 đối chiếu độc lập. Nếu chấp nhận: n ứng viên 28→29 / 29→30. Caveat: OVERLAP thứ tám (poll watcher-171 +20 s) cho counterfactual +13,477 s DƯỚI dải — nhưng theo quy tắc đứng + tiền lệ #71, verdict theo offset btime. T0-172 chứng nhận số hiệu #81.)
2. **INSIDE chuỗi: #81 NGOÀI FULL127 (muộn 225 s) → chuỗi KHÔNG bắt đầu lại (vẫn đứt từ #80) — ghi nhận theo dải nào?** (FULL125/FULL126 kiểm lại độc lập ĐẠT — nợ F-171-T10-7 ĐÃ TRẢ. FULL127 (gap #80 NOMINAL 9.064 s): n=127, p10 1.572,60 s / p90 8.839,80 s; #81 NGOÀI [14:57:13Z, 16:58:20Z] neo 14:31:01Z (muộn 225 s); đối chiếu FULL126 cũng NGOÀI (muộn 12.273 s) — hai dải đồng thuận. FULL128 KHÔNG TÍNH ĐƯỢC đợt này — cần #82.)
3. **(m) #56: VẪN CÓ ĐIỀU KIỆN lần thứ 15 — CHƯA CHỐT?** (7 hướng mới đợt này: 6 âm tính + 1 hướng DB chỉ xác nhận lại mốc max 20:19:34Z; hướng git rỗng theo cấu trúc; cửa R/J giữ nguyên.)
4. **Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ — CERT/FULL GIỮ 76/91: ghi nhận?** (R 1.238/1.222/1.211 s — y hệt lần thứ tám; hole-recheck lần 16: 337 hit, 0 mới; U union-A max 1.118 s — chỉ còn cách sàn 29 s, theo dõi tiếp.)
5. **Lệch khung: #81 OVERLAP thứ tám (poll watcher-171 +20 s) — ghi nhận, không đổi verdict (m) theo quy tắc đứng?**
6. **Probe EPERM #90 (17:39:15Z, ok=2 fail=0; sweep 144 file, 11 occurrence, 0 sóng thật): ghi nhận?**
