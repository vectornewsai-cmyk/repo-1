# LIMITS — Phase 9 đợt 156, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ mười liên tiếp; headroom 0 → 2 — lần đầu khác 0 kể từ đợt 151; balloon GHIM TRẦN 2 EPISODE MỚI, 30/137 mẫu, 4 chuỗi, 2 boot; BA reboot giữa phiên; ENOSPC ≥39 dòng trên 4 boot; lượt yên #25 KHÔNG có lượt hợp lệ)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 0/0 (17:40:07Z, boot #52 5353ed19) → đóng 2/2/2/2 (19:56:34Z, boot c99a1045)** — lần đầu tiên headroom khác 0 kể từ đợt 151 (đợt 151 đóng 90; 152–155 đóng 0); **vẫn dưới ngưỡng < ~1.800 lần thứ mười sáu liên tiếp**; tỉ lệ/vite **0 → 0,001** — chuỗi "đóng ở 0" bốn đợt liên tiếp (152–155) **DỨT**. Trần 63.747 không đổi. Xem §1.
- **Balloon GHIM TRẦN 2 EPISODE MỚI — 30/137 mẫu (21,9%), 4 chuỗi, HAI boot:** episode A trên boot 447f0efe (chuỗi 1: 18:43:51–18:51:51Z, 9 mẫu + chuỗi 2: 18:55:51–19:04:51Z, 10 mẫu — chuỗi 2 **BỊ REBOOT CẮT NGANG, không quan sát được điểm đứt**) + episode B trên boot c99a1045 (chuỗi 3: 19:21:46–19:23:46Z, 3 mẫu + chuỗi 4: 19:26:46–19:33:46Z, 8 mẫu — cả hai đều đứt quan sát được, chuỗi 4 xả sâu tới 85,8% trần). **Phán theo quy tắc (e)/(g): A và B là HAI episode riêng** (giữa chuỗi 2 và chuỗi 3 có reboot #55 + xả sâu tới 73,1% trần + ~17 phút không ghim) — và đều là episode mới, không nối đợt 155. Giao T10 xác nhận cách đếm. Xem §2.2.
- **RAM:** sampler **137 mẫu, 17:39:56–19:56:47Z, BỐN boot** (47 mẫu #52 + 3 mẫu #53 + 35 mẫu #54 + 52 mẫu #55 — theo chuỗi số T7; xem F-156-T9-4 về xung đột số hiệu). Min **394.324 kB (385,1 MiB) lúc 19:52:47Z** (trong cụm clicktest Chromium lúc đóng); max **3.477.000 kB (3.395,5 MiB = 55,27% guard) lúc 18:13:58Z**; mean 1.264.231 kB. Gate A ≥1024 MiB: **72/137 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ mười liên tiếp.** Xem §2, §3.
- **B2: 25 spike load1 ≥3,0 — 22 QUY ĐƯỢC DRIVER CỤ THỂ + 3 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ".** Cụm 1 (11 spike, T1 verify + ffmpeg/mask_anim render, đỉnh 8,45) + cụm 2 (5 spike, testsrc2 geq + blind82-investigate, 2 dư) + 1 spike WebKit (T4 attempt2) + cụm 3 (8 spike, Chromium clicktest-86n2 lúc đóng, 1 dư). **0 spike trong cả hai cửa sổ balloon ghim** (~42 phút ghim, tải yên hoàn toàn). Delta tick lớn nhất 103 tick/s (tsc). Xem §2.5.
- **Lượt yên WebKit #25 (T4): KHÔNG CÓ ATTEMPT HỢP LỆ — lần thứ tư liên tiếp** (#22/#23/#24/#25). Attempt1 probe 20/20 nhưng tickCost median 67,0 ms > 60 (không dùng verdict); attempt2/3 PAGE-WEDGED (11/20, 9/20). Ngân sách 3/3 DÙNG HẾT. **Chuỗi lượt yên hợp lệ DỪNG Ở #21.** P3' cộng dồn KHÔNG ĐỔI: **39/41 occurrence = 39/40 distinct-seq**. Sampler T9 đối chiếu độc lập: gate A MỞ suốt cả ba attempt (RAM 1,59–3,48 GB) — lỗi T4 KHÔNG PHẢI do RAM. Xem §2.3.
- **BA reboot giữa phiên** (062850d8 btime 18:26:26Z, sống 209 s; 447f0efe btime 18:29:55Z, sống 2.100 s; c99a1045 btime 19:04:55Z): sampler + watcher chết theo cả ba lần, T9 khởi động lại bằng tay cả ba lần, gap phủ sóng 82 s / 90 s / 54 s (tổng 226 s không phủ). **XUNG ĐỘT SỐ HIỆU: T4-156 gọi 447f0efe là #53, T7-156 gọi là #54 (062850d8 là #53)** — T9 ghi cả hai, giao T10/parent phán; mù #84?/#85?/#86? giao T2-157 (coordinator đã giao #85? cho T2-157). Xem §5, F-156-T9-4.
- **ENOSPC THẬT TRONG JOURNAL: ≥39 dòng trên BỐN boot** — #52: ≥21 dòng (2 lúc mở do T9 đếm + 21 lúc 18:02:36Z do T5-156 đếm; số cuối không kiểm được); #53: 0 dòng quan sát được (boot sống 209 s); #54: ≥7 dòng (18:39Z; số cuối không kiểm được); #55: 11 dòng lúc đóng (19:52:38Z). Tất cả cùng thông điệp `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. Xem §4.
- **T5-156 (đối chiếu):** POSTBOOT_PASS #52 CÓ (18:00:10Z); #51 KHÔNG CÓ, không bù được; #53/#54/#55 chưa có cờ T5 (T5 đóng 18:06Z, trước cả ba reboot) — giao T5-157. Xem §5.2.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round156-t9/k8-headroom.py` (copy y nguyên từ đợt 155 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 156

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 17:40:07Z 20/11 | **0** | #52 5353ed19 (btime 17:19:25Z) | lần đo 1, boot ~21' tuổi; RAM trước đo 1.273.256 kB, balloon 5.626.400 kB, load1 3,21 |
| 17:40:07Z 20/11 | **0** | #52 5353ed19 | lần đo 2 (chênh **0** so với lần 1); RAM trước đo ~1.294.736 kB, balloon 5.626.400 kB |
| 19:56:34Z 20/11 | **2** | c99a1045 (btime 19:04:55Z) | lần đo 3 (đóng phiên, boot thứ tư trong phiên; 4 lần chạy liên tiếp trong một lệnh); RAM trước đo 868.640 kB, balloon 6.101.600 kB, load1 ~2,48 |
| 19:56:34Z 20/11 | **2** | c99a1045 | lần đo 4 (chênh **0** so với lần 3); RAM trước đo 861.504 kB, balloon 6.101.600 kB |
| 19:56:34Z 20/11 | **2** | c99a1045 | lần đo 5 (xác nhận thêm); RAM trước đo 859.868 kB, balloon 6.101.600 kB |
| 19:56:34Z 20/11 | **2** | c99a1045 | lần đo 6 (xác nhận thêm lần nữa do 2 là giá trị mới sau chuỗi 0); RAM trước đo 856.744 kB, balloon 6.101.600 kB |

- Probe dừng ở `i=2` cả bốn lần đóng — `inotify_add_watch` thứ ba trả errno 28 (không thêm được watch thứ ba), đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau mỗi lần đo).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 2 = **63.745 watch** lúc đóng (**bảng watch gần như đầy hẳn**, chỉ còn 2 watch trống); lúc mở là 63.747 watch (đầy hẳn).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): 0 / 1.578 = **0** mở đợt; 2 / 1.578 = **0,001** đóng phiên — **chuỗi "đóng ở 0" bốn đợt liên tiếp (152–155) DỨT, nhưng 2 watch vẫn vô nghĩa thực tế** (một vite mới cần ~1.578 watch vẫn không khởi động được).
- **Giải thích thận trọng (F-156-T9-1):** 2 watch trống nhiều khả năng là 1–2 watch holder ngắn hạn chết qua ba reboot trong phiên, KHÔNG phải xu hướng hồi phục — các đợt trước đã chứng minh reboot không khôi phục headroom (đợt 155: 0 mở → 0 đóng qua reboot #50). T9 không claim hồi phục; chỉ ghi số đo đã xác nhận 4 lần.
- T5-156 KHÔNG probe lại headroom đợt này (như đợt 151–155) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 2 lần đo mở chênh 0 + 4 lần đo đóng đều 2 + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal BỐN boot có ≥39 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM trước đo lần đóng (~0,86 GB) thấp hơn lần mở (~1,27–1,29 GB) trong khi headroom nhích 0 → 2. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–155 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 139 | 1.954 → 1.954 | đo 14:41:18Z → 14:41:29Z, boot 541524e2 btime 13:53:41Z (đính chính T1-139 F-139-T1-1) |
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
| **156** | **0 → 2** | **mở 17:40:07Z boot #52 5353ed19 btime 17:19:25Z → đóng 19:56:34Z boot MỚI c99a1045 btime 19:04:55Z (BA reboot giữa phiên: 062850d8 18:26:26Z + 447f0efe 18:29:55Z + c99a1045 19:04:55Z; 4 lần đo đóng đều 2)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 BỐN ĐỢT, NHÍCH LÊN 2 — vẫn thực tế bằng 0.** Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**. Bước nhích đợt này: +2 (đo 6 lần: 0, 0 mở + 2, 2, 2, 2 đóng).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, thấp hơn ngưỡng 1.800, lần thứ mười sáu liên tiếp.** Quyết parent đợt 155 (h): GIỮ quyết (g) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): headroom nhích 0 → 2 (4 lần đo đóng đều 2, không phải số đo lẻ) + journal có ≥39 dòng lỗi ENOSPC thật của systemd trên BỐN boot trong phiên** — đợt thứ năm liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng — ít hơn đợt 155 vì journal của 3 boot cũ mất theo 3 reboot, xem §4/F-156-T9-5). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 17:40Z và lúc đóng 19:56Z — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.745 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.048.572 kB) — sampler 137 mẫu, 17:39:56–19:56:47Z, BỐN boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên (T1 verify + T4 attempt, đỉnh 3.477.000 kB) → rơi dần khi balloon leo → ghim trần 2 episode trên 2 boot mới (RAM trũng ~394–650k) → xả sâu lúc đóng, RAM hồi nhẹ

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; 3 gap do reboot: 82 s / 90 s / 54 s — xem §5.1). **137 mẫu, 17:39:56–19:56:47Z 20/11, BỐN boot — gap lớn nhất 90 s, KHÔNG có gap >90 s.** Tổng quan: **min 394.324 kB (385,1 MiB) lúc 19:52:47Z; max 3.477.000 kB (3.395,5 MiB) lúc 18:13:58Z — 55,27% guard; mean 1.264.231 kB (1.234,6 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 17:39:56–17:59:58Z | #52 | 833.676–2.462.664 kB (đo tới 17:59:58Z; xem phụ lục) | T1 verify (find/tsc/ffmpeg/mask_anim) + T4 poller mở cửa; gate A MỞ phần lớn; load1 tới 8,45 (sampler) |
| 18:00:58–18:13:58Z | #52 | 1.045.616–3.477.000 kB | T4 attempt1/2/3 (18:02:49–18:12:32Z); **đỉnh phiên 18:13:58Z** (balloon xả sâu nhất phiên 3.338.776 kB = 51,8% trần); gate A MỞ 14/14 mẫu; load1 ≤3,47 |
| 18:14:58–18:25:59Z | #52 | 833.676–2.779.068 kB (xem phụ lục) | RAM rơi khi balloon leo lại 3,4M → 6,03M kB; gate A MỞ thưa dần; mẫu cuối boot cũ 18:25:59Z (833.676 kB) |
| 18:27:21–18:29:21Z | #53 | 1.631.732–1.895.796 kB | Boot 062850d8 sống 209 s — chỉ 3 mẫu; gate A MỞ 3/3; RAM hồi sau reboot |
| 18:30:51–18:42:51Z | #54 | 779.020–1.879.804 kB | Boot 447f0efe: RAM hồi rồi rơi khi balloon leo 5,01M → 6,41M kB; gate A MỞ 8/13 mẫu đầu, rồi ĐÓNG từ 18:39:51Z |
| 18:43:51–19:04:51Z | #54 | 525.312–632.352 kB | **Ghim trần episode A, 19 mẫu trong 2 chuỗi** (xem §2.2); RAM trũng sâu; **gate A ĐÓNG cả 22 mẫu** (18:43:51–19:04:51Z); load1 ≤0,71 (yên hoàn toàn về tải) |
| 19:05:45–19:20:46Z | #55 | 665.584–2.141.944 kB | Sau reboot #55: RAM hồi, balloon xả sâu 4.711.112 kB (73,1% trần) lúc 19:06:45Z; gate A MỞ 11/16 mẫu đầu rồi ĐÓNG từ ~19:14Z |
| 19:21:46–19:33:46Z | #55 | 556.372–623.160 kB | **Ghim trần episode B, 11 mẫu trong 2 chuỗi** (xem §2.2); RAM trũng; **gate A ĐÓNG cả 13 mẫu** (19:21:46–19:33:46Z); load1 ≤0,23 |
| 19:34:46–19:56:47Z | #55 | 394.324–1.479.116 kB | Đứt ghim chuỗi 4 (balloon xả về 5.526.320 kB = 85,8% trần); cụm Chromium clicktest 19:47:46–19:51:53Z (load1 tới 4,79) + **RAM min phiên 19:52:47Z (394.324 kB)**; gate A MỞ 6/23 mẫu; mẫu cuối 19:56:47Z 824.008 kB, gate A ĐÓNG |

- **Gate A ≥1024 MiB: 72/137 mẫu** (44/47 boot #52 + 3/3 boot #53 + 8/35 boot #54 + 17/52 boot #55); **0 mẫu ≥ guard**; load1 max (sampler) **8,45 lúc 17:43:56Z**; **15/137 mẫu load1 ≥3,0** (10 mẫu boot #52 + 0 mẫu boot #53 + 0 mẫu boot #54 + 5 mẫu boot #55). **RAM <500 MiB: 3 mẫu** (tính theo <512.000 kB: 452.100 lúc 19:50:47Z; 506.380 lúc 19:51:47Z; 394.324 lúc 19:52:47Z — cả ba trong cụm Chromium lúc đóng).
- Swap: SwapFree 787.848 kB (mẫu đầu) → 626.304 kB (mẫu cuối); dao động 619.060–1.040.612 kB — nhảy lên ~1.040.000 kB ngay sau mỗi reboot (xả swap theo reboot) rồi tụt dần về ~620–750k kB.
- Đối chiếu T4-156 (LIMITS đã xuất bản — xem §2.3): RAM ≥1024 trên boot #52 suốt cửa sổ attempt (poll #29/#30/#31 mở cửa 18:02:49Z/18:07:10Z/18:10:13Z); sampler T9: gate A MỞ 14/14 mẫu 18:00:58–18:13:58Z — khớp T4 mở cửa ba lần. T4 ghi 31/32 poll RAM ≥1024, 0 poll <500 MB — sampler T9: 0/47 mẫu boot #52 <512.000 kB — cùng kết luận.
- Mẫu 18:13:58Z (đỉnh phiên): RAM 3.477.000 kB, balloon xả 3.338.776 kB — balloon xả sâu nhất phiên ngay sau T4 attempt3 (cùng mẫu đợt 152/153/154/155: xả sâu sau reboot / lúc suite chạy / sau attempt). T9 ghi đúng số đo, không phán cơ chế.

### 2.2 Balloon virtio — GHIM TRẦN 2 EPISODE MỚI, 30/137 mẫu, 4 chuỗi, HAI boot

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #52: GHIM TRẦN 0/47 mẫu (0%)** — balloon cao nhất 6.187.468 kB (96,0% trần) lúc ~17:41Z (xem phụ lục), chưa chạm trần lần nào.
- **Boot #53 (062850d8): GHIM TRẦN 0/3 mẫu (0%)** — balloon cao nhất 5.144.772 kB (79,8% trần), boot sống quá ngắn để leo tới trần.
- **Boot #54 (447f0efe): GHIM TRẦN 19/35 mẫu (54,3%), trong 2 chuỗi — EPISODE A:**
  - **Chuỗi 1: 18:43:51–18:51:51Z, 9 mẫu** (span 480 s, 8 phút); đứt 18:52:51Z (balloon xả về 6.133.096 kB = 95,2% trần), 18:53:51Z 6.248.024 kB (97,0% trần), 18:54:51Z 6.351.844 kB (98,6% trần) rồi ghim lại.
  - **Chuỗi 2: 18:55:51–19:04:51Z, 10 mẫu** (span 540 s, 9 phút); **BỊ REBOOT #55 CẮT NGANG — KHÔNG quan sát được điểm đứt** (mẫu cuối trước reboot 19:04:51Z vẫn ghim, mem 546.688 kB, load1 0,01).
- **Boot #55 (c99a1045): GHIM TRẦN 11/52 mẫu (21,2%), trong 2 chuỗi — EPISODE B:**
  - **Chuỗi 3: 19:21:46–19:23:46Z, 3 mẫu** (span 120 s, 2 phút); đứt 19:24:46Z (balloon xả về 6.247.216 kB = 97,0% trần), 19:25:46Z 6.356.328 kB (98,6% trần) rồi ghim lại.
  - **Chuỗi 4: 19:26:46–19:33:46Z, 8 mẫu** (span 420 s, 7 phút); **đứt 19:34:46Z (balloon xả về 5.526.320 kB = 85,8% trần — điểm xả sâu nhất trong các lần đứt ghim đợt này, RAM hồi 773.020 kB)** — quan sát được điểm đứt + xả sâu.
- **Tổng ghim trần đợt này: 30/137 mẫu (21,9%)** (đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **3/4 chuỗi quan sát được điểm đứt** (khác đợt 155: 4/4; giống đợt 154: 1 chuỗi bị reboot cắt).
- **Phán theo quy tắc quyết (e)/(g) (T9 phán, giao T10 xác nhận cách đếm):**
  - **Episode A (boot #54, chuỗi 1+2): 1 EPISODE.** Hai chuỗi cùng boot, cách nhau bởi dip NÔNG (95,2% / 97,0% / 98,6% trần — KHÔNG phải xả sâu) — đếm là 1 episode theo quy tắc (g) đợt 152. Chuỗi 2 bị reboot cắt không làm đổi cách đếm trong boot (tiền lệ đợt 154: chuỗi 3 bị reboot cắt vẫn đếm trong cùng episode của boot đó).
  - **Episode B (boot #55, chuỗi 3+4): 1 EPISODE.** Hai chuỗi cùng boot, cách nhau bởi dip NÔNG (97,0% / 98,6% trần) — đếm là 1 episode theo quy tắc (g).
  - **A và B là HAI EPISODE RIÊNG, không nối nhau:** giữa lần ghim cuối episode A (19:04:51Z, boot #54, bị reboot cắt) và lần chạm đầu episode B (19:21:46Z, boot #55) có **reboot #55 (btime 19:04:55Z) + balloon xả sâu tới 4.711.112 kB (73,1% trần) lúc 19:06:45Z + ~17 phút không ghim** (19:04:51Z → 19:21:46Z) — đủ cả ba điều kiện của quyết (e) (reboot + xả sâu + thời gian không ghim).
  - **Cả hai episode đều MỚI, không nối đợt 155:** giữa lần ghim cuối đợt 155 (16:30:45Z, boot #50) và lần chạm đầu đợt 156 (18:43:51Z, boot #54) có **BA reboot (#52 lúc mở + #53 + #54) + balloon xả sâu nhiều lần (tới 3.338.776 kB = 51,8% trần lúc 18:13:58Z) + ~2h13m không ghim**.
  - **Đợt 156 = 2 EPISODE GHIM MỚI** (A: 19 mẫu/2 chuỗi; B: 11 mẫu/2 chuỗi) — lần đầu tiên trong chuỗi T9 một đợt có 2 episode (các đợt 152–155 mỗi đợt 1 episode).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~394–650.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 19:56:47Z: tổng RAM 8.124.900 kB − balloon 6.101.600 kB = 2.023.300 kB còn lại; MemAvailable 824.008 kB.

### 2.3 Lượt yên WebKit #25 (T4, đợt 156) — KHÔNG CÓ ATTEMPT HỢP LỆ, LẦN THỨ TƯ LIÊN TIẾP (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-156 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND156_T4_WEBKIT_QUIET25_LIMITS.md`) + cờ `round156-t4.done` — khác đợt 155 (T4 chưa xuất bản lúc T9 đóng). T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Poller T4 chạy 1 instance, 32 poll thật (1 test + 31), 1 boot (#52), thoát 18:13:07Z (trước hạn cắt 19:30Z vì hết ngân sách):**
  - **Attempt1-5353ed19 (18:02:49–18:06:31Z): probe 20/20, LỚP B ĐẠT 5/5, NHƯNG tickCost median 67,0 ms > 60 (p90 92,0, max 273) — vượt cổng, KHÔNG DÙNG VERDICT, retry.** Ngân sách đã dùng 1/3.
  - **Attempt2-5353ed19 (18:07:10–18:09:39Z): PAGE-WEDGED sau pass 11/20** — cả 3 fetch writePartial đều TIMEOUT 30 s, exit=2, partial tickCost n=271 median 50,0 ms (chỉ ghi nhận). Ngân sách 2/3.
  - **Attempt3-5353ed19 (18:10:13–18:12:32Z): PAGE-WEDGED sau pass 9/20**, exit=2, partial tickCost n=219 median 54,0 ms (chỉ ghi nhận). **Ngân sách 3/3 DÙNG HẾT.**
  - RAM ≥1024: **31/32 poll**; **0 poll <500 MB**; 3 cửa mở (poll #29/#30/#31).
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): KHÔNG CÓ attempt hợp lệ nào cho lượt yên #25** — attempt1 vượt cổng tickCost, attempt2/3 wedged. **Chuỗi lượt yên hợp lệ DỪNG Ở #21** (đợt 153) — KHÔNG CÓ lượt hợp lệ mới #22/#23/#24/#25. Cộng dồn 21 lượt GIỮ NGUYÊN: P1 69/69, P2 60/60, P3-A1 61/69, **P3' 39/41 occurrence = 39/40 distinct-seq**, P7 55/55 (theo LIMITS T4-156).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Gate A RAM: **MỞ 14/14 mẫu trong cửa sổ attempt** (18:00:58–18:13:58Z, RAM 1.045.616–3.477.000 kB) — khớp T4 mở cửa ba lần (poll #29/#30/#31). **Lỗi T4 KHÔNG PHẢI do RAM** (khác đợt 155: cửa đóng do RAM sập): attempt1 vượt cổng tickCost trong lúc RAM 1,59–2,43 GB; attempt2/3 wedged trong lúc RAM 2,17–3,17 GB.
  - Tải: sampler load1 **3,47 lúc 18:07:58Z** — trùng spike B2 18:07:56Z (WebKitWebProcess delta 90 + MiniBrowser delta 31, xem §2.5) — attempt2 đang chạy; các mẫu còn lại trong cửa sổ attempt load1 0,64–2,22.
  - RAM <500 MiB: sampler T9 **0/47 mẫu boot #52 <512.000 kB** — khớp T4 "0 poll <500 MB".
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy 18:02:49–18:13:07Z trên boot #52 (1 instance; attempt1 18:02:49–18:06:31Z, attempt2 18:07:10–18:09:39Z, attempt3 18:10:13–18:12:32Z).

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 18:00:58–18:06:58Z | #52 | 0,64–2,22 (7 mẫu) | 1.045.616–2.428.464 kB — **gate A MỞ 7/7** | T4 attempt1 — RAM mở, tải yên; attempt1 vượt cổng tickCost (67,0 > 60), không phải do RAM/tải |
| 18:07:58–18:09:58Z | #52 | 0,86–3,47 (3 mẫu) | 2.166.532–2.656.544 kB — **gate A MỞ 3/3** | T4 attempt2 — spike B2 18:07:56Z (WebKit 90 tick/s) trùng mẫu sampler 18:07:58Z load1 3,47; PAGE-WEDGED sau pass 11/20 |
| 18:10:58–18:13:58Z | #52 | 0,71–1,93 (4 mẫu) | 2.228.472–3.477.000 kB — **gate A MỞ 4/4** | T4 attempt3 — PAGE-WEDGED sau pass 9/20; đỉnh RAM phiên 18:13:58Z (3.477.000 kB) |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 25 spike, 22 QUY ĐƯỢC DRIVER CỤ THỂ + 3 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ" (0 spike trong cả hai cửa sổ balloon ghim)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-156-T9-6). **25 spike, trong 17:39:56–19:51:53Z; 0 spike trong 18:43:51–19:04:51Z (~21 phút episode A) và 19:21:46–19:33:46Z (~12 phút episode B) — tổng ~33 phút ghim + ~9 phút dip giữa chuỗi, tải yên hoàn toàn.**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — T1 verify + render mask (11 spike) | 17:39:56–17:46:51Z | 3,01–**8,45** | 11 | find/md5sum test-vite-lock delta 26 + daemon 18 (spike 1); tsc delta **103** (spike 2); daemon 52 + find newermt 33 (spike 3); ffmpeg delta **102/95** (spike 4–5); ffmpeg top tức thời 87,3% + mask_anim.py 46,8% (spike 6); mask_anim.py delta **75/84/86/85** (spike 7–8, 10–11); ffmpeg top tức thời 101% + mask_anim 50,9% (spike 9, delta chỉ bắt daemon 20 do ffmpeg chết trước delta) | **T1 verify (find, tsc) + render mask_anim/ffmpeg (tmp-u4-old)** — cùng họ đợt 155 (ffmpeg render, mask_anim); spike 3 là daemon + find sweep |
| 2 — testsrc2 geq + blind82 (5 spike) | 17:50:27–17:52:50Z | 3,66–6,99 | 5 | ffmpeg testsrc2 geq 1920x1080 top tức thời **113%** + blind82-investigate.py 13,3% (spike 12); blind82-investigate.py delta **21/13** (spike 13–14, spike 14 kèm daemon 26); daemon delta 33, KHÔNG process nào khác (spike 15); daemon delta 27, KHÔNG process nào khác (spike 16) | **Test render pixelate geq (T1/T2) + blind82-investigate.py của T2-156**; spike 15–16 lớp load1 dư (dư sau burst geq + blind82) |
| 3 — T4 attempt2 (1 spike) | 18:07:56Z | 3,47 | 1 | WebKitWebProcess delta **90** + MiniBrowser delta **31** + Xvfb 9 | **T4 attempt2** (18:07:10–18:09:39Z, PAGE-WEDGED sau pass 11/20) — khớp mẫu sampler 18:07:58Z load1 3,47 |
| 4 — Chromium clicktest lúc đóng (8 spike) | 19:47:46–19:51:53Z | 3,34–4,79 | 8 | chrome gpu-process delta **91–100** + chrome renderer delta **29–38** (spike 18–20, 22–24); chrome gpu top tức thời 72,0% + renderer 26,7% (spike 25, delta chỉ còn 3/3 do burst đã tàn); daemon/Xvfb delta 0, KHÔNG process nào khác (spike 21) | **O8/clicktest-86n2 đang chạy lúc T9 đóng** (Chromium + clicktest-86n2-webkit-w7.mjs; T8 là chủ quản); spike 21 lớp load1 dư (burst chrome đã tàn trước delta) |

- **Tổng kết đếm: 22/25 spike có driver process cụ thể** (cụm 1: 11; cụm 2: 3; cụm 3: 1; cụm 4: 7) **+ 3/25 spike lớp "load1 dư"** (cụm 2: 2; cụm 4: 1 — ghi rõ trong bảng trên, không gộp chung thành "đã quy được nguồn"). Lớp load1 dư có cơ chế chung: load1 là trung bình 1 phút còn dư sau burst trước + tải nền từ nhiều process ngắn hạn (mỗi process chết trước khi đo delta / không lọt top-5 theo %CPU tích lũy) — corroborate bằng load5 của watcher (không bao giờ đủ mở cửa vì RAM, tải yên) và nr_running 1–13 trong các header spike.
- **Caveat đếm (F-156-T9-6):** lệnh chờ của chính T9 (`sleep 3000`, pid 2609) xuất hiện trong **1 dòng** snapshot `ps` của b2-spikes.log (spike 19:49:32Z) ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `grep -c '^=== SPIKE'` = **25**.
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log** — F-150-T9-8 VẪN ĐÓNG.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution (vd spike 9: ffmpeg 101% top dù chết trước delta; spike 25: chrome gpu 72% top dù delta chỉ còn 3). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 22 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 22/25 spike; 3 spike còn lại chỉ quy được lớp load1 dư — giới hạn phương pháp đã biết (process ngắn hạn / tải phân tán), T9 ghi rõ thay vì gộp chung.
- **Delta tick lớn nhất đợt: 103 tick/s** (pid 4101, node tsc, spike 17:40:31Z); ffmpeg 95–102 tick/s; mask_anim 75–86 tick/s; chrome gpu-process 91–100 tick/s; WebKitWebProcess 90 tick/s; MiniBrowser 31 tick/s; blind82-investigate 8–21 tick/s; daemon 13–52 tick/s. (Đợt 155: max 134 tick/s.)
- **testsrc2:** 1/25 spike do testsrc2 geq gây ra (17:50:27Z 1920x1080, top 113%) — cùng họ test render pixelate geq chạy lại mỗi đợt (như đợt 147–155); PID testsrc2 ngắn hạn, thoát bình thường; không process nào kẹt lại. Không mở điều tra thêm (họ F-147/148/149-T9-3 đã ĐÓNG đợt 150).
- **Watcher gap do reboot:** watcher chết theo cả ba reboot; tối đa ~3 lần kiểm (cadence 30 s) bị mất mỗi gap (82 s / 90 s / 54 s). Load1 tại mép gap ≤2,74 (mẫu sampler 18:29:21Z) — nhiều khả năng 0 spike bị mất, nhưng không chứng minh được (ghi rõ, xem F-156-T9-3).

### 2.6 Truy chủ ffmpeg testsrc2 — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này testsrc2 xuất hiện trong 1/25 spike, là **test render pixelate geq trong đợt 156** (T1/T2) — chạy đúng chức năng, thoát bình thường. T9 không truy chủ lại từng PID (không có spike ngoài họ test render + T1 verify + T4 attempt + blind82 + bão reboot + clicktest đóng; không process lạ).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (TRỪ 3 GAP TỔNG 226 S TẠI 3 REBOOT); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ mười liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148–155 giữ nguyên; quyết parent (i) đợt 155 GIỮ NGUYÊN cơ chế (a) armed): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **3.477.000 kB = 3.395,5 MiB = 55,27% guard lúc 18:13:58Z** — xa guard 2.814.456 kB. Số đỉnh đợt 156 chờ T1-157 đối chiếu.
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ mười liên tiếp (147, 148, 149, 150, 151, 152, 153, 154, 155, 156).** Cơ chế tự động armed cả phiên (sampler `round156-t9/sampler.sh`, pid 3708 rồi pid 1892 rồi pid 3019 rồi pid 1924 sau ba reboot, chạy 17:39:56–19:56:47Z, 137 mẫu — trừ 3 gap 82 s / 90 s / 54 s tại 3 reboot, xem §5.1) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→156 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**, **3.211**, **2.779**, **3.477**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 17:39:56–19:56:47Z (137 mẫu, chỉ 3 gap tại 3 reboot rồi khởi động lại bằng tay); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 155 nằm trong dir round155-t9 nên không chặn đợt này (dir mới round156-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-156-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-156-birefnet/out-birefnet-156.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147–155):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-156-T9-3); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-156-T9-2 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra — đợt này T4 có 0 attempt hợp lệ nên điểm (c) không phát sinh). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này BA LẦN: 3 reboot giết sampler, tổng gap 226 s** (đợt 155: gap 61 s; đợt 154: gap 95 s; đợt 153: gap 61 s; đợt 152: gap 71 s; đợt 151: gap 46 s; đợt 149: gap 87 s) — dữ kiện này KHÔNG ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" ở mức tuyệt đối, nhưng tổng gap 226 s / ~7.900 s phiên (~2,9%) là nhỏ và T9 khởi động lại bằng tay kịp thời cả ba lần; T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10. **Bổ sung đợt 156: T5-156 triển khai watcher respawn theo quyết parent (e) đợt 153 (phương án 1 + quy tắc đứng (3)) — cùng họ vấn đề với sampler T9; T5 là chủ quản, T9 chỉ nêu dữ kiện.**
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Phương pháp đếm (ghi rõ, khác đợt 155 ở chỗ có 4 boot):** `journalctl --no-pager | grep -c 'No space left on device'` trên boot đang chạy tại thời điểm đếm; journald chỉ giữ 1 boot (volatile) nên **số cuối của một boot KHÔNG kiểm được sau khi reboot sang boot mới** (cùng giới hạn F-155-T10-1 / F-154-T1-3). Mỗi boot dưới đây ghi rõ: số đếm được lần cuối + thời điểm đếm + ai đếm. **Tổng phiên là CẬN DƯỚI (≥), không phải số đếm đầy đủ.**
- **Journal trên boot #52 (5353ed19): ≥21 dòng** — T9 đếm **2 dòng lúc mở** (~17:40Z: 17:38:45Z + 17:39:55Z); **T5-156 đếm 21 dòng lúc 18:02:36Z** (ghi trong `round156-t5.done`, kèm chú thích "(T9 số chính thức)" — T9 nhận 21 làm số quan sát cuối cho boot này). Từ 17:40Z tới 18:02:36Z tăng 19 dòng — cadence ~72 s/dòng. **Số cuối KHÔNG kiểm được** (journal mất theo reboot 18:26:26Z; từ 18:02:36Z tới reboot còn ~24 phút chưa đếm — T9 KHÔNG cộng số ước vào tổng).
- **Journal trên boot #53 (062850d8): 0 dòng quan sát được** (T9 đếm 0 lúc 18:27Z, journal mới bắt đầu 18:26:26Z, ~1 phút tuổi). Boot chỉ sống 209 s; **số cuối KHÔNG kiểm được** (journal mất theo reboot 18:29:55Z). T9 ghi 0 dòng quan sát được, không claim boot này hoàn toàn không có lỗi.
- **Journal trên boot #54 (447f0efe — số hiệu chờ phán, xem F-156-T9-4): ≥7 dòng** (T9 đếm 7 lúc 18:39:06Z). **Số cuối KHÔNG kiểm được** (journal mất theo reboot 19:04:55Z; từ 18:39Z tới reboot còn ~26 phút chưa đếm — T9 KHÔNG cộng số ước).
- **Journal trên boot #55 (c99a1045 — số hiệu chờ phán): 11 dòng lúc đóng** (T9 đếm 11 lúc 19:56:25Z; dòng cuối 19:52:38Z). Boot này còn sống lúc T9 đóng nên 11 là số đếm tới thời điểm đóng (có thể tăng sau khi T9 đóng — T10 kiểm lại nếu cần).
- **Tổng phiên: ≥39 dòng trên BỐN boot** (≥21 + 0 + ≥7 + 11 — mỗi boot là cận dưới tại thời điểm đếm cuối). Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. **Đây là đợt thứ năm liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng — **ít hơn đợt 155 vì journal của 3 boot cũ mất theo 3 reboot, không phải vì lỗi ít đi**; xem F-156-T9-5).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=0 ×2 lần mở + ở i=2 ×4 lần đóng — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo); **(2) ≥39 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2 — **không thêm được watch nào cho vite mới ngoài 2 watch**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Ba reboot giữa phiên (sampler/watcher chết theo cả ba, khởi động lại bằng tay)

- **Boot lúc mở đợt 156 = 5353ed19-ddcb-46cc-9eca-9c9f86ba9706** (btime **17:19:25Z** theo `/proc/stat` / **17:19:09Z** theo `uptime -s` — chênh 16 s, ghi cả hai; T0-156 xác minh 5 nguồn; số hiệu #52 ỨNG VIÊN — T2-156 đã đóng trước các reboot trong phiên nên số hiệu #52 trở đi chờ T2-157/T10 phán — xem F-156-T9-4).
- **Reboot thứ nhất GIỮA phiên:** sampler cũ (pid 3708) + watcher cũ (pid 3709) chết theo reboot; sleep chờ của T9 (sleep 3000) bị SIGTERM cùng lúc (~18:26Z, exec service restart cùng lúc). Mẫu cuối sampler cũ: **18:25:59Z boot=5353ed19 mem=833.676 bal=6.034.868 (93,7% trần, CHƯA ghim) load1=0,13**. Boot mới **062850d8** (btime **18:26:26Z** stat / **18:26:15Z** uptime -s — chênh 11 s). **Sampler + watcher khởi động lại bằng tay lúc 18:27:21Z** (sampler pid 1892, watcher pid 1893; mẫu đầu boot mới 18:27:21Z mem=1.895.796 bal=4.988.888 swapfree=1.040.588 load1=2,42). **Gap phủ sóng sampler: 82 s** (18:25:59Z → 18:27:21Z). T7-156 NOTES.md gọi boot này là **#53 ỨNG VIÊN** (xác minh 4 nguồn: boot_id + btime + journal 1 boot + wtmp). Tuổi thọ boot #52: btime 17:19:25Z → btime boot mới 18:26:26Z = **4.021 s = 1h07m01s** (stat→stat).
- **Reboot thứ hai GIỮA phiên:** sampler lần 2 (pid 1892) + watcher lần 2 (pid 1893) chết theo reboot; sleep chờ của T9 (sleep 4800) bị SIGTERM chỉ sau 154 s (~18:29–18:30Z). Mẫu cuối boot 062850d8: **18:29:21Z mem=1.703.564 bal=5.137.680 (79,7% trần, CHƯA ghim) load1=2,74**. Boot mới **447f0efe** (btime **18:29:55Z** stat / **18:29:43Z** uptime -s — chênh 12 s). **Sampler + watcher khởi động lại bằng tay lúc 18:30:51Z** (sampler pid 3019, watcher pid 3020; mẫu đầu boot mới 18:30:51Z mem=1.879.804 bal=5.013.656 swapfree=1.040.168 load1=2,69). **Gap phủ sóng sampler: 90 s** (18:29:21Z → 18:30:51Z). **XUNG ĐỘT SỐ HIỆU:** T7-156 NOTES.md gọi boot này là **#54 ỨNG VIÊN**; T4-156 (.done + addendum 18:35:44Z) gọi là **#53** (T4 bỏ qua reboot 062850d8 vì poller T4 thoát 18:13:07Z, trước cả hai reboot). Coordinator đợt 156 nhắn lại nhãn T4 ("#53, boot 447f0efe") NHƯNG đồng thời giao "Mù #85? giao T2-157" — số #85? chỉ khớp nếu 447f0efe = #54 (theo T7: #53 → mù #84?, #54 → mù #85?). **T9 ghi cả hai nhãn, KHÔNG tự quyết số — giao T10-156/parent phán (xem F-156-T9-4).** Tuổi thọ boot 062850d8: btime 18:26:26Z → btime boot mới 18:29:55Z = **209 s (~3,5 phút) — boot cực ngắn**.
- **Reboot thứ ba GIỮA phiên:** sampler lần 3 (pid 3019) + watcher lần 3 (pid 3020) chết theo reboot; sleep chờ của T9 (sleep 4200) bị SIGTERM sau 2.032.976 ms (~19:05Z). Mẫu cuối boot 447f0efe: **19:04:51Z mem=546.688 bal=6.443.824 (GHIM TRẦN, chuỗi 2 episode A) load1=0,01**. Boot mới **c99a1045** (btime **19:04:55Z** stat / **19:04:44Z** uptime -s — chênh 11 s). **Sampler + watcher khởi động lại bằng tay lúc 19:05:45Z** (sampler pid 1924, watcher pid 1925; mẫu đầu boot mới 19:05:45Z mem=1.861.188 bal=5.018.896 swapfree=1.040.612 load1=2,47). **Gap phủ sóng sampler: 54 s** (19:04:51Z → 19:05:45Z). Theo chuỗi T7, boot này là **#55 ỨNG VIÊN**. Tuổi thọ boot 447f0efe: btime 18:29:55Z → btime boot mới 19:04:55Z = **2.100 s (35 phút)**.
- **Dấu hiệu đồng hồ tại các reboot (ghi rõ cho T1/T2/T7):** không có mẫu sampler nào ghi SAU btime boot mới trong đợt này (khác #50 đợt 155: overlap ≥34 s). Các timestamp còn lại thứ tự nhất quán. T9 không phán tranh chấp clock T1–T2.
- **Mù kèm các reboot (ghi lại để T10 phán, T9 không tự giao):** theo chuỗi T7 — 062850d8 (#53) → mù #84?; 447f0efe (#54) → mù #85? (coordinator đã giao #85? cho T2-157); c99a1045 (#55) → mù #86?. Nếu theo nhãn T4 (447f0efe = #53) thì đánh số mù dịch đi 1 — **T10/parent quyết số hiệu trước, rồi mới giao mù**.
- Các cờ .done lúc T9 đóng (~20:00Z): t0, t1, t2, t4, t5, t6, t7, t8 (8/9 — T9 đóng ngay sau khi viết LIMITS này, thành 9/9).

### 5.2 T5-156 — POSTBOOT_PASS cho #52 CÓ; #51 KHÔNG CÓ; #53/#54/#55 chưa có cờ T5 (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **POSTBOOT_PASS cho boot #52 CÓ (T5-156, 18:00:10Z — boot+41m01s, repair-sớm-quyết-h, poll=1; EARLY-REPAIR kích 17:45:55Z; install 11 gói, dpkg 2 → 795 dòng, cache 110, lists 75, GST 269; kiểm chứng độc lập 11/11 gói + 5/5 lib + GST PASS)** — T4-156 §poll ghi gate0=T5 từ poll #1.
- **POSTBOOT_PASS cho boot #51 KHÔNG CÓ, KHÔNG BÙ ĐƯỢC** (boot sống 13m40s ngoài phiên; journal + dpkg.log đã mất) — theo `round156-t5.done`.
- **Boot #53/#54/#55 (062850d8 / 447f0efe / c99a1045): CHƯA CÓ cờ T5 mới** (T5-156 đã đóng 18:06Z, trước cả ba reboot; T5-156 .done ghi watcher-156 pid 4871 khởi động lại bằng tay 17:41:21Z, đang poll đều tới 20:30:00Z — watcher T5 sống qua các reboot? T5 là chủ quản, T9 chỉ ghi lại). **POSTBOOT_PASS cho 3 boot mới — giao T5-157.**
- **Watcher respawn:** T5-156 triển khai theo quyết parent (e) đợt 153 (phương án 1 user systemd unit + quy tắc đứng (3)) — marker persistence SỐNG QUA 4 reboot #49/#50/#51/#52 (ghi 11:39:40Z boot #48). Sampler T9 vẫn khởi động lại bằng tay sau reboot (tổng gap 226 s đợt này) — cùng họ vấn đề, chưa có cơ chế tự hồi phục cho sampler.

### 5.3 Reboot #51 (trước phiên) — quyết parent đợt 155 (d) XÁC NHẬN (T9 chỉ ghi lại để đối chiếu)

- Quyết parent đợt 155 (d): reboot #50 (btime 15:04:07Z, boot d849728b) + reboot #51 (btime 17:05:29Z, boot c931d371) XÁC NHẬN cả hai số hiệu. Mù #82? (#50) + mù #83? (#51) giao T2-156 (T2-156 đã đóng — xem LIMITS T2-156; T2-156 không nhắc tới các boot trong phiên 156 vì đóng trước). CERT/FULL chính thức sau đợt 155: **76/91**; chuỗi đóng hoàn toàn liên tục **12**; #77? VẪN MỞ (chặn CERT77/FULL92). T9 chỉ ghi lại; T2 là chủ quản.

## 6. Sai số của chính T9 (ghi rõ)

- **F-156-T9-1 — Headroom 0 → 2: LẦN ĐẦU KHÁC 0 KỂ TỪ ĐỢT 151, NHƯNG VẪN THỰC TẾ BẰNG 0.** 2 đã xác nhận bằng 4 lần đo đóng liên tiếp (probe 3/4/5/6 đều 2, exit 0, không lỗi) + 2 lần đo mở đều 0 — không phải số đo lẻ hay lỗi probe. Giải thích thận trọng: nhiều khả năng 1–2 watch holder ngắn hạn chết qua ba reboot trong phiên; KHÔNG phải xu hướng hồi phục (tiền lệ đợt 155: reboot không khôi phục headroom). Tỉ lệ/vite 0,001 — một vite mới (~1.578 watch) vẫn không khởi động được. Vẫn dưới ngưỡng ~1.800 lần thứ mười sáu liên tiếp; quyết "chỉ theo dõi" (g) + quyết (h) đợt 155 vẫn đứng; T9 không tự đổi ngưỡng hay yêu cầu user hành động. Trần 63.747 không đổi trong phiên.
- **F-156-T9-2 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ mười liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-156-T9-3 — Khoảng trống lấy mẫu 60 giây + 3 gap do reboot (cùng lớp F-148–F-155-T9-3):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Thêm: **3 gap 82 s / 90 s / 54 s tại 3 reboot (tổng 226 s, ~2,9% phiên)** là khoảng trống thứ hai — một lần vượt guard trong các gap đó cũng không được quan sát (khả năng thấp: RAM tại mép gap 833.676–1.895.796 kB, đều xa guard; balloon tại mép gap 4.988.888–6.034.868 kB, chưa ghim). Watcher B2 cũng mất tối đa ~3 lần kiểm mỗi gap (cadence 30 s) — nhiều khả năng 0 spike bị mất (load1 tại mép gap ≤2,74), nhưng không chứng minh được.
- **F-156-T9-4 — XUNG ĐỘT SỐ HIỆU REBOOT (mới, giao T10/parent phán — T9 KHÔNG tự quyết):** T7-156 NOTES.md: 062850d8 = #53, 447f0efe = #54, c99a1045 = #55 (theo chuỗi #52 = 5353ed19 lúc mở). T4-156 (.done + addendum 18:35:44Z): 447f0efe = #53 (T4 bỏ qua reboot 062850d8 vì poller thoát 18:13:07Z trước cả hai reboot). Coordinator nhắn lại nhãn T4 nhưng giao mù #85? cho T2-157 (chỉ khớp chuỗi T7). T2-156 đã đóng trước cả ba reboot nên không xác minh được số hiệu mới. **Hệ quả:** mọi số hiệu #53/#54/#55 và mù #84?/#85?/#86? trong LIMITS này đều là ỨNG VIÊN theo chuỗi T7; nếu parent phán theo nhãn T4 thì toàn bộ dịch đi 1 (447f0efe = #53 → mù #84?; c99a1045 = #54 → mù #85?). T9 đã ghi rõ cả hai nhãn ở §5.1 để T10 đối chiếu; T9 không giao mù (chỉ ghi lại giao #85? của coordinator).
- **F-156-T9-5 — ENOSPC: số cuối của 3 boot cũ KHÔNG kiểm được (cùng lớp F-155-T10-1 / F-154-T1-3):** journald volatile — journal boot #52 mất theo reboot 18:26:26Z, boot #53 mất theo reboot 18:29:55Z, boot #54 mất theo reboot 19:04:55Z. Tổng phiên ≥39 là CẬN DƯỚI (mỗi boot lấy số đếm cuối quan sát được: #52 ≥21 lúc 18:02:36Z do T5 đếm; #53 0 lúc 18:27Z; #54 ≥7 lúc 18:39:06Z; #55 11 lúc đóng). Số 21 của boot #52 là do T5-156 đếm (ghi trong round156-t5.done kèm chú thích "(T9 số chính thức)") — T9 nhận làm số quan sát cuối, không tự đếm lại được. Từ lần đếm cuối tới reboot mỗi boot còn ~24–26 phút chưa đếm; T9 KHÔNG cộng số ước (theo cadence ~52–75 s/dòng sẽ thêm ~20 dòng/boot) vào tổng.
- **F-156-T9-6 — Lệnh chờ của chính T9 lọt snapshot B2 (cùng họ F-155-T9-5), BẮT ĐƯỢC VÀ GHI RÕ TRƯỚC KHI ĐÓNG (không ảnh hưởng số cuối):** `sleep 3000` (pid 2609) của T9 xuất hiện trong **1 dòng** snapshot `ps` của b2-spikes.log (spike 19:49:32Z) ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `^=== SPIKE` = **25** ngay từ đầu. **Fix (n) (loại `ps` của watcher) vẫn đứng:** lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log. T9 đợt sau nên tránh để lệnh chờ chứa chuỗi trùng mẫu đếm và tránh sleep dài trong lúc watcher chạy (dùng cron/scheduler chờ thay cho sleep nếu có thể). **Bổ sung:** sampler/watcher chết theo cả ba reboot (gap 82/90/54 s); T9 phát hiện qua SIGTERM và khởi động lại bằng tay kịp thời cả ba lần (gap nhỏ nhất 54 s); dữ kiện này để parent/T10 xem lại quyết (q) "không cần cơ chế tự hồi phục lúc này" — T9 không đề xuất đổi.
- **F-156-T9-7 — Script thống kê `stats-appendix.py` ĐÃ SỬA theo F-155-T9-4 (tiêu đề đường dẫn động theo argv):** T9-156 sửa dòng tiêu đề thành đường dẫn động trước khi chạy; mọi số trong LIMITS này đều từ script chạy trên log ĐÃ ĐÓNG BĂNG `round156-t9/ram-sampler-FROZEN.log` (137 mẫu, đóng băng 19:57Z — mẫu cuối 19:56:47Z). Chuỗi ghim đã kiểm chứng thủ công từ bảng phụ lục (dòng chuỗi 1/2 trên boot 447f0efe + chuỗi 3/4 trên boot c99a1045 = 9+10+3+8 = 30). Phụ lục A dưới đây do script sinh ra từ log đóng băng.

Thống kê: samples: 137 (47 mau boot 5353ed19 + 3 mau boot 062850d8 + 35 mau boot 447f0efe + 52 mau boot c99a1045); mem min: 394,324 kB (385.1 MiB) luc 19:52:47Z; mem max: 3,477,000 kB (3395.5 MiB = 55.27% guard) luc 18:13:58Z; mem mean: 1264231 kB (1234.6 MiB); count >=1024 MiB (gate A): 72/137; count >= guard 6144 MiB: 0/137; balloon frozen 6,443,824: 30/137 (chuoi 1: 18:43:51Z–18:51:51Z n=9; chuoi 2: 18:55:51Z–19:04:51Z n=10; chuoi 3: 19:21:46Z–19:23:46Z n=3; chuoi 4: 19:26:46Z–19:33:46Z n=8); balloon min: 3,338,776 kB luc 18:13:58Z; balloon max: 6,443,824 kB; load1 max (sampler): 8.45 luc 17:43:56Z; load1 >=3.0 samples: 15/137; max inter-sample gap: 90 s (18:29:21Z -> 18:30:51Z, 062850d8 -> 447f0efe); gaps >90s: khong co

## Phụ lục A — Bảng sampler đầy đủ (137 mau: 47 mau boot 5353ed19 + 3 mau boot 062850d8 + 35 mau boot 447f0efe + 52 mau boot c99a1045; khong gap >90 s)

(File gốc: `hidden_files/round156-t9/ram-sampler.log` (argv: /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round156-t9/ram-sampler-FROZEN.log) — bảng dưới đây trích đúng file đó.)

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-20T17:39:56Z | 5353ed19 | 1,245,252 | 1216.1 | 19.79% | 5,626,400 | 787,848 | 3.43 |
| 2 | 2026-11-20T17:40:56Z | 5353ed19 | 1,597,280 | 1559.8 | 25.39% | 4,103,608 | 725,620 | 2.57 |
| 3 | 2026-11-20T17:41:56Z | 5353ed19 | 2,647,252 | 2585.2 | 42.08% | 3,644,856 | 716,540 | 3.74 |
| 4 | 2026-11-20T17:42:56Z | 5353ed19 | 2,413,116 | 2356.6 | 38.36% | 3,918,856 | 726,540 | 6.90 |
| 5 | 2026-11-20T17:43:56Z | 5353ed19 | 2,502,080 | 2443.4 | 39.77% | 3,901,308 | 727,080 | 8.45 |
| 6 | 2026-11-20T17:44:56Z | 5353ed19 | 2,666,244 | 2603.8 | 42.38% | 3,714,896 | 723,460 | 7.08 |
| 7 | 2026-11-20T17:45:56Z | 5353ed19 | 2,402,252 | 2345.9 | 38.18% | 3,994,712 | 724,616 | 5.21 |
| 8 | 2026-11-20T17:46:57Z | 5353ed19 | 2,362,284 | 2306.9 | 37.55% | 3,953,440 | 726,672 | 2.77 |
| 9 | 2026-11-20T17:47:57Z | 5353ed19 | 2,027,100 | 1979.6 | 32.22% | 4,195,516 | 727,324 | 1.57 |
| 10 | 2026-11-20T17:48:57Z | 5353ed19 | 1,843,644 | 1800.4 | 29.30% | 4,422,392 | 739,540 | 1.70 |
| 11 | 2026-11-20T17:49:57Z | 5353ed19 | 1,784,828 | 1743.0 | 28.37% | 4,440,596 | 735,196 | 0.76 |
| 12 | 2026-11-20T17:50:57Z | 5353ed19 | 1,569,316 | 1532.5 | 24.94% | 4,578,616 | 732,940 | 6.45 |
| 13 | 2026-11-20T17:51:58Z | 5353ed19 | 1,659,716 | 1620.8 | 26.38% | 4,771,880 | 732,200 | 6.64 |
| 14 | 2026-11-20T17:52:58Z | 5353ed19 | 1,686,944 | 1647.4 | 26.81% | 4,713,288 | 733,172 | 3.36 |
| 15 | 2026-11-20T17:53:58Z | 5353ed19 | 1,473,228 | 1438.7 | 23.42% | 4,910,032 | 729,520 | 1.60 |
| 16 | 2026-11-20T17:54:58Z | 5353ed19 | 1,349,280 | 1317.7 | 21.45% | 5,089,328 | 728,320 | 1.37 |
| 17 | 2026-11-20T17:55:58Z | 5353ed19 | 1,436,024 | 1402.4 | 22.82% | 4,938,356 | 718,432 | 0.99 |
| 18 | 2026-11-20T17:56:58Z | 5353ed19 | 1,660,664 | 1621.7 | 26.40% | 5,081,756 | 719,276 | 0.65 |
| 19 | 2026-11-20T17:57:58Z | 5353ed19 | 1,470,172 | 1435.7 | 23.37% | 5,277,576 | 720,076 | 0.55 |
| 20 | 2026-11-20T17:58:58Z | 5353ed19 | 1,318,136 | 1287.2 | 20.95% | 5,444,068 | 730,644 | 1.38 |
| 21 | 2026-11-20T17:59:58Z | 5353ed19 | 1,168,948 | 1141.6 | 18.58% | 5,609,772 | 733,308 | 1.02 |
| 22 | 2026-11-20T18:00:58Z | 5353ed19 | 1,045,616 | 1021.1 | 16.62% | 5,758,168 | 735,728 | 0.90 |
| 23 | 2026-11-20T18:01:58Z | 5353ed19 | 1,194,752 | 1166.8 | 18.99% | 5,644,600 | 727,332 | 1.73 |
| 24 | 2026-11-20T18:02:58Z | 5353ed19 | 1,595,092 | 1557.7 | 25.35% | 4,949,508 | 676,352 | 1.91 |
| 25 | 2026-11-20T18:03:58Z | 5353ed19 | 1,706,504 | 1666.5 | 27.12% | 4,234,712 | 671,268 | 2.22 |
| 26 | 2026-11-20T18:04:58Z | 5353ed19 | 2,039,608 | 1991.8 | 32.42% | 4,437,076 | 664,016 | 1.52 |
| 27 | 2026-11-20T18:05:58Z | 5353ed19 | 1,882,236 | 1838.1 | 29.92% | 4,679,400 | 671,076 | 0.64 |
| 28 | 2026-11-20T18:06:58Z | 5353ed19 | 2,428,464 | 2371.5 | 38.60% | 4,170,692 | 676,612 | 1.27 |
| 29 | 2026-11-20T18:07:58Z | 5353ed19 | 2,306,160 | 2252.1 | 36.66% | 3,670,684 | 681,964 | 3.47 |
| 30 | 2026-11-20T18:08:58Z | 5353ed19 | 2,166,532 | 2115.8 | 34.44% | 3,923,872 | 683,560 | 1.53 |
| 31 | 2026-11-20T18:09:58Z | 5353ed19 | 2,656,544 | 2594.3 | 42.22% | 3,635,024 | 683,788 | 0.86 |
| 32 | 2026-11-20T18:10:58Z | 5353ed19 | 2,445,100 | 2387.8 | 38.86% | 3,535,128 | 684,160 | 1.93 |
| 33 | 2026-11-20T18:11:58Z | 5353ed19 | 2,228,472 | 2176.2 | 35.42% | 3,803,456 | 685,140 | 1.85 |
| 34 | 2026-11-20T18:12:58Z | 5353ed19 | 3,167,772 | 3093.5 | 50.35% | 3,409,472 | 685,508 | 1.24 |
| 35 | 2026-11-20T18:13:58Z | 5353ed19 | 3,477,000 | 3395.5 | 55.27% | 3,338,776 | 686,208 | 0.71 |
| 36 | 2026-11-20T18:14:58Z | 5353ed19 | 3,114,368 | 3041.4 | 49.50% | 3,699,100 | 687,572 | 0.42 |
| 37 | 2026-11-20T18:15:58Z | 5353ed19 | 2,789,996 | 2724.6 | 44.35% | 4,028,256 | 688,832 | 0.36 |
| 38 | 2026-11-20T18:16:58Z | 5353ed19 | 2,490,212 | 2431.8 | 39.58% | 4,326,036 | 690,016 | 0.35 |
| 39 | 2026-11-20T18:17:58Z | 5353ed19 | 2,213,308 | 2161.4 | 35.18% | 4,596,900 | 690,216 | 0.34 |
| 40 | 2026-11-20T18:18:58Z | 5353ed19 | 1,979,436 | 1933.0 | 31.46% | 4,842,552 | 689,200 | 0.18 |
| 41 | 2026-11-20T18:19:59Z | 5353ed19 | 1,721,880 | 1681.5 | 27.37% | 5,066,360 | 691,460 | 0.11 |
| 42 | 2026-11-20T18:20:59Z | 5353ed19 | 1,581,760 | 1544.7 | 25.14% | 5,268,460 | 691,580 | 0.29 |
| 43 | 2026-11-20T18:21:59Z | 5353ed19 | 1,382,488 | 1350.1 | 21.97% | 5,453,088 | 692,256 | 0.30 |
| 44 | 2026-11-20T18:22:59Z | 5353ed19 | 1,224,100 | 1195.4 | 19.46% | 5,619,824 | 692,476 | 0.15 |
| 45 | 2026-11-20T18:23:59Z | 5353ed19 | 1,078,616 | 1053.3 | 17.14% | 5,773,464 | 689,204 | 0.11 |
| 46 | 2026-11-20T18:24:59Z | 5353ed19 | 956,240 | 933.8 | 15.20% | 5,909,940 | 685,676 | 0.10 |
| 47 | 2026-11-20T18:25:59Z | 5353ed19 | 833,676 | 814.1 | 13.25% | 6,034,868 | 684,756 | 0.13 |
| — | — | — | — | — | — | — | — | — |
| 48 | 2026-11-20T18:27:21Z | 062850d8 | 1,895,796 | 1851.4 | 30.13% | 4,988,888 | 1,040,588 | 2.42 |
| 49 | 2026-11-20T18:28:21Z | 062850d8 | 1,631,732 | 1593.5 | 25.94% | 5,144,772 | 885,708 | 2.66 |
| 50 | 2026-11-20T18:29:21Z | 062850d8 | 1,703,564 | 1663.6 | 27.08% | 5,137,680 | 788,404 | 2.74 |
| — | — | — | — | — | — | — | — | — |
| 51 | 2026-11-20T18:30:51Z | 447f0efe | 1,879,804 | 1835.7 | 29.88% | 5,013,656 | 1,040,168 | 2.69 |
| 52 | 2026-11-20T18:31:51Z | 447f0efe | 1,703,152 | 1663.2 | 27.07% | 5,172,080 | 1,009,736 | 1.86 |
| 53 | 2026-11-20T18:32:51Z | 447f0efe | 1,521,396 | 1485.7 | 24.18% | 5,368,356 | 1,003,820 | 0.74 |
| 54 | 2026-11-20T18:33:51Z | 447f0efe | 1,366,956 | 1334.9 | 21.73% | 5,548,576 | 999,668 | 0.46 |
| 55 | 2026-11-20T18:34:51Z | 447f0efe | 1,181,940 | 1154.2 | 18.79% | 5,712,140 | 981,268 | 0.20 |
| 56 | 2026-11-20T18:35:51Z | 447f0efe | 1,139,692 | 1113.0 | 18.11% | 5,845,368 | 817,088 | 1.00 |
| 57 | 2026-11-20T18:36:51Z | 447f0efe | 1,325,856 | 1294.8 | 21.07% | 5,684,932 | 759,000 | 0.47 |
| 58 | 2026-11-20T18:37:51Z | 447f0efe | 1,117,300 | 1091.1 | 17.76% | 5,839,944 | 757,488 | 0.42 |
| 59 | 2026-11-20T18:38:51Z | 447f0efe | 986,160 | 963.0 | 15.67% | 5,975,148 | 747,644 | 0.51 |
| 60 | 2026-11-20T18:39:51Z | 447f0efe | 885,540 | 864.8 | 14.08% | 6,100,468 | 748,236 | 0.25 |
| 61 | 2026-11-20T18:40:51Z | 447f0efe | 779,020 | 760.8 | 12.38% | 6,213,324 | 747,496 | 0.13 |
| 62 | 2026-11-20T18:41:51Z | 447f0efe | 650,560 | 635.3 | 10.34% | 6,318,004 | 745,992 | 0.05 |
| 63 | 2026-11-20T18:42:51Z | 447f0efe | 601,072 | 587.0 | 9.55% | 6,413,912 | 744,720 | 0.27 |
| 64 | 2026-11-20T18:43:51Z | 447f0efe | 534,656 | 522.1 | 8.50% | 6,443,824 | 745,156 | 0.19 |
| 65 | 2026-11-20T18:44:51Z | 447f0efe | 534,356 | 521.8 | 8.49% | 6,443,824 | 745,248 | 0.10 |
| 66 | 2026-11-20T18:45:51Z | 447f0efe | 533,288 | 520.8 | 8.48% | 6,443,824 | 745,240 | 0.15 |
| 67 | 2026-11-20T18:46:51Z | 447f0efe | 531,048 | 518.6 | 8.44% | 6,443,824 | 745,308 | 0.20 |
| 68 | 2026-11-20T18:47:51Z | 447f0efe | 539,008 | 526.4 | 8.57% | 6,443,824 | 745,740 | 0.07 |
| 69 | 2026-11-20T18:48:51Z | 447f0efe | 545,640 | 532.9 | 8.67% | 6,443,824 | 745,344 | 0.25 |
| 70 | 2026-11-20T18:49:51Z | 447f0efe | 543,144 | 530.4 | 8.63% | 6,443,824 | 745,456 | 0.09 |
| 71 | 2026-11-20T18:50:51Z | 447f0efe | 525,312 | 513.0 | 8.35% | 6,443,824 | 749,556 | 0.03 |
| 72 | 2026-11-20T18:51:51Z | 447f0efe | 612,220 | 597.9 | 9.73% | 6,443,824 | 701,724 | 0.71 |
| 73 | 2026-11-20T18:52:51Z | 447f0efe | 904,420 | 883.2 | 14.38% | 6,133,096 | 653,396 | 0.41 |
| 74 | 2026-11-20T18:53:51Z | 447f0efe | 785,260 | 766.9 | 12.48% | 6,248,024 | 654,248 | 0.15 |
| 75 | 2026-11-20T18:54:51Z | 447f0efe | 712,252 | 695.6 | 11.32% | 6,351,844 | 650,844 | 0.13 |
| 76 | 2026-11-20T18:55:51Z | 447f0efe | 632,352 | 617.5 | 10.05% | 6,443,824 | 649,168 | 0.05 |
| 77 | 2026-11-20T18:56:51Z | 447f0efe | 594,608 | 580.7 | 9.45% | 6,443,824 | 652,944 | 0.06 |
| 78 | 2026-11-20T18:57:51Z | 447f0efe | 577,444 | 563.9 | 9.18% | 6,443,824 | 652,624 | 0.14 |
| 79 | 2026-11-20T18:58:51Z | 447f0efe | 558,652 | 545.6 | 8.88% | 6,443,824 | 652,684 | 0.05 |
| 80 | 2026-11-20T18:59:51Z | 447f0efe | 586,804 | 573.1 | 9.33% | 6,443,824 | 655,104 | 0.18 |
| 81 | 2026-11-20T19:00:51Z | 447f0efe | 560,564 | 547.4 | 8.91% | 6,443,824 | 668,548 | 0.13 |
| 82 | 2026-11-20T19:01:51Z | 447f0efe | 622,400 | 607.8 | 9.89% | 6,443,824 | 665,336 | 0.04 |
| 83 | 2026-11-20T19:02:51Z | 447f0efe | 588,996 | 575.2 | 9.36% | 6,443,824 | 668,516 | 0.06 |
| 84 | 2026-11-20T19:03:51Z | 447f0efe | 568,820 | 555.5 | 9.04% | 6,443,824 | 669,988 | 0.02 |
| 85 | 2026-11-20T19:04:51Z | 447f0efe | 546,688 | 533.9 | 8.69% | 6,443,824 | 670,056 | 0.01 |
| — | — | — | — | — | — | — | — | — |
| 86 | 2026-11-20T19:05:45Z | c99a1045 | 1,861,188 | 1817.6 | 29.58% | 5,018,896 | 1,040,612 | 2.47 |
| 87 | 2026-11-20T19:06:45Z | c99a1045 | 2,104,260 | 2054.9 | 33.45% | 4,711,112 | 990,972 | 1.64 |
| 88 | 2026-11-20T19:07:45Z | c99a1045 | 1,872,232 | 1828.4 | 29.76% | 4,943,048 | 943,856 | 1.42 |
| 89 | 2026-11-20T19:08:45Z | c99a1045 | 2,141,944 | 2091.7 | 34.05% | 4,765,220 | 815,276 | 2.10 |
| 90 | 2026-11-20T19:09:45Z | c99a1045 | 1,989,772 | 1943.1 | 31.63% | 4,920,660 | 816,424 | 1.78 |
| 91 | 2026-11-20T19:10:45Z | c99a1045 | 1,810,872 | 1768.4 | 28.78% | 5,133,272 | 788,060 | 2.08 |
| 92 | 2026-11-20T19:11:45Z | c99a1045 | 1,658,632 | 1619.8 | 26.36% | 5,337,232 | 788,884 | 0.76 |
| 93 | 2026-11-20T19:12:45Z | c99a1045 | 1,466,528 | 1432.2 | 23.31% | 5,524,928 | 781,176 | 0.28 |
| 94 | 2026-11-20T19:13:45Z | c99a1045 | 1,287,120 | 1257.0 | 20.46% | 5,695,028 | 781,420 | 0.10 |
| 95 | 2026-11-20T19:14:45Z | c99a1045 | 1,159,940 | 1132.8 | 18.44% | 5,849,332 | 782,124 | 0.04 |
| 96 | 2026-11-20T19:15:45Z | c99a1045 | 1,179,124 | 1151.5 | 18.74% | 5,747,840 | 780,376 | 0.06 |
| 97 | 2026-11-20T19:16:45Z | c99a1045 | 1,065,704 | 1040.7 | 16.94% | 5,896,336 | 780,444 | 0.12 |
| 98 | 2026-11-20T19:17:46Z | c99a1045 | 970,972 | 948.2 | 15.43% | 6,027,896 | 776,532 | 0.04 |
| 99 | 2026-11-20T19:18:46Z | c99a1045 | 836,992 | 817.4 | 13.30% | 6,151,360 | 773,840 | 0.05 |
| 100 | 2026-11-20T19:19:46Z | c99a1045 | 757,120 | 739.4 | 12.03% | 6,264,264 | 767,564 | 0.09 |
| 101 | 2026-11-20T19:20:46Z | c99a1045 | 665,584 | 650.0 | 10.58% | 6,365,436 | 746,204 | 0.15 |
| 102 | 2026-11-20T19:21:46Z | c99a1045 | 595,264 | 581.3 | 9.46% | 6,443,824 | 726,648 | 0.05 |
| 103 | 2026-11-20T19:22:46Z | c99a1045 | 619,344 | 604.8 | 9.84% | 6,443,824 | 722,472 | 0.08 |
| 104 | 2026-11-20T19:23:46Z | c99a1045 | 562,220 | 549.0 | 8.94% | 6,443,824 | 716,968 | 0.03 |
| 105 | 2026-11-20T19:24:46Z | c99a1045 | 830,772 | 811.3 | 13.20% | 6,247,216 | 691,924 | 0.73 |
| 106 | 2026-11-20T19:25:46Z | c99a1045 | 701,468 | 685.0 | 11.15% | 6,356,328 | 690,728 | 0.37 |
| 107 | 2026-11-20T19:26:46Z | c99a1045 | 615,496 | 601.1 | 9.78% | 6,443,824 | 688,132 | 0.20 |
| 108 | 2026-11-20T19:27:46Z | c99a1045 | 623,160 | 608.6 | 9.90% | 6,443,824 | 687,984 | 0.07 |
| 109 | 2026-11-20T19:28:46Z | c99a1045 | 597,816 | 583.8 | 9.50% | 6,443,824 | 688,040 | 0.11 |
| 110 | 2026-11-20T19:29:46Z | c99a1045 | 573,324 | 559.9 | 9.11% | 6,443,824 | 688,672 | 0.04 |
| 111 | 2026-11-20T19:30:46Z | c99a1045 | 593,048 | 579.1 | 9.43% | 6,443,824 | 690,056 | 0.06 |
| 112 | 2026-11-20T19:31:46Z | c99a1045 | 556,372 | 543.3 | 8.84% | 6,443,824 | 691,080 | 0.09 |
| 113 | 2026-11-20T19:32:46Z | c99a1045 | 577,092 | 563.6 | 9.17% | 6,443,824 | 691,528 | 0.03 |
| 114 | 2026-11-20T19:33:46Z | c99a1045 | 582,836 | 569.2 | 9.26% | 6,443,824 | 691,852 | 0.23 |
| 115 | 2026-11-20T19:34:46Z | c99a1045 | 773,020 | 754.9 | 12.29% | 5,526,320 | 619,060 | 1.21 |
| 116 | 2026-11-20T19:35:46Z | c99a1045 | 767,240 | 749.3 | 12.19% | 5,542,936 | 629,064 | 0.95 |
| 117 | 2026-11-20T19:36:46Z | c99a1045 | 555,900 | 542.9 | 8.84% | 5,644,112 | 621,492 | 1.85 |
| 118 | 2026-11-20T19:37:46Z | c99a1045 | 1,479,116 | 1444.4 | 23.51% | 5,446,212 | 628,712 | 1.11 |
| 119 | 2026-11-20T19:38:46Z | c99a1045 | 793,384 | 774.8 | 12.61% | 5,581,916 | 626,384 | 1.30 |
| 120 | 2026-11-20T19:39:46Z | c99a1045 | 631,872 | 617.1 | 10.04% | 5,707,996 | 627,092 | 1.26 |
| 121 | 2026-11-20T19:40:46Z | c99a1045 | 593,436 | 579.5 | 9.43% | 5,799,668 | 621,056 | 1.97 |
| 122 | 2026-11-20T19:41:46Z | c99a1045 | 1,301,004 | 1270.5 | 20.68% | 5,685,696 | 619,872 | 1.94 |
| 123 | 2026-11-20T19:42:46Z | c99a1045 | 866,508 | 846.2 | 13.77% | 5,517,416 | 621,588 | 1.50 |
| 124 | 2026-11-20T19:43:46Z | c99a1045 | 839,988 | 820.3 | 13.35% | 5,630,448 | 622,428 | 1.29 |
| 125 | 2026-11-20T19:44:46Z | c99a1045 | 755,272 | 737.6 | 12.00% | 5,743,976 | 624,312 | 0.55 |
| 126 | 2026-11-20T19:45:46Z | c99a1045 | 1,146,468 | 1119.6 | 18.22% | 5,848,492 | 624,744 | 0.28 |
| 127 | 2026-11-20T19:46:46Z | c99a1045 | 679,108 | 663.2 | 10.79% | 5,539,712 | 617,716 | 1.04 |
| 128 | 2026-11-20T19:47:46Z | c99a1045 | 822,536 | 803.3 | 13.07% | 5,370,164 | 618,364 | 4.08 |
| 129 | 2026-11-20T19:48:47Z | c99a1045 | 563,244 | 550.0 | 8.95% | 5,491,076 | 622,104 | 4.62 |
| 130 | 2026-11-20T19:49:47Z | c99a1045 | 703,260 | 686.8 | 11.18% | 5,621,788 | 618,124 | 3.94 |
| 131 | 2026-11-20T19:50:47Z | c99a1045 | 452,100 | 441.5 | 7.19% | 5,724,496 | 612,564 | 4.47 |
| 132 | 2026-11-20T19:51:47Z | c99a1045 | 506,380 | 494.5 | 8.05% | 5,824,416 | 616,168 | 3.55 |
| 133 | 2026-11-20T19:52:47Z | c99a1045 | 394,324 | 385.1 | 6.27% | 5,924,308 | 617,532 | 2.24 |
| 134 | 2026-11-20T19:53:47Z | c99a1045 | 1,333,356 | 1302.1 | 21.19% | 5,694,088 | 605,876 | 2.17 |
| 135 | 2026-11-20T19:54:47Z | c99a1045 | 1,068,596 | 1043.6 | 16.98% | 5,847,652 | 619,224 | 1.83 |
| 136 | 2026-11-20T19:55:47Z | c99a1045 | 996,108 | 972.8 | 15.83% | 5,982,284 | 621,888 | 2.27 |
| 137 | 2026-11-20T19:56:47Z | c99a1045 | 824,008 | 804.7 | 13.10% | 6,101,600 | 626,304 | 2.89 |
