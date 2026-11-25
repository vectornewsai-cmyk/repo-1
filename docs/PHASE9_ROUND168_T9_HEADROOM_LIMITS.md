# LIMITS — Phase 9 đợt 168, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ hai mươi hai liên tiếp; headroom 2 lúc đóng, dưới ngưỡng lần thứ 28 liên tiếp; CỬA SỔ THOÁNG SAU REBOOT KHÔNG QUAN SÁT ĐƯỢC — CHUỖI 5 LẦN LIÊN TIẾP ĐỨT; balloon E-170 MỚI 48 mẫu 1 chuỗi ĐÃ KẾT THÚC + E-171 MỚI 12 mẫu ĐANG GHIM; ENOSPC ≥102 dòng (cận dưới); REBOOT #76 GIỮA PHIÊN)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 2 lúc đóng (13 lần đo: 11 lần 0, 2 lần 2), dưới ngưỡng < ~1.800 lần thứ hai mươi tám liên tiếp** — giá trị ổn định cuối phiên là **2** (đợt 167: 0; đợt 166: 6; đợt 165: 2). Trần **63.747 trên cả hai boot #75 và #76** (đợt 167: 63.747 trên cả #73 và #74). Quyết (k) "chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT KHÔNG QUAN SÁT ĐƯỢC — CHUỖI 5 LẦN LIÊN TIẾP (đợt 163–167) ĐỨT TẠI ĐỢT 168.** Trên boot #75 (btime 05:32:46Z, TRƯỚC khi đợt mở): ENOSPC đầu tiên lúc 05:34:34Z (boot+108s) — trước khi đợt mở 05:35:51Z; probe mở 05:40:51Z (boot+486s) đã là 0. Trên boot #76 (btime 07:32:23Z, GIỮA phiên): cặp cửa sổ lúc boot+71s đã là **0, 0**; ENOSPC đầu tiên lúc 07:34:08Z (boot+105s). Không boot nào bắt được cửa sổ thoáng — xem §1.2, F-168-T9-1.
- **Balloon — E-170 MỚI (48 mẫu, 1 chuỗi, 0 sag, ĐÃ KẾT THÚC — đứt không quan sát được) + E-171 MỚI (12 mẫu, 1 chuỗi, 0 sag, ĐANG GHIM lúc đóng):** **E-170: 06:45:37–07:32:37Z, 48 mẫu ghim LIÊN TIẾP trong 1 chuỗi duy nhất, boot #75** — chuỗi ghim dài nhất kể từ E-168 (54 mẫu, 1 chuỗi, đợt 166); mẫu ghim cuối 07:32:37Z mang nhãn boot #75 **SAU btime #76 14 s** (overlap lần thứ năm). **E-171: 07:43:32–07:54:32Z, 12 mẫu ghim LIÊN TIẾP, boot #76, ĐANG GHIM lúc đóng** — kết cục thuộc đợt sau. **E-169 GIỮ 20 mẫu** theo quyết (g) đợt 167. **Tổng ghim 60/135 mẫu (44,4%).** Xem §2.2.
- **RAM:** sampler **135 mẫu, 05:40:34Z–07:54:32Z, HAI boot (#75: 113 mẫu; #76: 22 mẫu)**. Max **3.273.520 kB (3.121,9 MiB = 52,03% guard) lúc 06:06:36Z** trên #75 — **cao nhất trong chuỗi 150–168** (đợt 167: 40,10% — thấp nhất chuỗi; đợt 166: 69,93%); min **414.364 kB lúc 07:25:37Z** (mẫu ghim E-170) — **nông hơn đợt 167 (383.116 kB) đúng 31.248 kB**; mean toàn phiên **981.186,2 kB — tính bằng 3 cách (python + awk + trung bình có trọng số) KHỚP NHAU**. Gate A **43/135 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ hai mươi hai liên tiếp.** Xem §2, §3.
- **B2: 15 spike THẬT (grep '^=== SPIKE' = grep không neo = 15 — KHÔNG lặp F-166-T9-3), 12 QUY ĐƯỢC DRIVER CỤ THỂ + 3 load1 dư.** Bão mở đợt #75: 11 spike (05:42:35–05:50:28Z — T1 verify suite ffmpeg/mask_anim/tsc + T2/T5 điều tra grep + hatch daemon); T4: **1 spike TRONG cửa sổ attempt1** (06:06:04Z — chính script phân tích analyze-t4-lag5.py của T4, delta 101, 2 s trước khi poller thoát — MỚI so với đợt 167: 0 spike trong cửa sổ attempt1; xem F-168-T9-6); O8: **1 spike TRONG cửa sổ O8** (06:22:38Z — chrome delta 58, do chính O8 Chromium gây); harness: **2 spike** (06:25:14/06:25:49Z — WebKit delta 73/92, harness 85m4). **0 spike trong span ghim E-170/E-171.** Delta tick lớn nhất 113 tick/s (ffmpeg 05:42:35Z; tsc 113 tick/s 05:46:08Z). Xem §2.5.
- **Lượt yên WebKit #37 (T4): CÓ LƯỢT HỢP LỆ — CHUỖI LÊN 32.** Attempt1-576ca271 (06:02:10–06:06:06Z): probe 20/20, lớp B 5/5, tickCost median 56,0 ≤ 60 — HỢP LỆ ngay lần thử đầu trên boot mới. Sampler T9 đối chiếu: gate A MỞ 4/4 mẫu trong cửa sổ; load1 1,92–2,96; **1 spike B2 trong cửa sổ (06:06:04Z — script phân tích của chính T4, xem F-168-T9-6)**. Poller 25 poll, 1 lần cửa mở (poll #25, 06:02:10Z). Xem §2.3.
- **REBOOT #76 GIỮA PHIÊN (f2b97695, btime 07:32:23Z; gap #75→#76 = 7.177 s) + REBOOT #75 TRƯỚC KHI ĐỢT MỞ (576ca271, btime 05:32:46Z; gap #74→#75 = 5.237 s):** sampler + watcher + probe-loop **CHẾT theo reboot #76** (điểm yếu (d) đợt 148 tái diễn lần thứ sáu liên tiếp); T9 khởi động lại cả ba lúc 07:33:0xZ (boot+~40s) và bắt được cặp cửa sổ ở boot+71s — đã là 0, 0. Khoảng trống trong log sampler **55 s** (07:32:37Z → 07:33:32Z), **0 gap >90 s trong log đóng băng** (max 61 s); watcher B2 mù ~1 phút qua reboot (sampler hai đầu mù đều load1 < 3,0 nên không spike nào bị lỡ chắc chắn — xem §5.1). (m) #75/#76 thuộc T2-168/T2-169; kết cục run 167 + run 168 thuộc T7-168. Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: #75 ≥99 dòng (cận dưới — journal mất theo reboot #76, KHÔNG cộng số ước) + #76 3 dòng = ≥102 dòng đếm được (cận dưới). Đợt thứ mười bảy liên tiếp bảng watch cạn gây lỗi thật thấy được.** Trong 99 dòng #75 có đúng 2 dòng trước khi đợt mở (05:34:34Z, 05:35:39Z) — số dòng thuộc về đợt 168 theo cách trừ thận trọng nhất là **≥100 (≥97 + 3)**. Trên #76 ENOSPC dừng sau 07:36:12Z trong khi headroom về 2 lúc đóng (xem §4). Xem §4.
- **T8-168 (đối chiếu): ĐÃ đóng cờ (06:44Z)** — O8 PASS 3/3 trên boot #75 (đề xuất chuỗi LÊN 21); harness 6/6 + 0 kẹt; (1c') giữ nguyên, 0 FP. **T7-168 (đối chiếu): CHƯA đóng cờ lúc T9 đóng (07:57Z)** — kết cục run 167 (theo T0-168: SUCCEEDED 05:26:04Z, margin 587 s) + run 168 + (m) #76 thuộc T7-168/T2-169. Xem §5.3/§5.4.
- **T5-168 (đối chiếu): POSTBOOT_PASS #75 ĐÃ CÓ 06:01:38Z (repair-sớm, KHÔNG phải replay-đầy-đủ); watcher-168 pid 13133 CHẾT theo reboot #76** (T9 xác minh pid đã mất lúc đóng — khởi động lại thuộc T5-169). Xem §5.2.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round168-t9/k8-headroom.py` (copy y nguyên từ đợt 167 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 168 (13 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 05:40:51Z 22/11 | **0** | #75 576ca271 (btime 05:32:46Z) | 63.747 | lần đo 1–2, lúc mở (boot+486s); RAM 879.056 kB, balloon 5.963.680 kB (92,5% trần); ENOSPC-count=6 (dòng mới nhất 05:40:19Z; dòng đầu tiên trên #75 lúc 05:34:34Z = boot+108s — TRƯỚC khi đợt mở) |
| 05:40:51Z 22/11 | **0** | #75 576ca271 | 63.747 | lần đo 2 (chênh **0** so với lần 1) |
| 06:10:34Z 22/11 | **0** | #75 576ca271 | 63.747 | lần đo 3–4, probe-loop lan-2; ENOSPC-count=32 (dòng mới nhất 06:10:19Z); balloon 4.306.364 kB |
| 06:10:34Z 22/11 | **0** | #75 576ca271 | 63.747 | lần đo 4 (chênh **0**) |
| 06:40:35Z 22/11 | **0** | #75 576ca271 | 63.747 | lần đo 5–6, probe-loop lan-3; ENOSPC-count=58 (dòng mới nhất 06:40:09Z); balloon 6.002.588 kB, đang leo tới ghim |
| 06:40:35Z 22/11 | **0** | #75 576ca271 | 63.747 | lần đo 6 (chênh **0**) |
| 07:10:35Z 22/11 | **0** | #75 576ca271 | 63.747 | lần đo 7–8, probe-loop lan-4; ENOSPC-count=84 (dòng mới nhất 07:09:59Z); balloon ĐANG GHIM TRẦN (E-170), RAM 464.640 kB |
| 07:10:35Z 22/11 | **0** | #75 576ca271 | 63.747 | lần đo 8 (chênh **0**) |
| 07:33:34Z 22/11 | **0** | #76 f2b97695 (btime 07:32:23Z) | 63.747 | lần đo 9–10, cặp cửa sổ (boot+71s); **KHÔNG chạm CAP 30.000 — gặp ENOSPC ở 0**; RAM 1.834.520 kB, balloon 5.076.580 kB; ENOSPC-count=0 trên boot mới |
| 07:33:34Z 22/11 | **0** | #76 f2b97695 | 63.747 | lần đo 10, cặp cửa sổ (boot+71s; chênh **0**) |
| 07:35:35Z 22/11 | **0** | #76 f2b97695 | 63.747 | lần đo 11, window-map-76-1 (boot+192s); ENOSPC-count=2 (dòng ENOSPC đầu tiên trên #76 lúc 07:34:08Z, boot+105s) |
| 07:54:51Z 22/11 | **2** | #76 f2b97695 | 63.747 | lần đo 12–13, đóng phiên (boot+1.348s); balloon ĐANG GHIM TRẦN (E-171), RAM 515.116 kB; ENOSPC-count=3 (dòng mới nhất 07:36:12Z) |
| 07:54:51Z 22/11 | **2** | #76 f2b97695 | 63.747 | lần đo 13 (chênh **0**) |

- Probe dừng ở `i=0` trong 11/13 lần đo; dừng ở `i=2` trong cặp đóng 07:54:51Z. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi lần đo).
- **Cửa sổ thoáng sau reboot: KHÔNG QUAN SÁT ĐƯỢC trên cả hai boot — CHUỖI 5 LẦN LIÊN TIẾP (đợt 163–167) ĐỨT TẠI ĐỢT 168.** Trên #75: ENOSPC đầu tiên 05:34:34Z (boot+108s) — TRƯỚC khi đợt mở 05:35:51Z (boot+185s); probe mở 05:40:51Z (boot+486s) đã là 0. Trên #76: cặp cửa sổ lúc boot+71s đã là 0, 0 (T9 khởi động lại sau reboot #76 lúc boot+~40s nhưng lần đo đầu tiên chỉ tới được boot+71s); ENOSPC đầu tiên trên #76 lúc 07:34:08Z (boot+105s). T9 ghi đúng mốc đo, không claim cửa sổ có mở hay không (chỉ biết: nếu có mở thì đã đóng trước boot+71s trên #76 và trước boot+108s trên #75). Xem F-168-T9-1.
- **Headroom cuối phiên: 2 (cặp đóng 07:54:51Z, chênh 0).** ENOSPC trên #76 dừng sau 07:36:12Z (3 dòng rồi im tới đóng) trong khi headroom về 2 — 2 slot trống có thể là lý do systemd ngừng lỗi (T9 ghi tương quan, không phán nhân quả). Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 2 = **63.745 watch** trên #76.
- **So sánh với đợt 167:** đợt 167 mở 0 trên #73 (6 lần đo) → reboot #74 giữa phiên → thoáng 14.072 → 8.708 (cặp cửa sổ, đang đóng) trong <92 s → 0 ổn định tới đóng. Đợt này mở 0 trên #75 (8 lần đo) → reboot #76 giữa phiên → **0 ngay từ boot+71s** → **2 lúc đóng**. **Không lần nào chạm CAP 30.000 đợt này** (đợt 167: 0 lần chạm CAP — đỉnh cửa sổ 14.072; đợt 163–166: chạm CAP mỗi đợt).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **2 / 1.578 ≈ 0,001** — một vite mới (~1.578 watch) vẫn không khởi động được.
- T5-168 KHÔNG probe lại headroom đợt này (như đợt 151–167) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 13 lần đo + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal hai boot đợt này có ≥99 + 3 = ≥102 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- **Trần KHÔNG ĐỔI giữa hai boot đợt này: 63.747 trên cả #75 và #76** (đợt 167: 63.747 trên cả #73 và #74 — lần thứ tư liên tiếp hai boot có cùng trần). T9 chỉ ghi số đo, không phán cơ chế.
- Lưu ý: RAM lúc đóng (515.116 kB — mẫu ghim E-171) THẤP hơn RAM lúc mở (879.056 kB) trong khi headroom 0 → 2. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop gốc lan-5 (dự kiến ~07:40:34Z) KHÔNG chạy — probe-loop chết theo reboot #76 lúc 07:32:23Z; probe-loop MỚI sau khởi động lại có lan-2 dự kiến ~08:03:34Z — sau khi T9 đóng; cặp probe đóng 07:54:51Z thay thế (cùng mẫu đợt 167: probe-loop mới lan-3 không chạy, cặp đóng thay thế).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–167 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 166 | 0 → 30.001 (thoáng, boot+66s) → 6 | mở 23:39:01Z boot #70 d1ddd946 btime 22:05:25Z (trần 63.747): 0, 0 (23:39:01Z) → sau reboot #71 00:08:00Z boot MỚI ea73ac4f (trần 63.747): 30.001, 30.001 lúc boot+66s → 0 lúc boot+160s → 6 lúc boot+250s → 0, 0 lúc 00:39:04Z → 6 ×6 (01:09:04Z → 01:41:43Z) → đóng 01:41:43Z cùng boot #71: 6, 6 (MỘT reboot giữa phiên; 14 lần đo, 5 lần 0, 7 lần 6, 2 lần 30.001) |
| 167 | 0 → 14.072 → 8.708 (thoáng, boot+86s, đang đóng) → 0 | mở 02:39:46Z boot #73 b643911f btime 02:28:01Z (trần 63.747): 0 ×6 (02:39:46–03:38:33Z) → sau reboot #74 04:05:29Z boot MỚI 194efd93 (trần 63.747): 14.072, 8.708 lúc boot+86s → 0 lúc boot+180s → 0 ×4 (04:36:52–04:46:20Z) → đóng 04:46:20Z cùng boot #74: 0, 0 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 13 lần đo, 11 lần 0, 1 lần 14.072, 1 lần 8.708) |
| **168** | **0 → 0 (không quan sát được cửa sổ) → 2** | **mở 05:40:51Z boot #75 576ca271 btime 05:32:46Z (trần 63.747): 0 ×8 (05:40:51–07:10:35Z) → sau reboot #76 07:32:23Z boot MỚI f2b97695 (trần 63.747): 0, 0 lúc boot+71s → 0 lúc boot+192s → 2, 2 lúc boot+1.348s → đóng 07:54:51Z cùng boot #76: 2, 2 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 13 lần đo, 11 lần 0, 2 lần 2; KHÔNG lần nào chạm CAP)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 6 → 0 → 2**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 2** (đợt 167 đóng 0; đợt 166 đóng 6; đợt 165 đóng 2). Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, thấp hơn ngưỡng 1.800, lần thứ hai mươi tám liên tiếp** (tính theo giá trị ổn định lúc đóng). Quyết parent đợt 167 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal hai boot đợt này có ≥99 + 3 = ≥102 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ mười bảy liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng; đợt 165: ≥64 dòng; đợt 166: ≥56 dòng; đợt 167: ≥76 dòng; đợt 168: ≥102 dòng — T9 đếm trực tiếp, xem §4). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong từng boot** (63.747 trên #75 suốt 8 lần đo; 63.747 trên #76 suốt 5 lần đo) và **KHÔNG ĐỔI giữa hai boot** (63.747 = 63.747 — lần thứ tư liên tiếp hai boot có cùng trần). T9 ghi đúng số đo từng boot, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.124.900 kB trên cả #75 và #76 — xem ghi chú; swap 1.048.572 kB) — sampler 135 mẫu, 05:40:34Z–07:54:32Z, HAI boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.124.900 kB ở cả mẫu đầu #75 và lúc đóng trên #76 (KHÔNG chênh giữa hai boot — giống đợt 167; mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: mở phiên RAM thấp + balloon xả sâu rồi leo lại tới trần → E-170 ghim 1 chuỗi dài 48 mẫu → REBOOT #76 cắt ngang → balloon leo lại tới trần trên boot mới → E-171 ghim lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log đóng băng 61 s; 0 gap >90 s trong log** — xem §5.1; khoảng trống phủ sóng ĐẦU PHIÊN 283 s tính từ lúc đợt mở tới khi T9 khởi động sampler — xem F-168-T9-2). **135 mẫu, 05:40:34Z–07:54:32Z, HAI boot (#75: 113 mẫu; #76: 22 mẫu).** Tổng quan: **min 414.364 kB (404,7 MiB) lúc 07:25:37Z** (mẫu ghim E-170); **max 3.273.520 kB (3.121,9 MiB) lúc 06:06:36Z — 52,03% guard** (balloon xả 3.551.016 kB, trên #75); **mean toàn phiên 981.186,2 kB (958,2 MiB) — tính bằng 3 cách (python + awk + trung bình có trọng số) KHỚP NHAU (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 05:40:34–07:32:37Z | #75 | 414.364–3.273.520 kB | Mở phiên: balloon 5.921.640 kB (91,9% trần) rồi xả sâu về 3.551.016 kB (55,1% trần) lúc 06:06:36Z (đỉnh RAM phiên) rồi leo lại tới ghim trần; **E-170: 48 mẫu ghim LIÊN TIẾP 1 chuỗi** (xem §2.2); BÃO MỞ ĐỢT (11 spike B2, load1 tới 8,29 — xem §2.5); T4 attempt1 HỢP LỆ (06:02:10–06:06:06Z — xem §2.3); O8 PASS 3/3 (06:20:48–06:23:24Z) + harness 6/6 (06:23:44–06:39:13Z — xem §2.5); **RAM max trên #75 3.273.520 kB lúc 06:06:36Z** (52,03% guard); gate A MỞ 37/113 mẫu; load1 ≥3,0 ở 8/113 mẫu; reboot #76 cắt ngang lúc 07:32:23Z |
| 07:33:32–07:54:32Z | #76 | 495.732–1.803.884 kB | Boot mới: headroom 0 ngay từ boot+71s (xem §1.2); balloon leo từ 5.011.800 kB (77,8% trần) lên ghim trần lúc 07:43:32Z; **E-171: 12 mẫu ghim LIÊN TIẾP, ĐANG GHIM lúc đóng** (xem §2.2); **0 spike B2 trên #76**; gate A MỞ 6/22 mẫu; load1 ≥3,0 ở 0/22 mẫu (sampler); load1 max 2,37 |

