# PHASE9 ROUND 166 — T2 (mù #96? theo dõi tiếp + EPERM #85 + INSIDE #70 + (m) #70 đối chiếu độc lập + (m) #56 lần thứ chín) — LIMITS

**Đợt 166 mở 23:35:51Z 21/11/2026. Hạn cờ ~02:00Z 22/11, hạn cứng đóng 02:30Z 22/11. T2 viết 23:57Z 21/11.**
**KHÔNG push, KHÔNG release/tag. Chỉ stage 1 file (LIMITS này).**

> **GHI CHÚ ĐỨNG (quyết (e) đợt 165 — T2-166 ghi vào LIMITS theo lệnh): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Dữ kiện T5-165 (poll cuối watcher-164 sau btime #68 11 s) chứng minh boot cũ sống quá btime mới ≥11 s — đó là OVERLAP (đã xác nhận đợt 161), KHÔNG phải bằng chứng offset requeue sai. Offset requeue đo từ btime trong khung giờ boot mới (giờ thật) — đúng khung giờ dải 33–49,8 s được hiệu chuẩn.

## 0. Kết luận trước (headline)

1. **Probe EPERM #85: 23:40:09Z, boot d1ddd946 (#70), ok=2 fail=0, log 244→247 (+3 đúng mẫu). Cửa sổ 20:39:20Z → 23:40:09Z = 10.849 s. 0 sóng EPERM thật trong cửa sổ** (sweep #85: 125 file `*.log`, 1 file có hit, 3 lần đều là "sóng EPERM đã tắt" — trích dẫn, không phải sóng sống; 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted").
2. **Boot #70 (d1ddd946, btime 22:05:25Z) — T0-166 xác minh 9 nguồn, KHÔNG nghịch lý đồng hồ; T7-166 xác minh độc lập (Cloudflare ±0 s lúc mở); T2-166 hỗ trợ F129? (+2,06…+3,06 s — chỉ hỗ trợ, có sai sót phương pháp, xem F-166-T2-3). Marker CÒN — sống qua 22 reboot #49–#70 (T0-166 đếm độc lập).** Gap #68→#69 = 7.381 s; gap #69→#70 = 6.954 s.
3. **Mù #96? (#64) — VẪN MỞ (theo dõi tiếp, quét tươi + kiểm nội dung đầy đủ):** đoạn R file 1.238 s / union-A 1.222 s / union-B 1.211 s (y hệt T2-164/T2-165, không đổi một giây); S ĐÓNG (file 843 s / union-A 662 s / union-B 591 s); T ĐÓNG (file 307 s / union-A 31 s). **Kết luận: #96? VẪN MỞ.**
4. **Mù #88? VẪN MỞ — hole-recheck lần thứ MƯỜI: 337 hit, 0 mốc mới** (y hệt lần 9 — 337 hit, không trôi thêm; xem §2.6 + F-166-T2-2).
5. **INSIDE: #70 INSIDE dải FULL116 [20:35:42Z, 22:35:58Z] neo 20:09:31Z (biên dưới 5.383 s, biên trên 1.833 s) → chuỗi 5 LÊN 6.** Dải CÓ ĐIỀU KIỆN (gap #67/#68/#69 danh nghĩa, chưa vào CERT/FULL chính thức). Đối chiếu #70 vs dải FULL115 còn hiệu lực: NGOÀI muộn 5.540 s — chỉ để đối chiếu (cùng mẫu #69 vs FULL114 đợt 165), không phá chuỗi.
6. **(m) #70 — ĐỒNG Ý DƯƠNG (đối chiếu độc lập, 4 nguồn khớp):** requeue 22:06:03.729Z = btime +38,729 s ∈ [33; 49,8]. Parent đã CHẤP NHẬN #70 là ứng viên DƯƠNG ở quyết (n) đợt 165 (đối chiếu độc lập thuộc T2-166 — nay đã có). **N ứng viên 21→24 (nhánh khuyến nghị) hoặc 22→25 (nhánh #56 ÂM) theo quyết (n) — parent xác nhận ở đợt 166; n chính thức GIỮ 14.**
7. **(m) #56: KHÔNG thu hẹp được lần thứ CHÍN** (4 hướng — 3 hướng mới hoàn toàn + 1 hướng xác nhận lại bằng float-mtime — đều âm tính). Cửa GIỮ NGUYÊN R [2,56251; 2,66817) / J [2,566; 2,80753] s. **#56 VẪN CÓ ĐIỀU KIỆN; KHÔNG chốt n=15.**
8. **Run 165: SUCCEEDED 23:19:29Z (eid 9886), wall 9.818 s, margin 982 s, 1 lần viết lại (tại #70)** — rộng hơn run 164 (454 s) đúng 528 s; claimed→finished 8 s — TRỞ LẠI họ 6–11 s (run 164: 66 s là ngoại lệ).
9. **RAM trong cửa sổ probe #85: peak 58,05% guard; 0 mẫu ≥ guard; birefnet 0 lần thử, lần thứ 20 liên tiếp.** WFS #72 chênh 0 (994+25=1.019) lần thứ 72.
10. **Nhãn n: cơ sở sau quyết (e)/(f)/(n) đợt 165 là 24/25** (21 dương + 3 âm / 21 dương + 4 âm — đã cộng #68 + #69 + #70). Xem §4.4.

## 1. Checklist probe EPERM #85

| Hạng mục | Kết quả |
|---|---|
| Probe #84 (trước) | 20:39:20Z, boot 9a1a9319, n=84 |
| `status` 23:40:04Z | DEAD/STALE, heartbeat n=84, ts 20:39:20Z, boot 9a1a9319, tuổi 10.844 s, exit 1 |
| Log trước probe | 244 dòng |
| `status` ghi dòng DEAD | 244 → 245 (+1) |
| **`once` 23:40:09Z — probe #85** | **boot=d1ddd946, ok=2 fail=0, exit 0** |
| Log sau probe | 247 dòng (244→247 = +3 đúng mẫu: DEAD + boot-changed + probe#85) |
| Heartbeat mới | pid=22182, ts 23:40:09Z, boot d1ddd946-f9f3-4561-86e8-5eb3edceb6cc, n=85 |
| `=== probe end` | vẫn 0 dòng (1 dòng `probe start` duy nhất từ 08:49:50Z 11/11) |
| **Cửa sổ probe #85** | **20:39:20Z → 23:40:09Z = 10.849 s** |

Sóng EPERM thật gần nhất ~11:55–12:11Z 11/11 (~252 h trước probe #85).

**Sweep #85** (`eperm-sweep9696.py`, 125 file `*.log` mtime trong cửa sổ): 1 file có hit, 3 lần — tất cả "sóng EPERM đã tắt": `o8-165t8.log` ×3 (log T8-165 trích kết quả sweep). 0 "sóng EPERM vẫn bật", 0 "CẢNH BÁO", 0 "Operation not permitted" — **0 sóng thật**.

## 2. Điều tra mù #96? (#64) — THEO DÕI TIẾP (quét tươi + kiểm nội dung đầy đủ)

Mù # = reboot # + 32. #96? = reboot #64, btime 11:15:18Z 21/11/2026. Sàn luật gap: **1.147 s (19'07")** — file max gap hoặc union max gap vượt sàn ⇒ MỞ.

### 2.1 Sự kiện + định nghĩa đoạn

Cửa sổ điều tra: **[11:15:18Z, 23:40:09Z] = 44.691 s** (btime #64 → probe #85). Các đoạn, neo bằng btime/probe:

| Đoạn | Cửa sổ | Độ dài | Mốc phải |
|---|---|---|---|
| R | [11:15:18, 11:38:28] | 1.390 s | btime #64 (11:15:18Z) → T0-163 lần đầu 11:38:28Z |
| S | [11:38:28, 14:41:28] | 10.980 s | T0-163 → probe #82 |
| T | [14:41:28, 16:06:45] | 5.117 s | probe #82 → btime #66 |
| U | [16:06:45, 23:40:09] | 27.204 s | btime #66 → probe #85 (thuộc #97?/#98?/#99?/#100?, chỉ tham chiếu) |

Quét tươi (`blind9696-investigate.py`): repo-1 54 file, hidden_files 1.572, ngoài cây 807, /tmp 594, fifth 4 → merged **1.120 mốc giây duy nhất** (T2-165: 882 — tăng do cửa sổ kéo dài tới probe #85, +238 mốc trong phần U mở rộng).

### 2.2 Đồng hồ, reboot #70 (T0-166 + T7-166 + T2-166 đối chiếu)

**Reboot #70 — T0-166 xác minh 9 nguồn (cờ 23:42Z, T2 đối chiếu):** boot_id d1ddd946; `/proc/stat` btime 1795298725 = 22:05:25Z; uptime bracket 1795298725.90 ×3; `/proc/1` mtime 22:05:36Z (+11 s); journal idx 0 duy nhất, first entry 22:05:37Z (+12 s); wtmp begins 22:05:37Z (+12 s); `last` reboot 22:05 still running; Cloudflare ±1 s ×2 (local chậm hơn ~0,7 s); DB host-side (requeue 22:06:03.729Z + succeeded 23:19:29.876Z cùng khung thật). **KHÔNG nghịch lý đồng hồ.** Marker CÒN — sống qua **22 reboot #49–#70** (T0 đếm độc lập; T2 ghi nhận). Gap #69→#70 = **6.954 s**; gap #68→#69 = **7.381 s**.

**T2-166 hỗ trợ (không thay T0):** F129? (`f129.py`, 23:55:55Z): example.com +2,064 s; google.com +2,064 s; cloudflare.com +3,064 s → **F129? ≈ +2,06…+3,06 s, đủ 3 server** — cả ba dương nhưng dải rộng 1,00 s VÀ có sai sót phương pháp (mốc `now` chụp một lần trước 3 lần curl — xem F-166-T2-3). **KHÔNG dùng F129? để chứng nhận btime #70 là giờ thật** — căn cứ là T0-166 (9 nguồn) + T7-166 (Cloudflare ±0 s lúc mở, 23:38:50 GMT vs local 23:38:50Z).

**Run 165 — kết cục (T7-166 NOTES đọc #1 + appendix166 Phu luc A/B — T2 đối chiếu số học §4.3):** **SUCCEEDED 23:19:29Z** (event 23:19:29.876Z, eid 9886), wall từ started gốc 9.818 s, **margin 982 s** tới hạn 23:35:51Z (rộng hơn run 164 đúng 528 s), claimed→finished **8 s** (TRỞ LẠI họ 6–11 s của run 154–163 — run 164: 66 s là ngoại lệ), attempt 1, **1 lần viết lại (tại #70)**; 5 event đầy đủ, 0 event sau succeeded. Run 166 (`5c969404`, sched 23:35:51Z) running lúc T7-166 đọc #1, jitter 0 s (lần thứ 19 liên tiếp) — kết cục thuộc T7-167.

**POSTBOOT_PASS / watcher (T5-166 sở hữu — chưa có cờ lúc T2 viết):** #69 CÒN, #67 CÒN; #63/#66/#68 KHÔNG CÓ; **#70 CHƯA CÓ** (T0-166). Watcher-166 chưa khởi động lúc T0 đóng. Watcher-165: START 20:43:49Z pid 28592, chết theo #70 (poll cuối 22:05:31Z — 6 s sau btime, đua với reboot; xem §2.3).

### 2.3 Hoạt động từng đoạn (merged log, mốc giây)

| Đoạn | Mốc giây | File-marks | Nhận xét |
|---|---|---|---|
| R [11:15:18, 11:38:28] | 14 | 56 | Hố 1.238 s (xem §2.4) — Y HỆT T2-164/T2-165 |
| S [11:38:28, 14:41:28] | 253 | 676 | Đóng |
| T [14:41:28, 16:06:45] | 234 | 667 | Đóng |
| U [16:06:45, 23:40:09] | 619 | 1.827 | Đóng theo union (xem §2.4) — hố file max MỚI 1.407 s, chỉ tham chiếu |

**Nội dung trong R (56 file-marks, kiểm tay — y hệt T2-164/T2-165):** đầu 11:35:56Z tool-output exec-call agent 5001d1e4; 11:37:30Z tool-output agent 2c32ef43; 11:37:42Z sampler-162 scripts. R-head [11:15:18–11:34:25]: 0/0/0/0/0 mọi scope (trống). R-tail: repo-1=2 / hidden_files=51 / outside=3 / tmp=0 / fifth=0. **Mốc dpkg 11:35:40Z (TRONG hố R) là mốc nội dung THẬT:** hoạt động dpkg đầu trên #64, 2 dòng "startup packages configure", boot+20m22s — T0-162 quan sát trực tiếp từ dpkg.log #64 (dòng đầu 11:35:40Z; file đã reset theo #65/#66/#67/#68/#69/#70, quan sát còn trong T0-162 LIMITS + aggregate 162). Cùng loại với mốc dpkg 08:35:41Z mà T2-162 đã tính cho đoạn N. Được tính vào cả UNION-A lẫn UNION-B. **Không có nguồn độc lập thứ ba cho R-head:** dpkg.log đã reset 6 lần kể từ #64; journal/dmesg chỉ còn boot hiện tại (journal xoay theo boot; dmesg EPERM) — ghi rõ, không giấu. R-head trống hoàn toàn trên mọi scope đo được.

**Nội dung khác (content script, `blind9696-content.py` — số R/S/T khớp T2-165 từng dòng, cộng thêm sampler/watcher-165):** sampler-162 (d9a8d1ce) 1 dòng trong R (11:37:42Z, sau hố) + 138 dòng trong S; watcher-162 strict polls 331 trong S (predicate chặt `^timestamp boot=d9a8d1ce poll `; last poll 14:25:20Z — chết sớm, T0-163); watcher-161 linger polls sau btime #64: 0; sampler-163 3 dòng trong S tail + 45 dòng edb2acdb trong U (dòng cuối 16:52:21Z); watcher-163 163 poll trong T + **1 dòng trong U (poll cuối 16:06:54Z — poll đua với reboot #66, 9 s sau btime, nhãn boot cũ 1c1cf10c)**; sampler-164: 28 dòng f1d4ce1a + 107 dòng 0c8a94aa trong U (dòng cuối 19:53:52Z); watcher-164: 52 strict poll trong U (last poll 18:06:41Z — poll đua với reboot #68, 11 s sau btime, nhãn boot cũ f1d4ce1a); **sampler-165 MỚI: 88 dòng 9a1a9319 + 46 dòng d1ddd946 trong U (dòng cuối 22:51:29Z — sampler dừng 22:51:29Z, T9-166 sở hữu từ 23:38:50Z)**; **watcher-165 MỚI: 164 strict poll trong U (last poll 22:05:31Z — poll đua với reboot #70, 6 s sau btime, nhãn boot cũ 9a1a9319 — cùng mẫu watcher-163/164)**; **sampler-166 MỚI: 2 dòng d1ddd946 trong U (23:38:50Z + 23:39:50Z — trong cửa sổ tới probe #85)**.

**Jump witness (hoạt động) tại #64/#65/#66/#67/#68/#69/#70: đều = 0 hoạt động thật** (`blind9696-sessions.py`, 159 exec-log có mtime trong cửa sổ: R 1, S 34, T 33, U 91). Mọi hit regex đều là trích dẫn, đã kiểm tay từng hit:
- #64 (5 hit — tăng 1 so với T2-165): 4 hit cũ (d8365be752b7 + 32c9bb12db04 + 9db5c8fba228 + b70bb0edc372) + **proc_82da543947c6.log MỚI** (log của chính T2-165, trích biên hố H-E1-88 — cùng mẫu 9db5c8fba228).
- #65 (5 hit): 4 hit cũ + proc_82da543947c6.log MỚI (cùng mẫu).
- #66 (7 hit): 6 hit cũ + proc_82da543947c6.log MỚI (cùng mẫu).
- #67 (7 hit): 6 hit cũ + proc_82da543947c6.log MỚI (cùng mẫu).
- #68 (5 hit): 4 hit cũ + proc_82da543947c6.log MỚI (cùng mẫu).
- #69 (3 hit): 2 hit cũ + proc_82da543947c6.log MỚI (cùng mẫu).
- **#70 (3 hit — MỚI):** proc_6ceb333587e9.log (20:09:31..23:30:00 — trích btime #69 + mốc "END 23:30:00Z" tương lai, file mtime 20:43:56Z — không thể chứa hoạt động 23:30Z thật); proc_fa64a6b73754.log (20:09:31..22:30:00 — trích btime #69 + mốc "22:30:00Z" tương lai, file mtime 20:41:27Z); proc_1f99f1666c0a.log (20:40:35..22:30:00 — mốc "22:30:00Z" tương lai, file mtime 21:00:21Z). **Cả ba đều là trích dẫn mốc tương lai trong nội dung đã ghi trước — 0 hoạt động thật bắc qua btime #70.**
- Exec-log content-ts trong hố R union (11:15:29–11:35:40): 3 hit, 0 mốc hoạt động: 11:16:22Z ×2 (trích biên hố H-P1-old — thêm 1 hit từ proc_82da543947c6.log MỚI, cùng loại với 9db5c8fba228); 11:26:05Z (trích btime reboot #48 ngày 20/11).
- Exec-log content-ts trong hố U file max (17:20:48–17:36:14): 7 hit, 0 mốc hoạt động: 17:33:27Z ×6 (chính btime #67, trích trong log T7-164/T2-164) + 17:22:25Z ×1 (trích biên hố H-U2-old, trong proc_82da543947c6.log MỚI).

### 2.4 Mốc merged + verdict (luật gap, sàn 1.147 s)

| Đoạn | File max gap | Union-A max gap | Union-B max gap | Verdict |
|---|---|---|---|---|
| **R** | **1.238 s** (11:15:18 → 11:35:56) | **1.222 s** (11:15:18 → 11:35:40) | **1.211 s** (11:15:29 → 11:35:40) | **MỞ (y hệt T2-165)** |
| S | 843 s | 662 s | 591 s | ĐÓNG |
| T | 307 s | 31 s | — | ĐÓNG |
| U | **1.407 s** (22:09:05 → 22:32:32) | 926 s | 773 s | ĐÓNG theo union (tham chiếu) |

Union-A = mốc file + mốc nội dung (dpkg 11:35:40Z); Union-B = Union-A + mốc hệ thống trước btime (11:15:29Z). **R: mọi cách đếm đều MỞ — y hệt T2-164/T2-165 từng giây.** Biến thể +dispatch 11:35:51Z (DB, không tính vào union chính): 1.211 s — cũng MỞ.

**U — hố file max MỚI 1.407 s (22:09:05→22:32:32, lần đầu xuất hiện do U kéo dài tới probe #85):** hố nằm trong phiên T10-165 đóng sổ (sau reboot #70, trước khi đợt 165 đóng); được lấp đầy bởi mốc nội dung sampler-165 d1ddd946 (dòng mỗi 60 s: 22:09:xx–22:32:xx) → union-A 926 s / union-B 773 s — **ĐÓNG theo union**. Hole-recheck H-U5 (§2.6) xác nhận 0 file mới ở độ chính xác float trong hố này. U chỉ tham chiếu cho #96? — không đổi verdict R.

S khớp T2-165 về file (843 s) và union-B (591 s); union-A 662 s (giữ nguyên từ T2-165). T đóng chắc (31 s).

**Kết luận đầy đủ: #96? VẪN MỞ qua đoạn R. Quét tươi + kiểm nội dung + sessions + hole-recheck đều đã chạy đầy đủ đợt này và xác nhận lại từng số của T2-165 (R/S/T không đổi một giây).**

### 2.5 CERT/FULL ứng viên + INSIDE

**CERT/FULL chính thức GIỮ 76/91** (quyết (b) đợt 164, giữ theo quyết (m) đợt 165; #95?/#94?/#77? vẫn mở). Gap #63 = 9.073 s cho ứng viên CERT95/FULL110.

**FULL116** (gap #69 NOMINAL 7.381 s, CÓ ĐIỀU KIỆN): n=116, mean 1h40'03", median 1h51'50", p10 0h26'11" (1.571,00 s), p90 2h26'28" (8.787,50 s), sd 0h56'24", min 0h00'55", max 5h43'18"; trong 90–150'=61, <60'=27, >180'=8, >240'=3.
**FULL114/FULL115 kiểm lại:** p10/p90 KHỚP T2-165 từng số (FULL114 1.567,80/8.803,30 s; FULL115 1.569,40/8.795,40 s — script có assert, không trôi chuỗi).

Tái tính khớp T2-165 từng giây (FULL113 n=113, mean 1h40'33", median 1h53'00", p10 1.566,20 s / p90 8.811,20 s — khớp đúng số T2-165 in; FULL112/FULL111/FULL110 cũng khớp qua chuỗi exec).

**INSIDE:**
- **#70 INSIDE dải FULL116 [20:35:42Z, 22:35:58Z] neo 20:09:31Z** (biên dưới 5.383 s, biên trên 1.833 s) → **chuỗi 5 LÊN 6**.
- Đối chiếu vs dải còn hiệu lực: #70 NGOÀI FULL115 (muộn 5.540 s) — chỉ để đối chiếu, không phải dải đúng phương pháp (cùng mẫu #69 NGOÀI FULL114 muộn 561 s đợt 165 trong khi INSIDE FULL115; #67 NGOÀI FULL112 đợt 164 trong khi INSIDE FULL113).
- **Nhãn dải — kiểm lại đúng phương pháp (bài học F-165-T2-1):** #70 kiểm theo FULL116 neo btime #69 (mẫu FULL112→#66, FULL113→#67, FULL114→#68, FULL115→#69 ⇒ FULL116→#70; mỗi dải gồm gap kết thúc tại neo của nó). FULL115 chỉ là dải đối chiếu còn hiệu lực, KHÔNG phải dải phương pháp cho #70.
- Tốc độ reboot: tới #69: 145 reboot / 263,86 h = 1 lần / 109,2 phút; tới #70: 146 reboot / 265,79 h = 1 lần / 109,2 phút (tới #68: 144/261,81 h = 109,1).

### 2.6 Hole-recheck

`hole-recheck9696.py`: find toàn cây `/home/hatch` + `/var/log` (mtime float) trên hợp [19:32:59Z 20/11, 23:40:09Z 21/11]: **7.454 file**. Find stderr: 1 dòng — `/home/hatch/.stagged-uploads: Permission denied` (giới hạn đứng, thư mục mode 0000).

| Hố | Kết quả |
|---|---|
| H-R1 (11:15:18, 11:35:56) | **0 hit — 0 mốc mới** |
| H-R1-old (11:16:22, 11:35:35) | 0 hit |
| H-S1/H-S2/H-S3/H-T1/H-U1/H-U4 | mỗi hố 1 float-trap (cùng giây cạnh trái), 0 mới |
| H-U2 (17:20:48, 17:36:14 — bắc qua btime #67) | 1 inside = 1 trap (cạnh trái 17:20:48.627Z), 0 mới |
| H-U2-old (17:22:25, 17:35:37) | 0 hit |
| H-U3 (19:37:11, 19:49:46) | 10 inside = 10 trap (cùng giây 19:37:11, file stall T8-164), 0 mới |
| **H-U5 MỚI (22:09:05, 22:32:32)** | **1 inside = 1 trap (cạnh trái 22:09:05.886Z, proc_5c237211ba31.log), 0 mới** |
| H-E1-88 (19:32:59Z, 20:17:30Z) | **337 hit, TẤT CẢ float-trap theo cơ sở T2-157, 0 MỚI — lần thứ MƯỜI liên tiếp 0 mốc mới** |

Known base: 1.120 mốc giây đợt này; base #88? T2-157: 557 giây. **H-E1-88 giữ 337 hit — y hệt lần 9, không trôi thêm** (lần 9 giảm 345 → 337 do 8 exec-log mtime trôi; đợt này 0 file trôi thêm).

**CẢNH BÁO PHƯƠNG PHÁP — xem F-166-T2-2:** lần chạy hole-recheck ĐẦU đợt này dùng W + hi cũ (sed lỗi) và đã GHI ĐÈ `round165-t2/holerecheck-all.txt` (bản gốc 6.791 dòng của đợt 165 đã mất; bản tóm tắt còn trong `round165-t2/hole-recheck9696.log` + LIMITS T2-165 §2.6). Lần chạy thứ hai (sau khi sửa W + hi) mới là số chính thức trên đây — file `holerecheck-all.txt` đúng nằm ở `round166-t2/` (7.454 dòng).

### 2.7 Verdict mù (tổng hợp)

| Mù | Verdict đợt 166 | Cơ sở |
|---|---|---|
| #96? (#64) | **VẪN MỞ** (R 1.238/1.222/1.211 s vượt sàn; S/T đóng) | Quét tươi + kiểm nội dung đầy đủ, số y hệt T2-165 |
| #95? (#63) | **MỞ** (giữ nguyên quyết (b) đợt 164) | Không có bằng chứng mới |
| #94? (#62) | **MỞ** (giữ nguyên) | Không có bằng chứng mới |
| #88? | **VẪN MỞ** (lần thứ 10: 337 hit, 0 mới) | Hole-recheck §2.6 |
| #77? | **VẪN MỞ** (giữ nguyên) | Không có bằng chứng mới |

**CERT/FULL chính thức GIỮ 76/91** (vì #77?/#88?/#94?/#95? vẫn mở; #96? VẪN MỞ — chưa đổi được khi chưa chứng nhận theo thứ tự).

---

## 3. Mù #88? + #77? + #95?/#94? — giữ nguyên

- **#88?:** hole-recheck lần thứ MƯỜI (§2.6): 337 hit, 0 mốc mới → **VẪN MỞ**.
- **#77?:** không có bằng chứng mới đợt này → **VẪN MỞ**.
- **#95?/#94?:** không có bằng chứng mới đợt này → **MỞ** (giữ nguyên verdict đợt 164/165). Không đo lại vì không có gì mới để đo (luật gap: chỉ kiểm lại khi có bằng chứng mới).
- **#96?:** VẪN MỞ (§2.4–2.6); theo dõi tiếp đợt 167.

---

## 4. Mô hình đồng hồ + điểm (m)

### 4.1 Điểm (m) #56 — thu hẹp cửa lần thứ CHÍN: KHÔNG ĐẠT

Cửa hiện tại (Model 1, quyết (d) đợt 157): **R ∈ [2,56251; 2,66817), J ∈ [2,566; 2,80753] s. #56 VẪN CÓ ĐIỀU KIỆN.** Dải requeue dương: **[33; 49,8] s** (max 49,761 s từ #50).

Bốn hướng đã thử đợt này (3 hướng HOÀN TOÀN MỚI + 1 hướng xác nhận lại), tất cả âm tính:

1. **(i) Find toàn cây `/home/hatch` + `/var/log`, mtime float trong cửa D [19:04:44Z, 20:22:43Z] 20/11 (epoch 1795201484–1795206163, đã kiểm bằng python trước — KHÔNG lặp F-165-T2-2): 351 file.** Chỉ 9 file có mtime sau 20:16:36Z (mốc D-wall muộn nhất đã biết): 3 file session 6fc7dd16 @20:16:36.618–.699Z (chính mốc D muộn nhất — file .699Z cho R ≥ 2,56251, đã tính từ đợt 158); 3 file session af13c1c2 @20:17:30Z + 3 file session 964f2bc4 @20:19:34Z (đã phân loại E từ đợt 157 — session boot mới, không phải hoạt động D). **0 mốc D-wall mới muộn hơn 20:16:36Z → cận dưới R GIỮ NGUYÊN 2,56251.** (Hướng này xác nhận lại bằng float-mtime kết luận T2-158 (ii) — đã quét toàn cây, không có mốc D nào muộn hơn.)
2. **(ii) Log xoay: 0 file `.gz` / `.1` / syslog / auth.log trong `/var/log`; `term.log` 0 dòng ngày 20/11** (chỉ còn log boot hiện tại, kết thúc 22:08:08Z 21/11); `wtmp` chỉ còn boot hiện tại (begins 22:05:37Z 21/11); `btmp` 0 byte. **Không còn nội dung 20/11 trong log xoay.**
3. **(iii) Shell history + reflog: `~/.bash_history` KHÔNG TỒN TẠI; `~/.zsh_history` KHÔNG TỒN TẠI; `repo-1/.git/logs/HEAD` + `.git/logs/refs/heads/main` KHÔNG TỒN TẠI** (repo không có reflog). **0 nguồn.**
4. **(iv) Browser profile khác: `~/.mozilla/firefox/` TRỐNG; 0 file `places.sqlite` trong toàn `/home/hatch`;** Chrome History đã thử đợt 165 (5 profile cũ, 0 visit trong cửa D). **0 visit/session mới trong cửa D.**

**Cửa GIỮ NGUYÊN. #56 VẪN CÓ ĐIỀU KIỆN; n chính thức (ứng viên) GIỮ 14. T2-166 KHÔNG chốt n=15.**

### 4.2 Điểm (m) #70 — ĐỐI CHIẾU ĐỘC LẬP (nhiệm vụ chính): ĐỒNG Ý DƯƠNG

**Bốn nguồn độc lập khớp nhau từng số:**

1. **T2-166 tính lại từ epoch thô** (`m-check9696.py`, script mới viết độc lập — không dùng appendix của T7):
   - requeue 22:06:03.729Z − btime #70 22:05:25Z = **38,729 s ∈ [33; 49,8] ✓**
   - dispatch 22:06:03.819Z − btime = 38,819 s; reattach 22:06:03.941Z − btime = 38,941 s (cùng trong dải)
   - started_at viết lại: 1795293351 → 1795298763 (delta 5.412 s); claimed_at 1795303161 = finished − 8 s
   - spanning = 0 VÌ started_at viết lại thành sau btime (1795298763 > 1795298725) — **artifact viết-lại-tự-loại, không phải bằng chứng vắng mặt**
   - gap #69→#70 = 6.954 s; gap #68→#69 = 7.381 s
   - run 165 finished 23:19:29Z = btime #70 + 4.444 s (sau btime)
2. **T7-166 NOTES đọc #1 + appendix166 Phu luc A/B (đọc DB tươi, nguồn độc lập thứ hai):** run 165 `succeeded` 23:19:29.876Z (eid 9886); started_at HIỆN TẠI 1795298763 (sau viết lại #70); claimed 1795303161; events đầy đủ 5 (dispatched 20:35:51.084Z eid 9846; requeued 22:06:03.729Z eid 9868; dispatched 22:06:03.819Z eid 9869; reattached 22:06:03.941Z eid 9870; succeeded 23:19:29.876Z eid 9886); 0 event sau succeeded; margin 982 s; claimed→finished 8 s (trở lại họ 6–11 s).
3. **T7-165 LIMITS §7 (đọc DB tươi đợt 165, nguồn độc lập thứ ba):** reboot #70 xác minh 9 nguồn (boot_id + btime + uptime -s + /proc/1 +12,372 s + journal +12 s + wtmp +12 s + last reboot; Cloudflare ±1 s ×2); VIẾT LẠI run 165 lần 1, requeue 22:06:03.729Z = btime +38,729 s — TRONG dải 33–49,8 s → ỨNG VIÊN DƯƠNG (m).
4. **T0-166 .done + NOTES (xác minh 9 nguồn + đọc DB chỉ đọc, nguồn độc lập thứ tư):** #70 xác minh 9 nguồn (boot_id + btime + uptime bracket 1795298725.90 ×3 + journal first 22:05:37Z +12 s + wtmp/last reboot 22:05 + /proc/1 22:05:36 +11 s + mốc file + DB requeue +38,729 s + Cloudflare ±1 s ×2); DB run 165: scheduled 20:35:51Z, started 22:06:03Z, finished 23:19:29Z, succeeded, attempt 1, events 9846/9868/9869/9870/9886 đúng từng mili-giây.

**Bằng chứng run 165 ĐANG CHẠY tại btime #70:** run 165 dispatched 20:35:51Z (trước btime #70 1h29m34s) + 0 event finish trước btime + requeue/reattach tại +38 s + succeeded sau btime 23:19:29Z. **Không có dữ kiện lệch khung giờ nào cho #70** (khác #68 — không có watcher nào sống quá btime #70 ngoài poll đua watcher-165 22:05:31Z, 6 s sau btime, cùng mẫu watcher-163/164 — đó là poll đua, không phải bằng chứng khung giờ lệch; offset requeue đo từ btime #70 trong khung giờ boot mới theo ghi chú đứng trên đây).

**Kết luận: ĐỒNG Ý #70 là điểm DƯƠNG (m).** Requeue 38,729 s không mở rộng dải (max vẫn 49,761 s từ #50). **Parent đã CHẤP NHẬN #70 là ứng viên DƯƠNG ở quyết (n) đợt 165 (đối chiếu độc lập thuộc T2-166 — nay đã có: ĐỒNG Ý); n ứng viên 21→24 (nhánh khuyến nghị) hoặc 22→25 (nhánh #56 ÂM) theo quyết đó — parent xác nhận ở đợt 166; n chính thức GIỮ 14.**

### 4.3 Điểm (m) #69 — kiểm lại (sanity, T2-165 đã đồng ý)

Requeue 20:10:06.432Z − btime #69 = 35,432 s ∈ [33; 49,8] ✓ (tính lại từ epoch thô trong `m-check9696.py` — khớp T2-165). Không có gì thay đổi; #69 DƯƠNG đã CHẤP NHẬN theo quyết (f) đợt 165.

### 4.4 Nhãn n (quyết (e)/(f)/(n) đợt 165)

- **Cơ sở hiện tại (đã cộng #66 + #68 + #69 + #70 theo quyết (f)/(e)/(n) đợt 165): n ứng viên = 24 (nhánh khuyến nghị: 21 dương + 3 âm #38/#45/#62) hoặc 25 (nhánh #56 ÂM: 21 dương + 4 âm).**
- **Đối chiếu độc lập (m) #70 của T2-166 (§4.2) ĐỒNG Ý DƯƠNG — xác nhận n 24/25 trên đây; parent xác nhận cuối ở đợt 166.**
- **n chính thức (ứng viên) GIỮ 14** cho đến khi #56 được quyết.

---

## 5. RAM trong cửa sổ probe #85

Guard 6.144 MiB = 6.291.456 kB; balloon ceiling 6.443.824 kB. Sampler T9-165 (round165-t9/ram-sampler.log, 134 dòng tổng) + T9-166 (round166-t9/ram-sampler.log — 4 dòng lúc T2 chạy).

| Nguồn | Mẫu trong cửa sổ | Boot | Peak | % guard | ≥ guard | Balloon (==ceiling) |
|---|---|---|---|---|---|---|
| T9-165 | 133 | 9a1a9319 (n=87) + d1ddd946 (n=46) | 3.652.376 kB | 58,05% | 0 | 58 |
| T9-166 | 2 | d1ddd946 (23:38:50Z + 23:39:50Z) | 410.988 kB | 6,53% | 0 | 1 |
| **Toàn cửa sổ** | **135** | — | **3.652.376 kB** | **58,05%** | **0** | **59** |

- 9a1a9319: n=87, peak 3.652.376 kB (58,05% guard — max lúc 20:47:52Z, trùng max toàn phiên T9-165). d1ddd946 (T9-165): n=46, peak 1.897.016 kB (30,15% guard). d1ddd946 (T9-166): n=2, peak 410.988 kB (6,53% guard).
- Balloon 58 (T9-165) = toàn bộ E-166 (22 mẫu) + E-167 (36 mẫu) — khớp T9/T10-165: 58 mẫu ghim, 43,3%. Balloon 1 (T9-166, 23:38:50Z bal=6.443.824) — E-167 vẫn ghim tại thời điểm đó (mẫu 23:39:50Z bal=6.080.052 đã xả — kết cục E-167 thuộc T9-166).
- **birefnet 0 lần thử, lần thứ 20 liên tiếp** (peak toàn cửa sổ 58,05% guard, cách guard 2.639.080 kB).
- Lưu ý cận dưới: sampler T9-165 dừng 22:51:29Z (dòng cuối); không có mẫu 22:51:29Z → 23:38:50Z (2.841 s, KHÔNG chứa reboot — boot d1ddd946 xuyên suốt) — peak trong quãng này là cận dưới (cùng họ F-142-T2-10 / T2-165 §5).

---

## 6. Phương pháp, sai số riêng, câu hỏi cho parent

### 6.1 Phương pháp

- **btime CHỈ từ `/proc/stat btime`** (quyết (e) đợt 156). Đồng hồ boot #70: T0-166 9 nguồn + T7-166 (Cloudflare ±0 s lúc mở) là căn cứ chính; T2-166 chỉ hỗ trợ (F129? — xem F-166-T2-3).
- **Luật gap (sàn 1.147 s):** file max gap hoặc union max gap (union-A = file + hệ thống + nội dung; union-B = union-A + mốc hệ thống trước btime) vượt sàn ⇒ MỞ.
- **(m):** T2 không tự query scheduler DB (T7 sở hữu) — đối chiếu qua NOTES T7-166 + T7-165 LIMITS + T0-166 .done/NOTES + tính lại từ epoch thô bằng script riêng. Ghi chú đứng quyết (e) đợt 165: dải 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới).
- **WFS:** đếm theo DÒNG, chỉ file có count > 0; NEWSTD + R7b + copies; kiểm async `.writeFile(` có giới hạn.
- **EPERM sweep:** chỉ đếm marker trong `*.log` có mtime trong cửa sổ probe (không grep -r bừa — F-150-T2-2).
- **INSIDE:** dải cho reboot #k = FULL(110+k−64) neo btime #(k−1) — mẫu: #66→FULL112, #67→FULL113, #68→FULL114, #69→FULL115, **#70→FULL116** (xem F-165-T2-1 — nhãn dải kiểm lại đúng trước khi viết LIMITS).
- **Prereg:** viết TRƯỚC probe #85 (~23:40Z), lean kiểm lại ở §6.2.

### 6.2 Sai số riêng (F-166-T2-*)

- **F-166-T2-1:** lần chạy `blind9696-sessions.py` ĐẦU truyền sai epoch đối số hố (1795298729/1795299340/1795285248/1795295774 — lấy nhầm số từ btime #70 thay vì hố R/U đúng 1795259729/1795260940/1795281648/1795282574); kết quả in-gap lần đầu (2 hit trong "hố R" 22:05:29–22:15:40) KHÔNG CÓ GIÁ TRỊ. Bắt được khi đọc nhãn hố in ra (22:05:29–22:15:40 rõ ràng không phải hố R); chạy lại với epoch đúng (đã kiểm bằng python trước) → R-gap 3 hit / U-gap 7 hit, đều trích dẫn, 0 mốc mới. Không ảnh hưởng verdict (jump witness không dùng đối số hố).
- **F-166-T2-2 (NGHIÊM TRỌNG — ghi đè file đợt trước):** lệnh `sed` chuyển `hole-recheck9696.py` sang đợt 166 LỖI HOÀN TOÀN do ký tự `#` trong mẫu `NINTH #88? check` va chạm với delimiter `#` của sed ("unknown option to `s'") → W vẫn `round165-t2`, hi vẫn 20:39:20Z. Lần chạy hole-recheck đầu: (a) find trên hợp cũ [19:32:59Z 20/11, 20:39:20Z 21/11] — KHÔNG phủ tới probe #85; (b) **GHI ĐÈ `round165-t2/holerecheck-all.txt` (bản gốc 6.791 dòng của đợt 165 ĐÃ MẤT)** + `find-stderr.txt`; (c) kết quả H-U5 (0 hit) VÔ GIÁ TRỊ vì hố H-U5 [22:09:05, 22:32:32] nằm NGOÀI hợp find. Bắt được khi đối chiếu "known merged marks 882" với merged pass 1.120 (chênh đúng 238 = số mốc U mở rộng) + kiểm `grep ^W =` và `^hi =`. Đã sửa W + hi bằng python, chạy lại sạch (số chính thức §2.6). H-E1-88 = 337 hit trong cả hai lần chạy (hố nằm trọn trong hợp cũ nên số đứng — nhưng chỉ lần chạy thứ hai mới được tính là chính thức). **Hậu quả còn lại: file `holerecheck-all.txt` gốc của đợt 165 đã mất — bản tóm tắt còn trong `round165-t2/hole-recheck9696.log` + LIMITS T2-165 §2.6; T10-166 KHÔNG dùng file hiện tại ở `round165-t2/` làm bằng chứng đợt 165.** Bài học: KHÔNG dùng `#` làm delimiter sed khi mẫu chứa `#...?`; kiểm `grep ^W =`/`^hi =` trước khi chạy script quét toàn cây.
- **F-166-T2-3 (ghi nhận, không phải lỗi verdict):** F129? chụp mốc `now` MỘT LẦN trước 3 lần curl — mỗi lần curl tốn ~1 s nên delta server sau bị thổi phồng (+2,064/+2,064/+3,064 s). KHÔNG dùng F129? để chứng nhận btime #70 — căn cứ là T0-166 (Cloudflare ±1 s ×2, local chậm ~0,7 s) + T7-166 (Cloudflare ±0 s lúc mở). F129? chỉ ghi nhận là "cả ba server dương".
- **F-166-T2-4 (ghi nhận):** prereg ước dải FULL116 ≈ [20:35:41Z, 22:36:00Z] — thực tế [20:35:42Z, 22:35:58Z] (chênh 1–2 s do ước p10/p90 từ FULL115); lean INSIDE ✓, không ảnh hưởng verdict.
- **F-166-T2-5 (ghi nhận):** sed chuyển `eperm-sweep9696.py`/`ram-max9696.py` bị lỗi thay thế kép (thay 17:44:45Z→20:39:20Z rồi 20:39:20Z→23:40:09Z trong cùng lệnh → cả hai mốc thành 23:40:09Z, cửa sổ rỗng); bắt được khi grep kiểm trước khi chạy, đã sửa bằng python với epoch đúng. Không ảnh hưởng kết quả (chưa chạy lần sai).

**Prereg (§6.1, viết trước probe #85) kiểm lại:** (a) #96? R MỞ, số y hệt T2-165 ✓ (file 1.238 / union-A 1.222 / union-B 1.211 s); S/T ĐÓNG ✓; (b) #88? 337 hit / 0 mới, lần 10 ✓ (prereg ước ~337 hit — thực 337, không trôi thêm); (c) #95?/#94?/#77? giữ MỞ ✓; (d) INSIDE #70 ✓ (prereg ước p10/p90 FULL116 ≈ 1.570/8.788 s — thực 1.571,00/8.787,50 s; lean INSIDE ✓; chuỗi 5→6 ✓); (e) (m) #70 ĐỒNG Ý DƯƠNG ✓ (4 nguồn khớp); (f) (m) #56 4 hướng đều âm tính ✓ (lần thứ chín); (g) ghi chú đứng quyết (e) đợt 165 đã ghi vào LIMITS đầu file ✓; (h) RAM < guard ✓, birefnet 0 lần ×20 ✓; (i) WFS #72 chênh 0 ✓ (delta +2/+1 giải thích đúng bằng LIMITS T2-165 mới — xem §6.3); (j) n 24/25 theo quyết (n) đợt 165 ✓ (đối chiếu T2-166 ĐỒNG Ý — parent xác nhận ở đợt 166).

**WFS #72** (scan-wfs72.sh, 23:50:16–23:50:38Z): NEWSTD 994 dòng / 297 file (phạm vi 3.459 file); R7B 1.019 / 314 (12.852 file); copies 25 / 17; **994+25=1.019, chênh 0 — lần thứ 72 liên tiếp.** Delta vs #71: +2 dòng / +1 file — giải thích đầy đủ bằng diff: `docs/PHASE9_ROUND165_T2_EPERM_LIMITS.md:2` (file LIMITS T2-165 mới, nhắc "writeFileSync" đúng 2 lần trong văn bản — grep -c xác minh). Async `.writeFile(`: 2 helper đã biết (eperm-retry.mjs, epermRetry.js:116) + 1 nhắc trong PHASE9_GAP_ANALYSIS.md; 0 stray trong source.

**Đối chiếu cờ các luồng (lúc T2 viết, ~23:57Z):** T0-166 DONE 23:42Z (boot #70 9 nguồn, marker 22, run 165 SUCCEEDED 23:19:29Z theo DB, POSTBOOT_PASS #70 chưa có). T1-166 DONE (verify 165 PASS + suite 28/28 trên boot #70, 23:39:43–23:47:02Z; đếm khớp lần thứ 58 liên tiếp; F-166-T1-1: header GAP §94 còn cũ — giao T10-166 cập nhật khi viết §95). T5-166 DONE, T6-166 DONE (chưa đọc chi tiết — không thuộc phạm vi T2). T4/T7/T8/T9-166 chưa đóng lúc T2 viết — T7-166 NOTES đọc #1 + appendix166 đã đủ cho (m) #70; T5-166 sở hữu POSTBOOT_PASS #70 + watcher-166.

### 6.3 Câu hỏi cho parent

(a) **(m) #70 — DƯƠNG? n ứng viên 24 (nhánh khuyến nghị) / 25 (nhánh #56 ÂM) — xác nhận?** (đối chiếu độc lập 4 nguồn, §4.2 — T2-166 ĐỒNG Ý DƯƠNG; quyết (n) đợt 165 đã CHẤP NHẬN #70 là ứng viên DƯƠNG chờ đối chiếu này.) Requeue 22:06:03.729Z = btime +38,729 s ∈ [33; 49,8]; dispatch +38,819 s; reattach +38,941 s — cả ba trong dải. n chính thức GIỮ 14.
(b) **INSIDE chuỗi: #70 INSIDE dải FULL116 → chuỗi 5 LÊN 6 — ghi nhận?** (T2 §2.5; T10 kiểm lại phép tính dải độc lập — p10/p90 đính kèm đầy đủ: FULL116 p10 1.571,00 s / p90 8.787,50 s neo 20:09:31Z → [20:35:42Z, 22:35:58Z]; biên dưới 5.383 s / biên trên 1.833 s.) Dải có điều kiện (gap #67/#68/#69 danh nghĩa, chưa vào CERT/FULL chính thức). #70 NGOÀI FULL115 muộn 5.540 s chỉ là đối chiếu, không phá chuỗi?
(c) **#96? VẪN MỞ (theo dõi tiếp) — ghi nhận? #95?/#94? MỞ — ghi nhận? #88?/#77? VẪN MỞ — ghi nhận?** CERT/FULL chính thức GIỮ 76/91? Hố file U MỚI 1.407 s (22:09:05→22:32:32) — đóng theo union, chỉ tham chiếu — ghi nhận?
(d) **#56 VẪN CÓ ĐIỀU KIỆN** (lần thứ chín không thu hẹp được) — có hướng neo mới nào parent muốn T2-167 thử (đã thử đợt này: find toàn cây trong cửa D 351 file — 0 mốc D mới sau 20:16:36Z; log xoay 0 dòng 20/11; shell history + reflog không tồn tại; Firefox 0 profile)? T2-158 đã ghi "không còn hướng đo nào khác trong tầm cell" — T2-166 đã thử thêm 3 hướng mới (ii)/(iii)/(iv) và xác nhận lại (i) — cả bốn đều âm tính.
(e) **Run 165 SUCCEEDED 23:19:29Z, margin 982 s, 1 lần viết lại — ghi nhận?** Claimed→finished 8 s (trở lại họ 6–11 s) — ghi nhận?
(f) **F-166-T2-2 (hole-recheck lần đầu ghi đè `round165-t2/holerecheck-all.txt` — bản gốc đợt 165 đã mất; bản tóm tắt còn trong log + LIMITS): GHI NHẬN?** T10-166 KHÔNG dùng file hiện tại ở `round165-t2/` làm bằng chứng đợt 165. Số hole-recheck chính thức đợt 166 (§2.6) từ lần chạy thứ hai (sau khi sửa W + hi) — ghi nhận?
(g) **#88? hole-recheck lần thứ 11 ở đợt 167?** (Lần 10: 337 hit, 0 mới — y hệt lần 9; số hit không trôi thêm — có cần đổi cách đếm cơ sở không, hay giữ nguyên?)

---

## 7. File + stage

**LIMITS này:** `docs/PHASE9_ROUND166_T2_EPERM_LIMITS.md` (1 entry, stage duy nhất).

**File làm việc (round166-t2):** prereg-t2.md, f129.py, f129.txt, blind9696-gaps.py, blind9696-gaps.log, blind9696-investigate.py, blind9696-investigate.log, blind9696-repo-1.txt, blind9696-hidden_files.txt, blind9696-outside.txt, blind9696-tmp.txt, blind9696-fifthscope.txt, blind9696-merged.py, blind9696-merged.log, blind9696-content.py, blind9696-content.log, blind9696-sessions.py, blind9696-sessions.log, sessions-9696.txt, hole-recheck9696.py, hole-recheck9696.log, holerecheck-all.txt, find-stderr.txt, scan-wfs72.sh, scan-wfs72.log, scan-meta.txt, files-newstd.bin, files-r7b.bin, files-copies.txt, wfs-newstd.txt, wfs-r7b.txt, wfs-copies.txt, eperm-sweep9696.py, eperm-sweep9696.txt, ram-max9696.py, ram-max9696.txt, m-check9696.py, m-check9696.txt, m56-166.py, m56-166.txt, m56-166-tail.txt.

**Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round166-t2-eperm.txt` (NUL-delimited, 1 entry — LIMITS này). KHÔNG push.

**Nợ mở giao đợt 167 (T2-167):** hole-recheck #88? lần thứ 11; kết cục run 166 (T7-167); POSTBOOT_PASS #70 + watcher-166 (T5-166/167); (m) #56 thử thu hẹp lần thứ mười (chờ parent trả lời (d) — đã thử 4 hướng đợt này, 3 hướng mới); (m) #71 nếu có reboot mới; INSIDE #71 (dải FULL117 neo 22:05:25Z nếu #70 đóng); prune/WFS/EPERM/RAM/birefnet thường kỳ; G1 chờ user quyết; u2net là fallback chính thức; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại.
