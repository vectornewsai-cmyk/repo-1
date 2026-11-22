# PHASE9 ROUND 165 — T2 (mù #96? ĐIỀU TRA ĐẦY ĐỦ + EPERM + INSIDE #68/#69 + (m) #68/#69 đối chiếu + (m) #56 lần thứ tám) — LIMITS

**Đợt 165 mở 20:35:51Z 21/11/2026. Hạn cờ ~23:00Z, hạn cứng đóng 23:30Z. T2 viết 20:54Z.**
**KHÔNG push, KHÔNG release/tag. Chỉ stage 1 file (LIMITS này).**

## 0. Kết luận trước (headline)

1. **Probe EPERM #84: 20:39:20Z, boot 9a1a9319 (#69), ok=2 fail=0, log 241→244 (+3 đúng mẫu). Cửa sổ 17:44:45Z → 20:39:20Z = 10.475 s. 0 sóng EPERM thật trong cửa sổ** (sweep #84: 142 file `*.log`, 2 file có hit, 4 lần đều là "sóng EPERM đã tắt" — trích dẫn, không phải sóng sống; 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted").
2. **Boot #69 (9a1a9319, btime 20:09:31Z) — T0-165 xác minh 9 nguồn, KHÔNG nghịch lý đồng hồ; T7-165 xác minh 9 nguồn; T2-165 hỗ trợ (F128? +0,440…+1,322 s, drift 1,0024).** Gap #67→#68 = 1.983 s; gap #68→#69 = 7.381 s.
3. **Mù #96? (#64) — MỞ (ĐIỀU TRA ĐẦY ĐỦ, không còn sơ bộ):** đoạn R file 1.238 s / union-A 1.222 s / union-B 1.211 s (y hệt số sơ bộ T2-164 — quét tươi + kiểm nội dung đầy đủ xác nhận lại từng số); S ĐÓNG (file 843 s / union-A 662 s / union-B 591 s); T ĐÓNG (file 307 s / union-A 31 s). **Kết luận: #96? MỞ.**
4. **Mù #88? VẪN MỞ — hole-recheck lần thứ CHÍN: 337 hit, 0 mốc mới** (tám lần trước 345 hit — giảm 8 do 8 exec-log mtime trôi khỏi hố, 0 file mới; xem §2.6).
5. **INSIDE: #68 INSIDE dải FULL114 → chuỗi 3 LÊN 4 (biên dưới MỎNG 416 s); #69 INSIDE dải FULL115 → chuỗi 4 LÊN 5.** Cả hai dải CÓ ĐIỀU KIỆN (gap #67/#68 danh nghĩa, chưa vào CERT/FULL chính thức). Đối chiếu #69 vs dải FULL114 còn hiệu lực: NGOÀI muộn 561 s — chỉ để đối chiếu (cùng mẫu #67 vs FULL112 đợt 164), không phá chuỗi.
6. **(m) #68 — ĐỒNG Ý DƯƠNG (đối chiếu độc lập, 3 nguồn khớp):** requeue 18:07:17.131Z = btime +47,131 s ∈ [33; 49,8]. **(m) #69 — ĐỒNG Ý DƯƠNG (đối chiếu độc lập, 3 nguồn khớp):** requeue 20:10:06.432Z = btime +35,432 s ∈ [33; 49,8]. **NẾU parent CHẤP NHẬN cả hai: n ứng viên 21→23 (nhánh khuyến nghị: 20 dương + 3 âm) hoặc 22→24 (nhánh #56 ÂM: 20 dương + 4 âm). Chỉ #68: 21→22 / 22→23. Chỉ #69: 21→22 / 22→23. n chính thức GIỮ 14.**
7. **(m) #56: KHÔNG thu hẹp được lần thứ TÁM** (5 hướng mới đều âm tính). Cửa GIỮ NGUYÊN R [2,56251; 2,66817) / J [2,566; 2,80753] s. **#56 VẪN CÓ ĐIỀU KIỆN.**
8. **Run 164: SUCCEEDED 20:28:17Z (eid 9844), wall 10.346 s, margin 454 s, 2 lần viết lại (#68 + #69)** — lần đầu 2 lần viết lại kể từ đợt 159; claimed→finished 66 s (ngoài họ 6–11 s — T7-165 ghi nhận, không suy đoán).
9. **RAM trong cửa sổ probe #84: peak 45,65% guard; 0 mẫu ≥ guard; birefnet 0 lần thử, lần thứ 19 liên tiếp.** WFS #71 chênh 0 (992+25=1.017) lần thứ 71.
10. **Nhãn n: cơ sở hiện tại (đã cộng #66 theo quyết (f) đợt 164) là 21/22** (18 dương + 3 âm / 18 dương + 4 âm). Xem §4.4.

## 1. Checklist probe EPERM #84

| Hạng mục | Kết quả |
|---|---|
| Probe #83 (trước) | 17:44:45Z, boot f1d4ce1a, n=83 |
| `status` 20:39:16Z | DEAD/STALE, heartbeat n=83, ts 17:44:45Z, boot f1d4ce1a, tuổi 10.471 s, exit 1 |
| Log trước probe | 241 dòng |
| `status` ghi dòng DEAD | 241 → 242 (+1) |
| **`once` 20:39:20Z — probe #84** | **boot=9a1a9319, ok=2 fail=0, exit 0** |
| Log sau probe | 244 dòng (241→244 = +3 đúng mẫu: DEAD + boot-changed + probe#84) |
| Heartbeat mới | pid=9280, ts 20:39:20Z, boot 9a1a9319-3786-4add-8ffa-c51a1027946e, n=84 |
| `=== probe end` | vẫn 0 dòng (1 dòng `probe start` duy nhất từ 08:49:50Z 11/11) |
| **Cửa sổ probe #84** | **17:44:45Z → 20:39:20Z = 10.475 s** |

Sóng EPERM thật gần nhất ~11:55–12:11Z 11/11 (~248,5 h trước probe #84).

**Sweep #84** (`eperm-sweep9696.py`, 142 file `*.log` mtime trong cửa sổ): 2 file có hit, 4 lần — tất cả "sóng EPERM đã tắt": `proc_c540462a2ff4.log` ×1 (log quét WFS của chính T2-164, trích marker) + `o8-164t8.log` ×3 (log T8-164 trích kết quả sweep). 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted" — **0 sóng thật**.

## 2. Điều tra mù #96? (#64) — ĐẦY ĐỦ

Mù # = reboot # + 32. #96? = reboot #64, btime 11:15:18Z 21/11/2026. Sàn luật gap: **1.147 s (19'07")** — file max gap hoặc union max gap vượt sàn ⇒ MỞ.

### 2.1 Sự kiện + định nghĩa đoạn

Cửa sổ điều tra: **[11:15:18Z, 20:39:20Z] = 33.842 s** (btime #64 → probe #84). Các đoạn, neo bằng btime/probe:

| Đoạn | Cửa sổ | Độ dài | Mốc phải |
|---|---|---|---|
| R | [11:15:18, 11:38:28] | 1.390 s | btime #64 (11:15:18Z) → T0-163 lần đầu 11:38:28Z |
| S | [11:38:28, 14:41:28] | 10.980 s | T0-163 → probe #82 |
| T | [14:41:28, 16:06:45] | 5.117 s | probe #82 → btime #66 |
| U | [16:06:45, 20:39:20] | 16.355 s | btime #66 → probe #84 (thuộc #97?/#98?/#99?, chỉ tham chiếu) |

Quét tươi (`blind9696-investigate.py`): repo-1 41 file, hidden_files 1.180, ngoài cây 706, /tmp 9, fifth 5 → merged **882 mốc giây duy nhất** (T2-164: 610 — tăng do cửa sổ kéo dài tới probe #84, +272 mốc trong phần U mở rộng).

### 2.2 Đồng hồ, reboot #68 + #69 (T0-165 + T7-165 + T2-165 đối chiếu)

**Reboot #69 — T0-165 xác minh 9 nguồn (cờ 20:44Z, T2 đối chiếu):** boot_id 9a1a9319; `/proc/stat` btime 1795291771 = 20:09:31Z; `uptime -s` = 20:09:31Z; `/proc/1` mtime 20:09:42.436Z (+11,436 s); journal idx 0 duy nhất, first entry 20:09:42Z (+11 s); wtmp begins 20:09:42Z (+11 s); `last` reboot 20:09 still running; Cloudflare ±1 s; DB host-side (requeue 20:10:06.432Z + succeeded 20:28:17.866Z cùng khung thật). **KHÔNG nghịch lý đồng hồ.** Boot #68 chết trong (20:09:29Z, 20:09:31Z] — 0 overlap dài (T8-164 đóng cờ 20:09:29Z, đúng 2 s trước btime). Marker CÒN — sống qua **21 reboot #49–#69** (T0 đếm độc lập).

**T2-165 hỗ trợ (không thay T0):** F128? (`f128.py`, 20:41:27Z): example.com +1,322 s; google.com +0,779 s; cloudflare.com +0,440 s → **F128? ≈ +0,44…+1,32 s, đủ 3 server** — cả ba dương, dải rộng 0,88 s (rộng hơn F127? −0,36…+0,34 s; do Date header cắt giây + lệch độ trễ — xem F-165-T2-6; KHÔNG dùng để chứng nhận btime #69 là giờ thật — T0-165 9 nguồn + T7-165 Cloudflare ±1 s mới là căn cứ). Drift test (`drift-test.py`, xong ~20:44Z): server elapsed 180,0 s, local elapsed 180,4 s, **tỉ lệ 1,0024 ≈ 1,0**, offset change −0,440 s — clock chạy đúng tốc.

**Reboot #68 — T7-164 xác minh 9 nguồn (đợt 164):** boot 0c8a94aa; btime 1795284390 = 18:06:30Z; `uptime -s` khớp; `/proc/1` mtime 18:06:46.171Z (+16,171 s); journal first entry 18:06:46Z (+16 s); wtmp begins 18:06:46Z (+16 s); Cloudflare ±1 s ×2. Gap #67→#68 = **1.983 s** (ngắn nhất chuỗi gần đây); gap #68→#69 = **7.381 s**.

**Run 164 — kết cục (T7-165 NOTES đọc #1/#2 — T2 đối chiếu số học §4.3):** **SUCCEEDED 20:28:17Z** (event 20:28:17.866Z, eid 9844), wall từ started gốc 10.346 s, **margin 454 s** tới hạn 20:35:51Z (hẹp thứ 3 trong chuỗi 15 đợt từ 150, sau 177 s đợt 150 và 345 s đợt 157; hẹp hơn run 163 đúng 604 s), claimed→finished **66 s** (NGOÀI họ 6–11 s của run 154–163 — T7-165 ghi nhận, không suy đoán nguyên nhân), attempt 1, **2 lần viết lại (#68 + #69)** — lần đầu 2 lần viết lại kể từ đợt 159; 8 event đầy đủ, 0 event sau succeeded. Run 165 (`b548ba36`, sched 20:35:51Z) running lúc T7-165 đọc #2, jitter 0 s — kết cục thuộc T7-166.

**POSTBOOT_PASS / watcher (T5-165 sở hữu — chưa có cờ lúc T2 viết):** #67 CÒN, #65 CÒN; #63/#66 KHÔNG CÓ; **#68/#69 CHƯA CÓ** (T0-165). Watcher-165 chưa khởi động lúc T0 đóng. Watcher-164: START 17:40:59Z pid 5451, chết theo #68 (poll cuối 18:06:41Z — 11 s sau btime, đua với reboot; xem §2.3).

### 2.3 Hoạt động từng đoạn (merged log, mốc giây)

| Đoạn | Mốc giây | File-marks | Nhận xét |
|---|---|---|---|
| R [11:15:18, 11:38:28] | 14 | 56 | Hố 1.238 s (xem §2.4) — Y HỆT T2-164 |
| S [11:38:28, 14:41:28] | 253 | 676 | Đóng |
| T [14:41:28, 16:06:45] | 234 | 667 | Đóng |
| U [16:06:45, 20:39:20] | 381 | 737 | Đóng (tham chiếu) |

**Nội dung trong R (56 file-marks, kiểm tay — y hệt T2-164):** đầu 11:35:56Z tool-output exec-call agent 5001d1e4; 11:37:30Z tool-output agent 2c32ef43; 11:37:42Z sampler-162 scripts. R-head [11:15:18–11:34:25]: 0/0/0/0/0 mọi scope (trống). R-tail: repo-1=2 / hidden_files=51 / outside=3 / tmp=0 / fifth=0. **Mốc dpkg 11:35:40Z (TRONG hố R) là mốc nội dung THẬT:** hoạt động dpkg đầu trên #64, 2 dòng "startup packages configure", boot+20m22s — T0-162 quan sát trực tiếp từ dpkg.log #64 (dòng đầu 11:35:40Z; file đã reset theo #65/#66/#67/#68/#69, quan sát còn trong T0-162 LIMITS + aggregate 162). Cùng loại với mốc dpkg 08:35:41Z mà T2-162 đã tính cho đoạn N. Được tính vào cả UNION-A lẫn UNION-B. **Không có nguồn độc lập thứ ba cho R-head:** dpkg.log đã reset 5 lần kể từ #64; journal/dmesg chỉ còn boot hiện tại (journal xoay theo boot; dmesg EPERM) — ghi rõ, không giấu. R-head trống hoàn toàn trên mọi scope đo được.

**Nội dung khác (content script, `blind9696-content.py` — số khớp T2-164 từng dòng, cộng thêm sampler/watcher-164):** sampler-162 (d9a8d1ce) 1 dòng trong R (11:37:42Z, sau hố) + 138 dòng trong S; watcher-162 strict polls 331 trong S (predicate chặt `^timestamp boot=d9a8d1ce poll `; last poll 14:25:20Z — chết sớm, T0-163); watcher-161 linger polls sau btime #64: 0; sampler-163 3 dòng trong S tail + 45 dòng edb2acdb trong U (dòng cuối 16:52:21Z); watcher-163 163 poll trong T + **1 dòng trong U (poll cuối 16:06:54Z — poll đua với reboot #66, 9 s sau btime, nhãn boot cũ 1c1cf10c)**; **sampler-164 MỚI: 28 dòng f1d4ce1a + 107 dòng 0c8a94aa trong U (dòng cuối 19:53:52Z — KHÔNG có dòng nào trên #69, T9-165 sở hữu)**; **watcher-164 MỚI: 52 strict poll trong U (last poll 18:06:41Z — poll đua với reboot #68, 11 s sau btime, nhãn boot cũ f1d4ce1a — cùng mẫu watcher-163)**.

**Jump witness (hoạt động) tại #64/#65/#66/#67/#68/#69: đều = 0** (`blind9696-sessions.py`, 126 exec-log có mtime trong cửa sổ: R 1, S 34, T 33, U 58). Mọi hit regex đều là trích dẫn, đã kiểm tay từng hit:
- #64 (4 hit): proc_d8365be752b7.log, proc_32c9bb12db04.log, proc_9db5c8fba228.log, proc_b70bb0edc372.log (trích btime/dispatch/hợp hole-recheck) — y hệt T2-164.
- #65 (4 hit): d8365be752b7 + 9db5c8fba228 + b70bb0edc372 + proc_2fbfe27779af.log (MỚI — log của chính T2-164, trích biên đoạn 11:15:18/11:38:28/14:41:28/16:06:45/17:44:45).
- #66 (6 hit): f4d2cc5e81cf + 471dd8b624d5 + 9db5c8fba228 + 2fbfe27779af (MỚI, trích biên) + c540462a2ff4 (MỚI — log quét WFS của T2-164, trích 14:41:28/17:44:45) + b70bb0edc372.
- #67 (6 hit): 9db5c8fba228 + 2fbfe27779af (MỚI) + c540462a2ff4 (MỚI) + 7aedeeb5297e + 6ecb5bcb64ad + b70bb0edc372.
- #68 (4 hit): 9db5c8fba228 (trích hợp hole-recheck) + d8b6351398eb (trích btime #67 17:33:27Z + POSTBOOT_PASS 17:54:38Z) + 3c3d0c6723b7 (trích POSTBOOT_PASS #67 17:54:38Z) + cc179b1ce95a (trích btime #67 ×8 — log T7-164 xác minh #67).
- #69 (2 hit): 9db5c8fba228 + b6ce5fee0f84 (chỉ có time-only stamp 19:04:44/20:22:43 — trích cửa D ngày 20/11 của (m) #56 trong log T2-164; ngày bị gán theo mtime file 21/11 theo quy tắc F-158 — không phải hoạt động 21/11).
- Exec-log content-ts trong hố R union (11:15:29–11:35:40): 2 hit, 0 mốc hoạt động: 11:16:22Z (trích biên hố H-P1-old); 11:26:05Z (trích btime reboot #48 ngày 20/11).
- Exec-log content-ts trong hố U file max (17:20:48–17:36:14): 6 hit, cả sáu đều là 17:33:27Z = chính btime #67 (trích trong log T7-164/T2-164) — 0 mốc hoạt động.

### 2.4 Mốc merged + verdict (luật gap, sàn 1.147 s)

| Đoạn | File max gap | Union-A max gap | Union-B max gap | Verdict |
|---|---|---|---|---|
| **R** | **1.238 s** (11:15:18 → 11:35:56) | **1.222 s** (11:15:18 → 11:35:40) | **1.211 s** (11:15:29 → 11:35:40) | **MỞ (ĐẦY ĐỦ)** |
| S | 843 s | 662 s | 591 s | ĐÓNG |
| T | 307 s | 31 s | — | ĐÓNG |
| U | 926 s | 926 s | 773 s | ĐÓNG (tham chiếu) |

Union-A = mốc file + mốc hệ thống + mốc nội dung (dpkg 11:35:40Z); Union-B = Union-A + mốc hệ thống trước btime (11:15:29Z). **R: mọi cách đếm đều MỞ.** Biến thể +dispatch 11:35:51Z (DB, không tính vào union chính): 1.211 s — cũng MỞ. Kiểm chéo với mốc đã mất của T2-162 (11:16:22Z + 11:35:35Z): 11:16:22 → 11:35:40 = 1.158 s, vẫn MỞ đúng 11 s.

S khớp T2-164 về file (843 s) và union-B (591 s); union-A chênh +30 s (662 vs 632 — do mốc file 14:35:53Z bị mất từ lúc đó, xem F-165-T2-4). T đóng chắc (31 s). U: hố file max 926 s (17:20:48–17:36:14) tách thành 773 s + 153 s nhờ mốc hệ thống #67 17:33:41Z.

**Kết luận đầy đủ: #96? MỞ qua đoạn R. Không còn "sơ bộ" — quét tươi + kiểm nội dung + sessions + hole-recheck đều đã chạy đầy đủ đợt này và xác nhận lại từng số của T2-164.**

### 2.5 CERT/FULL ứng viên + INSIDE

**CERT/FULL chính thức GIỮ 76/91** (quyết (b) đợt 164; #95?/#94?/#77? vẫn mở). Gap #63 = 9.073 s cho ứng viên CERT95/FULL110.

**FULL114** (gap #67 NOMINAL 5.202 s, CÓ ĐIỀU KIỆN): n=114, mean 1h40'26", median 1h51'50", p10 0h26'08" (1.567,80 s), p90 2h26'43" (8.803,30 s), sd 0h56'30", min 0h00'55", max 5h43'18"; trong 90–150'=60, <60'=26, >180'=8, >240'=3.
**FULL115** (gap #68 NOMINAL 1.983 s, CÓ ĐIỀU KIỆN): n=115, mean 1h39'51", median 1h50'39", p10 0h26'09" (1.569,40 s), p90 2h26'35" (8.795,40 s), sd 0h56'36"; trong 90–150'=60, <60'=27, >180'=8, >240'=3.

Tái tính khớp T2-164 từng giây (FULL113 n=113, mean 1h40'33", median 1h53'00", p10 1.566,20 s / p90 8.811,20 s — khớp đúng số T2-164 in; FULL112/FULL111/FULL110 cũng khớp qua chuỗi exec).

**INSIDE:**
- **#68 INSIDE dải FULL114 [17:59:34Z, 20:00:10Z] neo 17:33:27Z** (biên dưới 416 s — MỎNG, biên trên 6.820 s) → **chuỗi 3 LÊN 4**.
- **#69 INSIDE dải FULL115 [18:32:39Z, 20:33:05Z] neo 18:06:30Z** (biên dưới 5.812 s, biên trên 1.414 s) → **chuỗi 4 LÊN 5**.
- Đối chiếu vs dải còn hiệu lực: #68 INSIDE cả FULL113 (biên 5.619/1.626 s); #69 NGOÀI FULL114 (muộn 561 s) — chỉ để đối chiếu, không phải dải đúng phương pháp (cùng mẫu #67 NGOÀI FULL112 muộn 1.891 s đợt 164 trong khi INSIDE FULL113).
- Tốc độ reboot: tới #68: 144 reboot / 261,81 h = 1 lần / 109,1 phút; tới #69: 145 reboot / 263,86 h = 1 lần / 109,2 phút (tới #67: 143/261,25 h = 109,6).

### 2.6 Hole-recheck

`hole-recheck9696.py`: find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp [19:32:59Z 20/11, 20:39:20Z 21/11]: **6.791 file**. Find stderr: 1 dòng — `/home/hatch/.stagged-uploads: Permission denied` (giới hạn đứng, thư mục mode 0000).

| Hố | Kết quả |
|---|---|
| H-R1 (11:15:18, 11:35:56) | **0 hit — 0 mốc mới** |
| H-R1-old (11:16:22, 11:35:35) | 0 hit |
| H-S1/H-S2/H-S3/H-T1/H-U1/H-U4 | mỗi hố 1 float-trap (cùng giây cạnh trái), 0 mới |
| H-U2 (17:20:48, 17:36:14 — bắc qua btime #67) | 1 inside = 1 trap (cạnh trái 17:20:48.627Z), 0 mới |
| H-U2-old (17:22:25, 17:35:37) | 0 hit |
| H-U3 (19:37:11, 19:49:46) | 10 inside = 10 trap (cùng giây 19:37:11, file stall T8-164), 0 mới |
| H-E1-88 (19:32:59Z, 20:17:30Z) | **337 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI — lần thứ CHÍN liên tiếp 0 mốc mới** |

Known base: 882 mốc giây đợt này; base #88? T2-157: 557 giây. **H-E1-88 giảm 345 → 337:** đối chiếu `holerecheck-all.txt` đợt 164 vs đợt này — 8 file "mất" đều là exec-log (`proc_*.log` dưới `~/workspace/agents/*/exec-logs/`) có mtime trôi ra khỏi hố do bị append thêm sau đó; 0 file thêm. Không phải mốc mới, không đổi verdict.

### 2.7 Verdict mù (tổng hợp)

| Mù | Verdict đợt 165 | Cơ sở |
|---|---|---|
| #96? (#64) | **MỞ (ĐẦY ĐỦ)** (R 1.238/1.222/1.211 s vượt sàn; S/T đóng) | Điều tra đầy đủ xong đợt này |
| #95? (#63) | **MỞ** (giữ nguyên quyết (b) đợt 164) | Không có bằng chứng mới |
| #94? (#62) | **MỞ** (giữ nguyên) | Không có bằng chứng mới |
| #88? | **VẪN MỞ** (lần thứ 9: 337 hit, 0 mới) | Hole-recheck §2.6 |
| #77? | **VẪN MỞ** (giữ nguyên) | Không có bằng chứng mới |

**CERT/FULL chính thức GIỮ 76/91** (vì #77?/#88?/#94?/#95? vẫn mở; #96? MỞ đầy đủ — chưa đổi được khi chưa chứng nhận theo thứ tự).

---

## 3. Mù #88? + #77? + #95?/#94? — giữ nguyên

- **#88?:** hole-recheck lần thứ CHÍN (§2.6): 337 hit, 0 mốc mới → **VẪN MỞ**.
- **#77?:** không có bằng chứng mới đợt này → **VẪN MỞ**.
- **#95?/#94?:** không có bằng chứng mới đợt này → **MỞ** (giữ nguyên verdict đợt 164). Không đo lại vì không có gì mới để đo (luật gap: chỉ kiểm lại khi có bằng chứng mới).
- **#96?:** MỞ ĐẦY ĐỦ (§2.4–2.6); không còn nợ điều tra.

---

## 4. Mô hình đồng hồ + điểm (m)

### 4.1 Điểm (m) #56 — thu hẹp cửa lần thứ TÁM: KHÔNG ĐẠT

Cửa hiện tại (Model 1, quyết (d) đợt 157): **R ∈ [2,56251; 2,66817), J ∈ [2,566; 2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN.** Dải requeue dương: **[33; 49,8] s** (max 49,761 s từ #50).

Năm hướng MỚI đã thử đợt này (không lặp 5 hướng đợt 164), tất cả âm tính:

1. **`/var/log/alternatives.log`: 0 dòng 2026-11-20** (file 900 B, chỉ có entry 21/11). **dpkg.log: 0 dòng 2026-11-20** (reset theo boot; file hiện tại từ boot #69).
2. **apt history.log: 0 dòng 2026-11-20; eipp.log.xz: 0 dòng 2026-11-20** (xzgrep); không có history.log.*.gz.
3. **`~/.cache` + `/tmp`: 0 file có mtime trong cửa D [19:04:44Z, 20:22:43Z] 20/11** (find float, epoch đúng 1795201484–1795206163 — xem F-165-T2-2).
4. **Chrome History sqlite: 5 profile cũ (round39/44/45, mtime 03–04/11), 0 visit trong cửa D** (tổng visits 3/1/1/1/0 — profile test, không phải profile duyệt live).
5. **wtmp/btmp/lastlog: mtime 20:09:42Z 21/11 (đầu boot #69)** — reset theo boot, không còn nội dung 20/11.

**Cửa GIỮ NGUYÊN. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức (ứng viên) GIỮ 14.**

### 4.2 Điểm (m) #68 — ĐỐI CHIẾU ĐỘC LẬP (nhiệm vụ chính): ĐỒNG Ý DƯƠNG

**Ba nguồn độc lập khớp nhau từng số:**

1. **T2-165 tính lại từ epoch thô** (`m-check9696.py`, script mới viết độc lập — không dùng appendix của T7):
   - requeue 18:07:17.131Z − btime #68 18:06:30Z = **47,131 s ∈ [33; 49,8] ✓**
   - dispatch 18:07:17.283Z − btime = 47,283 s; reattach 18:07:17.410Z − btime = 47,410 s (cùng trong dải)
   - started_at viết lại: 1795282551 → 1795284437 (delta 1.886 s); claimed_at KHÔNG ĐỔI 1795282551
   - spanning = 0 VÌ started_at viết lại thành sau btime (1795284437 > 1795284390) — **artifact viết-lại-tự-loại, không phải bằng chứng vắng mặt**
   - gap #67→#68 = 1.983 s; gap #68→#69 = 7.381 s
2. **T7-164 LIMITS §2.5/§2.6 (đọc DB tươi, nguồn độc lập thứ hai):** 7 lần đọc DB; đọc #1–#2 (17:40Z–18:06Z) run 164 `running`, started_at 1795282551 không đổi; đọc #3 (~18:07Z, SAU reboot #68) started_at ĐÃ ĐỔI thành 1795284437; đọc #4–#7 (18:33Z–19:50Z) started_at KHÔNG đổi lần nữa, claimed_at KHÔNG đổi lần nào; events 9801/9811/9812/9813 đúng từng mili-giây; requeue cửa rộng 18:06:30–19:50:00Z (mọi job): đúng 1 dòng (eid 9811).
3. **T7-165 NOTES đọc #1/#2 (đọc DB tươi đợt sau, nguồn độc lập thứ ba):** liệt kê lại đầy đủ chuỗi 8 event run 164 — 4 event đầu (9801/9811/9812/9813) khớp từng mili-giây với T7-164; T0-165 .done xác nhận run 164 có 2 lần viết lại (#68 + #69) — lần 1 tại #68 là tiền đề cho lần 2.

**Bằng chứng run 164 ĐANG CHẠY tại btime #68 (T7-164 + T7-165 + T0-165):** đọc #2 T7-164 (18:06:07Z) running, started gốc 17:35:51Z; 0 event finish trước btime; requeue/reattach tại +47 s; sleep #2 của chính T7 bị SIGTERM ~18:07:02Z (32 s sau btime) — cùng mẫu đợt 163; sampler T9-164 khởi động lại 18:07:49Z trên boot 0c8a94aa (gap phủ sóng 79 s sau btime).

**Kết luận: ĐỒNG Ý #68 là điểm DƯƠNG (m).** Requeue 47,131 s không mở rộng dải (max vẫn 49,761 s từ #50). **NẾU parent CHẤP NHẬN: n ứng viên 21→22 (nhánh khuyến nghị) hoặc 22→23 (nhánh #56 ÂM); n chính thức GIỮ 14.**

### 4.3 Điểm (m) #69 — ĐỐI CHIẾU ĐỘC LẬP: ĐỒNG Ý DƯƠNG

**Ba nguồn độc lập khớp nhau từng số:**

1. **T2-165 tính lại từ epoch thô** (`m-check9696.py`):
   - requeue 20:10:06.432Z − btime #69 20:09:31Z = **35,432 s ∈ [33; 49,8] ✓**
   - dispatch 20:10:06.539Z − btime = 35,539 s; reattach 20:10:06.678Z − btime = 35,678 s (cùng trong dải)
   - started_at viết lại: 1795284437 → 1795291806 (delta 7.369 s); claimed_at ĐỔI 1795282551 → 1795292831 (20:27:11Z) — **KHÁC #66/#68 (claimed không đổi): claimed đổi sau viết lại #69; T7-165 ghi rõ, T2 ghi nhận, không suy đoán nguyên nhân**
   - spanning = 0 VÌ started_at viết lại thành sau btime (1795291806 > 1795291771) — **artifact viết-lại-tự-loại**
   - run 164 finished 20:28:17Z = btime #69 +1.126 s (sau btime, không phải trước — khác #67)
2. **T7-165 NOTES đọc #1/#2 (phán chính thức của T7, nguồn độc lập thứ hai):** run 164 `succeeded` 20:28:17.866Z (eid 9844); started_at HIỆN TẠI 1795291806 (ĐÃ ĐỔI so với đọc #7 T7-164); claimed 1795292831; events đầy đủ 8 (9801/9811/9812/9813/9838/9839/9840/9844); requeue cửa rộng 20:09:31–20:40:00Z (mọi job): đúng 1 dòng (eid 9838); lean DƯƠNG ứng viên, KHÔNG ĐỔI từ đọc #1.
3. **T0-165 .done (đọc DB chỉ đọc + 9 nguồn boot, nguồn độc lập thứ ba):** #69 xác minh 9 nguồn, KHÔNG nghịch lý đồng hồ; requeue lần 2 tại #69 lúc 20:10:06.432Z (btime +35,432 s, TRONG dải [33; 49,8]), succeeded 20:28:17.866Z, 0 event sau; margin thô 454 s; marker CÒN qua 21 reboot.

**Bằng chứng run 164 ĐANG CHẠY tại btime #69:** đọc #7 T7-164 (19:50:23Z) running + 0 event finish trước btime + requeue/reattach tại +35 s + succeeded sau btime 20:28:17Z.

**Kết luận: ĐỒNG Ý #69 là điểm DƯƠNG (m).** Requeue 35,432 s không mở rộng dải (max vẫn 49,761 s từ #50). **NẾU parent CHẤP NHẬN #69 (sau #68): n ứng viên 22→23 (nhánh khuyến nghị) hoặc 23→24 (nhánh #56 ÂM); chỉ #69 (nếu #68 chưa chấp nhận): 21→22 / 22→23. n chính thức GIỮ 14.**

### 4.4 Nhãn n (quyết (f) đợt 164 — cập nhật đúng ngay từ đầu, không lặp F-163-T1-5)

- **Cơ sở hiện tại (đã cộng #66 DƯƠNG theo quyết (f) đợt 164): n ứng viên = 21 (nhánh khuyến nghị: 18 dương + 3 âm #38/#45/#62) hoặc 22 (nhánh #56 ÂM: 18 dương + 4 âm).**
- **Nếu parent CHẤP NHẬN #68 DƯƠNG (§4.2): n ứng viên = 22 (19 dương + 3 âm) hoặc 23 (19 dương + 4 âm).**
- **Nếu parent CHẤP NHẬN thêm #69 DƯƠNG (§4.3): n ứng viên = 23 (20 dương + 3 âm) hoặc 24 (20 dương + 4 âm).**
- **n chính thức (ứng viên) GIỮ 14** cho đến khi #56 được quyết.

---

## 5. RAM trong cửa sổ probe #84

Guard 6.144 MiB = 6.291.456 kB; balloon ceiling 6.443.824 kB. Sampler T9-164 (round164-t9/ram-sampler.log, 135 dòng tổng) + T9-165 (round165-t9/ram-sampler.log, 9 dòng — đã có khi T2 chạy).

| Nguồn | Mẫu trong cửa sổ | Boot | Peak | % guard | ≥ guard | Balloon (==ceiling) |
|---|---|---|---|---|---|---|
| T9-164 | 130 | f1d4ce1a (n=23) + 0c8a94aa (n=107) | 2.871.796 kB | 45,65% | 0 | 35 |
| T9-165 | 1 | 9a1a9319 (20:38:51Z) | 643.180 kB | 10,22% | 0 | 0 |
| **Toàn cửa sổ** | **131** | — | **2.871.796 kB** | **45,65%** | **0** | **35** |

- f1d4ce1a: n=23, peak 2.871.796 kB (45,65% guard). 0c8a94aa: n=107, peak 2.821.760 kB (44,85% guard). 9a1a9319: n=1, peak 643.180 kB (10,22% guard).
- Balloon 35 = toàn bộ E-165 (khớp T9/T10-164: 35 mẫu, 1 episode theo quyết (j) đợt 164).
- **birefnet 0 lần thử, lần thứ 19 liên tiếp** (peak toàn cửa sổ 45,65% guard, cách guard 3.419.660 kB).
- Lưu ý cận dưới: sampler T9-164 dừng 19:53:52Z (dòng cuối); không có mẫu 19:53:52Z → 20:38:51Z (2.699 s, chứa reboot #69) — peak trong quãng này là cận dưới (cùng họ F-142-T2-10 / T2-164 §5).

---

## 6. Phương pháp, sai số riêng, câu hỏi cho parent

### 6.1 Phương pháp

- **btime CHỈ từ `/proc/stat btime`** (quyết (e) đợt 156). Đồng hồ boot #69: T0-165 9 nguồn + T7-165 9 nguồn là căn cứ chính; T2-165 chỉ hỗ trợ (F128? + drift).
- **Luật gap (sàn 1.147 s):** file max gap hoặc union max gap (union-A = file + hệ thống + nội dung; union-B = union-A + mốc hệ thống trước btime) vượt sàn ⇒ MỞ.
- **(m):** T2 không tự query scheduler DB (T7 sở hữu) — đối chiếu qua NOTES T7-164/T7-165 + T0-165 .done + tính lại từ epoch thô bằng script riêng.
- **WFS:** đếm theo DÒNG, chỉ file có count > 0; NEWSTD + R7b + copies; kiểm async `.writeFile(` có giới hạn.
- **EPERM sweep:** chỉ đếm marker trong `*.log` có mtime trong cửa sổ probe (không grep -r bừa — F-150-T2-2).
- **INSIDE:** dải cho reboot #k = FULL(110+k−64) neo btime #(k−1) — mẫu: #66→FULL112, #67→FULL113, #68→FULL114, #69→FULL115 (xem F-165-T2-1).
- **Prereg:** viết TRƯỚC probe #84 (~20:40Z), lean kiểm lại ở §6.2.

### 6.2 Sai số riêng (F-165-T2-*)

- **F-165-T2-1:** bản đầu `blind9696-gaps.py` ghi nhãn #69 kiểm theo dải FULL114 (neo 17:33:27Z) là "phương pháp đúng" và FULL115 là "dải cho #70" — SAI NHÃN. Đúng: #69 kiểm theo FULL115 neo 18:06:30Z (mẫu FULL112→#66, FULL113→#67, FULL114→#68 ⇒ FULL115→#69; mỗi dải gồm gap kết thúc tại neo của nó). Bắt được khi đối chiếu lại mẫu trước khi viết LIMITS; các số đều tính đúng, chỉ nhãn sai; đã sửa script + chạy lại. Hậu quả nếu không bắt: chuỗi INSIDE bị ghi 4 rồi đứt (do #69 NGOÀI FULL114 muộn 561 s) thay vì đúng là lên 5.
- **F-165-T2-2:** hướng (iii) (m) #56 lần chạy đầu truyền sai epoch (1763664284/1763668963 ≈ 20/11/2025 thay vì 1795201484/1795206163); kết quả 0 lần đầu KHÔNG CÓ GIÁ TRỊ. Bắt được khi đối chiếu epoch với btime #64 (1795259718); chạy lại với epoch đúng (đã kiểm bằng python trước) → vẫn 0. Không ảnh hưởng verdict.
- **F-165-T2-3:** docstring `blind9696-investigate.py`/`blind9696-merged.py` ban đầu ghi đoạn U = 15.195 s — SAI; đúng là 16.355 s (16:06:45→20:39:20). Số script in đúng; đã sửa docstring trước khi chạy merged.
- **F-165-T2-4:** S union-A trôi 632 s (T2-164) → 662 s: mốc file 14:35:53Z bị mất (file runtime bị ghi đè lần nữa — cùng hiện tượng mốc 14:35:37Z mất ở đợt 164). Verdict ĐÓNG không đổi. Ghi nhận, không phải lỗi phương pháp.
- **F-165-T2-5:** prereg dự đoán WFS #71 tăng +1 dòng/file do LIMITS T2-164 — SAI: LIMITS T2-164 có 0 lần xuất hiện "writeFileSync" (grep -c = 0); delta thực tế 0. Chênh 0 vẫn giữ.
- **F-165-T2-6 (ghi nhận, không phải lỗi):** F128? cả ba server đều dương (+0,440…+1,322 s), dải rộng 0,88 s — rộng hơn F127? (−0,36…+0,34 s). Nguyên nhân: Date header cắt giây + lệch độ trễ từng lần đo. KHÔNG dùng F128? để chứng nhận btime #69 là giờ thật — căn cứ là T0-165 (9 nguồn) + T7-165 (Cloudflare ±1 s).
- **F-165-T2-7 (ghi nhận, không phải lỗi):** hole-recheck H-E1-88 giảm 345 → 337 hit: 8 exec-log có mtime trôi ra khỏi hố do bị append thêm; 0 file thêm, 0 mốc mới. Verdict #88? VẪN MỞ không đổi.

**Prereg (§6.1, viết trước probe #84) kiểm lại:** (a) #96? R MỞ đầy đủ ✓ (số y hệt sơ bộ: file 1.238 / union-A 1.222 / union-B 1.211 s); S/T ĐÓNG ✓; (b) #88? 337 hit / 0 mới, lần 9 ✓ (prereg ước ~345 hit — thực 337, chênh 8 do mtime trôi, xem F-165-T2-7; verdict 0 mới không đổi); (c) #95?/#94?/#77? giữ MỞ ✓; (d) INSIDE #68/#69 ✓ (prereg ước p10/p90 FULL114 ≈ 26'–2h26' — thực 26'08"/2h26'43'; lean INSIDE cả hai ✓; chuỗi 3→4→5 ✓ — nhưng biên dưới #68 chỉ 416 s, KHÔNG "thoải mái" như prereg viết; phương pháp #69 đã sửa theo F-165-T2-1); (e) (m) #68 ĐỒNG Ý DƯƠNG ✓; (f) (m) #69 — prereg "CHƯA BIẾT, chờ T7-165": thực tế T7-165 NOTES đã có lúc T2 chạy → ĐỒNG Ý DƯƠNG ✓; (g) (m) #56 5 hướng mới đều âm tính ✓ (lần thứ tám); (h) WFS #71 chênh 0 ✓ (nhưng delta 0, không phải +1 như prereg — xem F-165-T2-5), EPERM 0 sóng ✓, RAM < guard ✓, birefnet 0 lần ×19 ✓; (i) boot #69 — T0-165 9 nguồn ✓; (j) gap #67 danh nghĩa 5.202 s làm cơ sở FULL114 ✓, gap #68 danh nghĩa 1.983 s làm cơ sở FULL115 ✓.

**WFS #71** (scan-wfs71.sh, 20:48:34–20:49:04Z): NEWSTD 992 dòng / 296 file (phạm vi 3.447 file); R7B 1.017 / 313 (12.840 file); copies 25 / 17; **992+25=1.017, chênh 0 — lần thứ 71 liên tiếp.** Delta vs #70: 0 dòng / 0 file (LIMITS T2-164 có 0 "writeFileSync" — xem F-165-T2-5). Async `.writeFile(`: 2 helper đã biết (eperm-retry.mjs, epermRetry.js) + 1 dist copy + 2 vendored gradio (out of scope); 0 stray trong source.

**Đối chiếu cờ các luồng (lúc T2 viết, ~20:54Z):** T0-165 DONE 20:44Z (boot #69 9 nguồn, marker 21, run 164 requeue #69 +35,432 s + succeeded 20:28:17.866Z). T1/T4/T5/T6/T7/T8/T9-165 chưa đóng lúc T2 viết — T7-165 NOTES đọc #1/#2 đã đủ cho (m) #68/#69; T5-165 sở hữu POSTBOOT_PASS #68/#69 + watcher-165.

### 6.3 Câu hỏi cho parent

(a) **CHẤP NHẬN #68 là điểm DƯƠNG (m)?** (đối chiếu độc lập 3 nguồn, §4.2). Nếu CHẤP NHẬN: n ứng viên 21→22 (nhánh khuyến nghị) hoặc 22→23 (nhánh #56 ÂM); n chính thức GIỮ 14.
(b) **CHẤP NHẬN #69 là điểm DƯƠNG (m)?** (đối chiếu độc lập 3 nguồn, §4.3). Nếu CHẤP NHẬN cả #68 + #69: n ứng viên 21→23 (nhánh khuyến nghị) hoặc 22→24 (nhánh #56 ÂM); n chính thức GIỮ 14. Lưu ý: claimed_at ĐỔI sau viết lại #69 (khác #66/#68) — có ảnh hưởng gì tới cách tính (m) không, hay chỉ là chi tiết ghi nhận?
(c) **#96? MỞ (ĐIỀU TRA ĐẦY ĐỦ) — ghi nhận?** (R 1.238/1.222/1.211 s vượt sàn; S/T đóng.) **#95?/#94? MỞ — ghi nhận? #88?/#77? VẪN MỞ — ghi nhận?** CERT/FULL chính thức GIỮ 76/91?
(d) **INSIDE chuỗi: #68 INSIDE FULL114 → chuỗi 3 LÊN 4 (biên dưới MỎNG 416 s); #69 INSIDE FULL115 → chuỗi 4 LÊN 5 — ghi nhận?** Cả hai có điều kiện, dải danh nghĩa. Đối chiếu #69 vs FULL114 còn hiệu lực NGOÀI muộn 561 s — ghi nhận là đối chiếu, không phá chuỗi?
(e) **Gap #67 danh nghĩa 5.202 s / gap #68 danh nghĩa 1.983 s — giữ CHƯA đưa vào CERT/FULL chính thức** (chờ #96?/#97?/#98?/#99? đóng)? Chỉ dùng làm cơ sở danh nghĩa cho FULL114/FULL115?
(f) **#56 VẪN CÓ ĐIỀU KIỆN** (lần thứ tám không thu hẹp được) — có hướng neo mới nào parent muốn T2-166 thử (đã thử đợt này: alternatives/dpkg/apt/eipp 0 dòng 20/11, find ~/.cache//tmp 0 file trong cửa D, Chrome History 0 visit, wtmp reset theo boot)?
(g) **Run 164 SUCCEEDED 20:28:17Z, margin 454 s, 2 lần viết lại — ghi nhận?** Claimed→finished 66 s (ngoài họ 6–11 s) — ghi nhận là chi tiết, không suy đoán?
(h) **#88? hole-recheck lần thứ 10 ở đợt 166?** (Lần 9: 337 hit, 0 mới; số hit giảm do mtime trôi — có cần đổi cách đếm cơ sở không, hay giữ nguyên?)

---

## 7. File + stage

**LIMITS này:** `docs/PHASE9_ROUND165_T2_EPERM_LIMITS.md` (1 entry, stage duy nhất).

**File làm việc (round165-t2):** prereg-t2.md, f128.py, f128.txt, drift-test.py, drift-test.txt, blind9696-gaps.py, blind9696-gaps.log, blind9696-investigate.py, blind9696-investigate.log, blind9696-repo-1.txt, blind9696-hidden_files.txt, blind9696-outside.txt, blind9696-tmp.txt, blind9696-fifthscope.txt, blind9696-merged.py, blind9696-merged.log, blind9696-content.py, blind9696-content.log, blind9696-sessions.py, blind9696-sessions.log, sessions-9696.txt, hole-recheck9696.py, hole-recheck9696.log, holerecheck-all.txt, find-stderr.txt, scan-wfs71.sh, scan-wfs71.log, scan-meta.txt, files-newstd.bin, files-r7b.bin, files-copies.txt, wfs-newstd.txt, wfs-r7b.txt, wfs-copies.txt, eperm-sweep9696.py, eperm-sweep9696.txt, ram-max9696.py, ram-max9696.txt, m-check9696.py, m-check9696.txt.

**Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round165-t2-eperm.txt` (NUL-delimited, 1 entry — LIMITS này). KHÔNG push.

**Nợ mở giao đợt 166 (T2-166):** hole-recheck #88? lần thứ 10; kết cục run 165 (T7-166); POSTBOOT_PASS #68/#69 + watcher-165 (T5-165/166); (m) #56 thử thu hẹp lần thứ chín (chờ parent trả lời (f)); (m) #70 nếu có reboot mới; INSIDE #70 (dải FULL116 neo 20:09:31Z nếu #69 đóng); prune/WFS/EPERM/RAM/birefnet thường kỳ; G1 chờ user quyết; u2net là fallback chính thức; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại.
