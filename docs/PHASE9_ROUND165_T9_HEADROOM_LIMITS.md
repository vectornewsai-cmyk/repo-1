# LIMITS — Phase 9 đợt 165, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ mười chín liên tiếp; headroom 2 lúc đóng, dưới ngưỡng lần thứ 25 liên tiếp; CỬA SỔ THOÁNG SAU REBOOT ĐƯỢC QUAN SÁT LẦN THỨ BA LIÊN TIẾP (boot #70); balloon 2 EPISODE MỚI E-166 + E-167 (mỗi episode 1 chuỗi, 0 sag); ENOSPC ≥64 dòng (cận dưới); reboot #70 GIỮA PHIÊN)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 2 lúc đóng (5 lần đo cuối [2, 2, 2, 2, 2]), dưới ngưỡng < ~1.800 lần thứ hai mươi lăm liên tiếp** — giá trị ổn định đợt này là **2** (đợt 164: 0; đợt 163: 2). Trần **63.747 trên cả hai boot #69 và #70** (đợt 164: 63.756 trên #67, 63.747 trên #68). Quyết (k) "chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT ĐƯỢC QUAN SÁT — LẦN THỨ BA LIÊN TIẾP (đợt 163 + 164 + 165):** trên boot mới #70 (btime 22:05:25Z), headroom **30.001 (chạm CAP 30.000) cả hai probe lúc 22:06:28Z (boot+63s)**; tới **22:07:35Z (boot+130s) đã về 0**; ENOSPC đầu tiên trên #70 lúc 22:07:09Z (boot+104s) → cửa sổ thực nằm trong khoảng boot+63s → boot+104s (**< 41 s** theo mốc ENOSPC; < 67 s theo mốc probe). Xem §1.2, F-165-T9-1.
- **Balloon 2 EPISODE MỚI, mỗi episode 1 chuỗi, 0 sag — KHÔNG có vấn đề tách/nhập:** **E-166: 22 mẫu, 21:44:53–22:05:53Z, boot #69, đứt KHÔNG quan sát được** (reboot #70 cắt ngang; mẫu cuối vẫn ghim, 28 s sau btime #70 — nhãn boot cũ, xem F-165-T9-4). **E-167: 36 mẫu, 22:16:28–22:51:29Z, boot #70, CHƯA đứt lúc đóng** (vẫn ghim ở mẫu cuối phiên; kết cục thuộc T9-166). Giữa hai episode: reboot #70 + balloon xả sâu về 5.020.792 kB (77,9% trần) rồi leo lại 10 mẫu tới trần. **Tổng ghim 58/134 mẫu (43,3%).** Xem §2.2.
- **RAM:** sampler **134 mẫu, 20:38:51Z–22:51:29Z, HAI boot (#69: 88 mẫu; #70: 46 mẫu)**. Max **3.652.376 kB (3.566,8 MiB = 58,05% guard) lúc 20:47:52Z** trên #69; min **248.768 kB lúc 21:24:52Z** (trong lúc kẹt 86n2 của T8; T8 đo độc lập 253 MB @21:24:43Z — khớp trong cadence 60 s); mean toàn phiên **955.267,4 kB — tính bằng 2 cách độc lập (python + awk) KHỚP NHAU và khớp trung bình có trọng số — KHÔNG lặp F-163-T9-1**. Gate A **36/134 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ mười chín liên tiếp.** Xem §2, §3.
- **B2: 18 spike, 15 QUY ĐƯỢC DRIVER CỤ THỂ + 3 load1 dư.** Bão mở đợt + T4 attempt1: 8 spike (20:44:21–20:48:28Z — mask_anim/ffmpeg/demo_effects/demo_textfx của T1 + find T2 + t5-stats + test-xvfb-lock T4; 6 spike TRONG cửa sổ attempt1, KHÔNG spike nào do chính WebKit của attempt gây); T4 attempt2 HỢP LỆ #30: **0 spike trong cửa sổ** (sạch — khác đợt 164 có 2 spike); O8: **3 spike TRONG cửa sổ O8** (21:09:34Z WebKit + 21:10:09Z/21:10:45Z Chromium — cả ba do chính O8 gây); harness: **7 spike TRONG cửa sổ harness** (5 do Chromium 85m4/86n2 + 2 load1 dư); **0 spike trong cửa sổ ghim E-166/E-167; 0 spike trong cửa sổ kẹt 86n2 (21:15:36–21:30:37Z); 0 spike trên boot #70.** Delta tick lớn nhất 139 tick/s (ffmpeg). Xem §2.5.
- **Lượt yên WebKit #34 (T4): CÓ LƯỢT HỢP LỆ #30 — chuỗi lượt yên hợp lệ NỐI DÀI (#22 → … → #29 → #30).** Attempt1-#69 (20:42:07–20:47:02Z) KHÔNG HỢP LỆ (lớp B vi phạm B1 load5 cuối 3,13 + B2 load1 max 6,77 + tickCost median 90,0 ms > 60); attempt2-#69 (20:53:05–20:56:59Z) ĐẠT (20/20, lớp B 5/5, tickCost median 43,0 ms ≤ 60). Sampler T9 đối chiếu: attempt2 gate A MỞ 4/4, 0 spike B2 trong cửa sổ. Xem §2.3.
- **REBOOT #70 GIỮA PHIÊN (d1ddd946, btime 22:05:25Z; gap #69→#70 = 6.954 s):** sampler + watcher + probe-loop **CHẾT theo reboot** (điểm yếu (d) đợt 148 tái diễn lần thứ ba liên tiếp); khoảng trống phủ sóng trong log **35 s** (22:05:53Z → 22:06:28Z); T9 khởi động lại cả ba lúc 22:06:28Z (boot+63s) và bắt được cửa sổ thoáng headroom ở boot+63s bằng probe tay. (m) #70 thuộc T2-166 (T2-165 đóng trước #70); kết cục run 165 thuộc T7-165. Xem §5.
- **REBOOT #69 GIỮA HAI ĐỢT (9a1a9319, btime 20:09:31Z; gap #68→#69 = 7.381 s):** T0-165 xác nhận đầy đủ 9 nguồn, btime là giờ thật; run 164 SUCCEEDED 20:28:17Z sau khi bị viết lại lần 2 tại #69 (requeue 20:10:06.432Z = btime +35,432 s, TRONG dải dương 33–49,8 s — (m) #69 thuộc T7-165/T2-165).
- **ENOSPC THẬT TRONG JOURNAL: ≥63 dòng trên boot #69 (cận dưới — phần sau 21:38:51Z mất theo reboot #70, KHÔNG cộng số ước) + 1 dòng trên boot #70 = ≥64 dòng đếm được (cận dưới). Đợt thứ mười bốn liên tiếp bảng watch cạn gây lỗi thật thấy được.** Điểm mới: trên #70 chỉ có ĐÚNG 1 dòng ENOSPC cả boot (22:07:09Z, boot+104s) vì headroom ổn định ở 2 — systemd thêm được watch; đối chứng với #69 (headroom 0 suốt, ENOSPC nhịp ~70 s). Xem §4.
- **T8-165 (đối chiếu):** O8 PASS 3/3 QUA GATE CHUẨN ĐƯỜNG (a) (GATE-FOUND poll=29 lúc 21:07:35Z; O8 DONE 21:10:55Z); harness 5/6 + 1 KẸT WebKit 86n2 P4-lần3 exit=124 (21:15:36–21:30:37Z, đóng băng 819 s); live-diag kích hoạt 2/2 TRONG LÚC CÓ KẸT THẬT — đối chứng dương cho điểm mù F-158-T8-4. Chuỗi WebKit FULL PASS 18 → 19? (T8 đề xuất LÊN 19 — chờ T10/parent phán). Xem §5.3.
- **T7-165 (đối chiếu):** run 164 SUCCEEDED 20:28:17Z (T0-165 đọc DB); run 165 vẫn running lúc T9 đóng — kết cục thuộc T7-165 (T7 chưa đóng cờ lúc T9 đóng). Xem §5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round165-t9/k8-headroom.py` (copy y nguyên từ đợt 164 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 165 (14 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 20:39:01Z 21/11 | **0** | #69 9a1a9319 (btime 20:09:31Z) | 63.747 | lần đo 1, lúc mở (boot+1770s); RAM 627.836 kB, balloon 6.247.216 kB (96,9% trần); ENOSPC-count=11 (dòng đầu 20:11:24Z, boot+113s) |
| 20:39:01Z 21/11 | **0** | #69 9a1a9319 | 63.747 | lần đo 2 (chênh **0** so với lần 1) |
| 21:08:51Z 21/11 | **0** | #69 9a1a9319 | 63.747 | lần đo 3–4, probe-loop lan-2; ENOSPC-count=37 (dòng mới nhất 21:08:02Z); balloon 5.225.176 kB |
| 21:08:51Z 21/11 | **0** | #69 9a1a9319 | 63.747 | lần đo 4 (chênh **0**) |
| 21:38:51Z 21/11 | **0** | #69 9a1a9319 | 63.747 | lần đo 5–6, probe-loop lan-3; ENOSPC-count=63 (dòng mới nhất 21:38:12Z); balloon 5.763.932 kB |
| 21:38:51Z 21/11 | **0** | #69 9a1a9319 | 63.747 | lần đo 6 (chênh **0**) |
| 22:06:28Z 21/11 | **30.001** | #70 d1ddd946 (btime 22:05:25Z) | 63.747 | lần đo 7, cặp cửa sổ (boot+63s); **chạm CAP 30.000 — không gặp ENOSPC**; RAM 1.878.336 kB, balloon 5.020.792 kB |
| 22:06:28Z 21/11 | **30.001** | #70 d1ddd946 | 63.747 | lần đo 8, cặp cửa sổ (boot+~63s); **chạm CAP 30.000** |
| 22:07:35Z 21/11 | **0** | #70 d1ddd946 | 63.747 | lần đo 9, window-map-1 (boot+130s); **cửa sổ ĐÃ ĐÓNG**; ENOSPC-count vẫn 1 (dòng ENOSPC đầu tiên trên #70 lúc 22:07:09Z, boot+104s) |
| 22:09:05Z 21/11 | **2** | #70 d1ddd946 | 63.747 | lần đo 10, window-map-2 (boot+220s); ENOSPC-count=1 (không tăng) |
| 22:36:28Z 21/11 | **2** | #70 d1ddd946 | 63.747 | lần đo 11–12, probe-loop lan-2 (sau khởi động lại); balloon ĐANG GHIM TRẦN (E-167), RAM 591.004 kB; ENOSPC-count=1 |
| 22:36:28Z 21/11 | **2** | #70 d1ddd946 | 63.747 | lần đo 12 (chênh **0**) |
| 22:51:41Z 21/11 | **2** | #70 d1ddd946 | 63.747 | lần đo 13–14, đóng phiên (boot+2776s); balloon ĐANG GHIM TRẦN (E-167), RAM 569.744 kB; ENOSPC-count=1 |
| 22:51:41Z 21/11 | **2** | #70 d1ddd946 | 63.747 | lần đo 14 (chênh **0**) |

- Probe dừng ở `i=0` trong 7/14 lần đo; dừng ở `i=2` trong 5 lần đo; chạm CAP 30.000 trong 2 lần đo (cặp cửa sổ 22:06:28Z — đúng cơ chế dừng của probe, không phải sự cố; stderr `CAP 30000 reached without ENOSPC`). File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi cặp đo / mỗi lần map).
- **Cửa sổ thoáng sau reboot (boot #70): MỞ lúc boot+63s (≥30.001), ĐÓNG trước boot+130s (0).** ENOSPC đầu tiên trên #70 lúc 22:07:09Z (boot+104s) — bảng watch đã đầy trở lại vào lúc đó, nên cửa sổ thực nằm trong khoảng boot+63s → boot+104s (**< 41 s** theo mốc ENOSPC; < 67 s theo mốc probe). So với đợt 163 (< 40 s: boot+71s → boot+110s) và đợt 164 (< 31 s: boot+81s → boot+112s): mốc ENOSPC đợt này (< 41 s) rộng hơn một chút vì lần map đầu (boot+130s) muộn hơn lần map đầu đợt 164 (boot+112s) — T9 ghi đúng mốc đo, không ép số cho khớp chuỗi. Giá trị đỉnh thật của cửa sổ không biết được (probe cap 30.000 — chỉ biết ≥30.001; xem F-163-T9-1, vẫn đứng).
- **Cửa sổ thoáng sau reboot #69: KHÔNG QUAN SÁT ĐƯỢC (xem F-165-T9-1).** Đợt mở 20:35:51Z (boot+1.620s), T9 nhận việc 20:38:37Z (boot+1.726s), lần đo đầu 20:39:01Z (boot+1.770s) đã là 0. ENOSPC đầu tiên trên #69 lúc 20:11:24Z (boot+113s) — nếu có cửa sổ thì nó đã đóng trong khoảng boot+0s → boot+113s, trước khi T9 kịp đo gần 28 phút. T9 không claim cửa sổ #69 có hay không. (Khoảng trống phủ sóng đầu phiên 1.760 s — xem F-165-T9-2.)
- **So sánh với đợt 164:** đợt 164 mở 0 trên #67 (2 lần đo đều 0) → reboot #68 giữa phiên → thoáng ≥30.001 trong <31 s → 0 (3 lần) → **1, 2 (lan-2/lan-3 — headroom nhích lên 1–2 trong lúc E-165 đang ghim, ENOSPC im 53 phút)** → 0 (4 lần đo tới đóng). Đợt này mở 0 trên #69 (6 lần đo đều 0, ENOSPC nhịp ~70 s suốt) → reboot #70 giữa phiên → thoáng ≥30.001 trong <41 s → 0 (1 lần, boot+130s, đúng lúc chuyển tiếp) → **2 ổn định 5 lần đo tới đóng (boot+220s → boot+2776s)**. **Cửa sổ thoáng sau reboot ĐƯỢC quan sát lần thứ ba liên tiếp** (đợt 163 + 164 + 165) — cả ba lần đều nhờ reboot xảy ra GIỮA phiên nên T9 có mặt đúng lúc.
- Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 2 = **63.745 watch** (bảng gần đầy, 2 slot trống) trên #70.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **2 / 1.578 ≈ 0** — một vite mới (~1.578 watch) vẫn không khởi động được.
- T5-165 KHÔNG probe lại headroom đợt này (như đợt 151–164) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 14 lần đo + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #69 có ≥63 dòng + journal boot #70 có 1 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- **Trần KHÔNG ĐỔI giữa hai boot đợt này: 63.747 trên cả #69 và #70** (đợt 164: 63.756 trên #67, 63.747 trên #68 — chênh 9; đợt này 0 chênh). T9 chỉ ghi số đo, không phán cơ chế.
- Lưu ý: lần đo 9–10 (map-70-1 0 rồi map-70-2 2, cách nhau 90 s) — giá trị 0 ở boot+130s là điểm chuyển tiếp (bảng vừa đầy lại sau cửa sổ), rồi 2 slot được nhả và giữ ổn định tới đóng. T9 ghi đúng số đo, không làm tròn hay gộp.
- Lưu ý: RAM lúc đóng (~569.744 kB) thấp hơn RAM lúc mở (~627.836 kB) trong khi headroom 0 → 2. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop lan-3/lan-4 (sau khởi động lại, dự kiến ~23:06:28Z/23:36:28Z) KHÔNG chạy — probe-loop đã dừng lúc T9 đóng (22:52:02Z); cặp probe đóng 22:51:41Z thay thế. Nhãn "probe-lan-2" xuất hiện HAI lần trong headroom-log (21:08:51Z trên #69 + 22:36:28Z trên #70 sau khởi động lại) — xem F-165-T9-7.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–164 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 163 | 0 → 30.001 (thoáng, boot+71s) → 2 | mở 14:40:24Z boot #65 1c1cf10c btime 14:34:57Z (trần 63.756): 0 ×6 (14:40:24–15:40:13Z) → sau reboot #66 16:06:45Z boot MỚI edb2acdb (trần 63.747): 30.001, 30.001 lúc boot+71s → 0, 0 lúc boot+110s/201s → 2 ×5 (16:11:36–16:52:45Z) → đóng 16:52:45Z cùng boot #66: 2, 2 (MỘT reboot giữa phiên; 15 lần đo, 8 lần 0, 2 lần 30.001, 5 lần 2) |
| 164 | 0 → 30.001 (thoáng, boot+81s) → 0 | mở 17:40:09Z boot #67 f1d4ce1a btime 17:33:27Z (trần 63.756): 0, 0 (17:40:09Z) → sau reboot #68 18:06:30Z boot MỚI 0c8a94aa (trần 63.747): 30.001, 30.001 lúc boot+81s → 0 ×3 (boot+112s/202s/212s) → 1, 2 lúc 18:37:49Z → 2, 2 lúc 19:07:49Z → 0 ×4 (19:37:49–19:53:55Z) → đóng 19:53:55Z cùng boot #68: 0, 0 (MỘT reboot giữa phiên; 15 lần đo, 9 lần 0, 1 lần 1, 3 lần 2, 2 lần 30.001) |
| **165** | **0 → 30.001 (thoáng, boot+63s) → 2** | **mở 20:39:01Z boot #69 9a1a9319 btime 20:09:31Z (trần 63.747): 0 ×6 (20:39:01–21:38:51Z) → sau reboot #70 22:05:25Z boot MỚI d1ddd946 (trần 63.747): 30.001, 30.001 lúc boot+63s → 0 lúc boot+130s → 2 ×5 (boot+220s → boot+2776s) → đóng 22:51:41Z cùng boot #70: 2, 2 (MỘT reboot giữa phiên; 14 lần đo, 7 lần 0, 5 lần 2, 2 lần 30.001)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 2**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 2** (lần đầu đóng 2 kể từ đợt 163; xen giữa đợt 164 đóng 0). Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**. Giá trị 30.001 chỉ xuất hiện trong cặp cửa sổ boot+63s trên #70, không phải giá trị ổn định (cửa sổ đóng trước boot+130s).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, thấp hơn ngưỡng 1.800, lần thứ hai mươi lăm liên tiếp** (tính theo giá trị ổn định lúc đóng). Quyết parent đợt 163 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal hai boot đợt này có ≥63 + 1 = ≥64 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ mười bốn liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng — T9 đếm trực tiếp 35 dòng boot #68 + ghi số đếm T5 18 dòng boot #67; đợt 165: ≥64 dòng — T9 đếm trực tiếp, xem §4). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong từng boot** (63.747 trên #69 suốt 6 lần đo; 63.747 trên #70 suốt 8 lần đo) và **KHÔNG ĐỔI giữa hai boot** (63.747 = 63.747 — lần đầu tiên kể từ đợt 162 hai boot liên tiếp có cùng trần). T9 ghi đúng số đo từng boot, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.124.900 kB trên #69 / 8.124.896 kB trên #70 — xem ghi chú; swap 1.048.572 kB) — sampler 134 mẫu, 20:38:51Z–22:51:29Z, HAI boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.124.900 kB ở mẫu đầu #69 và 8.124.896 kB ở #70 (chênh 4 kB giữa hai boot — T9 ghi đúng số đọc được, không phán; mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên (bão mở đợt) → balloon leo đều → O8 + harness (kẹt 86n2, RAM trũng nhất phiên) → balloon ghim trần E-166 (22 mẫu) → REBOOT #70 cắt ngang → cửa sổ thoáng headroom → balloon leo lại → ghim trần E-167 (36 mẫu, chưa đứt lúc đóng)

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log 61 s; 0 gap >90 s trong log** — xem §5.1; khoảng trống phủ sóng ĐẦU PHIÊN 1.760 s tính từ btime #69 tới khi T9 khởi động sampler — xem F-165-T9-2). **134 mẫu, 20:38:51Z–22:51:29Z, HAI boot (#69: 88 mẫu; #70: 46 mẫu).** Tổng quan: **min 248.768 kB (242,9 MiB) lúc 21:24:52Z** (trong lúc kẹt 86n2, balloon 96,5% trần, trên #69); **max 3.652.376 kB (3.566,8 MiB) lúc 20:47:52Z — 58,05% guard** (balloon xả 2.804.416 kB); **mean toàn phiên 955.267,4 kB (932,9 MiB) — tính bằng 2 cách độc lập (python + awk) KHỚP NHAU và khớp trung bình có trọng số (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 20:38:51–20:47:52Z | #69 | 643.180–3.652.376 kB | Mở phiên: BÃO MỞ ĐỢT (8 spike B2 liên tục, load1 tới 6,67 — xem §2.5); T4 attempt1 (20:42:07–20:47:02Z, KHÔNG HỢP LỆ tickCost 90,0 ms); balloon xả từ 6.247.216 kB (mẫu đầu, 96,9% trần) xuống 2.804.416 kB lúc 20:47:52Z rồi leo lại; gate A MỞ 8/10 mẫu; load1 ≥3,0 ở 4/10 mẫu; RAM max phiên 20:47:52Z (3.652.376 kB, balloon xả sâu nhất phiên) |
| 20:48:52–20:56:52Z | #69 | 1.460.304–3.281.400 kB | Sau attempt1 + T4 attempt2 HỢP LỆ #30 (20:53:05–20:56:59Z, tickCost 43,0 ms — xem §2.3); balloon xả sâu 3.612.588–4.790.784 kB (56,1–74,3% trần); gate A MỞ 9/9 mẫu; load1 ≥3,0 ở 0/9 mẫu; **0 spike B2 trong cửa sổ attempt2** |
| 20:57:52–21:10:52Z | #69 | 798.544–3.178.104 kB | Trước O8 + O8 (GATE-FOUND 21:07:35Z, O8 DONE 21:10:55Z — 3 spike B2 trong cửa sổ, xem §2.5); balloon leo từ 4.104.532 kB lên 5.866.080 kB (91,0% trần lúc 21:07:52Z); gate A MỞ 11/14 mẫu; load1 ≥3,0 ở 2/14 mẫu |
| 21:11:52–21:38:53Z | #69 | 248.768–1.510.508 kB | Harness (21:11:42–21:38:24Z) + **KẸT WebKit 86n2 P4-lần3** (21:15:36–21:30:37Z, đóng băng 819 s — xem §2.3); **RAM min phiên 248.768 kB lúc 21:24:52Z** (trong lúc kẹt, balloon 96,5% trần — T8 đo độc lập 253 MB @21:24:43Z, khớp trong cadence 60 s); **RAM <512.000 kB: 7 mẫu trong cửa sổ này** (21:20:52–21:24:52Z + 21:28:52Z + 21:29:53Z — cả 7 đều lúc balloon 92–97% trần, chưa ghim); gate A MỞ 2/28 mẫu; load1 ≥3,0 ở 5/28 mẫu |
| 21:39:53–22:05:53Z | #69 | 439.120–964.648 kB | Leo tới trần + **ghim E-166, 22 mẫu, 1 chuỗi** (xem §2.2); **RAM <512.000 kB: 22 mẫu trong cửa sổ này** (toàn bộ chuỗi ghim — RAM min trong chuỗi 439.120 kB lúc 21:45:53Z); gate A ĐÓNG cả 27 mẫu cửa sổ; load1 ≤2,13; reboot #70 cắt ngang lúc 22:05:25Z (mẫu cuối 22:05:53Z vẫn ghim — xem F-165-T9-4) |
| 22:06:28–22:51:29Z | #70 | 545.400–1.897.016 kB | Boot mới: cửa sổ thoáng headroom (boot+63s, xem §1.2); balloon leo từ 5.020.792 kB (77,9% trần) lên trần trong 10 mẫu rồi **ghim E-167, 36 mẫu, 1 chuỗi, CHƯA đứt lúc đóng** (xem §2.2); **RAM <512.000 kB: 0 mẫu trong cửa sổ này** (RAM min 545.400 kB lúc 22:48:29Z, trong lúc ghim); gate A MỞ 6/46 mẫu; load1 ≤2,69; **0 spike B2 trên boot #70** |

- **Gate A ≥1024 MiB: 36/134 mẫu** (#69: 30/88; #70: 6/46); **0 mẫu ≥ guard**; load1 max (sampler) **6,67 lúc 20:45:51Z** (bão mở đợt — watcher bắt 6,66 lúc 20:47:17Z, xem §2.5); **11/134 mẫu load1 ≥3,0** (phân bổ theo giai đoạn: 4 + 0 + 2 + 5 + 0 + 0 = 11 — xem bảng trên). **RAM <512.000 kB: 29 mẫu** (7 trong lúc kẹt 86n2 + 22 trong chuỗi ghim E-166 — xem danh sách cuối §2.1); **RAM <300.000 kB: 2 mẫu** (21:23:52Z 291.536 kB; 21:24:52Z 248.768 kB — lần đầu có mẫu <300.000 kB kể từ đợt 158: 4 mẫu; đợt 159–164: 0 mẫu).
- Swap: SwapFree 658.292 kB (mẫu đầu) → 599.824 kB (thấp nhất phiên, lúc 21:08:52Z) → 1.039.968 kB (mẫu đầu #70, 22:06:28Z). Nhịp nhảy SwapFree qua reboot #70: 633.756 kB (mẫu cuối trước reboot, 22:04:53Z) → 1.039.968 kB (mẫu đầu #70, 22:06:28Z) — swap được nhả ~406.212 kB qua reboot (đợt 164: 691.444 → 1.039.968 kB qua reboot #68 — T9 ghi số đợt 164 theo LIMITS T9-164, không verify lại).
- Mẫu 20:47:52Z (đỉnh phiên): RAM 3.652.376 kB, balloon xả 2.804.416 kB — balloon xả sâu nhất phiên ~5 phút sau bão mở đợt (cùng mẫu đợt 152–164: xả sâu sau attempt / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 248.768 kB (đợt 164: 309.116 kB; đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — 29 mẫu <512.000 kB trong 134 mẫu (21,6% — cao hơn hẳn đợt 164: 9 mẫu, 6,7%, vì đợt này ghim nhiều hơn: 58 mẫu so với 35 mẫu); riêng trong cửa sổ ghim E-166: 22/22 mẫu <512.000 kB (100%); trong cửa sổ ghim E-167: 0/36 mẫu <512.000 kB (RAM trong lúc ghim E-167 cao hơn hẳn E-166: min 545.400 kB so với 439.120 kB). T8-165 đo độc lập RAM trong lúc O8/harness: xem §5.3 (sampler T9 là nguồn duy nhất cho trũng ghim).

**Bảng tổng hợp số RAM (từ script `t9-165-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 134 dòng — KHÔNG tính tay, đã đối chiếu lại từ log đóng băng lúc đóng cờ bằng script `t9-165-recheck.py`):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #69 9a1a9319 | 88 | 248.768 | 3.652.376 | 1.082.534,0 | 30/88 | 22 | 6,67 | 29 |
| #70 d1ddd946 | 46 | 545.400 | 1.897.016 | 711.800,9 | 6/46 | 36 | 2,69 | 0 |
| **Toàn phiên** | **134** | **248.768** | **3.652.376** | **955.267,4** | **36/134** | **58/134 (43,3%)** | **6,67** | **29** |

