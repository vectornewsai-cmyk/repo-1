# LIMITS — Phase 9 đợt 159, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ mười ba liên tiếp; headroom 0 → 0, thoáng 23.503 sau reboot #60 rồi về 0 trong ~1 phút; balloon GHIM TRẦN 2 EPISODE MỚI, 30/135 mẫu, 4 chuỗi, 1 boot #60; MỘT reboot giữa phiên #60; ENOSPC ≥134 dòng trên 2 boot; lượt yên #28 CÓ lượt hợp lệ #24)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 0/0 (02:39:58Z, boot #59 eec65561) → sau reboot #60: 23.503 rồi 18.447 (boot+~95–100 s) → 0/0 (boot+148 s) → giữa phiên 0/0 (03:59:27Z) → đóng 0/0 (04:55:08Z, boot #60 e590ae0a)** — **trạng thái ổn định VẪN 0, dưới ngưỡng < ~1.800 lần thứ mười chín liên tiếp**; thoáng 23.503 chỉ tồn tại ~1–2 phút đầu sau boot (bảng watch ngoài cell nạp lại ~23,5k watch trong ~1 phút — xem §1.2, F-159-T9-1). Tỉ lệ/vite **0 → 0**; trần 63.747 không đổi. Quyết (l) đợt 158 "chỉ theo dõi" đứng, không hành động. Xem §1.
- **Balloon GHIM TRẦN 2 EPISODE MỚI — 30/135 mẫu (22,2%), 4 chuỗi, MỘT boot (#60):** episode A chuỗi 1 (03:36:28–03:41:28Z, 6 mẫu, đứt quan sát được 03:42:28Z) + episode B chuỗi 2+3+4 (04:23:30Z–04:54:31Z, 24 mẫu — dip giữa các chuỗi nông tới 94,5% / 94,4%, gate A không mở lần nào trong dip → 1 episode theo quy tắc (g) đợt 152 + tiền lệ đợt 157/158; chuỗi 4 còn mở lúc đóng phiên — KHÔNG quan sát được điểm đứt). Boot #59: 0 mẫu ghim (max balloon 6.090.064 kB = 94,5% trần). Xem §2.2, F-159-T9-7.
- **RAM:** sampler **135 mẫu, 02:39:46Z–04:54:31Z, HAI boot** (27 mẫu #59 + 108 mẫu #60 — 1 gap 100 s theo timestamp / ~120 s giờ thật tại reboot #60, không gap nào khác >90 s theo timestamp). Min **499.084 kB (487,4 MiB) lúc 03:40:28Z** (trong chuỗi 1 ghim); max **3.216.244 kB (3.140,9 MiB = 51,12% guard) lúc 02:50:47Z** (balloon xả sâu nhất phiên 3.627.868 kB, ngay sau attempt1 của T4); mean 1.112.971 kB. Gate A ≥1024 MiB: **63/135 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ mười ba liên tiếp.** Xem §2, §3.
- **B2: 25 spike load1 ≥3,0 — 21 QUY ĐƯỢC DRIVER CỤ THỂ + 4 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ".** Cụm 1 (7 spike, T1 suite/tsc/render, đỉnh 5,20) + cụm 2 (7 spike, tải boot #60 apt-get/dpkg, đỉnh 6,84) + cụm 3 (11 spike, O8 clicktest WebKit/Chromium, đỉnh 4,97). **0 spike trong cả hai cửa sổ balloon ghim** (~6 phút episode A + ~31 phút episode B, gồm cả 2 dip nông), **0 spike trong cửa sổ attempt T4** (02:46:28–02:50:27Z) và **0 spike trong lúc O8 chạy** (03:01:38–03:04:13Z). Delta tick lớn nhất 135 tick/s (ffmpeg). Xem §2.5.
- **Lượt yên WebKit #28 (T4): CÓ LƯỢT HỢP LỆ #24 — chuỗi lượt yên hợp lệ NỐI DÀI (#22 đợt 157 → #23 đợt 158 → #24 đợt 159).** Attempt1-eec65561 02:46:28–02:50:27Z, probe 20/20, lớp B 5/5, tickCost median 44,5 ms ≤60; pre-flight (quy tắc đứng mới, quyết (t)) PASS toàn bộ; 0 PAGE-WEDGED đợt thứ ba liên tiếp. Sampler T9 đối chiếu độc lập: gate A MỞ 4/4 mẫu trong cửa sổ attempt; 0 spike B2 trong cửa sổ. Xem §2.3.
- **MỘT reboot giữa phiên: #60 e590ae0a, btime 03:05:59Z** (theo /proc/stat; T7-159/T8-159 khớp btime/boot; số hiệu theo đếm tuần tự — giao T2/T10 chốt chính thức). Sampler + watcher chết theo reboot, T9 khởi động lại bằng tay, gap phủ sóng 100 s theo timestamp (~120 s giờ thật theo δ ≈ +20 s của T7-159). **Mẫu cuối boot #59 03:05:47Z nằm 12 s TRƯỚC btime #60 — KHÔNG overlap như #59 đợt 158** (T7-159: nghịch lý đồng hồ lần thứ ba liên tiếp, boot cũ nhanh ~+20 s lúc chết). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: ≥134 dòng trên HAI boot** — #59: ≥56 dòng (số quan sát cuối của T9 lúc 02:39:59Z; T5-159 đếm 58 lúc 02:42:29Z — corroborate; phần tăng sau đó MẤT theo reboot #60, không cộng ước) + #60: 78 dòng lúc đóng (04:55:08Z; dòng đầu 03:07:51Z — chỉ ~2 phút sau btime). **Đợt thứ tám liên tiếp bảng watch cạn gây lỗi thật thấy được.** Xem §4.
- **T8-159 (đối chiếu):** O8 PASS 3/3 qua gate chuẩn CÙNG BOOT #59 (lượt yên #28 có lượt hợp lệ #24 trên đúng boot đo); harness attempt 1 bị reboot #60 giết giữa 84l10 (không verdict) → attempt 2: 6/6 PASS, 0 kẹt; 85m4 KHÔNG tái kẹt lần 3; 86n2 P4-lần2 PASS (chuỗi 9 → 10); kẹt cộng dồn GIỮ 13; chuỗi "P3 không kẹt" 0 → 1. Xem §5.3.
- **T7-159 (đối chiếu): run 158 SUCCEEDED 02:27:11Z, margin 520 s** (hẹp thứ ba từ đợt 150); #59 KHÔNG tạo điểm (m) mới; reboot #60 viết lại run 159 lần 1 — **điểm (m) DƯƠNG MỚI +46,642 s** (n ứng viên 18 hoặc 19 — chờ parent quyết; #56 VẪN CÓ ĐIỀU KIỆN). Run 159 vẫn running lúc T7 đóng cờ — kết cục thuộc T7-160. Xem §5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round159-t9/k8-headroom.py` (copy y nguyên từ đợt 158 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 159 (10 lần đo)

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 02:39:58Z 21/11 | **0** | #59 eec65561 (btime 01:33:47Z) | lần đo 1, lúc mở; RAM trước đo 599.624 kB, balloon 5.696.848 kB, load1 1,58 |
| 02:39:58Z 21/11 | **0** | #59 eec65561 | lần đo 2 (chênh **0** so với lần 1) |
| ~03:07:33Z 21/11 | **23.503** | #60 e590ae0a (btime 03:05:59Z) | lần đo 3, sau khi khởi động lại sampler/watcher trên boot mới (boot+~95 s); RAM trước đo 1.819.600 kB, balloon 5.074.260 kB, load1 5,36 |
| ~03:07:37Z 21/11 | **18.447** | #60 e590ae0a | lần đo 4, ngay sau lần 3 (chênh **−5.056** — holder ngoài cell nạp lại ~5.056 watch trong vài giây giữa hai lần đo) |
| 03:08:27Z 21/11 | **0** | #60 e590ae0a | lần đo 5, kiểm chứng ngay (boot+148 s); RAM 1.986.192 kB, balloon 4.821.088 kB, load1 6,48 |
| 03:08:27Z 21/11 | **0** | #60 e590ae0a | lần đo 6 (chênh **0** so với lần 5) |
| 03:59:27Z 21/11 | **0** | #60 e590ae0a | lần đo 7, giữa phiên; RAM trước đo 1.952.320 kB, balloon 4.916.460 kB, load1 1,17 |
| 03:59:27Z 21/11 | **0** | #60 e590ae0a | lần đo 8 (chênh **0** so với lần 7) |
| 04:55:08Z 21/11 | **0** | #60 e590ae0a | lần đo 9 (đóng phiên); RAM trước đo 463.976 kB, balloon 6.443.824 kB (đang ghim trần), load1 0,14 |
| 04:55:08Z 21/11 | **0** | #60 e590ae0a | lần đo 10 (chênh **0** so với lần 9) |

- Probe dừng ở `i=0` trong 8/10 lần đo — `inotify_add_watch` đầu tiên trả errno 28 (không thêm được watch nào), đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau mỗi lần đo).
- **Thoáng 23.503/18.447 sau reboot #60 (lần đầu tiên headroom khác 0 kể từ đợt 152):** ngay sau boot, bảng watch ngoài cell chưa nạp lại đầy — lần đo 3 (boot+~95 s) còn 23.503 slot trống; lần đo 4 (vài giây sau) chỉ còn 18.447 (mất 5.056 slot trong lúc probe đang chạy — holder ngoài cell nạp lại đồng thời); lần đo 5/6 (boot+148 s) đã về 0. **Bảng đầy lại trong khoảng boot+~100 s → boot+~148 s.** Dòng ENOSPC đầu tiên trên boot #60 xuất hiện 03:07:51Z (xem §4) — khớp: bảng đầy hẳn trong khoảng 03:07:40Z (cuối lần đo 4) → 03:07:51Z (dòng ENOSPC đầu), tức ~18,4k watch cuối nạp trong ~11 s (~1.700 watch/s). T9 không biết holder nào nạp (ngoài cell, không nhìn thấy) — chỉ ghi số đo + thời gian.
- **So sánh với đợt 158:** lần đo đầu sau reboot #59 (01:35Z, boot+~73–100 s) đã là 0 — bảng nạp lại đầy trong ~90 s sau #59; đợt này cần ~150 s sau #60. **Cửa sổ thoáng sau boot tồn tại nhưng hẹp (1–3 phút) và độ rộng thay đổi theo từng reboot** (phụ thuộc thời điểm holder ngoài cell khởi động lại). T9 không claim xu hướng hồi phục — trạng thái ổn định vẫn 0 (8/10 lần đo, gồm cả 2 lần đóng phiên).
- Số watch đang giữ ngoài cell suy ra lúc ổn định: 63.747 − 0 = **63.747 watch** (bảng watch đầy hẳn, 0 watch trống) cả lúc mở, giữa phiên lẫn lúc đóng, trên cả hai boot.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **0 / 1.578 = 0** mở đợt và đóng phiên — một vite mới (~1.578 watch) vẫn không khởi động được (trừ cửa sổ thoáng ~1–2 phút sau boot, không phải trạng thái làm việc).
- **Giải thích thận trọng:** 23.503 thoáng sau #60 KHÔNG phải dấu hiệu bảng đang hồi phục — nó là khoảng trống tạm thời trước khi holder ngoài cell khởi động lại xong (cùng họ 2 watch trống đợt 156, nhưng lớn hơn nhiều vì holder lớn khởi động chậm hơn sau reboot này). T9 không claim xu hướng; chỉ ghi số đo đã xác nhận 10 lần.
- T5-159 KHÔNG probe lại headroom đợt này (như đợt 151–158) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 10 lần đo + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal HAI boot có ≥134 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM trước đo lần đóng (~464.000 kB, đang ghim trần) thấp hơn nhiều RAM lúc thoáng (~1,82 GB) trong khi headroom 0 → 0 (trừ thoáng). Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–158 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **159** | **0 → 0** | **mở 02:39:58Z boot #59 eec65561 btime 01:33:47Z → sau reboot #60 03:07:33Z boot MỚI e590ae0a btime 03:05:59Z: THOÁNG 23.503 rồi 18.447 (boot+~95–100 s), về 0 lúc 03:08:27Z (boot+148 s) → đóng 04:55:08Z cùng boot #60 (MỘT reboot giữa phiên; 10 lần đo, 8 lần 0)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 — đợt 156 nhích lên 2 đã quay về 0 ba đợt liên tiếp (157, 158, 159, tính theo giá trị đóng phiên).** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**. Thoáng 23.503 giữa phiên KHÔNG làm đổi giá trị đóng phiên (0) — xem F-159-T9-1.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ mười chín liên tiếp.** Quyết parent đợt 158 (l) GIỮ quyết (g) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal HAI boot có ≥134 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ tám liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng — cao nhất kể từ đợt 155). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở 02:39:58Z, sau reboot 03:07Z, giữa phiên 03:59:27Z và lúc đóng 04:55:08Z — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.747 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.048.572 kB) — sampler 135 mẫu, 02:39:46Z–04:54:31Z, HAI boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên trên boot #59 (T1 suite/tsc/render + T4 attempt, đỉnh 3.216.244 kB) → reboot #60 → RAM hồi sau boot rồi rơi dần khi balloon leo → ghim trần episode A 6 mẫu → xả sâu 41 mẫu (RAM hồi tới 2.014.068 kB, gate A mở 26/41) → leo lại → ghim trần episode B 24 mẫu (2 dip nông) → còn ghim lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; 1 gap 100 s theo timestamp / ~120 s giờ thật do reboot #60 — xem §5.1). **135 mẫu, 02:39:46Z–04:54:31Z, HAI boot — gap lớn nhất 100 s theo timestamp, KHÔNG có gap nào khác >90 s theo timestamp (xem F-159-T9-3 về gap giờ thật).** Tổng quan: **min 499.084 kB (487,4 MiB) lúc 03:40:28Z; max 3.216.244 kB (3.140,9 MiB) lúc 02:50:47Z — 51,12% guard; mean 1.112.971 kB (1.086,9 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 02:39:46–02:50:47Z | #59 | 801.036–3.216.244 kB | Mở phiên: T1 suite 28/28 + tsc + render; T4 attempt1 lượt yên #28 (02:46:28–02:50:27Z); gate A MỞ 11/12 mẫu; **đỉnh phiên 02:50:47Z** (balloon xả sâu nhất phiên 3.627.868 kB, ngay sau attempt); load1 tới 4,75 (sampler) / 5,20 (watcher) |
| 02:51:47–03:05:47Z | #59 | 716.144–2.868.544 kB | Sau attempt: O8 chạy 03:01:38–03:04:13Z (load1 chỉ 0,50–1,36, 0 spike B2); gate A MỞ 10/15 mẫu; balloon leo lại 5,5–5,9M kB |
| 03:07:27–03:35:28Z | #60 | 569.976–1.983.528 kB | Sau reboot #60: RAM hồi, balloon xả 5.074.260 kB; tải boot apt-get/dpkg + harness attempt 2 (B2 18 spike 03:07:27–03:23:30Z); gate A MỞ 16/29 mẫu; load1 tới 6,48 (sampler) / 6,84 (watcher) |
| 03:36:28–03:41:28Z | #60 | 499.084–538.568 kB | **Ghim trần episode A, 6 mẫu** (xem §2.2); **RAM min phiên 03:40:28Z (499.084 kB)**; gate A ĐÓNG cả 6 mẫu; load1 ≤0,57 (yên hoàn toàn về tải) |
| 03:42:28–04:22:30Z | #60 | 611.008–2.014.068 kB | **Xả sâu sau episode A, 41 mẫu** (balloon tới 4.901.756 kB = 76,1% trần); RAM hồi, **gate A MỞ 26/41 mẫu**; load1 ≤1,60 |
| 04:23:30–04:54:31Z | #60 | 512.064–910.572 kB | **Ghim trần episode B, 24 mẫu trong 3 chuỗi + 2 dip nông** (xem §2.2), còn ghim lúc đóng; **gate A ĐÓNG cả 32 mẫu** (kể cả 8 mẫu dip); load1 ≤1,37 |

- **Gate A ≥1024 MiB: 63/135 mẫu** (21/27 boot #59 + 42/108 boot #60); **0 mẫu ≥ guard**; load1 max (sampler) **6,48 lúc 03:08:27Z** (watcher bắt 6,84 lúc 03:08:03Z — cadence 30 s bắt được đỉnh cao hơn); **16/135 mẫu load1 ≥3,0** (4 mẫu boot #59 + 12 mẫu boot #60). **RAM <512.000 kB: 2 mẫu** (499.084 lúc 03:40:28Z; 508.604 lúc 03:41:28Z — cả hai trong chuỗi 1 ghim); **RAM <300.000 kB: 0 mẫu** (đợt 158: 4 mẫu <300.000 kB — đợt này trũng nông hơn nhiều).
- Swap: SwapFree 727.312 kB (mẫu đầu) → 636.232 kB (mẫu cuối); dao động 602.896–1.030.736 kB — nhảy lên 1.030.736 kB ngay sau reboot #60 (xả swap theo reboot, cùng mẫu đợt 157/158) rồi tụt dần về ~636–670k kB. SwapFree thấp nhất phiên 602.896 kB lúc 03:03:47Z (trên boot #59, trong lúc O8 chạy).
- Mẫu 02:50:47Z (đỉnh phiên): RAM 3.216.244 kB, balloon xả 3.627.868 kB — balloon xả sâu nhất phiên ngay sau T4 attempt1 (cùng mẫu đợt 152/153/154/155/156/157/158: xả sâu sau attempt / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này nông: min 499.084 kB (đợt 158: 199.248 kB; T8-158 đo độc lập 168 MB) — T8-159 đo độc lập RAM min 566 MB lúc 03:28:13Z (sampler riêng n=33, attempt 2) — cùng trũng nông, corroborate (chênh do cadence/cửa sổ lấy mẫu khác nhau; sampler T9: min 499.084 kB lúc 03:40:28Z trong lúc ghim trần, không phải lúc harness chạy).

### 2.2 Balloon virtio — GHIM TRẦN 2 EPISODE MỚI, 30/135 mẫu, 4 chuỗi, MỘT boot (#60)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #59: GHIM TRẦN 0/27 mẫu (0%)** — balloon cao nhất 6.090.064 kB (94,5% trần) lúc 02:39:46Z, chưa chạm trần lần nào trước reboot #60.
- **Boot #60 (e590ae0a): GHIM TRẦN 30/108 mẫu (27,8%), trong 4 chuỗi — 2 EPISODE:**
  - **Chuỗi 1: 03:36:28–03:41:28Z, 6 mẫu** (span 300 s); leo đều lên trần từ 03:07:27Z (balloon 5.074.260 kB → 6.443.824 kB trong ~29 phút).
  - **Đứt quan sát được 03:42:28Z** (balloon xả về 6.050.608 kB = 93,9% trần, RAM hồi 896.836 kB), rồi xả sâu tới 4.901.756 kB (76,1% trần) lúc 03:58:29Z.
  - **Chuỗi 2: 04:23:30–04:33:30Z, 11 mẫu** (span 600 s, 10 phút).
  - **Dip nông 1: 04:34:30–04:37:30Z, 4 mẫu** — balloon 6.092.312 kB (94,5% trần) lúc 04:34:30Z là điểm thấp nhất, rồi leo lại 96,3% / 97,9% / 99,4%; RAM trong dip tối đa 884.536 kB, **gate A KHÔNG mở lần nào**.
  - **Chuỗi 3: 04:38:30–04:49:31Z, 12 mẫu** (span 661 s, 11 phút).
  - **Dip nông 2: 04:50:31–04:53:31Z, 4 mẫu** — balloon 6.086.004 kB (94,4% trần) lúc 04:50:31Z là điểm thấp nhất, rồi leo lại 95,7% / 97,4% / 99,0%; RAM trong dip tối đa 910.572 kB, **gate A KHÔNG mở lần nào**.
  - **Chuỗi 4: 04:54:31Z, 1 mẫu; CÒN MỞ LÚC ĐÓNG PHIÊN — KHÔNG quan sát được điểm đứt** (phiên đóng khi đang ghim; mẫu cuối phiên vẫn ghim).
- **Tổng ghim trần đợt này: 30/135 mẫu (22,2%)** (đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **2/4 chuỗi quan sát được điểm đứt** (chuỗi 1 đứt quan sát được; chuỗi 4 còn mở lúc đóng — cùng mẫu "không quan sát được điểm đứt" như chuỗi 3 đợt 158, nhưng lần này do phiên đóng chứ không phải reboot).
- **Phán theo quy tắc quyết (e)/(g) (T9 phán, giao T10 xác nhận cách đếm):**
  - **Episode A (boot #60, chuỗi 1): 1 EPISODE.** Chuỗi đơn, đứt quan sát được + hồi RAM + xả sâu sau đó (tới 76,1% trần, gate A mở 26/41 mẫu trong 41 mẫu tiếp theo).
  - **Episode B (boot #60, chuỗi 2+3+4): 1 EPISODE.** Ba chuỗi cùng boot, cách nhau bởi dip NÔNG (94,5% / 94,4% — KHÔNG phải xả sâu; gate A đóng suốt cả hai dip; mỗi dip chỉ 4 mẫu / ~4 phút) — đếm là 1 episode theo quy tắc (g) đợt 152 + tiền lệ đợt 157 (episode B đợt 157: dip tới 94,4% vẫn cùng episode) và đợt 158 (episode A: dip tới 94,5% / 97,4%). Dip 2 đợt này (94,4%) trùng khớp đúng tiền lệ 94,4% đợt 157 — xem F-159-T9-7.
  - **A và B là HAI EPISODE RIÊNG, không nối nhau:** giữa lần ghim cuối episode A (03:41:28Z) và lần chạm đầu episode B (04:23:30Z) có **xả sâu tới 4.901.756 kB (76,1% trần) + RAM hồi tới 2.014.068 kB (gate A MỞ 26 mẫu) + ~42 phút không ghim** — đủ điều kiện tách episode (xả sâu + hồi RAM; cùng mẫu tách episode đợt 156/157/158).
  - **Cả hai episode đều MỚI, không nối đợt 158:** giữa lần ghim cuối đợt 158 (01:54:25Z, boot #59) và lần chạm đầu đợt 159 (03:36:28Z, boot #60) có **reboot #59 lúc mở + reboot #60 giữa phiên + balloon xả sâu nhiều lần (tới 3.627.868 kB = 56,3% trần lúc 02:50:47Z) + ~1 giờ 42 phút không ghim**.
  - **Đợt 159 = 2 EPISODE GHIM MỚI** (A: 6 mẫu/1 chuỗi; B: 24 mẫu/3 chuỗi) — **đợt thứ tư liên tiếp có 2 episode** (đợt 156, 157, 158 đều 2 episode).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~499–620.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 04:54:31Z: tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 576.208 kB.

### 2.3 Lượt yên WebKit #28 (T4, đợt 159) — CÓ LƯỢT HỢP LỆ #24, CHUỖI NỐI DÀI (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-159 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND159_T4_WEBKIT_QUIET28_LIMITS.md`) + cờ `round159-t4.done` (02:59Z) — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Poller T4 chạy 1 instance, 6 poll thật (1 test + 5), 1 boot (#59), 1 cửa mở (poll #5):**
  - **Attempt1-eec65561 (02:46:28–02:50:27Z): probe 20/20, LỚP B ĐẠT 5/5, tickCost median 44,5 ms ≤60 — HỢP LỆ.** Ngân sách đã dùng 1/3 (attempt1 ĐẠT ngay, không cần attempt 2/3). Poller thoát vì LUOT HOP LE.
  - **Pre-flight (quy tắc đứng mới, quyết (t) đợt 158) PASS toàn bộ trước poller** — F-158-T4-1/2 (quên copy b.json) không lặp lại.
  - **0 PAGE-WEDGED** (đợt thứ ba liên tiếp không tái diễn chữ ký đợt 156). lag≥+5f = 0 occurrence.
  - RAM ≥1024: 0/103 mẫu <1024 trong poller (RAM min 1.064 MB); load1 max 1,04 trong attempt.
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): CÓ 1 attempt hợp lệ cho lượt yên #28 (#24)** — chuỗi lượt yên hợp lệ **NỐI DÀI lên #24** (#22 đợt 157 → #23 đợt 158 → #24 đợt 159). Cộng dồn 24 lượt theo LIMITS T4-159: P1 91/92, P2 83/83, P3-A1 77/92, **P3' 56/64 occurrence = 56/59 distinct-seq**, P7 58/58; (c2) 5 occ / 5 distinct-seq, COVERED 5/5.
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Gate A RAM: **MỞ 4/4 mẫu trong cửa sổ attempt** (02:46:47Z 1.269.500 kB; 02:47:47Z 1.241.116 kB; 02:48:47Z 1.522.336 kB; 02:49:47Z 1.340.144 kB — cả 4 đều ≥1024 MiB). Mẫu ngay sau attempt 02:50:47Z (3.216.244 kB — đỉnh phiên, balloon xả 3.627.868 kB).
  - Tải: sampler load1 trong cửa sổ attempt **0,31–0,70**; **0 spike B2 trong cửa sổ attempt** (xem §2.5).
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cửa sổ attempt** (mẫu thấp nhất trong cửa sổ là 1.241.116 kB lúc 02:47:47Z).
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy 02:46:28–02:50:27Z trên boot #59 (1 instance; attempt1 02:46:28–02:50:27Z).

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 02:46:47–02:49:47Z | #59 | 0,31–0,70 (4 mẫu) | 1.241.116–1.522.336 kB — **gate A MỞ 4/4** | T4 attempt1 — 0 spike B2 trong cửa sổ; attempt1 HỢP LỆ (tickCost median 44,5 ms ≤60) |
| 02:50:47Z | #59 | 0,58 (1 mẫu) | 3.216.244 kB — **gate A MỞ** | 20 s sau khi attempt kết thúc (02:50:27Z); balloon xả 3.627.868 kB — đỉnh RAM phiên |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 25 spike, 21 QUY ĐƯỢC DRIVER CỤ THỂ + 4 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ" (0 spike trong cả hai cửa sổ balloon ghim, 0 spike trong cửa sổ attempt T4, 0 spike trong lúc O8 chạy)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-159-T9-2). **25 spike, trong 02:40:16Z–03:23:30Z; 0 spike trong 03:36:28–03:41:28Z (~6 phút episode A) và 04:23:30–04:54:31Z (~31 phút episode B, gồm cả 2 dip nông) — tổng ~37 phút ghim, tải yên hoàn toàn. 0 spike trong cửa sổ attempt T4 (02:46:28–02:50:27Z) và trong lúc O8 chạy (03:01:38–03:04:13Z).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — T1 suite/tsc/render (7 spike) | 02:40:16–02:43:47Z | 3,46–**5,20** | 7 | tsc MainThread top 120,0% delta **107** (spike 1); node test binOrphan60Q7 delta 0, top tức thời 0,0% mọi proc (spike 2); ffmpeg top 150,0% delta **124** (spike 3); ffprobe top 100,0% tích lũy + node render.js 75,0% + tsc MainThread top 60,0% tức thời (spike 4 — delta không bắt được, cả hai chết trước delta); python3 mask_anim.py top 90,9% delta **96** (spike 5); python3 mask_anim.py top 72,7% delta **89** (spike 6); ffmpeg top 100,0% delta **135** (spike 7) | **T1 verify suite (tsc ×1 + render ffmpeg ×2 + ffprobe/render.js ×1 + mask_anim ×2)** — suite T1 chạy 02:39:53–02:46:42Z (28/28 exit 0); **1 spike lớp load1 dư (spike 2)** |
| 2 — tải boot #60 apt-get/dpkg (7 spike) | 03:07:27–03:11:00Z | 3,09–**6,84** | 7 | apt-get top 80,0%, delta 33 (spike 8); apt-get top 100,0% delta **39** (spike 9); dpkg-deb top 110,0%, delta **72** (spike 10, dpkg --unpack); apt-get top 100,0% delta **26** (spike 11); apt-get top 100,0% delta **72** (spike 12); top tức thời 0,0% mọi proc, delta max 9 daemon (spike 13); privsep health-check 25,0% tích lũy nhưng chết trước delta/top, top tức thời chỉ daemon 20,0% (spike 14) | **Tải boot sau reboot #60: apt-get ×4 + dpkg ×1** — lần đầu tiên apt-get/dpkg xuất hiện làm driver B2 (họ mới, không phải T1/T8); **2 spike lớp load1 dư (spike 13, 14 — đuôi tải boot)** |
| 3 — O8 clicktest WebKit/Chromium (11 spike) | 03:14:35–03:23:30Z | 3,24–**4,97** | 11 | WebKitWebProcess top 100,0% delta **101** + MiniBrowser 27 (spike 15); WebKit top 72,7% delta **105** + MiniBrowser 48 (spike 16); WebKit top 109,1% delta **101** + MiniBrowser 25 (spike 17); top tức thời hatch 20,0%, delta max 4 daemon, Xvfb 4,3% tích lũy (spike 18 — khe giữa 2 lần chạy WebKit); WebKit top 90,9% delta **100** + MiniBrowser 29 (spike 19); WebKit top 72,7% delta **103** + MiniBrowser 25 (spike 20); WebKit top 54,5% delta **101** + MiniBrowser 24 (spike 21); WebKit top 10,0% delta **5** + MiniBrowser 26,4% tích lũy (spike 22 — đuôi lần chạy 86n2); chrome top 63,6% delta **63** + node clicktest-84l10 6 (spike 23); chrome top 100,0% delta **97** + chrome 23 (spike 24); chrome gpu-process top 100,0% delta **95** + renderer 25 (spike 25) | **O8 harness attempt 2 của T8 (03:12:12–03:28:25Z): WebKit ×7 + Chromium ×3**; **1 spike lớp load1 dư (spike 18)** |

- **Tổng kết đếm: 21/25 spike có driver process cụ thể** (cụm 1: 6; cụm 2: 5; cụm 3: 10) **+ 4/25 spike lớp "load1 dư"** (spike 2, 13, 14, 18 — ghi rõ trong bảng trên, không gộp chung thành "đã quy được nguồn"). Lớp load1 dư có cơ chế chung: load1 là trung bình 1 phút còn dư sau burst trước + tải nền từ nhiều process ngắn hạn (mỗi process chết trước khi đo delta / không lọt top-5 theo %CPU tích lũy) — corroborate bằng nr_running 1–12 trong các header spike.
- **Caveat đếm (F-159-T9-2):** lệnh chờ của chính T9 (`sleep 3600` / `sleep 3000` / `sleep 3300` trong các exec chờ) xuất hiện trong snapshot `ps` của b2-spikes.log (23 dòng nhắc `sleep N`) ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Lệnh `ps -eo pid...` xuất hiện 4 dòng — đều là command-line của chính exec chờ sleep-3000 của T9 (chứa chuỗi `ps -eo pid,etime,args | grep...`), KHÔNG phải `ps` của watcher. Đếm spike dùng neo đầu dòng `grep -c '^=== SPIKE'` = **25**.
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log** — F-150-T9-8 VẪN ĐÓNG.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution (vd spike 4: ffprobe 100,0% tích lũy + MainThread 60,0% top dù cả hai chết trước delta; spike 22: WebKit 87,3% tích lũy + top 10,0% dù delta chỉ 5). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 21 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 21/25 spike; 4 spike còn lại chỉ quy được lớp load1 dư — giới hạn phương pháp đã biết (process ngắn hạn / tải phân tán), T9 ghi rõ thay vì gộp chung.
- **Delta tick lớn nhất đợt: 135 tick/s** (ffmpeg, spike 02:43:47Z); WebKitWebProcess 100–105 tick/s; mask_anim.py 89–96 tick/s; apt-get 26–72 tick/s; dpkg 72 tick/s; tsc MainThread 107 tick/s (delta) / top 120,0%; chrome 63–97 tick/s; daemon 4–21 tick/s. (Đợt 158: max 112 tick/s.)
- **Watcher gap do reboot:** watcher chết theo reboot #60; ~3 lần kiểm (cadence 30 s) bị mất trong gap 100 s (03:05:47Z → 03:07:27Z theo timestamp). Load1 tại mép gap 0,74 → 5,22 (tải boot đang leo) — **có thể 1 spike (tải boot apt-get/dpkg) bị mất trong gap, không chứng minh được** (spike đầu tiên sau khởi động lại là 03:07:27Z load1 5,22 — xem F-159-T9-4).
- **O8 chạy nhẹ đợt này:** O8 03:01:38–03:04:13Z (WebKit 21/21 ×2 + Chromium 21/21) gây **0 spike B2** (sampler load1 trong cửa sổ O8 chỉ 0,50–1,36; 3 mẫu trong cửa sổ: RAM 716.144–915.508 kB, gate A ĐÓNG cả 3 — khác đợt 158, O8 gây 2 spike).

### 2.6 Truy chủ ffmpeg / mask_anim — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này ffmpeg xuất hiện trong 2/25 spike + mask_anim.py trong 2/25 spike + ffprobe/render.js trong 1/25 spike, là **test render trong suite verify của T1** (test_round93_u4_failfast_measure.js, spec u4-anim-old.json) — chạy đúng chức năng, thoát bình thường. T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/tsc/render + tải boot apt-get/dpkg + O8 clicktest + load1 dư; không process lạ).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (TRỪ GAP 100 S TẠI REBOOT #60); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ mười ba liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148–158 giữ nguyên; quyết parent (n) đợt 158 GIỮ NGUYÊN cơ chế (a) armed): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **3.216.244 kB = 3.140,9 MiB = 51,12% guard lúc 02:50:47Z** — xa guard 3.075.212 kB. Đỉnh đợt này cao hơn hẳn đợt 158 (35,77% guard) nhưng vẫn chưa tới một nửa đường tới guard.
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ mười ba liên tiếp (147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159).** Cơ chế tự động armed cả phiên (sampler `round159-t9/sampler.sh`, pid 12483 rồi pid 2289 sau reboot #60, chạy 02:39:46Z–04:54:31Z, 135 mẫu — trừ gap 100 s tại reboot #60, xem §5.1) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→159 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**, **3.211**, **2.779**, **3.477**, **2.612**, **2.250**, **3.216**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 02:39:46Z–04:54:31Z (135 mẫu, chỉ 1 gap 100 s tại reboot #60 rồi khởi động lại bằng tay); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 158 nằm trong dir round158-t9 nên không chặn đợt này (dir mới round159-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-159-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-159-birefnet/out-birefnet-159.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147–158):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-159-T9-9); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-159-T9-8 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra — đợt này T4 có 1 attempt hợp lệ nhưng cửa sổ guard không mở nên điểm (c) không phát sinh). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này MỘT LẦN: reboot #60 giết sampler, gap 100 s theo timestamp (~120 s giờ thật)** (đợt 158: gap 80 s; đợt 157: gap 72 s; đợt 156: gap tổng 226 s; đợt 155: gap 61 s; đợt 154: gap 95 s; đợt 153: gap 61 s; đợt 152: gap 71 s; đợt 151: gap 46 s; đợt 149: gap 87 s) — dữ kiện này KHÔNG ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" ở mức tuyệt đối, nhưng gap 100 s / ~8.100 s phiên (~1,2%) là nhỏ và T9 khởi động lại bằng tay kịp thời; T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10. **Bổ sung: T5-159 triển khai watcher respawn theo quyết parent (e) đợt 153 (phương án 1 + quy tắc đứng (3)) — cùng họ vấn đề với sampler T9; T5 là chủ quản, T9 chỉ nêu dữ kiện.**
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Phương pháp đếm (ghi rõ):** `journalctl --no-pager | grep -c 'No space left on device'` trên boot đang chạy tại thời điểm đếm; journald chỉ giữ 1 boot (volatile) nên **số cuối của một boot KHÔNG kiểm được sau khi reboot sang boot mới** (cùng giới hạn F-155-T10-1 / F-154-T1-3). Mỗi boot dưới đây ghi rõ: số đếm được lần cuối + thời điểm đếm + ai đếm. **Tổng phiên là CẬN DƯỚI (≥), không phải số đếm đầy đủ.**
- **Journal trên boot #59 (eec65561): ≥56 dòng** — T9 đếm **56 dòng lúc 02:39:59Z** (dòng đầu 01:35:40Z, dòng cuối lúc đó 02:39:38Z); **T5-159 đếm 58 dòng lúc 02:42:29Z** (ghi trong `round159-t5.done` — corroborate độc lập: +2 dòng trong 150 s ≈ 75 s/dòng, khớp cadence ~69 s/dòng của T9). **Số cuối KHÔNG kiểm được** (journal mất theo reboot 03:05:59Z; từ 02:42:29Z tới reboot còn ~23 phút chưa đếm — T9 KHÔNG cộng số ước vào tổng; xem F-159-T9-5).
- **Journal trên boot #60 (e590ae0a): 78 dòng lúc đóng** (T9 đếm 78 lúc 04:55:08Z; dòng đầu 03:07:51Z — chỉ ~112 s sau btime 03:05:59Z, khớp lúc bảng đầy lại sau thoáng headroom; dòng cuối 04:53:59Z). Boot này còn sống lúc T9 đóng nên 78 là số đếm tới thời điểm đóng (có thể tăng sau khi T9 đóng — T10 kiểm lại nếu cần). Cadence ~82 s/dòng (78 dòng / ~106 phút từ dòng đầu 03:07:51Z tới dòng cuối 04:53:59Z).
- **Tổng phiên: ≥134 dòng trên HAI boot** (≥56 + 78 — mỗi boot là cận dưới tại thời điểm đếm cuối; lấy số T9 56 cho #59, không lấy số T5 58 cộng thêm vì cùng một journal — tổng dùng số quan sát cuối của T9 để nhất quán phương pháp, số T5 chỉ dùng corroborate). Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. **Đây là đợt thứ tám liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng — ít hơn vì journal của 3 boot cũ mất theo 3 reboot; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng — ít hơn vì journal boot #58 mất theo reboot #59 sau khi chỉ đếm tới 34; đợt 159: ≥134 dòng — cao nhất kể từ đợt 155).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=0 ×8 lần — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo; 2 lần thoáng 23.503/18.447 probe cũng nhả toàn bộ watch sau đó); **(2) ≥134 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 0 — **không thêm được watch nào cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 MỘT reboot giữa phiên #60 + lệch đồng hồ ~+20 s (sampler/watcher chết theo, khởi động lại bằng tay)

- **Boot lúc mở đợt 159 = eec65561** (btime **01:33:47Z** theo `/proc/stat` — KHỚP T10-158 đóng; T0-159 xác minh 6 nguồn độc lập đều khớp; **không có reboot mới kể từ lúc T10-158 đóng**).
- **Đồng hồ lúc mở ĐÃ ĐƯỢC T0-159 XÁC MINH LÀ ĐÚNG:** wall clock khớp Cloudflare trong ±1 s (Cloudflare +0,51 s / +0,47 s); GitHub −7,05 s (edge lag, không dùng làm chuẩn) — **không còn dấu hiệu chạy nhanh ~42'46"–50'26" như đợt 156** (T0-159 §5). T0-159 cũng xác minh marker persistence sống qua 11 reboot #49–#59.
- **Reboot GIỮA phiên:** sampler lần 1 (pid 12483) + watcher lần 1 (pid 12484) chết theo reboot; lệnh chờ `sleep 3600` của T9 bị SIGTERM sau 1.575 s (~03:06:55Z, tức phiên exec của T9 chết theo reboot — xem F-159-T9-6). Mẫu cuối sampler cũ: **03:05:47Z boot=eec65561 mem=1.212.340 bal=5.668.592 load1=0,74**. Boot mới **e590ae0a** (btime **03:05:59Z** stat; journal first entry 03:06:15Z; wtmp 1 entry duy nhất "reboot Sat Nov 21 03:06 still running"). **Sampler + watcher khởi động lại bằng tay lúc 03:07:27Z** (sampler pid 2289, watcher pid 2290; mẫu đầu boot mới 03:07:27Z mem=1.765.408 bal=5.074.260 swapfree=1.030.736 load1=5,22). **Gap phủ sóng sampler: 100 s theo timestamp** (03:05:47Z → 03:07:27Z). **Số hiệu #60: T9 tự xác nhận theo đếm tuần tự** (#59 đã xác nhận, quyết (s) đợt 158; boot mới duy nhất sau #59 trong phiên; btime 03:05:59Z) — **giao T2-159/T10-159 chốt chính thức**. Mù cho #60 giao T2-160 (T2-159 đóng ~04:08Z, trước khi T9 đóng — mù #91? đã đóng, #88?/#77? vẫn mở; xem §5.2). Tuổi thọ boot #59: btime 01:33:47Z → btime boot mới 03:05:59Z = **5.532 s = 1h32m12s** (stat→stat).
- **Dấu hiệu đồng hồ tại reboot #60 (ghi rõ cho T1/T2/T7):** mẫu sampler cuối boot #59 (03:05:47Z) ghi TRƯỚC btime boot mới (03:05:59Z) **12 s** — KHÔNG overlap như #59 đợt 158 (mẫu cuối #58 nằm 18 s SAU btime #59). T7-159 xác nhận độc lập: **nghịch lý đồng hồ lần thứ ba liên tiếp — đồng hồ boot cũ nhanh ~+20 s lúc chết** (#58: +28 s; #59: +19 s; #60: +20 s) — không ảnh hưởng offset (m) #60. Vì T0-159 xác minh đồng hồ ĐÚNG ±1 s lúc mở (02:38Z, Cloudflare) nên drift ~+20 s này **tích lũy trong phiên** (02:38Z → 03:05Z, ~27 phút — nhanh hơn nhiều so với drift ≥18 s tích lũy trong ~107 phút của đợt 158, nếu cùng cơ chế). T9 không phán cơ chế hay tốc độ drift; giao T0/T2/T7 đối chiếu. **Hệ quả cho gap phủ sóng: gap theo timestamp là 100 s (03:05:47Z → 03:07:27Z), nhưng gap giờ thật ước ~120 s** (mẫu cuối boot cũ viết ở giờ thật ≈ 03:05:27Z nếu đồng hồ cũ nhanh ~20 s — cộng thêm δ ≈ 20 s vào 100 s; δ theo T7-159, T9 không đo độc lập). Thống kê script ghi "gaps >90s: 1 (100 s)" là theo timestamp — T9 ghi rõ ở đây để T10 không đọc nhầm thành "gap giờ thật 100 s". Không ảnh hưởng số đếm mẫu (boot_id ghi trong log).
- **Đồng hồ boot mới #60:** T9 chỉ kiểm btime /proc/stat (03:05:59Z) + journal/wtmp — **KHÔNG kiểm lại Cloudflare/GitHub trên boot mới** (xem F-159-T9-10). Mô hình đồng hồ thuộc T2-159.
- Các cờ .done lúc T9 đóng (~05:00Z): t0, t1, t2, t4, t5, t6, t7, t8 (8/8 — t9 đóng ngay sau khi viết LIMITS này, thành 9/9).

### 5.2 T5-159 — POSTBOOT_PASS cho #59 ĐÃ CÓ; #58 ĐÃ CÓ từ đợt 158; #60 giao T5-160 (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **POSTBOOT_PASS cho boot #59 ĐÃ CÓ (T5-159, 02:41:22Z, boot+67m35s, replay đầy đủ, poll=0)** — replay #59 nhanh nhất từng ghi (hoạt động đầu boot+35 s, xong boot+2m36s, dpkg 1.545, cache 178, lists 39, GST 269); cờ muộn hơn #58 vì phiên mở muộn (boot+62m04s), không phải replay chậm. Watcher-159 khởi động bằng tay 02:41:21Z pid 18158.
- **POSTBOOT_PASS cho boot #58: ĐÃ CÓ từ đợt 158 (23:43:22Z, nhanh nhất từ trước, replay đầy đủ).**
- **Boot #60 (e590ae0a): POSTBOOT_PASS giao T5-160** (T5-159 đóng ~02:46Z, trước reboot #60).
- **Marker `~/.config/vcut-persistence-marker` sống qua 11 reboot (#49–#59).**
- **Watcher respawn:** T5-159 triển khai theo quyết parent (e) đợt 153 (phương án 1 user systemd unit + quy tắc đứng (3)). Sampler T9 vẫn khởi động lại bằng tay sau reboot (gap 100 s đợt này) — cùng họ vấn đề, chưa có cơ chế tự hồi phục cho sampler.
- **Mâu thuẫn T0-159/T5-159 (ghi nhận, giao T10 phán):** T0 ghi watcher-158 "chết tự nhiên, không do reboot"; T5 ghi watcher-158 CHẾT theo reboot #59 (log dừng 01:34:06Z, poll cuối boot 28366bd0, 0 NEWBOOT) — T9 không phán (F-159-T5-3).

### 5.3 T8-159 — O8 PASS 3/3 cùng boot #59 + harness attempt 2: 6/6 SẠCH, 0 kẹt (T9 chỉ ghi lại để đối chiếu)

- **O8: WebKit 21/21 ×2 + Chromium 21/21, toàn bộ PASS exit 0** (03:01:38–03:04:13Z, boot #59, cùng cây preview.tsx `530e10a7`) — qua **gate chuẩn CÙNG BOOT** (GATE-FOUND poll 21 lúc 03:00:24Z: cờ T4 + POSTBOOT_PASS đường (a) của T5; lượt yên #28 có lượt hợp lệ #24 trên ĐÚNG boot đo — sạch như đợt 158). Chuỗi WebKit FULL PASS 13 → ? (chờ T10/parent phán — T8 KHÔNG tự chốt).
- **Harness attempt 1 BỊ REBOOT #60 GIẾT giữa WebKit 84l10 (không verdict, không phải kẹt, không phải FAIL)** — bằng chứng lưu smoke/attempt1-reboot-killed/. **Attempt 2 (boot mới #60): 6/6 PASS, 0 kẹt** trong MỘT lần chạy driver duy nhất (03:12:12–03:28:25Z, 16'13"); 85m4 P4-lần3 **PASS, KHÔNG tái kẹt lần 3** (chưa đủ điều kiện mở điều tra H3 — quyết (i) đợt 158); 86n2 P4-lần2 PASS (chuỗi 9 → 10); 84l10 E4 ended=true. **Kẹt cộng dồn GIỮ 13; chuỗi "P3 không kẹt" 0 → 1.** Watchdog 0 kích hoạt (đúng — không có kẹt); live-diag 0 kích hoạt (không có kẹt để thử thách — điểm mù F-158-T8-4 KHÔNG được kiểm chứng đợt này, vẫn là giới hạn đứng theo quyết (u)).
- **RAM avail min 566 MB lúc 03:28:13Z (lúc Chromium 86n2)** — cao hơn nhiều so với đợt 158 (168 MB); sampler T9: min 499.084 kB lúc 03:40:28Z — cùng trũng nông, corroborate (xem §2.1).
- **0 REBOOT trong lúc T8 đo attempt 2** (T8 đóng ~03:35Z, trước khi episode A ghim 03:36:28Z — sampler attempt 2 của T8: n=33, balloon max 91,3% trần, pinned=0 — khớp sampler T9: chưa ghim trước 03:36:28Z).

### 5.4 Run 158 SUCCEEDED + điểm (m) dương mới #60 (T7-159 đã xuất bản LIMITS — T9 chỉ ghi lại để đối chiếu)

- **Run 158: SUCCEEDED 02:27:11Z** (event 02:27:11Z, eid 9587), wall gốc **10.280 s**, margin **520 s** tới hạn 02:35:51Z (hẹp thứ ba từ đợt 150, sau run 150: 177 s và run 157: 345 s) — theo T7-159 LIMITS (3 lần đọc DB khớp nhau). **#59 KHÔNG tạo điểm (m) mới** (không viết lại run 158 lần 2).
- **Reboot #60 giữa phiên (e590ae0a, btime thật 03:05:59Z): VIẾT LẠI run 159 lần 1 — ĐIỂM (m) DƯƠNG MỚI +46,642 s** (trong dải 33–49,8 s, tính cùng khung giờ thật). Run 159 vẫn running lúc T7 đóng cờ — kết cục thuộc T7-160.
- **n (m): chính thức (ứng viên) GIỮ 14** (quyết (g) đợt 156); ứng viên mới **18 (16 dương + 2 âm) hoặc 19 (16 dương + 3 âm nếu #56 là điểm ÂM)** nếu tính cả #60 — chờ parent quyết. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-159 không thu hẹp được cửa lần thứ hai: R 2,56251–2,66817 / J 2,566–2,80753 s); dải GIỮ 33–49,8 s; điều tra (m) VẪN ĐÓNG.
- **Slot: HB 6/6, DR 3/3, 0 thiếu, 0 muộn — CỬA LÀNH HOÀN TOÀN LẦN THỨ BẢY LIÊN TIẾP.** Lũy kế HB 44/345, DR 49/243. Run 159: jitter 0 s lần thứ 12 liên tiếp.
- T7-159 cũng xác nhận độc lập: **nghịch lý đồng hồ boot cũ nhanh ~+20 s lúc chết** (lần thứ ba liên tiếp: #58 +28 s; #59 +19 s; #60 +20 s) — khớp F-159-T9-3 (gap giờ thật ~120 s).

### 5.5 Các luồng khác đợt 159 (T9 chỉ ghi lại để đối chiếu)

- **T1-159: VERIFY 158 PASS** — đếm script viết mới (count-final-159-t1.py): đợt 158 = 10/13/13; lũy kế 111–158 = 468/885/755; chờ push 136–158 = 220/307/259; tái kiểm 111–157 = 458/872/743 — KHỚP từng số, lần thứ 48 liên tiếp; suite chạy lại 28/28 exit 0 (02:39:53–02:46:42Z, boot #59 — đúng cửa sổ B2 cụm 1 của T9); O8 xác nhận độc lập 21/21 ×3 (chuỗi FULL PASS LÊN 13 theo quyết (h) đợt 158).
- **T2-159: mù #91? (#59) ĐÓNG** (H file 1.355 s / union 31 s; I file 1.132 s / union 634 s — trình cả hai số theo quyết (b) đợt 158); **mù #88? VẪN MỞ** (lần thứ ba liên tiếp, hole-recheck 345 hit, 0 mốc mới); **mù #77? VẪN MỞ**; INSIDE: #59 NGOÀI dải FULL105 (muộn 445 s) → chuỗi GIỮ 4, không lên 5; CERT91/FULL106 ứng viên có điều kiện (n=91/106); CERT/FULL chính thức GIỮ 76/91; (m) #56 KHÔNG thu hẹp được lần thứ hai.
- **T6-159: (A) 120/120 PASS dưới churn (lần thứ 9 liên tiếp, tổng 1080/1080); suite 9/9 ×6 rc=0;** lock 476 cặp lúc kiểm cuối, 0 đang giữ, 0 TIMEOUT mới; **prune lần 34** (xóa cooldown-t8-round117, 137,83h); F-147-T6-1 nối lại lần thứ 10.
- **T0-159:** boot #59 xác nhận 6 nguồn; đồng hồ ≈ Cloudflare ±1 s lúc mở; O8 JSON còn đúng (md5 khớp hồ sơ); marker sống qua 11 reboot.

## 6. Sai số của chính T9 (ghi rõ)

- **F-159-T9-1 — Thoáng headroom 23.503/18.447 sau reboot #60 (lần đầu khác 0 kể từ đợt 152), ĐÃ GHI ĐÚNG BẢN CHẤT TRONG §1.2 (không phải hồi phục):** số đo bằng cùng probe K8, phương pháp không đổi — 23.503 là số slot trống tức thời tại boot+~95 s (probe tự giữ tới 23.503 watch trong lúc chạy; holder ngoài cell nạp lại đồng thời nên con số là cận dưới của slot trống lúc bắt đầu probe). Trạng thái ổn định vẫn 0 từ boot+148 s trở đi (6 lần đo sau đó đều 0, gồm cả 2 lần đóng phiên). **Nguy cơ đọc nhầm:** nếu chỉ nhìn lần đo 3/4 mà không nhìn lần 5–10 sẽ tưởng bảng đang hồi phục — T9 ghi rõ chuỗi thời gian đầy đủ + dòng ENOSPC đầu 03:07:51Z để T10 không đọc nhầm. Giá trị đóng phiên (0) và chuỗi dài hạn §1.3 dùng giá trị ổn định, không dùng thoáng.
- **F-159-T9-2 — Lệnh chờ của chính T9 lọt snapshot B2 (cùng họ F-158-T9-2), BẮT ĐƯỢC VÀ GHI RÕ TRƯỚC KHI ĐÓNG (không ảnh hưởng số cuối):** `sleep 3600` / `sleep 3000` / `sleep 3300` của T9 xuất hiện trong snapshot `ps` của b2-spikes.log (**23 dòng** nhắc `sleep N`) ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Lệnh `ps -eo pid...` xuất hiện 4 dòng — đều là command-line của chính exec chờ sleep-3000 của T9 (chứa chuỗi `ps -eo pid,etime,args | grep...`), KHÔNG phải `ps` của watcher. Đếm spike dùng neo đầu dòng `^=== SPIKE` = **25** ngay từ đầu. **Fix (n) (loại `ps` của watcher) vẫn đứng:** lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log. T9 đợt sau nên tránh sleep dài trong lúc watcher chạy (dùng cron/scheduler chờ thay cho sleep nếu có thể).
- **F-159-T9-3 — Gap phủ sóng sampler 100 s theo timestamp / ~120 s giờ thật + mẫu cuối #59 KHÔNG overlap btime #60 (cùng họ F-158-T9-3, khác dấu):** mẫu cuối boot #59 (03:05:47Z) nằm 12 s TRƯỚC btime boot mới #60 (03:05:59Z) theo timestamp — nhưng T7-159 xác nhận đồng hồ boot cũ nhanh ~+20 s lúc chết, nên mẫu cuối viết ở giờ thật ≈ 03:05:27Z (32 s trước reboot) và **gap giờ thật ước ~120 s** (100 s timestamp + δ ≈ 20 s). δ lấy từ T7-159 (T7 sở hữu mô hình đồng hồ); T9 không đo độc lập δ cho #60. Thống kê script ghi "gaps >90s: 1 (100 s)" là theo timestamp — T9 ghi rõ ở đây để T10 không đọc nhầm thành "gap giờ thật 100 s". Không ảnh hưởng số đếm mẫu (boot_id ghi trong log).
- **F-159-T9-4 — Gap phủ sóng sampler 100 s (timestamp) / ~120 s (giờ thật) + watcher B2 ~3 lần kiểm tại reboot #60 (cùng lớp F-158-T9-4):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. Thêm: gap tại reboot là khoảng trống thứ hai — một lần vượt guard trong gap cũng không được quan sát (khả năng thấp: RAM tại mép gap 1.212.340 → 1.765.408 kB, đều xa guard; balloon tại mép gap 5.668.592 → 5.074.260 kB, đã xả khỏi trần). Watcher B2 cũng mất ~3 lần kiểm trong gap — **có thể 1 spike (tải boot apt-get/dpkg) bị mất** (load1 tại mép gap 0,74 → 5,22; spike đầu tiên sau khởi động lại là 03:07:27Z load1 5,22 — nếu có spike bị mất thì nó phải nằm đúng trong gap 100 s — không chứng minh được).
- **F-159-T9-5 — ENOSPC boot #59: số cuối KHÔNG kiểm lại được + phần tăng sau 02:42:29Z MẤT theo reboot.** T9 tự đếm 56 dòng lúc 02:39:59Z; T5-159 đếm 58 dòng lúc 02:42:29Z (T9 nhận làm số quan sát cuối cho boot #59 — cadence 56 → 58 khớp ~75 s/dòng). Từ 02:42:29Z tới reboot 03:05:59Z còn ~23 phút chưa đếm (~18 dòng theo cadence) — journal boot #59 đã mất theo reboot nên không kiểm lại được; T9 KHÔNG cộng số ước vào tổng. Tổng phiên ≥134 là CẬN DƯỚI (mỗi boot lấy số đếm cuối quan sát được; riêng #59 dùng số T9 56 để nhất quán phương pháp, số T5 58 chỉ corroborate).
- **F-159-T9-6 — Phiên exec chờ của T9 chết theo reboot #60 (không phải lỗi thao tác):** lệnh `sleep 3600` (chờ tới ~03:40Z để đo giữa phiên) bị SIGTERM sau 1.575 s (~03:06:55Z) khi cell reboot — cùng lúc sampler/watcher lần 1 chết. **Độ trễ ~56 s sau btime (03:05:59Z) là độ trễ teardown session của exec, KHÔNG dùng làm mốc đồng hồ** (khác đợt 158: T7 ghi sleep chết ~5 s sau btime — độ trễ teardown thay đổi theo từng lần). T9 phát hiện khi nhận thông báo session kết thúc, kiểm tra ngay (03:06:58Z) và khởi động lại sampler/watcher bằng tay lúc 03:07:27Z (gap 100 s). Lần này T9 khởi động sampler + watcher bằng `setsid nohup` riêng biệt (bài học F-158-T9-6: không chung exec với lệnh chờ) nên cả hai sống qua các lần teardown exec sau đó.
- **F-159-T9-7 — Chuỗi 2+3+4 đếm là 1 episode (dip nông tới 94,5% và 94,4%): T9 phán, giao T10-159 xác nhận.** Theo quy tắc (g) đợt 152 + tiền lệ đợt 157 (episode B: dip tới 94,4% vẫn cùng episode) và đợt 158 (episode A: dip tới 94,5%/97,4% — quyết (k) đợt 158). Dip 2 đợt này (94,4%, 4 mẫu) trùng khớp đúng tiền lệ 94,4% đợt 157 (5 mẫu) — cùng bản chất: không xả sâu (điểm thấp nhất 6.086.004 kB, RAM trong dip tối đa 910.572 kB, gate A không mở lần nào). Dip 1 (94,5%, 4 mẫu) trùng khớp tiền lệ 94,5% đợt 158. Nếu T10/parent phán dip 1 hoặc dip 2 là xả (đủ tách episode) thì đợt 159 = **3 episode** (A: chuỗi 1; B: chuỗi 2; C: chuỗi 3+4) hoặc **4 episode** (mỗi chuỗi riêng) thay vì 2 — T9 ghi rõ để T10 phán, không giấu điểm khác biệt. Thêm: chuỗi 4 còn mở lúc đóng phiên nên điểm đứt của episode B KHÔNG quan sát được (phiên đóng khi đang ghim — khác đợt 158 chuỗi 3 bị reboot cắt) — episode B vẫn đếm là 1 episode vì 3 chuỗi nối nhau bằng dip nông trên cùng boot, không vì điểm đứt.
- **F-159-T9-8 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ mười ba liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-159-T9-9 — Khoảng trống lấy mẫu 60 giây + gap reboot (cùng lớp F-158-T9-9):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Thêm gap 100 s theo timestamp (~120 s giờ thật) tại reboot #60 (xem F-159-T9-3/4).
- **F-159-T9-10 — Đồng hồ boot mới #60 chỉ kiểm bằng btime /proc/stat + journal/wtmp, KHÔNG kiểm lại Cloudflare/GitHub:** T9 không có số Cloudflare cho boot #60; mô hình đồng hồ (kể cả drift ~+20 s của boot #59) thuộc T2-159/T7-159.

Thống kê: samples: 135 (27 mau boot eec65561 + 108 mau boot e590ae0a); mem min: 499,084 kB (487.4 MiB) luc 03:40:28Z; mem max: 3,216,244 kB (3140.9 MiB = 51.12% guard) luc 02:50:47Z; mem mean: 1112971 kB (1086.9 MiB); count >=1024 MiB (gate A): 63/135; count >= guard 6144 MiB: 0/135; balloon frozen 6,443,824: 30/135 (chuoi 1: 03:36:28Z–03:41:28Z n=6; chuoi 2: 04:23:30Z–04:33:30Z n=11; chuoi 3: 04:38:30Z–04:49:31Z n=12; chuoi 4: 04:54:31Z n=1 (con mo luc dong)); balloon min: 3,627,868 kB luc 02:50:47Z; balloon max: 6,443,824 kB; load1 max (sampler): 6.48 luc 03:08:27Z; load1 >=3.0 samples: 16/135; max inter-sample gap: 100 s (03:05:47Z -> 03:07:27Z, eec65561 -> e590ae0a); gaps >90s: [('2026-11-21T03:05:47Z', '2026-11-21T03:07:27Z', 100, 'eec65561', 'e590ae0a')]

## Phụ lục A — Bảng sampler đầy đủ (135 mau: 27 mau boot eec65561 + 108 mau boot e590ae0a; gap: 03:05:47Z -> 03:07:27Z (100 s, eec65561 -> e590ae0a))

(File gốc: `hidden_files/round159-t9/ram-sampler-FROZEN.log` (argv: /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t9/ram-sampler-FROZEN.log) — bảng dưới đây trích đúng file đó.)

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-21T02:39:46Z | eec65561 | 801,036 | 782.3 | 12.73% | 6,090,064 | 727,312 | 0.93 |
| 2 | 2026-11-21T02:40:46Z | eec65561 | 1,452,296 | 1418.3 | 23.08% | 5,351,016 | 711,540 | 3.76 |
| 3 | 2026-11-21T02:41:46Z | eec65561 | 1,243,732 | 1214.6 | 19.77% | 5,516,256 | 716,056 | 4.75 |
| 4 | 2026-11-21T02:42:46Z | eec65561 | 1,891,264 | 1846.9 | 30.06% | 4,757,156 | 729,992 | 4.00 |
| 5 | 2026-11-21T02:43:46Z | eec65561 | 2,244,324 | 2191.7 | 35.67% | 4,450,580 | 734,244 | 3.80 |
| 6 | 2026-11-21T02:44:46Z | eec65561 | 2,063,500 | 2015.1 | 32.80% | 4,697,956 | 732,772 | 2.23 |
| 7 | 2026-11-21T02:45:47Z | eec65561 | 1,686,640 | 1647.1 | 26.81% | 4,907,428 | 732,860 | 1.44 |
| 8 | 2026-11-21T02:46:47Z | eec65561 | 1,269,500 | 1239.7 | 20.18% | 4,779,796 | 678,264 | 0.70 |
| 9 | 2026-11-21T02:47:47Z | eec65561 | 1,241,116 | 1212.0 | 19.73% | 4,695,232 | 678,700 | 0.42 |
| 10 | 2026-11-21T02:48:47Z | eec65561 | 1,522,336 | 1486.7 | 24.20% | 4,891,792 | 691,856 | 0.31 |
| 11 | 2026-11-21T02:49:47Z | eec65561 | 1,340,144 | 1308.7 | 21.30% | 5,069,660 | 702,640 | 0.48 |
| 12 | 2026-11-21T02:50:47Z | eec65561 | 3,216,244 | 3140.9 | 51.12% | 3,627,868 | 705,276 | 0.58 |
| 13 | 2026-11-21T02:51:47Z | eec65561 | 2,868,544 | 2801.3 | 45.59% | 3,966,884 | 706,908 | 0.51 |
| 14 | 2026-11-21T02:52:47Z | eec65561 | 2,551,248 | 2491.5 | 40.55% | 4,272,180 | 707,992 | 0.18 |
| 15 | 2026-11-21T02:53:47Z | eec65561 | 2,274,484 | 2221.2 | 36.15% | 4,549,968 | 711,872 | 0.11 |
| 16 | 2026-11-21T02:54:47Z | eec65561 | 1,989,960 | 1943.3 | 31.63% | 4,796,540 | 718,148 | 0.23 |
| 17 | 2026-11-21T02:55:47Z | eec65561 | 1,774,604 | 1733.0 | 28.21% | 5,022,200 | 720,272 | 0.59 |
| 18 | 2026-11-21T02:56:47Z | eec65561 | 1,580,420 | 1543.4 | 25.12% | 5,228,380 | 724,468 | 0.33 |
| 19 | 2026-11-21T02:57:47Z | eec65561 | 1,424,176 | 1390.8 | 22.64% | 5,415,816 | 724,628 | 0.20 |
| 20 | 2026-11-21T02:58:47Z | eec65561 | 1,278,196 | 1248.2 | 20.32% | 5,588,016 | 724,564 | 0.98 |
| 21 | 2026-11-21T02:59:47Z | eec65561 | 1,048,412 | 1023.8 | 16.66% | 5,743,072 | 708,544 | 0.81 |
| 22 | 2026-11-21T03:00:47Z | eec65561 | 967,832 | 945.1 | 15.38% | 5,883,292 | 689,376 | 0.71 |
| 23 | 2026-11-21T03:01:47Z | eec65561 | 716,144 | 699.4 | 11.38% | 5,576,560 | 625,536 | 0.50 |
| 24 | 2026-11-21T03:02:47Z | eec65561 | 915,508 | 894.1 | 14.55% | 5,285,232 | 605,172 | 1.06 |
| 25 | 2026-11-21T03:03:47Z | eec65561 | 817,124 | 798.0 | 12.99% | 5,365,656 | 602,896 | 1.36 |
| 26 | 2026-11-21T03:04:47Z | eec65561 | 1,368,820 | 1336.7 | 21.76% | 5,505,656 | 607,524 | 0.85 |
| 27 | 2026-11-21T03:05:47Z | eec65561 | 1,212,340 | 1183.9 | 19.27% | 5,668,592 | 611,768 | 0.74 |
| — | — | — | — | — | — | — | — | — |
| 28 | 2026-11-21T03:07:27Z | e590ae0a | 1,765,408 | 1724.0 | 28.06% | 5,074,260 | 1,030,736 | 5.22 |
| 29 | 2026-11-21T03:08:27Z | e590ae0a | 1,983,528 | 1937.0 | 31.53% | 4,821,088 | 925,576 | 6.48 |
| 30 | 2026-11-21T03:09:27Z | e590ae0a | 1,810,648 | 1768.2 | 28.78% | 5,041,704 | 883,408 | 5.49 |
| 31 | 2026-11-21T03:10:27Z | e590ae0a | 1,695,136 | 1655.4 | 26.94% | 5,247,604 | 864,876 | 4.19 |
| 32 | 2026-11-21T03:11:27Z | e590ae0a | 1,499,788 | 1464.6 | 23.84% | 5,439,668 | 865,512 | 2.26 |
| 33 | 2026-11-21T03:12:27Z | e590ae0a | 1,148,344 | 1121.4 | 18.25% | 5,206,916 | 800,864 | 1.69 |
| 34 | 2026-11-21T03:13:27Z | e590ae0a | 1,874,936 | 1831.0 | 29.80% | 5,112,424 | 735,724 | 1.91 |
| 35 | 2026-11-21T03:14:27Z | e590ae0a | 1,195,060 | 1167.1 | 18.99% | 5,118,940 | 713,708 | 3.43 |
| 36 | 2026-11-21T03:15:27Z | e590ae0a | 1,059,276 | 1034.4 | 16.84% | 5,265,172 | 708,824 | 4.61 |
| 37 | 2026-11-21T03:16:28Z | e590ae0a | 1,471,092 | 1436.6 | 23.38% | 5,418,092 | 706,184 | 3.12 |
| 38 | 2026-11-21T03:17:28Z | e590ae0a | 789,988 | 771.5 | 12.56% | 5,525,300 | 691,092 | 4.04 |
| 39 | 2026-11-21T03:18:28Z | e590ae0a | 731,988 | 714.8 | 11.63% | 5,633,272 | 684,964 | 3.95 |
| 40 | 2026-11-21T03:19:28Z | e590ae0a | 729,644 | 712.5 | 11.60% | 5,733,968 | 683,984 | 2.23 |
| 41 | 2026-11-21T03:20:28Z | e590ae0a | 1,136,332 | 1109.7 | 18.06% | 5,837,400 | 681,856 | 3.10 |
| 42 | 2026-11-21T03:21:28Z | e590ae0a | 851,972 | 832.0 | 13.54% | 5,361,496 | 645,916 | 2.55 |
| 43 | 2026-11-21T03:22:28Z | e590ae0a | 1,169,140 | 1141.7 | 18.58% | 5,073,148 | 648,436 | 3.16 |
| 44 | 2026-11-21T03:23:28Z | e590ae0a | 944,192 | 922.1 | 15.01% | 5,223,452 | 652,004 | 3.75 |
| 45 | 2026-11-21T03:24:28Z | e590ae0a | 1,592,432 | 1555.1 | 25.31% | 5,385,168 | 652,356 | 2.05 |
| 46 | 2026-11-21T03:25:28Z | e590ae0a | 817,284 | 798.1 | 12.99% | 5,362,768 | 647,084 | 2.59 |
| 47 | 2026-11-21T03:26:28Z | e590ae0a | 601,200 | 587.1 | 9.56% | 5,475,604 | 646,604 | 2.18 |
| 48 | 2026-11-21T03:27:28Z | e590ae0a | 677,536 | 661.7 | 10.77% | 5,605,968 | 653,216 | 0.99 |
| 49 | 2026-11-21T03:28:28Z | e590ae0a | 1,448,520 | 1414.6 | 23.02% | 5,530,104 | 646,720 | 0.76 |
| 50 | 2026-11-21T03:29:28Z | e590ae0a | 1,346,004 | 1314.5 | 21.39% | 5,643,436 | 652,312 | 1.62 |
| 51 | 2026-11-21T03:30:28Z | e590ae0a | 1,174,196 | 1146.7 | 18.66% | 5,800,224 | 652,776 | 0.86 |
| 52 | 2026-11-21T03:31:28Z | e590ae0a | 1,042,664 | 1018.2 | 16.57% | 5,943,024 | 652,192 | 0.42 |
| 53 | 2026-11-21T03:32:28Z | e590ae0a | 911,792 | 890.4 | 14.49% | 6,073,872 | 651,452 | 0.41 |
| 54 | 2026-11-21T03:33:28Z | e590ae0a | 800,584 | 781.8 | 12.72% | 6,191,592 | 651,704 | 0.30 |
| 55 | 2026-11-21T03:34:28Z | e590ae0a | 698,480 | 682.1 | 11.10% | 6,299,716 | 652,420 | 0.33 |
| 56 | 2026-11-21T03:35:28Z | e590ae0a | 569,976 | 556.6 | 9.06% | 6,381,112 | 656,332 | 0.12 |
| 57 | 2026-11-21T03:36:28Z | e590ae0a | 530,916 | 518.5 | 8.44% | 6,443,824 | 660,156 | 0.25 |
| 58 | 2026-11-21T03:37:28Z | e590ae0a | 538,568 | 525.9 | 8.56% | 6,443,824 | 664,916 | 0.13 |
| 59 | 2026-11-21T03:38:28Z | e590ae0a | 528,164 | 515.8 | 8.39% | 6,443,824 | 663,312 | 0.57 |
| 60 | 2026-11-21T03:39:28Z | e590ae0a | 531,496 | 519.0 | 8.45% | 6,443,824 | 660,384 | 0.27 |
| 61 | 2026-11-21T03:40:28Z | e590ae0a | 499,084 | 487.4 | 7.93% | 6,443,824 | 662,624 | 0.44 |
| 62 | 2026-11-21T03:41:28Z | e590ae0a | 508,604 | 496.7 | 8.08% | 6,443,824 | 661,680 | 0.30 |
| 63 | 2026-11-21T03:42:28Z | e590ae0a | 896,836 | 875.8 | 14.25% | 6,050,608 | 664,460 | 0.93 |
| 64 | 2026-11-21T03:43:28Z | e590ae0a | 1,228,316 | 1199.5 | 19.52% | 5,740,408 | 669,504 | 1.60 |
| 65 | 2026-11-21T03:44:29Z | e590ae0a | 1,261,444 | 1231.9 | 20.05% | 5,649,996 | 670,200 | 1.02 |
| 66 | 2026-11-21T03:45:29Z | e590ae0a | 1,704,152 | 1664.2 | 27.09% | 4,990,224 | 667,320 | 1.58 |
| 67 | 2026-11-21T03:46:29Z | e590ae0a | 1,702,528 | 1662.6 | 27.06% | 5,201,700 | 672,168 | 0.65 |
| 68 | 2026-11-21T03:47:29Z | e590ae0a | 1,515,444 | 1479.9 | 24.09% | 5,377,968 | 670,092 | 0.52 |
| 69 | 2026-11-21T03:48:29Z | e590ae0a | 1,363,220 | 1331.3 | 21.67% | 5,555,068 | 669,484 | 0.19 |
| 70 | 2026-11-21T03:49:29Z | e590ae0a | 1,196,820 | 1168.8 | 19.02% | 5,710,864 | 666,916 | 0.07 |
| 71 | 2026-11-21T03:50:29Z | e590ae0a | 1,044,536 | 1020.1 | 16.60% | 5,855,328 | 665,936 | 0.07 |
| 72 | 2026-11-21T03:51:29Z | e590ae0a | 915,332 | 893.9 | 14.55% | 5,985,128 | 670,056 | 0.25 |
| 73 | 2026-11-21T03:52:29Z | e590ae0a | 1,082,160 | 1056.8 | 17.20% | 5,876,272 | 662,608 | 0.67 |
| 74 | 2026-11-21T03:53:29Z | e590ae0a | 1,587,112 | 1549.9 | 25.23% | 5,310,036 | 645,384 | 1.29 |
| 75 | 2026-11-21T03:54:29Z | e590ae0a | 1,739,684 | 1698.9 | 27.65% | 5,176,260 | 632,584 | 0.82 |
| 76 | 2026-11-21T03:55:29Z | e590ae0a | 1,560,752 | 1524.2 | 24.81% | 5,371,368 | 633,616 | 0.88 |
| 77 | 2026-11-21T03:56:29Z | e590ae0a | 1,601,780 | 1564.2 | 25.46% | 5,351,500 | 620,472 | 1.19 |
| 78 | 2026-11-21T03:57:29Z | e590ae0a | 1,749,812 | 1708.8 | 27.81% | 5,217,576 | 623,056 | 1.53 |
| 79 | 2026-11-21T03:58:29Z | e590ae0a | 2,014,068 | 1966.9 | 32.01% | 4,901,756 | 623,800 | 0.76 |
| 80 | 2026-11-21T03:59:29Z | e590ae0a | 1,967,800 | 1921.7 | 31.28% | 4,916,460 | 624,556 | 1.17 |
| 81 | 2026-11-21T04:00:29Z | e590ae0a | 1,832,032 | 1789.1 | 29.12% | 5,062,316 | 630,632 | 0.82 |
| 82 | 2026-11-21T04:01:29Z | e590ae0a | 1,821,052 | 1778.4 | 28.94% | 5,065,492 | 628,156 | 1.50 |
| 83 | 2026-11-21T04:02:29Z | e590ae0a | 1,947,816 | 1902.2 | 30.96% | 4,945,528 | 628,972 | 0.74 |
| 84 | 2026-11-21T04:03:29Z | e590ae0a | 1,764,244 | 1722.9 | 28.04% | 5,159,284 | 629,064 | 0.48 |
| 85 | 2026-11-21T04:04:29Z | e590ae0a | 1,541,624 | 1505.5 | 24.50% | 5,354,472 | 630,716 | 0.35 |
| 86 | 2026-11-21T04:05:29Z | e590ae0a | 1,398,584 | 1365.8 | 22.23% | 5,531,192 | 632,792 | 0.26 |
| 87 | 2026-11-21T04:06:29Z | e590ae0a | 1,207,400 | 1179.1 | 19.19% | 5,693,544 | 634,136 | 0.23 |
| 88 | 2026-11-21T04:07:29Z | e590ae0a | 1,138,392 | 1111.7 | 18.09% | 5,839,844 | 758,980 | 0.15 |
| 89 | 2026-11-21T04:08:29Z | e590ae0a | 906,192 | 885.0 | 14.40% | 5,973,788 | 758,820 | 0.24 |
| 90 | 2026-11-21T04:09:29Z | e590ae0a | 1,284,160 | 1254.1 | 20.41% | 5,664,920 | 764,664 | 0.28 |
| 91 | 2026-11-21T04:10:29Z | e590ae0a | 1,096,868 | 1071.2 | 17.43% | 5,815,856 | 769,164 | 0.10 |
| 92 | 2026-11-21T04:11:29Z | e590ae0a | 964,120 | 941.5 | 15.32% | 5,952,716 | 769,260 | 0.20 |
| 93 | 2026-11-21T04:12:29Z | e590ae0a | 881,052 | 860.4 | 14.00% | 6,077,668 | 766,232 | 0.13 |
| 94 | 2026-11-21T04:13:29Z | e590ae0a | 747,576 | 730.1 | 11.88% | 6,193,492 | 758,256 | 0.10 |
| 95 | 2026-11-21T04:14:30Z | e590ae0a | 677,296 | 661.4 | 10.77% | 6,299,704 | 721,016 | 0.20 |
| 96 | 2026-11-21T04:15:30Z | e590ae0a | 690,680 | 674.5 | 10.98% | 6,299,588 | 709,644 | 0.30 |
| 97 | 2026-11-21T04:16:30Z | e590ae0a | 611,008 | 596.7 | 9.71% | 6,395,280 | 707,640 | 0.11 |
| 98 | 2026-11-21T04:17:30Z | e590ae0a | 656,280 | 640.9 | 10.43% | 6,229,184 | 682,464 | 0.53 |
| 99 | 2026-11-21T04:18:30Z | e590ae0a | 1,100,512 | 1074.7 | 17.49% | 5,919,208 | 676,248 | 0.74 |
| 100 | 2026-11-21T04:19:30Z | e590ae0a | 961,848 | 939.3 | 15.29% | 6,052,584 | 672,396 | 0.40 |
| 101 | 2026-11-21T04:20:30Z | e590ae0a | 838,404 | 818.8 | 13.33% | 6,173,036 | 663,672 | 0.20 |
| 102 | 2026-11-21T04:21:30Z | e590ae0a | 735,980 | 718.7 | 11.70% | 6,283,996 | 664,628 | 0.30 |
| 103 | 2026-11-21T04:22:30Z | e590ae0a | 624,760 | 610.1 | 9.93% | 6,384,216 | 662,648 | 0.16 |
| 104 | 2026-11-21T04:23:30Z | e590ae0a | 581,144 | 567.5 | 9.24% | 6,443,824 | 661,004 | 0.06 |
| 105 | 2026-11-21T04:24:30Z | e590ae0a | 568,156 | 554.8 | 9.03% | 6,443,824 | 662,036 | 0.08 |
| 106 | 2026-11-21T04:25:30Z | e590ae0a | 512,064 | 500.1 | 8.14% | 6,443,824 | 662,676 | 0.07 |
| 107 | 2026-11-21T04:26:30Z | e590ae0a | 551,412 | 538.5 | 8.76% | 6,443,824 | 662,688 | 0.12 |
| 108 | 2026-11-21T04:27:30Z | e590ae0a | 567,332 | 554.0 | 9.02% | 6,443,824 | 662,088 | 0.17 |
| 109 | 2026-11-21T04:28:30Z | e590ae0a | 562,592 | 549.4 | 8.94% | 6,443,824 | 661,856 | 0.09 |
| 110 | 2026-11-21T04:29:30Z | e590ae0a | 547,332 | 534.5 | 8.70% | 6,443,824 | 664,860 | 0.03 |
| 111 | 2026-11-21T04:30:30Z | e590ae0a | 513,048 | 501.0 | 8.15% | 6,443,824 | 668,276 | 0.04 |
| 112 | 2026-11-21T04:31:30Z | e590ae0a | 521,276 | 509.1 | 8.29% | 6,443,824 | 668,220 | 0.31 |
| 113 | 2026-11-21T04:32:30Z | e590ae0a | 563,240 | 550.0 | 8.95% | 6,443,824 | 667,752 | 0.43 |
| 114 | 2026-11-21T04:33:30Z | e590ae0a | 552,536 | 539.6 | 8.78% | 6,443,824 | 659,728 | 1.01 |
| 115 | 2026-11-21T04:34:30Z | e590ae0a | 884,536 | 863.8 | 14.06% | 6,092,312 | 652,520 | 1.16 |
| 116 | 2026-11-21T04:35:30Z | e590ae0a | 759,096 | 741.3 | 12.07% | 6,204,920 | 654,088 | 0.83 |
| 117 | 2026-11-21T04:36:30Z | e590ae0a | 700,120 | 683.7 | 11.13% | 6,311,032 | 654,376 | 0.49 |
| 118 | 2026-11-21T04:37:30Z | e590ae0a | 610,428 | 596.1 | 9.70% | 6,406,536 | 649,096 | 0.51 |
| 119 | 2026-11-21T04:38:30Z | e590ae0a | 537,076 | 524.5 | 8.54% | 6,443,824 | 647,484 | 0.50 |
| 120 | 2026-11-21T04:39:30Z | e590ae0a | 565,424 | 552.2 | 8.99% | 6,443,824 | 646,880 | 0.31 |
| 121 | 2026-11-21T04:40:30Z | e590ae0a | 550,484 | 537.6 | 8.75% | 6,443,824 | 649,656 | 0.31 |
| 122 | 2026-11-21T04:41:30Z | e590ae0a | 552,960 | 540.0 | 8.79% | 6,443,824 | 648,952 | 0.15 |
| 123 | 2026-11-21T04:42:30Z | e590ae0a | 568,584 | 555.3 | 9.04% | 6,443,824 | 654,504 | 0.28 |
| 124 | 2026-11-21T04:43:31Z | e590ae0a | 534,484 | 522.0 | 8.50% | 6,443,824 | 654,640 | 0.37 |
| 125 | 2026-11-21T04:44:31Z | e590ae0a | 535,724 | 523.2 | 8.52% | 6,443,824 | 654,704 | 0.26 |
| 126 | 2026-11-21T04:45:31Z | e590ae0a | 541,384 | 528.7 | 8.61% | 6,443,824 | 654,740 | 0.22 |
| 127 | 2026-11-21T04:46:31Z | e590ae0a | 549,948 | 537.1 | 8.74% | 6,443,824 | 655,540 | 0.64 |
| 128 | 2026-11-21T04:47:31Z | e590ae0a | 554,628 | 541.6 | 8.82% | 6,443,824 | 660,120 | 0.40 |
| 129 | 2026-11-21T04:48:31Z | e590ae0a | 536,456 | 523.9 | 8.53% | 6,443,824 | 660,280 | 0.21 |
| 130 | 2026-11-21T04:49:31Z | e590ae0a | 553,124 | 540.2 | 8.79% | 6,443,824 | 659,168 | 0.36 |
| 131 | 2026-11-21T04:50:31Z | e590ae0a | 910,572 | 889.2 | 14.47% | 6,086,004 | 644,860 | 1.37 |
| 132 | 2026-11-21T04:51:31Z | e590ae0a | 833,724 | 814.2 | 13.25% | 6,165,384 | 645,616 | 0.63 |
| 133 | 2026-11-21T04:52:31Z | e590ae0a | 737,664 | 720.4 | 11.72% | 6,276,644 | 635,380 | 0.39 |
| 134 | 2026-11-21T04:53:31Z | e590ae0a | 624,776 | 610.1 | 9.93% | 6,377,216 | 635,676 | 0.21 |
| 135 | 2026-11-21T04:54:31Z | e590ae0a | 576,208 | 562.7 | 9.16% | 6,443,824 | 636,232 | 0.14 |
