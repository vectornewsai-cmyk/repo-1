# PHASE9 ROUND 169 — T2 (mù #96? theo dõi tiếp + EPERM #88 + INSIDE #75/#76 + (m) #77 đối chiếu độc lập + (m) #56 lần thứ mười hai) — LIMITS

**Đợt 169 mở 08:35:51Z 22/11/2026. Hạn cờ ~11:00Z, hạn cứng đóng 11:30Z 22/11. T2 viết ~09:10Z 22/11.**
**KHÔNG push, KHÔNG release/tag. Chỉ stage 1 file (LIMITS này).**

> **GHI CHÚ ĐỨNG (quyết (e) đợt 165 — nhắc lại, áp dụng cho #74/#75; quyết (e) đợt 166 áp dụng đầy đủ cho #70; quyết (f) đợt 166 + quyết (e) đợt 167 áp dụng cho #71): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Dữ kiện T5-165 (poll cuối watcher-164 sau btime #68 11 s), T5-166 (poll cuối watcher-165 sau btime #70 6 s) và T5-167 (poll cuối watcher-166 sau btime #71 20 s) chứng minh boot cũ sống quá btime mới — đó là OVERLAP (đã xác nhận đợt 161), KHÔNG phải bằng chứng offset requeue sai. Offset requeue đo từ btime trong khung giờ boot mới (giờ thật) — đúng khung giờ dải 33–49,8 s được hiệu chuẩn. Đợt này: sampler-168 dòng cuối 576ca271 lúc 07:32:37Z, SAU btime #76 14 s (§4.5) — OVERLAP thứ sáu; watcher-168 poll cuối 07:32:18Z, TRƯỚC btime #76 5 s (không có poll nào sau btime).

## 0. Kết luận trước (headline)

1. **Probe EPERM #88: 08:43:38Z, boot c44cc3ba (#77), ok=2 fail=0, log 253→256 (+3 đúng mẫu). Cửa sổ 05:46:00Z → 08:43:38Z = 10.658 s. 0 sóng EPERM thật trong cửa sổ** (sweep #88: 113 file `*.log`, 1 file có hit, 3 lần — tất cả "sóng EPERM đã tắt" trong `o8-168t8.log`; 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted").
2. **Reboot #77 MỚI (c44cc3ba, btime 08:23:52Z) xảy ra 11m59s TRƯỚC khi đợt 169 mở** — T0-169 xác minh 9/9 nguồn (T2-169 xác minh btime bằng 7 nguồn, xem §2.2); gap #76→#77 = 3.089 s. **#77 KHÔNG viết lại run nào** (run 168 finish 297 s trước btime; run 169 start 719 s sau btime; 0 requeue) → **(m) #77 KHÔNG PHẢI ĐIỂM** (§4.2). **Run 168 SUCCEEDED 08:18:55Z** (wall 9.784 s, margin 1.016 s, claimed→finished 7 s — trở lại họ 6–11 s sau ca 108 s của run 167; T0-169 đối chiếu DB KHỚP từng số). Marker sống qua **28 reboot #49–#76** (T0-169 đếm độc lập) / 29 (#49–#77) tính tới boot hiện tại.
3. **Mù #96? (#64) — VẪN MỞ (theo dõi tiếp, quét tươi + kiểm nội dung đầy đủ):** đoạn R file 1.238 s / union-A 1.222 s / union-B 1.211 s (y hệt T2-164/T2-165/T2-166/T2-167/T2-168, không đổi một giây — lần thứ năm liên tiếp); S ĐÓNG (file 843 s / union-A 662 s / union-B 591 s); T ĐÓNG (file 307 s / union-A 31 s); U ĐÓNG theo union (file max MỚI 1.516 s tại 06:56:58→07:22:14Z, union-A 926 s / union-B 814 s — y hệt đợt 168). **Kết luận: #96? VẪN MỞ.**
4. **Mù #88? VẪN MỞ — hole-recheck lần thứ MƯỜI BA: 337 hit, 0 mốc mới** (y hệt lần 9/lần 10/lần 11/lần 12 — 337 hit, không trôi thêm; xem §2.6 + F-169-T2-1). **#95?/#94?/#77? giữ nguyên** (không có bằng chứng mới). CERT/FULL chính thức GIỮ 76/91.
5. **INSIDE: #75 INSIDE dải FULL121 [04:31:32Z, 06:31:17Z] neo 04:05:29Z (biên dưới 3.674 s, biên trên 3.511 s) và #76 INSIDE dải FULL122 [05:58:50Z, 07:58:24Z] neo 05:32:46Z (biên dưới 5.613 s, biên trên 1.561 s) → CHUỖI MỚI từ #73 TIẾP TỤC, dài 3** (theo dải phương pháp; xem caveat §2.5: cả hai đều NGOÀI dải còn hiệu lực — cùng mẫu #71, parent quyết). **FULL120 KIỂM LẠI ĐỘC LẬP: ĐẠT** (p10/p90 1.555,20/8.755,90 s khớp T2-168 bằng hai cách tính mới + giá trị chuỗi — nợ từ quyết (c) đợt 168 đã trả).
6. **(m) #77 — KHÔNG PHẢI ĐIỂM (đối chiếu độc lập, DB đọc tươi):** 0 requeue trong cửa 08:23:52–09:00:00Z (mọi job); 0 run spanning btime; chữ ký giống #52/#61/#67/#73/#75. **(m) #76 — chỉ ghi chú tham chiếu: parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM (quyết (e) đợt 168) — KHÔNG mở lại phân loại; kiểm lệch khung xác nhận quyết đứng vững dưới mọi neo (xem §4.5).**
7. **(m) #56: KHÔNG thu hẹp được lần thứ MƯỜI HAI** (5 hướng — tất cả MỚI — đều âm tính; hướng (i) tìm lại đúng 18 file session đã biết từ đợt 166, trong đó 9 file sau mốc D-wall đã phân loại E từ đợt 157 — không phải mốc D mới; xem §4.1). Cửa GIỮ NGUYÊN R [2,56251; 2,66817) / J [2,566; 2,80753] s. **#56 VẪN CÓ ĐIỀU KIỆN; n ứng viên GIỮ 27 (nhánh khuyến nghị) hoặc 28 (nhánh #56 ÂM); n chính thức GIỮ 14.**
8. **Run 168: SUCCEEDED 08:18:55Z (eid 10015), wall 9.784 s, margin 1.016 s tới hạn 08:35:51Z, claimed→finished 7 s — trở lại họ 6–11 s (sau ca 108 s lớn nhất của run 167), 1 lần viết lại duy nhất (tại #76 +32,309 s).** Run 169 running, jitter 0 s lần thứ 22 liên tiếp — kết cục thuộc T7-170.
9. **RAM trong cửa sổ probe #88: peak 3.273.520 kB = 52,03% guard (cùng đỉnh phiên T9-168); 0 mẫu ≥ guard; balloon 60 (toàn bộ là E-170 48 + E-171 12, đã đếm đợt 168); birefnet 0 lần thử trong cửa sổ** (chuỗi lần thứ 23 chờ T9-169 xác nhận cuối đợt). WFS #75 chênh 0 (998+25=1.023) lần thứ 75.
10. **Lệch khung giờ biên #75/#76 (§4.5): tại #75 KHÔNG có overlap (0 nội dung boot cũ sau btime); tại #76 OVERLAP thứ sáu** (dòng sampler-168 cuối 576ca271 07:32:37Z, +14 s sau btime — F-168-T9-3; watcher-168 poll cuối 07:32:18Z, −5 s). Bằng chứng khung mới (/proc/1 +11,062 s) đến TRƯỚC dòng boot cũ cuối (+14 s) — khoảng neo "thật" RỖNG theo mẫu #71; offset requeue theo mọi neo (btime 32,309 s; /proc/1 21,247 s; dòng sampler cuối 18,309 s) đều DƯỚI dải — **lệch khung không cứu được #76, quyết parent (e) đợt 168 đứng vững**.
11. **Sửa artifact F-168-T2-1 ĐÃ XONG (§6.2, F-169-T2-1):** bare-time nay lấy ngày từ full timestamp trong CÙNG DÒNG khi có — max của `proc_1c620b5730b5.log` đã sửa từ 22:08:08Z 22/11 (ảo) thành 04:18:06Z 22/11 (thật, trích appendix T5-167). Việc sửa lộ thêm 3 log phiên mới span #74/#75 bằng trích dẫn (xem §2.3) — verdict không đổi (0 hoạt động thật).

## 1. Checklist probe EPERM #88

| Hạng mục | Kết quả |
|---|---|
| Probe #87 (trước) | 05:46:00Z, boot 576ca271, n=87 |
| `status` 08:43:34Z | DEAD/STALE, heartbeat n=87, ts 05:46:00Z, boot 576ca271, tuổi 10.654 s, exit 1 |
| Log trước probe | 253 dòng |
| `status` ghi dòng DEAD | 253 → 254 (+1) |
| Dòng boot-changed | 254 → 255 (+1, 576ca271 → c44cc3ba) |
| **`once` 08:43:38Z — probe #88** | **boot=c44cc3ba, ok=2 fail=0, exit 0** |
| Log sau probe | 256 dòng (253→256 = +3 đúng mẫu: DEAD + boot-changed + probe#88) |
| Heartbeat mới | pid=14808, ts 08:43:38Z, boot c44cc3ba-f637-4c2a-88f7-c5dac53fe8a7, n=88 |
| `=== probe end` | vẫn 0 dòng (1 dòng `probe start` duy nhất từ 08:49:50Z 11/11) |
| **Cửa sổ probe #88** | **05:46:00Z → 08:43:38Z = 10.658 s** |

Sóng EPERM thật gần nhất ~11:55–12:11Z 11/11 (~261 h trước probe #88).

**Sweep #88** (`eperm-sweep9696.py`, 113 file `*.log` mtime trong cửa sổ): 1 file có hit, 3 lần — tất cả "sóng EPERM đã tắt" trong `round168-t8/o8-168t8.log` (log T8-168: "[timestamp] sóng EPERM đã tắt, khởi động vite" — dòng trạng thái). 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted" — **0 sóng thật**.

## 2. Điều tra mù #96? (#64) — THEO DÕI TIẾP (quét tươi + kiểm nội dung đầy đủ)

Mù # = reboot # + 32. #96? = reboot #64, btime 11:15:18Z 21/11/2026. Sàn luật gap: **1.147 s (19'07")** — file max gap hoặc union max gap vượt sàn ⇒ MỞ.

### 2.1 Sự kiện + định nghĩa đoạn

Cửa sổ điều tra: **[11:15:18Z, 08:43:38Z] = 77.300 s** (btime #64 → probe #88). Các đoạn, neo bằng btime/probe:

| Đoạn | Cửa sổ | Độ dài | Mốc phải |
|---|---|---|---|
| R | [11:15:18, 11:38:28] | 1.390 s | btime #64 (11:15:18Z) → T0-163 lần đầu 11:38:28Z |
| S | [11:38:28, 14:41:28] | 10.980 s | T0-163 → probe #82 |
| T | [14:41:28, 16:06:45] | 5.117 s | probe #82 → btime #66 |
| U | [16:06:45, 08:43:38] | 59.813 s | btime #66 → probe #88 (thuộc #97?/#98?/#99?/#100?/#101?/#102?, chỉ tham chiếu) |

Quét tươi (`blind9696-investigate.py`): repo-1 93 file, hidden_files 2.654, ngoài cây 1.579, /tmp **2**, fifth 6 → merged **1.969 mốc giây duy nhất** (T2-168: 1.778 — tăng 191 do cửa sổ kéo dài tới probe #88, chủ yếu là file đợt 168/169 trong U). **/tmp = 2 file (đợt 168: 646): cả hai đều là `/tmp/jarvis-tool-output-*.json` mtime 08:35:58Z — tạo SAU reboot #77 bởi chính lượt 169 (dispatch 08:35:51Z); 646 file /tmp đợt 168 đã bị tmpfs xóa sạch bởi reboot #77** (cùng họ F-167-T2-3; R/S/T /tmp vẫn = 0).

### 2.2 Đồng hồ, reboot #76/#77 (T7-168 + T2-169 đối chiếu)

**Reboot #77 — T2-169 xác minh btime bằng 7 nguồn (T0-169 sở hữu xác minh đầy đủ 9 nguồn; T2 chỉ cần btime cho (m) #77 và gap #76):** boot_id c44cc3ba-f637-4c2a-88f7-c5dac53fe8a7; `/proc/stat` btime 1795335832 = 08:23:52Z; `uptime -s` 08:23:52Z; /proc/1 mtime 08:24:03.99Z (+11,99 s); journal idx 0 duy nhất, first entry 08:24:04Z (+12 s); wtmp begins 08:24:04Z (+12 s); `last` reboot 08:24 still running; `who -b` 08:24. **KHÔNG nghịch lý đồng hồ.** Gap #76→#77 = **3.089 s** (51m29s). **#77 xảy ra 11m59s TRƯỚC khi đợt 169 mở (08:35:51Z).** Marker có sống qua #76 không — CHƯA có đếm độc lập lúc T2 viết (giao T0-169; T0-168 đếm độc lập tới #75: 27 reboot #49–#75).

**Reboot #76 — T7-168 xác minh 9 nguồn trong phiên (T2-169 đối chiếu):** boot_id f2b97695-3c9c-4807-bd3d-7d1660829756; btime 1795332743 = 07:32:23Z; uptime -s 07:32:23Z; /proc/1 mtime 07:32:34.062Z (+11,062 s); journal idx 0 duy nhất, first entry 07:32:34Z (+11 s); wtmp begins 07:32:34Z (+11 s); `last` reboot 07:32 still running; `who -b` 07:32; Cloudflare ±1 s ×2. Gap #75→#76 = **7.177 s**. Parent đã XÁC NHẬN số hiệu #75 và #76 ở quyết (d) đợt 168; **số hiệu #77 thuộc T0-169 chứng nhận — T2 ghi nhận, không tự chứng nhận.**

**Run 168 — kết cục (T2-169 đọc DB tươi qua muse.db, 08:44–08:47Z — xem §4.2):** **SUCCEEDED 08:18:55Z** (event 08:18:55.858Z, eid 10015), wall từ started gốc 9.784 s, **margin 1.016 s** tới hạn 08:35:51Z, claimed→finished **7 s** (trở lại họ 6–11 s sau ca 108 s của run 167 — chỉ ghi nhận, không suy cơ chế), attempt 1, **1 lần viết lại (tại #76 +32,309 s)**; 5 event đầy đủ, 0 event sau succeeded. Finish **297 s TRƯỚC btime #77** nên #77 không viết lại run 168. Run 169 (`1ad9d142`, sched 08:35:51Z) running lúc T2 đọc DB, jitter 0 s (lần thứ 22 liên tiếp), 1 event dispatched 08:35:51.105Z (eid 10017) — kết cục thuộc T7-170.

**POSTBOOT_PASS / watcher (T5-169 sở hữu — T2 chỉ ghi nhận):** **POSTBOOT_PASS #77 ĐÃ CÓ 08:46:44Z** (replay-đầy-đủ, poll=0, verify độc lập exit 0 — 11/11 gói + 5/5 lib, GST 269=269; T5-169); **#76 KHÔNG CÓ** (boot thứ 13 lọt — không bù được); #75 ĐÃ CÓ (06:01:38Z, mode repair — parent quyết mode repair ĐƯỢC TÍNH đủ điều kiện gate (a), quyết (b) đợt 168); #74 còn hiệu lực; #71/#72/#73 KHÔNG CÓ. **Hướng (3) VẪN ĐỨNG (lần thứ 16, theo T5-169).** Watcher-168 (pid 13133, START 05:43:17Z, boot 576ca271) CHẾT theo #76 (191 poll — T5-169 xác nhận; poll cuối 07:32:18Z — xem §4.5). Watcher-169 (pid 25426, START 08:46:43Z, boot c44cc3ba) đang chạy lúc T2 viết — START SAU probe #88 nên 0 poll trong cửa sổ điều tra (ghi rõ, không phải thiếu dữ kiện). **Điều tra #75 (replay không chạy): T5-169 đã loại backoff/receipt-skip/fold/gói/cache-trong/lock; còn 2 ứng viên host-side — CHƯA XÁC ĐỊNH, đề xuất leo thang host-side** (T5-169 sở hữu).

### 2.3 Hoạt động từng đoạn (merged log, mốc giây)

| Đoạn | Mốc giây | File-marks | Nhận xét |
|---|---|---|---|
| R [11:15:18, 11:38:28] | 14 | 56 | Hố 1.238 s (xem §2.4) — Y HỆT T2-164/T2-165/T2-166/T2-167/T2-168 |
| S [11:38:28, 14:41:28] | 252 | 480 | Đóng — y hệt T2-168 từng số (252 mốc / 480 file-marks) |
| T [14:41:28, 16:06:45] | 234 | 667 | Đóng — y hệt T2-168 từng số |
| U [16:06:45, 08:43:38] | 1.469 | 3.133 | Đóng theo union (xem §2.4) — hố file max MỚI 1.516 s, chỉ tham chiếu |

**Nội dung trong R (56 file-marks, kiểm tay — y hệt T2-164/T2-165/T2-166/T2-167/T2-168):** đầu 11:35:56Z tool-output exec-call agent 5001d1e4; 11:37:30Z tool-output agent 2c32ef43; 11:37:42Z sampler-162 scripts. R-head [11:15:18–11:34:25]: 0/0/0/0/0 mọi scope (trống). R-tail: repo-1=2 / hidden_files=51 / outside=3 / tmp=0 / fifth=0. **Mốc dpkg 11:35:40Z (TRONG hố R) là mốc nội dung THẬT:** hoạt động dpkg đầu trên #64, 2 dòng "startup packages configure", boot+20m22s — T0-162 quan sát trực tiếp từ dpkg.log #64 (dòng đầu 11:35:40Z; file đã reset theo #65/#66/#67/#68/#69/#70/#71/#72/#73/#74/#75/#76/#77, quan sát còn trong T0-162 LIMITS + aggregate 162). Cùng loại với mốc dpkg 08:35:41Z mà T2-162 đã tính cho đoạn N. Được tính vào cả UNION-A lẫn UNION-B. **Không có nguồn độc lập thứ ba cho R-head:** dpkg.log đã reset 13 lần kể từ #64; journal/dmesg chỉ còn boot hiện tại (journal xoay theo boot; dmesg EPERM) — ghi rõ, không giấu. R-head trống hoàn toàn trên mọi scope đo được.

**Nội dung khác (content script, `blind9696-content.py` — số R/S/T khớp T2-168 từng dòng, cộng thêm sampler/watcher-168/169):** sampler-162 (d9a8d1ce) 1 dòng trong R (11:37:42Z, sau hố) + 138 dòng trong S; watcher-162 strict polls 331 trong S (last poll 14:25:20Z — chết sớm, T0-163); watcher-161 linger polls sau btime #64: 0; sampler-163 3 dòng trong S tail + 45 dòng edb2acdb trong U (dòng cuối 16:52:21Z); watcher-163 163 poll trong T + **1 dòng trong U (poll cuối 16:06:54Z — poll đua với reboot #66, 9 s sau btime, nhãn boot cũ 1c1cf10c)**; sampler-164: 28 dòng f1d4ce1a + 107 dòng 0c8a94aa trong U (dòng cuối 19:53:52Z); watcher-164: 52 strict poll trong U (last poll 18:06:41Z — poll đua với reboot #68, 11 s sau btime, nhãn boot cũ f1d4ce1a); sampler-165: 88 dòng 9a1a9319 + 46 dòng d1ddd946 trong U (dòng cuối 22:51:29Z); watcher-165: 164 strict poll trong U (last poll 22:05:31Z — poll đua với reboot #70, 6 s sau btime, nhãn boot cũ 9a1a9319); sampler-166: 30 dòng d1ddd946 + 93 dòng ea73ac4f trong U (dòng cuối 01:41:07Z); watcher-166: 56 strict poll trong U (last poll 00:08:20Z — poll đua với reboot #71, 20 s sau btime, nhãn boot cũ d1ddd946); sampler-167: 88 dòng b643911f + 40 dòng 194efd93 trong U (dòng cuối 04:45:54Z; dòng b643911f cuối 04:05:35Z = btime #74 +6 s — dòng sampler khung cũ sau btime, cùng mẫu OVERLAP); watcher-167: 170 strict poll b643911f trong U (last poll 04:05:41Z — poll đua với reboot #74, 12 s sau btime, nhãn boot cũ b643911f) + 163 strict poll 194efd93 trong U (last poll 05:29:40Z — kết thúc theo lịch, không chết theo #75); **sampler-168 MỚI ĐẦY ĐỦ: 113 dòng 576ca271 + 22 dòng f2b97695 trong U (dòng 576ca271 cuối 07:32:37Z = btime #76 +14 s — dòng sampler khung cũ sau btime, OVERLAP thứ sáu; dòng f2b97695 đầu 07:33:32Z = btime #76 +69 s, cuối 07:54:32Z — sampler dừng ~07:54:32Z)**; **watcher-168 MỚI ĐẦY ĐỦ: 191 strict poll 576ca271 trong U (last poll 07:32:18Z — CHẾT THEO #76, 5 s TRƯỚC btime, KHÔNG có poll nào sau btime)**; **sampler-169 MỚI: 2 dòng c44cc3ba trong U (đầu 08:42:19Z — trong cửa sổ probe #88)**; **watcher-169: 0 poll trong cửa sổ (START 08:46:43Z — SAU probe #88 08:43:38Z, 0 trong cửa sổ là đúng kỳ vọng)**.

**Jump witness (hoạt động) tại #64–#77: đều = 0 hoạt động thật** (`blind9696-sessions.py`, 296 exec-log có mtime trong cửa sổ: R 1, S 34, T 33, U 228). Mọi hit regex đều là trích dẫn hoặc artifact phương pháp, đã kiểm tay từng hit MỚI:
- #64 (7 hit), #65 (7 hit), #66 (8 hit), #67 (8 hit), #68 (6 hit), #69 (3 hit), #70 (5 hit) — số đếm tăng +1 so với đợt 168 ở MỖI mốc (xem F-169-T2-2): file MỚI `proc_feb5e6bf35a2.log` (log phiên T2-168, trích cửa D [19:04:44Z 20/11, 20:22:43Z 22/11] + cửa hẹp phụ giây [20:16:36Z, 20:16:40Z] — cùng mẫu trích dẫn; max thật của nó là trích "20:16:40" gán sai ngày — xem F-169-T2-5).
- #71 (5 hit — tăng từ 4): 4 hit cũ + proc_feb5e6bf35a2.log MỚI (trích dẫn).
- #72 (3 hit — tăng từ 2): proc_1c620b5730b5.log (span thật 22:05:25Z 21/11 .. 04:18:06Z 22/11 — trích header + appendix T5-167; max ĐÃ SỬA từ 22:08:08Z ảo — xem F-169-T2-1) + proc_3f36e49bbc0f.log (trích dẫn) + proc_feb5e6bf35a2.log MỚI (trích dẫn).
- #73 (3 hit — tăng từ 2): cùng 3 file như #72 (trích dẫn).
- **#74 (4 hit — tăng từ 1 đã đính chính đợt 168):** proc_24fc370311e3.log (F-168-T2-2, session-continuity artifact) + proc_1c620b5730b5.log (max thật 04:18:06Z — trích appendix T5-167 viết 04:18:06Z) + proc_feb5e6bf35a2.log MỚI (trích dẫn) + **proc_baa572cf2e1d.log MỚI** (log phiên T7-168: trích header REPLAY-WATCH-167 lan 1/lan 2 — btime 02:28:01Z/04:05:29Z — + "HET PHU LUC T5-168 06:04:59Z" — trích dẫn). **0 hoạt động VM thật bắc qua btime #74.**
- **#75 (3 hit — tăng từ 0 đã đính chính đợt 168):** proc_feb5e6bf35a2.log MỚI + proc_baa572cf2e1d.log MỚI (trích dẫn) + **proc_0212f9ea04ef.log MỚI** (log phiên main agent: trích bảng T0-168 — `round167-t10.done` mtime 05:23:51Z + `round168-t0.done` 05:43:32Z — trích dẫn). **0 hoạt động VM thật bắc qua btime #75.**
- **#76 (1 hit — MỚI):** proc_feb5e6bf35a2.log (trích cửa D — span [19:04:44Z 20/11, 20:16:40Z 22/11] toàn trích dẫn; xem F-169-T2-5). **0 hoạt động thật bắc qua btime #76.**
- **#77 (1 hit — MỚI):** proc_feb5e6bf35a2.log (cùng file, trích dẫn). **0 hoạt động thật bắc qua btime #77.**
- Exec-log content-ts trong hố R union (11:15:18–11:35:40): 3 hit, 0 mốc hoạt động: 11:16:22Z ×3 (trích biên hố H-R1-old — 2 hit cũ + proc_3f36e49bbc0f.log trích dòng hole-recheck của T2-167) — y hệt T2-168 về bản chất.
- Exec-log content-ts trong hố U file max MỚI H-U6 (06:56:58–07:22:14): **0 hit, 0 mốc hoạt động** (hố nằm trong phiên T7-168 — sau harness 06:39:13Z, trước khi sleep #5 spawn 07:22:24Z; được lấp đầy bởi mốc nội dung sampler-168 576ca271 mỗi 60 s → union-A max vẫn 926 s ở nơi khác).

### 2.4 Mốc merged + verdict (luật gap, sàn 1.147 s)

| Đoạn | File max gap | Union-A max gap | Union-B max gap | Verdict |
|---|---|---|---|---|
| **R** | **1.238 s** (11:15:18 → 11:35:56) | **1.222 s** (11:15:18 → 11:35:40) | **1.211 s** (11:15:29 → 11:35:40) | **MỞ (y hệt T2-168)** |
| S | 843 s | 662 s | 591 s | ĐÓNG |
| T | 307 s | 31 s | — | ĐÓNG |
| U | **1.516 s** (06:56:58 → 07:22:14, MỚI) | 926 s | **814 s** | ĐÓNG theo union (tham chiếu) |

Union-A = mốc file + mốc nội dung (dpkg 11:35:40Z); Union-B = Union-A + mốc hệ thống trước btime (11:15:29Z) + mốc đầu boot #71 (00:08:16Z) + #72 (02:05:17Z) + #73 (02:28:13Z) + #74 (04:05:44Z) + #75 (05:32:57Z) + #76 (07:32:34Z) + #77 (08:24:04Z). **R: mọi cách đếm đều MỞ — y hệt T2-168 từng giây (lần thứ năm liên tiếp không đổi).** Biến thể +dispatch 11:35:51Z (DB, không tính vào union chính): 1.211 s — cũng MỞ.

**U — hố file max MỚI 1.516 s (06:56:58→07:22:14, lần đầu xuất hiện):** hố nằm trong phiên T7-168 (sau harness 06:39:13Z, trước sleep #5 spawn 07:22:24Z); được lấp đầy bởi mốc nội dung sampler-168 576ca271 (dòng mỗi 60 s: 06:56:xx–07:22:xx) → union-A 926 s / union-B **814 s** — **ĐÓNG theo union**. Hố cũ H-U5 (22:09:05→22:32:32, 1.407 s) vẫn còn trong danh sách file-gap (đứng thứ hai). Union-B max vẫn là 814 s (23:22:46→23:36:20) — y hệt đợt 168, không trôi thêm. U chỉ tham chiếu cho #96? — không đổi verdict R.

S khớp T2-168 về file (843 s), union-A (662 s) và union-B (591 s) — S ổn định hoàn toàn (252 mốc giây / 480 file-marks, y hệt đợt 168). T đóng chắc (31 s).

**Kết luận đầy đủ: #96? VẪN MỞ qua đoạn R. Quét tươi + kiểm nội dung + sessions + hole-recheck đều đã chạy đầy đủ đợt này và xác nhận lại từng số của T2-168 (R/S/T không đổi một giây; U union-A/B không đổi — hố file max mới 1.516 s được lấp đầy bởi nội dung).**

### 2.5 CERT/FULL ứng viên + INSIDE

**CERT/FULL chính thức GIỮ 76/91** (quyết (b) đợt 164, giữ theo quyết (m) đợt 165, quyết (m) đợt 166, quyết (m) đợt 167 và quyết (m) đợt 168; #95?/#94?/#77? vẫn mở). Gap #63 = 9.073 s cho ứng viên CERT95/FULL110.

**FULL120 KIỂM LẠI ĐỘC LẬP — ĐẠT (nợ từ quyết (c) đợt 168, đã trả):** danh sách FULL120 = FULL119 + [1.376] (khẳng định bằng so sánh danh sách); p10/p90 tính lại bằng hai cách mới độc lập (`statistics.quantiles` method='inclusive' VÀ nội suy chỉ số-sắp xếp viết mới) đều cho **1.555,20 / 8.755,90 s** — KHỚP giá trị T2-168 đã in VÀ giá trị chuỗi s120. T2-169 đã kiểm lại phép tính dải FULL120 độc lập như parent giao.

**FULL121** (gap #74 NOMINAL 5.848 s, CÓ ĐIỀU KIỆN): n=121, mean 1h39'51", median 1h53'00", p10 0h26'03" (1.563,00 s), p90 2h25'48" (8.748,00 s), sd 0h55'44", min 0h00'55", max 5h43'18"; trong 90–150'=65, <60'=28, >180'=8, >240'=3.
**FULL122** (gap #75 NOMINAL 7.177 s, CÓ ĐIỀU KIỆN): n=122, mean 1h40'01", median 1h53'21", p10 0h26'05" (1.564,60 s), p90 2h25'38" (8.738,30 s), sd 0h55'32", min 0h00'55", max 5h43'18"; trong 90–150'=66, <60'=28, >180'=8, >240'=3.
**FULL117/FULL118/FULL119 kiểm lại:** p10/p90 KHỚP T2-167 từng số (FULL117 1.572,60/8.779,60 s; FULL118 1.574,20/8.771,70 s; FULL119 1.575,80/8.763,80 s — script có assert, không trôi chuỗi).

Tốc độ reboot: tới #75: 151 reboot / 273,24 h = 1 lần / 108,6 phút; tới #76: 152 reboot / 275,24 h = 1 lần / 108,6 phút; tới #77: 153 reboot / 276,10 h = 1 lần / 108,3 phút (tới #74: 150/271,79 h = 108,7).

**INSIDE:**
- **#75 INSIDE dải FULL121 [04:31:32Z, 06:31:17Z] neo 04:05:29Z** (biên dưới 3.674 s, biên trên 3.511 s; biên trên chính xác 3.511,0 s) → **chuỗi MỚI từ #73 tiếp tục, dài 2.**
- Đối chiếu vs dải còn hiệu lực: #75 NGOÀI dải FULL120 [02:53:56Z, 04:53:56Z] neo 02:28:01Z (muộn 2.330 s; chính xác 2.329,1 s) — **hai dải KHÔNG đồng thuận (cùng mẫu #71: INSIDE dải phương pháp nhưng NGOÀI dải còn hiệu lực — xem caveat dưới).**
- **#76 INSIDE dải FULL122 [05:58:50Z, 07:58:24Z] neo 05:32:46Z** (biên dưới 5.613 s, biên trên 1.561 s; biên trên chính xác 1.561,3 s) → **chuỗi MỚI từ #73 tiếp tục, dài 3.**
- Đối chiếu vs dải còn hiệu lực: #76 NGOÀI dải FULL121 [04:31:32Z, 06:31:17Z] neo 04:05:29Z (muộn 3.666 s; chính xác 3.666,0 s) — **hai dải KHÔNG đồng thuận (cùng mẫu #71).**
- **Caveat (ghi rõ, parent quyết):** theo dải PHƯƠNG PHÁP (F-165-T2-1: dải cho #k là FULL(110+k−64) neo btime #(k−1)), #75 và #76 đều INSIDE → chuỗi mới từ #73 dài 3. Theo dải CÒN HIỆU LỰC (FULL120 cho #75, FULL121 cho #76), cả hai đều NGOÀI (muộn 2.330 s / 3.666 s). Tiền lệ #71: INSIDE FULL117 nhưng NGOÀI FULL116 muộn 5.521,5 s — chuỗi vẫn được tính tiếp tục theo dải phương pháp (FULL118→#72, FULL119→#73 đã tính; chuỗi chỉ ĐỨT tại #73 theo FULL119, quyết (c) đợt 167). T2-169 áp dụng cùng tiền lệ: **chuỗi tiếp tục dài 3 theo phương pháp; mâu thuẫn với dải còn hiệu lực được ghi rõ để parent quyết** — T2 không tự chốt khi hai dải mâu thuẫn.
- **Nhãn dải — kiểm lại đúng phương pháp (bài học F-165-T2-1):** #75 kiểm theo FULL121 neo btime #74 (mẫu FULL112→#66 … FULL120→#74 ⇒ FULL121→#75, FULL122→#76; mỗi dải gồm gap kết thúc tại neo của nó). FULL120 chỉ là dải đối chiếu còn hiệu lực cho #75, FULL121 chỉ là dải đối chiếu còn hiệu lực cho #76 — KHÔNG phải dải phương pháp.

### 2.6 Hole-recheck

`hole-recheck9696.py`: find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp [19:32:59Z 20/11, 08:43:38Z 22/11]: **9.809 file**. Find stderr: 1 dòng — `/home/hatch/.stagged-uploads: Permission denied` (giới hạn đứng, thư mục mode 0000). **KIỂM TRƯỚC KHI CHẠY (bài học F-166-T2-2): `grep ^W =` → round169-t2 ✓; `grep ^hi =` → 08:43:38Z 22/11 ✓; KHÔNG dùng `#` làm delimiter; output vào thư mục RIÊNG round169-t2 (file MỚI `holerecheck-all.txt`, KHÔNG ghi đè file cũ). File `round168-t2/holerecheck-all.txt` md5 KHÔNG ĐỔI sau lần chạy (af812e76… — kiểm lại sau khi chạy).**

| Hố | Kết quả |
|---|---|
| H-R1 (11:15:18, 11:35:56) | **0 hit — 0 mốc mới** |
| H-R1-old (11:16:22, 11:35:35) | 0 hit |
| H-S1/H-S2/H-S3/H-T1/H-U1/H-U4 | mỗi hố 1 float-trap (cùng giây cạnh trái), 0 mới |
| H-U2 (17:20:48, 17:36:14 — bắc qua btime #67) | 1 inside = 1 trap (cạnh trái 17:20:48.627Z), 0 mới |
| H-U2-old (17:22:25, 17:35:37) | 0 hit |
| H-U3 (19:37:11, 19:49:46) | 10 inside = 10 trap (cùng giây 19:37:11, file stall T8-164), 0 mới |
| H-U5 (22:09:05, 22:32:32) | 1 inside = 1 trap (cạnh trái 22:09:05.886Z, proc_5c237211ba31.log), 0 mới |
| **H-U6 MỚI (06:56:58, 07:22:14)** | **1 inside = 1 trap (cạnh trái 06:56:58.721Z, proc_0a160336a16d.log), 0 mới** |
| H-E1-88 (19:32:59Z, 20:17:30Z) | **337 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI — lần thứ MƯỜI BA liên tiếp 0 mốc mới** |

Known base: 1.969 mốc giây đợt này; base #88? T2-157: 557 giây. **H-E1-88 giữ 337 hit — y hệt lần 9/lần 10/lần 11/lần 12, không trôi thêm** (lần 12 giảm 345 → 337 do 8 exec-log mtime trôi; đợt này 0 file trôi thêm).

### 2.7 Verdict mù (tổng hợp)

| Mù | Verdict đợt 169 | Cơ sở |
|---|---|---|
| #96? (#64) | **VẪN MỞ** (R 1.238/1.222/1.211 s vượt sàn; S/T đóng; U đóng theo union) | Quét tươi + kiểm nội dung đầy đủ, số y hệt T2-168 (U có hố file max mới 1.516 s, đã lấp bằng nội dung) |
| #95? (#63) | **MỞ** (giữ nguyên quyết (b) đợt 164) | Không có bằng chứng mới |
| #94? (#62) | **MỞ** (giữ nguyên) | Không có bằng chứng mới |
| #88? | **VẪN MỞ** (lần thứ 13: 337 hit, 0 mới) | Hole-recheck §2.6 |
| #77? | **VẪN MỞ** (giữ nguyên) | Không có bằng chứng mới |

**CERT/FULL chính thức GIỮ 76/91** (vì #77?/#88?/#94?/#95? vẫn mở; #96? VẪN MỞ — chưa đổi được khi chưa chứng nhận theo thứ tự).

## 3. Mù #88?/#77?/#95?/#94? — giữ nguyên

Mù #88? VẪN MỞ (lần thứ 13, §2.6: 337 hit, 0 mốc mới — y hệt lần 9/lần 10/lần 11/lần 12). **#95?/#94?/#77? GIỮ NGUYÊN, không đổi** — không có bằng chứng mới đợt này. **CERT/FULL chính thức GIỮ 76/91.** T2 không tự đóng/mở bất kỳ mù nào — parent quyết.

## 4. Mô hình đồng hồ + điểm (m)

### 4.1 Điểm (m) #56 — thu hẹp lần thứ MƯỜI HAI: 5 hướng MỚI đều ÂM TÍNH

Cửa GIỮ NGUYÊN: **R [2,56251; 2,66817) s / J [2,566; 2,80753] s** (T2-168, §4.1). **#56 VẪN CÓ ĐIỀU KIỆN; KHÔNG chốt n=15.** Các hướng đã thử đợt này (`m56-169.py`, epoch cửa D [19:04:44Z, 20:22:43Z] 20/11 đã kiểm độc lập):

| Hướng (đợt 169) | Kết quả |
|---|---|
| (i) find cây fifth-scope (/home/hatch/agents + side-chats + dreams + memory) + ~/.cache + ~/.local + ~/.config, mtime float trong cửa D | **18 file — NHƯNG KHÔNG MỚI: đúng 18 file session đã biết từ đợt 166** (3 c90387c7 @19:56:09Z + 3 ad69c371 @19:59:49Z + 3 a71de8cb @20:04:17Z + 3 6fc7dd16 @20:16:36.618–.699Z + 3 af13c1c2 @20:17:30Z + 3 964f2bc4 @20:19:34Z). 9 file sau mốc D-wall (af13c1c2/964f2bc4) đã phân loại E từ đợt 157 (session boot mới, không phải hoạt động D — xem T2-166 §4.1); 9 file trước mốc D-wall không muộn hơn mốc đã biết. **0 mốc D-wall mới muộn hơn 20:16:36.699Z → cận dưới R GIỮ NGUYÊN 2,56251** |
| (ii) stat birth/change/access của 3 file trong [20:16:36Z, 20:16:40Z] + file D-wall (session 6fc7dd16) | **0 thu hẹp:** .jsonl birth 20:05:53Z (sớm hơn mtime), prompt-continuity birth = mtime 20:16:36.619Z, sessions.json birth = mtime 20:16:36.700Z — không có birth nào muộn hơn mtime. Thư mục session 6fc7dd16 mtime 20:06:28Z |
| (iii) /var/log/auth.log + syslog + kern.log + daemon.log + messages, dòng Nov 20 19:xx/20:xx | **TẤT CẢ MISSING** (VM này không có syslog — chỉ có journal; journal xoay theo boot, 0 boot ngày 20/11 — đã biết từ đợt 168) |
| (iv) find /boot mtime trong D + inventory /var/log mtime trong ±1 ngày của D | **0 file /boot trong D; 0 file /var/log trong ±1 ngày của D** |
| (v) grep exec-log content timestamp 20:16:37/38/39/40 (lát dưới-giây SAU mốc D-wall 20:16:36.699Z) | **1 file — trích dẫn của chính phép kiểm:** proc_feb5e6bf35a2.log (log phiên T2-168 trích header "(iii) wider sub-second check: files with mtime in [20:16:36Z, 20:16:40Z]") — 0 mốc mới |

**Đợt 168 (đối chiếu — 5 hướng cũ đều âm tính):** (i) find /var/lib + /var/cache + /var/tmp + /run trong cửa D — 0 file; (ii) `last` + `lastb` trên wtmp + btmp — 0 bản ghi ngày 20/11; (iii) cửa hẹp phụ giây [20:16:36Z, 20:16:40Z] — đúng 3 file, max 20:16:36.699Z; (iv) dpkg.log.1/.gz — 0 dòng ngày 20/11; (v) journal trong cửa D — 0 file. Đợt này thêm 5 hướng MỚI (fifth-scope + dot-config, stat birth/ctime, syslog family, /boot + /var/log inventory, grep 20:16:37–40) — tổng 15 hướng âm tính liên tiếp (10 hướng đợt 167/168 + 5 hướng đợt này, chưa kể các hướng đợt 158–166). **Cửa R/J GIỮ NGUYÊN; không có mốc mới nào để thu hẹp.**

### 4.2 Điểm (m) #77 — KHÔNG PHẢI ĐIỂM (đối chiếu độc lập, DB đọc tươi)

**Nợ giao từ đợt 168 (§11 mục 2, nợ mở đợt 168 + aggregate 168 §12.3(e) — T2-169 đối chiếu độc lập từ DB (T2-169 tự đọc, không dựa vào T0/T7). Dải (m) 33–49,8 s (định nghĩa: offset btime-tương đối trong khung giờ boot mới; xem ghi chú đứng).**

| Hạng mục | Giá trị |
|---|---|
| Btime #77 | 1795335832 = 08:23:52Z 22/11 (boot c44cc3ba — T2-169 xác minh 7 nguồn, §2.2) |
| Requeue trong cửa [08:23:52Z, 09:00:00Z] | **0 dòng (mọi job)** |
| Tất cả event trong cửa | **5 dòng: reconciled ×2, dispatched run 169 08:35:51.105Z (eid 10017), dispatched + succeeded feed-pulse-15 08:41:54Z (eid 10019/10020)** |
| Run spanning btime #77 | **0 dòng (mọi job — started trong 3h trước btime, chưa finish hoặc finish sau btime)** |
| Run 168 | finished 08:18:55Z = btime −297 s |
| Run 169 | started 08:35:51Z = btime +719 s (dispatch 08:35:51.105Z, eid 10017, jitter 0 s) |

Nguồn: T2-169 đọc DB tươi qua muse.db (`scheduler.job_runs` + `scheduler.events`, đọc 08:44–08:47Z 22/11 — 4 query: 2 run vcut 168/169 đầy đủ + events 2 run + requeue theo cửa + spanning theo btime). **Chữ ký giống #52/#61/#67/#73/#75 (btime rơi vào khoảng trống giữa hai run). N không đổi vì #77.**

### 4.3 Điểm (m) #76 — CHỈ GHI CHÚ THAM CHIẾU (parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM — KHÔNG mở lại)

Quyết (e) đợt 168: **#76 KHÔNG PHẢI ĐIỂM** (requeue +32,309 s NGOÀI dải 33–49,8 s, dưới biên 0,691 s). T2-169 đối chiếu lại số học từ DB đọc tươi: requeue run 168 07:32:55.309Z (eid 10000) − btime #76 07:32:23Z = **+32,309 s** — KHỚP T7-168; dispatch 07:32:55.431Z (+32,431 s); reattach 07:32:55.516Z (+32,516 s); started_at viết lại 1795325751 → 1795332775 (delta 7.024 s); 1 lần viết lại duy nhất, không viết lại lần 2. **T2-169 KHÔNG mở lại phân loại — chỉ ghi chú tham chiếu theo giao; kiểm lệch khung §4.5 xác nhận quyết đứng vững dưới mọi neo.**

### 4.4 Reboot #77 — xác nhận bổ sung (T2-169 + T0-169)

Xem §2.2. T2-169 xác minh btime #77 bằng 7 nguồn (không có Cloudflare — giao T0-169 xác minh đầy đủ 9 nguồn + Cloudflare). Parent đã XÁC NHẬN số hiệu #75/#76 ở quyết (d) đợt 168; **số hiệu #77 thuộc T0-169 chứng nhận (đã 7/9 nguồn từ T2) — T2 ghi nhận, không tự chứng nhận.**

### 4.5 Lệch khung giờ biên #75/#76 — #75 KHÔNG OVERLAP; #76 OVERLAP (thứ sáu)

**Bằng chứng (T5-168 + T7-168 + T2-169 kiểm trực tiếp từ `round168-t5/replay-watch-168.log` và `round168-t9/ram-sampler.log`):**

| Bằng chứng | Giá trị | Offset so với btime |
|---|---|---|
| **Biên #75 (btime 05:32:46Z):** | | |
| Nội dung boot cũ sau btime #75 | **0 dòng** (watcher-167 lần 2 kết thúc theo lịch 05:30:10Z; sampler-167 dòng 194efd93 cuối 04:45:54Z; sampler-168/watcher-168 bắt đầu sau btime) | — |
| /proc/1 mtime (boot mới) | 05:32:56.882Z | +10,882 s |
| journal first entry (boot mới) | 05:32:57Z | +11 s |
| wtmp begins (boot mới) | 05:32:57Z | +11 s |
| **Biên #76 (btime 07:32:23Z):** | | |
| Dòng sampler-168 cuối 576ca271 | **07:32:37Z** | **+14 s** (OVERLAP — F-168-T9-3) |
| Poll cuối watcher-168 | **07:32:18Z** | **−5 s** (chết theo #76, không poll sau btime) |
| /proc/1 mtime (boot mới) | **07:32:34.062Z** | **+11,062 s** |
| journal first entry (boot mới) | 07:32:34Z | +11 s |
| wtmp begins (boot mới) | 07:32:34Z | +11 s |
| Dòng sampler-168 đầu f2b97695 | 07:33:32Z | +69 s |

**Tại #75: KHÔNG CÓ OVERLAP** — không một dòng nội dung boot cũ nào sau btime #75; bằng chứng khung mới đến ngay sau btime (+11 s) và không có gì mâu thuẫn. Không có vấn đề lệch khung tại #75.

**Tại #76: OVERLAP (thứ sáu — sau #62: 824 s, #68: ≥11 s, #70: ≥6 s, #71: 20 s, #73/#74: 12 s).** Khác #74 (bằng chứng khung mới +15,575 s đến SAU poll cuối khung cũ +12 s 3,575 s — khoảng neo "thật" KHÔNG RỖNG): tại #76, bằng chứng khung mới (/proc/1 +11,062 s) đến **TRƯỚC** dòng boot cũ cuối (+14 s) 2,938 s — **khoảng neo "thật" RỖNG theo mẫu #71** (tại #71: bằng chứng khung mới +4,575 s đến TRƯỚC poll cuối khung cũ +20 s). Offset requeue theo neo khung cũ (dòng sampler cuối +14 s) = **18,309 s — DƯỚI dải 33** (khác #74: 34,242 s, trong dải); offset theo neo khung mới (/proc/1 +11,062 s) = **21,247 s — DƯỚI dải** (khác #71: 21,274 s, cũng dưới dải — nhưng #71 là điểm DƯƠNG theo btime +41,274 s; #76 là NGOÀI dải theo btime +32,309 s).

**Phán: OVERLAP thứ sáu tại #76; KHÔNG OVERLAP tại #75. Phân tích lệch khung một mình không cứu được #76: offset requeue dưới MỌI neo (btime 32,309 s; /proc/1 21,247 s; dòng sampler cuối 18,309 s) đều dưới biên 33 s. Áp dụng ghi chú đứng, quyết parent (e) đợt 168 (#76 KHÔNG PHẢI ĐIỂM) đứng vững — T2-169 chỉ ghi chú tham chiếu, KHÔNG mở lại phân loại.**

### 4.6 Nhãn n (tổng hợp)

- **n chính thức: GIỮ 14** (parent quyết; T2 không tự đổi).
- n ứng viên (nhánh khuyến nghị): **GIỮ 27** (24 dương + 3 âm — #74 đã CHẤP NHẬN theo quyết (f) đợt 168; #75/#76 KHÔNG PHẢI ĐIỂM; #77 KHÔNG PHẢI ĐIỂM — n không đổi vì #77).
- n ứng viên (nhánh #56 ÂM): **GIỮ 28** (24 dương + 4 âm — #56).
- #56 vẫn CÓ ĐIỀU KIỆN (§4.1) — KHÔNG chốt n=15.
- #77 KHÔNG PHẢI ĐIỂM — n không đổi vì #77.

## 5. RAM trong cửa sổ probe #88 (05:46:00Z → 08:43:38Z)

`ram-max9696.py` trên `round168-t9/ram-sampler.log` (T9-168) + `round169-t9/ram-sampler.log` (T9-169). **131 mẫu tổng**; **peak 3.273.520 kB = 52,03% guard** (guard 6.291.456 kB); **0 mẫu ≥ guard**; balloon(==ceiling) **60**.

| Nguồn | Mẫu | Peak (kB) | % guard | Balloon |
|---|---|---|---|---|
| T9-168 boot 576ca271 | 107 | 3.273.520 | 52,03% | 60 (E-170 48 + E-171 12) |
| T9-168 boot f2b97695 | 22 | 1.803.884 | 28,67% | 0 |
| T9-169 boot c44cc3ba | 2 | 939.136 | 14,93% | 0 |
| **Tổng cửa sổ #88** | **131** | **3.273.520** | **52,03%** | **60** |

- **Balloon 60 = E-170 (48 mẫu, boot #75, ĐÃ KẾT THÚC) + E-171 (12 mẫu, boot #76, ĐANG GHIM lúc đóng đợt 168)** — toàn bộ nằm trong cửa sổ probe #88, đã đếm đợt 168; **0 balloon mới trên boot #77 trong cửa sổ** (T9-169: 2 mẫu, 0 balloon — nhưng sampler mới chạy 08:42:19Z, chưa đủ mẫu để kết luận xu hướng; T9-169 theo dõi tiếp).
- **Peak 52,03% = cùng đỉnh phiên T9-168** (max 3.273.520 kB — cao nhất chuỗi 150–168, theo aggregate 168 §10.3); 107 mẫu 576ca271 trong cửa sổ này KHỚP 107 mẫu T9-168 đợt 168 (6 mẫu trước 05:46:00Z nằm ngoài cửa sổ — kiểm chéo số học: 113 dòng 576ca271 trong U − 6 dòng trước 05:46:00Z = 107 ✓).
- **Headroom / ENOSPC / birefnet chờ T9-169 xác nhận cuối đợt** (T9-168: headroom 2 lần thứ 28, ENOSPC ≥102 lần thứ 17, birefnet 0 thử lần thứ 22 — xem aggregate 168 §12.1 (k)/(l)).
- **Birefnet: 0 lần thử trong cửa sổ probe #88** (chuỗi lần thứ 23 chờ T9-169 xác nhận cuối đợt — đợt 168 là lần thứ 22).
- **Caveat (cùng họ F-142-T2-10):** sampler gap **07:54:32Z → 08:42:19Z = 2.867 s** chứa reboot #77 (08:23:52Z) — peak trong đoạn này là cận dưới (không có mẫu nào đo được trong khoảng 07:54:32–08:42:19Z). Peak 52,03% là đỉnh của 131 mẫu ĐO ĐƯỢC, không phải đỉnh tuyệt đối của cửa sổ.

## 6. Phương pháp, sai số của T2, câu hỏi cho parent

### 6.1 Phương pháp (tóm tắt — script trong `~/workspace/goals/capcut-clone-video-editor/hidden_files/round169-t2/`)

- Probe: `scripts/probe-eperm-v2.sh` (status → once), log `hidden_files/eperm-probe-v2.log`, heartbeat `hidden_files/eperm-probe-v2.heartbeat`; sweep: `eperm-sweep9696.py` (113 file `*.log` mtime trong cửa sổ, phân biệt trích dẫn/status vs sóng thật).
- Mù: `blind9696-investigate.py` (5 scope, mtime float, merge), `blind9696-content.py` (kiểm nội dung sampler/watcher từng đoạn + union-A/B), `blind9696-sessions.py` (jump witness, 296 exec-log — ĐÃ SỬA bare-time same-line-date, xem F-169-T2-1), `blind9696-merged.py` (gap file/union-A/union-B), `hole-recheck9696.py` (find toàn cây + float-trap — file MỚI, không ghi đè file cũ).
- INSIDE: `blind9696-gaps.py` (FULL121/FULL122, p10/p90 theo đúng phương pháp các đợt trước; kiểm lại FULL120 độc lập bằng hai cách tính mới; đối chiếu FULL120/FULL121 còn hiệu lực).
- (m): `m-check9696.py` (epoch số học + đếm requeue theo cửa — DB đọc tươi qua muse.db, 4 query) + đối chiếu 3 nguồn (§4.2) / tham chiếu (§4.3); `m56-169.py` (5 hướng mới).
- RAM: `ram-max9696.py` trên 2 sampler log; WFS: `scan-wfs74.sh` + `grep -c writeFileSync` trên LIMITS đợt 168.
- **WFS #75:** NEWSTD 300 file / 998 dòng; R7B 317 file / 1.023 dòng; COPIES 17 file / 25 dòng; **998+25=1.023, chênh 0 — lần thứ 75 liên tiếp.** Delta vs #74 (+1 file / +2 dòng) giải thích đầy đủ: `docs/PHASE9_ROUND168_T2_EPERM_LIMITS.md:2` (grep -c `writeFileSync` = 2 — file LIMITS mới của T2-168, 2 lần nhắc ở §6.1/§6.2; diff wfs-newstd.txt đợt 168→169 chỉ thêm đúng 1 dòng này). Async `.writeFile(` helpers không đổi (eperm-retry.mjs, epermRetry.js:116 + 1 lần nhắc trong GAP).

### 6.2 Sửa artifact F-168-T2-1 (bare-time same-line-date) — ĐÃ XONG + artifact mới cùng họ

**F-168-T2-1 (bare-time gán sai NGÀY) — ĐÃ SỬA XONG đợt này (hướng sửa T2-168 đề xuất):** bare-time trong `blind9696-sessions.py` nay lấy ngày từ full timestamp trong CÙNG DÒNG khi có, fallback mới dùng ngày file-mtime. **Kiểm lại: `proc_1c620b5730b5.log` max đã sửa từ "22:08:08Z 22/11" (ảo) thành "04:18:06Z 22/11" (thật — timestamp appendix T5-167, trích dẫn)** — file này nay span #71/#72/#73/#74 bằng trích dẫn (trước đây span giả #74/#75 bằng max ảo; nay span #74 bằng max thật nhưng vẫn là trích dẫn — verdict 0 hoạt động thật không đổi).

**F-169-T2-1 (bare-time same-line-date — ĐÃ SỬA, xem trên):** việc sửa lộ thêm 3 log phiên mới span #74/#75 bằng trích dẫn (proc_feb5e6bf35a2.log, proc_baa572cf2e1d.log, proc_0212f9ea04ef.log — xem §2.3). Số đếm jump-witness đợt 169: #64: 7, #65: 7, #66: 8, #67: 8, #68: 6, #69: 3, #70: 5, #71: 5, #72: 3, #73: 3, #74: 4, #75: 3, #76: 1, #77: 1 — tất cả đều là trích dẫn/artifact, 0 hoạt động thật. (Đợt 168: #64–#68: 6/6/7/7/5, #69: 2, #70: 4, #71: 4, #72: 2, #73: 2, #74: 1 đã đính chính, #75: 0 đã đính chính — tăng do 3 log phiên mới của đợt 168 + sửa bare-time.)

**F-169-T2-2 (lỗi tham số sessions.py của chính T2 — bắt và chạy lại trước khi viết LIMITS, cùng họ F-168-T2-5):** lần chạy `blind9696-sessions.py` đầu tiên dùng sai epoch hố U (+1.200 s mỗi đầu: 07:16:58–07:42:14Z thay vì 06:56:58–07:22:14Z — T2 gõ tay sai epoch, không kiểm bằng python trước). Đã chạy lại với tham số đúng 1795330618/1795332134 → 0 hit trong hố U file max MỚI (lần đầu cho 2 hit tại 07:30:00Z/07:35:35Z trong cửa sổ sai). LIMITS dùng lần chạy thứ hai; file output lần đầu đã bị ghi đè bởi lần chạy thứ hai (cùng tên file — lần sau ghi đè lần trước, không còn bản sai trên đĩa).

**F-169-T2-3 (lỗi epoch requeue của chính T2 — bắt và chạy lại trước khi viết LIMITS):** `m-check9696.py` bản đầu gõ sai `requeue76 = 1795332755.309` (thiếu 20 s — đúng là 1795332775.309), in ra offset 12,309 s thay vì 32,309 s. Bắt được nhờ mâu thuẫn với giá trị kỳ vọng 32,309 s đã ghi trong docstring + T7-168. Đã sửa và chạy lại — bản thứ hai in đúng 32,309 s / 32,431 s / 32,516 s. LIMITS dùng lần chạy thứ hai; không có output nào đã ghi bị ảnh hưởng (chưa viết LIMITS lúc phát hiện).

**F-169-T2-4 (lỗi sed hai bước của chính T2 — bắt trước khi chạy script):** sed đổi cửa sổ `eperm-sweep9696.py`/`ram-max9696.py` bằng hai biểu thức liên tiếp đã ghi đè sai (W0=W1=08:43:38Z — biểu thức thứ hai ăn luôn kết quả biểu thức thứ nhất). Đã sửa bằng python-replace tường minh (sweep) và viết lại sạch (ram-max) TRƯỚC khi chạy — không output nào đã ghi bị ảnh hưởng. Bài học: không dùng sed hai bước đổi cùng một chuỗi đích; kiểm tra giá trị sau mỗi lần sed.

**F-169-T2-5 (bare-time fallback vẫn gán sai ngày khi ngày chỉ xuất hiện dạng "20/11" — giới hạn đã biết, giao T2-170):** `proc_feb5e6bf35a2.log` max "20:16:40Z 22/11" vẫn là trích sai ngày: bare-time "20:16:40" nằm trong dòng "(iii) wider sub-second check: files with mtime in [20:16:36Z, 20:16:40Z] 20/11" — ngày đúng (20/11) chỉ xuất hiện dạng text "20/11", không phải full timestamp ISO, nên fallback ngày file-mtime (22/11) vẫn gán sai. Max thật của file này là trích cửa D ngày 20/11. **Verdict không đổi** (span của file toàn trích dẫn, 0 hoạt động thật — xem §2.3). Hướng sửa cho T2-170: fallback nên thử pattern ngày `DD/MM`/`YYYY-MM-DD` trong cùng dòng trước khi dùng ngày file-mtime.

**Đã biết, giao T10-169:** nhãn GAP §97 còn cũ so với quyết parent §12.3 đợt 168 (quyết (a)–(o) đã viết — §97 hiện vẫn ghi "chờ quyết parent §12.1 aggregate 168") — T10-169 cập nhật khi viết §98 (cùng mẫu F-168-T1-1). Không thuộc phạm vi T2. **F-169-T1-2 (T1-169): GAP §97 ghi sai số chờ push "30/42/41/39" — đúng là 40 đường dẫn** (T1-169 đối chiếu; T10-169 sửa khi viết §98). **F-169-T1-3 (T1-169): nhãn chuỗi đếm lệch 1 (T10-168 ghi 63, quyết parent (a) ghi 62)** — T10-169 ghi nhận khi viết §98.

### 6.3 Câu hỏi cho parent (chờ quyết ở aggregate 169)

1. **(m) #77 KHÔNG PHẢI ĐIỂM: ghi nhận?** (T2-169: 0 requeue, 0 run spanning btime, chữ ký giống #52/#61/#67/#73/#75.)
2. **INSIDE #75/#76: chuỗi MỚI từ #73 tiếp tục dài 3 — ghi nhận?** (#75 INSIDE FULL121; #76 INSIDE FULL122 — theo dải phương pháp; CẢ HAI đều NGOÀI dải còn hiệu lực (muộn 2.330 s / 3.666 s) — cùng mẫu #71, parent quyết tiền lệ nào áp dụng.)
3. **FULL120 kiểm lại độc lập: ĐẠT — ghi nhận?** (p10/p90 1.555,20/8.755,90 s khớp T2-168 bằng hai cách tính mới — nợ từ quyết (c) đợt 168 đã trả.)
4. **(m) #76 ghi chú tham chiếu (parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM): ghi nhận lệch khung #75/#76?** (#75 không overlap; #76 OVERLAP thứ sáu, offset dưới mọi neo đều dưới dải — quyết đứng vững.)
5. **#96? vẫn MỞ / theo dõi tiếp đợt 170?** (R không đổi một giây qua 5 đợt liên tiếp; S/T đóng; U có hố file max mới 1.516 s nhưng đóng theo union 926/814 s.)
6. **#56 vẫn CÓ ĐIỀU KIỆN?** (lần thứ 12 âm tính — 5 hướng MỚI; cửa R/J giữ nguyên; KHÔNG chốt n=15.)
7. **F-169-T2-1..5 ghi nhận?** (đặc biệt F-169-T2-1 — sửa bare-time xong, lộ 3 log phiên trích dẫn mới; F-169-T2-5 — giới hạn fallback "20/11", giao T2-170.)
8. **R9 (a) vẫn chờ user** (số đếm vẫn là 16); **G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời). **(m) #96?/#95?/#94?/#88?/#77? — không tự đóng/mở, chỉ đề xuất, parent quyết.**

## 7. File + stage

- LIMITS này: `docs/PHASE9_ROUND169_T2_EPERM_LIMITS.md`
- Stage: `phase9-round169-t2-eperm.txt` (1 entry, NUL-delimited, text only — xem paths-loop)
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round169-t2.done`
- Thư mục làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round169-t2/` (script + log: blind9696-*.py, eperm-sweep9696.py, hole-recheck9696.py, ram-max9696.py, m-check9696.py, m56-169.py, inside-169 (trong blind9696-gaps.py), scan-wfs74.sh, *.log/*.txt)

**Trạng thái cờ đợt 169 lúc T2 viết (~09:10Z):** T0 ✓ (08:44Z — #77 9/9 nguồn, run 168 SUCCEEDED, marker 28 reboot), T1 ✓ (verify 168 PASS + suite 28/28 trên c44cc3ba), T5 ✓ (09:06Z — POSTBOOT_PASS #77 ĐÃ CÓ 08:46:44Z replay-đầy-đủ), T6 ✓ (08:53Z — (A) 120/120 lần 19, #76/#77 KHÔNG giết holder). Chưa đóng: T4, T7 (kết cục run 168 — T2 đã đọc DB tươi: SUCCEEDED 08:18:55Z, xem §4.2; T0-169 đối chiếu KHỚP), T8 (dọn X193/X194/X195 mới trong phiên suite, mtime 08:49Z — F-169-T1-4), T9, T10. **Caveat:** các số T9-169 cuối đợt (birefnet lần thứ 23, headroom lần thứ 29, ENOSPC lần thứ 18, E-171 kết cục) chưa có lúc T2 viết — T10-169 lấy từ T9-169 khi tổng hợp.
