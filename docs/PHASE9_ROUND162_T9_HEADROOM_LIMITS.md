# LIMITS — Phase 9 đợt 162, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ mười sáu liên tiếp; headroom 0, dưới ngưỡng lần thứ 22 liên tiếp; balloon 1 EPISODE MỚI, 66/139 mẫu, 3 chuỗi, 1 boot #64, CÒN MỞ lúc đóng; ENOSPC 121 dòng trên boot #64; lượt yên #31 CÓ lượt hợp lệ #27)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 0 (11/12 lần đo), một lần thoáng 2 ở probe thứ hai của cặp mở (11:37:48Z) rồi về 0 và GIỮ 0 tới lúc đóng (13:55:56Z)** — **giá trị ổn định 0, dưới ngưỡng < ~1.800 lần thứ hai mươi hai liên tiếp** (xem §1.2, F-162-T9-1). Tỉ lệ/vite **0 / 1.578 = 0** — một vite mới (~1.578 watch) vẫn không khởi động được. Trần 63.747 không đổi. Quyết (k) đợt 161 "GIỮ quyết (l) chỉ theo dõi" đứng, không hành động. Xem §1.
- **Balloon 1 EPISODE MỚI, 66/139 mẫu (47,5%), 3 chuỗi, MỘT boot (#64):** chạm trần lần đầu 12:47:45Z (chuỗi 1 chỉ 1 mẫu) → dip1 97,5% (2 mẫu) → chuỗi 2 dài 55 mẫu (12:50:45–13:44:46Z) → dip2 99,0% (1 mẫu) → chuỗi 3 dài 10 mẫu (13:46:46–13:55:46Z), **CÒN MỞ lúc T9 đóng**. Gate A KHÔNG mở trong cả hai dip nên KHÔNG tách theo tiêu chí cứng đứng (quyết (j) đợt 161) — đợt này = **1 episode**. Tỉ lệ ghim 47,5% là cao thứ ba trong chuỗi gần đây (đợt 154: 52,0%; đợt 153: 49,6%). Xem §2.2.
- **E2/E3 đợt 161 (theo dõi): E2 đứt KHÔNG quan sát được (cắt bởi reboot #63) — giữ nguyên kết luận đợt 161. E3 (còn mở lúc T9-161 đóng 10:56:00Z) đứt KHÔNG quan sát được** — balloon lúc T9-162 mở (11:37:42Z) đã là 5.498.744 kB (85,3% trần), tức E3 đã kết thúc trước đó; khoảng trống không quan sát 10:56:00Z → 11:37:42Z (41m42s) có chứa reboot #64 (11:15:18Z) — điểm đứt E3 không xác định được trong khoảng đó. Xem §2.2, F-162-T9-7.
- **RAM:** sampler **139 mẫu, 11:37:42Z–13:55:46Z, MỘT boot (#64: d9a8d1ce), 0 reboot giữa phiên**. Min **385.484 kB (376,5 MiB) lúc 12:28:44Z** (trước khi ghim, balloon 6.026.336 kB); max **3.338.996 kB (3.260,7 MiB = 53,07% guard) lúc 11:50:43Z** (sau bão mở đợt, balloon xả sâu nhất phiên 3.485.712 kB); mean 956.761 kB. Gate A ≥1024 MiB: **36/139 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ mười sáu liên tiếp.** Xem §2, §3.
- **B2: 17 spike, TẤT CẢ QUY ĐƯỢC DRIVER CỤ THỂ.** Bão mở đợt: 15 spike liên tục 11:37:42–11:46:00Z (apt-get replay T5 + suite T1 + điều tra T2 + hatch daemon, load1 đỉnh 8,91); spike 16 (12:11:06Z, Chromium renderer của O8, delta 31 — NẰM TRONG cửa sổ O8, khác đợt 161); spike 17 (12:32:42Z, chrome gpu-process harness 85m4, delta 88). **0 spike trong cửa sổ ghim (12:47:45–13:55:46Z), 0 spike trong cửa sổ attempt T4 (11:54:39–11:58:30Z), 0 spike trong cửa sổ kẹt 86n2 (12:18:23–12:24:54Z).** Delta tick lớn nhất 125 tick/s (ffmpeg encode). Xem §2.5.
- **Lượt yên WebKit #31 (T4): CÓ LƯỢT HỢP LỆ #27 — chuỗi lượt yên hợp lệ NỐI DÀI (#22 → … → #26 → #27).** Attempt1 (11:54:39–11:58:30Z) ĐẠT NGAY lần mở cửa đầu tiên (20/20, lớp B 5/5, tickCost median 42,0 ms ≤60); sampler T9 đối chiếu: gate A MỞ 4/4, 0 mẫu <512.000 kB, 0 spike B2 trong cửa sổ. Xem §2.3.
- **REBOOT #64 TRƯỚC PHIÊN (d9a8d1ce, btime /proc/stat 1795259718 = 11:15:18Z); 0 reboot giữa phiên T9.** T9 mở lúc boot+22m24s — **cửa sổ thoáng headroom sau reboot KHÔNG được quan sát lần thứ ba liên tiếp** (xem F-162-T9-1). T5-162: POSTBOOT_PASS #64 ĐÃ CÓ 11:40:00Z (boot+24m42s); watcher-162 khởi động tay 11:40:00Z pid 18801; POSTBOOT_PASS #63 là boot thứ 7 KHÔNG CỜ. Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: 121 dòng trên boot #64** (1 lúc 11:37:48Z → 27 → 53 → 79 → 105 → 121 lúc đóng 13:55:56Z; cadence ~69 s/dòng, đều cả phiên). **Đợt thứ mười một liên tiếp bảng watch cạn gây lỗi thật thấy được.** Phần còn lại của boot #63 sau khi T9-161 đóng (3 dòng lúc 10:55:51Z; T10-161 đếm lại 5 dòng lúc đóng) KHÔNG đếm được nữa — journal mất theo reboot #64 (xem F-162-T9-5). Xem §4.
- **T8-162 (đối chiếu):** O8 PASS 3/3 (WebKit 21/21 ×2 + Chromium 21/21, 12:09:10–12:11:47Z, boot #64, gate FOUND poll 25 lúc 12:02:43Z); harness 5/6 + **1 KẸT WebKit 86n2 P5-entry** (watchdog kích hoạt đúng 12:18:23Z; **live-diag kích hoạt thật lần đầu** 12:20:54Z + 12:24:54Z); chuỗi WebKit FULL PASS 16 → ? chờ T10/parent phán. Xem §5.3.
- **T7-162 (đối chiếu):** chưa có LIMITS lúc T9 đóng — kết cục run 161 vẫn thuộc T7-162. Xem §5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round162-t9/k8-headroom.py` (copy y nguyên từ đợt 161 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 162 (12 lần đo, 1 boot)

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 11:37:48Z 21/11 | **0** | #64 d9a8d1ce (btime 11:15:18Z) | lần đo 1, lúc mở (boot+22m30s); RAM trước đo 1.313.864 kB, balloon 5.498.744 kB, load1 3,09 (bão mở đợt) |
| 11:37:48Z 21/11 | **2** | #64 d9a8d1ce | lần đo 2 (chênh **+2** so với lần 1 — xem dưới) |
| 12:08:03Z 21/11 | **0** | #64 d9a8d1ce | lần đo 3, giữa phiên; balloon 5.821.296 kB (90,3% trần), RAM 1.021.960 kB |
| 12:08:03Z 21/11 | **0** | #64 d9a8d1ce | lần đo 4 (chênh **0** so với lần 3) |
| 12:38:03Z 21/11 | **0** | #64 d9a8d1ce | lần đo 5, giữa phiên; balloon 5.568.724 kB, RAM 700.176 kB |
| 12:38:03Z 21/11 | **0** | #64 d9a8d1ce | lần đo 6 (chênh **0** so với lần 5) |
| 13:08:04Z 21/11 | **0** | #64 d9a8d1ce | lần đo 7, giữa phiên; balloon ĐANG GHIM TRẦN (E-162), RAM 455.448 kB |
| 13:08:04Z 21/11 | **0** | #64 d9a8d1ce | lần đo 8 (chênh **0** so với lần 7) |
| 13:38:04Z 21/11 | **0** | #64 d9a8d1ce | lần đo 9, giữa phiên; balloon ĐANG GHIM TRẦN, RAM 498.868 kB |
| 13:38:04Z 21/11 | **0** | #64 d9a8d1ce | lần đo 10 (chênh **0** so với lần 9) |
| 13:55:56Z 21/11 | **0** | #64 d9a8d1ce | lần đo 11 (đóng phiên, boot+2h40m38s); balloon ĐANG GHIM TRẦN, RAM 473.428 kB |
| 13:55:56Z 21/11 | **0** | #64 d9a8d1ce | lần đo 12 (chênh **0** so với lần 11) |

- Probe dừng ở `i=0` trong 11/12 lần đo — `inotify_add_watch` đầu tiên trả errno 28 (không thêm được watch nào); dừng ở `i=2` trong lần đo 2 — đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi cặp đo).
- **Lần đo 2 = 2 là thoáng nhất thời (transient), không phải hồi phục:** cặp mở đo 0 rồi 2 trong cùng một giây (11:37:48Z), rồi 10 lần đo sau đó đều 0 trong suốt 2h18m còn lại — một holder ngoài cell đã nhả đúng 2 watch trong khoảnh khắc giữa hai lần đo của cặp mở, rồi bảng lại đầy hẳn trước lần đo 3 (12:08:03Z). T9 không biết holder nào (ngoài cell, không nhìn thấy) — chỉ ghi số đo + thời gian. **Giá trị ổn định đợt này là 0** (11/12 lần đo), khác đợt 161 (0 → 2 cuối phiên, giữ 2 qua cặp đóng) và đợt 160 (0 → 2 giữa phiên, giữ 2 tới đóng).
- **So sánh với đợt 161:** đợt 161 mở 0 → 0 kéo dài 8 lần đo trên #62 → 0 rồi 2 trên #63 sau reboot giữa phiên (10/12 lần đo 0, 2 lần 2 lúc đóng); đợt này mở 0 → 2 thoáng qua 1 lần → 0 suốt 10 lần đo còn lại trên MỘT boot, không reboot giữa phiên (11/12 lần đo 0). **Cửa sổ thoáng sau reboot KHÔNG được quan sát lần thứ ba liên tiếp** — đợt này T9 mở lúc boot+22m24s (sampler) / boot+22m30s (lần đo đầu), cửa sổ 1–3 phút sau boot đã qua từ lâu (xem F-162-T9-1).
- Số watch đang giữ ngoài cell suy ra lúc ổn định: 63.747 − 0 = **63.747 watch** (bảng đầy hẳn, 0 watch trống) lúc đóng.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **0 / 1.578 = 0** — một vite mới (~1.578 watch) vẫn không khởi động được (cần thêm ~1.578 slot).
- T5-162 KHÔNG probe lại headroom đợt này (như đợt 151–161) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 12 lần đo + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #64 có 121 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM lúc đóng (~473.428 kB, balloon đang ghim) thấp hơn nhiều RAM lúc mở (~1.313.864 kB) trong khi headroom 0 → 0 (trừ thoáng 2). Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–161 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 161 | 0 → 0 → 2 | mở 08:37:38Z boot #62 39d46ba0 btime ghi 07:59:29Z: 0 ×8 (08:37:38–10:07:59Z) → sau reboot #63 10:30:42Z boot MỚI 94d22520: 0, 0 lúc boot+2m43s (10:33:25Z) → đóng 10:55:51Z cùng boot #63: 2, 2 (MỘT reboot giữa phiên; 12 lần đo, 10 lần 0, 2 lần 2) |
| **162** | **0 → 0 (thoáng 2 một lần)** | **mở 11:37:48Z boot #64 d9a8d1ce btime 11:15:18Z: 0, 2 (cặp mở) → 0 ×10 (12:08:03–13:55:56Z) → đóng 13:55:56Z cùng boot #64: 0, 0 (KHÔNG reboot giữa phiên; 12 lần đo, 11 lần 0, 1 lần 2 thoáng qua)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 0 (lần đầu kể từ đợt 159 sau ba đợt đóng 2, 2, 2 ở các đợt 156/160/161 — xen giữa ba đợt 0 ở 157/158/159).** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**. Giá trị 2 chỉ xuất hiện 1 lần thoáng qua ở probe thứ hai của cặp mở, không giữ qua bất kỳ cặp đo nào sau đó — không phải hồi phục.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ hai mươi hai liên tiếp.** Quyết parent đợt 161 (k) GIỮ quyết (l) đợt 158 "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal boot #64 có 121 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ mười một liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 121 dòng — boot #64 còn sống lúc đóng nên số này còn tăng sau khi T9 đóng). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở 11:37:48Z, giữa phiên 12:08:03Z / 12:38:03Z / 13:08:04Z / 13:38:04Z và lúc đóng 13:55:56Z trên #64 — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.747 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.048.572 kB) — sampler 139 mẫu, 11:37:42Z–13:55:46Z, MỘT boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên (bão mở đợt, đỉnh 3.338.996 kB sau xả balloon) → balloon leo lại đều → ghim trần E-162 (66 mẫu) → còn mở lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất 61 s (4 gap 61 s do trễ 1 s); không gap >90 s** — xem §5.1). **139 mẫu, 11:37:42Z–13:55:46Z, MỘT boot (#64: d9a8d1ce).** Tổng quan: **min 385.484 kB (376,5 MiB) lúc 12:28:44Z** (trước khi ghim, balloon 6.026.336 kB); **max 3.338.996 kB (3.260,7 MiB) lúc 11:50:43Z — 53,07% guard** (sau bão mở đợt, balloon xả sâu nhất phiên 3.485.712 kB); **mean 956.761 kB (934,3 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 11:37:42–11:46:43Z | #64 | 1.223.288–2.939.528 kB | Mở phiên: BÃO MỞ ĐỢT (15 spike B2 liên tục, load1 tới 8,91 — xem §2.5); balloon xả 5.498.744 → 3.656.536 kB rồi leo lại; gate A MỞ 10/10 mẫu; load1 ≥3,0 ở 9/10 mẫu |
| 11:47:43–12:25:44Z | #64 | 385.484–3.338.996 kB | Yên sau bão: RAM đỉnh phiên 11:50:43Z (3.338.996 kB, balloon xả 3.485.712 kB); T4 attempt1 lượt yên #31 (11:54:39–11:58:30Z, HỢP LỆ #27 — xem §2.3); O8 (12:09:10–12:11:47Z, spike B2 16 lúc 12:11:06Z — xem §2.5); balloon leo đều 3,4M → 6,0M kB (chạm 6.026.336 kB lúc 12:28:44Z, đúng mẫu RAM min phiên); gate A MỞ 22/39 mẫu ngoài ghim |
| 12:26:44–12:46:45Z | #64 | 405.416–1.053.548 kB | Balloon leo sát trần (6.013.240 kB lúc 12:25:44Z → 6.419.208 kB = 99,6% trần lúc 12:46:45Z); RAM rơi dần; gate A MỞ 4/21 mẫu (cao nhất 1.053.548 kB lúc 12:26:44Z — xem §2.2); load1 ≤0,40 (yên hoàn toàn về tải) |
| 12:47:45–13:55:46Z | #64 | 450.908–633.440 kB | **Ghim trần E-162, 66 mẫu trong 3 chuỗi + 2 dip** (xem §2.2); **RAM min trong cửa sổ ghim 450.908 kB**; gate A ĐÓNG cả 69 mẫu cửa sổ (kể cả 3 mẫu dip); load1 ≤0,40; **RAM <512.000 kB: 59 mẫu trong cửa sổ này** |

- **Gate A ≥1024 MiB: 36/139 mẫu** (tất cả trên #64); **0 mẫu ≥ guard**; load1 max (sampler) **8,59 lúc 11:43:43Z** (bão mở đợt — watcher bắt 8,91 lúc 11:43:03Z, xem F-162-T9-6); **10/139 mẫu load1 ≥3,0** (9 mẫu bão mở đợt 11:37:42–11:45:43Z + 1 mẫu 12:32:44Z 3,34 — trùng spike B2 17). **RAM <512.000 kB: 67 mẫu** (64 trong cửa sổ ghim + 3 trong cửa sổ kẹt 86n2 12:22:44–12:24:44Z — xem §2.5); **RAM <300.000 kB: 0 mẫu** (đợt 161: 0 mẫu; đợt 158: 4 mẫu).
- Swap: SwapFree 762.604 kB (mẫu đầu) → 561.188 kB (thấp nhất phiên, lúc đóng cửa sổ kẹt 86n2) → 656.812 kB (mẫu cuối). Không có nhịp nhảy SwapFree sau reboot trong phiên này (không reboot giữa phiên — khác đợt 161).
- Mẫu 11:50:43Z (đỉnh phiên): RAM 3.338.996 kB, balloon xả 3.485.712 kB — balloon xả sâu nhất phiên ~4 phút sau bão mở đợt (cùng mẫu đợt 152–161: xả sâu sau attempt / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 385.484 kB (đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — 67 mẫu <512.000 kB trong 139 mẫu (48,2% — cao hơn hẳn đợt 161: 33 mẫu, 23,7%); riêng trong cửa sổ ghim: 59/69 mẫu <512.000 kB (85,5%). T8-162 đo độc lập RAM trong lúc O8/harness: xem §5.3 (sampler T9 là nguồn duy nhất cho trũng ghim).

### 2.2 Balloon virtio — 1 EPISODE MỚI, 66/139 mẫu, 3 chuỗi, MỘT boot (#64), CÒN MỞ lúc đóng

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #64 (d9a8d1ce): GHIM TRẦN 66/139 mẫu (47,5%), trong 3 chuỗi — 1 EPISODE (E-162):**
  - Leo lên trần từ 11:50:43Z (balloon xả sâu 3.485.712 kB) → 6.419.208 kB (99,6% trần) lúc 12:46:45Z trong ~56 phút, qua hai nhịp leo (xả–leo sau bão mở đợt, rồi leo đều từ 12:25:44Z).
  - **E-162 — chuỗi 1: 12:47:45Z, 1 mẫu** (span 0 s); RAM 507.320 kB.
  - **Dip 1: 12:48:45–12:49:45Z, 2 mẫu** — balloon 6.281.856 kB (97,5% trần) lúc 12:48:45Z là điểm thấp nhất, rồi leo lại 98,9% lúc 12:49:45Z; RAM trong dip tối đa 633.440 kB, **gate A KHÔNG mở lần nào**.
  - **E-162 — chuỗi 2: 12:50:45–13:44:46Z, 55 mẫu** (span 3.241 s, 54 phút — chuỗi ghim dài nhất đợt này, dài hơn mọi chuỗi đơn của đợt 161 — dài nhất 12 mẫu).
  - **Dip 2: 13:45:46Z, 1 mẫu** — balloon 6.378.288 kB (99,0% trần); RAM 546.672 kB, **gate A KHÔNG mở**.
  - **E-162 — chuỗi 3: 13:46:46–13:55:46Z, 10 mẫu** (span 540 s, 9 phút) — **CÒN MỞ lúc T9 đóng** (mẫu cuối 13:55:46Z vẫn ghim; T9 dừng sampler lúc đóng — diễn biến sau đó thuộc T10/T9-163 nếu có).
- **Tổng ghim trần đợt này: 66/139 mẫu (47,5%)** (đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **1 episode, 1 boot; episode còn mở lúc kết thúc quan sát** — khác đợt 161 (3 episode, 2 boot, 2/3 còn mở).
- **Phán theo quy tắc quyết (e)/(g) + quyết (j) đợt 161 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-162 (chuỗi 1+2+3): 1 EPISODE.** Ba chuỗi cùng boot, cách nhau bởi dip 1 (97,5%, 2 mẫu) và dip 2 (99,0%, 1 mẫu) — gate A đóng suốt cả hai dip; mỗi dip chỉ 1–2 mẫu. Theo tiêu chí cứng đứng (gate A có mở trong dip hay không — quy tắc (g) đợt 152 + quyết (k) đợt 157/158/159 + quyết (j) đợt 160 + quyết (j) đợt 161 đã CHẤP NHẬN cách đếm 3 episode đợt 161 trên đúng tiêu chí này), cả hai dip đều KHÔNG tách: dip 1 nông hơn mọi dip tiền lệ đã không tách (93,9% đợt 160; 90,8% đợt 161); dip 2 nông nhất trong toàn bộ tiền lệ (99,0%, 1 mẫu). **Đợt 162 = 1 EPISODE GHIM MỚI** (66 mẫu / 3 chuỗi / 1 boot).
  - **E2/E3 đợt 161 (theo dõi, giao T10 ghi nhận):** E2 (chuỗi 4 đợt 161) còn mở lúc reboot #63 — điểm đứt KHÔNG quan sát được, giữ nguyên kết luận đợt 161. E3 (chuỗi 5+6 đợt 161, còn mở lúc T9-161 đóng 10:56:00Z) đứt KHÔNG quan sát được: balloon lúc T9-162 mở (11:37:42Z) đã là 5.498.744 kB (85,3% trần) và không ghim lần nào trước 12:47:45Z — E3 đã kết thúc trước 11:37:42Z; khoảng trống không quan sát 10:56:00Z → 11:37:42Z (41m42s) có chứa reboot #64 (11:15:18Z) nên điểm đứt E3 không xác định được trong khoảng đó (xem F-162-T9-7). E3 không nối sang E-162: giữa lần ghim cuối E3 (10:56:00Z, boot #63) và lần chạm đầu E-162 (12:47:45Z, boot #64) có **reboot #64 + balloon xả về 3.485.712 kB (54,1% trần) lúc 11:50:43Z + ~1h52m không ghim**.
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~450–534.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ ghim 13:55:46Z: tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 526.860 kB.

### 2.3 Lượt yên WebKit #31 (T4, đợt 162) — CÓ LƯỢT HỢP LỆ #27, CHUỖI NỐI DÀI (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-162 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND162_T4_WEBKIT_QUIET31_LIMITS.md`) + cờ `round162-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Attempt1-d9a8d1ce (11:54:39–11:58:30Z): probe 20/20, LỚP B ĐẠT 5/5, tickCost median 42,0 ms ≤60 — HỢP LỆ NGAY lần mở cửa đầu tiên, ngân sách 3/3 chỉ dùng 1/3; poller thoát 11:58:30Z, trước hạn.**
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): CÓ 1 attempt hợp lệ cho lượt yên #31 (#27)** — chuỗi lượt yên hợp lệ **NỐI DÀI lên #27** (#22 đợt 157 → #23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161 → #27 đợt 162).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1: gate A MỞ **4/4 mẫu** trong cửa sổ (11:54:43Z 2.460.540 kB; 11:55:43Z 1.755.796 kB; 11:56:43Z 2.027.624 kB; 11:57:43Z 1.951.544 kB — cả 4 đều ≥1024 MiB).
  - Tải: sampler load1 trong cửa sổ attempt1 **0,68–1,56**; **0 spike B2 trong cửa sổ attempt** (xem §2.5).
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cửa sổ attempt1**.
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy attempt1 11:54:39–11:58:30Z trên boot #64.

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 11:54:43–11:57:43Z | #64 | 0,68–1,56 (4 mẫu) | 1.755.796–2.460.540 kB — **gate A MỞ 4/4** | T4 attempt1 — 0 spike B2 trong cửa sổ; attempt1 HỢP LỆ (tickCost median 42,0 ms ≤60) |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 17 spike, TẤT CẢ QUY ĐƯỢC DRIVER CỤ THỂ (0 spike trong cửa sổ balloon ghim, 0 spike trong cửa sổ attempt T4, 0 spike trong cửa sổ kẹt 86n2; 1 spike TRONG cửa sổ O8)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-162-T9-3). **17 spike: 15 spike bão mở đợt (11:37:42–11:46:00Z) + 1 spike O8 Chromium (12:11:06Z) + 1 spike harness 85m4 (12:32:42Z); 0 spike trong cửa sổ ghim E-162 (12:47:45–13:55:46Z), 0 spike trong cửa sổ attempt T4 (11:54:39–11:58:30Z), 0 spike trong cửa sổ kẹt 86n2 (12:18:23–12:24:54Z), 0 spike trong lúc harness chạy ngoài 2 spike đã nêu.**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — bão mở đợt (15 spike liên tục) | 11:37:42–11:46:00Z | 3,09 → 8,91 → 4,69 | 15 | apt-get replay T5 (install xfonts-scalable, delta 50) + ffmpeg testsrc2 (delta 98) + tsc (delta 45) + vite build (delta 64) + mask_anim.py (delta 92/98) + ffmpeg encode (delta 111/105/125) + grep -rl 94d22520 / blind9494-investigate.py / birth-scan-d.py (T2 điều tra mù #94?) + hatch daemon (delta 12–39) | **Bão mở đợt 162: T5 replay boot #64 + T1 verify suite 161 + T2 điều tra mù #94? — cả ba luồng mở cùng lúc trên boot mới** (xem F-162-T9-4) |
| 2 — O8 Chromium | 12:11:06Z | **3,05** | 1 | chrome renderer (Playwright Chromium, user-data-dir round162-t8/o8-chromium, delta **31**) + chrome chính 41,3% tích lũy + vite O8 (port 5554, delta 0) + clicktest-87o8-mask-track-headed.mjs | **T8 O8 Chromium** — spike NẰM TRONG cửa sổ O8 (12:09:10–12:11:47Z), 41 s trước O8 DONE, 10 s trước click Chromium S1 12:11:16Z; driver là chính process O8, không phải tải lạ (xem F-162-T9-8) |
| 3 — T8 harness 85m4 | 12:32:42Z | **3,54** | 1 | chrome gpu-process (Playwright Chromium) delta **88** + chrome renderer delta **28** + vite delta 0; script `clicktest-85m4-webkit-w7-hb128.mjs` đang chạy trong snapshot | **T8 harness 85m4** (cùng chữ ký spike 2 đợt 161: gpu-process delta 99 — đợt này delta 88) |

- **Tổng kết đếm: 17/17 spike có driver process cụ thể** (bão mở đợt ×15 + O8 Chromium ×1 + harness Chrome ×1) **+ 0 spike lớp "load1 dư"** (đợt 161: 3/3 quy được — đợt này nhiều spike hơn vì bão mở đợt dồn 3 luồng cùng lúc; đợt 160: 13/15 quy được + 2 load1 dư).
- **Caveat đếm (F-162-T9-3):** chuỗi `ps -eo pid` xuất hiện **0 lần** trong b2-spikes.log; **0 dòng nào nhắc WebKit/MiniBrowser** trong toàn bộ b2-spikes.log — spike 2/3 là Chrome Playwright của O8/harness, không phải WebKit. Đếm spike dùng neo đầu dòng `grep -c '^=== SPIKE'` = **17**.
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log với vai trò driver** — F-150-T9-8 VẪN ĐÓNG.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 17 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 17/17 spike — không có spike lớp load1 dư đợt này.
- **Delta tick lớn nhất đợt: 125 tick/s** (ffmpeg encode, spike 11:43:03Z, load1 8,91); ffmpeg 111 tick/s (11:41:16Z); ffmpeg 105 tick/s (11:41:51Z); ffmpeg testsrc2 98 tick/s (11:38:18Z); mask_anim.py 98 tick/s (11:43:38Z); chrome gpu-process 88 tick/s (12:32:42Z). (Đợt 161: max 99 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 11:37:42Z cùng sampler (sau đợt mở ~2 phút — lần khởi động đầu OK); spike đầu tiên bị bắt ngay mẫu đầu 11:37:42Z (load1 3,09) — **không có spike nào trước 11:37:42Z theo cả hai nguồn** (sampler mẫu đầu cũng là 11:37:42Z). Sau đó watcher chạy liên tục tới lúc T9 dừng tay lúc đóng (13:55:56Z) — **0 gap phủ sóng watcher trong phiên** (không reboot giữa phiên).
- **O8/harness chạy đợt này:** O8 12:09:10–12:11:47Z (WebKit 21/21 ×2 + Chromium 21/21) gây **1 spike B2** (12:11:06Z, chrome renderer O8 — xem trên; sampler load1 trong cửa sổ O8 chỉ 0,69–2,28, 0/3 mẫu ≥3,0); harness gây **1 spike B2** (12:32:42Z, chrome gpu-process delta 88; sampler bắt được 1 mẫu load1 3,34 lúc 12:32:44Z — xem F-162-T9-6) — khác đợt 161 (O8 0 spike, harness 1 spike) và đợt 160 (cả hai 0 spike); đợt này O8 gây 1 spike, harness gây 1 spike.
- **Kẹt 86n2 (T8): 0 spike B2 trong cửa sổ kẹt** (watchdog 12:18:23Z → live-diag 12:20:54Z + 12:24:54Z; sampler load1 trong cửa sổ chỉ 0,02–0,36; 3 mẫu RAM <512.000 kB lúc 12:22:44–12:24:44Z) — kẹt wedge không tải CPU, đúng chữ ký H3 (T8-162: kẹt mới cùng chữ ký wedge H3, khác điểm pha).

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg xuất hiện trong 4/17 spike** (testsrc2 11:38:18Z delta 98; encode 11:41:16Z delta 111; encode 11:41:51Z delta 105; encode 11:43:03Z delta 125 — tất cả trong bão mở đợt, thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T2 điều tra + T5 replay + T8 O8/harness + hatch daemon; không process lạ; **0 nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log**).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN, 0 GAP; CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ mười sáu liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148–161 giữ nguyên; quyết parent (m) đợt 161 GIỮ NGUYÊN cơ chế (a) armed): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **3.338.996 kB = 3.260,7 MiB = 53,07% guard lúc 11:50:43Z** — vừa qua một nửa đường tới guard (xa guard 2.952.460 kB). Đỉnh đợt này cao hơn đợt 161 (42,93% guard) và đợt 160 (47,16% guard) nhưng vẫn xa guard.
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ mười sáu liên tiếp (147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162).** Cơ chế tự động armed cả phiên (sampler `round162-t9/sampler.sh`, pid 6785, chạy 11:37:42Z–13:55:46Z, 139 mẫu — **gap lớn nhất 61 s; 0 gap >90 s; 0 gap do reboot (không reboot giữa phiên)**) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→162 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**, **3.211**, **2.779**, **3.477**, **2.612**, **2.250**, **3.216**, **2.967**, **2.701**, **3.339**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 11:37:42Z–13:55:46Z không gap (139 mẫu, max gap 61 s); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 161 nằm trong dir round161-t9 nên không chặn đợt này (dir mới round162-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-162-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-162-birefnet/out-birefnet-162.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147–161):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-162-T9-10); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-162-T9-10 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra — đợt này T4 có 1 attempt hợp lệ nhưng cửa sổ guard không mở nên điểm (c) không phát sinh). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) KHÔNG tái diễn đợt này (0 reboot giữa phiên, 0 gap >90 s)** — lần đầu tiên kể từ đợt 160 sampler chạy liền mạch cả phiên không gap reboot.

## 4. ENOSPC / vite watch

- **Phương pháp đếm (ghi rõ):** `journalctl --no-pager | grep -c 'No space left on device'` trên boot đang chạy tại thời điểm đếm; journald chỉ giữ 1 boot (volatile) nên **số cuối của một boot KHÔNG kiểm được sau khi reboot sang boot mới** (cùng giới hạn F-155-T10-1 / F-154-T1-3). Mỗi boot dưới đây ghi rõ: số đếm được lần cuối + thời điểm đếm + ai đếm. **Tổng phiên là CẬN DƯỚI (≥), không phải số đếm đầy đủ.**
- **Journal trên boot #64 (d9a8d1ce): 121 dòng lúc đóng** — T9 đếm 1 lúc 11:37:48Z → 27 lúc 12:08:03Z → 53 lúc 12:38:03Z → **79 lúc 13:08:04Z** → 105 lúc 13:38:04Z → **121 lúc 13:55:56Z** (dòng đầu 11:37:01Z — boot+21m43s; dòng cuối đếm được 13:55:19Z). Cadence ~69 s/dòng (26 dòng/30m15s, rồi 26 dòng/30m, rồi 26 dòng/30m01s, rồi 26 dòng/30m, rồi 16 dòng/17m52s — đều đặn cả phiên). Boot này còn sống lúc T9 đóng nên 121 là số đếm tới thời điểm đóng (có thể tăng sau khi T9 đóng — T10 kiểm lại nếu cần).
- **Journal trên boot #63 (94d22520): PHẦN CÒN LẠI KHÔNG ĐẾM ĐƯỢC** — T9-161 đếm 3 dòng lúc 10:55:51Z; T10-161 đếm lại **5 dòng** lúc đóng đợt 161; khoảng 10:55:51Z → reboot #64 (11:15:18Z, ~19m27s, kỳ vọng ~17 dòng theo cadence) CHƯA ĐẾM — journal mất theo reboot #64, T9-162 KHÔNG cộng số ước vào tổng; xem F-162-T9-5. Số chính thức cho #63 là **≥5 dòng** (theo T10-161).
- **Tổng phiên: 121 dòng trên boot #64 (+ ≥5 dòng boot #63 từ đợt trước, không cộng dồn vào số đợt này).** Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. **Đây là đợt thứ mười một liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng — ít hơn vì journal của 3 boot cũ mất theo 3 reboot; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng — ít hơn vì journal boot #58 mất theo reboot #59 sau khi chỉ đếm tới 34; đợt 159: ≥134 dòng — cao nhất kể từ đợt 155; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 121 dòng).
- **Điểm mới đáng ghi (không phán cơ chế):** dòng ENOSPC đầu tiên trên #64 xuất hiện 11:37:01Z (boot+21m43s) — T9 mở lúc boot+22m24s nên không biết bảng đầy từ lúc nào trước đó; cadence ~69 s/dòng đều đặn cả phiên, khác đợt 161 trên #63 (chỉ 3–5 dòng rồi im 21 phút cuối phiên). T9 ghi đúng mốc thời gian, không claim quan hệ nhân quả.
- Steal CPU: **không đo đợt này** (T9 không đo steal; giao T5/T7 nếu cần).
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=0 ×11 lần + i=2 ×1 lần — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo); **(2) 121 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 0 — **không thêm được watch nào cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Reboot #64 TRƯỚC phiên; 0 reboot giữa phiên; T9 mở muộn, lỡ cửa sổ thoáng lần thứ ba liên tiếp

- **Boot lúc mở đợt 162 = d9a8d1ce** (btime **1795259718 = 11:15:18Z** theo `/proc/stat` — khớp T5-162; **reboot #64 xảy ra TRƯỚC phiên, sau T10-161 đóng, trước đợt 162 mở 11:35:51Z**).
- **T9 mở muộn so với boot #64:** T9 khởi động sampler 11:37:42Z (boot+22m24s), lần đo headroom đầu 11:37:48Z (boot+22m30s) — **cửa sổ thoáng headroom 1–3 phút sau boot (theo mẫu đợt 159) đã qua trước khi T9 mở** (xem F-162-T9-1). Ngay cả đợt mở 11:35:51Z cũng đã là boot+20m33s. Dòng ENOSPC đầu trên #64 (11:37:01Z, boot+21m43s) là mốc sớm nhất T9 có cho thấy bảng đã đầy.
- **0 reboot giữa phiên T9** — sampler + watcher chạy liền mạch 11:37:42Z–13:55:46Z (139 mẫu, max gap 61 s, 0 gap >90 s); probe-loop chạy đủ 4 lần + cặp đóng tay. T9 dừng sampler/watcher bằng PID lúc đóng (kill 6785/6786 — xem F-162-T9-9).
- **Số hiệu #64: T9 tự xác nhận theo đếm tuần tự** (#63 đã xác nhận đợt 161, quyết (p) đợt 161; #64 là boot mới duy nhất sau #63 trong phiên; btime 11:15:18Z; T5-162 xác minh độc lập #64, không nghịch lý đồng hồ) — **giao T2-162/T10-162 chốt chính thức**.
- Các cờ .done lúc T9 đóng (~13:56Z): t0, t1, t2, t4, t5, t6, t8 (7/8 — t9 đóng ngay sau khi viết LIMITS này, thành 8/9; t7 chưa đóng lúc T9 đóng — xem §5.4).

### 5.2 T5-162 — POSTBOOT_PASS cho #64 ĐÃ CÓ; #63 là boot thứ 7 không cờ; watcher-162 khởi động tay (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **POSTBOOT_PASS cho boot #64 ĐÃ CÓ (T5-162, 11:40:00Z, boot+24m42s, mode replay-day-du, poll=0)** — kiểm chứng độc lập: postboot exit 0 lúc 11:41:07Z, 11/11 gói + 5/5 lib.
- **POSTBOOT_PASS cho boot #63: KHÔNG CÓ** (boot thứ 7 liên tiếp lọt: #51, #53, #54, #55, #57, #60, #63 — T5-162 ghi rõ).
- **Watcher-161 CHẾT theo #63; watcher-162 pid 18801 KHỞI ĐỘNG BẰNG TAY 11:40:00Z** (T5-162).
- **KHÔNG có nghịch lý đồng hồ ở #64** (T5-162).

### 5.3 T8-162 — O8 PASS 3/3 + harness 5/6, 1 KẸT 86n2 (T9 chỉ ghi lại để đối chiếu)

- **O8: WebKit 21/21 ×2 + Chromium 21/21, toàn bộ PASS exit 0** (12:09:10–12:11:47Z, 2'37", boot #64) — qua **gate FOUND poll 25 lúc 12:02:43Z** (t4=OK + POSTBOOT_PASS đường (a) của T5 11:40:00Z); lượt yên #31 có lượt hợp lệ #27 (attempt1 20/20, B 5/5, tickCost median 42,0 ms, boot #64). Chuỗi WebKit FULL PASS 16 → ? CHỜ T10/parent phán (T8 KHÔNG tự chốt).
- **Harness: 5/6 PASS, 1 KẸT WebKit 86n2 P5-entry** (exit 124); watchdog **1 kích hoạt ĐÚNG** (12:18:23Z); **live-diag 2 kích hoạt — LẦN ĐẦU KÍCH HOẠT THẬT** (12:20:54Z + 12:24:54Z); điểm mù F-158-T8-4 (HB128/85m4) VẪN chưa được kiểm chứng (85m4 không kẹt — 85m4 P4-lần4 PASS? T8-162 sở hữu chi tiết).
- **Đối chiếu sampler T9 (độc lập):** O8 gây **1 spike B2** (12:11:06Z, chrome renderer O8 delta 31 — xem §2.5; sampler load1 trong cửa sổ O8 0,69–2,28, 0/3 mẫu ≥3,0); kẹt 86n2 gây **0 spike B2** (sampler load1 trong cửa sổ kẹt 0,02–0,36 — wedge không tải CPU); harness gây **1 spike B2** (12:32:42Z, chrome gpu-process delta 88) — khác đợt 161 (O8 0 spike, harness 1 spike); đợt này O8 gây 1 spike, harness gây 1 spike.
- **0 REBOOT trong phiên T8** (T8 đóng trước T9; boot #64 ổn định từ lúc mở tới lúc đóng).

### 5.4 T7-162 — run 161 chưa có kết cục lúc T9 đóng (T9 chỉ ghi lại để đối chiếu)

- **T7-162 CHƯA xuất bản LIMITS lúc T9 đóng (~13:56Z)** — `round162-t7/` chỉ có NOTES.md, chưa có cờ `.done`. Kết cục run 161 (vẫn `running` lúc T7-161 đóng, 1 lần viết lại tại #63, hạn 11:35:51Z — đã qua trước khi đợt 162 mở) thuộc T7-162; T9 không phán thay T7.

### 5.5 Các luồng khác đợt 162 (T9 chỉ ghi lại để đối chiếu)

- **T0-162:** LIMITS `docs/PHASE9_ROUND162_T0_BOOT_O8_LIMITS.md` đã xuất bản + cờ `round162-t0.done` (boot survey #64 + O8 check).
- **T1-162:** LIMITS `docs/PHASE9_ROUND162_T1_VERIFY161_LIMITS.md` đã xuất bản + cờ `round162-t1.done` (verify 161).
- **T2-162:** LIMITS `docs/PHASE9_ROUND162_T2_EPERM_LIMITS.md` đã xuất bản + cờ `round162-t2.done` (mù #77?/#88?/#94?).
- **T6-162:** LIMITS `docs/PHASE9_ROUND162_T6_LOCKHEALTH_LIMITS.md` đã xuất bản + cờ `round162-t6.done` ((A) + prune 37).
- **T4-162:** xem §2.3 (lượt yên #31 CÓ lượt hợp lệ #27).

## 6. Sai số F-162-T9-* (trung thực — liệt kê đầy đủ)

- **F-162-T9-1 — Cửa sổ thoáng headroom sau reboot KHÔNG được quan sát (lần thứ ba liên tiếp).** Boot #64 btime 11:15:18Z; đợt mở 11:35:51Z đã là boot+20m33s; T9 khởi động sampler 11:37:42Z (boot+22m24s), lần đo headroom đầu 11:37:48Z (boot+22m30s) đã là 0 (lần đo thứ hai thoáng 2 rồi về 0 — xem §1.2). Nếu cửa sổ thoáng tồn tại thì nó nằm trong 20 phút đầu sau boot, trước khi T9 mở. T9 không claim có hay không có cửa sổ thoáng đợt này; chỉ ghi lần đo sớm nhất đã là 0. Giao T9-163 mở sớm hơn nếu muốn bắt cửa sổ (cần đo trong 60–150 s sau boot — lần thứ ba liên tiếp T9 ghi giao việc này).
- **F-162-T9-2 — Khoảng trống không quan sát E3 đợt 161 (41m42s) + điểm đứt E3 không xác định được.** T9-161 đóng 10:56:00Z (E3 còn mở, balloon ghim); T9-162 mở 11:37:42Z (balloon 5.498.744 kB = 85,3% trần, không ghim). Giữa hai mốc có reboot #64 (11:15:18Z). E3 có thể đứt bất kỳ lúc nào trong khoảng 10:56:00Z → 11:37:42Z — trước reboot, đúng lúc reboot, hay sau reboot đều không phân biệt được bằng dữ kiện T9. T9 không phán điểm đứt E3; chỉ ghi E3 đã kết thúc trước 11:37:42Z (xem §2.2).
- **F-162-T9-3 — Lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log (không phải lỗi đếm).** `grep -c 'ps -eo pid'` = 0; `grep -c 'WebKit\|MiniBrowser'` = 0. Fix (n) đợt 150 VẪN ĐÓNG. Attribution dùng delta tick + top tức thời nên không bị che.
- **F-162-T9-4 — 15 spike bão mở đợt là MỘT sự kiện kéo dài, không phải 15 sự kiện độc lập.** Watcher ghi 1 record mỗi ~35 s khi load1 ≥3,0; 15 record 11:37:42–11:46:00Z tạo thành một bão liên tục (load1 3,09 → 8,91 → 4,69, không lần nào rơi dưới 3,0 giữa các record). T9 đếm 15 record theo đúng phương pháp đếm đợt 160/161 (đếm record, neo `^=== SPIKE`) nhưng trình rõ chúng là một bão duy nhất để T10 không đọc thành 15 sự kiện rời rạc. Driver của bão: T5 replay (apt-get) + T1 suite (tsc/vite/ffmpeg/mask_anim) + T2 điều tra (grep/blind9494/birth-scan) + hatch daemon — cả ba luồng mở cùng lúc trên boot mới.
- **F-162-T9-5 — Phần còn lại của ENOSPC boot #63 CHƯA ĐẾM (~17 dòng kỳ vọng).** Số cuối T10-161 đếm được là 5 dòng lúc đóng đợt 161; khoảng 10:55:51Z → reboot #64 11:15:18Z (~19m27s, cadence ~69 s/dòng) chưa đếm vì journal mất theo reboot #64. Tổng phiên 121 dòng chỉ tính boot #64; T9 KHÔNG cộng số ước vào tổng.
- **F-162-T9-6 — Sampler cadence 60 s KHÔNG bắt được spike B2 16 (12:11:06Z, load1 3,05).** Watcher cadence 30 s bắt được (chrome renderer O8 delta 31). Trong cửa sổ O8 12:09:10–12:11:47Z sampler có 0/3 mẫu load1 ≥3,0 — số 0 này là giới hạn cadence, không phải bằng chứng không có spike. Ngược lại, sampler BẮT ĐƯỢC spike B2 17 (mẫu 12:32:44Z load1 3,34, 2 s sau watcher 12:32:42Z). T9 ghi rõ để T10 không dùng sampler làm bằng chứng phủ định spike.
- **F-162-T9-7 — Cách đếm episode đợt này phụ thuộc tiêu chí cứng đứng (gate A), không phụ thuộc độ sâu dip.** Dip 1 (97,5%, 2 mẫu) và dip 2 (99,0%, 1 mẫu) đều nông hơn mọi dip tiền lệ đã không tách (90,8% đợt 161; 93,9% đợt 160) và gate A đóng suốt cả hai dip — đếm 1 episode là chắc chắn dưới tiêu chí đứng. Nếu parent đặt ngưỡng độ sâu mới (ví dụ dip <98% thì tách) thì dip 1 tách → 2 episode; T9 trình rõ để parent quyết, không giấu điểm khác biệt. E3 đợt 161 không nối sang E-162 (xem §2.2).
- **F-162-T9-8 — Spike B2 16 NẰM TRONG cửa sổ O8 (12:11:06Z trong 12:09:10–12:11:47Z).** Khác đợt 161 (0 spike trong lúc O8 chạy) và đợt 160 (0 spike). Driver là chính process O8 (chrome renderer Playwright Chromium user-data-dir round162-t8/o8-chromium, delta 31; vite O8 port 5554) — tải của O8 tự gây, không phải tải lạ; O8 vẫn PASS 3/3 theo T8-162. T9 ghi rõ để T10 không đọc nhầm thành "O8 bị nhiễu bởi tải ngoài".
- **F-162-T9-9 — Dừng sampler/watcher bằng PID (đã tránh lỗi F-161-T9-9).** Lúc đóng, T9 kill đúng pid 6785 (sampler) + 6786 (watcher) thay vì `pkill -f` (lệnh này đợt 161 đã tự SIGTERM chính nó). Dataset đóng đúng ở mẫu cuối 13:55:46Z, không mất số liệu.
- **F-162-T9-10 — Giới hạn đứng của cơ chế birefnet (giữ nguyên từ đợt 147–161).** (a) Vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy; (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) cửa sổ mở đúng lúc T4 attempt sẽ gây tải trong cửa sổ đo (đợt này không phát sinh); (d) reboot giết sampler — KHÔNG tái diễn đợt này (0 reboot giữa phiên, 0 gap >90 s — lần đầu tiên kể từ đợt 160).

## 7. Cam kết

- KHÔNG PUSH lên GitHub trong phiên này (không chạy push-files, không ghi qua GitHub connector). Chỉ stage batch tại `~/workspace/repo-1-push/paths-loop/phase9-round162-t9-headroom.txt` (1 entry, NUL-delimited, od-verified — xem dưới).
- KHÔNG release, KHÔNG tạo tag release.
- KHÔNG code giả, mock, placeholder mạo nhận hoàn thành. Mọi claim trong LIMITS này đều có số đo thật trích từ log gốc (`hidden_files/round162-t9/ram-sampler-FROZEN.log`, `b2-spikes-FROZEN.log`, `headroom-log.txt`) hoặc từ LIMITS/.done đã xuất bản của T0/T1/T2/T4/T5/T6/T8 (trích đúng, ghi rõ nguồn).
- KHÔNG làm tính năng cloud/collab, AI avatar/video-gen model đóng, nhạc có bản quyền. Không sửa production, không chạy TTS 39.

## 8. Stage

- File paths NUL-delimited: `~/workspace/repo-1-push/paths-loop/phase9-round162-t9-headroom.txt` — 1 entry: `docs/PHASE9_ROUND162_T9_HEADROOM_LIMITS.md` (file text duy nhất đợt này; script + log nằm trong `hidden_files/` của goal, không đưa vào batch; không binary).
- Verify: `od -c` thấy đúng 1 NUL cuối entry; `wc -c` file LIMITS (ghi trong .done).

## Phụ lục A — Bảng sampler đầy đủ (139 mẫu, boot d9a8d1ce; không gap >90 s)

(File gốc: `hidden_files/round162-t9/ram-sampler-FROZEN.log` — bảng dưới đây trích đúng file đó.)

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-21T11:37:42Z | d9a8d1ce | 1,223,288 | 1194.6 | 19.44% | 5,498,744 | 762,604 | 3.09 |
| 2 | 2026-11-21T11:38:43Z | d9a8d1ce | 2,351,588 | 2296.5 | 37.38% | 4,122,488 | 757,684 | 4.68 |
| 3 | 2026-11-21T11:39:43Z | d9a8d1ce | 2,305,836 | 2251.8 | 36.65% | 4,374,528 | 760,924 | 4.70 |
| 4 | 2026-11-21T11:40:43Z | d9a8d1ce | 2,054,968 | 2006.8 | 32.66% | 4,614,248 | 765,484 | 5.24 |
| 5 | 2026-11-21T11:41:43Z | d9a8d1ce | 2,073,092 | 2024.5 | 32.95% | 4,571,948 | 758,288 | 5.95 |
| 6 | 2026-11-21T11:42:43Z | d9a8d1ce | 2,939,528 | 2870.6 | 46.72% | 3,656,536 | 781,800 | 8.25 |
| 7 | 2026-11-21T11:43:43Z | d9a8d1ce | 2,646,036 | 2584.0 | 42.06% | 3,945,884 | 787,712 | 8.59 |
| 8 | 2026-11-21T11:44:43Z | d9a8d1ce | 2,400,516 | 2344.3 | 38.16% | 4,226,524 | 788,068 | 7.79 |
| 9 | 2026-11-21T11:45:43Z | d9a8d1ce | 2,218,024 | 2166.0 | 35.25% | 4,492,392 | 768,868 | 6.03 |
| 10 | 2026-11-21T11:46:43Z | d9a8d1ce | 2,077,340 | 2028.7 | 33.02% | 4,503,348 | 721,496 | 2.48 |
| 11 | 2026-11-21T11:47:43Z | d9a8d1ce | 2,407,884 | 2351.4 | 38.27% | 4,333,740 | 702,948 | 1.90 |
| 12 | 2026-11-21T11:48:43Z | d9a8d1ce | 2,434,172 | 2377.1 | 38.69% | 4,341,668 | 720,816 | 1.33 |
| 13 | 2026-11-21T11:49:43Z | d9a8d1ce | 2,554,712 | 2494.8 | 40.61% | 4,177,060 | 727,820 | 1.33 |
| 14 | 2026-11-21T11:50:43Z | d9a8d1ce | 3,338,996 | 3260.7 | 53.07% | 3,485,712 | 725,436 | 1.76 |
| 15 | 2026-11-21T11:51:43Z | d9a8d1ce | 2,928,216 | 2859.6 | 46.54% | 3,833,528 | 726,440 | 1.38 |
| 16 | 2026-11-21T11:52:43Z | d9a8d1ce | 2,644,364 | 2582.4 | 42.03% | 4,150,476 | 727,280 | 1.08 |
| 17 | 2026-11-21T11:53:43Z | d9a8d1ce | 2,318,608 | 2264.3 | 36.85% | 4,421,904 | 727,760 | 1.02 |
| 18 | 2026-11-21T11:54:43Z | d9a8d1ce | 2,460,540 | 2402.9 | 39.11% | 4,065,936 | 727,680 | 0.69 |
| 19 | 2026-11-21T11:55:43Z | d9a8d1ce | 1,755,796 | 1714.6 | 27.91% | 4,151,028 | 726,312 | 1.56 |
| 20 | 2026-11-21T11:56:43Z | d9a8d1ce | 2,027,624 | 1980.1 | 32.23% | 4,385,032 | 725,972 | 0.95 |
| 21 | 2026-11-21T11:57:43Z | d9a8d1ce | 1,951,544 | 1905.8 | 31.02% | 4,615,364 | 726,140 | 0.68 |
| 22 | 2026-11-21T11:58:43Z | d9a8d1ce | 2,994,648 | 2924.5 | 47.60% | 3,841,516 | 727,184 | 0.76 |
| 23 | 2026-11-21T11:59:43Z | d9a8d1ce | 2,751,568 | 2687.1 | 43.73% | 4,055,784 | 728,320 | 0.52 |
| 24 | 2026-11-21T12:00:43Z | d9a8d1ce | 2,453,752 | 2396.2 | 39.00% | 4,353,160 | 730,940 | 0.56 |
| 25 | 2026-11-21T12:01:43Z | d9a8d1ce | 2,166,480 | 2115.7 | 34.44% | 4,622,408 | 731,040 | 0.32 |
| 26 | 2026-11-21T12:02:43Z | d9a8d1ce | 1,901,472 | 1856.9 | 30.22% | 4,863,996 | 731,560 | 0.23 |
| 27 | 2026-11-21T12:03:43Z | d9a8d1ce | 1,735,640 | 1695.0 | 27.59% | 5,061,268 | 732,472 | 0.31 |
| 28 | 2026-11-21T12:04:43Z | d9a8d1ce | 1,522,736 | 1487.0 | 24.20% | 5,260,908 | 734,584 | 0.27 |
| 29 | 2026-11-21T12:05:43Z | d9a8d1ce | 1,377,292 | 1345.0 | 21.89% | 5,445,972 | 737,464 | 0.16 |
| 30 | 2026-11-21T12:06:43Z | d9a8d1ce | 1,230,296 | 1201.5 | 19.56% | 5,617,428 | 735,784 | 0.09 |
| 31 | 2026-11-21T12:07:43Z | d9a8d1ce | 1,076,016 | 1050.8 | 17.10% | 5,772,744 | 735,320 | 0.10 |
| 32 | 2026-11-21T12:08:43Z | d9a8d1ce | 909,776 | 888.5 | 14.46% | 5,910,640 | 736,060 | 0.20 |
| 33 | 2026-11-21T12:09:43Z | d9a8d1ce | 919,976 | 898.4 | 14.62% | 5,209,436 | 589,344 | 0.69 |
| 34 | 2026-11-21T12:10:43Z | d9a8d1ce | 756,008 | 738.3 | 12.02% | 5,309,096 | 583,892 | 2.28 |
| 35 | 2026-11-21T12:11:43Z | d9a8d1ce | 864,952 | 844.7 | 13.75% | 5,196,764 | 587,388 | 2.16 |
| 36 | 2026-11-21T12:12:43Z | d9a8d1ce | 904,336 | 883.1 | 14.37% | 5,346,156 | 591,060 | 1.58 |
| 37 | 2026-11-21T12:13:43Z | d9a8d1ce | 980,176 | 957.2 | 15.58% | 5,250,672 | 588,012 | 1.22 |
| 38 | 2026-11-21T12:14:43Z | d9a8d1ce | 871,956 | 851.5 | 13.86% | 5,336,864 | 588,272 | 1.86 |
| 39 | 2026-11-21T12:15:43Z | d9a8d1ce | 1,442,136 | 1408.3 | 22.92% | 5,458,256 | 592,172 | 1.11 |
| 40 | 2026-11-21T12:16:44Z | d9a8d1ce | 1,024,000 | 1000.0 | 16.28% | 5,171,216 | 589,420 | 1.24 |
| 41 | 2026-11-21T12:17:44Z | d9a8d1ce | 1,024,352 | 1000.3 | 16.28% | 5,306,568 | 603,412 | 0.83 |
| 42 | 2026-11-21T12:18:44Z | d9a8d1ce | 900,908 | 879.8 | 14.32% | 5,438,956 | 608,824 | 0.30 |
| 43 | 2026-11-21T12:19:44Z | d9a8d1ce | 793,864 | 775.3 | 12.62% | 5,561,608 | 608,848 | 0.16 |
| 44 | 2026-11-21T12:20:44Z | d9a8d1ce | 690,504 | 674.3 | 10.98% | 5,673,572 | 608,568 | 0.06 |
| 45 | 2026-11-21T12:21:44Z | d9a8d1ce | 602,024 | 587.9 | 9.57% | 5,775,912 | 602,044 | 0.06 |
| 46 | 2026-11-21T12:22:44Z | d9a8d1ce | 497,124 | 485.5 | 7.90% | 5,867,844 | 600,044 | 0.02 |
| 47 | 2026-11-21T12:23:44Z | d9a8d1ce | 427,704 | 417.7 | 6.80% | 5,951,620 | 594,016 | 0.25 |
| 48 | 2026-11-21T12:24:44Z | d9a8d1ce | 446,472 | 436.0 | 7.10% | 5,959,312 | 578,808 | 0.36 |
| 49 | 2026-11-21T12:25:44Z | d9a8d1ce | 405,416 | 395.9 | 6.44% | 6,013,240 | 579,668 | 0.17 |
| 50 | 2026-11-21T12:26:44Z | d9a8d1ce | 523,512 | 511.2 | 8.32% | 5,866,724 | 578,936 | 0.23 |
| 51 | 2026-11-21T12:27:44Z | d9a8d1ce | 440,912 | 430.6 | 7.01% | 5,952,052 | 577,616 | 0.26 |
| 52 | 2026-11-21T12:28:44Z | d9a8d1ce | 385,484 | 376.4 | 6.13% | 6,026,336 | 571,376 | 0.09 |
| 53 | 2026-11-21T12:29:44Z | d9a8d1ce | 567,712 | 554.4 | 9.02% | 5,745,912 | 574,288 | 0.40 |
| 54 | 2026-11-21T12:30:44Z | d9a8d1ce | 511,420 | 499.4 | 8.13% | 5,834,856 | 575,908 | 0.23 |
| 55 | 2026-11-21T12:31:44Z | d9a8d1ce | 1,037,332 | 1013.0 | 16.49% | 5,028,232 | 561,188 | 0.91 |
| 56 | 2026-11-21T12:32:44Z | d9a8d1ce | 1,048,980 | 1024.4 | 16.67% | 5,144,088 | 565,808 | 3.34 |
| 57 | 2026-11-21T12:33:44Z | d9a8d1ce | 684,800 | 668.8 | 10.88% | 5,278,512 | 567,676 | 2.87 |
| 58 | 2026-11-21T12:34:44Z | d9a8d1ce | 1,147,716 | 1120.8 | 18.24% | 5,420,768 | 569,688 | 2.32 |
| 59 | 2026-11-21T12:35:44Z | d9a8d1ce | 790,064 | 771.5 | 12.56% | 5,250,136 | 688,056 | 2.55 |
| 60 | 2026-11-21T12:36:44Z | d9a8d1ce | 831,172 | 811.7 | 13.21% | 5,385,612 | 696,912 | 1.46 |
| 61 | 2026-11-21T12:37:44Z | d9a8d1ce | 702,200 | 685.7 | 11.16% | 5,525,092 | 695,192 | 0.94 |
| 62 | 2026-11-21T12:38:44Z | d9a8d1ce | 1,236,156 | 1207.2 | 19.65% | 5,678,252 | 717,136 | 0.40 |
| 63 | 2026-11-21T12:39:44Z | d9a8d1ce | 1,072,540 | 1047.4 | 17.05% | 5,829,224 | 718,316 | 0.57 |
| 64 | 2026-11-21T12:40:44Z | d9a8d1ce | 992,268 | 969.0 | 15.77% | 5,968,596 | 724,872 | 0.24 |
| 65 | 2026-11-21T12:41:44Z | d9a8d1ce | 1,018,460 | 994.6 | 16.19% | 5,868,432 | 710,824 | 0.50 |
| 66 | 2026-11-21T12:42:44Z | d9a8d1ce | 840,988 | 821.3 | 13.37% | 5,997,584 | 703,968 | 0.37 |
| 67 | 2026-11-21T12:43:44Z | d9a8d1ce | 750,112 | 732.5 | 11.92% | 6,116,876 | 700,132 | 0.13 |
| 68 | 2026-11-21T12:44:44Z | d9a8d1ce | 654,080 | 638.8 | 10.40% | 6,226,604 | 701,144 | 0.08 |
| 69 | 2026-11-21T12:45:44Z | d9a8d1ce | 569,928 | 556.6 | 9.06% | 6,327,200 | 685,768 | 0.11 |
| 70 | 2026-11-21T12:46:45Z | d9a8d1ce | 484,372 | 473.0 | 7.70% | 6,419,208 | 685,036 | 0.04 |
| 71 | 2026-11-21T12:47:45Z | d9a8d1ce | 507,320 | 495.4 | 8.06% | 6,443,824 | 638,356 | 0.24 |
| 72 | 2026-11-21T12:48:45Z | d9a8d1ce | 633,440 | 618.6 | 10.07% | 6,281,856 | 610,820 | 0.40 |
| 73 | 2026-11-21T12:49:45Z | d9a8d1ce | 542,648 | 529.9 | 8.63% | 6,376,728 | 612,028 | 0.21 |
| 74 | 2026-11-21T12:50:45Z | d9a8d1ce | 512,860 | 500.8 | 8.15% | 6,443,824 | 611,172 | 0.08 |
| 75 | 2026-11-21T12:51:45Z | d9a8d1ce | 492,472 | 480.9 | 7.83% | 6,443,824 | 604,360 | 0.03 |
| 76 | 2026-11-21T12:52:45Z | d9a8d1ce | 487,760 | 476.3 | 7.75% | 6,443,824 | 604,500 | 0.01 |
| 77 | 2026-11-21T12:53:45Z | d9a8d1ce | 465,164 | 454.3 | 7.39% | 6,443,824 | 605,008 | 0.00 |
| 78 | 2026-11-21T12:54:45Z | d9a8d1ce | 486,568 | 475.2 | 7.73% | 6,443,824 | 601,708 | 0.00 |
| 79 | 2026-11-21T12:55:45Z | d9a8d1ce | 504,216 | 492.4 | 8.01% | 6,443,824 | 601,432 | 0.04 |
| 80 | 2026-11-21T12:56:45Z | d9a8d1ce | 476,420 | 465.3 | 7.57% | 6,443,824 | 599,888 | 0.01 |
| 81 | 2026-11-21T12:57:45Z | d9a8d1ce | 475,720 | 464.6 | 7.56% | 6,443,824 | 599,180 | 0.05 |
| 82 | 2026-11-21T12:58:45Z | d9a8d1ce | 493,396 | 481.8 | 7.84% | 6,443,824 | 598,960 | 0.02 |
| 83 | 2026-11-21T12:59:45Z | d9a8d1ce | 488,012 | 476.6 | 7.76% | 6,443,824 | 611,104 | 0.00 |
| 84 | 2026-11-21T13:00:45Z | d9a8d1ce | 507,648 | 495.8 | 8.07% | 6,443,824 | 616,968 | 0.14 |
| 85 | 2026-11-21T13:01:45Z | d9a8d1ce | 467,636 | 456.7 | 7.43% | 6,443,824 | 615,540 | 0.05 |
| 86 | 2026-11-21T13:02:45Z | d9a8d1ce | 477,528 | 466.3 | 7.59% | 6,443,824 | 615,836 | 0.02 |
| 87 | 2026-11-21T13:03:45Z | d9a8d1ce | 461,800 | 451.0 | 7.34% | 6,443,824 | 618,656 | 0.07 |
| 88 | 2026-11-21T13:04:45Z | d9a8d1ce | 450,908 | 440.3 | 7.17% | 6,443,824 | 621,068 | 0.02 |
| 89 | 2026-11-21T13:05:45Z | d9a8d1ce | 485,324 | 473.9 | 7.71% | 6,443,824 | 621,368 | 0.13 |
| 90 | 2026-11-21T13:06:45Z | d9a8d1ce | 458,124 | 447.4 | 7.28% | 6,443,824 | 619,016 | 0.05 |
| 91 | 2026-11-21T13:07:45Z | d9a8d1ce | 473,436 | 462.3 | 7.53% | 6,443,824 | 618,852 | 0.08 |
| 92 | 2026-11-21T13:08:45Z | d9a8d1ce | 468,272 | 457.3 | 7.44% | 6,443,824 | 622,264 | 0.09 |
| 93 | 2026-11-21T13:09:45Z | d9a8d1ce | 479,216 | 468.0 | 7.62% | 6,443,824 | 610,548 | 0.17 |
| 94 | 2026-11-21T13:10:45Z | d9a8d1ce | 499,608 | 487.9 | 7.94% | 6,443,824 | 606,252 | 0.13 |
| 95 | 2026-11-21T13:11:45Z | d9a8d1ce | 497,084 | 485.4 | 7.90% | 6,443,824 | 599,244 | 0.08 |
| 96 | 2026-11-21T13:12:45Z | d9a8d1ce | 473,184 | 462.1 | 7.52% | 6,443,824 | 598,744 | 0.03 |
| 97 | 2026-11-21T13:13:45Z | d9a8d1ce | 476,248 | 465.1 | 7.57% | 6,443,824 | 599,396 | 0.01 |
| 98 | 2026-11-21T13:14:45Z | d9a8d1ce | 492,376 | 480.8 | 7.83% | 6,443,824 | 599,532 | 0.00 |
| 99 | 2026-11-21T13:15:45Z | d9a8d1ce | 498,572 | 486.9 | 7.92% | 6,443,824 | 601,380 | 0.12 |
| 100 | 2026-11-21T13:16:45Z | d9a8d1ce | 482,496 | 471.2 | 7.67% | 6,443,824 | 600,504 | 0.09 |
| 101 | 2026-11-21T13:17:45Z | d9a8d1ce | 463,400 | 452.5 | 7.37% | 6,443,824 | 598,752 | 0.19 |
| 102 | 2026-11-21T13:18:45Z | d9a8d1ce | 488,064 | 476.6 | 7.76% | 6,443,824 | 598,108 | 0.07 |
| 103 | 2026-11-21T13:19:45Z | d9a8d1ce | 476,052 | 464.9 | 7.57% | 6,443,824 | 597,420 | 0.17 |
| 104 | 2026-11-21T13:20:45Z | d9a8d1ce | 479,820 | 468.6 | 7.63% | 6,443,824 | 592,848 | 0.96 |
| 105 | 2026-11-21T13:21:45Z | d9a8d1ce | 478,516 | 467.3 | 7.61% | 6,443,824 | 592,784 | 0.55 |
| 106 | 2026-11-21T13:22:45Z | d9a8d1ce | 486,212 | 474.8 | 7.73% | 6,443,824 | 592,436 | 0.24 |
| 107 | 2026-11-21T13:23:45Z | d9a8d1ce | 480,648 | 469.4 | 7.64% | 6,443,824 | 592,416 | 0.13 |
| 108 | 2026-11-21T13:24:45Z | d9a8d1ce | 460,132 | 449.3 | 7.31% | 6,443,824 | 592,792 | 0.18 |
| 109 | 2026-11-21T13:25:45Z | d9a8d1ce | 496,624 | 485.0 | 7.89% | 6,443,824 | 592,936 | 0.20 |
| 110 | 2026-11-21T13:26:45Z | d9a8d1ce | 475,248 | 464.1 | 7.55% | 6,443,824 | 593,168 | 0.07 |
| 111 | 2026-11-21T13:27:45Z | d9a8d1ce | 484,780 | 473.4 | 7.71% | 6,443,824 | 593,068 | 0.06 |
| 112 | 2026-11-21T13:28:45Z | d9a8d1ce | 474,112 | 463.0 | 7.54% | 6,443,824 | 593,092 | 0.08 |
| 113 | 2026-11-21T13:29:45Z | d9a8d1ce | 464,856 | 454.0 | 7.39% | 6,443,824 | 592,512 | 0.08 |
| 114 | 2026-11-21T13:30:45Z | d9a8d1ce | 477,448 | 466.3 | 7.59% | 6,443,824 | 592,540 | 0.10 |
| 115 | 2026-11-21T13:31:46Z | d9a8d1ce | 466,648 | 455.7 | 7.42% | 6,443,824 | 593,320 | 0.10 |
| 116 | 2026-11-21T13:32:46Z | d9a8d1ce | 475,348 | 464.2 | 7.56% | 6,443,824 | 594,924 | 0.09 |
| 117 | 2026-11-21T13:33:46Z | d9a8d1ce | 472,324 | 461.3 | 7.51% | 6,443,824 | 594,888 | 0.03 |
| 118 | 2026-11-21T13:34:46Z | d9a8d1ce | 487,496 | 476.1 | 7.75% | 6,443,824 | 594,272 | 0.01 |
| 119 | 2026-11-21T13:35:46Z | d9a8d1ce | 529,556 | 517.1 | 8.42% | 6,443,824 | 642,592 | 0.08 |
| 120 | 2026-11-21T13:36:46Z | d9a8d1ce | 497,148 | 485.5 | 7.90% | 6,443,824 | 662,812 | 0.07 |
| 121 | 2026-11-21T13:37:46Z | d9a8d1ce | 511,008 | 499.0 | 8.12% | 6,443,824 | 681,312 | 0.02 |
| 122 | 2026-11-21T13:38:46Z | d9a8d1ce | 534,168 | 521.6 | 8.49% | 6,443,824 | 718,920 | 0.06 |
| 123 | 2026-11-21T13:39:46Z | d9a8d1ce | 514,300 | 502.2 | 8.17% | 6,443,824 | 719,072 | 0.09 |
| 124 | 2026-11-21T13:40:46Z | d9a8d1ce | 500,468 | 488.7 | 7.95% | 6,443,824 | 723,004 | 0.17 |
| 125 | 2026-11-21T13:41:46Z | d9a8d1ce | 506,728 | 494.9 | 8.05% | 6,443,824 | 723,284 | 0.06 |
| 126 | 2026-11-21T13:42:46Z | d9a8d1ce | 517,936 | 505.8 | 8.23% | 6,443,824 | 715,444 | 0.06 |
| 127 | 2026-11-21T13:43:46Z | d9a8d1ce | 501,248 | 489.5 | 7.97% | 6,443,824 | 715,496 | 0.02 |
| 128 | 2026-11-21T13:44:46Z | d9a8d1ce | 494,328 | 482.7 | 7.86% | 6,443,824 | 714,216 | 0.10 |
| 129 | 2026-11-21T13:45:46Z | d9a8d1ce | 546,672 | 533.9 | 8.69% | 6,378,288 | 690,740 | 0.56 |
| 130 | 2026-11-21T13:46:46Z | d9a8d1ce | 503,204 | 491.4 | 8.00% | 6,443,824 | 679,152 | 0.20 |
| 131 | 2026-11-21T13:47:46Z | d9a8d1ce | 481,764 | 470.5 | 7.66% | 6,443,824 | 663,620 | 0.07 |
| 132 | 2026-11-21T13:48:46Z | d9a8d1ce | 493,100 | 481.5 | 7.84% | 6,443,824 | 664,424 | 0.18 |
| 133 | 2026-11-21T13:49:46Z | d9a8d1ce | 479,648 | 468.4 | 7.62% | 6,443,824 | 664,732 | 0.06 |
| 134 | 2026-11-21T13:50:46Z | d9a8d1ce | 527,492 | 515.1 | 8.38% | 6,443,824 | 664,696 | 0.10 |
| 135 | 2026-11-21T13:51:46Z | d9a8d1ce | 460,312 | 449.5 | 7.32% | 6,443,824 | 664,056 | 0.03 |
| 136 | 2026-11-21T13:52:46Z | d9a8d1ce | 497,596 | 485.9 | 7.91% | 6,443,824 | 661,292 | 0.09 |
| 137 | 2026-11-21T13:53:46Z | d9a8d1ce | 491,256 | 479.7 | 7.81% | 6,443,824 | 657,616 | 0.03 |
| 138 | 2026-11-21T13:54:46Z | d9a8d1ce | 497,336 | 485.7 | 7.90% | 6,443,824 | 656,780 | 0.01 |
| 139 | 2026-11-21T13:55:46Z | d9a8d1ce | 526,860 | 514.5 | 8.37% | 6,443,824 | 656,812 | 0.04 |