- **Gate A ≥1024 MiB: 43/135 mẫu** (#75: 37/113; #76: 6/22); **0 mẫu ≥ guard**; load1 max (sampler) **8,29 lúc 05:43:35Z** (bão mở đợt #75 — watcher bắt 7,55 lúc 05:43:46Z, xem §2.5); **8/135 mẫu load1 ≥3,0** (tất cả trên #75 trong bão mở đợt + harness; 0 trên #76). **RAM <512.000 kB: 50 mẫu** (49 trên #75 — trong đó 48 mẫu ghim E-170 + 1 mẫu 06:36:36Z 509.136 kB ngay trước khi ghim; 1 trên #76 — mẫu ghim E-171 07:46:32Z 495.732 kB); **RAM <300.000 kB: 0 mẫu** (đợt 167: 0 mẫu — giữ 0 lần thứ ba liên tiếp).
- Swap: SwapFree 797.836 kB (mẫu đầu) → 586.252 kB (thấp nhất phiên, lúc 06:32:36Z) → 1.006.396 kB (mẫu đầu #76, 07:33:32Z). Nhịp nhảy SwapFree qua reboot #76: 682.556 kB (mẫu cuối trước reboot, 07:32:37Z) → 1.006.396 kB (mẫu đầu #76, 07:33:32Z) — swap được nhả ~323.840 kB qua reboot (đợt 167: 594.752 → 1.002.624 kB qua reboot #74).
- Mẫu 06:06:36Z (đỉnh phiên): RAM 3.273.520 kB, balloon xả 3.551.016 kB — balloon xả sâu nhất phiên đúng lúc poller T4 thoát vì LUOT HOP LE (06:06:06Z, 30 s trước mẫu đỉnh). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 414.364 kB (đợt 167: 383.116 kB; đợt 166: 372.732 kB; đợt 165: 248.768 kB; đợt 164: 309.116 kB; đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — **trũng NÔNG hơn đợt 167 đúng 31.248 kB** (414.364 > 383.116). 50 mẫu <512.000 kB trong 135 mẫu (37,0% — cao hơn đợt 167: 23,4%, vì đợt này ghim kéo dài: E-170 48 mẫu + E-171 12 mẫu ghim lúc RAM 414–574.000 kB); riêng trong span E-170 (48 mẫu ghim): 48/48 mẫu <512.000 kB (100%); trong span E-171 (12 mẫu): 1/12 mẫu <512.000 kB (8,3% — các mẫu còn lại 495–574.000 kB, chỉ 1 mẫu dưới 512.000 kB).

**Bảng tổng hợp số RAM (từ script `t9-168-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 135 dòng — KHÔNG tính tay, đã đối chiếu lại từ log đóng băng lúc đóng cờ bằng script `t9-168-recheck.py` — RECHECK OK):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #75 576ca271 | 113 | 414.364 | 3.273.520 | 1.011.305,5 | 37/113 | 48 | 8,29 | 49 |
| #76 f2b97695 | 22 | 495.732 | 1.803.884 | 826.482,5 | 6/22 | 12 | 2,37 | 1 |
| **Toàn phiên** | **135** | **414.364** | **3.273.520** | **981.186,2** | **43/135** | **60/135 (44,4%)** | **8,29** | **50** |

- **Mean toàn phiên 981.186,2 kB — tính bằng 3 cách độc lập: python `sum/n = 981.186,2` VÀ awk `sum/n = 981.186` VÀ trung bình có trọng số từ mean từng boot: (113×1.011.305,5 + 22×826.482,5)/135 = 981.186,2 — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163). Mean từng boot cũng khớp python/awk từng số (xem §6 — script recheck assert cả hai mean từng boot).
- 50 mẫu RAM <512.000 kB (từ log đóng băng): 06:36:36Z 509.136; 06:44:37Z 476.724 (ngay trước ghim); 06:45:37–07:32:37Z 48 mẫu ghim E-170 (414.364–514.740); 07:46:32Z 495.732 (mẫu ghim E-171).

### 2.2 Balloon virtio — E-170 MỚI (48 mẫu, 1 chuỗi, 0 sag, ĐÃ KẾT THÚC — đứt không quan sát được) + E-171 MỚI (12 mẫu, 1 chuỗi, 0 sag, ĐANG GHIM lúc đóng) + E-169 GIỮ 20 MẪU

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #75 (576ca271): GHIM TRẦN 48/113 mẫu (42,5%), trong 1 chuỗi duy nhất — 1 EPISODE MỚI (E-170, ĐÃ KẾT THÚC).**
  - Leo lên trần trên boot #75: từ 05:40:34Z (5.921.640 kB, 91,9% trần) xả sâu về 3.551.016 kB (55,1% trần) lúc 06:06:36Z rồi leo lại tới ghim lúc 06:45:37Z trong ~39 phút, rồi ghim LIÊN TIẾP 48 mẫu tới 07:32:37Z — **không một sag nào**.
  - **E-170 — chuỗi 1 (duy nhất): 06:45:37–07:32:37Z, 48 mẫu** (RAM 414.364–514.740 kB; gate A ĐÓNG cả 48 mẫu).
  - **E-170 ĐÃ KẾT THÚC — đứt KHÔNG quan sát được chính xác:** mẫu ghim cuối quan sát được 07:32:37Z (nhãn boot cũ, sau btime #76 14 s — overlap, xem F-168-T9-3); reboot #76 cắt ngang; balloon trên boot mới #76 **xả về 5.011.800 kB (77,8% trần) lúc 07:33:32Z** rồi leo lại và ghim LẠI lúc 07:43:32Z — nhưng đó là **E-171 trên boot mới, không phải tiếp nối E-170** (khác boot — reboot ở giữa; cùng mẫu tách E-168/E-169 đợt 167 và E-167/E-168 đợt 166). Thời điểm đứt thật nằm trong khoảng mù (07:32:37Z, 07:33:32Z] (55 s) — T9 không claim thời điểm cụ thể.
  - **Gate A ĐÓNG suốt span E-170 (48 mẫu, 06:45:37–07:32:37Z): 0/48 mẫu mở.**
  - **Tổng E-170: 48 mẫu ghim / 1 chuỗi / 0 sag / 1 boot (#75).**
- **Boot #76 (f2b97695): GHIM TRẦN 12/22 mẫu (54,5%) — EPISODE MỚI (E-171, ĐANG GHIM lúc đóng).**
  - Leo lên trần trên boot #76: từ 07:33:32Z (5.011.800 kB, 77,8% trần) lên ghim lúc 07:43:32Z trong ~10 phút, rồi ghim LIÊN TIẾP 12 mẫu tới 07:54:32Z (mẫu cuối log đóng băng) — **không một sag nào; vẫn ghim lúc T9 đóng cờ**.
  - **E-171 — chuỗi 1 (duy nhất tới lúc đóng): 07:43:32–07:54:32Z, 12 mẫu** (RAM 495.732–574.000 kB; gate A ĐÓNG cả 12 mẫu).
  - **E-171 ĐANG GHIM lúc đóng — kết cục thuộc đợt sau (T9-169).** T9 không claim E-171 sẽ kéo dài bao lâu hay đứt lúc nào.
  - **Gate A ĐÓNG suốt span E-171 tới lúc đóng (12 mẫu): 0/12 mẫu mở.**
  - **Tổng E-171 tới lúc đóng: 12 mẫu ghim / 1 chuỗi / 0 sag / 1 boot (#76).**
- **E-169 — KẾT CỤC (theo quyết (g) đợt 167): GIỮ 20 mẫu, KHÔNG cộng thêm.** E-169 đã kết thúc đợt 167 (mẫu ghim cuối 04:05:35Z trên #73); khoảng mù giữa hai đợt **3.280 s (04:45:54Z → 05:40:34Z)** có **MỘT reboot (#75 btime 05:32:46Z)**. Balloon trên #75 lúc T9 mở (05:40:34Z) đã 5.921.640 kB (91,9% trần) nhưng xả sâu về 3.551.016 kB lúc 06:06:36Z rồi mới leo lại ghim lúc 06:45:37Z — đó là **E-170 trên boot mới, không phải tiếp nối E-169** (khác boot — reboot ở giữa; xả sâu 55,1% trần tách hai episode theo BẤT KỲ tiêu chí nào).
- **Tổng ghim trần đợt này: 60/135 mẫu (44,4%)** (đợt 167: 20/128 = 15,6%; đợt 166: 55/123 = 44,7%; đợt 165: 58/134 = 43,3%; đợt 164: 35/135 = 25,9%; đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **2 episode mới trong đợt 168 (E-170: 48 mẫu / 1 chuỗi / 0 sag, đã kết thúc; E-171: 12 mẫu / 1 chuỗi / 0 sag, đang ghim)** — khác đợt 167 (1 episode mới 20 mẫu / 4 chuỗi / 3 sag + đuôi E-168) và đợt 166 (1 episode mới 54 mẫu / 1 chuỗi / 0 sag + đuôi E-167).
- **Phán theo quy tắc quyết (e)/(g) + quyết (j) đợt 163 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-170: 1 EPISODE MỚI (48 mẫu / 1 chuỗi / 0 sag / boot #75, đã kết thúc).** 48 mẫu ghim LIÊN TIẾP trong 1 chuỗi, không sag, gate A đóng suốt → **1 episode theo đúng tiền lệ E-168 đợt 166** (54 mẫu / 1 chuỗi / 0 sag → 1 episode; quyết parent đợt 166 ghi nhận) và E-165 đợt 164 (nhiều chuỗi ghim, gate A đóng suốt → 1 episode). Không có gì để tách (chỉ 1 chuỗi).
  - **E-171: 1 EPISODE MỚI (12 mẫu / 1 chuỗi / 0 sag / boot #76, ĐANG GHIM lúc đóng).** Khác boot + reboot ở giữa tách E-171 khỏi E-170 theo BẤT KỲ tiêu chí nào (cùng mẫu tách E-168/E-169 đợt 167). Kết cục thuộc T9-169.
  - **Đợt 168 = 2 EPISODE GHIM MỚI (E-170: 48 mẫu, 1 chuỗi, 0 sag, đã kết thúc; E-171: 12 mẫu, 1 chuỗi, 0 sag, đang ghim)** + E-169 GIỮ 20 mẫu (quyết (g) đợt 167).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim E-170 chỉ ~414–515.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối chuỗi ghim E-170 (07:32:37Z): tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 458.572 kB (log thật).

### 2.3 Lượt yên WebKit #37 (T4, đợt 168) — CÓ LƯỢT HỢP LỆ, CHUỖI LÊN 32 (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-168 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND168_T4_WEBKIT_QUIET37_LIMITS.md`) + cờ `round168-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **#37 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 32 (31 → 32).**
- **Attempt1-576ca271 (06:02:10–06:06:06Z): probe 20/20, lớp B 5/5 SẠCH, tickCost median 56,0 ms ≤ 60 — HỢP LỆ ngay lần thử đầu trên boot mới.** Poller thoát 06:06:06Z vì LUOT HOP LE (trước hạn cắt poller 07:30Z 1h23m54s).
- **Poller — 1 instance thật, 25 poll, 1 lần cửa mở (poll #25, 06:02:10Z)** — gate0: POSTBOOT_PASS #75 ĐÃ CÓ 06:01:38Z (T5-168, repair-sớm — xem §5.2). **0 reboot trong phiên T4** (T4 đóng cờ trước reboot #76 — xem F-168-T9-10).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1-#75: gate A MỞ **4/4 mẫu** trong cửa sổ (06:02:36Z 1.478.600 kB; 06:03:36Z 1.134.764 kB; 06:04:36Z 1.716.736 kB; 06:05:36Z 1.913.612 kB — cả 4 đều ≥1024 MiB).
  - Tải: sampler load1 trong cửa sổ attempt1 **1,92–2,96**; **1 spike B2 trong cửa sổ attempt1** (06:06:04Z, load1 3,47 — script phân tích analyze-t4-lag5.py của chính T4, delta 101 — xem F-168-T9-6; khác đợt 167: 0 spike trong cửa sổ attempt1).
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cửa sổ attempt1** (khớp T4: "RAM <500 MB: 0/26 poll — SẠCH").
- **Cộng dồn (theo T4-168): chuỗi lượt yên hợp lệ LÊN 32; cộng dồn 32 lượt hợp lệ: P1 121/124, P2 115/115, P3-A1 104/124, P3' 88/96 occ = 80/83 distinct-seq, P7 66/66.** T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 / O8 / harness (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| Attempt1 06:02:36–06:05:36Z | #75 | 1,92–2,96 (4 mẫu) | 1.134.764–1.913.612 kB — **gate A MỞ 4/4** | T4 attempt1 — **1 spike B2 trong cửa sổ** (06:06:04Z, T4 analyze script — xem F-168-T9-6); attempt1 HỢP LỆ (lớp B 5/5 + tickCost median 56,0) |
| O8 06:20:48–06:23:24Z | #75 | 0,50–2,98 (2 mẫu trong cửa sổ: 06:21:36Z 0,50; 06:22:36Z 2,98) | 980.412–1.467.396 kB — **gate A MỞ 1/2** (06:21:36Z 980.412 kB — ĐÓNG, dưới gate 68.164 kB; 06:22:36Z 1.467.396 kB — MỞ) | T8 O8 — **1 spike B2 trong cửa sổ** (06:22:38Z, chrome delta 58 — do chính O8 gây) |
| Harness 06:23:44–06:39:13Z | #75 | 0,30–3,06 (16 mẫu) | 509.136–1.474.160 kB — **gate A MỞ 1/16** (chỉ 06:27:36Z 1.040.396 kB) | T8 harness — **2 spike B2 trong cửa sổ** (06:25:14Z WebKit delta 73; 06:25:49Z WebKit delta 92 — đều do chính harness gây) |

### 2.5 B2 — 15 spike THẬT, 12 QUY ĐƯỢC DRIVER CỤ THỂ + 3 load1 dư (1 spike TRONG cửa sổ attempt1 — script phân tích của chính T4; 1 spike TRONG cửa sổ O8 — do chính O8 gây; 2 spike TRONG cửa sổ harness — do chính harness gây; 0 spike trong span ghim E-170/E-171)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-168-T9-11). **15 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 15, `grep '=== SPIKE'` không neo cũng = 15 — KHÔNG lặp F-166-T9-3): 11 spike bão mở đợt #75 + 1 spike T4 analyze + 1 spike O8 Chromium + 2 spike harness 85m4 WebKit; 0 spike trong span ghim E-170 (06:45:37–07:32:37Z, 48 mẫu) và E-171 (07:43:32–07:54:32Z, 12 mẫu); 0 spike trên boot #76 sau khi watcher khởi động lại.**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — bão mở đợt #75 (11 spike) | 05:42:35–05:50:28Z | 3,32 → 7,55 → 4,11 | 11 | 05:42:35Z: ffmpeg delta **113** (vidstab red30); 05:43:10Z: ffmpeg delta **110** (vidstab red60) + ffmpeg delta **20** (testsrc2 hevc); 05:43:46Z: **load1 dư** (delta max 26 — hatch daemon; top -b zombie MainThread 40%, iowait 15,0% — xem F-168-T9-11); 05:44:22Z: mask_anim delta **95**; 05:44:57Z: mask_anim delta **99**; 05:45:32Z: ffmpeg ffv1 delta **110** + grep gstreamer delta 21; 05:46:08Z: tsc delta **113** + grep gstreamer delta 19; 05:48:43Z: ffmpeg pix-test delta **92** + grep apt-get delta 38; 05:49:18Z: **ffmpeg delta-miss** (100% tích lũy, chết giữa chừng — xem F-168-T9-10) + grep apt-get delta 53; 05:49:53Z: **load1 dư** (grep D-state 20,0% tức thời, iowait 19,5% — hatch delta 26, xem F-168-T9-11); 05:50:28Z: **load1 dư** (grep D-state delta 29, iowait 20,9% — xem F-168-T9-11) | **Bão mở đợt 168: T1 verify suite (ffmpeg vidstab/mask_anim/tsc/test_pixelate) + T2/T5 điều tra (grep gstreamer/apt-get) + hatch daemon — nhiều luồng mở cùng lúc trên boot #75** (cùng mẫu đợt 163/164/165/166/167). Load1 max đợt (sampler) **8,29 lúc 05:43:35Z** (watcher bắt 7,55 lúc 05:43:46Z). **KHÔNG spike nào trong cụm này nằm trong cửa sổ attempt** (attempt1 bắt đầu 06:02:10Z, sau cụm này ~12 phút) |
| 2 — T4 analyze (1 spike TRONG cửa sổ attempt1) | 06:06:04Z | 3,47 | 1 | python3 analyze-t4-lag5.py delta **101** (T4 phân tích JSON attempt1) + hatch delta 10 | **T4 post-attempt analysis** — script phân tích của chính T4 chạy lúc attempt1 vừa xong, **2 s trước khi poller thoát 06:06:06Z** (xem F-168-T9-6). Đây là spike DUY NHẤT trong cửa sổ attempt1 đợt này (đợt 167: 0 spike) |
| 3 — T8 O8 (1 spike TRONG cửa sổ) | 06:22:38Z | 3,06 | 1 | chrome delta **58** + vite delta 34 (O8 Chromium attempt3, 06:22:32–06:23:24Z) | **T8 O8 (Chromium)** — spike NẰM TRONG cửa sổ O8, driver là chính process O8, không phải tải lạ (cùng mẫu đợt 167: spike harness do chính process harness) |
| 4 — T8 harness (2 spike) | 06:25:14–06:25:49Z | 3,04 → 3,18 | 2 | 06:25:14Z: WebKitWebProcess delta **73** + vite delta 33 + MiniBrowser delta 20 (harness 85m4 WebKit); 06:25:49Z: WebKitWebProcess delta **92** + MiniBrowser delta 23 (harness 85m4 WebKit) | **T8 harness (WebKit 85m4)** — cả hai spike do chính process harness gây (cùng mẫu đợt 167) |

- **Tổng kết đếm: 12/15 spike có driver process cụ thể + 3 spike lớp "load1 dư"** (05:43:46Z; 05:49:53Z; 05:50:28Z — xem dưới). Đợt 167: 16/22 quy được + 6 load1 dư; đợt 166: 13/16 quy được + 3 load1 dư; đợt 165: 15/18 quy được + 3 load1 dư; đợt 164: 30/36 quy được + 6 load1 dư; đợt 163: 17/18 quy được + 1 load1 dư. Đợt này tỉ lệ load1 dư 3/15 = 20,0% (thấp hơn đợt 167: 27,3%).
- **3 spike load1 dư (định nghĩa: không process nào đủ tải CPU trong giây đo để giải thích load1 ≥ 3,0 — theo đúng tiền lệ đợt 160/163/164/165/166/167; xem F-168-T9-11 cho cả ba trường hợp — delta 26/26/29 đều vượt ngưỡng chữ ≤15 nên T9 trình cả hai cách đọc):**
  - 05:43:46Z, load1 7,55: top tức thời chỉ có hatch daemon 8,2% + grep D-state 3,9%; delta tick max **26** (hatch daemon); %Cpu: 37,5% idle + **15,0% iowait**; top -b: zombie MainThread 40,0%. Không có process nào chạy mạnh về CPU trong giây đo — **load1 dư theo thực chất** (dư âm của 2 spike ffmpeg 05:42:35Z + 05:43:10Z + iowait; load1 7,55 là load1 watcher cao nhất đợt — nhưng là dư âm, không phải tải mới).
  - 05:49:53Z, load1 5,63: top tức thời chỉ có hatch daemon 10,2% + grep gstreamer D-state 17,5% (20,0% tức thời); delta tick max **26** (hatch daemon); %Cpu: 65,9% idle + **19,5% iowait**; grep D-state delta **15**. Không có process nào chạy mạnh về CPU trong giây đo — **load1 dư theo thực chất** (tải là grep D-state + iowait + dư âm bão mở đợt; xem F-168-T9-11).
  - 05:50:28Z, load1 4,11: top tức thời chỉ có hatch daemon 10,4% + grep gstreamer D-state 18,2%; delta tick max **29** (grep gstreamer D-state); %Cpu: 48,8% idle + **20,9% iowait**. Không có process nào chạy mạnh về CPU trong giây đo — **load1 dư theo thực chất** (xem F-168-T9-11).
  - T9 không giấu 3 spike này vào nhóm "quy được" (cùng mẫu F-163-T9-9).
- **Caveat đếm (F-168-T9-10):** 1 spike delta-miss (pid chết giữa chừng trong vòng delta 1 s): spike 05:49:18Z (ffmpeg 28256 100% tích lũy, delta mất; grep apt-get delta 53 còn) — quy driver bằng ps top tức thời + top -b, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164), F-165-T9-6 (2 spike đợt 165), F-166-T9-6 (4 spike đợt 166) và F-167-T9-6 (6 spike đợt 167). `grep -c 'WebKit\|MiniBrowser'` = **13 dòng** (2 spike: 06:25:14Z + 06:25:49Z harness 85m4 WebKit — WebKit xuất hiện trong 2/15 spike).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: spike 05:49:18Z (xem trên). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 12 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 12/15 spike — 3 spike lớp load1 dư đợt này (1 trong bão mở đợt lúc zombie + iowait 15,0%, 2 cuối bão mở đợt lúc grep D-state + iowait 19,5–20,9%).
- **Delta tick lớn nhất đợt: 113 tick/s** (ffmpeg, spike 05:42:35Z, load1 3,73; tsc cũng 113 tick/s, spike 05:46:08Z, load1 4,24). (Đợt 167: max 117 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 05:40:3xZ CÙNG lúc sampler (khác đợt 163: watcher mở muộn 67 s sau sampler) — **0 khoảng mù đầu phiên đợt này**; spike đầu tiên watcher bắt được là 05:42:35Z (~2 phút sau khi mở — trước đó load1 < 3,0). **Khoảng mù duy nhất: reboot #76 giết watcher, khởi động lại 07:33:0xZ (gap ~55–60 s cùng sampler — xem §5.1)** — **0 spike trên #76 sau khởi động lại** (load1 sampler trên #76 max 2,37 < 3,0; hai đầu khoảng mù load1 0,27 và 2,37 — không spike nào bị lỡ chắc chắn). **0 gap phủ sóng watcher nào khác trong phiên.**

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg/mask_anim.py/tsc xuất hiện trong 8 spike của bão mở đợt** (vidstab red30/red60 + mask_anim ellipse + ffmpeg ffv1/testsrc2 hevc + tsc preview-engine + test_pixelate — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 1 spike delta-miss 05:49:18Z — xem §2.5). **grep gstreamer/apt-get xuất hiện trong 5 spike bão mở đợt** (T2/T5 điều tra — grep tìm gói gstreamer thiếu + apt-get; không phải tải VCut). **T4 analyze script xuất hiện trong 1 spike** (06:06:04Z — phân tích JSON attempt1, xem F-168-T9-6). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T2/T5 điều tra + T4 analyze + T8 O8/harness + hatch daemon; **13 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log — 2 spike, đã quy driver ở §2.5**).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ hai mươi hai liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt (xem F-168-T9-2 về gap phủ sóng đầu phiên + §5.1 về gap qua reboot #76):** sampler `round168-t9/sampler.sh` chạy liên tục 05:40:34Z–07:32:37Z (instance 1, chết theo reboot #76) rồi 07:33:32Z–07:54:32Z (instance 2, khởi động lại bằng tay), **135 mẫu, gap trong log đóng băng lớn nhất 61 s, 0 gap >90 s**; khoảng trống trong log 55 s qua reboot #76 (07:32:37Z → 07:33:32Z) (đợt 167: gap 77 s qua reboot #74; đợt 166: gap 73 s qua reboot #71; đợt 165: gap 35 s qua reboot #70; đợt 164: gap 57 s qua reboot #68; đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **3.273.520 kB = 52,03% guard** (đợt 167: 40,10% — thấp nhất chuỗi; đợt 166: 69,93%; đợt 165: 58,05%; đợt 164: 45,65%; đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). **52,03% là tỉ lệ cao nhất kể từ đợt 166 (69,93%)** — nhưng vẫn cách guard 3.017.936 kB (47,97%). Khoảng cách tới guard lúc đỉnh: **3.017.936 kB (47,97%)**.
- **Guard giữ nguyên: 6.291.456 kB (6.144 MiB).** Không mẫu nào chạm 6.144 MiB — cơ chế (a) **armed** (sampler chạy liên tục) và **KHÔNG kích hoạt** suốt 2h14m.
- **0 lần thử birefnet trong đợt 168 — lần thứ hai mươi hai liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0; đợt 165: 0; đợt 166: 0; đợt 167: 0; đợt 168: 0). **Chuỗi 0 lần thử: 22 đợt liên tiếp** (đợt 147–168).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 22 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round168-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `/usr/bin/python3.12` — giống đợt 167); `bgremove.py` **23.500 B** (không đổi so với đợt 167); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-168-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt (xem F-168-T9-2 về gap đầu phiên).**
- **Không cần chạy lại birefnet trong đợt 168** (guard chưa từng mở; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (boot #75 ≥99 dòng + boot #76 = 3 dòng; tổng ≥102 dòng, cận dưới — đợt thứ mười bảy liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#75** (576ca271, btime 05:32:46Z): **≥99 dòng** (T9 đếm trực tiếp: 6 dòng lúc 05:40:51Z → 32 dòng lúc 06:10:34Z → 58 dòng lúc 06:40:35Z → 84 dòng lúc 07:10:35Z → **99 dòng lúc 07:27:40Z** (đếm cuối trước reboot #76); **phần còn lại 07:27:40Z → reboot #76 (07:32:23Z) mất theo reboot, KHÔNG cộng số ước** — journal của #75 không đọc được nữa sau #76, `journalctl --list-boots` lúc đóng chỉ còn #76, xem F-168-T9-7). Trong 99 dòng này có **đúng 2 dòng (05:34:34Z, 05:35:39Z) thuộc về khoảng TRƯỚC khi đợt mở (05:32:46–05:35:51Z)** — xác định được vì T9 đọc được journal #75 lúc mở (dòng đầu tiên 05:34:34Z; không có dòng nào trước đó); số dòng thuộc về đợt 168 trên #75 theo cách trừ thận trọng nhất là **≥97 (99 − 2)**. Dòng mới nhất đếm được trên #75 lúc 07:27:40Z (lúc đếm; dòng cuối thật trước reboot không biết). Nhịp ~1 dòng/phút trong lúc headroom 0 (6 → 99 trong ~107 phút).
- Boot **#76** (f2b97695, btime 07:32:23Z): **3 dòng** (T9 đếm trực tiếp từ journal lúc đóng phiên; **không cộng số ước**). Dòng đầu tiên: **07:34:08Z (boot+105s)**; dòng cuối cùng: **07:36:12Z** — sau đó IM tới đóng (07:54:51Z) trong khi headroom về 2 (xem §1.2). Nhịp 3 dòng trong ~2 phút rồi im — **khác hẳn #75 (tăng đều ~1 dòng/phút không ngừng)**.
- **Tổng đợt 168: ≥99 + 3 = ≥102 dòng đếm được (cận dưới)** — đợt thứ mười bảy liên tiếp có lỗi thật (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng; đợt 165: ≥64 dòng; đợt 166: ≥56 dòng; đợt 167: ≥76 dòng; đợt 168: ≥102 dòng — T9 đếm trực tiếp). **Caveat: số đợt này là CẬN DƯỚI** — phần còn lại boot #75 (07:27:40Z → 07:32:23Z) mất theo reboot #76, không đếm được; và đúng 2 dòng trong 99 thuộc về khoảng trước khi đợt mở (xem trên) — **số dòng thuộc về đợt 168 theo cách trừ thận trọng nhất là ≥100 (≥97 + 3); T9 trình cả hai số (≥102 đếm được / ≥100 thuộc về đợt) để T10/parent không đếm trùng**.
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device` (đợt 167: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 167:** đợt 167 có ≥76 dòng (boot #73 ≥54 + boot #74 22). Đợt này **≥102 dòng** — cao hơn đợt 167 đúng 26 dòng, vì boot #75 có tới ≥99 dòng (headroom 0 suốt 113 mẫu, ENOSPC nhịp ~1 dòng/phút không ngừng) so với boot #73 đợt 167 (≥54 dòng) và boot #74 đợt 167 (22 dòng — headroom 0 ổn định cuối phiên, ENOSPC tăng đều).
- **Điểm mới (giao parent/T10 xem lại quyết (g) — T9 chỉ nêu dữ kiện):** đợt này là đợt có ENOSPC đếm được CAO THỨ HAI kể từ đợt 161 (chỉ sau 132 dòng đợt 162; đợt 159: ≥134 dòng — cao nhất chuỗi gần đây vẫn là 134). Headroom 0 suốt phiên trên #75 + ENOSPC tăng đều không ngừng — bằng chứng độc lập (ngoài probe) rằng headroom 0 là thật (systemd không thêm được watch nào trong cả phiên).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #75 + #76 — 2 reboot trong/anh quanh đợt 168 (cùng mẫu đợt 167: 2 reboot)

- **Reboot #75 (576ca271, btime 05:32:46Z; gap #74→#75 = 5.237 s):** xảy ra **TRƯỚC KHI ĐỢT MỞ** (đợt mở 05:35:51Z, boot+185s), SAU khi T10-167 đóng sổ (~05:23Z trên boot #74). Đợt 168 mở trên chính boot này — **KHÔNG có reboot giữa T10-167 đóng sổ và đợt mở ngoài #75** (số hiệu #75 theo đếm tuần tự — T0-168 xác minh 9/9 nguồn, parent đã xác nhận ở quyết (d) đợt 167? KHÔNG — quyết (d) đợt 167 xác nhận #73/#74; #75 do T0-168 xác minh 9/9 + parent xác nhận ở đợt 168).
- **Reboot #76 (f2b97695, btime 07:32:23Z; gap #75→#76 = 7.177 s):** xảy ra **GIỮA PHIÊN** (07:32:23Z, 1h56m32s sau khi đợt mở). Sampler + watcher + probe-loop **CHẾT theo reboot** (điểm yếu (d) đợt 148 tái diễn lần thứ sáu liên tiếp — đợt 163 chết theo #66, đợt 164 chết theo #68, đợt 165 chết theo #70, đợt 166 chết theo #71, đợt 167 chết theo #74, đợt này chết theo #76); T9 khởi động lại cả ba bằng tay **07:33:0xZ (boot+~40s)** — **khoảng trống trong log sampler 55 s** (07:32:37Z → 07:33:32Z), **0 gap >90 s trong log đóng băng kể cả qua reboot** (max 61 s — xem §2.1). **1 lệnh sleep-wait dài của T9 (90 phút) bị runtime restart trùng với reboot #76 gián đoạn** (không mất dữ liệu — mọi trạng thái đã trên đĩa; xem F-168-T9-4).
- **Mẫu sampler cuối #75 (07:32:37Z) mang nhãn boot cũ `576ca271` ĐÚNG 14 s SAU btime #76** — sampler cũ vẫn sống quá btime mới ≥14 s (overlap — xem F-168-T9-3; cùng mẫu watcher-165 tại #70: poll cuối 22:05:31Z sau btime #70 6 s; đợt 167: mẫu cuối #73 sau btime #74 6 s — nay 14 s, dài nhất kể từ #68: ≥11 s). Mẫu đầu #76 (07:33:32Z) mang nhãn boot mới `f2b97695` đúng — sampler khởi động lại sau reboot nên nhãn đúng ngay từ mẫu đầu.
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn** (T0-168 đo; T9 không đo lại).
- **Khoảng trống phủ sóng đầu phiên (F-168-T9-2):** đợt mở 05:35:51Z (boot+185s), T9 nhận việc ~05:39:5xZ (boot+~430s), sampler khởi động 05:40:34Z (boot+468s) — **gap 283 s từ lúc đợt mở tới khi sampler chạy** (đợt 167: gap 162 s; đợt 166: gap 179 s; đợt 165: gap 1.760 s; đợt 164: gap 383 s; đợt 163: gap 113 s). Trong 283 s này: balloon xả từ ~92% xuống ~91% trần rồi leo lại (mẫu đầu 05:40:34Z bal 5.921.640 kB), headroom về 0 (probe mở 05:40:51Z đã là 0; ENOSPC đầu tiên 05:34:34Z đã TRƯỚC khi đợt mở). **Cửa sổ thoáng của #75 (nếu có) nằm trong 283 s này + trước đó — KHÔNG quan sát được** (xem §1.2). T9 ghi gap này để T10/parent biết, không giấu.
- **Khoảng mù giữa hai đợt 3.280 s (04:45:54Z → 05:40:34Z):** sampler đợt 167 dừng lúc đóng (04:45:54Z); sampler đợt 168 khởi động 05:40:34Z. Trong 3.280 s này có 1 reboot (#75 05:32:46Z) — E-169 đã kết thúc trong khoảng mù (xem §2.2); cửa sổ thoáng của #75 (nếu có, ~05:33–05:34Z) đã đóng trước khi T9 mở.

### 5.2 T5-168 (infra) — POSTBOOT_PASS #75 ĐÃ CÓ; #76 thuộc T5-169 (thuộc T5-168/T10)

- **POSTBOOT_PASS #75 ĐÃ CÓ lúc 06:01:38Z** (boot+28m52s — theo T5-168; mode repair-sớm quyết (h) đợt 150, KHÔNG phải replay-đầy-đủ — 64 gói intent còn lại chưa cài; xem F-168-T8-1).
- **POSTBOOT_PASS #76 CHƯA CÓ lúc T9 đóng** (T5-168 đóng cờ 06:11Z, TRƯỚC reboot #76 07:32:23Z — thuộc T5-169 theo dõi tiếp).
- **Watcher-168 (T5, pid 13133): CHẾT theo reboot #76** (T9 xác minh pid đã mất lúc đóng 07:58Z — cùng số phận sampler/watcher/probe-loop của T9; khởi động lại thuộc T5-169). **Watcher-167 KẾT THÚC THEO LỊCH 05:30:10Z** (333 poll, không chết theo reboot — theo T0-168/T5-168).
- **Marker: T9 không đếm lại** (T0/T5 sở hữu; T0-168 đếm 27 reboot #49–#75; #76 thêm vào → 28 nếu parent xác nhận #75/#76 — giao T0-169/T5-169 đếm).
- **X11 (T9 kiểm tra lúc đóng phiên 07:57Z):** `/tmp/.X11-unix/` **TRỐNG** (0 socket — reboot #76 đã xóa hết; T8-168 đã dọn 2 socket X194/X195 lúc 06:40Z trước đó).

### 5.3 T8-168 (vite harness + O8) — ĐÃ đóng cờ (06:44Z); O8 PASS 3/3, harness 6/6

- **T8-168 ĐÃ xuất bản LIMITS + viết cờ `round168-t8.done` (06:44Z)** — T9 chỉ đối chiếu bằng dữ kiện sampler + B2 độc lập, không phán thay T8.
- **O8 PASS 3/3 trên boot #75** (06:20:48–06:23:24Z — WebKit 21/21 ×2 + Chromium 21/21): **1 spike B2 trong cửa sổ O8** (06:22:38Z chrome delta 58 — do chính O8 gây). **T8 đề xuất chuỗi WebKit FULL PASS LÊN 21 (20 → 21)** — chờ T10/parent phán.
- **Đối chiếu sampler T9 trong cửa sổ O8 (06:20:48–06:23:24Z): 2 mẫu, gate A MỞ 1/2** (06:21:36Z 980.412 kB — dưới gate 68.164 kB; 06:22:36Z 1.467.396 kB ≥ gate), balloon 79,2–83,6% trần (không ghim — balloon lúc đó 5.085.768–5.234.832 kB), load1 0,50–2,98 (sampler).
- **Harness 6/6 PASS + 0 kẹt** (06:23:44–06:39:13Z): **2 spike B2 trong cửa sổ harness** (06:25:14Z WebKit delta 73 + 06:25:49Z WebKit delta 92 — đều do chính harness gây). Đối chiếu sampler T9 trong cửa sổ harness: gate A MỞ 1/16 (chỉ 06:27:36Z 1.040.396 kB).
- **(1c') (c') đã triển khai diag-only — 0 kích hoạt, 0 FP (T8-168 sở hữu; T9 không kiểm tra triển khai).** Caveat: T8 ghi "0 reboot TRONG phiên" — viết TRƯỚC reboot #76 (T8 đóng 06:44Z); reboot #76 xảy ra SAU khi T8 đóng — T9 ghi rõ để T10 không đọc nhầm (xem F-168-T9-10).

### 5.4 T7-168 (scheduler) — T7 CHƯA đóng cờ lúc T9 đóng; kết cục run 167 + run 168 + (m) #76 thuộc T7-168/T2-169

- **T7-168 CHƯA xuất bản LIMITS + CHƯA viết cờ `round168-t7.done` lúc T9 đóng (07:57Z)** — T9 chỉ đối chiếu bằng dữ kiện T0/T2 đã xuất bản, không phán thay T7.
- **Run 167 SUCCEEDED 05:26:04Z theo DB** (theo T0-168: 5 event, 1 lần viết lại tại #74 +46,242 s; wall 10.213 s; margin 587 s; claimed→finished 108 s); **#75 KHÔNG viết lại run 167** (finish 402 s trước btime, 0 requeue — theo T0-168/T2-168).
- **Run 168 vẫn running lúc T9 đóng** (hạn 08:35:51Z) — kết cục + (m) #76 thuộc T7-168/T2-169. **Reboot #76 (07:32:23Z) xảy ra TRONG phiên run 168** — run 168 có bị viết lại tại #76 không, requeue offset có trong dải 33–49,8 s không — thuộc T7-168/T2-169 (T9 không phán).
- **(m) #75: KHÔNG PHẢI ĐIỂM** (theo T2-168: 0 requeue trong cửa 05:32:46–06:00:00Z; run 167 finish 402 s trước btime; run 168 start 185 s sau btime). **(m) #74: ĐỒNG Ý DƯƠNG** (theo T2-168 đối chiếu độc lập: requeue 04:06:15.242Z = btime +46,242 s ∈ [33; 49,8] — chờ parent quyết; nếu chấp nhận: n 26→27 / 27→28).
- T7-168 đóng cờ sau T9 (nếu có) — T9 không chờ T7 (hạn cờ T9 ~08:00Z).

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc 07:57Z (7/9)** — T7 chưa đóng, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T2-168:** (m) #74 ĐỒNG Ý DƯƠNG + (m) #75 KHÔNG PHẢI ĐIỂM (T2-168 sở hữu); INSIDE #74 INSIDE dải FULL120 → chuỗi mới từ #73 (T2-168 sở hữu); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (T2-168 sở hữu); hole-recheck lần 12: 337 hit, 0 mốc mới. T9 không trích số — thuộc T2-168/T10.
- **T1-168:** verify đợt 167 (T9 không trích số — thuộc T1-168/T10).
- **T6-168:** (A) 120/120 lần thứ 18 liên tiếp (tổng 2160/2160) + prune lần 43 + #74/#75 đều KHÔNG giết holder — chuỗi "không giết holder" mới từ #69: 7 reboot (T9 không trích số — thuộc T6-168/T10).
- **T4-168:** xem §2.3 (LIMITS đã xuất bản).
- **T0-168:** boot #75 xác minh 9/9 nguồn (T9 không trích số — thuộc T0-168/T10; số hiệu #75/#76 theo đếm tuần tự, chờ parent xác nhận).

## 6. Sai số / caveat (F-168-T9-*)

- **F-168-T9-1 — Cửa sổ thoáng sau reboot KHÔNG quan sát được trên cả hai boot — chuỗi 5 lần liên tiếp (đợt 163–167) ĐỨT.** Trên #75: ENOSPC đầu tiên 05:34:34Z (boot+108s) TRƯỚC khi đợt mở; probe mở 05:40:51Z (boot+486s) đã 0. Trên #76: cặp cửa sổ lúc boot+71s đã 0, 0; ENOSPC đầu tiên 07:34:08Z (boot+105s). T9 không claim cửa sổ có mở hay không — chỉ biết nếu có mở thì đã đóng trước boot+71s (#76) / boot+108s (#75). Đây là dữ kiện mới (đợt đầu tiên kể từ 163 không bắt được cửa sổ dù có reboot giữa phiên), không phải lỗi đo: T9 có mặt trên #76 từ boot+~40s (khởi động lại loop) nhưng lần đo đầu tiên chỉ tới được boot+71s (cần ~30 s để khởi động lại 3 loop + chạy probe).
- **F-168-T9-2 — Khoảng mù giữa hai đợt 3.280 s (04:45:54Z → 05:40:34Z) + gap phủ sóng đầu phiên 283 s + cửa sổ #75 không quan sát được.** Sampler đợt 167 dừng lúc đóng (04:45:54Z); sampler đợt 168 khởi động 05:40:34Z. Trong 3.280 s này có 1 reboot (#75 05:32:46Z) — E-169 đã kết thúc trong khoảng mù (xem §2.2); cửa sổ thoáng của #75 (nếu có, ~05:33–05:34Z) đã đóng trước khi T9 mở. Gap đầu phiên đợt này 283 s (đợt mở 05:35:51Z → sampler 05:40:34Z) — dài hơn đợt 167 (162 s) và đợt 166 (179 s), ngắn hơn đợt 165 (1.760 s). Trong 283 s này: balloon ở ~92% trần lúc mở (mẫu đầu 05:40:34Z bal 5.921.640 kB), headroom về 0 (probe mở 05:40:51Z đã là 0; ENOSPC đầu tiên 05:34:34Z đã trước khi đợt mở).
- **F-168-T9-3 — Mẫu sampler cuối #75 (07:32:37Z) mang nhãn boot cũ `576ca271` 14 s SAU btime #76 (07:32:23Z).** Sampler cũ vẫn sống quá btime mới ≥14 s — OVERLAP (đã xác nhận đợt 161: 824 s; đợt 165: ≥11 s tại #68; đợt 166: ≥6 s tại #70; đợt 167: 6 s tại #74 — nay ≥14 s tại #76, lần thứ năm, dài nhất kể từ #68). Mẫu này là số đo thật của boot cũ (balloon ghim 6.443.824 kB, mem 458.572 kB — mẫu ghim cuối E-170) — T9 tính nó vào E-170 (chuỗi 1, mẫu ghim cuối) vì đó là dữ kiện quan sát được trên boot cũ; thời điểm đứt thật của E-170 nằm trong (07:32:37Z, 07:33:32Z], không claim cụ thể. Ghi chú đứng quyết (e) đợt 165/166/167: dữ kiện khung giờ boot cũ không đổi verdict (m) — T9 chỉ ghi overlap, không phán (m) #76 (thuộc T2-169).
- **F-168-T9-4 — 1 lệnh sleep-wait dài của T9 (90 phút) bị runtime restart trùng với reboot #76 gián đoạn** (không có kết quả cuối xác nhận — runtime recovery; chỉ là timer chờ, không có side effect; mọi trạng thái đã trên đĩa, T9 verify lại từ disk sau đó: sampler 113 dòng, pinned 48, ENOSPC 99 — khớp số T9 ghi tay trước đó). Cùng mẫu F-167-T9-4 (sleep-wait bị reboot #74 giết sau 621 s) và F-166-T9-1. Không cần làm lại.
- **F-168-T9-5 — Lệnh `pkill -f 'round168-t9'` của chính T9 giết luôn shell đóng phiên của T9 (SIGTERM).** Lúc đóng phiên T9 chạy `pkill -f 'round168-t9'` để dọn loop — pattern khớp luôn command line của chính lệnh exec đó nên shell tự giết mình trước khi chạy phần freeze log. T9 làm lại bước freeze KHÔNG dùng pkill (kill theo pid 1900/1901/1902 đã chạy trước đó — "all T9 loops stopped" đã in ra trước khi shell chết). Không mất dữ liệu (log đã đủ 135 dòng trước khi shell chết; file FROZEN tạo sau đó từ cùng log). Bài học: không bao giờ `pkill -f` với pattern trùng tên thư mục làm việc của chính lệnh đang chạy.
- **F-168-T9-6 — 1 spike B2 TRONG cửa sổ attempt1 (06:06:04Z, load1 3,47, python3 analyze-t4-lag5.py delta 101).** Script phân tích của chính T4 (phân tích JSON attempt1) chạy lúc attempt1 vừa xong, 2 s trước khi poller thoát 06:06:06Z. Đây là spike DUY NHẤT trong cửa sổ attempt1 đợt này (đợt 167: 0 spike; đợt 166: xem LIMITS T4-166). T9 KHÔNG phán spike này có ảnh hưởng verdict "hợp lệ" của T4 hay không — chỉ ghi đúng thời điểm + driver + delta để T4/T10 phán (verdict hợp lệ của T4 dựa trên probe 20/20 + lớp B 5/5 + tickCost median 56,0; spike xảy ra SAU khi probe chạy xong, TRONG lúc phân tích).
- **F-168-T9-7 — ENOSPC #75 ≥99 là cận dưới (phần 07:27:40Z → 07:32:23Z mất theo reboot #76, KHÔNG cộng số ước); đúng 2 dòng trong 99 thuộc về khoảng trước khi đợt mở (05:34:34Z, 05:35:39Z).** Tổng đợt 168 ≥102 dòng đếm được (cận dưới) = ≥99 (#75) + 3 (#76); số dòng thuộc về đợt 168 theo cách trừ thận trọng nhất là ≥100 (≥97 + 3). T9 ghi cả hai số để T10/parent không đếm trùng. `journalctl --list-boots` lúc đóng chỉ còn #76 — journal #75 không đọc được nữa (cùng họ EPERM như `dmesg` — xem F-163-T9-1).
- **F-168-T9-8 — E-170 ĐÃ KẾT THÚC nhưng thời điểm đứt KHÔNG quan sát được chính xác (nằm trong khoảng mù 55 s qua reboot #76); E-171 ĐANG GHIM lúc đóng (kết cục thuộc đợt sau).** Mẫu ghim cuối E-170 07:32:37Z (nhãn boot cũ, sau btime mới 14 s); mẫu đầu #76 07:33:32Z bal 5.011.800 kB (77,8% trần) — balloon đã xả. T9 không claim E-170 đứt lúc 07:32:37Z hay lúc reboot — chỉ ghi khoảng mù. Tổng E-170 = 48 mẫu (1 chuỗi, 0 sag) — không cộng thêm. E-171 = 12 mẫu tới lúc đóng (1 chuỗi, 0 sag) — vẫn ghim lúc đóng cờ 07:54:32Z, kết cục thuộc T9-169.
- **F-168-T9-9 — Script analyze/recheck copy từ đợt 167 vẫn mang hằng số đợt 167 (boot id b643911f/194efd93, n=128, mean 928.493,0, pinned runs đợt 167).** T9 phát hiện TRƯỚC khi chạy (đọc script thấy hằng số cũ) — KHÔNG chạy bản stale; viết lại `t9-168-analyze.py` mới hoàn toàn từ log đóng băng (không assert hằng số cũ) và `t9-168-recheck.py` mới với hằng số đợt 168 (n=135, mean 981.186,2, runs [(65,112),(123,134)], spikes 15) — RECHECK OK. Bài học: script copy-forward phải soát hằng số trước khi chạy (cùng họ bẫy F-167-T4-1 của T4).
- **F-168-T9-10 — 1 spike delta-miss (05:49:18Z, ffmpeg 28256 100% tích lũy, delta mất).** Quy driver bằng ps top tức thời + top -b, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164), F-165-T9-6 (2 spike đợt 165), F-166-T9-6 (4 spike đợt 166) và F-167-T9-6 (6 spike đợt 167). **Nhãn "0 reboot TRONG phiên" của T4-168/T8-168 chỉ đúng tới lúc họ đóng cờ (T4 ~06:0xZ, T8 06:44Z) — reboot #76 (07:32:23Z) xảy ra SAU khi cả hai đóng; T9 ghi rõ để T10 không đọc nhầm thành "đợt 168 không có reboot giữa phiên".**
- **F-168-T9-11 — 3 spike load1 dư phân loại theo thực chất dù delta vượt ngưỡng chữ ≤15 (05:43:46Z delta max 26; 05:49:53Z delta max 26; 05:50:28Z delta max 29).** Căn cứ phân loại: không process nào chạy mạnh về CPU trong giây đo (top tức thời chỉ có hatch daemon + grep D-state); top -b: **37,5–65,9% idle + 15,0–20,9% iowait**; tải là grep D-state + iowait + dư âm bão mở đợt (spike 05:43:46Z còn có zombie MainThread 40,0% tức thời). T9 phân loại load1 dư theo THỰC CHẤT (không process nào đủ tải CPU trong giây đo) thay vì theo chữ (delta ≤15) và ghi rõ số 26/26/29 + trạng thái D-state/iowait để T10/parent kiểm lại — không giấu vào nhóm "quy được". Nếu parent giữ cách đọc "hatch/grep delta 26/29 cũng tính là driver" thì 3 spike này thành "quy được một phần" (hatch daemon / grep) — T9 trình cả hai cách đọc. Cùng tiền lệ F-167-T9-5 (spike 02:47:05Z/02:47:40Z đợt 167: find D-state + iowait 19,0–19,5% → load1 dư) và F-166-T9-5. **Watcher/sampler của chính T9 xuất hiện trong snapshot: `grep -c 'b2-watcher.sh'` = 8 dòng + `grep -c 'sampler.sh'` = 3 dòng — đều 0,0% CPU, delta 0** (chỉ là process nền nằm cuối top12 khi ít process bận; không ảnh hưởng attribution vì delta đều 0 — cùng mẫu F-167-T9-6).
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được — đợt này không quan sát được cửa sổ nào); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC từ cell vì journalctl chỉ còn boot hiện tại sau reboot (cùng họ EPERM như `dmesg` — xem F-163-T9-1); T10 không đếm lại độc lập B2 đợt 167 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).

---

## Phụ lục — log sampler đóng băng (135 mẫu, 05:40:34Z–07:54:32Z)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round168-t9/ram-sampler-FROZEN.log` (md5 `0b24f3c0bf00d2634fea5586b4648dd0`) — không gõ lại bằng tay (xem F-164-T9-10).

```
2026-11-22T05:40:34Z boot=576ca271 mem=943996 bal=5921640 swapfree=797836 load1=1.26
2026-11-22T05:41:34Z boot=576ca271 mem=733460 bal=5651344 swapfree=711408 load1=1.46
2026-11-22T05:42:35Z boot=576ca271 mem=1250380 bal=5563764 swapfree=723484 load1=3.73
2026-11-22T05:43:35Z boot=576ca271 mem=1137180 bal=5674928 swapfree=714024 load1=8.29
2026-11-22T05:44:35Z boot=576ca271 mem=1858856 bal=4920752 swapfree=719396 load1=4.80
2026-11-22T05:45:35Z boot=576ca271 mem=2510816 bal=4204984 swapfree=723860 load1=3.62
2026-11-22T05:46:35Z boot=576ca271 mem=2668356 bal=3999748 swapfree=725168 load1=3.04
2026-11-22T05:47:35Z boot=576ca271 mem=2170964 bal=4275568 swapfree=728516 load1=2.41
2026-11-22T05:48:35Z boot=576ca271 mem=2273636 bal=4055412 swapfree=736276 load1=1.91
2026-11-22T05:49:35Z boot=576ca271 mem=2515412 bal=4023716 swapfree=738032 load1=6.38
2026-11-22T05:50:35Z boot=576ca271 mem=2369564 bal=4283136 swapfree=766172 load1=3.94
2026-11-22T05:51:35Z boot=576ca271 mem=2193344 bal=4545928 swapfree=766832 load1=1.86
2026-11-22T05:52:35Z boot=576ca271 mem=1924368 bal=4792540 swapfree=766400 load1=1.33
2026-11-22T05:53:35Z boot=576ca271 mem=1997192 bal=4672852 swapfree=762664 load1=0.87
2026-11-22T05:54:35Z boot=576ca271 mem=2051300 bal=4687288 swapfree=756932 load1=1.22
2026-11-22T05:55:35Z boot=576ca271 mem=2152852 bal=4576844 swapfree=723640 load1=0.92
2026-11-22T05:56:35Z boot=576ca271 mem=1863688 bal=4811436 swapfree=723380 load1=0.66
2026-11-22T05:57:35Z boot=576ca271 mem=1651692 bal=5027360 swapfree=725748 load1=1.25
2026-11-22T05:58:36Z boot=576ca271 mem=1452464 bal=5226628 swapfree=721108 load1=0.61
2026-11-22T05:59:36Z boot=576ca271 mem=1327412 bal=5404668 swapfree=717660 load1=0.98
2026-11-22T06:00:36Z boot=576ca271 mem=1411624 bal=5345504 swapfree=701384 load1=1.31
2026-11-22T06:01:36Z boot=576ca271 mem=1758880 bal=5009848 swapfree=689208 load1=1.72
2026-11-22T06:02:36Z boot=576ca271 mem=1478600 bal=4572964 swapfree=661028 load1=2.39
2026-11-22T06:03:36Z boot=576ca271 mem=1134764 bal=4733948 swapfree=652844 load1=2.96
2026-11-22T06:04:36Z boot=576ca271 mem=1716736 bal=4663376 swapfree=653736 load1=1.92
2026-11-22T06:05:36Z boot=576ca271 mem=1913612 bal=4806112 swapfree=657100 load1=2.72
2026-11-22T06:06:36Z boot=576ca271 mem=3273520 bal=3551016 swapfree=655332 load1=2.29
2026-11-22T06:07:36Z boot=576ca271 mem=2915972 bal=3891956 swapfree=663400 load1=0.97
2026-11-22T06:08:36Z boot=576ca271 mem=2533488 bal=4195800 swapfree=664324 load1=0.92
2026-11-22T06:09:36Z boot=576ca271 mem=2658176 bal=4116088 swapfree=664924 load1=0.70
2026-11-22T06:10:36Z boot=576ca271 mem=2340088 bal=4397632 swapfree=677588 load1=0.25
2026-11-22T06:11:36Z boot=576ca271 mem=2070476 bal=4651052 swapfree=678208 load1=0.32
2026-11-22T06:12:36Z boot=576ca271 mem=1873572 bal=4885232 swapfree=682144 load1=0.29
2026-11-22T06:13:36Z boot=576ca271 mem=1687824 bal=5099868 swapfree=685504 load1=0.18
2026-11-22T06:14:36Z boot=576ca271 mem=1503352 bal=5296896 swapfree=685540 load1=0.27
2026-11-22T06:15:36Z boot=576ca271 mem=1352348 bal=5474860 swapfree=686088 load1=0.16
2026-11-22T06:16:36Z boot=576ca271 mem=1193692 bal=5637764 swapfree=689496 load1=0.06
2026-11-22T06:17:36Z boot=576ca271 mem=1024632 bal=5785416 swapfree=696612 load1=0.08
2026-11-22T06:18:36Z boot=576ca271 mem=919436 bal=5916064 swapfree=697564 load1=0.09
2026-11-22T06:19:36Z boot=576ca271 mem=818024 bal=6017624 swapfree=695936 load1=0.10
2026-11-22T06:20:36Z boot=576ca271 mem=714072 bal=6134344 swapfree=695952 load1=0.12
2026-11-22T06:21:36Z boot=576ca271 mem=980412 bal=5085768 swapfree=609920 load1=0.50
2026-11-22T06:22:36Z boot=576ca271 mem=1467396 bal=5234832 swapfree=609844 load1=2.98
2026-11-22T06:23:36Z boot=576ca271 mem=1474160 bal=5389636 swapfree=606264 load1=2.52
2026-11-22T06:24:36Z boot=576ca271 mem=802776 bal=5419316 swapfree=602572 load1=2.03
2026-11-22T06:25:36Z boot=576ca271 mem=707864 bal=5552408 swapfree=598884 load1=3.06
2026-11-22T06:26:36Z boot=576ca271 mem=577960 bal=5649384 swapfree=601032 load1=2.23
2026-11-22T06:27:36Z boot=576ca271 mem=1040396 bal=5764640 swapfree=601596 load1=1.36
2026-11-22T06:28:36Z boot=576ca271 mem=583228 bal=5665028 swapfree=593328 load1=2.10
2026-11-22T06:29:36Z boot=576ca271 mem=529628 bal=5757412 swapfree=594920 load1=1.39
2026-11-22T06:30:36Z boot=576ca271 mem=541236 bal=5850104 swapfree=595516 load1=0.71
2026-11-22T06:31:36Z boot=576ca271 mem=934004 bal=5936640 swapfree=594832 load1=1.12
2026-11-22T06:32:36Z boot=576ca271 mem=766776 bal=5323244 swapfree=586252 load1=1.70
2026-11-22T06:33:36Z boot=576ca271 mem=818204 bal=5359976 swapfree=707152 load1=2.21
2026-11-22T06:34:36Z boot=576ca271 mem=542620 bal=5482320 swapfree=702512 load1=2.13
2026-11-22T06:35:36Z boot=576ca271 mem=776636 bal=5426088 swapfree=673212 load1=1.32
2026-11-22T06:36:36Z boot=576ca271 mem=509136 bal=5503068 swapfree=662296 load1=2.72
2026-11-22T06:37:36Z boot=576ca271 mem=624724 bal=5615752 swapfree=652596 load1=1.32
2026-11-22T06:38:37Z boot=576ca271 mem=522384 bal=5735684 swapfree=644232 load1=0.66
2026-11-22T06:39:37Z boot=576ca271 mem=987104 bal=5869272 swapfree=645996 load1=0.30
2026-11-22T06:40:37Z boot=576ca271 mem=915360 bal=6002588 swapfree=680052 load1=0.17
2026-11-22T06:41:37Z boot=576ca271 mem=821536 bal=6126160 swapfree=682952 load1=0.20
2026-11-22T06:42:37Z boot=576ca271 mem=691396 bal=6237584 swapfree=683620 load1=0.07
2026-11-22T06:43:37Z boot=576ca271 mem=611644 bal=6338792 swapfree=680964 load1=0.25
2026-11-22T06:44:37Z boot=576ca271 mem=476724 bal=6429088 swapfree=682620 load1=0.22
2026-11-22T06:45:37Z boot=576ca271 mem=478144 bal=6443824 swapfree=680880 load1=0.35
2026-11-22T06:46:37Z boot=576ca271 mem=459400 bal=6443824 swapfree=682264 load1=0.33
2026-11-22T06:47:37Z boot=576ca271 mem=460148 bal=6443824 swapfree=683064 load1=0.18
2026-11-22T06:48:37Z boot=576ca271 mem=514740 bal=6443824 swapfree=681848 load1=0.45
2026-11-22T06:49:37Z boot=576ca271 mem=488956 bal=6443824 swapfree=686044 load1=0.24
2026-11-22T06:50:37Z boot=576ca271 mem=466644 bal=6443824 swapfree=685260 load1=0.09
2026-11-22T06:51:37Z boot=576ca271 mem=468604 bal=6443824 swapfree=684708 load1=0.14
2026-11-22T06:52:37Z boot=576ca271 mem=471260 bal=6443824 swapfree=683768 load1=0.05
2026-11-22T06:53:37Z boot=576ca271 mem=470264 bal=6443824 swapfree=683788 load1=0.11
2026-11-22T06:54:37Z boot=576ca271 mem=462228 bal=6443824 swapfree=682272 load1=0.11
2026-11-22T06:55:37Z boot=576ca271 mem=456828 bal=6443824 swapfree=682532 load1=0.04
2026-11-22T06:56:37Z boot=576ca271 mem=468328 bal=6443824 swapfree=682008 load1=0.01
2026-11-22T06:57:37Z boot=576ca271 mem=456652 bal=6443824 swapfree=681776 load1=0.07
2026-11-22T06:58:37Z boot=576ca271 mem=446336 bal=6443824 swapfree=681792 load1=0.10
2026-11-22T06:59:37Z boot=576ca271 mem=467888 bal=6443824 swapfree=681800 load1=0.03
2026-11-22T07:00:37Z boot=576ca271 mem=465888 bal=6443824 swapfree=687996 load1=0.12
2026-11-22T07:01:37Z boot=576ca271 mem=464388 bal=6443824 swapfree=688688 load1=0.07
2026-11-22T07:02:37Z boot=576ca271 mem=465836 bal=6443824 swapfree=688964 load1=0.02
2026-11-22T07:03:37Z boot=576ca271 mem=446856 bal=6443824 swapfree=684664 load1=0.13
2026-11-22T07:04:37Z boot=576ca271 mem=470956 bal=6443824 swapfree=684388 load1=0.11
2026-11-22T07:05:37Z boot=576ca271 mem=460424 bal=6443824 swapfree=683544 load1=0.04
2026-11-22T07:06:37Z boot=576ca271 mem=456584 bal=6443824 swapfree=683672 load1=0.01
2026-11-22T07:07:37Z boot=576ca271 mem=457736 bal=6443824 swapfree=683728 load1=0.00
2026-11-22T07:08:37Z boot=576ca271 mem=454028 bal=6443824 swapfree=683792 load1=0.00
2026-11-22T07:09:37Z boot=576ca271 mem=462804 bal=6443824 swapfree=684884 load1=0.00
2026-11-22T07:10:37Z boot=576ca271 mem=461164 bal=6443824 swapfree=684912 load1=0.07
2026-11-22T07:11:37Z boot=576ca271 mem=463156 bal=6443824 swapfree=685016 load1=0.02
2026-11-22T07:12:37Z boot=576ca271 mem=468844 bal=6443824 swapfree=684956 load1=0.01
2026-11-22T07:13:37Z boot=576ca271 mem=464304 bal=6443824 swapfree=685212 load1=0.00
2026-11-22T07:14:37Z boot=576ca271 mem=468644 bal=6443824 swapfree=685324 load1=0.10
2026-11-22T07:15:37Z boot=576ca271 mem=469916 bal=6443824 swapfree=685504 load1=0.03
2026-11-22T07:16:37Z boot=576ca271 mem=463916 bal=6443824 swapfree=685544 load1=0.01
2026-11-22T07:17:37Z boot=576ca271 mem=469500 bal=6443824 swapfree=685564 load1=0.00
2026-11-22T07:18:37Z boot=576ca271 mem=480296 bal=6443824 swapfree=685616 load1=0.00
2026-11-22T07:19:37Z boot=576ca271 mem=463856 bal=6443824 swapfree=685648 load1=0.15
2026-11-22T07:20:37Z boot=576ca271 mem=455616 bal=6443824 swapfree=685716 load1=0.05
2026-11-22T07:21:37Z boot=576ca271 mem=471180 bal=6443824 swapfree=681144 load1=0.09
2026-11-22T07:22:37Z boot=576ca271 mem=429080 bal=6443824 swapfree=682120 load1=0.03
2026-11-22T07:23:37Z boot=576ca271 mem=443132 bal=6443824 swapfree=682264 load1=0.11
2026-11-22T07:24:37Z boot=576ca271 mem=455436 bal=6443824 swapfree=682280 load1=0.14
2026-11-22T07:25:37Z boot=576ca271 mem=414364 bal=6443824 swapfree=682360 load1=0.29
2026-11-22T07:26:37Z boot=576ca271 mem=470620 bal=6443824 swapfree=682424 load1=0.28
2026-11-22T07:27:37Z boot=576ca271 mem=462548 bal=6443824 swapfree=682436 load1=0.14
2026-11-22T07:28:37Z boot=576ca271 mem=468852 bal=6443824 swapfree=682464 load1=0.05
2026-11-22T07:29:37Z boot=576ca271 mem=458272 bal=6443824 swapfree=682536 load1=0.08
2026-11-22T07:30:37Z boot=576ca271 mem=468144 bal=6443824 swapfree=682724 load1=0.17
2026-11-22T07:31:37Z boot=576ca271 mem=463068 bal=6443824 swapfree=682836 load1=0.12
2026-11-22T07:32:37Z boot=576ca271 mem=458572 bal=6443824 swapfree=682556 load1=0.27
2026-11-22T07:33:32Z boot=f2b97695 mem=1803884 bal=5011800 swapfree=1006396 load1=2.37
2026-11-22T07:34:32Z boot=f2b97695 mem=1644124 bal=5207712 swapfree=903352 load1=2.30
2026-11-22T07:35:32Z boot=f2b97695 mem=1489308 bal=5400360 swapfree=867584 load1=1.27
2026-11-22T07:36:32Z boot=f2b97695 mem=1249232 bal=5573148 swapfree=839468 load1=1.15
2026-11-22T07:37:32Z boot=f2b97695 mem=1219892 bal=5734956 swapfree=841320 load1=0.53
2026-11-22T07:38:32Z boot=f2b97695 mem=1084268 bal=5884884 swapfree=826024 load1=0.22
2026-11-22T07:39:32Z boot=f2b97695 mem=952416 bal=6021440 swapfree=816524 load1=0.08
2026-11-22T07:40:32Z boot=f2b97695 mem=810904 bal=6145732 swapfree=806340 load1=0.11
2026-11-22T07:41:32Z boot=f2b97695 mem=733808 bal=6258044 swapfree=802000 load1=0.23
2026-11-22T07:42:32Z boot=f2b97695 mem=616016 bal=6362168 swapfree=788044 load1=0.17
2026-11-22T07:43:32Z boot=f2b97695 mem=567392 bal=6443824 swapfree=781524 load1=0.14
2026-11-22T07:44:32Z boot=f2b97695 mem=520844 bal=6443824 swapfree=779404 load1=0.15
2026-11-22T07:45:32Z boot=f2b97695 mem=548636 bal=6443824 swapfree=779432 load1=0.11
2026-11-22T07:46:32Z boot=f2b97695 mem=495732 bal=6443824 swapfree=776208 load1=0.09
2026-11-22T07:47:32Z boot=f2b97695 mem=543472 bal=6443824 swapfree=777344 load1=0.17
2026-11-22T07:48:32Z boot=f2b97695 mem=539540 bal=6443824 swapfree=774996 load1=0.38
2026-11-22T07:49:32Z boot=f2b97695 mem=544272 bal=6443824 swapfree=765496 load1=0.38
2026-11-22T07:50:32Z boot=f2b97695 mem=560440 bal=6443824 swapfree=765616 load1=0.14
2026-11-22T07:51:32Z boot=f2b97695 mem=562868 bal=6443824 swapfree=764016 load1=0.05
2026-11-22T07:52:32Z boot=f2b97695 mem=561644 bal=6443824 swapfree=764028 load1=0.05
2026-11-22T07:53:32Z boot=f2b97695 mem=559924 bal=6443824 swapfree=763844 load1=0.17
2026-11-22T07:54:32Z boot=f2b97695 mem=574000 bal=6443824 swapfree=763748 load1=0.06
```

---

## Phụ lục — headroom log (48 dòng, 13 lần probe)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round168-t9/headroom-log-FROZEN.txt` — không gõ lại bằng tay (xem F-164-T9-10).

```
=== probe-open 2026-11-22T05:40:51Z boot=576ca271 tran=63747 uptime_s=485.79
0
0
ENOSPC-count=6
ENOSPC-last: Nov 22 05:40:19 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     879056 kB | Balloon:         5963680 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-2 2026-11-22T06:10:34Z boot=576ca271 tran=63747
0
0
ENOSPC-count=32
ENOSPC-last: Nov 22 06:10:19 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    2407164 kB | Balloon:         4306364 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-3 2026-11-22T06:40:35Z boot=576ca271 tran=63747
0
0
ENOSPC-count=58
ENOSPC-last: Nov 22 06:40:09 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     909636 kB | Balloon:         6002588 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-4 2026-11-22T07:10:35Z boot=576ca271 tran=63747
0
0
ENOSPC-count=84
ENOSPC-last: Nov 22 07:09:59 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     464640 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-pair-76 2026-11-22T07:33:34Z boot=f2b97695 tran=63747 uptime_s=71.30
0
0
ENOSPC-count=0
ENOSPC-last: 
mem: MemAvailable:    1834520 kB | Balloon:         5076580 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-map-76-1 2026-11-22T07:35:35Z boot=f2b97695 tran=63747 uptime_s=192.11
0
ENOSPC-count=2
ENOSPC-last: Nov 22 07:35:10 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1490200 kB | Balloon:         5462092 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-dong 2026-11-22T07:54:51Z boot=f2b97695 tran=63747 uptime_s=1348.52
2
2
ENOSPC-count=3
ENOSPC-last: Nov 22 07:36:12 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     515116 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
```

*LIMITS này do T9 đợt 168 viết, đóng cờ 08:02Z 22/11/2026 (sau hạn cờ ~08:00Z 2 phút vì reboot #76 giữa phiên + runtime restart; trong hạn cứng đóng 08:30Z). Không push GitHub. Không sửa production. Không chạy TTS 39. Không thử birefnet (guard không mở).*
