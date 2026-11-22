# LIMITS — Phase 9 đợt 161, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ mười lăm liên tiếp; headroom 0 → 2, dưới ngưỡng lần thứ 21 liên tiếp; balloon GHIM TRẦN 3 EPISODE, 39/139 mẫu, 2 boot #62/#63; REBOOT #63 GIỮA PHIÊN; ENOSPC ≥84 dòng trên 2 boot; lượt yên #30 CÓ lượt hợp lệ #26)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: #62: 0 ×8 (08:37:38–10:07:59Z) → #63: 0, 0 lúc boot+2m43s (10:33:25Z) → 2, 2 lúc đóng (10:55:51Z, boot+25m09s)** — **giá trị ổn định 2, dưới ngưỡng < ~1.800 lần thứ hai mươi mốt liên tiếp** (mở 0 trên cả hai boot, lên 2 cuối phiên trên boot mới — xem §1.2, F-161-T9-1). Tỉ lệ/vite **2 / 1.578 ≈ 0,0013** — một vite mới (~1.578 watch) vẫn không khởi động được. Trần 63.747 không đổi. Quyết (l) đợt 158 "chỉ theo dõi" đứng, không hành động. Xem §1.
- **Balloon GHIM TRẦN 3 EPISODE, 39/139 mẫu (28,1%), 6 chuỗi, HAI boot (#62 + #63):** E1 (#62, 27 mẫu, 3 chuỗi, 09:05:32–09:41:32Z, điểm đứt QUAN SÁT ĐƯỢC 09:42:32Z) + E2 (#62, 3 mẫu, 10:28:34–10:30:34Z, CÒN MỞ lúc reboot #63 — điểm đứt KHÔNG quan sát được) + E3 (#63, 9 mẫu, 2 chuỗi, 10:45:00–10:56:00Z, CÒN MỞ lúc đóng). Dip sâu nhất đợt: **90,8% trần (6 mẫu) giữa chuỗi 2–3 của E1 — sâu hơn mọi dip tiền lệ (đợt 160: 93,9%; 158: 94,5%; 157: 94,4%)** — T9 đếm E1 là 1 episode theo quy tắc (g) + tiền lệ, nhưng giao T10 phán: nếu tách dip 90,8% thì thành 4 episode, tách cả hai dip thì 5 episode (xem §2.2, F-161-T9-7).
- **RAM:** sampler **139 mẫu, 08:37:31Z–10:56:00Z, HAI boot (#62: 114 mẫu; #63: 25 mẫu; reboot #63 10:30:42Z cắt giữa phiên, gap sampler lớn nhất 85 s)**. Min **417.016 kB (407,2 MiB) lúc 09:07:32Z** (mẫu ghim E1); max **2.700.880 kB (2.637,6 MiB = 42,93% guard) lúc 09:51:33Z** (sau đứt E1, balloon xả sâu nhất phiên 4.176.852 kB); mean 960.636 kB. Gate A ≥1024 MiB: **48/139 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ mười lăm liên tiếp.** Xem §2, §3.
- **B2: 3 spike load1 ≥3,0 — CẢ 3 QUY ĐƯỢC DRIVER CỤ THỂ.** Spike 1 (08:43:31Z, T1 suite render mask_anim.py, delta 98); spike 2 (10:14:38Z, T8 harness Chrome gpu-process, delta 99 — sampler cadence 60 s KHÔNG bắt được, watcher 30 s bắt được); spike 3 (10:31:59Z, apt-get replay boot #63, top tức thời 100,0%). **0 spike trong cửa sổ balloon ghim, 0 spike trong cửa sổ attempt T4, 0 spike trong lúc O8 chạy.** Delta tick lớn nhất 99 tick/s (chrome gpu-process). Xem §2.5.
- **Lượt yên WebKit #30 (T4): CÓ LƯỢT HỢP LỆ #26 — chuỗi lượt yên hợp lệ NỐI DÀI (#22 → #23 → #24 → #25 → #26).** Attempt1 (09:43:13–09:47:01Z) KHÔNG hợp lệ (lớp B vi phạm: B5 RAM min 437MB, 12/100 mẫu <500MB — sampler T9 đối chiếu: 1 mẫu 492.172 kB trong cửa sổ, gate A chỉ 2/4); attempt2 (09:47:01–09:50:52Z) HỢP LỆ (probe 20/20, lớp B 5/5, tickCost median 44,0 ms ≤60; sampler T9: gate A MỞ 4/4, 0 mẫu <512.000 kB, 0 spike B2). Xem §2.3.
- **REBOOT #63 GIỮA PHIÊN (94d22520, btime /proc/stat 1795257042 = 10:30:42Z):** giết sampler/b2-watcher/probe-loop của T9 (chạy trên #62); T9 khởi động lại cả hai lúc 10:31:59Z (boot+77 s) — gap sampler 85 s (10:30:34Z → 10:31:59Z), không gap >90 s. Sleep chờ của T9 bị SIGTERM theo reboot (không phải lỗi T9). **Cửa sổ thoáng headroom sau #63 KHÔNG được quan sát** (lần đo đầu trên #63 lúc boot+2m43s đã là 0 — xem F-161-T9-1). T7-161: #63 viết lại run 161 lần 1, requeue 10:31:19.128Z = btime+37,128 s — ứng viên điểm DƯƠNG (đầu tiên kể từ #60). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: ≥84 dòng trên HAI boot** — #62: **≥81 dòng** (số cuối đếm được 10:07:59Z; đuôi 10:08–10:30Z chưa đếm, journal mất theo reboot #63 — xem F-161-T9-5) + #63: **3 dòng** (dòng đầu 10:32:27Z — boot+1m45s; dòng cuối 10:34:33Z — không còn dòng mới trong 21 phút cuối phiên). **Đợt thứ mười liên tiếp bảng watch cạn gây lỗi thật thấy được.** Xem §4.
- **T8-161 (đối chiếu):** O8 PASS 3/3 (WebKit 21/21 ×2 + Chromium 21/21, 10:01:51–10:04:23Z, boot #62, gate FOUND poll 83 lúc 09:59:59Z); chuỗi WebKit FULL PASS 15 → ? chờ T10/parent phán. Xem §5.3.
- **T7-161 (đối chiếu): run 160 SUCCEEDED 08:03:36Z, margin 1.935 s** (rộng nhất từ đợt 150); 0 lần viết lại — run đầu tiên dứt chuỗi 4 run bị viết lại liên tiếp (156–159); **#62 là ứng viên điểm ÂM (1 run đang chạy tại btime, 0 requeue)**; **#63 là ứng viên điểm DƯƠNG**; n ứng viên GIỮ 18 (16 dương + 2 âm) hoặc 19. Xem §5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round161-t9/k8-headroom.py` (copy y nguyên từ đợt 160 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 161 (12 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 08:37:38Z 21/11 | **0** | #62 39d46ba0 (btime ghi 07:59:29Z) | lần đo 1, lúc mở (boot+38m09s ghi / ~+24m thật — xem F-161-T9-8); RAM trước đo 1.525.628 kB, balloon 4.871.308 kB, load1 ~1,4 |
| 08:37:39Z 21/11 | **0** | #62 39d46ba0 | lần đo 2 (chênh **0** so với lần 1) |
| 09:07:59Z 21/11 | **0** | #62 39d46ba0 | lần đo 3, giữa phiên; balloon đang ghim trần (E1), RAM 432.812 kB, load1 0,37 |
| 09:07:59Z 21/11 | **0** | #62 39d46ba0 | lần đo 4 (chênh **0** so với lần 3) |
| 09:37:59Z 21/11 | **0** | #62 39d46ba0 | lần đo 5, giữa phiên; balloon đang ghim trần (E1), RAM 481.312 kB |
| 09:37:59Z 21/11 | **0** | #62 39d46ba0 | lần đo 6 (chênh **0** so với lần 5) |
| 10:07:59Z 21/11 | **0** | #62 39d46ba0 | lần đo 7, giữa phiên; balloon đã xả (sau đứt E1), RAM 736.508 kB, balloon 5.612.852 kB |
| 10:07:59Z 21/11 | **0** | #62 39d46ba0 | lần đo 8 (chênh **0** so với lần 7) |
| 10:33:25Z 21/11 | **0** | #63 94d22520 (btime 10:30:42Z) | lần đo 9, trên boot MỚI (boot+2m43s); RAM trước đo 1.886.104 kB, balloon 5.060.000 kB — **không có cửa sổ thoáng** (xem F-161-T9-1) |
| 10:33:25Z 21/11 | **0** | #63 94d22520 | lần đo 10 (chênh **0** so với lần 9) |
| 10:55:51Z 21/11 | **2** | #63 94d22520 | lần đo 11 (đóng phiên, boot+25m09s); balloon đang ghim trần (E3), RAM 522.808 kB |
| 10:55:51Z 21/11 | **2** | #63 94d22520 | lần đo 12 (chênh **0** so với lần 11) |

- Probe dừng ở `i=0` trong 10/12 lần đo — `inotify_add_watch` đầu tiên trả errno 28 (không thêm được watch nào); dừng ở `i=2` trong 2 lần đo đóng — đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau lần đo 3/4, 5/6, 7/8, 9/10 và lúc đóng).
- **Từ 0 lên 2 cuối phiên (lần đo 10 → lần đo 11, trong khoảng 10:33:25–10:55:51Z, trên boot #63):** một holder ngoài cell đã nhả 2 watch trong ~22 phút cuối phiên; sau đó giá trị giữ nguyên 2 qua cặp đo đóng. T9 không biết holder nào nhả (ngoài cell, không nhìn thấy) — chỉ ghi số đo + thời gian. **2 không phải hồi phục** — vẫn thấp hơn ngưỡng 1.800 tới ~1.798 slot, và một vite mới cần ~1.578 watch. Cùng mẫu đợt 160 (0 → 2 trên boot #61) nhưng khác boot: đợt này 0 kéo dài 8 lần đo trên #62 rồi mới lên 2 trên #63.
- **Nghịch lý cần ghi rõ (F-161-T9-2, tiếp F-160-T9-2):** trên #63, headroom đã là 0 lúc 10:33:25Z nhưng dòng ENOSPC của systemd dừng hẳn sau 10:34:33Z (chỉ 3 dòng, rồi im 21 phút tới lúc đóng) trong khi headroom vẫn 0 cho tới ít nhất 10:33:25Z và chỉ lên 2 lúc 10:55:51Z — hoặc 2 slot được nhả ngay sau 10:34:33Z (sớm hơn lần đo đóng ~21 phút) và systemd thêm watch thành công từ đó, hoặc service đã ngừng thử sau 10:34:33Z. T9 không phán cơ chế; chỉ ghi hai dãy số đo độc lập. Trên #62 thì ngược lại: headroom 0 suốt 8 lần đo và ENOSPC chạy đều ~67–70 s/dòng tới lần đếm cuối 10:07:59Z — cùng kết luận "bảng gần như đầy hẳn".
- **So sánh với đợt 160:** đợt 160 mở 0 → ổn định 2 (8/10 lần đo 2, trên MỘT boot, không reboot giữa phiên); đợt này mở 0 → 0 kéo dài trên #62 (8 lần đo 0) → 0 rồi 2 trên #63 sau reboot giữa phiên (10/12 lần đo 0). **Cửa sổ thoáng sau reboot KHÔNG được quan sát lần thứ hai liên tiếp** — đợt 160 lỡ vì T9 mở muộn boot+13m47s; đợt này T9 mở lúc boot+38m (ghi) đối với #62 VÀ reboot #63 xảy ra giữa phiên nhưng lần đo đầu trên #63 cũng đã là boot+2m43s (quá muộn so với cửa sổ 1–3 phút theo mẫu đợt 159 — xem F-161-T9-1). Dòng ENOSPC đầu tiên trên #63 xuất hiện 10:32:27Z (boot+1m45s) — bảng đã đầy (hoặc gần đầy tới mức systemd lỗi) chậm nhất lúc đó.
- **So sánh với đợt 159:** đợt 159 thoáng 23.503/18.447 sau reboot #60 (boot+~95–100 s), về 0 lúc boot+148 s; đợt này lần đo sớm nhất sau reboot #63 là boot+163 s và đã là 0 — nếu cửa sổ thoáng tồn tại thì nó ngắn hơn 163 s hoặc không mở (xem F-161-T9-1).
- Số watch đang giữ ngoài cell suy ra lúc ổn định: 63.747 − 2 = **63.745 watch** (bảng gần đầy hẳn, chỉ 2 watch trống) lúc đóng.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **2 / 1.578 ≈ 0,0013** — một vite mới (~1.578 watch) vẫn không khởi động được (cần thêm ~1.576 slot).
- T5-161 KHÔNG probe lại headroom đợt này (như đợt 151–160) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 12 lần đo + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal hai boot có ≥84 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM lúc đóng (~522.808 kB, balloon đang ghim) thấp hơn nhiều RAM lúc mở (~1.525.628 kB) trong khi headroom 0 → 2. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–160 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

| 124 | 4.438 | mở đợt 124 |
| 124 | 4.318 | (giá trị giữa chuỗi, xem §5 đợt 127) |
| 125 | 3.645 | |
| 126 | 3.451 → 3.434 | mở → cuối đợt 126 |
| 127 | 3.334 → 3.324 | mở → trạng thái ban đầu |
| 127 | 3.317 → 3.315 | mở trên boot mới → cuối lượt |
| 128 | 3.212 | đo 05:40:28Z, boot #74 (lần 2: 3.211) |
| 129 | 3.086 → 3.079 | đo 08:39:03Z → 08:40:47Z, boot #75 |
| 130 | 2.974 → 2.963 | đo 11:37:45Z → 11:39:54Z, boot mới btime 10:56:31Z |
| 131 | 2.846 → 2.846 | đo 14:42:07Z → 14:44:42Z, boot mới btime 14:26:41Z |
| 132 | 2.745 → 2.738 | đo 17:40:47Z → 17:42:07Z, boot mới btime 17:24:08Z |
| 133 | 2.632 → 2.632 | đo 20:40:32Z → 20:42:53Z, boot 07da9c50 btime 19:34:15Z |
| 134 | 2.515 → 2.505 | đo 23:45:29Z → 23:48:01Z, boot d2e66749 btime 23:26:58Z |
| 135 | 2.403 → 2.395 | đo 02:40:57Z → 02:43:11Z, boot 78b55878 btime 02:27:27Z |
| 136 | 2.286 → 2.281 | đo 05:41:01Z → 05:43:14Z, boot 1ca1feaa btime 05:29:18Z |
| 137 | 2.179 → 2.175 | đo 08:41:12Z → 08:43:35Z, boot 2104246b btime 08:07:11Z |
| 138 | 2.064 → 2.064 | đo 11:39:22Z → 11:39:31Z, boot 17db9652 btime 09:36:01Z |
| 139 | 1.954 → 1.954 | đo 14:41:18Z → 14:41:29Z, boot 1ca1feaa btime 13:53:41Z (đính chính T1-139 F-139-T1-1) |
| 140 | 1.840 → 1.840 | đo 17:38:54Z → 17:38:59Z, boot af558fb5 btime 15:54:37Z (cùng boot với vòng 2 đợt 139) |
| 141 | 1.739 → 1.739 | đo 20:40:21Z → 20:40:29Z, boot 2c0efe57 btime 19:54:12Z |
| 142 | 1.617 → 1.617 | đo ~23:40Z → 23:41:20Z, boot bde599df btime 22:48:05Z |
| 143 | 1.498 → 1.498 | đo 02:40:53Z → 02:41:01Z, boot 70a5b0fc btime 01:55:25Z |
| 144 | 1.296 → 1.295 | đo 05:39:17Z → 05:39:26Z, boot 691a7403 btime 03:55:45Z |
| 145 | 1.074 → 1.074 | đo 08:42:53Z → 08:42:57Z, boot e146ca67 btime 07:56:16Z |
| 146 | 880 → 880 | đo 11:37:51Z → 11:37:52Z, boot 98a7c93f btime 09:54:03Z |
| 147 | 668 → 668 | đo 14:42:51Z, boot 6fb582df btime 12:13:26Z |
| 148 | 554 → 446 | mở 17:40:27Z boot d8a11644 btime 17:27:53Z → đóng 19:36:35Z boot MỚI 1d610e56 btime 19:34:32Z (reboot giữa phiên) |
| 149 | 438 → 339 → 331 | mở 20:41:27Z boot 70025d3e btime 20:00:33Z → sau reboot #39 21:26:10Z boot MỚI 802f358f btime 21:23:51Z → đóng 22:42:09Z cùng boot 802f358f |
| 150 | 323 → 308 | mở 23:43:42Z → đóng 01:19:57Z, CÙNG boot e9295700 btime 23:32:09Z (reboot #40 TRƯỚC phiên, không reboot giữa phiên) |
| 151 | 194 → 90 | mở 02:40:42Z boot 2e430750 btime 01:25:51Z → đóng 04:52:32Z boot MỚI fad2aab9 btime 03:25:16Z (reboot #42 GIỮA phiên) |
| 152 | 82 → 0 | mở 05:39:00Z boot 18e179e0 btime 05:20:57Z → đóng 07:42:43Z boot MỚI c741f5e6 btime 07:04:11Z (reboot #44 GIỮA phiên; lần đo xác nhận thứ ba 07:43:11Z cũng 0) |
| 153 | 0 → 0 | mở 08:38:02Z boot 401fca75 btime 07:32:38Z → đóng 10:47:35Z boot MỚI 1450ac80 btime 09:04:49Z (reboot #46 GIỮA phiên; lần đo xác nhận thứ ba 10:47:44Z cũng 0) |
| 154 | 0 → 0 | mở 11:37:41Z boot #48 2c0a7985 btime 11:26:05Z → đóng 13:41:4xZ boot MỚI #49 12fc68a3 btime 13:05:12Z (reboot #49 GIỮA phiên; lần đo xác nhận thứ ba cũng 0) |
| 155 | 0 → 0 | mở 14:40:42Z boot #49 12fc68a3 btime 13:05:12Z → đóng 16:32:50Z boot MỚI #50 d849728b btime 15:04:07Z (reboot #50 GIỮA phiên; lần đo xác nhận thứ ba cũng 0) |
| 156 | 0 → 2 | mở 17:40:07Z boot #52 5353ed19 btime 17:19:09Z → đóng 19:56:34Z boot MỚI #55 c99a1045 btime 19:04:44Z (BA reboot giữa phiên; 4 lần đo đóng đều 2) |
| 157 | 0 → 0 | mở 20:43:59Z boot #56 348dab54 btime 19:32:47Z → đóng 22:48:34Z boot MỚI #57 bcbaa3ad btime 21:05:15Z (MỘT reboot giữa phiên; 4 lần đo đóng đều 0) |
| 158 | 0 → 0 | mở 23:40Z boot #58 28366bd0 btime 23:06:08Z → giữa phiên 01:35Z boot MỚI #59 eec65561 btime 01:33:47Z → đóng 01:54:51Z cùng boot #59 (MỘT reboot giữa phiên; 6 lần đo đều 0) |
| 159 | 0 → 0 | mở 02:39:58Z boot #59 eec65561 btime 01:33:47Z → sau reboot #60 03:07:33Z boot MỚI e590ae0a btime 03:05:59Z: THOÁNG 23.503 rồi 18.447 (boot+~95–100 s), về 0 lúc 03:08:27Z (boot+148 s) → đóng 04:55:08Z cùng boot #60 (MỘT reboot giữa phiên; 10 lần đo, 8 lần 0) |
| 160 | 0 → 2 | mở 05:40:07Z boot #61 52c957d5 btime 05:25:49Z: 0, 0 → giữa phiên 06:10:37Z: 2, 2 → đóng 07:51:23Z cùng boot #61: 2, 2 (KHÔNG reboot giữa phiên; 10 lần đo, 8 lần 2) |
| **161** | **0 → 0 → 2** | **mở 08:37:38Z boot #62 39d46ba0 btime ghi 07:59:29Z: 0 ×8 (08:37:38–10:07:59Z) → sau reboot #63 10:30:42Z boot MỚI 94d22520: 0, 0 lúc boot+2m43s (10:33:25Z) → đóng 10:55:51Z cùng boot #63: 2, 2 (MỘT reboot giữa phiên; 12 lần đo, 10 lần 0, 2 lần 2)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 2 lần thứ ba (đợt 156: 2; đợt 160: 2; đợt 161: 2), xen giữa ba đợt 0 (157, 158, 159).** Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**. Giá trị 2 chỉ xuất hiện ở cặp đo đóng trên boot mới #63, sau 10 lần đo 0 liên tiếp — không phải hồi phục.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, thấp hơn ngưỡng 1.800, lần thứ hai mươi mốt liên tiếp.** Quyết parent đợt 158 (l) GIỮ quyết (g) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal HAI boot có ≥84 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ mười liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥84 dòng). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở 08:37:38Z, giữa phiên 09:07:59Z / 09:37:59Z / 10:07:59Z trên #62 và 10:33:25Z / 10:55:51Z trên #63 — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.745 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.048.572 kB) — sampler 139 mẫu, 08:37:31Z–10:56:00Z, HAI boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên trên boot #62 (T1 suite + T4 attempt, đỉnh 2.700.880 kB sau đứt E1) → ghim trần E1 (27 mẫu) → xả sâu → leo lại → ghim E2 (3 mẫu, cắt bởi reboot #63) → boot mới #63 RAM cao đầu boot → ghim E3 (9 mẫu, còn mở lúc đóng)

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất 85 s — chính là gap reboot #63, 10:30:34Z → 10:31:59Z; 4 gap 61 s do trễ 1 s; không gap >90 s** — xem §5.1). **139 mẫu, 08:37:31Z–10:56:00Z, HAI boot (#62: 114 mẫu; #63: 25 mẫu).** Tổng quan: **min 417.016 kB (407,2 MiB) lúc 09:07:32Z** (mẫu ghim E1); **max 2.700.880 kB (2.637,6 MiB) lúc 09:51:33Z — 42,93% guard** (sau đứt E1, balloon xả sâu nhất phiên 4.176.852 kB); **mean 960.636 kB (938,1 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 08:37:31–09:04:32Z | #62 | 1.025.728–2.626.156 kB | Mở phiên: T1 suite 28/28 (08:41:46–08:48:09Z, đúng cửa sổ B2 spike 1) + T4 attempt1/2 lượt yên #30 (09:43–09:50Z — xem §2.3, nằm trong giai đoạn sau); balloon leo đều 4.185.264 → 6.443.824 kB; gate A MỞ 36/40 mẫu tiền-ghim (trừ 4 mẫu cuối trước khi ghim); load1 tới 3,11 (sampler) |
| 09:05:32–09:41:32Z | #62 | 417.016–1.014.408 kB | **Ghim trần E1, 27 mẫu trong 3 chuỗi + 2 dip** (xem §2.2); **RAM min phiên 09:07:32Z (417.016 kB)**; gate A ĐÓNG cả 37 mẫu cửa sổ (kể cả 10 mẫu dip); load1 ≤1,17 (yên hoàn toàn về tải); **RAM <512.000 kB: 33 mẫu — tất cả trong cửa sổ này** (đợt 160: 37 mẫu <512.000 kB) |
| 09:42:32–10:27:34Z | #62 | 492.172–2.700.880 kB | **Đứt E1 quan sát được 09:42:32Z** (balloon xả về 5.854.000 kB, RAM hồi 1.018.352 kB); xả sâu nhất 09:51:33Z (balloon 4.176.852 kB, **đỉnh RAM phiên 2.700.880 kB**); T4 attempt1 (09:43:13–09:47:01Z, KHÔNG hợp lệ — B5) + attempt2 (09:47:01–09:50:52Z, HỢP LỆ #26) + O8 (10:01:51–10:04:23Z) + harness (spike B2 10:14:38Z); balloon leo lại đều 4,6M → 6,4M kB; gate A MỞ 39/48 mẫu ngoài ghim |
| 10:28:34–10:30:34Z | #62 | 429.284–538.756 kB | **Ghim E2, 3 mẫu** (chuỗi 4) — **CÒN MỞ lúc reboot #63 (10:30:42Z)**; điểm đứt KHÔNG quan sát được |
| 10:31:59–10:44:00Z | #63 | 522.396–1.958.348 kB | Boot mới: SwapFree nhảy lên 1.005.580 kB (xả swap sau reboot, cùng mẫu các đợt có reboot); RAM cao đầu boot (1.820.848 kB lúc 10:31:59Z, đỉnh boot 1.958.348 kB lúc 10:34:59Z = 31,13% guard); load1 3,35 lúc 10:31:59Z (boot storm + apt-get replay — spike B2 3); balloon leo đều 5.018.836 → 6.443.824 kB; gate A MỞ 9/13 mẫu tiền-ghim |
| 10:45:00–10:56:00Z | #63 | 522.396–692.668 kB | **Ghim trần E3, 9 mẫu trong 2 chuỗi + 1 dip nông 97,8%** (xem §2.2) — **CÒN MỞ lúc T9 đóng**; gate A ĐÓNG cả 12 mẫu cửa sổ; load1 ≤0,60 |

- **Gate A ≥1024 MiB: 48/139 mẫu** (39/114 trên #62 + 9/25 trên #63); **0 mẫu ≥ guard**; load1 max (sampler) **3,35 lúc 10:31:59Z** (boot #63, trùng spike B2 3 — watcher bắt 3,35, sampler bắt 3,35 cùng mốc); **3/139 mẫu load1 ≥3,0** (08:43:31Z 3,00; 08:44:31Z 3,11; 10:31:59Z 3,35 — spike B2 2 lúc 10:14:38Z load1 3,07 sampler KHÔNG bắt được do cadence 60 s, xem F-161-T9-6). **RAM <512.000 kB: 33 mẫu** (tất cả trên #62, tất cả trong cửa sổ E1/E2 ghim hoặc attempt1); **RAM <300.000 kB: 0 mẫu** (đợt 158: 4 mẫu <300.000 kB).
- Swap: #62 SwapFree 878.580 kB (mẫu đầu) → 575.448 kB (thấp nhất phiên 10:14:33Z) → 597.492 kB (mẫu cuối #62); #63 SwapFree 1.005.580 kB (mẫu đầu sau reboot) → 662.948 kB (thấp nhất boot 10:52:00Z) → 665.628 kB (mẫu cuối). SwapFree nhảy lên ~1.005.580 kB ngay sau reboot #63 rồi rơi dần — cùng mẫu các đợt có reboot giữa phiên (đợt 160 không reboot nên không có nhịp này).
- Mẫu 09:51:33Z (đỉnh phiên): RAM 2.700.880 kB, balloon xả 4.176.852 kB — balloon xả sâu nhất phiên ~9 phút sau đứt E1 (cùng mẫu đợt 152–160: xả sâu sau attempt / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 417.016 kB (đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — 33 mẫu <512.000 kB trong 139 mẫu (23,7%); riêng trong cửa sổ E1: 33/37 mẫu <512.000 kB (89%). T8-161 đo độc lập RAM trong lúc O8/harness: xem §5.3 (sampler T9 là nguồn duy nhất cho trũng ghim).

### 2.2 Balloon virtio — GHIM TRẦN 3 EPISODE MỚI, 39/139 mẫu, 6 chuỗi, HAI boot (#62 + #63)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #62 (39d46ba0): GHIM TRẦN 30/114 mẫu (26,3%), trong 4 chuỗi — 2 EPISODE:**
  - **E1 — chuỗi 1: 09:05:32–09:09:32Z, 5 mẫu** (span 240 s); leo đều lên trần từ 08:38:31Z (balloon 4.185.264 kB → 6.443.824 kB trong ~27 phút).
  - **Dip nông A: 09:10:32–09:13:32Z, 4 mẫu** — balloon 6.050.608 kB (93,9% trần) lúc 09:10:32Z là điểm thấp nhất, rồi leo lại 95,7% / 97,3% / 98,8%; RAM trong dip tối đa 882.380 kB, **gate A KHÔNG mở lần nào**.
  - **E1 — chuỗi 2: 09:14:32–09:25:32Z, 12 mẫu** (span 660 s, 11 phút).
  - **Dip B: 09:26:32–09:31:32Z, 6 mẫu** — balloon 5.854.000 kB (**90,8% trần**) lúc 09:26:32Z là điểm thấp nhất, rồi leo lại 92,9% / 94,7% / 96,4% / 97,9% / 99,3%; RAM trong dip tối đa 1.014.408 kB, **gate A KHÔNG mở lần nào** (thiếu 34.168 kB mới tới ngưỡng — sát nhất trong các dip của đợt).
  - **E1 — chuỗi 3: 09:32:32–09:41:32Z, 10 mẫu** (span 540 s, 9 phút).
  - **Đứt QUAN SÁT ĐƯỢC 09:42:32Z** (balloon xả về 5.854.000 kB = 90,8% trần, RAM hồi 1.018.352 kB), rồi xả tiếp tới 4.176.852 kB lúc 09:51:33Z (RAM đỉnh phiên 2.700.880 kB).
  - **E2 — chuỗi 4: 10:28:34–10:30:34Z, 3 mẫu** (span 120 s); leo lại lên trần từ 09:51:33Z (balloon 4.176.852 kB → 6.443.824 kB trong ~37 phút). **CÒN MỞ lúc reboot #63 (10:30:42Z, 8 s sau mẫu cuối)** — điểm đứt KHÔNG quan sát được.
- **Boot #63 (94d22520): GHIM TRẦN 9/25 mẫu (36,0%), trong 2 chuỗi — 1 EPISODE:**
  - **E3 — chuỗi 5: 10:45:00Z, 1 mẫu**; leo lên trần từ 10:31:59Z (balloon 5.048.468 kB → 6.443.824 kB trong ~13 phút).
  - **Dip nông C: 10:46:00–10:48:00Z, 3 mẫu** — balloon 6.299.440 kB (97,8% trần) lúc 10:47:00Z là điểm thấp nhất, rồi leo lại 99,3% / 100%; RAM trong dip tối đa 692.668 kB, **gate A KHÔNG mở lần nào**.
  - **E3 — chuỗi 6: 10:49:00–10:56:00Z, 8 mẫu** (span 420 s, 7 phút) — **CÒN MỞ lúc T9 đóng** (mẫu cuối 10:56:00Z vẫn ghim; T9 dừng sampler lúc đóng — diễn biến sau đó thuộc T10/T9-162 nếu có).
- **Tổng ghim trần đợt này: 39/139 mẫu (28,1%)** (đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **3 episode, 2 boot; 2/3 episode còn mở lúc kết thúc quan sát (E2 cắt bởi reboot, E3 cắt bởi đóng phiên)** — khác đợt 160 (1 episode duy nhất, điểm đứt quan sát được).
- **Phán theo quy tắc quyết (e)/(g) (T9 phán, giao T10 xác nhận cách đếm):**
  - **E1 (chuỗi 1+2+3): 1 EPISODE.** Ba chuỗi cùng boot, cách nhau bởi dip A (93,9%) và dip B (90,8%) — gate A đóng suốt cả hai dip; mỗi dip chỉ 4–6 mẫu. Theo quy tắc (g) đợt 152 + tiền lệ đợt 157 (dip 94,4% không tách), đợt 158 (dip 94,5%/97,4% không tách), đợt 159 (dip 94,5%/94,4% không tách — quyết parent (k) đợt 159 §12.3 đã CHẤP NHẬN), đợt 160 (dip 93,9%/94,3%/94,5%/97,0% không tách — T10-160 XÁC NHẬN), dip A (93,9%) nằm đúng trong dải tiền lệ. **Dip B (90,8%) là điểm khác biệt duy nhất: sâu hơn mọi dip tiền lệ 3,1 điểm phần trăm và dài hơn (6 mẫu thay vì 3–4 mẫu)** — xem F-161-T9-7. T9 vẫn đếm E1 là 1 episode (gate A đóng suốt dip là tiêu chí cứng theo tiền lệ; RAM trong dip B tối đa 1.014.408 kB, vẫn dưới ngưỡng gate A) nhưng ghi rõ để T10 phán.
  - **E2 (chuỗi 4): 1 EPISODE, MỚI, không nối E1:** giữa đứt E1 (09:42:32Z) và lần chạm đầu E2 (10:28:34Z) có **xả sâu tới 4.176.852 kB = 64,8% trần + ~46 phút không ghim + RAM đỉnh phiên 2.700.880 kB**. E2 còn mở lúc reboot #63 — điểm đứt không quan sát được (cùng mẫu chuỗi 4 đợt 159).
  - **E3 (chuỗi 5+6): 1 EPISODE, MỚI, không nối E2:** giữa lần ghim cuối E2 (10:30:34Z, boot #62) và lần chạm đầu E3 (10:45:00Z, boot #63) có **reboot #63 + balloon xả về 5.018.836 kB (77,9% trần) lúc 10:34:59Z + ~14 phút không ghim**. Dip C (97,8%, 3 mẫu) nông, gate A đóng — không tách theo tiền lệ.
  - **Đợt 161 = 3 EPISODE GHIM MỚI** (39 mẫu / 6 chuỗi / 2 boot) — **đợt đầu tiên kể từ đợt 155 có 3 episode** (đợt 156, 157, 158, 159 đều 2 episode; đợt 160 chỉ 1 episode).
  - **Nếu T10/parent phán dip B là xả (đủ tách episode) thì đợt 161 = 4 episode** (E1 tách thành 2: chuỗi 1+2 và chuỗi 3); **nếu tách cả dip A lẫn dip B thì đợt 161 = 5 episode** (mỗi chuỗi riêng, E2/E3 giữ nguyên) — T9 ghi rõ để T10 phán, không giấu điểm khác biệt (xem F-161-T9-7).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~417–570.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ E1 09:41:32Z: tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 497.524 kB.

### 2.3 Lượt yên WebKit #30 (T4, đợt 161) — CÓ LƯỢT HỢP LỆ #26, CHUỖI NỐI DÀI (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-161 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND161_T4_WEBKIT_QUIET30_LIMITS.md`) + cờ `round161-t4.done` (09:59Z) — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Attempt1-39d46ba0 (09:43:13–09:47:01Z): probe 20/20, tickCost median 41,0 ms ≤60 (n=641), (c2)=5/5 COVERED — NHƯNG LỚP B VI PHẠM (B5: RAM min 437MB, 12/100 mẫu <500MB) — attempt KHÔNG hợp lệ, KHÔNG cộng dồn.**
- **Attempt2-39d46ba0 (09:47:01–09:50:52Z): probe 20/20, LỚP B ĐẠT 5/5, tickCost median 44,0 ms ≤60 (n=636, p90 70, max 117, min 28), (c2)=3/3 COVERED, seq (c2) 262, 322, 367 (lag +1f tất cả, 0 âm), lag≥+5f 0, 0 PAGE-WEDGED — HỢP LỆ.**
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): CÓ 1 attempt hợp lệ cho lượt yên #30 (#26)** — chuỗi lượt yên hợp lệ **NỐI DÀI lên #26** (#22 đợt 157 → #23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1: gate A MỞ **2/4 mẫu** trong cửa sổ (09:43:32Z 784.396 kB — ĐÓNG; 09:44:32Z 492.172 kB — ĐÓNG, **<512.000 kB**; 09:45:33Z 1.402.024 kB — MỞ; 09:46:33Z 1.201.544 kB — MỞ). Mẫu 09:44:32Z (492.172 kB = 480,6 MiB) corroborate độc lập vi phạm B5 của T4 (RAM min 437MB theo poller T4 — sampler cadence thưa hơn nên bắt được min cao hơn, cùng hướng).
  - Attempt2: gate A MỞ **4/4 mẫu** trong cửa sổ (09:47:33Z 1.303.080 kB; 09:48:33Z 1.482.444 kB; 09:49:33Z 1.414.004 kB; 09:50:33Z 1.079.632 kB — cả 4 đều ≥1024 MiB).
  - Tải: sampler load1 trong cửa sổ attempt2 **0,56–1,97**; **0 spike B2 trong cả hai cửa sổ attempt** (xem §2.5).
  - RAM <512.000 kB: sampler T9 **1 mẫu <512.000 kB trong cửa sổ attempt1** (09:44:32Z) và **0 mẫu trong cửa sổ attempt2**.
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy attempt1 09:43:13–09:47:01Z và attempt2 09:47:01–09:50:52Z trên boot #62.

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 09:43:32–09:46:33Z | #62 | 0,44–2,38 (4 mẫu) | 492.172–1.402.024 kB — **gate A MỞ 2/4** | T4 attempt1 — 0 spike B2 trong cửa sổ; attempt1 KHÔNG hợp lệ (lớp B vi phạm B5) |
| 09:47:33–09:50:33Z | #62 | 0,56–1,97 (4 mẫu) | 1.079.632–1.482.444 kB — **gate A MỞ 4/4** | T4 attempt2 — 0 spike B2 trong cửa sổ; attempt2 HỢP LỆ (tickCost median 44,0 ms ≤60) |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 3 spike, CẢ 3 QUY ĐƯỢC DRIVER CỤ THỂ (0 spike trong cửa sổ balloon ghim, 0 spike trong cửa sổ attempt T4, 0 spike trong lúc O8 chạy)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-161-T9-3). **3 spike, rải rác 08:43:31Z, 10:14:38Z, 10:31:59Z; 0 spike trong cửa sổ ghim E1 (09:05:32–09:41:32Z), 0 spike trong cửa sổ ghim E2 (10:28:34–10:30:34Z), 0 spike trong cửa sổ ghim E3 (10:45:00–10:56:00Z), 0 spike trong cửa sổ attempt T4 (09:43:13–09:50:52Z), 0 spike trong lúc O8 chạy (10:01:51–10:04:23Z), 0 spike trong lúc harness chạy (sampler 0/18 mẫu load1 ≥3,0 trong 10:05–10:23Z; watcher bắt 1 spike 10:14:38Z — xem F-161-T9-6).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — T1 suite render | 08:43:31Z | **3,00** | 1 | python3 `server/render/src/mask_anim.py` delta **98** + node `server/render/src/render.js` delta 0 (top tức thời cùng snapshot) | **T1 verify suite render** (test_round93_u4_failfast_measure.js chạy 08:41:46–08:48:09Z, boot #62 — T1-161 xác nhận) |
| 2 — T8 harness 85m4 | 10:14:38Z | **3,07** | 1 | chrome gpu-process (Playwright Chromium) delta **99** + chrome renderer delta **36** + vite (node vite m4.config) delta 0; top tức thời gpu-process 80,7% tích lũy; script `clicktest-85m4-webkit-w7-hb128.mjs` đang chạy trong snapshot | **T8 harness 85m4** (O8 DONE 10:04:23Z; harness chạy sau O8 — T8-161 sở hữu) |
| 3 — tải boot apt-get replay | 10:31:59Z | **3,35** | 1 | apt-get (os-intent replay, install enchant-2) top tức thời **100,0%**, tích lũy 88,4%; delta tick KHÔNG bắt được apt-get (chết trước vòng delta — xem F-161-T9-4) | **Tải boot #63 (T5 replay)** — apt-get chạy 17 s sau btime #63 (10:30:42Z); cùng mẫu đợt 160 (apt-get/dpkg boot gây spike) |

- **Tổng kết đếm: 3/3 spike có driver process cụ thể** (T1 render ×1 + T8 harness Chrome ×1 + apt-get boot replay ×1) **+ 0 spike lớp "load1 dư"** (đợt 160: 13/15 quy được + 2 load1 dư — đợt này sạch hơn vì ít spike và spike nào cũng có process sống đủ lâu để bắt delta/top).
- **Caveat đếm (F-161-T9-3):** chuỗi `ps -eo pid` xuất hiện 1 lần trong b2-spikes.log — đó là **dòng lệnh của chính lệnh exec T9 (pid 2240, lệnh khởi động lại sampler sau reboot #63) bị snapshot của spike 3 bắt được**, KHÔNG phải `ps` của watcher; **0 dòng delta-tick nào nhắc tới lệnh đó; 0 dòng nào nhắc `ps -eo pid,ppid`** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `grep -c '^=== SPIKE'` = **3**.
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log với vai trò driver** — F-150-T9-8 VẪN ĐÓNG.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution (spike 3: apt-get top 100,0% dù chết trước delta). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 3 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 3/3 spike — không có spike lớp load1 dư đợt này.
- **Delta tick lớn nhất đợt: 99 tick/s** (chrome gpu-process, spike 10:14:38Z); python3 mask_anim.py 98 tick/s; chrome renderer 36 tick/s; daemon 1–10 tick/s. (Đợt 160: max 124 tick/s.)
- **Khoảng mù watcher đầu phiên (F-161-T9-4 mở rộng):** watcher B2 khởi động ~08:37:31Z cùng sampler (sau đợt mở ~2 phút — lần khởi động đầu OK, không lỗi đường dẫn như đợt 160); sampler đã ghi load1 1,38 lúc 08:37:31Z và 2,03 lúc 08:38:31Z — **không có spike nào trước spike 1 (08:43:31Z) theo cả hai nguồn** (sampler 0 mẫu load1 ≥3,0 trước 08:43:31Z). Sau đó watcher chạy liên tục tới khi chết theo reboot #63 (10:30:42Z), rồi T9 khởi động lại 10:31:59Z (bắt được spike 3 ngay mẫu đầu) — **gap phủ sóng watcher 10:30:42–10:31:59Z (~77 s)**, trùng gap sampler (xem F-161-T9-2).
- **O8/harness chạy nhẹ đợt này:** O8 10:01:51–10:04:23Z (WebKit 21/21 ×2 + Chromium 21/21) gây **0 spike B2** (sampler load1 trong cửa sổ O8 chỉ 0,82–1,53; 2 mẫu trong cửa sổ: RAM 756.952–1.398.544 kB, gate A 1/2); harness gây **1 spike B2** (10:14:38Z, chrome gpu-process — xem trên; sampler 0 mẫu load1 ≥3,0 trong cửa sổ harness 10:05–10:23Z do cadence 60 s — xem F-161-T9-6) — khác đợt 160 (O8 + harness đều 0 spike); đợt này harness gây 1 spike, O8 vẫn 0 spike.

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **0 spike nào nhắc ffmpeg** (khác đợt 160: ffmpeg trong 8/15 spike) — spike 1 là python3 mask_anim.py + node render.js (test render trong suite verify của T1, chạy đúng chức năng, thoát bình thường). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T8 harness + tải boot apt-get; không process lạ; **0 nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log** — spike 2 là Chrome Playwright của harness, không phải WebKit).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN TRỪ GAP REBOOT 85 s; CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ mười lăm liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148–160 giữ nguyên; quyết parent (n) đợt 158 GIỮ NGUYÊN cơ chế (a) armed): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **2.700.880 kB = 2.637,6 MiB = 42,93% guard lúc 09:51:33Z** — chưa tới một nửa đường tới guard (xa guard 3.590.576 kB). Đỉnh đợt này thấp hơn đợt 160 (47,16% guard) và đợt 159 (51,12% guard).
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ mười lăm liên tiếp (147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161).** Cơ chế tự động armed cả phiên (sampler `round161-t9/sampler.sh`, pid 3971 rồi pid 2250 sau reboot, chạy 08:37:31Z–10:56:00Z, 139 mẫu — **gap duy nhất 85 s do reboot #63, 10:30:34Z → 10:31:59Z; không gap >90 s**) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→161 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**, **3.211**, **2.779**, **3.477**, **2.612**, **2.250**, **3.216**, **2.967**, **2.701**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 08:37:31Z–10:56:00Z trừ gap reboot 85 s (139 mẫu, 0 gap >90 s); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 160 nằm trong dir round160-t9 nên không chặn đợt này (dir mới round161-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-161-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-161-birefnet/out-birefnet-161.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147–160):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-161-T9-10); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-161-T9-10 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra — đợt này T4 có 1 attempt hợp lệ nhưng cửa sổ guard không mở nên điểm (c) không phát sinh). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này ở mức nhẹ: reboot #63 giết sampler 77 s (10:30:42–10:31:59Z), gap mẫu 85 s** — nhưng RAM hai đầu gap (538.756 kB trước, 1.820.848 kB sau) đều xa guard 6.291.456 kB nên không có cửa sổ guard nào lọt qua gap một cách hợp lý; T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10.
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên (trừ gap reboot 85 s nêu trên).

## 4. ENOSPC / vite watch

- **Phương pháp đếm (ghi rõ):** `journalctl --no-pager | grep -c 'No space left on device'` trên boot đang chạy tại thời điểm đếm; journald chỉ giữ 1 boot (volatile) nên **số cuối của một boot KHÔNG kiểm được sau khi reboot sang boot mới** (cùng giới hạn F-155-T10-1 / F-154-T1-3). Mỗi boot dưới đây ghi rõ: số đếm được lần cuối + thời điểm đếm + ai đếm. **Tổng phiên là CẬN DƯỚI (≥), không phải số đếm đầy đủ.**
- **Journal trên boot #62 (39d46ba0): ≥81 dòng** — T9 đếm 2 lúc 08:37:39Z → 28 lúc 09:07:59Z → 54 lúc 09:37:59Z → **81 lúc 10:07:59Z** (dòng đầu 08:36:27Z — boot+36m58s ghi / ~+23m thật; dòng cuối đếm được 10:07:57Z). Cadence ~67–70 s/dòng (26 dòng/30m20s, rồi 26 dòng/30m, rồi 27 dòng/30m — đều đặn cả phiên). T5-161 đếm độc lập **26 dòng lúc 09:05:40Z** — khớp số T9 (28 lúc 09:07:59Z, +2 trong 2m19s ≈ 70 s/dòng). **Đuôi 10:07:59Z → reboot 10:30:42Z (~22m43s, kỳ vọng ~19–20 dòng theo cadence) CHƯA ĐẾM** — journal mất theo reboot #63, T9 KHÔNG cộng số ước vào tổng; xem F-161-T9-5. 81 là số đếm được lần cuối, không phải số cuối thật của boot.
- **Journal trên boot #63 (94d22520): 3 dòng lúc đóng** (T9 đếm 1 lúc 10:33:25Z → 3 lúc 10:55:51Z; dòng đầu 10:32:27Z — boot+1m45s; dòng cuối 10:34:33Z). Cadence ~63 s/dòng (3 dòng / 126 s từ dòng đầu 10:32:27Z tới dòng cuối 10:34:33Z). **Không còn dòng mới trong 21 phút cuối phiên** (10:34:33Z → 10:55:51Z) — T9 kiểm lại lúc đóng, vẫn 3 dòng. Boot này còn sống lúc T9 đóng nên 3 là số đếm tới thời điểm đóng (có thể tăng sau khi T9 đóng — T10 kiểm lại nếu cần).
- **Tổng phiên: ≥84 dòng trên HAI boot** (≥81 + 3 — mỗi boot là cận dưới tại thời điểm đếm cuối). Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. **Đây là đợt thứ mười liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng — ít hơn vì journal của 3 boot cũ mất theo 3 reboot; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng — ít hơn vì journal boot #58 mất theo reboot #59 sau khi chỉ đếm tới 34; đợt 159: ≥134 dòng — cao nhất kể từ đợt 155; đợt 160: ≥110 dòng; đợt 161: ≥84 dòng).
- **Điểm mới đáng ghi (không phán cơ chế):** dòng ENOSPC đầu tiên xuất hiện ở các mốc rất khác nhau giữa ba boot gần nhất — #61: boot+11m03s; #62: boot+36m58s (ghi); #63: boot+1m45s. Tốc độ bảng đầy sau boot không ổn định giữa các boot. Cùng lúc, trên #63 dòng ENOSPC dừng hẳn sau 10:34:33Z trong khi headroom chỉ lên 2 lúc 10:55:51Z (xem F-161-T9-2). T9 ghi đúng mốc thời gian, không claim quan hệ nhân quả.
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số. (Trong phiên này có reboot nên steal của #63 chỉ là số của boot mới — T9 không đo steal đợt này; giao T5/T7 nếu cần.)
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=0 ×10 lần + i=2 ×2 lần — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo); **(2) ≥84 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2 — **không thêm được watch nào đáng kể cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Reboot #62 TRƯỚC phiên + reboot #63 GIỮA phiên; T9 mở muộn, lỡ cả hai cửa sổ thoáng

- **Boot lúc mở đợt 161 = 39d46ba0** (btime **ghi 07:59:29Z** theo `/proc/stat` — KHỚP T0-161 xác minh 7 nguồn + T5-161 5 nguồn; **btime THẬT ~08:13:30Z theo T0-161 §2.4 (H2 — đồng hồ ghi chậm ~841 s)** — xem F-161-T9-8; **reboot #62 xảy ra TRƯỚC phiên, sau T10-160 đóng, trước đợt 161 mở 08:35:51Z**).
- **T9 mở muộn so với boot #62:** T9 khởi động sampler 08:37:31Z (boot+38m02s ghi / ~+24m thật), lần đo headroom đầu 08:37:38Z (boot+38m09s ghi) — **cửa sổ thoáng headroom 1–3 phút sau boot (theo mẫu đợt 159) đã qua trước khi T9 mở** (xem F-161-T9-1). Ngay cả đợt mở 08:35:51Z cũng đã là boot+36m22s ghi. Dòng ENOSPC đầu trên #62 (08:36:27Z, boot+36m58s ghi) là mốc sớm nhất T9 có cho thấy bảng đã đầy.
- **Reboot #63 GIỮA PHIÊN: boot mới 94d22520, btime /proc/stat 1795257042 = 10:30:42Z** (T7-161 gọi đây là giờ thật; T9 lấy đúng giá trị /proc/stat theo quyết (e) đợt 158). Sampler mẫu cuối #62 10:30:34Z (8 s trước btime); T9 khởi động lại sampler + watcher 10:31:59Z (boot+77 s); mẫu đầu #63 10:31:59Z. **Gap sampler 85 s (10:30:34Z → 10:31:59Z); không gap >90 s.** Sleep chờ của T9 (proc_331dd8f0ee02) bị SIGTERM theo reboot — giải thích việc mất liên lạc giữa phiên, không phải lỗi T9 (xem F-161-T9-2).
- **Cửa sổ thoáng sau #63 KHÔNG được quan sát:** lần đo headroom đầu trên #63 lúc 10:33:25Z (boot+2m43s) đã là 0, 0 — nếu cửa sổ thoáng tồn tại thì nó ngắn hơn 163 s (mẫu đợt 159: thoáng tới boot+~100 s, về 0 lúc boot+148 s). T9 khởi động lại sampler lúc boot+77 s nhưng lần đo headroom đầu tiên chỉ kịp lúc boot+163 s (xem F-161-T9-1). Dòng ENOSPC đầu trên #63 (10:32:27Z, boot+1m45s) là mốc sớm nhất cho thấy bảng đã đầy.
- **Số hiệu #62/#63: T9 tự xác nhận theo đếm tuần tự** (#61 đã xác nhận đợt 160, quyết (s) đợt 158; #62 là boot mới duy nhất sau #61 trong phiên; #63 là boot mới duy nhất sau #62 — btime 10:30:42Z; T0-161 + T2-161 + T5-161 + T7-161 xác minh độc lập #62; T7-161 xác minh #63) — **giao T2-161/T10-161 chốt chính thức**.
- Các cờ .done lúc T9 đóng (~11:00Z): t0, t1, t2, t4, t5, t6, t7, t8 (8/8 — t9 đóng ngay sau khi viết LIMITS này, thành 9/9; t10 chưa đóng lúc T9 đóng).

### 5.2 T5-161 — POSTBOOT_PASS cho #62 ĐÃ CÓ; #63 CHƯA CÓ; watcher-161 chết theo #63 (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **POSTBOOT_PASS cho boot #62 ĐÃ CÓ (T5-161, 08:59:30Z giờ ghi; boot+60m01s ghi / boot+46m00s thật; mode repair-som-quyet-h, poll=1)** — replay tự nhiên KHÔNG BAO GIỜ chạy trên #62 (dạng (B), dpkg 2 dòng rồi im, 0 proc apt/dpkg, /var/log/apt không tồn tại); EARLY-REPAIR (h) kích hoạt 08:46:02Z (frozen 621 s, verify form-B exit=1); apt-get update ~12 phút + install ~10 giây; dpkg 2 → 795 dòng; GST symlink → debroot (269 file); cache 110 .deb, lists 66. Kiểm chứng độc lập: postboot exit 0 lúc 09:05:28Z, 11/11 gói + 5/5 lib.
- **POSTBOOT_PASS cho boot #63: CHƯA CÓ** (T7-161 ghi rõ; T5-162 sở hữu).
- **Watcher-160 pid 4539 CHẾT theo #62** (log dừng 08:13:13Z, 304 poll, 0 NEWBOOT, 0 END — T0/T5 THỐNG NHẤT); **watcher-161 pid 19861 CHẠY bằng tay** (START 08:40:01Z, END 11:30:00Z, poll đều 30 s) **rồi CHẾT theo #63** (T7-161: poll cuối 10:30:39Z).
- **POSTBOOT_PASS cho boot #60: KHÔNG CÓ, không bù được** (boot thứ 6 lọt: #51, #53, #54, #55, #57, #60 — T5-161 ghi rõ).
- **Marker `~/.config/vcut-persistence-marker` sống qua 14 reboot** (#49–#62, T5-161).
- **Nghịch lý đồng hồ #62 (T0/T5, chờ T10 phán):** H1 (đồng hồ cũ nhanh ≥+824 s) BỊ BÁC — T7-160 neo Cloudflare 07:47:25Z thật + T5 kiểm lại 304 poll watcher-160 đều 30/31 s (max 31 s) → đồng hồ cũ ĐÚNG lúc chết, poll cuối 08:13:13Z là GIỜ THẬT; T0 + T5 CHẤP NHẬN H2 (btime ghi chậm ~841 s, khoảng +824–+854 s); cơ chế slew dần chưa rõ, giao T2-161. T7-161 .done gọi btime #62 (07:59:29Z) là "giờ thật" — khác cách gọi H2 của T0/T5 (xem F-161-T9-8).
- Tải apt-get trong B2 đợt này (§2.5, spike 3) chính là replay của T5 trên boot #63 (install enchant-2, 17 s sau btime) — corroborate bằng cửa sổ thời gian + chuỗi lệnh replay trong snapshot.

### 5.3 T8-161 — O8 PASS 3/3 + harness (T9 chỉ ghi lại để đối chiếu)

- **O8: WebKit 21/21 ×2 (10:01:51 pid53182 md5 de0fab90 + 10:02:42 pid53577 md5 01578e91) + Chromium 21/21 (10:03:31 pid53905 md5 fb9763f0), toàn bộ PASS exit 0** (O8 DONE 10:04:23Z, 2'32", boot #62) — qua **gate FOUND poll 83 lúc 09:59:59Z** (t4=OK + POSTBOOT_PASS đường (a) của T5 08:59:30Z); lượt yên #30 có lượt hợp lệ #26 (attempt2 20/20, B 5/5, tickCost median 44,0 ms, boot #62). Chuỗi WebKit FULL PASS 15 → ? CHỜ T10/parent phán (T8 KHÔNG tự chốt).
- **Đối chiếu sampler T9 (độc lập):** O8 gây **0 spike B2** (sampler load1 trong cửa sổ O8 0,82–1,53; gate A 1/2 mẫu); harness gây **1 spike B2** (10:14:38Z, chrome gpu-process delta 99 — sampler cadence 60 s không bắt được, xem F-161-T9-6) — khác đợt 160 (cả O8 lẫn harness đều 0 spike).
- **0 REBOOT trong lúc T8 đo** (T8 đóng ~10:23Z, trước #63 10:30:42Z).

### 5.4 T7-161 — run 160 SUCCEEDED + #62/#63 điểm (m) (T7-161 đã xuất bản LIMITS — T9 chỉ ghi lại để đối chiếu)

- **Run 160: SUCCEEDED 08:03:36Z** (eid 9668), wall gốc **8.865 s**, margin **1.935 s** tới hạn 08:35:51Z (rộng nhất từ đợt 150, vượt run 151: 1.828 s đúng 107 s); claimed→finished 7 s (trở lại họ 7–11 s sau run 159: 66 s); **0 lần viết lại** — run đầu tiên dứt chuỗi 4 run bị viết lại liên tiếp (156–159).
- **Reboot #62: OVERLAP 824–854 s** — boot cũ 52c957d5 sống tới thật ~08:13:13Z (poller log liên tục 30 s/cadence, 0 NEWBOOT; T2 khớp T7, bác cả H1/H2 theo nghĩa cũ); **1 run (160) đang chạy tại btime, 0 requeue — ỨNG VIÊN ĐIỂM ÂM** (T7 lean CHẤP NHẬN, đợi tự nhập độc #1; đồng ý T2-161; parent quyết).
- **Reboot #63 GIỮA PHIÊN: viết lại run 161 lần 1, requeue 10:31:19.128Z = btime +37,128 s — ĐIỂM DƯƠNG ỨNG VIÊN** (đầu tiên kể từ #60; dải GIỮ 33–49,8 s).
- **#56 VẪN CÓ ĐIỀU KIỆN** (T2-161 không thu hẹp được cửa lần thứ tư: R 2,56251–2,66817 / J 2,566–2,80753 s); điều tra (m) VẪN ĐÓNG; n (m) chính thức GIỮ 14 (ứng viên 18/19 gồm #60 — chờ parent quyết; **#62 ÂM → 19/20, #63 DƯƠNG → 19/20, cả hai → 20/21** nếu parent chấp nhận).
- **Slot: HB 6/6** (1 muộn +888 s — muộn thứ 9 lũy kế, phá chuỗi 8 đợt vàng muộn; 5 chuẩn −316 s), **DR 3/3** (0 s), 0 thiếu; lũy kế HB 44/357, DR 49/249. Run 161 jitter 0 s (lần thứ 14 liên tiếp), 1 lần viết lại tại #63, vẫn running lúc T7 đóng cờ (tuổi gốc 7.808 s, còn 2.992 s tới hạn 11:35:51Z) — **kết cục thuộc T7-162**.
- **Mù #93? ĐÓNG, #94? (#62) SƠ BỘ MỞ giao T2-162, #88?/#77? VẪN MỞ** (T7-161).

### 5.5 Các luồng khác đợt 161 (T9 chỉ ghi lại để đối chiếu)

- **T0-161: REBOOT MỚI ỨNG VIÊN #62** — boot 39d46ba0, btime GHI 07:59:29Z (7 nguồn khớp); nghịch lý đồng hồ #62 (btime ghi không phải giờ thật — bằng chứng DB host-side: run 160 SUCCEEDED 08:03:36.487Z; giờ thật ước tính ~08:13:30Z, offset +841 s); T0 chọn H2; watcher-160 chết 08:13:13Z; O8 JSON đợt 160 CÒN ĐÚNG (WebKit pid42049 e1bbe8ef + pid42436 fa9d8013 + Chromium pid42835 fd0f7c37, 21/21 ×3).
- **T1-161: VERIFY 160 PASS** — đếm script viết mới hoàn toàn (count-final-161-t1.py): đợt 160 = 10/13/13; lũy kế 111–160 = 488/911/779; chờ push 136–160 = 240/333/283 — KHỚP từng số, lần thứ 51 liên tiếp; suite chạy lại 28/28 exit 0 (08:41:46–08:48:09Z, boot #62 — đúng cửa sổ B2 spike 1 của T9); O8 xác nhận độc lập (chuỗi FULL PASS LÊN 15 theo quyết (g) đợt 160).
- **T2-161: ĐÓNG ~09:01Z** — LIMITS `docs/PHASE9_ROUND161_T2_EPERM_LIMITS.md` (65.244 byte, oversize); stage phase9-round161-t2-eperm.txt (1 entry NUL, od-verified).
- **T6-161: (A) 120/120 PASS dưới churn lần thứ 11 liên tiếp** (tổng 1320/1320); suite 9/9 ×6, rc=0; chuỗi xanh kép 10 → 11, chuỗi suite xanh 42 → 43; lock khỏe (491 cặp ACQUIRED→RELEASED, 0 đang giữ, 0 TIMEOUT mới); double-acquire GIỮ 11, STALE-LOCK GIỮ 11 (0 ca mới); reboot #62 KHÔNG giết holder (lock trống 1h28m01s trước btime); prune lần 36 (queue 101/1414 → 100/1400). T6 đóng 08:48Z — trước reboot #63 nên "không reboot trong phiên" của T6 chỉ đúng tới lúc đó.
- **T4-161:** xem §2.3 (lượt yên #30 CÓ lượt hợp lệ #26).

## 6. Sai số F-161-T9-* (trung thực — liệt kê đầy đủ)

- **F-161-T9-1 — Cửa sổ thoáng headroom sau reboot KHÔNG được quan sát (lần thứ hai liên tiếp, lần này lỡ cả hai boot).** (a) Boot #62: T9 mở lúc boot+38m09s ghi (~+24m thật) — đợt mở 08:35:51Z cũng đã là boot+36m22s ghi; cửa sổ 1–3 phút sau boot đã qua từ lâu. (b) Boot #63 (reboot giữa phiên 10:30:42Z): T9 khởi động lại sampler lúc boot+77 s nhưng lần đo headroom đầu tiên chỉ kịp lúc boot+2m43s (10:33:25Z) và đã là 0, 0 — nếu cửa sổ thoáng tồn tại thì nó ngắn hơn 163 s (mẫu đợt 159: thoáng tới boot+~100 s, về 0 lúc boot+148 s). T9 không claim có hay không có cửa sổ thoáng đợt này; chỉ ghi lần đo sớm nhất đã là 0. Giao T9-162 mở sớm hơn nếu muốn bắt cửa sổ (cần đo trong 60–150 s sau boot).
- **F-161-T9-2 — Sampler + b2-watcher + probe-loop CHẾT theo reboot #63; gap phủ sóng 85 s; nghịch lý ENOSPC/headroom trên #63.** Sampler mẫu cuối #62 10:30:34Z; reboot 10:30:42Z; T9 khởi động lại sampler (pid 2250) + watcher (pid 2251) lúc 10:31:59Z (boot+77 s) — gap mẫu 85 s (10:30:34Z → 10:31:59Z), không gap >90 s; sleep chờ của T9 bị SIGTERM theo reboot. Probe-loop 4 lần của T9 đã chạy xong trước reboot (lần cuối 10:07:59Z) nên không mất lần đo nào do reboot — lần đo trên #63 (10:33:25Z, 10:55:51Z) do T9 chạy tay. Nghịch lý: trên #63, ENOSPC dừng hẳn sau 10:34:33Z trong khi headroom chỉ lên 2 lúc 10:55:51Z (xem §1.2) — T9 không phán cơ chế.
- **F-161-T9-3 — Chuỗi `ps -eo pid` xuất hiện 1 lần trong b2-spikes.log (không phải ps của watcher).** Đó là dòng lệnh của chính lệnh exec T9 (pid 2240 — lệnh khởi động lại sampler sau reboot #63) bị snapshot của spike 3 bắt được trong top12. Lệnh `ps` của chính watcher xuất hiện 0 lần với vai trò driver (fix (n) đợt 150 VẪN ĐÓNG). Attribution không bị che (delta tick + top tức thời).
- **F-161-T9-4 — Delta tick của spike B2 3 KHÔNG bắt được apt-get (driver chính).** apt-get (pid 2237, top tức thời 100,0%, tích lũy 88,4%) chết trước vòng delta 1 s nên không có dòng delta; attribution dựa vào top tức thời + %CPU tích lũy trong cùng snapshot. Cùng giới hạn phương pháp đã biết (process ngắn hạn), T9 ghi rõ thay vì gộp chung.
- **F-161-T9-5 — Đuôi ENOSPC boot #62 CHƯA ĐẾM (~19–20 dòng kỳ vọng).** Số cuối đếm được 81 lúc 10:07:59Z; khoảng 10:07:59Z → reboot 10:30:42Z (~22m43s, cadence ~67–70 s/dòng) chưa đếm vì journal mất theo reboot #63. Tổng phiên ≥84 là CẬN DƯỚI; T9 KHÔNG cộng số ước vào tổng.
- **F-161-T9-6 — Sampler cadence 60 s KHÔNG bắt được spike B2 2 (10:14:38Z, load1 3,07).** Watcher cadence 30 s bắt được (chrome gpu-process delta 99). Trong cửa sổ harness 10:05–10:23Z sampler có 0/18 mẫu load1 ≥3,0 — số 0 này là giới hạn cadence, không phải bằng chứng không có spike. T9 ghi rõ để T10 không dùng sampler làm bằng chứng phủ định spike.
- **F-161-T9-7 — Dip B trong E1 sâu 90,8% (6 mẫu) — sâu hơn mọi dip tiền lệ; cách đếm episode phụ thuộc T10.** Tiền lệ không tách: dip tới 93,9% (đợt 160), 94,4% (đợt 157), 94,5% (đợt 158/159). Dip B đợt này: 90,8% (5.854.000 kB), dài 6 mẫu, RAM trong dip tối đa 1.014.408 kB (gate A đóng, thiếu 34.168 kB). T9 đếm E1 = 1 episode (tiêu chí cứng: gate A đóng suốt dip) → đợt = 3 episode; nếu T10 tách dip B → 4 episode; tách cả dip A (93,9%) + dip B → 5 episode. T9 trình cả ba cách đếm, không giấu điểm khác biệt.
- **F-161-T9-8 — Nghịch lý đồng hồ #62: T9 không phán, ghi cả hai cách gọi.** T0-161 + T5-161 (sau kiểm chứng) CHẤP NHẬN H2: btime #62 ghi 07:59:29Z chậm ~841 s so với giờ thật ~08:13:30Z (khoảng +824–+854 s), chờ T10 phán. T7-161 .done gọi btime #62 (07:59:29Z) là "giờ thật" — khác cách gọi H2 của T0/T5 (có thể chỉ là cách viết tắt cho giá trị /proc/stat). **Mọi timestamp của T9-161 đều là giờ ghi (recorded clock)** — btime T9 dùng là giá trị /proc/stat theo quyết (e) đợt 158; tuổi boot trong LIMITS này tính theo giờ ghi, trừ khi ghi rõ "thật". Kết luận cửa sổ thoáng (F-161-T9-1) đứng dưới cả hai cách đọc (T9 mở 24–38 phút sau boot). Giao T10 phán H1/H2 và cách gọi thống nhất.
- **F-161-T9-9 — Lệnh dừng sampler lúc đóng tự SIGTERM chính nó (pkill -f khớp command line của exec).** Lúc đóng, `pkill -f 'round161-t9/sampler.sh'` khớp luôn command line của chính lệnh exec đang chạy nên lệnh đó bị SIGTERM giữa chừng — nhưng sampler (pid 2250) đã bị kill trước đó trong cùng lệnh pkill, và watcher (pid 2251) được kill riêng ngay sau bằng pid. Dataset đóng đúng ở mẫu cuối 10:56:00Z, không mất số liệu; chỉ là sự cố thao tác, T9 ghi rõ để lần sau kill bằng pid thay vì pkill -f.
- **F-161-T9-10 — Giới hạn đứng của cơ chế birefnet (giữ nguyên từ đợt 147–160).** (a) Vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy; (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log); (c) cửa sổ mở đúng lúc T4 attempt sẽ gây tải trong cửa sổ đo (đợt này không phát sinh); (d) reboot giết sampler — tái diễn nhẹ đợt này (gap 85 s, xem §3) nhưng RAM hai đầu gap đều xa guard nên không lọt cửa sổ một cách hợp lý.

## 7. Cam kết

- KHÔNG PUSH lên GitHub trong phiên này (không chạy push-files, không ghi qua GitHub connector). Chỉ stage batch tại `~/workspace/repo-1-push/paths-loop/phase9-round161-t9-headroom.txt` (1 entry, NUL-delimited, od-verified — xem dưới).
- KHÔNG release, KHÔNG tạo tag release.
- KHÔNG code giả, mock, placeholder mạo nhận hoàn thành. Mọi claim trong LIMITS này đều có số đo thật trích từ log gốc (`hidden_files/round161-t9/ram-sampler-FROZEN.log`, `b2-spikes-FROZEN.log`, `headroom-log.txt`) hoặc từ LIMITS/.done đã xuất bản của T0/T1/T2/T4/T5/T6/T7/T8 (trích đúng, ghi rõ nguồn).
- KHÔNG làm tính năng cloud/collab, AI avatar/video-gen model đóng, nhạc có bản quyền. Không sửa production, không chạy TTS 39.

## 8. Stage

- File paths NUL-delimited: `~/workspace/repo-1-push/paths-loop/phase9-round161-t9-headroom.txt` — 1 entry: `docs/PHASE9_ROUND161_T9_HEADROOM_LIMITS.md` (file text duy nhất đợt này; script + log nằm trong `hidden_files/` của goal, không đưa vào batch; không binary).
- Verify: `od -c` thấy đúng 1 NUL cuối entry; `wc -c` file LIMITS (ghi trong .done).
## Phụ lục A — Bảng sampler đầy đủ (139 mau: 114 mau boot 39d46ba0 + 25 mau boot 94d22520; khong gap >90 s)

(File gốc: `hidden_files/round161-t9/ram-sampler-FROZEN.log` (argv: /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round161-t9/ram-sampler-FROZEN.log) — bảng dưới đây trích đúng file đó.)

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-21T08:37:31Z | 39d46ba0 | 1,556,124 | 1519.7 | 24.73% | 5,264,524 | 878,580 | 1.38 |
| 2 | 2026-11-21T08:38:31Z | 39d46ba0 | 2,626,156 | 2564.6 | 41.74% | 4,185,264 | 780,356 | 2.03 |
| 3 | 2026-11-21T08:39:31Z | 39d46ba0 | 2,359,884 | 2304.6 | 37.51% | 4,469,180 | 784,252 | 1.03 |
| 4 | 2026-11-21T08:40:31Z | 39d46ba0 | 2,109,864 | 2060.4 | 33.54% | 4,725,188 | 798,344 | 0.52 |
| 5 | 2026-11-21T08:41:31Z | 39d46ba0 | 1,889,960 | 1845.7 | 30.04% | 4,959,768 | 792,120 | 0.44 |
| 6 | 2026-11-21T08:42:31Z | 39d46ba0 | 1,900,948 | 1856.4 | 30.21% | 4,889,432 | 770,256 | 1.21 |
| 7 | 2026-11-21T08:43:31Z | 39d46ba0 | 1,665,748 | 1626.7 | 26.48% | 5,089,428 | 771,160 | 3.00 |
| 8 | 2026-11-21T08:44:31Z | 39d46ba0 | 1,479,644 | 1445.0 | 23.52% | 5,267,908 | 771,404 | 3.11 |
| 9 | 2026-11-21T08:45:31Z | 39d46ba0 | 1,575,392 | 1538.5 | 25.04% | 5,138,604 | 772,812 | 2.50 |
| 10 | 2026-11-21T08:46:31Z | 39d46ba0 | 1,350,880 | 1319.2 | 21.47% | 5,315,640 | 765,028 | 2.05 |
| 11 | 2026-11-21T08:47:31Z | 39d46ba0 | 1,025,728 | 1001.7 | 16.30% | 5,479,224 | 730,116 | 0.82 |
| 12 | 2026-11-21T08:48:31Z | 39d46ba0 | 1,203,840 | 1175.6 | 19.13% | 5,634,004 | 737,388 | 1.03 |
| 13 | 2026-11-21T08:49:31Z | 39d46ba0 | 1,281,868 | 1251.8 | 20.37% | 5,543,248 | 721,356 | 1.55 |
| 14 | 2026-11-21T08:50:31Z | 39d46ba0 | 1,092,352 | 1066.8 | 17.36% | 5,700,516 | 709,728 | 1.60 |
| 15 | 2026-11-21T08:51:31Z | 39d46ba0 | 989,656 | 966.5 | 15.73% | 5,836,488 | 721,940 | 1.29 |
| 16 | 2026-11-21T08:52:31Z | 39d46ba0 | 854,736 | 834.7 | 13.59% | 5,962,724 | 706,484 | 1.05 |
| 17 | 2026-11-21T08:53:31Z | 39d46ba0 | 1,024,048 | 1000.0 | 16.28% | 5,845,688 | 661,792 | 1.50 |
| 18 | 2026-11-21T08:54:32Z | 39d46ba0 | 1,782,396 | 1740.6 | 28.33% | 5,059,256 | 657,044 | 1.56 |
| 19 | 2026-11-21T08:55:32Z | 39d46ba0 | 1,560,108 | 1523.5 | 24.80% | 5,260,864 | 657,464 | 0.74 |
| 20 | 2026-11-21T08:56:32Z | 39d46ba0 | 1,386,688 | 1354.2 | 22.04% | 5,442,936 | 656,360 | 0.56 |
| 21 | 2026-11-21T08:57:32Z | 39d46ba0 | 1,214,228 | 1185.8 | 19.30% | 5,609,164 | 660,176 | 0.50 |
| 22 | 2026-11-21T08:58:32Z | 39d46ba0 | 1,067,092 | 1042.1 | 16.96% | 5,759,936 | 648,772 | 0.18 |
| 23 | 2026-11-21T08:59:32Z | 39d46ba0 | 904,564 | 883.4 | 14.38% | 5,896,416 | 646,360 | 0.33 |
| 24 | 2026-11-21T09:00:32Z | 39d46ba0 | 864,228 | 844.0 | 13.74% | 6,021,304 | 655,816 | 0.35 |
| 25 | 2026-11-21T09:01:32Z | 39d46ba0 | 743,124 | 725.7 | 11.81% | 6,133,716 | 660,348 | 0.32 |
| 26 | 2026-11-21T09:02:32Z | 39d46ba0 | 610,524 | 596.2 | 9.70% | 6,237,440 | 660,344 | 0.41 |
| 27 | 2026-11-21T09:03:32Z | 39d46ba0 | 528,588 | 516.2 | 8.40% | 6,330,480 | 662,748 | 0.32 |
| 28 | 2026-11-21T09:04:32Z | 39d46ba0 | 424,624 | 414.7 | 6.75% | 6,412,496 | 658,592 | 0.58 |
| 29 | 2026-11-21T09:05:32Z | 39d46ba0 | 423,592 | 413.7 | 6.73% | 6,443,824 | 659,252 | 0.21 |
| 30 | 2026-11-21T09:06:32Z | 39d46ba0 | 448,400 | 437.9 | 7.13% | 6,443,824 | 648,036 | 0.70 |
| 31 | 2026-11-21T09:07:32Z | 39d46ba0 | 417,016 | 407.2 | 6.63% | 6,443,824 | 651,080 | 0.37 |
| 32 | 2026-11-21T09:08:32Z | 39d46ba0 | 438,452 | 428.2 | 6.97% | 6,443,824 | 650,828 | 0.35 |
| 33 | 2026-11-21T09:09:32Z | 39d46ba0 | 436,960 | 426.7 | 6.95% | 6,443,824 | 647,972 | 0.72 |
| 34 | 2026-11-21T09:10:32Z | 39d46ba0 | 882,380 | 861.7 | 14.03% | 6,050,608 | 617,500 | 1.06 |
| 35 | 2026-11-21T09:11:32Z | 39d46ba0 | 778,948 | 760.7 | 12.38% | 6,165,864 | 614,400 | 0.57 |
| 36 | 2026-11-21T09:12:32Z | 39d46ba0 | 644,184 | 629.1 | 10.24% | 6,269,564 | 614,604 | 0.21 |
| 37 | 2026-11-21T09:13:32Z | 39d46ba0 | 539,704 | 527.1 | 8.58% | 6,364,372 | 614,532 | 0.15 |
| 38 | 2026-11-21T09:14:32Z | 39d46ba0 | 472,608 | 461.5 | 7.51% | 6,443,824 | 614,300 | 0.05 |
| 39 | 2026-11-21T09:15:32Z | 39d46ba0 | 473,480 | 462.4 | 7.53% | 6,443,824 | 614,460 | 0.23 |
| 40 | 2026-11-21T09:16:32Z | 39d46ba0 | 461,060 | 450.3 | 7.33% | 6,443,824 | 617,336 | 0.16 |
| 41 | 2026-11-21T09:17:32Z | 39d46ba0 | 434,848 | 424.7 | 6.91% | 6,443,824 | 621,636 | 0.06 |
| 42 | 2026-11-21T09:18:32Z | 39d46ba0 | 449,016 | 438.5 | 7.14% | 6,443,824 | 621,712 | 0.17 |
| 43 | 2026-11-21T09:19:32Z | 39d46ba0 | 445,500 | 435.1 | 7.08% | 6,443,824 | 621,544 | 0.12 |
| 44 | 2026-11-21T09:20:32Z | 39d46ba0 | 453,500 | 442.9 | 7.21% | 6,443,824 | 622,232 | 0.04 |
| 45 | 2026-11-21T09:21:32Z | 39d46ba0 | 485,120 | 473.8 | 7.71% | 6,443,824 | 622,096 | 0.12 |
| 46 | 2026-11-21T09:22:32Z | 39d46ba0 | 457,480 | 446.8 | 7.27% | 6,443,824 | 619,372 | 0.04 |
| 47 | 2026-11-21T09:23:32Z | 39d46ba0 | 466,300 | 455.4 | 7.41% | 6,443,824 | 618,248 | 0.01 |
| 48 | 2026-11-21T09:24:32Z | 39d46ba0 | 459,160 | 448.4 | 7.30% | 6,443,824 | 618,308 | 0.14 |
| 49 | 2026-11-21T09:25:32Z | 39d46ba0 | 471,948 | 460.9 | 7.50% | 6,443,824 | 619,332 | 0.45 |
| 50 | 2026-11-21T09:26:32Z | 39d46ba0 | 1,014,408 | 990.6 | 16.12% | 5,854,000 | 608,856 | 1.05 |
| 51 | 2026-11-21T09:27:32Z | 39d46ba0 | 922,224 | 900.6 | 14.66% | 5,986,572 | 609,608 | 0.53 |
| 52 | 2026-11-21T09:28:32Z | 39d46ba0 | 835,728 | 816.1 | 13.28% | 6,107,360 | 609,340 | 0.25 |
| 53 | 2026-11-21T09:29:32Z | 39d46ba0 | 705,924 | 689.4 | 11.22% | 6,214,400 | 610,908 | 0.53 |
| 54 | 2026-11-21T09:30:32Z | 39d46ba0 | 591,572 | 577.7 | 9.40% | 6,312,112 | 612,564 | 0.19 |
| 55 | 2026-11-21T09:31:32Z | 39d46ba0 | 510,056 | 498.1 | 8.11% | 6,401,328 | 613,600 | 0.23 |
| 56 | 2026-11-21T09:32:32Z | 39d46ba0 | 462,744 | 451.9 | 7.36% | 6,443,824 | 610,392 | 0.15 |
| 57 | 2026-11-21T09:33:32Z | 39d46ba0 | 447,536 | 437.0 | 7.11% | 6,443,824 | 611,204 | 0.05 |
| 58 | 2026-11-21T09:34:32Z | 39d46ba0 | 443,660 | 433.3 | 7.05% | 6,443,824 | 614,528 | 0.05 |
| 59 | 2026-11-21T09:35:32Z | 39d46ba0 | 447,588 | 437.1 | 7.11% | 6,443,824 | 616,308 | 0.25 |
| 60 | 2026-11-21T09:36:32Z | 39d46ba0 | 500,336 | 488.6 | 7.95% | 6,443,824 | 728,264 | 0.16 |
| 61 | 2026-11-21T09:37:32Z | 39d46ba0 | 484,256 | 472.9 | 7.70% | 6,443,824 | 728,536 | 0.12 |
| 62 | 2026-11-21T09:38:32Z | 39d46ba0 | 494,176 | 482.6 | 7.85% | 6,443,824 | 728,764 | 0.14 |
| 63 | 2026-11-21T09:39:32Z | 39d46ba0 | 482,608 | 471.3 | 7.67% | 6,443,824 | 730,632 | 0.05 |
| 64 | 2026-11-21T09:40:32Z | 39d46ba0 | 489,088 | 477.6 | 7.77% | 6,443,824 | 751,756 | 0.08 |
| 65 | 2026-11-21T09:41:32Z | 39d46ba0 | 497,524 | 485.9 | 7.91% | 6,443,824 | 751,928 | 0.27 |
| 66 | 2026-11-21T09:42:32Z | 39d46ba0 | 1,018,352 | 994.5 | 16.19% | 5,854,000 | 709,436 | 1.10 |
| 67 | 2026-11-21T09:43:32Z | 39d46ba0 | 784,396 | 766.0 | 12.47% | 5,395,248 | 639,636 | 1.17 |
| 68 | 2026-11-21T09:44:32Z | 39d46ba0 | 492,172 | 480.6 | 7.82% | 5,458,600 | 654,532 | 2.38 |
| 69 | 2026-11-21T09:45:33Z | 39d46ba0 | 1,402,024 | 1369.2 | 22.28% | 5,276,460 | 633,908 | 0.91 |
| 70 | 2026-11-21T09:46:33Z | 39d46ba0 | 1,201,544 | 1173.4 | 19.10% | 5,442,108 | 641,180 | 0.44 |
| 71 | 2026-11-21T09:47:33Z | 39d46ba0 | 1,303,080 | 1272.5 | 20.71% | 4,772,456 | 642,768 | 0.60 |
| 72 | 2026-11-21T09:48:33Z | 39d46ba0 | 1,482,444 | 1447.7 | 23.56% | 4,872,084 | 638,100 | 1.97 |
| 73 | 2026-11-21T09:49:33Z | 39d46ba0 | 1,414,004 | 1380.9 | 22.47% | 5,051,116 | 644,628 | 1.01 |
| 74 | 2026-11-21T09:50:33Z | 39d46ba0 | 1,079,632 | 1054.3 | 17.16% | 5,225,428 | 645,884 | 0.56 |
| 75 | 2026-11-21T09:51:33Z | 39d46ba0 | 2,700,880 | 2637.6 | 42.93% | 4,176,852 | 644,076 | 0.58 |
| 76 | 2026-11-21T09:52:33Z | 39d46ba0 | 2,407,944 | 2351.5 | 38.27% | 4,465,356 | 644,860 | 0.36 |
| 77 | 2026-11-21T09:53:33Z | 39d46ba0 | 2,149,600 | 2099.2 | 34.17% | 4,727,516 | 644,956 | 0.21 |
| 78 | 2026-11-21T09:54:33Z | 39d46ba0 | 1,843,280 | 1800.1 | 29.30% | 4,960,828 | 648,572 | 0.66 |
| 79 | 2026-11-21T09:55:33Z | 39d46ba0 | 1,623,132 | 1585.1 | 25.80% | 5,172,312 | 649,396 | 0.32 |
| 80 | 2026-11-21T09:56:33Z | 39d46ba0 | 1,470,952 | 1436.5 | 23.38% | 5,363,444 | 650,032 | 0.75 |
| 81 | 2026-11-21T09:57:33Z | 39d46ba0 | 1,308,156 | 1277.5 | 20.79% | 5,536,052 | 650,164 | 0.33 |
| 82 | 2026-11-21T09:58:33Z | 39d46ba0 | 1,198,664 | 1170.6 | 19.05% | 5,694,560 | 648,416 | 0.88 |
| 83 | 2026-11-21T09:59:33Z | 39d46ba0 | 1,232,952 | 1204.1 | 19.60% | 5,599,096 | 640,816 | 0.63 |
| 84 | 2026-11-21T10:00:33Z | 39d46ba0 | 1,097,204 | 1071.5 | 17.44% | 5,744,972 | 644,480 | 0.40 |
| 85 | 2026-11-21T10:01:33Z | 39d46ba0 | 999,088 | 975.7 | 15.88% | 5,885,836 | 641,484 | 0.33 |
| 86 | 2026-11-21T10:02:33Z | 39d46ba0 | 756,952 | 739.2 | 12.03% | 5,307,236 | 586,000 | 1.53 |
| 87 | 2026-11-21T10:03:33Z | 39d46ba0 | 1,398,544 | 1365.8 | 22.23% | 5,437,832 | 589,612 | 0.82 |
| 88 | 2026-11-21T10:04:33Z | 39d46ba0 | 1,445,520 | 1411.6 | 22.98% | 5,443,464 | 588,660 | 0.99 |
| 89 | 2026-11-21T10:05:33Z | 39d46ba0 | 772,100 | 754.0 | 12.27% | 5,447,260 | 593,588 | 1.38 |
| 90 | 2026-11-21T10:06:33Z | 39d46ba0 | 755,096 | 737.4 | 12.00% | 5,472,648 | 589,664 | 1.56 |
| 91 | 2026-11-21T10:07:33Z | 39d46ba0 | 664,596 | 649.0 | 10.56% | 5,579,008 | 596,496 | 2.10 |
| 92 | 2026-11-21T10:08:33Z | 39d46ba0 | 943,848 | 921.7 | 15.00% | 5,701,700 | 596,800 | 1.69 |
| 93 | 2026-11-21T10:09:33Z | 39d46ba0 | 706,308 | 689.8 | 11.23% | 5,542,016 | 592,196 | 1.73 |
| 94 | 2026-11-21T10:10:33Z | 39d46ba0 | 692,164 | 675.9 | 11.00% | 5,644,780 | 593,160 | 1.83 |
| 95 | 2026-11-21T10:11:33Z | 39d46ba0 | 636,044 | 621.1 | 10.11% | 5,748,596 | 594,012 | 0.97 |
| 96 | 2026-11-21T10:12:33Z | 39d46ba0 | 1,046,284 | 1021.8 | 16.63% | 5,844,864 | 593,772 | 0.41 |
| 97 | 2026-11-21T10:13:33Z | 39d46ba0 | 626,352 | 611.7 | 9.96% | 5,431,568 | 577,992 | 1.57 |
| 98 | 2026-11-21T10:14:33Z | 39d46ba0 | 826,876 | 807.5 | 13.14% | 5,329,040 | 575,448 | 2.47 |
| 99 | 2026-11-21T10:15:33Z | 39d46ba0 | 1,004,396 | 980.9 | 15.96% | 4,976,708 | 579,996 | 2.32 |
| 100 | 2026-11-21T10:16:33Z | 39d46ba0 | 1,119,412 | 1093.2 | 17.79% | 5,088,444 | 581,328 | 1.99 |
| 101 | 2026-11-21T10:17:33Z | 39d46ba0 | 836,892 | 817.3 | 13.30% | 5,182,844 | 582,892 | 2.10 |
| 102 | 2026-11-21T10:18:33Z | 39d46ba0 | 852,816 | 832.8 | 13.56% | 5,320,584 | 582,608 | 1.20 |
| 103 | 2026-11-21T10:19:34Z | 39d46ba0 | 694,528 | 678.2 | 11.04% | 5,459,204 | 587,084 | 0.67 |
| 104 | 2026-11-21T10:20:34Z | 39d46ba0 | 1,266,680 | 1237.0 | 20.13% | 5,584,176 | 588,756 | 0.51 |
| 105 | 2026-11-21T10:21:34Z | 39d46ba0 | 1,135,072 | 1108.5 | 18.04% | 5,737,728 | 590,308 | 0.35 |
| 106 | 2026-11-21T10:22:34Z | 39d46ba0 | 985,396 | 962.3 | 15.66% | 5,879,124 | 590,652 | 0.12 |
| 107 | 2026-11-21T10:23:34Z | 39d46ba0 | 868,756 | 848.4 | 13.81% | 6,005,176 | 593,680 | 0.12 |
| 108 | 2026-11-21T10:24:34Z | 39d46ba0 | 756,188 | 738.5 | 12.02% | 6,122,700 | 627,168 | 0.04 |
| 109 | 2026-11-21T10:25:34Z | 39d46ba0 | 653,604 | 638.3 | 10.39% | 6,231,768 | 627,592 | 0.01 |
| 110 | 2026-11-21T10:26:34Z | 39d46ba0 | 568,204 | 554.9 | 9.03% | 6,332,488 | 625,344 | 0.08 |
| 111 | 2026-11-21T10:27:34Z | 39d46ba0 | 454,792 | 444.1 | 7.23% | 6,423,288 | 625,024 | 0.08 |
| 112 | 2026-11-21T10:28:34Z | 39d46ba0 | 435,340 | 425.1 | 6.92% | 6,443,824 | 623,924 | 0.06 |
| 113 | 2026-11-21T10:29:34Z | 39d46ba0 | 429,284 | 419.2 | 6.82% | 6,443,824 | 622,308 | 0.02 |
| 114 | 2026-11-21T10:30:34Z | 39d46ba0 | 538,756 | 526.1 | 8.56% | 6,443,824 | 597,492 | 0.61 |
| — | — | — | — | — | — | — | — | — |
| 115 | 2026-11-21T10:31:59Z | 94d22520 | 1,820,848 | 1778.2 | 28.94% | 5,048,468 | 1,005,580 | 3.35 |
| 116 | 2026-11-21T10:32:59Z | 94d22520 | 1,659,996 | 1621.1 | 26.38% | 5,256,608 | 910,036 | 2.27 |
| 117 | 2026-11-21T10:33:59Z | 94d22520 | 1,792,936 | 1750.9 | 28.50% | 5,128,880 | 804,272 | 2.41 |
| 118 | 2026-11-21T10:34:59Z | 94d22520 | 1,958,348 | 1912.4 | 31.13% | 5,018,836 | 776,684 | 1.25 |
| 119 | 2026-11-21T10:35:59Z | 94d22520 | 1,751,068 | 1710.0 | 27.83% | 5,234,440 | 777,660 | 0.46 |
| 120 | 2026-11-21T10:36:59Z | 94d22520 | 1,548,716 | 1512.4 | 24.62% | 5,431,420 | 778,048 | 0.17 |
| 121 | 2026-11-21T10:37:59Z | 94d22520 | 1,384,912 | 1352.5 | 22.01% | 5,609,320 | 777,504 | 0.12 |
| 122 | 2026-11-21T10:38:59Z | 94d22520 | 1,249,948 | 1220.7 | 19.87% | 5,771,004 | 765,696 | 0.04 |
| 123 | 2026-11-21T10:39:59Z | 94d22520 | 1,083,312 | 1057.9 | 17.22% | 5,917,480 | 762,828 | 0.01 |
| 124 | 2026-11-21T10:40:59Z | 94d22520 | 933,196 | 911.3 | 14.83% | 6,051,484 | 762,744 | 0.15 |
| 125 | 2026-11-21T10:41:59Z | 94d22520 | 834,488 | 814.9 | 13.26% | 6,174,012 | 755,892 | 0.33 |
| 126 | 2026-11-21T10:42:59Z | 94d22520 | 723,696 | 706.7 | 11.50% | 6,284,696 | 753,416 | 0.12 |
| 127 | 2026-11-21T10:44:00Z | 94d22520 | 623,436 | 608.8 | 9.91% | 6,383,788 | 748,944 | 0.04 |
| 128 | 2026-11-21T10:45:00Z | 94d22520 | 522,396 | 510.2 | 8.30% | 6,443,824 | 734,196 | 0.01 |
| 129 | 2026-11-21T10:46:00Z | 94d22520 | 557,200 | 544.1 | 8.86% | 6,430,512 | 709,992 | 0.05 |
| 130 | 2026-11-21T10:47:00Z | 94d22520 | 692,668 | 676.4 | 11.01% | 6,299,440 | 711,548 | 0.10 |
| 131 | 2026-11-21T10:48:00Z | 94d22520 | 631,460 | 616.7 | 10.04% | 6,397,352 | 701,424 | 0.04 |
| 132 | 2026-11-21T10:49:00Z | 94d22520 | 577,668 | 564.1 | 9.18% | 6,443,824 | 700,168 | 0.13 |
| 133 | 2026-11-21T10:50:00Z | 94d22520 | 626,848 | 612.2 | 9.96% | 6,443,824 | 670,360 | 0.60 |
| 134 | 2026-11-21T10:51:00Z | 94d22520 | 612,504 | 598.1 | 9.74% | 6,443,824 | 666,812 | 0.22 |
| 135 | 2026-11-21T10:52:00Z | 94d22520 | 602,956 | 588.8 | 9.58% | 6,443,824 | 662,948 | 0.19 |
| 136 | 2026-11-21T10:53:00Z | 94d22520 | 583,280 | 569.6 | 9.27% | 6,443,824 | 663,468 | 0.07 |
| 137 | 2026-11-21T10:54:00Z | 94d22520 | 579,232 | 565.7 | 9.21% | 6,443,824 | 663,600 | 0.02 |
| 138 | 2026-11-21T10:55:00Z | 94d22520 | 579,140 | 565.6 | 9.21% | 6,443,824 | 664,044 | 0.01 |
| 139 | 2026-11-21T10:56:00Z | 94d22520 | 575,796 | 562.3 | 9.15% | 6,443,824 | 665,628 | 0.00 |
