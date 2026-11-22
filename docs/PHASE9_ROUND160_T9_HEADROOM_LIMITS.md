# LIMITS — Phase 9 đợt 160, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ mười bốn liên tiếp; headroom 0 → 2, dưới ngưỡng lần thứ 20 liên tiếp; balloon GHIM TRẦN 1 EPISODE MỚI, 56/132 mẫu, 5 chuỗi, 1 boot #61; KHÔNG reboot giữa phiên; ENOSPC ≥110 dòng trên 2 boot; lượt yên #29 CÓ lượt hợp lệ #25)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 0/0 (05:40:07Z, boot #61 52c957d5) → giữa phiên 2/2 (06:10:37Z, 06:45:53Z, 07:16:09Z) → đóng 2/2 (07:51:23Z, boot #61)** — **giá trị ổn định 2, dưới ngưỡng < ~1.800 lần thứ hai mươi liên tiếp** (mở 0 rồi lên 2 giữa phiên — xem §1.2, F-160-T9-1). Tỉ lệ/vite **2 / 1.578 ≈ 0,0013** — một vite mới (~1.578 watch) vẫn không khởi động được. Trần 63.747 không đổi. Quyết (l) đợt 158 "chỉ theo dõi" đứng, không hành động. Xem §1.
- **Balloon GHIM TRẦN 1 EPISODE MỚI — 56/132 mẫu (42,4%), 5 chuỗi, MỘT boot (#61):** chuỗi 1 (06:39:43–06:45:43Z, 7 mẫu) + chuỗi 2 (06:50:43–07:01:44Z, 12 mẫu) + chuỗi 3 (07:06:44–07:17:44Z, 12 mẫu) + chuỗi 4 (07:21:44–07:33:44Z, 13 mẫu) + chuỗi 5 (07:38:44–07:49:44Z, 12 mẫu) — nối nhau bằng 4 dip NÔNG (93,9% / 94,3% / 94,5% / 97,0% trần, gate A không mở lần nào trong dip) → **1 episode theo quy tắc (g) đợt 152 + tiền lệ đợt 157/158/159** (nếu tách thì 5 episode — trình cả hai, giao T10 phán; xem §2.2, F-160-T9-7). **Điểm đứt QUAN SÁT ĐƯỢC 07:50:45Z** (balloon xả về 6.247.216 kB, RAM hồi 645.172 kB, rồi xả tiếp tới 5.854.000 kB lúc đóng). Tỉ lệ ghim 42,4% là cao nhất kể từ đợt 154 (52,0%). Xem §2.2.
- **Chuỗi 4 đợt 159 (ghim từ 04:54:31Z boot #60, còn mở lúc T9-159 đóng): ĐIỂM ĐỨT KHÔNG QUAN SÁT ĐƯỢC.** Không có sampler T9 nào chạy 04:55:08–05:39:41Z; reboot #61 (btime 05:25:49Z) cắt ngang; mẫu đầu T9-160 (05:39:41Z) balloon đã là 5.283.516 kB (không ghim). Episode B đợt 159 vẫn đếm là 1 episode (chuỗi 2+3+4) theo quyết parent (k) đợt 159 §12.3 — T9-160 chỉ xác nhận điểm đứt không quan sát được, không đổi cách đếm đợt 159. Xem §2.2.
- **RAM:** sampler **132 mẫu, 05:39:41Z–07:50:45Z, MỘT boot (#61 — không reboot giữa phiên)**. Min **458.636 kB (447,9 MiB) lúc 07:49:44Z** (mẫu ghim cuối); max **2.967.256 kB (2.897,7 MiB = 47,16% guard) lúc 06:05:42Z** (20 s sau khi T4 attempt1 kết thúc); mean 908.616 kB. Gate A ≥1024 MiB: **36/132 mẫu (tất cả đều trước khi ghim)**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ mười bốn liên tiếp.** Xem §2, §3.
- **B2: 15 spike load1 ≥3,0 — 13 QUY ĐƯỢC DRIVER CỤ THỂ + 2 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ".** Tất cả 15 spike nằm trong MỘT cụm sớm 05:40:05–05:51:48Z (T1 suite/tsc/render + tải boot apt-get/dpkg + T2 eperm sweep); **0 spike sau 05:51:48Z — 0 spike trong cửa sổ balloon ghim (~70 phút), 0 spike trong cửa sổ attempt T4, 0 spike trong lúc O8 chạy, 0 spike trong lúc harness chạy.** Delta tick lớn nhất 124 tick/s (ffmpeg). Xem §2.5.
- **Lượt yên WebKit #29 (T4): CÓ LƯỢT HỢP LỆ #25 — chuỗi lượt yên hợp lệ NỐI DÀI (#22 đợt 157 → #23 đợt 158 → #24 đợt 159 → #25 đợt 160).** Attempt1-52c957d5 06:01:26–06:05:21Z, probe 20/20, lớp B 5/5, tickCost median 44,0 ms ≤60. Sampler T9 đối chiếu độc lập: gate A MỞ 4/4 mẫu trong cửa sổ attempt; 0 spike B2 trong cửa sổ. Xem §2.3.
- **KHÔNG reboot giữa phiên:** boot #61 52c957d5 ổn định suốt phiên (T0-160 xác minh 7 nguồn độc lập; T7-160 kiểm boot_id 6 lần đều 52c957d5; sampler T9 132/132 mẫu cùng boot, gap lớn nhất 61 s). Reboot #61 xảy ra TRƯỚC phiên (btime 05:25:49Z, sau T10-159 đóng, trước đợt 160 mở 05:35:51Z). **Cửa sổ thoáng headroom sau reboot #61 KHÔNG được quan sát** (T9 mở lúc boot+13m47s — xem F-160-T9-1). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: ≥110 dòng trên HAI boot** — #60: 78 dòng (số cuối T9-159 lúc 04:55:08Z; journal mất theo reboot #61, T0-160 xác nhận `--list-boots` chỉ còn 1 boot — không kiểm lại được) + #61: **32 dòng** (dòng đầu 05:36:52Z — boot+11m03s; dòng cuối 06:38:11Z — **không còn dòng mới trong 73 phút cuối phiên** tới lúc đóng 07:51:23Z). **Đợt thứ chín liên tiếp bảng watch cạn gây lỗi thật thấy được.** Xem §4.
- **T8-160 (đối chiếu):** O8 PASS 3/3 qua gate chuẩn CÙNG BOOT #61 (06:12:59–06:15:37Z); harness 6/6 PASS, 0 kẹt (06:15:57–06:31:28Z); 85m4 KHÔNG tái kẹt lần thứ hai liên tiếp; 86n2 P4-lần2 PASS (chuỗi 10 → 11); kẹt cộng dồn GIỮ 13; chuỗi "P3 không kẹt" 1 → 2. Xem §5.3.
- **T7-160 (đối chiếu): run 159 SUCCEEDED 05:14:08Z, margin 1.303 s** (rộng thứ hai từ đợt 150); bị viết lại lần 2 lúc 05:09:18Z do **DAEMON RESTART KHÔNG KÈM REBOOT — lần đầu quan sát**; **reboot #61 KHÔNG tạo điểm (m) mới** (0 run đang chạy, cùng mẫu #52). Xem §5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round160-t9/k8-headroom.py` (copy y nguyên từ đợt 159 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 160 (10 lần đo)

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 05:40:07Z 21/11 | **0** | #61 52c957d5 (btime 05:25:49Z) | lần đo 1, lúc mở (boot+14m18s); RAM trước đo 1.488.824 kB, balloon 5.283.516 kB, load1 5,97 |
| 05:40:07Z 21/11 | **0** | #61 52c957d5 | lần đo 2 (chênh **0** so với lần 1) |
| 06:10:37Z 21/11 | **2** | #61 52c957d5 | lần đo 3, giữa phiên (boot+44m48s); RAM trước đo 1.842.596 kB, balloon 4.897.088 kB, load1 0,18 |
| 06:10:37Z 21/11 | **2** | #61 52c957d5 | lần đo 4 (chênh **0** so với lần 3) |
| 06:45:53Z 21/11 | **2** | #61 52c957d5 | lần đo 5, giữa phiên (boot+1h20m04s); balloon đang ghim trần, RAM 513.444 kB, load1 0,16 |
| 06:45:53Z 21/11 | **2** | #61 52c957d5 | lần đo 6 (chênh **0** so với lần 5) |
| 07:16:09Z 21/11 | **2** | #61 52c957d5 | lần đo 7, giữa phiên (boot+1h50m20s); balloon đang ghim trần, RAM 454.044 kB, load1 0,03 |
| 07:16:09Z 21/11 | **2** | #61 52c957d5 | lần đo 8 (chênh **0** so với lần 7) |
| 07:51:23Z 21/11 | **2** | #61 52c957d5 | lần đo 9 (đóng phiên, boot+2h25m34s); balloon đã xả 5.854.000 kB, RAM 1.088.748 kB |
| 07:51:23Z 21/11 | **2** | #61 52c957d5 | lần đo 10 (chênh **0** so với lần 9) |

- Probe dừng ở `i=2` trong 8/10 lần đo — `inotify_add_watch` thứ ba trả errno 28 (chỉ thêm được 2 watch), đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau lần đo 3/4 và lúc đóng).
- **Từ 0 lên 2 giữa phiên (lần đo 2 → lần đo 3, trong khoảng 05:40:07–06:10:37Z):** một holder ngoài cell đã nhả 2 watch trong ~30 phút đầu phiên; sau đó giá trị giữ nguyên 2 qua 4 cặp đo còn lại (06:10 → 07:51Z, ~100 phút ổn định). T9 không biết holder nào nhả (ngoài cell, không nhìn thấy) — chỉ ghi số đo + thời gian. **2 không phải hồi phục** — vẫn thấp hơn ngưỡng 1.800 tới ~1.798 slot, và một vite mới cần ~1.578 watch.
- **Nghịch lý cần ghi rõ (F-160-T9-2):** headroom đã là 2 từ 06:10:37Z nhưng dòng ENOSPC của systemd vẫn tiếp tục tới 06:38:11Z (thêm 16 dòng sau lần đo 3/4), rồi mới dừng hẳn trong 73 phút cuối phiên (xem §4). 2 slot trống không đủ để systemd thêm watch thành công trong ~28 phút đó — hoặc holder ngoài cell lấy lại slot ngay sau mỗi lần probe nhả, hoặc service đã ngừng thử sau 06:38:11Z. T9 không phán cơ chế; chỉ ghi hai dãy số đo độc lập cùng chỉ về "bảng gần như đầy hẳn".
- **So sánh với đợt 159:** đợt 159 mở 0 → thoáng 23.503/18.447 sau reboot #60 → về 0 (8/10 lần đo 0); đợt này mở 0 → ổn định 2 (8/10 lần đo 2). **Cửa sổ thoáng sau reboot #61 KHÔNG được quan sát** — T9-160 mở lúc boot+13m47s (đợt mở 05:35:51Z đã là boot+10m02s), quá muộn so với cửa sổ thoáng 1–3 phút sau boot của đợt 159 (xem F-160-T9-1). Dòng ENOSPC đầu tiên trên boot #61 xuất hiện 05:36:52Z (boot+11m03s) — bảng đã đầy (hoặc gần đầy tới mức systemd lỗi) chậm nhất lúc đó.
- **So sánh với đợt 156:** đợt 156 đóng ở 2 (4 lần đo đóng đều 2) — đợt này cũng đóng ở 2 (8 lần đo liên tiếp đều 2). Cùng giá trị, khác bối cảnh: đợt 156 có 3 reboot giữa phiên, đợt này 0 reboot.
- Số watch đang giữ ngoài cell suy ra lúc ổn định: 63.747 − 2 = **63.745 watch** (bảng gần đầy hẳn, chỉ 2 watch trống) từ 06:10:37Z tới lúc đóng.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **2 / 1.578 ≈ 0,0013** — một vite mới (~1.578 watch) vẫn không khởi động được (cần thêm ~1.576 slot).
- T5-160 KHÔNG probe lại headroom đợt này (như đợt 151–159) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 10 lần đo + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #61 có 32 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM trước đo lần đóng (~1.089.000 kB, balloon đã xả) cao hơn RAM lúc ghim (~454.000–513.000 kB) trong khi headroom 2 → 2. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–159 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **160** | **0 → 2** | **mở 05:40:07Z boot #61 52c957d5 btime 05:25:49Z: 0, 0 → giữa phiên 06:10:37Z: 2, 2 → đóng 07:51:23Z cùng boot #61: 2, 2 (KHÔNG reboot giữa phiên; 10 lần đo, 8 lần 2)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 2 lần thứ hai (đợt 156: 2; đợt 160: 2), xen giữa ba đợt 0 (157, 158, 159).** Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**. Giá trị 2 ổn định ~100 phút cuối phiên, không phải thoáng nhất thời.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, thấp hơn ngưỡng 1.800, lần thứ hai mươi liên tiếp.** Quyết parent đợt 158 (l) GIỮ quyết (g) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal HAI boot có ≥110 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ chín liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở 05:40:07Z, giữa phiên 06:10:37Z / 06:45:53Z / 07:16:09Z và lúc đóng 07:51:23Z — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.745 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.048.572 kB) — sampler 132 mẫu, 05:39:41Z–07:50:45Z, MỘT boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên trên boot #61 (T1 suite/tsc/render + T4 attempt + T5 replay apt-get, đỉnh 2.967.256 kB) → RAM rơi dần khi balloon leo → ghim trần 1 episode dài 56 mẫu (5 chuỗi + 4 dip nông) → đứt quan sát được 07:50:45Z, RAM hồi

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **0 gap >90 s — gap lớn nhất 61 s**; không reboot giữa phiên nên không có gap reboot — xem §5.1). **132 mẫu, 05:39:41Z–07:50:45Z, MỘT boot (#61).** Tổng quan: **min 458.636 kB (447,9 MiB) lúc 07:49:44Z; max 2.967.256 kB (2.897,7 MiB) lúc 06:05:42Z — 47,16% guard; mean 908.616 kB (887,3 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 05:39:41–06:05:42Z | #61 | 1.129.488–2.967.256 kB | Mở phiên: T1 suite 28/28 + tsc + render (B2 15 spike, xem §2.5); T4 attempt1 lượt yên #29 (06:01:26–06:05:21Z); T5 replay apt-get (POSTBOOT_PASS 05:52:59Z); gate A MỞ 36/60 mẫu tiền-ghim; **đỉnh phiên 06:05:42Z** (balloon xả sâu nhất phiên 3.905.376 kB, 20 s sau khi attempt kết thúc); load1 tới 7,21 (sampler) / 8,02 (watcher) |
| 06:06:42–06:38:43Z | #61 | 564.548–2.384.988 kB | Sau attempt: O8 chạy 06:12:59–06:15:37Z (load1 chỉ 1,29–2,85, 0 spike B2); harness 06:15:57–06:31:28Z (0 mẫu load1 ≥3,0); balloon leo dần 4,6M → 6,4M kB; gate A ĐÓNG dần (0/11 mẫu cuối tiền-ghim) |
| 06:39:43–07:49:44Z | #61 | 458.636–933.072 kB | **Ghim trần 1 EPISODE, 56 mẫu trong 5 chuỗi + 4 dip nông** (xem §2.2); **RAM min phiên 07:49:44Z (458.636 kB)**; gate A ĐÓNG cả 71 mẫu (kể cả 15 mẫu dip); load1 ≤2,15 (yên hoàn toàn về tải) |
| 07:50:45Z | #61 | 645.172 kB | **Đứt quan sát được** (balloon xả về 6.247.216 kB); lúc đóng đo 07:51:23Z balloon xả tiếp 5.854.000 kB, RAM hồi 1.088.748 kB |

- **Gate A ≥1024 MiB: 36/132 mẫu** (36/60 tiền-ghim + 0/71 trong cửa sổ ghim + 0/1 sau đứt); **0 mẫu ≥ guard**; load1 max (sampler) **7,21 lúc 05:47:42Z** (watcher bắt 8,02 lúc 05:48:18Z — cadence 30 s bắt được đỉnh cao hơn); **9/132 mẫu load1 ≥3,0** (tất cả đều 05:39:41–05:51:48Z, trong cụm B2). **RAM <512.000 kB: 37 mẫu** (tất cả trong cửa sổ ghim; đợt 159: 2 mẫu — đợt này trũng sâu và dài hơn nhiều); **RAM <300.000 kB: 0 mẫu** (đợt 158: 4 mẫu <300.000 kB).
- Swap: SwapFree 847.068 kB (mẫu đầu) → 648.052 kB (mẫu cuối); dao động 573.024–847.068 kB — thấp nhất phiên 573.024 kB (trong cửa sổ ghim). SwapFree không nhảy lên ~1.030.000 kB như các đợt có reboot giữa phiên (không có reboot để xả swap — cùng mẫu đợt 150).
- Mẫu 06:05:42Z (đỉnh phiên): RAM 2.967.256 kB, balloon xả 3.905.376 kB — balloon xả sâu nhất phiên ngay sau T4 attempt1 (cùng mẫu đợt 152–159: xả sâu sau attempt / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này sâu và dài: min 458.636 kB (đợt 159: 499.084 kB; đợt 158: 199.248 kB) — 37 mẫu <512.000 kB trong 71 mẫu cửa sổ ghim (52%). T8-160 đo độc lập RAM trong lúc harness/O8: xem §5.3 (T8 không đo RAM min phiên; sampler T9 là nguồn duy nhất cho trũng ghim).

### 2.2 Balloon virtio — GHIM TRẦN 1 EPISODE MỚI, 56/132 mẫu, 5 chuỗi, MỘT boot (#61)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #61 (52c957d5): GHIM TRẦN 56/132 mẫu (42,4%), trong 5 chuỗi — 1 EPISODE:**
  - **Chuỗi 1: 06:39:43–06:45:43Z, 7 mẫu** (span 360 s); leo đều lên trần từ 06:05:42Z (balloon 3.905.376 kB → 6.443.824 kB trong ~34 phút).
  - **Dip nông 1: 06:46:43–06:49:43Z, 4 mẫu** — balloon 6.078.708 kB (94,3% trần) lúc 06:46:43Z là điểm thấp nhất, rồi leo lại 95,6% / 97,3% / 98,8%; RAM trong dip tối đa 933.072 kB, **gate A KHÔNG mở lần nào**.
  - **Chuỗi 2: 06:50:43–07:01:44Z, 12 mẫu** (span 661 s, 11 phút).
  - **Dip nông 2: 07:02:44–07:05:44Z, 4 mẫu** — balloon 6.091.896 kB (94,5% trần) lúc 07:02:44Z là điểm thấp nhất, rồi leo lại 96,3% / 98,0% / 99,5%; RAM trong dip tối đa 874.144 kB, **gate A KHÔNG mở lần nào**.
  - **Chuỗi 3: 07:06:44–07:17:44Z, 12 mẫu** (span 660 s, 11 phút).
  - **Dip nông 3: 07:18:44–07:20:44Z, 3 mẫu** — balloon 6.247.216 kB (97,0% trần) lúc 07:18:44Z là điểm thấp nhất, rồi leo lại 98,5% / 99,99% (mẫu 07:20:44Z chỉ thấp hơn trần 728 kB); RAM trong dip tối đa 749.208 kB, **gate A KHÔNG mở lần nào**.
  - **Chuỗi 4: 07:21:44–07:33:44Z, 13 mẫu** (span 720 s, 12 phút).
  - **Dip nông 4: 07:34:44–07:37:44Z, 4 mẫu** — balloon 6.050.608 kB (93,9% trần) lúc 07:34:44Z là điểm thấp nhất, rồi leo lại 95,2% / 97,0% / 98,6%; RAM trong dip tối đa 871.568 kB, **gate A KHÔNG mở lần nào**.
  - **Chuỗi 5: 07:38:44–07:49:44Z, 12 mẫu** (span 660 s, 11 phút).
  - **Đứt QUAN SÁT ĐƯỢC 07:50:45Z** (balloon xả về 6.247.216 kB = 97,0% trần, RAM hồi 645.172 kB), rồi xả tiếp tới 5.854.000 kB lúc đóng đo 07:51:23Z (RAM hồi 1.088.748 kB).
- **Tổng ghim trần đợt này: 56/132 mẫu (42,4%)** (đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **5/5 chuỗi đều nằm trong 1 episode, điểm đứt quan sát được** — khác đợt 159 (chuỗi 4 còn mở lúc đóng, không quan sát được điểm đứt).
- **Phán theo quy tắc quyết (e)/(g) (T9 phán, giao T10 xác nhận cách đếm):**
  - **Episode duy nhất (boot #61, chuỗi 1+2+3+4+5): 1 EPISODE.** Năm chuỗi cùng boot, cách nhau bởi dip NÔNG (93,9% / 94,3% / 94,5% / 97,0% — KHÔNG phải xả sâu; gate A đóng suốt cả bốn dip; mỗi dip chỉ 3–4 mẫu / ~3–4 phút) — đếm là 1 episode theo quy tắc (g) đợt 152 + tiền lệ đợt 157 (episode B đợt 157: dip tới 94,4% vẫn cùng episode), đợt 158 (episode A: dip tới 94,5% / 97,4%) và đợt 159 (episode B: dip tới 94,5% / 94,4% — quyết parent (k) đợt 159 §12.3 đã CHẤP NHẬN cách đếm này). Dip 2 đợt này (94,5%) trùng khớp đúng tiền lệ 94,5% đợt 158/159; dip 4 (93,9%) là dip nông nhất trong cả ba đợt 158–160 nhưng vẫn trên 93% trần và gate A đóng suốt — cùng bản chất.
  - **Episode này MỚI, không nối đợt 159:** giữa lần ghim cuối đợt 159 (04:54:31Z, boot #60, chuỗi 4 còn mở) và lần chạm đầu đợt 160 (06:39:43Z, boot #61) có **reboot #61 + balloon xả sâu nhiều lần (tới 3.905.376 kB = 60,6% trần lúc 06:05:42Z) + ~1 giờ 45 phút không ghim**.
  - **Đợt 160 = 1 EPISODE GHIM MỚI** (56 mẫu / 5 chuỗi) — **đợt đầu tiên kể từ đợt 155 chỉ có 1 episode** (đợt 156, 157, 158, 159 đều 2 episode). Tỉ lệ mẫu ghim 42,4% cao nhất kể từ đợt 154, nhưng số episode lại thấp nhất kể từ đợt 155 — vì 5 chuỗi nối nhau bằng dip nông trên cùng boot thay vì tách thành nhiều episode.
  - **Nếu T10/parent phán một hoặc nhiều dip là xả (đủ tách episode) thì đợt 160 = 2–5 episode** (tách ở dip 4 nông nhất → 2 episode; tách ở cả 4 dip → 5 episode, mỗi chuỗi riêng) thay vì 1 — T9 ghi rõ để T10 phán, không giấu điểm khác biệt (xem F-160-T9-7).
- **Chuỗi 4 đợt 159 — điểm đứt KHÔNG quan sát được (giao từ brief T9-160):** chuỗi 4 đợt 159 ghim từ 04:54:31Z trên boot #60, còn mở lúc T9-159 đóng (04:55:08Z). **Không có sampler T9 nào chạy trong khoảng 04:55:08–05:39:41Z** (giữa hai đợt); reboot #61 (btime 05:25:49Z) cắt ngang khoảng trống này; mẫu đầu T9-160 (05:39:41Z) balloon đã là 5.283.516 kB (82,0% trần, không ghim). **Không thể xác định chuỗi 4 đứt lúc nào hay xả tới đâu** — chỉ biết lúc T9-160 mở thì balloon đã rời trần. Episode B đợt 159 (chuỗi 2+3+4) vẫn giữ cách đếm 1 episode theo quyết parent (k) đợt 159 §12.3 (đã chấp nhận); T9-160 không đổi lại số đợt 159.
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~458–570.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 07:49:44Z: tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 458.636 kB.

### 2.3 Lượt yên WebKit #29 (T4, đợt 160) — CÓ LƯỢT HỢP LỆ #25, CHUỖI NỐI DÀI (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-160 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND160_T4_WEBKIT_QUIET29_LIMITS.md`) + cờ `round160-t4.done` (06:11Z) — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Attempt1-52c957d5 (06:01:26–06:05:21Z): probe 20/20, LỚP B ĐẠT 5/5, tickCost median 44,0 ms ≤60 — HỢP LỆ.** Attempt1 ĐẠT ngay ở lần mở cửa đầu tiên (không cần attempt 2/3).
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): CÓ 1 attempt hợp lệ cho lượt yên #29 (#25)** — chuỗi lượt yên hợp lệ **NỐI DÀI lên #25** (#22 đợt 157 → #23 đợt 158 → #24 đợt 159 → #25 đợt 160).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Gate A RAM: **MỞ 4/4 mẫu trong cửa sổ attempt** (06:01:42Z 1.175.492 kB; 06:02:42Z 1.129.488 kB; 06:03:42Z 1.630.168 kB; 06:04:42Z 1.448.500 kB — cả 4 đều ≥1024 MiB). Mẫu ngay sau attempt 06:05:42Z (2.967.256 kB — đỉnh phiên, balloon xả 3.905.376 kB).
  - Tải: sampler load1 trong cửa sổ attempt **0,45–2,75**; **0 spike B2 trong cửa sổ attempt** (xem §2.5).
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cửa sổ attempt** (mẫu thấp nhất trong cửa sổ là 1.129.488 kB lúc 06:02:42Z).
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy attempt1 06:01:26–06:05:21Z trên boot #61.

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 06:01:42–06:04:42Z | #61 | 0,45–2,75 (4 mẫu) | 1.129.488–1.630.168 kB — **gate A MỞ 4/4** | T4 attempt1 — 0 spike B2 trong cửa sổ; attempt1 HỢP LỆ (tickCost median 44,0 ms ≤60) |
| 06:05:42Z | #61 | 0,45 (1 mẫu) | 2.967.256 kB — **gate A MỞ** | 21 s sau khi attempt kết thúc (06:05:21Z); balloon xả 3.905.376 kB — đỉnh RAM phiên |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 15 spike, 13 QUY ĐƯỢC DRIVER CỤ THỂ + 2 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ" (0 spike sau 05:51:48Z; 0 spike trong cửa sổ balloon ghim, 0 spike trong cửa sổ attempt T4, 0 spike trong lúc O8/harness chạy)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-160-T9-3). **15 spike, tất cả trong MỘT cụm sớm 05:40:05–05:51:48Z (11m43s); 0 spike trong 05:51:48–07:51:23Z (~2 giờ, gồm toàn bộ ~70 phút cửa sổ balloon ghim 06:39:43–07:49:44Z + cả 4 dip nông). 0 spike trong cửa sổ attempt T4 (06:01:26–06:05:21Z), 0 spike trong lúc O8 chạy (06:12:59–06:15:37Z), 0 spike trong lúc harness chạy (06:15:57–06:31:28Z — sampler cũng 0 mẫu load1 ≥3,0 trong cửa sổ harness).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — T1 suite/tsc/render + tải boot apt-get/dpkg + T2 sweep (15 spike) | 05:40:05–05:51:48Z | 3,51–**8,02** | 15 | ffmpeg testsrc2 top 90,0% (spike 1); tsc MainThread top 110,0% delta **48** (spike 2); node /tmp/p7-160t1.test.mjs top 100,0% delta **99** (spike 3); ffmpeg vidstabdetect top 100,0% delta **124** (spike 4); ffmpeg demo_effects 66,1% tích lũy + apt-get top 70,0% tức thời + ffprobe 40,0% (spike 5 — hỗn hợp); ffmpeg demo_transitions top 81,8% (spike 6); ffmpeg pixelate 720p top 100,0% delta **114** (spike 7); ffmpeg pixelate top 72,7% tức thời + apt-get 39,6% tích lũy (spike 8 — hỗn hợp); ffmpeg pixelate 1080p top 109,1% delta **121** + apt-get delta 26 (spike 9 — hỗn hợp); ffmpeg v19 pixelate top 100,0% delta **109** + apt-get 61,7% tích lũy delta 20 (spike 10 — hỗn hợp); apt-get delta 0, top tức thời chỉ hatch 10,0% (spike 11); find T2 eperm-sweep delta **13** + top 10,0% D-state (spike 12 — yếu, xem dưới); apt-get 48,2% tích lũy + dpkg top 30,0% tức thời (spike 13); apt-get delta 0 + grep delta 0, top tức thời chỉ hatch 20,0% (spike 14); apt-get top 100,0% (spike 15) | **T1 verify suite (ffmpeg ×7 + tsc ×1 + node test ×1, gồm 4 spike hỗn hợp với apt-get) + tải boot apt-get/dpkg (T5 replay) + T2 eperm sweep ×1 + 2 spike lớp load1 dư (spike 11, 14)** |

- **Tổng kết đếm: 13/15 spike có driver process cụ thể** (T1 thuần 6: spike 1, 2, 3, 4, 6, 7; hỗn hợp T1 render + apt-get boot 4: spike 5, 8, 9, 10; apt-get/dpkg boot thuần 2: spike 13, 15; T2 eperm-sweep find 1: spike 12) **+ 2/15 spike lớp "load1 dư"** (spike 11, 14 — ghi rõ trong bảng trên, không gộp chung thành "đã quy được nguồn"). Lớp load1 dư có cơ chế chung: load1 là trung bình 1 phút còn dư sau burst trước + tải nền từ nhiều process ngắn hạn (mỗi process chết trước khi đo delta / không lọt top-5 theo %CPU tích lũy) — corroborate bằng nr_running 1–10 trong các header spike.
- **Spike 12 (yếu — ghi rõ, không giấu):** driver là `find` của T2 eperm-sweep (`find /home/hatch/workspace -name *.log ... -newermt @1795228973`, chạy dưới `python3 eperm-sweep9292.py`) — delta 13 tick, top tức thời 10,0% D-state, 10,4% tích lũy. Đây là process phi-daemon có delta cao nhất trong snapshot, nhưng hatch daemon cũng có delta 16 tick trong cùng snapshot (nền, xuất hiện ở mọi spike). T9 đếm spike 12 là "quy được driver" với ghi chú yếu này; nếu T10 áp chuẩn chặt hơn (delta phải vượt daemon rõ rệt) thì spike 12 rơi về lớp load1 dư và đếm thành **12/15 quy được + 3 load1 dư**.
- **Caveat đếm (F-160-T9-3):** lệnh chờ của chính T9 (`sleep 1800` / `sleep 2100` trong các exec chờ) xuất hiện trong snapshot `top` của b2-spikes.log (pid 3970 `sleep`, 0,0% CPU, trong spike 7 và 8); **0 dòng delta-tick nào nhắc tới sleep; 0 dòng nào nhắc `ps -eo pid`** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `grep -c '^=== SPIKE'` = **15**.
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log** — F-150-T9-8 VẪN ĐÓNG.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution (vd spike 1: ffmpeg top 90,0% dù chết trước delta; spike 5: apt-get top 70,0% dù delta 0 ở vòng sau; spike 13: apt-get 48,2% tích lũy dù chết trước delta). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 13 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 13/15 spike; 2 spike còn lại chỉ quy được lớp load1 dư — giới hạn phương pháp đã biết (process ngắn hạn / tải phân tán), T9 ghi rõ thay vì gộp chung.
- **Delta tick lớn nhất đợt: 124 tick/s** (ffmpeg vidstabdetect, spike 05:41:50Z); ffmpeg pixelate 109–121 tick/s; node test 99 tick/s; tsc MainThread 48 tick/s (delta) / top 110,0%; apt-get 0–26 tick/s; dpkg top 30,0% tức thời (không bắt được delta); find T2 13 tick/s; daemon 3–23 tick/s. (Đợt 159: max 135 tick/s.)
- **Khoảng mù watcher đầu phiên (F-160-T9-4):** watcher B2 khởi động ~05:40:05Z (sau sampler ~24 s — lần khởi động đầu bị lỗi đường dẫn tương đối, xem §6); sampler đã ghi load1 5,97 lúc 05:39:41Z và 7,00 lúc 05:40:41Z — **có thể 1 spike đã xảy ra trong khoảng 05:39:41–05:40:05Z mà watcher chưa chạy nên không bắt được** (không chứng minh được; spike đầu tiên watcher bắt là 05:40:05Z load1 6,92). Sau đó watcher chạy liên tục tới lúc đóng, không gap (không reboot giữa phiên).
- **O8/harness chạy nhẹ đợt này:** O8 06:12:59–06:15:37Z (WebKit 21/21 ×2 + Chromium 21/21) gây **0 spike B2** (sampler load1 trong cửa sổ O8 chỉ 1,29–2,85; 2 mẫu trong cửa sổ: RAM 991.204–1.233.684 kB, gate A 1/2); harness 06:15:57–06:31:28Z gây **0 spike B2** (sampler 0 mẫu load1 ≥3,0 trong cửa sổ) — khác đợt 159, O8 cũng 0 spike nhưng harness attempt 2 gây 11 spike (WebKit/Chromium); đợt này cả hai đều 0 spike.

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này ffmpeg xuất hiện trong 8/15 spike (testsrc2 ×1 + vidstab ×1 + demo_effects ×1 + demo_transitions ×1 + pixelate ×3 + v19 pixelate probe ×1), là **test render trong suite verify của T1** (test_round93_u4_failfast_measure.js, demo_effects.js, demo_transitions.js, test_pixelate_render.js, test_v19_pixelate_probe.js) — chạy đúng chức năng, thoát bình thường. T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/tsc/render + tải boot apt-get/dpkg + T2 sweep + load1 dư; không process lạ; **0 nhắc WebKit/MiniBrowser/chrome trong toàn bộ b2-spikes.log**).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (KHÔNG GAP); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ mười bốn liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148–159 giữ nguyên; quyết parent (n) đợt 158 GIỮ NGUYÊN cơ chế (a) armed): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **2.967.256 kB = 2.897,7 MiB = 47,16% guard lúc 06:05:42Z** — chưa tới một nửa đường tới guard (xa guard 3.324.200 kB). Đỉnh đợt này thấp hơn đợt 159 (51,12% guard).
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ mười bốn liên tiếp (147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160).** Cơ chế tự động armed cả phiên (sampler `round160-t9/sampler.sh`, pid 3133, chạy 05:39:41Z–07:50:45Z, 132 mẫu — **không gap reboot (không reboot giữa phiên), gap lớn nhất 61 s**) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→160 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**, **3.211**, **2.779**, **3.477**, **2.612**, **2.250**, **3.216**, **2.967**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 05:39:41Z–07:50:45Z (132 mẫu, 0 gap >90 s); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 159 nằm trong dir round159-t9 nên không chặn đợt này (dir mới round160-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-160-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-160-birefnet/out-birefnet-160.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147–159):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-160-T9-9); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-160-T9-8 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra — đợt này T4 có 1 attempt hợp lệ nhưng cửa sổ guard không mở nên điểm (c) không phát sinh). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) KHÔNG tái diễn đợt này: 0 reboot giữa phiên, sampler chạy liên tục, gap lớn nhất 61 s** (đợt 159: gap 100 s; đợt 158: gap 80 s) — dữ kiện này ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" ở mức phiên này, nhưng T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10.
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Phương pháp đếm (ghi rõ):** `journalctl --no-pager | grep -c 'No space left on device'` trên boot đang chạy tại thời điểm đếm; journald chỉ giữ 1 boot (volatile) nên **số cuối của một boot KHÔNG kiểm được sau khi reboot sang boot mới** (cùng giới hạn F-155-T10-1 / F-154-T1-3). Mỗi boot dưới đây ghi rõ: số đếm được lần cuối + thời điểm đếm + ai đếm. **Tổng phiên là CẬN DƯỚI (≥), không phải số đếm đầy đủ.**
- **Journal trên boot #60 (e590ae0a): 78 dòng** — số cuối T9-159 lúc 04:55:08Z (dòng đầu 03:07:51Z, dòng cuối 04:53:59Z). **Số cuối KHÔNG kiểm lại được** (journal mất theo reboot #61 05:25:49Z; T0-160 xác nhận `journalctl --list-boots` chỉ còn 1 boot — journal không giữ boot cũ). Từ 04:55:08Z tới reboot 05:25:49Z còn ~31 phút chưa đếm (~22 dòng theo cadence ~82 s/dòng của #60) — T9 KHÔNG cộng số ước vào tổng; xem F-160-T9-5.
- **Journal trên boot #61 (52c957d5): 32 dòng lúc đóng** (T9 đếm 32 lúc 07:51:23Z; dòng đầu 05:36:52Z — boot+11m03s; dòng cuối 06:38:11Z). Cadence ~119 s/dòng (32 dòng / 3.679 s từ dòng đầu 05:36:52Z tới dòng cuối 06:38:11Z). **Không còn dòng mới trong 73 phút cuối phiên** (06:38:11Z → 07:51:23Z) — T9 kiểm lại lúc đóng, vẫn 32 dòng. Boot này còn sống lúc T9 đóng nên 32 là số đếm tới thời điểm đóng (có thể tăng sau khi T9 đóng — T10 kiểm lại nếu cần).
- **Tổng phiên: ≥110 dòng trên HAI boot** (78 + 32 — mỗi boot là cận dưới tại thời điểm đếm cuối). Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. **Đây là đợt thứ chín liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng — ít hơn vì journal của 3 boot cũ mất theo 3 reboot; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng — ít hơn vì journal boot #58 mất theo reboot #59 sau khi chỉ đếm tới 34; đợt 159: ≥134 dòng — cao nhất kể từ đợt 155; đợt 160: ≥110 dòng).
- **Điểm mới đáng ghi (không phán cơ chế):** dòng ENOSPC cuối trên #61 (06:38:11Z) xuất hiện **92 s TRƯỚC khi balloon bắt đầu ghim** (06:39:43Z) — và không còn dòng mới nào trong suốt ~70 phút ghim + sau đứt. Cùng lúc, headroom đã là 2 từ 06:10:37Z (xem F-160-T9-2). T9 ghi đúng mốc thời gian, không claim quan hệ nhân quả giữa balloon ghim và ENOSPC dừng.
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số. (Trong phiên này không có reboot nên steal của #61 là số của cả boot — T9 không đo steal đợt này; giao T5/T7 nếu cần.)
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=2 ×8 lần + i=0 ×2 lần — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo); **(2) ≥110 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2 — **không thêm được watch nào đáng kể cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 KHÔNG reboot giữa phiên #61 + T9 mở muộn, lỡ cửa sổ thoáng sau boot