- **Mean toàn phiên 955.267,4 kB — tính bằng 2 cách độc lập: python `sum/n = 955.267,4` VÀ awk `sum/n = 955.267,4` — KHỚP NHAU TỪNG SỐ THẬP PHÂN; đối chiếu trung bình có trọng số từ mean từng boot: (88×1.082.534,0 + 46×711.800,9)/134 = 955.267,4 — KHỚP. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163). Mean từng boot cũng khớp python/awk từng số (xem §6).
- 29 mẫu RAM <512.000 kB (từ log đóng băng): 21:20:52Z 430.412 (leo 92,7%); 21:21:52Z 381.056 (leo 93,8%); 21:22:52Z 322.036 (leo 94,8%); 21:23:52Z 291.536 (leo 95,5%); 21:24:52Z 248.768 (leo 96,5% — min phiên); 21:28:52Z 463.916 (leo 92,5%); 21:29:53Z 359.840 (leo 93,8%); 21:33:53Z 510.308 (leo 85,3%); 21:44:53Z 448.460 (ghim E-166); 21:45:53Z 439.120 (ghim E-166 — min chuỗi); 21:46:53Z 487.348 (ghim); 21:47:53Z 461.868 (ghim); 21:48:53Z 471.164 (ghim); 21:49:53Z 458.148 (ghim); 21:50:53Z 471.236 (ghim); 21:51:53Z 458.504 (ghim); 21:52:53Z 458.500 (ghim); 21:53:53Z 455.748 (ghim); 21:54:53Z 470.580 (ghim); 21:55:53Z 460.276 (ghim); 21:56:53Z 453.744 (ghim); 21:57:53Z 468.620 (ghim); 21:58:53Z 469.840 (ghim); 21:59:53Z 483.788 (ghim); 22:00:53Z 470.644 (ghim); 22:01:53Z 464.808 (ghim); 22:02:53Z 470.904 (ghim); 22:03:53Z 453.580 (ghim); 22:04:53Z 474.532 (ghim).

