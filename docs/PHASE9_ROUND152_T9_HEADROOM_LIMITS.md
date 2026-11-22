# LIMITS — Phase 9 đợt 152, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ sáu liên tiếp; headroom 82 → 0 — LẦN ĐẦU BẰNG 0, có lỗi ENOSPC thật trong journal; balloon GHIM TRẦN 27/124 mẫu, 5 chuỗi, 2 boot; reboot #44 giữa phiên; #22 CÓ lượt hợp lệ #20)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 82/82 (05:39:00Z, boot 18e179e0) → đóng 0/0/0 (07:42:43Z ×2 + 07:43:11Z xác nhận, boot c741f5e6)** — giảm −82 trong phiên, qua reboot #44; **dưới ngưỡng < ~1.800 lần thứ mười hai liên tiếp**; tỉ lệ/vite **0,052 → 0** — **LẦN ĐẦU BẰNG 0 từ trước tới nay** (151: 0,057 lúc đóng; 150: 0,20). Quyết parent (g) đợt 151 "vẫn chỉ theo dõi" đứng — T9 chỉ theo dõi, không báo riêng, NHƯNG ghi rõ dữ kiện mới: **bảng watch đầy hẳn (63.747/63.747) + journal có 35 dòng lỗi ENOSPC thật** của systemd (xem §1, §4). Xem §1.
- **Balloon GHIM TRẦN ĐỢT MỚI — 27/124 mẫu, 5 chuỗi, HAI boot:** boot 18e179e0 chuỗi 1 (06:43:21–06:46:21Z, 4 mẫu) + chuỗi 2 (06:50:21–07:01:21Z, 12 mẫu, 11 phút); boot c741f5e6 (sau reboot #44) chuỗi 3 (07:21:33–07:24:33Z, 4 mẫu) + chuỗi 4 (07:32:33Z, 1 mẫu) + chuỗi 5 (07:36:33–07:41:33Z, 6 mẫu). **Cả 5 chuỗi đều quan sát được điểm đứt** (khác đợt 151: chạm cuối còn mở lúc đóng). **Phán theo quy tắc quyết (e): đợt 152 là đợt ghim MỚI, không nối đợt 151** (cách đợt 151 một reboot #43 + xả sâu tới 2,61M kB + ~1h22m không ghim) — xem §2.2. T10 xác nhận cách đếm trong đợt (1 episode hay 5 chuỗi).
- **Chuỗi ghim đợt 151 trên fad2aab9 ĐÃ KẾT THÚC — theo reboot #43** (btime 05:20:57Z, trước phiên): mẫu chạm cuối 04:52:19Z còn mở lúc T9-151 đóng; điểm đứt nằm trong khoảng mù 04:52:19Z–05:20:57Z (không có sampler phủ sóng — giao quyết (e) đợt 151). Xem §2.2, §5.
- **RAM:** sampler **124 mẫu, 05:39:17–07:42:34Z, HAI boot** (86 mẫu boot 18e179e0 + 38 mẫu boot c741f5e6; gap 71 s tại reboot #44). Min **474.688 kB (463,6 MiB) lúc 06:45:21Z** (trong lúc ghim); max **3.964.468 kB (3.871,6 MiB = 63,01% guard) lúc 05:40:17Z** — **cao nhất kể từ đợt 146**; mean 1.297.996 kB. Gate A ≥1024 MiB: **60/124 mẫu**. **0/124 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ sáu liên tiếp.** T2-152 đối chiếu độc lập: đỉnh 3.964.468 kB = 63,01% guard khớp từng số. Xem §2, §3.
- **B2: 24 spike load1 ≥3,0 — TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN**, 20 spike trong 05:39–05:51Z (suite T1-152) + 1 spike O8 WebKit của T8 lúc 06:15:10Z + 3 spike bão sau reboot #44 (07:05:32Z, 07:10:38Z, 07:11:13Z); **0 spike sau 07:11:13Z (~31 phút yên)**. Đỉnh **11,08 lúc 05:48:34Z** (watcher); sampler load1 max **11,15 lúc 05:48:18Z**. **ffmpeg testsrc2 geq là driver của 5/24 spike.** Xem §2.5.
- **Lượt yên #22 (T4): CÓ LƯỢT HỢP LỆ MỚI #20 — attempt1-18e179e0, 05:59:46–06:04:10Z, 20/20 + lớp B 5/5 + tickCost median 60,0 ms ĐÚNG NGƯỠNG (không có biên an toàn).** T9 chỉ đối chiếu bằng dữ kiện sampler độc lập, không phán lại: cửa sổ attempt load1 sampler 0,42–1,38, RAM 937.356–1.526.952 kB trong attempt (mẫu 06:04:19Z sau attempt: RAM vọt 3.484.384 kB khi balloon xả sâu). Xem §2.3, §2.4.
- **WFS #58 (T2): chênh 0 — lần thứ 58 liên tiếp** (NEWSTD 979 dòng / 283 file; R7b 1.004 / 300; copies 25 / 17). T9 chỉ trích lại, không tự đếm.
- **Reboot #44 giữa phiên (btime 07:04:11Z, boot 18e179e0 → c741f5e6):** sampler + watcher chết theo reboot, T9 khởi động lại bằng tay 07:05:32Z, gap phủ sóng 71 s. **Dấu hiệu đồng hồ: btime boot mới (07:04:11Z) SỚM HƠN 10 s so với mẫu cuối boot cũ (07:04:21Z)** — đồng hồ lùi ≥10 s tại #44 (cùng họ #41 ≥+20 s, #42 15 s). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL (mới): 35 dòng trên boot c741f5e6, 07:05:59–07:45:00Z, cadence ~70 s** — `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. Lần đầu bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9 (đợt 151: 0 dòng). Xem §4.
- **T5-152 (đối chiếu):** repair sớm kích hoạt 05:46:03Z (quyết (h) đợt 150); **cờ POSTBOOT_PASS boot 18e179e0 05:58:52Z poll=1**. T4 dùng cờ này cho gate0. Xem §5.2.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round152-t9/k8-headroom.py` (copy y nguyên từ đợt 151 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 152

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 05:39:00Z 20/11 | **82** | 18e179e0 (btime 05:20:57Z) | lần đo 1, boot ~18' tuổi; RAM trước đo 2.299.820 kB, balloon 4.533.016 kB (đang xả sau reboot #43), load1 6,74 |
| 05:39:00Z 20/11 | **82** | 18e179e0 | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 2.308.144 kB, balloon 4.533.016 kB, load1 6,74 |
| 07:42:43Z 20/11 | **0** | c741f5e6 (btime 07:04:11Z) | lần đo 3 (đóng phiên, boot mới sau reboot #44); RAM trước đo 996.324 kB, balloon 5.854.000 kB (vừa đứt ghim chuỗi 5 lúc 07:42:34Z), load1 1,13 |
| 07:42:43Z 20/11 | **0** | c741f5e6 | lần đo 4 (chênh **0** so với lần 3); RAM trước đo 995.784 kB, balloon 5.854.000 kB, load1 1,13 |
| 07:43:11Z 20/11 | **0** | c741f5e6 | lần đo 5 (xác nhận thêm, do 0 là giá trị cực trị); RAM trước đo 1.085.628 kB, balloon 5.901.044 kB, load1 không ghi lại |

- Probe dừng ở `i=82` cả hai lần mở đợt, `i=0` cả ba lần đóng phiên — lần đo đóng: `inotify_add_watch` ĐẦU TIÊN đã trả errno 28 (không thêm được watch nào), đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau mỗi lần đo).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 82 = **63.665 watch** lúc mở; 63.747 − 0 = **63.747 watch** lúc đóng (**+82 trong phiên**, qua reboot #44 — reboot không nhả watch ngoài cell; bảng watch đầy hẳn lúc đóng).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): 82 / 1.578 ≈ **0,052** mở đợt; 0 / 1.578 = **0** đóng phiên — **lần đầu bằng 0 từ trước tới nay** (đợt 151: 0,057 lúc đóng; đợt 150: 0,20).
- T5-152 KHÔNG probe lại headroom đợt này (như đợt 151 — tránh nhiễu T4 đang đo #22) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 2 lần đo mở chênh 0 + 3 lần đo đóng đều 0 + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot c741f5e6 có 35 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM trước đo lần đóng (~996 MB) thấp hơn lần mở (~2,3 GB) trong khi headroom giảm 82 → 0. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước) — reboot #44 cũng không khôi phục headroom (82 mở trên boot cũ → 0 đóng trên boot mới).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–151 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 135 | 2.403 → 2.395 | đo 02:40:57Z → 02:43:11Z, boot 78b55838 btime 02:27:27Z |
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
| **152** | **82 → 0** | **mở 05:39:00Z boot 18e179e0 btime 05:20:57Z → đóng 07:42:43Z boot MỚI c741f5e6 btime 07:04:11Z (reboot #44 GIỮA phiên; lần đo xác nhận thứ ba 07:43:11Z cũng 0)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU — và reboot không khôi phục.** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**. Bước giảm đợt này: −8 so với đóng đợt 151 (90 → 82) ở đầu phiên (qua reboot #43); thêm −82 trong phiên, qua reboot #44.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ mười hai liên tiếp.** Quyết parent đợt 151 (g): VẪN CHỈ THEO DÕI — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): headroom chạm đúng 0 (không còn watch nào để cấp) + journal có 35 dòng lỗi ENOSPC thật của systemd trong phiên** — lần đầu cạn watch gây lỗi thấy được (xem §4). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Mốc mới: headroom = 0 — lần đầu bảng watch đầy hẳn (63.747/63.747 watch ngoài cell).** Một vite mới cần ~1.578 watch sẽ không thêm được watch nào nếu khởi động lúc này (vite đang chạy giữ nguyên watch của nó — vòng lặp vẫn chạy vì vite tạm dùng 0 watch).
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 05:38Z, lúc đo probe 05:39:00Z và lúc đóng 07:43:11Z — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.747 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler 124 mẫu, 05:39:17–07:42:34Z, HAI boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên (balloon xả sau reboot #43) → trũng sâu lúc ghim trần → hồi sau reboot #44 → ghim lại trên boot mới

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **124 mẫu, 05:39:17Z–07:42:34Z 20/11, HAI boot — gap duy nhất 71 s tại reboot #44** (mẫu cuối boot cũ 07:04:21Z → mẫu đầu boot mới 07:05:32Z; sampler + watcher khởi động lại bằng tay — xem §5.1). Tổng quan: **min 474.688 kB (463,6 MiB) lúc 06:45:21Z (trong lúc ghim, chuỗi 1); max 3.964.468 kB (3.871,6 MiB) lúc 05:40:17Z — 63,01% guard; mean 1.297.996 kB (1.267,6 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 05:39:17–05:51:19Z | 18e179e0 | 2.634.572–3.964.468 kB | RAM cao, dao động mạnh theo tải suite T1 (spike load1 tới 11,15 — xem §2.5); đỉnh phiên 05:40:17Z (balloon min phiên 2.609.428 kB lúc 05:43:17Z); gate A MỞ 13/13 mẫu |
| 05:52:19–06:42:21Z | 18e179e0 | 493.652–3.484.384 kB | RAM rơi dần khi balloon leo răng cưa 2,61M → 6,44M kB; mẫu 06:04:19Z RAM vọt 3.484.384 kB khi balloon xả sâu sau attempt T4 (xem §2.3); **ghim trần 16 mẫu trong 2 chuỗi** bắt đầu 06:43:21Z (xem §2.2); load1 ≤3,20 (đỉnh 06:15:19Z, spike O8 — xem §2.5); gate A MỞ 35/51 mẫu |
| 06:43:21–07:04:21Z | 18e179e0 | 474.688–802.688 kB | RAM trũng sâu, balloon ghim/xả xen kẽ; min phiên 474.688 kB lúc 06:45:21Z (trong chuỗi ghim 1); chuỗi ghim 2 đứt 07:02:21Z; mẫu cuối boot cũ 07:04:21Z RAM 540.544 kB, balloon 6.410.416 kB (đang leo lại sát trần); **gate A ĐÓNG cả 22 mẫu**; load1 ≤0,95 (yên hoàn toàn về tải) |
| 07:05:32–07:20:33Z | c741f5e6 | 607.032–1.739.324 kB | Sau reboot #44: RAM hồi 1,74M kB, balloon xả về 5,09M kB rồi leo lại; SwapFree nhảy lên 1.040.508 kB (swap xả theo reboot) rồi tụt về ~680k kB; gate A MỞ 9/16 mẫu |
| 07:21:33–07:42:34Z | c741f5e6 | 532.856–1.201.204 kB | **Ghim trần 11 mẫu trong 3 chuỗi** (xem §2.2); RAM min boot mới 532.856 kB lúc 07:24:33Z (trong chuỗi ghim 3); chuỗi ghim 5 đứt 07:42:34Z (balloon xả về 5.854.000 kB, RAM hồi 1.116.160 kB); gate A MỞ 3/22 mẫu |

- **Gate A ≥1024 MiB: 60/124 mẫu** (48 mẫu boot cũ + 12 mẫu boot mới); **0 mẫu ≥ guard**; load1 max (sampler) **11,15 lúc 05:48:18Z**; **15/124 mẫu load1 ≥3,0** (12 mẫu trong 05:39–05:51Z + 1 mẫu 06:15:19Z + 2 mẫu 07:05–07:11Z — trùng các cụm spike §2.5).
- Swap: SwapFree 813.588 kB (mẫu đầu) → 656.128 kB (mẫu cuối); dao động 629.616–1.040.508 kB — nhảy lên >1.040.508 kB ngay sau reboot #44 (07:05:32Z) rồi tụt dần về ~650–680k kB.
- Đối chiếu T4-152 (poller, attempt 05:59:46–06:04:10Z): RAM các mẫu sampler trong cửa sổ attempt 937.356–1.526.952 kB khớp T4 ghi B5 RAM min 894 MB (chênh pha lấy mẫu — xem §2.3). T4 ghi gate0: poller chờ cửa rồi attempt1 chạy ngay, không retry.
- **Đối chiếu T2-152 (§2.8 + §1): đỉnh RAM 3.964.468 kB = 63,01% guard lúc 05:40:17Z KHỚP TỪNG SỐ với sampler T9** (T2 trích từ log gốc T9, đoạn K); 0/202 mẫu ≥ guard theo đếm của T2 trên cửa sổ mù rộng hơn. Không còn lệch số RAM đỉnh như đợt 151 (F-151-T9-7 đã đóng bằng quyết (h) đợt 151).
- Mẫu 06:04:19Z (ngay sau attempt T4 kết thúc 06:04:10Z): RAM vọt 1.194.792 → 3.484.384 kB, balloon xả sâu 5.362.484 → 3.330.868 kB trong 60 s — balloon xả mạnh đúng lúc attempt kết thúc; T9 ghi đúng số đo, không phán cơ chế (xem §2.3).

### 2.2 Balloon virtio — GHIM TRẦN 27/124 mẫu, 5 chuỗi, HAI boot; đợt ghim MỚI

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot cũ (18e179e0): GHIM TRẦN 16/86 mẫu (18,6%), trong 2 chuỗi:**
  - **Chuỗi 1: 06:43:21–06:46:21Z, 4 mẫu** (span 180 s); đứt 06:47:21Z (balloon xả về 6.181.680 kB), leo lại 6.291.272 → 6.390.748 kB trong 2 mẫu rồi ghim lại.
  - **Chuỗi 2 (episode dài nhất đợt): 06:50:21–07:01:21Z, 12 mẫu, 11 phút** (span 660 s); đứt 07:02:21Z (balloon xả về 6.247.216 kB). RAM trong chuỗi 2: 474.688–1.400.000 kB; min phiên 474.688 kB lúc 06:45:21Z nằm trong chuỗi 1.
- **Boot mới (c741f5e6, sau reboot #44): GHIM TRẦN 11/38 mẫu (28,9%), trong 3 chuỗi:**
  - **Chuỗi 3: 07:21:33–07:24:33Z, 4 mẫu** (span 180 s); đứt 07:25:33Z (6.378.288 kB), xả sâu tới 5.851.644 kB lúc 07:26:33Z (90,8% trần), rồi leo lại.
  - **Chuỗi 4: 07:32:33Z, 1 mẫu** (chạm lẻ; mẫu trước 07:31:33Z balloon 6.434.824 kB — 99,9% trần, chưa ghim; mẫu sau 07:33:33Z xả về 6.247.216 kB).
  - **Chuỗi 5: 07:36:33–07:41:33Z, 6 mẫu, 5 phút** (span 300 s); mẫu trước chuỗi 07:35:33Z balloon 6.441.920 kB (99,97% trần); **đứt 07:42:34Z (balloon xả về 5.854.000 kB, RAM hồi 1.116.160 kB) — quan sát được điểm đứt**.
- **Tổng ghim trần đợt này: 27/124 mẫu (21,8%). Cả 5 chuỗi đều quan sát được điểm đứt** (khác đợt 151: chạm cuối còn mở lúc đóng; giống đợt 150: đứt 00:58:37Z quan sát được). So với đợt 151: 31/134 mẫu trong 3 chuỗi (2 + 28 + 1); đợt 150: 28/97 mẫu trong 4 chuỗi.
- **Phán theo quy tắc quyết (e) (T9 phán phần liên-đợt, giao T10 xác nhận cách đếm trong đợt):**
  - **Đợt 152 là đợt ghim MỚI, không nối đợt 151:** giữa lần ghim cuối đợt 151 (chạm 04:52:19Z, boot fad2aab9, còn mở lúc đóng) và lần chạm đầu đợt 152 (06:43:21Z, boot 18e179e0) có **MỘT reboot (#43 btime 05:20:57Z) + balloon xả sâu tới 2.609.428 kB (40,5% trần) + ~1h51m không ghim** (04:52:19Z → 06:43:21Z) — đủ cả ba điều kiện của quyết (e) (reboot + xả sâu + thời gian không ghim). Khoảng mù dữ kiện: 04:52:19Z (sampler T9-151 dừng) → 05:39:17Z (sampler T9-152 bắt đầu) không có sampler T9 nào chạy — nhưng trong khoảng này T2-152 ghi reboot #43 + T5-152 ghi replay trên boot 18e179e0, không ghi ghim; T10 lưu ý khi phán. **Chuỗi ghim đợt 151 trên fad2aab9 ĐÃ KẾT THÚC theo reboot #43** (điểm đứt trong khoảng mù 04:52:19Z–05:20:57Z, không quan sát được chính xác — giao quyết (e) đợt 151).
  - **Trong đợt 152:** T9 trình bày theo cách đếm của đợt 150/151 (chuỗi = mẫu ghim liên tiếp): 5 chuỗi (4 + 12 + 4 + 1 + 6). Việc gọi là 1 episode hay 5 chuỗi là phán của T10 — T9 chỉ đưa dữ kiện đầy đủ + cách đếm tham chiếu. Lưu ý cho T10: chuỗi 1 và 2 cách nhau 3 mẫu không ghim (xả tới 6,18M kB, 96,0% trần); chuỗi 3–4–5 cách nhau bởi reboot #44 (chuỗi 2 → 3) và các lần xả tới 5,85–6,25M kB; chuỗi 4 và 5 cách nhau 3 mẫu (xả tới 6,25M kB, 96,9% trần).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~475–659.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 07:42:34Z: tổng RAM 8.124.900 kB − balloon 5.854.000 kB = 2.270.900 kB còn lại; MemAvailable 1.116.160 kB.

### 2.3 Lượt yên WebKit #22 (T4, đợt 152) — CÓ LƯỢT HỢP LỆ MỚI #20, median ĐÚNG NGƯỠNG 60,0 ms

- **T4-152 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND152_T4_WEBKIT_QUIET22_LIMITS.md`) — T9 trích verdict T4 + đối chiếu bằng dữ kiện sampler độc lập, không phán lại.
- **Verdict T4: #22 CÓ LƯỢT HỢP LỆ MỚI #20 — attempt1-18e179e0, 05:59:46–06:04:10Z, 20/20 + lớp B ĐẠT 5/5 + tickCost median 60,0 ms ≤60 (ĐÚNG NGƯỠNG, không có dư).** Ngân sách dùng 1/3 attempt (không cần retry). Coverage (c2) 0 occurrence — lượt này không đóng góp bằng chứng mới cho điều tra ghost-freeze; cộng dồn (c2) KHÔNG ĐỔI: P1 62/62, P2 53/53, P3-A1 55/62, P3' 32/34, P7 48/48. Poller thoát exit 0 lúc 06:04:10Z. Cờ `round152-t4.done` viết ~06:14Z (T8 ghi 06:14Z; T4 ghi ~06:15Z — chênh ghi giờ, không ảnh hưởng gate).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Cửa sổ attempt (05:59:46–06:04:10Z): sampler load1 **1,38 / 1,10 / 0,66 / 0,50 / 0,42** (05:59:19Z–06:03:19Z) — **yên về tải, corroborate verdict hợp lệ của T4** (T4 ghi B2 load1 max 1,34; sampler max trong attempt 1,10 — mẫu 05:59:19Z load1 1,38 nằm TRƯỚC attempt 27 s). RAM trong cửa sổ này 937.356–1.526.952 kB (gate A MỞ cả 5 mẫu trong attempt; mẫu 06:04:19Z sau attempt 3.484.384 kB — xem dưới).
  - Mẫu 06:04:19Z (9 s sau poller thoát): RAM **3.484.384 kB**, balloon xả sâu **5.362.484 → 3.330.868 kB** trong 60 s — balloon xả mạnh đúng lúc attempt kết thúc. T9 ghi đúng số đo, không phán cơ chế (có thể host thu balloon khi tải attempt dứt; không có spike load1 kèm theo — load1 mẫu đó 0,94).
  - **Cảnh báo trung thực (T4 tự ghi, T9 chỉ trích lại):** median **đúng ngưỡng 60,0 ms** — đạt theo luật máy (60,0 ≤ 60) nhưng không có biên an toàn; đây là lượt chậm nhất trong chuỗi 20 lượt cùng với 1 lượt 60,0 ms khác.
- **Hệ quả gate (T8-152):** O8 PASS 3/3 SAU lượt yên hợp lệ #20, QUA GATE theo chuẩn đứng quyết (i) — **lần thứ hai liên tiếp** (151, 152); harness 6/6 PASS, 0 kẹt; 85m4 PASS — đứt chuỗi kẹt 3/4 lần chạy gần nhất; chuỗi WebKit FULL PASS 9 → 10 (chờ T10 xác nhận độc lập). T9 chỉ trích lại, không phán gate.
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ chờ/attempt của T4 (độc lập, cadence 60 s)

Poller T4 chạy ~05:58Z–06:04:10Z trên boot 18e179e0 (attempt1 05:59:46–06:04:10Z, không retry).

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 05:58:19–05:59:19Z | 18e179e0 | 2,13 / 1,38 | 1.526.952 / 1.373.640 kB — **gate A MỞ** | Poller chờ gate0; tải đã hạ sau suite T1 (spike cuối 05:51:34Z) |
| 05:59:46–06:04:10Z (attempt1) | 18e179e0 | 0,42–1,10 (5 mẫu trong attempt) | 937.356–1.526.952 kB — **gate A MỞ** | **Attempt1: lượt hợp lệ #20** (T4: 20/20, B 5/5, median 60,0 ms) — sampler T9 corroborate yên |
| 06:04:19Z | 18e179e0 | 0,94 | 3.484.384 kB — **gate A MỞ** | Ngay sau poller thoát: balloon xả sâu 5.362.484 → 3.330.868 kB (xem §2.3) |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 24 spike, TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN (20 spike boot 18e179e0 + 1 spike O8 + 3 spike bão sau reboot #44; 0 spike sau 07:11:13Z)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-152-T9-5). **24 spike, tất cả trong 05:39:17–07:11:13Z; 0 spike trong 07:11:13Z–07:42:34Z (~31 phút yên, gồm toàn bộ lúc balloon ghim trần trên boot mới).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — T1 verify: tsc + grep + render + mask_anim + npm test (20 spike) | 05:39:17–05:51:34Z | 5,77 / 5,96 / 7,64 / 5,70 / 8,21 / 7,16 / 5,26 / 4,14 / 3,49 / 3,90 / 3,82 / 5,95 / 5,75 / 9,90 / **11,08** / 8,81 / 5,35 / 3,74 / 3,59 / 3,36 | 20 | grep -rn 15613 42,6%, delta 72 tick/s (spike 1 — T1 verify đếm); node tsc 79,3%, delta **105** (spike 2); node /tmp/p7-152t1.test.mjs 73,1% (spike 3); ffmpeg render.js 134%, delta **131** (spike 4 — max đợt); ffmpeg 99,2%, delta 81 (spike 5); ffprobe 85,7% + node render.js 78,5% (spike 6); mask_anim.py 63%, delta 60 + MiniBrowser 31%, delta 23 (spike 7); mask_anim.py 52%, delta 88 (spike 8); ffmpeg mask frames 110%, delta 81 (spike 9); blind74-investigate.py 26,3%, delta 83 + node capture-thumb 80% (spike 10); npm test:integration 49,2% + apt methods store delta 47 + blind74 (spike 11); ffmpeg testsrc2 geq 108%, delta 112 (spike 12); xkbcomp 100% + vite 38%, delta 49 (spike 13 — X/vite khởi động cho O8); ffmpeg testsrc2 geq 108% + Chromium renderer delta 72 (spike 14); ffmpeg testsrc2 geq 73,4%, delta 98 (spike 15); ffmpeg testsrc2 geq 110%, delta 113 (spike 16); ffmpeg testsrc2 geq 113%, delta 108 (spike 17); ffmpeg rawvideo 92,8% (spike 18 — probe V19 của T0); hole-recheck.py 14,9–18,7%, delta 31–37 (spike 19–20) | **Suite verify T1-152 + job render U4 (mask_anim) + điều tra mù #74?/#75? của T2** — spike 4 là ffmpeg render.js (test_round93_u4_failfast_measure.js, cùng họ đợt 151); spike 13 vite port 5556 config `/tmp/round87-o8/vite.o8.config.mjs` (T8 chuẩn bị O8) |
| 2 — T8 O8 WebKit (1 spike) | 06:15:10Z | 3,50 | 1 | WebKitWebProcess 56,3%, delta 37 + MiniBrowser 49,0%, delta **75** (clicktest-87o8-mask-track-webkit.mjs) | **O8 WebKit attempt1 của T8 (06:14:27–06:15:28Z)** — S1 PASS 06:14:43; không phải p1p3p7 của T4 (cờ T4 đã có 06:14Z, O8 bắt đầu 06:14:27Z) |
| 3 — Bão sau reboot #44 (3 spike) | 07:05:32Z / 07:10:38Z / 07:11:13Z | 3,37 / 4,12 / 3,80 | 3 | Không có process đốt CPU tại snapshot: top tức thời 70–79% idle, 1 task running, D-state 0; hatch daemon 9,6% cumulative, delta 15; apt methods store delta 0–18; `apt-get update` (pid 802, PPID 781 replay shell) đang chạy | **Dư load1 từ cơn bão sau reboot** (daemon khởi động lại + apt replay) — load1 là trung bình 1 phút còn dư, không phải tải CPU bền tại thời điểm snapshot |

- **Sau 07:11:13Z tới 07:42:34Z: 0 spike (~31 phút yên)** — gồm toàn bộ lúc balloon ghim trần trên boot mới (chuỗi 3–5); stack đo (grep/ps mỗi phút) không sinh tải đo được; ghim trần không đi kèm tải.
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher (chuỗi `ps -eo pid,ppid` / `ps -eo pid,args`) xuất hiện 0 lần trong b2-spikes.log** — F-150-T9-8 VẪN ĐÓNG. Một dòng `ps -eo args` (11,1%, pid 26579, PPID 26577) lọt top-12 trong spike 05:47:58Z — đó là `ps` của LUỒNG KHÁC (không phải hai lệnh ps của watcher), không che attribution (driver spike đó là ffmpeg testsrc2 geq 108%). Xem F-152-T9-5.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. **Kết luận phương pháp (F-147-T9-6 vẫn đóng):** snapshot tức thời + delta tick + nr_running đã quy được 24/24 spike đợt này.
- **Delta tick lớn nhất đợt: 131 tick/s** (pid 4918, ffmpeg render.js, spike 05:41:03Z); testsrc2 geq 98–113 tick/s (5 spike); mask_anim 60–88 tick/s; tsc 105 tick/s. (Đợt 151: max 146 tick/s.)
- **testsrc2:** 9 lần nhắc trong b2-spikes.log; **5/24 spike do testsrc2 geq gây ra** (05:46:47Z, 05:47:58Z, 05:48:34Z, 05:49:11Z, 05:49:47Z) — cùng họ test render pixelate geq chạy lại mỗi đợt (như đợt 147–151); mọi PID testsrc2 đều ngắn hạn, thoát bình thường; không process nào kẹt lại. Không mở điều tra thêm (họ F-147/148/149-T9-3 đã ĐÓNG đợt 150).

### 2.6 Truy chủ ffmpeg testsrc2 — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này testsrc2 xuất hiện trong 5/24 spike, tất cả đều là **test render pixelate geq trong suite T1-152** (npm test / test_pixelate_render.js — spike 12–17, PPID 25832 cùng họ; spike 18 ffmpeg rawvideo là probe V19 của T0, không phải testsrc2) — chạy đúng chức năng, thoát bình thường. T9 không truy chủ lại từng PID (không có spike ngoài họ test render; không process lạ).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (TRỪ GAP 71 S TẠI REBOOT #44); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ sáu liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148/149/150/151 giữ nguyên): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **3.964.468 kB = 3.871,6 MiB = 63,01% guard lúc 05:40:17Z** — xa guard 2.326.988 kB. Đỉnh này là **cao nhất kể từ đợt 146** (6.752 MB) nhưng vẫn chưa tới hai phần ba đường tới guard. T2-152 đối chiếu độc lập khớp từng số (3.964.468 kB, 63,01%, 05:40:17Z).
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ sáu liên tiếp (147, 148, 149, 150, 151, 152).** Cơ chế tự động armed cả phiên (sampler `round152-t9/sampler.sh`, pid 3864 rồi pid 1827 sau reboot #44, chạy 05:39:17–07:42:34Z, 124 mẫu — trừ gap 71 s tại #44, xem §5.1) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→152 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, **3.964**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 05:39:17–07:42:34Z (124 mẫu, chỉ gap 71 s tại reboot #44 rồi khởi động lại bằng tay); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 151 nằm trong dir round151-t9 nên không chặn đợt này (dir mới round152-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-152-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-152-birefnet/out-birefnet-152.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147/148/149/150/151):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-152-T9-3); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-152-T9-2 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này: reboot #44 giết sampler, gap 71 s** (đợt 151: gap 46 s; đợt 149: gap 87 s) — dữ kiện này KHÔNG ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" ở mức tuyệt đối, nhưng gap 71 s là nhỏ và T9 khởi động lại bằng tay kịp thời; T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10.
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Journal trên boot c741f5e6: 35 dòng "No space left" / ENOSPC** (kiểm tra 07:45Z, `journalctl -b -0 --grep` — đếm 35 dòng lúc 07:45:00Z, vẫn tăng ~70 s/dòng). Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`, từ 07:05:59Z tới 07:45:00Z, cadence ~70 s (systemd thử lại việc thêm watch và thất bại lặp lại). **Đây là lần đầu bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 151: 0 dòng trên boot fad2aab9) — và nó khớp độc lập với probe headroom = 0 (§1.2): bảng watch đầy hẳn nên systemd không thêm được watch nào.
- Journal chỉ liệt kê **1 boot** (`journalctl --list-boots`: chỉ c741f5e6, first entry 07:04:26Z) — journald không giữ lại journal của boot 18e179e0 (volatile), nên **không kiểm được ENOSPC trên boot cũ sau reboot** — ghi rõ giới hạn này (T5/T6 có nguồn khác thì đối chiếu).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=82, i=82, i=0, i=0, i=0 — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo); **(2) 35 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 0 — **không thêm được watch nào cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Reboot #44 (giữa phiên) — sampler/watcher chết theo, khởi động lại bằng tay

- **Boot lúc mở đợt 152 = 18e179e0-bda0-4a9b-8aab-4dd57661212e** (btime **05:20:57Z** — `uptime -s` 05:20:57 + `/proc/stat` btime 1795152057 KHỚP nhau; T2-152 cũng ghi btime này; đây là **reboot #43, xảy ra TRƯỚC phiên**, giữa lúc T10-151 đóng sổ (~05:05Z) và lượt cron 152 (05:35:51Z) — T2-152 phát hiện mới, xem §5.3).
- **Reboot #44 GIỮA phiên T9:** sampler cũ (pid 3864) + watcher cũ (pid 3865) chết theo reboot; sleep chờ của T9 bị SIGTERM lúc ~07:04Z. Mẫu cuối sampler cũ: **07:04:21Z boot=18e179e0 mem=540.544 bal=6.410.416 load1=0,52**. Boot mới **c741f5e6** (btime **07:04:11Z** — `uptime -s` 07:04:11 + `/proc/stat` btime 1795158251 KHỚP nhau; journal first entry 07:04:26Z). **Sampler + watcher khởi động lại bằng tay lúc 07:05:32Z** (sampler pid 1827, watcher pid 1828; mẫu đầu boot mới 07:05:32Z mem=1.739.324 bal=5.088.820). **Gap phủ sóng sampler: 71 s** (07:04:21Z → 07:05:32Z). B2 watcher: 0 spike nào bị mất chắc chắn trong gap (gap 71 s, watcher cadence 30 s — tối đa 2–3 lần kiểm bị mất; load1 trong gap theo sampler: 0,52 → 3,37 — spike 07:05:32Z bắt được bão sau reboot ngay mẫu đầu).
- **⚠️ DẤU HIỆU ĐỒNG HỒ TẠI #44 (ghi rõ cho T1/T2/T7): btime boot mới (07:04:11Z) SỚM HƠN 10 s so với mẫu cuối boot cũ (07:04:21Z).** Mẫu cuối boot cũ được ghi bằng `date -u` của sampler ngay trước reboot; btime boot mới (đọc từ `/proc/stat` + `uptime -s`, khớp nhau) lại sớm hơn 10 s. Nghĩa là **đồng hồ lùi ≥10 s tại reboot #44** (hoặc btime có offset so với wall clock) — cùng họ với tranh chấp clock các đợt trước (#41 ≥+20 s, #42 15 s — quyết (d) đợt 151 đã ghi vào hồ sơ chính thức; T2-152 đối chiếu nghịch lý #42 là 18 s bằng dòng log 03:25:34.073Z, nhất quán với 15 s của T9). T9 không phán cơ chế đồng hồ — chỉ ghi dữ kiện thô + mốc: sampler cũ chết ~07:04:21–35Z; journal boot mới first entry 07:04:26Z. T2/T7 đối chiếu khi gộp mốc reboot #44.
- **Tuổi thọ boot 18e179e0:** btime 05:20:57Z → btime boot mới 07:04:11Z = **6.194 s = 1h43m14s** (stat→stat). T7/T2 đối chiếu mốc neo khi gộp.
- **Không có nghịch lý đồng hồ nào khác trong dữ kiện T9:** mọi timestamp còn lại thứ tự nhất quán. T9 không phán tranh chấp clock T1–T2.
- Các cờ .done lúc T9 đóng (~07:47Z): t0, t1, t2, t4, t5, t6, t8 (7/9 — T7 còn chạy; chỉ còn T9 chưa đóng lúc 07:47Z).

### 5.2 T5-152 — replay + cờ postboot (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **Repair sớm kích hoạt 05:46:03Z** (boot+25m06s, frozen 618 s — theo quyết (h) đợt 150: sau ~15' không có hoạt động apt thì repair, không chờ timeout 60'); **--repair exit=0; postboot poll1 exit=0; cờ POSTBOOT_PASS cho boot 18e179e0 05:58:52Z poll=1** (dpkg 795 dòng, cache 110, lists 75, GST 269). T4 dùng cờ này cho gate0 (poll #8 xác nhận t5flag=PASS — theo mẫu đợt 151).
- **Reboot #44 đối với T5:** T5-152 đóng cờ trước #44 (T5 .done đã có lúc T9 kiểm ~07:47Z); replay/postboot trên boot c741f5e6 thuộc cửa T5-153. T9 không phán.

### 5.3 Reboot #43 (trước phiên) — T2-152 phát hiện mới (T9 chỉ ghi lại để đối chiếu)

- T2-152: boot hiện tại lúc mở đợt là **18e179e0 (btime 05:20:57Z), KHÔNG phải fad2aab9 như brief giả định**. Reboot #43 (fad2aab9 → 18e179e0) xảy ra giữa lúc T10-151 đóng sổ (~05:05Z) và lượt cron 152 (05:35:51Z). Cửa sổ probe #70 → #71 nay chứa HAI reboot (#42 + #43). Mù #75? (#43) chứng nhận bổ sung theo F-152-T1-1 — verdict MỞ theo luật gap, chờ parent quyết. T9 chỉ ghi lại; T2 là chủ quản.

## 6. Sai số của chính T9 (ghi rõ)

- **F-152-T9-1 — Headroom 82 → 0: LẦN ĐẦU BẰNG 0, dưới ngưỡng lần thứ mười hai liên tiếp, tỉ lệ/vite 0 lúc đóng.** Không phải sai số đo (2 lần đo mở chênh 0, 3 lần đo đóng đều 0; phương pháp không đổi từ đợt 109; journal có 35 dòng ENOSPC thật corroborate độc lập). Ghi rõ: quyết "chỉ theo dõi" (g) đợt 151 vẫn đứng; T9 không tự đổi ngưỡng hay yêu cầu user hành động — nhưng dữ kiện mới (0 + lỗi ENOSPC thật) giao parent/T10 xem lại quyết (g). Trần 63.747 không đổi trong phiên. T5-152 không probe lại headroom nên không có số đối chiếu độc lập đợt này.
- **F-152-T9-2 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ sáu liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-152-T9-3 — Khoảng trống lấy mẫu 60 giây (cùng lớp F-148/F-149/F-150/F-151-T9-5):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Cơ chế tự động chỉ kích hoạt trên mẫu quan sát được — đây là giới hạn thiết kế đã biết, không phải lỗi vận hành. Thêm: **gap 71 s tại reboot #44** là khoảng trống thứ hai (không mẫu nào trong 07:04:21–07:05:32Z) — một lần vượt guard trong gap đó cũng không được quan sát (khả năng thấp: RAM lúc 07:04:21Z chỉ 540.544 kB và lúc 07:05:32Z là 1.739.324 kB, đều xa guard).
- **F-152-T9-4 — Lỗi đếm ghim trong script thống kê, BẮT ĐƯỢC VÀ SỬA GIỮA PHIÊN (trước khi đóng, không ảnh hưởng số cuối):** bản đầu của `stats-appendix.py` đếm "ghim" = mẫu có balloon bằng max chạy trong log — sai khi balloon chưa leo tới trần (lúc kiểm giữa phiên 06:10Z nó báo "ghim 1/32" trong khi balloon max mới 5.460.128 kB, chưa chạm trần 6.443.824 kB). Đã sửa: ghim = balloon == trần cố định 6.443.824 kB (trần quan sát các đợt 149/150/151); kiểm chứng lại: trên log đợt 151 vẫn ra đúng 31 ghim (2+28+1), trên log đợt 152 giữa phiên ra đúng 0 ghim. Mọi số ghim trong LIMITS này đều từ script đã sửa. Bài học này cùng họ với quyết (p) đợt 151 (phụ lục chỉ viết bằng script) — script cũng phải kiểm chứng trên dữ kiện cũ trước khi dùng.
- **F-152-T9-5 — Dòng `ps -eo args` lạ trong spike 05:47:58Z (F-150-T9-8 VẪN ĐÓNG):** `ps -eo args` (pid 26579, PPID 26577, 11,1% cumulative) lọt top-12 trong 1/24 spike. Đây KHÔNG phải lệnh `ps` của watcher (watcher dùng `ps -eo pid,ppid,%cpu,%mem,args` và `ps -eo pid,args` — cả hai chuỗi xuất hiện 0 lần trong log); đó là `ps` của một luồng khác (không xác định được chủ — pid đã chết). Attribution spike đó không bị che (driver là ffmpeg testsrc2 geq 108%). Fix (n) vẫn đứng; không sửa watcher thêm.
- **F-152-T9-6 — Reboot #44 giết sampler/watcher (gap 71 s) + dấu hiệu đồng hồ lùi ≥10 s:** xem §5.1. Gap nhỏ (đợt 151: 46 s; đợt 149: 87 s) và T9 khởi động lại bằng tay kịp thời; dữ kiện này để parent/T10 xem lại quyết (q) "không cần cơ chế tự hồi phục lúc này" — T9 không đề xuất đổi. Dấu hiệu đồng hồ (btime mới sớm hơn mẫu cuối cũ 10 s) giao T2/T7.
- **F-152-T9-7 — T9 KHÔNG phán verdict #22, không phán B4 đúng/sai, không phán cách đếm ghim trong đợt — chỉ đối chiếu dữ kiện:** T4 đã xuất bản LIMITS nên T9 trích verdict T4 (#20 hợp lệ, median đúng ngưỡng 60,0 ms) + bảng sampler độc lập §2.4. T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối). Về balloon: T9 phán đợt 152 là đợt ghim MỚI theo quy tắc (e) (đủ 3 điều kiện liên-đợt — xem §2.2) nhưng giao T10 phán cách đếm trong đợt (1 episode hay 5 chuỗi).
- **F-152-T9-8 — Bảng §2.1 bản nháp suýt ghi sai khoảng RAM theo giai đoạn (bắt được trước khi đóng):** bản nháp ghi khoảng RAM mỗi giai đoạn theo trí nhớ từ các lần kiểm giữa phiên (sai 4/5 cửa sổ, vd cửa sổ 05:39–05:51Z ghi min 937.356 kB trong khi đúng là 2.634.572 kB). Đã sửa bằng script tính min/max từng cửa sổ từ log gốc (output trong §2.1 hiện tại) — cùng bài học quyết (p): số liệu chỉ lấy từ output script, không gõ tay/nhớ tay.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước (copy y nguyên script đợt 151, cap 30.000 thống nhất); file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 153 (phần T9)

1. **Cơ chế tự động (a) armed nhưng chưa có lần kích hoạt thật — lần thứ sáu liên tiếp** (0 mẫu ≥ guard đợt này): giữ nguyên sampler + trigger cho đợt 153 (lockfile + log theo phiên mới — lockfile đợt 152 nằm trong dir round152-t9 nên không chặn đợt 153; mỗi đợt dùng dir riêng). Nếu cửa sổ mở lại, cơ chế sẽ bắt trong ≤60 s. Guard giữ nguyên 6.144 MiB; u2net là fallback chính thức. Lần FIRE thật đầu tiên vẫn chưa kiểm chứng end-to-end (F-152-T9-2). **Đỉnh RAM đợt này 63,01% guard — cao nhất kể từ đợt 146 (6.752 MB) nhưng vẫn xa guard.**
2. **⚠️ Headroom 82 → 0 — VẪN DƯỚI < ~1.800, lần thứ mười hai liên tiếp dưới ngưỡng** (quyết parent đợt 151 (g): vẫn chỉ theo dõi). **Tỉ lệ/vite 0 lúc đóng — lần đầu bằng 0; bảng watch đầy hẳn (63.747/63.747); journal có 35 dòng lỗi ENOSPC thật của systemd trong phiên.** Giao parent/T10 xem lại quyết (g) với dữ kiện mới này. Trần 63.747 không đổi.
3. **Balloon: GHIM TRẦN ĐỢT MỚI — 27/124 mẫu, 5 chuỗi, 2 boot** (chuỗi dài nhất 06:50:21–07:01:21Z, 12 mẫu, 11 phút; cả 5 chuỗi đều quan sát được điểm đứt) sau đợt 151 ghi 31/134 mẫu, chạm cuối còn mở lúc đóng. **Giao T10 xác nhận cách đếm trong đợt** (1 episode hay 5 chuỗi — xem §2.2). Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146.
4. **Lượt yên #22 CÓ lượt hợp lệ mới #20** (attempt1-18e179e0, 20/20, B 5/5, median 60,0 ms ĐÚNG NGƯỠNG — không có biên an toàn); O8 PASS 3/3 sau lượt yên hợp lệ, QUA GATE chuẩn (i) lần thứ hai liên tiếp; chuỗi WebKit FULL PASS 9 → 10 (chờ T10 xác nhận độc lập). T4-153 đo lượt tiếp theo (#21); P3' theo dõi theo quyết (n) đợt 151.
5. **Mù #74?/#75? (T2-152) — VẪN MỞ theo luật gap** (chuỗi đóng hoàn toàn giữ 9; CERT/FULL giữ 73/88); INSIDE chuỗi 3 → 4 (T2, chờ parent xác nhận). Dấu hiệu đồng hồ tại reboot #44 (btime mới sớm hơn mẫu cuối cũ 10 s) giao T2/T7 đối chiếu.
6. Các nợ đứng khác giữ nguyên từ đợt 151 §7 (G1 khung (a) M2 vẫn hoãn chờ user; R9 (a) vẫn chờ user; ci-security.yml vẫn 403 chờ user; file oversize 6,4 MB vẫn chưa quyết; TTS 39 cấm kiểm lại; mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143).


Thống kê: samples: 124 (86 mau boot 18e179e0 + 38 mau boot c741f5e6); mem min: 474,688 kB (463.6 MiB) luc 06:45:21Z; mem max: 3,964,468 kB (3871.6 MiB = 63.01% guard) luc 05:40:17Z; mem mean: 1297996 kB (1267.6 MiB); count >=1024 MiB (gate A): 60/124; count >= guard 6144 MiB: 0/124; balloon frozen 6,443,824: 27/124 (chuoi 1: 06:43:21Z–06:46:21Z n=4; chuoi 2: 06:50:21Z–07:01:21Z n=12; chuoi 3: 07:21:33Z–07:24:33Z n=4; chuoi 4: 07:32:33Z n=1; chuoi 5: 07:36:33Z–07:41:33Z n=6); balloon min: 2,609,428 kB luc 05:43:17Z; balloon max: 6,443,824 kB; load1 max (sampler): 11.15 luc 05:48:18Z; load1 >=3.0 samples: 15/124; max inter-sample gap: 71 s (07:04:21Z -> 07:05:32Z, 18e179e0 -> c741f5e6); gaps >90s: khong co
## Phụ lục A — Bảng sampler đầy đủ (124 mau: 86 mau boot 18e179e0 + 38 mau boot c741f5e6; khong gap >90 s)
(File gốc: `hidden_files/round152-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó.)
| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-20T05:39:17Z | 18e179e0 | 3,021,420 | 2950.6 | 48.02% | 3,746,584 | 813,588 | 5.77 |
| 2 | 2026-11-20T05:40:17Z | 18e179e0 | 3,964,468 | 3871.6 | 63.01% | 2,677,596 | 815,436 | 6.58 |
| 3 | 2026-11-20T05:41:17Z | 18e179e0 | 3,654,756 | 3569.1 | 58.09% | 3,063,004 | 818,964 | 5.81 |
| 4 | 2026-11-20T05:42:17Z | 18e179e0 | 3,238,028 | 3162.1 | 51.47% | 3,410,912 | 821,392 | 7.16 |
| 5 | 2026-11-20T05:43:17Z | 18e179e0 | 3,443,316 | 3362.6 | 54.73% | 2,609,428 | 811,728 | 3.76 |
| 6 | 2026-11-20T05:44:18Z | 18e179e0 | 3,270,920 | 3194.3 | 51.99% | 2,860,540 | 813,248 | 2.95 |
| 7 | 2026-11-20T05:45:18Z | 18e179e0 | 3,033,156 | 2962.1 | 48.21% | 3,210,412 | 812,856 | 1.98 |
| 8 | 2026-11-20T05:46:18Z | 18e179e0 | 3,061,836 | 2990.1 | 48.67% | 3,221,316 | 791,532 | 4.32 |
| 9 | 2026-11-20T05:47:18Z | 18e179e0 | 3,350,540 | 3272.0 | 53.26% | 3,141,472 | 786,252 | 6.16 |
| 10 | 2026-11-20T05:48:18Z | 18e179e0 | 2,672,748 | 2610.1 | 42.48% | 3,283,048 | 753,752 | 11.15 |
| 11 | 2026-11-20T05:49:18Z | 18e179e0 | 2,952,220 | 2883.0 | 46.92% | 3,605,452 | 754,324 | 8.12 |
| 12 | 2026-11-20T05:50:18Z | 18e179e0 | 2,734,992 | 2670.9 | 43.47% | 3,896,644 | 754,508 | 3.74 |
| 13 | 2026-11-20T05:51:19Z | 18e179e0 | 2,634,572 | 2572.8 | 41.88% | 3,895,692 | 748,028 | 3.18 |
| 14 | 2026-11-20T05:52:19Z | 18e179e0 | 2,898,744 | 2830.8 | 46.07% | 3,788,540 | 745,696 | 2.06 |
| 15 | 2026-11-20T05:53:19Z | 18e179e0 | 2,645,860 | 2583.8 | 42.05% | 4,097,112 | 743,900 | 1.05 |
| 16 | 2026-11-20T05:54:19Z | 18e179e0 | 2,358,384 | 2303.1 | 37.49% | 4,383,940 | 745,276 | 0.56 |
| 17 | 2026-11-20T05:55:19Z | 18e179e0 | 2,071,004 | 2022.5 | 32.92% | 4,642,660 | 746,028 | 0.28 |
| 18 | 2026-11-20T05:56:19Z | 18e179e0 | 1,886,944 | 1842.7 | 29.99% | 4,872,432 | 742,936 | 0.82 |
| 19 | 2026-11-20T05:57:19Z | 18e179e0 | 1,696,208 | 1656.5 | 26.96% | 5,087,464 | 737,024 | 0.44 |
| 20 | 2026-11-20T05:58:19Z | 18e179e0 | 1,526,952 | 1491.2 | 24.27% | 5,281,792 | 736,308 | 2.13 |
| 21 | 2026-11-20T05:59:19Z | 18e179e0 | 1,373,640 | 1341.4 | 21.83% | 5,460,128 | 724,404 | 1.38 |
| 22 | 2026-11-20T06:00:19Z | 18e179e0 | 1,109,432 | 1083.4 | 17.63% | 4,982,636 | 629,616 | 1.10 |
| 23 | 2026-11-20T06:01:19Z | 18e179e0 | 937,356 | 915.4 | 14.90% | 5,010,060 | 629,952 | 0.66 |
| 24 | 2026-11-20T06:02:19Z | 18e179e0 | 1,451,568 | 1417.5 | 23.07% | 5,192,352 | 631,996 | 0.50 |
| 25 | 2026-11-20T06:03:19Z | 18e179e0 | 1,194,792 | 1166.8 | 18.99% | 5,362,484 | 633,652 | 0.42 |
| 26 | 2026-11-20T06:04:19Z | 18e179e0 | 3,484,384 | 3402.7 | 55.38% | 3,330,868 | 632,168 | 0.94 |
| 27 | 2026-11-20T06:05:19Z | 18e179e0 | 3,281,996 | 3205.1 | 52.17% | 3,578,216 | 636,644 | 0.69 |
| 28 | 2026-11-20T06:06:19Z | 18e179e0 | 2,920,592 | 2852.1 | 46.42% | 3,917,288 | 647,388 | 0.76 |
| 29 | 2026-11-20T06:07:19Z | 18e179e0 | 2,518,448 | 2459.4 | 40.03% | 4,225,092 | 650,056 | 0.42 |
| 30 | 2026-11-20T06:08:19Z | 18e179e0 | 2,249,860 | 2197.1 | 35.76% | 4,500,604 | 659,424 | 0.34 |
| 31 | 2026-11-20T06:09:19Z | 18e179e0 | 2,048,948 | 2000.9 | 32.57% | 4,752,356 | 660,556 | 0.28 |
| 32 | 2026-11-20T06:10:19Z | 18e179e0 | 1,838,248 | 1795.2 | 29.22% | 4,981,912 | 660,840 | 0.10 |
| 33 | 2026-11-20T06:11:19Z | 18e179e0 | 1,584,524 | 1547.4 | 25.19% | 5,186,400 | 662,600 | 0.15 |
| 34 | 2026-11-20T06:12:19Z | 18e179e0 | 1,426,844 | 1393.4 | 22.68% | 5,375,328 | 662,704 | 0.15 |
| 35 | 2026-11-20T06:13:19Z | 18e179e0 | 1,210,760 | 1182.4 | 19.24% | 5,539,768 | 663,108 | 0.25 |
| 36 | 2026-11-20T06:14:19Z | 18e179e0 | 1,751,596 | 1710.5 | 27.84% | 5,053,844 | 655,116 | 2.29 |
| 37 | 2026-11-20T06:15:19Z | 18e179e0 | 1,296,808 | 1266.4 | 20.61% | 4,660,628 | 645,188 | 3.20 |
| 38 | 2026-11-20T06:16:19Z | 18e179e0 | 1,293,056 | 1262.8 | 20.55% | 4,577,888 | 641,372 | 1.78 |
| 39 | 2026-11-20T06:17:20Z | 18e179e0 | 2,048,244 | 2000.2 | 32.56% | 4,757,556 | 636,368 | 1.73 |
| 40 | 2026-11-20T06:18:20Z | 18e179e0 | 1,231,976 | 1203.1 | 19.58% | 4,947,280 | 640,576 | 2.41 |
| 41 | 2026-11-20T06:19:20Z | 18e179e0 | 1,174,976 | 1147.4 | 18.68% | 5,119,568 | 641,596 | 2.57 |
| 42 | 2026-11-20T06:20:20Z | 18e179e0 | 942,392 | 920.3 | 14.98% | 5,223,492 | 638,484 | 2.50 |
| 43 | 2026-11-20T06:21:20Z | 18e179e0 | 949,396 | 927.1 | 15.09% | 5,351,204 | 629,708 | 2.73 |
| 44 | 2026-11-20T06:22:20Z | 18e179e0 | 1,024,404 | 1000.4 | 16.28% | 5,192,864 | 615,996 | 2.49 |
| 45 | 2026-11-20T06:23:20Z | 18e179e0 | 866,828 | 846.5 | 13.78% | 5,323,600 | 616,340 | 2.56 |
| 46 | 2026-11-20T06:24:20Z | 18e179e0 | 873,224 | 852.8 | 13.88% | 5,449,132 | 616,184 | 1.47 |
| 47 | 2026-11-20T06:25:20Z | 18e179e0 | 829,392 | 810.0 | 13.18% | 5,569,508 | 615,228 | 0.78 |
| 48 | 2026-11-20T06:26:20Z | 18e179e0 | 775,876 | 757.7 | 12.33% | 5,400,448 | 596,820 | 1.56 |
| 49 | 2026-11-20T06:27:20Z | 18e179e0 | 1,503,808 | 1468.6 | 23.90% | 5,437,184 | 594,420 | 1.62 |
| 50 | 2026-11-20T06:28:20Z | 18e179e0 | 880,912 | 860.3 | 14.00% | 5,266,876 | 595,740 | 2.18 |
| 51 | 2026-11-20T06:29:20Z | 18e179e0 | 682,452 | 666.5 | 10.85% | 5,395,012 | 595,668 | 2.24 |
| 52 | 2026-11-20T06:30:20Z | 18e179e0 | 1,294,564 | 1264.2 | 20.58% | 4,727,336 | 589,864 | 2.36 |
| 53 | 2026-11-20T06:31:20Z | 18e179e0 | 1,206,048 | 1177.8 | 19.17% | 4,845,416 | 590,296 | 2.55 |
| 54 | 2026-11-20T06:32:20Z | 18e179e0 | 1,199,048 | 1170.9 | 19.06% | 5,017,888 | 591,164 | 1.68 |
| 55 | 2026-11-20T06:33:20Z | 18e179e0 | 1,022,732 | 998.8 | 16.26% | 5,187,868 | 590,908 | 0.92 |
| 56 | 2026-11-20T06:34:20Z | 18e179e0 | 1,494,436 | 1459.4 | 23.75% | 5,367,340 | 597,588 | 0.65 |
| 57 | 2026-11-20T06:35:20Z | 18e179e0 | 1,327,532 | 1296.4 | 21.10% | 5,542,500 | 608,508 | 1.04 |
| 58 | 2026-11-20T06:36:20Z | 18e179e0 | 1,267,584 | 1237.9 | 20.15% | 5,709,884 | 724,156 | 0.68 |
| 59 | 2026-11-20T06:37:20Z | 18e179e0 | 1,064,376 | 1039.4 | 16.92% | 5,864,392 | 727,600 | 0.51 |
| 60 | 2026-11-20T06:38:20Z | 18e179e0 | 948,136 | 925.9 | 15.07% | 6,003,020 | 728,492 | 0.47 |
| 61 | 2026-11-20T06:39:20Z | 18e179e0 | 814,724 | 795.6 | 12.95% | 6,126,704 | 726,872 | 0.31 |
| 62 | 2026-11-20T06:40:20Z | 18e179e0 | 687,204 | 671.1 | 10.92% | 6,238,816 | 749,848 | 0.29 |
| 63 | 2026-11-20T06:41:20Z | 18e179e0 | 552,884 | 539.9 | 8.79% | 6,340,772 | 750,760 | 0.29 |
| 64 | 2026-11-20T06:42:20Z | 18e179e0 | 493,652 | 482.1 | 7.85% | 6,428,060 | 745,452 | 0.70 |
| 65 | 2026-11-20T06:43:21Z | 18e179e0 | 477,968 | 466.8 | 7.60% | 6,443,824 | 735,116 | 0.38 |
| 66 | 2026-11-20T06:44:21Z | 18e179e0 | 478,540 | 467.3 | 7.61% | 6,443,824 | 735,272 | 0.27 |
| 67 | 2026-11-20T06:45:21Z | 18e179e0 | 474,688 | 463.6 | 7.54% | 6,443,824 | 734,944 | 0.24 |
| 68 | 2026-11-20T06:46:21Z | 18e179e0 | 526,604 | 514.3 | 8.37% | 6,443,824 | 709,156 | 0.53 |
| 69 | 2026-11-20T06:47:21Z | 18e179e0 | 802,688 | 783.9 | 12.76% | 6,181,680 | 648,152 | 0.95 |
| 70 | 2026-11-20T06:48:21Z | 18e179e0 | 692,204 | 676.0 | 11.00% | 6,291,272 | 645,904 | 0.45 |
| 71 | 2026-11-20T06:49:21Z | 18e179e0 | 574,964 | 561.5 | 9.14% | 6,390,748 | 644,432 | 0.23 |
| 72 | 2026-11-20T06:50:21Z | 18e179e0 | 507,540 | 495.6 | 8.07% | 6,443,824 | 642,004 | 0.08 |
| 73 | 2026-11-20T06:51:21Z | 18e179e0 | 521,892 | 509.7 | 8.30% | 6,443,824 | 642,516 | 0.24 |
| 74 | 2026-11-20T06:52:21Z | 18e179e0 | 505,500 | 493.7 | 8.03% | 6,443,824 | 640,324 | 0.20 |
| 75 | 2026-11-20T06:53:21Z | 18e179e0 | 522,940 | 510.7 | 8.31% | 6,443,824 | 640,472 | 0.07 |
| 76 | 2026-11-20T06:54:21Z | 18e179e0 | 509,676 | 497.7 | 8.10% | 6,443,824 | 640,576 | 0.02 |
| 77 | 2026-11-20T06:55:21Z | 18e179e0 | 477,676 | 466.5 | 7.59% | 6,443,824 | 640,808 | 0.01 |
| 78 | 2026-11-20T06:56:21Z | 18e179e0 | 510,228 | 498.3 | 8.11% | 6,443,824 | 641,644 | 0.05 |
| 79 | 2026-11-20T06:57:21Z | 18e179e0 | 507,616 | 495.7 | 8.07% | 6,443,824 | 641,712 | 0.02 |
| 80 | 2026-11-20T06:58:21Z | 18e179e0 | 515,356 | 503.3 | 8.19% | 6,443,824 | 641,880 | 0.00 |
| 81 | 2026-11-20T06:59:21Z | 18e179e0 | 522,808 | 510.6 | 8.31% | 6,443,824 | 641,984 | 0.37 |
| 82 | 2026-11-20T07:00:21Z | 18e179e0 | 516,068 | 504.0 | 8.20% | 6,443,824 | 648,932 | 0.14 |
| 83 | 2026-11-20T07:01:21Z | 18e179e0 | 481,364 | 470.1 | 7.65% | 6,443,824 | 649,432 | 0.09 |
| 84 | 2026-11-20T07:02:21Z | 18e179e0 | 738,516 | 721.2 | 11.74% | 6,247,216 | 646,084 | 0.32 |
| 85 | 2026-11-20T07:03:21Z | 18e179e0 | 667,776 | 652.1 | 10.61% | 6,314,628 | 642,620 | 0.78 |
| 86 | 2026-11-20T07:04:21Z | 18e179e0 | 540,544 | 527.9 | 8.59% | 6,410,416 | 644,656 | 0.52 |
| — | — | — | — | — | — | — | — | — |
| 87 | 2026-11-20T07:05:32Z | c741f5e6 | 1,739,324 | 1698.6 | 27.65% | 5,088,820 | 1,040,508 | 3.37 |
| 88 | 2026-11-20T07:06:32Z | c741f5e6 | 1,624,072 | 1586.0 | 25.81% | 5,298,192 | 1,030,336 | 1.58 |
| 89 | 2026-11-20T07:07:32Z | c741f5e6 | 1,490,532 | 1455.6 | 23.69% | 5,457,644 | 1,007,652 | 1.04 |
| 90 | 2026-11-20T07:08:32Z | c741f5e6 | 1,292,624 | 1262.3 | 20.55% | 5,632,148 | 993,360 | 0.38 |
| 91 | 2026-11-20T07:09:32Z | c741f5e6 | 1,166,176 | 1138.8 | 18.54% | 5,789,104 | 952,444 | 0.87 |
| 92 | 2026-11-20T07:10:32Z | c741f5e6 | 1,254,712 | 1225.3 | 19.94% | 5,690,172 | 785,804 | 3.60 |
| 93 | 2026-11-20T07:11:32Z | c741f5e6 | 1,216,680 | 1188.2 | 19.34% | 5,795,252 | 757,076 | 3.00 |
| 94 | 2026-11-20T07:12:32Z | c741f5e6 | 1,053,300 | 1028.6 | 16.74% | 5,941,304 | 753,056 | 2.04 |
| 95 | 2026-11-20T07:13:32Z | c741f5e6 | 951,876 | 929.6 | 15.13% | 6,074,448 | 739,956 | 2.12 |
| 96 | 2026-11-20T07:14:32Z | c741f5e6 | 819,820 | 800.6 | 13.03% | 6,194,112 | 736,492 | 1.46 |
| 97 | 2026-11-20T07:15:32Z | c741f5e6 | 708,936 | 692.3 | 11.27% | 6,303,128 | 735,860 | 1.27 |
| 98 | 2026-11-20T07:16:33Z | c741f5e6 | 1,054,812 | 1030.1 | 16.77% | 5,976,640 | 708,364 | 1.52 |
| 99 | 2026-11-20T07:17:33Z | c741f5e6 | 917,816 | 896.3 | 14.59% | 6,106,440 | 709,428 | 1.25 |
| 100 | 2026-11-20T07:18:33Z | c741f5e6 | 788,404 | 769.9 | 12.53% | 6,220,660 | 709,580 | 1.41 |
| 101 | 2026-11-20T07:19:33Z | c741f5e6 | 704,332 | 687.8 | 11.20% | 6,323,956 | 696,944 | 1.57 |
| 102 | 2026-11-20T07:20:33Z | c741f5e6 | 607,032 | 592.8 | 9.65% | 6,422,504 | 691,164 | 1.42 |
| 103 | 2026-11-20T07:21:33Z | c741f5e6 | 613,576 | 599.2 | 9.75% | 6,443,824 | 687,900 | 1.78 |
| 104 | 2026-11-20T07:22:33Z | c741f5e6 | 590,616 | 576.8 | 9.39% | 6,443,824 | 688,060 | 2.01 |
| 105 | 2026-11-20T07:23:33Z | c741f5e6 | 567,988 | 554.7 | 9.03% | 6,443,824 | 686,700 | 2.13 |
| 106 | 2026-11-20T07:24:33Z | c741f5e6 | 532,856 | 520.4 | 8.47% | 6,443,824 | 685,456 | 0.95 |
| 107 | 2026-11-20T07:25:33Z | c741f5e6 | 685,248 | 669.2 | 10.89% | 6,378,288 | 672,460 | 1.72 |
| 108 | 2026-11-20T07:26:33Z | c741f5e6 | 1,201,204 | 1173.1 | 19.09% | 5,851,644 | 671,864 | 1.82 |
| 109 | 2026-11-20T07:27:33Z | c741f5e6 | 1,051,680 | 1027.0 | 16.72% | 5,993,224 | 671,976 | 1.49 |
| 110 | 2026-11-20T07:28:33Z | c741f5e6 | 918,360 | 896.8 | 14.60% | 6,120,680 | 671,848 | 1.26 |
| 111 | 2026-11-20T07:29:33Z | c741f5e6 | 777,276 | 759.1 | 12.35% | 6,236,860 | 667,760 | 1.39 |
| 112 | 2026-11-20T07:30:33Z | c741f5e6 | 700,456 | 684.0 | 11.13% | 6,341,056 | 668,956 | 1.13 |
| 113 | 2026-11-20T07:31:33Z | c741f5e6 | 588,840 | 575.0 | 9.36% | 6,434,824 | 669,752 | 0.81 |
| 114 | 2026-11-20T07:32:33Z | c741f5e6 | 559,196 | 546.1 | 8.89% | 6,443,824 | 675,548 | 0.87 |
| 115 | 2026-11-20T07:33:33Z | c741f5e6 | 726,604 | 709.6 | 11.55% | 6,247,216 | 673,068 | 1.28 |
| 116 | 2026-11-20T07:34:33Z | c741f5e6 | 632,072 | 617.3 | 10.05% | 6,348,744 | 677,604 | 0.68 |
| 117 | 2026-11-20T07:35:33Z | c741f5e6 | 573,788 | 560.3 | 9.12% | 6,441,920 | 683,136 | 0.77 |
| 118 | 2026-11-20T07:36:33Z | c741f5e6 | 558,252 | 545.2 | 8.87% | 6,443,824 | 684,252 | 0.40 |
| 119 | 2026-11-20T07:37:33Z | c741f5e6 | 565,680 | 552.4 | 8.99% | 6,443,824 | 681,476 | 0.27 |
| 120 | 2026-11-20T07:38:33Z | c741f5e6 | 557,988 | 544.9 | 8.87% | 6,443,824 | 681,716 | 0.16 |
| 121 | 2026-11-20T07:39:33Z | c741f5e6 | 568,376 | 555.1 | 9.03% | 6,443,824 | 681,956 | 0.06 |
| 122 | 2026-11-20T07:40:33Z | c741f5e6 | 567,168 | 553.9 | 9.01% | 6,443,824 | 676,692 | 1.01 |
| 123 | 2026-11-20T07:41:33Z | c741f5e6 | 587,736 | 574.0 | 9.34% | 6,443,824 | 669,408 | 0.60 |
| 124 | 2026-11-20T07:42:34Z | c741f5e6 | 1,116,160 | 1090.0 | 17.74% | 5,854,000 | 656,128 | 1.15 |
