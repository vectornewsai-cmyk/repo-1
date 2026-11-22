# LIMITS — Phase 9 đợt 155, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ chín liên tiếp; headroom 0 → 0 — đợt thứ tư liên tiếp đóng ở 0; balloon GHIM TRẦN EPISODE MỚI 46/112 mẫu, 4 chuỗi, 1 episode; reboot #50 giữa phiên; ENOSPC ≥133 dòng trên 2 boot; lượt yên #24 KHÔNG có attempt hợp lệ)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 0/0 (14:40:42Z, boot #49 12fc68a3) → đóng 0/0/0 (16:32:50Z, boot #50 d849728b)** — giữ mức **0 cả phiên**, qua reboot #50; **dưới ngưỡng < ~1.800 lần thứ mười lăm liên tiếp**; tỉ lệ/vite **0 → 0** — **đợt thứ tư liên tiếp đóng ở 0** (152: 82 → 0; 153: 0 → 0; 154: 0 → 0; 155: 0 → 0). Quyết parent (h) đợt 153 GIỮ quyết (g) "chỉ theo dõi" — T9 chỉ theo dõi, không báo riêng, NHƯNG ghi rõ dữ kiện mới: **bảng watch đầy hẳn cả phiên (63.747/63.747) + journal có ≥133 dòng lỗi ENOSPC thật trên HAI boot** (xem §1, §4). Xem §1.
- **Balloon GHIM TRẦN EPISODE MỚI — 46/112 mẫu (41,1%), 4 chuỗi, MỘT boot (#50):** chuỗi 1 (15:32:43–15:41:43Z, 10 mẫu) + chuỗi 2 (15:47:44–15:57:44Z, 11 mẫu) + chuỗi 3 (16:03:44–16:14:44Z, 12 mẫu) + chuỗi 4 (16:18:45–16:30:45Z, 13 mẫu). **Cả 4 chuỗi đều đứt quan sát được** (xả về 97,0% / 93,9% / 95,9% / 88,3% trần). **Phán theo quy tắc quyết (e): đợt 155 là EPISODE GHIM MỚI, không nối đợt 154** (giữa lần ghim cuối đợt 154 13:30:18Z và lần chạm đầu đợt 155 15:32:43Z có reboot #50 + balloon xả sâu tới 3.882.840 kB (60,3% trần) lúc 15:10:43Z + ~2h01m không ghim) — xem §2.2. Trong đợt: 4 chuỗi, đếm là **1 EPISODE** theo quy tắc (g) đợt 152 — giao T10 xác nhận.
- **RAM:** sampler **112 mẫu, 14:40:38–16:31:45Z, HAI boot** (25 mẫu boot #49 + 87 mẫu boot #50; gap 61 s tại reboot #50 — gap >61 s DUY NHẤT, không có gap >90 s). Min **505.888 kB (494,0 MiB) lúc 15:32:43Z**; max **2.779.068 kB (2.713,9 MiB = 44,17% guard) lúc 15:10:43Z**; mean 896.059 kB. Gate A ≥1024 MiB: **30/112 mẫu** (15/25 boot #49 + 15/87 boot #50). **0/112 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ chín liên tiếp.** Xem §2, §3.
- **B2: 20 spike load1 ≥3,0 — ÍT NHẤT từ đợt 152** (154: 50; 153: 15; 152: ~28). 8 spike T4 attempt1 + 6 spike testsrc2/pixelate geq + blind81 + 4 spike T4 attempt2 + 1 spike bão sau reboot + 1 spike clicktest lúc đóng. **14/20 spike quy được driver process cụ thể** (ffmpeg render, mask_anim.py, testsrc2 geq, pixelate probe, WebKit/MiniBrowser, hole-recheck81); **6/20 spike chỉ quy được lớp "load1 dư"**. Đỉnh **9,84 lúc 14:45:22Z** (watcher) / sampler load1 max **10,21 lúc 14:45:39Z**. **0 spike trong 15:05:42–16:32:19Z (~87 phút, suốt thời gian balloon ghim)** — cửa sổ yên về tải dài nhất trong chuỗi T9 gần đây. Xem §2.5.
- **Lượt yên WebKit #24 (T4): KHÔNG CÓ ATTEMPT HỢP LỆ** (theo log poller T4-155, T4 chưa xuất bản LIMITS lúc T9 đóng — T10 xác nhận): attempt1 20/20 NHƯNG vi phạm lớp B (lượt nhiễm tải, không dùng verdict); attempt2 bị reboot #50 giết giữa chừng (probe JSON 20/20 đầy đủ nhưng chết trước classb/analyzer, không có attempt-done → ngân sách vẫn 1/3); poller hết hạn 16:30Z, 0 attempt thêm. **Chuỗi lượt yên hợp lệ DỪNG Ở #21** (đợt 153). P3' cộng dồn KHÔNG ĐỔI: **39/41 occurrence = 39/40 distinct-seq**. Xem §2.3.
- **Reboot #50 giữa phiên (btime 15:04:07Z, boot 12fc68a3 → d849728b):** sampler + watcher chết theo reboot, T9 khởi động lại bằng tay 15:05:42Z, gap phủ sóng 61 s. Overlap migration ≥34 s (mẫu cuối boot cũ 15:04:41Z ghi SAU btime mới). T2-155 đã xác minh 4 nguồn độc lập (theo thông báo coordinator giữa phiên); số hiệu #50 chờ LIMITS T2-155 công bố chính thức. Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: ≥133 dòng trên HAI boot** — boot #49: **57 dòng** (đếm 14:40Z; số cuối không kiểm được sau reboot #50 vì journal volatile); boot #50: **76 dòng** (15:04:24–16:32:35Z, vẫn tăng lúc đóng). Tất cả cùng thông điệp `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`. Đợt thứ tư liên tiếp bảng watch cạn gây lỗi thật thấy được (152: 35 dòng; 153: ≥102 dòng; 154: ≥90 dòng; 155: ≥133 dòng). Xem §4.
- **T5-155 (đối chiếu):** POSTBOOT_PASS cho boot #49 CÓ (14:42:38Z, T0-155 xác minh); boot #50 KHÔNG CÓ cờ T5 mới lúc T9 đóng (T5 đã đóng trước #50) — gate0 trên boot mới dựa vào T4-check-only (quyết (j) đợt 143). Xem §5.2.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round155-t9/k8-headroom.py` (copy y nguyên từ đợt 154 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 155

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 14:40:42Z 20/11 | **0** | #49 12fc68a3 (btime 13:05:12Z) | lần đo 1, boot ~1h35' tuổi; RAM trước đo 758.588 kB, balloon 6.085.344 kB, load1 0,98 |
| 14:40:42Z 20/11 | **0** | #49 12fc68a3 | lần đo 2 (chênh **0** so với lần 1); RAM trước đo ~769.824 kB, balloon 6.085.344 kB, load1 1,06 |
| 16:32:50Z 20/11 | **0** | #50 d849728b (btime 15:04:07Z) | lần đo 3 (đóng phiên, boot mới sau reboot #50; 3 lần chạy liên tiếp trong một lệnh); RAM trước đo 1.018.748 kB, balloon 5.261.472 kB, load1 ~1,6 |
| 16:32:50Z 20/11 | **0** | #50 d849728b | lần đo 4 (chênh **0** so với lần 3); RAM trước đo 1.023.168 kB, balloon 5.261.472 kB |
| 16:32:50Z 20/11 | **0** | #50 d849728b | lần đo 5 (xác nhận thêm, do 0 là giá trị cực trị); RAM trước đo 1.013.500 kB, balloon 5.261.472 kB |

- Probe dừng ở `i=0` cả năm lần — `inotify_add_watch` ĐẦU TIÊN đã trả errno 28 (không thêm được watch nào), đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau mỗi lần đo).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 0 = **63.747 watch** lúc mở VÀ lúc đóng (**bảng watch đầy hẳn cả phiên**, qua reboot #50 — reboot không nhả watch ngoài cell).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): 0 / 1.578 = **0** mở đợt và đóng phiên — **đợt thứ tư liên tiếp đóng ở 0** (đợt 152: 0,052 → 0; đợt 153: 0 → 0; đợt 154: 0 → 0; đợt 155: 0 → 0).
- T5-155 KHÔNG probe lại headroom đợt này (như đợt 151/152/153/154) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 2 lần đo mở chênh 0 + 3 lần đo đóng đều 0 + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal HAI boot có ≥133 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- Lưu ý: RAM trước đo lần đóng (~1,01–1,02 GB) cao hơn lần mở (~0,76 GB) trong khi headroom giữ 0 cả hai đầu. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước) — reboot #50 cũng không khôi phục headroom (0 mở trên boot cũ → 0 đóng trên boot mới).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–154 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **155** | **0 → 0** | **mở 14:40:42Z boot #49 12fc68a3 btime 13:05:12Z → đóng 16:32:50Z boot MỚI #50 d849728b btime 15:04:07Z (reboot #50 GIỮA phiên; lần đo xác nhận thứ ba cũng 0)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0 VÀ Ở LÌ ĐÓ — reboot không khôi phục.** Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**. Bước giảm đợt này: 0 (đã ở sàn từ đầu phiên, qua reboot #50).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ mười lăm liên tiếp.** Quyết parent đợt 153 (h): GIỮ quyết (g) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): headroom giữ đúng 0 cả phiên lần thứ ba liên tiếp (không còn watch nào để cấp từ đầu tới cuối, qua reboot #50) + journal có ≥133 dòng lỗi ENOSPC thật của systemd trên HAI boot trong phiên** — đợt thứ tư liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Mốc mới: headroom = 0 CẢ PHIÊN lần thứ ba liên tiếp — và là đợt thứ tư liên tiếp đóng ở 0.** Một vite mới cần ~1.578 watch sẽ không thêm được watch nào nếu khởi động lúc này (vite đang chạy giữ nguyên watch của nó — vòng lặp vẫn chạy vì vite tạm dùng 0 watch).
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 14:40Z và lúc đóng 16:32Z — cùng giá trị). Trần 63.747 vẫn đầy ở mức 63.747 watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.048.572 kB) — sampler 112 mẫu, 14:40:38–16:31:45Z, HAI boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên (T4 attempt1 + balloon xả) → rơi dần khi balloon leo → ghim trần dài 4 chuỗi trên boot mới (RAM trũng ~510–610k, load1 yên) → đứt ghim, RAM hồi nhẹ lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **112 mẫu, 14:40:38Z–16:31:45Z 20/11, HAI boot — gap duy nhất 61 s tại reboot #50** (mẫu cuối boot cũ 15:04:41Z → mẫu đầu boot mới 15:05:42Z; sampler + watcher khởi động lại bằng tay — xem §5.1). Tổng quan: **min 505.888 kB (494,0 MiB) lúc 15:32:43Z (trong chuỗi ghim 1); max 2.779.068 kB (2.713,9 MiB) lúc 15:10:43Z — 44,17% guard; mean 896.059 kB (875,1 MiB).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 14:40:38–14:48:39Z | #49 | 713.256–2.462.664 kB | T4 attempt1 (14:42:55–14:48:24Z) + O8 T0; đỉnh đầu phiên 14:48:39Z (balloon xả 4.257.784 kB); gate A MỞ 7/9 mẫu; load1 tới 10,21 (sampler) |
| 14:49:40–15:00:40Z | #49 | 636.556–1.481.288 kB | RAM rơi đơn điệu khi balloon leo 4,45M → 6,18M kB; gate A MỞ 8/12 mẫu (mẫu cuối MỞ 14:56:40Z, 1.073.312 kB) |
| 15:01:41–15:04:41Z | #49 | 1.158.704–1.743.044 kB | T4 attempt2 chạy (15:01:44Z–reboot); balloon xả 5,45M → 4,75M kB; gate A MỞ 4/4 mẫu; load1 1,91–5,81 |
| 15:05:42–15:10:43Z | #50 | 1.423.916–2.779.068 kB | Sau reboot #50: RAM hồi, **đỉnh phiên 15:10:43Z** (balloon xả sâu nhất phiên 3.882.840 kB = 60,3% trần); SwapFree nhảy lên 1.040.132 kB (swap xả theo reboot); gate A MỞ 6/6 mẫu; load1 0,28–3,43 |
| 15:11:43–15:31:43Z | #50 | 561.996–2.411.252 kB | RAM rơi khi balloon leo lại 4,20M → 6,38M kB; gate A MỞ 8/20 mẫu (mẫu cuối MỞ 15:26:43Z, 1.148.224 kB — mẫu 15:27:43Z 1.048.424 kB, thiếu gate A đúng 152 kB) |
| 15:32:43–16:30:45Z | #50 | 505.888–848.612 kB | **Ghim trần 46 mẫu trong 4 chuỗi** (xem §2.2); RAM trũng sâu, min phiên 15:32:43Z; **gate A ĐÓNG cả 59 mẫu**; load1 ≤2,13 (yên hoàn toàn về tải — 0 spike B2 trong suốt cửa sổ này, xem §2.5) |
| 16:31:45Z | #50 | 796.968 kB | **Đứt ghim chuỗi 4** (balloon xả về 5.691.644 kB, RAM hồi từ 585.108 kB); gate A ĐÓNG; load1 1,60 |