### 2.2 Balloon virtio — 2 EPISODE MỚI E-166 + E-167, mỗi episode 1 chuỗi, 0 sag + E-165 đã đứt (đợt 164)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #69 (9a1a9319): GHIM TRẦN 22/88 mẫu (25,0%), trong 1 chuỗi — 1 EPISODE (E-166).** Balloon max quan sát trong phiên trên #69 là 6.247.216 kB (96,9% trần) lúc 20:38:51Z (mẫu đầu); xả sâu tới 2.804.416 kB (43,5% trần) lúc 20:47:52Z rồi leo lại.
  - Leo lên trần: từ 20:47:52Z (2.804.416 kB) leo đều ~1 giờ, qua 96,5% trần lúc 21:24:52Z, tới 6.390.572 kB (99,2% trần) lúc 21:43:53Z, rồi ghim chuỗi duy nhất lúc 21:44:53Z.
  - **E-166 — chuỗi duy nhất: 21:44:53–22:05:53Z, 22 mẫu** (span 1.260 s, 21 phút); RAM min trong chuỗi 439.120 kB lúc 21:45:53Z; RAM max trong chuỗi 801.096 kB lúc 22:05:53Z (mẫu cuối, sau reboot — xem F-165-T9-4); gate A ĐÓNG cả 22 mẫu.
  - **ĐỨT KHÔNG QUAN SÁT ĐƯỢC:** mẫu cuối 22:05:53Z vẫn ghim (balloon 6.443.824 kB) dù btime #70 là 22:05:25Z (28 s TRƯỚC mẫu) — reboot #70 cắt ngang giữa chuỗi; điểm đứt nằm trong khoảng (22:05:53Z, …] không quan sát được vì sampler chết theo reboot và khởi động lại 22:06:28Z với balloon đã xả về 5.020.792 kB (77,9% trần). Cùng mẫu E-164 đợt 163 (đứt không quan sát được, khoảng chứa reboot).
  - **0 sag trong E-166** — chuỗi ghim liên tục 22 mẫu, không có mẫu nào tụt khỏi trần giữa chuỗi.
- **Boot #70 (d1ddd946): GHIM TRẦN 36/46 mẫu (78,3%), trong 1 chuỗi — 1 EPISODE (E-167, CHƯA ĐỨT).**
  - Leo lên trần lần 1 trên boot mới: từ 22:06:28Z (5.020.792 kB, 77,9% trần) lên 6.371.376 kB (98,9% trần) lúc 22:15:28Z trong ~9 phút, rồi ghim lúc 22:16:28Z.
  - **E-167 — chuỗi duy nhất: 22:16:28–22:51:29Z, 36 mẫu** (span 2.101 s, 35 phút — và đang tiếp tục lúc T9 đóng); RAM min trong chuỗi 545.400 kB lúc 22:48:29Z; RAM max trong chuỗi 617.160 kB; gate A ĐÓNG cả 36 mẫu.
  - **CHƯA ĐỨT lúc đóng phiên** (mẫu cuối 22:51:29Z vẫn ghim) — kết cục E-167 thuộc T9-166.
  - **0 sag trong E-167** — chuỗi ghim liên tục 36 mẫu, không có mẫu nào tụt khỏi trần giữa chuỗi.
