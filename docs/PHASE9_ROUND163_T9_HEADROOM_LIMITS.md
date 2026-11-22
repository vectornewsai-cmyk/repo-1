# LIMITS — Phase 9 đợt 163, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ mười bảy liên tiếp; headroom 2 lúc đóng, dưới ngưỡng lần thứ 23 liên tiếp; CỬA SỔ THOÁNG SAU REBOOT ĐƯỢC QUAN SÁT LẦN ĐẦU KỂ TỪ ĐỢT 159; balloon 2 EPISODE MỚI E-163 + E-164; ENOSPC ≥56 dòng trên boot #65 + 2 dòng trên boot #66; reboot #66 GIỮA PHIÊN)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 2 lúc đóng (5 lần đo cuối đều 2), dưới ngưỡng < ~1.800 lần thứ hai mươi ba liên tiếp** — giá trị ổn định đợt này là **2** (khác đợt 162: 0). Trần thay đổi theo boot: **63.756 trên #65, 63.747 trên #66** (đợt 162: 63.747 trên #64). Quyết (k) đợt 162 "GIỮ quyết (k) chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT ĐƯỢC QUAN SÁT — LẦN ĐẦU KỂ TỪ ĐỢT 159:** trên boot mới #66 (btime 16:06:45Z), headroom **30.001 (chạm CAP 30.000) cả hai probe lúc 16:07:56Z (boot+71 s)** — bảng watch trống hẳn; tới **16:08:35Z (boot+110 s) đã về 0** (ENOSPC đầu tiên trên boot mới xuất hiện đúng lúc đó). **Cửa sổ chỉ mở trong khoảng boot+71 s → boot+110 s (< 40 s)** — hẹp hơn đợt 159 (còn 23.503 ở boot+~95 s, về 0 lúc boot+148 s): lần này đi thẳng từ ≥30.001 về 0, không có giá trị trung gian. Xem §1.2, F-163-T9-1.
- **Balloon 2 EPISODE MỚI, 49/133 mẫu (36,8%), 2 boot:** **E-163** trên #65 — 15 mẫu, 2 chuỗi [1, 14], dip 4 mẫu thấp nhất **94,5%**, gate A đóng suốt dip → **1 episode** theo tiêu chí cứng đứng (quyết (j) đợt 162); **đứt ĐÃ quan sát được** lúc 15:40:26Z (balloon xả về 82,7%). **E-164** trên #66 — **34 mẫu, MỘT chuỗi duy nhất 16:19:20–16:52:21Z, CÒN MỞ lúc đóng** (không dip). **E-162 đợt 162 đứt KHÔNG quan sát được** (khoảng trống 43m37s có chứa reboot #65). Xem §2.2.
- **RAM:** sampler **133 mẫu, 14:39:23Z–16:52:21Z, HAI boot (#65: 88 mẫu; #66: 45 mẫu)**. Max **3.623.788 kB (3.545,7 MiB = 57,60% guard) lúc 14:58:25Z** trên #65; min **365.952 kB lúc 15:31:26Z** (trong E-163); mean toàn phiên 1.078.429 kB. Gate A **47/133 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ mười bảy liên tiếp.** Xem §2, §3.
- **B2: 18 spike, 17 QUY ĐƯỢC DRIVER CỤ THỂ + 1 load1 dư.** Bão mở đợt #65: 12 spike (14:41:12–14:50:41Z — T1 suite + T2 điều tra mù #95? + hatch daemon); O8: 2 spike **TRONG cửa sổ O8** (15:41:18Z WebKit MiniBrowser delta 63 + 15:41:54Z Chromium renderer delta 48 — cả hai đều do chính process O8 gây); harness: 1 spike (15:51:29Z, chrome gpu-process delta 83); bão sau reboot #66: 3 spike (16:08:20–16:09:31Z — apt-get/dpkg replay T5 + hatch daemon). **0 spike trong cửa sổ ghim E-163, 0 spike trong cửa sổ ghim E-164, 0 spike trong cửa sổ attempt T4.** Delta tick lớn nhất 136 tick/s (ffmpeg testsrc2). Xem §2.5.
- **Lượt yên WebKit #32 (T4): CÓ LƯỢT HỢP LỆ #28 — chuỗi lượt yên hợp lệ NỐI DÀI (#22 → … → #27 → #28).** Attempt1 (14:54:04–14:58:15Z) TRƯỢT vì tickCost median 62,0 ms > 60; attempt2 (14:59:01–15:03:10Z) ĐẠT (20/20, lớp B 5/5, tickCost median 53,0 ms ≤ 60). Sampler T9 đối chiếu: attempt2 gate A MỞ 4/4, 0 mẫu <512.000 kB, 0 spike B2 trong cửa sổ; attempt1 gate A 3/4 (1 mẫu 971.376 kB, thấp hơn gate 77.200 kB — xem F-163-T9-10). Xem §2.3.
- **REBOOT #66 GIỮA PHIÊN (edb2acdb, btime 16:06:45Z; gap #65→#66 = 5.508 s):** sampler + watcher + probe-loop **CHẾT theo reboot** (điểm yếu (d) đợt 148 tái diễn lần đầu kể từ đợt 160); khoảng trống phủ sóng duy nhất >90 s: **113 s** (16:06:27Z → 16:08:20Z); T9 khởi động lại cả ba lúc 16:08:20Z (boot+95 s). T7-163: reboot #66 **viết lại run 163 lần 1, requeue 16:07:30.460Z = btime +45,460 s — TRONG dải 33–49,8 s → ỨNG VIÊN DƯƠNG (m)** (chờ parent quyết; đối chiếu độc lập thuộc T2-164). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: ≥56 dòng trên boot #65 (đếm tới 15:40:13Z; phần còn lại 15:40:13Z → reboot #66 KHÔNG đếm được — journal mất theo reboot) + 2 dòng trên boot #66 (16:08:35Z + 16:09:36Z, không tăng thêm tới lúc đóng). Tổng đếm được trong phiên: 58 dòng (cận dưới). Đợt thứ mười hai liên tiếp bảng watch cạn gây lỗi thật thấy được.** Xem §4.
- **T8-163 (đối chiếu):** O8 PASS 3/3 (WebKit 21/21 ×2 + Chromium 21/21, 15:39:27–15:42:34Z, boot #65, gate FOUND poll 54 lúc 15:34:48Z); harness 6/6, 0 kẹt (86n2 P5-entry PASS — điểm kẹt đợt 162 không tái diễn). Chuỗi WebKit FULL PASS 17 → ? chờ T10/parent phán. **Caveat T8 (F-163-T8-2): O8 WebKit đợt này chạy bằng lib DEBROOT, KHÔNG phải system libs** — nhãn "system libs" trong quyết (g) đợt 162 không khớp bằng chứng script. Xem §5.3.
- **T7-163 (đối chiếu):** run 162 SUCCEEDED 14:18:06Z, margin 1.065 s; run 163 vẫn running lúc đóng — kết cục thuộc T7-164. Xem §5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round163-t9/k8-headroom.py` (copy y nguyên từ đợt 162 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 163 (15 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 14:40:24Z 21/11 | **0** | #65 1c1cf10c (btime 14:34:57Z) | 63.756 | lần đo 1, lúc mở (boot+5m27s); RAM 1.461.180 kB, balloon 5.327.008 kB, load1 2,25 (bão mở đợt) |
| 14:40:24Z 21/11 | **0** | #65 1c1cf10c | 63.756 | lần đo 2 (chênh **0** so với lần 1) |
| 15:10:12Z 21/11 | **0** | #65 1c1cf10c | 63.756 | lần đo 3 (probe-loop lan-2); balloon 5.148.140 kB, RAM 1.679.468 kB |
| 15:10:12Z 21/11 | **0** | #65 1c1cf10c | 63.756 | lần đo 4 (chênh **0**) |
| 15:40:13Z 21/11 | **0** | #65 1c1cf10c | 63.756 | lần đo 5 (probe-loop lan-3); balloon ĐANG GHIM TRẦN (E-163), RAM 830.284 kB |
| 15:40:13Z 21/11 | **0** | #65 1c1cf10c | 63.756 | lần đo 6 (chênh **0**) |
| 16:07:56Z 21/11 | **30.001** | #66 edb2acdb (btime 16:06:45Z) | 63.747 | lần đo 7, cặp cửa sổ (boot+71s); **chạm CAP 30.000 — không gặp ENOSPC**; RAM 1.856.520 kB, balloon 5.085.996 kB |
| 16:07:56Z 21/11 | **30.001** | #66 edb2acdb | 63.747 | lần đo 8, cặp cửa sổ (boot+~75s); **chạm CAP 30.000** |
| 16:08:35Z 21/11 | **0** | #66 edb2acdb | 63.747 | lần đo 9, window-map-1 (boot+110s); **cửa sổ ĐÃ ĐÓNG**; ENOSPC đầu tiên trên boot mới xuất hiện đúng lúc này |
| 16:10:05Z 21/11 | **0** | #66 edb2acdb | 63.747 | lần đo 10, window-map-2 (boot+201s) |
| 16:11:36Z 21/11 | **2** | #66 edb2acdb | 63.747 | lần đo 11, window-map-3 (boot+291s) |
| 16:38:20Z 21/11 | **2** | #66 edb2acdb | 63.747 | lần đo 12 (probe-loop lan-2 sau khởi động lại); balloon ĐANG GHIM TRẦN (E-164), RAM 597.860 kB |
| 16:38:20Z 21/11 | **2** | #66 edb2acdb | 63.747 | lần đo 13 (chênh **0**) |
| 16:52:45Z 21/11 | **2** | #66 edb2acdb | 63.747 | lần đo 14 (đóng phiên, boot+46m); balloon ĐANG GHIM TRẦN (E-164), RAM 519.920 kB |
| 16:52:45Z 21/11 | **2** | #66 edb2acdb | 63.747 | lần đo 15 (chênh **0**) |

- Probe dừng ở `i=0` trong 8/15 lần đo; dừng ở `i=2` trong 5 lần đo (16:11:36Z → 16:52:45Z — giá trị 2 ổn định trên #66 từ boot+291s tới đóng); chạm CAP 30.000 trong 2 lần đo (cặp cửa sổ 16:07:56Z — đúng cơ chế dừng của probe, không phải sự cố; stderr `CAP 30000 reached without ENOSPC`). File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi cặp đo / mỗi lần map).
- **Cửa sổ thoáng sau reboot (boot #66): MỞ lúc boot+71s (≥30.001), ĐÓNG trước boot+110s (0).** Khoảng mở < 40 s — hẹp hơn đợt 159 (còn 23.503 ở boot+~95 s, 18.447 rồi về 0 lúc boot+148 s): lần này đi thẳng từ ≥30.001 về 0, không có giá trị trung gian. Giá trị đỉnh thật của cửa sổ không biết được (probe cap 30.000 — chỉ biết ≥30.001; xem F-163-T9-1). ENOSPC đầu tiên trên #66 (16:08:35Z, boot+110s) trùng đúng mốc cửa sổ đóng.
- **So sánh với đợt 162:** đợt 162 mở 0 → thoáng 2 một lần (probe thứ hai cặp mở) → 0 suốt trên MỘT boot, không reboot giữa phiên; đợt này mở 0 trên #65 (6 lần đo đều 0) → reboot #66 giữa phiên → thoáng ≥30.001 trong <40 s → 0 (2 lần) → **2 ổn định 5 lần đo tới đóng**. **Cửa sổ thoáng sau reboot ĐƯỢC quan sát lần đầu kể từ đợt 159** (đợt 160/161/162 đều KHÔNG quan sát được — T9 mở muộn hơn boot+20 phút trở lên; đợt này reboot xảy ra GIỮA phiên nên T9 có mặt đúng lúc, đo được ở boot+71s).
- Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 2 = **63.745 watch** (bảng gần đầy hẳn, còn 2 slot trống) trên #66.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **2 / 1.578 ≈ 0,0013** — một vite mới (~1.578 watch) vẫn không khởi động được (cần thêm ~1.576 slot).
- T5-163 KHÔNG probe lại headroom đợt này (như đợt 151–162) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 15 lần đo + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #65 có ≥56 dòng + journal boot #66 có 2 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- **Trần thay đổi theo boot: 63.756 trên #65, 63.747 trên #66** (đợt 162: 63.747 trên #64; đợt 160–162: 63.747 theo T6-163; T6-163 cũng ghi 63.756 trên #65). T9 chỉ ghi số đo, không phán cơ chế đổi trần.
- Lưu ý: RAM lúc đóng (~519.920 kB, balloon đang ghim E-164) thấp hơn nhiều RAM lúc mở (~1.461.180 kB) trong khi headroom 0 → 2. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–162 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 162 | 0 → 0 (thoáng 2 một lần) | mở 11:37:48Z boot #64 d9a8d1ce btime 11:15:18Z: 0, 2 (cặp mở) → 0 ×10 (12:08:03–13:55:56Z) → đóng 13:55:56Z cùng boot #64: 0, 0 (KHÔNG reboot giữa phiên; 12 lần đo, 11 lần 0, 1 lần 2 thoáng qua) |
| **163** | **0 → 30.001 (thoáng, boot+71s) → 2** | **mở 14:40:24Z boot #65 1c1cf10c btime 14:34:57Z (trần 63.756): 0 ×6 (14:40:24–15:40:13Z) → sau reboot #66 16:06:45Z boot MỚI edb2acdb (trần 63.747): 30.001, 30.001 lúc boot+71s → 0, 0 lúc boot+110s/201s → 2 ×5 (16:11:36–16:52:45Z) → đóng 16:52:45Z cùng boot #66: 2, 2 (MỘT reboot giữa phiên; 15 lần đo, 8 lần 0, 2 lần 30.001, 5 lần 2)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 2** (lần đầu đóng 2 kể từ đợt 161; xen giữa đợt 162 đóng 0). Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**. Giá trị 30.001 chỉ xuất hiện trong cặp cửa sổ boot+71s trên #66, không phải giá trị ổn định (cửa sổ đóng trước boot+110s).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, thấp hơn ngưỡng 1.800, lần thứ hai mươi ba liên tiếp** (tính theo giá trị ổn định lúc đóng). Quyết parent đợt 162 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal hai boot đợt này có ≥56 + 2 = 58 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ mười hai liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: ≥58 dòng đếm được — cận dưới, phần còn lại boot #65 mất theo reboot #66). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong từng boot** (63.756 trên #65 suốt 6 lần đo; 63.747 trên #66 suốt 9 lần đo) nhưng **khác nhau giữa hai boot** (63.756 vs 63.747 — chênh 9). T9 ghi đúng số đo từng boot, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.125.908 kB trên #65 / 8.125.900 kB trên #66 — xem ghi chú; swap 1.048.572 kB) — sampler 133 mẫu, 14:39:23Z–16:52:21Z, HAI boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.125.908 kB ở mẫu đầu #65 và 8.125.900 kB ở #66 (chênh 8 kB giữa hai boot — T9 ghi đúng số đọc được, không phán; mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên (bão mở đợt) → balloon leo đều → ghim trần E-163 (15 mẫu) → xả, đứt đã quan sát → leo lại → REBOOT #66 cắt ngang → cửa sổ thoáng headroom → balloon leo lại → ghim trần E-164 (34 mẫu) → còn mở lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất 113 s (1 gap duy nhất >90 s — khoảng trống reboot #66, 16:06:27Z → 16:08:20Z); các gap còn lại ≤61 s** — xem §5.1). **133 mẫu, 14:39:23Z–16:52:21Z, HAI boot (#65: 88 mẫu; #66: 45 mẫu).** Tổng quan: **min 365.952 kB (357,4 MiB) lúc 15:31:26Z** (trong E-163, balloon 6.443.824 kB); **max 3.623.788 kB (3.538,9 MiB) lúc 14:58:25Z — 57,60% guard** (balloon xả 3.131.844 kB); **mean toàn phiên 1.078.429 kB (1.053,2 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 14:39:23–14:50:25Z | #65 | 910.200–3.141.408 kB | Mở phiên: BÃO MỞ ĐỢT (12 spike B2 liên tục, load1 tới 8,15 — xem §2.5); balloon xả 5.357.616 → 3.131.844 kB rồi leo lại; gate A MỞ 10/12 mẫu; load1 ≥3,0 ở 9/12 mẫu |
| 14:51:25–15:20:26Z | #65 | 455.292–3.623.788 kB | Yên sau bão: RAM đỉnh phiên 14:58:25Z (3.623.788 kB, balloon xả 3.131.844 kB); T4 attempt1 (14:54:04–14:58:15Z, TRƯỢT tickCost 62,0 ms) + attempt2 (14:59:01–15:03:10Z, HỢP LỆ #28 — xem §2.3); balloon leo đều 3,1M → 6,4M kB (chạm 6.395.788 kB = 99,3% trần lúc 15:20:26Z); gate A MỞ 24/30 mẫu |
| 15:21:26–15:40:26Z | #65 | 365.952–805.996 kB | **Ghim trần E-163, 15 mẫu trong 2 chuỗi + 1 dip** (xem §2.2); **RAM min trong cửa sổ ghim 365.952 kB**; gate A ĐÓNG cả 20 mẫu cửa sổ (kể cả 4 mẫu dip + mẫu đứt); load1 ≤0,60; **RAM <512.000 kB: 18 mẫu trong cửa sổ này (15 trong ghim + 3 ngoài ghim — xem §2.1 cuối)** |
| 15:41:26–16:06:27Z | #65 | 454.984–2.643.360 kB | Sau E-163: balloon xả về 4.893.084 kB rồi leo lại đều 4,9M → 6.332.968 kB (98,3% trần lúc 16:06:27Z — đang leo tới lần ghim thứ hai thì **reboot #66 cắt ngang**); O8 (15:39:27–15:42:34Z — 2 spike B2 trong cửa sổ, xem §2.5); harness 6/6 (15:42:43–15:58:58Z — 1 spike B2 15:51:29Z); gate A MỞ 6/26 mẫu; load1 ≤3,56 (mẫu 15:41:26Z) |
| 16:08:20–16:18:20Z | #66 | 668.540–1.959.248 kB | Boot mới: bão sau reboot (3 spike B2 16:08:20–16:09:31Z — apt-get/dpkg replay T5 + hatch daemon, xem §2.5); balloon leo đều 4.823.852 → 6.381.372 kB (99,0% trần); gate A MỞ 7/11 mẫu; RAM max boot #66 1.959.248 kB lúc 16:08:20Z (31,14% guard) |
| 16:19:20–16:52:21Z | #66 | 545.020–603.284 kB | **Ghim trần E-164, 34 mẫu MỘT chuỗi, CÒN MỞ lúc đóng** (xem §2.2); **RAM min trong cửa sổ ghim 545.020 kB**; gate A ĐÓNG cả 34 mẫu; load1 ≤0,37; **RAM <512.000 kB: 0 mẫu trong cửa sổ này** |

- **Gate A ≥1024 MiB: 47/133 mẫu** (#65: 40/88; #66: 7/45); **0 mẫu ≥ guard**; load1 max (sampler) **8,15 lúc 14:44:24Z** (bão mở đợt — watcher bắt 7,42 lúc 14:44:08Z, xem F-163-T9-9); **12/133 mẫu load1 ≥3,0** (9 mẫu bão mở đợt 14:39:23–14:50:25Z + 1 mẫu 15:41:26Z 3,56 + 2 mẫu sau reboot 16:08:20Z 5,02 / 16:09:20Z 3,94). **RAM <512.000 kB: 18 mẫu** (15 trong ghim E-163 + 3 ngoài ghim: 15:20:26Z 455.292 kB lúc balloon 99,3% trần — ngay trước lần chạm đầu E-163; 15:25:26Z 484.504 kB trong dip E-163 lúc balloon 99,1% trần; 15:54:27Z 454.984 kB lúc balloon 86,0% trần trong lúc harness chạy); **RAM <300.000 kB: 0 mẫu** (đợt 162: 0 mẫu; đợt 161: 0 mẫu; đợt 158: 4 mẫu).
- Swap: SwapFree 828.692 kB (mẫu đầu) → 616.096 kB (thấp nhất phiên, lúc 15:08:25Z trên #65) → 775.932 kB (mẫu cuối). Không có nhịp nhảy SwapFree sau reboot trong phiên này (sampler chết theo reboot #66 rồi khởi động lại — xem §5.1).
- Mẫu 14:58:25Z (đỉnh phiên): RAM 3.623.788 kB, balloon xả 3.131.844 kB — balloon xả sâu nhất phiên ~4 phút sau bão mở đợt (cùng mẫu đợt 152–162: xả sâu sau attempt / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 365.952 kB (đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — 18 mẫu <512.000 kB trong 133 mẫu (13,5% — thấp hơn hẳn đợt 162: 67 mẫu, 48,2%, vì đợt này ghim ít hơn: 49 mẫu so với 66 mẫu); riêng trong cửa sổ ghim E-163: 15/15 mẫu <512.000 kB (100%); trong cửa sổ ghim E-164: 0/34 mẫu <512.000 kB (RAM trong E-164 cao hơn E-163: 545.020–603.284 kB so với 365.952–510.464 kB). T8-163 đo độc lập RAM trong lúc O8/harness: xem §5.3 (sampler T9 là nguồn duy nhất cho trũng ghim).

### 2.2 Balloon virtio — 2 EPISODE MỚI, 49/133 mẫu, 3 chuỗi, HAI boot (#65 + #66)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #65 (1c1cf10c): GHIM TRẦN 15/88 mẫu (17,0%), trong 2 chuỗi — 1 EPISODE (E-163):**
  - Leo lên trần từ 15:03:25Z (balloon xả sâu 3.241.032 kB) → 6.395.788 kB (99,3% trần) lúc 15:20:26Z trong ~17 phút, leo đều không ngắt quãng.
  - **E-163 — chuỗi 1: 15:21:26Z, 1 mẫu** (span 0 s); RAM 497.548 kB.
  - **Dip 1: 15:22:26–15:25:26Z, 4 mẫu** — balloon 6.089.940 kB (94,5% trần) lúc 15:22:26Z là điểm thấp nhất, rồi leo lại 96,2% → 97,7% → 99,1%; RAM trong dip tối đa 758.564 kB, **gate A KHÔNG mở lần nào**; 1 mẫu trong dip (15:25:26Z, 484.504 kB) dưới 512.000 kB.
  - **E-163 — chuỗi 2: 15:26:26–15:39:26Z, 14 mẫu** (span 780 s, 13 phút).
  - **ĐỨT ĐÃ QUAN SÁT ĐƯỢC: 15:40:26Z** — balloon xả về 5.329.712 kB (82,7% trần); RAM nhảy lên 805.996 kB; load1 2,07 (có hoạt động lúc xả — xem §2.5, spike 15:41:18Z/15:41:54Z ngay sau đó).
- **Boot #66 (edb2acdb): GHIM TRẦN 34/45 mẫu (75,6%), trong 1 chuỗi — 1 EPISODE (E-164):**
  - Leo lên trần từ 16:12:20Z (balloon 5.573.144 kB) → 6.381.372 kB (99,0% trần) lúc 16:18:20Z trong ~6 phút, leo đều không ngắt quãng.
  - **E-164 — chuỗi 1: 16:19:20–16:52:21Z, 34 mẫu** (span 1.981 s, 33 phút — chuỗi ghim dài nhất đợt này, dài thứ hai trong chuỗi gần đây sau chuỗi 2 của E-162 dài 55 mẫu) — **CÒN MỞ lúc T9 đóng** (mẫu cuối 16:52:21Z vẫn ghim; T9 dừng sampler lúc đóng — diễn biến sau đó thuộc T10/T9-164 nếu có).
  - Không dip nào trong E-164 (34 mẫu ghim liên tục, không mẫu nào dưới trần).
- **Tổng ghim trần đợt này: 49/133 mẫu (36,8%)** (đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **2 episode, 2 boot; 1 episode đã đứt (E-163, đứt quan sát được), 1 episode còn mở lúc kết thúc quan sát (E-164)** — khác đợt 162 (1 episode, 1 boot, còn mở) và đợt 161 (3 episode, 2 boot, 2/3 còn mở).
- **Phán theo quy tắc quyết (e)/(g) + quyết (j) đợt 162 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-163 (chuỗi 1+2): 1 EPISODE.** Hai chuỗi cùng boot, cách nhau bởi dip 1 (94,5%, 4 mẫu) — gate A đóng suốt dip. Theo tiêu chí cứng đứng (gate A có mở trong dip hay không — quy tắc (g) đợt 152 + quyết (k) đợt 157/158/159 + quyết (j) đợt 160 + quyết (j) đợt 161 + quyết (j) đợt 162 đã CHẤP NHẬN cách đếm 1 episode đợt 162 trên đúng tiêu chí này), dip KHÔNG tách: dip 94,5% **sâu hơn** hai dip đợt 162 (97,5%/99,0%) nhưng **nông hơn** dip sâu nhất tiền lệ đã không tách (90,8% đợt 161; 93,9% đợt 160) và gate A đóng suốt dip — đếm 1 episode là chắc chắn dưới tiêu chí đứng. **Caveat (xem F-163-T9-7):** nếu parent đặt ngưỡng độ sâu (ví dụ dip <95% thì tách) thì dip này tách ra, E-163 thành 2 episode; T9 trình rõ để parent quyết, không giấu điểm khác biệt.
  - **E-164 (chuỗi 1): 1 EPISODE.** Một chuỗi duy nhất, không dip, không cần phán tách.
  - **Đợt 163 = 2 EPISODE GHIM MỚI** (E-163: 15 mẫu / 2 chuỗi / 1 boot, đã đứt; E-164: 34 mẫu / 1 chuỗi / 1 boot, còn mở).
  - **E-162 đợt 162 (theo dõi, giao T10 ghi nhận): đứt KHÔNG quan sát được.** Balloon lúc T9-163 mở (14:39:23Z) đã là 5.357.616 kB (83,1% trần) và không ghim lần nào trước 15:21:26Z — E-162 đã kết thúc trước 14:39:23Z; khoảng trống không quan sát 13:55:46Z → 14:39:23Z (43m37s) có chứa reboot #65 (14:34:57Z) nên điểm đứt E-162 không xác định được trong khoảng đó (xem F-163-T9-2). E-162 không nối sang E-163: giữa lần ghim cuối E-162 (13:55:46Z, boot #64) và lần chạm đầu E-163 (15:21:26Z, boot #65) có **reboot #65 + balloon xả về 3.131.844 kB (48,6% trần) lúc 14:58:25Z + ~1h26m không ghim**.
  - **E-163 không nối sang E-164:** giữa lần ghim cuối E-163 (15:39:26Z, boot #65) và lần chạm đầu E-164 (16:19:20Z, boot #66) có **reboot #66 + balloon xả về 4.823.852 kB (74,9% trần) lúc 16:08:20Z + ~40 phút không ghim** — tách episode chắc chắn (khác boot, có reboot ở giữa).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~365–603.000 kB trong khi tổng RAM 8.125.908 kB − balloon 6.443.824 kB = 1.682.084 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ ghim E-164 16:52:21Z: tổng RAM 8.125.900 kB − balloon 6.443.824 kB = 1.682.076 kB còn lại; MemAvailable 548.768 kB.

### 2.3 Lượt yên WebKit #32 (T4, đợt 163) — CÓ LƯỢT HỢP LỆ #28, CHUỖI NỐI DÀI (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-163 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND163_T4_WEBKIT_QUIET32_LIMITS.md`) + cờ `round163-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Attempt1-1c1cf10c (14:54:04–14:58:15Z): probe 20/20, lớp B 5/5, tickCost median 62,0 ms > 60 — KHÔNG HỢP LỆ, KHÔNG cộng dồn** (retry theo quyết (h) đợt 149 đã cứu lượt).
- **Attempt2-1c1cf10c (14:59:01–15:03:10Z): probe 20/20, lớp B 5/5 SẠCH, tickCost median 53,0 ms ≤ 60 — HỢP LỆ, ngân sách 2/3; poller thoát vì LUOT HOP LE.**
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): CÓ 1 attempt hợp lệ cho lượt yên #32 (#28)** — chuỗi lượt yên hợp lệ **NỐI DÀI lên #28** (#22 đợt 157 → #23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161 → #27 đợt 162 → #28 đợt 163).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1: gate A MỞ **3/4 mẫu** trong cửa sổ (14:54:25Z 1.066.696 kB; 14:55:25Z 971.376 kB — **thấp hơn gate 77.200 kB**; 14:56:25Z 1.699.708 kB; 14:57:25Z 1.946.296 kB). Tải: sampler load1 trong cửa sổ attempt1 **0,56–1,75**; **0 spike B2 trong cửa sổ attempt1** (xem §2.5).
  - Attempt2: gate A MỞ **4/4 mẫu** trong cửa sổ (14:59:25Z 2.568.292 kB; 15:00:25Z 2.130.560 kB; 15:01:25Z 2.663.232 kB; 15:02:25Z 2.369.792 kB — cả 4 đều ≥1024 MiB).
  - Tải: sampler load1 trong cửa sổ attempt2 **1,33–2,67**; **0 spike B2 trong cửa sổ attempt2** (xem §2.5).
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cả hai cửa sổ attempt**.
- **Cộng dồn mới (28 lượt hợp lệ, theo T4-163): P1 107/110, P2 101/101, P3-A1 91/110, P3' 74/82 occ = 69/73 distinct-seq, P7 62/62.** T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- **Đính chính liên quan (T4-163 phát hiện, giao parent/T10 quyết):** helper distinct-seq **ĐÃ VÁ** theo quyết (t) đợt 162 (đọc sổ `distinct-seq-ledger.json`; back-test 161 → 61/65, 162 → 67/71, live 163 → 69/73); helper phát hiện **cộng dồn ghi nhận 67/74 SAI mẫu số — đúng là 67/71** (xem §5.4). Số 67/74 trong aggregate 162 §4 + LIMITS T9-162 §2.3 do đó mang mẫu số sai (tử số 67 đúng); T9-163 ghi nhận đính chính này, không tự sửa aggregate cũ.
- T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy attempt1 14:54:04–14:58:15Z + attempt2 14:59:01–15:03:10Z trên boot #65.

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 14:54:25–14:57:25Z | #65 | 0,56–1,75 (4 mẫu) | 971.376–1.946.296 kB — **gate A MỞ 3/4** (mẫu 14:55:25Z 971.376 kB thấp hơn gate) | T4 attempt1 — 0 spike B2 trong cửa sổ; attempt1 KHÔNG HỢP LỆ (tickCost median 62,0 ms > 60) |
| 14:59:25–15:02:25Z | #65 | 1,33–2,67 (4 mẫu) | 2.130.560–2.663.232 kB — **gate A MỞ 4/4** | T4 attempt2 — 0 spike B2 trong cửa sổ; attempt2 HỢP LỆ #28 (tickCost median 53,0 ms ≤ 60) |

### 2.5 B2 — 18 spike, 17 QUY ĐƯỢC DRIVER CỤ THỂ + 1 load1 dư (0 spike trong cửa sổ ghim E-163/E-164, 0 spike trong cửa sổ attempt T4; 2 spike TRONG cửa sổ O8 — cả hai do chính O8 gây)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-163-T9-9). **18 spike: 12 spike bão mở đợt #65 (14:41:12–14:50:41Z) + 2 spike O8 (15:41:18Z + 15:41:54Z) + 1 spike harness (15:51:29Z) + 3 spike bão sau reboot #66 (16:08:20–16:09:31Z); 0 spike trong cửa sổ ghim E-163 (15:21:26–15:39:26Z), 0 spike trong cửa sổ ghim E-164 (16:19:20–16:52:21Z), 0 spike trong cửa sổ attempt T4 (14:54:04–15:03:10Z).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — bão mở đợt #65 (12 spike liên tục) | 14:41:12–14:50:41Z | 3,04 → 7,42 → 3,04 | 12 | tsc `--noEmit` (17,1%) + vite build + node test `binOrphan60Q7.test.ts` + ffmpeg render (delta 87/116) + mask_anim.py (delta 44/78/80/90/93) + ffmpeg testsrc2 (delta 136) + find/grep/blind9595-investigate.py (T2 điều tra mù #95?, delta 9–41) + hatch daemon (delta 11–31) | **Bão mở đợt 163: T1 verify suite 162 + T2 điều tra mù #95? — hai luồng mở cùng lúc trên boot mới** (xem F-163-T9-3). T5 replay (apt-get/dpkg 14:35:44–14:38:49Z theo T0-163) xảy ra TRƯỚC khi watcher khởi động (14:40:30Z) nên không có trong log B2 — chỉ sampler bắt được đuôi bão (mẫu đầu 14:39:23Z load1 3,89) |
| 2 — O8 WebKit | 15:41:18Z | **3,30** | 1 | MiniBrowser delta **49** + WebKitWebProcess delta **63**; script `clicktest-87o8-mask-track-webkit.mjs` pid 48104 (chính process O8 WebKit attempt 2, 15:40:35Z) | **T8 O8 WebKit** — spike NẰM TRONG cửa sổ O8 (15:39:27–15:42:34Z), 52 s sau khi E-163 đứt (15:40:26Z); driver là chính process O8, không phải tải lạ. **Lần đầu có spike B2 quy được WebKit/MiniBrowser** (đợt 162: 0 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log) |
| 3 — O8 Chromium | 15:41:54Z | **4,27** | 1 | chrome renderer delta **48** + chrome chính 40,0% tích lũy; vite O8 delta 0 | **T8 O8 Chromium** — spike NẰM TRONG cửa sổ O8 (15:39:27–15:42:34Z); driver là chính process O8 (O8 Chromium 15:41:35Z pid48557), không phải tải lạ (cùng mẫu spike 16 đợt 162: chrome renderer O8 delta 31) |
| 4 — T8 harness Chromium | 15:51:29Z | **3,45** | 1 | chrome gpu-process delta **83** + chrome renderer delta **44**; vite harness delta 2 | **T8 harness Chromium** (cùng chữ ký spike 17 đợt 162: gpu-process delta 88; spike 3 đợt 161: gpu-process delta 99) — trong cửa sổ harness (15:42:43–15:58:58Z) |
| 5 — bão sau reboot #66 (3 spike liên tục) | 16:08:20–16:09:31Z | 3,36 → 5,02 → 3,36 | 3 | apt-get (delta 11/48) + dpkg `--unpack` (84,2% tích lũy, delta mất — pid chết giữa chừng, xem F-163-T9-9) + hatch daemon (delta 1–43) | **Bão sau reboot #66: T5 replay (apt-get/dpkg) + hatch daemon** — watcher khởi động lại 16:08:20Z bắt được ngay spike đầu tiên cùng giây (khác bão mở đợt #65: watcher mở muộn 67 s sau sampler) |

- **Tổng kết đếm: 17/18 spike có driver process cụ thể** (bão mở đợt #65 ×11 + O8 WebKit ×1 + O8 Chromium ×1 + harness Chromium ×1 + bão sau reboot ×3) **+ 1 spike lớp "load1 dư"** (14:50:41Z, load1 3,04 — chỉ hatch daemon/execd, delta 4+14 tick, không driver mạnh — xem dưới). Đợt 162: 17/17 quy được; đợt 161: 3/3 quy được; đợt 160: 13/15 quy được + 2 load1 dư.
- **Spike load1 dư duy nhất — 14:50:41Z, load1 3,04:** top tức thời chỉ có hatch daemon 16,7% + hatch-execd 3,8% (mọi process khác ~0%); delta tick top-5 chỉ 4 + 14 tick/s; `poll-wait-t4-163.sh` đang chạy nhưng delta 0. Không có process nào đủ tải để giải thích load1 3,04 — T9 phân loại **load1 dư** theo đúng tiền lệ đợt 160 (2 spike load1 dư). Không giấu vào nhóm "quy được".
- **Caveat đếm (F-163-T9-9):** chuỗi `ps -eo pid` xuất hiện **3 lần** trong b2-spikes-FROZEN.log — cả 3 đều là **dòng cmdline của chính shell exec của agent** (pid 6996 lúc setup + pid 2284 lúc khởi động lại sau reboot), KHÔNG phải lệnh `ps` của watcher; **0 lần watcher tự lọt top với vai trò driver**. Fix (n) đợt 150 VẪN ĐÓNG. `grep -c 'WebKit\|MiniBrowser'` = **6 dòng** (spike 15:41:18Z — lần đầu WebKit xuất hiện trong log B2).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Hai trường hợp đợt này: spike 14:50:07Z (ffmpeg testsrc2 136% tích lũy trong ps top nhưng không có dòng delta — pid chết giữa chừng) và spike 16:08:55Z (dpkg 84,2% + apt-get 66,8% tích lũy nhưng không có dòng delta — pid chết giữa chừng). Attribution hai spike này dựa vào ps top tức thời, đã ghi rõ. **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 17 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 17/18 spike — chỉ 1 spike lớp load1 dư đợt này.
- **Delta tick lớn nhất đợt: 136 tick/s** (ffmpeg testsrc2, spike 14:49:31Z, load1 4,28); ffmpeg render 116 tick/s (14:42:58Z); mask_anim.py 93 tick/s (14:45:55Z); chrome gpu-process 83 tick/s (15:51:29Z); WebKitWebProcess 63 tick/s (15:41:18Z). (Đợt 162: max 125 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động ~14:40:30Z, sau sampler 14:39:23Z ~67 s (lần khởi động đầu bị giết cùng exec session setup — xem F-163-T9-3); mẫu sampler đầu 14:39:23Z load1 3,89 cho thấy có thể đã có spike trong khoảng 14:39:23–14:40:30Z mà watcher không bắt được. Sau đó watcher chạy liên tục tới khi chết theo reboot #66 (16:06:45Z) — **khoảng mù thứ hai: reboot giết watcher, khởi động lại 16:08:20Z (gap 113 s cùng sampler)** — spike đầu tiên sau khởi động lại bị bắt ngay cùng giây 16:08:20Z (load1 5,02). **0 gap phủ sóng watcher nào khác trong phiên.**
- **O8/harness chạy đợt này:** O8 15:39:27–15:42:34Z (WebKit 21/21 ×2 + Chromium 21/21) gây **2 spike B2** (15:41:18Z WebKit + 15:41:54Z Chromium — cả hai do chính process O8); harness gây **1 spike B2** (15:51:29Z, chrome gpu-process delta 83) — khác đợt 162 (O8 gây 1 spike, harness gây 1 spike) và đợt 161 (O8 0 spike, harness 1 spike); đợt này O8 gây 2 spike, harness gây 1 spike.
- **Kẹt harness: 0 kẹt đợt này** (T8-163: harness 6/6 PASS; 86n2 P5-entry PASS — điểm kẹt đợt 162 không tái diễn) nên không có cửa sổ kẹt để đối chiếu B2.

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg xuất hiện trong 4/18 spike** (render 14:42:21Z delta 87; render 14:42:58Z delta 116; testsrc2 14:49:31Z delta 136; testsrc2 14:50:07Z 136% tích lũy, delta mất — tất cả trong bão mở đợt, thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T2 điều tra + T5 replay + T8 O8/harness + hatch daemon; **6 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log — spike O8 WebKit 15:41:18Z, đã quy driver ở §2.5**).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (TRỪ GAP REBOOT 113 s); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ mười bảy liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148–162 giữ nguyên; quyết parent (m) đợt 162 GIỮ NGUYÊN cơ chế (a) armed): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **3.623.788 kB = 3.545,7 MiB = 57,60% guard lúc 14:58:25Z** — vừa qua một nửa đường tới guard (xa guard 2.667.668 kB). Đỉnh đợt này cao hơn đợt 162 (53,07% guard) và đợt 161 (42,93% guard) nhưng vẫn xa guard. Đỉnh trên boot #66 chỉ 1.959.248 kB (31,14% guard) — thấp hẳn vì balloon ghim 34/45 mẫu.
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ mười bảy liên tiếp (147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163).** Cơ chế tự động armed cả phiên (sampler `round163-t9/sampler.sh`, chạy 14:39:23Z–16:06:27Z trên #65 + 16:08:20Z–16:52:21Z trên #66, 133 mẫu — **gap lớn nhất 113 s (reboot #66); các gap còn lại ≤61 s; 0 gap >90 s ngoài gap reboot**) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→163 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**, **3.211**, **2.779**, **3.477**, **2.612**, **2.250**, **3.216**, **2.967**, **2.701**, **3.339**, **3.624**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 14:39:23Z–16:52:21Z trừ gap reboot 113 s (133 mẫu); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 162 nằm trong dir round162-t9 nên không chặn đợt này (dir mới round163-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-163-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-163-birefnet/out-birefnet-163.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147–162):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-163-T9-11); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-163-T9-10 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra — đợt này T4 có 1 attempt hợp lệ nhưng cửa sổ guard không mở nên điểm (c) không phát sinh). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này (gap 113 s do reboot #66, 16:06:27Z → 16:08:20Z)** — lần đầu tiên kể từ đợt 160 sampler có gap reboot; T9 đã khởi động lại sampler/watcher/probe-loop bằng tay lúc 16:08:20Z (boot+95s) và bắt được cửa sổ thoáng headroom ở boot+71s bằng probe tay (xem §1.2).

## 4. ENOSPC / vite watch

- **Phương pháp đếm (ghi rõ):** `journalctl --no-pager | grep -c 'No space left on device'` trên boot đang chạy tại thời điểm đếm; journald chỉ giữ 1 boot (volatile) nên **số cuối của một boot KHÔNG kiểm được sau khi reboot sang boot mới** (cùng giới hạn F-155-T10-1 / F-154-T1-3). Mỗi boot dưới đây ghi rõ: số đếm được lần cuối + thời điểm đếm + ai đếm. **Tổng phiên là CẬN DƯỚI (≥), không phải số đếm đầy đủ.**
- **Journal trên boot #65 (1c1cf10c): ≥56 dòng lúc đếm cuối 15:40:13Z** — T9 đếm 4 lúc 14:40:24Z (dòng đầu 14:36:44Z = boot+1m47s) → 30 lúc 15:10:12Z → **56 lúc 15:40:13Z** (dòng cuối đếm được 15:40:02Z). Cadence ~69 s/dòng (26 dòng/30m, rồi 26 dòng/30m — đều đặn). **Phần còn lại 15:40:13Z → reboot #66 (16:06:45Z, ~26m32s, kỳ vọng ~23 dòng theo cadence) CHƯA ĐẾM — journal mất theo reboot #66, T9-163 KHÔNG cộng số ước vào tổng** (xem F-163-T9-5). Số chính thức cho #65 là **≥56 dòng** (đếm tới 15:40:13Z). T5-163 đếm 11 dòng lúc 14:48:38Z (số riêng T5 trong cửa sổ của T5 — khớp trong dải đếm của T9: 4 lúc 14:40:24Z → 30 lúc 15:10:12Z).
- **Journal trên boot #66 (edb2acdb): 2 dòng lúc đóng** — dòng 1 lúc 16:08:35Z (boot+110s — trùng đúng mốc cửa sổ thoáng headroom đóng, xem §1.2) + dòng 2 lúc 16:09:36Z (cách dòng 1 đúng 61 s); **không tăng thêm từ 16:09:36Z tới lúc đóng 16:52:45Z** (43 phút không có dòng mới — vì headroom còn 2 slot trống nên systemd thêm watch thành công, xem §1.2). Boot này còn sống lúc T9 đóng nên 2 là số đếm tới thời điểm đóng (có thể tăng sau khi T9 đóng — T10 kiểm lại nếu cần).
- **Tổng phiên: 58 dòng đếm được (≥56 trên #65 + 2 trên #66) — CẬN DƯỚI.** Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. **Đây là đợt thứ mười hai liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng — ít hơn vì journal của 3 boot cũ mất theo 3 reboot; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng — ít hơn vì journal boot #58 mất theo reboot #59 sau khi chỉ đếm tới 34; đợt 159: ≥134 dòng — cao nhất kể từ đợt 155; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: ≥58 dòng đếm được — ít hơn vì journal boot #65 mất theo reboot #66 sau khi chỉ đếm tới 56).
- **Điểm mới đáng ghi (không phán cơ chế):** trên #66, dòng ENOSPC đầu tiên xuất hiện 16:08:35Z (boot+110s) — đúng lúc headroom về 0 sau cửa sổ thoáng; sau đó chỉ thêm 1 dòng (16:09:36Z) rồi im 43 phút trong khi headroom giữ 2 — khác hẳn #65 (cadence ~69 s/dòng đều đặn cả phiên). T9 ghi đúng mốc thời gian, không claim quan hệ nhân quả.
- Steal CPU: **không đo đợt này** (T9 không đo steal; giao T5/T7 nếu cần).
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=0 ×8 lần + i=2 ×5 lần — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo; 2 lần chạm CAP 30.000 không gặp ENOSPC nên không phải lỗi); **(2) 58 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2 — **không thêm được watch nào cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Reboot #65 TRƯỚC phiên + reboot #66 GIỮA phiên; sampler/watcher/probe-loop chết theo #66, khởi động lại bằng tay

- **Boot lúc mở đợt 163 = 1c1cf10c** (btime **1795271697 = 14:34:57Z** theo `/proc/stat` — khớp T0-163 9 nguồn + T2-163 + T5-163 + T7-163; **reboot #65 xảy ra TRƯỚC phiên, sau T10-162 đóng sổ 18'18" (đóng 14:16:39Z), trước đợt 163 mở 14:35:51Z 54 s**). Gap #64→#65 = **11.979 s (3h19m39s) — DÀI NHẤT chuỗi gần đây** (theo T0-163/T2-163/T7-163).
- **T9 mở muộn so với boot #65:** T9 khởi động sampler 14:39:23Z (boot+4m26s), lần đo headroom đầu 14:40:24Z (boot+5m27s) đã là 0 — **cửa sổ thoáng headroom sau reboot #65 (nếu có) đã qua trước khi T9 mở** (xem F-162-T9-1 — đợt này T9 KHÔNG lỡ cửa sổ của #66 vì reboot xảy ra giữa phiên, xem dưới).
- **Reboot #66 GIỮA phiên (edb2acdb, btime 1795277205 = 16:06:45Z giờ thật; gap #65→#66 = 5.508 s):** sampler mẫu cuối trên #65 16:06:27Z (balloon 6.332.968 kB = 98,3% trần, đang leo tới lần ghim thứ hai); **sampler + watcher + probe-loop CHẾT theo reboot** (cả ba đều là process thường, không sống qua reboot); T9 phát hiện lúc check-3 bị SIGTERM (~16:07:15Z, 30 s sau btime — cùng sự kiện với sleep #4 của T7, F-163-T7-1) và **khởi động lại cả ba bằng tay lúc 16:08:20Z (boot+95s)**. Khoảng trống phủ sóng duy nhất >90 s: **113 s (16:06:27Z → 16:08:20Z)** — điểm yếu (d) đợt 148 tái diễn lần đầu kể từ đợt 160 (xem §3, F-163-T9-4). Probe-loop cặp ~16:10Z KHÔNG chạy được (chết theo reboot) — thay bằng probe tay window-map (16:08:35Z / 16:10:05Z / 16:11:36Z); probe-loop sau khởi động lại chạy cặp 16:38:20Z bình thường.
- **Số hiệu #65/#66: T9 tự xác nhận theo đếm tuần tự** (#64 đã xác nhận đợt 162, quyết (o) đợt 162; #65 là boot mới duy nhất sau #64 trong phiên — T0/T2/T5/T7-163 xác minh độc lập; #66 là boot mới duy nhất sau #65 trong phiên — T7-163 xác minh độc lập, requeue 16:07:30.460Z) — **giao T2-164/T10-163 chốt chính thức số hiệu #66** (T2-163 chỉ xác nhận tới #65 vì đóng trước #66).
- Các cờ .done lúc T9 đóng (~16:53Z): t0, t1, t2, t4, t5, t6, t7, t8 (8/8 — t9 đóng ngay sau khi viết LIMITS này, thành 9/9).

### 5.2 T5-163 — POSTBOOT_PASS cho #65 ĐÃ CÓ; watcher-162 CHẾT SỚM không ghi log; watcher-163 khởi động tay (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **POSTBOOT_PASS cho boot #65 ĐÃ CÓ (T5-163, 14:45:05Z, boot+10m08s, mode replay-day-du, poll=0)** — replay tự nhiên đầy đủ, khởi động boot+47s (nhanh thứ hai từng đo, sau #59 +35s); dpkg 1.545 dòng md5 `aeb0886e`, cache 178, lists 39, GST 269 thật; postboot độc lập exit 0 lúc 14:45:48Z, 11/11 gói + 5/5 lib.
- **POSTBOOT_PASS cho boot #63: KHÔNG CÓ** (boot thứ 7 liên tiếp lọt: #51, #53, #54, #55, #57, #60, #63 — T5-163 ghi rõ). **POSTBOOT_PASS cho boot #66: CHƯA BIẾT lúc T9 đóng** (T5-164 sở hữu — T5-163 đóng 15:00Z, trước reboot #66).
- **Watcher-162 CHẾT SỚM không ghi log** (poll cuối 14:25:20Z, 331 poll đều 30/31 s, 0 END/0 STOP, không có file watcher-stop — chết 9m37s TRƯỚC btime #65 và 4m40s TRƯỚC hạn END; T5-163 điều tra tới giới hạn bằng chứng, nguyên nhân KHÔNG xác định được — PHÁT HIỆN MỚI của T0-163). **Watcher-163 khởi động bằng tay 14:45:03Z, pid 25133**, boot 1c1cf10c, END 17:30:00Z. **Watcher-163 CHẾT theo reboot #66** (chết cùng boot #65 — T5-164 kiểm tra lúc mở theo quy tắc đứng (3)).
- **Marker:** `~/.config/vcut-persistence-marker` còn nguyên — **sống qua 17 reboot #49–#65** (T0-163 đếm độc lập 17 — KHỚP T5; F-162-T5-6 ĐÓNG). Marker qua #66 thuộc T5-164.
- **KHÔNG có nghịch lý đồng hồ ở #65** (T0/T2/T5/T7-163). Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn.
- **ENOSPC riêng T5: 11 dòng trên boot #65** (số riêng T5 trong cửa sổ của T5; T9 đếm chính thức ≥56 dòng — xem §4). **Hướng (3) VẪN ĐỨNG (lần thứ 10)** (kiểm lại: systemd user@0/logind/dbus inactive).
- **X11: 3 socket mồ côi X193/X194/X195 mới lúc 14:46:51Z** (0 process Xvfb) — T8-163 đã dọn, `/tmp/.X11-unix/` TRỐNG sau dọn (xem §5.3).

### 5.3 T8-163 — O8 PASS 3/3 + harness 6/6, 0 KẸT (T9 chỉ ghi lại để đối chiếu)

- **O8: WebKit 21/21 ×2 + Chromium 21/21, toàn bộ PASS exit 0** (15:39:27–15:42:34Z, 3'07", boot #65) — qua **gate FOUND poll 54 lúc 15:34:48Z** (t4=OK + POSTBOOT_PASS đường (a) của T5 14:45:05Z); lượt yên #32 có lượt hợp lệ #28 (attempt2 20/20, B 5/5, tickCost median 53,0 ms, boot #65). Chuỗi WebKit FULL PASS 17 → ? CHỜ T10/parent phán (T8 KHÔNG tự chốt).
- **Harness: 6/6 PASS, 0 KẸT** (15:42:43–15:58:58Z, 16'15" — một lần chạy driver duy nhất); 85m4 P4-lần3 PASS lần thứ năm liên tiếp; 86n2 P4-lần2 PASS (chuỗi verdict 13 → 14); **86n2 P5-entry PASS (điểm kẹt đợt 162 không tái diễn)**; 84l10 E4 ended=false lần thứ tư liên tiếp. **Kẹt cộng dồn GIỮ 14; chuỗi "P3 không kẹt" 0 → 1.**
- **Đối chiếu sampler T9 (độc lập):** O8 gây **2 spike B2** (15:41:18Z WebKit MiniBrowser delta 63 + 15:41:54Z Chromium renderer delta 48 — cả hai do chính process O8, xem §2.5); harness gây **1 spike B2** (15:51:29Z, chrome gpu-process delta 83); **0 spike B2 trong cửa sổ ghim E-163/E-164**. **Caveat O8 (F-163-T8-2): O8 WebKit đợt này chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), KHÔNG phải system libs** — nhãn "system libs" trong quyết (g) đợt 162 không khớp bằng chứng script; bằng chứng system libs là harness trên cùng boot đo. **Caveat balloon (F-163-T9-8): O8 bắt đầu 15:39:27Z trong khi balloon còn ghim (mẫu sampler cuối cùng ghim 15:39:26Z, 1 s trước khi O8 bắt đầu); balloon xả lúc 15:40:26Z, trong lúc O8 chạy** — O8 vẫn PASS 3/3 theo T8-163; T10/parent phán ảnh hưởng tới chuỗi (xem §2.2).
- **RAM sampler T8 n=33, balloon max 91,3% trần, pinned=0, avail min 502 MB @15:54:13Z** (cửa sổ sampler T8 không bao phủ lúc ghim 15:39:21Z — T8 tự ghi "Balloon GHIM TRAN 6.443.824 kB lúc 15:39:21Z (trước O8, ngoài cửa sổ sampler)" — khớp sampler T9: mẫu ghim cuối E-163 15:39:26Z).
- **0 REBOOT trong phiên T8** (T8 đóng 16:04Z, trước reboot #66 16:06:45Z 129 s — theo T7-163); boot `1c1cf10c` ổn định từ lúc mở tới lúc đóng.
- **X11: dọn 3 socket mồ côi X193/X194/X195 (0 process Xvfb còn sống); `/tmp/.X11-unix/` TRỐNG sau dọn.**

### 5.4 T7-163 — run 162 SUCCEEDED + #66 ỨNG VIÊN DƯƠNG (m) + run 163 chưa có kết cục lúc đóng (T9 chỉ ghi lại để đối chiếu)

- **Kết cục run 162: SUCCEEDED 14:18:06Z** (wall gốc 9.735 s, **margin 1.065 s** (17m45s) tới hạn 14:35:51Z, claimed→finished 11 s, 0 lần viết lại, 2 event) — **KHÔNG bị reboot #65 giết** (finished 1.011 s TRƯỚC btime #65; btime chỉ sớm hơn hạn 54 s theo nghĩa giả định). T10-162 đóng 14:16:39Z — run finish 87 s SAU khi T10 đóng.
- **Reboot #66 (edb2acdb, btime 16:06:45Z giờ thật, gap #65→#66 = 5.508 s; sau T8-163 đóng 129 s): VIẾT LẠI run 163 lần 1, requeue 16:07:30.460Z = btime +45,460 s — TRONG dải 33–49,8 s → ỨNG VIÊN DƯƠNG (m)** (chờ parent quyết; đối chiếu độc lập thuộc T2-164; spanning = 0 là artifact viết-lại-tự-loại — T7 ghi rõ trong LIMITS). Nếu CHẤP NHẬN: n ứng viên 20→21 (nhánh khuyến nghị) hoặc 21→22 (nhánh #56 ÂM).
- **Run 163:** jitter 0 s lần thứ 16 liên tiếp, 1 lần viết lại (tại #66), vẫn running lúc T7 đóng cờ (tuổi gốc 7.885 s, còn 2.915 s tới hạn 17:35:51Z) — **kết cục thuộc T7-164**. **HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s), 0 thiếu, 0 muộn** — cửa lành hoàn toàn (đợt thứ hai liên tiếp). Lũy kế HB 44/369, DR 49/255; muộn HB lũy kế GIỮ 9.
- **F-163-T7-1:** sleep #4 bị SIGTERM giết bởi reboot #66 (466 s, ~16:07:15Z, 30 s sau btime); 5/6 sleep hoàn thành — cùng sự kiện SIGTERM đã giết sleep check-3 của T9 (xem §6, F-163-T9-4).

### 5.5 Các luồng khác đợt 163 (T9 chỉ ghi lại để đối chiếu)

- **T0-163:** LIMITS `docs/PHASE9_ROUND163_T0_BOOT_O8_LIMITS.md` đã xuất bản + cờ `round163-t0.done` (boot survey #65 + O8 check; marker 17 reboot; watcher-162 chết sớm — phát hiện mới).
- **T1-163:** LIMITS `docs/PHASE9_ROUND163_T1_VERIFY162_LIMITS.md` đã xuất bản + cờ `round163-t1.done` (verify 162 PASS; suite 28/28 trên boot #65; **F-163-T1-4: aggregate 162 §4 ghi T4 tickCost n=640 là SAI — đúng n=646** — xem §6, F-163-T9-12).
- **T2-163:** LIMITS `docs/PHASE9_ROUND163_T2_EPERM_LIMITS.md` đã xuất bản + cờ `round163-t2.done` (mù #95? MỞ — điều tra đầy đủ; #94? MỞ; #88? vẫn mở lần thứ bảy; #77? vẫn mở; INSIDE: #64 INSIDE dải FULL110 → chuỗi 1 LÊN 2; #65 NGOÀI dải FULL111 → chuỗi 2 KẾT THÚC, chuỗi mới từ #65 (độ dài 1); (m) #56 không thu hẹp được lần thứ sáu; #65 KHÔNG PHẢI điểm (m)).
- **T6-163:** LIMITS `docs/PHASE9_ROUND163_T6_LOCKHEALTH_LIMITS.md` đã xuất bản + cờ `round163-t6.done` ((A) 120/120 lần thứ 13 liên tiếp, tổng 1560/1560; lock 508 cặp kiểm cuối (ACQUIRED 519 / RELEASED 508); reboot #65 KHÔNG giết holder — chuỗi "không giết holder" lên 5 reboot liên tiếp (#61–#65); prune lần 38 — queue 101 → 100; **đính chính: 502/491 là kiểm cuối đợt 161, kiểm cuối đợt 162 là 511/500**).
- **T4-163:** xem §2.3 (lượt yên #32 CÓ lượt hợp lệ #28; helper distinct-seq ĐÃ VÁ theo quyết (t) đợt 162).

## 6. Sai số F-163-T9-* (trung thực — liệt kê đầy đủ)

- **F-163-T9-1 — Giá trị đỉnh thật của cửa sổ thoáng sau reboot #66 không biết được (chỉ biết ≥30.001).** Probe cap 30.000: cả hai lần đo 16:07:56Z (boot+71s) đều chạm cap mà không gặp ENOSPC — giá trị thật có thể cao hơn 30.001 (tới tối đa ~63.747 nếu bảng trống hẳn). T9 không claim đỉnh = 30.001; chỉ ghi "≥30.001 (chạm CAP)". Cửa sổ đóng trước boot+110s (lần đo 16:08:35Z đã là 0) — khoảng mở < 40 s, hẹp nhất từng quan sát (đợt 159: cửa sổ ~95–148s với giá trị trung gian 23.503/18.447). Giao T9-164: nếu reboot xảy ra giữa phiên thì đo ngay trong 60–110 s sau boot (như đợt này) thay vì chờ cặp probe 30 phút.
- **F-163-T9-2 — Khoảng trống không quan sát E-162 đợt 162 (43m37s) + điểm đứt E-162 không xác định được.** T9-162 đóng 13:55:56Z (E-162 còn mở, balloon ghim); T9-163 mở 14:39:23Z (balloon 5.357.616 kB = 83,1% trần, không ghim). Giữa hai mốc có reboot #65 (14:34:57Z). E-162 có thể đứt bất kỳ lúc nào trong khoảng 13:55:46Z → 14:39:23Z — trước reboot, đúng lúc reboot, hay sau reboot đều không phân biệt được bằng dữ kiện T9. T9 không phán điểm đứt E-162; chỉ ghi E-162 đã kết thúc trước 14:39:23Z (xem §2.2).
- **F-163-T9-3 — Khoảng mù watcher B2 đầu phiên (~67 s) + lần khởi động đầu bị giết cùng exec session setup.** Sampler khởi động 14:39:23Z; watcher B2 khởi động lần đầu ~14:39:30Z nhưng bị giết khi exec session setup bị output-drain timeout teardown (file `b2-nohup.out` không tồn tại, process không còn); watcher khởi động lại thành công ~14:40:30Z (setsid + redirect đầy đủ). Mẫu sampler đầu 14:39:23Z load1 3,89 cho thấy có thể đã có spike trong khoảng 14:39:23–14:40:30Z mà watcher không bắt được (chỉ sampler ghi load1). T9 không claim 0 spike trong khoảng này; spike đầu tiên watcher bắt được là 14:41:12Z. Bài học: khởi động watcher bằng setsid ngay từ đầu (như lần khởi động lại sau reboot #66 — bắt được spike cùng giây 16:08:20Z).
- **F-163-T9-4 — Reboot #66 giết sampler/watcher/probe-loop — gap phủ sóng 113 s + sleep check-3 bị SIGTERM.** Sampler mẫu cuối trên #65 16:06:27Z; khởi động lại 16:08:20Z (boot+95s) — gap 113 s là gap >90 s duy nhất trong phiên (các gap còn lại ≤61 s). Probe-loop cặp ~16:10Z KHÔNG chạy được (chết theo reboot) — thay bằng probe tay window-map (16:08:35Z / 16:10:05Z / 16:11:36Z). Sleep check-3 của T9 bị SIGTERM ~16:07:15Z (30 s sau btime #66) — cùng sự kiện với sleep #4 của T7 (F-163-T7-1). Điểm yếu (d) đợt 148 (reboot giết sampler) tái diễn lần đầu kể từ đợt 160 — T9 đã khởi động lại bằng tay trong 95 s sau boot và bắt được cửa sổ thoáng headroom ở boot+71s bằng probe tay (trước khi sampler khởi động lại xong). T9 dừng sampler/watcher/probe-loop bằng PID lúc đóng (kill 2285/2286/2287 — đã tránh lỗi F-161-T9-9). Dataset đóng đúng ở mẫu cuối 16:52:21Z, không mất số liệu.
- **F-163-T9-5 — Phần còn lại của ENOSPC boot #65 CHƯA ĐẾM (~23 dòng kỳ vọng).** Số cuối T9 đếm được là 56 dòng lúc 15:40:13Z; khoảng 15:40:13Z → reboot #66 16:06:45Z (~26m32s, cadence ~69 s/dòng) chưa đếm vì journal mất theo reboot #66. Tổng phiên 58 dòng chỉ tính số đếm được (≥56 trên #65 + 2 trên #66); T9 KHÔNG cộng số ước vào tổng.
- **F-163-T9-6 — Nhãn probe-loop trùng nhau sau khởi động lại ("probe-lan-2" xuất hiện 2 lần: 15:10:12Z và 16:38:20Z).** Probe-loop khởi động lại sau reboot #66 đếm vòng lặp từ đầu (lan-2 = vòng 30 phút đầu của lần chạy thứ hai). Chỉ là nhãn cosmetic — timestamp trong mỗi mục phân biệt rõ hai lần đo; số liệu không bị ảnh hưởng. T9 ghi rõ để T10 không đọc thành một lần đo duy nhất.
- **F-163-T9-7 — Cách đếm episode E-163 phụ thuộc tiêu chí cứng đứng (gate A), không phụ thuộc độ sâu dip.** Dip E-163 (94,5%, 4 mẫu) sâu hơn hai dip đợt 162 (97,5%/99,0%) nhưng nông hơn dip sâu nhất tiền lệ đã không tách (90,8% đợt 161; 93,9% đợt 160) và gate A đóng suốt dip — đếm 1 episode là chắc chắn dưới tiêu chí đứng. Nếu parent đặt ngưỡng độ sâu mới (ví dụ dip <95% thì tách) thì dip này tách ra, E-163 thành 2 episode; T9 trình rõ để parent quyết, không giấu điểm khác biệt. E-164 là một chuỗi duy nhất, không dip — đếm 1 episode không phụ thuộc ngưỡng nào.
- **F-163-T9-8 — O8 bắt đầu trong lúc balloon còn ghim (mẫu sampler cuối cùng ghim 15:39:26Z, 1 s trước khi O8 bắt đầu 15:39:27Z); balloon xả lúc 15:40:26Z, trong lúc O8 chạy.** Sampler T9: RAM trong cửa sổ O8 493.012 → 1.148.700 kB; gate A đóng 3/4 mẫu (chỉ mẫu 15:42:26Z ≥ gate). O8 vẫn PASS 3/3 theo T8-163 (WebKit 21/21 ×2 + Chromium 21/21). T9 chỉ cung cấp dữ kiện sampler độc lập; T10/parent phán ảnh hưởng tới chuỗi FULL PASS (chuỗi 17 → ?). Khác đợt 162 (O8 chạy sau lượt yên trên cùng boot, balloon chưa ghim lúc gate — xem F-162-T8-6): đợt này balloon ghim đúng lúc O8 bắt đầu.
- **F-163-T9-9 — Hai spike delta-miss (pid chết giữa chừng) + 1 spike load1 dư + 3 dòng `ps -eo pid` là cmdline của shell agent.** Spike 14:50:07Z (ffmpeg testsrc2 136% tích lũy) và spike 16:08:55Z (dpkg 84,2% + apt-get 66,8% tích lũy) không có dòng delta tick (pid chết giữa chừng trong vòng delta 1 s) — attribution dựa vào ps top tức thời, đã ghi rõ ở §2.5. Spike 14:50:41Z (load1 3,04) chỉ quy được hatch daemon/execd, delta 4+14 tick — phân loại load1 dư, không giấu vào nhóm quy được. 3 dòng `ps -eo pid` trong b2-spikes-FROZEN.log đều là cmdline của shell exec của agent (pid 6996 setup + pid 2284 khởi động lại), không phải lệnh `ps` của watcher — watcher tự lọt top với vai trò driver 0 lần; fix (n) đợt 150 VẪN ĐÓNG.
- **F-163-T9-10 — Sampler cadence 60 s KHÔNG bắt được spike B2 15:41:18Z/15:41:54Z lúc chúng xảy ra (chỉ bắt được load1 3,56 ở mẫu 15:41:26Z).** Watcher cadence 30 s bắt được cả hai. Ngược lại, sampler BẮT ĐƯỢC spike 16:08:20Z (mẫu load1 5,02 cùng giây với watcher). T9 ghi rõ để T10 không dùng sampler làm bằng chứng phủ định spike — cùng mẫu F-162-T9-6. **Thêm:** mẫu sampler 14:55:25Z trong cửa sổ attempt1 của T4 là 971.376 kB — thấp hơn gate A 77.200 kB (gate A 3/4 trong attempt1) — T9 chỉ ghi dữ kiện đối chiếu, không phán attempt1 (T4 đã phán TRƯỢT vì tickCost 62,0 ms > 60).
- **F-163-T9-11 — Điểm yếu (a)/(b) của cơ chế birefnet vẫn đứng; lần FIRE thật đầu tiên chưa được kiểm chứng.** Vượt guard ngắn hơn 60 s giữa hai mẫu thì sampler không thấy (điểm yếu (a)); lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (điểm yếu (b) — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log). Đỉnh RAM đợt này 57,60% guard — xa guard 2.667.668 kB nên hai điểm yếu không phát sinh đợt này.
- **F-163-T9-12 — Đính chính n của T4-162 (F-163-T1-4): aggregate 162 §4 + LIMITS T9-162 §2.3 ghi tickCost n=640 là SAI — đúng n=646.** T1-163 phát hiện khi chạy lại suite; T4-162 LIMITS ghi đúng n=646 trong bảng chi tiết nhưng aggregate 162 §4 + T9-162 §2.3 trích n=640 (số nháp). Kết luận attempt1 T4-162 (20/20, B 5/5, tickCost median 42,0 ms) không đổi — chỉ sai n. T9-163 ghi nhận đính chính, không tự sửa file cũ (thuộc T10/parent).

## Phụ lục — sampler log đóng băng (133 mẫu, `hidden_files/round163-t9/ram-sampler-FROZEN.log`)

2026-11-21T14:39:23Z boot=1c1cf10c mem=1484904 bal=5357616 swapfree=828692 load1=3.89
2026-11-21T14:40:24Z boot=1c1cf10c mem=1445800 bal=5327008 swapfree=804804 load1=2.25
2026-11-21T14:41:24Z boot=1c1cf10c mem=910200 bal=5426912 swapfree=797304 load1=5.53
2026-11-21T14:42:24Z boot=1c1cf10c mem=1150684 bal=5577296 swapfree=786000 load1=5.87
2026-11-21T14:43:24Z boot=1c1cf10c mem=1254852 bal=5527168 swapfree=785428 load1=7.38
2026-11-21T14:44:24Z boot=1c1cf10c mem=2604808 bal=4150912 swapfree=782600 load1=8.15
2026-11-21T14:45:24Z boot=1c1cf10c mem=2686644 bal=4055480 swapfree=782804 load1=4.14
2026-11-21T14:46:24Z boot=1c1cf10c mem=2787312 bal=3861464 swapfree=784072 load1=3.03
2026-11-21T14:47:24Z boot=1c1cf10c mem=2648852 bal=4067584 swapfree=784896 load1=1.36
2026-11-21T14:48:24Z boot=1c1cf10c mem=2305192 bal=4345484 swapfree=782196 load1=0.60
2026-11-21T14:49:24Z boot=1c1cf10c mem=2280608 bal=4250300 swapfree=788108 load1=3.79
2026-11-21T14:50:25Z boot=1c1cf10c mem=1986400 bal=4504548 swapfree=788796 load1=3.90
2026-11-21T14:51:25Z boot=1c1cf10c mem=1976576 bal=4752516 swapfree=789360 load1=1.51
2026-11-21T14:52:25Z boot=1c1cf10c mem=1792292 bal=4970396 swapfree=792624 load1=1.10
2026-11-21T14:53:25Z boot=1c1cf10c mem=1586528 bal=5181636 swapfree=792408 load1=0.75
2026-11-21T14:54:25Z boot=1c1cf10c mem=1066696 bal=4959316 swapfree=717644 load1=0.56
2026-11-21T14:55:25Z boot=1c1cf10c mem=971376 bal=4982900 swapfree=689556 load1=0.59
2026-11-21T14:56:25Z boot=1c1cf10c mem=1699708 bal=4827864 swapfree=670180 load1=1.31
2026-11-21T14:57:25Z boot=1c1cf10c mem=1946296 bal=4573636 swapfree=661156 load1=1.75
2026-11-21T14:58:25Z boot=1c1cf10c mem=3623788 bal=3131844 swapfree=666128 load1=2.33
2026-11-21T14:59:25Z boot=1c1cf10c mem=2568292 bal=3374024 swapfree=674828 load1=1.33
2026-11-21T15:00:25Z boot=1c1cf10c mem=2130560 bal=3643076 swapfree=684552 load1=2.67
2026-11-21T15:01:25Z boot=1c1cf10c mem=2663232 bal=3915880 swapfree=690856 load1=1.33
2026-11-21T15:02:25Z boot=1c1cf10c mem=2369792 bal=4199748 swapfree=694004 load1=1.39
2026-11-21T15:03:25Z boot=1c1cf10c mem=3609428 bal=3241032 swapfree=693836 load1=1.07
2026-11-21T15:04:25Z boot=1c1cf10c mem=3142416 bal=3612212 swapfree=694004 load1=0.61
2026-11-21T15:05:25Z boot=1c1cf10c mem=2876824 bal=3947372 swapfree=695248 load1=1.22
2026-11-21T15:06:25Z boot=1c1cf10c mem=2596396 bal=4249924 swapfree=700016 load1=0.75
2026-11-21T15:07:25Z boot=1c1cf10c mem=2275700 bal=4526464 swapfree=705468 load1=0.60
2026-11-21T15:08:25Z boot=1c1cf10c mem=2058848 bal=4777948 swapfree=707484 load1=0.28
2026-11-21T15:09:25Z boot=1c1cf10c mem=1810224 bal=5006880 swapfree=707888 load1=0.20
2026-11-21T15:10:25Z boot=1c1cf10c mem=1614240 bal=5215804 swapfree=708388 load1=0.19
2026-11-21T15:11:25Z boot=1c1cf10c mem=1437520 bal=5406320 swapfree=708084 load1=0.23
2026-11-21T15:12:25Z boot=1c1cf10c mem=1244472 bal=5576456 swapfree=704496 load1=0.29
2026-11-21T15:13:25Z boot=1c1cf10c mem=1117632 bal=5731948 swapfree=704740 load1=0.16
2026-11-21T15:14:25Z boot=1c1cf10c mem=894628 bal=5863880 swapfree=704428 load1=0.17
2026-11-21T15:15:25Z boot=1c1cf10c mem=825768 bal=5990092 swapfree=702292 load1=0.32
2026-11-21T15:16:25Z boot=1c1cf10c mem=727524 bal=6102520 swapfree=700716 load1=0.25
2026-11-21T15:17:25Z boot=1c1cf10c mem=635908 bal=6208176 swapfree=698296 load1=0.15
2026-11-21T15:18:25Z boot=1c1cf10c mem=618836 bal=6208988 swapfree=679624 load1=0.30
2026-11-21T15:19:25Z boot=1c1cf10c mem=563196 bal=6307712 swapfree=676776 load1=0.31
2026-11-21T15:20:26Z boot=1c1cf10c mem=455292 bal=6395788 swapfree=666980 load1=0.31
2026-11-21T15:21:26Z boot=1c1cf10c mem=497548 bal=6443824 swapfree=663380 load1=0.30
2026-11-21T15:22:26Z boot=1c1cf10c mem=758564 bal=6089940 swapfree=648060 load1=0.32
2026-11-21T15:23:26Z boot=1c1cf10c mem=676160 bal=6200432 swapfree=649584 load1=0.33
2026-11-21T15:24:26Z boot=1c1cf10c mem=581628 bal=6297088 swapfree=653144 load1=0.25
2026-11-21T15:25:26Z boot=1c1cf10c mem=484504 bal=6386508 swapfree=650996 load1=0.40
2026-11-21T15:26:26Z boot=1c1cf10c mem=461188 bal=6443824 swapfree=643780 load1=0.22
2026-11-21T15:27:26Z boot=1c1cf10c mem=474284 bal=6443824 swapfree=643428 load1=0.08
2026-11-21T15:28:26Z boot=1c1cf10c mem=460172 bal=6443824 swapfree=643868 load1=0.22
2026-11-21T15:29:26Z boot=1c1cf10c mem=407440 bal=6443824 swapfree=657120 load1=0.08
2026-11-21T15:30:26Z boot=1c1cf10c mem=453236 bal=6443824 swapfree=656352 load1=0.19
2026-11-21T15:31:26Z boot=1c1cf10c mem=365952 bal=6443824 swapfree=647780 load1=0.31
2026-11-21T15:32:26Z boot=1c1cf10c mem=461256 bal=6443824 swapfree=649356 load1=0.15
2026-11-21T15:33:26Z boot=1c1cf10c mem=431808 bal=6443824 swapfree=643060 load1=0.13
2026-11-21T15:34:26Z boot=1c1cf10c mem=444264 bal=6443824 swapfree=646696 load1=0.12
2026-11-21T15:35:26Z boot=1c1cf10c mem=470732 bal=6443824 swapfree=647040 load1=0.15
2026-11-21T15:36:26Z boot=1c1cf10c mem=510464 bal=6443824 swapfree=752760 load1=0.37
2026-11-21T15:37:26Z boot=1c1cf10c mem=490404 bal=6443824 swapfree=754244 load1=0.13
2026-11-21T15:38:26Z boot=1c1cf10c mem=484448 bal=6443824 swapfree=748248 load1=0.60
2026-11-21T15:39:26Z boot=1c1cf10c mem=493012 bal=6443824 swapfree=765436 load1=0.22
2026-11-21T15:40:26Z boot=1c1cf10c mem=805996 bal=5329712 swapfree=672612 load1=2.07
2026-11-21T15:41:26Z boot=1c1cf10c mem=694008 bal=5447716 swapfree=667604 load1=3.56
2026-11-21T15:42:26Z boot=1c1cf10c mem=1148700 bal=4893084 swapfree=669884 load1=2.64
2026-11-21T15:43:26Z boot=1c1cf10c mem=1152480 bal=5074628 swapfree=675484 load1=2.30
2026-11-21T15:44:26Z boot=1c1cf10c mem=1556796 bal=5242500 swapfree=675264 load1=1.56
2026-11-21T15:45:26Z boot=1c1cf10c mem=858200 bal=5381580 swapfree=665656 load1=1.83
2026-11-21T15:46:26Z boot=1c1cf10c mem=861548 bal=5498684 swapfree=664916 load1=1.24
2026-11-21T15:47:27Z boot=1c1cf10c mem=726916 bal=5529468 swapfree=644316 load1=1.31
2026-11-21T15:48:27Z boot=1c1cf10c mem=622664 bal=5631292 swapfree=636496 load1=1.22
2026-11-21T15:49:27Z boot=1c1cf10c mem=646048 bal=5733544 swapfree=641964 load1=1.78
2026-11-21T15:50:27Z boot=1c1cf10c mem=576208 bal=5832372 swapfree=644372 load1=0.87
2026-11-21T15:51:27Z boot=1c1cf10c mem=609296 bal=5724516 swapfree=622252 load1=2.44
2026-11-21T15:52:27Z boot=1c1cf10c mem=1496156 bal=5436176 swapfree=624632 load1=2.27
2026-11-21T15:53:27Z boot=1c1cf10c mem=643280 bal=5430768 swapfree=620384 load1=1.53
2026-11-21T15:54:27Z boot=1c1cf10c mem=454984 bal=5540584 swapfree=619240 load1=1.51
2026-11-21T15:55:27Z boot=1c1cf10c mem=583840 bal=5617180 swapfree=616096 load1=0.87
2026-11-21T15:56:27Z boot=1c1cf10c mem=701560 bal=5394408 swapfree=620620 load1=1.53
2026-11-21T15:57:27Z boot=1c1cf10c mem=701644 bal=5510732 swapfree=620048 load1=1.10
2026-11-21T15:58:27Z boot=1c1cf10c mem=582772 bal=5635244 swapfree=622580 load1=0.48
2026-11-21T15:59:27Z boot=1c1cf10c mem=1477996 bal=5412172 swapfree=617736 load1=0.84
2026-11-21T16:00:27Z boot=1c1cf10c mem=1273936 bal=5581408 swapfree=631452 load1=0.31
2026-11-21T16:01:27Z boot=1c1cf10c mem=1148436 bal=5736792 swapfree=633408 load1=0.23
2026-11-21T16:02:27Z boot=1c1cf10c mem=1013548 bal=5881428 swapfree=634784 load1=0.08
2026-11-21T16:03:27Z boot=1c1cf10c mem=883764 bal=6014520 swapfree=637304 load1=0.07
2026-11-21T16:04:27Z boot=1c1cf10c mem=748132 bal=6133480 swapfree=636732 load1=0.20
2026-11-21T16:05:27Z boot=1c1cf10c mem=641092 bal=6239156 swapfree=638388 load1=0.17
2026-11-21T16:06:27Z boot=1c1cf10c mem=562224 bal=6332968 swapfree=642272 load1=0.30
2026-11-21T16:08:20Z boot=edb2acdb mem=1959248 bal=4823852 swapfree=1007972 load1=5.02
2026-11-21T16:09:20Z boot=edb2acdb mem=1895856 bal=4977716 swapfree=926904 load1=3.94
2026-11-21T16:10:20Z boot=edb2acdb mem=1728144 bal=5189616 swapfree=903480 load1=2.45
2026-11-21T16:11:20Z boot=edb2acdb mem=1589444 bal=5388552 swapfree=881928 load1=1.39
2026-11-21T16:12:20Z boot=edb2acdb mem=1413888 bal=5573144 swapfree=870052 load1=0.54
2026-11-21T16:13:20Z boot=edb2acdb mem=1275508 bal=5741948 swapfree=820000 load1=0.20
2026-11-21T16:14:20Z boot=edb2acdb mem=1117940 bal=5894692 swapfree=810464 load1=0.07
2026-11-21T16:15:20Z boot=edb2acdb mem=995588 bal=6033620 swapfree=808232 load1=0.02
2026-11-21T16:16:20Z boot=edb2acdb mem=874188 bal=6161428 swapfree=807392 load1=0.01
2026-11-21T16:17:20Z boot=edb2acdb mem=757548 bal=6277108 swapfree=807396 load1=0.00
2026-11-21T16:18:20Z boot=edb2acdb mem=668540 bal=6381372 swapfree=802904 load1=0.07
2026-11-21T16:19:20Z boot=edb2acdb mem=590036 bal=6443824 swapfree=782988 load1=0.12
2026-11-21T16:20:20Z boot=edb2acdb mem=598140 bal=6443824 swapfree=783048 load1=0.04
2026-11-21T16:21:20Z boot=edb2acdb mem=592948 bal=6443824 swapfree=779972 load1=0.01
2026-11-21T16:22:20Z boot=edb2acdb mem=578436 bal=6443824 swapfree=779684 load1=0.00
2026-11-21T16:23:20Z boot=edb2acdb mem=603284 bal=6443824 swapfree=778116 load1=0.00
2026-11-21T16:24:20Z boot=edb2acdb mem=599400 bal=6443824 swapfree=778112 load1=0.22
2026-11-21T16:25:20Z boot=edb2acdb mem=574556 bal=6443824 swapfree=778156 load1=0.13
2026-11-21T16:26:20Z boot=edb2acdb mem=577724 bal=6443824 swapfree=772304 load1=0.42
2026-11-21T16:27:20Z boot=edb2acdb mem=572444 bal=6443824 swapfree=771928 load1=0.15
2026-11-21T16:28:20Z boot=edb2acdb mem=589928 bal=6443824 swapfree=771648 load1=0.05
2026-11-21T16:29:20Z boot=edb2acdb mem=573856 bal=6443824 swapfree=770832 load1=0.02
2026-11-21T16:30:20Z boot=edb2acdb mem=568700 bal=6443824 swapfree=770768 load1=0.07
2026-11-21T16:31:21Z boot=edb2acdb mem=591736 bal=6443824 swapfree=769508 load1=0.02
2026-11-21T16:32:21Z boot=edb2acdb mem=569152 bal=6443824 swapfree=769428 load1=0.21
2026-11-21T16:33:21Z boot=edb2acdb mem=590032 bal=6443824 swapfree=768832 load1=0.15
2026-11-21T16:34:21Z boot=edb2acdb mem=584804 bal=6443824 swapfree=768856 load1=0.10
2026-11-21T16:35:21Z boot=edb2acdb mem=579028 bal=6443824 swapfree=768484 load1=0.04
2026-11-21T16:36:21Z boot=edb2acdb mem=571036 bal=6443824 swapfree=768552 load1=0.13
2026-11-21T16:37:21Z boot=edb2acdb mem=591280 bal=6443824 swapfree=769860 load1=0.08
2026-11-21T16:38:21Z boot=edb2acdb mem=588972 bal=6443824 swapfree=776252 load1=0.09
2026-11-21T16:39:21Z boot=edb2acdb mem=577432 bal=6443824 swapfree=776132 load1=0.13
2026-11-21T16:40:21Z boot=edb2acdb mem=578132 bal=6443824 swapfree=776324 load1=0.04
2026-11-21T16:41:21Z boot=edb2acdb mem=574100 bal=6443824 swapfree=776640 load1=0.07
2026-11-21T16:42:21Z boot=edb2acdb mem=574160 bal=6443824 swapfree=777936 load1=0.06
2026-11-21T16:43:21Z boot=edb2acdb mem=565972 bal=6443824 swapfree=777960 load1=0.07
2026-11-21T16:44:21Z boot=edb2acdb mem=569396 bal=6443824 swapfree=777632 load1=0.13
2026-11-21T16:45:21Z boot=edb2acdb mem=563116 bal=6443824 swapfree=777752 load1=0.12
2026-11-21T16:46:21Z boot=edb2acdb mem=560116 bal=6443824 swapfree=777924 load1=0.12
2026-11-21T16:47:21Z boot=edb2acdb mem=555376 bal=6443824 swapfree=778824 load1=0.09
2026-11-21T16:48:21Z boot=edb2acdb mem=552984 bal=6443824 swapfree=777660 load1=0.07
2026-11-21T16:49:21Z boot=edb2acdb mem=545020 bal=6443824 swapfree=775736 load1=0.10
2026-11-21T16:50:21Z boot=edb2acdb mem=551752 bal=6443824 swapfree=775832 load1=0.03
2026-11-21T16:51:21Z boot=edb2acdb mem=562164 bal=6443824 swapfree=775892 load1=0.01
2026-11-21T16:52:21Z boot=edb2acdb mem=548768 bal=6443824 swapfree=775932 load1=0.23
=== probe-mo 2026-11-21T14:40:24Z boot=1c1cf10c tran=63756
headroom: 0, 0
ENOSPC-count=4 (first 14:36:44Z boot+1m47s, last 14:39:52Z)
mem: MemAvailable: 1461180 kB | Balloon: 5327008 kB
tmp probe dirs: none left
=== probe-lan-2 2026-11-21T15:10:12Z boot=1c1cf10c tran=63756
0
0
ENOSPC-count=30
ENOSPC-last: Nov 21 15:10:02 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1679468 kB | Balloon:         5148140 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-3 2026-11-21T15:40:13Z boot=1c1cf10c tran=63756
0
0
ENOSPC-count=56
ENOSPC-last: Nov 21 15:40:02 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     830284 kB | Balloon:         5329712 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-map-1 2026-11-21T16:08:35Z boot=edb2acdb uptime=110.59 tran=63747
0
ENOSPC-count=1
mem: MemAvailable:    1981744 kB | Balloon:         4823852 kB
=== window-map-2 2026-11-21T16:10:05Z boot=edb2acdb uptime=200.70 tran=63747
0
ENOSPC-count=2
mem: MemAvailable:    1625192 kB | Balloon:         5189616 kB
=== window-map-3 2026-11-21T16:11:36Z boot=edb2acdb uptime=290.89 tran=63747
2
ENOSPC-count=2
mem: MemAvailable:    1519864 kB | Balloon:         5451632 kB
=== probe-lan-2 2026-11-21T16:38:20Z boot=edb2acdb tran=63747
2
2
ENOSPC-count=2
ENOSPC-last: Nov 21 16:09:36 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     597860 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-dong 2026-11-21T16:52:45Z boot=edb2acdb tran=63747
2
2
ENOSPC-count=2
ENOSPC-last: Nov 21 16:09:36 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     519920 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-pair 2026-11-21T16:07:56Z boot=edb2acdb uptime=71.18 tran=63747 (CAP 30000 reached, no ENOSPC)
30001
30001
ENOSPC-count=0
mem: MemAvailable: 1856520 kB | Balloon: 5085996 kB
tmp probe dirs: none left
