# LIMITS — Phase 9 đợt 166, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ hai mươi liên tiếp; headroom 6 lúc đóng, dưới ngưỡng lần thứ 26 liên tiếp; CỬA SỔ THOÁNG SAU REBOOT ĐƯỢC QUAN SÁT LẦN THỨ TƯ LIÊN TIẾP (boot #71); balloon E-167 ĐÃ ĐỨT + E-168 MỚI (54 mẫu, CHƯA ĐỨT); ENOSPC ≥56 dòng (cận dưới); REBOOT #71 GIỮA PHIÊN; lượt yên #35 KHÔNG CÓ LƯỢT HỢP LỆ — CHUỖI #22→#30 ĐỨT)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 6 lúc đóng (5 lần đo cuối [6, 6, 6, 6, 6]), dưới ngưỡng < ~1.800 lần thứ hai mươi sáu liên tiếp** — giá trị ổn định cuối phiên là **6** (đợt 165: 2; đợt 164: 0). Trần **63.747 trên cả hai boot #70 và #71** (đợt 165: 63.747 trên cả #69 và #70). Quyết (k) "chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT ĐƯỢC QUAN SÁT — LẦN THỨ TƯ LIÊN TIẾP (đợt 163 + 164 + 165 + 166):** trên boot mới #71 (btime 00:08:00Z), headroom **30.001 (chạm CAP 30.000) cả hai probe lúc 00:09:06Z (boot+66s)**; tới **00:10:40Z (boot+160s) đã về 0**; ENOSPC đầu tiên trên #71 lúc 00:09:51Z (boot+111s) → cửa sổ thực nằm trong khoảng boot+66s → boot+111s (**< 45 s** theo mốc ENOSPC; < 94 s theo mốc probe). Xem §1.2, F-166-T9-1.
- **Balloon — E-167 ĐÃ ĐỨT (QUAN SÁT ĐƯỢC) + E-168 MỚI, 0 sag:** **E-167: mẫu ghim cuối 23:38:50Z (mẫu duy nhất ghim trong log đợt 166), đứt trong (23:38:50Z, 23:39:50Z]** — tổng 37 mẫu nếu tính tiếp nối (36 đợt 165 + 1 đợt 166), với caveat khoảng mù 2.841 s giữa hai đợt không quan sát được (xem F-166-T9-4). **E-168: 54 mẫu, 00:48:06–01:41:07Z, 1 chuỗi, boot #71, CHƯA đứt lúc đóng** (vẫn ghim ở mẫu cuối phiên; kết cục thuộc T9-167). **Tổng ghim 55/123 mẫu (44,7%).** Xem §2.2.
- **RAM:** sampler **123 mẫu, 23:38:50Z–01:41:07Z, HAI boot (#70: 30 mẫu; #71: 93 mẫu)**. Max **4.399.884 kB (4.296,8 MiB = 69,93% guard) lúc 00:01:51Z** trên #70 — **gần guard nhất kể từ đợt 150** (đợt 165: 58,05%); min **372.732 kB lúc 23:39:50Z** (ngay sau khi E-167 đứt) — **trũng NÔNG lại so với đợt 165 (248.768 kB): chuỗi trũng sâu dần 3 đợt (365.952 → 309.116 → 248.768 kB) DỨT**; mean toàn phiên **1.225.028,3 kB — tính bằng 3 cách (python + awk + trung bình có trọng số) KHỚP NHAU**. Gate A **44/123 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ hai mươi liên tiếp.** Xem §2, §3.
- **B2: 16 spike THẬT (grep '^=== SPIKE' — grep không neo đếm thừa 19 do cmdline của chính lệnh exec chờ của T9 chứa chuỗi '=== SPIKE'; xem F-166-T9-3), 13 QUY ĐƯỢC DRIVER CỤ THỂ + 3 load1 dư.** Bão mở đợt #70: 6 spike (23:41:20–23:44:16Z — ffmpeg/mask_anim T1 + T2 + T5 stats); T4 attempt1: **3 spike TRONG cửa sổ** (23:48:51Z WebKit delta 85 — do chính WebKit của attempt gây; 23:49:27Z + 23:50:02Z load1 dư); bão apt sau reboot #71: 6 spike (00:09:04–00:12:00Z — apt-get/dpkg post-boot + 1 load1 dư); harness: **1 spike TRONG cửa sổ** (00:24:06Z WebKit delta 97 — pha 84l10, do chính harness gây). **0 spike trong cửa sổ attempt2/attempt3 (kể cả lúc PAGE-WEDGED 23:59:47Z); 0 spike trong cửa sổ O8; 0 spike trong cửa sổ ghim E-167/E-168.** Delta tick lớn nhất 130 tick/s (ffmpeg). Xem §2.5.
- **Lượt yên WebKit #35 (T4): KHÔNG CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ #22 → #30 ĐỨT TẠI #35.** Attempt1-#70 (23:47:48–23:51:37Z) KHÔNG HỢP LỆ (lớp B vi phạm B2 load1 max 4,83 + tickCost median đúng ngưỡng 60,0); attempt2-#70 (23:53:09–23:57:03Z) KHÔNG HỢP LỆ (tickCost 77,0 > 60 dù lớp B 5/5 sạch); attempt3-#70 (23:57:04–00:01:17Z) PAGE-WEDGED 9/20 (kẹt rAF/renderer 23:59:47Z). Sampler T9 đối chiếu: gate A MỞ 4/4 trong cả ba cửa sổ attempt; 3 spike B2 trong cửa sổ attempt1, 0 spike trong cửa sổ attempt2/attempt3. Xem §2.3.
- **REBOOT #71 GIỮA PHIÊN (ea73ac4f, btime 00:08:00Z; gap #70→#71 = 7.355 s):** sampler + watcher + probe-loop **CHẾT theo reboot** (điểm yếu (d) đợt 148 tái diễn lần thứ tư liên tiếp); khoảng trống phủ sóng trong log **73 s** (00:07:51Z → 00:09:04Z); T9 khởi động lại cả ba lúc ~00:08:5xZ (boot+~55s) và bắt được cửa sổ thoáng headroom ở boot+66s bằng probe tay. (m) #71 thuộc T2-167 (T2-166 đóng trước #71); kết cục run 165 thuộc T7-166 (T7 chưa đóng cờ lúc T9 đóng). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: #70 ≥47 dòng (cận dưới — đếm cuối 00:04:42Z, phần 00:04:42Z → reboot 00:08:00Z mất theo reboot, KHÔNG cộng số ước; trong đó 1 dòng 22:07:09Z đã tính trong đợt 165) + #71 9 dòng = ≥56 dòng đếm được (cận dưới). Đợt thứ mười lăm liên tiếp bảng watch cạn gây lỗi thật thấy được.** Điểm mới: trên #71 ENOSPC im hoàn toàn 00:39:01Z → đóng phiên (62 phút) trong khi headroom ổn định ở 6 — bằng chứng độc lập (ngoài probe) rằng headroom 6 là thật. Xem §4.
- **T8-166 (đối chiếu):** O8 PASS 3/3 trên boot #71 (00:18:28–00:21:25Z) nhưng **KHÔNG TÍNH CHUỖI** (không có lượt yên hợp lệ + đổi boot sau gate + gate cho #71 không FOUND) — T8 đề xuất GIỮ 19, chờ T10/parent phán; harness **6/6 PASS, 0 KẸT** (lần đầu sạch kể từ đợt 163); kẹt cộng dồn **GIỮ 16**; chuỗi "P3 không kẹt" 0 → 1; (1c) KHÔNG triển khai (thiết kế gốc lỗi — replay 0 kích hoạt trên log kẹt — chờ parent duyệt bản sửa (c')). Xem §5.3.
- **T7-166 (đối chiếu):** T7 CHƯA đóng cờ lúc T9 đóng (01:42:14Z) — kết cục run 165 + (m) #70/#71 thuộc T7-166/T2-166. Xem §5.4.
- **T5-166 (đối chiếu):** POSTBOOT_PASS #70 ĐÃ CÓ 23:40:45Z; **POSTBOOT_PASS #71 CHƯA CÓ** (waiter #71 của T8: 32 poll, postboot=0) — thuộc T5-167. Xem §5.2.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round166-t9/k8-headroom.py` (copy y nguyên từ đợt 165 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 166 (14 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 23:39:01Z 21/11 | **0** | #70 d1ddd946 (btime 22:05:25Z) | 63.747 | lần đo 1–2, lúc mở (boot+5.816s); RAM 384.432 kB, balloon GHIM TRẦN (E-167); ENOSPC-count=24 (dòng mới nhất 23:37:56Z) |
| 23:39:01Z 21/11 | **0** | #70 d1ddd946 | 63.747 | lần đo 2 (chênh **0** so với lần 1) |
| 00:09:06Z 22/11 | **30.001** | #71 ea73ac4f (btime 00:08:00Z) | 63.747 | lần đo 3–4, cặp cửa sổ (boot+66s); **chạm CAP 30.000 — không gặp ENOSPC**; RAM 1.791.672 kB, balloon 5.092.376 kB; ENOSPC-count=0 trên boot mới |
| 00:09:06Z 22/11 | **30.001** | #71 ea73ac4f | 63.747 | lần đo 4, cặp cửa sổ (boot+~66s); **chạm CAP 30.000** |
| 00:10:40Z 22/11 | **0** | #71 ea73ac4f | 63.747 | lần đo 5, window-map-71-1 (boot+160s); **cửa sổ ĐÃ ĐÓNG**; ENOSPC-count=1 (dòng ENOSPC đầu tiên trên #71 lúc 00:09:51Z, boot+111s) |
| 00:12:11Z 22/11 | **6** | #71 ea73ac4f | 63.747 | lần đo 6, window-map-71-2 (boot+250s); ENOSPC-count=2 (dòng mới nhất 00:10:51Z) |
| 00:39:04Z 22/11 | **0** | #71 ea73ac4f | 63.747 | lần đo 7–8, probe-loop lan-2; ENOSPC-count=9 (dòng mới nhất 00:39:01Z); balloon 5.333.892 kB (đang leo tới trần) |
| 00:39:04Z 22/11 | **0** | #71 ea73ac4f | 63.747 | lần đo 8 (chênh **0**) |
| 01:09:04Z 22/11 | **6** | #71 ea73ac4f | 63.747 | lần đo 9–10, probe-loop lan-3; ENOSPC-count=9 (không tăng); balloon ĐANG GHIM TRẦN (E-168), RAM 618.992 kB |
| 01:09:04Z 22/11 | **6** | #71 ea73ac4f | 63.747 | lần đo 10 (chênh **0**) |
| 01:39:04Z 22/11 | **6** | #71 ea73ac4f | 63.747 | lần đo 11–12, probe-loop lan-4; ENOSPC-count=9 (không tăng); balloon ĐANG GHIM TRẦN (E-168), RAM 532.224 kB |
| 01:39:04Z 22/11 | **6** | #71 ea73ac4f | 63.747 | lần đo 12 (chênh **0**) |
| 01:41:43Z 22/11 | **6** | #71 ea73ac4f | 63.747 | lần đo 13–14, đóng phiên (boot+5.623s); balloon ĐANG GHIM TRẦN (E-168), RAM 485.412 kB; ENOSPC-count=9 (không tăng) |
| 01:41:43Z 22/11 | **6** | #71 ea73ac4f | 63.747 | lần đo 14 (chênh **0**) |

- Probe dừng ở `i=0` trong 5/14 lần đo; dừng ở `i=6` trong 7 lần đo; chạm CAP 30.000 trong 2 lần đo (cặp cửa sổ 00:09:06Z — đúng cơ chế dừng của probe, không phải sự cố; stderr `CAP 30000 reached without ENOSPC`). File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi cặp đo / mỗi lần map).
- **Cửa sổ thoáng sau reboot (boot #71): MỞ lúc boot+66s (≥30.001), ĐÓNG trước boot+160s (0).** ENOSPC đầu tiên trên #71 lúc 00:09:51Z (boot+111s) — bảng watch đã đầy trở lại vào lúc đó, nên cửa sổ thực nằm trong khoảng boot+66s → boot+111s (**< 45 s** theo mốc ENOSPC; < 94 s theo mốc probe). So với đợt 165 (< 41 s: boot+63s → boot+104s), đợt 164 (< 31 s: boot+81s → boot+112s) và đợt 163 (< 40 s: boot+71s → boot+110s): mốc ENOSPC đợt này (< 45 s) rộng hơn một chút vì lần map đầu (boot+160s) muộn hơn các đợt trước — T9 ghi đúng mốc đo, không ép số cho khớp chuỗi. Giá trị đỉnh thật của cửa sổ không biết được (probe cap 30.000 — chỉ biết ≥30.001; xem F-163-T9-1, vẫn đứng).
- **Headroom sau cửa sổ: 6 (boot+250s) → 0 (00:39:04Z) → 6 ổn định (01:09:04Z → 01:41:43Z).** Giá trị 6 lúc boot+250s chưa ổn định (về 0 ở lan-2, cùng lúc ENOSPC tăng 2 → 9); từ lan-3 trở đi 6 giữ ổn định 3 cặp đo liên tiếp (6 lần đo) + ENOSPC im 62 phút (00:39:01Z → đóng phiên) — bằng chứng độc lập rằng headroom 6 là thật (systemd thêm được watch trong khoảng đó; cùng mẫu khoảng im ENOSPC đợt 164/165 lúc headroom 1–2/2). T9 ghi đúng số đo từng lần, không làm tròn hay gộp.
- **So sánh với đợt 165:** đợt 165 mở 0 trên #69 (6 lần đo đều 0) → reboot #70 giữa phiên → thoáng ≥30.001 trong <41 s → 0 (1 lần) → **2 ổn định 5 lần đo tới đóng**. Đợt này mở 0 trên #70 (2 lần đo) → reboot #71 giữa phiên → thoáng ≥30.001 trong <45 s → 0 (1 lần) → **6 (1 lần) → 0 (2 lần) → 6 ổn định 6 lần đo tới đóng**. **Cửa sổ thoáng sau reboot ĐƯỢC quan sát lần thứ tư liên tiếp** (đợt 163 + 164 + 165 + 166) — cả bốn lần đều nhờ reboot xảy ra GIỮA phiên nên T9 có mặt đúng lúc.
- Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 6 = **63.741 watch** (bảng gần đầy, 6 slot trống) trên #71.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **6 / 1.578 ≈ 0** — một vite mới (~1.578 watch) vẫn không khởi động được.
- T5-166 KHÔNG probe lại headroom đợt này (như đợt 151–165) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 14 lần đo + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #71 có 9 dòng systemd không thêm được inotify watch do ENOSPC (xem §4), và ENOSPC im 62 phút cuối phiên trong khi headroom 6** — cùng kết luận bằng nguồn khác.
- **Trần KHÔNG ĐỔI giữa hai boot đợt này: 63.747 trên cả #70 và #71** (đợt 165: 63.747 trên cả #69 và #70 — lần thứ hai liên tiếp hai boot có cùng trần). T9 chỉ ghi số đo, không phán cơ chế.
- Lưu ý: RAM lúc đóng (485.412 kB) CAO hơn RAM lúc mở (384.432 kB) trong khi headroom 0 → 6. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop lan-5 (dự kiến ~02:08:5xZ) KHÔNG chạy — probe-loop đã dừng lúc T9 đóng (01:42:14Z); cặp probe đóng 01:41:43Z thay thế. Nhãn "probe-lan-2" xuất hiện ĐÚNG MỘT lần trong headroom-log (00:39:04Z trên #71) — probe-loop cũ (pid 15255) chết theo reboot #71 TRƯỚC khi kịp chạy lan-2, nên KHÔNG lặp F-165-T9-7 (nhãn trùng sau khởi động lại).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–165 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 165 | 0 → 30.001 (thoáng, boot+63s) → 2 | mở 20:39:01Z boot #69 9a1a9319 btime 20:09:31Z (trần 63.747): 0 ×6 (20:39:01–21:38:51Z) → sau reboot #70 22:05:25Z boot MỚI d1ddd946 (trần 63.747): 30.001, 30.001 lúc boot+63s → 0 lúc boot+130s → 2 ×5 (boot+220s → boot+2776s) → đóng 22:51:41Z cùng boot #70: 2, 2 (MỘT reboot giữa phiên; 14 lần đo, 7 lần 0, 5 lần 2, 2 lần 30.001) |
| **166** | **0 → 30.001 (thoáng, boot+66s) → 6** | **mở 23:39:01Z boot #70 d1ddd946 btime 22:05:25Z (trần 63.747): 0, 0 (23:39:01Z) → sau reboot #71 00:08:00Z boot MỚI ea73ac4f (trần 63.747): 30.001, 30.001 lúc boot+66s → 0 lúc boot+160s → 6 lúc boot+250s → 0, 0 lúc 00:39:04Z → 6 ×6 (01:09:04Z → 01:41:43Z) → đóng 01:41:43Z cùng boot #71: 6, 6 (MỘT reboot giữa phiên; 14 lần đo, 5 lần 0, 7 lần 6, 2 lần 30.001)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 2 → 6**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 6, CAO NHẤT kể từ đợt 151 (đóng 90)** (đợt 165 đóng 2; đợt 164 đóng 0; đợt 163 đóng 2). Từ đỉnh chuỗi 4.438 xuống 6 = **−4.432 (−99,86%)**. Giá trị 30.001 chỉ xuất hiện trong cặp cửa sổ boot+66s trên #71, không phải giá trị ổn định (cửa sổ đóng trước boot+160s).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 6, thấp hơn ngưỡng 1.800, lần thứ hai mươi sáu liên tiếp** (tính theo giá trị ổn định lúc đóng). Quyết parent đợt 165 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal hai boot đợt này có ≥47 + 9 = ≥56 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ mười lăm liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng — T9 đếm trực tiếp 35 dòng boot #68 + ghi số đếm T5 18 dòng boot #67; đợt 165: ≥64 dòng — T9 đếm trực tiếp, parent quyết (l) chấp nhận làm số chính thức; đợt 166: ≥56 dòng — T9 đếm trực tiếp, xem §4). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong từng boot** (63.747 trên #70 suốt 2 lần đo; 63.747 trên #71 suốt 12 lần đo) và **KHÔNG ĐỔI giữa hai boot** (63.747 = 63.747 — lần thứ hai liên tiếp hai boot có cùng trần). T9 ghi đúng số đo từng boot, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.124.900 kB trên #70 / 8.124.896 kB trên #71 — xem ghi chú; swap 1.048.572 kB) — sampler 123 mẫu, 23:38:50Z–01:41:07Z, HAI boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.124.900 kB ở mẫu đầu #70 và 8.124.896 kB ở #71 (chênh 4 kB giữa hai boot — cùng mẫu đợt 165, T9 ghi đúng số đọc được, không phán; mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: E-167 đứt ngay lúc mở → RAM vọt lên đỉnh phiên (69,93% guard) → T4 3 attempt (0 lượt hợp lệ) → REBOOT #71 cắt ngang → cửa sổ thoáng headroom → bão apt post-boot → leo lại → ghim trần E-168 (54 mẫu, chưa đứt lúc đóng)

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log 73 s (qua reboot #71); 0 gap >90 s trong log** — xem §5.1; khoảng trống phủ sóng ĐẦU PHIÊN 179 s tính từ lúc đợt mở tới khi T9 khởi động sampler — xem F-166-T9-4). **123 mẫu, 23:38:50Z–01:41:07Z, HAI boot (#70: 30 mẫu; #71: 93 mẫu).** Tổng quan: **min 372.732 kB (363,9 MiB) lúc 23:39:50Z** (ngay sau khi E-167 đứt, balloon vẫn 94,3% trần, trên #70); **max 4.399.884 kB (4.296,8 MiB) lúc 00:01:51Z — 69,93% guard** (balloon xả 2.355.824 kB); **mean toàn phiên 1.225.028,3 kB (1.196,3 MiB) — tính bằng 3 cách (python + awk + trung bình có trọng số) KHỚP NHAU (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 23:38:50–00:07:51Z | #70 | 372.732–4.399.884 kB | Mở phiên: E-167 đứt trong (23:38:50Z, 23:39:50Z] (xem §2.2); balloon xả sâu tới 1.946.740 kB (30,2% trần) lúc 23:54:51Z rồi leo lại; BÃO MỞ ĐỢT (6 spike B2, load1 tới 7,29 — xem §2.5); T4 3 attempt (23:47:48–00:01:17Z, 0 lượt hợp lệ — xem §2.3); **RAM max phiên 00:01:51Z (4.399.884 kB, 69,93% guard)**; gate A MỞ 27/30 mẫu; load1 ≥3,0 ở 9/30 mẫu; reboot #71 cắt ngang lúc 00:08:00Z |
| 00:09:04–00:47:06Z | #71 | 534.048–1.898.412 kB | Boot mới: cửa sổ thoáng headroom (boot+66s, xem §1.2); BÃO APT POST-BOOT (6 spike B2, load1 tới 6,27 — xem §2.5); O8 PASS 3/3 (00:18:28–00:21:25Z, 0 spike — xem §2.4); harness 6/6 PASS (00:22:59–00:39:30Z, 1 spike — xem §2.5); balloon leo từ 5.020.300 kB (77,9% trần) lên 6.408.372 kB (99,45% trần) lúc 00:47:06Z, có trũng giữa chừng 4.912.264 kB lúc 00:36:05Z (trong lúc harness Chromium 86n2); gate A MỞ 17/39 mẫu; load1 ≥3,0 ở 0/39 mẫu (sampler) |
| 00:48:06–01:41:07Z | #71 | 493.904–618.908 kB | **Ghim E-168, 54 mẫu, 1 chuỗi, CHƯA đứt lúc đóng** (xem §2.2); **RAM <512.000 kB: 3 mẫu trong cửa sổ này** (01:04:06Z 509.532; 01:06:06Z 506.168; 01:27:07Z 493.904 — min cửa sổ); gate A ĐÓNG cả 54 mẫu; load1 ≤0,48 (phiên yên nhất trong lúc ghim kể từ đợt 165) |

- **Gate A ≥1024 MiB: 44/123 mẫu** (#70: 27/30; #71: 17/93); **0 mẫu ≥ guard**; load1 max (sampler) **7,29 lúc 23:42:50Z** (bão mở đợt — watcher bắt 6,51 lúc 23:43:05Z, xem §2.5); **9/123 mẫu load1 ≥3,0** (tất cả đều trên #70, trong bão mở đợt + attempt1). **RAM <512.000 kB: 5 mẫu** (2 trên #70 lúc E-167 đứt + 3 trong chuỗi ghim E-168 — xem danh sách cuối §2.1); **RAM <300.000 kB: 0 mẫu** (đợt 165: 2 mẫu; đợt 159–164: 0 mẫu — trở lại 0).
- Swap: SwapFree 651.880 kB (mẫu đầu) → 584.976 kB (thấp nhất phiên, lúc 23:39:50Z) → 1.040.552 kB (mẫu đầu #71, 00:09:04Z). Nhịp nhảy SwapFree qua reboot #71: 756.836 kB (mẫu cuối trước reboot, 00:07:51Z) → 1.040.552 kB (mẫu đầu #71, 00:09:04Z) — swap được nhả ~283.716 kB qua reboot (đợt 165: 633.756 → 1.039.968 kB qua reboot #70).
- Mẫu 00:01:51Z (đỉnh phiên): RAM 4.399.884 kB, balloon xả 2.355.824 kB — balloon xả sâu nhất phiên ~6 phút sau attempt3 PAGE-WEDGED của T4 (cùng mẫu đợt 152–165: xả sâu sau attempt / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 372.732 kB (đợt 165: 248.768 kB; đợt 164: 309.116 kB; đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — **chuỗi trũng sâu dần 3 đợt DỨT**: min đợt này NÔNG hơn đợt 165 đúng 123.964 kB. 5 mẫu <512.000 kB trong 123 mẫu (4,1% — thấp hẳn đợt 165: 29 mẫu, 21,6%, vì đợt này ghim ít hơn trong lúc RAM thấp: E-168 ghim lúc RAM 493–619.000 kB, cao hơn E-166 đợt 165: 439–475.000 kB); riêng trong cửa sổ ghim E-168: 3/54 mẫu <512.000 kB (5,6%); trong cửa sổ ghim E-167 (1 mẫu đợt này): 1/1 mẫu <512.000 kB. T8-166 đo độc lập RAM trong lúc harness: avail min 527 MB @00:31:00Z — sampler T9 đo 534.048 kB (521,5 MiB) @00:31:05Z — khớp trong ~1% (cadence khác nhau).

**Bảng tổng hợp số RAM (từ script `t9-166-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 123 dòng — KHÔNG tính tay, đã đối chiếu lại từ log đóng băng lúc đóng cờ bằng script `t9-166-recheck.py`):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #70 d1ddd946 | 30 | 372.732 | 4.399.884 | 2.697.066,0 | 27/30 | 1 | 7,29 | 2 |
| #71 ea73ac4f | 93 | 493.904 | 1.898.412 | 750.177,4 | 17/93 | 54 | 6,27 | 3 |
| **Toàn phiên** | **123** | **372.732** | **4.399.884** | **1.225.028,3** | **44/123** | **55/123 (44,7%)** | **7,29** | **5** |

- **Mean toàn phiên 1.225.028,3 kB — tính bằng 3 cách độc lập: python `sum/n = 1.225.028,3` VÀ awk `sum/n = 1.225.028,3` VÀ trung bình có trọng số từ mean từng boot: (30×2.697.066,0 + 93×750.177,4)/123 = 1.225.028,3 — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163). Mean từng boot cũng khớp python/awk từng số (xem §6).
- 5 mẫu RAM <512.000 kB (từ log đóng băng): 23:38:50Z 410.988 (ghim E-167, mẫu cuối); 23:39:50Z 372.732 (vừa đứt E-167 — min phiên); 01:04:06Z 509.532 (ghim E-168); 01:06:06Z 506.168 (ghim E-168); 01:27:07Z 493.904 (ghim E-168 — min chuỗi).

### 2.2 Balloon virtio — E-167 ĐÃ ĐỨT (quan sát được) + E-168 MỚI (54 mẫu, chưa đứt), mỗi episode 1 chuỗi, 0 sag

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #70 (d1ddd946): GHIM TRẦN 1/30 mẫu (3,3%), trong 1 chuỗi — ĐUÔI E-167.** Balloon max quan sát trong phiên trên #70 là 6.443.824 kB (100% trần) lúc 23:38:50Z (mẫu đầu); xả sâu tới 1.946.740 kB (30,2% trần) lúc 23:54:51Z rồi leo lại.
  - **E-167 — mẫu ghim cuối trong đợt 166: 23:38:50Z, 1 mẫu** (mem 410.988 kB, gate A ĐÓNG); mẫu sau 23:39:50Z balloon 6.080.052 kB (94,3% trần) — **ĐỨT TRONG (23:38:50Z, 23:39:50Z], QUAN SÁT ĐƯỢC**.
  - **Tổng E-167: 36 mẫu đợt 165 + 1 mẫu đợt 166 = 37 mẫu NẾU tính mẫu mở đợt 166 là tiếp nối cùng episode** (cùng boot #70, không reboot giữa hai đợt, không có mẫu nào xả sâu giữa mẫu cuối đợt 165 và mẫu đầu đợt 166). **Caveat (F-166-T9-4): khoảng mù 2.841 s giữa hai đợt (22:51:29Z → 23:38:50Z) KHÔNG quan sát được** — không loại trừ E-167 đã đứt + ghim lại trong khoảng mù; nếu vậy tổng E-167 chỉ là 36 mẫu (đợt 165) + 1 mẫu ghim riêng đợt 166. T9 trình cả hai cách đọc, giao T10 phán.
  - **0 sag trong E-167** — chuỗi ghim liên tục tới lúc đứt (36 mẫu đợt 165 + 1 mẫu đợt 166, không có mẫu nào tụt khỏi trần giữa chuỗi trong phần quan sát được).
- **Boot #71 (ea73ac4f): GHIM TRẦN 54/93 mẫu (58,1%), trong 1 chuỗi — 1 EPISODE MỚI (E-168, CHƯA ĐỨT).**
  - Leo lên trần trên boot mới: từ 00:09:04Z (5.020.300 kB, 77,9% trần) lên 6.408.372 kB (99,45% trần) lúc 00:47:06Z trong ~38 phút, có trũng giữa chừng 4.912.264 kB (76,2% trần) lúc 00:36:05Z (trong lúc harness Chromium 86n2), rồi ghim lúc 00:48:06Z.
  - **E-168 — chuỗi duy nhất: 00:48:06–01:41:07Z, 54 mẫu** (span 3.181 s, 53 phút — và đang tiếp tục lúc T9 đóng); RAM min trong chuỗi 493.904 kB lúc 01:27:07Z; RAM max trong chuỗi 618.908 kB lúc 01:09:06Z; gate A ĐÓNG cả 54 mẫu; load1 ≤0,48.
  - **CHƯA ĐỨT lúc đóng phiên** (mẫu cuối 01:41:07Z vẫn ghim) — kết cục E-168 thuộc T9-167.
  - **0 sag trong E-168** — chuỗi ghim liên tục 54 mẫu, không có mẫu nào tụt khỏi trần giữa chuỗi.
- **Giữa E-167 và E-168: reboot #71 + balloon xả sâu về 1.946.740 kB (30,2% trần, trên #70) rồi leo lại 39 mẫu trên #71 tới trần** — KHÔNG phải sag trong một episode (khác boot, có reboot #71 ở giữa, balloon xả sâu về 30,2% — xem §2.2 cuối).
- **Tổng ghim trần đợt này: 55/123 mẫu (44,7%)** (đợt 165: 58/134 = 43,3%; đợt 164: 35/135 = 25,9%; đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **1 episode mới trong đợt 166 (E-168: 54 mẫu / 1 chuỗi / 1 boot, chưa đứt)** + đuôi E-167 (1 mẫu, đã đứt) — khác đợt 165 (2 episode mới) và đợt 164 (1 episode, 3 chuỗi, 2 sag).
- **Phán theo quy tắc quyết (e)/(g) + quyết (j) đợt 163 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-167: ĐÃ ĐỨT, tổng 37 mẫu (36 đợt 165 + 1 đợt 166) nếu tính tiếp nối — hoặc 36 mẫu nếu không tính mẫu mở đợt 166 là cùng episode** (xem F-166-T9-4; T10 phán). Chuỗi ghim liên tục, 0 sag — không có gì để tách. Đứt quan sát được trong (23:38:50Z, 23:39:50Z] — khác E-166 đợt 165 (đứt không quan sát được).
  - **E-168: 1 EPISODE MỚI (54 mẫu / 1 chuỗi / boot #71, chưa đứt).** Chuỗi ghim liên tục, 0 sag — không có gì để tách. Chưa đứt lúc đóng — kết cục thuộc T9-167.
  - **E-167 và E-168 là HAI episode riêng biệt theo BẤT KỲ tiêu chí nào** (khác boot, có reboot #71 ở giữa, balloon xả sâu về 30,2% trần, khoảng leo 39 mẫu giữa hai chuỗi) — không giống E-165 đợt 164 (3 chuỗi cùng boot, 2 sag, gate A đóng suốt → 1 episode theo tiêu chí cứng). Đợt này KHÔNG đặt ra câu hỏi tách/nhập nào: mỗi episode chỉ có 1 chuỗi.
  - **Đợt 166 = 1 EPISODE GHIM MỚI (E-168: 54 mẫu, chưa đứt lúc đóng)** + đuôi E-167 đã đứt.
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim E-168 chỉ ~493–619.000 kB trong khi tổng RAM 8.124.896 kB − balloon 6.443.824 kB = 1.681.072 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ ghim E-168 (01:41:07Z): tổng RAM 8.124.896 kB − balloon 6.443.824 kB = 1.681.072 kB còn lại; MemAvailable 538.752 kB (log thật).

### 2.3 Lượt yên WebKit #35 (T4, đợt 166) — KHÔNG CÓ LƯỢT HỢP LỆ, CHUỖI LƯỢT YÊN HỢP LỆ #22 → #30 ĐỨT TẠI #35 (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-166 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND166_T4_WEBKIT_QUIET35_LIMITS.md`) + cờ `round166-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Attempt1-d1ddd946 (23:47:48–23:51:37Z): probe 20/20, lớp B VI PHẠM (B2 load1 max 4,83 > 4) + tickCost median ĐÚNG NGƯỠNG 60,0 — KHÔNG HỢP LỆ, KHÔNG cộng dồn.**
- **Attempt2-d1ddd946 (23:53:09–23:57:03Z): probe 20/20, lớp B 5/5 SẠCH, tickCost median 77,0 ms > 60 — KHÔNG HỢP LỆ, KHÔNG cộng dồn.**
- **Attempt3-d1ddd946 (23:57:04–00:01:17Z): PAGE-WEDGED 9/20 partial — kẹt rAF/renderer 23:59:47Z + 3 fetch writePartial TIMEOUT 30 s mỗi cái (tickCost 00:00:17Z, blendTick 00:00:47Z, c2DrawLog 00:01:17Z) — KHÔNG HỢP LỆ, HẾT NGÂN SÁCH 3/3, poller thoát 00:01:46Z.**
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): #35 KHÔNG CÓ attempt hợp lệ nào** — chuỗi lượt yên hợp lệ **ĐỨT tại #35** (#22 đợt 157 → #23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161 → #27 đợt 162 → #28 đợt 163 → #29 đợt 164 → #30 đợt 165 → **ĐỨT, không có #31 đợt 166**).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1-#70: gate A MỞ **4/4 mẫu** trong cửa sổ (23:47:50Z 2.423.368 kB; 23:48:51Z 2.032.828 kB; 23:49:51Z 2.518.016 kB; 23:50:51Z 2.395.756 kB — cả 4 đều ≥1024 MiB). Tải: sampler load1 trong cửa sổ attempt1 **0,86–4,06**; **3 spike B2 trong cửa sổ attempt1** (23:48:51Z WebKit delta 85; 23:49:27Z load1 dư; 23:50:02Z load1 dư — xem §2.5). **1/3 spike do chính WebKit của attempt gây** (23:48:51Z, WebKitWebProcess delta 85 + MiniBrowser delta 28) — **KHÁC đợt 165 (0 spike nào trong cửa sổ attempt hợp lệ do WebKit gây; đợt này attempt1 KHÔNG hợp lệ và CÓ spike do chính WebKit gây)**. T4 ghi B2 load1 max 4,83 trong attempt1 — watcher T9 bắt max 4,69 trong cửa sổ (23:49:27Z), sampler 4,06 — các sampler khác nhau, chênh trong sai số đo (T9 không claim T4 sai).
  - Attempt2-#70: gate A MỞ **4/4 mẫu** trong cửa sổ (23:53:51Z 2.073.768 kB; 23:54:51Z 4.234.200 kB; 23:55:51Z 3.950.236 kB; 23:56:51Z 4.012.996 kB — cả 4 đều ≥1024 MiB).
  - Tải: sampler load1 trong cửa sổ attempt2-#70 **0,42–0,75**; **0 spike B2 trong cửa sổ attempt2-#70**. Attempt2 trượt do tickCost 77,0 ms (T4: tickCost cao KHÔNG do tải hệ thống — xem F-166-T4-2) — dữ kiện T9 corroborate: tải thấp, 0 spike.
  - Attempt3-#70 (PAGE-WEDGED): gate A MỞ **4/4 mẫu** trong cửa sổ (23:57:51Z 3.488.312 kB; 23:58:51Z 3.225.368 kB; 23:59:51Z 3.121.872 kB; 00:00:51Z 2.757.464 kB — cả 4 đều ≥1024 MiB).
  - Tải: sampler load1 trong cửa sổ attempt3-#70 **0,54–1,17**; **0 spike B2 trong cửa sổ attempt3-#70** (kể cả lúc kẹt 23:59:47Z — mẫu gần nhất 23:59:51Z load1 0,88). **PAGE-WEDGED xảy ra lúc tải thấp, không phải do tải ngoài** — cùng mẫu kẹt 86n2 đợt 165 (0 spike trong cửa sổ kẹt).
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cả ba cửa sổ attempt**.
- **Cộng dồn (theo T4-166): P1/P2/P3-A1/P3'/P7 KHÔNG tăng (không có lượt hợp lệ mới).** T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy attempt1 23:47:48–23:51:37Z + attempt2-#70 23:53:09–23:57:03Z + attempt3-#70 23:57:04–00:01:17Z.

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 23:47:50–23:50:51Z | #70 | 0,86–4,06 (4 mẫu) | 2.032.828–2.518.016 kB — **gate A MỞ 4/4** | T4 attempt1 — **3 spike B2 trong cửa sổ** (23:48:51Z + 23:49:27Z + 23:50:02Z, xem §2.5); attempt1 KHÔNG HỢP LỆ (B2 load1 max 4,83 > 4 + tickCost median đúng ngưỡng 60,0) |
| 23:53:51–23:56:51Z | #70 | 0,42–0,75 (4 mẫu) | 2.073.768–4.234.200 kB — **gate A MỞ 4/4** | T4 attempt2-#70 — **0 spike B2 trong cửa sổ**; attempt2 KHÔNG HỢP LỆ (tickCost median 77,0 ms > 60 dù lớp B 5/5 sạch) |
| 23:57:51–00:00:51Z | #70 | 0,54–1,17 (4 mẫu) | 2.757.464–3.488.312 kB — **gate A MỞ 4/4** | T4 attempt3-#70 — **0 spike B2 trong cửa sổ**; attempt3 PAGE-WEDGED 9/20 (kẹt rAF/renderer 23:59:47Z) |

### 2.5 B2 — 16 spike THẬT, 13 QUY ĐƯỢC DRIVER CỤ THỂ + 3 load1 dư (3 spike TRONG cửa sổ attempt1 — 1 do chính WebKit của attempt gây; 1 spike TRONG cửa sổ harness — do chính harness gây; 0 spike trong cửa sổ attempt2/attempt3 / cửa sổ O8 / cửa sổ ghim E-167/E-168)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-166-T9-3). **16 spike THẬT (đếm bằng `grep '^=== SPIKE'` — xem F-166-T9-3 về số 19 đếm thừa): 6 spike bão mở đợt #70 + 3 spike attempt1 T4 (23:41:20–23:50:02Z) + 6 spike bão apt sau reboot #71 (00:09:04–00:12:00Z) + 1 spike harness (00:24:06Z); 0 spike trong cửa sổ ghim E-167 (23:38:50Z) và E-168 (00:48:06–01:41:07Z); 0 spike trong cửa sổ attempt2/attempt3; 0 spike trong cửa sổ O8 (00:18:28–00:21:25Z); 0 spike trong cửa sổ kẹt PAGE-WEDGED (23:59:47Z).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — bão mở đợt #70 (6 spike liên tục) | 23:41:20–23:44:16Z | 3,56 → 6,51 → 3,30 | 6 | 23:41:20Z: ffmpeg delta **130** (round93-u4 render, con của mask_anim) + find T2 delta 4; 23:41:56Z: ffmpeg testsrc2 delta **43** + mask_anim 34,6% tích lũy (delta 0 — đã chết giữa chừng, xem dưới); 23:42:30Z: mask_anim delta **97** + blind9696-investigate.py (T2) delta 21; 23:43:05Z: ffmpeg **123%** tích lũy + mask_anim 69,5% (delta-miss — cả hai chết giữa chừng, xem dưới); 23:43:40Z: mask_anim delta **94** + blind9696 delta 18; 23:44:16Z: t5-stats-166.py delta **31** + hatch daemon delta **36** | **Bão mở đợt 166: T1 verify suite (mask_anim/ffmpeg round93-u4) + T2 điều tra (blind9696 + find) + T5 stats — nhiều luồng mở cùng lúc trên boot cũ** (cùng mẫu đợt 163/164/165). Load1 max đợt **7,29 lúc 23:42:50Z** (sampler; watcher bắt 6,51 lúc 23:43:05Z). **KHÔNG spike nào trong cụm này nằm trong cửa sổ attempt** (attempt1 bắt đầu 23:47:48Z, sau spike cuối cụm 3'32\") |
| 2 — T4 attempt1 (3 spike TRONG cửa sổ) | 23:48:51–23:50:02Z | 4,06 / 4,69 / 3,55 | 3 | 23:48:51Z: WebKitWebProcess delta **85** + MiniBrowser delta **28** (T4 attempt1 WebKit) + find T2 11,7% tích lũy; 23:49:27Z: **load1 dư** (delta max 15 — hatch daemon; find T2 D-state 10,0% tức thời, iowait 22,0% — xem dưới); 23:50:02Z: **load1 dư** (delta max 11 — hatch daemon; find T2 D-state 10,0% tức thời, iowait 19,0% — xem dưới) | **T4 attempt1** — cả ba spike NẰM TRONG cửa sổ attempt1 (23:47:48–23:51:37Z); **spike 23:48:51Z do chính WebKit của attempt gây** (khác đợt 165: 0 spike nào do WebKit của attempt gây — đợt này attempt1 CÓ spike do chính WebKit gây và attempt1 KHÔNG hợp lệ); 2 spike load1 dư không gán cho attempt (xem F-166-T9-5) |
| 3 — bão apt sau reboot #71 (6 spike) | 00:09:04–00:12:00Z | 5,14 → 5,79 → 3,21 | 6 | 00:09:04Z: apt methods store 36,2% tích lũy + hatch daemon delta **25**; 00:09:40Z: apt-get delta **88** + hatch daemon delta **61**; 00:10:15Z: apt-get **96,7%** tích lũy (delta-miss — xem dưới); 00:10:50Z: apt-get **71,0%** tích lũy (delta-miss); 00:11:25Z: dpkg **66,6%** + apt-get 59,4% + dpkg-deb 25,0% (delta-miss); 00:12:00Z: **load1 dư** (delta max 3, top -b 100,0% idle — xem dưới) | **Bão apt/dpkg post-boot trên #71** (apt-get -o DPkg::Post-Invoke + dpkg unpack nasm — hoạt động hệ thống sau reboot, T8 selfcheck ghi dpkg 1419 dòng lúc 00:11:28Z rồi 1545 dòng lúc 00:11:57Z — cùng khung giờ); **KHÔNG phải tải của VCut**; load1 max cụm 6,27 (sampler 00:10:04Z) / 5,79 (watcher 00:10:15Z) |
| 4 — T8 harness (1 spike TRONG cửa sổ) | 00:24:06Z | 3,35 | 1 | 00:24:06Z: WebKitWebProcess delta **97** + MiniBrowser delta **26** (harness WebKit 84l10) | **T8 harness WebKit 84l10** — spike NẰM TRONG cửa sổ harness (00:22:59–00:39:30Z), đúng pha 84l10 (00:23:02–00:24:22Z); driver là chính process harness, không phải tải lạ (cùng mẫu đợt 165: 5 spike harness do chính process harness) |

- **Tổng kết đếm: 13/16 spike có driver process cụ thể + 3 spike lớp "load1 dư"** (23:49:27Z; 23:50:02Z; 00:12:00Z — xem dưới). Đợt 165: 15/18 quy được + 3 load1 dư; đợt 164: 30/36 quy được + 6 load1 dư; đợt 163: 17/18 quy được + 1 load1 dư; đợt 162: 17/17 quy được. Đợt này tỉ lệ load1 dư 3/16 = 18,8% (bằng đợt 165: 16,7%).
- **3 spike load1 dư (định nghĩa: delta tick max ≤ 15 trong 1 s, không process nào đủ tải để giải thích load1 ≥ 3,0 — theo đúng tiền lệ đợt 160/163/164/165; xem F-166-T9-5 cho hai trường hợp trong attempt1):**
  - 23:49:27Z, load1 4,69 (TRONG cửa sổ attempt1): top tức thời chỉ có hatch daemon 30,0% + find T2 D-state 10,0%; delta tick max **15** (hatch daemon); %Cpu: 58,5% idle + **22,0% iowait**; find T2 (10,8% tích lũy) delta **mất** (không có trong danh sách delta — xem F-166-T9-6). Không có process nào đủ tải CPU trong giây đo — **load1 dư** (tải là dư âm của spike WebKit 23:48:51Z + find D-state + iowait; xem F-166-T9-5).
  - 23:50:02Z, load1 3,55 (TRONG cửa sổ attempt1): top tức thời chỉ có find T2 10,0% (R, TIME+ 0:13.63) + hatch daemon 0,0%; **top -b: 69,0% idle, 19,0% iowait, 2 task running**; delta tick max **11** (hatch daemon); find delta **mất**. Không có process nào đủ tải — **load1 dư** — không gán cho attempt (xem F-166-T9-5).
  - 00:12:00Z, load1 3,21 (sau bão apt #71): top tức thời chỉ có hatch daemon 13,8% tích lũy; **top -b: 100,0% idle, 0 task running**; delta tick top-3 chỉ 3 + 1 + 0. Không có process nào đủ tải — **load1 dư** — dư âm của bão apt 00:09:04–00:11:25Z.
  - T9 không giấu 3 spike này vào nhóm "quy được" (cùng mẫu F-163-T9-9).
- **Caveat đếm (F-166-T9-6):** 4 spike delta-miss (pid chết giữa chừng trong vòng delta 1 s): spike 23:43:05Z (ffmpeg 123% + mask_anim 69,5% tích lũy, delta mất cả hai) và spike 00:10:15Z (apt-get 96,7% tích lũy, delta mất) + 00:10:50Z (apt-get 71,0% tích lũy, delta mất) + 00:11:25Z (dpkg 66,6% + apt-get 59,4% tích lũy, delta mất) — quy driver bằng ps top tức thời + top -b, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164) và F-165-T9-6 (2 spike đợt 165). `grep -c 'WebKit\|MiniBrowser'` = **12 dòng** (2 spike: 23:48:51Z attempt1 + 00:24:06Z harness — WebKit xuất hiện trong 2/16 spike). `ps -eo args` của chính watcher: **0 dòng** trong b2-spikes-FROZEN.log — fix (n) đợt 150 VẪN ĐÓNG (watcher không tự lọt top lần nào).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: spike 23:43:05Z + 00:10:15Z + 00:10:50Z + 00:11:25Z (xem trên). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 13 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 13/16 spike — 3 spike lớp load1 dư đợt này (2 trong cửa sổ attempt1 lúc find D-state + iowait cao, 1 sau bão apt lúc CPU 100% idle).
- **Delta tick lớn nhất đợt: 130 tick/s** (ffmpeg round93-u4, spike 23:41:20Z, load1 3,56); mask_anim.py 97 tick/s (23:42:30Z); WebKitWebProcess 97 tick/s (00:24:06Z); apt-get 88 tick/s (00:09:40Z). (Đợt 165: max 139 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 23:38:5xZ CÙNG lúc sampler (khác đợt 163: watcher mở muộn 67 s sau sampler) — **0 khoảng mù đầu phiên đợt này**; spike đầu tiên watcher bắt được là 23:41:20Z (2m30s sau khi mở — trước đó load1 < 3,0). **Khoảng mù duy nhất: reboot #71 giết watcher, khởi động lại ~00:08:5xZ (gap 73 s cùng sampler — xem §5.1)** — **6 spike bão apt ngay sau khởi động lại** (00:09:04–00:12:00Z) đã bắt được đầy đủ. **0 gap phủ sóng watcher nào khác trong phiên.**

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg/mask_anim.py xuất hiện trong 5 spike của bão mở đợt** (mask_anim ellipse + ffmpeg ffv1/testsrc2 — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 1 spike delta-miss 23:43:05Z — xem §2.5). **apt-get/dpkg xuất hiện trong 5 spike bão post-boot #71** (hoạt động hệ thống sau reboot — không phải tải VCut; T8 selfcheck corroborate dpkg 1419 → 1545 dòng trong cùng khung giờ). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T2 điều tra + T5 stats + T4 attempt + T8 O8/harness + apt post-boot + hatch daemon; **12 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log — 2 spike, đã quy driver ở §2.5**).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ hai mươi liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt (xem F-166-T9-4 về gap phủ sóng đầu phiên):** sampler `round166-t9/sampler.sh` chạy liên tục 23:38:50Z–01:41:07Z, **123 mẫu, gap trong log lớn nhất 73 s, 0 gap >90 s**; khởi động lại bằng tay ~00:08:5xZ (boot+~55s) sau reboot #71 — khoảng trống trong log 73 s (00:07:51Z → 00:09:04Z), **0 gap >90 s trong toàn phiên kể cả qua reboot** (đợt 165: gap 35 s qua reboot #70; đợt 164: gap 57 s qua reboot #68; đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **4.399.884 kB = 69,93% guard** (đợt 165: 58,05%; đợt 164: 45,65%; đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). **69,93% là tỉ lệ cao nhất kể từ đợt 150** — gần guard nhất trong chuỗi 17 đợt gần đây. Khoảng cách tới guard lúc đỉnh: **1.891.572 kB (30,07%)**.
- **Guard giữ nguyên: 6.291.456 kB (6.144 MiB).** Không mẫu nào chạm 6.144 MiB — cơ chế (a) **armed** (sampler chạy liên tục) và **KHÔNG kích hoạt** suốt 2h02m.
- **0 lần thử birefnet trong đợt 166 — lần thứ hai mươi liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0; đợt 165: 0; đợt 166: 0). **Chuỗi 0 lần thử: 20 đợt liên tiếp** (đợt 147–166).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 20 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round166-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `/usr/bin/python3.12` — đợt 165 ghi `bin/python3.11`, xem F-166-T9-9); `bgremove.py` **23.500 B** (không đổi so với đợt 165); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-166-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt (xem F-166-T9-4 về gap đầu phiên).**
- **Không cần chạy lại birefnet trong đợt 166** (guard chưa từng mở; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (boot #70 ≥47 dòng + boot #71 = 9 dòng; tổng ≥56 dòng, cận dưới — đợt thứ mười lăm liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#70** (d1ddd946, btime 22:05:25Z): **≥47 dòng** (T9 đếm trực tiếp: 24 dòng lúc 23:39:01Z → 47 dòng lúc 00:04:42Z; **phần còn lại 00:04:42Z → reboot #71 (00:08:00Z) mất theo reboot, KHÔNG cộng số ước** — journal của #70 không đọc được nữa sau #71, `journalctl --list-boots` lúc đóng chỉ còn #71, xem F-166-T9-10). Trong 47 dòng này có **1 dòng 22:07:09Z đã tính trong đợt 165** (dòng duy nhất trên #70 đợt 165) — số dòng thuộc về đợt 166 trên #70 là ≥46 (47 − 1). Dòng mới nhất đếm được trên #70 lúc 00:04:42Z (T9 không ghi timestamp dòng cuối #70 lúc đó — chỉ ghi số đếm; dòng cuối ghi được là 23:37:56Z lúc mở phiên). Nhịp ~1 dòng/phút trong lúc headroom 0 (24 → 47 trong ~26 phút).
- Boot **#71** (ea73ac4f, btime 00:08:00Z): **9 dòng** (T9 đếm trực tiếp từ journal lúc đóng phiên; **không cộng số ước**). Dòng đầu tiên: **00:09:51Z (boot+111s)** — đúng lúc cửa sổ thoáng đóng (headroom về 0 lúc boot+160s); dòng cuối cùng: **00:39:01Z**. Sau đó **KHÔNG CÓ dòng ENOSPC nào nữa** (đếm = 9 ở cả 4 lần probe sau: 00:39:04Z, 01:09:04Z, 01:39:04Z, 01:41:43Z) — **62 phút im** vì headroom ổn định ở 6 nên systemd thêm được watch.
- **Tổng đợt 166: ≥47 + 9 = ≥56 dòng đếm được (cận dưới)** — đợt thứ mười lăm liên tiếp có lỗi thật (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng — T9 đếm trực tiếp 35 dòng boot #68 + ghi số đếm T5 18 dòng boot #67; đợt 165: ≥64 dòng — T9 đếm trực tiếp, parent quyết (l) chấp nhận làm số chính thức; đợt 166: ≥56 dòng — T9 đếm trực tiếp). **Caveat: số đợt này là CẬN DƯỚI** — phần còn lại boot #70 (00:04:42Z → 00:08:00Z) mất theo reboot #71, không đếm được; và 1 dòng trong 47 đã tính trong đợt 165 (xem trên).
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device` (đợt 165: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 165:** đợt 165 có ≥64 dòng (boot #69 ≥63 + boot #70 1). Đợt này **≥56 dòng** — thấp hơn đợt 165 dù cùng 1 reboot giữa phiên, vì boot #71 chỉ có 9 dòng (headroom 6 ổn định 62 phút cuối phiên, ENOSPC im) so với boot #69 đợt 165 (headroom 0 suốt, ENOSPC nhịp ~70 s không ngừng).
- **Điểm mới (giao parent/T10 xem lại quyết (g) — T9 chỉ nêu dữ kiện):** boot #71 có 9 dòng ENOSPC rồi im hoàn toàn 62 phút khi headroom nhích từ 0 lên 6 — lần thứ ba liên tiếp một boot có khoảng im ENOSPC dài sau khi headroom nhích lên (đợt 164: im 53 phút lúc headroom 1–2; đợt 165: boot #70 chỉ 1 dòng cả boot lúc headroom 2). Đây là **bằng chứng độc lập (ngoài probe)** rằng headroom 6 là thật (không phải lỗi probe) — systemd thêm được watch trong khoảng đó.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #70 + #71 — 2 reboot trong/anh quanh đợt 166 (cùng mẫu đợt 165: 2 reboot)

- **Reboot #70 (d1ddd946, btime 22:05:25Z; gap #69→#70 = 6.954 s):** xảy ra GIỮA PHIÊN đợt 165 (đã xác nhận đầy đủ, quyết parent (d) đợt 165). Đợt 166 mở trên chính boot này (23:35:51Z, boot+1.746s) — **KHÔNG có reboot giữa đợt 165 và đợt 166**.
- **Reboot #71 (ea73ac4f, btime 00:08:00Z; gap #70→#71 = 7.355 s):** xảy ra **GIỮA PHIÊN** (00:08:00Z, 32m09s sau khi đợt mở). Sampler + watcher + probe-loop **CHẾT theo reboot** (điểm yếu (d) đợt 148 tái diễn lần thứ tư liên tiếp — đợt 163 chết theo #66, đợt 164 chết theo #68, đợt 165 chết theo #70, đợt này chết theo #71); T9 khởi động lại cả ba bằng tay **~00:08:5xZ (boot+~55s)** — **khoảng trống phủ sóng trong log 73 s** (00:07:51Z → 00:09:04Z), **0 gap >90 s trong toàn phiên kể cả qua reboot** (đợt 165: gap 35 s). **1 lệnh sleep-wait của T9 bị reboot #71 giết** (SIGTERM sau 191 s — chỉ là timer chờ, không có side effect; trạng thái đã verify lại từ disk sau đó — xem F-166-T9-1).
- **Mẫu sampler đầu #71 (00:09:04Z) mang nhãn boot mới `ea73ac4f` đúng** — KHÔNG lặp F-165-T9-4 (mẫu 22:05:53Z đợt 165 mang nhãn boot cũ 28 s sau btime mới): lần này reboot xảy ra giữa hai mẫu (00:07:51Z → 00:09:04Z), sampler khởi động lại sau reboot nên nhãn đúng ngay từ mẫu đầu.
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn** (T0-166 đo; T9 không đo lại).
- **Khoảng trống phủ sóng đầu phiên (F-166-T9-4):** đợt mở 23:35:51Z (boot+1.746s), T9 nhận việc ~23:38:2xZ (boot+~1.900s), sampler khởi động 23:38:50Z (boot+1.925s) — **gap 179 s từ lúc đợt mở tới khi sampler chạy** (đợt 165: gap 1.760 s; đợt 164: gap 383 s; đợt 163: gap 113 s — đợt này gap NGẮN NHẤT kể từ khi T9 ghi gap vì T9 mở sớm, đúng bài học F-165-T9-1). Trong 179 s này: E-167 vẫn ghim (mẫu đầu 23:38:50Z ghim), headroom về 0 (probe mở 23:39:01Z đã là 0 — khác giá trị đóng đợt 165 là 2). T9 ghi gap này để T10/parent biết, không giấu.

### 5.2 T5-166 (infra) — POSTBOOT_PASS #70 ĐÃ CÓ; #71 CHƯA CÓ (thuộc T5-167); watcher-166 (giao T5-167 xác minh)

- **POSTBOOT_PASS #70 ĐÃ CÓ lúc 23:40:45Z** (boot+1h35m20s, replay đầy đủ — T5-166 xác nhận).
- **POSTBOOT_PASS #71 CHƯA CÓ lúc T9 đóng** (T8-166: waiter #71 32 poll, t4=1 postboot=0 — KHÔNG có POSTBOOT_PASS #71; T5 không có hoạt động nào cho #71 sau 00:08Z; **thuộc T5-167**).
- **Watcher-166: T9 không kiểm tra** (T5-166 sở hữu; watcher-166 pid 26422 chết theo #71 theo T8-166; watcher-166 có khởi động lại sau #71 hay không — giao T5-167 xác minh lúc mở).
- **Marker: T9 không đếm lại** (T0/T5 sở hữu; T5-166 đếm 22 reboot #49–#70; #71 thêm vào — giao T0-167/T5-167 đếm).
- **X11 (T9 kiểm tra lúc đóng phiên 01:42Z):** `/tmp/.X11-unix/` **TRỐNG** (0 socket, 0 Xvfb đang chạy) — T8-166 chạy trên #71 cũng đã dọn; T9 không dọn gì thêm.

### 5.3 T8-166 (vite harness + O8) — ĐÃ đóng cờ lúc T9 đóng (~00:45Z); O8 PASS 3/3 KHÔNG TÍNH CHUỖI, harness 6/6 SẠCH, 0 KẸT, (1c) KHÔNG TRIỂN KHAI

- **GATE-FOUND poll=26 lúc 00:07:25Z qua đường (a) CHUẨN cho boot #70** (POSTBOOT_PASS #70 đã có 23:40:45Z, cờ T4 viết 00:07:05Z) — **NHƯNG O8 KHÔNG chạy trên #70:** reboot #71 (btime 00:08:00Z) xảy ra **35 s sau GATE-FOUND**, 55 s sau cờ T4. O8 chạy 00:18:28Z trên boot #71 mới. Gate cho #71 **KHÔNG FOUND** (waiter #71: 32 poll, t4=1 postboot=0).
- **O8 PASS 3/3, DONE 00:21:25Z, WebKit 21/21 ×2 + Chromium 21/21** (exit 0 ×3 theo log driver — T8 LIMITS đã xuất bản; T9 không trích số chi tiết O8, thuộc T8-166/T10) — **KHÔNG TÍNH CHUỖI** (T8 đề xuất GIỮ 19 — chờ T10/parent phán): (1) lượt yên #35 KHÔNG CÓ lượt hợp lệ nào (chuỗi #22→#30 ĐỨT); (2) O8 chạy trên boot #71, KHÁC boot các attempt của T4 (#70); (3) gate cho boot đo (#71) không FOUND qua (a) hay (b).
- **Harness 6/6 PASS + 0 KẸT (00:22:59–00:39:30Z, MỘT lần chạy driver duy nhất):** WebKit 84l10/85m4/86n2 PASS + Chromium 84l10/85m4/86n2 PASS; 85m4 P4-lần3 PASS (chuỗi 6 → 7); 86n2 P4-lần3 PASS (điểm kẹt đợt 165 KHÔNG tái diễn); 86n2 P4-lần2 PASS (chuỗi verdict 16 → 17); 84l10 E4 ended=true trở lại; kẹt cộng dồn **GIỮ 16**; chuỗi "P3 không kẹt" 0 → 1.
- **(1c) KHÔNG TRIỂN KHAI đợt này:** replay offline thiết kế gốc §C2 (3 dòng HB128 mới nhất, span ≥120 s) **0 kích hoạt trên CẢ 3 log** — kể cả log kẹt đóng băng đợt 164 — tiêu chí C5.1 KHÔNG ĐẠT (nguyên nhân cấu trúc: các dòng HB128 cách nhau 5 s nên 3 dòng liên tiếp span tối đa 10 s). Biến thể sửa (c') kích hoạt đúng elapsed=125 s trên log kẹt 164 và 0 false-positive trên 3 log sạch — **chờ parent duyệt bản sửa (c') rồi T8 đợt sau triển khai**. Driver harness đợt này chạy với (1b) như cũ, không có (1c).
- **Watchdog (i): 0 kích hoạt — ĐÚNG (không có kẹt thật). Live-diag (1b): 0 kích hoạt — ĐÚNG.** 0 snapshot stall.
- **Đối chiếu sampler T9 trong cửa sổ O8 (00:18:28–00:21:25Z): 3 mẫu, gate A MỞ 1/3** (00:19:04Z 903.512 kB và 00:20:05Z 801.364 kB thấp hơn gate; 00:21:05Z 1.135.756 kB ≥ gate), balloon 78,8–84,3% trần (không ghim), load1 max 1,80 (mẫu 00:19:04Z); **0 spike B2 trong cửa sổ O8**.
- **Đối chiếu sampler T9 trong cửa sổ harness (00:22:59–00:39:30Z): 17 mẫu, gate A MỞ 5/17**, balloon 76,2–92,4% trần (chưa ghim), load1 max 2,95 (mẫu 00:24:05Z); **RAM min trong cửa sổ harness 534.048 kB lúc 00:31:05Z** (T8 đo độc lập 527 MB @00:31:00Z — khớp trong ~1%, cadence khác nhau); **1 spike B2 trong cửa sổ harness** (00:24:06Z, WebKit delta 97 — pha 84l10, do chính harness gây, xem §2.5); **0 kẹt** trong cửa sổ.
- **T8 ĐÓNG ~00:45Z — TRONG hạn cờ ~02:00Z.** Chi tiết O8/harness đầy đủ thuộc T8-166/T10.

### 5.4 T7-166 (scheduler) — T7 CHƯA đóng cờ lúc T9 đóng; kết cục run 165 + (m) #70/#71 thuộc T7-166/T2-166

- **Run 165 vẫn running lúc T9 đóng** (T7-166 CHƯA đóng cờ lúc 01:42:14Z — T9 kiểm tra lúc đóng; hạn run 165 là 02:35:51Z) — kết cục + (m) #70 thuộc T7-166/T2-166 (T7-166 có thể đã đóng sau khi T9 đóng — giao T10 xác nhận từ file cờ).
- **(m) #71 thuộc T2-167** (T2-166 đóng trước #71 00:08:00Z nên không nhắc #71 — cùng mẫu (m) #70 thuộc T2-166 đợt 165).
- T7-166 đóng cờ sau T9 (nếu có) — T9 không chờ T7 (hạn cờ T9 ~02:00Z).

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc 01:42:14Z (7/9)** — T7 chưa đóng, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T2-166:** (m) #70 đối chiếu độc lập (T2-166 sở hữu); mù #96?/#95?/#94?/#88?/#77? (T2-166 sở hữu); INSIDE #70 dải FULL116 (T2-166 sở hữu). T9 không trích số — thuộc T2-166/T10.
- **T1-166:** verify đợt 165 (T9 không trích số — thuộc T1-166/T10).
- **T6-166:** prune lần 41 (T9 không trích số — thuộc T6-166/T10).
- **T4-166:** xem §2.3 (LIMITS đã xuất bản).
- **T0-166:** boot #70 xác nhận đầy đủ 9 nguồn (T9 không trích số — thuộc T0-166/T10).

## 6. Sai số / caveat (F-166-T9-*)

- **F-166-T9-1 — 1 lệnh sleep-wait của T9 bị reboot #71 giết** (SIGTERM sau 191 s — runtime restart recovery cho session proc_98b10d6656f1 — chỉ là timer chờ, không có side effect; trạng thái đã verify lại từ disk sau đó). Cùng mẫu F-165-T9-3 (sleep-wait bị reboot #70 giết). Không cần làm lại.
- **F-166-T9-2 — pkill -f tự giết shell của T9 khi dừng sampler lúc đóng phiên.** Lệnh `pkill -f 'round166-t9/sampler.sh'` khớp cả cmdline của chính lệnh exec chứa chuỗi đó nên shell bị SIGTERM sau khi chỉ giết được sampler (pid 1928); watcher (1929) + probe-loop (1930) còn sống và phải kill bằng PID trực tiếp sau đó. Không mất dữ liệu (sampler đã ghi mẫu cuối 01:41:07Z trước khi bị giết; log đóng băng SAU khi cả ba đã dừng — xác minh 0 process sót lúc 01:42:14Z). Bài học: dừng process bằng PID, không dùng pkill -f với pattern trùng cmdline của chính mình.
- **F-166-T9-3 — grep -c '=== SPIKE' đếm thừa 19 thay vì 16 spike thật.** Cmdline của lệnh exec chờ của T9 (pid 2459, session proc_67205a208d61) chứa chuỗi '=== SPIKE' trong heredoc (lệnh `grep -c '=== SPIKE' b2-spikes.log` nằm trong chính script chờ) — watcher bắt process này vào ps snapshot ở 3 spike (14 dòng chứa pid 2459/31939 trong log), và `grep -c '=== SPIKE'` đếm cả 3 dòng giả đó. **Số spike thật = 16 (đếm bằng `grep '^=== SPIKE'`)** — T9 đã đếm lại bằng grep neo đầu dòng và phân tích đủ 16 block. Bài học: không để chuỗi '=== SPIKE' (hay bất kỳ marker đếm nào) xuất hiện trong cmdline của lệnh exec dài; đếm spike luôn bằng grep neo `^`.
- **F-166-T9-4 — Khoảng mù giữa hai đợt 2.841 s (22:51:29Z → 23:38:50Z) + gap phủ sóng đầu phiên 179 s.** Sampler đợt 165 dừng lúc đóng (22:51:29Z); sampler đợt 166 khởi động 23:38:50Z. Trong 2.841 s này E-167 có thể đã đứt + ghim lại mà không quan sát được — T9 trình cả hai cách đọc tổng E-167 (37 mẫu nếu tính tiếp nối; 36 mẫu + 1 mẫu riêng nếu không) và giao T10 phán. Gap đầu phiên đợt này chỉ 179 s (đợt mở 23:35:51Z → sampler 23:38:50Z) — ngắn nhất kể từ khi T9 ghi gap (đợt 165: 1.760 s) vì T9 mở sớm, KHÔNG lặp F-165-T9-1. Trong 179 s này: E-167 vẫn ghim (mẫu đầu ghim), headroom về 0 (probe mở 23:39:01Z đã là 0 — khác giá trị đóng đợt 165 là 2).
- **F-166-T9-5 — Spike 23:49:27Z (load1 4,69) + 23:50:02Z (load1 3,55) phân loại load1 dư dù find T2 ở D-state 10,0% tức thời.** Căn cứ phân loại: delta max 15 / 11 (hatch daemon); find T2 (10,8–11,6% tích lũy) delta **mất**; top -b: **58,5–69,0% idle + 19,0–22,0% iowait**, không process nào chạy mạnh về CPU trong giây đo; load1 là dư âm của spike WebKit 23:48:51Z + find D-state + iowait. T9 phân loại load1 dư theo THỰC CHẤT (không process nào đủ tải CPU trong giây đo) thay vì theo chữ (delta ≤15) và ghi rõ số 15/11 + trạng thái D-state của find để T10/parent kiểm lại — không giấu vào nhóm "quy được". Nếu parent giữ cách đọc "find D-state cũng tính là driver" thì 2 spike này thành "quy được một phần" (find T2 D-state + hatch daemon) — T9 trình cả hai cách đọc. Cùng tiền lệ F-165-T9-5 (spike 20:46:07Z đợt 165: find D-state 10,0% + iowait 18,6% → load1 dư).
- **F-166-T9-6 — 4 spike delta-miss (pid chết giữa chừng trong vòng delta 1 s): 23:43:05Z (ffmpeg 123% + mask_anim 69,5% tích lũy, delta mất cả hai); 00:10:15Z (apt-get 96,7% tích lũy, delta mất); 00:10:50Z (apt-get 71,0% tích lũy, delta mất); 00:11:25Z (dpkg 66,6% + apt-get 59,4% tích lũy, delta mất).** Quy driver bằng ps top tức thời + top -b, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164) và F-165-T9-6 (2 spike đợt 165). `ps -eo args` của chính watcher: **0 dòng** trong b2-spikes-FROZEN.log — fix (n) đợt 150 VẪN ĐÓNG.
- **F-166-T9-7 — Mẫu đầu #71 (00:09:04Z) load1=5,14 — sampler đo load1 cao ngay mẫu đầu sau reboot** (bão apt post-boot đang chạy; watcher bắt spike 00:09:04Z cùng giây, load1 5,14 — khớp nhau). Không phải lỗi sampler.
- **F-166-T9-8 — E-168 CHƯA ĐỨT lúc đóng phiên (54 mẫu, vẫn ghim ở mẫu cuối 01:41:07Z).** Kết cục E-168 (đứt lúc nào, có sag không, tổng bao nhiêu mẫu) thuộc T9-167. T9 không claim E-168 đã kết thúc.
- **F-166-T9-9 — bgremove `.venv/bin/python` symlink giờ trỏ `/usr/bin/python3.12` (đợt 165 ghi `bin/python3.11`).** T9 chỉ ghi số đo lúc đóng phiên (01:42Z), không truy thời điểm đổi và không claim đổi trong đợt 166. Các file khác không đổi: bgremove.py 23.500 B, birefnet-general.onnx 972.666.916 B, u2net.onnx 175.997.641 B, clip05.mp4 14.554 B.
- **F-166-T9-10 — ENOSPC #70 ≥47 là cận dưới (phần 00:04:42Z → 00:08:00Z mất theo reboot #71, KHÔNG cộng số ước); 1 dòng trong 47 (22:07:09Z) đã tính trong đợt 165.** Tổng đợt 166 ≥56 dòng đếm được (cận dưới) = ≥47 (#70) + 9 (#71); số dòng thuộc về đợt 166 trên #70 là ≥46. T9 ghi cả hai số để T10/parent không đếm trùng dòng 22:07:09Z.
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được, chỉ biết ≥30.001); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC từ cell vì journalctl chỉ còn boot hiện tại sau reboot (cùng họ EPERM như `dmesg` — xem F-163-T9-1); T10 không đếm lại độc lập B2 đợt 165 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).




---

---

## Phụ lục — log sampler đóng băng (123 mẫu, 23:38:50Z–01:41:07Z)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round166-t9/ram-sampler-FROZEN.log` (md5 `4d3b570400a83a50e671d4ce9a11f0cf`) — không gõ lại bằng tay (xem F-164-T9-10).

```
2026-11-21T23:38:50Z boot=d1ddd946 mem=410988 bal=6443824 swapfree=651880 load1=0.81
2026-11-21T23:39:50Z boot=d1ddd946 mem=372732 bal=6080052 swapfree=584976 load1=1.07
2026-11-21T23:40:50Z boot=d1ddd946 mem=1063840 bal=5605164 swapfree=625452 load1=1.62
2026-11-21T23:41:50Z boot=d1ddd946 mem=620052 bal=5726892 swapfree=622544 load1=5.29
2026-11-21T23:42:50Z boot=d1ddd946 mem=1878544 bal=4743852 swapfree=660192 load1=7.29
2026-11-21T23:43:50Z boot=d1ddd946 mem=2637896 bal=3760812 swapfree=666008 load1=4.31
2026-11-21T23:44:50Z boot=d1ddd946 mem=2786680 bal=3772552 swapfree=666292 load1=1.99
2026-11-21T23:45:50Z boot=d1ddd946 mem=2682112 bal=3874936 swapfree=666828 load1=1.10
2026-11-21T23:46:50Z boot=d1ddd946 mem=2889644 bal=3763484 swapfree=667696 load1=1.06
2026-11-21T23:47:50Z boot=d1ddd946 mem=2423368 bal=3914140 swapfree=666532 load1=0.86
2026-11-21T23:48:51Z boot=d1ddd946 mem=2032828 bal=3799936 swapfree=671348 load1=4.06
2026-11-21T23:49:51Z boot=d1ddd946 mem=2518016 bal=3854644 swapfree=670368 load1=4.02
2026-11-21T23:50:51Z boot=d1ddd946 mem=2395756 bal=4039492 swapfree=675160 load1=2.00
2026-11-21T23:51:51Z boot=d1ddd946 mem=2777848 bal=4003624 swapfree=676192 load1=1.10
2026-11-21T23:52:51Z boot=d1ddd946 mem=2638204 bal=4008448 swapfree=674816 load1=0.87
2026-11-21T23:53:51Z boot=d1ddd946 mem=2073768 bal=3454068 swapfree=642460 load1=0.75
2026-11-21T23:54:51Z boot=d1ddd946 mem=4234200 bal=1946740 swapfree=635952 load1=0.42
2026-11-21T23:55:51Z boot=d1ddd946 mem=3950236 bal=2339956 swapfree=642648 load1=0.39
2026-11-21T23:56:51Z boot=d1ddd946 mem=4012996 bal=2516296 swapfree=649448 load1=0.54
2026-11-21T23:57:51Z boot=d1ddd946 mem=3488312 bal=2254152 swapfree=649696 load1=1.17
2026-11-21T23:58:51Z boot=d1ddd946 mem=3225368 bal=2626588 swapfree=649784 load1=0.88
2026-11-21T23:59:51Z boot=d1ddd946 mem=3121872 bal=2983292 swapfree=651160 load1=0.87
2026-11-22T00:00:51Z boot=d1ddd946 mem=2757464 bal=3312256 swapfree=653868 load1=0.61
2026-11-22T00:01:51Z boot=d1ddd946 mem=4399884 bal=2355824 swapfree=655144 load1=1.18
2026-11-22T00:02:51Z boot=d1ddd946 mem=4184536 bal=2552432 swapfree=657428 load1=0.43
2026-11-22T00:03:51Z boot=d1ddd946 mem=3764592 bal=2945648 swapfree=659336 load1=0.16
2026-11-22T00:04:51Z boot=d1ddd946 mem=3383932 bal=3333816 swapfree=662936 load1=0.29
2026-11-22T00:05:51Z boot=d1ddd946 mem=2979908 bal=3687392 swapfree=665668 load1=0.24
2026-11-22T00:06:51Z boot=d1ddd946 mem=2728808 bal=4008672 swapfree=754240 load1=0.30
2026-11-22T00:07:51Z boot=d1ddd946 mem=2477596 bal=4304940 swapfree=756836 load1=0.16
2026-11-22T00:09:04Z boot=ea73ac4f mem=1898412 bal=5020300 swapfree=1040552 load1=5.14
2026-11-22T00:10:04Z boot=ea73ac4f mem=1746844 bal=5033060 swapfree=935464 load1=6.27
2026-11-22T00:11:04Z boot=ea73ac4f mem=1711804 bal=5172208 swapfree=900176 load1=3.72
2026-11-22T00:12:04Z boot=ea73ac4f mem=1557768 bal=5363756 swapfree=859972 load1=3.21
2026-11-22T00:13:04Z boot=ea73ac4f mem=1401732 bal=5544904 swapfree=861232 load1=1.25
2026-11-22T00:14:04Z boot=ea73ac4f mem=1240700 bal=5709236 swapfree=851404 load1=0.49
2026-11-22T00:15:04Z boot=ea73ac4f mem=1104856 bal=5856344 swapfree=838312 load1=0.39
2026-11-22T00:16:04Z boot=ea73ac4f mem=982120 bal=5993388 swapfree=827924 load1=0.36
2026-11-22T00:17:04Z boot=ea73ac4f mem=855040 bal=6118748 swapfree=817684 load1=0.93
2026-11-22T00:18:04Z boot=ea73ac4f mem=747832 bal=6232748 swapfree=820956 load1=0.41
2026-11-22T00:19:04Z boot=ea73ac4f mem=903512 bal=5315244 swapfree=681048 load1=1.80
2026-11-22T00:20:05Z boot=ea73ac4f mem=801364 bal=5433356 swapfree=671428 load1=1.73
2026-11-22T00:21:05Z boot=ea73ac4f mem=1135756 bal=5075840 swapfree=667756 load1=1.15
2026-11-22T00:22:05Z boot=ea73ac4f mem=1692252 bal=5269908 swapfree=669728 load1=0.52
2026-11-22T00:23:05Z boot=ea73ac4f mem=1334804 bal=5461732 swapfree=674284 load1=0.32
2026-11-22T00:24:05Z boot=ea73ac4f mem=794164 bal=5564128 swapfree=671752 load1=2.95
2026-11-22T00:25:05Z boot=ea73ac4f mem=715260 bal=5670080 swapfree=663124 load1=2.47
2026-11-22T00:26:05Z boot=ea73ac4f mem=612528 bal=5768668 swapfree=664152 load1=2.43
2026-11-22T00:27:05Z boot=ea73ac4f mem=1110132 bal=5858812 swapfree=662924 load1=1.90
2026-11-22T00:28:05Z boot=ea73ac4f mem=632860 bal=5669296 swapfree=652680 load1=2.02
2026-11-22T00:29:05Z boot=ea73ac4f mem=570084 bal=5763848 swapfree=658668 load1=2.01
2026-11-22T00:30:05Z boot=ea73ac4f mem=585596 bal=5860996 swapfree=659772 load1=1.38
2026-11-22T00:31:05Z boot=ea73ac4f mem=534048 bal=5951964 swapfree=660532 load1=0.83
2026-11-22T00:32:05Z boot=ea73ac4f mem=699388 bal=5564892 swapfree=647976 load1=1.57
2026-11-22T00:33:05Z boot=ea73ac4f mem=1456816 bal=5533808 swapfree=649800 load1=2.10
2026-11-22T00:34:05Z boot=ea73ac4f mem=1158768 bal=5035376 swapfree=648200 load1=2.10
2026-11-22T00:35:05Z boot=ea73ac4f mem=883464 bal=5183980 swapfree=655676 load1=2.38
2026-11-22T00:36:05Z boot=ea73ac4f mem=1375564 bal=4912264 swapfree=655884 load1=1.97
2026-11-22T00:37:06Z boot=ea73ac4f mem=1035804 bal=5073720 swapfree=656808 load1=1.56
2026-11-22T00:38:06Z boot=ea73ac4f mem=1033296 bal=5231872 swapfree=655816 load1=0.90
2026-11-22T00:39:06Z boot=ea73ac4f mem=899408 bal=5383812 swapfree=662116 load1=0.38
2026-11-22T00:40:06Z boot=ea73ac4f mem=1433940 bal=5553504 swapfree=662892 load1=0.43
2026-11-22T00:41:06Z boot=ea73ac4f mem=1252364 bal=5719400 swapfree=665264 load1=0.60
2026-11-22T00:42:06Z boot=ea73ac4f mem=1057204 bal=5866208 swapfree=678976 load1=0.42
2026-11-22T00:43:06Z boot=ea73ac4f mem=983496 bal=5979096 swapfree=679680 load1=0.15
2026-11-22T00:44:06Z boot=ea73ac4f mem=881200 bal=6085960 swapfree=679312 load1=0.13
2026-11-22T00:45:06Z boot=ea73ac4f mem=777160 bal=6203072 swapfree=678300 load1=0.05
2026-11-22T00:46:06Z boot=ea73ac4f mem=673080 bal=6310164 swapfree=677876 load1=0.14
2026-11-22T00:47:06Z boot=ea73ac4f mem=554520 bal=6408372 swapfree=679432 load1=0.33
2026-11-22T00:48:06Z boot=ea73ac4f mem=522284 bal=6443824 swapfree=674928 load1=0.12
2026-11-22T00:49:06Z boot=ea73ac4f mem=530832 bal=6443824 swapfree=683284 load1=0.36
2026-11-22T00:50:06Z boot=ea73ac4f mem=522772 bal=6443824 swapfree=684420 load1=0.22
2026-11-22T00:51:06Z boot=ea73ac4f mem=519032 bal=6443824 swapfree=684884 load1=0.08
2026-11-22T00:52:06Z boot=ea73ac4f mem=522396 bal=6443824 swapfree=684924 load1=0.03
2026-11-22T00:53:06Z boot=ea73ac4f mem=519484 bal=6443824 swapfree=685088 load1=0.01
2026-11-22T00:54:06Z boot=ea73ac4f mem=528032 bal=6443824 swapfree=684940 load1=0.00
2026-11-22T00:55:06Z boot=ea73ac4f mem=524948 bal=6443824 swapfree=685300 load1=0.07
2026-11-22T00:56:06Z boot=ea73ac4f mem=516976 bal=6443824 swapfree=684732 load1=0.07
2026-11-22T00:57:06Z boot=ea73ac4f mem=517736 bal=6443824 swapfree=684084 load1=0.02
2026-11-22T00:58:06Z boot=ea73ac4f mem=519904 bal=6443824 swapfree=683652 load1=0.10
2026-11-22T00:59:06Z boot=ea73ac4f mem=523056 bal=6443824 swapfree=683000 load1=0.03
2026-11-22T01:00:06Z boot=ea73ac4f mem=542488 bal=6443824 swapfree=692476 load1=0.12
2026-11-22T01:01:06Z boot=ea73ac4f mem=525516 bal=6443824 swapfree=690680 load1=0.12
2026-11-22T01:02:06Z boot=ea73ac4f mem=519624 bal=6443824 swapfree=691156 load1=0.33
2026-11-22T01:03:06Z boot=ea73ac4f mem=513796 bal=6443824 swapfree=691200 load1=0.15
2026-11-22T01:04:06Z boot=ea73ac4f mem=509532 bal=6443824 swapfree=691268 load1=0.05
2026-11-22T01:05:06Z boot=ea73ac4f mem=537796 bal=6443824 swapfree=691148 load1=0.07
2026-11-22T01:06:06Z boot=ea73ac4f mem=506168 bal=6443824 swapfree=691156 load1=0.02
2026-11-22T01:07:06Z boot=ea73ac4f mem=524896 bal=6443824 swapfree=691472 load1=0.01
2026-11-22T01:08:06Z boot=ea73ac4f mem=519348 bal=6443824 swapfree=691804 load1=0.00
2026-11-22T01:09:06Z boot=ea73ac4f mem=618908 bal=6443824 swapfree=809080 load1=0.21
2026-11-22T01:10:06Z boot=ea73ac4f mem=595184 bal=6443824 swapfree=811760 load1=0.08
2026-11-22T01:11:07Z boot=ea73ac4f mem=569040 bal=6443824 swapfree=812960 load1=0.06
2026-11-22T01:12:07Z boot=ea73ac4f mem=556064 bal=6443824 swapfree=813088 load1=0.18
2026-11-22T01:13:07Z boot=ea73ac4f mem=556404 bal=6443824 swapfree=813372 load1=0.19
2026-11-22T01:14:07Z boot=ea73ac4f mem=546264 bal=6443824 swapfree=812936 load1=0.16
2026-11-22T01:15:07Z boot=ea73ac4f mem=554292 bal=6443824 swapfree=812556 load1=0.15
2026-11-22T01:16:07Z boot=ea73ac4f mem=547428 bal=6443824 swapfree=812916 load1=0.23
2026-11-22T01:17:07Z boot=ea73ac4f mem=544508 bal=6443824 swapfree=812924 load1=0.19
2026-11-22T01:18:07Z boot=ea73ac4f mem=542788 bal=6443824 swapfree=812960 load1=0.21
2026-11-22T01:19:07Z boot=ea73ac4f mem=539456 bal=6443824 swapfree=813264 load1=0.21
2026-11-22T01:20:07Z boot=ea73ac4f mem=556336 bal=6443824 swapfree=813284 load1=0.18
2026-11-22T01:21:07Z boot=ea73ac4f mem=548464 bal=6443824 swapfree=813320 load1=0.16
2026-11-22T01:22:07Z boot=ea73ac4f mem=557096 bal=6443824 swapfree=813540 load1=0.15
2026-11-22T01:23:07Z boot=ea73ac4f mem=536872 bal=6443824 swapfree=813560 load1=0.42
2026-11-22T01:24:07Z boot=ea73ac4f mem=545124 bal=6443824 swapfree=813568 load1=0.25
2026-11-22T01:25:07Z boot=ea73ac4f mem=547824 bal=6443824 swapfree=813576 load1=0.15
2026-11-22T01:26:07Z boot=ea73ac4f mem=540336 bal=6443824 swapfree=813628 load1=0.09
2026-11-22T01:27:07Z boot=ea73ac4f mem=493904 bal=6443824 swapfree=813832 load1=0.46
2026-11-22T01:28:07Z boot=ea73ac4f mem=536972 bal=6443824 swapfree=811168 load1=0.23
2026-11-22T01:29:07Z boot=ea73ac4f mem=530944 bal=6443824 swapfree=811176 load1=0.12
2026-11-22T01:30:07Z boot=ea73ac4f mem=539048 bal=6443824 swapfree=808164 load1=0.20
2026-11-22T01:31:07Z boot=ea73ac4f mem=522948 bal=6443824 swapfree=808240 load1=0.48
2026-11-22T01:32:07Z boot=ea73ac4f mem=539216 bal=6443824 swapfree=808364 load1=0.18
2026-11-22T01:33:07Z boot=ea73ac4f mem=537732 bal=6443824 swapfree=808372 load1=0.06
2026-11-22T01:34:07Z boot=ea73ac4f mem=536496 bal=6443824 swapfree=808380 load1=0.19
2026-11-22T01:35:07Z boot=ea73ac4f mem=533800 bal=6443824 swapfree=808448 load1=0.37
2026-11-22T01:36:07Z boot=ea73ac4f mem=525816 bal=6443824 swapfree=808276 load1=0.26
2026-11-22T01:37:07Z boot=ea73ac4f mem=537980 bal=6443824 swapfree=808292 load1=0.31
2026-11-22T01:38:07Z boot=ea73ac4f mem=525220 bal=6443824 swapfree=808308 load1=0.26
2026-11-22T01:39:07Z boot=ea73ac4f mem=536036 bal=6443824 swapfree=808256 load1=0.15
2026-11-22T01:40:07Z boot=ea73ac4f mem=537688 bal=6443824 swapfree=808272 load1=0.10
2026-11-22T01:41:07Z boot=ea73ac4f mem=538752 bal=6443824 swapfree=811812 load1=0.11
```

---

## Phụ lục — headroom log (52 dòng, 8 lần probe)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round166-t9/headroom-log.txt` — không gõ lại bằng tay (xem F-164-T9-10).

```
=== probe-open 2026-11-21T23:39:01Z boot=d1ddd946 tran=63747
0
0
ENOSPC-count=24
ENOSPC-last: Nov 21 23:37:56 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     384432 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-pair-71 2026-11-22T00:09:06Z boot=ea73ac4f tran=63747 uptime_s=66.51
30001
30001
ENOSPC-count=0
ENOSPC-last: 
mem: MemAvailable:    1791672 kB | Balloon:         5092376 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-map-71-1 2026-11-22T00:10:40Z boot=ea73ac4f tran=63747 uptime_s=160.72
0
ENOSPC-count=1
ENOSPC-last: Nov 22 00:09:51 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1705016 kB | Balloon:         5103440 kB
=== window-map-71-2 2026-11-22T00:12:11Z boot=ea73ac4f tran=63747 uptime_s=250.92
6
ENOSPC-count=2
ENOSPC-last: Nov 22 00:10:51 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1570104 kB | Balloon:         5363756 kB
=== probe-lan-2 2026-11-22T00:39:04Z boot=ea73ac4f tran=63747
0
0
ENOSPC-count=9
ENOSPC-last: Nov 22 00:39:01 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     946140 kB | Balloon:         5333892 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-3 2026-11-22T01:09:04Z boot=ea73ac4f tran=63747
6
6
ENOSPC-count=9
ENOSPC-last: Nov 22 00:39:01 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     618992 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-4 2026-11-22T01:39:04Z boot=ea73ac4f tran=63747
6
6
ENOSPC-count=9
ENOSPC-last: Nov 22 00:39:01 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     532224 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-dong 2026-11-22T01:41:43Z boot=ea73ac4f tran=63747 uptime_s=5623.66
6
6
ENOSPC-count=9
ENOSPC-last: Nov 22 00:39:01 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     485412 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
```

---

*LIMITS này do T9 đợt 166 viết, đóng cờ 01:42Z 22/11/2026 (trước hạn cờ ~02:00Z; trước hạn cứng đóng 02:30Z). Không push GitHub. Không sửa production. Không chạy TTS 39. Không thử birefnet (guard không mở).*
