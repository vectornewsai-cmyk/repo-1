# PHASE9 ROUND 167 — T2 (mù #96? theo dõi tiếp + EPERM #86 + INSIDE #71 + (m) #71 đối chiếu độc lập + (m) #72 + (m) #73 + (m) #56 lần thứ mười) — LIMITS

**Đợt 167 mở 02:35:51Z 22/11/2026. Hạn cờ ~05:00Z, hạn cứng đóng 05:30Z 22/11. T2 viết ~03:00Z 22/11.**
**KHÔNG push, KHÔNG release/tag. Chỉ stage 1 file (LIMITS này).**

> **GHI CHÚ ĐỨNG (quyết (e) đợt 165 — nhắc lại, áp dụng cho #71/#72/#73; quyết (e) đợt 166 áp dụng đầy đủ cho #70): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Dữ kiện T5-165 (poll cuối watcher-164 sau btime #68 11 s) và T5-166 (poll cuối watcher-165 sau btime #70 6 s) chứng minh boot cũ sống quá btime mới — đó là OVERLAP (đã xác nhận đợt 161), KHÔNG phải bằng chứng offset requeue sai. Offset requeue đo từ btime trong khung giờ boot mới (giờ thật) — đúng khung giờ dải 33–49,8 s được hiệu chuẩn. Đợt này: poll cuối watcher-166 sau btime #71 20 s (§4.5) — OVERLAP thứ tư, áp dụng cùng ghi chú.

## 0. Kết luận trước (headline)

1. **Probe EPERM #86: 02:39:11Z, boot b643911f (#73), ok=2 fail=0, log 247→250 (+3 đúng mẫu). Cửa sổ 23:40:09Z → 02:39:11Z = 10.742 s. 0 sóng EPERM thật trong cửa sổ** (sweep #86: 120 file `*.log`, 1 file có hit, 3 lần đều là "sóng EPERM đã tắt" — trích dẫn, không phải sóng sống; 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted").
2. **Reboot #73 MỚI (b643911f, btime 02:28:01Z) xảy ra 7m50s TRƯỚC khi đợt 167 mở** — T0-167 xác minh 9/9 nguồn, T7-167 xác minh 9 nguồn, T1-167 ghi nhận btime + boot_id; gap #72→#73 = 1.376 s (ngắn nhất chuỗi gần đây, trước đó #67→#68 1.983 s). **#72 (9e089ef6, btime 02:05:05Z): T0-167 xác minh bổ sung 7/9 nguồn** (5 đồng thời của T10-166 + mốc file + DB hồi cứu); 2 nguồn KHÔNG có bằng chứng, không khôi phục được từ boot #73 (/proc/1, Cloudflare-đồng-thời) — T0 KHÔNG claim đầy đủ 9 nguồn cho #72. **Marker CÒN — sống qua 25 reboot #49–#73** (T0-167 đếm độc lập).
3. **Mù #96? (#64) — VẪN MỞ (theo dõi tiếp, quét tươi + kiểm nội dung đầy đủ):** đoạn R file 1.238 s / union-A 1.222 s / union-B 1.211 s (y hệt T2-164/T2-165/T2-166, không đổi một giây); S ĐÓNG (file 843 s / union-A 662 s / union-B 591 s); T ĐÓNG (file 307 s / union-A 31 s). **Kết luận: #96? VẪN MỞ.**
4. **Mù #88? VẪN MỞ — hole-recheck lần thứ MƯỜI MỘT: 337 hit, 0 mốc mới** (y hệt lần 9/lần 10 — 337 hit, không trôi thêm; xem §2.6 + F-167-T2-1). **#95?/#94?/#77? giữ nguyên** (không có bằng chứng mới). CERT/FULL chính thức GIỮ 76/91.
5. **INSIDE: #71 INSIDE dải FULL117 [22:31:37,6Z, 00:31:44,6Z] neo 22:05:25Z (biên dưới 5.782,4 s, biên trên 1.424,6 s) → chuỗi 6 LÊN 7.** Dải CÓ ĐIỀU KIỆN (gap #67/#68/#69/#70 danh nghĩa, chưa vào CERT/FULL chính thức). Đối chiếu #71 vs dải FULL116 còn hiệu lực: NGOÀI muộn 5.521,5 s — chỉ để đối chiếu (cùng mẫu #69 vs FULL114 đợt 165, #70 vs FULL115 đợt 166), không phá chuỗi. **Bổ sung: #72 INSIDE dải FULL118 → chuỗi 7 LÊN 8 (nếu #71 được xác nhận); #73 NGOÀI SỚM 199,8 s so với dải FULL119 → chuỗi ĐỨT tại #73.**
6. **(m) #71 — ĐỒNG Ý DƯƠNG (đối chiếu độc lập, 4 nguồn khớp):** requeue 00:08:41.274Z = btime +41,274 s ∈ [33; 49,8]. Parent đã CHẤP NHẬN #71 DƯƠNG ở quyết (f) đợt 166 (đối chiếu độc lập thuộc T2-167 — nay đã có). **N ứng viên 24→25 (nhánh khuyến nghị) hoặc 25→26 (nhánh #56 ÂM) theo quyết (f) — đối chiếu này xác nhận; n chính thức GIỮ 14.**
7. **(m) #72 — ĐỒNG Ý DƯƠNG (ứng viên, đối chiếu độc lập, 4 nguồn khớp):** requeue 02:05:44.548Z = btime +39,548 s ∈ [33; 49,8] (T0-167 ghi .547Z — chênh 1 ms, xem F-167-T2-4 — verdict không đổi). **Nếu parent CHẤP NHẬN: n ứng viên 25→26 (nhánh khuyến nghị) hoặc 26→27 (nhánh #56 ÂM); n chính thức GIỮ 14.**
8. **(m) #73 — KHÔNG PHẢI ĐIỂM:** 0 requeue trong cửa 02:28:01–02:40:00Z (mọi job); 0 run đang chạy tại btime (run 166 finish 02:27:00Z — 61 s TRƯỚC btime; run 167 start 02:35:51Z — 470 s SAU btime). Chữ ký giống #52/#61/#67. **N không đổi vì #73.**
9. **(m) #56: KHÔNG thu hẹp được lần thứ MƯỜI** (5 hướng — 4 hướng mới hoàn toàn + 1 hướng xác nhận lại bằng float-mtime ở độ chính xác dưới-giây — đều âm tính). Cửa GIỮ NGUYÊN R [2,56251; 2,66817) / J [2,566; 2,80753] s. **#56 VẪN CÓ ĐIỀU KIỆN; KHÔNG chốt n=15.**
10. **Run 166: SUCCEEDED 02:27:00Z (eid 9931), wall 10.269 s, margin 531 s tới hạn 02:35:51Z (hẹp thứ 5/17 từ đợt 150), 2 lần viết lại (#71 +41,274 s; #72 +39,548 s), claimed→finished 64 s — NGOÀI họ 6–11 s (gần ngoại lệ 66 s của run 164).** Run 167 running, jitter 0 s lần thứ 20 liên tiếp — kết cục thuộc T7-168.
11. **RAM trong cửa sổ probe #86: peak 69,93% guard (4.399.884 kB — cùng đỉnh phiên T9-166 lúc 00:01:51Z); 0 mẫu ≥ guard; birefnet 0 lần thử, lần thứ 21 liên tiếp.** WFS #73 chênh 0 (995+25=1.020) lần thứ 73.
12. **Lệch khung giờ biên #70/#71 (§4.5): poll cuối watcher-166 lúc 00:08:20Z, SAU btime #71 20 s** (mạnh hơn #70: 6 s; #68: 11 s) — NHƯNG bằng chứng khung mới (/proc/1 +15,954 s = 00:08:15.954Z) đến TRƯỚC poll cuối khung cũ 4 s: hai khung giờ MÂU THUẪN nhau (khoảng neo "thật" RỖNG) — neo khung cũ KHÔNG dùng được; áp dụng ghi chú đứng, (m) #71 DƯƠNG đứng theo btime.

## 1. Checklist probe EPERM #86

| Hạng mục | Kết quả |
|---|---|
| Probe #85 (trước) | 23:40:09Z, boot d1ddd946, n=85 |
| `status` 02:39:08Z | DEAD/STALE, heartbeat n=85, ts 23:40:09Z, boot d1ddd946, tuổi 10.739 s, exit 1 |
| Log trước probe | 247 dòng |
| `status` ghi dòng DEAD | 247 → 248 (+1) |
| Dòng boot-changed | 248 → 249 (+1, d1ddd946 → b643911f) |
| **`once` 02:39:11Z — probe #86** | **boot=b643911f, ok=2 fail=0, exit 0** |
| Log sau probe | 250 dòng (247→250 = +3 đúng mẫu: DEAD + boot-changed + probe#86) |
| Heartbeat mới | pid=5604, ts 02:39:11Z, boot b643911f-d49c-44a0-8048-82984d3461c5, n=86 |
| `=== probe end` | vẫn 0 dòng (1 dòng `probe start` duy nhất từ 08:49:50Z 11/11) |
| **Cửa sổ probe #86** | **23:40:09Z → 02:39:11Z = 10.742 s** |

Sóng EPERM thật gần nhất ~11:55–12:11Z 11/11 (~255 h trước probe #86).

**Sweep #86** (`eperm-sweep9696.py`, 120 file `*.log` mtime trong cửa sổ): 1 file có hit, 3 lần — tất cả "sóng EPERM đã tắt": `o8-166t8.log` ×3 (log T8-166 trích kết quả sweep). 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted" — **0 sóng thật**.

## 2. Điều tra mù #96? (#64) — THEO DÕI TIẾP (quét tươi + kiểm nội dung đầy đủ)

Mù # = reboot # + 32. #96? = reboot #64, btime 11:15:18Z 21/11/2026. Sàn luật gap: **1.147 s (19'07")** — file max gap hoặc union max gap vượt sàn ⇒ MỞ.

### 2.1 Sự kiện + định nghĩa đoạn

Cửa sổ điều tra: **[11:15:18Z, 02:39:11Z] = 55.433 s** (btime #64 → probe #86). Các đoạn, neo bằng btime/probe:

| Đoạn | Cửa sổ | Độ dài | Mốc phải |
|---|---|---|---|
| R | [11:15:18, 11:38:28] | 1.390 s | btime #64 (11:15:18Z) → T0-163 lần đầu 11:38:28Z |
| S | [11:38:28, 14:41:28] | 10.980 s | T0-163 → probe #82 |
| T | [14:41:28, 16:06:45] | 5.117 s | probe #82 → btime #66 |
| U | [16:06:45, 02:39:11] | 37.946 s | btime #66 → probe #86 (thuộc #97?/#98?/#99?/#100?, chỉ tham chiếu) |

Quét tươi (`blind9696-investigate.py`): repo-1 66 file, hidden_files 1.919, ngoài cây 896, /tmp **0**, fifth 4 → merged **1.372 mốc giây duy nhất** (T2-166: 1.120 — tăng 252 do cửa sổ kéo dài tới probe #86). **/tmp = 0 file (đợt 166: 594): /tmp là tmpfs, bị xóa sạch bởi reboot #73** (boot mới b643911f lúc 02:28:01Z) — không phải mất dữ liệu điều tra (mọi file /tmp trong cửa sổ đều đã được quét ở các đợt trước khi reboot xóa chúng; xem F-167-T2-3).

### 2.2 Đồng hồ, reboot #72/#73 (T0-167 + T7-167 + T1-167 + T2-167 đối chiếu)

**Reboot #73 — T0-167 xác minh 9/9 nguồn (cờ 02:41Z, T2 đối chiếu):** boot_id b643911f; `/proc/stat` btime 1795314481 = 02:28:01Z; uptime -s 02:28:01Z; /proc/1 mtime 02:28:13.096Z (+12,096 s); journal idx 0 duy nhất, first entry 02:28:13Z (+12 s); wtmp begins 02:28:13Z (+12 s); `last` reboot 02:28 still running; `who -b` 02:28; Cloudflare ±0 s. **KHÔNG nghịch lý đồng hồ.** Marker CÒN — sống qua **25 reboot #49–#73** (T0 đếm độc lập). Gap #72→#73 = **1.376 s** (22m56s — ngắn nhất chuỗi gần đây; trước đó #67→#68 1.983 s). **#73 xảy ra 7m50s TRƯỚC khi đợt 167 mở (02:35:51Z)** — T10-166 đóng sổ trên boot #72 (9e089ef6), T1-167 kiểm lúc mở 02:37Z đã là boot #73, không reboot mới trong phiên T1.

**Reboot #72 — T0-167 xác minh bổ sung 7/9 nguồn** (5 đồng thời của T10-166 + mốc file + DB hồi cứu: btime 1795313105 = 02:05:05Z; boot_id 9e089ef6-3892-4506-b1aa-b43aa2900fbe; uptime -s 02:05:05Z; DB run 166 eid 9925 requeued 02:05:44.547Z); **2 nguồn KHÔNG có bằng chứng, không khôi phục được từ boot #73 (/proc/1, Cloudflare-đồng-thời) — T0 KHÔNG claim đầy đủ 9 nguồn cho #72.** Gap #71→#72 = **7.025 s**.

**Run 166 — kết cục (T7-167 NOTES đọc #1 + appendix167.txt — T2 đối chiếu số học §4.2/§4.3):** **SUCCEEDED 02:27:00Z** (event 02:27:00.229Z, eid 9931), wall từ started gốc 10.269 s, **margin 531 s** tới hạn 02:35:51Z (hẹp thứ 5/17 trong chuỗi từ đợt 150; hẹp hơn run 165 đúng 451 s), claimed→finished **64 s** (NGOÀI họ 6–11 s của run 154–163/165 — gần ngoại lệ 66 s của run 164), attempt 1, **2 lần viết lại (tại #71 + #72)**; 8 event đầy đủ, 0 event sau succeeded. Finish **61 s TRƯỚC btime #73** nên #73 không viết lại run 166. Run 167 (`ddb28fcb`, sched 02:35:51Z) running lúc T7-167 đọc #1, jitter 0 s (lần thứ 20 liên tiếp), 1 event dispatched 02:35:51.065Z (eid 9933) — kết cục thuộc T7-168.

**POSTBOOT_PASS / watcher (T5-167 sở hữu — chưa có cờ lúc T2 viết):** #70 CÒN, #69 CÒN, #67 CÒN; #63/#66/#68 KHÔNG CÓ; **#71/#72/#73 CHƯA CÓ** (T0-167). Watcher-166 chết theo #71 (xem §2.3). Watcher-167 chưa khởi động lúc T0 đóng.

### 2.3 Hoạt động từng đoạn (merged log, mốc giây)

| Đoạn | Mốc giây | File-marks | Nhận xét |
|---|---|---|---|
| R [11:15:18, 11:38:28] | 14 | 56 | Hố 1.238 s (xem §2.4) — Y HỆT T2-164/T2-165/T2-166 |
| S [11:38:28, 14:41:28] | 252 | 480 | Đóng — mốc giây 253→252 do 1 file đổi mtime (xem ghi chú dưới) |
| T [14:41:28, 16:06:45] | 234 | 667 | Đóng |
| U [16:06:45, 02:39:11] | 872 | 1.682 | Đóng theo union (xem §2.4) — hố file max 1.407 s, chỉ tham chiếu |

**Ghi chú S (253→252 mốc giây, 481→480 file-marks):** mốc giây mất là 11:41:54Z của file `~/workspace/feed/media/index.json` — file này bị hệ thống feed ghi lại, mtime hiện tại 23:43:45Z 21/11 (đã chuyển sang đoạn U). Không phải mất dữ liệu. **Đính chính số liệu đợt 166 (F-167-T2-5):** LIMITS T2-166 §2.3 ghi S "676 file-marks" là SAI — tính lại từ chính file investigate của round166-t2 = **481** (round165-t2 = 481, round164-t2 = 482; phương pháp đếm đã kiểm khớp với merged script ở cả ba đoạn R/T/U của đợt 166 và 167). Mốc giây S (253) và các gap S (843/662/591 s) của T2-166 đều ĐÚNG — chỉ số file-marks sai, không đổi verdict (verdict S dựa trên gap theo mốc giây, không dựa trên số file-marks).

**Nội dung trong R (56 file-marks, kiểm tay — y hệt T2-164/T2-165/T2-166):** đầu 11:35:56Z tool-output exec-call agent 5001d1e4; 11:37:30Z tool-output agent 2c32ef43; 11:37:42Z sampler-162 scripts. R-head [11:15:18–11:34:25]: 0/0/0/0/0 mọi scope (trống). R-tail: repo-1=2 / hidden_files=51 / outside=3 / tmp=0 / fifth=0. **Mốc dpkg 11:35:40Z (TRONG hố R) là mốc nội dung THẬT:** hoạt động dpkg đầu trên #64, 2 dòng "startup packages configure", boot+20m22s — T0-162 quan sát trực tiếp từ dpkg.log #64 (dòng đầu 11:35:40Z; file đã reset theo #65/#66/#67/#68/#69/#70/#71/#72/#73, quan sát còn trong T0-162 LIMITS + aggregate 162). Cùng loại với mốc dpkg 08:35:41Z mà T2-162 đã tính cho đoạn N. Được tính vào cả UNION-A lẫn UNION-B. **Không có nguồn độc lập thứ ba cho R-head:** dpkg.log đã reset 9 lần kể từ #64; journal/dmesg chỉ còn boot hiện tại (journal xoay theo boot; dmesg EPERM) — ghi rõ, không giấu. R-head trống hoàn toàn trên mọi scope đo được.

**Nội dung khác (content script, `blind9696-content.py` — số R/S/T khớp T2-166 từng dòng, cộng thêm sampler/watcher-166 + sampler-167):** sampler-162 (d9a8d1ce) 1 dòng trong R (11:37:42Z, sau hố) + 138 dòng trong S; watcher-162 strict polls 331 trong S (last poll 14:25:20Z — chết sớm, T0-163); watcher-161 linger polls sau btime #64: 0; sampler-163 3 dòng trong S tail + 45 dòng edb2acdb trong U (dòng cuối 16:52:21Z); watcher-163 163 poll trong T + **1 dòng trong U (poll cuối 16:06:54Z — poll đua với reboot #66, 9 s sau btime, nhãn boot cũ 1c1cf10c)**; sampler-164: 28 dòng f1d4ce1a + 107 dòng 0c8a94aa trong U (dòng cuối 19:53:52Z); watcher-164: 52 strict poll trong U (last poll 18:06:41Z — poll đua với reboot #68, 11 s sau btime, nhãn boot cũ f1d4ce1a); sampler-165: 88 dòng 9a1a9319 + 46 dòng d1ddd946 trong U (dòng cuối 22:51:29Z); watcher-165: 164 strict poll trong U (last poll 22:05:31Z — poll đua với reboot #70, 6 s sau btime, nhãn boot cũ 9a1a9319); **sampler-166 MỚI ĐẦY ĐỦ: 30 dòng d1ddd946 + 93 dòng ea73ac4f trong U (dòng cuối 01:41:07Z — sampler dừng 01:41:07Z, T9-167 sở hữu từ 02:35:51Z)**; **watcher-166 MỚI: 56 strict poll trong U (last poll 00:08:20Z — poll đua với reboot #71, 20 s sau btime, nhãn boot cũ d1ddd946 — cùng mẫu watcher-163/164/165, xem §4.5)**; **sampler-167 MỚI: 1 dòng b643911f trong U (02:38:33Z — trong cửa sổ tới probe #86)**.

**Jump witness (hoạt động) tại #64–#73: đều = 0 hoạt động thật** (`blind9696-sessions.py`, 186 exec-log có mtime trong cửa sổ: R 1, S 34, T 33, U 118). Mọi hit regex đều là trích dẫn hoặc artifact phương pháp, đã kiểm tay từng hit:
- #64 (5 hit), #65 (5 hit), #66 (7 hit), #67 (7 hit), #68 (5 hit), #69 (3 hit), #70 (3 hit) — y hệt T2-166 (4 hit cũ + proc_82da543947c6.log MỚI mỗi btime, cùng mẫu trích dẫn).
- **#71 (2 hit — MỚI):** proc_67205a208d61.log (window-map-71 của T9-166: sampler lines 23:39:50Z/23:40:50Z boot d1ddd946 TRƯỚC #71 + sampler lines 00:11:04Z/00:12:04Z boot ea73ac4f SAU #71 — cả hai nhóm đều được in vào file này SAU reboot, lúc 00:10:40–00:12:11Z; nhóm trước-btime là trích dẫn dòng log cũ, không phải hoạt động của session này qua reboot) + proc_9f64a205f621.log (log phiên T5-167 trích poll watcher-166 00:07:20Z/00:07:50Z/**00:08:20Z** + REPLAY_DONE/FLAG-WRITTEN 23:40:45Z — poll 00:08:20Z chính là dữ kiện lệch khung §4.5, trích từ replay-watch-165.log). **Cả hai đều là trích dẫn — 0 hoạt động thật bắc qua btime #71.**
- **#72 (2 hit — MỚI) / #73 (2 hit — MỚI):** cùng 2 file trên — span chỉ tồn tại nhờ **max ảo TS_RE2** (xem F-167-T2-1): regex bare-time `(\d\d):(\d\d):(\d\d)Z` khớp cả timestamp đầy đủ "2026-11-21T23:40:50Z" rồi gán ngày = ngày mtime file (22/11) → max ảo 22/11 23:40:50Z/23:40:45Z. Max thật của hai file là 00:12:11Z và 00:08:20Z — đều TRƯỚC btime #72/#73. **0 hoạt động thật bắc qua btime #72 hay #73.**
- Exec-log content-ts trong hố R union (11:15:18–11:35:40): 3 hit, 0 mốc hoạt động: 11:16:22Z ×2 (trích biên hố H-P1-old) + 11:26:05Z ×1 (trích btime reboot #48 ngày 20/11) — y hệt T2-166.
- Exec-log content-ts trong hố U file max H-U5 (22:09:05–22:32:32): 2 hit, 0 mốc hoạt động: 22:30:00Z ×2 (mốc "22:30:00Z" tương lai trong log T4/T7-166 — file mtime 20:41:27Z/21:00:21Z, TRƯỚC 22:30:00Z nên không thể chứa hoạt động thật tại 22:30:00Z).

### 2.4 Mốc merged + verdict (luật gap, sàn 1.147 s)

| Đoạn | File max gap | Union-A max gap | Union-B max gap | Verdict |
|---|---|---|---|---|
| **R** | **1.238 s** (11:15:18 → 11:35:56) | **1.222 s** (11:15:18 → 11:35:40) | **1.211 s** (11:15:29 → 11:35:40) | **MỞ (y hệt T2-166)** |
| S | 843 s | 662 s | 591 s | ĐÓNG |
| T | 307 s | 31 s | — | ĐÓNG |
| U | **1.407 s** (22:09:05 → 22:32:32) | 926 s | 773 s | ĐÓNG theo union (tham chiếu) |

Union-A = mốc file + mốc nội dung (dpkg 11:35:40Z); Union-B = Union-A + mốc hệ thống trước btime (11:15:29Z) + mốc đầu boot #71 (00:08:16Z) + #72 (02:05:17Z). **R: mọi cách đếm đều MỞ — y hệt T2-164/T2-165/T2-166 từng giây.** Biến thể +dispatch 11:35:51Z (DB, không tính vào union chính): 1.211 s — cũng MỞ.

**U — hố file max 1.407 s (22:09:05→22:32:32, như đợt 166):** hố nằm trong phiên T10-165 đóng sổ (sau reboot #70, trước khi đợt 165 đóng); được lấp đầy bởi mốc nội dung sampler-165 d1ddd946 (dòng mỗi 60 s: 22:09:xx–22:32:xx) → union-A 926 s / union-B 773 s — **ĐÓNG theo union**. Hole-recheck H-U5 (§2.6) xác nhận 0 file mới ở độ chính xác float trong hố này. U chỉ tham chiếu cho #96? — không đổi verdict R.

S khớp T2-166 về file (843 s) và union-B (591 s); union-A 662 s (giữ nguyên từ T2-166). T đóng chắc (31 s).

**Kết luận đầy đủ: #96? VẪN MỞ qua đoạn R. Quét tươi + kiểm nội dung + sessions + hole-recheck đều đã chạy đầy đủ đợt này và xác nhận lại từng số của T2-166 (R/S/T không đổi một giây).**

### 2.5 CERT/FULL ứng viên + INSIDE

**CERT/FULL chính thức GIỮ 76/91** (quyết (b) đợt 164, giữ theo quyết (m) đợt 165 và quyết (m) đợt 166; #95?/#94?/#77? vẫn mở). Gap #63 = 9.073 s cho ứng viên CERT95/FULL110.

**FULL117** (gap #70 NOMINAL 6.954 s, CÓ ĐIỀU KIỆN): n=117, mean 1h40'11", median 1h53'00", p10 0h26'13" (1.572,60 s), p90 2h26'20" (8.779,60 s), sd 0h56'10", min 0h00'55", max 5h43'18"; trong 90–150'=62, <60'=27, >180'=8, >240'=3.
**FULL118** (gap #71 NOMINAL 7.355 s, CÓ ĐIỀU KIỆN — bổ sung cho INSIDE #72): n=118, mean 1h40'22", median 1h53'21", p10 0h26'14" (1.574,20 s), p90 2h26'12" (8.771,70 s), sd 0h55'58", min 0h00'55", max 5h43'18"; trong 90–150'=63, <60'=27, >180'=8, >240'=3.
**FULL119** (gap #72 NOMINAL 7.025 s, CÓ ĐIỀU KIỆN — bổ sung cho INSIDE #73): n=119, mean 1h40'31", median 1h53'42", p10 0h26'16" (1.575,80 s), p90 2h26'04" (8.763,80 s), sd 0h55'45", min 0h00'55", max 5h43'18"; trong 90–150'=64, <60'=27, >180'=8, >240'=3.
**FULL115/FULL116 kiểm lại:** p10/p90 KHỚP T2-166 từng số (FULL115 1.569,40/8.795,40 s; FULL116 1.571,00/8.787,50 s — script có assert, không trôi chuỗi).

Tốc độ reboot: tới #71: 147 reboot / 267,83 h = 1 lần / 109,3 phút; tới #72: 148 reboot / 269,78 h = 1 lần / 109,4 phút; tới #73: 149 reboot / 270,16 h = 1 lần / 108,8 phút (tới #70: 146/265,79 h = 109,2).

**INSIDE:**
- **#71 INSIDE dải FULL117 [22:31:37,6Z, 00:31:44,6Z] neo 22:05:25Z** (biên dưới 5.782,4 s, biên trên 1.424,6 s) → **chuỗi 6 LÊN 7**.
- Đối chiếu vs dải còn hiệu lực: #71 NGOÀI FULL116 (muộn 5.521,5 s) — chỉ để đối chiếu, không phải dải đúng phương pháp (cùng mẫu #69 NGOÀI FULL114 muộn 561 s đợt 165 trong khi INSIDE FULL115; #70 NGOÀI FULL115 muộn 5.540 s đợt 166 trong khi INSIDE FULL116).
- **Nhãn dải — kiểm lại đúng phương pháp (bài học F-165-T2-1):** #71 kiểm theo FULL117 neo btime #70 (mẫu FULL112→#66, FULL113→#67, FULL114→#68, FULL115→#69, FULL116→#70 ⇒ FULL117→#71; mỗi dải gồm gap kết thúc tại neo của nó). FULL116 chỉ là dải đối chiếu còn hiệu lực, KHÔNG phải dải phương pháp cho #71.
- **Bổ sung cho T10-167: #72 INSIDE dải FULL118 [00:34:14,2Z, 02:34:11,7Z] neo 00:08:00Z** (biên dưới 5.450,8 s, biên trên 1.746,7 s) → **chuỗi 7 LÊN 8 (nếu #71 được xác nhận). #73 NGOÀI dải FULL119 [02:31:20,8Z, 04:31:08,8Z] neo 02:05:05Z — SỚM 199,8 s** (gap #73 chỉ 1.376 s — ngắn nhất chuỗi gần đây) → **chuỗi ĐỨT tại #73.**

### 2.6 Hole-recheck

`hole-recheck9696.py`: find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp [19:32:59Z 20/11, 02:39:11Z 22/11]: **8.086 file**. Find stderr: 1 dòng — `/home/hatch/.stagged-uploads: Permission denied` (giới hạn đứng, thư mục mode 0000). **KIỂM TRƯỚC KHI CHẠY (bài học F-166-T2-2): `grep ^W =` → round167-t2 ✓; `grep ^hi =` → 02:39:11Z 22/11 ✓; KHÔNG dùng `#` làm delimiter; output vào thư mục RIÊNG round167-t2. File `round166-t2/holerecheck-all.txt` md5 KHÔNG ĐỔI sau lần chạy (0434b26b… — kiểm lại sau khi chạy).**

| Hố | Kết quả |
|---|---|
| H-R1 (11:15:18, 11:35:56) | **0 hit — 0 mốc mới** |
| H-R1-old (11:16:22, 11:35:35) | 0 hit |
| H-S1/H-S2/H-S3/H-T1/H-U1/H-U4 | mỗi hố 1 float-trap (cùng giây cạnh trái), 0 mới |
| H-U2 (17:20:48, 17:36:14 — bắc qua btime #67) | 1 inside = 1 trap (cạnh trái 17:20:48.627Z), 0 mới |
| H-U2-old (17:22:25, 17:35:37) | 0 hit |
| H-U3 (19:37:11, 19:49:46) | 10 inside = 10 trap (cùng giây 19:37:11, file stall T8-164), 0 mới |
| **H-U5 (22:09:05, 22:32:32)** | **1 inside = 1 trap (cạnh trái 22:09:05.886Z, proc_5c237211ba31.log), 0 mới** |
| H-E1-88 (19:32:59Z, 20:17:30Z) | **337 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI — lần thứ MƯỜI MỘT liên tiếp 0 mốc mới** |

Known base: 1.372 mốc giây đợt này; base #88? T2-157: 557 giây. **H-E1-88 giữ 337 hit — y hệt lần 9/lần 10, không trôi thêm** (lần 10 giảm 345 → 337 do 8 exec-log mtime trôi; đợt này 0 file trôi thêm).

### 2.7 Verdict mù (tổng hợp)

| Mù | Verdict đợt 167 | Cơ sở |
|---|---|---|
| #96? (#64) | **VẪN MỞ** (R 1.238/1.222/1.211 s vượt sàn; S/T đóng) | Quét tươi + kiểm nội dung đầy đủ, số y hệt T2-166 |
| #95? (#63) | **MỞ** (giữ nguyên quyết (b) đợt 164) | Không có bằng chứng mới |
| #94? (#62) | **MỞ** (giữ nguyên) | Không có bằng chứng mới |
| #88? | **VẪN MỞ** (lần thứ 11: 337 hit, 0 mới) | Hole-recheck §2.6 |
| #77? | **VẪN MỞ** (giữ nguyên) | Không có bằng chứng mới |

**CERT/FULL chính thức GIỮ 76/91** (vì #77?/#88?/#94?/#95? vẫn mở; #96? VẪN MỞ — chưa đổi được khi chưa chứng nhận theo thứ tự).

---

## 3. Mù #88? + #77? + #95?/#94? — giữ nguyên

- **#88?:** hole-recheck lần thứ MƯỜI MỘT (§2.6): 337 hit, 0 mốc mới → **VẪN MỞ**.
- **#77?:** không có bằng chứng mới đợt này → **VẪN MỞ**.
- **#95?/#94?:** không có bằng chứng mới đợt này → **MỞ** (giữ nguyên verdict đợt 164/165/166). Không đo lại vì không có gì mới để đo (luật gap: chỉ kiểm lại khi có bằng chứng mới).
- **#96?:** VẪN MỞ (§2.4–2.6); theo dõi tiếp đợt 168.

---

## 4. Mô hình đồng hồ + điểm (m)

### 4.1 Điểm (m) #56 — thu hẹp cửa lần thứ MƯỜI: KHÔNG ĐẠT

Cửa hiện tại (Model 1, quyết (d) đợt 157): **R ∈ [2,56251; 2,66817), J ∈ [2,566; 2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN.** Dải requeue dương: **[33; 49,8] s** (max 49,761 s từ #50).

Năm hướng đã thử đợt này (4 hướng HOÀN TOÀN MỚI + 1 hướng xác nhận lại bằng float-mtime ở độ chính xác dưới-giây), tất cả âm tính:

1. **(i) Find `/tmp` + `/opt` + `/etc` + `/srv`, mtime float trong cửa D [19:04:44Z, 20:22:43Z] 20/11 (epoch 1795201484–1795206163, đã kiểm bằng python trước): 0 file.** (Đợt 166 chỉ quét `/home/hatch` + `/var/log`.) Find stderr 2 dòng: `/opt/hatch-image/models` + `/etc/hatch/credentials` — Permission denied (giới hạn: 2 thư mục hệ thống không đọc được — ghi rõ, không giấu; không có lý do gì để hoạt động D nằm trong đó, nhưng T2 không khẳng định thay cho dữ liệu không đọc được.)
2. **(ii) Chromium/Chrome Sessions: 0 file session nào tồn tại** (không có thư mục Sessions trong `~/.config/chromium/` hay `~/.config/google-chrome/`; không có Last Session/Last Tabs). Đợt 165 chỉ kiểm History sqlite (0 visit) — hướng Sessions nay đã kiểm, cũng 0.
3. **(iii) Kiểm lại dưới-giây mốc D-wall muộn nhất (MỚI — xác nhận lại bằng float-mtime): find `/home/hatch` + `/var/log` mtime trong [20:16:36Z, 20:16:37Z] 20/11: đúng 3 file, TẤT CẢ session 6fc7dd16** — prompt-continuity .6189958980Z, .jsonl .6979959010Z, sessions.json **.6998032740Z** (max). **Không có mốc D nào muộn hơn 20:16:36.699Z → cận dưới R GIỮ NGUYÊN 2,56251.** (Hướng này xác nhận ở độ chính xác dưới-giây kết luận T2-158 (ii) — không có mốc D nào muộn hơn.)
4. **(iv) `/dev/shm`: 0 entry (trống — tmpfs bị xóa bởi mọi reboot kể từ #64; đã kiểm, ghi rõ là trống chứ không phải không kiểm).**
5. **(v) `/var/log/apt/history.log` (1.894 B): 0 Start-Date nào ngày 2026-11-20** — không có hoạt động apt nào trong cửa D.

**Cửa GIỮ NGUYÊN. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức (ứng viên) GIỮ 14. T2-167 KHÔNG chốt n=15.**

### 4.2 Điểm (m) #71 — ĐỐI CHIẾU ĐỘC LẬP (nhiệm vụ chính): ĐỒNG Ý DƯƠNG

**Bốn nguồn độc lập khớp nhau từng số:**

1. **T2-167 tính lại từ epoch thô** (`m-check9696.py`, script mới viết độc lập — không dùng appendix của T7):
   - requeue 00:08:41.274Z − btime #71 00:08:00Z = **41,274 s ∈ [33; 49,8] ✓**
   - dispatch 00:08:41.339Z − btime = 41,339 s; reattach 00:08:41.407Z − btime = 41,407 s (cùng trong dải)
   - started_at viết lại lần 1: 1795304151 → 1795306121 (delta 1.970 s); claimed_at 1795314356 = finished − 64 s
   - spanning = 0 VÌ started_at viết lại thành sau btime (1795306121 > 1795306080) — **artifact viết-lại-tự-loại, không phải bằng chứng vắng mặt**
   - gap #70→#71 = 7.355 s; gap #71→#72 = 7.025 s; gap #72→#73 = 1.376 s
   - run 166 finished 02:27:00Z = btime #71 + 7.140 s (sau btime)
2. **T7-166 LIMITS §2.2–2.3 + §7 (đọc DB tươi đợt 166, nguồn độc lập thứ hai):** run 166 dispatched 23:35:51.144Z (trước btime #71 32m09s) + 0 event finish trước btime + requeue/reattach tại +41,274 s + succeeded sau btime 02:27:00Z; requeue cửa rộng 00:08:00–00:30:00Z (mọi job): đúng 1 dòng — requeue run 166 (eid 9898); T7 xác minh #71 9 nguồn (boot_id + btime + uptime -s + /proc/1 +15,954 s + journal +16 s + wtmp +16 s + last reboot + who -b; Cloudflare ±1 s ×8).
3. **T7-167 NOTES đọc #1 + appendix167.txt (đọc DB tươi đợt 167, nguồn độc lập thứ ba):** run 166 8 event đầy đủ (9888 dispatched 23:35:51.144Z; 9898 requeued 00:08:41.274Z #71; 9899 dispatched 00:08:41.339Z; 9900 reattached 00:08:41.407Z; 9925 requeued 02:05:44.548Z #72; 9926 dispatched 02:05:44.589Z; 9927 reattached 02:05:44.637Z; 9931 succeeded 02:27:00.229Z); 0 event sau succeeded; run 166 ĐANG CHẠY tại btime #71 (đọc #2 T7-166 00:05:19Z running; 0 event finish trước btime).
4. **T0-167 .done + NOTES (DB hồi cứu + xác minh 9 nguồn #73, nguồn độc lập thứ tư):** run 166 events 8, requeue #71 00:08:41.274Z eid 9898 (+41,274 s); #73 xác minh 9 nguồn (boot_id + btime + uptime -s + /proc/1 +12,096 s + journal +12 s + wtmp +12 s + last reboot + who -b + Cloudflare ±0 s); aggregate 166 §12.3 (f) — parent đã CHẤP NHẬN #71 DƯƠNG.

**Bằng chứng run 166 ĐANG CHẠY tại btime #71:** run 166 dispatched 23:35:51Z (trước btime #71 32m09s) + 0 event finish trước btime + requeue/reattach tại +41,274 s + succeeded sau btime 02:27:00Z. **Caveat lệch khung giờ (§4.5) đã được T2-167 thấy và áp dụng ghi chú đứng — VẪN ĐỒNG Ý DƯƠNG #71 theo btime** (cùng phán như quyết (e) đợt 166 cho #70: dữ kiện khung cũ là XÁC NHẬN OVERLAP, không phải bằng chứng offset sai).

**Kết luận: ĐỒNG Ý #71 là điểm DƯƠNG (m).** Requeue 41,274 s không mở rộng dải (max vẫn 49,761 s từ #50). **Parent đã CHẤP NHẬN #71 DƯƠNG ở quyết (f) đợt 166 (đối chiếu độc lập thuộc T2-167 — nay đã có: ĐỒNG Ý); n ứng viên 24→25 (nhánh khuyến nghị) hoặc 25→26 (nhánh #56 ÂM) theo quyết đó — đối chiếu này xác nhận; n chính thức GIỮ 14.**

### 4.3 Điểm (m) #72 — ĐỐI CHIẾU ĐỘC LẬP: ĐỒNG Ý DƯƠNG (ứng viên)

**Bốn nguồn độc lập khớp nhau từng số (trừ 1 ms — xem F-167-T2-4):**

1. **T2-167 tính lại từ epoch thô** (`m-check9696.py`): requeue 02:05:44.548Z − btime #72 02:05:05Z = **39,548 s ∈ [33; 49,8] ✓** (giá trị T0-167: 02:05:44.547Z = 39,547 s — cũng trong dải); dispatch +39,589 s; reattach +39,637 s; started_at viết lại lần 2: 1795306121 → 1795313144 (delta 7.023 s); spanning = 0 (artifact viết-lại-tự-loại, 1795313144 > 1795313105); run 166 finished 02:27:00Z = btime #72 + 1.315 s.
2. **T7-167 NOTES đọc #1 + appendix167.txt (đọc DB tươi, nguồn độc lập thứ hai):** requeue #72 02:05:44.548Z = btime +39,548 s; requeue cửa rộng 02:05:05–02:30:00Z (mọi job): đúng 1 dòng — requeue run 166 (eid 9925); run 166 ĐANG CHẠY tại btime #72 (đọc #8 T7-166 02:02:29Z running; 0 event finish trước btime; succeeded sau đó 02:27:00Z).
3. **T0-167 .done + NOTES (DB hồi cứu, nguồn độc lập thứ ba):** DB run 166 eid 9925 requeued_after_restart 02:05:44.547Z = btime #72 +39,547 s; dispatch +39,588 s; reattach +39,637 s (xem F-167-T2-4 về chênh 1 ms).
4. **T7-166 LIMITS §2.5 + aggregate 166 §10.5 (xv) (nguồn độc lập thứ tư):** run 166 running lúc T7-166 đóng cờ (tuổi gốc 8.798 s, còn 2.002 s tới hạn 02:35:51Z), 1 lần viết lại tại #71 — chưa có viết lại lần 2 lúc đó (lần đọc DB cuối #8 lúc 02:02:29Z, TRƯỚC btime #72); T10-166 xác minh btime #72 (1795313105 = 02:05:05Z, /proc/stat) + uptime -s + journal first entry 02:05:17Z (+12 s) + wtmp begins 02:05:16Z (+11 s).

**Kết luận: ĐỒNG Ý #72 là điểm DƯƠNG (m) — ứng viên, chờ parent quyết.** Requeue 39,548 s không mở rộng dải. **Nếu parent CHẤP NHẬN: n ứng viên 25→26 (nhánh khuyến nghị: 23 dương + 3 âm) hoặc 26→27 (nhánh #56 ÂM: 23 dương + 4 âm); n chính thức GIỮ 14.**

### 4.4 Điểm (m) #73 — KHÔNG PHẢI ĐIỂM (0 requeue, 0 run đang chạy tại btime)

- Run 166 finished 02:27:00Z — **61 s TRƯỚC btime #73 (02:28:01Z)**; run 167 sched/started 02:35:51Z — **470 s SAU btime**.
- T7-167 đọc #1: requeue cửa 02:28:01–02:40:00Z (mọi job): **0 dòng** — #73 không gây requeue nào; spanning btime #73: **0 dòng — HỢP LỆ** (không run nào đang chạy tại btime).
- Chữ ký giống #52/#61/#67 (0 run đang chạy tại btime, 0 requeue). **N không đổi vì #73. T7 KHÔNG tự phán (m) — T2-167 phán: KHÔNG PHẢI ĐIỂM.**

### 4.5 Lệch khung giờ tại biên #70/#71 (mẫu T5-165 §4.2 / T5-166 §4.2)

**Dữ kiện (đọc trực tiếp từ log gốc `round166-t5/replay-watch-165.log` — file log thật của watcher-166 qua symlink `replay-watch-166.log`):** watcher-166 (START 23:40:45Z, pid 26422, poll mỗi 30 s, boot d1ddd946) có poll cuối **00:08:20Z, SAU btime #71 (00:08:00Z) 20 s**, vẫn ghi nhãn boot `d1ddd946` (#70). Các poll trước: 00:07:20Z, 00:07:50Z (trước btime); không có poll nào sau 00:08:20Z (watcher chết theo #71). T10-166 §10.5 (xiv) đã xác minh độc lập dòng 00:08:20Z này là nhãn stale (có thể script cache boot_id từ lúc khởi động, hoặc dòng log ghi trước reboot nhưng flush muộn — T10 KHÔNG kết luận nguyên nhân).

**So sánh với bằng chứng khung mới (T7-166, giờ thật):** /proc/1 mtime 00:08:15.954Z (+15,954 s sau btime #71); journal first entry 00:08:16Z (+16 s); wtmp begins 00:08:16Z (+16 s). **Bằng chứng khung mới ĐẾN TRƯỚC poll cuối khung cũ 4 s** (00:08:15.954Z < 00:08:20Z) — hai khung giờ MÂU THUẪN nhau trực tiếp: nếu cả hai đồng hồ đều đúng giờ thật thì boot mới đã tạo /proc/1 trước khi boot cũ poll lần cuối — không thể cùng đúng trên một trục thời gian thật.

**Phán của T2-167 (áp dụng ghi chú đứng, KHÔNG tự lật quyết parent):** khoảng neo "thật" suy ra từ khung cũ là **RỖNG** — reboot thật phải đồng thời > 00:08:20Z (khung cũ: boot cũ còn sống tới lúc đó) và ≤ 00:08:15.954Z (khung mới: boot mới đã bắt đầu) — không tồn tại trên một trục thời gian duy nhất nếu không giải quyết độ lệch ≥4 s giữa hai khung. **Do đó không thể tính "offset requeue thật" cho #71 bằng cách neo vào poll cuối khung cũ** (khác #70, nơi cửa "thật" [2,7; 32,7] s còn tính được vì các mốc không mâu thuẫn trực tiếp — chỉ lệch ≥6 s). Trường hợp #71 MẠNH HƠN #70 về hình thức (mâu thuẫn trực tiếp, không chỉ lệch) nhưng CÙNG phán theo quyết (e) đợt 166: dữ kiện khung cũ là XÁC NHẬN OVERLAP thứ tư tại #71 (≥20 s theo đọc btime — mạnh hơn #70: ≥6 s; #68: ≥11 s), KHÔNG phải bằng chứng offset requeue sai; offset requeue đo từ btime #71 trong khung giờ boot mới (giờ thật, T7-166 xác minh 9 nguồn, Cloudflare ±1 s ×8) — đúng khung giờ dải 33–49,8 s được hiệu chuẩn. **(m) #71 DƯƠNG ĐỨNG theo btime (parent đã CHẤP NHẬN ở quyết (f) đợt 166; đối chiếu độc lập §4.2 ĐỒNG Ý).**

**Biên #72/#73:** không có watcher poll nào để đối chiếu (watcher-167 chưa khởi động lúc T0 đóng; watcher-166 đã chết theo #71) — giao T5-167 kiểm tra khi watcher-167 chạy. **Ghi chú đứng đã ghi vào LIMITS đầu file (nhắc lại + áp dụng cho #71/#72/#73).**

### 4.6 Điểm (m) #70 — kiểm lại (sanity, T2-166 đã đồng ý; parent quyết (e) đợt 166 GIỮ DƯƠNG)

Requeue 22:06:03.729Z − btime #70 = 38,729 s ∈ [33; 49,8] ✓ (tính lại từ epoch thô trong `m-check9696.py` — khớp T2-166). Không có gì thay đổi; #70 DƯƠNG đã CHẤP NHẬN theo quyết (e) đợt 166 (quyết (n) đợt 165 ĐỨNG — KHÔNG lật).

### 4.7 Nhãn n (quyết (e)/(f) đợt 166)

- **Cơ sở hiện tại (đã cộng #71 theo quyết (f) đợt 166): n ứng viên = 25 (nhánh khuyến nghị: 22 dương + 3 âm #38/#45/#62) hoặc 26 (nhánh #56 ÂM: 22 dương + 4 âm).**
- **Đối chiếu độc lập (m) #71 của T2-167 (§4.2) ĐỒNG Ý DƯƠNG — xác nhận n 25/26 trên đây; parent xác nhận cuối ở đợt 167.**
- **Nếu parent CHẤP NHẬN #72 (§4.3): n ứng viên = 26 (23 dương + 3 âm) hoặc 27 (23 dương + 4 âm). #73 KHÔNG PHẢI ĐIỂM (§4.4) — không đổi n.**
- **n chính thức (ứng viên) GIỮ 14** cho đến khi #56 được quyết.

---

## 5. RAM trong cửa sổ probe #86

Guard 6.144 MiB = 6.291.456 kB; balloon ceiling 6.443.824 kB. Sampler T9-166 (round166-t9/ram-sampler.log, 123 dòng tổng) + T9-167 (round167-t9/ram-sampler.log — 13 dòng lúc T2 chạy).

| Nguồn | Mẫu trong cửa sổ | Boot | Peak | % guard | ≥ guard | Balloon (==ceiling) |
|---|---|---|---|---|---|---|
| T9-166 | 121 | d1ddd946 (n=28) + ea73ac4f (n=93) | 4.399.884 kB | 69,93% | 0 | 54 |
| T9-167 | 1 | b643911f (02:38:33Z) | 759.616 kB | 12,07% | 0 | 0 |
| **Toàn cửa sổ** | **122** | — | **4.399.884 kB** | **69,93%** | **0** | **54** |

- d1ddd946 (T9-166): n=28, peak 4.399.884 kB (69,93% guard — max lúc 00:01:51Z, trùng max toàn phiên T9-166; **gần guard nhất kể từ đợt 150** — cùng đỉnh đợt 166). ea73ac4f (T9-166): n=93, peak 1.898.412 kB (30,17% guard). b643911f (T9-167): n=1, peak 759.616 kB (12,07% guard).
- Balloon 54 (T9-166) = đúng 54 mẫu E-168 (00:48:06–01:41:07Z, boot #71 — T10-166 phán E-168 là 1 episode mới; kết cục thuộc T9-167).
- **birefnet 0 lần thử, lần thứ 21 liên tiếp** (peak toàn cửa sổ 69,93% guard, cách guard 1.891.572 kB).
- Lưu ý cận dưới: sampler T9-166 dừng 01:41:07Z (dòng cuối); không có mẫu 01:41:07Z → 02:38:33Z (3.426 s, CHỨA reboot #72 + #73 — boot b643911f xuyên suốt từ 02:28:01Z) — peak trong quãng này là cận dưới (cùng họ F-142-T2-10 / T2-166 §5).

---

## 6. Phương pháp, sai số riêng, câu hỏi cho parent

### 6.1 Phương pháp

- **btime CHỈ từ `/proc/stat btime`** (quyết (e) đợt 156). Đồng hồ boot #73: T0-167 9 nguồn + T7-167 (Cloudflare ±0 s lúc mở) là căn cứ chính; T2-167 chỉ hỗ trợ bằng uptime -s + btime đọc trực tiếp lúc mở (02:39:08Z).
- **Luật gap (sàn 1.147 s):** file max gap hoặc union max gap (union-A = file + hệ thống + nội dung; union-B = union-A + mốc hệ thống trước btime) vượt sàn ⇒ MỞ.
- **(m):** T2 không tự query scheduler DB (T7 sở hữu) — đối chiếu qua NOTES T7-167 + appendix167.txt + T7-166 LIMITS + T0-167 .done/NOTES + tính lại từ epoch thô bằng script riêng. Ghi chú đứng quyết (e) đợt 165 (áp dụng đầy đủ cho #70 theo quyết (e) đợt 166): dải 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới).
- **WFS:** đếm theo DÒNG, chỉ file có count > 0; NEWSTD + R7b + copies; kiểm async `.writeFile(` có giới hạn.
- **EPERM sweep:** chỉ đếm marker trong `*.log` có mtime trong cửa sổ probe (không grep -r bừa — F-150-T2-2).
- **INSIDE:** dải cho reboot #k = FULL(110+k−64) neo btime #(k−1) — mẫu: #66→FULL112, #67→FULL113, #68→FULL114, #69→FULL115, #70→FULL116, **#71→FULL117** (xem F-165-T2-1 — nhãn dải kiểm lại đúng trước khi viết LIMITS). Dải in với độ chính xác 0,5 s (bài học F-166-T10-12).
- **Prereg:** viết TRƯỚC probe #86 (~02:40Z), lean kiểm lại ở §6.2.

### 6.2 Sai số riêng (F-167-T2-*)

- **F-167-T2-1 (ghi nhận, không phải lỗi verdict — artifact phương pháp MỚI):** regex bare-time `TS_RE2 = (\d\d):(\d\d):(\d\d)Z` trong `blind9696-sessions.py` khớp CẢ timestamp đầy đủ "2026-11-21T23:40:50Z" rồi gán ngày = ngày mtime file (22/11) → tạo max ảo 22/11 23:40:50Z/23:40:45Z cho 2 file, khiến chúng "span" btime #72/#73 trong khi max thật chỉ là 00:12:11Z/00:08:20Z. Bắt được khi kiểm tay từng hit (grep không thấy dòng "2026-11-22T23:40" nào trong cả hai file). Không ảnh hưởng verdict (cả hai file đều là trích dẫn — xem §2.3). Giao T2-168: sửa TS_RE2 để không khớp phần thời gian của timestamp đầy đủ (negative lookbehind cho `T` hoặc yêu cầu ký tự trước không phải `T`).
- **F-167-T2-2 (ghi nhận, bắt được TRƯỚC khi viết LIMITS):** `m-check9696.py` bản đầu ghi sai dòng n-arithmetic ("nếu #72 được chấp nhận: n thành 25 (22 dương + 3 âm)" — đó là số SAU #71, không phải sau #72). Bắt được khi đối chiếu với quyết (f) đợt 166 (n 24→25 sau #71 ⇒ sau #72 phải là 25→26). Đã sửa script thành "26 (23 dương + 3 âm) / 27 (23 dương + 4 âm)" và chạy lại — LIMITS này dùng số đã sửa. Các phép trừ offset trong script đều đúng; chỉ dòng prose n-arithmetic sai.
- **F-167-T2-3 (ghi nhận, không phải lỗi):** quét mù đợt này cho /tmp = 0 file (đợt 166: 594) vì /tmp là tmpfs bị xóa sạch bởi reboot #73. Không phải mất dữ liệu điều tra: mọi file /tmp trong cửa sổ đều đã được quét ở các đợt trước khi reboot xóa chúng (merged đợt 166 đã ghi 594 file /tmp). Ghi rõ nguyên nhân, không giấu.
- **F-167-T2-4 (ghi nhận, không phải lỗi verdict — chênh 1 ms giữa hai nguồn):** T0-167 NOTES ghi requeue #72 là 02:05:44.547Z (+39,547 s) và reattach #71 là 00:08:41.406Z, trong khi T7-167 appendix167.txt ghi 02:05:44.548Z (+39,548 s) và 00:08:41.407Z — chênh đúng 1 ms theo cùng một hướng (T0 thấp hơn T7 1 ms ở cả hai mốc; có thể đường đọc của T0 cắt bỏ (floor) mili-giây). Cả hai giá trị đều trong dải 33–49,8 s — verdict không đổi. LIMITS dùng giá trị T7-167 (đọc DB tươi) làm số chính, ghi rõ giá trị T0-167 để đối chiếu.
- **F-167-T2-5 (đính chính số liệu đợt trước — bắt được khi kiểm lại bảng §2.3):** LIMITS T2-166 §2.3 ghi đoạn S "676 file-marks" là SAI — tính lại từ chính file investigate của round166-t2 = 481 (round165-t2 = 481, round164-t2 = 482; phương pháp đếm đã kiểm khớp với merged script ở cả ba đoạn R/T/U của đợt 166 và 167). Mốc giây S (253) và các gap S (843/662/591 s) của T2-166 đều ĐÚNG — chỉ số file-marks sai, không đổi verdict (verdict S dựa trên gap theo mốc giây). Số đúng đợt 167: S 252 mốc giây / 480 file-marks (mất 1 mốc do feed/media/index.json đổi mtime 11:41:54Z→23:43:45Z). T2-167 đã ghi số đúng vào LIMITS này.

**Prereg (§6.1, viết trước probe #86) kiểm lại:** (a) #96? R MỞ, số y hệt T2-166 ✓ (file 1.238 / union-A 1.222 / union-B 1.211 s); S/T ĐÓNG ✓; (b) #88? 337 hit / 0 mới, lần 11 ✓ (prereg ước ~337 hit — thực 337, không trôi thêm); (c) #95?/#94?/#77? giữ MỞ ✓; (d) INSIDE #71 ✓ (prereg không ước p10/p90 cụ thể — thực FULL117 p10 1.572,60 / p90 8.779,60 s; lean INSIDE ✓; chuỗi 6→7 ✓); (e) (m) #71 ĐỒNG Ý DƯƠNG ✓ (4 nguồn khớp); (f) (m) #56 5 hướng đều âm tính ✓ (lần thứ mười); (g) ghi chú đứng quyết (e) đợt 165 đã ghi vào LIMITS đầu file + áp dụng cho #71/#72/#73 ✓; (h) RAM < guard ✓, birefnet 0 lần ×21 ✓; (i) WFS #73 chênh 0 ✓ (delta +1/+1 giải thích đúng bằng LIMITS T2-166 mới — xem §6.3); (j) n 25/26 sau quyết (f) đợt 166 ✓ (đối chiếu T2-167 ĐỒNG Ý — parent xác nhận ở đợt 167); (k) lệch khung biên #70/#71 ✓ (poll cuối watcher-166 00:08:20Z, +20 s — xem §4.5).

**WFS #73** (scan-wfs72.sh, 02:50:54–02:51:21Z): NEWSTD 995 dòng / 298 file (phạm vi 3.473 file); R7B 1.020 / 315 (12.867 file); copies 25 / 17; **995+25=1.020, chênh 0 — lần thứ 73 liên tiếp.** Delta vs #72: +1 dòng / +1 file — giải thích đầy đủ bằng diff: `docs/PHASE9_ROUND166_T2_EPERM_LIMITS.md:1` (file LIMITS T2-166 mới, nhắc "writeFileSync" đúng 1 lần trong văn bản — grep -c xác minh = 1). Async `.writeFile(`: 2 helper đã biết (eperm-retry.mjs, epermRetry.js:116) + 1 nhắc trong PHASE9_GAP_ANALYSIS.md; 0 stray trong source.

**Đối chiếu cờ các luồng (lúc T2 viết, ~03:00Z):** T0-167 DONE 02:41Z (boot #73 9 nguồn, marker 25, run 166 SUCCEEDED 02:27:00Z theo DB, 2 lần viết lại #71 +41,274 s / #72 +39,547 s, POSTBOOT_PASS #71/#72/#73 chưa có). T1-167 LIMITS đã có (verify 166 PASS + suite 28/28 trên boot #73, 02:39:59–02:47:02Z; đếm khớp lần thứ 60 liên tiếp; .done chưa viết lúc T2 đọc). T6-167 DONE 02:49Z ((A) 120/120 lần thứ 17 liên tiếp, tổng 2040/2040; lock khỏe 557/545). T7-167 NOTES đọc #1 + appendix167.txt đã đủ cho (m) #71/#72/#73 (T7 chưa đóng cờ — đóng ~05:05Z, sau hạn cờ T2 — cùng mẫu T2-166 dùng NOTES T7-166). T4/T5/T8/T9-167 chưa đóng lúc T2 viết — T5-167 sở hữu POSTBOOT_PASS #71/#72/#73 + watcher-167.

### 6.3 Câu hỏi cho parent

(a) **(m) #71 — DƯƠNG: đối chiếu độc lập ĐÃ CÓ (ĐỒNG Ý) — xác nhận n ứng viên 25 (nhánh khuyến nghị) / 26 (nhánh #56 ÂM)?** (§4.2 — 4 nguồn khớp: requeue 00:08:41.274Z = btime +41,274 s ∈ [33; 49,8]; dispatch +41,339 s; reattach +41,407 s.) Quyết (f) đợt 166 đã CHẤP NHẬN #71 DƯƠNG chờ đối chiếu này. Caveat lệch khung §4.5 đã thấy và áp dụng ghi chú đứng — VẪN ĐỒNG Ý.
(b) **(m) #72 — DƯƠNG? n ứng viên 25→26 (nhánh khuyến nghị) / 26→27 (nhánh #56 ÂM) hay giữ 25/26?** (§4.3 — 4 nguồn khớp: requeue 02:05:44.548Z = btime +39,548 s ∈ [33; 49,8] — T0-167 ghi .547Z, chênh 1 ms, xem F-167-T2-4; dispatch +39,589 s; reattach +39,637 s.) Run 166 ĐANG CHẠY tại btime (đọc #8 T7-166 02:02:29Z running; 0 event finish trước btime; succeeded sau đó 02:27:00Z). n chính thức GIỮ 14.
(c) **(m) #73 — KHÔNG PHẢI ĐIỂM (0 requeue, 0 run đang chạy tại btime) — ghi nhận?** (§4.4 — run 166 finish 61 s TRƯỚC btime; run 167 start 470 s SAU btime; chữ ký giống #52/#61/#67.) N không đổi vì #73.
(d) **INSIDE chuỗi: #71 INSIDE dải FULL117 → chuỗi 6 LÊN 7 — ghi nhận? #72 INSIDE dải FULL118 → chuỗi 7 LÊN 8 (nếu #71 xác nhận) — ghi nhận? #73 NGOÀI dải FULL119 (sớm 199,8 s) → chuỗi ĐỨT tại #73 — ghi nhận?** (§2.5; T2 đính kèm đủ số p10/p90: FULL117 p10 1.572,60 s / p90 8.779,60 s neo 22:05:25Z → [22:31:37,6Z, 00:31:44,6Z]; biên dưới 5.782,4 s / biên trên 1.424,6 s; FULL118 p10 1.574,20 / p90 8.771,70 s neo 00:08:00Z → [00:34:14,2Z, 02:34:11,7Z]; FULL119 p10 1.575,80 / p90 8.763,80 s neo 02:05:05Z → [02:31:20,8Z, 04:31:08,8Z].) Dải có điều kiện (gap #67/#68/#69/#70 danh nghĩa, chưa vào CERT/FULL chính thức). #71 NGOÀI FULL116 muộn 5.521,5 s chỉ là đối chiếu, không phá chuỗi.
(e) **Reboot #73 (b643911f, btime 02:28:01Z giờ thật) TRƯỚC khi đợt 167 mở 7m50s — xác nhận số hiệu #73?** (T0-167 xác minh 9 nguồn; T7-167 xác minh 9 nguồn; T1-167 ghi nhận btime + boot_id; gap #72→#73 = 1.376 s — ngắn nhất chuỗi gần đây.) **#72 (9e089ef6, btime 02:05:05Z): T0-167 chỉ xác minh được 7/9 nguồn (2 nguồn không khôi phục được) — ghi nhận?**
(f) **Lệch khung giờ biên #70/#71 (§4.5): poll cuối watcher-166 00:08:20Z (+20 s sau btime #71) + bằng chứng khung mới /proc/1 +15,954 s ĐẾN TRƯỚC poll cuối 4 s — hai khung MÂU THUẪN (khoảng neo "thật" RỖNG) — ghi nhận phán của T2-167 (neo khung cũ KHÔNG dùng được; (m) #71 DƯƠNG đứng theo btime, cùng phán quyết (e) đợt 166 cho #70)?**
(g) **#96? VẪN MỞ (theo dõi tiếp) — ghi nhận? #95?/#94? MỞ — ghi nhận? #88?/#77? VẪN MỞ — ghi nhận?** CERT/FULL chính thức GIỮ 76/91? Hố file U 1.407 s (22:09:05→22:32:32) — đóng theo union, chỉ tham chiếu — ghi nhận?
(h) **#56 VẪN CÓ ĐIỀU KIỆN** (lần thứ mười không thu hẹp được) — có hướng neo mới nào parent muốn T2-168 thử (đã thử đợt này: find /tmp+/opt+/etc+/srv 0 file trong cửa D; Chromium Sessions 0 file; kiểm dưới-giây mốc D-wall muộn nhất — vẫn 20:16:36.699Z; /dev/shm trống; apt history 0 entry ngày 20/11)? T2-158 đã ghi "không còn hướng đo nào khác trong tầm cell" — T2-167 đã thử thêm 4 hướng mới (i)/(ii)/(iv)/(v) và xác nhận lại (iii) ở độ chính xác dưới-giây — cả năm đều âm tính.
(i) **Run 166 SUCCEEDED 02:27:00Z, margin 531 s, 2 lần viết lại — ghi nhận?** Claimed→finished 64 s (NGOÀI họ 6–11 s, gần ngoại lệ 66 s run 164) — ghi nhận? Run 167 running, jitter 0 s lần thứ 20 — kết cục thuộc T7-168 — ghi nhận?
(j) **F-167-T2-1 (artifact TS_RE2 tạo max ảo trong sessions — giao T2-168 sửa) / F-167-T2-2 (dòng n-arithmetic sai trong m-check bản đầu — đã sửa trước khi viết LIMITS) / F-167-T2-4 (chênh 1 ms T0 vs T7 — verdict không đổi) / F-167-T2-5 (đính chính số S file-marks đợt 166: 676 → 481 đúng — verdict không đổi): GHI NHẬN?**
(k) **#88? hole-recheck lần thứ 12 ở đợt 168?** (Lần 11: 337 hit, 0 mới — y hệt lần 9/lần 10; số hit không trôi thêm — có cần đổi cách đếm cơ sở không, hay giữ nguyên?)
(l) **Đính chính F-167-T2-5: LIMITS T2-166 §2.3 ghi đoạn S "676 file-marks" — số đúng là 481 (tính lại từ file investigate gốc round166-t2) — ghi nhận đính chính?** Mốc giây S (253) và các gap S (843/662/591 s) của T2-166 đều đúng; chỉ số file-marks sai, không đổi verdict đợt 166.

---

## 7. File + stage

**LIMITS này:** `docs/PHASE9_ROUND167_T2_EPERM_LIMITS.md` (1 entry, stage duy nhất).

**File làm việc (round167-t2):** prereg-t2.md, blind9696-gaps.py, blind9696-gaps.log, blind9696-investigate.py, blind9696-investigate.log, blind9696-repo-1.txt, blind9696-hidden_files.txt, blind9696-outside.txt, blind9696-tmp.txt, blind9696-fifthscope.txt, blind9696-merged.py, blind9696-merged.log, blind9696-content.py, blind9696-content.log, blind9696-sessions.py, blind9696-sessions.log, sessions-9696.txt, hole-recheck9696.py, hole-recheck9696.log, holerecheck-all.txt, find-stderr.txt, scan-wfs72.sh, scan-meta.txt, files-newstd.bin, files-r7b.bin, files-copies.txt, wfs-newstd.txt, wfs-r7b.txt, wfs-copies.txt, eperm-sweep9696.py, eperm-sweep9696.txt, ram-max9696.py, ram-max9696.txt, m-check9696.py, m-check9696.txt, m56-166.py (bản sao từ đợt 166, không dùng — script đợt này là m56-167.py), m56-167.py, m56-167.txt.

**Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round167-t2-eperm.txt` (NUL-delimited, 1 entry — LIMITS này). KHÔNG push.

**Nợ mở giao đợt 168 (T2-168):** hole-recheck #88? lần thứ 12; kết cục run 167 (T7-168); POSTBOOT_PASS #71/#72/#73 + watcher-167 (T5-167/168); (m) #56 thử thu hẹp lần thứ mười một (chờ parent trả lời (h) — đã thử 5 hướng đợt này, 4 hướng mới); (m) #74 nếu có reboot mới; INSIDE #74 (dải FULL120 neo 02:28:01Z nếu #73 đóng — lưu ý chuỗi đã ĐỨT tại #73 theo FULL119, xem §2.5); sửa TS_RE2 trong blind9696-sessions.py (F-167-T2-1); prune/WFS/EPERM/RAM/birefnet thường kỳ; G1 chờ user quyết; u2net là fallback chính thức; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại.
