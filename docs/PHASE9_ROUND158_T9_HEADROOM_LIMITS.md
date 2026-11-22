# LIMITS — Phase 9 đợt 158, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ mười hai liên tiếp; headroom 0 → 0; balloon GHIM TRẦN 2 EPISODE MỚI, 38/136 mẫu, 4 chuỗi, 2 boot; MỘT reboot giữa phiên #59; ENOSPC ≥50 dòng trên 2 boot; lượt yên #27 CÓ lượt hợp lệ #23)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 0/0 (23:40Z, boot #58 28366bd0) → giữa phiên 0/0 (01:35Z, boot #59 eec65561) → đóng 0/0 (01:54:51Z, boot #59)** — **vẫn dưới ngưỡng < ~1.800 lần thứ mười tám liên tiếp**; tỉ lệ/vite **0 → 0**; trần 63.747 không đổi. Quyết (l) đợt 157 "chỉ theo dõi" đứng, không hành động. Xem §1.
- **Balloon GHIM TRẦN 2 EPISODE MỚI — 38/136 mẫu (27,9%), 4 chuỗi, HAI boot:** episode A chuỗi 1+2+3 trên boot #58 (00:59:05–01:34:05Z, 30 mẫu — dip giữa các chuỗi nông tới 94,5% / 97,4%, gate A không mở lần nào trong dip → 1 episode theo quy tắc (g) đợt 152 + tiền lệ đợt 157; chuỗi 3 bị reboot #59 cắt, KHÔNG quan sát được điểm đứt) + episode B chuỗi 4 trên boot #59 (01:47:25–01:54:25Z, 8 mẫu, đứt quan sát được 01:55:25Z xả về 94,6%). Xem §2.2, F-158-T9-7.
- **RAM:** sampler **136 mẫu, 23:41:02Z 20/11–01:56:25Z 21/11, HAI boot** (114 mẫu #58 + 22 mẫu #59 — 1 gap 80 s theo timestamp / ≥98 s giờ thật tại reboot #59, không gap nào khác >90 s theo timestamp). Min **199.248 kB (194,6 MiB) lúc 00:40:04Z — thấp nhất kể từ đợt 151** (đợt 157: 357.616; T8-158 đo độc lập 168 MB lúc 00:39:56Z trong lúc 86n2 kẹt — cùng trũng); max **2.250.420 kB (2.197,7 MiB = 35,77% guard) lúc 00:01:03Z**; mean 851.120 kB. Gate A ≥1024 MiB: **39/136 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ mười hai liên tiếp.** Xem §2, §3.
- **B2: 12 spike load1 ≥3,0 — 11 QUY ĐƯỢC DRIVER CỤ THỂ + 1 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ".** Cụm 1 (9 spike, T2 grep + T1 tsc + render ffmpeg/mask_anim, đỉnh 5,63) + spike 23:55:01Z (load1 đúng 3,00, lớp load1 dư — NẰM TRONG cửa sổ attempt3 của T4) + cụm 2 (2 spike, O8 clicktest WebKit/Chromium, đỉnh 3,52). **0 spike trong cả hai cửa sổ balloon ghim** (~35 phút episode A + ~8 phút episode B). Delta tick lớn nhất 112 tick/s (ffmpeg). Xem §2.5.
- **Lượt yên WebKit #27 (T4): CÓ LƯỢT HỢP LỆ #23 — chuỗi lượt yên hợp lệ NỐI DÀI (#22 đợt 157 → #23 đợt 158).** Attempt3-28366bd0 23:53:09–23:57:16Z, probe 20/20, lớp B 5/5, tickCost median 41,0 ms ≤60; poller 18 poll, 3 poll mở cửa (#12, #16, #17); 0 PAGE-WEDGED. Sampler T9 đối chiếu độc lập: gate A MỞ 2/5 mẫu trong cửa sổ attempt (mẫu 23:53:03Z thiếu gate chỉ 688 kB); 1 spike B2 (load1 dư) trong cửa sổ attempt. Xem §2.3.
- **MỘT reboot giữa phiên: #59 eec65561, btime 01:33:47Z** (theo /proc/stat; T9 tự xác nhận từ 6 nguồn — xem §5.1). Sampler + watcher chết theo reboot, T9 khởi động lại bằng tay, gap phủ sóng 80 s theo timestamp (≥98 s giờ thật). **Mẫu cuối boot #58 01:34:05Z nằm 18 s SAU btime #59 — đồng hồ boot #58 chạy nhanh ≥18 s cuối phiên** (T0-158 đã xác minh đồng hồ ĐÚNG ±1 s lúc mở 23:46Z — drift tích lũy trong phiên; xem F-158-T9-3). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: ≥50 dòng trên HAI boot** — #58: ≥34 dòng (số quan sát cuối của T5 lúc 23:46:39Z; phần tăng sau đó MẤT theo reboot, không cộng ước) + #59: 16 dòng lúc đóng (01:54:51Z). **Đợt thứ bảy liên tiếp bảng watch cạn gây lỗi thật thấy được.** Xem §4.
- **T8-158 (đối chiếu):** O8 PASS 3/3 qua gate chuẩn CÙNG BOOT (lượt yên #23 trên đúng boot đo); harness 4/6 + 2 KẸT THẬT WebKit mới (85m4 P4-lần3 + 86n2 P2-entry), kẹt cộng dồn 11 → 13; 84l10 KHÔNG tái kẹt; watchdog 2 kích hoạt ĐÚNG; live-diag 0/2 ở 85m4 (điểm mù mới HB128). Xem §5.3.
- **T7-158 ĐÃ đóng (~02:02Z, sau khi T9 đông kết sampler): run 157 SUCCEEDED 23:30:06Z, margin 345 s** (hẹp thứ hai từ đợt 150); reboot #58 viết lại run 157 lần 2 — **điểm (m) DƯƠNG MỚI +42,529 s**; reboot #59 viết lại run 158 lần 1 — **điểm (m) DƯƠNG MỚI +35,173 s** (cả hai trong dải 33–49,8 s); n (m) ứng viên mới 17 (15 dương + 2 âm) hoặc 18 — chờ parent quyết; #56 VẪN CÓ ĐIỀU KIỆN. Xem §5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round158-t9/k8-headroom.py` (copy y nguyên từ đợt 157 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 158

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 23:40Z 20/11 | **0** | #58 28366bd0 (btime 23:06:08Z) | lần đo 1, lúc mở; RAM trước đo 1.571.260 kB, balloon 5.264.176 kB, load1 3,03 |
| 23:40Z 20/11 | **0** | #58 28366bd0 | lần đo 2 (chênh **0** so với lần 1) |
| 01:35Z 21/11 | **0** | #59 eec65561 (btime 01:33:47Z) | lần đo 3, sau khi khởi động lại sampler/watcher trên boot mới; RAM ~1,59 GB |
| 01:35Z 21/11 | **0** | #59 eec65561 | lần đo 4 (chênh **0** so với lần 3) |
| 01:54:51Z 21/11 | **0** | #59 eec65561 | lần đo 5 (đóng phiên); RAM trước đo 1.008.484 kB, balloon 6.050.608 kB (vừa xả khỏi trần), load1 1,43 |
| 01:54:51Z 21/11 | **0** | #59 eec65561 | lần đo 6 (chênh **0** so với lần 5) |

- Probe dừng ở `i=0` cả sáu lần — `inotify_add_watch` đầu tiên trả errno 28 (không thêm được watch nào), đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau mỗi lần đo).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 0 = **63.747 watch** (bảng watch đầy hẳn, 0 watch trống) cả lúc mở, giữa phiên lẫn lúc đóng, trên cả hai boot.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **0 / 1.578 = 0** mở đợt và đóng phiên — **chuỗi "đóng ở 0" giữ nguyên sau đợt 156 nhích lên 2 rồi đợt 157 về 0**; một vite mới (~1.578 watch) vẫn không khởi động được.
- **Giải thích thận trọng (giữ nguyên từ đợt 157):** 2 watch trống đợt 156 nhiều khả năng là 1–2 watch holder ngắn hạn chết qua reboot — đợt này bảng đầy hẳn trên cả hai boot, củng cố giải thích đó, KHÔNG phải xu hướng hồi phục. T9 không claim xu hướng; chỉ ghi số đo đã xác nhận 6 lần.
- T5-158 KHÔNG probe lại headroom đợt này (như đợt 151–157) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 6 lần đo đều 0 + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal HAI boot có ≥50 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM trước đo lần đóng (~1,01 GB, ngay sau khi balloon xả khỏi trần) cao hơn RAM lúc ghim (~0,62 GB) trong khi headroom 0 → 0. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–157 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

| Đợt | Headroom | Ghi chú |
|---|---|---|
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
| **158** | **0 → 0** | **mở 23:40Z boot #58 28366bd0 btime 23:06:08Z → giữa phiên 01:35Z boot MỚI #59 eec65561 btime 01:33:47Z → đóng 01:54:51Z cùng boot #59 (MỘT reboot giữa phiên; 6 lần đo đều 0)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — đợt 156 nhích lên 2 đã quay về 0 hai đợt liên tiếp (157, 158).** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**. Bước nhích đợt này: 0 (đo 6 lần, đều 0).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ mười tám liên tiếp.** Quyết parent đợt 157 (l): GIỮ quyết (g) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal HAI boot có ≥50 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ bảy liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng — đợt này ít hơn vì journal boot #58 mất theo reboot #59 sau khi chỉ đếm tới 34, xem §4/F-158-T9-5). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở 23:40Z, giữa phiên 01:35Z và lúc đóng 01:54:51Z — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.747 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.048.572 kB) — sampler 136 mẫu, 23:41:02Z 20/11–01:56:25Z 21/11, HAI boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên trên boot #58 (T1/T2/render, đỉnh 2.250.420 kB) → rơi dần khi balloon leo, trũng sâu 199.248 kB lúc 00:40:04Z trong lúc 86n2 kẹt → ghim trần episode A 30 mẫu → reboot #59 → RAM hồi sau boot rồi rơi lại khi balloon leo → ghim trần episode B 8 mẫu trên boot #59 → đứt ghim lúc đóng, RAM hồi nhẹ

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; 1 gap 80 s theo timestamp / ≥98 s giờ thật do reboot #59 — xem §5.1). **136 mẫu, 23:41:02Z 20/11–01:56:25Z 21/11, HAI boot — gap lớn nhất 80 s theo timestamp, KHÔNG có gap nào khác >90 s theo timestamp (xem F-158-T9-3 về gap giờ thật).** Tổng quan: **min 199.248 kB (194,6 MiB) lúc 00:40:04Z; max 2.250.420 kB (2.197,7 MiB) lúc 00:01:03Z — 35,77% guard; mean 851.120 kB (831,2 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 23:41:02–23:52:03Z | #58 | 1.089.620–1.766.240 kB | Mở phiên: T1 tsc + T2 grep EPERM + render ffmpeg/mask_anim; gate A MỞ 12/12 mẫu; load1 tới 5,63 (sampler) |
| 23:53:03–23:58:03Z | #58 | 874.220–2.225.056 kB | T4 attempt3 lượt yên #27 (23:53:09–23:57:16Z); gate A MỞ 3/6 mẫu (mẫu 23:53:03Z thiếu gate chỉ 688 kB — xem §2.4); balloon xả sâu sau attempt |
| 23:59:03–00:58:05Z | #58 | 199.248–2.250.420 kB | Sau attempt: **đỉnh phiên 00:01:03Z** (balloon xả sâu nhất phiên 4.336.508 kB); O8 clicktest 00:07:35–00:10:07Z + harness (86n2 kẹt); **RAM min phiên 00:40:04Z (199.248 kB)** trong lúc 86n2 kẹt; gate A MỞ 16/60 mẫu |
| 00:59:05–01:34:05Z | #58 | 450.444–841.808 kB | **Ghim trần episode A, 30 mẫu trong 3 chuỗi** (xem §2.2); RAM trũng sâu; **gate A ĐÓNG cả 36 mẫu** (kể cả 6 mẫu dip); load1 ≤0,76 (yên hoàn toàn về tải) |
| 01:34:05–01:35:25Z | #58 → #59 | — | **Gap phủ sóng 80 s theo timestamp (≥98 s giờ thật) tại reboot #59** — xem §5.1, F-158-T9-3/4 |
| 01:35:25–01:46:25Z | #59 | 670.360–1.750.264 kB | Sau reboot #59: RAM hồi, balloon xả 5.152.708 kB; gate A MỞ 8/12 mẫu; load1 1,20–2,82 (tải boot) |
| 01:47:25–01:56:25Z | #59 | 584.648–954.672 kB | **Ghim trần episode B, 8 mẫu** (xem §2.2) rồi **đứt ghim 01:55:25Z** (balloon xả về 6.093.964 kB = 94,6%, RAM hồi 954.672 kB); **gate A ĐÓNG cả 10 mẫu**; load1 ≤1,86 |

- **Gate A ≥1024 MiB: 39/136 mẫu** (31/114 boot #58 + 8/22 boot #59); **0 mẫu ≥ guard**; load1 max (sampler) **5,63 lúc 23:44:02Z**; **7/136 mẫu load1 ≥3,0** (cả 7 đều boot #58, 0 mẫu boot #59). **RAM <512.000 kB: 37 mẫu** (cả 37 đều boot #58; boot #59: 0 mẫu); trong đó **RAM <300.000 kB: 4 mẫu** (277.712 lúc 00:25:04Z; 290.056 lúc 00:38:04Z; 225.648 lúc 00:39:04Z; **199.248 lúc 00:40:04Z** — cả bốn trong lúc harness chạy, 86n2 đang kẹt).
- Swap: SwapFree 661.392 kB (mẫu đầu) → 708.252 kB (mẫu cuối); dao động 558.896–994.488 kB — nhảy lên ~994.488 kB ngay sau reboot #59 (xả swap theo reboot, cùng mẫu đợt 157) rồi tụt dần về ~708–760k kB. SwapFree thấp nhất phiên 558.896 kB đúng tại mẫu RAM min 00:40:04Z.
- Mẫu 00:01:03Z (đỉnh phiên): RAM 2.250.420 kB, balloon xả 4.336.508 kB — balloon xả sâu nhất phiên ngay sau T4 attempt3 (cùng mẫu đợt 152/153/154/155/156/157: xả sâu sau attempt / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM 00:25–00:40Z: RAM rơi dưới 300.000 kB trong 4 mẫu (00:25:04Z, 00:38:04Z, 00:39:04Z, 00:40:04Z) trong lúc harness chạy (86n2 kẹt từ ~00:2xZ, xem T8-158); balloon lúc đó 6,0–6,3M kB (93–98% trần, CHƯA ghim) — trũng RAM xảy ra ngay TRƯỚC khi balloon chạm trần lần đầu 00:59:05Z. T8-158 đo độc lập RAM min 168 MB lúc 00:39:56Z (sampler riêng n=79) — cùng trũng, corroborate (chênh do cadence lấy mẫu khác nhau).

### 2.2 Balloon virtio — GHIM TRẦN 2 EPISODE MỚI, 38/136 mẫu, 4 chuỗi, HAI boot

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #58: GHIM TRẦN 30/114 mẫu (26,3%), trong 3 chuỗi — 1 EPISODE (A):**
  - **Chuỗi 1: 00:59:05–01:02:05Z, 4 mẫu** (span 180 s); leo đều lên trần từ 00:50:05Z (balloon 5.297.156 kB → 6.443.824 kB trong 9 phút, load1 ≤0,68, yên).
  - **Dip nông 1: 01:03:05–01:06:05Z, 4 mẫu** — balloon 6.091.116 kB (94,5% trần) lúc 01:03:05Z là điểm thấp nhất, rồi leo lại 96,1% / 97,8% / 99,2%; RAM trong dip tối đa 841.808 kB, **gate A KHÔNG mở lần nào**.
  - **Chuỗi 2: 01:07:05–01:19:05Z, 13 mẫu** (span 720 s, 12 phút).
  - **Dip nông 2: 01:20:05–01:21:05Z, 2 mẫu** — balloon 6.278.400 kB (97,4% trần) lúc 01:20:05Z là điểm thấp nhất, rồi leo lại 99,0%; RAM trong dip tối đa 728.960 kB, **gate A KHÔNG mở lần nào**.
  - **Chuỗi 3: 01:22:05–01:34:05Z, 13 mẫu** (span 720 s, 12 phút); **bị reboot #59 CẮT — KHÔNG quan sát được điểm đứt** (mẫu cuối 01:34:05Z vẫn ghim; sampler chết theo reboot; mẫu đầu boot mới 01:35:25Z balloon đã xả về 5.152.708 kB = 80,0% trần).
- **Boot #59 (eec65561): GHIM TRẦN 8/22 mẫu (36,4%), trong 1 chuỗi — 1 EPISODE (B):**
  - **Chuỗi 4: 01:47:25–01:54:25Z, 8 mẫu** (span 420 s, 7 phút); leo đều lên trần từ 01:35:25Z (balloon 5.152.708 kB → 6.443.824 kB trong 12 phút).
  - **Đứt 01:55:25Z (balloon xả về 6.093.964 kB = 94,6% trần), RAM hồi 954.672 kB** — quan sát được điểm đứt + hồi RAM (mẫu cuối phiên 01:56:25Z balloon 6.214.704 kB, RAM 815.132 kB).
- **Tổng ghim trần đợt này: 38/136 mẫu (27,9%)** (đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **3/4 chuỗi quan sát được điểm đứt** (chuỗi 3 bị reboot cắt — cùng mẫu đợt 156).
- **Phán theo quy tắc quyết (e)/(g) (T9 phán, giao T10 xác nhận cách đếm):**
  - **Episode A (boot #58, chuỗi 1+2+3): 1 EPISODE.** Ba chuỗi cùng boot, cách nhau bởi dip NÔNG (94,5% / 97,4% — KHÔNG phải xả sâu; gate A đóng suốt cả hai dip; dip 1 chỉ 4 mẫu / ~4 phút, dip 2 chỉ 2 mẫu / ~2 phút) — đếm là 1 episode theo quy tắc (g) đợt 152 + tiền lệ đợt 157 (episode B đợt 157: dip tới 94,4% vẫn cùng episode). Dip đợt này (94,5%) gần như trùng khớp tiền lệ 94,4% — xem F-158-T9-7.
  - **Episode B (boot #59, chuỗi 4): 1 EPISODE.** Chuỗi đơn, đứt quan sát được + hồi RAM.
  - **A và B là HAI EPISODE RIÊNG, không nối nhau:** giữa lần ghim cuối episode A (01:34:05Z, boot #58) và lần chạm đầu episode B (01:47:25Z, boot #59) có **reboot #59 + balloon xả sâu tới 5.152.708 kB (80,0% trần) + RAM hồi tới 1.750.264 kB (gate A MỞ 8 mẫu) + ~13 phút không ghim** — đủ điều kiện tách episode (reboot + xả sâu + hồi RAM; cùng mẫu tách episode đợt 156/157).
  - **Cả hai episode đều MỚI, không nối đợt 157:** giữa lần ghim cuối đợt 157 (22:30:41Z, boot #57) và lần chạm đầu đợt 158 (00:59:05Z, boot #58) có **reboot #58 lúc mở + balloon xả sâu nhiều lần (tới 4.336.508 kB = 67,3% trần lúc 00:01:03Z) + ~2,5 giờ không ghim**.
  - **Đợt 158 = 2 EPISODE GHIM MỚI** (A: 30 mẫu/3 chuỗi; B: 8 mẫu/1 chuỗi) — **đợt thứ ba liên tiếp có 2 episode** (đợt 156 cũng 2 episode, đợt 157 cũng 2 episode).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~450–620.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 01:56:25Z: tổng RAM 8.124.900 kB − balloon 6.214.704 kB = 1.910.196 kB còn lại; MemAvailable 815.132 kB.

### 2.3 Lượt yên WebKit #27 (T4, đợt 158) — CÓ LƯỢT HỢP LỆ #23, CHUỖI NỐI DÀI (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-158 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND158_T4_WEBKIT_QUIET27_LIMITS.md`) + cờ `round158-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Poller T4 chạy 1 instance, 18 poll thật (1 test + 17), 1 boot (#58), 3 poll mở cửa (#12, #16, #17):**
  - **Attempt3-28366bd0 (23:53:09–23:57:16Z): probe 20/20, LỚP B ĐẠT 5/5, tickCost median 41,0 ms ≤60 — HỢP LỆ.** Ngân sách đã dùng 3/3 (attempt1 + attempt2 lỗi setup do thiếu file b.json — F-158-T4-1/2; attempt3 ĐẠT ngay ở attempt cuối). Poller thoát 23:57:16Z vì LUOT HOP LE.
  - **0 PAGE-WEDGED** (đợt thứ hai liên tiếp không tái diễn chữ ký đợt 156). lag≥+5f = 0 occurrence (đợt 157: 30 occ).
  - RAM ≥1024: 17/18 poll; 0 poll <500 MB.
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): CÓ 1 attempt hợp lệ cho lượt yên #27 (#23)** — chuỗi lượt yên hợp lệ **NỐI DÀI lên #23** (#22 đợt 157 → #23 đợt 158). Cộng dồn 23 lượt theo LIMITS T4-158: P1 86/87, P2 78/78, P3-A1 72/87, **P3' 51/59 occurrence = 51/54 distinct-seq**, P7 57/57; (c2) 7 occ / 7 distinct-seq, COVERED 7/7.
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Gate A RAM: **MỞ 2/5 mẫu trong cửa sổ attempt** (23:53:03Z ĐÓNG — thiếu gate chỉ 688 kB; 23:54:03Z ĐÓNG; 23:55:03Z MỞ; 23:56:03Z ĐÓNG; 23:57:03Z MỞ) — xem §2.4. Mẫu ngay sau attempt 23:58:03Z (2.225.056 kB, gate A MỞ).
  - Tải: sampler load1 trong cửa sổ attempt **0,70–3,00**; **1 spike B2 trong cửa sổ attempt** (23:55:01Z, load1 đúng 3,00, lớp load1 dư — xem §2.5; spike này KHÔNG có driver process cụ thể).
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cửa sổ attempt** (mẫu thấp nhất trong cửa sổ là 874.220 kB lúc 23:54:03Z).
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy 23:53:09–23:57:16Z trên boot #58 (1 instance; attempt3 23:53:09–23:57:16Z).

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 23:53:03–23:57:03Z | #58 | 0,70–3,00 (5 mẫu) | 874.220–1.202.972 kB — **gate A MỞ 2/5** (23:55:03Z, 23:57:03Z) | T4 attempt3 — mẫu 23:53:03Z thiếu gate chỉ 688 kB (1.047.888 vs 1.048.576 kB); 1 spike B2 23:55:01Z (load1 dư) trong cửa sổ; attempt3 HỢP LỆ (tickCost median 41,0 ms ≤60) |
| 23:58:03Z | #58 | 1,65 (1 mẫu) | 2.225.056 kB — **gate A MỞ** | Ngay sau attempt (47 s sau khi attempt kết thúc 23:57:16Z); balloon xả 4.528.540 kB |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 12 spike, 11 QUY ĐƯỢC DRIVER CỤ THỂ + 1 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ" (0 spike trong cả hai cửa sổ balloon ghim)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-158-T9-2). **12 spike, trong 23:42:15Z–00:09:42Z; 0 spike trong 00:59:05–01:34:05Z (~35 phút episode A, gồm cả 2 dip nông) và 01:47:25–01:56:25Z (~9 phút episode B + đứt) — tổng ~44 phút ghim, tải yên hoàn toàn.**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — T2 grep + T1 tsc + render (9 spike) | 23:42:15–23:46:55Z | 3,12–**5,63** | 9 | grep -r bcbaa3ad delta **9** + daemon 15 (spike 1); grep -r bcbaa3ad delta **18** + daemon 12 (spike 2); tsc MainThread top 63,6% delta **17** + grep 9 + daemon 14 (spike 3); tsc MainThread top 90,0% + grep delta **39** + daemon 10 (spike 4); grep D-state top 20,0% delta **22** + daemon 13 (spike 5); ffmpeg top 136,4% delta **112** (spike 6); MainThread top 90,9% + daemon 11 (spike 7, delta không bắt được MainThread do chết trước delta); python3 mask_anim.py top 100,0% delta **97** + daemon 17 (spike 8); python3 mask_anim.py delta **96** + daemon 8 (spike 9) | **T2 grep EPERM probe (spike 1, 2, 5) + T1 tsc verify (spike 3, 4, 7) + render ffmpeg/mask_anim (spike 6, 8, 9)** — cùng họ các đợt trước (tsc + grep + render) |
| 2 — load1 dư trong attempt T4 (1 spike) | 23:55:01Z | **3,00** | 1 | Top daemon 10,0%; delta tick: vite 0, node 0, esbuild 0, daemon 3 — KHÔNG process nào có delta đáng kể | **Lớp load1 dư** — load1 đúng ngưỡng 3,00 trong cửa sổ attempt3 của T4 (23:53:09–23:57:16Z); không quy được driver cụ thể |
| 3 — O8 clicktest (2 spike) | 00:09:06–00:09:42Z | 3,02–3,52 | 2 | MiniBrowser top 27,3%, delta **72** + WebKitWebProcess delta **46** (spike 11); chrome renderer delta **40** + chrome main 4 (spike 12) | **O8 clicktest WebKit (spike 11) + Chromium (spike 12)** của T8 (O8 chạy 00:07:35–00:10:07Z) |

- **Tổng kết đếm: 11/12 spike có driver process cụ thể** (cụm 1: 9; cụm 3: 2) **+ 1/12 spike lớp "load1 dư"** (spike 10 — ghi rõ trong bảng trên, không gộp chung thành "đã quy được nguồn"). Lớp load1 dư có cơ chế chung: load1 là trung bình 1 phút còn dư sau burst trước + tải nền từ nhiều process ngắn hạn (mỗi process chết trước khi đo delta / không lọt top-5 theo %CPU tích lũy) — corroborate bằng nr_running 1–11 trong các header spike.
- **Caveat đếm (F-158-T9-2):** lệnh chờ của chính T9 (`sleep 1500` / `sleep 2400` trong các exec chờ) xuất hiện trong snapshot `ps` của b2-spikes.log (36 dòng) ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `grep -c '^=== SPIKE'` = **12**.
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log** — F-150-T9-8 VẪN ĐÓNG.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution (vd spike 7: MainThread 90,9% top dù chết trước delta). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 11 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 11/12 spike; 1 spike còn lại chỉ quy được lớp load1 dư — giới hạn phương pháp đã biết (process ngắn hạn / tải phân tán), T9 ghi rõ thay vì gộp chung.
- **Delta tick lớn nhất đợt: 112 tick/s** (ffmpeg, spike 23:45:10Z); mask_anim.py 96–97 tick/s; tsc MainThread 17 tick/s (delta) / top 63,6–90,9%; grep 9–39 tick/s; daemon 3–17 tick/s; MiniBrowser 72 tick/s; WebKitWebProcess 46 tick/s; chrome renderer 40 tick/s. (Đợt 157: max 114 tick/s.)
- **Watcher gap do reboot:** watcher chết theo reboot #59; tối đa ~2–3 lần kiểm (cadence 30 s) bị mất trong gap 80 s (01:34:05Z → 01:35:25Z theo timestamp). Load1 tại mép gap 0,11 → 2,78 (tải boot đang leo) — **có thể 1 spike (tải boot) bị mất trong gap, không chứng minh được** (spike đầu tiên sau khởi động lại là… không có spike nào sau 00:09:42Z; load1 boot mới tối đa 2,82 < 3,0 trong sampler — xem F-158-T9-4).

### 2.6 Truy chủ ffmpeg / mask_anim — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này ffmpeg xuất hiện trong 1/12 spike + mask_anim.py trong 2/12 spike, là **test render trong đợt 158** — chạy đúng chức năng, thoát bình thường. T9 không truy chủ lại từng PID (không có spike ngoài họ T2 grep + T1 tsc + render + O8 clicktest + load1 dư; không process lạ).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (TRỪ GAP 80 S TẠI REBOOT #59); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ mười hai liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148–157 giữ nguyên; quyết parent (l) đợt 157 GIỮ NGUYÊN cơ chế (a) armed): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **2.250.420 kB = 2.197,7 MiB = 35,77% guard lúc 00:01:03Z** — xa guard 4.041.036 kB. Số đỉnh đợt 158 chờ T1-159 đối chiếu.
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ mười hai liên tiếp (147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158).** Cơ chế tự động armed cả phiên (sampler `round158-t9/sampler.sh`, pid 9719 rồi pid 3384 sau reboot #59, chạy 23:41:02Z–01:56:25Z, 136 mẫu — trừ gap 80 s tại reboot #59, xem §5.1) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→158 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**, **3.211**, **2.779**, **3.477**, **2.612**, **2.250**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 23:41:02Z–01:56:25Z (136 mẫu, chỉ 1 gap 80 s tại reboot #59 rồi khởi động lại bằng tay); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 157 nằm trong dir round157-t9 nên không chặn đợt này (dir mới round158-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-158-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-158-birefnet/out-birefnet-158.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147–157):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-158-T9-9); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-158-T9-8 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra — đợt này T4 có 1 attempt hợp lệ nhưng cửa sổ guard không mở nên điểm (c) không phát sinh). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này MỘT LẦN: reboot #59 giết sampler, gap 80 s theo timestamp (≥98 s giờ thật)** (đợt 157: gap 72 s; đợt 156: gap tổng 226 s; đợt 155: gap 61 s; đợt 154: gap 95 s; đợt 153: gap 61 s; đợt 152: gap 71 s; đợt 151: gap 46 s; đợt 149: gap 87 s) — dữ kiện này KHÔNG ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" ở mức tuyệt đối, nhưng gap 80 s / ~8.100 s phiên (~1,0%) là nhỏ và T9 khởi động lại bằng tay kịp thời; T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10. **Bổ sung: T5-158 triển khai watcher respawn theo quyết parent (e) đợt 153 (phương án 1 + quy tắc đứng (3)) — cùng họ vấn đề với sampler T9; T5 là chủ quản, T9 chỉ nêu dữ kiện.**
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Phương pháp đếm (ghi rõ):** `journalctl --no-pager | grep -c 'No space left on device'` trên boot đang chạy tại thời điểm đếm; journald chỉ giữ 1 boot (volatile) nên **số cuối của một boot KHÔNG kiểm được sau khi reboot sang boot mới** (cùng giới hạn F-155-T10-1 / F-154-T1-3). Mỗi boot dưới đây ghi rõ: số đếm được lần cuối + thời điểm đếm + ai đếm. **Tổng phiên là CẬN DƯỚI (≥), không phải số đếm đầy đủ.**
- **Journal trên boot #58 (28366bd0): ≥34 dòng** — T9 đếm **28 dòng lúc mở** (23:40:44Z: dòng đầu 23:07:53Z, dòng cuối lúc đó 23:39:59Z); **T5-158 đếm 34 dòng lúc 23:46:39Z** (ghi trong `round158-t5.done`). Cadence ~59 s/dòng (28 → 34 trong 355 s). **Số cuối KHÔNG kiểm được** (journal mất theo reboot 01:33:47Z; từ 23:46:39Z tới reboot còn ~107 phút chưa đếm — T9 KHÔNG cộng số ước vào tổng; xem F-158-T9-5).
- **Journal trên boot #59 (eec65561): 16 dòng lúc đóng** (T9 đếm 16 lúc 01:54:51Z; dòng cuối 01:53:58Z; dòng đầu sau btime 01:33:47Z). Boot này còn sống lúc T9 đóng nên 16 là số đếm tới thời điểm đóng (có thể tăng sau khi T9 đóng — T10 kiểm lại nếu cần). Cadence ~77 s/dòng (16 dòng / ~20 phút từ journal start 01:33:59Z tới 01:53:58Z; 1 dòng lúc 01:35:43Z → 16 dòng lúc 01:54:51Z).
- **Tổng phiên: ≥50 dòng trên HAI boot** (≥34 + 16 — mỗi boot là cận dưới tại thời điểm đếm cuối). Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. **Đây là đợt thứ bảy liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng — ít hơn vì journal của 3 boot cũ mất theo 3 reboot; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng — ít hơn vì journal boot #58 mất theo reboot #59 sau khi chỉ đếm tới 34).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=0 ×6 lần — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo); **(2) ≥50 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 0 — **không thêm được watch nào cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 MỘT reboot giữa phiên #59 + lệch đồng hồ ≥18 s (sampler/watcher chết theo, khởi động lại bằng tay)

- **Boot lúc mở đợt 158 = 28366bd0** (btime **23:06:08Z** theo `/proc/stat` — KHỚP T10-157 đóng; T0-158 xác minh 6 nguồn độc lập đều khớp; **không có reboot mới kể từ lúc T10-157 đóng**).
- **Đồng hồ lúc mở ĐÃ ĐƯỢC T0-158 XÁC MINH LÀ ĐÚNG:** wall clock khớp Cloudflare trong ±1 s lúc 23:46Z; uptime math khớp btime tới ~0,1 s ở cả 2 lần đo (23:38Z, 23:46Z) — **không còn dấu hiệu chạy nhanh ~42'46"–50'26" như đợt 156** (T0-158 §5). GitHub Date header dao động ~9 s giữa các lần đo — T0 cảnh báo KHÔNG dùng GitHub Date làm chuẩn giờ tuyệt đối (lệch giữa các edge server).
- **Reboot GIỮA phiên:** sampler lần 1 (pid 9719) + watcher lần 1 (pid 9792) chết theo reboot; lệnh chờ `sleep 720` của T9 bị SIGTERM sau ~311 s (~01:33:52Z, tức phiên exec của T9 chết theo reboot — xem F-158-T9-6). Mẫu cuối sampler cũ: **01:34:05Z boot=28366bd0 mem=499.304 bal=6.443.824 (GHIM TRẦN) load1=0,11**. Boot mới **eec65561** (btime **01:33:47Z** stat / **01:33:47Z** uptime -s — KHỚP; journal first entry 01:33:59Z; wtmp 1 entry duy nhất "reboot Sat Nov 21 01:33 still running"). **Sampler + watcher khởi động lại bằng tay lúc 01:35:25Z** (sampler pid 3384, watcher pid 4505; mẫu đầu boot mới 01:35:25Z mem=1.750.264 bal=5.152.708 swapfree=994.488 load1=2,78). **Gap phủ sóng sampler: 80 s theo timestamp** (01:34:05Z → 01:35:25Z). **Số hiệu #59: T9 tự xác nhận theo đếm tuần tự** (#58 đã xác nhận, quyết (s) đợt 157; boot mới duy nhất sau #58 trong phiên; btime 01:33:47Z) — **giao T2-158/T10-158 chốt chính thức**. Mù cho #59 giao T2-158. Tuổi thọ boot #58: btime 23:06:08Z → btime boot mới 01:33:47Z = **8.859 s = 2h27m39s** (stat→stat).
- **Dấu hiệu đồng hồ tại reboot #59 (ghi rõ cho T1/T2/T7):** mẫu sampler cuối boot #58 (01:34:05Z) ghi SAU btime boot mới (01:33:47Z) **18 s** — chênh lệch đồng hồ giữa hai boot **≥18 s** (xem F-158-T9-3; cùng họ overlap #50 đợt 155 ≥34 s, #57 đợt 157 ≥12 s). Vì T0-158 xác minh đồng hồ ĐÚNG ±1 s lúc 23:46Z, drift ≥18 s này **tích lũy trong phiên** (23:46Z → 01:33Z, ~107 phút), KHÔNG phải hằng số J kế thừa từ đợt 156. T9 không phán cơ chế hay tốc độ drift; giao T0/T2/T7 đối chiếu. Không ảnh hưởng số đếm mẫu: mẫu 01:34:05Z vẫn thuộc boot #58 theo trường boot_id ghi trong log (sampler đọc boot_id mỗi mẫu).
- **Đồng hồ boot mới #59:** T9 chỉ kiểm GitHub Date header (01:35:42 GMT vs local 01:35:44 UTC — chênh 2 s, trong ngưỡng nhiễu của GitHub theo T0-158) — **KHÔNG kiểm lại Cloudflare trên boot mới** (xem F-158-T9-10). Mô hình đồng hồ thuộc T2-158.
- Các cờ .done lúc T9 đóng (~01:56Z): t0, t1, t2, t4, t5, t6, t8 (7/9 — t7 chưa có cờ; T9 đóng ngay sau khi viết LIMITS này, thành 8/9).

### 5.2 T5-158 — POSTBOOT_PASS cho #58 ĐÃ CÓ; #57 KHÔNG CÓ; #59 giao T5-159 (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **POSTBOOT_PASS cho boot #58 ĐÃ CÓ (T5-158, 23:43:22Z, boot+37m14s, replay đầy đủ, không cần repair)** — nhanh nhất từ trước tới nay (replay #58: boot+42s → boot+2m43s). Watcher-158 khởi động bằng tay 23:43:21Z pid 10867.
- **POSTBOOT_PASS cho boot #57: KHÔNG CÓ, KHÔNG BÙ ĐƯỢC** (journal + dpkg.log đã mất; T8-157 đã tự kiểm đầy đủ + O8 3/3 PASS trên #57 — CHECK, không phải cờ; T5 KHÔNG ghi cờ hộ).
- **Boot #59 (eec65561): POSTBOOT_PASS giao T5-159** (T5-158 đóng 23:47Z, trước reboot #59).
- **Marker `~/.config/vcut-persistence-marker` sống qua 10 reboot (#49–#58).**
- **Watcher respawn:** T5-158 triển khai theo quyết parent (e) đợt 153 (phương án 1 user systemd unit + quy tắc đứng (3)). Sampler T9 vẫn khởi động lại bằng tay sau reboot (gap 80 s đợt này) — cùng họ vấn đề, chưa có cơ chế tự hồi phục cho sampler.

### 5.3 T8-158 — O8 PASS 3/3 cùng boot + harness 4/6, 2 kẹt thật mới (T9 chỉ ghi lại để đối chiếu)

- **O8: WebKit 21/21 ×2 + Chromium 21/21, toàn bộ PASS exit 0** (00:07:35–00:10:07Z, boot #58, cùng cây preview.tsx `530e10a7`) — qua **gate chuẩn CÙNG BOOT** (GATE-FOUND poll 25 lúc 00:06:28Z: cờ T4 + POSTBOOT_PASS đường (a) của T5; lượt yên #23 trên ĐÚNG boot đo — sạch hơn đợt 157). Chuỗi WebKit FULL PASS 12 → ? (chờ T10/parent phán — T8 KHÔNG tự chốt).
- **Harness: 4/6 PASS + 2 KẸT THẬT WebKit** (85m4 P4-lần3 + 86n2 P2-entry runEngine:439) trong MỘT lần chạy driver duy nhất (00:10:25–00:49:48Z, 39'23"); 84l10 **PASS, KHÔNG tái kẹt** E4-setup như đợt 157. **Kẹt cộng dồn 11 → 13; chuỗi "P3 không kẹt" VẪN 0.** Watchdog 2 kích hoạt ĐÚNG + probe TIMEOUT cả hai, 0 false-positive; live-diag 2/2 ở 86n2 nhưng **0/2 ở 85m4 — ĐIỂM MÙ MỚI: HB128 heartbeat làm tươi log mtime trong lúc kẹt** (F-158-T8-4). H3 VẪN MỞ, chỉ giám sát thụ động.
- **RAM avail min 168 MB lúc 00:39:56Z (trong lúc 86n2 đang kẹt)** — thấp nhất các đợt gần đây (157: 308 MB; 156: 374 MB); sampler T9: min 199.248 kB lúc 00:40:04Z — cùng trũng, corroborate (xem §2.1).
- **0 REBOOT trong lúc T8 đo** (T8 đóng ~00:55Z, trước reboot #59 lúc 01:33:47Z).

### 5.4 Run 157 SUCCEEDED + 2 điểm (m) dương mới #58/#59 (T7-158 đã xuất bản LIMITS — T9 chỉ ghi lại để đối chiếu)

- **Run 157: SUCCEEDED 23:30:06Z** (event 23:30:06.022Z, eid 9545), wall gốc **10.455 s**, margin **345 s** tới hạn 23:35:51Z (hẹp thứ hai từ đợt 150, chỉ sau run 150: 177 s) — theo T7-158 LIMITS §2.1 (2 lần đọc DB đầy đủ khớp nhau + events đối chiếu trực tiếp).
- **Reboot #58 lúc mở (28366bd0, btime thật 23:06:08Z): VIẾT LẠI run 157 lần 2 — ĐIỂM (m) DƯƠNG MỚI +42,529 s** (requeue 23:06:50.529Z, eid 9539), trong dải 33–49,8 s, tính cùng khung giờ thật (điểm dương thứ hai tính hoàn toàn bằng giờ thật).
- **Reboot #59 giữa phiên (eec65561, btime thật 01:33:47Z): VIẾT LẠI run 158 lần 1 — ĐIỂM (m) DƯƠNG MỚI +35,173 s** (requeue 01:34:22.173Z, eid 9572), trong dải 33–49,8 s, tính cùng khung giờ thật (điểm dương thứ ba tính hoàn toàn bằng giờ thật). Run 157 không bị #59 viết lại (finished trước #59 7.421 s). Run 158 vẫn running lúc T7 đóng cờ — kết cục thuộc T7-159.
- **n (m): chính thức (ứng viên) GIỮ 14** (quyết (g) đợt 156); ứng viên mới **17 (15 dương + 2 âm, nhánh khuyến nghị) hoặc 18 (15 dương + 3 âm)** nếu tính cả #58 + #59 — chờ parent quyết. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-158 không thu hẹp được cửa: R 2,56251–2,66817 / J 2,566–2,80753 s); dải GIỮ 33–49,8 s; điều tra (m) VẪN ĐÓNG.
- T7-158 cũng xác nhận độc lập: **sleep chờ bị SIGTERM giết ~5 s sau btime #59** (cùng mẫu đợt 156/157) — khớp F-158-T9-6 (sleep 720 của T9 chết sau 311 s, ~01:33:52Z).

## 6. Sai số của chính T9 (ghi rõ)

- **F-158-T9-1 — Chép sai 2 ô trong bảng chuỗi headroom §1.3 (bản nháp đầu), ĐÃ SỬA TRƯỚC KHI ĐÓNG bằng cách đọc lại file gốc đợt 157:** hàng đợt 144 ghi "boot 3e..." (sai — đúng là boot **691a7403**); hàng đợt 140 ghi btime "15:54:03Z" (sai — đúng là **15:54:37Z**). Cả hai đã sửa trong file LIMITS này; các hàng khác trong bảng đã đối chiếu lại với file đợt 157. Bài học: bảng chuỗi dài hạn phải copy bằng script hoặc đối chiếu từng hàng với file gốc, không gõ lại từ trí nhớ.
- **F-158-T9-2 — Lệnh chờ của chính T9 lọt snapshot B2 (cùng họ F-157-T9-6), BẮT ĐƯỢC VÀ GHI RÕ TRƯỚC KHI ĐÓNG (không ảnh hưởng số cuối):** `sleep 1500` / `sleep 2400` của T9 xuất hiện trong snapshot `ps` của b2-spikes.log (**36 dòng**) ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `^=== SPIKE` = **12** ngay từ đầu. **Fix (n) (loại `ps` của watcher) vẫn đứng:** lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log. T9 đợt sau nên tránh sleep dài trong lúc watcher chạy (dùng cron/scheduler chờ thay cho sleep nếu có thể).
- **F-158-T9-3 — Mẫu cuối boot #58 (01:34:05Z) nằm 18 s SAU btime boot mới #59 (01:33:47Z): chênh lệch đồng hồ giữa hai boot ≥18 s.** Cùng họ overlap #50 đợt 155 (≥34 s) và #57 đợt 157 (≥12 s). Khác đợt 157: T0-158 đã xác minh đồng hồ ĐÚNG ±1 s lúc mở (23:46Z, Cloudflare) nên drift ≥18 s tích lũy TRONG phiên, không phải hằng số J kế thừa. **Hệ quả cho gap phủ sóng: gap theo timestamp là 80 s (01:34:05Z → 01:35:25Z), nhưng gap giờ thật ≥98 s** (mẫu cuối boot cũ viết ở giờ thật ≤01:33:47Z − tức trước reboot — cộng thêm δ ≥ 18 s vào 80 s; δ không có cận trên từ dữ kiện T9). Thống kê script ghi "gaps >90s: khong co" là theo timestamp — T9 ghi rõ ở đây để T10 không đọc nhầm thành "không có gap >90 s giờ thật". T9 không phán cơ chế drift; giao T0/T2/T7 đối chiếu. Không ảnh hưởng số đếm mẫu (boot_id ghi trong log).
- **F-158-T9-4 — Gap phủ sóng sampler 80 s (timestamp) / ≥98 s (giờ thật) + watcher B2 ~2–3 lần kiểm tại reboot #59 (cùng lớp F-157-T9-4):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. Thêm: gap tại reboot là khoảng trống thứ hai — một lần vượt guard trong gap cũng không được quan sát (khả năng thấp: RAM tại mép gap 499.304 → 1.750.264 kB, đều xa guard; balloon tại mép gap 6.443.824 → 5.152.708 kB, đã xả khỏi trần). Watcher B2 cũng mất ~2–3 lần kiểm trong gap — **có thể 1 spike (tải boot) bị mất** (load1 tại mép gap 0,11 → 2,78; load1 tối đa trên boot mới trong sampler là 2,82 < 3,0 nên nếu có spike bị mất thì nó phải nằm đúng trong gap 80 s — không chứng minh được).
- **F-158-T9-5 — ENOSPC boot #58: số cuối KHÔNG kiểm lại được + phần tăng sau 23:46:39Z MẤT theo reboot.** T9 tự đếm 28 dòng lúc 23:40:44Z; T5-158 đếm 34 dòng lúc 23:46:39Z (T9 nhận làm số quan sát cuối cho boot #58 — cadence 28 → 34 khớp ~59 s/dòng). Từ 23:46:39Z tới reboot 01:33:47Z còn ~107 phút chưa đếm (~98 dòng theo cadence) — journal boot #58 đã mất theo reboot nên không kiểm lại được; T9 KHÔNG cộng số ước vào tổng. Tổng phiên ≥50 là CẬN DƯỚI (mỗi boot lấy số đếm cuối quan sát được).
- **F-158-T9-6 — Phiên exec chờ của T9 chết theo reboot #59 (không phải lỗi thao tác):** lệnh `sleep 720` (chờ tới ~01:40Z để đóng) bị SIGTERM sau 311 s (~01:33:52Z) khi cell reboot — cùng lúc sampler/watcher lần 1 chết. T9 phát hiện khi nhận thông báo session kết thúc, kiểm tra ngay (01:34:33Z) và khởi động lại sampler/watcher bằng tay lúc 01:35:25Z (gap 80 s). Lần này T9 khởi động sampler + watcher bằng `setsid nohup` riêng biệt (bài học F-157-T9-2: không chung exec với lệnh chờ) nên cả hai sống qua các lần teardown exec sau đó.
- **F-158-T9-7 — Chuỗi ghim 1+2+3 đếm là 1 episode (dip nông tới 94,5% và 97,4%): T9 phán, giao T10-158 xác nhận.** Theo quy tắc (g) đợt 152 + tiền lệ đợt 157 (episode B: dip tới 94,4% vẫn cùng episode; episode A đợt 156: dip tới 95,2%). Dip 1 đợt này (94,5%, 4 mẫu) gần như trùng khớp tiền lệ 94,4% (5 mẫu) — cùng bản chất: không xả sâu (điểm thấp nhất 6.091.116 kB, RAM trong dip tối đa 841.808 kB, gate A không mở lần nào). Dip 2 (97,4%, 2 mẫu) còn nông hơn. Nếu T10/parent phán dip 1 là xả (đủ tách episode) thì đợt 158 = **3 episode** (A: chuỗi 1; B: chuỗi 2+3; C: chuỗi 4) thay vì 2 — T9 ghi rõ để T10 phán, không giấu điểm khác biệt. Thêm: chuỗi 3 bị reboot cắt nên điểm đứt của episode A KHÔNG quan sát được (cùng mẫu đợt 156) — episode A vẫn đếm là 1 episode vì 3 chuỗi nối nhau bằng dip nông trên cùng boot, không vì điểm đứt.
- **F-158-T9-8 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ mười hai liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-158-T9-9 — Khoảng trống lấy mẫu 60 giây + gap reboot (cùng lớp F-157-T9-9):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Thêm gap 80 s theo timestamp (≥98 s giờ thật) tại reboot #59 (xem F-158-T9-3/4).
- **F-158-T9-10 — Đồng hồ boot mới #59 chỉ kiểm bằng GitHub Date header (±2 s), KHÔNG kiểm lại Cloudflare:** T0-158 đã cảnh báo GitHub Date dao động ~9 s giữa các edge server, không dùng làm chuẩn giờ tuyệt đối. T9 không có số Cloudflare cho boot #59; mô hình đồng hồ (kể cả drift ≥18 s của boot #58) thuộc T2-158.

Thống kê: samples: 136 (114 mau boot 28366bd0 + 22 mau boot eec65561); mem min: 199,248 kB (194.6 MiB) luc 00:40:04Z; mem max: 2,250,420 kB (2197.7 MiB = 35.77% guard) luc 00:01:03Z; mem mean: 851120 kB (831.2 MiB); count >=1024 MiB (gate A): 39/136; count >= guard 6144 MiB: 0/136; balloon frozen 6,443,824: 38/136 (chuoi 1: 00:59:05Z–01:02:05Z n=4; chuoi 2: 01:07:05Z–01:19:05Z n=13; chuoi 3: 01:22:05Z–01:34:05Z n=13; chuoi 4: 01:47:25Z–01:54:25Z n=8); balloon min: 4,336,508 kB luc 00:01:03Z; balloon max: 6,443,824 kB; load1 max (sampler): 5.63 luc 23:44:02Z; load1 >=3.0 samples: 7/136; max inter-sample gap: 80 s (01:34:05Z -> 01:35:25Z, 28366bd0 -> eec65561); gaps >90s: khong co

## Phụ lục A — Bảng sampler đầy đủ (136 mau: 114 mau boot 28366bd0 + 22 mau boot eec65561; khong gap >90 s)

(File gốc: `hidden_files/round158-t9/ram-sampler-FROZEN.log` (argv: /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t9/ram-sampler-FROZEN.log) — bảng dưới đây trích đúng file đó.)

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-20T23:41:02Z | 28366bd0 | 1,573,956 | 1537.1 | 25.02% | 5,264,176 | 661,392 | 3.21 |
| 2 | 2026-11-20T23:42:02Z | 28366bd0 | 1,628,892 | 1590.7 | 25.89% | 5,165,688 | 667,632 | 2.83 |
| 3 | 2026-11-20T23:43:02Z | 28366bd0 | 1,387,312 | 1354.8 | 22.05% | 5,333,340 | 679,972 | 3.10 |
| 4 | 2026-11-20T23:44:02Z | 28366bd0 | 1,548,400 | 1512.1 | 24.61% | 5,045,240 | 662,792 | 5.63 |
| 5 | 2026-11-20T23:45:02Z | 28366bd0 | 1,766,240 | 1724.8 | 28.07% | 4,986,752 | 667,364 | 4.03 |
| 6 | 2026-11-20T23:46:02Z | 28366bd0 | 1,577,704 | 1540.7 | 25.08% | 5,186,124 | 687,384 | 4.29 |
| 7 | 2026-11-20T23:47:02Z | 28366bd0 | 1,601,024 | 1563.5 | 25.45% | 5,108,412 | 688,108 | 3.62 |
| 8 | 2026-11-20T23:48:02Z | 28366bd0 | 1,462,080 | 1427.8 | 23.24% | 5,236,808 | 682,092 | 1.59 |
| 9 | 2026-11-20T23:49:02Z | 28366bd0 | 1,236,048 | 1207.1 | 19.65% | 5,412,020 | 694,140 | 0.97 |
| 10 | 2026-11-20T23:50:03Z | 28366bd0 | 1,179,972 | 1152.3 | 18.76% | 5,441,948 | 691,572 | 0.47 |
| 11 | 2026-11-20T23:51:03Z | 28366bd0 | 1,175,600 | 1148.0 | 18.69% | 5,602,780 | 696,636 | 1.93 |
| 12 | 2026-11-20T23:52:03Z | 28366bd0 | 1,089,620 | 1064.1 | 17.32% | 5,746,120 | 677,536 | 2.06 |
| 13 | 2026-11-20T23:53:03Z | 28366bd0 | 1,047,888 | 1023.3 | 16.66% | 5,623,380 | 662,236 | 1.29 |
| 14 | 2026-11-20T23:54:03Z | 28366bd0 | 874,220 | 853.7 | 13.90% | 5,216,700 | 621,444 | 1.75 |
| 15 | 2026-11-20T23:55:03Z | 28366bd0 | 1,052,588 | 1027.9 | 16.73% | 5,337,248 | 615,324 | 3.00 |
| 16 | 2026-11-20T23:56:03Z | 28366bd0 | 910,436 | 889.1 | 14.47% | 5,474,212 | 618,352 | 1.28 |
| 17 | 2026-11-20T23:57:03Z | 28366bd0 | 1,202,972 | 1174.8 | 19.12% | 5,225,856 | 585,436 | 0.70 |
| 18 | 2026-11-20T23:58:03Z | 28366bd0 | 2,225,056 | 2172.9 | 35.37% | 4,528,540 | 609,520 | 1.65 |
| 19 | 2026-11-20T23:59:03Z | 28366bd0 | 1,995,152 | 1948.4 | 31.71% | 4,769,760 | 610,092 | 1.74 |
| 20 | 2026-11-21T00:00:03Z | 28366bd0 | 2,037,956 | 1990.2 | 32.39% | 4,732,500 | 623,700 | 1.12 |
| 21 | 2026-11-21T00:01:03Z | 28366bd0 | 2,250,420 | 2197.7 | 35.77% | 4,336,508 | 618,944 | 0.99 |
| 22 | 2026-11-21T00:02:03Z | 28366bd0 | 2,115,596 | 2066.0 | 33.63% | 4,600,852 | 621,256 | 0.36 |
| 23 | 2026-11-21T00:03:03Z | 28366bd0 | 1,908,792 | 1864.1 | 30.34% | 4,839,532 | 621,716 | 0.24 |
| 24 | 2026-11-21T00:04:03Z | 28366bd0 | 1,728,104 | 1687.6 | 27.47% | 5,058,312 | 619,312 | 0.43 |
| 25 | 2026-11-21T00:05:03Z | 28366bd0 | 1,550,968 | 1514.6 | 24.65% | 5,257,916 | 619,872 | 0.34 |
| 26 | 2026-11-21T00:06:03Z | 28366bd0 | 1,348,000 | 1316.4 | 21.43% | 5,438,424 | 623,568 | 0.29 |
| 27 | 2026-11-21T00:07:03Z | 28366bd0 | 1,210,748 | 1182.4 | 19.24% | 5,602,776 | 745,596 | 0.25 |
| 28 | 2026-11-21T00:08:03Z | 28366bd0 | 1,065,608 | 1040.6 | 16.94% | 5,050,996 | 679,268 | 1.01 |
| 29 | 2026-11-21T00:09:03Z | 28366bd0 | 855,872 | 835.8 | 13.60% | 5,181,040 | 696,048 | 2.85 |
| 30 | 2026-11-21T00:10:03Z | 28366bd0 | 1,005,064 | 981.5 | 15.98% | 5,013,164 | 684,748 | 2.66 |
| 31 | 2026-11-21T00:11:03Z | 28366bd0 | 1,047,868 | 1023.3 | 16.66% | 5,184,656 | 684,852 | 2.34 |
| 32 | 2026-11-21T00:12:03Z | 28366bd0 | 894,784 | 873.8 | 14.22% | 5,341,632 | 683,844 | 1.60 |
| 33 | 2026-11-21T00:13:03Z | 28366bd0 | 797,096 | 778.4 | 12.67% | 5,462,316 | 669,640 | 2.18 |
| 34 | 2026-11-21T00:14:03Z | 28366bd0 | 855,000 | 835.0 | 13.59% | 5,582,348 | 652,548 | 2.39 |
| 35 | 2026-11-21T00:15:03Z | 28366bd0 | 752,772 | 735.1 | 11.96% | 5,697,380 | 629,640 | 1.89 |
| 36 | 2026-11-21T00:16:03Z | 28366bd0 | 628,344 | 613.6 | 9.99% | 5,781,596 | 624,904 | 1.21 |
| 37 | 2026-11-21T00:17:03Z | 28366bd0 | 599,764 | 585.7 | 9.53% | 5,850,636 | 622,560 | 1.21 |
| 38 | 2026-11-21T00:18:04Z | 28366bd0 | 499,628 | 487.9 | 7.94% | 5,939,872 | 617,880 | 0.82 |
| 39 | 2026-11-21T00:19:04Z | 28366bd0 | 370,028 | 361.4 | 5.88% | 6,019,668 | 615,116 | 0.33 |
| 40 | 2026-11-21T00:20:04Z | 28366bd0 | 432,556 | 422.4 | 6.88% | 6,005,108 | 616,560 | 0.12 |
| 41 | 2026-11-21T00:21:04Z | 28366bd0 | 370,192 | 361.5 | 5.88% | 6,064,224 | 610,292 | 0.04 |
| 42 | 2026-11-21T00:22:04Z | 28366bd0 | 382,596 | 373.6 | 6.08% | 6,060,880 | 609,236 | 0.26 |
| 43 | 2026-11-21T00:23:04Z | 28366bd0 | 411,048 | 401.4 | 6.53% | 6,042,964 | 599,508 | 0.37 |
| 44 | 2026-11-21T00:24:04Z | 28366bd0 | 321,816 | 314.3 | 5.12% | 6,114,980 | 598,616 | 0.17 |
| 45 | 2026-11-21T00:25:04Z | 28366bd0 | 277,712 | 271.2 | 4.41% | 6,179,844 | 596,208 | 0.29 |
| 46 | 2026-11-21T00:26:04Z | 28366bd0 | 311,720 | 304.4 | 4.95% | 6,156,360 | 591,452 | 0.11 |
| 47 | 2026-11-21T00:27:04Z | 28366bd0 | 731,648 | 714.5 | 11.63% | 6,199,412 | 589,300 | 0.33 |
| 48 | 2026-11-21T00:28:04Z | 28366bd0 | 537,776 | 525.2 | 8.55% | 5,805,676 | 588,616 | 0.96 |
| 49 | 2026-11-21T00:29:04Z | 28366bd0 | 479,696 | 468.5 | 7.62% | 5,891,048 | 589,828 | 0.35 |
| 50 | 2026-11-21T00:30:04Z | 28366bd0 | 451,128 | 440.6 | 7.17% | 5,974,292 | 589,884 | 0.28 |
| 51 | 2026-11-21T00:31:04Z | 28366bd0 | 777,100 | 758.9 | 12.35% | 5,615,436 | 591,228 | 1.13 |
| 52 | 2026-11-21T00:32:04Z | 28366bd0 | 647,096 | 631.9 | 10.29% | 5,715,480 | 596,972 | 0.62 |
| 53 | 2026-11-21T00:33:04Z | 28366bd0 | 538,536 | 525.9 | 8.56% | 5,811,916 | 604,584 | 0.27 |
| 54 | 2026-11-21T00:34:04Z | 28366bd0 | 501,884 | 490.1 | 7.98% | 5,900,160 | 608,192 | 0.10 |
| 55 | 2026-11-21T00:35:04Z | 28366bd0 | 404,016 | 394.5 | 6.42% | 5,982,212 | 610,272 | 0.13 |
| 56 | 2026-11-21T00:36:04Z | 28366bd0 | 344,196 | 336.1 | 5.47% | 6,060,504 | 603,404 | 0.04 |
| 57 | 2026-11-21T00:37:04Z | 28366bd0 | 350,920 | 342.7 | 5.58% | 6,128,908 | 588,668 | 0.26 |
| 58 | 2026-11-21T00:38:04Z | 28366bd0 | 290,056 | 283.3 | 4.61% | 6,196,432 | 582,840 | 0.15 |
| 59 | 2026-11-21T00:39:04Z | 28366bd0 | 225,648 | 220.4 | 3.59% | 6,257,608 | 578,492 | 0.05 |
| 60 | 2026-11-21T00:40:04Z | 28366bd0 | 199,248 | 194.6 | 3.17% | 6,311,024 | 558,896 | 0.27 |
| 61 | 2026-11-21T00:41:04Z | 28366bd0 | 441,276 | 430.9 | 7.01% | 6,010,812 | 570,484 | 0.31 |
| 62 | 2026-11-21T00:42:04Z | 28366bd0 | 369,564 | 360.9 | 5.87% | 6,087,288 | 574,428 | 0.62 |
| 63 | 2026-11-21T00:43:04Z | 28366bd0 | 598,056 | 584.0 | 9.51% | 5,494,132 | 561,760 | 1.62 |
| 64 | 2026-11-21T00:44:04Z | 28366bd0 | 793,168 | 774.6 | 12.61% | 5,389,160 | 563,548 | 1.83 |
| 65 | 2026-11-21T00:45:04Z | 28366bd0 | 468,236 | 457.3 | 7.44% | 5,461,228 | 564,048 | 2.19 |
| 66 | 2026-11-21T00:46:04Z | 28366bd0 | 783,540 | 765.2 | 12.45% | 5,588,352 | 565,500 | 1.29 |
| 67 | 2026-11-21T00:47:04Z | 28366bd0 | 956,784 | 934.4 | 15.21% | 5,038,984 | 561,688 | 2.57 |
| 68 | 2026-11-21T00:48:04Z | 28366bd0 | 1,232,568 | 1203.7 | 19.59% | 4,958,552 | 568,508 | 1.77 |
| 69 | 2026-11-21T00:49:04Z | 28366bd0 | 1,068,792 | 1043.7 | 16.99% | 5,128,776 | 573,572 | 0.83 |
| 70 | 2026-11-21T00:50:05Z | 28366bd0 | 1,583,928 | 1546.8 | 25.18% | 5,297,156 | 580,200 | 0.68 |
| 71 | 2026-11-21T00:51:05Z | 28366bd0 | 1,411,936 | 1378.8 | 22.44% | 5,479,084 | 582,252 | 0.42 |
| 72 | 2026-11-21T00:52:05Z | 28366bd0 | 1,248,332 | 1219.1 | 19.84% | 5,643,964 | 583,100 | 0.22 |
| 73 | 2026-11-21T00:53:05Z | 28366bd0 | 1,126,692 | 1100.3 | 17.91% | 5,789,208 | 583,156 | 0.12 |
| 74 | 2026-11-21T00:54:05Z | 28366bd0 | 985,936 | 962.8 | 15.67% | 5,921,628 | 583,304 | 0.04 |
| 75 | 2026-11-21T00:55:05Z | 28366bd0 | 869,376 | 849.0 | 13.82% | 6,044,712 | 583,384 | 0.12 |
| 76 | 2026-11-21T00:56:05Z | 28366bd0 | 763,404 | 745.5 | 12.13% | 6,159,408 | 583,468 | 0.04 |
| 77 | 2026-11-21T00:57:05Z | 28366bd0 | 668,584 | 652.9 | 10.63% | 6,265,588 | 579,872 | 0.20 |
| 78 | 2026-11-21T00:58:05Z | 28366bd0 | 559,984 | 546.9 | 8.90% | 6,361,800 | 579,940 | 0.12 |
| 79 | 2026-11-21T00:59:05Z | 28366bd0 | 486,352 | 475.0 | 7.73% | 6,443,824 | 580,084 | 0.16 |
| 80 | 2026-11-21T01:00:05Z | 28366bd0 | 450,444 | 439.9 | 7.16% | 6,443,824 | 587,104 | 0.14 |
| 81 | 2026-11-21T01:01:05Z | 28366bd0 | 454,876 | 444.2 | 7.23% | 6,443,824 | 593,732 | 0.05 |
| 82 | 2026-11-21T01:02:05Z | 28366bd0 | 453,192 | 442.6 | 7.20% | 6,443,824 | 592,448 | 0.14 |
| 83 | 2026-11-21T01:03:05Z | 28366bd0 | 841,808 | 822.1 | 13.38% | 6,091,116 | 579,172 | 0.71 |
| 84 | 2026-11-21T01:04:05Z | 28366bd0 | 721,868 | 704.9 | 11.47% | 6,195,100 | 580,300 | 0.29 |
| 85 | 2026-11-21T01:05:05Z | 28366bd0 | 640,140 | 625.1 | 10.17% | 6,299,056 | 582,400 | 0.33 |
| 86 | 2026-11-21T01:06:05Z | 28366bd0 | 551,808 | 538.9 | 8.77% | 6,393,040 | 579,668 | 0.22 |
| 87 | 2026-11-21T01:07:05Z | 28366bd0 | 544,540 | 531.8 | 8.66% | 6,443,824 | 666,476 | 0.26 |
| 88 | 2026-11-21T01:08:05Z | 28366bd0 | 552,192 | 539.2 | 8.78% | 6,443,824 | 704,400 | 0.12 |
| 89 | 2026-11-21T01:09:05Z | 28366bd0 | 539,664 | 527.0 | 8.58% | 6,443,824 | 705,468 | 0.04 |
| 90 | 2026-11-21T01:10:05Z | 28366bd0 | 535,732 | 523.2 | 8.52% | 6,443,824 | 705,320 | 0.01 |
| 91 | 2026-11-21T01:11:05Z | 28366bd0 | 538,888 | 526.3 | 8.57% | 6,443,824 | 705,536 | 0.00 |
| 92 | 2026-11-21T01:12:05Z | 28366bd0 | 547,768 | 534.9 | 8.71% | 6,443,824 | 705,468 | 0.05 |
| 93 | 2026-11-21T01:13:05Z | 28366bd0 | 531,340 | 518.9 | 8.45% | 6,443,824 | 705,744 | 0.02 |
| 94 | 2026-11-21T01:14:05Z | 28366bd0 | 478,944 | 467.7 | 7.61% | 6,443,824 | 706,012 | 0.00 |
| 95 | 2026-11-21T01:15:05Z | 28366bd0 | 514,012 | 502.0 | 8.17% | 6,443,824 | 706,348 | 0.07 |
| 96 | 2026-11-21T01:16:05Z | 28366bd0 | 517,488 | 505.4 | 8.23% | 6,443,824 | 707,188 | 0.02 |
| 97 | 2026-11-21T01:17:05Z | 28366bd0 | 508,964 | 497.0 | 8.09% | 6,443,824 | 707,876 | 0.06 |
| 98 | 2026-11-21T01:18:05Z | 28366bd0 | 510,792 | 498.8 | 8.12% | 6,443,824 | 707,896 | 0.08 |
| 99 | 2026-11-21T01:19:05Z | 28366bd0 | 581,120 | 567.5 | 9.24% | 6,443,824 | 657,012 | 0.76 |
| 100 | 2026-11-21T01:20:05Z | 28366bd0 | 728,960 | 711.9 | 11.59% | 6,278,400 | 638,428 | 0.61 |
| 101 | 2026-11-21T01:21:05Z | 28366bd0 | 618,120 | 603.6 | 9.82% | 6,377,924 | 638,600 | 0.27 |
| 102 | 2026-11-21T01:22:05Z | 28366bd0 | 554,512 | 541.5 | 8.81% | 6,443,824 | 637,492 | 0.24 |
| 103 | 2026-11-21T01:23:05Z | 28366bd0 | 499,632 | 487.9 | 7.94% | 6,443,824 | 638,600 | 0.09 |
| 104 | 2026-11-21T01:24:05Z | 28366bd0 | 523,132 | 510.9 | 8.31% | 6,443,824 | 639,068 | 0.03 |
| 105 | 2026-11-21T01:25:05Z | 28366bd0 | 526,792 | 514.4 | 8.37% | 6,443,824 | 645,512 | 0.27 |
| 106 | 2026-11-21T01:26:05Z | 28366bd0 | 486,628 | 475.2 | 7.73% | 6,443,824 | 646,984 | 0.10 |
| 107 | 2026-11-21T01:27:05Z | 28366bd0 | 514,652 | 502.6 | 8.18% | 6,443,824 | 647,052 | 0.18 |
| 108 | 2026-11-21T01:28:05Z | 28366bd0 | 506,112 | 494.2 | 8.04% | 6,443,824 | 646,716 | 0.10 |
| 109 | 2026-11-21T01:29:05Z | 28366bd0 | 501,532 | 489.8 | 7.97% | 6,443,824 | 647,184 | 0.04 |
| 110 | 2026-11-21T01:30:05Z | 28366bd0 | 493,180 | 481.6 | 7.84% | 6,443,824 | 647,112 | 0.01 |
| 111 | 2026-11-21T01:31:05Z | 28366bd0 | 475,464 | 464.3 | 7.56% | 6,443,824 | 647,636 | 0.00 |
| 112 | 2026-11-21T01:32:05Z | 28366bd0 | 487,448 | 476.0 | 7.75% | 6,443,824 | 648,408 | 0.06 |
| 113 | 2026-11-21T01:33:05Z | 28366bd0 | 496,404 | 484.8 | 7.89% | 6,443,824 | 649,108 | 0.11 |
| 114 | 2026-11-21T01:34:05Z | 28366bd0 | 499,304 | 487.6 | 7.94% | 6,443,824 | 647,972 | 0.11 |
| — | — | — | — | — | — | — | — | — |
| 115 | 2026-11-21T01:35:25Z | eec65561 | 1,750,264 | 1709.2 | 27.82% | 5,152,708 | 994,488 | 2.78 |
| 116 | 2026-11-21T01:36:25Z | eec65561 | 1,613,040 | 1575.2 | 25.64% | 5,352,360 | 867,280 | 2.21 |
| 117 | 2026-11-21T01:37:25Z | eec65561 | 1,449,224 | 1415.3 | 23.03% | 5,540,108 | 871,040 | 0.81 |
| 118 | 2026-11-21T01:38:25Z | eec65561 | 1,305,640 | 1275.0 | 20.75% | 5,708,860 | 836,204 | 0.74 |
| 119 | 2026-11-21T01:39:25Z | eec65561 | 1,590,544 | 1553.3 | 25.28% | 5,408,872 | 780,864 | 0.64 |
| 120 | 2026-11-21T01:40:25Z | eec65561 | 1,386,940 | 1354.4 | 22.04% | 5,592,240 | 784,872 | 0.27 |
| 121 | 2026-11-21T01:41:25Z | eec65561 | 1,250,560 | 1221.2 | 19.88% | 5,756,496 | 784,416 | 0.40 |
| 122 | 2026-11-21T01:42:25Z | eec65561 | 1,137,896 | 1111.2 | 18.09% | 5,902,212 | 780,120 | 2.82 |
| 123 | 2026-11-21T01:43:25Z | eec65561 | 1,006,144 | 982.6 | 15.99% | 6,037,932 | 770,112 | 2.22 |
| 124 | 2026-11-21T01:44:25Z | eec65561 | 864,252 | 844.0 | 13.74% | 6,158,484 | 764,040 | 2.17 |
| 125 | 2026-11-21T01:45:25Z | eec65561 | 746,968 | 729.5 | 11.87% | 6,269,396 | 761,328 | 1.54 |
| 126 | 2026-11-21T01:46:25Z | eec65561 | 670,360 | 654.6 | 10.66% | 6,372,056 | 759,948 | 1.32 |
| 127 | 2026-11-21T01:47:25Z | eec65561 | 598,644 | 584.6 | 9.52% | 6,443,824 | 750,684 | 1.20 |
| 128 | 2026-11-21T01:48:25Z | eec65561 | 584,648 | 570.9 | 9.29% | 6,443,824 | 748,184 | 1.15 |
| 129 | 2026-11-21T01:49:25Z | eec65561 | 604,740 | 590.6 | 9.61% | 6,443,824 | 748,324 | 1.86 |
| 130 | 2026-11-21T01:50:25Z | eec65561 | 590,376 | 576.5 | 9.38% | 6,443,824 | 748,320 | 0.81 |
| 131 | 2026-11-21T01:51:25Z | eec65561 | 612,044 | 597.7 | 9.73% | 6,443,824 | 741,560 | 0.36 |
| 132 | 2026-11-21T01:52:25Z | eec65561 | 608,212 | 594.0 | 9.67% | 6,443,824 | 741,592 | 0.56 |
| 133 | 2026-11-21T01:53:25Z | eec65561 | 606,716 | 592.5 | 9.64% | 6,443,824 | 741,624 | 0.57 |
| 134 | 2026-11-21T01:54:25Z | eec65561 | 617,148 | 602.7 | 9.81% | 6,443,824 | 728,596 | 0.71 |
| 135 | 2026-11-21T01:55:25Z | eec65561 | 954,672 | 932.3 | 15.17% | 6,093,964 | 707,332 | 1.86 |
| 136 | 2026-11-21T01:56:25Z | eec65561 | 815,132 | 796.0 | 12.96% | 6,214,704 | 708,252 | 0.68 |