- **Giữa E-166 và E-167: 10 mẫu leo (22:06:28–22:15:28Z), balloon 77,9% → 98,9% trần** — KHÔNG phải sag trong một episode (khác boot, có reboot #70 ở giữa, balloon xả sâu về 77,9% — xem §2.2 cuối).
- **Tổng ghim trần đợt này: 58/134 mẫu (43,3%)** (đợt 164: 35/135 = 25,9%; đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **2 episode mới (E-166: 22 mẫu / 1 chuỗi / 1 boot, đã đứt nhưng không quan sát được; E-167: 36 mẫu / 1 chuỗi / 1 boot, chưa đứt)** — khác đợt 164 (1 episode, 3 chuỗi, 2 sag) và đợt 163 (2 episode, 2 boot, E-164 còn mở).
- **Phán theo quy tắc quyết (e)/(g) + quyết (j) đợt 163 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-166: 1 EPISODE (22 mẫu / 1 chuỗi / boot #69).** Chuỗi ghim liên tục, 0 sag — không có gì để tách. Đứt không quan sát được chính xác (reboot #70 cắt ngang) — cùng mẫu E-164 đợt 163; T9 không claim điểm đứt.
  - **E-167: 1 EPISODE (36 mẫu / 1 chuỗi / boot #70, chưa đứt).** Chuỗi ghim liên tục, 0 sag — không có gì để tách. Chưa đứt lúc đóng — kết cục thuộc T9-166.
  - **E-166 và E-167 là HAI episode riêng biệt theo BẤT KỲ tiêu chí nào** (khác boot, có reboot #70 ở giữa, balloon xả sâu về 77,9% trần, khoảng leo 10 mẫu giữa hai chuỗi) — không giống E-165 đợt 164 (3 chuỗi cùng boot, 2 sag, gate A đóng suốt → 1 episode theo tiêu chí cứng). Đợt này KHÔNG đặt ra câu hỏi tách/nhập nào: mỗi episode chỉ có 1 chuỗi.
  - **Đợt 165 = 2 EPISODE GHIM MỚI** (E-166: 22 mẫu, đứt không quan sát được; E-167: 36 mẫu, chưa đứt lúc đóng).
  - **E-165 đợt 164 (theo dõi, giao T10 ghi nhận): đã đứt hoàn toàn trước đợt 165** — mẫu đầu đợt 165 (20:38:51Z) balloon đã là 6.247.216 kB (96,9% trần, chưa ghim) và không ghim lần nào trên #69 cho tới 21:44:53Z; giữa lần ghim cuối E-165 (19:14:51Z, boot #68) và lần ghim đầu E-166 (21:44:53Z, boot #69) có **MỘT reboot #69 + balloon xả về 2.804.416 kB (43,5% trần) lúc 20:47:52Z + ~2,5 giờ không ghim**.
  - **E-166 không nối sang E-167 theo bất kỳ tiêu chí nào** (khác boot, có reboot #70 ở giữa, xả sâu 77,9%, leo lại 10 mẫu).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim E-166 chỉ ~439–475.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ ghim E-167 (22:51:29Z): tổng RAM 8.124.896 kB − balloon 6.443.824 kB = 1.681.072 kB còn lại; MemAvailable 565.616 kB (log thật).

### 2.3 Lượt yên WebKit #34 (T4, đợt 165) — CÓ LƯỢT HỢP LỆ #30, CHUỖI NỐI DÀI (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-165 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND165_T4_WEBKIT_QUIET34_LIMITS.md`) + cờ `round165-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Attempt1-9a1a9319 (20:42:07–20:47:02Z): probe 20/20, lớp B VI PHẠM (B1 load5 cuối 3,13 > 2,5 VÀ B2 load1 max 6,77 > 4) + tickCost median 90,0 ms > 60 — KHÔNG HỢP LỆ, KHÔNG cộng dồn.**
- **Attempt2-9a1a9319 (20:53:05–20:56:59Z): probe 20/20, lớp B 5/5 SẠCH, tickCost median 43,0 ms ≤ 60 — HỢP LỆ, ngân sách 3/3 dùng 2/3 theo nghĩa attempt-done; poller thoát vì LUOT HOP LE.**
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): CÓ 1 attempt hợp lệ cho lượt yên #34 (#30)** — chuỗi lượt yên hợp lệ **NỐI DÀI lên #30** (#22 đợt 157 → #23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161 → #27 đợt 162 → #28 đợt 163 → #29 đợt 164 → #30 đợt 165).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1-#69: gate A MỞ **6/6 mẫu** trong cửa sổ (các mẫu 20:42:51Z 1.439.920 kB; 20:43:51Z 1.362.860 kB; 20:44:51Z 1.666.096 kB; 20:45:51Z 2.389.648 kB; 20:46:51Z 2.804.108 kB; 20:47:52Z 3.652.376 kB — cả 6 đều ≥1024 MiB). Tải: sampler load1 trong cửa sổ attempt1 **0,44–6,67**; **6 spike B2 trong cửa sổ attempt1** (20:44:21Z mask_anim delta 100; 20:44:57Z mask_anim delta 80; 20:45:31Z ffmpeg delta 75; 20:46:07Z load1 dư; 20:46:41Z ffmpeg delta-miss + analyze-t4 delta 47; 20:47:17Z find delta 43 + ffprobe delta-miss — xem §2.5). **KHÔNG spike nào trong 6 spike này do chính WebKit của attempt gây** (WebKit/MiniBrowser xuất hiện 0 lần trong cửa sổ attempt1; tải đến từ T1 suite + T2 find + T5 stats). T4 ghi B2 load1 max 6,77 trong attempt1 — khớp watcher T9 (load1 max 6,66 trong cửa sổ, sampler 6,67) trong sai số sampler khác nhau.
  - Attempt2-#69 (HỢP LỆ #30): gate A MỞ **4/4 mẫu** trong cửa sổ (20:53:52Z 1.460.304 kB; 20:54:52Z 1.701.388 kB; 20:55:52Z 1.582.456 kB; 20:56:52Z 2.252.960 kB — cả 4 đều ≥1024 MiB).
  - Tải: sampler load1 trong cửa sổ attempt2-#69 **0,77–2,42**; **0 spike B2 trong cửa sổ attempt2-#69**. **KHÁC đợt 164 (2 spike trong cửa sổ attempt hợp lệ): đợt này attempt hợp lệ SẠCH HOÀN TOÀN — verdict HỢP LỆ của T4 càng vững.**
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cả hai cửa sổ attempt**.
- **Cộng dồn mới (30 lượt hợp lệ, theo T4-165): P1 117/120, P2 111/111, P3-A1 101/120, P3' 84/92 occ = 78/81 distinct-seq, P7 64/64.** T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy attempt1 20:42:07–20:47:02Z + attempt2-#69 20:53:05–20:56:59Z.

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 20:42:51–20:47:52Z | #69 | 0,44–6,67 (6 mẫu) | 1.362.860–3.652.376 kB — **gate A MỞ 6/6** | T4 attempt1 — **6 spike B2 trong cửa sổ** (20:44:21Z + 20:44:57Z + 20:45:31Z + 20:46:07Z + 20:46:41Z + 20:47:17Z, xem §2.5); attempt1 KHÔNG HỢP LỆ (B1 load5 cuối 3,13 > 2,5 + B2 load1 max 6,77 > 4 + tickCost median 90,0 ms > 60) |
| 20:53:52–20:56:52Z | #69 | 0,77–2,42 (4 mẫu) | 1.460.304–2.252.960 kB — **gate A MỞ 4/4** | T4 attempt2-#69 — **0 spike B2 trong cửa sổ**; attempt2 HỢP LỆ #30 (tickCost median 43,0 ms ≤ 60) |

### 2.5 B2 — 18 spike, 15 QUY ĐƯỢC DRIVER CỤ THỂ + 3 load1 dư (0 spike trong cửa sổ ghim E-166/E-167; 0 spike TRONG cửa sổ attempt hợp lệ #30; 3 spike TRONG cửa sổ O8 — cả ba do chính O8 gây; 7 spike TRONG cửa sổ harness)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-165-T9-6). **18 spike: 8 spike bão mở đợt + attempt1 T4 (20:44:21–20:48:28Z) + 3 spike O8 (21:09:34–21:10:45Z) + 7 spike harness (21:33:21–21:36:53Z); 0 spike trong cửa sổ ghim E-166 (21:44:53–22:05:53Z) và E-167 (22:16:28–22:51:29Z); 0 spike trong cửa sổ kẹt 86n2 (21:15:36–21:30:37Z); 0 spike trên boot #70.**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — bão mở đợt + T4 attempt1 (8 spike liên tục) | 20:44:21–20:48:28Z | 3,56 → 6,66 → 3,63 | 8 | 20:44:21Z: mask_anim.py delta **100** (100,0% top tức thời); 20:44:57Z: mask_anim.py delta **80** + t5-stats-165.py delta 18 + find T2 delta 10 + hatch 25; 20:45:31Z: ffmpeg delta **75** (ffv1 encode, con của mask_anim) + t5-stats 34; 20:46:07Z: **load1 dư** (delta max 17 — xem dưới); 20:46:41Z: ffmpeg delta-miss (81,8% top tức thời) + analyze-t4-skiplatest.py delta **47**; 20:47:17Z: find T2 delta **43** + ffprobe delta-miss (33,3% ps top); 20:47:52Z: ffmpeg testsrc2 geq delta **139**; 20:48:28Z: ffmpeg testsrc2 geq delta **129** | **Bão mở đợt 165: T1 verify suite 164 (mask_anim/ffmpeg/demo_effects/demo_textfx) + T2 điều tra + T5 stats/replay + T4 attempt1 — nhiều luồng mở cùng lúc trên boot mới** (cùng mẫu đợt 163/164). Load1 max đợt **6,66 lúc 20:47:17Z** (watcher; sampler bắt 6,67 lúc 20:45:51Z). **6/8 spike NẰM TRONG cửa sổ attempt1** (20:44:21Z–20:47:17Z); 2 spike cuối (20:47:52Z + 20:48:28Z) nằm SAU khi attempt1 kết thúc (20:47:02Z) 50 s / 86 s. **KHÔNG spike nào do chính WebKit của attempt gây** |
| 2 — T8 O8 | 21:09:34Z + 21:10:09Z + 21:10:45Z | 3,83 / 3,16 / 3,35 | 3 | 21:09:34Z: WebKitWebProcess delta **64** + MiniBrowser delta 32 (O8 WebKit attempt2); 21:10:09Z: chrome delta **70** + vite 19 (O8 Chromium); 21:10:45Z: chrome renderer delta **83** (O8 Chromium) | **T8 O8** — cả ba spike NẰM TRONG cửa sổ O8 (GATE-FOUND 21:07:35Z → O8 DONE 21:10:55Z); driver là chính process O8, không phải tải lạ (cùng mẫu đợt 163: 2 spike O8 do chính O8 gây; đợt 164: 3 spike; đợt này O8 gây 3 spike) |
| 3 — T8 harness | 21:33:21–21:36:53Z | 4,15 / 3,93 / 3,83 / 4,67 / 4,62 / 4,99 / 3,25 | 7 | 21:33:21Z: chrome gpu-process delta **98** + renderer 31 (Chromium 85m4); 21:33:56Z: chrome gpu delta **98** + renderer 30 (Chromium 85m4); 21:34:31Z: **load1 dư** (delta max 6 — xem dưới); 21:35:07Z: chrome gpu delta **89** + renderer 30 (Chromium 86n2); 21:35:42Z: chrome gpu delta **73** + renderer 29 (Chromium 86n2); 21:36:17Z: chrome gpu delta **97** + renderer 34 (Chromium 86n2); 21:36:53Z: **load1 dư** (delta max 6, top -b 95,1% idle — xem dưới) | **T8 harness Chromium** — cả 7 spike NẰM TRONG cửa sổ harness (21:11:42–21:38:24Z); 5 spike do chính process harness, 2 spike load1 dư. Kẹt 86n2 (21:15:36–21:30:37Z) có **0 spike** trong cửa sổ kẹt — kẹt xảy ra lúc tải thấp (T8: load 0,89/1,52/1,39 lúc stall) |

- **Tổng kết đếm: 15/18 spike có driver process cụ thể + 3 spike lớp "load1 dư"** (20:46:07Z; 21:34:31Z; 21:36:53Z — xem dưới). Đợt 164: 30/36 quy được + 6 load1 dư; đợt 163: 17/18 quy được + 1 load1 dư; đợt 162: 17/17 quy được; đợt 161: 3/3 quy được; đợt 160: 13/15 quy được + 2 load1 dư. Đợt này tỉ lệ load1 dư 3/18 = 16,7% (bằng đợt 164).
- **3 spike load1 dư (định nghĩa: delta tick max ≤ 15 trong 1 s, không process nào đủ tải để giải thích load1 ≥ 3,0 — theo đúng tiền lệ đợt 160/163/164; xem F-165-T9-5 cho trường hợp 20:46:07Z):**
  - 20:46:07Z, load1 5,86 (TRONG cửa sổ attempt1): top tức thời chỉ có hatch daemon 20,0% + find D-state 10,0%; delta tick max **17** (hatch daemon); %Cpu: 48,8% idle + 18,6% iowait; node test-xvfb-display-lock (25,5% tích lũy trong ps top) delta **0** — không chạy trong giây đo. Không có process nào đủ tải — **load1 dư** (tải là dư âm của bão 20:44–20:45Z + iowait; xem F-165-T9-5).
  - 21:34:31Z, load1 3,83 (TRONG cửa sổ harness, 13 s sau khi Chromium 85m4 kết thúc 21:34:18Z, 3 s trước khi Chromium 86n2 bắt đầu 21:34:34Z): top tức thời chỉ có hatch daemon 6,1% tích lũy + Xvfb delta 0; delta tick top-3 chỉ 6 + 1 + 0. Không có process nào đủ tải — **load1 dư** — không gán cho harness.
  - 21:36:53Z, load1 3,25 (TRONG cửa sổ harness, lúc Chromium 86n2 đang chạy): top tức thời chỉ có hatch daemon 10,0% + hatch-execd 10,0%; **top -b: 95,1% idle, 1 task running**; delta tick top-3 chỉ 6 + 3 + 3 (chrome gpu-process 69,6% tích lũy nhưng delta **0**). Không có process nào đủ tải — **load1 dư** — không gán cho harness (gpu-process đã im trong giây đo).
  - T9 không giấu 3 spike này vào nhóm "quy được" (cùng mẫu F-163-T9-9).
- **Caveat đếm (F-165-T9-6):** 2 spike delta-miss (pid chết giữa chừng trong vòng delta 1 s): spike 20:46:41Z (ffmpeg 86,8% tích lũy, 81,8% top tức thời, delta mất) và spike 20:47:17Z (ffprobe 33,3% tích lũy, delta mất) — quy driver bằng ps top tức thời + top -b, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163) và F-164-T9-7 (1 spike đợt 164). `grep -c 'WebKit\|MiniBrowser'` = **6 dòng** (spike O8 21:09:34Z — WebKit xuất hiện trong 1/18 spike). `ps -eo args` của chính watcher: **0 dòng** trong b2-spikes-FROZEN.log — fix (n) đợt 150 VẪN ĐÓNG (watcher không tự lọt top lần nào).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: spike 20:46:41Z + 20:47:17Z (xem trên). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 15 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 15/18 spike — 3 spike lớp load1 dư đợt này (1 trong bão mở đợt lúc iowait cao, 2 trong cửa sổ harness lúc Chromium đã im).
- **Delta tick lớn nhất đợt: 139 tick/s** (ffmpeg testsrc2 geq, spike 20:47:52Z, load1 4,60); mask_anim.py 100 tick/s (20:44:21Z); chrome gpu-process 98 tick/s (21:33:21Z + 21:33:56Z). (Đợt 164: max 126 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 20:38:54Z CÙNG lúc sampler (khác đợt 163: watcher mở muộn 67 s sau sampler) — **0 khoảng mù đầu phiên đợt này**; spike đầu tiên watcher bắt được là 20:44:21Z (5m27s sau khi mở — trước đó load1 < 3,0). **Khoảng mù duy nhất: reboot #70 giết watcher, khởi động lại 22:06:28Z (gap 35 s cùng sampler — xem §5.1)** — **0 spike trên boot #70** (load1 max sampler 2,69; watcher không bắt được spike nào trong 45 phút sau khởi động lại). **0 gap phủ sóng watcher nào khác trong phiên.**

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg/ffprobe/mask_anim.py xuất hiện trong 6 spike của bão mở đợt** (mask_anim ellipse + ffmpeg ffv1/testsrc2/geq/effect-noise — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 2 spike delta-miss 20:46:41Z/20:47:17Z — xem §2.5). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T2 điều tra + T5 stats + T4 attempt-setup + T8 O8/harness + hatch daemon; **6 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log — 1 spike O8, đã quy driver ở §2.5**).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ mười chín liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt (xem F-165-T9-2 về gap phủ sóng đầu phiên):** sampler `round165-t9/sampler.sh` chạy liên tục 20:38:51Z–22:51:29Z, **134 mẫu, gap trong log lớn nhất 61 s, 0 gap >90 s**; khởi động lại bằng tay 22:06:28Z (boot+63s) sau reboot #70 — khoảng trống trong log 35 s (22:05:53Z → 22:06:28Z), **0 gap >90 s trong toàn phiên kể cả qua reboot** (đợt 164: gap 57 s qua reboot #68; đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **3.652.376 kB = 58,05% guard** (đợt 164: 45,65%; đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). Khoảng cách tới guard lúc đỉnh: **2.639.080 kB (41,95%)**.
- **Guard giữ nguyên: 6.291.456 kB (6.144 MiB).** Không mẫu nào chạm 6.144 MiB — cơ chế (a) **armed** (sampler chạy liên tục) và **KHÔNG kích hoạt** suốt 2h12m.
- **0 lần thử birefnet trong đợt 165 — lần thứ mười chín liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0; đợt 165: 0). **Chuỗi 0 lần thử: 19 đợt liên tiếp** (đợt 147–165).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 19 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round165-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `bin/python3.11`); `bgremove.py` **23.500 B** (không đổi so với đợt 164); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-165-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt (xem F-165-T9-2 về gap đầu phiên).**
- **Không cần chạy lại birefnet trong đợt 165** (guard chưa từng mở; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (boot #69 ≥63 dòng + boot #70 = 1 dòng; tổng ≥64 dòng, cận dưới — đợt thứ mười bốn liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#69** (9a1a9319, btime 20:09:31Z): **≥63 dòng** (T9 đếm trực tiếp: 11 dòng lúc 20:39:01Z → 37 dòng lúc 21:08:51Z → 63 dòng lúc 21:38:51Z; **phần còn lại 21:38:51Z → reboot #70 (22:05:25Z) mất theo reboot, KHÔNG cộng số ước** — journal của #69 không đọc được nữa sau #70, xem F-165-T9-2). Dòng đầu tiên trên #69 lúc **20:11:24Z (boot+113s)** — tức là ENOSPC bắt đầu ngay sau khi đợt mở (20:35:51Z là boot+1.620s — T9 mở muộn nên dòng đầu đã có từ trước khi T9 đo; xem F-165-T9-1). Nhịp ~70 s trong lúc headroom 0.
- Boot **#70** (d1ddd946, btime 22:05:25Z): **1 dòng** (T9 đếm trực tiếp từ journal lúc đóng phiên; **không cộng số ước**). Dòng duy nhất: **22:07:09Z (boot+104s)** — đúng lúc cửa sổ thoáng đóng (headroom về 0 lúc boot+130s). Sau đó **KHÔNG CÓ dòng ENOSPC nào nữa** (đếm = 1 ở cả 4 lần probe sau: 22:07:35Z, 22:09:05Z, 22:36:28Z, 22:51:41Z) — vì headroom ổn định ở 2 nên systemd thêm được watch.
- **Tổng đợt 165: ≥63 + 1 = ≥64 dòng đếm được (cận dưới)** — đợt thứ mười bốn liên tiếp có lỗi thật (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng — T9 đếm trực tiếp 35 dòng boot #68 + ghi số đếm T5 18 dòng boot #67; đợt 165: ≥64 dòng — T9 đếm trực tiếp). **Caveat: số đợt này là CẬN DƯỚI** — phần còn lại boot #69 (21:38:51Z → 22:05:25Z) mất theo reboot #70, không đếm được.
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device` (đợt 164: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 164:** đợt 164 có ≥53 dòng (boot #67 ≥18 + boot #68 35). Đợt này **≥64 dòng** — cao hơn đợt 164 dù boot #70 chỉ có 1 dòng, vì boot #69 một mình đã ≥63 dòng (headroom 0 suốt 6 lần đo, ENOSPC nhịp ~70 s không ngừng).
- **Điểm mới (giao parent/T10 xem lại quyết (g) — T9 chỉ nêu dữ kiện):** boot #70 chỉ có ĐÚNG 1 dòng ENOSPC cả boot trong khi headroom ổn định ở 2 — lần đầu tiên trong chuỗi 14 đợt một boot có đúng 1 dòng ENOSPC; và ENOSPC trở lại 0 dòng ngay sau khi headroom nhích từ 0 lên 2. Đây là **bằng chứng độc lập (ngoài probe)** rằng headroom 2 là thật (không phải lỗi probe) — systemd thêm được watch trong khoảng đó (cùng mẫu khoảng im 53 phút đợt 164 lúc headroom 1–2).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #69 + #70 — 2 reboot trong/anh quanh đợt 165 (cùng mẫu đợt 164: 2 reboot)

- **Reboot #69 (9a1a9319, btime 20:09:31Z; gap #68→#69 = 7.381 s):** xảy ra TRONG LÚC T10-164 ĐÓNG SỔ (2 s sau khi T8-164 đóng cờ 20:09:29Z, trước khi T9-164 đóng cờ 20:16:30Z). T0-165 xác nhận đầy đủ 9 nguồn, btime là giờ thật, KHÔNG nghịch lý đồng hồ. Run 164 SUCCEEDED 20:28:17Z sau khi bị viết lại lần 2 tại #69 (requeue 20:10:06.432Z = btime +35,432 s — TRONG dải dương 33–49,8 s; (m) #69 thuộc T7-165/T2-165).
- **Reboot #70 (d1ddd946, btime 22:05:25Z; gap #69→#70 = 6.954 s):** xảy ra **GIỮA PHIÊN** (22:05:25Z, 1h29m34s sau khi đợt mở). Sampler + watcher + probe-loop **CHẾT theo reboot** (điểm yếu (d) đợt 148 tái diễn lần thứ ba liên tiếp — đợt 163 chết theo #66, đợt 164 chết theo #68, đợt này chết theo #70); T9 khởi động lại cả ba bằng tay **22:06:28Z (boot+63s)** — **khoảng trống phủ sóng trong log 35 s** (22:05:53Z → 22:06:28Z), **0 gap >90 s trong toàn phiên kể cả qua reboot** (đợt 164: gap 57 s). **1 lệnh sleep-wait của T9 bị reboot #70 giết** (runtime restart recovery cho session proc_b1584784daaa — chỉ là timer chờ, không có side effect; trạng thái đã verify lại từ disk sau đó — xem F-165-T9-3).
- **Mẫu sampler cuối #69 (22:05:53Z) mang nhãn boot cũ `9a1a9319` dù btime #70 là 22:05:25Z (28 s TRƯỚC mẫu)** — cùng mẫu F-164-T9-4 (mẫu 18:06:52Z đợt 164, 22 s sau btime #68): sampler đọc boot-id từ `/proc/sys/kernel/random/boot_id` TRƯỚC khi reboot xảy ra trong cùng chu kỳ lấy mẫu, hoặc boot-id chưa cập nhật — dữ liệu mẫu vẫn đúng (RAM/balloon/load1 đo được là số thật lúc 22:05:53Z trên boot #70 mới — mem nhảy lên 801.096 kB, swapfree nhảy lên 810.820 kB, đúng dấu hiệu boot mới — chỉ nhãn boot là cũ; balloon vẫn đọc 6.443.824 kB, chưa xả kịp); xem F-165-T9-4. **T9 ghi đúng số đo, không sửa nhãn.**
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn** (T0-165 đo; T9 không đo lại).
- **Khoảng trống phủ sóng đầu phiên (F-165-T9-2):** đợt mở 20:35:51Z (boot+1.620s), T9 nhận việc 20:38:37Z (boot+1.726s), sampler khởi động 20:38:51Z (boot+1.760s) — **gap 1.760 s từ btime #69 tới khi sampler chạy** (đợt 164: gap 383 s; đợt 163: gap 113 s — đợt này gap DÀI NHẤT kể từ khi T9 ghi gap vì đợt mở muộn nhất sau reboot: 1.620 s so với 144 s đợt 164). Trong 1.760 s này: ENOSPC bắt đầu (20:11:24Z, boot+113s), balloon leo tới 96,9% trần, T0/T1/T2/T5 làm việc, T4 pre-check + gate0wait. T9 ghi gap này để T10/parent biết, không giấu.

### 5.2 T5-165 (infra) — POSTBOOT_PASS #69 ĐÃ CÓ; #70 CHƯA CÓ (thuộc T5-166); watcher-165 (giao T5-166 xác minh)

- **POSTBOOT_PASS #69 ĐÃ CÓ lúc 20:43:50Z** (boot+34m19s, replay đầy đủ — T8-165 trích; T5-165 xác nhận).
- **POSTBOOT_PASS #70 CHƯA CÓ lúc T9 đóng** (T5-165 đóng cờ trước reboot #70 22:05:25Z — T5 không có mặt lúc #70; **thuộc T5-166**).
- **Watcher-165: T9 không kiểm tra** (T5-165 sở hữu; watcher-164 vốn đã chết theo #68 từ đợt 164; watcher-165 chết theo #70 hay không — giao T5-166 xác minh lúc mở).
- **Marker: T9 không đếm lại** (T0/T5 sở hữu; T5-164 đếm 19 reboot #49–#67; #68/#69/#70 thêm vào — giao T0-166/T5-166 đếm).
- **X11 (T9 kiểm tra lúc đóng phiên 22:52Z):** `/tmp/.X11-unix/` **TRỐNG** (0 socket, 0 Xvfb đang chạy) — X199 của harness T8-164 đã bị reboot #69 xóa; T8-165 chạy trên #69 (Xvfb :199 lúc đó) cũng đã bị reboot #70 xóa. T9 không dọn gì thêm.

### 5.3 T8-165 (vite harness + O8) — ĐÃ đóng cờ lúc T9 đóng (21:40Z); GATE-FOUND qua đường (a) CHUẨN, O8 PASS 3/3, harness 5/6 + 1 KẸT 86n2

- **GATE-FOUND poll=29 lúc 21:07:35Z qua đường (a) CHUẨN** (t4=OK + postboot=`round165-t5/POSTBOOT_PASS` đường (a)) — **TRỞ LẠI ĐƯỜNG CHUẨN sau 1 đợt đi đường (b)** (đợt 164). **Chuỗi "gate FOUND đường chuẩn" 6 đợt liên tiếp (đợt 158–163) bị phá đợt 164, NỐI LẠI đợt này** — T10/parent phán hệ quả chuỗi (T9 chỉ nêu dữ kiện).
- **O8 PASS 3/3, DONE 21:10:55Z, WebKit 21/21 ×2 + Chromium 21/21** (exit 0 ×3 theo log driver — T8 LIMITS đã xuất bản; T9 không trích số chi tiết O8, thuộc T8-165/T10).
- **Harness 5/6 + 1 KẸT (21:11:42–21:38:24Z): WebKit 86n2 KẸT exit=124 tại P4-lần3** (21:15:36–21:30:37Z, đóng băng 819 s trong `resetPlayhead0` TRƯỚC `waitForPlaySync` — điểm kẹt MỚI ở 86n2, cùng chữ ký wedge H3); kẹt cộng dồn **15 → 16**; 85m4 P4-lần2 PASS (điểm kẹt đợt 164 KHÔNG tái diễn); 86n2 P4-lần2 PASS (chuỗi verdict 15 → 16); 84l10 E4 ended=false trở lại (dao động, không lập chuỗi).
- **Live-diag kích hoạt 2/2 TRONG LÚC CÓ KẸT THẬT** (21:20:36Z im lặng 127 s + 21:24:37Z im lặng 368 s) — **đối chứng dương cho điểm mù F-158-T8-4**: live-diag BẮT ĐƯỢC kẹt này vì 86n2 KHÔNG có HB128; mù CHỈ khi HB128 làm tươi mtime (85m4, đợt 164). Watchdog kích hoạt ĐÚNG 1 lần (21:17:59Z + probe 1+1 TIMEOUT 30 s).
- **Đối chiếu sampler T9 trong cửa sổ kẹt 86n2 (21:15:36–21:30:37Z): 16 mẫu, gate A MỞ 0/16**, balloon 92,5–96,5% trần (chưa ghim), load1 max 1,53 (mẫu 21:15:52Z); **RAM min trong cửa sổ kẹt 248.768 kB lúc 21:24:52Z** (T8 đo độc lập RAM avail min 253 MB @21:24:43Z — khớp trong cadence 60 s); **0 spike B2 trong cửa sổ kẹt** — kẹt xảy ra lúc tải thấp, không phải do tải ngoài.
- **Đối chiếu sampler T9 trong cửa sổ O8 (21:08:19–21:10:55Z): 3 mẫu, gate A MỞ 1/3** (chỉ mẫu 21:08:52Z 798.544 kB thấp hơn gate 249.032 kB; 2 mẫu sau ≥1024 MiB), balloon 81,0–91,0% (không ghim), load1 max 3,50 (mẫu 21:09:52Z — trong cửa sổ O8, trùng spike B2 21:09:34Z WebKit delta 64).
- **O8 gây 3 spike B2 trong cửa sổ** (21:09:34Z WebKit + 21:10:09Z Chromium + 21:10:45Z Chromium renderer — xem §2.5); **harness gây 5 spike B2** (21:33:21Z + 21:33:56Z Chromium 85m4 + 21:35:07Z + 21:35:42Z + 21:36:17Z Chromium 86n2) + 2 spike load1 dư trong cửa sổ harness (21:34:31Z + 21:36:53Z).
- **T8 ĐÓNG ~21:40Z — TRONG hạn cờ ~23:00Z.** Chi tiết O8/harness đầy đủ thuộc T8-165/T10. **Chuỗi WebKit FULL PASS 18 → 19? (T8 ĐỀ XUẤT: LÊN 19 — CHỜ T10/parent phán; xem §A LIMITS T8).**

### 5.4 T7-165 (scheduler) — run 164 SUCCEEDED 20:28:17Z; run 165 vẫn running lúc T9 đóng; kết cục thuộc T7-165

- **Run 164 SUCCEEDED 20:28:17Z** (T0-165 đọc DB trực tiếp: 8 event, requeue lần 2 lúc 20:10:06.432Z = btime #69 +35,432 s — TRONG dải dương 33–49,8 s; 0 event sau succeeded). **(m) #69 thuộc T7-165 (kết cục) + T2-165 (đối chiếu độc lập)** — T2-165 đóng trước #70 nên không nhắc #70.
- **Run 165 vẫn running lúc T9 đóng** (T7-165 CHƯA đóng cờ lúc 22:52:02Z — T9 kiểm tra lúc đóng; hạn run 165 là 23:35:51Z) — kết cục + (m) #70 thuộc T7-166/T2-166 (T7-165 có thể đã đóng sau khi T9 đóng — giao T10 xác nhận từ file cờ).
- T7-165 đóng cờ sau T9 (nếu có) — T9 không chờ T7 (hạn cờ T9 ~23:00Z).

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc 22:52:02Z (7/9)** — T7 chưa đóng, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T2-165:** probe #84 (T9 không trích số — thuộc T2-165/T10); **#96? (điều tra đầy đủ giao T2-165)**; **(m) #69 đối chiếu độc lập** (T2-165 sở hữu); (m) #56 vẫn có điều kiện (T2-164 không thu hẹp lần thứ 7 — T2-165 cập nhật khi viết LIMITS mới).
- **T1-165:** verify đợt 164 (T9 không trích số — thuộc T1-165/T10).
- **T6-165:** prune lần 40 (T9 không trích số — thuộc T6-165/T10).
- **T4-165:** xem §2.3 (LIMITS đã xuất bản).
- **T0-165:** boot #69 xác nhận đầy đủ 9 nguồn (btime 20:09:31Z giờ thật); run 164 SUCCEEDED 20:28:17Z.

## 6. Sai số / caveat (F-165-T9-*)

- **F-165-T9-1 — Cửa sổ thoáng sau reboot #69 KHÔNG quan sát được.** Đợt mở 20:35:51Z (boot+1.620s), T9 nhận việc 20:38:37Z (boot+1.726s), lần đo đầu 20:39:01Z (boot+1.770s) đã là 0. ENOSPC đầu tiên trên #69 lúc 20:11:24Z (boot+113s) — nếu có cửa sổ thì nó đã đóng trong khoảng boot+0s → boot+113s, trước khi T9 kịp đo gần 28 phút. T9 không claim cửa sổ #69 có hay không. (Cửa sổ #70 thì quan sát được: boot+63s → boot+104s/130s, <41 s theo mốc ENOSPC — xem §1.2.)
- **F-165-T9-2 — Khoảng trống phủ sóng đầu phiên 1.760 s (btime #69 20:09:31Z → sampler khởi động 20:38:51Z).** Trong 1.760 s này: ENOSPC bắt đầu (20:11:24Z, boot+113s), balloon leo tới 96,9% trần, T0/T1/T2/T5 làm việc, T4 pre-check + gate0wait. Gap này DÀI NHẤT kể từ khi T9 ghi gap (đợt 164: 383 s; đợt 163: 113 s) vì đợt mở muộn nhất sau reboot (1.620 s so với 144 s đợt 164). T9 ghi gap để T10/parent biết, không giấu. **Sampler/watcher/probe-loop khởi động 20:38:54Z trên boot #69 (pid 8853/8854/8855), chết theo reboot #70, khởi động lại bằng tay 22:06:28Z trên boot #70 (pid 1930/1931/1932), dừng theo PID lúc đóng 22:52:02Z — 0 process T9 sót lại (kiểm tra lúc đóng).**
- **F-165-T9-3 — 1 lệnh sleep-wait của T9 bị reboot #70 giết** (runtime restart recovery cho session proc_b1584784daaa — chỉ là timer chờ, không có side effect; trạng thái đã verify lại từ disk sau đó). Không cần làm lại.
- **F-165-T9-4 — Mẫu sampler cuối #69 (22:05:53Z) mang nhãn boot cũ `9a1a9319` dù btime #70 là 22:05:25Z (28 s TRƯỚC mẫu).** Cùng mẫu F-164-T9-4 (mẫu 18:06:52Z đợt 164, 22 s sau btime #68): sampler đọc boot-id trước khi reboot xảy ra trong cùng chu kỳ lấy mẫu, hoặc boot-id chưa cập nhật — dữ liệu mẫu vẫn đúng (RAM/balloon/load1 đo được là số thật lúc 22:05:53Z trên boot #70 mới — mem nhảy lên 801.096 kB, swapfree nhảy lên 810.820 kB, đúng dấu hiệu boot mới — chỉ nhãn boot là cũ; balloon vẫn đọc 6.443.824 kB, chưa xả kịp). T9 ghi đúng số đo, không sửa nhãn. **Ảnh hưởng đếm: mẫu 22:05:53Z được tính vào #69 trong bảng §2.1 (n=88) theo nhãn log — nếu tính theo btime thì #69 n=87, #70 n=47; mean toàn phiên KHÔNG đổi (cùng 134 mẫu).**
- **F-165-T9-5 — Spike 20:46:07Z (load1 5,86) phân loại load1 dư dù delta max = 17, cao hơn ngưỡng ≤15 trong định nghĩa đứng.** Căn cứ phân loại: delta max 17 là của hatch daemon (20,0% tức thời); node test-xvfb-display-lock (25,5% tích lũy) delta **0**; top -b: **48,8% idle + 18,6% iowait**, không process nào chạy mạnh trong giây đo; load1 là dư âm của bão 20:44–20:45Z (mask_anim 100 tick/s + ffmpeg 75 tick/s). T9 phân loại load1 dư theo THỰC CHẤT (không process nào đủ tải trong giây đo) thay vì theo chữ (delta ≤15) và ghi rõ số 17 để T10/parent kiểm lại — không giấu vào nhóm "quy được". Nếu parent giữ ngưỡng chữ ≤15 thì spike này thành "quy được một phần" (hatch 17 + find D-state 10%) — T9 trình cả hai cách đọc.
- **F-165-T9-6 — 2 spike delta-miss (pid chết giữa chừng trong vòng delta 1 s): 20:46:41Z (ffmpeg 86,8% tích lũy, 81,8% top tức thời, delta mất) và 20:47:17Z (ffprobe 33,3% tích lũy, delta mất).** Quy driver bằng ps top tức thời + top -b, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163) và F-164-T9-7 (1 spike đợt 164). `ps -eo args` của chính watcher: **0 dòng** trong b2-spikes-FROZEN.log — fix (n) đợt 150 VẪN ĐÓNG.
- **F-165-T9-7 — Nhãn "probe-lan-2" xuất hiện HAI lần trong headroom-log.txt** (21:08:51Z trên #69 + 22:36:28Z trên #70 sau khi probe-loop khởi động lại) — cùng mẫu F-163-T9-6 (nhãn trùng sau khởi động lại). Phân biệt bằng boot + timestamp trong log; T9 không đổi nhãn (giữ đúng tên script ghi).
- **F-165-T9-8 — E-167 CHƯA ĐỨT lúc đóng phiên (36 mẫu, vẫn ghim ở mẫu cuối 22:51:29Z).** Kết cục E-167 (đứt lúc nào, có sag không, tổng bao nhiêu mẫu) thuộc T9-166. T9 không claim E-167 đã kết thúc.
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được, chỉ biết ≥30.001); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC từ cell vì journalctl trả 0 dòng trên boot cũ sau reboot (cùng họ EPERM như dmesg — xem F-163-T9-1); T10 không đếm lại độc lập B2 đợt 164 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).

---

---

## Phụ lục — log sampler đóng băng (134 mẫu, 20:38:51Z–22:51:29Z)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round165-t9/ram-sampler-FROZEN.log` (md5 `3322a8a360ffedd93e03b600841a79e9`) — không gõ lại bằng tay (xem F-164-T9-10).

```
2026-11-21T20:38:51Z boot=9a1a9319 mem=643180 bal=6247216 swapfree=658292 load1=1.54
2026-11-21T20:39:51Z boot=9a1a9319 mem=1017216 bal=5833188 swapfree=645956 load1=1.30
2026-11-21T20:40:51Z boot=9a1a9319 mem=1634932 bal=4891460 swapfree=657640 load1=2.70
2026-11-21T20:41:51Z boot=9a1a9319 mem=2177568 bal=4580360 swapfree=654360 load1=2.30
2026-11-21T20:42:51Z boot=9a1a9319 mem=1439920 bal=4532588 swapfree=648320 load1=0.84
2026-11-21T20:43:51Z boot=9a1a9319 mem=1362860 bal=4572516 swapfree=648080 load1=0.44
2026-11-21T20:44:51Z boot=9a1a9319 mem=1666096 bal=4752700 swapfree=646840 load1=4.80
2026-11-21T20:45:51Z boot=9a1a9319 mem=2389648 bal=3966380 swapfree=650420 load1=6.67
2026-11-21T20:46:51Z boot=9a1a9319 mem=2804108 bal=3132096 swapfree=651200 load1=5.78
2026-11-21T20:47:52Z boot=9a1a9319 mem=3652376 bal=2804416 swapfree=655336 load1=4.83
2026-11-21T20:48:52Z boot=9a1a9319 mem=3281400 bal=3183976 swapfree=664024 load1=2.68
2026-11-21T20:49:52Z boot=9a1a9319 mem=3113404 bal=3539588 swapfree=679796 load1=1.86
2026-11-21T20:50:52Z boot=9a1a9319 mem=2835340 bal=3863436 swapfree=689348 load1=1.29
2026-11-21T20:51:52Z boot=9a1a9319 mem=2508708 bal=4168928 swapfree=698920 load1=0.72
2026-11-21T20:52:52Z boot=9a1a9319 mem=2241396 bal=4446636 swapfree=699240 load1=0.85
2026-11-21T20:53:52Z boot=9a1a9319 mem=1460304 bal=4400188 swapfree=690196 load1=2.42
2026-11-21T20:54:52Z boot=9a1a9319 mem=1701388 bal=4584896 swapfree=688244 load1=2.18
2026-11-21T20:55:52Z boot=9a1a9319 mem=1582456 bal=4790784 swapfree=691256 load1=1.00
2026-11-21T20:56:52Z boot=9a1a9319 mem=2252960 bal=4104532 swapfree=660660 load1=0.77
2026-11-21T20:57:52Z boot=9a1a9319 mem=3178104 bal=3615588 swapfree=661920 load1=0.74
2026-11-21T20:58:52Z boot=9a1a9319 mem=2860188 bal=3955324 swapfree=667892 load1=0.38
2026-11-21T20:59:52Z boot=9a1a9319 mem=2501368 bal=4263396 swapfree=668332 load1=0.28
2026-11-21T21:00:52Z boot=9a1a9319 mem=2232100 bal=4539732 swapfree=673480 load1=0.28
2026-11-21T21:01:52Z boot=9a1a9319 mem=1992084 bal=4789868 swapfree=674096 load1=0.18
2026-11-21T21:02:52Z boot=9a1a9319 mem=1774596 bal=5014652 swapfree=674316 load1=0.06
2026-11-21T21:03:52Z boot=9a1a9319 mem=1540812 bal=5222028 swapfree=675052 load1=0.02
2026-11-21T21:04:52Z boot=9a1a9319 mem=1369628 bal=5407560 swapfree=675088 load1=0.06
2026-11-21T21:05:52Z boot=9a1a9319 mem=1169784 bal=5574844 swapfree=675768 load1=0.10
2026-11-21T21:06:52Z boot=9a1a9319 mem=1050752 bal=5727456 swapfree=675668 load1=0.30
2026-11-21T21:07:52Z boot=9a1a9319 mem=943460 bal=5866080 swapfree=676272 load1=0.11
2026-11-21T21:08:52Z boot=9a1a9319 mem=798544 bal=5225176 swapfree=599824 load1=0.41
2026-11-21T21:09:52Z boot=9a1a9319 mem=1097592 bal=4883900 swapfree=605584 load1=3.50
2026-11-21T21:10:52Z boot=9a1a9319 mem=1038128 bal=5043592 swapfree=722216 load1=3.09
2026-11-21T21:11:52Z boot=9a1a9319 mem=976456 bal=5257768 swapfree=731128 load1=2.21
2026-11-21T21:12:52Z boot=9a1a9319 mem=1510508 bal=5390876 swapfree=720492 load1=2.47
2026-11-21T21:13:52Z boot=9a1a9319 mem=764108 bal=5524760 swapfree=704780 load1=1.98
2026-11-21T21:14:52Z boot=9a1a9319 mem=658896 bal=5631192 swapfree=708300 load1=2.03
2026-11-21T21:15:52Z boot=9a1a9319 mem=732192 bal=5522212 swapfree=691608 load1=1.33
2026-11-21T21:16:52Z boot=9a1a9319 mem=645968 bal=5588780 swapfree=685228 load1=1.53
2026-11-21T21:17:52Z boot=9a1a9319 mem=706188 bal=5690916 swapfree=698748 load1=0.97
2026-11-21T21:18:52Z boot=9a1a9319 mem=557544 bal=5792464 swapfree=702772 load1=0.44
2026-11-21T21:19:52Z boot=9a1a9319 mem=527820 bal=5888312 swapfree=699480 load1=0.26
2026-11-21T21:20:52Z boot=9a1a9319 mem=430412 bal=5971732 swapfree=680200 load1=0.17
2026-11-21T21:21:52Z boot=9a1a9319 mem=381056 bal=6047084 swapfree=677388 load1=0.32
2026-11-21T21:22:52Z boot=9a1a9319 mem=322036 bal=6105672 swapfree=667008 load1=0.15
2026-11-21T21:23:52Z boot=9a1a9319 mem=291536 bal=6155504 swapfree=640016 load1=0.18
2026-11-21T21:24:52Z boot=9a1a9319 mem=248768 bal=6217892 swapfree=628068 load1=0.26
2026-11-21T21:25:52Z boot=9a1a9319 mem=733476 bal=5671152 swapfree=616792 load1=0.57
2026-11-21T21:26:52Z boot=9a1a9319 mem=648448 bal=5777104 swapfree=621616 load1=0.21
2026-11-21T21:27:52Z boot=9a1a9319 mem=548272 bal=5873924 swapfree=625832 load1=0.12
2026-11-21T21:28:52Z boot=9a1a9319 mem=463916 bal=5961640 swapfree=625220 load1=0.16
2026-11-21T21:29:53Z boot=9a1a9319 mem=359840 bal=6041436 swapfree=627096 load1=0.06
2026-11-21T21:30:53Z boot=9a1a9319 mem=779368 bal=6130484 swapfree=626308 load1=0.36
2026-11-21T21:31:53Z boot=9a1a9319 mem=665712 bal=5385724 swapfree=611536 load1=1.81
2026-11-21T21:32:53Z boot=9a1a9319 mem=769356 bal=5380972 swapfree=610724 load1=3.40
2026-11-21T21:33:53Z boot=9a1a9319 mem=510308 bal=5496744 swapfree=611092 load1=3.93
2026-11-21T21:34:53Z boot=9a1a9319 mem=580404 bal=5623216 swapfree=604100 load1=5.16
2026-11-21T21:35:53Z boot=9a1a9319 mem=590280 bal=5427112 swapfree=600960 load1=5.66
2026-11-21T21:36:53Z boot=9a1a9319 mem=672956 bal=5554244 swapfree=606580 load1=3.25
2026-11-21T21:37:53Z boot=9a1a9319 mem=548580 bal=5676656 swapfree=607536 load1=2.19
2026-11-21T21:38:53Z boot=9a1a9319 mem=1095104 bal=5813108 swapfree=608560 load1=1.68
2026-11-21T21:39:53Z boot=9a1a9319 mem=964648 bal=5952352 swapfree=611588 load1=1.46
2026-11-21T21:40:53Z boot=9a1a9319 mem=860304 bal=6078780 swapfree=616956 load1=2.13
2026-11-21T21:41:53Z boot=9a1a9319 mem=747168 bal=6193488 swapfree=622348 load1=1.61
2026-11-21T21:42:53Z boot=9a1a9319 mem=580076 bal=6296924 swapfree=623604 load1=1.01
2026-11-21T21:43:53Z boot=9a1a9319 mem=526380 bal=6390572 swapfree=630796 load1=0.81
2026-11-21T21:44:53Z boot=9a1a9319 mem=448460 bal=6443824 swapfree=631640 load1=0.48
2026-11-21T21:45:53Z boot=9a1a9319 mem=439120 bal=6443824 swapfree=632512 load1=0.34
2026-11-21T21:46:53Z boot=9a1a9319 mem=487348 bal=6443824 swapfree=632156 load1=0.20
2026-11-21T21:47:53Z boot=9a1a9319 mem=461868 bal=6443824 swapfree=633328 load1=0.07
2026-11-21T21:48:53Z boot=9a1a9319 mem=471164 bal=6443824 swapfree=637436 load1=0.02
2026-11-21T21:49:53Z boot=9a1a9319 mem=458148 bal=6443824 swapfree=637608 load1=0.31
2026-11-21T21:50:53Z boot=9a1a9319 mem=471236 bal=6443824 swapfree=638216 load1=0.20
2026-11-21T21:51:53Z boot=9a1a9319 mem=458504 bal=6443824 swapfree=638356 load1=0.12
2026-11-21T21:52:53Z boot=9a1a9319 mem=458500 bal=6443824 swapfree=638416 load1=0.09
2026-11-21T21:53:53Z boot=9a1a9319 mem=455748 bal=6443824 swapfree=638476 load1=0.32
2026-11-21T21:54:53Z boot=9a1a9319 mem=470580 bal=6443824 swapfree=638536 load1=0.12
2026-11-21T21:55:53Z boot=9a1a9319 mem=460276 bal=6443824 swapfree=638680 load1=0.12
2026-11-21T21:56:53Z boot=9a1a9319 mem=453744 bal=6443824 swapfree=636348 load1=0.08
2026-11-21T21:57:53Z boot=9a1a9319 mem=468620 bal=6443824 swapfree=635444 load1=0.03
2026-11-21T21:58:53Z boot=9a1a9319 mem=469840 bal=6443824 swapfree=635504 load1=0.01
2026-11-21T21:59:53Z boot=9a1a9319 mem=483788 bal=6443824 swapfree=634268 load1=0.00
2026-11-21T22:00:53Z boot=9a1a9319 mem=470644 bal=6443824 swapfree=635712 load1=0.43
2026-11-21T22:01:53Z boot=9a1a9319 mem=464808 bal=6443824 swapfree=635800 load1=0.19
2026-11-21T22:02:53Z boot=9a1a9319 mem=470904 bal=6443824 swapfree=635812 load1=0.07
2026-11-21T22:03:53Z boot=9a1a9319 mem=453580 bal=6443824 swapfree=634832 load1=0.02
2026-11-21T22:04:53Z boot=9a1a9319 mem=474532 bal=6443824 swapfree=633756 load1=0.01
2026-11-21T22:05:53Z boot=9a1a9319 mem=801096 bal=6443824 swapfree=810820 load1=0.22
2026-11-21T22:06:28Z boot=d1ddd946 mem=1897016 bal=5020792 swapfree=1039968 load1=1.57
2026-11-21T22:07:28Z boot=d1ddd946 mem=1686664 bal=5212984 swapfree=909020 load1=2.69
2026-11-21T22:08:28Z boot=d1ddd946 mem=1562172 bal=5399536 swapfree=872332 load1=1.56
2026-11-21T22:09:28Z boot=d1ddd946 mem=1382420 bal=5577636 swapfree=873348 load1=0.57
2026-11-21T22:10:28Z boot=d1ddd946 mem=1238176 bal=5743292 swapfree=864428 load1=0.36
2026-11-21T22:11:28Z boot=d1ddd946 mem=1104276 bal=5893312 swapfree=855440 load1=0.19
2026-11-21T22:12:28Z boot=d1ddd946 mem=965140 bal=6030328 swapfree=852800 load1=0.07
2026-11-21T22:13:28Z boot=d1ddd946 mem=841348 bal=6155184 swapfree=852524 load1=0.10
2026-11-21T22:14:28Z boot=d1ddd946 mem=731368 bal=6268420 swapfree=838780 load1=0.04
2026-11-21T22:15:28Z boot=d1ddd946 mem=648792 bal=6371376 swapfree=810148 load1=0.01
2026-11-21T22:16:28Z boot=d1ddd946 mem=569808 bal=6443824 swapfree=805764 load1=0.00
2026-11-21T22:17:28Z boot=d1ddd946 mem=573392 bal=6443824 swapfree=803192 load1=0.00
2026-11-21T22:18:28Z boot=d1ddd946 mem=570080 bal=6443824 swapfree=800296 load1=0.00
2026-11-21T22:19:28Z boot=d1ddd946 mem=574444 bal=6443824 swapfree=795392 load1=0.00
2026-11-21T22:20:28Z boot=d1ddd946 mem=579904 bal=6443824 swapfree=791404 load1=0.05
2026-11-21T22:21:28Z boot=d1ddd946 mem=592228 bal=6443824 swapfree=787452 load1=0.02
2026-11-21T22:22:28Z boot=d1ddd946 mem=617160 bal=6443824 swapfree=784948 load1=0.00
2026-11-21T22:23:28Z boot=d1ddd946 mem=585456 bal=6443824 swapfree=777880 load1=0.00
2026-11-21T22:24:28Z boot=d1ddd946 mem=603876 bal=6443824 swapfree=774696 load1=0.00
2026-11-21T22:25:28Z boot=d1ddd946 mem=601924 bal=6443824 swapfree=771848 load1=0.00
2026-11-21T22:26:28Z boot=d1ddd946 mem=591588 bal=6443824 swapfree=775912 load1=0.00
2026-11-21T22:27:28Z boot=d1ddd946 mem=593260 bal=6443824 swapfree=775552 load1=0.03
2026-11-21T22:28:28Z boot=d1ddd946 mem=591988 bal=6443824 swapfree=774296 load1=0.01
2026-11-21T22:29:28Z boot=d1ddd946 mem=575188 bal=6443824 swapfree=772752 load1=0.00
2026-11-21T22:30:28Z boot=d1ddd946 mem=585220 bal=6443824 swapfree=772956 load1=0.00
2026-11-21T22:31:29Z boot=d1ddd946 mem=576520 bal=6443824 swapfree=770452 load1=0.00
2026-11-21T22:32:29Z boot=d1ddd946 mem=579520 bal=6443824 swapfree=769648 load1=0.00
2026-11-21T22:33:29Z boot=d1ddd946 mem=579960 bal=6443824 swapfree=753428 load1=0.00
2026-11-21T22:34:29Z boot=d1ddd946 mem=579948 bal=6443824 swapfree=752748 load1=0.00
2026-11-21T22:35:29Z boot=d1ddd946 mem=570860 bal=6443824 swapfree=752948 load1=0.15
2026-11-21T22:36:29Z boot=d1ddd946 mem=591472 bal=6443824 swapfree=749672 load1=0.14
2026-11-21T22:37:29Z boot=d1ddd946 mem=565080 bal=6443824 swapfree=750944 load1=0.19
2026-11-21T22:38:29Z boot=d1ddd946 mem=560844 bal=6443824 swapfree=751064 load1=0.07
2026-11-21T22:39:29Z boot=d1ddd946 mem=555448 bal=6443824 swapfree=749896 load1=0.08
2026-11-21T22:40:29Z boot=d1ddd946 mem=560836 bal=6443824 swapfree=750012 load1=0.08
2026-11-21T22:41:29Z boot=d1ddd946 mem=559044 bal=6443824 swapfree=750076 load1=0.06
2026-11-21T22:42:29Z boot=d1ddd946 mem=573448 bal=6443824 swapfree=751688 load1=0.02
2026-11-21T22:43:29Z boot=d1ddd946 mem=557180 bal=6443824 swapfree=746172 load1=0.06
2026-11-21T22:44:29Z boot=d1ddd946 mem=565124 bal=6443824 swapfree=746212 load1=0.02
2026-11-21T22:45:29Z boot=d1ddd946 mem=564308 bal=6443824 swapfree=746288 load1=0.09
2026-11-21T22:46:29Z boot=d1ddd946 mem=559112 bal=6443824 swapfree=750528 load1=0.03
2026-11-21T22:47:29Z boot=d1ddd946 mem=559816 bal=6443824 swapfree=751124 load1=0.01
2026-11-21T22:48:29Z boot=d1ddd946 mem=545400 bal=6443824 swapfree=751244 load1=0.12
2026-11-21T22:49:29Z boot=d1ddd946 mem=555336 bal=6443824 swapfree=751240 load1=0.04
2026-11-21T22:50:29Z boot=d1ddd946 mem=555080 bal=6443824 swapfree=751324 load1=0.24
2026-11-21T22:51:29Z boot=d1ddd946 mem=565616 bal=6443824 swapfree=751312 load1=0.09
```

---

## Phụ lục — headroom log (59 dòng, 8 lần probe)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round165-t9/headroom-log.txt` — không gõ lại bằng tay (xem F-164-T9-10).

```
=== probe-mo 2026-11-21T20:39:01Z boot=9a1a9319 tran=63747 uptime_s=1770
0
0
ENOSPC-count=11
ENOSPC-lines:
Nov 21 20:11:24 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
Nov 21 20:27:22 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
Nov 21 20:28:32 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
Nov 21 20:29:42 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
Nov 21 20:30:52 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-first: Nov 21 20:11:24 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
ENOSPC-last: Nov 21 20:37:52 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     627836 kB | Balloon:         6247216 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-2 2026-11-21T21:08:51Z boot=9a1a9319 tran=63747
0
0
ENOSPC-count=37
ENOSPC-last: Nov 21 21:08:02 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     798256 kB | Balloon:         5225176 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-3 2026-11-21T21:38:51Z boot=9a1a9319 tran=63747
0
0
ENOSPC-count=63
ENOSPC-last: Nov 21 21:38:12 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1151184 kB | Balloon:         5763932 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-pair-70 2026-11-21T22:06:28Z boot=d1ddd946 tran=63747 uptime_s=63
30001
30001
ENOSPC-count=0
ENOSPC-last: 
mem: MemAvailable:    1878336 kB | Balloon:         5020792 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-map-70-1 2026-11-21T22:07:35Z boot=d1ddd946 tran=63747 uptime_s=130
0
ENOSPC-count=1
ENOSPC-last: Nov 21 22:07:09 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1574540 kB | Balloon:         5212984 kB
=== window-map-70-2 2026-11-21T22:09:05Z boot=d1ddd946 tran=63747 uptime_s=220
2
ENOSPC-count=1
ENOSPC-last: Nov 21 22:07:09 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1470244 kB | Balloon:         5521572 kB
=== probe-lan-2 2026-11-21T22:36:28Z boot=d1ddd946 tran=63747
2
2
ENOSPC-count=1
ENOSPC-last: Nov 21 22:07:09 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     591004 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-dong 2026-11-21T22:51:41Z boot=d1ddd946 tran=63747 uptime_s=2776
2
2
ENOSPC-count=1
ENOSPC-last: Nov 21 22:07:09 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     569744 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
```

---

*LIMITS này do T9 đợt 165 viết, đóng cờ 22:52Z 21/11/2026 (trước hạn cờ ~23:00Z; trước hạn cứng đóng 23:30Z). Không push GitHub. Không sửa production. Không chạy TTS 39. Không thử birefnet (guard không mở).*