- **Boot lúc mở đợt 160 = 52c957d5** (btime **05:25:49Z** theo `/proc/stat` — KHỚP T0-160 xác minh 7 nguồn độc lập; **reboot #61 xảy ra TRƯỚC phiên, sau T10-159 đóng, trước đợt 160 mở 05:35:51Z**).
- **T9 mở muộn so với boot:** T9 khởi động sampler 05:39:41Z (boot+13m52s), lần đo headroom đầu 05:40:07Z (boot+14m18s) — **cửa sổ thoáng headroom 1–3 phút sau boot (theo mẫu đợt 159) đã qua trước khi T9 mở** (xem F-160-T9-1). Ngay cả đợt mở 05:35:51Z cũng đã là boot+10m02s. Dòng ENOSPC đầu trên #61 (05:36:52Z, boot+11m03s) là mốc sớm nhất T9 có cho thấy bảng đã đầy.
- **KHÔNG có reboot nào trong phiên:** sampler 132/132 mẫu cùng boot 52c957d5; T7-160 kiểm boot_id 6 lần (~05:38Z, ~06:05Z, ~06:31Z, ~06:56Z, ~07:22Z, ~07:47Z) đều 52c957d5, btime 05:25:49Z không đổi; T8-160 cũng xác nhận 0 reboot trong phiên. Sampler + watcher B2 chạy liên tục từ lúc khởi động tới lúc T9 đóng (không chết, không khởi động lại).
- **Số hiệu #61: T9 tự xác nhận theo đếm tuần tự** (#60 đã xác nhận đợt 159, quyết (s) đợt 158; boot mới duy nhất sau #60 trong phiên; btime 05:25:49Z; T0-160 + T2-160 xác minh độc lập) — **giao T2-160/T10-160 chốt chính thức**.
- Các cờ .done lúc T9 đóng (~07:55Z): t0, t1, t2, t4, t5, t6, t7, t8 (8/8 — t9 đóng ngay sau khi viết LIMITS này, thành 9/9; t10 chưa đóng lúc T9 đóng).

### 5.2 T5-160 — POSTBOOT_PASS cho #61 ĐÃ CÓ; #60 KHÔNG CÓ (boot thứ 6 không cờ); watcher-160 khởi động bằng tay (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **POSTBOOT_PASS cho boot #61 ĐÃ CÓ (T5-160, 05:52:59Z, boot+27m10s, mode replay-day-du, poll=0)** — replay trên #61 chạy lại từ đầu, xong boot+26m17s.
- **POSTBOOT_PASS cho boot #60: KHÔNG CÓ, không bù được** (boot thứ 6 liên tiếp lọt: #57, #58 đã có từ đợt 158... — T5-160 ghi rõ #60 không có cờ; T9 trích đúng T5-160, không đếm lại).
- **Watcher-160 khởi động bằng tay 05:41:26Z pid 4539** (T5-160 §3). Watcher-159 pid 18158 CHẾT theo reboot #60 (log dừng 03:06:26Z).
- **Marker `~/.config/vcut-persistence-marker` sống qua 13 reboot** (T5-160).
- Tải apt-get trong B2 đợt này (§2.5) chính là replay của T5-160 (cài glib-networking, gstreamer plugins, libevdev2, libgtk-4-media-gstreamer, gstreamer1.0-libav, libdjvulibre21, libc6-dbg, ...) — corroborate bằng cửa sổ thời gian (apt-get chạy 05:40–05:51Z, trong lúc replay).

### 5.3 T8-160 — O8 PASS 3/3 cùng boot #61 + harness 6/6 SẠCH, 0 kẹt (T9 chỉ ghi lại để đối chiếu)

- **O8: WebKit 21/21 ×2 + Chromium 21/21, toàn bộ PASS exit 0** (06:12:59–06:15:37Z, boot #61, cùng cây preview.tsx `530e10a7`) — qua **gate chuẩn CÙNG BOOT** (GATE-FOUND poll 31 lúc 06:10:22Z: cờ T4 + POSTBOOT_PASS đường (a) của T5; lượt yên #29 có lượt hợp lệ #25 trên ĐÚNG boot đo). Chuỗi WebKit FULL PASS 14 → ? (chờ T10/parent phán — T8 KHÔNG tự chốt; T1-160 ghi chuỗi LÊN 14 theo quyết parent (h) đợt 159).
- **Harness (MỘT lần chạy driver duy nhất, boot #61): 6/6 PASS, 0 kẹt** (06:15:57–06:31:28Z, 15'31"); 85m4 P4-lần3 **PASS lần thứ hai liên tiếp, KHÔNG tái kẹt** (chưa đủ điều kiện mở điều tra H3 — quyết (i) đợt 158); 86n2 P4-lần2 PASS (chuỗi 10 → 11); 84l10 E4-setup KHÔNG tái kẹt. **Kẹt cộng dồn GIỮ 13; chuỗi "P3 không kẹt" 1 → 2.** Watchdog 0 kích hoạt (đúng — không có kẹt); live-diag 0 kích hoạt (không có kẹt để thử thách — điểm mù F-158-T8-4 KHÔNG được kiểm chứng đợt này, vẫn là giới hạn đứng theo quyết (u)).
- **Đối chiếu sampler T9 (độc lập):** O8 gây **0 spike B2** (sampler load1 trong cửa sổ O8 1,29–2,85; gate A 1/2 mẫu); harness gây **0 spike B2** (sampler 0 mẫu load1 ≥3,0 trong cửa sổ harness) — khác đợt 159 (harness attempt 2 gây 11 spike); đợt này cả O8 lẫn harness đều 0 spike.
- **0 REBOOT trong lúc T8 đo** (T8 đóng ~06:35Z).

### 5.4 Run 159 SUCCEEDED + #61 KHÔNG tạo điểm (m) (T7-160 đã xuất bản LIMITS — T9 chỉ ghi lại để đối chiếu)

- **Run 159: SUCCEEDED 05:14:08Z** (event 05:14:08.721Z, eid 9629), wall gốc **9.497 s**, margin **1.303 s** tới hạn 05:35:51Z (rộng thứ hai từ đợt 150, sau run 151: 1.828 s) — theo T7-160 LIMITS.
- **Run 159 bị viết lại lần 2 lúc 05:09:18Z do DAEMON RESTART KHÔNG KÈM REBOOT** (eid 9626, "daemon startup recovery") — **lần đầu tiên quan sát được viết lại không kèm reboot**; KHÔNG phải do #61 (xảy ra 991 s TRƯỚC btime #61).
- **Reboot #61 KHÔNG viết lại run 159** (run đã finished trước #61 701 s) và **KHÔNG tạo điểm (m) mới** (0 run đang chạy tại btime 05:25:49Z; 0 requeue trong cửa 05:25:49–05:35:51Z — cùng mẫu #52).
- **#56 VẪN CÓ ĐIỀU KIỆN** (T2-160 không thu hẹp được cửa lần thứ ba: ba hướng mới đều âm tính); dải GIỮ 33–49,8 s; điều tra (m) VẪN ĐÓNG; n (m) chính thức GIỮ 14 (ứng viên 18/19 gồm #60 — chờ parent quyết; #61 không thêm ứng viên).
- **Slot: HB/DR lành hoàn toàn lần thứ tám liên tiếp** (theo T7-160).

### 5.5 Các luồng khác đợt 160 (T9 chỉ ghi lại để đối chiếu)

- **T1-160: VERIFY 159 PASS** — đếm script viết mới hoàn toàn (count-final-160-t1.py): đợt 159 = 10/13/13 (khớp); lũy kế 111–159 = 478/898/767; chờ push 136–159 = 230/320/271 — KHỚP từng số, lần thứ 49 liên tiếp; suite chạy lại 28/28 exit 0 (05:40:06–05:48:57Z, boot #61 — đúng cửa sổ B2 cụm 1 của T9); O8 xác nhận độc lập (chuỗi FULL PASS LÊN 14 theo quyết parent (h) đợt 159).
- **T2-160: mù #92? (#60) ĐÓNG** (J ĐÓNG bằng mốc file max gap 111 s + union 30 s; K ĐÓNG bằng mốc nội dung — max gap FILE 1.509 s VƯỢT sàn 1.147 s, union file+nội dung max gap 421 s — trình cả hai số theo quyết (b) đợt 158); **mù #88? VẪN MỞ** (lần thứ tư liên tiếp, hole-recheck 345 hit, 0 mốc mới); **mù #77? VẪN MỞ**; CERT/FULL chính thức GIỮ 76/91; **mù #93? (#61) MỚI MỞ** (giao T2-161); (m) #56 KHÔNG thu hẹp được lần thứ ba.
- **T6-160: (A) 120/120 PASS dưới churn (lần thứ 10 liên tiếp); suite 9/9;** lock 476 cặp lúc kiểm cuối (số T6-160 — T9 trích, không đếm lại); **prune lần 35**; #60 đã giết holder (stale-lock thu hồi đúng); #61 không giết holder.
- **T0-160:** boot #61 xác nhận 7 nguồn độc lập; journal first entry 05:26:00Z (lag +11 s sau btime); `--list-boots` chỉ còn 1 boot.

## 6. Sai số của chính T9 (ghi rõ)

- **F-160-T9-1 — Cửa sổ thoáng headroom sau reboot #61 KHÔNG được quan sát (T9 mở muộn):** T9 khởi động sampler 05:39:41Z (boot+13m52s), lần đo headroom đầu 05:40:07Z (boot+14m18s) — quá muộn so với cửa sổ thoáng 1–3 phút sau boot của đợt 159 (thoáng 23.503 lúc boot+~95 s, về 0 lúc boot+148 s). Ngay cả đợt mở 05:35:51Z cũng đã là boot+10m02s. **Không có số đo headroom nào của T9 trong 13 phút đầu sau boot #61** — không thể kết luận cửa sổ thoáng có tồn tại trên #61 hay không, cũng không thể kết luận bảng đầy lại trong bao lâu. Mốc sớm nhất: dòng ENOSPC đầu 05:36:52Z (boot+11m03s) — bảng đã đầy (hoặc gần đầy tới mức systemd lỗi) chậm nhất lúc đó. Giá trị mở phiên 0 (05:40:07Z) và ổn định 2 sau đó là số đo thật, không bị ảnh hưởng bởi khoảng trống này.
- **F-160-T9-2 — Nghịch lý headroom 2 nhưng ENOSPC vẫn tiếp tục ~28 phút (06:10:37–06:38:11Z), ĐÃ GHI ĐÚNG TRONG §1.2/§4 (không giấu):** headroom đo được 2 từ 06:10:37Z, nhưng journal vẫn ghi thêm 16 dòng ENOSPC tới 06:38:11Z rồi mới dừng hẳn. T9 không biết cơ chế (holder ngoài cell lấy lại slot ngay sau probe nhả? service ngừng thử sau 06:38:11Z?) — chỉ ghi hai dãy số đo độc lập. **Nguy cơ đọc nhầm:** nếu chỉ nhìn headroom 2 mà không nhìn journal sẽ tưởng systemd đã thêm watch được từ 06:10Z — sai; journal chứng minh lỗi thật còn tiếp diễn tới 06:38:11Z.
- **F-160-T9-3 — Lệnh chờ của chính T9 lọt snapshot B2 (cùng họ F-159-T9-2), BẮT ĐƯỢC VÀ GHI RÕ TRƯỚC KHI ĐÓNG (không ảnh hưởng số cuối):** `sleep 1800` / `sleep 2100` của T9 xuất hiện trong snapshot `top` của b2-spikes.log (pid 3970 `sleep`, trong spike 7 và 8) ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep; 0 dòng nào nhắc `ps -eo pid`** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `^=== SPIKE` = **15** ngay từ đầu. **Fix (n) (loại `ps` của watcher) vẫn đứng:** lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log.
- **F-160-T9-4 — Watcher B2 khởi động muộn ~24 s so với sampler + lần khởi động đầu lỗi đường dẫn (cùng lớp F-158-T9-6):** lần khởi động watcher đầu (05:39:44Z) dùng đường dẫn tương đối `b2-watcher.sh` / `k8-headroom.py` trong khi `cd ... && ... &` đã tách shell — file không tìm thấy, watcher không chạy; T9 phát hiện khi kiểm `ps` lúc 05:40:07Z (chỉ thấy sampler pid 3133) và khởi động lại watcher bằng đường dẫn tuyệt đối lúc ~05:40:05Z (pid 3458). Sampler đã ghi load1 5,97 lúc 05:39:41Z — **có thể 1 spike đã xảy ra trong khoảng 05:39:41–05:40:05Z mà watcher chưa chạy nên không bắt được** (không chứng minh được; spike đầu tiên watcher bắt là 05:40:05Z load1 6,92). Sau đó watcher chạy liên tục tới lúc đóng, không gap (không reboot giữa phiên). Bài học: khởi động sampler + watcher bằng đường dẫn tuyệt đối ngay từ đầu, kiểm `ps` cả hai trước khi đo headroom.
- **F-160-T9-5 — ENOSPC boot #60: số cuối KHÔNG kiểm lại được + phần tăng sau 04:55:08Z MẤT theo reboot #61.** T9-159 đếm 78 dòng lúc 04:55:08Z; từ 04:55:08Z tới reboot 05:25:49Z còn ~31 phút chưa đếm (~22 dòng theo cadence ~82 s/dòng) — journal boot #60 đã mất theo reboot (T0-160 xác nhận `--list-boots` chỉ còn 1 boot); T9 KHÔNG cộng số ước vào tổng. Tổng phiên ≥110 là CẬN DƯỚI (mỗi boot lấy số đếm cuối quan sát được).
- **F-160-T9-6 — Lệnh `pkill -f "bash sampler.sh"` lúc đóng giết cả shell của chính T9 (mẫu F-159-T9-6, khác nguyên nhân):** pattern pkill khớp cả dòng lệnh của exec đang chạy (chứa chuỗi `bash sampler.sh`) nên shell T9 bị SIGTERM; sampler pid 3133 cũng chết theo pkill lúc ~07:51:4x (trước mẫu kế tiếp 07:51:45Z — mẫu này không được ghi). **Không mất mẫu trong cửa sổ đo:** bản FROZEN đã copy lúc 07:51:23Z (132 mẫu, tới 07:50:45Z) TRƯỚC khi pkill; mẫu 07:51:45Z nằm ngoài cửa sổ đóng (sau lần đo headroom đóng 07:51:23Z). Bài học: dừng sampler/watcher bằng kill theo PID đã biết, không dùng pkill -f với chuỗi trùng lệnh của chính mình.
- **F-160-T9-7 — 5 chuỗi đếm là 1 episode (4 dip nông tới 93,9% / 94,3% / 94,5% / 97,0%): T9 phán, giao T10-160 xác nhận.** Theo quy tắc (g) đợt 152 + tiền lệ đợt 157 (dip tới 94,4%), đợt 158 (dip tới 94,5% / 97,4%) và đợt 159 (dip tới 94,5% / 94,4% — quyết parent (k) đợt 159 §12.3 đã CHẤP NHẬN). Dip 4 đợt này (93,9%, 4 mẫu) là dip nông nhất trong ba đợt 158–160 nhưng vẫn trên 93% trần, RAM trong dip tối đa 871.568 kB, gate A không mở lần nào — cùng bản chất: không xả sâu. Dip 3 (97,0%, 3 mẫu) có mẫu 07:20:44Z chỉ thấp hơn trần 728 kB (99,99%) — gần như không phải dip. Nếu T10/parent phán một hoặc nhiều dip là xả (đủ tách episode) thì đợt 160 = **2–5 episode** thay vì 1 — T9 ghi rõ để T10 phán, không giấu điểm khác biệt. Thêm: điểm đứt của episode QUAN SÁT ĐƯỢC 07:50:45Z (khác đợt 159 chuỗi 4 còn mở lúc đóng) — episode vẫn đếm là 1 vì 5 chuỗi nối nhau bằng dip nông trên cùng boot, không vì điểm đứt.
- **F-160-T9-8 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ mười bốn liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-160-T9-9 — Khoảng trống lấy mẫu 60 giây (cùng lớp F-159-T9-9):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Đợt này KHÔNG có gap reboot (không reboot giữa phiên) — khoảng trống duy nhất là cadence 60 s + khoảng mù watcher 24 s đầu phiên (F-160-T9-4).
- **F-160-T9-10 — Chuỗi 4 đợt 159: điểm đứt KHÔNG quan sát được (khoảng trống phủ sóng giữa hai đợt):** không có sampler T9 nào chạy 04:55:08–05:39:41Z; reboot #61 cắt ngang khoảng trống. T9-160 chỉ xác nhận "không quan sát được", không ước đoán thời điểm đứt hay mức xả — giao T10 ghi nhận (số đợt 159 đã được quyết parent (k) chấp nhận, không đổi lại).
- **F-160-T9-11 — Nhãn đường dẫn cũ trong file stats-final.txt (lỗi nhỏ, đã sửa khi đưa vào phụ lục):** script `stats-appendix.py` (copy từ đợt 159) ghi cứng chuỗi `hidden_files/round159-t9/ram-sampler-FROZEN.log` trong dòng "(File gốc: ...)" của phụ lục — đường dẫn argv trong cùng dòng đã đúng (`round160-t9`). T9 đã sửa nhãn này khi đưa bảng vào Phụ lục A dưới đây; số liệu bảng không bị ảnh hưởng (đọc từ file round160-t9 thật). T9 đợt sau nên sed script trước khi chạy.

Thống kê: samples: 132 (132 mau boot 52c957d5); mem min: 458,636 kB (447.9 MiB) luc 07:49:44Z; mem max: 2,967,256 kB (2897.7 MiB = 47.16% guard) luc 06:05:42Z; mem mean: 908616 kB (887.3 MiB); count >=1024 MiB (gate A): 36/132; count >= guard 6144 MiB: 0/132; balloon frozen 6,443,824: 56/132 (chuoi 1: 06:39:43Z–06:45:43Z n=7; chuoi 2: 06:50:43Z–07:01:44Z n=12; chuoi 3: 07:06:44Z–07:17:44Z n=12; chuoi 4: 07:21:44Z–07:33:44Z n=13; chuoi 5: 07:38:44Z–07:49:44Z n=12; dut quan sat duoc 07:50:45Z); balloon min: 3,905,376 kB luc 06:05:42Z; balloon max: 6,443,824 kB; load1 max (sampler): 7.21 luc 05:47:42Z; load1 >=3.0 samples: 9/132; max inter-sample gap: 61 s (05:43:41Z -> 05:44:42Z, 52c957d5 -> 52c957d5); gaps >90s: khong co

## Phụ lục A — Bảng sampler đầy đủ (132 mau: 132 mau boot 52c957d5; khong gap >90 s)

(File gốc: `hidden_files/round160-t9/ram-sampler-FROZEN.log` (argv: /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round160-t9/ram-sampler-FROZEN.log) — bảng dưới đây trích đúng file đó.)

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-21T05:39:41Z | 52c957d5 | 1,488,824 | 1453.9 | 23.66% | 5,283,516 | 847,068 | 5.97 |
| 2 | 2026-11-21T05:40:41Z | 52c957d5 | 1,556,512 | 1520.0 | 24.74% | 4,943,952 | 802,628 | 7.00 |
| 3 | 2026-11-21T05:41:41Z | 52c957d5 | 1,689,232 | 1649.6 | 26.85% | 4,933,476 | 803,904 | 4.81 |
| 4 | 2026-11-21T05:42:41Z | 52c957d5 | 1,859,464 | 1815.9 | 29.56% | 4,677,748 | 810,480 | 2.61 |
| 5 | 2026-11-21T05:43:41Z | 52c957d5 | 1,923,472 | 1878.4 | 30.57% | 4,632,932 | 821,248 | 1.70 |
| 6 | 2026-11-21T05:44:42Z | 52c957d5 | 2,384,988 | 2329.1 | 37.91% | 4,249,256 | 800,776 | 1.06 |
| 7 | 2026-11-21T05:45:42Z | 52c957d5 | 2,079,532 | 2030.8 | 33.05% | 4,492,248 | 802,116 | 2.27 |
| 8 | 2026-11-21T05:46:42Z | 52c957d5 | 2,170,436 | 2119.6 | 34.50% | 4,450,696 | 793,432 | 6.48 |
| 9 | 2026-11-21T05:47:42Z | 52c957d5 | 2,012,576 | 1965.4 | 31.99% | 4,682,232 | 748,348 | 7.21 |
| 10 | 2026-11-21T05:48:42Z | 52c957d5 | 1,617,960 | 1580.0 | 25.72% | 4,887,320 | 737,080 | 7.21 |
| 11 | 2026-11-21T05:49:42Z | 52c957d5 | 1,674,212 | 1635.0 | 26.61% | 5,095,788 | 728,036 | 4.21 |
| 12 | 2026-11-21T05:50:42Z | 52c957d5 | 1,494,252 | 1459.2 | 23.75% | 5,291,600 | 732,924 | 3.90 |
| 13 | 2026-11-21T05:51:42Z | 52c957d5 | 1,263,204 | 1233.6 | 20.08% | 5,469,112 | 732,624 | 3.64 |
| 14 | 2026-11-21T05:52:42Z | 52c957d5 | 1,213,628 | 1185.2 | 19.29% | 5,631,636 | 734,016 | 2.14 |
| 15 | 2026-11-21T05:53:42Z | 52c957d5 | 1,035,584 | 1011.3 | 16.46% | 5,782,912 | 734,364 | 0.96 |
| 16 | 2026-11-21T05:54:42Z | 52c957d5 | 951,744 | 929.4 | 15.13% | 5,917,636 | 727,876 | 0.85 |
| 17 | 2026-11-21T05:55:42Z | 52c957d5 | 1,071,852 | 1046.7 | 17.04% | 5,798,432 | 668,780 | 1.34 |
| 18 | 2026-11-21T05:56:42Z | 52c957d5 | 1,253,132 | 1223.8 | 19.92% | 5,591,040 | 658,844 | 1.00 |
| 19 | 2026-11-21T05:57:42Z | 52c957d5 | 1,142,388 | 1115.6 | 18.16% | 5,746,220 | 655,248 | 1.65 |
| 20 | 2026-11-21T05:58:42Z | 52c957d5 | 991,912 | 968.7 | 15.77% | 5,886,388 | 648,992 | 1.04 |
| 21 | 2026-11-21T05:59:42Z | 52c957d5 | 876,576 | 856.0 | 13.93% | 6,012,368 | 649,152 | 0.48 |
| 22 | 2026-11-21T06:00:42Z | 52c957d5 | 999,124 | 975.7 | 15.88% | 5,904,348 | 650,800 | 0.99 |
| 23 | 2026-11-21T06:01:42Z | 52c957d5 | 1,175,492 | 1147.9 | 18.68% | 4,939,320 | 619,068 | 1.18 |
| 24 | 2026-11-21T06:02:42Z | 52c957d5 | 1,129,488 | 1103.0 | 17.95% | 4,848,640 | 617,984 | 2.75 |
| 25 | 2026-11-21T06:03:42Z | 52c957d5 | 1,630,168 | 1592.0 | 25.91% | 5,028,556 | 619,012 | 1.22 |
| 26 | 2026-11-21T06:04:42Z | 52c957d5 | 1,448,500 | 1414.6 | 23.02% | 5,215,924 | 620,544 | 0.45 |
| 27 | 2026-11-21T06:05:42Z | 52c957d5 | 2,967,256 | 2897.7 | 47.16% | 3,905,376 | 630,152 | 0.79 |
| 28 | 2026-11-21T06:06:42Z | 52c957d5 | 2,725,040 | 2661.2 | 43.31% | 4,115,396 | 638,504 | 0.44 |
| 29 | 2026-11-21T06:07:42Z | 52c957d5 | 2,348,276 | 2293.2 | 37.32% | 4,403,416 | 644,040 | 0.25 |
| 30 | 2026-11-21T06:08:42Z | 52c957d5 | 2,161,348 | 2110.7 | 34.35% | 4,661,216 | 649,488 | 0.19 |
| 31 | 2026-11-21T06:09:42Z | 52c957d5 | 1,842,596 | 1799.4 | 29.29% | 4,897,088 | 650,880 | 0.18 |
| 32 | 2026-11-21T06:10:42Z | 52c957d5 | 1,628,860 | 1590.7 | 25.89% | 5,105,832 | 659,644 | 0.76 |
| 33 | 2026-11-21T06:11:42Z | 52c957d5 | 1,519,160 | 1483.6 | 24.15% | 5,298,132 | 663,428 | 0.66 |
| 34 | 2026-11-21T06:12:42Z | 52c957d5 | 1,381,544 | 1349.2 | 21.96% | 5,480,540 | 665,880 | 0.34 |
| 35 | 2026-11-21T06:13:42Z | 52c957d5 | 991,204 | 968.0 | 15.75% | 5,078,784 | 602,040 | 1.29 |
| 36 | 2026-11-21T06:14:42Z | 52c957d5 | 1,233,684 | 1204.8 | 19.61% | 4,796,628 | 595,348 | 2.85 |
| 37 | 2026-11-21T06:15:42Z | 52c957d5 | 2,258,668 | 2205.7 | 35.90% | 4,621,156 | 605,260 | 2.31 |
| 38 | 2026-11-21T06:16:42Z | 52c957d5 | 1,333,960 | 1302.7 | 21.20% | 4,818,460 | 605,532 | 1.82 |
| 39 | 2026-11-21T06:17:43Z | 52c957d5 | 1,222,556 | 1193.9 | 19.43% | 5,001,512 | 603,788 | 1.12 |
| 40 | 2026-11-21T06:18:43Z | 52c957d5 | 1,028,244 | 1004.1 | 16.34% | 5,148,296 | 603,352 | 1.37 |
| 41 | 2026-11-21T06:19:43Z | 52c957d5 | 1,511,892 | 1476.5 | 24.03% | 5,305,244 | 612,688 | 0.98 |
| 42 | 2026-11-21T06:20:43Z | 52c957d5 | 804,708 | 785.8 | 12.79% | 5,426,316 | 610,052 | 1.62 |
| 43 | 2026-11-21T06:21:43Z | 52c957d5 | 764,124 | 746.2 | 12.15% | 5,535,616 | 611,308 | 2.36 |
| 44 | 2026-11-21T06:22:43Z | 52c957d5 | 704,200 | 687.7 | 11.19% | 5,648,644 | 611,924 | 1.36 |
| 45 | 2026-11-21T06:23:43Z | 52c957d5 | 821,964 | 802.7 | 13.06% | 5,751,312 | 603,856 | 0.65 |
| 46 | 2026-11-21T06:24:43Z | 52c957d5 | 1,041,528 | 1017.1 | 16.55% | 5,076,936 | 577,972 | 1.61 |
| 47 | 2026-11-21T06:25:43Z | 52c957d5 | 1,009,432 | 985.8 | 16.04% | 5,182,388 | 587,096 | 1.67 |
| 48 | 2026-11-21T06:26:43Z | 52c957d5 | 668,584 | 652.9 | 10.63% | 5,315,036 | 587,348 | 1.63 |
| 49 | 2026-11-21T06:27:43Z | 52c957d5 | 943,220 | 921.1 | 14.99% | 5,458,692 | 586,548 | 2.46 |
| 50 | 2026-11-21T06:28:43Z | 52c957d5 | 579,892 | 566.3 | 9.22% | 5,467,736 | 577,224 | 2.04 |
| 51 | 2026-11-21T06:29:43Z | 52c957d5 | 643,784 | 628.7 | 10.23% | 5,569,520 | 576,960 | 1.68 |
| 52 | 2026-11-21T06:30:43Z | 52c957d5 | 564,548 | 551.3 | 8.97% | 5,677,844 | 573,024 | 1.67 |
| 53 | 2026-11-21T06:31:43Z | 52c957d5 | 1,306,680 | 1276.1 | 20.77% | 5,535,688 | 580,136 | 0.99 |
| 54 | 2026-11-21T06:32:43Z | 52c957d5 | 1,153,128 | 1126.1 | 18.33% | 5,690,500 | 583,880 | 0.45 |
| 55 | 2026-11-21T06:33:43Z | 52c957d5 | 1,045,436 | 1020.9 | 16.62% | 5,833,912 | 585,124 | 0.22 |
| 56 | 2026-11-21T06:34:43Z | 52c957d5 | 864,448 | 844.2 | 13.74% | 5,963,508 | 588,396 | 0.13 |
| 57 | 2026-11-21T06:35:43Z | 52c957d5 | 881,616 | 861.0 | 14.01% | 6,086,316 | 712,080 | 0.29 |
| 58 | 2026-11-21T06:36:43Z | 52c957d5 | 753,540 | 735.9 | 11.98% | 6,202,980 | 717,552 | 0.29 |
| 59 | 2026-11-21T06:37:43Z | 52c957d5 | 628,336 | 613.6 | 9.99% | 6,308,432 | 716,340 | 0.49 |
| 60 | 2026-11-21T06:38:43Z | 52c957d5 | 570,280 | 556.9 | 9.06% | 6,405,820 | 732,392 | 0.37 |
| 61 | 2026-11-21T06:39:43Z | 52c957d5 | 511,356 | 499.4 | 8.13% | 6,443,824 | 732,544 | 0.22 |
| 62 | 2026-11-21T06:40:43Z | 52c957d5 | 526,316 | 514.0 | 8.37% | 6,443,824 | 736,824 | 0.16 |
| 63 | 2026-11-21T06:41:43Z | 52c957d5 | 501,728 | 490.0 | 7.97% | 6,443,824 | 737,204 | 0.27 |
| 64 | 2026-11-21T06:42:43Z | 52c957d5 | 494,592 | 483.0 | 7.86% | 6,443,824 | 739,416 | 0.25 |
| 65 | 2026-11-21T06:43:43Z | 52c957d5 | 507,480 | 495.6 | 8.07% | 6,443,824 | 737,544 | 0.16 |
| 66 | 2026-11-21T06:44:43Z | 52c957d5 | 503,568 | 491.8 | 8.00% | 6,443,824 | 737,820 | 0.22 |
| 67 | 2026-11-21T06:45:43Z | 52c957d5 | 491,608 | 480.1 | 7.81% | 6,443,824 | 738,112 | 0.16 |
| 68 | 2026-11-21T06:46:43Z | 52c957d5 | 933,072 | 911.2 | 14.83% | 6,078,708 | 656,172 | 0.84 |
| 69 | 2026-11-21T06:47:43Z | 52c957d5 | 836,280 | 816.7 | 13.29% | 6,158,816 | 643,612 | 0.91 |
| 70 | 2026-11-21T06:48:43Z | 52c957d5 | 690,724 | 674.5 | 10.98% | 6,269,596 | 646,312 | 0.38 |
| 71 | 2026-11-21T06:49:43Z | 52c957d5 | 577,896 | 564.4 | 9.19% | 6,369,164 | 649,264 | 0.20 |
| 72 | 2026-11-21T06:50:43Z | 52c957d5 | 521,404 | 509.2 | 8.29% | 6,443,824 | 648,256 | 0.15 |
| 73 | 2026-11-21T06:51:43Z | 52c957d5 | 549,448 | 536.6 | 8.73% | 6,443,824 | 647,672 | 0.09 |
| 74 | 2026-11-21T06:52:43Z | 52c957d5 | 513,120 | 501.1 | 8.16% | 6,443,824 | 645,672 | 0.03 |
| 75 | 2026-11-21T06:53:43Z | 52c957d5 | 498,584 | 486.9 | 7.92% | 6,443,824 | 646,080 | 0.08 |
| 76 | 2026-11-21T06:54:43Z | 52c957d5 | 532,880 | 520.4 | 8.47% | 6,443,824 | 647,444 | 0.60 |
| 77 | 2026-11-21T06:55:43Z | 52c957d5 | 532,180 | 519.7 | 8.46% | 6,443,824 | 643,588 | 1.91 |
| 78 | 2026-11-21T06:56:43Z | 52c957d5 | 531,524 | 519.1 | 8.45% | 6,443,824 | 644,968 | 2.00 |
| 79 | 2026-11-21T06:57:43Z | 52c957d5 | 498,676 | 487.0 | 7.93% | 6,443,824 | 647,440 | 1.93 |
| 80 | 2026-11-21T06:58:43Z | 52c957d5 | 483,612 | 472.3 | 7.69% | 6,443,824 | 647,648 | 1.34 |
| 81 | 2026-11-21T06:59:43Z | 52c957d5 | 495,436 | 483.8 | 7.87% | 6,443,824 | 646,144 | 1.17 |
| 82 | 2026-11-21T07:00:44Z | 52c957d5 | 489,520 | 478.0 | 7.78% | 6,443,824 | 653,808 | 1.37 |
| 83 | 2026-11-21T07:01:44Z | 52c957d5 | 484,524 | 473.2 | 7.70% | 6,443,824 | 653,956 | 1.41 |
| 84 | 2026-11-21T07:02:44Z | 52c957d5 | 874,144 | 853.7 | 13.89% | 6,091,896 | 645,916 | 2.05 |
| 85 | 2026-11-21T07:03:44Z | 52c957d5 | 758,972 | 741.2 | 12.06% | 6,208,164 | 639,108 | 2.15 |
| 86 | 2026-11-21T07:04:44Z | 52c957d5 | 664,784 | 649.2 | 10.57% | 6,312,796 | 636,712 | 0.96 |
| 87 | 2026-11-21T07:05:44Z | 52c957d5 | 557,312 | 544.2 | 8.86% | 6,409,468 | 634,888 | 0.80 |
| 88 | 2026-11-21T07:06:44Z | 52c957d5 | 500,280 | 488.6 | 7.95% | 6,443,824 | 635,576 | 0.49 |
| 89 | 2026-11-21T07:07:44Z | 52c957d5 | 517,000 | 504.9 | 8.22% | 6,443,824 | 634,912 | 0.46 |
| 90 | 2026-11-21T07:08:44Z | 52c957d5 | 512,572 | 500.6 | 8.15% | 6,443,824 | 634,256 | 0.17 |
| 91 | 2026-11-21T07:09:44Z | 52c957d5 | 497,360 | 485.7 | 7.91% | 6,443,824 | 637,280 | 0.06 |
| 92 | 2026-11-21T07:10:44Z | 52c957d5 | 504,572 | 492.7 | 8.02% | 6,443,824 | 636,544 | 0.09 |
| 93 | 2026-11-21T07:11:44Z | 52c957d5 | 502,628 | 490.8 | 7.99% | 6,443,824 | 635,528 | 0.33 |
| 94 | 2026-11-21T07:12:44Z | 52c957d5 | 508,404 | 496.5 | 8.08% | 6,443,824 | 635,676 | 0.24 |
| 95 | 2026-11-21T07:13:44Z | 52c957d5 | 514,616 | 502.6 | 8.18% | 6,443,824 | 635,960 | 0.08 |
| 96 | 2026-11-21T07:14:44Z | 52c957d5 | 494,540 | 482.9 | 7.86% | 6,443,824 | 636,756 | 0.03 |
| 97 | 2026-11-21T07:15:44Z | 52c957d5 | 508,972 | 497.0 | 8.09% | 6,443,824 | 634,988 | 0.01 |
| 98 | 2026-11-21T07:16:44Z | 52c957d5 | 506,860 | 495.0 | 8.06% | 6,443,824 | 636,592 | 0.04 |
| 99 | 2026-11-21T07:17:44Z | 52c957d5 | 496,160 | 484.5 | 7.89% | 6,443,824 | 635,704 | 0.12 |
| 100 | 2026-11-21T07:18:44Z | 52c957d5 | 749,208 | 731.6 | 11.91% | 6,247,216 | 617,444 | 0.85 |
| 101 | 2026-11-21T07:19:44Z | 52c957d5 | 619,172 | 604.7 | 9.84% | 6,350,208 | 612,824 | 0.68 |
| 102 | 2026-11-21T07:20:44Z | 52c957d5 | 518,616 | 506.5 | 8.24% | 6,443,096 | 610,252 | 0.32 |
| 103 | 2026-11-21T07:21:44Z | 52c957d5 | 518,544 | 506.4 | 8.24% | 6,443,824 | 612,336 | 0.22 |
| 104 | 2026-11-21T07:22:44Z | 52c957d5 | 502,940 | 491.2 | 7.99% | 6,443,824 | 617,160 | 0.18 |
| 105 | 2026-11-21T07:23:44Z | 52c957d5 | 502,572 | 490.8 | 7.99% | 6,443,824 | 620,284 | 0.11 |
| 106 | 2026-11-21T07:24:44Z | 52c957d5 | 503,328 | 491.5 | 8.00% | 6,443,824 | 620,324 | 0.04 |
| 107 | 2026-11-21T07:25:44Z | 52c957d5 | 518,396 | 506.2 | 8.24% | 6,443,824 | 621,520 | 0.26 |
| 108 | 2026-11-21T07:26:44Z | 52c957d5 | 483,744 | 472.4 | 7.69% | 6,443,824 | 621,256 | 0.24 |
| 109 | 2026-11-21T07:27:44Z | 52c957d5 | 484,428 | 473.1 | 7.70% | 6,443,824 | 621,316 | 0.09 |
| 110 | 2026-11-21T07:28:44Z | 52c957d5 | 488,888 | 477.4 | 7.77% | 6,443,824 | 621,584 | 0.03 |
| 111 | 2026-11-21T07:29:44Z | 52c957d5 | 476,860 | 465.7 | 7.58% | 6,443,824 | 621,596 | 0.04 |
| 112 | 2026-11-21T07:30:44Z | 52c957d5 | 499,548 | 487.8 | 7.94% | 6,443,824 | 621,836 | 0.12 |
| 113 | 2026-11-21T07:31:44Z | 52c957d5 | 487,988 | 476.6 | 7.76% | 6,443,824 | 622,500 | 0.04 |
| 114 | 2026-11-21T07:32:44Z | 52c957d5 | 485,744 | 474.4 | 7.72% | 6,443,824 | 624,016 | 0.15 |
| 115 | 2026-11-21T07:33:44Z | 52c957d5 | 482,736 | 471.4 | 7.67% | 6,443,824 | 623,944 | 0.05 |
| 116 | 2026-11-21T07:34:44Z | 52c957d5 | 871,568 | 851.1 | 13.85% | 6,050,608 | 610,372 | 0.94 |
| 117 | 2026-11-21T07:35:44Z | 52c957d5 | 843,892 | 824.1 | 13.41% | 6,131,460 | 667,428 | 0.52 |
| 118 | 2026-11-21T07:36:44Z | 52c957d5 | 750,236 | 732.7 | 11.92% | 6,249,160 | 684,252 | 0.19 |
| 119 | 2026-11-21T07:37:44Z | 52c957d5 | 659,116 | 643.7 | 10.48% | 6,354,376 | 684,744 | 0.07 |
| 120 | 2026-11-21T07:38:44Z | 52c957d5 | 554,428 | 541.4 | 8.81% | 6,443,824 | 685,468 | 0.02 |
| 121 | 2026-11-21T07:39:44Z | 52c957d5 | 519,924 | 507.7 | 8.26% | 6,443,824 | 704,532 | 0.01 |
| 122 | 2026-11-21T07:40:44Z | 52c957d5 | 540,824 | 528.1 | 8.60% | 6,443,824 | 723,456 | 0.00 |
| 123 | 2026-11-21T07:41:44Z | 52c957d5 | 555,868 | 542.8 | 8.84% | 6,443,824 | 724,240 | 0.00 |
| 124 | 2026-11-21T07:42:44Z | 52c957d5 | 525,480 | 513.2 | 8.35% | 6,443,824 | 729,456 | 0.00 |
| 125 | 2026-11-21T07:43:44Z | 52c957d5 | 506,668 | 494.8 | 8.05% | 6,443,824 | 729,688 | 0.00 |
| 126 | 2026-11-21T07:44:44Z | 52c957d5 | 526,720 | 514.4 | 8.37% | 6,443,824 | 729,724 | 0.00 |
| 127 | 2026-11-21T07:45:44Z | 52c957d5 | 518,692 | 506.5 | 8.24% | 6,443,824 | 730,032 | 0.00 |
| 128 | 2026-11-21T07:46:44Z | 52c957d5 | 505,204 | 493.4 | 8.03% | 6,443,824 | 730,264 | 0.00 |
| 129 | 2026-11-21T07:47:44Z | 52c957d5 | 496,224 | 484.6 | 7.89% | 6,443,824 | 716,256 | 0.21 |
| 130 | 2026-11-21T07:48:44Z | 52c957d5 | 473,296 | 462.2 | 7.52% | 6,443,824 | 719,180 | 0.12 |
| 131 | 2026-11-21T07:49:44Z | 52c957d5 | 458,636 | 447.9 | 7.29% | 6,443,824 | 696,156 | 0.19 |
| 132 | 2026-11-21T07:50:45Z | 52c957d5 | 645,172 | 630.1 | 10.25% | 6,247,216 | 648,052 | 0.63 |
