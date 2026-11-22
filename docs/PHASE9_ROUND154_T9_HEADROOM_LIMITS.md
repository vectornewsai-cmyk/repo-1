# LIMITS — Phase 9 đợt 154, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ tám liên tiếp; headroom 0 → 0 — giữ mức 0 cả phiên, đợt thứ ba liên tiếp đóng ở 0; balloon GHIM TRẦN ĐỢT MỚI 65/125 mẫu, 4 chuỗi, 1 episode; reboot #49 giữa phiên; ENOSPC ≥90 dòng trên 2 boot; #23 KHÔNG có lượt hợp lệ)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 0/0 (11:37:41Z + 11:37:46Z, boot #48 2c0a7985) → đóng 0/0/0 (13:41:4xZ, boot #49 12fc68a3)** — giữ mức **0 cả phiên**, qua reboot #49; **dưới ngưỡng < ~1.800 lần thứ mười bốn liên tiếp**; tỉ lệ/vite **0 → 0** — **đợt thứ ba liên tiếp đóng ở 0** (152: 82 → 0; 153: 0 → 0; 154: 0 → 0). Quyết parent (h) đợt 153 GIỮ quyết (g) "chỉ theo dõi" — T9 chỉ theo dõi, không báo riêng, NHƯNG ghi rõ dữ kiện mới: **bảng watch đầy hẳn cả phiên (63.747/63.747) + journal có ≥90 dòng lỗi ENOSPC thật trên HAI boot** (xem §1, §4). Xem §1.
- **Balloon GHIM TRẦN ĐỢT MỚI — 65/125 mẫu (52,0%), 4 chuỗi, HAI boot:** chuỗi 1 (12:03:41–12:20:42Z, 18 mẫu, boot #48) + chuỗi 2 (12:24:42–12:42:42Z, 19 mẫu, #48) + chuỗi 3 (12:50:42–13:04:42Z, 15 mẫu, #48 — kết thúc VẪN GHIM, điểm đứt KHÔNG quan sát được, reboot cắt ngang) + chuỗi 4 (13:18:18–13:30:18Z, 13 mẫu, boot #49 — đứt quan sát được 13:31:18Z). **Tỉ lệ ghim 52,0% là cao nhất từ trước tới nay trong chuỗi T9** (153: 49,6%; 152: 21,8%). **Phán theo quy tắc quyết (e): đợt 154 là đợt ghim MỚI, không nối đợt 153** (giữa lần ghim cuối đợt 153 10:30:58Z và lần chạm đầu đợt 154 12:03:41Z có HAI reboot #47 + #48 + balloon xả sâu tới 3.454.424 kB (53,6% trần) lúc 11:46:41Z + ~1h33m không ghim) — xem §2.2. Trong đợt: 4 chuỗi, đề xuất đếm là **1 EPISODE** theo quy tắc (g) đợt 152 — giao T10 xác nhận (đặc biệt chuỗi 4 tách khỏi chuỗi 3 bởi reboot #49).
- **RAM:** sampler **125 mẫu, 11:37:41–13:42:19Z, HAI boot** (88 mẫu boot #48 + 37 mẫu boot #49; gap 95 s tại reboot #49 — gap >61 s DUY NHẤT). Min **405.564 kB (396,1 MiB) lúc 12:11:41Z**; max **3.211.344 kB (3.136,1 MiB = 51,04% guard) lúc 11:43:41Z**; mean 844.524 kB. Gate A ≥1024 MiB: **29/125 mẫu** (19/88 boot #48 + 10/37 boot #49). **0/125 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ tám liên tiếp.** Xem §2, §3.
- **B2: 50 spike load1 ≥3,0 — NHIỀU NHẤT TỪ TRƯỚC TỚI NAY trong chuỗi T9** (153: 15; 152: ~28). 13 spike cụm đầu phiên (suite T1 + O8 T0) + 15 spike bão sau reboot #49 + 6 spike giữa phiên + 16 spike O8/harness T8. **28/50 spike quy được driver process cụ thể** (ffmpeg render/mask_anim/testsrc2, apt-get replay, MiniBrowser/WebKitWebProcess, home-assistant ensure); **22/50 spike chỉ quy được lớp "load1 dư + tải nền ngắn hạn"** (không process đơn lẻ nào đốt CPU tại snapshot — delta tick ≤23, chủ yếu hatch daemon; xem §2.5 + F-154-T9-8). Đỉnh **7,07 lúc 11:40:26Z** (ffmpeg render trim); sampler load1 max **7,39 lúc 11:40:41Z**. **ffmpeg testsrc2 geq là driver của 2/50 spike.** **0 spike nào sau 13:40:31Z tới lúc đóng** (chỉ ~2 phút yên — sampler dừng 13:42:19Z, không có cửa sổ yên dài như đợt 153).
- **Lượt yên WebKit #23 (T4): KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt trong 147 poll** (poller 11:38:16–13:30:00Z, exit 5). Cửa không bao giờ mở: boot #48 RAM sập <1024 MB từ poll #26 (11:57:06Z), không bao giờ hồi; boot #49 load5 KHÔNG BAO GIỜ <2 (min 2,01). **Chuỗi lượt yên hợp lệ DỪNG Ở #21** (đợt 153). P3' cộng dồn KHÔNG ĐỔI: **39/41 occurrence = 39/40 distinct-seq**. T9 chỉ đối chiếu bằng dữ kiện sampler độc lập, không phán lại. Xem §2.3, §2.4.
- **WFS #60 (T2): chênh 0 — lần thứ 60 liên tiếp** (NEWSTD 981 dòng / 285 file; R7b 1.006 / 302; copies 25 / 17). T9 chỉ trích lại, không tự đếm.
- **Reboot #49 giữa phiên (btime 13:05:12Z, boot 2c0a7985 → 12fc68a3):** sampler + watcher chết theo reboot, T9 khởi động lại bằng tay 13:06:17Z, gap phủ sóng 95 s. Số hiệu #49 là ứng viên theo T0/T4-154, chờ T2-155 xác nhận theo đếm chặt. **T4-154 ghi btime boot mới (13:05:12Z) TRƯỚC poll #117 của nó lúc 13:05:32Z — overlap migration ~20 s+, cùng họ #45**; dữ kiện T9 không mâu thuẫn (mẫu cuối boot cũ 13:04:42Z < btime 13:05:12Z). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: ≥90 dòng trên HAI boot** — boot #48: **≥74 dòng** (đếm 12:58Z; số cuối không kiểm được sau reboot #49 vì journal volatile); boot #49: **16 dòng** (13:07:02–13:45:02Z, vẫn tăng lúc đóng). Tất cả cùng thông điệp `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. Đợt thứ ba liên tiếp bảng watch cạn gây lỗi thật thấy được (152: 35 dòng; 153: ≥102 dòng; 154: ≥90 dòng). Xem §4.
- **T5-154 (đối chiếu):** POSTBOOT_PASS cho boot #48 CÓ (11:58:26Z — cờ T5 đầu tiên cho boot mới kể từ #43); boot #49 KHÔNG CÓ cờ T5 (T5 đã đóng). Xem §5.2.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round154-t9/k8-headroom.py` (copy y nguyên từ đợt 153 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 154

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 11:37:41Z 20/11 | **0** | #48 2c0a7985 (btime 11:26:05Z) | lần đo 1, boot ~11' tuổi; RAM trước đo 1.137.008 kB, balloon 5.685.472 kB, load1 1,37 |
| 11:37:46Z 20/11 | **0** | #48 2c0a7985 | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 1.142.940 kB, balloon 5.685.472 kB, load1 1,37 |
| 13:41:4xZ 20/11 | **0** | #49 12fc68a3 (btime 13:05:12Z) | lần đo 3 (đóng phiên, boot mới sau reboot #49; 3 lần chạy liên tiếp trong một lệnh, lệnh kết thúc 13:41:47Z); RAM trước đo 661.684 kB, balloon 5.750.828 kB, load1 1,59 |
| 13:41:4xZ 20/11 | **0** | #49 12fc68a3 | lần đo 4 (chênh **0** so với lần 3); RAM trước đo 658.396 kB, balloon 5.750.828 kB, load1 1,59 |
| 13:41:4xZ 20/11 | **0** | #49 12fc68a3 | lần đo 5 (xác nhận thêm, do 0 là giá trị cực trị); RAM trước đo 652.692 kB, balloon 5.750.828 kB, load1 1,59 |

- Probe dừng ở `i=0` cả năm lần — `inotify_add_watch` ĐẦU TIÊN đã trả errno 28 (không thêm được watch nào), đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau mỗi lần đo).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 0 = **63.747 watch** lúc mở VÀ lúc đóng (**bảng watch đầy hẳn cả phiên**, qua reboot #49 — reboot không nhả watch ngoài cell).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): 0 / 1.578 = **0** mở đợt và đóng phiên — **đợt thứ ba liên tiếp đóng ở 0** (đợt 152: 0,052 → 0; đợt 153: 0 → 0; đợt 154: 0 → 0).
- T5-154 KHÔNG probe lại headroom đợt này (như đợt 151/152/153) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 2 lần đo mở chênh 0 + 3 lần đo đóng đều 0 + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal HAI boot có ≥90 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM trước đo lần đóng (~653–662 MB) thấp hơn lần mở (~1,1 GB) trong khi headroom giữ 0 cả hai đầu. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước) — reboot #49 cũng không khôi phục headroom (0 mở trên boot cũ → 0 đóng trên boot mới).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–153 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 153 | 0 → 0 | mở 08:38:02Z boot 401fca75 btime 07:32:38Z → đóng 10:47:35Z boot MỚI 1450ac80 btime 09:04:49Z (reboot #46 GIỮA phiên; lần đo xác nhận thứ ba 10:47:44Z cũng 0) |
| **154** | **0 → 0** | **mở 11:37:41Z boot #48 2c0a7985 btime 11:26:05Z → đóng 13:41:4xZ boot MỚI #49 12fc68a3 btime 13:05:12Z (reboot #49 GIỮA phiên; lần đo xác nhận thứ ba cũng 0)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 VÀ Ở LÌ ĐÓ — reboot không khôi phục.** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**. Bước giảm đợt này: 0 (đã ở sàn từ đầu phiên, qua reboot #49).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ mười bốn liên tiếp.** Quyết parent đợt 153 (h): GIỮ quyết (g) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): headroom giữ đúng 0 cả phiên lần thứ ba liên tiếp (không còn watch nào để cấp từ đầu tới cuối, qua reboot #49) + journal có ≥90 dòng lỗi ENOSPC thật của systemd trên HAI boot trong phiên** — đợt thứ ba liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Mốc mới: headroom = 0 CẢ PHIÊN lần thứ hai liên tiếp — và là đợt thứ ba liên tiếp đóng ở 0.** Một vite mới cần ~1.578 watch sẽ không thêm được watch nào nếu khởi động lúc này (vite đang chạy giữ nguyên watch của nó — vòng lặp vẫn chạy vì vite tạm dùng 0 watch).
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 11:37Z và lúc đóng 13:41Z — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.747 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler 125 mẫu, 11:37:41–13:42:19Z, HAI boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên (suite burst + balloon xả) → sập dưới gate A, ghim trần dài (52 mẫu gate A ĐÓNG liên tiếp) → bão sau reboot #49 → ghim lại → đứt ghim, RAM hồi nhẹ lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **125 mẫu, 11:37:41Z–13:42:19Z 20/11, HAI boot — gap duy nhất 95 s tại reboot #49** (mẫu cuối boot cũ 13:04:42Z → mẫu đầu boot mới 13:06:17Z; sampler + watcher khởi động lại bằng tay — xem §5.1). Tổng quan: **min 405.564 kB (396,1 MiB) lúc 12:11:41Z (trong chuỗi ghim 1); max 3.211.344 kB (3.136,1 MiB) lúc 11:43:41Z — 51,04% guard; mean 844.524 kB (824,7 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 11:37:41–11:47:41Z | #48 | 1.162.056–3.211.344 kB | Suite T1 burst (spike load1 tới 7,39 — xem §2.5); đỉnh phiên 11:43:41Z (balloon min phiên 3.509.160 kB cùng lúc); gate A MỞ 11/11 mẫu |
| 11:48:41–11:55:41Z | #48 | 1.207.208–2.607.632 kB | RAM rơi đơn điệu khi balloon leo 4,06M → 5,60M kB; gate A MỞ 8/8 mẫu (mẫu cuối MỞ 11:55:41Z, 1.207.208 kB) |
| 11:56:41–13:04:42Z | #48 | 405.564–1.026.680 kB | **Ghim trần 52 mẫu trong 3 chuỗi** (xem §2.2); RAM trũng sâu, min phiên 12:11:41Z; **gate A ĐÓNG cả 69 mẫu**; load1 ≤1,33 (yên hoàn toàn về tải, trừ 2 mẫu break ghim 1,33 / 0,92) |
| 13:06:17–13:12:18Z | #49 | 1.104.304–1.920.656 kB | Sau reboot #49: RAM hồi 1,86M kB rồi rơi dần khi balloon leo lại 4,96M → 5,85M kB; SwapFree nhảy lên 1.040.576 kB (swap xả theo reboot) rồi tụt về ~820k kB; gate A MỞ 7/7 mẫu; load1 2,32–5,91 (bão sau reboot — xem §2.5) |
| 13:13:18–13:33:19Z | #49 | 519.124–1.086.280 kB | Balloon ghim lại chuỗi 4 (13:18:18–13:30:18Z, 13 mẫu); gate A MỞ 0/21 mẫu; load1 1,34–6,08 (O8 T8 bắt đầu 13:31Z — xem §2.5) |
| 13:34:19–13:42:19Z | #49 | 633.292–1.572.560 kB | **Đứt ghim 13:31:18Z** (balloon xả về 6.247.216 kB rồi sâu 5.264.176 kB lúc 13:32:19Z, RAM hồi 1.572.560 kB lúc 13:36:19Z) rồi balloon bơm lại 5,03M → 5,82M kB, RAM rơi xuống 633.292 kB lúc đóng; gate A MỞ 3/9 mẫu; load1 0,93–5,45 (harness T8) |

- **Gate A ≥1024 MiB: 29/125 mẫu** (19/88 boot #48 + 10/37 boot #49); **0 mẫu ≥ guard**; load1 max (sampler) **7,39 lúc 11:40:41Z**; **28/125 mẫu load1 ≥3,0**. **RAM <500 MiB: 52 mẫu** (tính theo <512.000 kB).
- Swap: SwapFree 849.204 kB (mẫu đầu) → 628.612 kB (mẫu cuối); dao động 596–1.040.576 kB — nhảy lên 1.040.576 kB ngay sau reboot #49 (13:06:17Z) rồi tụt dần về ~600–630k kB.
- Đối chiếu T4-154 (§1): RAM ≥1024 chỉ 25/117 poll trên boot #48 (toàn bộ poll #1–#25); sampler T9: gate A MỞ 19/88 mẫu trên #48, mẫu cuối MỞ 11:55:41Z — khớp T4 "RAM <1024 từ poll #26 (11:57:06Z), không bao giờ hồi" (chênh pha lấy mẫu ~1 phút). T4 ghi RAM min 401 MB / max 2991 MB trên #48; sampler T9: min 405.564 kB (396,1 MiB) / max 3.211.344 kB (3.136,1 MiB) — max chênh do cadence lấy mẫu (T4 poll ~45 s, T9 60 s; T1 ghi RAMavail lúc mở suite 1.232 MB — cùng cửa sổ).
- Mẫu 11:43:41Z (đỉnh phiên): RAM 3.211.344 kB, balloon xả 3.865.204 → 3.509.160 kB — balloon xả mạnh đúng lúc suite T1 chạy (cùng mẫu đợt 152/153: xả sâu đúng lúc đo xong / suite chạy). T9 ghi đúng số đo, không phán cơ chế.

### 2.2 Balloon virtio — GHIM TRẦN ĐỢT MỚI 65/125 mẫu, 4 chuỗi, HAI boot; 1 EPISODE MỚI (đề xuất)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #48: GHIM TRẦN 52/88 mẫu (59,1%), trong 3 chuỗi:**
  - **Chuỗi 1: 12:03:41–12:20:42Z, 18 mẫu** (span 1.061 s, ~18 phút); đứt 12:21:42Z (balloon xả về 6.247.216 kB = 97,0% trần), 12:22:42Z 6.302.552 kB, 12:23:42Z 6.394.504 kB (99,2% trần, chưa ghim) rồi ghim lại.
  - **Chuỗi 2: 12:24:42–12:42:42Z, 19 mẫu** (span 1.080 s, 18 phút); đứt 12:43:42Z (balloon xả về 6.247.216 kB = 97,0% trần), 12:44:42Z 6.090.000 kB (94,5% trần — điểm xả sâu nhất của break này), leo lại 6.379.824 kB lúc 12:49:42Z (99,0% trần) rồi ghim lại.
  - **Chuỗi 3: 12:50:42–13:04:42Z, 15 mẫu** (span 840 s, 14 phút); **KẾT THÚC VẪN GHIM — điểm đứt KHÔNG quan sát được** (mẫu cuối boot cũ 13:04:42Z vẫn bal=6.443.824; reboot #49 lúc 13:05:12Z cắt ngang). Đây là điểm khác đợt 153 (cả 2 chuỗi đều đứt quan sát được).
- **Boot #49 (sau reboot #49): GHIM TRẦN 13/37 mẫu (35,1%), trong 1 chuỗi:**
  - **Chuỗi 4: 13:18:18–13:30:18Z, 13 mẫu** (span 720 s, 12 phút); **đứt 13:31:18Z (balloon xả về 6.247.216 kB, RAM hồi 697.496 kB) rồi xả sâu 5.264.176 kB lúc 13:32:19Z (81,7% trần, RAM hồi 901.012 kB)** — quan sát được điểm đứt + xả sâu.
- **Tổng ghim trần đợt này: 65/125 mẫu (52,0%) — tỉ lệ cao nhất từ trước tới nay trong chuỗi T9** (đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%; đợt 151: 31/134 = 23,1%). **3/4 chuỗi quan sát được điểm đứt; chuỗi 3 KHÔNG** (reboot cắt ngang).
- **Phán theo quy tắc quyết (e) (T9 phán phần liên-đợt, giao T10 xác nhận cách đếm trong đợt):**
  - **Đợt 154 là đợt ghim MỚI, không nối đợt 153:** giữa lần ghim cuối đợt 153 (chạm 10:30:58Z, boot 1450ac80, đứt quan sát được 10:31:58Z) và lần chạm đầu đợt 154 (12:03:41Z, boot 2c0a7985) có **HAI reboot (#47 btime 11:06:40Z + #48 btime 11:26:05Z) + balloon xả sâu tới 3.454.424 kB (53,6% trần) lúc 11:46:41Z + ~1h33m không ghim** (10:30:58Z → 12:03:41Z) — đủ cả ba điều kiện của quyết (e) (reboot + xả sâu + thời gian không ghim). **Đợt 154 = 1 EPISODE MỚI, chứa 4 chuỗi** (theo cách đếm quyết (g) đợt 152: 1 episode đợt ghim mới, chứa N chuỗi).
  - **Trong đợt 154:** T9 trình bày theo cách đếm của đợt 150/151/152/153 (chuỗi = mẫu ghim liên tiếp): 4 chuỗi (18 + 19 + 15 + 13). Việc gọi là 1 episode hay nhiều episode là phán của T10 — T9 chỉ đưa dữ kiện đầy đủ + cách đếm tham chiếu. Lưu ý cho T10: chuỗi 1–2–3 cùng boot #48, cách nhau bởi dip NÔNG (97,0% và 94,5% trần — KHÔNG phải xả sâu); chuỗi 4 tách khỏi chuỗi 3 bởi reboot #49, nhưng balloon VẪN GHIM tới tận lúc reboot và chỉ xả tới 5.017.992 kB (77,9% trần) ở mẫu đầu boot mới — KHÔNG xả sâu kiểu 53,6% như giữa hai đợt — rồi ghim lại sau ~13 phút. T9 đề xuất đếm cả 4 chuỗi là 1 episode (áp dụng lại quy tắc (g) theo đợt), nhưng ghi rõ chuỗi 4 là điểm cần T10 phán riêng: nếu T10 áp chuẩn "reboot + xả sâu" cho cả trong đợt thì chuỗi 4 có thể tính là episode thứ hai trong đợt.
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~406–704.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 13:42:19Z: tổng RAM 8.124.900 kB − balloon 5.817.088 kB = 2.307.812 kB còn lại; MemAvailable 633.292 kB.

### 2.3 Lượt yên WebKit #23 (T4, đợt 154) — KHÔNG CÓ LƯỢT HỢP LỆ, 0 attempt (chuỗi hợp lệ DỪNG Ở #21)

- **T4-154 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND154_T4_WEBKIT_QUIET23_LIMITS.md`) — T9 trích verdict T4 + đối chiếu bằng dữ kiện sampler độc lập, không phán lại.
- **Verdict T4: #23 KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt trong 147 poll thật trên 2 boot** (poller 11:38:16–13:30:00Z, exit 5, hết hạn cắt 13:30Z). Ngân sách 3 attempt KHÔNG DÙNG (0/3). **Cửa yên KHÔNG BAO GIỜ MỞ:** boot #48 RAM ≥1024 chỉ 25/117 poll (toàn bộ poll #1–#25); **<500 MB: 73/117 (62%)**, chuỗi dài nhất 27 poll (12:01:37–12:21:10Z); boot #49 **load5 KHÔNG BAO GIỜ <2 (min 2,01, 0/30)**. 8 poll duy nhất load + RAM cùng đạt (#18–#25, 11:51:05–11:56:21Z) đều bị chặn bởi **apt=1 + gate0=khong-dat** (T5 đang repair apt-get; cờ T5 chưa tới). **Chuỗi lượt yên hợp lệ DỪNG Ở #21** (đợt 153) — KHÔNG CÓ lượt hợp lệ mới #22. Cộng dồn 21 lượt GIỮ NGUYÊN: P1 69/69, P2 60/60, P3-A1 61/69, **P3' 39/41 occurrence = 39/40 distinct-seq**, P7 55/55. Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 + GAP §82 (quyết parent (d)(i) đợt 153); helper distinct-seq đã kiểm chứng trên dữ liệu 151 (8/9) và 153 (7/7).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Gate A RAM: mẫu cuối MỞ trên boot #48 là **11:55:41Z (1.207.208 kB)**; từ **11:56:41Z (1.026.680 kB) tới 13:04:42Z: 0/69 mẫu MỞ** — khớp T4 "RAM <1024 từ poll #26 (11:57:06Z), không bao giờ hồi" (chênh pha lấy mẫu ~1 phút).
  - RAM <500 MiB: sampler T9 **52/125 mẫu <512.000 kB**; T4 **74/147 poll <500 MB** — cùng kết luận (RAM sập kéo dài), số khác do cadence + đơn vị đếm khác nhau (T4 poll ~45 s, đơn vị MB thập phân).
  - Tải: sampler load1 max **7,39 lúc 11:40:41Z** (trong lúc suite T1 chạy); T4 ghi load1 0,08–6,83 trên boot #48 — đỉnh chênh do pha lấy mẫu khác nhau, không mâu thuẫn. Trên boot #49, sampler load1 ≥3,0 trong 13/37 mẫu — corroborate T4 "load5 KHÔNG BAO GIỜ <2" (tải nền cao kéo dài sau reboot).
  - T4 §5 trích sampler T9-154 (mem min 405.564 kB, bal=6443824 ghim trần) làm bằng chứng balloon là nguyên nhân RAM sập — T9 xác nhận số trích đó khớp log gốc đợt này.
- **Hệ quả gate (T8-154, chưa đóng lúc T9 đóng — T10 xác nhận):** T8-154 waiter t4=0 suốt (GATE-NOT-YET poll 64 lúc 12:41:23Z theo T4) — O8 đợt này không qua gate chuẩn từ phía T4 (T8 tự quyết thủ tục (i) như đợt 153 nếu áp dụng). T9 chỉ trích lại, không phán gate.
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy 11:38:16–13:30:00Z trên 2 boot (117 poll #48 + 30 poll #49; 0 attempt).

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 11:38:41–11:47:41Z | #48 | 3,29–7,39 (8 mẫu) | 1.312.776–3.211.344 kB — **gate A MỞ 8/8** | Suite T1 (11:38:51–11:46:27Z) + O8 T0 attempt2 từ 11:43Z — tải cao nhưng RAM còn MỞ |
| 11:48:41–11:55:41Z | #48 | 0,44–1,54 (8 mẫu) | 1.207.208–2.607.632 kB — **gate A MỞ 8/8** | Yên về tải; RAM rơi đơn điệu theo balloon leo |
| 11:56:41–13:04:42Z | #48 | 0,05–1,33 (69 mẫu) | 405.564–1.026.680 kB — **gate A ĐÓNG 69/69** | **RAM sập kéo dài, balloon ghim 52 mẫu trong 3 chuỗi** — cửa T4 không mở vì RAM (T4: 0 poll ≥1024 từ #26) |
| 13:06:17–13:12:18Z | #49 | 2,32–5,91 (7 mẫu) | 1.104.304–1.920.656 kB — **gate A MỞ 7/7** | Bão sau reboot #49; T4: load5 vẫn ≥2,01 nên cửa vẫn đóng dù RAM MỞ |
| 13:13:18–13:29:18Z | #49 | 1,34–6,08 (17 mẫu) | 519.124–1.086.280 kB — **gate A MỞ 0/17** | Balloon ghim lại chuỗi 4; T4 poller hết hạn 13:30:00Z, exit 5 |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 50 spike, 28 QUY ĐƯỢC DRIVER CỤ THỂ + 22 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ" (nhiều nhất chuỗi T9; 0 spike sau 13:40:31Z tới lúc đóng)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-154-T9-5). **50 spike, trong 11:38:41–13:40:31Z; 0 spike trong 13:40:31Z–13:42:19Z (chỉ ~2 phút tới lúc sampler dừng — KHÔNG có cửa sổ yên dài như đợt 153).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — Suite T1 + O8 T0 (13 spike) | 11:38:41–11:47:12Z | 3,25–**7,07** | 13 | tsc --noEmit delta **80** (spike 2); grep DIAG137 delta 47 (spike 3); ffmpeg trim red30 109% (spike 4, chết trước delta); ffmpeg trim red60 delta **128** (spike 5 — max delta đợt); mask_anim.py delta 78–91 + ffmpeg ffv1 delta 87 (spike 6–8); clicktest-87o8-mask-track-webkit.mjs (spike 9, delta thấp); ffmpeg testsrc2 640x360 111% (spike 10, chết trước delta); ffmpeg testsrc2 geq 1920x1080 delta **103** + hole-recheck78.py delta 8 (spike 11); apt methods/store + daemon (spike 12–13, delta ≤23) | **Suite T1-154 (11:38:51–11:46:27Z, 28/28) + O8 T0 attempt2 từ 11:43Z** — cùng họ đợt 153 (tsc, ffmpeg render, mask_anim, testsrc2 geq); spike 1 (daemon delta 15) + spike 9/12/13 là lớp load1 dư (xem dưới) |
| 2 — Bão sau reboot #49 (15 spike) | 13:06:17–13:16:31Z | 3,08–5,93 | 15 | hatch daemon delta 31 + apt methods/store 24 (spike 14); apt-get delta 33 (spike 15); apt-get 37,2% / 31,6% top, delta 0 (spike 16–17, pid apt-get đổi giữa hai lần đọc delta); apt-get delta 20 (spike 18); daemon delta 4–11, KHÔNG process nào khác (spike 19–28) | **Dư load1 từ cơn bão sau reboot** (daemon khởi động lại + apt replay) — spike 14–18 quy được apt/daemon; **spike 19–28 (10 spike, 13:11:12–13:16:31Z) CHỈ quy được lớp load1 dư** (load5 leo 2,66 → 3,71 trong cụm — tải nền cao kéo dài, không process đơn lẻ nào đốt CPU tại snapshot; T4 corroborate: load5 min 2,01 trên boot mới) |
| 3 — Giữa phiên (6 spike) | 13:21:06–13:27:33Z | 3,04–3,60 | 6 | daemon delta 5–11, KHÔNG process nào khác (spike 29–31, 33–34); home-assistant ensure python **90,0%** top (spike 32 lúc 13:25:22Z, chết trước delta) | **5 spike lớp load1 dư** (cùng cơ chế cụm 2); spike 32 quy được **home-assistant-ensure.service** (cùng service spam ENOSPC — xem §4; nó chạy định kỳ và đốt CPU) |
| 4 — O8/harness T8 (16 spike) | 13:31:38–13:40:31Z | 3,08–**6,13** | 16 | vite delta 46 (spike 35); MiniBrowser delta 73–83 + WebKitWebProcess delta 79–106 (spike 36–38, 41–42, 44–46, 48–50); chromium renderer delta 35 (spike 39); privsep-test health-check 66,6% top (spike 43, chết trước delta); daemon delta ≤11 (spike 40, 47) | **O8 WebKit/Chromium của T8-154** (vite + MiniBrowser + WebKitWebProcess + chrome renderer); spike 40/47 lớp load1 dư (giữa hai lần chạy O8); spike 43 là health-check thoáng qua + dư WebKit |

- **Tổng kết đếm: 28/50 spike có driver process cụ thể** (cụm 1: 9; cụm 2: 5; cụm 3: 1; cụm 4: 13) **+ 22/50 spike lớp "load1 dư"** (cụm 1: 4; cụm 2: 10; cụm 3: 5; cụm 4: 2 — ghi rõ trong bảng trên, không gộp chung thành "đã quy được nguồn" như đợt 153). Lớp load1 dư có cơ chế chung: load1 là trung bình 1 phút còn dư sau burst trước + tải nền từ nhiều process ngắn hạn (mỗi process chết trước khi đo delta / không lọt top-5 theo %CPU tích lũy) — corroborate bằng load5 của T4 (không bao giờ <2 trên boot #49) và nr_running 1–3 trong các header spike.
- **Caveat đếm (F-154-T9-5):** cmdline chờ của chính T9 (`sleep 2400` / `sleep 2100` + wrapper bash) xuất hiện trong 44 dòng snapshot `ps` của b2-spikes.log ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `grep -c '^=== SPIKE'` = **50** (đếm thô không neo sẽ sai như F-153-T9-5).
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log** — F-150-T9-8 VẪN ĐÓNG. (Một dòng cmdline của T4 chứa chuỗi `ps -eo pid,etime,args` lọt vào snapshot — đó là process của T4, không phải `ps` của watcher; xem F-154-T9-5.)
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution (vd spike 4/10/32/43). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 28 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 28/50 spike; 22 spike còn lại chỉ quy được lớp load1 dư — giới hạn phương pháp đã biết (process ngắn hạn / tải phân tán), T9 ghi rõ thay vì gộp chung.
- **Delta tick lớn nhất đợt: 128 tick/s** (pid 17292, ffmpeg trim red60, spike 11:41:01Z); testsrc2 geq 103 tick/s; WebKitWebProcess 79–106 tick/s (max 106 lúc 13:36:58Z); mask_anim 78–91 tick/s; apt-get 20–33 tick/s; tsc 80 tick/s. (Đợt 153: max 146 tick/s.)
- **testsrc2:** 2/50 spike do testsrc2 geq gây ra (11:43:55Z 640x360, 11:46:01Z geq 1920x1080 delta 103) — cùng họ test render pixelate geq chạy lại mỗi đợt (như đợt 147–153); mọi PID testsrc2 đều ngắn hạn, thoát bình thường; không process nào kẹt lại. Không mở điều tra thêm (họ F-147/148/149-T9-3 đã ĐÓNG đợt 150).

### 2.6 Truy chủ ffmpeg testsrc2 — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này testsrc2 xuất hiện trong 2/50 spike, tất cả đều là **test render pixelate geq trong suite T1-154** (11:38:51–11:46:27Z) — chạy đúng chức năng, thoát bình thường. T9 không truy chủ lại từng PID (không có spike ngoài họ test render + suite + O8 + apt replay; không process lạ).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (TRỪ GAP 95 S TẠI REBOOT #49); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ tám liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148/149/150/151/152/153 giữ nguyên; quyết parent (m) đợt 153 GIỮ NGUYÊN cơ chế (a) armed): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **3.211.344 kB = 3.136,1 MiB = 51,04% guard lúc 11:43:41Z** — xa guard 3.080.112 kB. T2-154 đối chiếu độc lập: RAM đỉnh cửa sổ mù 53,95% guard (số T9-153, cửa sổ khác); số đỉnh đợt 154 chờ T1-155 đối chiếu.
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ tám liên tiếp (147, 148, 149, 150, 151, 152, 153, 154).** Cơ chế tự động armed cả phiên (sampler `round154-t9/sampler.sh`, pid 3418 rồi pid 1906 sau reboot #49, chạy 11:37:41–13:42:19Z, 125 mẫu — trừ gap 95 s tại #49, xem §5.1) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→154 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**, **3.211**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 11:37:41–13:42:19Z (125 mẫu, chỉ gap 95 s tại reboot #49 rồi khởi động lại bằng tay); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 153 nằm trong dir round153-t9 nên không chặn đợt này (dir mới round154-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-154-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-154-birefnet/out-birefnet-154.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147/148/149/150/151/152/153):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-154-T9-3); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-154-T9-2 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra — đợt này T4 có 0 attempt nên điểm (c) không phát sinh). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này: reboot #49 giết sampler, gap 95 s** (đợt 153: gap 61 s; đợt 152: gap 71 s; đợt 151: gap 46 s; đợt 149: gap 87 s) — dữ kiện này KHÔNG ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" ở mức tuyệt đối, nhưng gap 95 s là nhỏ và T9 khởi động lại bằng tay kịp thời; T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10. **Bổ sung đợt 154: T5-154 triển khai watcher respawn theo quyết parent (e) đợt 153 (phương án 1 + quy tắc đứng (3)) — cùng họ vấn đề với sampler T9; T5 là chủ quản, T9 chỉ nêu dữ kiện.**
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Journal trên boot #48 (2c0a7985): ≥74 dòng "No space left" / ENOSPC** (đếm 12:58Z; đếm giữa phiên: 1 dòng lúc 11:37Z → 39 dòng lúc 12:18Z → 74 dòng lúc 12:58Z — cadence ~75 s/dòng). Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. **Số cuối trên boot #48 KHÔNG kiểm được sau reboot #49** — journald chỉ giữ 1 boot (volatile), journal boot cũ mất theo reboot (cùng giới hạn đợt 153).
- **Journal trên boot #49 (12fc68a3): 16 dòng** (13:07:02–13:45:02Z, vẫn tăng lúc đóng — đếm cuối 13:45Z). Cùng thông điệp như trên.
- **Tổng phiên: ≥90 dòng trên HAI boot** (74 + 16 — số #48 là cận dưới, đã đếm tới 12:58Z; từ 12:58Z tới reboot 13:05:12Z còn ~7 phút chưa đếm, ước ~5 dòng nữa theo cadence nhưng T9 KHÔNG cộng số ước vào tổng — ghi rõ giới hạn này). **Đây là đợt thứ ba liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=0 ×5 lần — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo); **(2) ≥90 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 0 — **không thêm được watch nào cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Reboot #49 (giữa phiên, ứng viên số hiệu — chờ T2-155 xác nhận) — sampler/watcher chết theo, khởi động lại bằng tay

- **Boot lúc mở đợt 154 = 2c0a7985-b750-4166-b177-21d2ef7e1dc7** (btime **11:26:05Z** — `uptime -s` 11:26:05 + `/proc/stat` btime 1795173965 KHỚP nhau theo T2-154 §1; T0/T4-154 gọi là **#48, đã xác nhận theo đếm chặt (T2-154)**; đây là **reboot #48, xảy ra TRƯỚC phiên** — giữa T10-153 đóng (~11:15Z) và đợt 154 mở (11:35:51Z). T2-154: F117? ≈ 0/+1 s, ĐỦ 3 SERVER — đồng hồ boot #48 CHÍNH XÁC; gap #48 **[1.163, 1.167] s** (ứng viên có điều kiện).
- **Reboot #49 GIỮA phiên T9 (ứng viên số hiệu theo T0/T4-154):** sampler cũ (pid 3418) + watcher cũ (pid 3419) chết theo reboot; sleep chờ của T9 bị SIGTERM cùng lúc (~13:05Z, exec service cũng restart cùng lúc). Mẫu cuối sampler cũ: **13:04:42Z boot=2c0a7985 mem=435.152 bal=6.443.824 (vẫn ghim trần) load1=0,23**. Boot mới **12fc68a3** (btime **13:05:12Z** — `uptime -s` 13:05:12 + `/proc/stat` btime 1795179912 KHỚP nhau; journal first entry 13:05:29Z). **Sampler + watcher khởi động lại bằng tay lúc 13:06:17Z** (sampler pid 1906, watcher pid 1907; mẫu đầu boot mới 13:06:17Z mem=1.860.824 bal=5.017.992 swapfree=1.040.576 load1=5,91). **Gap phủ sóng sampler: 95 s** (13:04:42Z → 13:06:17Z). B2 watcher: 0 spike nào bị mất chắc chắn trong gap (gap 95 s, watcher cadence 30 s — tối đa 3–4 lần kiểm bị mất; load1 trong gap theo sampler: 0,23 → 5,91 — spike 13:06:17Z bắt được bão sau reboot ngay lần kiểm đầu).
- **Dấu hiệu đồng hồ tại #49 (ghi rõ cho T1/T2/T7): T4-154 ghi btime boot mới (13:05:12Z) TRƯỚC poll #117 của nó lúc 13:05:32Z** — overlap migration ~20 s+ (cùng họ #45: boot cũ còn sống sau btime mới; khung chết boot #48 theo T4: (13:05:32Z, 13:06:03Z]). **Dữ kiện T9 KHÔNG mâu thuẫn:** mẫu cuối boot cũ 13:04:42Z SỚM HƠN btime mới 13:05:12Z tới 30 s — không có dấu hiệu đồng hồ lùi trong dữ kiện T9 (khác #46: btime mới sớm hơn mẫu cuối cũ 5 s). T9 không phán cơ chế đồng hồ — chỉ ghi dữ kiện thô + mốc: sampler cũ chết ~13:04:42–13:06:17Z; journal boot mới first entry 13:05:29Z. T2/T7 đối chiếu khi gộp mốc reboot #49.
- **Tuổi thọ boot #48:** btime 11:26:05Z → btime boot mới 13:05:12Z = **5.947 s = 1h39m07s** (stat→stat). T7/T2 đối chiếu mốc neo khi gộp.
- Không có nghịch lý đồng hồ nào khác trong dữ kiện T9: mọi timestamp còn lại thứ tự nhất quán. T9 không phán tranh chấp clock T1–T2.
- Các cờ .done lúc T9 đóng (~13:48Z): t0, t1, t2, t4, t5, t6 (6/9 — T7, T8 còn chạy; chỉ còn T9 chưa đóng lúc 13:48Z).

### 5.2 T5-154 — POSTBOOT_PASS cho #48 CÓ; watcher respawn đang triển khai (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **POSTBOOT_PASS cho boot #48 CÓ (T5-154, 11:58:26Z — cờ T5 đầu tiên cho boot mới kể từ #43)** — T4-154 §1 ghi gate0=T5 từ poll #28 (11:58:36Z). **Boot #49 KHÔNG CÓ cờ T5** (T5-154 đã đóng trước #49) — gate0 trên boot mới dựa vào T4-check-only PASS (quyết (j) đợt 143).
- **Watcher respawn:** T5-154 triển khai theo quyết parent (e) đợt 153 (phương án 1 user systemd unit + quy tắc đứng (3)) — T9 chỉ ghi lại; T5 là chủ quản. Sampler T9 vẫn khởi động lại bằng tay sau reboot (gap 95 s đợt này) — cùng họ vấn đề, chưa có cơ chế tự hồi phục cho sampler.

### 5.3 Reboot #48 (trước phiên) — T2-154 xác nhận (T9 chỉ ghi lại để đối chiếu)

- T2-154: boot lúc mở đợt là **2c0a7985 (btime 11:26:05Z), reboot #48 ĐÃ XÁC NHẬN theo đếm chặt**. Mù #78? (#46) + #79? (#47) + #80? (#48): **ĐÓNG THEO LUẬT GAP** (P/Q/R/S đều đóng, max ẩn 0); gap #46 **[5.529, 5.533] s**, gap #47 **[7.309, 7.313] s**, gap #48 **[1.163, 1.167] s** — ứng viên có điều kiện (chuỗi phụ thuộc: cần #74?–#77? đóng trước). CERT/FULL chính thức GIỮ 73/88 (ứng viên CERT78/FULL93 + CERT79/FULL94 + CERT80/FULL95). Chuỗi mù đóng hoàn toàn liên tục GIỮ 9. **Mù #81? (#49) giao T2-155.** T9 chỉ ghi lại; T2 là chủ quản.

## 6. Sai số của chính T9 (ghi rõ)

- **F-154-T9-1 — Headroom 0 → 0: GIỮ MỨC 0 CẢ PHIÊN, dưới ngưỡng lần thứ mười bốn liên tiếp, tỉ lệ/vite 0 cả hai đầu, đợt thứ ba liên tiếp đóng ở 0.** Không phải sai số đo (2 lần đo mở chênh 0, 3 lần đo đóng đều 0; phương pháp không đổi từ đợt 109; journal có ≥90 dòng ENOSPC thật trên 2 boot corroborate độc lập). Ghi rõ: quyết "chỉ theo dõi" (g) đợt 151 + quyết (h) đợt 153 vẫn đứng; T9 không tự đổi ngưỡng hay yêu cầu user hành động — nhưng dữ kiện mới (0 cả phiên lần thứ hai liên tiếp + ≥90 dòng lỗi ENOSPC thật, đợt thứ ba liên tiếp) giao parent/T10 xem lại quyết (g). Trần 63.747 không đổi trong phiên. T5-154 không probe lại headroom nên không có số đối chiếu độc lập đợt này.
- **F-154-T9-2 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ tám liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-154-T9-3 — Khoảng trống lấy mẫu 60 giây (cùng lớp F-148/F-149/F-150/F-151/F-152/F-153-T9-3):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Cơ chế tự động chỉ kích hoạt trên mẫu quan sát được — đây là giới hạn thiết kế đã biết, không phải lỗi vận hành. Thêm: **gap 95 s tại reboot #49** là khoảng trống thứ hai (không mẫu nào trong 13:04:42–13:06:17Z) — một lần vượt guard trong gap đó cũng không được quan sát (khả năng thấp: RAM lúc 13:04:42Z là 435.152 kB và lúc 13:06:17Z là 1.860.824 kB, đều xa guard).
- **F-154-T9-4 — Script thống kê chạy TRƯỚC khi sampler dừng (124 mẫu), BẮT ĐƯỢC VÀ CHẠY LẠI TRÊN LOG ĐÓNG BĂNG (125 mẫu) TRƯỚC KHI ĐÓNG (không ảnh hưởng số cuối):** lần chạy đầu (13:42Z) đếm 124 mẫu vì sampler vẫn chạy và mẫu 13:42:19Z chưa ghi; sau khi dừng sampler/watcher, T9 chạy lại script trên log cuối 125 mẫu — mọi số trong LIMITS này đều từ lần chạy thứ hai (125 mẫu: min/max/mean/gate A/balloon/chuỗi/gap). Chuỗi ghim đã kiểm chứng độc lập bằng đếm số dòng (line 27–44, 48–66, 74–88, 101–113 = 18+19+15+13 = 65). Bài học cùng họ quyết (p) + F-153-T9-4: script thống kê phải chạy trên log ĐÃ ĐÓNG BĂNG, và các trường hợp biên (chuỗi/gap) phải đối chiếu thủ công.
- **F-154-T9-5 — Cmdline chờ của chính T9 lọt snapshot B2 (cùng họ F-153-T9-5), BẮT ĐƯỢC VÀ GHI RÕ TRƯỚC KHI ĐÓNG (không ảnh hưởng số cuối):** `sleep 2400` / `sleep 2100` + wrapper bash của T9 xuất hiện trong **44 dòng** snapshot `ps` của b2-spikes.log ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `^=== SPIKE` = **50** ngay từ đầu (không lặp lỗi đếm thô đợt 153). **Fix (n) (loại `ps` của watcher) vẫn đứng:** lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log; một dòng cmdline của T4 chứa chuỗi `ps -eo pid,etime,args` lọt vào snapshot — đó là process của T4 (launcher poll-wait), không phải `ps` của watcher. T9 đợt sau nên tránh để lệnh chờ chứa chuỗi trùng mẫu đếm và tránh sleep dài trong lúc watcher chạy (dùng cron/scheduler chờ thay cho sleep nếu có thể).
- **F-154-T9-6 — Ghi nháp giữa phiên "ghim liên tục / 2 chuỗi" là SAI, script bắt được trước khi đóng:** lúc kiểm giữa phiên 12:58Z T9 ghi nháp "2 chuỗi" (dựa trên 1 lần break quan sát được lúc đó); thực tế script thống kê cho thấy **4 chuỗi (18 + 19 + 15 + 13) với break B 12:43:42–12:49:42Z (7 mẫu) + reboot #49 tách chuỗi 3/4**. Mọi số ghim trong LIMITS này đều từ script đã kiểm chứng trên log đầy đủ. Cùng bài học quyết (p) + F-153-T9-6: không phán chuỗi từ kiểm giữa phiên.
- **F-154-T9-7 — Reboot #49 giết sampler/watcher (gap 95 s) + sleep chờ của T9 bị SIGTERM:** xem §5.1. Gap lớn hơn đợt 153 (61 s) và đợt 152 (71 s) vì T9 phát hiện muộn hơn (sleep chờ bị giết cùng reboot, không còn watcher nào báo); dữ kiện này để parent/T10 xem lại quyết (q) "không cần cơ chế tự hồi phục lúc này" — T9 không đề xuất đổi. **Chuỗi ghim 3 kết thúc VẪN GHIM — điểm đứt KHÔNG quan sát được** (khác đợt 153: cả 2 chuỗi đều đứt quan sát được) — T9 ghi rõ, không suy diễn điểm đứt.
- **F-154-T9-8 — 22/50 spike B2 CHỈ quy được lớp "load1 dư", KHÔNG có driver process đơn lẻ (giới hạn phương pháp, ghi rõ — không gộp chung):** 22 spike (cụm 1: 4; cụm 2: 10; cụm 3: 5; cụm 4: 2) có delta tick max ≤23 và top snapshot chỉ còn hatch daemon — không process nào đốt CPU tại thời điểm snapshot, nhưng load1 ≥3,0 và load5 leo cao (2,66 → 3,71 trong cụm 2; T4: load5 min 2,01 trên boot #49). Cơ chế khả dĩ: load1 là trung bình 1 phút còn dư sau burst trước + tải từ nhiều process ngắn hạn (mỗi process chết trước khi đo delta / không lọt top-5 theo %CPU tích lũy). Đây là giới hạn đã biết của phương pháp snapshot + delta (cùng lớp spike 7–8 đợt 153), T9 ghi rõ tỉ lệ 28/50 có driver cụ thể thay vì claim "tất cả đã quy được nguồn". T9 đợt sau có thể bổ sung đếm process ngắn hạn (vd `ps` snapshot dày hơn trong lúc spike) nếu parent giao — không tự đổi phương pháp trong phiên.
- **F-154-T9-9 — Lỗi gõ trong bản nháp §5.1 (đã sửa trước khi đóng):** bản nháp đầu ghi boot lúc mở kèm UUID `...-bece-45b6-88fa-b12f602d6390` — SAI, đó là UUID của boot #45 (401fca75); UUID đúng của boot #48 là `2c0a7985-b750-4166-b177-21d2ef7e1dc7` (theo T2-154 §1 + `journalctl --list-boots`). Đã sửa trong LIMITS này; không ảnh hưởng số đo (mọi số đo dùng boot_id rút gọn 8 ký tự, khớp log gốc).
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước (copy y nguyên script đợt 153, cap 30.000 thống nhất); file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 155 (phần T9)

1. **Cơ chế tự động (a) armed nhưng chưa có lần kích hoạt thật — lần thứ tám liên tiếp** (0 mẫu ≥ guard đợt này): giữ nguyên sampler + trigger cho đợt 155 (lockfile + log theo phiên mới — lockfile đợt 154 nằm trong dir round154-t9 nên không chặn đợt 155; mỗi đợt dùng dir riêng). Nếu cửa sổ mở lại, cơ chế sẽ bắt trong ≤60 s. Guard giữ nguyên 6.144 MiB; u2net là fallback chính thức. Lần FIRE thật đầu tiên vẫn chưa kiểm chứng end-to-end (F-154-T9-2). **Đỉnh RAM đợt này 51,04% guard — thấp hơn đợt 153 (53,95%).**
2. **⚠️ Headroom 0 → 0 — VẪN DƯỚI < ~1.800, lần thứ mười bốn liên tiếp dưới ngưỡng** (quyết parent đợt 153 (h): GIỮ quyết (g) "chỉ theo dõi"). **Tỉ lệ/vite 0 cả phiên — đợt thứ ba liên tiếp đóng ở 0; bảng watch đầy hẳn (63.747/63.747) cả phiên; journal có ≥90 dòng lỗi ENOSPC thật của systemd trên HAI boot trong phiên (đợt thứ ba liên tiếp).** Giao parent/T10 xem lại quyết (g) với dữ kiện mới này. Trần 63.747 không đổi.
3. **Balloon: GHIM TRẦN ĐỢT MỚI — 65/125 mẫu (52,0%), 4 chuỗi, 1 episode (đề xuất)** (chuỗi dài nhất 12:24:42–12:42:42Z, 19 mẫu, 18 phút; 3/4 chuỗi quan sát được điểm đứt, chuỗi 3 không — reboot cắt ngang) sau đợt 153 ghi 65/131 mẫu, 2 chuỗi. **Giao T10 xác nhận cách đếm trong đợt** (1 episode 4 chuỗi hay chuỗi 4 tách thành episode thứ hai — xem §2.2). Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146.
4. **Lượt yên #23 KHÔNG CÓ lượt hợp lệ** (0 attempt, 147 poll, exit 5 — cửa không bao giờ mở: RAM sập <1024 từ poll #26 trên #48 + load5 không bao giờ <2 trên #49); **chuỗi lượt yên hợp lệ DỪNG Ở #21**; P3' cộng dồn KHÔNG ĐỔI 39/41 = 39/40 distinct-seq. O8 đợt 154 + chuỗi WebKit FULL PASS chờ T8/T10 xác nhận (T4 ghi waiter t4=0 suốt — O8 không qua gate chuẩn từ phía T4).
5. **Mù #81? (#49) — giao T2-155** (reboot #49 btime 13:05:12Z giữa phiên, ứng viên số hiệu; T4-154 ghi overlap migration ~20 s+ cùng họ #45; mù #78?/#79?/#80? đã ĐÓNG theo luật gap — T2-154). CERT/FULL chính thức GIỮ 73/88.
6. **B2: 50 spike — nhiều nhất chuỗi T9; 22/50 chỉ quy được lớp load1 dư** (xem §2.5 + F-154-T9-8) — phương pháp snapshot + delta chạm giới hạn với tải phân tán / process ngắn hạn; T9 đợt sau có thể bổ sung đếm process ngắn hạn nếu parent giao.

## Phụ lục A — Bảng sampler đầy đủ (script stats-appendix.py trích từ log gốc)

Thống kê: samples: 125 (88 mau boot 2c0a7985 + 37 mau boot 12fc68a3); mem min: 405,564 kB (396.1 MiB) luc 12:11:41Z; mem max: 3,211,344 kB (3136.1 MiB = 51.04% guard) luc 11:43:41Z; mem mean: 844524 kB (824.7 MiB); count >=1024 MiB (gate A): 29/125; count >= guard 6144 MiB: 0/125; balloon frozen 6,443,824: 65/125 (chuoi 1: 12:03:41Z–12:20:42Z n=18; chuoi 2: 12:24:42Z–12:42:42Z n=19; chuoi 3: 12:50:42Z–13:04:42Z n=15; chuoi 4: 13:18:18Z–13:30:18Z n=13); balloon min: 3,454,424 kB luc 11:46:41Z; balloon max: 6,443,824 kB; load1 max (sampler): 7.39 luc 11:40:41Z; load1 >=3.0 samples: 28/125; max inter-sample gap: 95 s (13:04:42Z -> 13:06:17Z, 2c0a7985 -> 12fc68a3); gaps >90s: [('2026-11-20T13:04:42Z', '2026-11-20T13:06:17Z', 95, '2c0a7985', '12fc68a3')]

## Phụ lục A — Bảng sampler đầy đủ (125 mau: 88 mau boot 2c0a7985 + 37 mau boot 12fc68a3; gap: 13:04:42Z -> 13:06:17Z (95 s, 2c0a7985 -> 12fc68a3))

(File gốc: `hidden_files/round154-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó.)

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-20T11:37:41Z | 2c0a7985 | 1,162,056 | 1134.8 | 18.47% | 5,685,472 | 849,204 | 1.40 |
| 2 | 2026-11-20T11:38:41Z | 2c0a7985 | 1,312,776 | 1282.0 | 20.87% | 5,537,012 | 781,720 | 3.29 |
| 3 | 2026-11-20T11:39:41Z | 2c0a7985 | 1,569,364 | 1532.6 | 24.94% | 5,197,532 | 754,280 | 5.63 |
| 4 | 2026-11-20T11:40:41Z | 2c0a7985 | 1,400,844 | 1368.0 | 22.27% | 5,380,140 | 758,020 | 7.39 |
| 5 | 2026-11-20T11:41:41Z | 2c0a7985 | 2,160,984 | 2110.3 | 34.35% | 4,651,636 | 764,384 | 4.88 |
| 6 | 2026-11-20T11:42:41Z | 2c0a7985 | 2,764,608 | 2699.8 | 43.94% | 3,865,204 | 793,892 | 4.04 |
| 7 | 2026-11-20T11:43:41Z | 2c0a7985 | 3,211,344 | 3136.1 | 51.04% | 3,509,160 | 783,696 | 3.91 |
| 8 | 2026-11-20T11:44:41Z | 2c0a7985 | 2,402,912 | 2346.6 | 38.19% | 3,695,536 | 780,276 | 1.87 |
| 9 | 2026-11-20T11:45:41Z | 2c0a7985 | 2,351,296 | 2296.2 | 37.37% | 3,618,476 | 750,180 | 2.43 |
| 10 | 2026-11-20T11:46:41Z | 2c0a7985 | 2,893,832 | 2826.0 | 46.00% | 3,454,424 | 738,612 | 4.83 |
| 11 | 2026-11-20T11:47:41Z | 2c0a7985 | 2,566,252 | 2506.1 | 40.79% | 3,765,376 | 740,760 | 2.08 |
| 12 | 2026-11-20T11:48:41Z | 2c0a7985 | 2,607,632 | 2546.5 | 41.45% | 4,056,940 | 752,712 | 1.54 |
| 13 | 2026-11-20T11:49:41Z | 2c0a7985 | 2,363,684 | 2308.3 | 37.57% | 4,339,256 | 757,172 | 1.09 |
| 14 | 2026-11-20T11:50:41Z | 2c0a7985 | 2,130,892 | 2080.9 | 33.87% | 4,603,092 | 757,328 | 0.55 |
| 15 | 2026-11-20T11:51:41Z | 2c0a7985 | 1,917,836 | 1872.9 | 30.48% | 4,844,128 | 759,652 | 0.48 |
| 16 | 2026-11-20T11:52:41Z | 2c0a7985 | 1,659,280 | 1620.4 | 26.37% | 5,062,228 | 761,612 | 0.44 |
| 17 | 2026-11-20T11:53:41Z | 2c0a7985 | 1,477,112 | 1442.5 | 23.48% | 5,255,760 | 760,600 | 0.90 |
| 18 | 2026-11-20T11:54:41Z | 2c0a7985 | 1,309,972 | 1279.3 | 20.82% | 5,437,828 | 760,084 | 0.94 |
| 19 | 2026-11-20T11:55:41Z | 2c0a7985 | 1,207,208 | 1178.9 | 19.19% | 5,603,836 | 759,300 | 0.45 |
| 20 | 2026-11-20T11:56:41Z | 2c0a7985 | 1,026,680 | 1002.6 | 16.32% | 5,755,876 | 758,472 | 0.27 |
| 21 | 2026-11-20T11:57:41Z | 2c0a7985 | 912,860 | 891.5 | 14.51% | 5,894,304 | 763,444 | 0.10 |
| 22 | 2026-11-20T11:58:41Z | 2c0a7985 | 720,816 | 703.9 | 11.46% | 6,022,068 | 757,572 | 0.38 |
| 23 | 2026-11-20T11:59:41Z | 2c0a7985 | 706,256 | 689.7 | 11.23% | 6,136,268 | 723,524 | 0.33 |
| 24 | 2026-11-20T12:00:41Z | 2c0a7985 | 579,152 | 565.6 | 9.21% | 6,239,624 | 711,092 | 0.44 |
| 25 | 2026-11-20T12:01:41Z | 2c0a7985 | 469,700 | 458.7 | 7.47% | 6,331,716 | 713,344 | 0.26 |
| 26 | 2026-11-20T12:02:41Z | 2c0a7985 | 466,104 | 455.2 | 7.41% | 6,417,268 | 702,540 | 0.18 |
| 27 | 2026-11-20T12:03:41Z | 2c0a7985 | 409,988 | 400.4 | 6.52% | 6,443,824 | 698,560 | 0.06 |
| 28 | 2026-11-20T12:04:41Z | 2c0a7985 | 429,612 | 419.5 | 6.83% | 6,443,824 | 698,680 | 0.37 |
| 29 | 2026-11-20T12:05:41Z | 2c0a7985 | 448,072 | 437.6 | 7.12% | 6,443,824 | 699,432 | 0.47 |
| 30 | 2026-11-20T12:06:41Z | 2c0a7985 | 448,592 | 438.1 | 7.13% | 6,443,824 | 703,164 | 0.35 |
| 31 | 2026-11-20T12:07:41Z | 2c0a7985 | 424,044 | 414.1 | 6.74% | 6,443,824 | 701,784 | 0.20 |
| 32 | 2026-11-20T12:08:41Z | 2c0a7985 | 442,784 | 432.4 | 7.04% | 6,443,824 | 704,468 | 0.07 |
| 33 | 2026-11-20T12:09:41Z | 2c0a7985 | 430,268 | 420.2 | 6.84% | 6,443,824 | 701,220 | 0.19 |
| 34 | 2026-11-20T12:10:41Z | 2c0a7985 | 441,148 | 430.8 | 7.01% | 6,443,824 | 701,572 | 0.40 |
| 35 | 2026-11-20T12:11:41Z | 2c0a7985 | 405,564 | 396.1 | 6.45% | 6,443,824 | 700,752 | 0.22 |
| 36 | 2026-11-20T12:12:41Z | 2c0a7985 | 433,880 | 423.7 | 6.90% | 6,443,824 | 699,708 | 0.08 |
| 37 | 2026-11-20T12:13:41Z | 2c0a7985 | 434,212 | 424.0 | 6.90% | 6,443,824 | 697,492 | 0.14 |
| 38 | 2026-11-20T12:14:41Z | 2c0a7985 | 429,528 | 419.5 | 6.83% | 6,443,824 | 696,148 | 0.05 |
| 39 | 2026-11-20T12:15:41Z | 2c0a7985 | 438,832 | 428.5 | 6.98% | 6,443,824 | 696,440 | 0.14 |
| 40 | 2026-11-20T12:16:42Z | 2c0a7985 | 448,148 | 437.6 | 7.12% | 6,443,824 | 684,760 | 0.05 |
| 41 | 2026-11-20T12:17:42Z | 2c0a7985 | 457,756 | 447.0 | 7.28% | 6,443,824 | 685,248 | 0.09 |
| 42 | 2026-11-20T12:18:42Z | 2c0a7985 | 450,844 | 440.3 | 7.17% | 6,443,824 | 682,592 | 0.26 |
| 43 | 2026-11-20T12:19:42Z | 2c0a7985 | 453,788 | 443.2 | 7.21% | 6,443,824 | 680,188 | 0.16 |
| 44 | 2026-11-20T12:20:42Z | 2c0a7985 | 458,056 | 447.3 | 7.28% | 6,443,824 | 679,376 | 0.34 |
| 45 | 2026-11-20T12:21:42Z | 2c0a7985 | 596,504 | 582.5 | 9.48% | 6,247,216 | 671,316 | 1.33 |
| 46 | 2026-11-20T12:22:42Z | 2c0a7985 | 629,712 | 615.0 | 10.01% | 6,302,552 | 646,352 | 0.92 |
| 47 | 2026-11-20T12:23:42Z | 2c0a7985 | 541,880 | 529.2 | 8.61% | 6,394,504 | 644,220 | 0.63 |
| 48 | 2026-11-20T12:24:42Z | 2c0a7985 | 416,840 | 407.1 | 6.63% | 6,443,824 | 632,140 | 0.46 |
| 49 | 2026-11-20T12:25:42Z | 2c0a7985 | 478,372 | 467.2 | 7.60% | 6,443,824 | 636,856 | 0.40 |
| 50 | 2026-11-20T12:26:42Z | 2c0a7985 | 471,672 | 460.6 | 7.50% | 6,443,824 | 634,716 | 0.55 |
| 51 | 2026-11-20T12:27:42Z | 2c0a7985 | 448,640 | 438.1 | 7.13% | 6,443,824 | 633,648 | 0.20 |
| 52 | 2026-11-20T12:28:42Z | 2c0a7985 | 454,932 | 444.3 | 7.23% | 6,443,824 | 633,828 | 0.26 |
| 53 | 2026-11-20T12:29:42Z | 2c0a7985 | 443,864 | 433.5 | 7.06% | 6,443,824 | 633,928 | 0.14 |
| 54 | 2026-11-20T12:30:42Z | 2c0a7985 | 442,584 | 432.2 | 7.03% | 6,443,824 | 634,384 | 0.13 |
| 55 | 2026-11-20T12:31:42Z | 2c0a7985 | 438,772 | 428.5 | 6.97% | 6,443,824 | 634,900 | 0.05 |
| 56 | 2026-11-20T12:32:42Z | 2c0a7985 | 438,820 | 428.5 | 6.97% | 6,443,824 | 636,076 | 0.10 |
| 57 | 2026-11-20T12:33:42Z | 2c0a7985 | 435,888 | 425.7 | 6.93% | 6,443,824 | 636,428 | 0.13 |
| 58 | 2026-11-20T12:34:42Z | 2c0a7985 | 446,832 | 436.4 | 7.10% | 6,443,824 | 637,616 | 0.05 |
| 59 | 2026-11-20T12:35:42Z | 2c0a7985 | 540,020 | 527.4 | 8.58% | 6,443,824 | 734,184 | 0.14 |
| 60 | 2026-11-20T12:36:42Z | 2c0a7985 | 515,644 | 503.6 | 8.20% | 6,443,824 | 740,592 | 0.12 |
| 61 | 2026-11-20T12:37:42Z | 2c0a7985 | 480,708 | 469.4 | 7.64% | 6,443,824 | 742,636 | 0.32 |
| 62 | 2026-11-20T12:38:42Z | 2c0a7985 | 494,880 | 483.3 | 7.87% | 6,443,824 | 742,776 | 0.36 |
| 63 | 2026-11-20T12:39:42Z | 2c0a7985 | 478,684 | 467.5 | 7.61% | 6,443,824 | 757,880 | 0.39 |
| 64 | 2026-11-20T12:40:42Z | 2c0a7985 | 476,044 | 464.9 | 7.57% | 6,443,824 | 764,856 | 0.29 |
| 65 | 2026-11-20T12:41:42Z | 2c0a7985 | 459,704 | 448.9 | 7.31% | 6,443,824 | 765,248 | 0.18 |
| 66 | 2026-11-20T12:42:42Z | 2c0a7985 | 493,044 | 481.5 | 7.84% | 6,443,824 | 747,864 | 0.32 |
| 67 | 2026-11-20T12:43:42Z | 2c0a7985 | 670,568 | 654.9 | 10.66% | 6,247,216 | 660,616 | 1.04 |
| 68 | 2026-11-20T12:44:42Z | 2c0a7985 | 885,680 | 864.9 | 14.08% | 6,090,000 | 644,776 | 0.72 |
| 69 | 2026-11-20T12:45:42Z | 2c0a7985 | 735,048 | 717.8 | 11.68% | 6,205,252 | 645,404 | 0.59 |
| 70 | 2026-11-20T12:46:42Z | 2c0a7985 | 789,292 | 770.8 | 12.55% | 6,110,792 | 670,276 | 0.68 |
| 71 | 2026-11-20T12:47:42Z | 2c0a7985 | 654,476 | 639.1 | 10.40% | 6,183,372 | 670,084 | 0.36 |
| 72 | 2026-11-20T12:48:42Z | 2c0a7985 | 588,504 | 574.7 | 9.35% | 6,284,996 | 688,472 | 0.44 |
| 73 | 2026-11-20T12:49:42Z | 2c0a7985 | 531,676 | 519.2 | 8.45% | 6,379,824 | 688,196 | 0.27 |
| 74 | 2026-11-20T12:50:42Z | 2c0a7985 | 441,276 | 430.9 | 7.01% | 6,443,824 | 687,404 | 0.26 |
| 75 | 2026-11-20T12:51:42Z | 2c0a7985 | 426,964 | 417.0 | 6.79% | 6,443,824 | 681,476 | 0.59 |
| 76 | 2026-11-20T12:52:42Z | 2c0a7985 | 431,508 | 421.4 | 6.86% | 6,443,824 | 679,308 | 0.30 |
| 77 | 2026-11-20T12:53:42Z | 2c0a7985 | 429,912 | 419.8 | 6.83% | 6,443,824 | 676,456 | 0.11 |
| 78 | 2026-11-20T12:54:42Z | 2c0a7985 | 420,204 | 410.4 | 6.68% | 6,443,824 | 672,952 | 0.19 |
| 79 | 2026-11-20T12:55:42Z | 2c0a7985 | 413,952 | 404.2 | 6.58% | 6,443,824 | 670,104 | 0.40 |
| 80 | 2026-11-20T12:56:42Z | 2c0a7985 | 435,628 | 425.4 | 6.92% | 6,443,824 | 666,604 | 0.21 |
| 81 | 2026-11-20T12:57:42Z | 2c0a7985 | 423,604 | 413.7 | 6.73% | 6,443,824 | 674,836 | 0.19 |
| 82 | 2026-11-20T12:58:42Z | 2c0a7985 | 415,776 | 406.0 | 6.61% | 6,443,824 | 672,028 | 0.11 |
| 83 | 2026-11-20T12:59:42Z | 2c0a7985 | 431,172 | 421.1 | 6.85% | 6,443,824 | 666,368 | 0.29 |
| 84 | 2026-11-20T13:00:42Z | 2c0a7985 | 433,980 | 423.8 | 6.90% | 6,443,824 | 671,508 | 0.32 |
| 85 | 2026-11-20T13:01:42Z | 2c0a7985 | 412,704 | 403.0 | 6.56% | 6,443,824 | 668,676 | 0.36 |
| 86 | 2026-11-20T13:02:42Z | 2c0a7985 | 425,200 | 415.2 | 6.76% | 6,443,824 | 669,976 | 0.21 |
| 87 | 2026-11-20T13:03:42Z | 2c0a7985 | 437,028 | 426.8 | 6.95% | 6,443,824 | 670,576 | 0.64 |
| 88 | 2026-11-20T13:04:42Z | 2c0a7985 | 435,152 | 425.0 | 6.92% | 6,443,824 | 670,504 | 0.23 |
| — | — | — | — | — | — | — | — | — |
| 89 | 2026-11-20T13:06:17Z | 12fc68a3 | 1,860,824 | 1817.2 | 29.58% | 5,017,992 | 1,040,576 | 5.91 |
| 90 | 2026-11-20T13:07:18Z | 12fc68a3 | 1,920,656 | 1875.6 | 30.53% | 4,963,292 | 964,352 | 4.21 |
| 91 | 2026-11-20T13:08:18Z | 12fc68a3 | 1,758,108 | 1716.9 | 27.94% | 5,174,048 | 887,536 | 3.62 |
| 92 | 2026-11-20T13:09:18Z | 12fc68a3 | 1,482,368 | 1447.6 | 23.56% | 5,368,140 | 880,676 | 2.68 |
| 93 | 2026-11-20T13:10:18Z | 12fc68a3 | 1,345,972 | 1314.4 | 21.39% | 5,544,420 | 847,492 | 2.32 |
| 94 | 2026-11-20T13:11:18Z | 12fc68a3 | 1,250,328 | 1221.0 | 19.87% | 5,702,076 | 823,372 | 4.17 |
| 95 | 2026-11-20T13:12:18Z | 12fc68a3 | 1,104,304 | 1078.4 | 17.55% | 5,852,072 | 822,712 | 5.64 |
| 96 | 2026-11-20T13:13:18Z | 12fc68a3 | 981,352 | 958.4 | 15.60% | 5,989,368 | 821,164 | 4.77 |
| 97 | 2026-11-20T13:14:18Z | 12fc68a3 | 862,648 | 842.4 | 13.71% | 6,114,544 | 816,392 | 4.32 |
| 98 | 2026-11-20T13:15:18Z | 12fc68a3 | 751,904 | 734.3 | 11.95% | 6,227,592 | 816,136 | 3.79 |
| 99 | 2026-11-20T13:16:18Z | 12fc68a3 | 668,604 | 652.9 | 10.63% | 6,332,060 | 796,916 | 3.29 |
| 100 | 2026-11-20T13:17:18Z | 12fc68a3 | 548,756 | 535.9 | 8.72% | 6,425,976 | 771,820 | 2.80 |
| 101 | 2026-11-20T13:18:18Z | 12fc68a3 | 519,124 | 507.0 | 8.25% | 6,443,824 | 767,236 | 2.53 |
| 102 | 2026-11-20T13:19:18Z | 12fc68a3 | 537,732 | 525.1 | 8.55% | 6,443,824 | 764,948 | 2.28 |
| 103 | 2026-11-20T13:20:18Z | 12fc68a3 | 526,300 | 514.0 | 8.37% | 6,443,824 | 765,064 | 2.89 |
| 104 | 2026-11-20T13:21:18Z | 12fc68a3 | 551,924 | 539.0 | 8.77% | 6,443,824 | 760,984 | 2.89 |
| 105 | 2026-11-20T13:22:18Z | 12fc68a3 | 532,364 | 519.9 | 8.46% | 6,443,824 | 760,584 | 2.91 |
| 106 | 2026-11-20T13:23:18Z | 12fc68a3 | 530,140 | 517.7 | 8.43% | 6,443,824 | 758,652 | 2.69 |
| 107 | 2026-11-20T13:24:18Z | 12fc68a3 | 528,740 | 516.3 | 8.40% | 6,443,824 | 758,000 | 2.73 |
| 108 | 2026-11-20T13:25:18Z | 12fc68a3 | 532,352 | 519.9 | 8.46% | 6,443,824 | 757,568 | 3.60 |
| 109 | 2026-11-20T13:26:18Z | 12fc68a3 | 533,504 | 521.0 | 8.48% | 6,443,824 | 762,228 | 2.78 |
| 110 | 2026-11-20T13:27:18Z | 12fc68a3 | 537,808 | 525.2 | 8.55% | 6,443,824 | 758,996 | 3.33 |
| 111 | 2026-11-20T13:28:18Z | 12fc68a3 | 529,996 | 517.6 | 8.42% | 6,443,824 | 759,096 | 2.13 |
| 112 | 2026-11-20T13:29:18Z | 12fc68a3 | 532,660 | 520.2 | 8.47% | 6,443,824 | 758,420 | 1.41 |
| 113 | 2026-11-20T13:30:18Z | 12fc68a3 | 533,800 | 521.3 | 8.48% | 6,443,824 | 757,756 | 1.34 |
| 114 | 2026-11-20T13:31:18Z | 12fc68a3 | 697,496 | 681.1 | 11.09% | 6,247,216 | 676,768 | 3.03 |
| 115 | 2026-11-20T13:32:19Z | 12fc68a3 | 901,012 | 879.9 | 14.32% | 5,264,176 | 608,816 | 6.08 |
| 116 | 2026-11-20T13:33:19Z | 12fc68a3 | 843,892 | 824.1 | 13.41% | 5,377,020 | 613,240 | 5.42 |
| 117 | 2026-11-20T13:34:19Z | 12fc68a3 | 1,079,992 | 1054.7 | 17.17% | 5,032,524 | 605,080 | 4.48 |
| 118 | 2026-11-20T13:35:19Z | 12fc68a3 | 1,086,280 | 1060.8 | 17.27% | 5,195,176 | 617,160 | 5.45 |
| 119 | 2026-11-20T13:36:19Z | 12fc68a3 | 1,572,560 | 1535.7 | 25.00% | 5,324,064 | 632,404 | 5.05 |
| 120 | 2026-11-20T13:37:19Z | 12fc68a3 | 1,013,104 | 989.4 | 16.10% | 5,235,484 | 630,908 | 3.63 |
| 121 | 2026-11-20T13:38:19Z | 12fc68a3 | 993,072 | 969.8 | 15.78% | 5,371,648 | 632,984 | 4.02 |
| 122 | 2026-11-20T13:39:19Z | 12fc68a3 | 785,768 | 767.4 | 12.49% | 5,504,596 | 630,316 | 3.65 |
| 123 | 2026-11-20T13:40:19Z | 12fc68a3 | 695,980 | 679.7 | 11.06% | 5,611,956 | 632,436 | 3.28 |
| 124 | 2026-11-20T13:41:19Z | 12fc68a3 | 670,920 | 655.2 | 10.66% | 5,716,260 | 627,060 | 2.29 |
| 125 | 2026-11-20T13:42:19Z | 12fc68a3 | 633,292 | 618.4 | 10.07% | 5,817,088 | 628,612 | 0.93 |
