# LIMITS — Phase 9 đợt 157, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ mười một liên tiếp; headroom 0 → 0; balloon GHIM TRẦN 2 EPISODE MỚI, 33/129 mẫu, 3 chuỗi, 1 boot; MỘT reboot giữa phiên #57; ENOSPC ≥106 dòng trên 2 boot; lượt yên #26 CÓ lượt hợp lệ #22)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 0/0 (20:43:59Z, boot #56 348dab54) → đóng 0/0/0/0 (22:48:34Z, boot #57 bcbaa3ad)** — **vẫn dưới ngưỡng < ~1.800 lần thứ mười bảy liên tiếp**; tỉ lệ/vite **0 → 0**; trần 63.747 không đổi. Quyết (l) đợt 156 "chỉ theo dõi" đứng, không hành động. Xem §1.
- **Balloon GHIM TRẦN 2 EPISODE MỚI — 33/129 mẫu (25,6%), 3 chuỗi, MỘT boot (#57 bcbaa3ad):** episode A chuỗi 1 (21:31:39–21:41:40Z, 11 mẫu, đứt quan sát được 21:42:40Z xả về 93,9%, xả sâu tới 81,5% lúc 21:47:40Z) + episode B chuỗi 2+3 (22:04:41–22:13:41Z, 10 mẫu + 22:19:41–22:30:41Z, 12 mẫu — cách nhau bởi dip NÔNG 5 mẫu tới 94,4% trần, KHÔNG xả sâu, gate A KHÔNG mở lần nào trong dip — đếm là 1 episode theo quy tắc (g) đợt 152 + tiền lệ đợt 156; xem F-157-T9-7). Cả ba chuỗi đều đứt quan sát được (khác đợt 156: chuỗi 2 bị reboot cắt). Xem §2.2.
- **RAM:** sampler **129 mẫu, 20:43:26–22:51:42Z, HAI boot** (23 mẫu #56 + 106 mẫu #57 — 1 gap 72 s tại reboot #57, không gap >90 s). Min **357.616 kB (349,2 MiB) lúc 22:46:42Z — thấp nhất kể từ đợt 151** (đợt 156: 394.324); max **2.612.316 kB (2.551,1 MiB = 41,52% guard) lúc 21:04:27Z**; mean 1.054.818 kB. Gate A ≥1024 MiB: **53/129 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ mười một liên tiếp.** Xem §2, §3.
- **B2: 13 spike load1 ≥3,0 — 11 QUY ĐƯỢC DRIVER CỤ THỂ + 2 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ".** Cụm 1 (6 spike, test render pixelate geq + apt os-intent replay, đỉnh 8,28) + cụm 2 (4 spike, apt replay + ffmpeg i7 + daemon sau reboot, đỉnh 5,99) + cụm 3 (3 spike, O8 clicktest WebKit/Chromium, đỉnh 4,12). **0 spike trong cả hai cửa sổ balloon ghim** (~36 phút ghim). Delta tick lớn nhất 114 tick/s (ffmpeg geq). Xem §2.5.
- **Lượt yên WebKit #26 (T4): CÓ LƯỢT HỢP LỆ #22 — chuỗi lượt yên hợp lệ TIẾP TỤC sau khi dừng ở #21 bốn đợt** (#22/#23/#24/#25 không có lượt hợp lệ). Attempt1-348dab54 20/20, lớp B 5/5, tickCost median 41,0 ms ≤60 (21:00:27–21:04:20Z, boot #56); poller 25 poll, 1 cửa mở (poll #24), ngân sách 1/3, 0 PAGE-WEDGED. P3' mới: **44/52 occ = 44/47 distinct-seq**. Sampler T9 đối chiếu độc lập: gate A MỞ 4/4 mẫu trong cửa sổ attempt, 0 spike B2 trong cửa sổ attempt. Xem §2.3.
- **MỘT reboot giữa phiên: #57 bcbaa3ad, btime 21:05:15Z** (theo /proc/stat; T4/T7/T8/coordinator gọi #57 — T0-157 đóng trước reboot nên chưa xác nhận, giao T2-157/T10-157 chốt). Sampler + watcher chết theo reboot, T9 khởi động lại bằng tay, gap phủ sóng 72 s. **Mẫu cuối boot #56 21:05:27Z nằm 12 s SAU btime #57 — chênh lệch đồng hồ giữa hai boot ≥12 s** (xem F-157-T9-3). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: ≥106 dòng trên HAI boot** — #56: ≥16 dòng (7 do T9 đếm lúc 20:43:59Z; 10 do T0 đếm lúc ~20:47Z; 16 do T5 đếm lúc 20:56:13Z — lấy 16 làm số quan sát cuối; xem F-157-T9-5) + #57: 90 dòng lúc đóng (22:48:34Z). **Đợt thứ sáu liên tiếp bảng watch cạn gây lỗi thật thấy được.** Xem §4.
- **T5-157 (đối chiếu):** POSTBOOT_PASS #56 ĐÃ CÓ (qua replay đầy đủ, không cần repair); #53/#54/#55 KHÔNG CÓ, không bù được; POSTBOOT_PASS #57 giao T5-158. Xem §5.2.
- **Đồng hồ (T0-157 XÁC NHẬN):** mâu thuẫn boot lúc mở đã giải quyết — wall clock của cell trong suốt đợt 156 chạy NHANH hơn giờ thật J ≥ 42'46"; btime #56 19:32:47Z là giờ thật; T10-156 KHÔNG sai. Đồng hồ đã đúng từ boot #56 (Date header github.com khớp lúc 20:44:16Z) — **mọi timestamp T9-157 là giờ thật, không cần hiệu chỉnh J**. Xem §5.1, F-157-T9-1.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round157-t9/k8-headroom.py` (copy y nguyên từ đợt 156 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 157

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 20:43:59Z 20/11 | **0** | #56 348dab54 (btime 19:32:47Z) | lần đo 1, boot ~71' tuổi; RAM trước đo 959.124 kB, balloon 5.860.244 kB, load1 0,69 |
| 20:43:59Z 20/11 | **0** | #56 348dab54 | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 975.916 kB, balloon 5.860.244 kB |
| 22:48:34Z 20/11 | **0** | #57 bcbaa3ad (btime 21:05:15Z) | lần đo 3 (đóng phiên, boot thứ hai trong phiên); RAM trước đo 897.088 kB, balloon 5.516.932 kB, load1 0,49 |
| 22:48:34Z 20/11 | **0** | #57 bcbaa3ad | lần đo 4 (chênh **0** so với lần 3) |
| 22:48:34Z 20/11 | **0** | #57 bcbaa3ad | lần đo 5 (xác nhận thêm) |
| 22:48:34Z 20/11 | **0** | #57 bcbaa3ad | lần đo 6 (xác nhận thêm lần nữa) |

- Probe dừng ở `i=0` cả sáu lần — `inotify_add_watch` đầu tiên trả errno 28 (không thêm được watch nào), đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau mỗi lần đo).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 0 = **63.747 watch** (bảng watch đầy hẳn, 0 watch trống) cả lúc mở lẫn lúc đóng.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **0 / 1.578 = 0** mở đợt và đóng phiên — **chuỗi "đóng ở 0" trở lại sau một đợt nhích lên 2 (đợt 156)**; một vite mới (~1.578 watch) vẫn không khởi động được.
- **Giải thích thận trọng:** 2 watch trống đợt 156 nhiều khả năng là 1–2 watch holder ngắn hạn chết qua ba reboot trong phiên đó (như T9-156 đã ghi ở F-156-T9-1); đợt này bảng lại đầy hẳn sau reboot #57 — củng cố giải thích đó, KHÔNG phải xu hướng hồi phục rồi lại cạn. T9 không claim xu hướng; chỉ ghi số đo đã xác nhận 6 lần.
- T5-157 KHÔNG probe lại headroom đợt này (như đợt 151–156) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 2 lần đo mở chênh 0 + 4 lần đo đóng đều 0 + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal HAI boot có ≥106 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM trước đo lần đóng (~0,90 GB) thấp hơn lần mở (~0,96–0,98 GB) trong khi headroom 0 → 0. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–156 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **157** | **0 → 0** | **mở 20:43:59Z boot #56 348dab54 btime 19:32:47Z → đóng 22:48:34Z boot MỚI #57 bcbaa3ad btime 21:05:15Z (MỘT reboot giữa phiên; 4 lần đo đóng đều 0)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — đợt 156 nhích lên 2 đã quay về 0.** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**. Bước nhích đợt này: 0 (đo 6 lần: 0, 0 mở + 0, 0, 0, 0 đóng).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ mười bảy liên tiếp.** Quyết parent đợt 156 (l): GIỮ quyết (g) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal HAI boot có ≥106 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ sáu liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng — đợt 156 ít hơn vì journal của 3 boot cũ mất theo 3 reboot, xem §4/F-157-T9-5). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 20:43Z và lúc đóng 22:48Z — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.747 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.048.572 kB) — sampler 129 mẫu, 20:43:26–22:51:42Z, HAI boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên trên boot #56 (T1 verify + T4 attempt, đỉnh 2.612.316 kB) → reboot #57 → RAM hồi sau boot rồi rơi dần khi balloon leo → ghim trần 2 episode trên boot #57 (RAM trũng ~358–610k) → xả sâu lúc đóng, RAM hồi nhẹ

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; 1 gap 72 s do reboot #57 — xem §5.1). **129 mẫu, 20:43:26–22:51:42Z 20/11, HAI boot — gap lớn nhất 72 s, KHÔNG có gap >90 s.** Tổng quan: **min 357.616 kB (349,2 MiB) lúc 22:46:42Z; max 2.612.316 kB (2.551,1 MiB) lúc 21:04:27Z — 41,52% guard; mean 1.054.818 kB (1.030,1 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 20:43:26–20:50:26Z | #56 | 514.720–2.137.132 kB | T1 verify (test render geq + npm test) + apt replay; gate A MỞ 6/8 mẫu; load1 tới 4,39 (sampler) |
| 20:51:26–20:54:26Z | #56 | 1.503.056–1.955.448 kB | Cụm spike B2 20:51:20–20:54:16Z (test render geq 1920x1080 + apt replay, đỉnh load1 sampler 8,00 lúc 20:53:26Z); gate A MỞ 4/4 mẫu |
| 20:55:26–21:05:27Z | #56 | 1.062.536–2.612.316 kB | T4 attempt1 lượt yên #26 (21:00:27–21:04:20Z); **đỉnh phiên 21:04:27Z** (balloon xả sâu nhất phiên 4.132.416 kB = 64,1% trần); gate A MỞ 11/11 mẫu; mẫu cuối boot cũ 21:05:27Z (2.396.272 kB) |
| 21:06:39–21:08:39Z | #57 | 1.768.428–2.444.772 kB | Sau reboot #57: RAM hồi, balloon xả 4.236.084 kB; gate A MỞ 3/3; load1 3,57–5,43 (tải boot + apt replay) |
| 21:09:39–21:30:39Z | #57 | 487.428–2.237.504 kB | RAM rơi khi balloon leo 4,7M → 6,42M kB; gate A MỞ 13/22 mẫu đầu, rồi ĐÓNG từ ~21:26Z |
| 21:31:39–21:41:40Z | #57 | 502.876–551.164 kB | **Ghim trần episode A, 11 mẫu trong 1 chuỗi** (xem §2.2); RAM trũng sâu; **gate A ĐÓNG cả 11 mẫu**; load1 ≤0,25 (yên hoàn toàn về tải) |
| 21:42:40–22:04:41Z | #57 | 545.268–1.591.380 kB | Đứt ghim chuỗi 1 (balloon xả về 6.050.608 kB = 93,9%, xả sâu tới 5.250.444 kB = 81,5% lúc 21:47:40Z); gate A MỞ 9/23 mẫu; RAM hồi rồi rơi lại khi balloon leo |
| 22:04:41–22:13:41Z | #57 | 538.904–608.340 kB | **Ghim trần episode B (chuỗi 2), 10 mẫu** (xem §2.2); RAM trũng; **gate A ĐÓNG cả 10 mẫu**; load1 ≤0,57 |
| 22:14:41–22:18:41Z | #57 | 660.184–935.536 kB | **Dip NÔNG giữa chuỗi 2 và chuỗi 3** (balloon 6.085.264–6.380.632 kB = 94,4–99,0% trần); gate A ĐÓNG cả 5 mẫu — không xả sâu |
| 22:19:41–22:30:41Z | #57 | 535.852–596.572 kB | **Ghim trần episode B (chuỗi 3), 12 mẫu** (xem §2.2); RAM trũng; **gate A ĐÓNG cả 12 mẫu**; load1 ≤0,51 |
| 22:31:41–22:51:42Z | #57 | 357.616–1.718.476 kB | Đứt ghim chuỗi 3 (balloon xả về 6.090.336 kB = 94,5%, xả sâu tới 5.409.252 kB = 83,9% lúc 22:32:41Z); cụm O8 clicktest 22:33:03–22:35:15Z (load1 tới 4,12); **RAM min phiên 22:46:42Z (357.616 kB)**; gate A MỞ 5/21 mẫu; mẫu cuối 22:51:42Z 737.432 kB, gate A ĐÓNG |

- **Gate A ≥1024 MiB: 53/129 mẫu** (21/23 boot #56 + 32/106 boot #57); **0 mẫu ≥ guard**; load1 max (sampler) **8,00 lúc 20:53:26Z**; **7/129 mẫu load1 ≥3,0** (4 mẫu boot #56 + 3 mẫu boot #57). **RAM <512.000 kB: 7 mẫu** (487.428 lúc 21:30:39Z; 502.876 lúc 21:33:40Z; 506.484 lúc 21:35:40Z — cả ba trong episode A; 495.008 lúc 22:43:42Z; 437.724 lúc 22:44:42Z; 358.108 lúc 22:45:42Z; 357.616 lúc 22:46:42Z — cả bốn lúc đóng, balloon leo lại 94–96% trần sau khi xả).
- Swap: SwapFree 770.252 kB (mẫu đầu) → 611.032 kB (mẫu cuối); dao động 611.032–1.037.344 kB — nhảy lên ~1.037.000 kB ngay sau reboot #57 (xả swap theo reboot) rồi tụt dần về ~611–660k kB.
- Đối chiếu T4-157 (LIMITS đã xuất bản — xem §2.3): RAM ≥1024 trên boot #56 suốt cửa sổ attempt (poll #24 mở cửa 21:00:27Z); sampler T9: gate A MỞ 4/4 mẫu 21:00:27–21:03:27Z + 1 mẫu ngay sau attempt 21:04:27Z — khớp T4 mở cửa. T4 ghi 25 poll, 1 cửa mở; sampler T9: 0/23 mẫu boot #56 <512.000 kB ngoài 1 mẫu 514.720 kB lúc 20:44:26Z (trên 512.000 kB) — cùng kết luận RAM không sập trong attempt.
- Mẫu 21:04:27Z (đỉnh phiên): RAM 2.612.316 kB, balloon xả 4.132.416 kB — balloon xả sâu nhất phiên ngay sau T4 attempt1 (cùng mẫu đợt 152/153/154/155/156: xả sâu sau reboot / lúc suite chạy / sau attempt). T9 ghi đúng số đo, không phán cơ chế.

### 2.2 Balloon virtio — GHIM TRẦN 2 EPISODE MỚI, 33/129 mẫu, 3 chuỗi, MỘT boot

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #56: GHIM TRẦN 0/23 mẫu (0%)** — balloon cao nhất 6.027.020 kB (93,5% trần) lúc 20:45:26Z, chưa chạm trần lần nào.
- **Boot #57 (bcbaa3ad): GHIM TRẦN 33/106 mẫu (31,1%), trong 3 chuỗi — 2 EPISODE:**
  - **Chuỗi 1: 21:31:39–21:41:40Z, 11 mẫu** (span 601 s, 10 phút); đứt 21:42:40Z (balloon xả về 6.050.608 kB = 93,9% trần), xả sâu tới 5.250.444 kB (81,5% trần) lúc 21:47:40Z, RAM hồi 1.591.380 kB (gate A MỞ).
  - **Chuỗi 2: 22:04:41–22:13:41Z, 10 mẫu** (span 540 s, 9 phút); đứt 22:14:41Z (balloon xả về 6.247.216 kB = 97,0% trần).
  - **Dip nông: 22:14:41–22:18:41Z, 5 mẫu** — balloon 6.085.264 kB (94,4% trần) lúc 22:15:41Z là điểm thấp nhất, rồi leo lại 95,6% / 97,4% / 99,0%; RAM trong dip tối đa 935.536 kB, **gate A KHÔNG mở lần nào**.
  - **Chuỗi 3: 22:19:41–22:30:41Z, 12 mẫu** (span 660 s, 11 phút); **đứt 22:31:41Z (balloon xả về 6.090.336 kB = 94,5% trần), xả sâu tới 5.409.252 kB (83,9% trần) lúc 22:32:41Z, RAM hồi 1.718.476 kB lúc 22:35:42Z (gate A MỞ)** — quan sát được điểm đứt + xả sâu.
- **Tổng ghim trần đợt này: 33/129 mẫu (25,6%)** (đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **3/3 chuỗi quan sát được điểm đứt** (như đợt 155: 4/4; khác đợt 156: 1 chuỗi bị reboot cắt).
- **Phán theo quy tắc quyết (e)/(g) (T9 phán, giao T10 xác nhận cách đếm):**
  - **Episode A (boot #57, chuỗi 1): 1 EPISODE.** Chuỗi đơn, đứt quan sát được + xả sâu tới 81,5% + ~23 phút không ghim trước chuỗi 2.
  - **Episode B (boot #57, chuỗi 2+3): 1 EPISODE.** Hai chuỗi cùng boot, cách nhau bởi dip NÔNG (94,4% / 95,6% / 97,4% / 99,0% trần — KHÔNG phải xả sâu; gate A đóng suốt dip; chỉ 5 mẫu / ~5 phút) — đếm là 1 episode theo quy tắc (g) đợt 152 + tiền lệ đợt 156 (episode A đợt 156: dip tới 95,2% vẫn cùng episode). Xem F-157-T9-7 về điểm khác biệt duy nhất (dip đợt này sâu hơn tiền lệ 0,8 điểm phần trăm).
  - **A và B là HAI EPISODE RIÊNG, không nối nhau:** giữa lần ghim cuối episode A (21:41:40Z) và lần chạm đầu episode B (22:04:41Z) có **xả sâu tới 5.250.444 kB (81,5% trần) + RAM hồi tới 1.591.380 kB (gate A MỞ 9 mẫu) + ~23 phút không ghim** — đủ điều kiện tách episode (xả sâu + thời gian không ghim; cùng boot nên không có reboot tách, nhưng xả sâu + hồi RAM là đủ theo quy tắc (e)).
  - **Cả hai episode đều MỚI, không nối đợt 156:** giữa lần ghim cuối đợt 156 (19:33:46Z, boot #55) và lần chạm đầu đợt 157 (21:31:39Z, boot #57) có **HAI reboot (#56 lúc mở + #57 giữa phiên) + balloon xả sâu nhiều lần (tới 4.132.416 kB = 64,1% trần lúc 21:04:27Z) + ~2 giờ không ghim**.
  - **Đợt 157 = 2 EPISODE GHIM MỚI** (A: 11 mẫu/1 chuỗi; B: 22 mẫu/2 chuỗi) — đợt thứ hai liên tiếp có 2 episode (đợt 156 cũng 2 episode, trên 2 boot; đợt này cả 2 episode trên 1 boot).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~358–610.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 22:51:42Z: tổng RAM 8.124.900 kB − balloon 5.590.464 kB = 2.534.436 kB còn lại; MemAvailable 737.432 kB.

### 2.3 Lượt yên WebKit #26 (T4, đợt 157) — CÓ LƯỢT HỢP LỆ #22, CHUỖI TIẾP TỤC (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-157 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND157_T4_WEBKIT_QUIET26_LIMITS.md`) + cờ `round157-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Poller T4 chạy 1 instance, 25 poll thật (1 test + 24), 1 boot (#56), 1 cửa mở (poll #24 21:00:27Z):**
  - **Attempt1-348dab54 (21:00:27–21:04:20Z): probe 20/20, LỚP B ĐẠT 5/5, tickCost median 41,0 ms ≤60 — HỢP LỆ.** Ngân sách đã dùng 1/3. **Lượt yên #22 HỢP LỆ.**
  - **0 PAGE-WEDGED** (khác đợt 156: attempt2/3 wedged). Poller thoát sau attempt1 hợp lệ (không cần retry).
  - RAM ≥1024: poll #24 mở cửa; (c2) seq ĐẠT 168, 221, 301, 330, 360.
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): CÓ 1 attempt hợp lệ cho lượt yên #26 (#22)** — chuỗi lượt yên hợp lệ **TIẾP TỤC ở #22** sau khi dừng ở #21 bốn đợt (#22/#23/#24/#25 không có lượt hợp lệ). Cộng dồn 22 lượt theo LIMITS T4-157: P1 79/80, P2 71/71, P3-A1 65/80, **P3' 44/52 occurrence = 44/47 distinct-seq**, P7 56/56; (c2) 11 occ / 8 distinct-seq, COVERED 11/11.
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Gate A RAM: **MỞ 4/4 mẫu trong cửa sổ attempt** (21:00:27–21:03:27Z, RAM 1.243.584–1.776.700 kB) + mẫu ngay sau attempt 21:04:27Z (2.612.316 kB, đỉnh phiên) — khớp T4 mở cửa poll #24 21:00:27Z (sampler mẫu 21:00:27Z đúng 1.776.700 kB).
  - Tải: sampler load1 trong cửa sổ attempt **0,40–1,50** (yên); **0 spike B2 trong cửa sổ attempt** (spike gần nhất trước attempt 20:54:16Z, sau attempt 21:06:39Z — spike sau thuộc boot #57, sau khi poller thoát).
  - RAM <512.000 kB: sampler T9 **0/23 mẫu boot #56 <512.000 kB** (mẫu thấp nhất boot #56 là 514.720 kB lúc 20:44:26Z, vẫn trên 512.000 kB).
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy 21:00:27–21:04:20Z trên boot #56 (1 instance; attempt1 21:00:27–21:04:20Z).

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 21:00:27–21:03:27Z | #56 | 0,40–1,50 (4 mẫu) | 1.243.584–1.776.700 kB — **gate A MỞ 4/4** | T4 attempt1 — RAM mở, tải yên; attempt1 HỢP LỆ (tickCost median 41,0 ms ≤60) |
| 21:04:27Z | #56 | 1,22 (1 mẫu) | 2.612.316 kB — **gate A MỞ** | Ngay sau attempt (7 s sau khi attempt kết thúc 21:04:20Z); đỉnh RAM phiên, balloon xả sâu nhất phiên |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 13 spike, 11 QUY ĐƯỢC DRIVER CỤ THỂ + 2 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ" (0 spike trong cả hai cửa sổ balloon ghim)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-157-T9-6). **13 spike, trong 20:51:20–22:35:15Z; 0 spike trong 21:31:39–21:41:40Z (~10 phút episode A) và 22:04:41–22:30:41Z (~26 phút episode B, gồm cả dip nông giữa chuỗi 2–3) — tổng ~36 phút ghim, tải yên hoàn toàn.**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — test render geq + apt replay (6 spike) | 20:51:20–20:54:16Z | 4,34–**8,28** | 6 | ffmpeg testsrc2 geq 640x360 delta **82** (spike 1); ffmpeg testsrc2 geq 1280x720 delta **113** (spike 2); ffmpeg testsrc2 geq 1920x1080 top tức thời 60% (spike 3, delta không bắt được do ffmpeg chết trước delta); ffmpeg testsrc2 geq 1920x1080 delta **114** (spike 4); apt-get libwoff1 delta **66** + daemon 30 (spike 5); daemon delta 12, KHÔNG process nào khác (spike 6) | **Test render pixelate geq (T1) + apt os-intent replay** — cùng họ đợt 156 (ffmpeg render geq); spike 6 lớp load1 dư (dư sau burst geq + apt) |
| 2 — apt replay + ffmpeg i7 sau reboot (4 spike) | 21:06:39–21:08:26Z | 4,04–5,99 | 4 | apt-get aspell + daemon delta **44** (spike 7); ffmpeg testsrc2 640x360 (i7-clip-10s) delta **102** + apt-get hunspell delta 13 (spike 8); apt-get delta **85** + daemon 6 (spike 9); apt-get gstreamer-ugly delta **98** + daemon 8 (spike 10) | **apt os-intent replay sau reboot #57 + ffmpeg render i7-clip + hatch daemon lúc boot** — spike 7–10 đều trong 3 phút đầu boot mới |
| 3 — O8 clicktest (3 spike) | 22:33:03–22:35:15Z | 3,03–4,12 | 3 | MiniBrowser delta **20** + WebKitNetworkProcess delta **17** + vite 3 (spike 11); chrome renderer delta **41** + chrome main 29 + network 26 (spike 12); daemon delta 3, KHÔNG process nào khác (spike 13) | **O8 clicktest WebKit (spike 11, vite port 5560) + Chromium (spike 12, vite port 5554)** của T8; spike 13 lớp load1 dư (burst chrome đã tàn trước delta) |

- **Tổng kết đếm: 11/13 spike có driver process cụ thể** (cụm 1: 5; cụm 2: 4; cụm 3: 2) **+ 2/13 spike lớp "load1 dư"** (cụm 1: 1; cụm 3: 1 — ghi rõ trong bảng trên, không gộp chung thành "đã quy được nguồn"). Lớp load1 dư có cơ chế chung: load1 là trung bình 1 phút còn dư sau burst trước + tải nền từ nhiều process ngắn hạn (mỗi process chết trước khi đo delta / không lọt top-5 theo %CPU tích lũy) — corroborate bằng load5 của watcher (không bao giờ đủ mở cửa vì RAM, tải yên) và nr_running 2–14 trong các header spike.
- **Caveat đếm (F-157-T9-6):** lệnh chờ của chính T9 (`sleep 1500`) xuất hiện trong snapshot `ps` của b2-spikes.log (spike 21:07:50Z + 22:35:15Z) ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `grep -c '^=== SPIKE'` = **13**.
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log** — F-150-T9-8 VẪN ĐÓNG.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution (vd spike 3: ffmpeg 60% top dù chết trước delta). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 11 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 11/13 spike; 2 spike còn lại chỉ quy được lớp load1 dư — giới hạn phương pháp đã biết (process ngắn hạn / tải phân tán), T9 ghi rõ thay vì gộp chung.
- **Delta tick lớn nhất đợt: 114 tick/s** (ffmpeg testsrc2 geq 1920x1080, spike 20:53:05Z); ffmpeg 82–113 tick/s; ffmpeg i7-clip 102 tick/s; apt-get 66–98 tick/s; daemon 6–44 tick/s; chrome renderer 41 tick/s; MiniBrowser 20 tick/s; WebKitNetworkProcess 17 tick/s. (Đợt 156: max 103 tick/s.)
- **testsrc2:** 4/13 spike do testsrc2 geq gây ra (640x360, 1280x720, 1920x1080 ×2 — cùng họ test render pixelate geq chạy lại mỗi đợt, như đợt 147–156); 1/13 spike do ffmpeg testsrc2 KHÔNG geq (i7-clip-10s 640x360, /tmp/round81-i7) — cùng họ test render; PID testsrc2 ngắn hạn, thoát bình thường; không process nào kẹt lại. Không mở điều tra thêm (họ F-147/148/149-T9-3 đã ĐÓNG đợt 150).
- **Watcher gap do reboot:** watcher chết theo reboot #57; tối đa ~2–3 lần kiểm (cadence 30 s) bị mất trong gap 72 s (21:05:27–21:06:39Z). Load1 tại mép gap 0,45 → 4,30 (tải boot + apt replay đang leo) — **có thể 1 spike (tải boot/apt replay) bị mất trong gap, không chứng minh được** (spike 21:06:39Z bắt ngay khi watcher khởi động lại); xem F-157-T9-4.

### 2.6 Truy chủ ffmpeg testsrc2 — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này testsrc2 xuất hiện trong 4/13 spike geq + 1/13 spike i7-clip, là **test render pixelate geq + render i7-clip trong đợt 157** (T1) — chạy đúng chức năng, thoát bình thường. T9 không truy chủ lại từng PID (không có spike ngoài họ test render + apt replay + daemon boot + O8 clicktest; không process lạ).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (TRỪ GAP 72 S TẠI REBOOT #57); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ mười một liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148–156 giữ nguyên; quyết parent (l) đợt 156 GIỮ NGUYÊN cơ chế (a) armed): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **2.612.316 kB = 2.551,1 MiB = 41,52% guard lúc 21:04:27Z** — xa guard 3.679.140 kB. Số đỉnh đợt 157 chờ T1-158 đối chiếu.
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ mười một liên tiếp (147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157).** Cơ chế tự động armed cả phiên (sampler `round157-t9/sampler.sh`, pid 3380 rồi pid 2024 sau reboot #57, chạy 20:43:26–22:51:42Z, 129 mẫu — trừ gap 72 s tại reboot #57, xem §5.1) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→157 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**, **3.211**, **2.779**, **3.477**, **2.612**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 20:43:26–22:51:42Z (129 mẫu, chỉ 1 gap 72 s tại reboot #57 rồi khởi động lại bằng tay); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 156 nằm trong dir round156-t9 nên không chặn đợt này (dir mới round157-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-157-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-157-birefnet/out-birefnet-157.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147–156):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-157-T9-9); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-157-T9-8 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra — đợt này T4 có 1 attempt hợp lệ nhưng cửa sổ guard không mở nên điểm (c) không phát sinh). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này MỘT LẦN: reboot #57 giết sampler, gap 72 s** (đợt 156: gap tổng 226 s; đợt 155: gap 61 s; đợt 154: gap 95 s; đợt 153: gap 61 s; đợt 152: gap 71 s; đợt 151: gap 46 s; đợt 149: gap 87 s) — dữ kiện này KHÔNG ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" ở mức tuyệt đối, nhưng gap 72 s / ~7.300 s phiên (~1,0%) là nhỏ và T9 khởi động lại bằng tay kịp thời; T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10. **Bổ sung: T5-157 triển khai watcher respawn theo quyết parent (e) đợt 153 (phương án 1 + quy tắc đứng (3)) — cùng họ vấn đề với sampler T9; T5 là chủ quản, T9 chỉ nêu dữ kiện.**
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Phương pháp đếm (ghi rõ):** `journalctl --no-pager | grep -c 'No space left on device'` trên boot đang chạy tại thời điểm đếm; journald chỉ giữ 1 boot (volatile) nên **số cuối của một boot KHÔNG kiểm được sau khi reboot sang boot mới** (cùng giới hạn F-155-T10-1 / F-154-T1-3). Mỗi boot dưới đây ghi rõ: số đếm được lần cuối + thời điểm đếm + ai đếm. **Tổng phiên là CẬN DƯỚI (≥), không phải số đếm đầy đủ.**
- **Journal trên boot #56 (348dab54): ≥16 dòng** — T9 đếm **7 dòng lúc mở** (20:43:59Z: dòng đầu 20:36:31Z + 20:37:41Z…); **T0-157 đếm 10 dòng lúc ~20:47Z** (ghi trong `round157-t0.done`); **T5-157 đếm 16 dòng lúc 20:56:13Z** (ghi trong `round157-t5.done` kèm chú thích "(T9-157 đếm chính thức)" — xem F-157-T9-5: số 16 là do T5 đếm, T9 nhận làm số quan sát cuối). Cadence ~65–70 s/dòng (7 → 10 → 16 khớp cadence). **Số cuối KHÔNG kiểm được** (journal mất theo reboot 21:05:15Z; từ 20:56:13Z tới reboot còn ~9 phút chưa đếm — T9 KHÔNG cộng số ước vào tổng).
- **Journal trên boot #57 (bcbaa3ad): 90 dòng lúc đóng** (T9 đếm 90 lúc 22:48:34Z; dòng cuối 22:47:37Z). Boot này còn sống lúc T9 đóng nên 90 là số đếm tới thời điểm đóng (có thể tăng sau khi T9 đóng — T10 kiểm lại nếu cần). Cadence ~69 s/dòng (90 dòng / ~103 phút từ btime 21:05:15Z tới 22:47:37Z).
- **Tổng phiên: ≥106 dòng trên HAI boot** (≥16 + 90 — mỗi boot là cận dưới tại thời điểm đếm cuối). Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. **Đây là đợt thứ sáu liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng — ít hơn vì journal của 3 boot cũ mất theo 3 reboot; đợt 157: ≥106 dòng).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=0 ×6 lần — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo); **(2) ≥106 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 0 — **không thêm được watch nào cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 MỘT reboot giữa phiên (sampler/watcher chết theo, khởi động lại bằng tay) + mâu thuẫn boot lúc mở ĐÃ ĐƯỢC T0 GIẢI QUYẾT

- **Boot lúc mở đợt 157 = 348dab54-90f7-438e-924e-2c839630842b** (btime **19:32:47Z** theo `/proc/stat` / **19:32:47Z** theo `uptime -s` — KHỚP, không lệch; journal first entry 19:32:59Z; wtmp 1 entry duy nhất "reboot Fri Nov 20 19:32 still running"). **T0-157 XÁC NHẬN: REBOOT #56** (sau #55 c99a1045, đếm tuần tự).
- **MÂU THUẪN ĐÃ GIẢI QUYẾT (T0-157, xem F-157-T9-1):** T10-156 ghi lúc đóng ~20:17Z vẫn boot c99a1045 "KHÔNG reboot mới" — ĐÚNG trong khung giờ T10 quan sát. Đồng hồ wall của cell trong suốt đợt 156 chạy NHANH hơn giờ thật **J ≥ 42'46"** (cờ T10 mtime wall 20:15:33Z trên c99a1045 vs btime mới 19:32:47Z; sampler 137 mẫu không có gap nào >90 s nên J là hằng số, không nhảy trong phiên). Giả thuyết dẫn đầu: J ≈ 50'26" kế thừa nghịch lý đợt 153 (chưa khẳng định cơ chế; chỉ có cận dưới cứng 42'46" từ dữ kiện đợt này). Btime 19:32:47Z là giờ thật: Date header github.com khớp từng giây với đồng hồ local lúc 20:44:16Z; F-measure +0,93/+0,92/+0,92 s ổn định lúc mở, +0,92/+0,90/+0,93 s lúc đóng; journal monotonic vs wall drift −0,16 s. Cửa sổ mù giờ thật (20:15:33Z − J, 19:32:47Z] dài J − 2.566 s (≈460 s nếu J = 3.026 s) — số hiệu #56 giả định không có boot ẩn trong đó; **mù #88? giao T2-157**. T10-156 KHÔNG sai. Đồng hồ đã đúng từ boot #56 — mọi timestamp T9-157 là giờ thật, không cần hiệu chỉnh J.
- **Reboot GIỮA phiên:** sampler lần 1 (pid 3380) + watcher lần 1 (pid 3550) chết theo reboot; sleep chờ của T9 (sleep 1500) bị SIGTERM sau ~1.250 s (~21:05:16Z). Mẫu cuối sampler cũ: **21:05:27Z boot=348dab54 mem=2.396.272 bal=4.327.044 (67,1% trần, CHƯA ghim) load1=0,45**. Boot mới **bcbaa3ad** (btime **21:05:15Z** stat / **21:05:15Z** uptime -s — KHỚP). **Sampler + watcher khởi động lại bằng tay lúc 21:06:39Z** (sampler pid 2024, watcher pid 2026; mẫu đầu boot mới 21:06:39Z mem=1.768.428 bal=5.088.052 swapfree=1.037.344 load1=4,30). **Gap phủ sóng sampler: 72 s** (21:05:27Z → 21:06:39Z). **Số hiệu #57: T4/T7/T8/coordinator gọi #57** (T4 .done: "Reboot ứng viên #57 (bcbaa3ad, btime 21:05:15Z)"; T7 LIMITS: "#57 viết lại run 157"; T8 waiter archive "reboot #57"; coordinator xác minh #57 lúc 21:34:33Z theo T7) — T0-157 đóng 20:52Z, TRƯỚC reboot nên chưa xác nhận; **giao T2-157/T10-157 chốt chính thức**. Mù cho #57 (theo chuỗi sẽ là #89?) giao T2-157. Tuổi thọ boot #56: btime 19:32:47Z → btime boot mới 21:05:15Z = **5.548 s = 1h32m28s** (stat→stat, giờ thật).
- **Dấu hiệu đồng hồ tại reboot #57 (ghi rõ cho T1/T2/T7):** mẫu sampler cuối boot #56 (21:05:27Z) ghi SAU btime boot mới (21:05:15Z) **12 s** — chênh lệch đồng hồ giữa hai boot ≥12 s (xem F-157-T9-3; cùng họ overlap #50 đợt 155 ≥34 s). Các timestamp còn lại thứ tự nhất quán. T9 không phán tranh chấp clock T1–T2.
- Các cờ .done lúc T9 đóng (~22:58Z): t0, t1, t2, t4, t5, t6, t7 (7/9 — t8 chưa có cờ lúc T9 đóng; T9 đóng ngay sau khi viết LIMITS này, thành 8/9).

### 5.2 T5-157 — POSTBOOT_PASS cho #56 ĐÃ CÓ; #53/#54/#55 KHÔNG CÓ; #57 giao T5-158 (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **POSTBOOT_PASS cho boot #56 ĐÃ CÓ (T5-157, qua replay đầy đủ của cell, KHÔNG cần repair)** — T5-157 LIMITS §3.1; watcher-157 khởi động lại bằng tay 20:43:36Z pid 3428.
- **POSTBOOT_PASS cho boot #53/#54/#55: KHÔNG CÓ, KHÔNG BÙ ĐƯỢC** (cả ba boot đều chết trước khi T5-157 mở; cùng mẫu #51 theo quyết (o) đợt 156).
- **Boot #57 (bcbaa3ad): POSTBOOT_PASS giao T5-158** (T5-157 đóng 20:58Z, trước reboot #57; theo T7-157).
- **POSTBOOT_PASS #52 VẪN CÒN trên đĩa** (round156-t5, 18:00:10Z; bản sao POSTBOOT_PASS-5353ed19 trong round157-t5). Marker `~/.config/vcut-persistence-marker` sống qua 8 reboot (#49–#56).
- **Watcher respawn:** T5-157 triển khai theo quyết parent (e) đợt 153 (phương án 1 user systemd unit + quy tắc đứng (3)) — marker persistence SỐNG QUA 8 reboot #49/#56 (ghi 20:58Z). Sampler T9 vẫn khởi động lại bằng tay sau reboot (gap 72 s đợt này) — cùng họ vấn đề, chưa có cơ chế tự hồi phục cho sampler.

### 5.3 Run 156 SUCCEEDED + run 157 bị #57 viết lại (T7-157 — T9 chỉ ghi lại để đối chiếu)

- **Run 156: SUCCEEDED 20:19:34Z** (event 20:19:34.533Z), wall danh nghĩa từ started gốc **9.823 s**, margin danh nghĩa **977 s** (16m17s) tới hạn 20:35:51Z (T7-157 §2.1). Run 156 KHÔNG bị viết lại lần 4 tại #56 (started_at không đổi); #56 có phải điểm (m) mới không: **CÓ ĐIỀU KIỆN — PHỤ THUỘC J so với ngưỡng 2.807 s** (nếu J ≥ 2.807 s → KHÔNG phải điểm dữ liệu; khuyến nghị đọc: KHÔNG phải điểm dữ liệu với J ≈ 3.026 s).
- **Run 157: jitter 0 s** (started gốc = scheduled_for = 20:35:51Z), **đã bị viết lại 1 lần tại #57**, **vẫn `running` lúc T7 đóng cờ** (~22:24Z, tuổi gốc 6.522 s, còn 4.278 s tới hạn 23:35:51Z). **Kết cục thuộc T7-158.** #57 viết lại run 157 = **điểm (m) DƯƠNG +47,698 s** (tính bằng giờ thật) — trong dải 33–49,8 s, không phá dải (n ứng viên 14 → 15, xem T7-157).

## 6. Sai số của chính T9 (ghi rõ)

- **F-157-T9-1 — Mâu thuẫn boot lúc mở: ĐÃ ĐƯỢC T0-157 GIẢI QUYẾT, T9 chỉ ghi dữ kiện độc lập khớp T0.** Btime #56 19:32:47Z (T9 đọc từ /proc/stat, khớp uptime -s, journal +12 s, wtmp 19:32) nằm TRƯỚC mẫu cuối đợt 156 (19:56:47Z, boot c99a1045) và trước lúc T10-156 đóng sổ (~20:17Z). T0-157 xác minh: wall clock cell chạy nhanh J ≥ 42'46" trong suốt đợt 156; btime 19:32:47Z là giờ thật (Date header github.com khớp từng giây lúc 20:44:16Z — do T0 kiểm, T9 không kiểm lại); T10-156 KHÔNG sai; mù #88? giao T2-157. T9 tuân thủ đúng quy tắc đứng mới (e): mọi btime trong LIMITS này đều từ `/proc/stat btime` (epoch → `date -d @epoch`) — KHÔNG lặp lỗi btime của T9-156. F này ĐÓNG ở mức T9 (chờ parent ghi nhận).
- **F-157-T9-2 — Watcher B2 lần chạy đầu CHẾT theo lúc exec session teardown (output-drain timeout) — gap phủ B2 ~1 phút lúc mở.** Sampler sống qua teardown (pid 3380); watcher khởi động lại 20:44Z pid 3550, sống tới lúc đóng (trừ reboot #57, khởi động lại 21:06:39Z pid 2026). Gap ~1 phút, load1 lúc đó 0,68 — không spike nào bị mất (spike đầu tiên 20:51:20Z, sau khi watcher đã chạy ổn định). Cùng họ F-156-T9-6 (lệnh chờ của T9 lọt snapshot) nhưng lần này là watcher chết chứ không chỉ lọt snapshot — T9 đợt sau nên khởi động watcher bằng lệnh riêng, không chung exec với sampler.
- **F-157-T9-3 — Mẫu cuối boot #56 (21:05:27Z) nằm 12 s SAU btime boot mới #57 (21:05:15Z): chênh lệch đồng hồ giữa hai boot ≥12 s.** Cùng họ overlap #50 đợt 155 (≥34 s) và lệch 8 s T7-156 ghi ở quyết (h) đợt 156. Cơ chế chưa rõ (đồng hồ guest chạy nhanh rồi hiệu chỉnh lại ở mỗi reboot — khớp cả với J ≥ 42'46" của T0-157 cho đợt 156). T9 không phán cơ chế; giao T0/T2/T7 đối chiếu. Không ảnh hưởng số đếm mẫu: mẫu 21:05:27Z vẫn thuộc boot #56 theo trường boot_id ghi trong log (sampler đọc boot_id mỗi mẫu).
- **F-157-T9-4 — Gap phủ sóng sampler 72 s + watcher B2 ~2–3 lần kiểm tại reboot #57 (cùng lớp F-156-T9-3):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. Thêm: gap 72 s (21:05:27Z → 21:06:39Z) là khoảng trống thứ hai — một lần vượt guard trong gap cũng không được quan sát (khả năng thấp: RAM tại mép gap 2.396.272 → 1.768.428 kB, đều xa guard; balloon tại mép gap 4.327.044 → 5.088.052 kB, chưa ghim). Watcher B2 cũng mất ~2–3 lần kiểm trong gap — **có thể 1 spike (tải boot/apt replay) bị mất** (load1 tại mép gap 0,45 → 4,30; spike 21:06:39Z bắt ngay khi watcher khởi động lại), nhưng không chứng minh được.
- **F-157-T9-5 — ENOSPC boot #56: số cuối KHÔNG kiểm lại được + chú thích nguồn gây nhầm.** T9 tự đếm 7 dòng lúc 20:43:59Z; T0 đếm 10 dòng lúc ~20:47Z; T5-157 .done ghi 16 dòng lúc 20:56:13Z kèm chú thích "(T9-157 đếm chính thức)" — **T9 KHÔNG đếm lúc 20:56:13Z**; số 16 là do T5 đếm (theo mẫu đợt 156: T5 đếm 21 rồi T9 nhận làm số chính thức). T9 nhận 16 làm số quan sát cuối cho boot #56 (cadence 7 → 10 → 16 khớp ~65–70 s/dòng), ghi rõ nguồn từng số; journal boot #56 đã mất theo reboot #57 nên không kiểm lại được. Tổng phiên ≥106 là CẬN DƯỚI (mỗi boot lấy số đếm cuối quan sát được).
- **F-157-T9-6 — Lệnh chờ của chính T9 lọt snapshot B2 (cùng họ F-156-T9-6), BẮT ĐƯỢC VÀ GHI RÕ TRƯỚC KHI ĐÓNG (không ảnh hưởng số cuối):** `sleep 1500` của T9 xuất hiện trong snapshot `ps` của b2-spikes.log (spike 21:07:50Z + 22:35:15Z) ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `^=== SPIKE` = **13** ngay từ đầu. **Fix (n) (loại `ps` của watcher) vẫn đứng:** lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log. T9 đợt sau nên tránh sleep dài trong lúc watcher chạy (dùng cron/scheduler chờ thay cho sleep nếu có thể).
- **F-157-T9-7 — Chuỗi ghim 2+3 đếm là 1 episode (dip nông tới 94,4%): T9 phán, giao T10-157 xác nhận.** Theo quy tắc (g) đợt 152 + tiền lệ đợt 156 (episode A: dip tới 95,2% vẫn cùng episode; episode B: dip tới 97,0%). Dip đợt này sâu hơn tiền lệ 0,8 điểm phần trăm (94,4% vs 95,2%) nhưng cùng bản chất: không xả sâu (điểm thấp nhất 6.085.264 kB, RAM trong dip tối đa 935.536 kB, gate A không mở lần nào, chỉ 5 mẫu / ~5 phút). Nếu T10/parent phán dip này là xả (đủ tách episode) thì đợt 157 = **3 episode** (A: chuỗi 1; B: chuỗi 2; C: chuỗi 3) thay vì 2 — T9 ghi rõ để T10 phán, không giấu điểm khác biệt.
- **F-157-T9-8 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ mười một liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-157-T9-9 — Khoảng trống lấy mẫu 60 giây + gap 72 s do reboot (cùng lớp F-156-T9-3):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Thêm gap 72 s tại reboot #57 (xem F-157-T9-4).

Thống kê: samples: 129 (23 mau boot 348dab54 + 106 mau boot bcbaa3ad); mem min: 357,616 kB (349.2 MiB) luc 22:46:42Z; mem max: 2,612,316 kB (2551.1 MiB = 41.52% guard) luc 21:04:27Z; mem mean: 1054818 kB (1030.1 MiB); count >=1024 MiB (gate A): 53/129; count >= guard 6144 MiB: 0/129; balloon frozen 6,443,824: 33/129 (chuoi 1: 21:31:39Z–21:41:40Z n=11; chuoi 2: 22:04:41Z–22:13:41Z n=10; chuoi 3: 22:19:41Z–22:30:41Z n=12); balloon min: 4,132,416 kB luc 21:04:27Z; balloon max: 6,443,824 kB; load1 max (sampler): 8.00 luc 20:53:26Z; load1 >=3.0 samples: 7/129; max inter-sample gap: 72 s (21:05:27Z -> 21:06:39Z, 348dab54 -> bcbaa3ad); gaps >90s: khong co

## Phụ lục A — Bảng sampler đầy đủ (129 mau: 23 mau boot 348dab54 + 106 mau boot bcbaa3ad; khong gap >90 s)

(File gốc: `hidden_files/round157-t9/ram-sampler.log` (argv: ram-sampler-FROZEN.log) — bảng dưới đây trích đúng file đó.)

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-20T20:43:26Z | 348dab54 | 1,068,756 | 1043.7 | 16.99% | 5,766,516 | 770,252 | 0.68 |
| 2 | 2026-11-20T20:44:26Z | 348dab54 | 514,720 | 502.7 | 8.18% | 5,904,736 | 742,624 | 1.64 |
| 3 | 2026-11-20T20:45:26Z | 348dab54 | 785,180 | 766.8 | 12.48% | 6,027,020 | 745,888 | 1.70 |
| 4 | 2026-11-20T20:46:26Z | 348dab54 | 1,304,028 | 1273.5 | 20.73% | 5,540,444 | 698,636 | 1.64 |
| 5 | 2026-11-20T20:47:26Z | 348dab54 | 1,079,840 | 1054.5 | 17.16% | 5,693,332 | 702,792 | 1.07 |
| 6 | 2026-11-20T20:48:26Z | 348dab54 | 1,063,052 | 1038.1 | 16.90% | 5,719,024 | 711,204 | 1.51 |
| 7 | 2026-11-20T20:49:26Z | 348dab54 | 2,113,596 | 2064.1 | 33.59% | 4,644,684 | 711,196 | 1.76 |
| 8 | 2026-11-20T20:50:26Z | 348dab54 | 2,137,132 | 2087.0 | 33.97% | 4,536,420 | 729,224 | 1.92 |
| 9 | 2026-11-20T20:51:26Z | 348dab54 | 1,955,448 | 1909.6 | 31.08% | 4,782,884 | 724,068 | 4.39 |
| 10 | 2026-11-20T20:52:26Z | 348dab54 | 1,503,056 | 1467.8 | 23.89% | 4,982,200 | 724,692 | 7.68 |
| 11 | 2026-11-20T20:53:26Z | 348dab54 | 1,503,316 | 1468.1 | 23.89% | 5,109,904 | 727,248 | 8.00 |
| 12 | 2026-11-20T20:54:26Z | 348dab54 | 1,522,728 | 1487.0 | 24.20% | 5,298,056 | 729,424 | 3.87 |
| 13 | 2026-11-20T20:55:26Z | 348dab54 | 1,319,644 | 1288.7 | 20.98% | 5,478,676 | 731,040 | 1.75 |
| 14 | 2026-11-20T20:56:26Z | 348dab54 | 1,062,536 | 1037.6 | 16.89% | 5,643,536 | 717,828 | 1.27 |
| 15 | 2026-11-20T20:57:26Z | 348dab54 | 1,457,760 | 1423.6 | 23.17% | 5,350,136 | 698,372 | 1.56 |
| 16 | 2026-11-20T20:58:27Z | 348dab54 | 1,337,104 | 1305.8 | 21.25% | 5,130,560 | 703,800 | 1.46 |
| 17 | 2026-11-20T20:59:27Z | 348dab54 | 1,885,124 | 1840.9 | 29.96% | 4,801,464 | 706,040 | 1.10 |
| 18 | 2026-11-20T21:00:27Z | 348dab54 | 1,776,700 | 1735.1 | 28.24% | 5,021,508 | 713,752 | 0.40 |
| 19 | 2026-11-20T21:01:27Z | 348dab54 | 1,243,584 | 1214.4 | 19.77% | 4,676,720 | 696,340 | 1.41 |
| 20 | 2026-11-20T21:02:27Z | 348dab54 | 1,565,004 | 1528.3 | 24.88% | 4,857,232 | 696,764 | 1.50 |
| 21 | 2026-11-20T21:03:27Z | 348dab54 | 1,520,384 | 1484.8 | 24.17% | 5,036,932 | 700,832 | 0.55 |
| 22 | 2026-11-20T21:04:27Z | 348dab54 | 2,612,316 | 2551.1 | 41.52% | 4,132,416 | 680,864 | 1.22 |
| 23 | 2026-11-20T21:05:27Z | 348dab54 | 2,396,272 | 2340.1 | 38.09% | 4,327,044 | 684,004 | 0.45 |
| — | — | — | — | — | — | — | — | — |
| 24 | 2026-11-20T21:06:39Z | bcbaa3ad | 1,768,428 | 1727.0 | 28.11% | 5,088,052 | 1,037,344 | 4.30 |
| 25 | 2026-11-20T21:07:39Z | bcbaa3ad | 2,444,772 | 2387.5 | 38.86% | 4,236,084 | 961,784 | 5.43 |
| 26 | 2026-11-20T21:08:39Z | bcbaa3ad | 2,316,356 | 2262.1 | 36.82% | 4,495,672 | 934,904 | 3.57 |
| 27 | 2026-11-20T21:09:39Z | bcbaa3ad | 2,078,288 | 2029.6 | 33.03% | 4,745,124 | 926,468 | 2.21 |
| 28 | 2026-11-20T21:10:39Z | bcbaa3ad | 2,086,576 | 2037.7 | 33.17% | 4,780,868 | 828,948 | 1.67 |
| 29 | 2026-11-20T21:11:39Z | bcbaa3ad | 1,986,816 | 1940.2 | 31.58% | 4,939,092 | 826,396 | 0.67 |
| 30 | 2026-11-20T21:12:39Z | bcbaa3ad | 1,797,364 | 1755.2 | 28.57% | 5,159,652 | 816,556 | 0.25 |
| 31 | 2026-11-20T21:13:39Z | bcbaa3ad | 1,557,584 | 1521.1 | 24.76% | 5,357,628 | 808,216 | 0.21 |
| 32 | 2026-11-20T21:14:39Z | bcbaa3ad | 1,421,300 | 1388.0 | 22.59% | 5,513,932 | 804,652 | 1.13 |
| 33 | 2026-11-20T21:15:39Z | bcbaa3ad | 1,674,928 | 1635.7 | 26.62% | 5,235,364 | 778,128 | 1.87 |
| 34 | 2026-11-20T21:16:39Z | bcbaa3ad | 2,237,504 | 2185.1 | 35.56% | 4,580,004 | 777,484 | 1.32 |
| 35 | 2026-11-20T21:17:39Z | bcbaa3ad | 1,974,440 | 1928.2 | 31.38% | 4,833,024 | 777,756 | 0.77 |
| 36 | 2026-11-20T21:18:39Z | bcbaa3ad | 1,866,712 | 1823.0 | 29.67% | 5,062,076 | 776,644 | 0.39 |
| 37 | 2026-11-20T21:19:39Z | bcbaa3ad | 1,698,100 | 1658.3 | 26.99% | 5,269,168 | 772,648 | 0.19 |
| 38 | 2026-11-20T21:20:39Z | bcbaa3ad | 1,839,432 | 1796.3 | 29.24% | 5,138,136 | 766,828 | 0.99 |
| 39 | 2026-11-20T21:21:39Z | bcbaa3ad | 1,662,640 | 1623.7 | 26.43% | 5,335,644 | 766,960 | 1.42 |
| 40 | 2026-11-20T21:22:39Z | bcbaa3ad | 1,454,828 | 1420.7 | 23.12% | 5,515,240 | 748,112 | 2.04 |
| 41 | 2026-11-20T21:23:39Z | bcbaa3ad | 1,333,536 | 1302.3 | 21.20% | 5,687,164 | 736,936 | 1.93 |
| 42 | 2026-11-20T21:24:39Z | bcbaa3ad | 1,199,528 | 1171.4 | 19.07% | 5,727,452 | 727,028 | 0.75 |
| 43 | 2026-11-20T21:25:39Z | bcbaa3ad | 1,109,872 | 1083.9 | 17.64% | 5,877,116 | 724,880 | 0.55 |
| 44 | 2026-11-20T21:26:39Z | bcbaa3ad | 1,012,340 | 988.6 | 16.09% | 6,015,256 | 717,228 | 1.18 |
| 45 | 2026-11-20T21:27:39Z | bcbaa3ad | 879,548 | 858.9 | 13.98% | 6,108,224 | 706,300 | 0.67 |
| 46 | 2026-11-20T21:28:39Z | bcbaa3ad | 758,188 | 740.4 | 12.05% | 6,221,364 | 703,748 | 0.36 |
| 47 | 2026-11-20T21:29:39Z | bcbaa3ad | 672,704 | 656.9 | 10.69% | 6,324,272 | 704,696 | 0.38 |
| 48 | 2026-11-20T21:30:39Z | bcbaa3ad | 487,428 | 476.0 | 7.75% | 6,419,156 | 697,468 | 0.14 |
| 49 | 2026-11-20T21:31:39Z | bcbaa3ad | 551,164 | 538.2 | 8.76% | 6,443,824 | 698,124 | 0.15 |
| 50 | 2026-11-20T21:32:40Z | bcbaa3ad | 530,564 | 518.1 | 8.43% | 6,443,824 | 702,172 | 0.09 |
| 51 | 2026-11-20T21:33:40Z | bcbaa3ad | 502,876 | 491.1 | 7.99% | 6,443,824 | 702,308 | 0.09 |
| 52 | 2026-11-20T21:34:40Z | bcbaa3ad | 525,960 | 513.6 | 8.36% | 6,443,824 | 707,444 | 0.06 |
| 53 | 2026-11-20T21:35:40Z | bcbaa3ad | 506,484 | 494.6 | 8.05% | 6,443,824 | 709,472 | 0.13 |
| 54 | 2026-11-20T21:36:40Z | bcbaa3ad | 549,804 | 536.9 | 8.74% | 6,443,824 | 714,788 | 0.09 |
| 55 | 2026-11-20T21:37:40Z | bcbaa3ad | 525,908 | 513.6 | 8.36% | 6,443,824 | 716,672 | 0.03 |
| 56 | 2026-11-20T21:38:40Z | bcbaa3ad | 532,456 | 520.0 | 8.46% | 6,443,824 | 715,456 | 0.25 |
| 57 | 2026-11-20T21:39:40Z | bcbaa3ad | 534,724 | 522.2 | 8.50% | 6,443,824 | 715,468 | 0.15 |
| 58 | 2026-11-20T21:40:40Z | bcbaa3ad | 538,176 | 525.6 | 8.55% | 6,443,824 | 718,136 | 0.17 |
| 59 | 2026-11-20T21:41:40Z | bcbaa3ad | 535,964 | 523.4 | 8.52% | 6,443,824 | 718,132 | 0.15 |
| 60 | 2026-11-20T21:42:40Z | bcbaa3ad | 843,832 | 824.1 | 13.41% | 6,050,608 | 705,244 | 0.65 |
| 61 | 2026-11-20T21:43:40Z | bcbaa3ad | 1,064,448 | 1039.5 | 16.92% | 5,895,604 | 700,588 | 0.73 |
| 62 | 2026-11-20T21:44:40Z | bcbaa3ad | 948,064 | 925.8 | 15.07% | 6,029,200 | 703,400 | 0.27 |
| 63 | 2026-11-20T21:45:40Z | bcbaa3ad | 850,668 | 830.7 | 13.52% | 6,151,376 | 688,328 | 0.26 |
| 64 | 2026-11-20T21:46:40Z | bcbaa3ad | 981,336 | 958.3 | 15.60% | 6,036,876 | 683,700 | 1.45 |
| 65 | 2026-11-20T21:47:40Z | bcbaa3ad | 1,591,380 | 1554.1 | 25.29% | 5,250,444 | 673,496 | 1.27 |
| 66 | 2026-11-20T21:48:40Z | bcbaa3ad | 1,366,188 | 1334.2 | 21.71% | 5,441,684 | 674,564 | 0.79 |
| 67 | 2026-11-20T21:49:40Z | bcbaa3ad | 1,347,528 | 1315.9 | 21.42% | 5,615,320 | 674,976 | 0.29 |
| 68 | 2026-11-20T21:50:40Z | bcbaa3ad | 1,120,676 | 1094.4 | 17.81% | 5,772,360 | 673,472 | 0.22 |
| 69 | 2026-11-20T21:51:40Z | bcbaa3ad | 1,068,080 | 1043.0 | 16.98% | 5,917,168 | 673,852 | 0.21 |
| 70 | 2026-11-20T21:52:40Z | bcbaa3ad | 981,412 | 958.4 | 15.60% | 6,043,752 | 666,340 | 0.30 |
| 71 | 2026-11-20T21:53:40Z | bcbaa3ad | 874,296 | 853.8 | 13.90% | 6,163,816 | 656,680 | 0.92 |
| 72 | 2026-11-20T21:54:40Z | bcbaa3ad | 1,361,448 | 1329.5 | 21.64% | 5,611,508 | 642,124 | 1.28 |
| 73 | 2026-11-20T21:55:40Z | bcbaa3ad | 1,292,020 | 1261.7 | 20.54% | 5,719,908 | 640,288 | 0.66 |
| 74 | 2026-11-20T21:56:40Z | bcbaa3ad | 1,114,132 | 1088.0 | 17.71% | 5,871,220 | 642,652 | 0.54 |
| 75 | 2026-11-20T21:57:40Z | bcbaa3ad | 967,056 | 944.4 | 15.37% | 6,003,648 | 652,092 | 0.80 |
| 76 | 2026-11-20T21:58:40Z | bcbaa3ad | 854,380 | 834.4 | 13.58% | 6,112,388 | 654,172 | 1.20 |
| 77 | 2026-11-20T21:59:40Z | bcbaa3ad | 953,404 | 931.1 | 15.15% | 5,968,120 | 656,328 | 1.02 |
| 78 | 2026-11-20T22:00:40Z | bcbaa3ad | 867,728 | 847.4 | 13.79% | 6,092,088 | 659,420 | 0.63 |
| 79 | 2026-11-20T22:01:40Z | bcbaa3ad | 714,944 | 698.2 | 11.36% | 6,205,416 | 658,700 | 0.43 |
| 80 | 2026-11-20T22:02:40Z | bcbaa3ad | 664,636 | 649.1 | 10.56% | 6,308,664 | 656,300 | 0.41 |
| 81 | 2026-11-20T22:03:41Z | bcbaa3ad | 545,268 | 532.5 | 8.67% | 6,401,988 | 656,604 | 0.69 |
| 82 | 2026-11-20T22:04:41Z | bcbaa3ad | 560,948 | 547.8 | 8.92% | 6,443,824 | 658,040 | 0.57 |
| 83 | 2026-11-20T22:05:41Z | bcbaa3ad | 538,904 | 526.3 | 8.57% | 6,443,824 | 656,096 | 0.32 |
| 84 | 2026-11-20T22:06:41Z | bcbaa3ad | 608,340 | 594.1 | 9.67% | 6,443,824 | 763,908 | 0.34 |
| 85 | 2026-11-20T22:07:41Z | bcbaa3ad | 563,348 | 550.1 | 8.95% | 6,443,824 | 767,168 | 0.19 |
| 86 | 2026-11-20T22:08:41Z | bcbaa3ad | 588,848 | 575.0 | 9.36% | 6,443,824 | 767,208 | 0.24 |
| 87 | 2026-11-20T22:09:41Z | bcbaa3ad | 585,216 | 571.5 | 9.30% | 6,443,824 | 767,308 | 0.15 |
| 88 | 2026-11-20T22:10:41Z | bcbaa3ad | 575,872 | 562.4 | 9.15% | 6,443,824 | 767,612 | 0.26 |
| 89 | 2026-11-20T22:11:41Z | bcbaa3ad | 577,672 | 564.1 | 9.18% | 6,443,824 | 767,736 | 0.33 |
| 90 | 2026-11-20T22:12:41Z | bcbaa3ad | 549,820 | 536.9 | 8.74% | 6,443,824 | 767,840 | 0.26 |
| 91 | 2026-11-20T22:13:41Z | bcbaa3ad | 581,028 | 567.4 | 9.24% | 6,443,824 | 768,048 | 0.09 |
| 92 | 2026-11-20T22:14:41Z | bcbaa3ad | 781,400 | 763.1 | 12.42% | 6,247,216 | 755,596 | 0.80 |
| 93 | 2026-11-20T22:15:41Z | bcbaa3ad | 935,536 | 913.6 | 14.87% | 6,085,264 | 730,676 | 1.01 |
| 94 | 2026-11-20T22:16:41Z | bcbaa3ad | 892,840 | 871.9 | 14.19% | 6,166,340 | 733,732 | 0.54 |
| 95 | 2026-11-20T22:17:41Z | bcbaa3ad | 726,884 | 709.8 | 11.55% | 6,279,788 | 721,612 | 0.56 |
| 96 | 2026-11-20T22:18:41Z | bcbaa3ad | 660,184 | 644.7 | 10.49% | 6,380,632 | 721,784 | 0.33 |
| 97 | 2026-11-20T22:19:41Z | bcbaa3ad | 590,640 | 576.8 | 9.39% | 6,443,824 | 716,908 | 0.24 |
| 98 | 2026-11-20T22:20:41Z | bcbaa3ad | 591,880 | 578.0 | 9.41% | 6,443,824 | 716,364 | 0.34 |
| 99 | 2026-11-20T22:21:41Z | bcbaa3ad | 594,768 | 580.8 | 9.45% | 6,443,824 | 716,252 | 0.22 |
| 100 | 2026-11-20T22:22:41Z | bcbaa3ad | 596,572 | 582.6 | 9.48% | 6,443,824 | 718,824 | 0.49 |
| 101 | 2026-11-20T22:23:41Z | bcbaa3ad | 544,820 | 532.1 | 8.66% | 6,443,824 | 715,092 | 0.43 |
| 102 | 2026-11-20T22:24:41Z | bcbaa3ad | 548,832 | 536.0 | 8.72% | 6,443,824 | 713,388 | 0.35 |
| 103 | 2026-11-20T22:25:41Z | bcbaa3ad | 536,628 | 524.1 | 8.53% | 6,443,824 | 714,596 | 0.51 |
| 104 | 2026-11-20T22:26:41Z | bcbaa3ad | 535,852 | 523.3 | 8.52% | 6,443,824 | 715,048 | 0.48 |
| 105 | 2026-11-20T22:27:41Z | bcbaa3ad | 553,980 | 541.0 | 8.81% | 6,443,824 | 715,172 | 0.25 |
| 106 | 2026-11-20T22:28:41Z | bcbaa3ad | 552,004 | 539.1 | 8.77% | 6,443,824 | 715,640 | 0.09 |
| 107 | 2026-11-20T22:29:41Z | bcbaa3ad | 560,492 | 547.4 | 8.91% | 6,443,824 | 712,540 | 0.17 |
| 108 | 2026-11-20T22:30:41Z | bcbaa3ad | 570,120 | 556.8 | 9.06% | 6,443,824 | 711,488 | 0.50 |
| 109 | 2026-11-20T22:31:41Z | bcbaa3ad | 899,580 | 878.5 | 14.30% | 6,090,336 | 701,344 | 0.85 |
| 110 | 2026-11-20T22:32:41Z | bcbaa3ad | 802,848 | 784.0 | 12.76% | 5,409,252 | 627,140 | 2.73 |
| 111 | 2026-11-20T22:33:42Z | bcbaa3ad | 884,212 | 863.5 | 14.05% | 5,181,444 | 646,696 | 2.64 |
| 112 | 2026-11-20T22:34:42Z | bcbaa3ad | 1,104,916 | 1079.0 | 17.56% | 5,068,652 | 656,604 | 2.91 |
| 113 | 2026-11-20T22:35:42Z | bcbaa3ad | 1,718,476 | 1678.2 | 27.31% | 5,260,408 | 656,624 | 1.98 |
| 114 | 2026-11-20T22:36:42Z | bcbaa3ad | 1,165,848 | 1138.5 | 18.53% | 5,121,292 | 658,492 | 2.14 |
| 115 | 2026-11-20T22:37:42Z | bcbaa3ad | 1,015,052 | 991.3 | 16.13% | 5,265,356 | 657,280 | 1.76 |
| 116 | 2026-11-20T22:38:42Z | bcbaa3ad | 1,016,820 | 993.0 | 16.16% | 5,401,164 | 660,344 | 0.86 |
| 117 | 2026-11-20T22:39:42Z | bcbaa3ad | 910,728 | 889.4 | 14.48% | 5,530,160 | 659,908 | 0.51 |
| 118 | 2026-11-20T22:40:42Z | bcbaa3ad | 789,944 | 771.4 | 12.56% | 5,648,960 | 658,972 | 0.24 |
| 119 | 2026-11-20T22:41:42Z | bcbaa3ad | 674,440 | 658.6 | 10.72% | 5,756,632 | 648,796 | 0.44 |
| 120 | 2026-11-20T22:42:42Z | bcbaa3ad | 612,592 | 598.2 | 9.74% | 5,855,536 | 650,152 | 0.16 |
| 121 | 2026-11-20T22:43:42Z | bcbaa3ad | 495,008 | 483.4 | 7.87% | 5,946,164 | 649,380 | 0.17 |
| 122 | 2026-11-20T22:44:42Z | bcbaa3ad | 437,724 | 427.5 | 6.96% | 6,027,132 | 648,908 | 0.55 |
| 123 | 2026-11-20T22:45:42Z | bcbaa3ad | 358,108 | 349.7 | 5.69% | 6,102,400 | 644,860 | 0.20 |
| 124 | 2026-11-20T22:46:42Z | bcbaa3ad | 357,616 | 349.2 | 5.68% | 6,163,316 | 634,656 | 0.41 |
| 125 | 2026-11-20T22:47:42Z | bcbaa3ad | 1,024,448 | 1000.4 | 16.28% | 5,440,536 | 622,152 | 1.13 |
| 126 | 2026-11-20T22:48:42Z | bcbaa3ad | 898,168 | 877.1 | 14.28% | 5,555,768 | 624,404 | 0.41 |
| 127 | 2026-11-20T22:49:42Z | bcbaa3ad | 785,264 | 766.9 | 12.48% | 5,671,472 | 625,296 | 0.32 |
| 128 | 2026-11-20T22:50:42Z | bcbaa3ad | 625,364 | 610.7 | 9.94% | 5,773,492 | 624,560 | 0.70 |
| 129 | 2026-11-20T22:51:42Z | bcbaa3ad | 737,432 | 720.1 | 11.72% | 5,590,464 | 611,032 | 0.56 |
