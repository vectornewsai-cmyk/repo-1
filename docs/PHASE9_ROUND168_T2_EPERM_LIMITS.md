# PHASE9 ROUND 168 — T2 (mù #96? theo dõi tiếp + EPERM #87 + INSIDE #74 + (m) #74 đối chiếu độc lập + (m) #75 + (m) #56 lần thứ mười một) — LIMITS

**Đợt 168 mở 05:35:51Z 22/11/2026. Hạn cờ ~08:00Z, hạn cứng đóng 08:30Z 22/11. T2 viết ~06:10Z 22/11.**
**KHÔNG push, KHÔNG release/tag. Chỉ stage 1 file (LIMITS này).**

> **GHI CHÚ ĐỨNG (quyết (e) đợt 165 — nhắc lại, áp dụng cho #74/#75; quyết (e) đợt 166 áp dụng đầy đủ cho #70; quyết (f) đợt 166 + quyết (e) đợt 167 áp dụng cho #71): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Dữ kiện T5-165 (poll cuối watcher-164 sau btime #68 11 s), T5-166 (poll cuối watcher-165 sau btime #70 6 s) và T5-167 (poll cuối watcher-166 sau btime #71 20 s) chứng minh boot cũ sống quá btime mới — đó là OVERLAP (đã xác nhận đợt 161), KHÔNG phải bằng chứng offset requeue sai. Offset requeue đo từ btime trong khung giờ boot mới (giờ thật) — đúng khung giờ dải 33–49,8 s được hiệu chuẩn. Đợt này: poll cuối watcher-167 lần 1 sau btime #74 12 s (§4.5) — OVERLAP thứ năm, áp dụng cùng ghi chú.

## 0. Kết luận trước (headline)

1. **Probe EPERM #87: 05:46:00Z, boot 576ca271 (#75), ok=2 fail=0, log 250→253 (+3 đúng mẫu). Cửa sổ 02:39:11Z → 05:46:00Z = 11.209 s. 0 sóng EPERM thật trong cửa sổ** (sweep #87: 210 file `*.log`, 3 file có hit, 5 lần — tất cả trích dẫn/status: dmesg EPERM quote ×1, "sóng EPERM đã tắt" ×4; 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO", 0 sóng sống).
2. **Reboot #75 MỚI (576ca271, btime 05:32:46Z) xảy ra 3m05s TRƯỚC khi đợt 168 mở** — T0-168 xác minh 9/9 nguồn, T7-168 xác minh 9 nguồn (Cloudflare ±1 s); gap #74→#75 = 5.237 s. **#75 KHÔNG viết lại run 167** (finish 402 s trước btime; 0 requeue) → **(m) #75 KHÔNG PHẢI ĐIỂM** (§4.3). **Run 167 SUCCEEDED 05:26:04Z** (wall 10.213 s, margin 587 s, claimed→finished 108 s — ca 60+ s thứ ba, LỚN NHẤT tới nay). Marker CÒN — sống qua 27 reboot #49–#75 (T0-168 đếm độc lập). Watcher-167 lần 2 KẾT THÚC THEO LỊCH 05:30:10Z (không chết theo #75). **POSTBOOT_PASS #75 ĐÃ CÓ 06:01:38Z** (T5-168, poll=1, repair-som-quyet-h).
3. **Mù #96? (#64) — VẪN MỞ (theo dõi tiếp, quét tươi + kiểm nội dung đầy đủ):** đoạn R file 1.238 s / union-A 1.222 s / union-B 1.211 s (y hệt T2-164/T2-165/T2-166/T2-167, không đổi một giây); S ĐÓNG (file 843 s / union-A 662 s / union-B 591 s); T ĐÓNG (file 307 s / union-A 31 s). **Kết luận: #96? VẪN MỞ.**
4. **Mù #88? VẪN MỞ — hole-recheck lần thứ MƯỜI HAI: 337 hit, 0 mốc mới** (y hệt lần 9/lần 10/lần 11 — 337 hit, không trôi thêm; xem §2.6 + F-168-T2-1). **#95?/#94?/#77? giữ nguyên** (không có bằng chứng mới). CERT/FULL chính thức GIỮ 76/91.
5. **INSIDE: #74 INSIDE dải FULL120 [02:53:56Z, 04:53:56Z] neo 02:28:01Z (biên dưới 4.293 s, biên trên 2.907 s) → CHUỖI MỚI bắt đầu từ #73** (chuỗi cũ đã ĐỨT tại #73 theo FULL119, quyết (c) đợt 167). Đối chiếu vs dải FULL119 còn hiệu lực: #74 CŨNG INSIDE (biên 5.649/1.539 s) — hai dải ĐỒNG THUẬN (khác #71: INSIDE dải phương pháp nhưng NGOÀI dải còn hiệu lực).
6. **(m) #74 — ĐỒNG Ý DƯƠNG (đối chiếu độc lập, 5 nguồn khớp):** requeue 04:06:15.242Z = btime +46,242 s ∈ [33; 49,8]. **Nếu parent CHẤP NHẬN: n ứng viên 26→27 (nhánh khuyến nghị) hoặc 27→28 (nhánh #56 ÂM); n chính thức GIỮ 14.**
7. **(m) #75 — KHÔNG PHẢI ĐIỂM (đối chiếu độc lập, bổ sung theo giao T7-168):** 0 requeue trong cửa 05:32:46–06:00:00Z (mọi job); 0 run đang chạy tại btime (run 167 finish 402 s trước btime; run 168 start 185 s sau btime). Chữ ký giống #52/#61/#67/#73. **N không đổi vì #75.**
8. **(m) #56: KHÔNG thu hẹp được lần thứ MƯỜI MỘT** (5 hướng — tất cả MỚI — đều âm tính). Cửa GIỮ NGUYÊN R [2,56251; 2,66817) / J [2,566; 2,80753] s. **#56 VẪN CÓ ĐIỀU KIỆN; KHÔNG chốt n=15.**
9. **Run 167: SUCCEEDED 05:26:04Z (eid 9973), wall 10.213 s, margin 587 s tới hạn 05:35:51Z, 1 lần viết lại (tại #74 +46,242 s), claimed→finished 108 s — NGOÀI họ 6–11 s (lớn nhất tới nay, sau 66 s run 164 và 64 s run 166).** Run 168 running, jitter 0 s lần thứ 21 liên tiếp — kết cục thuộc T7-169.
10. **RAM trong cửa sổ probe #87: peak 40,10% guard (2.522.812 kB — cùng đỉnh phiên T9-167); 0 mẫu ≥ guard; balloon 20 (toàn bộ là E-169 trên b643911f, đã đếm đợt 167); birefnet 0 lần thử trong cửa sổ** (chuỗi lần thứ 22 chờ T9-168 xác nhận cuối đợt). WFS #74 chênh 0 (996+25=1.021) lần thứ 74.
11. **Lệch khung giờ biên #73/#74 (§4.5): poll cuối watcher-167 lần 1 lúc 04:05:41Z, SAU btime #74 12 s** — OVERLAP thứ năm. Khác #71: bằng chứng khung mới (/proc/1 +15,575 s = 04:05:44.575Z) đến SAU poll cuối 3,575 s — khoảng neo "thật" (04:05:41Z, 04:05:44.575Z] KHÔNG RỖNG (rộng 3,575 s), nhưng btime nằm 12 s TRƯỚC khoảng đó; offset requeue theo neo khung cũ = 34,242 s — VẪN TRONG dải (khác #71: 21,274 s, dưới dải). Hai khung vẫn lệch ≥12 s. Áp dụng ghi chú đứng, (m) #74 DƯƠNG đứng theo btime.
12. **Sửa artifact F-167-T2-1 (TS_RE2) ĐÃ XONG (§6.2, F-168-T2-1):** regex bare-time nay có negative lookbehind cho `T` — 2 file proc_*.log không còn "span" #72/#73 giả. Việc sửa lộ thêm 2 artifact cùng họ (§6.2, F-168-T2-1/F-168-T2-2/F-168-T2-3): số đếm jump-witness đợt 167 cho #69 (3 → 2 đúng) và thành phần #66/#67/#68 đã đính chính — verdict không đổi (tất cả đều là trích dẫn, 0 hoạt động thật).

## 1. Checklist probe EPERM #87

| Hạng mục | Kết quả |
|---|---|
| Probe #86 (trước) | 02:39:11Z, boot b643911f, n=86 |
| `status` 05:45:54Z | DEAD/STALE, heartbeat n=86, ts 02:39:11Z, boot b643911f, tuổi 11.203 s, exit 1 |
| Log trước probe | 250 dòng |
| `status` ghi dòng DEAD | 250 → 251 (+1) |
| Dòng boot-changed | 251 → 252 (+1, b643911f → 576ca271) |
| **`once` 05:46:00Z — probe #87** | **boot=576ca271, ok=2 fail=0, exit 0** |
| Log sau probe | 253 dòng (250→253 = +3 đúng mẫu: DEAD + boot-changed + probe#87) |
| Heartbeat mới | pid=22527, ts 05:46:00Z, boot 576ca271-c659-4baa-8523-78b9e72297a7, n=87 |
| `=== probe end` | vẫn 0 dòng (1 dòng `probe start` duy nhất từ 08:49:50Z 11/11) |
| **Cửa sổ probe #87** | **02:39:11Z → 05:46:00Z = 11.209 s** |

Sóng EPERM thật gần nhất ~11:55–12:11Z 11/11 (~258 h trước probe #87).

**Sweep #87** (`eperm-sweep9696.py`, 210 file `*.log` mtime trong cửa sổ): 3 file có hit, 5 lần — tất cả "sóng EPERM đã tắt" hoặc trích dẫn dmesg: `o8-167t8.log` ×3 (log T8-167: "[timestamp] sóng EPERM đã tắt, khởi động vite" — dòng trạng thái); `proc_f089796e642e.log` ×1 (log phiên T2-167 trích kết quả sweep #86); `proc_21c79a6eb0cf.log` ×1 ("dmesg: read kernel buffer failed: Operation not permitted" — dmesg EPERM theo chính sách, đã biết, không phải sóng — T0-168 NOTES ghi nhận cùng dòng này). 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO" — **0 sóng thật**.

## 2. Điều tra mù #96? (#64) — THEO DÕI TIẾP (quét tươi + kiểm nội dung đầy đủ)

Mù # = reboot # + 32. #96? = reboot #64, btime 11:15:18Z 21/11/2026. Sàn luật gap: **1.147 s (19'07")** — file max gap hoặc union max gap vượt sàn ⇒ MỞ.

### 2.1 Sự kiện + định nghĩa đoạn

Cửa sổ điều tra: **[11:15:18Z, 05:46:00Z] = 66.642 s** (btime #64 → probe #87). Các đoạn, neo bằng btime/probe:

| Đoạn | Cửa sổ | Độ dài | Mốc phải |
|---|---|---|---|
| R | [11:15:18, 11:38:28] | 1.390 s | btime #64 (11:15:18Z) → T0-163 lần đầu 11:38:28Z |
| S | [11:38:28, 14:41:28] | 10.980 s | T0-163 → probe #82 |
| T | [14:41:28, 16:06:45] | 5.117 s | probe #82 → btime #66 |
| U | [16:06:45, 05:46:00] | 49.155 s | btime #66 → probe #87 (thuộc #97?/#98?/#99?/#100?/#101?, chỉ tham chiếu) |

Quét tươi (`blind9696-investigate.py`): repo-1 81 file, hidden_files 2.394, ngoài cây 1.463, /tmp **646**, fifth 6 → merged **1.778 mốc giây duy nhất** (T2-167: 1.372 — tăng 406 do cửa sổ kéo dài tới probe #87, chủ yếu là file đợt 167/168 trong U). **/tmp = 646 file (đợt 167: 0): toàn bộ 646 file nằm ở U-tail [05:26:53Z, 05:46:00Z] — tạo SAU reboot #75 (05:32:46Z) bởi các luồng đợt 168 đang chạy** (vite/chromium/temp); R/S/T /tmp vẫn = 0 (tmpfs bị xóa sạch bởi các reboot #73/#74/#75 — cùng họ F-167-T2-3; mọi file /tmp trong cửa sổ trước #75 đều đã được quét ở các đợt trước khi reboot xóa chúng).

### 2.2 Đồng hồ, reboot #74/#75 (T0-168 + T7-168 + T5-168 + T2-168 đối chiếu)

**Reboot #75 — T0-168 xác minh 9/9 nguồn (cờ 05:42Z, T2 đối chiếu):** boot_id 576ca271-c659-4baa-8523-78b9e72297a7; `/proc/stat` btime 1795325566 = 05:32:46Z; uptime bracket 3 lần đọc boot_est .13/.13/.12; /proc/1 mtime 05:32:56.882Z (+10,882 s); journal idx 0 duy nhất, first entry 05:32:57Z (+11 s); wtmp begins 05:32:57Z (+11 s); `last` reboot 05:32 still running; `who -b` 05:32; Cloudflare ±0–1,5 s (2 lần thử). **KHÔNG nghịch lý đồng hồ.** Marker CÒN — sống qua **27 reboot #49–#75** (T0 đếm độc lập). Gap #74→#75 = **5.237 s** (1h27m17s). **#75 xảy ra 3m05s TRƯỚC khi đợt 168 mở (05:35:51Z)** — T10-167 đóng sổ trên boot #74 (194efd93), T0-168 kiểm lúc mở 05:39Z đã là boot #75, không reboot mới trong phiên T0. **T7-168 xác minh 9 nguồn độc lập** (cùng các mốc trên + Cloudflare 05:40:06 vs local 05:40:05, chênh 1 s).

**Reboot #74 — T7-167 xác minh 9 nguồn trong phiên (T2-168 đối chiếu):** boot_id 194efd93-ef9b-44e9-b570-0b161c71a080; btime 1795320329 = 04:05:29Z; uptime -s 04:05:29Z; /proc/1 mtime 04:05:44.575Z (+15,575 s); journal idx 0 duy nhất, first entry 04:05:45Z (+16 s); wtmp begins 04:05:44Z (+15 s); `last` reboot 04:05 still running; `who -b` 04:05; Cloudflare ±1 s. Gap #73→#74 = **5.848 s** (T5-167 ghi 2.248 s ở 2 chỗ là SAI — xem F-167-T10-1; T5-168 kiểm lại độc lập bằng python: 1795320329−1795314481 = 5.848 s — KHỚP). Parent đã XÁC NHẬN số hiệu #74 ở quyết (d) đợt 167.

**Run 167 — kết cục (T7-168 NOTES đọc #1 + T0-168 NOTES — T2 đối chiếu số học §4.2):** **SUCCEEDED 05:26:04Z** (event 05:26:04.310Z, eid 9973), wall từ started gốc 10.213 s, **margin 587 s** tới hạn 05:35:51Z, claimed→finished **108 s** (ca 60+ s thứ ba sau 66 s run 164 và 64 s run 166 — LỚN NHẤT tới nay; chỉ ghi nhận, không suy cơ chế), attempt 1, **1 lần viết lại (tại #74 +46,242 s)**; 5 event đầy đủ, 0 event sau succeeded. Finish **402 s TRƯỚC btime #75** nên #75 không viết lại run 167. Run 168 (`a3642ec4`, sched 05:35:51Z) running lúc T7-168 đọc #1, jitter 0 s (lần thứ 21 liên tiếp), 1 event dispatched 05:35:51.091Z (eid 9975) — kết cục thuộc T7-169.

**POSTBOOT_PASS / watcher (T5-168 sở hữu — T2 chỉ ghi nhận):** **#75 ĐÃ CÓ 06:01:38Z** (boot+28m52s, poll=1, repair-som-quyet-h, dpkg 795, cache 110, lists 75, gst_sys 269 — chi tiết thuộc T5-168); #74 CÓ (04:10:23Z); #71/#72/#73 KHÔNG CÓ. Watcher-167 lần 2 KẾT THÚC THEO LỊCH 05:30:10Z (poll cuối 05:29:40Z — KHÔNG chết theo #75; #75 đến 2m36s SAU khi watcher kết thúc). Watcher-168 (pid 13133, START 05:43:17Z, boot 576ca271) đang chạy lúc T2 viết.

### 2.3 Hoạt động từng đoạn (merged log, mốc giây)

| Đoạn | Mốc giây | File-marks | Nhận xét |
|---|---|---|---|
| R [11:15:18, 11:38:28] | 14 | 56 | Hố 1.238 s (xem §2.4) — Y HỆT T2-164/T2-165/T2-166/T2-167 |
| S [11:38:28, 14:41:28] | 252 | 480 | Đóng — y hệt T2-167 từng số (252 mốc / 480 file-marks) |
| T [14:41:28, 16:06:45] | 234 | 667 | Đóng — y hệt T2-167 từng số |
| U [16:06:45, 05:46:00] | 1.278 | 3.387 | Đóng theo union (xem §2.4) — hố file max 1.407 s, chỉ tham chiếu |

**Nội dung trong R (56 file-marks, kiểm tay — y hệt T2-164/T2-165/T2-166/T2-167):** đầu 11:35:56Z tool-output exec-call agent 5001d1e4; 11:37:30Z tool-output agent 2c32ef43; 11:37:42Z sampler-162 scripts. R-head [11:15:18–11:34:25]: 0/0/0/0/0 mọi scope (trống). R-tail: repo-1=2 / hidden_files=51 / outside=3 / tmp=0 / fifth=0. **Mốc dpkg 11:35:40Z (TRONG hố R) là mốc nội dung THẬT:** hoạt động dpkg đầu trên #64, 2 dòng "startup packages configure", boot+20m22s — T0-162 quan sát trực tiếp từ dpkg.log #64 (dòng đầu 11:35:40Z; file đã reset theo #65/#66/#67/#68/#69/#70/#71/#72/#73/#74/#75, quan sát còn trong T0-162 LIMITS + aggregate 162). Cùng loại với mốc dpkg 08:35:41Z mà T2-162 đã tính cho đoạn N. Được tính vào cả UNION-A lẫn UNION-B. **Không có nguồn độc lập thứ ba cho R-head:** dpkg.log đã reset 11 lần kể từ #64; journal/dmesg chỉ còn boot hiện tại (journal xoay theo boot; dmesg EPERM) — ghi rõ, không giấu. R-head trống hoàn toàn trên mọi scope đo được.

**Nội dung khác (content script, `blind9696-content.py` — số R/S/T khớp T2-167 từng dòng, cộng thêm sampler/watcher-167):** sampler-162 (d9a8d1ce) 1 dòng trong R (11:37:42Z, sau hố) + 138 dòng trong S; watcher-162 strict polls 331 trong S (last poll 14:25:20Z — chết sớm, T0-163); watcher-161 linger polls sau btime #64: 0; sampler-163 3 dòng trong S tail + 45 dòng edb2acdb trong U (dòng cuối 16:52:21Z); watcher-163 163 poll trong T + **1 dòng trong U (poll cuối 16:06:54Z — poll đua với reboot #66, 9 s sau btime, nhãn boot cũ 1c1cf10c)**; sampler-164: 28 dòng f1d4ce1a + 107 dòng 0c8a94aa trong U (dòng cuối 19:53:52Z); watcher-164: 52 strict poll trong U (last poll 18:06:41Z — poll đua với reboot #68, 11 s sau btime, nhãn boot cũ f1d4ce1a); sampler-165: 88 dòng 9a1a9319 + 46 dòng d1ddd946 trong U (dòng cuối 22:51:29Z); watcher-165: 164 strict poll trong U (last poll 22:05:31Z — poll đua với reboot #70, 6 s sau btime, nhãn boot cũ 9a1a9319); sampler-166: 30 dòng d1ddd946 + 93 dòng ea73ac4f trong U (dòng cuối 01:41:07Z); watcher-166: 56 strict poll trong U (last poll 00:08:20Z — poll đua với reboot #71, 20 s sau btime, nhãn boot cũ d1ddd946); **sampler-167 MỚI ĐẦY ĐỦ: 88 dòng b643911f + 40 dòng 194efd93 trong U (dòng cuối 04:45:54Z — sampler dừng 04:45:54Z; dòng b643911f cuối 04:05:35Z = btime #74 +6 s — dòng sampler khung cũ sau btime, cùng mẫu OVERLAP)**; **watcher-167 MỚI ĐẦY ĐỦ: 170 strict poll b643911f trong U (last poll 04:05:41Z — poll đua với reboot #74, 12 s sau btime, nhãn boot cũ b643911f — xem §4.5) + 163 strict poll 194efd93 trong U (last poll 05:29:40Z — kết thúc theo lịch, không chết theo #75)**.

**Jump witness (hoạt động) tại #64–#75: đều = 0 hoạt động thật** (`blind9696-sessions.py`, 264 exec-log có mtime trong cửa sổ: R 1, S 34, T 33, U 196). Mọi hit regex đều là trích dẫn hoặc artifact phương pháp, đã kiểm tay từng hit:
- #64 (6 hit), #65 (6 hit) — 5 hit cũ (y hệt T2-167) + proc_3f36e49bbc0f.log MỚI (log phiên T2-167, trích khoảng hố H-E1-88 + probe #86 — cùng mẫu trích dẫn).
- #66 (7 hit), #67 (7 hit), #68 (5 hit) — số đếm Y HỆT T2-167 nhưng THÀNH PHẦN ĐỔI (xem F-168-T2-3): 2 file cũ (proc_9db5c8fba228.log + proc_82da543947c6.log) RỚT KHỎI danh sách vì max ảo "20:17:30Z 21/11" đã sửa thành "20:17:30Z 20/11" (đúng ngày) — max thật 14:35:37Z / 19:49:46Z 21/11 không tới được btime; proc_3f36e49bbc0f.log MỚI thay vào (trích dẫn).
- #69 (2 hit — ĐÍNH CHÍNH từ 3 hit đợt 167, xem F-168-T2-3): proc_b6ce5fee0f84.log (trích cửa D 19:04:44–20:22:43Z) + proc_3f36e49bbc0f.log MỚI (trích dẫn). 2 file cũ rớt (max thật trước btime #69).
- #70 (4 hit — tăng từ 3): 3 hit cũ + proc_3f36e49bbc0f.log MỚI (trích dẫn).
- #71 (4 hit — tăng từ 2): proc_67205a208d61.log (window-map-71: sampler lines 23:39:50Z/23:40:50Z boot d1ddd946 TRƯỚC #71 + 00:11:04Z/00:12:04Z boot ea73ac4f SAU #71 — trích dẫn dòng log cũ) + proc_9f64a205f621.log (log phiên T5-167 trích poll watcher-166 00:07:20Z/00:07:50Z/**00:08:20Z** + REPLAY_DONE/FLAG-WRITTEN 23:40:45Z — trích dẫn) + proc_1c620b5730b5.log MỚI (trích header REPLAY-WATCH-166-START 23:40:45Z 21/11 + end 02:30:00Z 22/11 — trích dẫn) + proc_3f36e49bbc0f.log MỚI (trích dẫn). **Cả bốn đều là trích dẫn — 0 hoạt động thật bắc qua btime #71.**
- #72 (2 hit) / #73 (2 hit): proc_1c620b5730b5.log (span thật 22:05:25Z 21/11 .. 02:30:00Z 22/11 — trích header, xem F-168-T2-1) + proc_3f36e49bbc0f.log (trích dẫn). **2 file cũ của đợt 167 (proc_67205a208d61.log + proc_9f64a205f621.log) KHÔNG CÒN span #72/#73 — sửa TS_RE2 đã loại max ảo 23:40:50Z/23:40:45Z 22/11 (xem §6.2). 0 hoạt động thật bắc qua btime #72 hay #73.**
- **#74 (1 hit ĐÃ ĐÍNH CHÍNH — script báo 2, xem F-168-T2-1/F-168-T2-2):** proc_24fc370311e3.log (log phiên T5-167: REPLAY_DONE 03:55:40Z boot b643911f TRƯỚC btime + poll 04:16:25Z boot 194efd93 SAU btime — session runtime-level tiếp tục qua reboot, KHÔNG phải tiến trình VM nào sống qua reboot; xem F-168-T2-2) + proc_1c620b5730b5.log (LOẠI — max "22:08:08Z 22/11" là bare-time gán sai ngày; max thật 02:30:00Z 22/11 TRƯỚC btime #74 — xem F-168-T2-1). **0 hoạt động VM thật bắc qua btime #74.**
- **#75 (0 hit ĐÃ ĐÍNH CHÍNH — script báo 1, xem F-168-T2-1):** chỉ proc_1c620b5730b5.log — LOẠI vì cùng artifact bare-time (max thật 02:30:00Z 22/11, trước btime #75 3h02m46s). **0 hoạt động thật bắc qua btime #75.**
- Exec-log content-ts trong hố R union (11:15:18–11:35:40): 3 hit, 0 mốc hoạt động: 11:16:22Z ×3 (trích biên hố H-R1-old — 2 hit cũ + proc_3f36e49bbc0f.log MỚI trích dòng hole-recheck của T2-167) — y hệt T2-167 về bản chất.
- Exec-log content-ts trong hố U file max H-U5 (22:09:05–22:32:32): 2 hit, 0 mốc hoạt động: 22:30:00Z ×2 (mốc "22:30:00Z" tương lai trong log T4/T7-166 — file mtime 20:41:27Z/21:00:21Z, TRƯỚC 22:30:00Z nên không thể chứa hoạt động thật tại 22:30:00Z) — y hệt T2-167.

### 2.4 Mốc merged + verdict (luật gap, sàn 1.147 s)

| Đoạn | File max gap | Union-A max gap | Union-B max gap | Verdict |
|---|---|---|---|---|
| **R** | **1.238 s** (11:15:18 → 11:35:56) | **1.222 s** (11:15:18 → 11:35:40) | **1.211 s** (11:15:29 → 11:35:40) | **MỞ (y hệt T2-167)** |
| S | 843 s | 662 s | 591 s | ĐÓNG |
| T | 307 s | 31 s | — | ĐÓNG |
| U | **1.407 s** (22:09:05 → 22:32:32) | 926 s | **814 s** | ĐÓNG theo union (tham chiếu) |

Union-A = mốc file + mốc nội dung (dpkg 11:35:40Z); Union-B = Union-A + mốc hệ thống trước btime (11:15:29Z) + mốc đầu boot #71 (00:08:16Z) + #72 (02:05:17Z) + #73 (02:28:13Z) + #74 (04:05:44Z) + #75 (05:32:57Z). **R: mọi cách đếm đều MỞ — y hệt T2-164/T2-165/T2-166/T2-167 từng giây.** Biến thể +dispatch 11:35:51Z (DB, không tính vào union chính): 1.211 s — cũng MỞ.

**U — hố file max 1.407 s (22:09:05→22:32:32, như đợt 167):** hố nằm trong phiên T10-165 đóng sổ (sau reboot #70, trước khi đợt 165 đóng); được lấp đầy bởi mốc nội dung sampler-165 d1ddd946 (dòng mỗi 60 s: 22:09:xx–22:32:xx) → union-A 926 s / union-B **814 s** — **ĐÓNG theo union**. **Drift so với đợt 167 (union-B 773 s → 814 s, xem F-168-T2-6):** 2 mốc file từng chẻ hố 23:22:46→23:36:20 đã trôi đi (MEMORY.md mtime 23:23:55Z → sau đó; session jsonl e033d2dd mtime 23:30:03Z → sau đó) — hố union-B lớn nhất nay là 814 s (23:22:46→23:36:20) thay vì 773 s (17:20:48→17:33:41). Vẫn ĐÓNG (814 < 1.147), chỉ tham chiếu. Hole-recheck H-U5 (§2.6) xác nhận 0 file mới ở độ chính xác float trong hố này. U chỉ tham chiếu cho #96? — không đổi verdict R.

S khớp T2-167 về file (843 s), union-A (662 s) và union-B (591 s) — S ổn định hoàn toàn (252 mốc giây / 480 file-marks, y hệt đợt 167). T đóng chắc (31 s).

**Kết luận đầy đủ: #96? VẪN MỞ qua đoạn R. Quét tươi + kiểm nội dung + sessions + hole-recheck đều đã chạy đầy đủ đợt này và xác nhận lại từng số của T2-167 (R/S/T không đổi một giây; U union-B trôi 773 → 814 s do 2 mốc file đổi mtime — xem F-168-T2-6).**

### 2.5 CERT/FULL ứng viên + INSIDE

**CERT/FULL chính thức GIỮ 76/91** (quyết (b) đợt 164, giữ theo quyết (m) đợt 165, quyết (m) đợt 166 và quyết (m) đợt 167; #95?/#94?/#77? vẫn mở). Gap #63 = 9.073 s cho ứng viên CERT95/FULL110.

**FULL120** (gap #73 NOMINAL 1.376 s, CÓ ĐIỀU KIỆN): n=120, mean 1h39'52", median 1h53'21", p10 0h25'55" (1.555,20 s), p90 2h25'56" (8.755,90 s), sd 0h55'58", min 0h00'55", max 5h43'18"; trong 90–150'=64, <60'=28, >180'=8, >240'=3.
**FULL117/FULL118/FULL119 kiểm lại:** p10/p90 KHỚP T2-167 từng số (FULL117 1.572,60/8.779,60 s; FULL118 1.574,20/8.771,70 s; FULL119 1.575,80/8.763,80 s — script có assert, không trôi chuỗi).

Tốc độ reboot: tới #73: 149 reboot / 270,16 h = 1 lần / 108,8 phút; tới #74: 150 reboot / 271,79 h = 1 lần / 108,7 phút; tới #75: 151 reboot / 273,24 h = 1 lần / 108,6 phút (tới #72: 148/269,78 h = 109,4).

**INSIDE:**
- **#74 INSIDE dải FULL120 [02:53:56Z, 04:53:56Z] neo 02:28:01Z** (biên dưới 4.293 s, biên trên 2.907 s; biên trên chính xác 2.907,9 s) → **CHUỖI MỚI bắt đầu từ #73 (chuỗi cũ đã ĐỨT tại #73 theo FULL119, quyết (c) đợt 167 — chuỗi mới dài 1).**
- Đối chiếu vs dải còn hiệu lực: #74 CŨNG INSIDE dải FULL119 [02:31:20Z, 04:31:08Z] neo 02:05:05Z (biên dưới 5.649 s, biên trên 1.539 s; chính xác 1.539,8 s) — hai dải ĐỒNG THUẬN, không mâu thuẫn như #71 (INSIDE FULL117 nhưng NGOÀI FULL116 muộn 5.521,5 s).
- **Nhãn dải — kiểm lại đúng phương pháp (bài học F-165-T2-1):** #74 kiểm theo FULL120 neo btime #73 (mẫu FULL112→#66, FULL113→#67, FULL114→#68, FULL115→#69, FULL116→#70, FULL117→#71, FULL118→#72, FULL119→#73 ⇒ FULL120→#74; mỗi dải gồm gap kết thúc tại neo của nó). FULL119 chỉ là dải đối chiếu còn hiệu lực, KHÔNG phải dải phương pháp cho #74 — nhưng lần này cả hai cùng phán INSIDE.

### 2.6 Hole-recheck

`hole-recheck9696.py`: find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp [19:32:59Z 20/11, 05:46:00Z 22/11]: **9.545 file**. Find stderr: 1 dòng — `/home/hatch/.stagged-uploads: Permission denied` (giới hạn đứng, thư mục mode 0000). **KIỂM TRƯỚC KHI CHẠY (bài học F-166-T2-2): `grep ^W =` → round168-t2 ✓; `grep ^hi =` → 05:46:00Z 22/11 ✓; KHÔNG dùng `#` làm delimiter; output vào thư mục RIÊNG round168-t2. File `round167-t2/holerecheck-all.txt` md5 KHÔNG ĐỔI sau lần chạy (dfd2fe71… — kiểm lại sau khi chạy).**

| Hố | Kết quả |
|---|---|
| H-R1 (11:15:18, 11:35:56) | **0 hit — 0 mốc mới** |
| H-R1-old (11:16:22, 11:35:35) | 0 hit |
| H-S1/H-S2/H-S3/H-T1/H-U1/H-U4 | mỗi hố 1 float-trap (cùng giây cạnh trái), 0 mới |
| H-U2 (17:20:48, 17:36:14 — bắc qua btime #67) | 1 inside = 1 trap (cạnh trái 17:20:48.627Z), 0 mới |
| H-U2-old (17:22:25, 17:35:37) | 0 hit |
| H-U3 (19:37:11, 19:49:46) | 10 inside = 10 trap (cùng giây 19:37:11, file stall T8-164), 0 mới |
| **H-U5 (22:09:05, 22:32:32)** | **1 inside = 1 trap (cạnh trái 22:09:05.886Z, proc_5c237211ba31.log), 0 mới** |
| H-E1-88 (19:32:59Z, 20:17:30Z) | **337 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI — lần thứ MƯỜI HAI liên tiếp 0 mốc mới** |

Known base: 1.778 mốc giây đợt này; base #88? T2-157: 557 giây. **H-E1-88 giữ 337 hit — y hệt lần 9/lần 10/lần 11, không trôi thêm** (lần 11 giảm 345 → 337 do 8 exec-log mtime trôi; đợt này 0 file trôi thêm).

### 2.7 Verdict mù (tổng hợp)

| Mù | Verdict đợt 168 | Cơ sở |
|---|---|---|
| #96? (#64) | **VẪN MỞ** (R 1.238/1.222/1.211 s vượt sàn; S/T đóng) | Quét tươi + kiểm nội dung đầy đủ, số y hệt T2-167 |
| #95? (#63) | **MỞ** (giữ nguyên quyết (b) đợt 164) | Không có bằng chứng mới |
| #94? (#62) | **MỞ** (giữ nguyên) | Không có bằng chứng mới |
| #88? | **VẪN MỞ** (lần thứ 12: 337 hit, 0 mới) | Hole-recheck §2.6 |
| #77? | **VẪN MỞ** (giữ nguyên) | Không có bằng chứng mới |

**CERT/FULL chính thức GIỮ 76/91** (vì #77?/#88?/#94?/#95? vẫn mở; #96? VẪN MỞ — chưa đổi được khi chưa chứng nhận theo thứ tự).

## 3. Mù #88?/#77?/#95?/#94? — giữ nguyên

Mù #88? VẪN MỞ (lần thứ 12, §2.6: 337 hit, 0 mốc mới — y hệt lần 9/lần 10/lần 11). **#95?/#94?/#77? GIỮ NGUYÊN, không đổi** — không có bằng chứng mới đợt này. **CERT/FULL chính thức GIỮ 76/91.** T2 không tự đóng/mở bất kỳ mù nào — parent quyết.

## 4. Mô hình đồng hồ + điểm (m)

### 4.1 Điểm (m) #56 — thu hẹp lần thứ MƯỜI MỘT: 5 hướng MỚI đều ÂM TÍNH

Cửa GIỮ NGUYÊN: **R [2,56251; 2,66817) s / J [2,566; 2,80753] s** (T2-167, §4.1). **#56 VẪN CÓ ĐIỀU KIỆN; KHÔNG chốt n=15.** Các hướng đã thử đợt này (`m56-168.py`, epoch cửa D [19:04:44Z, 20:22:43Z] 20/11 đã kiểm độc lập):

| Hướng (đợt 168) | Kết quả |
|---|---|
| (i) find /var/lib + /var/cache + /var/tmp + /run trong cửa D (epochs 1795201484–1795206163) | **0 file**; stderr 4 dòng Permission-denied: `/var/lib/hatch/postgres`, `/run/hatch/telemetry/scuba`, `/run/hatch/runtime-cell`, `/run/host/incoming` |
| (ii) `last` + `lastb` trên /var/log/wtmp + btmp | **0 bản ghi ngày 20/11** (wtmp chỉ còn boot hiện tại) |
| (iii) Cửa hẹp phụ giây [20:16:36Z, 20:16:40Z] — vẫn đúng 3 file như đợt 167, max 20:16:36.699Z (session 6fc7dd16) | **0 file mới**; session-E: af13c1c2 là THƯ MỤC mtime 17:36:04Z 20/11 (NGOÀI cửa D), 964f2bc4: 0 file |
| (iv) dpkg.log | Chỉ còn dpkg.log hiện tại (60.387 B, mtime 06:01:38Z 22/11); không có dpkg.log.1 hay .gz; **0 dòng ngày 20/11 19:xx/20:xx** |
| (v) Journal trong cửa D | **0 file journal**; `journalctl --list-boots` exit 0, chỉ 2 boot, 0 boot ngày 20/11 |

**Đợt 167 (đối chiếu — 5 hướng cũ đều âm tính):** (i) `find /tmp` trong cửa D — 0 file mới; (ii) `find ~/workspace` + grep toàn bộ exec-log mtime < 20:22:43Z 20/11 — 0 mốc mới; (iii) cửa hẹp phụ giây [20:16:36Z, 20:16:40Z] — đúng 3 file, max 20:16:36.699Z; (iv) `journalctl --list-boots` (2 boot, 0 ngày 20/11) + `journalctl --since 20:16:36 --until 20:16:40` — 0 dòng; (v) grep `20:16:36` toàn bộ exec-log — chỉ mốc cũ đã biết (6fc7dd16). Đợt này thêm 5 hướng MỚI (var/lib+cache+tmp+run, last/lastb, dpkg.log.1/.gz, journal file trong D, session-E) — tổng 10 hướng âm tính liên tiếp. **Cửa R/J GIỮ NGUYÊN; không có mốc mới nào để thu hẹp.**

### 4.2 Điểm (m) #74 — ĐỐI CHIẾU ĐỘC LẬP: ĐỒNG Ý DƯƠNG (nợ từ đợt 167)

**Nợ giao từ đợt 167 (§11 mục 2, nợ mở đợt 167 + aggregate 167 §12.3(f) — T2-168 đối chiếu độc lập ≥4 nguồn như T2-167 đã làm cho #71/#72. Dải (m) 33–49,8 s (định nghĩa: offset btime-tương đối trong khung giờ boot mới; xem ghi chú đứng).**

| Hạng mục | Giá trị |
|---|---|
| Btime #74 | 1795320329 = 04:05:29Z 22/11 (boot 194efd93) |
| Requeue run 167 | **04:06:15.242Z (eid 9955)** |
| **Offset** | **+46,242 s ∈ [33; 49,8] ✓** |
| Dispatch sau requeue | 04:06:15.343Z (eid 9956, +46,343 s) |
| Reattach | 04:06:15.455Z (eid 9957, +46,455 s) |
| started_at run 167 | 1795314951 → 1795320375 (delta 5.424 s) — VIẾT LẠI lần 1 |
| Spanning | 0 (artifact: viết lại tự loại — chạy trong cùng phiên, không tính run khác) |
| Requeue trong cửa [04:05:29Z, 04:30:00Z] | **ĐÚNG 1 dòng (eid 9955)** — 0 requeue khác |
| Run 166 | finished 61 s TRƯỚC btime #74 (không đang chạy) |
| Run 167 SUCCEEDED | 05:26:04Z (eid 9973), wall 10.213 s, margin 587 s |

**5 nguồn độc lập — TẤT CẢ KHỚP 46,242 s (không lệch ms như F-167-T2-4 đợt 166):**
1. **T2-168 tính toán độc lập** (`m-check9696.py`, epoch số học từ /proc/stat btime + DB events): 1795320375−1795320329 = **46 s**; event requeue 04:06:15.242Z − 04:05:29Z = **46,242 s**; cửa 04:05:29–04:30:00Z: 1 dòng; cửa 04:05:29–04:05:59Z: 1 dòng.
2. **T7-167 NOTES đọc #5 + appendix167.txt (đọc DB mới, T2-168 đối chiếu):** requeue 04:06:15.242Z; delta btime+46,242 s; reattach 04:06:15.455Z; started_at 1795320375; **điểm #74 = DƯƠNG** (T7-167 phán).
3. **T0-168 NOTES (đọc DB hồi cứu, T2-168 đối chiếu):** run 167 requeued 04:06:15.242Z = btime+46,242 s; 5 event; SUCCEEDED 05:26:04Z; **DƯƠNG** (T0-168 phán).
4. **T7-168 NOTES đọc #1 (đọc DB hồi cứu, T2-168 đối chiếu):** run 167 requeued 04:06:15.242Z = btime+46,242 s; SUCCEEDED 05:26:04.310Z (eid 9973); margin 587 s; claimed→finished 108 s; **DƯƠNG** (T7-168 phán).
5. **Aggregate 167 §7 / §10.5(iii) / §12.3(f) (T10 kiểm + parent ghi nhận):** 1 requeue 04:06:15.242Z = btime+46,242 s (sớm 3,558 s trước biên trên 49,8); T10 đồng ý DƯƠNG; parent ghi nhận ứng viên, giao T2-168 đối chiếu độc lập.

**Phán: ĐỒNG Ý DƯƠNG.** Nếu parent CHẤP NHẬN: **n ứng viên 26→27 (nhánh khuyến nghị: 24 dương + 3 âm) hoặc 27→28 (nhánh #56 ÂM). N chính thức GIỮ 14** — T2 không tự đổi.

**Sanity recheck #71/#72/#73 (cùng phương pháp):** #71 +41,274 s (run 165 requeue 00:08:41.274Z; đã CHẤP NHẬN — quyết (f) đợt 167); #72 +39,548 s (run 166 requeue 02:05:44.548Z; đã CHẤP NHẬN — quyết (f) đợt 167); #73 KHÔNG PHẢI ĐIỂM (run 166 finished 61 s trước btime — quyết (e) đợt 167). **#74 +46,242 s nằm gọn trong dải, giữa #71 (+41,274) và biên trên 49,8 — không sát biên dưới (33), cách biên trên 3,558 s.**

### 4.3 Điểm (m) #75 — KHÔNG PHẢI ĐIỂM (bổ sung, theo giao T7-168)

| Hạng mục | Giá trị |
|---|---|
| Btime #75 | 1795325566 = 05:32:46Z 22/11 (boot 576ca271) |
| Requeue trong cửa [05:32:46Z, 06:00:00Z] | **0 dòng (mọi job)** |
| Run 167 | finished 05:26:04Z = btime −402 s |
| Run 168 | started 05:35:51Z = btime +185 s (dispatch 05:35:51.091Z, eid 9975, jitter 0 s) |
| Spanning | 0 (đúng — không run nào đang chạy tại btime) |

Nguồn: T7-168 NOTES đọc #1 (DB hồi cứu — T7-168 phán KHÔNG PHẢI ĐIỂM) + T0-168 NOTES (DB hồi cứu, run 167 SUCCEEDED 05:26:04Z) + tính toán độc lập T2-168 (m-check9696.py). **Chữ ký giống #52/#61/#67/#73 (btime rơi vào khoảng trống giữa hai run). N không đổi vì #75.**

### 4.4 Reboot #75 — xác nhận bổ sung (T0-168 + T7-168 + T5-168 + T2-168)

Xem §2.2. T0-168 xác minh 9/9 nguồn; T7-168 xác minh 9 nguồn; T5-168 kiểm lại độc lập gap #74→#75 = 5.237 s và gap #73→#74 = 5.848 s (KHỚP F-167-T10-1). Parent đã XÁC NHẬN số hiệu #74 ở quyết (d) đợt 167; **số hiệu #75 thuộc T0-168 chứng nhận (đã 9/9) — T2 ghi nhận, không tự chứng nhận.** Ghi chú T1-168: "reboot #75 trước khi đợt mở 3m05s — kết cục run 167 thuộc T7-168" (F-168-T1-4).

### 4.5 Lệch khung giờ biên #73/#74 — OVERLAP (thứ năm)

**Bằng chứng (T5-167 + T2-168 kiểm trực tiếp từ `round167-t5/replay-watch-167.log`):**

| Bằng chứng | Giá trị | Offset so với btime #74 (04:05:29Z) |
|---|---|---|
| Poll cuối watcher-167 lần 1 | **04:05:41Z** | **+12 s** (poll mỗi 30 s: 04:04:11/04:04:41/04:05:11/04:05:41Z) |
| Sampler-167 dòng cuối b643911f | 04:05:35Z | +6 s |
| /proc/1 mtime (boot mới) | **04:05:44.575Z** | **+15,575 s** |
| journal first entry (boot mới) | 04:05:45Z | +16 s |
| wtmp begins (boot mới) | 04:05:44Z | +15 s |
| Poll đầu watcher-167 lần 2 (boot mới) | 04:08:22Z | +173 s |

**Khác #71 (T5-166 §4.2 / T5-167 §4.2):** tại #71, bằng chứng khung mới (/proc/1 +4,575 s) đến TRƯỚC poll cuối khung cũ (+20 s) 4 s — khoảng neo "thật" RỖNG, và offset requeue theo neo khung cũ = 21,274 s (DƯỚI dải 33). Tại #74: bằng chứng khung mới (/proc/1 +15,575 s) đến **SAU** poll cuối khung cũ (+12 s) 3,575 s — **khoảng neo "thật" (04:05:41Z, 04:05:44.575Z] KHÔNG RỖNG (rộng 3,575 s)**; btime (04:05:29Z) nằm 12 s TRƯỚC khoảng này; **offset requeue theo neo khung cũ = 34,242 s — VẪN TRONG dải [33; 49,8]** (khác #71: 21,274 s, dưới dải).

**Phán: OVERLAP (thứ năm — sau #62: 824 s, #68: ≥11 s, #70: ≥6 s, #71: 20 s).** Phân tích lệch khung một mình không xác nhận cũng không bác bỏ #74: neo trong khoảng (04:05:41Z, 04:05:44.575Z] cho offset [30,667; 34,242) s — straddle biên dưới 33 s. **Áp dụng ghi chú đứng: verdict (m) #74 DƯƠNG đứng theo btime (04:05:29Z, +46,242 s).** Ghi chú: độ lệch 12 s này là biên #73/#74 (T5-167 ghi "12 s theo T5-167" trong nhiệm vụ — đã xác minh trực tiếp).

### 4.6 Nhãn n (tổng hợp)

- **n chính thức: GIỮ 14** (parent quyết; T2 không tự đổi).
- n ứng viên (nhánh khuyến nghị): 26 → **27 nếu parent CHẤP NHẬN #74** (24 dương + 3 âm).
- n ứng viên (nhánh #56 ÂM): 27 → **28 nếu parent CHẤP NHẬN #74** (27 dương + 1 âm — #56).
- #56 vẫn CÓ ĐIỀU KIỆN (§4.1) — KHÔNG chốt n=15.
- #75 KHÔNG PHẢI ĐIỂM — n không đổi vì #75.

## 5. RAM trong cửa sổ probe #87 (02:39:11Z → 05:46:00Z)

`ram-max9696.py` trên `round167-t9/ram-sampler.log` (T9-167) + `round168-t9/ram-sampler.log` (T9-168). **133 mẫu tổng**; **peak 2.522.812 kB = 40,10% guard** (guard 6.291.456 kB); **0 mẫu ≥ guard**; balloon(==ceiling) **20**.

| Nguồn | Mẫu | Peak (kB) | % guard | Balloon |
|---|---|---|---|---|
| T9-167 boot b643911f | 87 | 2.145.168 | 34,10% | 20 (E-169) |
| T9-167 boot 194efd93 | 40 | 2.522.812 | 40,10% | 0 |
| T9-168 boot 576ca271 | 6 | 2.510.816 | 39,91% | 0 |
| **Tổng cửa sổ #87** | **133** | **2.522.812** | **40,10%** | **20** |

- **Balloon 20 = E-169 đợt 167** (20 mẫu, 4 chuỗi, 3 sag, boot b643911f, ĐÃ KẾT THÚC — đứt KHÔNG quan sát được; tổng ghim 20/128 = 15,6% — ghi nhận theo T9-167). **0 balloon mới trên boot #74/#75 trong cửa sổ** (T9-168: 6 mẫu, 0 balloon — nhưng sampler mới chạy 05:40:34Z, chưa đủ mẫu để kết luận xu hướng; T9-168 theo dõi tiếp).
- **Headroom 0** (dưới ngưỡng lần thứ 27 liên tiếp — theo T9-167; T9-168 xác nhận cuối đợt).
- **ENOSPC ≥76 dòng** (cận dưới; đợt thứ 16 liên tiếp có lỗi thật — theo T9-167; T9-168 xác nhận).
- **Birefnet: 0 lần thử trong cửa sổ probe #87** (chuỗi lần thứ 22 chờ T9-168 xác nhận cuối đợt — đợt 167 là lần thứ 21).
- **Caveat (cùng họ F-142-T2-10):** sampler gap **04:45:54Z → 05:40:34Z = 3.280 s** chứa reboot #75 (05:32:46Z) — peak trong đoạn này là cận dưới (không có mẫu nào đo được trong khoảng 04:45:54–05:40:34Z). Peak 40,10% là đỉnh của 133 mẫu ĐO ĐƯỢC, không phải đỉnh tuyệt đối của cửa sổ.
- **Đính chính nhỏ:** T9-167 ghi "RAM 128 mẫu" trong .done (đếm theo bộ lọc riêng); T2 đếm 133 mẫu (127 mẫu T9-167 + 6 mẫu T9-168) theo cửa sổ probe #87 — chênh 5 mẫu do cửa sổ khác nhau (T9-167 đếm tới 05:29:40Z; T2 đếm tới 05:46:00Z). Không mâu thuẫn.

## 6. Phương pháp, sai số của T2, câu hỏi cho parent

### 6.1 Phương pháp (tóm tắt — script trong `~/workspace/goals/capcut-clone-video-editor/hidden_files/round168-t2/`)

- Probe: `scripts/probe-eperm-v2.sh` (status → once), log `hidden_files/eperm-probe-v2.log`, heartbeat `hidden_files/eperm-probe-v2.heartbeat`; sweep: `eperm-sweep9696.py` (210 file `*.log` mtime trong cửa sổ, phân biệt trích dẫn/status vs sóng thật).
- Mù: `blind9696-investigate.py` (5 scope, mtime float, merge), `blind9696-content.py` (kiểm nội dung sampler/watcher từng đoạn), `blind9696-sessions.py` (jump witness, 264 exec-log), `blind9696-merged.py` (gap file/union-A/union-B), `hole-recheck9696.py` (find toàn cây + float-trap).
- INSIDE: `inside-168.py` (FULL120, p10/p90 theo đúng phương pháp các đợt trước; assert FULL117/118/119 khớp T2-167; đối chiếu FULL119).
- (m): `m-check9696.py` (epoch số học + đếm requeue theo cửa) + đối chiếu 5 nguồn (§4.2) / 3 nguồn (§4.3); `m56-168.py` (5 hướng mới).
- RAM: `ram-max9696.py` trên 2 sampler log; WFS: `scan-wfs73.sh` + `grep -c writeFileSync` trên LIMITS đợt 167.
- **WFS #74:** NEWSTD 299 file / 996 dòng; R7B 316 file / 1.021 dòng; COPIES 17 file / 25 dòng; **996+25=1.021, chênh 0 — lần thứ 74 liên tiếp.** Delta vs #73 (+1 dòng / +1 file) giải thích đầy đủ: `docs/PHASE9_ROUND167_T2_EPERM_LIMITS.md:1` (grep -c `writeFileSync` = 1). Async `.writeFile(` helpers không đổi (eperm-retry.mjs, epermRetry.js:116 + 1 lần nhắc trong GAP).

### 6.2 Sửa artifact F-167-T2-1 (TS_RE2) — ĐÃ XONG + artifact mới cùng họ

**F-167-T2-1 (TS_RE2) — ĐÃ SỬA XONG đợt này:** regex bare-time trong `blind9696-sessions.py` nay là `(?<!T)(?<!\d)(\d\d):(\d\d):(\d\d)Z` — bare-time không còn match phần giờ của full ISO timestamp. **Kiểm lại: `proc_67205a208d61.log` / `proc_9f64a205f621.log` không còn span #72/#73 giả** (max thật 00:12:11Z / 00:08:20Z 22/11). Đợt 167: 2 file này "span" #72/#73 với max ảo 23:40:50Z/23:40:45Z 22/11 — đã sửa gốc.

**F-168-T2-1 (bare-time gán sai NGÀY — cùng họ F-167-T2-1, trường hợp MỚI):** `proc_1c620b5730b5.log` chứa bare-time `init_mtime=22:08:08Z` trong dòng header có ngày 21/11 (REPLAY-WATCH-166-START 23:40:45Z 21/11); quy tắc "ngày = ngày file-mtime" gán nó sang 22/11 → max ảo 22:08:08Z 22/11, span giả #74/#75. Max thật: 02:30:00Z 22/11 (full timestamp "end=" cùng dòng). **Số đếm đã đính chính: #74 = 1 (từ 2), #75 = 0 (từ 1).** Hướng sửa cho T2-169: bare-time nên lấy ngày từ full timestamp trong CÙNG DÒNG khi có, fallback mới dùng ngày file-mtime.

**F-168-T2-2 (session-continuity artifact — LỚP MỚI, lần đầu gặp):** `proc_24fc370311e3.log` (log phiên T5-167) span #74 với timestamp THẬT cả hai phía (REPLAY_DONE 03:55:40Z boot b643911f TRƯỚC btime + poll 04:16:25Z boot 194efd93 SAU btime) — runtime-level session tiếp tục qua reboot, KHÔNG phải tiến trình VM nào sống qua reboot; mỗi phía được tính trong timeline boot của chính nó. **Phân loại: artifact, 0 hoạt động VM thật bắc qua #74.** Lần đầu có log phiên nào span btime bằng timestamp thật hai phía.

**F-168-T2-3 (đính chính số đếm jump-witness đợt 167 — do F-167-T2-1):** số đếm đợt 167 cho #66/#67/#68/#69 bị phồng bởi max ảo "20:17:30Z 21/11" (đúng ngày là 20/11 — trích header H-E1-88 trong `proc_9db5c8fba228.log` dòng 19 và `proc_82da543947c6.log`): **#69: 3 → 2 đúng** (2 file cũ rớt — max thật 14:35:37Z / 19:49:46Z 21/11, trước btime #69 20:09:31Z); **#66/#67/#68 số đếm trùng khớp (7/7/5) nhưng thành phần đổi** (2 file cũ rớt, proc_3f36e49bbc0f.log mới vào). **Verdict không đổi — mọi hit đều là trích dẫn, 0 hoạt động thật.** (F-167-T2-5 đã ghi nhận: số S đợt 166 676 → 481 — không lặp lại.)

**F-168-T2-4 (lỗi số học prereg của chính T2 — bắt trước khi viết LIMITS):** `prereg-t2.md` ghi tổng cửa sổ điều tra "58.542 s" — SAI; đúng **66.642 s** (11:15:18Z 21/11 → 05:46:00Z 22/11 = 18h30m42s). Giá trị script là chuẩn. Không ảnh hưởng đo đạc nào.

**F-168-T2-5 (lỗi tham số sessions.py của chính T2 — bắt và chạy lại trước khi viết LIMITS):** lần chạy `blind9696-sessions.py` đầu tiên dùng sai epoch hố U (+1.200 s mỗi đầu: 22:29:05–22:52:32Z thay vì 22:09:05–22:32:32Z). Đã chạy lại với tham số đúng 1795298945/1795300352 → 2 hit tại 22:30:00Z (cùng 2 file như đợt 167 — trích "22:30:00Z" tương lai). LIMITS dùng lần chạy thứ hai; file output lần đầu đã bị ghi đè.

**F-168-T2-6 (U union-B trôi 773 → 814 s):** 2 mốc file từng chẻ hố 23:22:46→23:36:20 đã trôi (MEMORY.md mtime 23:23:55Z → sau đó; session jsonl e033d2dd mtime 23:30:03Z → sau đó). U vẫn ĐÓNG theo union (814 < 1.147), chỉ tham chiếu. Cùng họ F-167-T2-5 (S feed index trôi).

**Đã biết, giao T10-168 (F-168-T1-1):** nhãn GAP §96 còn cũ so với quyết parent §12.3 đợt 167 — T10-168 cập nhật khi viết §97. Không thuộc phạm vi T2.

### 6.3 Câu hỏi cho parent (chờ quyết ở aggregate 168)

1. **(m) #74 CHẤP NHẬN DƯƠNG?** (T2-168: ĐỒNG Ý DƯƠNG — 5 nguồn khớp 46,242 s.) Nếu chấp nhận: n 26→27 / 27→28; n chính thức GIỮ 14.
2. **(m) #75 xác nhận KHÔNG PHẢI ĐIỂM?** (T2-168 + T7-168: 0 requeue, chữ ký giống #52/#61/#67/#73.)
3. **INSIDE #74 ghi nhận chuỗi MỚI bắt đầu từ #73?** (#74 INSIDE FULL120 [02:53:56Z, 04:53:56Z]; cũng INSIDE FULL119 còn hiệu lực — hai dải đồng thuận.)
4. **#96? vẫn MỞ / theo dõi tiếp đợt 169?** (R không đổi một giây qua 4 đợt liên tiếp; S/T đóng; U union-B trôi 773 → 814 s.)
5. **#56 vẫn CÓ ĐIỀU KIỆN?** (lần thứ 11 âm tính — 5 hướng MỚI; cửa R/J giữ nguyên; KHÔNG chốt n=15.)
6. **F-168-T2-1 → F-168-T2-6 ghi nhận?** (đặc biệt F-168-T2-2 — lớp artifact session-continuity mới; F-168-T2-3 — đính chính số đếm đợt 167.)
7. **R9 (a) vẫn chờ user** (số đếm vẫn là 16); **G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời). **(m) #96?/#95?/#94?/#88?/#77? — không tự đóng/mở, chỉ đề xuất, parent quyết.**

## 7. File + stage

- LIMITS này: `docs/PHASE9_ROUND168_T2_EPERM_LIMITS.md`
- Stage: `phase9-round168-t2-eperm.txt` (1 entry, NUL-delimited, text only — xem paths-loop)
- Cờ: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round168-t2.done`
- Thư mục làm việc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round168-t2/` (script + log: blind9696-*.py, eperm-sweep9696.py, hole-recheck9696.py, ram-max9696.py, m-check9696.py, m56-168.py, inside-168.py, scan-wfs73.sh, prereg-t2.md, *.log/*.txt)

**Trạng thái cờ đợt 168 lúc T2 viết (~06:10Z):** T0 ✓ (05:42Z), T1 ✓ (05:52Z), T6 ✓ (05:52Z). Chưa đóng: T5 (đang chạy — POSTBOOT_PASS #75 ĐÃ CÓ 06:01:38Z, watcher-168 đang chạy), T7 (NOTES đọc #1 — run 167 SUCCEEDED, run 168 running), T8, T9 (sampler đang chạy — 6 mẫu tới 05:45:35Z; birefnet chuỗi lần thứ 22 + headroom + ENOSPC chờ T9-168 xác nhận cuối đợt). **Caveat:** các số T9-168 cuối đợt (birefnet lần thứ 22, headroom lần thứ 28, ENOSPC lần thứ 17) chưa có lúc T2 viết — T10-168 lấy từ T9-168 khi tổng hợp.