- **Gate A ≥1024 MiB: 30/112 mẫu** (15/25 boot #49 + 15/87 boot #50); **0 mẫu ≥ guard**; load1 max (sampler) **10,21 lúc 14:45:39Z**; **11/112 mẫu load1 ≥3,0**. **RAM <500 MiB: 4 mẫu** (tính theo <512.000 kB: 505.888 lúc 15:32:43Z; 510.676 / 511.296 / 511.100 lúc 15:48:44–15:50:44Z — RAM trũng nhưng phần lớn chỉ vừa trên 512.000 kB trong lúc ghim, khác đợt 154 với 52/125 mẫu <512.000 kB).
- Swap: SwapFree 615.292 kB (mẫu đầu) → 593.100 kB (mẫu cuối); dao động 575.736–1.040.132 kB — nhảy lên 1.040.132 kB ngay sau reboot #50 (15:05:42Z) rồi tụt dần về ~590–700k kB.
- Đối chiếu T4-155 (poll log, chưa có LIMITS): RAM ≥1024 trên boot #49 chỉ trong cửa sổ attempt (poll #1 14:42:55Z RAM 1.159 MB → attempt1; poll #16 15:01:44Z RAM 1.260 MB → attempt2); sampler T9: gate A MỞ 15/25 mẫu trên #49, mẫu cuối MỞ 15:04:41Z (1.743.044 kB) — khớp T4 mở cửa yên hai lần trên boot cũ. Trên boot #50, T4 ghi gateA-RAM 529 MB lúc hết hạn 16:30Z; sampler T9: mẫu 16:30:45Z mem 585.108 kB (571,4 MiB) — cùng kết luận (RAM sập kéo dài), chênh do pha lấy mẫu ~45 s.
- Mẫu 15:10:43Z (đỉnh phiên): RAM 2.779.068 kB, balloon xả 3.882.840 kB — balloon xả sâu nhất phiên đúng sau reboot #50 (cùng mẫu đợt 152/153/154: xả sâu sau reboot / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.

### 2.2 Balloon virtio — GHIM TRẦN EPISODE MỚI 46/112 mẫu, 4 chuỗi, MỘT boot; 1 EPISODE MỚI

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #49: GHIM TRẦN 0/25 mẫu (0%)** — balloon cao nhất 6.187.468 kB (96,0% trần) lúc 14:41:38Z, chưa chạm trần lần nào.
- **Boot #50 (sau reboot #50): GHIM TRẦN 46/87 mẫu (52,9%), trong 4 chuỗi:**
  - **Chuỗi 1: 15:32:43–15:41:43Z, 10 mẫu** (span 540 s, 9 phút); đứt 15:42:44Z (balloon xả về 6.247.216 kB = 97,0% trần), 15:43:44Z 6.027.696 kB (93,6% trần — điểm xả sâu nhất của break này) rồi leo lại.
  - **Chuỗi 2: 15:47:44–15:57:44Z, 11 mẫu** (span 600 s, 10 phút); đứt 15:58:44Z (balloon xả về 6.050.608 kB = 93,9% trần), 15:59:44Z 6.130.892 kB, leo lại 6.437.172 kB lúc 16:02:44Z (99,9% trần, chưa ghim) rồi ghim lại.
  - **Chuỗi 3: 16:03:44–16:14:44Z, 12 mẫu** (span 660 s, 11 phút); đứt 16:15:44Z (balloon xả về 6.181.680 kB = 95,9% trần), 16:16:45Z 6.292.684 kB, 16:17:45Z 6.393.460 kB (99,2% trần, chưa ghim) rồi ghim lại.
  - **Chuỗi 4: 16:18:45–16:30:45Z, 13 mẫu** (span 720 s, 12 phút); **đứt 16:31:45Z (balloon xả về 5.691.644 kB = 88,3% trần — điểm xả sâu nhất đợt, RAM hồi 796.968 kB)** — quan sát được điểm đứt + xả sâu.
- **Tổng ghim trần đợt này: 46/112 mẫu (41,1%)** (đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **Cả 4 chuỗi đều quan sát được điểm đứt** (khác đợt 154: chuỗi 3 không quan sát được do reboot cắt ngang).
- **Phán theo quy tắc quyết (e) (T9 phán phần liên-đợt, giao T10 xác nhận cách đếm trong đợt):**
  - **Đợt 155 là EPISODE GHIM MỚI, không nối đợt 154:** giữa lần ghim cuối đợt 154 (chạm 13:30:18Z, boot #49, đứt quan sát được 13:31:18Z) và lần chạm đầu đợt 155 (15:32:43Z, boot #50) có **reboot #50 (btime 15:04:07Z) + balloon xả sâu tới 3.882.840 kB (60,3% trần) lúc 15:10:43Z + ~2h01m không ghim** (13:31:18Z → 15:32:43Z) — đủ cả ba điều kiện của quyết (e) (reboot + xả sâu + thời gian không ghim). **Đợt 155 = 1 EPISODE MỚI, chứa 4 chuỗi** (theo cách đếm quyết (g) đợt 152: 1 episode đợt ghim mới, chứa N chuỗi).
  - **Trong đợt 155:** 4 chuỗi (10 + 11 + 12 + 13), cùng boot #50, cách nhau bởi dip NÔNG (97,0% / 93,9% / 95,9% trần — KHÔNG phải xả sâu) — đếm là 1 episode theo quy tắc (g). Không có reboot nào tách các chuỗi trong đợt (reboot #50 xảy ra TRƯỚC chuỗi 1).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~506–848.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 16:31:45Z: tổng RAM 8.124.900 kB − balloon 5.691.644 kB = 2.433.256 kB còn lại; MemAvailable 796.968 kB.

### 2.3 Lượt yên WebKit #24 (T4, đợt 155) — KHÔNG CÓ ATTEMPT HỢP LỆ (theo log poller; T4 chưa xuất bản LIMITS — T10 xác nhận)

- **T4-155 CHƯA xuất bản LIMITS lúc T9 đóng** (không có file `docs/PHASE9_ROUND155_T4_*`, không có cờ `round155-t4.done`) — T9 trích verdict từ log poller `round155-t4/poll-t4.log` + file attempt, không phán thay T4.
- **Poller T4 chạy 4 instance trong phiên, hết hạn cắt 16:30Z:**
  - Instance 1: poll #1 14:42:55Z **mở cửa yên → attempt1 chạy ngay** (RAM 1.159 MB, gate0 T5 PASS); attempt1 chạy xong 14:48:24Z, exit 0, **20/20 NHƯNG VI PHẠM LỚP B — lượt nhiễm tải, KHÔNG dùng verdict** (xem `classb-t4-attempt1-12fc68a3.txt`); ngân sách đã dùng 1/3. Instance 1 chết 14:48:24Z ở retry-wait do POLL_TEST=1 (F-155-T4-1).
  - Instance 2: khởi động lại 14:50:19Z; poll #16 15:01:44Z **mở cửa yên → attempt2 chạy ngay** (RAM 1.260 MB); **reboot #50 giết poller instance 2 + attempt2 giữa chừng** (F-155-T4-2); attempt2 probe **20/20 JSON đầy đủ nhưng chết trước classb/analyzer, KHÔNG có attempt-done → ngân sách VẪN 1/3**.
  - Instance 3: khởi động lại 15:10:21Z (6 poll, 15:10:21–15:14:07Z); dừng tay để vá F-155-T4-3 (curl 000000 → lock stale-boot).
  - Instance 4: khởi động lại 15:15:50Z; poll tới #99, **hết hạn 16:30Z — 0 attempt thêm** (poll cuối #99: gateA-RAM 529 MB < 1024).
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): KHÔNG CÓ attempt hợp lệ nào cho lượt yên #24** — attempt1 nhiễm tải (lớp B), attempt2 chết vì reboot. **Chuỗi lượt yên hợp lệ DỪNG Ở #21** (đợt 153) — KHÔNG CÓ lượt hợp lệ mới #22/#23/#24. Cộng dồn 21 lượt GIỮ NGUYÊN: P1 69/69, P2 60/60, P3-A1 61/69, **P3' 39/41 occurrence = 39/40 distinct-seq**, P7 55/55.
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Gate A RAM: trên boot #49, mẫu cuối MỞ là **15:04:41Z (1.743.044 kB)** — khớp T4 mở cửa yên hai lần (14:42:55Z + 15:01:44Z). Trên boot #50, gate A MỞ 15/87 mẫu, mẫu cuối MỞ **15:26:43Z (1.148.224 kB)**; từ **15:27:43Z tới 16:31:45Z: 0/66 mẫu MỞ** — khớp T4 "hết hạn 16:30Z, gateA-RAM 529 MB" (chênh pha lấy mẫu ~45 s; mẫu T9 16:30:45Z là 585.108 kB = 571,4 MiB).
  - RAM <500 MiB: sampler T9 **4/112 mẫu <512.000 kB**; T4 poll cuối ghi 529 MB — cùng kết luận (RAM sập kéo dài trong lúc ghim), số khác do cadence + đơn vị đếm khác nhau.
  - Tải: sampler load1 max **10,21 lúc 14:45:39Z** (trong lúc T4 attempt1 chạy — nhiễm tải lớp B của attempt1); T4 không ghi load1 đỉnh đợt này trong log poll (chỉ load1 từng poll). Trên boot #50 sau 15:05:42Z, sampler load1 ≤2,13 — corroborate T4 không mở được cửa vì RAM (không phải vì tải): cửa đóng do RAM từ 15:27:43Z trở đi trong khi tải yên.
- T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy 14:42:55–16:30:00Z trên 2 boot (instance 1–4; attempt1 14:42:55–14:48:24Z, attempt2 15:01:44Z–reboot).

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 14:42:39–14:48:39Z | #49 | 1,26–10,21 (7 mẫu) | 853.344–2.462.664 kB — **gate A MỞ 5/7** | T4 attempt1 — tải cao (load1 10,21 là đỉnh phiên) + RAM còn MỞ; attempt1 vi phạm lớp B do nhiễm tải |
| 14:49:40–15:00:40Z | #49 | 0,32–5,75 (12 mẫu) | 636.556–1.481.288 kB — **gate A MỞ 8/12** | Giữa hai attempt; RAM rơi theo balloon leo; T4 chờ gate mở lại |
| 15:01:41–15:04:41Z | #49 | 1,91–5,81 (4 mẫu) | 1.158.704–1.743.044 kB — **gate A MỞ 4/4** | T4 attempt2 chạy; reboot #50 cắt ngang sau mẫu cuối |
| 15:05:42–15:26:43Z | #50 | 0,04–3,43 (22 mẫu) | 561.996–2.779.068 kB — **gate A MỞ 15/22** | Sau reboot #50; RAM hồi rồi rơi; T4 instance 3/4 poll nhưng cửa không mở (gate0 T5 cũ + RAM rơi dần) |
| 15:27:43–16:30:45Z | #50 | 0,02–2,13 (65 mẫu) | 505.888–1.048.424 kB — **gate A MỞ 0/65** | **RAM sập kéo dài, balloon ghim 46 mẫu trong 4 chuỗi** — cửa T4 không mở vì RAM; poller hết hạn 16:30Z |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — 20 spike, 14 QUY ĐƯỢC DRIVER CỤ THỂ + 6 CHỈ QUY ĐƯỢC LỚP "LOAD1 DƯ" (ít nhất từ đợt 152; 0 spike trong ~87 phút giữa phiên)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-155-T9-5). **20 spike, trong 14:44:09–16:32:19Z; 0 spike trong 15:05:42–16:32:19Z (~87 phút — suốt thời gian balloon ghim 4 chuỗi, load1 yên hoàn toàn).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — T4 attempt1 (8 spike) | 14:44:09–14:48:19Z | 3,25–**9,84** | 8 | ffmpeg render delta **69–81** + WebKitWebProcess delta 32–37 + MiniBrowser delta 13–17 (spike 1–3); mask_anim.py delta **100/99** (spike 4–5); mask_anim delta 72 + python round155 delta 69 (spike 6–7, T4 analyzer); daemon delta 11, KHÔNG process nào khác (spike 14:47:09Z) | **T4 attempt1** (14:42:55–14:48:24Z) — cùng họ đợt 154 (ffmpeg render, mask_anim, WebKit); spike 14:47:09Z là lớp load1 dư (dư sau burst mask_anim) |
| 2 — testsrc2 geq + blind81 (6 spike) | 14:52:25–14:55:24Z | 3,00–5,72 | 6 | ffmpeg testsrc2 geq 1280x720 delta **131** (spike 9); testsrc2 geq 1920x1080 delta **121 / 134** (spike 10–11); ffmpeg pixelate geq 116% top + blind81-investigate.py delta 19 + test_v19_pixelate_probe.js delta 5 (spike 12); daemon delta 16–17, KHÔNG process nào khác (spike 13–14) | **Test render pixelate geq (T2/T1)** + **blind81-investigate.py của T2-155**; spike 13–14 lớp load1 dư (load5 3,58/3,43 — dư sau burst geq) |
| 3 — T4 attempt2 (4 spike) | 15:02:29–15:04:16Z | 3,26–5,81 | 4 | WebKitWebProcess delta **75/67** + MiniBrowser delta 40/28 + hole-recheck81.py delta 19/12 (spike 15–16); hole-recheck81.py delta 19–22 + daemon delta 19/13 (spike 17–18) | **T4 attempt2 + hole-recheck81.py (T2)**; spike 17–18 chủ yếu load1 dư (delta tick nhỏ so với load1 5,81 — dư sau burst WebKit, xem dưới) |
| 4 — Bão sau reboot #50 (1 spike) | 15:05:42Z | 3,43 | 1 | daemon delta 3, execd delta 2, KHÔNG process nào khác (load5 chỉ 1,32) | **Dư load1 từ cơn bão sau reboot** (boot storm 95 s đầu boot mới; load1 phản ánh tải tích lũy lúc boot, không process đơn lẻ nào đốt CPU tại snapshot) |
| 5 — Clicktest lúc đóng (1 spike) | 16:32:19Z | 3,35 | 1 | MiniBrowser delta **90** + WebKitWebProcess delta **65** + clicktest-87o8-mask-track-webkit.mjs delta 1 | **O8/clicktest đang chạy lúc T9 đóng** (WebKit + MiniBrowser; T8 là chủ quản) |

- **Tổng kết đếm: 14/20 spike có driver process cụ thể** (cụm 1: 7; cụm 2: 4; cụm 3: 2; cụm 5: 1) **+ 6/20 spike lớp "load1 dư"** (cụm 1: 1; cụm 2: 2; cụm 3: 2; cụm 4: 1 — ghi rõ trong bảng trên, không gộp chung thành "đã quy được nguồn"). Lớp load1 dư có cơ chế chung: load1 là trung bình 1 phút còn dư sau burst trước + tải nền từ nhiều process ngắn hạn (mỗi process chết trước khi đo delta / không lọt top-5 theo %CPU tích lũy) — corroborate bằng load5 của T4 (không bao giờ đủ mở cửa vì RAM, tải yên) và nr_running 1–20 trong các header spike.
- **Caveat đếm (F-155-T9-5):** cmdline chờ của chính T9 (`sleep 3600` wrapper bash) xuất hiện trong **2 dòng** snapshot `ps` của b2-spikes.log ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `grep -c '^=== SPIKE'` = **20**.
- **Fix (n) kiểm chứng trong phiên thật: lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log** — F-150-T9-8 VẪN ĐÓNG.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution (vd spike 12: ffmpeg pixelate geq 116% top dù chết trước delta). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 14 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 14/20 spike; 6 spike còn lại chỉ quy được lớp load1 dư — giới hạn phương pháp đã biết (process ngắn hạn / tải phân tán), T9 ghi rõ thay vì gộp chung.
- **Delta tick lớn nhất đợt: 134 tick/s** (pid 50838, ffmpeg testsrc2 geq 1920x1080, spike 14:53:37Z); testsrc2 geq 121–131 tick/s; mask_anim 99–100 tick/s; WebKitWebProcess 65–75 tick/s; MiniBrowser 90 tick/s (lúc đóng); hole-recheck81 12–22 tick/s; blind81-investigate 8–19 tick/s. (Đợt 154: max 128 tick/s.)
- **testsrc2:** 3/20 spike do testsrc2 geq gây ra (14:52:25Z 1280x720, 14:53:01Z + 14:53:37Z 1920x1080, delta 121–134) + 1 spike pixelate probe geq (14:54:12Z) — cùng họ test render pixelate geq chạy lại mỗi đợt (như đợt 147–154); mọi PID testsrc2 đều ngắn hạn, thoát bình thường; không process nào kẹt lại. Không mở điều tra thêm (họ F-147/148/149-T9-3 đã ĐÓNG đợt 150).

### 2.6 Truy chủ ffmpeg testsrc2 — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này testsrc2 xuất hiện trong 3/20 spike + pixelate probe 1 spike, tất cả đều là **test render pixelate geq trong đợt 155** (T1/T2) — chạy đúng chức năng, thoát bình thường. T9 không truy chủ lại từng PID (không có spike ngoài họ test render + T4 attempt + blind81/hole-recheck81 + bão reboot + clicktest đóng; không process lạ).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN (TRỪ GAP 61 S TẠI REBOOT #50); CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ chín liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148/149/150/151/152/153/154 giữ nguyên; quyết parent (m) đợt 153 GIỮ NGUYÊN cơ chế (a) armed): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **2.779.068 kB = 2.713,9 MiB = 44,17% guard lúc 15:10:43Z** — xa guard 3.512.388 kB. Số đỉnh đợt 155 chờ T1-156 đối chiếu.
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ chín liên tiếp (147, 148, 149, 150, 151, 152, 153, 154, 155).** Cơ chế tự động armed cả phiên (sampler `round155-t9/sampler.sh`, pid 23306 rồi pid 3004 sau reboot #50, chạy 14:40:38–16:31:45Z, 112 mẫu — trừ gap 61 s tại #50, xem §5.1) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→155 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, 2.165, 3.244, 3.964, **3.394**, **3.211**, **2.779**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 14:40:38–16:31:45Z (112 mẫu, chỉ gap 61 s tại reboot #50 rồi khởi động lại bằng tay); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 154 nằm trong dir round154-t9 nên không chặn đợt này (dir mới round155-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-155-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-155-birefnet/out-birefnet-155.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147/148/149/150/151/152/153/154):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-155-T9-3); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-155-T9-2 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l) đợt 146; T10 phán ô nhiễm nếu xảy ra — đợt này T4 có 0 attempt hợp lệ nên điểm (c) không phát sinh). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) TÁI DIỄN đợt này: reboot #50 giết sampler, gap 61 s** (đợt 154: gap 95 s; đợt 153: gap 61 s; đợt 152: gap 71 s; đợt 151: gap 46 s; đợt 149: gap 87 s) — dữ kiện này KHÔNG ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" ở mức tuyệt đối, nhưng gap 61 s là nhỏ và T9 khởi động lại bằng tay kịp thời; T9 chỉ nêu dữ kiện, không đề xuất đổi quyết (q) — giao parent/T10. **Bổ sung đợt 155: T5-155 triển khai watcher respawn theo quyết parent (e) đợt 153 (phương án 1 + quy tắc đứng (3)) — cùng họ vấn đề với sampler T9; T5 là chủ quản, T9 chỉ nêu dữ kiện.**
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Journal trên boot #49 (12fc68a3): 57 dòng "No space left" / ENOSPC** (đếm 14:40Z; đếm lúc mở đợt). Tất cả cùng một thông điệp: `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. **Số cuối trên boot #49 KHÔNG kiểm được sau reboot #50** — journald chỉ giữ 1 boot (volatile), journal boot cũ mất theo reboot (cùng giới hạn đợt 153/154). Từ 13:45Z (đợt 154 đóng ở 16 dòng) tới 14:40Z đã tăng 41 dòng — cadence ~75 s/dòng, khớp đợt 154.
- **Journal trên boot #50 (d849728b): 76 dòng** (15:04:24–16:32:35Z, vẫn tăng lúc đóng — đếm cuối 16:32Z). Cùng thông điệp như trên. Cadence ~52 s/dòng trên boot mới (76 dòng / ~66 phút) — nhanh hơn boot cũ.
- **Tổng phiên: ≥133 dòng trên HAI boot** (57 + 76 — số #49 là cận dưới, đã đếm tới 14:40Z; từ 14:40Z tới reboot 15:04:07Z còn ~24 phút chưa đếm, ước ~19 dòng nữa theo cadence nhưng T9 KHÔNG cộng số ước vào tổng — ghi rõ giới hạn này). **Đây là đợt thứ tư liên tiếp bảng watch cạn gây lỗi thật thấy được trong journal của một phiên T9** (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng — **nhiều nhất chuỗi T9**).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC quan sát được trong phiên: (1) lần dừng có chủ đích của probe K8** (errno 28 ở i=0 ×5 lần — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó, đã kiểm tra thư mục không còn sau mỗi lần đo); **(2) ≥133 dòng lỗi thật của systemd** (xem trên) — cùng nguyên nhân (bảng watch đầy), khác bản chất: (1) là đo có chủ đích, (2) là lỗi vận hành thật của service host.
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 0 — **không thêm được watch nào cho vite mới**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Reboot #50 (giữa phiên, ứng viên số hiệu — T2-155 xác minh 4 nguồn độc lập, chờ LIMITS T2-155 công bố) — sampler/watcher chết theo, khởi động lại bằng tay

- **Boot lúc mở đợt 155 = 12fc68a3-b750-4166-b177-21d2ef7e1dc7** (btime **13:05:12Z** — reboot #49, đã xác nhận; T0-155 đóng 14:57Z ghi "không có #50" — đúng tại lúc T0 đóng, không mâu thuẫn).
- **Reboot #50 GIỮA phiên T9:** sampler cũ (pid 23306) + watcher cũ (pid 23307) chết theo reboot; sleep chờ của T9 bị SIGTERM cùng lúc (~15:04Z, exec service cũng restart cùng lúc). Mẫu cuối sampler cũ: **15:04:41Z boot=12fc68a3 mem=1.743.044 bal=4.746.436 (chưa ghim) load1=3,20**. Boot mới **d849728b** (btime **15:04:07Z** — `uptime -s` 15:04:07 + `/proc/stat` btime 1795187047 KHỚP nhau; journal first entry 15:04:24Z). **Sampler + watcher khởi động lại bằng tay lúc 15:05:42Z** (sampler pid 3004, watcher pid 3005; mẫu đầu boot mới 15:05:42Z mem=1.930.424 bal=4.888.292 swapfree=1.040.132 load1=3,43). **Gap phủ sóng sampler: 61 s** (15:04:41Z → 15:05:42Z). B2 watcher: 0 spike nào bị mất chắc chắn trong gap (gap 61 s, watcher cadence 30 s — tối đa 2–3 lần kiểm bị mất; spike 15:05:42Z bắt được bão sau reboot ngay lần kiểm đầu). Coordinator giữa phiên thông báo **T2-155 đã xác minh 4 nguồn độc lập** cho boot mới d849728b / btime ~15:04:07Z (uptime 17 phút lúc 15:21Z); số hiệu #50 chờ LIMITS T2-155 công bố chính thức. **Mù #81? (#50) giao T2-156** (theo lệ: mù của reboot giữa phiên giao T2 đợt sau).
- **Dấu hiệu đồng hồ tại #50 (ghi rõ cho T1/T2/T7): mẫu cuối boot cũ 15:04:41Z GHI SAU btime boot mới 15:04:07Z tới 34 s** — overlap migration ≥34 s (cùng họ #45: boot cũ còn sống sau btime mới; #49: overlap ~20 s). T0-155 ghi watcher-154 dừng poll cuối 13:05:31Z, 19 s SAU btime #49 — cùng họ. T9 không phán cơ chế đồng hồ — chỉ ghi dữ kiện thô + mốc: sampler cũ chết ~15:04:41–15:05:42Z; journal boot mới first entry 15:04:24Z. T2/T7 đối chiếu khi gộp mốc reboot #50.
- **Tuổi thọ boot #49:** btime 13:05:12Z → btime boot mới 15:04:07Z = **7.135 s = 1h58m55s** (stat→stat). T7/T2 đối chiếu mốc neo khi gộp.
- Không có nghịch lý đồng hồ nào khác trong dữ kiện T9: mọi timestamp còn lại thứ tự nhất quán. T9 không phán tranh chấp clock T1–T2.
- Các cờ .done lúc T9 đóng (~16:36Z): t0, t1, t2, t5, t6 (5/9 — T4, T7, T8 còn chạy; T9 đóng ngay sau khi viết LIMITS này).

### 5.2 T5-155 — POSTBOOT_PASS cho #49 CÓ; boot #50 KHÔNG CÓ cờ T5 mới (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- **POSTBOOT_PASS cho boot #49 CÓ (T5-155, 14:42:38Z — T0-155 xác minh: replay đầy đủ, dpkg 1545, cache 178, lists 37, GST 269, đủ 11 gói apt + isomp4/libav)** — T4-155 §poll ghi gate0=T5 từ poll #1 (14:42:55Z). **Boot #50 KHÔNG CÓ cờ T5 mới** (T5-155 đã đóng trước #50; T4-155 ghi "cờ T5-155 là của boot cũ (mtime < btime) → gate0 dự phòng T4-check-only cho đến khi replay/cờ mới" — quyết (j) đợt 143).
- **Watcher respawn:** T5-155 triển khai theo quyết parent (e) đợt 153 (phương án 1 user systemd unit + quy tắc đứng (3)) — T0-155 xác minh watcher-155 pid 26066 chạy tay ~14:42Z sau khi watcher-154 chết lúc mở. Sampler T9 vẫn khởi động lại bằng tay sau reboot (gap 61 s đợt này) — cùng họ vấn đề, chưa có cơ chế tự hồi phục cho sampler.

### 5.3 Reboot #49 (trước phiên) — T2-154 xác nhận (T9 chỉ ghi lại để đối chiếu)

- T2-154: boot lúc mở đợt là **12fc68a3 (btime 13:05:12Z), reboot #49 ĐÃ XÁC NHẬN theo đếm chặt**. Mù #78? (#46) + #79? (#47) + #80? (#48): **ĐÓNG THEO LUẬT GAP**; gap #46 **[5.529, 5.533] s**, gap #47 **[7.309, 7.313] s**, gap #48 **[1.163, 1.167] s** — ứng viên có điều kiện (chuỗi phụ thuộc: cần #74?–#77? đóng trước). CERT/FULL chính thức GIỮ 73/88 (ứng viên CERT78/FULL93 + CERT79/FULL94 + CERT80/FULL95). Chuỗi mù đóng hoàn toàn liên tục GIỮ 9. **Mù #81? (#50) giao T2-156.** T9 chỉ ghi lại; T2 là chủ quản.

## 6. Sai số của chính T9 (ghi rõ)

- **F-155-T9-1 — Headroom 0 → 0: GIỮ MỨC 0 CẢ PHIÊN, dưới ngưỡng lần thứ mười lăm liên tiếp, tỉ lệ/vite 0 cả hai đầu, đợt thứ tư liên tiếp đóng ở 0.** Không phải sai số đo (2 lần đo mở chênh 0, 3 lần đo đóng đều 0; phương pháp không đổi từ đợt 109; journal có ≥133 dòng ENOSPC thật trên 2 boot corroborate độc lập). Ghi rõ: quyết "chỉ theo dõi" (g) đợt 151 + quyết (h) đợt 153 vẫn đứng; T9 không tự đổi ngưỡng hay yêu cầu user hành động — nhưng dữ kiện mới (0 cả phiên lần thứ ba liên tiếp + ≥133 dòng lỗi ENOSPC thật, đợt thứ tư liên tiếp, nhiều nhất chuỗi T9) giao parent/T10 xem lại quyết (g). Trần 63.747 không đổi trong phiên. T5-155 không probe lại headroom nên không có số đối chiếu độc lập đợt này.
- **F-155-T9-2 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ chín liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-155-T9-3 — Khoảng trống lấy mẫu 60 giây (cùng lớp F-148/F-149/F-150/F-151/F-152/F-153/F-154-T9-3):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Cơ chế tự động chỉ kích hoạt trên mẫu quan sát được — đây là giới hạn thiết kế đã biết, không phải lỗi vận hành. Thêm: **gap 61 s tại reboot #50** là khoảng trống thứ hai (không mẫu nào trong 15:04:41–15:05:42Z) — một lần vượt guard trong gap đó cũng không được quan sát (khả năng thấp: RAM lúc 15:04:41Z là 1.743.044 kB và lúc 15:05:42Z là 1.930.424 kB, đều xa guard).
- **F-155-T9-4 — Script thống kê `stats-appendix.py` (copy từ đợt 154) ghi SAI đường dẫn file gốc trong tiêu đề phụ lục ("hidden_files/round154-t9/ram-sampler.log"):** T9 phát hiện trước khi đóng — mọi số trong LIMITS này đều từ script chạy trên log ĐÃ ĐÓNG BĂNG `round155-t9/ram-sampler.log` (112 mẫu), và phụ lục A dưới đây ghi đúng đường dẫn file gốc đợt 155. Chuỗi ghim đã kiểm chứng thủ công từ bảng phụ lục (dòng 53–62, 68–78, 84–95, 99–111 = 10+11+12+13 = 46). **T9-156 phải sửa tiêu đề script thành đường dẫn động theo argv trước khi chạy.**
- **F-155-T9-5 — Cmdline chờ của chính T9 lọt snapshot B2 (cùng họ F-154-T9-5), BẮT ĐƯỢC VÀ GHI RÕ TRƯỚC KHI ĐÓNG (không ảnh hưởng số cuối):** wrapper bash `sleep 3600` của T9 xuất hiện trong **2 dòng** snapshot `ps` của b2-spikes.log ở **0,0% CPU**; **0 dòng delta-tick nào nhắc tới sleep** — attribution dùng delta tick + top tức thời nên không bị che. Đếm spike dùng neo đầu dòng `^=== SPIKE` = **20** ngay từ đầu. **Fix (n) (loại `ps` của watcher) vẫn đứng:** lệnh `ps` của chính watcher xuất hiện 0 lần trong b2-spikes.log. T9 đợt sau nên tránh để lệnh chờ chứa chuỗi trùng mẫu đếm và tránh sleep dài trong lúc watcher chạy (dùng cron/scheduler chờ thay cho sleep nếu có thể).
- **F-155-T9-6 — Reboot #50 giết sampler/watcher (gap 61 s) + sleep chờ của T9 bị SIGTERM:** xem §5.1. Gap nhỏ hơn đợt 154 (95 s) vì T9 phát hiện qua SIGTERM và khởi động lại ngay (~35 s sau khi sleep bị giết); dữ kiện này để parent/T10 xem lại quyết (q) "không cần cơ chế tự hồi phục lúc này" — T9 không đề xuất đổi. **Balloon trên boot cũ KHÔNG ghim trước reboot** (max 96,0% trần) — không có chuỗi ghim nào bị cắt; chuỗi ghim đầu tiên của đợt bắt đầu 15:32:43Z, 27 phút SAU reboot.
- **F-155-T9-7 — T4-155 chưa xuất bản LIMITS lúc T9 đóng:** mọi verdict lượt yên #24 trong LIMITS này (§2.3) đều trích từ log poller + file attempt của T4, chưa có xác nhận bằng LIMITS T4. T9 ghi rõ nguồn và giao T10 xác nhận; nếu LIMITS T4-155 công bố khác (vd attempt1 được tính lại), số cuối lượt yên do T10 phán.

## Phụ lục A — Bảng sampler đầy đủ (112 mẫu: 25 mẫu boot 12fc68a3 + 87 mẫu boot d849728b; không gap >90 s)

(File gốc: `hidden_files/round155-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó, do script `stats-appendix.py` sinh ra; chỉ sửa tiêu đề đường dẫn file gốc theo F-155-T9-4.)

Thống kê: samples: 112 (25 mẫu boot 12fc68a3 + 87 mẫu boot d849728b); mem min: 505.888 kB (494,0 MiB) lúc 15:32:43Z; mem max: 2.779.068 kB (2.713,9 MiB = 44,17% guard) lúc 15:10:43Z; mem mean: 896.059 kB (875,1 MiB); count >=1024 MiB (gate A): 30/112; count >= guard 6144 MiB: 0/112; balloon frozen 6.443.824: 46/112 (chuỗi 1: 15:32:43Z–15:41:43Z n=10; chuỗi 2: 15:47:44Z–15:57:44Z n=11; chuỗi 3: 16:03:44Z–16:14:44Z n=12; chuỗi 4: 16:18:45Z–16:30:45Z n=13); balloon min: 3.882.840 kB lúc 15:10:43Z; balloon max: 6.443.824 kB; load1 max (sampler): 10,21 lúc 14:45:39Z; load1 >=3,0 samples: 11/112; max inter-sample gap: 61 s (15:04:41Z -> 15:05:42Z, 12fc68a3 -> d849728b); gaps >90s: không có.

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-20T14:40:38Z | 12fc68a3 | 758.588 | 740,8 | 12,06% | 6.085.344 | 615.292 | 0,98 |
| 2 | 2026-11-20T14:41:38Z | 12fc68a3 | 713.256 | 696,5 | 11,34% | 6.187.468 | 612.864 | 1,27 |
| 3 | 2026-11-20T14:42:39Z | 12fc68a3 | 853.344 | 833,3 | 13,56% | 5.631.380 | 580.852 | 1,26 |
| 4 | 2026-11-20T14:43:39Z | 12fc68a3 | 850.512 | 830,6 | 13,52% | 5.206.004 | 575.736 | 0,88 |
| 5 | 2026-11-20T14:44:39Z | 12fc68a3 | 690.500 | 674,3 | 10,98% | 5.311.640 | 576.536 | 7,36 |
| 6 | 2026-11-20T14:45:39Z | 12fc68a3 | 742.520 | 725,1 | 11,80% | 5.413.484 | 579.208 | 10,21 |
| 7 | 2026-11-20T14:46:39Z | 12fc68a3 | 1.057.380 | 1.032,6 | 16,81% | 5.546.080 | 583.460 | 4,95 |
| 8 | 2026-11-20T14:47:39Z | 12fc68a3 | 1.413.988 | 1.380,8 | 22,47% | 5.371.896 | 589.620 | 4,06 |
| 9 | 2026-11-20T14:48:39Z | 12fc68a3 | 2.462.664 | 2.404,9 | 39,14% | 4.257.784 | 602.116 | 2,26 |
| 10 | 2026-11-20T14:49:40Z | 12fc68a3 | 1.468.200 | 1.433,8 | 23,34% | 4.453.448 | 621.076 | 1,06 |
| 11 | 2026-11-20T14:50:40Z | 12fc68a3 | 1.415.456 | 1.382,3 | 22,50% | 4.649.408 | 621.212 | 0,76 |
| 12 | 2026-11-20T14:51:40Z | 12fc68a3 | 1.085.800 | 1.060,4 | 17,26% | 4.803.292 | 621.668 | 0,44 |
| 13 | 2026-11-20T14:52:40Z | 12fc68a3 | 1.481.288 | 1.446,6 | 23,54% | 5.014.576 | 620.172 | 4,30 |
| 14 | 2026-11-20T14:53:40Z | 12fc68a3 | 1.248.084 | 1.218,8 | 19,84% | 5.197.780 | 610.996 | 5,75 |
| 15 | 2026-11-20T14:54:40Z | 12fc68a3 | 1.471.256 | 1.436,8 | 23,38% | 5.363.536 | 622.612 | 4,56 |
| 16 | 2026-11-20T14:55:40Z | 12fc68a3 | 1.260.996 | 1.231,4 | 20,04% | 5.531.396 | 626.984 | 2,54 |
| 17 | 2026-11-20T14:56:40Z | 12fc68a3 | 1.073.312 | 1.048,2 | 17,06% | 5.688.460 | 627.960 | 1,26 |
| 18 | 2026-11-20T14:57:40Z | 12fc68a3 | 931.588 | 909,8 | 14,81% | 5.829.344 | 628.432 | 0,73 |
| 19 | 2026-11-20T14:58:40Z | 12fc68a3 | 852.772 | 832,8 | 13,55% | 5.955.900 | 626.392 | 0,57 |
| 20 | 2026-11-20T14:59:40Z | 12fc68a3 | 733.924 | 716,7 | 11,67% | 6.073.620 | 624.912 | 0,32 |
| 21 | 2026-11-20T15:00:40Z | 12fc68a3 | 636.556 | 621,6 | 10,12% | 6.178.252 | 612.756 | 0,52 |
| 22 | 2026-11-20T15:01:41Z | 12fc68a3 | 1.302.460 | 1.271,9 | 20,70% | 5.452.860 | 590.316 | 1,91 |
| 23 | 2026-11-20T15:02:41Z | 12fc68a3 | 1.158.704 | 1.131,5 | 18,42% | 4.912.348 | 581.464 | 3,72 |
| 24 | 2026-11-20T15:03:41Z | 12fc68a3 | 1.562.656 | 1.526,0 | 24,84% | 4.817.764 | 583.940 | 5,81 |
| 25 | 2026-11-20T15:04:41Z | 12fc68a3 | 1.743.044 | 1.702,2 | 27,70% | 4.746.436 | 643.820 | 3,20 |
| — | — | — | — | — | — | — | — | — |
| 26 | 2026-11-20T15:05:42Z | d849728b | 1.930.424 | 1.885,2 | 30,68% | 4.888.292 | 1.040.132 | 3,43 |
| 27 | 2026-11-20T15:06:42Z | d849728b | 1.804.900 | 1.762,6 | 28,69% | 5.037.884 | 1.020.356 | 1,42 |
| 28 | 2026-11-20T15:07:42Z | d849728b | 1.600.660 | 1.563,1 | 25,44% | 5.238.460 | 1.013.116 | 0,76 |
| 29 | 2026-11-20T15:08:43Z | d849728b | 1.423.916 | 1.390,5 | 22,63% | 5.425.076 | 1.004.672 | 0,28 |
| 30 | 2026-11-20T15:09:43Z | d849728b | 1.624.904 | 1.586,8 | 25,83% | 4.558.420 | 887.560 | 0,53 |
| 31 | 2026-11-20T15:10:43Z | d849728b | 2.779.068 | 2.713,9 | 44,17% | 3.882.840 | 888.192 | 1,19 |
| 32 | 2026-11-20T15:11:43Z | d849728b | 2.411.252 | 2.354,7 | 38,33% | 4.195.048 | 888.664 | 0,56 |
| 33 | 2026-11-20T15:12:43Z | d849728b | 2.201.576 | 2.150,0 | 34,99% | 4.478.512 | 888.816 | 0,34 |
| 34 | 2026-11-20T15:13:43Z | d849728b | 1.948.920 | 1.903,2 | 30,98% | 4.736.852 | 888.900 | 0,12 |
| 35 | 2026-11-20T15:14:43Z | d849728b | 1.703.320 | 1.663,4 | 27,07% | 4.971.536 | 888.992 | 0,04 |
| 36 | 2026-11-20T15:15:43Z | d849728b | 1.469.128 | 1.434,7 | 23,35% | 5.182.464 | 889.492 | 0,37 |
| 37 | 2026-11-20T15:16:43Z | d849728b | 1.519.304 | 1.483,7 | 24,15% | 5.374.428 | 889.532 | 0,26 |
| 38 | 2026-11-20T15:17:43Z | d849728b | 1.388.440 | 1.355,9 | 22,07% | 5.508.792 | 873.580 | 0,26 |
| 39 | 2026-11-20T15:18:43Z | d849728b | 1.247.944 | 1.218,7 | 19,84% | 5.675.028 | 845.168 | 0,42 |
| 40 | 2026-11-20T15:19:43Z | d849728b | 1.008.896 | 985,2 | 16,04% | 5.825.128 | 799.868 | 0,63 |
| 41 | 2026-11-20T15:20:43Z | d849728b | 957.864 | 935,4 | 15,22% | 5.960.344 | 796.340 | 0,42 |
| 42 | 2026-11-20T15:21:43Z | d849728b | 846.664 | 826,8 | 13,46% | 6.085.092 | 764.144 | 0,33 |
| 43 | 2026-11-20T15:22:43Z | d849728b | 719.244 | 702,4 | 11,43% | 6.195.164 | 756.052 | 0,63 |
| 44 | 2026-11-20T15:23:43Z | d849728b | 734.256 | 717,0 | 11,67% | 6.198.960 | 742.832 | 0,76 |
| 45 | 2026-11-20T15:24:43Z | d849728b | 619.460 | 604,9 | 9,85% | 6.298.712 | 740.136 | 0,39 |
| 46 | 2026-11-20T15:25:43Z | d849728b | 561.996 | 548,8 | 8,93% | 6.385.588 | 724.348 | 0,88 |
| 47 | 2026-11-20T15:26:43Z | d849728b | 1.148.224 | 1.121,3 | 18,25% | 5.836.084 | 689.772 | 2,13 |
| 48 | 2026-11-20T15:27:43Z | d849728b | 1.048.424 | 1.023,9 | 16,66% | 5.929.736 | 690.068 | 0,85 |
| 49 | 2026-11-20T15:28:43Z | d849728b | 884.640 | 863,9 | 14,06% | 6.058.732 | 690.816 | 0,41 |
| 50 | 2026-11-20T15:29:43Z | d849728b | 812.824 | 793,8 | 12,92% | 6.176.492 | 690.664 | 0,37 |
| 51 | 2026-11-20T15:30:43Z | d849728b | 744.880 | 727,4 | 11,84% | 6.284.812 | 680.068 | 0,33 |
| 52 | 2026-11-20T15:31:43Z | d849728b | 602.040 | 587,9 | 9,57% | 6.381.980 | 677.284 | 0,41 |
| 53 | 2026-11-20T15:32:43Z | d849728b | 505.888 | 494,0 | 8,04% | 6.443.824 | 679.292 | 0,26 |
| 54 | 2026-11-20T15:33:43Z | d849728b | 548.284 | 535,4 | 8,71% | 6.443.824 | 677.872 | 0,09 |
| 55 | 2026-11-20T15:34:43Z | d849728b | 542.772 | 530,1 | 8,63% | 6.443.824 | 681.236 | 0,20 |
| 56 | 2026-11-20T15:35:43Z | d849728b | 526.524 | 514,2 | 8,37% | 6.443.824 | 686.144 | 0,23 |
| 57 | 2026-11-20T15:36:43Z | d849728b | 544.956 | 532,2 | 8,66% | 6.443.824 | 688.208 | 0,35 |
| 58 | 2026-11-20T15:37:43Z | d849728b | 546.396 | 533,6 | 8,68% | 6.443.824 | 689.492 | 0,41 |
| 59 | 2026-11-20T15:38:43Z | d849728b | 540.964 | 528,3 | 8,60% | 6.443.824 | 690.436 | 0,15 |
| 60 | 2026-11-20T15:39:43Z | d849728b | 515.000 | 502,9 | 8,19% | 6.443.824 | 690.568 | 0,26 |
| 61 | 2026-11-20T15:40:43Z | d849728b | 528.820 | 516,4 | 8,41% | 6.443.824 | 694.764 | 0,44 |
| 62 | 2026-11-20T15:41:43Z | d849728b | 518.144 | 506,0 | 8,24% | 6.443.824 | 694.836 | 0,16 |
| 63 | 2026-11-20T15:42:44Z | d849728b | 704.148 | 687,6 | 11,19% | 6.247.216 | 688.672 | 0,92 |
| 64 | 2026-11-20T15:43:44Z | d849728b | 909.176 | 887,9 | 14,45% | 6.027.696 | 687.568 | 0,46 |
| 65 | 2026-11-20T15:44:44Z | d849728b | 807.376 | 788,5 | 12,83% | 6.145.828 | 690.932 | 0,51 |
| 66 | 2026-11-20T15:45:44Z | d849728b | 643.752 | 628,7 | 10,23% | 6.257.060 | 686.964 | 0,22 |
| 67 | 2026-11-20T15:46:44Z | d849728b | 625.732 | 611,1 | 9,95% | 6.355.696 | 687.428 | 0,21 |
| 68 | 2026-11-20T15:47:44Z | d849728b | 537.940 | 525,3 | 8,55% | 6.443.824 | 688.068 | 0,08 |
| 69 | 2026-11-20T15:48:44Z | d849728b | 510.676 | 498,7 | 8,12% | 6.443.824 | 685.648 | 0,08 |
| 70 | 2026-11-20T15:49:44Z | d849728b | 511.296 | 499,3 | 8,13% | 6.443.824 | 685.744 | 0,15 |
| 71 | 2026-11-20T15:50:44Z | d849728b | 511.100 | 499,1 | 8,12% | 6.443.824 | 680.632 | 0,14 |
| 72 | 2026-11-20T15:51:44Z | d849728b | 527.172 | 514,8 | 8,38% | 6.443.824 | 680.600 | 0,08 |
| 73 | 2026-11-20T15:52:44Z | d849728b | 540.208 | 527,5 | 8,59% | 6.443.824 | 679.992 | 0,18 |
| 74 | 2026-11-20T15:53:44Z | d849728b | 525.956 | 513,6 | 8,36% | 6.443.824 | 680.044 | 0,16 |
| 75 | 2026-11-20T15:54:44Z | d849728b | 529.668 | 517,3 | 8,42% | 6.443.824 | 677.812 | 0,19 |
| 76 | 2026-11-20T15:55:44Z | d849728b | 515.224 | 503,1 | 8,19% | 6.443.824 | 678.064 | 0,15 |
| 77 | 2026-11-20T15:56:44Z | d849728b | 537.016 | 524,4 | 8,54% | 6.443.824 | 676.664 | 0,09 |
| 78 | 2026-11-20T15:57:44Z | d849728b | 532.468 | 520,0 | 8,46% | 6.443.824 | 676.312 | 0,03 |
| 79 | 2026-11-20T15:58:44Z | d849728b | 808.648 | 789,7 | 12,85% | 6.050.608 | 657.376 | 0,73 |
| 80 | 2026-11-20T15:59:44Z | d849728b | 860.660 | 840,5 | 13,68% | 6.130.892 | 658.152 | 0,40 |
| 81 | 2026-11-20T16:00:44Z | d849728b | 718.084 | 701,3 | 11,41% | 6.243.284 | 657.892 | 0,29 |
| 82 | 2026-11-20T16:01:44Z | d849728b | 663.732 | 648,2 | 10,55% | 6.344.868 | 657.188 | 0,38 |
| 83 | 2026-11-20T16:02:44Z | d849728b | 549.848 | 537,0 | 8,74% | 6.437.172 | 656.044 | 0,35 |
| 84 | 2026-11-20T16:03:44Z | d849728b | 539.008 | 526,4 | 8,57% | 6.443.824 | 654.264 | 0,16 |
| 85 | 2026-11-20T16:04:44Z | d849728b | 536.004 | 523,4 | 8,52% | 6.443.824 | 657.752 | 0,23 |
| 86 | 2026-11-20T16:05:44Z | d849728b | 611.736 | 597,4 | 9,72% | 6.443.824 | 764.396 | 0,19 |
| 87 | 2026-11-20T16:06:44Z | d849728b | 593.292 | 579,4 | 9,43% | 6.443.824 | 767.096 | 0,10 |
| 88 | 2026-11-20T16:07:44Z | d849728b | 581.248 | 567,6 | 9,24% | 6.443.824 | 767.948 | 0,07 |
| 89 | 2026-11-20T16:08:44Z | d849728b | 569.600 | 556,2 | 9,05% | 6.443.824 | 767.940 | 0,02 |
| 90 | 2026-11-20T16:09:44Z | d849728b | 552.320 | 539,4 | 8,78% | 6.443.824 | 769.564 | 0,10 |
| 91 | 2026-11-20T16:10:44Z | d849728b | 541.832 | 529,1 | 8,61% | 6.443.824 | 769.592 | 0,22 |
| 92 | 2026-11-20T16:11:44Z | d849728b | 543.372 | 530,6 | 8,64% | 6.443.824 | 769.780 | 0,21 |
| 93 | 2026-11-20T16:12:44Z | d849728b | 547.076 | 534,3 | 8,70% | 6.443.824 | 769.812 | 0,13 |
| 94 | 2026-11-20T16:13:44Z | d849728b | 548.968 | 536,1 | 8,73% | 6.443.824 | 768.412 | 0,05 |
| 95 | 2026-11-20T16:14:44Z | d849728b | 609.720 | 595,4 | 9,69% | 6.443.824 | 750.972 | 0,79 |
| 96 | 2026-11-20T16:15:44Z | d849728b | 848.612 | 828,7 | 13,49% | 6.181.680 | 700.484 | 0,81 |
| 97 | 2026-11-20T16:16:45Z | d849728b | 763.748 | 745,8 | 12,14% | 6.292.684 | 700.084 | 0,63 |
| 98 | 2026-11-20T16:17:45Z | d849728b | 646.972 | 631,8 | 10,28% | 6.393.460 | 696.620 | 0,32 |
| 99 | 2026-11-20T16:18:45Z | d849728b | 587.196 | 573,4 | 9,33% | 6.443.824 | 692.684 | 0,12 |
| 100 | 2026-11-20T16:19:45Z | d849728b | 586.484 | 572,7 | 9,32% | 6.443.824 | 692.752 | 0,04 |
| 101 | 2026-11-20T16:20:45Z | d849728b | 571.160 | 557,8 | 9,08% | 6.443.824 | 693.148 | 0,26 |
| 102 | 2026-11-20T16:21:45Z | d849728b | 571.528 | 558,1 | 9,08% | 6.443.824 | 693.732 | 0,17 |
| 103 | 2026-11-20T16:22:45Z | d849728b | 573.484 | 560,0 | 9,12% | 6.443.824 | 693.332 | 0,13 |
| 104 | 2026-11-20T16:23:45Z | d849728b | 582.228 | 568,6 | 9,25% | 6.443.824 | 694.832 | 0,22 |
| 105 | 2026-11-20T16:24:45Z | d849728b | 570.348 | 557,0 | 9,07% | 6.443.824 | 690.844 | 0,12 |
| 106 | 2026-11-20T16:25:45Z | d849728b | 577.740 | 564,2 | 9,18% | 6.443.824 | 691.616 | 0,13 |
| 107 | 2026-11-20T16:26:45Z | d849728b | 570.168 | 556,8 | 9,06% | 6.443.824 | 692.288 | 0,08 |
| 108 | 2026-11-20T16:27:45Z | d849728b | 569.988 | 556,6 | 9,06% | 6.443.824 | 692.340 | 0,03 |
| 109 | 2026-11-20T16:28:45Z | d849728b | 540.928 | 528,2 | 8,60% | 6.443.824 | 696.284 | 0,08 |
| 110 | 2026-11-20T16:29:45Z | d849728b | 542.088 | 529,4 | 8,62% | 6.443.824 | 696.500 | 0,03 |
| 111 | 2026-11-20T16:30:45Z | d849728b | 585.108 | 571,4 | 9,30% | 6.443.824 | 692.284 | 0,41 |
| 112 | 2026-11-20T16:31:45Z | d849728b | 796.968 | 778,3 | 12,67% | 5.691.644 | 593.100 | 1,60 |
