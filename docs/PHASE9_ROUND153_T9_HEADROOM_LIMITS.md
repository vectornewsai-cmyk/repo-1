# LIMITS — Phase 9 đợt 153, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ bảy liên tiếp; headroom 0 → 0 — giữ mức 0 cả phiên; balloon GHIM TRẦN ĐỢT MỚI 65/131 mẫu, 2 chuỗi, 1 episode; reboot #46 giữa phiên; ENOSPC ≥102 dòng trên 2 boot; #22 CÓ lượt hợp lệ #21)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 0/0 (08:38:02Z + 08:38:06Z, boot 401fca75) → đóng 0/0/0 (10:47:35Z + 10:47:38Z + 10:47:44Z, boot 1450ac80)** — giữ mức **0 cả phiên**, qua reboot #46; **dưới ngưỡng < ~1.800 lần thứ mười ba liên tiếp**; tỉ lệ/vite **0 → 0** — **đợt thứ hai liên tiếp đóng ở 0** (152: 82 → 0; 153: 0 → 0). Quyết parent (g) đợt 151 "vẫn chỉ theo dõi" đứng — T9 chỉ theo dõi, không báo riêng, NHƯNG ghi rõ dữ kiện mới: **bảng watch đầy hẳn cả phiên (63.747/63.747) + journal có ≥102 dòng lỗi ENOSPC thật trên HAI boot** (xem §1, §4). Xem §1.
- **Balloon GHIM TRẦN ĐỢT MỚI — 65/131 mẫu (49,6%), 2 chuỗi, MỘT boot (1450ac80):** chuỗi 1 (09:23:56–09:45:57Z, 23 mẫu, 22 phút) + chuỗi 2 (09:49:57–10:30:58Z, 42 mẫu, 41 phút); **cả 2 chuỗi đều quan sát được điểm đứt** (xả 09:46:57Z về 6.282.048 kB; đứt hẳn 10:31:58Z về 6.116.144 kB). **Phán theo quy tắc quyết (e): đợt 153 là đợt ghim MỚI, không nối đợt 152** (giữa lần ghim cuối đợt 152 07:41:33Z và lần chạm đầu đợt 153 09:23:56Z có **HAI reboot (#45 + #46) + balloon xả sâu tới 3.338.876 kB (51,8% trần) + ~1h42m không ghim**) — xem §2.2. T10 xác nhận cách đếm trong đợt (1 episode hay 2 chuỗi).
- **RAM:** sampler **131 mẫu, 08:37:53–10:47:59Z, HAI boot** (28 mẫu boot 401fca75 + 103 mẫu boot 1450ac80; gap 61 s tại reboot #46). Min **324.648 kB (317,0 MiB) lúc 10:46:59Z** (sau khi đứt ghim, balloon bơm lại — thấp nhất kể từ đợt 151: 250.840 kB); max **3.394.288 kB (3.314,7 MiB = 53,95% guard) lúc 09:03:54Z**; mean 1.017.318 kB. Gate A ≥1024 MiB: **43/131 mẫu** (28/28 boot 401fca75 + 15/103 boot 1450ac80). **0/131 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ bảy liên tiếp.** Xem §2, §3.
- **B2: 15 spike load1 ≥3,0 — TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN**, 8 spike boot 401fca75 (T1 verify/render + testsrc2 + find của T0) + 7 spike bão sau reboot #46 (apt-get + hole-recheck76 của T2 + hatch daemon); **0 spike sau 09:09:29Z (~98 phút yên tới lúc đóng)**. Đỉnh **6,04 lúc 09:05:57Z** (bão sau reboot); sampler load1 max **6,04 lúc 09:05:55Z**. **ffmpeg testsrc2 geq là driver của 2/15 spike** (delta tick max đợt **146**). Xem §2.5.
- **Lượt yên #22 (T4): CÓ LƯỢT HỢP LỆ MỚI #21 — attempt2-401fca75, 08:59:22–09:02:43Z, 20/20 + lớp B 5/5 + tickCost median 40,0 ms** (có biên an toàn, khác đợt 152 đúng ngưỡng 60,0 ms). (c2) 7 occurrence, tất cả lag +1f; **P3' 7/7 ĐẠT trong lượt** — cộng dồn **P3' 39/41** (xem xét P3' đã xong, kết luận (b): 2 tick không đạt đợt 151 là MỘT event thật, verdict ghost-freeze đứng nguyên). T9 chỉ đối chiếu bằng dữ kiện sampler độc lập, không phán lại: cửa sổ attempt load1 sampler 1,85 / 2,27 / 0,88, RAM 1.948.708–2.032.060 kB, gate A MỞ 3/3. Xem §2.3, §2.4.
- **WFS #59 (T2): chênh 0 — lần thứ 59 liên tiếp** (NEWSTD 980 dòng / 284 file; R7b 1.005 / 301; copies 25 / 17). T9 chỉ trích lại, không tự đếm.
- **Reboot #46 giữa phiên (btime 09:04:49Z, boot 401fca75 → 1450ac80):** sampler + watcher chết theo reboot, T9 khởi động lại bằng tay 09:05:55Z, gap phủ sóng 61 s. **Dấu hiệu đồng hồ: btime boot mới (09:04:49Z) SỚM HƠN 5 s so với mẫu cuối boot cũ (09:04:54Z)** — đồng hồ lùi ≥5 s tại #46 (cùng họ #44 ≥10 s, #41 ≥+20 s, #42 15 s). T2-153 ghi nghịch lý đồng hồ **≥ +50'26" tại #45 — lớn nhất chuỗi**. Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: ≥102 dòng trên HAI boot** — boot 401fca75: **≥21 dòng** (đếm 09:03:27Z, 08:36:25Z–09:03:27Z, cadence ~70 s; journal boot cũ mất sau reboot #46 nên số cuối không kiểm được); boot 1450ac80: **81 dòng** (09:06:43–10:49:01Z, vẫn tăng ~70 s/dòng lúc đóng). Tất cả cùng thông điệp `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. Đợt thứ hai liên tiếp bảng watch cạn gây lỗi thật thấy được (đợt 152: 35 dòng). Xem §4.
- **T5-153 (đối chiếu):** watcher-152 chết theo #44, KHÔNG có watcher mới; boot #45 replay muộn 63 phút; **kết luận (b): watcher CẦN cơ chế respawn tối thiểu sau reboot** (phác thảo, KHÔNG code ngay — parent quyết); T5-153 KHÔNG chạy repair, KHÔNG chạy postboot check-only. Xem §5.2.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round153-t9/k8-headroom.py` (copy y nguyên từ đợt 152 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 153

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 08:38:02Z 20/11 | **0** | 401fca75 (btime 07:32:38Z) | lần đo 1, boot ~1h05' tuổi; RAM trước đo 1.136.696 kB, balloon 5.704.848 kB, load1 2,34 |
| 08:38:06Z 20/11 | **0** | 401fca75 | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 1.123.328 kB, balloon 5.704.848 kB, load1 2,39 |
| 10:47:35Z 20/11 | **0** | 1450ac80 (btime 09:04:49Z) | lần đo 3 (đóng phiên, boot mới sau reboot #46); RAM trước đo 390.236 kB, balloon 6.092.748 kB, load1 0,65 |
| 10:47:38Z 20/11 | **0** | 1450ac80 | lần đo 4 (chênh **0** so với lần 3); RAM trước đo 537.680 kB, balloon 5.896.140 kB, load1 0,59 |
| 10:47:44Z 20/11 | **0** | 1450ac80 | lần đo 5 (xác nhận thêm, do 0 là giá trị cực trị); RAM trước đo 582.616 kB, balloon 5.830.604 kB, load1 không ghi lại |

- Probe dừng ở `i=0` cả năm lần — `inotify_add_watch` ĐẦU TIÊN đã trả errno 28 (không thêm được watch nào), đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau mỗi lần đo).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 0 = **63.747 watch** lúc mở VÀ lúc đóng (**bảng watch đầy hẳn cả phiên**, qua reboot #46 — reboot không nhả watch ngoài cell).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): 0 / 1.578 = **0** mở đợt và đóng phiên — **đợt thứ hai liên tiếp đóng ở 0** (đợt 152: 0,052 → 0; đợt 153: 0 → 0).
- T5-153 KHÔNG probe lại headroom đợt này (như đợt 151/152) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 2 lần đo mở chênh 0 + 3 lần đo đóng đều 0 + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal HAI boot có ≥102 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM trước đo lần đóng (~390–583 MB) thấp hơn lần mở (~1,1 GB) trong khi headroom giữ 0 cả hai đầu. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước) — reboot #46 cũng không khôi phục headroom (0 mở trên boot cũ → 0 đóng trên boot mới).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–152 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 152 | 82 → 0 | mở 05:39:00Z boot 18e179e0 btime 05:20:57Z → đóng 07:42:43Z boot MỚI c741f5e6 btime 07:04:11Z (reboot #44 GIỮA phiên; lần đo xác nhận thứ ba 07:43:11Z cũng 0) |
| **153** | **0 → 0** | **mở 08:38:02Z boot 401fca75 btime 07:32:38Z → đóng 10:47:35Z boot MỚI 1450ac80 btime 09:04:49Z (reboot #46 GIỮA phiên; lần đo xác nhận thứ ba 10:47:44Z cũng 0)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU — và reboot không khôi phục.** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**. Bước giảm đợt này: −82 so với đóng đợt 152 ở đầu phiên (qua reboot #45); thêm 0 trong phiên, qua reboot #46 — **headroom đã chạm sàn 0 và ở lì đó cả phiên**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ mười ba liên tiếp.** Quyết parent đợt 151 (g): VẪN CHỈ THEO DÕI — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): headroom giữ đúng 0 cả phiên (không còn watch nào để cấp từ đầu tới cuối) + journal có ≥102 dòng lỗi ENOSPC thật của systemd trên HAI boot trong phiên** — đợt thứ hai liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Mốc mới: headroom = 0 CẢ PHIÊN — lần đầu mở phiên đã 0** (đợt 152 mở 82 rồi mới về 0 lúc đóng). Một vite mới cần ~1.578 watch sẽ không thêm được watch nào nếu khởi động lúc này (vite đang chạy giữ nguyên watch của nó — vòng lặp vẫn chạy vì vite tạm dùng 0 watch).
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 08:37Z, lúc đo probe 08:38:02Z và lúc đóng 10:47:44Z — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.747 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler 131 mẫu, 08:37:53–10:47:59Z, HAI boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên (balloon xả sau reboot #45) → bão sau reboot #46 → trũng sâu lúc ghim trần (68 mẫu gate A ĐÓNG) → đứt ghim, balloon bơm lại, RAM rơi xuống min phiên

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **131 mẫu, 08:37:53Z–10:47:59Z 20/11, HAI boot — gap duy nhất 61 s tại reboot #46** (mẫu cuối boot cũ 09:04:54Z → mẫu đầu boot mới 09:05:55Z; sampler + watcher khởi động lại bằng tay — xem §5.1). Tổng quan: **min 324.648 kB (317,0 MiB) lúc 10:46:59Z (sau đứt ghim, balloon bơm lại); max 3.394.288 kB (3.314,7 MiB) lúc 09:03:54Z — 53,95% guard; mean 1.017.318 kB (993,5 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 08:37:53–09:04:54Z | 401fca75 | 1.121.408–3.394.288 kB | RAM cao, dao động theo tải suite T1 (spike load1 tới 5,29 — xem §2.5); đỉnh phiên 09:03:54Z (balloon min phiên 3.338.876 kB cùng lúc); gate A MỞ 28/28 mẫu |
| 09:05:55–09:22:56Z | 1450ac80 | 583.528–2.590.748 kB | Sau reboot #46: RAM hồi 1,89M kB rồi rơi dần khi balloon leo lại 5,02M → 6,41M kB; SwapFree nhảy lên 1.040.736 kB (swap xả theo reboot) rồi tụt về ~700k kB; gate A MỞ 13/18 mẫu; load1 max phiên 6,04 (bão sau reboot — xem §2.5) |
| 09:23:56–10:30:58Z | 1450ac80 | 504.776–703.940 kB | **Ghim trần 65 mẫu trong 2 chuỗi** (xem §2.2); RAM trũng sâu, min chuỗi 504.776 kB; **gate A ĐÓNG cả 68 mẫu** (kể cả 3 mẫu break giữa hai chuỗi); load1 ≤0,87 (yên hoàn toàn về tải) |
| 10:31:58–10:47:59Z | 1450ac80 | 324.648–1.717.576 kB | **Đứt ghim 10:31:58Z** (balloon xả về 6.116.144 kB, RAM hồi 1.717.576 kB lúc 10:33:58Z) rồi balloon bơm lại 5,17M → 6,22M kB, RAM rơi xuống **min phiên 324.648 kB lúc 10:46:59Z**; gate A MỞ 2/17 mẫu; load1 ≤1,89 |

- **Gate A ≥1024 MiB: 43/131 mẫu** (28 mẫu boot 401fca75 + 15 mẫu boot 1450ac80); **0 mẫu ≥ guard**; load1 max (sampler) **6,04 lúc 09:05:55Z**; **9/131 mẫu load1 ≥3,0** (5 mẫu boot 401fca75 trong 08:44–08:53Z + 4 mẫu boot 1450ac80 trong 09:05–09:09Z — trùng các cụm spike §2.5). **RAM <500 MiB: 5 mẫu** (504.776 kB trong chuỗi ghim + 324.648 / 362.908 / 419.188 / 477.728 kB sau đứt ghim).
- Swap: SwapFree 810.708 kB (mẫu đầu) → 602.956 kB (mẫu cuối); dao động 596.060–1.040.736 kB — nhảy lên >1.040.736 kB ngay sau reboot #46 (09:05:55Z) rồi tụt dần về ~600–700k kB.
- Đối chiếu T4-153 (poller, attempt2 08:59:22–09:02:43Z): RAM các mẫu sampler trong cửa sổ attempt 1.948.708–2.032.060 kB khớp T4 ghi B5 RAM min 1.597 MB (chênh pha lấy mẫu — xem §2.3). T4 ghi gate0: poller chờ cửa rồi attempt2 chạy sau 1 retry (attempt1 wedged).
- **Đối chiếu T1-153 (§4): RAM đỉnh 3.394.288 kB = 53,95% guard + min 474.688 kB của đợt 152 đối chiếu từ log gốc khớp T9/T10 — T1-153 xác nhận số T9-152; số T9-153 chờ T1-154 đối chiếu.** (T1-153 verify đợt 152, không phải đợt 153.)
- Mẫu 09:03:54Z (ngay trước reboot #46): RAM vọt 1.256.368 → 3.394.288 kB, balloon xả sâu 4.584.060 → 3.338.876 kB trong 60 s — balloon xả mạnh đúng lúc trước reboot; T9 ghi đúng số đo, không phán cơ chế (cùng mẫu với đợt 152: xả sâu đúng lúc attempt T4 kết thúc).

### 2.2 Balloon virtio — GHIM TRẦN ĐỢT MỚI 65/131 mẫu, 2 chuỗi, MỘT boot; 1 EPISODE MỚI

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot 401fca75: GHIM TRẦN 0/28 mẫu** — balloon dao động 3.338.876–5.704.848 kB, chưa leo tới trần trong cả thời gian boot này còn sống trong phiên.
- **Boot 1450ac80 (sau reboot #46): GHIM TRẦN 65/103 mẫu (63,1%), trong 2 chuỗi:**
  - **Chuỗi 1: 09:23:56–09:45:57Z, 23 mẫu** (span 1.321 s, 22 phút); đứt 09:46:57Z (balloon xả về 6.282.048 kB = 97,5% trần), 09:47:57Z 6.285.136 kB, leo lại 6.381.940 kB lúc 09:48:57Z (99,0% trần, chưa ghim) rồi ghim lại.
  - **Chuỗi 2 (chuỗi dài nhất đợt): 09:49:57–10:30:58Z, 42 mẫu, 41 phút** (span 2.461 s); **đứt 10:31:58Z (balloon xả về 6.116.144 kB, RAM hồi 1.717.576 kB lúc 10:33:58Z) — quan sát được điểm đứt**.
- **Tổng ghim trần đợt này: 65/131 mẫu (49,6%) — tỉ lệ cao nhất từ trước tới nay trong chuỗi T9** (đợt 152: 27/124 = 21,8%; đợt 151: 31/134 = 23,1%; đợt 150: 28/97 = 28,9%). **Cả 2 chuỗi đều quan sát được điểm đứt** (giống đợt 152: 5/5 chuỗi đứt quan sát được; khác đợt 151: chạm cuối còn mở lúc đóng).
- **Phán theo quy tắc quyết (e) (T9 phán phần liên-đợt, giao T10 xác nhận cách đếm trong đợt):**
  - **Đợt 153 là đợt ghim MỚI, không nối đợt 152:** giữa lần ghim cuối đợt 152 (chạm 07:41:33Z, boot c741f5e6, đứt quan sát được 07:42:34Z) và lần chạm đầu đợt 153 (09:23:56Z, boot 1450ac80) có **HAI reboot (#45 btime 07:32:38Z + #46 btime 09:04:49Z) + balloon xả sâu tới 3.338.876 kB (51,8% trần) lúc 09:03:54Z + ~1h42m không ghim** (07:41:33Z → 09:23:56Z) — đủ cả ba điều kiện của quyết (e) (reboot + xả sâu + thời gian không ghim). **Đợt 153 = 1 EPISODE MỚI, chứa 2 chuỗi** (theo cách đếm quyết (g) đợt 152: 1 episode đợt ghim mới, chứa N chuỗi).
  - **Trong đợt 153:** T9 trình bày theo cách đếm của đợt 150/151/152 (chuỗi = mẫu ghim liên tiếp): 2 chuỗi (23 + 42). Việc gọi là 1 episode hay 2 chuỗi là phán của T10 — T9 chỉ đưa dữ kiện đầy đủ + cách đếm tham chiếu. Lưu ý cho T10: chuỗi 1 và 2 cách nhau 3 mẫu không ghim (xả tới 6,28M kB, 97,5% trần — KHÔNG phải xả sâu, chỉ là dip dưới trần); cả hai chuỗi cùng boot 1450ac80, không có reboot ở giữa.
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~505–704.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 10:47:59Z: tổng RAM 8.124.900 kB − balloon 5.830.604 kB = 2.294.296 kB còn lại; MemAvailable 624.996 kB.

### 2.3 Lượt yên WebKit #22 (T4, đợt 153) — CÓ LƯỢT HỢP LỆ MỚI #21, median 40,0 ms (CÓ BIÊN AN TOÀN)

- **T4-153 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND153_T4_WEBKIT_QUIET22_LIMITS.md`) — T9 trích verdict T4 + đối chiếu bằng dữ kiện sampler độc lập, không phán lại.
- **Verdict T4: #22 CÓ LƯỢT HỢP LỆ MỚI #21 — attempt2-401fca75, 08:59:22–09:02:43Z, 20/20 + lớp B ĐẠT 5/5 + tickCost median 40,0 ms ≤60 (CÓ biên an toàn 20 ms — khác đợt 152 đúng ngưỡng 60,0 ms).** Ngân sách dùng 2/3 attempt (attempt1 wedged sau pass 16, 3 fetch writePartial timeout 30 s, exit=2, partial 16/20 — KHÔNG tính verdict, retry đúng luật). Coverage (c2) 7 occurrence, tất cả lag +1f — mẫu "sạch" kiểu A, không có lag5 (b) nào. **P3' 7/7 ĐẠT trong lượt này** — mẫu seq-365 KHÔNG tái diễn. Cộng dồn (21 lượt): P1 69/69, P2 60/60, P3-A1 61/69, **P3' 39/41**, P7 55/55. Poller thoát exit 0 lúc 09:03:09Z. **XEM XÉT P3' ĐÃ XONG (hạn một đợt, quyết parent (d) đợt 152): kết luận (b) — 2 tick không đạt đợt 151 là MỘT event thật (seq 365), cơ chế thứ hai "catch-up lag sau đóng băng", KHÔNG phải artifact đo; verdict ghost-freeze đứng nguyên; P3' nghiêm ngặt vẫn không tròn (39/41) — parent quyết (§9 T4).**
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Cửa sổ attempt2 (08:59:22–09:02:43Z): sampler load1 **1,85 / 2,27 / 0,88** (08:59:54Z–09:01:54Z) — **yên về tải, corroborate verdict hợp lệ của T4** (T4 ghi B2 load1 max 2,48; sampler max trong attempt 2,27 — chênh pha lấy mẫu). RAM trong cửa sổ này 1.948.708–2.032.060 kB (gate A MỞ cả 3 mẫu trong attempt; mẫu 09:02:54Z sau attempt 1.256.368 kB — vẫn MỞ).
  - Cửa sổ attempt1 wedged (08:56:15–08:58:55Z): sampler load1 **0,92 / 1,38 / 0,60**, RAM 1.399.720–1.644.456 kB, gate A MỞ 3/3 — **attempt1 wedged KHÔNG phải do tải hay RAM** (yên hoàn toàn; T4 ghi nguyên nhân là fetch writePartial timeout — T9 chỉ corroborate điều kiện môi trường yên).
  - Mẫu 09:03:54Z (45 s sau poller thoát): RAM **3.394.288 kB**, balloon xả sâu **4.584.060 → 3.338.876 kB** trong 60 s — balloon xả mạnh đúng lúc sau khi đo xong. T9 ghi đúng số đo, không phán cơ chế.
- **Hệ quả gate (T8-153, chưa đóng lúc T9 đóng — T10 xác nhận):** O8 đợt 153 chạy sau lượt yên hợp lệ #21; chuỗi WebKit FULL PASS đang 10 (đợt 152) — T9 chỉ trích lại, không phán gate. T0-153 ghi O8 JSON stamped kiểm chứng: WebKit FAIL 3/4 lúc kiểm giữa phiên (chữ ký kẹt mới F-153-T0-1) — T8 là chủ quản, T9 không phán.
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ chờ/attempt của T4 (độc lập, cadence 60 s)

Poller T4 chạy ~08:39Z–09:03:09Z trên boot 401fca75 (attempt1 08:56:15–08:58:55Z wedged; attempt2 08:59:22–09:02:43Z hợp lệ).

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 08:56:54–08:58:54Z | 401fca75 | 0,92 / 1,38 / 0,60 | 1.399.720–1.644.456 kB — **gate A MỞ** | Attempt1 WEDGED (fetch timeout sau pass 16) — môi trường yên, không phải do tải/RAM |
| 08:59:22–09:02:43Z (attempt2) | 401fca75 | 0,88–2,27 (3 mẫu trong attempt) | 1.948.708–2.032.060 kB — **gate A MỞ** | **Attempt2: lượt hợp lệ #21** (T4: 20/20, B 5/5, median 40,0 ms) — sampler T9 corroborate yên |
| 09:02:54Z | 401fca75 | 0,99 | 1.256.368 kB — **gate A MỞ** | 11 s sau attempt2 kết thúc; RAM đã rơi khỏi đỉnh attempt |
| 09:03:54Z | 401fca75 | 0,78 | 3.394.288 kB — **gate A MỞ** | 45 s sau poller thoát: balloon xả sâu 4.584.060 → 3.338.876 kB (xem §2.3) |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 15 spike, TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN (8 spike boot 401fca75 + 7 spike bão sau reboot #46; 0 spike sau 09:09:29Z)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-153-T9-5). **15 spike, tất cả trong 08:44:55–09:09:29Z; 0 spike trong 09:09:29Z–10:47:59Z (~98 phút yên, gồm toàn bộ lúc balloon ghim trần trên boot mới).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — T1 verify: render + mask_anim (3 spike) | 08:44:55–08:46:06Z | 4,52 / 3,57 / 3,26 | 3 | ffmpeg render.js 130%, delta **134** (spike 1); mask_anim.py 100%, delta **101** (spike 2); mask_anim.py delta 46 + python3 `-` delta 50 + apt-get 45,5% tức thời, delta 0 (spike 3) | **Suite verify T1-153 + job render U4 (mask_anim)** — cùng họ đợt 152 (ffmpeg render.js, mask_anim); spike 3 apt-get là replay của T5 bắt đầu chạy |
| 2 — T1 testsrc2 + T0 find (5 spike) | 08:50:42–08:53:03Z | 3,52 / 4,71 / **5,29** / 3,78 / 3,46 | 5 | ffmpeg testsrc2 geq 1280x720 90%, delta 122 (spike 4); ffmpeg testsrc2 geq 1920x1080 163,6%, delta **146** (spike 5 — max delta đợt); ffmpeg 100% (pid 33447, chết trước delta) + find T0 delta 7 + node test_v19_pixelate_probe delta 3 (spike 6); load1 dư, find D-state delta 10 (spike 7); load1 dư, find D-state delta 11 (spike 8) | **Test render pixelate geq trong suite T1-153** (spike 4–6) + **find boot survey của T0-153** (`find /workspace -newermt 2026-11-20 08:18:19 UTC`, D-state, spike 6–8); spike 7–8 chỉ còn load1 dư, không process đốt CPU tại snapshot |
| 3 — Bão sau reboot #46 (7 spike) | 09:05:57–09:09:29Z | **6,04** / 5,11 / 3,74 / 3,85 / 3,73 / 3,20 / 3,38 | 7 | hatch daemon delta 29 + apt-get mới khởi động (spike 9); apt-get 90%, delta 68 (spike 10); apt-get delta 96 (pid 3403, chết trước top) + hole-recheck76.py delta 26 (spike 11); apt-get 81,8%, delta 26 + hole-recheck76 delta 28 (spike 12); apt-get 100% + hole-recheck76 delta 29 (spike 13); dpkg-preconfig 90% + hole-recheck76 delta 20 (spike 14); load1 dư, top cao nhất 10% (chính `top` của watcher) (spike 15) | **Dư load1 từ cơn bão sau reboot** (daemon khởi động lại + apt replay + **hole-recheck76.py của T2-153**) — load1 là trung bình 1 phút còn dư, không phải tải CPU bền tại thời điểm snapshot (spike 9, 15) |

- **Sau 09:09:29Z tới 10:47:59Z: 0 spike (~98 phút yên)** — gồm toàn bộ lúc balloon ghim trần trên boot mới (chuỗi 1–2); stack đo (grep/ps mỗi phút) không sinh tải đo được; ghim trần không đi kèm tải.
- **Caveat đếm (F-153-T9-5):** `grep -c '=== SPIKE'` thô trả 21 — SAI, vì 6 dòng giả là cmdline của chính lệnh `sleep 1500` chờ của T9 (chứa chuỗi `grep -c '=== SPIKE'`) lọt vào snapshot `ps` trong log. Đếm đúng phải neo đầu dòng: `grep -c '^=== SPIKE'` = **15**. Mọi số spike trong LIMITS này đều đếm neo đầu dòng.
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher (chuỗi `ps -eo pid,ppid` / `ps -eo pid`) xuất hiện 0 lần trong b2-spikes.log** — F-150-T9-8 VẪN ĐÓNG. Lệnh `sleep 1500` của T9 (pid 2063) lọt top snapshot trong 6 spike cụm 3 — đó là lệnh chờ của chính T9 (0% CPU), không phải driver tải; attribution dùng delta tick + top tức thời nên không bị che. Xem F-153-T9-5.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. **Kết luận phương pháp (F-147-T9-6 vẫn đóng):** snapshot tức thời + delta tick + nr_running đã quy được 15/15 spike đợt này.
- **Delta tick lớn nhất đợt: 146 tick/s** (pid 32274, ffmpeg testsrc2 geq 1920x1080, spike 08:51:16Z); render.js 134 tick/s; mask_anim 46–101 tick/s; apt-get 26–96 tick/s; hole-recheck76 20–29 tick/s. (Đợt 152: max 131 tick/s.)
- **testsrc2:** 2/15 spike do testsrc2 geq gây ra (08:50:42Z, 08:51:16Z) + 1 spike có ffmpeg cùng họ (08:51:52Z, pid chết trước delta) — cùng họ test render pixelate geq chạy lại mỗi đợt (như đợt 147–152); mọi PID testsrc2 đều ngắn hạn, thoát bình thường; không process nào kẹt lại. Không mở điều tra thêm (họ F-147/148/149-T9-3 đã ĐÓNG đợt 150).

### 2.6 Truy chủ ffmpeg testsrc2 — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này testsrc2 xuất hiện trong 2/15 spike (3 nếu tính spike 08:51:52Z có ffmpeg cùng họ), tất cả đều là **test render pixelate geq trong suite T1-153** (npm test / test_pixelate_render.js + test_v19_pixelate_probe — spike 4–6) — chạy đúng chức năng, thoát bình thường. T9 không truy chủ lại từng PID (không có spike ngoài họ test render; không process lạ).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (TRỪ GAP 61 S TẠI REBOOT #46); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ bảy liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148/149/150/151/152 giữ nguyên): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **3.394.288 kB = 3.314,7 MiB = 53,95% guard lúc 09:03:54Z** — xa guard 2.897.168 kB. T2-153 đối chiếu độc lập: T1-153 ghi RAM đỉnh đợt 152 là 63,01% guard (số T9-152); số đỉnh đợt 153 chờ T1-154 đối chiếu.
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ bảy liên tiếp (147, 148, 149, 150, 151, 152, 153).** Cơ chế tự động armed cả phiên (sampler `round153-t9/sampler.sh`, pid 2501 rồi pid 1900 sau reboot #46, chạy 08:37:53–10:47:59Z, 131 mẫu — trừ gap 61 s tại #46, xem §5.1) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→153 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 08:37:53–10:47:59Z (131 mẫu, chỉ gap 61 s tại reboot #46 rồi khởi động lại bằng tay); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 152 nằm trong dir round152-t9 nên không chặn đợt này (dir mới round153-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-153-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-153-birefnet/out-birefnet-153.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147/148/149/150/151/152):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-153-T9-3); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-153-T9-2 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này: reboot #46 giết sampler, gap 61 s** (đợt 152: gap 71 s; đợt 151: gap 46 s; đợt 149: gap 87 s) — dữ kiện này KHÔNG ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" ở mức tuyệt đối, nhưng gap 61 s là nhỏ và T9 khởi động lại bằng tay kịp thời; T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10. **Bổ sung đợt 153: T5-153 kết luận (b) watcher CẦN cơ chế respawn tối thiểu sau reboot (thiệt hại đo được: replay boot #45 muộn 63 phút) — cùng họ vấn đề với sampler T9; T9 chỉ nêu dữ kiện, giao parent/T10 (T5 là chủ quản).**
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Journal trên boot 1450ac80: 81 dòng "No space left" / ENOSPC** (kiểm tra 10:49Z, `journalctl -b -0 --grep` — đếm 81 dòng lúc 10:49:01Z, vẫn tăng ~70 s/dòng). Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`, từ 09:06:43Z tới 10:49:01Z, cadence ~70 s (systemd thử lại việc thêm watch và thất bại lặp lại). **Đây là đợt thứ hai liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: 81 dòng trên boot mới).
- **Journal trên boot 401fca75: ≥21 dòng** (đếm 09:03:27Z, từ 08:36:25Z, cadence ~70 s — đếm giữa phiên, lúc T9 kiểm). **Tổng phiên: ≥102 dòng trên HAI boot** (21 + 81). Journal chỉ liệt kê **1 boot tại mỗi thời điểm kiểm** (`journalctl --list-boots`: chỉ 401fca75 lúc 08:37Z, chỉ 1450ac80 sau reboot #46, first entry 09:05:06Z) — journald không giữ lại journal của boot cũ (volatile), nên **không kiểm được số cuối ENOSPC trên boot 401fca75 sau reboot** — ghi rõ giới hạn này (T5/T6 có nguồn khác thì đối chiếu).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=0 ×5 lần — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo); **(2) ≥102 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 0 — **không thêm được watch nào cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Reboot #46 (giữa phiên) — sampler/watcher chết theo, khởi động lại bằng tay

- **Boot lúc mở đợt 153 = 401fca75-bece-45b6-88fa-b12f602d6390** (btime **07:32:38Z** — `uptime -s` 07:32:38 + `/proc/stat` btime 1795159958 KHỚP nhau; T0-153/T5-153 cũng ghi btime này; đây là **reboot #45, xảy ra TRƯỚC phiên** — T0-153 phát hiện: boot cũ c741f5e6 CÒN SỐNG tới ≥08:18:19Z, overlap ≥45m41s với boot mới — #45 KHÔNG phải reboot tại chỗ kiểu cũ, mà là migration/overlap; T2-153 chứng nhận mù #77? (#45) bổ sung).
- **Reboot #46 GIỮA phiên T9:** sampler cũ (pid 2501) + watcher cũ (pid 2527) chết theo reboot; sleep chờ của T9 bị gián đoạn lúc ~09:05Z (exec service cũng restart cùng lúc). Mẫu cuối sampler cũ: **09:04:54Z boot=401fca75 mem=3.088.280 bal=3.700.036 load1=0,75**. Boot mới **1450ac80** (btime **09:04:49Z** — `uptime -s` 09:04:49 + `/proc/stat` btime 1795165489 KHỚP nhau; journal first entry 09:05:06Z). **Sampler + watcher khởi động lại bằng tay lúc 09:05:55Z** (sampler pid 1900, watcher pid 1920; mẫu đầu boot mới 09:05:55Z mem=1.892.232 bal=5.023.556 swapfree=1.040.736 load1=6,04). **Gap phủ sóng sampler: 61 s** (09:04:54Z → 09:05:55Z). B2 watcher: 0 spike nào bị mất chắc chắn trong gap (gap 61 s, watcher cadence 30 s — tối đa 2–3 lần kiểm bị mất; load1 trong gap theo sampler: 0,75 → 6,04 — spike 09:05:57Z bắt được bão sau reboot ngay lần kiểm đầu).
- **⚠️ DẤU HIỆU ĐỒNG HỒ TẠI #46 (ghi rõ cho T1/T2/T7): btime boot mới (09:04:49Z) SỚM HƠN 5 s so với mẫu cuối boot cũ (09:04:54Z).** Mẫu cuối boot cũ được ghi bằng `date -u` của sampler ngay trước reboot; btime boot mới (đọc từ `/proc/stat` + `uptime -s`, khớp nhau) lại sớm hơn 5 s. Nghĩa là **đồng hồ lùi ≥5 s tại reboot #46** (hoặc btime có offset so với wall clock) — cùng họ với tranh chấp clock các đợt trước (#41 ≥+20 s, #42 15 s, #44 ≥10 s — quyết (d) đợt 151 đã ghi vào hồ sơ chính thức). **Bổ sung: T4-153 ghi uptime lúc 09:11:16Z là 6 phút → boot ≈09:05:16Z, lệch ~27 s so với btime 09:04:49Z** — cùng họ mâu thuẫn đồng hồ, giao T2/T5 phán (T5-153 §5 đã nêu mâu thuẫn đồng hồ mới). T9 không phán cơ chế đồng hồ — chỉ ghi dữ kiện thô + mốc: sampler cũ chết ~09:04:54–09:05:55Z; journal boot mới first entry 09:05:06Z. T2/T7 đối chiếu khi gộp mốc reboot #46.
- **Tuổi thọ boot 401fca75:** btime 07:32:38Z → btime boot mới 09:04:49Z = **5.531 s = 1h32m11s** (stat→stat). T7/T2 đối chiếu mốc neo khi gộp.
- **Không có nghịch lý đồng hồ nào khác trong dữ kiện T9:** mọi timestamp còn lại thứ tự nhất quán. T9 không phán tranh chấp clock T1–T2.
- Các cờ .done lúc T9 đóng (~10:53Z): t0, t1, t2, t4, t5, t6 (6/9 — T7, T8 còn chạy; chỉ còn T9 chưa đóng lúc 10:53Z).

### 5.2 T5-153 — watcher chết theo #44 + replay muộn + kết luận (b) (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **Watcher-152 chết theo reboot #44** (log dừng 07:04:36Z, 0 NEWBOOT, không watcher nào chạy từ đó tới nay); **boot #45 replay bắt đầu muộn boot+63'02" và hệ thống chỉ đủ 11 gói lúc ~boot+76'**, chậm ~38' so với đường watcher ở #43 (cờ boot+37'55"). **Kết luận (b) — watcher CẦN cơ chế respawn tối thiểu sau reboot** (phác thảo ở §7 T5, KHÔNG code ngay — parent quyết). T5-153 KHÔNG khởi động watcher mới, KHÔNG chạy repair, KHÔNG chạy postboot check-only (replay đang giữ lock apt + T0-153 đang làm boot survey — tránh tranh chấp).
- **Reboot #46 đối với T5:** T5-153 đóng cờ trước #46 (T5 .done đã có lúc T9 kiểm ~09:03Z); replay/postboot trên boot 1450ac80 thuộc cửa T5-154. T9 không phán.

### 5.3 Reboot #45 (trước phiên) — T0-153/T2-153 phát hiện (T9 chỉ ghi lại để đối chiếu)

- T0-153: boot lúc mở đợt là **401fca75 (btime 07:32:38Z), KHÔNG phải c741f5e6 như brief giả định**. Reboot #45 xảy ra sau #44 (btime 07:04:11Z); **boot cũ c741f5e6 CÒN SỐNG tới ≥08:18:19Z (overlap ≥45m41s)** — #45 khác mẫu reboot #38–#44 (boot cũ không bị giết tại btime mới). T2-153 chứng nhận mù #77? (#45) bổ sung theo nợ T1-153; **nghịch lý đồng hồ ≥ +50'26" tại #45 — lớn nhất chuỗi**. T9 chỉ ghi lại; T0/T2 là chủ quản.
- **Đính chính T2-153 (F-153-T2-1, T9 ghi lại):** prereg T2-153 ghi sai btime #44 (lấy 07:32:38Z — thực ra đó là btime #45) — đã bắt được bằng ghi chép T7-152/T9-152. Cửa sổ probe #71 → #72 chứa **HAI reboot (#44 + #45)** — cùng mẫu đợt 152 (#42 + #43).

## 6. Sai số của chính T9 (ghi rõ)

- **F-153-T9-1 — Headroom 0 → 0: GIỮ MỨC 0 CẢ PHIÊN, dưới ngưỡng lần thứ mười ba liên tiếp, tỉ lệ/vite 0 cả hai đầu.** Không phải sai số đo (2 lần đo mở chênh 0, 3 lần đo đóng đều 0; phương pháp không đổi từ đợt 109; journal có ≥102 dòng ENOSPC thật trên 2 boot corroborate độc lập). Ghi rõ: quyết "chỉ theo dõi" (g) đợt 151 vẫn đứng; T9 không tự đổi ngưỡng hay yêu cầu user hành động — nhưng dữ kiện mới (0 cả phiên + ≥102 dòng lỗi ENOSPC thật) giao parent/T10 xem lại quyết (g). Trần 63.747 không đổi trong phiên. T5-153 không probe lại headroom nên không có số đối chiếu độc lập đợt này.
- **F-153-T9-2 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ bảy liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-153-T9-3 — Khoảng trống lấy mẫu 60 giây (cùng lớp F-148/F-149/F-150/F-151/F-152-T9-3):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Cơ chế tự động chỉ kích hoạt trên mẫu quan sát được — đây là giới hạn thiết kế đã biết, không phải lỗi vận hành. Thêm: **gap 61 s tại reboot #46** là khoảng trống thứ hai (không mẫu nào trong 09:04:54–09:05:55Z) — một lần vượt guard trong gap đó cũng không được quan sát (khả năng thấp: RAM lúc 09:04:54Z là 3.088.280 kB và lúc 09:05:55Z là 1.892.232 kB, đều xa guard).
- **F-153-T9-4 — Script thống kê chỉ báo gap lớn NHẤT ĐẦU TIÊN, BẮT ĐƯỢC VÀ GHI ĐỦ TRƯỚC KHI ĐÓNG (không ảnh hưởng số cuối):** `stats-appendix.py` báo "max inter-sample gap: 61 s (08:51:53Z -> 08:52:54Z)" — đúng là 61 s nhưng đó là gap do jitter cadence cùng boot; **gap reboot #46 (09:04:54Z -> 09:05:55Z) cũng 61 s** và script không liệt kê vì chỉ giữ max đầu tiên (so sánh `>` nghiêm ngặt). Đã kiểm bằng awk trực tiếp trên log gốc: cả hai gap đều 61 s, không có gap nào khác >61 s. LIMITS này ghi đủ cả hai gap. Bài học cùng họ quyết (p): số liệu chỉ lấy từ output script, nhưng script cũng phải đối chiếu thủ công các trường hợp biên (max bằng nhau).
- **F-153-T9-5 — Lỗi đếm spike thô, BẮT ĐƯỢC VÀ SỬA TRƯỚC KHI ĐÓNG (không ảnh hưởng số cuối):** `grep -c '=== SPIKE'` thô trả 21 — SAI, vì 6 dòng giả là cmdline của chính lệnh `sleep 1500` chờ của T9 (chứa chuỗi `grep -c '=== SPIKE'`) lọt vào snapshot `ps` trong b2-spikes.log. Đếm đúng neo đầu dòng: `grep -c '^=== SPIKE'` = **15**. Mọi số spike trong LIMITS này đều đếm neo đầu dòng. Lệnh `sleep 1500` của T9 (pid 2063, 0% CPU) còn lọt top snapshot trong 6 spike cụm 3 — đó là lệnh chờ của chính T9, không phải driver tải; attribution dùng delta tick + top tức thời nên không bị che. Fix (n) (loại `ps` của watcher) vẫn đứng; không sửa watcher thêm — nhưng T9 đợt sau nên đếm spike bằng `^=== SPIKE` ngay từ đầu và tránh để cmdline chờ chứa chuỗi trùng mẫu đếm.
- **F-153-T9-6 — Giả định giữa phiên "ghim liên tục 65 mẫu" là SAI, script bắt được trước khi đóng:** lúc kiểm giữa phiên 09:56Z T9 ghi nháp "ghim liên tục từ 09:23:56Z" (đếm 30 mẫu ghim lúc đó); thực tế script thống kê cho thấy **2 chuỗi (23 + 42) với break 3 mẫu 09:46:57–09:48:57Z** (balloon xả về 6.282.048 kB = 97,5% trần). Mọi số ghim trong LIMITS này đều từ script đã kiểm chứng trên log gốc. Cùng bài học quyết (p) + F-152-T9-4: script thống kê phải chạy trên log đầy đủ trước khi phán chuỗi.
- **F-153-T9-7 — Ghi nháp sai số reboot trong file làm việc (đã đính chính trước khi đóng):** `reboot45-restart-note.txt` ban đầu ghi reboot giữa phiên "có thể là #45" — SAI, theo T2-153/T4-153 đó là **#46** (boot #45 là 401fca75, btime 07:32:38Z). Đã append đính chính vào chính file đó lúc 10:52Z; LIMITS này dùng #46 xuyên suốt.
- **F-153-T9-8 — Reboot #46 giết sampler/watcher (gap 61 s) + dấu hiệu đồng hồ lùi ≥5 s:** xem §5.1. Gap nhỏ (đợt 152: 71 s; đợt 151: 46 s; đợt 149: 87 s) và T9 khởi động lại bằng tay kịp thời; dữ kiện này để parent/T10 xem lại quyết (q) "không cần cơ chế tự hồi phục lúc này" — T9 không đề xuất đổi. Dấu hiệu đồng hồ (btime mới sớm hơn mẫu cuối cũ 5 s; T4 ghi thêm lệch ~27 s giữa btime và uptime) giao T2/T5.
- **F-153-T9-9 — T9 KHÔNG phán verdict #22, không phán B4 đúng/sai, không phán cách đếm ghim trong đợt — chỉ đối chiếu dữ kiện:** T4 đã xuất bản LIMITS nên T9 trích verdict T4 (#21 hợp lệ, median 40,0 ms) + bảng sampler độc lập §2.4. T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối). Về balloon: T9 phán đợt 153 là đợt ghim MỚI theo quy tắc (e) (đủ 3 điều kiện liên-đợt — xem §2.2) nhưng giao T10 phán cách đếm trong đợt (1 episode hay 2 chuỗi).
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước (copy y nguyên script đợt 152, cap 30.000 thống nhất); file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 154 (phần T9)

1. **Cơ chế tự động (a) armed nhưng chưa có lần kích hoạt thật — lần thứ bảy liên tiếp** (0 mẫu ≥ guard đợt này): giữ nguyên sampler + trigger cho đợt 154 (lockfile + log theo phiên mới — lockfile đợt 153 nằm trong dir round153-t9 nên không chặn đợt 154; mỗi đợt dùng dir riêng). Nếu cửa sổ mở lại, cơ chế sẽ bắt trong ≤60 s. Guard giữ nguyên 6.144 MiB; u2net là fallback chính thức. Lần FIRE thật đầu tiên vẫn chưa kiểm chứng end-to-end (F-153-T9-2). **Đỉnh RAM đợt này 53,95% guard — thấp hơn đợt 152 (63,01%).**
2. **⚠️ Headroom 0 → 0 — VẪN DƯỚI < ~1.800, lần thứ mười ba liên tiếp dưới ngưỡng** (quyết parent đợt 151 (g): vẫn chỉ theo dõi). **Tỉ lệ/vite 0 cả phiên — lần đầu mở phiên đã 0; bảng watch đầy hẳn (63.747/63.747) cả phiên; journal có ≥102 dòng lỗi ENOSPC thật của systemd trên HAI boot trong phiên.** Giao parent/T10 xem lại quyết (g) với dữ kiện mới này. Trần 63.747 không đổi.
3. **Balloon: GHIM TRẦN ĐỢT MỚI — 65/131 mẫu (49,6%), 2 chuỗi, 1 episode** (chuỗi dài nhất 09:49:57–10:30:58Z, 42 mẫu, 41 phút; cả 2 chuỗi đều quan sát được điểm đứt) sau đợt 152 ghi 27/124 mẫu, 5 chuỗi. **Giao T10 xác nhận cách đếm trong đợt** (1 episode hay 2 chuỗi — xem §2.2). Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146.
4. **Lượt yên #22 CÓ lượt hợp lệ mới #21** (attempt2-401fca75, 20/20, B 5/5, median 40,0 ms — CÓ biên an toàn); (c2) 7 occurrence, tất cả lag +1f; **P3' 7/7 trong lượt, cộng dồn 39/41 — xem xét P3' ĐÃ XONG, kết luận (b): 2 tick không đạt đợt 151 là event thật, verdict ghost-freeze đứng nguyên** (parent quyết §9 T4). O8 đợt 153 + chuỗi WebKit FULL PASS chờ T8/T10 xác nhận (T0-153 ghi WebKit FAIL 3/4 lúc kiểm giữa phiên, chữ ký kẹt mới F-153-T0-1 — T8 chủ quản).
5. **Mù #76?/#77? (T2-153) — VẪN MỞ theo luật gap** (chuỗi đóng hoàn toàn giữ 9; CERT/FULL giữ 73/88); INSIDE chuỗi 4→5, 5→6, 6→7 ỨNG VIÊN (T2, chờ parent xác nhận). Nghịch lý đồng hồ ≥ +50'26" tại #45 (lớn nhất chuỗi) + dấu hiệu đồng hồ lùi ≥5 s tại #46 giao T2/T5/T7 đối chiếu.
6. Các nợ đứng khác giữ nguyên từ đợt 152 §7 (G1 khung (a) M2 vẫn hoãn chờ user; R9 (a) vẫn chờ user; ci-security.yml vẫn 403 chờ user; file oversize 6,4 MB vẫn chưa quyết; TTS 39 cấm kiểm lại; mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143).

Thống kê: samples: 131 (28 mau boot 401fca75 + 103 mau boot 1450ac80); mem min: 324,648 kB (317.0 MiB) luc 10:46:59Z; mem max: 3,394,288 kB (3314.7 MiB = 53.95% guard) luc 09:03:54Z; mem mean: 1017318 kB (993.5 MiB); count >=1024 MiB (gate A): 43/131; count >= guard 6144 MiB: 0/131; balloon frozen 6,443,824: 65/131 (chuoi 1: 09:23:56Z–09:45:57Z n=23; chuoi 2: 09:49:57Z–10:30:58Z n=42); balloon min: 3,338,876 kB luc 09:03:54Z; balloon max: 6,443,824 kB; load1 max (sampler): 6.04 luc 09:05:55Z; load1 >=3.0 samples: 9/131; max inter-sample gap: 61 s (08:51:53Z -> 08:52:54Z, 401fca75 -> 401fca75); gaps >90s: khong co

## Phụ lục A — Bảng sampler đầy đủ (131 mau: 28 mau boot 401fca75 + 103 mau boot 1450ac80; khong gap >90 s)

(File gốc: `hidden_files/round153-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó.)

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-20T08:37:53Z | 401fca75 | 1,136,020 | 1109.4 | 18.06% | 5,704,848 | 810,708 | 2.40 |
| 2 | 2026-11-20T08:38:53Z | 401fca75 | 1,999,928 | 1953.1 | 31.79% | 4,918,416 | 747,752 | 1.83 |
| 3 | 2026-11-20T08:39:53Z | 401fca75 | 2,012,220 | 1965.1 | 31.98% | 4,798,768 | 752,548 | 2.28 |
| 4 | 2026-11-20T08:40:53Z | 401fca75 | 1,834,932 | 1791.9 | 29.17% | 5,009,964 | 759,736 | 2.37 |
| 5 | 2026-11-20T08:41:53Z | 401fca75 | 1,658,348 | 1619.5 | 26.36% | 5,219,616 | 760,476 | 1.09 |
| 6 | 2026-11-20T08:42:53Z | 401fca75 | 1,410,064 | 1377.0 | 22.41% | 5,410,628 | 756,600 | 0.72 |
| 7 | 2026-11-20T08:43:53Z | 401fca75 | 1,905,892 | 1861.2 | 30.29% | 4,744,512 | 732,160 | 1.87 |
| 8 | 2026-11-20T08:44:53Z | 401fca75 | 1,849,500 | 1806.2 | 29.40% | 4,950,728 | 696,680 | 4.30 |
| 9 | 2026-11-20T08:45:53Z | 401fca75 | 1,121,408 | 1095.1 | 17.82% | 4,692,652 | 690,612 | 3.35 |
| 10 | 2026-11-20T08:46:53Z | 401fca75 | 2,774,908 | 2709.9 | 44.11% | 4,028,916 | 686,960 | 1.58 |
| 11 | 2026-11-20T08:47:53Z | 401fca75 | 2,086,652 | 2037.7 | 33.17% | 3,662,232 | 689,656 | 0.83 |
| 12 | 2026-11-20T08:48:53Z | 401fca75 | 1,297,184 | 1266.8 | 20.62% | 3,762,984 | 678,052 | 0.37 |
| 13 | 2026-11-20T08:49:53Z | 401fca75 | 2,028,160 | 1980.6 | 32.24% | 3,946,340 | 676,780 | 0.31 |
| 14 | 2026-11-20T08:50:53Z | 401fca75 | 1,964,188 | 1918.2 | 31.22% | 4,176,184 | 676,204 | 4.10 |
| 15 | 2026-11-20T08:51:53Z | 401fca75 | 1,660,080 | 1621.2 | 26.39% | 4,375,596 | 682,264 | 5.29 |
| 16 | 2026-11-20T08:52:54Z | 401fca75 | 1,705,196 | 1665.2 | 27.10% | 4,562,168 | 680,292 | 3.73 |
| 17 | 2026-11-20T08:53:54Z | 401fca75 | 2,228,848 | 2176.6 | 35.43% | 4,028,448 | 652,244 | 2.47 |
| 18 | 2026-11-20T08:54:54Z | 401fca75 | 2,040,976 | 1993.1 | 32.44% | 4,191,900 | 652,700 | 1.28 |
| 19 | 2026-11-20T08:55:54Z | 401fca75 | 1,843,152 | 1800.0 | 29.30% | 4,395,108 | 654,848 | 1.06 |
| 20 | 2026-11-20T08:56:54Z | 401fca75 | 1,644,456 | 1605.9 | 26.14% | 4,288,908 | 653,104 | 0.92 |
| 21 | 2026-11-20T08:57:54Z | 401fca75 | 1,399,720 | 1366.9 | 22.25% | 4,470,092 | 651,348 | 1.38 |
| 22 | 2026-11-20T08:58:54Z | 401fca75 | 1,465,852 | 1431.5 | 23.30% | 4,657,968 | 673,420 | 0.60 |
| 23 | 2026-11-20T08:59:54Z | 401fca75 | 2,032,060 | 1984.4 | 32.30% | 3,887,356 | 683,652 | 1.85 |
| 24 | 2026-11-20T09:00:54Z | 401fca75 | 2,018,208 | 1970.9 | 32.08% | 4,104,556 | 694,456 | 2.27 |
| 25 | 2026-11-20T09:01:54Z | 401fca75 | 1,948,708 | 1903.0 | 30.97% | 4,345,092 | 699,796 | 0.88 |
| 26 | 2026-11-20T09:02:54Z | 401fca75 | 1,256,368 | 1226.9 | 19.97% | 4,584,060 | 698,648 | 0.99 |
| 27 | 2026-11-20T09:03:54Z | 401fca75 | 3,394,288 | 3314.7 | 53.95% | 3,338,876 | 699,860 | 0.78 |
| 28 | 2026-11-20T09:04:54Z | 401fca75 | 3,088,280 | 3015.9 | 49.09% | 3,700,036 | 701,732 | 0.75 |
| — | — | — | — | — | — | — | — | — |
| 29 | 2026-11-20T09:05:55Z | 1450ac80 | 1,892,232 | 1847.9 | 30.08% | 5,023,556 | 1,040,736 | 6.04 |
| 30 | 2026-11-20T09:06:56Z | 1450ac80 | 1,862,764 | 1819.1 | 29.61% | 4,957,512 | 969,400 | 3.87 |
| 31 | 2026-11-20T09:07:56Z | 1450ac80 | 2,181,684 | 2130.6 | 34.68% | 4,512,280 | 873,600 | 3.81 |
| 32 | 2026-11-20T09:08:56Z | 1450ac80 | 2,590,352 | 2529.6 | 41.17% | 4,315,672 | 819,472 | 4.39 |
| 33 | 2026-11-20T09:09:56Z | 1450ac80 | 2,590,748 | 2530.0 | 41.18% | 4,121,420 | 817,396 | 2.64 |
| 34 | 2026-11-20T09:10:56Z | 1450ac80 | 2,427,932 | 2371.0 | 38.59% | 4,414,072 | 815,260 | 1.02 |
| 35 | 2026-11-20T09:11:56Z | 1450ac80 | 2,271,096 | 2217.9 | 36.10% | 4,681,272 | 811,248 | 0.77 |
| 36 | 2026-11-20T09:12:56Z | 1450ac80 | 1,977,824 | 1931.5 | 31.44% | 4,921,688 | 812,636 | 0.52 |
| 37 | 2026-11-20T09:13:56Z | 1450ac80 | 1,758,124 | 1716.9 | 27.94% | 5,138,048 | 812,828 | 0.23 |
| 38 | 2026-11-20T09:14:56Z | 1450ac80 | 1,586,580 | 1549.4 | 25.22% | 5,336,508 | 805,684 | 0.21 |
| 39 | 2026-11-20T09:15:56Z | 1450ac80 | 1,446,592 | 1412.7 | 22.99% | 5,519,172 | 798,596 | 0.28 |
| 40 | 2026-11-20T09:16:56Z | 1450ac80 | 1,280,980 | 1251.0 | 20.36% | 5,687,624 | 793,692 | 0.15 |
| 41 | 2026-11-20T09:17:56Z | 1450ac80 | 1,113,348 | 1087.3 | 17.70% | 5,839,852 | 793,000 | 0.05 |
| 42 | 2026-11-20T09:18:56Z | 1450ac80 | 992,120 | 968.9 | 15.77% | 5,979,236 | 790,556 | 0.02 |
| 43 | 2026-11-20T09:19:56Z | 1450ac80 | 876,712 | 856.2 | 13.93% | 6,102,016 | 773,936 | 0.04 |
| 44 | 2026-11-20T09:20:56Z | 1450ac80 | 768,072 | 750.1 | 12.21% | 6,216,032 | 769,484 | 0.22 |
| 45 | 2026-11-20T09:21:56Z | 1450ac80 | 664,500 | 648.9 | 10.56% | 6,319,516 | 768,788 | 0.19 |
| 46 | 2026-11-20T09:22:56Z | 1450ac80 | 583,528 | 569.9 | 9.27% | 6,413,732 | 759,484 | 0.13 |
| 47 | 2026-11-20T09:23:56Z | 1450ac80 | 531,232 | 518.8 | 8.44% | 6,443,824 | 741,816 | 0.16 |
| 48 | 2026-11-20T09:24:56Z | 1450ac80 | 536,160 | 523.6 | 8.52% | 6,443,824 | 729,232 | 0.27 |
| 49 | 2026-11-20T09:25:56Z | 1450ac80 | 568,588 | 555.3 | 9.04% | 6,443,824 | 728,668 | 0.16 |
| 50 | 2026-11-20T09:26:56Z | 1450ac80 | 543,220 | 530.5 | 8.63% | 6,443,824 | 728,284 | 0.16 |
| 51 | 2026-11-20T09:27:56Z | 1450ac80 | 549,880 | 537.0 | 8.74% | 6,443,824 | 727,452 | 0.09 |
| 52 | 2026-11-20T09:28:56Z | 1450ac80 | 544,576 | 531.8 | 8.66% | 6,443,824 | 727,584 | 0.03 |
| 53 | 2026-11-20T09:29:56Z | 1450ac80 | 542,220 | 529.5 | 8.62% | 6,443,824 | 727,920 | 0.12 |
| 54 | 2026-11-20T09:30:56Z | 1450ac80 | 551,316 | 538.4 | 8.76% | 6,443,824 | 727,048 | 0.19 |
| 55 | 2026-11-20T09:31:56Z | 1450ac80 | 531,172 | 518.7 | 8.44% | 6,443,824 | 725,912 | 0.07 |
| 56 | 2026-11-20T09:32:56Z | 1450ac80 | 549,064 | 536.2 | 8.73% | 6,443,824 | 725,028 | 0.10 |
| 57 | 2026-11-20T09:33:56Z | 1450ac80 | 541,044 | 528.4 | 8.60% | 6,443,824 | 724,504 | 0.03 |
| 58 | 2026-11-20T09:34:56Z | 1450ac80 | 537,948 | 525.3 | 8.55% | 6,443,824 | 725,640 | 0.01 |
| 59 | 2026-11-20T09:35:56Z | 1450ac80 | 575,900 | 562.4 | 9.15% | 6,443,824 | 727,404 | 0.38 |
| 60 | 2026-11-20T09:36:56Z | 1450ac80 | 559,584 | 546.5 | 8.89% | 6,443,824 | 727,004 | 0.36 |
| 61 | 2026-11-20T09:37:56Z | 1450ac80 | 504,776 | 492.9 | 8.02% | 6,443,824 | 719,836 | 0.40 |
| 62 | 2026-11-20T09:38:56Z | 1450ac80 | 544,768 | 532.0 | 8.66% | 6,443,824 | 719,024 | 0.14 |
| 63 | 2026-11-20T09:39:56Z | 1450ac80 | 535,780 | 523.2 | 8.52% | 6,443,824 | 719,056 | 0.05 |
| 64 | 2026-11-20T09:40:56Z | 1450ac80 | 546,584 | 533.8 | 8.69% | 6,443,824 | 719,112 | 0.08 |
| 65 | 2026-11-20T09:41:57Z | 1450ac80 | 563,296 | 550.1 | 8.95% | 6,443,824 | 722,752 | 0.35 |
| 66 | 2026-11-20T09:42:57Z | 1450ac80 | 569,168 | 555.8 | 9.05% | 6,443,824 | 716,544 | 0.21 |
| 67 | 2026-11-20T09:43:57Z | 1450ac80 | 539,564 | 526.9 | 8.58% | 6,443,824 | 707,928 | 0.14 |
| 68 | 2026-11-20T09:44:57Z | 1450ac80 | 539,744 | 527.1 | 8.58% | 6,443,824 | 707,532 | 0.08 |
| 69 | 2026-11-20T09:45:57Z | 1450ac80 | 533,796 | 521.3 | 8.48% | 6,443,824 | 700,096 | 0.87 |
| 70 | 2026-11-20T09:46:57Z | 1450ac80 | 703,940 | 687.4 | 11.19% | 6,282,048 | 664,540 | 0.72 |
| 71 | 2026-11-20T09:47:57Z | 1450ac80 | 691,120 | 674.9 | 10.99% | 6,285,136 | 673,516 | 0.52 |
| 72 | 2026-11-20T09:48:57Z | 1450ac80 | 582,944 | 569.3 | 9.27% | 6,381,940 | 670,300 | 0.34 |
| 73 | 2026-11-20T09:49:57Z | 1450ac80 | 551,468 | 538.5 | 8.77% | 6,443,824 | 670,932 | 0.12 |
| 74 | 2026-11-20T09:50:57Z | 1450ac80 | 562,976 | 549.8 | 8.95% | 6,443,824 | 670,256 | 0.37 |
| 75 | 2026-11-20T09:51:57Z | 1450ac80 | 533,176 | 520.7 | 8.47% | 6,443,824 | 669,192 | 0.22 |
| 76 | 2026-11-20T09:52:57Z | 1450ac80 | 525,800 | 513.5 | 8.36% | 6,443,824 | 667,248 | 0.11 |
| 77 | 2026-11-20T09:53:57Z | 1450ac80 | 534,476 | 521.9 | 8.50% | 6,443,824 | 667,364 | 0.04 |
| 78 | 2026-11-20T09:54:57Z | 1450ac80 | 527,988 | 515.6 | 8.39% | 6,443,824 | 666,628 | 0.36 |
| 79 | 2026-11-20T09:55:57Z | 1450ac80 | 547,744 | 534.9 | 8.71% | 6,443,824 | 665,304 | 0.16 |
| 80 | 2026-11-20T09:56:57Z | 1450ac80 | 516,044 | 503.9 | 8.20% | 6,443,824 | 667,356 | 0.06 |
| 81 | 2026-11-20T09:57:57Z | 1450ac80 | 515,684 | 503.6 | 8.20% | 6,443,824 | 666,664 | 0.02 |
| 82 | 2026-11-20T09:58:57Z | 1450ac80 | 526,156 | 513.8 | 8.36% | 6,443,824 | 666,896 | 0.05 |
| 83 | 2026-11-20T09:59:57Z | 1450ac80 | 525,384 | 513.1 | 8.35% | 6,443,824 | 667,880 | 0.02 |
| 84 | 2026-11-20T10:00:57Z | 1450ac80 | 562,052 | 548.9 | 8.93% | 6,443,824 | 669,952 | 0.07 |
| 85 | 2026-11-20T10:01:57Z | 1450ac80 | 547,460 | 534.6 | 8.70% | 6,443,824 | 669,640 | 0.08 |
| 86 | 2026-11-20T10:02:57Z | 1450ac80 | 523,088 | 510.8 | 8.31% | 6,443,824 | 668,124 | 0.03 |
| 87 | 2026-11-20T10:03:57Z | 1450ac80 | 530,132 | 517.7 | 8.43% | 6,443,824 | 668,376 | 0.04 |
| 88 | 2026-11-20T10:04:57Z | 1450ac80 | 517,788 | 505.7 | 8.23% | 6,443,824 | 670,340 | 0.14 |
| 89 | 2026-11-20T10:05:57Z | 1450ac80 | 600,064 | 586.0 | 9.54% | 6,443,824 | 752,252 | 0.22 |
| 90 | 2026-11-20T10:06:57Z | 1450ac80 | 587,604 | 573.8 | 9.34% | 6,443,824 | 755,048 | 0.08 |
| 91 | 2026-11-20T10:07:57Z | 1450ac80 | 598,744 | 584.7 | 9.52% | 6,443,824 | 765,348 | 0.03 |
| 92 | 2026-11-20T10:08:57Z | 1450ac80 | 591,632 | 577.8 | 9.40% | 6,443,824 | 765,116 | 0.01 |
| 93 | 2026-11-20T10:09:57Z | 1450ac80 | 588,312 | 574.5 | 9.35% | 6,443,824 | 765,144 | 0.00 |
| 94 | 2026-11-20T10:10:57Z | 1450ac80 | 587,544 | 573.8 | 9.34% | 6,443,824 | 765,324 | 0.03 |
| 95 | 2026-11-20T10:11:57Z | 1450ac80 | 579,188 | 565.6 | 9.21% | 6,443,824 | 765,344 | 0.01 |
| 96 | 2026-11-20T10:12:57Z | 1450ac80 | 580,100 | 566.5 | 9.22% | 6,443,824 | 764,864 | 0.06 |
| 97 | 2026-11-20T10:13:57Z | 1450ac80 | 581,180 | 567.6 | 9.24% | 6,443,824 | 765,024 | 0.02 |
| 98 | 2026-11-20T10:14:58Z | 1450ac80 | 576,160 | 562.7 | 9.16% | 6,443,824 | 765,252 | 0.00 |
| 99 | 2026-11-20T10:15:58Z | 1450ac80 | 579,276 | 565.7 | 9.21% | 6,443,824 | 766,412 | 0.06 |
| 100 | 2026-11-20T10:16:58Z | 1450ac80 | 574,484 | 561.0 | 9.13% | 6,443,824 | 767,132 | 0.05 |
| 101 | 2026-11-20T10:17:58Z | 1450ac80 | 549,052 | 536.2 | 8.73% | 6,443,824 | 767,188 | 0.02 |
| 102 | 2026-11-20T10:18:58Z | 1450ac80 | 577,568 | 564.0 | 9.18% | 6,443,824 | 767,308 | 0.00 |
| 103 | 2026-11-20T10:19:58Z | 1450ac80 | 562,952 | 549.8 | 8.95% | 6,443,824 | 767,324 | 0.04 |
| 104 | 2026-11-20T10:20:58Z | 1450ac80 | 579,844 | 566.3 | 9.22% | 6,443,824 | 767,244 | 0.14 |
| 105 | 2026-11-20T10:21:58Z | 1450ac80 | 575,056 | 561.6 | 9.14% | 6,443,824 | 766,440 | 0.11 |
| 106 | 2026-11-20T10:22:58Z | 1450ac80 | 561,504 | 548.3 | 8.92% | 6,443,824 | 766,888 | 0.12 |
| 107 | 2026-11-20T10:23:58Z | 1450ac80 | 561,232 | 548.1 | 8.92% | 6,443,824 | 766,868 | 0.16 |
| 108 | 2026-11-20T10:24:58Z | 1450ac80 | 560,352 | 547.2 | 8.91% | 6,443,824 | 766,816 | 0.06 |
| 109 | 2026-11-20T10:25:58Z | 1450ac80 | 547,836 | 535.0 | 8.71% | 6,443,824 | 766,888 | 0.20 |
| 110 | 2026-11-20T10:26:58Z | 1450ac80 | 559,540 | 546.4 | 8.89% | 6,443,824 | 766,932 | 0.11 |
| 111 | 2026-11-20T10:27:58Z | 1450ac80 | 556,300 | 543.3 | 8.84% | 6,443,824 | 766,976 | 0.04 |
| 112 | 2026-11-20T10:28:58Z | 1450ac80 | 531,088 | 518.6 | 8.44% | 6,443,824 | 758,848 | 0.09 |
| 113 | 2026-11-20T10:29:58Z | 1450ac80 | 529,156 | 516.8 | 8.41% | 6,443,824 | 758,712 | 0.10 |
| 114 | 2026-11-20T10:30:58Z | 1450ac80 | 534,376 | 521.9 | 8.49% | 6,443,824 | 757,936 | 0.11 |
| 115 | 2026-11-20T10:31:58Z | 1450ac80 | 850,488 | 830.6 | 13.52% | 6,116,144 | 654,648 | 0.31 |
| 116 | 2026-11-20T10:32:58Z | 1450ac80 | 1,031,896 | 1007.7 | 16.40% | 5,173,812 | 639,672 | 1.34 |
| 117 | 2026-11-20T10:33:58Z | 1450ac80 | 1,717,576 | 1677.3 | 27.30% | 5,259,736 | 634,260 | 1.30 |
| 118 | 2026-11-20T10:34:58Z | 1450ac80 | 1,623,852 | 1585.8 | 25.81% | 5,381,280 | 633,224 | 1.20 |
| 119 | 2026-11-20T10:35:58Z | 1450ac80 | 829,004 | 809.6 | 13.18% | 5,519,628 | 634,744 | 1.72 |
| 120 | 2026-11-20T10:36:58Z | 1450ac80 | 698,640 | 682.3 | 11.10% | 5,666,708 | 616,824 | 1.89 |
| 121 | 2026-11-20T10:37:59Z | 1450ac80 | 948,856 | 926.6 | 15.08% | 5,362,132 | 621,204 | 0.95 |
| 122 | 2026-11-20T10:38:59Z | 1450ac80 | 962,812 | 940.2 | 15.30% | 5,488,340 | 623,000 | 0.51 |
| 123 | 2026-11-20T10:39:59Z | 1450ac80 | 863,168 | 842.9 | 13.72% | 5,610,404 | 621,624 | 0.35 |
| 124 | 2026-11-20T10:40:59Z | 1450ac80 | 768,620 | 750.6 | 12.22% | 5,723,520 | 625,864 | 0.55 |
| 125 | 2026-11-20T10:41:59Z | 1450ac80 | 655,500 | 640.1 | 10.42% | 5,827,508 | 631,580 | 0.36 |
| 126 | 2026-11-20T10:42:59Z | 1450ac80 | 563,052 | 549.9 | 8.95% | 5,921,260 | 628,272 | 0.23 |
| 127 | 2026-11-20T10:43:59Z | 1450ac80 | 477,728 | 466.5 | 7.59% | 6,006,828 | 623,936 | 0.29 |
| 128 | 2026-11-20T10:44:59Z | 1450ac80 | 419,188 | 409.4 | 6.66% | 6,086,436 | 617,196 | 0.14 |
| 129 | 2026-11-20T10:45:59Z | 1450ac80 | 362,908 | 354.4 | 5.77% | 6,158,060 | 613,328 | 0.14 |
| 130 | 2026-11-20T10:46:59Z | 1450ac80 | 324,648 | 317.0 | 5.16% | 6,223,820 | 596,060 | 0.23 |
| 131 | 2026-11-20T10:47:59Z | 1450ac80 | 624,996 | 610.3 | 9.93% | 5,830,604 | 602,956 | 1.10 |
